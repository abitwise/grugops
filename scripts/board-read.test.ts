// board-read.test.ts — the read seam's FAILURE MODES, driven rather than described (plan 32-03).
//
// WHAT THIS FILE IS. `scripts/board-tracer.test.ts` proves the happy path end to end: the real kit
// board, through the grammar, through the seam, out of the CLI. This file proves the other half —
// the four ways a read can fail (D-11's `STALE_REASONS`), the carry-forward that keeps the last good
// value when one of them happens (D-11), the per-source badge that stops one unreadable source from
// hiding a fresh board (D-12), and the distinction between a source that is ABSENT and a source that
// is BROKEN (D-13).
//
// WHY EVERY CASE DRIVES A REAL TEMPORARY TREE. The states under test are filesystem states: a file
// whose bytes change between two stats, a file unlinked between two reads, a file whose mode denies
// the open, a directory above the walk bound. A mocked `node:fs` would prove that the module calls
// the functions the mock was written against, which is a statement about the mock.
//
// EVERY PREMISE THIS FILE RESTS ON IS A FAILING ASSERTION, NOT AN ASSUMPTION. This repository has
// recorded a FALSE verification-harness premise six times across four rounds (project memory,
// Phase 31): a fixture that never reached the state its case is about produces a finding about
// nothing. So each failure-mode case first asserts that the fixture REACHED the state — the read was
// actually retried to exhaustion, the file was actually removed, the mode actually denies the open —
// and a `PREMISE:` message in the output means this file measured nothing.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import {
  appendFileSync,
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  READ_RETRY_BOUND,
  STALE_REASONS,
  STALE_REASON_COUNT,
  readSnapshot,
  readVerifyReread,
  settleSource,
} from "./board-read.js";
import type { SnapshotResult, SourceState } from "./board-read.js";

const ROOT = join(import.meta.dirname, "..");

/** A scratch tree that is always removed, whatever the case does with it. */
function withTempTree(run: (dir: string) => void): void {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), "grugops-board-read-"));
  try {
    run(dir);
  } finally {
    // The EACCES case chmods a file to 0; restore the mode so the removal cannot fail on it.
    try {
      chmodSync(join(dir, "plans", "board.md"), 0o644);
    } catch {
      /* the file may not exist in this case — removal below is force:true either way */
    }
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Write `plans/board.md` under `dir` and return its absolute path. */
function plantBoard(dir: string, body: string): string {
  mkdirSync(join(dir, "plans"), { recursive: true });
  const path = join(dir, "plans", "board.md");
  writeFileSync(path, body, "utf8");
  return path;
}

const ONE_COLUMN = "## Backlog (WIP unlimited)\n- [ABC-014] Asset allocation chart\n";
const TWO_COLUMNS = `${ONE_COLUMN}## Done (WIP unlimited)\n- [ABC-001] Shipped\n`;

/** Running as root defeats a mode-0 file: the open succeeds and the case measures nothing. */
const IS_ROOT = typeof process.getuid === "function" && process.getuid() === 0;

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TASK 1 — READ-VERIFY-REREAD, PER-SOURCE STALENESS, AND THE LAST-GOOD CARRY-FORWARD.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — the stale-reason set is closed and pinned two-sided (D-11)", () => {
  it("pins the stale-reason count two-sided against the derived set", () => {
    expect(STALE_REASON_COUNT).toBe(STALE_REASONS.length);
  });

  it("pins the stale-reason count at five", () => {
    expect(
      STALE_REASONS.length,
      "a sixth way for a source to go stale is a DECISION recorded in the phase context and in " +
        "agent-factory/contracts/board.md, never a bumped constant: each reason is a distinct " +
        "sentence the D-12 badge says to a human about why the value on screen is old",
    ).toBe(5);
  });

  it("names every stale reason exactly once", () => {
    expect([...STALE_REASONS]).toEqual(["enoent", "eacces", "torn", "bounded", "unreadable"]);
    expect(new Set(STALE_REASONS).size).toBe(STALE_REASONS.length);
  });
});

describe("readVerifyReread — stat, read, stat (D-11, DASH-05)", () => {
  it("returns the bytes when both stats agree", () => {
    withTempTree((dir) => {
      const path = plantBoard(dir, ONE_COLUMN);
      const read = readVerifyReread(path);
      expect(read.ok).toBe(true);
      expect(read.ok === true ? read.text : "").toBe(ONE_COLUMN);
    });
  });

  it("reports `torn` after the retry bound when the file changes under every read", () => {
    withTempTree((dir) => {
      const path = plantBoard(dir, ONE_COLUMN);
      let attempts = 0;
      // The seam fires AFTER the bytes are read and BEFORE the second stat, which is exactly the
      // window an editor's save lands in. Growing the file makes the second stat disagree with both
      // the first stat and the bytes in hand, on every attempt, so the retry bound is exhausted.
      const read = readVerifyReread(path, READ_RETRY_BOUND, {
        betweenReadAndStat: () => {
          attempts += 1;
          appendFileSync(path, `- [ABC-${attempts}] written under the read\n`, "utf8");
        },
      });

      expect(
        attempts,
        "PREMISE: the seam never fired, so no read was torn and this case measured nothing",
      ).toBe(READ_RETRY_BOUND);
      expect(read.ok).toBe(false);
      expect(read.ok === false ? read.reason : "").toBe("torn");
    });
  });

  it("retries a TRANSIENT tear and returns the bytes rather than giving up on the first", () => {
    withTempTree((dir) => {
      const path = plantBoard(dir, ONE_COLUMN);
      let attempts = 0;
      const read = readVerifyReread(path, READ_RETRY_BOUND, {
        betweenReadAndStat: () => {
          attempts += 1;
          if (attempts === 1) appendFileSync(path, "- [ABC-999] one transient write\n", "utf8");
        },
      });

      expect(
        attempts,
        "PREMISE: the read succeeded on the first attempt, so the retry path never executed",
      ).toBeGreaterThan(1);
      expect(read.ok).toBe(true);
    });
  });

  it("reports `enoent` for a path that is not there, without retrying", () => {
    withTempTree((dir) => {
      let attempts = 0;
      const read = readVerifyReread(join(dir, "plans", "board.md"), READ_RETRY_BOUND, {
        betweenReadAndStat: () => {
          attempts += 1;
        },
      });
      expect(read.ok).toBe(false);
      expect(read.ok === false ? read.reason : "").toBe("enoent");
      expect(
        attempts,
        "an absent path is answered on the first stat — retrying it three times buys nothing and " +
          "costs the screen three stats per source per re-read",
      ).toBe(0);
    });
  });

  it.skipIf(IS_ROOT)("reports `eacces` for a file whose mode denies the open", () => {
    withTempTree((dir) => {
      const path = plantBoard(dir, ONE_COLUMN);
      chmodSync(path, 0o000);
      let denied = false;
      try {
        readFileSync(path, "utf8");
      } catch {
        denied = true;
      }
      expect(
        denied,
        "PREMISE: the mode-0 file was still readable, so this case measured a successful read " +
          "rather than a denied one",
      ).toBe(true);

      const read = readVerifyReread(path);
      expect(read.ok).toBe(false);
      expect(read.ok === false ? read.reason : "").toBe("eacces");
    });
  });

  it("keeps BOTH halves of the agreement test — the SIZE comparison is never dropped", () => {
    // A STRUCTURAL ASSERTION, AND THE REASON IS MEASURED. RESEARCH §Read-verify-reread recorded
    // `mtimeMs` at sub-millisecond resolution on APFS, which is the only filesystem this suite can
    // run on here. The case the size half defends against — a filesystem with one-second mtime
    // granularity reporting EQUAL mtimes across a same-second rewrite — cannot be constructed on
    // APFS at all. So the guard against silently dropping it is that the comparison is present in
    // the source, asserted by name rather than hoped for.
    const src = readFileSync(join(ROOT, "scripts", "board-read.ts"), "utf8");
    const body = src.slice(src.indexOf("export function readVerifyReread"));
    const fn = body.slice(0, body.indexOf("\n}\n") + 3);
    expect(
      fn,
      "PREMISE: `readVerifyReread` was not found in the source, so nothing below was inspected",
    ).toContain("readVerifyReread");
    expect(fn).toContain("Buffer.byteLength");
    expect(fn).toContain("mtimeMs");
  });
});

describe("settleSource — the last-good carry-forward, per source (D-11, D-12, D-13)", () => {
  const AT_FIRST = "2026-09-14T09:00:00.000Z";
  const AT_NOW = "2026-09-14T09:00:10.000Z";
  const good: SourceState<string> = { source: "ok", value: "the last good value", readAt: AT_FIRST };

  it("reports `ok` and the new value when the read succeeded", () => {
    const settled = settleSource<string>(
      "board",
      "/x/plans/board.md",
      { kind: "value", value: "fresh" },
      good,
      AT_NOW,
    );
    expect(settled.state.source).toBe("ok");
    expect(settled.state.source === "ok" ? settled.state.value : "").toBe("fresh");
    expect(settled.error).toBeNull();
  });

  it("keeps the PREVIOUS value and marks the source stale when the read failed", () => {
    for (const reason of ["torn", "eacces", "unreadable"] as const) {
      const settled = settleSource<string>(
        "board",
        "/x/plans/board.md",
        { kind: "failed", reason, code: "TEST", message: "driven" },
        good,
        AT_NOW,
      );
      expect(settled.state.source).toBe("stale");
      if (settled.state.source !== "stale") return;
      expect(settled.state.value).toBe("the last good value");
      expect(settled.state.stale.reason).toBe(reason);
      expect(settled.state.stale.since).toBe(AT_NOW);
      // The READ TIME on a stale arm is the time of the LAST GOOD read, because that is the age
      // D-12's badge reports to a human. Stamping it `now` would make a source that has been
      // unreadable for an hour report itself as read a moment ago.
      expect(settled.state.readAt).toBe(AT_FIRST);
      expect(settled.error?.code).toBe("TEST");
    }
  });

  it("reports a source that was ABSENT and is still absent as `unavailable`, with NO error (D-13)", () => {
    const settled = settleSource<string>("queue", "/x/.grugops/queue", { kind: "absent" }, undefined, AT_NOW);
    expect(settled.state.source).toBe("unavailable");
    expect(Object.prototype.hasOwnProperty.call(settled.state, "value")).toBe(false);
    expect(settled.error).toBeNull();
  });

  it("reports a source that WAS seen and is now absent as stale with reason `enoent` (D-13)", () => {
    const settled = settleSource<string>("board", "/x/plans/board.md", { kind: "absent" }, good, AT_NOW);
    expect(settled.state.source).toBe("stale");
    expect(settled.state.source === "stale" ? settled.state.stale.reason : "").toBe("enoent");
    expect(settled.state.source === "stale" ? settled.state.value : "").toBe("the last good value");
  });

  it("carries the value gathered so far and marks it `bounded` when the walk hit its bound", () => {
    const settled = settleSource<string>(
      "tickets",
      "/x/plans/tickets",
      { kind: "bounded", value: "the entries gathered so far" },
      undefined,
      AT_NOW,
    );
    expect(settled.state.source).toBe("stale");
    if (settled.state.source !== "stale") return;
    expect(settled.state.stale.reason).toBe("bounded");
    expect(settled.state.value).toBe("the entries gathered so far");
    expect(settled.error).toBeNull();
  });

  it("keeps the ORIGINAL `since` when a source that was already stale fails again", () => {
    const alreadyStale: SourceState<string> = {
      source: "stale",
      value: "the last good value",
      readAt: AT_FIRST,
      stale: { reason: "enoent", since: AT_FIRST },
    };
    const settled = settleSource<string>(
      "board",
      "/x/plans/board.md",
      { kind: "failed", reason: "torn", code: "TEST", message: "driven" },
      alreadyStale,
      AT_NOW,
    );
    expect(settled.state.source === "stale" ? settled.state.stale.since : "").toBe(AT_FIRST);
  });

  it("reports `unavailable` when the read failed and there is NOTHING to carry forward", () => {
    const settled = settleSource<string>(
      "board",
      "/x/plans/board.md",
      { kind: "failed", reason: "torn", code: "TEST", message: "driven" },
      undefined,
      AT_NOW,
    );
    expect(settled.state.source).toBe("unavailable");
    expect(Object.prototype.hasOwnProperty.call(settled.state, "value")).toBe(false);
    // A fault with nothing to show is still a FAULT, and it is reported even though the arm looks
    // exactly like the legitimately-absent one. The readErrors entry is the only place the
    // difference survives.
    expect(settled.error?.source).toBe("board");
  });
});

describe("readSnapshot — the carry-forward is threaded, not module state (D-11)", () => {
  it("keeps the previous board and marks it `torn` when the board read is torn", () => {
    withTempTree((dir) => {
      const path = plantBoard(dir, TWO_COLUMNS);
      const first = readSnapshot(dir);
      expect(
        first.snapshot.board?.columns.length,
        "PREMISE: the first read did not produce a two-column board, so there is no last-good " +
          "value for the second read to carry forward",
      ).toBe(2);

      let attempts = 0;
      const second = readSnapshot(dir, first, {
        betweenReadAndStat: (p: string) => {
          if (p !== path) return;
          attempts += 1;
          appendFileSync(path, `- [ABC-${attempts}] written under the read\n`, "utf8");
        },
      });

      expect(attempts, "PREMISE: the board read was never torn").toBe(READ_RETRY_BOUND);
      const board = second.snapshot.sources.board;
      expect(board.source).toBe("stale");
      expect(board.source === "stale" ? board.stale.reason : "").toBe("torn");
      expect(second.snapshot.board?.columns.length).toBe(2);
      expect(second.source).toBe("stale");
    });
  });

  it("keeps the previous board and marks it `enoent` when the file disappears after a good read", () => {
    withTempTree((dir) => {
      const path = plantBoard(dir, TWO_COLUMNS);
      const first = readSnapshot(dir);
      expect(first.snapshot.sources.board.source, "PREMISE: the first read was not `ok`").toBe("ok");

      unlinkSync(path);
      expect(
        () => statSync(path),
        "PREMISE: the board file survived the unlink, so this case measured a present file",
      ).toThrow();

      const second = readSnapshot(dir, first);
      const board = second.snapshot.sources.board;
      expect(board.source).toBe("stale");
      expect(board.source === "stale" ? board.stale.reason : "").toBe("enoent");
      // D-11: a vanished file is NEVER an empty board. The previous model is what a human sees,
      // under a badge that says it is old.
      expect(second.snapshot.board?.columns.length).toBe(2);
    });
  });

  it("returns `unavailable` with NO stale field for a board that was never seen (D-13)", () => {
    withTempTree((dir) => {
      const result = readSnapshot(dir);
      const board = result.snapshot.sources.board;
      expect(board.source).toBe("unavailable");
      expect(Object.prototype.hasOwnProperty.call(board, "stale")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(board, "value")).toBe(false);
      expect(result.snapshot.board).toBeNull();
      expect(result.source).toBe("unavailable");
      expect(
        result.readErrors,
        "an absent `.grugops/` and an absent board on a fresh checkout are LEGITIMATE states, not " +
          "faults, so neither produces a read error",
      ).toEqual([]);
    });
  });

  it.skipIf(IS_ROOT)("keeps the previous board and marks it `eacces` when the mode denies the open", () => {
    withTempTree((dir) => {
      const path = plantBoard(dir, TWO_COLUMNS);
      const first = readSnapshot(dir);
      expect(first.snapshot.sources.board.source, "PREMISE: the first read was not `ok`").toBe("ok");

      chmodSync(path, 0o000);
      let denied = false;
      try {
        readFileSync(path, "utf8");
      } catch {
        denied = true;
      }
      expect(denied, "PREMISE: the mode-0 board was still readable").toBe(true);

      const second = readSnapshot(dir, first);
      const board = second.snapshot.sources.board;
      expect(board.source).toBe("stale");
      expect(board.source === "stale" ? board.stale.reason : "").toBe("eacces");
      expect(second.snapshot.board?.columns.length).toBe(2);
      expect(second.readErrors.map((e) => e.source)).toContain("board");
    });
  });

  it("leaves the BOARD fresh when another source is unreadable — staleness is per source (D-12)", () => {
    withTempTree((dir) => {
      plantBoard(dir, TWO_COLUMNS);
      mkdirSync(join(dir, "agent-factory", "config"), { recursive: true });
      writeFileSync(join(dir, "agent-factory", "config", "factory.config.json"), "{ not json", "utf8");

      const result = readSnapshot(dir);
      const board = result.snapshot.sources.board;
      expect(
        result.snapshot.sources.config.source,
        "PREMISE: the malformed dial did not go stale, so no other source was unreadable and this " +
          "case measured nothing about per-source staleness",
      ).toBe("stale");
      expect(board.source).toBe("ok");
      expect(board.source === "ok" ? board.readAt : "").toBe(result.snapshot.generatedAt);
      expect(result.snapshot.board?.columns.length).toBe(2);
      // The top-level discriminant still degrades — one stale source is visible at the top — but
      // the board's OWN state is untouched, which is what D-12 rejected whole-snapshot staleness for.
      expect(result.source).toBe("stale");
    });
  });

  it("stamps every `ok` source with the SAME readAt as the snapshot it belongs to", () => {
    const result: SnapshotResult = readSnapshot(ROOT);
    for (const [name, state] of Object.entries(result.snapshot.sources)) {
      // A STALE arm's `readAt` is deliberately OLDER — it is the last good read, which is the age
      // the badge reports. Only the `ok` arms were read in this pass.
      if (state.source !== "ok") continue;
      expect(state.readAt, `source ${name} reported a read time the snapshot does not know`).toBe(
        result.snapshot.generatedAt,
      );
    }
  });
});

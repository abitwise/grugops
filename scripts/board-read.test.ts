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
import ts from "typescript";
import {
  appendFileSync,
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";

import {
  PRESENCE_DEPENDENT_CONFLICT_KINDS,
  READ_RETRY_BOUND,
  STALE_REASONS,
  STALE_REASON_COUNT,
  isSafeTaskName,
  readSnapshot,
  readVerifyReread,
  settleSource,
} from "./board-read.js";
import { MAX_WALK_ENTRIES } from "./kit-model.js";
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
    // The size half, in its post-plan-32-09 spelling: the RAW BUFFER's own `byteLength`. The
    // decoded-string form is asserted ABSENT in the same breath, because that is the exact
    // comparison CR-03 was — a byte count against a re-encoded decoded length — and re-introducing
    // it would satisfy a bare "the size comparison is present" check while restoring the defect.
    expect(fn).toContain("bytes.byteLength");
    expect(
      fn,
      "the agreement test is comparing a DECODED string's re-encoded length again (CR-03): " +
        "`readFileSync(path, \"utf8\")` substitutes U+FFFD for each invalid byte, so a file with " +
        "one stray byte can never satisfy the comparison and is reported `torn` forever",
    ).not.toContain("byteLength(text");
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
      expect(
        Object.prototype.hasOwnProperty.call(board, "stale"),
        "the board carries NO stale field at all — the badge is per source, and a board nobody " +
          "failed to read has nothing to badge",
      ).toBe(false);
      expect(board.source === "ok" ? board.readAt : "").toBe(result.snapshot.generatedAt);
      expect(result.snapshot.board?.columns.length).toBe(2);
      // The top-level discriminant still degrades — one stale source is visible at the top — but
      // the board's OWN state is untouched, which is what D-12 rejected whole-snapshot staleness for.
      expect(result.source).toBe("stale");
    });
  });

  it("marks a source `unreadable` when the bytes ARRIVED and the content did not parse (D-11)", () => {
    withTempTree((dir) => {
      plantBoard(dir, TWO_COLUMNS);
      mkdirSync(join(dir, "agent-factory", "config"), { recursive: true });
      const dial = join(dir, "agent-factory", "config", "factory.config.json");
      writeFileSync(dial, '{ "mode": "lean" }', "utf8");
      const first = readSnapshot(dir);
      expect(
        first.snapshot.config?.mode,
        "PREMISE: the first read did not produce a usable dial, so the second read has nothing to " +
          "contrast a partial parse against",
      ).toBe("lean");

      writeFileSync(dial, '{ "mode": "lea', "utf8");
      const second = readSnapshot(dir, first);
      const config = second.snapshot.sources.config;
      expect(config.source).toBe("stale");
      // A PARTIAL PARSE is its own reason: the file was there and the bytes arrived, so calling it
      // `enoent` or `torn` would send a human to look for a problem that is not the one they have.
      expect(config.source === "stale" ? config.stale.reason : "").toBe("unreadable");
      expect(second.snapshot.config?.mode).toBe("lean");
      expect(second.readErrors.map((e) => e.source)).toEqual(["config"]);
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

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TASK 2 — THE FOUR REMAINING SOURCES: TICKETS, QUEUE, CONTEXT, TRACEABILITY.
//
// Each carries a rule that already exists somewhere in this tree, and the cases below are written
// against the RULE rather than against this module's re-statement of it: the queue's tamper skip is
// `scripts/claim.ts:270-306`'s, the ticket's admission is `scripts/canonical-frontmatter.ts`'s, and
// the traceability comment hazard is answered by the SAME `stripHtmlComments` the board uses.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** Plant a ticket under `plans/tickets/` and return its path. */
function plantTicket(dir: string, name: string, text: string): string {
  mkdirSync(join(dir, "plans", "tickets"), { recursive: true });
  const path = join(dir, "plans", "tickets", name);
  writeFileSync(path, text, "utf8");
  return path;
}

/** Plant a claim record under `.grugops/queue/claimed/<task>/claim.md`. */
function plantClaim(dir: string, task: string, text: string): string {
  const taskDir = join(dir, ".grugops", "queue", "claimed", task);
  mkdirSync(taskDir, { recursive: true });
  const path = join(taskDir, "claim.md");
  writeFileSync(path, text, "utf8");
  return path;
}

/** A seam that records every path the read went through, so escapes are visible rather than argued. */
function pathRecorder(): { seam: { betweenReadAndStat: (p: string) => void }; paths: string[] } {
  const paths: string[] = [];
  return { seam: { betweenReadAndStat: (p: string) => void paths.push(p) }, paths };
}

// A ticket written in the canonical TICKET form (plan 32-05). The kit-adapter schema is a
// DIFFERENT document class: `name`/`description` belong to an adapter, `id`/`title`/`status`/
// `column` belong to a ticket, and `scripts/board-model.ts`'s `parseTicketDocument` is the one
// authority for this class. The reason that question was answered here rather than by widening
// `CANONICAL_SCHEMA` is recorded above that function.
const ADMITTED_TICKET =
  "---\nid: ABC-014\ntitle: Asset allocation chart\nstatus: in-development\ncolumn: In Development\n---\n\nBody.\n";

describe("board-read — tickets, through the ONE ticket-document authority (D-03, T-32-11)", () => {
  it("admits a conforming ticket and joins it", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);

      const result = readSnapshot(dir);
      const tickets = result.snapshot.sources.tickets;
      expect(tickets.source).toBe("ok");
      expect(tickets.source === "ok" ? tickets.value : []).toEqual([
        {
          file: "ABC-014.md",
          id: "ABC-014",
          title: "Asset allocation chart",
          status: "in-development",
          column: "In Development",
        },
      ]);
      expect(result.readErrors).toEqual([]);
    });
  });

  it("reports a REFUSED ticket by its refusal code and joins nothing for it", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      // `tools` is outside the closed ticket key set, so the ONE ticket authority refuses the
      // document with `unknown-key` rather than ignoring the key. Ignoring an unknown key is how a
      // document grows a second place to hide a value.
      plantTicket(dir, "ABC-015.md", "---\nid: ABC-015\ntools: Bash\n---\n");

      const result = readSnapshot(dir);
      const tickets = result.snapshot.sources.tickets;
      const joined = tickets.source === "ok" ? tickets.value.map((t) => t.file) : [];
      expect(
        joined,
        "PREMISE: the conforming ticket was not joined either, so this case measured a broken " +
          "reader rather than a refused document",
      ).toEqual(["ABC-014.md"]);

      const refusal = result.readErrors.find((e) => e.path.endsWith("ABC-015.md"));
      expect(refusal?.source).toBe("tickets");
      expect(refusal?.code).toBe("unknown-key");
    });
  });

  it("reads an EMPTY `plans/tickets/` as `ok` with no tickets — empty is not stale (D-13)", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      mkdirSync(join(dir, "plans", "tickets"), { recursive: true });
      writeFileSync(join(dir, "plans", "tickets", ".gitkeep"), "", "utf8");

      const tickets = readSnapshot(dir).snapshot.sources.tickets;
      expect(tickets.source).toBe("ok");
      expect(tickets.source === "ok" ? tickets.value : null).toEqual([]);
    });
  });

  it("filters a `.tmp-` sibling EXPLICITLY, so a half-written atomic write is never admitted", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      plantTicket(dir, "ABC-014.md.tmp-4242-1-abcdef01", "---\nname: HALF\n");

      const { seam, paths } = pathRecorder();
      const tickets = readSnapshot(dir, undefined, seam).snapshot.sources.tickets;
      expect(tickets.source === "ok" ? tickets.value.length : -1).toBe(1);
      expect(paths.filter((p) => p.includes(".tmp-"))).toEqual([]);
    });
  });

  it("marks tickets `bounded` above MAX_WALK_ENTRIES rather than throwing (T-32-07)", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      mkdirSync(join(dir, "plans", "tickets"), { recursive: true });
      // NON-`.md` names on purpose: the case is about the WALK bound, and admitting ten thousand
      // documents to prove a listing was truncated would measure the admission loop instead.
      for (let i = 0; i <= MAX_WALK_ENTRIES; i += 1) {
        writeFileSync(join(dir, "plans", "tickets", `note-${i}.txt`), "", "utf8");
      }

      const result = readSnapshot(dir);
      const tickets = result.snapshot.sources.tickets;
      expect(tickets.source).toBe("stale");
      expect(tickets.source === "stale" ? tickets.stale.reason : "").toBe("bounded");
      // A hung read is a stale badge, never a frozen screen: the board beside it is untouched.
      expect(result.snapshot.sources.board.source).toBe("ok");
    });
  });
});

describe("board-read — the queue, with claim.ts's tamper rules PORTED (T-32-05, T-32-03)", () => {
  const GOOD_CLAIM = "by: engineer\nat: 2026-09-14T09:00:00.000Z\n";

  it("joins a well-formed claim record", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantClaim(dir, "ABC-014", GOOD_CLAIM);

      const queue = readSnapshot(dir).snapshot.sources.queue;
      expect(queue.source).toBe("ok");
      expect(queue.source === "ok" ? queue.value : []).toEqual([
        { task: "ABC-014", by: "engineer", at: "2026-09-14T09:00:00.000Z" },
      ]);
    });
  });

  it("SKIPS a claim record carrying two `at:` key lines and names it in readErrors (T-32-05)", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantClaim(dir, "ABC-014", GOOD_CLAIM);
      // The on-disk signature of a `by`-injection that smuggled a forged `at:`. Trusting either line
      // lets a tampered claim masquerade as a running row, which is a queue-lock denial of service.
      const tampered = plantClaim(
        dir,
        "ABC-015",
        "by: engineer\nat: 2026-09-14T09:00:00.000Z\nat: 1970-01-01T00:00:00.000Z\n",
      );

      const result = readSnapshot(dir);
      const queue = result.snapshot.sources.queue;
      const tasks = queue.source === "ok" ? queue.value.map((r) => r.task) : [];
      expect(
        tasks,
        "PREMISE: the well-formed claim was not joined either, so this case measured a broken " +
          "reader rather than a refused record",
      ).toEqual(["ABC-014"]);

      const named = result.readErrors.find((e) => e.path === tampered);
      expect(named?.source).toBe("queue");
      expect(named?.code).toBe("tampered");
    });
  });

  it("skips a claimed directory whose name is outside the ported allowlist, without reading it", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantClaim(dir, "ABC-014", GOOD_CLAIM);
      const outside = plantClaim(dir, "bad name", GOOD_CLAIM);

      const { seam, paths } = pathRecorder();
      const result = readSnapshot(dir, undefined, seam);
      const queue = result.snapshot.sources.queue;
      expect(queue.source === "ok" ? queue.value.map((r) => r.task) : []).toEqual(["ABC-014"]);
      expect(
        paths.includes(outside),
        "a name outside the allowlist is skipped BEFORE any filesystem access, so the read never " +
          "touched it at all",
      ).toBe(false);
    });
  });

  it("refuses `.` and `..` as task names — the rule readdirSync can never hand it (T-32-03)", () => {
    // A DIRECT ASSERTION ON THE PREDICATE, AND THE REASON IS STRUCTURAL. `readdirSync` never returns
    // `.` or `..`, so this arm of the ported rule is unreachable through the filesystem — exactly as
    // it is unreachable in `scripts/claim.ts:277`, where it is kept for the same reason: the day the
    // listing stops being a `readdirSync` is the day the rule matters, and a rule added back after
    // that day is a rule added after the traversal.
    expect(isSafeTaskName("..")).toBe(false);
    expect(isSafeTaskName(".")).toBe(false);
    expect(isSafeTaskName("")).toBe(false);
    expect(isSafeTaskName("../../etc")).toBe(false);
    expect(isSafeTaskName("a/b")).toBe(false);
    expect(isSafeTaskName("ABC-014")).toBe(true);
  });

  it("skips a claimed directory with no claim.md at all", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantClaim(dir, "ABC-014", GOOD_CLAIM);
      mkdirSync(join(dir, ".grugops", "queue", "claimed", "ABC-016"), { recursive: true });

      const queue = readSnapshot(dir).snapshot.sources.queue;
      expect(queue.source === "ok" ? queue.value.map((r) => r.task) : []).toEqual(["ABC-014"]);
    });
  });

  it("skips a claim record with no `at:` line, which cannot be placed on the timeline", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantClaim(dir, "ABC-014", "by: engineer\n");
      const queue = readSnapshot(dir).snapshot.sources.queue;
      expect(queue.source === "ok" ? queue.value : null).toEqual([]);
    });
  });

  it("orders rows by `at`, then by task — the same order the queue's own renderer emits", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantClaim(dir, "ABC-020", "by: a\nat: 2026-09-14T10:00:00.000Z\n");
      plantClaim(dir, "ABC-002", "by: b\nat: 2026-09-14T09:00:00.000Z\n");
      plantClaim(dir, "ABC-001", "by: c\nat: 2026-09-14T09:00:00.000Z\n");

      const queue = readSnapshot(dir).snapshot.sources.queue;
      expect(queue.source === "ok" ? queue.value.map((r) => r.task) : []).toEqual([
        "ABC-001",
        "ABC-002",
        "ABC-020",
      ]);
    });
  });

  it("reports an ABSENT `.grugops/queue/` as unavailable, with no badge and no error (D-13)", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const result = readSnapshot(dir);
      expect(result.snapshot.sources.queue.source).toBe("unavailable");
      expect(result.readErrors).toEqual([]);
      expect(result.source).toBe("ok");
    });
  });

  it("leaves the BOARD fresh when the QUEUE is unreadable — staleness is per source (D-12)", () => {
    withTempTree((dir) => {
      plantBoard(dir, TWO_COLUMNS);
      plantClaim(dir, "ABC-014", GOOD_CLAIM);
      const first = readSnapshot(dir);
      expect(
        first.snapshot.sources.queue.source,
        "PREMISE: the queue was not readable on the FIRST read, so the second read has no last-good " +
          "queue to carry forward and this case measured nothing",
      ).toBe("ok");

      rmSync(join(dir, ".grugops", "queue", "claimed", "ABC-014", "claim.md"));
      rmSync(join(dir, ".grugops", "queue"), { recursive: true, force: true });

      const second = readSnapshot(dir, first);
      const board = second.snapshot.sources.board;
      const queue = second.snapshot.sources.queue;
      expect(queue.source).toBe("stale");
      expect(queue.source === "stale" ? queue.stale.reason : "").toBe("enoent");
      expect(queue.source === "stale" ? queue.value.length : -1).toBe(1);
      expect(board.source).toBe("ok");
      expect(Object.prototype.hasOwnProperty.call(board, "stale")).toBe(false);
      expect(board.source === "ok" ? board.readAt : "").toBe(second.snapshot.generatedAt);
    });
  });
});

describe("board-read — the context index, presence and current state only (D-17)", () => {
  const NOTE_A = {
    id: "20260914T0900-engineer-finding-aaaa1111",
    kind: "finding",
    by: "engineer",
    at: "2026-09-14T09:00:00.000Z",
    verified_by: "gate",
    confidence: "high",
    refs: [],
    supersedes: null,
  };
  const NOTE_B = {
    ...NOTE_A,
    id: "20260914T1000-engineer-finding-bbbb2222",
    at: "2026-09-14T10:00:00.000Z",
    supersedes: NOTE_A.id,
  };

  function plantContext(dir: string, task: string, notes: readonly unknown[]): string {
    const taskDir = join(dir, ".grugops", "context", task);
    mkdirSync(join(taskDir, "notes"), { recursive: true });
    const index = join(taskDir, "index.jsonl");
    writeFileSync(index, `${notes.map((n) => JSON.stringify(n)).join("\n")}\n`, "utf8");
    writeFileSync(join(taskDir, "notes", `${NOTE_A.id}.md`), "a note body nobody should read", "utf8");
    return index;
  }

  it("reports each task's note count, live count and latest live note", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantContext(dir, "ABC-014", [NOTE_A, NOTE_B]);

      const context = readSnapshot(dir).snapshot.sources.context;
      expect(context.source).toBe("ok");
      expect(context.source === "ok" ? context.value : []).toEqual([
        {
          task: "ABC-014",
          noteCount: 2,
          // The supersede fold, by the `currentState` rule: NOTE_B supersedes NOTE_A.
          liveCount: 1,
          latestAt: NOTE_B.at,
          latestKind: "finding",
        },
      ]);
    });
  });

  it("reads the INDEX and never a note body, on any re-read (D-17 rejected the notes block)", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantContext(dir, "ABC-014", [NOTE_A, NOTE_B]);

      const { seam, paths } = pathRecorder();
      readSnapshot(dir, undefined, seam);
      expect(
        paths.some((p) => p.endsWith("index.jsonl")),
        "PREMISE: the context index was never read, so 'it read no bodies' is true of a reader that " +
          "read nothing at all",
      ).toBe(true);
      expect(paths.filter((p) => p.includes(`${sep}notes${sep}`))).toEqual([]);
    });
  });

  it("reports a task directory whose index has not been rendered yet, without calling it a fault", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      mkdirSync(join(dir, ".grugops", "context", "ABC-014", "notes"), { recursive: true });

      const result = readSnapshot(dir);
      const context = result.snapshot.sources.context;
      expect(context.source === "ok" ? context.value : []).toEqual([
        { task: "ABC-014", noteCount: 0, liveCount: 0, latestAt: null, latestKind: null },
      ]);
      expect(result.readErrors).toEqual([]);
    });
  });

  it("names a malformed index line in readErrors rather than counting it as a note", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const index = plantContext(dir, "ABC-014", [NOTE_A]);
      writeFileSync(index, `${JSON.stringify(NOTE_A)}\n{ not json\n`, "utf8");

      const result = readSnapshot(dir);
      const context = result.snapshot.sources.context;
      expect(context.source === "ok" ? context.value[0]?.noteCount : -1).toBe(1);
      expect(result.readErrors.find((e) => e.path === index)?.source).toBe("context");
    });
  });
});

describe("board-read — traceability, through the SAME comment pre-pass as the board (D-03)", () => {
  const TRACE_HEADER =
    "| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |\n" +
    "|--------|-------|------|---------|------|-----------------|-------|-----|---------|--------|\n";

  function plantTrace(dir: string, text: string): string {
    mkdirSync(join(dir, "plans"), { recursive: true });
    const path = join(dir, "plans", "traceability.md");
    writeFileSync(path, text, "utf8");
    return path;
  }

  it("reads a live row beneath the real header", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTrace(
        dir,
        `# Traceability Matrix\n\n${TRACE_HEADER}` +
          "| ABC-014 | Asset allocation chart | EPIC-003 | FEAT-007 | NFR-002 | #41 | fx.spec.ts | UAT-12 | REL-0007 | Done |\n",
      );

      const trace = readSnapshot(dir).snapshot.sources.traceability;
      expect(trace.source).toBe("ok");
      const rows = trace.source === "ok" ? trace.value : [];
      expect(rows.length).toBe(1);
      expect(rows[0]?.ticket).toBe("ABC-014");
      expect(rows[0]?.title).toBe("Asset allocation chart");
      expect(rows[0]?.status).toBe("Done");
      expect(rows[0]?.cells.length).toBe(10);
    });
  });

  it("reads NO row from an example row inside the file's OWN html comment (D-03)", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTrace(
        dir,
        "# Traceability Matrix\n\n<!--\n  Example row shape (this is a comment, NOT a live row):\n\n" +
          "    | ABC-012 | FX conversion | EPIC-003 | FEAT-007 | NFR-002 | #41 | fx.spec.ts | UAT-12 | REL-0007 | Done |\n" +
          `-->\n\n${TRACE_HEADER}` +
          "| ABC-014 | Asset allocation chart | EPIC-003 | FEAT-007 | NFR-002 | #41 | fx.spec.ts | UAT-12 | REL-0007 | Done |\n",
      );

      const trace = readSnapshot(dir).snapshot.sources.traceability;
      const rows = trace.source === "ok" ? trace.value : [];
      expect(rows.map((r) => r.ticket)).toEqual(["ABC-014"]);
    });
  });

  it("reads ZERO rows from the REAL `plans/traceability.md`, whose only row shape is commented out", () => {
    // The live artifact, not a transcription. It ships EMPTY — header and separator only — with an
    // example row at `:15` inside its own 31-line comment. A reader that counted that row would
    // report a ticket nobody filed, which is the same hazard the board's own comment carries.
    const trace = readSnapshot(ROOT).snapshot.sources.traceability;
    expect(
      trace.source,
      "PREMISE: the repository's own traceability matrix was not readable, so 'zero rows' describes " +
        "a file this case never read",
    ).toBe("ok");
    expect(trace.source === "ok" ? trace.value : null).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-09 — AN UNREADABLE DIRECTORY REACHES THE BADGE, AND NO CONFLICT IS FABRICATED (CR-02).
//
// The end-to-end slice the verifier reproduced by hand: a mode-000 `plans/tickets/` used to render a
// clean `[ok]` header, no `readErrors` entry at all, and one `row-without-file` finding per board row
// — positive assertions that files which exist do not. Three assertions, because any one of them is
// satisfiable on its own by a reader that is broken a different way.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

const TICKETED_BOARD =
  "## Backlog (WIP unlimited)\n" +
  "- [ABC-101] Something in the backlog\n" +
  "## Done (WIP unlimited)\n" +
  "- [ABC-102] Something finished\n";

/** A minimal conforming ticket document, planted through this file's existing `plantTicket`. */
function plantTicketDoc(dir: string, id: string, column: string, status: string): string {
  return plantTicket(
    dir,
    `${id}.md`,
    `---\nid: ${id}\ntitle: ${id} title\nstatus: ${status}\ncolumn: ${column}\n---\n\n# ${id}\n`,
  );
}

/** Build a tree whose board rows all have ticket files, then run `run` with `plans/tickets` at 000. */
function withDeniedTicketsDir(run: (dir: string, ticketsDir: string) => void): void {
  withTempTree((dir) => {
    plantBoard(dir, TICKETED_BOARD);
    plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
    plantTicketDoc(dir, "ABC-102", "Done", "done");
    const ticketsDir = join(dir, "plans", "tickets");
    chmodSync(ticketsDir, 0o000);
    try {
      run(dir, ticketsDir);
    } finally {
      // Restored here rather than in `withTempTree`, so the removal below cannot fail on the mode.
      chmodSync(ticketsDir, 0o755);
    }
  });
}

describe("board-read — a denied `plans/tickets/` is stale, not absent (plan 32-09, CR-02)", () => {
  it.skipIf(IS_ROOT)("PREMISE: the mode actually denies the listing", () => {
    withDeniedTicketsDir((_dir, ticketsDir) => {
      let denied = false;
      try {
        readdirSync(ticketsDir);
      } catch (e) {
        denied = (e as NodeJS.ErrnoException).code === "EACCES";
      }
      expect(
        denied,
        "PREMISE: chmod 000 did not deny the listing on this filesystem, so every assertion in " +
          "this block would measure a directory that read cleanly",
      ).toBe(true);
    });
  });

  it.skipIf(IS_ROOT)("reports the tickets source as anything but `ok`", () => {
    withDeniedTicketsDir((dir) => {
      const result = readSnapshot(dir);
      expect(
        result.snapshot.sources.tickets.source,
        "a directory this process could not open was reported with the SAME answer a directory " +
          "nobody created gets, which is what renders a clean `[ok]` header over a board the " +
          "projector could not check (CR-02)",
      ).not.toBe("ok");
      // The board itself is still readable, so the top-level discriminant degrades rather than dies.
      expect(result.snapshot.sources.board.source).toBe("ok");
      expect(result.source).toBe("stale");
    });
  });

  it.skipIf(IS_ROOT)("carries exactly one `readErrors` entry for tickets, and it names the errno", () => {
    withDeniedTicketsDir((dir, ticketsDir) => {
      const result = readSnapshot(dir);
      const ticketErrors = result.readErrors.filter((e) => e.source === "tickets");
      expect(ticketErrors.length, "the permission failure must be reported exactly once").toBe(1);
      expect(ticketErrors[0]?.code, "the errno itself, not a collapsed placeholder").toBe("EACCES");
      expect(
        ticketErrors[0]?.message,
        "a human reading stderr is told WHICH directory failed",
      ).toContain(ticketsDir);
    });
  });

  it.skipIf(IS_ROOT)("derives ZERO presence-dependent conflicts about files it could not list", () => {
    withDeniedTicketsDir((dir) => {
      const result = readSnapshot(dir);
      const fabricated = result.conflicts.filter((c) =>
        (PRESENCE_DEPENDENT_CONFLICT_KINDS as readonly string[]).includes(c.kind),
      );
      expect(
        fabricated.map((c) => `${c.kind} ${c.ticketId ?? ""}`),
        "each of these is a positive assertion about a filesystem this process could not read — " +
          "CR-02 measured seven of them against six files that exist",
      ).toEqual([]);
    });
  });

  it.skipIf(IS_ROOT)("PREMISE: the SAME tree with the mode restored DOES read cleanly", () => {
    // The discrimination. Without it, "no conflicts and not ok" is equally true of a reader that
    // fails on every tree, and the four cases above would pass over a projector that reads nothing.
    withTempTree((dir) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      plantTicketDoc(dir, "ABC-102", "Done", "done");
      const result = readSnapshot(dir);
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      expect(result.readErrors.filter((e) => e.source === "tickets")).toEqual([]);
      const tickets =
        result.snapshot.sources.tickets.source === "ok" ? result.snapshot.sources.tickets.value : [];
      expect(tickets.map((t) => t.id).sort()).toEqual(["ABC-101", "ABC-102"]);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-09 TASK 2 — THE SWALLOW CENSUS, DERIVED FROM THE FILE RATHER THAN TYPED OUT.
//
// CR-02 was ONE bare `catch` that discarded the value it caught. The defect class is not that clause;
// it is that a clause like it can be added to this module and nothing says so. So the census below is
// derived by parsing `scripts/board-read.ts` with the `typescript` package — the idiom
// `scripts/board-readonly.test.ts` already uses — and the count is pinned two-sided with a message
// that reads as a decision. A future swallow in the read seam is then something somebody RECORDS,
// not a constant somebody bumps.
//
// THE HARNESS ASSERTS ITS OWN PREMISE. A pin of zero is satisfied equally by "there are no swallows"
// and by "the walk found no clauses at all", and this repository has recorded a false
// verification-harness premise six times across four rounds. So the TOTAL clause count is asserted
// non-trivial first: a census that found nothing measures nothing.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** One catch clause, with the two facts the census is about. */
type CatchFacts = { readonly line: number; readonly discardsValue: boolean };

/**
 * Every `catch` clause in a file, and whether each DISCARDS the value it caught.
 *
 * Discarding means one of two things, and both are counted: the clause declares no binding at all
 * (`catch {`), or it binds a name that no identifier inside the block ever reads. The second half
 * matters because `catch (e) { continue; }` swallows exactly as completely as `catch { continue; }`
 * and would otherwise pass a census that only looked for the missing binding.
 */
function catchCensus(absPath: string): readonly CatchFacts[] {
  const text = readFileSync(absPath, "utf8");
  const source = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true);
  const out: CatchFacts[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCatchClause(node)) {
      const decl = node.variableDeclaration;
      let discardsValue = true;
      if (decl !== undefined && ts.isIdentifier(decl.name)) {
        const bound = decl.name.text;
        let reads = 0;
        const countReads = (n: ts.Node): void => {
          if (ts.isIdentifier(n) && n.text === bound && n !== decl.name) reads += 1;
          ts.forEachChild(n, countReads);
        };
        countReads(node.block);
        discardsValue = reads === 0;
      }
      out.push({
        line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        discardsValue,
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

const READ_SEAM_PATH = join(ROOT, "scripts", "board-read.ts");

/**
 * How many `catch` clauses in the read seam discard the value they caught.
 *
 * ZERO IS A DECISION, and it is the decision CR-02 cost this phase a verification round to reach. A
 * discarded errno is an answer the reader gives without having one: `listDirectoryBounded` returned
 * "the directory is not there" for a directory it could not open, and the projector then asserted
 * that seven ticket files did not exist. Every failure in this module now reports WHICH errno it met.
 *
 * Adding a swallow here is legitimate ONLY when the errno being swallowed is named in a comment
 * beside the clause together with why silence is right — the ENOENT race at the context task stat is
 * the shape that qualifies, and it binds and inspects the error rather than discarding it. Raising
 * this number is that decision being recorded, never a constant being bumped to make a suite green.
 */
const READ_SEAM_VALUE_DISCARDING_CATCHES = 0;

describe("board-read — the swallow census is derived from the file (plan 32-09, CR-02)", () => {
  it("PREMISE: the parse found a non-trivial number of catch clauses", () => {
    const census = catchCensus(READ_SEAM_PATH);
    expect(
      census.length,
      "PREMISE: the AST walk over scripts/board-read.ts found (almost) no catch clauses, so the " +
        "pin below would be satisfied by a census that measured nothing — the vacuous green this " +
        "repository has recorded a false harness premise for six times",
    ).toBeGreaterThanOrEqual(5);
  });

  it("pins the value-discarding catch count two-sided", () => {
    const discarding = catchCensus(READ_SEAM_PATH).filter((c) => c.discardsValue);
    expect(
      discarding.map((c) => `line ${c.line}`),
      "a `catch` in the read seam discards the value it caught. Every failure this module meets " +
        "must name its errno, because a discarded errno is how EACCES became 'the directory is " +
        "not there' and the projector fabricated seven findings (CR-02). Swallowing is legitimate " +
        "only with the specific errno named in a comment beside the clause and a reason silence " +
        "is right — which is a DECISION recorded here and in the phase context, never a bumped " +
        "constant",
    ).toEqual([]);
    expect(discarding.length).toBe(READ_SEAM_VALUE_DISCARDING_CATCHES);
  });

  it("PREMISE: the census detects a planted swallow of BOTH shapes", () => {
    // The discrimination. Without it, "zero swallows" is equally true of a predicate that can never
    // say yes — and a census that cannot fail is a census that proves nothing about the file.
    withTempTree((dir) => {
      const probe = join(dir, "probe.ts");
      writeFileSync(
        probe,
        "export function a(): void { try { a(); } catch { /* bare */ } }\n" +
          "export function b(): void { try { b(); } catch (e) { /* bound, never read */ } }\n" +
          "export function c(): void { try { c(); } catch (e) { console.log(e); } }\n",
        "utf8",
      );
      const census = catchCensus(probe);
      expect(census.length, "three clauses were planted").toBe(3);
      expect(
        census.filter((c) => c.discardsValue).length,
        "the bare clause AND the bound-but-never-read clause are both swallows",
      ).toBe(2);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-09 TASK 2 — THE REMAINING CONSUMERS OF THE LISTING, AND THE LEGITIMATE-INPUT PROBES.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** The claimed-stage directory, planted through this file's existing `plantClaim`. */
function plantClaimedStage(dir: string, task: string, body: string): string {
  plantClaim(dir, task, body);
  return join(dir, ".grugops", "queue", "claimed");
}

const CLAIM_BODY = "by: software-engineer\nat: 2026-09-14T09:00:00.000Z\n";

describe("board-read — an unreadable claimed stage is stale, not 'nothing claimed' (plan 32-09)", () => {
  it.skipIf(IS_ROOT)("badges the queue source and names the errno once", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const claimedDir = plantClaimedStage(dir, "abc-104-implement", CLAIM_BODY);
      chmodSync(claimedDir, 0o000);
      try {
        const result = readSnapshot(dir);
        expect(
          result.snapshot.sources.queue.source,
          "an unreadable claimed stage rendered as 'nothing claimed' — the CR-02 swallow one " +
            "source over, and the one a human watching a live run would act on",
        ).not.toBe("ok");
        const queueErrors = result.readErrors.filter((e) => e.source === "queue");
        expect(queueErrors.length).toBe(1);
        expect(queueErrors[0]?.code).toBe("EACCES");
      } finally {
        chmodSync(claimedDir, 0o755);
      }
    });
  });

  it("keeps today's answer for an ABSENT claimed stage under a PRESENT queue (D-13)", () => {
    // The legitimate input the fix must not turn into a fault: a queue directory that exists and has
    // claimed nothing yet is an empty queue, with no badge and no error.
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      mkdirSync(join(dir, ".grugops", "queue", "pending"), { recursive: true });
      const result = readSnapshot(dir);
      expect(result.snapshot.sources.queue.source).toBe("ok");
      expect(
        result.snapshot.sources.queue.source === "ok" ? result.snapshot.sources.queue.value : null,
      ).toEqual([]);
      expect(result.readErrors.filter((e) => e.source === "queue")).toEqual([]);
    });
  });
});

describe("board-read — an unreadable context directory is stale, not empty (plan 32-09)", () => {
  it.skipIf(IS_ROOT)("badges the context source when `.grugops/context` itself denies the listing", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const contextDir = join(dir, ".grugops", "context");
      mkdirSync(join(contextDir, "abc-104-implement"), { recursive: true });
      chmodSync(contextDir, 0o000);
      try {
        const result = readSnapshot(dir);
        expect(result.snapshot.sources.context.source).not.toBe("ok");
        const contextErrors = result.readErrors.filter((e) => e.source === "context");
        expect(contextErrors.length).toBe(1);
        expect(contextErrors[0]?.code).toBe("EACCES");
      } finally {
        chmodSync(contextDir, 0o755);
      }
    });
  });

  it.skipIf(IS_ROOT)("names a task directory whose own mode denies the stat, rather than skipping it", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const contextDir = join(dir, ".grugops", "context");
      const taskDir = join(contextDir, "abc-104-implement");
      mkdirSync(taskDir, { recursive: true });
      // Denying the PARENT is what makes the stat of the child fail with EACCES while the listing
      // of the parent still succeeds — the exact shape the bare `catch` at the stat swallowed.
      chmodSync(contextDir, 0o444);
      try {
        const result = readSnapshot(dir);
        const contextErrors = result.readErrors.filter((e) => e.source === "context");
        expect(
          contextErrors.length,
          "a permission-denied context task was invisible: the stat's bare `catch` called every " +
            "failure 'it went away between the listing and the stat', which is true only of ENOENT",
        ).toBe(1);
        expect(contextErrors[0]?.message).toContain(taskDir);
        expect(contextErrors[0]?.code).toBe("EACCES");
      } finally {
        chmodSync(contextDir, 0o755);
      }
    });
  });

  it("stays SILENT about a task directory that is genuinely gone at the stat (ENOENT)", () => {
    // A dangling symlink stats as ENOENT, which is the race the original comment described and the
    // one case where silence is right: the entry went away between the listing and the stat, the
    // next re-read will say so, and reporting it would make a live dashboard noisy about a file
    // nobody misses.
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const contextDir = join(dir, ".grugops", "context");
      mkdirSync(contextDir, { recursive: true });
      symlinkSync(join(dir, "no-such-target"), join(contextDir, "abc-999-vanished"));
      const result = readSnapshot(dir);
      expect(
        result.readErrors.filter((e) => e.source === "context"),
        "an ENOENT at the stat is a real race and stays silent — the swallow that survives is the " +
          "one whose errno is named",
      ).toEqual([]);
      expect(result.snapshot.sources.context.source).toBe("ok");
    });
  });
});

describe("board-read — the legitimate inputs the fix must not turn into faults (D-13)", () => {
  it("reports NO error and NO stale source for a tree with no `.grugops/` at all", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const result = readSnapshot(dir);
      // BOTH HALVES, because either alone is satisfiable by a reader that is broken the other way:
      // an empty `readErrors` is true of a reader that reports nothing, and "no stale source" is
      // true of a reader that calls everything ok.
      expect(result.readErrors, "D-13: an absent `.grugops/` says nothing on stderr").toEqual([]);
      const staleNames = Object.entries(result.snapshot.sources)
        .filter(([, s]) => s.source === "stale")
        .map(([name]) => name);
      expect(staleNames, "a fresh checkout showing a badge it can do nothing about").toEqual([]);
      expect(result.snapshot.sources.queue.source).toBe("unavailable");
      expect(result.snapshot.sources.context.source).toBe("unavailable");
      expect(result.source, "the board is readable, so the frame is trustworthy").toBe("ok");
    });
  });

  it("reports an EMPTY `plans/tickets/` as `ok` with no badge and no error", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      mkdirSync(join(dir, "plans", "tickets"), { recursive: true });
      const result = readSnapshot(dir);
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      expect(
        result.snapshot.sources.tickets.source === "ok"
          ? result.snapshot.sources.tickets.value
          : null,
      ).toEqual([]);
      expect(result.readErrors.filter((e) => e.source === "tickets")).toEqual([]);
    });
  });

  it("still marks tickets `bounded` above MAX_WALK_ENTRIES, carrying what it gathered", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const ticketsDir = join(dir, "plans", "tickets");
      mkdirSync(ticketsDir, { recursive: true });
      for (let i = 0; i <= MAX_WALK_ENTRIES; i += 1) {
        writeFileSync(join(ticketsDir, `ABC-${String(i).padStart(5, "0")}.md`), "x", "utf8");
      }
      const tickets = readSnapshot(dir).snapshot.sources.tickets;
      expect(
        tickets.source,
        "the bounded arm rides the `listed` case and must survive the three-arm split",
      ).toBe("stale");
      expect(tickets.source === "stale" ? tickets.stale.reason : null).toBe("bounded");
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-09 TASK 3 — THE TEAR DETECTOR MEASURES TEARING (CR-03).
//
// The agreement test compared a DECODED string's re-encoded length against two stats. `readFileSync`
// with an encoding substitutes U+FFFD for each invalid byte, so a file carrying one stray 0xE9 could
// never satisfy it: the reader reported `torn` — a statement about a writer — for a file nothing was
// writing, and burned three reads and six stats doing it on every poll.
//
// The cases below are a DISCRIMINATION, not a single assertion. A fix that simply deleted the size
// comparison would pass "the non-UTF-8 file is not torn" and fail the repository: the real tear must
// still be detected, and every valid encoding must still round-trip byte for byte.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** Write raw bytes with no encoding argument, so an invalid sequence survives to disk. */
function plantBytes(dir: string, name: string, bytes: Buffer): string {
  const path = join(dir, name);
  writeFileSync(path, bytes);
  return path;
}

/** Valid ASCII with exactly one Latin-1 `0xE9` — a stray byte from a bad merge or an old editor. */
const ONE_INVALID_BYTE = Buffer.concat([
  Buffer.from("# Board\n## Backlog (WIP unlimited)\n- [ABC-101] caf", "utf8"),
  Buffer.from([0xe9]),
  Buffer.from(" latin1 title\n", "utf8"),
]);

describe("board-read — a non-decodable file is `unreadable`, never `torn` (plan 32-09, CR-03)", () => {
  it("PREMISE: the planted file really is invalid UTF-8", () => {
    // Without this, "reason unreadable" is equally true of a file that decodes fine and fails for
    // some other reason, and the case below would measure nothing about encoding.
    let threw = false;
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(ONE_INVALID_BYTE);
    } catch {
      threw = true;
    }
    expect(threw, "PREMISE: the fixture bytes decode cleanly, so this block measures nothing").toBe(
      true,
    );
  });

  it("reports reason `unreadable` with code `ENCODING`, not a torn read", () => {
    withTempTree((dir) => {
      const path = plantBytes(dir, "board.md", ONE_INVALID_BYTE);
      const read = readVerifyReread(path);
      expect(read.ok).toBe(false);
      expect(
        read.ok === false ? read.reason : null,
        "`torn` is a statement about a WRITER. Nothing wrote this file, so reporting it torn is a " +
          "diagnosis of an event that did not happen",
      ).toBe("unreadable");
      expect(read.ok === false ? read.code : null).toBe("ENCODING");
    });
  });

  it("reads the file EXACTLY ONCE — a decode failure is not retried", () => {
    withTempTree((dir) => {
      const path = plantBytes(dir, "board.md", ONE_INVALID_BYTE);
      let attempts = 0;
      readVerifyReread(path, READ_RETRY_BOUND, {
        betweenReadAndStat: () => {
          attempts += 1;
        },
      });
      expect(
        attempts,
        "the bytes will not become decodable on attempt two, and a live screen paying three reads " +
          "and six stats per source per refresh forever is the second half of what made this " +
          "defect expensive",
      ).toBe(1);
      expect(READ_RETRY_BOUND, "PREMISE: the bound is above one, so 'once' is a real distinction").
        toBeGreaterThan(1);
    });
  });

  it("STILL reports `torn` for a file that is genuinely modified under every read", () => {
    // The discrimination the whole task turns on: correcting the detector must not delete it.
    withTempTree((dir) => {
      const path = plantBoard(dir, ONE_COLUMN);
      let attempts = 0;
      const read = readVerifyReread(path, READ_RETRY_BOUND, {
        betweenReadAndStat: () => {
          attempts += 1;
          appendFileSync(path, `- [ABC-${attempts}] written under the read\n`, "utf8");
        },
      });
      expect(attempts, "PREMISE: the seam never fired, so no tear was driven").toBe(
        READ_RETRY_BOUND,
      );
      expect(read.ok).toBe(false);
      expect(read.ok === false ? read.reason : null).toBe("torn");
      expect(read.ok === false ? read.code : null).toBe("TORN");
    });
  });
});

describe("board-read — every valid encoding round-trips byte for byte (plan 32-09, CR-03)", () => {
  const roundTrips: readonly { readonly name: string; readonly bytes: Buffer }[] = [
    { name: "pure ASCII", bytes: Buffer.from("## Backlog (WIP unlimited)\n- [ABC-001] plain\n") },
    {
      name: "multi-byte UTF-8 (a 3-byte em dash and a 4-byte emoji)",
      bytes: Buffer.from("## Backlog (WIP unlimited)\n- [ABC-001] an em dash — and \u{1F600}\n"),
    },
    {
      name: "CRLF line endings",
      bytes: Buffer.from("## Backlog (WIP unlimited)\r\n- [ABC-001] windows\r\n"),
    },
  ];

  for (const { name, bytes } of roundTrips) {
    it(`returns text that re-encodes to the exact bytes on disk — ${name}`, () => {
      withTempTree((dir) => {
        const path = plantBytes(dir, "board.md", bytes);
        const read = readVerifyReread(path);
        expect(read.ok, `${name} was refused`).toBe(true);
        const text = read.ok === true ? read.text : "";
        expect(
          Buffer.from(text, "utf8").equals(bytes),
          "the returned text does not re-encode to the bytes on disk. A multi-byte sequence is " +
            "where a size comparison against a DECODED length goes wrong, so this is the case " +
            "that fails if the agreement test ever measures characters again",
        ).toBe(true);
      });
    });
  }

  it("KEEPS a leading UTF-8 BOM in the returned text (`ignoreBOM: true` is load-bearing)", () => {
    // `TextDecoder` strips a leading byte-order mark by DEFAULT and Node's own utf8 file read does
    // not. Without `ignoreBOM: true` this change would silently alter the first line of any board a
    // Windows editor saved — a behaviour change nobody asked for, smuggled in under a bug fix.
    withTempTree((dir) => {
      const bytes = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from("## Backlog (WIP unlimited)\n- [ABC-001] saved by a windows editor\n", "utf8"),
      ]);
      const path = plantBytes(dir, "board.md", bytes);
      const read = readVerifyReread(path);
      expect(read.ok).toBe(true);
      const text = read.ok === true ? read.text : "";
      expect(
        text.charCodeAt(0),
        "the BOM was stripped, so the first line of every BOM-carrying board changed under a fix " +
          "that was supposed to change only the failure path",
      ).toBe(0xfeff);
      expect(Buffer.from(text, "utf8").equals(bytes)).toBe(true);
    });
  });

  it("PREMISE: no file in scripts/fixtures/ carries a BOM today", () => {
    // Which is exactly why the regression above would have shipped unnoticed. Recorded as a measured
    // premise rather than asserted in a docblock nobody re-runs.
    const withBom: string[] = [];
    const walk = (d: string): void => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, entry.name);
        if (entry.isDirectory()) {
          walk(p);
          continue;
        }
        const head = readFileSync(p).subarray(0, 3);
        if (head.length === 3 && head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf) {
          withBom.push(p);
        }
      }
    };
    walk(join(ROOT, "scripts", "fixtures"));
    expect(withBom, "a fixture carries a BOM — the premise above is no longer true").toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-09 — THE ADVERSARIAL RE-RUN: THE SAME DEFECT ONE REGISTER DOWN.
//
// The first fix for CR-02 gated the presence-dependent conflicts on an `ok` tickets SOURCE. Re-running
// the verifier's own reproduction against that fix, with the DIRECTORY readable and ONE ticket FILE at
// mode 000, reproduced the defect intact: the source read `ok`, the gate did not fire, and the
// projector again asserted that a file which exists does not. This repository has recorded "the fix
// created the next bypass" in eight consecutive rounds of an earlier phase; these cases are the probe
// that found this one, kept so the class stays closed rather than the instance.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — a per-ENTRY read failure degrades the whole source (plan 32-09)", () => {
  it.skipIf(IS_ROOT)("marks tickets stale and derives NO row-without-file when ONE ticket file is denied", () => {
    withTempTree((dir) => {
      plantBoard(dir, TICKETED_BOARD);
      const denied = plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      plantTicketDoc(dir, "ABC-102", "Done", "done");
      chmodSync(denied, 0o000);
      try {
        const result = readSnapshot(dir);
        // PREMISE: the DIRECTORY still lists cleanly, so this case is about the file and not about
        // the listing the earlier block already covers.
        expect(
          readdirSync(join(dir, "plans", "tickets")).sort(),
          "PREMISE: the directory listing failed, so this case is measuring the CR-02 path again " +
            "rather than the one register below it",
        ).toEqual(["ABC-101.md", "ABC-102.md"]);

        expect(
          result.snapshot.sources.tickets.source,
          "the record set is incomplete for the same reason a bounded listing's is — one of its " +
            "files could not be read — so it carries the same answer",
        ).toBe("stale");
        expect(
          result.snapshot.sources.tickets.source === "stale"
            ? result.snapshot.sources.tickets.stale.reason
            : null,
          "the badge names the CAUSE, so a human is sent to the right file",
        ).toBe("eacces");
        expect(
          result.conflicts.filter((c) =>
            (PRESENCE_DEPENDENT_CONFLICT_KINDS as readonly string[]).includes(c.kind),
          ),
          "`no ticket file carries that identifier` about a file this process could not open is " +
            "the CR-02 fabrication, one register down",
        ).toEqual([]);
        expect(result.readErrors.filter((e) => e.source === "tickets").length).toBe(1);
        // The value is still CARRIED: the ticket that WAS readable is in it. A stale source that
        // dropped what it had would trade a fabrication for an erasure.
        const carried =
          result.snapshot.sources.tickets.source === "unavailable"
            ? []
            : result.snapshot.sources.tickets.value;
        expect(carried.map((t) => t.id)).toEqual(["ABC-102"]);
      } finally {
        chmodSync(denied, 0o644);
      }
    });
  });

  it("leaves the tickets source `ok` when a document is REFUSED rather than unreadable", () => {
    // THE DISCRIMINATION. A refused document is the contract's stated behaviour: the bytes WERE
    // read, the grammar declined them by name, and the refusal is in `readErrors` with its code.
    // Degrading the source for a refusal would badge every tree carrying one malformed ticket and
    // would move the committed golden — so the rule is about obtaining bytes, not about admission.
    withTempTree((dir) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-102", "Done", "done");
      plantTicket(dir, "ABC-101.md", "no frontmatter at all, so the grammar refuses this document\n");
      const result = readSnapshot(dir);
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      expect(
        result.readErrors.filter((e) => e.source === "tickets").length,
        "PREMISE: nothing was refused, so this case measured no refusal at all",
      ).toBe(1);
    });
  });

  it.skipIf(IS_ROOT)("marks the queue stale when ONE claim record is denied", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const claimPath = plantClaim(dir, "abc-104-implement", CLAIM_BODY);
      plantClaim(dir, "abc-106-implement", CLAIM_BODY);
      chmodSync(claimPath, 0o000);
      try {
        const result = readSnapshot(dir);
        expect(
          result.snapshot.sources.queue.source,
          "an unreadable claim record left the queue `ok`, so the frame said 'this is everything " +
            "that is running' about a stage it had only partly read",
        ).toBe("stale");
        expect(result.readErrors.filter((e) => e.source === "queue").length).toBe(1);
        const rows =
          result.snapshot.sources.queue.source === "unavailable"
            ? []
            : result.snapshot.sources.queue.value;
        expect(rows.map((r) => r.task), "the record that WAS readable is still carried").toEqual([
          "abc-106-implement",
        ]);
      } finally {
        chmodSync(claimPath, 0o644);
      }
    });
  });

  it("leaves the queue `ok` for a TAMPERED claim record, which was read and refused by name", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantClaim(
        dir,
        "abc-105-tampered",
        "by: software-engineer\nat: 2026-09-14T09:00:00.000Z\nat: 2026-09-14T09:00:01.000Z\n",
      );
      const result = readSnapshot(dir);
      expect(result.snapshot.sources.queue.source).toBe("ok");
      expect(
        result.readErrors.filter((e) => e.source === "queue" && e.code === "tampered").length,
        "PREMISE: the tampered record was not reached, so this case measured nothing",
      ).toBe(1);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-10 TASK 1 — CONTAINMENT IS DECIDED ON THE REAL PATH, NOT ON THE SPELLING (CR-04).
//
// WHAT THE VERIFIER MEASURED. `repoSubpath` and `childPath` asked `relative(root, target)` about a
// path `resolve()` had normalised LEXICALLY. `resolve()` does not follow symlinks and `readFileSync`
// does, so a link planted at `plans/tickets/ZZZ-999.md` pointing at a file outside the tree passed
// the containment test by spelling and was then opened by its target — and the first forty
// characters of that target came back out in `readErrors[].message`, which is printed to stderr on
// every frame and embedded in the published `--json` document (32-VERIFICATION.md:94-103).
//
// THE SHAPE OF THE FIX THESE CASES DRIVE. One authority, `insideRoot`, deciding on `realpathSync` —
// which resolves every ANCESTOR link as well as the leaf, so a symlinked `plans/` directory and a
// symlinked ticket file are the same question asked once. The cases below drive all four arms that
// matter, because a rule nobody has watched REFUSE and nobody has watched ADMIT is not yet a control:
// an out-of-root leaf, an out-of-root ancestor, an in-root link (admitted), and a dangling link
// (absent, not refused).
//
// THE MESSAGE CARRIES NO BYTE OF THE TARGET. That is the whole finding — content crossed the
// boundary — so the assertion is over the WHOLE serialised result rather than over the one field the
// leak happened to use last time.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** The token planted in the out-of-root file. Its absence from the result is the CR-04 assertion. */
const ESCAPE_MARKER = "SECRET-TOKEN-abc123";

type EscapeTree = {
  /** The repository root under test. */
  readonly dir: string;
  /** A directory that is a SIBLING of `dir`, so nothing under it is inside the root. */
  readonly outsideDir: string;
  /** A readable file under `outsideDir` whose first line is `ESCAPE_MARKER`. */
  readonly outsideFile: string;
};

/**
 * A scratch tree plus a sibling directory OUTSIDE it, both always removed.
 *
 * The sibling is a sibling rather than a child on purpose: `relative(root, outsideDir)` must start
 * with `..` for the containment question to have a definite answer, and a temp directory nested
 * inside the root would make every case below vacuous.
 */
function withEscapeTree(run: (tree: EscapeTree) => void): void {
  const base = mkdtempSync(join(realpathSync(tmpdir()), "grugops-32-10-"));
  const dir = join(base, "tree");
  const outsideDir = join(base, "elsewhere");
  mkdirSync(dir, { recursive: true });
  mkdirSync(outsideDir, { recursive: true });
  const outsideFile = join(outsideDir, "outside-secret.txt");
  writeFileSync(outsideFile, `${ESCAPE_MARKER}\nsecond line of a file nobody in the tree wrote\n`, "utf8");
  try {
    run({ dir, outsideDir, outsideFile });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

describe("board-read — a path that resolves outside the root is refused (plan 32-10, CR-04)", () => {
  it("PREMISE: the out-of-root file is readable, carries the marker, and is NOT under the root", () => {
    withEscapeTree(({ dir, outsideFile }) => {
      expect(
        readFileSync(outsideFile, "utf8"),
        "PREMISE: the target file does not carry the marker, so every leak assertion below would " +
          "pass over a file with nothing to leak",
      ).toContain(ESCAPE_MARKER);
      expect(
        relative(realpathSync(dir), outsideFile).startsWith(".."),
        "PREMISE: the 'outside' file is inside the root, so the containment question has no answer " +
          "and these cases measure nothing",
      ).toBe(true);
    });
  });

  it("refuses a ticket symlinked OUTSIDE the root and quotes no byte of the target", () => {
    withEscapeTree(({ dir, outsideFile }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      const link = join(dir, "plans", "tickets", "ZZZ-999.md");
      symlinkSync(outsideFile, link);

      const result = readSnapshot(dir);

      expect(
        JSON.stringify(result),
        "content from outside the repository root reached the published document — the exact " +
          "exfiltration CR-04 reproduced, asserted over the WHOLE result rather than over the one " +
          "field it used last time",
      ).not.toContain(ESCAPE_MARKER);

      const refusals = result.readErrors.filter((e) => e.code === "OUTSIDE-ROOT");
      expect(
        refusals.length,
        "PREMISE/finding: the escape produced no visible refusal, so the read was either silently " +
          "skipped or silently admitted — both are the failure this case exists to refuse",
      ).toBe(1);
      expect(refusals[0]?.source).toBe("tickets");
      expect(refusals[0]?.message, "the refusal names the ENTRY a human can go look at").toContain(
        "ZZZ-999.md",
      );
      expect(
        refusals[0]?.message,
        "the refusal names WHERE the entry resolved to, which is the fact an operator acts on",
      ).toContain(outsideFile);

      // The escape is one entry's finding, not the end of the read: the legitimate ticket beside it
      // is still joined.
      const tickets =
        result.snapshot.sources.tickets.source === "unavailable"
          ? []
          : result.snapshot.sources.tickets.value;
      expect(tickets.map((t) => t.id)).toEqual(["ABC-101"]);
    });
  });

  it("refuses an out-of-root symlinked ANCESTOR (`plans` itself) without throwing", () => {
    withEscapeTree(({ dir, outsideDir }) => {
      // An entire board, outside the tree, reachable only through the linked ancestor. Pre-fix this
      // rendered as `ok` with the outside board's own column headings on screen (T-32-10-02).
      mkdirSync(join(outsideDir, "plans", "tickets"), { recursive: true });
      writeFileSync(
        join(outsideDir, "plans", "board.md"),
        `## ${ESCAPE_MARKER} (WIP unlimited)\n- [ZZZ-001] a board nobody in this tree wrote\n`,
        "utf8",
      );
      symlinkSync(join(outsideDir, "plans"), join(dir, "plans"));

      let result: SnapshotResult | null = null;
      expect(() => {
        result = readSnapshot(dir);
      }, "one hostile entry must not end the snapshot — D-12 staleness is per source").not.toThrow();
      const settled = result as SnapshotResult | null;
      expect(settled, "PREMISE: readSnapshot returned nothing to assert over").not.toBeNull();
      if (settled === null) return;

      expect(
        JSON.stringify(settled),
        "the outside board's own heading reached the published document",
      ).not.toContain(ESCAPE_MARKER);
      expect(settled.snapshot.sources.board.source).not.toBe("ok");
      expect(
        settled.readErrors.filter((e) => e.code === "OUTSIDE-ROOT").map((e) => e.source),
        "an ancestor link is the same containment question as a leaf link, asked once",
      ).toContain("board");
    });
  });

  it("ADMITS an in-root symlink and joins the ticket it points at", () => {
    // The arm that proves the rule refuses ESCAPES rather than LINKS. Without it, "refuses a
    // symlink" is satisfied by a reader that refuses every link, including the ones a real tree has.
    withEscapeTree(({ dir }) => {
      plantBoard(dir, TICKETED_BOARD);
      const realDir = join(dir, "plans", "tickets-real");
      mkdirSync(realDir, { recursive: true });
      const realTicket = join(realDir, "ABC-101.md");
      writeFileSync(
        realTicket,
        "---\nid: ABC-101\ntitle: ABC-101 title\nstatus: backlog\ncolumn: Backlog\n---\n\n# ABC-101\n",
        "utf8",
      );
      mkdirSync(join(dir, "plans", "tickets"), { recursive: true });
      symlinkSync(realTicket, join(dir, "plans", "tickets", "ABC-101.md"));

      const result = readSnapshot(dir);
      expect(
        result.readErrors.filter((e) => e.code === "OUTSIDE-ROOT"),
        "a link whose target is INSIDE the tree is not an escape, and refusing it would make the " +
          "rule something the field turns off",
      ).toEqual([]);
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      const tickets =
        result.snapshot.sources.tickets.source === "unavailable"
          ? []
          : result.snapshot.sources.tickets.value;
      expect(
        tickets.map((t) => t.id),
        "the ticket is PRESENT in the joined snapshot, not merely un-refused",
      ).toEqual(["ABC-101"]);
    });
  });

  it("answers a DANGLING symlink as absent, not as a refusal", () => {
    withEscapeTree(({ dir, outsideDir }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      // Two dangling links: one whose target would have been inside the root, one whose target would
      // have been outside it. Neither exists, so neither is an escape — a path that is not there is
      // the caller's own ENOENT arm to answer (D-13).
      symlinkSync(join(dir, "plans", "tickets", "no-such-target.md"), join(dir, "plans", "tickets", "DANG-1.md"));
      symlinkSync(join(outsideDir, "never-written.txt"), join(dir, "plans", "tickets", "DANG-2.md"));

      const result = readSnapshot(dir);
      expect(
        result.readErrors.filter((e) => e.code === "OUTSIDE-ROOT"),
        "a dangling link resolves to nothing, and 'nothing' is not outside the tree — refusing it " +
          "would turn every absent optional source into a fault, the D-13 regression this " +
          "repository has already paid for once",
      ).toEqual([]);
      const codes = result.readErrors.filter((e) => e.source === "tickets").map((e) => e.code);
      expect(codes.sort(), "both dangling entries answered as ENOENT").toEqual(["ENOENT", "ENOENT"]);
    });
  });

  it("refuses a `..`-bearing entry name under `unsafe-name`, BEFORE any filesystem access", async () => {
    // `readdirSync` cannot return `..` today. The refusal is for the day the listing comes from
    // somewhere else, and a rule added after that day is a rule added after the traversal — so the
    // arm is driven directly rather than through a listing that can never produce it.
    //
    // THE IMPORT IS DYNAMIC ON PURPOSE. A static import of a name the module does not export yet
    // makes the whole FILE fail to load, which is a load crash wearing the word RED — the
    // INVALID_RED shape that authorises a green nobody earned. Asking for the symbol at runtime
    // makes its absence an ASSERTION in this case and leaves every other case in the file measuring
    // what it was written to measure.
    type ChildPathResult =
      | { readonly ok: true; readonly path: string }
      | { readonly ok: false; readonly code: string; readonly message: string };
    const mod = (await import("./board-read.js")) as unknown as {
      childPath?: (root: string, dir: string, name: string) => ChildPathResult;
    };
    expect(
      typeof mod.childPath,
      "the per-entry path authority is not reachable, so its refusal arms are asserted by nobody",
    ).toBe("function");
    const childPath = mod.childPath;
    if (childPath === undefined) return;

    withEscapeTree(({ dir }) => {
      const root = realpathSync(dir);
      const refused = childPath(root, join(root, "plans", "tickets"), "..");
      expect(refused.ok).toBe(false);
      expect(refused.ok ? "" : refused.code).toBe("unsafe-name");
      const admitted = childPath(root, join(root, "plans", "tickets"), "ABC-101.md");
      expect(
        admitted.ok,
        "PREMISE: the authority refuses every name, so the refusal above says nothing about `..`",
      ).toBe(true);
    });
  });

  it("PREMISE: the SAME tree with no symlink in it reads exactly as it did before", () => {
    withEscapeTree(({ dir }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      plantTicketDoc(dir, "ABC-102", "Done", "done");
      const result = readSnapshot(dir);
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      expect(result.readErrors).toEqual([]);
      const tickets =
        result.snapshot.sources.tickets.source === "unavailable"
          ? []
          : result.snapshot.sources.tickets.value;
      expect(tickets.map((t) => t.id).sort()).toEqual(["ABC-101", "ABC-102"]);
    });
  });
});

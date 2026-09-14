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
import { join, sep } from "node:path";

import {
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

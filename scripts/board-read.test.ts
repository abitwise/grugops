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

import { beforeAll, describe, it, expect } from "vitest";
import ts from "typescript";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  cpSync,
  existsSync,
  linkSync,
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
import { basename, join, relative, sep } from "node:path";

import {
  BoardReadError,
  PRESENCE_DEPENDENT_CONFLICT_KINDS,
  READ_RETRY_BOUND,
  SOURCE_NAMES,
  STALE_REASONS,
  STALE_REASON_COUNT,
  boundNames,
  isSafeTaskName,
  listDirectoryBounded,
  readSnapshot,
  readTicketsSource,
  readVerifyReread,
  settleSource,
  unreadableSources,
} from "./board-read.js";
import { CONFLICT_KINDS, TICKET_REFUSAL_CODES } from "./board-model.js";
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
          // The name the DIRECTORY gave the file, beside the identifier the document declares
          // (plan 32-33). They agree here, which is the ordinary case and why the pair went
          // unpublished for so long. `toEqual` is exact, so an added field fails this case rather
          // than slipping past it.
          stem: "ABC-014",
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

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// A REFUSED DOCUMENT IS NOT AN ABSENT ONE (plan 32-15, `32-REVIEW.md` CR-01)
// ═════════════════════════════════════════════════════════════════════════════════════════════════
//
// `readTicketsSource` records a grammar refusal in `readErrors` and deliberately leaves the source
// `ok` — a refusal is the contract's stated behaviour, not a failure to obtain bytes. That is right,
// and it left `joinSnapshot` with no way to tell "no file carries this identifier" from "a file
// carries it and the grammar refused it", so a row naming a refused ticket produced a POSITIVE,
// FALSE claim about the filesystem under an `[ok]` header. CLAUDE.md's no-fabrication rule refuses
// that before it is a bug: the projector may say it could not read something; it may not say
// something is not there when it is.
//
// The fix is a TOTAL PARTITION of the tickets walk — every listed `.md` entry becomes exactly one of
// an admitted record or an unadmitted entry — carried into the join so the answer is PER IDENTIFIER.
// Degrading the whole source on one refusal would blank every other derivation on the board, which
// is the failure plan 32-10 spent a whole plan closing one register up.

/** A board carrying the admitted ticket's row AND a row for the refused document's identifier. */
const REFUSED_AND_ADMITTED_BOARD =
  "## In Development (WIP 2/2)\n- [ABC-014] Asset allocation chart\n- [ABC-900] Refused document\n";

/** `tools` is outside `TICKET_KEYS`, so the one ticket authority refuses the document by name. */
const REFUSED_TICKET = "---\nid: ABC-900\ntools: Bash\n---\n\nBody.\n";

/** The sentence the join uses for an identifier NO file carries. It must not reach a refused one. */
const ABSENCE_SENTENCE = "no ticket file carries that identifier";

describe("board-read — a REFUSED ticket is never reported as an ABSENT one (plan 32-15, CR-01)", () => {
  it("raises no claim of absence for an identifier whose file exists and was refused", () => {
    withTempTree((dir) => {
      plantBoard(dir, REFUSED_AND_ADMITTED_BOARD);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      plantTicket(dir, "ABC-900.md", REFUSED_TICKET);

      const result = readSnapshot(dir);

      // PREMISE ONE: the file is on disk and readable. A case that measured a missing fixture would
      // pass for the wrong reason.
      expect(
        readFileSync(join(dir, "plans", "tickets", "ABC-900.md"), "utf8"),
        "PREMISE: the refused document was not planted, so this case measures nothing",
      ).toBe(REFUSED_TICKET);
      // PREMISE TWO: the refusal was recorded on the channel the contract names.
      expect(
        result.readErrors.find((e) => e.path.endsWith("ABC-900.md"))?.code,
        "PREMISE: the reader did not refuse the document, so there is no fabrication to measure",
      ).toBe("unknown-key");
      // PREMISE THREE: this case does NOT close the gap by degrading the source. A refused document
      // is not a failure to obtain bytes, and plan 32-09's rule stays exactly as it left it.
      expect(result.snapshot.sources.tickets.source).toBe("ok");

      const forRefused = result.conflicts.filter((c) => c.ticketId === "ABC-900");
      expect(
        forRefused.map((c) => c.actual),
        "the projector asserted that no file on disk carries ABC-900 while the file sits there, " +
          "readable — a positive claim about a filesystem it did read",
      ).not.toContain(ABSENCE_SENTENCE);
      // And the row is still reported, naming the refusal: silence would trade one fabrication for
      // a second, quieter one.
      const raised = forRefused.filter((c) => c.kind === "row-without-file");
      expect(raised.length).toBe(1);
      expect(raised[0]?.actual).toContain("unknown-key");
      expect(raised[0]?.actual).toContain("plans/tickets/ABC-900.md");
    });
  });
});


/**
 * The refusal spellings CR-01 names, as DATA rather than as prose (plan 32-15).
 *
 * One row per spelling, one iteration below, so adding a spelling is adding a row rather than
 * copying a case. Every control character is written as an ESCAPE and never as a literal byte:
 * `npm run check:nul-bytes` scans every tracked file, and a literal tab in a fixture string is the
 * kind of thing that survives review and fails a gate.
 */
const REFUSAL_SPELLINGS = Object.freeze([
  {
    what: "a key outside the closed ticket key set",
    file: "REF-001",
    text: "---\nid: REF-001\ntools: Bash\n---\n",
    code: "unknown-key",
  },
  {
    what: "one key written twice, so the document expresses two values",
    file: "REF-002",
    text: "---\nid: REF-002\nid: REF-999\n---\n",
    code: "duplicate-key",
  },
  {
    // THE CODE MOVED IN PLAN 32-16, AND THE SPELLING STAYED. A tab used to be a member of
    // `TICKET_CONTROL`, so it was refused with a sentence that is untrue of a tab ("no terminal
    // renders it, no human wrote it deliberately"). It is now refused by the key pattern the
    // comment beside that class always claimed refused it — `unrecognized-line`, with the line
    // quoted, a finding an author can act on.
    what: "a tab inside the frontmatter region",
    file: "REF-003",
    text: "---\nid: REF-003\n\ttitle: tabbed\n---\n",
    code: "unrecognized-line",
  },
  {
    // ADDED IN PLAN 32-16 SO THE CODE STAYS REACHED. With the tab gone from the control class, the
    // table would otherwise never exercise `control-character` at all — the shape a narrowing that
    // emptied the class would also produce. Written with an escape, never as a literal byte.
    what: "a null byte inside the frontmatter region",
    file: "REF-008",
    text: "---\nid: REF-008\ntitle: a\u0000b\n---\n",
    code: "control-character",
  },
  {
    // WAS "a byte-order mark ahead of the opening delimiter" until plan 32-16, which made ONE
    // leading mark an encoding artefact the grammar normalizes away rather than a refusal. A
    // SECOND mark is content: the document is not a Windows save, and it is refused through the
    // rule that already exists. The row stays in the table because the boundary of the new
    // normalization is exactly what is worth pinning.
    what: "two byte-order marks, the second of which is content rather than an artefact",
    file: "REF-004",
    text: "\uFEFF\uFEFF---\nid: REF-004\n---\n",
    code: "no-opening-delimiter",
  },
  {
    what: "no opening delimiter at all",
    file: "REF-005",
    text: "id: REF-005\ntitle: no region here\n",
    code: "no-opening-delimiter",
  },
  {
    what: "a region that opens and never closes",
    file: "REF-006",
    text: "---\nid: REF-006\n",
    code: "no-closing-delimiter",
  },
  {
    what: "a line inside the region that is neither `key: value` nor `key:`",
    file: "REF-007",
    text: "---\nid: REF-007\njust some prose\n---\n",
    code: "unrecognized-line",
  },
] as const);

const AT = "2026-09-15T10:00:00.000Z";

describe("board-read — the tickets walk is a TOTAL partition over its own listing (plan 32-15)", () => {
  it("pins the refusal table two-sided and reaches EVERY refusal code the grammar declares", () => {
    // TWO-SIDED. A row added without a case is as much a defect as a case without a row, and the
    // second pin is derived from the grammar's own closed set rather than typed beside it.
    // EIGHT SINCE PLAN 32-16: the tab row kept its spelling and changed its code, and a null-byte
    // row joined it so `control-character` is still reached by a document rather than only by the
    // closed set it is a member of.
    expect(REFUSAL_SPELLINGS.length).toBe(8);
    expect(new Set(REFUSAL_SPELLINGS.map((r) => r.code))).toEqual(new Set(TICKET_REFUSAL_CODES));
  });

  it("counts `.md` entries from the LISTING and finds records plus unadmitted equal to it", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      for (const row of REFUSAL_SPELLINGS) plantTicket(dir, `${row.file}.md`, row.text);
      // Neither of these is in the denominator: the walk skips a non-`.md` name, and the listing
      // itself filters a half-written atomic sibling. Planting both is what makes the count a claim
      // about the PARTITION rather than about the directory's size.
      writeFileSync(join(dir, "plans", "tickets", "notes.txt"), "not a ticket\n", "utf8");
      plantTicket(dir, "ABC-014.md.tmp-4242-1-abcdef01", "---\nname: HALF\n");

      // THE DENOMINATOR IS DERIVED ON THE OTHER SIDE OF THE LOOP. A hand-typed number would rot the
      // day a row is added; a number taken from the record set would be vacuously equal to itself.
      const listing = listDirectoryBounded(join(dir, "plans", "tickets"));
      const mdEntries =
        listing.kind === "listed" ? listing.names.filter((n) => n.endsWith(".md")) : [];
      expect(
        mdEntries.length,
        "PREMISE: the listing produced no `.md` entry, so the equality below is 0 === 0",
      ).toBeGreaterThan(0);

      const settled = readTicketsSource(dir, AT, undefined, {});
      const records = settled.state.source === "ok" ? settled.state.value : [];
      expect(
        records.length + settled.unadmitted.length,
        "an entry left the walk without landing in either half: the partition is not total",
      ).toBe(mdEntries.length);
      // And both halves are non-empty, so the equality is not satisfied by one of them being the
      // whole listing — the shape a fix that admitted everything, or nothing, would also produce.
      expect(records.length).toBeGreaterThan(0);
      expect(settled.unadmitted.length).toBe(REFUSAL_SPELLINGS.length);
    });
  });

  for (const row of REFUSAL_SPELLINGS) {
    it(`records ${row.what} as unadmitted under \`${row.code}\`, leaving the source ok`, () => {
      withTempTree((dir) => {
        plantBoard(dir, ONE_COLUMN);
        plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
        plantTicket(dir, `${row.file}.md`, row.text);

        const settled = readTicketsSource(dir, AT, undefined, {});
        // The IDENTITY is the file stem, because a refused document made no statement this module
        // is willing to read. `REF-002` names `REF-999` on its second line and is still `REF-002`.
        expect(settled.unadmitted).toEqual([{ id: row.file, code: row.code }]);
        // The same refusal on the channel a human reads, with the same code.
        expect(settled.errors.find((e) => e.path.endsWith(`${row.file}.md`))?.code).toBe(row.code);
        // A REFUSAL IS NOT A FAILURE TO OBTAIN BYTES (plan 32-09). What degrades the source is
        // unchanged; degrading it here would blank every other derivation on the board.
        expect(settled.state.source).toBe("ok");
        expect(settled.state.source === "ok" ? settled.state.value.map((t) => t.id) : []).toEqual([
          "ABC-014",
        ]);
      });
    });
  }

  it("leaves the unadmitted set EMPTY when the directory holds nothing the grammar refuses", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);

      const settled = readTicketsSource(dir, AT, undefined, {});
      expect(settled.unadmitted).toEqual([]);
      expect(settled.state.source).toBe("ok");
    });
  });

  it("carries an entry refused by the PATH authority into the same half, still degrading", () => {
    if (IS_ROOT) return;
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      // A mode-0 file: the bytes cannot be obtained, which is exit two and DOES degrade the source.
      const denied = plantTicket(dir, "ABC-500.md", ADMITTED_TICKET);
      chmodSync(denied, 0o000);
      try {
        const settled = readTicketsSource(dir, AT, undefined, {});
        expect(settled.unadmitted.map((u) => u.id)).toEqual(["ABC-500"]);
        // Unchanged from plan 32-09: a failure to OBTAIN bytes is a stale source, and the new set
        // is a second fact beside that one rather than a replacement for it.
        expect(settled.state.source).toBe("stale");
      } finally {
        chmodSync(denied, 0o644);
      }
    });
  });
});


// ═════════════════════════════════════════════════════════════════════════════════════════════════
// THE UNION OF EVERY ARM THAT CONSUMES THE TICKET RECORD SET (plan 32-15, Task 3)
// ═════════════════════════════════════════════════════════════════════════════════════════════════
//
// This repository has recorded five consecutive rounds in which a fix was correct in the arm it was
// written for and wrong in a sibling arm one register over. So the arms are ENUMERATED here, each
// with the answer an UNADMITTED entry gets from it and why that answer is the honest one, and the
// case below drives all five at once over a single tree holding all three populations — a refused
// document, a genuinely absent identifier, and an admitted ticket that disagrees with its column.
//
//   1. board-vs-ticket, arm one (the ticket file names a different column)
//      An unadmitted entry is SILENT. The arm reads `t.column` off an admitted record; a refused
//      document stated no column this module is willing to read, so there is nothing to disagree
//      with. Claiming a disagreement would be inventing the ticket's side of it.
//
//   2. board-vs-ticket, arm two (the status is not the kebab form of the column)
//      SILENT, for the same reason and one field over: the arm walks `tickets`, the admitted set.
//
//   3. ticket-unplaced (a ticket file with no row)
//      SILENT, and this one is a DECISION rather than a consequence. A refused document's identity
//      is its file stem, not a statement it made; reporting "no row names this ticket" would assert
//      that a document nobody could read IS a ticket — the same fabrication in the converse
//      direction. The refusal is reported once, in `readErrors`, where it is true.
//
//   4. ticket-duplicated (one identifier carrying two or more rows)
//      UNAFFECTED. It is derived from the BOARD alone (`byId`), never from the ticket set, so a
//      refused document neither raises it nor suppresses it. Two rows are two rows.
//
//   5. row-without-file (a row naming an identifier with no admitted ticket document)
//      The ONE arm that changes. It now asks the unadmitted half too and states which fact it
//      found: the refusal and its code when the reader saw the file, the unchanged absence sentence
//      when it did not.

/** A board holding all three populations at once, plus a duplicate, under two headings. */
const UNION_BOARD =
  "## In Development (WIP unlimited)\n" +
  "- [ABC-001] Its file names a DIFFERENT column\n" +
  "- [ABC-222] Its file disagrees about status, and it is duplicated\n" +
  "- [ABC-900] Its file exists and the grammar refused it\n" +
  "- [ABC-777] No file on disk carries this identifier\n" +
  "## Done (WIP unlimited)\n" +
  "- [ABC-222] The duplicate, under a second heading\n";

const ticketDoc = (id: string, column: string, status: string): string =>
  `---\nid: ${id}\ntitle: ${id}\nstatus: ${status}\ncolumn: ${column}\n---\n\nBody.\n`;

/** Plant the union tree and read it. One tree, five arms, three populations. */
function withUnionTree(run: (result: SnapshotResult) => void): void {
  withTempTree((dir) => {
    plantBoard(dir, UNION_BOARD);
    // Arm one: the file says Done, the row sits under In Development.
    plantTicket(dir, "ABC-001.md", ticketDoc("ABC-001", "Done", "done"));
    // Arm two: kebab("In Development") is `in-development`, and the file says `blocked`.
    plantTicket(dir, "ABC-222.md", ticketDoc("ABC-222", "In Development", "blocked"));
    // Arm three: an ADMITTED ticket with no row at all.
    plantTicket(dir, "ABC-333.md", ticketDoc("ABC-333", "In Development", "in-development"));
    // The refused population. `tools` is outside the closed ticket key set.
    plantTicket(dir, "ABC-900.md", "---\nid: ABC-900\ntools: Bash\n---\n\nBody.\n");
    // ABC-777 is planted NOWHERE: that is the absent population.
    run(readSnapshot(dir));
  });
}

describe("board-read — every arm consuming the ticket record set, over one tree (plan 32-15)", () => {
  it("PREMISE: the tree reaches all five arms, so the per-arm cases below measure something", () => {
    withUnionTree((result) => {
      const kinds = new Set(result.conflicts.map((c) => c.kind));
      expect(
        ["board-vs-ticket", "ticket-unplaced", "ticket-duplicated", "row-without-file"].filter(
          (k) => !kinds.has(k as (typeof CONFLICT_KINDS)[number]),
        ),
        "PREMISE: a kind the union case asserts about was never derived at all",
      ).toEqual([]);
      expect(result.snapshot.sources.tickets.source).toBe("ok");
    });
  });

  it("ARM 1: board-vs-ticket on COLUMN fires for the admitted disagreement and for nothing refused", () => {
    withUnionTree((result) => {
      const columnArm = result.conflicts.filter(
        (c) => c.kind === "board-vs-ticket" && c.expected !== "in-development",
      );
      expect(columnArm.map((c) => c.ticketId).sort()).toEqual(["ABC-001", "ABC-222"]);
      expect(columnArm.map((c) => c.ticketId)).not.toContain("ABC-900");
    });
  });

  it("ARM 2: board-vs-ticket on STATUS fires from the admitted set only", () => {
    withUnionTree((result) => {
      const statusArm = result.conflicts.filter(
        (c) => c.kind === "board-vs-ticket" && c.expected === "in-development",
      );
      expect(statusArm.map((c) => c.ticketId)).toEqual(["ABC-222"]);
      expect(statusArm[0]?.actual).toBe("blocked");
    });
  });

  it("ARM 3: ticket-unplaced names the ADMITTED unplaced ticket and never the refused one", () => {
    withUnionTree((result) => {
      const unplaced = result.conflicts.filter((c) => c.kind === "ticket-unplaced");
      expect(unplaced.map((c) => c.ticketId)).toEqual(["ABC-333"]);
      expect(unplaced.map((c) => c.ticketId)).not.toContain("ABC-900");
    });
  });

  it("ARM 4: ticket-duplicated is derived from the BOARD, so a refusal neither adds nor hides it", () => {
    withUnionTree((result) => {
      const duplicated = result.conflicts.filter((c) => c.kind === "ticket-duplicated");
      expect(duplicated.map((c) => c.ticketId)).toEqual(["ABC-222"]);
      expect(duplicated[0]?.actual).toBe("In Development, Done");
    });
  });

  it("ARM 5: row-without-file tells the REFUSED identifier apart from the ABSENT one", () => {
    withUnionTree((result) => {
      const rows = result.conflicts.filter((c) => c.kind === "row-without-file");
      expect(rows.map((c) => c.ticketId).sort()).toEqual(["ABC-777", "ABC-900"]);

      const refused = rows.find((c) => c.ticketId === "ABC-900");
      expect(refused?.actual).toContain("unknown-key");
      expect(refused?.actual).toContain("plans/tickets/ABC-900.md");
      expect(refused?.actual).not.toContain(ABSENCE_SENTENCE);

      const absent = rows.find((c) => c.ticketId === "ABC-777");
      // BYTE FOR BYTE, because an identifier the reader never saw is still one no file carries.
      expect(absent?.actual).toBe(ABSENCE_SENTENCE);

      // And the refusal survives on the OTHER channel too, with the same code.
      expect(
        result.readErrors.find((e) => e.path.endsWith("ABC-900.md"))?.code,
      ).toBe("unknown-key");
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// THE REPRODUCTION, AGAINST THE ARTIFACT A HOST ACTUALLY RUNS (plan 32-15, Task 3)
// ═════════════════════════════════════════════════════════════════════════════════════════════════
//
// `32-14-ADVERSARIAL-REVIEW.md` §0 states the premise rule: a transcript is run against the
// COMMITTED `.js`, never against the `.ts` through a loader. The verifier's gap-1 reproduction is
// replayed here in its exact shape — one added board row for an identifier, one readable ticket
// document for it holding one key outside the closed set — on a DISPOSABLE COPY of the committed
// fixture tree, outside the repository root, removed in a `finally`. The committed fixture is an
// input to the golden; a run that modified it would move a byte-for-byte comparison out from under
// another suite.

const DASHBOARD_JS = join(ROOT, "scripts", "board-dashboard.js");
const FIXTURE_TREE = join(ROOT, "scripts", "fixtures", "board-snapshot");

/** A throwaway copy of the committed fixture tree, in a scratch root outside the repository. */
function withFixtureCopy(body: (dir: string) => void): void {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), "grugops-32-15-repro-"));
  try {
    cpSync(FIXTURE_TREE, dir, { recursive: true });
    body(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("board-read — the verifier's gap-1 reproduction, against the committed .js (plan 32-15)", () => {
  it("names the refusal rather than absence, on BOTH the JSON and the plain frame", () => {
    withFixtureCopy((dir) => {
      // The verifier's shape, planted on the copy: a row, and a readable document the grammar
      // refuses by name. `tools` is outside the closed ticket key set.
      const board = join(dir, "plans", "board.md");
      appendFileSync(
        board,
        "\n## Ready (WIP 1/5)\n\n- [ABC-900] A row whose ticket document is refused\n",
        "utf8",
      );
      writeFileSync(
        join(dir, "plans", "tickets", "ABC-900.md"),
        "---\nid: ABC-900\ntools: Bash\n---\n\nBody.\n",
        "utf8",
      );

      const json = spawnSync(process.execPath, [DASHBOARD_JS, dir, "--once", "--json"], {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 20_000,
      });
      expect(json.status).toBe(0);
      const parsed = JSON.parse(json.stdout ?? "") as {
        conflicts: readonly { kind: string; ticketId?: string; actual: string }[];
        readErrors: readonly { path: string; code: string }[];
      };

      const forRefused = parsed.conflicts.filter((c) => c.ticketId === "ABC-900");
      expect(
        forRefused.length,
        "PREMISE: the reproduction produced no conflict for ABC-900 at all, so the assertions " +
          "below are satisfied by a run that derived nothing",
      ).toBe(1);
      expect(forRefused[0]?.kind).toBe("row-without-file");
      expect(forRefused[0]?.actual).toContain("unknown-key");
      expect(forRefused[0]?.actual).not.toContain(ABSENCE_SENTENCE);

      // The refusal on the OTHER published channel, naming the path it was refused at.
      expect(
        parsed.readErrors.some((e) => e.path.endsWith("ABC-900.md") && e.code === "unknown-key"),
        "the refusal reached no readErrors entry, so a consumer has only the conflict sentence",
      ).toBe(true);

      // The committed fixture STILL raises the honest absence claim for its own ABC-999 row, so
      // this run proves the two populations are told apart rather than that one was silenced.
      const forAbsent = parsed.conflicts.filter((c) => c.ticketId === "ABC-999");
      expect(forAbsent.length).toBe(1);
      expect(forAbsent[0]?.actual).toBe(ABSENCE_SENTENCE);

      const plain = spawnSync(process.execPath, [DASHBOARD_JS, dir, "--once"], {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 20_000,
      });
      expect(plain.status).toBe(0);
      // The identifier is named on the frame a human reads, not only in the machine document.
      expect(plain.stdout).toContain("ABC-900");
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
      // THE WORDING IS PORTED AND LOAD-BEARING, so it is pinned rather than described (plan 32-17).
      // Three sibling arms gained reports in plan 32-17; this is the one that was already there,
      // and a rewrite of it while "making the four consistent" is the change this pin refuses.
      expect(named?.message).toBe(
        `${tampered} carries 2 \`at:\` lines and a claim record is written with exactly one. The ` +
          `record is skipped rather than trusted on either line: a forged second \`at:\` is a ` +
          `queue-lock denial of service (scripts/claim.ts:270-306).`,
      );
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
      // AND IT IS REPORTED (plan 32-17, IN-02). Skipping it silently is what the docblock's
      // "this reader REPORTS the skip" sentence promised it would not do.
      const named = result.readErrors.find((e) => e.code === "unsafe-task-name");
      expect(named?.source).toBe("queue");
      expect(
        named?.message.includes("bad name"),
        "the entry is named, because a human told only that SOMETHING was skipped cannot find it",
      ).toBe(true);
      expect(
        named?.path,
        "NOT a composed path: the segment is exactly what is refused, so joining it here would " +
          "perform the join the arm exists to prevent (the `childPath` convention)",
      ).toBe(join(dir, ".grugops", "queue", "claimed"));
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

  it("REPORTS a claimed directory with no claim.md at all (plan 32-17, IN-02)", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantClaim(dir, "ABC-014", GOOD_CLAIM);
      mkdirSync(join(dir, ".grugops", "queue", "claimed", "ABC-016"), { recursive: true });

      const result = readSnapshot(dir);
      const queue = result.snapshot.sources.queue;
      expect(queue.source === "ok" ? queue.value.map((r) => r.task) : []).toEqual(["ABC-014"]);

      const named = result.readErrors.find((e) => e.code === "no-claim-record");
      expect(named?.source).toBe("queue");
      expect(named?.path).toBe(join(dir, ".grugops", "queue", "claimed", "ABC-016", "claim.md"));
      expect(
        queue.source,
        "a claimed task with no record is a record REFUSED, not bytes that could not be obtained: " +
          "the source stays `ok`, exactly as it does for a tampered record",
      ).toBe("ok");
    });
  });

  it("REPORTS a claim record with no `at:` line (plan 32-17, IN-02)", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const path = plantClaim(dir, "ABC-014", "by: engineer\n");
      const result = readSnapshot(dir);
      const queue = result.snapshot.sources.queue;
      expect(queue.source === "ok" ? queue.value : null).toEqual([]);

      // THE SAME MALFORMED-RECORD CLASS THE `at:`-COUNT RULE REPORTS AS `tampered`, one register
      // over: a record that exists and carries no timestamp used to vanish while a record carrying
      // two was named. A human watching a live screen was told about one and not the other.
      const named = result.readErrors.find((e) => e.code === "no-at");
      expect(named?.source).toBe("queue");
      expect(named?.path).toBe(path);
      expect(queue.source).toBe("ok");
    });
  });

  it("accounts for EVERY claimed entry: rows plus reported skips (plan 32-17, IN-02)", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      // FIVE ENTRIES, FIVE KINDS — one row and the four ways this loop leaves without one.
      plantClaim(dir, "ABC-001", GOOD_CLAIM);
      mkdirSync(join(dir, ".grugops", "queue", "claimed", "ABC-002"), { recursive: true });
      plantClaim(dir, "ABC-003", "by: engineer\n");
      plantClaim(
        dir,
        "ABC-004",
        "by: engineer\nat: 2026-09-14T09:00:00.000Z\nat: 1970-01-01T00:00:00.000Z\n",
      );
      plantClaim(dir, "bad name", GOOD_CLAIM);

      const result = readSnapshot(dir);
      const queue = result.snapshot.sources.queue;

      // THE DENOMINATOR IS DERIVED FROM THE LISTING, on the other side of the loop — never from the
      // rows or the errors, which would make the equality vacuously true of itself.
      const claimedDir = join(dir, ".grugops", "queue", "claimed");
      const listing = listDirectoryBounded(claimedDir);
      const claimed = listing.kind === "listed" ? listing.names.length : 0;
      expect(
        claimed,
        "PREMISE: the claimed stage listed nothing, so the equality below is 0 === 0 and measures " +
          "no reader at all",
      ).toBeGreaterThan(0);
      expect(claimed).toBe(5);

      const rows = queue.source === "ok" ? queue.value.length : -1;
      const skips = result.readErrors.filter(
        (e) =>
          e.source === "queue" && (e.path === claimedDir || e.path.startsWith(`${claimedDir}${sep}`)),
      );
      expect(
        rows + skips.length,
        "the reader's docblock says it REPORTS the skip; a claimed entry that is neither a row nor " +
          "a named skip is a claim the screen makes silently. Rows: " +
          `${rows}, reported skips: ${skips.map((e) => e.code).join(", ")}`,
      ).toBe(claimed);
      expect(rows).toBe(1);
      expect(new Set(skips.map((e) => e.code))).toEqual(
        new Set(["no-claim-record", "no-at", "tampered", "unsafe-task-name"]),
      );
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

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-17, WR-09 — WHICH ENTRIES SURVIVE THE BOUND IS DECIDED BY NAME, NOT BY THE FILESYSTEM.
//
// The prior code sliced the raw `readdirSync` order and the callers sorted afterwards, so the ORDER
// was deterministic and the MEMBERSHIP was not: once the bound bites, WHICH entries survive is a
// function of the filesystem, and two machines reading one tree report different ticket sets and
// different `ticket-unplaced` conflicts.
//
// THE ASSERTION IS PURE RATHER THAN A RACE. Driving this through a real directory means planting
// MAX_WALK_ENTRIES + 1 files and hoping the filesystem hands them back out of order — slow, and a
// case that passes for the wrong reason on any filesystem that happens to list in sorted order.
// `boundNames` takes the entry list and the bound as arguments, so the property is asserted over a
// list this file shuffles itself, deterministically, on every machine.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** `n` names whose sorted order is known, handed back in an order that is deliberately not it. */
function shuffledNames(n: number): string[] {
  const sorted = Array.from({ length: n }, (_, i) => `t-${String(i).padStart(4, "0")}.md`);
  // A FIXED PERMUTATION, NOT `Math.random`. A random shuffle makes a failure unreproducible, and a
  // case that fails once a week is a case a reader learns to ignore. Reversing then rotating puts
  // the alphabetically-first names at the END, which is exactly where a filesystem that lists by
  // inode can put them.
  const reversed = [...sorted].reverse();
  return [...reversed.slice(3), ...reversed.slice(0, 3)];
}

describe("board-read — membership under the walk bound is by NAME (plan 32-17, WR-09)", () => {
  it("keeps the alphabetically FIRST `max` names of a shuffled list longer than the bound", () => {
    const entries = shuffledNames(12);
    expect(
      entries.slice(0, 5),
      "PREMISE: the input arrived already sorted, so this case cannot tell a sort from its absence",
    ).not.toEqual([...entries].sort().slice(0, 5));

    const bound = boundNames(entries, 5);
    expect(bound.bounded).toBe(true);
    expect(
      bound.names,
      "which entries survive the bound is a function of the filesystem's listing order, so two " +
        "machines reading one tree report different sets — the failure the sort exists to prevent",
    ).toEqual(["t-0000.md", "t-0001.md", "t-0002.md", "t-0003.md", "t-0004.md"]);
  });

  it("returns every name SORTED when the list is at or below the bound", () => {
    const entries = shuffledNames(6);
    const bound = boundNames(entries, 6);
    expect(bound.bounded).toBe(false);
    expect(bound.names).toEqual([...entries].sort());
    expect(bound.names.length, "no entry may be dropped when the bound does not bite").toBe(6);
  });

  it("filters the atomic-write siblings BEFORE the sort and BEFORE the bound", () => {
    // The temporary sorts between `a.md` and `b.md`, so a filter applied AFTER the bound would
    // spend one of the three slots on a half-written file and drop a real one.
    const entries = ["c.md", "a.md.tmp-42-1-abcdef01", "b.md", "a.md", "d.md"];
    const bound = boundNames(entries, 3);
    expect(bound.names).toEqual(["a.md", "b.md", "c.md"]);
    expect(bound.bounded).toBe(true);
  });

  it("applies the bound at `max`, not at `max` plus one", () => {
    expect(boundNames(["b", "a"], 2)).toEqual({ names: ["a", "b"], bounded: false });
    expect(boundNames(["c", "b", "a"], 2)).toEqual({ names: ["a", "b"], bounded: true });
  });

  it("hands a REAL directory's listing back sorted, so no caller needs a sort of its own", () => {
    withTempTree((dir) => {
      const ticketsDir = join(dir, "plans", "tickets");
      mkdirSync(ticketsDir, { recursive: true });
      // Written in an order that is not their sorted order; the filesystem is free to return either.
      for (const name of ["ZZZ-001.md", "ABC-014.md", "MNO-007.md", "ABC-002.md"]) {
        writeFileSync(join(ticketsDir, name), "x\n", "utf8");
      }
      const listing = listDirectoryBounded(ticketsDir);
      expect(listing.kind).toBe("listed");
      const names = listing.kind === "listed" ? [...listing.names] : [];
      expect(names.length, "PREMISE: the directory listed empty, so nothing was measured").toBe(4);
      expect(
        names,
        "the two caller-side `[...listing.names].sort()` spellings were deleted in plan 32-17: a " +
          "second sort beside a sorted producer is a second spelling of one rule",
      ).toEqual([...names].sort());
    });
  });

  it("is the ONLY place the bound is applied — `listDirectoryBounded` carries no slice of its own", () => {
    // DERIVED FROM THE FILE, not asserted by reading the code once and trusting the memory of it.
    const source = readFileSync(join(ROOT, "scripts", "board-read.ts"), "utf8");
    const body = source.slice(source.indexOf("export function listDirectoryBounded"));
    const end = body.indexOf("\n}\n");
    const fn = body.slice(0, end);
    expect(fn.includes("MAX_WALK_ENTRIES")).toBe(true);
    expect(
      fn.includes(".slice("),
      "a second application of the bound inside the listing is a second spelling of the rule " +
        "`boundNames` exists to be the only holder of",
    ).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-17, WR-08 — ONE IDENTIFIER, ONE RESOLUTION, ONE REPORT.
//
// Two ticket files claiming one `id` used to produce the WORST of both postures at once: the second
// record was discarded by `ticketById` with no record anywhere, while the status arm and the
// unplaced arm still iterated the RAW list — so the same duplicate was silently resolved in one
// place and DOUBLE-reported in another, and both survived the total order because the tiebreak
// chain ends on `expected`, which is equal for the two. `agent-factory/contracts/board.md` promises
// the projector reports every conflict and resolves none.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — two files claiming one identifier (plan 32-17, WR-08)", () => {
  /** Two files, different names, the same stated `id`, and a status the board column disagrees with. */
  function plantDuplicatePair(dir: string): { first: string; second: string } {
    // `ABC-014-copy.md` sorts BEFORE `ABC-014.md` — `-` is 0x2D and `.` is 0x2E — so the file a
    // reader would call "the copy" is the one first-by-name keeps. That is the point: the rule is
    // stated and deterministic, not the one a human would have guessed.
    // THE COLUMN AGREES AND THE STATUS DOES NOT, deliberately: that isolates the arm under test.
    // `Backlog` kebabs to `backlog`, so `status: done` disagrees while `column: Backlog` matches
    // the heading the row sits under — the column arm stays silent and only the status arm fires.
    const first = plantTicket(
      dir,
      "ABC-014-copy.md",
      "---\nid: ABC-014\ntitle: The copy\nstatus: done\ncolumn: Backlog\n---\n",
    );
    const second = plantTicket(
      dir,
      "ABC-014.md",
      "---\nid: ABC-014\ntitle: The original\nstatus: done\ncolumn: Backlog\n---\n",
    );
    return { first, second };
  }

  it("REPORTS the duplicate by name, saying which file it kept", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const { first, second } = plantDuplicatePair(dir);

      const result = readSnapshot(dir);
      expect(
        result.snapshot.sources.tickets.source,
        "PREMISE: the tickets source did not read cleanly, so nothing below measures the join",
      ).toBe("ok");

      const named = result.readErrors.find((e) => e.code === "duplicate-id");
      expect(
        named?.source,
        "the second file was discarded with no record ANYWHERE: no conflict kind, no read error, " +
          "nothing on the screen. A tree can be given a ticket nobody sees.",
      ).toBe("tickets");
      // BOTH NAMES, and the entry's own path is the file that LOST — the one whose values no arm
      // of the frame is about, which is the file a reader needs pointed at.
      expect(named?.path).toBe(second);
      expect(named?.message.includes(basename(first))).toBe(true);
      expect(named?.message.includes(basename(second))).toBe(true);
      expect(
        named?.message.includes(`${basename(first)} is the one joined`),
        "naming both files without saying which one WON leaves a reader unable to predict what " +
          "the rest of the frame is about",
      ).toBe(true);
    });
  });

  it("raises exactly ONE board-vs-ticket status conflict for the duplicated identifier", () => {
    withTempTree((dir) => {
      // `Backlog` kebabs to `backlog`; both files state `done`, so both disagree identically.
      plantBoard(dir, ONE_COLUMN);
      plantDuplicatePair(dir);

      const conflicts = readSnapshot(dir).conflicts.filter(
        (c) => c.kind === "board-vs-ticket" && c.ticketId === "ABC-014",
      );
      expect(
        conflicts.length,
        "two identical entries survive the total order because the tiebreak chain ends on " +
          "`expected`, which is equal for the two — so a human reads one disagreement twice. " +
          `Got: ${JSON.stringify(conflicts)}`,
      ).toBe(1);
      expect(conflicts[0]?.actual).toBe("done");
      expect(conflicts[0]?.expected).toBe("backlog");
    });
  });

  it("raises exactly ONE ticket-unplaced conflict when no row names the identifier", () => {
    withTempTree((dir) => {
      plantBoard(dir, "## Backlog (WIP unlimited)\n- [ABC-001] Something else\n");
      plantDuplicatePair(dir);

      const unplaced = readSnapshot(dir).conflicts.filter((c) => c.kind === "ticket-unplaced");
      expect(unplaced.map((c) => c.ticketId)).toEqual(["ABC-014"]);
    });
  });

  it("keeps the ADMITTED file when its twin was refused, and still reports the refusal", () => {
    // THE OVERLAP PLAN 32-15 OPENED. One identifier, two files: one admitted, one refused by the
    // grammar. That puts the same id in `ticketById` AND in `unadmittedById`, and the arm order is
    // what decides the answer. The admitted record wins: no `row-without-file` at all, because a
    // file WAS admitted for that row — and the refusal is still visible in `readErrors`.
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      const refused = plantTicket(dir, "ABC-014-copy.md", "---\nid: ABC-014\ntools: Bash\n---\n");

      const result = readSnapshot(dir);
      expect(
        result.conflicts.filter((c) => c.kind === "row-without-file").map((c) => c.ticketId),
        "a row whose identifier WAS admitted from some file is not a row without a file, whatever " +
          "a second file of the same identifier did",
      ).toEqual([]);
      const named = result.readErrors.find((e) => e.path === refused);
      expect(named?.code).toBe("unknown-key");
      expect(
        result.readErrors.some((e) => e.code === "duplicate-id"),
        "a refused document states no identifier the reader believes — its identity is a file " +
          "stem — so it is NOT a second claim on the identifier and no duplicate is invented",
      ).toBe(false);
    });
  });

  it("raises no duplicate record when every identifier is claimed once", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      const result = readSnapshot(dir);
      expect(result.readErrors.filter((e) => e.code === "duplicate-id")).toEqual([]);
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE CONTEXT READER'S LAST TWO SILENT SKIPS (plan 32-34, IN-01, DASH-03).
//
// The QUEUE reader has reported its allow-list rejection by name since plan 32-17, and its walk is
// asserted total against a denominator taken from its own listing. Its SIBLING performed the same
// rejection — same predicate, same argument in hand — with a bare `continue`, and skipped a plain
// file sitting among the task directories the same way. A reader whose claim is "every listed entry
// leaves this loop as exactly one of a row or a reported finding" was false here, in silence, which
// is the half no count of findings can catch. `32-34-RED-baseline.txt` records three listed entries
// producing one row and zero reported skips.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — every `.grugops/context/` entry is a row or a NAMED finding (plan 32-34)", () => {
  /** A minimal, legitimate context task: one directory with an empty rendered index. */
  function plantTask(dir: string, task: string): void {
    mkdirSync(join(dir, ".grugops", "context", task), { recursive: true });
    writeFileSync(join(dir, ".grugops", "context", task, "index.jsonl"), "", "utf8");
  }

  it("names an entry outside the ported allow-list instead of skipping it", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTask(dir, "abc-014-implement");
      mkdirSync(join(dir, ".grugops", "context", "bad name!"), { recursive: true });

      const result = readSnapshot(dir);
      const named = result.readErrors.filter((e) => e.code === "unsafe-task-name");
      expect(
        named.map((e) => e.source),
        "the entry left the walk with no channel naming it — a human told only that the context " +
          "holds one task cannot tell that from a context whose second entry this reader would " +
          "not walk",
      ).toEqual(["context"]);
      expect(
        named[0]?.message,
        "a code with no sentence is a skip with a label",
      ).toContain("bad name!");
      expect(
        named[0]?.path,
        "the PATH is the context directory, never a composed one: joining the refused segment " +
          "with its directory here would perform the join the arm exists to prevent",
      ).toBe(join(dir, ".grugops", "context"));
      // A NAMING REFUSAL IS NOT A FAILURE TO OBTAIN BYTES, the rule the queue reader's twin states.
      expect(result.snapshot.sources.context.source).toBe("ok");
    });
  });

  it("names a plain FILE sitting among the task directories under its own code", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTask(dir, "abc-014-implement");
      writeFileSync(join(dir, ".grugops", "context", "notes.md"), "not a task\n", "utf8");

      const result = readSnapshot(dir);
      const named = result.readErrors.filter((e) => e.code === "not-a-directory");
      expect(named.map((e) => e.source)).toEqual(["context"]);
      expect(named[0]?.path).toBe(join(dir, ".grugops", "context", "notes.md"));
      expect(named[0]?.message).toContain("is not a directory");
      expect(result.snapshot.sources.context.source).toBe("ok");
    });
  });

  it("keeps the walk TOTAL, against a denominator derived from the listing", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTask(dir, "abc-014-implement");
      plantTask(dir, "abc-015-review");
      mkdirSync(join(dir, ".grugops", "context", "bad name!"), { recursive: true });
      writeFileSync(join(dir, ".grugops", "context", "notes.md"), "not a task\n", "utf8");

      // THE DENOMINATOR IS TAKEN FROM THE LISTING, on the other side of the loop that consumed it —
      // plan 32-15's instrument, which is the only one a silent new arm cannot satisfy. A number
      // taken from the rows would be vacuously equal to itself.
      const listing = listDirectoryBounded(join(dir, ".grugops", "context"));
      const entries = listing.kind === "listed" ? listing.names : [];
      expect(
        entries.length,
        "PREMISE: the listing produced nothing, so the equality below is 0 === 0",
      ).toBe(4);

      const result = readSnapshot(dir);
      const context = result.snapshot.sources.context;
      const rows = context.source === "ok" ? context.value : [];
      const skips = result.readErrors.filter(
        (e) => e.source === "context" && e.code !== "PARSE",
      );
      expect(
        rows.length + skips.length,
        "an entry left the walk without landing in either half: the walk is not total, and the " +
          "entries that vanished did so with no channel naming them",
      ).toBe(entries.length);
      // Both halves non-empty, so the equality is not satisfied by one population having swallowed
      // the listing — the shape a reader that rowed everything, or refused everything, also has.
      expect(rows.map((r) => r.task)).toEqual(["abc-014-implement", "abc-015-review"]);
      expect(skips.map((e) => e.code).sort()).toEqual(["not-a-directory", "unsafe-task-name"]);
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

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-10 TASK 2 — A REFUSAL IS ONE SOURCE'S FINDING, AND THE ROUTING IS DERIVED FROM THE FILE.
//
// CR-04 was two functions comparing the wrong thing. The defect CLASS is that a read target can be
// built in this module WITHOUT passing through a path authority, and nothing says so — the bare
// `join(taskDir, "claim.md")` and `join(taskDir, "index.jsonl")` were exactly that, sitting beside a
// containment rule they never consulted, for the same reason `repoSubpath` was exempted from its own
// rule: the argument that a literal is safe.
//
// So the two censuses below are DERIVED by parsing `scripts/board-read.ts` with the `typescript`
// package — the idiom `scripts/board-readonly.test.ts` and this file's own swallow census already
// use. A read target built outside the authorities, or a seventh source read without a guard, is
// then something the suite SAYS, not something a reviewer has to notice.
//
// BOTH CENSUSES ASSERT THEIR OWN PREMISE FIRST. A claim of "no findings" is satisfied equally by a
// clean file and by a walk that collected nothing, and this repository has recorded a false
// verification-harness premise six times across four rounds.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** The four read primitives named in this module. Every one takes its path as argument zero. */
const READ_PRIMITIVES = Object.freeze(["readVerifyReread", "statSync", "existsSync", "readdirSync"]);

/** A call site the census could not vouch for: the finding, printed by name and line. */
type UnvouchedSite = { readonly fn: string; readonly line: number; readonly text: string };

/** A callee this pass could not reduce to a name — a route to a primitive it cannot check. */
type UnresolvedCallee = { readonly fn: string; readonly line: number; readonly text: string };

type RoutingCensus = {
  /** Every function that calls `realpathSync` or `insideRoot` — the module's path authorities. */
  readonly producers: readonly string[];
  /** Read-primitive (and path-helper) call sites the walk inspected. Zero means it measured nothing. */
  readonly inspected: number;
  /** Call sites whose path argument was not produced by an authority. */
  readonly unvouched: readonly UnvouchedSite[];
  /** Functions that take a path as a PARAMETER and hand it to a primitive — derived, not typed. */
  readonly pathHelpers: readonly string[];
  /** Every function-like node the walk entered into its universe, named. THE DENOMINATOR. */
  readonly universe: readonly string[];
  /** Callees the pass could not name. COLLECTED, never skipped — a skip is how WR-10 existed. */
  readonly unresolvedCallees: readonly UnresolvedCallee[];
};

/**
 * Derive, from `scripts/board-read.ts` itself, where every read target in it comes from.
 *
 * THE ALLOWED PRODUCERS ARE DERIVED, NOT TYPED. A hand-written list of authority names is the
 * set-literal drift class this repository has already paid for twice: the list would be correct on
 * the day it was written and silently short on the day a seventh authority appeared. So the producer
 * set is "every function in this module that calls `realpathSync` or `insideRoot`" — which is what
 * being a path authority MEANS here — and the census then pins that derived set two-sided.
 *
 * THE PATH HELPERS ARE DERIVED TOO, by closure. A function that hands one of its own PARAMETERS to a
 * read primitive is a function whose caller vouched for the path; it becomes a path helper, and its
 * own call sites are then held to the same rule. `readVerifyReread` and `gatherFile` fall out of
 * that fixpoint rather than being exempted by name.
 *
 * WHAT BOUNDS THIS CENSUS'S INPUT (plan 32-21, WR-10). The derivation was correct and its UNIVERSE
 * was narrow: `functions` was populated only from `ts.isFunctionDeclaration`, so a module-level
 * arrow was never entered into it, and `calleeName` returned `""` for anything that was not a bare
 * identifier, so a namespace-style `fs.statSync(p)` was skipped. `inspected` printed a healthy 17
 * either way — an unmeasured site and a clean site are the same number. Each sentence below is a
 * boundary with a case of its own beneath.
 *
 *   UNIVERSE      every FUNCTION-LIKE node — declaration, function expression, arrow, method,
 *                 accessor, constructor — plus a synthetic `<module top level>` member for the
 *                 statements outside all of them. An arrow or function expression is named by its
 *                 owning variable declaration or property assignment, exactly as
 *                 `enclosingFunctionName` in `board-dashboard.test.ts` already does; anything
 *                 nameless gets a STABLE marker (`<anonymous function>`) and its findings still
 *                 carry a line, so a finding names a place without pinning a line number.
 *   ATTRIBUTION   a call belongs to its INNERMOST enclosing universe member, so no call is counted
 *                 twice. Lexical scope is honoured in both directions: a nested function sees the
 *                 identifiers its ancestors produced, and a parameter handed to a primitive makes
 *                 the ANCESTOR that declares it the path helper.
 *   CALLEE        resolved to a name from a bare identifier, from the rightmost name of a property
 *                 access (`fs.statSync` -> `statSync`), from a string-literal element access
 *                 (`fs["statSync"]` -> `statSync`), and from `super`.
 *   UNRESOLVABLE  anything else — a computed element access, an immediately-invoked expression, a
 *                 call on a conditional — is COLLECTED into `unresolvedCallees` and pinned empty
 *                 against the live module. It is not skipped: a skip is precisely how a route to a
 *                 primitive stayed invisible while `inspected` looked healthy.
 */
function routingCensus(absPath: string): RoutingCensus {
  const text = readFileSync(absPath, "utf8");
  const source = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true);

  const lineOf = (n: ts.Node): number =>
    source.getLineAndCharacterOfPosition(n.getStart(source)).line + 1;

  /** Every shape that has its own parameter list and its own body. */
  const isFunctionLike = (n: ts.Node): n is ts.SignatureDeclaration =>
    ts.isFunctionDeclaration(n) ||
    ts.isFunctionExpression(n) ||
    ts.isArrowFunction(n) ||
    ts.isMethodDeclaration(n) ||
    ts.isGetAccessorDeclaration(n) ||
    ts.isSetAccessorDeclaration(n) ||
    ts.isConstructorDeclaration(n);

  /** The name a finding reports a place by. Arrows take their owner's name (board-dashboard idiom). */
  const nameOf = (n: ts.Node): string => {
    if (ts.isFunctionDeclaration(n)) return n.name?.text ?? "<anonymous function>";
    if (ts.isMethodDeclaration(n) || ts.isGetAccessorDeclaration(n) || ts.isSetAccessorDeclaration(n)) {
      return ts.isIdentifier(n.name) ? n.name.text : "<method>";
    }
    if (ts.isConstructorDeclaration(n)) return "<constructor>";
    const owner = n.parent as ts.Node | undefined;
    if (owner !== undefined && ts.isVariableDeclaration(owner) && ts.isIdentifier(owner.name)) {
      return owner.name.text;
    }
    if (owner !== undefined && ts.isPropertyAssignment(owner) && ts.isIdentifier(owner.name)) {
      return owner.name.text;
    }
    return "<anonymous function>";
  };

  type Member = {
    readonly name: string;
    readonly node: ts.Node;
    readonly params: readonly string[];
    readonly parent: Member | null;
  };

  // The statements outside every function are a member too: a read at module scope is a read.
  const MODULE_MEMBER: Member = {
    name: "<module top level>",
    node: source,
    params: [],
    parent: null,
  };
  const members: Member[] = [];
  const collect = (node: ts.Node, parent: Member): void => {
    let next = parent;
    if (isFunctionLike(node)) {
      const entry: Member = {
        name: nameOf(node),
        node,
        params: node.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : "")),
        parent,
      };
      members.push(entry);
      next = entry;
    }
    ts.forEachChild(node, (child) => collect(child, next));
  };
  collect(source, MODULE_MEMBER);
  const universe: readonly Member[] = [MODULE_MEMBER, ...members];

  const unresolvedCallees: UnresolvedCallee[] = [];

  /** The callee's name, or `null` when this pass cannot reduce it to one. */
  const resolveCallee = (call: ts.CallExpression): string | null => {
    const e = call.expression;
    if (ts.isIdentifier(e)) return e.text;
    if (ts.isPropertyAccessExpression(e)) return e.name.text;
    if (ts.isElementAccessExpression(e)) {
      const key = e.argumentExpression;
      if (ts.isStringLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key)) return key.text;
      return null;
    }
    if (e.kind === ts.SyntaxKind.SuperKeyword) return "super";
    return null;
  };
  const calleeName = (call: ts.CallExpression): string => resolveCallee(call) ?? "";

  /** Every call inside `member`, without descending into a NESTED function-like node. */
  const callsIn = (member: Member): ts.CallExpression[] => {
    const out: ts.CallExpression[] = [];
    const walk = (n: ts.Node): void => {
      if (n !== member.node && isFunctionLike(n)) return;
      if (ts.isCallExpression(n)) out.push(n);
      ts.forEachChild(n, walk);
    };
    walk(member.node);
    return out;
  };

  // THE PRODUCER SET, DERIVED. `realpathSync` is what resolving a path to its real location IS, and
  // `insideRoot` is the one containment decision; a function that calls neither is not an authority.
  const producers = members
    .filter((m) =>
      callsIn(m).some((c) => {
        const n = calleeName(c);
        return n === "realpathSync" || n === "insideRoot";
      }),
    )
    .map((m) => m.name);
  const producerSet = new Set(producers);

  /**
   * Identifiers declared IN THIS MEMBER that hold a path an authority produced.
   *
   * Three shapes, run to a fixpoint because the second feeds the first: a direct call to an
   * authority (`const p = repoSubpath(...)`), a `.path`/`.real` member of an already-produced
   * identifier (the discriminated `ChildPath` result), and an assignment of either into a `let`.
   */
  const ownProduced = (member: Member): Set<string> => {
    const produced = new Set<string>();
    // `realpathSync` counts as a producer CALL even though it is not a function this module
    // declares: it is the resolution primitive the authorities are made of, and `resolveRepoRoot`
    // assigns the ROOT from it directly. Accepting it here is what stops the census from reporting
    // the root authority as a finding against itself. It is deliberately the only imported name
    // with this standing — `join`, `resolve` and `relative` produce spellings, not real locations.
    const isProducerCall = (n: ts.Node): boolean =>
      ts.isCallExpression(n) &&
      (producerSet.has(calleeName(n)) || calleeName(n) === "realpathSync");
    const isProducedMember = (n: ts.Node): boolean =>
      ts.isPropertyAccessExpression(n) &&
      ts.isIdentifier(n.expression) &&
      produced.has(n.expression.text) &&
      (n.name.text === "path" || n.name.text === "real");
    for (let pass = 0; pass < 8; pass += 1) {
      const before = produced.size;
      const walk = (n: ts.Node): void => {
        if (n !== member.node && isFunctionLike(n)) return;
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer !== undefined) {
          if (isProducerCall(n.initializer) || isProducedMember(n.initializer)) {
            produced.add(n.name.text);
          }
        }
        if (
          ts.isBinaryExpression(n) &&
          n.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isIdentifier(n.left) &&
          (isProducerCall(n.right) || isProducedMember(n.right))
        ) {
          produced.add(n.left.text);
        }
        ts.forEachChild(n, walk);
      };
      walk(member.node);
      if (produced.size === before) break;
    }
    return produced;
  };

  // LEXICAL SCOPE, IN BOTH DIRECTIONS. Splitting the universe by function-like node means a nested
  // arrow no longer sits inside its parent's walk, so the vouching its parent did has to travel to
  // it explicitly — otherwise the widening would manufacture findings against paths an authority
  // plainly produced, which is a false RED rather than a false green but is still wrong.
  const producedCache = new Map<Member, Set<string>>();
  const producedIn = (member: Member): Set<string> => {
    const cached = producedCache.get(member);
    if (cached !== undefined) return cached;
    const own = ownProduced(member);
    const all = member.parent === null ? own : new Set([...producedIn(member.parent), ...own]);
    producedCache.set(member, all);
    return all;
  };

  /** The member that DECLARES this parameter name, walking outwards; `null` if none does. */
  const ownerOfParam = (member: Member, name: string): Member | null => {
    for (let cur: Member | null = member; cur !== null; cur = cur.parent) {
      if (cur.params.includes(name)) return cur;
    }
    return null;
  };

  // THE PATH-HELPER CLOSURE. A function that passes one of its own parameters into a primitive's
  // path slot is a function the CALLER vouched for; that parameter index is then held to the same
  // rule at every call site, so the exemption propagates rather than terminating. When the parameter
  // belongs to an ANCESTOR, the ancestor is the helper — the exemption lands where the caller is.
  const pathHelpers = new Map<string, Set<number>>();
  const slotsFor = (name: string): readonly number[] =>
    READ_PRIMITIVES.includes(name) ? [0] : [...(pathHelpers.get(name) ?? [])];

  for (let pass = 0; pass < 8; pass += 1) {
    let grew = false;
    for (const member of universe) {
      const produced = producedIn(member);
      for (const call of callsIn(member)) {
        for (const slot of slotsFor(calleeName(call))) {
          const arg = call.arguments[slot];
          if (arg === undefined || !ts.isIdentifier(arg)) continue;
          if (produced.has(arg.text)) continue;
          const owner = ownerOfParam(member, arg.text);
          if (owner === null) continue;
          const paramIndex = owner.params.indexOf(arg.text);
          const slots = pathHelpers.get(owner.name) ?? new Set<number>();
          if (!slots.has(paramIndex)) {
            slots.add(paramIndex);
            pathHelpers.set(owner.name, slots);
            grew = true;
          }
        }
      }
    }
    if (!grew) break;
  }

  // THE FINAL PASS. Run AFTER the closure, so a parameter that legitimately became a helper slot is
  // not reported as a finding on an earlier pass.
  const unvouched: UnvouchedSite[] = [];
  let inspected = 0;
  for (const member of universe) {
    const produced = producedIn(member);
    for (const call of callsIn(member)) {
      const line = lineOf(call);
      const resolved = resolveCallee(call);
      if (resolved === null) {
        // COLLECTED, NOT SKIPPED. The pass cannot ask whether this is a read primitive, so it says
        // so out loud and the case below pins the list empty against the live module.
        unresolvedCallees.push({
          fn: member.name,
          line,
          text: call.getText().split("\n")[0] ?? "",
        });
        continue;
      }
      for (const slot of slotsFor(resolved)) {
        inspected += 1;
        const arg = call.arguments[slot];
        if (arg !== undefined && ts.isIdentifier(arg)) {
          if (produced.has(arg.text)) continue;
          if (ownerOfParam(member, arg.text) !== null) continue;
        }
        unvouched.push({ fn: member.name, line, text: call.getText().split("\n")[0] ?? "" });
      }
    }
  }

  return {
    producers: [...producers].sort(),
    inspected,
    unvouched,
    pathHelpers: [...pathHelpers.keys()].sort(),
    universe: universe.map((m) => m.name).sort(),
    unresolvedCallees,
  };
}

/**
 * The path authorities, pinned two-sided.
 *
 * `resolveRepoRoot` resolves the ROOT every other comparison is against. `insideRoot` is the single
 * containment decision and `anchorAbsentTarget` is its ENOENT arm — the deepest-real-ancestor probe
 * that stops `../escape` from being admitted merely because it does not exist yet. `repoSubpath` and
 * `childPath` are the two call sites that ASK, one for fixed literals and one for directory entries.
 *
 * A SIXTH NAME HERE IS A SECOND CONTAINMENT SPELLING, which is the defect CR-04 was. Adding one is a
 * decision recorded in the phase context and in `agent-factory/contracts/board.md`, never a list
 * edited to make a suite green.
 */
const PATH_AUTHORITIES = Object.freeze([
  "anchorAbsentTarget",
  "childPath",
  "insideRoot",
  "repoSubpath",
  "resolveRepoRoot",
]);

describe("board-read — every read target comes from a path authority (plan 32-10, CR-04)", () => {
  // PRINTED ON EVERY RUN, NOT ONLY ON FAILURE: an emptiness claim over an empty denominator is the
  // false green this repository has recorded six instances of, and a number nobody sees is a number
  // nobody can notice going to zero. `process.stdout.write` from a file-level `beforeAll` rather
  // than `console.log`, for the reason measured at `scripts/board-readonly.test.ts:420-428` — the
  // default reporter buffers `console.log` and shows it only for failing tests.
  beforeAll(() => {
    const census = routingCensus(READ_SEAM_PATH);
    process.stdout.write(
      `board-read routing census: ${census.inspected} read-primitive call sites over a universe of ` +
        `${census.universe.length} function-like member(s), ${census.unresolvedCallees.length} unresolvable callee(s), ` +
        `producers [${census.producers.join(", ")}], path helpers [${census.pathHelpers.join(", ")}]\n`,
    );
  });

  it("PREMISE: the walk inspected a non-trivial number of read-primitive call sites", () => {
    const census = routingCensus(READ_SEAM_PATH);
    expect(
      census.inspected,
      "PREMISE: the AST walk over scripts/board-read.ts found (almost) no read-primitive call " +
        "sites, so the emptiness claim below would be satisfied by a census that measured nothing",
    ).toBeGreaterThanOrEqual(8);
  });

  it("derives the path-authority set from the file and pins it two-sided", () => {
    const census = routingCensus(READ_SEAM_PATH);
    expect(
      census.producers,
      "the set of functions in this module that resolve a path or ask the containment question " +
        "changed. A NEW name is a second containment spelling — the defect CR-04 was — and a " +
        "MISSING one means an authority stopped resolving anything at all",
    ).toEqual([...PATH_AUTHORITIES]);
  });

  it("pins the derived path-HELPER set two-sided, because it is an exemption", () => {
    // A path helper takes a path as a PARAMETER and hands it to a read primitive, so its exemption
    // rests on its callers. Leaving the derived set unpinned would let a seventh helper appear and
    // quietly widen the hole the census exists to close — the set-literal drift class this
    // repository has already paid for twice. `readVerifyReread` is the read-verify-reread seam,
    // `gatherFile` is the parse-inside-the-read wrapper, `listDirectoryBounded` is the listing.
    const census = routingCensus(READ_SEAM_PATH);
    expect(
      census.pathHelpers,
      "the set of functions that accept a read target from their caller changed. Each one is an " +
        "exemption from the produced-by-an-authority rule, held up only by its own call sites",
    ).toEqual(["gatherFile", "listDirectoryBounded", "readVerifyReread"]);
  });

  it("finds no read target built outside those authorities", () => {
    const census = routingCensus(READ_SEAM_PATH);
    expect(
      census.unvouched.map((u) => `${u.fn}:${u.line} ${u.text}`),
      "a read primitive in the read seam was handed a path no authority produced. The two raw " +
        "`join(taskDir, ...)` targets that used to sit here are exactly how a symlinked `claim.md` " +
        "inside an otherwise legitimate task directory escaped the rule every other read obeys",
    ).toEqual([]);
  });

  it("PREMISE: the census DETECTS a planted raw join, so its emptiness is a measurement", () => {
    withTempTree((dir) => {
      const probe = join(dir, "probe.ts");
      writeFileSync(
        probe,
        'import { realpathSync, statSync } from "node:fs";\n' +
          'import { join } from "node:path";\n' +
          "export function repoSubpath(root: string, rel: string): string {\n" +
          "  return realpathSync(join(root, rel));\n" +
          "}\n" +
          "export function good(root: string): void {\n" +
          '  const p = repoSubpath(root, "plans/board.md");\n' +
          "  statSync(p);\n" +
          "}\n" +
          "export function bad(root: string): void {\n" +
          '  const taskDir = repoSubpath(root, "plans");\n' +
          '  const raw = join(taskDir, "claim.md");\n' +
          "  statSync(raw);\n" +
          "}\n",
        "utf8",
      );
      const census = routingCensus(probe);
      expect(census.producers, "the probe's own authority was derived").toEqual(["repoSubpath"]);
      expect(
        census.unvouched.map((u) => u.fn),
        "the raw join is the finding and the produced path is not",
      ).toEqual(["bad"]);
    });
  });

  // ── THE TWO NARROW INPUTS (WR-10, round 1) ─────────────────────────────────────────────────────
  // Neither shape exists in `board-read.ts` today, which is exactly why the census went green over
  // a universe that could not see them. A refactor is one commit; a census that cannot see the
  // result of one is a census that stops measuring the day somebody writes ordinary code.

  const AUTHORITY_PRELUDE =
    'import { realpathSync, statSync } from "node:fs";\n' +
    'import { join } from "node:path";\n' +
    "export function repoSubpath(root: string, rel: string): string {\n" +
    "  return realpathSync(join(root, rel));\n" +
    "}\n";

  it("PREMISE: a MODULE-LEVEL ARROW reading a joined path is a finding, not an invisible site", () => {
    withTempTree((dir) => {
      const probe = join(dir, "probe-arrow.ts");
      writeFileSync(
        probe,
        AUTHORITY_PRELUDE +
          "export const readRaw = (root: string): void => {\n" +
          '  const taskDir = repoSubpath(root, "plans");\n' +
          '  const raw = join(taskDir, "claim.md");\n' +
          "  statSync(raw);\n" +
          "};\n",
        "utf8",
      );
      const census = routingCensus(probe);
      expect(
        census.unvouched.map((u) => u.fn),
        "a module-level arrow was never entered into the census's universe, so its raw join was " +
          "never inspected — while `inspected` still printed as healthy (WR-10)",
      ).toEqual(["readRaw"]);
    });
  });

  it("PREMISE: a read primitive reached through a MEMBER-ACCESS callee is inspected", () => {
    withTempTree((dir) => {
      const probe = join(dir, "probe-namespace.ts");
      writeFileSync(
        probe,
        'import * as fs from "node:fs";\n' + AUTHORITY_PRELUDE +
          "export function nsRead(root: string): void {\n" +
          '  const raw = join(root, "claim.md");\n' +
          "  fs.statSync(raw);\n" +
          "}\n",
        "utf8",
      );
      const census = routingCensus(probe);
      expect(
        census.unvouched.map((u) => u.fn),
        "`calleeName` returned an empty string for `fs.statSync`, so a namespace-import refactor " +
          "made every read primitive in the module invisible at once (WR-10)",
      ).toEqual(["nsRead"]);
    });
  });

  // ── THE UNIVERSE ITSELF IS PINNED, NOT ONLY THE FINDINGS (plan 32-21, WR-10) ───────────────────
  //
  // `inspected` staying healthy while one specific site is unmeasured is the failure WR-10 is
  // about, and no count of FINDINGS can catch it: an unmeasured site and a clean site produce the
  // same number. Only a pinned DENOMINATOR can. So the members the walk entered are asserted by
  // name, and the nameless ones by count.

  /**
   * Every NAMED function-like member of `scripts/board-read.ts`, as the census collects them.
   *
   * A reader added, renamed or removed MOVES this list, which is the point: the list is the set of
   * places the routing rule is asked about, and a place that silently leaves it is a place the rule
   * stopped being asked about. Editing this list is recording that decision.
   */
  const ROUTING_UNIVERSE_NAMED = Object.freeze([
    "anchorAbsentTarget",
    "boundNames",
    "carriedValue",
    "childPath",
    "configView",
    "deriveOverallSource",
    "gatherFile",
    "guarded",
    "insideRoot",
    "isSafeTaskName",
    "isWithinRoot",
    "listDirectoryBounded",
    "listingFailure",
    "parse",
    "parseTraceability",
    "readBoardSource",
    "readConfigSource",
    "readContextSource",
    "readQueueSource",
    "readSnapshot",
    "readTicketsSource",
    "readTraceabilitySource",
    "readVerifyReread",
    "repoSubpath",
    "resolveRepoRoot",
    "settleSource",
    "settledFrom",
    "sinceOf",
    "splitPipeRow",
    "staleReasonForCode",
    "ticketStem",
    "unadmittedFrom",
    "unreadableSources",
  ]);

  /** The nameless members — callbacks, predicates, comparators — plus the constructor and module. */
  // SIXTEEN SINCE PLAN 32-33, down from seventeen: the duplicate check's `(r) => r.id === id`
  // predicate went away with `records.find(...)`, replaced by a `seenById` map lookup that carries
  // no callback (WR-08). A callback that LEAVES moves this denominator exactly as a new one does,
  // which is why it is pinned rather than derived from the census it is checking.
  const ROUTING_UNIVERSE_ANONYMOUS = 16;
  const ROUTING_UNIVERSE_TOTAL = ROUTING_UNIVERSE_NAMED.length + ROUTING_UNIVERSE_ANONYMOUS + 2;

  it("pins the collected function UNIVERSE by name and by count", () => {
    const census = routingCensus(READ_SEAM_PATH);
    const named = census.universe.filter((n) => !n.startsWith("<"));
    expect(
      named,
      "the set of NAMED functions the routing census asks about changed. A name that left this " +
        "list is a place the produced-by-an-authority rule stopped being asked about, and a name " +
        "that joined it is a place nobody has read yet. `parse` is the module-level-arrow shape " +
        "WR-10 named: before this universe was widened it was not in here at all",
    ).toEqual([...ROUTING_UNIVERSE_NAMED]);
    expect(
      census.universe.filter((n) => n === "<anonymous function>").length,
      "the number of NAMELESS function-like members changed. Each is a callback or predicate the " +
        "census now walks in its own right; a new one is ordinary, and it is pinned so that a " +
        "reader landing on a green suite can still see the denominator move",
    ).toBe(ROUTING_UNIVERSE_ANONYMOUS);
    expect(
      census.universe.length,
      "the universe total must equal its named members, its nameless ones, the constructor and " +
        "the synthetic module-top-level member — no third bucket",
    ).toBe(ROUTING_UNIVERSE_TOTAL);
    expect(
      census.universe.filter((n) => n === "<module top level>").length,
      "the statements outside every function are a member too: a read at module scope is a read",
    ).toBe(1);
  });

  it("collects an UNRESOLVABLE callee rather than skipping it, and the live module has none", () => {
    const census = routingCensus(READ_SEAM_PATH);
    expect(
      census.unresolvedCallees.map((u) => `${u.fn}:${u.line} ${u.text}`),
      "a callee this pass cannot reduce to a name is a route to a read primitive it cannot check. " +
        "Skipping one is exactly how `fs.statSync` was invisible while `inspected` printed 17",
    ).toEqual([]);
  });

  it("PREMISE: a callee the pass CANNOT resolve is collected, not silently dropped", () => {
    withTempTree((dir) => {
      const probe = join(dir, "probe-opaque.ts");
      writeFileSync(
        probe,
        AUTHORITY_PRELUDE +
          "const table: Record<string, (p: string) => unknown> = { statSync };\n" +
          "export function opaque(root: string, key: string): void {\n" +
          '  table[key](join(root, "claim.md"));\n' +
          "}\n",
        "utf8",
      );
      const census = routingCensus(probe);
      expect(
        census.unresolvedCallees.map((u) => u.fn),
        "measured against the pre-32-21 derivation this plant produced inspected=0, unvouched=[] " +
          "and no field at all to report it in — the silent skip WR-10 describes",
      ).toEqual(["opaque"]);
    });
  });

  it("resolves a STRING-LITERAL element access to the primitive it names", () => {
    withTempTree((dir) => {
      const probe = join(dir, "probe-literal-index.ts");
      writeFileSync(
        probe,
        'import * as fs from "node:fs";\n' + AUTHORITY_PRELUDE +
          "export function litRead(root: string): void {\n" +
          '  const raw = join(root, "claim.md");\n' +
          '  fs["statSync"](raw);\n' +
          "}\n",
        "utf8",
      );
      const census = routingCensus(probe);
      expect(census.unresolvedCallees, "a literal key names its symbol").toEqual([]);
      expect(
        census.unvouched.map((u) => u.fn),
        "`fs['statSync']` reads a file exactly as `fs.statSync` does",
      ).toEqual(["litRead"]);
    });
  });

  it("does NOT manufacture a finding against a nested arrow closing over a vouched path", () => {
    // The converse of the widening, and the reason lexical scope travels into the universe: a
    // nested function now has a walk of its own, so the vouching its parent did has to reach it
    // explicitly. Without this the widening would turn every legitimate callback into a red.
    withTempTree((dir) => {
      const probe = join(dir, "probe-nested.ts");
      writeFileSync(
        probe,
        AUTHORITY_PRELUDE +
          "export function outer(root: string): void {\n" +
          '  const safe = repoSubpath(root, "plans");\n' +
          "  const once = (): void => {\n" +
          "    statSync(safe);\n" +
          "  };\n" +
          "  once();\n" +
          "}\n",
        "utf8",
      );
      const census = routingCensus(probe);
      expect(
        census.unvouched.map((u) => `${u.fn}:${u.line}`),
        "the nested arrow reads a path `outer` produced through an authority; calling that a " +
          "finding would be a false RED bought with the widening",
      ).toEqual([]);
      expect(census.universe, "the nested arrow is still IN the universe").toContain("once");
    });
  });

  it("names an ANCESTOR's parameter as the path helper, not the nested arrow", () => {
    withTempTree((dir) => {
      const probe = join(dir, "probe-ancestor-param.ts");
      writeFileSync(
        probe,
        AUTHORITY_PRELUDE +
          "export function helper(p: string): void {\n" +
          "  const run = (): void => {\n" +
          "    statSync(p);\n" +
          "  };\n" +
          "  run();\n" +
          "}\n",
        "utf8",
      );
      const census = routingCensus(probe);
      expect(
        census.pathHelpers,
        "the exemption belongs where the CALLER vouches — the function that declares the " +
          "parameter — not to the anonymous arrow that happens to dereference it",
      ).toEqual(["helper"]);
      expect(census.unvouched).toEqual([]);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-10 TASK 2 — THE GUARD CENSUS: SIX SOURCES, SIX GUARDS, DERIVED FROM BOTH SIDES.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** How many `guarded(` call sites sit inside `readSnapshot`'s own body. */
function guardedCallSitesInReadSnapshot(absPath: string): number {
  const source = ts.createSourceFile(
    absPath,
    readFileSync(absPath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  let count = 0;
  const walk = (node: ts.Node): void => {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name?.text === "readSnapshot" &&
      node.body !== undefined
    ) {
      const inner = (n: ts.Node): void => {
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "guarded") {
          count += 1;
        }
        ts.forEachChild(n, inner);
      };
      inner(node.body);
      return;
    }
    ts.forEachChild(node, walk);
  };
  walk(source);
  return count;
}

describe("board-read — every source read is guarded (plan 32-10, D-12, T-32-10-03)", () => {
  it("pins the guard count against SOURCE_NAMES, two-sided", () => {
    const guards = guardedCallSitesInReadSnapshot(READ_SEAM_PATH);
    expect(
      guards,
      "the number of guarded source reads no longer equals the number of joined sources. A " +
        "SEVENTH source added without a guard is a source whose containment refusal blanks the " +
        "other six — D-12 says staleness is per source with one badge. A guard REMOVED is the " +
        "same failure the other way round",
    ).toBe(SOURCE_NAMES.length);
    expect(
      SOURCE_NAMES.length,
      "PREMISE: the source tuple is empty, so the pin above compares nothing against nothing",
    ).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-10 TASK 2 — ONE REFUSED SOURCE LEAVES THE OTHER FIVE, AND THE TWO CLOSED RAW JOINS.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — a containment refusal is ONE source's finding (plan 32-10, D-12)", () => {
  it("refuses only the linked source and leaves the other five exactly as they were", () => {
    withEscapeTree(({ dir, outsideDir }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      plantTicketDoc(dir, "ABC-102", "Done", "done");
      writeFileSync(join(outsideDir, "traceability.md"), `| ${ESCAPE_MARKER} | x |\n`, "utf8");
      symlinkSync(join(outsideDir, "traceability.md"), join(dir, "plans", "traceability.md"));

      const result = readSnapshot(dir);

      expect(JSON.stringify(result)).not.toContain(ESCAPE_MARKER);
      const refusals = result.readErrors.filter((e) => e.code === "OUTSIDE-ROOT");
      expect(refusals.map((e) => e.source), "exactly one source refused").toEqual(["traceability"]);

      // THE OTHER FIVE, ASSERTED POSITIVELY. "Nothing threw" is satisfied by a reader that returned
      // six empty sources, which is the blanked snapshot the guard exists to prevent.
      expect(result.snapshot.sources.board.source).toBe("ok");
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      const tickets =
        result.snapshot.sources.tickets.source === "unavailable"
          ? []
          : result.snapshot.sources.tickets.value;
      expect(tickets.map((t) => t.id).sort()).toEqual(["ABC-101", "ABC-102"]);
      // No `.grugops/` and no dial in this tree: absent, and D-13 says absent is not a finding.
      expect(result.snapshot.sources.queue.source).toBe("unavailable");
      expect(result.snapshot.sources.context.source).toBe("unavailable");
      expect(result.snapshot.sources.config.source).toBe("unavailable");
      expect(result.readErrors.filter((e) => e.source !== "traceability")).toEqual([]);
    });
  });

  it("refuses a symlinked `claim.md` and keeps the other claims in the same stage", () => {
    withEscapeTree(({ dir, outsideDir }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantClaim(dir, "abc-106-implement", CLAIM_BODY);
      const escapedTask = join(dir, ".grugops", "queue", "claimed", "abc-107-escaped");
      mkdirSync(escapedTask, { recursive: true });
      writeFileSync(
        join(outsideDir, "claim.md"),
        `by: ${ESCAPE_MARKER}\nat: 2026-09-14T10:00:00.000Z\n`,
        "utf8",
      );
      symlinkSync(join(outsideDir, "claim.md"), join(escapedTask, "claim.md"));

      const result = readSnapshot(dir);
      expect(
        JSON.stringify(result),
        "the claim record outside the tree was read through a bare `join` that consulted no rule",
      ).not.toContain(ESCAPE_MARKER);
      expect(
        result.readErrors.filter((e) => e.source === "queue" && e.code === "OUTSIDE-ROOT").length,
      ).toBe(1);
      const rows =
        result.snapshot.sources.queue.source === "unavailable"
          ? []
          : result.snapshot.sources.queue.value;
      expect(
        rows.map((r) => r.task),
        "the legitimate claim in the same stage still appears",
      ).toEqual(["abc-106-implement"]);
    });
  });

  it("refuses a symlinked `index.jsonl` and keeps the other context tasks", () => {
    withEscapeTree(({ dir, outsideDir }) => {
      plantBoard(dir, TICKETED_BOARD);
      const ctx = join(dir, ".grugops", "context");
      mkdirSync(join(ctx, "abc-108-fine"), { recursive: true });
      writeFileSync(
        join(ctx, "abc-108-fine", "index.jsonl"),
        '{"id":"n1","kind":"decision","at":"2026-09-14T10:00:00.000Z","supersedes":null}\n',
        "utf8",
      );
      mkdirSync(join(ctx, "abc-109-escaped"), { recursive: true });
      writeFileSync(
        join(outsideDir, "index.jsonl"),
        `{"id":"${ESCAPE_MARKER}","kind":"decision","at":"2026-09-14T10:00:00.000Z","supersedes":null}\n`,
        "utf8",
      );
      symlinkSync(join(outsideDir, "index.jsonl"), join(ctx, "abc-109-escaped", "index.jsonl"));

      const result = readSnapshot(dir);
      expect(JSON.stringify(result)).not.toContain(ESCAPE_MARKER);
      expect(
        result.readErrors.filter((e) => e.source === "context" && e.code === "OUTSIDE-ROOT").length,
      ).toBe(1);
      const tasks =
        result.snapshot.sources.context.source === "unavailable"
          ? []
          : result.snapshot.sources.context.value;
      expect(tasks.map((t) => t.task).sort()).toEqual(["abc-108-fine", "abc-109-escaped"]);
      expect(
        tasks.find((t) => t.task === "abc-108-fine")?.noteCount,
        "the readable task's own notes are unaffected by the refused one",
      ).toBe(1);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-10 TASK 2 — THE GUARD CATCHES ONE CLASS, AND ONLY ONE.
//
// `guarded` exists to localize a CONTAINMENT refusal. Widening it into a catch-all would hide the
// next real defect exactly the way the bare `catch` plan 32-09 removed hid this one, so the rethrow
// is driven rather than read: a plain `Error` raised inside the guarded read must come out of
// `readSnapshot`, and a `BoardReadError` raised at the same place must NOT.
//
// THE SEAM IS THE `previous` ARGUMENT, AND IT IS A REAL ONE. `readSnapshot` reads each source's
// previous state twice — once eagerly, to hand `guarded` the carry-forward, and once inside the
// guarded closure. A property that answers normally the first time and throws the second raises its
// error at exactly the place under test, with no mock of `node:fs` anywhere.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** A `previous` result whose `tickets` state throws on its SECOND read — i.e. inside the guard. */
function previousThrowingOnSecondRead(error: Error): SnapshotResult {
  let reads = 0;
  const sources = {
    board: { source: "unavailable", present: false },
    queue: { source: "unavailable", present: false },
    context: { source: "unavailable", present: false },
    traceability: { source: "unavailable", present: false },
    config: { source: "unavailable", present: false },
  } as unknown as SnapshotResult["snapshot"]["sources"];
  Object.defineProperty(sources, "tickets", {
    get: () => {
      reads += 1;
      if (reads >= 2) throw error;
      return undefined;
    },
    enumerable: true,
  });
  return {
    source: "ok",
    snapshot: { sources } as unknown as SnapshotResult["snapshot"],
    conflicts: [],
    readErrors: [],
  };
}

describe("board-read — the guard catches containment refusals and nothing else (plan 32-10)", () => {
  it("PROPAGATES a plain Error raised inside a guarded source read", () => {
    withEscapeTree(({ dir }) => {
      plantBoard(dir, TICKETED_BOARD);
      const planted = new Error("a defect nobody has met yet");
      expect(
        () => readSnapshot(dir, previousThrowingOnSecondRead(planted)),
        "a catch-all here would hide the next real defect the way the bare catch plan 32-09 " +
          "removed hid this one",
      ).toThrow("a defect nobody has met yet");
    });
  });

  it("CATCHES a BoardReadError raised at the same place, as that source's finding", () => {
    // The discrimination. Without it, "propagates" is equally true of a guard that catches nothing.
    withEscapeTree(({ dir }) => {
      plantBoard(dir, TICKETED_BOARD);
      const refusal = new BoardReadError("board-read: a refusal raised at the guarded seam", "OUTSIDE-ROOT");
      let result: SnapshotResult | null = null;
      expect(() => {
        result = readSnapshot(dir, previousThrowingOnSecondRead(refusal));
      }).not.toThrow();
      const settled = result as SnapshotResult | null;
      expect(settled, "PREMISE: readSnapshot returned nothing to assert over").not.toBeNull();
      if (settled === null) return;
      const found = settled.readErrors.filter(
        (e) => e.source === "tickets" && e.code === "OUTSIDE-ROOT",
      );
      expect(found.length, "the refusal became the tickets source's own readErrors entry").toBe(1);
      expect(settled.snapshot.sources.board.source, "the other sources are untouched").toBe("ok");
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-10 TASK 3 — THE LEGITIMATE-INPUT BATTERY (T-32-10-04).
//
// THIS IS THE HALF THAT STOPS THE FIX FROM BECOMING THE NEXT ROUND'S GAP. A containment rule that
// also refuses absent paths, dangling links, in-root links, a symlinked repository root or a
// relative root argument is a rule the field turns off — it gets reverted under pressure until it
// stops refusing anything, and then the traversal is back with a test suite asserting it is fixed.
//
// EVERY CASE ASSERTS A POSITIVE OUTCOME. "Nothing threw" is satisfied by a reader that returns six
// empty sources, which is precisely the blanked snapshot D-11 forbids. So each one names a source
// that must be `ok`, or a value that must be present.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — the legitimate shapes containment must not turn into faults (plan 32-10)", () => {
  it("1. a fresh checkout with no `.grugops/` at all: absent, no badge, no error (D-13)", () => {
    withEscapeTree(({ dir }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      plantTicketDoc(dir, "ABC-102", "Done", "done");

      const result = readSnapshot(dir);
      expect(result.snapshot.sources.board.source).toBe("ok");
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      expect(result.snapshot.sources.queue.source).toBe("unavailable");
      expect(result.snapshot.sources.context.source).toBe("unavailable");
      expect(
        result.readErrors,
        "D-13 verbatim: a path nobody has written yet is a legitimate state and says nothing on " +
          "stderr. Containment now runs on EVERY path, so this is re-asserted after the change",
      ).toEqual([]);
      expect(
        unreadableSources(result.snapshot.sources, result.readErrors),
        "no badge — an absent source is badged nowhere",
      ).toEqual([]);
      expect(result.source).toBe("ok");
    });
  });

  it("2. an EMPTY `plans/tickets/`: tickets `ok`, empty list, no badge", () => {
    withEscapeTree(({ dir }) => {
      plantBoard(dir, ONE_COLUMN);
      mkdirSync(join(dir, "plans", "tickets"), { recursive: true });

      const result = readSnapshot(dir);
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      expect(
        result.snapshot.sources.tickets.source === "ok" ? result.snapshot.sources.tickets.value : null,
        "an empty ticket directory is an empty ticket list, not a fault",
      ).toEqual([]);
      expect(result.readErrors).toEqual([]);
    });
  });

  it("3. a repository root reached through a SYMLINKED PATH still reads every source", () => {
    // The macOS `/tmp` shape, and the case that fails if containment compared a REAL target against
    // an UNRESOLVED root. `resolveRepoRoot` already realpaths the root; `insideRoot` realpaths the
    // target; both sides must be real or every source under a linked root is refused at once.
    withEscapeTree(({ dir, outsideDir }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      const linkToRoot = join(outsideDir, "link-to-root");
      symlinkSync(dir, linkToRoot);

      const result = readSnapshot(linkToRoot);
      expect(
        result.snapshot.repoRoot,
        "PREMISE: the root was not resolved, so this case is not testing a linked root",
      ).toBe(realpathSync(dir));
      expect(result.snapshot.sources.board.source).toBe("ok");
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      expect(
        result.readErrors,
        "a link the OPERATOR followed to reach their own repository is not an escape",
      ).toEqual([]);
    });
  });

  it("4. a RELATIVE `repoRoot` argument still resolves and still reads", () => {
    withEscapeTree(({ dir }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      const cwd = process.cwd();
      try {
        process.chdir(dir);
        const result = readSnapshot(".");
        expect(result.snapshot.repoRoot).toBe(realpathSync(dir));
        expect(result.snapshot.sources.board.source).toBe("ok");
        expect(result.readErrors).toEqual([]);
      } finally {
        process.chdir(cwd);
      }
    });
  });

  it("5. an IN-ROOT symlinked DIRECTORY (`plans/tickets` → `plans/tickets-real/`) still reads", () => {
    withEscapeTree(({ dir }) => {
      plantBoard(dir, TICKETED_BOARD);
      const real = join(dir, "plans", "tickets-real");
      mkdirSync(real, { recursive: true });
      for (const [id, column, status] of [
        ["ABC-101", "Backlog", "backlog"],
        ["ABC-102", "Done", "done"],
      ] as const) {
        writeFileSync(
          join(real, `${id}.md`),
          `---\nid: ${id}\ntitle: ${id} title\nstatus: ${status}\ncolumn: ${column}\n---\n\n# ${id}\n`,
          "utf8",
        );
      }
      symlinkSync(real, join(dir, "plans", "tickets"));

      const result = readSnapshot(dir);
      expect(
        result.readErrors,
        "a DIRECTORY link inside the tree is the same admitted shape a file link inside it is",
      ).toEqual([]);
      expect(result.snapshot.sources.tickets.source).toBe("ok");
      const tickets =
        result.snapshot.sources.tickets.source === "unavailable"
          ? []
          : result.snapshot.sources.tickets.value;
      expect(tickets.map((t) => t.id).sort()).toEqual(["ABC-101", "ABC-102"]);
    });
  });

  it("6. the committed fixture tree reads with no refusal and no fabricated finding", () => {
    // The byte-for-byte authority is `scripts/board-model.test.ts`'s golden case and
    // `git diff --exit-code -- scripts/fixtures/board-snapshot/expected-snapshot.json`. What is
    // asserted HERE is the property this change could have broken: containment now runs on every
    // path in a tree that contains no link at all, so nothing in it may be refused.
    const result = readSnapshot(join(ROOT, "scripts", "fixtures", "board-snapshot"));
    expect(
      result.readErrors.filter((e) => e.code === "OUTSIDE-ROOT"),
      "containment refused something in a fixture that has no symlink in it",
    ).toEqual([]);
    expect(result.snapshot.sources.board.source).toBe("ok");
    expect(result.snapshot.sources.tickets.source).toBe("ok");
    expect(result.snapshot.sources.config.source).toBe("ok");
    expect(
      result.conflicts.length,
      "PREMISE: the fixture produced no conflicts at all, so it is not the fixture this case is about",
    ).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-10 TASK 3 — THE ONE DELIBERATE BEHAVIOUR CHANGE, MEASURED RATHER THAN DISCOVERED.
//
// `install/install.ts` supports an opt-in `--symlink` install mode (D-05; copy is the default), so a
// target repository CAN carry `agent-factory/` as a link into a shared kit. Under that shape
// `FIXED_SUBPATHS.config` resolves outside the root and is refused. That is a behaviour change, and
// the plan's instruction was to MEASURE it and write the measurement down rather than to widen the
// rule until the expectation came true.
//
// TWO FACTS WERE ALREADY ESTABLISHED AND ARE STATED HERE RATHER THAN RE-LITIGATED:
//   • `install/install.ts` records that `agent-factory/config` is deliberately ABSENT from the
//     installed kit — the dial is seeded at `.grugops/factory.config.json` instead — so the linked
//     shape usually has nothing at this path to read in the first place.
//   • `config` is the ONE source with a defined `fallback` (the lean view), because CLAUDE.md C6
//     defines what the kit does with no usable dial. A refused dial therefore degrades to LEAN,
//     which is a supported state, rather than to nothing.
//
// MEASURED OUTCOME (this case, run against the built module): the config source settles `stale` with
// the LEAN view as its value, one `readErrors` entry with code `OUTSIDE-ROOT` names the refusal, the
// overall discriminant degrades to `stale`, and no byte of the outside dial reaches the document.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — a SYMLINK-INSTALLED `agent-factory/` degrades to lean, visibly (plan 32-10)", () => {
  it("refuses the out-of-tree dial, shows the lean view, and says so in readErrors", () => {
    withEscapeTree(({ dir, outsideDir }) => {
      plantBoard(dir, TICKETED_BOARD);
      const kitConfig = join(outsideDir, "kit", "config");
      mkdirSync(kitConfig, { recursive: true });
      writeFileSync(
        join(kitConfig, "factory.config.json"),
        `{"mode":"enterprise","id_prefix":"${ESCAPE_MARKER}","wip_limits":{"In Development":2}}\n`,
        "utf8",
      );
      symlinkSync(join(outsideDir, "kit"), join(dir, "agent-factory"));

      const result = readSnapshot(dir);

      expect(
        JSON.stringify(result),
        "the dial outside the tree was read and published",
      ).not.toContain(ESCAPE_MARKER);
      const config = result.snapshot.sources.config;
      expect(
        config.source,
        "MEASURED: a refused dial is stale carrying the lean view, never a silent read and never " +
          "a dead projector",
      ).toBe("stale");
      expect(
        config.source === "unavailable" ? null : config.value,
        "MEASURED: the LEAN view — CLAUDE.md C6's answer for 'no usable dial'",
      ).toEqual({ mode: null, idPrefix: null, wipLimits: {} });
      expect(
        result.readErrors.filter((e) => e.source === "config" && e.code === "OUTSIDE-ROOT").length,
        "MEASURED: the degradation is VISIBLE — a silent fallback to lean would be the same " +
          "confident-wrong output the badge exists to prevent",
      ).toBe(1);
      expect(result.source, "MEASURED: the overall discriminant degrades").toBe("stale");
      // The board beside it is untouched: this is one source's finding.
      expect(result.snapshot.sources.board.source).toBe("ok");
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-10 TASK 3 — THE ADVERSARIAL BATTERY, AND THE ONE SHAPE THAT IS NOT CLOSED.
//
// This repository's own record is that a fix creates the next bypass, so the rule is probed from the
// shapes an attacker actually has rather than from the one the reproduction used: a RELATIVE link, a
// link CHAIN, a linked DIRECTORY wearing a ticket's name, and a symlink LOOP.
//
// AND ONE SHAPE IS NOT CLOSED, WHICH IS WRITTEN DOWN RATHER THAN LEFT TO BE FOUND. A hard link
// inside the tree to an inode whose other name is outside it is read. There is no path-based rule
// that could refuse it — a hard link is not a reference to another path, it IS a directory entry for
// the inode — so the case below pins the MECHANISM and names the residual instead of asserting a
// containment this module does not have.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — the adversarial shapes, probed rather than assumed (plan 32-10)", () => {
  it("refuses a RELATIVE symlink that climbs out of the tree", () => {
    withEscapeTree(({ dir, outsideFile }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      // `../../elsewhere/outside-secret.txt` from `plans/tickets/` — a spelling that never mentions
      // an absolute path, which is the shape a lexical check is most likely to be written against.
      symlinkSync(
        join("..", "..", relative(dir, outsideFile)),
        join(dir, "plans", "tickets", "REL-1.md"),
      );
      const result = readSnapshot(dir);
      expect(JSON.stringify(result)).not.toContain(ESCAPE_MARKER);
      expect(
        result.readErrors.filter((e) => e.code === "OUTSIDE-ROOT").length,
        "a relative link and an absolute one resolve to the same place, so they are one question",
      ).toBe(1);
    });
  });

  it("refuses a symlink CHAIN whose final hop leaves the tree", () => {
    withEscapeTree(({ dir, outsideDir, outsideFile }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      const hop = join(outsideDir, "hop.md");
      symlinkSync(outsideFile, hop);
      symlinkSync(hop, join(dir, "plans", "tickets", "CHAIN-1.md"));
      const result = readSnapshot(dir);
      expect(JSON.stringify(result)).not.toContain(ESCAPE_MARKER);
      expect(result.readErrors.filter((e) => e.code === "OUTSIDE-ROOT").length).toBe(1);
    });
  });

  it("refuses a symlinked DIRECTORY wearing a ticket's name", () => {
    withEscapeTree(({ dir, outsideDir }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      const outDir = join(outsideDir, "a-whole-directory");
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, "inside.md"), `${ESCAPE_MARKER}\n`, "utf8");
      symlinkSync(outDir, join(dir, "plans", "tickets", "DIR-1.md"));
      const result = readSnapshot(dir);
      expect(JSON.stringify(result)).not.toContain(ESCAPE_MARKER);
      expect(result.readErrors.filter((e) => e.code === "OUTSIDE-ROOT").length).toBe(1);
    });
  });

  it("reports a symlink LOOP under its own errno, not as an escape", () => {
    // ELOOP is a path this module cannot resolve, which is a different finding from a path that
    // resolves somewhere it may not go. Reporting both under one code is CR-02's discarded errno.
    withEscapeTree(({ dir }) => {
      plantBoard(dir, TICKETED_BOARD);
      plantTicketDoc(dir, "ABC-101", "Backlog", "backlog");
      const loop = join(dir, "plans", "tickets", "LOOP-1.md");
      symlinkSync(loop, loop);
      const result = readSnapshot(dir);
      const codes = result.readErrors.filter((e) => e.source === "tickets").map((e) => e.code);
      expect(codes, "the errno itself, never a collapsed placeholder").toEqual(["ELOOP"]);
      const tickets =
        result.snapshot.sources.tickets.source === "unavailable"
          ? []
          : result.snapshot.sources.tickets.value;
      expect(tickets.map((t) => t.id), "the readable ticket beside it survives").toEqual(["ABC-101"]);
    });
  });

  it("RECORDS the hard-link residual: a path-based rule cannot see it, and that is measured", () => {
    withEscapeTree(({ dir, outsideFile }) => {
      plantBoard(dir, TICKETED_BOARD);
      const hard = join(dir, "plans", "tickets", "HARD-1.md");
      mkdirSync(join(dir, "plans", "tickets"), { recursive: true });
      linkSync(outsideFile, hard);

      // THE MECHANISM, PINNED. This is why no path rule can refuse it: the second name IS the file,
      // so its real location is inside the root and there is no other path to compare against. If
      // this assertion ever fails, the platform changed and the residual can be revisited.
      expect(
        realpathSync(hard),
        "PREMISE: the hard link did not behave as a hard link on this filesystem, so the residual " +
          "recorded below is not the thing this case measured",
      ).toBe(hard);
      expect(relative(realpathSync(dir), realpathSync(hard)).startsWith("..")).toBe(false);

      // THE MEASURED CONSEQUENCE, STATED RATHER THAN ASSERTED AWAY. The content IS read. It is
      // recorded in `insideRoot`'s docblock, in this phase's SUMMARY and in `.planning/WINDOWS.md`.
      const result = readSnapshot(dir);
      expect(
        JSON.stringify(result).includes(ESCAPE_MARKER),
        "MEASURED RESIDUAL (plan 32-10): a hard link inside the tree to an inode named outside it " +
          "is read, because its path is inside the root. Refusing on `nlink > 1` was declined as a " +
          "heuristic over a legitimate filesystem property. Bounded by: creating the link needs " +
          "write access to the tree (the same access that would let an attacker paste the bytes " +
          "into a ticket directly), hard links cannot cross a filesystem, and both Linux and macOS " +
          "restrict linking to files the caller may already read. If this flips to `false`, the " +
          "residual closed and the record should be updated rather than left saying otherwise",
      ).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-16 — THE BYTE-ORDER MARK IS A QUESTION EVERY DOCUMENT CLASS HAS AN ANSWER TO (WR-03).
//
// `readVerifyReread` preserves a leading mark on purpose (`ignoreBOM: true`), so every reader
// downstream of it receives one. Plan 32-16 answered it for the two GRAMMARS — `parseBoard` and
// `parseTicketDocument` now share `normalizeDocument`. This block is the other half: the four
// document classes this module parses itself, each driven with a mark-led document so its answer is
// MEASURED rather than assumed. A class with no row here is a class nobody asked the question of.
//
// The disposition table below is the record. Every row carries an observed answer; a row that could
// not be closed would carry its reason instead of a silence.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — every non-grammar document class has a recorded byte-order-mark answer (plan 32-16)", () => {
  // The mark is written as an ESCAPE, never as a literal byte: an invisible character in a
  // tracked source file is the hazard under test, not a way to write about it.
  const MARK = "\uFEFF";

  /** One row per document class this module parses with a reader of its own. */
  type MarkDisposition = {
    /** The source the class belongs to, as `SOURCE_NAMES` spells it. */
    readonly source: (typeof SOURCE_NAMES)[number];
    /** What the class is parsed by. */
    readonly parsedBy: string;
    /** `normalized` = closed here; `immune` = the class never had the defect, with the reason. */
    readonly disposition: "normalized" | "immune";
    readonly answer: string;
  };

  const MARK_DISPOSITIONS: readonly MarkDisposition[] = [
    {
      source: "queue",
      parsedBy: "AT_KEY_LINE / AT_VALUE / BY_VALUE, all anchored at a line start",
      disposition: "normalized",
      answer:
        "OPEN before this plan: a mark before a first-line `at:` defeated BOTH the value match " +
        "(the claim vanished from the screen) and the single-`at:` tamper count (a forged second " +
        "`at:` was then trusted as the only one). Closed at the parse point.",
    },
    {
      source: "context",
      parsedBy: "JSON.parse, per line of index.jsonl",
      disposition: "normalized",
      answer:
        "OPEN before this plan: the first line threw and was reported as a malformed index line, " +
        "naming a line that is valid JSON. Closed at the parse point.",
    },
    {
      source: "traceability",
      parsedBy: "splitPipeRow, which trims the line before testing its first byte",
      disposition: "immune",
      answer:
        "CLOSED BY CONSTRUCTION: `String.prototype.trim` treats U+FEFF as whitespace, so a " +
        "mark-led header row was already located. Pinned below so a later edit that drops the trim " +
        "is a red rather than a silent regression.",
    },
    {
      source: "config",
      parsedBy: "JSON.parse, over the whole dial",
      disposition: "normalized",
      answer:
        "OPEN before this plan: the dial threw, the source went stale with reason `unreadable`, " +
        "and the kit fell back to the lean view over a dial that was valid. Closed at the parse " +
        "point.",
    },
  ];

  /** The classes the two grammars own; they are answered in `scripts/board-model.test.ts`. */
  const GRAMMAR_SOURCES: readonly string[] = ["board", "tickets"];

  function plantClaimAt(dir: string, task: string, text: string): string {
    const taskDir = join(dir, ".grugops", "queue", "claimed", task);
    mkdirSync(taskDir, { recursive: true });
    const path = join(taskDir, "claim.md");
    writeFileSync(path, text, "utf8");
    return path;
  }

  function plantIndex(dir: string, task: string, text: string): string {
    const taskDir = join(dir, ".grugops", "context", task);
    mkdirSync(join(taskDir, "notes"), { recursive: true });
    const path = join(taskDir, "index.jsonl");
    writeFileSync(path, text, "utf8");
    return path;
  }

  function plantTraceFile(dir: string, text: string): void {
    mkdirSync(join(dir, "plans"), { recursive: true });
    writeFileSync(join(dir, "plans", "traceability.md"), text, "utf8");
  }

  function plantDial(dir: string, text: string): void {
    mkdirSync(join(dir, "agent-factory", "config"), { recursive: true });
    writeFileSync(join(dir, "agent-factory", "config", "factory.config.json"), text, "utf8");
  }

  const NOTE = {
    id: "20260914T0900-engineer-finding-aaaa1111",
    task: "ABC-014",
    kind: "finding",
    at: "2026-09-14T09:00:00.000Z",
    supersedes: null,
  };

  it("PREMISE: the table names EXACTLY the sources the two grammars do not own", () => {
    const covered = MARK_DISPOSITIONS.map((r) => r.source).sort();
    const expected = SOURCE_NAMES.filter((n) => !GRAMMAR_SOURCES.includes(n)).sort();
    expect(
      covered,
      "a source joined the snapshot with no byte-order-mark row. The set is DERIVED from " +
        "SOURCE_NAMES rather than hand-listed here, so a seventh source is a red until somebody " +
        "answers the question for it",
    ).toEqual(expected);
    expect(new Set(covered).size, "one row per source").toBe(covered.length);
    expect(
      MARK_DISPOSITIONS.every((r) => r.answer.trim() !== ""),
      "every row carries an OBSERVED answer; a row with an empty answer is a silence wearing a " +
        "table's clothes",
    ).toBe(true);
  });

  it("queue: joins a mark-led claim record, exactly as it joins the same record without one", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantClaimAt(dir, "ABC-014", `${MARK}at: 2026-09-14T09:00:00.000Z\nby: engineer\n`);

      const result = readSnapshot(dir);
      const queue = result.snapshot.sources.queue;
      expect(queue.source).toBe("ok");
      expect(queue.source === "ok" ? queue.value : []).toEqual([
        { task: "ABC-014", by: "engineer", at: "2026-09-14T09:00:00.000Z" },
      ]);
      expect(result.readErrors).toEqual([]);
    });
  });

  it("queue: a mark-led record carrying TWO `at:` lines is still reported `tampered`", () => {
    // THE SECURITY HALF OF THE SAME DEFECT (T-32-05). `AT_KEY_LINE` counts lines beginning `at:`;
    // with a mark in front of the first one the count was ONE, the record passed the single-`at:`
    // discipline, and `AT_VALUE` then matched the SECOND — so a forged `at:` was read as the only
    // one. Three bytes turned the tamper detector off.
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const path = plantClaimAt(
        dir,
        "ABC-014",
        `${MARK}at: 2026-09-14T09:00:00.000Z\nat: 2026-01-01T00:00:00.000Z\nby: engineer\n`,
      );

      const result = readSnapshot(dir);
      const queue = result.snapshot.sources.queue;
      expect(
        queue.source === "ok" ? queue.value : [],
        "the record is skipped rather than trusted on either line",
      ).toEqual([]);
      const reported = result.readErrors.find((e) => e.path === path);
      expect(reported?.code).toBe("tampered");
      expect(reported?.message).toMatch(/carries 2 `at:` lines/);
    });
  });

  it("context: counts the note on a mark-led index line instead of reporting it as malformed", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantIndex(dir, "ABC-014", `${MARK}${JSON.stringify(NOTE)}\n`);

      const result = readSnapshot(dir);
      const context = result.snapshot.sources.context;
      expect(context.source === "ok" ? context.value : []).toEqual([
        {
          task: "ABC-014",
          noteCount: 1,
          liveCount: 1,
          latestAt: NOTE.at,
          latestKind: "finding",
        },
      ]);
      expect(result.readErrors).toEqual([]);
    });
  });

  it("traceability: reads a mark-led header row — immune by construction, and pinned", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTraceFile(
        dir,
        `${MARK}| Ticket | Title | Status |\n|--------|-------|--------|\n` +
          "| ABC-014 | Asset allocation chart | Done |\n",
      );

      const trace = readSnapshot(dir).snapshot.sources.traceability;
      expect(trace.source).toBe("ok");
      expect(trace.source === "ok" ? trace.value.map((r) => r.ticket) : []).toEqual(["ABC-014"]);
    });
  });

  it("config: reads a mark-led dial instead of falling back to the lean view", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantDial(dir, `${MARK}{ "mode": "lean", "id_prefix": "ABC" }`);

      const result = readSnapshot(dir);
      const config = result.snapshot.sources.config;
      expect(
        config.source,
        "a dial a Windows editor saved is a dial, not an unreadable source — the badge used to " +
          "say `unreadable` about a file whose JSON is valid",
      ).toBe("ok");
      expect(config.source === "ok" ? config.value.idPrefix : null).toBe("ABC");
      expect(result.readErrors).toEqual([]);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-33 — THE IDENTITY PAIR, THE NAMED EMPTY-STEM REFUSAL, AND THE DUPLICATE CHECK AS A MAP.
//
// THE READER'S HALF OF CR-03. A `plans/tickets/*.md` entry always has TWO identities: the name the
// directory gave it, and the identifier the document declares. They agree for every well-formed
// ticket, and the reader used to hand the join only the second — so a document admitted under a
// declared identifier that is not its file stem was, from the join's point of view, a file that did
// not exist. `TicketRecord.stem` carries the first identity, measured in the pass the reader already
// makes. `SCHEMA_VERSION` moved to 2 for it, by a recorded human decision (plan 32-33, Task 1).
//
// TWO CARRIED FINDINGS CLOSE HERE TOO. The duplicate check was `records.find(...)` inside the walk —
// n(n-1)/2 comparisons, about fifty million at the walk bound, on every watch event and every poll
// tick (WR-08). And an entry named exactly `.md` was ADMITTED under an identifier of zero characters,
// invisible inside a population the reader pins by count (IN-02); it is now refused by name and
// counted in the other half, which keeps the partition total rather than punching a hole in it.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** Stem `ABC-300`, declared identifier `ABC-777` — the third population, on disk. */
const MISMATCHED_TICKET =
  "---\nid: ABC-777\ntitle: Declares another identifier\nstatus: in-development\ncolumn: In Development\n---\n\nBody.\n";

describe("board-read — a record carries BOTH identities (plan 32-33, CR-03)", () => {
  it("admits a document whose declared id differs from its stem, with ZERO read errors", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const path = plantTicket(dir, "ABC-300.md", MISMATCHED_TICKET);

      const settled = readTicketsSource(dir, AT, undefined, {});
      // PREMISE: the file is on disk with the bytes this case planted, so a missing fixture cannot
      // make the assertions below pass for the wrong reason.
      expect(
        readFileSync(path, "utf8"),
        "PREMISE: the mismatched document was not planted, so this case measures nothing",
      ).toBe(MISMATCHED_TICKET);

      expect(
        settled.errors,
        "the document parsed cleanly, so nothing about it belongs on the error channel",
      ).toEqual([]);
      expect(settled.unadmitted).toEqual([]);
      expect(settled.state.source).toBe("ok");

      const records = settled.state.source === "ok" ? settled.state.value : [];
      expect(records.length).toBe(1);
      expect(records[0]?.file).toBe("ABC-300.md");
      expect(
        records[0]?.stem,
        "the record must carry the name the DIRECTORY gave the file, which is the identity the " +
          "join's presence question is asked with",
      ).toBe("ABC-300");
      expect(
        records[0]?.id,
        "and the identifier the DOCUMENT declares, which is the identity every other arm uses",
      ).toBe("ABC-777");
    });
  });

  it("derives `stem` from the file name for EVERY admitted record, agreeing or not", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      plantTicket(dir, "ABC-300.md", MISMATCHED_TICKET);

      const settled = readTicketsSource(dir, AT, undefined, {});
      const records = settled.state.source === "ok" ? settled.state.value : [];
      // DERIVED ON THE OTHER SIDE: the stem is checked against the record's own `file`, so a record
      // whose published stem disagrees with the name it came from is a failing case rather than a
      // value nobody compared.
      for (const r of records) expect(r.stem).toBe(r.file.slice(0, -".md".length));
      expect(records.length, "PREMISE: no record was produced, so the loop above ran zero times").toBe(
        2,
      );
      // And the two facts genuinely differ for one of them, so this is not vacuously true of a
      // corpus in which every file agrees with itself.
      expect(records.filter((r) => r.stem !== r.id).map((r) => r.file)).toEqual(["ABC-300.md"]);
    });
  });

  it("falls back to the stem when the document declares no identifier, as it always did", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", "---\ntitle: No id declared\ncolumn: Backlog\n---\n\nBody.\n");

      const records = (() => {
        const s = readTicketsSource(dir, AT, undefined, {});
        return s.state.source === "ok" ? s.state.value : [];
      })();
      expect(records[0]?.id).toBe("ABC-014");
      expect(records[0]?.stem).toBe("ABC-014");
    });
  });
});

describe("board-read — an entry named exactly `.md` is REFUSED by name (plan 32-33, IN-02)", () => {
  it("lands in the unadmitted half under `empty-stem`, leaving the source ok", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      const degenerate = plantTicket(dir, ".md", "---\ntitle: no stem at all\n---\n\nBody.\n");

      const settled = readTicketsSource(dir, AT, undefined, {});
      // PREMISE: the entry is on disk and the walk's own extension test admits it, so a case that
      // measured a filtered-out name would pass without the refusal existing.
      expect(existsSync(degenerate)).toBe(true);
      expect(".md".endsWith(".md")).toBe(true);

      expect(
        settled.unadmitted,
        "the entry must be a member of the refused population under a NAMED code, not a silent skip",
      ).toEqual([{ id: "", code: "empty-stem" }]);
      const named = settled.errors.find((e) => e.code === "empty-stem");
      expect(named?.source).toBe("tickets");
      expect(named?.path).toBe(degenerate);
      expect(
        named?.message,
        "the message must say what was refused and why an identifier of zero characters cannot " +
          "be joined — a code with no sentence is a skip with a label",
      ).toContain("identifier of zero characters");

      // NOT ADMITTED: the whole defect was that it used to be.
      const records = settled.state.source === "ok" ? settled.state.value : [];
      expect(records.map((r) => r.file)).toEqual(["ABC-014.md"]);
      // A NAMING REFUSAL IS NOT A FAILURE TO OBTAIN BYTES. The source stays `ok`, exactly as it
      // does for a grammar refusal; degrading it would blank every other derivation on the board.
      expect(settled.state.source).toBe("ok");
    });
  });

  it("keeps the partition TOTAL, against a denominator derived from the listing", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014.md", ADMITTED_TICKET);
      plantTicket(dir, ".md", "---\ntitle: no stem at all\n---\n\nBody.\n");
      plantTicket(dir, "REF-001.md", "---\nid: REF-001\ntools: Bash\n---\n");

      // THE DENOMINATOR IS TAKEN FROM THE LISTING, on the other side of the walk — the same
      // instrument plan 32-15 used, which is what makes a silent fourth exit a failing number.
      const listing = listDirectoryBounded(join(dir, "plans", "tickets"));
      const mdEntries =
        listing.kind === "listed" ? listing.names.filter((n) => n.endsWith(".md")) : [];
      expect(
        mdEntries,
        "PREMISE: the listing did not carry the degenerate entry, so the count below could " +
          "balance while the entry vanished before the walk ever saw it",
      ).toContain(".md");

      const settled = readTicketsSource(dir, AT, undefined, {});
      const records = settled.state.source === "ok" ? settled.state.value : [];
      expect(
        records.length + settled.unadmitted.length,
        "an entry left the walk without landing in either half: the partition is not total",
      ).toBe(mdEntries.length);
      // Both halves non-empty, and the refused half holds BOTH refusal reasons, so the equality is
      // not satisfied by one population having swallowed the listing.
      expect(records.length).toBe(1);
      expect(settled.unadmitted.map((u) => u.code).sort()).toEqual(["empty-stem", "unknown-key"]);
    });
  });

  it("is refused before its bytes are ever requested", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, ".md", "---\ntitle: no stem at all\n---\n\nBody.\n");
      const { seam, paths } = pathRecorder();

      readTicketsSource(dir, AT, undefined, seam);
      expect(
        paths.filter((p) => p.endsWith("/.md")),
        "a name this reader refuses is a name it never opens: reading first and refusing after " +
          "spends an open on an entry no identifier can ever reach",
      ).toEqual([]);
    });
  });
});

describe("board-read — the duplicate check is a MAP lookup, not a scan (plan 32-33, WR-08)", () => {
  it("still reports both files and joins the first, with the message unchanged", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      plantTicket(dir, "ABC-014-copy.md", "---\nid: ABC-014\ntitle: c\nstatus: done\ncolumn: Backlog\n---\n");
      const second = plantTicket(dir, "ABC-014.md", "---\nid: ABC-014\ntitle: o\nstatus: done\ncolumn: Backlog\n---\n");

      const settled = readTicketsSource(dir, AT, undefined, {});
      const named = settled.errors.filter((e) => e.code === "duplicate-id");
      expect(named.length, "one collision is one finding, not one per surviving record").toBe(1);
      expect(named[0]?.path).toBe(second);
      expect(named[0]?.message).toContain("ABC-014-copy.md is the one joined");
      expect(named[0]?.message).toContain("ABC-014.md");

      // BOTH RECORDS ARE STILL PUSHED, which is what keeps the partition total: the second document
      // WAS admitted, and which of the two is JOINED is the join's question, answered once there.
      const records = settled.state.source === "ok" ? settled.state.value : [];
      expect(records.map((r) => r.file)).toEqual(["ABC-014-copy.md", "ABC-014.md"]);
      expect(records.length + settled.unadmitted.length).toBe(2);
    });
  });

  it("reports THREE files claiming one identifier against the FIRST, not against each other", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      for (const n of ["ABC-014-a.md", "ABC-014-b.md", "ABC-014-c.md"]) {
        plantTicket(dir, n, "---\nid: ABC-014\ntitle: t\nstatus: done\ncolumn: Backlog\n---\n");
      }
      const settled = readTicketsSource(dir, AT, undefined, {});
      const named = settled.errors.filter((e) => e.code === "duplicate-id");
      expect(named.length, "two later claims on one identifier are two findings").toBe(2);
      // FIRST-BY-NAME IS STICKY. Both reports name the FIRST file, so the winner does not drift to
      // whichever document the previous iteration happened to hold — the failure a `seenById` that
      // overwrote on every hit would produce, and one a two-file case could never see.
      for (const e of named) expect(e.message).toContain("ABC-014-a.md is the one joined");
    });
  });

  it("contains no linear scan over the accumulated records (derived from the file)", () => {
    // STRUCTURAL, BECAUSE A TIMING ASSERTION IS A FLAKY ONE. The measured before/after at 10,000
    // entries is recorded in 32-33-RED-baseline.txt § 4 and 32-33-GREEN-proof.txt; what a suite can
    // assert deterministically is that the SHAPE which produced the quadratic term is gone.
    //
    // OVER THE AST, NOT OVER THE BYTES, AND THAT IS LOAD-BEARING. The docblock beside the map
    // lookup NAMES the call it replaced, so a text scan for that spelling finds the sentence
    // describing the fix and reports the defect as still present. A comment is not a node, so a
    // walk over the syntax tree asks the question of CODE without a second comment stripper
    // needing to exist anywhere.
    const absPath = join(ROOT, "scripts", "board-read.ts");
    const text = readFileSync(absPath, "utf8");
    expect(
      text,
      "PREMISE: the docblock naming the replaced call is gone, so this case would pass over raw " +
        "bytes too and proves nothing about reading the AST instead",
    ).toContain("records.find(");

    const source = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true);
    let walk: ts.Node | null = null;
    source.forEachChild((n) => {
      if (ts.isFunctionDeclaration(n) && n.name?.text === "readTicketsSource") walk = n;
    });
    expect(walk, "PREMISE: `readTicketsSource` was not found, so this case walked nothing").not.toBe(
      null,
    );

    // THE SET IS DERIVED FROM WHAT A LINEAR SCAN IS, not from the one spelling that was there. Any
    // membership or search call over the accumulating array costs a pass per entry.
    const SCANS = new Set([
      "find",
      "findIndex",
      "findLast",
      "some",
      "every",
      "filter",
      "includes",
      "indexOf",
      "lastIndexOf",
    ]);
    const offenders: string[] = [];
    const calls = new Set<string>();
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const target = node.expression.expression;
        const method = node.expression.name.text;
        if (ts.isIdentifier(target)) {
          calls.add(`${target.text}.${method}`);
          if (target.text === "records" && SCANS.has(method)) offenders.push(`records.${method}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(walk as unknown as ts.Node);

    expect(
      offenders,
      "a per-entry scan over the records accumulated so far costs n(n-1)/2 comparisons inside a " +
        "walk bounded at 10,000, on every watch event and every poll tick",
    ).toEqual([]);
    expect(
      calls.has("seenById.get") && calls.has("seenById.set"),
      "PREMISE: the map lookup that replaced the scan is absent, so the emptiness above is " +
        "vacuously true of a walk that stopped checking for duplicates at all",
    ).toBe(true);
    expect(
      calls.has("records.push"),
      "PREMISE: the walk pushes no record, so `records` is not the accumulating array this case " +
        "is about",
    ).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// REVIEW IN-02 — A DIAL COLUMN SPELLED LIKE A PROTOTYPE MEMBER REACHES ITS CONFLICT ARM.
//
// THE DEFECT, AND WHY IT IS A CORRECTNESS DEFECT RATHER THAN A CURIOSITY. `configView` built its
// limit map as a plain `{}`. `JSON.parse` creates an OWN `__proto__` property and `Object.entries`
// yields it, but `limits["__proto__"] = 7` runs `Object.prototype`'s setter and lands NOTHING —
// no error, no diagnostic, no key. `joinSnapshot`'s `column-missing` arm iterates the keys that
// landed, so a dial naming a column the board has no heading for produced NO conflict at all. D-10
// makes `conflicts[]` the place a disagreement is SURFACED and never resolved, and disappearing is
// the most silent resolution there is.
//
// BOTH ARMS ARE ASSERTED, WHICH IS WHERE THIS PHASE HAS REPEATEDLY LOST ROUNDS. A fix that turned
// every prototype-spelled key into a conflict would have replaced one wrong answer with another, so
// the case below is paired with its sibling: the same spelling with a HEADING on the board raises
// no `column-missing` and takes part in the limit comparison exactly as any other column does.
//
// The dial is written as RAW JSON TEXT rather than through `JSON.stringify` of an object literal,
// because an object literal's `__proto__:` key sets the prototype instead of creating a property —
// the plant has to arrive the way a writer's file arrives, through the parser.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("board-read — a prototype-spelled dial column is a conflict, not a disappearance (IN-02)", () => {
  /** The member name whose assignment onto a plain object is a silent no-op. */
  const PROTO_KEY = "__proto__";

  function plantProtoDial(dir: string, body: string): void {
    mkdirSync(join(dir, "agent-factory", "config"), { recursive: true });
    writeFileSync(join(dir, "agent-factory", "config", "factory.config.json"), body, "utf8");
  }

  it("PREMISE: the planted dial really does carry the key as an OWN property after a parse", () => {
    // If the plant did not survive `JSON.parse` as an own property, both cases below would be
    // measuring an ordinary absent key and would pass for a reason that proves nothing.
    const text = `{"mode":"lean","wip_limits":{"${PROTO_KEY}":7,"Backlog":2}}\n`;
    const parsed = JSON.parse(text) as { wip_limits: Record<string, number> };
    expect(
      Object.hasOwn(parsed.wip_limits, PROTO_KEY),
      "PREMISE: the parser did not create an own property for the planted key",
    ).toBe(true);
    expect(Object.keys(parsed.wip_limits)).toContain(PROTO_KEY);
  });

  it("raises `column-missing` for a prototype-spelled column with NO heading on the board", () => {
    withTempTree((dir) => {
      plantBoard(dir, "## Backlog (WIP 0/2)\n");
      plantProtoDial(dir, `{"mode":"lean","wip_limits":{"${PROTO_KEY}":7,"In Review":3}}\n`);

      const conflicts = readSnapshot(dir).conflicts.filter((c) => c.kind === "column-missing");
      const columns = conflicts.map((c) => c.column).sort();

      // THE ORDINARY MISSING COLUMN IS IN THE SAME LIST ON PURPOSE. It is the control: it proves
      // the arm was reached and reporting at all, so the prototype-spelled entry's presence is a
      // measurement of THIS key rather than of the arm being switched on.
      expect(
        columns,
        "a dial column spelled like a prototype member did not reach the `column-missing` arm. " +
          "The key never landed in the limit map, so the projector resolved the disagreement by " +
          "dropping it — which D-10 forbids (review IN-02)",
      ).toEqual([PROTO_KEY, "In Review"].sort());

      const proto = conflicts.find((c) => c.column === PROTO_KEY);
      expect(proto?.expected).toBe(`a heading for the configured column ${PROTO_KEY}`);
      expect(proto?.actual).toBe("no heading on the board opens that column");
      expect(proto?.source, "the expectation came from the dial, so the source is `config`").toBe(
        "config",
      );
    });
  });

  it("SIBLING ARM: raises NO `column-missing` when that heading IS on the board, and the limit is compared", () => {
    withTempTree((dir) => {
      plantBoard(dir, `## ${PROTO_KEY} (WIP 0/5)\n\n## Backlog (WIP 0/2)\n`);
      plantProtoDial(dir, `{"mode":"lean","wip_limits":{"${PROTO_KEY}":7,"Backlog":2}}\n`);

      const result = readSnapshot(dir);

      expect(
        result.conflicts.filter((c) => c.kind === "column-missing"),
        "a fix that makes EVERY prototype-spelled key a conflict has replaced one wrong answer " +
          "with another. The heading exists, so there is nothing missing",
      ).toEqual([]);

      // AND IT IS A FULL PARTICIPANT, not merely un-flagged: the dial's 7 is compared against the
      // heading's 5 exactly as it would be for any other column name.
      const limit = result.conflicts.filter(
        (c) => c.kind === "wip-limit" && c.column === PROTO_KEY,
      );
      expect(
        limit.map((c) => `${c.expected}/${c.actual}`),
        "the limit for the prototype-spelled column took no part in the claimed/counted/limit " +
          "comparison, so it is present in name only",
      ).toEqual(["7/5"]);

      // PREMISE: the ordinary column beside it agrees with its dial entry, so the single conflict
      // above is this column's and not a whole-board disagreement.
      expect(
        result.conflicts.filter((c) => c.kind === "wip-limit" && c.column === "Backlog"),
      ).toEqual([]);
    });
  });

  it("the published limit map carries the key as an OWN property a consumer's parse recovers", () => {
    withTempTree((dir) => {
      plantBoard(dir, "## Backlog (WIP 0/2)\n");
      plantProtoDial(dir, `{"mode":"lean","wip_limits":{"${PROTO_KEY}":7,"Backlog":2}}\n`);

      const config = readSnapshot(dir).snapshot.sources.config;
      const view = config.source === "unavailable" ? null : config.value;
      expect(view, "PREMISE: the dial was not read at all, so nothing below measures a key").not.toBe(
        null,
      );
      const limits = view?.wipLimits ?? {};
      expect(
        Object.hasOwn(limits, PROTO_KEY),
        "the limit map does not carry the key as an own property, so every consumer downstream " +
          "— the conflict arm, the renderer and the `--json` document — sees a dial that never " +
          "named it",
      ).toBe(true);
      expect(Object.keys(limits).sort()).toEqual([PROTO_KEY, "Backlog"].sort());
      expect(limits[PROTO_KEY]).toBe(7);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32.1-12 — THE COMPOSED CLAIM-RECORD PATH, ONE REGISTER OVER FROM F-14 (D-07, D-19).
//
// WHAT IS BEING REPRODUCED. `childPath` refuses only an empty segment, a dot, a double dot and a
// segment carrying a separator, so a directory entry name carrying a code point the renderer DELETES
// passes it, is joined into a composed path, and is quoted into the claimed-queue reader's `no-at`
// and `tampered` sentences — which are NOT built through `spelled`. The published document then
// names a file that does not exist on the tree: a reader who searches for what the sentence prints
// finds nothing. That is F-14 exactly, one register over from the identifier it was measured on.
//
// WHY THE PLANT IS THE REPOSITORY ROOT'S OWN DIRECTORY ENTRY, AND NOT THE CLAIMED TASK'S. The plan
// named the claimed-stage entry, and measurement refused it: `isSafeTaskName` allows only
// `[A-Za-z0-9._-]`, so a claimed-stage entry carrying a C1 point never reaches `childPath` at all —
// it leaves through the `unsafe-task-name` arm, which is ALREADY built through the builder. The last
// case in this block asserts that rather than asserting it away. The two variable segments of
// `{root}/.grugops/queue/claimed/{task}/claim.md` are the root and the task; the task is
// allowlisted, so the root's own entry name is the one position from which a deleted code point
// reaches these two sentences. It is a directory entry name joined into a composed path, which is
// the class D-07 names.
//
// EVERY PLANTED CODE POINT IS A BACKSLASH-U ESCAPE IN THIS SOURCE, never a raw byte:
// `scripts/check-nul-bytes.ts` scans tracked files and a raw byte here would red it — and writing
// one would be this plan's own defect, one document over.
//
// THE SAME VALUE IS MEASURED AT THREE POINTS IN ONE RUN: the model's own sentence, the rendered
// stderr frame, and the published JSON document. A fix proved at one channel and unmeasured at the
// other two is the shape that produced F-14.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Every code point `sanitizeCell` DELETES on the way to a reader, spelled with escapes so this
 * source file carries none of them. The mirror of `board-model.ts`'s `RENDER_STRIPPED`.
 */
const RENDER_DELETED_32112 = /[\u0000-\u001F\u007F-\u009F]/;

/** The uniform notation `visible` produces for one deleted code point. */
function spelling32112(point: string): string {
  return `<U+${(point.codePointAt(0) as number).toString(16).toUpperCase().padStart(4, "0")}>`;
}

/** The same claim-record sentence as each of the three channels rendered it, from ONE run. */
type ClaimSentence32112 = {
  readonly plantedEntry: string;
  readonly parentListing: readonly string[];
  readonly modelMessage: string;
  readonly stderrFrame: string;
  readonly documentMessage: string;
};

type PublishedDoc32112 = { readonly readErrors: readonly { source: string; code: string; message: string }[] };

/**
 * Plant a repository root whose OWN directory entry name carries `point`, reach one claim-record
 * arm, and measure the sentence at all three channels in one run.
 *
 * EVERY PREMISE IS A FAILING ASSERTION. The planted entry must be on disk under the name it was
 * planted with, the reader must have reached the arm under test, the spawned dashboard must exit 0,
 * and its stdout must parse as exactly one document. A fixture that never reached its state
 * produces a finding about nothing — this repository has recorded that false premise six times.
 */
function measureClaimSentence32112(
  point: string,
  kind: "no-at" | "tampered",
  run: (measured: ClaimSentence32112) => void,
): void {
  const parent = mkdtempSync(join(realpathSync(tmpdir()), "grugops-board-read-32112-"));
  try {
    const plantedEntry = `repo${point}x`;
    const root = join(parent, plantedEntry);
    mkdirSync(join(root, "plans"), { recursive: true });
    writeFileSync(join(root, "plans", "board.md"), ONE_COLUMN, "utf8");

    const task = kind === "no-at" ? "task-no-at" : "task-tampered";
    const taskDir = join(root, ".grugops", "queue", "claimed", task);
    mkdirSync(taskDir, { recursive: true });
    writeFileSync(
      join(taskDir, "claim.md"),
      kind === "no-at"
        ? "by: someone\n"
        : "by: someone\nat: 2026-01-01T00:00:00Z\nat: 2026-01-02T00:00:00Z\n",
      "utf8",
    );

    const parentListing = readdirSync(parent);
    expect(
      parentListing,
      "PREMISE: the planted repository-root entry is not on disk under the name it was planted " +
        "with, so nothing below measures a directory entry name reaching a composed path",
    ).toEqual([plantedEntry]);

    const modelErrors = readSnapshot(root).readErrors.filter(
      (e) => e.source === "queue" && e.code === kind,
    );
    expect(
      modelErrors.length,
      `PREMISE: the queue reader did not reach the \`${kind}\` arm exactly once. The fixture never ` +
        `entered the state this case is about, so the sentence property below would be asserted ` +
        `about a sentence nobody produced`,
    ).toBe(1);

    const r = spawnSync(process.execPath, [DASHBOARD_JS, root, "--once", "--json"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 20_000,
    });
    expect(
      r.status,
      `PREMISE: the spawned dashboard must exit 0 over the planted tree; stderr was ${JSON.stringify(r.stderr)}`,
    ).toBe(0);
    let parsed: PublishedDoc32112 | null = null;
    expect(() => {
      parsed = JSON.parse(r.stdout ?? "") as PublishedDoc32112;
    }, "PREMISE: stdout in its entirety must parse as EXACTLY ONE JSON document").not.toThrow();
    const doc = parsed as unknown as PublishedDoc32112 | null;
    expect(doc, "PREMISE: stdout in its entirety must parse as EXACTLY ONE JSON document").not.toBeNull();
    const published = (doc?.readErrors ?? []).filter((e) => e.source === "queue" && e.code === kind);
    expect(
      published.length,
      `PREMISE: the published document carries no single \`${kind}\` queue read error, so the ` +
        `document channel measured below is not carrying the sentence under test`,
    ).toBe(1);

    run({
      plantedEntry,
      parentListing,
      modelMessage: modelErrors[0]?.message ?? "",
      stderrFrame: r.stderr ?? "",
      documentMessage: published[0]?.message ?? "",
    });
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
}

/** The one property, asserted identically at all three channels. */
function assertSpelledAtThreePoints32112(m: ClaimSentence32112, point: string): void {
  const spelled32112 = `repo${spelling32112(point)}x`;
  const deleted = "repox";

  expect(
    m.modelMessage,
    "THE MODEL'S OWN SENTENCE quotes the composed claim-record path with the code point raw. It is " +
      "built outside the builder, so nothing spelled it — and every renderer downstream deletes it",
  ).toContain(spelled32112);
  expect(
    RENDER_DELETED_32112.test(m.modelMessage),
    "the model's sentence still carries a code point a renderer DELETES, so the value that reaches " +
      "a published channel is not the value the sentence states",
  ).toBe(false);

  expect(
    m.stderrFrame,
    "THE RENDERED STDERR FRAME does not name the planted entry in the escape spelling `visible` " +
      "produces, so a reader who re-types what is printed reaches a different path",
  ).toContain(spelled32112);

  expect(
    m.documentMessage,
    "THE PUBLISHED JSON DOCUMENT does not name the planted entry in the escape spelling. The " +
      "sanitizer deleted the code point on the way out, so the document states a path that does " +
      "not exist on the tree — F-14 exactly, one register over",
  ).toContain(spelled32112);
  expect(
    m.documentMessage.includes(deleted),
    "the published sentence names `repox`, a directory entry that does not exist: the code point " +
      "was deleted where the sentence was written rather than spelled where it was built",
  ).toBe(false);
}

describe("32.1-12 — a composed claim-record path SPELLS a directory entry's deleted code point (D-07, D-19)", () => {
  it("the `no-at` sentence spells U+0085 at the model, the stderr frame and the document", () => {
    measureClaimSentence32112("\u0085", "no-at", (m) => {
      assertSpelledAtThreePoints32112(m, "\u0085");
    });
  });

  it("the `tampered` sentence spells U+009F at the model, the stderr frame and the document", () => {
    measureClaimSentence32112("\u009F", "tampered", (m) => {
      assertSpelledAtThreePoints32112(m, "\u009F");
    });
  });

  it("a C0 point behaves identically — the class is what the renderer deletes, not one code point", () => {
    measureClaimSentence32112("\u0001", "no-at", (m) => {
      assertSpelledAtThreePoints32112(m, "\u0001");
    });
  });

  it("PREMISE FOR THE PLANT: a C1 point in the claimed-stage ENTRY name leaves by the already-built arm", () => {
    withTempTree((dir) => {
      plantBoard(dir, ONE_COLUMN);
      const taskDir = join(dir, ".grugops", "queue", "claimed", "task\u0085x");
      mkdirSync(taskDir, { recursive: true });
      writeFileSync(join(taskDir, "claim.md"), "by: someone\n", "utf8");

      const queueErrors = readSnapshot(dir).readErrors.filter((e) => e.source === "queue");
      expect(
        queueErrors.map((e) => e.code),
        "the claimed-stage allowlist (`isSafeTaskName`, `[A-Za-z0-9._-]`) no longer refuses an " +
          "entry carrying a C1 point. If it now reaches `childPath`, the plan's literal plant " +
          "becomes reachable and this block's root-entry plant is no longer the only position",
      ).toEqual(["unsafe-task-name"]);
      expect(
        queueErrors[0]?.message ?? "",
        "the refusal that DOES fire is built through the builder already, which is why the " +
          "reproduction above plants the code point in the repository root's own entry name " +
          "instead: that is the one variable segment of the composed claim-record path that is " +
          "not allowlisted",
      ).toContain(`task${spelling32112("\u0085")}x`);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32.1-13 — THE SAME PROPERTY, AT THE OTHER ARMS A COMPOSED PATH REACHES (D-07, D-19).
//
// WHY MORE ARMS RATHER THAN A BETTER ARGUMENT. Plan 32.1-12 proved the defect at ONE path — the
// claimed queue's claim-record sentences — and closed it there. Proving one arm and reasoning about
// the rest is the move this repository's ledger records failing round after round: the fix lands in
// one arm and the next round finds the same defect one register over. So the tracer's single path is
// widened here to the arms a composed path actually reaches from a DIFFERENT reader each time — the
// context reader's shape refusal, the context reader's event-index parse refusal, and the ticket
// reader's decode refusal — each measured at the same three channels in the same one run.
//
// THE PLANT IS THE SAME AND FOR THE SAME REASON: the repository ROOT's own directory entry name is
// the one variable segment of every composed path below that no allowlist covers. `isSafeTaskName`
// and the context reader's own name refusal cover the entry names underneath it; the root's name is
// what a caller hands in.
//
// EVERY PLANTED CODE POINT IS A BACKSLASH-U ESCAPE IN THIS SOURCE, never a raw byte.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Plant a repository root whose OWN entry name carries `point`, let `plant` put the tree into the
 * state ONE arm is about, and measure that arm's sentence at all three channels in one run.
 *
 * EVERY PREMISE IS A FAILING ASSERTION, for the reason recorded above the 32.1-12 helper: a fixture
 * that never reached its state produces a finding about nothing.
 */
function measureComposedSentence32113(
  point: string,
  arm: string,
  plant: (root: string) => void,
  select: (e: { source: string; code: string; message: string }) => boolean,
  run: (measured: ClaimSentence32112) => void,
): void {
  const parent = mkdtempSync(join(realpathSync(tmpdir()), "grugops-board-read-32113-"));
  try {
    const plantedEntry = `repo${point}x`;
    const root = join(parent, plantedEntry);
    mkdirSync(join(root, "plans"), { recursive: true });
    writeFileSync(join(root, "plans", "board.md"), ONE_COLUMN, "utf8");
    plant(root);

    const parentListing = readdirSync(parent);
    expect(
      parentListing,
      "PREMISE: the planted repository-root entry is not on disk under the name it was planted " +
        "with, so nothing below measures a directory entry name reaching a composed path",
    ).toEqual([plantedEntry]);

    const modelErrors = readSnapshot(root).readErrors.filter(select);
    expect(
      modelErrors.length,
      `PREMISE: the reader did not reach the \`${arm}\` arm exactly once. The fixture never ` +
        `entered the state this case is about, so the sentence property below would be asserted ` +
        `about a sentence nobody produced`,
    ).toBe(1);

    const r = spawnSync(process.execPath, [DASHBOARD_JS, root, "--once", "--json"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 20_000,
    });
    expect(
      r.status,
      `PREMISE: the spawned dashboard must exit 0 over the planted tree; stderr was ${JSON.stringify(r.stderr)}`,
    ).toBe(0);
    let parsed: PublishedDoc32112 | null = null;
    expect(() => {
      parsed = JSON.parse(r.stdout ?? "") as PublishedDoc32112;
    }, "PREMISE: stdout in its entirety must parse as EXACTLY ONE JSON document").not.toThrow();
    const doc = parsed as unknown as PublishedDoc32112 | null;
    expect(doc, "PREMISE: stdout in its entirety must parse as EXACTLY ONE JSON document").not.toBeNull();
    const published = (doc?.readErrors ?? []).filter(select);
    expect(
      published.length,
      `PREMISE: the published document carries no single \`${arm}\` read error, so the document ` +
        `channel measured below is not carrying the sentence under test`,
    ).toBe(1);

    run({
      plantedEntry,
      parentListing,
      modelMessage: modelErrors[0]?.message ?? "",
      stderrFrame: r.stderr ?? "",
      documentMessage: published[0]?.message ?? "",
    });
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
}

describe("32.1-13 — every composed path a published sentence quotes SPELLS a deleted code point", () => {
  it("the context reader's shape refusal spells U+0085 at the model, the frame and the document", () => {
    measureComposedSentence32113(
      "\u0085",
      "context/not-a-directory",
      (root) => {
        mkdirSync(join(root, ".grugops", "context"), { recursive: true });
        writeFileSync(join(root, ".grugops", "context", "ctxtask"), "not a directory\n", "utf8");
      },
      (e) => e.source === "context" && e.code === "not-a-directory",
      (m) => {
        assertSpelledAtThreePoints32112(m, "\u0085");
      },
    );
  });

  it("the context reader's event-index parse refusal spells U+009F at all three channels", () => {
    measureComposedSentence32113(
      "\u009F",
      "context/PARSE",
      (root) => {
        const taskDir = join(root, ".grugops", "context", "ctxtask");
        mkdirSync(taskDir, { recursive: true });
        writeFileSync(join(taskDir, "index.jsonl"), "{ this is not json\n", "utf8");
      },
      (e) => e.source === "context" && e.code === "PARSE",
      (m) => {
        assertSpelledAtThreePoints32112(m, "\u009F");
      },
    );
  });

  it("the ticket reader's decode refusal spells U+0001 at all three channels", () => {
    measureComposedSentence32113(
      "\u0001",
      "tickets/ENCODING",
      (root) => {
        const ticketsDir = join(root, "plans", "tickets");
        mkdirSync(ticketsDir, { recursive: true });
        // AN INVALID UTF-8 SEQUENCE, WRITTEN AS BYTES. `0xC3` opens a two-byte sequence and `0x28`
        // cannot continue it, so `TextDecoder(..., { fatal: true })` throws and the read leaves by
        // the `ENCODING` arm, which quotes the composed ticket path.
        writeFileSync(join(ticketsDir, "ABC-014.md"), Buffer.from([0xc3, 0x28, 0x0a]));
      },
      (e) => e.source === "tickets" && e.code === "ENCODING",
      (m) => {
        assertSpelledAtThreePoints32112(m, "\u0001");
      },
    );
  });
});

// board-tracer.test.ts — the Phase 32 tracer: ONE path through every layer, proven end to end.
//
// WHAT THIS FILE IS. Plan 32-01 wires the real kit board on disk through a comment-blanking
// pre-pass, the D-05 heading grammar and the D-01/D-22 row grammar, into a `BoardModel`, then
// through the fs-touching read seam (`scripts/board-read.ts`) into a `FactorySnapshot`, and out of
// the CLI (`scripts/board-dashboard.ts`) as one `--json` document and one plain-text `--once`
// frame. Every assertion below is on that one path. The breadth — the mutation corpus (plan 32-04),
// the seven-kind conflict closure (plan 32-05), the import-graph guard (plan 32-06) and the full
// D-17 frame (plan 32-07) — lands later and is NOT asserted here.
//
// THE CORPUS IS THE REAL FILE, NOT A TRANSCRIPTION. `plans/board.md` is read from the repository
// root. A transcription would drift from the artifact it claims to measure, and the single
// highest-value case in this phase (D-03: the board's own 48-line HTML comment contributes zero
// columns and zero rows) is only meaningful against the bytes that actually ship.
//
// EVERY PREMISE THIS FILE RESTS ON IS A FAILING ASSERTION, NOT AN ASSUMPTION. This repository has
// recorded a FALSE verification-harness premise six times across four rounds (project memory,
// Phase 31), so each premise carries a `PREMISE:` message and is asserted before the findings that
// depend on it. A `PREMISE:` message in the output means the harness measured nothing.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  HEADING_SUFFIXES,
  HEADING_SUFFIX_COUNT,
  SCHEMA_VERSION,
  boardColumnName,
  boardHasColumn,
  kebab,
  parseBoard,
  splitRow,
  stripHtmlComments,
} from "./board-model.js";

const ROOT = join(import.meta.dirname, "..");
const BOARD_REL = "plans/board.md";

/** The 13 column names of the kit board, in on-disk heading order (D-05 flow order). */
const KIT_COLUMNS = [
  "Backlog",
  "Ready",
  "In Analysis",
  "In Design",
  "Ready for Dev",
  "In Development",
  "In Review",
  "In Security/NFR",
  "Ready for UAT",
  "In UAT",
  "Ready to Release",
  "Done",
  "Blocked",
] as const;

function readBoard(): string {
  return readFileSync(join(ROOT, BOARD_REL), "utf8");
}

describe("board tracer — the harness premise", () => {
  it("reads the REAL kit board from the repository root", () => {
    expect(
      existsSync(join(ROOT, BOARD_REL)),
      `PREMISE: ${BOARD_REL} does not exist under ${ROOT}, so every finding below measured a file ` +
        "that was never read",
    ).toBe(true);
    const text = readBoard();
    expect(
      text.length,
      `PREMISE: ${BOARD_REL} read as ZERO bytes, so the parse findings below say nothing about the ` +
        "artifact that ships",
    ).toBeGreaterThan(0);
    expect(
      text.includes("<!--"),
      `PREMISE: ${BOARD_REL} carries no HTML comment at all, so the D-03 comment-blanking case ` +
        "below is vacuous",
    ).toBe(true);
    expect(
      text.includes("## In Development (WIP 1/3)"),
      "PREMISE: the four-space-indented mini-board inside the HTML comment is gone from " +
        `${BOARD_REL}, so the highest-value case in this phase has no subject`,
    ).toBe(true);
  });
});

describe("board-model — the heading grammar (D-05)", () => {
  it("pins the heading-suffix count two-sided", () => {
    expect(HEADING_SUFFIXES.length).toBe(HEADING_SUFFIX_COUNT);
    expect(
      HEADING_SUFFIX_COUNT,
      "a fourth legal heading suffix is a DECISION recorded in agent-factory/contracts/board.md " +
        "and in this repository's phase context, never a bumped constant",
    ).toBe(3);
  });

  it("exports the published schema version", () => {
    expect(SCHEMA_VERSION).toBe(1);
  });

  it("parses the kit board to 13 columns in on-disk order, each with zero rows", () => {
    const model = parseBoard(readBoard());
    expect(model.columns.map((c) => c.name)).toEqual([...KIT_COLUMNS]);
    expect(model.columns.every((c) => c.rows.length === 0)).toBe(true);
    expect(model.epicRows).toEqual([]);
  });

  it("carries the claimed live count and the limit for a limited column", () => {
    const model = parseBoard(readBoard());
    const dev = model.columns.find((c) => c.name === "In Development");
    expect(dev?.kind).toBe("limited");
    expect(dev?.claimedLive).toBe(0);
    expect(dev?.limit).toBe(3);
  });

  it("carries no numbers for an unlimited column and for Blocked", () => {
    const model = parseBoard(readBoard());
    const backlog = model.columns.find((c) => c.name === "Backlog");
    expect(backlog?.kind).toBe("unlimited");
    expect(backlog?.claimedLive).toBeNull();
    expect(backlog?.limit).toBeNull();
    const blocked = model.columns.find((c) => c.name === "Blocked");
    expect(blocked?.kind).toBe("blocked");
    expect(blocked?.claimedLive).toBeNull();
    expect(blocked?.limit).toBeNull();
  });

  it("opens no column for a non-canonical `##` suffix", () => {
    expect(boardColumnName("## Columns (spec §6.1)")).toBeNull();
    expect(boardColumnName("## Conventions")).toBeNull();
    expect(boardColumnName("## Notes (bootstrap, 2026-06-05)")).toBeNull();
    // D-07: the old spec's Blocked form is documented non-grammar and is refused, never widened.
    expect(boardColumnName("## Blocked (2)")).toBeNull();
  });

  it("opens no column for an `###` heading, whatever its suffix", () => {
    expect(boardColumnName("### In Development (WIP 1/3)")).toBeNull();
    expect(boardColumnName("### Blocked (visible, time-tracked)")).toBeNull();
  });

  it("opens no column for an INDENTED heading — a `trimStart` here turns documentation into state", () => {
    expect(boardColumnName("    ## In Development (WIP 1/3)")).toBeNull();
    expect(boardColumnName("  ## Backlog (WIP unlimited)")).toBeNull();
  });

  it("names the column for each of the three legal suffixes", () => {
    expect(boardColumnName("## In Development (WIP 1/3)")).toBe("In Development");
    expect(boardColumnName("## Backlog (WIP unlimited)")).toBe("Backlog");
    expect(boardColumnName("## Blocked (visible, time-tracked)")).toBe("Blocked");
  });

  it("admits the blocked suffix only under the name `Blocked` (D-07)", () => {
    expect(boardColumnName("## Stuck (visible, time-tracked)")).toBeNull();
  });

  it("requires EXACT name equality after the suffix strip — the WR-03 counterexample", () => {
    // The pre-Phase-32 helper used `startsWith("## " + col + " ")`, so column `In` matched
    // `## In Development (WIP 0/3)`. The defect is pinned here so a future edit cannot restore it.
    const model = parseBoard("## In Development (WIP 0/3)\n");
    expect(boardHasColumn(model, "In")).toBe(false);
    expect(boardHasColumn(model, "In Development")).toBe(true);
  });

  it("keeps two headings that normalize to the same name as two columns in file order", () => {
    const model = parseBoard(
      "## Done (WIP unlimited)\n- [ABC-001] first\n\n## Done (WIP 1/2)\n- [ABC-002] second\n",
    );
    expect(model.columns.map((c) => c.name)).toEqual(["Done", "Done"]);
    expect(model.columns[0].kind).toBe("unlimited");
    expect(model.columns[1].kind).toBe("limited");
    expect(model.columns[0].rows.map((r) => r.id)).toEqual(["ABC-001"]);
    expect(model.columns[1].rows.map((r) => r.id)).toEqual(["ABC-002"]);
  });

  it("closes the open column at a non-column `##` heading", () => {
    const model = parseBoard(
      "## Done (WIP unlimited)\n- [ABC-001] first\n\n## Conventions\n- [ABC-002] not a board row\n",
    );
    expect(model.columns.length).toBe(1);
    expect(model.columns[0].rows.map((r) => r.id)).toEqual(["ABC-001"]);
  });
});

describe("board-model — the comment pre-pass (D-03)", () => {
  it("blanks every comment span while preserving every line number", () => {
    const text = "a\n<!-- one\ntwo -->\nb\n";
    const stripped = stripHtmlComments(text);
    expect(stripped.split("\n").length).toBe(text.split("\n").length);
    expect(stripped.split("\n")[0]).toBe("a");
    expect(stripped.split("\n")[1].trim()).toBe("");
    expect(stripped.split("\n")[2].trim()).toBe("");
    expect(stripped.split("\n")[3]).toBe("b");
  });

  it("blanks to end of file on an UNTERMINATED opener — fail closed", () => {
    const text = "## Backlog (WIP unlimited)\n<!-- never closed\n## Done (WIP unlimited)\n";
    expect(stripHtmlComments(text).split("\n").length).toBe(text.split("\n").length);
    expect(parseBoard(text).columns.map((c) => c.name)).toEqual(["Backlog"]);
  });

  it("gives the kit board's 48-line comment ZERO columns and ZERO rows", () => {
    const text = readBoard();
    const lines = text.split("\n");
    const open = lines.findIndex((l) => l.trimStart().startsWith("<!--"));
    const close = lines.findIndex((l) => l.includes("-->"));
    expect(
      open >= 0 && close > open,
      "PREMISE: no `<!--` … `-->` span was located in the kit board, so the assertion below could " +
        "not be false for any parse",
    ).toBe(true);
    const model = parseBoard(text);
    // Every column and every row the parse reports sits OUTSIDE the comment span.
    for (const c of model.columns) {
      expect(c.line < open + 1 || c.line > close + 1).toBe(true);
      for (const r of c.rows) {
        expect(r.line < open + 1 || r.line > close + 1).toBe(true);
      }
    }
    // And the span itself, parsed alone, yields nothing at all.
    const spanOnly = lines.slice(open, close + 1).join("\n");
    expect(
      spanOnly.includes("## In Development (WIP 1/3)"),
      "PREMISE: the extracted span carries no mini-board, so parsing it alone proves nothing",
    ).toBe(true);
    const spanModel = parseBoard(spanOnly);
    expect(spanModel.columns).toEqual([]);
    expect(spanModel.epicRows).toEqual([]);
  });
});

describe("board-model — the row grammar (D-01 as amended by D-22)", () => {
  it("splits a parenthetical that closes the line", () => {
    expect(
      splitRow("Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)"),
    ).toEqual({
      title: "Asset allocation chart",
      meta: "owner: Software Engineer, since: 2026-06-01",
      trailer: "",
    });
  });

  it("keeps trailing prose after the balanced close as an opaque trailer (D-22)", () => {
    const parts = splitRow(
      "Project scaffold + CI baseline  (epic: EPIC-006, size: M, P0)  — merged to main 2026-06-06 (lean: done = merged)",
    );
    expect(parts.title).toBe("Project scaffold + CI baseline");
    expect(parts.meta).toBe("epic: EPIC-006, size: M, P0");
    expect(parts.trailer).not.toBe("");
    expect(parts.trailer).toContain("merged to main 2026-06-06");
  });

  it("scans to the BALANCED close, so nested parentheses stay inside the meta", () => {
    const parts = splitRow("Nothing observes the QE hop  (BA/PM, **M (5), P2**, epic: —)");
    expect(parts.meta).toBe("BA/PM, **M (5), P2**, epic: —");
    expect(parts.trailer).toBe("");
  });

  it("splits at the FIRST two-space-paren, so a single-space paren in the title is not a split", () => {
    const parts = splitRow("Login 500 (runtime .env not loaded)  (epic: EPIC-002, size: S)");
    expect(parts.title).toBe("Login 500 (runtime .env not loaded)");
    expect(parts.meta).toBe("epic: EPIC-002, size: S");
  });

  it("returns the whole remainder as the title when the parenthetical never closes", () => {
    const parts = splitRow("The entry point  (M, P0, epic: EPIC-006, **MERGED");
    expect(parts.title).toBe("The entry point  (M, P0, epic: EPIC-006, **MERGED");
    expect(parts.meta).toBeNull();
    expect(parts.trailer).toBe("");
  });

  it("treats a bare row with no parenthetical as legal", () => {
    expect(splitRow("Empty-state UI")).toEqual({
      title: "Empty-state UI",
      meta: null,
      trailer: "",
    });
  });

  it("places a conforming ticket row under its column with its line number", () => {
    const model = parseBoard(
      "## In Review (WIP 1/3)\n- [ABC-012] Portfolio FX conversion  (PR: #41, QE: running)\n",
    );
    expect(model.columns[0].rows).toEqual([
      {
        id: "ABC-012",
        title: "Portfolio FX conversion",
        meta: "PR: #41, QE: running",
        trailer: "",
        line: 2,
      },
    ]);
  });

  it("routes an EPIC or FEAT row to epicRows, never to a column (D-02)", () => {
    const model = parseBoard(
      "## Backlog (WIP unlimited)\n- [EPIC-003] Move input and controls  (owner: BA/PM)\n- [FEAT-007] Clock display\n- [ABC-014] Asset allocation chart\n",
    );
    expect(model.columns[0].rows.map((r) => r.id)).toEqual(["ABC-014"]);
    expect(model.epicRows.map((r) => r.id)).toEqual(["EPIC-003", "FEAT-007"]);
    expect(model.epicRows[0].column).toBe("Backlog");
  });

  it("refuses a bracket content outside the ID bound (D-02)", () => {
    const model = parseBoard(
      "## Backlog (WIP unlimited)\n- [abc-014] lowercase\n- [ABC014] no dash\n- [ABC-] no number\n",
    );
    expect(model.columns[0].rows).toEqual([]);
    expect(model.epicRows).toEqual([]);
  });

  it("does not left-trim a row — an indented bullet is not a board row", () => {
    const model = parseBoard("## Backlog (WIP unlimited)\n    - [ABC-014] indented\n");
    expect(model.columns[0].rows).toEqual([]);
  });
});

describe("board-model — the total line partition (D-24, this task's half)", () => {
  it("puts every line before the first column heading into the preamble", () => {
    const model = parseBoard("# Board\n_Updated: 2026-09-13 by Orchestrator_\n\n## Backlog (WIP unlimited)\n");
    expect(model.preamble).toEqual(["# Board", "_Updated: 2026-09-13 by Orchestrator_"]);
  });

  it("keeps the kit board's `_Updated:` placeholder in the preamble", () => {
    const model = parseBoard(readBoard());
    expect(model.preamble.some((l) => l.startsWith("_Updated:"))).toBe(true);
  });

  it("returns zero columns, zero rows and an empty preamble for an EMPTY board", () => {
    const model = parseBoard("");
    expect(model.columns).toEqual([]);
    expect(model.epicRows).toEqual([]);
    expect(model.preamble).toEqual([]);
  });

  it("normalizes CRLF before anything else", () => {
    const model = parseBoard("## Backlog (WIP unlimited)\r\n- [ABC-014] Asset allocation chart\r\n");
    expect(model.columns.map((c) => c.name)).toEqual(["Backlog"]);
    expect(model.columns[0].rows.map((r) => r.title)).toEqual(["Asset allocation chart"]);
  });
});

describe("board-model — kebab, the ONE spelling (D-06)", () => {
  it("kebabs a column name the way the validator's board-to-ticket rule requires", () => {
    expect(kebab("In Development")).toBe("in-development");
    expect(kebab("In Security/NFR")).toBe("in-security-nfr");
    expect(kebab("Ready for UAT")).toBe("ready-for-uat");
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TASK 2 — THE READ SEAM (`scripts/board-read.ts`, D-23).
//
// `board-model.ts` is pure by construction and this module is where the filesystem is touched, so
// the purity claim is an IMPORT EDGE a guard can check rather than a sentence in a docblock. The
// cases below drive the discriminated result (D-11), the realpath-once root resolution (T-32-03),
// and the distinction between an ABSENT source and a STALE one (D-13).
// ═════════════════════════════════════════════════════════════════════════════════════════════════

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";

import {
  BoardReadError,
  FIXED_SUBPATHS,
  SOURCE_COUNT,
  SOURCE_NAMES,
  listDirectoryBounded,
  readSnapshot,
  repoSubpath,
  resolveRepoRoot,
} from "./board-read.js";

/** A scratch tree that is always removed, whatever the case does with it. */
function withTempTree(run: (dir: string) => void): void {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), "grugops-board-"));
  try {
    run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("board-read — the source set (D-12)", () => {
  it("pins the source count two-sided against the derived tuple", () => {
    expect(SOURCE_COUNT).toBe(SOURCE_NAMES.length);
  });

  it("pins the source count at six", () => {
    expect(
      SOURCE_NAMES.length,
      "a seventh joined source is a DECISION recorded in the phase context and in " +
        "agent-factory/contracts/board.md, never a bumped constant",
    ).toBe(6);
  });

  it("names every joined source exactly once", () => {
    expect([...SOURCE_NAMES]).toEqual([
      "board",
      "tickets",
      "queue",
      "context",
      "traceability",
      "config",
    ]);
    expect(new Set(SOURCE_NAMES).size).toBe(SOURCE_NAMES.length);
  });

  it("joins only FIXED LITERAL subpaths — no path is derived from any file's content (ASVS V12)", () => {
    expect(FIXED_SUBPATHS.board).toBe("plans/board.md");
    expect(FIXED_SUBPATHS.config).toBe("agent-factory/config/factory.config.json");
    expect(FIXED_SUBPATHS.tickets).toBe("plans/tickets");
    expect(FIXED_SUBPATHS.queue).toBe(".grugops/queue");
    expect(FIXED_SUBPATHS.context).toBe(".grugops/context");
    expect(FIXED_SUBPATHS.traceability).toBe("plans/traceability.md");
    expect(Object.keys(FIXED_SUBPATHS).length).toBe(SOURCE_COUNT);
  });
});

describe("board-read — root resolution (T-32-03)", () => {
  it("resolves the root ONCE through realpath, so a symlinked invocation is the same answer", () => {
    withTempTree((dir) => {
      const link = join(dir, "link");
      const real = join(dir, "real");
      mkdirSync(real);
      symlinkSync(real, link);
      expect(resolveRepoRoot(link)).toBe(realpathSync(real));
    });
  });

  it("refuses an unresolvable root BY NAME rather than returning a snapshot", () => {
    const missing = join(realpathSync(tmpdir()), "grugops-board-no-such-root-32-01");
    expect(() => resolveRepoRoot(missing)).toThrow(BoardReadError);
    expect(() => resolveRepoRoot(missing)).toThrow(missing);
    expect(() => readSnapshot(missing)).toThrow(BoardReadError);
  });

  it("refuses a root that resolves to a FILE rather than a directory", () => {
    withTempTree((dir) => {
      const f = join(dir, "not-a-directory");
      writeFileSync(f, "x", "utf8");
      expect(() => resolveRepoRoot(f)).toThrow(BoardReadError);
    });
  });

  it("refuses a target that escapes the resolved root, before any read", () => {
    withTempTree((dir) => {
      const root = resolveRepoRoot(dir);
      expect(() => repoSubpath(root, "../escape")).toThrow(BoardReadError);
      expect(() => repoSubpath(root, "..")).toThrow(BoardReadError);
      expect(repoSubpath(root, "plans/board.md")).toBe(join(root, "plans/board.md"));
    });
  });
});

describe("board-read — the discriminated result on THIS repository (D-11, D-13)", () => {
  it("reads the real board and reports an `ok` result", () => {
    const result = readSnapshot(ROOT);
    expect(
      result.snapshot.repoRoot,
      "PREMISE: the snapshot did not record the repository root, so every finding below describes " +
        "a tree nobody identified",
    ).toBe(realpathSync(ROOT));
    expect(result.source).toBe("ok");
    expect(result.snapshot.sources.board.source).toBe("ok");
    expect(result.snapshot.board?.columns.length).toBe(13);
    expect(result.readErrors).toEqual([]);
  });

  it("reports an ABSENT `.grugops/` as unavailable, never as stale (D-13)", () => {
    const queue = readSnapshot(ROOT).snapshot.sources.queue;
    expect(queue.source).toBe("unavailable");
    // The `unavailable` arm carries NO value. "Render an empty board because the file was missing"
    // is unrepresentable rather than merely discouraged.
    expect(Object.prototype.hasOwnProperty.call(queue, "value")).toBe(false);
    expect(queue.source === "unavailable" ? queue.present : true).toBe(false);
  });

  it("reads the config dial and reports its mode", () => {
    const result = readSnapshot(ROOT);
    expect(result.snapshot.sources.config.source).toBe("ok");
    expect(result.snapshot.config?.mode).toBe("lean");
    expect(result.snapshot.config?.idPrefix).toBe("ABC");
    expect(result.snapshot.config?.wipLimits["In Development"]).toBe(3);
  });

  it("stamps the published schema version on the snapshot (D-19)", () => {
    expect(readSnapshot(ROOT).snapshot.schemaVersion).toBe(1);
  });
});

describe("board-read — a tree with no board (D-11)", () => {
  it("returns an UNAVAILABLE result, never an `ok` result with zero columns", () => {
    withTempTree((dir) => {
      const result = readSnapshot(dir);
      expect(result.source).toBe("unavailable");
      expect(result.snapshot.sources.board.source).toBe("unavailable");
      expect(result.snapshot.board).toBeNull();
    });
  });

  it("reads a board that IS present under a tree with no config", () => {
    withTempTree((dir) => {
      mkdirSync(join(dir, "plans"), { recursive: true });
      writeFileSync(
        join(dir, "plans", "board.md"),
        "## Backlog (WIP unlimited)\n- [ABC-014] Asset allocation chart\n",
        "utf8",
      );
      const result = readSnapshot(dir);
      expect(result.source).toBe("ok");
      expect(result.snapshot.board?.columns.map((c) => c.name)).toEqual(["Backlog"]);
      expect(result.snapshot.sources.config.source).toBe("unavailable");
      expect(result.snapshot.config).toBeNull();
    });
  });

  it("marks a MALFORMED config stale and keeps going, rather than throwing (T-32-09)", () => {
    withTempTree((dir) => {
      mkdirSync(join(dir, "plans"), { recursive: true });
      writeFileSync(join(dir, "plans", "board.md"), "## Done (WIP unlimited)\n", "utf8");
      mkdirSync(join(dir, "agent-factory", "config"), { recursive: true });
      writeFileSync(join(dir, "agent-factory", "config", "factory.config.json"), "{ not json", "utf8");

      const result = readSnapshot(dir);
      expect(result.source).toBe("stale");
      expect(result.snapshot.sources.config.source).toBe("stale");
      expect(result.snapshot.board?.columns.length).toBe(1);
      expect(result.readErrors.map((e) => e.source)).toEqual(["config"]);
    });
  });
});

describe("board-read — bounded directory listing (D-14, RESEARCH pitfall 5)", () => {
  it("filters a `.tmp-` sibling EXPLICITLY, never incidentally by extension", () => {
    withTempTree((dir) => {
      writeFileSync(join(dir, "ABC-001.md"), "x", "utf8");
      writeFileSync(join(dir, "board.md.tmp-4242-1-abcdef01"), "x", "utf8");
      const listed = listDirectoryBounded(dir);
      expect(listed.names).toEqual(["ABC-001.md"]);
      expect(listed.bounded).toBe(false);
    });
  });

  it("reports an ABSENT directory rather than throwing", () => {
    withTempTree((dir) => {
      const listed = listDirectoryBounded(join(dir, "no-such-directory"));
      expect(listed.present).toBe(false);
      expect(listed.names).toEqual([]);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TASK 3 — THE CLI END OF THE WIRE (`scripts/board-dashboard.ts`, D-16/D-17/D-18).
//
// The process-owning half of the D-15 boundary: argv, stdout discipline and exit codes. The cases
// that assert an EXIT CODE or STREAM SEPARATION drive the compiled `.js` as a child process, because
// those are properties of the process rather than of the function — the `check-platform-shapes.ts`
// drive harness is the in-repo precedent. The render-branch cases call `main(argv, io)` directly
// with an injected io, so the render branch is testable without a pty.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";

import {
  DEBOUNCE_MS,
  INTERVAL_HARD_FLOOR_MS,
  POLL_FLOOR_MS,
  main as dashboardMain,
  parseArgs,
  sanitizeCell,
} from "./board-dashboard.js";
import type { DashboardIo } from "./board-dashboard.js";

const DASHBOARD_JS = join(ROOT, "scripts", "board-dashboard.js");

// The escape introducer, BUILT rather than typed, so this source file carries no control byte of its
// own. scripts/check-nul-bytes.ts is the recorded reason the tree keeps control bytes out of source.
const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);
const CSI_C1 = String.fromCharCode(155);
const DEL = String.fromCharCode(127);

type Captured = { out: string; err: string; code: number };

/** Call `main` with a capturing io. No process, no pty, no child. */
function runMain(argv: readonly string[], isTty: boolean): Captured {
  let out = "";
  let err = "";
  const io: DashboardIo = {
    stdout: {
      write: (s: string) => {
        out += s;
        return true;
      },
    },
    stderr: {
      write: (s: string) => {
        err += s;
        return true;
      },
    },
    isTty,
  };
  const code = dashboardMain(argv, io);
  return { out, err, code };
}

/** Drive the COMPILED module as a child process. Exit codes are a property of the process. */
function drive(args: readonly string[]): Captured {
  const r = spawnSync(process.execPath, [DASHBOARD_JS, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 20_000,
  });
  return { out: r.stdout ?? "", err: r.stderr ?? "", code: r.status ?? -1 };
}

describe("board-dashboard — the named constants plan 32-03 wires (D-14)", () => {
  it("publishes the poll floor, the debounce and the interval hard floor", () => {
    expect(POLL_FLOOR_MS).toBe(10_000);
    expect(DEBOUNCE_MS).toBe(250);
    expect(INTERVAL_HARD_FLOOR_MS).toBe(1_000);
  });
});

describe("board-dashboard — argument parsing (D-16, D-18, T-32-10)", () => {
  it("defaults the repo root to the working directory when no positional is given", () => {
    const parsed = parseArgs([]);
    expect(parsed.kind).toBe("options");
    expect(parsed.kind === "options" ? parsed.options.repoRoot : "").toBe(process.cwd());
  });

  it("reads the positional root and every flag", () => {
    const parsed = parseArgs([".", "--once", "--json", "--watch", "--interval", "2500"]);
    expect(parsed.kind).toBe("options");
    if (parsed.kind !== "options") return;
    expect(parsed.options.repoRoot).toBe(".");
    expect(parsed.options.once).toBe(true);
    expect(parsed.options.json).toBe(true);
    expect(parsed.options.watch).toBe(true);
    expect(parsed.options.intervalMs).toBe(2500);
  });

  it("refuses an unknown flag by name rather than ignoring it", () => {
    const parsed = parseArgs([".", "--nonsense"]);
    expect(parsed.kind).toBe("usage");
    expect(parsed.kind === "usage" ? parsed.message : "").toContain("--nonsense");
  });

  it("refuses a SECOND positional rather than silently keeping one", () => {
    expect(parseArgs([".", "../elsewhere"]).kind).toBe("usage");
  });

  it("CLAMPS --interval BY REFUSAL, never by silent rounding (T-32-10, ASVS V5)", () => {
    for (const bad of ["500", "0", "-1", "abc", "1e4", "1000.5", ""]) {
      const parsed = parseArgs([".", "--interval", bad]);
      expect(parsed.kind, `--interval ${bad} must be refused, never coerced`).toBe("usage");
    }
    expect(parseArgs([".", "--interval", "1000"]).kind).toBe("options");
  });

  it("refuses --interval with no value", () => {
    expect(parseArgs([".", "--interval"]).kind).toBe("usage");
  });

  it("reports --help as its own arm rather than as a refusal", () => {
    expect(parseArgs(["--help"]).kind).toBe("help");
  });
});

describe("board-dashboard — the cell sanitizer (T-32-06)", () => {
  it("strips every C0 control, DEL and C1 introducer before a cell reaches a terminal", () => {
    expect(sanitizeCell(`${ESC}[31mred${ESC}[0m`)).toBe("[31mred[0m");
    expect(sanitizeCell(`a${BEL}b${CSI_C1}c${DEL}d`)).toBe("abcd");
    expect(sanitizeCell("tab\there")).toBe("tabhere");
  });

  it("leaves ordinary board content untouched", () => {
    expect(sanitizeCell("Asset allocation chart — épée (M, P0)")).toBe(
      "Asset allocation chart — épée (M, P0)",
    );
  });
});

describe("board-dashboard — the render branch, through an injected io (D-17, D-18)", () => {
  it("prints one plain-text frame naming the column count, with no ESC byte", () => {
    const r = runMain([ROOT, "--once"], false);
    expect(r.code).toBe(0);
    expect(r.out).toContain("13 columns");
    expect(r.out.includes(ESC)).toBe(false);
    expect(r.out).toContain("In Development");
  });

  it("puts Blocked last in the frame", () => {
    const r = runMain([ROOT, "--once"], false);
    const lines = r.out.split("\n").filter((l) => l.trim() !== "");
    const blockedAt = lines.findIndex((l) => l.startsWith("Blocked"));
    expect(blockedAt).toBe(lines.length - 1);
  });

  it("names the config mode in the header", () => {
    expect(runMain([ROOT, "--once"], false).out).toContain("lean");
  });

  it("writes exactly ONE JSON document to stdout and nothing else there", () => {
    const r = runMain([ROOT, "--once", "--json"], false);
    expect(r.code).toBe(0);
    expect(r.err).toBe("");
    const parsed = JSON.parse(r.out) as { snapshot: { schemaVersion: number } };
    expect(parsed.snapshot.schemaVersion).toBe(1);
    expect(r.out.endsWith("\n")).toBe(true);
  });

  it("implies --once for --json on a non-TTY stdout (D-18)", () => {
    const r = runMain([ROOT, "--json"], false);
    expect(r.code).toBe(0);
    expect(() => JSON.parse(r.out)).not.toThrow();
  });

  it("prints one frame and exits 0 on a non-TTY stdout with no flags at all (D-18)", () => {
    const r = runMain([ROOT], false);
    expect(r.code).toBe(0);
    expect(r.out).toContain("13 columns");
  });

  it("SANITIZES board content on its way to the terminal, not merely its own chrome", () => {
    withTempTree((dir) => {
      mkdirSync(join(dir, "plans"), { recursive: true });
      writeFileSync(
        join(dir, "plans", "board.md"),
        `## Backlog (WIP unlimited)\n- [ABC-001] title${ESC}[31m with an escape\n`,
        "utf8",
      );
      const r = runMain([dir, "--once"], false);
      expect(r.code).toBe(0);
      expect(r.out.includes(ESC)).toBe(false);
    });
  });
});

describe("board-dashboard — the process contract, driven as a child (D-18, T-32-08)", () => {
  it("exits 0 and writes one JSON document with schemaVersion 1", () => {
    const r = drive([".", "--once", "--json"]);
    expect(r.code).toBe(0);
    expect(r.err).toBe("");
    const parsed = JSON.parse(r.out) as { snapshot: { schemaVersion: number } };
    expect(parsed.snapshot.schemaVersion).toBe(1);
  });

  it("exits 0 and writes an ANSI-free frame without --json", () => {
    const r = drive([".", "--once"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("13 columns");
    expect(r.out.includes(ESC)).toBe(false);
  });

  it("defaults the root to the working directory when no positional is given", () => {
    const r = drive(["--once"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("13 columns");
  });

  it("exits 2 on an unknown flag, with the usage on STDERR and nothing on stdout", () => {
    const r = drive([".", "--nonsense"]);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).toContain("--nonsense");
  });

  it("exits 2 on an unreadable root, with a NAMED one-line message and no stack on stdout", () => {
    const r = drive(["/no/such/path", "--once", "--json"]);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).toContain("/no/such/path");
    expect(r.err).not.toContain("    at ");
  });

  it("exits 2 and names the 1000 ms floor when --interval is below it", () => {
    const r = drive([".", "--interval", "500"]);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).toContain("1000");
  });
});

describe("board-dashboard — packaging (D-16)", () => {
  it("wires the `dashboard` npm script and adds no runtime dependency", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
      dependencies?: unknown;
    };
    expect(pkg.scripts["dashboard"]).toBe(
      "tsc --outDir .tmp-build && node scripts/board-dashboard.js",
    );
    expect(pkg.dependencies).toBeUndefined();
  });

  it("uses the ONE entry-detection spelling rather than a hand-rolled comparison", () => {
    const src = readFileSync(join(ROOT, "scripts", "board-dashboard.ts"), "utf8");
    expect(src).toContain('from "./is-entry.js"');
    const offending = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*"))
      .filter((l) => /import\.meta\.url\s*===/.test(l));
    expect(offending).toEqual([]);
  });
});

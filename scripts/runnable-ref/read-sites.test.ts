// read-sites.test.ts — READ-1 over every read site of the three host runnables (plan 37-25, D-17,
// 37-GAP-PLANNING-BRIEF.md §1 READ-1 and §2.1).
//
// THE RULE. In trace-render, state-check and state-roll, a read that fails is either could-not-run (exit 2, an
// empty stdout) or a named finding (exit 1, a finding line that the unfaulted run does not print). It is never
// "no data", never a pass, and never lets a write mode write or remove anything.
//
// WHERE THE SITES COME FROM. Every site is derived from the COMMITTED .js by scripts/fault-inject.test-support.ts
// (deriveReadSites): each call whose callee resolves through the file's own node:fs bindings to a read function.
// No line is written here. A site inside a function entered from two or more call expressions (callingSites) is
// failed once per calling call expression (`via`, named `<scope>#<ordinal>`), so a shared reader is failed under
// every caller. READ_SITE_ROWS below is the hand-written table; the derived set is held equal to it in both
// directions, and the derived counts are pinned.
//
// HOW A SITE IS FAILED. The runnable is a byte copy of the committed .js in a scratch directory, run with the
// fault-injection preload (`node --import`): the named node:fs call throws EIO when the stack holds the site line
// and, for a via row, the via line. Each row builds its own fixture in an mkdtempSync directory, so no row can see
// another row's writes; nothing reads or writes grugops's own state, the user's home or ~/.grugops.
//
// MODES. A row lists every mode that reaches its site, and a mode of the runnable that a row does not list is run
// too and must fire no fault, so the table cannot leave out a mode that reaches a site. `write-new-archive` is
// state-roll's write mode on a repository without the archive directory: the only fixture that reaches the read
// after the roll creates that directory.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { skipLine, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import {
  ARCHIVE_REL,
  BOARD_REL,
  BUDGETS,
  CONTEXT_ARCHIVE_REL,
  CONTEXT_REL,
  DECISIONS_ARCHIVE_REL,
  DECISIONS_REL,
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  NFR_CATALOG_REL,
  NFR_DIR_REL,
  PROGRESS_REL,
  QUEUE_DONE_ARCHIVE_REL,
  QUEUE_DONE_REL,
  TICKETS_REL,
  TRACE_DIR_REL,
  TRACEABILITY_REL,
} from "../../install/state-layout.js";
import {
  FS_OTHER_FNS,
  FS_READ_FNS,
  callingSites,
  classifiedFsCalls,
  deriveReadSites,
  hasNodeStack,
  runFaulted,
  scriptUrl,
  treeDigest,
  type FaultedRun,
  type ReadSite,
} from "../fault-inject.test-support.js";

const HERE = import.meta.dirname;
const RUNNABLES = ["trace-render", "state-check", "state-roll"] as const;
type Runnable = (typeof RUNNABLES)[number];

/** The modes a row can run in. `write-new-archive` is state-roll's write mode on a repository with no archive. */
type Mode = "write" | "check" | "text" | "dry-run" | "write-new-archive";

/** Every mode each runnable is run in, and the arguments after the repository root. */
const MODES: Record<Runnable, readonly Mode[]> = {
  "trace-render": ["write", "check"],
  "state-check": ["text"],
  "state-roll": ["write", "dry-run", "write-new-archive"],
};
const MODE_ARGS: Record<Mode, readonly string[]> = {
  write: [],
  check: ["--check"],
  text: [],
  "dry-run": ["--dry-run"],
  "write-new-archive": [],
};

// ── The pins ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The derived read-site counts of the committed runnables, embedded region included.
 * 2026-10-23, plan 37-25: 16, 19 and 11 read sites, measured after plans 37-20 to 37-24; at d9fa837c 16, 18 and
 * 11. state-check gained the realpath of its own directory in plan 37-24 (runnableSkewFindings).
 */
const TRACE_RENDER_READ_SITES = 16;
const STATE_CHECK_READ_SITES = 19;
const STATE_ROLL_READ_SITES = 11;
const PINS: Record<Runnable, number> = {
  "trace-render": TRACE_RENDER_READ_SITES,
  "state-check": STATE_CHECK_READ_SITES,
  "state-roll": STATE_ROLL_READ_SITES,
};

/**
 * A site no fixture can reach, by `<runnable> <key>`, each with a one-line reason. A site belongs here only when
 * it fired no fault AND the preload counted no call at it (site-not-via 0) under every fixture that should reach it.
 * Expected empty; its size is pinned and printed.
 */
const UNREACHED_SITES: ReadonlyMap<string, string> = new Map();
const UNREACHED_SITES_SIZE = 0;

// ── The table ───────────────────────────────────────────────────────────────────────────────────────────

/** One row: a derived site (and, for a shared reader, one calling call expression), and the modes that reach it. */
interface ReadSiteRow {
  readonly runnable: Runnable;
  readonly key: string;
  /** `<scope>#<ordinal>` of the calling call expression, the ordinal counted among calls in that scope. */
  readonly via?: string;
  readonly modes: readonly Mode[];
}

const TR = MODES["trace-render"];
const SC = MODES["state-check"];
const SR = MODES["state-roll"];

function rows(runnable: Runnable, modes: readonly Mode[], key: string, vias?: readonly string[]): ReadSiteRow[] {
  return vias === undefined ? [{ runnable, key, modes }] : vias.map((via) => ({ runnable, key, via, modes }));
}

const READ_SITE_ROWS: readonly ReadSiteRow[] = [
  // trace-render: the embedded non-blocking reader (via readText and via the note walk) and the note walk.
  ...rows("trace-render", TR, "readRegularFileOrNull:openSync#0", ["readRawNotesWithSkips#0", "readText#0"]),
  ...rows("trace-render", TR, "readRegularFileOrNull:fstatSync#0", ["readRawNotesWithSkips#0", "readText#0"]),
  ...rows("trace-render", TR, "readRegularFileOrNull:readSync#0", ["readRawNotesWithSkips#0", "readText#0"]),
  ...rows("trace-render", TR, "readRawNotesWithSkips:statSync#0"),
  ...rows("trace-render", TR, "readRawNotesWithSkips:readdirSync#0"),
  // trace-render: the root, realDirectoryOrNull (the context-root map, the state directory, the trace directory).
  ...rows("trace-render", TR, "<top>:realpathSync#0"),
  ...rows("trace-render", TR, "<top>:statSync#0"),
  ...rows("trace-render", TR, "<top>:accessSync#0"),
  ...rows("trace-render", TR, "realDirectoryOrNull:lstatSync#0", ["<top>#0", "<top>#1", "<top>#2"]),
  ...rows("trace-render", TR, "realDirectoryOrNull:realpathSync#0", ["<top>#0", "<top>#1", "<top>#2"]),
  ...rows("trace-render", TR, "realDirectoryOrNull:statSync#0", ["<top>#0", "<top>#1", "<top>#2"]),
  // trace-render: the listers and readers handed to the trace model, and the pre-write loop.
  ...rows("trace-render", TR, "listTasks:readdirSync#0", ["collectTraceNotes#0", "<top>#0"]),
  ...rows("trace-render", TR, "readTask:realpathSync#0", ["collectTraceNotes#0", "<top>#0"]),
  ...rows("trace-render", TR, "<top>:lstatSync#0"),
  ...rows("trace-render", TR, "readText:lstatSync#0", ["compareTraceTree#0", "compareTraceTree#1", "<top>#0"]),
  ...rows("trace-render", TR, "listDir:readdirSync#0", ["compareTraceTree#0", "<top>#0"]),

  // state-check: the embedded reader (the state reader, the trace reader, the note walk, the sibling stamp read).
  ...rows("state-check", SC, "readRegularFileOrNull:openSync#0", [
    "readRawNotesWithSkips#0",
    "readState#0",
    "readTraceText#0",
    "runnableSkewFindings#0",
  ]),
  ...rows("state-check", SC, "readRegularFileOrNull:fstatSync#0", [
    "readRawNotesWithSkips#0",
    "readState#0",
    "readTraceText#0",
    "runnableSkewFindings#0",
  ]),
  ...rows("state-check", SC, "readRegularFileOrNull:readSync#0", [
    "readRawNotesWithSkips#0",
    "readState#0",
    "readTraceText#0",
    "runnableSkewFindings#0",
  ]),
  ...rows("state-check", SC, "readRawNotesWithSkips:statSync#0"),
  ...rows("state-check", SC, "readRawNotesWithSkips:readdirSync#0"),
  // state-check: the root, locate under each caller, and the hand-written readers.
  ...rows("state-check", SC, "<top>:realpathSync#0"),
  ...rows("state-check", SC, "<top>:statSync#0"),
  ...rows("state-check", SC, "<top>:accessSync#0"),
  ...rows("state-check", SC, "locate:realpathSync#0", [
    "readState#0",
    "sizeFinding#0",
    "listDirectory#0",
    "traceDirectory#0",
    "readTraceText#0",
  ]),
  ...rows("state-check", SC, "readState:statSync#0", ["readMarker#0", "boardFindings#0", "progressReport#0", "<top>#0", "<top>#1"]),
  ...rows("state-check", SC, "sizeFinding:lstatSync#0", ["directoryFindings#0", "progressReport#0"]),
  ...rows("state-check", SC, "listDirectory:readdirSync#0", [
    "moveOnlyReport#0",
    "moveOnlyReport#1",
    "<top>#0",
    "<top>#1",
    "<top>#2",
  ]),
  ...rows("state-check", SC, "confirmListed:lstatSync#0"),
  ...rows("state-check", SC, "traceDirectory:statSync#0", ["traceReport#0", "traceReport#1"]),
  ...rows("state-check", SC, "readTraceTask:realpathSync#0"),
  ...rows("state-check", SC, "readTraceText:lstatSync#0"),
  ...rows("state-check", SC, "listTasks:readdirSync#0", ["collectTraceNotes#0", "traceReport#0"]),
  ...rows("state-check", SC, "listDir:readdirSync#0", ["compareTraceTree#0", "traceReport#0"]),
  ...rows("state-check", SC, "runnableSkewFindings:realpathSync#0"),

  // state-roll: the embedded reader (one caller, readTextOrThrow), the root, realDirectoryOrNull under each call.
  ...rows("state-roll", SR, "readRegularFileOrNull:openSync#0"),
  ...rows("state-roll", SR, "readRegularFileOrNull:fstatSync#0"),
  ...rows("state-roll", SR, "readRegularFileOrNull:readSync#0"),
  ...rows("state-roll", SR, "<top>:realpathSync#0"),
  ...rows("state-roll", SR, "<top>:statSync#0"),
  ...rows("state-roll", SR, "<top>:accessSync#0"),
  ...rows("state-roll", SR, "realDirectoryOrNull:lstatSync#0", ["<top>#0", "<top>#1", "<top>#2", "<top>#3"]),
  // <top>#2 is the archive directory: without one, realDirectoryOrNull returns at its lstat.
  ...rows("state-roll", SR, "realDirectoryOrNull:realpathSync#0", ["<top>#0", "<top>#1", "<top>#3"]),
  ...rows("state-roll", ["write", "dry-run"], "realDirectoryOrNull:realpathSync#0", ["<top>#2"]),
  ...rows("state-roll", SR, "realDirectoryOrNull:statSync#0", ["<top>#0", "<top>#1", "<top>#3"]),
  ...rows("state-roll", ["write", "dry-run"], "realDirectoryOrNull:statSync#0", ["<top>#2"]),
  // readTextOrThrow: the planning reads (readText), and the roll's own re-reads (io.read), which a dry run never makes.
  ...rows("state-roll", SR, "readTextOrThrow:lstatSync#0", ["readText#0"]),
  ...rows("state-roll", ["write", "write-new-archive"], "readTextOrThrow:lstatSync#0", ["io.read#0"]),
  // The realpath after the roll creates the archive directory: only a repository without one reaches it.
  ...rows("state-roll", ["write-new-archive"], "<top>:realpathSync#1"),
];

// ── The derived set ─────────────────────────────────────────────────────────────────────────────────────

/** The committed .js of a runnable. */
function committed(name: Runnable): string {
  return join(HERE, `${name}.js`);
}

/** One derived (site, via) pair, with the lines the preload matches. */
interface DerivedPair {
  readonly site: ReadSite;
  readonly via?: { readonly id: string; readonly line: number; readonly kind: "direct" | "passed" };
}

/** `<key>` or `<key> via <via>`: one row's identity. */
function pairId(key: string, via: string | undefined): string {
  return via === undefined ? key : `${key} via ${via}`;
}

/** Every (site, via) pair of a .js: one per site, or one per calling call expression of a shared reader. */
function derivedPairs(js: string): readonly DerivedPair[] {
  const out: DerivedPair[] = [];
  for (const site of deriveReadSites(js)) {
    const callers = site.enclosing === "<top>" ? [] : callingSites(js, site.enclosing);
    if (callers.length < 2) {
      out.push({ site });
      continue;
    }
    const ordinals = new Map<string, number>();
    for (const c of callers) {
      const ordinal = ordinals.get(c.scope) ?? 0;
      ordinals.set(c.scope, ordinal + 1);
      out.push({ site, via: { id: `${c.scope}#${ordinal}`, line: c.line, kind: c.kind } });
    }
  }
  return out;
}

const DERIVED: Record<Runnable, readonly DerivedPair[]> = {
  "trace-render": derivedPairs(committed("trace-render")),
  "state-check": derivedPairs(committed("state-check")),
  "state-roll": derivedPairs(committed("state-roll")),
};

/** The derived pair a row names. */
function pairOf(row: ReadSiteRow): DerivedPair {
  const found = DERIVED[row.runnable].filter((p) => p.site.key === row.key && p.via?.id === row.via);
  expect(found, `PREMISE: ${row.runnable} has exactly one derived pair ${pairId(row.key, row.via)}`).toHaveLength(1);
  return found[0] as DerivedPair;
}

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────

const ctxio: typeof import("../context-io.js") = await import(pathToFileURL(join(HERE, "..", "context-io.js")).href);

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/**
 * Byte copies of the committed runnables. state-check sits beside copies of its two siblings, so the stamp reads
 * of plan 37-24 happen; trace-render and state-roll sit alone.
 */
const HOST: Record<Runnable, string> = (() => {
  const siblings = mkTmp("grugops-read-sites-siblings-");
  for (const n of RUNNABLES) copyFileSync(committed(n), join(siblings, `${n}.js`));
  const alone = (n: Runnable): string => {
    const js = join(mkTmp(`grugops-read-sites-${n}-`), `${n}.js`);
    copyFileSync(committed(n), js);
    return js;
  };
  return {
    "trace-render": alone("trace-render"),
    "state-check": join(siblings, "state-check.js"),
    "state-roll": alone("state-roll"),
  };
})();

/** Write `text` at the repository-relative `rel` under `root`, creating its directory. */
function plant(root: string, rel: string, text: string): void {
  const p = join(root, ...rel.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text, "utf8");
}

/** The text of a sealed note carrying `refs`, sealed through the committed seal export. */
function noteText(name: string, refs: readonly string[]): string {
  const fence =
    `id: ${name}\n` +
    "kind: artifact-ref\n" +
    "by: engineer\n" +
    "at: 2026-10-22T10:00:00Z\n" +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    refs.map((r) => `  - ${r}`).join("\n") +
    "\n" +
    "supersedes: \n";
  const rest = "---\n\n" + "an artifact-ref note carrying trace refs.\n";
  return "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
}

/** Run a copied runnable unfaulted. */
function runPlain(name: Runnable, root: string, args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [HOST[name], root, ...args], { encoding: "utf8", cwd: dirname(HOST[name]), timeout: 30_000 });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Render `root` with the copied trace-render, and require the render to write files. */
function renderOk(root: string): void {
  const r = runPlain("trace-render", root, []);
  expect(r.status, `PREMISE: the fixture renders\n${r.stdout}\n${r.stderr}`).toBe(0);
  expect(r.stdout, `PREMISE: the render wrote files\n${r.stdout}`).toMatch(/[1-9]\d* file\(s\) written/);
}

/** A symbolic link at `at` to `target`, or the printed platform reason it could not be staged. */
function linkOrSkip(target: string, at: string, position: string): string | null {
  const skipped = stageSymlinkOrSkip(target, at, "symlink to a directory inside the repository root", position);
  return skipped === null ? null : skipLine(skipped, "the CR-02, TR-6 and walk cases of trace-render.test.ts");
}

/**
 * trace-render's repository: a sealed note in the live context root and one in the archive context root, rendered.
 * Three paths are symbolic links to directories inside the root, so every branch of realDirectoryOrNull runs
 * under each of its three calls: the archive context root, `memory-bank/plans` (the state directory) and the trace
 * directory inside it. After the render, the trace directory gains a generated trace file the plan no longer holds
 * (ABC-099.md, a copy of ABC-001.md): the trace model reads it as an extra file, which reaches its second readText
 * call, and the write mode would remove it, the CR-01 shape. So the unfaulted write mode removes one file and the
 * unfaulted --check is exit 1 with one EXTRA line.
 */
function traceRenderRepo(): string | { readonly skip: string } {
  const root = mkTmp("grugops-read-sites-trace-repo-");
  plant(root, `${CONTEXT_REL}/taskA/notes/n1.md`, noteText("n1", ["ABC-001", "src/a.ts"]));
  plant(root, `archive-context-real/taskB/notes/n2.md`, noteText("n2", ["ABC-002", "#41"]));
  mkdirSync(join(root, ...dirname(CONTEXT_ARCHIVE_REL).split("/")), { recursive: true });
  mkdirSync(join(root, "plans-real"));
  mkdirSync(join(root, "trace-real"));
  const stateDirRel = dirname(TRACE_DIR_REL);
  mkdirSync(join(root, ...dirname(stateDirRel).split("/")), { recursive: true });
  const position = "scripts/runnable-ref/read-sites.test.ts: trace-render's repository (plan 37-25)";
  for (const [target, at] of [
    [join(root, "archive-context-real"), join(root, ...CONTEXT_ARCHIVE_REL.split("/"))],
    [join(root, "plans-real"), join(root, ...stateDirRel.split("/"))],
    [join(root, "trace-real"), join(root, ...TRACE_DIR_REL.split("/"))],
  ] as const) {
    const skip = linkOrSkip(target, at, position);
    if (skip !== null) return { skip };
  }
  renderOk(root);
  copyFileSync(join(root, "trace-real", "ABC-001.md"), join(root, "trace-real", "ABC-099.md"));
  return root;
}

/** The NFR catalog line for NFR-001, in the one index line form (plan 37-05, D-13). */
const NFR_LINE_001 = "- [NFR-001](nfr/NFR-001.md) Performance: p95 under 300 ms\n";

/** `## <heading>`, a blank line, `filler` x's, a blank line. */
function section(heading: string, filler: number): string {
  return `## ${heading}\n\n${"x".repeat(filler)}\n\n`;
}

/** A progress file over BUDGETS.progressBytes whose first section is a dated entry, so it can roll. */
const PROGRESS_OVER_BUDGET =
  "# Progress\n\n" + section("2026-10-01 sweep", 5_000) + section("Standing directive", 40) + section("2026-10-10 later", BUDGETS.progressBytes);

/**
 * state-check's full repository: the D-14 marker; a board with a Done row; a ticket; NFR-001.md with its index
 * line; a trace rendered from both context roots; a progress file over budget with a dated entry; the queue-done
 * and decision folders with their archive folders. The siblings sit beside the state-check copy.
 */
function stateCheckRepo(): string {
  const root = mkTmp("grugops-read-sites-check-repo-");
  plant(root, LAYOUT_MARKER_REL, `${LAYOUT_MARKER_CONTENT}\n`);
  plant(root, BOARD_REL, "# Board\n\n## Ready (WIP unlimited)\n\n- [ABC-001] a ready ticket\n\n## Done (WIP unlimited)\n\n- [ABC-002] a done ticket\n");
  plant(root, `${TICKETS_REL}/ABC-001.md`, "# ABC-001\n");
  plant(root, NFR_CATALOG_REL, `# NFR catalog\n\n${NFR_LINE_001}`);
  plant(root, `${NFR_DIR_REL}/NFR-001.md`, "# NFR-001\n");
  plant(root, `${CONTEXT_REL}/taskA/notes/n1.md`, noteText("n1", ["ABC-001", "NFR-001", "src/a.ts"]));
  plant(root, `${CONTEXT_ARCHIVE_REL}/taskB/notes/n2.md`, noteText("n2", ["ABC-002", "#41"]));
  mkdirSync(join(root, ...TRACE_DIR_REL.split("/")), { recursive: true });
  plant(root, PROGRESS_REL, PROGRESS_OVER_BUDGET);
  for (const dir of [QUEUE_DONE_REL, QUEUE_DONE_ARCHIVE_REL, DECISIONS_REL, DECISIONS_ARCHIVE_REL]) plant(root, `${dir}/.gitkeep`, "");
  renderOk(root);
  return root;
}

/** A Done row of the board grammar. */
function doneRow(n: number): string {
  return `- [ABC-${String(n).padStart(3, "0")}] finished ticket ${n}  (engineer, 2026-10-${String((n % 28) + 1).padStart(2, "0")})`;
}

/**
 * state-roll's repository: a board with BUDGETS.doneRows + 1 Done rows and a progress file over budget with a
 * dated entry, so both rolls are planned; with an existing archive directory, or (`write-new-archive`) without one.
 */
function stateRollRepo(withArchive: boolean): string {
  const root = mkTmp("grugops-read-sites-roll-repo-");
  const board = [
    "# Board",
    "_Updated: 2026-10-22 by orchestrator_",
    "",
    "## In Development (WIP 0/3)",
    "",
    "## Done (WIP unlimited)",
    "",
    ...Array.from({ length: BUDGETS.doneRows + 1 }, (_, i) => doneRow(i + 1)),
    "",
    "## Blocked (visible, time-tracked)",
    "",
  ].join("\n");
  plant(root, BOARD_REL, board);
  plant(root, PROGRESS_REL, PROGRESS_OVER_BUDGET);
  if (withArchive) mkdirSync(join(root, ...ARCHIVE_REL.split("/")), { recursive: true });
  return root;
}

/** A fresh repository for `name` in `mode`, or the printed platform reason it could not be built. */
function fixture(name: Runnable, mode: Mode): string | { readonly skip: string } {
  if (name === "trace-render") return traceRenderRepo();
  if (name === "state-check") return stateCheckRepo();
  return stateRollRepo(mode !== "write-new-archive");
}

/**
 * The exit code of an unfaulted run, per runnable and mode: the premise every row departs from. trace-render's
 * --check reports the extra trace file and state-check reports the progress file over budget, so both are exit 1;
 * a row that exits 1 must add a finding line to theirs.
 */
const BASELINE_STATUS: Record<string, number> = {
  "trace-render write": 0,
  "trace-render check": 1,
  "state-check text": 1,
  "state-roll write": 0,
  "state-roll dry-run": 0,
  "state-roll write-new-archive": 0,
};
const baselines = new Map<string, string | { readonly skip: string }>();
function baselineStdout(name: Runnable, mode: Mode): string | { readonly skip: string } {
  const id = `${name} ${mode}`;
  const cached = baselines.get(id);
  if (cached !== undefined) return cached;
  const root = fixture(name, mode);
  if (typeof root !== "string") {
    baselines.set(id, root);
    return root;
  }
  const r = runPlain(name, root, MODE_ARGS[mode]);
  expect(r.status, `PREMISE: ${id} unfaulted exits ${BASELINE_STATUS[id]}\n${r.stdout}\n${r.stderr}`).toBe(BASELINE_STATUS[id]);
  if (id === "trace-render write") expect(r.stdout, "PREMISE: the write mode removes the extra file").toContain("1 file(s) removed");
  if (id === "trace-render check") expect(r.stdout, "PREMISE: --check reports the extra file").toMatch(/^EXTRA .*ABC-099\.md/m);
  baselines.set(id, r.stdout);
  return r.stdout;
}

/** The lines of stdout that are findings: what exit 1 must add to the unfaulted run. */
const FINDING_LINE: Record<Runnable, RegExp> = {
  "trace-render": /^(COLLISION|HAND-WRITTEN|MISSING|EXTRA|CHANGED) /,
  "state-check": /^FINDING /,
  "state-roll": /^ROLLED BACK /,
};

/** Run `pair` of `name` faulted with EIO on a fresh fixture in `mode`; the tree digests before and after. */
function runPair(
  name: Runnable,
  pair: DerivedPair,
  mode: Mode,
): { r: FaultedRun; before: ReadonlyMap<string, string>; after: ReadonlyMap<string, string>; all: string } | { skip: string } {
  const root = fixture(name, mode);
  if (typeof root !== "string") return root;
  const url = scriptUrl(HOST[name]);
  const before = treeDigest(root);
  const r = runFaulted(
    HOST[name],
    [root, ...MODE_ARGS[mode]],
    {
      kind: "fs",
      fn: pair.site.fn,
      site: { url, line: pair.site.line },
      ...(pair.via === undefined ? {} : { via: { url, line: pair.via.line } }),
      code: "EIO",
    },
    { scratch: mkTmp("grugops-read-sites-fault-"), cwd: dirname(HOST[name]) },
  );
  const after = treeDigest(root);
  const where =
    `site ${pair.site.key} line ${pair.site.line}` +
    (pair.via === undefined ? "" : `, via ${pair.via.id} line ${pair.via.line} (${pair.via.kind})`);
  const all = `${name} ${mode}, ${where}\nstatus ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
  return { r, before, after, all };
}

// ── The tracer row (Task 1) ─────────────────────────────────────────────────────────────────────────────

describe("READ-1 tracer: a derived read site of a runnable, failed end to end (plan 37-25, D-17)", () => {
  it("trace-render write mode, EIO at the note walk's readdirSync: exit 2 naming the task, nothing written", () => {
    const pair = DERIVED["trace-render"].find((p) => p.site.key === "readRawNotesWithSkips:readdirSync#0");
    expect(pair, "PREMISE: the walk's readdirSync is a derived site").toBeDefined();
    const run = runPair("trace-render", pair as DerivedPair, "write");
    if ("skip" in run) {
      console.warn(run.skip);
      return;
    }
    const { r, before, after, all } = run;
    expect(before.has(TRACEABILITY_REL) || [...before.keys()].some((k) => k.endsWith("traceability.md")), "PREMISE: rendered").toBe(true);
    expect(r.fired, `PREMISE: the fault fired (site-not-via ${r.siteNotVia})\n${all}`).toBeGreaterThan(0);
    expect(r.status, all).toBe(2);
    expect(r.stdout, all).toBe("");
    expect(hasNodeStack(r.stderr), all).toBe(false);
    expect(r.stderr, all).toContain(`UNREADABLE TASK ${CONTEXT_REL}/taskA`);
    expect(r.stderr, all).toContain("EIO");
    expect(after, "nothing was written, changed or removed").toEqual(before);
  });
});

// ── The derivation, its pins and the two-sided equalities ──────────────────────────────────────────────

describe("READ-1 sites are derived and counted, and the table equals the derived set (plan 37-25, D-17)", () => {
  for (const name of RUNNABLES) {
    it(`${name}: the derived site count is pinned`, () => {
      expect(deriveReadSites(committed(name)).length).toBe(PINS[name]);
    });

    it(`${name}: the table's site keys equal the derived site keys, both ways`, () => {
      const derived = [...new Set(deriveReadSites(committed(name)).map((s) => s.key))].sort();
      const table = [...new Set(READ_SITE_ROWS.filter((r) => r.runnable === name).map((r) => r.key))].sort();
      expect(table).toEqual(derived);
    });

    it(`${name}: the table's (site, via) pairs equal the derived pairs, both ways, each once`, () => {
      const derived = DERIVED[name].map((p) => pairId(p.site.key, p.via?.id)).sort();
      const table = READ_SITE_ROWS.filter((r) => r.runnable === name).map((r) => pairId(r.key, r.via)).sort();
      expect(new Set(table).size, "no pair is listed twice").toBe(table.length);
      expect(table).toEqual(derived);
    });

    it(`${name}: every row runs in at least one of the runnable's modes and in no other`, () => {
      for (const row of READ_SITE_ROWS.filter((r) => r.runnable === name)) {
        expect(row.modes.length, pairId(row.key, row.via)).toBeGreaterThan(0);
        for (const m of row.modes) expect(MODES[name], `${pairId(row.key, row.via)} ${m}`).toContain(m);
      }
    });
  }

  it("UNREACHED_SITES is printed and its size is pinned at 0", () => {
    console.log(`UNREACHED_SITES (${UNREACHED_SITES.size}): ${[...UNREACHED_SITES].map(([k, v]) => `${k}: ${v}`).join("; ") || "none"}`);
    expect(UNREACHED_SITES.size).toBe(UNREACHED_SITES_SIZE);
  });

  it("existsSync is never a derived site: an existence test reads a failure as absence", () => {
    for (const name of RUNNABLES) {
      expect(deriveReadSites(committed(name)).filter((s) => s.fn === "existsSync").map((s) => s.key), name).toEqual([]);
    }
  });

  it("every node:fs name the runnables use is a read or a non-read, both ways", () => {
    const reads = new Set<string>(FS_READ_FNS);
    const others = new Set<string>(FS_OTHER_FNS);
    expect([...reads].filter((n) => others.has(n)), "no name is both").toEqual([]);
    const usedOthers = new Set<string>();
    for (const name of RUNNABLES) {
      for (const used of classifiedFsCalls(committed(name))) {
        expect(reads.has(used) || others.has(used), `${name} uses node:fs ${used}, which is neither classified`).toBe(true);
        if (others.has(used)) usedOthers.add(used);
      }
    }
    expect([...usedOthers].sort(), "every FS_OTHER_FNS name is used by a runnable").toEqual([...others].sort());
  });

  it("trace-model.js, state-rules.js and trace-freshness.js have no read site: their callers' rows carry them", () => {
    for (const rel of ["trace-model.js", "state-rules.js", "trace-freshness.js"]) {
      expect(deriveReadSites(join(HERE, "..", rel)), rel).toEqual([]);
    }
  });
});

// ── The derivation on synthetic programs ────────────────────────────────────────────────────────────────

describe("deriveReadSites and callingSites on synthetic programs (plan 37-25)", () => {
  const SYNTH = [
    'import * as ns from "node:fs";',
    'import { statSync as st, constants as fsConstants } from "node:fs";',
    "function target(p) {",
    "  return ns.readdirSync(p, fsConstants.O_RDONLY);",
    "}",
    "function a() {",
    '  return target("x");',
    "}",
    "function b() {",
    "  return target(",
    '    "y");',
    "}",
    "const held = run({ target, other: st });",
    "function c() {",
    '  target("1");',
    '  target("2");',
    "}",
    "const d = () => run({ t: target }, target);",
    "function run(x) { return x; }",
    'st(".");',
    "",
  ].join("\n");

  function synth(text: string): string {
    const js = join(mkTmp("grugops-read-sites-synth-"), "synth.js");
    writeFileSync(js, text, "utf8");
    return js;
  }

  it("namespace members and aliased named imports are read sites; keys survive unrelated line moves", () => {
    const js = synth(SYNTH.replace("const held = run({ target, other: st });\n", ""));
    const sites = deriveReadSites(js);
    expect(sites.map((s) => [s.key, s.fn, s.line])).toEqual([
      ["target:readdirSync#0", "readdirSync", 4],
      ["<top>:statSync#0", "statSync", 19],
    ]);
    expect(classifiedFsCalls(js)).toEqual(["constants", "readdirSync", "statSync"]);
    const moved = deriveReadSites(synth(`\n\n\n${SYNTH.replace("const held = run({ target, other: st });\n", "")}`));
    expect(moved.map((s) => s.key)).toEqual(sites.map((s) => s.key));
    expect(moved.map((s) => s.line)).toEqual(sites.map((s) => s.line + 3));
  });

  it("a read function used as a value is refused by line", () => {
    expect(() => deriveReadSites(synth(SYNTH))).toThrow(/synth\.js:13: the read function statSync is used as a value/);
  });

  it("a namespace used as a value is refused by line", () => {
    expect(() => deriveReadSites(synth('import * as ns from "node:fs";\nconst f = ns;\n'))).toThrow(/synth\.js:2: the node:fs namespace ns/);
  });

  it("callingSites: a direct call, a call split over lines, object-literal and plain arguments, two calls in one scope", () => {
    const js = synth(SYNTH);
    expect(callingSites(js, "target").map((c) => [c.scope, c.line, c.kind])).toEqual([
      ["a", 7, "direct"],
      ["b", 10, "direct"],
      ["<top>", 13, "passed"],
      ["c", 15, "direct"],
      ["c", 16, "direct"],
      ["d", 18, "passed"],
      ["d", 18, "passed"],
    ]);
  });

  it("callingSites: a function stored in a variable throws naming the line", () => {
    const js = synth(`${SYNTH}const stored = target;\n`);
    expect(() => callingSites(js, "target")).toThrow(/synth\.js:21: target is referenced as a VariableDeclaration/);
  });

  it("callingSites: an io-object member call is a direct entry; a self-call is not an entry", () => {
    const js = synth(
      [
        "function reader(p) { if (p) return reader(null); return 1; }",
        "function model(io) {",
        "  return io.reader(1);",
        "}",
        "model({ reader });",
        "",
      ].join("\n"),
    );
    expect(callingSites(js, "reader").map((c) => [c.scope, c.line, c.kind])).toEqual([
      ["model", 3, "direct"],
      ["<top>", 5, "passed"],
    ]);
  });
});

// ── The table: every read site, under every caller, in every mode that reaches it ────────────────────────

describe("READ-1 table: every derived read site fails as could-not-run or a named finding, never a pass or a write", () => {
  for (const row of READ_SITE_ROWS) {
    for (const mode of row.modes) {
      it(`${row.runnable} ${mode}: ${pairId(row.key, row.via)}`, () => {
        const base = baselineStdout(row.runnable, mode);
        const run = runPair(row.runnable, pairOf(row), mode);
        if (typeof base !== "string" || "skip" in run) {
          console.warn(typeof base !== "string" ? base.skip : (run as { skip: string }).skip);
          return;
        }
        const { r, before, after, all } = run;
        expect(
          r.fired,
          `the fault fired; the preload counted ${r.siteNotVia} call(s) at the site but not the via (non-zero: the via ` +
            `line is wrong, fix the derivation or the fixture, never this assertion)\n${all}`,
        ).toBeGreaterThan(0);
        expect(r.signal, all).toBeNull();
        expect([1, 2], `exit 1 or 2, never 0 and never no code\n${all}`).toContain(r.status);
        if (r.status === 2) {
          expect(r.stdout, `exit 2 has an empty stdout\n${all}`).toBe("");
        } else {
          const seen = new Set(base.split("\n"));
          const added = r.stdout.split("\n").filter((l) => FINDING_LINE[row.runnable].test(l) && !seen.has(l));
          expect(added.length, `exit 1 adds a finding line the unfaulted run does not print\n${all}`).toBeGreaterThan(0);
        }
        expect(hasNodeStack(r.stderr), `no Node stack trace\n${all}`).toBe(false);
        expect(after, `nothing was written, changed or removed\n${all}`).toEqual(before);
      });
    }
  }
});

describe("READ-1 table: a mode a row does not list reaches no fault there", () => {
  for (const row of READ_SITE_ROWS) {
    for (const mode of MODES[row.runnable].filter((m) => !row.modes.includes(m))) {
      it(`${row.runnable} ${mode}: ${pairId(row.key, row.via)} is not reached`, () => {
        const run = runPair(row.runnable, pairOf(row), mode);
        if ("skip" in run) {
          console.warn(run.skip);
          return;
        }
        expect(run.r.fired, `this mode reaches the site: list it in the row\n${run.all}`).toBe(0);
      });
    }
  }
});

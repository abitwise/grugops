// read-sites.test.ts — READ-1 over every read site of the three host runnables (plan 37-25, D-17,
// 37-GAP-PLANNING-BRIEF.md §1 READ-1 and §2.1).
//
// THE RULE. In trace-render, state-check and state-roll, a read that fails is either could-not-run (exit 2, an
// empty stdout, refused by name rather than through the unexpected-throw backstop of plan 37-20) or a named
// finding (exit 1, a finding line that the unfaulted run does not print). It is never "no data", never a pass,
// and never lets a write mode write or remove anything.
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
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
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
  enclosingName,
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
 * 2026-10-23, plan 37-28 (Task 1): 18, 21 and 11 read sites. In trace-render and state-check the walk's
 * `readRawNotesWithSkips:statSync#0` (the stat with throwIfNoEntry false, CR-03) is gone and the one absence
 * owner's three sites take its place: `entryPresence:lstatSync#0`, `entryPresence:statSync#0` and
 * `entryPresence:realpathSync#0` (net +2 each). state-roll does not embed the walk.
 * 2026-10-23, plan 37-28 (Task 2): 17, 20 and 11 read sites. The hand-written task reads and listings are gone:
 * trace-render's `readTask:realpathSync#0` and `listTasks:readdirSync#0`, state-check's
 * `readTraceTask:realpathSync#0` and `listTasks:readdirSync#0`; the generated `listContextTasks:readdirSync#0`
 * takes the listings' place (net -1 each). The owner's three sites are now entered from three callers, the walk,
 * listContextTasks (a keeper's presence) and readTaskNoteRefs (the task entry), so each is one row per caller.
 * 2026-10-24, plan 37-29 (Task 1): 14, 19 and 11 read sites. trace-render's realDirectoryOrNull asks the absence
 * owner (IN-10), so its own `realDirectoryOrNull:{lstatSync,realpathSync,statSync}#0` are gone (net -3), and
 * state-check's locate does too, so `locate:realpathSync#0` is gone (net -1). The owner's three sites gain a fourth
 * caller in each: `realDirectoryOrNull#0` and `locate#0`.
 * 2026-10-24, plan 37-29 (Task 2): 12, 15 and 11 read sites. Every other absence decision of the two trace runnables
 * moved onto the owner: trace-render's pre-write `<top>:lstatSync#0` and `readText:lstatSync#0` are gone (net -2),
 * and state-check's `readState:statSync#0` (the stat with throwIfNoEntry false), `sizeFinding:lstatSync#0`,
 * `traceDirectory:statSync#0` and `readTraceText:lstatSync#0` are gone (net -4). The owner's three sites gain the
 * callers `<top>#0` (the pre-write check) and `readText#0` in trace-render, and `runnableSkewFindings#0` (each
 * sibling program) in state-check.
 */
const TRACE_RENDER_READ_SITES = 12;
const STATE_CHECK_READ_SITES = 15;
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

/**
 * The callers of the absence owner in each trace runnable: the walk, listContextTasks and readTaskNoteRefs (plan
 * 37-28); realDirectoryOrNull and locate (plan 37-29, Task 1); the pre-write check, readText and runnableSkewFindings
 * (plan 37-29, Task 2).
 */
const TR_PRESENCE_CALLERS = [
  "readRawNotesWithSkips#0",
  "listContextTasks#0",
  "readTaskNoteRefs#0",
  "realDirectoryOrNull#0",
  "<top>#0",
  "readText#0",
];
const SC_PRESENCE_CALLERS = ["readRawNotesWithSkips#0", "listContextTasks#0", "readTaskNoteRefs#0", "locate#0", "runnableSkewFindings#0"];

const READ_SITE_ROWS: readonly ReadSiteRow[] = [
  // trace-render: the embedded non-blocking reader (via readText and via the note walk) and the note walk.
  ...rows("trace-render", TR, "readRegularFileOrNull:openSync#0", ["readRawNotesWithSkips#0", "readText#0"]),
  ...rows("trace-render", TR, "readRegularFileOrNull:fstatSync#0", ["readRawNotesWithSkips#0", "readText#0"]),
  ...rows("trace-render", TR, "readRegularFileOrNull:readSync#0", ["readRawNotesWithSkips#0", "readText#0"]),
  ...rows("trace-render", TR, "readRawNotesWithSkips:readdirSync#0"),
  // trace-render: the one absence owner (plan 37-28, D-18), under each caller: the walk (the notes directory),
  // listContextTasks (the fixture's `.gitkeep` keepers), readTaskNoteRefs (each task entry) and, since plan 37-29
  // (IN-10), realDirectoryOrNull (the context roots, the state directory and the trace directory), the pre-write
  // check (`<top>#0`) and readText (each compared path).
  ...rows("trace-render", TR, "entryPresence:lstatSync#0", TR_PRESENCE_CALLERS),
  ...rows("trace-render", TR, "entryPresence:statSync#0", TR_PRESENCE_CALLERS),
  ...rows("trace-render", TR, "entryPresence:realpathSync#0", TR_PRESENCE_CALLERS),
  // trace-render: the generated context-root listing (plan 37-28, CR-04), entered only from the hand-written listTasks.
  ...rows("trace-render", TR, "listContextTasks:readdirSync#0"),
  // trace-render: the root. realDirectoryOrNull makes no read of its own since plan 37-29: its rows are the owner's
  // under realDirectoryOrNull#0 above.
  ...rows("trace-render", TR, "<top>:realpathSync#0"),
  ...rows("trace-render", TR, "<top>:statSync#0"),
  ...rows("trace-render", TR, "<top>:accessSync#0"),
  // trace-render: the trace directory reader (the task lister and reader handed to the trace model are thin wrappers
  // over the generated listContextTasks and readTaskNoteRefs since plan 37-28; the pre-write check and readText ask
  // the owner since plan 37-29).
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
  ...rows("state-check", SC, "readRawNotesWithSkips:readdirSync#0"),
  // state-check: the one absence owner (plan 37-28, D-18), under each caller, and the generated listing.
  // Since plan 37-29 (IN-10) locate asks the owner too, so every state path reaches it under locate#0, and so does
  // runnableSkewFindings for each sibling program.
  ...rows("state-check", SC, "entryPresence:lstatSync#0", SC_PRESENCE_CALLERS),
  ...rows("state-check", SC, "entryPresence:statSync#0", SC_PRESENCE_CALLERS),
  ...rows("state-check", SC, "entryPresence:realpathSync#0", SC_PRESENCE_CALLERS),
  ...rows("state-check", SC, "listContextTasks:readdirSync#0"),
  // state-check: the root and the hand-written readers (locate makes no read of its own since plan 37-29).
  ...rows("state-check", SC, "<top>:realpathSync#0"),
  ...rows("state-check", SC, "<top>:statSync#0"),
  ...rows("state-check", SC, "<top>:accessSync#0"),
  ...rows("state-check", SC, "listDirectory:readdirSync#0", [
    "moveOnlyReport#0",
    "moveOnlyReport#1",
    "<top>#0",
    "<top>#1",
    "<top>#2",
  ]),
  ...rows("state-check", SC, "confirmListed:lstatSync#0"),
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
 * directory inside it. A fourth, taskA's `notes` (plan 37-28), reaches the absence owner's stat of a link, and a
 * regular `.gitkeep` in each context root reaches the owner under listContextTasks. After the render, the trace directory gains a generated trace file the plan no longer holds
 * (ABC-099.md, a copy of ABC-001.md): the trace model reads it as an extra file, which reaches its second readText
 * call, and the write mode would remove it, the CR-01 shape. So the unfaulted write mode removes one file and the
 * unfaulted --check is exit 1 with one EXTRA line.
 */
function traceRenderRepo(): string | { readonly skip: string } {
  const root = mkTmp("grugops-read-sites-trace-repo-");
  // Plan 37-28: taskA's `notes` is a link to `real-notes`, so the absence owner's stat of a link is reached.
  plant(root, `${CONTEXT_REL}/taskA/real-notes/n1.md`, noteText("n1", ["ABC-001", "src/a.ts"]));
  plant(root, `archive-context-real/taskB/notes/n2.md`, noteText("n2", ["ABC-002", "#41"]));
  // Plan 37-28: a regular `.gitkeep` keeper in each context root, so listContextTasks asks the absence owner.
  plant(root, `${CONTEXT_REL}/.gitkeep`, "");
  plant(root, "archive-context-real/.gitkeep", "");
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
    [join(root, ...CONTEXT_REL.split("/"), "taskA", "real-notes"), join(root, ...CONTEXT_REL.split("/"), "taskA", "notes")],
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
function stateCheckRepo(): string | { readonly skip: string } {
  const root = mkTmp("grugops-read-sites-check-repo-");
  plant(root, LAYOUT_MARKER_REL, `${LAYOUT_MARKER_CONTENT}\n`);
  plant(root, BOARD_REL, "# Board\n\n## Ready (WIP unlimited)\n\n- [ABC-001] a ready ticket\n\n## Done (WIP unlimited)\n\n- [ABC-002] a done ticket\n");
  plant(root, `${TICKETS_REL}/ABC-001.md`, "# ABC-001\n");
  plant(root, NFR_CATALOG_REL, `# NFR catalog\n\n${NFR_LINE_001}`);
  plant(root, `${NFR_DIR_REL}/NFR-001.md`, "# NFR-001\n");
  // Plan 37-28: taskA's `notes` is a link to `real-notes`, so the absence owner's stat of a link is reached.
  plant(root, `${CONTEXT_REL}/taskA/real-notes/n1.md`, noteText("n1", ["ABC-001", "NFR-001", "src/a.ts"]));
  const skip = linkOrSkip(
    join(root, ...CONTEXT_REL.split("/"), "taskA", "real-notes"),
    join(root, ...CONTEXT_REL.split("/"), "taskA", "notes"),
    "scripts/runnable-ref/read-sites.test.ts: state-check's repository (plan 37-28)",
  );
  if (skip !== null) return { skip };
  plant(root, `${CONTEXT_ARCHIVE_REL}/taskB/notes/n2.md`, noteText("n2", ["ABC-002", "#41"]));
  // Plan 37-28: a regular `.gitkeep` keeper in each context root, so listContextTasks asks the absence owner.
  plant(root, `${CONTEXT_REL}/.gitkeep`, "");
  plant(root, `${CONTEXT_ARCHIVE_REL}/.gitkeep`, "");
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
          // A read failure is expected, so it is refused by name where it happens. The unexpected-throw handler of
          // plan 37-20 is a backstop for what nothing caught; a read that reaches it was not handled.
          expect(r.stderr, `exit 2 by name, never through the unexpected-throw backstop\n${all}`).not.toContain(
            "stopped unexpectedly (",
          );
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

// ── The one-owner census (plan 37-29, D-18, READ-1 round 2) ──────────────────────────────────────────────

/** The runnables the census covers in this plan; plan 37-30 adds state-roll. */
const ONE_OWNER_RUNNABLES = ["trace-render", "state-check"] as const;

/** The only functions in which a runnable may compare a code with the string literal ENOENT. */
const ENOENT_OWNERS = ["entryPresence", "readRegularFileOrNull"] as const;

/**
 * The ENOENT comparisons of each committed runnable, all inside ENOENT_OWNERS.
 * 2026-10-24, plan 37-29: 2 and 2 (entryPresence's lstat ENOENT and readRegularFileOrNull's open ENOENT, one each).
 * At 3eded848 trace-render had 6 (realDirectoryOrNull, the pre-write loop, readText and listDir besides the two)
 * and state-check 4 (locate and readTraceText besides the two).
 */
const ENOENT_COMPARISONS: Record<(typeof ONE_OWNER_RUNNABLES)[number], number> = {
  "trace-render": 2,
  "state-check": 2,
};

/** The two option names that let a read decide absence or entry type in place of the owner. */
const FORBIDDEN_PROPERTIES = ["throwIfNoEntry", "withFileTypes"] as const;

/** True when `n` is the string literal ENOENT (a plain or a no-substitution template literal). */
function isEnoentLiteral(n: ts.Node): boolean {
  return (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && n.text === "ENOENT";
}

/** Every ENOENT comparison of a .js: an `===`/`!==`/`==`/`!=` with an ENOENT operand, or a `case "ENOENT":`. */
function enoentComparisons(sf: ts.SourceFile): { readonly line: number; readonly enclosing: string }[] {
  const out: { line: number; enclosing: string }[] = [];
  const equality = new Set([
    ts.SyntaxKind.EqualsEqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsEqualsToken,
    ts.SyntaxKind.EqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsToken,
  ]);
  const visit = (n: ts.Node): void => {
    const hit =
      (ts.isBinaryExpression(n) && equality.has(n.operatorToken.kind) && (isEnoentLiteral(n.left) || isEnoentLiteral(n.right))) ||
      (ts.isCaseClause(n) && isEnoentLiteral(n.expression));
    if (hit) out.push({ line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, enclosing: enclosingName(n) });
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

/** Every property of an object literal named one of FORBIDDEN_PROPERTIES, by line. */
function forbiddenProperties(sf: ts.SourceFile): string[] {
  const out: string[] = [];
  const visit = (n: ts.Node): void => {
    if ((ts.isPropertyAssignment(n) || ts.isShorthandPropertyAssignment(n)) && ts.isObjectLiteralExpression(n.parent)) {
      const name = ts.isIdentifier(n.name) || ts.isStringLiteral(n.name) ? n.name.text : null;
      if (name !== null && (FORBIDDEN_PROPERTIES as readonly string[]).includes(name)) {
        out.push(`${name} at line ${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

/** A committed runnable's .js as a syntax tree, as deriveReadSites parses it. */
function parsedJs(name: Runnable): ts.SourceFile {
  const js = committed(name);
  return ts.createSourceFile(js, readFileSync(js, "utf8"), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
}

describe("READ-1 one owner (plan 37-29, D-18): ENOENT is compared only inside entryPresence and readRegularFileOrNull", () => {
  for (const name of ONE_OWNER_RUNNABLES) {
    it(`${name}.js: every ENOENT comparison sits in an owner, and the count is pinned`, () => {
      const found = enoentComparisons(parsedJs(name));
      console.log(`ENOENT_COMPARISONS ${name}: ${found.length} (${found.map((c) => `${c.enclosing}:${c.line}`).join(", ")})`);
      expect(
        found.filter((c) => !(ENOENT_OWNERS as readonly string[]).includes(c.enclosing)).map((c) => `${c.enclosing}:${c.line}`),
        `${name}.js decides absence outside the owner`,
      ).toEqual([]);
      expect(found.length).toBe(ENOENT_COMPARISONS[name]);
      expect(new Set(found.map((c) => c.enclosing)), "each owner holds its comparison").toEqual(new Set(ENOENT_OWNERS));
    });

    it(`${name}.js: no object literal names throwIfNoEntry or withFileTypes`, () => {
      expect(forbiddenProperties(parsedJs(name))).toEqual([]);
    });
  }

  it("the census reads the syntax tree: a comment or a message string naming ENOENT is not a comparison, and a case label is", () => {
    const sf = ts.createSourceFile(
      "synth.js",
      [
        "// code === \"ENOENT\" in a comment",
        "function a(code) { return `the code is ENOENT, ${code === \"x\"}`; }",
        "function b(code) { switch (code) { case \"ENOENT\": return 1; } return \"ENOENT\" !== code; }",
        "const c = { throwIfNoEntry: false, withFileTypes };",
        "",
      ].join("\n"),
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.JS,
    );
    expect(enoentComparisons(sf)).toEqual([
      { line: 3, enclosing: "b" },
      { line: 3, enclosing: "b" },
    ]);
    expect(forbiddenProperties(sf)).toEqual(["throwIfNoEntry at line 4", "withFileTypes at line 4"]);
  });
});

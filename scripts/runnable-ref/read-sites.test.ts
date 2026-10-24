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
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { skipLine, stageShapeOrSkip, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import {
  ARCHIVE_REL,
  BOARD_DONE_ARCHIVE_REL,
  BOARD_REL,
  BUDGETS,
  CONTEXT_ARCHIVE_REL,
  CONTEXT_REL,
  DECISIONS_ARCHIVE_REL,
  DECISIONS_REL,
  GRUGOPS_ARCHIVE_REL,
  GRUGOPS_DIR_REL,
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  MEMORY_BANK_REL,
  NFR_CATALOG_REL,
  NFR_DIR_REL,
  PROGRESS_ARCHIVE_REL,
  PROGRESS_REL,
  QUEUE_DONE_ARCHIVE_REL,
  QUEUE_DONE_REL,
  STATE_ROOT_REL,
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
import { EMBED_CLOSE } from "../generate-runnable-embeds.js";

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
 * 2026-10-24, plan 37-30 (Task 1): 12, 15 and 10 read sites. state-roll embeds the absence owner (D-18), so its
 * realDirectoryOrNull asks it and `realDirectoryOrNull:{lstatSync,realpathSync,statSync}#0` are gone (net -3), and
 * readTextOrThrow asks it and `readTextOrThrow:lstatSync#0` is gone (net -1); the owner's three sites arrive (net
 * +3), each entered from two callers, `realDirectoryOrNull#0` and `readTextOrThrow#0`.
 * 2026-10-24, plan 37-33 (Task 1): 15, 18 and 10 read sites. trace-render and state-check embed the root-chain owner
 * (D-20, CR-05), so its three sites arrive in each, `rootChainPresence:lstatSync#0`, `rootChainPresence:statSync#0`
 * and `rootChainPresence:realpathSync#0` (net +3 each). Each is entered from one calling call expression,
 * realDirectoryOrNull in trace-render and traceDirectory in state-check, so derivedPairs names them without a via.
 * trace-render's realDirectoryOrNull no longer asks entryPresence, so the owner's three rows under
 * `realDirectoryOrNull#0` are gone (sites unchanged, pairs -3); state-check's locate still asks entryPresence for the
 * state files, so its rows stay. state-roll's region changed only its stamp line.
 * 2026-10-24, plan 37-34 (D-20, IN-13): 15, 18 and 10 read sites, unchanged. trace-render's pre-write check (`<top>`)
 * and readText ask the root-chain owner instead of entryPresence; no read site arrives or leaves, only the pairs move:
 * entryPresence's rows under `<top>#0` and `readText#0` are gone (pairs -6), and rootChainPresence, now entered from
 * three calling call expressions, is one row per caller (`realDirectoryOrNull#0`, `<top>#0`, `readText#0`; pairs
 * +6, its three via-less rows replaced by nine).
 * 2026-10-24, plan 37-35 (D-20, CR-05): 15, 18 and 10 read sites, unchanged. state-check's locate asks the root-chain
 * owner instead of entryPresence; no read site arrives or leaves, only the pairs move: entryPresence's rows under
 * `locate#0` are gone (pairs -3), and rootChainPresence, now entered from two calling call expressions in state-check,
 * is one row per caller (`traceDirectory#0`, `locate#0`; pairs +3, its three via-less rows replaced by six).
 * 2026-10-24, plan 37-36 (Task 1, D-20, CR-05): 15, 18 and 13 read sites. state-roll embeds the root-chain owner, and
 * its realDirectoryOrNull asks it, so `rootChainPresence:{lstatSync,statSync,realpathSync}#0` arrive (net +3), each
 * entered from one calling call expression and so named without a via. entryPresence's three sites stay, entered now
 * only from readTextOrThrow, so their rows lose the via (pairs: six become three).
 * 2026-10-24, plan 37-36 (Task 2, D-20, IN-13): 15, 18 and 10 read sites. state-roll's readTextOrThrow asks the
 * root-chain owner too, and the generator no longer embeds entryPresence in state-roll, so
 * `entryPresence:{lstatSync,statSync,realpathSync}#0` are gone (net -3). rootChainPresence, now entered from two
 * calling call expressions, is one row per caller (`realDirectoryOrNull#0`, `readTextOrThrow#0`; its three via-less
 * rows replaced by six).
 * 2026-10-24, plan 37-38: 15, 18 and 10, unchanged. The walk's outside-boundary refusal now names the notes directory
 * (a message, regenerated into trace-render and state-check); no read site arrives or leaves.
 */
const TRACE_RENDER_READ_SITES = 15;
const STATE_CHECK_READ_SITES = 18;
const STATE_ROLL_READ_SITES = 10;
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
 * (plan 37-29, Task 2). Plan 37-33 (D-20): trace-render's realDirectoryOrNull asks the root-chain owner instead, so it
 * left this list; its rows are rootChainPresence's below. Plan 37-34 (D-20): the pre-write check (`<top>#0`) and
 * readText (`readText#0`) left it too, for TR_ROOT_CHAIN_CALLERS.
 */
const TR_PRESENCE_CALLERS = ["readRawNotesWithSkips#0", "listContextTasks#0", "readTaskNoteRefs#0"];
/**
 * The callers of the root-chain owner in trace-render: realDirectoryOrNull (plan 37-33: the context roots, the state
 * directory and the trace directory), the pre-write check (`<top>#0`, each planned path) and readText (each compared
 * path), both since plan 37-34 (D-20).
 */
const TR_ROOT_CHAIN_CALLERS = ["realDirectoryOrNull#0", "<top>#0", "readText#0"];
/**
 * The callers of the absence owner in state-check: the walk, listContextTasks and readTaskNoteRefs (plan 37-28) and
 * runnableSkewFindings (each sibling program, plan 37-29). Plan 37-35 (D-20): locate left this list for
 * SC_ROOT_CHAIN_CALLERS.
 */
const SC_PRESENCE_CALLERS = ["readRawNotesWithSkips#0", "listContextTasks#0", "readTaskNoteRefs#0", "runnableSkewFindings#0"];
/**
 * The callers of the root-chain owner in state-check: traceDirectory (plan 37-33: the trace directory and the two
 * context roots) and locate (plan 37-35: every other state path, the layout marker, the board, both indexes, the
 * progress file, each listed folder, each measured record and each compared trace file).
 */
const SC_ROOT_CHAIN_CALLERS = ["traceDirectory#0", "locate#0"];
/**
 * The callers of the root-chain owner in state-roll (plan 37-36, D-20): realDirectoryOrNull (the state directory, the
 * archive directory, the memory bank directory) and readTextOrThrow (the board, the progress file, both archives, and
 * the roll's re-reads through io.read). Until plan 37-36 they were SR_PRESENCE_CALLERS, entryPresence's two callers;
 * state-roll no longer embeds entryPresence.
 */
const SR_ROOT_CHAIN_CALLERS = ["realDirectoryOrNull#0", "readTextOrThrow#0"];

const READ_SITE_ROWS: readonly ReadSiteRow[] = [
  // trace-render: the embedded non-blocking reader (via readText and via the note walk) and the note walk.
  ...rows("trace-render", TR, "readRegularFileOrNull:openSync#0", ["readRawNotesWithSkips#0", "readText#0"]),
  ...rows("trace-render", TR, "readRegularFileOrNull:fstatSync#0", ["readRawNotesWithSkips#0", "readText#0"]),
  ...rows("trace-render", TR, "readRegularFileOrNull:readSync#0", ["readRawNotesWithSkips#0", "readText#0"]),
  ...rows("trace-render", TR, "readRawNotesWithSkips:readdirSync#0"),
  // trace-render: the one absence owner (plan 37-28, D-18), under each caller: the walk (the notes directory),
  // listContextTasks (the fixture's `.gitkeep` keepers) and readTaskNoteRefs (each task entry). The pre-write check
  // and readText asked it from plan 37-29 to plan 37-34; they ask the root-chain owner below.
  ...rows("trace-render", TR, "entryPresence:lstatSync#0", TR_PRESENCE_CALLERS),
  ...rows("trace-render", TR, "entryPresence:statSync#0", TR_PRESENCE_CALLERS),
  ...rows("trace-render", TR, "entryPresence:realpathSync#0", TR_PRESENCE_CALLERS),
  // trace-render: the root-chain owner (plan 37-33, D-20, CR-05), under each caller: realDirectoryOrNull (the context
  // roots, the state directory and the trace directory) and, since plan 37-34, the pre-write check (`<top>#0`, each
  // planned path) and readText (each compared path). The fixture's directories and rendered files are real, so the
  // stat and the realpath of the last component are reached on each caller's first call.
  ...rows("trace-render", TR, "rootChainPresence:lstatSync#0", TR_ROOT_CHAIN_CALLERS),
  ...rows("trace-render", TR, "rootChainPresence:statSync#0", TR_ROOT_CHAIN_CALLERS),
  ...rows("trace-render", TR, "rootChainPresence:realpathSync#0", TR_ROOT_CHAIN_CALLERS),
  // trace-render: the generated context-root listing (plan 37-28, CR-04), entered only from the hand-written listTasks.
  ...rows("trace-render", TR, "listContextTasks:readdirSync#0"),
  // trace-render: the root. realDirectoryOrNull makes no read of its own since plan 37-29: its rows are the
  // root-chain owner's above (plan 37-33).
  ...rows("trace-render", TR, "<top>:realpathSync#0"),
  ...rows("trace-render", TR, "<top>:statSync#0"),
  ...rows("trace-render", TR, "<top>:accessSync#0"),
  // trace-render: the trace directory reader (the task lister and reader handed to the trace model are thin wrappers
  // over the generated listContextTasks and readTaskNoteRefs since plan 37-28; the pre-write check and readText ask
  // the root-chain owner since plan 37-34).
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
  // runnableSkewFindings asks it for each sibling program (plan 37-29). locate asked it from plan 37-29 to plan 37-35;
  // it asks the root-chain owner below.
  ...rows("state-check", SC, "entryPresence:lstatSync#0", SC_PRESENCE_CALLERS),
  ...rows("state-check", SC, "entryPresence:statSync#0", SC_PRESENCE_CALLERS),
  ...rows("state-check", SC, "entryPresence:realpathSync#0", SC_PRESENCE_CALLERS),
  ...rows("state-check", SC, "listContextTasks:readdirSync#0"),
  // state-check: the root-chain owner (plan 37-33, D-20, CR-05), under each caller: traceDirectory (the trace directory
  // and the two context roots) and, since plan 37-35, locate (every other state path).
  ...rows("state-check", SC, "rootChainPresence:lstatSync#0", SC_ROOT_CHAIN_CALLERS),
  ...rows("state-check", SC, "rootChainPresence:statSync#0", SC_ROOT_CHAIN_CALLERS),
  ...rows("state-check", SC, "rootChainPresence:realpathSync#0", SC_ROOT_CHAIN_CALLERS),
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

  // state-roll: the embedded reader (one caller, readTextOrThrow) and the root.
  ...rows("state-roll", SR, "readRegularFileOrNull:openSync#0"),
  ...rows("state-roll", SR, "readRegularFileOrNull:fstatSync#0"),
  ...rows("state-roll", SR, "readRegularFileOrNull:readSync#0"),
  ...rows("state-roll", SR, "<top>:realpathSync#0"),
  ...rows("state-roll", SR, "<top>:statSync#0"),
  ...rows("state-roll", SR, "<top>:accessSync#0"),
  // state-roll: the root-chain owner (plan 37-36, D-20, CR-05), under its two callers: realDirectoryOrNull (the state
  // directory, the archive directory, the memory bank directory) and readTextOrThrow (the planning reads through
  // readText, and the roll's re-reads through io.read), neither of which makes a read of its own. The first call of
  // each caller (the state directory, the board) reaches all three owner sites in every mode. Both asked the round-2
  // absence owner, entryPresence, from plan 37-30 to plan 37-36.
  ...rows("state-roll", SR, "rootChainPresence:lstatSync#0", SR_ROOT_CHAIN_CALLERS),
  ...rows("state-roll", SR, "rootChainPresence:statSync#0", SR_ROOT_CHAIN_CALLERS),
  ...rows("state-roll", SR, "rootChainPresence:realpathSync#0", SR_ROOT_CHAIN_CALLERS),
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
 * The archive context root, `memory-bank/plans` (the state directory) and the trace directory are real directories:
 * until plan 37-33 each was a symbolic link to an in-root directory, so the round-2 owner's follow branch ran, and
 * under D-20 a link there is a refusal, so the fixture no longer plants one (the root-chain shapes below plant them).
 * taskA's `notes` (plan 37-28) stays a link, below a context root, so the absence owner's stat of a link is reached,
 * and a regular `.gitkeep` in each context root reaches the owner under listContextTasks. After the render, the trace directory gains a generated trace file the plan no longer holds
 * (ABC-099.md, a copy of ABC-001.md): the trace model reads it as an extra file, which reaches its second readText
 * call, and the write mode would remove it, the CR-01 shape. So the unfaulted write mode removes one file and the
 * unfaulted --check is exit 1 with one EXTRA line.
 */
function traceRenderRepo(): string | { readonly skip: string } {
  const root = mkTmp("grugops-read-sites-trace-repo-");
  // Plan 37-28: taskA's `notes` is a link to `real-notes`, so the absence owner's stat of a link is reached.
  plant(root, `${CONTEXT_REL}/taskA/real-notes/n1.md`, noteText("n1", ["ABC-001", "src/a.ts"]));
  plant(root, `${CONTEXT_ARCHIVE_REL}/taskB/notes/n2.md`, noteText("n2", ["ABC-002", "#41"]));
  // Plan 37-28: a regular `.gitkeep` keeper in each context root, so listContextTasks asks the absence owner.
  plant(root, `${CONTEXT_REL}/.gitkeep`, "");
  plant(root, `${CONTEXT_ARCHIVE_REL}/.gitkeep`, "");
  mkdirSync(join(root, ...TRACE_DIR_REL.split("/")), { recursive: true });
  const skip = linkOrSkip(
    join(root, ...CONTEXT_REL.split("/"), "taskA", "real-notes"),
    join(root, ...CONTEXT_REL.split("/"), "taskA", "notes"),
    "scripts/runnable-ref/read-sites.test.ts: trace-render's repository (plan 37-25)",
  );
  if (skip !== null) return { skip };
  renderOk(root);
  copyFileSync(join(root, ...TRACE_DIR_REL.split("/"), "ABC-001.md"), join(root, ...TRACE_DIR_REL.split("/"), "ABC-099.md"));
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

/** A trace difference: trace-render's --check lines and state-check's trace-stale findings. */
const TRACE_DIFF_LINE = /^(MISSING|EXTRA|CHANGED) |^FINDING .*\(trace-stale\)\s*$/;

/**
 * Run `pair` of `name` faulted with `code` (EIO unless a row asks for another, plan 37-31's ENOENT variant) on a
 * fresh fixture in `mode`; the tree digests before and after.
 */
function runPair(
  name: Runnable,
  pair: DerivedPair,
  mode: Mode,
  code = "EIO",
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
      code,
    },
    { scratch: mkTmp("grugops-read-sites-fault-"), cwd: dirname(HOST[name]) },
  );
  const after = treeDigest(root);
  const where =
    `site ${pair.site.key} line ${pair.site.line}` +
    (pair.via === undefined ? "" : `, via ${pair.via.id} line ${pair.via.line} (${pair.via.kind})`);
  const all = `${name} ${mode}, ${where}, ${code}\nstatus ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
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

/**
 * THE READ-1 RULE for one faulted run of a table row: the fault fired; exit 1 adding a finding line the unfaulted
 * run does not print, or exit 2 with an empty stdout, refused by name (never the unexpected-throw backstop); no
 * Node stack; nothing written, changed or removed. The EIO table and its ENOENT variant (plan 37-31) both assert it.
 */
function assertReadRule(runnable: Runnable, base: string, run: { r: FaultedRun; before: ReadonlyMap<string, string>; after: ReadonlyMap<string, string>; all: string }): void {
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
    const added = r.stdout.split("\n").filter((l) => FINDING_LINE[runnable].test(l) && !seen.has(l));
    expect(added.length, `exit 1 adds a finding line the unfaulted run does not print\n${all}`).toBeGreaterThan(0);
    // A trace difference the unfaulted run does not print means the failed read was compared as data or as
    // nothing (plan 37-31): a vanished task read as "no notes" shows as EXTRA or trace-stale, which is the absence
    // READ-1 forbids, not a finding about the read.
    expect(added.filter((l) => TRACE_DIFF_LINE.test(l)), `a faulted read adds no trace difference\n${all}`).toEqual([]);
  }
  expect(hasNodeStack(r.stderr), `no Node stack trace\n${all}`).toBe(false);
  expect(after, `nothing was written, changed or removed\n${all}`).toEqual(before);
}

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
        assertReadRule(row.runnable, base, run);
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

// ── The roll's re-reads under the owner (plan 37-30, D-18; the root-chain owner since plan 37-36, D-20) ─────

/**
 * Until plan 37-30 the roll's re-reads had their own row, `readTextOrThrow:lstatSync#0 via io.read#0`. The owner's
 * rows are keyed by its direct caller, readTextOrThrow#0, and the preload fires at the first matching call, which is
 * the board's planning read; so the re-read position would no longer be failed by any row. This row keeps it: the
 * owner's lstat fails only while the stack holds the line of io.read's call of readTextOrThrow, found by
 * callingSites, never by a line lookup. Plan 37-36 (D-20): the owner is the root-chain owner, rootChainPresence, whose
 * lstat runs on each component of the path; the row's site moved from `entryPresence:lstatSync#0` to
 * `rootChainPresence:lstatSync#0`.
 */
describe("READ-1 table: the roll's re-reads under the root-chain owner (plan 37-30, D-18; plan 37-36, D-20)", () => {
  const js = committed("state-roll");
  const site = DERIVED["state-roll"].find((p) => p.site.key === "rootChainPresence:lstatSync#0")?.site;
  const reread = callingSites(js, "readTextOrThrow").find((c) => c.scope === "io.read");

  it("PREMISE: the owner's lstat and io.read's call of readTextOrThrow are both derived", () => {
    expect(site, "rootChainPresence:lstatSync#0 is a derived site of state-roll.js").toBeDefined();
    expect(reread, "io.read calls readTextOrThrow in state-roll.js").toBeDefined();
  });

  for (const mode of SR) {
    it(`state-roll ${mode}: rootChainPresence:lstatSync#0 under io.read ${mode === "dry-run" ? "is not reached" : "fails as could-not-run or a rollback, nothing changed"}`, () => {
      if (site === undefined || reread === undefined) throw new Error("PREMISE: see the premise row");
      const pair: DerivedPair = { site, via: { id: "io.read#0", line: reread.line, kind: reread.kind } };
      const run = runPair("state-roll", pair, mode);
      if ("skip" in run) {
        console.warn(run.skip);
        return;
      }
      const { r, before, after, all } = run;
      if (mode === "dry-run") {
        expect(r.fired, `a dry run makes no re-read\n${all}`).toBe(0);
        return;
      }
      expect(r.fired, `the fault fired (site-not-via ${r.siteNotVia})\n${all}`).toBeGreaterThan(0);
      expect(r.signal, all).toBeNull();
      expect([1, 2], `exit 1 or 2, never 0\n${all}`).toContain(r.status);
      if (r.status === 2) expect(r.stdout, all).toBe("");
      else expect(r.stdout, all).toMatch(FINDING_LINE["state-roll"]);
      expect(r.stderr, all).not.toContain("stopped unexpectedly (");
      expect(hasNodeStack(r.stderr), all).toBe(false);
      expect(after, `nothing was written, changed or removed\n${all}`).toEqual(before);
    });
  }
});

// ── The ENOENT variant (plan 37-31, D-18; 37-REVIEW.md CR-03 fix) ────────────────────────────────────────
//
// ENOENT is the code a dangling link and a vanished file both produce, and the one code a read can mistake for
// "nothing here". So every row of the table runs again, in each of its modes, with ENOENT in place of EIO, under
// the same rule. This is also the only deterministic way to open the vanish window: an ENOENT at the owner's stat
// of a link target or its realpath, at the walk's readdirSync or at the reader's openSync is a path that went away
// between the presence answer (or the listing) and the read (SPLIT-03, SPLIT-05, SPLIT-06 concurrency).
//
// THE ONE EXEMPTION. Only an lstat ENOENT on a component is absence (37-GAP-PLANNING-BRIEF.md §1.1), and it is
// answered in exactly one place: the lstat inside entryPresence. Where that lstat's caller serves a position that may
// be absent by design, ENOENT there is a correct "absent", and the program must answer it as absence; that is not a
// defect. Each such row is decided here from the owner rule, before any row runs, and still runs: it must fire its
// fault, and its outcome is printed. Since plan 37-38 (IN-12) it must also prove that outcome: the same exit status,
// and the same writes outside its `absent` paths, as an unfaulted run on a fixture where those paths are really gone. A row reached after a listing named the entry (readTaskNoteRefs, the keeper test
// of listContextTasks) is never exempt, and neither is any other site: an ENOENT there is a path that vanished.

/** `<runnable> <key> via <via>` (or `<runnable> <key>`): one row's identity across the three runnables. */
function rowId(row: ReadSiteRow): string {
  return `${row.runnable} ${pairId(row.key, row.via)}`;
}

/**
 * One exempt row: the owner rule that makes an ENOENT there a correct absence, and (plan 37-38, IN-12) the positions
 * its caller asks in the row's base fixture, which the comparison really removes. `absent` is repository-relative,
 * or, with `in: "host"`, names in the directory of the state-check copy. The lists were written from the owner rule
 * (each caller's leaf positions in the fixture, read off a probe of the committed runnables that logged every
 * question the caller asked) before the comparison first ran.
 */
interface ExemptRow {
  readonly reason: string;
  readonly absent: readonly string[];
  readonly in?: "host";
}

/** The trace runnables' notes directories, one per task, in their fixtures. */
const FIXTURE_NOTES: readonly string[] = [`${CONTEXT_REL}/taskA/notes`, `${CONTEXT_ARCHIVE_REL}/taskB/notes`];
/** The paths trace-render plans in traceRenderRepo: the index and the trace file of each ticket the notes name. */
const FIXTURE_PLANNED: readonly string[] = [TRACEABILITY_REL, `${TRACE_DIR_REL}/ABC-001.md`, `${TRACE_DIR_REL}/ABC-002.md`];

/** The rows where an ENOENT is a correct absence, each with the position, the owner rule and the really-absent paths. */
const ENOENT_EXEMPT: ReadonlyMap<string, ExemptRow> = new Map<string, ExemptRow>([
  [
    "trace-render entryPresence:lstatSync#0 via readRawNotesWithSkips#0",
    {
      reason: "a task's notes directory may be absent: the owner's absent is a task with no notes (plan 37-28)",
      absent: FIXTURE_NOTES,
    },
  ],
  [
    // Plan 37-33 (D-20): was "trace-render entryPresence:lstatSync#0 via realDirectoryOrNull#0".
    // Plan 37-34: was "trace-render rootChainPresence:lstatSync#0" (one caller then, so no via).
    "trace-render rootChainPresence:lstatSync#0 via realDirectoryOrNull#0",
    {
      reason:
        "a context root, the state directory and the trace directory may be absent: an absent root holds no task and an absent trace directory has no file yet (plan 37-29); the root-chain owner answers absent only beneath real directories (plan 37-33)",
      absent: [CONTEXT_REL, CONTEXT_ARCHIVE_REL, STATE_ROOT_REL, TRACE_DIR_REL],
    },
  ],
  [
    // Plan 37-34 (D-20): was "trace-render entryPresence:lstatSync#0 via <top>#0".
    "trace-render rootChainPresence:lstatSync#0 via <top>#0",
    {
      reason: "a planned trace file or index may be absent before its first render: the pre-write check passes an absent path (plan 37-29)",
      absent: FIXTURE_PLANNED,
    },
  ],
  [
    // Plan 37-34 (D-20): was "trace-render entryPresence:lstatSync#0 via readText#0".
    "trace-render rootChainPresence:lstatSync#0 via readText#0",
    {
      reason: "a planned trace file or index may be absent: the compare reports it missing, and the write mode writes it (plan 37-29)",
      absent: [...FIXTURE_PLANNED, `${TRACE_DIR_REL}/ABC-099.md`],
    },
  ],
  [
    "state-check entryPresence:lstatSync#0 via readRawNotesWithSkips#0",
    {
      reason: "a task's notes directory may be absent: the owner's absent is a task with no notes (plan 37-28)",
      absent: FIXTURE_NOTES,
    },
  ],
  [
    // Plan 37-35 (D-20): was "state-check entryPresence:lstatSync#0 via locate#0".
    "state-check rootChainPresence:lstatSync#0 via locate#0",
    {
      reason:
        "every state path locate serves may be absent: the layout marker (no marker is WARN mode), the board and the indexes (an absent finding), the progress file, the folders and the trace positions (plan 37-29); the root-chain owner answers absent only beneath real directories (plan 37-35)",
      absent: [
        LAYOUT_MARKER_REL,
        BOARD_REL,
        TRACEABILITY_REL,
        NFR_CATALOG_REL,
        TICKETS_REL,
        `${TICKETS_REL}/ABC-001.md`,
        NFR_DIR_REL,
        `${NFR_DIR_REL}/NFR-001.md`,
        TRACE_DIR_REL,
        `${TRACE_DIR_REL}/ABC-001.md`,
        `${TRACE_DIR_REL}/ABC-002.md`,
        PROGRESS_REL,
        QUEUE_DONE_REL,
        QUEUE_DONE_ARCHIVE_REL,
        DECISIONS_REL,
        DECISIONS_ARCHIVE_REL,
      ],
    },
  ],
  [
    // Plan 37-35: was "state-check rootChainPresence:lstatSync#0" (one caller then, so no via).
    "state-check rootChainPresence:lstatSync#0 via traceDirectory#0",
    {
      reason:
        "a context root and the trace directory may be absent: an absent root holds no task and an absent trace directory has no file yet; the root-chain owner answers absent only beneath real directories (plan 37-33)",
      absent: [CONTEXT_REL, CONTEXT_ARCHIVE_REL, TRACE_DIR_REL],
    },
  ],
  [
    "state-check entryPresence:lstatSync#0 via runnableSkewFindings#0",
    {
      reason: "a sibling program may be absent: state-check then runs alone and reports no skew (plan 37-24, plan 37-29)",
      absent: ["state-roll.js", "trace-render.js"],
      in: "host",
    },
  ],
  [
    // Plan 37-36 (D-20): was "state-roll entryPresence:lstatSync#0 via realDirectoryOrNull#0"; in Task 1
    // "state-roll rootChainPresence:lstatSync#0" (one caller then, so no via).
    "state-roll rootChainPresence:lstatSync#0 via realDirectoryOrNull#0",
    {
      reason:
        "the archive directory and the memory bank directory may be absent (a roll creates the first, the second holds no progress file); an absent state directory is could-not-run by its caller (plan 37-30); the root-chain owner answers absent only beneath real directories (plan 37-36)",
      absent: [STATE_ROOT_REL, ARCHIVE_REL, MEMORY_BANK_REL],
    },
  ],
  [
    // Plan 37-36 (D-20): was "state-roll entryPresence:lstatSync#0 via readTextOrThrow#0"; in Task 1
    // "state-roll entryPresence:lstatSync#0" (one caller then, so no via).
    "state-roll rootChainPresence:lstatSync#0 via readTextOrThrow#0",
    {
      reason: "the Done archive, the progress file and the progress archive may be absent; an absent board is could-not-run by its caller (plan 37-30)",
      absent: [BOARD_REL, PROGRESS_REL, BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL],
    },
  ],
]);

/**
 * The exemption count. 2026-10-24, plan 37-31: 9 (trace-render 4, state-check 3, state-roll 2).
 * 2026-10-24, plan 37-33: 10 (trace-render 4, state-check 4, state-roll 2). trace-render's realDirectoryOrNull row
 * moved to the root-chain owner's lstat; state-check gained the root-chain owner's lstat under traceDirectory.
 * 2026-10-24, plan 37-34: 10, unchanged. trace-render's `<top>#0` and `readText#0` keys moved from entryPresence's lstat
 * to the root-chain owner's, with the same reasons, and its realDirectoryOrNull key gained its via.
 * 2026-10-24, plan 37-35: 10, unchanged. state-check's `locate#0` key moved from entryPresence's lstat to the root-chain
 * owner's, with the same reason, and its traceDirectory key gained its via.
 * 2026-10-24, plan 37-36 (Task 1): 10, unchanged. state-roll's realDirectoryOrNull key moved from entryPresence's lstat
 * to the root-chain owner's (one caller, so no via), with the same reason; its readTextOrThrow key lost its via
 * (entryPresence has one caller left).
 * 2026-10-24, plan 37-36 (Task 2): 10, unchanged. state-roll's readTextOrThrow key moved from entryPresence's lstat to
 * the root-chain owner's, with the same reason, and its realDirectoryOrNull key gained its via.
 * 2026-10-24, plan 37-38 (IN-12): 10, unchanged (trace-render 4, state-check 4, state-roll 2). Each entry gained its
 * `absent` list, and each row now proves its outcome against a really absent fixture.
 */
const ENOENT_EXEMPT_SIZE = 10;

/**
 * The positions a row's `absent` list names that its base fixture is built without, by `<runnable> <mode>` (plan
 * 37-38). stateRollRepo plants no Done archive and no progress archive (a first roll writes them), and in
 * `write-new-archive` no archive directory; the caller still asks each, so it stays on the list, and the PREMISE
 * asserts it absent in the base fixture instead of present.
 */
const FIXTURE_WITHOUT: Readonly<Record<string, readonly string[]>> = {
  "state-roll write": [BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL],
  "state-roll dry-run": [BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL],
  "state-roll write-new-archive": [ARCHIVE_REL, BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL],
};

/** True when `rel` is one of `absent` or lies beneath one. */
function underAny(rel: string, absent: readonly string[]): boolean {
  return absent.some((a) => rel === a || rel.startsWith(`${a}/`));
}

/** The paths created, changed or removed between two digests (by content digest), outside `absent`, sorted. */
function writesOutside(before: ReadonlyMap<string, string>, after: ReadonlyMap<string, string>, absent: readonly string[]): string[] {
  const keys = new Set([...before.keys(), ...after.keys()]);
  return [...keys].filter((k) => before.get(k) !== after.get(k) && !underAny(k, absent)).sort();
}

/**
 * The unfaulted run of `row` in `mode` on a fresh base fixture with the row's `absent` paths really removed (IN-12).
 * PREMISE: each absent path is present in the base fixture, or one FIXTURE_WITHOUT names for this mode (then absent).
 */
function reallyAbsentRun(
  row: ReadSiteRow,
  mode: Mode,
  exempt: ExemptRow,
): { status: number | null; writes: string[]; all: string } | { skip: string } {
  const root = fixture(row.runnable, mode);
  if (typeof root !== "string") return root;
  const js = exempt.in === "host" ? freshHost() : HOST[row.runnable];
  const at = (rel: string): string => (exempt.in === "host" ? join(dirname(js), rel) : join(root, ...rel.split("/")));
  const without = exempt.in === "host" ? [] : (FIXTURE_WITHOUT[`${row.runnable} ${mode}`] ?? []);
  const exists = (p: string): boolean => {
    try {
      lstatSync(p);
      return true;
    } catch {
      return false;
    }
  };
  for (const rel of exempt.absent) {
    expect(exists(at(rel)), `PREMISE: ${rel} is ${without.includes(rel) ? "absent from" : "present in"} the base fixture of ${row.runnable} ${mode}`).toBe(
      !without.includes(rel),
    );
  }
  for (const rel of exempt.absent) rmSync(at(rel), { recursive: true, force: true });
  for (const rel of exempt.absent) expect(exists(at(rel)), `PREMISE: ${rel} is really absent`).toBe(false);
  const before = treeDigest(root);
  const r = runIn(js, root, MODE_ARGS[mode]);
  const after = treeDigest(root);
  const writes = writesOutside(before, after, exempt.in === "host" ? [] : exempt.absent);
  return { status: r.status, writes, all: `really absent, ${row.runnable} ${mode}\nstatus ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}` };
}

describe("READ-1 ENOENT (plan 37-31, D-18): every derived read site, faulted with ENOENT, is could-not-run or a named finding unless absence is the correct answer there", () => {
  it("ENOENT_EXEMPT is printed, its size is pinned, and every key is a real row whose site is the owner's lstat", () => {
    console.log(
      `ENOENT_EXEMPT (${ENOENT_EXEMPT.size}):\n${[...ENOENT_EXEMPT]
        .map(([k, v]) => `  ${k}: ${v.reason}; absent${v.in === "host" ? " (host)" : ""}: ${v.absent.join(", ")}`)
        .join("\n")}`,
    );
    expect(ENOENT_EXEMPT.size).toBe(ENOENT_EXEMPT_SIZE);
    const ids = new Set(READ_SITE_ROWS.map(rowId));
    for (const [key, v] of ENOENT_EXEMPT) {
      expect(ids.has(key), `${key} is a row of READ_SITE_ROWS`).toBe(true);
      expect(key, `${key}: only an owner's lstat can answer absence`).toMatch(
        /^[a-z-]+ (entryPresence:lstatSync#0 via \S+|rootChainPresence:lstatSync#0( via \S+)?)$/,
      );
      expect(v.absent.length, `${key} names the positions it makes really absent`).toBeGreaterThan(0);
    }
    for (const via of ["readTaskNoteRefs#0", "listContextTasks#0"]) {
      expect([...ENOENT_EXEMPT.keys()].filter((k) => k.endsWith(` via ${via}`)), `a row through ${via} is never exempt`).toEqual([]);
    }
  });

  for (const row of READ_SITE_ROWS) {
    for (const mode of row.modes) {
      const exempt = ENOENT_EXEMPT.get(rowId(row));
      it(`${row.runnable} ${mode}: ${pairId(row.key, row.via)}, ENOENT${exempt === undefined ? "" : " (exempt, compared with a really absent fixture)"}`, () => {
        const base = baselineStdout(row.runnable, mode);
        const run = runPair(row.runnable, pairOf(row), mode, "ENOENT");
        if (typeof base !== "string" || "skip" in run) {
          console.warn(typeof base !== "string" ? base.skip : (run as { skip: string }).skip);
          return;
        }
        if (exempt === undefined) {
          assertReadRule(row.runnable, base, run);
          return;
        }
        const { r, all } = run;
        expect(r.fired, `an exempt row still fires its fault\n${all}`).toBeGreaterThan(0);
        expect(r.signal, all).toBeNull();
        expect(hasNodeStack(r.stderr), `no Node stack trace\n${all}`).toBe(false);
        expect(r.stderr, `never the unexpected-throw backstop\n${all}`).not.toContain("stopped unexpectedly (");
        // IN-12 (plan 37-38): the program must answer the ENOENT as it answers a really absent path. The same exit
        // status, and the same paths created, changed or removed outside the absent ones (stdout is not compared: a
        // faulted run read files the really absent run never sees, so its counts line differs).
        const real = reallyAbsentRun(row, mode, exempt);
        if ("skip" in real) {
          console.warn(real.skip);
          return;
        }
        const faultedWrites = writesOutside(run.before, run.after, exempt.in === "host" ? [] : exempt.absent);
        console.log(
          `${rowId(row)} ${mode}: exempt, faulted exit ${r.status}, really absent exit ${real.status}; writes outside the absent paths: ` +
            `faulted [${faultedWrites.join(", ")}], really absent [${real.writes.join(", ")}]`,
        );
        expect(r.status, `the faulted run exits as the really absent run\n${all}\n${real.all}`).toBe(real.status);
        expect(faultedWrites, `the faulted run writes outside the absent paths what the really absent run writes\n${all}\n${real.all}`).toEqual(real.writes);
      });
    }
  }

  // The roll's re-reads (plan 37-30's row above): the owner's lstat answering absent during the roll is a file that
  // vanished after the planning read found it (SPLIT-06), so it is never exempt.
  const js = committed("state-roll");
  // Plan 37-36 (D-20): the site was entryPresence:lstatSync#0 until then.
  const site = DERIVED["state-roll"].find((p) => p.site.key === "rootChainPresence:lstatSync#0")?.site;
  const reread = callingSites(js, "readTextOrThrow").find((c) => c.scope === "io.read");
  for (const mode of ["write", "write-new-archive"] as const) {
    it(`state-roll ${mode}: rootChainPresence:lstatSync#0 under io.read, ENOENT: a file that vanished during the roll is refused, nothing changed`, () => {
      if (site === undefined || reread === undefined) throw new Error("PREMISE: the roll's re-read row's premise row");
      const base = baselineStdout("state-roll", mode);
      const pair: DerivedPair = { site, via: { id: "io.read#0", line: reread.line, kind: reread.kind } };
      const run = runPair("state-roll", pair, mode, "ENOENT");
      if (typeof base !== "string" || "skip" in run) {
        console.warn(typeof base !== "string" ? base.skip : (run as { skip: string }).skip);
        return;
      }
      assertReadRule("state-roll", base, run);
    });
  }
});

// ── The one-owner census (plan 37-29, D-18, READ-1 round 2) ──────────────────────────────────────────────

/** The runnables the census covers: trace-render and state-check since plan 37-29, state-roll since plan 37-30. */
const ONE_OWNER_RUNNABLES = ["trace-render", "state-check", "state-roll"] as const;

/**
 * The presence owners each runnable embeds: the functions in which it may compare a code with the string literal
 * ENOENT, and whose calling call expressions are the read positions of the shape table below.
 * 2026-10-24, plan 37-29/37-30: entryPresence and readRegularFileOrNull in all three.
 * 2026-10-24, plan 37-33 (D-20): trace-render and state-check also embed rootChainPresence; state-roll does not yet
 * (plan 37-36).
 * 2026-10-24, plan 37-36 (Task 1, D-20): state-roll embeds rootChainPresence too.
 * 2026-10-24, plan 37-36 (Task 2, D-20, IN-13): state-roll no longer embeds entryPresence.
 */
const ENOENT_OWNERS: Record<(typeof ONE_OWNER_RUNNABLES)[number], readonly string[]> = {
  "trace-render": ["entryPresence", "readRegularFileOrNull", "rootChainPresence"],
  "state-check": ["entryPresence", "readRegularFileOrNull", "rootChainPresence"],
  "state-roll": ["readRegularFileOrNull", "rootChainPresence"],
};

/**
 * The ENOENT comparisons of each committed runnable, all inside its ENOENT_OWNERS.
 * 2026-10-24, plan 37-29: 2 and 2 (entryPresence's lstat ENOENT and readRegularFileOrNull's open ENOENT, one each).
 * At 3eded848 trace-render had 6 (realDirectoryOrNull, the pre-write loop, readText and listDir besides the two)
 * and state-check 4 (locate and readTraceText besides the two).
 * 2026-10-24, plan 37-33: 3, 3 and 2 (rootChainPresence's lstat ENOENT in trace-render and state-check).
 * 2026-10-24, plan 37-36 (Task 1): 3, 3 and 3 (rootChainPresence's lstat ENOENT in state-roll).
 * 2026-10-24, plan 37-36 (Task 2): 3, 3 and 2 (state-roll: rootChainPresence and readRegularFileOrNull; entryPresence
 * is no longer embedded there).
 * 2026-10-24, plan 37-38: 3, 3 and 2, re-checked and unchanged; each inside its runnable's ENOENT_OWNERS. The plan's
 * one runnable change (the walk's outside-boundary refusal names the notes directory) compares no code.
 */
const ENOENT_COMPARISONS: Record<(typeof ONE_OWNER_RUNNABLES)[number], number> = {
  "trace-render": 3,
  "state-check": 3,
  "state-roll": 2,
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

describe("READ-1 one owner (plan 37-29, D-18; plan 37-33, D-20): ENOENT is compared only inside the presence owners and readRegularFileOrNull", () => {
  for (const name of ONE_OWNER_RUNNABLES) {
    it(`${name}.js: every ENOENT comparison sits in an owner, and the count is pinned`, () => {
      const found = enoentComparisons(parsedJs(name));
      console.log(`ENOENT_COMPARISONS ${name}: ${found.length} (${found.map((c) => `${c.enclosing}:${c.line}`).join(", ")})`);
      expect(
        found.filter((c) => !ENOENT_OWNERS[name].includes(c.enclosing)).map((c) => `${c.enclosing}:${c.line}`),
        `${name}.js decides absence outside the owner`,
      ).toEqual([]);
      expect(found.length).toBe(ENOENT_COMPARISONS[name]);
      expect(new Set(found.map((c) => c.enclosing)), "each owner holds its comparison").toEqual(new Set(ENOENT_OWNERS[name]));
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

// ── READ-1 shapes: the non-error shapes at every read position (plan 37-31, D-18) ───────────────────────────
//
// WHY THIS HALF EXISTS. The EIO table above makes a read site fail with an error code. CR-03 (a dangling `notes`
// link) and CR-04 (a symbolic-link task entry) raised no error at the place that decided, so no error-code row could
// reach them (37-GAP-PLANNING-BRIEF.md §1.1). Here each read position gets the shapes themselves: a dangling link, a
// link to a directory, a link to a regular file, a regular file where a directory is expected (a directory where a
// file is expected), a FIFO, and at a context-root listing a dot-named entry that is not a keeper.
//
// WHERE THE POSITIONS COME FROM. Every absence decision of the three runnables is the generated entryPresence's
// (plans 37-28 to 37-30), so a read position is a path some caller hands to it. The callers are derived from the
// committed .js with callingSites, counted and pinned, and SHAPE_POSITIONS is held equal to the derived
// (runnable, via) set both ways. A caller may serve paths of several kinds (state-check's locate serves directories
// and files), so it may own more than one entry; the equality is over the distinct (runnable, via) pairs.
//
// WHAT EACH CELL ASSERTS. A refused cell is could-not-run by name, or (state-check) a `trace-not-compared` finding
// naming the position, and never a fresh trace; nothing is written. A follow cell (an in-root link to a directory
// holding the same content, at a position that follows in-root links, plan 37-28's flagged assumption) and a keeper
// cell (a regular `.gitkeep` or `.DS_Store`) read through, with output equal to the unplanted run's: both prove the
// owner never turned a present entry into absence.

/** The kind of a read position: what it expects there and whether it follows an in-root link. */
type ShapeKind = "directory-follow" | "directory-refuse" | "root-chain" | "listing" | "file" | "file-follow" | "program";

/**
 * One shape a cell plants. The `dot-` and `keeper-` shapes are planted as an entry inside a context root. The two
 * outside shapes (plan 37-38, D-20) link to a sibling mkdtempSync directory, never one under the repository root:
 * an empty one, or one the original was moved into, so the link holds the position's children (the CR-05 shape).
 */
type ShapeName =
  | "dangling link"
  | "link to a directory"
  | "link to an empty directory outside the root"
  | "link to an outside directory holding the child"
  | "link to a regular file"
  | "regular file"
  | "directory"
  | "FIFO"
  | "keeper .gitkeep"
  | "keeper .DS_Store"
  | ".gitkeep as a link to a regular file"
  | ".gitkeep as a dangling link"
  | ".gitkeep as a FIFO";

/** What a cell expects: refused by name, read through a followed link, or read through a keeper. */
type ShapeExpect = "refused" | "follow" | "keeper";

/**
 * The shapes that apply to each kind, with the outcome each must give.
 * - directory-follow: the notes directory (below a context root). A live in-root link to a directory is read through
 *   (plan 37-28's flagged assumption); a dangling link, a link to a file and a regular file are refused. Until plan
 *   37-33 the trace runnables' context roots, their ancestors, the state directory, the memory bank and the trace
 *   directory were this kind too, and until plan 37-36 state-roll's state, memory bank and archive directories; D-20
 *   made them root-chain.
 *   Plan 37-38 (D-20): below a context root D-20 keeps round 2's rules, and the two outside shapes prove they hold:
 *   the walk's boundary refuses a notes link that leaves the root, whether its target is empty or holds the notes.
 * - directory-refuse: a task entry. The task position never follows a link (37-06 trust decision, CR-04). Plan 37-38
 *   adds the two outside shapes here too.
 * - root-chain (plan 37-33, D-20, CR-05): a context root, an ancestor of one below the root, the state directory, the
 *   memory bank and the trace directory, and (plan 37-36) state-roll's archive directory, asked of the root-chain
 *   owner. The positions are derived from the owner's own chain (CHAIN_ROOT_KINDS, plan 37-38). Every link is refused
 *   from its lstat, whatever it points to (a dangling link, a link to an in-root directory holding the content, a link
 *   to a file, and since plan 37-38 a link to an empty directory outside the root and a link to an outside directory
 *   holding the child), and so is a regular file; a link cell carries ROOT_CHAIN_LINK_REFUSAL.
 * - listing: a dot-named entry of a context root, asked of the owner by listContextTasks. A regular file is a keeper;
 *   a dot-named link or FIFO is a failed task, never dropped.
 * - file: a trace file, the index, an extra trace file, a state file state-roll rolls. Refuses every link.
 * - file-follow: state-check's layout marker, read by readState, whose shape test is the owner's stat of the target
 *   (plan 37-04): an in-root link to a regular file holding the same marker is read through; every other shape is
 *   refused.
 * - program: a sibling program beside state-check (plan 37-24), read through the non-blocking reader.
 */
const SHAPES_BY_KIND: Record<ShapeKind, readonly { readonly shape: ShapeName; readonly expect: ShapeExpect }[]> = {
  "directory-follow": [
    { shape: "dangling link", expect: "refused" },
    { shape: "link to a directory", expect: "follow" },
    { shape: "link to an empty directory outside the root", expect: "refused" },
    { shape: "link to an outside directory holding the child", expect: "refused" },
    { shape: "link to a regular file", expect: "refused" },
    { shape: "regular file", expect: "refused" },
  ],
  "root-chain": [
    { shape: "dangling link", expect: "refused" },
    { shape: "link to a directory", expect: "refused" },
    { shape: "link to an empty directory outside the root", expect: "refused" },
    { shape: "link to an outside directory holding the child", expect: "refused" },
    { shape: "link to a regular file", expect: "refused" },
    { shape: "regular file", expect: "refused" },
  ],
  "directory-refuse": [
    { shape: "dangling link", expect: "refused" },
    { shape: "link to a directory", expect: "refused" },
    { shape: "link to an empty directory outside the root", expect: "refused" },
    { shape: "link to an outside directory holding the child", expect: "refused" },
    { shape: "link to a regular file", expect: "refused" },
    { shape: "regular file", expect: "refused" },
    { shape: "FIFO", expect: "refused" },
  ],
  listing: [
    { shape: "keeper .gitkeep", expect: "keeper" },
    { shape: "keeper .DS_Store", expect: "keeper" },
    { shape: ".gitkeep as a link to a regular file", expect: "refused" },
    { shape: ".gitkeep as a dangling link", expect: "refused" },
    { shape: ".gitkeep as a FIFO", expect: "refused" },
  ],
  file: [
    { shape: "dangling link", expect: "refused" },
    { shape: "link to a directory", expect: "refused" },
    { shape: "link to a regular file", expect: "refused" },
    { shape: "directory", expect: "refused" },
    { shape: "FIFO", expect: "refused" },
  ],
  "file-follow": [
    { shape: "dangling link", expect: "refused" },
    { shape: "link to a directory", expect: "refused" },
    { shape: "link to a regular file", expect: "follow" },
    { shape: "directory", expect: "refused" },
    { shape: "FIFO", expect: "refused" },
  ],
  program: [
    { shape: "dangling link", expect: "refused" },
    { shape: "directory", expect: "refused" },
    { shape: "FIFO", expect: "refused" },
  ],
};

/**
 * The base fixture a position's cells start from.
 * - `trace`: the rendered two-root repository (shapeTraceRepo), shared by trace-render and state-check.
 * - `trace-extra`: the same with a generated trace file the plan no longer holds (ABC-099.md), the only path the
 *   renderer's readText reaches that its pre-write check does not refuse first.
 * - `host`: the `trace` repository, with state-check run from a fresh directory holding copies of the three
 *   runnables, so a cell can plant a shape at a sibling program.
 * - `roll`: state-roll's repository with both rolls planned and an empty archive directory.
 * - `roll-archived`: the same after one roll, so the Done archive and the progress archive exist.
 */
type ShapeBase = "trace" | "trace-extra" | "host" | "roll" | "roll-archived";

/** One read position: a (runnable, via) of the owner, the concrete paths it serves, their kind and the modes. */
interface ShapePosition {
  readonly runnable: Runnable;
  /** `<scope>#<ordinal>` of the owner's calling call expression, as derivedPairs names a via. */
  readonly via: string;
  readonly position: string;
  /** Repository-relative paths; for `host`, names in the runnable's own directory. */
  readonly paths: readonly string[];
  readonly kind: ShapeKind;
  readonly modes: readonly Mode[];
  readonly base: ShapeBase;
}

/** state-roll's two modes for the shape table: a roll and a dry run (write-new-archive is the EIO table's fixture). */
const SR_SHAPE_MODES: readonly Mode[] = ["dry-run", "write"];
/** trace-render's modes in the order a cell runs them: --check reads only, so it runs first on the planted tree. */
const TR_SHAPE_MODES: readonly Mode[] = ["check", "write"];

const ABC_001_TRACE = `${TRACE_DIR_REL}/ABC-001.md`;
const ABC_099_TRACE = `${TRACE_DIR_REL}/ABC-099.md`;
const TASK_A_REL = `${CONTEXT_REL}/taskA`;
const TASK_B_REL = `${CONTEXT_ARCHIVE_REL}/taskB`;

/**
 * The root kinds each runnable asks the root-chain owner about with a `directory` leaf (plan 37-38, D-19, D-20), from
 * the install/state-layout.ts constants: trace-render's realDirectoryOrNull asks both context roots, the state
 * directory and the trace directory; state-check's traceDirectory asks both context roots and the trace directory;
 * state-roll's realDirectoryOrNull asks the state directory, the archive directory and the memory bank directory.
 * Until plan 37-38 the chain positions were a hand-listed TRACE_DIRECTORIES and a hand-listed state-roll list.
 */
const CHAIN_ROOT_KINDS: Record<Runnable, readonly string[]> = {
  "trace-render": [CONTEXT_REL, CONTEXT_ARCHIVE_REL, STATE_ROOT_REL, TRACE_DIR_REL],
  "state-check": [CONTEXT_REL, CONTEXT_ARCHIVE_REL, TRACE_DIR_REL],
  "state-roll": [STATE_ROOT_REL, ARCHIVE_REL, MEMORY_BANK_REL],
};

/** The root-chain positions of a runnable: the union of the owner's own rootChainOf over its root kinds, in order. */
function chainPositions(name: Runnable): readonly string[] {
  return [...new Set(CHAIN_ROOT_KINDS[name].flatMap((rel) => ctxio.rootChainOf(rel)))];
}

/**
 * The derived root-chain position counts.
 * 2026-10-24, plan 37-38: 7, 7 and 3. trace-render and state-check: `.grugops`, `.grugops/context`, `.grugops/archive`,
 * `.grugops/archive/context`, `memory-bank`, `memory-bank/plans`, `memory-bank/plans/traceability` (state-check's
 * three kinds give the same seven: the state directory is on the trace directory's chain). state-roll: `memory-bank`,
 * `memory-bank/plans`, `memory-bank/plans/archive`.
 */
const CHAIN_POSITION_COUNTS: Record<Runnable, number> = {
  "trace-render": 7,
  "state-check": 7,
  "state-roll": 3,
};

/** The note-walk, listing and task positions both trace runnables share, through the generated walk. */
function sharedTracePositions(runnable: "trace-render" | "state-check", modes: readonly Mode[]): ShapePosition[] {
  return [
    {
      runnable,
      via: "readRawNotesWithSkips#0",
      position: "the notes directory of a task",
      paths: [`${TASK_A_REL}/notes`, `${TASK_B_REL}/notes`],
      kind: "directory-follow",
      modes,
      base: "trace",
    },
    {
      runnable,
      via: "listContextTasks#0",
      position: "a dot-named entry of a context root (the keeper test)",
      paths: [CONTEXT_REL, CONTEXT_ARCHIVE_REL],
      kind: "listing",
      modes,
      base: "trace",
    },
    {
      runnable,
      via: "readTaskNoteRefs#0",
      position: "a task entry",
      paths: [TASK_A_REL, TASK_B_REL],
      kind: "directory-refuse",
      modes,
      base: "trace",
    },
  ];
}

const SHAPE_POSITIONS: readonly ShapePosition[] = [
  ...sharedTracePositions("trace-render", TR_SHAPE_MODES),
  {
    runnable: "trace-render",
    via: "realDirectoryOrNull#0",
    position: "a context root, an ancestor of one, the state directory or the trace directory",
    // Plan 37-38: derived from the owner's chain (was the hand-listed TRACE_DIRECTORIES).
    paths: chainPositions("trace-render"),
    kind: "root-chain",
    modes: TR_SHAPE_MODES,
    base: "trace",
  },
  {
    runnable: "trace-render",
    via: "<top>#0",
    position: "a planned path (the pre-write check): the index and a trace file",
    paths: [TRACEABILITY_REL, ABC_001_TRACE],
    kind: "file",
    modes: TR_SHAPE_MODES,
    base: "trace",
  },
  {
    // readText also reads the planned paths, but the pre-write check above refuses them first in both modes, so the
    // path only readText reaches is an extra trace file (listed by listDir, owned, not planned).
    runnable: "trace-render",
    via: "readText#0",
    position: "an extra trace file (the compare read)",
    paths: [ABC_099_TRACE],
    kind: "file",
    modes: TR_SHAPE_MODES,
    base: "trace-extra",
  },
  ...sharedTracePositions("state-check", SC),
  {
    // Plan 37-33 (D-20): was locate#0, kind directory-follow; traceDirectory asks the root-chain owner.
    runnable: "state-check",
    via: "traceDirectory#0",
    position: "a context root, an ancestor of one, the state directory or the trace directory",
    // Plan 37-38: derived from the owner's chain (was the hand-listed TRACE_DIRECTORIES).
    paths: chainPositions("state-check"),
    kind: "root-chain",
    modes: SC,
    base: "trace",
  },
  {
    runnable: "state-check",
    via: "locate#0",
    position: "the index and a trace file",
    paths: [TRACEABILITY_REL, ABC_001_TRACE],
    kind: "file",
    modes: SC,
    base: "trace",
  },
  {
    runnable: "state-check",
    via: "locate#0",
    position: "an extra trace file",
    paths: [ABC_099_TRACE],
    kind: "file",
    modes: SC,
    base: "trace-extra",
  },
  {
    runnable: "state-check",
    via: "locate#0",
    position: "the layout marker",
    paths: [LAYOUT_MARKER_REL],
    kind: "file-follow",
    modes: SC,
    base: "trace",
  },
  {
    runnable: "state-check",
    via: "runnableSkewFindings#0",
    position: "a sibling program beside state-check",
    paths: ["state-roll.js", "trace-render.js"],
    kind: "program",
    modes: SC,
    base: "host",
  },
  {
    // Plan 37-36 (D-20): kind directory-follow until then; realDirectoryOrNull asks the root-chain owner.
    runnable: "state-roll",
    via: "realDirectoryOrNull#0",
    position: "the state directory, the memory bank directory and the archive directory",
    // Plan 37-38: derived from the owner's chain (was the hand-listed state, memory bank and archive directories).
    paths: chainPositions("state-roll"),
    kind: "root-chain",
    modes: SR_SHAPE_MODES,
    base: "roll",
  },
  {
    runnable: "state-roll",
    via: "readTextOrThrow#0",
    position: "the board and the progress file",
    paths: [BOARD_REL, PROGRESS_REL],
    kind: "file",
    modes: SR_SHAPE_MODES,
    base: "roll",
  },
  {
    runnable: "state-roll",
    via: "readTextOrThrow#0",
    position: "the Done archive and the progress archive",
    paths: [BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL],
    kind: "file",
    modes: SR_SHAPE_MODES,
    base: "roll-archived",
  },
];

/**
 * The calling call expressions of the generated presence owners in each committed runnable (callingSites).
 * 2026-10-24, plan 37-31: 6, 5 and 2, measured after plans 37-28 to 37-30. trace-render: readRawNotesWithSkips,
 * listContextTasks, readTaskNoteRefs, realDirectoryOrNull, the pre-write check (`<top>`) and readText. state-check:
 * readRawNotesWithSkips, listContextTasks, readTaskNoteRefs, locate and runnableSkewFindings. state-roll:
 * realDirectoryOrNull and readTextOrThrow.
 * 2026-10-24, plan 37-33: 6, 6 and 2, over both owners. trace-render: entryPresence's five (realDirectoryOrNull left
 * it) and rootChainPresence's realDirectoryOrNull. state-check: entryPresence's five and rootChainPresence's
 * traceDirectory. state-roll: unchanged.
 * 2026-10-24, plan 37-34: 6, 6 and 2, unchanged. trace-render: entryPresence's three (the walk, listContextTasks,
 * readTaskNoteRefs) and rootChainPresence's three (realDirectoryOrNull, the pre-write check `<top>`, readText); the
 * distinct (runnable, via) set, and so SHAPE_POSITIONS, is the same.
 * 2026-10-24, plan 37-36 (Task 1): 6, 6 and 2, unchanged. state-roll: entryPresence's readTextOrThrow and
 * rootChainPresence's realDirectoryOrNull; the distinct (runnable, via) set is the same.
 * 2026-10-24, plan 37-36 (Task 2): 6, 6 and 2, unchanged. state-roll: rootChainPresence's realDirectoryOrNull and
 * readTextOrThrow; the distinct (runnable, via) set is the same.
 */
const TRACE_RENDER_OWNER_CALLERS = 6;
const STATE_CHECK_OWNER_CALLERS = 6;
const STATE_ROLL_OWNER_CALLERS = 2;
const OWNER_CALLER_PINS: Record<Runnable, number> = {
  "trace-render": TRACE_RENDER_OWNER_CALLERS,
  "state-check": STATE_CHECK_OWNER_CALLERS,
  "state-roll": STATE_ROLL_OWNER_CALLERS,
};

/** The presence owners' calling call expressions of a committed runnable, named `<scope>#<ordinal>` as derivedPairs does. */
function ownerCallers(name: Runnable): string[] {
  // The presence owners a runnable embeds are its ENOENT owners less the non-blocking reader (plan 37-33): one table
  // says which owners each runnable has, and each owner's callers are numbered on their own, as derivedPairs does.
  return ENOENT_OWNERS[name]
    .filter((owner) => owner !== "readRegularFileOrNull")
    .flatMap((owner) => {
      const ordinals = new Map<string, number>();
      return callingSites(committed(name), owner).map((c) => {
        const ordinal = ordinals.get(c.scope) ?? 0;
        ordinals.set(c.scope, ordinal + 1);
        return `${c.scope}#${ordinal}`;
      });
    });
}

/** One cell: a position, one of its paths, and one shape its kind applies. */
interface ShapeCell {
  readonly pos: ShapePosition;
  readonly path: string;
  readonly shape: ShapeName;
  readonly expect: ShapeExpect;
}

const SHAPE_ROWS: readonly ShapeCell[] = SHAPE_POSITIONS.flatMap((pos) =>
  pos.paths.flatMap((path) => SHAPES_BY_KIND[pos.kind].map((s) => ({ pos, path, shape: s.shape, expect: s.expect }))),
);

/**
 * The cell count. 2026-10-24, plan 37-31: 185 = trace-render 71 (notes 2x4, listing 2x5, task 2x5, directories
 * 7x4, planned paths 2x5, the extra trace file 1x5) + state-check 82 (the same 28 shared cells, directories 7x4,
 * the index and a trace file 2x5, the extra trace file 1x5, the marker 1x5, siblings 2x3) + state-roll 32
 * (directories 3x4, files 4x5).
 * 2026-10-24, plan 37-38 (D-19, D-20): 235 = trace-render 93 (notes 2x6, listing 2x5, task 2x7, root chain 7x6,
 * planned paths 2x5, the extra trace file 1x5) + state-check 104 (the same 36 shared cells, root chain 7x6, the index
 * and a trace file 2x5, the extra trace file 1x5, the marker 1x5, siblings 2x3) + state-roll 38 (root chain 3x6,
 * files 4x5). The two outside link shapes joined the root-chain, notes and task kinds; the root-chain positions are
 * derived (CHAIN_POSITION_COUNTS).
 */
const SHAPE_ROW_COUNT = 235;

/** `<runnable> <via> <path>: <shape>`, one cell's identity. */
function cellId(c: ShapeCell): string {
  return `${c.pos.runnable} ${c.pos.via} ${c.path}: ${c.shape}`;
}

/** The repository-relative path a cell plants at: an entry inside a context root for a listing, else the path. */
function plantedRel(c: ShapeCell): string {
  if (c.pos.kind !== "listing") return c.path;
  return `${c.path}/${c.shape === "keeper .DS_Store" ? ".DS_Store" : ".gitkeep"}`;
}

/**
 * The rendered two-root repository the trace cells start from: the D-14 marker, a board, a ticket, an NFR file
 * with its index line, a sealed note in each context root, and the trace rendered from them; no link and no extra
 * file, so the unplanted --check is fresh and state-check prints no finding. With `extra`, the trace directory gains
 * ABC-099.md, a copy of the generated ABC-001.md that no note names.
 */
function shapeTraceRepo(extra: boolean): string {
  const root = mkTmp("grugops-read-shapes-trace-");
  plant(root, LAYOUT_MARKER_REL, `${LAYOUT_MARKER_CONTENT}\n`);
  plant(root, BOARD_REL, "# Board\n\n## Ready (WIP unlimited)\n\n- [ABC-001] a ready ticket\n\n## Done (WIP unlimited)\n\n- [ABC-002] a done ticket\n");
  plant(root, `${TICKETS_REL}/ABC-001.md`, "# ABC-001\n");
  plant(root, NFR_CATALOG_REL, `# NFR catalog\n\n${NFR_LINE_001}`);
  plant(root, `${NFR_DIR_REL}/NFR-001.md`, "# NFR-001\n");
  plant(root, `${TASK_A_REL}/notes/n1.md`, noteText("n1", ["ABC-001", "NFR-001", "src/a.ts"]));
  plant(root, `${TASK_B_REL}/notes/n2.md`, noteText("n2", ["ABC-002", "#41"]));
  mkdirSync(join(root, ...TRACE_DIR_REL.split("/")), { recursive: true });
  renderOk(root);
  if (extra) copyFileSync(join(root, ...ABC_001_TRACE.split("/")), join(root, ...ABC_099_TRACE.split("/")));
  return root;
}

/**
 * state-roll's repository for the shape cells: stateRollRepo with an archive directory, so both rolls are planned.
 * With `archived`, one roll has run, so the Done archive and the progress archive exist for a cell to replace.
 */
function shapeRollRepo(archived: boolean): string {
  const root = stateRollRepo(true);
  if (archived) {
    const r = runIn(HOST["state-roll"], root, []);
    expect(r.status, `PREMISE: the first roll runs\n${r.stdout}\n${r.stderr}`).toBe(0);
    for (const rel of [BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL]) {
      expect(lstatSync(join(root, ...rel.split("/"))).isFile(), `PREMISE: the first roll wrote ${rel}`).toBe(true);
    }
  }
  return root;
}

/** Run the runnable copy at `js` unfaulted from its own directory. */
function runIn(js: string, root: string, args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [js, root, ...args], { encoding: "utf8", cwd: dirname(js), timeout: 30_000 });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** A fresh directory holding byte copies of the three committed runnables; returns the state-check copy. */
function freshHost(): string {
  const dir = mkTmp("grugops-read-shapes-host-");
  for (const n of RUNNABLES) copyFileSync(committed(n), join(dir, `${n}.js`));
  return join(dir, "state-check.js");
}

/** A cell's fixture: the repository root and the runnable copy to run. */
function shapeFixture(c: ShapeCell): { readonly root: string; readonly js: string } {
  const base = c.pos.base;
  if (base === "roll" || base === "roll-archived") return { root: shapeRollRepo(base === "roll-archived"), js: HOST["state-roll"] };
  const root = shapeTraceRepo(base === "trace-extra");
  return { root, js: base === "host" ? freshHost() : HOST[c.pos.runnable] };
}

/**
 * What a follow or keeper cell compares: the bytes of every path the runnable writes, read through any link. Only
 * a regular file is read (statSync first), so a FIFO is never opened (DC-3); a path that is not one is `null`.
 */
function writtenBytes(root: string, runnable: Runnable): ReadonlyMap<string, string | null> {
  const out = new Map<string, string | null>();
  const read = (rel: string): void => {
    const p = join(root, ...rel.split("/"));
    let isFile = false;
    try {
      isFile = statSync(p).isFile();
    } catch {
      isFile = false;
    }
    out.set(rel, isFile ? readFileSync(p, "utf8") : null);
  };
  if (runnable === "state-roll") {
    for (const rel of [BOARD_REL, PROGRESS_REL, BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL]) read(rel);
    return out;
  }
  read(TRACEABILITY_REL);
  for (const name of readdirSync(join(root, ...TRACE_DIR_REL.split("/"))).sort()) read(`${TRACE_DIR_REL}/${name}`);
  return out;
}

/**
 * Move whatever is at `at` out of every read position (into `<root>/shape-aside/`, which no runnable reads), and
 * return it as the moved path, or null when nothing was there.
 */
function moveAside(root: string, at: string, rel: string): string | null {
  try {
    lstatSync(at);
  } catch {
    return null;
  }
  const aside = join(root, "shape-aside");
  mkdirSync(aside, { recursive: true });
  const to = join(aside, rel.split("/").join("__"));
  renameSync(at, to);
  return to;
}

/**
 * Plant the cell's shape at its path under `root` (or in the runnable's directory for a `host` cell). Returns null
 * when it was planted, or the printed platform reason it could not be.
 */
function plantShape(c: ShapeCell, root: string, js: string): string | null {
  const rel = plantedRel(c);
  const at = c.pos.base === "host" ? join(dirname(js), rel) : join(root, ...rel.split("/"));
  const position = `scripts/runnable-ref/read-sites.test.ts: ${cellId(c)} (plan 37-31)`;
  const pinnedBy = "the dangling-link and CR-04 rows of trace-render.test.ts, state-check.test.ts and state-roll.test.ts";
  const targets = join(root, "shape-targets");
  mkdirSync(targets, { recursive: true });
  const flat = rel.split("/").join("__");
  const link = (target: string, shape: string): string | null => {
    const skipped = stageSymlinkOrSkip(target, at, shape, position);
    return skipped === null ? null : skipLine(skipped, pinnedBy);
  };
  const fifo = (): string | null => {
    const skipped = stageShapeOrSkip("FIFO", at, position);
    return skipped === null ? null : skipLine(skipped, pinnedBy);
  };
  switch (c.shape) {
    case "keeper .gitkeep":
    case "keeper .DS_Store":
      writeFileSync(at, "");
      return null;
    case ".gitkeep as a link to a regular file": {
      const target = join(targets, `${flat}.txt`);
      writeFileSync(target, "");
      return link(target, "symlink to a regular file");
    }
    case ".gitkeep as a dangling link":
      return link(join(root, "shape-no-such-target"), "dangling symlink (its target does not exist)");
    case ".gitkeep as a FIFO":
      return fifo();
    case "dangling link":
      moveAside(root, at, rel);
      return link(join(root, "shape-no-such-target"), "dangling symlink (its target does not exist)");
    case "link to a directory": {
      // At a directory position the original moves to the target, so the link holds the same content; at a file
      // position the target is an empty directory.
      const target = join(targets, flat);
      const moved = moveAside(root, at, rel);
      if (moved !== null && lstatSync(moved).isDirectory()) renameSync(moved, target);
      else mkdirSync(target);
      return link(target, "symlink to a directory inside the repository root");
    }
    case "link to an empty directory outside the root":
      // Plan 37-38 (D-20): the original moves aside, and the link leaves the root for an empty sibling directory.
      moveAside(root, at, rel);
      return link(mkTmp("grugops-read-shapes-outside-empty-"), "symlink to a directory outside the repository root");
    case "link to an outside directory holding the child": {
      // Plan 37-38 (D-20, the CR-05 shape): the original moves into a fresh sibling mkdtempSync directory (a rename
      // onto the empty directory), which is the target, so the link outside the root holds the position's children.
      const outside = mkTmp("grugops-read-shapes-outside-child-");
      const moved = moveAside(root, at, rel);
      expect(moved !== null && lstatSync(moved).isDirectory(), `PREMISE: ${rel} is a directory in the base fixture`).toBe(true);
      renameSync(moved as string, outside);
      return link(outside, "symlink to a directory outside the repository root");
    }
    case "link to a regular file": {
      // At a file position the original moves to the target, so the link holds the same bytes; at a directory
      // position the target is a regular file.
      const target = join(targets, `${flat}.target`);
      const moved = moveAside(root, at, rel);
      if (moved !== null && lstatSync(moved).isFile()) renameSync(moved, target);
      else writeFileSync(target, "a regular file\n");
      return link(target, "symlink to a regular file");
    }
    case "regular file":
      moveAside(root, at, rel);
      writeFileSync(at, "a regular file where a directory is expected\n");
      return null;
    case "directory":
      moveAside(root, at, rel);
      mkdirSync(at);
      return null;
    case "FIFO":
      moveAside(root, at, rel);
      return fifo();
  }
}

/** One unplanted run per (base, runnable, mode): the outcome a follow or keeper cell must equal. */
const shapeBaselines = new Map<string, { status: number | null; stdout: string; bytes: ReadonlyMap<string, string | null> }>();
function shapeBaseline(c: ShapeCell, mode: Mode): { status: number | null; stdout: string; bytes: ReadonlyMap<string, string | null> } {
  const id = `${c.pos.base} ${c.pos.runnable} ${mode}`;
  const cached = shapeBaselines.get(id);
  if (cached !== undefined) return cached;
  const { root, js } = shapeFixture(c);
  // A mode's baseline follows the modes before it on the same tree, as a cell runs them.
  for (const m of c.pos.modes) {
    const r = runIn(js, root, MODE_ARGS[m]);
    shapeBaselines.set(`${c.pos.base} ${c.pos.runnable} ${m}`, { status: r.status, stdout: r.stdout, bytes: writtenBytes(root, c.pos.runnable) });
  }
  return shapeBaselines.get(id) as { status: number | null; stdout: string; bytes: ReadonlyMap<string, string | null> };
}

/** The state-check finding lines of a run, and whether one is the expected kind naming `named`. */
function namedFinding(stdout: string, code: string, named: string): boolean {
  return stdout.split("\n").some((l) => /^FINDING /.test(l) && l.includes(code) && l.includes(named));
}

/** The shapes that are a dangling link at the position, or at the dot-named entry a listing cell plants. */
const DANGLING_SHAPES: ReadonlySet<ShapeName> = new Set<ShapeName>(["dangling link", ".gitkeep as a dangling link"]);

/** The owner's reason for a link whose target cannot be reached, at the path or at an ancestor (plans 37-28, 37-29). */
const OWNER_UNREACHABLE_LINK = /symbolic link .*target (that )?cannot be reached/;

/** The shapes that are a symbolic link at the position: at a root-chain position each is refused from its lstat. */
const LINK_SHAPES: ReadonlySet<ShapeName> = new Set<ShapeName>([
  "dangling link",
  "link to a directory",
  "link to an empty directory outside the root",
  "link to an outside directory holding the child",
  "link to a regular file",
]);

/** The root-chain owner's reason for a link on the chain (plan 37-33, D-20), from the committed context-io.js. */
const ROOT_CHAIN_LINK_REFUSAL: string = ctxio.ROOT_CHAIN_LINK_REFUSAL;

/**
 * The positions where a refused state-check cell stops at the layout marker (plan 37-38, D-20): rootChainOf of the
 * marker's directory, because the marker is read first and asks the root-chain owner (plan 37-35). Asserted equal to
 * `memory-bank` and `memory-bank/plans`. Plan 37-35 named it MARKER_CHAIN (the marker's chain less the marker).
 */
const STATE_CHECK_MARKER_POSITIONS: readonly string[] = ctxio.rootChainOf(posix.dirname(LAYOUT_MARKER_REL));

/** The kinds whose refused state-check cells have one derived outcome (plan 37-38): the marker's, or trace-not-compared. */
const ONE_OUTCOME_KINDS: ReadonlySet<ShapeKind> = new Set<ShapeKind>(["root-chain", "directory-follow", "directory-refuse"]);

let shapeCellsRun = 0;
let shapeCellsSkipped = 0;

/**
 * Run one cell in every mode its position lists, on one planted tree, and assert its kind's outcome. A refused
 * cell's runs never write, so the modes share the tree; a follow or keeper cell's runs equal the unplanted runs.
 */
function runShapeCell(c: ShapeCell): void {
  const { root, js } = shapeFixture(c);
  const writtenBefore = writtenBytes(root, c.pos.runnable);
  const skip = plantShape(c, root, js);
  if (skip !== null) {
    shapeCellsSkipped += 1;
    console.warn(skip);
    return;
  }
  // IN-12 (plan 37-38): a cell counts as run only once its shape was planted; until then it was counted before the
  // platform-skip test, so "every cell ran" held even if every link and FIFO cell had been skipped.
  shapeCellsRun += 1;
  const planted = treeDigest(root);
  const named = c.pos.base === "host" ? c.path : plantedRel(c);
  for (const mode of c.pos.modes) {
    const r = runIn(js, root, MODE_ARGS[mode]);
    const all = `${cellId(c)}, ${mode}\nstatus ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
    expect(hasNodeStack(r.stderr), `no Node stack trace\n${all}`).toBe(false);
    expect(r.stderr, `never the unexpected-throw backstop\n${all}`).not.toContain("stopped unexpectedly (");
    if (c.expect === "refused") {
      expect(treeDigest(root), `nothing was written, changed or removed\n${all}`).toEqual(planted);
      // A link at a root-chain position is refused for the root-chain reason, whatever it points to (plan 37-33,
      // D-20). Plan 37-35 removed the marker-first allowance: state-check's marker read asks the root-chain owner, so a
      // link at memory-bank or memory-bank/plans stops at the marker with that reason too. Elsewhere a dangling link is refused for the owner's reason, never as something absent that a later check
      // then happens to refuse ("does not exist", "listed and is no longer there"): the reason is where the defect
      // shows.
      if (c.pos.kind === "root-chain" && LINK_SHAPES.has(c.shape)) {
        expect(`${r.stdout}\n${r.stderr}`, `a link on the root chain is refused for the root-chain reason\n${all}`).toContain(
          `${c.path} ${ROOT_CHAIN_LINK_REFUSAL}`,
        );
      } else if (DANGLING_SHAPES.has(c.shape)) {
        expect(`${r.stdout}\n${r.stderr}`, `a dangling link is refused for the owner's reason\n${all}`).toMatch(OWNER_UNREACHABLE_LINK);
      }
      if (c.pos.runnable === "state-check") {
        if (c.pos.kind === "program") {
          // A sibling program is not a trace position: the trace may be fresh beside the skew finding.
          expect(r.status, all).toBe(1);
          expect(namedFinding(r.stdout, "runnable-version-skew", named), `a runnable-version-skew finding names ${named}\n${all}`).toBe(true);
          continue;
        }
        expect(r.stdout, `a refused trace position is never fresh\n${all}`).not.toContain("The trace is fresh");
        if (ONE_OUTCOME_KINDS.has(c.pos.kind)) {
          // ONE OUTCOME PER POSITION (plan 37-38, D-20), derived, never an either-or: at a position on the layout
          // marker's directory chain the marker is read first, so the check stops there (exit 2 naming the marker and
          // the position); at every other root-chain, notes or task position the trace base carries the marker, and
          // the trace is not compared (exit 1, a finding naming the position).
          if (STATE_CHECK_MARKER_POSITIONS.includes(c.path)) {
            expect(r.status, `a refused cell on the marker's chain is exit 2 at the layout marker\n${all}`).toBe(2);
            expect(r.stdout, `exit 2 has an empty stdout\n${all}`).toBe("");
            expect(r.stderr, `exit 2 names the layout marker\n${all}`).toContain("layout marker");
            expect(r.stderr, `exit 2 names ${named}\n${all}`).toContain(named);
          } else if (c.pos.kind === "root-chain" && c.shape === "regular file" && CHAIN_ROOT_KINDS["state-check"].includes(c.path)) {
            // A regular file AT a root kind traceDirectory asks (a context root, the trace directory) is a present
            // entry that is not a directory: the owner answers `present`, and traceDirectory's leaf-type rule makes it
            // could-not-run (plan 37-33: "refused at the trace directory stays could-not-run"). Derived from
            // CHAIN_ROOT_KINDS and the shape, never an either-or: plan 37-38 Task 1 first derived exit 1 here, and the
            // committed runnable answered exit 2 at all three leaves (recorded in 37-38-SUMMARY.md).
            expect(r.status, `a regular file at a state-check root kind is exit 2, the leaf is not a directory\n${all}`).toBe(2);
            expect(r.stdout, `exit 2 has an empty stdout\n${all}`).toBe("");
            expect(r.stderr, `exit 2 names ${named} as not a directory\n${all}`).toContain(`${named} is present and is not a directory`);
          } else {
            expect(r.status, `a refused cell off the marker's chain is exit 1, trace-not-compared\n${all}`).toBe(1);
            expect(namedFinding(r.stdout, "trace-not-compared", named), `a trace-not-compared finding names ${named}\n${all}`).toBe(true);
          }
          continue;
        }
        // The file, listing and file-follow kinds keep plan 37-31's either-or: round 3 does not change their outcomes,
        // so exit 2 by name and exit 1 with a trace-not-compared finding are both accepted there.
        if (r.status === 2) {
          expect(r.stdout, `exit 2 has an empty stdout\n${all}`).toBe("");
          expect(r.stderr, `exit 2 names ${named}\n${all}`).toContain(named);
        } else {
          expect(r.status, `exit 1 with a trace-not-compared finding, or exit 2\n${all}`).toBe(1);
          expect(namedFinding(r.stdout, "trace-not-compared", named), `a trace-not-compared finding names ${named}\n${all}`).toBe(true);
        }
      } else {
        expect(r.status, all).toBe(2);
        expect(r.stdout, `exit 2 has an empty stdout\n${all}`).toBe("");
        expect(r.stderr, `exit 2 names ${named}\n${all}`).toContain(named);
        if (c.pos.runnable === "state-roll") expect(r.stderr, all).toContain("Nothing was rolled.");
      }
    } else {
      const base = shapeBaseline(c, mode);
      expect(r.status, `a ${c.expect} cell exits as the unplanted run\n${all}`).toBe(base.status);
      expect(r.stdout, `a ${c.expect} cell prints what the unplanted run prints\n${all}`).toBe(base.stdout);
      expect(writtenBytes(root, c.pos.runnable), `a ${c.expect} cell leaves the bytes the unplanted run leaves\n${all}`).toEqual(base.bytes);
      if (c.pos.runnable !== "state-roll") {
        expect(writtenBytes(root, c.pos.runnable), `the trace is byte-identical to the unlinked render\n${all}`).toEqual(writtenBefore);
      }
    }
  }
}

describe("READ-1 shapes (plan 37-31, D-18; plan 37-38, D-20): every read position, derived from the callers of entryPresence and rootChainPresence, refuses a non-error shape by name or reads through", () => {
  it(`tracer (plan 37-38, D-20): trace-render, a rendered two-root repository whose ${GRUGOPS_ARCHIVE_REL} is then a link to an empty directory outside the root: --check and write exit 2 naming ${CONTEXT_ARCHIVE_REL} with the root-chain reason, nothing written`, () => {
    const root = shapeTraceRepo(false);
    const at = join(root, ...GRUGOPS_ARCHIVE_REL.split("/"));
    moveAside(root, at, GRUGOPS_ARCHIVE_REL);
    const skipped = stageSymlinkOrSkip(
      mkTmp("grugops-read-shapes-tracer-outside-"),
      at,
      "symlink to a directory outside the repository root",
      "scripts/runnable-ref/read-sites.test.ts: the D-20 root-chain tracer (plan 37-38)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the CR-05 rows of trace-render.test.ts"));
      return;
    }
    const before = treeDigest(root);
    expect([...before.keys()], "PREMISE: the render wrote ABC-002.md, the archive root's ticket").toContain(`${TRACE_DIR_REL}/ABC-002.md`);
    for (const mode of TR_SHAPE_MODES) {
      const r = runIn(HOST["trace-render"], root, MODE_ARGS[mode]);
      const all = `${mode}\nstatus ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
      expect(r.status, all).toBe(2);
      expect(r.stdout, all).toBe("");
      expect(r.stderr, all).toContain(CONTEXT_ARCHIVE_REL);
      expect(r.stderr, all).toContain(`${GRUGOPS_ARCHIVE_REL} ${ROOT_CHAIN_LINK_REFUSAL}`);
      expect(r.stderr, all).not.toContain("stopped unexpectedly (");
      expect(hasNodeStack(r.stderr), all).toBe(false);
      expect(treeDigest(root), `nothing was written, changed or removed\n${all}`).toEqual(before);
    }
  });

  for (const name of RUNNABLES) {
    it(`${name}: the root-chain positions are derived from rootChainOf over its root kinds, counted, and equal SHAPE_POSITIONS' root-chain paths both ways`, () => {
      const derived = chainPositions(name);
      console.log(`CHAIN_POSITION_COUNTS ${name}: ${derived.length} (${derived.join(", ")})`);
      expect(derived.length).toBe(CHAIN_POSITION_COUNTS[name]);
      const claimed = new Set(SHAPE_POSITIONS.filter((p) => p.runnable === name && p.kind === "root-chain").flatMap((p) => p.paths));
      expect(derived.filter((p) => !claimed.has(p)), "derived chain positions SHAPE_POSITIONS leaves out").toEqual([]);
      expect([...claimed].filter((p) => !derived.includes(p)), "SHAPE_POSITIONS root-chain paths the chain does not derive").toEqual([]);
    });
  }

  it("STATE_CHECK_MARKER_POSITIONS is rootChainOf of the layout marker's directory: memory-bank and memory-bank/plans", () => {
    console.log(`STATE_CHECK_MARKER_POSITIONS: ${STATE_CHECK_MARKER_POSITIONS.join(", ")}`);
    expect(STATE_CHECK_MARKER_POSITIONS).toEqual(["memory-bank", "memory-bank/plans"]);
    expect(STATE_CHECK_MARKER_POSITIONS.every((p) => chainPositions("state-check").includes(p)), "each is a state-check chain position").toBe(true);
  });

  it("tracer: trace-render write mode, a rendered repository whose taskA notes directory is then a dangling link: exit 2 naming the task, nothing written", () => {
    const root = shapeTraceRepo(false);
    const notes = join(root, ...`${TASK_A_REL}/notes`.split("/"));
    moveAside(root, notes, `${TASK_A_REL}/notes`);
    const skipped = stageSymlinkOrSkip(
      join(root, "shape-no-such-target"),
      notes,
      "dangling symlink (its target does not exist)",
      "scripts/runnable-ref/read-sites.test.ts: the READ-1 shapes tracer (plan 37-31)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the CR-03 rows of trace-render.test.ts"));
      return;
    }
    const before = treeDigest(root);
    expect([...before.keys()], "PREMISE: the render wrote ABC-001.md").toContain(ABC_001_TRACE);
    const r = runIn(HOST["trace-render"], root, []);
    const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
    expect(r.status, all).toBe(2);
    expect(r.stdout, all).toBe("");
    expect(r.stderr, all).toContain(`UNREADABLE TASK ${TASK_A_REL}`);
    expect(r.stderr, all).not.toContain("stopped unexpectedly (");
    expect(treeDigest(root), "nothing was written, changed or removed").toEqual(before);
  });

  for (const name of RUNNABLES) {
    it(`${name}: the owner's calling call expressions are derived and their count is pinned`, () => {
      const callers = ownerCallers(name);
      console.log(`OWNER_CALLERS ${name}: ${callers.length} (${callers.join(", ")})`);
      expect(callers.length).toBe(OWNER_CALLER_PINS[name]);
    });

    it(`${name}: SHAPE_POSITIONS covers exactly the derived (runnable, via) set, both ways`, () => {
      const derived = new Set(ownerCallers(name));
      const claimed = new Set(SHAPE_POSITIONS.filter((p) => p.runnable === name).map((p) => p.via));
      expect([...derived].filter((v) => !claimed.has(v)), "derived callers SHAPE_POSITIONS leaves out").toEqual([]);
      expect([...claimed].filter((v) => !derived.has(v)), "SHAPE_POSITIONS vias no caller derives").toEqual([]);
      for (const p of SHAPE_POSITIONS.filter((q) => q.runnable === name)) {
        expect(p.paths.length, `${p.via} ${p.position} names its concrete paths`).toBeGreaterThan(0);
        for (const m of p.modes) expect(MODES[name], `${p.via} ${m}`).toContain(m);
      }
    });
  }

  it("the cell count is pinned and equals the count computed from the positions and the shapes of each kind", () => {
    const computed = SHAPE_POSITIONS.reduce((n, p) => n + p.paths.length * SHAPES_BY_KIND[p.kind].length, 0);
    console.log(`SHAPE_ROW_COUNT: ${SHAPE_ROWS.length} (computed ${computed}, pinned ${SHAPE_ROW_COUNT})`);
    expect(SHAPE_ROWS.length).toBe(computed);
    expect(SHAPE_ROWS.length).toBe(SHAPE_ROW_COUNT);
    expect(new Set(SHAPE_ROWS.map(cellId)).size, "no cell is listed twice").toBe(SHAPE_ROWS.length);
  });

  for (const c of SHAPE_ROWS) {
    it(`${cellId(c)} -> ${c.expect}, ${c.pos.modes.join(" and ")}`, () => {
      runShapeCell(c);
    });
  }

  it("every cell ran or was skipped for the platform, counted apart, and on darwin and linux none was skipped", () => {
    console.log(`SHAPE cells run: ${shapeCellsRun} of ${SHAPE_ROW_COUNT}; skipped for the platform: ${shapeCellsSkipped}`);
    expect(shapeCellsRun + shapeCellsSkipped, "every cell either ran or printed a platform reason").toBe(SHAPE_ROW_COUNT);
    if (process.platform === "darwin" || process.platform === "linux") {
      expect(shapeCellsSkipped, "a host that can stage links and FIFOs skips no cell (IN-12)").toBe(0);
    }
  });
});

// ── D-20 control: absence is still absence (plan 37-38, D-19, D-20) ─────────────────────────────────────────
//
// The root-chain owner refuses every link on the chain, so a table of refusals alone cannot tell it from an owner
// that refuses everything. These controls hold the other side: with no link anywhere on a runnable's chain and a root
// (or the archive directory) really absent, the program answers as for an absent root.

/** PREMISE of a control: no component of `name`'s chain is a link (each is a real directory or absent). */
function assertNoChainLink(root: string, name: Runnable): void {
  for (const rel of chainPositions(name)) {
    let isLink = false;
    try {
      isLink = lstatSync(join(root, ...rel.split("/"))).isSymbolicLink();
    } catch {
      isLink = false;
    }
    expect(isLink, `PREMISE: ${rel} on ${name}'s chain is not a symbolic link`).toBe(false);
  }
}

/** True when the repository-relative `rel` is absent under `root` (lstat ENOENT). */
function absentAt(root: string, rel: string): boolean {
  try {
    lstatSync(join(root, ...rel.split("/")));
    return false;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "ENOENT";
  }
}

describe("D-20 control: an absent root with no link on its chain is still an absent root (plan 37-38)", () => {
  it(`trace-render and state-check: ${CONTEXT_ARCHIVE_REL} really removed from a rendered repository: state-check reports ABC-002.md trace-stale, --check reports it EXTRA, and the write removes it (exit 0)`, () => {
    const root = shapeTraceRepo(false);
    rmSync(join(root, ...CONTEXT_ARCHIVE_REL.split("/")), { recursive: true });
    assertNoChainLink(root, "trace-render");
    assertNoChainLink(root, "state-check");
    expect(absentAt(root, CONTEXT_ARCHIVE_REL), `PREMISE: ${CONTEXT_ARCHIVE_REL} is absent`).toBe(true);
    expect(lstatSync(join(root, ...GRUGOPS_ARCHIVE_REL.split("/"))).isDirectory(), `PREMISE: ${GRUGOPS_ARCHIVE_REL} is a real directory`).toBe(true);
    expect(lstatSync(join(root, ...GRUGOPS_DIR_REL.split("/"))).isDirectory(), `PREMISE: ${GRUGOPS_DIR_REL} is a real directory`).toBe(true);
    const abc002 = `${TRACE_DIR_REL}/ABC-002.md`;
    expect(absentAt(root, abc002), `PREMISE: the render wrote ${abc002}`).toBe(false);

    const check = runIn(HOST["state-check"], root, []);
    const checkAll = `state-check\nstatus ${check.status}\nstdout:\n${check.stdout}\nstderr:\n${check.stderr}`;
    expect(check.status, checkAll).toBe(1);
    expect(namedFinding(check.stdout, "trace-stale", "ABC-002.md"), `a trace-stale finding names ABC-002.md\n${checkAll}`).toBe(true);
    expect(check.stdout, checkAll).not.toContain("trace-not-compared");

    const compare = runIn(HOST["trace-render"], root, ["--check"]);
    const compareAll = `--check\nstatus ${compare.status}\nstdout:\n${compare.stdout}\nstderr:\n${compare.stderr}`;
    expect(compare.status, compareAll).toBe(1);
    expect(compare.stdout, compareAll).toMatch(/^EXTRA .*ABC-002\.md/m);

    const write = runIn(HOST["trace-render"], root, []);
    const writeAll = `write\nstatus ${write.status}\nstdout:\n${write.stdout}\nstderr:\n${write.stderr}`;
    expect(write.status, writeAll).toBe(0);
    expect(absentAt(root, abc002), `the write removed ${abc002}\n${writeAll}`).toBe(true);
    expect(absentAt(root, ABC_001_TRACE), `the write kept ${ABC_001_TRACE}\n${writeAll}`).toBe(false);
  });

  it(`state-roll: a rollable repository with no ${ARCHIVE_REL} creates it and rolls (exit 0)`, () => {
    const root = stateRollRepo(false);
    assertNoChainLink(root, "state-roll");
    expect(absentAt(root, ARCHIVE_REL), `PREMISE: ${ARCHIVE_REL} is absent`).toBe(true);
    expect(lstatSync(join(root, ...STATE_ROOT_REL.split("/"))).isDirectory(), `PREMISE: ${STATE_ROOT_REL} is a real directory`).toBe(true);
    const r = runIn(HOST["state-roll"], root, []);
    const all = `state-roll write\nstatus ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
    expect(r.status, all).toBe(0);
    expect(lstatSync(join(root, ...ARCHIVE_REL.split("/"))).isDirectory(), `the roll created ${ARCHIVE_REL}\n${all}`).toBe(true);
    for (const rel of [BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL]) {
      expect(lstatSync(join(root, ...rel.split("/"))).isFile(), `the roll wrote ${rel}\n${all}`).toBe(true);
    }
  });
});

// ── IN-13: one boundary predicate across the three runnables (plan 37-38, D-19, D-20) ──────────────────────────
//
// "Is this real path inside the root" had four hand copies (37-REVIEW.md IN-13): the generated isWithin and an
// insideRoot in each runnable, two of which refused every path for a root of `/`. Plans 37-34 to 37-36 deleted the
// copies one runnable at a time, each with a census over its own file. This census holds the whole class at once:
// the hand-written part of every committed runnable (the .ts after the generated region's close line, as a syntax
// tree, so a comment is not a node) asks the one generated isWithin, at pinned positions, and nothing else.

/** The hand-written part of a committed runnable .ts (after EMBED_CLOSE), as a syntax tree. */
function handWrittenPart(name: Runnable): ts.SourceFile {
  const rel = `${name}.ts`;
  const lines = readFileSync(join(HERE, rel), "utf8").split("\n");
  const close = lines.indexOf(EMBED_CLOSE);
  expect(close, `PREMISE: ${rel} carries the region's close line`).toBeGreaterThan(0);
  return ts.createSourceFile(rel, lines.slice(close + 1).join("\n"), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
}

/** Every node of a subtree, in visit order. */
function nodesIn(n: ts.Node, out: ts.Node[] = []): ts.Node[] {
  out.push(n);
  ts.forEachChild(n, (c) => {
    nodesIn(c, out);
  });
  return out;
}

/** The name a call expression calls: the identifier, or the property of a member access; else null. */
function calleeName(c: ts.CallExpression): string | null {
  if (ts.isIdentifier(c.expression)) return c.expression.text;
  if (ts.isPropertyAccessExpression(c.expression)) return c.expression.name.text;
  return null;
}

/** The calls named `name` in `sf`, each as `<enclosing scope>:<argument texts joined by a comma>`, in source order. */
function callsNamed(sf: ts.SourceFile, name: string): string[] {
  return nodesIn(sf)
    .filter((n): n is ts.CallExpression => ts.isCallExpression(n) && calleeName(n) === name)
    .map((c) => `${enclosingName(c)}:${c.arguments.map((a) => a.getText(sf)).join(",")}`);
}

/**
 * The calls of the generated isWithin in each runnable's hand-written part, `<scope>:<arguments>`.
 * 2026-10-24, plan 37-38: trace-render 1 (relOfPath, plan 37-34), state-check 2 (readTraceText and
 * runnableSkewFindings, plan 37-35), state-roll 1 (the check after the roll creates the archive directory, at the top
 * level, plan 37-36).
 */
const ISWITHIN_CALLS: Record<Runnable, readonly string[]> = {
  "trace-render": ["relOfPath:path,root"],
  "state-check": ["readTraceText:path,root", "runnableSkewFindings:hereReal,root"],
  "state-roll": ["<top>:made,root"],
};

describe("IN-13: one boundary predicate across the three runnables (plan 37-38, D-19)", () => {
  for (const name of RUNNABLES) {
    it(`${name}: the hand-written part has no insideRoot identifier, no root-prefix startsWith, and calls isWithin only at the pinned positions`, () => {
      const sf = handWrittenPart(name);
      const nodes = nodesIn(sf);
      expect(
        nodes.filter((n) => ts.isIdentifier(n) && n.text === "insideRoot").map((n) => `line ${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`),
        `${name}.ts names insideRoot (a declaration or a call) after the generated region`,
      ).toEqual([]);
      const rootPrefix = nodes
        .filter((n): n is ts.CallExpression => ts.isCallExpression(n) && calleeName(n) === "startsWith" && ts.isPropertyAccessExpression(n.expression))
        .filter((c) =>
          [(c.expression as ts.PropertyAccessExpression).expression, ...c.arguments].some((part) =>
            nodesIn(part).some((n) => ts.isIdentifier(n) && n.text === "root"),
          ),
        )
        .map((c) => c.getText(sf));
      expect(rootPrefix, `${name}.ts decides a boundary with a root-prefix startsWith`).toEqual([]);
      const calls = callsNamed(sf, "isWithin");
      console.log(`ISWITHIN_CALLS ${name}: ${calls.length} (${calls.join("; ")})`);
      expect(calls).toEqual(ISWITHIN_CALLS[name]);
    });

    it(`${name}.js defines isWithin exactly once (the generated one)`, () => {
      const defs = nodesIn(parsedJs(name)).filter((n) => ts.isFunctionDeclaration(n) && n.name?.text === "isWithin");
      expect(defs).toHaveLength(1);
    });
  }

  it("the census reads the syntax tree: a comment naming insideRoot is not a node, and a root-prefix startsWith is caught in either place", () => {
    const sf = ts.createSourceFile(
      "synth.ts",
      [
        "// insideRoot(p) was the old boundary test",
        "const a = p.startsWith(root + sep);",
        "const b = `${root}/x`.startsWith(p);",
        'const c = arg.startsWith("--");',
        "isWithin(p, root);",
        "",
      ].join("\n"),
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.TS,
    );
    expect(nodesIn(sf).filter((n) => ts.isIdentifier(n) && n.text === "insideRoot")).toEqual([]);
    const caught = nodesIn(sf)
      .filter((n): n is ts.CallExpression => ts.isCallExpression(n) && calleeName(n) === "startsWith" && ts.isPropertyAccessExpression(n.expression))
      .filter((c) =>
        [(c.expression as ts.PropertyAccessExpression).expression, ...c.arguments].some((part) =>
          nodesIn(part).some((n) => ts.isIdentifier(n) && n.text === "root"),
        ),
      )
      .map((c) => c.getText(sf));
    expect(caught).toEqual(["p.startsWith(root + sep)", "`${root}/x`.startsWith(p)"]);
    expect(callsNamed(sf, "isWithin")).toEqual(["<top>:p,root"]);
  });
});

/**
 * The realpathSync calls in each runnable's hand-written part, `<scope>:<argument>` (plan 37-38, D-20). After the
 * generated region a realpath may resolve only the repository root (each runnable, once, before any state read),
 * state-check's own directory (the sibling stamp read, plan 37-24) and the archive directory state-roll has just
 * created; every other path is asked of the root-chain owner, which never follows a link on the chain.
 * 2026-10-24, plan 37-38: trace-render 1, state-check 2, state-roll 2.
 */
const REALPATH_CALLS: Record<Runnable, readonly string[]> = {
  "trace-render": ["<top>:rootArg"],
  "state-check": ["<top>:rootArg", "runnableSkewFindings:here"],
  "state-roll": ["<top>:rootArg", "<top>:archiveDirPath"],
};

describe("D-20: realpathSync after the generated region is called only at the pinned positions (plan 37-38)", () => {
  for (const name of RUNNABLES) {
    it(`${name}: realpathSync is called for the root${name === "trace-render" ? "" : name === "state-check" ? " and state-check's own directory" : " and the created archive directory"} only`, () => {
      const calls = callsNamed(handWrittenPart(name), "realpathSync");
      console.log(`REALPATH_CALLS ${name}: ${calls.length} (${calls.join("; ")})`);
      expect(calls).toEqual(REALPATH_CALLS[name]);
    });
  }
});

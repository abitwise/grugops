// board-read.ts — the ONE fs-touching seam of the board projector (plan 32-01, D-23).
//
// WHY THIS MODULE EXISTS AT ALL, GIVEN THAT `board-dashboard.ts` COULD HAVE READ THE DISK ITSELF.
//
// `scripts/board-model.ts` is pure by construction: its import closure contains no `node:fs`
// specifier at all. That claim is worth something only if it is an IMPORT EDGE a guard can walk,
// rather than a sentence in a docblock that a later edit quietly falsifies. Folding the reader into
// the CLI would leave the grammar module pure and the boundary unnamed. Naming the seam gives the
// DASH-06 import-graph guard (plan 32-06) a subject: the closure of `board-dashboard.js` reaches
// exactly this module for its filesystem access, and every `node:fs` symbol in that closure is
// read-only.
//
// WHAT THIS MODULE DELIBERATELY DOES NOT IMPORT, AND WHY.
//   * `./context-io.js` and `./claim.js`. Both export writers. Importing either would put a
//     write-capable symbol into the dashboard's import closure, which is the single thing DASH-06
//     exists to refuse. The queue reader this module will grow in plan 32-03 re-implements
//     `claim.ts`'s reader rather than importing it, carrying its tamper rules across by hand.
//   * Anything from `node:child_process`, `node:net`, `node:http`, `node:https` or
//     `node:worker_threads`. The dashboard opens no socket and spawns no process (DASH-08).
//
// PATHS (ASVS V12, T-32-03). `repoRoot` is the ONLY externally supplied path. It is resolved once,
// through `realpathSync`, and every target is then a FIXED LITERAL joined against that resolved
// root — never a path derived from any file's content. The rule is this repository's own, recorded
// at `scripts/claim.ts:38-44` ("The queue root is never derived from argv / env / a queue file's
// content as an absolute path") and at `scripts/kit-model.ts` ("Fixed literal subpaths — never
// argv/env/content-derived"). Every target is additionally asserted inside the resolved root before
// it is read, using the refusal shape of `scripts/js-import-closure.ts:74-98`: the walk refuses
// rather than returning short, because a short answer reads as a clean one.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — this is a trace surface).

import {
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { SCHEMA_VERSION, parseBoard } from "./board-model.js";
import { MAX_WALK_ENTRIES } from "./kit-model.js";
import type {
  BoardModel,
  FactoryConfigView,
  FactorySnapshot,
  SourceName,
  SourceState,
  StaleReason,
} from "./board-model.js";

// `SourceState` is DECLARED in the pure module and RE-EXPORTED here, rather than declared twice.
// `FactorySnapshot` embeds one state per source and belongs in `board-model.ts` because it is the
// published shape (D-19) and carries no I/O; declaring the union here as well would make the two
// modules mutually dependent at the type level, and declaring it in both is the set-literal drift
// class this repository has already paid for. It is published from here because this is the module
// that PRODUCES it.
export type { SourceState, SourceName, StaleReason } from "./board-model.js";

// ── RED STUB (plan 32-03 task 1) ─────────────────────────────────────────────────────────────────
// The SIGNATURES the failing cases in `scripts/board-read.test.ts` link against, with the behaviour
// they assert deliberately ABSENT: one unverified read, no retry, no carry-forward. The RED run
// records which assertions the absence produces; the implementation replaces this block.

export { STALE_REASONS } from "./board-model.js";
export const STALE_REASON_COUNT = 5;
export const READ_RETRY_BOUND = 3;

export type ReadSeam = { readonly betweenReadAndStat?: (absPath: string, attempt: number) => void };

export type FileRead =
  | { readonly ok: true; readonly text: string }
  | {
      readonly ok: false;
      readonly reason: StaleReason;
      readonly code: string;
      readonly message: string;
    };

export type SourceOutcome<T> =
  | { readonly kind: "value"; readonly value: T }
  | { readonly kind: "bounded"; readonly value: T }
  | { readonly kind: "absent" }
  | {
      readonly kind: "failed";
      readonly reason: StaleReason;
      readonly code: string;
      readonly message: string;
    };

export function readVerifyReread(
  absPath: string,
  _retries: number = READ_RETRY_BOUND,
  _seam: ReadSeam = {},
): FileRead {
  try {
    return { ok: true, text: readFileSync(absPath, "utf8") };
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    return {
      ok: false,
      reason: err.code === "ENOENT" ? "enoent" : "eacces",
      code: err.code ?? "unreadable",
      message: err.message,
    };
  }
}

export function settleSource<T>(
  source: SourceName,
  _path: string,
  outcome: SourceOutcome<T>,
  _previous: SourceState<T> | undefined,
  readAt: string,
): { state: SourceState<T>; error: ReadError | null } {
  void source;
  if (outcome.kind === "value" || outcome.kind === "bounded") {
    return { state: { source: "ok", value: outcome.value, readAt }, error: null };
  }
  return { state: { source: "unavailable", present: false }, error: null };
}


/** Thrown when the seam meets a root it cannot vouch for. Never swallowed into a short result. */
export class BoardReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoardReadError";
  }
}

// ── The joined sources (D-12) ────────────────────────────────────────────────────────────────────
//
// A CLOSED tuple, with its cardinality pinned two-sided in `scripts/board-tracer.test.ts`. A seventh
// joined source is a decision recorded in the phase context and in the contract, never a bumped
// constant: each source carries its own `readAt` and its own stale badge, so adding one changes what
// the header reports and what `--json` publishes.
export const SOURCE_NAMES = [
  "board",
  "tickets",
  "queue",
  "context",
  "traceability",
  "config",
] as const satisfies readonly SourceName[];

export const SOURCE_COUNT = 6;

/**
 * The fixed literal subpath of every source (ASVS V12).
 *
 * DECLARED AS DATA RATHER THAN SPELLED AT EACH CALL SITE, so the "every subpath is a literal" claim
 * is checkable by reading one object instead of auditing every `join`. Nothing here is ever
 * computed from a file's content, from argv beyond the root, or from an environment variable.
 */
export const FIXED_SUBPATHS = {
  board: "plans/board.md",
  tickets: "plans/tickets",
  queue: ".grugops/queue",
  context: ".grugops/context",
  traceability: "plans/traceability.md",
  config: "agent-factory/config/factory.config.json",
} as const satisfies Readonly<Record<SourceName, string>>;

/** A read that did not produce a value, reported rather than thrown. */
export type ReadError = {
  readonly source: SourceName;
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

/**
 * A disagreement between two sources, surfaced rather than resolved (D-10).
 *
 * PLAN 32-05 CLOSES THE `kind` SET. It lands there as a closed `as const` set with a two-sided count
 * test, together with the seven-kind golden fixture. The field list is fixed in `schemaVersion: 1`
 * from this commit, so closing the set later adds no field and moves no boundary.
 */
export type Conflict = {
  readonly kind: string;
  readonly ticketId?: string;
  readonly column?: string;
  readonly expected: string;
  readonly actual: string;
  readonly source: SourceName;
};

/**
 * The discriminated read result (D-11), following Phase 30 D-12.
 *
 * The top-level discriminant is the BOARD's state, degraded by the config's. A source that is
 * legitimately absent — `.grugops/` on a tree that never ran the queue — does NOT make the result
 * unavailable, because D-12's whole point is that one missing source cannot hide a fresh board.
 */
export type SnapshotResult = {
  readonly source: "ok" | "stale" | "unavailable";
  readonly snapshot: FactorySnapshot;
  readonly conflicts: readonly Conflict[];
  readonly readErrors: readonly ReadError[];
};

/** A directory listing that reports its own truncation rather than hiding it. */
export type BoundedListing = {
  readonly present: boolean;
  readonly names: readonly string[];
  readonly bounded: boolean;
};

// ── Root resolution (T-32-03) ────────────────────────────────────────────────────────────────────

/**
 * Resolve `repoRoot` ONCE, through `realpathSync`, and refuse by name if it is not a directory.
 *
 * Resolving once is what makes every later `relative(root, target)` comparison meaningful: two
 * resolutions of the same argument can disagree when a symlink in the path changes between them,
 * and a comparison against a root nobody pinned is a comparison against nothing.
 */
export function resolveRepoRoot(repoRoot: string): string {
  const absolute = resolve(repoRoot);
  let real: string;
  try {
    real = realpathSync(absolute);
  } catch (e) {
    throw new BoardReadError(
      `board-read: the repository root ${absolute} does not resolve (${(e as Error).message}). ` +
        `Refusing to report a snapshot for a tree that was never read.`,
    );
  }
  let isDirectory: boolean;
  try {
    isDirectory = statSync(real).isDirectory();
  } catch (e) {
    throw new BoardReadError(
      `board-read: the repository root ${real} could not be inspected (${(e as Error).message}).`,
    );
  }
  if (!isDirectory) {
    throw new BoardReadError(
      `board-read: the repository root ${real} is not a directory. Refusing to join board ` +
        `subpaths against a file.`,
    );
  }
  return real;
}

/**
 * Join a FIXED LITERAL subpath against the resolved root, asserting it stays inside.
 *
 * The assertion is the `js-import-closure.ts:74-82` shape. It is kept even though every caller in
 * this module passes a literal from `FIXED_SUBPATHS`: the guard costs one string comparison, and it
 * is what stops a future edit from threading a content-derived name through this one chokepoint.
 */
export function repoSubpath(root: string, relPath: string): string {
  const target = resolve(join(root, relPath));
  const rel = relative(root, target);
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`)) {
    throw new BoardReadError(
      `board-read: the subpath ${relPath} resolves to ${target}, which is outside the repository ` +
        `root ${root}. Refusing to read a path outside the tree.`,
    );
  }
  return target;
}

// ── Bounded directory listing (D-14, RESEARCH pitfall 5) ─────────────────────────────────────────

/**
 * List `dir`, dropping atomic-write temporaries, bounded by the tree's shared walk bound.
 *
 * THE `.tmp-` FILTER IS EXPLICIT, NOT INCIDENTAL. `atomicWrite` in `scripts/context-io.ts:896-926`
 * names its temporary `${finalPath}.tmp-${pid}-${now}-${uuid8}`, which does not end in `.md` — so an
 * extension filter happens to exclude it today and would stop doing so the moment the naming
 * changed. Filtering the marker is the rule that stays true.
 *
 * THE BOUND REPORTS RATHER THAN THROWS. `scripts/kit-model.ts` throws at `MAX_WALK_ENTRIES` because
 * a truncated scan set there passes every downstream guard. Here the consumer is a live screen, and
 * D-14 is explicit: a hung read is a stale badge, never a frozen screen. So the listing reports its
 * own truncation and the caller marks the source stale with reason `bounded`.
 */
export function listDirectoryBounded(dir: string): BoundedListing {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return { present: false, names: [], bounded: false };
  }
  const names = entries.filter((n) => !n.includes(".tmp-"));
  if (names.length > MAX_WALK_ENTRIES) {
    return { present: true, names: names.slice(0, MAX_WALK_ENTRIES), bounded: true };
  }
  return { present: true, names, bounded: false };
}

// ── The read ─────────────────────────────────────────────────────────────────────────────────────

/** The lean view a tree with no usable dial gets (CLAUDE.md C6: run lean when config is unusable). */
const LEAN_CONFIG_VIEW: FactoryConfigView = {
  mode: null,
  idPrefix: null,
  wipLimits: {},
};

/** The `unavailable` arm, built once. It carries no value, and that is the type's whole point. */
function absent(): SourceState<never> {
  return { source: "unavailable", present: false };
}

type BoardRead = {
  readonly state: SourceState<BoardModel>;
  readonly model: BoardModel | null;
  readonly error: ReadError | null;
};

/**
 * Read `plans/board.md`.
 *
 * A SINGLE GUARDED `readFileSync` IN THIS TASK. The stat-read-stat retry that detects a torn read,
 * and the last-good carry-forward that keeps the previous model when a read fails, land in plan
 * 32-03. Neither changes this function's signature, so wiring them moves no boundary.
 */
function readBoardSource(root: string, readAt: string): BoardRead {
  const path = repoSubpath(root, FIXED_SUBPATHS.board);
  if (!existsSync(path)) {
    // D-13: a board that was never written is ABSENT, not stale. Nothing is rendered for it, and
    // the top-level discriminant says `unavailable` so no caller reads zero columns as a clean board.
    return { state: absent(), model: null, error: null };
  }
  try {
    const model = parseBoard(readFileSync(path, "utf8"));
    return { state: { source: "ok", value: model, readAt }, model, error: null };
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    return {
      state: absent(),
      model: null,
      error: {
        source: "board",
        path,
        code: err.code ?? "unreadable",
        message: err.message,
      },
    };
  }
}

type ConfigRead = {
  readonly state: SourceState<FactoryConfigView>;
  readonly view: FactoryConfigView | null;
  readonly error: ReadError | null;
};

/**
 * Read `agent-factory/config/factory.config.json` (T-32-09).
 *
 * `JSON.parse` runs inside a `try` and this function NEVER throws. A malformed dial marks the config
 * source stale and the process continues: CLAUDE.md C6 requires the kit to run lean when config is
 * absent or unusable, and a projector that dies on a typo in a dial is a projector nobody can use to
 * find the typo.
 */
function readConfigSource(root: string, readAt: string): ConfigRead {
  const path = repoSubpath(root, FIXED_SUBPATHS.config);
  if (!existsSync(path)) {
    return { state: absent(), view: null, error: null };
  }
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const view = configView(raw);
    return { state: { source: "ok", value: view, readAt }, view, error: null };
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    return {
      // The value carried is the LEAN view, and it is marked stale so nothing reads it as the dial.
      state: {
        source: "stale",
        value: LEAN_CONFIG_VIEW,
        readAt,
        stale: { reason: "unreadable", since: readAt },
      },
      view: LEAN_CONFIG_VIEW,
      error: {
        source: "config",
        path,
        code: err.code ?? "unreadable",
        message: err.message,
      },
    };
  }
}

/** The three dial keys the snapshot cross-checks. Everything else in the dial is ignored here. */
function configView(raw: Record<string, unknown>): FactoryConfigView {
  const limits: Record<string, number> = {};
  const wip = raw["wip_limits"];
  if (wip !== null && typeof wip === "object") {
    for (const [k, v] of Object.entries(wip as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isInteger(v)) limits[k] = v;
    }
  }
  return {
    mode: typeof raw["mode"] === "string" ? (raw["mode"] as string) : null,
    idPrefix: typeof raw["id_prefix"] === "string" ? (raw["id_prefix"] as string) : null,
    wipLimits: limits,
  };
}

/**
 * Read the tree under `repoRoot` into one discriminated snapshot result.
 *
 * THIS TASK READS TWO SOURCES FOR REAL — the board and the config dial. `tickets`, `queue`,
 * `context` and `traceability` return the `unavailable` arm; PLAN 32-03 READS THEM. The arm they
 * return is the honest one for this tree today (`.grugops/` does not exist here and `plans/tickets/`
 * carries only a `.gitkeep`), and the four fields exist in `schemaVersion: 1` from this commit, so
 * filling them moves no boundary.
 *
 * `previous` is the last good result, and it is UNCONSUMED until plan 32-03 wires the carry-forward
 * that D-11 requires. The parameter is declared now so that wiring changes no caller. The leading
 * underscore is the marker that it is not yet read.
 */
export function readSnapshot(
  repoRoot: string,
  _previous?: SnapshotResult,
  _seam: ReadSeam = {},
): SnapshotResult {
  const root = resolveRepoRoot(repoRoot);
  const readAt = new Date().toISOString();

  const board = readBoardSource(root, readAt);
  const config = readConfigSource(root, readAt);

  const readErrors: ReadError[] = [];
  if (board.error !== null) readErrors.push(board.error);
  if (config.error !== null) readErrors.push(config.error);

  const snapshot: FactorySnapshot = {
    schemaVersion: SCHEMA_VERSION,
    repoRoot: root,
    generatedAt: readAt,
    board: board.model,
    config: config.view,
    sources: {
      board: board.state,
      config: config.state,
      // PLAN 32-03 READS THESE FOUR. See the docblock above.
      tickets: absent(),
      queue: absent(),
      context: absent(),
      traceability: absent(),
    },
  };

  return {
    source: overallSource(board.state.source, config.state.source),
    snapshot,
    // PLAN 32-05 DERIVES THE CONFLICTS. The board alone cannot disagree with anything yet.
    conflicts: [],
    readErrors,
  };
}

/**
 * The top-level discriminant.
 *
 * The BOARD decides it, because the board is the thing being projected. The config can only degrade
 * an otherwise clean read to `stale`, and an ABSENT config cannot degrade anything at all — a tree
 * with no dial runs lean, which is a supported state rather than a fault (D-13, CLAUDE.md C6).
 */
function overallSource(
  board: SourceState<unknown>["source"],
  config: SourceState<unknown>["source"],
): SnapshotResult["source"] {
  if (board === "unavailable") return "unavailable";
  if (board === "stale" || config === "stale") return "stale";
  return "ok";
}

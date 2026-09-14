// board-read.ts — the ONE fs-touching seam of the board projector (plans 32-01 and 32-03, D-23).
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
//     exists to refuse. So the queue reader below RE-IMPLEMENTS `claim.ts`'s reader half and the
//     context reader RE-IMPLEMENTS `currentState`'s supersede fold, each carrying its rules across
//     by hand with the origin cited at the function that carries them.
//   * `./canonical-frontmatter.js` IS imported, and that is the one exception with a reason: it is
//     a pure text function whose own closure reaches only `./frontmatter.js`, which imports nothing
//     at all. Re-implementing frontmatter admission here would make the board projector a second
//     frontmatter authority, which is the drift class this repository has already paid for.
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

import {
  joinSnapshot,
  parseBoard,
  parseTicketDocument,
  sourceValue,
  stripHtmlComments,
} from "./board-model.js";
import { MAX_WALK_ENTRIES } from "./kit-model.js";
import type {
  BoardModel,
  Conflict,
  ContextTaskState,
  FactoryConfigView,
  FactorySnapshot,
  QueueRow,
  SourceName,
  SourceState,
  StaleReason,
  TicketRecord,
  TraceRow,
} from "./board-model.js";

// `SourceState` is DECLARED in the pure module and RE-EXPORTED here, rather than declared twice.
// `FactorySnapshot` embeds one state per source and belongs in `board-model.ts` because it is the
// published shape (D-19) and carries no I/O; declaring the union here as well would make the two
// modules mutually dependent at the type level, and declaring it in both is the set-literal drift
// class this repository has already paid for. It is published from here because this is the module
// that PRODUCES it.
export type {
  Conflict,
  ConflictKind,
  ContextTaskState,
  QueueRow,
  SourceName,
  SourceState,
  StaleReason,
  TicketDocument,
  TicketRecord,
  TraceRow,
} from "./board-model.js";

// ── The conflict set (D-10) ──────────────────────────────────────────────────────────────────────
//
// DECLARED IN THE PURE MODULE AND RE-EXPORTED HERE, for the reason recorded above the `SourceState`
// re-export. `joinSnapshot` derives the conflicts and it lives beside the grammar it compares
// against; this module PRODUCES the six source states the join takes, so this is where the set and
// its cardinality are published to a consumer of the read seam.
// `PRESENCE_DEPENDENT_CONFLICT_KINDS` rides with them for the same reason (plan 32-09): the subset
// is a property of the conflict set, and the read seam is what produces the source state that gates
// it, so a consumer of this module can ask both questions without importing the pure module too.
export {
  CONFLICT_KINDS,
  CONFLICT_KIND_COUNT,
  PRESENCE_DEPENDENT_CONFLICT_KINDS,
} from "./board-model.js";

// ── The stale-reason set (D-11, D-12) ────────────────────────────────────────────────────────────
//
// RE-EXPORTED FROM THE PURE MODULE RATHER THAN DECLARED TWICE, for the reason recorded above the
// `SourceState` re-export: the type is `board-model.ts`'s because `FactorySnapshot` embeds it, and
// the set is the type's authority there. This module PRODUCES stale arms, so this is where the set
// is published and where its cardinality is pinned.
export { STALE_REASONS } from "./board-model.js";

// The two-sided pin. A sixth reason is a DECISION recorded in the phase context and in
// `agent-factory/contracts/board.md`, never a bumped constant: each reason is a distinct sentence
// the D-12 badge says to a human about why the value on screen is old, and a reason nobody wrote
// that sentence for renders as a badge nobody can act on.
export const STALE_REASON_COUNT = 5;

/**
 * How many times a disagreeing read is retried before the source is called `torn`.
 *
 * THREE IS A DECISION, NOT A TUNING KNOB. A torn read is a read that raced a writer, and a writer
 * that is still writing on the fourth attempt is not a race — it is a file being rewritten
 * continuously, which is a state the badge should SAY rather than a state to spin on. The bound also
 * caps the cost: six stats and three reads per unreadable source per re-read, on a loop that runs at
 * most every 250 ms.
 */
export const READ_RETRY_BOUND = 3;

/**
 * A NAMED TEST SEAM, in the idiom of `FORCE_ABSENT_ENV` in `scripts/check-platform-shapes.ts`.
 *
 * `betweenReadAndStat` fires after the bytes are read and before the second stat — the exact window
 * an editor's save lands in. It exists because a torn read cannot be produced RELIABLY by racing a
 * writer thread against a reader in a test: the race is real, and a test that only fails sometimes
 * is a test that proves nothing on the run where it passed. Production callers pass nothing and the
 * seam is empty, so the module runs exactly the program it ran before the seam existed.
 */
export type ReadSeam = { readonly betweenReadAndStat?: (absPath: string, attempt: number) => void };

/** Two arms. A read either produced bytes nobody wrote under, or it produced a named reason. */
export type FileRead =
  | { readonly ok: true; readonly text: string }
  | {
      readonly ok: false;
      readonly reason: StaleReason;
      readonly code: string;
      readonly message: string;
    };

/**
 * What gathering one source produced, BEFORE staleness is settled against the previous read.
 *
 * `absent` and `failed` are kept apart on purpose: D-13's whole point is that a path nobody has
 * written yet is a legitimate state and a path that cannot be read is a fault, and collapsing them
 * into one "no value" arm is what makes a fresh checkout show STALE forever.
 */
export type SourceOutcome<T> =
  | { readonly kind: "value"; readonly value: T }
  /** The walk hit `MAX_WALK_ENTRIES`; `value` is what was gathered before the bound. */
  | { readonly kind: "bounded"; readonly value: T }
  | { readonly kind: "absent" }
  | {
      readonly kind: "failed";
      readonly reason: StaleReason;
      readonly code: string;
      readonly message: string;
    };

/**
 * Read a file as stat, read, stat — and accept the bytes only when all three agree (D-11, DASH-05).
 *
 * WHY A PLAIN `readFileSync` IS NOT ENOUGH. `plans/board.md` is edited by agents and humans with
 * ordinary editors, and `scripts/context-io.ts:896-926` (cloned at `scripts/claim.ts:218-248`)
 * replaces a destination with unlink-then-rename on Windows. Both leave a window in which a reader
 * sees a file that is half of one version and half of another, or no file at all. A projector that
 * renders that window renders a board nobody wrote.
 *
 * BOTH HALVES OF THE AGREEMENT TEST ARE KEPT, AND THE REASON IS MEASURED. `mtimeMs` has
 * sub-millisecond resolution on APFS (RESEARCH §Read-verify-reread, probed this session), so there
 * it is a fine tear detector on its own. It is NOT portable: a filesystem with one-second `mtime`
 * granularity — older ext3, some network mounts — reports EQUAL mtimes across a same-second rewrite.
 * The size comparison is the portable half and is never dropped; the mtime comparison catches the
 * same-size rewrite the size comparison cannot see. Each covers the other's blind spot.
 *
 * ENOENT AND EACCES ARE ANSWERED ON THE FIRST STAT, NOT RETRIED. Neither is a race this function can
 * win by trying again, and retrying costs the live screen three stats per source per re-read. The
 * CALLER decides what an absent path means, because only the caller knows whether the path was there
 * at the previous read (D-13).
 */
export function readVerifyReread(
  absPath: string,
  retries: number = READ_RETRY_BOUND,
  seam: ReadSeam = {},
): FileRead {
  let last: FileRead = {
    ok: false,
    reason: "torn",
    code: "TORN",
    message:
      `board-read: ${absPath} changed under every one of ${retries} read attempts, so no read of ` +
      `it is trustworthy. The previous good value is kept and the source is marked stale.`,
  };

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const before = statSync(absPath);
      const text = readFileSync(absPath, "utf8");
      seam.betweenReadAndStat?.(absPath, attempt);
      const after = statSync(absPath);

      const sizeAgrees =
        before.size === after.size && after.size === Buffer.byteLength(text, "utf8");
      const mtimeAgrees = before.mtimeMs === after.mtimeMs;
      if (sizeAgrees && mtimeAgrees) return { ok: true, text };
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      const code = err.code ?? "";
      if (code === "ENOENT") {
        return { ok: false, reason: "enoent", code, message: err.message };
      }
      if (code === "EACCES" || code === "EPERM") {
        return { ok: false, reason: "eacces", code, message: err.message };
      }
      // Anything else — EISDIR, ELOOP, a decoding failure — is bytes this module cannot use. It is
      // reported under the reason that says exactly that, rather than retried.
      last = { ok: false, reason: "unreadable", code: code || "unreadable", message: err.message };
      return last;
    }
  }
  return last;
}

/**
 * Settle one source's outcome against its PREVIOUS state (D-11, D-12, D-13).
 *
 * THE PREVIOUS STATE IS A PARAMETER, NOT MODULE STATE. That is what makes every arm below drivable
 * from a unit test without a filesystem at all, and it is what stops two dashboards in one process
 * from sharing a carry-forward neither of them can see.
 *
 * THE ARMS:
 *   value    → `ok`, stamped with this pass's read time.
 *   bounded  → `stale` carrying what the walk gathered. There IS a value; it is just not all of it.
 *   absent   → `unavailable` when nothing was ever read (D-13: an absent `.grugops/` on a fresh
 *              checkout is a legitimate state and produces NO badge and NO error), and `stale` with
 *              reason `enoent` when a value WAS read before — the file went away under us.
 *   failed   → `stale` carrying the previous good value; `unavailable` when there is none, plus the
 *              `fallback` exception below.
 *
 * `readAt` ON A STALE ARM IS THE LAST GOOD READ, NOT NOW. D-12's badge reports the AGE of the last
 * good read, so stamping it with the current time would make a source that has been unreadable for
 * an hour report itself as read a moment ago. `stale.since` carries when the staleness started, and
 * a source that was ALREADY stale keeps its original `since` — it has been stale continuously, and
 * restamping it each re-read would reset the age every 250 ms.
 *
 * `fallback` IS FOR THE CONFIG DIAL AND NOTHING ELSE. CLAUDE.md C6 requires the kit to run lean when
 * the dial is absent or unusable, so the config source has a DEFINED value for "no usable dial" and
 * therefore never has nothing to show. No other source has one: a board nobody could read has no
 * defensible substitute, and inventing one is the empty-board output state D-11 forbids.
 */
export function settleSource<T>(
  source: SourceName,
  path: string,
  outcome: SourceOutcome<T>,
  previous: SourceState<T> | undefined,
  readAt: string,
  fallback?: T,
): { state: SourceState<T>; error: ReadError | null } {
  if (outcome.kind === "value") {
    return { state: { source: "ok", value: outcome.value, readAt }, error: null };
  }
  if (outcome.kind === "bounded") {
    return {
      state: {
        source: "stale",
        value: outcome.value,
        readAt,
        stale: { reason: "bounded", since: sinceOf(previous, readAt) },
      },
      error: null,
    };
  }

  const carried = carriedValue(previous);
  const reason: StaleReason = outcome.kind === "absent" ? "enoent" : outcome.reason;
  // An absent path is only an ERROR when it was there before; a path that was never there is D-13's
  // legitimate state and says nothing on stderr.
  const error: ReadError | null =
    outcome.kind === "absent"
      ? carried === null
        ? null
        : { source, path, code: "ENOENT", message: `${path} is gone since the previous read` }
      : { source, path, code: outcome.code, message: outcome.message };

  if (carried !== null) {
    return {
      state: {
        source: "stale",
        value: carried.value,
        readAt: carried.readAt,
        stale: { reason, since: sinceOf(previous, readAt) },
      },
      error,
    };
  }
  if (outcome.kind === "failed" && fallback !== undefined) {
    return {
      state: {
        source: "stale",
        value: fallback,
        readAt,
        stale: { reason, since: sinceOf(previous, readAt) },
      },
      error,
    };
  }
  // Nothing to carry and nothing to fall back on. The arm carries no value, which is the type's
  // whole point: "render an empty section because the read failed" stays unrepresentable. The
  // `readErrors` entry is the only place the difference from a legitimate absence survives.
  return { state: { source: "unavailable", present: false }, error };
}

/** The previous good value and the time it was read, or null when there is none. */
function carriedValue<T>(
  previous: SourceState<T> | undefined,
): { value: T; readAt: string } | null {
  if (previous === undefined || previous.source === "unavailable") return null;
  return { value: previous.value, readAt: previous.readAt };
}

/** A source that is already stale has been stale SINCE THEN, not since this re-read. */
function sinceOf<T>(previous: SourceState<T> | undefined, readAt: string): string {
  return previous !== undefined && previous.source === "stale" ? previous.stale.since : readAt;
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

/**
 * A directory listing that reports its own truncation rather than hiding it — and, since plan 32-09,
 * its own FAILURE rather than reporting a failure as an absence.
 *
 * THREE ARMS, THE SAME SHAPE `SourceOutcome` ABOVE ALREADY USES. The flat `{ present, names,
 * bounded }` record this type replaced could answer only "there is a listing" or "there is not",
 * which meant every `readdirSync` failure — a denied mode, a file where a directory was expected, an
 * exhausted descriptor table — had to be answered with the SAME value a directory nobody has created
 * yet produces. That is what CR-02 measured: an `EACCES` on `plans/tickets/` rendered a clean `[ok]`
 * header and seven positive assertions that ticket files which exist do not. A listing that cannot
 * distinguish "I looked and there was nothing" from "I could not look" is a listing that reports
 * success it did not have, so the distinction is in the TYPE and not in a convention.
 */
export type BoundedListing =
  | {
      readonly kind: "listed";
      readonly names: readonly string[];
      /** The walk hit `MAX_WALK_ENTRIES`; `names` is what was gathered before the bound. */
      readonly bounded: boolean;
    }
  /** `ENOENT`, and only `ENOENT`. D-13's legitimate state: no badge, no error. */
  | { readonly kind: "absent" }
  /** Any other errno. The caller settles it through `settleSource`, so it reaches the badge. */
  | {
      readonly kind: "failed";
      readonly reason: StaleReason;
      readonly code: string;
      readonly message: string;
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

/**
 * The task-name allowlist, PORTED VERBATIM from `scripts/claim.ts:38-44` (T-32-03, ASVS V12).
 *
 * The pattern, the `.`/`..` rejection and the empty rejection are that module's, carried across by
 * hand rather than imported — `claim.ts`'s final statement is a write, so importing one constant
 * from it would put five mutating symbols into the dashboard's closure (DASH-06, D-21).
 *
 * A task name is attacker-influenced content used as a path segment. Everything outside the
 * allowlist is skipped BEFORE any filesystem access, so a name nobody vouched for never reaches a
 * `join`.
 */
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;

export function isSafeTaskName(name: string): boolean {
  return name !== "" && name !== "." && name !== ".." && TASK_NAME_RE.test(name);
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
 *
 * THE ERRNO IS NEVER DISCARDED (plan 32-09, CR-02). `readdirSync` fails for reasons that are not one
 * reason, and the arm each one lands on is named here rather than left to a caller's convention:
 *
 *   ENOENT                  → `absent`. The directory was never created. D-13's legitimate state:
 *                             a fresh checkout with no `.grugops/` shows no badge and no error.
 *   EACCES, EPERM           → `failed` with reason `eacces`. The entries exist and this process
 *                             cannot have them — the contract's § Staleness names a permission error
 *                             as stale in the same sentence as a torn read.
 *   ENOTDIR, EMFILE, ELOOP  → `failed` with reason `unreadable`, carrying the errno as `code`. These
 *                             three are the measured cases: a file where a directory was expected, an
 *                             exhausted descriptor table, and a symlink cycle. The arm is not a
 *                             three-member allowlist — it is the DEFAULT, so an errno nobody has met
 *                             yet is still reported rather than silently believed.
 *   no `code` property      → `failed` with the literal `unreadable` as its code. There is no path
 *                             out of this function that reports a listing it did not get.
 */
export function listDirectoryBounded(dir: string): BoundedListing {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    const code = err.code ?? "";
    if (code === "ENOENT") return { kind: "absent" };
    const reason: StaleReason = code === "EACCES" || code === "EPERM" ? "eacces" : "unreadable";
    return { kind: "failed", reason, code: code || "unreadable", message: err.message };
  }
  const names = entries.filter((n) => !n.includes(".tmp-"));
  if (names.length > MAX_WALK_ENTRIES) {
    return { kind: "listed", names: names.slice(0, MAX_WALK_ENTRIES), bounded: true };
  }
  return { kind: "listed", names, bounded: false };
}

/**
 * The `failed` arm of a listing, as the `SourceOutcome` the caller settles — with the directory named.
 *
 * ONE SPELLING, because three callers route the same three arms and three hand-written copies of the
 * message construction is the drift class this repository has already paid for. The directory path is
 * prefixed here rather than invented at each site: the errno message `readdirSync` produces already
 * names the path, but a human reading stderr is told WHICH SOURCE'S directory failed and under which
 * errno, in the reader's own register.
 */
function listingFailure<T>(dir: string, listing: BoundedListing & { kind: "failed" }): SourceOutcome<T> {
  return {
    kind: "failed",
    reason: listing.reason,
    code: listing.code,
    message: `${dir} could not be listed (${listing.code}): ${listing.message}`,
  };
}

// ── The read ─────────────────────────────────────────────────────────────────────────────────────

/** The lean view a tree with no usable dial gets (CLAUDE.md C6: run lean when config is unusable). */
const LEAN_CONFIG_VIEW: FactoryConfigView = {
  mode: null,
  idPrefix: null,
  wipLimits: {},
};

/**
 * One settled source: the state the snapshot publishes, and every error the read produced.
 *
 * A LIST RATHER THAN ONE ERROR, because a directory source reads many files: one refused ticket and
 * one tampered claim record are two findings, and collapsing them to the first would hide the second
 * behind a badge that names neither.
 */
type Settled<T> = { readonly state: SourceState<T>; readonly errors: readonly ReadError[] };

/** Lift `settleSource`'s single-error result, optionally carrying per-entry errors beside it. */
function settledFrom<T>(
  settled: { state: SourceState<T>; error: ReadError | null },
  extra: readonly ReadError[] = [],
): Settled<T> {
  return {
    state: settled.state,
    errors: settled.error === null ? extra : [settled.error, ...extra],
  };
}

/**
 * Join ONE directory entry against its directory, refusing anything that is not a plain segment.
 *
 * `name` is the only content-derived path input this module has: it comes from a `readdirSync` of a
 * fixed-literal directory, and a directory entry is attacker-influenced whenever an agent can write
 * into the tree (T-32-03). `readdirSync` cannot return a separator, `.` or `..` today — the refusals
 * below are for the day the listing comes from somewhere else, which is the day they matter, and a
 * rule added after that day is a rule added after the traversal.
 */
function childPath(root: string, dir: string, name: string): string | null {
  if (name === "" || name === "." || name === ".." || name.includes("/") || name.includes("\\")) {
    return null;
  }
  const target = resolve(join(dir, name));
  const rel = relative(root, target);
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`)) return null;
  return target;
}

/**
 * Gather one FILE source: read it through `readVerifyReread`, then parse it.
 *
 * THE PARSE RUNS INSIDE THIS FUNCTION, NOT OUTSIDE IT, so a partial parse becomes the `unreadable`
 * reason rather than an exception the loop has to survive. D-11 names a partial parse as one of the
 * three things that must never render as an empty section, and it can only be named as a reason if
 * the thing that parses is also the thing that reports.
 */
function gatherFile<T>(
  path: string,
  seam: ReadSeam,
  parse: (text: string) => T,
): SourceOutcome<T> {
  const read = readVerifyReread(path, READ_RETRY_BOUND, seam);
  if (!read.ok) {
    return read.reason === "enoent"
      ? { kind: "absent" }
      : { kind: "failed", reason: read.reason, code: read.code, message: read.message };
  }
  try {
    return { kind: "value", value: parse(read.text) };
  } catch (e) {
    return {
      kind: "failed",
      reason: "unreadable",
      code: "PARSE",
      message: (e as Error).message,
    };
  }
}

/**
 * Read `plans/board.md` (D-11).
 *
 * A board that was never written is ABSENT, not stale: nothing is rendered for it and the top-level
 * discriminant says `unavailable`, so no caller reads zero columns as a clean board. A board that
 * WAS read and is now unreadable keeps its last good model under a badge — D-11's central rule.
 */
function readBoardSource(
  root: string,
  readAt: string,
  previous: SourceState<BoardModel> | undefined,
  seam: ReadSeam,
  idPrefix: string | null,
): Settled<BoardModel> {
  const path = repoSubpath(root, FIXED_SUBPATHS.board);
  // THE DIAL IS READ FIRST AND ITS VALUE IS PASSED IN. `id_prefix` is part of what a conforming
  // identifier means (D-02), and the pure module holds no dial, so the seam that reads the dial is
  // the one that hands the value over. A row whose prefix disagrees is reported as an unparsed line
  // — the contract's own answer — rather than as an eighth conflict kind (D-10 closes the set).
  const parse = (text: string): BoardModel => parseBoard(text, { idPrefix });
  return settledFrom(
    settleSource("board", path, gatherFile(path, seam, parse), previous, readAt),
  );
}

/**
 * Read `agent-factory/config/factory.config.json` (T-32-09).
 *
 * `JSON.parse` runs inside `gatherFile`'s `try` and this function NEVER throws. A malformed dial
 * marks the config source stale and the process continues: CLAUDE.md C6 requires the kit to run lean
 * when config is absent or unusable, and a projector that dies on a typo in a dial is a projector
 * nobody can use to find the typo.
 *
 * THE LEAN VIEW IS PASSED AS `settleSource`'s `fallback`, and this is the ONLY source that gets one.
 * C6 defines what the kit does with no usable dial, so "no usable dial" has a value to show. Nothing
 * else here does.
 */
function readConfigSource(
  root: string,
  readAt: string,
  previous: SourceState<FactoryConfigView> | undefined,
  seam: ReadSeam,
): Settled<FactoryConfigView> {
  const path = repoSubpath(root, FIXED_SUBPATHS.config);
  const outcome = gatherFile(path, seam, (text) =>
    configView(JSON.parse(text) as Record<string, unknown>),
  );
  return settledFrom(settleSource("config", path, outcome, previous, readAt, LEAN_CONFIG_VIEW));
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

// ── tickets (D-03, T-32-11) ──────────────────────────────────────────────────────────────────────

/**
 * Read every `*.md` under `plans/tickets/` through the ticket grammar in the pure module.
 *
 * THE OPEN QUESTION PLAN 32-03 RECORDED IS ANSWERED HERE, AND THE ANSWER IS A DOCUMENT CLASS RATHER
 * THAN A WIDENED SCHEMA. That plan routed tickets through `admit` and wrote down the consequence:
 * `CANONICAL_SCHEMA` is the KIT ADAPTER schema, so every real ticket was refused with `unknown-key`
 * and `board-vs-ticket` could never be derived. `scripts/board-model.ts`'s `parseTicketDocument`
 * admits the ticket key set the contract states, in the same refuse-by-name posture, and the
 * canonical frontmatter authority keeps the document class it was built for untouched. The three
 * alternatives and the reason each was refused are recorded above that function.
 *
 * A refused document is recorded in `readErrors` with its refusal CODE and is not joined. The
 * projector still does not become a second frontmatter grammar for the ADAPTER class — it reads a
 * different class of document, whose grammar lives in exactly one place.
 */
function readTicketsSource(
  root: string,
  readAt: string,
  previous: SourceState<readonly TicketRecord[]> | undefined,
  seam: ReadSeam,
): Settled<readonly TicketRecord[]> {
  const dir = repoSubpath(root, FIXED_SUBPATHS.tickets);
  const listing = listDirectoryBounded(dir);
  // THREE ARMS, NOT TWO (plan 32-09, CR-02). `absent` is D-13's legitimate state and settles exactly
  // as it did before. `failed` settles through the SAME `settleSource` arm every other read failure
  // uses, so a denied mode on this directory produces a stale badge over the last good ticket list —
  // or `unavailable` WITH a `readErrors` entry when there is no last good value — rather than the
  // silent "there are no tickets" that made `joinSnapshot` fabricate seven findings.
  if (listing.kind === "absent") {
    return settledFrom(settleSource("tickets", dir, { kind: "absent" }, previous, readAt));
  }
  if (listing.kind === "failed") {
    return settledFrom(
      settleSource("tickets", dir, listingFailure(dir, listing), previous, readAt),
    );
  }

  const records: TicketRecord[] = [];
  const errors: ReadError[] = [];
  // Sorted, so two runs over the same directory produce the same order whatever the filesystem's
  // listing order happens to be. A frame that reshuffles on every re-read is a frame nobody can read.
  for (const name of [...listing.names].sort()) {
    if (!name.endsWith(".md")) continue;
    const path = childPath(root, dir, name);
    if (path === null) continue;

    const read = readVerifyReread(path, READ_RETRY_BOUND, seam);
    if (!read.ok) {
      errors.push({ source: "tickets", path, code: read.code, message: read.message });
      continue;
    }
    const admission = parseTicketDocument(read.text);
    if (!admission.ok) {
      errors.push({ source: "tickets", path, code: admission.code, message: admission.reason });
      continue;
    }
    records.push({
      file: name,
      // THE FILE STEM IS THE FALLBACK IDENTITY, because the file name is the only identity a reader
      // can trust when the document does not state one — the same rule the validator applies.
      id: admission.value.id ?? name.slice(0, -".md".length),
      title: admission.value.title ?? "",
      column: admission.value.column,
      status: admission.value.status,
    });
  }

  const outcome: SourceOutcome<readonly TicketRecord[]> = listing.bounded
    ? { kind: "bounded", value: records }
    : { kind: "value", value: records };
  return settledFrom(settleSource("tickets", dir, outcome, previous, readAt), errors);
}

// ── queue (T-32-05, T-32-03) ─────────────────────────────────────────────────────────────────────

/**
 * The three queue stages, DECLARED LOCALLY rather than imported from `scripts/claim.ts:64`.
 *
 * Importing that one constant would drag the whole module — and its five mutating symbols — into the
 * dashboard's import closure, which is the single thing DASH-06 exists to refuse. The duplication is
 * deliberate and bounded: it is three strings describing an on-disk layout, and `CLAIMED_STAGE` below
 * is typed against this tuple so a typo is a compile error rather than a directory nobody reads.
 */
export const QUEUE_STAGES = ["pending", "claimed", "done"] as const;
const CLAIMED_STAGE: (typeof QUEUE_STAGES)[number] = "claimed";

/** A line that begins with the `at:` key, as `scripts/claim.ts:289` counts them. */
const AT_KEY_LINE = /^at:/gm;
const AT_VALUE = /^at:\s*(.+)$/m;
const BY_VALUE = /^by:\s*(.+)$/m;

/**
 * Read `.grugops/queue/claimed/{task}/claim.md` into the rows a human sees as "now running".
 *
 * RE-IMPLEMENTED, NOT IMPORTED, AND THE RULES ARE PORTED VERBATIM FROM `scripts/claim.ts:270-306`.
 * That function's final statement is `atomicWrite(...)` — it is a WRITER, and the dashboard holds no
 * mutating `node:fs` symbol (DASH-06, D-21). Its reader half carries a security rule that must not be
 * paraphrased on the way across, so it is carried exactly:
 *
 *   * the task-name allowlist (`isSafeTaskName`, ported from `scripts/claim.ts:38-44`),
 *   * the explicit `.` / `..` rejection,
 *   * the existence check on `claim.md`,
 *   * and the SINGLE-`at:` discipline: a claim record is written with EXACTLY ONE `at:` line, and
 *     more than one is a tampered record — the on-disk signature of a `by`-injection that smuggled a
 *     forged `at:`. A tampered record is NEVER emitted as a trusted row. There is deliberately no
 *     permissive multi-match parser here, because a forged second `at:` line is a queue-lock denial
 *     of service and trusting it would let a tampered claim masquerade as running work (T-32-05).
 *
 * WHAT THIS READER ADDS: it REPORTS the skip. `claim.ts` skips silently because its output is a
 * derived artifact; this module's output is a screen a human is watching for exactly this kind of
 * problem, so a skipped record is named in `readErrors` with the code `tampered`.
 *
 * The row order is `at` then `task`, which is the order `renderNowRunning` emits — so the dashboard
 * and `.grugops/queue/now-running.md` cannot disagree about which claim came first.
 */
function readQueueSource(
  root: string,
  readAt: string,
  previous: SourceState<readonly QueueRow[]> | undefined,
  seam: ReadSeam,
): Settled<readonly QueueRow[]> {
  const queueRoot = repoSubpath(root, FIXED_SUBPATHS.queue);
  if (!existsSync(queueRoot)) {
    return settledFrom(settleSource("queue", queueRoot, { kind: "absent" }, previous, readAt));
  }

  const claimedDir = repoSubpath(root, `${FIXED_SUBPATHS.queue}/${CLAIMED_STAGE}`);
  const listing = listDirectoryBounded(claimedDir);
  // BEHAVIOUR-PRESERVING ADAPTER, AND IT IS A SHIM RATHER THAN AN ANSWER. Plan 32-09 Task 1 changed
  // the listing's TYPE to carry its failures; this consumer still collapses every non-`listed` arm
  // into "nothing claimed", which is the CR-02 swallow one source over. It is spelled out here, in
  // the commit that changed the type, so the surviving defect is visible rather than hidden behind a
  // compiling call site. Task 2 of the same plan routes all three arms.
  const claimedNames = listing.kind === "listed" ? listing.names : [];
  const claimedBounded = listing.kind === "listed" && listing.bounded;
  const rows: QueueRow[] = [];
  const errors: ReadError[] = [];

  for (const task of claimedNames) {
    // Defensive: never read through an unsafe segment. Skipped BEFORE any filesystem access.
    if (!isSafeTaskName(task)) continue;
    const taskDir = childPath(root, claimedDir, task);
    if (taskDir === null) continue;
    const claimMd = join(taskDir, "claim.md");
    if (!existsSync(claimMd)) continue;

    const read = readVerifyReread(claimMd, READ_RETRY_BOUND, seam);
    if (!read.ok) {
      errors.push({ source: "queue", path: claimMd, code: read.code, message: read.message });
      continue;
    }

    const atLineCount = (read.text.match(AT_KEY_LINE) ?? []).length;
    if (atLineCount > 1) {
      errors.push({
        source: "queue",
        path: claimMd,
        code: "tampered",
        message:
          `${claimMd} carries ${atLineCount} \`at:\` lines and a claim record is written with ` +
          `exactly one. The record is skipped rather than trusted on either line: a forged second ` +
          `\`at:\` is a queue-lock denial of service (scripts/claim.ts:270-306).`,
      });
      continue;
    }
    const at = AT_VALUE.exec(read.text);
    if (at === null) continue; // no `at` field → cannot be placed on the timeline; skip
    const by = BY_VALUE.exec(read.text);
    rows.push({ task, by: by === null ? "" : (by[1] ?? "").trim(), at: (at[1] ?? "").trim() });
  }

  rows.sort((a, b) => (a.at !== b.at ? a.at.localeCompare(b.at) : a.task.localeCompare(b.task)));

  const outcome: SourceOutcome<readonly QueueRow[]> = claimedBounded
    ? { kind: "bounded", value: rows }
    : { kind: "value", value: rows };
  return settledFrom(settleSource("queue", queueRoot, outcome, previous, readAt), errors);
}

// ── context (D-17) ───────────────────────────────────────────────────────────────────────────────

/** The subset of a note's index line this reader needs. Everything else stays in the file. */
type IndexedNote = {
  readonly id: string;
  readonly kind: string;
  readonly at: string;
  readonly supersedes: string | null;
};

/**
 * Read `.grugops/context/` for TASK PRESENCE AND CURRENT STATE, and nothing else.
 *
 * IT READS THE INDEX, NEVER A NOTE BODY, AND THAT IS A DECISION WITH A PRICE ATTACHED. D-17 rejected
 * a recent-notes block in the terminal view for exactly this cost: pulling every task's notes on
 * every re-read turns a 250 ms refresh into a walk of the whole shared context. `index.jsonl` is the
 * deterministic, body-excluded event index `scripts/context-io.ts:4109` renders, so the join gets the
 * presence and the state it needs from one file per task.
 *
 * THE SUPERSEDE FOLD IS `currentState`'s RULE (`scripts/context-io.ts:1857`), carried across rather
 * than imported for the DASH-06 reason: `context-io.ts` exports the note writers. Sort by `at` with
 * an id tiebreak, then drop every note another note supersedes — never file position, never mtime.
 *
 * A TASK DIRECTORY WITH NO RENDERED INDEX IS NOT A FAULT. `index.jsonl` is a derived artifact whose
 * freshness `npm run freshness:context` owns; a task whose notes have not been re-rendered yet is
 * reported as present with zero notes rather than as a read error on a screen that cannot fix it.
 */
function readContextSource(
  root: string,
  readAt: string,
  previous: SourceState<readonly ContextTaskState[]> | undefined,
  seam: ReadSeam,
): Settled<readonly ContextTaskState[]> {
  const dir = repoSubpath(root, FIXED_SUBPATHS.context);
  const listing = listDirectoryBounded(dir);
  // The same behaviour-preserving shim recorded at `readQueueSource`: every non-`listed` arm settles
  // as `absent`, which is the CR-02 swallow, kept visible for exactly one commit. Task 2 routes it.
  if (listing.kind !== "listed") {
    return settledFrom(settleSource("context", dir, { kind: "absent" }, previous, readAt));
  }

  const tasks: ContextTaskState[] = [];
  const errors: ReadError[] = [];
  for (const name of [...listing.names].sort()) {
    if (!isSafeTaskName(name)) continue;
    const taskDir = childPath(root, dir, name);
    if (taskDir === null) continue;
    let isDirectory = false;
    try {
      isDirectory = statSync(taskDir).isDirectory();
    } catch {
      continue; // it went away between the listing and the stat; the next re-read will say so
    }
    if (!isDirectory) continue;

    const indexPath = join(taskDir, "index.jsonl");
    const read = readVerifyReread(indexPath, READ_RETRY_BOUND, seam);
    if (!read.ok) {
      if (read.reason !== "enoent") {
        errors.push({ source: "context", path: indexPath, code: read.code, message: read.message });
      }
      tasks.push({ task: name, noteCount: 0, liveCount: 0, latestAt: null, latestKind: null });
      continue;
    }

    const notes: IndexedNote[] = [];
    for (const line of read.text.split("\n")) {
      if (line.trim() === "") continue;
      try {
        const raw = JSON.parse(line) as Record<string, unknown>;
        notes.push({
          id: typeof raw["id"] === "string" ? raw["id"] : "",
          kind: typeof raw["kind"] === "string" ? raw["kind"] : "",
          at: typeof raw["at"] === "string" ? raw["at"] : "",
          supersedes: typeof raw["supersedes"] === "string" ? raw["supersedes"] : null,
        });
      } catch (e) {
        errors.push({
          source: "context",
          path: indexPath,
          code: "PARSE",
          message: `${indexPath} carries a line the event index cannot read: ${(e as Error).message}`,
        });
      }
    }

    const ordered = [...notes].sort((a, b) =>
      a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id),
    );
    const superseded = new Set(
      ordered.map((n) => n.supersedes).filter((x): x is string => x !== null && x !== ""),
    );
    const live = ordered.filter((n) => !superseded.has(n.id));
    const latest = live[live.length - 1];
    tasks.push({
      task: name,
      noteCount: notes.length,
      liveCount: live.length,
      latestAt: latest?.at ?? null,
      latestKind: latest?.kind ?? null,
    });
  }

  const outcome: SourceOutcome<readonly ContextTaskState[]> = listing.bounded
    ? { kind: "bounded", value: tasks }
    : { kind: "value", value: tasks };
  return settledFrom(settleSource("context", dir, outcome, previous, readAt), errors);
}

// ── traceability (D-03) ──────────────────────────────────────────────────────────────────────────

/** The first cell of the matrix's fixed header row. The columns are fixed by the contract. */
const TRACE_HEADER_CELL = "Ticket";

/** A separator row: every cell is dashes, optionally colon-anchored. */
const SEPARATOR_CELL = /^:?-{1,}:?$/;

/**
 * Split one pipe-delimited row into cells, honouring the `\|` escape the writers emit.
 *
 * `cell()` in `scripts/context-io.ts:884-888` and `scripts/claim.ts` escapes a backslash first and
 * then a pipe before a value enters a table, so a title containing a pipe arrives here as `\|`. A
 * naive `split("|")` would cut that title in half and shift every later column left by one — the
 * status column would then read whatever the tests column said.
 */
function splitPipeRow(line: string): readonly string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return null;
  const cells: string[] = [];
  let current = "";
  for (let i = 1; i < trimmed.length; i += 1) {
    const ch = trimmed[i] as string;
    if (ch === "\\" && i + 1 < trimmed.length) {
      current += trimmed[i + 1] as string;
      i += 1;
      continue;
    }
    if (ch === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim() !== "") cells.push(current.trim());
  return cells;
}

/**
 * Read `plans/traceability.md` through the SAME comment pre-pass the board is read through (D-03).
 *
 * THE FILE CARRIES ITS OWN EXAMPLE ROW INSIDE ITS OWN COMMENT, at `plans/traceability.md:15`. That is
 * the board's hazard one file over, and it gets the board's ANSWER — `stripHtmlComments` from
 * `./board-model.js` — rather than a second one. Two pre-passes would be two chances to disagree
 * about what a comment is, and the row a human filed would then depend on which reader looked.
 *
 * The table is located by its header rather than by a line number, because a line number is a
 * promise about a file anyone may edit.
 */
function parseTraceability(text: string): readonly TraceRow[] {
  const lines = stripHtmlComments(text).split("\n");
  const rows: TraceRow[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const header = splitPipeRow(lines[i] as string);
    if (header === null || header[0] !== TRACE_HEADER_CELL) continue;
    const separator = splitPipeRow(lines[i + 1] ?? "");
    if (separator === null || !separator.every((c) => SEPARATOR_CELL.test(c))) continue;

    for (let j = i + 2; j < lines.length; j += 1) {
      const cells = splitPipeRow(lines[j] as string);
      if (cells === null) break; // the table ended
      if (cells.every((c) => SEPARATOR_CELL.test(c))) continue;
      rows.push({
        ticket: cells[0] ?? "",
        title: cells[1] ?? "",
        status: cells[cells.length - 1] ?? "",
        cells,
      });
    }
    break; // one matrix per file; a second header is not a second matrix
  }
  return rows;
}

function readTraceabilitySource(
  root: string,
  readAt: string,
  previous: SourceState<readonly TraceRow[]> | undefined,
  seam: ReadSeam,
): Settled<readonly TraceRow[]> {
  const path = repoSubpath(root, FIXED_SUBPATHS.traceability);
  return settledFrom(
    settleSource("traceability", path, gatherFile(path, seam, parseTraceability), previous, readAt),
  );
}

/**
 * Read the tree under `repoRoot` into one discriminated snapshot result.
 *
 * `previous` IS THE LAST GOOD RESULT, AND IT IS A PARAMETER RATHER THAN MODULE STATE. That is what
 * makes D-11's carry-forward drivable from a unit test: each source's previous state is threaded to
 * its own `settleSource` call, so "the board went unreadable while the queue stayed fresh" is a
 * value a case can construct rather than a sequence a case has to provoke. It also means two
 * dashboards in one process cannot share a carry-forward neither of them can see.
 *
 * `seam` is the `ReadSeam` test hook. Production callers pass nothing.
 */
export function readSnapshot(
  repoRoot: string,
  previous?: SnapshotResult,
  seam: ReadSeam = {},
): SnapshotResult {
  const root = resolveRepoRoot(repoRoot);
  const readAt = new Date().toISOString();
  const before = previous?.snapshot.sources;

  // THE DIAL IS READ FIRST, and the order is load-bearing rather than cosmetic: `id_prefix` is part
  // of what a conforming row identifier means (D-02), so the board parse needs the dial's value.
  const config = readConfigSource(root, readAt, before?.config, seam);
  const board = readBoardSource(
    root,
    readAt,
    before?.board,
    seam,
    sourceValue(config.state)?.idPrefix ?? null,
  );
  const tickets = readTicketsSource(root, readAt, before?.tickets, seam);
  const queue = readQueueSource(root, readAt, before?.queue, seam);
  const context = readContextSource(root, readAt, before?.context, seam);
  const traceability = readTraceabilitySource(root, readAt, before?.traceability, seam);

  const sources = {
    board: board.state,
    tickets: tickets.state,
    queue: queue.state,
    context: context.state,
    traceability: traceability.state,
    config: config.state,
  };

  // THE JOIN IS THE PURE MODULE'S. This function reads; it does not compare. `joinSnapshot` takes
  // the six settled states and returns the published snapshot together with every conflict, which
  // is what makes the committed golden a byte-for-byte function of its committed inputs (D-19).
  const joined = joinSnapshot({ repoRoot: root, generatedAt: readAt, sources });

  // In SOURCE_NAMES order, so the stderr summary reads the same way twice and a consumer diffing two
  // runs sees a changed finding rather than a reshuffled list.
  const readErrors: ReadError[] = [
    ...board.errors,
    ...tickets.errors,
    ...queue.errors,
    ...context.errors,
    ...traceability.errors,
    ...config.errors,
  ];

  return {
    source: deriveOverallSource(sources, readErrors),
    snapshot: joined.snapshot,
    conflicts: joined.conflicts,
    readErrors,
  };
}

/**
 * The sources that are `unavailable` BECAUSE A READ FAILED, as opposed to because nothing is there.
 *
 * WHY THIS FUNCTION HAS TO EXIST (plan 32-09). `SourceState`'s `unavailable` arm carries no value by
 * design — D-13's whole point is that "render an empty section because the read failed" must be
 * unrepresentable. But that arm is also where a FAILED read with no previous good value lands, so at
 * the published shape a denied `plans/tickets/` on a FIRST read looks exactly like a `plans/tickets/`
 * nobody has created. Fixing that inside `SourceState` would mean a new arm, a `SCHEMA_VERSION` bump
 * and a regenerated golden. It does not need one: the difference already survives in `readErrors`,
 * which D-13 names as "the only place the difference from a legitimate absence survives". This
 * function is that sentence as code.
 *
 * DERIVED, NEVER HAND-LISTED. The walk is over `SOURCE_NAMES`, the pinned tuple, so a seventh source
 * cannot be badged by one consumer and forgotten by the other — the set-literal drift class this
 * repository has already paid for. Both consumers — the top-level discriminant below and the
 * header's badge in `scripts/board-dashboard.ts` — read THIS function, so the `--json` document and
 * the terminal cannot disagree about which sources were unreadable.
 */
export function unreadableSources(
  sources: Readonly<Record<SourceName, SourceState<unknown>>>,
  readErrors: readonly ReadError[],
): readonly { readonly name: SourceName; readonly code: string }[] {
  const out: { name: SourceName; code: string }[] = [];
  for (const name of SOURCE_NAMES) {
    if (sources[name].source !== "unavailable") continue;
    const error = readErrors.find((e) => e.source === name);
    // NO ERROR MEANS A LEGITIMATE ABSENCE, AND THAT IS THE WHOLE DISCRIMINATION (D-13). A tree with
    // no `.grugops/` produces an `unavailable` queue and NO entry here, so it is badged nowhere.
    if (error === undefined) continue;
    out.push({ name, code: error.code });
  }
  return out;
}

/**
 * The top-level discriminant, DERIVED IN ONE PLACE from the per-source states.
 *
 * The renderer (plan 32-07) reads this field rather than re-deriving it, because a second derivation
 * is a second answer: the header badge and the `--json` document would then be free to disagree
 * about whether the board a human is looking at is current.
 *
 * The BOARD decides `unavailable`, because the board is the thing being projected and a tree with no
 * board has nothing to project. Any other source can only degrade a clean read to `stale`, and an
 * ABSENT source degrades nothing at all — a tree with no `.grugops/` and no dial runs lean, which is
 * a supported state rather than a fault (D-13, CLAUDE.md C6).
 */
function deriveOverallSource(
  sources: Readonly<Record<SourceName, SourceState<unknown>>>,
  readErrors: readonly ReadError[],
): SnapshotResult["source"] {
  if (sources.board.source === "unavailable") return "unavailable";
  // SOURCE_NAMES rather than Object.keys: the tuple is the pinned set, so a source added to the
  // record and not to the tuple cannot slip past this loop unexamined.
  for (const name of SOURCE_NAMES) {
    if (sources[name].source === "stale") return "stale";
  }
  // A SOURCE THAT IS UNAVAILABLE BECAUSE IT COULD NOT BE READ DEGRADES THE DISCRIMINANT (plan 32-09).
  // An ABSENT one still degrades nothing — that is D-13 and it is unchanged. The difference is the
  // `readErrors` entry, which is exactly what `unreadableSources` reads. Without this arm, a denied
  // `plans/tickets/` on a first read printed `[ok]` beside a badge saying the opposite, which is the
  // confident-wrong-board output the phase goal rules out.
  if (unreadableSources(sources, readErrors).length > 0) return "stale";
  return "ok";
}

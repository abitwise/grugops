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
import { readFileSync, readdirSync, realpathSync, statSync, } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { SCHEMA_VERSION, parseBoard } from "./board-model.js";
import { MAX_WALK_ENTRIES } from "./kit-model.js";
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
export function readVerifyReread(absPath, retries = READ_RETRY_BOUND, seam = {}) {
    let last = {
        ok: false,
        reason: "torn",
        code: "TORN",
        message: `board-read: ${absPath} changed under every one of ${retries} read attempts, so no read of ` +
            `it is trustworthy. The previous good value is kept and the source is marked stale.`,
    };
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            const before = statSync(absPath);
            const text = readFileSync(absPath, "utf8");
            seam.betweenReadAndStat?.(absPath, attempt);
            const after = statSync(absPath);
            const sizeAgrees = before.size === after.size && after.size === Buffer.byteLength(text, "utf8");
            const mtimeAgrees = before.mtimeMs === after.mtimeMs;
            if (sizeAgrees && mtimeAgrees)
                return { ok: true, text };
        }
        catch (e) {
            const err = e;
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
export function settleSource(source, path, outcome, previous, readAt, fallback) {
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
    const reason = outcome.kind === "absent" ? "enoent" : outcome.reason;
    // An absent path is only an ERROR when it was there before; a path that was never there is D-13's
    // legitimate state and says nothing on stderr.
    const error = outcome.kind === "absent"
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
function carriedValue(previous) {
    if (previous === undefined || previous.source === "unavailable")
        return null;
    return { value: previous.value, readAt: previous.readAt };
}
/** A source that is already stale has been stale SINCE THEN, not since this re-read. */
function sinceOf(previous, readAt) {
    return previous !== undefined && previous.source === "stale" ? previous.stale.since : readAt;
}
/** Thrown when the seam meets a root it cannot vouch for. Never swallowed into a short result. */
export class BoardReadError extends Error {
    constructor(message) {
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
];
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
};
// ── Root resolution (T-32-03) ────────────────────────────────────────────────────────────────────
/**
 * Resolve `repoRoot` ONCE, through `realpathSync`, and refuse by name if it is not a directory.
 *
 * Resolving once is what makes every later `relative(root, target)` comparison meaningful: two
 * resolutions of the same argument can disagree when a symlink in the path changes between them,
 * and a comparison against a root nobody pinned is a comparison against nothing.
 */
export function resolveRepoRoot(repoRoot) {
    const absolute = resolve(repoRoot);
    let real;
    try {
        real = realpathSync(absolute);
    }
    catch (e) {
        throw new BoardReadError(`board-read: the repository root ${absolute} does not resolve (${e.message}). ` +
            `Refusing to report a snapshot for a tree that was never read.`);
    }
    let isDirectory;
    try {
        isDirectory = statSync(real).isDirectory();
    }
    catch (e) {
        throw new BoardReadError(`board-read: the repository root ${real} could not be inspected (${e.message}).`);
    }
    if (!isDirectory) {
        throw new BoardReadError(`board-read: the repository root ${real} is not a directory. Refusing to join board ` +
            `subpaths against a file.`);
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
export function repoSubpath(root, relPath) {
    const target = resolve(join(root, relPath));
    const rel = relative(root, target);
    if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`)) {
        throw new BoardReadError(`board-read: the subpath ${relPath} resolves to ${target}, which is outside the repository ` +
            `root ${root}. Refusing to read a path outside the tree.`);
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
export function isSafeTaskName(name) {
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
 */
export function listDirectoryBounded(dir) {
    let entries;
    try {
        entries = readdirSync(dir);
    }
    catch {
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
const LEAN_CONFIG_VIEW = {
    mode: null,
    idPrefix: null,
    wipLimits: {},
};
/** The `unavailable` arm, built once. It carries no value, and that is the type's whole point. */
function absent() {
    return { source: "unavailable", present: false };
}
/** The value a settled state carries, or null on the `unavailable` arm. Used for the flat fields. */
function valueOrNull(state) {
    return state.source === "unavailable" ? null : state.value;
}
/**
 * Gather one FILE source: read it through `readVerifyReread`, then parse it.
 *
 * THE PARSE RUNS INSIDE THIS FUNCTION, NOT OUTSIDE IT, so a partial parse becomes the `unreadable`
 * reason rather than an exception the loop has to survive. D-11 names a partial parse as one of the
 * three things that must never render as an empty section, and it can only be named as a reason if
 * the thing that parses is also the thing that reports.
 */
function gatherFile(path, seam, parse) {
    const read = readVerifyReread(path, READ_RETRY_BOUND, seam);
    if (!read.ok) {
        return read.reason === "enoent"
            ? { kind: "absent" }
            : { kind: "failed", reason: read.reason, code: read.code, message: read.message };
    }
    try {
        return { kind: "value", value: parse(read.text) };
    }
    catch (e) {
        return {
            kind: "failed",
            reason: "unreadable",
            code: "PARSE",
            message: e.message,
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
function readBoardSource(root, readAt, previous, seam) {
    const path = repoSubpath(root, FIXED_SUBPATHS.board);
    return settleSource("board", path, gatherFile(path, seam, parseBoard), previous, readAt);
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
function readConfigSource(root, readAt, previous, seam) {
    const path = repoSubpath(root, FIXED_SUBPATHS.config);
    const outcome = gatherFile(path, seam, (text) => configView(JSON.parse(text)));
    return settleSource("config", path, outcome, previous, readAt, LEAN_CONFIG_VIEW);
}
/** The three dial keys the snapshot cross-checks. Everything else in the dial is ignored here. */
function configView(raw) {
    const limits = {};
    const wip = raw["wip_limits"];
    if (wip !== null && typeof wip === "object") {
        for (const [k, v] of Object.entries(wip)) {
            if (typeof v === "number" && Number.isInteger(v))
                limits[k] = v;
        }
    }
    return {
        mode: typeof raw["mode"] === "string" ? raw["mode"] : null,
        idPrefix: typeof raw["id_prefix"] === "string" ? raw["id_prefix"] : null,
        wipLimits: limits,
    };
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
export function readSnapshot(repoRoot, previous, seam = {}) {
    const root = resolveRepoRoot(repoRoot);
    const readAt = new Date().toISOString();
    const before = previous?.snapshot.sources;
    const board = readBoardSource(root, readAt, before?.board, seam);
    const config = readConfigSource(root, readAt, before?.config, seam);
    const sources = {
        board: board.state,
        config: config.state,
        // PLAN 32-03 TASK 2 READS THESE FOUR. The arm they return is the honest one for this tree today
        // (`.grugops/` does not exist here and `plans/tickets/` carries only a `.gitkeep`).
        tickets: absent(),
        queue: absent(),
        context: absent(),
        traceability: absent(),
    };
    const snapshot = {
        schemaVersion: SCHEMA_VERSION,
        repoRoot: root,
        generatedAt: readAt,
        board: valueOrNull(board.state),
        config: valueOrNull(config.state),
        sources,
    };
    const readErrors = [];
    for (const settled of [board, config]) {
        if (settled.error !== null)
            readErrors.push(settled.error);
    }
    return {
        source: deriveOverallSource(sources),
        snapshot,
        // PLAN 32-05 DERIVES THE CONFLICTS. The board alone cannot disagree with anything yet.
        conflicts: [],
        readErrors,
    };
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
function deriveOverallSource(sources) {
    if (sources.board.source === "unavailable")
        return "unavailable";
    // SOURCE_NAMES rather than Object.keys: the tuple is the pinned set, so a source added to the
    // record and not to the tuple cannot slip past this loop unexamined.
    for (const name of SOURCE_NAMES) {
        if (sources[name].source === "stale")
            return "stale";
    }
    return "ok";
}

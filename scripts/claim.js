// claim.ts — the file-based task queue + the atomic work-claim primitive (CLAIM-01/02, SC-3).
//
// The concurrency net under the shared-context substrate. Each task is claimed exactly once, so
// within-task writing is normally single-writer — the partition that keeps context-io.ts's write
// path safe. There is NO central lock manager: the directory IS the state.
//
//   Queue layout (CLAIM-01):  .grugops/queue/{pending,claimed,done}/
//     pending/<task>.md       a thin, self-contained subtask file (what-to-do + a ref to its
//                             .grugops/context/<task>/ folder + the originating ticket)
//     claimed/<task>/         the claim directory — its existence IS the claim (atomic mkdir)
//       claim.md              the "now-running" registry record: by / at / task, plus the optional
//                             agent / level lines (D-03) (frontmatter)
//     done/<task>.md          the completed subtask
//
//   claimTask (CLAIM-02): mkdirSync(claimed/<task>) is atomic create-or-fail on every platform
//     including NFS — preferred over O_EXCL, which is documented-unreliable on NFS. The FIRST
//     claimant's mkdir succeeds; a SECOND claimant's mkdir throws EEXIST = claim lost (returns
//     false — NOT an error). ANY other code (ENOENT parent-missing, EACCES) is a genuine failure
//     and is rethrown — a real error is never swallowed into a false "lost".
//
//   transition: pending→claimed→done by atomic rename of the subtask file (no daemon, no lock).
//     atomicRename does renameSync and, on the Windows MoveFileEx case (EPERM/EEXIST/EACCES),
//     unlinkSync(dst) then retries — the locked unlink-then-rename branch.
//
//   sweepStale (Task 2, DOGF-02 seed): an explicit generous-configurable wall-clock TTL reclaim of
//     a claim whose claim.md `at` is older than the TTL — NO pid/host liveness. A claim directory with
//     no usable record is judged by the directory's own modified time instead (WR-04).
//
//   The whole lifecycle (RUN-01, plan 41-01): claimPending takes a pending subtask into claimed/ in
//     one call, and completeTask moves it to done/ and removes claimed/<task>/. That removal is what
//     empties the in-flight log: a bare transition(claimed→done) moves only the subtask file and
//     leaves claim.md behind, so the render would keep a row for finished work.
//
//   NO RENDER HERE. The mutators do not call renderNowRunning. The program that calls them renders
//     after each one (D-02), so a failed render can be reported without denying a queue change that
//     stands.
//
//   EMBEDDED IN A HOST PROGRAM. scripts/generate-runnable-embeds.ts embeds this library, next to
//     scripts/context-io.ts, into a host runnable. That is why the task-name rule here is named
//     QUEUE_TASK_NAME_RE and assertSafeQueueTask: the generator refuses one name with two targets, and
//     it refuses a closure that reaches a non-`node:` import, so the rule cannot be imported from
//     context-io.ts. A test binds the two patterns. It is also why renderNowRunning takes its root
//     from the caller: DEFAULT_QUEUE_ROOT is an import.meta.dirname path, and only the kit CLI below
//     may reach it.
//
// CRITICAL naming distinction: the queue CLAIM here (hard work-ownership via atomic mkdir) is
// DIFFERENT from the `claim` note-KIND in context-io.ts (a soft, unverified assertion). They never
// share a code path. claim.md (this file, the now-running registry) is NOT a `kind: claim` note.
//
// Build model (D-13): node:fs + node:path ONLY — ZERO host runtime deps. Authored in TypeScript,
// compiled with `tsc` to a committed scripts/claim.js that host machines and CI run with bare Node;
// the freshness.ts build-output gate (OUTPUT_DIRS includes scripts/) proves the committed .js is a
// faithful build of this .ts.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — this coordinates work ownership,
// a safety + trace surface, never caveman voice).
//
// Path-traversal mitigation (ASVS V12, T-20-04): the task name is validated against a strict
// allowlist (^[A-Za-z0-9._-]+$, rejecting `.` / `..` / separators / absolute paths) before it is
// joined under the queue root. The queue root itself is a fixed literal (.grugops/queue) in
// production; tests pass an explicit temp root. The queue root is never derived from argv / env / a
// queue file's content as an absolute path.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, renameSync, unlinkSync, rmSync, lstatSync, } from "node:fs";
import { join } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { randomUUID } from "node:crypto";
// ── Fixed queue root (production). Tests pass an explicit root. ──────────────────────────────────
const ROOT = join(import.meta.dirname, "..");
const DEFAULT_QUEUE_ROOT = join(ROOT, ".grugops", "queue");
// The three queue stages, used both as the on-disk layout and as the legal transition endpoints.
export const QUEUE_STAGES = ["pending", "claimed", "done"];
// ── Task-name allowlist (path-traversal mitigation, T-20-04) ─────────────────────────────────────
export const QUEUE_TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
function isSafeQueueName(name) {
    // Reject empty, `.`/`..`, path separators, absolute paths, and anything outside the allowlist.
    return QUEUE_TASK_NAME_RE.test(name) && name !== "." && name !== "..";
}
function assertSafeQueueTask(task) {
    if (!isSafeQueueName(task)) {
        throw new Error(`claim: invalid task name "${task}" — must match ^[A-Za-z0-9._-]+$ ` +
            "(no path separators, no .., no absolute paths)");
    }
}
// ── queueEntry / readClaimRecord: ask what is there before anything opens it (T-41-03). ──────────
// An lstat, so a link is reported as a link and never followed. Nothing there is null: ENOENT, and
// ENOTDIR for a path under a regular file, which is what `claimed/.gitkeep/claim.md` gives. Every
// other failure is rethrown, because a failed look must never read as "nothing there".
function queueEntry(path) {
    try {
        return lstatSync(path);
    }
    catch (e) {
        const code = e.code;
        if (code === "ENOENT" || code === "ENOTDIR")
            return null;
        throw e;
    }
}
// The text of a claim record, or null when nothing is there or the entry is not a regular file. A
// FIFO must never be opened, because a read of one blocks until a writer comes, and a link names a
// file outside the queue.
function readClaimRecord(path) {
    const entry = queueEntry(path);
    if (entry === null || !entry.isFile())
        return null;
    return readFileSync(path, "utf8");
}
// ── atomicRename: rename src → dst; on the Windows MoveFileEx case, unlink dst then retry. ───────
// POSIX renameSync atomically replaces an existing destination. Windows (MoveFileEx) is not atomic
// and fails with EPERM/EEXIST/EACCES when the destination already exists — the unlink-then-rename
// branch handles that. Any other error is rethrown.
function atomicRename(src, dst) {
    try {
        renameSync(src, dst);
    }
    catch (e) {
        const code = e.code;
        if (code === "EPERM" || code === "EEXIST" || code === "EACCES") {
            // Windows branch: remove the destination, then retry the rename.
            try {
                unlinkSync(dst);
            }
            catch {
                /* not-present is fine */
            }
            renameSync(src, dst);
        }
        else {
            throw e;
        }
    }
}
export function claimTask(queueRoot, task, by, fields = {}) {
    return takeClaim(queueRoot, task, by, fields) !== null;
}
// The claim itself: the `at` written to the record, or null when the claim is lost.
function takeClaim(queueRoot, task, by, fields) {
    assertSafeQueueTask(task);
    // Field-injection guard (CR-02): `by` is written raw into claim.md frontmatter. A newline would
    // smuggle a forged `at:` line ahead of the real one, and sweepStale's first-match regex would
    // then read the forged timestamp — making a stale claim un-sweepable forever (queue-lock DoS).
    // Reject any `by`, `agent` or `level` carrying a CR or LF before writing the record: all three are
    // written raw, ahead of `at:`.
    for (const [name, value] of [["by", by], ["agent", fields.agent], ["level", fields.level]]) {
        if (value !== undefined && /[\r\n]/.test(value)) {
            throw new Error(`claim: invalid "${name}" — must be single-line (no embedded newline): ${JSON.stringify(value)}`);
        }
    }
    const claimDir = join(queueRoot, "claimed", task);
    try {
        mkdirSync(claimDir); // atomic create-or-fail (NOT recursive — a missing claimed/ parent is a real ENOENT)
    }
    catch (e) {
        const code = e.code;
        if (code === "EEXIST")
            return null; // claim lost — another claimant already owns this task
        throw e; // ENOENT (claimed/ parent missing) / EACCES / ... are genuine failures
    }
    // Won the claim: record the now-running registry entry for the stale sweep. ISO-8601 `at`.
    const at = new Date().toISOString();
    const agent = fields.agent === undefined ? "" : `agent: ${fields.agent}\n`;
    const level = fields.level === undefined ? "" : `level: ${fields.level}\n`;
    try {
        writeFileSync(join(claimDir, "claim.md"), `---\nby: ${by}\n${agent}${level}at: ${at}\ntask: ${task}\n---\n`, "utf8");
    }
    catch (e) {
        // Give the slot back now: a directory with no record would hold it until the sweep's TTL passes.
        rmSync(claimDir, { recursive: true, force: true });
        throw e;
    }
    return at;
}
// ── claimOwnerRefusal: who may own a claim (D-13, T-41-04). ─────────────────────────────────────
// The Orchestrator claims only in the name of the adapter it starts, never as itself. A reason is
// returned for an empty name, a name outside the task-name allowlist, and a name whose stem is
// `orchestrator`. This is an instruction backstop, not a boundary: an agent can edit files.
export function claimOwnerRefusal(by) {
    if (by === "")
        return "the claim owner is empty; name the adapter that runs the task";
    if (!isSafeQueueName(by)) {
        return `the claim owner ${JSON.stringify(by)} is not a plain name (^[A-Za-z0-9._-]+$)`;
    }
    if (by.toLowerCase().replace(/^grugops-/, "") === "orchestrator") {
        return `the Orchestrator never owns a claim; claim in the name of the adapter it starts, not ${by}`;
    }
    return null;
}
// The closed set of engineer levels a claim may name. A binding case keeps it equal to the LEVELS
// rows of scripts/model-tiers.ts; it is not imported, because a host program embeds this library.
export const CLAIM_LEVELS = ["junior", "mid", "senior"];
export function claimPending(queueRoot, task, by, level) {
    assertSafeQueueTask(task);
    const refusal = claimOwnerRefusal(by);
    if (refusal !== null)
        return { kind: "refused", reason: refusal };
    if (level !== undefined && !CLAIM_LEVELS.some((known) => known === level)) {
        return {
            kind: "refused",
            reason: `the level ${JSON.stringify(level)} is not one of ${CLAIM_LEVELS.join(", ")}`,
        };
    }
    let at;
    try {
        if (queueEntry(stagePath(queueRoot, task, "done")) !== null) {
            return { kind: "refused", reason: `done/${task}.md already exists, so ${task} is finished` };
        }
        // `agent` repeats `by` (D-30): the three readers of `by` stay as they are, and the two lines
        // cannot differ here.
        at = takeClaim(queueRoot, task, by, { agent: by, level });
    }
    catch (e) {
        return { kind: "refused", reason: `claim of ${task} failed: ${e.message}` };
    }
    if (at === null)
        return { kind: "lost" };
    try {
        transition(queueRoot, task, "pending", "claimed");
    }
    catch (e) {
        rmSync(join(queueRoot, "claimed", task), { recursive: true, force: true });
        const missing = e.code === "ENOENT";
        return {
            kind: "refused",
            reason: missing
                ? `no subtask at pending/${task}.md`
                : `could not move pending/${task}.md: ${e.message}`,
        };
    }
    return { kind: "claimed", at };
}
export function completeTask(queueRoot, task) {
    assertSafeQueueTask(task);
    const claimDir = join(queueRoot, "claimed", task);
    if (queueEntry(claimDir)?.isDirectory() !== true) {
        return { kind: "refused", reason: `no claim directory at claimed/${task}/` };
    }
    const inClaimed = queueEntry(stagePath(queueRoot, task, "claimed")) !== null;
    const inDone = queueEntry(stagePath(queueRoot, task, "done")) !== null;
    if (inClaimed && inDone) {
        return { kind: "refused", reason: `done/${task}.md already exists, and ${task} is still in claimed/` };
    }
    if (!inClaimed && !inDone) {
        return { kind: "refused", reason: `no subtask for ${task} in claimed/${task}/ or done/` };
    }
    if (inClaimed)
        transition(queueRoot, task, "claimed", "done");
    rmSync(claimDir, { recursive: true, force: true });
    return { kind: "done" };
}
// ── transition: move the subtask file between stages by atomic rename (CLAIM-01). ───────────────
// pending/<task>.md → claimed/<task>/<task>.md → done/<task>.md. The directory IS the state; there
// is no central lock manager. The claim directory (claimed/<task>/) must already exist (claimTask
// created it) when moving INTO claimed.
export function transition(queueRoot, task, from, to) {
    assertSafeQueueTask(task);
    const src = stagePath(queueRoot, task, from);
    const dst = stagePath(queueRoot, task, to);
    atomicRename(src, dst);
}
// The on-disk path of a subtask file at a given stage. In claimed/ the subtask lives INSIDE the
// claim directory (claimed/<task>/<task>.md) alongside claim.md; in pending/ and done/ it is a flat
// file (pending/<task>.md, done/<task>.md).
function stagePath(queueRoot, task, stage) {
    return stage === "claimed"
        ? join(queueRoot, "claimed", task, `${task}.md`)
        : join(queueRoot, stage, `${task}.md`);
}
// ── sweepStale: explicit generous-TTL wall-clock stale-claim reclaim (CLAIM-02, DOGF-02 seed). ──
//
// Reads every claimed/<task>/claim.md, and when `now - Date.parse(at) > ttlMs` it RECLAIMS the task:
// the subtask file (claimed/<task>/<task>.md, if present) is returned to pending/<task>.md by atomic
// rename, then the claim directory is released (rmSync recursive). Returns the list of reclaimed task
// names (DOGF-02 asserts a stale claim is reclaimed). A fresh claim (within the TTL) is left
// untouched — the sweep is conservative, so it has a real no-op path too (no-fabrication).
//
// A DIRECTORY WITH NO USABLE RECORD (WR-04): a record that is absent, a link, a FIFO or any other
// non-regular file, one with no `at`, or one whose `at` does not parse gives no time to judge. Such a
// directory holds a slot, so it is judged by its own modified time with the same `<=`: inside the TTL
// it stays, and past it the directory is reclaimed. The age is taken from the unrounded `mtimeMs`. A
// tampered record is reclaimed at any age. A claimed entry that is not a directory stays where it is.
//
// WALL-CLOCK TTL ONLY — this deliberately reads NO pid/host or any liveness signal. pid/host liveness
// is rejected as not portable cross-machine / on NFS (heartbeat/advisory-lease liveness is deferred
// to v2.x, PAR-05). The TTL VALUE is supplied by the CALLER — a config dial wiring it is a LATER
// phase (Phase 22/25); Phase 20 ships the RULE, not the dial. The default must be GENEROUS — it must
// EXCEED a real agent turn — and is explicitly NOT DeLM's 300 s. `now` is injectable for deterministic
// testing; production passes the real clock.
export function sweepStale(queueRoot, ttlMs, now = Date.now()) {
    const claimedDir = join(queueRoot, "claimed");
    if (queueEntry(claimedDir) === null)
        return [];
    const reclaimed = [];
    for (const task of readdirSync(claimedDir)) {
        // Defensive: skip anything whose name would not be a safe task (never join an unsafe segment).
        if (!isSafeQueueName(task))
            continue;
        const claimDir = join(claimedDir, task);
        const entry = queueEntry(claimDir);
        if (entry === null || !entry.isDirectory())
            continue; // no claim directory; it stays where it is
        // Defense-in-depth (CR-02): the design writes EXACTLY ONE `at:` line. More than one is a
        // tampered/malformed record (the on-disk signature of a `by`-injection that smuggled a forged
        // `at:`). Do NOT trust the first match — treat the claim as compromised and reclaim it, rather
        // than leaving it un-sweepable forever.
        const claim = claimStateOf(claimDir);
        if (claim.kind !== "tampered") {
            const since = claim.kind === "usable" ? claim.atMs : entry.mtimeMs;
            if (now - since <= ttlMs)
                continue; // fresh (within TTL) → leave it alone
        }
        // Reclaim: stale-by-TTL OR tampered (multi-`at`). Return the subtask to pending/ (atomic
        // rename) BEFORE releasing the claim dir, then remove the claim directory. Wall-clock only —
        // no liveness probe.
        const subtask = join(claimDir, `${task}.md`);
        if (queueEntry(subtask) !== null) {
            atomicRename(subtask, join(queueRoot, "pending", `${task}.md`));
        }
        rmSync(claimDir, { recursive: true, force: true });
        reclaimed.push(task);
    }
    return reclaimed;
}
// ── sweepQueue: release what finished, then reclaim what went stale. ────────────────────────────
// A claim directory whose subtask has left it and sits in done/ is finished work, whatever its age
// and whatever its record, which is not read here: an earlier run stopped between the rename and the
// removal. It is released and reported apart from a reclaim, because a release returns nothing to
// pending/. A claimed entry that is not a directory stays where it is, as sweepStale leaves it.
export function sweepQueue(queueRoot, ttlMs, now = Date.now()) {
    const claimedDir = join(queueRoot, "claimed");
    const released = [];
    if (queueEntry(claimedDir) !== null) {
        for (const task of readdirSync(claimedDir)) {
            if (!isSafeQueueName(task))
                continue;
            if (queueEntry(join(claimedDir, task))?.isDirectory() !== true)
                continue;
            if (queueEntry(stagePath(queueRoot, task, "claimed")) !== null)
                continue;
            if (queueEntry(stagePath(queueRoot, task, "done")) === null)
                continue;
            rmSync(join(claimedDir, task), { recursive: true, force: true });
            released.push(task);
        }
    }
    return { released, reclaimed: sweepStale(queueRoot, ttlMs, now) };
}
// ── claimedEntryNames / claimedCount / freeSlots: what the width cap sees (RUN-02). ─────────────
// Names every entry in claimed/ except a keeper: a name that starts with `.` and is a regular file,
// such as git's `.gitkeep`. That is the keeper rule of claimedQueueRefusal in install/install.ts.
// Anything else is named, link and stray file included: over-counting can never over-spawn. It throws
// when the directory cannot be read; a host program asks the root-chain owner first. The count and
// the render both start from this one listing, so `free` and the in-flight log cannot disagree (WR-04).
export function claimedEntryNames(queueRoot) {
    const entries = readdirSync(join(queueRoot, "claimed"), { withFileTypes: true });
    return entries.filter((entry) => !(entry.name.startsWith(".") && entry.isFile())).map((entry) => entry.name);
}
export function claimedCount(queueRoot) {
    return claimedEntryNames(queueRoot).length;
}
export function freeSlots(wipLimit, claimed) {
    return Math.max(0, wipLimit - claimed);
}
// ── parseQueueConfig: read the `queue` dial from the text of factory.config.json (RUN-02). ──────
// A value counts only as a positive safe integer. Anything else falls back to QUEUE_DEFAULTS and adds
// a note, so a caller can say which value it did not use. It never throws on content: the config file
// is user content and may be malformed. `text` is null when there is no file. A binding case keeps
// QUEUE_DEFAULTS equal to the seed config.
export const QUEUE_DEFAULTS = Object.freeze({ wip_limit: 3, claim_cap: 2, stale_ttl_minutes: 30 });
export function parseQueueConfig(text) {
    let config = null;
    let invalidJson = false;
    if (text !== null) {
        try {
            config = JSON.parse(text);
        }
        catch {
            invalidJson = true;
        }
    }
    const queue = config?.queue;
    const values = (typeof queue === "object" && queue !== null ? queue : {});
    const notes = [];
    const pick = (key) => {
        const fallback = QUEUE_DEFAULTS[key];
        const value = values[key];
        if (typeof value === "number" && Number.isSafeInteger(value) && value > 0)
            return value;
        if (invalidJson)
            notes.push(`queue.${key} not read, the config is not valid JSON, default ${fallback}`);
        else if (value === undefined)
            notes.push(`queue.${key} not set, default ${fallback}`);
        else
            notes.push(`queue.${key} is not a positive integer, default ${fallback}`);
        return fallback;
    };
    return {
        wip_limit: pick("wip_limit"),
        claim_cap: pick("claim_cap"),
        stale_ttl_minutes: pick("stale_ttl_minutes"),
        notes,
    };
}
// ── subtaskRefFolder: the context folder a subtask names (T-41-16). ─────────────────────────────
// A subtask carries exactly one `ref:` line, and every `ref:` line is counted: a good line beside a
// bad one is refused, as a second `at:` line is. Its folder is one segment under .grugops/context/,
// inside the task-name allowlist, so the value can be joined under the context root.
export function subtaskRefFolder(text) {
    const refs = text.split(/\r?\n/).filter((line) => line.startsWith("ref:"));
    if (refs.length !== 1) {
        return { kind: "refused", reason: `the subtask carries ${refs.length} ref: lines, not one` };
    }
    const folder = /^ref: \.grugops\/context\/([A-Za-z0-9._-]+)\/?$/.exec(refs[0])?.[1];
    if (folder === undefined || !isSafeQueueName(folder)) {
        return {
            kind: "refused",
            reason: `the line ${JSON.stringify(refs[0])} does not name one folder under .grugops/context/`,
        };
    }
    return { kind: "folder", folder };
}
// ── noteSinceClaim: was a note written since the claim (D-07)? ──────────────────────────────────
// The boundary is inclusive: a note at the claim's own instant counts. An unparseable note `at` is
// ignored, because NaN compares false, and an unparseable claim `at` gives false.
export function noteSinceClaim(claimAt, noteAts) {
    const claimed = Date.parse(claimAt);
    if (Number.isNaN(claimed))
        return false;
    return noteAts.some((noteAt) => Date.parse(noteAt) >= claimed);
}
// ── atomicWrite: write a unique temp sibling, then rename onto the final path. ──────────────────
// Cloned from context-io.ts atomicWrite (l.622-647). POSIX renameSync atomically replaces; Windows
// (MoveFileEx) is not atomic and fails EPERM/EEXIST/EACCES when the destination exists — the
// unlink-then-rename branch handles that. now-running.md is a single-writer derived artifact that is
// regenerated wholesale, so the Windows branch may fire on regen; on any other error the temp is
// cleaned up and the error rethrown (a broken write never leaves a half-file as the "render").
function atomicWrite(finalPath, data) {
    const tmp = `${finalPath}.tmp-${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    writeFileSync(tmp, data, "utf8");
    try {
        renameSync(tmp, finalPath);
    }
    catch (e) {
        const code = e.code;
        if (code === "EPERM" || code === "EEXIST" || code === "EACCES") {
            try {
                unlinkSync(finalPath);
            }
            catch {
                /* not-present is fine */
            }
            renameSync(tmp, finalPath);
        }
        else {
            try {
                unlinkSync(tmp);
            }
            catch {
                /* best-effort */
            }
            throw e;
        }
    }
}
// ── cell(): escape free-text before it enters a pipe-delimited markdown table cell. ─────────────
// Cloned from context-io.ts cell() (l.884-888): backslash first, then pipe, then flatten newlines.
function cell(s) {
    return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
export function claimRecordFields(text) {
    if ((text.match(/^at:/gm) ?? []).length > 1)
        return { kind: "tampered" };
    const value = (key) => new RegExp(`^${key}:[ \\t]*(.*)$`, "m").exec(text)?.[1].trim() ?? "";
    const at = value("at");
    if (at === "")
        return { kind: "no-at" };
    return { kind: "record", by: value("by"), agent: value("agent"), level: value("level"), at };
}
function claimStateOf(claimDir) {
    const text = readClaimRecord(join(claimDir, "claim.md"));
    if (text === null)
        return { kind: "unusable" };
    const record = claimRecordFields(text);
    if (record.kind === "tampered")
        return { kind: "tampered" };
    if (record.kind === "no-at")
        return { kind: "unusable" };
    const atMs = Date.parse(record.at);
    if (Number.isNaN(atMs))
        return { kind: "unusable" };
    return { kind: "usable", by: record.by, agent: record.agent, level: record.level, at: record.at, atMs };
}
// The `since` of a row that has no time to show.
const UNKNOWN_SINCE = "unknown";
// ── renderNowRunning: derive .grugops/queue/now-running.md from the claim registry (D-14). ──────
//
// Lists claimed/ through claimedEntryNames and emits a deterministic, GENERATED-headered markdown table
// (task, by, agent, level, since), sorted by `at` then `task` with every `unknown` row last, with a
// single trailing newline — byte-reproducible (running twice over the same registry produces identical
// bytes; it carries no wall-clock of its own).
// An empty/absent claimed/ yields a header-only render (vacuous, no crash). This is the human-facing
// "what is running" view and the SC2 width-evidence source.
//
// EVERY ENTRY THE COUNT SEES HAS A ROW (WR-04), but for a tampered record. A safe-named directory with
// a usable record keeps its fields. Anything else shows only its name, with empty `by`, `agent` and
// `level` and a `since` of `unknown`: a directory with no usable record, a stray file, a link, and a
// name outside the allowlist. An unsafe name is never joined into a path, and an entry that is not a
// directory is never read through. No field of an unusable record reaches the table.
//
// SECURITY CARVE-OUT (T-23-01, V5 — load-bearing): the parse is claimStateOf, the same reading
// sweepStale uses. A claim.md is written with EXACTLY ONE `at:`
// line; MORE than one is a tampered/malformed record (the on-disk signature of a `by`-injection that
// smuggled a forged `at:`). A tampered record is NEVER emitted as a trusted row — it is skipped, never
// trusted on the first (or second) match. There is deliberately NO permissive multi-match frontmatter
// parser here: a forged second `at:` line is a queue-lock DoS, and trusting it would let a tampered
// claim masquerade as a running row.
export function renderNowRunning(queueRoot) {
    const claimedDir = join(queueRoot, "claimed");
    const rows = [];
    if (queueEntry(claimedDir) !== null) {
        for (const task of claimedEntryNames(queueRoot)) {
            // Defensive: never read through an unsafe segment, or through an entry that is no directory.
            const claimDir = isSafeQueueName(task) ? join(claimedDir, task) : null;
            const readable = claimDir !== null && queueEntry(claimDir)?.isDirectory() === true;
            const claim = readable ? claimStateOf(claimDir) : { kind: "unusable" };
            // A multi-`at` record is tampered: skip it, and never emit a forged second line as a trusted row.
            if (claim.kind === "tampered")
                continue;
            rows.push(claim.kind === "usable"
                ? { task, by: claim.by, agent: claim.agent, level: claim.level, at: claim.at }
                : { task, by: "", agent: "", level: "", at: UNKNOWN_SINCE });
        }
    }
    // Deterministic order: by `at` (ISO lexicographic), then by `task` as a stable tiebreak.
    rows.sort((a, b) => (a.at !== b.at ? a.at.localeCompare(b.at) : a.task.localeCompare(b.task)));
    // A row with no time goes after every timed row, whatever letter a timed `at` opens with. The filter
    // keeps the sorted order on each side, so the `unknown` rows stay in task order.
    const timed = rows.filter((r) => r.at !== UNKNOWN_SINCE);
    const untimed = rows.filter((r) => r.at === UNKNOWN_SINCE);
    const md = [];
    md.push("<!-- GENERATED — do not hand-edit. Re-run: node tools/grugops/claim.js now-running -->");
    md.push("# Now running");
    md.push("");
    md.push("| task | by | agent | level | since |");
    md.push("| --- | --- | --- | --- | --- |");
    for (const r of [...timed, ...untimed]) {
        md.push(`| ${cell(r.task)} | ${cell(r.by)} | ${cell(r.agent)} | ${cell(r.level)} | ${cell(r.at)} |`);
    }
    md.push(""); // trailing element → exactly one final "\n"
    atomicWrite(join(queueRoot, "now-running.md"), md.join("\n"));
}
// ── CLI entrypoint (only when run directly, never on import) ─────────────────────────────────────
// import.meta.url === the executed file's URL when run via `node claim.js ...`. The freshness gate
// and the package.json script invoke `node scripts/claim.js now-running [queueRoot]`.
const isMain = isEntrypoint(import.meta.url);
if (isMain) {
    const [cmd, ...rest] = process.argv.slice(2);
    try {
        if (cmd === "now-running") {
            const queueRoot = rest[0]; // optional explicit root (tests / the gate pass a temp root)
            renderNowRunning(queueRoot ?? DEFAULT_QUEUE_ROOT);
            console.log("rendered .grugops/queue/now-running.md from the claim registry.");
            process.exit(0);
        }
        else {
            console.error("usage: claim.js now-running [queueRoot]");
            process.exit(1);
        }
    }
    catch (e) {
        console.error(`claim: ${e.message}`);
        process.exit(1);
    }
}

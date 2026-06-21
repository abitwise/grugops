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
//       claim.md              the "now-running" registry record: by / at / task (frontmatter)
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
//     a claim whose claim.md `at` is older than the TTL — NO pid/host liveness.
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
import { mkdirSync, writeFileSync, readFileSync, readdirSync, renameSync, unlinkSync, rmSync, existsSync, } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
// ── Fixed queue root (production). Tests pass an explicit root. ──────────────────────────────────
const ROOT = join(import.meta.dirname, "..");
const DEFAULT_QUEUE_ROOT = join(ROOT, ".grugops", "queue");
// The three queue stages, used both as the on-disk layout and as the legal transition endpoints.
export const QUEUE_STAGES = ["pending", "claimed", "done"];
// ── Task-name allowlist (path-traversal mitigation, T-20-04) ─────────────────────────────────────
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeTask(task) {
    // Reject empty, `.`/`..`, path separators, absolute paths, and anything outside the allowlist.
    if (!TASK_NAME_RE.test(task) || task === "." || task === "..") {
        throw new Error(`claim: invalid task name "${task}" — must match ^[A-Za-z0-9._-]+$ ` +
            "(no path separators, no .., no absolute paths)");
    }
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
// ── claimTask: atomic mkdir claim (CLAIM-02). First claimant wins; EEXIST = claim lost (false). ──
// On success, writes the now-running registry record claimed/<task>/claim.md (by / at / task) and
// returns true. On EEXIST returns false (claim lost — NOT an error). On ANY other code (ENOENT
// parent-missing, EACCES, ...) rethrows — a real failure is never swallowed into a false "lost".
export function claimTask(queueRoot, task, by) {
    assertSafeTask(task);
    // Field-injection guard (CR-02): `by` is written raw into claim.md frontmatter. A newline would
    // smuggle a forged `at:` line ahead of the real one, and sweepStale's first-match regex would
    // then read the forged timestamp — making a stale claim un-sweepable forever (queue-lock DoS).
    // Reject any `by` carrying a CR or LF before writing the record.
    if (/[\r\n]/.test(by)) {
        throw new Error(`claim: invalid "by" — must be single-line (no embedded newline): ${JSON.stringify(by)}`);
    }
    const claimDir = join(queueRoot, "claimed", task);
    try {
        mkdirSync(claimDir); // atomic create-or-fail (NOT recursive — a missing claimed/ parent is a real ENOENT)
    }
    catch (e) {
        const code = e.code;
        if (code === "EEXIST")
            return false; // claim lost — another claimant already owns this task
        throw e; // ENOENT (claimed/ parent missing) / EACCES / ... are genuine failures
    }
    // Won the claim: record the now-running registry entry for the stale sweep. ISO-8601 `at`.
    const at = new Date().toISOString();
    writeFileSync(join(claimDir, "claim.md"), `---\nby: ${by}\nat: ${at}\ntask: ${task}\n---\n`, "utf8");
    return true;
}
// ── transition: move the subtask file between stages by atomic rename (CLAIM-01). ───────────────
// pending/<task>.md → claimed/<task>/<task>.md → done/<task>.md. The directory IS the state; there
// is no central lock manager. The claim directory (claimed/<task>/) must already exist (claimTask
// created it) when moving INTO claimed.
export function transition(queueRoot, task, from, to) {
    assertSafeTask(task);
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
// WALL-CLOCK TTL ONLY — this deliberately reads NO pid/host or any liveness signal. pid/host liveness
// is rejected as not portable cross-machine / on NFS (heartbeat/advisory-lease liveness is deferred
// to v2.x, PAR-05). The TTL VALUE is supplied by the CALLER — a config dial wiring it is a LATER
// phase (Phase 22/25); Phase 20 ships the RULE, not the dial. The default must be GENEROUS — it must
// EXCEED a real agent turn — and is explicitly NOT DeLM's 300 s. `now` is injectable for deterministic
// testing; production passes the real clock.
export function sweepStale(queueRoot, ttlMs, now = Date.now()) {
    const claimedDir = join(queueRoot, "claimed");
    if (!existsSync(claimedDir))
        return [];
    const reclaimed = [];
    for (const task of readdirSync(claimedDir)) {
        // Defensive: skip anything whose name would not be a safe task (never join an unsafe segment).
        if (!TASK_NAME_RE.test(task) || task === "." || task === "..")
            continue;
        const claimMd = join(claimedDir, task, "claim.md");
        if (!existsSync(claimMd))
            continue;
        const claimText = readFileSync(claimMd, "utf8");
        // Defense-in-depth (CR-02): the design writes EXACTLY ONE `at:` line. More than one is a
        // tampered/malformed record (the on-disk signature of a `by`-injection that smuggled a forged
        // `at:`). Do NOT trust the first match — treat the claim as compromised and reclaim it, rather
        // than leaving it un-sweepable forever.
        const atLineCount = (claimText.match(/^at:/gm) ?? []).length;
        const m = claimText.match(/^at:\s*(.+)$/m);
        const tampered = atLineCount > 1;
        if (!tampered) {
            if (!m)
                continue; // no `at` field → cannot judge staleness; leave the claim alone
            const at = Date.parse(m[1].trim());
            if (Number.isNaN(at))
                continue; // unparseable timestamp → leave it alone (conservative)
            if (now - at <= ttlMs)
                continue; // fresh (within TTL) → leave it alone
        }
        // Reclaim: stale-by-TTL OR tampered (multi-`at`). Return the subtask to pending/ (atomic
        // rename) BEFORE releasing the claim dir, then remove the claim directory. Wall-clock only —
        // no liveness probe.
        const subtask = join(claimedDir, task, `${task}.md`);
        if (existsSync(subtask)) {
            atomicRename(subtask, join(queueRoot, "pending", `${task}.md`));
        }
        rmSync(join(claimedDir, task), { recursive: true, force: true });
        reclaimed.push(task);
    }
    return reclaimed;
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
// ── renderNowRunning: derive .grugops/queue/now-running.md from the claim registry (D-14). ──────
//
// Reads every claimed/<task>/claim.md and emits a deterministic, GENERATED-headered markdown table
// (task | by | since), sorted by `at` then `task`, with a single trailing newline — byte-reproducible
// (running twice over the same registry produces identical bytes; it carries no wall-clock of its own).
// An empty/absent claimed/ yields a header-only render (vacuous, no crash). This is the human-facing
// "what is running" view and the SC2 width-evidence source.
//
// SECURITY CARVE-OUT (T-23-01, V5 — load-bearing): the parse REUSES claim.ts's first-`at`-trusted /
// single-line discipline from sweepStale (l.190-202). A claim.md is written with EXACTLY ONE `at:`
// line; MORE than one is a tampered/malformed record (the on-disk signature of a `by`-injection that
// smuggled a forged `at:`). A tampered record is NEVER emitted as a trusted row — it is skipped, never
// trusted on the first (or second) match. There is deliberately NO permissive multi-match frontmatter
// parser here: a forged second `at:` line is a queue-lock DoS, and trusting it would let a tampered
// claim masquerade as a running row.
export function renderNowRunning(queueRoot = DEFAULT_QUEUE_ROOT) {
    const claimedDir = join(queueRoot, "claimed");
    const rows = [];
    if (existsSync(claimedDir)) {
        for (const task of readdirSync(claimedDir)) {
            // Defensive: never read through an unsafe segment.
            if (!TASK_NAME_RE.test(task) || task === "." || task === "..")
                continue;
            const claimMd = join(claimedDir, task, "claim.md");
            if (!existsSync(claimMd))
                continue;
            const claimText = readFileSync(claimMd, "utf8");
            // First-`at`-trusted single-line discipline (mirror sweepStale l.194-196). A multi-`at`
            // record is tampered → skip it; do NOT emit a forged second line as a trusted row.
            const atLineCount = (claimText.match(/^at:/gm) ?? []).length;
            if (atLineCount > 1)
                continue; // tampered (multi-`at`) — never a trusted now-running row
            const atMatch = claimText.match(/^at:\s*(.+)$/m);
            if (!atMatch)
                continue; // no `at` field → cannot place it on the timeline; skip
            // `by` is likewise single-line (claimTask rejects CR/LF in `by` at write time); take the first.
            const byMatch = claimText.match(/^by:\s*(.+)$/m);
            const by = byMatch ? byMatch[1].trim() : "";
            rows.push({ task, by, at: atMatch[1].trim() });
        }
    }
    // Deterministic order: by `at` (ISO lexicographic), then by `task` as a stable tiebreak.
    rows.sort((a, b) => (a.at !== b.at ? a.at.localeCompare(b.at) : a.task.localeCompare(b.task)));
    const md = [];
    md.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/claim.js now-running -->");
    md.push("# Now running");
    md.push("");
    md.push("| task | by | since |");
    md.push("| --- | --- | --- |");
    for (const r of rows) {
        md.push(`| ${cell(r.task)} | ${cell(r.by)} | ${cell(r.at)} |`);
    }
    md.push(""); // trailing element → exactly one final "\n"
    atomicWrite(join(queueRoot, "now-running.md"), md.join("\n"));
}
// ── CLI entrypoint (only when run directly, never on import) ─────────────────────────────────────
// import.meta.url === the executed file's URL when run via `node claim.js ...`. The freshness gate
// and the package.json script invoke `node scripts/claim.js now-running [queueRoot]`.
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
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

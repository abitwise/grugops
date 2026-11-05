// claim.ts — the host queue tool (phase 41, plans 41-03 and 41-05, RUN-01, RUN-02, RUN-05, D-01, D-02, D-08, D-11, D-13).
//
// WHAT IT IS. A kit-shipped runnable in the shape of state-roll.ts: authored here, compiled to a committed claim.js,
// installed to tools/grugops/claim.js and run on a host with only Node present. It is the one program that moves a
// queue record, so each step of Workflow 17 is one command and no agent runs the protocol by hand:
//   - `claim TASK --by ADAPTER [--level LEVEL]` takes pending/TASK.md into claimed/TASK/ and writes the claim record.
//   - `done TASK` moves the subtask to done/ and releases claimed/TASK/, once a sealed note exists since the claim.
//   - `now-running` renders .grugops/queue/now-running.md, the in-flight log, from claimed/.
//   - `sweep` returns each stale claim to pending/ and releases each claim whose subtask already sits in done/. It reads
//     queue.stale_ttl_minutes, and Workflow 17 runs it at session start only (D-11).
//   - `free` prints queue.wip_limit minus the claimed/ count read from disk, the number a refill trusts. It writes nothing.
// A command that changes the queue renders the log before it reports, so the log cannot go stale between steps (D-02).
// It moves queue records and nothing else: it runs no git, pushes, merges or deploys nothing, and writes nowhere
// outside .grugops/queue/. It reads .grugops/context/ for the note check and never writes there.
//
// THE D-12 CONTRACT (D-08).
//   exit 0 → the command did its work; stdout holds one line (`claimed TASK by ADAPTER`, `done TASK`,
//            `rendered .grugops/queue/now-running.md`, `free N`), or for `sweep` the line `swept N`, then one
//            `reclaimed TASK` or `released TASK (already done)` line each.
//   exit 1 → an outcome to act on, never an error: stdout holds one line (`lost TASK`, or `not-done TASK: ...`, which
//            leaves the task in claimed/).
//   exit 2 → could not run or refused: a bad argument, a root with no .grugops directory, a symbolic link or a
//            non-directory on the way to the queue, a task name outside the allowlist, a refused owner, a level outside
//            the closed set, no pending subtask, a task already in done/, a task with no claim directory, a tampered
//            claim record, a bad `ref:` line, notes that cannot be read, a config path that is not a regular file, a
//            claimed/ that cannot be read. Exit 2 prints nothing on stdout and one
//            `Error: ` line on stderr. An unexpected error is exit 2 too, and never surfaces as Node's own exit 1: that
//            line names a queue change that stands, so a failed render never denies a claim or a finish that was made.
//
// THE NOTE CHECK (D-07, D-28). `done` passes only on a sealed note whose `at` is at or after the claim's `at`, in the
// context folder the subtask's `ref:` line names, which can differ from the task name on a re-queued subtask. The seal
// check is the embedded note walk's, so it has one owner. A hand-written note does not count, on any host: the
// `not-done` line names the unsealed notes it found, so a host with no sealed-note writer sees the gap and never a
// silent pass. No flag and no environment variable skips this check.
//
// THE NUMBER IS EXACT OR REFUSED (RUN-02). `free` is what stops an over-spawn, so a read that fails is exit 2 and never a
// number. A missing config, a missing key or a malformed value is not a failed read: it falls back to the documented
// default, and the line says so.
//
// THE ROOT IS A BOUNDARY. The root is the current directory, or `--root DIR`, resolved once with realpath. Unlike
// state-roll's root it is not positional, because the task is. A root with no .grugops directory is exit 2, so a wrong
// working directory never makes a stray queue (T-41-09). Every queue directory is asked of the embedded
// rootChainPresence, the root-chain owner of the runnables, which lstats each component, so a symbolic link on the path
// is refused by name with nothing written, wherever it points (T-41-08). The installer seeds no queue, so a queue
// directory is created only on an `absent` answer.
//
// OUTPUT IS SANITIZED. Every value this program prints has each C0, C1 and DEL code point removed by the embedded
// stripControlChars (V7).
//
// BUILTINS ONLY. A host runs this file with no kit and no node_modules, so it imports `node:` builtins and nothing
// else. The hand-written part below imports them as namespaces, so the names the generated region imports never
// collide with its own.
//
// NOTHING HERE IS RETYPED. The queue paths, the owner rule, the level set, the claim, the finish, the render and the note
// walk sit in the generated region, copied verbatim from install/state-layout.ts, scripts/state-rules.ts, scripts/claim.ts and
// scripts/context-io.ts by scripts/generate-runnable-embeds.ts. scripts/runnable-embeds-freshness.ts fails CI when the
// region differs from a fresh derivation. The part below holds only argv, the root checks, the exit codes and the
// output lines.
//
// Voice: clear professional voice (CLAUDE.md hard rule): this file moves records a human audits.
import * as nodeFs from "node:fs";
import * as nodePath from "node:path";
// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
import { createHash, randomUUID } from "node:crypto";
import { closeSync, constants as fsConstants, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, realpathSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, parse, resolve, sep } from "node:path";
export const RUNNABLE_SET_STAMP = "sha256:17e24ec5af62a8ff1b76f9ba326ffc4932a41cb516d80cc74b98a4b666e198f5";
export const RUNNABLE_SET = Object.freeze(["claim.js", "state-check.js", "state-roll.js", "trace-render.js"]);
export const RUNNABLE_SELF = "claim.js";
// from install/state-layout.ts
export const GRUGOPS_DIR_REL = ".grugops";
export const CONTEXT_REL = `${GRUGOPS_DIR_REL}/context`;
export const QUEUE_REL = `${GRUGOPS_DIR_REL}/queue`;
export const QUEUE_DONE_REL = `${QUEUE_REL}/done`;
export const QUEUE_PENDING_REL = `${QUEUE_REL}/pending`;
export const QUEUE_CLAIMED_REL = `${QUEUE_REL}/claimed`;
// from scripts/state-rules.ts
export function stripControlChars(text, multiLine) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        const control = c < 0x20 || (c >= 0x7f && c <= 0x9f);
        if (!control || (multiLine && (c === 0x09 || c === 0x0a)))
            out += text[i];
    }
    return out;
}
// from scripts/claim.ts
export const QUEUE_STAGES = ["pending", "claimed", "done"];
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
function readClaimRecord(path) {
    const entry = queueEntry(path);
    if (entry === null || !entry.isFile())
        return null;
    return readFileSync(path, "utf8");
}
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
    writeFileSync(join(claimDir, "claim.md"), `---\nby: ${by}\n${agent}${level}at: ${at}\ntask: ${task}\n---\n`, "utf8");
    return at;
}
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
export function transition(queueRoot, task, from, to) {
    assertSafeQueueTask(task);
    const src = stagePath(queueRoot, task, from);
    const dst = stagePath(queueRoot, task, to);
    atomicRename(src, dst);
}
function stagePath(queueRoot, task, stage) {
    return stage === "claimed"
        ? join(queueRoot, "claimed", task, `${task}.md`)
        : join(queueRoot, stage, `${task}.md`);
}
export function sweepStale(queueRoot, ttlMs, now = Date.now()) {
    const claimedDir = join(queueRoot, "claimed");
    if (queueEntry(claimedDir) === null)
        return [];
    const reclaimed = [];
    for (const task of readdirSync(claimedDir)) {
        // Defensive: skip anything whose name would not be a safe task (never join an unsafe segment).
        if (!isSafeQueueName(task))
            continue;
        const claimText = readClaimRecord(join(claimedDir, task, "claim.md"));
        if (claimText === null)
            continue;
        // Defense-in-depth (CR-02): the design writes EXACTLY ONE `at:` line. More than one is a
        // tampered/malformed record (the on-disk signature of a `by`-injection that smuggled a forged
        // `at:`). Do NOT trust the first match — treat the claim as compromised and reclaim it, rather
        // than leaving it un-sweepable forever.
        const record = claimRecordFields(claimText);
        if (record.kind === "no-at")
            continue; // cannot judge staleness; leave the claim alone
        if (record.kind === "record") {
            const at = Date.parse(record.at);
            if (Number.isNaN(at))
                continue; // unparseable timestamp → leave it alone (conservative)
            if (now - at <= ttlMs)
                continue; // fresh (within TTL) → leave it alone
        }
        // Reclaim: stale-by-TTL OR tampered (multi-`at`). Return the subtask to pending/ (atomic
        // rename) BEFORE releasing the claim dir, then remove the claim directory. Wall-clock only —
        // no liveness probe.
        const subtask = join(claimedDir, task, `${task}.md`);
        if (queueEntry(subtask) !== null) {
            atomicRename(subtask, join(queueRoot, "pending", `${task}.md`));
        }
        rmSync(join(claimedDir, task), { recursive: true, force: true });
        reclaimed.push(task);
    }
    return reclaimed;
}
export function sweepQueue(queueRoot, ttlMs, now = Date.now()) {
    const claimedDir = join(queueRoot, "claimed");
    const released = [];
    if (queueEntry(claimedDir) !== null) {
        for (const task of readdirSync(claimedDir)) {
            if (!isSafeQueueName(task))
                continue;
            if (readClaimRecord(join(claimedDir, task, "claim.md")) === null)
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
export function claimedCount(queueRoot) {
    const entries = readdirSync(join(queueRoot, "claimed"), { withFileTypes: true });
    return entries.filter((entry) => !(entry.name.startsWith(".") && entry.isFile())).length;
}
export function freeSlots(wipLimit, claimed) {
    return Math.max(0, wipLimit - claimed);
}
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
export function noteSinceClaim(claimAt, noteAts) {
    const claimed = Date.parse(claimAt);
    if (Number.isNaN(claimed))
        return false;
    return noteAts.some((noteAt) => Date.parse(noteAt) >= claimed);
}
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
export function renderNowRunning(queueRoot) {
    const claimedDir = join(queueRoot, "claimed");
    const rows = [];
    if (queueEntry(claimedDir) !== null) {
        for (const task of readdirSync(claimedDir)) {
            // Defensive: never read through an unsafe segment.
            if (!isSafeQueueName(task))
                continue;
            const claimText = readClaimRecord(join(claimedDir, task, "claim.md"));
            if (claimText === null)
                continue;
            // A multi-`at` record is tampered: skip it, and never emit a forged second line as a trusted
            // row. A record with no `at` cannot be placed on the timeline: skip it too.
            const record = claimRecordFields(claimText);
            if (record.kind !== "record")
                continue;
            rows.push({ task, by: record.by, agent: record.agent, level: record.level, at: record.at });
        }
    }
    // Deterministic order: by `at` (ISO lexicographic), then by `task` as a stable tiebreak.
    rows.sort((a, b) => (a.at !== b.at ? a.at.localeCompare(b.at) : a.task.localeCompare(b.task)));
    const md = [];
    md.push("<!-- GENERATED — do not hand-edit. Re-run: node tools/grugops/claim.js now-running -->");
    md.push("# Now running");
    md.push("");
    md.push("| task | by | agent | level | since |");
    md.push("| --- | --- | --- | --- | --- |");
    for (const r of rows) {
        md.push(`| ${cell(r.task)} | ${cell(r.by)} | ${cell(r.agent)} | ${cell(r.level)} | ${cell(r.at)} |`);
    }
    md.push(""); // trailing element → exactly one final "\n"
    atomicWrite(join(queueRoot, "now-running.md"), md.join("\n"));
}
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeTask(task) {
    // Reject empty, `.`/`..`, path separators, absolute paths, and anything outside the allowlist.
    if (!TASK_NAME_RE.test(task) || task === "." || task === "..") {
        throw new Error(`context-io: invalid task name "${task}" — must match ^[A-Za-z0-9._-]+$ ` +
            "(no path separators, no .., no absolute paths)");
    }
}
export function isRecognizedFrontmatterLine(line) {
    if (line.trim() === "")
        return true; // blank
    if (/^refs:\s*$/.test(line))
        return true; // refs: block header
    if (/^\s*-\s+/.test(line))
        return true; // refs: list item shape
    if (/^([A-Za-z_]+):\s*(.*)$/.test(line))
        return true; // column-0 key: value scalar
    return false;
}
export function parseNote(text) {
    // Normalize CRLF/CR to LF before matching the fence so a git-autocrlf (Windows) note parses
    // identically to its LF form. Without this, the fence regex (anchored on \n) misses a CRLF note,
    // parseNote returns null, readContext silently drops it, and admit() wrongly refuses a real
    // §14-gate verdict (CR-01). parseNote is the single choke point feeding both validate() and
    // readContext, so normalizing here aligns the text and admission paths in one place.
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m)
        return null; // no frontmatter fence → caller treats as a structural fail
    const fmLines = m[1].split("\n");
    const body = m[2] ?? "";
    const scalars = {};
    const seen = new Set();
    const dupes = new Set();
    // Non-recognized in-fence line shapes (CMP-02 round-5, IN-02). Records the exact offending line
    // text so validate() and the carve-out oracle can name each one. The recognized set is exactly:
    // a blank line, the `refs:` block header, a `refs:` list item consumed under a header, and a
    // column-0 `key: value` scalar. Everything else inside the fence is malformed.
    const malformed = [];
    let refs = [];
    for (let i = 0; i < fmLines.length; i++) {
        const line = fmLines[i];
        // A blank (empty-after-trim) line is a recognized, legal shape — skip it.
        if (line.trim() === "")
            continue;
        // A `refs:` key with no inline value starts a YAML list block: consume following `  - x` lines.
        // The `- item` lines are consumed HERE and never reach the kv branch, so the legitimate refs:
        // list block can never register as a duplicate provenance key.
        const refsBlock = line.match(/^refs:\s*$/);
        if (refsBlock) {
            if (seen.has("refs"))
                dupes.add("refs");
            seen.add("refs");
            const collected = [];
            while (i + 1 < fmLines.length && /^\s*-\s+/.test(fmLines[i + 1])) {
                collected.push(fmLines[++i].replace(/^\s*-\s+/, "").trim());
            }
            refs = collected;
            continue;
        }
        const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
        if (kv) {
            const key = kv[1];
            const val = kv[2].trim();
            // Record a duplicate provenance key once. parseNote still keeps the last value (overwrite)
            // for backward-compatible reads; validate() rejects on the recorded duplicate.
            if (seen.has(key))
                dupes.add(key);
            seen.add(key);
            if (key === "refs") {
                // Single-line comma form: `refs: a, b, c` (empty → []).
                refs = val === "" ? [] : val.split(",").map((s) => s.trim()).filter((s) => s !== "");
            }
            else {
                scalars[key] = val;
            }
            continue;
        }
        // CMP-02 round-5: a non-blank fence line that is neither the `refs:` header, a `refs:` list item
        // consumed above, nor a column-0 `key: value` scalar is MALFORMED. A stray `  - item` outside a
        // refs block, a leading-space/tab indented key, a `key : value` (space before the colon) line,
        // and any junk line all land here. The anchored kv regex would silently project each to "" with
        // no signal; recording it lets validate() and the carve-out oracle fail closed on the LINE SHAPE.
        //
        // IN-02 single-source coupling: a line reaches this branch only when it is NOT blank, NOT the
        // refs header, NOT a refs list item consumed above, and NOT a column-0 `key: value` scalar. The
        // shared isRecognizedFrontmatterLine predicate is the canonical statement of the
        // blank / refs-header / list-item-shape / column-0-kv grammar, and splitNotes keys its
        // recovered-note boundary on that SAME predicate so the splitter cannot drift from the parser.
        // The ONLY recognized-SHAPE line that still reaches here is a STRAY list item (recognized shape,
        // malformed context — a `- x` outside a refs block); every other line here is also
        // !isRecognizedFrontmatterLine. We assert that invariant (it documents and pins the coupling and
        // never trips on real input, so parseNote's recorded-malformed set is unchanged).
        const isStrayListItem = /^\s*-\s+/.test(line);
        if (!isStrayListItem && isRecognizedFrontmatterLine(line)) {
            throw new Error(`context-io.parseNote: internal invariant violated — line "${line}" reached the malformed ` +
                "branch yet is a recognized frontmatter line (splitNotes/parseNote grammar drift, IN-02).");
        }
        malformed.push(line);
    }
    // Route the parsed `kind` THROUGH the single-source authority (round-8 GAP-R7-1 Lever-1). This is
    // behavior-identical to the kv loop's existing `.trim()` (the value is already trimmed) — its sole
    // purpose is to make parseNote consult the SAME helper the gate (isGatedNote / the hook / the server)
    // consults, so the store's kind view and the gate's kind view cannot drift. The existing parseNote
    // tests stay green (this is a proven no-op on the persisted value).
    if (scalars.kind !== undefined)
        scalars.kind = normalizeKind(scalars.kind);
    return { scalars, refs, body, duplicateKeys: [...dupes], malformedLines: malformed };
}
export const CANONICAL_READ_POSITION = "absent, or a regular file";
export const NOTE_FILE_MAX_BYTES = 8 * 1024 * 1024;
export const READ_POSITION_CONDITIONS = ["unopenable", "not-a-regular-file", "above-ceiling"];
export class ReadPositionRefusal extends Error {
    condition;
    constructor(condition, message) {
        super(message);
        this.name = "ReadPositionRefusal";
        this.condition = condition;
    }
}
export function readRegularFileOrNull(path, maxBytes, position) {
    let fd;
    try {
        fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
    }
    catch (e) {
        const code = e.code;
        // ENOENT from open(2) is null. It does NOT prove that nothing is there: open(2) follows a link
        // and reports a dangling link's missing TARGET as ENOENT too, so this reader cannot tell a
        // missing path from a dangling link (plan 37-30, D-18). A caller that needs the absence answer
        // asks entryPresence first, and treats a null from here after a "present" answer as a path that
        // vanished, never as absence.
        if (code === "ENOENT")
            return null;
        // Any other open failure — EACCES, ELOOP, ENXIO (a socket) — means the path is present and
        // unopenable. Fail closed, naming the position rather than surfacing a bare errno the caller
        // cannot place.
        throw new ReadPositionRefusal("unopenable", `context-io: the ${position} "${path}" IS present and could not be opened (${code ?? "unknown"}) ` +
            `— it is refused rather than read. The canonical form for this position is ` +
            `${CANONICAL_READ_POSITION}.`);
    }
    try {
        const st = fstatSync(fd);
        // TWO CONDITIONS, TWO NAMES (31-29, CR-19). The shape branch and the ceiling branch used to be
        // reported to callers as one undifferentiated failure, so `writeNoteFile` published its SHAPE
        // clause — "is not absent, or a regular file" — for a 9,437,353-byte REGULAR file. Each branch
        // now carries the condition it actually met, and each caller names its own clause from it.
        if (!st.isFile()) {
            throw new ReadPositionRefusal("not-a-regular-file", `context-io: the ${position} "${path}" is not a regular file — it is refused rather than ` +
                `read, because reading a FIFO, a device, a socket or a directory can block forever and a ` +
                `program that never answers refuses nothing. The canonical form for this position is ` +
                `${CANONICAL_READ_POSITION}.`);
        }
        if (st.size > maxBytes) {
            throw new ReadPositionRefusal("above-ceiling", `context-io: the ${position} "${path}" is ${st.size} bytes, above the ${maxBytes}-byte ` +
                `ceiling — refused rather than read. It IS a regular file; what disqualifies it is its ` +
                `size and nothing else.`);
        }
        // The read is bounded by the size fstat just reported on this same descriptor.
        const buf = Buffer.allocUnsafe(Number(st.size));
        let off = 0;
        while (off < buf.length) {
            const n = readSync(fd, buf, off, buf.length - off, off);
            if (n === 0)
                break;
            off += n;
        }
        return buf.subarray(0, off).toString("utf8");
    }
    finally {
        closeSync(fd);
    }
}
export const NOTE_SEAL_KEY = "seal";
const NOTE_SEAL_DOMAIN = "grugops-note-seal-v1";
export const NOTE_SEAL_RE = /^sha256:[0-9a-f]{64}$/;
function normalizeLineEndings(text) {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
export function noteSeal(unsealedText) {
    const h = createHash("sha256");
    h.update(NOTE_SEAL_DOMAIN, "utf8");
    h.update(Buffer.from([0]));
    h.update(normalizeLineEndings(unsealedText), "utf8");
    return `sha256:${h.digest("hex")}`;
}
export function sealVerdict(text) {
    const normalized = normalizeLineEndings(text);
    const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m)
        return { ok: false, reason: "absent" };
    const fmLines = m[1].split("\n");
    // A column-0 `<key>:` line. Spelled from the key and a character test rather than from a literal
    // or a template, so the S5 derivation (which counts every spelling of the seal key's line shape)
    // sees ONE emitter in this module and this reader is not it.
    const isSealLine = (line) => line.startsWith(NOTE_SEAL_KEY) && line.charAt(NOTE_SEAL_KEY.length) === ":";
    const sealIndexes = [];
    for (let i = 0; i < fmLines.length; i++) {
        if (isSealLine(fmLines[i]))
            sealIndexes.push(i);
    }
    if (sealIndexes.length === 0)
        return { ok: false, reason: "absent" };
    if (sealIndexes.length > 1)
        return { ok: false, reason: "malformed" };
    const at = sealIndexes[0];
    if (at !== fmLines.length - 1)
        return { ok: false, reason: "malformed" };
    const sealLine = fmLines[at];
    const value = sealLine.slice(NOTE_SEAL_KEY.length + 1).trim();
    if (!NOTE_SEAL_RE.test(value))
        return { ok: false, reason: "malformed" };
    // Strip the seal line by position: the fence body `m[1]` begins at offset 4 (after `---\n`), and
    // the seal line is its last line, followed by `\n---`. Removing `<line>\n` there yields exactly the
    // text `composeNote` sealed.
    const start = 4 + (m[1].length - sealLine.length);
    const unsealed = normalized.slice(0, start) + normalized.slice(start + sealLine.length + 1);
    return noteSeal(unsealed) === value ? { ok: true } : { ok: false, reason: "mismatch" };
}
export const NOTE_SKIP_ARMS = ["unparseable", ...READ_POSITION_CONDITIONS, "vanished", "unsealed"];
function presenceCode(e) {
    const code = e?.code;
    return typeof code === "string" && code !== "" ? code : "unknown";
}
export function entryPresence(path) {
    const full = resolve(path);
    const top = parse(full).root;
    // Every prefix from the filesystem root to the path itself, so one lstat, one stat and one realpath answer for
    // every component.
    const prefixes = [top];
    for (const name of full.slice(top.length).split(sep)) {
        if (name !== "")
            prefixes.push(join(prefixes[prefixes.length - 1], name));
    }
    for (let i = 0;; i += 1) {
        const at = prefixes[i];
        const last = i === prefixes.length - 1;
        let entry;
        try {
            entry = lstatSync(at);
        }
        catch (e) {
            const code = presenceCode(e);
            if (code === "ENOENT")
                return { kind: "absent" };
            return { kind: "unreadable", code, reason: `"${at}" cannot be inspected (${code})`, link: false };
        }
        // A link is followed with a stat. The last component is stat'ed whatever it is, so `target` is always what the
        // path names, and the one stat site is reached under every caller.
        let target = entry;
        if (entry.isSymbolicLink() || last) {
            try {
                target = statSync(at);
            }
            catch (e) {
                const code = presenceCode(e);
                return {
                    kind: "unreadable",
                    code,
                    reason: !entry.isSymbolicLink()
                        ? `"${at}" cannot be inspected (${code})`
                        : last
                            ? `it is a symbolic link whose target cannot be reached (${code})`
                            : `a symbolic link on the path has a target that cannot be reached: "${at}" (${code})`,
                    // The path's own lstat showed a link only when this is the last component and it is one (IN-11).
                    link: last && entry.isSymbolicLink(),
                };
            }
        }
        if (!last) {
            if (!target.isDirectory()) {
                return { kind: "unreadable", code: "ENOTDIR", reason: `"${at}" on the path is not a directory (ENOTDIR)`, link: false };
            }
            continue;
        }
        let real;
        try {
            real = realpathSync(at);
        }
        catch (e) {
            const code = presenceCode(e);
            return { kind: "unreadable", code, reason: `"${at}" cannot be resolved (${code})`, link: entry.isSymbolicLink() };
        }
        return { kind: "present", entry, target, real };
    }
}
export function isWithin(real, boundary) {
    const prefix = boundary.endsWith(sep) ? boundary : `${boundary}${sep}`;
    return real === boundary || real.startsWith(prefix);
}
export const ROOT_CHAIN_LINK_REFUSAL = "is a symbolic link, and no symbolic link below the repository root is followed on the way to a state path";
export function rootChainOf(rel) {
    const refuse = (why) => {
        throw new Error(`context-io: the state path ${JSON.stringify(rel)} is not a repository-relative path: ${why}`);
    };
    if (rel === "")
        refuse("it is empty");
    if (rel.includes("\\"))
        refuse("it holds a backslash");
    if (rel.startsWith("/"))
        refuse("it has a leading slash");
    if (rel.endsWith("/"))
        refuse("it has a trailing slash");
    const segments = rel.split("/");
    const out = [];
    for (const segment of segments) {
        if (segment === "")
            refuse("it has an empty segment");
        if (segment === "." || segment === "..")
            refuse(`it has a ${JSON.stringify(segment)} segment`);
        out.push(out.length === 0 ? segment : `${out[out.length - 1]}/${segment}`);
    }
    return out;
}
export function rootChainPresence(realRoot, rel, leaf) {
    const chain = rootChainOf(rel);
    for (let i = 0;; i += 1) {
        const prefix = chain[i];
        const at = join(realRoot, ...prefix.split("/"));
        const last = i === chain.length - 1;
        let entry;
        try {
            entry = lstatSync(at);
        }
        catch (e) {
            const code = presenceCode(e);
            if (code === "ENOENT")
                return { kind: "absent" };
            return { kind: "unreadable", code, reason: `"${prefix}" cannot be inspected (${code})` };
        }
        if (entry.isSymbolicLink() && (!last || leaf === "directory")) {
            return { kind: "link", rel: prefix, reason: `${prefix} ${ROOT_CHAIN_LINK_REFUSAL}` };
        }
        if (!last) {
            if (!entry.isDirectory()) {
                return { kind: "unreadable", code: "ENOTDIR", reason: `"${prefix}" on the path is not a directory (ENOTDIR)` };
            }
            continue;
        }
        let target;
        try {
            target = statSync(at);
        }
        catch (e) {
            const code = presenceCode(e);
            return {
                kind: "unreadable",
                code,
                reason: entry.isSymbolicLink()
                    ? `it is a symbolic link whose target cannot be reached (${code})`
                    : `"${prefix}" cannot be inspected (${code})`,
            };
        }
        let real;
        try {
            real = realpathSync(at);
        }
        catch (e) {
            const code = presenceCode(e);
            return { kind: "unreadable", code, reason: `"${prefix}" cannot be resolved (${code})` };
        }
        if (!isWithin(real, realRoot))
            return { kind: "outside", real };
        return { kind: "present", entry, target, real };
    }
}
function codedError(message, code) {
    const err = new Error(message);
    err.code = code;
    return err;
}
function readRawNotesWithSkips(task, contextRoot, boundary = null) {
    assertSafeTask(task);
    const notesDir = join(contextRoot, task, "notes");
    // ONLY AN LSTAT ENOENT IS ABSENCE (plan 37-28, D-18, CR-03, IN-06). The question is entryPresence's, the one
    // owner: a missing notes directory is a task with no notes, and anything else that stops the read throws and
    // reaches the trace model as a failed task. The stat this replaced (plan 37-21) answered undefined for ENOTDIR
    // and for a dangling link as well as for ENOENT, so its premise ("a missing path only") was false (IN-06), and a
    // dangling `notes` link read as a task with no notes (CR-03).
    const presence = entryPresence(notesDir);
    if (presence.kind === "absent")
        return { notes: [], skipped: [] };
    if (presence.kind === "unreadable") {
        throw codedError(`context-io: the notes directory "${notesDir}" could not be read: ${presence.reason}`, presence.code);
    }
    if (!presence.target.isDirectory()) {
        throw codedError(`context-io: the notes directory "${notesDir}" is not a directory (ENOTDIR)`, "ENOTDIR");
    }
    if (boundary !== null && !isWithin(presence.real, boundary)) {
        // Plan 37-38 (D-20): the refusal names the notes directory, as every other refusal of this walk does; until then
        // it said only "its notes directory", so a reader saw the task and not the position (the READ-1 shape table's
        // outside-link cells found it).
        throw new Error(`context-io: the notes directory "${notesDir}" resolves outside the repository root, so it was not read`);
    }
    const skipped = [];
    const out = [];
    for (const file of readdirSync(notesDir)) {
        if (!file.endsWith(".md"))
            continue;
        // THE THIRD CALLER-INFLUENCED READ POSITION IN THIS MODULE (31-21, CR-12 / D-24). CR-12 named
        // the write chokepoint and the ledger look. This walk is the third: what it reads is whatever a
        // notes/ DIRECTORY lists, and a directory's contents are exactly what a caller can add a name
        // to. Measured with the first two positions already closed, a `mkfifo` at
        // `<ctx>/<task>/notes/<anything>.md` still wedged `readContext`, `render`, `currentState` AND
        // `promoteAdmitted`'s destination-liveness clause — CR-12 surviving at a position the finding
        // did not name. Closing only the two named reads would have satisfied the review and left D-24's
        // own rule false, which is the failure shape five rounds of this phase have paid for.
        //
        // THE DISPOSITION IS SKIP, AND IT IS A DECISION RATHER THAN A DEFAULT. This walk already skips a
        // file that does not PARSE rather than crashing, because one malformed file must not make a
        // whole task's context unreadable. A position occupied by a FIFO, a device or a directory is not
        // a note by that same argument, so it is skipped by the same rule. Throwing here would let one
        // planted FIFO deny `render` and `currentState` for the entire task — trading a hang for a
        // denial one register over. The WRITE side stays loud: `writeNoteFile` refuses that position BY
        // NAME, so nothing can be written over it and nothing is silently replaced. The residual — that
        // a skip is quiet on a surface whose whole value is legibility — is named in D-24.
        // THREE ARMS, EACH NAMED, EACH COUNTED (31-29, IN-14 / R-31-21-02). The disposition is still
        // SKIP — throwing would let one planted FIFO deny `render` and `currentState` for a whole task,
        // trading a hang for a denial one register over — but a skip is no longer SILENT.
        let text;
        try {
            const raw = readRegularFileOrNull(join(notesDir, file), NOTE_FILE_MAX_BYTES, "note file");
            if (raw === null) {
                // `open(2)` answered ENOENT. Two conditions reach here and the arm's docstring names both:
                // a file listed by `readdir` and deleted before it was opened, and a DANGLING SYMLINK whose
                // ENOENT is about its target.
                skipped.push({ file, arm: "vanished", detail: "" });
                continue;
            }
            text = raw;
        }
        catch (e) {
            // ── THE ARM IS READ FROM THE AUTHORITY, NEVER RE-DERIVED HERE (31-33, CR-24 / D-34). ──────
            //
            // `D-31 (3)` put the condition on the error with a stated reason: "carrying the condition on
            // the error is what lets a caller name its own clause WITHOUT re-deriving the fact." This
            // caller — the one `IN-14` was raised about — discarded it and hand-labelled all three
            // conditions `not-a-regular-file`. A caller that re-labels every condition with one arm has
            // re-derived the fact, and re-derived it WRONGLY, on the one surface whose whole stated value
            // is legibility: the row a human reads when a note that was admitted has become unreadable.
            // Reproduced before the fix — an EACCES file and an 8,388,609-byte REGULAR file both filed
            // under `not-a-regular-file`, the second row's detail contradicting its own arm.
            //
            // THE FALLBACK IS ONE EXPLICITLY NAMED ARM, not a label per catch. Anything reaching here
            // that is not a `ReadPositionRefusal` — an EIO from `fstat`, an allocation failure — is a
            // position that could not be opened or read as far as this walk is concerned, which is what
            // `unopenable` means. Naming it once is the difference between a fallback and a second
            // classifier.
            const arm = e instanceof ReadPositionRefusal ? e.condition : "unopenable";
            skipped.push({ file, arm, detail: e.message });
            continue;
        }
        const parsed = parseNote(text);
        if (!parsed) {
            // A file that is never a note — an editor backup, a stray `.md`. One malformed file must not
            // make a whole task's context unreadable, so it is skipped rather than thrown on.
            skipped.push({ file, arm: "unparseable", detail: "" });
            continue;
        }
        // THE SEAL IS ASKED HERE, IN THE ONE WALK, AND ONLY HERE (plan 33-25, KIT (b)). A note the
        // sanctioned writer did not compose — a hand-written note, a pre-seal note, an edited note — is
        // refused by name and counted under `unsealed`, with the predicate's own word as the detail. The
        // disposition is SKIP like the other arms: one planted file must not make a whole task's context
        // unreadable, and the write side stays loud. Measured on the held round-1 capture before this
        // change: nine `Write`-tool notes read as nine records; after it, nine `unsealed`/`absent` rows.
        const seal = sealVerdict(text);
        if (!seal.ok) {
            skipped.push({ file, arm: "unsealed", detail: seal.reason });
            continue;
        }
        // Prefer the explicit frozen `id:` field; fall back to the filename-derived id when absent (a
        // pre-id note). When BOTH are present they must agree — a frontmatter id diverging from its
        // filename is the on-disk signature of a tampered identity, so the filename (the storage key)
        // wins for the read and the divergence is left for validate() to surface on the explicit path.
        const fileId = file.replace(/\.md$/, "");
        const s = parsed.scalars;
        out.push({ id: s.id && s.id !== "" ? s.id : fileId, text, parsed });
    }
    return { notes: out, skipped };
}
function recordFromParsed(parsed, id) {
    const s = parsed.scalars;
    return {
        id,
        kind: s.kind ?? "",
        by: s.by ?? "",
        at: s.at ?? "",
        verified_by: s.verified_by ?? "",
        confidence: s.confidence ?? "",
        refs: parsed.refs,
        supersedes: s.supersedes && s.supersedes !== "" ? s.supersedes : null,
        // The evidence-provenance projection (Phase 31). parseNote's open scalar map already ACCEPTS
        // these keys, so no parser change was needed — but a scalar the parser accepted and this
        // projection dropped is a scalar admit() cannot read, and admit()'s D-03 branch reads the
        // matched verdict's `sha` through exactly this record. Absent stays `undefined` rather than
        // "" so "the verdict recorded no SHA" and "the verdict recorded an empty SHA" are one case
        // for the refusal below to name.
        sha: s.sha ?? undefined,
        gate_run: s.gate_run ?? undefined,
        content_hash: s.content_hash ?? undefined,
        body: parsed.body.trim(),
    };
}
export function normalizeKind(raw) {
    return (raw ?? "").trim();
}
// </runnable-embeds>
/** The queue change that stands, once one was made; read by the two messages below. */
let queueChange = "";
/** True once this run created a queue directory: no task moved, but the tree is not what it was. */
let createdQueueDirs = false;
// EXIT-1 (plan 37-20): a throw that escapes every inner catch is could-not-run, never the outcome code. Registered
// before argv is read, and every binding the handler reads is declared above it.
process.on("uncaughtException", (e) => stoppedUnexpectedly(e));
/**
 * The command stopped on an unexpected throw: one sanitized line on stderr, nothing on stdout, exit 2. It never says
 * nothing changed once `queueChange` is set, because the render that follows a queue change can be what threw.
 */
function stoppedUnexpectedly(e) {
    const message = e instanceof Error ? e.message : String(e);
    const stands = whatStands();
    process.stderr.write(`Error: the queue tool stopped unexpectedly (${printable(message)}).${stands === "" ? "" : ` ${printable(stands)}`} ` +
        "The command did not finish.\n");
    process.exit(2);
}
/** What this run left behind, in one sentence, or the empty string when it left nothing. */
function whatStands() {
    if (queueChange !== "")
        return queueChange;
    return createdQueueDirs ? "Empty queue directories were created, and no task moved." : "";
}
/** One value made safe to print: the embedded rule removes every C0, C1 and DEL code point. */
function printable(value) {
    return stripControlChars(value, false);
}
/** The command could not run: one sanitized message on stderr, nothing on stdout, exit 2. Never a pass. */
function couldNotRun(message) {
    const stands = whatStands();
    process.stderr.write(`Error: ${printable(message)} ${stands === "" ? "The queue was not changed." : printable(stands)}\n`);
    process.exit(2);
}
/** The errno code of a thrown filesystem error, for a message. */
function codeOf(e) {
    return e.code ?? "unknown error";
}
const USAGE = "Usage: node claim.js claim <task> --by <adapter> [--level <level>] [--root <dir>] | " +
    "node claim.js done <task> [--root <dir>] | node claim.js now-running [--root <dir>] | " +
    "node claim.js sweep [--root <dir>] | node claim.js free [--root <dir>]";
/** The config file under .grugops/. install/state-layout.ts has no constant for it, so it is typed here, once. */
const CONFIG_NAME = "factory.config.json";
/** The in-flight log this program renders. */
const NOW_RUNNING_REL = `${QUEUE_REL}/now-running.md`;
/** The largest queue record this program reads, in bytes: a reader ceiling, as a claim record is a few lines. */
const RECORD_CEILING_BYTES = 1024 * 1024;
/** How many unsealed notes a `not-done` line names before it says how many more there are. */
const MAX_NAMED_NOTES = 10;
/** One minute, for the stale TTL, which the config gives in minutes. */
const MINUTE_MS = 60_000;
/** What each command takes on the command line. */
const COMMANDS = new Map([
    ["claim", { task: true, flags: ["--by", "--level", "--root"] }],
    ["done", { task: true, flags: ["--root"] }],
    ["now-running", { task: false, flags: ["--root"] }],
    ["sweep", { task: false, flags: ["--root"] }],
    ["free", { task: false, flags: ["--root"] }],
]);
const args = process.argv.slice(2);
const command = args[0];
if (command === undefined)
    couldNotRun(`no command was given. ${USAGE}.`);
const spec = COMMANDS.get(command);
if (spec === undefined)
    couldNotRun(`unknown command ${command}. ${USAGE}.`);
const flags = new Map();
const positional = [];
for (let i = 1; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
        positional.push(arg);
        continue;
    }
    if (!spec.flags.includes(arg))
        couldNotRun(`unknown option ${arg}. ${USAGE}.`);
    if (flags.has(arg))
        couldNotRun(`${arg} was given more than once. ${USAGE}.`);
    const value = args[i + 1];
    if (value === undefined || value.startsWith("--"))
        couldNotRun(`${arg} needs a value. ${USAGE}.`);
    flags.set(arg, value);
    i += 1;
}
if (positional.length !== (spec.task ? 1 : 0)) {
    couldNotRun(`${command} takes ${spec.task ? "one task" : "no task"}; it was given ${positional.length}. ${USAGE}.`);
}
/** The real path of the repository root. */
function resolvedRoot() {
    const rootArg = flags.get("--root");
    if (rootArg === "")
        couldNotRun(`--root needs a value. ${USAGE}.`);
    try {
        return nodeFs.realpathSync(rootArg ?? process.cwd());
    }
    catch (e) {
        return couldNotRun(`the repository root ${rootArg ?? "."} cannot be resolved (${codeOf(e)}).`);
    }
}
/** Why an answer of the root-chain owner is not a usable directory, or null when it is one. */
function directoryProblem(presence) {
    if (presence.kind === "absent")
        return "nothing is there";
    if (presence.kind === "unreadable" || presence.kind === "link")
        return presence.reason;
    if (presence.kind === "outside")
        return "it resolves outside the repository root";
    return presence.target.isDirectory() ? null : "it is not a directory";
}
const root = resolvedRoot();
const stateDirProblem = directoryProblem(rootChainPresence(root, GRUGOPS_DIR_REL, "directory"));
if (stateDirProblem !== null) {
    couldNotRun(`${root} has no usable ${GRUGOPS_DIR_REL} directory (${stateDirProblem}). ` +
        "Run from the repository root, or pass --root <dir>.");
}
const queueRoot = nodePath.join(root, QUEUE_REL);
/**
 * Makes sure the queue directory and its three stages are real directories. The installer seeds no queue, and claimPending
 * needs the claimed/ parent. Each is created only on an `absent` answer, and asked again afterwards, so a directory another
 * claimant created first (EEXIST) is judged, not assumed. The answer that is judged is the last one asked: a failed first
 * ask is refused here, because a second ask that happened to pass would turn a failed read into a pass (READ-1).
 */
function ensureQueueDirs() {
    for (const rel of [QUEUE_REL, QUEUE_PENDING_REL, QUEUE_CLAIMED_REL, QUEUE_DONE_REL]) {
        let presence = rootChainPresence(root, rel, "directory");
        if (presence.kind === "absent") {
            try {
                nodeFs.mkdirSync(nodePath.join(root, rel));
                createdQueueDirs = true;
            }
            catch (e) {
                if (codeOf(e) !== "EEXIST")
                    couldNotRun(`${rel} could not be created (${codeOf(e)}).`);
            }
            presence = rootChainPresence(root, rel, "directory");
        }
        const problem = directoryProblem(presence);
        if (problem !== null)
            couldNotRun(`${rel} cannot be used: ${problem}.`);
    }
}
/**
 * Renders the in-flight log after `change`, a queue change that stands whatever the render does. `queueChange` carries
 * the change before the render starts, so a stop inside the render names the change and says the log is behind it. The
 * empty string means nothing moved, so a stop has no change to name.
 */
function renderAfter(change) {
    queueChange = change === "" ? "" : `${change} ${NOW_RUNNING_REL} was not rendered.`;
    renderNowRunning(queueRoot);
    queueChange = change;
}
/** `claim`: the rules are all claimPending's; this maps its outcome to the contract. */
function runClaim(task) {
    const by = flags.get("--by");
    if (by === undefined)
        couldNotRun(`claim needs --by <adapter>. ${USAGE}.`);
    ensureQueueDirs();
    let outcome;
    try {
        outcome = claimPending(queueRoot, task, by, flags.get("--level"));
    }
    catch (e) {
        couldNotRun(`${e.message}.`);
    }
    if (outcome.kind === "refused")
        couldNotRun(`${outcome.reason}.`);
    if (outcome.kind === "lost") {
        process.stdout.write(`lost ${printable(task)}\n`);
        process.exitCode = 1;
        return;
    }
    renderAfter(`${task} was claimed by ${by} and stays claimed.`);
    process.stdout.write(`claimed ${printable(task)} by ${printable(by)}\n`);
}
/**
 * The text of the queue record at `rel`, or null when nothing is there. The root-chain owner answers with leaf `entry`,
 * and a present entry is judged by its own lstat, so a symbolic link, a FIFO or a directory is refused by name and never
 * opened. A record that vanished after it was seen is refused, never read as absent.
 */
function recordTextOrNull(rel) {
    const presence = rootChainPresence(root, rel, "entry");
    if (presence.kind === "absent")
        return null;
    if (presence.kind === "unreadable")
        couldNotRun(`${rel} cannot be inspected: ${presence.reason}.`);
    if (presence.kind === "link")
        couldNotRun(`${rel} cannot be used: ${presence.reason}.`);
    if (presence.kind === "outside")
        couldNotRun(`${rel} resolves outside the repository root, so it was not read.`);
    if (presence.entry.isSymbolicLink())
        couldNotRun(`${rel} is a symbolic link, so it was not read.`);
    if (!presence.entry.isFile())
        couldNotRun(`${rel} is not a regular file, so it was not read.`);
    let text;
    try {
        text = readRegularFileOrNull(nodePath.join(root, rel), RECORD_CEILING_BYTES, rel);
    }
    catch (e) {
        couldNotRun(`${rel} could not be read (${e.message}).`);
    }
    if (text === null)
        couldNotRun(`${rel} vanished after it was seen.`);
    return text;
}
/**
 * The `queue` dial. An absent config is the documented defaults, with the notes that say so. recordTextOrNull refuses
 * every other position before it opens anything, so a FIFO here is exit 2 and never a hang (T-41-19).
 */
function readQueueConfig() {
    return parseQueueConfig(recordTextOrNull(`${GRUGOPS_DIR_REL}/${CONFIG_NAME}`));
}
/**
 * The notes of `.grugops/context/<folder>/`, read through the embedded walk, so the seal check has one owner. An absent
 * folder is a folder with no notes. Anything else that stops the read is exit 2: a link, a path outside the root, or a
 * throw from the walk never reads as "no notes".
 */
function noteWalk(folder) {
    const rel = `${CONTEXT_REL}/${folder}`;
    const presence = rootChainPresence(root, rel, "directory");
    if (presence.kind === "absent")
        return { ats: [], unsealed: [], others: 0 };
    const problem = directoryProblem(presence);
    if (problem !== null)
        couldNotRun(`${rel} cannot be used: ${problem}.`);
    try {
        const read = readRawNotesWithSkips(folder, nodePath.join(root, CONTEXT_REL), root);
        return {
            ats: read.notes.map((note) => recordFromParsed(note.parsed, note.id).at),
            unsealed: read.skipped.filter((s) => s.arm === "unsealed").map((s) => s.file).sort(),
            others: read.skipped.filter((s) => s.arm !== "unsealed").length,
        };
    }
    catch (e) {
        return couldNotRun(`the notes of ${rel} could not be read (${e.message}).`);
    }
}
/** The one `not-done` line (D-07), which keeps the unsealed notes visible (D-28). */
function notDoneLine(task, folder, at, walk) {
    let line = `not-done ${task}: no sealed note in ${CONTEXT_REL}/${folder}/ since ${at}`;
    if (walk.unsealed.length > 0) {
        const named = walk.unsealed.slice(0, MAX_NAMED_NOTES).join(", ");
        const more = walk.unsealed.length - MAX_NAMED_NOTES;
        line += `; ${walk.unsealed.length} unsealed note(s) found: ${named}${more > 0 ? ` and ${more} more` : ""}`;
    }
    if (walk.others > 0)
        line += `; ${walk.others} other note(s) skipped`;
    return line;
}
/**
 * `done`: the task leaves the in-flight log here and nowhere else. Every read comes before the first move, so each
 * refusal and the `not-done` outcome leave claimed/TASK/ as it was. A subtask that already left claimed/TASK/ goes
 * straight to completeTask, which releases the claim when done/TASK.md exists, because an earlier run stopped between
 * the move and the release.
 */
function runDone(task) {
    try {
        assertSafeQueueTask(task);
    }
    catch (e) {
        couldNotRun(`${e.message}.`);
    }
    const claimDirRel = `${QUEUE_CLAIMED_REL}/${task}`;
    const claimDir = rootChainPresence(root, claimDirRel, "directory");
    if (claimDir.kind === "absent")
        couldNotRun(`no claim directory at ${claimDirRel}/.`);
    const claimDirProblem = directoryProblem(claimDir);
    if (claimDirProblem !== null)
        couldNotRun(`${claimDirRel} cannot be used: ${claimDirProblem}.`);
    const claimRel = `${claimDirRel}/claim.md`;
    const claimText = recordTextOrNull(claimRel);
    if (claimText === null)
        couldNotRun(`${claimDirRel}/ holds no claim record.`);
    const record = claimRecordFields(claimText);
    if (record.kind === "tampered")
        couldNotRun(`the claim record ${claimRel} is tampered: it has more than one at: line.`);
    if (record.kind === "no-at")
        couldNotRun(`the claim record ${claimRel} has no at: value.`);
    if (Number.isNaN(Date.parse(record.at))) {
        couldNotRun(`the claim record ${claimRel} says at: ${record.at}, which is not a timestamp.`);
    }
    const subtaskText = recordTextOrNull(`${claimDirRel}/${task}.md`);
    if (subtaskText !== null) {
        const ref = subtaskRefFolder(subtaskText);
        if (ref.kind === "refused")
            couldNotRun(`${ref.reason}.`);
        const walk = noteWalk(ref.folder);
        if (!noteSinceClaim(record.at, walk.ats)) {
            process.stdout.write(`${printable(notDoneLine(task, ref.folder, record.at, walk))}\n`);
            process.exitCode = 1;
            return;
        }
    }
    ensureQueueDirs();
    queueChange = `${task} may already have moved to done/; run done again to finish.`;
    const outcome = completeTask(queueRoot, task);
    if (outcome.kind === "refused") {
        queueChange = ""; // completeTask refuses only before it moves anything
        couldNotRun(`${outcome.reason}.`);
    }
    renderAfter(`${task} moved to done/ and its claim was released.`);
    process.stdout.write(`done ${printable(task)}\n`);
}
/** `now-running`: render the in-flight log from claimed/. */
function runNowRunning() {
    ensureQueueDirs();
    renderNowRunning(queueRoot);
    process.stdout.write(`rendered ${NOW_RUNNING_REL}\n`);
}
/**
 * `sweep`: the rules are all sweepQueue's. The config is read first, so a config that cannot be read stops this command
 * before anything moves. sweepQueue moves tasks one at a time and reports only at the end, so a throw from it can leave
 * moves behind that this program cannot list; `queueChange` says so before the call, and never that nothing changed.
 */
function runSweep() {
    const config = readQueueConfig();
    ensureQueueDirs();
    queueChange = "The sweep may have moved tasks before it stopped; run sweep again.";
    const swept = sweepQueue(queueRoot, config.stale_ttl_minutes * MINUTE_MS);
    const reclaimed = [...swept.reclaimed].sort();
    const released = [...swept.released].sort();
    const lines = [
        `swept ${reclaimed.length}`,
        ...reclaimed.map((task) => `reclaimed ${task}`),
        ...released.map((task) => `released ${task} (already done)`),
    ];
    renderAfter(lines.length === 1 ? "" : `${lines.slice(1).join(", ")}, and that stands.`);
    for (const note of config.notes)
        if (note.startsWith("queue.stale_ttl_minutes "))
            lines.push(`(${note})`);
    process.stdout.write(lines.map((line) => `${printable(line)}\n`).join(""));
}
/** `free`: the claimed/ count comes from disk on every call, and nothing is written. */
function runFree() {
    const config = readQueueConfig();
    const claimedDir = rootChainPresence(root, QUEUE_CLAIMED_REL, "directory");
    let claimed = 0;
    if (claimedDir.kind !== "absent") {
        const problem = directoryProblem(claimedDir);
        if (problem !== null)
            couldNotRun(`${QUEUE_CLAIMED_REL} cannot be used: ${problem}.`);
        try {
            claimed = claimedCount(queueRoot);
        }
        catch (e) {
            couldNotRun(`${QUEUE_CLAIMED_REL} could not be read (${codeOf(e)}).`);
        }
    }
    let line = `free ${freeSlots(config.wip_limit, claimed)}`;
    if (claimed > config.wip_limit)
        line += ` (${claimed} claimed, wip_limit ${config.wip_limit})`;
    for (const note of config.notes)
        if (note.startsWith("queue.wip_limit "))
            line += ` (${note})`;
    process.stdout.write(`${printable(line)}\n`);
}
if (command === "claim")
    runClaim(positional[0]);
else if (command === "done")
    runDone(positional[0]);
else if (command === "sweep")
    runSweep();
else if (command === "free")
    runFree();
else
    runNowRunning();

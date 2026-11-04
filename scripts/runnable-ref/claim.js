// claim.ts — the host queue tool (phase 41, plan 41-03, RUN-01, RUN-05, D-01, D-02, D-08, D-13).
//
// WHAT IT IS. A kit-shipped runnable in the shape of state-roll.ts: authored here, compiled to a committed claim.js,
// installed to tools/grugops/claim.js and run on a host with only Node present. It is the one program that moves a
// queue record, so each step of Workflow 17 is one command and no agent runs the protocol by hand:
//   - `claim TASK --by ADAPTER [--level LEVEL]` takes pending/TASK.md into claimed/TASK/ and writes the claim record.
//   - `now-running` renders .grugops/queue/now-running.md, the in-flight log, from claimed/.
// A command that changes the queue renders the log before it reports, so the log cannot go stale between steps (D-02).
// It moves queue records and nothing else: it runs no git, pushes, merges or deploys nothing, and writes nowhere
// outside .grugops/queue/.
//
// THE D-12 CONTRACT (D-08).
//   exit 0 → the command did its work; stdout holds one line (`claimed TASK by ADAPTER`,
//            `rendered .grugops/queue/now-running.md`).
//   exit 1 → an outcome to act on, never an error: stdout holds one line (`lost TASK`).
//   exit 2 → could not run or refused: a bad argument, a root with no .grugops directory, a symbolic link or a
//            non-directory on the way to the queue, a task name outside the allowlist, a refused owner, a level outside
//            the closed set, no pending subtask, a task already in done/. Exit 2 prints nothing on stdout and one
//            `Error: ` line on stderr. An unexpected error is exit 2 too, and never surfaces as Node's own exit 1: that
//            line names a queue change that stands, so a failed render never denies a claim that was made.
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
// NOTHING HERE IS RETYPED. The queue paths, the owner rule, the level set, the claim and the render sit in the generated
// region, copied verbatim from install/state-layout.ts, scripts/state-rules.ts, scripts/claim.ts and
// scripts/context-io.ts by scripts/generate-runnable-embeds.ts. scripts/runnable-embeds-freshness.ts fails CI when the
// region differs from a fresh derivation. The part below holds only argv, the root checks, the exit codes and the
// output lines.
//
// Voice: clear professional voice (CLAUDE.md hard rule): this file moves records a human audits.
import * as nodeFs from "node:fs";
import * as nodePath from "node:path";
// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
import { randomUUID } from "node:crypto";
import { closeSync, constants as fsConstants, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, realpathSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
export const RUNNABLE_SET_STAMP = "sha256:5d6f6a0d94ffa4c6a8871d55d961cc81230fab7e5c68c8d02032e574ab55e772";
export const RUNNABLE_SET = Object.freeze(["claim.js", "state-check.js", "state-roll.js", "trace-render.js"]);
export const RUNNABLE_SELF = "claim.js";
// from install/state-layout.ts
export const GRUGOPS_DIR_REL = ".grugops";
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
// from scripts/context-io.ts
export const CANONICAL_READ_POSITION = "absent, or a regular file";
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
function presenceCode(e) {
    const code = e?.code;
    return typeof code === "string" && code !== "" ? code : "unknown";
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
// </runnable-embeds>
/** The queue change that stands, once one was made; read by the unexpected-throw handler below. */
let queueChange = "";
// EXIT-1 (plan 37-20): a throw that escapes every inner catch is could-not-run, never the outcome code. Registered
// before argv is read, and every binding the handler reads is declared above it.
process.on("uncaughtException", (e) => stoppedUnexpectedly(e));
/**
 * The command stopped on an unexpected throw: one sanitized line on stderr, nothing on stdout, exit 2. It never says
 * nothing changed once `queueChange` is set, because the render that follows a queue change can be what threw.
 */
function stoppedUnexpectedly(e) {
    const message = e instanceof Error ? e.message : String(e);
    const stands = queueChange === "" ? "" : ` ${queueChange}`;
    process.stderr.write(`Error: the queue tool stopped unexpectedly (${printable(message)}).${printable(stands)} The command did not finish.\n`);
    process.exit(2);
}
/** One value made safe to print: the embedded rule removes every C0, C1 and DEL code point. */
function printable(value) {
    return stripControlChars(value, false);
}
/** The command could not run: one sanitized message on stderr, nothing on stdout, exit 2. Never a pass. */
function couldNotRun(message) {
    process.stderr.write(`Error: ${printable(message)} The queue was not changed.\n`);
    process.exit(2);
}
/** The errno code of a thrown filesystem error, for a message. */
function codeOf(e) {
    return e.code ?? "unknown error";
}
const USAGE = "Usage: node claim.js claim <task> --by <adapter> [--level <level>] [--root <dir>] | " +
    "node claim.js now-running [--root <dir>]";
/** What each command takes on the command line. */
const COMMANDS = new Map([
    ["claim", { task: true, flags: ["--by", "--level", "--root"] }],
    ["now-running", { task: false, flags: ["--root"] }],
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
 * claimant created first (EEXIST) is judged, not assumed.
 */
function ensureQueueDirs() {
    for (const rel of [QUEUE_REL, QUEUE_PENDING_REL, QUEUE_CLAIMED_REL, QUEUE_DONE_REL]) {
        if (rootChainPresence(root, rel, "directory").kind === "absent") {
            try {
                nodeFs.mkdirSync(nodePath.join(root, rel));
            }
            catch (e) {
                if (codeOf(e) !== "EEXIST")
                    couldNotRun(`${rel} could not be created (${codeOf(e)}).`);
            }
        }
        const problem = directoryProblem(rootChainPresence(root, rel, "directory"));
        if (problem !== null)
            couldNotRun(`${rel} cannot be used: ${problem}.`);
    }
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
    queueChange = `${task} was claimed by ${by} and stays claimed.`;
    renderNowRunning(queueRoot);
    process.stdout.write(`claimed ${printable(task)} by ${printable(by)}\n`);
}
/** `now-running`: render the in-flight log from claimed/. */
function runNowRunning() {
    ensureQueueDirs();
    renderNowRunning(queueRoot);
    process.stdout.write(`rendered ${QUEUE_REL}/now-running.md\n`);
}
if (command === "claim")
    runClaim(positional[0]);
else
    runNowRunning();

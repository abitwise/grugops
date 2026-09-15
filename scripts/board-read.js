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
// argv/env/content-derived"). Every target is additionally RESOLVED TO ITS REAL LOCATION and
// asserted inside the resolved root before it is read, at ONE authority — `insideRoot` below — using
// the refusal shape of `scripts/js-import-closure.ts:74-98`: the walk refuses rather than returning
// short, because a short answer reads as a clean one.
//
// THAT SENTENCE USED TO BE FALSE, AND THE PLACE IT WAS FALSE IS WHY THE AUTHORITY EXISTS (plan
// 32-10, CR-04). The containment test compared a path `resolve()` had normalised LEXICALLY, and
// `resolve()` does not follow symlinks while `readFileSync` does. A link planted at
// `plans/tickets/ZZZ-999.md` therefore passed the test by SPELLING and was opened by its TARGET, and
// the first characters of that target came back out in `readErrors[].message` — a field printed to
// stderr on every frame and embedded in the published `--json` document. `realpathSync` resolves
// every ANCESTOR link as well as the leaf, so a symlinked `plans/` directory and a symlinked ticket
// file are one question asked once, at one place.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — this is a trace surface).
import { existsSync, readFileSync, readdirSync, realpathSync, statSync, } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { joinSnapshot, normalizeDocument, parseBoard, parseTicketDocument, sourceValue, stripHtmlComments, } from "./board-model.js";
import { MAX_WALK_ENTRIES } from "./kit-model.js";
// ── The conflict set (D-10) ──────────────────────────────────────────────────────────────────────
//
// DECLARED IN THE PURE MODULE AND RE-EXPORTED HERE, for the reason recorded above the `SourceState`
// re-export. `joinSnapshot` derives the conflicts and it lives beside the grammar it compares
// against; this module PRODUCES the six source states the join takes, so this is where the set and
// its cardinality are published to a consumer of the read seam.
// `PRESENCE_DEPENDENT_CONFLICT_KINDS` rides with them for the same reason (plan 32-09): the subset
// is a property of the conflict set, and the read seam is what produces the source state that gates
// it, so a consumer of this module can ask both questions without importing the pure module too.
export { CONFLICT_KINDS, CONFLICT_KIND_COUNT, PRESENCE_DEPENDENT_CONFLICT_KINDS, } from "./board-model.js";
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
 * THE AGREEMENT TEST IS OVER BYTES, AND THE DECODE HAPPENS AFTER IT (plan 32-09, CR-03). Both stats
 * report bytes on disk, so the third number must be one too: it is the buffer's own `byteLength`,
 * never a decoded string's re-encoded length. Comparing against a decoded length made this function
 * a detector of INVALID ENCODING wearing the word `torn` — one Latin-1 byte in a file nobody was
 * writing produced a permanent "changed under every read attempt", which is a diagnosis of an event
 * that did not happen. A file whose bytes do not decode is `unreadable` with code `ENCODING`,
 * answered on the FIRST read, because retrying cannot change the bytes.
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
            // RAW BYTES, NO ENCODING ARGUMENT (plan 32-09, CR-03). `readFileSync(path, "utf8")` replaces
            // each invalid byte sequence with U+FFFD, which is three bytes — so the agreement test below
            // compared a stat's byte count against a DECODED string's re-encoded length, and a file
            // carrying one stray byte could never satisfy it. The three numbers compared now are all
            // counts of bytes on disk, so they are comparable by construction.
            const bytes = readFileSync(absPath);
            seam.betweenReadAndStat?.(absPath, attempt);
            const after = statSync(absPath);
            const sizeAgrees = before.size === after.size && after.size === bytes.byteLength;
            const mtimeAgrees = before.mtimeMs === after.mtimeMs;
            if (!(sizeAgrees && mtimeAgrees))
                continue; // a real tear: the file moved under the read
            // DECODE ONLY AFTER AGREEMENT, AND A DECODE FAILURE IS ITS OWN ANSWER.
            //
            // `fatal: true` is what turns an invalid sequence into a thrown error instead of a silent
            // U+FFFD substitution — silence here is what let the size comparison above go wrong in the
            // first place.
            //
            // `ignoreBOM: true` IS LOAD-BEARING. `TextDecoder` strips a leading byte-order mark by
            // default and Node's own utf8 file read does NOT, so without it this change would silently
            // alter the first line of any board a Windows editor saved — a behaviour change nobody asked
            // for, smuggled in under a bug fix. It was measured: no file under `scripts/fixtures/` carries
            // a BOM today (asserted in `scripts/board-read.test.ts`), which is exactly why the regression
            // would have shipped unnoticed.
            //
            // WHAT HAPPENS TO THE MARK AFTERWARDS IS THE GRAMMAR'S ANSWER, NOT THIS SEAM'S (plan 32-16).
            // `normalizeDocument` in `./board-model.js` strips a single leading mark for both grammars,
            // and the three document classes this module parses itself call it at their own parse points.
            // This seam keeps the bytes so its agreement test stays honest; the parsers decide what a
            // document's first line is.
            try {
                return { ok: true, text: new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes) };
            }
            catch (decodeError) {
                // NOT RETRIED, AND NOT ALLOWED TO FALL INTO THE ERRNO CATCH BELOW. The bytes will not become
                // decodable on attempt two, and retrying costs a live screen three reads and six stats per
                // source per refresh forever. The errno catch maps a missing `code` onto the literal
                // `unreadable`, which would report a decoding failure under a code that says nothing about
                // decoding. `unreadable` is the reason because the bytes WERE read and the content could not
                // be used — the sentence `STALE_REASONS` already defines — so no sixth stale reason is added.
                return {
                    ok: false,
                    reason: "unreadable",
                    code: "ENCODING",
                    message: `board-read: ${absPath} could not be decoded as UTF-8 (${decodeError.message}). ` +
                        `The file is not being modified — it is bytes this module cannot use — so it is reported ` +
                        `as unreadable rather than as a torn read, and it is not re-read.`,
                };
            }
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
    if (outcome.kind === "bounded" || outcome.kind === "partial") {
        return {
            state: {
                source: "stale",
                value: outcome.value,
                readAt,
                stale: {
                    // `bounded` is the pinned-reason special case of `partial`; the reason rides the arm.
                    reason: outcome.kind === "bounded" ? "bounded" : outcome.reason,
                    since: sinceOf(previous, readAt),
                },
            },
            // NO ERROR HERE, and that is deliberate for both arms: the value IS this pass's, and the
            // per-entry failure that made it incomplete has already been reported by the caller, which is
            // the only place that knows WHICH entry failed. Adding one here would report the same failure
            // twice under two different paths.
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
    /**
     * The code the refusal is reported under, so a caught refusal keeps the fact it was thrown with.
     *
     * WITHOUT THIS FIELD THE CATCH IS A SWALLOW ONE REGISTER UP (plan 32-10). `guarded` turns a thrown
     * refusal into a `readErrors` entry, and an entry whose code is a constant would report a denied
     * mode and a link out of the tree under the same word — which is CR-02's discarded errno wearing a
     * different hat. `OUTSIDE-ROOT` for an escape, the errno for a resolution failure.
     */
    code;
    constructor(message, code = "unreadable") {
        super(message);
        this.name = "BoardReadError";
        this.code = code;
    }
}
/**
 * The stale reason an errno answers to — ONE spelling, read by every site that meets an errno.
 *
 * The mapping was written out by hand at three sites before this (plan 32-10), and three copies of a
 * two-branch rule is the set-literal drift class this repository has already paid for: a fourth site
 * added later gets whichever copy its author happened to read.
 */
function staleReasonForCode(code) {
    return code === "EACCES" || code === "EPERM" ? "eacces" : "unreadable";
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
 * The code every containment refusal carries, at both path authorities and at `guarded`.
 *
 * A LITERAL DECLARED ONCE rather than spelled at each site: a consumer filtering `readErrors` for
 * escapes asks one question, and three hand-typed copies of a code string is the set-literal drift
 * class this repository has already paid for. It is NOT a sixth `StaleReason` — the reason is the
 * published `unreadable`, because the bytes were not obtained, which is the sentence that reason
 * already defines. `STALE_REASONS` stays at five.
 */
const OUTSIDE_ROOT = "OUTSIDE-ROOT";
/** `target` is inside `root` — strictly inside, so the root itself is not one of its own children. */
function isWithinRoot(root, target) {
    const rel = relative(root, target);
    return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`);
}
/**
 * For a target that does not exist: the deepest ANCESTOR that does, resolved, with the missing tail
 * put back on — or `null` when no ancestor can be vouched for.
 *
 * WHY THE ANCESTOR IS ASKED AT ALL. `realpathSync` on an absent path throws `ENOENT` and tells us
 * nothing about WHERE the path would have been. Answering "absent, therefore fine" on that alone
 * admits `../escape` (which is outside and merely does not exist yet) and, worse, admits
 * `plans/board.md` under a `plans` that is a link out of the tree: the read then returns ENOENT
 * today and reads the attacker's file the moment they create it, which is a check that expires. So
 * the question is asked about the nearest real ancestor, and the caller applies the same containment
 * test to the composed path.
 *
 * An ancestor that fails for any errno OTHER than `ENOENT` — a denied mode, a symlink cycle — is an
 * ancestor this function cannot vouch for, and it returns `null` rather than guessing.
 */
function anchorAbsentTarget(root, target) {
    let probe = dirname(target);
    for (;;) {
        let probeReal;
        try {
            probeReal = realpathSync(probe);
        }
        catch (e) {
            const err = e;
            const parent = dirname(probe);
            if (err.code === "ENOENT" && parent !== probe) {
                probe = parent;
                continue;
            }
            // NOT `OUTSIDE-ROOT`. An ancestor this process cannot open is a permission finding, and
            // reporting it as an escape would send an operator looking for an attacker instead of a mode.
            return { ok: false, code: err.code ?? "unreadable" };
        }
        // The ancestor may BE the root — `plans/` under a tree with no `plans/` yet anchors on the root
        // itself, which is the ordinary fresh-checkout shape and is legitimate.
        if (probeReal !== root && !isWithinRoot(root, probeReal))
            return { ok: false, code: OUTSIDE_ROOT };
        return { ok: true, real: resolve(probeReal, relative(probe, target)) };
    }
}
/**
 * THE ONE PLACE THIS MODULE DECIDES WHETHER A PATH IS INSIDE THE TREE (plan 32-10, CR-04).
 *
 * `root` has ALREADY been through `realpathSync` at `resolveRepoRoot`, and this function puts the
 * target through it too — so both sides of the comparison are real paths and the comparison means
 * something for the first time. Resolving the FULL target resolves every ancestor link as well as
 * the leaf, which is why a symlinked `plans/` directory and a symlinked `plans/tickets/ZZZ-999.md`
 * are not two rules.
 *
 * THREE ARMS, EACH NAMED:
 *
 *   1. The path resolves and the real location is inside the root → admitted, carrying the REAL
 *      path. The caller opens THAT, not the spelling it started with: opening a second path that
 *      merely spells the same thing is how a check made before a link swap stops being a check.
 *
 *   2. The path does not exist (`ENOENT`) → the question is asked about its deepest real ancestor
 *      (above), and an anchored answer inside the root is ADMITTED as the caller's own ENOENT arm to
 *      answer. Refusing here would turn every absent optional source into a fault — the D-13
 *      regression this repository has already paid for once — and a dangling symlink lands here and
 *      is answered as absent, which is what it is.
 *
 *   3. Anything else — a resolved location outside the root, an unvouchable ancestor, an `ELOOP`
 *      cycle, a denied mode on the way down → REFUSED, with a message naming the entry, the
 *      destination it resolved to, and the root. THE MESSAGE CARRIES NO BYTE OF THE TARGET'S
 *      CONTENT. That is the entire finding: content crossed this boundary and left through a field
 *      that is printed to stderr every frame and published in `--json`.
 *
 * SYMLINK INSTALLS ARE THE ONE DELIBERATE BEHAVIOUR CHANGE, AND IT IS MEASURED (D-05, plan 32-10).
 * `install/install.ts` supports an opt-in `--symlink` install mode — copy is the default — so a
 * target repository CAN carry `agent-factory/` as a link into a shared kit. Under that shape
 * `FIXED_SUBPATHS.config` resolves outside the root and is REFUSED. The outcome was measured rather
 * than assumed (`scripts/board-read.test.ts`, "a SYMLINK-INSTALLED `agent-factory/` degrades to
 * lean, visibly"): the config source settles `stale` carrying the LEAN view, ONE `readErrors` entry
 * with code `OUTSIDE-ROOT` names the refusal, the overall discriminant degrades to `stale`, and no
 * byte of the outside dial reaches the document.
 *
 * THE BOUNDARY THIS FUNCTION ENFORCES IS OVER PATHS, AND ONE SHAPE SITS OUTSIDE IT — MEASURED, NOT
 * INFERRED (plan 32-10). A HARD LINK created inside the tree to an inode whose other name is outside
 * it is NOT refused, and the probe that measured this leaked its marker on both channels. There is
 * no path-based rule that could refuse it: a hard link is not a reference to another path, it IS a
 * directory entry for the inode, so `realpathSync` correctly reports a location inside the root and
 * there is no second path to compare against. Refusing on `nlink > 1` was considered and declined —
 * it is a heuristic over a legitimate filesystem property, and this repository has recorded that a
 * heuristic in place of a structural rule is the shape that produces the next round's bypass.
 *
 * WHAT BOUNDS THAT RESIDUAL. Creating the link requires write access to the tree, which is the same
 * access that would let an attacker paste the bytes into a ticket file directly; hard links cannot
 * cross a filesystem; and both Linux (`fs.protected_hardlinks`, on by default) and macOS restrict
 * linking to files the caller may already read. It is recorded here, in this phase's SUMMARY and in
 * `.planning/WINDOWS.md` rather than described as closed. `scripts/board-read.test.ts` pins the
 * MECHANISM — that `realpathSync` of a hard link answers with the in-tree path — so the day that
 * changes, the suite says so.
 *
 * THAT DEGRADATION IS ACCEPTABLE FOR TWO REASONS ALREADY ON THE RECORD, not a rule widened to fit
 * an expectation. `install.ts` states that `agent-factory/config` is deliberately ABSENT from the
 * installed kit — the dial is seeded at `.grugops/factory.config.json` — so the linked shape usually
 * has nothing at this path to read. And `config` is the ONE source with a defined `fallback`,
 * because CLAUDE.md C6 defines what the kit does with no usable dial. A refused dial degrades to
 * lean, visibly; it never silently reads a file outside the tree.
 */
function insideRoot(root, target, what) {
    let real;
    try {
        real = realpathSync(target);
    }
    catch (e) {
        const err = e;
        if (err.code !== "ENOENT") {
            return {
                ok: false,
                code: err.code ?? "unreadable",
                message: `board-read: ${what} ${target} could not be resolved to a real location ` +
                    `(${err.code ?? "unreadable"}). Refusing to read a path this module cannot place inside ` +
                    `the repository root ${root}.`,
            };
        }
        const anchored = anchorAbsentTarget(root, target);
        if (!anchored.ok) {
            return {
                ok: false,
                code: anchored.code,
                message: anchored.code === OUTSIDE_ROOT
                    ? `board-read: ${what} ${target} does not exist and its nearest existing parent is ` +
                        `outside the repository root ${root}. Refusing to read through a path that leaves ` +
                        `the tree, including one whose target has not been created yet.`
                    : `board-read: ${what} ${target} does not exist and a parent of it could not be ` +
                        `inspected (${anchored.code}), so this module cannot place it inside the repository ` +
                        `root ${root}.`,
            };
        }
        real = anchored.real;
    }
    if (!isWithinRoot(root, real)) {
        return {
            ok: false,
            code: OUTSIDE_ROOT,
            message: `board-read: ${what} ${target} resolves to ${real}, which is outside the repository root ` +
                `${root}. Reading through a link that leaves the tree is refused. No byte of that file's ` +
                `content is quoted here, because its content reaching this message is the finding.`,
        };
    }
    return { ok: true, real };
}
/**
 * Join a FIXED LITERAL subpath against the resolved root, asserting it stays inside.
 *
 * The assertion is `insideRoot` — the module's single containment authority — rather than a second
 * spelling of the same comparison. It is kept even though every caller in this module passes a
 * literal from `FIXED_SUBPATHS`: the guard costs one resolution, and it is what stops a future edit
 * from threading a content-derived name through this one chokepoint.
 *
 * A REFUSAL HERE IS ONE SOURCE'S FINDING, NOT THE END OF THE SNAPSHOT. It throws, and `guarded`
 * below turns the throw into that source's own stale arm — because a refusal that blanks the other
 * five sources costs more than the attack it answers (T-32-10-03, D-12).
 */
export function repoSubpath(root, relPath) {
    const target = resolve(join(root, relPath));
    const contained = insideRoot(root, target, `the subpath ${relPath} at`);
    if (!contained.ok)
        throw new BoardReadError(contained.message, contained.code);
    return contained.real;
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
export function listDirectoryBounded(dir) {
    let entries;
    try {
        entries = readdirSync(dir);
    }
    catch (e) {
        const err = e;
        const code = err.code ?? "";
        if (code === "ENOENT")
            return { kind: "absent" };
        return {
            kind: "failed",
            reason: staleReasonForCode(code),
            code: code || "unreadable",
            message: err.message,
        };
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
function listingFailure(dir, listing) {
    return {
        kind: "failed",
        reason: listing.reason,
        code: listing.code,
        message: `${dir} could not be listed (${listing.code}): ${listing.message}`,
    };
}
// ── The read ─────────────────────────────────────────────────────────────────────────────────────
/** The lean view a tree with no usable dial gets (CLAUDE.md C6: run lean when config is unusable). */
const LEAN_CONFIG_VIEW = {
    mode: null,
    idPrefix: null,
    wipLimits: {},
};
/** Lift `settleSource`'s single-error result, optionally carrying per-entry errors beside it. */
function settledFrom(settled, extra = [], unadmitted = []) {
    return {
        state: settled.state,
        errors: settled.error === null ? extra : [settled.error, ...extra],
        unadmitted,
    };
}
/**
 * Run ONE source's reader, turning a containment refusal into THAT source's stale arm (plan 32-10).
 *
 * WHY A REFUSAL MUST NOT BE FATAL. `repoSubpath` throws, which is right — a fixed subpath that
 * leaves the tree is a tree this module cannot vouch for. But `readSnapshot` calls six readers in a
 * row, so an unguarded throw from the first one ends the snapshot and blanks the other five: a
 * single hostile entry would take the whole dashboard down, which costs more than the attack it
 * answers (T-32-10-03). D-12 is explicit that staleness is PER SOURCE with one badge, so a refused
 * source is one badge over five readable ones.
 *
 * ONLY `BoardReadError` IS CAUGHT, AND EVERYTHING ELSE IS RETHROWN. This helper exists to localize a
 * containment refusal. Widening it into a catch-all would hide the next real defect exactly the way
 * the bare `catch` plan 32-09 removed hid this one — the swallow census in
 * `scripts/board-read.test.ts` pins that at zero, and this clause binds and inspects what it caught.
 *
 * THE REPORTED PATH IS THE LEXICAL JOIN, NEVER THE RESOLVED ONE. The whole reason this arm is
 * running is that the resolved location is somewhere this module refused to go; naming the source's
 * own subpath tells the operator which source is dark without publishing where the link pointed a
 * second time (the refusal message already names it once, by design).
 */
function guarded(source, root, readAt, previous, read, fallback) {
    try {
        return read();
    }
    catch (e) {
        if (!(e instanceof BoardReadError))
            throw e;
        const path = join(root, FIXED_SUBPATHS[source]);
        return settledFrom(settleSource(source, path, {
            kind: "failed",
            reason: staleReasonForCode(e.code),
            code: e.code,
            message: e.message,
        }, previous, readAt, fallback));
    }
}
export function childPath(root, dir, name) {
    // THE SEGMENT REJECTIONS STAY FIRST, AND THAT ORDER IS THE RULE. They run before any filesystem
    // access, which is what stops a name nobody vouched for from ever reaching a `join`.
    if (name === "" || name === "." || name === ".." || name.includes("/") || name.includes("\\")) {
        return {
            ok: false,
            code: "unsafe-name",
            // NOT a composed path: the segment is exactly what is being refused, so composing it with its
            // directory here would perform the `join` this arm exists to prevent.
            target: dir,
            message: `board-read: the directory entry \`${name}\` under ${dir} is not a plain path segment. ` +
                `It is refused before any filesystem access, so a name nobody vouched for never reaches a ` +
                `join.`,
        };
    }
    const target = resolve(join(dir, name));
    const contained = insideRoot(root, target, "the directory entry");
    if (!contained.ok) {
        return { ok: false, code: contained.code, message: contained.message, target };
    }
    return { ok: true, path: contained.real };
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
function readBoardSource(root, readAt, previous, seam, idPrefix) {
    const path = repoSubpath(root, FIXED_SUBPATHS.board);
    // THE DIAL IS READ FIRST AND ITS VALUE IS PASSED IN. `id_prefix` is part of what a conforming
    // identifier means (D-02), and the pure module holds no dial, so the seam that reads the dial is
    // the one that hands the value over. A row whose prefix disagrees is reported as an unparsed line
    // — the contract's own answer — rather than as an eighth conflict kind (D-10 closes the set).
    const parse = (text) => parseBoard(text, { idPrefix });
    return settledFrom(settleSource("board", path, gatherFile(path, seam, parse), previous, readAt));
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
    // NORMALIZED AT THE PARSE POINT (plan 32-16). `JSON.parse` throws on a leading byte-order mark, so
    // a dial a Windows editor saved used to badge `unreadable` and drop the whole kit to the lean view
    // over a file whose JSON is valid. The mark is an encoding artefact in this document class for the
    // same reason it is one in the two grammars, and it gets the same one-expression answer.
    const outcome = gatherFile(path, seam, (text) => configView(JSON.parse(normalizeDocument(text))));
    return settledFrom(settleSource("config", path, outcome, previous, readAt, LEAN_CONFIG_VIEW));
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
// ── tickets (D-03, T-32-11) ──────────────────────────────────────────────────────────────────────
/**
 * The fallback identity of a `plans/tickets/*.md` entry: its stem, and nothing read out of it.
 *
 * ONE SPELLING FOR BOTH ARMS OF THE PARTITION (plan 32-15). The admitted arm falls back to the stem
 * when the document states no `id`; the unadmitted arm has only the stem, because a refused document
 * made no statement this module is willing to read. Two hand-written copies of `name.slice(0,
 * -".md".length)` is the set-literal drift class one register down: the day one of them learns about
 * a second extension is the day the two arms disagree about what a file is called.
 */
function ticketStem(name) {
    return name.slice(0, -".md".length);
}
/** The one place a walked `.md` entry becomes an entry the reader LISTED, READ, and refused. */
function unadmittedFrom(name, code) {
    return { id: ticketStem(name), code };
}
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
 *
 * THE WALK IS A TOTAL PARTITION OVER ITS OWN LISTING (plan 32-15, CR-01). Every listed entry ending
 * in `.md` becomes EXACTLY ONE of an admitted `TicketRecord` or an `UnadmittedTicket`, and nothing
 * else: there is no third outcome and no silent drop. That is a SECOND, PER-IDENTIFIER fact beside
 * the sentence above, not a contradiction of it — a refused document is still not a failure to
 * obtain bytes, and what sets `firstReadFailure` is unchanged from plan 32-09. The partition exists
 * because `joinSnapshot` has to answer "does a file carry this identifier" per identifier, and
 * answering it from the parse SUCCESSES is what made the projector assert that a file which exists
 * does not. Its size is pinned in `scripts/board-read.test.ts` against a `.md` count derived from
 * `listDirectoryBounded`, on the other side of this loop, so a fourth exit added here without a
 * push is a red case rather than a silently short set.
 */
export function readTicketsSource(root, readAt, previous, seam) {
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
        return settledFrom(settleSource("tickets", dir, listingFailure(dir, listing), previous, readAt));
    }
    const records = [];
    const errors = [];
    /** The other half of the partition: a listed `.md` entry that produced no record (plan 32-15). */
    const unadmitted = [];
    /** The reason of the FIRST per-file read failure, or null when every file's bytes arrived. */
    let firstReadFailure = null;
    // Sorted, so two runs over the same directory produce the same order whatever the filesystem's
    // listing order happens to be. A frame that reshuffles on every re-read is a frame nobody can read.
    for (const name of [...listing.names].sort()) {
        if (!name.endsWith(".md"))
            continue;
        const child = childPath(root, dir, name);
        // A REFUSED ENTRY IS A FINDING, NOT A SKIP (plan 32-10, CR-04). The silent `continue` this
        // replaced is what made the escape invisible on the one channel that could have reported it.
        if (!child.ok) {
            errors.push({
                source: "tickets",
                path: child.target,
                code: child.code,
                message: child.message,
            });
            // EXIT ONE OF THREE (plan 32-15). The entry leaves this loop without a record, so it lands in
            // the other half of the partition. The source is degraded too, exactly as it already was.
            unadmitted.push(unadmittedFrom(name, child.code));
            if (firstReadFailure === null)
                firstReadFailure = staleReasonForCode(child.code);
            continue;
        }
        const path = child.path;
        const read = readVerifyReread(path, READ_RETRY_BOUND, seam);
        if (!read.ok) {
            errors.push({ source: "tickets", path, code: read.code, message: read.message });
            // A TICKET FILE WHOSE BYTES COULD NOT BE OBTAINED MAKES THE RECORD SET INCOMPLETE (plan 32-09).
            // Recorded rather than only reported, because `joinSnapshot`'s presence gate reads the SOURCE
            // STATE: with the source left `ok`, a row naming this ticket is still reported as having no
            // ticket file — the CR-02 fabrication, surviving one register down from the directory.
            // EXIT TWO OF THREE (plan 32-15).
            unadmitted.push(unadmittedFrom(name, read.code));
            if (firstReadFailure === null)
                firstReadFailure = read.reason;
            continue;
        }
        const admission = parseTicketDocument(read.text);
        if (!admission.ok) {
            errors.push({ source: "tickets", path, code: admission.code, message: admission.reason });
            // EXIT THREE OF THREE, AND THE ONE CR-01 NAMES (plan 32-15). `firstReadFailure` is DELIBERATELY
            // not set: the bytes arrived and the grammar refused them by name, which is the contract's
            // stated behaviour rather than a fault. Degrading the source here would blank every other
            // derivation on the board because one ticket has a stray tab — the "one refusal blanks the
            // other five" failure plan 32-10 closed one register up. The answer is per identifier.
            unadmitted.push(unadmittedFrom(name, admission.code));
            continue;
        }
        records.push({
            file: name,
            // THE FILE STEM IS THE FALLBACK IDENTITY, because the file name is the only identity a reader
            // can trust when the document does not state one — the same rule the validator applies, and
            // the same `ticketStem` spelling the unadmitted arm above uses.
            id: admission.value.id ?? ticketStem(name),
            title: admission.value.title ?? "",
            column: admission.value.column,
            status: admission.value.status,
        });
    }
    const outcome = listing.bounded
        ? { kind: "bounded", value: records }
        : firstReadFailure !== null
            ? { kind: "partial", value: records, reason: firstReadFailure }
            : { kind: "value", value: records };
    return settledFrom(settleSource("tickets", dir, outcome, previous, readAt), errors, unadmitted);
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
export const QUEUE_STAGES = ["pending", "claimed", "done"];
const CLAIMED_STAGE = "claimed";
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
function readQueueSource(root, readAt, previous, seam) {
    const queueRoot = repoSubpath(root, FIXED_SUBPATHS.queue);
    if (!existsSync(queueRoot)) {
        return settledFrom(settleSource("queue", queueRoot, { kind: "absent" }, previous, readAt));
    }
    const claimedDir = repoSubpath(root, `${FIXED_SUBPATHS.queue}/${CLAIMED_STAGE}`);
    const listing = listDirectoryBounded(claimedDir);
    // THE THREE ARMS, ROUTED (plan 32-09, CR-02). `absent` keeps today's answer and that is a
    // DECISION: a `.grugops/queue/` that exists with no `claimed/` stage yet is a queue that has
    // claimed nothing, which is a legitimate empty queue rather than a fault (D-13). `failed` settles
    // through `settleSource`, so a denied claimed stage produces a badge and a `readErrors` entry
    // carrying the errno instead of rendering as "nothing claimed" — the state a human watching a live
    // run would read as "the work stopped", about a queue that is running fine.
    if (listing.kind === "failed") {
        return settledFrom(settleSource("queue", queueRoot, listingFailure(claimedDir, listing), previous, readAt));
    }
    const claimedNames = listing.kind === "listed" ? listing.names : [];
    const claimedBounded = listing.kind === "listed" && listing.bounded;
    const rows = [];
    const errors = [];
    /** The reason of the FIRST per-record read failure, or null when every record's bytes arrived. */
    let firstReadFailure = null;
    for (const task of claimedNames) {
        // Defensive: never read through an unsafe segment. Skipped BEFORE any filesystem access.
        if (!isSafeTaskName(task))
            continue;
        const taskChild = childPath(root, claimedDir, task);
        if (!taskChild.ok) {
            errors.push({
                source: "queue",
                path: taskChild.target,
                code: taskChild.code,
                message: taskChild.message,
            });
            if (firstReadFailure === null)
                firstReadFailure = staleReasonForCode(taskChild.code);
            continue;
        }
        const taskDir = taskChild.path;
        // THE `claim.md` LITERAL GOES THROUGH THE SAME AUTHORITY (plan 32-10, CR-04). It used to be a
        // bare `join` against the task directory, which meant a symlinked `claim.md` inside an otherwise
        // legitimate claimed task escaped the rule every other read obeys. The argument for exempting a
        // literal is the argument that produced the defect in `repoSubpath`.
        const claimChild = childPath(root, taskDir, "claim.md");
        if (!claimChild.ok) {
            errors.push({
                source: "queue",
                path: claimChild.target,
                code: claimChild.code,
                message: claimChild.message,
            });
            if (firstReadFailure === null)
                firstReadFailure = staleReasonForCode(claimChild.code);
            continue;
        }
        const claimMd = claimChild.path;
        if (!existsSync(claimMd))
            continue;
        const read = readVerifyReread(claimMd, READ_RETRY_BOUND, seam);
        if (!read.ok) {
            errors.push({ source: "queue", path: claimMd, code: read.code, message: read.message });
            // The same rule the tickets reader applies: a claim record whose bytes could not be obtained
            // makes the row set incomplete, and "nothing is claimed" is then a claim this reader cannot
            // make. A TAMPERED record is NOT this — it was read, and it is refused by name.
            if (firstReadFailure === null)
                firstReadFailure = read.reason;
            continue;
        }
        // NORMALIZED BEFORE ANY LINE-ANCHORED PATTERN TOUCHES IT (plan 32-16). Every pattern below is
        // anchored at a line start, so three bytes in front of the first line used to move BOTH answers
        // at once: the record vanished from the screen, and — worse — `AT_KEY_LINE` counted ONE over a
        // record carrying two, so the single-`at:` discipline passed and `AT_VALUE` then matched the
        // SECOND. A forged `at:` was read as the only one (T-32-05). The mark is an encoding artefact,
        // never a reason to trust a tampered record.
        const claimText = normalizeDocument(read.text);
        const atLineCount = (claimText.match(AT_KEY_LINE) ?? []).length;
        if (atLineCount > 1) {
            errors.push({
                source: "queue",
                path: claimMd,
                code: "tampered",
                message: `${claimMd} carries ${atLineCount} \`at:\` lines and a claim record is written with ` +
                    `exactly one. The record is skipped rather than trusted on either line: a forged second ` +
                    `\`at:\` is a queue-lock denial of service (scripts/claim.ts:270-306).`,
            });
            continue;
        }
        const at = AT_VALUE.exec(claimText);
        if (at === null)
            continue; // no `at` field → cannot be placed on the timeline; skip
        const by = BY_VALUE.exec(claimText);
        rows.push({ task, by: by === null ? "" : (by[1] ?? "").trim(), at: (at[1] ?? "").trim() });
    }
    rows.sort((a, b) => (a.at !== b.at ? a.at.localeCompare(b.at) : a.task.localeCompare(b.task)));
    const outcome = claimedBounded
        ? { kind: "bounded", value: rows }
        : firstReadFailure !== null
            ? { kind: "partial", value: rows, reason: firstReadFailure }
            : { kind: "value", value: rows };
    return settledFrom(settleSource("queue", queueRoot, outcome, previous, readAt), errors);
}
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
function readContextSource(root, readAt, previous, seam) {
    const dir = repoSubpath(root, FIXED_SUBPATHS.context);
    const listing = listDirectoryBounded(dir);
    // The same three-arm routing `readTicketsSource` uses, for the same reason (plan 32-09, CR-02).
    if (listing.kind === "absent") {
        return settledFrom(settleSource("context", dir, { kind: "absent" }, previous, readAt));
    }
    if (listing.kind === "failed") {
        return settledFrom(settleSource("context", dir, listingFailure(dir, listing), previous, readAt));
    }
    const tasks = [];
    const errors = [];
    /** The reason of the FIRST per-task read failure, or null when every task's bytes arrived. */
    let firstReadFailure = null;
    for (const name of [...listing.names].sort()) {
        if (!isSafeTaskName(name))
            continue;
        const taskChild = childPath(root, dir, name);
        if (!taskChild.ok) {
            errors.push({
                source: "context",
                path: taskChild.target,
                code: taskChild.code,
                message: taskChild.message,
            });
            if (firstReadFailure === null)
                firstReadFailure = staleReasonForCode(taskChild.code);
            continue;
        }
        const taskDir = taskChild.path;
        let isDirectory = false;
        try {
            isDirectory = statSync(taskDir).isDirectory();
        }
        catch (e) {
            // ONE ERRNO IS SWALLOWED HERE, AND IT IS NAMED (plan 32-09). `ENOENT` means the entry went
            // away between the listing and the stat. That race is real, it resolves itself on the next
            // re-read, and reporting it would make a live dashboard noisy about a file nobody misses. Every
            // OTHER errno is a task this reader could not inspect: a permission-denied context task used to
            // be invisible under a comment that asserted it had been deleted — a sentence true of exactly
            // one of the errnos it covered.
            const err = e;
            if (err.code !== "ENOENT") {
                errors.push({
                    source: "context",
                    path: taskDir,
                    code: err.code ?? "unreadable",
                    message: `${taskDir} could not be inspected (${err.code ?? "unreadable"}): ${err.message}`,
                });
                if (firstReadFailure === null)
                    firstReadFailure = staleReasonForCode(err.code);
            }
            continue;
        }
        if (!isDirectory)
            continue;
        // THE `index.jsonl` LITERAL GOES THROUGH THE SAME AUTHORITY, for the reason recorded at the
        // queue reader's `claim.md` (plan 32-10, CR-04).
        const indexChild = childPath(root, taskDir, "index.jsonl");
        if (!indexChild.ok) {
            errors.push({
                source: "context",
                path: indexChild.target,
                code: indexChild.code,
                message: indexChild.message,
            });
            if (firstReadFailure === null)
                firstReadFailure = staleReasonForCode(indexChild.code);
            tasks.push({ task: name, noteCount: 0, liveCount: 0, latestAt: null, latestKind: null });
            continue;
        }
        const indexPath = indexChild.path;
        const read = readVerifyReread(indexPath, READ_RETRY_BOUND, seam);
        if (!read.ok) {
            if (read.reason !== "enoent") {
                errors.push({ source: "context", path: indexPath, code: read.code, message: read.message });
                // An `index.jsonl` that is ABSENT is not a fault — it is a derived artifact whose freshness
                // `npm run freshness:context` owns, and the task is reported with zero notes. An index whose
                // bytes could not be OBTAINED is a different answer, and the badge says so.
                if (firstReadFailure === null)
                    firstReadFailure = read.reason;
            }
            tasks.push({ task: name, noteCount: 0, liveCount: 0, latestAt: null, latestKind: null });
            continue;
        }
        const notes = [];
        // NORMALIZED AT THE PARSE POINT (plan 32-16), for the same reason the dial is: a mark-led first
        // line threw, and the skip was then REPORTED as a malformed index line naming a line that is
        // valid JSON. A finding that is true of the bytes and false of the document is the expensive
        // kind.
        for (const line of normalizeDocument(read.text).split("\n")) {
            if (line.trim() === "")
                continue;
            try {
                const raw = JSON.parse(line);
                notes.push({
                    id: typeof raw["id"] === "string" ? raw["id"] : "",
                    kind: typeof raw["kind"] === "string" ? raw["kind"] : "",
                    at: typeof raw["at"] === "string" ? raw["at"] : "",
                    supersedes: typeof raw["supersedes"] === "string" ? raw["supersedes"] : null,
                });
            }
            catch (e) {
                errors.push({
                    source: "context",
                    path: indexPath,
                    code: "PARSE",
                    message: `${indexPath} carries a line the event index cannot read: ${e.message}`,
                });
            }
        }
        const ordered = [...notes].sort((a, b) => a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id));
        const superseded = new Set(ordered.map((n) => n.supersedes).filter((x) => x !== null && x !== ""));
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
    const outcome = listing.bounded
        ? { kind: "bounded", value: tasks }
        : firstReadFailure !== null
            ? { kind: "partial", value: tasks, reason: firstReadFailure }
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
function splitPipeRow(line) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|"))
        return null;
    const cells = [];
    let current = "";
    for (let i = 1; i < trimmed.length; i += 1) {
        const ch = trimmed[i];
        if (ch === "\\" && i + 1 < trimmed.length) {
            current += trimmed[i + 1];
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
    if (current.trim() !== "")
        cells.push(current.trim());
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
function parseTraceability(text) {
    const lines = stripHtmlComments(text).split("\n");
    const rows = [];
    for (let i = 0; i < lines.length; i += 1) {
        const header = splitPipeRow(lines[i]);
        if (header === null || header[0] !== TRACE_HEADER_CELL)
            continue;
        const separator = splitPipeRow(lines[i + 1] ?? "");
        if (separator === null || !separator.every((c) => SEPARATOR_CELL.test(c)))
            continue;
        for (let j = i + 2; j < lines.length; j += 1) {
            const cells = splitPipeRow(lines[j]);
            if (cells === null)
                break; // the table ended
            if (cells.every((c) => SEPARATOR_CELL.test(c)))
                continue;
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
function readTraceabilitySource(root, readAt, previous, seam) {
    const path = repoSubpath(root, FIXED_SUBPATHS.traceability);
    return settledFrom(settleSource("traceability", path, gatherFile(path, seam, parseTraceability), previous, readAt));
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
    // THE DIAL IS READ FIRST, and the order is load-bearing rather than cosmetic: `id_prefix` is part
    // of what a conforming row identifier means (D-02), so the board parse needs the dial's value.
    // EVERY SOURCE READ IS WRAPPED (plan 32-10). `repoSubpath` throws on a containment refusal, and
    // six unguarded calls in a row means the FIRST refusal blanks the other five — D-12 says staleness
    // is per source with one badge, so a refused source is one badge over five readable ones. The
    // wrapper count is pinned against `SOURCE_NAMES.length` by a census derived from this file.
    const config = guarded("config", root, readAt, before?.config, () => readConfigSource(root, readAt, before?.config, seam), LEAN_CONFIG_VIEW);
    const board = guarded("board", root, readAt, before?.board, () => readBoardSource(root, readAt, before?.board, seam, sourceValue(config.state)?.idPrefix ?? null));
    const tickets = guarded("tickets", root, readAt, before?.tickets, () => readTicketsSource(root, readAt, before?.tickets, seam));
    const queue = guarded("queue", root, readAt, before?.queue, () => readQueueSource(root, readAt, before?.queue, seam));
    const context = guarded("context", root, readAt, before?.context, () => readContextSource(root, readAt, before?.context, seam));
    const traceability = guarded("traceability", root, readAt, before?.traceability, () => readTraceabilitySource(root, readAt, before?.traceability, seam));
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
    const joined = joinSnapshot({
        repoRoot: root,
        generatedAt: readAt,
        sources,
        // THE ONE PATH THE ANSWER TRAVELS (plan 32-15, CR-01). `readTicketsSource` partitions its own
        // listing; the other half arrives here so the join can tell "no file carries this identifier"
        // from "a file carries it and the grammar refused it". The field is REQUIRED on `JoinInputs`,
        // so this line cannot be dropped without a compile error.
        unadmittedTickets: tickets.unadmitted,
    });
    // In SOURCE_NAMES order, so the stderr summary reads the same way twice and a consumer diffing two
    // runs sees a changed finding rather than a reshuffled list.
    const readErrors = [
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
export function unreadableSources(sources, readErrors) {
    const out = [];
    for (const name of SOURCE_NAMES) {
        if (sources[name].source !== "unavailable")
            continue;
        const error = readErrors.find((e) => e.source === name);
        // NO ERROR MEANS A LEGITIMATE ABSENCE, AND THAT IS THE WHOLE DISCRIMINATION (D-13). A tree with
        // no `.grugops/` produces an `unavailable` queue and NO entry here, so it is badged nowhere.
        if (error === undefined)
            continue;
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
function deriveOverallSource(sources, readErrors) {
    if (sources.board.source === "unavailable")
        return "unavailable";
    // SOURCE_NAMES rather than Object.keys: the tuple is the pinned set, so a source added to the
    // record and not to the tuple cannot slip past this loop unexamined.
    for (const name of SOURCE_NAMES) {
        if (sources[name].source === "stale")
            return "stale";
    }
    // A SOURCE THAT IS UNAVAILABLE BECAUSE IT COULD NOT BE READ DEGRADES THE DISCRIMINANT (plan 32-09).
    // An ABSENT one still degrades nothing — that is D-13 and it is unchanged. The difference is the
    // `readErrors` entry, which is exactly what `unreadableSources` reads. Without this arm, a denied
    // `plans/tickets/` on a first read printed `[ok]` beside a badge saying the opposite, which is the
    // confident-wrong-board output the phase goal rules out.
    if (unreadableSources(sources, readErrors).length > 0)
        return "stale";
    return "ok";
}

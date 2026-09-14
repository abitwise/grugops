// board-dashboard.ts — the read-only board projector's CLI (plans 32-01 and 32-03, DASH-07/08).
//
// THE PROCESS-OWNING HALF OF THE D-15 BOUNDARY. `scripts/board-model.ts` is pure: no `process`, no
// timers, no rendering. `scripts/board-read.ts` is the one module that touches the disk. This module
// owns argv, stdout discipline, exit codes, the watch handles and the poll timer. The split is what
// lets the DASH-06 import-graph guard (plan 32-06) walk one closure and assert that every `node:fs`
// symbol in it is read-only.
//
//   node scripts/board-dashboard.js [repoRoot] [--once] [--json] [--watch] [--interval <ms>] [--help]
//
// STDOUT IS A CHANNEL WITH ONE MEANING AT A TIME (D-18). With `--json` it carries exactly one JSON
// document and nothing else. Without it, one plain-text frame. Every diagnostic, every refusal and
// every read-error summary goes to stderr, including the entry guard's own catch: a raw Node stack
// must never be the last thing a piped consumer reads (T-32-08).
//
// THE EXIT CODE IS NOT THE STATE CHANNEL (D-18). A stale or conflicted board still exits 0, because
// the state is IN the frame and in the JSON document, and a consumer that pipes the output should
// not have to decide whether a nonzero code meant "the board says something" or "the tool broke".
// Exit 2 is reserved for exactly two things: a usage error and an unreadable `repoRoot`.
//
// BOARD CONTENT IS UNTRUSTED INPUT TO A TERMINAL EMULATOR (T-32-06). Every string that reaches
// stdout in the frame goes through `sanitizeCell` first. A ticket title carrying an ANSI or OSC
// sequence would otherwise repaint, retitle or mislead the terminal of whoever ran the dashboard.
//
// IMPORT DISCIPLINE for a runnable `scripts/*.ts` (`scripts/check-platform-shapes.ts`): node
// builtins plus relative `./*.js`, nothing else. The two `node:fs` symbols this module holds —
// `watch` and `existsSync` — are READ-ONLY: neither creates, moves, truncates or removes anything.
// The dashboard's whole point is that it cannot write, and DASH-06's guard (plan 32-06) proves that
// over the compiled closure by deriving the MUTATING symbol set rather than by matching a hand-typed
// allow-list, so a read-only symbol entering here does not move the guard's answer.
//
// WINDOWS `fs.watch` BEHAVIOUR IS `UNKNOWN - verify` (Phase 33 / CAP-02). Node documents that on
// Windows events may not be emitted at all, that a watched directory that is moved or renamed emits
// nothing, and that deleting one reports EPERM. None of that can be DEMONSTRATED from this tree —
// the `windows-latest` CI leg is Phase 33 work — so nothing here asserts it. The MANDATORY poll
// floor is the fallback by construction: a platform that emits no events at all still re-reads every
// `POLL_FLOOR_MS`, because the poll is the safety net rather than the optimisation.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — this is a trace surface).
import { existsSync, watch } from "node:fs";
import { join } from "node:path";
import { CONFLICT_KINDS, readSnapshot } from "./board-read.js";
import { isEntrypoint } from "./is-entry.js";
// ── The timing constants the loop runs on (D-14) ─────────────────────────────────────────────────
//
// Declared in the module that OWNS the loop, so there is one set of numbers rather than a second set
// beside it. The poll is mandatory and cannot be disabled: it is the safety net for a watch orphaned
// by an atomic rename, and for a filesystem that emits no events at all.
export const POLL_FLOOR_MS = 10_000;
export const DEBOUNCE_MS = 250;
export const INTERVAL_HARD_FLOOR_MS = 1_000;
/** The exit code for a usage error and for an unreadable root. Nothing else uses it. */
const EXIT_USAGE = 2;
const USAGE = [
    "usage: node scripts/board-dashboard.js [repoRoot] [--once] [--json] [--watch] [--interval <ms>] [--help]",
    "",
    "  repoRoot        the repository to project (default: the working directory)",
    "  --once          print one frame and exit 0, whatever the board says",
    "  --json          print exactly one JSON document on stdout and nothing else",
    "  --watch         re-read on filesystem events, with a mandatory poll floor",
    `  --interval <ms> override the poll period (integer, at least ${INTERVAL_HARD_FLOOR_MS} ms)`,
    "  --help          print this message",
].join("\n");
// ── Argument parsing (D-16, D-18, T-32-10) ───────────────────────────────────────────────────────
/** A base-10 integer with no exponent, no sign and no fractional part. */
const INTEGER = /^\d{1,9}$/;
/**
 * Parse argv into options, a help request, or a named usage refusal.
 *
 * `--interval` IS CLAMPED BY REFUSAL, NEVER BY SILENT ROUNDING (ASVS V5). A non-integer, a negative,
 * a value carrying an exponent and a value below the hard floor are all refused with exit 2. Silent
 * coercion is how `parseInt("abc")` becomes `NaN`, becomes a timer that never fires, and becomes a
 * screen that looks live and is frozen.
 */
export function parseArgs(argv) {
    let repoRoot = null;
    let once = false;
    let json = false;
    let watch = false;
    let intervalMs = null;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--help" || arg === "-h")
            return { kind: "help" };
        if (arg === "--once") {
            once = true;
            continue;
        }
        if (arg === "--json") {
            json = true;
            continue;
        }
        if (arg === "--watch") {
            watch = true;
            continue;
        }
        if (arg === "--interval") {
            const raw = argv[i + 1];
            if (raw === undefined) {
                return refuse("`--interval` needs a value in milliseconds.");
            }
            i += 1;
            if (!INTEGER.test(raw)) {
                return refuse(`\`--interval ${raw}\` is not a base-10 integer. The value is refused rather than ` +
                    `coerced: a silently rounded interval is a screen that looks live and is frozen.`);
            }
            const ms = Number.parseInt(raw, 10);
            if (ms < INTERVAL_HARD_FLOOR_MS) {
                return refuse(`\`--interval ${raw}\` is below the hard floor of ${INTERVAL_HARD_FLOOR_MS} ms. The ` +
                    `value is refused rather than clamped, so the interval a caller reads back is the ` +
                    `interval it asked for.`);
            }
            intervalMs = ms;
            continue;
        }
        if (arg.startsWith("-")) {
            return refuse(`\`${arg}\` is not a known flag.`);
        }
        if (repoRoot !== null) {
            return refuse(`\`${arg}\` is a second positional argument. The dashboard projects exactly one ` +
                `repository per invocation.`);
        }
        repoRoot = arg;
    }
    return {
        kind: "options",
        options: {
            repoRoot: repoRoot ?? process.cwd(),
            once,
            json,
            watch,
            intervalMs,
        },
    };
}
function refuse(message) {
    return { kind: "usage", message: `board-dashboard: ${message}\n\n${USAGE}` };
}
// ── The cell sanitizer (T-32-06) ─────────────────────────────────────────────────────────────────
/**
 * Strip every C0 control, DEL and C1 code point from a string bound for a terminal.
 *
 * BOARD CONTENT IS UNTRUSTED. A ticket title is written by an agent or a human into a plain markdown
 * file that nothing validates, and a terminal emulator INTERPRETS the bytes it is handed. An ANSI
 * sequence in a title could repaint the frame; an OSC sequence could retitle the window; either
 * makes the projector lie about the board it is projecting. Removing the introducers is what makes
 * the remaining text inert.
 *
 * The pattern is one character class with one quantifier — no alternation and no nesting, so a
 * 34 KB cell costs one linear pass (T-32-01).
 */
// The class is spelled with `\u` escapes rather than literal bytes, so this source file carries no
// control character of its own for `scripts/check-nul-bytes.ts` or a reviewer to trip over.
const CONTROL_CODE_POINTS = /[\u0000-\u001F\u007F-\u009F]/g;
export function sanitizeCell(s) {
    return s.replace(CONTROL_CODE_POINTS, "");
}
// Spelled with `\u` escapes rather than literal bytes, so this source file carries no control
// character of its own for `scripts/check-nul-bytes.ts` or a reviewer to trip over.
export const STYLE = {
    bold: "\u001B[1m",
    badge: "\u001B[33m",
    reset: "\u001B[0m",
};
/** The non-TTY twin: the same three names, all empty. A redirected run emits no escape byte. */
export const PLAIN_STYLE = { bold: "", badge: "", reset: "" };
/** Clear the screen and home the cursor. A plain sequence, emitted only on a TTY (D-17). */
export const CLEAR_SCREEN = "\u001B[2J\u001B[H";
/** The width a frame falls back to when the caller has none — a pipe reports no columns. */
export const DEFAULT_WIDTH = 80;
/** The ellipsis a truncated cell ends with. One code unit, so it costs one column. */
const ELLIPSIS = "…";
function normalizeWidth(width) {
    if (width === undefined || !Number.isFinite(width))
        return DEFAULT_WIDTH;
    const w = Math.floor(width);
    return w >= 8 ? w : DEFAULT_WIDTH;
}
/**
 * Cut a line to `width`, marking the cut, WITHOUT splitting a surrogate pair.
 *
 * THE CUT IS ON A CODE UNIT, AND THE PAIR IS THE ONE EXCEPTION. JavaScript strings are UTF-16, so
 * `slice` can land between the two halves of an astral character — an emoji in a ticket title is
 * enough. A lone surrogate reaches the terminal as a replacement character, which reads as a broken
 * cell rather than a truncated one, so the cut backs off by one unit when it would land inside a
 * pair. Grapheme clusters and east-asian width are NOT modelled: that needs a table this kit does
 * not ship, and the failure mode is a line one column short rather than a corrupt one.
 */
export function truncateCell(s, width) {
    const max = Math.max(1, Math.floor(width));
    if (s.length <= max)
        return s;
    let cut = max - 1;
    const lead = s.charCodeAt(cut - 1);
    if (cut > 0 && lead >= 0xd800 && lead <= 0xdbff)
        cut -= 1;
    return `${s.slice(0, cut)}${ELLIPSIS}`;
}
/** Sanitize, then cut. In that order, so a stripped sequence cannot move where the cut falls. */
function cell(text, width) {
    return truncateCell(sanitizeCell(text), width);
}
/** Human-rounded bytes for a header a person reads. The snapshot field keeps the exact number. */
function humanBytes(n) {
    if (n < 1024)
        return `${n} B`;
    if (n < 1024 * 1024)
        return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
/** Human-rounded age between two ISO instants, coarsened upward. */
function humanAge(since, now) {
    const ms = Date.parse(now) - Date.parse(since);
    if (!Number.isFinite(ms) || ms < 0)
        return "unknown";
    const s = Math.floor(ms / 1000);
    if (s < 60)
        return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60)
        return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24)
        return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}
/**
 * The header line (D-12, D-17, D-20).
 *
 * THE BADGE'S SOURCE LIST IS DERIVED FROM THE RESULT, never from a second literal beside
 * `SOURCE_NAMES`. A hand-maintained list of "sources that can go stale" is this repository's
 * recorded set-literal drift class: it rots while every gate over it stays green, and the rot is
 * invisible precisely because a source that stopped being badged still renders its last good value.
 *
 * THE HEADER IS THE ONE LINE THAT IS NOT TRUNCATED, and that is a decision. Everything that says
 * the frame is not to be trusted — the stale badge, the conflict count, the large-board marker —
 * lives here, and a narrow terminal cutting the badge off would leave a frame that looks confident
 * for exactly the reason it should not be. A wrapped header is ugly; a silently dropped badge is a
 * lie. It is still sanitized, because the repository root arrives from argv.
 */
export function renderHeader(result, style) {
    const snapshot = result.snapshot;
    const mode = snapshot.config?.mode ?? "unknown";
    const columns = orderedColumns(result);
    const parts = [
        "grugops board",
        sanitizeCell(snapshot.repoRoot),
        `mode: ${sanitizeCell(mode)}`,
        `read: ${sanitizeCell(snapshot.generatedAt)}`,
        `${columns.length} columns`,
        `[${result.source}]`,
    ];
    // Derived from the result's own per-source states (D-12), in the order the result carries them.
    const stale = Object.entries(snapshot.sources)
        .filter(([, state]) => state.source === "stale")
        .map(([name, state]) => {
        const s = state;
        return `${name} (${humanAge(s.stale.since, snapshot.generatedAt)}, ${s.stale.reason})`;
    });
    if (stale.length > 0) {
        parts.push(`${style.badge}STALE: ${stale.join(", ")}${style.reset}`);
    }
    parts.push(`${result.conflicts.length} conflicts`);
    const bounds = snapshot.board?.bounds;
    if (bounds !== undefined && bounds.exceeded) {
        parts.push(`${style.badge}LARGE BOARD (${humanBytes(bounds.boardBytes)}, longest line ` +
            `${humanBytes(bounds.longestLine)})${style.reset}`);
    }
    return parts.join("  ");
}
/** The board's columns in on-disk order with Blocked last, whatever its heading's position. */
function orderedColumns(result) {
    const columns = result.snapshot.board?.columns ?? [];
    return [
        ...columns.filter((c) => c.kind !== "blocked"),
        ...columns.filter((c) => c.kind === "blocked"),
    ];
}
/**
 * The WIP cell for one column.
 *
 * ON A `wip-count` CONFLICT THE CELL NAMES THE DISAGREEMENT RATHER THAN PICKING A NUMBER (D-09).
 * `2/3` over a column whose three rows contradict the heading's claim of two is the renderer
 * choosing a side, silently, on a board nobody has reconciled. `claimed 2 / counted 3 / limit 3`
 * says which two numbers disagree and leaves the fixing to the human who can.
 */
function wipCell(column, disputed) {
    if (disputed) {
        const limit = column.limit === null ? "unlimited" : String(column.limit);
        return `claimed ${column.claimedLive ?? "-"} / counted ${column.rows.length} / limit ${limit}`;
    }
    if (column.kind === "limited" && column.claimedLive !== null && column.limit !== null) {
        return `${column.claimedLive}/${column.limit}`;
    }
    if (column.kind === "unlimited")
        return "unlimited";
    return "-";
}
function plural(n, one, many) {
    return n === 1 ? `1 ${one}` : `${n} ${many}`;
}
/**
 * The column block: one line per column, then one line per row beneath it (D-03, D-09, D-17).
 *
 * AN EMPTY COLUMN COLLAPSES TO ITS OWN LINE and an unparsed count rides on that same line, so a
 * board with three lines the grammar declined under `Done` says so where a reader is already
 * looking. Dropping the count would make an unparsed line indistinguishable from a line that was
 * never written, which is the difference between "the board is clean" and "the projector did not
 * understand part of it".
 */
export function renderColumns(result, width, style) {
    const columns = orderedColumns(result);
    if (columns.length === 0)
        return [];
    const unparsed = result.snapshot.board?.unparsed ?? [];
    const disputedColumns = new Set(result.conflicts.filter((c) => c.kind === "wip-count").map((c) => c.column));
    const nameWidth = columns.reduce((w, c) => Math.max(w, sanitizeCell(c.name).length), 0);
    const lines = [];
    for (const column of columns) {
        const disputed = disputedColumns.has(column.name);
        const parts = [
            sanitizeCell(column.name).padEnd(nameWidth),
            wipCell(column, disputed),
            plural(column.rows.length, "row", "rows"),
        ];
        const declined = unparsed.filter((u) => u.column === column.name).length;
        if (declined > 0) {
            parts.push(plural(declined, "unparsed line", "unparsed lines"));
        }
        lines.push(`${style.bold}${cell(parts.join("  "), width)}${style.reset}`);
        for (const row of column.rows) {
            lines.push(cell(`  ${row.id}  ${row.title}`, width));
        }
    }
    return lines;
}
/**
 * The `Now running` block, from the claimed queue stage (D-13, D-17).
 *
 * AN ABSENT `.grugops/` RENDERS `no queue` AND NO BADGE. A repository that has never run the queue
 * is a supported state rather than a fault, and reporting it as stale would leave a fresh install
 * showing a warning it can do nothing about — which is how a badge stops meaning anything.
 */
export function renderNowRunningBlock(result, width, style) {
    const queue = result.snapshot.sources.queue;
    if (queue.source === "unavailable") {
        return [`${style.bold}${cell("Now running  no queue", width)}${style.reset}`];
    }
    const rows = queue.value;
    if (rows.length === 0) {
        return [`${style.bold}${cell("Now running  nothing claimed", width)}${style.reset}`];
    }
    const lines = [`${style.bold}${cell("Now running", width)}${style.reset}`];
    for (const row of rows) {
        lines.push(cell(`  ${row.task}  by ${row.by}  at ${row.at}`, width));
    }
    return lines;
}
/**
 * The conflict block, grouped by kind in `CONFLICT_KINDS` declaration order (D-10, D-17).
 *
 * THE ORDER COMES FROM THE PINNED TUPLE, not from the order the join happened to emit. A list whose
 * order shifts between two runs over the same board makes a diff of two frames unreadable, and the
 * tuple is already the two-sided-pinned authority for what a kind is.
 *
 * EVERY ENTRY NAMES BOTH SIDES. "wip-limit on In Review" is a finding nobody can act on; "expected
 * 2, actual 3" names the two numbers and leaves the decision where it belongs.
 */
export function renderConflicts(result, width, style) {
    const conflicts = result.conflicts;
    if (conflicts.length === 0) {
        return [`${style.bold}${cell("Conflicts  none", width)}${style.reset}`];
    }
    const lines = [`${style.bold}${cell(`Conflicts (${conflicts.length})`, width)}${style.reset}`];
    for (const kind of CONFLICT_KINDS) {
        const group = conflicts.filter((c) => c.kind === kind);
        if (group.length === 0)
            continue;
        lines.push(cell(`  ${kind}`, width));
        for (const conflict of group) {
            const subject = [conflict.ticketId, conflict.column].filter((s) => s !== undefined).join(" ");
            lines.push(cell(`    ${subject === "" ? "-" : subject}  expected: ${conflict.expected}  ` +
                `actual: ${conflict.actual}`, width));
        }
    }
    return lines;
}
/**
 * Render one frame: header, columns, `Now running`, `Conflicts` (D-17).
 *
 * PURE. No `process`, no environment, no clock — the width and the style are arguments, and every
 * timestamp is read from the snapshot itself. That is what makes the frame testable without a pty
 * and what makes two renders of one document byte-identical.
 */
export function renderFrame(result, width, style = PLAIN_STYLE) {
    const w = normalizeWidth(width);
    const lines = [renderHeader(result, style)];
    if (result.snapshot.board === null) {
        // D-11 forbids an empty board as an output state. A board that could not be read says so on its
        // own line; it never renders as zero columns a reader would mistake for an empty backlog.
        lines.push(cell("no board: plans/board.md was not readable on this tree", w));
    }
    else {
        lines.push(...renderColumns(result, w, style));
    }
    lines.push(...renderNowRunningBlock(result, w, style));
    lines.push(...renderConflicts(result, w, style));
    return `${lines.join("\n")}\n`;
}
// ── The watch loop (D-14) ────────────────────────────────────────────────────────────────────────
//
// THE SIX DIRECTORIES, EXPLICITLY, AND NEVER A RECURSIVE WATCH. `recursive` is the platform-variable
// part of `fs.watch`: it is supported on macOS and Windows and throws
// `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` where it is not. D-14's explicit list exists to avoid that
// question entirely, at the cost of naming the directories here.
//
// DIRECTORY-LEVEL, NOT FILE-LEVEL, AND THE REASON WAS MEASURED. A probe this session (RESEARCH
// §Filesystem Watching) armed both kinds on the same target: the FILE watch died after the first
// atomic rename and missed every later change, because it is bound to the replaced inode. grugops's
// own `atomicWrite` writes a temp sibling and renames it, so a file-level watch on a board this kit
// maintains is orphaned by the kit's own write path. The directory watch survived every operation.
//
// `agent-factory/config/factory.config.json` IS DELIBERATELY NOT WATCHED. D-14's list does not name
// it, and the dial changes when a human edits it rather than when work moves; the mandatory poll
// picks it up within one period.
const WATCH_DIRS = [
    { rel: "plans", source: "board" },
    { rel: "plans/tickets", source: "tickets" },
    { rel: ".grugops/queue/pending", source: "queue" },
    { rel: ".grugops/queue/claimed", source: "queue" },
    { rel: ".grugops/queue/done", source: "queue" },
    { rel: ".grugops/context", source: "context" },
];
export { WATCH_DIRS };
/** The two-sided pin. A seventh watched directory is a D-14 decision, never a bumped constant. */
export const WATCH_DIR_COUNT = 6;
/**
 * TEST SEAM — name a watched directory whose watcher throws on its first event.
 *
 * WHY A SEAM RATHER THAN A PLATFORM. D-14 requires that a watcher which errors is closed, noted in
 * `readErrors` and re-armed on the next poll. RESEARCH measured that on macOS a directory watch
 * SURVIVES deletion and recreation (FSEvents is path-keyed), so on the developer's machine the
 * error arm is unreachable and would ship having never executed. On Linux the same operation orphans
 * an inotify watch — but a test that only runs the arm on one platform is a test that proves nothing
 * on the other, and the arm is the whole point.
 *
 * The value is a comma-separated list of `WATCH_DIRS` relative names. Production callers set nothing
 * and the value is empty, so the CLI runs exactly the program it ran before the seam existed
 * (`scripts/check-platform-shapes.ts`'s sentence, one register over).
 */
export const FORCE_WATCH_ERROR_ENV = "GRUGOPS_BOARD_FORCE_WATCH_ERROR";
export function defaultDeps() {
    return {
        // NO `recursive` OPTION. See the WATCH_DIRS docblock.
        watch: (dir, listener) => watch(dir, listener),
        exists: existsSync,
        read: readSnapshot,
    };
}
/**
 * Build the loop. It arms nothing and reads nothing until `armAll` / `refresh` are called.
 *
 * ONE `refresh()`, TWO TRIGGERS. The debounced watch callback and the poll tick call the same
 * function, so there is one code path from "something happened" to "the screen is current". Two
 * paths would be two places for the emit contract to drift, and the poll path is the one that runs
 * when the watch path is broken — which is exactly when a divergence would be invisible.
 *
 * `refresh()` IS SINGLE-FLIGHT. `readSnapshot` is synchronous, so the only way a trigger arrives
 * while a read is in flight is REENTRANTLY — a watch event delivered from inside the read, or a poll
 * tick on a fake-timer clock. The guard sets a re-run flag instead of starting a second read, so two
 * overlapping triggers produce two sequential COMPLETE snapshots and never an interleaved one.
 */
export function createLoop(options, io, deps) {
    const watchers = new Map();
    const errors = [];
    const forced = new Set((process.env[FORCE_WATCH_ERROR_ENV] ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== ""));
    const forcedAlreadyFired = new Set();
    let debounce = null;
    let poll = null;
    let previous;
    let inFlight = false;
    let rerun = false;
    function noteWatchError(rel, source, e) {
        errors.push({
            source,
            path: rel,
            code: "watch",
            message: `the watch on ${rel} failed (${e.message}). It is closed and will be re-armed on the next ` +
                `poll tick; the mandatory poll keeps the screen current in the meantime.`,
        });
    }
    function closeWatcher(rel) {
        const w = watchers.get(rel);
        if (w === undefined)
            return;
        try {
            w.close();
        }
        catch {
            /* a handle that cannot be closed is already gone */
        }
        watchers.delete(rel);
    }
    function arm(entry) {
        const { rel, source } = entry;
        if (watchers.has(rel))
            return;
        const dir = join(options.repoRoot, rel);
        if (!deps.exists(dir))
            return; // it may appear later; a poll tick will arm it then
        try {
            const handle = deps.watch(dir, () => {
                // The `filename` argument is IGNORED ENTIRELY. Node documents it as null on some Linux
                // systems, so a re-read that depends on it is a re-read that silently stops happening.
                if (forced.has(rel) && !forcedAlreadyFired.has(rel)) {
                    forcedAlreadyFired.add(rel);
                    closeWatcher(rel);
                    noteWatchError(rel, source, new Error(`forced by ${FORCE_WATCH_ERROR_ENV}`));
                    return;
                }
                schedule();
            });
            handle.on("error", (e) => {
                closeWatcher(rel);
                noteWatchError(rel, source, e);
            });
            watchers.set(rel, handle);
        }
        catch (e) {
            noteWatchError(rel, source, e);
        }
    }
    function armAll() {
        for (const entry of WATCH_DIRS)
            arm(entry);
    }
    /**
     * Coalesce a burst into one re-read.
     *
     * A single plain write produced FOUR directory events on macOS in this session's probe, and a
     * 380 KB write produced two. The debounce defends against that multiplicity rather than against
     * volume, and the window is the D-14 number.
     */
    function schedule() {
        if (debounce !== null)
            clearTimeout(debounce);
        debounce = setTimeout(() => {
            debounce = null;
            refresh();
        }, DEBOUNCE_MS);
    }
    function emit(result) {
        // The watch failures ride in the SAME `readErrors` list as the read failures, so a consumer
        // reading the JSON document sees "the low-latency path for the queue is down" in the one place
        // it already looks for what the projector could not do.
        const withWatch = errors.length === 0 ? result : { ...result, readErrors: [...result.readErrors, ...errors] };
        for (const readError of withWatch.readErrors) {
            io.stderr.write(`board-dashboard: ${readError.source} at ${readError.path} — ${readError.code}: ` +
                `${readError.message}\n`);
        }
        if (options.json) {
            // ONE COMPLETE DOCUMENT PER LINE (D-18). `JSON.stringify` emits no newline of its own, so the
            // line boundary is the document boundary and a consumer can split on it.
            io.stdout.write(`${JSON.stringify(withWatch)}\n`);
            return;
        }
        io.stdout.write(renderFrame(withWatch));
    }
    function refresh() {
        if (inFlight) {
            rerun = true;
            return;
        }
        inFlight = true;
        try {
            do {
                rerun = false;
                let result;
                try {
                    result = deps.read(options.repoRoot, previous);
                }
                catch (e) {
                    // The root went away under a running loop. A named line on stderr, the previous frame left
                    // standing, and the loop keeps polling — the tree may come back.
                    io.stderr.write(`board-dashboard: ${e.message}\n`);
                    return;
                }
                previous = result;
                emit(result);
            } while (rerun);
        }
        finally {
            inFlight = false;
            rerun = false;
        }
    }
    function start(pollMs) {
        // THE POLL IS MANDATORY AND CANNOT BE DISABLED. No flag sets it to zero or to Infinity: it is the
        // safety net for a watch orphaned by an atomic rename and for a filesystem that emits no events
        // at all (Windows may emit none — `UNKNOWN - verify`, Phase 33 / CAP-02). A dashboard whose only
        // refresh path is the watch is a dashboard that can look live and be frozen.
        poll = setInterval(() => {
            armAll();
            refresh();
        }, pollMs);
    }
    function stop() {
        if (debounce !== null) {
            clearTimeout(debounce);
            debounce = null;
        }
        if (poll !== null) {
            clearInterval(poll);
            poll = null;
        }
        for (const rel of [...watchers.keys()])
            closeWatcher(rel);
    }
    return {
        armAll,
        schedule,
        refresh,
        start,
        seed: (result) => {
            previous = result;
        },
        emit,
        stop,
        watchedDirs: () => [...watchers.keys()],
        watchErrors: () => [...errors],
    };
}
// ── The entry point ──────────────────────────────────────────────────────────────────────────────
function defaultIo() {
    return {
        stdout: process.stdout,
        stderr: process.stderr,
        isTty: process.stdout.isTTY === true,
    };
}
/**
 * Run one invocation: either to completion, or into a live loop.
 *
 * THIS IS THE FUNCTION THE PROCESS ENTRY POINT CALLS, and the only one that can hand back a running
 * loop. `main` is the one-shot contract beside it.
 */
export function run(argv, io = defaultIo(), deps = defaultDeps()) {
    const parsed = parseArgs(argv);
    if (parsed.kind === "help") {
        io.stdout.write(`${USAGE}\n`);
        return { kind: "exit", code: 0 };
    }
    if (parsed.kind === "usage") {
        io.stderr.write(`${parsed.message}\n`);
        return { kind: "exit", code: EXIT_USAGE };
    }
    const options = parsed.options;
    let first;
    try {
        first = deps.read(options.repoRoot);
    }
    catch (e) {
        // A NAMED ONE-LINE MESSAGE ON STDERR, NEVER A STACK ON STDOUT (T-32-08). An unreadable root is
        // exit 2 whether or not a loop was asked for: there is nothing to watch.
        io.stderr.write(`board-dashboard: ${e.message}\n`);
        return { kind: "exit", code: EXIT_USAGE };
    }
    // D-18: `--json` implies `--once` unless `--watch` is also given, and a non-TTY stdout implies it
    // too. A TTY with no flags at all is the live view.
    const loopRequested = options.watch || (io.isTty && !options.once && !options.json);
    const loop = createLoop(options, io, deps);
    loop.seed(first);
    loop.emit(first);
    if (!loopRequested) {
        return { kind: "exit", code: 0 };
    }
    loop.armAll();
    loop.start(options.intervalMs ?? POLL_FLOOR_MS);
    return { kind: "running", loop };
}
/**
 * Run ONE invocation and return its exit code.
 *
 * THE ONE-SHOT CONTRACT. Every caller that wants a frame and a code uses this: the `--once` path,
 * the `--json` path, and every case that captures output through an injected io. When the arguments
 * ask for a loop, this function stops the loop it armed and returns 0 rather than leaving timers and
 * watch handles behind for a caller that has no way to close them. The PROCESS entry point below
 * calls `run` instead, because it is the only caller that can own a live loop.
 */
export function main(argv, io = defaultIo()) {
    const result = run(argv, io);
    if (result.kind === "exit")
        return result.code;
    result.loop.stop();
    return 0;
}
// The tail mirrors `scripts/coordinator-resolution-precheck.ts:589-600`: the code initialises to the
// refusal value, so an unexpected throw can never exit 0. `isEntrypoint` is the ONE legal entry
// detection in this tree — a hand-rolled comparison reads FALSE under a symlinked invocation path,
// and the module then exits 0 having printed nothing, which a caller reads as a pass.
if (isEntrypoint(import.meta.url)) {
    try {
        const result = run(process.argv.slice(2));
        if (result.kind === "exit") {
            process.exit(result.code);
        }
        // A LOOP IS RUNNING AND THE PROCESS MUST NOT EXIT. The watch handles and the poll interval keep
        // the event loop alive; SIGINT is the way out, and it closes every handle and clears both timers
        // before exiting 0 so no partial frame and no partial JSON document is left on stdout.
        process.on("SIGINT", () => {
            result.loop.stop();
            process.exit(0);
        });
    }
    catch (e) {
        process.stderr.write(`board-dashboard: ${e.message}\n`);
        process.exit(EXIT_USAGE);
    }
}

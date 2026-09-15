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
// STDOUT IS A CHANNEL WITH ONE MEANING AT A TIME (D-18). With `--json` stdout carries
// one complete JSON document per line, one line per frame, and exactly one frame unless `--watch`
// is given — so a consumer reading a single frame parses the whole stream, and a consumer following
// a live run parses it line by line. Without `--json`, one plain-text frame. Every diagnostic,
// every refusal and every read-error summary goes to stderr, including the entry guard's own catch:
// a raw Node stack must never be the last thing a piped consumer reads (T-32-08).
//
// THE EXIT CODE IS NOT THE STATE CHANNEL (D-18). A stale or conflicted board still exits 0, because
// the state is IN the frame and in the JSON document, and a consumer that pipes the output should
// not have to decide whether a nonzero code meant "the board says something" or "the tool broke".
// Exit 2 is reserved for exactly two things: a usage error and an unreadable `repoRoot`.
//
// BOARD CONTENT IS UNTRUSTED INPUT TO A TERMINAL EMULATOR (T-32-06). A ticket title carrying an
// ANSI or OSC sequence would otherwise repaint, retitle or mislead the terminal of whoever ran the
// dashboard, and stderr is the same emulator as stdout on an interactive run.
//
// THIS MODULE HAS FOUR WRITE SITES, AND THE COUNT IS DERIVED RATHER THAN PROMISED. Three reach
// stdout — `run`'s usage write, `emit`'s frame write and `writeDocument`'s document write — and one
// reaches stderr, inside `warn`. `scripts/board-dashboard.test.ts` parses THIS FILE and pins both
// numbers and both sets of enclosing function names two-sided, so a fifth write site is red rather
// than a review comment. That is the whole claim; what each site does with the sanitizer is stated
// on the site itself. An earlier version of this paragraph asserted that every string reaching
// either channel was sanitized first, which was false of the `--json` document for as long as
// nobody checked it (CR-02) — a sentence naming its own checker is one a reader can falsify in a
// single command.
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

import { CONFLICT_KINDS, readSnapshot, unreadableSources } from "./board-read.js";
import { isEntrypoint } from "./is-entry.js";
import type { ReadError, SnapshotResult, SourceName } from "./board-read.js";
import type { BoardColumn, SourceState } from "./board-model.js";

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

export type Options = {
  readonly repoRoot: string;
  readonly once: boolean;
  readonly json: boolean;
  readonly watch: boolean;
  /** `null` when `--interval` was not given; the poll floor then applies. */
  readonly intervalMs: number | null;
};

/**
 * Three arms, no third state. A refusal carries the ONE LINE a human acts on.
 *
 * The usage block is NOT folded into that line. It is the program's own text and the caller appends
 * it; folding it in would put a newline the caller has to split on into a string that also quotes an
 * unvalidated argv token, which is how a refusal starts forging lines of its own (CR-05).
 */
export type ParsedArgs =
  | { readonly kind: "options"; readonly options: Options }
  | { readonly kind: "help" }
  | { readonly kind: "usage"; readonly message: string };

/**
 * The io the render branch writes through.
 *
 * INJECTED SO THE RENDER BRANCH IS TESTABLE WITHOUT A PTY. Production passes nothing and the call
 * site stays `main(process.argv.slice(2))`, so the injection point costs the shipped path nothing.
 */
export type DashboardIo = {
  readonly stdout: { write(chunk: string): unknown };
  readonly stderr: { write(chunk: string): unknown };
  readonly isTty: boolean;
  /**
   * The terminal width, or `undefined` when the caller has none.
   *
   * `process.stdout.columns` IS UNDEFINED ON A PIPE, which is the common case for a `--once` run in
   * CI. It arrives here rather than being read inside the renderer, because the renderer is pure
   * (D-15) and because a width that comes from a parameter is a width a case can name.
   */
  readonly columns?: number | undefined;
};

/**
 * The usage block, held as LINES rather than as one string.
 *
 * The line boundaries here are the PROGRAM's structure, and holding them as separate elements is
 * what lets `run` hand them to `warn` as separate arguments. `warn` removes every C0 code point from
 * each argument, the newline included, so a newline arriving inside an argument cannot forge a line
 * — and the refusal's own text quotes an unvalidated argv token.
 */
const USAGE_LINES: readonly string[] = [
  "usage: node scripts/board-dashboard.js [repoRoot] [--once] [--json] [--watch] [--interval <ms>] [--help]",
  "",
  "  repoRoot        the repository to project (default: the working directory)",
  "  --once          print one frame and exit 0, whatever the board says",
  "  --json          print JSON Lines and nothing else: one complete document per line,",
  "                  one line per frame, exactly one frame unless --watch is given",
  "  --watch         re-read on filesystem events, with a mandatory poll floor",
  `  --interval <ms> override the poll period (integer, at least ${INTERVAL_HARD_FLOOR_MS} ms)`,
  "  --help          print this message",
];

const USAGE = USAGE_LINES.join("\n");

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
export function parseArgs(argv: readonly string[]): ParsedArgs {
  let repoRoot: string | null = null;
  let once = false;
  let json = false;
  let watch = false;
  let intervalMs: number | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (arg === "--help" || arg === "-h") return { kind: "help" };
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
        return refuse(
          `\`--interval ${raw}\` is not a base-10 integer. The value is refused rather than ` +
            `coerced: a silently rounded interval is a screen that looks live and is frozen.`,
        );
      }
      const ms = Number.parseInt(raw, 10);
      if (ms < INTERVAL_HARD_FLOOR_MS) {
        return refuse(
          `\`--interval ${raw}\` is below the hard floor of ${INTERVAL_HARD_FLOOR_MS} ms. The ` +
            `value is refused rather than clamped, so the interval a caller reads back is the ` +
            `interval it asked for.`,
        );
      }
      intervalMs = ms;
      continue;
    }
    if (arg.startsWith("-")) {
      return refuse(`\`${arg}\` is not a known flag.`);
    }
    if (repoRoot !== null) {
      return refuse(
        `\`${arg}\` is a second positional argument. The dashboard projects exactly one ` +
          `repository per invocation.`,
      );
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

function refuse(message: string): ParsedArgs {
  return { kind: "usage", message: `board-dashboard: ${message}` };
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

export function sanitizeCell(s: string): string {
  return s.replace(CONTROL_CODE_POINTS, "");
}

/**
 * THE ONE PLACE THIS MODULE WRITES TO STDERR (CR-05, T-32-06, T-32-08).
 *
 * WHY A CHOKEPOINT RATHER THAN A SANITIZE AT EACH CALL SITE. There were six stderr writes here and
 * the sanitizer was applied at none of them, because the rule had been recorded as a property of
 * stdout. Sanitizing at six sites would make the rule true six times and leave the seventh edit free
 * to forget; routing through one site makes "a diagnostic that skipped the sanitizer" a thing that
 * cannot be written rather than a thing somebody must remember. `scripts/board-dashboard.test.ts`
 * pins the write-site count two-sided at one AND names this function, derived from this file's own
 * AST, so a count of one in the wrong place still goes red.
 *
 * EACH ARGUMENT IS ONE LINE, AND THE LINE BOUNDARY BELONGS TO THE CALLER. `sanitizeCell` removes
 * every C0 code point, the newline included, so text a caller passes cannot introduce a break and
 * forge a second diagnostic — which matters because the text is frequently file bytes or an argv
 * token. A caller with genuine multi-line structure of its own passes multiple arguments; the usage
 * block is the only one that does.
 *
 * `sanitizeCell` IS UNCHANGED BY THIS. What it removes is decided in one place above; this function
 * decides only WHERE it is applied.
 */
function warn(io: DashboardIo, ...lines: readonly string[]): void {
  io.stderr.write(`${lines.map(sanitizeCell).join("\n")}\n`);
}

/**
 * THE ONE PLACE A SERIALIZED DOCUMENT REACHES STDOUT (CR-02, T-32-18-01).
 *
 * WHAT THE DEFECT WAS. `emit`'s JSON arm wrote `JSON.stringify(withWatch)` straight to the channel.
 * `JSON.stringify` escapes the C0 range and does NOT escape the C1 range, so U+009B (the 8-bit CSI
 * introducer) and U+009D (the 8-bit OSC introducer) — both acted on by xterm, iTerm2 and the VTE
 * family in UTF-8 mode — travelled from a ticket title into the published document verbatim. The
 * module header claimed both channels were sanitized while one of them was not, which is worse than
 * the leak: a docblock asserting a property the code lacks is how the next reviewer stops checking.
 *
 * WHY THE SERIALIZED TEXT AND NOT THE VALUES. The document's KEYS are content-derived as well —
 * the dial's per-column limits are keyed by column NAME, and a column name is a line an agent wrote
 * into `plans/board.md` — so a rule that only visited values would answer for half the document.
 * Sanitizing after serialization reaches keys and values by one rule. Nothing structural is at risk:
 * the removal set is the C0 range, the C1 range and DEL, no JSON structural character is in any of
 * them, and `JSON.stringify` has already escaped every C0 that belongs inside a string.
 *
 * WHAT THIS DOES NOT REMOVE, STATED RATHER THAN IMPLIED. An ESCAPED code point inside a string
 * literal — the six-character backslash-u form `JSON.stringify` writes for a C0 — is TEXT in the
 * document and stays. It becomes a control character only if a consumer decodes the document and
 * prints the value without sanitizing it, and rewriting it here would mean altering a value the
 * consumer asked for. The boundary is recorded in this plan's summary as a known limit, not closed.
 *
 * THE LINE BOUNDARY IS APPENDED AFTER THE REMOVAL, so the document boundary is this function's
 * structure and never content's: `sanitizeCell` removes every C0 including the newline, which is
 * what stops board content from forging a second JSON Lines record (D-18).
 *
 * `sanitizeCell` IS UNCHANGED BY THIS, exactly as it is by `warn`. What is removed stays decided in
 * one place; this function decides only where the rule is applied.
 */
function writeDocument(io: DashboardIo, value: unknown): void {
  io.stdout.write(`${sanitizeCell(JSON.stringify(value))}\n`);
}

// ── The frame (D-17) ─────────────────────────────────────────────────────────────────────────────
//
// THE FRAME IS A PURE FUNCTION OF THE RESULT, THE WIDTH AND THE STYLE. It reads no `process`, no
// environment variable and no clock. That is what lets a case render a two-stale-source board at 20
// columns without a pty and without mutating global state — and it is what keeps the header's
// "12m ago" derived from the snapshot's own timestamps rather than from the wall clock, so two runs
// over the same document produce the same bytes.
//
// MINIMAL ANSI, NO CURSOR-ADDRESSING LIBRARY (D-17). The escapes live in `STYLE` and `main` passes
// `PLAIN_STYLE` when stdout is not a TTY, so the non-TTY path is THE SAME RENDERER with empty
// constants rather than a second implementation free to disagree with the first. One authority per
// predicate is this repository's recorded lesson; "how a frame looks" is a predicate.
//
// STYLE IS APPLIED AFTER TRUNCATION AND NEVER INSIDE A CELL. An escape inside a cell would count
// toward the width, so the cut would move when the styling changed; an escape around a whole line
// cannot. The one exception is the header's badge, and the header is deliberately not truncated —
// see `renderHeader`.

/** The named escape constants. `main` passes the empty twin below when stdout is not a TTY. */
export type Style = {
  readonly bold: string;
  readonly badge: string;
  readonly reset: string;
};

// Spelled with `\u` escapes rather than literal bytes, so this source file carries no control
// character of its own for `scripts/check-nul-bytes.ts` or a reviewer to trip over.
export const STYLE: Style = {
  bold: "\u001B[1m",
  badge: "\u001B[33m",
  reset: "\u001B[0m",
};

/** The non-TTY twin: the same three names, all empty. A redirected run emits no escape byte. */
export const PLAIN_STYLE: Style = { bold: "", badge: "", reset: "" };

/** Clear the screen and home the cursor. A plain sequence, emitted only on a TTY (D-17). */
export const CLEAR_SCREEN = "\u001B[2J\u001B[H";

/** The width a frame falls back to when the caller has none — a pipe reports no columns. */
export const DEFAULT_WIDTH = 80;

/** The ellipsis a truncated cell ends with. One code unit, so it costs one column. */
const ELLIPSIS = "…";

function normalizeWidth(width: number | undefined): number {
  if (width === undefined || !Number.isFinite(width)) return DEFAULT_WIDTH;
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
export function truncateCell(s: string, width: number): string {
  const max = Math.max(1, Math.floor(width));
  if (s.length <= max) return s;
  let cut = max - 1;
  const lead = s.charCodeAt(cut - 1);
  if (cut > 0 && lead >= 0xd800 && lead <= 0xdbff) cut -= 1;
  return `${s.slice(0, cut)}${ELLIPSIS}`;
}

/** Sanitize, then cut. In that order, so a stripped sequence cannot move where the cut falls. */
function cell(text: string, width: number): string {
  return truncateCell(sanitizeCell(text), width);
}

/** Human-rounded bytes for a header a person reads. The snapshot field keeps the exact number. */
function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A UTF-16 code-unit count for a header a person reads, GROUPED AND NAMING ITS OWN UNIT (WR-05).
 *
 * `bounds.longestLine` is code units and `bounds.boardBytes` is UTF-8 bytes. The contract states
 * that the two disagree on any board carrying characters outside Latin-1, so each number states its
 * own unit; rendering a code-unit count through `humanBytes` stated the wrong one. The grouping is
 * done here rather than through `toLocaleString`, so the rendered header is a function of the number
 * alone and not of whichever ICU data the host Node was built with.
 */
function humanChars(n: number): string {
  const digits = Math.max(0, Math.trunc(n)).toString();
  return `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} chars`;
}

/** Human-rounded age between two ISO instants, coarsened upward. */
function humanAge(since: string, now: string): string {
  const ms = Date.parse(now) - Date.parse(since);
  if (!Number.isFinite(ms) || ms < 0) return "unknown";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
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
export function renderHeader(result: SnapshotResult, style: Style): string {
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
      const s = state as Extract<SourceState<unknown>, { source: "stale" }>;
      return `${name} (${humanAge(s.stale.since, snapshot.generatedAt)}, ${s.stale.reason})`;
    });
  // AND THE SOURCES THAT ARE UNAVAILABLE BECAUSE A READ FAILED (plan 32-09, CR-02). A source whose
  // first read failed has no previous good value to carry, so it settles `unavailable` — the same
  // arm a legitimately absent source lands on. `unreadableSources` is the ONE authority that tells
  // the two apart, and it is the read seam's, not a second derivation here: a badge that disagreed
  // with the `--json` document's own discriminant is the drift this repository has paid for.
  // "never read" rather than an age, because there is no last good read to state the age of.
  const unreadable = unreadableSources(snapshot.sources, result.readErrors).map(
    ({ name, code }) => `${name} (never read, ${sanitizeCell(code)})`,
  );
  const badged = [...stale, ...unreadable];
  if (badged.length > 0) {
    parts.push(`${style.badge}STALE: ${badged.join(", ")}${style.reset}`);
  }

  parts.push(`${result.conflicts.length} conflicts`);

  const bounds = snapshot.board?.bounds;
  if (bounds !== undefined && bounds.exceeded) {
    parts.push(
      `${style.badge}LARGE BOARD (${humanBytes(bounds.boardBytes)}, longest line ` +
        `${humanChars(bounds.longestLine)})${style.reset}`,
    );
  }

  return parts.join("  ");
}

/** The board's columns in on-disk order with Blocked last, whatever its heading's position. */
function orderedColumns(result: SnapshotResult): readonly BoardColumn[] {
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
function wipCell(column: BoardColumn, disputed: boolean): string {
  if (disputed) {
    const limit = column.limit === null ? "unlimited" : String(column.limit);
    return `claimed ${column.claimedLive ?? "-"} / counted ${column.rows.length} / limit ${limit}`;
  }
  if (column.kind === "limited" && column.claimedLive !== null && column.limit !== null) {
    return `${column.claimedLive}/${column.limit}`;
  }
  if (column.kind === "unlimited") return "unlimited";
  return "-";
}

function plural(n: number, one: string, many: string): string {
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
export function renderColumns(result: SnapshotResult, width: number, style: Style): string[] {
  const columns = orderedColumns(result);
  if (columns.length === 0) return [];

  const unparsed = result.snapshot.board?.unparsed ?? [];
  const disputedColumns = new Set(
    result.conflicts.filter((c) => c.kind === "wip-count").map((c) => c.column),
  );
  const nameWidth = columns.reduce((w, c) => Math.max(w, sanitizeCell(c.name).length), 0);

  const lines: string[] = [];
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
export function renderNowRunningBlock(result: SnapshotResult, width: number, style: Style): string[] {
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
export function renderConflicts(result: SnapshotResult, width: number, style: Style): string[] {
  const conflicts = result.conflicts;
  if (conflicts.length === 0) {
    return [`${style.bold}${cell("Conflicts  none", width)}${style.reset}`];
  }
  const lines = [`${style.bold}${cell(`Conflicts (${conflicts.length})`, width)}${style.reset}`];
  for (const kind of CONFLICT_KINDS) {
    const group = conflicts.filter((c) => c.kind === kind);
    if (group.length === 0) continue;
    lines.push(cell(`  ${kind}`, width));
    for (const conflict of group) {
      const subject = [conflict.ticketId, conflict.column].filter((s) => s !== undefined).join(" ");
      lines.push(
        cell(
          `    ${subject === "" ? "-" : subject}  expected: ${conflict.expected}  ` +
            `actual: ${conflict.actual}`,
          width,
        ),
      );
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
export function renderFrame(
  result: SnapshotResult,
  width?: number,
  style: Style = PLAIN_STYLE,
): string {
  const w = normalizeWidth(width);
  const lines: string[] = [renderHeader(result, style)];

  if (result.snapshot.board === null) {
    // D-11 forbids an empty board as an output state. A board that could not be read says so on its
    // own line; it never renders as zero columns a reader would mistake for an empty backlog.
    lines.push(cell("no board: plans/board.md was not readable on this tree", w));
  } else {
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
] as const satisfies readonly { rel: string; source: SourceName }[];

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

/** The part of `fs.FSWatcher` this loop uses. Narrow, so a test can supply one without a filesystem. */
export type WatchHandle = {
  close(): void;
  on(event: "error", listener: (e: Error) => void): unknown;
};

/**
 * The three effects the loop has on the world, injected.
 *
 * `board-read.ts` holds no timer and no handle (D-15, D-23): the process-owning module owns them.
 * Injecting the three lets every case below drive a real loop with fake timers and a fake watcher,
 * rather than sleeping on wall-clock time and hoping — a test that sleeps for its assertion is a
 * test that fails on a loaded machine and passes on an idle one.
 */
export type LoopDeps = {
  readonly watch: (
    dir: string,
    listener: (eventType: string, filename: string | null) => void,
  ) => WatchHandle;
  readonly exists: (path: string) => boolean;
  readonly read: (repoRoot: string, previous?: SnapshotResult) => SnapshotResult;
};

export function defaultDeps(): LoopDeps {
  return {
    // NO `recursive` OPTION. See the WATCH_DIRS docblock.
    watch: (dir, listener) => watch(dir, listener),
    exists: existsSync,
    read: readSnapshot,
  };
}

/** The live loop, as `run` and the entry point hold it. */
export type Loop = {
  /** Arm every directory in the list that exists and is not already armed. */
  readonly armAll: () => void;
  /** Coalesce a burst of events into one re-read. */
  readonly schedule: () => void;
  /** Read once and emit once. Single-flight. */
  readonly refresh: () => void;
  /** Start the MANDATORY poll at `pollMs`. There is no argument that stops it. */
  readonly start: (pollMs: number) => void;
  /** Hand the loop the first read, so the next one has a last-good value to carry forward. */
  readonly seed: (result: SnapshotResult) => void;
  /** Write one frame or one JSON document, plus every read error on stderr. */
  readonly emit: (result: SnapshotResult) => void;
  /** Close every watcher and clear both timers. */
  readonly stop: () => void;
  readonly watchedDirs: () => readonly string[];
  readonly watchErrors: () => readonly ReadError[];
};

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
export function createLoop(options: Options, io: DashboardIo, deps: LoopDeps): Loop {
  const watchers = new Map<string, WatchHandle>();
  const errors: ReadError[] = [];
  const forced = new Set(
    (process.env[FORCE_WATCH_ERROR_ENV] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== ""),
  );
  const forcedAlreadyFired = new Set<string>();

  let debounce: ReturnType<typeof setTimeout> | null = null;
  let poll: ReturnType<typeof setInterval> | null = null;
  let previous: SnapshotResult | undefined;
  let inFlight = false;
  let rerun = false;

  function noteWatchError(rel: string, source: SourceName, e: Error): void {
    errors.push({
      source,
      path: rel,
      code: "watch",
      message:
        `the watch on ${rel} failed (${e.message}). It is closed and will be re-armed on the next ` +
        `poll tick; the mandatory poll keeps the screen current in the meantime.`,
    });
  }

  function closeWatcher(rel: string): void {
    const w = watchers.get(rel);
    if (w === undefined) return;
    try {
      w.close();
    } catch {
      /* a handle that cannot be closed is already gone */
    }
    watchers.delete(rel);
  }

  function arm(entry: { rel: string; source: SourceName }): void {
    const { rel, source } = entry;
    if (watchers.has(rel)) return;
    const dir = join(options.repoRoot, rel);
    if (!deps.exists(dir)) return; // it may appear later; a poll tick will arm it then
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
    } catch (e) {
      noteWatchError(rel, source, e as Error);
    }
  }

  function armAll(): void {
    for (const entry of WATCH_DIRS) arm(entry);
  }

  /**
   * Coalesce a burst into one re-read.
   *
   * A single plain write produced FOUR directory events on macOS in this session's probe, and a
   * 380 KB write produced two. The debounce defends against that multiplicity rather than against
   * volume, and the window is the D-14 number.
   */
  function schedule(): void {
    if (debounce !== null) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      refresh();
    }, DEBOUNCE_MS);
  }

  function emit(result: SnapshotResult): void {
    // The watch failures ride in the SAME `readErrors` list as the read failures, so a consumer
    // reading the JSON document sees "the low-latency path for the queue is down" in the one place
    // it already looks for what the projector could not do.
    const withWatch: SnapshotResult =
      errors.length === 0 ? result : { ...result, readErrors: [...result.readErrors, ...errors] };

    for (const readError of withWatch.readErrors) {
      // THE CONTENT-SOURCED PATH (CR-05). `readError.message` carries bytes read out of a board or
      // ticket file — including a ticket's own first line, quoted back by the grammar's
      // `no-opening-delimiter` refusal before anything has looked at it.
      warn(
        io,
        `board-dashboard: ${readError.source} at ${readError.path} — ${readError.code}: ` +
          `${readError.message}`,
      );
    }
    if (options.json) {
      // ONE COMPLETE DOCUMENT PER LINE (D-18), one line per frame, and exactly one frame unless
      // `--watch` is given. `JSON.stringify` emits no newline of its own, so the line boundary IS
      // the document boundary and a consumer can split on it. The whole document is BUFFERED and
      // written in ONE call, so an interrupted run cannot leave a half-written line a consumer would
      // fail to parse (T-32-23).
      //
      // This sentence is the one the header and `USAGE` now adopt. They used to promise "exactly one
      // JSON document and nothing else", which described a program that does not exist under
      // `--watch`: a consumer that read the help text and parsed the whole stream got a parse error
      // on the second frame, and the failure looked like a tool defect rather than a documentation
      // defect (WR-06). The behaviour D-18 decided is unchanged; the prose is what was wrong.
      //
      // THE SERIALIZATION AND THE WRITE BOTH BELONG TO `writeDocument` (CR-02). This arm used to do
      // both itself and reached the channel with no sanitizer on the way, which is how U+009B and
      // U+009D travelled from a ticket title into the document. Moving them into one function makes
      // "a document that skipped the sanitizer" a thing that cannot be written rather than a thing
      // somebody has to remember at each new arm.
      writeDocument(io, withWatch);
      return;
    }
    // THE TTY BRANCH IS THE SAME RENDERER WITH DIFFERENT CONSTANTS (D-17, D-18). A redirected run
    // passes the empty style and never clears, so a pipe receives plain text with no escape byte;
    // a terminal gets the redraw and the minimal ANSI. Two renderers would be two authorities for
    // one predicate, free to disagree about a frame nobody compares side by side.
    const frame = renderFrame(withWatch, io.columns, io.isTty ? STYLE : PLAIN_STYLE);
    io.stdout.write(io.isTty ? `${CLEAR_SCREEN}${frame}` : frame);
  }

  function refresh(): void {
    if (inFlight) {
      rerun = true;
      return;
    }
    inFlight = true;
    try {
      do {
        rerun = false;
        let result: SnapshotResult;
        try {
          result = deps.read(options.repoRoot, previous);
        } catch (e) {
          // The root went away under a running loop. A named line on stderr, the previous frame left
          // standing, and the loop keeps polling — the tree may come back.
          warn(io, `board-dashboard: ${(e as Error).message}`);
          return;
        }
        previous = result;
        emit(result);
      } while (rerun);
    } finally {
      inFlight = false;
      rerun = false;
    }
  }

  function start(pollMs: number): void {
    // THE POLL IS MANDATORY AND CANNOT BE DISABLED. No flag sets it to zero or to Infinity: it is the
    // safety net for a watch orphaned by an atomic rename and for a filesystem that emits no events
    // at all (Windows may emit none — `UNKNOWN - verify`, Phase 33 / CAP-02). A dashboard whose only
    // refresh path is the watch is a dashboard that can look live and be frozen.
    poll = setInterval(() => {
      armAll();
      refresh();
    }, pollMs);
  }

  function stop(): void {
    if (debounce !== null) {
      clearTimeout(debounce);
      debounce = null;
    }
    if (poll !== null) {
      clearInterval(poll);
      poll = null;
    }
    for (const rel of [...watchers.keys()]) closeWatcher(rel);
  }

  return {
    armAll,
    schedule,
    refresh,
    start,
    seed: (result: SnapshotResult) => {
      previous = result;
    },
    emit,
    stop,
    watchedDirs: () => [...watchers.keys()],
    watchErrors: () => [...errors],
  };
}

// ── The entry point ──────────────────────────────────────────────────────────────────────────────

function defaultIo(): DashboardIo {
  return {
    stdout: process.stdout,
    stderr: process.stderr,
    isTty: process.stdout.isTTY === true,
    // `undefined` on a pipe, which is the common case in CI. The renderer falls back to
    // `DEFAULT_WIDTH` rather than to whatever a runtime happened to guess.
    columns: process.stdout.columns,
  };
}

/**
 * Two arms. An invocation either finished with an exit code, or it left a LOOP running.
 *
 * The distinction has to be in the return value, because the process must not exit while a loop is
 * armed and only the caller can decide that. `main` below collapses it for the one-shot callers.
 */
export type RunResult =
  | { readonly kind: "exit"; readonly code: number }
  | { readonly kind: "running"; readonly loop: Loop };

/**
 * Run one invocation: either to completion, or into a live loop.
 *
 * THIS IS THE FUNCTION THE PROCESS ENTRY POINT CALLS, and the only one that can hand back a running
 * loop. `main` is the one-shot contract beside it.
 */
export function run(
  argv: readonly string[],
  io: DashboardIo = defaultIo(),
  deps: LoopDeps = defaultDeps(),
): RunResult {
  const parsed = parseArgs(argv);

  if (parsed.kind === "help") {
    io.stdout.write(`${USAGE}\n`);
    return { kind: "exit", code: 0 };
  }
  if (parsed.kind === "usage") {
    // The refusal's one line, a blank, then the program's own usage block. The block arrives as
    // separate arguments rather than as embedded newlines, so the refusal text — which quotes an
    // unvalidated argv token — has no way to add a line of its own.
    warn(io, parsed.message, "", ...USAGE_LINES);
    return { kind: "exit", code: EXIT_USAGE };
  }

  const options = parsed.options;

  let first: SnapshotResult;
  try {
    first = deps.read(options.repoRoot);
  } catch (e) {
    // A NAMED ONE-LINE MESSAGE ON STDERR, NEVER A STACK ON STDOUT (T-32-08). An unreadable root is
    // exit 2 whether or not a loop was asked for: there is nothing to watch.
    //
    // THE ARGV-SOURCED PATH (CR-05). This line echoes `repoRoot` before anything has validated it,
    // and the errno text quotes it a second time. Both quotations pass through the chokepoint,
    // which is why the fix is at the WRITE site rather than at the message.
    warn(io, `board-dashboard: ${(e as Error).message}`);
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
export function main(argv: readonly string[], io: DashboardIo = defaultIo()): number {
  try {
    const result = run(argv, io);
    if (result.kind === "exit") return result.code;
    result.loop.stop();
    return 0;
  } catch (e) {
    // ONE NAMED LINE ON STDERR, NEVER A STACK (T-32-08). The last bytes a piped consumer reads are
    // the ones it is most likely to log, paste into an issue, or match on. A raw Node stack there
    // leaks absolute paths and module layout and tells the caller nothing it can act on, so the
    // message is flattened to a single line and the exit code carries the rest.
    warn(io, `board-dashboard: ${oneLine(e)}`);
    return EXIT_USAGE;
  }
}

/** Whatever was thrown, as ONE line: a multi-line message is still one failure to report. */
function oneLine(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  return message.replace(/\s+/g, " ").trim();
}

/**
 * The interrupt contract, as a FUNCTION rather than as a closure inside the entry tail.
 *
 * A CLOSURE IN THE TAIL IS UNREACHABLE FROM A CASE. The tail runs only under `isEntrypoint`, so the
 * only way to observe it is to spawn a process and signal it — which proves the exit code and
 * proves nothing about whether the watch handles were closed or the timers cleared before the
 * process went away. As a function it is drivable with a fake loop, and the spawned-process case in
 * task 3 still pins the code a shell sees.
 *
 * NOTHING PARTIAL IS FLUSHED. `stop()` clears the debounce and the poll and closes every watcher;
 * there is no buffered frame to write out, because each frame and each JSON document is written in
 * a single call (T-32-23).
 */
export function handleInterrupt(loop: Loop, exit: (code: number) => void): void {
  loop.stop();
  exit(0);
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
      handleInterrupt(result.loop, (code) => process.exit(code));
    });
  } catch (e) {
    // THE PATH THAT MATTERS MOST, AND THE ONE THE REVIEW'S SKETCH NAMED LAST. This is where a raw
    // Node stack would otherwise be the last thing a piped consumer reads (T-32-08), and it is the
    // one write that used to reach `process.stderr` directly rather than through the injected io.
    // It goes through the same chokepoint as every other diagnostic; `defaultIo()` is how the tail
    // gets the channel, since it is outside any function that was handed one.
    warn(defaultIo(), `board-dashboard: ${(e as Error).message}`);
    process.exit(EXIT_USAGE);
  }
}

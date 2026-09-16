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
// WHAT THE `--json` DOCUMENT GUARANTEES IS ABOUT WHAT A CONSUMER RECOVERS, NOT ABOUT ITS BYTES
// (T-32-35-01). A value read back from ONE parse of a published document carries no C0 code point,
// no C1 code point and no DEL, in any string value or any object key at any depth — because the
// values are scrubbed BEFORE they are serialized. An earlier version of this claim was about the
// serialized text, and it was true of the bytes and false of the parse: `JSON.stringify` escapes
// the C0 range, the post-serialization pass removes what stays raw, and the two are exactly
// complementary, so a raw escape byte in an ordinary ticket title survived as a real control code
// point in whatever a consumer parsed. A claim about a channel has to name what the channel's
// reader gets. What remains outside it is a consumer that RE-ENCODES a recovered value with its own
// serializer and decodes the result again; that control character is manufactured downstream, and
// it is recorded as a limit rather than promised away.
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
import { dirname, join } from "node:path";

import {
  CONFLICT_KINDS,
  FIXED_SUBPATHS,
  QUEUE_STAGES,
  SOURCE_NAMES,
  insideRoot,
  readSnapshot,
  unreadableSources,
} from "./board-read.js";
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
 * Apply `sanitizeCell` to every string VALUE and every object KEY of a value, at every depth.
 *
 * WHY THIS EXISTS, MEASURED RATHER THAN ARGUED. `writeDocument` used to sanitize the SERIALIZED
 * TEXT, and that ordering has a hole the raw bytes cannot show. `JSON.stringify` escapes the C0
 * range into the six printable characters of a backslash-u form and leaves the C1 range raw; the
 * post-serialization removal takes what is raw. The two are exactly complementary: each hides the
 * gap the other would have caught, so the published bytes carried zero control code points while
 * ONE parse of the same document recovered fourteen of them from an ordinary ticket title, a column
 * heading and a dial key. The count and the fourteen paths are in
 * `.planning/phases/32-board-projector-cli-dashboard/32-35-RED-baseline.txt` § 2. CLAUDE.md's
 * no-fabrication rule is about what a consumer RECEIVES, and under D-18 the `--json` consumer's
 * receipt is what it parses, not what is on the wire.
 *
 * WHY BEFORE SERIALIZATION AND NEVER AFTER IT. The rejected alternative is to strip the escaped
 * six-character sequences out of the serialized text. That is rejected for the reason the previous
 * docblock gave for leaving them alone: a sequence that was already TEXT in the input — a ticket
 * title in which somebody typed a backslash, a `u` and four hex digits — is a value the consumer
 * asked for, and rewriting it alters data. Scrubbing BEFORE serialization has the property the
 * other ordering cannot have: it never sees an escaped form at all, because no escaping has
 * happened yet, so it cannot alter one. It removes code points; the serializer then escapes
 * whatever text remains, and there is nothing left for it to escape into a control character.
 *
 * KEYS AS WELL AS VALUES, because the document's keys are content-derived: `config.wipLimits` is
 * keyed by COLUMN NAME, and a column name is a line an agent wrote into `plans/board.md`. A pass
 * that visited only values would answer for half the document — which is the half the old ordering
 * happened to get right.
 *
 * TWO KEYS THAT DIFFER ONLY BY A CONTROL CODE POINT COLLIDE, AND THE LATER ONE WINS. That is stated
 * rather than guarded: the same collapse happens to two VALUES that differ only by one, and a
 * distinction a terminal cannot render and a reader cannot see is not one a consumer could act on.
 * Refusing the document instead would let board content decide whether the projector runs.
 *
 * Numbers, booleans, null and `undefined` are returned unchanged; arrays are mapped; nested objects
 * are descended. `sanitizeCell` IS UNCHANGED BY THIS: what is removed stays decided in one place.
 */
function scrub(value: unknown): unknown {
  if (typeof value === "string") return sanitizeCell(value);
  if (Array.isArray(value)) return value.map((element) => scrub(element));
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[sanitizeCell(key)] = scrub(v);
    }
    return out;
  }
  return value;
}

/**
 * THE ONE PLACE A SERIALIZED DOCUMENT REACHES STDOUT (CR-02, T-32-18-01, T-32-35-01).
 *
 * WHAT THE DEFECT WAS. `emit`'s JSON arm wrote `JSON.stringify(withWatch)` straight to the channel.
 * `JSON.stringify` escapes the C0 range and does NOT escape the C1 range, so U+009B (the 8-bit CSI
 * introducer) and U+009D (the 8-bit OSC introducer) — both acted on by xterm, iTerm2 and the VTE
 * family in UTF-8 mode — travelled from a ticket title into the published document verbatim. The
 * module header claimed both channels were sanitized while one of them was not, which is worse than
 * the leak: a docblock asserting a property the code lacks is how the next reviewer stops checking.
 *
 * TWO PASSES, TWO DIFFERENT REASONS, AND NEITHER REPLACES THE OTHER.
 *
 *   • `scrub` FIRST, over the VALUE. It is what a consumer RECOVERS that has to be clean, and a
 *     consumer recovers what one parse yields. Sanitizing only the serialized text left every C0
 *     the serializer had already escaped intact as a real code point after that parse — the
 *     fourteen recorded in the RED baseline. See `scrub` above for why the ordering, and not the
 *     removal set, is what changed.
 *
 *   • THE POST-SERIALIZATION PASS SECOND, over the TEXT, and it STAYS. It is the BACKSTOP on the
 *     line boundary, and its scope is stated precisely rather than overclaimed: it removes every
 *     code point still RAW in the serialized text, which is the set `scrub` did not reach. With
 *     `scrub` correct that set is empty, so this pass is redundant TODAY — and that is the point
 *     of it. The line boundary is what makes the document boundary this module's structure rather
 *     than content's (D-18), and a property that important is not left resting on one pass whose
 *     coverage a future edit could narrow by one branch. The discrimination is MEASURED rather
 *     than argued, in `.planning/phases/32-board-projector-cli-dashboard/32-35-GREEN-proof.txt`
 *     § 3: narrow `scrub` by one branch and this pass is what still keeps a raw control byte off
 *     the wire; remove both and it reaches the channel.
 *
 *     The line boundary also has a SECOND, independent guarantor that is not this module's:
 *     `JSON.stringify` escapes U+000A inside every string it writes, so a newline in content
 *     cannot reach the serialized text by that route at all. Both are true, both are stated, and
 *     neither is presented as the whole reason.
 *
 * WHAT REMAINS OUTSIDE THIS, STATED RATHER THAN IMPLIED. A consumer that takes a recovered value
 * and RE-ENCODES it — serializes the parsed document again and decodes the result a second time —
 * is manufacturing control characters with its own serializer out of text this function guarantees
 * is already clean. That is a property of the consumer's pipeline, not of this document, and it is
 * recorded as a known limit rather than closed here.
 *
 * `sanitizeCell` IS UNCHANGED BY THIS, exactly as it is by `warn`. What is removed stays decided in
 * one place; this function decides only where the rule is applied, and now in which order.
 */
function writeDocument(io: DashboardIo, value: unknown): void {
  io.stdout.write(`${sanitizeCell(JSON.stringify(scrub(value)))}\n`);
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
 *
 * AND IT IS A LOOP RATHER THAN A REGEX. The obvious spelling of digit grouping is a pure zero-width
 * lookahead, whose cost is quadratic in subject length; `scripts/check-uat-oracles.test.ts` holds a
 * closed class over `scripts/` refusing exactly that, because this repository has already shipped one
 * non-terminating CI gate through it. One left-to-right pass over at most ten digits is linear and
 * needs no exemption.
 */
function humanChars(n: number): string {
  const digits = Math.max(0, Math.trunc(n)).toString();
  let grouped = "";
  for (let i = 0; i < digits.length; i += 1) {
    // A separator every three digits counted from the RIGHT, so the leading group is the short one.
    if (i > 0 && (digits.length - i) % 3 === 0) grouped += ",";
    grouped += digits[i];
  }
  return `${grouped} chars`;
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
 *
 * AND THE SANITIZATION IS A CHOKEPOINT NOW, NOT A CONVENTION (WR-06, T-32-35-03). The header is the
 * one arm the stdout write-site census deliberately exempts from `writeDocument`, and what stood in
 * for the chokepoint here was `sanitizeCell` applied by hand at whichever fields somebody
 * remembered. The RED baseline counted the exceptions from this function's own syntax tree: nine
 * parts sites, three sanitized, six not. Every part is now produced by `part` below, and
 * `scripts/board-dashboard.test.ts` derives that claim from the syntax tree and pins the site count
 * two-sided, so a new part is a number somebody looks at rather than a field somebody remembers.
 */
export function renderHeader(result: SnapshotResult, style: Style): string {
  const snapshot = result.snapshot;
  const mode = snapshot.config?.mode ?? "unknown";
  const columns = orderedColumns(result);

  /**
   * THE ONE PLACE A HEADER PART IS PRODUCED.
   *
   * It sanitizes for the reason `cell` does — board content reaches a terminal emulator that acts
   * on control introducers — and it deliberately does NOT truncate, for the reason this function's
   * docblock gives: a cut badge is a frame that looks confident for exactly the reason it should
   * not be.
   *
   * Parts that carry no content today still go through it. A part whose value ranges over a closed
   * set is not the thing being defended against; an exception that has to be re-justified at every
   * edit is.
   */
  const part = (s: string): string => sanitizeCell(s);

  const parts = [
    part("grugops board"),
    part(snapshot.repoRoot),
    part(`mode: ${mode}`),
    part(`read: ${snapshot.generatedAt}`),
    part(`${columns.length} columns`),
    part(`[${result.source}]`),
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
    ({ name, code }) => `${name} (never read, ${code})`,
  );
  const badged = [...stale, ...unreadable];
  // THE STYLE CODES ARE THE ONE THING DELIBERATELY OUTSIDE `part`, AND THAT IS NAMED HERE RATHER
  // THAN LEFT TO BE INFERRED. `style.badge` and `style.reset` ARE control sequences — this module's
  // own, chosen from `STYLE`, empty on a non-TTY run — so routing them through a function whose job
  // is to remove control sequences would delete the badge that makes the warning visible. They are
  // the module's structure around the part, exactly as the newline is the module's structure around
  // the document in `writeDocument`. Everything BETWEEN them is content and goes through `part`.
  if (badged.length > 0) {
    parts.push(`${style.badge}${part(`STALE: ${badged.join(", ")}`)}${style.reset}`);
  }

  parts.push(part(`${result.conflicts.length} conflicts`));

  const bounds = snapshot.board?.bounds;
  if (bounds !== undefined && bounds.exceeded) {
    // Same split as the badge above: this module's style codes outside, the content inside.
    parts.push(
      `${style.badge}${part(
        `LARGE BOARD (${humanBytes(bounds.boardBytes)}, longest line ` +
          `${humanChars(bounds.longestLine)})`,
      )}${style.reset}`,
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
// SIX EXPLICIT DIRECTORIES, AND NEVER A RECURSIVE WATCH. `recursive` is the platform-variable part
// of `fs.watch`: it is supported on macOS and Windows and throws
// `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` where it is not. D-14's explicit set exists to avoid that
// question entirely — and the set is DERIVED from the reader's layout rather than named here, so the
// cost of being explicit is no longer a third copy of the on-disk layout (WR-07).
//
// DIRECTORY-LEVEL, NOT FILE-LEVEL, AND THE REASON WAS MEASURED. A probe this session (RESEARCH
// §Filesystem Watching) armed both kinds on the same target: the FILE watch died after the first
// atomic rename and missed every later change, because it is bound to the replaced inode. grugops's
// own `atomicWrite` writes a temp sibling and renames it, so a file-level watch on a board this kit
// maintains is orphaned by the kit's own write path. The directory watch survived every operation.
//
/** One watched directory and the source whose failure it is reported against. */
export type WatchDir = { readonly rel: string; readonly source: SourceName };

/**
 * The ONE source this layout deliberately does not watch (D-14).
 *
 * A SOURCE NAME RATHER THAN A DIRECTORY. The dial's own subpath stays in `FIXED_SUBPATHS`, where the
 * reader owns it; naming it here would be a fourth place the layout is spelled, which is the defect
 * this derivation exists to remove.
 */
const UNWATCHED_SOURCE: SourceName = "config";

/**
 * The directory a watch is armed on for one source subpath.
 *
 * A FINAL SEGMENT CARRYING AN EXTENSION NAMES A FILE, and a file is watched through its PARENT
 * directory — the file-level watch is the one the RESEARCH probe measured dying on the first atomic
 * rename. `plans/board.md` therefore contributes `plans`, and a board that moves to `docs/board.md`
 * moves the watch with it. Every directory-shaped subpath in `FIXED_SUBPATHS` has a final segment
 * with no dot in it, and every file-shaped one ends in `.md` or `.json`, so the rule reads the
 * layout rather than guessing at it. No filesystem access happens here: this runs at module load,
 * and a derivation that stat-ed the tree would make the watched set depend on which tree the process
 * happened to start in.
 */
function watchDirForSubpath(subpath: string): string {
  const last = subpath.slice(subpath.lastIndexOf("/") + 1);
  return last.includes(".") ? dirname(subpath) : subpath;
}

/**
 * Derive the watched directories from the layout the READER owns (WR-07).
 *
 * THE LAYOUT IS STATED ONCE, IN `board-read.ts`, AND THIS FUNCTION READS IT. The previous version of
 * this constant was a third hand-typed spelling of `FIXED_SUBPATHS` and `QUEUE_STAGES`, joined to
 * them by nothing, and asserted in the suite against a FOURTH hand-typed copy. Move
 * `FIXED_SUBPATHS.tickets` and the dashboard silently stops watching tickets while both lists and
 * every gate over them stay green — and the mandatory poll hides the regression completely, because
 * the screen still updates, just a poll period late. That is this repository's recorded set-literal
 * drift class, and the answer is the one the other three censuses in this phase already took: derive
 * the set, then assert the RELATIONSHIP rather than the members.
 *
 * WHAT THE DERIVATION DOES NOT COVER, stated here because a reader counting six directories against
 * six sources will otherwise look for a seventh:
 *   - `agent-factory/config/factory.config.json` IS DELIBERATELY NOT WATCHED (D-14). The dial changes
 *     when a human edits it rather than when work moves, and the mandatory poll picks it up within
 *     one period.
 *   - `traceability` shares `plans/` with the board, so it contributes no directory of its own. It is
 *     watched — by the board's entry — and a watch failure there is reported against `board`, which
 *     is the source that owns the directory the handle was opened on.
 *   - The queue expands over `QUEUE_STAGES` rather than watching `.grugops/queue` itself, because
 *     `fs.watch` is armed WITHOUT `recursive` (see the section head): a watch on the queue root sees
 *     the stage directories appear and disappear, never the claim files inside them.
 *
 * The arguments exist so the suite can run this same logic over a MUTATED layout and watch the
 * answer move. Production passes nothing.
 */
export function deriveWatchDirs(
  layout: Readonly<Record<SourceName, string>> = FIXED_SUBPATHS,
  stages: readonly string[] = QUEUE_STAGES,
): readonly WatchDir[] {
  const dirs: WatchDir[] = [];
  const seen = new Set<string>();
  const add = (rel: string, source: SourceName): void => {
    // FIRST SOURCE WINS, in `SOURCE_NAMES` order. Two sources sharing one directory share one
    // handle; a second entry would open a second watch on the same path and report one failure twice.
    if (seen.has(rel)) return;
    seen.add(rel);
    dirs.push({ rel, source });
  };
  for (const source of SOURCE_NAMES) {
    if (source === UNWATCHED_SOURCE) continue;
    const subpath = layout[source];
    if (source === "queue") {
      for (const stage of stages) add(`${subpath}/${stage}`, source);
      continue;
    }
    add(watchDirForSubpath(subpath), source);
  }
  return dirs;
}

const WATCH_DIRS: readonly WatchDir[] = deriveWatchDirs();

export { WATCH_DIRS };

/**
 * The two-sided pin, over a DERIVED number.
 *
 * THE COUNT IS THE ALARM; THE DERIVATION IS THE MECHANISM. It no longer fires when somebody edits a
 * list — there is no list to edit — it fires when the on-disk LAYOUT moves: a renamed subpath, a
 * fourth queue stage, a seventh source. Each of those is a D-14 decision recorded in the phase
 * context, and this constant is what makes the decision impossible to take silently.
 */
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
  /**
   * Is `dir` inside `root`? THE READER'S OWN AUTHORITY, ASKED ABOUT THE EXACT PATH A HANDLE WOULD
   * BE OPENED ON (plan 32-34, IN-01, CR-01).
   *
   * IT SITS BESIDE `exists` FOR THE SAME REASON `exists` DOES: `arm` reaches the filesystem twice
   * per directory per tick and both reaches go through this seam, so the suite can drive the whole
   * arming loop over a tree that does not exist. `defaultDeps` supplies `board-read`'s
   * `insideRoot` — the one place this repository decides whether a path is inside the tree — and
   * production passes nothing else. The end-to-end cases in `scripts/board-watch.test.ts` spread
   * `defaultDeps()` and plant real symlinks, so the REAL rule is what they measure.
   *
   * WHAT IT REPLACED, AND WHY A SET COULD NOT DO IT. The loop used to filter the reader's
   * `OUTSIDE-ROOT` read errors down to their `source` LABEL and un-arm every directory carrying
   * that label. One symlinked ticket FILE inside an ordinary `plans/tickets` therefore un-armed
   * `plans/tickets`, and one symlinked claimed task un-armed all three queue stages — silently,
   * because a containment refusal is the reader's finding and the loop recorded nothing of its own
   * (32-REVIEW.md CR-01, `32-34-RED-baseline.txt` probes A and B). Narrowing the consumed signal
   * from the label to the refused PATH is not enough either: probe E plants a `plans` that is
   * itself a link out of the tree, and the refusals it produces spell `plans/board.md`,
   * `plans/tickets` and `plans/traceability.md` — none of them `plans` or an ancestor of it — so a
   * path set with an ancestor walk would arm a handle on a directory outside the root. Probe A and
   * probe E are the same SHAPE of refusal with opposite required answers, and the thing that
   * differs between them is a property of the directory. So the directory is what gets asked.
   */
  readonly contained: (root: string, dir: string) => boolean;
  readonly read: (repoRoot: string, previous?: SnapshotResult) => SnapshotResult;
};

export function defaultDeps(): LoopDeps {
  return {
    // NO `recursive` OPTION. See the WATCH_DIRS docblock.
    watch: (dir, listener) => watch(dir, listener),
    exists: existsSync,
    // ONE AUTHORITY, NOT A SECOND IMPLEMENTATION OF IT HERE (IN-01). `insideRoot` resolves the FULL
    // target, so every ancestor link is resolved with the leaf and a directory reached through a
    // refused parent is refused without this module writing an upward walk of its own.
    contained: (root, dir) => insideRoot(root, dir, "the watched directory").ok,
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
  /** Close every watcher, clear both timers, and drop every watch record with them. */
  readonly stop: () => void;
  readonly watchedDirs: () => readonly string[];
  /** The CURRENT watch failures — at most one per directory, in relative-name order (WR-06). */
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
  /**
   * The CURRENT watch failure per directory, keyed by its `WATCH_DIRS` relative name (WR-06).
   *
   * A MAP RATHER THAN A LIST, BECAUSE THE VALUE IS A STATE AND NOT A LOG. "the watch on `plans` is
   * down" is one fact about one directory at one moment; it becomes true, then it becomes false, and
   * the thing a frame prints is whichever it is now. As an append-only list the same fact was
   * recorded once per poll tick — 8,640 a day at the floor, every one of them printed on every frame
   * and embedded in every published document as a current read error — and no entry was ever removed,
   * so the screen also kept reporting a failure that had already been repaired.
   *
   * KEYED BY DIRECTORY, NOT BY REASON. A directory that fails for ENOSPC and then for EMFILE has one
   * watch and one current reason. Keying by reason would produce two entries both claiming to be
   * current, which is the same "a log pretending to be a state" defect one register over.
   */
  const watchErrorsByDir = new Map<string, ReadError>();
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

  /**
   * The root the LAST READ RESOLVED, which is the root every watch is armed against (IN-01).
   *
   * NOT `options.repoRoot`. That is the string the user typed, and this module keeps it for exactly
   * two things: the read it hands to `readSnapshot`, and the usage message. `readSnapshot` puts it
   * through `resolveRepoRoot`, which follows every link with `realpathSync`, and publishes the answer
   * on the snapshot. On an ordinary tree the two strings are equal; on a symlinked invocation path
   * they are not, and arming against the unresolved one opened handles on a tree the reader had
   * already refused to read. A future edit that "simplifies" the two values into one must keep THIS
   * one — the resolved root is the only one the containment authority ever saw.
   *
   * `null` until a read has happened. `run` seeds before it arms, so the production path is never in
   * that state; `createLoop` is public and a caller can drive it in any order, and `arm` states what
   * it does then rather than joining against whatever is in hand.
   */
  let resolvedRoot: string | null = null;

  /**
   * Take the ONE fact a read publishes that the WATCH arm depends on.
   *
   * IT USED TO TAKE TWO, AND THE SECOND ONE WAS THE DEFECT (plan 32-34, CR-01). The other was a
   * `Set<SourceName>` built from every `OUTSIDE-ROOT` read error's `source` field, and `arm`
   * consulted it. But the containment authority raises that error PER ENTRY — one ticket file, one
   * claimed task directory, one context task — while `deriveWatchDirs` gives several directories
   * ONE source label, so a single planted symlink took `plans/tickets`, or all three queue stages,
   * off the low-latency path while nothing on any channel said so. Containment is now asked about
   * the directory a handle would be opened on, at `arm`, through `deps.contained`. Nothing about
   * it is accumulated here, which is also the answer to the DASH-04 concurrency question: two
   * refusals arriving in one read cannot interact through a set that does not exist, and the armed
   * set after them does not depend on the order they arrived in.
   *
   * A ROOT THAT MOVED TAKES THE HANDLES WITH IT. Every open handle was opened against the previous
   * root, so after the root changes they are watching a tree that is no longer the one being
   * projected. They are closed here and re-armed by the next `armAll`, and the records go too: each
   * one names a directory under a root this loop has stopped reading.
   */
  function adoptRead(result: SnapshotResult): void {
    const root = result.snapshot.repoRoot;
    if (resolvedRoot !== null && resolvedRoot !== root) {
      for (const rel of [...watchers.keys()]) closeWatcher(rel);
      watchErrorsByDir.clear();
    }
    resolvedRoot = root;
  }

  /**
   * Record the CURRENT failure for one directory, replacing whatever that directory said before.
   *
   * THE MESSAGE PROMISES A RE-ARM, AND `arm`'s SUCCESS PATH IS WHAT MAKES THE PROMISE TRUE. The two
   * halves are in different functions, so the sentence is named at both ends: this one writes
   * "it will be re-armed on the next poll tick", and `arm` DELETES this key the moment that re-arm
   * succeeds. Without the delete the promise is a claim the record outlives — the frame keeps saying
   * a repaired watch is about to be repaired, which is the half of WR-06 a count alone does not
   * catch.
   */
  function noteWatchState(rel: string, source: SourceName, message: string): void {
    watchErrorsByDir.set(rel, { source, path: rel, code: "watch", message });
  }

  function noteWatchError(rel: string, source: SourceName, e: Error): void {
    noteWatchState(
      rel,
      source,
      `the watch on ${rel} failed (${e.message}). It is closed and will be re-armed on the next ` +
        `poll tick; the mandatory poll keeps the screen current in the meantime.`,
    );
  }

  /**
   * The current watch failures, in RELATIVE-NAME order rather than in the order they happened.
   *
   * Two runs that reach the same state produce the same bytes, so a consumer diffing two published
   * documents sees a changed finding rather than a reshuffle of two unchanged ones. Insertion order
   * is the order two directories happened to fail in, which is not a property of the board.
   */
  function currentWatchErrors(): ReadError[] {
    return [...watchErrorsByDir.keys()].sort().map((rel) => watchErrorsByDir.get(rel) as ReadError);
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

  function arm(entry: WatchDir): void {
    const { rel, source } = entry;
    const root = resolvedRoot;
    if (root === null) {
      // NOTHING IS ARMED AGAINST A ROOT NOBODY RESOLVED, and the skip says so per directory —
      // the loop cannot even ask whether these exist, or whether they are inside the tree, without
      // a root to join them against. The record clears on the first arm after a read, like every
      // other watch record.
      //
      // THIS ARM MOVED TO THE TOP IN PLAN 32-34, and the move is behaviour-preserving rather than a
      // reordering of two live rules: the containment question below now takes the root, so it
      // cannot be asked before one exists, and the set the OLD containment check consulted was
      // populated by a read — so with no read there was nothing in it and this arm is where a
      // pre-read directory already landed.
      noteWatchState(
        rel,
        source,
        `the watch on ${rel} was not armed: no read has resolved the repository root yet, so ` +
          `there is nothing to arm it against. The read that precedes the next poll tick supplies ` +
          `the root, and the tick arms it.`,
      );
      return;
    }
    const dir = join(root, rel);
    // THE CONTAINMENT REFUSAL IS CHECKED BEFORE THE ALREADY-ARMED RETURN, AND IT CLOSES (IN-01). A
    // tree can acquire a symlink under a running loop: the directory that was inside the tree a
    // tick ago is a link out of it now, and the handle opened then is the one pointing outside.
    //
    // THE QUESTION IS ABOUT THIS DIRECTORY, NOT ABOUT A LABEL SEVERAL DIRECTORIES SHARE (plan
    // 32-34, CR-01). `deps.contained` is the reader's own `insideRoot`, asked about exactly the
    // path `deps.watch` would be handed, so an ENTRY that left the tree is the reader's finding
    // about that entry and leaves the directory holding it armed, while the directory itself
    // leaving the tree — or any ancestor of it, which `insideRoot` resolves in the same pass —
    // un-arms it.
    //
    // NOTHING IS RECORDED HERE, AND THE RECORD THE DIRECTORY WAS CARRYING GOES (plan 32-34, CR-02).
    // The reader already reported the refusal against the source it belongs to, so a second entry
    // would be the same finding twice in the list a consumer reads. And a refused directory is not
    // a failed watch: the record's own text promises "it will be re-armed on the next poll tick",
    // which this return makes impossible for as long as the refusal stands, so leaving it standing
    // publishes a false sentence on every stderr frame and in every `--json` document. That is the
    // reason the absent-directory arm below already states, applied to the arm beside it — the two
    // of them are the same claim about a directory this loop will not be watching.
    if (!deps.contained(root, dir)) {
      closeWatcher(rel);
      watchErrorsByDir.delete(rel);
      return;
    }
    if (watchers.has(rel)) return;
    if (!deps.exists(dir)) {
      // IT MAY APPEAR LATER; A POLL TICK WILL ARM IT THEN — and an absent directory is not a failed
      // watch, so any record this directory was carrying is dropped rather than left standing as a
      // current finding about a path that is not there.
      watchErrorsByDir.delete(rel);
      return;
    }
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
      // THE RE-ARM IS WHAT CLEARS THE RECORD (WR-06). `noteWatchError`'s text promises this line
      // will run; running it is what keeps the promise. A success path that only added a handle left
      // the previous failure standing as a current finding for the life of the process.
      watchErrorsByDir.delete(rel);
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
    const noted = currentWatchErrors();
    const withWatch: SnapshotResult =
      noted.length === 0 ? result : { ...result, readErrors: [...result.readErrors, ...noted] };

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
        adoptRead(result);
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
    // AND THE RECORDS GO WITH THE WATCHES. Every entry says the directory will be re-armed on the
    // next poll tick, and this function has just cleared the poll: after it there is no next tick
    // and nothing armed, so a surviving entry would be a statement about a loop that no longer runs,
    // printed by whatever emitted next.
    watchErrorsByDir.clear();
  }

  return {
    armAll,
    schedule,
    refresh,
    start,
    seed: (result: SnapshotResult) => {
      previous = result;
      adoptRead(result);
    },
    emit,
    stop,
    watchedDirs: () => [...watchers.keys()],
    watchErrors: currentWatchErrors,
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

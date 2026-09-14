// board-dashboard.ts — the read-only board projector's CLI (plan 32-01, DASH-07/DASH-08).
//
// THE PROCESS-OWNING HALF OF THE D-15 BOUNDARY. `scripts/board-model.ts` is pure: no `process`, no
// timers, no rendering. `scripts/board-read.ts` is the one module that touches the disk. This module
// owns argv, stdout discipline, exit codes and — from plan 32-03 onward — the watch handles and the
// poll timer. The split is what lets the DASH-06 import-graph guard (plan 32-06) walk one closure
// and assert that every `node:fs` symbol in it is read-only.
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
// builtins plus relative `./*.js`, nothing else. This module needs no builtin at all.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — this is a trace surface).

import { readSnapshot } from "./board-read.js";
import { isEntrypoint } from "./is-entry.js";
import type { SnapshotResult } from "./board-read.js";
import type { BoardColumn } from "./board-model.js";

// ── The timing constants plan 32-03 wires (D-14) ─────────────────────────────────────────────────
//
// Declared HERE AND NOW, in the module that will own the loop, so plan 32-03 wires them rather than
// inventing a second set of numbers beside them. The poll is mandatory and cannot be disabled: it is
// the safety net for a watch orphaned by an atomic rename, and for a filesystem that emits no events
// at all.
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

/** Three arms, no third state. A refusal carries the message a human acts on. */
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
};

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

export function sanitizeCell(s: string): string {
  return s.replace(CONTROL_CODE_POINTS, "");
}

// ── The frame (D-17, thin version) ───────────────────────────────────────────────────────────────

/**
 * The WIP cell for one column: the claimed live count over the limit, or a dash where the heading
 * claims no numbers.
 */
function wipCell(column: BoardColumn): string {
  if (column.kind === "limited" && column.claimedLive !== null && column.limit !== null) {
    return `${column.claimedLive}/${column.limit}`;
  }
  if (column.kind === "unlimited") return "unlimited";
  return "-";
}

/**
 * Render one frame.
 *
 * THIS IS THE THIN VERSION OF D-17 AND SAYS SO. One header line carrying the resolved root, the
 * config mode, the last read time and the column count; then one line per column reading name, WIP
 * cell and row count, with Blocked last. The full layout — the stale badge, the conflict list, the
 * `Now running` block, width truncation and the TTY redraw — lands in plan 32-07. The sanitizer and
 * this header-and-column skeleton do not move when it does.
 */
function renderFrame(result: SnapshotResult): string {
  const snapshot = result.snapshot;
  const mode = snapshot.config?.mode ?? "unknown";
  const lines: string[] = [];

  const columns = snapshot.board?.columns ?? [];
  const ordered = [
    ...columns.filter((c) => c.kind !== "blocked"),
    ...columns.filter((c) => c.kind === "blocked"),
  ];

  lines.push(
    sanitizeCell(
      `grugops board  ${snapshot.repoRoot}  mode: ${mode}  read: ${snapshot.generatedAt}  ` +
        `${ordered.length} columns  [${result.source}]`,
    ),
  );

  if (snapshot.board === null) {
    lines.push(sanitizeCell("no board: plans/board.md was not readable on this tree"));
    return `${lines.join("\n")}\n`;
  }

  const width = ordered.reduce((w, c) => Math.max(w, sanitizeCell(c.name).length), 0);
  for (const column of ordered) {
    const name = sanitizeCell(column.name).padEnd(width);
    const rows = column.rows.length === 1 ? "1 row" : `${column.rows.length} rows`;
    lines.push(sanitizeCell(`${name}  ${wipCell(column).padEnd(9)}  ${rows}`));
  }

  return `${lines.join("\n")}\n`;
}

// ── The entry point ──────────────────────────────────────────────────────────────────────────────

function defaultIo(): DashboardIo {
  return {
    stdout: process.stdout,
    stderr: process.stderr,
    isTty: process.stdout.isTTY === true,
  };
}

/**
 * Run one invocation and return its exit code.
 *
 * THIS TASK PRINTS EXACTLY ONE FRAME OR ONE DOCUMENT, ALWAYS. The watch loop lands in plan 32-03,
 * and a request for it is answered on stderr rather than silently ignored — a tool that accepts
 * `--watch` and quietly prints one frame is a tool that lies about what it did. The stdout channel
 * is unaffected either way, so wiring the loop later changes no output contract.
 */
export function main(argv: readonly string[], io: DashboardIo = defaultIo()): number {
  const parsed = parseArgs(argv);

  if (parsed.kind === "help") {
    io.stdout.write(`${USAGE}\n`);
    return 0;
  }
  if (parsed.kind === "usage") {
    io.stderr.write(`${parsed.message}\n`);
    return EXIT_USAGE;
  }

  const options = parsed.options;

  let result: SnapshotResult;
  try {
    result = readSnapshot(options.repoRoot);
  } catch (e) {
    // A NAMED ONE-LINE MESSAGE ON STDERR, NEVER A STACK ON STDOUT (T-32-08).
    io.stderr.write(`board-dashboard: ${(e as Error).message}\n`);
    return EXIT_USAGE;
  }

  // D-18: `--json` implies `--once` unless `--watch` is also given, and a non-TTY stdout implies it
  // too. The live redraw is the only branch that does not, and it lands in plan 32-03.
  const loopRequested = options.watch || (io.isTty && !options.once && !options.json);
  if (loopRequested) {
    io.stderr.write(
      "board-dashboard: the watch loop lands in plan 32-03. Printing one frame and exiting 0.\n",
    );
  }

  for (const readError of result.readErrors) {
    io.stderr.write(
      `board-dashboard: ${readError.source} at ${readError.path} — ${readError.code}: ` +
        `${readError.message}\n`,
    );
  }

  if (options.json) {
    io.stdout.write(`${JSON.stringify(result)}\n`);
    return 0;
  }

  io.stdout.write(renderFrame(result));
  return 0;
}

// The tail mirrors `scripts/coordinator-resolution-precheck.ts:589-600`: the code initialises to the
// refusal value, so an unexpected throw can never exit 0. `isEntrypoint` is the ONE legal entry
// detection in this tree — a hand-rolled comparison reads FALSE under a symlinked invocation path,
// and the module then exits 0 having printed nothing, which a caller reads as a pass.
if (isEntrypoint(import.meta.url)) {
  let code = EXIT_USAGE;
  try {
    code = main(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`board-dashboard: ${(e as Error).message}\n`);
    code = EXIT_USAGE;
  }
  process.exit(code);
}

// board-model.ts — the ONE board-grammar authority (plan 32-01, DASH-01).
//
// WHAT THIS MODULE IS, AND WHAT IT REFUSES TO BE.
//
// `agent-factory/contracts/board.md` is the authority for every shape this module admits. The
// contract states a small canonical form for column headings and for ticket rows; this module
// admits exactly that form and refuses every other byte by putting the line into `unparsed[]` with
// its line number. It does not widen a pattern once per counter-example. That posture is
// `scripts/canonical-frontmatter.ts`'s, adopted here for the same recorded reason: a module which
// INTERPRETS an open grammar has an unbounded set of inputs it can misread, and every misread lands
// on a success arm. A board the projector cannot read is a visible refusal, never a quiet empty
// column.
//
// THIS MODULE IS PURE, AND THE PURITY IS AN IMPORT EDGE RATHER THAN A COMMENT (D-15, D-23).
//   * It imports NOTHING from the Node filesystem builtin. `scripts/board-read.ts` is the named
//     seam that touches the disk, and the DASH-06 import-graph guard in plan 32-06 is what makes
//     the claim mechanical rather than narrated.
//   * It imports NOTHING from `./context-io.js` and NOTHING from `./claim.js`. Both modules export
//     writers, so importing either would put a write-capable symbol into the dashboard's import
//     closure — the exact thing DASH-06 exists to refuse. Where this module needs one of their
//     readers, it re-implements the reader rather than pulling the module in.
//   * It touches no `process`, starts no timer, and renders nothing. `scripts/board-dashboard.ts`
//     owns argv, stdout, exit codes and, from plan 32-03 onward, the watch loop.
//
// REGEX DISCIPLINE, BECAUSE THIS REPOSITORY HAS ALREADY PAID FOR ONE INCIDENT (T-32-01). The
// measured corpus contains a single line of 34,494 characters. Every pattern below is anchored at
// `^`, carries no nested quantifier, and bounds its numeric runs. The parenthetical scan in
// `splitRow` is a single linear pass with a depth counter rather than a pattern at all. A guard
// that takes 383 seconds is not a green guard.
//
// NO `trimStart` APPEARS IN THE HEADING SCAN OR THE ROW SCAN, AND THAT IS LOAD-BEARING. Both real
// mini-boards reachable from this machine are four-space indented inside documentation blocks. One
// left-trim promotes documentation into live state.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — this is a trace surface that a
// human reads to learn where work stands, never caveman voice).

// ── The published schema version (D-19) ──────────────────────────────────────────────────────────
//
// `schemaVersion: 1` is the shape a future web renderer consumes unchanged. Adding a field is
// additive; reinterpreting one breaks the golden fixture and every consumer. Any shape change bumps
// this number and updates the golden in the same commit.
export const SCHEMA_VERSION = 1;

// ── Bounds (D-20) ────────────────────────────────────────────────────────────────────────────────
//
// EACH OF THE FOUR NUMBERS BELOW IS A DECISION RECORDED IN `agent-factory/contracts/board.md`
// § Bounds, NEVER A TUNING KNOB TO BE RAISED WHEN A BOARD GROWS. A board past a ceiling is still
// parsed in full and still renders every row; the snapshot records what it measured and the header
// says so. Refusing a board over the ceiling was considered and rejected: it makes a growing board
// permanently unreadable, which is the failure mode the projector exists to report rather than to
// become.

/** The board size, in UTF-8 BYTES, past which `bounds.exceeded` is set. One mebibyte. */
export const LARGE_BOARD_BYTES = 1_048_576;

/** The single-line length, in UTF-16 CODE UNITS, past which `bounds.exceeded` is set. */
export const LONG_LINE_CHARS = 65_536;

/**
 * The cap, in UTF-16 code units, on a row's two opaque strings — `meta` and `trailer`.
 *
 * Roughly five lines of a wide terminal: enough that a human reads the whole of every meta a role
 * actually writes, bounded enough that one pathological row cannot dominate a JSON document.
 */
export const MAX_META_CHARS = 1_024;

/** The same cap, applied to an update entry's `text` and its `actor`. */
export const MAX_UPDATE_TEXT_CHARS = 1_024;

/** The single-character marker a shortened string ends with. */
const ELLIPSIS = "…";

/**
 * Shorten `value` to `cap` UTF-16 code units, ending in a single-character marker.
 *
 * THE CUT LANDS BEFORE A SURROGATE PAIR, NEVER BETWEEN ITS HALVES. Slicing a JavaScript string at
 * an arbitrary index can leave a lone surrogate, which is not a character in any encoding and which
 * a terminal renders as a replacement glyph — a board whose meta ends in a broken code point looks
 * like a parser defect rather than like a stated bound.
 *
 * The result is at most `cap` code units: `cap - 1` of content plus the one-unit marker.
 */
function truncateAt(value: string, cap: number): { readonly value: string; readonly cut: boolean } {
  if (value.length <= cap) return { value, cut: false };
  let end = cap - 1;
  const lead = value.charCodeAt(end - 1);
  if (lead >= 0xd800 && lead <= 0xdbff) end -= 1;
  return { value: value.slice(0, end) + ELLIPSIS, cut: true };
}

// ── Column headings (D-05) ───────────────────────────────────────────────────────────────────────
//
// EXACTLY THREE LEGAL SUFFIXES. Each pattern is anchored at both ends and is applied to the
// heading's TRAILING PARENTHETICAL ONLY, never to the whole line — so a 34 KB heading costs one
// linear scan for the parenthetical's opening byte and then a bounded match.
//
// This is the deliberate deviation from the pre-Phase-32 helper recorded as D-06. That helper
// stripped `\s*\(WIP[^)]*\)\s*$` and trimmed, which turned `## Columns (spec §6.1)` into a phantom
// column named `Columns (spec §6.1)` and left `## Blocked (visible, time-tracked)` unnormalized.
// Both defects are fixed here rather than ported.
export const HEADING_SUFFIXES = [
  { kind: "limited", pattern: /^\(WIP (\d{1,9})\/(\d{1,9})\)$/ },
  { kind: "unlimited", pattern: /^\(WIP unlimited\)$/ },
  { kind: "blocked", pattern: /^\(visible, time-tracked\)$/ },
] as const;

// TWO-SIDED, and the message reads as a decision rather than as a bumped constant. A fourth legal
// heading suffix is recorded in `agent-factory/contracts/board.md` first; this number moves after
// the contract does, never before it.
export const HEADING_SUFFIX_COUNT = 3;

export type ColumnKind = (typeof HEADING_SUFFIXES)[number]["kind"];

/** The single name the blocked suffix admits (D-07). */
const BLOCKED_COLUMN_NAME = "Blocked";

/** A level-two heading opens or closes a section; a deeper heading does neither. */
const H2_PREFIX = "## ";

// ── Rows (D-01 as amended by D-22) ───────────────────────────────────────────────────────────────
//
// The ONLY grammar is a bullet, a bracketed identifier, a space, and a title. Everything after the
// title is opaque. The bracket body is bounded so a pathological line cannot make the class scan
// unbounded, and the identifier is validated separately rather than inside the row pattern.
const ROW = /^- \[([^\]]{1,64})\] (.*)$/;
const TICKET_ID = /^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/;
const EPIC_ID = /^(?:EPIC|FEAT)-\d{1,9}$/;

/** The two-space gap that discriminates a real parenthetical from parentheses inside a title. */
const META_GAP = "  (";

// ── Update lines (D-03) ──────────────────────────────────────────────────────────────────────────
const UPDATED = /^_Updated: (\d{4}-\d{2}-\d{2}) by (.*)$/;

// ── Types ────────────────────────────────────────────────────────────────────────────────────────

/** The three opaque pieces a row's post-identifier remainder splits into. */
export type RowParts = {
  readonly title: string;
  /** The parenthetical's contents, uninterpreted. `null` when the row carries none. */
  readonly meta: string | null;
  /** Everything after the balanced close, uninterpreted. `""` when the parenthetical ends the line. */
  readonly trailer: string;
};

export type BoardRow = RowParts & {
  readonly id: string;
  /** One-based line number in the ORIGINAL text, preserved through the comment pre-pass. */
  readonly line: number;
  /** True when `meta` or `trailer` was shortened at its cap (D-20). The row itself is never dropped. */
  readonly truncated: boolean;
};

/** An `EPIC`/`FEAT` row: a second named class, never joined against `plans/tickets/` (D-02). */
export type EpicRow = BoardRow & {
  /** The column the row appeared under, or `null` when it sat outside every column. */
  readonly column: string | null;
};

export type BoardColumn = {
  /** The heading text with its suffix stripped, trimmed. */
  readonly name: string;
  /** The heading line verbatim. */
  readonly heading: string;
  readonly kind: ColumnKind;
  /** The live count the heading CLAIMS, for the limited form only (D-09). */
  readonly claimedLive: number | null;
  /** The limit the heading claims, for the limited form only. */
  readonly limit: number | null;
  readonly line: number;
  readonly rows: readonly BoardRow[];
};

export type UpdateEntry = {
  readonly date: string;
  readonly actor: string;
  readonly text: string;
  readonly line: number;
  /** True when `text` or `actor` was shortened at its cap (D-20). */
  readonly truncated: boolean;
};

export type UnparsedLine = {
  readonly line: number;
  readonly text: string;
  /** The column the line sat under, or `null` outside every column. */
  readonly column: string | null;
};

export type NonColumnSection = {
  readonly heading: string;
  readonly line: number;
  readonly lines: readonly string[];
};

export type Bounds = {
  readonly boardBytes: number;
  readonly longestLine: number;
  readonly exceeded: boolean;
};

/**
 * The parsed board.
 *
 * THE SEVEN BUCKETS BELOW PARTITION THE INPUT (D-24, invariant I1). Every line of a board document
 * lands in exactly one of `columns[].rows`, `epicRows`, `updates`, `preamble`,
 * `nonColumnSections[].lines`, `unparsed`, or the blank-and-heading set — blank lines and level-two
 * heading lines, which carry no content of their own. The partition is total and disjoint, and
 * `scripts/board-model.test.ts` asserts both halves with counts derived independently of the parse
 * loop. A partition with a hole is how "three unparsed lines in Done" becomes "one hundred and
 * seventy-six unparsed lines" and the finding a human needed is buried under the ones nobody wrote.
 */
export type BoardModel = {
  readonly columns: readonly BoardColumn[];
  readonly epicRows: readonly EpicRow[];
  /** Every canonical `_Updated:` line, wherever it appeared (D-03). */
  readonly updates: readonly UpdateEntry[];
  /** Every content line before the first heading of any level-two kind (D-24). */
  readonly preamble: readonly string[];
  /** Each non-column `##` section, with the content lines it absorbed (D-24). */
  readonly nonColumnSections: readonly NonColumnSection[];
  /** Every content line the grammar declined to read, in ascending line order (D-03). */
  readonly unparsed: readonly UnparsedLine[];
  /** The measured size of the input and whether either D-20 ceiling was passed. */
  readonly bounds: Bounds;
};

// ── The per-source read state (D-11, D-12, D-13) ─────────────────────────────────────────────────
//
// WHY THIS UNION IS DECLARED IN THE PURE MODULE AND RE-EXPORTED FROM THE READ SEAM. `FactorySnapshot`
// below embeds one `SourceState` per joined source, and `FactorySnapshot` belongs here because it is
// the published shape (D-19) and carries no I/O. Declaring the union in `board-read.ts` and the
// snapshot here would make the two modules mutually dependent at the type level. Declaring it twice
// is the set-literal drift class this repository has already paid for. So it is declared once, in
// the module that has no imports at all, and `scripts/board-read.ts` — the module that PRODUCES it —
// re-exports it as its own published surface.
//
// THE `unavailable` ARM DELIBERATELY CARRIES NO VALUE. D-13's "absent is a legitimate state" case
// has nothing to render, and a value-less arm makes "render an empty board because the file was
// missing" UNREPRESENTABLE rather than merely discouraged.
// THE CLOSED SET OF REASONS A SOURCE CAN BE STALE, AND THE TYPE DERIVED FROM IT.
//
// The set is the authority and the type is its projection, rather than two hand-typed lists that can
// disagree — the set-literal drift class this repository has already paid for. `scripts/board-read.ts`
// re-exports it as `STALE_REASONS` with a two-sided count, because that is the module that PRODUCES
// a stale arm.
//
// Each member is a distinct sentence the D-12 badge says to a human about why the value on screen is
// old, which is why a sixth is a decision rather than a bumped constant:
//   enoent      the path is gone; it was read successfully before
//   eacces      the open is denied; the bytes exist and this process cannot have them
//   torn        the file changed under every read attempt, so no read of it is trustworthy
//   bounded     the directory is larger than the walk bound, so the value is what was gathered first
//   unreadable  the bytes were read and the CONTENT did not parse (D-11's "a partial parse")
export const STALE_REASONS = [
  "enoent",
  "eacces",
  "torn",
  "bounded",
  "unreadable",
] as const;

export type StaleReason = (typeof STALE_REASONS)[number];

export type SourceState<T> =
  | { readonly source: "ok"; readonly value: T; readonly readAt: string }
  | {
      readonly source: "stale";
      readonly value: T;
      readonly readAt: string;
      readonly stale: { readonly reason: StaleReason; readonly since: string };
    }
  | { readonly source: "unavailable"; readonly present: false };

/** The six joined sources, in a fixed order. `scripts/board-read.ts` pins the count two-sided. */
export type SourceName =
  | "board"
  | "tickets"
  | "queue"
  | "context"
  | "traceability"
  | "config";

/** The config keys the snapshot cross-checks. Everything else in the dial is ignored here. */
export type FactoryConfigView = {
  readonly mode: string | null;
  readonly idPrefix: string | null;
  readonly wipLimits: Readonly<Record<string, number>>;
};

// ── The four joined sources beside the board and the dial (D-12) ─────────────────────────────────
//
// DECLARED HERE FOR THE REASON `SourceState` IS: `FactorySnapshot` embeds one per source, and the
// snapshot is the published shape (D-19), which carries no I/O. `scripts/board-read.ts` — the module
// that PRODUCES them — re-exports each as its own published surface. Declaring them in both is the
// set-literal drift class this repository has already paid for.
//
// Each is a PROJECTION, not a copy of the file it came from. The dashboard joins and renders; it is
// not a second store, and a field nothing renders is a field that goes stale unnoticed.

/** One ticket under `plans/tickets/`, as the ONE frontmatter authority admitted it. */
export type TicketRecord = {
  /** The file name relative to `plans/tickets/`, which is the only identity the reader can trust. */
  readonly file: string;
  /** `name` from the admitted frontmatter when it carries one, else the file's stem. */
  readonly id: string;
  /** `description` from the admitted frontmatter, or "" when the document carries none. */
  readonly title: string;
};

/** One claimed task, as `scripts/claim.ts`'s reader half would have trusted it. */
export type QueueRow = {
  readonly task: string;
  readonly by: string;
  readonly at: string;
};

/** One row of `plans/traceability.md`, beneath its real header and outside its own comment. */
export type TraceRow = {
  readonly ticket: string;
  readonly title: string;
  readonly status: string;
  /** Every cell in document order, so plan 32-05 can cross-check a column this shape did not name. */
  readonly cells: readonly string[];
};

/** One task's presence and current state under `.grugops/context/`, WITHOUT any note body (D-17). */
export type ContextTaskState = {
  readonly task: string;
  /** Every note the index records, superseded ones included. */
  readonly noteCount: number;
  /** The notes left after the supersede fold — the CURRENT state, by the `currentState` rule. */
  readonly liveCount: number;
  /** The `at` of the most recent live note, or null when the task has none. */
  readonly latestAt: string | null;
  /** The `kind` of the most recent live note, or null when the task has none. */
  readonly latestKind: string | null;
};

/**
 * The value each source carries when it carries one.
 *
 * TYPED PER SOURCE RATHER THAN AS `unknown`, so plan 32-07's renderer reads a ticket list as a
 * ticket list. A `Record<SourceName, SourceState<unknown>>` would have forced every consumer to cast,
 * and a cast is a place where a source can be read as the wrong shape without the compiler saying so.
 */
export type SourceValues = {
  readonly board: BoardModel;
  readonly tickets: readonly TicketRecord[];
  readonly queue: readonly QueueRow[];
  readonly context: readonly ContextTaskState[];
  readonly traceability: readonly TraceRow[];
  readonly config: FactoryConfigView;
};

/**
 * The published snapshot (D-19). `schemaVersion` is the contract a future web renderer consumes;
 * `board` is the joined board model; `sources` carries one read state per joined source so a single
 * missing `.grugops/` cannot hide a fresh board (D-12).
 *
 * `board` IS NULLABLE, AND THE NULL IS THE POINT. D-11 forbids "an empty board" as an output state
 * distinct from "zero rows under real headings". A non-nullable `BoardModel` here would force a
 * caller with no readable board to synthesize an empty one, which is exactly the confusion the
 * `unavailable` arm above exists to make unrepresentable. `board` is `null` if and only if
 * `sources.board` is `unavailable`, and the top-level result discriminant says so first.
 */
export type FactorySnapshot = {
  readonly schemaVersion: number;
  readonly repoRoot: string;
  readonly generatedAt: string;
  readonly board: BoardModel | null;
  readonly config: FactoryConfigView | null;
  readonly sources: Readonly<{
    readonly [K in SourceName]: SourceState<SourceValues[K]>;
  }>;
};

// ── The comment pre-pass (D-03) ──────────────────────────────────────────────────────────────────

/**
 * Replace every `<!-- … -->` span with spaces, preserving every newline so line numbers survive.
 *
 * `unparsed[]` carries line numbers, so the strip cannot DELETE lines — it blanks them. An
 * unterminated opener blanks to end of file, which is the fail-closed direction: the board renders
 * visibly empty rather than partially and confidently. An agent that opens `<!--` without closing it
 * would otherwise expose the remainder of the board to the grammar.
 */
export function stripHtmlComments(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf("<!--", i);
    if (start === -1) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, start);
    const end = text.indexOf("-->", start + 4);
    if (end === -1) {
      out += blankKeepingNewlines(text.slice(start));
      break;
    }
    out += blankKeepingNewlines(text.slice(start, end + 3));
    i = end + 3;
  }
  return out;
}

/** Every character becomes a space; every newline survives. One character class, one pass. */
function blankKeepingNewlines(span: string): string {
  return span.replace(/[^\n]/g, " ");
}

// ── The row splitter (D-01, D-22) ────────────────────────────────────────────────────────────────

/**
 * Split a row's post-identifier remainder into title, opaque meta, and opaque trailer.
 *
 * The split lands at the FIRST two-space-then-open-paren, not the last, and scans to the balanced
 * close with a depth counter. Measured against the 141-row live corpus: 141 admitted, 140 with a
 * captured `meta`. The one exception carries a parenthetical that never closes, and it degrades to a
 * null `meta` with the whole remainder as the title rather than being refused.
 */
export function splitRow(rest: string): RowParts {
  const at = rest.indexOf(META_GAP);
  if (at === -1) return { title: rest, meta: null, trailer: "" };

  let depth = 0;
  let j = at + 2;
  for (; j < rest.length; j++) {
    const ch = rest[j];
    if (ch === "(") {
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  // Unbalanced: the whole remainder stays the title and the row stays legal.
  if (depth !== 0) return { title: rest, meta: null, trailer: "" };

  return {
    title: rest.slice(0, at),
    meta: rest.slice(at + 3, j),
    trailer: rest.slice(j + 1),
  };
}

// ── The heading reader (D-05, D-06, D-07) ────────────────────────────────────────────────────────

type HeadingMatch = {
  readonly name: string;
  readonly kind: ColumnKind;
  readonly claimedLive: number | null;
  readonly limit: number | null;
};

/**
 * The heading, decomposed — or `null` when the line opens no column.
 *
 * NOT left-trimmed, and never will be: an indented heading is documentation. The parenthetical is
 * located by its LAST opening byte, so a name that itself contains parentheses keeps them.
 */
function matchHeading(line: string): HeadingMatch | null {
  if (!line.startsWith(H2_PREFIX)) return null;
  const body = line.slice(H2_PREFIX.length).trimEnd();
  if (!body.endsWith(")")) return null;

  const open = body.lastIndexOf("(");
  if (open === -1) return null;

  const name = body.slice(0, open).trim();
  const suffix = body.slice(open);
  if (name === "") return null;

  for (const form of HEADING_SUFFIXES) {
    const m = form.pattern.exec(suffix);
    if (m === null) continue;
    if (form.kind === "blocked" && name !== BLOCKED_COLUMN_NAME) return null;
    if (form.kind === "limited") {
      return {
        name,
        kind: form.kind,
        claimedLive: Number.parseInt(m[1] as string, 10),
        limit: Number.parseInt(m[2] as string, 10),
      };
    }
    return { name, kind: form.kind, claimedLive: null, limit: null };
  }
  return null;
}

/** The column a heading line names, or `null` when the line opens no column. */
export function boardColumnName(line: string): string | null {
  return matchHeading(line)?.name ?? null;
}

/**
 * Does the board carry `col` as a column?
 *
 * EXACT EQUALITY after the suffix strip, and the counterexample is pinned in
 * `scripts/board-tracer.test.ts`: the pre-Phase-32 helper used `startsWith("## " + col + " ")`, so
 * the column `In` matched the heading `## In Development (WIP 0/3)` and a genuinely wrong column
 * slipped the membership check (D-06).
 */
export function boardHasColumn(model: BoardModel, col: string): boolean {
  const wanted = col.trim();
  return model.columns.some((c) => c.name === wanted);
}

/**
 * The ONE kebab spelling in this tree, moved verbatim from
 * `scripts/validate-agent-factory.ts:250-256` (D-06). The board-to-ticket rule is
 * `kebab(column) === status`; two spellings of it is the drift class.
 */
export const kebab = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ── The parse ────────────────────────────────────────────────────────────────────────────────────

type MutableColumn = {
  name: string;
  heading: string;
  kind: ColumnKind;
  claimedLive: number | null;
  limit: number | null;
  line: number;
  rows: BoardRow[];
};

type MutableSection = {
  heading: string;
  line: number;
  lines: string[];
};

/**
 * A row's two opaque strings, each held to `MAX_META_CHARS` (D-20).
 *
 * The title is NOT bounded here. It is the one piece of a row a human reads to know which ticket
 * the line is about, and the measured corpus carries no long one — the 34,494-character line is a
 * parenthetical, not a title. Bounding it would shorten the field that identifies the row in order
 * to defend against a shape nothing writes.
 */
function boundRow(parts: RowParts): RowParts & { readonly truncated: boolean } {
  const meta = parts.meta === null ? null : truncateAt(parts.meta, MAX_META_CHARS);
  const trailer = truncateAt(parts.trailer, MAX_META_CHARS);
  return {
    title: parts.title,
    meta: meta === null ? null : meta.value,
    trailer: trailer.value,
    truncated: (meta?.cut ?? false) || trailer.cut,
  };
}

/** A legal row, decomposed — or `null` when the line is not a row at all. */
type RowMatch = { readonly id: string; readonly parts: RowParts; readonly isEpic: boolean };

function matchRow(line: string): RowMatch | null {
  const row = ROW.exec(line);
  if (row === null) return null;
  const id = row[1] as string;
  if (EPIC_ID.test(id)) return { id, parts: splitRow(row[2] as string), isEpic: true };
  if (TICKET_ID.test(id)) return { id, parts: splitRow(row[2] as string), isEpic: false };
  return null;
}

/**
 * Parse a board document into the `schemaVersion: 1` model.
 *
 * CRLF is normalized before anything else, the way `scripts/canonical-frontmatter.ts` does, so a
 * Windows checkout is not refused for a reason that has nothing to do with the grammar. The comment
 * pre-pass runs next, before any heading or row scan touches a byte.
 *
 * THE CLASSIFICATION RULE, STATED ONCE, BECAUSE ITS PRECEDENCE IS THE WHOLE DESIGN (D-24).
 *
 *   1. A level-two heading is never content. A heading carrying one of the three D-05 suffixes
 *      opens a column; any other level-two heading opens a non-column section. Either one closes
 *      whatever was open before it. A heading at level three opens nothing and closes nothing, so
 *      it becomes a content line of whatever section is current.
 *   2. A blank line is never content.
 *   3. A canonical `_Updated:` line is an update entry wherever it appears, so the twenty-five
 *      header updates of a real board never compete with its rows for a bucket.
 *   4. A legal row inside a column becomes a row or an epic row. A legal row OUTSIDE every column
 *      is a loud refusal rather than a quiet section line: it goes to `unparsed[]` with a null
 *      column. That is what makes the old specification's `## Blocked (2)` form visible — the
 *      heading opens no column, so the rows beneath it are reported rather than absorbed (D-07).
 *   5. Everything else is classed by position: a content line inside a non-column section belongs
 *      to that section, a content line before any heading is preamble, and a content line inside a
 *      column is unparsed.
 *
 * PRECEDENCE RULE 5 IS WHY `preamble` IS BOUNDED BY THE FIRST HEADING RATHER THAN BY THE FIRST
 * COLUMN. A document whose only heading is `## Notes (bootstrap, 2026-06-05)` has no columns at
 * all, and its prose belongs to that named section rather than to an unnamed preamble that would
 * then carry two unrelated kinds of line.
 */
export function parseBoard(text: string): BoardModel {
  const normalized = text.split("\r\n").join("\n");
  const lines = stripHtmlComments(normalized).split("\n");
  const bounds = measure(text, normalized);

  const columns: MutableColumn[] = [];
  const epicRows: EpicRow[] = [];
  const preamble: string[] = [];
  const updates: UpdateEntry[] = [];
  const nonColumnSections: MutableSection[] = [];
  const unparsed: UnparsedLine[] = [];

  // At most one of these is open at a time; both null means the preamble region.
  let column: MutableColumn | null = null;
  let section: MutableSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] as string;
    const lineNo = i + 1;

    if (raw.startsWith(H2_PREFIX)) {
      const heading = matchHeading(raw);
      if (heading === null) {
        section = { heading: raw, line: lineNo, lines: [] };
        nonColumnSections.push(section);
        column = null;
        continue;
      }
      column = {
        name: heading.name,
        heading: raw,
        kind: heading.kind,
        claimedLive: heading.claimedLive,
        limit: heading.limit,
        line: lineNo,
        rows: [],
      };
      columns.push(column);
      section = null;
      continue;
    }

    // A blanked comment span trims to nothing, so the two cases collapse into one test.
    if (raw.trim() === "") continue;

    const update = matchUpdateLine(raw, lineNo);
    if (update !== null) {
      updates.push(update);
      continue;
    }

    const row = matchRow(raw);
    if (row !== null) {
      if (column === null) {
        unparsed.push({ line: lineNo, text: raw, column: null });
        continue;
      }
      const bounded = boundRow(row.parts);
      if (row.isEpic) {
        epicRows.push({ ...bounded, id: row.id, line: lineNo, column: column.name });
        continue;
      }
      column.rows.push({ ...bounded, id: row.id, line: lineNo });
      continue;
    }

    if (section !== null) {
      section.lines.push(raw);
      continue;
    }
    if (column === null) {
      preamble.push(raw);
      continue;
    }
    unparsed.push({ line: lineNo, text: raw, column: column.name });
  }

  return {
    columns: columns.map((c) => ({
      name: c.name,
      heading: c.heading,
      kind: c.kind,
      claimedLive: c.claimedLive,
      limit: c.limit,
      line: c.line,
      rows: c.rows,
    })),
    epicRows,
    updates,
    preamble,
    nonColumnSections: nonColumnSections.map((s) => ({
      heading: s.heading,
      line: s.line,
      lines: s.lines,
    })),
    unparsed,
    bounds,
  };
}

/**
 * Measure the input, in the two units the contract names (D-20).
 *
 * `boardBytes` is the UTF-8 BYTE length of the input AS GIVEN, before CRLF normalization — the
 * number a human reads off `ls -l`, and the number a header claiming `380 KB` has to mean.
 * `longestLine` is a UTF-16 CODE-UNIT count over the normalized lines. The two units disagree on a
 * board carrying any character outside Latin-1, which is exactly why each is stated rather than
 * left for a reader to infer.
 *
 * Neither number is rounded here. The header's human-readable rendering rounds; the snapshot field
 * carries what was measured.
 */
function measure(text: string, normalized: string): Bounds {
  const boardBytes = Buffer.byteLength(text, "utf8");
  let longestLine = 0;
  let start = 0;
  for (;;) {
    const nl = normalized.indexOf("\n", start);
    const end = nl === -1 ? normalized.length : nl;
    if (end - start > longestLine) longestLine = end - start;
    if (nl === -1) break;
    start = nl + 1;
  }
  return {
    boardBytes,
    longestLine,
    exceeded: boardBytes > LARGE_BOARD_BYTES || longestLine > LONG_LINE_CHARS,
  };
}

/**
 * The canonical update-line shape (D-03).
 *
 * A line in any other `_Updated:` shape returns null here and is then classed BY POSITION rather
 * than by content: preamble before the first heading, a section line inside a non-column section,
 * an unparsed line inside a column. That positional rule is what keeps the kit board's own
 * `_Updated: <ISO date> by <role>_` placeholder off the findings list on a fresh install.
 */
export function matchUpdateLine(line: string, lineNo: number): UpdateEntry | null {
  const m = UPDATED.exec(line);
  if (m === null) return null;

  // BOTH the text and the actor are bounded, because the actor is a suffix of the text. The
  // measured 34,494-character line on a real board is an update line, so bounding only the text
  // would leave the whole of that line reachable through the field beside it.
  const text = truncateAt(line, MAX_UPDATE_TEXT_CHARS);
  const actor = truncateAt((m[2] as string).replace(/_$/, "").trim(), MAX_UPDATE_TEXT_CHARS);
  return {
    date: m[1] as string,
    actor: actor.value,
    text: text.value,
    line: lineNo,
    truncated: text.cut || actor.cut,
  };
}

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

/** One ticket under `plans/tickets/`, as `parseTicketDocument` below admitted it. */
export type TicketRecord = {
  /** The file name relative to `plans/tickets/`, which is the only identity the reader can trust. */
  readonly file: string;
  /** `id` from the admitted frontmatter when it carries one, else the file's stem. */
  readonly id: string;
  /** `title` from the admitted frontmatter, or "" when the document carries none. */
  readonly title: string;
  /** `column` from the admitted frontmatter, or null when the document carries none. */
  readonly column: string | null;
  /** `status` from the admitted frontmatter, or null when the document carries none. */
  readonly status: string | null;
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

/**
 * The ticket identifier's prefix — everything before the final hyphen of an already-matched ID.
 *
 * Only ever applied to a string that `TICKET_ID` has already admitted, so the hyphen it looks for
 * is guaranteed present and the result is guaranteed to be capitals and digits.
 */
function idPrefixOf(id: string): string {
  return id.slice(0, id.lastIndexOf("-"));
}

/**
 * Decompose a row, honouring the configured identifier prefix (D-02).
 *
 * THE PREFIX RULE IS ENFORCED BY THE PARSE RATHER THAN BY AN EIGHTH CONFLICT KIND. The contract
 * says a bracket carrying anything other than a conforming identifier makes the line unparsed, and
 * `factory.config.json#id_prefix` is part of what "conforming" means. Plan 32-04 found that the
 * pure parser could not enforce it because it holds no dial; the answer is that the dial's VALUE is
 * passed in by the read seam, not that the parser reads a file. The module stays pure, and the
 * refusal stays loud — a foreign-prefix row is reported with its line number rather than joined.
 *
 * EPIC AND FEATURE IDENTIFIERS ARE EXEMPT. They are a second class (D-02) with their own fixed
 * prefixes, so a project prefix has nothing to say about them.
 */
function matchRow(line: string, idPrefix: string | null): RowMatch | null {
  const row = ROW.exec(line);
  if (row === null) return null;
  const id = row[1] as string;
  if (EPIC_ID.test(id)) return { id, parts: splitRow(row[2] as string), isEpic: true };
  if (!TICKET_ID.test(id)) return null;
  if (idPrefix !== null && idPrefix !== "" && idPrefixOf(id) !== idPrefix) return null;
  return { id, parts: splitRow(row[2] as string), isEpic: false };
}

/** What `parseBoard` needs from outside the document it is parsing. */
export type ParseOptions = {
  /** `factory.config.json#id_prefix`, as the read seam found it. `null` means no dial value. */
  readonly idPrefix?: string | null;
};

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
export function parseBoard(text: string, options: ParseOptions = {}): BoardModel {
  const idPrefix = options.idPrefix ?? null;
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

    const row = matchRow(raw, idPrefix);
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

// ── The ticket document (plan 32-05, D-10) ───────────────────────────────────────────────────────
//
// WHY A TICKET GRAMMAR LIVES HERE AND NOT IN `scripts/canonical-frontmatter.ts`.
//
// Plan 32-03 routed `plans/tickets/*.md` through `admit` and RECORDED the problem rather than
// smoothing it over: `CANONICAL_SCHEMA` is the KIT ADAPTER schema (`name`, `description`, `tools`,
// …), so a ticket carrying `status:` or `column:` is refused with `unknown-key`. A projector that
// refuses every real ticket cannot derive `board-vs-ticket` at all, so the question had to be
// answered here. Three answers were considered:
//
//   * WIDEN `CANONICAL_SCHEMA` to carry the ticket keys. REFUSED. That constant is the spawn-grant
//     authority closed at Phase 27 round 12; adding keys to it widens the set of documents the
//     spawn gate admits, for a reason that has nothing to do with spawning.
//   * ADD a second `admit` entry point taking a widened alphabet. REFUSED. `AdmitOptions` can only
//     NARROW, by construction rather than by convention, and that structural property is the thing
//     a reader checks from the type alone. A widening entry point beside it contradicts it. It
//     would also be REQUIRED: the canonical plain-scalar alphabet carries no `/`, and this kit's
//     own configured column `In Security/NFR` does, so every ticket in that column would be refused.
//   * LEAVE tickets refused with `unknown-key`. REFUSED. It makes `board-vs-ticket` underivable and
//     reports a schema mismatch as if it were a malformed document.
//
// So the TICKET is a second DOCUMENT CLASS with its own closed key set, admitted here — in the
// module that already owns every other shape the projector reads, and that imports nothing at all.
// This ADDS no spelling: `scripts/validate-agent-factory.ts:712-719` already reads a ticket's
// `column:` and `status:` with its own regex pair, and plan 32-08 deletes that pair in favour of
// this function, exactly as D-06 does for `boardColumnName` and `boardHasColumn`. The canonical
// frontmatter authority keeps the document class it was built for and is not touched.
//
// THE POSTURE IS THE SAME ONE THE REST OF THIS MODULE TAKES: a small canonical form is admitted and
// every other byte is refused BY NAME. An unknown key is refused rather than ignored, because
// ignoring an unknown key is how a document grows a second place to hide a value.

/**
 * The closed ticket key set, stated in `agent-factory/contracts/board.md` § Ticket documents.
 *
 * Exported as a readonly array so a consumer can ITERATE it. A ninth key added here without a
 * contract sentence and a document that reaches it is the set-literal drift class this repository
 * has already paid for once, with seven granted names and zero resolving files.
 */
export const TICKET_KEYS = [
  "id",
  "title",
  "status",
  "column",
  "size",
  "priority",
  "epic",
  "feature",
] as const;

/** TWO-SIDED, and a change here is a decision recorded in the contract first. */
export const TICKET_KEY_COUNT = 8;

export type TicketKey = (typeof TICKET_KEYS)[number];

/**
 * The closed set of reasons a ticket document is refused, each a distinct sentence.
 *
 *   no-opening-delimiter  the document does not open with a `---` line
 *   no-closing-delimiter  the region opens and never closes
 *   unknown-key           a key outside TICKET_KEYS, refused rather than ignored
 *   duplicate-key         one key written twice, so the document expresses two values
 *   unrecognized-line     a line inside the region that is not `key: value` or `key:`
 *   control-character     a byte no terminal renders and no human wrote deliberately
 */
export const TICKET_REFUSAL_CODES = [
  "no-opening-delimiter",
  "no-closing-delimiter",
  "unknown-key",
  "duplicate-key",
  "unrecognized-line",
  "control-character",
] as const;

/** TWO-SIDED. A seventh refusal reason is a decision, never a bumped constant. */
export const TICKET_REFUSAL_CODE_COUNT = 6;

export type TicketRefusalCode = (typeof TICKET_REFUSAL_CODES)[number];

/** Every admitted key's value; a key the document does not carry reads `null`. */
export type TicketDocument = Readonly<Record<TicketKey, string | null>>;

export type TicketAdmission =
  | { readonly ok: true; readonly value: TicketDocument }
  | { readonly ok: false; readonly code: TicketRefusalCode; readonly reason: string };

const TICKET_DELIMITER = "---";
const TICKET_KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):(?: (.*))?$/;
// A C0 control other than newline, plus DEL. A tab is caught by the key pattern rather than trimmed.
const TICKET_CONTROL = /[\x00-\x09\x0b-\x1f\x7f]/;

const ticketRefusal = (code: TicketRefusalCode, reason: string): TicketAdmission => ({
  ok: false,
  code,
  reason,
});

/**
 * Admit a ticket document, or refuse it by name.
 *
 * The region is the bytes between the first `---` line and the next one. Only the region is read:
 * the body beneath it is the ticket's prose and is never interpreted, exactly as a row's `meta` and
 * `trailer` are never interpreted.
 */
export function parseTicketDocument(text: string): TicketAdmission {
  const normalized = text.split("\r\n").join("\n");
  const lines = normalized.split("\n");
  if (lines[0] !== TICKET_DELIMITER) {
    return ticketRefusal(
      "no-opening-delimiter",
      "a ticket document opens with a `---` line and this one opens with " +
        `\`${(lines[0] ?? "").slice(0, 40)}\``,
    );
  }

  let close = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === TICKET_DELIMITER) {
      close = i;
      break;
    }
  }
  if (close === -1) {
    return ticketRefusal(
      "no-closing-delimiter",
      "the frontmatter region opens with `---` and no later line closes it, so where the region " +
        "ends is a guess",
    );
  }

  const values: Record<string, string | null> = {};
  for (let i = 1; i < close; i++) {
    const line = lines[i] as string;
    if (line.trim() === "") continue;
    if (TICKET_CONTROL.test(line)) {
      return ticketRefusal(
        "control-character",
        `line ${i + 1} carries a control character, which no terminal renders and no human wrote ` +
          "deliberately",
      );
    }
    const m = TICKET_KEY_LINE.exec(line);
    if (m === null) {
      return ticketRefusal(
        "unrecognized-line",
        `line ${i + 1} is \`${line.slice(0, 60)}\`, which is neither \`key: value\` nor \`key:\``,
      );
    }
    const key = m[1] as string;
    if (!(TICKET_KEYS as readonly string[]).includes(key)) {
      return ticketRefusal(
        "unknown-key",
        `line ${i + 1} carries the key \`${key}\`, which is outside the closed ticket key set ` +
          `(${TICKET_KEYS.join(", ")}). A new key is recorded in agent-factory/contracts/board.md ` +
          "first; an unknown key is refused rather than ignored, because ignoring one is how a " +
          "document grows a second place to hide a value",
      );
    }
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return ticketRefusal(
        "duplicate-key",
        `\`${key}\` is written twice, so the document expresses two values for one key`,
      );
    }
    const raw = m[2];
    values[key] = raw === undefined || raw.trim() === "" ? null : raw.trim();
  }

  const value = Object.fromEntries(
    TICKET_KEYS.map((k) => [k, values[k] ?? null]),
  ) as TicketDocument;
  return { ok: true, value };
}

// ── Conflicts (D-08, D-09, D-10) ─────────────────────────────────────────────────────────────────
//
// THE SET IS CLOSED AT SEVEN AND THE SEVEN ARE THE ONES `agent-factory/contracts/board.md`
// § Conflicts NAMES IN PROSE. The contract states them and this module states them in code, with no
// third spelling anywhere. The order below is the contract's order, and it is load-bearing:
// `conflicts[]` is sorted by kind in DECLARATION order, so reshuffling this array silently reorders
// the committed golden.
//
// Exported as a readonly array so a consumer can ITERATE it — the golden's inventory case walks this
// array and asserts the fixture reaches every member. A kind added here without a fixture that
// reaches it is the set-literal drift class this repository has already paid for once.

export const CONFLICT_KINDS = [
  "board-vs-ticket",
  "ticket-unplaced",
  "ticket-duplicated",
  "row-without-file",
  "wip-limit",
  "wip-count",
  "column-missing",
] as const;

/**
 * TWO-SIDED, and the message reads as a decision rather than as a bumped constant. An eighth kind is
 * recorded in `agent-factory/contracts/board.md` first, bumps `SCHEMA_VERSION`, and regenerates
 * `scripts/fixtures/board-snapshot/expected-snapshot.json` — all in one commit (D-10, D-19).
 */
export const CONFLICT_KIND_COUNT = 7;

export type ConflictKind = (typeof CONFLICT_KINDS)[number];

/**
 * A disagreement between two sources, surfaced rather than resolved (D-10).
 *
 * `source` names WHERE THE EXPECTATION CAME FROM, never where the disagreement was noticed. A
 * ticket file that names a column expects the board to place it there, so the source is `tickets`;
 * a dial that names a limit expects the heading to state it, so the source is `config`.
 */
export type Conflict = {
  readonly kind: ConflictKind;
  readonly ticketId?: string;
  readonly column?: string;
  readonly expected: string;
  readonly actual: string;
  readonly source: SourceName;
};

/** The value a source carries, or null when it is unavailable. Declared once; both modules use it. */
export function sourceValue<T>(state: SourceState<T>): T | null {
  return state.source === "unavailable" ? null : state.value;
}

/**
 * Everything `joinSnapshot` reads: the six already-read source states, plus the two scalars the
 * reader alone knows.
 *
 * THE SIX ARRIVE AS STATES RATHER THAN AS VALUES, so "what is the value of this source" is answered
 * in exactly one place (`sourceValue`) rather than once per call site.
 */
export type JoinInputs = {
  readonly repoRoot: string;
  readonly generatedAt: string;
  readonly sources: FactorySnapshot["sources"];
};

export type JoinResult = {
  readonly snapshot: FactorySnapshot;
  readonly conflicts: readonly Conflict[];
};

/** A conflict plus the line it was derived from — the sort's last key, never an emitted field. */
type SortableConflict = { readonly conflict: Conflict; readonly line: number };

/** One ticket row's placement on the board. Epic rows never appear here (D-02). */
type Placement = { readonly id: string; readonly column: string; readonly line: number };

/**
 * Join the six read sources into the published snapshot and derive every conflict.
 *
 * THIS FUNCTION READS NOTHING. It is a pure function of already-read values, which is what makes the
 * committed golden a byte-for-byte function of its committed inputs (D-15, D-19). It also means no
 * board byte can reach a filesystem path from here: this module imports neither `node:fs` nor
 * `node:path`, so the ticket lookup below is a match against the ticket LIST the reader produced,
 * never a path built from a bracket's contents (T-32-02).
 *
 * NOTHING IS RESOLVED SILENTLY. Every disagreement becomes a `conflicts[]` entry, and no row's
 * column and no ticket's status is ever rewritten. A duplicated row renders under both headings; a
 * row with no ticket file still renders. The projector never hides a line in order to report a
 * conflict about it.
 *
 * A BOARD THAT COULD NOT BE READ PRODUCES NO CONFLICTS. With `sources.board` unavailable there is
 * nothing for a ticket to disagree WITH, and reporting every ticket as `ticket-unplaced` would
 * restate one missing source as a hundred disagreements the badge already reports once.
 */
export function joinSnapshot(inputs: JoinInputs): JoinResult {
  const { sources } = inputs;
  const board = sourceValue(sources.board);
  const config = sourceValue(sources.config);
  const tickets = sourceValue(sources.tickets) ?? [];

  const snapshot: FactorySnapshot = {
    schemaVersion: SCHEMA_VERSION,
    repoRoot: inputs.repoRoot,
    generatedAt: inputs.generatedAt,
    board,
    config,
    sources,
  };

  if (board === null) return { snapshot, conflicts: [] };

  const found: SortableConflict[] = [];
  const add = (line: number, conflict: Conflict): void => {
    found.push({ line, conflict });
  };

  // Every ticket row on the board, in document order. Epic rows are a SEPARATE CLASS (D-02): they
  // are never joined against `plans/tickets/` and never counted toward a column's WIP number, so
  // they are absent from this index by construction rather than filtered out of each derivation.
  const placements: Placement[] = [];
  for (const column of board.columns) {
    for (const row of column.rows) {
      placements.push({ id: row.id, column: column.name, line: row.line });
    }
  }

  const byId = new Map<string, Placement[]>();
  for (const p of placements) {
    const list = byId.get(p.id);
    if (list === undefined) byId.set(p.id, [p]);
    else list.push(p);
  }

  const ticketById = new Map<string, TicketRecord>();
  for (const t of tickets) if (!ticketById.has(t.id)) ticketById.set(t.id, t);

  // ── board-vs-ticket, arm one: the ticket file names a different column ─────────────────────────
  for (const p of placements) {
    const t = ticketById.get(p.id);
    if (t === undefined || t.column === null) continue;
    if (t.column === p.column) continue;
    add(p.line, {
      kind: "board-vs-ticket",
      ticketId: p.id,
      column: p.column,
      expected: t.column,
      actual: p.column,
      source: "tickets",
    });
  }

  // ── board-vs-ticket, arm two: the status is not the kebab form of the column ───────────────────
  //
  // The rule is `kebab(column) === status`, the SAME rule `scripts/validate-agent-factory.ts:747`
  // applies, through the single `kebab` spelling that lives in this module (D-06). A second spelling
  // of one rule is the drift class; there is no second spelling.
  for (const t of tickets) {
    if (t.column === null || t.status === null) continue;
    const expected = kebab(t.column);
    if (expected === t.status) continue;
    add(byId.get(t.id)?.[0]?.line ?? 0, {
      kind: "board-vs-ticket",
      ticketId: t.id,
      column: t.column,
      expected,
      actual: t.status,
      source: "tickets",
    });
  }

  // ── ticket-unplaced: a ticket file with no row ─────────────────────────────────────────────────
  for (const t of tickets) {
    if (byId.has(t.id)) continue;
    add(0, {
      kind: "ticket-unplaced",
      ticketId: t.id,
      expected: "a row on the board",
      actual: `no row names ${t.id}`,
      source: "tickets",
    });
  }

  // ── ticket-duplicated: one identifier carrying two or more rows ────────────────────────────────
  //
  // Two rows under the SAME heading are two rows, not one. Counting DISTINCT columns here would
  // silently dedupe an adjacent pair, which is the shape a copy-paste slip produces and therefore
  // the one a human most needs told about.
  for (const [id, list] of byId) {
    if (list.length < 2) continue;
    add(list[0]?.line ?? 0, {
      kind: "ticket-duplicated",
      ticketId: id,
      column: list[0]?.column ?? "",
      expected: "one row on the board",
      actual: list.map((p) => p.column).join(", "),
      source: "board",
    });
  }

  // ── row-without-file: a row naming an identifier with no ticket file ───────────────────────────
  const reportedMissing = new Set<string>();
  for (const p of placements) {
    if (ticketById.has(p.id) || reportedMissing.has(p.id)) continue;
    reportedMissing.add(p.id);
    add(p.line, {
      kind: "row-without-file",
      ticketId: p.id,
      column: p.column,
      expected: `plans/tickets/${p.id}.md`,
      actual: "no ticket file carries that identifier",
      source: "board",
    });
  }

  // ── The column cross-check (D-08) ─────────────────────────────────────────────────────────────
  //
  // THE BOARD'S HEADINGS DECIDE WHICH COLUMNS EXIST AND IN WHAT ORDER. The dial supplies the
  // expected limit and nothing else. A heading column absent from the dial is LEGAL — an unlimited
  // column and the Blocked column carry no limit — and is noted by its own `kind` in the column
  // record rather than raised as a conflict.
  const wipLimits = config?.wipLimits ?? {};
  for (const column of board.columns) {
    const configured = Object.prototype.hasOwnProperty.call(wipLimits, column.name)
      ? wipLimits[column.name]
      : undefined;

    if (configured !== undefined && column.limit !== null && column.limit !== configured) {
      add(column.line, {
        kind: "wip-limit",
        column: column.name,
        expected: String(configured),
        actual: String(column.limit),
        source: "config",
      });
    }

    // ── wip-count (D-09): the claimed live number against the rows counted ───────────────────────
    //
    // NOTHING IS CORRECTED. Both numbers and the limit ride in the conflict, so the renderer can
    // show `claimed 2 / counted 3 / limit 3` and a human sees which of the three to fix.
    if (column.claimedLive !== null && column.claimedLive !== column.rows.length) {
      add(column.line, {
        kind: "wip-count",
        column: column.name,
        expected: `claimed ${column.claimedLive}, limit ${column.limit ?? "none"}`,
        actual: `counted ${column.rows.length}`,
        source: "board",
      });
    }
  }

  // ── column-missing: a configured column with no heading ────────────────────────────────────────
  const headingNames = new Set(board.columns.map((c) => c.name));
  for (const name of Object.keys(wipLimits)) {
    if (headingNames.has(name)) continue;
    add(0, {
      kind: "column-missing",
      column: name,
      expected: `a heading for the configured column ${name}`,
      actual: "no heading on the board opens that column",
      source: "config",
    });
  }

  // ── The total order ───────────────────────────────────────────────────────────────────────────
  //
  // Kind in declaration order, then ticket id, then column, then the line the conflict came from. A
  // golden whose order depends on a filesystem listing or on an object's key order is a golden that
  // fails on somebody else's machine for a reason nobody can act on.
  const rank = (k: ConflictKind): number => CONFLICT_KINDS.indexOf(k);
  const sorted = [...found].sort((a, b) => {
    const byKind = rank(a.conflict.kind) - rank(b.conflict.kind);
    if (byKind !== 0) return byKind;
    const byTicket = (a.conflict.ticketId ?? "").localeCompare(b.conflict.ticketId ?? "");
    if (byTicket !== 0) return byTicket;
    const byColumn = (a.conflict.column ?? "").localeCompare(b.conflict.column ?? "");
    if (byColumn !== 0) return byColumn;
    if (a.line !== b.line) return a.line - b.line;
    // Last resort, so two conflicts identical on every key above still order deterministically.
    return a.conflict.expected.localeCompare(b.conflict.expected);
  });

  return { snapshot, conflicts: sorted.map((s) => s.conflict) };
}

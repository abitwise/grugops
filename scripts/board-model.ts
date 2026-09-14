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

export type BoardModel = {
  readonly columns: readonly BoardColumn[];
  readonly epicRows: readonly EpicRow[];
  /**
   * PLAN 32-02 FILLS THIS. The field exists in `schemaVersion: 1` from the first commit, so filling
   * it later is a functionality change and moves no boundary.
   */
  readonly updates: readonly UpdateEntry[];
  /** Every line before the first column heading (D-24). */
  readonly preamble: readonly string[];
  /** PLAN 32-02 FILLS THIS. See `updates` above. */
  readonly nonColumnSections: readonly NonColumnSection[];
  /** PLAN 32-02 FILLS THIS. See `updates` above. */
  readonly unparsed: readonly UnparsedLine[];
  /** PLAN 32-02 FILLS THIS. See `updates` above. */
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
export type StaleReason = "enoent" | "eacces" | "torn" | "bounded" | "unreadable";

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

/**
 * The published snapshot (D-19). `schemaVersion` is the contract a future web renderer consumes;
 * `board` is the joined board model; `sources` carries one read state per joined source so a single
 * missing `.grugops/` cannot hide a fresh board (D-12).
 */
export type FactorySnapshot = {
  readonly schemaVersion: number;
  readonly repoRoot: string;
  readonly generatedAt: string;
  readonly board: BoardModel;
  readonly config: FactoryConfigView | null;
  readonly sources: Readonly<{
    readonly [K in SourceName]: SourceState<unknown>;
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

/**
 * Parse a board document into the `schemaVersion: 1` model.
 *
 * CRLF is normalized before anything else, the way `scripts/canonical-frontmatter.ts` does, so a
 * Windows checkout is not refused for a reason that has nothing to do with the grammar. The comment
 * pre-pass runs next, before any heading or row scan touches a byte.
 *
 * THIS TASK POPULATES `columns`, `epicRows` AND `preamble`. `updates`, `nonColumnSections`,
 * `unparsed` and `bounds` are declared in the type and returned empty; plan 32-02 fills them. The
 * fields exist in `schemaVersion: 1` from the first commit, so filling them moves no boundary.
 */
export function parseBoard(text: string): BoardModel {
  const normalized = text.split("\r\n").join("\n");
  const lines = stripHtmlComments(normalized).split("\n");

  const columns: MutableColumn[] = [];
  const epicRows: EpicRow[] = [];
  const preamble: string[] = [];

  let current: MutableColumn | null = null;
  let sawColumn = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] as string;
    const lineNo = i + 1;

    // A level-two heading always closes the open column. A non-column heading opens a non-column
    // section, which is why bullets under `## Conventions` never land in the last column.
    if (raw.startsWith(H2_PREFIX)) {
      const heading = matchHeading(raw);
      if (heading === null) {
        current = null;
        continue;
      }
      current = {
        name: heading.name,
        heading: raw,
        kind: heading.kind,
        claimedLive: heading.claimedLive,
        limit: heading.limit,
        line: lineNo,
        rows: [],
      };
      columns.push(current);
      sawColumn = true;
      continue;
    }

    if (!sawColumn) {
      // D-24: everything before the first column heading is preamble. Blanked comment spans trim to
      // nothing and are not carried; the kit board's `_Updated:` placeholder is.
      if (raw.trim() !== "") preamble.push(raw);
      continue;
    }

    const row = ROW.exec(raw);
    if (row === null) continue;

    const id = row[1] as string;
    const parts = splitRow(row[2] as string);

    if (EPIC_ID.test(id)) {
      epicRows.push({ ...parts, id, line: lineNo, column: current?.name ?? null });
      continue;
    }
    if (!TICKET_ID.test(id)) continue; // plan 32-02 records this line in `unparsed[]`
    if (current === null) continue; // a row outside every column; plan 32-02 records it

    current.rows.push({ ...parts, id, line: lineNo });
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
    updates: [],
    preamble,
    nonColumnSections: [],
    unparsed: [],
    bounds: { boardBytes: 0, longestLine: 0, exceeded: false },
  };
}

/** The canonical update-line shape (D-03). Exported so plan 32-02 fills `updates[]` against it. */
export function matchUpdateLine(line: string, lineNo: number): UpdateEntry | null {
  const m = UPDATED.exec(line);
  if (m === null) return null;
  return {
    date: m[1] as string,
    actor: (m[2] as string).replace(/_$/, "").trim(),
    text: line,
    line: lineNo,
  };
}

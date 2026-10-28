// state-migrate.ts — the pure planner of `install --migrate`'s v3 state arm, and its stage-A conservation proof
// (phase 38, plan 38-02, MIGRATE-02, MIGRATE-03, MIGRATE-05).
//
// WHAT THIS OWNS. planStateMigrate turns the bytes of a pre-v3 planning root into the v3 board, the `## Board notes`
// sections appended to tickets, the board-updates file, the orphan-notes file, and the archive moves and writes that
// place every original (D-01 to D-04, D-17, D-21 option-a), with the refusals a planner can find and the budgets the
// planned state still breaks. proveStateMigrate is the D-09 stage-A proof over those outputs: the multiset of
// non-blank original board lines equals the multiset of output lines once the generated lines are removed BY
// POSITION (each asserted equal to its kind's template, MIGRATE_GENERATED_LINE_KINDS being the one closed set) and
// each cut row is rejoined with its trailer. It takes the written bytes as a parameter, so the same function proves
// the plan in memory and proves the bytes the installer re-reads from its staging directory.
//
// PURE. No function here reads a file, a clock or the environment: the installer (plan 38-03) reads every input
// through readUserFile, passes the migration date in, and executes the plan.
//
// IMPORT EDGES. install/ never imports scripts/. The board grammar, the ticket grammar, the section-extent owner,
// the task-folder name rule and the state rules reach this module only through the generated region below, one
// row of scripts/generate-runnable-embeds.ts EMBED_SPECS of kind `module`, freshness-checked by
// scripts/runnable-embeds-freshness.ts; it carries no build stamp. The state paths come from ./state-layout.js,
// the one place they are spelled, so the region embeds none of them.
//
// THE TRAILER IS CUT FROM THE RAW LINE. parseBoard is asked only which lines are ticket rows. Its `trailer` field is
// shortened at MAX_META_CHARS (1,024), so it is never the source of a cut; cutRow re-splits the raw line with the
// region's own ROW and splitRow, and the kept row is the raw line minus the trailer, byte for byte.
//
// Voice: clear professional voice (CLAUDE.md hard rule). This is the first grugops operation that rewrites user
// state, and every printed user value passes through the embedded stripControlChars.

import {
  BOARD_REL,
  BUDGETS,
  LEGACY_BOARD_REL,
  LEGACY_STATE_ROOT_REL,
  PRE_V3_BOARD_REL,
  PRE_V3_BOARD_UPDATES_REL,
  PRE_V3_ORPHAN_NOTES_REL,
  PRE_V3_TICKETS_REL,
  STATE_ROOT_REL,
  TICKETS_REL,
} from "./state-layout.js";

// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
// from scripts/board-model.ts
export const LARGE_BOARD_BYTES = 1_048_576;
export const LONG_LINE_CHARS = 65_536;
export const MAX_META_CHARS = 1_024;
export const MAX_UPDATE_TEXT_CHARS = 1_024;
const ELLIPSIS = "…";
function truncateAt(value: string, cap: number): { readonly value: string; readonly cut: boolean } {
  if (value.length <= cap) return { value, cut: false };
  let end = cap - 1;
  const lead = value.charCodeAt(end - 1);
  if (lead >= 0xd800 && lead <= 0xdbff) end -= 1;
  return { value: value.slice(0, end) + ELLIPSIS, cut: true };
}
export const HEADING_SUFFIXES = [
  { kind: "limited", pattern: /^\(WIP (\d{1,9})\/(\d{1,9})\)$/ },
  { kind: "unlimited", pattern: /^\(WIP unlimited\)$/ },
  { kind: "blocked", pattern: /^\(visible, time-tracked\)$/ },
] as const;
export type ColumnKind = (typeof HEADING_SUFFIXES)[number]["kind"];
const BLOCKED_COLUMN_NAME = "Blocked";
const H2_PREFIX = "## ";
const ROW = /^- \[([^\]]{1,64})\] (.*)$/;
const TICKET_ID = /^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/;
const EPIC_ID = /^(?:EPIC|FEAT)-\d{1,9}$/;
export function isTicketId(id: string): boolean {
  return TICKET_ID.test(id) && !EPIC_ID.test(id);
}
const META_GAP = "  (";
const UPDATED = /^_Updated: (\d{4}-\d{2}-\d{2}) by (.*)$/;
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
function blankKeepingNewlines(span: string): string {
  return span.replace(/[^\n]/g, " ");
}
export function splitRow(rest: string): RowParts {
  const at = rest.indexOf(META_GAP);
  if (at === -1) return { title: rest.trimEnd(), meta: null, trailer: "" };

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
  if (depth !== 0) return { title: rest.trimEnd(), meta: null, trailer: "" };

  return {
    title: rest.slice(0, at).trimEnd(),
    meta: rest.slice(at + 3, j),
    trailer: rest.slice(j + 1),
  };
}
type HeadingMatch = {
  readonly name: string;
  readonly kind: ColumnKind;
  readonly claimedLive: number | null;
  readonly limit: number | null;
};
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
type RowMatch = { readonly id: string; readonly parts: RowParts; readonly isEpic: boolean };
function idPrefixOf(id: string): string {
  return id.slice(0, id.lastIndexOf("-"));
}
function matchRow(line: string, idPrefix: string | null): RowMatch | null {
  const row = ROW.exec(line);
  if (row === null) return null;
  const id = row[1] as string;
  if (EPIC_ID.test(id)) return { id, parts: splitRow(row[2] as string), isEpic: true };
  if (!isTicketId(id)) return null;
  if (idPrefix !== null && idPrefix !== "" && idPrefixOf(id) !== idPrefix) return null;
  return { id, parts: splitRow(row[2] as string), isEpic: false };
}
export function normalizeDocument(text: string): string {
  const withoutMark = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return withoutMark.split("\r\n").join("\n");
}
export type ParseOptions = {
  /** `factory.config.json#id_prefix`, as the read seam found it. `null` means no dial value. */
  readonly idPrefix?: string | null;
};
export function parseBoard(text: string, options: ParseOptions = {}): BoardModel {
  const idPrefix = options.idPrefix ?? null;
  const normalized = normalizeDocument(text);
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
export type TicketKey = (typeof TICKET_KEYS)[number];
export const TICKET_REFUSAL_CODES = [
  "no-opening-delimiter",
  "no-closing-delimiter",
  "unknown-key",
  "duplicate-key",
  "unrecognized-line",
  "control-character",
] as const;
export type TicketRefusalCode = (typeof TICKET_REFUSAL_CODES)[number];
export type TicketDocument = Readonly<Record<TicketKey, string | null>>;
export type TicketAdmission =
  | { readonly ok: true; readonly value: TicketDocument }
  | { readonly ok: false; readonly code: TicketRefusalCode; readonly reason: string };
const TICKET_DELIMITER = "---";
const TICKET_KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):(?: ([^\t]*))?$/;
export const TICKET_CONTROL = /[\x00-\x08\x0b-\x1f\x7f]/;
export const RENDER_STRIPPED = /[\u0000-\u001F\u007F-\u009F]/g;
export function visible(text: string): string {
  return text.replace(
    RENDER_STRIPPED,
    (c) => `<U+${(c.codePointAt(0) as number).toString(16).toUpperCase().padStart(4, "0")}>`,
  );
}
export function spelled(
  parts: TemplateStringsArray,
  ...values: readonly (string | number)[]
): string {
  let out = parts[0] ?? "";
  for (let i = 0; i < values.length; i += 1) {
    out += visible(String(values[i])) + (parts[i + 1] ?? "");
  }
  return out;
}
const ticketRefusal = (code: TicketRefusalCode, reason: string): TicketAdmission => ({
  ok: false,
  code,
  reason,
});
export function parseTicketDocument(text: string): TicketAdmission {
  const normalized = normalizeDocument(text);
  const lines = normalized.split("\n");
  if (lines[0] !== TICKET_DELIMITER) {
    return ticketRefusal(
      "no-opening-delimiter",
      "a ticket document opens with a `---` line and this one opens with " +
        spelled`\`${(lines[0] ?? "").slice(0, 40)}\``,
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
        spelled`line ${i + 1} carries a control character, which no terminal renders and no human ` +
          "wrote deliberately",
      );
    }
    const m = TICKET_KEY_LINE.exec(line);
    if (m === null) {
      return ticketRefusal(
        "unrecognized-line",
        spelled`line ${i + 1} is \`${line.slice(0, 60)}\`, which is neither \`key: value\` nor \`key:\``,
      );
    }
    const key = m[1] as string;
    if (!(TICKET_KEYS as readonly string[]).includes(key)) {
      return ticketRefusal(
        "unknown-key",
        spelled`line ${i + 1} carries the key \`${key}\`, which is outside the closed ticket key ` +
          spelled`set (${TICKET_KEYS.join(", ")}). A new key is recorded in ` +
          "agent-factory/contracts/board.md first; an unknown key is refused rather than ignored, " +
          "because ignoring one is how a document grows a second place to hide a value",
      );
    }
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return ticketRefusal(
        "duplicate-key",
        spelled`\`${key}\` is written twice, so the document expresses two values for one key`,
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
// from scripts/board-read.ts
function ticketStem(name: string): string {
  return name.slice(0, -".md".length);
}
// from scripts/frontmatter.ts
const HTML_BLOCK_OPEN = /^ {0,3}<[!/a-zA-Z]/;
export function blockContextFlags(text: string): boolean[] {
  const lines = text.split("\n");
  const flags: boolean[] = [];
  let inside = false;
  let openChar = "";
  let openLen = 0;
  let html: "none" | "comment" | "tag" = "none";
  for (const line of lines) {
    if (html !== "none") {
      // A COMMENT block ends on the line carrying `-->`; a TAG block ends at the next blank line.
      const ends = html === "comment" ? line.includes("-->") : /^[ \t]*$/.test(line);
      flags.push(true);
      if (ends) html = "none";
      continue;
    }
    const run = strictFenceRun(line);
    if (!inside) {
      if (run !== null) {
        inside = !inside;
        openChar = run.char;
        openLen = run.len;
        flags.push(true);
        continue;
      }
      if (HTML_BLOCK_OPEN.test(line)) {
        html = line.includes("<!--") ? "comment" : "tag";
        // A comment that opens and closes on one line, or a tag block on a line that is itself
        // blank-terminated, does not carry the block past itself.
        if (html === "comment" && line.includes("-->")) html = "none";
        flags.push(true);
        continue;
      }
    } else if (
      run !== null &&
      run.char === openChar &&
      run.len >= openLen &&
      /^[ \t]*$/.test(run.info)
    ) {
      // §4.5's closing rule IN FULL here: same character, at least as long, and NO info string.
      inside = !inside;
      flags.push(true);
      continue;
    }
    flags.push(inside);
  }
  return flags;
}
function strictFenceRun(line: string): { char: string; len: number; info: string } | null {
  const at = line.search(/[^ ]/);
  if (at < 0 || at > 3) return null;
  const rest = line.slice(at);
  const char = rest[0];
  if (char !== "`" && char !== "~") return null;
  let len = 0;
  while (len < rest.length && rest[len] === char) len += 1;
  if (len < 3) return null;
  const info = rest.slice(len);
  if (char === "`" && info.includes("`")) return null; // a backtick fence's info string may not carry one
  return { char, len, info };
}
const HEADING_AT_MOST_1 = /^# /;
const HEADING_AT_MOST_2 = /^#{1,2} /;
export function sectionEndIndex(
  text: string,
  from: number,
  level: 1 | 2,
): number {
  const lines = text.split("\n");
  // THE STRICT PROJECTION (round 4, R5-2). "Does this line END a section" must agree with the
  // renderer or every freeze built on it is fiction; "is this line governed prose" is the other
  // question and keeps the measured lax view.
  const flags = blockContextFlags(text);
  const closes = level === 1 ? HEADING_AT_MOST_1 : HEADING_AT_MOST_2;
  for (let i = Math.max(from, 0); i < lines.length; i++) {
    if (!flags[i] && closes.test(lines[i])) return i;
  }
  return lines.length;
}
// from scripts/context-io.ts
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
// from scripts/state-rules.ts
export type StateUnit = "bytes" | "characters" | "lines" | "rows";
export type StateFinding = {
  readonly rel: string;
  readonly key: string;
  readonly measured: number | null;
  readonly budget: number | null;
  readonly unit: StateUnit | null;
  readonly line?: number;
  readonly note?: string;
};
export type MarkerState =
  | { readonly state: "absent" }
  | { readonly state: "valid" }
  | { readonly state: "invalid"; readonly reason: string };
export type StateBudgets = {
  readonly boardBytes: number;
  readonly boardRowChars: number;
  readonly boardUpdatedLines: number;
  readonly indexEntryBytes: number;
  readonly ticketBytes: number;
  readonly nfrBytes: number;
  readonly traceBytes: number;
  readonly progressBytes: number;
  readonly doneRows: number;
};
export type BoardTexts = {
  readonly raw: string;
  readonly normalized: string;
  readonly blanked: string;
};
export type BoardFacts = {
  readonly columns: readonly {
    readonly name: string;
    readonly line: number;
    readonly rows: readonly { readonly line: number }[];
  }[];
};
export function utf8Bytes(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
      const d = text.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        n += 4;
        i++;
      } else {
        n += 3;
      }
    } else {
      n += 3;
    }
  }
  return n;
}
export function markerState(text: string | null, expected: string): MarkerState {
  if (text === null) return { state: "absent" };
  const withoutMark = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const folded = withoutMark.replace(/\r\n/g, "\n");
  if (folded === expected || folded === `${expected}\n`) return { state: "valid" };
  if (folded.length === 0) return { state: "invalid", reason: "the file is empty" };
  const body = folded.endsWith("\n") ? folded.slice(0, -1) : folded;
  if (body.includes("\n")) {
    return { state: "invalid", reason: `it has more than one line; the content must be exactly \`${expected}\`` };
  }
  return { state: "invalid", reason: `the content is not exactly \`${expected}\`` };
}
const UNITS: { readonly [K in keyof StateBudgets]: StateUnit } = {
  boardBytes: "bytes",
  boardRowChars: "characters",
  boardUpdatedLines: "lines",
  indexEntryBytes: "bytes",
  ticketBytes: "bytes",
  nfrBytes: "bytes",
  traceBytes: "bytes",
  progressBytes: "bytes",
  doneRows: "rows",
};
function over(rel: string, key: keyof StateBudgets, measured: number, budgets: StateBudgets, line?: number): StateFinding {
  return {
    rel,
    key,
    measured,
    budget: budgets[key],
    unit: UNITS[key],
    ...(line === undefined ? {} : { line }),
  };
}
const UPDATED_PREFIX = "_Updated:";
export function boardBudgetFindings(
  rel: string,
  texts: BoardTexts,
  model: BoardFacts,
  budgets: StateBudgets,
): StateFinding[] {
  const findings: StateFinding[] = [];
  const bytes = utf8Bytes(texts.raw);
  if (bytes > budgets.boardBytes) findings.push(over(rel, "boardBytes", bytes, budgets));

  const lines = texts.normalized.split("\n");
  for (const column of model.columns) {
    for (const row of column.rows) {
      const units = (lines[row.line - 1] ?? "").length;
      if (units > budgets.boardRowChars) findings.push(over(rel, "boardRowChars", units, budgets, row.line));
    }
  }

  const updatedAt: number[] = [];
  texts.blanked.split("\n").forEach((line, i) => {
    if (line.startsWith(UPDATED_PREFIX)) updatedAt.push(i + 1);
  });
  if (updatedAt.length > budgets.boardUpdatedLines) {
    findings.push(over(rel, "boardUpdatedLines", updatedAt.length, budgets, updatedAt[budgets.boardUpdatedLines]));
  }
  return findings;
}
const DONE_COLUMN = "Done";
export function doneRowFindings(rel: string, model: BoardFacts, budgets: StateBudgets): StateFinding[] {
  const rows = doneRows(model);
  if (rows.length <= budgets.doneRows) return [];
  return [over(rel, "doneRows", rows.length, budgets, rows[budgets.doneRows]?.line)];
}
export type DocumentTexts = {
  readonly normalized: string;
  readonly blanked: string;
};
function bytesOutsideComments(line: string, blankedLine: string): number {
  let kept = "";
  let i = 0;
  while (i < line.length) {
    if (blankedLine.charCodeAt(i) === 0x20) {
      let j = i;
      let comment = false;
      while (j < line.length && blankedLine.charCodeAt(j) === 0x20) {
        if (line.charCodeAt(j) !== 0x20) comment = true;
        j++;
      }
      if (!comment) kept += line.slice(i, j);
      i = j;
    } else {
      let j = i;
      while (j < line.length && blankedLine.charCodeAt(j) !== 0x20) j++;
      kept += line.slice(i, j);
      i = j;
    }
  }
  return utf8Bytes(kept);
}
export function indexLineFindings(rel: string, texts: DocumentTexts, budgets: StateBudgets): StateFinding[] {
  const blanked = texts.blanked.split("\n");
  const findings: StateFinding[] = [];
  texts.normalized.split("\n").forEach((line, i) => {
    const bytes = bytesOutsideComments(line, blanked[i] ?? "");
    if (bytes > budgets.indexEntryBytes) findings.push(over(rel, "indexEntryBytes", bytes, budgets, i + 1));
  });
  return findings;
}
export type FileBudgetKey = "ticketBytes" | "nfrBytes" | "traceBytes" | "progressBytes";
export function fileBytesFinding(
  rel: string,
  bytes: number,
  key: FileBudgetKey,
  budgets: StateBudgets,
): StateFinding | null {
  if (bytes <= budgets[key]) return null;
  const finding = over(rel, key, bytes, budgets);
  if (key !== "traceBytes") return finding;
  const name = rel.slice(rel.lastIndexOf("/") + 1);
  const id = name.endsWith(".md") ? name.slice(0, -".md".length) : name;
  return {
    ...finding,
    note:
      `the trace file for ${id} is generated, so do not edit it: split the work of ticket ${id} into ` +
      "smaller tickets",
  };
}
export function recordEntryNames(names: readonly string[]): string[] {
  return names.filter((n) => !n.startsWith(".")).sort(codeUnitOrder);
}
export function budgetEntryNames(names: readonly string[]): string[] {
  return recordEntryNames(names).filter((n) => n.endsWith(".md"));
}
export type NfrIndexEntry = { readonly id: string; readonly target: string; readonly line: number };
export type NfrMalformedLine = { readonly line: number; readonly text: string };
export type NfrIndex = { readonly entries: readonly NfrIndexEntry[]; readonly malformed: readonly NfrMalformedLine[] };
const NFR_INDEX_LINE = /^- \[(NFR-[0-9]+)\]\(([^)]*)\)(?: [\s\S]*)?$/;
const NFR_LINE_START = "- [NFR";
const NFR_LINK_DIR = "nfr";
export function parseNfrIndex(blankedText: string): NfrIndex {
  const entries: NfrIndexEntry[] = [];
  const malformed: NfrMalformedLine[] = [];
  blankedText.split("\n").forEach((text, i) => {
    const m = NFR_INDEX_LINE.exec(text);
    if (m !== null) entries.push({ id: m[1] ?? "", target: m[2] ?? "", line: i + 1 });
    else if (text.trimStart().startsWith(NFR_LINE_START)) malformed.push({ line: i + 1, text });
  });
  return { entries, malformed };
}
export function nfrLinkTarget(id: string): string {
  return `${NFR_LINK_DIR}/${id}.md`;
}
export type DatedEntry = { readonly date: string; readonly heading: string; readonly line: number };
export type StandingSection = { readonly heading: string; readonly line: number };
export type ProgressEntries = { readonly dated: readonly DatedEntry[]; readonly standing: readonly StandingSection[] };
const SECTION_HEADING = /^##(?: |$)/;
const DATED_HEADING = /^## [0-9]{4}-[0-9]{2}-[0-9]{2}(?: |$)/;
function isCalendarDate(ymd: string): boolean {
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  const day = Number(ymd.slice(8, 10));
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  return day >= 1 && day <= days;
}
export function progressEntries(text: string, sectionEnd: SectionEndFn): ProgressEntries {
  const dated: DatedEntry[] = [];
  const standing: StandingSection[] = [];
  for (const [n, line] of text.split("\n").entries()) {
    if (!SECTION_HEADING.test(line) || sectionEnd(text, n, 2) !== n) continue;
    const heading = line.slice("## ".length);
    const date = heading.slice(0, "YYYY-MM-DD".length);
    if (DATED_HEADING.test(line) && isCalendarDate(date)) dated.push({ date, heading, line: n + 1 });
    else standing.push({ heading, line: n + 1 });
  }
  return { dated, standing };
}
function doneRows(model: BoardFacts): { readonly line: number }[] {
  return model.columns.filter((c) => c.name === DONE_COLUMN).flatMap((c) => c.rows);
}
export type RollSurface = "done" | "progress";
export function progressBytesFinding(
  rel: string,
  bytes: number,
  progress: ProgressEntries | null,
  decisionsRel: string,
  budgets: StateBudgets,
): StateFinding | null {
  const finding = fileBytesFinding(rel, bytes, "progressBytes", budgets);
  if (finding === null || progress === null || progress.dated.length > 0) return finding;
  const sections =
    progress.standing.length === 0
      ? "it has no `##` section, so its text belongs"
      : `its standing sections ${progress.standing.map((s) => `\`## ${s.heading}\``).join(", ")} belong`;
  return {
    ...finding,
    note:
      "it holds no dated status entry (a `## YYYY-MM-DD` heading), so nothing in it can roll; " +
      `${sections} in ${decisionsRel}/ as decision records`,
  };
}
export const DONE_ARCHIVE_HEADING = "## Done (WIP unlimited)";
export type RollBoardFacts = {
  readonly columns: readonly {
    readonly name: string;
    /** The heading line verbatim, after normalization. */
    readonly heading: string;
    readonly line: number;
    readonly rows: readonly { readonly id: string; readonly line: number }[];
  }[];
  /** Each non-column `##` section the grammar read (plan 37-11: a Done archive must hold none). */
  readonly nonColumnSections: readonly { readonly heading: string; readonly line: number }[];
  /** Every content line the grammar declined to read, with the column it sat under (plan 37-11). */
  readonly unparsed: readonly { readonly line: number; readonly column: string | null }[];
};
export type DoneRollPlan =
  | { readonly kind: "none"; readonly rows: number }
  | { readonly kind: "refuse"; readonly reason: string }
  | {
      readonly kind: "roll";
      readonly rows: number;
      readonly lines: readonly number[];
      readonly ids: readonly string[];
      readonly texts: readonly string[];
    };
export function planDoneRoll(texts: BoardTexts, model: RollBoardFacts, keep: number): DoneRollPlan {
  if (!Number.isInteger(keep) || keep < 0) {
    return { kind: "refuse", reason: `the number of Done rows to keep (${keep}) is not a whole number of rows` };
  }
  const done = model.columns.filter((c) => c.name === DONE_COLUMN);
  if (done.length === 0) return { kind: "none", rows: 0 };
  if (done.length > 1) {
    return {
      kind: "refuse",
      reason:
        `the board has ${done.length} columns named ${DONE_COLUMN} (lines ${done.map((c) => c.line).join(", ")}), ` +
        "so the newest rows have no defined order; merge them by hand first",
    };
  }
  const rows = (done[0] as RollBoardFacts["columns"][number]).rows;
  if (rows.length <= keep) return { kind: "none", rows: rows.length };
  // Plan 37-11: a Done column that holds a line other than ticket rows and blank lines is not a shape the roll
  // can reason about (which rows are the newest, and where does the prose belong after the move), so it is
  // refused before anything moves. The grammar names each such line and the column it sat under.
  const prose = model.unparsed.filter((u) => u.column === DONE_COLUMN);
  if (prose.length > 0) {
    return {
      kind: "refuse",
      reason:
        `the ${DONE_COLUMN} column holds ${prose.length} line(s) that are not ticket rows (line(s) ` +
        `${prose.map((u) => u.line).join(", ")}), so it was not rolled; move that text out of the column by hand`,
    };
  }
  const raw = texts.raw.split("\n");
  const normalized = texts.normalized.split("\n");
  const blanked = texts.blanked.split("\n");
  if (raw.length !== normalized.length || raw.length !== blanked.length) {
    return { kind: "refuse", reason: "the board's raw, normalized and comment-blanked forms do not have one line count" };
  }
  const moved = rows.slice(keep);
  const lines: number[] = [];
  const ids: string[] = [];
  const out: string[] = [];
  for (const row of moved) {
    const i = row.line - 1;
    const rawLine = raw[i];
    const line = normalized[i];
    if (i < 1 || rawLine === undefined || line === undefined) {
      return { kind: "refuse", reason: `the Done row ${row.id} names line ${row.line}, which the board does not hold` };
    }
    if (blanked[i] !== line) {
      return {
        kind: "refuse",
        reason:
          `the Done row ${row.id} on line ${row.line} carries an HTML comment, so it was not moved: moving part of ` +
          "a comment would change which lines it hides; move that row by hand",
      };
    }
    if (rawLine !== line && rawLine !== `${line}\r`) {
      return { kind: "refuse", reason: `the Done row ${row.id} on line ${row.line} is not its normalized line as read` };
    }
    lines.push(row.line);
    ids.push(row.id);
    out.push(rawLine);
  }
  return { kind: "roll", rows: rows.length, lines, ids, texts: out };
}
export function doneArchiveSkeleton(texts: readonly string[]): string {
  return `${DONE_ARCHIVE_HEADING}${texts[0]?.endsWith("\r") === true ? "\r" : ""}\n`;
}
export type ArchiveInsertPlan =
  | { readonly kind: "refuse"; readonly reason: string }
  | {
      readonly kind: "insert";
      readonly created: boolean;
      readonly base: string;
      readonly at: number;
      readonly text: string;
    };
function insertLines(text: string, at: number, block: readonly string[]): string {
  const lines = text.split("\n");
  return [...lines.slice(0, at), ...block, ...lines.slice(at)].join("\n");
}
export function planArchiveInsert(
  archive: { readonly texts: BoardTexts; readonly model: RollBoardFacts } | null,
  texts: readonly string[],
): ArchiveInsertPlan {
  if (texts.length === 0) return { kind: "refuse", reason: "there are no rows to insert into the Done archive" };
  if (archive === null) {
    const base = doneArchiveSkeleton(texts);
    return { kind: "insert", created: true, base, at: 1, text: insertLines(base, 1, texts) };
  }
  const columns = archive.model.columns;
  const column = columns[0];
  if (columns.length !== 1 || column === undefined || column.heading !== DONE_ARCHIVE_HEADING) {
    const found = columns.length === 0 ? "none" : columns.map((c) => `\`${c.heading}\` (line ${c.line})`).join(", ");
    return {
      kind: "refuse",
      reason: `the Done archive must carry exactly one column heading, \`${DONE_ARCHIVE_HEADING}\`; it carries ${found}`,
    };
  }
  const other = archive.model.nonColumnSections;
  if (other.length > 0) {
    return {
      kind: "refuse",
      reason:
        `the Done archive must carry no heading but \`${DONE_ARCHIVE_HEADING}\`; it also carries ` +
        other.map((s) => `\`${s.heading}\` (line ${s.line})`).join(", "),
    };
  }
  const first = column.rows[0];
  let at: number;
  if (first !== undefined) {
    at = first.line - 1;
  } else {
    const h = column.line - 1;
    if (archive.texts.blanked.split("\n")[h] !== archive.texts.normalized.split("\n")[h]) {
      return { kind: "refuse", reason: `the Done archive's heading on line ${column.line} carries an HTML comment` };
    }
    at = column.line;
  }
  const base = archive.texts.raw;
  return { kind: "insert", created: false, base, at, text: insertLines(base, at, texts) };
}
export type RollPlan = {
  /**
   * Which surface rolls (plan 37-11). It decides the skeleton a created archive starts from, which the proof
   * derives itself: the Done archive's one heading, or the progress archive's title. Absent means `done`.
   */
  readonly surface?: RollSurface;
  /** Repository-relative path of the board the rows leave. */
  readonly sourceRel: string;
  /** Repository-relative path of the Done archive the rows enter. */
  readonly archiveRel: string;
  /** 1-based line numbers of the moved rows in the old board, ascending. */
  readonly lines: readonly number[];
  /** The moved raw lines, in board order. */
  readonly texts: readonly string[];
  /**
   * The order the moved lines take in the archive, as indexes into `texts` (plan 37-11): the progress roll
   * moves its entries oldest first, which need not be their order in the file. Absent means `texts` order.
   */
  readonly insertOrder?: readonly number[];
  /** The text the block is inserted into: the old archive, or the created skeleton. */
  readonly archiveBase: string;
  /** The 0-based line of archiveBase the block is inserted before. */
  readonly insertAt: number;
  /** Both files as read. A null archive did not exist. */
  readonly before: { readonly source: string; readonly archive: string | null };
  /** Both files as the roll writes them. */
  readonly after: { readonly source: string; readonly archive: string };
};
function removeLines(text: string, lines: readonly number[]): string {
  const drop = new Set(lines);
  return text
    .split("\n")
    .filter((_, i) => !drop.has(i + 1))
    .join("\n");
}
export function assembleRoll(
  sourceRel: string,
  archiveRel: string,
  before: { readonly source: string; readonly archive: string | null },
  roll: { readonly lines: readonly number[]; readonly texts: readonly string[]; readonly order?: readonly number[] },
  insert: { readonly base: string; readonly at: number; readonly text: string },
  surface: RollSurface = "done",
): RollPlan {
  return {
    surface,
    sourceRel,
    archiveRel,
    lines: roll.lines,
    texts: roll.texts,
    insertOrder: roll.order ?? roll.texts.map((_, k) => k),
    archiveBase: insert.base,
    insertAt: insert.at,
    before,
    after: { source: removeLines(before.source, roll.lines), archive: insert.text },
  };
}
function firstDifference(a: readonly string[], b: readonly string[]): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return -1;
}
export function checkConservation(
  before: { readonly source: string; readonly archive: string | null },
  after: { readonly source: string | null; readonly archive: string | null },
  plan: Pick<
    RollPlan,
    "surface" | "sourceRel" | "archiveRel" | "lines" | "texts" | "insertOrder" | "archiveBase" | "insertAt"
  >,
): string | null {
  const { sourceRel, archiveRel, lines, texts } = plan;
  if (lines.length === 0 || lines.length !== texts.length) {
    return `the plan moves ${lines.length} line(s) and carries ${texts.length} text(s)`;
  }
  // The archive order must place every moved line exactly once (plan 37-11), so no line can be doubled or
  // dropped by the order alone.
  const order = plan.insertOrder ?? texts.map((_, k) => k);
  const placed = new Set(order);
  if (
    order.length !== texts.length ||
    placed.size !== order.length ||
    order.some((k) => !Number.isInteger(k) || k < 0 || k >= texts.length)
  ) {
    return `the planned archive order does not place each of the ${texts.length} moved line(s) exactly once`;
  }
  const inserted = order.map((k) => texts[k] as string);
  const old = before.source.split("\n");
  const drop = new Set<number>();
  for (let k = 0; k < lines.length; k++) {
    const line = lines[k] as number;
    if (k > 0 && line <= (lines[k - 1] as number)) return `the planned board lines are not in ascending order`;
    if (old[line - 1] !== texts[k]) return `${sourceRel} line ${line} as read is not the row the plan moves`;
    drop.add(line);
  }
  if (after.source === null) return `${sourceRel} is absent after the roll`;
  const expectedSource = old.filter((_, i) => !drop.has(i + 1));
  const gotSource = after.source.split("\n");
  const s = firstDifference(gotSource, expectedSource);
  if (s !== -1) {
    return (
      `${sourceRel} line ${s + 1} differs from the old board with the moved rows removed ` +
      `(${gotSource.length} line(s), expected ${expectedSource.length})`
    );
  }
  const base =
    before.archive ??
    ((plan.surface ?? "done") === "progress" ? progressArchiveSkeleton(inserted, sourceRel) : doneArchiveSkeleton(texts));
  if (plan.archiveBase !== base) return `the archive text the plan inserts into is not ${archiveRel} as read`;
  const baseLines = base.split("\n");
  if (!Number.isInteger(plan.insertAt) || plan.insertAt < 1 || plan.insertAt > baseLines.length) {
    return `the planned insert line ${plan.insertAt} is outside ${archiveRel}`;
  }
  if (after.archive === null) return `${archiveRel} is absent after the roll`;
  const expectedArchive = [...baseLines.slice(0, plan.insertAt), ...inserted, ...baseLines.slice(plan.insertAt)];
  const gotArchive = after.archive.split("\n");
  const a = firstDifference(gotArchive, expectedArchive);
  if (a !== -1) {
    return (
      `${archiveRel} line ${a + 1} differs from the old archive with the moved rows inserted ` +
      `(${gotArchive.length} line(s), expected ${expectedArchive.length})`
    );
  }
  return null;
}
export type RollIo = {
  read(rel: string): string | null;
  write(rel: string, text: string): void;
  remove(rel: string): void;
};
export type RollOutcome =
  | { readonly ok: true }
  | {
      readonly ok: false;
      /**
       * `changed`: a file differed from the plan's `before` when re-read, so nothing was written.
       * `rolled-back`: a write threw or the proof failed, and both files were restored.
       * `restore-failed`: as `rolled-back`, but a file could not be restored to its old bytes.
       */
      readonly stage: "changed" | "rolled-back" | "restore-failed";
      readonly reason: string;
    };
function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
export function executeRoll(plan: RollPlan, io: RollIo): RollOutcome {
  const { sourceRel, archiveRel, before, after } = plan;
  try {
    const source = io.read(sourceRel);
    const archive = io.read(archiveRel);
    if (source !== before.source) {
      return { ok: false, stage: "changed", reason: `${sourceRel} changed after it was read, so nothing was written` };
    }
    if (archive !== before.archive) {
      return { ok: false, stage: "changed", reason: `${archiveRel} changed after it was read, so nothing was written` };
    }
  } catch (e) {
    return { ok: false, stage: "changed", reason: `the files could not be re-read before the roll: ${messageOf(e)}` };
  }
  let reason: string | null;
  try {
    io.write(archiveRel, after.archive);
    io.write(sourceRel, after.source);
    reason = checkConservation(before, { source: io.read(sourceRel), archive: io.read(archiveRel) }, plan);
  } catch (e) {
    reason = `the roll stopped part way: ${messageOf(e)}`;
  }
  if (reason === null) return { ok: true };
  const failures: string[] = [];
  // Plan 37-11: a file that already holds its old bytes (a write that threw before it replaced the file) is
  // left alone, so a file whose directory refuses writes does not turn a clean rollback into a failed one.
  const holds = (rel: string, old: string | null): boolean => {
    try {
      return io.read(rel) === old;
    } catch {
      return false;
    }
  };
  try {
    if (!holds(sourceRel, before.source)) io.write(sourceRel, before.source);
  } catch (e) {
    failures.push(`${sourceRel} could not be written back (${messageOf(e)})`);
  }
  try {
    if (before.archive === null) {
      if (!holds(archiveRel, null)) io.remove(archiveRel);
    } else if (!holds(archiveRel, before.archive)) {
      io.write(archiveRel, before.archive);
    }
  } catch (e) {
    failures.push(`${archiveRel} could not be ${before.archive === null ? "removed" : "written back"} (${messageOf(e)})`);
  }
  try {
    if (io.read(sourceRel) !== before.source) failures.push(`${sourceRel} does not hold its old bytes`);
    if (io.read(archiveRel) !== before.archive) {
      failures.push(before.archive === null ? `${archiveRel} is still present` : `${archiveRel} does not hold its old bytes`);
    }
  } catch (e) {
    failures.push(`the restored files could not be re-read (${messageOf(e)})`);
  }
  if (failures.length > 0) return { ok: false, stage: "restore-failed", reason: `${reason}; ${failures.join("; ")}` };
  return { ok: false, stage: "rolled-back", reason };
}
export const PROGRESS_ARCHIVE_TITLE = "# Progress archive";
export type SectionEndFn = (text: string, from: number, level: 1 | 2) => number;
export type ProgressBlock = {
  readonly date: string;
  readonly heading: string;
  /** The 1-based line numbers of the entry, heading first, ascending. */
  readonly lines: readonly number[];
  /** The entry's raw lines, `\r` included. */
  readonly texts: readonly string[];
  /** The UTF-8 bytes the entry takes in the file: each line and the line feed after it. */
  readonly bytes: number;
};
export type ProgressRollPlan =
  | {
      readonly kind: "none";
      /** The file's UTF-8 size. */
      readonly bytes: number;
      /** How many dated status entries it holds; 0 over budget means nothing in it can roll (D-09). */
      readonly dated: number;
      /** The headings of its standing `##` sections, in file order. */
      readonly standing: readonly string[];
    }
  | { readonly kind: "refuse"; readonly reason: string }
  | {
      readonly kind: "roll";
      readonly bytes: number;
      /** The file's UTF-8 size after the roll. */
      readonly remaining: number;
      readonly dated: number;
      readonly standing: readonly string[];
      /** The moved entries, in the order they move (oldest date first). */
      readonly blocks: readonly ProgressBlock[];
      /** Every moved line's 1-based number, ascending. */
      readonly lines: readonly number[];
      /** The moved raw lines in file order, one per entry of `lines`. */
      readonly texts: readonly string[];
      /** The archive order: for each line the archive gains, in order, its index into `texts`. */
      readonly order: readonly number[];
    };
function lineBytes(raw: string): number {
  return utf8Bytes(raw) + 1;
}
export function planProgressRoll(texts: BoardTexts, budgetBytes: number, sectionEnd: SectionEndFn): ProgressRollPlan {
  if (!Number.isInteger(budgetBytes) || budgetBytes < 0) {
    return { kind: "refuse", reason: `the progress budget (${budgetBytes}) is not a whole number of bytes` };
  }
  const bytes = utf8Bytes(texts.raw);
  const entries = progressEntries(texts.blanked, sectionEnd);
  const standing = entries.standing.map((s) => s.heading);
  const dated = entries.dated.length;
  if (bytes <= budgetBytes || dated === 0) return { kind: "none", bytes, dated, standing };
  const raw = texts.raw.split("\n");
  const normalized = texts.normalized.split("\n");
  const blanked = texts.blanked.split("\n");
  if (raw.length !== normalized.length || raw.length !== blanked.length) {
    return { kind: "refuse", reason: "the progress file's raw, normalized and comment-blanked forms do not have one line count" };
  }
  /** The entry `e` as a block, or the reason it cannot move. */
  const blockOf = (e: DatedEntry): ProgressBlock | string => {
    const start = e.line - 1;
    const name = `the entry \`## ${e.heading}\` (line ${e.line})`;
    let end = sectionEnd(texts.blanked, start + 1, 2);
    // The empty string after a final line feed is the file's end, not a line of the last entry.
    if (end === raw.length && end - 1 > start && raw[end - 1] === "") end -= 1;
    const lines: number[] = [];
    const out: string[] = [];
    let size = 0;
    for (let i = start; i < end; i++) {
      const rawLine = raw[i] as string;
      const line = normalized[i] as string;
      if (blanked[i] !== line) {
        return (
          `${name} carries an HTML comment on line ${i + 1}, so it was not moved: moving part of a comment ` +
          "would change which lines it hides; move that entry by hand"
        );
      }
      if (rawLine !== line && rawLine !== `${line}\r`) {
        return `line ${i + 1} of ${name} is not its normalized line as read (a byte-order mark?), so it was not moved`;
      }
      lines.push(i + 1);
      out.push(rawLine);
      size += lineBytes(rawLine);
    }
    return { date: e.date, heading: e.heading, lines, texts: out, bytes: size };
  };

  const oldestFirst = [...entries.dated].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.line - b.line,
  );
  const blocks: ProgressBlock[] = [];
  let left = bytes;
  for (const e of oldestFirst) {
    if (left <= budgetBytes) break;
    const block = blockOf(e);
    if (typeof block === "string") return { kind: "refuse", reason: block };
    blocks.push(block);
    left -= block.bytes;
  }
  const lines = blocks.flatMap((b) => b.lines).sort((a, b) => a - b);
  const indexOf = new Map(lines.map((l, k) => [l, k]));
  const order = blocks.flatMap((b) => b.lines.map((l) => indexOf.get(l) as number));
  const remaining = utf8Bytes(removeLines(texts.raw, lines));
  return {
    kind: "roll",
    bytes,
    remaining,
    dated,
    standing,
    blocks,
    lines,
    texts: lines.map((l) => raw[l - 1] as string),
    order,
  };
}
export function progressArchiveSkeleton(inserted: readonly string[], sourceRel: string): string {
  const eol = inserted[0]?.endsWith("\r") === true ? "\r\n" : "\n";
  return [
    PROGRESS_ARCHIVE_TITLE,
    "",
    `<!-- Dated status entries moved whole from ${sourceRel} by state-roll, oldest first. Move only: never ` +
      "edit, squash or prune an entry here. -->",
    "",
  ].join(eol);
}
function appendAt(text: string): number {
  const lines = text.split("\n");
  return lines.at(-1) === "" ? lines.length - 1 : lines.length;
}
export function planProgressAppend(
  archive: BoardTexts | null,
  roll: { readonly blocks: readonly ProgressBlock[]; readonly texts: readonly string[]; readonly order: readonly number[] },
  sourceRel: string,
  sectionEnd: SectionEndFn,
  view: (raw: string) => string,
): ArchiveInsertPlan {
  const inserted = roll.order.map((k) => roll.texts[k] as string);
  if (inserted.length === 0) return { kind: "refuse", reason: "there are no entries to append to the progress archive" };
  let base: string;
  if (archive === null) {
    base = progressArchiveSkeleton(inserted, sourceRel);
  } else {
    const first = archive.normalized.split("\n")[0];
    if (first !== PROGRESS_ARCHIVE_TITLE) {
      return {
        kind: "refuse",
        reason: `the progress archive must start with the line \`${PROGRESS_ARCHIVE_TITLE}\`; it starts with \`${first ?? ""}\``,
      };
    }
    const present = new Set(archive.normalized.split("\n"));
    const doubled = roll.blocks.filter((b) => present.has(`## ${b.heading}`));
    if (doubled.length > 0) {
      return {
        kind: "refuse",
        reason:
          `the progress archive already holds the heading line of ${doubled.length} entry(ies) this roll would ` +
          `move (${doubled.map((b) => `\`## ${b.heading}\``).join(", ")}): an earlier roll was interrupted after ` +
          "it wrote the archive, or the entries were copied by hand. Nothing was moved; once each copy is " +
          "confirmed equal, delete the progress file's copy by hand and run state-roll again",
      };
    }
    base = archive.raw;
  }
  const at = appendAt(base);
  const text = insertLines(base, at, inserted);
  const after = view(text);
  const shown = after.split("\n");
  for (let j = 0; j < inserted.length; j++) {
    const line = inserted[j] as string;
    if (shown[at + j] !== (line.endsWith("\r") ? line.slice(0, -1) : line)) {
      return {
        kind: "refuse",
        reason: `the moved line that would be line ${at + j + 1} of the progress archive would be hidden by an HTML comment there`,
      };
    }
  }
  let h = at;
  for (const b of roll.blocks) {
    if (sectionEnd(after, h, 2) !== h) {
      return {
        kind: "refuse",
        reason: `the moved entry \`## ${b.heading}\` would sit inside a fenced block in the progress archive (line ${h + 1})`,
      };
    }
    h += b.lines.length;
  }
  return { kind: "insert", created: archive === null, base, at, text };
}
export function doneDuplicateRefusal(ids: readonly string[], archive: RollBoardFacts | null): string | null {
  if (archive === null) return null;
  const present = new Set(archive.columns.flatMap((c) => c.rows.map((r) => r.id)));
  const doubled = ids.filter((id) => present.has(id));
  if (doubled.length === 0) return null;
  return (
    `the Done archive already holds ${doubled.length} row(s) this roll would move (${doubled.join(", ")}): an ` +
    "earlier roll was interrupted after it wrote the archive, or the rows were copied by hand. Nothing was moved; " +
    "once each copy is confirmed equal, delete the board's row by hand and run state-roll again"
  );
}
export type LineEndings = "none" | "lf" | "crlf" | "mixed";
export function lineEndings(text: string): LineEndings {
  const lines = text.split("\n");
  if (lines.length === 1) return "none";
  let cr = 0;
  for (let i = 0; i < lines.length - 1; i++) if ((lines[i] as string).endsWith("\r")) cr++;
  if (cr === 0) return "lf";
  return cr === lines.length - 1 ? "crlf" : "mixed";
}
export function lineEndingRefusal(
  plan: Pick<RollPlan, "sourceRel" | "archiveRel" | "before" | "after">,
): string | null {
  const files = [
    [plan.sourceRel, plan.before.source, plan.after.source],
    [plan.archiveRel, plan.before.archive, plan.after.archive],
  ] as const;
  for (const [rel, before] of files) {
    if (before !== null && lineEndings(before) === "mixed") {
      return `${rel} already mixes LF and CRLF line endings, so it was not rolled; give it one line ending first`;
    }
  }
  for (const [rel, , after] of files) {
    if (lineEndings(after) === "mixed") {
      return (
        `the roll would leave ${rel} with mixed LF and CRLF line endings, because ${plan.sourceRel} and ` +
        `${plan.archiveRel} do not end their lines the same way (or the last moved line has no line ending); ` +
        "give both files the same line ending first"
      );
    }
  }
  return null;
}
function grouped(n: number): string {
  return String(n).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}
export function formatFinding(f: StateFinding): string {
  const where = f.line === undefined ? f.rel : `${f.rel}:${f.line}`;
  if (f.budget === null || f.unit === null) return `${where}: ${f.note ?? "no detail"} (${f.key})`;
  const measured = f.measured === null ? "not measured" : `${grouped(f.measured)} ${f.unit}`;
  const note = f.note === undefined ? "" : ` — ${f.note}`;
  return `${where}: ${measured}, budget ${grouped(f.budget)} ${f.unit} (BUDGETS.${f.key})${note}`;
}
export function stripControlChars(text: string, multiLine: boolean): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const control = c < 0x20 || (c >= 0x7f && c <= 0x9f);
    if (!control || (multiLine && (c === 0x09 || c === 0x0a))) out += text[i];
  }
  return out;
}
function codeUnitOrder(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
export function sortFindings(list: readonly StateFinding[]): StateFinding[] {
  return [...list].sort(
    (a, b) =>
      codeUnitOrder(a.rel, b.rel) ||
      codeUnitOrder(a.key, b.key) ||
      (a.line ?? 0) - (b.line ?? 0),
  );
}
// </runnable-embeds>

// ── Hand-written part: the planner and the stage-A proof ───────────────────────────────────────────────────────

/** The task-folder name rule (scripts/context-io.ts), re-exported for the context-archive arm (plan 38-10). */
export { TASK_NAME_RE };

/** The ticket body heading the cut trailers go under (agent-factory/contracts/board.md § Ticket body sections). */
export const BOARD_NOTES_HEADING = "## Board notes";

/** The first line of PRE_V3_BOARD_UPDATES_REL (D-04). */
export const BOARD_UPDATES_TITLE = "# Board updates from the pre-v3 board";

/** The first line of PRE_V3_ORPHAN_NOTES_REL (D-03). */
export const ORPHAN_NOTES_TITLE = "# Board notes of rows with no ticket file";

/**
 * The closed, named set of line kinds migrate generates (D-09). The proof removes a generated line only by its
 * declared position, and only when the line there equals its kind's template, so an original line can never be
 * hidden by calling it generated.
 *   - `board-notes-heading`: BOARD_NOTES_HEADING, opening each appended section;
 *   - `provenance`: provenanceLine, naming the pre-v3 board, the board line (or none, for a whole file) and the
 *     migration date; it follows each Board notes heading, each orphan heading and each archive-only file's title;
 *   - `updates-title`: BOARD_UPDATES_TITLE, line 1 of PRE_V3_BOARD_UPDATES_REL;
 *   - `orphan-title`: ORPHAN_NOTES_TITLE, line 1 of PRE_V3_ORPHAN_NOTES_REL;
 *   - `orphan-heading`: `## [ID]`, one per orphan row in PRE_V3_ORPHAN_NOTES_REL.
 */
export const MIGRATE_GENERATED_LINE_KINDS = Object.freeze([
  "board-notes-heading",
  "provenance",
  "updates-title",
  "orphan-title",
  "orphan-heading",
] as const);

/** One member of MIGRATE_GENERATED_LINE_KINDS. */
export type GeneratedKind = (typeof MIGRATE_GENERATED_LINE_KINDS)[number];

/**
 * The one provenance line: where the text below it came from, in one sentence. `boardLine` is the one-based line of
 * the pre-v3 board, or null for a file that gathers lines from many board lines.
 */
export function provenanceLine(boardLine: number | null, date: string): string {
  const where = boardLine === null ? "the pre-v3 board" : `line ${boardLine} of the pre-v3 board`;
  return `Copied verbatim by install --migrate on ${date} from ${where} \`${LEGACY_BOARD_REL}\`.`;
}

/** One regular file under the pre-v3 state root: its target-relative POSIX path and its bytes. */
export type LegacyFile = { readonly rel: string; readonly bytes: Uint8Array };

/** Everything the planner reads. It reads nothing else. */
export type MigrateInputs = {
  /** The migration date, YYYY-MM-DD, passed in (never a clock read), so a plan is byte-exact. */
  readonly date: string;
  /** Every regular file under the pre-v3 root, its rel target-relative and POSIX. */
  readonly legacy: readonly LegacyFile[];
  /** The progress file's bytes, or null when there is none. */
  readonly progress: Uint8Array | null;
  /** The kit seed of the NFR catalog. */
  readonly seedNfrCatalog: Uint8Array;
  /** The kit seed of the traceability index. */
  readonly seedTraceability: Uint8Array;
};

/** One file the plan writes: its final target-relative path, its whole bytes, and what it is. */
export type MigrateWrite = { readonly rel: string; readonly bytes: Uint8Array; readonly source: string };

/**
 * One unchanged rename into the pre-v3 archive. `from` is the path after the whole pre-v3 root is renamed to
 * STATE_ROOT_REL (D-17); `to` is the final target-relative path.
 */
export type ArchiveMove = { readonly from: string; readonly to: string };

/**
 * Where one original file's bytes live after the migrate: `identical` means the bytes at `at` equal the original;
 * `prefix` means they begin with it.
 */
export type OriginalHome = { readonly original: string; readonly at: string; readonly match: "identical" | "prefix" };

/**
 * One line migrate generated, by position: the one-based `line` of the written file `rel`. `boardLine` and `id`
 * are the template's parameters (null when the kind has none).
 */
export type GeneratedLine = {
  readonly rel: string;
  readonly line: number;
  readonly kind: GeneratedKind;
  readonly boardLine: number | null;
  readonly id: string | null;
};

/**
 * One cut row: board line `boardLine` of the pre-v3 board became the kept row at line `keptLine` of the planned
 * board and the trailer at line `noteLine` of `noteRel`. The proof rejoins the two.
 */
export type BoardCut = {
  readonly id: string;
  readonly boardLine: number;
  readonly keptLine: number;
  readonly noteRel: string;
  readonly noteLine: number;
};

/** A ticket write that is its original followed by appended sections. */
export type AppendedTicket = { readonly rel: string; readonly original: string };

/** One step of the plan, in the order a dry run lists them. `bytes` is the size moved, written or added. */
export type MigrateStep = {
  readonly verb: "move" | "archive" | "write" | "append";
  readonly from: string | null;
  readonly to: string;
  readonly bytes: number;
  readonly note: string;
};

/** The proof's verdict. Every reason names a file and a line, with user text passed through stripControlChars. */
export type ProofResult = { readonly ok: true } | { readonly ok: false; readonly reasons: readonly string[] };

/** The whole plan. A plan with a refusal has no writes, no moves and no steps. */
export type MigratePlan = {
  readonly refusals: readonly string[];
  readonly notes: readonly string[];
  readonly writes: readonly MigrateWrite[];
  readonly archiveMoves: readonly ArchiveMove[];
  readonly originals: readonly OriginalHome[];
  readonly generated: readonly GeneratedLine[];
  readonly cuts: readonly BoardCut[];
  readonly appended: readonly AppendedTicket[];
  readonly overBudget: readonly StateFinding[];
  readonly steps: readonly MigrateStep[];
  readonly proof: ProofResult;
};

/** What proveStateMigrate reads from a plan. */
export type ProvablePlan = Pick<MigratePlan, "originals" | "generated" | "cuts" | "appended">;

const LEGACY_PREFIX = `${LEGACY_STATE_ROOT_REL}/`;
const ENCODER = new TextEncoder();
/** The longest piece of user text a reason quotes. */
const REASON_QUOTE_CHARS = 120;

/** `rel` (a path under the pre-v3 root) after the whole root is renamed to STATE_ROOT_REL (D-17). */
export function movedRel(rel: string): string {
  if (!rel.startsWith(LEGACY_PREFIX)) throw new Error(`state-migrate: ${rel} is not under the pre-v3 state root`);
  return `${STATE_ROOT_REL}/${rel.slice(LEGACY_PREFIX.length)}`;
}

/**
 * Cut one raw board line (D-01). One trailing CR is set aside, the region's ROW reaches the remainder after the
 * identifier, and splitRow finds the trailer. When the row has no parenthetical, an unbalanced one, or nothing after
 * it, there is nothing to cut and the answer is null. Otherwise `kept` is the line minus the trailer's length, byte
 * for byte, with the CR re-attached, and `trailer` is the cut text, verbatim.
 */
export function cutRow(rawLine: string): { readonly kept: string; readonly trailer: string } | null {
  const cr = rawLine.endsWith("\r") ? "\r" : "";
  const line = cr === "" ? rawLine : rawLine.slice(0, -1);
  const m = ROW.exec(line);
  if (m === null) return null;
  const { meta, trailer } = splitRow(m[2] as string);
  if (meta === null || trailer === "") return null;
  return { kept: line.slice(0, line.length - trailer.length) + cr, trailer };
}

/** Code-unit order, never the host locale's. */
function byCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** UTF-8 text of `bytes`, a leading byte-order mark kept as content; an invalid sequence decodes to U+FFFD. */
function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
}

/** UTF-8 text of `bytes`, a leading byte-order mark kept as content, or null when `bytes` is not valid UTF-8. */
function strictText(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** `line` without one trailing CR. */
function withoutCr(line: string): string {
  return line.endsWith("\r") ? line.slice(0, -1) : line;
}

/** The lines of `text`, each without its LF or CRLF terminator. */
function linesOf(text: string): string[] {
  return text.split("\n").map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
}

/** A line that holds nothing but spaces and tabs. */
function isBlankLine(line: string): boolean {
  return /^[ \t]*$/.test(line);
}

/** `text` safe to print: control characters removed, at most REASON_QUOTE_CHARS code units. */
function shown(text: string): string {
  const clean = stripControlChars(text, false);
  return clean.length <= REASON_QUOTE_CHARS ? clean : `${clean.slice(0, REASON_QUOTE_CHARS)}…`;
}

/** The one-based line number of the first line appended after `original` (one terminator first when it lacks one). */
function firstAppendedLine(original: string): number {
  if (original.length === 0) return 1;
  const k = original.split("\n").length;
  return original.endsWith("\n") ? k : k + 1;
}

/** `a` followed by `b`. */
function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/** One ticket file directly under the pre-v3 tickets directory. */
type TicketFile = {
  readonly rel: string;
  readonly name: string;
  readonly id: string;
  readonly bytes: Uint8Array;
  readonly text: string;
  /** True when `bytes` is valid UTF-8 (`text` is then exact). */
  readonly utf8: boolean;
};

/** A refused plan: the refusals, and nothing to execute. */
function refusedPlan(refusals: readonly string[], notes: readonly string[]): MigratePlan {
  return {
    refusals,
    notes,
    writes: [],
    archiveMoves: [],
    originals: [],
    generated: [],
    cuts: [],
    appended: [],
    overBudget: [],
    steps: [],
    proof: { ok: false, reasons: ["the plan was refused, so there is nothing to prove"] },
  };
}

/**
 * Plan the board split (D-01 to D-04, D-17, D-21 option-a). Pure: every byte comes from `inputs`.
 *
 * Each ticket row parseBoard admits is cut by cutRow over its RAW line, and the kept row stays on the board. When
 * the row's ticket file exists, its trailer is appended to that ticket as a new `## Board notes` section after the
 * provenance line; two rows of one ticket give two sections, in board order (D-02). When it does not, the trailer
 * goes to PRE_V3_ORPHAN_NOTES_REL under one `## [ID]` heading per row, and no ticket is created (D-03). Every line
 * that begins `_Updated:` outside HTML comments goes, verbatim and in order, to PRE_V3_BOARD_UPDATES_REL, and the
 * board keeps none (D-04). A row whose line touches an HTML comment is not cut (moving a comment's opener off the
 * board would uncomment the lines after it), and the plan says so in `notes`. Ticket identity is the admitted `id`,
 * else the file stem, over the `.md` files directly under the tickets directory whose name does not begin with `.`.
 *
 * Refusals are collected, never thrown, and a refused plan has no writes: a board, or a ticket that would receive
 * an append, that is not valid UTF-8 or mixes LF and CRLF; two ticket files with one identity. overBudget lists every
 * budget the planned board and the planned tickets still break (D-01, D-07); it never stops the plan.
 */
export function planStateMigrate(inputs: MigrateInputs): MigratePlan {
  const refusals: string[] = [];
  const notes: string[] = [];
  const legacy = [...inputs.legacy].sort((a, b) => byCodeUnits(a.rel, b.rel));
  for (const f of legacy) {
    if (!f.rel.startsWith(LEGACY_PREFIX)) {
      refusals.push(`${shown(f.rel)} is not under the pre-v3 state root ${LEGACY_PREFIX}, so the migrate was not planned`);
    }
  }
  const boardFile = legacy.find((f) => f.rel === LEGACY_BOARD_REL);
  if (boardFile === undefined) {
    refusals.push(`the pre-v3 board ${LEGACY_BOARD_REL} is not among the files read, so there is no board to split`);
  }
  if (refusals.length > 0 || boardFile === undefined) return refusedPlan(refusals, notes);

  const boardText = strictText(boardFile.bytes);
  if (boardText === null) {
    return refusedPlan([`${LEGACY_BOARD_REL} is not valid UTF-8, so it was not split; save it as UTF-8 first`], notes);
  }
  if (lineEndings(boardText) === "mixed") {
    return refusedPlan(
      [`${LEGACY_BOARD_REL} mixes LF and CRLF line endings, so it was not split; give it one line ending first`],
      notes,
    );
  }
  const boardEol = lineEndings(boardText) === "crlf" ? "\r\n" : "\n";
  const rawLines = boardText.split("\n");
  const normalized = normalizeDocument(boardText);
  const normalizedLines = normalized.split("\n");
  const blankedLines = stripHtmlComments(normalized).split("\n");
  const model = parseBoard(boardText);
  const rows = model.columns.flatMap((c) => c.rows).sort((a, b) => a.line - b.line);

  // The tickets, by identity; two files with one identity are refused, every file named.
  const byId = new Map<string, TicketFile[]>();
  for (const f of legacy) {
    const moved = movedRel(f.rel);
    if (!moved.startsWith(`${TICKETS_REL}/`)) continue;
    const name = moved.slice(TICKETS_REL.length + 1);
    if (name.includes("/") || name.startsWith(".") || !name.endsWith(".md")) continue;
    const strict = strictText(f.bytes);
    const text = strict ?? decodeText(f.bytes);
    const admitted = parseTicketDocument(text);
    const declared = admitted.ok ? admitted.value.id : null;
    const id = declared !== null && declared !== "" ? declared : ticketStem(name);
    byId.set(id, [...(byId.get(id) ?? []), { rel: f.rel, name, id, bytes: f.bytes, text, utf8: strict !== null }]);
  }
  const tickets = new Map<string, TicketFile>();
  for (const [id, files] of byId) {
    if (files.length > 1) {
      refusals.push(
        `the ticket identity ${shown(id)} is declared by ${files.length} files (${files.map((t) => shown(t.rel)).join(", ")}), ` +
          "so which one receives its Board notes is a guess; give each ticket one file",
      );
    }
    tickets.set(id, files[0] as TicketFile);
  }

  // The update lines (D-04): the lines of the comment-blanked text that begin `_Updated:`, as the budget rule finds them.
  const updateAt = new Set<number>();
  blankedLines.forEach((l, i) => {
    if (l.startsWith(UPDATED_PREFIX)) updateAt.add(i);
  });

  // The cuts, in board order.
  const boardOut = [...rawLines];
  const sections = new Map<string, { readonly boardLine: number; readonly trailer: string }[]>();
  const orphans: { readonly id: string; readonly boardLine: number; readonly trailer: string }[] = [];
  for (const row of rows) {
    const i = row.line - 1;
    const raw = rawLines[i] as string;
    if (blankedLines[i] !== normalizedLines[i]) {
      notes.push(
        `line ${row.line} of ${LEGACY_BOARD_REL} (${shown(row.id)}) touches an HTML comment, so its trailer was not cut`,
      );
      continue;
    }
    const bom = i === 0 && raw.startsWith("﻿") ? "﻿" : "";
    const cut = cutRow(raw.slice(bom.length));
    if (cut === null) continue;
    boardOut[i] = bom + cut.kept;
    if (tickets.has(row.id)) {
      sections.set(row.id, [...(sections.get(row.id) ?? []), { boardLine: row.line, trailer: cut.trailer }]);
    } else {
      orphans.push({ id: row.id, boardLine: row.line, trailer: cut.trailer });
      notes.push(
        `the row of ${shown(row.id)} at line ${row.line} of ${LEGACY_BOARD_REL} has no ticket file, so its trailer goes ` +
          `to ${PRE_V3_ORPHAN_NOTES_REL} and no ticket is created`,
      );
    }
  }

  // Every ticket that receives an append must be UTF-8 with one line ending.
  for (const id of sections.keys()) {
    const t = tickets.get(id) as TicketFile;
    if (!t.utf8) {
      refusals.push(`${shown(t.rel)} is not valid UTF-8, so its Board notes could not be appended; save it as UTF-8 first`);
    } else if (lineEndings(t.text) === "mixed") {
      refusals.push(
        `${shown(t.rel)} mixes LF and CRLF line endings, so its Board notes could not be appended; give it one line ending first`,
      );
    }
  }
  if (refusals.length > 0) return refusedPlan(refusals, notes);

  // The planned board: the kept rows, without the update lines. keptAt maps an original line index to its new line.
  const keptAt = new Map<number, number>();
  const boardLines: string[] = [];
  boardOut.forEach((l, i) => {
    if (updateAt.has(i)) return;
    boardLines.push(l);
    keptAt.set(i, boardLines.length);
  });
  const plannedBoard = boardLines.join("\n");

  const generated: GeneratedLine[] = [];
  const cuts: BoardCut[] = [];
  const ticketWrites: MigrateWrite[] = [];
  const appended: AppendedTicket[] = [];
  const ticketMoves: ArchiveMove[] = [];
  const appendSteps: MigrateStep[] = [];
  const archivedAt = new Map<string, string>();
  for (const [id, list] of sections) {
    const t = tickets.get(id) as TicketFile;
    const rel = movedRel(t.rel);
    const eol = lineEndings(t.text) === "crlf" ? "\r\n" : "\n";
    const parts: string[] = [t.text.length > 0 && !t.text.endsWith("\n") ? eol : ""];
    let next = firstAppendedLine(t.text);
    for (const s of list) {
      parts.push(eol, BOARD_NOTES_HEADING, eol, eol, provenanceLine(s.boardLine, inputs.date), eol, eol, s.trailer, eol);
      generated.push({ rel, line: next + 1, kind: "board-notes-heading", boardLine: s.boardLine, id });
      generated.push({ rel, line: next + 3, kind: "provenance", boardLine: s.boardLine, id });
      cuts.push({ id, boardLine: s.boardLine, keptLine: keptAt.get(s.boardLine - 1) as number, noteRel: rel, noteLine: next + 5 });
      next += 6;
    }
    const added = ENCODER.encode(parts.join(""));
    ticketWrites.push({
      rel,
      bytes: concatBytes(t.bytes, added),
      source: `the ticket ${shown(id)} followed by ${list.length} Board notes section(s) from the pre-v3 board`,
    });
    appended.push({ rel, original: t.rel });
    const archived = `${PRE_V3_TICKETS_REL}/${t.name}`;
    ticketMoves.push({ from: rel, to: archived });
    archivedAt.set(t.rel, archived);
    appendSteps.push({
      verb: "append",
      from: null,
      to: rel,
      bytes: added.length,
      note: `${list.length} Board notes section(s) appended to the ticket ${shown(id)}`,
    });
  }

  // The two archive-only outputs (D-03, D-04), each planned only when it has something to hold.
  const extraWrites: MigrateWrite[] = [];
  if (updateAt.size > 0) {
    const lines = [BOARD_UPDATES_TITLE, "", provenanceLine(null, inputs.date), ""];
    generated.push({ rel: PRE_V3_BOARD_UPDATES_REL, line: 1, kind: "updates-title", boardLine: null, id: null });
    generated.push({ rel: PRE_V3_BOARD_UPDATES_REL, line: 3, kind: "provenance", boardLine: null, id: null });
    for (const i of [...updateAt].sort((a, b) => a - b)) lines.push(withoutCr(rawLines[i] as string));
    extraWrites.push({
      rel: PRE_V3_BOARD_UPDATES_REL,
      bytes: ENCODER.encode(lines.join(boardEol) + boardEol),
      source: `the ${updateAt.size} \`_Updated:\` line(s) of the pre-v3 board, verbatim and in order`,
    });
  }
  if (orphans.length > 0) {
    const lines = [ORPHAN_NOTES_TITLE, "", provenanceLine(null, inputs.date), ""];
    generated.push({ rel: PRE_V3_ORPHAN_NOTES_REL, line: 1, kind: "orphan-title", boardLine: null, id: null });
    generated.push({ rel: PRE_V3_ORPHAN_NOTES_REL, line: 3, kind: "provenance", boardLine: null, id: null });
    orphans.forEach((o, k) => {
      if (k > 0) lines.push("");
      lines.push(`## [${o.id}]`);
      generated.push({ rel: PRE_V3_ORPHAN_NOTES_REL, line: lines.length, kind: "orphan-heading", boardLine: null, id: o.id });
      lines.push("", provenanceLine(o.boardLine, inputs.date));
      generated.push({ rel: PRE_V3_ORPHAN_NOTES_REL, line: lines.length, kind: "provenance", boardLine: o.boardLine, id: o.id });
      lines.push("", o.trailer);
      cuts.push({
        id: o.id,
        boardLine: o.boardLine,
        keptLine: keptAt.get(o.boardLine - 1) as number,
        noteRel: PRE_V3_ORPHAN_NOTES_REL,
        noteLine: lines.length,
      });
    });
    extraWrites.push({
      rel: PRE_V3_ORPHAN_NOTES_REL,
      bytes: ENCODER.encode(lines.join(boardEol) + boardEol),
      source: `the trailers of ${orphans.length} board row(s) whose ticket file is absent, verbatim`,
    });
  }

  cuts.sort((a, b) => a.boardLine - b.boardLine);
  ticketWrites.sort((a, b) => byCodeUnits(a.rel, b.rel));
  appended.sort((a, b) => byCodeUnits(a.rel, b.rel));
  ticketMoves.sort((a, b) => byCodeUnits(a.from, b.from));
  appendSteps.sort((a, b) => byCodeUnits(a.to, b.to));
  generated.sort((a, b) => byCodeUnits(a.rel, b.rel) || a.line - b.line);

  const boardBytes = ENCODER.encode(plannedBoard);
  const writes: MigrateWrite[] = [
    { rel: BOARD_REL, bytes: boardBytes, source: "the pre-v3 board without its trailers and its `_Updated:` lines" },
    ...ticketWrites,
    ...extraWrites,
  ];
  const archiveMoves: ArchiveMove[] = [{ from: BOARD_REL, to: PRE_V3_BOARD_REL }, ...ticketMoves];
  archivedAt.set(LEGACY_BOARD_REL, PRE_V3_BOARD_REL);
  const originals: OriginalHome[] = legacy.map((f) => ({
    original: f.rel,
    at: archivedAt.get(f.rel) ?? movedRel(f.rel),
    match: "identical" as const,
  }));
  const sizeOf = new Map(legacy.map((f) => [movedRel(f.rel), f.bytes.length] as const));
  const steps: MigrateStep[] = [
    ...legacy.map((f) => ({
      verb: "move" as const,
      from: f.rel,
      to: movedRel(f.rel),
      bytes: f.bytes.length,
      note: "renamed with the pre-v3 root, unchanged",
    })),
    ...archiveMoves.map((m) => ({
      verb: "archive" as const,
      from: m.from,
      to: m.to,
      bytes: sizeOf.get(m.from) ?? 0,
      note: "the original, renamed unchanged into the pre-v3 archive",
    })),
    {
      verb: "write",
      from: null,
      to: BOARD_REL,
      bytes: boardBytes.length,
      note: `${cuts.length} trailer(s) cut and ${updateAt.size} \`_Updated:\` line(s) moved`,
    },
    ...appendSteps,
    ...extraWrites.map((w) => ({ verb: "write" as const, from: null, to: w.rel, bytes: w.bytes.length, note: w.source })),
  ];

  const provable: ProvablePlan = { originals, generated, cuts, appended };
  const written = new Map(writes.map((w) => [w.rel, w.bytes] as const));
  return {
    refusals,
    notes,
    writes,
    archiveMoves,
    originals,
    generated,
    cuts,
    appended,
    overBudget: plannedBudgetFindings(plannedBoard, legacy, ticketWrites),
    steps,
    proof: proveStateMigrate(inputs, provable, written),
  };
}

/**
 * Every budget the planned state still breaks (D-01, D-07), through the embedded rules: the planned board's bytes,
 * each ticket row over BUDGETS.boardRowChars (named by its ID), its `_Updated:` lines, and each ticket record directly
 * under the tickets directory over BUDGETS.ticketBytes, appended or moved unchanged. Sorted with sortFindings.
 */
function plannedBudgetFindings(
  plannedBoard: string,
  legacy: readonly LegacyFile[],
  ticketWrites: readonly MigrateWrite[],
): StateFinding[] {
  const normalizedBoard = normalizeDocument(plannedBoard);
  const model = parseBoard(plannedBoard);
  const idAt = new Map(model.columns.flatMap((c) => c.rows).map((r) => [r.line, r.id] as const));
  const findings: StateFinding[] = boardBudgetFindings(
    BOARD_REL,
    { raw: plannedBoard, normalized: normalizedBoard, blanked: stripHtmlComments(normalizedBoard) },
    model,
    BUDGETS,
  ).map((f) => {
    const id = f.key === "boardRowChars" && f.line !== undefined ? idAt.get(f.line) : undefined;
    return id === undefined ? f : { ...f, note: `the row of ${shown(id)}, after its trailer was cut` };
  });
  const planned = new Map(ticketWrites.map((w) => [w.rel, w.bytes.length] as const));
  const sizes = new Map<string, number>();
  for (const f of legacy) {
    const moved = movedRel(f.rel);
    if (!moved.startsWith(`${TICKETS_REL}/`) || moved.slice(TICKETS_REL.length + 1).includes("/")) continue;
    sizes.set(moved.slice(TICKETS_REL.length + 1), planned.get(moved) ?? f.bytes.length);
  }
  for (const name of budgetEntryNames([...sizes.keys()])) {
    const finding = fileBytesFinding(`${TICKETS_REL}/${name}`, sizes.get(name) as number, "ticketBytes", BUDGETS);
    if (finding !== null) findings.push(finding);
  }
  return sortFindings(findings);
}

/** The template a generated line of `g`'s kind must equal, or null for a kind outside the closed set. */
function generatedTemplate(g: GeneratedLine, date: string): string | null {
  switch (g.kind) {
    case "board-notes-heading":
      return BOARD_NOTES_HEADING;
    case "provenance":
      return provenanceLine(g.boardLine, date);
    case "updates-title":
      return BOARD_UPDATES_TITLE;
    case "orphan-title":
      return ORPHAN_NOTES_TITLE;
    case "orphan-heading":
      return g.id === null ? null : `## [${g.id}]`;
    default:
      return null;
  }
}

/** One output part the proof reads: a written file's lines, from line `first` (one-based) to its end. */
type ProofPart = { readonly rel: string; readonly lines: readonly string[]; readonly first: number };

/**
 * The D-09 stage-A proof. The originals are the non-blank lines of the pre-v3 board (a line is its text without
 * the LF or CRLF terminator). The outputs are the written board, the updates file, the orphan notes file and the
 * appended part of every appended ticket,
 * after the generated lines are removed BY POSITION (each must equal its kind's template) and each cut is rejoined
 * (the kept row plus its trailer must equal its original line). The two multisets must then be equal. Each
 * appended ticket must also begin with its original bytes, and every original home that `written` holds must
 * match its rule. `written` is a parameter, so the proof runs over the plan's own writes or over bytes re-read
 * from disk.
 */
export function proveStateMigrate(
  inputs: MigrateInputs,
  plan: ProvablePlan,
  written: ReadonlyMap<string, Uint8Array>,
): ProofResult {
  const reasons: string[] = [];
  const boardFile = inputs.legacy.find((f) => f.rel === LEGACY_BOARD_REL);
  if (boardFile === undefined) return { ok: false, reasons: [`the pre-v3 board ${LEGACY_BOARD_REL} is not among the inputs`] };
  const originalLines = linesOf(decodeText(boardFile.bytes));

  const parts = new Map<string, ProofPart>();
  const board = written.get(BOARD_REL);
  if (board === undefined) reasons.push(`${BOARD_REL} is not among the written files, so the board split cannot be proven`);
  else parts.set(BOARD_REL, { rel: BOARD_REL, lines: linesOf(decodeText(board)), first: 1 });
  for (const rel of [PRE_V3_BOARD_UPDATES_REL, PRE_V3_ORPHAN_NOTES_REL]) {
    const bytes = written.get(rel);
    if (bytes !== undefined) parts.set(rel, { rel, lines: linesOf(decodeText(bytes)), first: 1 });
  }

  for (const a of plan.appended) {
    const bytes = written.get(a.rel);
    const original = inputs.legacy.find((f) => f.rel === a.original);
    if (bytes === undefined || original === undefined) {
      reasons.push(`${shown(a.rel)} is declared appended to ${shown(a.original)}, and one of the two is missing`);
      continue;
    }
    const at = prefixMismatch(original.bytes, bytes);
    if (at !== null) {
      reasons.push(`${shown(a.rel)} does not begin with the bytes of its original ${shown(a.original)} (they differ at byte ${at})`);
      continue;
    }
    parts.set(a.rel, { rel: a.rel, lines: linesOf(decodeText(bytes)), first: firstAppendedLine(decodeText(original.bytes)) });
  }

  const consumed = new Set<string>();
  const key = (rel: string, line: number): string => `${rel}\u0000${line}`;
  const lineAt = (rel: string, line: number): string | null => {
    const part = parts.get(rel);
    if (part === undefined || !Number.isInteger(line) || line < part.first || line > part.lines.length) return null;
    return part.lines[line - 1] as string;
  };

  for (const g of plan.generated) {
    const text = lineAt(g.rel, g.line);
    if (text === null) {
      reasons.push(`line ${g.line} of ${shown(g.rel)} is declared generated (${shown(g.kind)}) and is not a line migrate wrote`);
      continue;
    }
    const template = generatedTemplate(g, inputs.date);
    if (template === null || text !== template) {
      reasons.push(`line ${g.line} of ${shown(g.rel)} is declared generated (${shown(g.kind)}) and reads "${shown(text)}", not its template`);
      continue;
    }
    if (consumed.has(key(g.rel, g.line))) {
      reasons.push(`line ${g.line} of ${shown(g.rel)} is declared generated twice`);
      continue;
    }
    consumed.add(key(g.rel, g.line));
  }

  const joined: { readonly text: string; readonly rel: string; readonly line: number }[] = [];
  for (const c of plan.cuts) {
    const kept = lineAt(BOARD_REL, c.keptLine);
    const trailer = lineAt(c.noteRel, c.noteLine);
    const original = originalLines[c.boardLine - 1];
    const where =
      `the kept row at line ${c.keptLine} of ${BOARD_REL} and its trailer at line ${c.noteLine} of ` +
      `${shown(c.noteRel)} (${shown(c.id)})`;
    if (kept === null || trailer === null || consumed.has(key(BOARD_REL, c.keptLine)) || consumed.has(key(c.noteRel, c.noteLine))) {
      reasons.push(`${where} are not two lines migrate wrote`);
      continue;
    }
    if (original === undefined || kept + trailer !== original) {
      reasons.push(`${where} do not rejoin line ${c.boardLine} of the pre-v3 board ${LEGACY_BOARD_REL}`);
      continue;
    }
    consumed.add(key(BOARD_REL, c.keptLine));
    consumed.add(key(c.noteRel, c.noteLine));
    joined.push({ text: kept + trailer, rel: BOARD_REL, line: c.keptLine });
  }

  // The two multisets.
  const tally = new Map<string, { orig: number[]; out: { rel: string; line: number }[] }>();
  const entry = (text: string): { orig: number[]; out: { rel: string; line: number }[] } => {
    let e = tally.get(text);
    if (e === undefined) {
      e = { orig: [], out: [] };
      tally.set(text, e);
    }
    return e;
  };
  originalLines.forEach((l, i) => {
    if (!isBlankLine(l)) entry(l).orig.push(i + 1);
  });
  for (const part of parts.values()) {
    for (let n = part.first; n <= part.lines.length; n++) {
      const l = part.lines[n - 1] as string;
      if (consumed.has(key(part.rel, n)) || isBlankLine(l)) continue;
      entry(l).out.push({ rel: part.rel, line: n });
    }
  }
  for (const j of joined) entry(j.text).out.push({ rel: j.rel, line: j.line });
  for (const [text, e] of tally) {
    for (const n of e.orig.slice(e.out.length)) {
      reasons.push(`line ${n} of the pre-v3 board ${LEGACY_BOARD_REL} is in no split output: "${shown(text)}"`);
    }
    for (const o of e.out.slice(e.orig.length)) {
      reasons.push(`line ${o.line} of ${shown(o.rel)} is not a line of the pre-v3 board ${LEGACY_BOARD_REL}: "${shown(text)}"`);
    }
  }

  // Every original home the written files hold.
  for (const h of plan.originals) {
    const bytes = written.get(h.at);
    if (bytes === undefined) continue;
    const original = inputs.legacy.find((f) => f.rel === h.original);
    if (original === undefined) {
      reasons.push(`${shown(h.original)} is declared an original and is not among the inputs`);
      continue;
    }
    const at = prefixMismatch(original.bytes, bytes);
    if (at !== null || (h.match === "identical" && bytes.length !== original.bytes.length)) {
      reasons.push(`${shown(h.at)} is not ${h.match === "identical" ? "identical to" : "prefixed by"} its original ${shown(h.original)}`);
    }
  }

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}

/** The first byte offset where `bytes` stops beginning with `prefix`, or null when it begins with all of it. */
function prefixMismatch(prefix: Uint8Array, bytes: Uint8Array): number | null {
  for (let i = 0; i < prefix.length; i++) if (bytes[i] !== prefix[i]) return i;
  return null;
}

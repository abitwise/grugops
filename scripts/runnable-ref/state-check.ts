// state-check.ts — the read-only host state checker (phase 37, plan 37-03, SPLIT-05).
//
// WHAT IT IS. A kit-shipped runnable in the shape of reference-check.ts: authored here, compiled to a committed
// state-check.js, and run on a host as `node state-check.js <repo-root>` with only Node present. It measures
// the per-repo state against the budgets and reports each broken one. Plan 37-03 measures the board; plan 37-04
// adds every other budget, `--json` and output sanitization.
//
// THE D-12 CONTRACT.
//   exit 0 → no enforced finding: none at all, or only warnings because the layout marker is not valid
//   exit 1 → the layout marker is valid and at least one finding exists (the gate blocks)
//   exit 2 → the check could not run: no root argument, a root that is not a readable directory, or a required
//            file that is present and cannot be read. Exit 2 is never a pass, and it prints no pass line.
//
// THE MARKER DECIDES SEVERITY (D-04, D-05, D-14). With a valid marker every finding prints as `FINDING` and
// fails. With no marker, or an unrecognized one, every finding prints as `WARN` and the exit code is 0; an
// unrecognized marker is itself a warning that names it.
//
// BUILTINS ONLY. A host runs this file with no kit and no node_modules, so it imports `node:` builtins and
// nothing else. The hand-written part below imports them as namespaces, so the names the generated region
// imports never collide with its own.
//
// NOTHING HERE IS RETYPED. Every budget number, state path and rule this file uses sits in the generated
// region, copied verbatim from its authority by scripts/generate-runnable-embeds.ts: BUDGETS and the two paths
// from install/state-layout.ts, the budget and marker rules from scripts/state-rules.ts, the board grammar from
// scripts/board-model.ts and the non-blocking reader from scripts/context-io.ts. scripts/runnable-embeds-
// freshness.ts fails CI when the region differs from a fresh derivation.
//
// READ-ONLY. It opens no file for writing. A path that is present but not a regular file is refused by its
// stat, before any open, and the read itself goes through the embedded non-blocking reader, so a FIFO or a
// device at a state path cannot hang it.
//
// Voice: clear professional voice (CLAUDE.md hard rule): this is a quality surface a human acts on.

import * as nodeFs from "node:fs";
import * as nodePath from "node:path";

// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
import { closeSync, constants as fsConstants, fstatSync, openSync, readSync } from "node:fs";
// from install/state-layout.ts
export const STATE_ROOT_REL = "memory-bank/plans";
export const BOARD_REL = `${STATE_ROOT_REL}/board.md`;
export const LAYOUT_MARKER_REL = `${STATE_ROOT_REL}/.layout`;
export const LAYOUT_MARKER_CONTENT = "layout: v3";
export const BUDGETS = Object.freeze({
  /** UTF-8 bytes of the board file (24 KiB). */
  boardBytes: 24_576,
  /** UTF-16 code units of each ticket-row line of the board. */
  boardRowChars: 160,
  /** Board lines that begin `_Updated:`, outside HTML comments. */
  boardUpdatedLines: 1,
  /** UTF-8 bytes of each line of the trace index and the NFR catalog, outside HTML comments. */
  indexEntryBytes: 200,
  /** UTF-8 bytes of each ticket `.md` file (64 KiB). */
  ticketBytes: 65_536,
  /** UTF-8 bytes of each NFR `.md` file (8 KiB). */
  nfrBytes: 8_192,
  /** UTF-8 bytes of each trace `.md` file (8 KiB). */
  traceBytes: 8_192,
  /** UTF-8 bytes of the progress file (16 KiB). */
  progressBytes: 16_384,
  /** Rows the Done column keeps; older rows move to the Done archive. */
  doneRows: 20,
} as const);
// from scripts/state-rules.ts
export type StateUnit = "bytes" | "characters" | "lines" | "rows";
export type StateFinding = {
  readonly rel: string;
  readonly key: string;
  readonly measured: number | null;
  readonly budget: number;
  readonly unit: StateUnit;
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
export function formatMarkerWarning(rel: string, reason: string): string {
  return `${rel}: layout marker not recognized: ${reason}. Budget findings stay warnings.`;
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
export function unmeasuredFinding(
  rel: string,
  key: keyof StateBudgets,
  budgets: StateBudgets,
  note: string,
): StateFinding {
  return { rel, key, measured: null, budget: budgets[key], unit: UNITS[key], note };
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
function grouped(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
export function formatFinding(f: StateFinding): string {
  const where = f.line === undefined ? f.rel : `${f.rel}:${f.line}`;
  const measured = f.measured === null ? "not measured" : `${grouped(f.measured)} ${f.unit}`;
  const note = f.note === undefined ? "" : ` — ${f.note}`;
  return `${where}: ${measured}, budget ${grouped(f.budget)} ${f.unit} (BUDGETS.${f.key})${note}`;
}
function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
export function sortFindings(list: readonly StateFinding[]): StateFinding[] {
  return [...list].sort(
    (a, b) =>
      compareCodeUnits(a.rel, b.rel) ||
      compareCodeUnits(a.key, b.key) ||
      (a.line ?? 0) - (b.line ?? 0),
  );
}
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
  if (!TICKET_ID.test(id)) return null;
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
// from scripts/context-io.ts
export const CANONICAL_READ_POSITION = "absent, or a regular file";
export const READ_POSITION_CONDITIONS = ["unopenable", "not-a-regular-file", "above-ceiling"] as const;
export type ReadPositionCondition = (typeof READ_POSITION_CONDITIONS)[number];
export class ReadPositionRefusal extends Error {
  readonly condition: ReadPositionCondition;
  constructor(condition: ReadPositionCondition, message: string) {
    super(message);
    this.name = "ReadPositionRefusal";
    this.condition = condition;
  }
}
export function readRegularFileOrNull(
  path: string,
  maxBytes: number,
  position: string,
): string | null {
  let fd: number;
  try {
    fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null; // genuinely nothing here
    // Present and unopenable — EACCES, ELOOP, ENXIO (a socket), a dangling symlink's own ENOENT on
    // the TARGET is reported as ENOENT by open(2) and is therefore correctly "nothing here". Fail
    // closed, naming the position rather than surfacing a bare errno the caller cannot place.
    throw new ReadPositionRefusal(
      "unopenable",
      `context-io: the ${position} "${path}" IS present and could not be opened (${code ?? "unknown"}) ` +
        `— it is refused rather than read. The canonical form for this position is ` +
        `${CANONICAL_READ_POSITION}.`,
    );
  }
  try {
    const st = fstatSync(fd);
    // TWO CONDITIONS, TWO NAMES (31-29, CR-19). The shape branch and the ceiling branch used to be
    // reported to callers as one undifferentiated failure, so `writeNoteFile` published its SHAPE
    // clause — "is not absent, or a regular file" — for a 9,437,353-byte REGULAR file. Each branch
    // now carries the condition it actually met, and each caller names its own clause from it.
    if (!st.isFile()) {
      throw new ReadPositionRefusal(
        "not-a-regular-file",
        `context-io: the ${position} "${path}" is not a regular file — it is refused rather than ` +
          `read, because reading a FIFO, a device, a socket or a directory can block forever and a ` +
          `program that never answers refuses nothing. The canonical form for this position is ` +
          `${CANONICAL_READ_POSITION}.`,
      );
    }
    if (st.size > maxBytes) {
      throw new ReadPositionRefusal(
        "above-ceiling",
        `context-io: the ${position} "${path}" is ${st.size} bytes, above the ${maxBytes}-byte ` +
          `ceiling — refused rather than read. It IS a regular file; what disqualifies it is its ` +
          `size and nothing else.`,
      );
    }
    // The read is bounded by the size fstat just reported on this same descriptor.
    const buf = Buffer.allocUnsafe(Number(st.size));
    let off = 0;
    while (off < buf.length) {
      const n = readSync(fd, buf, off, buf.length - off, off);
      if (n === 0) break;
      off += n;
    }
    return buf.subarray(0, off).toString("utf8");
  } finally {
    closeSync(fd);
  }
}
// </runnable-embeds>

// ── The hand-written part: argv, the reads, the routing and the exit code ─────────────────────────────

/**
 * The largest state file this checker reads, in bytes. This is a reader ceiling, not a budget: a state file
 * larger than this is refused rather than read, and the check reports that it could not run (exit 2).
 */
const READ_CEILING_BYTES = 16 * 1024 * 1024;

const USAGE = "Usage: node state-check.js <repo-root>";

/** The check could not run: one message on stderr, nothing on stdout, exit 2. Never a pass. */
function couldNotRun(message: string): never {
  process.stderr.write(`Error: ${message} The state check did not run.\n`);
  process.exit(2);
}

/** The errno code of a thrown filesystem error, for a message. */
function codeOf(e: unknown): string {
  return (e as NodeJS.ErrnoException).code ?? "unknown error";
}

/**
 * The text of the state file at `rel` under `root`, or null when nothing is there.
 *
 * The path is stat'ed first, so a path that is present and is not a regular file (a FIFO, a device, a socket,
 * a directory) is refused without being opened. The read goes through the embedded non-blocking reader, which
 * checks the shape again on the open descriptor. A file that is present and cannot be read is never treated
 * as absent: it is exit 2, naming the file.
 */
function readState(root: string, rel: string, what: string): string | null {
  const abs = nodePath.join(root, ...rel.split("/"));
  let st: nodeFs.Stats | undefined;
  try {
    st = nodeFs.statSync(abs, { throwIfNoEntry: false });
  } catch (e) {
    couldNotRun(`cannot inspect the ${what} ${rel} (${codeOf(e)}).`);
  }
  if (st === undefined) return null;
  if (!st.isFile()) couldNotRun(`the ${what} ${rel} is present and is not a regular file, so it was not opened.`);
  try {
    return readRegularFileOrNull(abs, READ_CEILING_BYTES, what);
  } catch (e) {
    const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
    couldNotRun(`the ${what} ${rel} is present and cannot be read (${condition}).`);
  }
}

const rootArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (rootArg === undefined) couldNotRun(`no repository root was given. ${USAGE}.`);

let root: string;
try {
  root = nodeFs.realpathSync(rootArg);
} catch (e) {
  couldNotRun(`the repository root ${rootArg} cannot be resolved (${codeOf(e)}). ${USAGE}.`);
}
try {
  if (!nodeFs.statSync(root).isDirectory()) couldNotRun(`the repository root ${rootArg} is not a directory. ${USAGE}.`);
  nodeFs.accessSync(root, nodeFs.constants.R_OK | nodeFs.constants.X_OK);
} catch (e) {
  couldNotRun(`the repository root ${rootArg} is not a readable directory (${codeOf(e)}).`);
}

let marker: MarkerState;
let findings: StateFinding[];
try {
  marker = markerState(readState(root, LAYOUT_MARKER_REL, "layout marker"), LAYOUT_MARKER_CONTENT);
  const board = readState(root, BOARD_REL, "board file");
  if (board === null) {
    findings = [unmeasuredFinding(BOARD_REL, "boardBytes", BUDGETS, "the board file is absent")];
  } else {
    const normalized = normalizeDocument(board);
    const texts = { raw: board, normalized, blanked: stripHtmlComments(normalized) };
    findings = sortFindings(boardBudgetFindings(BOARD_REL, texts, parseBoard(board), BUDGETS));
  }
} catch (e) {
  couldNotRun(`the check failed unexpectedly: ${(e as Error).message}`);
}

// Every line is composed before anything is printed, so a run that cannot finish never prints part of a result.
const out: string[] = [];
if (marker.state === "valid") {
  for (const f of findings) out.push(`FINDING  ${formatFinding(f)}`);
  if (findings.length === 0) out.push("No findings.");
  process.exitCode = findings.length > 0 ? 1 : 0;
} else {
  if (marker.state === "invalid") out.push(`WARN     ${formatMarkerWarning(LAYOUT_MARKER_REL, marker.reason)}`);
  for (const f of findings) out.push(`WARN     ${formatFinding(f)}`);
  if (marker.state === "absent" && findings.length > 0) {
    out.push(
      `LAYOUT   no layout marker at ${LAYOUT_MARKER_REL}: budget findings are warnings until the repository is ` +
        "migrated to the v3 layout",
    );
  }
  if (marker.state === "absent" && findings.length === 0) out.push("No findings.");
  process.exitCode = 0;
}
process.stdout.write(`${out.join("\n")}\n`);

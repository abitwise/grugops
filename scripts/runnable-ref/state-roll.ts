// state-roll.ts — the host state roll (phase 37, plan 37-10, SPLIT-06, SPLIT-01, D-07, D-08).
//
// WHAT IT IS. A kit-shipped runnable in the shape of state-check.ts and trace-render.ts: authored here, compiled
// to a committed state-roll.js, and run on a host as `node state-roll.js <repo-root> [--dry-run]` with only Node
// present. It keeps the board's Done column inside BUDGETS.doneRows rows: the first BUDGETS.doneRows rows stay
// (the contract writes Done newest first), and every later row moves, whole, verbatim and in board order, to the
// top of the Done column of memory-bank/plans/archive/board-done.md. The archive is created with its one
// `## Done (WIP unlimited)` heading when it is absent. Plan 37-11 adds the progress roll (D-09), the duplicate
// refusal, the dry-run PLAN lines and the re-run after an interrupted roll.
//
// THE D-12 CONTRACT.
//   exit 0 → the rows were moved and the move was proven, or there was nothing to roll. `--dry-run` writes
//            nothing and exits 0 when a roll could run.
//   exit 1 → the roll was written, the line-conservation proof failed (or a write failed part way), and both
//            files were written back to their old bytes; an archive this run created was removed.
//   exit 2 → the roll could not run or was refused: a bad argument, a root that is not a readable (and, to
//            write, writable) directory, a path that resolves outside the repository root, a missing board, a
//            symbolic link, FIFO or directory where the board or the archive should be, a file the reader
//            refuses or that holds bytes a text write would not keep, a board or archive the planners refuse,
//            a file that changed after it was read, or a rollback that could not be completed. Exit 2 is never
//            a pass: it prints nothing on stdout.
//
// THE PROOF (D-08). The rules are scripts/state-rules.ts's planDoneRoll, planArchiveInsert, assembleRoll,
// checkConservation and executeRoll, embedded below. executeRoll writes the archive first and the board second,
// re-reads both and proves that the board equals its old lines with exactly the moved lines removed and the
// archive equals its old lines with exactly the moved block inserted. On a mismatch it writes both files back.
// Lines are removed from the text as read, so a CRLF board keeps CRLF and a byte-order mark stays in place.
//
// THE ROOT IS A BOUNDARY. Every path is resolved with realpath before it is used, and one that resolves outside
// realpath(root) is refused by name. The board and the archive are lstat'ed before they are opened, so a FIFO is
// never opened and a symbolic link is never replaced by a file. The archive directory is created only when it is
// absent and a roll is to be written, after its parent's realpath is confirmed inside the root.
//
// EVERY WRITE IS ATOMIC. Each file goes through the embedded atomicWrite (a temp sibling, then a rename), so an
// interrupted roll leaves each file either its old or its new bytes.
//
// OUTPUT IS SANITIZED. Every value read from the repository (an identifier, a path, a reason) has each C0, C1 and
// DEL code point removed by the embedded stripControlChars before it is printed.
//
// BUILTINS ONLY. A host runs this file with no kit and no node_modules, so it imports `node:` builtins and nothing
// else. The hand-written part below imports them as namespaces, so the names the generated region imports never
// collide with its own.
//
// NOTHING HERE IS RETYPED. The state paths, BUDGETS, the roll rules, the board grammar, the reader and the writer
// sit in the generated region, copied verbatim from install/state-layout.ts, scripts/state-rules.ts,
// scripts/board-model.ts and scripts/context-io.ts by scripts/generate-runnable-embeds.ts.
// scripts/runnable-embeds-freshness.ts fails CI when the region differs from a fresh derivation.
//
// Voice: clear professional voice (CLAUDE.md hard rule): this file moves state a human audits.

import * as nodeFs from "node:fs";
import * as nodePath from "node:path";

// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
import { randomUUID } from "node:crypto";
import { closeSync, constants as fsConstants, fstatSync, openSync, readSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
// from install/state-layout.ts
export const STATE_ROOT_REL = "memory-bank/plans";
export const BOARD_REL = `${STATE_ROOT_REL}/board.md`;
export const ARCHIVE_REL = `${STATE_ROOT_REL}/archive`;
export const BOARD_DONE_ARCHIVE_REL = `${ARCHIVE_REL}/board-done.md`;
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
export type BoardTexts = {
  readonly raw: string;
  readonly normalized: string;
  readonly blanked: string;
};
const DONE_COLUMN = "Done";
export const DONE_ARCHIVE_HEADING = "## Done (WIP unlimited)";
export type RollBoardFacts = {
  readonly columns: readonly {
    readonly name: string;
    /** The heading line verbatim, after normalization. */
    readonly heading: string;
    readonly line: number;
    readonly rows: readonly { readonly id: string; readonly line: number }[];
  }[];
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
  /** Repository-relative path of the board the rows leave. */
  readonly sourceRel: string;
  /** Repository-relative path of the Done archive the rows enter. */
  readonly archiveRel: string;
  /** 1-based line numbers of the moved rows in the old board, ascending. */
  readonly lines: readonly number[];
  /** The moved raw lines, in board order. */
  readonly texts: readonly string[];
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
  roll: { readonly lines: readonly number[]; readonly texts: readonly string[] },
  insert: { readonly base: string; readonly at: number; readonly text: string },
): RollPlan {
  return {
    sourceRel,
    archiveRel,
    lines: roll.lines,
    texts: roll.texts,
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
  plan: Pick<RollPlan, "sourceRel" | "archiveRel" | "lines" | "texts" | "archiveBase" | "insertAt">,
): string | null {
  const { sourceRel, archiveRel, lines, texts } = plan;
  if (lines.length === 0 || lines.length !== texts.length) {
    return `the plan moves ${lines.length} line(s) and carries ${texts.length} text(s)`;
  }
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
  const base = before.archive ?? doneArchiveSkeleton(texts);
  if (plan.archiveBase !== base) return `the archive text the plan inserts into is not ${archiveRel} as read`;
  const baseLines = base.split("\n");
  if (!Number.isInteger(plan.insertAt) || plan.insertAt < 1 || plan.insertAt > baseLines.length) {
    return `the planned insert line ${plan.insertAt} is outside ${archiveRel}`;
  }
  if (after.archive === null) return `${archiveRel} is absent after the roll`;
  const expectedArchive = [...baseLines.slice(0, plan.insertAt), ...texts, ...baseLines.slice(plan.insertAt)];
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
  try {
    io.write(sourceRel, before.source);
  } catch (e) {
    failures.push(`${sourceRel} could not be written back (${messageOf(e)})`);
  }
  try {
    if (before.archive === null) io.remove(archiveRel);
    else io.write(archiveRel, before.archive);
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
export function stripControlChars(text: string, multiLine: boolean): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const control = c < 0x20 || (c >= 0x7f && c <= 0x9f);
    if (!control || (multiLine && (c === 0x09 || c === 0x0a))) out += text[i];
  }
  return out;
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
export function atomicWrite(finalPath: string, data: string): void {
  const tmp = `${finalPath}.tmp-${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  writeFileSync(tmp, data, "utf8");
  try {
    renameSync(tmp, finalPath);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EPERM" || code === "EEXIST" || code === "EACCES") {
      // Windows branch: remove the destination, then retry the rename.
      try {
        unlinkSync(finalPath);
      } catch {
        /* not-present is fine */
      }
      renameSync(tmp, finalPath);
    } else {
      // Any other error: best-effort temp cleanup, then rethrow.
      try {
        unlinkSync(tmp);
      } catch {
        /* best-effort */
      }
      throw e;
    }
  }
}
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

// ── The hand-written part: argv, the boundary checks, the reads, the plan, the io and the report ──────────

/**
 * The largest board or archive this roll reads, in bytes. This is a reader ceiling, not a budget: a larger
 * file is refused rather than read, and the roll does not run (exit 2).
 */
const READ_CEILING_BYTES = 16 * 1024 * 1024;

const DRY_RUN_FLAG = "--dry-run";
const USAGE = `Usage: node state-roll.js <repo-root> [${DRY_RUN_FLAG}]`;

/** One value made safe to print: the embedded rule removes every C0, C1 and DEL code point. */
function printable(value: string): string {
  return stripControlChars(value, false);
}

/** The roll could not run: one sanitized message on stderr, nothing on stdout, exit 2. Never a pass. */
function couldNotRun(message: string): never {
  process.stderr.write(`Error: ${printable(message)} Nothing was rolled.\n`);
  process.exit(2);
}

/** The errno code of a thrown filesystem error, for a message. */
function codeOf(e: unknown): string {
  return (e as NodeJS.ErrnoException).code ?? "unknown error";
}

const args = process.argv.slice(2);
const unknownFlag = args.find((a) => a.startsWith("--") && a !== DRY_RUN_FLAG);
if (unknownFlag !== undefined) couldNotRun(`unknown option ${unknownFlag}. ${USAGE}.`);
const dryRunCount = args.filter((a) => a === DRY_RUN_FLAG).length;
if (dryRunCount > 1) couldNotRun(`${DRY_RUN_FLAG} was given more than once. ${USAGE}.`);
/** True in the mode that plans and writes nothing. */
const DRY_RUN = dryRunCount === 1;
const positional = args.filter((a) => a !== DRY_RUN_FLAG);
const rootArg = positional[0];
if (rootArg === undefined) couldNotRun(`no repository root was given. ${USAGE}.`);
if (positional.length > 1) couldNotRun(`more than one repository root was given. ${USAGE}.`);

let root: string;
try {
  root = nodeFs.realpathSync(rootArg);
} catch (e) {
  couldNotRun(`the repository root ${rootArg} cannot be resolved (${codeOf(e)}). ${USAGE}.`);
}
try {
  if (!nodeFs.statSync(root).isDirectory()) couldNotRun(`the repository root ${rootArg} is not a directory. ${USAGE}.`);
  // A dry run needs to read only; a roll needs to write too.
  const C = nodeFs.constants;
  nodeFs.accessSync(root, DRY_RUN ? C.R_OK | C.X_OK : C.R_OK | C.W_OK | C.X_OK);
} catch (e) {
  couldNotRun(
    `the repository root ${rootArg} is not a readable${DRY_RUN ? "" : " and writable"} directory (${codeOf(e)}).`,
  );
}

/** True when an already-resolved absolute path is the root or lies under it. */
function insideRoot(real: string): boolean {
  return real === root || real.startsWith(root + nodePath.sep);
}

/** The absolute path of a repository-relative path with `/` separators. */
function abs(rel: string): string {
  return nodePath.join(root, ...rel.split("/"));
}

/** The repository-relative parent of a repository-relative path. */
function relParent(rel: string): string {
  return rel.slice(0, rel.lastIndexOf("/"));
}

/** The last segment of a repository-relative path. */
function relBase(rel: string): string {
  return rel.slice(rel.lastIndexOf("/") + 1);
}

/**
 * The real path of the directory at `rel`, or null when nothing is there. Anything else is refused by name: a
 * path that resolves outside the root, a present entry that is not a directory, or one that cannot be resolved.
 */
function realDirectoryOrNull(rel: string, what: string): string | null {
  const path = abs(rel);
  try {
    nodeFs.lstatSync(path);
  } catch (e) {
    if (codeOf(e) === "ENOENT") return null;
    couldNotRun(`${what} ${rel} cannot be inspected (${codeOf(e)}).`);
  }
  let real: string;
  try {
    real = nodeFs.realpathSync(path);
  } catch (e) {
    couldNotRun(`${what} ${rel} cannot be resolved (${codeOf(e)}).`);
  }
  if (!insideRoot(real)) couldNotRun(`${what} ${rel} resolves outside the repository root, so it was not used.`);
  let st: nodeFs.Stats;
  try {
    st = nodeFs.statSync(real);
  } catch (e) {
    couldNotRun(`${what} ${rel} cannot be inspected (${codeOf(e)}).`);
  }
  if (!st.isDirectory()) couldNotRun(`${what} ${rel} is not a directory.`);
  return real;
}

/**
 * The text of the file at `path` (`rel` names it), or null when nothing is there. It is lstat'ed first, so a
 * symbolic link, a FIFO, a device or a directory is refused by name and never opened; then it is read through
 * the embedded non-blocking reader under the read ceiling. A text holding U+FFFD is refused too: a roll writes
 * text, so a byte the decoder replaced would not be written back as it was. Every refusal THROWS, so the
 * executor can still restore both files when a re-read during the roll is refused.
 */
function readTextOrThrow(rel: string, path: string): string | null {
  let st: nodeFs.Stats;
  try {
    st = nodeFs.lstatSync(path);
  } catch (e) {
    if (codeOf(e) === "ENOENT") return null;
    throw new Error(`${rel} cannot be inspected (${codeOf(e)})`);
  }
  if (st.isSymbolicLink()) {
    throw new Error(`${rel} is a symbolic link, and a roll would replace the link with a file`);
  }
  if (!st.isFile()) throw new Error(`${rel} is present and is not a regular file, so it was not opened`);
  let text: string | null;
  try {
    text = readRegularFileOrNull(path, READ_CEILING_BYTES, "state file");
  } catch (e) {
    const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
    throw new Error(`${rel} is present and cannot be read (${condition})`);
  }
  if (text !== null && text.includes("�")) {
    throw new Error(
      `${rel} holds U+FFFD or bytes that are not UTF-8, and a roll writes text, so those bytes would not be kept`,
    );
  }
  return text;
}

/** readTextOrThrow for the planning reads, where a refusal is could-not-run. */
function readText(rel: string, path: string): string | null {
  try {
    return readTextOrThrow(rel, path);
  } catch (e) {
    couldNotRun(`${e instanceof Error ? e.message : String(e)}.`);
  }
}

// ── The reads ───────────────────────────────────────────────────────────────────────────────────────

const boardDirRel = relParent(BOARD_REL);
const boardDirReal = realDirectoryOrNull(boardDirRel, "the state directory");
if (boardDirReal === null) couldNotRun(`the state directory ${boardDirRel} does not exist; install grugops first.`);
const boardPath = nodePath.join(boardDirReal, relBase(BOARD_REL));
const boardText = readText(BOARD_REL, boardPath);
if (boardText === null) couldNotRun(`the board file ${BOARD_REL} does not exist.`);

const archiveParentRel = relParent(ARCHIVE_REL);
const archiveParentReal = realDirectoryOrNull(archiveParentRel, "the state directory");
if (archiveParentReal === null) couldNotRun(`the state directory ${archiveParentRel} does not exist; install grugops first.`);
const archiveDirReal = realDirectoryOrNull(ARCHIVE_REL, "the archive directory");
if (relParent(BOARD_DONE_ARCHIVE_REL) !== ARCHIVE_REL) {
  couldNotRun(`the Done archive ${BOARD_DONE_ARCHIVE_REL} does not sit in the archive directory ${ARCHIVE_REL}.`);
}
/** Where the archive directory is, or will be once a roll creates it under its confirmed parent. */
const archiveDirPath = archiveDirReal ?? nodePath.join(archiveParentReal, relBase(ARCHIVE_REL));
const archivePath = nodePath.join(archiveDirPath, relBase(BOARD_DONE_ARCHIVE_REL));
const archiveText = archiveDirReal === null ? null : readText(BOARD_DONE_ARCHIVE_REL, archivePath);

// ── The plan ────────────────────────────────────────────────────────────────────────────────────────

/** The three forms of a document the planners read, and its parse. */
function documentOf(raw: string): { texts: BoardTexts; model: RollBoardFacts } {
  const normalized = normalizeDocument(raw);
  return { texts: { raw, normalized, blanked: stripHtmlComments(normalized) }, model: parseBoard(raw) };
}

const board = documentOf(boardText);
const roll = planDoneRoll(board.texts, board.model, BUDGETS.doneRows);
if (roll.kind === "refuse") couldNotRun(`${BOARD_REL}: ${roll.reason}.`);
if (roll.kind === "none") {
  process.stdout.write(
    `Nothing to roll: the Done column of ${BOARD_REL} holds ${roll.rows} row(s), and it keeps ` +
      `${BUDGETS.doneRows} (BUDGETS.doneRows).\n`,
  );
  process.exit(0);
}
const insert = planArchiveInsert(archiveText === null ? null : documentOf(archiveText), roll.texts);
if (insert.kind === "refuse") couldNotRun(`${BOARD_DONE_ARCHIVE_REL}: ${insert.reason}.`);
const plan = assembleRoll(BOARD_REL, BOARD_DONE_ARCHIVE_REL, { source: boardText, archive: archiveText }, roll, insert);

const movedCount = roll.lines.length;
const where = `from ${BOARD_REL} to the top of ${BOARD_DONE_ARCHIVE_REL}${insert.created ? " (a new file)" : ""}`;
if (DRY_RUN) {
  process.stdout.write(`Dry run: ${movedCount} Done row(s) would move ${where}; nothing was written.\n`);
  process.exit(0);
}

// ── The roll ────────────────────────────────────────────────────────────────────────────────────────

let createdDir = false;
if (archiveDirReal === null) {
  try {
    nodeFs.mkdirSync(archiveDirPath);
  } catch (e) {
    couldNotRun(`the archive directory ${ARCHIVE_REL} cannot be created (${codeOf(e)}).`);
  }
  createdDir = true;
  let made: string;
  try {
    made = nodeFs.realpathSync(archiveDirPath);
  } catch (e) {
    couldNotRun(`the archive directory ${ARCHIVE_REL} cannot be resolved after it was created (${codeOf(e)}).`);
  }
  if (!insideRoot(made)) couldNotRun(`the archive directory ${ARCHIVE_REL} resolves outside the repository root.`);
}

/** Remove the archive directory this run created, when it is empty again. A failure leaves it in place. */
function removeCreatedDir(): void {
  if (!createdDir) return;
  try {
    nodeFs.rmdirSync(archiveDirPath);
  } catch {
    /* not empty or not removable: an empty directory is not state, and a non-empty one is never removed */
  }
}

const paths: ReadonlyMap<string, string> = new Map([
  [BOARD_REL, boardPath],
  [BOARD_DONE_ARCHIVE_REL, archivePath],
]);

/** The absolute path executeRoll's io acts on for `rel`; only the two planned files are reachable. */
function pathOf(rel: string): string {
  const path = paths.get(rel);
  if (path === undefined) throw new Error(`${rel} is not a file this roll touches`);
  return path;
}

const io: RollIo = {
  read: (rel) => readTextOrThrow(rel, pathOf(rel)),
  write: (rel, text) => atomicWrite(pathOf(rel), text),
  remove: (rel) => nodeFs.unlinkSync(pathOf(rel)),
};

const outcome = executeRoll(plan, io);
if (outcome.ok) {
  const lines = roll.ids.map((id) => `MOVED   ${printable(id)}`);
  process.stdout.write(
    `${[
      ...lines,
      `Rolled ${movedCount} Done row(s) ${where}; the board keeps ${BUDGETS.doneRows} (BUDGETS.doneRows), and ` +
        "the move was proven line for line.",
    ].join("\n")}\n`,
  );
  process.exit(0);
}
if (outcome.stage === "changed") {
  removeCreatedDir();
  couldNotRun(`${outcome.reason}.`);
}
if (outcome.stage === "restore-failed") {
  process.stderr.write(
    `Error: ${printable(outcome.reason)}. The roll failed and could not be fully undone: compare ${BOARD_REL} and ` +
      `${BOARD_DONE_ARCHIVE_REL} with version control before anything else writes them.\n`,
  );
  process.exit(2);
}
removeCreatedDir();
process.stdout.write(
  `ROLLED BACK: ${printable(outcome.reason)}. ${BOARD_REL} and ${BOARD_DONE_ARCHIVE_REL} hold their old bytes` +
    `${insert.created ? ", and the archive this run created was removed" : ""}.\n`,
);
process.exit(1);

// state-check.ts — the read-only host state checker (phase 37, plans 37-03, 37-04 and 37-05, SPLIT-02, SPLIT-04,
// SPLIT-05, SPLIT-06).
//
// WHAT IT IS. A kit-shipped runnable in the shape of reference-check.ts: authored here, compiled to a committed
// state-check.js, and run on a host as `node state-check.js <repo-root> [--json]` with only Node present. It
// measures the per-repo state against every D-10 budget and reports each broken one, through the same rules
// and in the same call order as the structure validator's checkBudgets (scripts/validate-agent-factory.ts):
// the board (bytes, ticket-row characters, `_Updated:` lines, Done rows), the two index files, every record
// the record rule keeps in the ticket, NFR and trace directories, and the progress file.
//
// THE D-12 CONTRACT.
//   exit 0 → no enforced finding: none at all, or only warnings because the layout marker is not valid
//   exit 1 → the layout marker is valid and at least one finding exists (the gate blocks)
//   exit 2 → the check could not run: a bad argument, a root that is not a readable directory, or a required
//            file that is present and cannot be read. Exit 2 is never a pass: it prints nothing on stdout.
// With `--json`, stdout carries exactly one JSON document, `{ ok, marker, enforced, findings, rollable,
// moveOnly }`, where `ok` is
// false exactly when the exit code is 1, `marker` is "absent", "valid" or "invalid", and `enforced` is true
// when the marker is valid. Each finding carries rel, key, measured, budget, unit, line and note (budget and
// unit are null on a finding about no budget). The document also carries `rollable`, the surfaces a roll is
// due on in the fixed order done, progress, and `moveOnly`, one { live, archive, liveCount, archivedCount }
// per move-only surface.
//
// THE MARKER DECIDES SEVERITY (D-04, D-05, D-14). With a valid marker every finding prints as `FINDING` and
// fails. With no marker, or an unrecognized one, every finding prints as `WARN` and the exit code is 0; an
// unrecognized marker is itself a warning that names it.
//
// THE INTEGRITY CHECKS AND THE REPORTS (plan 37-05). After the budgets it checks the hand-kept NFR catalog
// against the NFR files in both directions (D-13), through the embedded parseNfrIndex and
// nfrIntegrityFindings; each expected NFR path is derived from an identifier, and no path is ever taken from
// link text. It reports a name found both in a move-only live folder and in its archive folder
// (.grugops/queue/done/ and memory-bank/50-decisions/, v3.0 D-7). These findings take the marker's severity
// like the budget findings. Two report lines change no exit code by themselves: a `ROLLABLE` line per surface
// a roll is due on (the Done column, or a progress file over budget that holds a dated status entry, D-08,
// D-09), naming the state-roll command, and a `MOVE-ONLY` line per move-only surface with its live and
// archived record counts, printed on every run. state-check itself never moves anything.
//
// WHAT IT MEASURES IS DECIDED BY THE RULES, NOT HERE. Which directory entries count is the embedded
// budgetEntryNames, given the raw listing; this file filters no name itself (D-11). A record's size is its
// lstat size, so a record is never opened, and an entry that is not a regular file is a finding by name.
//
// THE ROOT IS A BOUNDARY. Every path is resolved with realpath before it is used, and a path that resolves
// outside realpath(root) is a finding by name and is never read, listed or measured
// (agent-factory/contracts/board.md, `## Staleness`). A path that does not exist is absent.
//
// OUTPUT IS SANITIZED. Every value read from the repository (a path, a file name) and every diagnostic has
// each C0, C1 and DEL code point removed by the embedded stripControlChars before it is printed or
// serialized, by one helper used by the text and the JSON output (agent-factory/contracts/board.md,
// `## Control characters on the way out`).
//
// BUILTINS ONLY. A host runs this file with no kit and no node_modules, so it imports `node:` builtins and
// nothing else. The hand-written part below imports them as namespaces, so the names the generated region
// imports never collide with its own.
//
// NOTHING HERE IS RETYPED. Every budget number, state path and rule this file uses sits in the generated
// region, copied verbatim from its authority by scripts/generate-runnable-embeds.ts: BUDGETS and the state
// paths from install/state-layout.ts, the budget, record, marker and sanitizing rules from
// scripts/state-rules.ts, the board grammar from scripts/board-model.ts and the non-blocking reader from
// scripts/context-io.ts. scripts/runnable-embeds-freshness.ts fails CI when the region differs from a fresh
// derivation.
//
// READ-ONLY. It opens no descriptor for writing and calls no API that changes the file system; its only
// writes are to stdout and stderr. state-check.test.ts proves this over the syntax tree of this file. A run
// concurrent with an agent's edit can therefore misreport what it read, and never change it. A path that is
// present but not a regular file is refused by its stat, before any open, and the read itself goes through
// the embedded non-blocking reader, so a FIFO or a device at a state path cannot hang it.
//
// Voice: clear professional voice (CLAUDE.md hard rule): this is a quality surface a human acts on.

import * as nodeFs from "node:fs";
import * as nodePath from "node:path";

// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
import { closeSync, constants as fsConstants, fstatSync, openSync, readSync } from "node:fs";
// from install/state-layout.ts
export const STATE_ROOT_REL = "memory-bank/plans";
export const BOARD_REL = `${STATE_ROOT_REL}/board.md`;
export const TICKETS_REL = `${STATE_ROOT_REL}/tickets`;
export const NFR_CATALOG_REL = `${STATE_ROOT_REL}/nfr-catalog.md`;
export const TRACEABILITY_REL = `${STATE_ROOT_REL}/traceability.md`;
export const MEMORY_BANK_REL = "memory-bank";
export const NFR_DIR_REL = `${STATE_ROOT_REL}/nfr`;
export const TRACE_DIR_REL = `${STATE_ROOT_REL}/traceability`;
export const ARCHIVE_REL = `${STATE_ROOT_REL}/archive`;
export const PROGRESS_REL = `${MEMORY_BANK_REL}/60-progress.md`;
export const DECISIONS_REL = `${MEMORY_BANK_REL}/50-decisions`;
export const DECISIONS_ARCHIVE_REL = `${ARCHIVE_REL}/decisions`;
export const GRUGOPS_DIR_REL = ".grugops";
export const QUEUE_REL = `${GRUGOPS_DIR_REL}/queue`;
export const QUEUE_DONE_REL = `${QUEUE_REL}/done`;
export const GRUGOPS_ARCHIVE_REL = `${GRUGOPS_DIR_REL}/archive`;
export const QUEUE_DONE_ARCHIVE_REL = `${GRUGOPS_ARCHIVE_REL}/queue-done`;
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
  readonly budget: number | null;
  readonly unit: StateUnit | null;
  readonly line?: number;
  readonly note?: string;
};
export type IntegrityKey =
  | "nfr-missing-file"
  | "nfr-unindexed-file"
  | "nfr-duplicate-line"
  | "nfr-link-mismatch"
  | "nfr-malformed-line"
  | "nfr-bad-file-name"
  | "nfr-case-collision"
  | "move-only-copy"
  | "move-only-unlisted";
export function integrityFinding(rel: string, key: IntegrityKey, note: string, line?: number): StateFinding {
  return { rel, key, measured: null, budget: null, unit: null, ...(line === undefined ? {} : { line }), note };
}
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
  return names.filter((n) => !n.startsWith(".")).sort(compareCodeUnits);
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
const NFR_FILE_NAME = /^NFR-[0-9]+\.md$/;
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
export function nfrIntegrityFindings(
  indexRel: string,
  parsed: NfrIndex,
  fileNames: readonly string[],
  nfrDirRel: string,
): StateFinding[] {
  const findings: StateFinding[] = [];
  const records = recordEntryNames(fileNames);
  const present = new Set(records);

  for (const m of parsed.malformed) {
    findings.push(
      integrityFinding(
        indexRel,
        "nfr-malformed-line",
        "this line begins `- [NFR` and is not an index line `- [NFR-<digits>](nfr/NFR-<digits>.md) <text>`",
        m.line,
      ),
    );
  }

  const linesById = new Map<string, NfrIndexEntry[]>();
  for (const e of parsed.entries) {
    const group = linesById.get(e.id);
    if (group === undefined) linesById.set(e.id, [e]);
    else group.push(e);
  }
  for (const [id, group] of linesById) {
    const first = group[0];
    if (first === undefined) continue;
    if (group.length > 1) {
      findings.push(
        integrityFinding(
          indexRel,
          "nfr-duplicate-line",
          `${id} has ${group.length} index lines (lines ${group.map((e) => e.line).join(", ")}); keep exactly one`,
          first.line,
        ),
      );
    }
    for (const e of group) {
      if (e.target !== nfrLinkTarget(id)) {
        findings.push(
          integrityFinding(
            indexRel,
            "nfr-link-mismatch",
            `the link of ${id} must be \`${nfrLinkTarget(id)}\`, the path derived from its identifier; the link ` +
              "as written was not followed",
            e.line,
          ),
        );
      }
    }
    if (!present.has(`${id}.md`)) {
      findings.push(
        integrityFinding(
          `${nfrDirRel}/${id}.md`,
          "nfr-missing-file",
          `${indexRel} indexes ${id} and this file does not exist`,
        ),
      );
    }
  }

  for (const name of records) {
    const rel = `${nfrDirRel}/${name}`;
    if (!NFR_FILE_NAME.test(name)) {
      findings.push(
        integrityFinding(rel, "nfr-bad-file-name", "the name is not `NFR-<digits>.md`, so no index line can name it"),
      );
      continue;
    }
    const id = name.slice(0, -".md".length);
    if (!linesById.has(id)) {
      findings.push(
        integrityFinding(
          rel,
          "nfr-unindexed-file",
          `no line of ${indexRel} names ${id}; add exactly one line \`- [${id}](${nfrLinkTarget(id)}) <category>: <target>\``,
        ),
      );
    }
  }

  const namesByFold = new Map<string, string[]>();
  for (const name of records) {
    const fold = name.toLowerCase();
    const group = namesByFold.get(fold);
    if (group === undefined) namesByFold.set(fold, [name]);
    else group.push(name);
  }
  for (const group of namesByFold.values()) {
    const first = group[0];
    if (first === undefined || group.length < 2) continue;
    findings.push(
      integrityFinding(
        `${nfrDirRel}/${first}`,
        "nfr-case-collision",
        `these names differ only by letter case: ${group.join(", ")}; keep one`,
      ),
    );
  }
  return findings;
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
export function progressEntries(text: string): ProgressEntries {
  const dated: DatedEntry[] = [];
  const standing: StandingSection[] = [];
  for (const [n, line] of text.split("\n").entries()) {
    if (!SECTION_HEADING.test(line)) continue;
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
export function doneRowCount(model: BoardFacts): number {
  return doneRows(model).length;
}
export type RollSurface = "done" | "progress";
export type RollableSurface = {
  readonly surface: RollSurface;
  readonly key: "doneRows" | "progressBytes";
  readonly measured: number;
  readonly budget: number;
  readonly unit: StateUnit;
};
export function rollableSurfaces(
  doneRowCount: number | null,
  progressBytes: number | null,
  progress: ProgressEntries | null,
  budgets: StateBudgets,
): RollableSurface[] {
  const out: RollableSurface[] = [];
  if (doneRowCount !== null && doneRowCount > budgets.doneRows) {
    out.push({ surface: "done", key: "doneRows", measured: doneRowCount, budget: budgets.doneRows, unit: UNITS.doneRows });
  }
  if (progressBytes !== null && progressBytes > budgets.progressBytes && progress !== null && progress.dated.length > 0) {
    out.push({
      surface: "progress",
      key: "progressBytes",
      measured: progressBytes,
      budget: budgets.progressBytes,
      unit: UNITS.progressBytes,
    });
  }
  return out;
}
export function formatRollable(r: RollableSurface): string {
  return `${r.surface}: ${grouped(r.measured)} ${r.unit}, keeps ${grouped(r.budget)} ${r.unit} (BUDGETS.${r.key})`;
}
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
export function moveOnlyFindings(
  liveRel: string,
  liveNames: readonly string[],
  archiveRel: string,
  archiveNames: readonly string[],
): StateFinding[] {
  const archived = new Set(recordEntryNames(archiveNames));
  return recordEntryNames(liveNames)
    .filter((name) => archived.has(name))
    .map((name) =>
      integrityFinding(
        `${liveRel}/${name}`,
        "move-only-copy",
        `${archiveRel}/${name} holds the same name, and a move leaves one copy: this record is in both folders`,
      ),
    );
}
function grouped(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

const JSON_FLAG = "--json";
const USAGE = `Usage: node state-check.js <repo-root> [${JSON_FLAG}]`;

/** The note on a finding whose path resolves outside the repository root. */
const OUTSIDE_ROOT = "it resolves outside the repository root, so it was not read";

/** One value made safe to print: the embedded rule removes every C0, C1 and DEL code point. */
function printable(value: string): string {
  return stripControlChars(value, false);
}

/** The check could not run: one sanitized message on stderr, nothing on stdout, exit 2. Never a pass. */
function couldNotRun(message: string): never {
  process.stderr.write(`Error: ${printable(message)} The state check did not run.\n`);
  process.exit(2);
}

/** The errno code of a thrown filesystem error, for a message. */
function codeOf(e: unknown): string {
  return (e as NodeJS.ErrnoException).code ?? "unknown error";
}

const args = process.argv.slice(2);
const unknownFlag = args.find((a) => a.startsWith("--") && a !== JSON_FLAG);
if (unknownFlag !== undefined) couldNotRun(`unknown option ${unknownFlag}. ${USAGE}.`);
const asJson = args.includes(JSON_FLAG);
const positionals = args.filter((a) => !a.startsWith("--"));
const rootArg = positionals[0];
if (rootArg === undefined) couldNotRun(`no repository root was given. ${USAGE}.`);
if (positionals.length > 1) couldNotRun(`more than one repository root was given. ${USAGE}.`);

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

/** Where a state path resolves: nothing there, an error, outside the root, or a real path inside it. */
type Located =
  | { readonly kind: "absent" }
  | { readonly kind: "error"; readonly code: string }
  | { readonly kind: "outside" }
  | { readonly kind: "inside"; readonly abs: string; readonly real: string };

/**
 * Resolve `rel` under the root with realpath, following every link in the path, and say whether it lands
 * inside realpath(root). Only ENOENT is absent; any other failure is an error the caller reports.
 */
function locate(rel: string): Located {
  const abs = nodePath.join(root, ...rel.split("/"));
  let real: string;
  try {
    real = nodeFs.realpathSync(abs);
  } catch (e) {
    const code = codeOf(e);
    return code === "ENOENT" ? { kind: "absent" } : { kind: "error", code };
  }
  const prefix = root.endsWith(nodePath.sep) ? root : `${root}${nodePath.sep}`;
  if (real !== root && !real.startsWith(prefix)) return { kind: "outside" };
  return { kind: "inside", abs, real };
}

/** A required state file's text, or why there is none. */
type StateText = { readonly kind: "absent" } | { readonly kind: "outside" } | { readonly kind: "text"; readonly text: string };

/**
 * The text of the state file at `rel`, or that it is absent or outside the root.
 *
 * The resolved path is stat'ed first, so a path that is present and is not a regular file (a FIFO, a device,
 * a socket, a directory) is refused without being opened. The read goes through the embedded non-blocking
 * reader, which checks the shape again on the open descriptor. A file that is present and cannot be read is
 * never treated as absent: it is exit 2, naming the file.
 */
function readState(rel: string, what: string): StateText {
  const at = locate(rel);
  if (at.kind === "error") couldNotRun(`cannot resolve the ${what} ${rel} (${at.code}).`);
  if (at.kind !== "inside") return at;
  let st: nodeFs.Stats | undefined;
  try {
    st = nodeFs.statSync(at.real, { throwIfNoEntry: false });
  } catch (e) {
    couldNotRun(`cannot inspect the ${what} ${rel} (${codeOf(e)}).`);
  }
  if (st === undefined) return { kind: "absent" };
  if (!st.isFile()) couldNotRun(`the ${what} ${rel} is present and is not a regular file, so it was not opened.`);
  let text: string | null;
  try {
    text = readRegularFileOrNull(at.real, READ_CEILING_BYTES, what);
  } catch (e) {
    const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
    couldNotRun(`the ${what} ${rel} is present and cannot be read (${condition}).`);
  }
  return text === null ? { kind: "absent" } : { kind: "text", text };
}

/** The layout marker's state. A marker that resolves outside the root is invalid by name and never read. */
function readMarker(): MarkerState {
  const marker = readState(LAYOUT_MARKER_REL, "layout marker");
  if (marker.kind === "outside") return { state: "invalid", reason: `${OUTSIDE_ROOT}` };
  return markerState(marker.kind === "text" ? marker.text : null, LAYOUT_MARKER_CONTENT);
}

/**
 * The board's findings: bytes, ticket-row characters, `_Updated:` lines and Done rows, as checkBudgets reads it,
 * and the Done row count the rollable report reads (null when the board was not read).
 */
function boardFindings(): { readonly findings: StateFinding[]; readonly doneRows: number | null } {
  const board = readState(BOARD_REL, "board file");
  if (board.kind === "absent") {
    return { findings: [unmeasuredFinding(BOARD_REL, "boardBytes", BUDGETS, "the board file is absent")], doneRows: null };
  }
  if (board.kind === "outside") {
    return { findings: [unmeasuredFinding(BOARD_REL, "boardBytes", BUDGETS, OUTSIDE_ROOT)], doneRows: null };
  }
  const normalized = normalizeDocument(board.text);
  const model = parseBoard(board.text);
  return {
    findings: [
      ...boardBudgetFindings(BOARD_REL, { raw: board.text, normalized, blanked: stripHtmlComments(normalized) }, model, BUDGETS),
      ...doneRowFindings(BOARD_REL, model, BUDGETS),
    ],
    doneRows: doneRowCount(model),
  };
}

/** The index-line findings of one index file, measured outside HTML comments. `index` is its readState result. */
function indexFindings(rel: string, index: StateText): StateFinding[] {
  if (index.kind === "absent") return [unmeasuredFinding(rel, "indexEntryBytes", BUDGETS, "the file is absent")];
  if (index.kind === "outside") return [unmeasuredFinding(rel, "indexEntryBytes", BUDGETS, OUTSIDE_ROOT)];
  const normalized = normalizeDocument(index.text);
  return indexLineFindings(rel, { normalized, blanked: stripHtmlComments(normalized) }, BUDGETS);
}

/**
 * The byte finding of one file, measured from its lstat size without opening it. A FIFO, a directory or a
 * link at the path is not a regular file: it is reported by name and never measured. A path that resolves
 * outside the root, or whose size cannot be taken, is reported too, so no file is dropped. `missingIsClean`
 * is for the progress file, which may be absent.
 */
function sizeFinding(rel: string, key: FileBudgetKey, missingIsClean: boolean): StateFinding[] {
  const at = locate(rel);
  if (at.kind === "absent") {
    return missingIsClean ? [] : [unmeasuredFinding(rel, key, BUDGETS, "its size could not be read (ENOENT)")];
  }
  if (at.kind === "error") return [unmeasuredFinding(rel, key, BUDGETS, `its size could not be read (${at.code})`)];
  if (at.kind === "outside") return [unmeasuredFinding(rel, key, BUDGETS, OUTSIDE_ROOT)];
  let st: nodeFs.Stats;
  try {
    st = nodeFs.lstatSync(at.abs);
  } catch (e) {
    return [unmeasuredFinding(rel, key, BUDGETS, `its size could not be read (${codeOf(e)})`)];
  }
  if (!st.isFile()) return [unmeasuredFinding(rel, key, BUDGETS, "not a regular file, so it was not measured")];
  const finding = fileBytesFinding(rel, st.size, key, BUDGETS);
  return finding === null ? [] : [finding];
}

/** The raw listing of a state directory, or why there is none. */
type Listing =
  | { readonly kind: "absent" }
  | { readonly kind: "unlisted"; readonly note: string }
  | { readonly kind: "listed"; readonly names: readonly string[] };

/** The note on a directory that resolves outside the repository root. */
const OUTSIDE_ROOT_DIR = "it resolves outside the repository root, so it was not listed";

/**
 * The raw listing of the directory at `dirRel`, each directory listed once per run so every rule that reads it
 * sees the same names. A directory that does not exist is absent. One that resolves outside the root, or
 * cannot be resolved or listed, is unlisted with the reason, which the caller reports by name.
 */
function listDirectory(dirRel: string): Listing {
  const at = locate(dirRel);
  if (at.kind === "absent") return at;
  if (at.kind === "error") return { kind: "unlisted", note: `the directory could not be resolved (${at.code})` };
  if (at.kind === "outside") return { kind: "unlisted", note: OUTSIDE_ROOT_DIR };
  try {
    return { kind: "listed", names: nodeFs.readdirSync(at.real) };
  } catch (e) {
    return { kind: "unlisted", note: `the directory could not be listed (${codeOf(e)})` };
  }
}

/**
 * The byte findings of every record in one directory. The raw listing goes to the embedded budgetEntryNames,
 * which decides which entries are records; this function filters no name itself (D-11). A directory that
 * does not exist is an empty set. A directory that resolves outside the root, or cannot be listed, is
 * reported by name, so its files are never silently unmeasured.
 */
function directoryFindings(dirRel: string, key: FileBudgetKey, listing: Listing): StateFinding[] {
  if (listing.kind === "absent") return [];
  if (listing.kind === "unlisted") return [unmeasuredFinding(dirRel, key, BUDGETS, listing.note)];
  return budgetEntryNames(listing.names).flatMap((name) => sizeFinding(`${dirRel}/${name}`, key, false));
}

/**
 * The NFR index checked against the NFR files in both directions (D-13), by the embedded nfrIntegrityFindings.
 * The catalog is the text indexFindings read, comment-blanked, and the listing is the raw one the byte budget
 * read; the rule applies the record rule itself, so this function filters no name. An absent catalog is an
 * index with no line, so every NFR file is reported as unindexed beside the absent-catalog finding. A catalog
 * or a directory that resolves outside the root, or cannot be listed, is already a finding by name, and is
 * not checked further: a set nobody read cannot be compared.
 */
function nfrFindings(catalog: StateText, listing: Listing): StateFinding[] {
  if (catalog.kind === "outside" || listing.kind === "unlisted") return [];
  const names = listing.kind === "listed" ? listing.names : [];
  for (const name of recordEntryNames(names)) confirmListed(`${NFR_DIR_REL}/${name}`);
  const text = catalog.kind === "text" ? catalog.text : "";
  const parsed = parseNfrIndex(stripHtmlComments(normalizeDocument(text)));
  return nfrIntegrityFindings(NFR_CATALOG_REL, parsed, names, NFR_DIR_REL);
}

/**
 * The concurrency arm of the NFR check (SPLIT-02): a name the nfr/ listing returned must still be there when the
 * index is compared with it. One whose lstat fails (it vanished, ENOENT, or cannot be stat'ed) is never
 * counted as present and never a pass: the check reports it by name and could not run (exit 2). A test cannot
 * open this window on demand, so it is held by review (plan 37-05, Flagged assumptions).
 */
function confirmListed(rel: string): void {
  try {
    nodeFs.lstatSync(nodePath.join(root, ...rel.split("/")));
  } catch (e) {
    couldNotRun(
      `the NFR file ${rel} was listed and then could not be inspected (${codeOf(e)}), so the index check cannot ` +
        "say whether it exists.",
    );
  }
}

/** The progress file's byte finding and what the rollable report reads from it. */
type ProgressReport = {
  readonly findings: StateFinding[];
  readonly bytes: number | null;
  readonly entries: ProgressEntries | null;
};

/**
 * The progress file's byte finding, measured from its lstat size as checkBudgets measures it. Only a file
 * over its budget is read: its dated status entries decide whether it is rollable, and with none the finding
 * names its standing sections and where they belong (D-09, through the embedded progressBytesFinding). The
 * text is comment-blanked first, so an example heading inside an HTML comment opens no entry. A file that was
 * measured and then cannot be read is exit 2, naming it.
 */
function progressReport(): ProgressReport {
  const sized = sizeFinding(PROGRESS_REL, "progressBytes", true);
  const measured = sized.find((f) => f.measured !== null)?.measured ?? null;
  if (measured === null) return { findings: sized, bytes: null, entries: null };
  const text = readState(PROGRESS_REL, "progress file");
  if (text.kind !== "text") couldNotRun(`the progress file ${PROGRESS_REL} was measured and then could not be read.`);
  const entries = progressEntries(stripHtmlComments(normalizeDocument(text.text)));
  const finding = progressBytesFinding(PROGRESS_REL, measured, entries, DECISIONS_REL, BUDGETS);
  return { findings: finding === null ? [] : [finding], bytes: measured, entries };
}

/** One move-only surface's counts: records in the live folder and in its archive folder (null when unlisted). */
type MoveOnlySurface = {
  readonly live: string;
  readonly archive: string;
  readonly liveCount: number | null;
  readonly archivedCount: number | null;
};

/**
 * The move-only report of one surface (SPLIT-06, v3.0 D-7): the embedded moveOnlyFindings over the raw
 * listings of the live folder and its archive folder, and their record counts by the embedded
 * recordEntryNames, so a keeper is never counted. An absent folder holds no record. A folder that resolves
 * outside the root, or cannot be listed, is a finding by name, its count is unknown, and the two folders are
 * not compared.
 */
function moveOnlyReport(liveRel: string, archiveRel: string): { findings: StateFinding[]; surface: MoveOnlySurface } {
  const findings: StateFinding[] = [];
  const counted = (rel: string, listing: Listing): number | null => {
    if (listing.kind === "unlisted") {
      findings.push(integrityFinding(rel, "move-only-unlisted", listing.note));
      return null;
    }
    return listing.kind === "listed" ? recordEntryNames(listing.names).length : 0;
  };
  const live = listDirectory(liveRel);
  const archive = listDirectory(archiveRel);
  const liveCount = counted(liveRel, live);
  const archivedCount = counted(archiveRel, archive);
  if (live.kind !== "unlisted" && archive.kind !== "unlisted") {
    const names = (l: Listing): readonly string[] => (l.kind === "listed" ? l.names : []);
    findings.push(...moveOnlyFindings(liveRel, names(live), archiveRel, names(archive)));
  }
  return { findings, surface: { live: liveRel, archive: archiveRel, liveCount, archivedCount } };
}

/** The command a ROLLABLE line names. state-roll is shipped beside this file under tools/grugops/. */
const ROLL_COMMAND = "node tools/grugops/state-roll.js";

/** A finding with every value read from the repository made printable. Text and JSON both print these. */
function printableFinding(f: StateFinding): StateFinding {
  return { ...f, rel: printable(f.rel), ...(f.note === undefined ? {} : { note: printable(f.note) }) };
}

let marker: MarkerState;
let findings: StateFinding[];
let rollable: RollableSurface[];
let moveOnly: MoveOnlySurface[];
try {
  // checkBudgets' call order and inputs (scripts/validate-agent-factory.ts).
  marker = readMarker();
  const board = boardFindings();
  const traceIndex = indexFindings(TRACEABILITY_REL, readState(TRACEABILITY_REL, "index file"));
  const nfrCatalog = readState(NFR_CATALOG_REL, "index file");
  const nfrIndex = indexFindings(NFR_CATALOG_REL, nfrCatalog);
  const tickets = directoryFindings(TICKETS_REL, "ticketBytes", listDirectory(TICKETS_REL));
  const nfrListing = listDirectory(NFR_DIR_REL);
  const nfrFiles = directoryFindings(NFR_DIR_REL, "nfrBytes", nfrListing);
  const traceFiles = directoryFindings(TRACE_DIR_REL, "traceBytes", listDirectory(TRACE_DIR_REL));
  const progress = progressReport();
  // The integrity, rollable and move-only reports follow the budgets (plan 37-05, D-08, D-09, D-13, v3.0 D-7).
  const nfrIntegrity = nfrFindings(nfrCatalog, nfrListing);
  const queueDone = moveOnlyReport(QUEUE_DONE_REL, QUEUE_DONE_ARCHIVE_REL);
  const decisions = moveOnlyReport(DECISIONS_REL, DECISIONS_ARCHIVE_REL);
  rollable = rollableSurfaces(board.doneRows, progress.bytes, progress.entries, BUDGETS);
  moveOnly = [queueDone.surface, decisions.surface];
  findings = sortFindings([
    ...board.findings,
    ...traceIndex,
    ...nfrIndex,
    ...tickets,
    ...nfrFiles,
    ...traceFiles,
    ...progress.findings,
    ...nfrIntegrity,
    ...queueDone.findings,
    ...decisions.findings,
  ]).map(printableFinding);
} catch (e) {
  couldNotRun(`the check failed unexpectedly: ${(e as Error).message}`);
}

const enforced = marker.state === "valid";
const exitCode = enforced && findings.length > 0 ? 1 : 0;

// Every line is composed before anything is printed, so a run that cannot finish never prints part of a result.
const out: string[] = [];
if (asJson) {
  const report = {
    ok: exitCode !== 1,
    marker: marker.state,
    enforced,
    findings: findings.map((f) => ({
      rel: f.rel,
      key: f.key,
      measured: f.measured,
      budget: f.budget,
      unit: f.unit,
      line: f.line ?? null,
      note: f.note ?? null,
    })),
    rollable: rollable.map((r) => r.surface),
    moveOnly,
  };
  out.push(JSON.stringify(report));
} else {
  // A ROLLABLE line and a MOVE-ONLY count line are reports: neither changes the exit code; the finding beneath
  // each does, by the marker.
  const reports = [
    ...rollable.map((r) => `ROLLABLE  ${formatRollable(r)} — run ${ROLL_COMMAND} ${printable(rootArg)}`),
    ...moveOnly.map((m) => `MOVE-ONLY ${m.live}: ${m.liveCount ?? "not listed"} live, ${m.archivedCount ?? "not listed"} archived`),
  ];
  if (enforced) {
    for (const f of findings) out.push(`FINDING  ${formatFinding(f)}`);
    out.push(...reports);
    if (findings.length === 0) out.push("No findings.");
  } else {
    if (marker.state === "invalid") out.push(`WARN     ${formatMarkerWarning(LAYOUT_MARKER_REL, printable(marker.reason))}`);
    for (const f of findings) out.push(`WARN     ${formatFinding(f)}`);
    out.push(...reports);
    if (marker.state === "absent" && findings.length > 0) {
      out.push(
        `LAYOUT   no layout marker at ${LAYOUT_MARKER_REL}: budget findings are warnings until the repository is ` +
          "migrated to the v3 layout",
      );
    }
    if (marker.state === "absent" && findings.length === 0) out.push("No findings.");
  }
}
process.exitCode = exitCode;
process.stdout.write(`${out.join("\n")}\n`);

// state-rules.ts — the one owner of every state budget rule and of the layout marker reader (phase 37,
// SPLIT-04, D-04, D-05, D-10, D-11, D-14).
//
// WHAT THIS OWNS. The rule that decides whether a state file breaks each of the nine budgets, the record rule
// (which directory entries are records, and so which the byte budgets measure), the rule that reads the
// layout marker, the one spelling of a finding, and the one order findings print in. Plan 37-05 adds the
// NFR index line grammar and its integrity rule (D-13), the progress-entry grammar (D-09), the rollable and
// move-only rules (D-08, v3.0 D-7); later plans add the roll planners beside them. The budget numbers are not
// owned here: they are BUDGETS in install/state-layout.ts, and a caller passes that object in. Nothing in
// this file spells a budget number or a state path; a caller passes every path in. The one path fragment
// here is the NFR link grammar's `nfr/` segment, which is part of the index line form, not a state path.
//
// WHAT IT DOES NOT DO. It reads no file and lists no directory. Every caller reads the text, or takes the
// size from lstat, and passes it in. So a budget check is read-only by construction, and the same rule gives
// the same answer in the structure validator (scripts/validate-agent-factory.ts) and in the host runnable
// state-check (plan 37-04).
//
// IMPORT EDGES. This module imports nothing at all, not even a type. Plan 37-03's generator copies its
// declarations verbatim into single-file host runnables and refuses any import that is not a `node:`
// module, so an import here would break that copy. The shapes it reads (a parsed board, the budgets) are
// therefore declared below as local structural types: the fields this module reads, and nothing else.
//
// UNITS. "bytes" are UTF-8 bytes, counted from the text's code units without encoding it (a lone surrogate
// counts as the three bytes of the replacement character, as Node's encoder writes it). "characters" are
// UTF-16 code units, the unit the board contract uses for its line bound.

/** The unit a budget is stated in. */
export type StateUnit = "bytes" | "characters" | "lines" | "rows";

/**
 * One broken budget, one file the check could not measure, or one integrity finding.
 *
 * For a budget finding `key` is a key of BUDGETS. `measured` is null when the file could not be measured (it
 * is not a regular file, or it could not be read); the finding still names the file, so nothing is dropped.
 * `line` is a one-based line number when the finding is about one line or one row.
 *
 * An integrity finding (the NFR index against the NFR files, a move-only copy) is about no budget: its key is
 * one of the non-budget keys below, `measured`, `budget` and `unit` are null, and `note` says what is wrong.
 */
export type StateFinding = {
  readonly rel: string;
  readonly key: string;
  readonly measured: number | null;
  readonly budget: number | null;
  readonly unit: StateUnit | null;
  readonly line?: number;
  readonly note?: string;
};

/** The keys of the findings that are about no budget (plan 37-05, D-13, v3.0 D-7). */
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

/** An integrity finding: about no budget, so it carries its note in place of a measure. */
export function integrityFinding(rel: string, key: IntegrityKey, note: string, line?: number): StateFinding {
  return { rel, key, measured: null, budget: null, unit: null, ...(line === undefined ? {} : { line }), note };
}

/** What the layout marker says (D-04, D-05, D-14). */
export type MarkerState =
  | { readonly state: "absent" }
  | { readonly state: "valid" }
  | { readonly state: "invalid"; readonly reason: string };

/** The budgets this module reads. The caller passes BUDGETS from install/state-layout.ts. */
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

/**
 * The three forms of one board document a caller passes in. `raw` is the text as read. `normalized` is
 * board-model's normalizeDocument(raw). `blanked` is board-model's stripHtmlComments(normalized), which
 * replaces every comment code unit with a space and keeps every newline, so its lines line up with the
 * lines of `normalized` code unit for code unit.
 */
export type BoardTexts = {
  readonly raw: string;
  readonly normalized: string;
  readonly blanked: string;
};

/** The parts of a parsed board (board-model's BoardModel) this module reads. */
export type BoardFacts = {
  readonly columns: readonly {
    readonly name: string;
    readonly line: number;
    readonly rows: readonly { readonly line: number }[];
  }[];
};

// ── Measures ─────────────────────────────────────────────────────────────────────────────────────

/** UTF-8 bytes of `text`, counted from its code units. */
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

// ── The layout marker (D-04, D-05, D-14) ─────────────────────────────────────────────────────────

/**
 * Read the layout marker. `text` is the marker file's content, or null when there is no marker file.
 *
 * Two normalizations run first, the two the board contract applies to board and ticket documents: one
 * leading byte-order mark is removed, and CRLF is folded to LF. The marker is valid when the result is
 * exactly `expected`, with or without exactly one trailing newline. Anything else is invalid, and the reason
 * says what is wrong without repeating the content, so a marker is never guessed at.
 */
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

/** The warning for a marker that is present and not valid. Budget findings stay warnings (D-05). */
export function formatMarkerWarning(rel: string, reason: string): string {
  return `${rel}: layout marker not recognized: ${reason}. Budget findings stay warnings.`;
}

/** The unit each budget is stated in. A Record over the budget keys, so a budget added without a unit fails typecheck. */
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

/** A finding for a file, line or row that measured over its budget. */
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

/**
 * The finding for a file the check could not measure: it is not a regular file, or it could not be listed or
 * read. It names the file and its budget, so a file that cannot be measured is reported, never dropped.
 */
export function unmeasuredFinding(
  rel: string,
  key: keyof StateBudgets,
  budgets: StateBudgets,
  note: string,
): StateFinding {
  return { rel, key, measured: null, budget: budgets[key], unit: UNITS[key], note };
}

// ── The board (boardBytes, boardRowChars, boardUpdatedLines) ─────────────────────────────────────

/** The prefix of a line that counts against BUDGETS.boardUpdatedLines, in either the canonical or the kit form. */
const UPDATED_PREFIX = "_Updated:";

/**
 * The board's budget findings.
 *
 * - boardBytes: the UTF-8 bytes of the raw text, as read.
 * - boardRowChars: for each ticket row of every column (`model.columns[].rows[]`), the UTF-16 code units of
 *   the normalized line the row sits on. `row.line` is one-based in the normalized text, as parseBoard
 *   numbers it. Epic rows, headings and every other line are not ticket rows and are not measured.
 * - boardUpdatedLines: the lines of the comment-blanked text that begin `_Updated:`. This counts the kit's
 *   placeholder form, which parseBoard does not read as an update, as well as the canonical one, and never
 *   a line inside an HTML comment. The finding's line is the first line over the budget.
 */
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

/** The column whose rows BUDGETS.doneRows counts. */
const DONE_COLUMN = "Done";

/**
 * The Done column's finding: the ticket rows under every column named `Done`, counted together. The finding's
 * line is the first row past the budget, the row the roll would move first.
 */
export function doneRowFindings(rel: string, model: BoardFacts, budgets: StateBudgets): StateFinding[] {
  const rows = model.columns.filter((c) => c.name === DONE_COLUMN).flatMap((c) => c.rows);
  if (rows.length <= budgets.doneRows) return [];
  return [over(rel, "doneRows", rows.length, budgets, rows[budgets.doneRows]?.line)];
}

// ── The two index files (indexEntryBytes) ────────────────────────────────────────────────────────

/** The two forms of an index document a caller passes in, as for BoardTexts. */
export type DocumentTexts = {
  readonly normalized: string;
  readonly blanked: string;
};

/**
 * The UTF-8 bytes of the part of `line` outside every HTML comment.
 *
 * `blankedLine` is the same line after board-model's stripHtmlComments, which turns each comment code unit
 * into a space, so the two line up code unit for code unit. A comment is therefore a run of spaces in
 * `blankedLine` under which `line` holds something other than a space (a comment always holds its `<!--`).
 * Every such run is left out whole; a run of spaces that was spaces in `line` too is counted. The only text
 * left out that is not comment is whitespace directly beside a comment.
 */
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

/** Every line of an index document over BUDGETS.indexEntryBytes, measured outside HTML comments. */
export function indexLineFindings(rel: string, texts: DocumentTexts, budgets: StateBudgets): StateFinding[] {
  const blanked = texts.blanked.split("\n");
  const findings: StateFinding[] = [];
  texts.normalized.split("\n").forEach((line, i) => {
    const bytes = bytesOutsideComments(line, blanked[i] ?? "");
    if (bytes > budgets.indexEntryBytes) findings.push(over(rel, "indexEntryBytes", bytes, budgets, i + 1));
  });
  return findings;
}

// ── Record files measured by size (ticketBytes, nfrBytes, traceBytes, progressBytes) ──────────────

/** The byte budgets a file is measured against by its lstat size. */
export type FileBudgetKey = "ticketBytes" | "nfrBytes" | "traceBytes" | "progressBytes";

/**
 * The finding for one file of `bytes` bytes (its lstat size), or null when it is within its budget. A trace
 * file is generated, so its finding names the ticket (the file stem; trace files are keyed by identifier)
 * and says the remedy is splitting the ticket's work, never editing the file (research Pitfall 10).
 */
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

// ── Which directory entries are records ──────────────────────────────────────────────────────────

/**
 * The record rule for the state checks (agent-factory/contracts/board.md): an entry whose name begins with
 * `.` is not a record. Returns the names that are, in code-unit order. Plan 37-05's integrity rules use
 * this, never a copy.
 */
export function recordEntryNames(names: readonly string[]): string[] {
  return names.filter((n) => !n.startsWith(".")).sort(compareCodeUnits);
}

/**
 * Which directory entries the byte budgets measure: the records that end `.md`. A caller passes the raw
 * listing and filters nothing itself. A keeper such as `.gitkeep` and a dot-prefixed `.md` file are not
 * records, so they are never measured. This is the definition of the input set, not an exemption list
 * (D-11): no record is left out by its name.
 */
export function budgetEntryNames(names: readonly string[]): string[] {
  return recordEntryNames(names).filter((n) => n.endsWith(".md"));
}

// ── The NFR index against the NFR files (D-13, SPLIT-02) ─────────────────────────────────────────

/** One well-formed NFR index line: the identifier, the link target as written, and its one-based line. */
export type NfrIndexEntry = { readonly id: string; readonly target: string; readonly line: number };

/** A line that begins `- [NFR` and does not match the index line grammar. */
export type NfrMalformedLine = { readonly line: number; readonly text: string };

/** What parseNfrIndex reads from an NFR catalog. */
export type NfrIndex = { readonly entries: readonly NfrIndexEntry[]; readonly malformed: readonly NfrMalformedLine[] };

/**
 * The one NFR index line grammar (agent-factory/contracts/board.md, `## Reconciliation and non-goals`):
 * `- [NFR-<digits>](<target>)`, then the end of the line or one space and free text. The target is captured as
 * written, so a wrong one is reported rather than read as another line shape; it is never opened.
 */
const NFR_INDEX_LINE = /^- \[(NFR-[0-9]+)\]\(([^)]*)\)(?: [\s\S]*)?$/;

/** The start every NFR index line has. A line that starts so and does not match NFR_INDEX_LINE is malformed. */
const NFR_LINE_START = "- [NFR";

/** The directory segment of every NFR link, relative to the catalog: the target for NFR-001 is `nfr/NFR-001.md`. */
const NFR_LINK_DIR = "nfr";

/** The one NFR file name grammar: `NFR-<digits>.md`. Nothing else about an NFR file is read (D-13). */
const NFR_FILE_NAME = /^NFR-[0-9]+\.md$/;

/**
 * The index lines of an NFR catalog. `blankedText` is the catalog after board-model's normalizeDocument and
 * stripHtmlComments, so a line inside an HTML comment is blank and line numbers stay those of the file.
 *
 * A line whose text, after any leading spaces, begins `- [NFR` is either an entry (it matches the grammar
 * exactly, with no leading space) or malformed. No such line is skipped. Every other line is not an index
 * line: a heading, a comment, a blank line, prose.
 */
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

/** The link target the grammar requires for `id`, derived from the identifier and never from link text. */
export function nfrLinkTarget(id: string): string {
  return `${NFR_LINK_DIR}/${id}.md`;
}

/**
 * The NFR index checked against the NFR files, in both directions (D-13): every index line names an existing
 * file and every NFR file has exactly one index line.
 *
 * `indexRel` is the catalog's path and `parsed` its parseNfrIndex result. `fileNames` is the raw listing of
 * the NFR directory at `nfrDirRel`; the record rule (recordEntryNames) is applied here, so a keeper such as
 * `.gitkeep` or `.DS_Store` is never a bad name and never unindexed. Every expected path is derived from an
 * identifier and compared as a string: this function touches no path, and no link text is ever followed.
 *
 * Findings: `nfr-malformed-line` and `nfr-link-mismatch` by line; one `nfr-duplicate-line` per identifier
 * with more than one line, naming every line; `nfr-missing-file` for an indexed identifier with no file;
 * `nfr-unindexed-file` for a well-named file no line names; `nfr-bad-file-name` for a record whose name is
 * not `NFR-<digits>.md`; one `nfr-case-collision` per group of names that differ only by letter case.
 */
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

// ── Dated progress entries, rollable surfaces and move-only copies (D-07, D-08, D-09, v3.0 D-7) ───

/** One dated status entry of the progress file: from its heading line to the line before the next `##` heading. */
export type DatedEntry = {
  readonly date: string;
  readonly heading: string;
  readonly startLine: number;
  readonly endLine: number;
};

/** One `##` section of the progress file that is not a dated status entry: standing content, never rolled. */
export type StandingSection = { readonly heading: string; readonly line: number };

/** What progressEntries reads from the progress file. */
export type ProgressEntries = { readonly dated: readonly DatedEntry[]; readonly standing: readonly StandingSection[] };

/** PLACEHOLDER (plan 37-05 RED): the progress-entry grammar lands in GREEN. */
export function progressEntries(_text: string): ProgressEntries {
  return { dated: [], standing: [] };
}

/** PLACEHOLDER (plan 37-05 RED). */
export function doneRowCount(_model: BoardFacts): number {
  return 0;
}

/** A surface state-roll moves entries out of. */
export type RollSurface = "done" | "progress";

/** One surface over its budget that state-roll can roll. */
export type RollableSurface = {
  readonly surface: RollSurface;
  readonly key: "doneRows" | "progressBytes";
  readonly measured: number;
  readonly budget: number;
  readonly unit: StateUnit;
};

/** PLACEHOLDER (plan 37-05 RED). */
export function rollableSurfaces(
  _doneRowCount: number | null,
  _progressBytes: number | null,
  _progress: ProgressEntries | null,
  _budgets: StateBudgets,
): RollableSurface[] {
  return [];
}

/** PLACEHOLDER (plan 37-05 RED). */
export function formatRollable(_r: RollableSurface): string {
  return "";
}

/** PLACEHOLDER (plan 37-05 RED). */
export function progressBytesFinding(
  rel: string,
  bytes: number,
  _progress: ProgressEntries | null,
  _decisionsRel: string,
  budgets: StateBudgets,
): StateFinding | null {
  return fileBytesFinding(rel, bytes, "progressBytes", budgets);
}

/** PLACEHOLDER (plan 37-05 RED). */
export function moveOnlyFindings(
  _liveRel: string,
  _liveNames: readonly string[],
  _archiveRel: string,
  _archiveNames: readonly string[],
): StateFinding[] {
  return [];
}

// ── Spelling and order ───────────────────────────────────────────────────────────────────────────

/** `n` with its digits grouped in threes by commas, independent of the host locale. */
function grouped(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * The one spelling of a finding:
 * `<rel>[:<line>]: <measured> <unit>, budget <budget> <unit> (BUDGETS.<key>)`, then ` — <note>` when the
 * finding carries one. A finding that could not be measured says so in place of the measured value.
 *
 * A finding about no budget (an integrity finding, whose budget is null) prints no budget clause:
 * `<rel>[:<line>]: <note> (<key>)`.
 */
export function formatFinding(f: StateFinding): string {
  const where = f.line === undefined ? f.rel : `${f.rel}:${f.line}`;
  if (f.budget === null || f.unit === null) return `${where}: ${f.note ?? "no detail"} (${f.key})`;
  const measured = f.measured === null ? "not measured" : `${grouped(f.measured)} ${f.unit}`;
  const note = f.note === undefined ? "" : ` — ${f.note}`;
  return `${where}: ${measured}, budget ${grouped(f.budget)} ${f.unit} (BUDGETS.${f.key})${note}`;
}

/**
 * `text` with every C0 code point, every C1 code point and DEL removed (agent-factory/contracts/board.md,
 * `## Control characters on the way out`). With `multiLine` true, tab and newline are kept. A caller applies
 * it to every value read from a state file (a path, a name, a title) before that value is printed or
 * serialized, so the cleaning never meets an escaped form.
 */
export function stripControlChars(text: string, multiLine: boolean): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const control = c < 0x20 || (c >= 0x7f && c <= 0x9f);
    if (!control || (multiLine && (c === 0x09 || c === 0x0a))) out += text[i];
  }
  return out;
}

/** Code-unit order, never the host locale's, so two runs on two hosts print the same order. */
function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Findings sorted by path, then budget key, then line (a finding with no line sorts first). */
export function sortFindings(list: readonly StateFinding[]): StateFinding[] {
  return [...list].sort(
    (a, b) =>
      compareCodeUnits(a.rel, b.rel) ||
      compareCodeUnits(a.key, b.key) ||
      (a.line ?? 0) - (b.line ?? 0),
  );
}

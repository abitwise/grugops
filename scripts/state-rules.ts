// state-rules.ts — the one owner of every state budget rule and of the layout marker reader (phase 37,
// SPLIT-04, D-04, D-05, D-10, D-11, D-14).
//
// WHAT THIS OWNS. The rule that decides whether a state file breaks each of the nine budgets, the record rule
// (which directory entries are records, and so which the byte budgets measure), the rule that reads the
// layout marker, the one spelling of a finding, and the one order findings print in. Plan 37-05 adds the
// NFR index line grammar and its integrity rule (D-13), the progress-entry grammar (D-09), the rollable and
// move-only rules (D-08, v3.0 D-7). Plan 37-10 adds the Done roll: its two planners, the line-conservation
// proof and an executor that takes its file operations as a parameter (D-07, D-08). The budget numbers are not
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
  | "move-only-unlisted"
  // Plan 37-09 (2026-10-22): state-check's trace freshness. A planned file that is missing, an unplanned
  // generated file, or a planned file that differs from a fresh render (trace-stale); a file that does not
  // start with the generated header (trace-hand-written); two ticket identifiers that fold to one trace file
  // name (trace-collision); and a trace that was not compared, by the path that stopped it (trace-not-compared).
  | "trace-stale"
  | "trace-hand-written"
  | "trace-collision"
  | "trace-not-compared";

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
  const rows = doneRows(model);
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
  return names.filter((n) => !n.startsWith(".")).sort(codeUnitOrder);
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

/** One dated status entry of the progress file: its heading's date, its heading text and its one-based line. */
export type DatedEntry = { readonly date: string; readonly heading: string; readonly line: number };

/** One `##` section of the progress file that is not a dated status entry: standing content, never rolled. */
export type StandingSection = { readonly heading: string; readonly line: number };

/** What progressEntries reads from the progress file: its `##` headings, sorted into the two kinds. */
export type ProgressEntries = { readonly dated: readonly DatedEntry[]; readonly standing: readonly StandingSection[] };

/** A `##` heading line: exactly two `#`, then a space or the end of the line. `###` and deeper never match. */
const SECTION_HEADING = /^##(?: |$)/;

/**
 * A dated status entry's heading (D-09): `## `, then an ISO date `YYYY-MM-DD`, then a space or the end of the
 * line. The date must also be a calendar date, so a heading such as `## 2026-13-01` is standing content.
 */
const DATED_HEADING = /^## [0-9]{4}-[0-9]{2}-[0-9]{2}(?: |$)/;

/** Whether `ymd` (`YYYY-MM-DD`, digits already checked) names a day of the proleptic Gregorian calendar. */
function isCalendarDate(ymd: string): boolean {
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  const day = Number(ymd.slice(8, 10));
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  return day >= 1 && day <= days;
}

/**
 * The `##` headings of the progress file, each classified (D-09). `text` is LF text; a caller that wants a
 * heading inside an HTML comment ignored passes it through board-model's stripHtmlComments first, which
 * keeps every line.
 *
 * A dated status entry is a `##` heading whose text begins with an ISO date followed by a space or the end of
 * the line: only those roll. Every other `##` heading is standing content (a directive, a ruling, `What
 * works`): it is listed so a caller can name it, and it never rolls. A `###` or deeper heading is neither.
 *
 * WHAT THIS DOES NOT ANSWER: where an entry ends. That is the section-extent question, and LANG-07 gives it
 * exactly one owner in this tree, scripts/frontmatter.ts (sectionEndIndex); a second answer here would be a
 * second section grammar (scripts/check-foundation-guards.test.ts, SECTION_EXTENT_OWNERS). state-check needs
 * only the classification. The roll planner of plan 37-11 takes each entry's extent from that owner.
 */
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

/** The ticket rows under every column named `Done`, counted together, in board order. */
function doneRows(model: BoardFacts): { readonly line: number }[] {
  return model.columns.filter((c) => c.name === DONE_COLUMN).flatMap((c) => c.rows);
}

/** How many ticket rows the Done column holds (BUDGETS.doneRows counts these). */
export function doneRowCount(model: BoardFacts): number {
  return doneRows(model).length;
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

/**
 * The surfaces a roll is due on, in the fixed order done, progress (D-07, D-08, D-09).
 *
 * - done: the Done column holds more than BUDGETS.doneRows rows. `doneRowCount` is null when the board was
 *   not read.
 * - progress: the progress file is over BUDGETS.progressBytes (`progressBytes` is its size, or null when it
 *   was not measured) and holds at least one dated status entry. A file of standing sections only is over
 *   budget and not rollable: rolling it would hide live rules (D-09).
 *
 * This says a roll is due. It moves nothing: state-roll does the moving.
 */
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

/** The one spelling of a rollable surface: `<surface>: <measured> <unit>, keeps <budget> <unit> (BUDGETS.<key>)`. */
export function formatRollable(r: RollableSurface): string {
  return `${r.surface}: ${grouped(r.measured)} ${r.unit}, keeps ${grouped(r.budget)} ${r.unit} (BUDGETS.${r.key})`;
}

/**
 * The progress file's byte finding. Over budget with no dated status entry, nothing in it can roll, so the
 * note names each standing `##` section and says it belongs in the decision records directory `decisionsRel`
 * (D-09). With a dated entry the finding carries no note: the ROLLABLE report says what to run. `progress` is
 * null when the file was not read; the finding is then the plain byte finding.
 */
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

/**
 * The move-only rule (SPLIT-06, v3.0 D-7): a record name present both in a live folder and in its archive
 * folder is a finding, because a move leaves one copy. Both raw listings go through recordEntryNames here, so
 * a keeper such as `.gitkeep` in both folders is not a copied record. One finding per name, in code-unit
 * order, naming both paths.
 */
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

// ── The Done roll (plan 37-10, D-07, D-08) ───────────────────────────────────────────────────────
//
// THE RULE. When the board's Done column holds more than `keep` (BUDGETS.doneRows) rows, the first `keep`
// rows stay: the contract writes the Done column newest first, so they are the most recent. Every later row
// moves, whole and in board order, to the top of the Done column of the Done archive, above the rows already
// there (agent-factory/contracts/board.md, `## The Done archive`). A row is moved as the raw line it is, so
// a CRLF board keeps its `\r` on every line that stays and every line that moves, and a leading byte-order
// mark stays on line 1, which is never a row.
//
// THE PROOF (D-08). executeRoll writes the archive first and the board second, re-reads both, and asks
// checkConservation whether the board equals its old lines with exactly the moved lines removed and the
// archive equals its old lines with exactly the moved block inserted at the planned line. checkConservation
// derives both expectations from the old texts itself; it never trusts the new texts it is checking. On any
// mismatch, or a write that throws, both files are written back to their old bytes, and an archive that did
// not exist before is removed.
//
// WHAT IS NEVER MOVED. A row line that carries any part of an HTML comment is refused, not moved: moving
// part of a comment would change which lines of the board and of the archive the comment hides. A board with
// two columns named Done is refused, because the newest rows of two columns have no defined order.
//
// NO I/O. The planners take texts and parsed models. The executor takes its file operations as a parameter,
// so the proof and the rollback are tested with a deliberately faulty io and run on a host through the
// embedded atomicWrite (scripts/runnable-ref/state-roll.ts).

/** The Done archive's only column heading (agent-factory/contracts/board.md, `## The Done archive`). */
export const DONE_ARCHIVE_HEADING = "## Done (WIP unlimited)";

/** The parts of a parsed board (board-model's BoardModel) the Done roll reads. */
export type RollBoardFacts = {
  readonly columns: readonly {
    readonly name: string;
    /** The heading line verbatim, after normalization. */
    readonly heading: string;
    readonly line: number;
    readonly rows: readonly { readonly id: string; readonly line: number }[];
  }[];
};

/** What planDoneRoll decided. `lines` are 1-based line numbers of the raw text; `texts` are those raw lines. */
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

/**
 * Which Done rows of a board move to the archive. `texts` are the board's three forms (BoardTexts) and
 * `model` is parseBoard over `texts.raw`; `keep` is BUDGETS.doneRows. A board with no Done column, or with
 * at most `keep` Done rows, has nothing to roll.
 */
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

/**
 * The text a created Done archive starts from: its one heading, ending as the first moved line ends (`\r\n`
 * when that line carries `\r`, else `\n`). The moved block is inserted on its line 2.
 */
export function doneArchiveSkeleton(texts: readonly string[]): string {
  return `${DONE_ARCHIVE_HEADING}${texts[0]?.endsWith("\r") === true ? "\r" : ""}\n`;
}

/** What planArchiveInsert decided: the text the block goes into, the 0-based line it goes on, and the result. */
export type ArchiveInsertPlan =
  | { readonly kind: "refuse"; readonly reason: string }
  | {
      readonly kind: "insert";
      readonly created: boolean;
      readonly base: string;
      readonly at: number;
      readonly text: string;
    };

/** `lines` of `text` (split on `\n`) with `block` inserted before the 0-based line `at`, joined again. */
function insertLines(text: string, at: number, block: readonly string[]): string {
  const lines = text.split("\n");
  return [...lines.slice(0, at), ...block, ...lines.slice(at)].join("\n");
}

/**
 * Where the moved rows go in the Done archive, and the archive text after they are there. `archive` is null
 * when the archive does not exist: it is then created with its one heading and the rows directly under it,
 * in the given order. Otherwise the rows go directly above the archive's first Done row (newest first), or
 * directly under its heading when it holds no row yet. The archive must carry exactly one column, headed
 * `## Done (WIP unlimited)`; anything else is refused and never guessed at.
 */
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

/** One planned Done roll, everything executeRoll and checkConservation need. */
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

/** The board text with the 1-based lines in `lines` removed, every other line kept byte for byte. */
function removeLines(text: string, lines: readonly number[]): string {
  const drop = new Set(lines);
  return text
    .split("\n")
    .filter((_, i) => !drop.has(i + 1))
    .join("\n");
}

/** One roll plan from the two planners' answers and the two files as read. */
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

/** The first index where two line arrays differ, or -1 when they are equal. */
function firstDifference(a: readonly string[], b: readonly string[]): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return -1;
}

/**
 * The line-conservation proof (D-08): null when the files `after` holds are exactly what the roll may write,
 * or the first mismatch, named. Both expectations are derived here from `before` and the plan's lines,
 * texts and insert position, never from the plan's own new texts:
 *
 * - the board equals its old lines with exactly the planned lines removed, and each removed line is the
 *   planned text;
 * - the archive equals its old lines (or, when it did not exist, the created skeleton) with exactly the
 *   planned block inserted before the planned line.
 */
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

/** The file operations executeRoll uses. `read` returns null for an absent file; each may throw. */
export type RollIo = {
  read(rel: string): string | null;
  write(rel: string, text: string): void;
  remove(rel: string): void;
};

/** What executeRoll did. */
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

/** A thrown value's message, for a reason. */
function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Run one roll through `io` (D-08). Both files are re-read first and must equal the plan's `before`, or
 * nothing is written. Then the archive is written, then the board; both are re-read and checkConservation
 * proves the result. On a mismatch, or a write or read that throws, the board is written back to its old
 * bytes, then the archive is (or removed, when it did not exist before), and both are re-read to confirm it.
 */
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

// ── Spelling and order ───────────────────────────────────────────────────────────────────────────

/**
 * `n` with its digits grouped in threes by commas, independent of the host locale. The pattern consumes the
 * digit before each comma (2026-10-22, plan 37-08): a pure zero-width lookahead is refused under scripts/ by
 * the closed lookahead class in scripts/check-uat-oracles.test.ts. Same output for every integer.
 */
function grouped(n: number): string {
  return String(n).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
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

/** Code-unit order, never the host locale's, so every run prints the same order whatever the locale. */
function codeUnitOrder(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Findings sorted by path, then budget key, then line (a finding with no line sorts first). */
export function sortFindings(list: readonly StateFinding[]): StateFinding[] {
  return [...list].sort(
    (a, b) =>
      codeUnitOrder(a.rel, b.rel) ||
      codeUnitOrder(a.key, b.key) ||
      (a.line ?? 0) - (b.line ?? 0),
  );
}

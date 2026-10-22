// state-rules.ts — the one owner of every state budget rule and of the layout marker reader (phase 37,
// SPLIT-04, D-04, D-05, D-10, D-11, D-14).
//
// WHAT THIS OWNS. The rule that decides whether a state file breaks a budget, the rule that reads the layout
// marker, the one spelling of a budget finding, and the one order findings print in. Later plans of phase 37
// add the index-line, progress-entry and roll rules here, beside these. The budget numbers are not owned
// here: they are BUDGETS in install/state-layout.ts, and a caller passes that object in. Nothing in this file
// spells a budget number or a state path.
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
 * One broken budget, or one file the check could not measure.
 *
 * `key` is a key of BUDGETS. `measured` is null when the file could not be measured (it is not a regular
 * file, or it could not be read); the finding still names the file, so nothing is dropped. `line` is a
 * one-based line number when the budget is about one line or one row.
 */
export type StateFinding = {
  readonly rel: string;
  readonly key: string;
  readonly measured: number | null;
  readonly budget: number;
  readonly unit: StateUnit;
  readonly line?: number;
  readonly note?: string;
};

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

// ── The board (BUDGETS.boardBytes) ───────────────────────────────────────────────────────────────

/** The board's budget findings. */
export function boardBudgetFindings(
  rel: string,
  texts: BoardTexts,
  _model: BoardFacts,
  budgets: StateBudgets,
): StateFinding[] {
  const findings: StateFinding[] = [];
  const bytes = utf8Bytes(texts.raw);
  if (bytes > budgets.boardBytes) {
    findings.push({ rel, key: "boardBytes", measured: bytes, budget: budgets.boardBytes, unit: "bytes" });
  }
  return findings;
}

// ── RED stubs (plan 37-02 task 2): signatures only, replaced by the GREEN commit ─────────────────

/** The two forms of an index document a caller passes in. */
export type DocumentTexts = {
  readonly normalized: string;
  readonly blanked: string;
};

/** The byte budgets a file is measured against by its lstat size. */
export type FileBudgetKey = "ticketBytes" | "nfrBytes" | "traceBytes" | "progressBytes";

export function indexLineFindings(_rel: string, _texts: DocumentTexts, _budgets: StateBudgets): StateFinding[] {
  return [];
}

export function fileBytesFinding(
  _rel: string,
  _bytes: number,
  _key: FileBudgetKey,
  _budgets: StateBudgets,
): StateFinding | null {
  return null;
}

export function unmeasuredFinding(
  rel: string,
  key: keyof StateBudgets,
  budgets: StateBudgets,
  note: string,
): StateFinding {
  return { rel, key, measured: null, budget: budgets[key], unit: "bytes", note };
}

export function doneRowFindings(_rel: string, _model: BoardFacts, _budgets: StateBudgets): StateFinding[] {
  return [];
}

export function recordEntryNames(_names: readonly string[]): string[] {
  return [];
}

export function budgetEntryNames(_names: readonly string[]): string[] {
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
 */
export function formatFinding(f: StateFinding): string {
  const where = f.line === undefined ? f.rel : `${f.rel}:${f.line}`;
  const measured = f.measured === null ? "not measured" : `${grouped(f.measured)} ${f.unit}`;
  const note = f.note === undefined ? "" : ` — ${f.note}`;
  return `${where}: ${measured}, budget ${grouped(f.budget)} ${f.unit} (BUDGETS.${f.key})${note}`;
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

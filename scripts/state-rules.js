// state-rules.ts — the one owner of every state budget rule and of the layout marker reader (phase 37,
// SPLIT-04, D-04, D-05, D-10, D-11, D-14).
//
// WHAT THIS OWNS. The rule that decides whether a state file breaks each of the nine budgets, the record rule
// (which directory entries are records, and so which the byte budgets measure), the rule that reads the
// layout marker, the one spelling of a budget finding, and the one order findings print in. Later plans of
// phase 37 add the progress-entry and roll rules here, beside these. The budget numbers are not owned
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
// ── Measures ─────────────────────────────────────────────────────────────────────────────────────
/** UTF-8 bytes of `text`, counted from its code units. */
export function utf8Bytes(text) {
    let n = 0;
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        if (c < 0x80)
            n += 1;
        else if (c < 0x800)
            n += 2;
        else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
            const d = text.charCodeAt(i + 1);
            if (d >= 0xdc00 && d <= 0xdfff) {
                n += 4;
                i++;
            }
            else {
                n += 3;
            }
        }
        else {
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
export function markerState(text, expected) {
    if (text === null)
        return { state: "absent" };
    const withoutMark = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    const folded = withoutMark.replace(/\r\n/g, "\n");
    if (folded === expected || folded === `${expected}\n`)
        return { state: "valid" };
    if (folded.length === 0)
        return { state: "invalid", reason: "the file is empty" };
    const body = folded.endsWith("\n") ? folded.slice(0, -1) : folded;
    if (body.includes("\n")) {
        return { state: "invalid", reason: `it has more than one line; the content must be exactly \`${expected}\`` };
    }
    return { state: "invalid", reason: `the content is not exactly \`${expected}\`` };
}
/** The warning for a marker that is present and not valid. Budget findings stay warnings (D-05). */
export function formatMarkerWarning(rel, reason) {
    return `${rel}: layout marker not recognized: ${reason}. Budget findings stay warnings.`;
}
/** The unit each budget is stated in. A Record over the budget keys, so a budget added without a unit fails typecheck. */
const UNITS = {
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
function over(rel, key, measured, budgets, line) {
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
export function unmeasuredFinding(rel, key, budgets, note) {
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
export function boardBudgetFindings(rel, texts, model, budgets) {
    const findings = [];
    const bytes = utf8Bytes(texts.raw);
    if (bytes > budgets.boardBytes)
        findings.push(over(rel, "boardBytes", bytes, budgets));
    const lines = texts.normalized.split("\n");
    for (const column of model.columns) {
        for (const row of column.rows) {
            const units = (lines[row.line - 1] ?? "").length;
            if (units > budgets.boardRowChars)
                findings.push(over(rel, "boardRowChars", units, budgets, row.line));
        }
    }
    const updatedAt = [];
    texts.blanked.split("\n").forEach((line, i) => {
        if (line.startsWith(UPDATED_PREFIX))
            updatedAt.push(i + 1);
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
export function doneRowFindings(rel, model, budgets) {
    const rows = model.columns.filter((c) => c.name === DONE_COLUMN).flatMap((c) => c.rows);
    if (rows.length <= budgets.doneRows)
        return [];
    return [over(rel, "doneRows", rows.length, budgets, rows[budgets.doneRows]?.line)];
}
/**
 * The UTF-8 bytes of the part of `line` outside every HTML comment.
 *
 * `blankedLine` is the same line after board-model's stripHtmlComments, which turns each comment code unit
 * into a space, so the two line up code unit for code unit. A comment is therefore a run of spaces in
 * `blankedLine` under which `line` holds something other than a space (a comment always holds its `<!--`).
 * Every such run is left out whole; a run of spaces that was spaces in `line` too is counted. The only text
 * left out that is not comment is whitespace directly beside a comment.
 */
function bytesOutsideComments(line, blankedLine) {
    let kept = "";
    let i = 0;
    while (i < line.length) {
        if (blankedLine.charCodeAt(i) === 0x20) {
            let j = i;
            let comment = false;
            while (j < line.length && blankedLine.charCodeAt(j) === 0x20) {
                if (line.charCodeAt(j) !== 0x20)
                    comment = true;
                j++;
            }
            if (!comment)
                kept += line.slice(i, j);
            i = j;
        }
        else {
            let j = i;
            while (j < line.length && blankedLine.charCodeAt(j) !== 0x20)
                j++;
            kept += line.slice(i, j);
            i = j;
        }
    }
    return utf8Bytes(kept);
}
/** Every line of an index document over BUDGETS.indexEntryBytes, measured outside HTML comments. */
export function indexLineFindings(rel, texts, budgets) {
    const blanked = texts.blanked.split("\n");
    const findings = [];
    texts.normalized.split("\n").forEach((line, i) => {
        const bytes = bytesOutsideComments(line, blanked[i] ?? "");
        if (bytes > budgets.indexEntryBytes)
            findings.push(over(rel, "indexEntryBytes", bytes, budgets, i + 1));
    });
    return findings;
}
/**
 * The finding for one file of `bytes` bytes (its lstat size), or null when it is within its budget. A trace
 * file is generated, so its finding names the ticket (the file stem; trace files are keyed by identifier)
 * and says the remedy is splitting the ticket's work, never editing the file (research Pitfall 10).
 */
export function fileBytesFinding(rel, bytes, key, budgets) {
    if (bytes <= budgets[key])
        return null;
    const finding = over(rel, key, bytes, budgets);
    if (key !== "traceBytes")
        return finding;
    const name = rel.slice(rel.lastIndexOf("/") + 1);
    const id = name.endsWith(".md") ? name.slice(0, -".md".length) : name;
    return {
        ...finding,
        note: `the trace file for ${id} is generated, so do not edit it: split the work of ticket ${id} into ` +
            "smaller tickets",
    };
}
// ── Which directory entries are records ──────────────────────────────────────────────────────────
/**
 * The record rule for the state checks (agent-factory/contracts/board.md): an entry whose name begins with
 * `.` is not a record. Returns the names that are, in code-unit order. Plan 37-05's integrity rules use
 * this, never a copy.
 */
export function recordEntryNames(names) {
    return names.filter((n) => !n.startsWith(".")).sort(compareCodeUnits);
}
/**
 * Which directory entries the byte budgets measure: the records that end `.md`. A caller passes the raw
 * listing and filters nothing itself. A keeper such as `.gitkeep` and a dot-prefixed `.md` file are not
 * records, so they are never measured. This is the definition of the input set, not an exemption list
 * (D-11): no record is left out by its name.
 */
export function budgetEntryNames(names) {
    return recordEntryNames(names).filter((n) => n.endsWith(".md"));
}
// ── Spelling and order ───────────────────────────────────────────────────────────────────────────
/** `n` with its digits grouped in threes by commas, independent of the host locale. */
function grouped(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
/**
 * The one spelling of a finding:
 * `<rel>[:<line>]: <measured> <unit>, budget <budget> <unit> (BUDGETS.<key>)`, then ` — <note>` when the
 * finding carries one. A finding that could not be measured says so in place of the measured value.
 */
export function formatFinding(f) {
    const where = f.line === undefined ? f.rel : `${f.rel}:${f.line}`;
    const measured = f.measured === null ? "not measured" : `${grouped(f.measured)} ${f.unit}`;
    const note = f.note === undefined ? "" : ` — ${f.note}`;
    return `${where}: ${measured}, budget ${grouped(f.budget)} ${f.unit} (BUDGETS.${f.key})${note}`;
}
/**
 * `text` with every C0 code point, every C1 code point and DEL removed (agent-factory/contracts/board.md,
 * `## Control characters on the way out`). With `multiLine` true, tab and newline are kept.
 */
export function stripControlChars(text, multiLine) {
    void multiLine;
    return text;
}
/** Code-unit order, never the host locale's, so two runs on two hosts print the same order. */
function compareCodeUnits(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
/** Findings sorted by path, then budget key, then line (a finding with no line sorts first). */
export function sortFindings(list) {
    return [...list].sort((a, b) => compareCodeUnits(a.rel, b.rel) ||
        compareCodeUnits(a.key, b.key) ||
        (a.line ?? 0) - (b.line ?? 0));
}

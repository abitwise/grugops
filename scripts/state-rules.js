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
/** An integrity finding: about no budget, so it carries its note in place of a measure. */
export function integrityFinding(rel, key, note, line) {
    return { rel, key, measured: null, budget: null, unit: null, ...(line === undefined ? {} : { line }), note };
}
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
    const rows = doneRows(model);
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
export function parseNfrIndex(blankedText) {
    const entries = [];
    const malformed = [];
    blankedText.split("\n").forEach((text, i) => {
        const m = NFR_INDEX_LINE.exec(text);
        if (m !== null)
            entries.push({ id: m[1] ?? "", target: m[2] ?? "", line: i + 1 });
        else if (text.trimStart().startsWith(NFR_LINE_START))
            malformed.push({ line: i + 1, text });
    });
    return { entries, malformed };
}
/** The link target the grammar requires for `id`, derived from the identifier and never from link text. */
export function nfrLinkTarget(id) {
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
export function nfrIntegrityFindings(indexRel, parsed, fileNames, nfrDirRel) {
    const findings = [];
    const records = recordEntryNames(fileNames);
    const present = new Set(records);
    for (const m of parsed.malformed) {
        findings.push(integrityFinding(indexRel, "nfr-malformed-line", "this line begins `- [NFR` and is not an index line `- [NFR-<digits>](nfr/NFR-<digits>.md) <text>`", m.line));
    }
    const linesById = new Map();
    for (const e of parsed.entries) {
        const group = linesById.get(e.id);
        if (group === undefined)
            linesById.set(e.id, [e]);
        else
            group.push(e);
    }
    for (const [id, group] of linesById) {
        const first = group[0];
        if (first === undefined)
            continue;
        if (group.length > 1) {
            findings.push(integrityFinding(indexRel, "nfr-duplicate-line", `${id} has ${group.length} index lines (lines ${group.map((e) => e.line).join(", ")}); keep exactly one`, first.line));
        }
        for (const e of group) {
            if (e.target !== nfrLinkTarget(id)) {
                findings.push(integrityFinding(indexRel, "nfr-link-mismatch", `the link of ${id} must be \`${nfrLinkTarget(id)}\`, the path derived from its identifier; the link ` +
                    "as written was not followed", e.line));
            }
        }
        if (!present.has(`${id}.md`)) {
            findings.push(integrityFinding(`${nfrDirRel}/${id}.md`, "nfr-missing-file", `${indexRel} indexes ${id} and this file does not exist`));
        }
    }
    for (const name of records) {
        const rel = `${nfrDirRel}/${name}`;
        if (!NFR_FILE_NAME.test(name)) {
            findings.push(integrityFinding(rel, "nfr-bad-file-name", "the name is not `NFR-<digits>.md`, so no index line can name it"));
            continue;
        }
        const id = name.slice(0, -".md".length);
        if (!linesById.has(id)) {
            findings.push(integrityFinding(rel, "nfr-unindexed-file", `no line of ${indexRel} names ${id}; add exactly one line \`- [${id}](${nfrLinkTarget(id)}) <category>: <target>\``));
        }
    }
    const namesByFold = new Map();
    for (const name of records) {
        const fold = name.toLowerCase();
        const group = namesByFold.get(fold);
        if (group === undefined)
            namesByFold.set(fold, [name]);
        else
            group.push(name);
    }
    for (const group of namesByFold.values()) {
        const first = group[0];
        if (first === undefined || group.length < 2)
            continue;
        findings.push(integrityFinding(`${nfrDirRel}/${first}`, "nfr-case-collision", `these names differ only by letter case: ${group.join(", ")}; keep one`));
    }
    return findings;
}
/** A `##` heading line: exactly two `#`, then a space or the end of the line. `###` and deeper never match. */
const SECTION_HEADING = /^##(?: |$)/;
/**
 * A dated status entry's heading (D-09): `## `, then an ISO date `YYYY-MM-DD`, then a space or the end of the
 * line. The date must also be a calendar date, so a heading such as `## 2026-13-01` is standing content.
 */
const DATED_HEADING = /^## [0-9]{4}-[0-9]{2}-[0-9]{2}(?: |$)/;
/** Whether `ymd` (`YYYY-MM-DD`, digits already checked) names a day of the proleptic Gregorian calendar. */
function isCalendarDate(ymd) {
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
export function progressEntries(text) {
    const dated = [];
    const standing = [];
    for (const [n, line] of text.split("\n").entries()) {
        if (!SECTION_HEADING.test(line))
            continue;
        const heading = line.slice("## ".length);
        const date = heading.slice(0, "YYYY-MM-DD".length);
        if (DATED_HEADING.test(line) && isCalendarDate(date))
            dated.push({ date, heading, line: n + 1 });
        else
            standing.push({ heading, line: n + 1 });
    }
    return { dated, standing };
}
/** The ticket rows under every column named `Done`, counted together, in board order. */
function doneRows(model) {
    return model.columns.filter((c) => c.name === DONE_COLUMN).flatMap((c) => c.rows);
}
/** How many ticket rows the Done column holds (BUDGETS.doneRows counts these). */
export function doneRowCount(model) {
    return doneRows(model).length;
}
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
export function rollableSurfaces(doneRowCount, progressBytes, progress, budgets) {
    const out = [];
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
export function formatRollable(r) {
    return `${r.surface}: ${grouped(r.measured)} ${r.unit}, keeps ${grouped(r.budget)} ${r.unit} (BUDGETS.${r.key})`;
}
/**
 * The progress file's byte finding. Over budget with no dated status entry, nothing in it can roll, so the
 * note names each standing `##` section and says it belongs in the decision records directory `decisionsRel`
 * (D-09). With a dated entry the finding carries no note: the ROLLABLE report says what to run. `progress` is
 * null when the file was not read; the finding is then the plain byte finding.
 */
export function progressBytesFinding(rel, bytes, progress, decisionsRel, budgets) {
    const finding = fileBytesFinding(rel, bytes, "progressBytes", budgets);
    if (finding === null || progress === null || progress.dated.length > 0)
        return finding;
    const sections = progress.standing.length === 0
        ? "it has no `##` section, so its text belongs"
        : `its standing sections ${progress.standing.map((s) => `\`## ${s.heading}\``).join(", ")} belong`;
    return {
        ...finding,
        note: "it holds no dated status entry (a `## YYYY-MM-DD` heading), so nothing in it can roll; " +
            `${sections} in ${decisionsRel}/ as decision records`,
    };
}
/**
 * The move-only rule (SPLIT-06, v3.0 D-7): a record name present both in a live folder and in its archive
 * folder is a finding, because a move leaves one copy. Both raw listings go through recordEntryNames here, so
 * a keeper such as `.gitkeep` in both folders is not a copied record. One finding per name, in code-unit
 * order, naming both paths.
 */
export function moveOnlyFindings(liveRel, liveNames, archiveRel, archiveNames) {
    const archived = new Set(recordEntryNames(archiveNames));
    return recordEntryNames(liveNames)
        .filter((name) => archived.has(name))
        .map((name) => integrityFinding(`${liveRel}/${name}`, "move-only-copy", `${archiveRel}/${name} holds the same name, and a move leaves one copy: this record is in both folders`));
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
 *
 * A finding about no budget (an integrity finding, whose budget is null) prints no budget clause:
 * `<rel>[:<line>]: <note> (<key>)`.
 */
export function formatFinding(f) {
    const where = f.line === undefined ? f.rel : `${f.rel}:${f.line}`;
    if (f.budget === null || f.unit === null)
        return `${where}: ${f.note ?? "no detail"} (${f.key})`;
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
export function stripControlChars(text, multiLine) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        const control = c < 0x20 || (c >= 0x7f && c <= 0x9f);
        if (!control || (multiLine && (c === 0x09 || c === 0x0a)))
            out += text[i];
    }
    return out;
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

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
//   exit 2 → the check could not run: a bad argument, a root that is not a readable directory, a required
//            file that is present and cannot be read, or an unexpected error, reported on stderr by name and
//            never surfacing as Node's own exit 1 (plan 37-20). Exit 2 is never a pass: it prints nothing on
//            stdout.
// With `--json`, stdout carries exactly one JSON document, `{ ok, marker, enforced, findings, rollable,
// moveOnly, trace }`, where `ok` is
// false exactly when the exit code is 1, `marker` is "absent", "valid" or "invalid", and `enforced` is true
// when the marker is valid. Each finding carries rel, key, measured, budget, unit, line and note (budget and
// unit are null on a finding about no budget). The document also carries `rollable`, the surfaces a roll is
// due on in the fixed order done, progress, and `moveOnly`, one { live, archive, liveCount, archivedCount }
// per move-only surface, and `trace`, { compared, findings }: whether the rendered trace was compared with the
// published notes, and the trace findings (plan 37-09). `compared` is false whenever the compare did not run.
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
// D-09), naming the state-roll command; which `##` lines are dated entries is asked of the embedded
// sectionEndIndex, the section-extent owner state-roll's planner asks too, so a fenced example heading is no
// entry for either (plan 37-23, WR-02), and a `MOVE-ONLY` line per move-only surface with its live and
// archived record counts, printed on every run. state-check itself never moves anything.
//
// TRACE FRESHNESS (plan 37-09, D-01, D-03). Last, it checks that the rendered trace files match the published
// notes, with the renderer's own code: the embedded collectTraceNotes reads every task of the live and the
// archive context roots through the embedded note reader (readRawNotesWithSkips, its skip arms and its seal
// check, then recordFromParsed), planTraceTree plans the tree, and compareTraceTree compares it with the tree on
// disk. compareTraceTree owns which entries of the trace directory count (plan 37-07: a name beginning with `.`
// is never one), so this file filters no listing. Each missing, extra or changed file is a `trace-stale` finding
// naming the render command; a file that does not start with the generated header, two ticket identifiers that
// fold to one file name, and a path that stops the compare are findings too, all under the marker's severity.
// A hand-written index means the repository's trace is not rendered yet: it is one finding by name and nothing
// is compared. A `TRACE` line, printed only after a compare, is the renderer's own --check summary with its read
// and skip counts. A note read that was not complete is never compared (plan 37-21, D-17, CR-01): the embedded
// planCompleteTraceTree, the one predicate the renderer asks too, gives no plan when a task could not be read or
// a note was skipped under an I/O arm (only the trust arms unparseable and unsealed are skips), and each such
// task or note is one `trace-not-compared` finding by name, under the marker's severity, with no TRACE line, so
// the trace is never reported fresh from a partial read. A FIFO, a link or anything else that is not a regular
// file at a compared path is could-not-run (exit 2).
//
// SIBLINGS (plan 37-24, D-17, WR-05, AUTH-1). state-check.js, trace-render.js and state-roll.js are installed
// side by side and never updated in place, and each embeds its own generated copy of shared authorities (the trace
// model, BUDGETS). Each generated region therefore carries a build stamp, RUNNABLE_SET_STAMP, which the generator
// computes over all three programs' generated bodies, with RUNNABLE_SET (the programs built together) and
// RUNNABLE_SELF. After the trace report, this file reads every other program in RUNNABLE_SET from its own directory
// through the embedded non-blocking reader, and asks the embedded readRunnableStamp (scripts/runnable-stamp.ts, the
// one owner of the stamp line's shape) for its stamp. A sibling that is absent is no finding: a host may run this
// file alone. A sibling whose stamp differs from this file's own, that carries no stamp or more than one, or that is
// present and could not be read (unopenable, not a regular file, above the ceiling) is one runnable-version-skew
// finding naming it, under the marker's severity like every integrity finding. The remedy is stated to a human:
// remove the three programs and install them again together. This file never replaces or removes one.
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
// nothing else (the note reader's seal check hashes through node:crypto, which reads only). The hand-written part below imports them as namespaces, so the names the generated region
// imports never collide with its own.
//
// NOTHING HERE IS RETYPED. Every budget number, state path and rule this file uses sits in the generated
// region, copied verbatim from its authority by scripts/generate-runnable-embeds.ts: BUDGETS and the state
// paths from install/state-layout.ts, the budget, record, marker and sanitizing rules from
// scripts/state-rules.ts, the board grammar from scripts/board-model.ts, the trace model from
// scripts/trace-model.ts, the non-blocking reader and the note read path from scripts/context-io.ts (never
// its writer), and the stamp reader from scripts/runnable-stamp.ts. scripts/runnable-embeds-freshness.ts fails
// CI when the region differs from a fresh derivation.
// The one text retyped here is the renderer's counts line, which trace-model.ts does not export; the TRACE
// case in state-check.test.ts holds it equal to the renderer's own output on one repository.
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
import { createHash } from "node:crypto";
import { closeSync, constants as fsConstants, fstatSync, openSync, readSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
export const RUNNABLE_SET_STAMP = "sha256:4f9ef10f423294e9367c9eb9bc11c072e09505f6b221144ed646bb9539466581";
export const RUNNABLE_SET = Object.freeze(["state-check.js", "state-roll.js", "trace-render.js"]);
export const RUNNABLE_SELF = "state-check.js";
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
export const CONTEXT_REL = `${GRUGOPS_DIR_REL}/context`;
export const QUEUE_REL = `${GRUGOPS_DIR_REL}/queue`;
export const QUEUE_DONE_REL = `${QUEUE_REL}/done`;
export const GRUGOPS_ARCHIVE_REL = `${GRUGOPS_DIR_REL}/archive`;
export const CONTEXT_ARCHIVE_REL = `${GRUGOPS_ARCHIVE_REL}/context`;
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
});
export function integrityFinding(rel, key, note, line) {
    return { rel, key, measured: null, budget: null, unit: null, ...(line === undefined ? {} : { line }), note };
}
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
export function formatMarkerWarning(rel, reason) {
    return `${rel}: layout marker not recognized: ${reason}. Budget findings stay warnings.`;
}
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
export function unmeasuredFinding(rel, key, budgets, note) {
    return { rel, key, measured: null, budget: budgets[key], unit: UNITS[key], note };
}
const UPDATED_PREFIX = "_Updated:";
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
const DONE_COLUMN = "Done";
export function doneRowFindings(rel, model, budgets) {
    const rows = doneRows(model);
    if (rows.length <= budgets.doneRows)
        return [];
    return [over(rel, "doneRows", rows.length, budgets, rows[budgets.doneRows]?.line)];
}
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
export function recordEntryNames(names) {
    return names.filter((n) => !n.startsWith(".")).sort(codeUnitOrder);
}
export function budgetEntryNames(names) {
    return recordEntryNames(names).filter((n) => n.endsWith(".md"));
}
const NFR_INDEX_LINE = /^- \[(NFR-[0-9]+)\]\(([^)]*)\)(?: [\s\S]*)?$/;
const NFR_LINE_START = "- [NFR";
const NFR_LINK_DIR = "nfr";
const NFR_FILE_NAME = /^NFR-[0-9]+\.md$/;
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
export function nfrLinkTarget(id) {
    return `${NFR_LINK_DIR}/${id}.md`;
}
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
const SECTION_HEADING = /^##(?: |$)/;
const DATED_HEADING = /^## [0-9]{4}-[0-9]{2}-[0-9]{2}(?: |$)/;
function isCalendarDate(ymd) {
    const year = Number(ymd.slice(0, 4));
    const month = Number(ymd.slice(5, 7));
    const day = Number(ymd.slice(8, 10));
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
    return day >= 1 && day <= days;
}
export function progressEntries(text, sectionEnd) {
    const dated = [];
    const standing = [];
    for (const [n, line] of text.split("\n").entries()) {
        if (!SECTION_HEADING.test(line) || sectionEnd(text, n, 2) !== n)
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
function doneRows(model) {
    return model.columns.filter((c) => c.name === DONE_COLUMN).flatMap((c) => c.rows);
}
export function doneRowCount(model) {
    return doneRows(model).length;
}
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
export function formatRollable(r) {
    return `${r.surface}: ${grouped(r.measured)} ${r.unit}, keeps ${grouped(r.budget)} ${r.unit} (BUDGETS.${r.key})`;
}
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
export function moveOnlyFindings(liveRel, liveNames, archiveRel, archiveNames) {
    const archived = new Set(recordEntryNames(archiveNames));
    return recordEntryNames(liveNames)
        .filter((name) => archived.has(name))
        .map((name) => integrityFinding(`${liveRel}/${name}`, "move-only-copy", `${archiveRel}/${name} holds the same name, and a move leaves one copy: this record is in both folders`));
}
function grouped(n) {
    return String(n).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}
export function formatFinding(f) {
    const where = f.line === undefined ? f.rel : `${f.rel}:${f.line}`;
    if (f.budget === null || f.unit === null)
        return `${where}: ${f.note ?? "no detail"} (${f.key})`;
    const measured = f.measured === null ? "not measured" : `${grouped(f.measured)} ${f.unit}`;
    const note = f.note === undefined ? "" : ` — ${f.note}`;
    return `${where}: ${measured}, budget ${grouped(f.budget)} ${f.unit} (BUDGETS.${f.key})${note}`;
}
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
function codeUnitOrder(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
export function sortFindings(list) {
    return [...list].sort((a, b) => codeUnitOrder(a.rel, b.rel) ||
        codeUnitOrder(a.key, b.key) ||
        (a.line ?? 0) - (b.line ?? 0));
}
// from scripts/board-model.ts
export const LARGE_BOARD_BYTES = 1_048_576;
export const LONG_LINE_CHARS = 65_536;
export const MAX_META_CHARS = 1_024;
export const MAX_UPDATE_TEXT_CHARS = 1_024;
const ELLIPSIS = "…";
function truncateAt(value, cap) {
    if (value.length <= cap)
        return { value, cut: false };
    let end = cap - 1;
    const lead = value.charCodeAt(end - 1);
    if (lead >= 0xd800 && lead <= 0xdbff)
        end -= 1;
    return { value: value.slice(0, end) + ELLIPSIS, cut: true };
}
export const HEADING_SUFFIXES = [
    { kind: "limited", pattern: /^\(WIP (\d{1,9})\/(\d{1,9})\)$/ },
    { kind: "unlimited", pattern: /^\(WIP unlimited\)$/ },
    { kind: "blocked", pattern: /^\(visible, time-tracked\)$/ },
];
const BLOCKED_COLUMN_NAME = "Blocked";
const H2_PREFIX = "## ";
const ROW = /^- \[([^\]]{1,64})\] (.*)$/;
const TICKET_ID = /^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/;
const EPIC_ID = /^(?:EPIC|FEAT)-\d{1,9}$/;
export function isTicketId(id) {
    return TICKET_ID.test(id) && !EPIC_ID.test(id);
}
const META_GAP = "  (";
const UPDATED = /^_Updated: (\d{4}-\d{2}-\d{2}) by (.*)$/;
export function stripHtmlComments(text) {
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
function blankKeepingNewlines(span) {
    return span.replace(/[^\n]/g, " ");
}
export function splitRow(rest) {
    const at = rest.indexOf(META_GAP);
    if (at === -1)
        return { title: rest.trimEnd(), meta: null, trailer: "" };
    let depth = 0;
    let j = at + 2;
    for (; j < rest.length; j++) {
        const ch = rest[j];
        if (ch === "(") {
            depth += 1;
        }
        else if (ch === ")") {
            depth -= 1;
            if (depth === 0)
                break;
        }
    }
    // Unbalanced: the whole remainder stays the title and the row stays legal.
    if (depth !== 0)
        return { title: rest.trimEnd(), meta: null, trailer: "" };
    return {
        title: rest.slice(0, at).trimEnd(),
        meta: rest.slice(at + 3, j),
        trailer: rest.slice(j + 1),
    };
}
function matchHeading(line) {
    if (!line.startsWith(H2_PREFIX))
        return null;
    const body = line.slice(H2_PREFIX.length).trimEnd();
    if (!body.endsWith(")"))
        return null;
    const open = body.lastIndexOf("(");
    if (open === -1)
        return null;
    const name = body.slice(0, open).trim();
    const suffix = body.slice(open);
    if (name === "")
        return null;
    for (const form of HEADING_SUFFIXES) {
        const m = form.pattern.exec(suffix);
        if (m === null)
            continue;
        if (form.kind === "blocked" && name !== BLOCKED_COLUMN_NAME)
            return null;
        if (form.kind === "limited") {
            return {
                name,
                kind: form.kind,
                claimedLive: Number.parseInt(m[1], 10),
                limit: Number.parseInt(m[2], 10),
            };
        }
        return { name, kind: form.kind, claimedLive: null, limit: null };
    }
    return null;
}
function boundRow(parts) {
    const meta = parts.meta === null ? null : truncateAt(parts.meta, MAX_META_CHARS);
    const trailer = truncateAt(parts.trailer, MAX_META_CHARS);
    return {
        title: parts.title,
        meta: meta === null ? null : meta.value,
        trailer: trailer.value,
        truncated: (meta?.cut ?? false) || trailer.cut,
    };
}
function idPrefixOf(id) {
    return id.slice(0, id.lastIndexOf("-"));
}
function matchRow(line, idPrefix) {
    const row = ROW.exec(line);
    if (row === null)
        return null;
    const id = row[1];
    if (EPIC_ID.test(id))
        return { id, parts: splitRow(row[2]), isEpic: true };
    if (!isTicketId(id))
        return null;
    if (idPrefix !== null && idPrefix !== "" && idPrefixOf(id) !== idPrefix)
        return null;
    return { id, parts: splitRow(row[2]), isEpic: false };
}
export function normalizeDocument(text) {
    const withoutMark = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    return withoutMark.split("\r\n").join("\n");
}
export function parseBoard(text, options = {}) {
    const idPrefix = options.idPrefix ?? null;
    const normalized = normalizeDocument(text);
    const lines = stripHtmlComments(normalized).split("\n");
    const bounds = measure(text, normalized);
    const columns = [];
    const epicRows = [];
    const preamble = [];
    const updates = [];
    const nonColumnSections = [];
    const unparsed = [];
    // At most one of these is open at a time; both null means the preamble region.
    let column = null;
    let section = null;
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
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
        if (raw.trim() === "")
            continue;
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
function measure(text, normalized) {
    const boardBytes = Buffer.byteLength(text, "utf8");
    let longestLine = 0;
    let start = 0;
    for (;;) {
        const nl = normalized.indexOf("\n", start);
        const end = nl === -1 ? normalized.length : nl;
        if (end - start > longestLine)
            longestLine = end - start;
        if (nl === -1)
            break;
        start = nl + 1;
    }
    return {
        boardBytes,
        longestLine,
        exceeded: boardBytes > LARGE_BOARD_BYTES || longestLine > LONG_LINE_CHARS,
    };
}
export function matchUpdateLine(line, lineNo) {
    const m = UPDATED.exec(line);
    if (m === null)
        return null;
    // BOTH the text and the actor are bounded, because the actor is a suffix of the text. The
    // measured 34,494-character line on a real board is an update line, so bounding only the text
    // would leave the whole of that line reachable through the field beside it.
    const text = truncateAt(line, MAX_UPDATE_TEXT_CHARS);
    const actor = truncateAt(m[2].replace(/_$/, "").trim(), MAX_UPDATE_TEXT_CHARS);
    return {
        date: m[1],
        actor: actor.value,
        text: text.value,
        line: lineNo,
        truncated: text.cut || actor.cut,
    };
}
// from scripts/frontmatter.ts
const HTML_BLOCK_OPEN = /^ {0,3}<[!/a-zA-Z]/;
export function blockContextFlags(text) {
    const lines = text.split("\n");
    const flags = [];
    let inside = false;
    let openChar = "";
    let openLen = 0;
    let html = "none";
    for (const line of lines) {
        if (html !== "none") {
            // A COMMENT block ends on the line carrying `-->`; a TAG block ends at the next blank line.
            const ends = html === "comment" ? line.includes("-->") : /^[ \t]*$/.test(line);
            flags.push(true);
            if (ends)
                html = "none";
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
                if (html === "comment" && line.includes("-->"))
                    html = "none";
                flags.push(true);
                continue;
            }
        }
        else if (run !== null &&
            run.char === openChar &&
            run.len >= openLen &&
            /^[ \t]*$/.test(run.info)) {
            // §4.5's closing rule IN FULL here: same character, at least as long, and NO info string.
            inside = !inside;
            flags.push(true);
            continue;
        }
        flags.push(inside);
    }
    return flags;
}
function strictFenceRun(line) {
    const at = line.search(/[^ ]/);
    if (at < 0 || at > 3)
        return null;
    const rest = line.slice(at);
    const char = rest[0];
    if (char !== "`" && char !== "~")
        return null;
    let len = 0;
    while (len < rest.length && rest[len] === char)
        len += 1;
    if (len < 3)
        return null;
    const info = rest.slice(len);
    if (char === "`" && info.includes("`"))
        return null; // a backtick fence's info string may not carry one
    return { char, len, info };
}
const HEADING_AT_MOST_1 = /^# /;
const HEADING_AT_MOST_2 = /^#{1,2} /;
export function sectionEndIndex(text, from, level) {
    const lines = text.split("\n");
    // THE STRICT PROJECTION (round 4, R5-2). "Does this line END a section" must agree with the
    // renderer or every freeze built on it is fiction; "is this line governed prose" is the other
    // question and keeps the measured lax view.
    const flags = blockContextFlags(text);
    const closes = level === 1 ? HEADING_AT_MOST_1 : HEADING_AT_MOST_2;
    for (let i = Math.max(from, 0); i < lines.length; i++) {
        if (!flags[i] && closes.test(lines[i]))
            return i;
    }
    return lines.length;
}
// from scripts/trace-model.ts
export const TRACE_GENERATED_HEADER = "<!-- GENERATED by grugops trace-render from published note refs — do not hand-edit -->";
export const TRACE_LINK_DIR = "traceability";
const RESERVED_PREFIXES = new Set(["EPIC", "FEAT", "NFR", "ADR", "RISK", "REL", "INC", "UAT"]);
const ID_SHAPE = /^([A-Za-z][A-Za-z0-9]*)-(\d+)$/;
export function isTicketRef(ref, isTicketId) {
    return isTicketId(ref) && !RESERVED_PREFIXES.has(ref.slice(0, ref.lastIndexOf("-")));
}
function isTestRef(ref) {
    return /(^|[\/.])(test|spec)([\/.]|$)/i.test(ref) || /(^|\/)e2e(\/|$)/i.test(ref);
}
function isCodeRef(ref) {
    if (isTestRef(ref))
        return false;
    return /^#\d+$/.test(ref) || ref.includes("/") || /\.[A-Za-z0-9]+$/.test(ref);
}
export const TRACE_COLUMNS = Object.freeze(["Requirement", "Code", "Tests", "UAT", "Release"]);
export function classifyRef(ref, isTicketId) {
    const m = ID_SHAPE.exec(ref);
    const prefix = m ? m[1].toUpperCase() : "";
    if (prefix === "UAT")
        return "UAT";
    if (prefix === "REL")
        return "Release";
    if (prefix === "NFR" || prefix === "EPIC" || prefix === "FEAT")
        return "Requirement";
    if (isTestRef(ref))
        return "Tests";
    if (isTicketRef(ref, isTicketId))
        return null;
    if (isCodeRef(ref))
        return "Code";
    // Any other ID-shaped token (a structural prefix such as ADR or RISK) is a Requirement link.
    if (m)
        return "Requirement";
    return null;
}
export function compareCodeUnits(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
export function traceCell(s) {
    return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n|\r/g, " ");
}
export function buildTraceRows(notes, isTicketId) {
    const rows = new Map();
    for (const note of notes) {
        for (const ticketId of note.refs.filter((ref) => isTicketRef(ref, isTicketId))) {
            let row = rows.get(ticketId);
            if (row === undefined) {
                row = { id: ticketId, Requirement: [], Code: [], Tests: [], UAT: [], Release: [] };
                rows.set(ticketId, row);
            }
            for (const ref of note.refs) {
                if (ref === ticketId)
                    continue;
                const column = classifyRef(ref, isTicketId);
                if (column !== null && !row[column].includes(ref))
                    row[column].push(ref);
            }
        }
    }
    return [...rows.values()].sort((a, b) => compareCodeUnits(a.id, b.id));
}
export function traceFileName(id) {
    return `${id}.md`;
}
export function renderTicketTrace(row) {
    const lines = [TRACE_GENERATED_HEADER, `# Trace: ${row.id}`];
    for (const column of TRACE_COLUMNS) {
        lines.push("", `## ${column}`, "");
        const refs = row[column];
        if (refs.length === 0)
            lines.push("None recorded.");
        else
            for (const ref of refs)
                lines.push(`- ${traceCell(ref)}`);
    }
    return `${lines.join("\n")}\n`;
}
export function renderTraceIndex(rows) {
    const lines = [
        TRACE_GENERATED_HEADER,
        "# Traceability",
        "",
        "Each line links one ticket's trace file. tools/grugops/trace-render.js renders this index from published note refs.",
        "",
        "| Ticket | Trace |",
        "| --- | --- |",
    ];
    const sorted = [...rows].sort((a, b) => compareCodeUnits(a.id, b.id));
    for (const row of sorted)
        lines.push(`| ${row.id} | [${row.id}](${TRACE_LINK_DIR}/${traceFileName(row.id)}) |`);
    return `${lines.join("\n")}\n`;
}
export function collectTraceNotes(contextRoots, io) {
    const notes = [];
    const skipped = [];
    const failedTasks = [];
    let tasks = 0;
    for (const root of contextRoots) {
        const listed = [...io.listTasks(root)].sort(compareCodeUnits);
        for (const task of listed) {
            tasks += 1;
            let read;
            try {
                read = io.readTask(task, root);
            }
            catch (e) {
                failedTasks.push({ root, task, reason: e instanceof Error ? e.message : String(e) });
                continue;
            }
            for (const note of read.notes)
                notes.push(note);
            for (const s of read.skipped)
                skipped.push({ root, task, file: s.file, arm: s.arm, detail: s.detail });
        }
    }
    return { tasks, notes, skipped, failedTasks };
}
export function planTraceTree(rows, traceabilityRel, traceDirRel) {
    const plan = new Map();
    plan.set(traceabilityRel, renderTraceIndex(rows));
    const sorted = [...rows].sort((a, b) => compareCodeUnits(a.id, b.id));
    for (const row of sorted)
        plan.set(`${traceDirRel}/${traceFileName(row.id)}`, renderTicketTrace(row));
    return plan;
}
export const TRACE_TRUST_SKIP_ARMS = Object.freeze(["unparseable", "unsealed"]);
export function traceReadFailures(collection) {
    const failures = collection.failedTasks.map((f) => ({
        root: f.root,
        task: f.task,
        file: null,
        arm: null,
        reason: f.reason,
    }));
    for (const s of collection.skipped) {
        if (TRACE_TRUST_SKIP_ARMS.includes(s.arm))
            continue;
        const reason = s.detail !== "" ? s.detail : `the reader could not read it (${s.arm})`;
        failures.push({ root: s.root, task: s.task, file: s.file, arm: s.arm, reason });
    }
    return failures;
}
export function planCompleteTraceTree(collection, isTicketId, traceabilityRel, traceDirRel) {
    const failures = traceReadFailures(collection);
    if (failures.length > 0)
        return { complete: false, failures };
    const rows = buildTraceRows(collection.notes, isTicketId);
    return { complete: true, rows, plan: planTraceTree(rows, traceabilityRel, traceDirRel) };
}
export const TRACE_FILE_MAX_BYTES = 8 * 1024 * 1024;
export function ownedTraceEntries(names) {
    return names.filter((n) => !n.startsWith(".")).sort(compareCodeUnits);
}
export function caseFoldCollisions(ids) {
    const byFold = new Map();
    for (const id of ids) {
        const fold = traceFileName(id).toLowerCase();
        const group = byFold.get(fold) ?? new Set();
        group.add(id);
        byFold.set(fold, group);
    }
    return [...byFold.values()]
        .filter((g) => g.size > 1)
        .map((g) => [...g].sort(compareCodeUnits))
        .sort((a, b) => compareCodeUnits(a[0], b[0]));
}
export function isGeneratedTraceText(text) {
    const end = text.indexOf("\n");
    const first = end === -1 ? text : text.slice(0, end);
    return (first.endsWith("\r") ? first.slice(0, -1) : first) === TRACE_GENERATED_HEADER;
}
export function compareTraceTree(plan, repoRoot, io, traceabilityRel, traceDirRel) {
    const at = (rel) => `${repoRoot}/${rel}`;
    if (!plan.has(traceabilityRel))
        throw new Error(`compareTraceTree: the plan does not hold the index ${traceabilityRel}`);
    const missing = [];
    const extra = [];
    const changed = [];
    const handWritten = [];
    for (const [rel, text] of plan) {
        const onDisk = io.readText(at(rel));
        if (onDisk === null)
            missing.push(rel);
        else if (!isGeneratedTraceText(onDisk))
            handWritten.push(rel);
        else if (onDisk !== text)
            changed.push(rel);
    }
    const listed = io.listDir(at(traceDirRel));
    for (const name of ownedTraceEntries(listed ?? [])) {
        const rel = `${traceDirRel}/${name}`;
        if (plan.has(rel))
            continue;
        const onDisk = io.readText(at(rel));
        if (onDisk === null)
            continue; // gone between the listing and the read: nothing to remove
        if (isGeneratedTraceText(onDisk))
            extra.push(rel);
        else
            handWritten.push(rel);
    }
    for (const list of [missing, extra, changed, handWritten])
        list.sort(compareCodeUnits);
    return { missing, extra, changed, handWritten };
}
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeTask(task) {
    // Reject empty, `.`/`..`, path separators, absolute paths, and anything outside the allowlist.
    if (!TASK_NAME_RE.test(task) || task === "." || task === "..") {
        throw new Error(`context-io: invalid task name "${task}" — must match ^[A-Za-z0-9._-]+$ ` +
            "(no path separators, no .., no absolute paths)");
    }
}
export function isRecognizedFrontmatterLine(line) {
    if (line.trim() === "")
        return true; // blank
    if (/^refs:\s*$/.test(line))
        return true; // refs: block header
    if (/^\s*-\s+/.test(line))
        return true; // refs: list item shape
    if (/^([A-Za-z_]+):\s*(.*)$/.test(line))
        return true; // column-0 key: value scalar
    return false;
}
export function parseNote(text) {
    // Normalize CRLF/CR to LF before matching the fence so a git-autocrlf (Windows) note parses
    // identically to its LF form. Without this, the fence regex (anchored on \n) misses a CRLF note,
    // parseNote returns null, readContext silently drops it, and admit() wrongly refuses a real
    // §14-gate verdict (CR-01). parseNote is the single choke point feeding both validate() and
    // readContext, so normalizing here aligns the text and admission paths in one place.
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m)
        return null; // no frontmatter fence → caller treats as a structural fail
    const fmLines = m[1].split("\n");
    const body = m[2] ?? "";
    const scalars = {};
    const seen = new Set();
    const dupes = new Set();
    // Non-recognized in-fence line shapes (CMP-02 round-5, IN-02). Records the exact offending line
    // text so validate() and the carve-out oracle can name each one. The recognized set is exactly:
    // a blank line, the `refs:` block header, a `refs:` list item consumed under a header, and a
    // column-0 `key: value` scalar. Everything else inside the fence is malformed.
    const malformed = [];
    let refs = [];
    for (let i = 0; i < fmLines.length; i++) {
        const line = fmLines[i];
        // A blank (empty-after-trim) line is a recognized, legal shape — skip it.
        if (line.trim() === "")
            continue;
        // A `refs:` key with no inline value starts a YAML list block: consume following `  - x` lines.
        // The `- item` lines are consumed HERE and never reach the kv branch, so the legitimate refs:
        // list block can never register as a duplicate provenance key.
        const refsBlock = line.match(/^refs:\s*$/);
        if (refsBlock) {
            if (seen.has("refs"))
                dupes.add("refs");
            seen.add("refs");
            const collected = [];
            while (i + 1 < fmLines.length && /^\s*-\s+/.test(fmLines[i + 1])) {
                collected.push(fmLines[++i].replace(/^\s*-\s+/, "").trim());
            }
            refs = collected;
            continue;
        }
        const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
        if (kv) {
            const key = kv[1];
            const val = kv[2].trim();
            // Record a duplicate provenance key once. parseNote still keeps the last value (overwrite)
            // for backward-compatible reads; validate() rejects on the recorded duplicate.
            if (seen.has(key))
                dupes.add(key);
            seen.add(key);
            if (key === "refs") {
                // Single-line comma form: `refs: a, b, c` (empty → []).
                refs = val === "" ? [] : val.split(",").map((s) => s.trim()).filter((s) => s !== "");
            }
            else {
                scalars[key] = val;
            }
            continue;
        }
        // CMP-02 round-5: a non-blank fence line that is neither the `refs:` header, a `refs:` list item
        // consumed above, nor a column-0 `key: value` scalar is MALFORMED. A stray `  - item` outside a
        // refs block, a leading-space/tab indented key, a `key : value` (space before the colon) line,
        // and any junk line all land here. The anchored kv regex would silently project each to "" with
        // no signal; recording it lets validate() and the carve-out oracle fail closed on the LINE SHAPE.
        //
        // IN-02 single-source coupling: a line reaches this branch only when it is NOT blank, NOT the
        // refs header, NOT a refs list item consumed above, and NOT a column-0 `key: value` scalar. The
        // shared isRecognizedFrontmatterLine predicate is the canonical statement of the
        // blank / refs-header / list-item-shape / column-0-kv grammar, and splitNotes keys its
        // recovered-note boundary on that SAME predicate so the splitter cannot drift from the parser.
        // The ONLY recognized-SHAPE line that still reaches here is a STRAY list item (recognized shape,
        // malformed context — a `- x` outside a refs block); every other line here is also
        // !isRecognizedFrontmatterLine. We assert that invariant (it documents and pins the coupling and
        // never trips on real input, so parseNote's recorded-malformed set is unchanged).
        const isStrayListItem = /^\s*-\s+/.test(line);
        if (!isStrayListItem && isRecognizedFrontmatterLine(line)) {
            throw new Error(`context-io.parseNote: internal invariant violated — line "${line}" reached the malformed ` +
                "branch yet is a recognized frontmatter line (splitNotes/parseNote grammar drift, IN-02).");
        }
        malformed.push(line);
    }
    // Route the parsed `kind` THROUGH the single-source authority (round-8 GAP-R7-1 Lever-1). This is
    // behavior-identical to the kv loop's existing `.trim()` (the value is already trimmed) — its sole
    // purpose is to make parseNote consult the SAME helper the gate (isGatedNote / the hook / the server)
    // consults, so the store's kind view and the gate's kind view cannot drift. The existing parseNote
    // tests stay green (this is a proven no-op on the persisted value).
    if (scalars.kind !== undefined)
        scalars.kind = normalizeKind(scalars.kind);
    return { scalars, refs, body, duplicateKeys: [...dupes], malformedLines: malformed };
}
export const CANONICAL_READ_POSITION = "absent, or a regular file";
export const NOTE_FILE_MAX_BYTES = 8 * 1024 * 1024;
export const READ_POSITION_CONDITIONS = ["unopenable", "not-a-regular-file", "above-ceiling"];
export class ReadPositionRefusal extends Error {
    condition;
    constructor(condition, message) {
        super(message);
        this.name = "ReadPositionRefusal";
        this.condition = condition;
    }
}
export function readRegularFileOrNull(path, maxBytes, position) {
    let fd;
    try {
        fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
    }
    catch (e) {
        const code = e.code;
        if (code === "ENOENT")
            return null; // genuinely nothing here
        // Present and unopenable — EACCES, ELOOP, ENXIO (a socket), a dangling symlink's own ENOENT on
        // the TARGET is reported as ENOENT by open(2) and is therefore correctly "nothing here". Fail
        // closed, naming the position rather than surfacing a bare errno the caller cannot place.
        throw new ReadPositionRefusal("unopenable", `context-io: the ${position} "${path}" IS present and could not be opened (${code ?? "unknown"}) ` +
            `— it is refused rather than read. The canonical form for this position is ` +
            `${CANONICAL_READ_POSITION}.`);
    }
    try {
        const st = fstatSync(fd);
        // TWO CONDITIONS, TWO NAMES (31-29, CR-19). The shape branch and the ceiling branch used to be
        // reported to callers as one undifferentiated failure, so `writeNoteFile` published its SHAPE
        // clause — "is not absent, or a regular file" — for a 9,437,353-byte REGULAR file. Each branch
        // now carries the condition it actually met, and each caller names its own clause from it.
        if (!st.isFile()) {
            throw new ReadPositionRefusal("not-a-regular-file", `context-io: the ${position} "${path}" is not a regular file — it is refused rather than ` +
                `read, because reading a FIFO, a device, a socket or a directory can block forever and a ` +
                `program that never answers refuses nothing. The canonical form for this position is ` +
                `${CANONICAL_READ_POSITION}.`);
        }
        if (st.size > maxBytes) {
            throw new ReadPositionRefusal("above-ceiling", `context-io: the ${position} "${path}" is ${st.size} bytes, above the ${maxBytes}-byte ` +
                `ceiling — refused rather than read. It IS a regular file; what disqualifies it is its ` +
                `size and nothing else.`);
        }
        // The read is bounded by the size fstat just reported on this same descriptor.
        const buf = Buffer.allocUnsafe(Number(st.size));
        let off = 0;
        while (off < buf.length) {
            const n = readSync(fd, buf, off, buf.length - off, off);
            if (n === 0)
                break;
            off += n;
        }
        return buf.subarray(0, off).toString("utf8");
    }
    finally {
        closeSync(fd);
    }
}
export const NOTE_SEAL_KEY = "seal";
const NOTE_SEAL_DOMAIN = "grugops-note-seal-v1";
export const NOTE_SEAL_RE = /^sha256:[0-9a-f]{64}$/;
function normalizeLineEndings(text) {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
export function noteSeal(unsealedText) {
    const h = createHash("sha256");
    h.update(NOTE_SEAL_DOMAIN, "utf8");
    h.update(Buffer.from([0]));
    h.update(normalizeLineEndings(unsealedText), "utf8");
    return `sha256:${h.digest("hex")}`;
}
export function sealVerdict(text) {
    const normalized = normalizeLineEndings(text);
    const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m)
        return { ok: false, reason: "absent" };
    const fmLines = m[1].split("\n");
    // A column-0 `<key>:` line. Spelled from the key and a character test rather than from a literal
    // or a template, so the S5 derivation (which counts every spelling of the seal key's line shape)
    // sees ONE emitter in this module and this reader is not it.
    const isSealLine = (line) => line.startsWith(NOTE_SEAL_KEY) && line.charAt(NOTE_SEAL_KEY.length) === ":";
    const sealIndexes = [];
    for (let i = 0; i < fmLines.length; i++) {
        if (isSealLine(fmLines[i]))
            sealIndexes.push(i);
    }
    if (sealIndexes.length === 0)
        return { ok: false, reason: "absent" };
    if (sealIndexes.length > 1)
        return { ok: false, reason: "malformed" };
    const at = sealIndexes[0];
    if (at !== fmLines.length - 1)
        return { ok: false, reason: "malformed" };
    const sealLine = fmLines[at];
    const value = sealLine.slice(NOTE_SEAL_KEY.length + 1).trim();
    if (!NOTE_SEAL_RE.test(value))
        return { ok: false, reason: "malformed" };
    // Strip the seal line by position: the fence body `m[1]` begins at offset 4 (after `---\n`), and
    // the seal line is its last line, followed by `\n---`. Removing `<line>\n` there yields exactly the
    // text `composeNote` sealed.
    const start = 4 + (m[1].length - sealLine.length);
    const unsealed = normalized.slice(0, start) + normalized.slice(start + sealLine.length + 1);
    return noteSeal(unsealed) === value ? { ok: true } : { ok: false, reason: "mismatch" };
}
export const NOTE_SKIP_ARMS = ["unparseable", ...READ_POSITION_CONDITIONS, "vanished", "unsealed"];
function readRawNotesWithSkips(task, contextRoot) {
    assertSafeTask(task);
    const notesDir = join(contextRoot, task, "notes");
    // ONLY ENOENT IS ABSENCE (plan 37-21, D-17, READ-1 of the phase-37 gap-planning brief). The existence test
    // this replaced answered false for EACCES on a parent as well as for ENOENT, so a task whose directory could
    // not be searched read as a task with no notes, and the trace render then removed that ticket's trace file
    // (CR-01). `throwIfNoEntry: false` answers undefined for a missing path only; any other failure throws and
    // reaches the trace model as a failed task. A present non-directory goes on to readdirSync, which throws
    // ENOTDIR.
    if (statSync(notesDir, { throwIfNoEntry: false }) === undefined)
        return { notes: [], skipped: [] };
    const skipped = [];
    const out = [];
    for (const file of readdirSync(notesDir)) {
        if (!file.endsWith(".md"))
            continue;
        // THE THIRD CALLER-INFLUENCED READ POSITION IN THIS MODULE (31-21, CR-12 / D-24). CR-12 named
        // the write chokepoint and the ledger look. This walk is the third: what it reads is whatever a
        // notes/ DIRECTORY lists, and a directory's contents are exactly what a caller can add a name
        // to. Measured with the first two positions already closed, a `mkfifo` at
        // `<ctx>/<task>/notes/<anything>.md` still wedged `readContext`, `render`, `currentState` AND
        // `promoteAdmitted`'s destination-liveness clause — CR-12 surviving at a position the finding
        // did not name. Closing only the two named reads would have satisfied the review and left D-24's
        // own rule false, which is the failure shape five rounds of this phase have paid for.
        //
        // THE DISPOSITION IS SKIP, AND IT IS A DECISION RATHER THAN A DEFAULT. This walk already skips a
        // file that does not PARSE rather than crashing, because one malformed file must not make a
        // whole task's context unreadable. A position occupied by a FIFO, a device or a directory is not
        // a note by that same argument, so it is skipped by the same rule. Throwing here would let one
        // planted FIFO deny `render` and `currentState` for the entire task — trading a hang for a
        // denial one register over. The WRITE side stays loud: `writeNoteFile` refuses that position BY
        // NAME, so nothing can be written over it and nothing is silently replaced. The residual — that
        // a skip is quiet on a surface whose whole value is legibility — is named in D-24.
        // THREE ARMS, EACH NAMED, EACH COUNTED (31-29, IN-14 / R-31-21-02). The disposition is still
        // SKIP — throwing would let one planted FIFO deny `render` and `currentState` for a whole task,
        // trading a hang for a denial one register over — but a skip is no longer SILENT.
        let text;
        try {
            const raw = readRegularFileOrNull(join(notesDir, file), NOTE_FILE_MAX_BYTES, "note file");
            if (raw === null) {
                // `open(2)` answered ENOENT. Two conditions reach here and the arm's docstring names both:
                // a file listed by `readdir` and deleted before it was opened, and a DANGLING SYMLINK whose
                // ENOENT is about its target.
                skipped.push({ file, arm: "vanished", detail: "" });
                continue;
            }
            text = raw;
        }
        catch (e) {
            // ── THE ARM IS READ FROM THE AUTHORITY, NEVER RE-DERIVED HERE (31-33, CR-24 / D-34). ──────
            //
            // `D-31 (3)` put the condition on the error with a stated reason: "carrying the condition on
            // the error is what lets a caller name its own clause WITHOUT re-deriving the fact." This
            // caller — the one `IN-14` was raised about — discarded it and hand-labelled all three
            // conditions `not-a-regular-file`. A caller that re-labels every condition with one arm has
            // re-derived the fact, and re-derived it WRONGLY, on the one surface whose whole stated value
            // is legibility: the row a human reads when a note that was admitted has become unreadable.
            // Reproduced before the fix — an EACCES file and an 8,388,609-byte REGULAR file both filed
            // under `not-a-regular-file`, the second row's detail contradicting its own arm.
            //
            // THE FALLBACK IS ONE EXPLICITLY NAMED ARM, not a label per catch. Anything reaching here
            // that is not a `ReadPositionRefusal` — an EIO from `fstat`, an allocation failure — is a
            // position that could not be opened or read as far as this walk is concerned, which is what
            // `unopenable` means. Naming it once is the difference between a fallback and a second
            // classifier.
            const arm = e instanceof ReadPositionRefusal ? e.condition : "unopenable";
            skipped.push({ file, arm, detail: e.message });
            continue;
        }
        const parsed = parseNote(text);
        if (!parsed) {
            // A file that is never a note — an editor backup, a stray `.md`. One malformed file must not
            // make a whole task's context unreadable, so it is skipped rather than thrown on.
            skipped.push({ file, arm: "unparseable", detail: "" });
            continue;
        }
        // THE SEAL IS ASKED HERE, IN THE ONE WALK, AND ONLY HERE (plan 33-25, KIT (b)). A note the
        // sanctioned writer did not compose — a hand-written note, a pre-seal note, an edited note — is
        // refused by name and counted under `unsealed`, with the predicate's own word as the detail. The
        // disposition is SKIP like the other arms: one planted file must not make a whole task's context
        // unreadable, and the write side stays loud. Measured on the held round-1 capture before this
        // change: nine `Write`-tool notes read as nine records; after it, nine `unsealed`/`absent` rows.
        const seal = sealVerdict(text);
        if (!seal.ok) {
            skipped.push({ file, arm: "unsealed", detail: seal.reason });
            continue;
        }
        // Prefer the explicit frozen `id:` field; fall back to the filename-derived id when absent (a
        // pre-id note). When BOTH are present they must agree — a frontmatter id diverging from its
        // filename is the on-disk signature of a tampered identity, so the filename (the storage key)
        // wins for the read and the divergence is left for validate() to surface on the explicit path.
        const fileId = file.replace(/\.md$/, "");
        const s = parsed.scalars;
        out.push({ id: s.id && s.id !== "" ? s.id : fileId, text, parsed });
    }
    return { notes: out, skipped };
}
function recordFromParsed(parsed, id) {
    const s = parsed.scalars;
    return {
        id,
        kind: s.kind ?? "",
        by: s.by ?? "",
        at: s.at ?? "",
        verified_by: s.verified_by ?? "",
        confidence: s.confidence ?? "",
        refs: parsed.refs,
        supersedes: s.supersedes && s.supersedes !== "" ? s.supersedes : null,
        // The evidence-provenance projection (Phase 31). parseNote's open scalar map already ACCEPTS
        // these keys, so no parser change was needed — but a scalar the parser accepted and this
        // projection dropped is a scalar admit() cannot read, and admit()'s D-03 branch reads the
        // matched verdict's `sha` through exactly this record. Absent stays `undefined` rather than
        // "" so "the verdict recorded no SHA" and "the verdict recorded an empty SHA" are one case
        // for the refusal below to name.
        sha: s.sha ?? undefined,
        gate_run: s.gate_run ?? undefined,
        content_hash: s.content_hash ?? undefined,
        body: parsed.body.trim(),
    };
}
export function normalizeKind(raw) {
    return (raw ?? "").trim();
}
// from scripts/runnable-stamp.ts
export const RUNNABLE_STAMP_NAME = "RUNNABLE_SET_STAMP";
export const RUNNABLE_STAMP_LINE = new RegExp(`^export const ${RUNNABLE_STAMP_NAME} = "(sha256:[0-9a-f]{64})";$`);
export function readRunnableStamp(text) {
    const stamps = [];
    for (const raw of text.split("\n")) {
        const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
        const m = RUNNABLE_STAMP_LINE.exec(line);
        if (m !== null)
            stamps.push(m[1]);
    }
    if (stamps.length === 0)
        return { kind: "none" };
    if (stamps.length > 1)
        return { kind: "ambiguous", count: stamps.length };
    return { kind: "stamp", stamp: stamps[0] };
}
// </runnable-embeds>
// ── The hand-written part: argv, the reads, the routing and the exit code ─────────────────────────────
// EXIT-1 (plan 37-20, D-12, D-17): a throw that escapes every inner catch, the output tail after the main try
// included, is could-not-run, never the finding code. Registered before argv is read.
process.on("uncaughtException", (e) => stoppedUnexpectedly(e));
/** The check stopped on an unexpected throw: one sanitized line on stderr, nothing on stdout, exit 2. */
function stoppedUnexpectedly(e) {
    const message = e instanceof Error ? e.message : String(e);
    process.stderr.write(`Error: the state check stopped unexpectedly (${printable(message)}). The state check did not run.\n`);
    process.exit(2);
}
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
function printable(value) {
    return stripControlChars(value, false);
}
/** The check could not run: one sanitized message on stderr, nothing on stdout, exit 2. Never a pass. */
function couldNotRun(message) {
    process.stderr.write(`Error: ${printable(message)} The state check did not run.\n`);
    process.exit(2);
}
/** The errno code of a thrown filesystem error, for a message. */
function codeOf(e) {
    return e.code ?? "unknown error";
}
const args = process.argv.slice(2);
const unknownFlag = args.find((a) => a.startsWith("--") && a !== JSON_FLAG);
if (unknownFlag !== undefined)
    couldNotRun(`unknown option ${unknownFlag}. ${USAGE}.`);
const asJson = args.includes(JSON_FLAG);
const positionals = args.filter((a) => !a.startsWith("--"));
const rootArg = positionals[0];
if (rootArg === undefined)
    couldNotRun(`no repository root was given. ${USAGE}.`);
if (positionals.length > 1)
    couldNotRun(`more than one repository root was given. ${USAGE}.`);
let root;
try {
    root = nodeFs.realpathSync(rootArg);
}
catch (e) {
    couldNotRun(`the repository root ${rootArg} cannot be resolved (${codeOf(e)}). ${USAGE}.`);
}
try {
    if (!nodeFs.statSync(root).isDirectory())
        couldNotRun(`the repository root ${rootArg} is not a directory. ${USAGE}.`);
    nodeFs.accessSync(root, nodeFs.constants.R_OK | nodeFs.constants.X_OK);
}
catch (e) {
    couldNotRun(`the repository root ${rootArg} is not a readable directory (${codeOf(e)}).`);
}
/**
 * Resolve `rel` under the root with realpath, following every link in the path, and say whether it lands
 * inside realpath(root). Only ENOENT is absent; any other failure is an error the caller reports.
 */
function locate(rel) {
    const abs = nodePath.join(root, ...rel.split("/"));
    let real;
    try {
        real = nodeFs.realpathSync(abs);
    }
    catch (e) {
        const code = codeOf(e);
        return code === "ENOENT" ? { kind: "absent" } : { kind: "error", code };
    }
    const prefix = root.endsWith(nodePath.sep) ? root : `${root}${nodePath.sep}`;
    if (real !== root && !real.startsWith(prefix))
        return { kind: "outside" };
    return { kind: "inside", abs, real };
}
/**
 * The text of the state file at `rel`, or that it is absent or outside the root.
 *
 * The resolved path is stat'ed first, so a path that is present and is not a regular file (a FIFO, a device,
 * a socket, a directory) is refused without being opened. The read goes through the embedded non-blocking
 * reader, which checks the shape again on the open descriptor. A file that is present and cannot be read is
 * never treated as absent: it is exit 2, naming the file.
 */
function readState(rel, what) {
    const at = locate(rel);
    if (at.kind === "error")
        couldNotRun(`cannot resolve the ${what} ${rel} (${at.code}).`);
    if (at.kind !== "inside")
        return at;
    let st;
    try {
        st = nodeFs.statSync(at.real, { throwIfNoEntry: false });
    }
    catch (e) {
        couldNotRun(`cannot inspect the ${what} ${rel} (${codeOf(e)}).`);
    }
    if (st === undefined)
        return { kind: "absent" };
    if (!st.isFile())
        couldNotRun(`the ${what} ${rel} is present and is not a regular file, so it was not opened.`);
    let text;
    try {
        text = readRegularFileOrNull(at.real, READ_CEILING_BYTES, what);
    }
    catch (e) {
        const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
        couldNotRun(`the ${what} ${rel} is present and cannot be read (${condition}).`);
    }
    return text === null ? { kind: "absent" } : { kind: "text", text };
}
/** The layout marker's state. A marker that resolves outside the root is invalid by name and never read. */
function readMarker() {
    const marker = readState(LAYOUT_MARKER_REL, "layout marker");
    if (marker.kind === "outside")
        return { state: "invalid", reason: `${OUTSIDE_ROOT}` };
    return markerState(marker.kind === "text" ? marker.text : null, LAYOUT_MARKER_CONTENT);
}
/**
 * The board's findings: bytes, ticket-row characters, `_Updated:` lines and Done rows, as checkBudgets reads it,
 * and the Done row count the rollable report reads (null when the board was not read).
 */
function boardFindings() {
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
function indexFindings(rel, index) {
    if (index.kind === "absent")
        return [unmeasuredFinding(rel, "indexEntryBytes", BUDGETS, "the file is absent")];
    if (index.kind === "outside")
        return [unmeasuredFinding(rel, "indexEntryBytes", BUDGETS, OUTSIDE_ROOT)];
    const normalized = normalizeDocument(index.text);
    return indexLineFindings(rel, { normalized, blanked: stripHtmlComments(normalized) }, BUDGETS);
}
/**
 * The byte finding of one file, measured from its lstat size without opening it. A FIFO, a directory or a
 * link at the path is not a regular file: it is reported by name and never measured. A path that resolves
 * outside the root, or whose size cannot be taken, is reported too, so no file is dropped. `missingIsClean`
 * is for the progress file, which may be absent.
 */
function sizeFinding(rel, key, missingIsClean) {
    const at = locate(rel);
    if (at.kind === "absent") {
        return missingIsClean ? [] : [unmeasuredFinding(rel, key, BUDGETS, "its size could not be read (ENOENT)")];
    }
    if (at.kind === "error")
        return [unmeasuredFinding(rel, key, BUDGETS, `its size could not be read (${at.code})`)];
    if (at.kind === "outside")
        return [unmeasuredFinding(rel, key, BUDGETS, OUTSIDE_ROOT)];
    let st;
    try {
        st = nodeFs.lstatSync(at.abs);
    }
    catch (e) {
        return [unmeasuredFinding(rel, key, BUDGETS, `its size could not be read (${codeOf(e)})`)];
    }
    if (!st.isFile())
        return [unmeasuredFinding(rel, key, BUDGETS, "not a regular file, so it was not measured")];
    const finding = fileBytesFinding(rel, st.size, key, BUDGETS);
    return finding === null ? [] : [finding];
}
/** The note on a directory that resolves outside the repository root. */
const OUTSIDE_ROOT_DIR = "it resolves outside the repository root, so it was not listed";
/**
 * The raw listing of the directory at `dirRel`, each directory listed once per run so every rule that reads it
 * sees the same names. A directory that does not exist is absent. One that resolves outside the root, or
 * cannot be resolved or listed, is unlisted with the reason, which the caller reports by name.
 */
function listDirectory(dirRel) {
    const at = locate(dirRel);
    if (at.kind === "absent")
        return at;
    if (at.kind === "error")
        return { kind: "unlisted", note: `the directory could not be resolved (${at.code})` };
    if (at.kind === "outside")
        return { kind: "unlisted", note: OUTSIDE_ROOT_DIR };
    try {
        return { kind: "listed", names: nodeFs.readdirSync(at.real) };
    }
    catch (e) {
        return { kind: "unlisted", note: `the directory could not be listed (${codeOf(e)})` };
    }
}
/**
 * The byte findings of every record in one directory. The raw listing goes to the embedded budgetEntryNames,
 * which decides which entries are records; this function filters no name itself (D-11). A directory that
 * does not exist is an empty set. A directory that resolves outside the root, or cannot be listed, is
 * reported by name, so its files are never silently unmeasured.
 */
function directoryFindings(dirRel, key, listing) {
    if (listing.kind === "absent")
        return [];
    if (listing.kind === "unlisted")
        return [unmeasuredFinding(dirRel, key, BUDGETS, listing.note)];
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
function nfrFindings(catalog, listing) {
    if (catalog.kind === "outside" || listing.kind === "unlisted")
        return [];
    const names = listing.kind === "listed" ? listing.names : [];
    for (const name of recordEntryNames(names))
        confirmListed(`${NFR_DIR_REL}/${name}`);
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
function confirmListed(rel) {
    try {
        nodeFs.lstatSync(nodePath.join(root, ...rel.split("/")));
    }
    catch (e) {
        couldNotRun(`the NFR file ${rel} was listed and then could not be inspected (${codeOf(e)}), so the index check cannot ` +
            "say whether it exists.");
    }
}
/**
 * The progress file's byte finding, measured from its lstat size as checkBudgets measures it. Only a file
 * over its budget is read: its dated status entries decide whether it is rollable, and with none the finding
 * names its standing sections and where they belong (D-09, through the embedded progressBytesFinding). The
 * text is comment-blanked first, so an example heading inside an HTML comment opens no entry, and the embedded
 * progressEntries asks the generated sectionEndIndex which lines are headings, so a fenced example heading opens
 * none either (plan 37-23, WR-02): state-roll classifies with the same owner. A file that was measured and then
 * cannot be read is exit 2, naming it.
 */
function progressReport() {
    const sized = sizeFinding(PROGRESS_REL, "progressBytes", true);
    const measured = sized.find((f) => f.measured !== null)?.measured ?? null;
    if (measured === null)
        return { findings: sized, bytes: null, entries: null };
    const text = readState(PROGRESS_REL, "progress file");
    if (text.kind !== "text")
        couldNotRun(`the progress file ${PROGRESS_REL} was measured and then could not be read.`);
    const entries = progressEntries(stripHtmlComments(normalizeDocument(text.text)), sectionEndIndex);
    const finding = progressBytesFinding(PROGRESS_REL, measured, entries, DECISIONS_REL, BUDGETS);
    return { findings: finding === null ? [] : [finding], bytes: measured, entries };
}
/**
 * The move-only report of one surface (SPLIT-06, v3.0 D-7): the embedded moveOnlyFindings over the raw
 * listings of the live folder and its archive folder, and their record counts by the embedded
 * recordEntryNames, so a keeper is never counted. An absent folder holds no record. A folder that resolves
 * outside the root, or cannot be listed, is a finding by name, its count is unknown, and the two folders are
 * not compared.
 */
function moveOnlyReport(liveRel, archiveRel) {
    const findings = [];
    const counted = (rel, listing) => {
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
        const names = (l) => (l.kind === "listed" ? l.names : []);
        findings.push(...moveOnlyFindings(liveRel, names(live), archiveRel, names(archive)));
    }
    return { findings, surface: { live: liveRel, archive: archiveRel, liveCount, archivedCount } };
}
// ── Trace freshness (plan 37-09, SPLIT-05, SPLIT-03, D-01, D-03) ────────────────────────────────────────
/** The command a trace finding names. trace-render is shipped beside this file under tools/grugops/. */
const TRACE_RENDER_COMMAND = "node tools/grugops/trace-render.js";
/** The trace was not compared because of the path `rel`: one finding by name, never a pass. */
function traceNotCompared(rel, why) {
    return {
        compared: false,
        findings: [integrityFinding(rel, "trace-not-compared", `the trace was not compared: ${why}`)],
        lines: [],
    };
}
/** True when an already-resolved real path is the root or lies under it. */
function insideRoot(real) {
    const prefix = root.endsWith(nodePath.sep) ? root : `${root}${nodePath.sep}`;
    return real === root || real.startsWith(prefix);
}
/**
 * Resolve the directory at `rel` with realpath before it is used. A present entry that is not a directory, or a
 * path that cannot be resolved or inspected, is could-not-run (exit 2), naming it.
 */
function traceDirectory(rel, what) {
    const at = locate(rel);
    if (at.kind === "absent" || at.kind === "outside")
        return at;
    if (at.kind === "error")
        couldNotRun(`cannot resolve ${what} ${rel} (${at.code}).`);
    let st;
    try {
        st = nodeFs.statSync(at.real);
    }
    catch (e) {
        couldNotRun(`cannot inspect ${what} ${rel} (${codeOf(e)}).`);
    }
    if (!st.isDirectory())
        couldNotRun(`${what} ${rel} is present and is not a directory.`);
    return { kind: "dir", real: at.real };
}
/**
 * One task's notes, read as the renderer reads them: through the embedded walk (its skip arms and its seal
 * check) and the embedded record projection. A notes directory that resolves outside the root, or that cannot be
 * resolved, throws, so the task is a read failure by name and the trace is not compared (plan 37-21).
 */
function readTraceTask(task, contextReal) {
    assertSafeTask(task);
    const notesDir = nodePath.join(contextReal, task, "notes");
    let notesReal = null;
    try {
        notesReal = nodeFs.realpathSync(notesDir);
    }
    catch (e) {
        if (codeOf(e) !== "ENOENT")
            throw new Error(`its notes directory cannot be resolved (${codeOf(e)})`);
    }
    if (notesReal !== null && !insideRoot(notesReal)) {
        throw new Error("its notes directory resolves outside the repository root, so it was not read");
    }
    const read = readRawNotesWithSkips(task, contextReal);
    return {
        notes: read.notes.map((raw) => ({ refs: recordFromParsed(raw.parsed, raw.id).refs })),
        skipped: read.skipped,
    };
}
/**
 * The text the trace model compares with, at a path it composed as `<root>/<rel>`, or null when nothing is
 * there. realpath first, then lstat, so a link, a FIFO or a directory is refused by name and never opened; then
 * the embedded non-blocking reader under the model's trace-file ceiling. Every refusal is could-not-run.
 */
function readTraceText(path) {
    const rel = path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
    const at = locate(rel);
    if (at.kind === "absent")
        return null;
    if (at.kind === "error")
        couldNotRun(`cannot resolve the trace file ${rel} (${at.code}).`);
    if (at.kind === "outside")
        couldNotRun(`the trace file ${rel} resolves outside the repository root, so it was not read.`);
    let st;
    try {
        st = nodeFs.lstatSync(at.abs);
    }
    catch (e) {
        if (codeOf(e) === "ENOENT")
            return null;
        couldNotRun(`cannot inspect the trace file ${rel} (${codeOf(e)}).`);
    }
    if (!st.isFile())
        couldNotRun(`the trace file ${rel} is present and is not a regular file, so it was not opened.`);
    try {
        return readRegularFileOrNull(at.real, TRACE_FILE_MAX_BYTES, "trace file");
    }
    catch (e) {
        const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
        couldNotRun(`the trace file ${rel} is present and cannot be read (${condition}).`);
    }
}
/**
 * Whether the rendered trace matches the published notes, by the embedded trace model. `index` is the index
 * file as readState read it. A hand-written index is one finding and nothing is compared; an index, a trace
 * directory or a context root that resolves outside the root stops the compare by name.
 */
function traceReport(index) {
    const remedy = `run ${TRACE_RENDER_COMMAND} ${rootArg}`;
    if (index.kind === "outside")
        return traceNotCompared(TRACEABILITY_REL, "the index resolves outside the repository root");
    if (index.kind === "text" && !isGeneratedTraceText(index.text)) {
        return {
            compared: false,
            findings: [
                integrityFinding(TRACEABILITY_REL, "trace-hand-written", "it does not start with the generated header, so the trace was not compared; the render never replaces " +
                    `a hand-written index: move it aside, then ${remedy}`),
            ],
            lines: [],
        };
    }
    const traceDir = traceDirectory(TRACE_DIR_REL, "the trace directory");
    if (traceDir.kind === "outside") {
        return traceNotCompared(TRACE_DIR_REL, "the trace directory resolves outside the repository root");
    }
    const contextRoots = [];
    for (const rel of [CONTEXT_REL, CONTEXT_ARCHIVE_REL]) {
        const dir = traceDirectory(rel, "the context root");
        if (dir.kind === "outside")
            return traceNotCompared(rel, "the context root resolves outside the repository root");
        if (dir.kind === "dir")
            contextRoots.push({ rel, real: dir.real });
    }
    const relOfRoot = (real) => contextRoots.find((r) => r.real === real)?.rel ?? real;
    const listTasks = (real) => {
        try {
            return nodeFs
                .readdirSync(real, { withFileTypes: true })
                .filter((e) => e.isDirectory())
                .map((e) => e.name);
        }
        catch (e) {
            couldNotRun(`the context root ${relOfRoot(real)} cannot be listed (${codeOf(e)}).`);
        }
    };
    const listDir = () => {
        if (traceDir.kind !== "dir")
            return null;
        try {
            return nodeFs.readdirSync(traceDir.real);
        }
        catch (e) {
            couldNotRun(`the trace directory ${TRACE_DIR_REL} cannot be listed (${codeOf(e)}).`);
        }
    };
    const collection = collectTraceNotes(contextRoots.map((r) => r.real), { listTasks, readTask: readTraceTask });
    // The one completeness predicate the renderer asks too (plan 37-21, D-17, CR-01, READ-1): a plan exists only
    // for a complete read. A partial read is never compared, so no trace-stale finding and no fresh line comes
    // from it; each task or note that could not be read is one trace-not-compared finding by name. Which refs are
    // tickets is the board grammar's answer, the generated isTicketId (plan 37-22, D-17, WR-01).
    const complete = planCompleteTraceTree(collection, isTicketId, TRACEABILITY_REL, TRACE_DIR_REL);
    if (!complete.complete) {
        return {
            compared: false,
            findings: complete.failures.map((f) => {
                const at = `${relOfRoot(f.root)}/${f.task}`;
                const rel = f.file === null ? at : `${at}/notes/${f.file}`;
                const reason = f.arm === null ? f.reason : `${f.arm}: ${f.reason}`;
                return integrityFinding(rel, "trace-not-compared", `the trace was not compared: this task's notes could not be read (${reason}); the render refuses to run ` +
                    "until they can be read");
            }),
            lines: [],
        };
    }
    const { rows, plan } = complete;
    const diff = compareTraceTree(plan, root, { readText: readTraceText, listDir }, TRACEABILITY_REL, TRACE_DIR_REL);
    const findings = [
        ...caseFoldCollisions(rows.map((r) => r.id)).map((ids) => integrityFinding(TRACE_DIR_REL, "trace-collision", `these ticket identifiers name one trace file on a case-insensitive disk, so one would overwrite the other: ${ids.join(", ")}`)),
        ...diff.handWritten.map((rel) => integrityFinding(rel, "trace-hand-written", "it does not start with the generated header, so the render never replaces or removes it")),
        ...diff.missing.map((rel) => integrityFinding(rel, "trace-stale", `missing: a fresh render writes it; ${remedy}`)),
        ...diff.extra.map((rel) => integrityFinding(rel, "trace-stale", `extra: a fresh render removes it; ${remedy}`)),
        ...diff.changed.map((rel) => integrityFinding(rel, "trace-stale", `changed: it differs from a fresh render; ${remedy}`)),
    ];
    // The renderer's counts line (scripts/runnable-ref/trace-render.ts), held equal to it by state-check.test.ts.
    const perArm = NOTE_SKIP_ARMS.map((arm) => `${arm} ${collection.skipped.filter((s) => s.arm === arm).length}`);
    const counts = `${collection.tasks} task(s) and ${collection.notes.length} note(s) read; ` +
        `skipped notes: ${perArm.join(", ")}; unreadable tasks ${collection.failedTasks.length}`;
    const summary = findings.length === 0
        ? `The trace is fresh: ${counts}.`
        : `The trace is not fresh: ${findings.length} difference(s); ${counts}.`;
    // A complete read has no failed task, so no UNREADABLE TASK line follows the summary any more (plan 37-21).
    const lines = [`TRACE    ${summary}`];
    return { compared: true, findings, lines };
}
// ── Sibling programs built together (plan 37-24, D-17, WR-05, AUTH-1) ────────────────────────────────────
/** `names` as one list for a sentence: `a`, `a and b`, `a, b and c`. */
function listed(names) {
    if (names.length < 2)
        return names.join("");
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
/**
 * One runnable-version-skew finding per sibling program in RUNNABLE_SET, other than this one, that sits in this
 * file's directory and was not built together with it: a different stamp, no stamp, more than one stamp, or a
 * present file that could not be read. An absent sibling is no finding. The sibling is read through the embedded
 * non-blocking reader under READ_CEILING_BYTES, so a FIFO is a refusal and never a hang. Its `rel` is its path
 * under the repository root when this file's directory resolves inside the root, and its absolute path otherwise.
 * A directory that cannot be resolved is one finding by name (plan 37-25, D-17, READ-1): the failure is never read
 * as a directory outside the root. The siblings are still compared, each named by its absolute path.
 */
function runnableSkewFindings() {
    const here = import.meta.dirname;
    const out = [];
    let hereReal = null;
    try {
        hereReal = nodeFs.realpathSync(here);
    }
    catch (e) {
        out.push(integrityFinding(here, "runnable-version-skew", `the directory of ${RUNNABLE_SELF} could not be resolved (${codeOf(e)}), so whether its sibling programs sit ` +
            "inside the repository root could not be told; each is named by its absolute path"));
    }
    const remedy = `remove ${listed(RUNNABLE_SET)} and install them again together`;
    for (const name of RUNNABLE_SET) {
        if (name === RUNNABLE_SELF)
            continue;
        const abs = nodePath.join(here, name);
        const rel = hereReal !== null && insideRoot(hereReal)
            ? nodePath.relative(root, nodePath.join(hereReal, name)).split(nodePath.sep).join("/")
            : abs;
        let text;
        try {
            text = readRegularFileOrNull(abs, READ_CEILING_BYTES, "state program");
        }
        catch (e) {
            const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
            out.push(integrityFinding(rel, "runnable-version-skew", `it could not be read (${condition}), so its build could not be compared with ${RUNNABLE_SELF}`));
            continue;
        }
        if (text === null)
            continue;
        const read = readRunnableStamp(text);
        if (read.kind === "stamp" && read.stamp === RUNNABLE_SET_STAMP)
            continue;
        const note = read.kind === "none"
            ? `it carries no build stamp, so an older kit built it; ${remedy}`
            : read.kind === "ambiguous"
                ? `it carries ${read.count} build stamps, so its build could not be compared with ${RUNNABLE_SELF}; ${remedy}`
                : `it was built from different authorities (stamp ${read.stamp}) than ${RUNNABLE_SELF} (stamp ` +
                    `${RUNNABLE_SET_STAMP}); ${remedy}`;
        out.push(integrityFinding(rel, "runnable-version-skew", note));
    }
    return out;
}
/** The command a ROLLABLE line names. state-roll is shipped beside this file under tools/grugops/. */
const ROLL_COMMAND = "node tools/grugops/state-roll.js";
/** A finding with every value read from the repository made printable. Text and JSON both print these. */
function printableFinding(f) {
    return { ...f, rel: printable(f.rel), ...(f.note === undefined ? {} : { note: printable(f.note) }) };
}
let marker;
let findings;
let rollable;
let moveOnly;
let trace;
try {
    // checkBudgets' call order and inputs (scripts/validate-agent-factory.ts).
    marker = readMarker();
    const board = boardFindings();
    const traceIndexFile = readState(TRACEABILITY_REL, "index file");
    const traceIndex = indexFindings(TRACEABILITY_REL, traceIndexFile);
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
    // Trace freshness comes last (plan 37-09, D-01, D-03): the renderer's model over both context roots.
    const traced = traceReport(traceIndexFile);
    trace = { ...traced, findings: sortFindings(traced.findings).map(printableFinding) };
    // The sibling programs' build stamps (plan 37-24, D-17, WR-05): a finding under the marker's severity.
    const skew = runnableSkewFindings();
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
        ...traced.findings,
        ...skew,
    ]).map(printableFinding);
}
catch (e) {
    couldNotRun(`the check failed unexpectedly: ${e.message}`);
}
const enforced = marker.state === "valid";
const exitCode = enforced && findings.length > 0 ? 1 : 0;
// Every line is composed before anything is printed, so a run that cannot finish never prints part of a result.
const out = [];
if (asJson) {
    const asJsonFinding = (f) => ({
        rel: f.rel,
        key: f.key,
        measured: f.measured,
        budget: f.budget,
        unit: f.unit,
        line: f.line ?? null,
        note: f.note ?? null,
    });
    const report = {
        ok: exitCode !== 1,
        marker: marker.state,
        enforced,
        findings: findings.map(asJsonFinding),
        rollable: rollable.map((r) => r.surface),
        moveOnly,
        trace: { compared: trace.compared, findings: trace.findings.map(asJsonFinding) },
    };
    out.push(JSON.stringify(report));
}
else {
    // A ROLLABLE line and a MOVE-ONLY count line are reports: neither changes the exit code; the finding beneath
    // each does, by the marker.
    const reports = [
        ...rollable.map((r) => `ROLLABLE  ${formatRollable(r)} — run ${ROLL_COMMAND} ${printable(rootArg)}`),
        ...moveOnly.map((m) => `MOVE-ONLY ${m.live}: ${m.liveCount ?? "not listed"} live, ${m.archivedCount ?? "not listed"} archived`),
        ...trace.lines,
    ];
    if (enforced) {
        for (const f of findings)
            out.push(`FINDING  ${formatFinding(f)}`);
        out.push(...reports);
        if (findings.length === 0)
            out.push("No findings.");
    }
    else {
        if (marker.state === "invalid")
            out.push(`WARN     ${formatMarkerWarning(LAYOUT_MARKER_REL, printable(marker.reason))}`);
        for (const f of findings)
            out.push(`WARN     ${formatFinding(f)}`);
        out.push(...reports);
        if (marker.state === "absent" && findings.length > 0) {
            out.push(`LAYOUT   no layout marker at ${LAYOUT_MARKER_REL}: budget findings are warnings until the repository is ` +
                "migrated to the v3 layout");
        }
        if (marker.state === "absent" && findings.length === 0)
            out.push("No findings.");
    }
}
process.exitCode = exitCode;
process.stdout.write(`${out.join("\n")}\n`);

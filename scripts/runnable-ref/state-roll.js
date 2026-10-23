// state-roll.ts — the host state roll (phase 37, plans 37-10 and 37-11, SPLIT-06, SPLIT-01, D-07, D-08, D-09).
//
// WHAT IT IS. A kit-shipped runnable in the shape of state-check.ts and trace-render.ts: authored here, compiled
// to a committed state-roll.js, and run on a host as `node state-roll.js <repo-root> [--dry-run]` with only Node
// present. It rolls two surfaces, Done first and progress second, each moved whole, verbatim and with a proof:
//   - Done (D-07). The board's Done column keeps its first BUDGETS.doneRows rows (the contract writes Done newest
//     first), and every later row moves, in board order, to the top of the Done column of
//     memory-bank/plans/archive/board-done.md, which is created with its one `## Done (WIP unlimited)` heading
//     when it is absent.
//   - Progress (D-09). When memory-bank/60-progress.md is over BUDGETS.progressBytes, its dated status entries
//     (`## YYYY-MM-DD` headings) move, oldest date first, to the end of memory-bank/plans/archive/progress.md
//     until the file is within budget or no dated entry remains. A standing `##` section never moves. Where an
//     entry ends is answered by the generated copy of scripts/frontmatter.ts's sectionEndIndex (D-16).
// It never reads, writes or lists the finished-task queue folder or the decision records folder: those are moved
// whole only by a human or a migrate (v3.0 D-7), so their paths are not even embedded here.
//
// THE D-12 CONTRACT.
//   exit 0 → every planned roll was written and proven, or there was nothing to roll. `--dry-run` prints one
//            PLAN line per move (its line numbers and byte count), writes nothing and exits 0 when the rolls
//            could run.
//   exit 1 → a roll was written, its line-conservation proof failed (or a write failed part way), and its two
//            files were written back to their old bytes; an archive this run created was removed. A Done roll
//            that had already been written and proven before a progress roll failed stays written, and stdout
//            says so.
//   exit 2 → a roll could not run or was refused: a bad argument, a root that is not a readable (and, to
//            write, writable) directory, a path that resolves outside the repository root, a missing board, a
//            symbolic link, FIFO or directory where a state file should be, a file the reader refuses or that
//            holds bytes a text write would not keep, a shape a planner refuses (a Done column holding a line
//            that is not a row, an archive with a heading it must not hold, a row or entry the archive already
//            holds, mixed line endings, an ambiguous entry), a file that changed after it was read, or a
//            rollback that could not be completed. Every refusal a planner can find is found before the first
//            write. Exit 2 is never a pass: it prints nothing on stdout, and when a Done roll had already been
//            written and proven, stderr says so. An unexpected error is exit 2 too, reported on stderr by name and
//            never surfacing as Node's own exit 1 (plan 37-20): that line names each roll already written and
//            proven, names a roll that had started without a reported outcome with the version-control remedy,
//            and says no roll had started only when none had. A refusal after this run created the archive
//            directory removes it first.
//
// THE PROOF (D-08). The rules are scripts/state-rules.ts's planners, assembleRoll, checkConservation and
// executeRoll, embedded below. executeRoll writes the archive first and the source second, re-reads both and
// proves that the source equals its old lines with exactly the moved lines removed and the archive equals its
// old lines with exactly the moved lines inserted in the planned order. On a mismatch it writes both files back.
// Lines are removed from the text as read, so a CRLF file keeps CRLF and a byte-order mark stays in place. Each
// roll is atomic on its own: the progress roll runs only after the Done roll was proven.
//
// A RE-RUN AFTER AN INTERRUPTION IS SAFE. Each file is written atomically, so an interruption between the archive
// write and the source write leaves the moved rows or entries in both files. The next run refuses (exit 2) and
// names them, because moving them again would double them in the archive; the board reader reports the overlap
// as ticket-duplicated meanwhile (plan 37-12).
//
// THE ROOT IS A BOUNDARY. Every path is resolved with realpath before it is used, and one that resolves outside
// realpath(root) is refused by name. Every state file is lstat'ed before it is opened, so a FIFO is never opened
// and a symbolic link is never replaced by a file. The archive directory is created only when it is absent and a
// roll is to be written, after its parent's realpath is confirmed inside the root.
//
// EVERY WRITE IS ATOMIC. Each file goes through the embedded atomicWrite (a temp sibling, then a rename), so an
// interrupted roll leaves each file either its old or its new bytes.
//
// OUTPUT IS SANITIZED. Every value read from the repository (an identifier, a heading, a path, a reason) has each
// C0, C1 and DEL code point removed by the embedded stripControlChars before it is printed.
//
// BUILTINS ONLY. A host runs this file with no kit and no node_modules, so it imports `node:` builtins and nothing
// else. The hand-written part below imports them as namespaces, so the names the generated region imports never
// collide with its own.
//
// NOTHING HERE IS RETYPED, WITH ONE NAMED EXCEPTION. The state paths, BUDGETS, the roll rules, the board grammar,
// the section-extent owner, the reader and the writer sit in the generated region, copied verbatim from
// install/state-layout.ts, scripts/state-rules.ts, scripts/board-model.ts, scripts/frontmatter.ts and
// scripts/context-io.ts by scripts/generate-runnable-embeds.ts. scripts/runnable-embeds-freshness.ts fails CI when
// the region differs from a fresh derivation. The exception is DECISION_RECORDS_DIR below: a message names the
// decision records directory, and embedding its constant would put a move-only path in this file. A test in
// state-roll.test.ts binds that one string to install/state-layout.ts's constant.
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
export const MEMORY_BANK_REL = "memory-bank";
export const ARCHIVE_REL = `${STATE_ROOT_REL}/archive`;
export const BOARD_DONE_ARCHIVE_REL = `${ARCHIVE_REL}/board-done.md`;
export const PROGRESS_REL = `${MEMORY_BANK_REL}/60-progress.md`;
export const PROGRESS_ARCHIVE_REL = `${ARCHIVE_REL}/progress.md`;
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
const DONE_COLUMN = "Done";
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
export const DONE_ARCHIVE_HEADING = "## Done (WIP unlimited)";
export function planDoneRoll(texts, model, keep) {
    if (!Number.isInteger(keep) || keep < 0) {
        return { kind: "refuse", reason: `the number of Done rows to keep (${keep}) is not a whole number of rows` };
    }
    const done = model.columns.filter((c) => c.name === DONE_COLUMN);
    if (done.length === 0)
        return { kind: "none", rows: 0 };
    if (done.length > 1) {
        return {
            kind: "refuse",
            reason: `the board has ${done.length} columns named ${DONE_COLUMN} (lines ${done.map((c) => c.line).join(", ")}), ` +
                "so the newest rows have no defined order; merge them by hand first",
        };
    }
    const rows = done[0].rows;
    if (rows.length <= keep)
        return { kind: "none", rows: rows.length };
    // Plan 37-11: a Done column that holds a line other than ticket rows and blank lines is not a shape the roll
    // can reason about (which rows are the newest, and where does the prose belong after the move), so it is
    // refused before anything moves. The grammar names each such line and the column it sat under.
    const prose = model.unparsed.filter((u) => u.column === DONE_COLUMN);
    if (prose.length > 0) {
        return {
            kind: "refuse",
            reason: `the ${DONE_COLUMN} column holds ${prose.length} line(s) that are not ticket rows (line(s) ` +
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
    const lines = [];
    const ids = [];
    const out = [];
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
                reason: `the Done row ${row.id} on line ${row.line} carries an HTML comment, so it was not moved: moving part of ` +
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
export function doneArchiveSkeleton(texts) {
    return `${DONE_ARCHIVE_HEADING}${texts[0]?.endsWith("\r") === true ? "\r" : ""}\n`;
}
function insertLines(text, at, block) {
    const lines = text.split("\n");
    return [...lines.slice(0, at), ...block, ...lines.slice(at)].join("\n");
}
export function planArchiveInsert(archive, texts) {
    if (texts.length === 0)
        return { kind: "refuse", reason: "there are no rows to insert into the Done archive" };
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
            reason: `the Done archive must carry no heading but \`${DONE_ARCHIVE_HEADING}\`; it also carries ` +
                other.map((s) => `\`${s.heading}\` (line ${s.line})`).join(", "),
        };
    }
    const first = column.rows[0];
    let at;
    if (first !== undefined) {
        at = first.line - 1;
    }
    else {
        const h = column.line - 1;
        if (archive.texts.blanked.split("\n")[h] !== archive.texts.normalized.split("\n")[h]) {
            return { kind: "refuse", reason: `the Done archive's heading on line ${column.line} carries an HTML comment` };
        }
        at = column.line;
    }
    const base = archive.texts.raw;
    return { kind: "insert", created: false, base, at, text: insertLines(base, at, texts) };
}
function removeLines(text, lines) {
    const drop = new Set(lines);
    return text
        .split("\n")
        .filter((_, i) => !drop.has(i + 1))
        .join("\n");
}
export function assembleRoll(sourceRel, archiveRel, before, roll, insert, surface = "done") {
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
function firstDifference(a, b) {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++)
        if (a[i] !== b[i])
            return i;
    return -1;
}
export function checkConservation(before, after, plan) {
    const { sourceRel, archiveRel, lines, texts } = plan;
    if (lines.length === 0 || lines.length !== texts.length) {
        return `the plan moves ${lines.length} line(s) and carries ${texts.length} text(s)`;
    }
    // The archive order must place every moved line exactly once (plan 37-11), so no line can be doubled or
    // dropped by the order alone.
    const order = plan.insertOrder ?? texts.map((_, k) => k);
    const placed = new Set(order);
    if (order.length !== texts.length ||
        placed.size !== order.length ||
        order.some((k) => !Number.isInteger(k) || k < 0 || k >= texts.length)) {
        return `the planned archive order does not place each of the ${texts.length} moved line(s) exactly once`;
    }
    const inserted = order.map((k) => texts[k]);
    const old = before.source.split("\n");
    const drop = new Set();
    for (let k = 0; k < lines.length; k++) {
        const line = lines[k];
        if (k > 0 && line <= lines[k - 1])
            return `the planned board lines are not in ascending order`;
        if (old[line - 1] !== texts[k])
            return `${sourceRel} line ${line} as read is not the row the plan moves`;
        drop.add(line);
    }
    if (after.source === null)
        return `${sourceRel} is absent after the roll`;
    const expectedSource = old.filter((_, i) => !drop.has(i + 1));
    const gotSource = after.source.split("\n");
    const s = firstDifference(gotSource, expectedSource);
    if (s !== -1) {
        return (`${sourceRel} line ${s + 1} differs from the old board with the moved rows removed ` +
            `(${gotSource.length} line(s), expected ${expectedSource.length})`);
    }
    const base = before.archive ??
        ((plan.surface ?? "done") === "progress" ? progressArchiveSkeleton(inserted, sourceRel) : doneArchiveSkeleton(texts));
    if (plan.archiveBase !== base)
        return `the archive text the plan inserts into is not ${archiveRel} as read`;
    const baseLines = base.split("\n");
    if (!Number.isInteger(plan.insertAt) || plan.insertAt < 1 || plan.insertAt > baseLines.length) {
        return `the planned insert line ${plan.insertAt} is outside ${archiveRel}`;
    }
    if (after.archive === null)
        return `${archiveRel} is absent after the roll`;
    const expectedArchive = [...baseLines.slice(0, plan.insertAt), ...inserted, ...baseLines.slice(plan.insertAt)];
    const gotArchive = after.archive.split("\n");
    const a = firstDifference(gotArchive, expectedArchive);
    if (a !== -1) {
        return (`${archiveRel} line ${a + 1} differs from the old archive with the moved rows inserted ` +
            `(${gotArchive.length} line(s), expected ${expectedArchive.length})`);
    }
    return null;
}
function messageOf(e) {
    return e instanceof Error ? e.message : String(e);
}
export function executeRoll(plan, io) {
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
    }
    catch (e) {
        return { ok: false, stage: "changed", reason: `the files could not be re-read before the roll: ${messageOf(e)}` };
    }
    let reason;
    try {
        io.write(archiveRel, after.archive);
        io.write(sourceRel, after.source);
        reason = checkConservation(before, { source: io.read(sourceRel), archive: io.read(archiveRel) }, plan);
    }
    catch (e) {
        reason = `the roll stopped part way: ${messageOf(e)}`;
    }
    if (reason === null)
        return { ok: true };
    const failures = [];
    // Plan 37-11: a file that already holds its old bytes (a write that threw before it replaced the file) is
    // left alone, so a file whose directory refuses writes does not turn a clean rollback into a failed one.
    const holds = (rel, old) => {
        try {
            return io.read(rel) === old;
        }
        catch {
            return false;
        }
    };
    try {
        if (!holds(sourceRel, before.source))
            io.write(sourceRel, before.source);
    }
    catch (e) {
        failures.push(`${sourceRel} could not be written back (${messageOf(e)})`);
    }
    try {
        if (before.archive === null) {
            if (!holds(archiveRel, null))
                io.remove(archiveRel);
        }
        else if (!holds(archiveRel, before.archive)) {
            io.write(archiveRel, before.archive);
        }
    }
    catch (e) {
        failures.push(`${archiveRel} could not be ${before.archive === null ? "removed" : "written back"} (${messageOf(e)})`);
    }
    try {
        if (io.read(sourceRel) !== before.source)
            failures.push(`${sourceRel} does not hold its old bytes`);
        if (io.read(archiveRel) !== before.archive) {
            failures.push(before.archive === null ? `${archiveRel} is still present` : `${archiveRel} does not hold its old bytes`);
        }
    }
    catch (e) {
        failures.push(`the restored files could not be re-read (${messageOf(e)})`);
    }
    if (failures.length > 0)
        return { ok: false, stage: "restore-failed", reason: `${reason}; ${failures.join("; ")}` };
    return { ok: false, stage: "rolled-back", reason };
}
export const PROGRESS_ARCHIVE_TITLE = "# Progress archive";
function lineBytes(raw) {
    return utf8Bytes(raw) + 1;
}
export function planProgressRoll(texts, budgetBytes, sectionEnd) {
    if (!Number.isInteger(budgetBytes) || budgetBytes < 0) {
        return { kind: "refuse", reason: `the progress budget (${budgetBytes}) is not a whole number of bytes` };
    }
    const bytes = utf8Bytes(texts.raw);
    const entries = progressEntries(texts.blanked);
    const standing = entries.standing.map((s) => s.heading);
    const dated = entries.dated.length;
    if (bytes <= budgetBytes || dated === 0)
        return { kind: "none", bytes, dated, standing };
    const raw = texts.raw.split("\n");
    const normalized = texts.normalized.split("\n");
    const blanked = texts.blanked.split("\n");
    if (raw.length !== normalized.length || raw.length !== blanked.length) {
        return { kind: "refuse", reason: "the progress file's raw, normalized and comment-blanked forms do not have one line count" };
    }
    const headingAt = new Map();
    for (const e of [...entries.dated, ...entries.standing])
        headingAt.set(e.line - 1, e.heading);
    /** The entry `e` as a block, or the reason it cannot move. */
    const blockOf = (e) => {
        const start = e.line - 1;
        const name = `the entry \`## ${e.heading}\` (line ${e.line})`;
        if (sectionEnd(texts.blanked, start, 2) !== start) {
            return `${name} sits inside a fenced block, so it opens no entry; move it out of the fence by hand`;
        }
        let end = sectionEnd(texts.blanked, start + 1, 2);
        // The empty string after a final line feed is the file's end, not a line of the last entry.
        if (end === raw.length && end - 1 > start && raw[end - 1] === "")
            end -= 1;
        const lines = [];
        const out = [];
        let size = 0;
        for (let i = start; i < end; i++) {
            const inner = headingAt.get(i);
            if (i > start && inner !== undefined) {
                return (`the heading \`## ${inner}\` on line ${i + 1} sits inside ${name} without ending it (it is fenced, or ` +
                    "it has no text after its hashes), so the entry's extent is ambiguous; fix that heading by hand");
            }
            const rawLine = raw[i];
            const line = normalized[i];
            if (blanked[i] !== line) {
                return (`${name} carries an HTML comment on line ${i + 1}, so it was not moved: moving part of a comment ` +
                    "would change which lines it hides; move that entry by hand");
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
    const oldestFirst = [...entries.dated].sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.line - b.line);
    const blocks = [];
    let left = bytes;
    for (const e of oldestFirst) {
        if (left <= budgetBytes)
            break;
        const block = blockOf(e);
        if (typeof block === "string")
            return { kind: "refuse", reason: block };
        blocks.push(block);
        left -= block.bytes;
    }
    const lines = blocks.flatMap((b) => b.lines).sort((a, b) => a - b);
    const indexOf = new Map(lines.map((l, k) => [l, k]));
    const order = blocks.flatMap((b) => b.lines.map((l) => indexOf.get(l)));
    const remaining = utf8Bytes(removeLines(texts.raw, lines));
    return {
        kind: "roll",
        bytes,
        remaining,
        dated,
        standing,
        blocks,
        lines,
        texts: lines.map((l) => raw[l - 1]),
        order,
    };
}
export function progressArchiveSkeleton(inserted, sourceRel) {
    const eol = inserted[0]?.endsWith("\r") === true ? "\r\n" : "\n";
    return [
        PROGRESS_ARCHIVE_TITLE,
        "",
        `<!-- Dated status entries moved whole from ${sourceRel} by state-roll, oldest first. Move only: never ` +
            "edit, squash or prune an entry here. -->",
        "",
    ].join(eol);
}
function appendAt(text) {
    const lines = text.split("\n");
    return lines.at(-1) === "" ? lines.length - 1 : lines.length;
}
export function planProgressAppend(archive, roll, sourceRel, sectionEnd, view) {
    const inserted = roll.order.map((k) => roll.texts[k]);
    if (inserted.length === 0)
        return { kind: "refuse", reason: "there are no entries to append to the progress archive" };
    let base;
    if (archive === null) {
        base = progressArchiveSkeleton(inserted, sourceRel);
    }
    else {
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
                reason: `the progress archive already holds the heading line of ${doubled.length} entry(ies) this roll would ` +
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
        const line = inserted[j];
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
export function doneDuplicateRefusal(ids, archive) {
    if (archive === null)
        return null;
    const present = new Set(archive.columns.flatMap((c) => c.rows.map((r) => r.id)));
    const doubled = ids.filter((id) => present.has(id));
    if (doubled.length === 0)
        return null;
    return (`the Done archive already holds ${doubled.length} row(s) this roll would move (${doubled.join(", ")}): an ` +
        "earlier roll was interrupted after it wrote the archive, or the rows were copied by hand. Nothing was moved; " +
        "once each copy is confirmed equal, delete the board's row by hand and run state-roll again");
}
export function lineEndings(text) {
    const lines = text.split("\n");
    if (lines.length === 1)
        return "none";
    let cr = 0;
    for (let i = 0; i < lines.length - 1; i++)
        if (lines[i].endsWith("\r"))
            cr++;
    if (cr === 0)
        return "lf";
    return cr === lines.length - 1 ? "crlf" : "mixed";
}
export function lineEndingRefusal(plan) {
    const files = [
        [plan.sourceRel, plan.before.source, plan.after.source],
        [plan.archiveRel, plan.before.archive, plan.after.archive],
    ];
    for (const [rel, before] of files) {
        if (before !== null && lineEndings(before) === "mixed") {
            return `${rel} already mixes LF and CRLF line endings, so it was not rolled; give it one line ending first`;
        }
    }
    for (const [rel, , after] of files) {
        if (lineEndings(after) === "mixed") {
            return (`the roll would leave ${rel} with mixed LF and CRLF line endings, because ${plan.sourceRel} and ` +
                `${plan.archiveRel} do not end their lines the same way (or the last moved line has no line ending); ` +
                "give both files the same line ending first");
        }
    }
    return null;
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
    if (!TICKET_ID.test(id))
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
// from scripts/context-io.ts
export function atomicWrite(finalPath, data) {
    const tmp = `${finalPath}.tmp-${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    writeFileSync(tmp, data, "utf8");
    try {
        renameSync(tmp, finalPath);
    }
    catch (e) {
        const code = e.code;
        if (code === "EPERM" || code === "EEXIST" || code === "EACCES") {
            // Windows branch: remove the destination, then retry the rename.
            try {
                unlinkSync(finalPath);
            }
            catch {
                /* not-present is fine */
            }
            renameSync(tmp, finalPath);
        }
        else {
            // Any other error: best-effort temp cleanup, then rethrow.
            try {
                unlinkSync(tmp);
            }
            catch {
                /* best-effort */
            }
            throw e;
        }
    }
}
export const CANONICAL_READ_POSITION = "absent, or a regular file";
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
// </runnable-embeds>
// ── The hand-written part: argv, the boundary checks, the reads, the plans, the io and the report ─────────
/** The rolls written and proven so far, read by the unexpected-throw handler below (plan 37-20). */
const proven = [];
/** The roll executeRoll is running, or whose outcome is being reported; null between rolls. */
let rollInFlight = null;
// EXIT-1 (plan 37-20, D-12, D-17): a throw that escapes every inner catch is could-not-run, never the finding code.
// Registered before argv is read, and every binding the handler reads is declared above it.
process.on("uncaughtException", (e) => stoppedUnexpectedly(e));
/**
 * The roll stopped on an unexpected throw: one sanitized line on stderr, nothing on stdout, exit 2. executeRoll
 * contains every throw of a roll's own reads, writes, proof and restore, so a throw reaches here only before the
 * rolls or while an outcome is reported. The handler cannot know whether a started roll was undone, so it never
 * says that nothing was rolled or written: it names each roll already written and proven, names a roll that had
 * started without a reported outcome with the version-control remedy, and says no roll had started only when none
 * had.
 */
function stoppedUnexpectedly(e) {
    const message = e instanceof Error ? e.message : String(e);
    const stands = proven.map((p) => ` The ${p.surface} roll was written and proven and stays: ${p.what} (${p.moved}).`);
    const started = rollInFlight === null
        ? ""
        : ` The ${rollInFlight.surface} roll had started and its outcome was not reported: compare ` +
            `${rollInFlight.files} with version control before anything else writes them.`;
    const none = proven.length === 0 && rollInFlight === null ? " No roll had started." : "";
    process.stderr.write(`Error: the roll stopped unexpectedly (${printable(message)}).${printable(stands.join(""))}` +
        `${printable(started)}${none} The roll did not finish.\n`);
    process.exit(2);
}
/**
 * The largest state file this roll reads, in bytes. This is a reader ceiling, not a budget: a larger file is
 * refused rather than read, and the roll does not run (exit 2).
 */
const READ_CEILING_BYTES = 16 * 1024 * 1024;
/**
 * The decision records directory, named only in a message (D-09: standing content belongs there). It is the
 * one string this file types instead of embedding: the constant is a move-only path (v3.0 D-7), and the roll
 * never reaches that directory. scripts/runnable-ref/state-roll.test.ts binds it to install/state-layout.ts.
 */
const DECISION_RECORDS_DIR = "memory-bank/50-decisions";
const DRY_RUN_FLAG = "--dry-run";
const USAGE = `Usage: node state-roll.js <repo-root> [${DRY_RUN_FLAG}]`;
/** One value made safe to print: the embedded rule removes every C0, C1 and DEL code point. */
function printable(value) {
    return stripControlChars(value, false);
}
/** The roll could not run: one sanitized message on stderr, nothing on stdout, exit 2. Never a pass. */
function couldNotRun(message) {
    process.stderr.write(`Error: ${printable(message)} Nothing was rolled.\n`);
    process.exit(2);
}
/** The errno code of a thrown filesystem error, for a message. */
function codeOf(e) {
    return e.code ?? "unknown error";
}
const args = process.argv.slice(2);
const unknownFlag = args.find((a) => a.startsWith("--") && a !== DRY_RUN_FLAG);
if (unknownFlag !== undefined)
    couldNotRun(`unknown option ${unknownFlag}. ${USAGE}.`);
const dryRunCount = args.filter((a) => a === DRY_RUN_FLAG).length;
if (dryRunCount > 1)
    couldNotRun(`${DRY_RUN_FLAG} was given more than once. ${USAGE}.`);
/** True in the mode that plans and writes nothing. */
const DRY_RUN = dryRunCount === 1;
const positional = args.filter((a) => a !== DRY_RUN_FLAG);
const rootArg = positional[0];
if (rootArg === undefined)
    couldNotRun(`no repository root was given. ${USAGE}.`);
if (positional.length > 1)
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
    // A dry run needs to read only; a roll needs to write too.
    const C = nodeFs.constants;
    nodeFs.accessSync(root, DRY_RUN ? C.R_OK | C.X_OK : C.R_OK | C.W_OK | C.X_OK);
}
catch (e) {
    couldNotRun(`the repository root ${rootArg} is not a readable${DRY_RUN ? "" : " and writable"} directory (${codeOf(e)}).`);
}
/** True when an already-resolved absolute path is the root or lies under it. */
function insideRoot(real) {
    return real === root || real.startsWith(root + nodePath.sep);
}
/** The absolute path of a repository-relative path with `/` separators. */
function abs(rel) {
    return nodePath.join(root, ...rel.split("/"));
}
/** The repository-relative parent of a repository-relative path. */
function relParent(rel) {
    return rel.slice(0, rel.lastIndexOf("/"));
}
/** The last segment of a repository-relative path. */
function relBase(rel) {
    return rel.slice(rel.lastIndexOf("/") + 1);
}
/**
 * The real path of the directory at `rel`, or null when nothing is there. Anything else is refused by name: a
 * path that resolves outside the root, a present entry that is not a directory, or one that cannot be resolved.
 */
function realDirectoryOrNull(rel, what) {
    const path = abs(rel);
    try {
        nodeFs.lstatSync(path);
    }
    catch (e) {
        if (codeOf(e) === "ENOENT")
            return null;
        couldNotRun(`${what} ${rel} cannot be inspected (${codeOf(e)}).`);
    }
    let real;
    try {
        real = nodeFs.realpathSync(path);
    }
    catch (e) {
        couldNotRun(`${what} ${rel} cannot be resolved (${codeOf(e)}).`);
    }
    if (!insideRoot(real))
        couldNotRun(`${what} ${rel} resolves outside the repository root, so it was not used.`);
    let st;
    try {
        st = nodeFs.statSync(real);
    }
    catch (e) {
        couldNotRun(`${what} ${rel} cannot be inspected (${codeOf(e)}).`);
    }
    if (!st.isDirectory())
        couldNotRun(`${what} ${rel} is not a directory.`);
    return real;
}
/**
 * The text of the file at `path` (`rel` names it), or null when nothing is there. It is lstat'ed first, so a
 * symbolic link, a FIFO, a device or a directory is refused by name and never opened; then it is read through
 * the embedded non-blocking reader under the read ceiling. A text holding U+FFFD is refused too: a roll writes
 * text, so a byte the decoder replaced would not be written back as it was. Every refusal THROWS, so the
 * executor can still restore both files when a re-read during the roll is refused.
 */
function readTextOrThrow(rel, path) {
    let st;
    try {
        st = nodeFs.lstatSync(path);
    }
    catch (e) {
        if (codeOf(e) === "ENOENT")
            return null;
        throw new Error(`${rel} cannot be inspected (${codeOf(e)})`);
    }
    if (st.isSymbolicLink()) {
        throw new Error(`${rel} is a symbolic link, and a roll would replace the link with a file`);
    }
    if (!st.isFile())
        throw new Error(`${rel} is present and is not a regular file, so it was not opened`);
    let text;
    try {
        text = readRegularFileOrNull(path, READ_CEILING_BYTES, "state file");
    }
    catch (e) {
        const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
        throw new Error(`${rel} is present and cannot be read (${condition})`);
    }
    if (text !== null && text.includes("�")) {
        throw new Error(`${rel} holds U+FFFD or bytes that are not UTF-8, and a roll writes text, so those bytes would not be kept`);
    }
    return text;
}
/** readTextOrThrow for the planning reads, where a refusal is could-not-run. */
function readText(rel, path) {
    try {
        return readTextOrThrow(rel, path);
    }
    catch (e) {
        couldNotRun(`${e instanceof Error ? e.message : String(e)}.`);
    }
}
// ── The reads ───────────────────────────────────────────────────────────────────────────────────────
const boardDirRel = relParent(BOARD_REL);
const boardDirReal = realDirectoryOrNull(boardDirRel, "the state directory");
if (boardDirReal === null)
    couldNotRun(`the state directory ${boardDirRel} does not exist; install grugops first.`);
const boardPath = nodePath.join(boardDirReal, relBase(BOARD_REL));
const boardText = readText(BOARD_REL, boardPath);
if (boardText === null)
    couldNotRun(`the board file ${BOARD_REL} does not exist.`);
const archiveParentRel = relParent(ARCHIVE_REL);
const archiveParentReal = realDirectoryOrNull(archiveParentRel, "the state directory");
if (archiveParentReal === null)
    couldNotRun(`the state directory ${archiveParentRel} does not exist; install grugops first.`);
const archiveDirReal = realDirectoryOrNull(ARCHIVE_REL, "the archive directory");
for (const rel of [BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL]) {
    if (relParent(rel) !== ARCHIVE_REL)
        couldNotRun(`the archive ${rel} does not sit in the archive directory ${ARCHIVE_REL}.`);
}
/** Where the archive directory is, or will be once a roll creates it under its confirmed parent. */
const archiveDirPath = archiveDirReal ?? nodePath.join(archiveParentReal, relBase(ARCHIVE_REL));
const doneArchivePath = nodePath.join(archiveDirPath, relBase(BOARD_DONE_ARCHIVE_REL));
const doneArchiveText = archiveDirReal === null ? null : readText(BOARD_DONE_ARCHIVE_REL, doneArchivePath);
const progressDirRel = relParent(PROGRESS_REL);
const progressDirReal = realDirectoryOrNull(progressDirRel, "the memory bank directory");
const progressPath = progressDirReal === null ? null : nodePath.join(progressDirReal, relBase(PROGRESS_REL));
const progressText = progressPath === null ? null : readText(PROGRESS_REL, progressPath);
const progressArchivePath = nodePath.join(archiveDirPath, relBase(PROGRESS_ARCHIVE_REL));
const progressArchiveText = archiveDirReal === null ? null : readText(PROGRESS_ARCHIVE_REL, progressArchivePath);
// ── The plans: every refusal a planner can find is found here, before anything is written ────────────
/** The three forms of a document the planners read. */
function formsOf(raw) {
    const normalized = normalizeDocument(raw);
    return { raw, normalized, blanked: stripHtmlComments(normalized) };
}
/** The three forms of a board-grammar document and its parse. */
function documentOf(raw) {
    return { texts: formsOf(raw), model: parseBoard(raw) };
}
/** A text's normalized, comment-blanked form: the view the progress planners read an archive through. */
function viewOf(raw) {
    return stripHtmlComments(normalizeDocument(raw));
}
/** The status lines of the surfaces that have nothing to roll. */
const idle = [];
/** The UTF-8 bytes a raw line takes with its line feed. */
function bytesOfLine(raw) {
    return utf8Bytes(raw) + 1;
}
const board = documentOf(boardText);
const doneRoll = planDoneRoll(board.texts, board.model, BUDGETS.doneRows);
if (doneRoll.kind === "refuse")
    couldNotRun(`${BOARD_REL}: ${doneRoll.reason}.`);
let done = null;
if (doneRoll.kind === "none") {
    idle.push(`Nothing to roll: the Done column of ${BOARD_REL} holds ${doneRoll.rows} row(s), and it keeps ` +
        `${BUDGETS.doneRows} (BUDGETS.doneRows).`);
}
else {
    const archive = doneArchiveText === null ? null : documentOf(doneArchiveText);
    const insert = planArchiveInsert(archive, doneRoll.texts);
    if (insert.kind === "refuse")
        couldNotRun(`${BOARD_DONE_ARCHIVE_REL}: ${insert.reason}.`);
    const doubled = doneDuplicateRefusal(doneRoll.ids, archive === null ? null : archive.model);
    if (doubled !== null)
        couldNotRun(`${BOARD_DONE_ARCHIVE_REL}: ${doubled}.`);
    const plan = assembleRoll(BOARD_REL, BOARD_DONE_ARCHIVE_REL, { source: boardText, archive: doneArchiveText }, doneRoll, insert, "done");
    const endings = lineEndingRefusal(plan);
    if (endings !== null)
        couldNotRun(`${endings}.`);
    const target = `${BOARD_DONE_ARCHIVE_REL}${insert.created ? " (a new file)" : ""}`;
    done = {
        plan,
        created: insert.created,
        planLines: doneRoll.ids.map((id, k) => `PLAN    done      ${printable(id)}  line ${doneRoll.lines[k]}  ${bytesOfLine(doneRoll.texts[k])} ` +
            `bytes  -> ${target}`),
        movedLines: doneRoll.ids.map((id) => `MOVED   ${printable(id)}`),
        what: `${doneRoll.lines.length} Done row(s) from ${BOARD_REL} to the top of ${target}`,
    };
}
let progress = null;
if (progressText === null) {
    idle.push(`Nothing to roll: ${PROGRESS_REL} does not exist.`);
}
else {
    const progressRoll = planProgressRoll(formsOf(progressText), BUDGETS.progressBytes, sectionEndIndex);
    if (progressRoll.kind === "refuse")
        couldNotRun(`${PROGRESS_REL}: ${progressRoll.reason}.`);
    if (progressRoll.kind === "none") {
        if (progressRoll.bytes <= BUDGETS.progressBytes) {
            idle.push(`Nothing to roll: ${PROGRESS_REL} is ${progressRoll.bytes} bytes, within its budget of ` +
                `${BUDGETS.progressBytes} bytes (BUDGETS.progressBytes).`);
        }
        else {
            const sections = progressRoll.standing.length === 0
                ? "it has no `##` section, so its text belongs"
                : `its standing sections ${progressRoll.standing.map((h) => `\`## ${printable(h)}\``).join(", ")} belong`;
            idle.push(`Nothing can roll: ${PROGRESS_REL} is ${progressRoll.bytes} bytes, over its budget of ` +
                `${BUDGETS.progressBytes} bytes (BUDGETS.progressBytes), and it holds no dated status entry (a ` +
                `\`## YYYY-MM-DD\` heading), so nothing in it moves. Standing content is not progress: ${sections} in ` +
                `${DECISION_RECORDS_DIR}/ as decision records (D-09).`);
        }
    }
    else {
        const append = planProgressAppend(progressArchiveText === null ? null : formsOf(progressArchiveText), progressRoll, PROGRESS_REL, sectionEndIndex, viewOf);
        if (append.kind === "refuse")
            couldNotRun(`${PROGRESS_ARCHIVE_REL}: ${append.reason}.`);
        const plan = assembleRoll(PROGRESS_REL, PROGRESS_ARCHIVE_REL, { source: progressText, archive: progressArchiveText }, progressRoll, append, "progress");
        const endings = lineEndingRefusal(plan);
        if (endings !== null)
            couldNotRun(`${endings}.`);
        const target = `${PROGRESS_ARCHIVE_REL}${append.created ? " (a new file)" : ""}`;
        const span = (b) => {
            const first = b.lines[0];
            const last = b.lines[b.lines.length - 1];
            return first === last ? `line ${first}` : `lines ${first}-${last}`;
        };
        progress = {
            plan,
            created: append.created,
            planLines: progressRoll.blocks.map((b) => `PLAN    progress  \`## ${printable(b.heading)}\`  ${span(b)}  ${b.bytes} bytes  -> ${target}`),
            movedLines: progressRoll.blocks.map((b) => `MOVED   \`## ${printable(b.heading)}\``),
            what: `${progressRoll.blocks.length} progress entry(ies) from ${PROGRESS_REL} to the end of ${target}; ` +
                `${PROGRESS_REL} goes from ${progressRoll.bytes} to ${progressRoll.remaining} bytes (budget ` +
                `${BUDGETS.progressBytes}, BUDGETS.progressBytes)` +
                (progressRoll.remaining > BUDGETS.progressBytes
                    ? `, still over budget once every dated entry has moved: its standing sections belong in ` +
                        `${DECISION_RECORDS_DIR}/ as decision records (D-09)`
                    : ""),
        };
    }
}
if (DRY_RUN) {
    const lines = [...(done?.planLines ?? []), ...(progress?.planLines ?? []), ...idle];
    if (done !== null)
        lines.push(`Dry run: ${done.what.replace(" from ", " would move from ")}; nothing was written.`);
    if (progress !== null)
        lines.push(`Dry run: ${progress.what.replace(" from ", " would move from ")}; nothing was written.`);
    if (done === null && progress === null)
        lines.push("Dry run: nothing would move; nothing was written.");
    process.stdout.write(`${lines.join("\n")}\n`);
    process.exit(0);
}
if (done === null && progress === null) {
    process.stdout.write(`${idle.join("\n")}\n`);
    process.exit(0);
}
// ── The rolls: Done first, then progress, each atomic on its own ─────────────────────────────────────
let createdDir = false;
/** Remove the archive directory this run created, when it is empty again. A failure leaves it in place. */
function removeCreatedDir() {
    if (!createdDir)
        return;
    try {
        nodeFs.rmdirSync(archiveDirPath);
    }
    catch {
        /* not empty or not removable: an empty directory is not state, and a non-empty one is never removed */
    }
}
if (archiveDirReal === null) {
    try {
        nodeFs.mkdirSync(archiveDirPath);
    }
    catch (e) {
        couldNotRun(`the archive directory ${ARCHIVE_REL} cannot be created (${codeOf(e)}).`);
    }
    createdDir = true;
    // SR-8 (plan 37-20): a refusal after the directory was created removes it first, so the tree is unchanged.
    let made;
    try {
        made = nodeFs.realpathSync(archiveDirPath);
    }
    catch (e) {
        removeCreatedDir();
        couldNotRun(`the archive directory ${ARCHIVE_REL} cannot be resolved after it was created (${codeOf(e)}).`);
    }
    if (!insideRoot(made)) {
        removeCreatedDir();
        couldNotRun(`the archive directory ${ARCHIVE_REL} resolves outside the repository root.`);
    }
}
const paths = new Map([
    [BOARD_REL, boardPath],
    [BOARD_DONE_ARCHIVE_REL, doneArchivePath],
    ...(progressPath === null ? [] : [[PROGRESS_REL, progressPath]]),
    [PROGRESS_ARCHIVE_REL, progressArchivePath],
]);
/** The absolute path executeRoll's io acts on for `rel`; only the planned state files are reachable. */
function pathOf(rel) {
    const path = paths.get(rel);
    if (path === undefined)
        throw new Error(`${rel} is not a file this roll touches`);
    return path;
}
const io = {
    read: (rel) => readTextOrThrow(rel, pathOf(rel)),
    write: (rel, text) => atomicWrite(pathOf(rel), text),
    remove: (rel) => nodeFs.unlinkSync(pathOf(rel)),
};
/** What stdout says about the rolls written and proven so far. */
const written = [];
/** The sentence stderr adds after a progress failure when the Done roll before it stands. */
function doneStands() {
    return done === null || written.length === 0
        ? ""
        : ` The Done roll before it was written and proven and stays: ${done.what}` +
            ` (${done.movedLines.map((l) => l.slice("MOVED   ".length)).join(", ")}).`;
}
/** Run one planned roll and handle every outcome but success. `surface` names it in a message. */
function runRoll(p, surface) {
    const files = `${p.plan.sourceRel} and ${p.plan.archiveRel}`;
    // Set before the roll starts and cleared only once its outcome line is written (plan 37-20).
    rollInFlight = { surface, files };
    const outcome = executeRoll(p.plan, io);
    if (outcome.ok) {
        written.push(...p.movedLines, `Rolled ${p.what}; the move was proven line for line.`);
        proven.push({ surface, what: p.what, moved: p.movedLines.map((l) => l.slice("MOVED   ".length)).join(", ") });
        rollInFlight = null;
        return;
    }
    if (outcome.stage === "changed") {
        removeCreatedDir();
        process.stderr.write(`Error: ${printable(outcome.reason)}. The ${surface} roll wrote nothing.${printable(doneStands())}\n`);
        rollInFlight = null;
        process.exit(2);
    }
    if (outcome.stage === "restore-failed") {
        process.stderr.write(`Error: ${printable(outcome.reason)}. The ${surface} roll failed and could not be fully undone: compare ` +
            `${files} with version control before anything else writes them.${printable(doneStands())}\n`);
        rollInFlight = null;
        process.exit(2);
    }
    removeCreatedDir();
    const rest = surface === "Done" && progress !== null ? " The progress roll was not attempted." : "";
    process.stdout.write(`${[
        ...written,
        `ROLLED BACK (${surface}): ${printable(outcome.reason)}. ${files} hold their old bytes` +
            `${p.created ? ", and the archive this run created was removed" : ""}.${rest}`,
    ].join("\n")}\n`);
    rollInFlight = null;
    process.exit(1);
}
if (done !== null)
    runRoll(done, "Done");
if (progress !== null)
    runRoll(progress, "progress");
process.stdout.write(`${[...written, ...idle].join("\n")}\n`);
process.exit(0);

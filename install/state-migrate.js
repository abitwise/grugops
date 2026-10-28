// state-migrate.ts — the pure planner of `install --migrate`'s v3 state arm, and its stage-A conservation proof
// (phase 38, plan 38-02, MIGRATE-02, MIGRATE-03, MIGRATE-05).
//
// WHAT THIS OWNS. planStateMigrate turns the bytes of a pre-v3 planning root into the v3 board, the `## Board notes`
// sections appended to tickets, the board-updates file, the orphan-notes file, and the archive moves and writes that
// place every original (D-01 to D-04, D-17, D-21 option-a), with the refusals a planner can find and the budgets the
// planned state still breaks. Plan 38-04 adds the NFR catalog and the traceability file (D-05 archive half, D-06):
// each NFR table row and every `##` section naming that NFR alone become nfr/NFR-xxx.md, every other catalog line goes
// verbatim to the NFR notes file, the new catalog is the kit seed plus one index line per row, the traceability file
// is the kit seed, and both originals are archived unchanged. proveStateMigrate is the D-09 stage-A proof over those outputs: the multiset of
// non-blank original board lines equals the multiset of output lines once the generated lines are removed BY
// POSITION (each asserted equal to its kind's template, MIGRATE_GENERATED_LINE_KINDS being the one closed set) and
// each cut row is rejoined with its trailer. It takes the written bytes as a parameter, so the same function proves
// the plan in memory and proves the bytes the installer re-reads from its staging directory.
//
// PURE. No function here reads a file, a clock or the environment: the installer (plan 38-03) reads every input
// through readUserFile, passes the migration date in, and executes the plan.
//
// IMPORT EDGES. install/ never imports scripts/. The board grammar, the ticket grammar, the section-extent owner,
// the task-folder name rule and the state rules reach this module only through the generated region below, one
// row of scripts/generate-runnable-embeds.ts EMBED_SPECS of kind `module`, freshness-checked by
// scripts/runnable-embeds-freshness.ts; it carries no build stamp. The state paths come from ./state-layout.js,
// the one place they are spelled, so the region embeds none of them.
//
// THE TRAILER IS CUT FROM THE RAW LINE. parseBoard is asked only which lines are ticket rows. Its `trailer` field is
// shortened at MAX_META_CHARS (1,024), so it is never the source of a cut; cutRow re-splits the raw line with the
// region's own ROW and splitRow, and the kept row is the raw line minus the trailer, byte for byte.
//
// Voice: clear professional voice (CLAUDE.md hard rule). This is the first grugops operation that rewrites user
// state, and every printed user value passes through the embedded stripControlChars.
import { BOARD_REL, BUDGETS, LEGACY_BOARD_REL, LEGACY_STATE_ROOT_REL, NFR_CATALOG_REL, NFR_DIR_REL, PRE_V3_BOARD_REL, PRE_V3_BOARD_UPDATES_REL, PRE_V3_NFR_CATALOG_REL, PRE_V3_NFR_NOTES_REL, PRE_V3_ORPHAN_NOTES_REL, PRE_V3_TICKETS_REL, PRE_V3_TRACEABILITY_REL, STATE_ROOT_REL, TICKETS_REL, TRACEABILITY_REL, } from "./state-layout.js";
// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
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
export const TICKET_KEYS = [
    "id",
    "title",
    "status",
    "column",
    "size",
    "priority",
    "epic",
    "feature",
];
export const TICKET_REFUSAL_CODES = [
    "no-opening-delimiter",
    "no-closing-delimiter",
    "unknown-key",
    "duplicate-key",
    "unrecognized-line",
    "control-character",
];
const TICKET_DELIMITER = "---";
const TICKET_KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):(?: ([^\t]*))?$/;
export const TICKET_CONTROL = /[\x00-\x08\x0b-\x1f\x7f]/;
export const RENDER_STRIPPED = /[\u0000-\u001F\u007F-\u009F]/g;
export function visible(text) {
    return text.replace(RENDER_STRIPPED, (c) => `<U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}>`);
}
export function spelled(parts, ...values) {
    let out = parts[0] ?? "";
    for (let i = 0; i < values.length; i += 1) {
        out += visible(String(values[i])) + (parts[i + 1] ?? "");
    }
    return out;
}
const ticketRefusal = (code, reason) => ({
    ok: false,
    code,
    reason,
});
export function parseTicketDocument(text) {
    const normalized = normalizeDocument(text);
    const lines = normalized.split("\n");
    if (lines[0] !== TICKET_DELIMITER) {
        return ticketRefusal("no-opening-delimiter", "a ticket document opens with a `---` line and this one opens with " +
            spelled `\`${(lines[0] ?? "").slice(0, 40)}\``);
    }
    let close = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i] === TICKET_DELIMITER) {
            close = i;
            break;
        }
    }
    if (close === -1) {
        return ticketRefusal("no-closing-delimiter", "the frontmatter region opens with `---` and no later line closes it, so where the region " +
            "ends is a guess");
    }
    const values = {};
    for (let i = 1; i < close; i++) {
        const line = lines[i];
        if (line.trim() === "")
            continue;
        if (TICKET_CONTROL.test(line)) {
            return ticketRefusal("control-character", spelled `line ${i + 1} carries a control character, which no terminal renders and no human ` +
                "wrote deliberately");
        }
        const m = TICKET_KEY_LINE.exec(line);
        if (m === null) {
            return ticketRefusal("unrecognized-line", spelled `line ${i + 1} is \`${line.slice(0, 60)}\`, which is neither \`key: value\` nor \`key:\``);
        }
        const key = m[1];
        if (!TICKET_KEYS.includes(key)) {
            return ticketRefusal("unknown-key", spelled `line ${i + 1} carries the key \`${key}\`, which is outside the closed ticket key ` +
                spelled `set (${TICKET_KEYS.join(", ")}). A new key is recorded in ` +
                "agent-factory/contracts/board.md first; an unknown key is refused rather than ignored, " +
                "because ignoring one is how a document grows a second place to hide a value");
        }
        if (Object.prototype.hasOwnProperty.call(values, key)) {
            return ticketRefusal("duplicate-key", spelled `\`${key}\` is written twice, so the document expresses two values for one key`);
        }
        const raw = m[2];
        values[key] = raw === undefined || raw.trim() === "" ? null : raw.trim();
    }
    const value = Object.fromEntries(TICKET_KEYS.map((k) => [k, values[k] ?? null]));
    return { ok: true, value };
}
// from scripts/board-read.ts
function ticketStem(name) {
    return name.slice(0, -".md".length);
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
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
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
    const entries = progressEntries(texts.blanked, sectionEnd);
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
    /** The entry `e` as a block, or the reason it cannot move. */
    const blockOf = (e) => {
        const start = e.line - 1;
        const name = `the entry \`## ${e.heading}\` (line ${e.line})`;
        let end = sectionEnd(texts.blanked, start + 1, 2);
        // The empty string after a final line feed is the file's end, not a line of the last entry.
        if (end === raw.length && end - 1 > start && raw[end - 1] === "")
            end -= 1;
        const lines = [];
        const out = [];
        let size = 0;
        for (let i = start; i < end; i++) {
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
// </runnable-embeds>
// ── Hand-written part: the planner and the stage-A proof ───────────────────────────────────────────────────────
/** The task-folder name rule (scripts/context-io.ts), re-exported for the context-archive arm (plan 38-10). */
export { TASK_NAME_RE };
/** The ticket body heading the cut trailers go under (agent-factory/contracts/board.md § Ticket body sections). */
export const BOARD_NOTES_HEADING = "## Board notes";
/** The first line of PRE_V3_BOARD_UPDATES_REL (D-04). */
export const BOARD_UPDATES_TITLE = "# Board updates from the pre-v3 board";
/** The first line of PRE_V3_ORPHAN_NOTES_REL (D-03). */
export const ORPHAN_NOTES_TITLE = "# Board notes of rows with no ticket file";
/** The first line of PRE_V3_NFR_NOTES_REL (D-06). */
export const NFR_NOTES_TITLE = "# Lines of the pre-v3 NFR catalog that belong to no single NFR";
/**
 * The closed, named set of line kinds migrate generates (D-09). The proof removes a generated line only by its
 * declared position, and only when the line there equals its kind's template, so an original line can never be
 * hidden by calling it generated.
 *   - `board-notes-heading`: BOARD_NOTES_HEADING, opening each appended section;
 *   - `provenance`: provenanceLine, naming the pre-v3 board, the board line (or none, for a whole file) and the
 *     migration date; it follows each Board notes heading, each orphan heading and each archive-only file's title;
 *   - `updates-title`: BOARD_UPDATES_TITLE, line 1 of PRE_V3_BOARD_UPDATES_REL;
 *   - `orphan-title`: ORPHAN_NOTES_TITLE, line 1 of PRE_V3_ORPHAN_NOTES_REL;
 *   - `orphan-heading`: `## [ID]`, one per orphan row in PRE_V3_ORPHAN_NOTES_REL;
 *   - `nfr-notes-title`: NFR_NOTES_TITLE, line 1 of PRE_V3_NFR_NOTES_REL (its provenance line, line 3, names the
 *     pre-v3 NFR catalog);
 *   - `nfr-table-header-copy`: line 1 of each nfr/NFR-xxx.md, a copy of the pre-v3 table's header line;
 *   - `nfr-table-separator-copy`: line 2 of each nfr/NFR-xxx.md, a copy of the table's separator line;
 *   - `nfr-index-line`: `- [NFR-xxx](nfr/NFR-xxx.md) {category}: {target}` after the kit seed lines of the new
 *     catalog, one per NFR row;
 *   - `kit-seed-line`: a line of the kit seed at its own position, in the new catalog and in the traceability file.
 * The proof derives the NFR templates from the pre-v3 catalog and the seed templates from the kit seeds, never from
 * the plan, and binds each kind to the file and the lines it may sit on.
 */
export const MIGRATE_GENERATED_LINE_KINDS = Object.freeze([
    "board-notes-heading",
    "provenance",
    "updates-title",
    "orphan-title",
    "orphan-heading",
    "nfr-notes-title",
    "nfr-table-header-copy",
    "nfr-table-separator-copy",
    "nfr-index-line",
    "kit-seed-line",
]);
/**
 * The one provenance line: where the text below it came from, in one sentence. `boardLine` is the one-based line of
 * the pre-v3 board, or null for a file that gathers lines from many board lines. `source` names the pre-v3 file the
 * text came from: the board, or (for PRE_V3_NFR_NOTES_REL) the NFR catalog.
 */
export function provenanceLine(boardLine, date, source = "board") {
    const [label, rel] = source === "board" ? ["board", LEGACY_BOARD_REL] : ["NFR catalog", LEGACY_NFR_CATALOG_REL];
    const where = boardLine === null ? `the pre-v3 ${label}` : `line ${boardLine} of the pre-v3 ${label}`;
    return `Copied verbatim by install --migrate on ${date} from ${where} \`${rel}\`.`;
}
const LEGACY_PREFIX = `${LEGACY_STATE_ROOT_REL}/`;
const ENCODER = new TextEncoder();
/** The pre-v3 path of `rel` (a path under STATE_ROOT_REL): the inverse of movedRel, so no state path is respelled. */
function legacyRelOf(rel) {
    if (!rel.startsWith(`${STATE_ROOT_REL}/`))
        throw new Error(`state-migrate: ${rel} is not under the v3 state root`);
    return `${LEGACY_PREFIX}${rel.slice(STATE_ROOT_REL.length + 1)}`;
}
/** The pre-v3 NFR catalog and traceability file, before the whole-root rename. */
const LEGACY_NFR_CATALOG_REL = legacyRelOf(NFR_CATALOG_REL);
const LEGACY_TRACEABILITY_REL = legacyRelOf(TRACEABILITY_REL);
/** The longest piece of user text a reason quotes. */
const REASON_QUOTE_CHARS = 120;
/** `rel` (a path under the pre-v3 root) after the whole root is renamed to STATE_ROOT_REL (D-17). */
export function movedRel(rel) {
    if (!rel.startsWith(LEGACY_PREFIX))
        throw new Error(`state-migrate: ${rel} is not under the pre-v3 state root`);
    return `${STATE_ROOT_REL}/${rel.slice(LEGACY_PREFIX.length)}`;
}
/**
 * Cut one raw board line (D-01). One trailing CR is set aside, the region's ROW reaches the remainder after the
 * identifier, and splitRow finds the trailer. When the row has no parenthetical, an unbalanced one, or nothing after
 * it, there is nothing to cut and the answer is null. Otherwise `kept` is the line minus the trailer's length, byte
 * for byte, with the CR re-attached, and `trailer` is the cut text, verbatim.
 */
export function cutRow(rawLine) {
    const cr = rawLine.endsWith("\r") ? "\r" : "";
    const line = cr === "" ? rawLine : rawLine.slice(0, -1);
    const m = ROW.exec(line);
    if (m === null)
        return null;
    const { meta, trailer } = splitRow(m[2]);
    if (meta === null || trailer === "")
        return null;
    return { kept: line.slice(0, line.length - trailer.length) + cr, trailer };
}
/** Code-unit order, never the host locale's. */
function byCodeUnits(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
/** UTF-8 text of `bytes`, a leading byte-order mark kept as content; an invalid sequence decodes to U+FFFD. */
function decodeText(bytes) {
    return new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
}
/** UTF-8 text of `bytes`, a leading byte-order mark kept as content, or null when `bytes` is not valid UTF-8. */
function strictText(bytes) {
    try {
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    }
    catch {
        return null;
    }
}
/** `line` without one trailing CR. */
function withoutCr(line) {
    return line.endsWith("\r") ? line.slice(0, -1) : line;
}
/** The lines of `text`, each without its LF or CRLF terminator. */
function linesOf(text) {
    return text.split("\n").map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
}
/** A line that holds nothing but spaces and tabs. */
function isBlankLine(line) {
    return /^[ \t]*$/.test(line);
}
/** `text` safe to print: control characters removed, at most REASON_QUOTE_CHARS code units. */
function shown(text) {
    const clean = stripControlChars(text, false);
    return clean.length <= REASON_QUOTE_CHARS ? clean : `${clean.slice(0, REASON_QUOTE_CHARS)}…`;
}
/** The one-based line number of the first line appended after `original` (one terminator first when it lacks one). */
function firstAppendedLine(original) {
    if (original.length === 0)
        return 1;
    const k = original.split("\n").length;
    return original.endsWith("\n") ? k : k + 1;
}
/** `a` followed by `b`. */
function concatBytes(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
}
/** A refused plan: the refusals, and nothing to execute. */
function refusedPlan(refusals, notes) {
    return {
        refusals,
        notes,
        writes: [],
        archiveMoves: [],
        originals: [],
        generated: [],
        cuts: [],
        appended: [],
        overBudget: [],
        steps: [],
        proof: { ok: false, reasons: ["the plan was refused, so there is nothing to prove"] },
    };
}
// ── The NFR catalog (D-06) ───────────────────────────────────────────────────────────────────────────────────────
/** A table cell that is an NFR identifier, and an NFR identifier as a delimited token of a heading. */
const NFR_ID_CELL = /^NFR-[0-9]+$/;
const NFR_ID_TOKEN = /(?<![A-Za-z0-9])NFR-[0-9]+(?![A-Za-z0-9])/g;
/** A level-2 heading, never a deeper one. */
const LEVEL_2_HEADING = /^## /;
/** The lines of `text` without terminators, and without the empty element after a final LF. */
function textLines(text) {
    if (text.length === 0)
        return [];
    const lines = text.split("\n").map(withoutCr);
    if (text.endsWith("\n"))
        lines.pop();
    return lines;
}
/**
 * The trimmed cells of a table line: the text between the pipes that are not preceded by a backslash, the empty
 * text before the first pipe dropped, and the text after a closing pipe dropped. An escaped pipe stays in its cell.
 */
function tableCells(line) {
    const parts = line.split(/(?<!\\)\|/);
    parts.shift();
    if (/(?<!\\)\|[ \t]*$/.test(line) && parts.length > 0)
        parts.pop();
    return parts.map((c) => c.trim());
}
/** A table separator line: every cell is dashes, with an optional colon at either end. */
function isSeparatorLine(line) {
    if (!line.startsWith("|"))
        return false;
    const cells = tableCells(line);
    return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
}
/**
 * Read the pre-v3 NFR catalog (D-06). The rule looks only at the comment-blanked text, so an example row inside an
 * HTML comment is never a row. The header is the first line that starts with `|`, whose first cell is `ID`, and that
 * is followed by a separator line. The rows are the lines after the separator that start with `|`, up to the first
 * line that does not, whose first cell is an NFR identifier; a row line that touches an HTML comment is left in the
 * notes file, and the plan says so. A section is a `##` heading outside every fence and comment, to the line before
 * the next heading of level 1 or 2 (the embedded sectionEndIndex); it goes to an NFR file only when its heading
 * names exactly one NFR identifier and that identifier has a row.
 */
function readNfrCatalog(text) {
    const lines = textLines(text);
    const normalized = normalizeDocument(text);
    const normalizedLines = normalized.split("\n");
    const blanked = stripHtmlComments(normalized).split("\n");
    const notes = [];
    let header = null;
    for (let i = 0; i + 1 < lines.length; i++) {
        const b = blanked[i];
        if (b.startsWith("|") && tableCells(b)[0] === "ID" && isSeparatorLine(blanked[i + 1])) {
            header = i;
            break;
        }
    }
    const rows = [];
    if (header !== null) {
        for (let i = header + 2; i < lines.length && blanked[i].startsWith("|"); i++) {
            const id = tableCells(blanked[i])[0] ?? "";
            if (!NFR_ID_CELL.test(id))
                continue;
            if (blanked[i] !== normalizedLines[i]) {
                notes.push(`line ${i + 1} of ${LEGACY_NFR_CATALOG_REL} (${shown(id)}) touches an HTML comment, so it is no NFR row and goes ` +
                    `to ${PRE_V3_NFR_NOTES_REL}`);
                continue;
            }
            const cells = tableCells(normalizedLines[i]);
            rows.push({ index: i, id, category: cells[1] ?? "", target: cells[2] ?? "" });
        }
    }
    const rowIds = new Set(rows.map((r) => r.id));
    const flags = blockContextFlags(normalized);
    const sections = [];
    for (let i = 0; i < lines.length; i++) {
        const line = normalizedLines[i];
        if (flags[i] === true || blanked[i] !== line || !LEVEL_2_HEADING.test(line))
            continue;
        const ids = new Set(line.match(NFR_ID_TOKEN) ?? []);
        const id = ids.size === 1 ? [...ids][0] : null;
        if (id === null || !rowIds.has(id))
            continue;
        sections.push({ id, start: i, end: Math.min(sectionEndIndex(normalized, i + 1, 2), lines.length) });
    }
    return { lines, header, rows, sections, notes };
}
/** The index line of one NFR row (D-06): the cell text copied, never reworded. */
function nfrIndexLine(row) {
    return `- [${row.id}](${nfrLinkTarget(row.id)}) ${row.category}: ${row.target}`;
}
/** The planned path of the NFR file of `id`. */
function nfrFileRel(id) {
    return `${STATE_ROOT_REL}/${nfrLinkTarget(id)}`;
}
/**
 * Plan the NFR split (D-06). Each row gets nfr/NFR-xxx.md: a copy of the header line, a copy of the separator line,
 * the row, then each of its sections, in catalog order, each after one blank line and without its trailing blank
 * lines. A line goes to one place only: the header and separator lines and every line no row or section takes go,
 * verbatim and in catalog order, to PRE_V3_NFR_NOTES_REL after its title and provenance line. The new catalog is the
 * kit seed's bytes and one index line per row in table order. The outputs use the catalog's own line ending; the
 * index lines use the seed's.
 */
function planNfrSplit(catalog, inputs) {
    const text = decodeText(catalog.bytes);
    const read = readNfrCatalog(text);
    const eol = lineEndings(text) === "crlf" ? "\r\n" : "\n";
    const lines = read.lines;
    // `taken`: the line is in an NFR file. The header and separator lines are never taken: they go to the notes file.
    const taken = new Array(lines.length).fill(false);
    const tableHead = new Set(read.header === null ? [] : [read.header, read.header + 1]);
    const generated = [];
    const files = new Map();
    for (const r of read.rows) {
        taken[r.index] = true;
        const rel = nfrFileRel(r.id);
        files.set(rel, [lines[read.header], lines[read.header + 1], lines[r.index]]);
        generated.push({ rel, line: 1, kind: "nfr-table-header-copy", boardLine: null, id: r.id });
        generated.push({ rel, line: 2, kind: "nfr-table-separator-copy", boardLine: null, id: r.id });
    }
    for (const sec of read.sections) {
        let end = sec.end;
        while (end > sec.start && isBlankLine(lines[end - 1]))
            end--;
        const body = [];
        for (let k = sec.start; k < end; k++) {
            if (taken[k] || tableHead.has(k))
                continue;
            taken[k] = true;
            body.push(lines[k]);
        }
        if (body.length > 0)
            files.get(nfrFileRel(sec.id)).push("", ...body);
    }
    const notesLines = [NFR_NOTES_TITLE, "", provenanceLine(null, inputs.date, "nfr-catalog"), ""];
    generated.push({ rel: PRE_V3_NFR_NOTES_REL, line: 1, kind: "nfr-notes-title", boardLine: null, id: null });
    generated.push({ rel: PRE_V3_NFR_NOTES_REL, line: 3, kind: "provenance", boardLine: null, id: null });
    lines.forEach((l, k) => {
        if (!taken[k])
            notesLines.push(l);
    });
    const seedText = decodeText(inputs.seedNfrCatalog);
    const seedEol = lineEndings(seedText) === "crlf" ? "\r\n" : "\n";
    const seedCount = textLines(seedText).length;
    for (let n = 1; n <= seedCount; n++)
        generated.push({ rel: NFR_CATALOG_REL, line: n, kind: "kit-seed-line", boardLine: null, id: null });
    const index = read.rows.map(nfrIndexLine);
    index.forEach((_, k) => {
        generated.push({ rel: NFR_CATALOG_REL, line: seedCount + 1 + k, kind: "nfr-index-line", boardLine: null, id: read.rows[k].id });
    });
    const lead = seedText.length === 0 || seedText.endsWith("\n") ? "" : seedEol;
    const catalogBytes = concatBytes(inputs.seedNfrCatalog, ENCODER.encode(lead + index.map((l) => l + seedEol).join("")));
    const nfrWrites = [...files.entries()]
        .sort((a, b) => byCodeUnits(a[0], b[0]))
        .map(([rel, body]) => ({
        rel,
        bytes: ENCODER.encode(body.join(eol) + eol),
        source: `the header, the separator and the row of ${shown(rel.slice(rel.lastIndexOf("/") + 1, -".md".length))} from the pre-v3 NFR catalog, and its own sections, verbatim`,
    }));
    return {
        refusals: [],
        notes: read.notes,
        writes: [
            {
                rel: NFR_CATALOG_REL,
                bytes: catalogBytes,
                source: `the kit seed's NFR catalog followed by ${index.length} index line(s), one per NFR row of the pre-v3 catalog`,
            },
            ...nfrWrites,
            {
                rel: PRE_V3_NFR_NOTES_REL,
                bytes: ENCODER.encode(notesLines.join(eol) + eol),
                source: "every line of the pre-v3 NFR catalog that is in no NFR file, verbatim and in order",
            },
        ],
        generated,
    };
}
/** One kit-seed-line per line of `seed` in the file `rel`. */
function seedLines(rel, seed) {
    return textLines(decodeText(seed)).map((_, k) => ({ rel, line: k + 1, kind: "kit-seed-line", boardLine: null, id: null }));
}
/**
 * Plan the board split (D-01 to D-04, D-17, D-21 option-a). Pure: every byte comes from `inputs`.
 *
 * Each ticket row parseBoard admits is cut by cutRow over its RAW line, and the kept row stays on the board. When
 * the row's ticket file exists, its trailer is appended to that ticket as a new `## Board notes` section after the
 * provenance line; two rows of one ticket give two sections, in board order (D-02). When it does not, the trailer
 * goes to PRE_V3_ORPHAN_NOTES_REL under one `## [ID]` heading per row, and no ticket is created (D-03). Every line
 * that begins `_Updated:` outside HTML comments goes, verbatim and in order, to PRE_V3_BOARD_UPDATES_REL, and the
 * board keeps none (D-04). A row whose line touches an HTML comment is not cut (moving a comment's opener off the
 * board would uncomment the lines after it), and the plan says so in `notes`. Ticket identity is the admitted `id`,
 * else the file stem, over the `.md` files directly under the tickets directory whose name does not begin with `.`.
 *
 * Refusals are collected, never thrown, and a refused plan has no writes: a board, or a ticket that would receive
 * an append, that is not valid UTF-8 or mixes LF and CRLF; two ticket files with one identity. overBudget lists every
 * budget the planned board and the planned tickets still break (D-01, D-07); it never stops the plan.
 */
export function planStateMigrate(inputs) {
    const refusals = [];
    const notes = [];
    const legacy = [...inputs.legacy].sort((a, b) => byCodeUnits(a.rel, b.rel));
    for (const f of legacy) {
        if (!f.rel.startsWith(LEGACY_PREFIX)) {
            refusals.push(`${shown(f.rel)} is not under the pre-v3 state root ${LEGACY_PREFIX}, so the migrate was not planned`);
        }
    }
    const boardFile = legacy.find((f) => f.rel === LEGACY_BOARD_REL);
    if (boardFile === undefined) {
        refusals.push(`the pre-v3 board ${LEGACY_BOARD_REL} is not among the files read, so there is no board to split`);
    }
    if (refusals.length > 0 || boardFile === undefined)
        return refusedPlan(refusals, notes);
    const boardText = strictText(boardFile.bytes);
    if (boardText === null) {
        return refusedPlan([`${LEGACY_BOARD_REL} is not valid UTF-8, so it was not split; save it as UTF-8 first`], notes);
    }
    if (lineEndings(boardText) === "mixed") {
        return refusedPlan([`${LEGACY_BOARD_REL} mixes LF and CRLF line endings, so it was not split; give it one line ending first`], notes);
    }
    const boardEol = lineEndings(boardText) === "crlf" ? "\r\n" : "\n";
    const rawLines = boardText.split("\n");
    const normalized = normalizeDocument(boardText);
    const normalizedLines = normalized.split("\n");
    const blankedLines = stripHtmlComments(normalized).split("\n");
    const model = parseBoard(boardText);
    const rows = model.columns.flatMap((c) => c.rows).sort((a, b) => a.line - b.line);
    // The tickets, by identity; two files with one identity are refused, every file named.
    const byId = new Map();
    for (const f of legacy) {
        const moved = movedRel(f.rel);
        if (!moved.startsWith(`${TICKETS_REL}/`))
            continue;
        const name = moved.slice(TICKETS_REL.length + 1);
        if (name.includes("/") || name.startsWith(".") || !name.endsWith(".md"))
            continue;
        const strict = strictText(f.bytes);
        const text = strict ?? decodeText(f.bytes);
        const admitted = parseTicketDocument(text);
        const declared = admitted.ok ? admitted.value.id : null;
        const id = declared !== null && declared !== "" ? declared : ticketStem(name);
        byId.set(id, [...(byId.get(id) ?? []), { rel: f.rel, name, id, bytes: f.bytes, text, utf8: strict !== null }]);
    }
    const tickets = new Map();
    for (const [id, files] of byId) {
        if (files.length > 1) {
            refusals.push(`the ticket identity ${shown(id)} is declared by ${files.length} files (${files.map((t) => shown(t.rel)).join(", ")}), ` +
                "so which one receives its Board notes is a guess; give each ticket one file");
        }
        tickets.set(id, files[0]);
    }
    // The update lines (D-04): the lines of the comment-blanked text that begin `_Updated:`, as the budget rule finds them.
    const updateAt = new Set();
    blankedLines.forEach((l, i) => {
        if (l.startsWith(UPDATED_PREFIX))
            updateAt.add(i);
    });
    // The cuts, in board order.
    const boardOut = [...rawLines];
    const sections = new Map();
    const orphans = [];
    for (const row of rows) {
        const i = row.line - 1;
        const raw = rawLines[i];
        if (blankedLines[i] !== normalizedLines[i]) {
            notes.push(`line ${row.line} of ${LEGACY_BOARD_REL} (${shown(row.id)}) touches an HTML comment, so its trailer was not cut`);
            continue;
        }
        const bom = i === 0 && raw.startsWith("﻿") ? "﻿" : "";
        const cut = cutRow(raw.slice(bom.length));
        if (cut === null)
            continue;
        boardOut[i] = bom + cut.kept;
        if (tickets.has(row.id)) {
            sections.set(row.id, [...(sections.get(row.id) ?? []), { boardLine: row.line, trailer: cut.trailer }]);
        }
        else {
            orphans.push({ id: row.id, boardLine: row.line, trailer: cut.trailer });
            notes.push(`the row of ${shown(row.id)} at line ${row.line} of ${LEGACY_BOARD_REL} has no ticket file, so its trailer goes ` +
                `to ${PRE_V3_ORPHAN_NOTES_REL} and no ticket is created`);
        }
    }
    // Every ticket that receives an append must be UTF-8 with one line ending.
    for (const id of sections.keys()) {
        const t = tickets.get(id);
        if (!t.utf8) {
            refusals.push(`${shown(t.rel)} is not valid UTF-8, so its Board notes could not be appended; save it as UTF-8 first`);
        }
        else if (lineEndings(t.text) === "mixed") {
            refusals.push(`${shown(t.rel)} mixes LF and CRLF line endings, so its Board notes could not be appended; give it one line ending first`);
        }
    }
    if (refusals.length > 0)
        return refusedPlan(refusals, notes);
    // The planned board: the kept rows, without the update lines. keptAt maps an original line index to its new line.
    const keptAt = new Map();
    const boardLines = [];
    boardOut.forEach((l, i) => {
        if (updateAt.has(i))
            return;
        boardLines.push(l);
        keptAt.set(i, boardLines.length);
    });
    const plannedBoard = boardLines.join("\n");
    const generated = [];
    const cuts = [];
    const ticketWrites = [];
    const appended = [];
    const ticketMoves = [];
    const appendSteps = [];
    const archivedAt = new Map();
    for (const [id, list] of sections) {
        const t = tickets.get(id);
        const rel = movedRel(t.rel);
        const eol = lineEndings(t.text) === "crlf" ? "\r\n" : "\n";
        const parts = [t.text.length > 0 && !t.text.endsWith("\n") ? eol : ""];
        let next = firstAppendedLine(t.text);
        for (const s of list) {
            parts.push(eol, BOARD_NOTES_HEADING, eol, eol, provenanceLine(s.boardLine, inputs.date), eol, eol, s.trailer, eol);
            generated.push({ rel, line: next + 1, kind: "board-notes-heading", boardLine: s.boardLine, id });
            generated.push({ rel, line: next + 3, kind: "provenance", boardLine: s.boardLine, id });
            cuts.push({ id, boardLine: s.boardLine, keptLine: keptAt.get(s.boardLine - 1), noteRel: rel, noteLine: next + 5 });
            next += 6;
        }
        const added = ENCODER.encode(parts.join(""));
        ticketWrites.push({
            rel,
            bytes: concatBytes(t.bytes, added),
            source: `the ticket ${shown(id)} followed by ${list.length} Board notes section(s) from the pre-v3 board`,
        });
        appended.push({ rel, original: t.rel });
        const archived = `${PRE_V3_TICKETS_REL}/${t.name}`;
        ticketMoves.push({ from: rel, to: archived });
        archivedAt.set(t.rel, archived);
        appendSteps.push({
            verb: "append",
            from: null,
            to: rel,
            bytes: added.length,
            note: `${list.length} Board notes section(s) appended to the ticket ${shown(id)}`,
        });
    }
    // The two archive-only outputs (D-03, D-04), each planned only when it has something to hold.
    const extraWrites = [];
    if (updateAt.size > 0) {
        const lines = [BOARD_UPDATES_TITLE, "", provenanceLine(null, inputs.date), ""];
        generated.push({ rel: PRE_V3_BOARD_UPDATES_REL, line: 1, kind: "updates-title", boardLine: null, id: null });
        generated.push({ rel: PRE_V3_BOARD_UPDATES_REL, line: 3, kind: "provenance", boardLine: null, id: null });
        for (const i of [...updateAt].sort((a, b) => a - b))
            lines.push(withoutCr(rawLines[i]));
        extraWrites.push({
            rel: PRE_V3_BOARD_UPDATES_REL,
            bytes: ENCODER.encode(lines.join(boardEol) + boardEol),
            source: `the ${updateAt.size} \`_Updated:\` line(s) of the pre-v3 board, verbatim and in order`,
        });
    }
    if (orphans.length > 0) {
        const lines = [ORPHAN_NOTES_TITLE, "", provenanceLine(null, inputs.date), ""];
        generated.push({ rel: PRE_V3_ORPHAN_NOTES_REL, line: 1, kind: "orphan-title", boardLine: null, id: null });
        generated.push({ rel: PRE_V3_ORPHAN_NOTES_REL, line: 3, kind: "provenance", boardLine: null, id: null });
        orphans.forEach((o, k) => {
            if (k > 0)
                lines.push("");
            lines.push(`## [${o.id}]`);
            generated.push({ rel: PRE_V3_ORPHAN_NOTES_REL, line: lines.length, kind: "orphan-heading", boardLine: null, id: o.id });
            lines.push("", provenanceLine(o.boardLine, inputs.date));
            generated.push({ rel: PRE_V3_ORPHAN_NOTES_REL, line: lines.length, kind: "provenance", boardLine: o.boardLine, id: o.id });
            lines.push("", o.trailer);
            cuts.push({
                id: o.id,
                boardLine: o.boardLine,
                keptLine: keptAt.get(o.boardLine - 1),
                noteRel: PRE_V3_ORPHAN_NOTES_REL,
                noteLine: lines.length,
            });
        });
        extraWrites.push({
            rel: PRE_V3_ORPHAN_NOTES_REL,
            bytes: ENCODER.encode(lines.join(boardEol) + boardEol),
            source: `the trailers of ${orphans.length} board row(s) whose ticket file is absent, verbatim`,
        });
    }
    // The NFR catalog (D-06) and the traceability file (D-05), each planned only when the pre-v3 tree holds it.
    const catalogFile = legacy.find((f) => f.rel === LEGACY_NFR_CATALOG_REL);
    const traceFile = legacy.find((f) => f.rel === LEGACY_TRACEABILITY_REL);
    const nfr = catalogFile === undefined ? null : planNfrSplit(catalogFile, inputs);
    if (nfr !== null) {
        notes.push(...nfr.notes);
        if (nfr.refusals.length > 0)
            return refusedPlan(nfr.refusals, notes);
        generated.push(...nfr.generated);
    }
    const lateWrites = [...(nfr?.writes ?? [])];
    const lateMoves = [];
    if (nfr !== null) {
        lateMoves.push({ from: NFR_CATALOG_REL, to: PRE_V3_NFR_CATALOG_REL });
        archivedAt.set(LEGACY_NFR_CATALOG_REL, PRE_V3_NFR_CATALOG_REL);
    }
    if (traceFile !== undefined) {
        lateMoves.push({ from: TRACEABILITY_REL, to: PRE_V3_TRACEABILITY_REL });
        archivedAt.set(LEGACY_TRACEABILITY_REL, PRE_V3_TRACEABILITY_REL);
        lateWrites.push({
            rel: TRACEABILITY_REL,
            bytes: inputs.seedTraceability,
            source: "the kit seed's traceability index; the pre-v3 traceability file is archived unsplit",
        });
        generated.push(...seedLines(TRACEABILITY_REL, inputs.seedTraceability));
    }
    cuts.sort((a, b) => a.boardLine - b.boardLine);
    ticketWrites.sort((a, b) => byCodeUnits(a.rel, b.rel));
    appended.sort((a, b) => byCodeUnits(a.rel, b.rel));
    ticketMoves.sort((a, b) => byCodeUnits(a.from, b.from));
    appendSteps.sort((a, b) => byCodeUnits(a.to, b.to));
    generated.sort((a, b) => byCodeUnits(a.rel, b.rel) || a.line - b.line);
    const boardBytes = ENCODER.encode(plannedBoard);
    const writes = [
        { rel: BOARD_REL, bytes: boardBytes, source: "the pre-v3 board without its trailers and its `_Updated:` lines" },
        ...ticketWrites,
        ...extraWrites,
        ...lateWrites,
    ];
    const archiveMoves = [{ from: BOARD_REL, to: PRE_V3_BOARD_REL }, ...ticketMoves, ...lateMoves];
    archivedAt.set(LEGACY_BOARD_REL, PRE_V3_BOARD_REL);
    const originals = legacy.map((f) => ({
        original: f.rel,
        at: archivedAt.get(f.rel) ?? movedRel(f.rel),
        match: "identical",
    }));
    const sizeOf = new Map(legacy.map((f) => [movedRel(f.rel), f.bytes.length]));
    const steps = [
        ...legacy.map((f) => ({
            verb: "move",
            from: f.rel,
            to: movedRel(f.rel),
            bytes: f.bytes.length,
            note: "renamed with the pre-v3 root, unchanged",
        })),
        ...archiveMoves.map((m) => ({
            verb: "archive",
            from: m.from,
            to: m.to,
            bytes: sizeOf.get(m.from) ?? 0,
            note: "the original, renamed unchanged into the pre-v3 archive",
        })),
        {
            verb: "write",
            from: null,
            to: BOARD_REL,
            bytes: boardBytes.length,
            note: `${cuts.length} trailer(s) cut and ${updateAt.size} \`_Updated:\` line(s) moved`,
        },
        ...appendSteps,
        ...[...extraWrites, ...lateWrites].map((w) => ({ verb: "write", from: null, to: w.rel, bytes: w.bytes.length, note: w.source })),
    ];
    const provable = { originals, generated, cuts, appended };
    const written = new Map(writes.map((w) => [w.rel, w.bytes]));
    return {
        refusals,
        notes,
        writes,
        archiveMoves,
        originals,
        generated,
        cuts,
        appended,
        overBudget: plannedBudgetFindings(plannedBoard, legacy, ticketWrites),
        steps,
        proof: proveStateMigrate(inputs, provable, written),
    };
}
/**
 * Every budget the planned state still breaks (D-01, D-07), through the embedded rules: the planned board's bytes,
 * each ticket row over BUDGETS.boardRowChars (named by its ID), its `_Updated:` lines, and each ticket record directly
 * under the tickets directory over BUDGETS.ticketBytes, appended or moved unchanged. Sorted with sortFindings.
 */
function plannedBudgetFindings(plannedBoard, legacy, ticketWrites) {
    const normalizedBoard = normalizeDocument(plannedBoard);
    const model = parseBoard(plannedBoard);
    const idAt = new Map(model.columns.flatMap((c) => c.rows).map((r) => [r.line, r.id]));
    const findings = boardBudgetFindings(BOARD_REL, { raw: plannedBoard, normalized: normalizedBoard, blanked: stripHtmlComments(normalizedBoard) }, model, BUDGETS).map((f) => {
        const id = f.key === "boardRowChars" && f.line !== undefined ? idAt.get(f.line) : undefined;
        return id === undefined ? f : { ...f, note: `the row of ${shown(id)}, after its trailer was cut` };
    });
    const planned = new Map(ticketWrites.map((w) => [w.rel, w.bytes.length]));
    const sizes = new Map();
    for (const f of legacy) {
        const moved = movedRel(f.rel);
        if (!moved.startsWith(`${TICKETS_REL}/`) || moved.slice(TICKETS_REL.length + 1).includes("/"))
            continue;
        sizes.set(moved.slice(TICKETS_REL.length + 1), planned.get(moved) ?? f.bytes.length);
    }
    for (const name of budgetEntryNames([...sizes.keys()])) {
        const finding = fileBytesFinding(`${TICKETS_REL}/${name}`, sizes.get(name), "ticketBytes", BUDGETS);
        if (finding !== null)
            findings.push(finding);
    }
    return sortFindings(findings);
}
/** A written path under the NFR directory. */
function isNfrFile(rel) {
    return rel.startsWith(`${NFR_DIR_REL}/`);
}
/**
 * The template a generated line of `g`'s kind must equal, or null when the kind is outside the closed set or the
 * line is not one that kind may sit on. Each NFR and seed kind is bound to its file and its lines.
 */
function generatedTemplate(g, src) {
    const catalog = src.catalog;
    const header = catalog?.header ?? null;
    switch (g.kind) {
        case "board-notes-heading":
            return BOARD_NOTES_HEADING;
        case "provenance":
            if (g.rel !== PRE_V3_NFR_NOTES_REL)
                return provenanceLine(g.boardLine, src.date);
            return g.line === 3 && g.boardLine === null ? provenanceLine(null, src.date, "nfr-catalog") : null;
        case "updates-title":
            return BOARD_UPDATES_TITLE;
        case "orphan-title":
            return ORPHAN_NOTES_TITLE;
        case "orphan-heading":
            return g.id === null ? null : `## [${g.id}]`;
        case "nfr-notes-title":
            return g.rel === PRE_V3_NFR_NOTES_REL && g.line === 1 ? NFR_NOTES_TITLE : null;
        case "nfr-table-header-copy":
            return isNfrFile(g.rel) && g.line === 1 && catalog !== null && header !== null ? catalog.lines[header] : null;
        case "nfr-table-separator-copy":
            return isNfrFile(g.rel) && g.line === 2 && catalog !== null && header !== null ? catalog.lines[header + 1] : null;
        case "nfr-index-line": {
            if (g.rel !== NFR_CATALOG_REL || g.line <= src.seedCatalog.length || g.id === null || catalog === null)
                return null;
            const row = catalog.rows.find((r) => r.id === g.id);
            return row === undefined ? null : nfrIndexLine(row);
        }
        case "kit-seed-line":
            if (g.rel === NFR_CATALOG_REL)
                return src.seedCatalog[g.line - 1] ?? null;
            if (g.rel === TRACEABILITY_REL)
                return src.seedTrace[g.line - 1] ?? null;
            return null;
        default:
            return null;
    }
}
/**
 * The D-09 stage-A proof. The originals are the non-blank lines of the pre-v3 board and, when the inputs hold one,
 * of the pre-v3 NFR catalog (a line is its text without the LF or CRLF terminator); each is compared with its own
 * outputs, never with the other's. The board's outputs are the written board, the updates file, the orphan notes
 * file and the appended part of every appended ticket; the catalog's are every NFR file, the NFR notes file and the
 * new catalog. The traceability file answers to no original: every line of it must be a declared kit seed line.
 * The generated lines are removed BY POSITION (each must equal its kind's template, derived from the inputs) and each
 * cut is rejoined (the kept row plus its trailer must equal its original line). The multisets must then be equal.
 * Line 3 of each NFR file must be its own row, each appended ticket must begin with its original bytes, and every
 * original home that `written` holds must match its rule. `written` is a parameter, so the proof runs over the
 * plan's own writes or over bytes re-read from disk.
 */
export function proveStateMigrate(inputs, plan, written) {
    const reasons = [];
    const boardFile = inputs.legacy.find((f) => f.rel === LEGACY_BOARD_REL);
    if (boardFile === undefined)
        return { ok: false, reasons: [`the pre-v3 board ${LEGACY_BOARD_REL} is not among the inputs`] };
    const originalLines = linesOf(decodeText(boardFile.bytes));
    const catalogFile = inputs.legacy.find((f) => f.rel === LEGACY_NFR_CATALOG_REL);
    const catalog = catalogFile === undefined ? null : readNfrCatalog(decodeText(catalogFile.bytes));
    const src = {
        date: inputs.date,
        catalog,
        seedCatalog: textLines(decodeText(inputs.seedNfrCatalog)),
        seedTrace: textLines(decodeText(inputs.seedTraceability)),
    };
    const parts = new Map();
    const board = written.get(BOARD_REL);
    if (board === undefined)
        reasons.push(`${BOARD_REL} is not among the written files, so the board split cannot be proven`);
    else
        parts.set(BOARD_REL, { rel: BOARD_REL, lines: linesOf(decodeText(board)), first: 1, group: "board" });
    for (const rel of [PRE_V3_BOARD_UPDATES_REL, PRE_V3_ORPHAN_NOTES_REL]) {
        const bytes = written.get(rel);
        if (bytes !== undefined)
            parts.set(rel, { rel, lines: linesOf(decodeText(bytes)), first: 1, group: "board" });
    }
    for (const [rel, bytes] of written) {
        const group = isNfrFile(rel) || rel === PRE_V3_NFR_NOTES_REL || rel === NFR_CATALOG_REL ? "nfr" : rel === TRACEABILITY_REL ? "seed" : null;
        if (group !== null)
            parts.set(rel, { rel, lines: textLines(decodeText(bytes)), first: 1, group });
    }
    for (const a of plan.appended) {
        const bytes = written.get(a.rel);
        const original = inputs.legacy.find((f) => f.rel === a.original);
        if (bytes === undefined || original === undefined) {
            reasons.push(`${shown(a.rel)} is declared appended to ${shown(a.original)}, and one of the two is missing`);
            continue;
        }
        const at = prefixMismatch(original.bytes, bytes);
        if (at !== null) {
            reasons.push(`${shown(a.rel)} does not begin with the bytes of its original ${shown(a.original)} (they differ at byte ${at})`);
            continue;
        }
        parts.set(a.rel, {
            rel: a.rel,
            lines: linesOf(decodeText(bytes)),
            first: firstAppendedLine(decodeText(original.bytes)),
            group: "board",
        });
    }
    const consumed = new Set();
    const key = (rel, line) => `${rel}\u0000${line}`;
    const lineAt = (rel, line) => {
        const part = parts.get(rel);
        if (part === undefined || !Number.isInteger(line) || line < part.first || line > part.lines.length)
            return null;
        return part.lines[line - 1];
    };
    for (const g of plan.generated) {
        const text = lineAt(g.rel, g.line);
        if (text === null) {
            reasons.push(`line ${g.line} of ${shown(g.rel)} is declared generated (${shown(g.kind)}) and is not a line migrate wrote`);
            continue;
        }
        const template = generatedTemplate(g, src);
        if (template === null || text !== template) {
            reasons.push(`line ${g.line} of ${shown(g.rel)} is declared generated (${shown(g.kind)}) and reads "${shown(text)}", not its template`);
            continue;
        }
        if (consumed.has(key(g.rel, g.line))) {
            reasons.push(`line ${g.line} of ${shown(g.rel)} is declared generated twice`);
            continue;
        }
        consumed.add(key(g.rel, g.line));
    }
    const joined = [];
    for (const c of plan.cuts) {
        const kept = lineAt(BOARD_REL, c.keptLine);
        const trailer = lineAt(c.noteRel, c.noteLine);
        const original = originalLines[c.boardLine - 1];
        const where = `the kept row at line ${c.keptLine} of ${BOARD_REL} and its trailer at line ${c.noteLine} of ` +
            `${shown(c.noteRel)} (${shown(c.id)})`;
        if (kept === null || trailer === null || consumed.has(key(BOARD_REL, c.keptLine)) || consumed.has(key(c.noteRel, c.noteLine))) {
            reasons.push(`${where} are not two lines migrate wrote`);
            continue;
        }
        if (original === undefined || kept + trailer !== original) {
            reasons.push(`${where} do not rejoin line ${c.boardLine} of the pre-v3 board ${LEGACY_BOARD_REL}`);
            continue;
        }
        consumed.add(key(BOARD_REL, c.keptLine));
        consumed.add(key(c.noteRel, c.noteLine));
        joined.push({ text: kept + trailer, rel: BOARD_REL, line: c.keptLine });
    }
    // Each NFR file holds its own row at line 3, so a row cannot sit in another NFR's file.
    for (const part of parts.values()) {
        if (!isNfrFile(part.rel))
            continue;
        const id = part.rel.slice(part.rel.lastIndexOf("/") + 1).replace(/\.md$/, "");
        const row = catalog?.rows.find((r) => r.id === id);
        if (row === undefined || part.lines[2] !== catalog?.lines[row.index]) {
            reasons.push(`line 3 of ${shown(part.rel)} is not the row of ${shown(id)} in the pre-v3 NFR catalog ${LEGACY_NFR_CATALOG_REL}`);
        }
    }
    const tally = new Map();
    const entry = (group, text) => {
        const k = `${group}\u0000${text}`;
        let e = tally.get(k);
        if (e === undefined) {
            e = { orig: [], out: [], group, text };
            tally.set(k, e);
        }
        return e;
    };
    originalLines.forEach((l, i) => {
        if (!isBlankLine(l))
            entry("board", l).orig.push(i + 1);
    });
    catalog?.lines.forEach((l, i) => {
        if (!isBlankLine(l))
            entry("nfr", l).orig.push(i + 1);
    });
    for (const part of parts.values()) {
        for (let n = part.first; n <= part.lines.length; n++) {
            const l = part.lines[n - 1];
            if (consumed.has(key(part.rel, n)) || isBlankLine(l))
                continue;
            entry(part.group, l).out.push({ rel: part.rel, line: n });
        }
    }
    for (const j of joined)
        entry("board", j.text).out.push({ rel: j.rel, line: j.line });
    const originalName = {
        board: `the pre-v3 board ${LEGACY_BOARD_REL}`,
        nfr: `the pre-v3 NFR catalog ${LEGACY_NFR_CATALOG_REL}`,
        seed: "a kit seed at its declared position",
    };
    for (const e of tally.values()) {
        for (const n of e.orig.slice(e.out.length)) {
            reasons.push(`line ${n} of ${originalName[e.group]} is in no split output: "${shown(e.text)}"`);
        }
        for (const o of e.out.slice(e.orig.length)) {
            reasons.push(`line ${o.line} of ${shown(o.rel)} is not a line of ${originalName[e.group]}: "${shown(e.text)}"`);
        }
    }
    // Every original home the written files hold.
    for (const h of plan.originals) {
        const bytes = written.get(h.at);
        if (bytes === undefined)
            continue;
        const original = inputs.legacy.find((f) => f.rel === h.original);
        if (original === undefined) {
            reasons.push(`${shown(h.original)} is declared an original and is not among the inputs`);
            continue;
        }
        const at = prefixMismatch(original.bytes, bytes);
        if (at !== null || (h.match === "identical" && bytes.length !== original.bytes.length)) {
            reasons.push(`${shown(h.at)} is not ${h.match === "identical" ? "identical to" : "prefixed by"} its original ${shown(h.original)}`);
        }
    }
    return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
/** The first byte offset where `bytes` stops beginning with `prefix`, or null when it begins with all of it. */
function prefixMismatch(prefix, bytes) {
    for (let i = 0; i < prefix.length; i++)
        if (bytes[i] !== prefix[i])
            return i;
    return null;
}

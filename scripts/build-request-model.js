// build-request-model.ts — the one authority for a build-request file (phase 45, plan 45-01, BR-01, BR-04, 44 D-04,
// 44 D-07, 45 D-05, D-12).
//
// WHAT IT IS. The pure part of reading a build request: the grammar of one `memory-bank/plans/build-requests/BR-<n>.md`
// file and the lines `upstream.js requests` prints from a set of them. A build request is how a role asks the owner of
// an upstream source for something only upstream can decide. BA/PM is its single writer (D-06); no program writes one.
// This plan fixes the frontmatter: exactly the five keys `id`, `status`, `source`, `pin` and `raised`, each once and
// non-empty (D-05). Plan 45-03 adds the six body sections, the closed History line forms and the closed lifecycle
// (BR-01, BR-03, BR-05, D-05..D-08) without changing a refusal code of plan 45-01. Plan 45-07 adds the other report
// line kinds without renaming one named here.
//
// THE BODY (plan 45-03). After the frontmatter come the six level-two sections `## Question`, `## Upstream IDs`,
// `## Options`, `## Blocks`, `## History` and `## Answer`, each exactly once and in that order, with at most one
// level-one title line before them. Every heading is found through scripts/frontmatter.ts (unfencedHeadingIndices and
// sectionEndIndex, the one section owner, LANG-07), so a heading inside a fenced block is not a heading. The History
// line forms are the ones a human chose at the plan 45-03 checkpoint (option-a, 2026-11-26):
//   - YYYY-MM-DD: open, by BA/PM
//   - YYYY-MM-DD: edited, by BA/PM: <what changed>
//   - YYYY-MM-DD: carried, by human:<name>
//   - YYYY-MM-DD: answered, by human:<name>, pin <commit>[, not-descendant]
//   - YYYY-MM-DD: withdrawn, by BA/PM: <reason>          (from open)
//   - YYYY-MM-DD: withdrawn, by human:<name>: <reason>   (from carried)
// `human:<name>` is the note schema's stamp (scripts/context-io.ts HUMAN_STAMP_RE), so a role name never satisfies it.
// It is a prose-tier record of who a human was, written by BA/PM on that human's word; it is not authentication.
//
// WHO USES IT. The host runnable scripts/runnable-ref/upstream.ts embeds it through scripts/generate-runnable-embeds.ts,
// so the installed tools/grugops/upstream.js decides with this code. The structure validator and state-check import or
// embed it in plan 45-04, so every reader applies one grammar.
//
// NO I/O. This module reads no file, runs no process, reads no clock and writes nothing. The runnable lists the folder,
// reads each file and passes the text in. Its imports are named imports of declarations an earlier authority of the
// runnable's EMBED_SPECS row embeds (normalizeDocument, isTicketId, isCalendarDate, isTicketRef, HUMAN_STAMP_RE,
// unfencedHeadingIndices, sectionEndIndex, UPSTREAM_ID_RE, UPSTREAM_SOURCE_ID_RE, UPSTREAM_OBJECT_ID_RE), so the
// generator can embed it.
//
// ONE NAME SPACE. Every top-level name here starts with `buildRequest`, `BuildRequest` or `BUILD_REQUEST_`, so the
// generated region never meets two declarations of one name. The ticket key that names a board position is not
// spelled anywhere in this file, comments included: scripts/validate.test.ts counts every scripts file that names both
// ticket keys as a possible second board authority.
//
// VALUE-SILENT REFUSALS. A refusal reason names a 1-based line, the closed key set or a key's form, and never quotes
// text from the file, because a reason can reach a report an agent reads (research Pitfall 11, 44-10 CR-02). The
// report lines print only grammar-checked fields: a build-request id, a source id, a date and a status.
//
// Voice: clear professional voice (CLAUDE.md hard rule): these findings tell a human which request needs them.
import { isTicketId, normalizeDocument } from "./board-model.js";
import { HUMAN_STAMP_RE } from "./context-io.js";
import { sectionEndIndex, unfencedHeadingIndices } from "./frontmatter.js";
import { isCalendarDate } from "./state-rules.js";
import { isTicketRef } from "./trace-model.js";
import { UPSTREAM_ID_RE, UPSTREAM_OBJECT_ID_RE, UPSTREAM_SOURCE_ID_RE } from "./upstream-model.js";
// ── Constants ───────────────────────────────────────────────────────────────────────────────────────────
/** The closed frontmatter key set of a build-request file (D-05). Every key is required, once, non-empty. */
export const BUILD_REQUEST_KEYS = Object.freeze(["id", "status", "source", "pin", "raised"]);
/** TWO-SIDED, and a change here is a decision recorded in the build-request contract first. */
export const BUILD_REQUEST_KEY_COUNT = 5;
/** The closed lifecycle of a build request (44 D-04). */
export const BUILD_REQUEST_STATUSES = Object.freeze(["open", "carried", "answered", "withdrawn"]);
/** A build-request id: `BR-`, a digit 1-9, then up to 8 digits. No leading zero, so `BR-1` and `BR-01` cannot both exist. */
export const BUILD_REQUEST_ID_RE = /^BR-[1-9][0-9]{0,8}$/;
/** The largest build-request file a reader opens, in bytes: a reader ceiling, not the folder's byte budget. */
export const BUILD_REQUEST_READ_MAX_BYTES = 65536;
/** The frontmatter delimiter line. */
const BUILD_REQUEST_DELIMITER = "---";
/** A frontmatter line: a key, a colon, one space and a value without a tab, or a key and a colon alone. */
const BUILD_REQUEST_KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):(?: ([^\t]*))?$/;
/** A C0 control other than the tab and the newline, plus DEL: a byte no terminal renders and no human wrote. */
const BUILD_REQUEST_CONTROL = /[\x00-\x08\x0b-\x1f\x7f]/;
/** The digit shape of `raised`; the calendar check runs after it. */
const BUILD_REQUEST_DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
/** The six level-two sections of the body, each exactly once, in this order (D-05). */
export const BUILD_REQUEST_SECTIONS = Object.freeze([
    "## Question",
    "## Upstream IDs",
    "## Options",
    "## Blocks",
    "## History",
    "## Answer",
]);
/** The text after `- ` that opens the one recommended option in `## Options` (plan 45-03 checkpoint, option-a). */
export const BUILD_REQUEST_RECOMMENDED_MARKER = "(recommended) ";
/** The single line `## Upstream IDs` holds when the request names no upstream ID (plan 45-03 checkpoint, option-a). */
export const BUILD_REQUEST_NONE_IDS = "none";
/** The closed History events (plan 45-03 checkpoint, option-a). Only `open` may be the first entry. */
export const BUILD_REQUEST_EVENTS = Object.freeze(["open", "edited", "carried", "answered", "withdrawn"]);
/** The one agent actor a History entry may name: BA/PM, the single writer of a build request (D-06). */
export const BUILD_REQUEST_AGENT_ACTOR = "BA/PM";
/** The bullet every list item of the body opens with. */
const BUILD_REQUEST_BULLET = "- ";
/** The opening of the one optional title line before `## Question`: a level-one heading. */
const BUILD_REQUEST_TITLE_OPENING = "# ";
/**
 * One History line: `- `, a date, `: `, an event, `, by `, an actor, then the event's tail. The actor is `BA/PM` or
 * text opening `human:` with no comma, colon or space; HUMAN_STAMP_RE then decides the human stamp.
 */
const BUILD_REQUEST_HISTORY_RE = /^- ([0-9]{4}-[0-9]{2}-[0-9]{2}): (open|edited|carried|answered|withdrawn), by (BA\/PM|human:[^,:\s]*)(.*)$/;
/** The tail of an `edited` or `withdrawn` line: a colon, one space and a text. */
const BUILD_REQUEST_TEXT_TAIL_RE = /^: (.*\S.*)$/;
/** The tail of an `answered` line: the new pin and the optional not-descendant flag (D-11). */
const BUILD_REQUEST_ANSWER_TAIL_RE = /^, pin ([0-9a-f]+)(, not-descendant)?$/;
// ── File names and ids ──────────────────────────────────────────────────────────────────────────────────
/** The id a file name gives when it is exactly `<id>.md` with a well-formed id, else null. */
export function buildRequestIdOfFileName(name) {
    if (!name.endsWith(".md"))
        return null;
    const id = name.slice(0, -".md".length);
    return BUILD_REQUEST_ID_RE.test(id) ? id : null;
}
/** Numeric order of two well-formed build-request ids, so `BR-2` sorts before `BR-10`. */
export function compareBuildRequestIds(a, b) {
    return Number(a.slice("BR-".length)) - Number(b.slice("BR-".length));
}
function buildRequestRefusal(code, reason, line) {
    return line === undefined ? { ok: false, code, reason } : { ok: false, code, reason, line };
}
/** Whether `value` is legal for `key`, by the key's form (D-05). */
function buildRequestValueOk(key, value) {
    if (key === "id")
        return BUILD_REQUEST_ID_RE.test(value);
    if (key === "status")
        return BUILD_REQUEST_STATUSES.includes(value);
    if (key === "source")
        return UPSTREAM_SOURCE_ID_RE.test(value);
    if (key === "pin")
        return UPSTREAM_OBJECT_ID_RE.test(value);
    return BUILD_REQUEST_DATE_RE.test(value) && isCalendarDate(value);
}
/** The form each key's value takes, for a value-silent refusal reason. */
function buildRequestValueForm(key) {
    if (key === "id")
        return "`BR-` then a number with no leading zero";
    if (key === "status")
        return `one of ${BUILD_REQUEST_STATUSES.join(", ")}`;
    if (key === "source")
        return "a declared source id: a lowercase letter, then up to 31 lowercase letters, digits and hyphens";
    if (key === "pin")
        return "a full 40- or 64-character lowercase hex commit id";
    return "a calendar date written YYYY-MM-DD";
}
/**
 * Admit the frontmatter of a build-request file named `fileName`, or refuse it with one code.
 *
 * The text goes through normalizeDocument first, the one text fold the board and ticket readers use. The region is
 * the lines between the first `---` line and the next one; the body after it is not read here. Every key of
 * BUILD_REQUEST_KEYS is required, once, with a non-empty value of its form, and the `id` equals the file name's id.
 */
export function parseBuildRequestDocument(text, fileName) {
    const nameId = buildRequestIdOfFileName(fileName);
    if (nameId === null) {
        return buildRequestRefusal("bad-file-name", "a build-request file is named `BR-<n>.md`, with no leading zero");
    }
    const lines = normalizeDocument(text).split("\n");
    if (lines[0] !== BUILD_REQUEST_DELIMITER) {
        return buildRequestRefusal("no-opening-delimiter", "a build-request file opens with a `---` line on line 1", 1);
    }
    let close = -1;
    for (let i = 1; i < lines.length; i += 1) {
        if (lines[i] === BUILD_REQUEST_DELIMITER) {
            close = i;
            break;
        }
    }
    if (close === -1) {
        return buildRequestRefusal("no-closing-delimiter", "the frontmatter opens with `---` on line 1 and no later line closes it");
    }
    const values = new Map();
    for (let i = 1; i < close; i += 1) {
        const line = lines[i];
        const at = i + 1;
        if (line.trim() === "")
            continue;
        if (BUILD_REQUEST_CONTROL.test(line)) {
            return buildRequestRefusal("control-character", `line ${at} carries a control character`, at);
        }
        const m = BUILD_REQUEST_KEY_LINE.exec(line);
        if (m === null) {
            return buildRequestRefusal("unrecognized-line", `line ${at} is neither \`key: value\` nor \`key:\``, at);
        }
        const key = m[1];
        if (!BUILD_REQUEST_KEYS.includes(key)) {
            return buildRequestRefusal("unknown-key", `line ${at} carries a key outside the closed set (${BUILD_REQUEST_KEYS.join(", ")})`, at);
        }
        const known = key;
        if (values.has(known)) {
            return buildRequestRefusal("duplicate-key", `line ${at} writes \`${known}\` a second time`, at);
        }
        const value = (m[2] ?? "").trim();
        if (value === "" || !buildRequestValueOk(known, value)) {
            return buildRequestRefusal("bad-value", `line ${at}: the value of \`${known}\` is not ${buildRequestValueForm(known)}`, at);
        }
        values.set(known, value);
    }
    for (const key of BUILD_REQUEST_KEYS) {
        if (!values.has(key)) {
            return buildRequestRefusal("missing-key", `the frontmatter has no \`${key}\`; every key of ${BUILD_REQUEST_KEYS.join(", ")} is required`);
        }
    }
    const id = values.get("id");
    if (id !== nameId) {
        return buildRequestRefusal("id-mismatch", "the frontmatter `id` differs from the id in the file name");
    }
    return buildRequestBody(lines, close, {
        id,
        status: values.get("status"),
        source: values.get("source"),
        pin: values.get("pin"),
        raised: values.get("raised"),
    });
}
/** The section names without their hashes, for a reason that lists them. */
function buildRequestSectionList() {
    return BUILD_REQUEST_SECTIONS.map((s) => `\`${s}\``).join(", ");
}
/**
 * Locate the six sections in `body` (the text after the closing delimiter), or refuse with `bad-section`. Returns, per
 * section in D-05 order, the 0-based body index of its heading. `toLine` turns a body index into a 1-based file line.
 */
function buildRequestSectionAt(body, bodyLines, toLine) {
    const at = [];
    for (const name of BUILD_REQUEST_SECTIONS) {
        const found = unfencedHeadingIndices(body, name);
        if (found.length === 0) {
            return buildRequestRefusal("bad-section", `the body has no \`${name}\` section; a build request holds ${buildRequestSectionList()}, each once`);
        }
        if (found.length > 1) {
            const second = toLine(found[1]);
            return buildRequestRefusal("bad-section", `line ${second} writes \`${name}\` a second time; each section appears once`, second);
        }
        at.push(found[0]);
    }
    const first = at[0];
    const firstHeading = sectionEndIndex(body, 0, 2);
    // Every unfenced heading of level one or two, walked through the one section owner. Each must be a section heading,
    // except one level-one title line that comes before `## Question`.
    for (let i = firstHeading; i < bodyLines.length; i = sectionEndIndex(body, i + 1, 2)) {
        if (at.includes(i))
            continue;
        if (i === firstHeading && i < first && bodyLines[i].startsWith(BUILD_REQUEST_TITLE_OPENING))
            continue;
        const line = toLine(i);
        return buildRequestRefusal("bad-section", `line ${line} is a heading outside the six sections (${buildRequestSectionList()}); only one level-one title line may come before \`## Question\``, line);
    }
    for (let s = 1; s < at.length; s += 1) {
        if (at[s] < at[s - 1]) {
            const line = toLine(at[s]);
            return buildRequestRefusal("bad-section", `line ${line}: \`${BUILD_REQUEST_SECTIONS[s]}\` comes before \`${BUILD_REQUEST_SECTIONS[s - 1]}\`; the sections run in the order ${buildRequestSectionList()}`, line);
        }
    }
    for (let i = 0; i < first; i += 1) {
        const text = bodyLines[i];
        if (text.trim() === "" || text.startsWith(BUILD_REQUEST_TITLE_OPENING))
            continue;
        const line = toLine(i);
        return buildRequestRefusal("bad-section", `line ${line} holds text before \`## Question\`; only one level-one title line may come before the first section`, line);
    }
    return { ok: true, value: at };
}
/** The non-blank lines of the section whose heading sits at body index `heading`. */
function buildRequestItems(body, bodyLines, heading, toLine) {
    const end = sectionEndIndex(body, heading + 1, 2);
    const items = [];
    for (let i = heading + 1; i < end; i += 1) {
        const text = bodyLines[i].trimEnd();
        if (text.trim() !== "")
            items.push({ text, line: toLine(i) });
    }
    return items;
}
/** `## Upstream IDs`: one `- <ID>` bullet per upstream ID, each once, or the single line `none`. */
function buildRequestUpstreamIds(items, headingLine) {
    const refuse = (reason, line) => buildRequestRefusal("bad-upstream-ids", reason, line);
    if (items.length === 0) {
        return refuse(`line ${headingLine}: \`## Upstream IDs\` is empty; it holds one \`- <ID>\` bullet per upstream ID, or the single line \`${BUILD_REQUEST_NONE_IDS}\``, headingLine);
    }
    if (items.length === 1 && items[0].text === BUILD_REQUEST_NONE_IDS)
        return { ok: true, value: [] };
    const ids = [];
    for (const item of items) {
        if (item.text === BUILD_REQUEST_NONE_IDS) {
            return refuse(`line ${item.line}: \`${BUILD_REQUEST_NONE_IDS}\` is the only line of a section that names no ID`, item.line);
        }
        const id = item.text.startsWith(BUILD_REQUEST_BULLET) ? item.text.slice(BUILD_REQUEST_BULLET.length) : "";
        if (!UPSTREAM_ID_RE.test(id)) {
            return refuse(`line ${item.line} is not \`- <ID>\` with an upstream ID: capital letters and digits, a hyphen and a number`, item.line);
        }
        if (ids.includes(id))
            return refuse(`line ${item.line} names an upstream ID a second time`, item.line);
        ids.push(id);
    }
    return { ok: true, value: ids };
}
/** `## Options`: at least one `- <text>` bullet, and exactly one opens with the recommended marker. */
function buildRequestOptions(items, headingLine) {
    const refuse = (reason, line) => buildRequestRefusal("bad-options", reason, line);
    const marked = BUILD_REQUEST_RECOMMENDED_MARKER.trimEnd();
    const options = [];
    for (const item of items) {
        if (!item.text.startsWith(BUILD_REQUEST_BULLET) || item.text.slice(BUILD_REQUEST_BULLET.length).trim() === "") {
            return refuse(`line ${item.line} is not an option bullet \`- <text>\``, item.line);
        }
        const rest = item.text.slice(BUILD_REQUEST_BULLET.length);
        if (rest.startsWith(marked)) {
            const text = rest.startsWith(BUILD_REQUEST_RECOMMENDED_MARKER)
                ? rest.slice(BUILD_REQUEST_RECOMMENDED_MARKER.length).trim()
                : "";
            if (text === "") {
                return refuse(`line ${item.line}: the recommended option is \`- ${BUILD_REQUEST_RECOMMENDED_MARKER}<text>\`, with a text`, item.line);
            }
            options.push({ text, recommended: true });
        }
        else {
            options.push({ text: rest.trim(), recommended: false });
        }
    }
    const recommended = options.filter((o) => o.recommended).length;
    if (options.length === 0 || recommended !== 1) {
        return refuse(`line ${headingLine}: \`## Options\` holds at least one bullet and exactly one opens \`- ${BUILD_REQUEST_RECOMMENDED_MARKER}\`; it has ${options.length} bullets and ${recommended} recommended`, headingLine);
    }
    return { ok: true, value: options };
}
/** `## Blocks`: at least one `- <ticket ID>` bullet, each once, none with a reserved structural prefix. */
function buildRequestBlocks(items, headingLine) {
    const refuse = (reason, line) => buildRequestRefusal("bad-blocks", reason, line);
    if (items.length === 0) {
        return refuse(`line ${headingLine}: \`## Blocks\` names at least one blocked ticket as \`- <ticket ID>\``, headingLine);
    }
    const blocks = [];
    for (const item of items) {
        const id = item.text.startsWith(BUILD_REQUEST_BULLET) ? item.text.slice(BUILD_REQUEST_BULLET.length) : "";
        if (!isTicketRef(id, isTicketId)) {
            return refuse(`line ${item.line} is not \`- <ticket ID>\` with a ticket ID; a build request, epic, decision or other structural ID is not a ticket`, item.line);
        }
        if (blocks.includes(id))
            return refuse(`line ${item.line} names a blocked ticket a second time`, item.line);
        blocks.push(id);
    }
    return { ok: true, value: blocks };
}
/** Parse one History line into an entry by the closed forms, or null when it has none of them. */
function buildRequestHistoryEntry(item) {
    const m = BUILD_REQUEST_HISTORY_RE.exec(item.text);
    if (m === null)
        return null;
    const date = m[1];
    const event = m[2];
    const actor = m[3];
    const tail = m[4];
    if (!isCalendarDate(date))
        return null;
    if (actor !== BUILD_REQUEST_AGENT_ACTOR && !HUMAN_STAMP_RE.test(actor))
        return null;
    const base = { date, event, actor, pin: null, notDescendant: false, line: item.line };
    if (event === "open" || event === "carried")
        return tail === "" ? base : null;
    if (event === "edited" || event === "withdrawn")
        return BUILD_REQUEST_TEXT_TAIL_RE.test(tail) ? base : null;
    const a = BUILD_REQUEST_ANSWER_TAIL_RE.exec(tail);
    if (a === null || !UPSTREAM_OBJECT_ID_RE.test(a[1]))
        return null;
    return { ...base, pin: a[1], notDescendant: a[2] !== undefined };
}
/** The status a History implies, and every entry, or the first refusal by line (D-06, D-07, D-08, BR-05). */
function buildRequestHistory(items, headingLine, fm) {
    const refuse = (code, reason, line) => buildRequestRefusal(code, reason, line);
    if (items.length === 0) {
        return refuse("bad-history-order", `line ${headingLine}: \`## History\` is empty; its first entry is \`open, by ${BUILD_REQUEST_AGENT_ACTOR}\` dated \`raised\``, headingLine);
    }
    const entries = [];
    let state = "open";
    for (const item of items) {
        const entry = buildRequestHistoryEntry(item);
        const at = item.line;
        if (entry === null) {
            return refuse("bad-history-line", `line ${at} is not a History entry: \`- YYYY-MM-DD: <event>, by <actor>\` in one of the closed forms for ${BUILD_REQUEST_EVENTS.join(", ")}`, at);
        }
        const human = entry.actor !== BUILD_REQUEST_AGENT_ACTOR;
        const previous = entries[entries.length - 1];
        if (previous === undefined) {
            if (entry.event !== "open" || entry.date !== fm.raised) {
                return refuse("bad-history-order", `line ${at}: the first History entry is \`open\`, dated the frontmatter \`raised\``, at);
            }
            if (human) {
                return refuse("bad-transition", `line ${at}: a request is opened by ${BUILD_REQUEST_AGENT_ACTOR}`, at);
            }
            entries.push(entry);
            continue;
        }
        if (entry.date < previous.date) {
            return refuse("bad-history-order", `line ${at} is dated before the entry above it; History dates never decrease`, at);
        }
        if (state === "answered" || state === "withdrawn") {
            return refuse("bad-transition", `line ${at} follows a \`${state}\` entry; an answered or withdrawn request takes no further entry`, at);
        }
        if (entry.event === "open") {
            return refuse("bad-transition", `line ${at}: \`open\` is only ever the first History entry`, at);
        }
        if (entry.event === "edited") {
            if (human)
                return refuse("bad-transition", `line ${at}: an edit is recorded by ${BUILD_REQUEST_AGENT_ACTOR}, its single writer`, at);
        }
        else if (entry.event === "carried") {
            if (!human) {
                return refuse("bad-transition", `line ${at}: \`carried\` names the human who carried the request, as \`human:<name>\``, at);
            }
            state = "carried";
        }
        else if (entry.event === "answered") {
            if (state !== "carried") {
                return refuse("bad-transition", `line ${at}: only a carried request is answered; an open request is withdrawn instead`, at);
            }
            if (!human) {
                return refuse("bad-transition", `line ${at}: \`answered\` names the human who set the new pin, as \`human:<name>\``, at);
            }
            const pin = entry.pin;
            if (pin.length !== fm.pin.length || pin === fm.pin) {
                return refuse("bad-transition", `line ${at}: the answer pin is a new commit id of the raising pin's length, different from the raising pin`, at);
            }
            state = "answered";
        }
        else {
            const want = state === "open" ? !human : human;
            if (!want) {
                return refuse("bad-transition", `line ${at}: ${BUILD_REQUEST_AGENT_ACTOR} withdraws an open request, and only a named human withdraws a carried one`, at);
            }
            state = "withdrawn";
        }
        entries.push(entry);
    }
    return { ok: true, value: { entries, implied: state } };
}
/** Read the body after the closing delimiter at `close` and finish the document, or refuse it with one code. */
function buildRequestBody(lines, close, fm) {
    const bodyLines = lines.slice(close + 1);
    const body = bodyLines.join("\n");
    const toLine = (i) => close + 2 + i;
    for (let i = 0; i < bodyLines.length; i += 1) {
        if (BUILD_REQUEST_CONTROL.test(bodyLines[i])) {
            return buildRequestRefusal("control-character", `line ${toLine(i)} carries a control character`, toLine(i));
        }
    }
    const located = buildRequestSectionAt(body, bodyLines, toLine);
    if (!located.ok)
        return located;
    const at = located.value;
    const items = at.map((h) => buildRequestItems(body, bodyLines, h, toLine));
    const headingLine = (s) => toLine(at[s]);
    if (items[0].length === 0) {
        return buildRequestRefusal("bad-section", `line ${headingLine(0)}: \`## Question\` is empty`, headingLine(0));
    }
    const upstreamIds = buildRequestUpstreamIds(items[1], headingLine(1));
    if (!upstreamIds.ok)
        return upstreamIds;
    const options = buildRequestOptions(items[2], headingLine(2));
    if (!options.ok)
        return options;
    const blocks = buildRequestBlocks(items[3], headingLine(3));
    if (!blocks.ok)
        return blocks;
    const history = buildRequestHistory(items[4], headingLine(4), fm);
    if (!history.ok)
        return history;
    if (history.value.implied !== fm.status) {
        return buildRequestRefusal("status-mismatch", `the frontmatter \`status\` differs from the status the last History entry other than \`edited\` implies`);
    }
    const answer = items[5];
    const hasAnswer = answer.length > 0;
    if (fm.status === "answered" && !hasAnswer) {
        return buildRequestRefusal("bad-answer", `line ${headingLine(5)}: an answered request records its answer under \`## Answer\``, headingLine(5));
    }
    if (fm.status !== "answered" && hasAnswer) {
        const line = answer[0].line;
        return buildRequestRefusal("bad-answer", `line ${line}: \`## Answer\` stays empty until the request is answered`, line);
    }
    return {
        ok: true,
        value: {
            ...fm,
            upstreamIds: upstreamIds.value,
            options: options.value,
            blocks: blocks.value,
            history: history.value.entries,
            hasAnswer,
        },
    };
}
// ── The requests report ─────────────────────────────────────────────────────────────────────────────────
/** The stdout line of one report item (plan 45-01 output grammar). */
export function formatBuildRequestReportLine(item) {
    if (item.kind === "refused") {
        return `refused ${item.fileName ?? "<entry not named BR-<n>.md>"}: ${item.code}`;
    }
    if (item.kind === "carry-open")
        return `carry ${item.id} ${item.source}: open since ${item.since}`;
    if (item.kind === "none")
        return "no build requests";
    return `no build request needs a human (${item.onFile} on file)`;
}
/** The exit code of a report: 2 when any item is `refused`, else 1 when any is `carry-open`, else 0. */
export function buildRequestReportExitCode(items) {
    if (items.some((i) => i.kind === "refused"))
        return 2;
    if (items.some((i) => i.kind === "carry-open"))
        return 1;
    return 0;
}

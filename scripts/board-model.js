// board-model.ts — the ONE board-grammar authority (plan 32-01, DASH-01).
//
// WHAT THIS MODULE IS, AND WHAT IT REFUSES TO BE.
//
// `agent-factory/contracts/board.md` is the authority for every shape this module admits. The
// contract states a small canonical form for column headings and for ticket rows; this module
// admits exactly that form and refuses every other byte by putting the line into `unparsed[]` with
// its line number. It does not widen a pattern once per counter-example. That posture is
// `scripts/canonical-frontmatter.ts`'s, adopted here for the same recorded reason: a module which
// INTERPRETS an open grammar has an unbounded set of inputs it can misread, and every misread lands
// on a success arm. A board the projector cannot read is a visible refusal, never a quiet empty
// column.
//
// THIS MODULE IS PURE, AND THE PURITY IS AN IMPORT EDGE RATHER THAN A COMMENT (D-15, D-23).
//   * It imports NOTHING from the Node filesystem builtin. `scripts/board-read.ts` is the named
//     seam that touches the disk, and the DASH-06 import-graph guard in plan 32-06 is what makes
//     the claim mechanical rather than narrated.
//   * It imports NOTHING from `./context-io.js` and NOTHING from `./claim.js`. Both modules export
//     writers, so importing either would put a write-capable symbol into the dashboard's import
//     closure — the exact thing DASH-06 exists to refuse. Where this module needs one of their
//     readers, it re-implements the reader rather than pulling the module in.
//   * It touches no `process`, starts no timer, and renders nothing. `scripts/board-dashboard.ts`
//     owns argv, stdout, exit codes and, from plan 32-03 onward, the watch loop.
//
// REGEX DISCIPLINE, BECAUSE THIS REPOSITORY HAS ALREADY PAID FOR ONE INCIDENT (T-32-01). The
// measured corpus contains a single line of 34,494 characters. Every pattern below is anchored at
// `^`, carries no nested quantifier, and bounds its numeric runs. The parenthetical scan in
// `splitRow` is a single linear pass with a depth counter rather than a pattern at all. A guard
// that takes 383 seconds is not a green guard.
//
// NO `trimStart` APPEARS IN THE HEADING SCAN OR THE ROW SCAN, AND THAT IS LOAD-BEARING. Both real
// mini-boards reachable from this machine are four-space indented inside documentation blocks. One
// left-trim promotes documentation into live state.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — this is a trace surface that a
// human reads to learn where work stands, never caveman voice).
// ── The published schema version (D-19) ──────────────────────────────────────────────────────────
//
// `schemaVersion: 1` is the shape a future web renderer consumes unchanged. Adding a field is
// additive; reinterpreting one breaks the golden fixture and every consumer. Any shape change bumps
// this number and updates the golden in the same commit.
export const SCHEMA_VERSION = 1;
// ── Bounds (D-20) ────────────────────────────────────────────────────────────────────────────────
//
// EACH OF THE FOUR NUMBERS BELOW IS A DECISION RECORDED IN `agent-factory/contracts/board.md`
// § Bounds, NEVER A TUNING KNOB TO BE RAISED WHEN A BOARD GROWS. A board past a ceiling is still
// parsed in full and still renders every row; the snapshot records what it measured and the header
// says so. Refusing a board over the ceiling was considered and rejected: it makes a growing board
// permanently unreadable, which is the failure mode the projector exists to report rather than to
// become.
/** The board size, in UTF-8 BYTES, past which `bounds.exceeded` is set. One mebibyte. */
export const LARGE_BOARD_BYTES = 1_048_576;
/** The single-line length, in UTF-16 CODE UNITS, past which `bounds.exceeded` is set. */
export const LONG_LINE_CHARS = 65_536;
/**
 * The cap, in UTF-16 code units, on a row's two opaque strings — `meta` and `trailer`.
 *
 * Roughly five lines of a wide terminal: enough that a human reads the whole of every meta a role
 * actually writes, bounded enough that one pathological row cannot dominate a JSON document.
 */
export const MAX_META_CHARS = 1_024;
/** The same cap, applied to an update entry's `text` and its `actor`. */
export const MAX_UPDATE_TEXT_CHARS = 1_024;
// ── Column headings (D-05) ───────────────────────────────────────────────────────────────────────
//
// EXACTLY THREE LEGAL SUFFIXES. Each pattern is anchored at both ends and is applied to the
// heading's TRAILING PARENTHETICAL ONLY, never to the whole line — so a 34 KB heading costs one
// linear scan for the parenthetical's opening byte and then a bounded match.
//
// This is the deliberate deviation from the pre-Phase-32 helper recorded as D-06. That helper
// stripped `\s*\(WIP[^)]*\)\s*$` and trimmed, which turned `## Columns (spec §6.1)` into a phantom
// column named `Columns (spec §6.1)` and left `## Blocked (visible, time-tracked)` unnormalized.
// Both defects are fixed here rather than ported.
export const HEADING_SUFFIXES = [
    { kind: "limited", pattern: /^\(WIP (\d{1,9})\/(\d{1,9})\)$/ },
    { kind: "unlimited", pattern: /^\(WIP unlimited\)$/ },
    { kind: "blocked", pattern: /^\(visible, time-tracked\)$/ },
];
// TWO-SIDED, and the message reads as a decision rather than as a bumped constant. A fourth legal
// heading suffix is recorded in `agent-factory/contracts/board.md` first; this number moves after
// the contract does, never before it.
export const HEADING_SUFFIX_COUNT = 3;
/** The single name the blocked suffix admits (D-07). */
const BLOCKED_COLUMN_NAME = "Blocked";
/** A level-two heading opens or closes a section; a deeper heading does neither. */
const H2_PREFIX = "## ";
// ── Rows (D-01 as amended by D-22) ───────────────────────────────────────────────────────────────
//
// The ONLY grammar is a bullet, a bracketed identifier, a space, and a title. Everything after the
// title is opaque. The bracket body is bounded so a pathological line cannot make the class scan
// unbounded, and the identifier is validated separately rather than inside the row pattern.
const ROW = /^- \[([^\]]{1,64})\] (.*)$/;
const TICKET_ID = /^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/;
const EPIC_ID = /^(?:EPIC|FEAT)-\d{1,9}$/;
/** The two-space gap that discriminates a real parenthetical from parentheses inside a title. */
const META_GAP = "  (";
// ── Update lines (D-03) ──────────────────────────────────────────────────────────────────────────
const UPDATED = /^_Updated: (\d{4}-\d{2}-\d{2}) by (.*)$/;
// ── The comment pre-pass (D-03) ──────────────────────────────────────────────────────────────────
/**
 * Replace every `<!-- … -->` span with spaces, preserving every newline so line numbers survive.
 *
 * `unparsed[]` carries line numbers, so the strip cannot DELETE lines — it blanks them. An
 * unterminated opener blanks to end of file, which is the fail-closed direction: the board renders
 * visibly empty rather than partially and confidently. An agent that opens `<!--` without closing it
 * would otherwise expose the remainder of the board to the grammar.
 */
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
/** Every character becomes a space; every newline survives. One character class, one pass. */
function blankKeepingNewlines(span) {
    return span.replace(/[^\n]/g, " ");
}
// ── The row splitter (D-01, D-22) ────────────────────────────────────────────────────────────────
/**
 * Split a row's post-identifier remainder into title, opaque meta, and opaque trailer.
 *
 * The split lands at the FIRST two-space-then-open-paren, not the last, and scans to the balanced
 * close with a depth counter. Measured against the 141-row live corpus: 141 admitted, 140 with a
 * captured `meta`. The one exception carries a parenthetical that never closes, and it degrades to a
 * null `meta` with the whole remainder as the title rather than being refused.
 */
export function splitRow(rest) {
    const at = rest.indexOf(META_GAP);
    if (at === -1)
        return { title: rest, meta: null, trailer: "" };
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
        return { title: rest, meta: null, trailer: "" };
    return {
        title: rest.slice(0, at),
        meta: rest.slice(at + 3, j),
        trailer: rest.slice(j + 1),
    };
}
/**
 * The heading, decomposed — or `null` when the line opens no column.
 *
 * NOT left-trimmed, and never will be: an indented heading is documentation. The parenthetical is
 * located by its LAST opening byte, so a name that itself contains parentheses keeps them.
 */
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
/** The column a heading line names, or `null` when the line opens no column. */
export function boardColumnName(line) {
    return matchHeading(line)?.name ?? null;
}
/**
 * Does the board carry `col` as a column?
 *
 * EXACT EQUALITY after the suffix strip, and the counterexample is pinned in
 * `scripts/board-tracer.test.ts`: the pre-Phase-32 helper used `startsWith("## " + col + " ")`, so
 * the column `In` matched the heading `## In Development (WIP 0/3)` and a genuinely wrong column
 * slipped the membership check (D-06).
 */
export function boardHasColumn(model, col) {
    const wanted = col.trim();
    return model.columns.some((c) => c.name === wanted);
}
/**
 * The ONE kebab spelling in this tree, moved verbatim from
 * `scripts/validate-agent-factory.ts:250-256` (D-06). The board-to-ticket rule is
 * `kebab(column) === status`; two spellings of it is the drift class.
 */
export const kebab = (s) => s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
function matchRow(line) {
    const row = ROW.exec(line);
    if (row === null)
        return null;
    const id = row[1];
    if (EPIC_ID.test(id))
        return { id, parts: splitRow(row[2]), isEpic: true };
    if (TICKET_ID.test(id))
        return { id, parts: splitRow(row[2]), isEpic: false };
    return null;
}
/**
 * Parse a board document into the `schemaVersion: 1` model.
 *
 * CRLF is normalized before anything else, the way `scripts/canonical-frontmatter.ts` does, so a
 * Windows checkout is not refused for a reason that has nothing to do with the grammar. The comment
 * pre-pass runs next, before any heading or row scan touches a byte.
 *
 * THE CLASSIFICATION RULE, STATED ONCE, BECAUSE ITS PRECEDENCE IS THE WHOLE DESIGN (D-24).
 *
 *   1. A level-two heading is never content. A heading carrying one of the three D-05 suffixes
 *      opens a column; any other level-two heading opens a non-column section. Either one closes
 *      whatever was open before it. A heading at level three opens nothing and closes nothing, so
 *      it becomes a content line of whatever section is current.
 *   2. A blank line is never content.
 *   3. A canonical `_Updated:` line is an update entry wherever it appears, so the twenty-five
 *      header updates of a real board never compete with its rows for a bucket.
 *   4. A legal row inside a column becomes a row or an epic row. A legal row OUTSIDE every column
 *      is a loud refusal rather than a quiet section line: it goes to `unparsed[]` with a null
 *      column. That is what makes the old specification's `## Blocked (2)` form visible — the
 *      heading opens no column, so the rows beneath it are reported rather than absorbed (D-07).
 *   5. Everything else is classed by position: a content line inside a non-column section belongs
 *      to that section, a content line before any heading is preamble, and a content line inside a
 *      column is unparsed.
 *
 * PRECEDENCE RULE 5 IS WHY `preamble` IS BOUNDED BY THE FIRST HEADING RATHER THAN BY THE FIRST
 * COLUMN. A document whose only heading is `## Notes (bootstrap, 2026-06-05)` has no columns at
 * all, and its prose belongs to that named section rather than to an unnamed preamble that would
 * then carry two unrelated kinds of line.
 */
export function parseBoard(text) {
    const normalized = text.split("\r\n").join("\n");
    const lines = stripHtmlComments(normalized).split("\n");
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
        const row = matchRow(raw);
        if (row !== null) {
            if (column === null) {
                unparsed.push({ line: lineNo, text: raw, column: null });
                continue;
            }
            if (row.isEpic) {
                epicRows.push({
                    ...row.parts,
                    id: row.id,
                    line: lineNo,
                    column: column.name,
                    truncated: false,
                });
                continue;
            }
            column.rows.push({ ...row.parts, id: row.id, line: lineNo, truncated: false });
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
        bounds: { boardBytes: 0, longestLine: 0, exceeded: false },
    };
}
/**
 * The canonical update-line shape (D-03).
 *
 * A line in any other `_Updated:` shape returns null here and is then classed BY POSITION rather
 * than by content: preamble before the first heading, a section line inside a non-column section,
 * an unparsed line inside a column. That positional rule is what keeps the kit board's own
 * `_Updated: <ISO date> by <role>_` placeholder off the findings list on a fresh install.
 */
export function matchUpdateLine(line, lineNo) {
    const m = UPDATED.exec(line);
    if (m === null)
        return null;
    return {
        date: m[1],
        actor: m[2].replace(/_$/, "").trim(),
        text: line,
        line: lineNo,
        truncated: false,
    };
}

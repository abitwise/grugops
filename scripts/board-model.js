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
// `schemaVersion` is the shape a future web renderer consumes unchanged.
//
// ONE RULE, BECAUSE THE TWO SENTENCES THAT USED TO LIVE HERE DISAGREED (plan 32-33, Task 1). They
// read "adding a field is additive" and "any shape change bumps this number", and a reader adding a
// field could take either as governing. The rule is now single: ANY change to the published shape
// moves this number and regenerates `scripts/fixtures/board-snapshot/expected-snapshot.json` in the
// same commit — an added field, a removed field, a reinterpreted one, and a changed conflict kind
// set alike. A consumer therefore decides from the NUMBER alone whether the document it holds is
// the shape it was written against, which is the only thing a version is for. "Additive" describes
// what a change costs a TOLERANT consumer; it never described what it costs this constant.
//
// VERSION 2 (plan 32-33): `TicketRecord` gained `stem`, the file's name under `plans/tickets/`
// without its extension, beside the `id` the document declares. The two are different facts and the
// document used to publish only the second, so a consumer holding the snapshot could not tell which
// file an identifier came from — and the join, asking the same question internally, answered it
// wrongly for every document whose declared identifier is not its stem. The human decision to move
// the version for it is recorded in
// `.planning/phases/32-board-projector-cli-dashboard/32-33-SUMMARY.md`.
export const SCHEMA_VERSION = 2;
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
/** The single-character marker a shortened string ends with. */
const ELLIPSIS = "…";
/**
 * Shorten `value` to `cap` UTF-16 code units, ending in a single-character marker.
 *
 * THE CUT LANDS BEFORE A SURROGATE PAIR, NEVER BETWEEN ITS HALVES. Slicing a JavaScript string at
 * an arbitrary index can leave a lone surrogate, which is not a character in any encoding and which
 * a terminal renders as a replacement glyph — a board whose meta ends in a broken code point looks
 * like a parser defect rather than like a stated bound.
 *
 * The result is at most `cap` code units: `cap - 1` of content plus the one-unit marker.
 */
function truncateAt(value, cap) {
    if (value.length <= cap)
        return { value, cut: false };
    let end = cap - 1;
    const lead = value.charCodeAt(end - 1);
    if (lead >= 0xd800 && lead <= 0xdbff)
        end -= 1;
    return { value: value.slice(0, end) + ELLIPSIS, cut: true };
}
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
// ── The per-source read state (D-11, D-12, D-13) ─────────────────────────────────────────────────
//
// WHY THIS UNION IS DECLARED IN THE PURE MODULE AND RE-EXPORTED FROM THE READ SEAM. `FactorySnapshot`
// below embeds one `SourceState` per joined source, and `FactorySnapshot` belongs here because it is
// the published shape (D-19) and carries no I/O. Declaring the union in `board-read.ts` and the
// snapshot here would make the two modules mutually dependent at the type level. Declaring it twice
// is the set-literal drift class this repository has already paid for. So it is declared once, in
// the module that has no imports at all, and `scripts/board-read.ts` — the module that PRODUCES it —
// re-exports it as its own published surface.
//
// THE `unavailable` ARM DELIBERATELY CARRIES NO VALUE. D-13's "absent is a legitimate state" case
// has nothing to render, and a value-less arm makes "render an empty board because the file was
// missing" UNREPRESENTABLE rather than merely discouraged.
// THE CLOSED SET OF REASONS A SOURCE CAN BE STALE, AND THE TYPE DERIVED FROM IT.
//
// The set is the authority and the type is its projection, rather than two hand-typed lists that can
// disagree — the set-literal drift class this repository has already paid for. `scripts/board-read.ts`
// re-exports it as `STALE_REASONS` with a two-sided count, because that is the module that PRODUCES
// a stale arm.
//
// Each member is a distinct sentence the D-12 badge says to a human about why the value on screen is
// old, which is why a sixth is a decision rather than a bumped constant:
//   enoent      the path is gone; it was read successfully before
//   eacces      the open is denied; the bytes exist and this process cannot have them
//   torn        the file changed under every read attempt, so no read of it is trustworthy
//   bounded     the directory is larger than the walk bound, so the value is what was gathered first
//   unreadable  the bytes were read and the CONTENT did not parse (D-11's "a partial parse")
export const STALE_REASONS = [
    "enoent",
    "eacces",
    "torn",
    "bounded",
    "unreadable",
];
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
 *
 * THE TITLE IS RIGHT-TRIMMED IN ALL THREE ARMS (plan 32-17, IN-03). `indexOf(META_GAP)` finds the
 * LAST TWO spaces of a run, so a gap wider than the canonical two left every earlier space on the
 * title. That is cosmetic in the frame, which pads the column anyway, and it lands VERBATIM in the
 * published `--json` document: two boards differing only in whitespace produced different
 * `schemaVersion: 1` payloads, which is a difference no consumer can act on and none can see.
 *
 * THE TRIM IS ON EVERY ARM, WHICH IS THE POINT. This function returns a title from three places —
 * no parenthetical, unbalanced, balanced — and a trim applied to one of them is the sibling-arm
 * shape this round exists to stop. A case derived from this function's own text asserts that every
 * `title:` here carries the trim.
 *
 * `trimEnd` RATHER THAN `trim`, AND NEITHER `meta` NOR `trailer` IS TRIMMED. The whitespace AHEAD
 * of a parenthetical is the grammar's own delimiter written wide; whitespace a human typed at the
 * START of a title is what they typed. And D-01 and D-22 say nothing inside `meta` or `trailer` is
 * interpreted, so whitespace inside those two is content rather than punctuation. All three answers
 * are pinned by cases rather than left for the next reader to infer.
 */
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
/**
 * A row's two opaque strings, each held to `MAX_META_CHARS` (D-20).
 *
 * The title is NOT bounded here. It is the one piece of a row a human reads to know which ticket
 * the line is about, and the measured corpus carries no long one — the 34,494-character line is a
 * parenthetical, not a title. Bounding it would shorten the field that identifies the row in order
 * to defend against a shape nothing writes.
 */
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
/**
 * The ticket identifier's prefix — everything before the final hyphen of an already-matched ID.
 *
 * Only ever applied to a string that `TICKET_ID` has already admitted, so the hyphen it looks for
 * is guaranteed present and the result is guaranteed to be capitals and digits.
 */
function idPrefixOf(id) {
    return id.slice(0, id.lastIndexOf("-"));
}
/**
 * Decompose a row, honouring the configured identifier prefix (D-02).
 *
 * THE PREFIX RULE IS ENFORCED BY THE PARSE RATHER THAN BY AN EIGHTH CONFLICT KIND. The contract
 * says a bracket carrying anything other than a conforming identifier makes the line unparsed, and
 * `factory.config.json#id_prefix` is part of what "conforming" means. Plan 32-04 found that the
 * pure parser could not enforce it because it holds no dial; the answer is that the dial's VALUE is
 * passed in by the read seam, not that the parser reads a file. The module stays pure, and the
 * refusal stays loud — a foreign-prefix row is reported with its line number rather than joined.
 *
 * EPIC AND FEATURE IDENTIFIERS ARE EXEMPT. They are a second class (D-02) with their own fixed
 * prefixes, so a project prefix has nothing to say about them.
 */
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
/**
 * The ONE place a document's encoding artefacts are normalized, for BOTH grammars (plan 32-16).
 *
 * TWO ARTEFACTS, AND NOTHING ELSE. A single leading byte-order mark is removed, and Windows line
 * endings are folded to newlines. Neither is content: both are what an editor wrote around the
 * document, and a grammar that reasons about them is a grammar that refuses a Windows checkout for
 * a reason that has nothing to do with what the author typed.
 *
 * WHY THIS IS THE GRAMMAR'S JOB AND NOT THE READ SEAM'S. `readVerifyReread` decodes with
 * `ignoreBOM: true` on purpose (`scripts/board-read.ts`) — it compares a stat's byte count against
 * the bytes it holds, so it must not silently drop three of them or its own agreement test stops
 * being honest. That decision is unchanged. The seam preserves the bytes; the GRAMMAR decides what
 * a document's first line is. `scripts/validate-agent-factory.ts` reads a ticket's bytes itself and
 * calls `parseTicketDocument` directly, which is the second reason this cannot live at the seam:
 * the structure validator never passes through one.
 *
 * AT MOST ONE MARK, AND THE SECOND IS CONTENT. A document whose second character is another mark is
 * not a Windows save, and the grammar answers it through the rules that already exist — a ticket is
 * refused `no-opening-delimiter`, a board heading becomes a preamble line — rather than by looping
 * until the document starts with something the parser likes.
 *
 * ONE SPELLING, PINNED MECHANICALLY. Until plan 32-16 this fold was written twice in this file and
 * the two copies disagreed about the mark for a whole phase while every case stayed green. A case in
 * `scripts/board-model.test.ts` counts the non-comment occurrences of the fold in this module and
 * asserts there is exactly one, inside this function.
 */
export function normalizeDocument(text) {
    const withoutMark = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    return withoutMark.split("\r\n").join("\n");
}
/**
 * Parse a board document into the `schemaVersion: 1` model.
 *
 * The document is normalized before anything else — through `normalizeDocument`, the ONE authority
 * both grammars share — so a Windows checkout is not refused, and does not silently lose its first
 * column, for a reason that has nothing to do with the grammar. The comment pre-pass runs next,
 * before any heading or row scan touches a byte.
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
/**
 * Measure the input, in the two units the contract names (D-20).
 *
 * `boardBytes` is the UTF-8 BYTE length of the input AS GIVEN, before CRLF normalization — the
 * number a human reads off `ls -l`, and the number a header claiming `380 KB` has to mean.
 * `longestLine` is a UTF-16 CODE-UNIT count over the normalized lines. The two units disagree on a
 * board carrying any character outside Latin-1, which is exactly why each is stated rather than
 * left for a reader to infer.
 *
 * Neither number is rounded here. The header's human-readable rendering rounds; the snapshot field
 * carries what was measured.
 */
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
// ── The ticket document (plan 32-05, D-10) ───────────────────────────────────────────────────────
//
// WHY A TICKET GRAMMAR LIVES HERE AND NOT IN `scripts/canonical-frontmatter.ts`.
//
// Plan 32-03 routed `plans/tickets/*.md` through `admit` and RECORDED the problem rather than
// smoothing it over: `CANONICAL_SCHEMA` is the KIT ADAPTER schema (`name`, `description`, `tools`,
// …), so a ticket carrying `status:` or `column:` is refused with `unknown-key`. A projector that
// refuses every real ticket cannot derive `board-vs-ticket` at all, so the question had to be
// answered here. Three answers were considered:
//
//   * WIDEN `CANONICAL_SCHEMA` to carry the ticket keys. REFUSED. That constant is the spawn-grant
//     authority closed at Phase 27 round 12; adding keys to it widens the set of documents the
//     spawn gate admits, for a reason that has nothing to do with spawning.
//   * ADD a second `admit` entry point taking a widened alphabet. REFUSED. `AdmitOptions` can only
//     NARROW, by construction rather than by convention, and that structural property is the thing
//     a reader checks from the type alone. A widening entry point beside it contradicts it. It
//     would also be REQUIRED: the canonical plain-scalar alphabet carries no `/`, and this kit's
//     own configured column `In Security/NFR` does, so every ticket in that column would be refused.
//   * LEAVE tickets refused with `unknown-key`. REFUSED. It makes `board-vs-ticket` underivable and
//     reports a schema mismatch as if it were a malformed document.
//
// So the TICKET is a second DOCUMENT CLASS with its own closed key set, admitted here — in the
// module that already owns every other shape the projector reads, and that imports nothing at all.
//
// THIS IS THE ONLY SPELLING. `scripts/validate-agent-factory.ts` carried its own `^column:` /
// `^status:` regex pair until plan 32-12, which deleted it and routed `checkTickets()` through this
// function, exactly as D-06 does for `boardColumnName` and `boardHasColumn`. Plan 32-08 had claimed
// that deletion and had not performed it; phase 32's verification (CR-06) found the pair still
// live, and the sentence that used to stand here promising a future commit is what let it survive a
// code review and a green suite. The claim is now in the present tense and is DERIVED rather than
// asserted: `scripts/validate.test.ts` censuses every `.ts` file under `scripts/` at test time and
// pins `TICKET_FRONTMATTER_READER_COUNT` at 1 naming this file, with a discrimination case that
// plants the deleted reader and watches the census go red on it.
//
// The canonical frontmatter authority keeps the document class it was built for and is not touched.
//
// THE POSTURE IS THE SAME ONE THE REST OF THIS MODULE TAKES: a small canonical form is admitted and
// every other byte is refused BY NAME. An unknown key is refused rather than ignored, because
// ignoring an unknown key is how a document grows a second place to hide a value.
/**
 * The closed ticket key set, stated in `agent-factory/contracts/board.md` § Ticket documents.
 *
 * Exported as a readonly array so a consumer can ITERATE it. A ninth key added here without a
 * contract sentence and a document that reaches it is the set-literal drift class this repository
 * has already paid for once, with seven granted names and zero resolving files.
 */
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
/** TWO-SIDED, and a change here is a decision recorded in the contract first. */
export const TICKET_KEY_COUNT = 8;
/**
 * The closed set of reasons a ticket document is refused, each a distinct sentence.
 *
 *   no-opening-delimiter  the document does not open with a `---` line
 *   no-closing-delimiter  the region opens and never closes
 *   unknown-key           a key outside TICKET_KEYS, refused rather than ignored
 *   duplicate-key         one key written twice, so the document expresses two values
 *   unrecognized-line     a line inside the region that is not `key: value` or `key:`
 *   control-character     a byte no terminal renders and no human wrote deliberately
 */
export const TICKET_REFUSAL_CODES = [
    "no-opening-delimiter",
    "no-closing-delimiter",
    "unknown-key",
    "duplicate-key",
    "unrecognized-line",
    "control-character",
];
/** TWO-SIDED. A seventh refusal reason is a decision, never a bumped constant. */
export const TICKET_REFUSAL_CODE_COUNT = 6;
const TICKET_DELIMITER = "---";
/**
 * The canonical region line: a key, a colon, one space, a value — or a key and a colon alone.
 *
 * THE VALUE EXCLUDES THE TAB, AND THAT EXCLUSION IS PART OF THE SAME DECISION THAT TOOK THE TAB OUT
 * OF `TICKET_CONTROL`. The control check runs before this pattern, so while the tab was a control
 * character this pattern never had to say anything about one. Taking it out of that class without
 * saying something here would have ADMITTED two shapes the grammar refused the day before — a tab
 * inside a value, carried into the model and onto the board, and a trailing tab, silently trimmed
 * away. A grammar that admits more with every counter-example discriminates nothing. Probed at all
 * four positions: after the colon, indenting the line, inside the value and trailing it — every one
 * is refused `unrecognized-line`, with the line quoted.
 */
const TICKET_KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):(?: ([^\t]*))?$/;
/**
 * A C0 control other than the tab and the newline, plus DEL.
 *
 * THE TAB IS DELIBERATELY OUTSIDE THIS CLASS, AND THE RULE THAT REFUSES IT IS `TICKET_KEY_LINE`.
 * The control check runs first, so while the tab was a member the key pattern never saw a line
 * carrying one and the refusal read "a control character, which no terminal renders and no human
 * wrote deliberately" — two sentences that are both untrue of a tab, over a document an author then
 * could not fix. A tab now reaches the key pattern, which admits neither `key:<TAB>value` nor a
 * line indented by one, and the document is refused `unrecognized-line` with the line quoted.
 *
 * WHY THE TAB IS REFUSED AT ALL, STATED TRUTHFULLY. Not because nobody writes one: because a tab's
 * rendered width is renderer-dependent, so an indentation-significant region carrying tabs means
 * different things to two readers looking at the same bytes. The canonical form is `key: value`
 * with one space, and D-64's posture is to refuse outside the form rather than widen the form to
 * admit what showed up. The newline is outside the class for a different reason: it ENDS a line
 * rather than sitting inside one, so the region never holds a line containing it.
 *
 * Exported so the membership can be DERIVED in a case rather than transcribed beside one. A
 * character class edited to green a suite is the set-literal drift class this repository has
 * already paid for; `scripts/board-model.test.ts` derives both this class's membership and the rule
 * that actually fires over every code point from 0 through 31 plus 127, and asserts they agree.
 */
export const TICKET_CONTROL = /[\x00-\x08\x0b-\x1f\x7f]/;
/**
 * Every code point `sanitizeCell` DELETES on the way to a reader. Spelled with `\u` escapes rather
 * than literal bytes so this source file carries no control character of its own.
 *
 * It is deliberately WIDER than `TICKET_CONTROL`: that class decides what the grammar REFUSES (and
 * admits TAB and LF, which is why a tabbed line reaches the `unrecognized-line` arm at all), while
 * this one decides what SURVIVES RENDERING. The two answer different questions and the difference
 * between them — TAB — is exactly the byte this rule exists for.
 */
export const RENDER_STRIPPED = /[\u0000-\u001F\u007F-\u009F]/g;
/**
 * Spell every byte a renderer would DELETE, at the point the diagnostic is BUILT.
 *
 * WHY THIS IS NOT COSMETIC (review WR-02, confirms 32-37 F-09). The ticket grammar refuses a tabbed
 * frontmatter line as `unrecognized-line` and QUOTES the offending line as its evidence. Every
 * rendered channel then ran that sentence through `sanitizeCell`, which deletes TAB — so the
 * message quoted a line reading `title:Something in the backlog` while asserting, beside it, that
 * the line is neither `key: value` nor `key:`. A reader following that message re-types the line
 * exactly as printed and is refused again.
 *
 * `agent-factory/contracts/board.md` says the refusal exists so "a human sees what the projector
 * declined to read". Escaping HERE rather than trusting the renderer means NOTHING the sanitizer
 * removes was ever load-bearing — the sibling of the rule that closed round-2's WR-04, which wanted
 * a control character REMOVED before serialization. One rule had been applied to both; they are
 * different questions.
 *
 * The notation is UNIFORM (`<U+0009>`, never a per-character nickname): a hand-kept table of
 * friendly names is a set literal that rots, and this repository has already paid for that class.
 */
export function visible(text) {
    return text.replace(RENDER_STRIPPED, (c) => `<U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}>`);
}
/**
 * Build a published sentence, applying `visible` to every value it interpolates — BY CONSTRUCTION.
 *
 * WHY IT EXISTS, MEASURED RATHER THAN ARGUED (review F-14, ledger row 200). `visible` was already
 * here and was applied at the two sites that quote a source LINE. The sites one layer up — the ones
 * that quote a value a document DECLARED — were never asked about, and a ticket whose `id` value
 * carries `U+0085` is ADMITTED: the grammar's control class (`TICKET_CONTROL`) does not cover the
 * C1 block, the key line's value capture admits it, and `RENDER_STRIPPED` deletes it. So a published
 * snapshot stated, twice, that `plans/tickets/ABC-901.md` declares the identifier `ABC-902X` — a
 * file that declares something else. A reader who searches the tree for what the sentence prints
 * finds nothing, and a reader who re-types it produces a different identifier. That is `visible`'s
 * own docblock, one field over: "a reader following that message re-types the line exactly as
 * printed and is refused again". The measured surface is 32 code points (the whole C1 block), not
 * one; the before-and-after transcript is
 * `.planning/phases/32.1-board-dashboard-deferred-residuals/32.1-07-RED-baseline.txt` § 1.
 *
 * WHY A TAG RATHER THAN A SECOND HELPER. A helper a caller MAY wrap a value in is a discipline
 * somebody has to remember at every new sentence, and F-14 is precisely a site nobody remembered —
 * the fix that introduced `visible` derived its own site set over the binding `line`, so the sites
 * it did not name were invisible to the derivation as well as to the author. A tagged template puts
 * the escaping in the CONSTRUCTOR: the template text is the author's, every substitution is
 * escaped on the way in, and a sentence built this way cannot carry an unspelled byte. There is no
 * arm in which a caller opts out, so there is nothing to forget and nothing to exempt.
 *
 * IT DOES NOT DOUBLE-ESCAPE, AND THE PROOF IS A CASE RATHER THAN AN ARGUMENT. Every rendered
 * channel scrubs downstream of here — `sanitizeCell` on each stderr line, on every string value and
 * every object key at every depth of the `--json` document — and
 * `scripts/board-dashboard.test.ts`'s two-authority pin asserts that `visible` escapes EXACTLY what
 * `sanitizeCell` deletes and that the escape TEXT survives that sanitizer unchanged. So the
 * observable change is that an admitted byte is now SPELLED where the sentence is built instead of
 * silently dropped where it is written; nothing is escaped twice and nothing is left raw.
 *
 * VALUES ARE `string | number` DELIBERATELY. A number cannot carry a code point a renderer deletes,
 * so admitting one costs nothing and keeps a line count out of a caller's `String(...)` noise.
 * Anything else — an object, `undefined`, a null — does not compile, because `String(undefined)`
 * publishing the word "undefined" inside a sentence a human acts on is a different defect this
 * builder would otherwise make easy to write.
 *
 * WHAT IT DOES NOT CLOSE, NAMED RATHER THAN IMPLIED:
 *   • It escapes the values it is GIVEN. It does not decide which values are content-derived — that
 *     question is answered by the derived census in `scripts/board-model.test.ts`, which resolves
 *     every substitution in these three modules to its DECLARATION and refuses a content-derived one
 *     built outside this tag.
 *   • It does not change what the ticket grammar ADMITS. `TICKET_CONTROL` is untouched here on
 *     purpose: widening it to the C1 block would change which ticket documents are readable at all,
 *     which is a grammar decision (DASH-01) and not this one. The remedy for an admitted byte is
 *     that the sentence SPELLS it, never that fewer bytes are admitted.
 */
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
/**
 * Admit a ticket document, or refuse it by name.
 *
 * The region is the bytes between the first `---` line and the next one. Only the region is read:
 * the body beneath it is the ticket's prose and is never interpreted, exactly as a row's `meta` and
 * `trailer` are never interpreted.
 *
 * The document goes through `normalizeDocument` first, the SAME authority `parseBoard` uses. Before
 * plan 32-16 this function carried its own copy of the line-ending fold and knew nothing about a
 * byte-order mark, so a ticket a Windows editor saved was refused `no-opening-delimiter` quoting a
 * line that renders exactly as `---` — a finding no author could act on, and since plan 32-12 a hard
 * error in `scripts/validate-agent-factory.ts`.
 */
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
// ── Conflicts (D-08, D-09, D-10) ─────────────────────────────────────────────────────────────────
//
// THE SET IS CLOSED AT SEVEN AND THE SEVEN ARE THE ONES `agent-factory/contracts/board.md`
// § Conflicts NAMES IN PROSE. The contract states them and this module states them in code, with no
// third spelling anywhere. The order below is the contract's order, and it is load-bearing:
// `conflicts[]` is sorted by kind in DECLARATION order, so reshuffling this array silently reorders
// the committed golden.
//
// Exported as a readonly array so a consumer can ITERATE it — the golden's inventory case walks this
// array and asserts the fixture reaches every member. A kind added here without a fixture that
// reaches it is the set-literal drift class this repository has already paid for once.
export const CONFLICT_KINDS = [
    "board-vs-ticket",
    "ticket-unplaced",
    "ticket-duplicated",
    "row-without-file",
    "wip-limit",
    "wip-count",
    "column-missing",
];
/**
 * TWO-SIDED, and the message reads as a decision rather than as a bumped constant. An eighth kind is
 * recorded in `agent-factory/contracts/board.md` first, bumps `SCHEMA_VERSION`, and regenerates
 * `scripts/fixtures/board-snapshot/expected-snapshot.json` — all in one commit (D-10, D-19).
 */
export const CONFLICT_KIND_COUNT = 7;
/**
 * The conflict kinds whose derivation depends on a COMPLETE `plans/tickets/` listing (plan 32-09).
 *
 * WHY EACH OF THE TWO IS PRESENCE-DEPENDENT, in the form of the sentence it says to a human:
 *
 *   `row-without-file`   "no ticket file carries that identifier". That is a claim about every file
 *                        in `plans/tickets/` — it can only be made by something that saw all of them.
 *   `ticket-unplaced`    "no row names this ticket" is a claim about the board, but the SUBJECT of
 *                        the claim is a ticket record, and the set of subjects is the listing. A
 *                        listing that stopped early raises the kind for a subset nobody chose and,
 *                        worse, cannot raise it for the tickets it never saw.
 *
 * Both are therefore statements about the COMPLETENESS of a listing, and a listing that failed
 * established no completeness. `joinSnapshot` refuses to derive either while the tickets source is
 * anything other than `ok` — the same refusal it already applies to an unreadable board.
 *
 * THE OTHER FIVE ARE NOT GATED, AND THE SPLIT IS ASSERTED RATHER THAN LEFT TO THE READER
 * (`scripts/board-model.test.ts` derives the complement as `CONFLICT_KINDS` minus this set and pins
 * both cardinalities two-sided). `board-vs-ticket` and `ticket-duplicated` are positive claims about
 * documents that WERE read; `wip-limit`, `wip-count` and `column-missing` are claims about the board
 * and the dial alone. None of the five asserts that a file it never saw does not exist.
 */
export const PRESENCE_DEPENDENT_CONFLICT_KINDS = [
    "ticket-unplaced",
    "row-without-file",
];
// ── The presence question, asked ONCE over a TOTAL identifier population (plan 32-33, CR-03) ─────
//
// THE DEFECT THIS CLOSES, IN ONE SENTENCE. The join used to answer "does a file carry this
// identifier" from two maps keyed on two different notions of identity — the DECLARED id of an
// admitted document, and the file STEM of a refused one. A document admitted under a declared
// identifier other than its stem is in neither map, so the stem's presence question was answered as
// absence: `plans/tickets/ABC-300.md` sat on disk, readable, parsed and admitted, and the projector
// printed "no ticket file carries that identifier" under an `[ok]` badge.
//
// WHY A DISCRIMINATED ANSWER RATHER THAN A THIRD MAP LOOKUP AT THE CALL SITE. Round 1 closed the
// refused population by adding a second map beside the first, and round 2's own fix created the
// third population it does not reach. A fourth would create a fifth. The shape that stops that is
// the one plan 32-15 applied to the partition's SIZE — derive the total on the other side of the
// loop — asked here of the partition's KEYS: three MEASURED sets, and the fourth arm reachable only
// as their arithmetic complement. `absent` is not a case anybody has to remember to check; it is
// what is left when the identifier is in none of the sets the reader actually measured.
//
// THE ARM ORDER IS THE PRIORITY ORDER, AND IT IS STATED RATHER THAN INCIDENTAL. A document that
// declares an identifier answers for that identifier first, because that is the identity every
// other arm of the join uses. Only then is the identifier asked of the stem population, and only
// then of the refused one. A stem belongs to exactly one file in one directory listing, so the last
// two cannot both answer for one identifier through the same file.
export const TICKET_PRESENCE_KINDS = [
    "admitted-under-this-id",
    "admitted-under-another-id",
    "refused",
    "absent",
];
/**
 * TWO-SIDED, the shape `CONFLICT_KIND_COUNT` already establishes. A fifth arm means the population
 * was not total after all, which is a finding to record in
 * `agent-factory/contracts/board.md` first — never a bumped constant.
 */
export const TICKET_PRESENCE_KIND_COUNT = 4;
/**
 * Index the reader's whole listing three ways, in one pass per half.
 *
 * FIRST WINS IN BOTH ADMITTED INDEXES, AND FIRST MEANS FIRST BY FILE NAME, because `boundNames` in
 * `scripts/board-read.ts` sorts the listing before the walk bound is applied (plan 32-17, WR-09).
 * The survivor is therefore stated rather than whichever document a filesystem handed over first.
 */
export function ticketPopulations(tickets, unadmittedTickets) {
    const byId = new Map();
    const byStem = new Map();
    for (const t of tickets) {
        if (!byId.has(t.id))
            byId.set(t.id, t);
        if (!byStem.has(t.stem))
            byStem.set(t.stem, t.id);
    }
    const refusedById = new Map();
    for (const u of unadmittedTickets)
        if (!refusedById.has(u.id))
            refusedById.set(u.id, u);
    return { byId, byStem, refusedById };
}
/**
 * What the reader measured about `id` — the ONE derivation every presence answer comes from.
 *
 * `absent` IS REACHABLE ONLY BY FALLING OFF THE END of three measured lookups. That is the whole
 * mechanism: the one sentence in this module that asserts a negative is the one sentence no
 * measurement can produce directly.
 */
export function presenceOf(id, populations) {
    const admitted = populations.byId.get(id);
    if (admitted !== undefined)
        return { kind: "admitted-under-this-id", record: admitted };
    const declaredByThatFile = populations.byStem.get(id);
    if (declaredByThatFile !== undefined) {
        // WHICH document is joined under that identifier is a MEASUREMENT, not an assumption. `byStem`
        // holds every admitted record including a duplicate-identifier loser, so the winner has to be
        // looked up rather than inferred from the stem being present.
        return {
            kind: "admitted-under-another-id",
            declaredId: declaredByThatFile,
            joinedStem: populations.byId.get(declaredByThatFile)?.stem,
        };
    }
    const refused = populations.refusedById.get(id);
    if (refused !== undefined)
        return { kind: "refused", code: refused.code };
    return { kind: "absent" };
}
/**
 * The `actual` cell of a `row-without-file` conflict: one sentence per arm, each naming a fact the
 * reader measured.
 *
 * NO SENTENCE QUOTES A BYTE OF ANY DOCUMENT'S BODY. The path is a function of the identifier the
 * BOARD wrote; the refusal code is the authority's own spelling; the declared identifier is a value
 * the snapshot already publishes as `tickets[].id` and the reader already publishes in its
 * `duplicate-id` read error. An admitted document carries no control character — the ticket grammar
 * refuses one by name — so the declared identifier cannot carry a byte the containment rule plan
 * 32-10 set would refuse to print.
 *
 * `admitted-under-this-id` HAS NO SENTENCE, and that is the point: a row whose identifier SOME
 * admitted document declares is not a `row-without-file` at all — the row's file was found, whatever
 * the directory called it. `joinSnapshot` reads the arm and raises nothing, so the four-arm answer
 * decides whether a conflict exists as well as what it says.
 *
 * THE ARM NAMES WHAT ITS LOOKUP MEASURED, WHICH IS WHY IT IS NOT NAMED FOR A STEM (review IN-01).
 * `byId.get(id)` decides that an admitted record declares THIS identifier; it says nothing about
 * the name the directory gave that record. `ABC-901.md` declaring `id: ABC-902` reaches this arm
 * for `ABC-902` carrying a record whose stem is `ABC-901`, so a name asserting "under its stem"
 * asserted a fact no lookup here measured. `admitted-under-another-id` is its converse, and the
 * pair now reads as one.
 */
export function presenceActual(id, presence) {
    switch (presence.kind) {
        case "admitted-under-this-id":
            return null;
        case "admitted-under-another-id":
            // THE TWO POPULATIONS ARE SAID APART. A document that WON its identifier is joined under it;
            // a duplicate-identifier LOSER is joined under nothing, and saying it "is joined under that
            // identifier" contradicts the `duplicate-id` read error the same snapshot publishes — one
            // document disagreeing with itself three fields later, which is the very disagreement
            // DASH-03 exists to surface between two sources.
            if (presence.joinedStem === id) {
                return (spelled `plans/tickets/${id}.md exists and declares the identifier ${presence.declaredId}, ` +
                    `so it is joined under that identifier and not this one`);
            }
            return (spelled `plans/tickets/${id}.md exists and declares the identifier ${presence.declaredId}, ` +
                (presence.joinedStem === undefined
                    ? `which no admitted document is joined under, so it is joined under no identifier`
                    : spelled `which plans/tickets/${presence.joinedStem}.md claimed first, ` +
                        `so it is joined under no identifier`));
        case "refused":
            return spelled `plans/tickets/${id}.md exists and the reader could not admit it (${presence.code})`;
        case "absent":
            return "no ticket file carries that identifier";
    }
}
/** The value a source carries, or null when it is unavailable. Declared once; both modules use it. */
export function sourceValue(state) {
    return state.source === "unavailable" ? null : state.value;
}
/**
 * Join the six read sources into the published snapshot and derive every conflict.
 *
 * THIS FUNCTION READS NOTHING. It is a pure function of already-read values, which is what makes the
 * committed golden a byte-for-byte function of its committed inputs (D-15, D-19). It also means no
 * board byte can reach a filesystem path from here: this module imports neither `node:fs` nor
 * `node:path`, so the ticket lookup below is a match against the ticket LIST the reader produced,
 * never a path built from a bracket's contents (T-32-02).
 *
 * NOTHING IS RESOLVED SILENTLY. Every disagreement becomes a `conflicts[]` entry, and no row's
 * column and no ticket's status is ever rewritten. A duplicated row renders under both headings; a
 * row with no ticket file still renders. The projector never hides a line in order to report a
 * conflict about it.
 *
 * A BOARD THAT COULD NOT BE READ PRODUCES NO CONFLICTS. With `sources.board` unavailable there is
 * nothing for a ticket to disagree WITH, and reporting every ticket as `ticket-unplaced` would
 * restate one missing source as a hundred disagreements the badge already reports once.
 */
export function joinSnapshot(inputs) {
    const { sources } = inputs;
    const board = sourceValue(sources.board);
    const config = sourceValue(sources.config);
    const tickets = sourceValue(sources.tickets) ?? [];
    // THE ONE PREDICATE BOTH PRESENCE-DEPENDENT ARMS READ, spelled once (plan 32-09). `ok` and nothing
    // else: a `stale` tickets source carries a value, but that value is the PREVIOUS listing or a
    // bounded prefix of this one, and neither establishes that a file absent from it is absent from
    // the directory. `unavailable` carries nothing at all.
    const ticketsListingComplete = sources.tickets.source === "ok";
    const snapshot = {
        schemaVersion: SCHEMA_VERSION,
        repoRoot: inputs.repoRoot,
        generatedAt: inputs.generatedAt,
        board,
        config,
        sources,
    };
    if (board === null)
        return { snapshot, conflicts: [] };
    const found = [];
    const add = (line, conflict) => {
        found.push({ line, conflict });
    };
    // Every ticket row on the board, in document order. Epic rows are a SEPARATE CLASS (D-02): they
    // are never joined against `plans/tickets/` and never counted toward a column's WIP number, so
    // they are absent from this index by construction rather than filtered out of each derivation.
    const placements = [];
    for (const column of board.columns) {
        for (const row of column.rows) {
            placements.push({ id: row.id, column: column.name, line: row.line });
        }
    }
    const byId = new Map();
    for (const p of placements) {
        const list = byId.get(p.id);
        if (list === undefined)
            byId.set(p.id, [p]);
        else
            list.push(p);
    }
    // THE ONE MAP EVERY ARM CONSUMING THE TICKET POPULATION READS (plan 32-17, WR-08).
    //
    // FIRST WINS, AND FIRST MEANS FIRST BY FILE NAME. The reader hands its records over in listing
    // order and `boundNames` sorts that listing (plan 32-17, WR-09), so the survivor is stated rather
    // than whichever document a filesystem returned first. The duplicate itself is reported by the
    // reader, which is the only place both file NAMES exist; by the time the list arrives here the
    // second file's name is gone.
    //
    // THE ARMS THAT CONSUME THE TICKET POPULATION, ENUMERATED, so a future arm added against the raw
    // `tickets` list is visible as the odd one out rather than as one more plausible loop:
    //
    //   board-vs-ticket, arm one (column)  reads `ticketById.get(p.id)` — always did; it iterates
    //                                      PLACEMENTS and looks the identifier up.
    //   board-vs-ticket, arm two (status)  reads `ticketById.values()`.
    //   ticket-unplaced                    reads `ticketById.values()`.
    //   ticket-duplicated                  derived from the BOARD alone; holds no ticket record.
    //   row-without-file                   reads `presenceOf(p.id, populations)` and NOTHING ELSE;
    //                                      the three maps reach it through `populations`, so the arm
    //                                      cannot be correct for one population and wrong for the
    //                                      one beside it (plan 32-33, CR-03).
    //
    // Arms two and three used to iterate the raw list, so two files claiming one identifier produced
    // two byte-identical conflicts that both survived the total order — the tiebreak chain ends on
    // `expected`, which is equal for the two — while this map silently discarded one of them. The
    // contract promises the projector reports every conflict and resolves none; that was one
    // disagreement resolved in silence and another reported twice.
    // THE READER'S WHOLE LISTING, INDEXED THREE WAYS AND BUILT ONCE (plan 32-33, CR-03). `byId`
    // answers "which identifiers did a document STATE"; `byStem` answers "which NAMES did the
    // directory give those same documents"; `refusedById` answers "which entries did the reader SEE
    // and fail to admit". Two of the three are new here only in the sense that the second one used to
    // be missing — and a population nobody measured is a population the presence answer got wrong.
    const populations = ticketPopulations(tickets, inputs.unadmittedTickets);
    const ticketById = populations.byId;
    // ── board-vs-ticket, arm one: the ticket file names a different column ─────────────────────────
    for (const p of placements) {
        const t = ticketById.get(p.id);
        if (t === undefined || t.column === null)
            continue;
        if (t.column === p.column)
            continue;
        add(p.line, {
            kind: "board-vs-ticket",
            ticketId: p.id,
            column: p.column,
            expected: t.column,
            actual: p.column,
            source: "tickets",
        });
    }
    // ── board-vs-ticket, arm two: the status is not the kebab form of the column ───────────────────
    //
    // The rule is `kebab(column) === status`, the SAME rule `scripts/validate-agent-factory.ts:747`
    // applies, through the single `kebab` spelling that lives in this module (D-06). A second spelling
    // of one rule is the drift class; there is no second spelling.
    for (const t of ticketById.values()) {
        if (t.column === null || t.status === null)
            continue;
        const expected = kebab(t.column);
        if (expected === t.status)
            continue;
        add(byId.get(t.id)?.[0]?.line ?? 0, {
            kind: "board-vs-ticket",
            ticketId: t.id,
            column: t.column,
            expected,
            actual: t.status,
            source: "tickets",
        });
    }
    // ── ticket-unplaced: a ticket file with no row ─────────────────────────────────────────────────
    //
    // GATED ON AN `ok` TICKETS SOURCE (plan 32-09, `PRESENCE_DEPENDENT_CONFLICT_KINDS`). With the
    // listing stale, bounded or unavailable, the ticket set in hand is a subset nobody chose, and this
    // kind would be raised for the tickets that survived while staying silent about the ones that did
    // not. The badge already reports the one thing that is true: the listing failed.
    //
    // AN UNADMITTED DOCUMENT IS DELIBERATELY SILENT HERE, AND THE NEXT READER'S INSTINCT WILL BE TO
    // ADD IT (plan 32-15). `unadmittedById` is NOT walked by this arm. A refused document's identity
    // is a FILE STEM, not a statement the document made — the grammar refused to read what it says —
    // so raising "no row names this ticket" for it would be the same fabrication in the converse
    // direction: a positive claim that a refused document IS a ticket. The refusal is already
    // reported, with its path and its code, in `readErrors`; that is the honest channel for it.
    for (const t of ticketsListingComplete ? ticketById.values() : []) {
        if (byId.has(t.id))
            continue;
        add(0, {
            kind: "ticket-unplaced",
            ticketId: t.id,
            expected: "a row on the board",
            actual: spelled `no row names ${t.id}`,
            source: "tickets",
        });
    }
    // ── ticket-duplicated: one identifier carrying two or more rows ────────────────────────────────
    //
    // Two rows under the SAME heading are two rows, not one. Counting DISTINCT columns here would
    // silently dedupe an adjacent pair, which is the shape a copy-paste slip produces and therefore
    // the one a human most needs told about.
    for (const [id, list] of byId) {
        if (list.length < 2)
            continue;
        add(list[0]?.line ?? 0, {
            kind: "ticket-duplicated",
            ticketId: id,
            column: list[0]?.column ?? "",
            expected: "one row on the board",
            actual: list.map((p) => p.column).join(", "),
            source: "board",
        });
    }
    // ── row-without-file: a row naming an identifier with no ticket file ───────────────────────────
    //
    // GATED ON AN `ok` TICKETS SOURCE (plan 32-09). "No ticket file carries that identifier" is a
    // positive assertion about a directory this process may not have been able to open. CR-02 measured
    // what deriving it anyway costs: seven of these against six files that exist, under an `[ok]`
    // header. A conflict derived from a listing that failed is an assertion about a filesystem nobody
    // read, which CLAUDE.md's no-fabrication rule refuses before it is a bug.
    //
    // FOUR SENTENCES, ONE DERIVATION (plan 32-33, CR-03; plan 32-15, CR-01). The gate above answers
    // "was the LISTING obtained", which is a question about the directory. It cannot answer "is there
    // a file for THIS identifier". Answering that from `ticketById` alone — the set of parse
    // SUCCESSES — made the projector assert that a file which exists, and which it read and refused
    // by name, is not there; answering it from `ticketById` PLUS a map keyed on refused stems made it
    // assert the same thing about a file it read and ADMITTED under another identifier. So the arm
    // asks `presenceOf` once, and `presenceActual` states the sentence that is true for the arm it
    // returned. The absence sentence is reachable only from `absent`, which is reachable only when
    // three measurements all came back empty.
    //
    // THE KIND DOES NOT SPLIT. D-10 makes the kind set part of the published shape, and the honesty
    // is reachable inside the existing kind by making `actual` true. `expected` is the same in every
    // arm: the file a row of this identifier implies.
    const reportedMissing = new Set();
    for (const p of ticketsListingComplete ? placements : []) {
        if (reportedMissing.has(p.id))
            continue;
        // THE ARM DECIDES WHETHER THERE IS A CONFLICT AT ALL, not only what it says. A row whose file
        // was admitted under the row's own identifier is not a `row-without-file`, and that is the same
        // decision, taken in the same place, as which of the three sentences the other rows get.
        const actual = presenceActual(p.id, presenceOf(p.id, populations));
        if (actual === null)
            continue;
        reportedMissing.add(p.id);
        add(p.line, {
            kind: "row-without-file",
            ticketId: p.id,
            column: p.column,
            expected: spelled `plans/tickets/${p.id}.md`,
            actual,
            source: "board",
        });
    }
    // ── The column cross-check (D-08) ─────────────────────────────────────────────────────────────
    //
    // THE BOARD'S HEADINGS DECIDE WHICH COLUMNS EXIST AND IN WHAT ORDER. The dial supplies the
    // expected limit and nothing else. A heading column absent from the dial is LEGAL — an unlimited
    // column and the Blocked column carry no limit — and is noted by its own `kind` in the column
    // record rather than raised as a conflict.
    const wipLimits = config?.wipLimits ?? {};
    for (const column of board.columns) {
        const configured = Object.prototype.hasOwnProperty.call(wipLimits, column.name)
            ? wipLimits[column.name]
            : undefined;
        if (configured !== undefined && column.limit !== null && column.limit !== configured) {
            add(column.line, {
                kind: "wip-limit",
                column: column.name,
                expected: String(configured),
                actual: String(column.limit),
                source: "config",
            });
        }
        // ── wip-count (D-09): the claimed live number against the rows counted ───────────────────────
        //
        // NOTHING IS CORRECTED. Both numbers and the limit ride in the conflict, so the renderer can
        // show `claimed 2 / counted 3 / limit 3` and a human sees which of the three to fix.
        if (column.claimedLive !== null && column.claimedLive !== column.rows.length) {
            add(column.line, {
                kind: "wip-count",
                column: column.name,
                expected: `claimed ${column.claimedLive}, limit ${column.limit ?? "none"}`,
                actual: `counted ${column.rows.length}`,
                source: "board",
            });
        }
    }
    // ── column-missing: a configured column with no heading ────────────────────────────────────────
    const headingNames = new Set(board.columns.map((c) => c.name));
    for (const name of Object.keys(wipLimits)) {
        if (headingNames.has(name))
            continue;
        add(0, {
            kind: "column-missing",
            column: name,
            expected: spelled `a heading for the configured column ${name}`,
            actual: "no heading on the board opens that column",
            source: "config",
        });
    }
    // ── The total order ───────────────────────────────────────────────────────────────────────────
    //
    // Kind in declaration order, then ticket id, then column, then the line the conflict came from. A
    // golden whose order depends on a filesystem listing or on an object's key order is a golden that
    // fails on somebody else's machine for a reason nobody can act on.
    const rank = (k) => CONFLICT_KINDS.indexOf(k);
    const sorted = [...found].sort((a, b) => {
        const byKind = rank(a.conflict.kind) - rank(b.conflict.kind);
        if (byKind !== 0)
            return byKind;
        const byTicket = (a.conflict.ticketId ?? "").localeCompare(b.conflict.ticketId ?? "");
        if (byTicket !== 0)
            return byTicket;
        const byColumn = (a.conflict.column ?? "").localeCompare(b.conflict.column ?? "");
        if (byColumn !== 0)
            return byColumn;
        if (a.line !== b.line)
            return a.line - b.line;
        // Last resort, so two conflicts identical on every key above still order deterministically.
        return a.conflict.expected.localeCompare(b.conflict.expected);
    });
    return { snapshot, conflicts: sorted.map((s) => s.conflict) };
}

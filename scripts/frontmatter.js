// frontmatter.ts — the single authority for "what does this file's frontmatter SAY" (Phase 27 /
// SPAWN-04 + KIT-03).
//
// Two guards need one predicate: does a shipped adapter, skill or packaging template carry a spawn
// grant, and if so, to whom. Before this module they each answered it with the SAME PAIR of
// line-anchored regular expressions — one requiring the `tools:` key and the spawn token on one
// physical line, the other requiring a leading dash. Neither survives a valid YAML folded scalar:
//
//     tools: >-
//       Read, Grep, Glob, Edit, Write, Bash, Agent(grugops-installer, grugops-security-nfr)
//
// The key line carries only the fold indicator and the value arrives on an indented continuation
// line beginning with neither the key nor a dash. That bypass was REPRODUCED twice on hermetic
// mirrors of the live tree — once on a non-coordinator role adapter, once on a skill file — and both
// runs printed ALL CHECKS PASSED (27-REVIEW.md § CR-02). The platform reads the VALUE the YAML
// expresses; the guard read the bytes of one line. That asymmetry was the whole defect.
//
// So this module reconstructs the value. It reads the frontmatter block and returns each key mapped
// to its value with continuations, fold and literal indicators, quoting, flow sequences, block
// sequences and trailing comments all resolved into ONE string per occurrence. Wrapping, folding,
// quoting and sequence form therefore cannot change a verdict, because they do not change the value.
// One format-aware authority per predicate, and the duplicate grammar DELETED rather than taught an
// extra case — a weaker second opinion that still votes is worse than none.
//
// A PARSE FAILURE IS A PARSE ARTIFACT AND NEVER A VERDICT.
//
//   The failure arm of every result here exists so that a consumer cannot quietly turn "I could not
//   read this file" into "this file carries no grant". Those are different facts and only one of
//   them is safe to act on. A frontmatter block that opens and never closes, or whose content cannot
//   be read as key lines and continuations, returns `{ ok: false }` — and a consumer that folded
//   that arm into its no-grant branch, or downgraded it to a warning, would reintroduce EXACTLY the
//   class of silent bypass this module exists to close. Branch on it explicitly and report it by
//   name. A document with genuinely NO frontmatter block is the other thing entirely: that is a
//   legitimate state and it SUCCEEDS with no keys.
//
// THE GRANT TEST IS SCOPED TO THE TOOLS KEYS, IN BOTH DIRECTIONS. A grant is a frontmatter fact
// about one key: the platform grants the spawn capability because `tools:` / `allowed-tools:` names
// it. A spawn token appearing in a `description:` value, or in body prose, is therefore NOT a grant
// and must not fail the guard — that false positive would force a later author to delete correct
// documentation to go green. Equally, a token under a differently named key is not a grant and must
// not be smuggled in as one. Both directions are pinned by cases.
//
// THIS IS ALSO THE ONE FENCE AUTHORITY. `stripFencedBlocks` lives here and is imported by
// check-foundation-guards.ts, so the whole tree still has exactly one implementation of "which lines
// are inside a ``` block". Every consumer reads a fence-stripped body, which is what keeps an
// illustrative frontmatter example inside a fenced block from being read as a live marker or grant.
// No second fence parser is written, here or anywhere.
//
// DELIBERATELY NOT A YAML ENGINE, AND THE REFERENCE CONSTRUCTS ARE REFUSED BY NAME. Anchors,
// aliases and merge keys are not resolved. No shipped adapter or skill uses one, the generator
// cannot emit one, and resolving them would mean writing a second grammar with MORE surface rather
// than less. So `YAML_REF` (below) detects a reference sigil in a value position and returns the
// PARSE-FAILURE arm: the guard goes red and a human decides.
//
//   This paragraph previously claimed the refusal happened for free, on the theory that an anchor
//   line was "an unrecognized key shape". It was not. `KEY_LINE` matches `_t: &t Read, …, Agent(x)`
//   and `tools: *t` perfectly well, so the parse SUCCEEDED and the flattened value of `tools` was the
//   literal two-character string `*t`, which carries no spawn token — `{ ok: true, value: false }`,
//   the silent-no-grant arm this module exists to make impossible. Reproduced end-to-end on a
//   hermetic mirror with the plant on a skill adapter (the surface with no freshness gate and no role
//   corpus to cross-check) and the whole gate printed ALL CHECKS PASSED (27-REVIEW-GAPS § CR-01).
//   The refusal is now CODE, applied before the value is flattened, and it is pinned by a product in
//   the parser oracle and by an aggregator-level case.
//
// Node stdlib ONLY — in fact no imports at all. Zero npm dependencies.
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a build-safety surface).
// ---------------------------------------------------------------------------
// The one fence authority (RELOCATED VERBATIM from check-foundation-guards.ts, plan 27-12).
// ---------------------------------------------------------------------------
// Strip every line that sits INSIDE a ```-delimited code fence, returning only the lines OUTSIDE
// any fence. This is a GENERAL fence operation (distinct from stripCavemanBlock, which is scoped to
// the single `## Caveman prompt` section); it shares the SAME line-state toggle pattern (D-10: the
// fence anchor is not re-engineered). Packaging templates legitimately SHOW frontmatter inside
// ``` fences (e.g. a coordinator example carrying `coordinator: true` + `Agent(...)`); the WR-05
// guard must read those illustrative lines as documentation, never as a live marker/grant.
//
// Toggle: every line matching /^```/ flips the inside/outside state, then is itself dropped. Lines
// while inside are dropped; lines while outside are kept. FAIL-SAFE on an unterminated fence (the
// state is still "inside" at EOF): the tail was opened but never closed, so it is treated as
// inside-fence and never exposed — a malformed doc can never leak an unguarded live grant past the
// strip. (CR-01: a fenced documentation example must not be mis-read as a second live coordinator.)
//
// (Plan 27-12) Moved here from check-foundation-guards.ts unchanged, so the frontmatter parser gets
// a fence-safe input without a second implementation and every existing prose check in the guards
// keeps behaving byte-identically. The guards import it back.
export function stripFencedBlocks(text) {
    const out = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (/^```/.test(line)) {
            inside = !inside;
            continue; // the fence delimiter line is never emitted
        }
        if (inside)
            continue; // lines inside a fence are dropped (documentation, not live frontmatter)
        out.push(line);
    }
    // An unterminated fence leaves `inside` set at EOF. The tail was inside an opened-but-unclosed
    // fence and was already dropped above — fail-safe: we never emit it. Nothing more to do.
    return out.join("\n");
}
// ---------------------------------------------------------------------------
// Scalar helpers
// ---------------------------------------------------------------------------
// A top-level key line. The key charset excludes `:` and whitespace, so the FIRST colon terminates
// the key and a colon inside a quoted value (the `description:` lines every adapter ships) cannot be
// mistaken for a second key. A colon NOT followed by whitespace or end-of-line is deliberately not a
// key line: `tools:Read` is a plain scalar in YAML, not a mapping entry, so the platform would not
// see a `tools` key there either — and an unreadable line failing red is the safe direction.
const KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]+(.*))?[ \t]*$/;
// A block-scalar header: the literal `|` or folded `>` indicator, an optional indentation digit and
// an optional chomping `+`/`-` in either order, then optional trailing whitespace or a comment.
const BLOCK_INDICATOR = /^[|>][0-9]*[+-]?[ \t]*(?:#.*)?$|^[|>][+-]?[0-9]*[ \t]*(?:#.*)?$/;
// A block-sequence item on a continuation line: a dash, then either end-of-line or the item text.
const SEQ_ITEM = /^-(?:[ \t]+(.*))?$/;
// A YAML REFERENCE SIGIL AT A TOKEN START: an `&` (anchor) or `*` (alias) that begins a value, a
// flow-sequence item or a block-sequence item and is immediately followed by a name character.
//
// WHY REFUSE RATHER THAN RESOLVE. A reference means the value this document EXPRESSES is not the text
// these lines carry. There are only three things this module could do with one, and two of them are
// wrong: resolving it would be a second grammar with more surface (the thing this module exists to
// delete, not to grow), and reading `*t` as the plain two-character string `*t` is the silent
// no-grant arm — `{ ok: true, value: false }` on a document that grants the spawn tool. Refusing is
// the only honest reading: an unresolvable reference is a PARSE ARTIFACT, so it goes to the `ok:
// false` arm, the guard goes red and a human decides.
//
// WHY THE TOKEN-START ANCHOR. `^`, `,`, `[` and `{` are the STRUCTURAL positions where YAML would
// read a node, and a name character must follow immediately. Whitespace is deliberately NOT a
// token-start here, so ordinary prose keeps parsing: `R&D` in a description, a bare `*` between
// words, and markdown `*emphasis*` are all left alone. A guard that failed on correct documentation
// would teach the next author to delete the documentation.
//
// WHERE IT IS NOT APPLIED. Never inside a `|` or `>` block scalar. There YAML gives `&` and `*` no
// reference meaning at all — they are literal text, the platform reads them literally, and so must
// this module. Refusing there would be a false red on correct content.
//
// THE MERGE KEY NEEDS NO BRANCH. `<<: *x` never reaches here: `KEY_LINE` requires `[A-Za-z_]` at the
// key start, so `<` fails it and the line is already refused as unreadable. Do not add a second path
// for the merge key — it is pinned by a named case in scripts/frontmatter.test.ts.
const YAML_REF = /(?:^|[,[{])[ \t]*[&*][A-Za-z0-9_-]/;
// Drop a trailing unquoted comment. A `#` only starts a comment when it is outside quotes AND at the
// start or preceded by whitespace, so `Agent(a#b)` keeps its hash and `Read # note` loses the note.
// Quote state is tracked WITHIN one piece; a `#` inside a quoted value that wraps across lines can
// therefore truncate that piece early, which only ever makes a value SHORTER on that line while the
// following line's text still joins in — the error direction is a longer value, never a hidden token.
function stripComment(s) {
    let sq = false;
    let dq = false;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (dq && c === "\\") {
            i += 1; // an escaped character inside double quotes is never a delimiter
            continue;
        }
        if (c === '"' && !sq)
            dq = !dq;
        else if (c === "'" && !dq)
            sq = !sq;
        else if (c === "#" && !sq && !dq && (i === 0 || /[ \t]/.test(s[i - 1]))) {
            return s.slice(0, i);
        }
    }
    return s;
}
// Remove ONE matched pair of wrapping quotes and undo the quoting style's escapes. Only a pair that
// actually wraps the whole string is removed, so `Agent(a), "b"` is left alone.
function unquote(s) {
    if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
        return s.slice(1, -1).replace(/\\(.)/g, "$1");
    }
    if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
        return s.slice(1, -1).replace(/''/g, "'");
    }
    return s;
}
const indentOf = (line) => line.length - line.replace(/^[ \t]*/, "").length;
// A short, safe excerpt of an unreadable line for the failure reason. Long enough to identify the
// line, short enough that a finding stays one readable line.
const excerpt = (s) => (s.length > 60 ? `${s.slice(0, 57)}...` : s);
// Flatten one frontmatter block (the lines BETWEEN the delimiters) into key -> values.
//
// Continuation is decided by INDENTATION relative to the block's baseline: a line indented further
// than the baseline continues the current key, and a line at the baseline starts a new one. That is
// what makes every scalar form collapse to the same value — a folded scalar, a wrapped plain scalar,
// a quoted scalar that wraps and a block sequence differ only in how their continuation lines look.
//
// Joining rule: block scalars and wrapped plain scalars join with a SPACE (restoring the single line
// the author wrapped); block sequences join with `", "` (restoring the comma list the flow form
// would have written). Both therefore reproduce the single-line comma value byte-for-byte, which is
// what lets one token test serve every form.
function flattenBlock(block, baseIndent) {
    const keys = new Map();
    let cur = null;
    // The refusal for a YAML reference construct. Returned from three places — the key line, a
    // block-sequence item and a plain continuation line — so a reference is refused the same way
    // wherever it sits, and always BEFORE the text is flattened into a value.
    const refuseRef = (line) => ({
        ok: false,
        reason: `\`${excerpt(line)}\` uses a YAML anchor or alias; the value this document expresses is not the text on this line, and this module deliberately does not resolve a reference — it is refused rather than read as "carries no grant"`,
    });
    const flush = () => {
        if (cur === null)
            return;
        const joined = cur.block
            ? cur.parts.join(" ")
            : cur.seq
                ? cur.parts.join(", ")
                : cur.parts.join(" ");
        const value = unquote(joined.trim());
        const seen = keys.get(cur.key);
        if (seen === undefined)
            keys.set(cur.key, [value]);
        else
            seen.push(value);
        cur = null;
    };
    for (const raw of block) {
        if (raw.trim() === "")
            continue; // a blank line is a paragraph break, never a key boundary
        const indent = indentOf(raw);
        if (indent > baseIndent) {
            if (cur === null) {
                return {
                    ok: false,
                    reason: `indented content \`${excerpt(raw.trim())}\` appears before any frontmatter key`,
                };
            }
            const t = raw.trim();
            if (cur.block) {
                // Inside a literal/folded scalar every continuation line is content. A leading dash is part
                // of the text, not a sequence marker, and a `#` is literal — no comment stripping here.
                cur.parts.push(t);
                continue;
            }
            const item = t.match(SEQ_ITEM);
            if (item !== null) {
                // A block-sequence ITEM is its own node, so the token start is the text after the dash.
                const itemText = (item[1] ?? "").trim();
                if (YAML_REF.test(itemText))
                    return refuseRef(t);
                cur.seq = true;
                const v = unquote(stripComment(itemText).trim());
                if (v !== "")
                    cur.parts.push(v);
                continue;
            }
            if (YAML_REF.test(t))
                return refuseRef(t);
            cur.parts.push(stripComment(t).trim());
            continue;
        }
        // At the baseline: either a comment line, or a new key, or something unreadable.
        const t = raw.trim();
        if (t.startsWith("#"))
            continue;
        const kv = t.match(KEY_LINE);
        if (kv === null) {
            return {
                ok: false,
                reason: `cannot read \`${excerpt(t)}\` as a frontmatter key line or as a continuation of the previous key`,
            };
        }
        flush();
        const rest = (kv[2] ?? "").trim();
        // Refuse BEFORE flattening, and refuse on ANY key — an anchor parked under `_tools:` exists only
        // to be aliased from a real one, so the document as a whole is what becomes unreadable.
        if (YAML_REF.test(rest))
            return refuseRef(t);
        if (BLOCK_INDICATOR.test(rest)) {
            cur = { key: kv[1], parts: [], block: true, seq: false };
        }
        else {
            cur = { key: kv[1], parts: [], block: false, seq: false };
            const v = stripComment(rest).trim();
            if (v !== "")
                cur.parts.push(v);
        }
    }
    flush();
    return { ok: true, value: keys };
}
// Read a markdown document's frontmatter into key -> flattened values.
//
// The input is fence-stripped FIRST (one fence authority), so frontmatter shown inside a ``` block
// is documentation and contributes nothing. CRLF is normalized so a Windows checkout parses
// identically to a Unix one.
//
// Three outcomes, and the difference between the last two is the point of this module:
//   • a block that opens and closes  -> ok, with its keys;
//   • NO block at all                -> ok, with NO keys (a legitimate document, e.g. a body-only file);
//   • a block that opens and never closes, or whose content is unreadable -> NOT ok, with a reason.
export function parseFrontmatter(text) {
    const lines = stripFencedBlocks(text.replace(/\r\n/g, "\n")).split("\n");
    let i = 0;
    while (i < lines.length && lines[i].trim() === "")
        i++;
    if (i >= lines.length || lines[i].replace(/[ \t]+$/, "") !== "---") {
        return { ok: true, value: new Map() };
    }
    const openAt = i;
    let end = -1;
    for (let j = openAt + 1; j < lines.length; j++) {
        const t = lines[j].replace(/[ \t]+$/, "");
        if (t === "---" || t === "...") {
            end = j;
            break;
        }
    }
    if (end === -1) {
        return {
            ok: false,
            reason: `frontmatter block opened at line ${openAt + 1} of the fence-stripped body and is never closed by a \`---\` delimiter — an unterminated block is unreadable, NOT an absence of keys`,
        };
    }
    const block = lines.slice(openAt + 1, end);
    const firstContent = block.find((l) => l.trim() !== "");
    return flattenBlock(block, firstContent === undefined ? 0 : indentOf(firstContent));
}
// ---------------------------------------------------------------------------
// The predicates every consumer actually wants
// ---------------------------------------------------------------------------
// The keys that grant a tool. `tools` is the sub-agent form and `allowed-tools` the skill/command
// form; both are what the platform reads. This list is the ENTIRE scope of the grant test — see the
// header for why widening it to the whole document would be wrong in both directions.
export const TOOLS_KEYS = ["tools", "allowed-tools"];
// The spawn tool and its retained legacy alias, on a word boundary so a token is matched and a
// substring is not (`Agents`, `Taskmaster` are not grants).
const SPAWN_TOKEN = /\b(?:Agent|Task)\b/;
const SCOPED_GRANT = /\b(?:Agent|Task)\(([^)]*)\)/g;
// Every flattened value living under a tools key, across all occurrences of those keys.
function toolsValues(keys) {
    const out = [];
    for (const k of TOOLS_KEYS)
        out.push(...(keys.get(k) ?? []));
    return out;
}
// Does this parsed frontmatter grant the spawn tool?
export function keysHaveSpawnGrant(keys) {
    return toolsValues(keys).some((v) => SPAWN_TOKEN.test(v));
}
// The ENUMERATED names from a scoped grant:
//   `tools: Agent(grugops-qe-e2e, grugops-installer), Read` -> [grugops-installer, grugops-qe-e2e]
// De-duplicated and sorted, so two runs over the same tree produce byte-identical output. An
// UNSCOPED grant (`tools: Read, Agent`) enumerates nothing and returns [] — that is a real fact
// about the grant, and the KIT-03 oracle treats a zero-length closure as its own named failure.
export function keysGrantedAgentNames(keys) {
    const names = new Set();
    for (const v of toolsValues(keys)) {
        SCOPED_GRANT.lastIndex = 0;
        let m;
        while ((m = SCOPED_GRANT.exec(v)) !== null) {
            for (const raw of m[1].split(",")) {
                const n = unquote(raw.trim());
                if (n !== "")
                    names.add(n);
            }
        }
    }
    return [...names].sort();
}
// Does `key` carry `value` in any of its occurrences? This is how the `coordinator: true` marker is
// read, so the marker and the grant go through the SAME parser: a marker written as `coordinator:
// "true"` or as a folded scalar flattens to the same `true` and can neither demote the real
// coordinator nor promote a rogue file out of the must-not-spawn set.
export function keyHasValue(keys, key, value) {
    return (keys.get(key) ?? []).some((v) => v === value);
}
// Text-level convenience wrappers. They are thin — each parses once and delegates to the map-level
// predicate above, so there is still exactly ONE grammar. A consumer asking several questions about
// one file (the spawn-grant guard does) calls parseFrontmatter once and uses the map-level forms;
// these exist for call sites and tests that ask a single question.
export function hasSpawnGrant(text) {
    const p = parseFrontmatter(text);
    return p.ok ? { ok: true, value: keysHaveSpawnGrant(p.value) } : p;
}
export function grantedAgentNames(text) {
    const p = parseFrontmatter(text);
    return p.ok ? { ok: true, value: keysGrantedAgentNames(p.value) } : p;
}
export function frontmatterValueIs(text, key, value) {
    const p = parseFrontmatter(text);
    return p.ok ? { ok: true, value: keyHasValue(p.value, key, value) } : p;
}

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
// than less. So `YAML_REF` / `startsWithReference` (below) detect a reference sigil at a node start
// in a value position, and `flattenBlock` returns the PARSE-FAILURE arm for it — before the value is
// flattened, so the refusal cannot be dodged by moving the anchor. The guard goes red; a human decides.
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
//   AND IT CAME BACK ONCE MORE, WEARING A TAG (27-REVIEW-GAPS-2 § CR-01, round 2). The refusal above
//   tested for a SIGIL at position 0, and a YAML tag is a node PROPERTY that legally stands in front
//   of one: `_t: !!str &t … Agent(x)` / `allowed-tools: !!seq [*t]` parsed clean and returned
//   `{ ok: true, value: false }` — the silent no-grant arm again, on a document that grants the spawn
//   tool. Planted on a skill adapter (no freshness gate, no role corpus) the whole gate printed ALL
//   CHECKS PASSED, exit 0. The remedy is not a case for the reported spelling: `!` joins the sigil
//   class and ONE leading tag is stripped at every node start, so the tag axis is refused by the same
//   rule at every place the refusal is applied.
//
// AND A THIRD TIME, WEARING AN ESCAPE (27-REVIEW-GAPS-3 § CR-01, round 3 — plan 27-29, D-30).
// Rounds 1 and 2 widened the refusal across YAML NODE PROPERTIES (`&`, `*`, `!`) while this module's
// own string rewriter stayed wrong on an axis nobody enumerated. `unquote()` resolved a double-quoted
// scalar with `.replace(/\\(.)/g, "$1")` — delete the backslash, keep the next character — which is
// correct for `\"` and `\\` BY ACCIDENT and destroys every other escape YAML 1.2 § 5.7 defines. So
// `allowed-tools: ["\x41gent(grugops-orchestrator)"]`, which a compliant loader resolves to
// `Agent(grugops-orchestrator)`, flattened to `x41gent(grugops-orchestrator)`: no spawn token, and
// `{ ok: true, value: false }` — the silent no-grant SUCCESS arm, a third time in one phase. Measured
// against the committed parser before this edit and planted on a skill adapter in a hermetic mirror,
// the whole gate printed ALL CHECKS PASSED at exit 0.
//
//   Note precisely what that was: NOT "the module left a quoted literal alone", which the arguments
//   above correctly call safe. The module ACTIVELY REWROTE the string and got the rewrite wrong.
//   There is no reading of YAML under which `"\x41gent(x)"` means `x41gent(x)`, so the guard returned
//   a verdict over input it did not understand — this module's own definition of a parse artifact.
//
//   THE REMEDY INVERTS THE DECISION RATHER THAN ENUMERATING ONE MORE BAD SPELLING (D-30). A fourth
//   refusal pattern matching `\xNN` / `\uNNNN` / `\UNNNNNNNN` would close the REPORTED spelling and
//   leave `\n`, `\t`, `\e`, `\N`, `\_`, `\L`, `\P` and a dangling `\` at end-of-scalar still producing
//   values no loader computes — round 5, already written. So `DQ_ESCAPE_ALLOWLIST` names the THREE
//   escapes this module resolves, `resolveDoubleQuoted` walks the body and refuses BY NAME on any
//   other backslash sequence, and a spelling nobody enumerated therefore refuses BY DEFAULT. The
//   allowlist is the mechanism; the refusals are its complement, not a list that has to grow. An
//   exhaustive sweep over every printable ASCII character in the escape position pins that default in
//   both directions, so the property under test is "refusal is the default", not "these rows refuse".
//
//   WHERE IT IS NOT APPLIED, AND WHY THAT IS THE PRIMARY FALSE-RED CONTROL. Never inside a
//   SINGLE-quoted scalar: in YAML a backslash there is a literal backslash and the only escape is
//   `''`. Refusing there would fail red on correct content, which is the failure mode every widened
//   refusal risks. Never on a plain (unquoted) scalar either, for the same reason. The single-quoted
//   branch of `unquoteChecked` is byte-unchanged from the pre-D-30 helper, deliberately.
//
//   THE MULTI-LINE DOUBLE-QUOTED SCALAR HAS A DECIDED ANSWER, NOT AN ACCIDENTAL ONE (D-33). The
//   unquote runs on the JOINED value, after continuation lines have been space-joined, so YAML's
//   line-folding rules meet this module's join. Both halves are decided and both carry a case:
//     • PLAIN FOLDING keeps the space join, which is what YAML folding computes for the ordinary
//       case — `tools: "Read,` / `  Agent(x)"` resolves to `Read, Agent(x)`.
//     • A YAML BACKSLASH LINE-CONTINUATION (a line ending in `\`) survives the join as a
//       backslash-followed-by-space sequence, which is not on the allowlist and therefore REFUSES.
//       That is the honest outcome: this module does not implement escaped line breaks, so a document
//       using one expresses a value it cannot compute — the same argument made three times above.
//
// AND THE SAME SILENT-SUCCESS SHAPE ONE LEVEL UP: A YAML DIRECTIVE PROLOGUE (27-REVIEW-GAPS-3 § IN-02
// — plan 27-30, D-34). Everything above is about a value inside the block. This one is about whether
// there IS a block. `parseFrontmatter` requires the first non-blank line to be exactly `---`, so a
// document opening with a legal YAML directive —
//
//     %TAG !e! tag:x,2000:
//     ---
//     name: x
//     tools: Read, Agent(o)
//     ---
//
// — took the "NO block at all" arm and returned `{ ok: true, value: new Map() }`: no keys, no grant,
// no finding, and a result BYTE-IDENTICAL to a body-only file. Measured against the committed parser
// before this edit: `{"ok":true,"value":false}`, on a document whose `tools` value is plainly a grant.
// That is the module's own founding failure — "I could not read this" printed as "this carries no
// grant" — reached this time by prepending one line rather than by editing a value.
//
//   `UNKNOWN - verify` (carried forward from the reviewer VERBATIM IN SUBSTANCE, not erased): most
//   markdown frontmatter readers also require `---` on line 1, so the platform probably sees no
//   frontmatter either and such a file is most likely INERT rather than rogue. That was not confirmed
//   against Claude Code. The refusal below is therefore taken because THIS MODULE'S OWN CONTRACT puts
//   an undecodable prologue in the unreadable arm — a document that declares a YAML processing
//   context this module does not implement is not a document this module may report a value over. It
//   is NOT taken because a live bypass was reproduced, and it must not be described as one.
//
//   THE TEST IS POSITIONAL AND TAKES NO LOOKAHEAD, deliberately. Requiring the next line to be the
//   opening delimiter would close the reported one-directive spelling and leave the two-directive
//   prologue YAML equally permits (`%YAML 1.2` then `%TAG …` then `---`) still landing in the keyless
//   success arm — the enumerate-the-bad shape D-30 already declined once in this module. A directive
//   at the document start is refused on sight; what follows it is not consulted.
//
//   WHERE IT IS NOT APPLIED, AND WHY THAT IS THE FALSE-RED CONTROL. The line must begin at COLUMN 0,
//   because YAML gives `%` directive meaning nowhere else — an indented `%` is ordinary text and falls
//   through to the delimiter test unchanged. A directive line anywhere OTHER than the document start
//   gets no new case either: inside the block it already fails `KEY_LINE` with its own reason (one
//   input, one reason — a second reason for the same input is the duplicate grammar this module
//   exists to delete), and in the BODY it is never read at all. All three positions carry a case.
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
// (D-34) A YAML DIRECTIVE LINE AT THE DOCUMENT START: the `%` indicator at COLUMN 0 followed by at
// least one non-space character (YAML 1.2 § 6.8 — `%` then a directive name of one or more `ns-char`).
//
// Anchored at column 0 with no allowance for leading whitespace, because that is where YAML gives `%`
// its directive meaning and nowhere else. An indented `%` is ordinary text; it is not matched here and
// falls through to the delimiter test exactly as before. That narrowness is the false-red control on
// this whole refusal — see the header for the reproduction, the `UNKNOWN - verify` the reviewer
// attached to it, and why the test takes no lookahead at what follows the directive.
const YAML_DIRECTIVE = /^%\S/;
// A YAML REFERENCE SIGIL AT A TOKEN START: an `&` (anchor) or `*` (alias) that BEGINS a node and is
// immediately followed by a name character. Anchored with `^` on purpose — see `startsWithReference`
// for how the three token starts (a value, a flow item, a sequence item) are each reduced to a string
// whose position 0 is that node's start, so this one pattern serves all of them.
//
// THE NAME CHARSET IS YAML'S, NOT `\w`. YAML 1.2 defines an anchor name as one or more
// `ns-anchor-char`, which is `ns-char` MINUS the flow indicators — i.e. ANY non-space character that
// is not `,`, `[`, `]`, `{` or `}`. So `&.t`, `&@t`, `&a/b` and `&ét` are all legal anchor names.
// A first draft of this constant used `[A-Za-z0-9_-]` and a self red-team immediately walked through
// it: `_t: &.t <grant>` / `tools: *.t` parsed clean and returned the no-grant SUCCESS arm — the very
// bypass being closed, in a new spelling. The charset below is YAML's own, so there is no "name that
// YAML accepts and this test does not".
//
// AND A PLAIN SCALAR CANNOT BEGIN WITH `&` OR `*` ANYWAY. Both are YAML indicator characters; an
// unquoted value starting with one is either a reference or invalid YAML. That is why refusing on
// sight at position 0 is not an over-broad reading — there is no legitimate plain scalar it can
// swallow. A value that genuinely starts with those bytes must be quoted, and a quoted value is a
// literal string that this test correctly leaves alone (`tools: "*t"` parses and grants nothing).
//
// WHY REFUSE RATHER THAN RESOLVE. A reference means the value this document EXPRESSES is not the text
// these lines carry. There are only three things this module could do with one, and two of them are
// wrong: resolving it would be a second grammar with more surface (the thing this module exists to
// delete, not to grow), and reading `*t` as the plain two-character string `*t` is the silent
// no-grant arm — `{ ok: true, value: false }` on a document that grants the spawn tool. Refusing is
// the only honest reading: an unresolvable reference is a PARSE ARTIFACT, so it goes to the `ok:
// false` arm, the guard goes red and a human decides.
//
// WHERE IT IS NOT APPLIED. Never inside a `|` or `>` block scalar. There YAML gives `&` and `*` no
// reference meaning at all — they are literal text, the platform reads them literally, and so must
// this module. Refusing there would be a false red on correct content.
//
// THE MERGE KEY NEEDS NO BRANCH. `<<: *x` never reaches here: `KEY_LINE` requires `[A-Za-z_]` at the
// key start, so `<` fails it and the line is already refused as unreadable. Do not add a second path
// for the merge key — it is pinned by a named case in scripts/frontmatter.test.ts.
//
// `!` JOINS `&` AND `*` (27-REVIEW-GAPS-2 § CR-01, round 2). This is the SAME fail-open this
// milestone already closed once, returning in a new spelling. The round-1 refusal tested for a sigil
// at position 0 of a node — but a YAML TAG is a legal node PROPERTY that may stand in front of an
// anchor or in front of a collection, so `_t: !!str &t … Agent(x)` / `allowed-tools: !!seq [*t]`
// walked straight past it and landed in the silent no-grant SUCCESS arm. Measured against the
// committed parser before this edit: `{"ok":true,"value":false}` and `{"ok":true,"value":[]}` — the
// module header's own named failure, reached by adding two characters. Planted on a skill adapter the
// whole gate printed ALL CHECKS PASSED, exit 0.
//
// THE TAG ARGUMENT IS THE ANCHOR/ALIAS ARGUMENT, IN THREE PARTS, UNCHANGED:
//   1. A tag is a node property this module does not resolve, exactly as it does not resolve an
//      anchor or an alias. An unresolved node property means the value this document EXPRESSES is
//      not the text these lines carry — the same fact that makes a reference unreadable here.
//   2. A plain scalar cannot begin with `!` any more than it can begin with `&` or `*`. All three
//      are YAML indicator characters, so refusing on sight at a node start swallows no legitimate
//      plain scalar.
//   3. A value that genuinely begins with those bytes must be QUOTED, and a quoted value is a
//      literal string this test correctly leaves alone (`tools: "!!str"` parses and grants nothing).
//      A `!` arriving MID-value is untouched too, because this pattern is `^`-anchored.
const YAML_REF = /^[&*!][^\s,[\]{}]/;
// ONE leading tag at a node start: the `!` indicator, then either a verbatim `<…>` tag or the tag's
// run of non-space, non-flow characters (which covers `!!seq`'s second indicator and a named handle's
// `!handle!suffix` form), then the separation — whitespace, or none at all when the tag butts
// directly against the `[`/`{` it introduces.
//
// EXACTLY ONE, NEVER MORE. YAML permits one tag per node, so a second token stripped from the same
// node would be CONTENT, and stripping content would be this module resolving a document it
// deliberately does not resolve. It is applied once per node start instead — the value, each flow
// fragment, each flow-mapping value — so nesting is covered by re-entering at the nested node's own
// start rather than by stripping twice at one.
const LEADING_TAG = /^!(?:<[^>]*>|[^\s[\]{},]*)(?:\s+|(?=[[{]))/;
const stripLeadingTag = (s) => s.replace(LEADING_TAG, "");
// Does this value-position text BEGIN with a YAML reference, at its own start or at the start of any
// node nested inside it?
//
// WHY THIS IS NOT ONE LOOSER REGEX. The obvious shortcut is to treat any `,`-preceded sigil as a
// token start, and it is wrong: `description: Reads, *writes* nothing` would then fail red, and a
// guard that fails on correct documentation teaches the next author to delete the documentation.
// A comma only introduces a node INSIDE a flow collection, so the split below happens only when the
// value actually opens with `[` or `{`. Everywhere else the sigil must be at position 0. That is what
// keeps `R&D` in a description, a bare `*` between words and markdown `*emphasis*` parsing.
//
// THE SPLIT IS ON EVERY FLOW DELIMITER, NOT JUST THE COMMA. `,`, `[` and `{` each introduce a node,
// so all three are separators. A self red-team walked through the comma-only version with
// `tools: [[*t]]` — the alias sits at the start of a NESTED sequence, so no comma precedes it, and the
// document parsed clean into the no-grant SUCCESS arm. Splitting on all three closes the nesting at
// any depth without tracking depth, because only each fragment's START is tested.
//
// The split is deliberately naive about quoting: splitting `["Agent(a, b)"]` at its delimiters yields
// fragments that begin with neither sigil, so a quoted item can only ever produce MORE fragments to
// check, never fewer. The error direction is a redundant check, never a missed one.
//
// THE TAG IS STRIPPED BEFORE THE COLLECTION TEST, NOT SPECIAL-CASED ON ONE SERIALIZER (CR-01,
// round 2). A tag standing in front of a collection means the value no longer OPENS with `[` or `{`,
// so without the strip `!!seq [*t]` never reaches the fragment split and the alias inside it is never
// tested at its own start. The strip is therefore applied at every node start this function knows
// about — the value itself, each flow fragment, and each flow-mapping value — which is what makes the
// refusal a property of "what is a node start" rather than a patch for the reported spelling. A bare
// non-specific tag (`! [*t]`, `![*t]`) is exactly the shape `YAML_REF` alone cannot see, because its
// second character is a space or a flow indicator.
function startsWithReference(text) {
    const t = text.trim();
    if (YAML_REF.test(t))
        return true;
    const afterTag = stripLeadingTag(t);
    // A tag may introduce an anchor rather than a collection (`!!str &t …`), so re-test the node start
    // once the node's property has been removed from in front of it.
    if (YAML_REF.test(afterTag))
        return true;
    if (!/^[[{]/.test(afterTag))
        return false;
    for (const fragment of afterTag.split(/[,[{]/)) {
        const node = stripLeadingTag(fragment.trim());
        if (YAML_REF.test(node))
            return true;
        // A flow MAPPING entry is `key: value`, so the value after the separator is its own node start.
        const sep = node.indexOf(": ");
        if (sep !== -1 && YAML_REF.test(stripLeadingTag(node.slice(sep + 2).trim()))) {
            return true;
        }
    }
    return false;
}
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
// ---------------------------------------------------------------------------
// The double-quoted ESCAPE ALLOWLIST (D-30 — 27-REVIEW-GAPS-3 § CR-01, round 3)
// ---------------------------------------------------------------------------
// The ONLY backslash sequences this module resolves inside a double-quoted scalar, keyed by the
// character that FOLLOWS the backslash and valued by the single character it resolves to.
//
// EXACTLY THREE MEMBERS, AND THE COUNT IS ASSERTED BY A CASE. A member silently added or dropped
// fails that count rather than only some comparison — the derive-the-set-assert-the-count rule this
// repository adopted after the spawn-adapter drift, applied to the smallest set in the module.
//
// WHY THESE THREE AND NOTHING ELSE. Each is a pure BYTE SUBSTITUTION over ASCII that this module can
// perform faithfully with no decoding, no code-point arithmetic and no Unicode question: `\"` is a
// quote, `\\` is one backslash, `\/` is a forward slash. None of the three can INTRODUCE a spawn
// token that the bytes do not already spell, and none can HIDE one. Every other escape YAML defines
// either decodes a code point (`\xNN`, `\uNNNN`, `\UNNNNNNNN`) or names a control character
// (`\n`, `\t`, `\0`, `\e`, `\N`, `\_`, `\L`, `\P`, `\a`, `\b`, `\v`, `\f`, `\r`) — resolving those
// would be this module decoding a document it deliberately does not decode, and DELETING the
// backslash (what the pre-D-30 `\\(.)` rewrite did) produces a string no loader computes and lands in
// the silent no-grant SUCCESS arm. So they are refused, exactly like an anchor, an alias or a tag.
//
// ENCODING IS DECIDED HERE TOO, AND THE DECISION IS "NO DECODING AT ALL". The substitution is over
// three ASCII spellings, byte for byte. Because no code-point escape is ever resolved, no Unicode
// normalization form and no grapheme-cluster boundary can change a verdict this module returns.
export const DQ_ESCAPE_ALLOWLIST = new Map([
    ['"', '"'],
    ["\\", "\\"],
    ["/", "/"],
]);
// Resolve the BODY of a double-quoted scalar (the text between the wrapping quotes) against the
// allowlist. One linear left-to-right pass, no backtracking, no regex: on a backslash it resolves the
// two-character sequence when the following character is on `DQ_ESCAPE_ALLOWLIST` and REFUSES
// otherwise. A backslash that is the LAST character of the body is a dangling escape and is refused
// on the same rule — it is not on the allowlist because there is nothing after it to be on it.
//
// There is deliberately NO fallback branch. A fallback that passed an unknown sequence through, or
// stripped its backslash, would be the enumerate-the-bad shape returning under a new name: the
// default outcome must be refusal, or the next unenumerated spelling is round five.
function resolveDoubleQuoted(body) {
    let out = "";
    for (let i = 0; i < body.length; i++) {
        const c = body[i];
        if (c !== "\\") {
            out += c;
            continue;
        }
        if (i + 1 >= body.length)
            return { ok: false, escape: "\\" };
        const next = body[i + 1];
        const resolved = DQ_ESCAPE_ALLOWLIST.get(next);
        if (resolved === undefined)
            return { ok: false, escape: `\\${next}` };
        out += resolved;
        i += 1; // the escaped character is consumed, never re-examined as a backslash of its own
    }
    return { ok: true, value: out };
}
// The SAME allowlist decision, for a value that is NOT one wholly-quoted scalar.
//
// WHY THIS EXISTS, AND WHY IT IS NOT A SECOND GRAMMAR. `unquoteChecked` only removes a quote pair that
// wraps the WHOLE string, so a flow sequence (`[Read, "…"]`) and a wrapped plain value whose
// continuation line is quoted (`Read,` / `  "…"`) never reach `resolveDoubleQuoted` — and the first
// draft of the D-30 fix therefore still returned `{ ok: true, value: false }` for
// `allowed-tools: [Read, "\x41gent(grugops-orchestrator)"]`. That is the SAME fail-open at two of the
// five application points, which is why the escape decision is applied at every point rather than at
// the one the review reported. Caught by writing the application-point rows of the refused-forms
// table before believing the fix (plan 27-29, task 2).
//
// It VALIDATES and does not resolve. This module does not decode a partially-quoted composite value —
// that would be the second grammar it exists to delete — but it must not return a value it cannot
// vouch for either. So an embedded double-quoted region is walked, a non-allowlisted backslash inside
// one is REFUSED BY NAME, and the string is otherwise returned byte-unchanged. Leaving the three
// allowlisted escapes unresolved cannot change a grant verdict: each resolves to a NON-WORD character
// (`"`, `\`, `/`), so it can neither create nor destroy a `\bAgent\b` / `\bTask\b` token boundary.
//
// A backslash OUTSIDE a double-quoted region is literal text in YAML — in a plain scalar and inside
// single quotes alike — so it is untouched here. That is the same false-red discipline the
// single-quoted branch below carries, and it is swept exhaustively by the parser oracle.
//
// The quote-state walk is the SAME line-state pattern `stripComment` already uses (D-10: the existing
// anchor is not re-engineered), so there is one way this module decides "am I inside quotes".
function scanEmbeddedDoubleQuoted(s) {
    let sq = false;
    let dq = false;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (dq && c === "\\") {
            if (i + 1 >= s.length)
                return { ok: false, escape: "\\" };
            const next = s[i + 1];
            if (!DQ_ESCAPE_ALLOWLIST.has(next)) {
                return { ok: false, escape: `\\${next}` };
            }
            i += 1; // an allowlisted escape is consumed whole; its second character never toggles a quote
            continue;
        }
        if (c === '"' && !sq)
            dq = !dq;
        else if (c === "'" && !dq)
            sq = !sq;
    }
    return { ok: true, value: s };
}
// Remove ONE matched pair of wrapping quotes and undo the quoting style's escapes. Only a pair that
// actually wraps the whole string is removed, so `Agent(a), "b"` is left alone.
//
// (D-30) Returns a RESULT rather than a string, because the double-quoted branch can now refuse and a
// string-returning helper has nowhere honest to put that. Every call site is routed through here —
// the flush join, the block-sequence item and the scoped-grant name split (D-32) — so there is one
// escape decision in the module and it is enforced everywhere a quoted scalar is read.
//
// THE SINGLE-QUOTED BRANCH IS BYTE-UNCHANGED and must stay that way. In YAML a backslash inside single
// quotes is a literal backslash and the only escape is the doubled `''`; refusing there would be a
// false red on correct content. It is the primary control on this whole change.
function unquoteChecked(s) {
    if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
        return resolveDoubleQuoted(s.slice(1, -1));
    }
    if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
        return { ok: true, value: s.slice(1, -1).replace(/''/g, "'") };
    }
    // Not one wholly-quoted scalar: a flow collection, a composite, or a plain value. Nothing is
    // unquoted here, but any double-quoted region INSIDE it answers to the same allowlist.
    return scanEmbeddedDoubleQuoted(s);
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
    //
    // (CR-01, round 2) The reason also names an UNRESOLVED TAG, because a tag is now refused by the
    // same rule. The substring `anchor or alias` is deliberately kept verbatim: two shipped assertions
    // match the reason on it (scripts/frontmatter.test.ts and scripts/check-foundation-guards.test.ts),
    // so dropping it would silently weaken both while every case stayed green.
    const refuseRef = (line) => ({
        ok: false,
        reason: `\`${excerpt(line)}\` uses a YAML anchor or alias, or an unresolved YAML tag standing in front of one; the value this document expresses is not the text on this line, and this module deliberately does not resolve a reference or a node property — it is refused rather than read as "carries no grant"`,
    });
    // (D-30) The refusal for a backslash sequence outside `DQ_ESCAPE_ALLOWLIST`, beside `refuseRef`
    // and built to the same contract. It names (a) the offending sequence verbatim, (b) an excerpt of
    // the offending line, and (c) keeps the substring `anchor or alias` in its closing clause — two
    // shipped assertions match a refusal reason on that substring, and an escape refusal that dropped
    // it would silently weaken both while every case stayed green.
    const refuseEscape = (line, escape) => ({
        ok: false,
        reason: `\`${excerpt(line)}\` carries the backslash sequence \`${escape}\` inside a double-quoted scalar, and that sequence is not one of the three escapes this module resolves; the value this document expresses is not the text these bytes spell, so it is refused on the same argument as an anchor or alias — never read as "carries no grant"`,
    });
    // Returns a REFUSAL to propagate, or null when there was nothing to report. `flush` used to return
    // nothing; the checked unquote can now fail, and a failure swallowed here would be the silent
    // no-grant arm one level down.
    const flush = () => {
        if (cur === null)
            return null;
        const joined = cur.block
            ? cur.parts.join(" ")
            : cur.seq
                ? cur.parts.join(", ")
                : cur.parts.join(" ");
        const trimmed = joined.trim();
        const resolved = unquoteChecked(trimmed);
        if (!resolved.ok) {
            return refuseEscape(`${cur.key}: ${trimmed}`, resolved.escape);
        }
        const seen = keys.get(cur.key);
        if (seen === undefined)
            keys.set(cur.key, [resolved.value]);
        else
            seen.push(resolved.value);
        cur = null;
        return null;
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
                if (startsWithReference(itemText))
                    return refuseRef(t);
                cur.seq = true;
                // (D-30) The escape refusal fires HERE, at the same node-start point the reference refusal
                // already fires from, and returns directly rather than being deferred to the flush.
                const resolved = unquoteChecked(stripComment(itemText).trim());
                if (!resolved.ok)
                    return refuseEscape(t, resolved.escape);
                const v = resolved.value;
                if (v !== "")
                    cur.parts.push(v);
                continue;
            }
            if (startsWithReference(t))
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
        const flushed = flush();
        if (flushed !== null)
            return flushed;
        const rest = (kv[2] ?? "").trim();
        // Refuse BEFORE flattening, and refuse on ANY key — an anchor parked under `_tools:` exists only
        // to be aliased from a real one, so the document as a whole is what becomes unreadable.
        if (startsWithReference(rest))
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
    const flushed = flush();
    if (flushed !== null)
        return flushed;
    return { ok: true, value: keys };
}
// ---------------------------------------------------------------------------
// THE DELIMITER REGION — ONE DECLARED LEGAL SPELLING, AND EVERYTHING ELSE REFUSED
// (D-39 + D-43 — 27-REVIEW-GAPS-4 § CR-01, round 4)
// ---------------------------------------------------------------------------
//
// This is the FOURTH spelling of this module's founding failure — "I could not read this" printed as
// "this carries no grant" — and the first three sit in the header above. This one is on the DELIMITER
// axis. `parseFrontmatter` tested `lines[i].replace(/[ \t]+$/, "") !== "---"` and routed the entire
// COMPLEMENT of that test into `{ ok: true, value: new Map() }`, a result byte-identical to a
// body-only file. `flattenBlock` refuses on every one of ITS complements; this region was the last
// silent-success arm in the module.
//
// Measured against the committed parser before this edit, every row below carrying a live
// `Agent(grugops-orchestrator)` grant returned `{ ok: true, value: false }` — the silent no-grant arm:
// `---` + U+FE0F, `---` + U+0301, `---` + U+0378 (unassigned), `---` + U+E000 (private use),
// `----`, `--- foo`, `---` + U+E0020, `---` + U+200B, a leading space and a leading byte-order mark.
// Planted as a byte-order-mark-prefixed rogue grant on `.claude/skills/grugops-map/SKILL.md` in a
// hermetic mirror, the whole foundation gate printed ALL CHECKS PASSED at exit 0.
//
// TWO PRIOR FORMULATIONS OF THIS FIX WERE BOTH DENYLISTS THAT SAID THEY WERE NOT. Read this before
// touching the predicates below, because the trap is not obvious and it cost two rounds:
//
//   • D-39 point 3 wrote the near-miss test as `line.trim() === "---"`. That enumerates the ILLEGAL
//     set, through `trim()`'s WhiteSpace alphabet. Swept, it missed 458 of 506 positions.
//   • D-42 widened the alphabet to `[\s\p{Cf}\p{Cc}]`. That enumerates the illegal set too, through a
//     wider general category. Measured, it left `----`, `--- foo`, a combining acute, a variation
//     selector, an unassigned code point and a private-use code point as LIVE SILENT SUCCESSES
//     carrying a real spawn grant.
//
//   Both stated D-30's allowlist polarity in their own prose and implemented the opposite. Before
//   accepting any predicate here as "derived" or "inverted", ask WHICH SET IT ENUMERATES. If it names
//   what is illegal it is a denylist however principled its alphabet looks.
//
// D-43 states the LEGAL set instead, and it is finite:
//
//     payload        = "---" at the opening position; "---" or "..." at the closing position
//     declared class = [ \t] — the ONE class, and the ONLY thing permitted after the payload
//     LEGAL          = the line begins with the payload AND everything after it is in that class
//     refusal arm 1  = the line begins with the payload and is NOT legal -> refuse, whatever follows
//     refusal arm 2  = leading residue that is entirely invisible, then a LEGAL delimiter -> refuse
//     everything else = not a delimiter at all -> the keyless SUCCESS arm, untouched
//
// FALSE-RED COST, MEASURED: zero. All 26 files on the spawn-grant scan surface open with a byte-exact
// `---` on line 1 and no line inside any of their frontmatter blocks refuses; across all 1115 tracked
// markdown files in the repository the count of head lines that would refuse is also 0. The strict
// rule costs this repository nothing, which is what makes the allowlist affordable.
//
// (D-39 point 4 / D-34) THE KEYLESS SUCCESS ARM IS NEVER WIDENED. A document that does not begin with
// the payload at all — a body-only file, an empty file, a file of blank lines — still succeeds with no
// keys. Turning one of those red would trade a silent success for a FALSE red, which D-34 already
// recorded as the worse of the two.
// The payload at each delimiter position. Declared here as data so both positions consult the same
// tokens in the same order, which is what makes the reported refusal deterministic for a given input.
const OPEN_PAYLOADS = ["---"];
const CLOSE_PAYLOADS = ["---", "..."];
// THE DECLARED WHITESPACE CLASS, DECLARED EXACTLY ONCE. Space and tab, matching what both delimiter
// positions already accepted before this change — the class is NOT loosened to make a case pass, and
// the trailing-space and trailing-tab controls are the only accepted non-byte-exact spellings.
// Both positions reach it through `allDeclaredWs` / `firstOutsideDeclaredWs` below; neither carries an
// inline whitespace expression of its own any more.
const DELIMITER_WS_CHAR = /[ \t]/;
// ARM 2's class, and ONLY arm 2's. Stated POSITIVELY: a character that renders a visible glyph of its
// own is a letter, a number, a punctuation mark or a symbol. Residue containing none of those is
// invisible residue.
//
// DELIBERATELY NOT UNICODE'S OWN TERM `graphic`, which is {L, M, N, P, S, Zs} and therefore INCLUDES
// COMBINING MARKS. An implementation reaching for that definition treats a leading U+0301 as a visible
// glyph and fails to refuse it — one of the exact rows D-42 shipped green. The complement of
// {L, N, P, S} is what puts marks, unassigned, private-use, surrogate, format and separator code
// points all on the invisible side.
//
// This class NEVER decides whether a TRAILING byte is acceptable. That inversion is what D-42 got
// backwards; arm 1 below consults no class at all.
const VISIBLE_GLYPH = /[\p{L}\p{N}\p{P}\p{S}]/u;
const allDeclaredWs = (residue) => [...residue].every((c) => DELIMITER_WS_CHAR.test(c));
// The index of the first code point of `residue` outside the declared class, or -1. Used only to NAME
// the offending code point in a refusal reason — never to decide the refusal.
function firstOutsideDeclaredWs(residue) {
    let at = 0;
    for (const c of residue) {
        if (!DELIMITER_WS_CHAR.test(c))
            return at;
        at += c.length;
    }
    return -1;
}
// THE ONE LEGAL SPELLING. Every delimiter decision in this module goes through this function: the
// opening test, the closing scan and both refusal arms. There is no second grammar left in this
// region for a fifth spelling to slip between.
function isLegalDelimiter(line, payload) {
    return line.startsWith(payload) && allDeclaredWs(line.slice(payload.length));
}
// The length of the leading run of code points that render no glyph of their own, in code UNITS so the
// result can index the string directly. Zero for a line that starts with a visible character.
function leadingInvisibleRun(line) {
    let n = 0;
    for (const c of line) {
        if (VISIBLE_GLYPH.test(c))
            break;
        n += c.length;
    }
    return n;
}
// `U+` followed by four or more uppercase hexadecimal digits.
const codePointLabel = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
// The delimiter refusal, or null when this line is not a delimiter at all.
//
// ARM 1 CONSULTS NO CHARACTER CLASS. It is `line.startsWith(payload) && !isLegalDelimiter(...)` —
// "begins with the payload and is not legal", full stop. It does not ask what the offending byte IS,
// only that the line is not the one legal spelling. The class appears afterwards solely to NAME the
// first offending code point in the message, and a message cannot change a verdict. This is the whole
// lesson of D-39 and D-42: a predicate that names what is illegal is a denylist however principled its
// alphabet looks, and each of those two shipped a live silent-success class while claiming the
// opposite polarity in its own text. Do not add a class here to "tighten" it.
//
// ARM 2 is the only place the invisible class is consulted, and it describes LEADING residue standing
// in front of an otherwise legal delimiter — a mark-prefixed or space-prefixed delimiter refuses here
// rather than falling through to the keyless success arm.
//
// The payloads are tried in declared order and the FIRST offending position wins, so two runs over one
// tree produce byte-identical findings.
function delimiterRefusal(line, payloads, position) {
    for (const payload of payloads) {
        if (line.startsWith(payload) && !isLegalDelimiter(line, payload)) {
            const residue = line.slice(payload.length);
            const at = firstOutsideDeclaredWs(residue);
            const cp = residue.codePointAt(at) ?? 0;
            return {
                ok: false,
                reason: `the ${position} delimiter position carries \`${excerpt(line)}\`, which begins with the \`${payload}\` payload and then continues: the first code point after the payload, ${codePointLabel(cp)}, is outside the one whitespace class a delimiter may carry. A delimiter is the payload and nothing but space or tab after it, so this line is refused as unreadable rather than read as an absence of keys — never read as "carries no grant"`,
            };
        }
    }
    const run = leadingInvisibleRun(line);
    if (run === 0)
        return null;
    for (const payload of payloads) {
        if (isLegalDelimiter(line.slice(run), payload)) {
            const cp = line.codePointAt(0) ?? 0;
            return {
                ok: false,
                reason: `the ${position} delimiter position carries \`${excerpt(line)}\`, whose leading residue renders no glyph of its own — it begins with ${codePointLabel(cp)} — and stands in front of an otherwise legal \`${payload}\` delimiter. A delimiter begins where the line begins, so this line is refused as unreadable rather than read as an absence of keys — never read as "carries no grant"`,
            };
        }
    }
    return null;
}
// Read a markdown document's frontmatter into key -> flattened values.
//
// The input is fence-stripped FIRST (one fence authority), so frontmatter shown inside a ``` block
// is documentation and contributes nothing. CRLF is normalized so a Windows checkout parses
// identically to a Unix one.
//
// (D-39 point 1) ONE NORMALIZATION POINT, AND IT REMOVES EXACTLY ONE BYTE. A single leading byte-order
// mark is removed in the SAME expression that normalizes CRLF, at position zero, once. It is the ONLY
// byte this module removes. A SECOND leading mark is deliberately NOT stripped: it falls to the arm-2
// refusal below, because "strip every mark" would be a decode this module does not perform, and this
// module's whole contract is that it does not decode. No second normalization is ever added here.
//
// Three outcomes, and the difference between the last two is the point of this module:
//   • a block that opens and closes  -> ok, with its keys;
//   • NO block at all AND NO DIRECTIVE PROLOGUE -> ok, with NO keys (a legitimate document, e.g. a
//     body-only file);
//   • a block that opens and never closes, whose content is unreadable, OR a document opening with a
//     YAML directive line, OR a line at either DELIMITER POSITION that begins with the payload
//     without being the one legal spelling -> NOT ok, with a reason.
//
// (D-34) THE PARTITION MOVED, IT DID NOT GROW. A directive-prefixed document used to sit in the second
// outcome and now sits in the third; there is still no fourth state. The second outcome is otherwise
// untouched and MUST stay that way — a body-only file is a legitimate document and turning it red to
// simplify the directive refusal would trade a silent success for a false red, which is the worse of
// the two. See the header for the `UNKNOWN - verify` on what the platform itself does with such a file.
//
// (D-39 / D-43) THE PARTITION MOVED A SECOND TIME, AND AGAIN IT DID NOT GROW. A line that begins with
// the payload but is not the one legal spelling — `----`, `--- foo`, `---` followed by a combining
// mark, an unassigned or private-use code point, or an invisible one — used to sit in the SECOND
// outcome at the opening position, and produced the misleading `opened and never closed` diagnosis at
// the closing position. Both now sit in the THIRD outcome, with the SAME named refusal at both
// positions: the open/close asymmetry is dead. Still three outcomes, still no fourth state.
//
// WHAT STAYED IN THE SECOND OUTCOME, DELIBERATELY. A document that does not begin with the payload AT
// ALL is still a keyless success — a body-only file, an empty document, a document of blank lines
// only. Turning a body-only file red would trade a silent success for a false red, which the paragraph
// above already argues is the worse of the two. The refusal keys on BEGINNING WITH THE PAYLOAD, which
// is precisely what a body-only document does not do.
export function parseFrontmatter(text) {
    // (D-39 point 1) THE ONE NORMALIZATION POINT: a single leading byte-order mark, then CRLF. One
    // expression, one removed byte, position zero only. See the delimiter-region header above for why a
    // SECOND leading mark is deliberately left to the refusal instead of being stripped too.
    const lines = stripFencedBlocks(text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")).split("\n");
    let i = 0;
    while (i < lines.length && lines[i].trim() === "")
        i++;
    // (D-34) BEFORE the delimiter test, because it is precisely the delimiter test's `else` — the
    // keyless SUCCESS arm — that a directive prologue used to fall into. One application point only.
    if (i < lines.length && YAML_DIRECTIVE.test(lines[i])) {
        return {
            ok: false,
            reason: `the document opens with the YAML directive line \`${excerpt(lines[i].trim())}\` before any \`---\` delimiter — a directive declares a YAML processing context this module does not implement, so the value this document expresses is not something this module may report on; it is refused as unreadable rather than read as "no frontmatter, no keys"`,
        };
    }
    if (i >= lines.length)
        return { ok: true, value: new Map() };
    // (D-43) The opening position: the one legal spelling opens a block, a line that BEGINS with the
    // payload without being it refuses by name, and anything else is not a delimiter at all and takes
    // the keyless success arm untouched.
    if (!isLegalDelimiter(lines[i], OPEN_PAYLOADS[0])) {
        const refusal = delimiterRefusal(lines[i], OPEN_PAYLOADS, "opening");
        if (refusal !== null)
            return refusal;
        return { ok: true, value: new Map() };
    }
    const openAt = i;
    let end = -1;
    for (let j = openAt + 1; j < lines.length; j++) {
        // (D-43) The closing scan consults THE SAME legal spelling and THE SAME refusal arms as the
        // opening test. A line that begins with a closing payload without being legal no longer slips
        // past the scan to be reported as an unterminated block — it produces the same named refusal it
        // would have produced at the opening position.
        if (CLOSE_PAYLOADS.some((p) => isLegalDelimiter(lines[j], p))) {
            end = j;
            break;
        }
        const refusal = delimiterRefusal(lines[j], CLOSE_PAYLOADS, "closing");
        if (refusal !== null)
            return refusal;
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
// UNSCOPED grant (`tools: Read, Agent`) enumerates nothing and returns an EMPTY LIST on the success
// arm — that is a real fact about the grant, and the KIT-03 oracle treats a zero-length closure as
// its own named failure.
//
// (D-32) RETURNS A RESULT, NOT A BARE ARRAY. An individual grant fragment can still be quoted after
// the whole value was flattened (`Agent("a", b)`), so the escape allowlist is enforced here too — and
// a refusal must reach the caller as a PARSE ARTIFACT. Dropping the offending name, or resolving it
// to something no loader computes, would be the module's founding failure one level down: a shorter
// or altered name list is a silent success, and the KIT-03 closure equality would then be computed
// over a set the document does not express. The call sites branch on the failure arm by hand, exactly
// as they already branch on `parseFrontmatter`'s.
export function keysGrantedAgentNames(keys) {
    const names = new Set();
    for (const v of toolsValues(keys)) {
        SCOPED_GRANT.lastIndex = 0;
        let m;
        while ((m = SCOPED_GRANT.exec(v)) !== null) {
            for (const raw of m[1].split(",")) {
                const resolved = unquoteChecked(raw.trim());
                if (!resolved.ok) {
                    return {
                        ok: false,
                        reason: `the grant fragment \`${excerpt(raw.trim())}\` carries the backslash sequence \`${resolved.escape}\` inside a double-quoted scalar, and that sequence is not one of the three escapes this module resolves; the granted name this document expresses is not the text these bytes spell, so the enumeration is refused on the same argument as an anchor or alias — a name is never silently dropped or altered`,
                    };
                }
                const n = resolved.value;
                if (n !== "")
                    names.add(n);
            }
        }
    }
    return { ok: true, value: [...names].sort() };
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
    // (D-32) Two distinct failure arms flow through here — the document did not parse, or a grant
    // fragment carried a sequence the enumeration will not resolve — and BOTH are returned as
    // failures. Collapsing either into `{ ok: true, value: [] }` is the silent-success shape.
    return p.ok ? keysGrantedAgentNames(p.value) : p;
}
export function frontmatterValueIs(text, key, value) {
    const p = parseFrontmatter(text);
    return p.ok ? { ok: true, value: keyHasValue(p.value, key, value) } : p;
}

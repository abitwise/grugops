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
// (D-48 — 27-REVIEW-GAPS-6 § WR-01, round 6) AND POSITION 0 OF **A NODE START**, WHICH A CONTINUATION
// LINE OF AN OPEN QUOTED SCALAR IS NOT. The sentence above was true of a single-line value and FALSE
// the moment the value wrapped, because `flattenBlock` handed this function one physical line at a
// time with no knowledge of whether a scalar was still open. Measured against the committed build,
// all three of `description: "see` / `  *emphasis* here"`, `  !important stuff"` and `  &D work"`
// were REFUSED as an anchor, alias or unresolved tag — documents libyaml loads to a plain string. A
// false red is a red gate whose only cure is deleting correct documentation, which D-34 records as
// the worse of the two directions. This function is UNCHANGED; its callers now decline to ask it
// about a line that is scalar CONTENT (see `flattenBlock`'s carried quote state).
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
// WHICH QUOTE, IF ANY, THIS NODE'S SCALAR IS WRITTEN IN — decided ONCE, at the NODE START, and the
// only thing that licenses a quote state to cross a line boundary.
//
// IN YAML A QUOTE CHARACTER IS ONLY A QUOTE WHERE A NODE MAY BEGIN. Inside a PLAIN scalar an
// apostrophe is ordinary text: `- headroom for 27-06's frontmatter key` is a complete plain scalar
// and the next `- item` line is a genuine sibling. Caught by this plan's own before/after value map
// over all 1131 tracked markdown files, which named 10 real `.planning/` documents whose sibling
// list items were being MERGED — the first draft of the carry stored the scanner's exiting flags
// unconditionally, so one apostrophe in a plain scalar propagated a phantom open quote and swallowed
// the following line's item boundary. The carry is therefore gated on the node start, which is the
// same rule `startsWithReference` already applies to a sigil, applied to a quote.
//
// The scanner's WITHIN-LINE quote tracking is untouched by this gate: a quoted region opening
// mid-line (a flow collection's `["a # b"]`) must still hide its hash on that line. This decides only
// what CROSSES a line boundary, which is exactly the fact the physical-line reset got wrong.
const nodeStartQuote = (nodeText) => nodeText.startsWith('"') ? '"' : nodeText.startsWith("'") ? "'" : null;
// Drop a trailing unquoted comment. A `#` only starts a comment when it is outside quotes AND at the
// start or preceded by whitespace, so `Agent(a#b)` keeps its hash and `Read # note` loses the note.
//
// (D-48 — 27-REVIEW-GAPS-6 § CR-01, round 6) QUOTE STATE IS A PROPERTY OF THE SCALAR, NOT OF THE
// LINE, so this scanner is SEEDED with the state the previous line of the same key left open and
// RETURNS the state it leaves open. One walk, one answer, carried across the lines a scalar occupies.
//
//   THE COMMENT THAT STOOD HERE FOR THREE ROUNDS SAID THE OPPOSITE OF THE MEASURED TRUTH. It claimed
//   that a `#` inside a quoted value wrapping across lines "only ever makes a value SHORTER on that
//   line while the following line's text still joins in — the error direction is a longer value,
//   never a hidden token." The following line's text did NOT join in: seeded from nothing, this
//   scanner returned the EMPTY STRING for a continuation line whose first character was `#`, so the
//   whole continuation was discarded and the token on it was HIDDEN. Measured against the committed
//   build: `tools: "Read,` / `  # x, Agent(grugops-orchestrator)"` returned `{ok:true,value:false}`
//   while libyaml returned `Read, # x, Agent(grugops-orchestrator)` — the silent no-grant arm, over
//   a live spawn grant. A comment claiming a property is never left standing without the assertion
//   that makes it true; the replacement above ships with its cases in the same commit.
//
// While the entering state is open, no `#` on this line can start a comment — the seeded flags say so
// directly, so the exemption needs no second rule. Where the quote CLOSES mid-line, the state is
// closed from that character on and a `#` after it is a comment again, at the same line.
function stripComment(s, entering) {
    let sq = entering === "'";
    let dq = entering === '"';
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
            // A comment runs to end-of-line and is only ever entered from OUTSIDE quotes, so nothing is
            // left open behind it. The exiting state is derived from the same two flags as the fall-through
            // below rather than being asserted a second way.
            return { text: s.slice(0, i), openQuote: dq ? '"' : sq ? "'" : null };
        }
    }
    return { text: s, openQuote: dq ? '"' : sq ? "'" : null };
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
    //
    // (D-50 — 27-REVIEW-GAPS-6 § IN-02, round 6) THE BLOCK-SCALAR EXEMPTION: A RULE IS APPLIED ONLY
    // WHERE THE FORMAT GIVES THE CONSTRUCT THAT MEANING.
    //
    // Inside a `|` or `>` block scalar YAML applies NO quoting rules AT ALL — there is no wrapping
    // quote pair to remove and no escape sequence to resolve, because every character between the
    // indicator and the end of the block is CONTENT. This closure applied `unquoteChecked` regardless,
    // and got it wrong in both directions. Measured against the committed build, with the loader column
    // from /usr/bin/ruby -ryaml (Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1):
    //
    //   tools: |          REFUSED, naming the backslash sequence `\q` "inside a double-quoted scalar" —
    //     Read, "Agent(x\q)"     a scalar the loader never sees. libyaml: `Read, "Agent(x\\q)"`.
    //   description: |    parsed, and the quotes were STRIPPED to `alpha`.
    //     "alpha"                libyaml keeps them: `"alpha"`.
    //   coordinator: |    flattened to the bare `true`, so `keyHasValue(keys, "coordinator", "true")`
    //     "true"                 MATCHED. libyaml: the literal text `"true"`. See `keyHasValue`.
    //
    // THIS IS THE SAME DISCIPLINE `startsWithReference`'s doc block ALREADY STATES, ten lines above, in
    // its "where it is NOT applied" paragraph — and this closure is the site that was missing it. Such
    // a paragraph is not documentation; it is part of the rule, and a rule shipped without it is a rule
    // applied everywhere.
    //
    // THIS IS NOT THE ESCAPE ALLOWLIST BEING NARROWED, and it must never become that. Every value that
    // is NOT a block scalar still answers to `unquoteChecked` byte for byte — the allowlist, the
    // single-quoted branch and the embedded-region scan are all untouched, and the same `\q` value
    // written OUTSIDE a block scalar still refuses, pinned by a control that passed before this change
    // and passes after it. What this does is make the flush AGREE WITH THE BRANCH THAT FED IT: the
    // block-scalar continuation branch below already treats every character as content and strips no
    // comment, and the flush then contradicted it at the join.
    //
    // THE DIRECTION IS LOUD. A block scalar carrying a spawn token moves from the parse-FAILURE arm to
    // the CONVICTION arm — the value plainly carries the token, so it is a grant. It cannot move to the
    // no-grant arm: the three allowlisted escapes each resolve to a NON-WORD character (`"`, `\`, `/`)
    // and are non-word unresolved too, so leaving them alone can neither create nor destroy an
    // `\bAgent\b` / `\bTask\b` boundary, and removing a wrapping quote pair never could either.
    const flush = () => {
        if (cur === null)
            return null;
        const joined = cur.block
            ? cur.parts.join(" ")
            : cur.seq
                ? cur.parts.join(", ")
                : cur.parts.join(" ");
        const trimmed = joined.trim();
        let value;
        if (cur.block) {
            value = trimmed;
        }
        else {
            const resolved = unquoteChecked(trimmed);
            if (!resolved.ok) {
                return refuseEscape(`${cur.key}: ${trimmed}`, resolved.escape);
            }
            value = resolved.value;
        }
        const seen = keys.get(cur.key);
        if (seen === undefined)
            keys.set(cur.key, [value]);
        else
            seen.push(value);
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
            // (D-48) THE CARRIED SCALAR STATE, READ ONCE AND CONSULTED BY ALL THREE CONSUMERS BELOW. While
            // a quoted scalar opened on an earlier line of this key is still open, THIS LINE IS CONTENT:
            // it is not a comment start, it is not a node start, and it is not an item boundary. That is
            // the whole of what the carried state decides — it never decides what a value MEANS.
            const inScalar = cur.openQuote !== null;
            // MAY A NODE BEGIN ON THIS LINE? Derived ONCE from the two carried facts and read by consumers
            // 1 and 2 below. A line inside an open quoted scalar is content; so is a line continuing a
            // scalar that already began on the key line. Both are properties of the NODE — neither is
            // recoverable from the line, which is exactly why the per-line reset got all three wrong.
            const startsNode = !inScalar && !cur.nodeOnKeyLine;
            // CONSUMER 1 — THE ITEM BOUNDARY. `SEQ_ITEM` is byte-unchanged and is simply NOT ASKED where a
            // node may not begin. Teaching the regex about quotes would be a SECOND GRAMMAR for a fact
            // these fields already hold, and this module has deleted a weaker-duplicate predicate twice.
            // Measured against the committed build, the unconditional test read the `-` opening a
            // continuation line as a new item, which set `cur.seq` and flipped the join separator for the
            // WHOLE key from `" "` to `", "` — inventing a comma, hence a NAME, on the success arm.
            const item = startsNode ? t.match(SEQ_ITEM) : null;
            if (item !== null) {
                // A block-sequence ITEM is its own node, so the token start is the text after the dash.
                const itemText = (item[1] ?? "").trim();
                // CONSUMER 2 (item path) — the node-start test. Reached only with the scalar CLOSED, so the
                // node start is real; the seed below is `cur.openQuote` rather than a literal null so this
                // path reads the carried state like every other, with no per-line derivation of its own.
                if (startsWithReference(itemText))
                    return refuseRef(t);
                cur.seq = true;
                // (D-30) The escape refusal fires HERE, at the same node-start point the reference refusal
                // already fires from, and returns directly rather than being deferred to the flush.
                const scanned = stripComment(itemText, cur.openQuote);
                // The item is its own node, so its node start decides whether a state may cross the boundary.
                cur.openQuote =
                    nodeStartQuote(itemText) === null ? null : scanned.openQuote;
                const resolved = unquoteChecked(scanned.text.trim());
                if (!resolved.ok)
                    return refuseEscape(t, resolved.escape);
                const v = resolved.value;
                if (v !== "")
                    cur.parts.push(v);
                continue;
            }
            // CONSUMER 2 (continuation path) — the node-start test, ASKED ONLY WHERE A NODE MAY BEGIN.
            // A real anchor, alias or unresolved tag at a genuine node start is still refused by name;
            // the same characters on a line that merely CONTINUES a scalar are content, which is what
            // stops a red gate from falling on `description: see` / `  *emphasis* here`.
            if (startsNode && startsWithReference(t))
                return refuseRef(t);
            // CONSUMER 3 — the comment scanner, seeded from and storing back to the one carried state.
            const scanned = stripComment(t, cur.openQuote);
            // A continuation line CONTINUES a node; it never starts one, so it can only ever carry a state
            // FORWARD (until the scalar closes) and never OPEN one. A quote first seen here belongs to a
            // plain scalar's text or to a region inside a flow collection — neither is a quoted scalar, and
            // treating one as if it were is how the plain-scalar apostrophe swallowed a sibling item.
            if (inScalar)
                cur.openQuote = scanned.openQuote;
            const text = scanned.text.trim();
            if (inScalar && cur.parts.length > 0) {
                // A continuation of an OPEN scalar is the SAME node, so it folds into the part it continues
                // rather than becoming a part of its own. Pushing it would hand a block sequence's `", "`
                // join a boundary the document does not express — the invented-comma direction again, this
                // time one layer below the item boundary. YAML folds the line break to a single space and so
                // does this, which is why the flattened value matches the loader's byte for byte.
                cur.parts[cur.parts.length - 1] =
                    text === ""
                        ? cur.parts[cur.parts.length - 1]
                        : `${cur.parts[cur.parts.length - 1]} ${text}`;
                continue;
            }
            cur.parts.push(text);
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
            cur = {
                key: kv[1],
                parts: [],
                block: true,
                seq: false,
                openQuote: null,
                nodeOnKeyLine: false,
            };
        }
        else {
            cur = {
                key: kv[1],
                parts: [],
                block: false,
                seq: false,
                openQuote: null,
                nodeOnKeyLine: false,
            };
            // (D-48) THE KEY LINE SEEDS FROM NULL, AND THE ASYMMETRY WITH THE TWO CONTINUATION POINTS IS
            // DELIBERATE — DO NOT "FIX" IT TO MATCH THEM. A key line begins a NEW NODE, so no scalar from
            // the previous key can still be open across it; seeding from anything else would let one key's
            // unterminated quote silence the next key's comment stripping. It is also why the node-start
            // reference test a few lines above stays UNGUARDED here while both continuation points guard
            // theirs: the entering state at a key line is null by construction, so there is nothing to
            // guard against, and adding a guard would imply a state that cannot exist.
            const scanned = stripComment(rest, null);
            cur.openQuote = nodeStartQuote(rest) === null ? null : scanned.openQuote;
            const v = scanned.text.trim();
            // The node begins HERE only if the key line actually carries text. A key line whose value is
            // wholly a comment (`tools: # x`) begins nothing, so the following indented lines are still
            // node starts — libyaml agrees: it takes the value from the continuation line.
            cur.nodeOnKeyLine = v !== "";
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
// THE DELIMITER REGION — ONE TOTAL CLASSIFIER, THREE VERDICTS, NO SECOND PREDICATE
// (D-39 + D-43 + D-44 — 27-REVIEW-GAPS-5 § CR-01, round 5)
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
// AND A FIFTH TIME, ONE ABSTRACTION LEVEL UP FROM THE ALPHABET (27-REVIEW-GAPS-5 § CR-01, round 5 —
// D-44). D-43 got the alphabet right AND the polarity right and STILL leaked, because it wrote the
// rule as TWO REFUSAL PREDICATES and assumed their union was the complement of the legal set. Arm 1
// fired only on `line.startsWith(payload)` at position zero; arm 2 fired only when the
// residue-stripped remainder was a FULLY LEGAL delimiter. A line carrying BOTH leading invisible
// residue AND illegal trailing residue satisfied NEITHER, fell through to `null`, and reached the
// keyless SUCCESS arm — the silent no-grant this module exists to make impossible. Measured against
// the committed parser before this edit, every one of `<ZWSP>---<ZWSP>`, `<ZWSP>----`, `<NBSP>----`,
// `<BOM><BOM>---<ZWSP>`, `<ZWSP>--- foo`, `<NUL>---<NUL>`, `<U+0301>---<U+0301>` and ` ----` returned
// `{ ok: true, value: false }` over a live `Agent(grugops-orchestrator)` grant, and each of them
// reported the misleading `opened and never closed` diagnosis at the CLOSING position rather than
// naming the offending byte. Planted on `skills/grugops/SKILL.md` in a hermetic mirror, the
// single-sided spellings each exited 1 and the COMPOSITE printed ALL CHECKS PASSED at exit 0: one
// code point flipped a red gate green.
//
//   THE LESSON, AND IT IS NOT ABOUT CHARACTERS. Rounds 1-4 each patched what the predicate CONTAINED.
//   This one is about what the region IS. Before trusting any closure claim in this region, ask
//   whether it holds ONE PREDICATE or a COMPOSITION OF PREDICATES. A predicate that is total by
//   construction has no union to leak through; a pair always does, and its gap is invisible to a
//   reader checking each arm in isolation — both arms below were individually correct and individually
//   pinned by shipped cases while their composition shipped a live bypass.
//
//   THE INVERSION THAT CAUSED IT, NAMED SO IT IS NOT REINTRODUCED. Arm 2 let the invisible class decide
//   WHAT MAY FOLLOW THE PAYLOAD (it demanded a legal remainder). The invisible class decides only
//   WHERE THE DELIMITER BEGINS. That is the whole of its business and the classifier below consults it
//   for nothing else.
//
// D-43 states the LEGAL set, and D-44 states it ONCE, as a TOTAL function of the line:
//
//     payload        = "---" at the opening position; "---" or "..." at the closing position
//     declared class = [ \t] — the ONE class, and the ONLY thing permitted after the payload
//     run            = the leading run of code points that render no glyph of their own, LABELLED
//                      (D-50) by what it is made of: `none`, `indentation` (entirely inside the
//                      declared class), or `residue` (carrying anything else)
//     rest           = the line with that run removed
//
//     `rest` does NOT begin with any payload  -> not-a-delimiter (the keyless SUCCESS arm, untouched)
//     run is `none` AND everything after the
//         payload is in the declared class    -> legal
//     run is `indentation`, CLOSING position  -> not-a-delimiter (D-50: "keep scanning" — the line is
//                                                CONTENT, and the fallback when no legal close is ever
//                                                found is the EXISTING unterminated-block REFUSAL)
//     otherwise                               -> refuse, naming every offending code point it saw
//
// EXACTLY THREE VERDICTS AND EVERY LINE GETS EXACTLY ONE. There is no input for which the classifier
// returns nothing and no input for which two verdicts could apply, so there is no union left to
// compose and no sixth spelling to slip between a pair. The two-arm helper is DELETED rather than
// kept as a second opinion: a weaker duplicate that still votes is worse than none, which is this
// module's own standing argument (see the fence authority and the escape allowlist above).
//
// FALSE-RED COST — A MEASUREMENT, NOT A PROPERTY OF THE RULE, AND IT IS CITED RATHER THAN REMEMBERED.
//
// (D-50) THE SENTENCE THAT STOOD HERE CLAIMED MORE THAN IT HAD. It read: "All 33 files on the
// spawn-grant scan surface open with a byte-exact `---` … The strict rule costs this repository
// nothing, which is what makes the allowlist affordable." That is a POINT-IN-TIME COUNT over one
// surface doing the work of a CLASS-LEVEL property, and this repository's second systemic failure
// class is exactly a hand-carried number that reads authoritative while being wrong. It was also
// false in substance while it stood: WR-02 was a false red on THREE document shapes a real YAML
// loader accepts, none of which any file on that 33-member surface happens to use.
//
// WHAT IS TRUE, AND WHERE TO CHECK IT RATHER THAN TRUST IT. The cost is re-measured on EVERY RUN, by
// two controls in scripts/frontmatter.test.ts, and neither carries a corpus-size literal:
//
//   • the D-43 false-red control, over the ONE `spawnGrantScan()` composition the guard itself reads
//     — head lines AND every block line, re-probed at the closing position on its own;
//   • the SELF-DERIVING repository-wide control, whose corpus is enumerated by `git ls-files '*.md'`
//     AT RUN TIME and which asserts zero refusals over a non-empty corpus, reporting the size it
//     derived. It needs no baseline, no literal and no mirror, so it cannot go stale.
//
// A code comment claiming a property is never left standing without the assertion that makes it true.
// The strict rule is affordable because those two controls say so on every run — not because of a
// number written down once.
//
// (D-39 point 4 / D-34) THE KEYLESS SUCCESS ARM IS NEVER WIDENED. A document that does not begin with
// the payload at all — a body-only file, an empty file, a file of blank lines — still succeeds with no
// keys. Turning one of those red would trade a silent success for a FALSE red, which D-34 already
// recorded as the worse of the two.
//
// AND A SIXTH TIME, BELOW EVERY PREDICATE ABOVE — IN THE ASSEMBLY THAT PRODUCES THE VALUE THEY REASON
// ABOUT (27-REVIEW-GAPS-6 § CR-01 + § WR-01, round 6 — D-48). Rounds 1-5 each sat INSIDE a predicate:
// the escape alphabet, the delimiter alphabet, the delimiter arm split, the delimiter arm
// composition, the enumeration alphabet. `classifyDelimiter` reasons about a LINE and is correct.
// `ENUMERATION_LEGAL_CHARS` reasons about a captured ENUMERATION and is correct. The value they
// reason about is assembled from SEVERAL PHYSICAL LINES by `flattenBlock`, and the assembly reset its
// state at every line boundary — so a name mangled upstream never reached the allowlist that would
// have refused it.
//
//   `stripComment`, `startsWithReference` and the `SEQ_ITEM` item boundary each decided their state
//   per PHYSICAL LINE while `flattenBlock` handed them one line at a time. A YAML SCALAR DOES NOT END
//   AT A LINE BOUNDARY, so a multi-line quoted scalar was analysed as N independent single-line
//   documents and the module got it wrong in THREE DIRECTIONS AT ONCE — one root cause, three sides:
//
//     • the `#` direction (CR-01): a `#` on a continuation line was deleted as a comment when YAML
//       says it is content, discarding the continuation WHOLE and hiding a live spawn grant. Three
//       spellings — a wrapped double-quoted scalar, a wrapped single-quoted scalar, and a wrapped
//       double-quoted BLOCK-SEQUENCE ITEM (the idiom all 7 shipped skills and all 17 shipped agent
//       adapters use) — each returned `{ok:true,value:false}` over a live
//       `Agent(grugops-orchestrator)` while libyaml returned the grant. Planted on BOTH distribution
//       twins of `skills/plan/SKILL.md`, the whole foundation gate printed ALL CHECKS PASSED at exit
//       0, while the identical grant WITHOUT the line break exited 1. One line break flipped a red
//       gate green.
//     • the `*` / `!` / `&` direction (WR-01): the same reset in the OPPOSITE direction. A sigil at
//       the start of a continuation line was refused as a YAML node property when YAML says it is
//       content, so `description: "see` / `  *emphasis* here"` — which libyaml loads to a plain
//       string — failed RED on correct documentation.
//     • the `-` direction (the JOIN defect, reproduced by the planner and named in no review): a `-`
//       at the start of a continuation line was read as a NEW BLOCK-SEQUENCE ITEM, which re-routed
//       that line through the item path AND flipped the join separator for the whole key. It needs no
//       comment and no reference at all: `tools: "Agent(alpha, ga` / `  - mma)"` enumerated
//       `[alpha, ga, mma]` where the document expresses `[alpha, ga - mma]`, so the name set feeding
//       the KIT-03 closure equality had a name INVENTED in it, on the `ok:true` arm.
//
//   THE LESSON, AND IT IS NOT ABOUT PREDICATES AT ALL. Round 5 asked whether a region held ONE
//   predicate or a COMPOSITION of them. This one is a level below that question. Before trusting any
//   predicate's closure claim, ASK WHAT PRODUCED THE VALUE IT REASONS ABOUT, AND WHETHER THAT
//   PRODUCER'S STATE SURVIVES THE CONSTRUCT'S BOUNDARIES. A predicate provably total over its own
//   input is still defeated by a value mangled upstream of it, and no sweep generated over a smaller
//   unit than the construct under test can see that — the round-6 sweep was non-circular over its own
//   alphabet and its own arm structure, and was structurally incapable of failing here because all
//   three of its axes were properties of ONE LINE.
//
//   THE FIX IS STRUCTURAL AND HAS NO SECOND OPINION. Quote state is promoted to a property of the
//   SCALAR (`Accumulator.openQuote`), seeded into and returned from ONE walk, and consulted by all
//   three consumers. No call site keeps a per-line derivation beside it and `SEQ_ITEM` is
//   byte-unchanged: a quote-aware sequence regex would be a second grammar for a fact the carried
//   state already holds. FALSE-RED COST, RE-MEASURED at the time of the edit over every tracked
//   markdown file with the corpus enumerated by `git ls-files '*.md'` in the same run: zero before,
//   zero after. The fix can only ever REMOVE a refusal, so any NEW refusal is a defect in the fix.
//
//   AND THE CARRY IS GATED ON THE NODE START, WHICH THE FIRST DRAFT OF IT WAS NOT. A quote character
//   is only a quote where a node may BEGIN; inside a plain scalar it is text. The first draft stored
//   the scanner's exiting flags unconditionally, so a lone apostrophe in a plain scalar
//   (`- headroom for 27-06's frontmatter key`) propagated a phantom open quote and swallowed the
//   NEXT line's item boundary — merging two genuine sibling list items. That regression was invisible
//   to every case in the suite and to all nine named CR-01/WR-01/JOIN anchors; it was caught only by
//   comparing the flattened value map over all 1131 tracked markdown files before and after, which
//   named 10 real `.planning/` documents. The lesson is the plan's own, turned on the fix: a change
//   this far upstream is proven by the values it produces over the real corpus, not by the rows it
//   was written to repair. See `nodeStartQuote` above.
//
// AND A SEVENTH TIME — AND THIS ONE DID NOT GET THE LEGAL SET WRONG, IT GOT THE QUESTION WRONG
// (27-REVIEW-GAPS-6 § WR-02 + § IN-02, round 6 — D-50). Every entry above is about WHAT THE RULE
// COVERS: the escape alphabet, the delimiter alphabet, the arm split, the arm composition, the
// enumeration alphabet, the assembly that produced the value. This one is about WHERE THE RULE
// APPLIES AT ALL.
//
//   `classifyDelimiter` asked "does this line begin with a payload" WITHOUT FIRST ASKING "is this
//   line at a delimiter POSITION". It stripped the leading run in order to find the payload, and the
//   thing it stripped — indentation — WAS ITSELF THE ANSWER. So an indented `---` inside a literal
//   block scalar, an indented `...` inside a folded one, and a wrapped `description:` whose
//   continuation begins with an ellipsis were all REFUSED, on documents libyaml loads cleanly.
//
//   The SAME shape, ten lines below `startsWithReference`'s doc block, in the value flattener: the
//   flush applied `unquoteChecked` to the joined value of a `|` / `>` block scalar, where YAML gives
//   the construct NO quoting and NO escapes at all. So `tools: |` / `  Read, "Agent(x\q)"` was
//   refused naming a backslash sequence the loader never sees, and `description: |` / `  "alpha"`
//   had its quotes STRIPPED where the loader keeps them. That second direction is not merely a false
//   red: `coordinator: |` / `  "true"` flattened to the bare `true`, so `keyHasValue` matched the
//   coordinator marker on a construct the platform reads as the literal text `"true"` — masked on
//   today's tree only by `guard_wr05`'s exactly-one-coordinator cardinality check, which is defence
//   in depth and not a property of this parser.
//
//   THE DISCIPLINE ALREADY EXISTED IN THIS FILE AND NEITHER SITE CARRIED IT. `startsWithReference`'s
//   doc block has a "WHERE IT IS NOT APPLIED" paragraph that correctly exempts the constructs YAML
//   gives no such meaning. The lesson is that such a paragraph is not documentation — it is part of
//   the rule, and a rule shipped without it is a rule applied everywhere.
//
//   THE STANDING QUESTION THIS LEAVES FOR THE NEXT READER. Before trusting a classifier's verdict,
//   ASK WHETHER THE THING IT STRIPPED IN ORDER TO FIND ITS SUBJECT WAS ITSELF PART OF THE ANSWER —
//   and before trusting any rule, ask at which POSITIONS the format gives the construct the meaning
//   the rule assumes. A rule that is total, correctly polarised and correctly assembled is still
//   wrong everywhere the format does not grant it jurisdiction.
// The payload at each delimiter position. Declared here as data so both positions consult the same
// tokens in the same order, which is what makes the reported refusal deterministic for a given input.
const OPEN_PAYLOADS = ["---"];
const CLOSE_PAYLOADS = ["---", "..."];
// THE DECLARED WHITESPACE CLASS, DECLARED EXACTLY ONCE. Space and tab, matching what both delimiter
// positions already accepted before this change — the class is NOT loosened to make a case pass, and
// the trailing-space and trailing-tab controls are the only accepted non-byte-exact spellings.
// It is reached only through `firstOutsideDeclaredWs` below, which the ONE classifier consults; no
// call site carries an inline whitespace expression of its own.
const DELIMITER_WS_CHAR = /[ \t]/;
// THE INVISIBLE CLASS, AND IT BOUNDS THE LEADING RUN — NOTHING MORE. Stated POSITIVELY: a character
// that renders a visible glyph of its own is a letter, a number, a punctuation mark or a symbol. A
// leading run containing none of those is where the delimiter has not begun yet.
//
// (D-50) WHAT THIS CLASS CONTRIBUTES IS THE RUN'S EXTENT; WHAT THE RUN IS MADE OF IS DECIDED BY
// `DELIMITER_WS_CHAR`. The sentence that stood here said the run's LENGTH was "the whole of what this
// class contributes to a verdict", and that was the WR-02 defect written down as a design statement:
// length alone cannot tell indentation from residue, and indentation is what distinguishes a
// delimiter from content. This class still never decides what may FOLLOW the payload — that
// inversion is round 5's defect and stays deleted — and it still never decides a verdict by itself.
//
// DELIBERATELY NOT UNICODE'S OWN TERM `graphic`, which is {L, M, N, P, S, Zs} and therefore INCLUDES
// COMBINING MARKS. An implementation reaching for that definition treats a leading U+0301 as a visible
// glyph and fails to refuse it — one of the exact rows D-42 shipped green. The complement of
// {L, N, P, S} is what puts marks, unassigned, private-use, surrogate, format and separator code
// points all on the invisible side.
//
// (D-44) THIS CLASS NEVER DECIDES WHAT MAY FOLLOW THE PAYLOAD. D-42 got that backwards on the
// TRAILING axis and D-43's arm 2 got it backwards again by demanding a LEGAL remainder after the
// residue — which is exactly how the composite escaped both arms. The classifier below calls
// `leadingInvisibleRun` once, uses the result to find where the payload starts, and never consults
// this class again.
const VISIBLE_GLYPH = /[\p{L}\p{N}\p{P}\p{S}]/u;
// The index of the first code point of `residue` outside the declared class, or -1 when every code
// point is inside it. ONE scan answering both halves the classifier needs: `=== -1` IS the legality
// of what follows the payload, and any other value is the position whose code point the refusal NAMES.
function firstOutsideDeclaredWs(residue) {
    let at = 0;
    for (const c of residue) {
        if (!DELIMITER_WS_CHAR.test(c))
            return at;
        at += c.length;
    }
    return -1;
}
function leadingInvisibleRun(line) {
    let length = 0;
    let allDeclared = true;
    for (const c of line) {
        if (VISIBLE_GLYPH.test(c))
            break;
        if (!DELIMITER_WS_CHAR.test(c))
            allDeclared = false;
        length += c.length;
    }
    if (length === 0)
        return { kind: "none", length: 0 };
    return allDeclared
        ? { kind: "indentation", length }
        : { kind: "residue", length };
}
// `U+` followed by four or more uppercase hexadecimal digits.
const codePointLabel = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
// (D-44 point 1) THE COMPILER-CHECKED NEVER-BRANCH. Every call site ends its switch here. Adding a
// fourth verdict kind to `DelimiterVerdict` without handling it at a call site makes `tsc` fail on the
// argument type — the unhandled kind is no longer assignable to `never`. That is the mechanism that
// keeps the promote from being undone quietly: a future author cannot reintroduce a second, partially
// consumed verdict without failing the build, rather than merely failing review.
function assertNeverVerdict(verdict) {
    throw new Error(`unhandled delimiter verdict ${JSON.stringify(verdict)} — a kind was added to DelimiterVerdict without being consumed at this call site`);
}
// (D-44) THE ONE TOTAL CLASSIFIER. Every line at either delimiter position goes through here and
// leaves with EXACTLY ONE verdict. There is no input that returns nothing and no input for which two
// verdicts could apply, so there is no union for a sixth spelling to leak through.
//
// WHAT THIS REPLACED, AND WHY THE SHAPE CHANGED RATHER THAN THE CONTENTS. The region held two refusal
// predicates. Arm 1 fired only on `line.startsWith(payload)`; arm 2 fired only when the
// residue-stripped remainder was a FULLY LEGAL delimiter. Each was individually correct and
// individually pinned by shipped cases. Their UNION was assumed to be the complement of the legal set
// and was not: a line carrying BOTH leading invisible residue AND illegal trailing residue satisfied
// neither, returned `null`, and reached the keyless SUCCESS arm — a live spawn grant read as an
// absence of keys. Four rounds patched what the predicate CONTAINED and each shipped past a green
// suite; this one deletes the structure that kept admitting a gap. The pair is GONE, not narrowed and
// not retained as a second opinion, because a weaker duplicate that still votes is worse than none.
//
// THE INVISIBLE CLASS DECIDES ONLY WHERE THE DELIMITER BEGINS. It is consulted once, by
// `leadingInvisibleRun`, to locate the payload. It never decides what may follow the payload. That
// inversion is round 5's defect and it is deleted rather than narrowed.
//
// (D-50) AND THE RUN IT LOCATED IS ALSO ASKED WHAT IT IS MADE OF — ONCE, IN THAT SAME SCAN, AND READ
// HERE FROM ONE LABELLED RESULT. A run that is entirely declared whitespace is INDENTATION, and
// indentation means this line is not at a delimiter position at all. That is ONE EXTRA LABEL on the
// existing result, never a second composable predicate: this function stays a single total function
// with the same three verdicts and the same compiler-checked never-branch, and no call site keeps a
// length test beside the label as a second opinion. See the branch below for why the label is
// consumed at the CLOSING position only, and why that is not the asymmetry D-39 point 5 killed.
//
// THE PAYLOADS ARE TRIED IN DECLARED ORDER, so a given line always produces the same verdict and the
// same reason, and two runs over one tree are byte-identical.
function classifyDelimiter(line, payloads, position) {
    const run = leadingInvisibleRun(line);
    const rest = line.slice(run.length);
    for (const payload of payloads) {
        if (!rest.startsWith(payload))
            continue;
        const residue = rest.slice(payload.length);
        const outside = firstOutsideDeclaredWs(residue);
        if (run.kind === "none" && outside === -1)
            return { kind: "legal", payload };
        // (D-50) INDENTATION MEANS THIS LINE IS NOT AT A DELIMITER POSITION AT ALL — AT THE CLOSING
        // POSITION, AND PROVABLY NOT AT THE OPENING ONE.
        //
        // THE ASYMMETRY IS MECHANICAL, NOT A PREFERENCE, AND ITS REASON IS THAT THE TWO CALL SITES
        // CONSUME `not-a-delimiter` DIFFERENTLY. At the CLOSING position it means `continue scan`, and a
        // scan that never finds a legal close ends in the EXISTING `opened and never closed` REFUSAL — so
        // routing indentation there can only ever turn one refusal into another refusal or into a correct
        // parse, never into a success this module cannot vouch for. At the OPENING position the same
        // verdict IS the keyless SUCCESS arm, so routing indentation there would trade a loud refusal for
        // the silent no-grant arm this whole module exists to make impossible. It is therefore not routed
        // there, and the opening-position rows are pinned by cases that were red before this change and
        // are red after it.
        //
        // THIS IS NOT THE OPEN/CLOSE ASYMMETRY D-39 POINT 5 KILLED — read the difference before "fixing"
        // it to match. That one was the SAME BYTE refusing loudly at one position and succeeding silently
        // at the other, with no stated reason: an accident of two code paths. This one is a stated
        // difference in WHAT THE TWO POSITIONS MEAN, and it points the only way it safely can.
        if (run.kind === "indentation" && position === "closing") {
            return { kind: "not-a-delimiter" };
        }
        // REFUSE, NAMING EVERY FACT OBSERVED AND NOT THE FIRST. A doubly-offending line has two things
        // wrong with it and a reason that mentioned only one would send a reader to fix half the line.
        // At least one clause is always present: `run.kind === "none" && outside === -1` is the legal
        // verdict above, so reaching here means the run is non-empty, or the residue leaves the declared
        // class, or both.
        const faults = [];
        if (run.kind !== "none") {
            faults.push(`its leading residue renders no glyph of its own and begins with ${codePointLabel(line.codePointAt(0) ?? 0)}, so the delimiter does not begin where the line begins`);
        }
        if (outside !== -1) {
            faults.push(`the first code point after the payload, ${codePointLabel(residue.codePointAt(outside) ?? 0)}, is outside the one whitespace class a delimiter may carry`);
        }
        return {
            kind: "refuse",
            reason: `the ${position} delimiter position carries \`${excerpt(line)}\`, which is not the one legal spelling of the \`${payload}\` delimiter: ${faults.join("; and ")}. A delimiter begins where the line begins and carries nothing but space or tab after its payload, so this line is refused as unreadable rather than read as an absence of keys — never read as "carries no grant"`,
        };
    }
    // (D-39 point 4 / D-34) THE GENUINELY-BODY-ONLY ARM, AND IT IS NEVER WIDENED. Reaching here means
    // the line does not begin with a payload even after its leading invisible run is stripped: a body
    // line, an empty line, a line of nothing but invisible characters, a dash bullet, a setext
    // underline. Turning one of those red would trade a silent success for a FALSE red, which D-34
    // recorded as the worse of the two.
    return { kind: "not-a-delimiter" };
}
// Read a markdown document's frontmatter into key -> flattened values.
//
// The input is fence-stripped FIRST (one fence authority), so frontmatter shown inside a ``` block
// is documentation and contributes nothing. CRLF is normalized so a Windows checkout parses
// identically to a Unix one.
//
// (D-39 point 1) ONE NORMALIZATION POINT, AND IT REMOVES EXACTLY ONE BYTE. A single leading byte-order
// mark is removed in the SAME expression that normalizes CRLF, at position zero, once. It is the ONLY
// byte this module removes. A SECOND leading mark is deliberately NOT stripped: it is leading residue
// and the classifier below REFUSES it by name, because "strip every mark" would be a decode this
// module does not perform, and this module's whole contract is that it does not decode. No second
// normalization is ever added here.
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
// (D-44) AND IT MOVED A THIRD TIME, FOR THE COMPOSITE, AND STILL DID NOT GROW. A line carrying BOTH
// leading invisible residue AND illegal trailing residue — `<ZWSP>---<ZWSP>`, `<ZWSP>----`,
// ` ----` — used to sit in the SECOND outcome at the opening position, because it satisfied neither
// of the two refusal arms that preceded the classifier, and it produced the misleading `opened and
// never closed` diagnosis at the closing position for the same reason. It now sits in the THIRD
// outcome at BOTH positions with the SAME named refusal, which is the LAST place the open/close
// asymmetry survived. Still three outcomes, still no fourth state — and now the three are a
// PARTITION by construction rather than by assumption, because one total classifier assigns them.
//
// WHAT STAYED IN THE SECOND OUTCOME, DELIBERATELY. A document that does not begin with the payload AT
// ALL — even after its leading invisible run is stripped — is still a keyless success: a body-only
// file, an empty document, a document of blank lines only, a line of nothing but invisible characters.
// Turning a body-only file red would trade a silent success for a false red, which the paragraph
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
    // (D-44) CALL SITE ONE — THE OPENING POSITION. A switch over the verdict and nothing else: this
    // branch carries no whitespace expression, no payload comparison and no residue arithmetic of its
    // own, because a second copy of any of those is how the region grew a second grammar four times.
    // The `default` arm is the compiler-checked never-branch.
    const opening = classifyDelimiter(lines[i], OPEN_PAYLOADS, "opening");
    switch (opening.kind) {
        case "legal":
            break;
        case "refuse":
            return { ok: false, reason: opening.reason };
        case "not-a-delimiter":
            return { ok: true, value: new Map() };
        default:
            return assertNeverVerdict(opening);
    }
    const openAt = i;
    let end = -1;
    // (D-44) CALL SITE TWO — THE CLOSING SCAN. THE SAME classifier, THE SAME three verdicts, and the
    // SAME named refusal. The open/close asymmetry is dead in both of its forms: a line that begins
    // with a closing payload without being legal no longer slips past the scan to be reported as an
    // unterminated block, and neither does a COMPOSITE one, which is the form that still produced that
    // misleading diagnosis until D-44.
    scan: for (let j = openAt + 1; j < lines.length; j++) {
        const closing = classifyDelimiter(lines[j], CLOSE_PAYLOADS, "closing");
        switch (closing.kind) {
            case "legal":
                end = j;
                break scan;
            case "refuse":
                return { ok: false, reason: closing.reason };
            case "not-a-delimiter":
                continue scan;
            default:
                return assertNeverVerdict(closing);
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
// The three buckets, stated ONCE as data so the identity below counts what this list names. A fourth
// kind added to the type without being added here makes the identity fail arithmetically instead of
// being silently unclassified — this repository's derive-the-set-assert-the-count rule applied to a
// partition.
const GRANT_OCCURRENCE_KINDS = [
    "scoped",
    "unscoped",
    "neither",
];
function accountSpawnOccurrences(value) {
    const scan = new RegExp(SPAWN_TOKEN.source, `${SPAWN_TOKEN.flags}g`);
    const out = [];
    let m;
    while ((m = scan.exec(value)) !== null) {
        const at = m.index;
        const after = at + m[0].length;
        // BUCKET TWO — a bare token. `tools: Read, Agent` grants spawn without scoping it, which is a
        // real fact about the grant and is returned unchanged on the success arm.
        if (value[after] !== "(") {
            out.push({ kind: "unscoped", token: m[0], fragment: m[0] });
            continue;
        }
        // BUCKET ONE vs BUCKET THREE — the `(` either closes in this value or it does not. The close
        // test is `indexOf(")")` from just past the `(`, which is exactly the extent `SCOPED_GRANT`'s
        // `[^)]*` reaches: the accounting and the capture agree on WHERE a scoped grant ends, and
        // disagree only about what to do when there is no end at all.
        const close = value.indexOf(")", after + 1);
        if (close === -1) {
            out.push({ kind: "neither", token: m[0], fragment: value.slice(at) });
            continue;
        }
        out.push({ kind: "scoped", token: m[0], fragment: value.slice(at, close + 1) });
    }
    return out;
}
// (D-47 item 2) THE LEGAL CHARACTER SET OF A GRANT ENUMERATION, STATED ONCE AND POSITIVELY.
//
// This is D-30's shape one function over: a finite legal set, everything outside it refused, declared
// in exactly one place. It replaces a PAIR of checks that each named a character a prior finding
// happened to report — see the refusal site below for why they are deleted rather than kept beside it.
//
// WHAT EACH MEMBER IS FOR, so a later reader can tell which members are load-bearing and which are
// latitude:
//
//   `,`              THE SEPARATOR. This is the one structurally load-bearing member: it is the
//                    character `keysGrantedAgentNames` splits on, and the whole point of the refusal
//                    is that a comma must be reliably the separator before that split can be trusted.
//   ` ` (space)      The separator's conventional padding (`Agent(a, b)`). Every enumeration this
//                    repository ships writes comma-space, and the fragments are trimmed after the
//                    split.
//   `A`-`Z` `a`-`z`  Name content — the letters of an adapter name.
//   `0`-`9`          Name content — digits, which no adapter name uses today but which cost nothing
//                    and which a future `grugops-uat-2` would need.
//   `_` `-` `.`      Name content — the only punctuation a role/skill/command name uses. `-` is the
//                    kebab-case joint every adapter name carries; `_` and `.` are latitude.
//
// The set is LATITUDE, not a grammar. Narrowing it costs a false red on a name this repository does
// not yet ship; widening it costs the opposite, and is forbidden by this plan's prohibitions — a real
// enumeration that refuses is a finding about that enumeration, never a licence to add its character
// here.
//
// Exported for one reason only: the case that pins the escape branch's unreachability asserts the
// quote characters and the backslash are outside THIS constant. A test re-typing the set would be a
// second statement of it, which is the drift class this repository's own record names. It is not part
// of the parsing API — no consumer outside this module's tests reads it, exactly as with
// `DQ_ESCAPE_ALLOWLIST`.
export const ENUMERATION_LEGAL_CHARS = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-., ");
function firstOutsideEnumerationLegal(enumeration) {
    for (const c of enumeration) {
        if (!ENUMERATION_LEGAL_CHARS.has(c)) {
            return {
                found: true,
                char: c,
                label: codePointLabel(c.codePointAt(0) ?? 0),
            };
        }
    }
    return { found: false };
}
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
//
// (D-41 item 3, plan 27-33 — WR-02) AND THE CONTRACT ABOVE IS NOW HONOURED ON ITS OWN SUCCESS ARM.
// The paragraph above has promised since D-32 that a name is never silently dropped or altered, and
// the code beneath it did both. Measured against the committed parser before this edit:
//
//   tools: Agent(alpha, Task(beta), gamma)  ->  {ok:true, value:["Task(beta","alpha"]}
//   tools: Agent("alpha, beta", gamma)      ->  {ok:true, value:["\"alpha","beta\"","gamma"]}
//
// The first DROPPED `gamma` and invented `Task(beta`, because the scoped-grant expression's class stops
// at the first `)` and the capture truncates mid-enumeration. The second SPLIT one quoted name into
// two altered ones, because a comma inside a quoted scalar is content and not a separator. Both
// returned the SUCCESS arm, so the KIT-03 closure equality and coordinator-resolution-precheck's set
// equality would each have been computed over a set the document does not express — this module's
// founding failure, one level down, on the arm that claims to be safe.
//
// (D-47 item 2, plan 27-38 — round-5 IN-04) AND THE TWO CHECKS ABOVE WERE A DENYLIST. They named the
// two characters the round-4 finding happened to report, and the complement was assumed safe.
// Measured against the committed parser before this edit:
//
//   tools: Agent(alpha[,]b, gamma)  ->  {ok:true, value:["]b","alpha[","gamma"]}
//   tools: Agent(alpha{,}b, gamma)  ->  {ok:true, value:["alpha{","gamma","}b"]}
//
// A flow-collection delimiter is a character for which a comma is content rather than a separator,
// exactly like the quote — so one name was SPLIT INTO TWO ALTERED ONES on the arm this doc block
// promises is safe. `:`, `|`, `&` and `*` likewise returned altered names no loader computes.
//
// SO THE CHECK IS NOW AN ALLOWLIST: `ENUMERATION_LEGAL_CHARS` states the legal character set once,
// every other character refuses by name and by code point, and the two enumerated checks are DELETED
// because the allowlist is strictly broader than both. The reasoning is at the refusal site.
//
// (D-50, plan 27-41 — round-6 WR-03) AND ALL THREE PARAGRAPHS ABOVE ASSUMED THE CAPTURE EXISTED.
// D-32 made this function return a result; D-41 item 3 stopped it dropping and altering names; D-47
// item 2 replaced two enumerated checks with an allowlist. Each of those three asked a better
// question ABOUT `m[1]`. None of them asked whether there was an `m` at all — and for an occurrence
// whose capture never formed, the loop below finds no match, examines nothing, and returns the
// SUCCESS arm with an empty list. So the sentence this paragraph replaced — "THE ENUMERATION IS
// EXAMINED BEFORE IT IS SPLIT" — was true of every enumeration that could be captured and had no
// assertion behind it for the input class that never reached the examination. It is now true for
// every occurrence, because the OCCURRENCE is the unit and the capture is one of three things an
// occurrence can be (see `accountSpawnOccurrences`).
//
// THE STANDING QUESTION THIS LEAVES FOR THE NEXT READER. Before trusting a predicate's closure
// claim, ask which set it ENUMERATES — and then ask what happens to an input that never reaches it
// at all. A predicate can be provably total over its own input and still be defeated by a value that
// never becomes its input. That is the same shape as CR-01 one round earlier, where the predicates
// were correct and the value handed to them had been assembled wrong.
//
// SO THE ENUMERATION IS EXAMINED BEFORE IT IS SPLIT, AND REFUSED RATHER THAN PARSED BETTER — AND THE
// OCCURRENCE IS ACCOUNTED FOR BEFORE THE ENUMERATION IS SOUGHT. A quote-aware, nesting-aware split
// is a SECOND GRAMMAR for a value the platform's own loader reads with a first, and this module's
// rule is one authority per predicate. Refusing is the answer that cannot be wrong; parsing better is
// the answer that can. The scoped-grant expression itself is deliberately untouched — its truncation
// is what these checks DETECT, and making the expression cleverer would move the defect rather than
// close it, and would put a second grammar back where this phase just deleted one.
//
// `keysHaveSpawnGrant` IS DELIBERATELY NOT CHANGED BY ANY OF THIS. A file carrying an unterminated
// `Agent(` still carries the spawn token and is still convicted as a grant-carrier, which is correct
// and was correct before. The refusal belongs on the arm that returns NAMES, because names are what
// the KIT-03 closure equality is computed over.
export function keysGrantedAgentNames(keys) {
    const names = new Set();
    for (const v of toolsValues(keys)) {
        // (D-50) THE TOTAL ACCOUNTING, RUN BEFORE THE CAPTURE LOOP CONSUMES THIS VALUE.
        const occurrences = accountSpawnOccurrences(v);
        // THE COUNT IDENTITY, ASSERTED RATHER THAN ARGUED. This is what makes the three buckets an
        // ACCOUNTING instead of three tests standing next to each other: a bucket that silently stops
        // matching shows up as arithmetic that does not balance, not as a quiet reclassification. An
        // accounting that cannot balance is a check that was not performed, and this module's discipline
        // is that such a check is NAMED and never silent.
        const classified = GRANT_OCCURRENCE_KINDS.reduce((n, kind) => n + occurrences.filter((o) => o.kind === kind).length, 0);
        if (classified !== occurrences.length) {
            return {
                ok: false,
                reason: `the spawn-token accounting over \`${excerpt(v)}\` does not balance: ${occurrences.length} occurrence(s) of the grant token were found but ${classified} were classified as scoped, unscoped or neither; an accounting that cannot balance is a check that was NOT performed, so the value is refused rather than read as a name list — a name is never silently dropped or altered`,
            };
        }
        // BUCKET THREE REFUSES BY NAME. An occurrence that opens an enumeration the value never closes is
        // neither a scoped grant this module can read nor a bare grant the document actually wrote, and
        // returning the empty list for it would make those two facts indistinguishable from each other
        // and from a third — the whole of WR-03.
        const unclosed = occurrences.find((o) => o.kind === "neither");
        if (unclosed) {
            return {
                ok: false,
                reason: `the grant occurrence \`${excerpt(unclosed.fragment)}\` opens a scoped enumeration that is never closed in this value — the \`(\` after \`${unclosed.token}\` has no matching \`)\` — so the enumeration was never captured and the names these bytes were read as are not the names the document expresses; it is refused rather than returned as the empty list of an unscoped grant, on the same argument as an anchor or alias — a name is never silently dropped or altered`,
            };
        }
        SCOPED_GRANT.lastIndex = 0;
        let m;
        while ((m = SCOPED_GRANT.exec(v)) !== null) {
            // (D-47 item 2) ONE ENUMERATION CHECK, AGAINST THE STATED LEGAL SET. A reviewer reading this
            // function finds one enumeration check, not three.
            //
            // WHY THE TWO ENUMERATED CHECKS ARE DELETED RATHER THAN KEPT BESIDE THIS ONE. D-41 item 3
            // added two refusals, one naming a nested opening parenthesis and one naming a quote — each a
            // character that a finding had happened to report. `ENUMERATION_LEGAL_CHARS` is STRICTLY
            // BROADER than both: `(`, `"` and `'` are all outside the legal set, so every input the two
            // checks refused this one refuses too, and reverting to them could not restore a refusal this
            // loses. Keeping them beside it would be a pair of predicates where one suffices — and a pair
            // whose union is ASSUMED to be the complement of the legal set is exactly the shape that
            // produced this round's blocking finding one function away in this same module (the two-arm
            // delimiter refusal D-44 deleted). A denylist grows one reported spelling at a time: round 4
            // added two members, round-5 IN-04 reported a third class (a flow-collection delimiter), and a
            // fourth was only ever a report away. Stating the legal set closes every character no finding
            // has yet named, which is what makes this the last round for this predicate.
            const outside = firstOutsideEnumerationLegal(m[1]);
            if (outside.found) {
                return {
                    ok: false,
                    reason: `the grant enumeration \`${excerpt(m[1])}\` carries \`${outside.char}\` (${outside.label}), which is outside the legal character set of a grant enumeration; a character outside that set means the comma is not reliably the separator the document expresses, so the names these bytes were read as are not the names the document expresses, and the enumeration is refused rather than returned split, short or altered — a name is never silently dropped or altered`,
                };
            }
            for (const raw of m[1].split(",")) {
                const resolved = unquoteChecked(raw.trim());
                if (!resolved.ok) {
                    // (D-47 item 2, superseding plan 27-33's note) WHY THIS BRANCH IS UNREACHABLE THROUGH THIS
                    // FUNCTION, STATED ACCURATELY AND PINNED BY A CASE.
                    //
                    // The check that dominates it is the `ENUMERATION_LEGAL_CHARS` refusal above — no longer
                    // the quote check, which is deleted. Reaching here requires a fragment carrying a backslash
                    // inside a double-quoted region, so the enumeration must carry at least one of `"`, `'` or
                    // `\`; none of those three is a member of `ENUMERATION_LEGAL_CHARS`, so the enumeration
                    // refuses above and never reaches the split. The reason names the offending character and
                    // its code point rather than the escape sequence.
                    //
                    // THAT DOMINATION IS ASSERTED BY A CASE, not claimed here: the test file asserts each of
                    // those three characters is outside the constant. A code comment claiming a property is not
                    // the property, and this module has now corrected exactly that shape twice.
                    //
                    // It is kept rather than deleted because it enforces the D-32 allowlist decision at this
                    // call site and would become reachable again the moment the check above is narrowed. It is
                    // NOT a second opinion: it cannot disagree with the check above, only follow it.
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
//
// (D-50 — 27-REVIEW-GAPS-6 § IN-02, round 6) AND ONE SPELLING DEFEATED THAT ARGUMENT, RECORDED HERE
// WITH ITS MASKING RATHER THAN OVERSOLD. The paragraph above was true of every spelling except a
// BLOCK SCALAR. `coordinator: |` / `  "true"` flattened to the bare `true` — because the flush
// applied the quoting rule inside a construct YAML gives no quoting — so this predicate MATCHED on a
// document a real loader reads as the literal text `"true"`. A non-coordinator file could therefore
// claim the coordinator marker.
//
// IT WAS MASKED ON THE TREE AS IT STOOD, AND THE MASK IS NOT A PROPERTY OF THIS PARSER.
// `guard_wr05` checks that there is EXACTLY ONE coordinator, so a second file claiming the marker
// would have been caught by the cardinality check rather than by this predicate. That is defence in
// depth, and defence in depth is exactly the thing that must not be mistaken for correctness: the
// mask evaporates for ANY consumer of `keyHasValue` that does not also count coordinators. Closed at
// the source in `flush` (see the block-scalar exemption there) and pinned by a case that was RED
// against the committed build before that change.
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

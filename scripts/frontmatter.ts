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
// THE SCOPE THAT CLAIM HOLDS OVER, STATED RATHER THAN LEFT TO BE CHECKED WITH `grep` (plan 27-42,
// D-50, closing IN-05). The claim is: EXACTLY ONE GRAMMAR ON EVERY SURFACE A GUARD READS. It is not a
// claim about every `.ts` file in the tree, and a reader who checks it that way finds two others:
//
//   scripts/generate-catalog.ts — an eight-line local `parseFrontmatter` (`/^---\n([\s\S]*?)\n---\n/`
//     plus `^([A-Za-z_]+):\s*(.*)$`), with no folding, no quoting, no fence stripping and no failure
//     arm. Its only output is `docs/catalog/README.md` and its only gate is catalog-freshness.ts.
//   scripts/context-io.ts — a documented extension of that same flat key:value idiom, adding a
//     `refs:` list block, serving the `.grugops/context/` note format.
//
// NEITHER FEEDS A SPAWN-GRANT GUARD, so this is a CLAIM-ACCURACY correction and NOT a security
// finding — a later reader must not escalate it into one. What makes the scope mechanical rather than
// a promise is the derived assertion `D-50 IN-05 — the set of tracked .ts files carrying a LOCAL
// frontmatter-parsing construct is exactly the two named non-guard files` in scripts/frontmatter.test.ts:
// it scans every TRACKED `.ts` in the repository by PATTERN (not `scripts/` alone — `install/` and
// `hooks/` ship TypeScript too), sorts the result, compares it to exactly those two paths and pins its
// cardinality, so a THIRD grammar fails red by name wherever it lands. Its sibling case measures how
// far the two reach into the guard import graph: `generate-catalog.ts` is outside every frontmatter
// consumer's closure, and `context-io.ts` is NOT — it is reached through check-uat-oracles.ts — which
// is why the claim above is about the PREDICATE and the document class rather than about which files
// happen to share a process. That citation is the whole difference between this and a rewording.
//
// AND THE DECISION NOT TO MIGRATE THEM IS RECORDED SO THE OMISSION READS AS A DECISION. Migrating
// generate-catalog.ts onto this module would change what a byte-frozen generated artifact contains,
// drag catalog-freshness.ts into a parser change, and buy nothing on any guard surface — while the
// scoped-and-asserted claim buys the same protection (a third grammar cannot arrive quietly, and
// neither of the two can enter a guard's import graph unnoticed) at a fraction of the blast radius. A
// later phase that wants the migration starts from a claim that is already mechanically true.
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
// THIS IS ALSO THE ONE FENCE AUTHORITY, AND THE TEXT IT IS APPLIED TO IS NOW STATED PRECISELY
// (plan 27-45, D-53 — 27-REVIEW-GAPS-7 § WR-02). `stripFencedBlocks` lives here and is imported by
// check-foundation-guards.ts, so exactly one implementation in this tree answers the GENERAL question
// "which lines of a document are inside a ``` block", and it is this one.
//
//   THE SCOPE OF THAT SENTENCE IS DERIVED, NOT ASSERTED (plan 27-53, D-53 — round 9 § WR-02). It
//   used to end with an unqualified rider claiming no second fence parser was written "here or
//   anywhere", and that rider was FALSE ON THE DAY IT SHIPPED: three other tracked `.ts` files carry
//   a fence state machine of their own. A prose claim wider than the assertion behind it is this
//   repository's second systemic failure class in sentence form, so the scope is now MEASURED. The
//   case "the set of tracked `.ts` files carrying a FENCE STATE MACHINE is derived, sorted and
//   pinned at exactly the four named members" in scripts/frontmatter.test.ts enumerates every
//   tracked `.ts` by PATTERN — never by a hand-listed file name — classifies a machine as a
//   delimiter RECOGNISER plus a state TOGGLE in the same file, sorts, compares to a named set and
//   pins the cardinality at 4. A fifth machine fails it by name, and each construct in the
//   classifier is proven load-bearing on the live corpus.
//
//   THE OTHER THREE MEMBERS, EACH WITH THE DIFFERENT QUESTION IT ANSWERS:
//     • check-foundation-guards.ts — TWO caveman-block scopers, each GATED on a `## Caveman prompt`
//       heading (asserted, not asserted-about). Neither answers "is this line inside a ``` block"
//       for a document; each answers "where does the caveman block start and end", and neither can
//       run on a document that carries no such heading.
//     • generate-role-adapters.test.ts and check-foundation-guards.test.ts — HARNESS-LOCAL fixture
//       machines that deliberately do NOT import this module, because a fixture built by calling the
//       code under test makes the case's input a function of the thing being tested. That
//       non-circularity rationale is sound and is preserved unchanged; what this plan altered is
//       only that those machines are now MEMBERS OF A COUNTED SET instead of unaccounted grammars.
//
//   WHICH TEXT IT IS APPLIED TO: the PROSE BODY the guards check. Their adapter-body, tier-beat and
//   packaging-template checks each call it directly on the whole file they are about to read as
//   prose, exactly as before, and their behaviour is byte-unchanged.
//
//   WHICH TEXT IT IS NOT APPLIED TO: the FRONTMATTER REGION. `parseFrontmatter` no longer strips
//   anything; it locates the region on normalized text and hands the region's lines to the flattener
//   as written. A COLUMN-0 FENCE LINE IS NOT A LEGAL NODE IN A TOP-LEVEL BLOCK MAPPING — libyaml
//   rejects such a document outright with a syntax error — so a fence inside the region is content
//   this module CANNOT ACCOUNT FOR rather than documentation, and content this module cannot account
//   for goes to the failure arm. See the region scan for the refusal and its measurement.
//
//   WHAT THE ARGUMENT ABOVE REPLACED. This paragraph used to say "every consumer reads a
//   fence-stripped body, which is what keeps an illustrative frontmatter example inside a fenced
//   block from being read as a live marker or grant". The SECOND half of that is still true and still
//   load-bearing for the packaging templates, which legitimately SHOW frontmatter inside a fence: an
//   illustrative example in the BODY contributes nothing to the parsed keys, and a control case pins
//   it. What was wrong was the FIRST half as a mechanism — deleting lines is how the example was kept
//   out, and a deletion applied before the region was located deleted lines INSIDE the region too.
//   The example is now kept out by the region ENDING at its closing delimiter, and a fence reached
//   before that closing delimiter REFUSES. The strip's scope SHRANK; it was not widened.
//
//   SCOPED HONESTLY: THIS IS A CONTRACT DEFECT AND NOT A CONFIRMED LIVE BYPASS, and a later reader
//   must not escalate it into one. Measured against the committed build before this change, with
//   /usr/bin/ruby -ryaml (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) as the loader column:
//
//     d1  `name: r` / ``` / `tools: Read, Agent(o)` / ```      module {ok:true,value:false}, the whole
//                                                              `tools` key VANISHED   libyaml REJECTS
//     d2  `name: r` / `tools: Read,` / ``` / `  Agent(o)` / ``` module {ok:true, tools=["Read,"]}, the
//                                                              token DELETED          libyaml REJECTS
//     d3  `name: r` / `tools: "Read` / ``` / `Agent(o)` / ``` / `"`
//                                                              module REFUSES         libyaml ACCEPTS
//                                                              it as a grant
//
//   BOTH documents that exhibit the defect are rejected by a real loader, and the one spelling the
//   loader accepts (`d3`) the module ALREADY refuses — the safe direction, and it stays. No platform
//   impact was demonstrated and none is claimed. What IS defective is that content the module cannot
//   account for was silently REMOVED and the truncated remainder reported as a value on the SUCCESS
//   arm, when this module's own founding rule routes such content to the failure arm. The repository
//   cost of the reordering was measured at ZERO with the module's own classifier: over 1142 tracked
//   markdown files, 0 files' located region differs under the two orderings, and 0 of the 563 files
//   opening with a legal raw delimiter carry a column-0 fence inside their region.
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
// AND THE SAME SILENT-SUCCESS SHAPE A FIFTH TIME, SHIPPED INSIDE THE FIX FOR THE FOURTH
// (27-REVIEW.md § CR-01, round 10 -> plan 27-55, D-59). This one is not a condition bug and not an
// alphabet bug. It is a SCOPE bug: a KEY property standing in for a REGION property.
//
//   THE MECHANISM. D-50 established that YAML applies no quoting rules inside a `|` / `>` scalar, so
//   the flush skipped `unquoteChecked` for a block scalar's value. While a header could only ever be
//   recognised on the KEY LINE, "this value is a block scalar" and "this key is a block scalar" were
//   the same sentence. D-57 taught the module to recognise a header at all three positions a header
//   can appear — and carried the exemption forward on a STICKY PER-KEY flag (`sawBlock`). From that
//   moment one nested block scalar anywhere in a key switched the D-30 escape refusal off for EVERY
//   OTHER part of that key, including ordinary double-quoted siblings with nothing to do with it.
//   Measured against the committed build, with the loader column from /usr/bin/ruby -ryaml
//   (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1):
//
//     tools:                         REFUSED, naming `\x`. libyaml: {"a"=>"Agent(grugops-orchestrator)"}
//       a: "\x41gent(…)"
//
//     tools:                         {ok:true,value:false} — the SILENT NO-GRANT arm, over a live
//       a: "\x41gent(…)"             grant. libyaml: {"a"=>"Agent(grugops-orchestrator)","b"=>"x"}.
//       b: >-                        Two added lines, unrelated to the escape, flipped the verdict.
//         x
//
//   Adjacency and emptiness reached it too: the same escape AFTER the block scalar, and beside a
//   block scalar consuming ZERO content lines, both returned the same silent no-grant.
//
//   THE MODULE'S OWN ASYMMETRY WAS THE TELL, AND IT NAMED THE REMEDY. The block-SEQUENCE item path
//   resolved each item with `unquoteChecked` at the point it was pushed, so the item spelling of the
//   identical content still REFUSED; only the nested-mapping continuation path deferred its
//   resolution to the flush. One document, two spellings, two different verdicts.
//
//   THE REMEDY DELETES THE FLAG RATHER THAN TUNING IT. A key's value is now a list of REGIONS
//   (`Part`), each carrying its own answer to "is this text a block scalar's content", and the flush
//   resolves each region ON ITS OWN TERMS before the join. The exemption is a property of the region
//   the block scalar covers and of nothing else — so it cannot reach a sibling, it cannot reach the
//   `key:` introduction printed in front of the scalar, and there is no key-lifetime fact left for a
//   later position to widen. The escape allowlist is untouched in both directions: every region that
//   is not a block scalar's content answers to `unquoteChecked` byte for byte, and a backslash inside
//   a block scalar's own content is still content (row U6).
//
// Node stdlib ONLY — in fact no imports at all. Zero npm dependencies.
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a build-safety surface).

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

// The discriminated result every exported reader returns. `ok: true` carries the answer; `ok: false`
// carries a human-readable reason naming what could not be read. There is no third state and no
// nullable success value, so a consumer cannot accidentally treat "unreadable" as "absent".
export type Parsed<T> = { ok: true; value: T } | { ok: false; reason: string };

// Key -> every flattened value that key carried, in document order.
//
// A Map, not a plain object, on purpose: frontmatter keys come from file content, and a content-
// supplied `__proto__` / `constructor` key on a plain object is a prototype-pollution footgun in a
// module whose entire job is reading untrusted-ish text.
//
// The value is an ARRAY because a document may carry the same key twice. Nothing "wins": every
// occurrence is retained and the grant predicate tests ALL of them. Picking one would mean silently
// discarding the other, and a `tools:` line whose grant is discarded is a bypass — the failure mode
// this module exists to close. Retaining all occurrences is deterministic (document order) and is
// the only fail-safe reading.
export type FrontmatterKeys = Map<string, string[]>;

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
// (Plan 27-45, D-53) WHAT A FENCE DELIMITER LINE IS, DECLARED EXACTLY ONCE.
//
// This is the SAME expression `stripFencedBlocks` has always carried inline; it is hoisted, not
// rewritten, and the strip's behaviour is byte-unchanged. It is hoisted because the frontmatter
// region scan below must be able to ask the strictly simpler question "is THIS LINE a fence
// delimiter" without acquiring a second opinion about it.
//
// THIS IS NOT A SECOND FENCE PARSER, AND THE DIFFERENCE IS THE QUESTION EACH ASKS. `stripFencedBlocks`
// owns "WHICH LINES ARE INSIDE a fence" — the toggle, the state, the fail-safe on an unterminated
// fence — and it remains the only implementation of that in the tree. This constant is the CHARACTER
// CLASS the toggle keys on, declared once in the module's established style (`DELIMITER_WS_CHAR`,
// `VISIBLE_GLYPH`, `ENUMERATION_LEGAL_CHARS` are the same shape) so that two consumers cannot come to
// disagree about what a fence delimiter line looks like. Writing the expression out a second time at
// the region scan is the set-literal drift this repository has corrected three times; declaring the
// state machine a second time anywhere is forbidden outright.
const FENCE_DELIMITER_LINE = /^```/;

// (Plan 27-12) Moved here from check-foundation-guards.ts unchanged, so the frontmatter parser gets
// a fence-safe input without a second implementation and every existing prose check in the guards
// keeps behaving byte-identically. The guards import it back.
//
// (Plan 27-45, D-53 — 27-REVIEW-GAPS-7 § WR-02) AND THIS FUNCTION IS NO LONGER APPLIED TO THE
// FRONTMATTER REGION. `parseFrontmatter` used to hand it the WHOLE document before locating anything,
// so its line-dropping applied inside the region as readily as inside the body — see the parse entry
// point for the measurement and the reason. The body of this function is BYTE-UNCHANGED, its other
// consumers are byte-unaffected, and the strip's SCOPE SHRANK rather than grew: nothing here is
// widened, duplicated or applied twice.
export function stripFencedBlocks(text: string): string {
  const out: string[] = [];
  let inside = false;
  for (const line of text.split("\n")) {
    if (FENCE_DELIMITER_LINE.test(line)) {
      inside = !inside;
      continue; // the fence delimiter line is never emitted
    }
    if (inside) continue; // lines inside a fence are dropped (documentation, not live frontmatter)
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

// (D-57 — 27-REVIEW § family G/G2, round 10) A BLOCK-SCALAR HEADER AT A NODE-START POSITION,
// WHEREVER THAT POSITION IS — AND THIS IS NOT A SECOND INDICATOR GRAMMAR.
//
// `BLOCK_INDICATOR` was correct and was ASKED AT EXACTLY ONE of the positions YAML allows a header:
// the top-level key line's value. A `|` or `>` appearing as a NESTED mapping's value (`tools:` /
// `  nested: >-`), as a BLOCK-SEQUENCE ITEM (`  - >-`), or deeper was never recognised, so `block`
// stayed false, the scalar's LITERAL content was routed through `stripComment`, and a leading `#`
// deleted the rest of the line — returning `{ok:true, value:false}` over a live
// `Agent(grugops-orchestrator)` that `/usr/bin/ruby -ryaml` reads plainly in the loaded value. That
// took the whole foundation gate to `ALL CHECKS PASSED` at exit 0, re-measured byte-identical by
// five consecutive plans (27-47 .. 27-51).
//
// THE DEFECT WAS THE PREDICATE'S APPLICATION SET, NOT ITS CONDITIONS — the same failure class one
// abstraction level up from D-54, and the D-30 question ("which set does this enumerate?") asked
// about POSITIONS. So this function CALLS the one constant rather than restating it, and calls
// `KEY_LINE` for the `key: <header>` spelling rather than respelling a key grammar. Both are the
// module's existing authorities; nothing here decides what a header LOOKS LIKE.
//
// `leading` is the text that precedes the indicator and is NOT part of the scalar — the `key:` of a
// nested mapping entry, or the empty string for a bare header. It is kept because the loader keeps
// it: `/usr/bin/ruby -ryaml` flattens `{"nested"=>"Read, # x, T"}` as `nested: Read, # x, T`, and
// dropping it would move this module's value away from the loader's on a document the loader
// accepts.
interface BlockHeader {
  readonly leading: string;
  // The line break this scalar's content lines are joined with, DERIVED FROM THE INDICATOR'S OWN
  // FIRST CHARACTER — see `blockLineBreak`.
  readonly lineBreak: string;
  // (D-57) DOES THE INTRODUCTION IN FRONT OF THIS HEADER CARRY A MAPPING-VALUE INDICATOR? This is
  // the ONE derived fact that decides the header's position gate on a continuation line, and it is
  // derived from a property of YAML's grammar rather than from a list of shapes.
  //
  // THE RULE: A PLAIN SCALAR CANNOT SPELL A MAPPING-VALUE INDICATOR. YAML 1.2 excludes `:` followed
  // by a separation from `ns-plain-char`, so a line that carries one — `key: <header>` or a bare
  // `: <header>` — is EITHER real mapping structure or a document the loader refuses outright. There
  // is no third case, and therefore no loader value for this module to disagree with when it is
  // wrong. Such a line needs only the carried scalar to be CLOSED.
  //
  // The other two introductions — a bare `<header>` and the explicit-key `? <header>` — CAN both
  // appear inside a plain scalar, so they keep the full `startsNode` gate. Measured with
  // `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1); the first four rows are
  // documents the loader ACCEPTS and MUST be recognised, the last four are the discriminating pairs:
  //
  //   tools:              ACCEPT  {"tools"=>{"a"=>"Read","b"=>"q,"}}     `b: >-` is a header
  //     a: Read                   (`startsNode` is FALSE here — this key's node already began)
  //     b: >-
  //   tools:              ACCEPT  {"tools"=>[{"k"=>"v","j"=>"q,"}]}      `j: >-` is a header
  //     - k: v
  //       j: >-
  //   tools:              ACCEPT  {"tools"=>{"k"=>"q,"}}                 `: >-` is a header
  //     ? k                       (`startsNode` is FALSE here too)
  //     : >-
  //   tools:              ACCEPT  {"tools"=>{"q,"=>"v"}}                 `? >-` is a header
  //     ? >-
  //     : v
  //
  //   tools: see          REJECT  mapping values are not allowed in this context
  //     foo: >-                   -> no loader value; recognising it costs nothing
  //   tools: see          REJECT  did not find expected key while parsing a block mapping
  //     : >-                      -> no loader value; recognising it costs nothing
  //   tools: see          ACCEPT  {"tools"=>"see >- q,"}                 `>-` is CONTENT
  //     >-                        -> recognising it would DELETE bytes from a loader-accepted value
  //   tools: see          ACCEPT  {"tools"=>"see ? >- q,"}               `? >-` is CONTENT
  //     ? >-                      -> same; the `?` form keeps the node-start gate
  //
  // ONE RECOGNISER, ONE DERIVED GATE. This is not a second grammar: `blockHeaderAt` remains the only
  // thing that decides what a header LOOKS like, and it calls `BLOCK_INDICATOR`, `KEY_LINE` and
  // `BLOCK_MAP_EXPLICIT` to do it. What this field decides is WHERE each introduction is allowed to
  // introduce one, which is the question D-57 is about.
  readonly mappingValueIndicator: boolean;
}

// (D-57) HOW A BLOCK SCALAR JOINS ITS LINES, WHICH IS THE INDICATOR'S OWN MEANING AND NOT A
// FORMATTING CHOICE. YAML 1.2 § 8.1.2 (literal `|`) PRESERVES each line break; § 8.1.3 (folded `>`)
// FOLDS it to a single space. This module joined BOTH with a space, and row g5 measured what that
// costs: `nested: |` / `    Agent(alpha, ga` / `    - mma)` enumerated `["alpha","ga - mma"]` while
// `/usr/bin/ruby -ryaml` expresses `Agent(alpha, ga\n- mma)`, whose enumeration this module's own
// `ENUMERATION_LEGAL_CHARS` REFUSES (a line break is outside the legal set). So the module returned
// two names on the success arm for a value the loader will not enumerate at all — the KIT-03 / D-09
// direction, one spelling over.
//
// THE DIRECTION OF THIS CHANGE IS MEASURED, NOT ARGUED. Swapping a space for a line break BETWEEN
// two content lines cannot move a grant verdict: `SPAWN_TOKEN` tests a WORD BOUNDARY, and a space
// and a line break are both non-word characters, so every `\bAgent\b` / `\bTask\b` boundary that
// existed before exists after. The value's LENGTH is
// unchanged, so no loader-accepted document returns a SHORTER value. What moves is the NAME SET,
// and it moves from a possibly-invented list to a REFUSAL — the loud arm, and the one the loader
// agrees with.
const blockLineBreak = (indicator: string): string =>
  indicator.startsWith("|") ? "\n" : " ";

function blockHeaderAt(text: string): BlockHeader | null {
  // INTRODUCTION 1 OF 4 — none. The header IS the whole line: a block-sequence item's text after
  // `SEQ_ITEM` has consumed its dashes, or a continuation line that is itself the node.
  if (BLOCK_INDICATOR.test(text)) {
    return { leading: "", lineBreak: blockLineBreak(text), mappingValueIndicator: false };
  }
  // INTRODUCTION 2 OF 4 — the IMPLICIT block-mapping key, `key: <header>` (YAML 1.2 § 8.2.2).
  const kv = text.match(KEY_LINE);
  if (kv !== null) {
    const indicator = (kv[2] ?? "").trim();
    if (BLOCK_INDICATOR.test(indicator)) {
      return {
        leading: `${kv[1]}:`,
        lineBreak: blockLineBreak(indicator),
        mappingValueIndicator: true,
      };
    }
  }
  // INTRODUCTIONS 3 AND 4 OF 4 — the EXPLICIT block-mapping key and value indicators.
  const explicit = text.match(BLOCK_MAP_EXPLICIT);
  if (explicit !== null) {
    const indicator = (explicit[2] ?? "").trim();
    if (BLOCK_INDICATOR.test(indicator)) {
      return {
        leading: explicit[1],
        lineBreak: blockLineBreak(indicator),
        // Only `:` is a mapping-VALUE indicator. `?` introduces a key and a plain scalar can spell
        // it, so it keeps the node-start gate — see `BlockHeader.mappingValueIndicator`.
        mappingValueIndicator: explicit[1] === ":",
      };
    }
  }
  return null;
}

// A block-sequence item on a continuation line: a dash, then either end-of-line or the item text.
//
// EXPORTED (D-54) SO THE COMPACT-NESTED-SEQUENCE TERMINATION CASE CITES THIS CONSTANT RATHER THAN A
// COPY OF IT. The item path re-applies this regex once per dash, and the loop's termination condition
// IS this pattern failing to match; a case that restated the pattern would be asserting against its
// own copy — the weaker-duplicate shape this module deletes on sight — and would keep passing after
// the real constant changed.
export const SEQ_ITEM = /^-(?:[ \t]+(.*))?$/;

// (D-57) THE EXPLICIT BLOCK-MAPPING KEY AND VALUE INDICATORS, WRITTEN IN `SEQ_ITEM`'S OWN SHAPE
// BECAUSE THEY ARE THE SAME KIND OF PRODUCTION.
//
// YAML 1.2 gives block context exactly FOUR ways to introduce a node on a line: the block-sequence
// entry `-` (§ 8.2.1, which is `SEQ_ITEM`), the implicit block-mapping key `key:` (§ 8.2.2, which is
// `KEY_LINE`), and the explicit block-mapping key `?` and value `:` (§ 8.2.2, which is this). That
// set is CLOSED — it comes from the grammar's four productions, not from the spellings a red team
// happened to report — and `blockHeaderAt` below asks all four.
//
// FOUND BY THIS PLAN'S OWN ADVERSARIAL PASS (a), ON ITS OWN POST-FIX BUILD. Asking the question
// "which SET of positions does this predicate apply to" against the FIXED module — rather than
// declaring victory once the reported families went green — turned up `tools:` / `  ? k` / `  : >-`
// and `tools:` / `  ? >-` / content / `  : v` as two further live silent-no-grants, both documents
// libyaml ACCEPTS with the grant in the loaded value. A predicate asked at three of the four
// positions its grammar defines is the same defect as one asked at one of them.
const BLOCK_MAP_EXPLICIT = /^([?:])(?:[ \t]+(.*))?$/;

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
const stripLeadingTag = (s: string): string => s.replace(LEADING_TAG, "");

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
function startsWithReference(text: string): boolean {
  const t = text.trim();
  if (YAML_REF.test(t)) return true;
  const afterTag = stripLeadingTag(t);
  // A tag may introduce an anchor rather than a collection (`!!str &t …`), so re-test the node start
  // once the node's property has been removed from in front of it.
  if (YAML_REF.test(afterTag)) return true;
  if (!/^[[{]/.test(afterTag)) return false;
  for (const fragment of afterTag.split(/[,[{]/)) {
    const node = stripLeadingTag(fragment.trim());
    if (YAML_REF.test(node)) return true;
    // A flow MAPPING entry is `key: value`, so the value after the separator is its own node start.
    const sep = node.indexOf(": ");
    if (sep !== -1 && YAML_REF.test(stripLeadingTag(node.slice(sep + 2).trim()))) {
      return true;
    }
  }
  return false;
}

// (D-48) THE QUOTE STATE A SCALAR LEAVES OPEN AT A LINE BOUNDARY. Declared as ONE type because ONE
// field carries it and THREE consumers read it — the comment scanner, the node-start reference test
// and the block-sequence item boundary. It is compared as a single CODE POINT (`"` or `'` or none),
// never as a flag pair reconstructed at a call site: two answers to "am I inside a scalar" is the
// shape that produced this defect one function away.
export type QuoteState = '"' | "'" | null;

// ---------------------------------------------------------------------------
// (D-51 — 27-REVIEW-GAPS-7 § CR-01, round 8) THE SCANNER'S CARRIED STATE: ONE RECORD, ONE AUTHORITY
// ---------------------------------------------------------------------------
//
// EVERYTHING THAT MAY CROSS A LINE BOUNDARY, DECIDED INSIDE THE ONE WALK THAT VISITS THE POSITION.
// D-48 promoted quote state to a property of the SCALAR and gated the carry on a node start. Both
// moves were right and both were verified against libyaml. What was wrong was WHERE the gate was
// applied: a separate helper re-derived "is this text a node start" from the FIRST TOKEN OF A LINE,
// at three call sites, and the union of those three arms was not the set of node starts. Measured
// against the committed build, two whole families of live `Agent(grugops-orchestrator)` grants came
// back on the silent no-grant SUCCESS arm:
//
//   family (a)  the key line carries NO value, so the CONTINUATION line is the node start.
//               `tools:` / `  "Read,` / `  # x, Agent(grugops-orchestrator)"` -> {ok:true,value:false}
//   family (b)  the quoted scalar opens MID-LINE inside a flow collection.
//               `tools: [Read,` / `  "Write,` / `  # x, Agent(…)"]`           -> {ok:true,value:false}
//
// They are ONE FACT: *may a node begin at THIS OFFSET* is a property of the position, and the only
// place the position is known is inside the walk that reaches it. So the three fields below travel
// together through the scanner and the three sites store what it returns, unconditionally.
export interface ScalarState {
  // The quote a scalar has left OPEN across the boundary — and ALREADY GATED. It is non-null only
  // when the still-open quote was opened at an offset where a node may begin, which is what keeps an
  // apostrophe inside a plain scalar (`- headroom for 27-06's frontmatter key`) from propagating a
  // phantom open quote and swallowing the next line's item boundary. That regression was caught only
  // by the before/after value map over every tracked markdown file, so the fact survives here as
  // CODE at the character where the quote opens rather than as a second opinion beside the walk.
  openQuote: QuoteState;
  // Unclosed `[` and `{` seen OUTSIDE quotes. A comma introduces a node only inside a flow
  // collection — the same rule `startsWithReference` already applies to a sigil — so the depth is
  // what makes that question answerable at the character rather than at the line.
  flowDepth: number;
  // May a node begin at the position the walk has REACHED? True after an opener, after a comma and
  // after a flow mapping's `: ` separator; false once a content character of a node is consumed.
  nodeMayBegin: boolean;
}

// (D-51, red-team round) THE NODE PROPERTIES THAT STAND IN FRONT OF A NODE START WITHOUT CONSUMING
// IT — WRITTEN FROM THE SAME GRAMMAR `LEADING_TAG` AND `YAML_REF` ALREADY DECLARE, NEVER A SECOND ONE.
//
// YAML 1.2 § 6.9: a node's PROPERTIES (its tag and/or its anchor) precede the node's content. So at a
// position where a node may begin, `!!str`, `!<verbatim>`, a bare `!` and `&name` are all still
// BEFORE the node — the scalar that follows them opens at a node start, and its quote is a real
// quote. The tag alternative below is `LEADING_TAG`'s body character-for-character (indicator, then
// either a verbatim `<…>` or the run of non-space non-flow characters); the anchor alternative is
// `YAML_REF`'s `&` arm with that same run. Two spellings of one grammar in this module would be the
// weaker-duplicate shape it deletes on sight, so these are the SAME spellings, reused.
//
// WHY THIS CANNOT REOPEN THE PLAIN-SCALAR APOSTROPHE HOLE. It is consulted ONLY where a node may
// ALREADY begin, and it never SETS that answer — it only declines to clear it. `R&D` and
// `it's !important` sit at positions where the answer is already false, so they are content, exactly
// as before, and the repository-wide value map is what proves it rather than this paragraph.
// (D-54, round 9) THE VERBATIM ALTERNATIVE IS WIDER THAN YAML'S, AND IT IS LEFT THAT WAY ON PURPOSE —
// MEASURED, NOT OVERLOOKED. `<[^>]*>` admits `!<x #y>`, a "tag" containing a space, which YAML 1.2
// § 5.6 does not define (`ns-uri-char` excludes whitespace) and which libyaml rejects outright:
// `did not find the expected '>' while scanning a tag`. The obvious tidy-up is `<[^\s>]*>`.
//
// IT WAS TRIED, MEASURED AND REVERTED, AND THE MEASUREMENT IS WHY. Over the same generated
// single-line corpus the D-54 differential uses (6194 inputs x 24 entering states = 148656 cells):
//
//   with `[^>]*`   (kept)      4 cells move, all on `a: !<x #y> z`, all at flow depth 0, and every
//                              one of them moves in the LENGTHEN direction — the module keeps text a
//                              `#` used to end, so a token behind that hash becomes MORE visible.
//   with `[^\s>]*` (reverted) 24 cells move, and 20 of them are positions the pre-edit build ALREADY
//                              reached (`!<x #y> z` at offset 0, `[a, !<x #y> z]`, `{a: !<p #q> r}`).
//                              Every one moves in the SHORTEN direction: text that was kept is now
//                              cut at the hash, which is this module's founding failure — content it
//                              cannot account for, deleted, and the remainder returned on the SUCCESS
//                              arm.
//
// So the narrower grammar is the more correct one and the wider one is the safer one, and where those
// disagree this module takes the safe direction on documents no loader accepts. A later reader who
// wants the narrowing must first close the shorten direction it opens, not merely observe that YAML
// agrees with them.
const NODE_PROPERTY_AT_NODE_START =
  /^(?:!(?:<[^>]*>|[^\s[\]{},]*)|&[^\s[\]{},]+)(?=[\s[\]{},]|$)/;

// The state a KEY LINE seeds from: nothing open, no collection, and a node may begin at offset 0. A
// key line begins a new node, so no scalar from the previous key can still be open across it — this
// is the asymmetry D-48 recorded, now expressed as a value instead of as a literal `null` seed plus
// a paragraph explaining it.
const FRESH_NODE: ScalarState = {
  openQuote: null,
  flowDepth: 0,
  nodeMayBegin: true,
};

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
//
// (D-51 — 27-REVIEW-GAPS-7 § CR-01, round 8) AND THIS WALK IS NOW THE MODULE'S ONE AUTHORITY ON WHAT
// MAY CROSS A LINE BOUNDARY. It is TOLD whether offset 0 of the line it is handed is a node start in
// the BLOCK structure (a fact only the flattener's loop can know), it TRACKS flow-collection depth
// and whether a node may begin at the offset it has reached, and it RETURNS an ALREADY-GATED state.
// The three call sites perform ONE assignment each — store what came back — and re-decide nothing.
//
//   WHY THE SEPARATE GATE WAS DELETED RATHER THAN KEPT BESIDE THIS WALK. The deleted helper asked
//   "does this TEXT start with a quote", i.e. it re-derived the node start from the first token of a
//   line. Its argument was right — a quote character is only a quote where a node may begin, and an
//   apostrophe inside a plain scalar is ordinary text — and its VANTAGE POINT was wrong: a node also
//   begins on a continuation line when the key line carried no value (family a), and mid-line after
//   a `[`, a `{`, a `,` or a `: ` inside a flow collection (family b). Neither is visible from the
//   first token of a line, so the union of the three arms it served was NOT the set of node starts —
//   this repository's own recurring defect class, in the very file that names it. A weaker duplicate
//   that still votes is worse than none, and this module has now deleted one three times. The
//   argument survives as the `openedAtNodeStart` flag below, decided at the character where the
//   quote opens, which is the only place the position is actually known.
//
// WITHIN-LINE BEHAVIOUR IS BYTE-UNCHANGED, AND THAT IS ASSERTED RATHER THAN CLAIMED. The escaped-
// character skip, both quote toggles and the comment condition are exactly what they were; the
// additions below decide only what SURVIVES the boundary, never what the line MEANS. A differential
// over a generated single-line corpus asserts the returned `text` equals the pre-D-51 build's output
// for every input and every entering quote state (scripts/frontmatter.test.ts, the single-line
// byte-identity differential, against scripts/fixtures/frontmatter-singleline-pre-d51.json).
//
// Exported for that differential: the claim is about THIS function's output, so the case calls THIS
// function rather than inferring its behaviour from a value three transformations downstream.
//
// (D-54 — 27-REVIEW-GAPS-8 § CR-01, round 9) AND THE ANSWER IS NOW A PROPERTY OF THE STRUCTURAL
// POSITION RATHER THAN OF THE SPELLINGS A RED TEAM ENUMERATED. The walk raised `mayBegin` only for
// FLOW constructs, and only where `depth > 0`. YAML gates none of the three indicators that way, so
// the union of the chain's arms was — for the ninth time in this phase, about the ninth predicate —
// NOT the set of YAML's node starts. Measured against the committed build, seven documents libyaml
// ACCEPTS with a live `Agent(grugops-orchestrator)` in the loaded value came back
// `{ok:true,value:false}`, the silent no-grant SUCCESS arm, and four of them took the whole
// foundation gate to `ALL CHECKS PASSED` at exit 0 on a non-coordinator skill. The transcripts are in
// 27-47-SUMMARY.md; the rows are cases below.
//
// THE REMEDY REMOVES CONDITIONS; IT DOES NOT APPEND ARMS. The chain below has the SAME NUMBER OF ARMS
// it had before (five), because a fifth spelling is the shape this module has now declined six times:
//
//   • the EXPLICIT-KEY indicator lost `depth > 0` and carries YAML's own condition instead — a `?`
//     introduces a key node in BLOCK context at a line's structural start with a separation after it,
//     which is why `? "Read,` on an indented line is a node start and `?"Read,` is not.
//   • the MAPPING SEPARATOR lost `depth > 0` outright. Its separation condition is kept and widened to
//     YAML 1.2's actual rule: whitespace, end of line, OR a JSON-like key that just closed inside a
//     flow collection — the flow-domain half D-51 was written to own and did not reach.
//   • `jsonLikeKeyJustClosed` is that last fact, tracked in THIS walk, at the character where the
//     quote closes. A second opinion computed anywhere else is the weaker-duplicate shape this module
//     deletes on sight.
//
// TWO FACTS THE CALLER SUPPLIES, AND THEY ARE NOT THE SAME FACT. `nodeStartAtOffsetZero` says A NODE
// MAY BEGIN at offset 0; `lineStartAtOffsetZero` says THE PHYSICAL LINE BEGINS at offset 0. They come
// apart at exactly one of the three seeding sites — the KEY LINE, where the flattener has already
// consumed `key:` before calling, so a node may begin at offset 0 of what it hands over while the
// line began several characters earlier. The block indicators need the SECOND fact, which is why a
// single boolean could not carry both: `description: ? maybe` must stay content on a key line
// (libyaml in fact REJECTS that whole document — `mapping keys are not allowed in this context` —
// so the module's no-grant answer there agrees with a loader that has no value to grant from), while
// `tools:` / `  ? "Read,` on a continuation line is the explicit key libyaml reads it as.
export function stripComment(
  s: string,
  entering: ScalarState,
  nodeStartAtOffsetZero: boolean,
  lineStartAtOffsetZero: boolean,
): { text: string; state: ScalarState } {
  let sq = entering.openQuote === "'";
  let dq = entering.openQuote === '"';
  let depth = entering.flowDepth;
  // A quote that is already open was gated when it opened, so the scalar it belongs to began at a
  // node start by construction; there is nothing left to decide about it here.
  let openedAtNodeStart = entering.openQuote !== null;
  // Inside an open scalar every character is content, so no node may begin. Otherwise the walk
  // resumes from the answer it left at the end of the previous line, RAISED to true when the block
  // structure says this whole line is itself a node start. Two different inputs to one question,
  // combined ONCE, here — never re-derived at a call site.
  let mayBegin =
    entering.openQuote !== null
      ? false
      : nodeStartAtOffsetZero || entering.nodeMayBegin;
  // (D-54) THE LINE'S STRUCTURAL START, CONSUMED BY THE FIRST CHARACTER THAT IS NOT WHITESPACE. A
  // block indicator introduces a node only where the BLOCK structure allows a node to be introduced,
  // and inside a scalar that is already open nothing on this line is structural at all. It is never
  // raised again on the same line — a `?` further along is an ordinary plain-scalar character, which
  // is the false-red control this arm has carried since D-51 and which the loader agrees with.
  let atLineStructuralStart =
    entering.openQuote === null && lineStartAtOffsetZero;
  // (D-54) A JSON-LIKE KEY JUST CLOSED AT THIS DEPTH, so the mapping separator that follows needs no
  // whitespace — YAML 1.2 § 7.20 lets `{"a":"v"}` omit it when the key is JSON-like. Raised where a
  // quote CLOSES and where a `]`/`}` closes, cleared by any other content character, and DELIBERATELY
  // NOT CLEARED BY WHITESPACE: that is the whole of why `{"a" :"v"}` behaves as the loader behaves.
  // It does not cross the line boundary and is not in `ScalarState`, because a flow mapping split
  // between the closing quote and its separator is a document libyaml REJECTS outright
  // (`{"a"` / `  :"v"}` -> `did not find expected ',' or '}'`), so there is no value there to agree
  // with — measured, not assumed, and recorded in 27-47-SUMMARY.md.
  let jsonLikeKeyJustClosed = false;

  const exiting = (): ScalarState => ({
    // THE WHOLE GATE, IN ONE EXPRESSION: a still-open quote crosses the boundary only when it was
    // opened where a node may begin.
    openQuote: dq && openedAtNodeStart ? '"' : sq && openedAtNodeStart ? "'" : null,
    flowDepth: depth,
    nodeMayBegin: mayBegin,
  });

  // (D-54) A SEPARATION AFTER AN INDICATOR, WRITTEN ONCE AND READ BY THE TWO ARMS THAT NEED IT.
  // YAML separates an indicator from the node it introduces with whitespace or a line break; at the
  // end of the string the break is the line ending itself. Two arms ask this question and there is
  // one expression for it — the same reason the tag grammar below is reused rather than respelled.
  const separationFollows = (i: number): boolean =>
    i + 1 >= s.length || s[i + 1] === " " || s[i + 1] === "\t";

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    // (D-54) BOTH CARRIED FACTS ARE READ FOR THIS CHARACTER AND THEN CONSUMED BY IT. Snapshotting
    // before the update is what lets an indicator ask "was I at the line's structural start" and
    // "did a JSON-like key just close" about the position it OCCUPIES rather than the one it leaves.
    const atStructuralStart = atLineStructuralStart;
    const afterJsonLikeKey = jsonLikeKeyJustClosed;
    if (c !== " " && c !== "\t") atLineStructuralStart = false;
    if (dq && c === "\\") {
      i += 1; // an escaped character inside double quotes is never a delimiter
      // Inside a double-quoted scalar an escape is content, so no key has just closed.
      jsonLikeKeyJustClosed = false;
      continue;
    }
    if (c === '"' && !sq) {
      if (!dq) openedAtNodeStart = mayBegin;
      dq = !dq;
      mayBegin = false;
      // (D-54) A CLOSING quote ends a JSON-like key; an OPENING one begins a scalar's content.
      jsonLikeKeyJustClosed = !dq;
    } else if (c === "'" && !dq) {
      // (D-54 remedy shape, round 10 — 27-REVIEW § CR-01) THE WALK DERIVES ITS CLOSING SET FROM THE
      // QUOTE STYLE'S OWN ESCAPE RULE INSTEAD OF ENUMERATING `'` AS UNCONDITIONALLY CLOSING.
      //
      // In YAML a `''` inside an ALREADY-OPEN single-quoted scalar is the escaped apostrophe — it is
      // CONTENT and it does not close the scalar. This arm used to toggle it as close-then-reopen, so
      // on the second quote `sq` was momentarily false, `if (!sq)` fired, and the scalar's node-start
      // provenance was RECOMPUTED from a `mayBegin` the FIRST quote of the pair had already set false.
      // A scalar that genuinely opened at a node start was then recorded as not having, and
      // `exiting()` returned `openQuote: null` for a scalar `sq` says is still open — the truncated
      // remainder on the `{ok:true}` SUCCESS arm, this module's founding failure.
      //
      // THE MODULE ALREADY HELD AN AUTHORITY THAT KNOWS THIS. `unquoteChecked` has always resolved the
      // construct correctly (`.replace(/''/g, "'")`, line ~945 below). The walk stated a SECOND,
      // contradicting grammar for the same construct — the weaker-duplicate shape this module deletes
      // on sight. One grammar, stated once: the walk consumes the escape, the unquote resolves what
      // the walk left.
      //
      // AND THIS IS THE TREATMENT THE OTHER QUOTE STYLE ALREADY GETS, three lines up: the
      // `dq && c === "\\"` skip owns the double-quote escape with the same index arithmetic and the
      // same "nothing closed, so nothing is recomputed" reasoning. The asymmetry was the defect.
      //
      // THE REMEDY REMOVES A CONDITION'S ABILITY TO DECIDE; IT ADDS NO ARM. The `else if` count of this
      // chain is unchanged — a fifth spelling is the shape this module has now declined seven times.
      if (sq && s[i + 1] === "'") {
        i += 1; // consume EXACTLY the second quote of the pair; the loop's own i++ moves past it
        mayBegin = false;
        jsonLikeKeyJustClosed = false;
        continue; // `openedAtNodeStart`, `sq` and the exiting gate are UNTOUCHED — nothing closed
      }
      if (!sq) openedAtNodeStart = mayBegin;
      sq = !sq;
      mayBegin = false;
      jsonLikeKeyJustClosed = !sq;
    } else if (c === "#" && !sq && !dq && (i === 0 || /[ \t]/.test(s[i - 1]))) {
      // A comment runs to end-of-line and is only ever entered from OUTSIDE quotes, so nothing is
      // left open behind it. The exiting state is derived from the same flags as the fall-through
      // below rather than being asserted a second way — and a comment consumes no CONTENT, so a node
      // may still begin on the next line of an open flow collection, which libyaml agrees with.
      return { text: s.slice(0, i), state: exiting() };
    } else if (!sq && !dq) {
      // A NODE PROPERTY STANDS IN FRONT OF A NODE START; IT DOES NOT CONSUME ONE. Reached only where
      // a node may ALREADY begin, so it can never CREATE a node start — `R&D` and `it's !important`
      // in a plain scalar are content, `mayBegin` is already false there, and this leaves it false.
      // Found by red-teaming this very fix: `tools: [!!str "Read,` / `  # x, Agent(…)"]` had the tag
      // consumed as content, so the quote after it opened at a non-node-start and its state died at
      // the boundary — the silent no-grant arm, a tenth time, inside the walk written to close the
      // ninth. See `NODE_PROPERTY_AT_NODE_START` for why this reuses the declared tag grammar.
      if (mayBegin) {
        const property = s.slice(i).match(NODE_PROPERTY_AT_NODE_START);
        if (property !== null) {
          i += property[0].length - 1; // the loop's own `i++` consumes the last character
          // A tag or an anchor is content standing in front of the node; no key closed here.
          jsonLikeKeyJustClosed = false;
          continue; // `mayBegin` stays true: the node itself has still to begin
        }
      }
      // OUTSIDE quotes: the structure decides where the next node may begin.
      if (c === "[" || c === "{") {
        depth += 1;
        mayBegin = true;
        jsonLikeKeyJustClosed = false;
      } else if (c === "]" || c === "}") {
        depth = depth > 0 ? depth - 1 : 0;
        mayBegin = false;
        // (D-54) A closed flow collection is a JSON-LIKE key just as a closed quote is: `{[1]:"v"}`
        // needs no space after the separator either. Same fact, same walk, same character.
        jsonLikeKeyJustClosed = true;
      } else if (
        (c === "," || c === "?") &&
        // A comma introduces a node only INSIDE a flow collection. At depth 0 it is content — the
        // same distinction `startsWithReference` makes, and what keeps `tools: Read,` / `  don't`
        // from licensing a crossing on the apostrophe. That scoping is UNTOUCHED.
        //
        // (D-54) `?` IS THE EXPLICIT-KEY INDICATOR, AND ITS `depth > 0` CONDITION WAS NEVER YAML'S.
        // The comment that stood here said `?` is "scoped to flow for the same reason the comma is",
        // and that was measured false: `tools:` / `  ? "Read,` / `  # x, Agent(…)"` / `  : v` loads
        // as `{"Read, # x, Agent(grugops-orchestrator)"=>"v"}` while this module returned
        // `{ok:true,value:false}`, and the same plant took the whole foundation gate to
        // `ALL CHECKS PASSED` at exit 0. So the depth condition is REPLACED, not supplemented, by the
        // condition YAML actually states — a block explicit key stands at the line's structural start
        // with a separation after it.
        //
        // THE FALSE-RED ARGUMENT THE OLD COMMENT MADE SURVIVES, RESTATED AGAINST THE NEW CONDITION.
        // Two positions keep `?` as ordinary plain-scalar content, and each has a case: the same
        // character LATER on the line (`tools:` / `  a ? b` — the structural start is already spent),
        // and the same character in a KEY LINE's value position (`description: ? maybe` — the
        // flattener consumed `description:` first, so `lineStartAtOffsetZero` is false there). The
        // old comment offered `description: ? maybe` as documentation a loader accepts; libyaml in
        // fact REJECTS that document outright, so the position is kept for the reason that survives
        // measurement — the line did not begin there — rather than for the one that did not.
        (depth > 0 || (c === "?" && atStructuralStart && separationFollows(i)))
      ) {
        mayBegin = true;
        jsonLikeKeyJustClosed = false;
      } else if (
        c === ":" &&
        // (D-54) THE MAPPING SEPARATOR'S `depth > 0` CONDITION IS GONE. A `key: value` entry is a
        // mapping entry in BLOCK context exactly as it is in flow, and the value after the separator
        // is its own node start in both — which is what `tools:` / `  nested: "Read,` expresses and
        // what this module read as a non-node-start for nine rounds. This ONE arm now serves the
        // block mapping, the flow mapping, and the mapping inside a sequence item alike.
        //
        // AND ITS SEPARATION CONDITION IS NOW YAML 1.2'S ACTUAL ONE. Whitespace or end of line, OR a
        // JSON-LIKE KEY THAT JUST CLOSED inside a flow collection — `{"a":"v"}` is legal with no
        // space, and `{"a" :"v"}` is the same entry with the space put somewhere the fact does not
        // notice. That second disjunct is the flow-domain half D-51 was written to own and did not
        // reach: `frontmatter.test.ts` pinned `tools: {a: "Read,` and nothing pinned the
        // JSON-adjacent sibling one character away. A CONTENT character between the closing quote and
        // the separator clears the fact, so `{"a"x:"Read,` is not a mapping entry here — and libyaml
        // rejects that document, so the module's no-grant answer agrees with a loader that has no
        // value to grant from.
        (separationFollows(i) || (depth > 0 && afterJsonLikeKey))
      ) {
        mayBegin = true;
        jsonLikeKeyJustClosed = false;
      } else if (c !== " " && c !== "\t") {
        // A content character of a node has been consumed; whitespace consumes nothing.
        mayBegin = false;
        jsonLikeKeyJustClosed = false;
      }
    } else {
      // Inside a quoted scalar every character is content.
      mayBegin = false;
      jsonLikeKeyJustClosed = false;
    }
  }
  return { text: s, state: exiting() };
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
export const DQ_ESCAPE_ALLOWLIST: ReadonlyMap<string, string> = new Map([
  ['"', '"'],
  ["\\", "\\"],
  ["/", "/"],
]);

// The discriminated result of resolving a scalar. `ok: false` carries the offending sequence's
// SPELLING (the backslash and the character after it, or a bare backslash for a dangling escape at
// end-of-scalar) so the refusal reason can name what it refused instead of gesturing at the line.
export type Unquoted =
  | { ok: true; value: string }
  | { ok: false; escape: string };

// Resolve the BODY of a double-quoted scalar (the text between the wrapping quotes) against the
// allowlist. One linear left-to-right pass, no backtracking, no regex: on a backslash it resolves the
// two-character sequence when the following character is on `DQ_ESCAPE_ALLOWLIST` and REFUSES
// otherwise. A backslash that is the LAST character of the body is a dangling escape and is refused
// on the same rule — it is not on the allowlist because there is nothing after it to be on it.
//
// There is deliberately NO fallback branch. A fallback that passed an unknown sequence through, or
// stripped its backslash, would be the enumerate-the-bad shape returning under a new name: the
// default outcome must be refusal, or the next unenumerated spelling is round five.
function resolveDoubleQuoted(body: string): Unquoted {
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c !== "\\") {
      out += c;
      continue;
    }
    if (i + 1 >= body.length) return { ok: false, escape: "\\" };
    const next = body[i + 1];
    const resolved = DQ_ESCAPE_ALLOWLIST.get(next);
    if (resolved === undefined) return { ok: false, escape: `\\${next}` };
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
function scanEmbeddedDoubleQuoted(s: string): Unquoted {
  let sq = false;
  let dq = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (dq && c === "\\") {
      if (i + 1 >= s.length) return { ok: false, escape: "\\" };
      const next = s[i + 1];
      if (!DQ_ESCAPE_ALLOWLIST.has(next)) {
        return { ok: false, escape: `\\${next}` };
      }
      i += 1; // an allowlisted escape is consumed whole; its second character never toggles a quote
      continue;
    }
    if (c === '"' && !sq) dq = !dq;
    else if (c === "'" && !dq) sq = !sq;
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
function unquoteChecked(s: string): Unquoted {
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

const indentOf = (line: string): number => line.length - line.replace(/^[ \t]*/, "").length;

// (D-53 — 27-REVIEW-GAPS-7 § IN-03, round 8) THE BLOCK-SEQUENCE ITEM PATH'S INVARIANT, ASSERTED AT
// THE SITE RATHER THAN IMPLIED BY A COMMENT.
//
// WHAT THE COMMENT USED TO CLAIM AND WHY THAT WAS NOT GOOD ENOUGH. The item path seeded the scanner
// from the carried quote "rather than a literal null so this path reads the carried state like every
// other". The reviewer showed the seed was a PROVABLE CONSTANT — the path is reached only when the
// item boundary matched, which requires `startsNode`, which requires `!inScalar`, i.e. no open quote
// — so the sentence described a property the code did not have. This module's own standing rule is
// that a comment claiming a property never ships without the assertion that makes it true.
//
// WHAT IS TRUE AFTER D-51, AND WHAT IS STILL A CONSTANT. The state the item path reads now carries
// the flow depth and the node-may-begin answer as well as the quote, so the seed IS a genuine read
// of three fields. The QUOTE COMPONENT specifically is still null there, and that is not an accident
// to be re-derived by a later reader from two expressions thirty lines apart — it is asserted here,
// by name, so a future edit that lets an open scalar reach the item path fails loudly instead of
// silently mixing one node's quote into another's.
//
// THIS THROWS RATHER THAN RETURNING A REFUSAL BECAUSE IT IS NOT A FACT ABOUT THE DOCUMENT. Every
// refusal in this module says "this document expresses something I will not read". A violation here
// would say "this module reached a state it proves it cannot reach", which is a programming error in
// the flattener and not something a document author can cause or fix.
export function assertItemPathScalarClosed(
  state: ScalarState,
  itemLine: string,
): void {
  if (state.openQuote !== null) {
    throw new Error(
      `frontmatter internal invariant violated at the block-sequence item path: the carried scalar state must carry no open quote here, because the path is reached only where a node may begin, but ${state.openQuote} was still open at \`${excerpt(itemLine)}\``,
    );
  }
}

// A short, safe excerpt of an unreadable line for the failure reason. Long enough to identify the
// line, short enough that a finding stays one readable line.
const excerpt = (s: string): string => (s.length > 60 ? `${s.slice(0, 57)}...` : s);

// ---------------------------------------------------------------------------
// The value flattener
// ---------------------------------------------------------------------------

// (D-59 — 27-REVIEW.md § CR-01, round 11) ONE REGION OF ONE KEY'S VALUE, AND THE UNIT THE QUOTING
// DECISION IS MADE ON.
//
// A key's value used to be `string[]`, and the answer to "do YAML's quoting rules apply here" was a
// separate boolean on the ACCUMULATOR — so it necessarily described the whole key. That is the
// defect: the exemption a block scalar earns covers exactly the text that block scalar contains, and
// nothing else in the document. Making the fact a field of the region carries it at the lifetime it
// actually has, and there is no key-lifetime flag left for a later position to widen.
//
// THE IDENTITY QUESTION IS DISSOLVED RATHER THAN ANSWERED, WHICH IS WHY THERE IS NO INDEX HERE. A
// per-region fact needs a handle only if it is stored APART from the region — an index into `parts`,
// or a set of owned offsets — and then the handle's stability becomes a property somebody has to
// prove and keep proving as the flattener grows. Storing the fact ON the region removes the question:
// the flag travels with the text it describes through every push, fold and join, so no reordering,
// splice or removal could invalidate it even if one were ever introduced.
//
// `intro` and `body` are two fields rather than one string because they are two regions with two
// different answers. `intro` is the text a nested header prints in FRONT of the scalar — the `key:`
// of a mapping entry, or the explicit `?` / `:` — which the loader keeps in its flattened value and
// which YAML gives no block-scalar meaning to. `body` is what the scalar (or the plain/quoted node)
// actually contains. Joined for output exactly as the pre-D-59 single string was assembled, so no
// document's flattened value moves: see `regionText`.
interface Part {
  // Outside every block scalar. Empty for every non-block region. Answers to `unquoteChecked`.
  readonly intro: string;
  // The region's own text. Exempt from quoting resolution if and only if `block`.
  body: string;
  // Is `body` the content of a `|` / `>` scalar? Set once, at `openBlock`, and never revised —
  // a region does not change kind, only the accumulator's CURRENT region does.
  readonly block: boolean;
}

// One region's contribution to the flattened value. This is byte-for-byte the string the pre-D-59
// flattener built in a single `parts` slot: `openBlock` seeded the slot with `header.leading` and the
// first content line appended `" " + t` when that seed was non-empty, or replaced it when it was
// empty. Stated once here so the split into two fields is provably not a formatting change.
const regionText = (intro: string, body: string): string =>
  intro === "" ? body : body === "" ? intro : `${intro} ${body}`;

// (D-59) THE CONTINUATION FOLD'S INVARIANT, ASSERTED AT THE SITE, on the same argument as
// `assertItemPathScalarClosed` above: a comment claiming a property never ships without the
// assertion that makes it true.
//
// WHAT IS CLAIMED. A continuation line that folds into the PRECEDING region can never be folding into
// a block scalar's region, so folding cannot smuggle text that YAML does apply quoting rules to
// inside an exemption that was granted to different text.
//
// WHY IT HOLDS. While the scalar is OPEN, every more-indented line is taken by the content branch and
// never reaches the fold. The line that ENDS the scalar clears `nodeStarted` and reseeds the scanner
// state, which makes `startsNode` true, which routes that line to the PUSH and not to the fold. So
// the fold's target is a region some non-block path pushed, whose `intro` is `""` by construction —
// which is in turn what makes the fold's `${body} ${text}` byte-identical to the pre-D-59
// `${part} ${text}`.
//
// IT THROWS RATHER THAN RETURNING A REFUSAL because it is not a fact about the document. A violation
// would say "this module reached a state it proves it cannot reach", which no author can cause or fix.
export function assertFoldTargetIsNotBlockOwned(
  part: { readonly intro: string; readonly block: boolean },
  line: string,
): void {
  if (part.block || part.intro !== "") {
    throw new Error(
      `frontmatter internal invariant violated at the continuation fold: a continuation line may only fold into a region no block scalar owns, because the line that ends a block scalar is a node start and is pushed rather than folded, but the target region was ${part.block ? "block-owned" : "carrying a non-empty introduction"} at \`${excerpt(line)}\``,
    );
  }
}

// (D-57's sticky per-key block flag, DELETED BY D-59 — and the field list below is deliberately one
// field SHORTER than the round-10 build's.) D-57 added a per-key boolean to carry the block-scalar
// quoting exemption past the point where the scalar itself closed. Its LIFETIME WAS THE KEY while
// the fact it carried has the lifetime of a REGION, and that gap is the whole of the round-11 CR-01
// regression: `tools:` / `  a: "\x41gent(grugops-orchestrator)"` REFUSED, while the same document
// with an unrelated `  b: >-` / `    x` appended returned `{ok:true,value:false}` over a live grant.
// The fact now lives on `Part.block`, at the lifetime it has. A replacement flag whose lifetime is
// the key is the defect and not its tuning, so none is declared here — asserted, not just asked for,
// by the interface-shape case in scripts/frontmatter.test.ts.
interface Accumulator {
  key: string;
  // (D-59) THE REGIONS OF THIS KEY'S VALUE, IN DOCUMENT ORDER. Was `string[]`; see `Part`.
  parts: Part[];
  block: boolean; // a `|` / `>` scalar is OPEN: continuation lines are literal text, never sequence items
  // (D-57 — 27-REVIEW § family G/G2, round 10) WHERE THE OPEN BLOCK SCALAR'S HEADER LINE BEGAN, SO
  // ITS END IS DERIVED FROM YAML'S OWN RULE RATHER THAN GUESSED.
  //
  // YAML 1.2 § 8.1 ends a block scalar at the first line whose indentation is NOT MORE than the
  // indentation of the line the header appeared on. That is the whole end condition, and it is the
  // reason `block` can now be recognised at every node-start position instead of only at the
  // top-level key line: at the key line this is `baseIndent`, so the pre-existing behaviour is the
  // `blockIndent === baseIndent` case of one rule rather than a special case beside it.
  //
  // Meaningful only while `block` is true. Read at exactly one site — the content branch at the top
  // of the loop — so there is one place that decides whether a line is inside the scalar.
  blockIndent: number;
  // (D-57) THE OPEN BLOCK SCALAR'S OWN LINE BREAK — `"\n"` for a literal `|`, `" "` for a folded
  // `>`, derived from the indicator by `blockLineBreak` and never chosen here. Meaningful only while
  // `block` is true.
  blockLineBreak: string;
  // (D-57) HAS THE OPEN BLOCK SCALAR CONSUMED A CONTENT LINE YET? The FIRST content line joins to
  // `leading` across the mapping's `key:` SEPARATOR, which YAML writes as a space; every line after
  // it joins across a LINE BREAK inside the scalar, which is `blockLineBreak`. Two different joins
  // for two different constructs — conflating them wrote `nested:` and its first content line as
  // `nested:\nRead,` for a literal block, where the loader's own flattening writes `nested: Read,`.
  blockHasContent: boolean;
  seq: boolean; // at least one continuation line was a `- item`
  // (D-48, widened by D-51) The state the PREVIOUS line of this key left behind. THE UNIT OF PARSING
  // IS THE SCALAR, NOT THE PHYSICAL LINE — a YAML scalar does not end at a line boundary, so the
  // state that decides what a character on the next line MEANS belongs to the scalar and is carried
  // here rather than re-derived by each helper from the line it happens to be handed. Three consumers
  // read it and NONE derives its own: the comment scanner, the node-start reference test and the
  // sequence-item boundary. Seeded from `FRESH_NODE` on a key line, by construction.
  //
  // (D-51) IT IS THE SCANNER'S RECORD, NOT A BARE QUOTE. The quote alone answered only "am I inside a
  // scalar"; the flow depth and the node-may-begin answer are what let the ONE walk decide, at the
  // character, whether a quote opening MID-LINE or on a continuation line is a node's quote. Each of
  // the three sites below assigns this field exactly once, from what the scanner returned, and
  // conditions that assignment on nothing.
  state: ScalarState;
  // (D-48, RENAMED AND COMPLETED BY D-55) HAS THIS KEY'S VALUE NODE BEGUN ANYWHERE YET? The SECOND
  // fact that belongs to the node rather than to the line, and the answer to "may a node BEGIN on
  // this continuation line".
  //
  // `openQuote` alone closes the QUOTED spellings and leaves the PLAIN wrapped scalar carrying all
  // three directions of the identical defect — measured against the build that landed the quote
  // carry: `tools: Read,` / `  *Agent(x)` was still REFUSED where libyaml returns the text as
  // CONTENT, and `tools: "Agent(alpha, ga` written PLAIN as `tools: Agent(alpha, ga` / `  - mma)`
  // still enumerated `[alpha, ga, mma]` where libyaml expresses `[alpha, ga - mma]` — the invented
  // name again, on the success arm. Closing only the spelling a finding happened to report is the
  // enumerate-the-bad shape this phase has now corrected six times, so both close here.
  //
  // THE RULE, AND IT IS YAML'S OWN: once a scalar has begun, every following more-indented line
  // CONTINUES it — a `-` there is text and a sigil there is not a node property. Where the key line
  // carries NO value, the indented lines are themselves the node starts (a block sequence, or a
  // plain scalar's first line). Verified against libyaml in both directions: `tools: Read,` /
  // `  - Write` loads as the single scalar `Read, - Write`, while `tools:` / `  - Read` /
  // `  - Write` loads as a two-element sequence.
  //
  // (D-55 — 27-REVIEW-GAPS-8 § CR-02, round 9) THE FIELD WAS NAMED `nodeOnKeyLine` AND WAS ASSIGNED
  // AT EXACTLY ONE OF THE TWO PLACES A NODE CAN BEGIN. The paragraph above already stated the rule
  // in its general form — "once a scalar has begun" — and the code implemented it only for the key
  // line. Where the key line carried no value NOTHING recorded that the node had begun on the first
  // continuation line, so `startsNode` stayed true for every subsequent continuation line of that
  // key. Measured against the committed build, with the loader column from /usr/bin/ruby -ryaml
  // (Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1) — three directions, one omission:
  //
  //   tools:              names ["alpha","ga","mma"] — `mma` INVENTED and `ga` TRUNCATED, on the
  //     Agent(alpha, ga   `ok:true` arm, straight into the KIT-03 closure equality.
  //     - mma)            libyaml: "Agent(alpha, ga - mma)" -> ["alpha","ga - mma"].
  //
  //   tools:              {ok:true,value:true} — a module GRANT the loader does not have, which the
  //     Read,             D-52 harness declares NEVER EXEMPTIBLE. The quote opens on a line that
  //     "Write,           CONTINUES the plain scalar, so libyaml reads it as content and the hash
  //     # x, Agent(…)"    line as a COMMENT: "Read, \"Write,". No token.
  //
  //   description:        REFUSED as a YAML anchor or alias — a FALSE RED on documentation libyaml
  //     see the docs      accepts cleanly as "see the docs *emphasis* here". Same for `&` and `!`.
  //     *emphasis* here
  //
  // So the field is RENAMED TO WHAT IT MEANS and set at BOTH places a node can begin: on the key
  // line when the key line carries text, and on the continuation path once the first content-bearing
  // line has been consumed. This is D-51's discipline applied one field over — set the fact where
  // the fact becomes true, not where it was first convenient.
  nodeStarted: boolean;
  // (D-55 point 2) THE ONE DELIBERATE EXCEPTION, AND IT IS AN INDENT RATHER THAN A FLAG. `null`
  // until this key's first block-sequence item is seen, then the indent of that item's line.
  //
  // A BLOCK SEQUENCE GENUINELY ADMITS A NODE START AT EVERY ITEM. If the item path let `nodeStarted`
  // alone govern it, the SECOND item's dash would stop being an item boundary and the shipped
  // block-sequence idiom every skill and adapter writes — `tools:` / `  - Read` / `  - Write` —
  // would collapse into the one scalar `Read - Write`. So the item path records the INDENT at which
  // items begin, and a line AT that indent re-enters the item rule however long the sequence runs.
  //
  // AND THE EXCEPTION IS BOUNDED BY THAT INDENT, WHICH IS WHAT MAKES IT AN EXCEPTION AND NOT A
  // SECOND GRAMMAR. A dash on a MORE-INDENTED continuation of an item is text — which is what YAML
  // says and what the loader computes: libyaml reads `tools:` / `  - Read,` / `    - still text` as
  // the single item "Read, - still text", while the pre-D-55 build read the second dash as a second
  // ITEM and invented a comma boundary ("Read,, still text").
  seqIndent: number | null;
}

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
function flattenBlock(
  block: string[],
  baseIndent: number,
): Parsed<FrontmatterKeys> {
  const keys: FrontmatterKeys = new Map();
  let cur: Accumulator | null = null;

  // The refusal for a YAML reference construct. Returned from three places — the key line, a
  // block-sequence item and a plain continuation line — so a reference is refused the same way
  // wherever it sits, and always BEFORE the text is flattened into a value.
  //
  // (CR-01, round 2) The reason also names an UNRESOLVED TAG, because a tag is now refused by the
  // same rule. The substring `anchor or alias` is deliberately kept verbatim: two shipped assertions
  // match the reason on it (scripts/frontmatter.test.ts and scripts/check-foundation-guards.test.ts),
  // so dropping it would silently weaken both while every case stayed green.
  const refuseRef = (line: string): Parsed<FrontmatterKeys> => ({
    ok: false,
    reason: `\`${excerpt(line)}\` uses a YAML anchor or alias, or an unresolved YAML tag standing in front of one; the value this document expresses is not the text on this line, and this module deliberately does not resolve a reference or a node property — it is refused rather than read as "carries no grant"`,
  });

  // (D-30) The refusal for a backslash sequence outside `DQ_ESCAPE_ALLOWLIST`, beside `refuseRef`
  // and built to the same contract. It names (a) the offending sequence verbatim, (b) an excerpt of
  // the offending line, and (c) keeps the substring `anchor or alias` in its closing clause — two
  // shipped assertions match a refusal reason on that substring, and an escape refusal that dropped
  // it would silently weaken both while every case stayed green.
  const refuseEscape = (
    line: string,
    escape: string,
  ): Parsed<FrontmatterKeys> => ({
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
  const flush = (): Parsed<FrontmatterKeys> | null => {
    if (cur === null) return null;
    // (D-57) THE JOIN FOLLOWS `seq`. This and the quoting exemption were one expression while a block
    // scalar could only ever be the WHOLE of a key's value: `block` implied `!seq` by construction, so
    // `block ? " " : seq ? ", " : " "` and `seq ? ", " : " "` were the same function. A nested header
    // makes them come apart — a block sequence one of whose ITEMS is a block scalar is both — and
    // reading `block` for the join would have dropped the item boundary between `- >-` / `    alpha`
    // and `- beta`, merging two nodes into one and inventing the name `alpha beta`. That is the D-09
    // direction, so the join reads the field that actually holds it.
    const sep = cur.seq ? ", " : " ";
    // (D-59) THE UNRESOLVED JOIN, KEPT FOR THE REFUSAL REASON AND FOR NOTHING ELSE. The reason string
    // is matched on by two shipped assertions, and a refusal that named a REGION where it used to name
    // the whole key's text would move bytes in a message this module treats as an interface. Built
    // from `regionText`, so it is the exact string the pre-D-59 `parts.join(sep).trim()` produced.
    const rawJoined = cur.parts
      .map((p) => regionText(p.intro, p.body))
      .join(sep)
      .trim();
    // (D-59) THE RESOLUTION UNIT IS THE MAXIMAL RUN OF LIKE-KIND REGIONS, AND THAT IS NOT A
    // CONVENIENCE — IT IS THE ONLY UNIT THAT SCOPES THE EXEMPTION WITHOUT CONTRADICTING D-33.
    //
    // D-50 / IN-02 established that YAML applies NO quoting rules inside a `|` / `>` scalar. It
    // established nothing about the sibling entry underneath one, about the entry above one, or about
    // the `key:` introduction printed in front of one. Those are ordinary nodes; they answer to
    // `unquoteChecked`, and a block scalar elsewhere in the key must not speak for them.
    //
    // BUT RESOLVING EACH REGION INDIVIDUALLY WOULD CONTRADICT A DECISION THIS MODULE ALREADY TOOK.
    // D-33 states that the unquote runs on the JOINED value, so YAML's line folding meets this
    // module's join — and the join is where a wrapping quote pair becomes recognisable at all.
    // Measured, individual resolution moved two shipped values: `tools:` / `  - Read` / `  -` /
    // `    "Write,` / `    # x, Agent(…)"` flattened to `Read, Write, # x, Agent(…)` where every build
    // since D-51 has flattened it to `Read, "Write, # x, Agent(…)"`, because the second region ALONE
    // is a wholly-quoted scalar while the joined value is not. That is a value moving for a reason
    // that has nothing to do with this defect, which is how a scope fix becomes a second one.
    //
    // So a RUN of adjacent regions of the same kind is resolved as one text, exactly as the whole key
    // was before this decision, and a run BOUNDARY is precisely a change of kind. For every key
    // carrying no block scalar there is exactly one run and the result is byte-identical to the
    // pre-D-59 flush. Where a block scalar IS present, its own run is exempt and every other run
    // answers to the checked unquote on its own terms — which is the whole of the fix.
    //
    // THE INTRODUCTION IS VALIDATED RATHER THAN EXEMPTED, AND IT IS A NO-OP TODAY BY GRAMMAR RATHER
    // THAN BY LUCK. `header.leading` is the `key:` a nested mapping prints in front of the scalar, or
    // the explicit `?` / `:`; it is NOT inside the scalar, so YAML's quoting rules do apply to it and
    // the exemption must not cover it. `KEY_LINE`'s key alphabet is `[A-Za-z_][A-Za-z0-9_-]*` and
    // `BLOCK_MAP_EXPLICIT`'s introduction is one of two punctuation characters, so an introduction can
    // never contain a quote or a backslash and `unquoteChecked` returns it unchanged — no document's
    // value can move. It is checked anyway, because the RULE is "everything outside a block scalar's
    // content answers to the checked unquote", and a rule that holds only because of an alphabet
    // declared two hundred lines away is the kind of coincidence this family keeps reopening on.
    const resolvedRuns: string[] = [];
    for (let start = 0; start < cur.parts.length; ) {
      const kind = cur.parts[start].block;
      let end = start + 1;
      while (end < cur.parts.length && cur.parts[end].block === kind) end += 1;
      const run = cur.parts.slice(start, end);
      const runText = run
        .map((p) => regionText(p.intro, p.body))
        .join(sep)
        .trim();
      if (kind) {
        for (const p of run) {
          const intro = unquoteChecked(p.intro);
          if (!intro.ok) {
            return refuseEscape(`${cur.key}: ${rawJoined}`, intro.escape);
          }
        }
        resolvedRuns.push(runText);
      } else {
        const resolved = unquoteChecked(runText);
        if (!resolved.ok) {
          return refuseEscape(`${cur.key}: ${rawJoined}`, resolved.escape);
        }
        resolvedRuns.push(resolved.value);
      }
      start = end;
    }
    const value = resolvedRuns.join(sep);
    const seen = keys.get(cur.key);
    if (seen === undefined) keys.set(cur.key, [value]);
    else seen.push(value);
    cur = null;
    return null;
  };

  // (D-57) OPEN A BLOCK SCALAR, WRITTEN ONCE AND CALLED FROM ALL THREE POSITIONS A HEADER CAN
  // APPEAR — the top-level key line, a block-sequence item and a continuation line (a nested
  // mapping's value, at any depth). Three call sites and ONE statement of what opening a block
  // scalar means: exactly the discipline D-51 applied to the three scalar-state seeding sites, and
  // the reason this decision adds no second opinion about block scalars anywhere in the module.
  //
  // `headerIndent` is the indentation of the LINE the header appeared on — `baseIndent` at the key
  // line, the item's own indent at a sequence item, the continuation line's indent otherwise. It is
  // the sole input to the end condition above.
  const openBlock = (
    a: Accumulator,
    header: BlockHeader,
    headerIndent: number,
  ): void => {
    a.block = true;
    a.blockIndent = headerIndent;
    a.blockLineBreak = header.lineBreak;
    a.blockHasContent = false;
    // The node BEGAN here: the header introduces the scalar even when its first content line is
    // still to come. Set on the same argument as the key line's and the item path's own assignments.
    a.nodeStarted = true;
    // Nothing crosses INTO a block scalar. Every header is recognised only where a node may begin,
    // which requires the carried quote to be closed already, so this reset can only ever clear a
    // flow depth or a node-may-begin answer that the scalar's own content does not read.
    a.state = FRESH_NODE;
    // (D-59) THE REGION THIS SCALAR OWNS, PUSHED UNCONDITIONALLY — including with an empty body for a
    // bare header — so the content branch has exactly one region to fold into and never has to decide
    // whether to create one. `block: true` is the exemption, and it is recorded HERE, on the region,
    // because here is where the fact becomes true and here is the only text it is true of. The
    // header's `leading` is carried as the region's INTRODUCTION rather than as the first bytes of its
    // body, because the introduction is not inside the scalar and YAML's quoting rules do apply to it.
    a.parts.push({ intro: header.leading, body: "", block: true });
  };

  for (const raw of block) {
    // A blank line is a paragraph break, never a key boundary.
    //
    // (D-50 — IN-01) THIS `trim()` IS DELIBERATELY NOT WIDENED TO THIS MODULE'S INVISIBLE CLASS, AND
    // THE REASON IS THE DIRECTION. At `parseFrontmatter`'s PROLOGUE skip the narrow alphabet routed an
    // invisible-only line to a SILENT SUCCESS, so widening there removes a silent no-grant. HERE the
    // narrow alphabet routes an invisible-only line past this `continue` and into the key-line
    // refusal below — a LOUD refusal, and the one libyaml agrees with: measured, a real YAML 1.2
    // loader rejects `---` / `name: x` / `<ZWSP>` / `tools: …` outright as a syntax error. Widening
    // blankness here would trade that refusal for a silent skip on a document the platform will not
    // load, which is the wrong direction. Asserted by the in-block asymmetry control in
    // scripts/frontmatter.test.ts, so this is not read as an oversight and not "fixed" into a bypass.
    if (raw.trim() === "") continue;
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
        // (D-57) THE END OF THE SCALAR IS YAML'S OWN RULE, DERIVED FROM THE HEADER LINE'S OWN INDENT.
        // YAML 1.2 § 8.1 keeps a line inside a block scalar while it is MORE INDENTED than the line
        // the header appeared on, and ends the scalar at the first line that is not. `blockIndent` is
        // `baseIndent` for a top-level header, so this branch is byte-identical to the unconditional
        // `cur.parts.push(t)` it replaces for every document that parsed before this decision — the
        // outer `indent > baseIndent` has already established the strict inequality there.
        //
        // NOTHING HERE GUESSES. There is no fixed depth, no line-shape heuristic and no "read to the
        // end of the key's region" fallback; the two candidate dispositions that would have required
        // one were considered and rejected by name in D-57, with their reasons recorded.
        if (indent > cur.blockIndent) {
          // Inside a literal/folded scalar every continuation line is content. A leading dash is part
          // of the text, not a sequence marker, and a `#` is literal — no comment stripping here.
          //
          // (D-57) CONTENT FOLDS INTO THE ONE PART THIS SCALAR OWNS rather than becoming a part of
          // its own. A block scalar is ONE node however many lines it spans, and the flush joins a
          // block sequence's parts with `", "` — so pushing per-line parts would hand a sequence
          // whose item is a block scalar a comma boundary at every line break, inventing names inside
          // the very construct this decision exists to read correctly (D-09). For a top-level block
          // the two are the same string: `["a","b"].join(" ")` and `"a b"` are equal, which is why
          // this is not a behaviour change for any document that already parsed.
          //
          // (D-59) THE THREE-WAY CHOICE COLLAPSED TO TWO WHEN THE INTRODUCTION MOVED OFF THE BODY.
          // The old `parts[i] === "" ? t : parts[i] + " " + t` arm existed only to join the FIRST
          // content line across the mapping's `key:` separator, and that separator is now `regionText`
          // at the flush. `body` is `""` for every scalar's first content line by construction, so
          // this is the same string with the decision made once instead of twice.
          const region = cur.parts[cur.parts.length - 1];
          region.body = cur.blockHasContent
            ? `${region.body}${cur.blockLineBreak}${t}`
            : t;
          cur.blockHasContent = true;
          continue;
        }
        // The scalar ENDED at this line, so this line is a sibling node at the header's own indent —
        // a following key, a following item, or a comment. It is a genuine node start by YAML's rule,
        // so `nodeStarted` is cleared and the carried scanner state is reset: nothing crosses out of
        // a block scalar, because a block scalar has no open quote and no flow depth to carry.
        //
        // WITHOUT THIS RESET the sibling line folded into the block's part as content, and a SECOND
        // nested header on it was never recognised — measured, as row U5 (`a: >-` / content / `b: >-`
        // / content), which returned the silent no-grant arm over a live grant. A fix that closes a
        // family at one position and reopens it at the position immediately after is not a closure.
        cur.block = false;
        cur.state = FRESH_NODE;
        cur.nodeStarted = false;
      }
      // (D-48) THE CARRIED SCALAR STATE, READ ONCE AND CONSULTED BY ALL THREE CONSUMERS BELOW. While
      // a quoted scalar opened on an earlier line of this key is still open, THIS LINE IS CONTENT:
      // it is not a comment start, it is not a node start, and it is not an item boundary. That is
      // the whole of what the carried state decides — it never decides what a value MEANS.
      const inScalar = cur.state.openQuote !== null;
      // MAY A NODE BEGIN ON THIS LINE? Derived ONCE from the carried facts and read by consumers
      // 1 and 2 below. A line inside an open quoted scalar is content; so is a line continuing a
      // scalar that already began. Both are properties of the NODE — neither is recoverable from the
      // line, which is exactly why the per-line reset got all three wrong.
      //
      // (D-55) THE SECOND DISJUNCT IS THE BLOCK-SEQUENCE EXCEPTION, STATED ONCE HERE AND NOWHERE
      // ELSE. `cur.seqIndent` is `null` for every key that is not a block sequence, so for those
      // keys it contributes nothing. Where the key IS a block sequence, a line at the ITEM INDENT
      // re-admits a node start — because a sequence genuinely begins a new node at every item —
      // while a more-indented line continues the item it follows. See `seqIndent`'s doc block for
      // what breaks if this disjunct is removed.
      //
      // (D-55, ADDED BY THE EXECUTOR'S OWN RED TEAM) THE THIRD DISJUNCT IS THE WALK'S ANSWER, AND
      // ITS ABSENCE WAS A LIVE SILENT-NO-GRANT. `stripComment` computes offset 0's node-start answer
      // as `nodeStartAtOffsetZero || entering.nodeMayBegin` — so the SCANNER already treats a line
      // whose predecessor ended where a node may begin as a node start, and this line-level
      // expression was giving the item boundary and the reference test a DIFFERENT, WEAKER answer.
      // That is a second predicate for a fact the walk already holds, which is the class this module
      // has now deleted four times. Measured against the build that shipped without it:
      //
      //   tools:              libyaml: {"nested"=>["Read, # x, Agent(grugops-orchestrator)"]}
      //     nested:           module:  {ok:true,value:false} — SILENT NO-GRANT over a live grant.
      //       - "Read,        `nested:` raised `nodeStarted` for the whole key and `seqIndent` was
      //       # x, Agent(…)"  still null, so the deeper dash stopped being an item, the quote after
      //                       it opened at a non-node-start, its state died at the line boundary and
      //                       the token line was stripped as a comment.
      //
      // AND IT CANNOT REOPEN CR-02, because the walk's answer is FALSE at exactly the positions CR-02
      // is about: a plain scalar's last character takes the chain's final arm, so `tools:` /
      // `  Agent(alpha, ga` and `tools:` / `  Read,` both leave `nodeMayBegin` false and the dash or
      // quote on the next line stays text. Adjudicated over an 864-cell generated corpus in both
      // directions and over the repository-wide value map; see 27-48-SUMMARY.md.
      const startsNode =
        !inScalar &&
        (!cur.nodeStarted ||
          indent === cur.seqIndent ||
          cur.state.nodeMayBegin);
      // CONSUMER 1 — THE ITEM BOUNDARY. `SEQ_ITEM` is byte-unchanged and is simply NOT ASKED where a
      // node may not begin. Teaching the regex about quotes would be a SECOND GRAMMAR for a fact
      // these fields already hold, and this module has deleted a weaker-duplicate predicate twice.
      // Measured against the committed build, the unconditional test read the `-` opening a
      // continuation line as a new item, which set `cur.seq` and flipped the join separator for the
      // WHOLE key from `" "` to `", "` — inventing a comma, hence a NAME, on the success arm.
      const item = startsNode ? t.match(SEQ_ITEM) : null;
      if (item !== null) {
        // A block-sequence ITEM is its own node, so the token start is the text after the dash.
        let itemText = (item[1] ?? "").trim();
        // (D-54 point 3 — 27-REVIEW-GAPS-8 § CR-01 row B) A DASH CONSUMES EXACTLY ONE LEVEL, SO A
        // COMPACT NESTED SEQUENCE RE-ENTERS THIS RULE AT THE SECOND DASH. YAML lets a sequence whose
        // item is itself a sequence share one line: `  - - "Read,` is `[["Read, …"]]`, and the node
        // the quote opens belongs to the INNER item. Consuming only the first dash handed the scanner
        // `- "Read,`, whose offset 0 is a content character, so the quote opened at a non-node-start,
        // its state died at the line boundary, and the continuation carrying the token was stripped
        // as a comment — `{ok:true,value:false}` over `[["Read, # x, Agent(grugops-orchestrator)"]]`,
        // and it took the whole foundation gate to `ALL CHECKS PASSED` at exit 0.
        //
        // THE REGEX IS BYTE-UNCHANGED AND SIMPLY RE-APPLIED. Teaching `SEQ_ITEM` about nesting would
        // be a SECOND GRAMMAR for a fact this loop already holds, and this module has deleted a
        // weaker-duplicate predicate three times. The loop TERMINATES on that same regex failing to
        // match: every iteration removes at least the leading `-`, so the text strictly shrinks, and
        // `- -` reaches the empty string where `SEQ_ITEM` (anchored on `-`) cannot match. A leading
        // dash that is NOT an item marker is untouched for the same reason it always was: `-5` and
        // `--flag` have no whitespace and no end-of-line after the first dash, so they do not match.
        //
        // WHAT THIS DOES NOT CHANGE: `cur.seq` and the join separator are set ONCE for the key, not
        // once per level. The flattened value is a TOKEN-PRESENCE surface, not a reconstruction of
        // the loader's nested value — libyaml reads row B as `[["Read, # x, Agent(…)"]]` while this
        // module flattens it to the one string `Read, # x, Agent(…)`. Both carry the token, which is
        // the only fact any guard asks of this value, and the difference is recorded in
        // 27-47-SUMMARY.md as data rather than hidden behind a passing assertion.
        let nested = itemText.match(SEQ_ITEM);
        while (nested !== null) {
          itemText = (nested[1] ?? "").trim();
          nested = itemText.match(SEQ_ITEM);
        }
        // CONSUMER 2 (item path) — the node-start test. Reached only with the scalar CLOSED, so the
        // node start is real.
        if (startsWithReference(itemText)) return refuseRef(t);
        cur.seq = true;
        // (D-55 point 2) THE ITEM INDENT, RECORDED UNCONDITIONALLY. This is the whole of the block
        // sequence exception: `startsNode` above re-admits a node start at THIS indent, so however
        // long the sequence runs every dash at it re-enters this rule, while a dash on a
        // more-indented continuation of an item is text — which is what YAML says and what the
        // loader computes. It is assigned on EVERY item rather than only the first, because an item
        // whose own value is a nested sequence moves the indent at which items begin: libyaml reads
        // `tools:` / `  -` / `    - inner` / `    - inner2` as `[["inner", "inner2"]]`, two items at
        // indent 4, and a first-write-wins `seqIndent` would have folded the second into the first.
        cur.seqIndent = indent;
        // (D-30) The escape refusal fires HERE, at the same node-start point the reference refusal
        // already fires from, and returns directly rather than being deferred to the flush.
        //
        // (D-53 / IN-03) The invariant this path has always relied on, now stated as code. The state
        // read below carries the flow depth and the node-may-begin answer — a genuine read of the
        // carried record — while its QUOTE component is null, guaranteed by `startsNode` above,
        // whose first conjunct is `!inScalar` and which therefore cannot be true with a quote open.
        // (D-55 restated the rest of that expression — the fact `nodeOnKeyLine` is now `nodeStarted`
        // and carries a block-sequence indent exception — and the `!inScalar` conjunct, which is the
        // only part this invariant rests on, is byte-unchanged.)
        assertItemPathScalarClosed(cur.state, t);
        // (D-57) POSITION 2 OF 3 — A BLOCK-SEQUENCE ITEM IS A NODE START, SO IT MAY CARRY A HEADER.
        // `tools:` / `  - >-` / `    Read,` / `    # x, Agent(…)` is family G2: libyaml reads a
        // one-element sequence whose item carries the grant, and this module read `>-, Read,,` and
        // returned no grant. The item's own indent is the header's line indent, so the content is
        // everything more indented than the dash — and a following `  - Write` at the item indent
        // ends the scalar and re-enters the item rule exactly as `seqIndent` already provides.
        //
        // It is asked HERE, after the dashes are consumed, because a compact nested sequence
        // (`  - - >-`) puts the header on the INNER item and `itemText` is the text of that item.
        const itemHeader = blockHeaderAt(itemText);
        if (itemHeader !== null) {
          openBlock(cur, itemHeader, indent);
          continue;
        }
        // (D-51) SEEDING SITE 2 OF 3 — one assignment, no gate. The item is its own node, so offset 0
        // of `itemText` is a node start and the scanner is told so; whether anything crosses the
        // boundary is then the scanner's answer and nobody else's.
        //
        // (D-54) AND OFFSET 0 OF THE ITEM TEXT IS ALSO A LINE'S STRUCTURAL START. A sequence item may
        // itself be a compact block mapping, including one written with an explicit key — libyaml
        // reads `tools:` / `  - ? "Read,` / `    # x, Agent(…)"` / `    : v` as
        // `[{"Read, # x, Agent(grugops-orchestrator)"=>"v"}]`, so the `?` there introduces a key node
        // and the quote after it opens at a node start.
        const scanned = stripComment(itemText, cur.state, true, true);
        cur.state = scanned.state;
        const resolved = unquoteChecked(scanned.text.trim());
        if (!resolved.ok) return refuseEscape(t, resolved.escape);
        const v = resolved.value;
        // (D-55 point 1) SET-SITE TWO OF THREE, AND IT IS THE KEY LINE'S RULE SPELLED IDENTICALLY.
        // A sequence item INTRODUCES a node exactly as a key line does, and it begins that node only
        // if the line actually carries text: `  -` with the content on the next, more-indented line
        // begins nothing here, so that line is the node start — which is what makes a genuine YAML
        // anchor there still an anchor, and what keeps the shipped `  - Read` / `  -` / `    "Write,`
        // idiom producing TWO parts rather than one. Measured: an unconditional `true` here read the
        // anchor as text on four cells of the D-52 corpus where libyaml resolves it, which is the
        // silent-no-grant direction this whole phase exists to close.
        cur.nodeStarted = v !== "";
        // (D-59) A SEQUENCE ITEM IS ITS OWN REGION AND NO BLOCK SCALAR OWNS IT — which is why this
        // path already refused the escape three lines above, and the continuation path did not. The
        // asymmetry the review named as the tell is gone: both paths now record what kind of region
        // they are pushing, and the flush honours it.
        if (v !== "") cur.parts.push({ intro: "", body: v, block: false });
        continue;
      }
      // CONSUMER 2 (continuation path) — the node-start test, ASKED ONLY WHERE A NODE MAY BEGIN.
      // A real anchor, alias or unresolved tag at a genuine node start is still refused by name;
      // the same characters on a line that merely CONTINUES a scalar are content, which is what
      // stops a red gate from falling on `description: see` / `  *emphasis* here`.
      if (startsNode && startsWithReference(t)) return refuseRef(t);
      // (D-57) POSITION 3 OF 3 — A CONTINUATION LINE AT A NODE START MAY CARRY A HEADER, AT ANY
      // DEPTH. This is family G: `tools:` / `  nested: >-` / `    Read,` / `    # x, Agent(…)`,
      // where libyaml reads a mapping whose `nested` value carries the grant and this module read
      // `nested: >- Read,` and returned no grant. It is the same rule two levels down
      // (`tools:` / `  a:` / `    b: >-`) because the test is on the LINE's position, not on a depth.
      //
      // GATED ON `startsNode`, WHICH IS THE ANSWER THE MODULE ALREADY HOLDS. Inside an open quoted
      // scalar, or on a line that merely continues a scalar already begun, a `>` is an ordinary
      // content character and libyaml agrees — `description: see` / `  foo: >-` loads as the single
      // scalar `see foo: >-`. Re-deciding that here would be a second opinion about a fact
      // `startsNode` states once, twelve lines above.
      //
      // ASKED BEFORE `stripComment`, BECAUSE `stripComment` IS THE STAGE THIS DEFECT RAN THROUGH.
      // The whole of family G is a block scalar's literal content reaching a comment scanner that
      // YAML gives no comment meaning at that position; recognising the header first is what stops
      // the content from ever being offered to it.
      //
      // THE GATE IS DERIVED, AND `startsNode` ALONE WAS NOT ENOUGH — FOUND TWICE BY THIS PLAN'S OWN
      // RED TEAM AGAINST ITS OWN BUILDS, NEVER BY THE SUITE. `startsNode` answers "has THIS KEY's
      // value node begun", which is FALSE for every sibling entry of a nested mapping: `tools:` /
      // `  a: Read` / `  b: >-`, `tools:` / `  - k: v` / `    j: >-` and `tools:` / `  ? k` /
      // `  : >-` are all documents libyaml ACCEPTS with the grant in the loaded value, and all
      // returned the silent no-grant arm on builds that gated this on `startsNode` alone. Closing a
      // family at one position and reopening it at the position immediately after is not a closure;
      // see `BlockHeader.mappingValueIndicator` for the eight measured loader rows the gate is
      // derived from.
      //
      // AND THE FLOW GATE IS YAML'S OWN CONTEXT RULE, NOT A MEASUREMENT. A block scalar is a
      // BLOCK-CONTEXT construct (YAML 1.2 § 8.1); inside a flow collection a `>` cannot start a
      // token at all, which is why every header-inside-flow spelling probed is a loader syntax
      // error. The gate states the rule rather than the measurement, so a spelling no probe reached
      // is covered too.
      if (!inScalar && cur.state.flowDepth === 0) {
        const lineHeader = blockHeaderAt(t);
        if (
          lineHeader !== null &&
          (lineHeader.mappingValueIndicator || startsNode)
        ) {
          openBlock(cur, lineHeader, indent);
          continue;
        }
      }
      // CONSUMER 3 — the comment scanner, seeded from and storing back to the one carried state.
      //
      // (D-51) SEEDING SITE 3 OF 3 — one assignment, no gate. The sentence that stood here said a
      // continuation line "never starts a node, so it can only ever carry a state FORWARD and never
      // OPEN one", and the file contradicted it twelve lines above: `startsNode` is computed
      // precisely because a continuation line CAN be a node start when the key line carried no value
      // (family a) — and a node can also begin MID-LINE inside a flow collection (family b), which no
      // line-level expression can see at all. Both are now the scanner's business: it is handed the
      // line-level answer for offset 0 and decides the rest at the character.
      //
      // (D-54) THE LINE-START FACT HERE IS `startsNode`, NOT AN UNCONDITIONAL `true`, AND THE
      // DIFFERENCE IS MEASURED RATHER THAN ARGUED. `t` is a trimmed continuation line, so offset 0 is
      // always the first content of a physical line — but a line that CONTINUES a scalar begun
      // earlier is not a structural position at all, and libyaml says so: `description: see` /
      // `  ? maybe` loads as the single scalar `see ? maybe`, and `description: see` /
      // `  ? "quoted` / `  # x, T"` loads as `see ? "quoted` with the hash line taken as a COMMENT.
      // Passing `true` unconditionally would have made this module report a grant on that second
      // document where the loader has none — the never-exemptible direction, opened by the fix meant
      // to close its mirror image. `startsNode` already answers "may a node begin on this line", and
      // where no node may begin no LINE structurally begins either.
      const scanned = stripComment(t, cur.state, startsNode, startsNode);
      cur.state = scanned.state;
      const text = scanned.text.trim();
      // (D-55 point 1) THE SECOND OF THE TWO PLACES A VALUE NODE CAN BEGIN, AND THE FIELD'S OWN DOC
      // BLOCK HAS ALWAYS SAID SO. `nodeStarted` was assigned only on the key line; here is where a
      // node begins when the key line carried none, so here is where the fact becomes true.
      //
      // THE GUARD IS "CONTENT WAS ACTUALLY CONSUMED", ON THE SAME ARGUMENT AS THE KEY LINE'S. A
      // continuation line that is WHOLLY a comment begins nothing — libyaml takes the value from the
      // line after it — so an empty `text` leaves the fact alone, exactly as `tools: # x` does one
      // branch down. Those two spellings differ by one character and only one of them was ever
      // exercised before D-55; both are pinned now.
      if (text !== "") cur.nodeStarted = true;
      if (!startsNode && cur.parts.length > 0) {
        // A continuation of a node that has ALREADY BEGUN is the SAME node, so it folds into the
        // part it continues rather than becoming a part of its own. Pushing it would hand a block
        // sequence's `", "` join a boundary the document does not express — the invented-comma
        // direction again, this time one layer below the item boundary. YAML folds the line break to
        // a single space and so does this, which is why the flattened value matches the loader's
        // byte for byte.
        //
        // (D-55) THE CONDITION IS `!startsNode`, NOT `inScalar`. It was written when the ONLY way a
        // line could continue an already-begun node was an OPEN QUOTE, and that stopped being true
        // the moment `nodeStarted` learned about the continuation path. Measured: with the old
        // condition, `tools:` / `  - Agent(alpha, ga` / `    - mma)` still enumerated
        // ["alpha","ga","mma"] where libyaml expresses ["alpha","ga - mma"] — the invented name
        // surviving in the sequence spelling of the very direction this decision closes. `inScalar`
        // is a strict subset of `!startsNode`, so nothing that folded before stops folding.
        //
        // (D-59) AND THE REGION FOLDED INTO IS NEVER A BLOCK SCALAR'S — asserted rather than argued.
        // See `assertFoldTargetIsNotBlockOwned` for what holds it and what would break if it stopped
        // holding. The assertion is also what makes `${body} ${text}` below byte-identical to the
        // pre-D-59 `${part} ${text}`: it guarantees the target's introduction is empty, so the
        // region's text IS its body.
        const target = cur.parts[cur.parts.length - 1];
        assertFoldTargetIsNotBlockOwned(target, t);
        target.body = text === "" ? target.body : `${target.body} ${text}`;
        continue;
      }
      cur.parts.push({ intro: "", body: text, block: false });
      continue;
    }

    // At the baseline: either a comment line, or a new key, or something unreadable.
    const t = raw.trim();
    if (t.startsWith("#")) continue;
    const kv = t.match(KEY_LINE);
    if (kv === null) {
      return {
        ok: false,
        reason: `cannot read \`${excerpt(t)}\` as a frontmatter key line or as a continuation of the previous key`,
      };
    }
    const flushed = flush();
    if (flushed !== null) return flushed;
    const rest = (kv[2] ?? "").trim();
    // Refuse BEFORE flattening, and refuse on ANY key — an anchor parked under `_tools:` exists only
    // to be aliased from a real one, so the document as a whole is what becomes unreadable.
    if (startsWithReference(rest)) return refuseRef(t);
    // (D-57) POSITION 1 OF 3 — the top-level key line, which is where `BLOCK_INDICATOR` was asked
    // and was the ONLY place it was asked. It now routes through the same `openBlock` as the other
    // two positions, with `baseIndent` as the header line's indent — so the pre-existing behaviour
    // is one case of one rule rather than a separate rule that happens to agree.
    const keyLineHeader: BlockHeader | null = BLOCK_INDICATOR.test(rest)
      ? {
          leading: "",
          lineBreak: blockLineBreak(rest),
          mappingValueIndicator: false,
        }
      : null;
    if (keyLineHeader !== null) {
      cur = {
        key: kv[1],
        parts: [],
        block: false,
        blockIndent: baseIndent,
        blockLineBreak: " ",
        blockHasContent: false,
        seq: false,
        state: FRESH_NODE,
        nodeStarted: false,
        seqIndent: null,
      };
      openBlock(cur, keyLineHeader, baseIndent);
    } else {
      cur = {
        key: kv[1],
        parts: [],
        block: false,
        blockIndent: baseIndent,
        blockLineBreak: " ",
        blockHasContent: false,
        seq: false,
        state: FRESH_NODE,
        nodeStarted: false,
        seqIndent: null,
      };
      // (D-48) THE KEY LINE SEEDS FROM A FRESH NODE, AND THE ASYMMETRY WITH THE TWO CONTINUATION
      // POINTS IS DELIBERATE — DO NOT "FIX" IT TO MATCH THEM. A key line begins a NEW NODE, so no
      // scalar from the previous key can still be open across it; seeding from anything else would
      // let one key's unterminated quote silence the next key's comment stripping. It is also why the
      // node-start reference test a few lines above stays UNGUARDED here while both continuation
      // points guard theirs: the entering state at a key line is `FRESH_NODE` by construction, so
      // there is nothing to guard against, and adding a guard would imply a state that cannot exist.
      //
      // (D-51) SEEDING SITE 1 OF 3 — one assignment, no gate. Offset 0 of `rest` is the value node's
      // start, so the scanner is told so and its answer is stored.
      //
      // (D-54) AND THIS IS THE ONE SITE WHERE THE TWO FACTS COME APART. `KEY_LINE` has ALREADY
      // consumed `key:` and the whitespace after it, so a node may begin at offset 0 of `rest` while
      // the LINE began several characters earlier. `lineStartAtOffsetZero` is therefore `false` here
      // and `true` at both continuation sites — one boolean could not have carried both, and merging
      // them would put the block explicit-key indicator in a value position where YAML does not give
      // it that meaning.
      const scanned = stripComment(rest, FRESH_NODE, true, false);
      cur.state = scanned.state;
      const v = scanned.text.trim();
      // The node begins HERE only if the key line actually carries text. A key line whose value is
      // wholly a comment (`tools: # x`) begins nothing, so the following indented lines are still
      // node starts — libyaml agrees: it takes the value from the continuation line.
      //
      // (D-55) THIS IS SET-SITE ONE OF TWO. It is byte-unchanged; what changed is that the OTHER
      // place a node can begin — the continuation path — now sets it too, on the same "content was
      // actually consumed" guard. The field was named `nodeOnKeyLine` for this site alone, and that
      // name is the reason a reader could look straight at the omission and see a complete rule.
      cur.nodeStarted = v !== "";
      // (D-59) The key line's value is a region of its own, and no block scalar owns it — a key line
      // that DID carry a header took the branch above and never reaches here.
      if (v !== "") cur.parts.push({ intro: "", body: v, block: false });
    }
  }
  const flushed = flush();
  if (flushed !== null) return flushed;
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
//   was written to repair. See `ScalarState.openQuote` above, which is where that gate now lives.
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
//
// AND AN EIGHTH TIME — THE `trim()` ALPHABET, AT ITS THIRD APPLICATION POINT
// (27-REVIEW-GAPS-6 § IN-01, round 6 — D-50). THIS ENTRY IS NOT A NEW LESSON. It is the SAME defect
// D-39, D-42 and D-43 spent two rounds correcting at the delimiter positions, surviving at the one
// site those corrections did not reach: `parseFrontmatter`'s PROLOGUE SKIP, which decides which lines
// of a document exist at all.
//
//   The skip answered "is this line empty" with `String.prototype.trim()`. That built-in's alphabet
//   is ECMAScript WhiteSpace, which CONTAINS U+00A0 and does NOT contain U+200B, U+00AD or U+2060 —
//   narrower than the class this module declares two hundred lines below. So a document whose first
//   line was a lone ZERO WIDTH SPACE, with a real `---` block one line down carrying a live
//   `Agent(grugops-orchestrator)` grant, reached the KEYLESS SUCCESS arm and reported no grant, while
//   the same document with a NO-BREAK SPACE parsed and reported it. Two documents differing by which
//   alphabet a built-in happens to carry, given opposite answers by a module that declares its own.
//
//   AND THE SAME ONE-CODE-POINT PROLOGUE BYPASSED D-34 ENTIRELY: a ZWSP in front of a `%TAG` line
//   stopped the skip on the invisible line, so the directive one line down was never examined and the
//   document took the keyless arm instead of the directive refusal. A predicate is only as total as
//   the input it is handed — which is exactly the WR-03 lesson in the same round, one region over.
//
//   THE FIX SKIPS RATHER THAN REFUSES, AND THE IN-BLOCK SITES ARE DELIBERATELY LEFT ALONE. At the
//   prologue the narrow alphabet routes an invisible-only line to a SILENT SUCCESS; inside the block
//   it routes one to a REFUSAL, which is the safe direction AND the one a real YAML 1.2 loader agrees
//   with. The asymmetry is stated at both sites and asserted by a control case.
//
//   THE STANDING QUESTION THIS LEAVES FOR THE NEXT READER. When a predicate asks whether something is
//   EMPTY, ABSENT or BLANK, ask WHOSE ALPHABET ANSWERS IT — and whether that alphabet is the one this
//   module declares. A built-in carries its own, and where the built-in's alphabet is narrower than
//   the format's, the derivation is a denylist wearing a derivation's clothes (D-43's own words).
//
// AND A NINTH TIME — AND THIS ONE WAS NOT A PREDICATE'S CONTENTS OR A PREDICATE'S ARMS. IT WAS THE
// SET THE ARMS COVERED (27-REVIEW-GAPS-7 § CR-01, round 8 — D-51).
//
//   FIRST, THE COUNT, SO IT IS CITED AND NOT REMEMBERED. This is the NINTH entry in this ledger and
//   it comes from the EIGHTH review round; the two sequences are not the same, because round 6 alone
//   produced the sixth, seventh and eighth entries. Neither number is load-bearing for anything below
//   — every claim in this entry names an assertion instead.
//
//   Entries one through eight each sat INSIDE a rule: what an alphabet contained, how arms were split
//   or composed, where a rule had jurisdiction, whose alphabet answered a question, and — entry six —
//   the assembly that produced the value a rule reasoned about. D-48 fixed entry six by promoting
//   quote state to a property of the SCALAR and gating the carry at a node start. Both moves were
//   right, and both were verified against libyaml. What was wrong was the SET: the seeding of that
//   gate was wired into two of the three places a node can begin, and into NONE of the places a node
//   begins MID-LINE, so the union of the arms was not the set of node starts.
//
//     family (a)  `tools:` / `  "Read,` / `  # x, Agent(grugops-orchestrator)"` — the key line
//                 carries no value, so the CONTINUATION line is the node start. -> {ok:true,value:false}
//     family (b)  `tools: [Read,` / `  "Write,` / `  # x, Agent(…)"]` — the scalar opens MID-LINE
//                 inside a flow collection, which no line-level expression can see. -> the same arm.
//
//   THE REPRODUCTION WAS THE WHOLE GATE, NOT A PARSER ROW. Planted on BOTH distribution twins of
//   `skills/plan/SKILL.md` and on the non-coordinator adapter `.claude/agents/grugops-qe-e2e.md`, on
//   hermetic `git archive` mirrors, the foundation gate printed ALL CHECKS PASSED at exit 0 for both
//   families — while the IDENTICAL grant on ONE line exited 1 on the same mirror. One line break
//   flipped a red gate green, for the second round running, in the two spellings D-48's fix did not
//   reach. The six transcripts are recorded in 27-43-SUMMARY.md.
//
//   THE REMEDY WAS NOT A FOURTH ARM. Adding one would have closed family (a) and left family (b) on
//   the no-grant success arm — the reviewer measured exactly that patch and reported exactly that
//   result. So the SPLIT was deleted: `stripComment` is told whether offset 0 of its line is a node
//   start, tracks flow depth and node-may-begin as it walks, and returns an ALREADY-GATED state; the
//   three sites each perform ONE assignment and re-decide nothing; and the separate node-start-quote
//   helper is DELETED rather than kept beside the walk, for the third time in this module's life.
//
//   WHAT MAKES EACH CLAIM IN THIS ENTRY CHECKABLE, CITED RATHER THAN ASSERTED. In
//   scripts/frontmatter.test.ts: the six measured rows as named cases, each carrying its libyaml
//   column; the single-line byte-identity differential, which asserts this walk's returned TEXT is
//   unchanged from the pre-D-51 build over a generated corpus and reports the size it derived; the
//   non-circularity pin, which now also asserts no entry of its symbol list names something this
//   module no longer declares; and the SELF-DERIVING repository-wide control, which is what the
//   false-red paragraph above already cites. The value-map comparison that has caught every
//   regression in this predicate was run once at execution time, HEAD to HEAD, and reported zero arms
//   changed, zero values changed and zero new refusals over a corpus derived on both sides.
//
//   THE STANDING QUESTION THIS LEAVES FOR THE NEXT READER, AND IT IS ONE LEVEL BELOW ENTRY SIX'S.
//   Entry six asked what PRODUCED the value a predicate reasons about. This one asks: after
//   collapsing a split predicate into one authority, ASK WHAT INPUT THAT AUTHORITY IS HANDED, AND
//   WHETHER THAT INPUT CAN CARRY THE POSITION ITS ANSWER DEPENDS ON. A single authority handed a
//   line, asked a question about an offset, is still a per-line answer wearing a single-authority
//   label — and its arms will not look like arms, because there is only one of them.
//
// AND A TENTH TIME — AND THIS ONE WAS NEITHER A PREDICATE'S CONTENTS, NOR ITS ARMS, NOR THE SET THE
// ARMS COVERED. IT WAS THE CONDITIONS THE ARMS CARRIED (27-REVIEW-GAPS-8 § CR-01, round 9 — D-54).
//
//   FIRST, THE COUNT, CITED AND NOT REMEMBERED. This is the TENTH entry and it comes from the NINTH
//   review round. Nothing below depends on either number; every claim names an assertion instead.
//
//   Entry nine collapsed the split predicate into ONE walk and answered its own standing question —
//   the authority is handed a line AND the position facts it needs, and it decides at the character.
//   That was right, and it is untouched. What was wrong is one level in again: the arms of that one
//   authority carried a `depth > 0` condition on THREE indicators, and YAML gates only ONE of them
//   that way. Nobody added those conditions as a rule; they are the shape of the examples D-51's red
//   team happened to hold — every family it reproduced was a FLOW family, so `depth > 0` was true in
//   every example, and a condition that is true in every example you test is indistinguishable from a
//   condition the format states.
//
//     A   `tools:` / `  nested: "Read,` / `  # x, Agent(…)"`   the block mapping separator
//     B   `tools:` / `  - - "Read,` / `    # x, Agent(…)"`     the compact nested sequence
//     C   `tools: {"a":"Read,` / `  # x, Agent(…)"}`           JSON adjacency inside a flow mapping
//     F   `tools:` / `  ? "Read,` / `  # x, Agent(…)"` / `  : v`  the block explicit key
//
//   Each is a document libyaml ACCEPTS with the grant plainly in the loaded value, and each returned
//   `{ok:true,value:false}` — the silent no-grant SUCCESS arm — from the walk written to close the
//   ninth. Rows D, E, H and C2 are the same four positions in four more places.
//
//   THE REPRODUCTION WAS THE WHOLE GATE, AND IT WAS DONE TWICE BY TWO PARTIES. Planted on BOTH
//   distribution twins of the non-coordinator skill `plan`, on hermetic `git archive` mirrors, all
//   four families took `node scripts/check-foundation-guards.js` to ALL CHECKS PASSED at exit 0 while
//   the IDENTICAL grant on one line exited 1 on the same mirror. Ten transcripts — four families plus
//   the control, times two builds — are recorded in 27-47-SUMMARY.md.
//
//   THE REMEDY REMOVED CONDITIONS AND ADDED NO ARM. The chain in `stripComment` has the same five
//   arms it had before: the explicit-key indicator lost `depth > 0` for the condition YAML states (a
//   line's structural start with a separation after it), the mapping separator lost `depth > 0`
//   outright, and the separation rule gained YAML 1.2's actual second disjunct — a JSON-like key that
//   just closed — tracked in the SAME walk at the character where the quote closes. The item path
//   re-applies the BYTE-UNCHANGED `SEQ_ITEM` regex once per dash, because a compact nested sequence
//   is a fact the flattener already holds and a second grammar for it would be the weaker duplicate
//   this module deletes on sight.
//
//   WHAT MAKES EACH CLAIM CHECKABLE, CITED RATHER THAN ASSERTED. In scripts/frontmatter.test.ts, the
//   `D-54` describe block: the eight measured rows as named cases each carrying its libyaml column;
//   the adjacency, boundary and termination controls; `D-54 loader adjudication`, which generates its
//   corpus from the positions this plan touched, hands every region to `/usr/bin/ruby -ryaml` in one
//   batched process, keeps THREE module verdicts and not two, and asserts BOTH unsafe directions
//   empty — 20 members in the silent-while-loader-grants direction against the pre-D-54 build, 0
//   after; and `D-54 single-line differential`, which does NOT claim byte-identity but asserts the
//   moved set is exactly one named loader-rejected input and that every move LENGTHENS. The
//   repository-wide value map was run once at execution time with the parser isolated to identical
//   HEAD bytes and reported 0 arms changed, 0 values changed and 0 new refusals over a corpus derived
//   on both sides.
//
//   THE STANDING QUESTION THIS LEAVES FOR THE NEXT READER, AND IT IS THE ONE THIS ENTRY IS FOR.
//   Before accepting a predicate as structural, ASK WHICH OF ITS CONDITIONS COME FROM THE FORMAT AND
//   WHICH CAME FROM THE SHAPE OF THE LAST EXAMPLE SOMEONE TESTED. A condition satisfied by every
//   example in the corpus is invisible to that corpus; it will read as part of the rule to every
//   later reader, and it can only be found by going back to the grammar and asking what the grammar
//   actually gates. Entry nine's question was "what INPUT is the authority handed"; this one is "what
//   CONDITIONS is it carrying that nobody chose".

// AND AN ELEVENTH TIME — AND THIS ONE WAS NOT THE PREDICATE AT ALL. IT WAS THE SET OF POSITIONS THE
// PREDICATE WAS ASKED AT (27-REVIEW § family G/G2, round 10 — D-57).
//
//   FIRST, THE COUNT, CITED AND NOT REMEMBERED. This is the ELEVENTH entry and it comes from the
//   TENTH review round. Nothing below depends on either number; every claim names an assertion.
//
//   `BLOCK_INDICATOR` was CORRECT. Its pattern accepts every spelling YAML gives a block-scalar
//   header — the indicator, an optional indentation digit, an optional chomping sign in either order,
//   and an optional trailing comment. Nothing about it was wrong. It was asked at exactly ONE of the
//   several positions YAML allows a header to appear: `flattenBlock`'s TOP-LEVEL KEY LINE.
//
//     G   `tools:` / `  nested: >-` / `    Read,` / `    # x, Agent(o)`   a nested mapping's value
//     G2  `tools:` / `  - >-` / `    Read,` / `    # x, Agent(o)`         a block-sequence item
//
//   Each is a document libyaml ACCEPTS with the grant plainly in the loaded value, and each returned
//   `{ok:true,value:false}` — the silent no-grant SUCCESS arm. `cur.block` stayed false, so the block
//   scalar's LITERAL content was routed through `stripComment`, and the leading `#` on the token line
//   was stripped as a comment YAML never gives that position. The same shape reaches three further
//   positions the first draft of the remedy still missed and this plan's own red team found: the
//   header after a SIBLING mapping key, the header inside a sequence item's compact mapping, and the
//   header immediately after another block scalar's content.
//
//   THE REPRODUCTION WAS THE WHOLE GATE. Planted on BOTH distribution twins of the non-coordinator
//   skill `plan`, on hermetic mirrors, every family shape took `node scripts/check-foundation-guards.js`
//   to ALL CHECKS PASSED at exit 0 on the pre-fix build and to exit 1 naming both twins on the
//   post-fix build, while the IDENTICAL grant on one line exited 1 on both. The family was
//   re-measured byte-identical by FIVE consecutive plans (27-47 .. 27-51) before it was closed.
//
//   THE REMEDY ASKS THE ONE CONSTANT AT MORE PLACES AND WRITES NO SECOND GRAMMAR. `BLOCK_INDICATOR`
//   still has exactly one definition site; `blockHeaderAt` calls it, and `KEY_LINE`, at the two
//   further node-start positions. The scalar's END is YAML 1.2 § 8.1's own more-indented-block rule,
//   derived from the header line's own indent rather than guessed — the top-level case is
//   `blockIndent === baseIndent`, so the pre-existing behaviour became one case of one rule. The JOIN
//   is derived from the indicator too (§ 8.1.2 literal PRESERVES the break, § 8.1.3 folded FOLDS it
//   to a space), which is what makes the module's name set EQUAL the loader's on a literal scalar
//   whose enumeration spans a line break — both refuse.
//
//   WHAT MAKES EACH CLAIM CHECKABLE, CITED RATHER THAN ASSERTED. In scripts/frontmatter.test.ts:
//   `D-57 family G/G2`, twelve rows each carrying its libyaml column, with a derived non-vacuity
//   check that every row really spells a header BELOW the key line; `D-57 row g5`, the name-set
//   equality with the folded spelling as its one-character control; `D-57 false-red controls`, which
//   pins the shapes libyaml accepts as CONTENT (`tools: see` / `  >-` reads `see >- q,`) and the
//   two-item block-sequence join; and the two new `AXIS_KEY_LINE` members, which put this family
//   inside the D-52 generated corpus so the loader adjudicates it rather than this file.
//
//   THE STANDING QUESTION THIS LEAVES FOR THE NEXT READER, AND IT IS THE ONE THIS ENTRY IS FOR.
//   Entry nine asked what INPUT the authority is handed; entry ten asked what CONDITIONS it carries
//   that nobody chose. This one asks: AT WHICH POSITIONS IS THE AUTHORITY ASKED, and is that set the
//   set the format defines? A predicate can be total over its own input, carry only conditions the
//   grammar states, and still be defeated by never being consulted where the construct it recognises
//   is legal. Enumerate the positions from the grammar, then check each one is reached — and when a
//   fix lands, re-ask the question against the FIXED build, because a family closed at one position
//   and reopened at the position immediately after is not closed.

// The payload at each delimiter position. Declared here as data so both positions consult the same
// tokens in the same order, which is what makes the reported refusal deterministic for a given input.
const OPEN_PAYLOADS: readonly string[] = ["---"];
const CLOSE_PAYLOADS: readonly string[] = ["---", "..."];

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

// (D-50 — 27-REVIEW-GAPS-6 § IN-01, round 6) "DOES THIS LINE RENDER ANYTHING AT ALL", ASKED WITH THE
// CLASS THIS MODULE DECLARES INSTEAD OF THE ONE A BUILT-IN HAPPENS TO CARRY.
//
// ONE STATEMENT OF WHAT INVISIBLE MEANS. This consults `VISIBLE_GLYPH` — the SAME expression
// `leadingInvisibleRun` above bounds its run with — so a reviewer finds one statement of the class and
// not two. NO SECOND CHARACTER CLASS IS DECLARED HERE, and none may be: a second invisible class
// beside this one would be a defect in this fix rather than a refinement of it.
//
// WHY IT EXISTS. `parseFrontmatter`'s prologue skip asked "is this line empty" with
// `String.prototype.trim()`, whose alphabet is ECMAScript WhiteSpace — which CONTAINS U+00A0 and does
// NOT contain U+200B, U+00AD or U+2060. So a document whose first line was a lone ZERO WIDTH SPACE,
// followed one line down by a real `---` block carrying a live `Agent(grugops-orchestrator)` grant,
// reached the KEYLESS SUCCESS arm and reported no grant, while the same document with a NO-BREAK
// SPACE or an ordinary blank line parsed and reported the grant. Measured against the committed build
// before this change, and cross-checked against libyaml, which reads the prologue as its own document
// and the block as a second one CARRYING THE MAPPING AND ITS GRANT in every one of those spellings.
// Rows a and b differed from rows c and d only by which alphabet a built-in happens to carry.
//
// THIS IS A STRICT SUPERSET OF `trim() === ""`, WHICH IS WHY IT CANNOT COST A PARSE. Every character
// in ECMAScript WhiteSpace is a separator or a format code point, so none of them is a letter, number,
// punctuation mark or symbol; every line the old test skipped this one skips too. The change can only
// SKIP MORE, never fewer — and skipping more can only ever move a document from the keyless success
// arm towards its real frontmatter.
const rendersNoVisibleGlyph = (line: string): boolean =>
  !VISIBLE_GLYPH.test(line);

// The index of the first code point of `residue` outside the declared class, or -1 when every code
// point is inside it. ONE scan answering both halves the classifier needs: `=== -1` IS the legality
// of what follows the payload, and any other value is the position whose code point the refusal NAMES.
function firstOutsideDeclaredWs(residue: string): number {
  let at = 0;
  for (const c of residue) {
    if (!DELIMITER_WS_CHAR.test(c)) return at;
    at += c.length;
  }
  return -1;
}

// (D-50 — 27-REVIEW-GAPS-6 § WR-02, round 6) THE LEADING RUN, LABELLED BY WHAT IT IS MADE OF.
// ONE scan, ONE result, THREE kinds, and every run gets exactly one of them.
//
// WHAT THIS REPLACED AND WHY. This function used to return the run's LENGTH alone, and the classifier
// sliced that length off before asking "does `rest` begin with a payload". Space and tab render no
// glyph, so INDENTATION was inside the run and was therefore invisible to that question — an indented
// `---` answered YES — and the indentation reappeared only as the `run !== 0` clause, which is a
// REFUSAL. But indentation is exactly what distinguishes a delimiter from CONTENT: in YAML and in
// every markdown frontmatter reader the delimiter is at column 0, and an indented `---` inside a
// block scalar or a wrapped value is text. Measured against the committed build, three documents
// libyaml loads cleanly were REFUSED — `description: |` / `  intro` / `  ---` / `  outro`, the same
// with a folded `>` and an indented `...`, and the cheap one, an author wrapping a long
// `description:` whose continuation happens to begin with an ellipsis. A false red is a red gate
// whose only cure is deleting correct documentation, which D-34 records as the worse of the two.
//
// COMPOSITION IS PRIMARY, LENGTH IS A SLICING DETAIL — AND THERE IS NO SECOND OPINION. A length test
// and a composition test can DISAGREE (a run of length 2 is indentation or residue depending on what
// those two code points are), and the disagreement is invisible to a reader checking either in
// isolation. Two answers to "is this line indented" is precisely the pair-of-predicates shape D-44
// deleted from the classifier below after its union shipped a live bypass. So the composition is
// decided HERE, once, in the same walk that measures the length, and no call site re-derives it.
//
// THE EMPTY RUN IS ITS OWN KIND AND IS DELIBERATELY NOT "INDENTATION". A run of nothing is vacuously
// "entirely inside the declared class", and a two-way indentation/residue split would therefore label
// it indentation and route `--- foo` at the closing position out of its refusal — a real regression
// hiding inside a true-sounding sentence. `none` is stated as a kind so that boundary is decided ONCE
// here rather than patched with a length test at the point of use.
//
// (KIT-03 precision edge) CODE UNITS IN THE LENGTH, CODE POINTS IN THE LABEL. The length counts UTF-16
// units because its only job is to slice the string, and `String.prototype.slice` indexes units. The
// composition is decided per CODE POINT (`for...of`), and every character the refusal NAMES is read
// back with `codePointAt`, so a supplementary-plane code point (U+E0020, a plane-14 tag space) is
// reported as ONE `U+XXXXX` label and never as two surrogate halves. Mixing the two would either
// mis-slice the line or mis-name the byte, so the distinction is stated rather than left to be
// rediscovered.
//
// THE TWO CLASSES COMPARED HERE ARE BOTH ALREADY DECLARED IN THIS REGION — `VISIBLE_GLYPH`'s
// complement bounds the run, and `DELIMITER_WS_CHAR` labels it. No THIRD character class is
// introduced, and none may be: a second whitespace class beside `DELIMITER_WS_CHAR` would be a
// defect in this fix, not a refinement of it.
// (27-50, WR-05 — 27-REVIEW-GAPS-8 § WR-05, round 9 — D-56 item 4) THE RESIDUE ARM CARRIES THE CODE
// POINT THAT MADE IT RESIDUE, BECAUSE THIS SCAN ALREADY STOOD ON IT AND THREW IT AWAY.
//
// WHAT WAS WRONG, AND IT WAS THE DIAGNOSIS AND NEVER THE VERDICT. The classifier's leading-residue
// clause interpolated `line.codePointAt(0)`. For ` <ZWSP>---` the message read "its leading residue
// … begins with U+0020" — an ordinary space, which is INSIDE `DELIMITER_WS_CHAR` and is not why the
// line refused. The whole purpose of the D-44/D-50 wording is to name the offending byte so a reader
// is sent to the right character; that message sent them to a legal one.
//
// THE FIELD IS ON THE RESIDUE ARM ALONE, AND THAT IS THE POINT. "The offending code point of a run
// that has none" is not merely untested here — it is UNREPRESENTABLE. An `indentation` run has no
// code point outside the declared class and a `none` run has no code points at all, so neither arm
// can carry a value a later reader could interpolate. A field defaulted to 0 or to the line's first
// code point on those arms would reintroduce exactly this defect the next time someone reached for
// it. The compiler is what enforces that, not this comment.
//
// NO SECOND SCAN AND NO SECOND FLAG. The boolean `allDeclared` this replaced held strictly less
// information than the code point does, and asking a second walk for the offender would be the
// second-opinion shape the block above forbids by name: composition is decided HERE, once, in the
// same walk that measures the length. `firstOutsideDeclared < 0` IS "every code point was declared",
// so there is one fact and not two.
//
// CODE POINTS, NOT UNITS — the pairing the block above states. The walk is `for...of`, so `c` is a
// whole code point and `c.codePointAt(0)` names a supplementary-plane character as ONE `U+XXXXX`
// label rather than as a surrogate half. The length keeps counting UTF-16 units because its only job
// is to slice the string.
type LeadingRun =
  | { kind: "none"; length: 0 }
  | { kind: "indentation"; length: number }
  | { kind: "residue"; length: number; firstOutsideDeclared: number };

function leadingInvisibleRun(line: string): LeadingRun {
  let length = 0;
  let firstOutsideDeclared = -1;
  for (const c of line) {
    if (VISIBLE_GLYPH.test(c)) break;
    if (firstOutsideDeclared < 0 && !DELIMITER_WS_CHAR.test(c)) {
      firstOutsideDeclared = c.codePointAt(0) ?? 0;
    }
    length += c.length;
  }
  if (length === 0) return { kind: "none", length: 0 };
  return firstOutsideDeclared < 0
    ? { kind: "indentation", length }
    : { kind: "residue", length, firstOutsideDeclared };
}

// `U+` followed by four or more uppercase hexadecimal digits.
const codePointLabel = (cp: number): string =>
  `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;

// (D-44) THE VERDICT. Three kinds, a string discriminant so the exhaustiveness check below is
// compiler-enforced, and no fourth state. This type is what replaced a PAIR of boolean-returning
// refusal predicates whose union was assumed — never checked — to be the complement of the legal set.
type DelimiterVerdict =
  | { kind: "legal"; payload: string }
  | { kind: "refuse"; reason: string }
  | { kind: "not-a-delimiter" };

// (D-44 point 1) THE COMPILER-CHECKED NEVER-BRANCH. Every call site ends its switch here. Adding a
// fourth verdict kind to `DelimiterVerdict` without handling it at a call site makes `tsc` fail on the
// argument type — the unhandled kind is no longer assignable to `never`. That is the mechanism that
// keeps the promote from being undone quietly: a future author cannot reintroduce a second, partially
// consumed verdict without failing the build, rather than merely failing review.
function assertNeverVerdict(verdict: never): never {
  throw new Error(
    `unhandled delimiter verdict ${JSON.stringify(verdict)} — a kind was added to DelimiterVerdict without being consumed at this call site`,
  );
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
function classifyDelimiter(
  line: string,
  payloads: readonly string[],
  position: "opening" | "closing",
): DelimiterVerdict {
  const run = leadingInvisibleRun(line);
  const rest = line.slice(run.length);
  for (const payload of payloads) {
    if (!rest.startsWith(payload)) continue;
    const residue = rest.slice(payload.length);
    const outside = firstOutsideDeclaredWs(residue);
    if (run.kind === "none" && outside === -1) return { kind: "legal", payload };
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
    const faults: string[] = [];
    if (run.kind !== "none") {
      // (27-50, WR-05) NAME THE CODE POINT THAT MADE THE RUN RESIDUE, NOT THE ONE THE LINE BEGINS
      // WITH. What stood here interpolated `line.codePointAt(0)` unconditionally, so ` <ZWSP>---`
      // reported U+0020 — a character inside the declared class, and not the reason the line
      // refused. The clause names where the delimiter should begin and then pointed at a character
      // that is legal there, which is a defect in the refusal even though the verdict was right.
      //
      // THE CLAUSE'S WORDS ARE UNCHANGED AND ARE NOW TRUE. "Its leading RESIDUE … begins with X":
      // the residue is the part of the run outside the declared class, and that begins at the first
      // code point outside it. On a run whose first code point is itself the offender the two are
      // the same value, so those reasons are byte-identical before and after.
      //
      // THE INDENTATION ARM STILL NAMES THE LINE'S FIRST CODE POINT, and must. It is reached only at
      // the OPENING position (the closing position routes indentation to `not-a-delimiter` above),
      // where the fault is POSITIONAL — the line begins with whitespace instead of the payload — and
      // there is no code point outside the declared class for a reader to fix. The type is what
      // stops that fallback from being written on the residue arm by accident.
      faults.push(
        `its leading residue renders no glyph of its own and begins with ${codePointLabel(
          run.kind === "residue"
            ? run.firstOutsideDeclared
            : (line.codePointAt(0) ?? 0),
        )}, so the delimiter does not begin where the line begins`,
      );
    }
    if (outside !== -1) {
      faults.push(
        `the first code point after the payload, ${codePointLabel(residue.codePointAt(outside) ?? 0)}, is outside the one whitespace class a delimiter may carry`,
      );
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
// (Plan 27-45, D-53 — 27-REVIEW-GAPS-7 § WR-02) THE REGION IS LOCATED BEFORE ANYTHING IS DELETED FROM
// IT, AND NOTHING IS DELETED FROM IT AT ALL. This entry point used to fence-strip its input FIRST and
// locate the region afterwards, which meant an operation that DROPS LINES ran before the boundary
// that decides which lines belong to which grammar. The order is now: normalize, locate, flatten. The
// fence authority is not consulted here; its scope shrank to the guards' prose checks, which is the
// only place a fence means "documentation". See the module header for the measurement, the loader
// column and the honest scoping (a contract defect, not a confirmed live bypass).
//
// CRLF is normalized so a Windows checkout parses identically to a Unix one.
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
//     without being the one legal spelling, OR a CODE-FENCE DELIMITER LINE inside the located region
//     -> NOT ok, with a reason.
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
// (D-53) AND IT MOVED A FOURTH TIME, FOR THE FENCE, AND STILL DID NOT GROW. A column-0 code-fence
// delimiter line inside the located region used to sit in the FIRST outcome wearing a shorter value:
// the strip ran before the location, dropped the fence lines AND every line between them, and the
// truncated remainder was returned as a successful parse — `d1` lost its whole `tools` key and `d2`
// lost the token out of its value, both on `{ok:true}`. It now sits in the THIRD outcome with a named
// refusal, on the same argument every other in-region unreadable line already gets: a fence delimiter
// is not a legal node in a top-level block mapping, so it is content this module cannot account for,
// and content this module cannot account for is never reported as a value. Still three outcomes,
// still no fourth state — and the move is the same shape as the three above it: the partition MOVED,
// it did not grow.
//
// WHAT STAYED IN THE SECOND OUTCOME, DELIBERATELY. A document that does not begin with the payload AT
// ALL — even after its leading invisible run is stripped — is still a keyless success: a body-only
// file, an empty document, a document of blank lines only, a line of nothing but invisible characters.
// Turning a body-only file red would trade a silent success for a false red, which the paragraph
// above already argues is the worse of the two. The refusal keys on BEGINNING WITH THE PAYLOAD, which
// is precisely what a body-only document does not do.
//
// AND WHAT A SECOND DOCUMENT IN THE STREAM MEANS — RECORDED, NOT FIXED (plan 27-45, D-53 —
// 27-REVIEW-GAPS-7 § IN-05). Everything above enumerates DELIMITER SPELLINGS exhaustively and never
// once says what happens when a document carries MORE THAN ONE region. That silence is why this
// paragraph exists: an unconsidered adjacency is how the WR-05 arms came to be written one rule
// short, and a partition argument that never named its own neighbour is exactly the shape this
// module has had to correct four times.
//
//   WHAT THIS MODULE DOES, STATED PRECISELY RATHER THAN AS AN INTENTION. It reads ONE region: from
//   the opening delimiter to the FIRST legal closing delimiter, and then it stops. A second region
//   below that closing delimiter is body text to this module and is never read. There is no stream
//   parser here and no lookahead past the first close.
//
//   MEASURED IN BOTH COLUMNS, at plan 27-45 execution time, on a document carrying THREE regions
//   whose SECOND region's `tools` value holds the spawn token:
//
//     module:   {ok:true, keys={name:["r1"], tools:["Read"]}}, grant=false — the FIRST region only
//     libyaml:  6 documents (/usr/bin/ruby -ryaml, ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1,
//               Psych.parse_stream); doc3 = {"name"=>"r2",
//               "tools"=>"Read, Agent(grugops-orchestrator)"} — the SECOND region carries the grant,
//               and doc6 = "body" is read as a document too
//
//   `UNKNOWN - verify`, CARRIED FROM THE REVIEWER RATHER THAN ERASED: most markdown frontmatter
//   readers also take only the first delimiter-to-delimiter region, so the platform very likely
//   agrees with this module. That was NOT confirmed against Claude Code.
//
//   IT IS NOT CLAIMED AS A BYPASS AND A LATER READER MUST NOT ESCALATE IT INTO ONE. No live
//   reproduction exists, no shipped surface carries a second region, and the loader disagreeing with
//   a markdown frontmatter reader about a markdown file is not by itself a finding. It is recorded
//   because the argument above enumerates everything else and never mentioned this.
//
//   THE DECISION: THE PLATFORM READS ONE BLOCK, A STREAM IS OUT OF SCOPE, AND THE MODULE IS NOT
//   CHANGED TO READ FURTHER REGIONS. Reading them would WIDEN what this module reports over, on a
//   premise no measurement supports — the opposite of the direction every other decision here takes,
//   and the same "parse better" answer D-50 declined for the enumeration split. Refusing to widen is
//   the answer that cannot be wrong. If the platform is ever measured reading a second region, THAT
//   measurement is what reopens this, and it reopens as a bypass with a reproduction rather than as
//   a tidy-up. The behaviour is pinned by a case that cites this paragraph, so it is a DECISION with
//   a pin rather than an accident nobody wrote down.
export function parseFrontmatter(text: string): Parsed<FrontmatterKeys> {
  // (D-39 point 1) THE ONE NORMALIZATION POINT: a single leading byte-order mark, then CRLF. One
  // expression, one removed byte, position zero only. See the delimiter-region header above for why a
  // SECOND leading mark is deliberately left to the refusal instead of being stripped too.
  //
  // (D-53) AND THE FENCE STRIP THAT USED TO WRAP THIS EXPRESSION IS GONE FROM HERE. Nothing in this
  // function deletes a line any more. That is the whole of the WR-02 fix: an operation that drops
  // lines must not run before the boundary that decides which lines belong to which grammar.
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  // (D-50 — 27-REVIEW-GAPS-6 § IN-01, round 6) THE PROLOGUE SKIP DECIDES WHICH LINES EXIST, SO IT
  // ASKS THE QUESTION WITH THIS MODULE'S OWN ALPHABET.
  //
  // WHY THE FIX SKIPS RATHER THAN REFUSES — read this before "fixing" it to match D-34's directive
  // refusal one line below. The module HAD ALREADY DECIDED that a prologue line the skip considers
  // blank does not prevent frontmatter: an ordinary blank line parses, and so does a NO-BREAK SPACE.
  // A ZERO WIDTH SPACE got the opposite answer for one reason only — `trim()`'s alphabet is narrower
  // than the one this module declares. Skipping makes the module consistent WITH ITSELF, removes a
  // silent no-grant, and creates zero new refusals on legitimate content; refusing would invent a new
  // red class on a population no measurement shows this repository carries, which D-34 records as the
  // worse of the two. The direction is what makes this safe: it converts a silent no-grant into a
  // correct grant, and it cannot convert anything into a silent no-grant.
  //
  // WHY THE TWO IN-BLOCK `trim()` SITES ARE DELIBERATELY LEFT ALONE — `flattenBlock`'s blank-line
  // `continue` and the `firstContent` baseline below. THE DIRECTION IS OPPOSITE AT THE TWO PLACES.
  // HERE the narrow alphabet routes an invisible-only line to a SILENT SUCCESS; INSIDE THE BLOCK it
  // routes an invisible-only line to a REFUSAL ("cannot read `<ZWSP>` as a frontmatter key line"),
  // which is the safe direction AND is what libyaml does with the same document — measured, it
  // rejects it outright as a syntax error. Widening blankness inside the block would trade a refusal
  // for a silent skip on a document a real loader will not load. The asymmetry is DELIBERATE, and it
  // is asserted by the in-block control case in scripts/frontmatter.test.ts rather than merely
  // claimed here.
  while (i < lines.length && rendersNoVisibleGlyph(lines[i])) i++;
  // (D-34) BEFORE the delimiter test, because it is precisely the delimiter test's `else` — the
  // keyless SUCCESS arm — that a directive prologue used to fall into. One application point only.
  //
  // (D-50) AND THE SKIP ABOVE IS WHAT DECIDES WHICH LINE THIS TEST EVEN SEES. Measured against the
  // committed build before that change: a lone ZERO WIDTH SPACE placed in front of a `%TAG` line made
  // THIS REFUSAL DISAPPEAR — the skip stopped on the invisible line, the directive one line down was
  // never examined, and the delimiter test then returned the keyless success arm. One code point
  // bypassed D-34 entirely. A predicate is only as total as the input it is handed.
  if (i < lines.length && YAML_DIRECTIVE.test(lines[i])) {
    return {
      ok: false,
      reason: `the document opens with the YAML directive line \`${excerpt(lines[i].trim())}\` before any \`---\` delimiter — a directive declares a YAML processing context this module does not implement, so the value this document expresses is not something this module may report on; it is refused as unreadable rather than read as "no frontmatter, no keys"`,
    };
  }
  if (i >= lines.length) return { ok: true, value: new Map() };
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
    // (D-53 — 27-REVIEW-GAPS-7 § WR-02) A CODE-FENCE DELIMITER LINE INSIDE THE REGION IS CONTENT THIS
    // MODULE CANNOT ACCOUNT FOR, AND IT IS REFUSED HERE RATHER THAN DELETED UPSTREAM.
    //
    // WHY THIS IS THE RIGHT PLACE. The region is everything between the opening delimiter and the
    // first legal closing delimiter, and this loop IS the region. A line reaching here is inside the
    // region by construction, so the question "is this fence in the frontmatter or in the body" is
    // already answered — it cannot be asked correctly anywhere earlier, which is precisely why the
    // old strip-first ordering got it wrong.
    //
    // WHY REFUSE RATHER THAN SKIP OR STRIP. A column-0 fence line is not a legal node in a top-level
    // block mapping; libyaml rejects both measured documents outright with `Psych::SyntaxError`. So
    // there is no value for this module to report, and reporting the remainder after deleting the
    // fence and its contents is this module's founding failure — "I could not read this" printed as
    // "this carries no grant", with the shorter value standing in for the real one.
    //
    // AND IT ALSO SUBSUMES THE CASE THE OLD ORDERING EXISTED TO CATCH, which is why removing the
    // strip loses nothing. A real block that is never closed, followed by a fenced example whose
    // `---` a fence-blind reader would take as the close, cannot reach that `---` at all: the fenced
    // example's OPENING fence line is inside the region and refuses first. Documentation is still
    // never read as a live marker or grant — it is now kept out by a refusal instead of by a
    // deletion, which is the direction this module's contract requires.
    //
    // THE CLASS IS THE ONE `stripFencedBlocks` KEYS ON, read from the single declaration above. No
    // second fence state machine is introduced here and none may be.
    if (FENCE_DELIMITER_LINE.test(lines[j])) {
      return {
        ok: false,
        reason: `the frontmatter block opened at line ${openAt + 1} of the document carries the code-fence delimiter line \`${excerpt(lines[j])}\` at line ${j + 1}, before any closing \`---\` delimiter — a line beginning with three backticks is not a legal node in a top-level block mapping, so the region carries content this module cannot account for; it is refused as unreadable rather than having those lines DELETED and the shorter remainder reported as a value — never read as "carries no grant"`,
      };
    }
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
      // (D-53) "of the fence-stripped body" was corrected to "of the document": this entry point no
      // longer strips anything, so the line number the reader is handed is now the line number in the
      // file they will open. A diagnosis that names a line in a text the reader cannot see is a
      // diagnosis that sends them to the wrong place.
      reason: `frontmatter block opened at line ${openAt + 1} of the document and is never closed by a \`---\` delimiter — an unterminated block is unreadable, NOT an absence of keys`,
    };
  }
  const block = lines.slice(openAt + 1, end);
  // (D-50 — IN-01) THE SECOND IN-BLOCK `trim()`, ALSO DELIBERATELY UNCHANGED, FOR THE SAME REASON.
  // This picks the line whose indentation becomes the block's baseline. An invisible-only line is
  // NOT skipped here, so it can become the baseline — and that is what carries it into the key-line
  // refusal above rather than past it. Widening blankness here would skip such a line silently.
  const firstContent = block.find((l) => l.trim() !== "");
  return flattenBlock(block, firstContent === undefined ? 0 : indentOf(firstContent));
}

// ---------------------------------------------------------------------------
// The predicates every consumer actually wants
// ---------------------------------------------------------------------------

// The keys that grant a tool. `tools` is the sub-agent form and `allowed-tools` the skill/command
// form; both are what the platform reads. This list is the ENTIRE scope of the grant test — see the
// header for why widening it to the whole document would be wrong in both directions.
export const TOOLS_KEYS: readonly string[] = ["tools", "allowed-tools"];

// The spawn tool and its retained legacy alias, on a word boundary so a token is matched and a
// substring is not (`Agents`, `Taskmaster` are not grants).
const SPAWN_TOKEN = /\b(?:Agent|Task)\b/;
const SCOPED_GRANT = /\b(?:Agent|Task)\(([^)]*)\)/g;

// (D-50 — 27-REVIEW-GAPS-6 § WR-03, round 7) THE SPAWN-TOKEN OCCURRENCE IS THE UNIT, AND THE FORMED
// CAPTURE IS ONE OF THREE THINGS AN OCCURRENCE CAN BE.
//
// WHY THIS EXISTS AT ALL. `SCOPED_GRANT`'s class is `[^)]*`, so it stops at the first `)` and
// produces NO MATCH AT ALL when none follows. Every check `keysGrantedAgentNames` performs runs on
// `m[1]` — the content of a capture that FORMED. An occurrence for which no `m` exists is therefore
// examined by nothing, and the loop simply finds no matches and returns the SUCCESS arm with an
// empty list. Measured against the committed build before this change:
//
//   tools: Agent(alpha, gamma       ->  {ok:true, value:[]}   an enumeration truncated by an author
//   tools: Agent(alpha, #b, gamma)  ->  {ok:true, value:[]}   a capture destroyed by comment stripping
//   tools: Read, Agent              ->  {ok:true, value:[]}   a GENUINELY unscoped grant
//
// THREE DIFFERENT FACTS, ONE ANSWER, on the arm that claims to be safe. The first two are "this
// module could not read the enumeration"; the third is "this document never wrote one". Collapsing
// them means the KIT-03 closure equality and coordinator-resolution-precheck's set equality can each
// be computed over a set the document does not express — this module's founding failure, one
// predicate over.
//
// SO THE ACCOUNTING IS TOTAL BY CONSTRUCTION, NOT A TEST FOR THE SHAPE A FINDING REPORTED. Every
// occurrence of the spawn token in a value lands in EXACTLY ONE of three stated buckets, and the
// third is the complement of the first two rather than an enumerated list of bad spellings — D-30's
// polarity and D-44's totality argument, applied to the grant predicate. That is why a fourth
// spelling of "the capture did not form" cannot arrive as a later round's finding: there is no union
// of partial predicates for it to leak through.
//
// THE OCCURRENCES ARE ENUMERATED FROM `SPAWN_TOKEN`, NEVER FROM `SCOPED_GRANT`. The capture
// expression is the thing being audited; enumerating from it would ask the suspect to count itself.
// The scanning form is DERIVED from the one declared token test (source and flags), so there is one
// statement of what a spawn token is and no second one to drift.
//
// (Plan 27-45, D-53 — 27-REVIEW-GAPS-7 § IN-01) THE THREE DECLARATIONS BELOW ARE EXPORTED, FOR ONE
// STATED REASON AND NO OTHER. The balance check further down is provably unreachable in production:
// the accounting pushes exactly one of three string literals into `kind`, and `GRANT_OCCURRENCE_KINDS`
// holds those same three, so the comparison is false for every input today's code can produce. That
// is a FLOOR AGAINST A FUTURE EDIT, and a floor nobody can exercise is a promise rather than a floor —
// the exact shape plan 27-42 spent a plan closing in kit-model.ts while 27-41 shipped it anew in this
// module in the same round. A case must therefore be able to construct an occurrence whose kind is
// OUTSIDE the declared three, and that is the only way the arm can be reached at all.
//
// These are NOT part of the parsing API. No consumer outside this module's tests reads them, exactly
// as with `DQ_ESCAPE_ALLOWLIST` and `ENUMERATION_LEGAL_CHARS` — the module's established shape for
// telling latitude from contract at an export boundary.
export type GrantOccurrenceKind = "scoped" | "unscoped" | "neither";

// The three buckets, stated ONCE as data so the identity below counts what this list names. A fourth
// kind added to the type without being added here makes the identity fail arithmetically instead of
// being silently unclassified — this repository's derive-the-set-assert-the-count rule applied to a
// partition.
//
// EXPORTED (plan 27-45, D-53) so a case can assert its contents and its cardinality against the type,
// and so the fourth-kind case can state what "outside the declared three" means by reading this list
// rather than by re-typing it.
export const GRANT_OCCURRENCE_KINDS: readonly GrantOccurrenceKind[] = [
  "scoped",
  "unscoped",
  "neither",
];

// EXPORTED (plan 27-45, D-53) so a case can CONSTRUCT an occurrence at the test boundary. Production
// occurrences are only ever produced by `accountSpawnOccurrences`, which remains module-private:
// exporting the shape lets a case reach the refusal arm without exporting a second way to produce
// real occurrences.
export interface GrantOccurrence {
  kind: GrantOccurrenceKind;
  // The token as it was spelled (`Agent` or the retained legacy `Task`), for the refusal reason.
  token: string;
  // The bytes this occurrence covers: through its closing `)` when it has one, otherwise to the end
  // of the value — which is precisely the fragment a reader must be shown for an unterminated one.
  fragment: string;
}

function accountSpawnOccurrences(value: string): GrantOccurrence[] {
  const scan = new RegExp(SPAWN_TOKEN.source, `${SPAWN_TOKEN.flags}g`);
  const out: GrantOccurrence[] = [];
  let m: RegExpExecArray | null;
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

// (Plan 27-45, D-53 — 27-REVIEW-GAPS-7 § IN-01) THE COUNT IDENTITY, AS A PURE FUNCTION A CASE CAN
// REACH. Extracted VERBATIM from `keysGrantedAgentNames` below, following the precedent
// `scripts/kit-model.ts`'s partition function set in plan 27-42 rather than inventing a second shape.
//
// WHAT THE EXTRACTION CHANGES AND WHAT IT DOES NOT. It changes where the predicate LIVES. It changes
// NOTHING about what the predicate decides: the computation is the same reduce over the same declared
// kinds array, and the refusal's wording is moved byte-for-byte, interpolations included. An
// "improvement" to that wording here would invalidate the behaviour-preserving proof, and a reader
// depends on both interpolated counts, so it is deliberately not touched.
//
// THE ARM REMAINS UNREACHABLE IN PRODUCTION AND IS NOW EXERCISED BY A CASE — the disclosure and the
// assertion ship together, because either alone is the shape this module keeps correcting. Today's
// `accountSpawnOccurrences` can only emit the three declared kinds, so `classified` always equals
// `occurrences.length` and this function always reports balanced on real input. It becomes reachable
// the moment a fourth kind is added to the type without being added to the kinds array, which is
// precisely the edit the floor exists to catch.
//
// WHY IT TAKES THE VALUE AS WELL AS THE LIST. The refusal excerpts the value, and moving the wording
// byte-unchanged is a hard requirement of this extraction. Passing it costs nothing: the function
// reads no filesystem, holds no module-level state, calls no derivation, and returns the same answer
// for the same two arguments — pure by construction, not by assertion.
export type GrantBalance =
  | { balanced: true }
  | { balanced: false; reason: string };

export function checkGrantOccurrenceBalance(
  value: string,
  occurrences: readonly GrantOccurrence[],
): GrantBalance {
  const classified = GRANT_OCCURRENCE_KINDS.reduce(
    (n, kind) => n + occurrences.filter((o) => o.kind === kind).length,
    0,
  );
  if (classified !== occurrences.length) {
    return {
      balanced: false,
      reason: `the spawn-token accounting over \`${excerpt(value)}\` does not balance: ${occurrences.length} occurrence(s) of the grant token were found but ${classified} were classified as scoped, unscoped or neither; an accounting that cannot balance is a check that was NOT performed, so the value is refused rather than read as a name list — a name is never silently dropped or altered`,
    };
  }
  return { balanced: true };
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
export const ENUMERATION_LEGAL_CHARS: ReadonlySet<string> = new Set(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-., ",
);

// The first character of a captured enumeration that is OUTSIDE the legal set, with its code-point
// label, or a not-found marker.
//
// Iteration is by CODE POINT (`for...of`), never by UTF-16 unit, for the reason already stated at
// `leadingInvisibleRun`: a supplementary-plane character must be reported as ONE `U+XXXXX` label and
// never as two surrogate halves. It reuses the module's one `codePointLabel` rather than spelling a
// second one.
type OutsideLegal =
  | { found: true; char: string; label: string }
  | { found: false };

function firstOutsideEnumerationLegal(enumeration: string): OutsideLegal {
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
function toolsValues(keys: FrontmatterKeys): string[] {
  const out: string[] = [];
  for (const k of TOOLS_KEYS) out.push(...(keys.get(k) ?? []));
  return out;
}

// Does this parsed frontmatter grant the spawn tool?
export function keysHaveSpawnGrant(keys: FrontmatterKeys): boolean {
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
export function keysGrantedAgentNames(keys: FrontmatterKeys): Parsed<string[]> {
  const names = new Set<string>();
  for (const v of toolsValues(keys)) {
    // (D-50) THE TOTAL ACCOUNTING, RUN BEFORE THE CAPTURE LOOP CONSUMES THIS VALUE.
    const occurrences = accountSpawnOccurrences(v);

    // THE COUNT IDENTITY, ASSERTED RATHER THAN ARGUED. This is what makes the three buckets an
    // ACCOUNTING instead of three tests standing next to each other: a bucket that silently stops
    // matching shows up as arithmetic that does not balance, not as a quiet reclassification. An
    // accounting that cannot balance is a check that was not performed, and this module's discipline
    // is that such a check is NAMED and never silent.
    //
    // (Plan 27-45, D-53 — IN-01) THE COMPARISON MOVED OUT AND THE BRANCH DID NOT CHANGE. It is one
    // call to the exported pure function above, branched on exactly as the inline code branched, with
    // the same reason string reaching the caller. See that function for why the arm is unreachable
    // here and reachable from a case.
    const balance = checkGrantOccurrenceBalance(v, occurrences);
    if (!balance.balanced) {
      return { ok: false, reason: balance.reason };
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
    let m: RegExpExecArray | null;
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
        if (n !== "") names.add(n);
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
export function keyHasValue(
  keys: FrontmatterKeys,
  key: string,
  value: string,
): boolean {
  return (keys.get(key) ?? []).some((v) => v === value);
}

// Text-level convenience wrappers. They are thin — each parses once and delegates to the map-level
// predicate above, so THESE WRAPPERS ADD NO SECOND GRAMMAR: they answer from the value this module's
// one parser produced, never from bytes they re-read themselves. (Plan 27-42, D-50: narrowed from
// "so there is still exactly ONE grammar", which read as a claim about the tree. The tree-wide scope
// is stated once, in the module header, with the derived assertion that makes it mechanical — one
// statement of the scope, in the place a reader looks for it.) A consumer asking several questions about
// one file (the spawn-grant guard does) calls parseFrontmatter once and uses the map-level forms;
// these exist for call sites and tests that ask a single question.
export function hasSpawnGrant(text: string): Parsed<boolean> {
  const p = parseFrontmatter(text);
  return p.ok ? { ok: true, value: keysHaveSpawnGrant(p.value) } : p;
}

export function grantedAgentNames(text: string): Parsed<string[]> {
  const p = parseFrontmatter(text);
  // (D-32) Two distinct failure arms flow through here — the document did not parse, or a grant
  // fragment carried a sequence the enumeration will not resolve — and BOTH are returned as
  // failures. Collapsing either into `{ ok: true, value: [] }` is the silent-success shape.
  return p.ok ? keysGrantedAgentNames(p.value) : p;
}

export function frontmatterValueIs(
  text: string,
  key: string,
  value: string,
): Parsed<boolean> {
  const p = parseFrontmatter(text);
  return p.ok ? { ok: true, value: keyHasValue(p.value, key, value) } : p;
}

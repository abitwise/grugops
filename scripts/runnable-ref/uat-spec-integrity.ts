// uat-spec-integrity.ts — the UAT spec-integrity checker, a kit-shipped runnable (D-13).
//
// This is the mechanical half of UATX-06: the constructs a UAT spec may not contain are decided
// over the TypeScript AST, never by regex. A Playwright spec is full of selectors, comments and
// string literals that read like assertions; a textual matcher would refuse those and would let the
// recipe's prose claim more than the checker actually decides. The claim matches the mechanism
// because isBannedModifierPath below is the ONE authority that answers whether a resolved path is
// banned, and the three constants that rule reads are the constants the recipe quotes by value.
//
// It is also the mechanical half of UATX-05: when the parser or the browser lane is unusable, the
// run is a LOUD SKIP at exit 2 — "could not run" — so the UAT stays pending. A silent green is the
// forbidden outcome.
//
// The mechanism (D-13): authored as .ts in the central kit, compiled to a committed
// uat-spec-integrity.js (same tsc build + freshness gate as everything else), then MATERIALIZED by
// install.ts into the host's committed path tools/grugops/uat-spec-integrity.js. The host runs
// `node tools/grugops/uat-spec-integrity.js <repo-root>` with ONLY Node present — no ~/.grugops, no
// npm, no node_modules of grugops's own. That is why this file's ONLY top-level imports are node:
// builtins. The TypeScript parser is NOT shipped and NOT depended on: it is resolved from the TARGET
// repository at runtime through createRequire, inside a try/catch that loud-skips.
//
// The D-12 contract (a PRIOR phase's decision, uniform across all kit-shipped runnables — not Phase
// 31's D-12, which is about host availability of the attended lane):
//   node <repo-local-path>/uat-spec-integrity.js <repo-root> [--json] [--check-browser]
//     exit 0 → pass / no findings
//     exit 1 → findings / fail (the quality gate blocks)
//     exit 2 → error (could not run — distinguishable from a clean "fail")
//     stdout → human-readable findings in CLEAR PROFESSIONAL VOICE (the audit trail)
//     stdout → optional machine-readable { ok, findings } block when invoked with --json
//     stderr → every could-not-run reason, including both loud-skip markers
//
// VOICE DISCIPLINE (CLAUDE.md hard rule): every finding/error string this routine emits is
// CLEAR PROFESSIONAL ENGLISH — this is a quality/safety surface, never caveman voice.
//
// WHY THE BROWSER PROBE IS OPT-IN (--check-browser). The AST check needs no browser: it reads spec
// SOURCE. Probing the lane unconditionally would make every repository without Playwright installed
// exit 2, which would put the pass path out of reach and train a reader to ignore exit 2. The gate
// asks for the lane probe when it is about to RUN the specs; it asks for the AST check always.
// Either way an unusable lane is exit 2 and never exit 0.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { isAbsolute, join, resolve, sep } from "node:path";

// ── the closed sets this checker decides over ──────────────────────────────────────────────────

// D-05: the recognition key. A file is a UAT spec when it sits under a `uat` path segment AND its
// name ends with this suffix. The set is DERIVED from that rule at run time — never a list.
export const UAT_SPEC_GLOB_SUFFIX = ".uat.spec.ts";

// Directories the walk never descends into. This is the predicate's INPUT BOUNDARY: a spec planted
// in one of these is not counted, because a dependency's or a build output's spec is not this
// repository's evidence. Both sides of this boundary are tested — a spec under node_modules is not
// counted, and a spec in a legitimate deeply-nested uat/ directory is.
export const SKIPPED_DIRECTORIES: readonly string[] = Object.freeze([
  "node_modules",
  ".git",
  "dist",
  "tools",
  // D-30 (4): the scratch directory this repository's own probes generate into. A probe that leaves
  // a spec behind changes what the repository's own gate MEASURES — the derived denominator moves,
  // and a run that should report the zero-spec vacuity floor reports a finding instead. Skipping it
  // is the same decision `dist` and `tools` already carry: a generated tree is not this
  // repository's evidence. Round 5 measured the sibling harm (a stray spec under `.temp/` was
  // collected by the test runner and the suite died on SIGSEGV); `31-27` closed that at the runner,
  // and this closes it at the checker.
  ".temp",
]);

// D-14 arm (c), as decided by D-17: the banned member calls are a RULE over the resolved dotted
// path, never an enumerable list of dotted paths. The browser-UAT recipe quotes the three constants
// below BY VALUE and states the rule in prose, so the documented claim and the decided rule have a
// single source.
//
// D-17 (2026-09-08, gap-closure round 2, extending D-14 arm (c); forced by CR-06 and WR-12 of
// 31-REVIEW.md and by gap 2 of 31-VERIFICATION.md round 2). 31-06 closed gap 2 by centralising the
// SHAPE question in calleeDottedPath and leaving the MEMBERSHIP question as a nine-member literal
// compared by `includes`. The round-2 verifier then planted `test.describe.serial.only(...)` and
// `test.describe.parallel.only(...)` — real Playwright spellings that narrow an entire gate run
// exactly as `test.describe.only(...)` does — and this runnable reported `0 findings over 1/1 uat
// specs checked` at exit 0, on the same harness that correctly refuses `test.describe.only` alone.
// That is the same defect one segment over: a hand-maintained set literal rotting while every gate
// over it stays green. Adding two more members would have been the third round of the same edit.
//
// THE RULE, AND WHY IT IS A RULE. A modifier call is banned by the HEAD it starts from and the
// MODIFIER it ends in. The segments in between — `describe`, `serial`, `parallel`, and whatever
// routing segment Playwright adds next — ROUTE the call; they do not change what the tail does to
// the evidence a gate re-runs. Matching the PAIR rather than the whole literal path is what makes
// this a rule instead of an enumeration: `test.describe.serial.only` needs no new member, and
// neither will its successor. `expect.soft` is a head/tail pair of its own kind and stays explicit.
//
// D-14'S LETTER IS PRESERVED. Every path D-14 named — `test.skip`, `test.fixme`, `test.only`,
// `describe.skip`, `describe.only`, `expect.soft` — is still decided, and so are the three
// `test.describe.*` spellings 31-06 added. The bare-`describe` head is RETAINED: `@playwright/test`
// exports no top-level `describe`, but another framework's bare `describe` can be imported into a
// spec file, and D-14 names it.
//
// WR-12: THE INVERTING MODIFIER IS DECIDED, NOT SILENT. `test.fail(...)` marks a scenario as
// expected to fail, so Playwright reports a failing assertion as a pass. Its effect on the evidence
// is strictly WORSE than removal — the scenario is not dropped, it is inverted, and the lane is
// green BECAUSE the acceptance criterion failed. It joins the tail set. Leaving it undecided was
// also a choice, and it was being made silently.
//
// DELIBERATELY OUTSIDE THE RULE, written down here rather than left to be rediscovered:
//   - a promise `.catch()` handler — an assertion inside one is not refused;
//   - a finally block — D-14 names the try block and the catch clause, and names no third region;
//   - a spec body containing zero `expect` calls — vacuous evidence, explicitly deferred;
//   - the callee shapes named in UNRESOLVABLE_CALLEE_RESIDUALS below.
// These are DEFERRED, not overlooked. Widening a parser quietly is the failure mode a prior phase
// closed by defining a canonical form instead of adding one more spelling. A red-team finding on any
// of them is a NEW DECISION and a gap-closure round, never a quiet edit here.
//
// WHAT THIS RULE DOES NOT ESTABLISH. The head set and the tail set are HAND-AUTHORED, which is the
// axis this defect can reappear on. That the rule covers the real Playwright modifier surface is
// asserted in ONE direction only — every spelling it bans is real — until plan 31-12 lands the
// reverse partition over the declared surface. The declared surface is itself a hand transcription
// whose drift from the package is an open `UNKNOWN - verify`.
//
// ───────────────────────────────────────────────────────────────────────────────────────────────
// D-18 (2026-09-08, gap-closure round 3, extending D-14 arm (c) and D-17; forced by CR-07 and
// WR-14 of 31-REVIEW.md and by gap 1 of 31-VERIFICATION.md round 3). This is the runnable's mirror
// of the decision recorded in .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md; the two
// must agree.
//
// WHICH REGISTER FAILED. D-17 fixed MEMBERSHIP: `isBannedModifierPath` decides every shape it is
// asked about, by head and tail, and needs no new member for a routing segment nobody enumerated.
// The round-3 verifier then planted five constructs the rule is NEVER ASKED ABOUT, because
// `calleeDottedPath` declined to resolve their callees at all — `test.info().skip()`,
// `test.info().fail()`, `test.info().fixme(true, "later")`,
// `expect.configure({ soft: true })(locator).toBeVisible()`, and an import-renamed head
// (`import { test as it } from "@playwright/test"; it.skip(...)`). All five reported
// `0 findings over 1/1 uat specs checked` at exit 0 against the committed `.js`. The register that
// failed is SHAPE RESOLUTION — which call expressions the membership rule is even asked about —
// one register past the one D-17 fixed, and the third recurrence of this class inside Phase 31.
//
// D-18 THEREFORE ADDS NO MEMBER. It decides three declining shapes:
//
//   (1) A CALL LINK RESOLVES. `calleeDottedPath` recurses on a `CallExpression` link and, when the
//       inner path resolves, pushes it as ONE segment suffixed with a `()` marker. `test.info().skip`
//       therefore resolves to `test.info().skip`, whose head segment is `test` and whose tail
//       segment is `skip` — so D-17's existing rule refuses it with NO new member in any set. The
//       marker lands in the ROUTING position D-17 already decided is not part of the membership
//       question, which is why this needs no decided list of call-bearing heads (the alternative the
//       verifier's `missing:` offered, and the one that would have been a fourth set literal).
//       `expect(x).soft` stays legitimate BY CONSTRUCTION and not by exception: its head segment is
//       the MARKED `expect()` call rather than the bare `expect` identifier, so the path is
//       `expect().soft`, which is neither a banned exact path nor a banned head.
//
//   (2) THE CONFIGURED-SOFT ESCAPE IS A PATH PLUS AN ENABLED OPTION, not a path. Refusing
//       `expect.configure` by path alone would also refuse the legitimate
//       `expect.configure({ retries: 2 })`. BANNED_CONFIGURED_PATHS maps a dotted path to the ONE
//       option key whose `true` literal makes the call an escape, and `enabledOptionKeys` reads the
//       keys assigned the `true` keyword in the call's first object literal — literals only, no type
//       checker. `isBannedModifierCall` is the single authority that joins the two halves; the
//       arm-(c) call site asks it and compares nothing itself, exactly as D-17 requires.
//
//   (3) AN IMPORT RENAME IS CANONICALISED BEFORE THE HEAD IS READ. `deriveImportRenames` reads
//       `ImportSpecifier.propertyName` off the `@playwright/test` import declarations — a literal
//       already in the source text, needing no type checker — and `canonicaliseHeadSegment` rewrites
//       the resolved path's head through that map. `it.skip` becomes `test.skip` before membership
//       is asked.
//
// WHAT D-18 DOES NOT ESTABLISH. The rename canonicalisation is MODULE-SCOPED: a rename arriving
// through a local fixture-extension module is not canonicalised, because following a re-export
// across files needs the resolution this runnable deliberately does not ship (D-13). That, the
// step-guard bound, a non-identifier head and a member computed from a non-literal expression are
// NAMED in UNRESOLVABLE_CALLEE_RESIDUALS below rather than left as silences, and the test suite
// DERIVES the resolver's decline sites from this file's own AST and binds every one of them to a
// decision or to a named residual in both directions — so a sixth undisclosed shape arrives as an
// unbound derived site and reds the suite naming itself, instead of passing at exit 0.
//
// Reversibility: costly. The resolved-path spelling for a call link is now part of the exported
// contract the recipe quotes and the corpus asserts, exactly as D-17's constants are.
// ───────────────────────────────────────────────────────────────────────────────────────────────
// ───────────────────────────────────────────────────────────────────────────────────────────────
// D-20 (2026-09-09, gap-closure round 4, extending D-14 arm (c), D-17 and D-18; forced by CR-09,
// CR-10 and IN-10 of 31-REVIEW.md and by gap 1 of 31-VERIFICATION.md round 4). This is the
// runnable's mirror of the decision recorded in
// .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md; the two must agree.
//
// WHICH REGISTER FAILED. D-17 fixed MEMBERSHIP. D-18 fixed SHAPE RESOLUTION. The register that
// failed this round is WHICH ARMS THE RESOLVED SHAPE IS COMPARED AGAINST. D-18 (1) inserts a `()`
// marker segment into the resolved path and justified it for exactly ONE of the ban's three arms —
// the head/tail arm, where the marker lands in a routing position D-17 had already decided is not
// part of the membership question. The two WHOLE-PATH arms below compare the joined path as a
// literal, and the marker adds a segment to that string. The round-4 verifier reproduced both
// consequences against the committed .js at `0 findings over 1/1 uat specs checked`, exit 0:
// `expect.configure({ retries: 2 }).soft(locator)` resolves to `expect.configure().soft`, which is
// not a member of BANNED_EXACT_PATHS, and `expect.configure({ retries: 2 }).configure({ soft: true
// })(locator)` resolves to `expect.configure().configure`, which is not a key of
// BANNED_CONFIGURED_PATHS. Both are real soft assertions: the lane goes green BECAUSE the acceptance
// criterion failed. A second, independent miss sat one axis over — a `TestInfo` binding reached
// through the second callback parameter resolves cleanly to `testInfo.skip` and its head is simply
// not a banned head.
//
// D-20 THEREFORE ADDS NO MEMBER TO ANY SET EITHER. It makes three decisions:
//
//   (1) A ROUTING LINK IS NOT PART OF THE MEMBERSHIP QUESTION FOR ANY ARM. `stripRoutingLinks` is
//       the ONE answer to "what does a resolved path look like when a routing link is not part of
//       the membership question", and BOTH whole-path arms obtain their operand from it. The
//       head/tail arm is left exactly as D-17 left it, because there the property already holds by
//       construction. A path whose FIRST segment carries the marker is returned UNCHANGED: there the
//       marker IS the head — a user value was passed in — which is what keeps `expect(x).soft`
//       (`expect().soft`) a different construct from `expect.configure().soft`, legitimate BY
//       CONSTRUCTION and not by exception, exactly as D-18 (1) established.
//
//   (2) THE ENABLED-OPTION AXIS IS ASKED OF THE WHOLE MARKED CHAIN THE COMPARED PATH WAS FOLDED
//       FROM, not of the outermost call alone. `chainEnabledOptionKeys` unions `enabledOptionKeys`
//       over every call link in the callee chain, so a chain enabling the option at an INNER link is
//       decided identically to one enabling it at the outer link. The reviewer named only the outer
//       ordering; its mirror was measured as already refused, because the inner link is itself a
//       separately visited call node — and that is precisely the structural coupling this fold
//       removes, since the verdict must not DEPEND on which nodes the walk happens to visit.
//
//   (3) A TESTINFO BINDING REACHED THROUGH THE SECOND CALLBACK PARAMETER IS POSITIONAL, AND THE
//       POSITION IS A LITERAL IN THE SOURCE TEXT. `deriveTestInfoParameterNames` reads the name of
//       the SECOND parameter of the function passed as the second argument to a `test(...)`-headed
//       call — the identical class of parse-only reasoning D-18 (3) uses on
//       `ImportSpecifier.propertyName` — and `canonicaliseHeadSegment` rewrites such a head to the
//       canonical `test.info()` accessor form D-18 (1) already decided, before membership is asked.
//       `testInfo.skip` is therefore asked as `test.info().skip`.
//
// ONE FINDING PER CHAIN. Arm (c) now keys its emissions on the call's start position AND its
// routing-stripped path, exactly as arms (a) and (b) key theirs on the head identifier's position.
// Two links of one chain that fold to the same stripped path are one construct and are reported
// once; the fold in (2) would otherwise report the converse ordering twice.
//
// WHAT D-20 DOES NOT ESTABLISH. The fixture-parameter derivation is NOT scope-aware: a second
// parameter name that is also declared elsewhere in the file is canonicalised wherever it appears.
// That is the same shadowing boundary WR-20 records for the rename map, it is owned by plan 31-17,
// and it is NAMED in UNRESOLVABLE_CALLEE_RESIDUALS rather than left silent. A destructured second
// parameter names no single identifier to rewrite and is NAMED there too. The head and tail sets are
// still hand-authored, and the declared surface is still a hand transcription whose drift from the
// released package stays an open `UNKNOWN - verify`.
//
// Reversibility: costly. The routing-stripped spelling the arms compare, and the canonical head a
// fixture-parameter binding is asked as, are now part of the exported contract the recipe quotes and
// the corpus asserts, exactly as D-17's and D-18's constants are.
// ───────────────────────────────────────────────────────────────────────────────────────────────
// ───────────────────────────────────────────────────────────────────────────────────────────────
// D-21 (2026-09-09, gap-closure round 4 wave 2, extending D-18 and D-20; forced by WR-19 and WR-20
// of 31-REVIEW.md and by their independent reproduction in 31-VERIFICATION.md round 4). This is the
// runnable's mirror of the decision recorded in
// .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md; the two must agree.
//
// WHICH REGISTER FAILED, TWICE, AND NEITHER IS THE ONE THE PREVIOUS ROUNDS FIXED.
//
//   WR-19 — THE UNIT OF A BOUND, WHICH CHANGED WHEN THE CODE AROUND IT CHANGED. The 512-step chain
//   bound was written for a FLAT loop. D-18 (1) made `calleeDottedPath` recursive and did not
//   re-derive it, so "512 steps per resolution" silently became "512 steps per recursion frame" and
//   the bound stopped bounding. The cost was not slowness: a spec carrying a 4000-link call chain
//   exhausted the interpreter's stack, and because nothing caught the RangeError, `reportMeasured`
//   was NEVER REACHED — the vacuity floor and the denominator floor, the two branches whose whole
//   purpose is to make a check that did not run unreadable as a clean one, were bypassed BY
//   CONSTRUCTION while stdout stayed silent. The exit code was inside { 0, 1, 2 } only because
//   Node's uncaught-exception code happens to be 1, which the D-12 contract reads as "a finding".
//
//   WR-20 — WHETHER THE NAME BEING REWRITTEN IS THE NAME THE MAP IS ABOUT. `canonicaliseHeadSegment`
//   rewrote `segments[0]` whenever it was a key of a file-level map, with no scope analysis at all,
//   so a legitimate spec that renamed the framework import to `it` and separately bound a local `it`
//   was REFUSED — and the finding named `test.skip`, a construct absent from the file. The failure
//   direction is a FALSE REFUSAL, which trains a reader to work around the checker, and D-20 (3)
//   had just added a SECOND map feeding that same canonicaliser.
//
// D-21 ADDS NO MEMBER TO ANY BAN SET. It makes two decisions:
//
//   (1) THE CHAIN BOUND IS ONE SHARED BUDGET FOR A WHOLE RESOLUTION, AND THE WALK THAT ASKS IT USES
//       AN EXPLICIT STACK. `CALLEE_CHAIN_STEP_BOUND` is the one authority for the VALUE, and
//       `CalleeStepBudget` is the one authority for the UNIT: `calleeDottedPath` threads one budget
//       through its own recursion and charges the descent into a call link explicitly, so
//       interleaving calls buys a chain no extra steps. Bounding the resolver is necessary and NOT
//       sufficient, which is why `forEachDescendant` replaced both self-recursive AST walks: the
//       walk that ASKS the resolver was itself as deep as the chain a spec author writes, and no
//       step budget could reach that cost. Finally, a spec `findBannedConstructs` cannot finish is
//       a COULD-NOT-RUN reason recorded in `analyzeSpecs` rather than an escaping throw, so the exit
//       code is inside the D-12 contract BY DECISION on every path — and a file that could not be
//       analysed does not increment `visited`, so the denominator floor reports the short scan set.
//
//   (2) THE ONE CANONICALISER ASKS WHAT A HEAD IS BOUND TO, FOR EVERY MAP THAT FEEDS IT.
//       `deriveDeclaredBindings` is a per-source-file list of the bindings the file DECLARES — a
//       parameter, a `const`/`let`/`var` binding, a destructured binding element, a function name, a
//       class name — every one a literal in the source text, which is the same parse-only reasoning
//       D-18 (3) and D-20 (3) use. `canonicaliseHeadSegment` consults it BEFORE either map and
//       returns its input unchanged for a bound head, so the rule wins over BOTH maps and
//       introduces no decline site of its own. Writing the rule inside either map's derivation would
//       have been WR-20 one map over the moment a third map arrives. An import binding is
//       deliberately NOT counted — a census that counted import specifiers would make every rename
//       shadow itself and the canonicalisation would never fire.
//
//   D-27 (2026-09-09, gap-closure round 5) CORRECTS BOTH THE RULE'S SCOPE AND THE CLAIM MADE ABOUT
//   IT. D-21 (2) shipped that census FILE-SCOPED and this header called the rule "monotone in the
//   safe direction". Both were wrong, and the second is why the first survived review: stopping a
//   rewrite is the only direction in which this rule can change an answer, and for a BAN it changes
//   it from REFUSED to ACCEPTED, because a head that is not rewritten is not a banned head. The
//   round-5 verifier measured the consequence — a dead `const it = 1;` in an unrelated callback took
//   `it.skip(...)` at module scope from `1 finding(s)`/exit 1 to `0 findings`/exit 0 (CR-14). What
//   bounds the rule is therefore not its direction but NEAREST-BINDING RESOLUTION: a reference is
//   decided by the INNERMOST binding of its name whose range contains it, and only that binding.
//   Ranges are computed PER DECLARATION KIND, because the kinds disagree about where a binding
//   begins — `var` and function declarations hoist to their enclosing function, while `let`, `const`
//   and class declarations begin at their own declaration. The TestInfo fixture-binding position is
//   RECORDED as a NON-suppressing binding rather than omitted, which is what lets an inner fixture
//   parameter beat an outer declaration of the same name; the exemption stays a POSITION, narrowed
//   by WR-23 to index 1 of a function that is itself a call's SECOND ARGUMENT, and never becomes
//   membership of the map it constrains. Widening that resolution — including letting an outer
//   binding answer where an inner one exists — is a new decision and a gap-closure round.
//
//   D-28 (2026-09-09, gap-closure round 5) MOVES THE COULD-NOT-RUN BOUNDARY TO THE BYTES AND ADDS A
//   PROCESS BOUNDARY. D-21 (1) is right about WHAT a spec this runnable cannot finish is; it was
//   implemented around ONE FUNCTION. `ts.createSourceFile` — a recursive-descent parser running on
//   author-controlled source — sat one line ABOVE that `try`, so CR-15 measured WR-19's exact harm
//   at a QUARTER of the depth the round-4 fix had just closed: 1,000 nested parentheses gave an
//   uncaught RangeError, an EMPTY stdout, exit 1, and no measurement on EITHER stream. The register
//   that failed was neither the bound's value nor its unit but WHICH WORK THE BOUNDARY ENCLOSES.
//   D-28 makes three decisions. (1) EVERYTHING done with a spec's bytes — the read, the parse, the
//   diagnostics inspection and the walk — is inside one per-file boundary, and `deriveSpecPaths`'s
//   directory walk, the second unguarded self-recursion CR-15 named, is de-recursed in the same edit
//   so the fix covers the CLASS. (2) `main`'s whole body is inside one process boundary that names
//   the fault on stderr and returns 2 — 2 rather than 1 because 1 is a claim about the specs and a
//   runnable that could not complete has made none; the `try` returns what the body returns, so a
//   legitimate 0 and 1 pass through untouched. (3) The reached-measurement requirement is expressed
//   as "the measurement reaches the stream ITS BRANCH writes to", published as
//   `MEASUREMENT_BRANCH_STREAMS` and READ OFF `reportMeasured` rather than imposed on it —
//   `reportMeasured` stays byte-unchanged, because it is the `scripts/vacuity.ts` mirror and a
//   requirement that would have forced it to move a floor's output is a requirement to rewrite, not
//   a mechanism to re-author. Outside both boundaries: a fault that terminates the process WITHOUT
//   UNWINDING (an out-of-memory kill, a signal), disclosed by name in the recipe.
//
// WHAT D-21 AND D-27 DO NOT ESTABLISH. No binder is shipped (D-13), so resolution is a RANGE test
// over positions the parse already carries rather than real name resolution: a `typeof`-guarded
// conditional declaration, a `with` block and any other construct whose real binding a parser cannot
// see are outside what these ranges decide. A module-scope declaration still reaches the whole file
// wherever nothing nearer binds the name. A name shadowed ONLY at the fixture-binding position is
// still canonicalised. Every one of those costs is NAMED in UNRESOLVABLE_CALLEE_RESIDUALS with a
// reason true of it, quoted into the recipe from that one source, and asserted as a MEASURED case
// rather than described. The step bound remains a stated limit; it is now honestly one allowance for
// one resolution. The head and tail sets are still hand-authored, and the declared surface is still a
// hand transcription whose drift from the released package stays an open `UNKNOWN - verify`.
//
// Reversibility: costly. The bound's UNIT — one allowance for a whole resolution rather than one per
// frame — and the nearest-binding resolution rule are now part of the exported contract the recipe
// quotes and the corpus asserts. Reverting restores a resolver the verifier measured crashing with
// an empty stdout on a reachable input, a checker it measured refusing a legitimate spec while
// naming a construct that is not in it, and a checker it measured ADMITTING `it.skip` at module
// scope because of a dead declaration in an unrelated block.
// ───────────────────────────────────────────────────────────────────────────────────────────────
// ───────────────────────────────────────────────────────────────────────────────────────────────
// D-30 (2026-09-10, gap-closure round 6; the S2 CUTOVER, taken by a NAMED HUMAN at this plan's
// blocking checkpoint and quoted verbatim in 31-28-SUMMARY.md before any deletion). Forced by
// CR-18, CR-21, WR-26, WR-29, WR-30, IN-15 and residual RR-07 of 31-REVIEW.md, each independently
// reproduced in 31-VERIFICATION.md round 6. This is the runnable's mirror of the decision recorded
// in .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md; the two must agree.
//
// WHICH REGISTER FAILED. Not membership (D-17). Not shape resolution (D-18). Not which arms the
// shape is compared against (D-20). Not the scope the census is asked over (D-27). What failed is
// THE AUTHORITY THOSE QUESTIONS WERE PUT TO. Every one of them was a question about the TypeScript
// LANGUAGE — where does this name bind, which declaration does this reference reach, what is the
// declared type of this callback parameter — and every one of them was answered by a predicate
// hand-authored in this file. Round 5 shipped one such fix and produced four Criticals in it: a
// block-scoped function declaration was handed the whole module's range (CR-18); a `using`
// declaration was classified as hoisting (WR-30); a fixture exemption was granted at a position
// wider than the map it exempted for (WR-26); and the scenario body was read from a fixed argument
// index the framework's own documented overload set contradicts (CR-21). Every member of
// UNRESOLVABLE_CALLEE_RESIDUALS ended with the same four words: *without a type checker.*
//
// D-30 THEREFORE CHANGES THE AUTHORITY, NOT THE PREDICATE.
//
//   (1) A BANNED CALL IS ONE WHOSE CALLEE RESOLVES, BY SYMBOL IDENTITY, TO A MEMBER DECLARED BY THE
//       FRAMEWORK ITSELF. `createProgramForTarget` builds a Program from the TARGET repository's own
//       `typescript` (D-13 already REQUIRES the target to ship it, and `loadTypeScriptFromTarget`
//       already resolves it), and `resolveBannedModifier` asks that Program's checker which symbol
//       the callee is. Identity is decided against the framework's own DECLARATION FILES, never
//       against a module-specifier string, so a re-export chain through any number of intermediate
//       modules resolves and a local module that merely names itself `@playwright/test` does not.
//       The membership question the identity path then asks is the SAME `isBannedModifierCall` —
//       one membership authority, fed a path canonicalised by identity instead of by spelling.
//
//   (2) THE RESOLUTION IS TRI-STATE, AND THE MIDDLE STATE IS THE POINT. `framework` decides the
//       ban. `foreign` — the checker resolved the symbol and it is NOT the framework's — decides
//       NOT-banned and the spelling rule is never consulted, which is what makes WR-26's false
//       refusal impossible rather than merely narrowed. `unresolved` — the checker has no symbol —
//       falls through to the spelling rule below, which is where D-27's temporal-dead-zone refusals
//       live.
//
//   (3) THE SPELLING RULE IS KEPT BESIDE IDENTITY, DELIBERATELY, AND THE PAIRING IS DISCLOSED. This
//       is two grammars for one question, which this file's own history argues against — and it was
//       chosen anyway, by the named human at the checkpoint, because identity ALONE loses a refusal
//       D-27 measured and closed: `it.skip(...)` followed by a later `let it = 1;` in the same block
//       gives the checker no symbol at all, so identity cannot decide it, while the declared-binding
//       census can and does. The pairing is a UNION IN THE REFUSING DIRECTION ONLY, it is named in
//       UNRESOLVABLE_CALLEE_RESIDUALS as a residual of its own, and it is bounded by (2): the
//       spelling rule is asked only where identity returned no answer.
//
//   (4) A PROGRAM THAT CANNOT BE CREATED IS A CHECK THAT DID NOT RUN. RR-07 disclosed a SILENT
//       degrade — a parser lacking predicates fell back to the pre-D-18 rule, a smaller ban applied
//       without saying so, which is a gate LOWERING rather than a disclosed limit. A target with no
//       configuration file, an unreadable or unparseable one, or a `typescript` whose Program throws
//       now exits through the D-28 could-not-run boundary at exit 2 with PROGRAM_UNAVAILABLE_REASON
//       and its own cause. The same decision covers the framework itself: a target whose
//       `@playwright/test` declarations do not resolve gives every callee no symbol, so the check
//       would pass everything — that too is a could-not-run, never a pass. And the predicate surface
//       the spelling rule needs joins `loadTypeScriptFromTarget`'s VALIDATED list, so its absence is
//       the existing loud skip rather than a quieter ban.
//
//   (5) FIVE APPROXIMATIONS ARE DELETED, AND TWO DEFECTS INSIDE THE SIXTH ARE FIXED RATHER THAN
//       LEFT UNDER IDENTITY'S COVER. Deleted: the fixed-index scenario-body read
//       (`deriveTestInfoParameterNames`), the fixture-position exemption
//       (`isFixtureBindingPosition`), and the chain-step bound (`CALLEE_CHAIN_STEP_BOUND` with the
//       recursion that needed it — `calleeDottedPath` now walks an explicit stack, so there is no
//       frame to exhaust and no allowance to state). Fixed inside the surviving census: a FUNCTION
//       DECLARATION hoists to its enclosing BLOCK, not to its enclosing function (CR-18), and a
//       `using` / `await using` declaration is BLOCK-SCOPED and is no longer classified as hoisting
//       (WR-30). Leaving those two under identity's cover would have been "another rule catches it",
//       which is the reasoning this phase has now paid for six times.
//
// WHAT D-30 DOES NOT ESTABLISH. It does not make the reported SPELLING an authority: the finding's
// dotted path is derived from the framework's own declared surface for a reader, and a misderived
// path changes the text of a finding identity already decided, never the verdict. It does not
// establish the cost or the failure modes of creating a Program in a large host repository — this
// repository measured its own, and a host's is its own. It does not establish the resolved-package
// route: `@playwright/test` cannot be installed here (CLAUDE.md fixes the dev dependency set), so
// the ambient-declaration route is MEASURED and the node_modules route is reasoned — an open
// `UNKNOWN - verify` carried beside `R-07`. It does not establish anything on Windows, which is
// `R-03` and is `31-30`'s to measure. And it leaves RR-02, RR-04' and RR-06 as named refusals.
//
// Reversibility: ONE-WAY, and the checkpoint is why a human opened the door. The runnable's public
// contract grew — a target must now provide a `typescript` that can create a Program, and a
// repository with no configuration file BLOCKS a gate that previously passed. The register shrank
// and `browser-uat-recipe.md` quotes the smaller one. Reverting means restoring five hand-authored
// predicates that produced four Criticals in a single round.
// ───────────────────────────────────────────────────────────────────────────────────────────────
export const BANNED_MODIFIER_HEADS: readonly string[] = Object.freeze(["test", "describe"]);
export const BANNED_MODIFIER_TAILS: readonly string[] = Object.freeze([
  "skip",
  "only",
  "fixme",
  "fail",
]);
export const BANNED_EXACT_PATHS: readonly string[] = Object.freeze(["expect.soft"]);

/**
 * D-18 (1): the suffix `calleeDottedPath` appends to a segment folded from a CALL link. Exported so
 * the recipe, the corpus and this file's own normaliser all read the marker from one source rather
 * than each spelling it again.
 */
export const CALL_LINK_MARKER = "()";

/**
 * D-20 (1): THE ONE ANSWER to "what does a resolved path look like when a routing link is not part
 * of the membership question", and the ONLY place that question is decided. Every arm that compares
 * a WHOLE joined path against a ban set obtains its operand from here; the head/tail arm reads the
 * un-normalised segments, because there the property already holds by construction (D-17).
 *
 * THE RULE, IN ONE SENTENCE. An INTERIOR segment carrying the call marker is a ROUTING link and is
 * dropped, but a path whose FIRST segment carries the marker is returned unchanged, because there
 * the marker IS the head — a user value was passed in, which is the fact that makes the marked-head
 * assertion `expect(x).soft` a different construct from the interior-link `expect.configure().soft`.
 *
 * IT DECLINES NOTHING, and that is deliberate rather than incidental, exactly as it is for
 * `canonicaliseHeadSegment`: every exit returns its input or a rewrite of its input, so the
 * resolver's derived decline set stays exactly the set of positions where a path could not be
 * produced in the first place.
 */
export function stripRoutingLinks(dottedPath: string): string {
  const segments = dottedPath.split(".");
  // A path that is ONLY a marked head has no interior link to strip and must not become empty.
  if (segments[0].endsWith(CALL_LINK_MARKER)) return dottedPath;
  return segments.filter((s, i) => i === 0 || !s.endsWith(CALL_LINK_MARKER)).join(".");
}

/**
 * THE ONE MEMBERSHIP AUTHORITY. Answers whether a resolved dotted path is banned, and nothing else
 * in this file answers that question: the arm-(c) call site ASKS this function and performs no
 * comparison of its own. Keeping a list of banned dotted paths beside this rule would be two
 * authorities for one question, which is exactly what this file's header forbids and exactly what
 * the round-2 verification found.
 *
 * `null` — the path calleeDottedPath returns when it cannot resolve the callee from the source text
 * alone — is accepted and answered `false`, so the caller needs no null comparison either. The
 * return type is a predicate so the caller keeps the narrowed string it reports.
 */
export function isBannedModifierPath(dottedPath: string | null): dottedPath is string {
  if (dottedPath === null) return false;
  // A WHOLE-PATH ARM (D-20 (1)): it compares the joined path as a literal, so a routing call link
  // would otherwise insert a segment and walk past it. `expect.configure().soft` IS `expect.soft`.
  //
  // IN-12: the normaliser is computed ONCE PER ARM, into a local, and every position in the arm
  // compares against THAT local. One arm, one normalised operand; a second call is a second chance
  // for two positions to answer different questions about one path.
  const normalised = stripRoutingLinks(dottedPath);
  if (BANNED_EXACT_PATHS.includes(normalised)) return true;
  // The HEAD/TAIL ARM, exactly as D-17 left it, and deliberately over the UN-normalised segments.
  // It reads only the first and last segments, so an interior marked link is already routing-neutral
  // here — and normalising the head would erase the marked-HEAD distinction that keeps
  // `expect(x).soft` legitimate by construction.
  const segments = dottedPath.split(".");
  // A single segment is a plain call, not a modifier call: `test(...)` is the thing the gate runs.
  if (segments.length < 2) return false;
  return (
    BANNED_MODIFIER_HEADS.includes(segments[0]) &&
    BANNED_MODIFIER_TAILS.includes(segments[segments.length - 1])
  );
}

/**
 * D-18: THE ONE MEMBERSHIP AUTHORITY THE ARM-(c) CALL SITE ASKS. It takes the resolved (and
 * head-canonicalised) dotted path and the set of option keys the call enables with a `true` literal,
 * and answers the whole membership question in one place.
 *
 * The pure-path half is DELEGATED to `isBannedModifierPath` rather than reimplemented: two functions
 * deciding one question are two places for the answers to disagree, which is exactly the defect
 * D-17 was convened to close. This function adds only the second half — the path-plus-enabled-option
 * pair D-18 (2) decides — and nothing else in this file answers either half.
 *
 * `null` for either argument is accepted and answered `false`, so the caller needs no comparison of
 * its own. The return type is a predicate so the caller keeps the narrowed string it reports.
 */
export function isBannedModifierCall(
  dottedPath: string | null,
  enabledOptions: ReadonlySet<string> | null,
): dottedPath is string {
  if (isBannedModifierPath(dottedPath)) return true;
  if (dottedPath === null || enabledOptions === null) return false;
  // The second WHOLE-PATH ARM (D-20 (1)). Its presence check and its value read are two positions,
  // and BOTH obtain their operand from the one normaliser: an arm whose presence check is normalised
  // and whose value read is not would answer two different questions about the same path.
  //
  // IN-12: that argument is now EXPRESSED rather than only stated. The normaliser runs ONCE, into a
  // local, and both positions read that local — so the two cannot drift apart when this function is
  // next edited, which is the only way the comment above could stop being true.
  const normalised = stripRoutingLinks(dottedPath);
  if (!Object.prototype.hasOwnProperty.call(BANNED_CONFIGURED_PATHS, normalised)) {
    return false;
  }
  return enabledOptions.has(BANNED_CONFIGURED_PATHS[normalised]);
}

/**
 * D-18 (2): the dotted paths whose call is an escape only when an OPTION is enabled, mapped to the
 * ONE option key whose `true` literal enables it.
 *
 * WHY THIS IS NOT A BAN LIST. `expect.configure` is a legitimate call — `expect.configure({ retries:
 * 2 })` re-runs a matcher and changes no result. What makes it an escape is `soft: true`, which
 * turns every assertion produced by the configured matcher into one that records a failure without
 * failing the scenario, so a green lane certifies a scenario whose acceptance criterion failed. A
 * bare path membership would refuse the legitimate call too; that is why the decision is a PAIR and
 * why the pair is joined by the single membership authority below rather than compared at the call
 * site.
 */
export const BANNED_CONFIGURED_PATHS: Readonly<Record<string, string>> = Object.freeze({
  "expect.configure": "soft",
});

/** The module specifier a rename must arrive through for D-18 (3) to canonicalise it. */
const PLAYWRIGHT_TEST_MODULE = "@playwright/test";
/**
 * D-20 (3): the head segment a TestInfo fixture-parameter binding is rewritten to.
 *
 * It is the MARKED ACCESSOR FORM D-18 (1) already decided for this construct — `test.info()` — and
 * not a new spelling nobody decided. `testInfo.skip` is therefore asked as `test.info().skip`, the
 * exact path the corpus, the recipe and the round-3 closure already carry, so the family has ONE
 * spelling in the findings a reader sees rather than two.
 */
export const TEST_INFO_CANONICAL_HEAD = `test.info${CALL_LINK_MARKER}`;

/**
 * D-18 (3): the rename map's value for a NAMESPACE import local name. Spelled `*` because that is
 * how a namespace import is written in the source, and because `*` cannot collide with any imported
 * name: it is not a valid identifier, so no `import { X as y }` can ever produce it.
 *
 * A namespace head is DROPPED rather than rewritten — `pw.test.skip` is asked as `test.skip` —
 * because a namespace binds the whole module rather than one export, so there is no single imported
 * name to substitute.
 */
const IMPORT_NAMESPACE_MARKER = "*";

// D-30: THE CALLEE SHAPES THIS RUNNABLE STILL CANNOT DECIDE, exported as prose so the recipe quotes
// the disclosed boundary from the same source as the decided rule.
//
// THE REGISTER SHRANK BY MEASUREMENT, NOT BY ARGUMENT. Before this plan it held NINE members, every
// one of them ending in the words *without a type checker*. The checker is now asked, so four of
// them (an aliased binding, a rename through another module, a destructured TestInfo binding, and
// the nearest-binding scope rule as the ban's only scope authority) are CLOSED — each by a corpus
// row driven at the gate's own entry that reported `0 findings` / EXIT=0 before and `1 finding(s)` /
// EXIT=1 after. A fifth (the chain-step bound) was DELETED WITH THE CODE THAT NEEDED IT. A sixth
// (a parser lacking predicates) is no longer a silent degrade: the predicates are validated, so
// their absence is the loud skip, and a Program that cannot be created is exit 2. The member below
// that replaces it states the could-not-run route rather than the degrade.
//
// The suite binds every member to a decline site it DERIVES from this file's own AST, in both
// directions, so a residual naming a site the resolver no longer has is caught the same way an
// undisclosed site is.
export const UNRESOLVABLE_CALLEE_RESIDUALS: readonly string[] = Object.freeze([
  "A member computed from a non-literal expression is not decided by identity: `test[name](...)` where `name` is a variable. The checker resolves no symbol at that position. The call then falls to the spelling rule. That rule cannot read a member name the source text does not carry.",
  "An option is ENABLED only when the call's first argument is an object literal assigning it the `true` keyword. A variable argument enables nothing, and neither does a variable option value. This runnable parses and never evaluates.",
  "IDENTITY AND SPELLING ARE TWO RULES FOR ONE QUESTION. The pairing is a decision rather than an oversight. Identity decides every call whose callee the checker resolves. `framework` refuses. `foreign` accepts. In both cases the spelling rule is not consulted. The spelling rule is the import and namespace rename map plus the declared-binding census. It is asked ONLY where the checker resolved no symbol at all. A temporal-dead-zone reference lives exactly there. Keeping it is what preserves D-27's refusals. It is also a second grammar. This file's own history says two grammars can drift apart. What would force it closed: a reproduced case in which the spelling rule REFUSES a construct identity would have called `foreign`. A refusal in that direction is the only way the pairing can be wrong.",
  "A callee whose head is not an identifier is decided only where the checker resolves it. `({ test }).test.skip(...)` IS refused. Its member's declaration is the framework's own. A call on `this` yields no symbol and no head segment. So does a call on an object whose member the checker cannot resolve. No membership question can be put in either case.",
  "A target repository whose TypeScript cannot create a Program makes NO claim about the specs. The causes are named: no configuration file, one that cannot be read, one that cannot be parsed, or a compiler that throws. It exits 2 with PROGRAM_UNAVAILABLE_REASON and its own cause. A target whose framework declarations do not resolve is the same event and the same exit code. Neither is a pass. Neither is a quieter ban. A smaller ban applied without saying so is a gate lowering. This member replaces exactly that silent degrade. THE GRANULARITY IS WHOLE-RUN. Whole-run is coarser than D-28's per-file boundary. A file's own PARSE stays per-file. The compiler host's reader is wrapped, so one unparseable spec is one could-not-run reason. The denominator floor then names it. The BINDER runs over every root file at once. A single spec whose shape exhausts it blocks the whole run rather than one file. The measurement used a 4,000-link call chain. Blocking is the fail-closed direction and it is never a pass. What would force it closed: a way to bind one file at a time. The compiler's public API does not offer one today.",
  "Identity is decided against the framework's own DECLARATION FILES. The ambient-declaration route is MEASURED. The route means a `declare module \"@playwright/test\"` file inside the target's own program. The installed-package route is NOT measured here. In it those declarations arrive from `node_modules/@playwright/test`. It is reasoned from the same resolution the compiler performs. This repository's dependency set is fixed, so the package cannot be installed to measure it. It is an open `UNKNOWN - verify`, carried beside `R-07`.",
]);

// D-13: the loud skip for an unresolvable parser. One frozen constant, ONE emission point, so a test
// can assert the emitted text byte-for-byte. It names `typescript` and states the honest outcome.
export const PARSER_ABSENT_MARKER =
  "SKIPPED: the target repository does not provide typescript — UAT specs NOT checked; the UAT status stays pending";

// D-15: the loud skip for an unusable browser lane. One marker, one frozen record of exactly two
// stage clauses, ONE emission point.
export const BROWSER_ABSENT_MARKER =
  "SKIPPED: no usable browser lane — UAT specs NOT exercised; the UAT status stays pending";

export type BrowserAbsentStage = "parser_package" | "browser_binaries";

export const BROWSER_ABSENT_STAGES: Readonly<Record<BrowserAbsentStage, string>> = Object.freeze({
  parser_package: "stage 1: @playwright/test could not be resolved from the target repository",
  browser_binaries: "stage 2: the Playwright command did not run, or its browsers directory is missing or empty",
});

// ── the minimal structural view of the target's TypeScript API ─────────────────────────────────
//
// The parser is loaded at RUN TIME from the target, so its types cannot be imported here: a
// top-level `import ... from "typescript"` would break the builtins-only rule this file exists to
// honour, and would tie the emitted .js to a compiler the host may not have. The surface below is
// hand-declared and covers exactly what the walk uses.

interface TsNode {
  readonly kind: number;
  readonly parent?: TsNode;
  getStart(sourceFile?: TsSourceFile): number;
  /**
   * D-30 (1): the file a DECLARATION comes from. Identity is decided against declaration FILES, so
   * this is the one accessor that turns a resolved symbol into the question "whose declaration is
   * this?" — asked through the node, never through a path this file would have to reconstruct.
   */
  getSourceFile(): TsSourceFile;
  /**
   * D-27: the range test's other end. `getEnd` is the companion of `getStart` on every node the
   * parse produces, and it is read the same way — through the node, never through a numeric field
   * this file would then have to keep in step with the parser's own.
   */
  getEnd(): number;
  /**
   * D-27: the node's own flags, read ONLY to tell a `var` declaration list from a `let`/`const` one.
   * The two disagree about where a binding BEGINS, and nothing else in this file reads a flag.
   */
  readonly flags?: number;
}
interface TsSourceFile extends TsNode {
  readonly fileName: string;
}
interface TsIdentifier extends TsNode {
  readonly text: string;
}
interface TsCallExpression extends TsNode {
  readonly expression: TsNode;
  readonly questionDotToken?: TsNode;
  /** D-18 (2): the option literal the configured-soft rule reads is this list's first element. */
  readonly arguments: readonly TsNode[];
}
interface TsPropertyAccessExpression extends TsNode {
  readonly expression: TsNode;
  readonly name: TsIdentifier;
  readonly questionDotToken?: TsNode;
}
interface TsElementAccessExpression extends TsNode {
  readonly expression: TsNode;
  readonly argumentExpression: TsNode;
  readonly questionDotToken?: TsNode;
}
interface TsStringLiteralLike extends TsNode {
  readonly text: string;
}
interface TsTryStatement extends TsNode {
  readonly tryBlock: TsNode;
  readonly catchClause?: TsNode;
}
interface TsIfStatement extends TsNode {
  readonly thenStatement: TsNode;
  readonly elseStatement?: TsNode;
}
interface TsConditionalExpression extends TsNode {
  readonly whenTrue: TsNode;
  readonly whenFalse: TsNode;
}
interface TsBinaryExpression extends TsNode {
  readonly left: TsNode;
  readonly right: TsNode;
  readonly operatorToken: TsNode;
}
interface TsUnaryLike extends TsNode {
  readonly expression: TsNode;
}

// ── D-18 (2) and (3): the nodes the option-key and rename resolvers read ────────────────────────
interface TsObjectLiteralExpression extends TsNode {
  readonly properties: readonly TsNode[];
}
interface TsPropertyAssignment extends TsNode {
  readonly name: TsNode;
  readonly initializer: TsNode;
}
interface TsImportSpecifier extends TsNode {
  readonly name: TsIdentifier;
  /** Present only when the specifier is a RENAME — `test as it` gives `propertyName` = `test`. */
  readonly propertyName?: TsIdentifier;
}
interface TsNamedImports extends TsNode {
  readonly elements: readonly TsNode[];
}
interface TsNamespaceImport extends TsNode {
  readonly name: TsIdentifier;
}
interface TsImportClause extends TsNode {
  readonly namedBindings?: TsNode;
}
interface TsImportDeclaration extends TsNode {
  readonly moduleSpecifier: TsNode;
  readonly importClause?: TsImportClause;
}

// ── D-20 (3): the nodes the fixture-parameter derivation reads ──────────────────────────────────
interface TsParameterDeclaration extends TsNode {
  /** An Identifier for a plain parameter; a binding PATTERN for a destructured one. */
  readonly name: TsNode;
}
/** D-21 (2): a declaration that always names something — a variable or a binding element. */
interface TsNamedDeclaration extends TsNode {
  /** An Identifier for a plain binding; a binding PATTERN for a destructured one. */
  readonly name: TsNode;
}
/** D-21 (2): a declaration whose name is optional — a default-exported function or class. */
interface TsOptionallyNamedDeclaration extends TsNode {
  readonly name?: TsNode;
}

// ── D-30 (1): the minimal structural view of the target's PROGRAM and CHECKER ──────────────────
//
// Declared with exactly the members `createProgramForTarget` and `resolveBannedModifier` call, for
// the same reason the node view above is: the compiler is the TARGET's and its types cannot be
// imported here without breaking the builtins-only rule this file exists to honour.

/** Opaque to this runnable: it reads no compiler option, it only forwards the parsed record. */
type TsCompilerOptions = Record<string, unknown>;

/** The one host member this runnable overrides — so a per-file parse fault stays per-file. */
interface TsCompilerHost {
  getSourceFile(
    fileName: string,
    languageVersionOrOptions: unknown,
    onError?: (message: string) => void,
    shouldCreateNewSourceFile?: boolean,
  ): TsSourceFile | undefined;
}

interface TsSymbol {
  readonly name: string;
  readonly flags: number;
  readonly parent?: TsSymbol;
  readonly declarations?: readonly TsNode[];
  readonly valueDeclaration?: TsNode;
}

interface TsType {
  readonly symbol?: TsSymbol;
  readonly aliasSymbol?: TsSymbol;
}

interface TsTypeChecker {
  getSymbolAtLocation(node: TsNode): TsSymbol | undefined;
  getAliasedSymbol(symbol: TsSymbol): TsSymbol;
  getTypeAtLocation(node: TsNode): TsType;
  getTypeOfSymbolAtLocation(symbol: TsSymbol, node: TsNode): TsType;
  getPropertiesOfType(type: TsType): readonly TsSymbol[];
  getPropertyOfType(type: TsType, name: string): TsSymbol | undefined;
  getSignaturesOfType(type: TsType, kind: number): readonly { getReturnType(): TsType }[];
  getExportsOfModule(symbol: TsSymbol): readonly TsSymbol[];
  getAmbientModules(): readonly TsSymbol[];
}

interface TsProgram {
  getSourceFile(fileName: string): TsSourceFile | undefined;
  getSourceFiles(): readonly TsSourceFile[];
  getTypeChecker(): TsTypeChecker;
}

export interface TsApi {
  createSourceFile(
    fileName: string,
    text: string,
    languageVersion: number,
    setParentNodes: boolean,
    scriptKind: number,
  ): TsSourceFile;
  forEachChild(node: TsNode, cb: (child: TsNode) => void): void;
  getLineAndCharacterOfPosition(sf: TsSourceFile, pos: number): { line: number; character: number };
  isCallExpression(n: TsNode): n is TsCallExpression;
  isPropertyAccessExpression(n: TsNode): n is TsPropertyAccessExpression;
  isIdentifier(n: TsNode): n is TsIdentifier;
  isTryStatement(n: TsNode): n is TsTryStatement;
  isIfStatement(n: TsNode): n is TsIfStatement;
  isConditionalExpression(n: TsNode): n is TsConditionalExpression;
  isBinaryExpression(n: TsNode): n is TsBinaryExpression;
  isParenthesizedExpression(n: TsNode): n is TsUnaryLike;
  isNonNullExpression(n: TsNode): n is TsUnaryLike;
  isElementAccessExpression(n: TsNode): n is TsElementAccessExpression;
  isStringLiteralLike(n: TsNode): n is TsStringLiteralLike;
  // The three type-assertion node predicates are declared OPTIONAL on purpose. They arrived in the
  // public API later than the rest of this surface (`isSatisfiesExpression` in 4.9,
  // `isTypeAssertionExpression` as the rename of `isTypeAssertion`), and the parser is the TARGET's,
  // not ours. An absent predicate must degrade to "this callee shape is unresolvable" — which is a
  // documented residual — and never to a thrown TypeError, which would leave the process with an
  // exit code outside the D-12 contract's { 0, 1, 2 }.
  readonly isAsExpression?: (n: TsNode) => boolean;
  readonly isTypeAssertionExpression?: (n: TsNode) => boolean;
  readonly isSatisfiesExpression?: (n: TsNode) => boolean;
  // D-30 (4): THESE ARE NO LONGER OPTIONAL. They used to be, and their absence used to make the
  // resolver fall back to the pre-D-18 rule — a SMALLER ban applied without saying so, which is
  // RR-07 and which is a gate LOWERING rather than a disclosed limit. They now join
  // `loadTypeScriptFromTarget`'s validated surface, so a target module missing one of them is the
  // EXISTING loud skip at exit 2. No per-member fallback: guessing which half of a parser is
  // present is the shape D-27 already refused for declaration kinds.
  readonly isObjectLiteralExpression: (n: TsNode) => n is TsObjectLiteralExpression;
  readonly isPropertyAssignment: (n: TsNode) => n is TsPropertyAssignment;
  readonly isImportDeclaration: (n: TsNode) => n is TsImportDeclaration;
  readonly isNamedImports: (n: TsNode) => n is TsNamedImports;
  readonly isNamespaceImport: (n: TsNode) => n is TsNamespaceImport;
  readonly isImportSpecifier: (n: TsNode) => n is TsImportSpecifier;
  readonly isParameter: (n: TsNode) => n is TsParameterDeclaration;
  readonly isVariableDeclaration: (n: TsNode) => n is TsNamedDeclaration;
  readonly isBindingElement: (n: TsNode) => n is TsNamedDeclaration;
  readonly isFunctionDeclaration: (n: TsNode) => n is TsOptionallyNamedDeclaration;
  readonly isClassDeclaration: (n: TsNode) => n is TsOptionallyNamedDeclaration;
  // D-27 / WR-30: read at ONE site, to tell a declaration list that HOISTS from one that is
  // BLOCK-SCOPED. `Using` and `AwaitUsing` stay OPTIONAL members of this record because a parser
  // predating explicit resource management publishes neither, and a spec written for that parser
  // cannot contain the syntax either — so their absence costs nothing, unlike `Let`/`Const`.
  readonly NodeFlags: {
    readonly Let: number;
    readonly Const: number;
    readonly Using?: number;
    readonly AwaitUsing?: number;
  };
  // ── D-30 (1): the Program and checker surface, all REQUIRED and all validated in one place ────
  readonly createCompilerHost: (options: TsCompilerOptions, setParentNodes?: boolean) => TsCompilerHost;
  readonly createProgram: (o: {
    readonly rootNames: readonly string[];
    readonly options: TsCompilerOptions;
    readonly host?: TsCompilerHost;
  }) => TsProgram;
  readonly findConfigFile: (
    searchPath: string,
    fileExists: (f: string) => boolean,
    configName?: string,
  ) => string | undefined;
  readonly readConfigFile: (
    path: string,
    readFile: (f: string) => string | undefined,
  ) => { readonly config?: unknown; readonly error?: { readonly messageText?: unknown } };
  readonly parseJsonConfigFileContent: (
    json: unknown,
    host: unknown,
    basePath: string,
  ) => {
    readonly options: TsCompilerOptions;
    readonly fileNames: readonly string[];
    readonly errors: readonly { readonly messageText?: unknown }[];
  };
  readonly sys: {
    readonly fileExists: (f: string) => boolean;
    readonly readFile: (f: string) => string | undefined;
  };
  readonly SymbolFlags: { readonly Alias: number };
  readonly SignatureKind: { readonly Call: number };
  readonly ScriptTarget: { readonly Latest: number };
  readonly ScriptKind: { readonly TS: number };
  readonly SyntaxKind: {
    readonly BarBarToken: number;
    readonly AmpersandAmpersandToken: number;
    readonly QuestionQuestionToken: number;
    /** D-18 (2): an option counts as ENABLED only when its value is this keyword literal. */
    readonly TrueKeyword: number;
  };
}

// Pitfall 6: `parseDiagnostics` is populated at run time but is NOT part of the published
// SourceFile type. It is cast at THIS ONE SITE, with the reason recorded here, so the decision is
// made once instead of being rediscovered in review. A spec with parse diagnostics is exit 2
// (could not run) — never exit 1, because a file we could not parse is a file we did not check.
type ParsedSourceFile = { readonly parseDiagnostics?: readonly unknown[] };

// ── D-13: the parser, resolved from the TARGET ─────────────────────────────────────────────────

/**
 * Resolve the target repository's own `typescript`. Returns null when it cannot be resolved, or
 * when what resolves does not carry the surface this walk needs — a module that cannot parse is as
 * unusable as an absent one, and both are a loud skip rather than a crash.
 */
export function loadTypeScriptFromTarget(repoRoot: string): TsApi | null {
  try {
    const requireFromTarget = createRequire(join(repoRoot, "package.json"));
    const candidate = requireFromTarget("typescript") as Partial<TsApi>;
    // The members this runnable calls UNCONDITIONALLY are validated here, in ONE place. A module
    // missing one of them cannot be used, and a call that throws mid-analysis would exit outside
    // the D-12 contract; an unusable parser is a LOUD SKIP, exactly like an absent one. The three
    // type-assertion predicates are NOT in this list — they are optional and guarded at their call
    // site, because their absence costs one resolvable callee shape rather than the whole walk.
    //
    // D-30 (4): THE LIST GREW, AND THE GROWTH IS THE FIX FOR RR-07. The import, object-literal,
    // declaration and function-like predicates used to be optional and guarded at their call sites,
    // where an absent one made the resolver fall back to the pre-D-18 rule — a smaller ban applied
    // WITHOUT SAYING SO. A gate that quietly runs a weaker check is worse than one that says it
    // could not run, so their absence is now the loud skip. The Program and checker members join
    // them for the same reason and by the same argument.
    const required: readonly string[] = [
      "createSourceFile",
      "forEachChild",
      "getLineAndCharacterOfPosition",
      "isElementAccessExpression",
      "isStringLiteralLike",
      "isObjectLiteralExpression",
      "isPropertyAssignment",
      "isImportDeclaration",
      "isNamedImports",
      "isNamespaceImport",
      "isImportSpecifier",
      "isParameter",
      "isVariableDeclaration",
      "isBindingElement",
      "isFunctionDeclaration",
      "isClassDeclaration",
      "createCompilerHost",
      "createProgram",
      "findConfigFile",
      "readConfigFile",
      "parseJsonConfigFileContent",
    ];
    const record = candidate as unknown as Record<string, unknown>;
    for (const member of required) {
      if (typeof record[member] !== "function") return null;
    }
    // The three RECORD members the walk reads, checked the same way and in the same place: a
    // missing `NodeFlags` costs the census's kind distinction, a missing `SymbolFlags` costs alias
    // following, and a missing `sys` costs config reading. None of them may degrade quietly.
    if (
      candidate.NodeFlags === undefined ||
      candidate.SymbolFlags === undefined ||
      candidate.SignatureKind === undefined ||
      candidate.sys === undefined ||
      typeof candidate.sys.fileExists !== "function" ||
      typeof candidate.sys.readFile !== "function"
    ) {
      return null;
    }
    return candidate as TsApi;
  } catch {
    return null; // fail-closed → loud skip, never a pass
  }
}

// ── D-30 (1): the PROGRAM, the CHECKER, and identity ───────────────────────────────────────────

/**
 * D-30 (4): the ONE reason a run that could not create a Program emits, with ONE emission point so
 * a case can assert it byte-for-byte and count its emissions.
 *
 * It is the D-28 could-not-run route, not a degrade. RR-07 disclosed the old behaviour honestly and
 * the behaviour itself was wrong: a parser that could not answer made the resolver fall back to a
 * SMALLER ban, applied without saying so. A check that could not run has made no claim about the
 * specs, and it never quietly makes a smaller one.
 */
export const PROGRAM_UNAVAILABLE_REASON =
  "COULD NOT RUN: the target repository's TypeScript could not create a program over the derived UAT specs, so the modifier ban could not be decided by symbol identity and NOTHING is claimed about the specs";

/** The bounds the framework-surface walk runs under. Stated, so neither is a hidden allowance. */
const SURFACE_NODE_BOUND = 4096;
const SURFACE_DEPTH_BOUND = 6;

/** A binding element, whose `propertyName` is the property a renamed destructuring came from. */
interface TsBindingElement extends TsNode {
  readonly name: TsNode;
  readonly propertyName?: TsIdentifier;
}

/**
 * D-30 (1): everything the identity rule needs about ONE target repository, built once per run.
 *
 * `frameworkFiles` and `typePaths` are DERIVED from the framework's own module symbol rather than
 * hand-authored: the files are every file declaring anything reachable from the framework's
 * exports, and the paths are the shortest route from an export to each declared type. That is what
 * lets a finding NAME `test.info().skip` without this file carrying the string `TestInfo`.
 */
export interface ProgramContext {
  readonly program: TsProgram;
  readonly checker: TsTypeChecker;
  readonly moduleSymbol: TsSymbol;
  readonly frameworkFiles: ReadonlySet<string>;
  readonly typePaths: ReadonlyMap<TsSymbol, string>;
  /** Per-file parse faults the compiler host caught, keyed by the file name it was asked for. */
  readonly parseFaults: ReadonlyMap<string, string>;
}

export type ProgramResult =
  | { readonly ok: true; readonly context: ProgramContext }
  | { readonly ok: false; readonly cause: string };

/**
 * D-30 (1): build a Program and a checker from the TARGET repository's own `typescript`.
 *
 * WHY THE HOST'S `getSourceFile` IS WRAPPED. `ts.createProgram` parses every root file EAGERLY, and
 * `ts.createSourceFile` is a recursive-descent parser running on author-controlled source — the
 * exact fact CR-15 was found on. Without this wrapper a single pathological spec would make program
 * creation throw, and the whole run would report "could not create a program" instead of the
 * per-file could-not-run reason D-28 decided. The wrapper keeps the parse boundary PER FILE: the
 * faulting file gets no SourceFile, the Program is created, and `analyzeSpecs` reports that one
 * file and increments nothing — so the denominator floor says out loud that the run covered less
 * than it claims.
 *
 * ROOT NAMES ARE THE CONFIG'S FILES UNION THE DERIVED SPECS. A config that excludes the spec
 * directory must not leave a spec UNCHECKED at exit 0, so the derived set is added rather than
 * intersected. That union is also what keeps the file set the ban is decided over EQUAL to the file
 * set the denominator floor counts.
 */
export function createProgramForTarget(
  repoRoot: string,
  specAbsPaths: readonly string[],
  ts: TsApi,
): ProgramResult {
  let configPath: string | undefined;
  try {
    configPath = ts.findConfigFile(repoRoot, ts.sys.fileExists, "tsconfig.json");
  } catch (cause) {
    return { ok: false, cause: `the search for a TypeScript configuration file failed (${describeCause(cause)})` };
  }
  if (configPath === undefined) {
    return {
      ok: false,
      cause: "no TypeScript configuration file was found at or above the repository root",
    };
  }
  let options: TsCompilerOptions;
  let configFileNames: readonly string[];
  try {
    const read = ts.readConfigFile(configPath, ts.sys.readFile);
    if (read.error !== undefined) {
      return { ok: false, cause: `${configPath} could not be read as a configuration file` };
    }
    const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, repoRoot);
    if (parsed.errors.length > 0) {
      return {
        ok: false,
        cause: `${configPath} did not parse (${parsed.errors.length} configuration error(s))`,
      };
    }
    options = { ...parsed.options, noEmit: true };
    configFileNames = parsed.fileNames;
  } catch (cause) {
    return { ok: false, cause: `${configPath} could not be parsed (${describeCause(cause)})` };
  }

  const parseFaults = new Map<string, string>();
  let program: TsProgram;
  try {
    const host = ts.createCompilerHost(options, true);
    const inner = host.getSourceFile.bind(host);
    host.getSourceFile = (
      fileName: string,
      languageVersion: unknown,
      onError?: (message: string) => void,
      shouldCreate?: boolean,
    ): TsSourceFile | undefined => {
      try {
        return inner(fileName, languageVersion, onError, shouldCreate);
      } catch (cause) {
        parseFaults.set(fileName, describeCause(cause));
        return undefined;
      }
    };
    const rootNames = [...new Set([...configFileNames, ...specAbsPaths])];
    program = ts.createProgram({ rootNames, options, host });
  } catch (cause) {
    return { ok: false, cause: `the program could not be created (${describeCause(cause)})` };
  }

  let checker: TsTypeChecker;
  try {
    checker = program.getTypeChecker();
  } catch (cause) {
    return { ok: false, cause: `the type checker could not be obtained (${describeCause(cause)})` };
  }

  const moduleSymbol = frameworkModuleSymbol(ts, program, checker);
  if (moduleSymbol === null) {
    return {
      ok: false,
      cause: `the declarations of ${PLAYWRIGHT_TEST_MODULE} did not resolve, so no call could be decided by identity`,
    };
  }
  const surface = frameworkSurface(ts, checker, moduleSymbol);
  return {
    ok: true,
    context: {
      program,
      checker,
      moduleSymbol,
      frameworkFiles: surface.files,
      typePaths: surface.typePaths,
      parseFaults,
    },
  };
}

/** One sentence for a thrown cause, so every could-not-run reason reads the same way. */
function describeCause(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * D-30 (1): the framework's MODULE SYMBOL, found the two ways a target can supply it.
 *
 * An AMBIENT declaration — a `declare module` block in a file the program includes — is found
 * through the checker's ambient-module table. An INSTALLED package is found through an import
 * declaration's own module specifier, which the checker resolves exactly as the compiler does. No
 * specifier STRING is ever compared against a file path, which is what makes a local module that
 * merely names itself as the framework a different module rather than an accepted one.
 */
function frameworkModuleSymbol(
  ts: TsApi,
  program: TsProgram,
  checker: TsTypeChecker,
): TsSymbol | null {
  const quoted = `"${PLAYWRIGHT_TEST_MODULE}"`;
  try {
    for (const ambient of checker.getAmbientModules()) {
      if (ambient.name === quoted) return ambient;
    }
  } catch {
    /* an ambient table this parser does not publish is not an error; the import route follows */
  }
  for (const sf of program.getSourceFiles()) {
    let found: TsSymbol | null = null;
    try {
      ts.forEachChild(sf, (node) => {
        if (found !== null) return;
        if (!ts.isImportDeclaration(node)) return;
        if (!ts.isStringLiteralLike(node.moduleSpecifier)) return;
        if (node.moduleSpecifier.text !== PLAYWRIGHT_TEST_MODULE) return;
        const symbol = checker.getSymbolAtLocation(node.moduleSpecifier);
        if (symbol !== undefined) found = symbol;
      });
    } catch {
      continue;
    }
    if (found !== null) return found;
  }
  return null;
}

/**
 * D-30 (1): the framework's DECLARATION FILES and the shortest path to each of its declared types,
 * both DERIVED by walking the module's own exports.
 *
 * WHY BOTH COME FROM ONE WALK. The files answer the ban's question — is this member declared by the
 * framework? — and the paths answer the reader's — what is this construct called? Deriving them
 * separately would be two censuses of one surface, which is the shape this file's history argues
 * against. The walk is BREADTH-FIRST, so the path recorded for a type is the shortest route an
 * author could have written it by, and it is bounded in both size and depth so a large surface
 * costs a stated amount rather than an open one.
 */
function frameworkSurface(
  ts: TsApi,
  checker: TsTypeChecker,
  moduleSymbol: TsSymbol,
): { readonly files: ReadonlySet<string>; readonly typePaths: ReadonlyMap<TsSymbol, string> } {
  const files = new Set<string>();
  const typePaths = new Map<TsSymbol, string>();
  const addDeclarations = (symbol: TsSymbol): void => {
    for (const declaration of symbol.declarations ?? []) {
      try {
        files.add(declaration.getSourceFile().fileName);
      } catch {
        /* a synthesised declaration carries no file; it cannot anchor identity either */
      }
    }
  };
  addDeclarations(moduleSymbol);

  const queue: { readonly type: TsType; readonly path: string; readonly depth: number }[] = [];
  try {
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      addDeclarations(exported);
      const declaration = exported.valueDeclaration ?? exported.declarations?.[0];
      if (declaration === undefined) continue;
      try {
        queue.push({
          type: checker.getTypeOfSymbolAtLocation(exported, declaration),
          path: exported.name,
          depth: 0,
        });
      } catch {
        /* a type this checker cannot produce contributes no path and no file */
      }
    }
  } catch {
    return { files, typePaths };
  }

  for (let head = 0; head < queue.length && typePaths.size < SURFACE_NODE_BOUND; head++) {
    const { type, path, depth } = queue[head];
    const symbol = type.aliasSymbol ?? type.symbol;
    if (symbol !== undefined) {
      if (typePaths.has(symbol)) continue;
      typePaths.set(symbol, path);
      addDeclarations(symbol);
    }
    if (depth >= SURFACE_DEPTH_BOUND) continue;
    try {
      for (const property of checker.getPropertiesOfType(type)) {
        addDeclarations(property);
        const declaration = property.valueDeclaration ?? property.declarations?.[0];
        if (declaration === undefined) continue;
        try {
          queue.push({
            type: checker.getTypeOfSymbolAtLocation(property, declaration),
            path: `${path}.${property.name}`,
            depth: depth + 1,
          });
        } catch {
          /* one unreadable property costs its own subtree, never the walk */
        }
      }
      for (const signature of checker.getSignaturesOfType(type, ts.SignatureKind.Call)) {
        queue.push({
          type: signature.getReturnType(),
          path: `${path}${CALL_LINK_MARKER}`,
          depth: depth + 1,
        });
      }
    } catch {
      continue;
    }
  }
  return { files, typePaths };
}

/**
 * D-30 (2): what the checker says a call's callee IS.
 *
 *   `framework`  — the resolved symbol is declared by the framework itself. The `path` is the
 *                  identity-canonical spelling the finding names, and the membership question is
 *                  then put to the SAME `isBannedModifierCall` every other arm asks.
 *   `foreign`    — the checker resolved the symbol and it is NOT the framework's. The call is not
 *                  banned and the spelling rule is NOT consulted, which is what makes WR-26's false
 *                  refusal impossible rather than merely narrower.
 *   `unresolved` — the checker has no symbol at all. Only here does the spelling rule answer, and
 *                  that is where D-27's temporal-dead-zone refusals live.
 */
export type ModifierIdentity =
  | { readonly kind: "framework"; readonly path: string }
  | { readonly kind: "foreign" }
  | { readonly kind: "unresolved" };

/**
 * A DROP marker for a namespace head, so `pw.test.skip` is named `test.skip`. It carries a space so
 * it cannot collide with any path an export name could produce.
 */
const IDENTITY_HEAD_DROP = " drop";

/**
 * D-30 (1) and (2): decide, by SYMBOL IDENTITY, what this call's callee is.
 *
 * A SYMBOL DECLARED IN MORE THAN ONE FILE, one of which is the framework's, is treated as the
 * FRAMEWORK's. Declaration merging can add a member to the framework's own type from a local file,
 * and for a ban the refusing direction is the safe one.
 */
export function resolveBannedModifier(
  ts: TsApi,
  ctx: ProgramContext,
  call: TsCallExpression,
): ModifierIdentity {
  const callee = call.expression;
  const checker = ctx.checker;
  let symbol: TsSymbol | undefined;
  try {
    symbol = checker.getSymbolAtLocation(callee);
  } catch {
    return { kind: "unresolved" };
  }
  if (symbol === undefined) return { kind: "unresolved" };
  symbol = followAlias(ts, checker, symbol);
  symbol = throughBindingElement(ts, checker, symbol) ?? symbol;
  const declarations = symbol.declarations ?? [];
  if (declarations.length === 0) return { kind: "unresolved" };
  let fromFramework = false;
  for (const declaration of declarations) {
    try {
      if (ctx.frameworkFiles.has(declaration.getSourceFile().fileName)) fromFramework = true;
    } catch {
      /* a declaration with no file cannot anchor identity in either direction */
    }
  }
  if (!fromFramework) return { kind: "foreign" };
  return { kind: "framework", path: identityPath(ts, ctx, callee, symbol) };
}

/** Follow an import or export alias to the symbol it names. A non-alias is returned unchanged. */
function followAlias(ts: TsApi, checker: TsTypeChecker, symbol: TsSymbol): TsSymbol {
  if ((symbol.flags & ts.SymbolFlags.Alias) === 0) return symbol;
  try {
    return checker.getAliasedSymbol(symbol);
  } catch {
    return symbol;
  }
}

/**
 * D-30 (1), closing RR-08: a DESTRUCTURED binding names a LOCAL whose declaration is the spec file,
 * so identity asked of it alone would answer `foreign` for `async ({ page }, { skip }) => skip()`.
 * The symbol identity is about is the PROPERTY the pattern destructures, and the checker produces
 * it from the pattern's own type — including for a renamed destructuring, where the property name
 * and the local name differ.
 */
function throughBindingElement(
  ts: TsApi,
  checker: TsTypeChecker,
  symbol: TsSymbol,
): TsSymbol | undefined {
  const declaration = symbol.declarations?.[0];
  if (declaration === undefined || !ts.isBindingElement(declaration)) return undefined;
  const pattern = declaration.parent;
  if (pattern === undefined) return undefined;
  const propertyName = (declaration as unknown as TsBindingElement).propertyName;
  const wanted =
    propertyName !== undefined && ts.isIdentifier(propertyName) ? propertyName.text : symbol.name;
  try {
    return checker.getPropertyOfType(checker.getTypeAtLocation(pattern), wanted);
  } catch {
    return undefined;
  }
}

/**
 * D-30: the spelling a finding NAMES for a call identity has already decided.
 *
 * THIS IS A READER'S QUESTION, NOT AN AUTHORITY. The verdict was decided by the symbol; this only
 * chooses what to call the construct, so a path derived wrongly here changes the TEXT of a finding
 * and never whether there is one. The syntactic path is preferred when the source carries one, with
 * its HEAD rewritten by identity, because that is the spelling an author recognises; a call whose
 * source carries no readable head is named from the type that DECLARES the member.
 */
function identityPath(ts: TsApi, ctx: ProgramContext, callee: TsNode, symbol: TsSymbol): string {
  const syntactic = calleeDottedPath(ts, callee);
  if (syntactic !== null) {
    const segments = syntactic.split(".");
    if (segments.length >= 2 && !segments[0].endsWith(CALL_LINK_MARKER)) {
      const head = calleeHeadIdentifier(ts, callee);
      const rewritten = head === null ? null : identityHeadSegment(ts, ctx, head);
      if (rewritten === IDENTITY_HEAD_DROP) return segments.slice(1).join(".");
      if (rewritten !== null) {
        segments[0] = rewritten;
        return segments.join(".");
      }
      return syntactic;
    }
  }
  const parent = symbol.parent;
  if (parent !== undefined) {
    // An EXPORT of the framework module is named by its EXPORT name, so `import { expect as check }`
    // is asked and reported as `expect` rather than as the local spelling.
    if (parent === ctx.moduleSymbol) return symbol.name;
    const owner = ctx.typePaths.get(parent);
    if (owner !== undefined) return `${owner}.${symbol.name}`;
  }
  return syntactic ?? symbol.name;
}

/** The head segment identity gives this callee: an export name, a DROP for a namespace, or null. */
function identityHeadSegment(ts: TsApi, ctx: ProgramContext, head: TsNode): string | null {
  const checker = ctx.checker;
  try {
    const symbol = checker.getSymbolAtLocation(head);
    if (symbol !== undefined && followAlias(ts, checker, symbol) === ctx.moduleSymbol) {
      return IDENTITY_HEAD_DROP;
    }
    const type = checker.getTypeAtLocation(head);
    const typeSymbol = type.aliasSymbol ?? type.symbol;
    if (typeSymbol !== undefined) {
      const path = ctx.typePaths.get(typeSymbol);
      if (path !== undefined) return path;
    }
  } catch {
    return null;
  }
  return null;
}

// ── D-15: the two-stage, fail-closed, injectable browser probe ─────────────────────────────────

export type BrowserProbe = (repoRoot: string) => BrowserAbsentStage | null;

/**
 * The real probe. Stage 1 resolves `@playwright/test` from the target. Stage 2 runs the Playwright
 * CLI with an ARG ARRAY (no shell) and then checks the browsers directory.
 *
 * DEVIATION FROM THE PLAN TEXT, RECORDED HERE BECAUSE IT IS A FACT ABOUT THE TOOL: `playwright
 * --version` prints a version and does NOT report a browsers directory, so the directory cannot be
 * read out of its output. It is resolved instead from PLAYWRIGHT_BROWSERS_PATH when set, and
 * otherwise from the documented per-platform cache location. Anything inconclusive returns the
 * stage — an inconclusive probe skips, it never greens.
 */
export function realBrowserProbe(repoRoot: string): BrowserAbsentStage | null {
  try {
    const requireFromTarget = createRequire(join(repoRoot, "package.json"));
    requireFromTarget.resolve("@playwright/test");
  } catch {
    return "parser_package";
  }
  try {
    const cli = spawnSync("npx", ["playwright", "--version"], {
      encoding: "utf8",
      input: "",
      timeout: 60_000,
    });
    if (cli.status !== 0 || cli.error != null) return "browser_binaries";
    const dir = playwrightBrowsersDirectory();
    if (dir === null || !existsSync(dir)) return "browser_binaries";
    if (readdirSync(dir).length === 0) return "browser_binaries";
  } catch {
    return "browser_binaries"; // fail-closed
  }
  return null;
}

/** The documented Playwright browsers cache location, or null when it cannot be determined. */
function playwrightBrowsersDirectory(): string | null {
  const override = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (override !== undefined && override !== "" && isAbsolute(override)) return override;
  const home = process.env.HOME ?? process.env.USERPROFILE;
  if (home === undefined || home === "") return null;
  if (process.platform === "darwin") return join(home, "Library", "Caches", "ms-playwright");
  if (process.platform === "win32") return join(home, "AppData", "Local", "ms-playwright");
  return join(home, ".cache", "ms-playwright");
}

/**
 * The SINGLE skip-decision and marker-emission point for the browser lane (the shape
 * scripts/e2e/uat-live.test.ts established). Returns true when the lane is usable. When it is not,
 * it writes BROWSER_ABSENT_MARKER plus the failing stage's clause to stderr and returns false.
 * The probe is injectable so a test can force either stage and assert the text byte-for-byte.
 */
export function emitLoudSkipIfBrowserUnusable(
  repoRoot: string,
  probe: BrowserProbe = realBrowserProbe,
  err: (s: string) => void = (s: string): void => {
    process.stderr.write(s);
  },
): boolean {
  const stage = probe(repoRoot);
  if (stage === null) return true;
  // 31-25 PROBE 1: the writer is the CALLER'S, not `process.stderr` directly. This was the one
  // position in `main`'s body that wrote around its own output seam, so a probe that captured every
  // other exit saw nothing here — and a seam with one hole is a seam that cannot answer "which
  // stream did this branch write to" for the branch it does not cover. The default is the same
  // writer it always used, so the CLI's bytes are unchanged.
  err(`${BROWSER_ABSENT_MARKER} (${BROWSER_ABSENT_STAGES[stage]})\n`);
  return false;
}

// ── D-05: deriving the spec set ────────────────────────────────────────────────────────────────

export interface SpecDerivation {
  /** Repo-relative, forward-slash, SORTED — so findings and the pass line are byte-identical across runs. */
  readonly relPaths: readonly string[];
  /** Containment refusals (ASVS V12). A path that escapes the root is a could-not-run reason. */
  readonly refusals: readonly string[];
}

/**
 * Walk the repository root and collect every UAT spec. Containment (ASVS V12): the root is resolved
 * once and every collected path is asserted to remain under it. Symbolic links are resolved before
 * that assertion, so a link pointing outside the repository is REFUSED (exit 2) rather than silently
 * skipped or silently read. Linked directories are not descended into at all — a link cycle is not
 * a spec set.
 *
 * D-28 (3): THE DESCENT USES AN EXPLICIT WORKLIST, not self-recursion. CR-15 named this walk as the
 * SECOND unguarded self-recursion in this file, alongside the parser, and it is de-recursed in the
 * same edit for the same reason D-21 (1) replaced BOTH self-recursive AST walks rather than only the
 * one WR-19 reproduced: the fix is about the CLASS, not about the call a reviewer happened to reach.
 * The depth of a directory tree now leaves the interpreter's stack entirely. Every path is still
 * visited exactly once, and the derived set is order-independent because `relPaths` is sorted before
 * it is returned — so LIFO is as correct here as it is in `forEachDescendant`.
 */
export function deriveSpecPaths(repoRoot: string): SpecDerivation {
  const resolvedRoot = resolve(repoRoot);
  let realRoot: string;
  try {
    realRoot = realpathSync(resolvedRoot);
  } catch {
    realRoot = resolvedRoot;
  }
  const relPaths: string[] = [];
  const refusals: string[] = [];

  // TWO containment predicates, because there are two kinds of path here and comparing one against
  // the other's root is a false refusal. A path the walk BUILT is lexical, and belongs against the
  // lexically resolved root. A path realpathSync RETURNED has had every link expanded, and belongs
  // against the equally expanded root — on macOS, for example, a temp root under /var/... expands to
  // /private/var/..., so a link target compared against the unexpanded root would always "escape".
  const containedLexically = (candidate: string): boolean =>
    candidate === resolvedRoot || candidate.startsWith(resolvedRoot + sep);
  const containedReal = (candidate: string): boolean =>
    candidate === realRoot || candidate.startsWith(realRoot + sep);

  // The structural view of a directory entry this walk uses. Naming it here avoids depending on
  // which readdirSync overload the target's @types/node happens to select.
  interface DirEntry {
    readonly name: string;
    isSymbolicLink(): boolean;
    isDirectory(): boolean;
    isFile(): boolean;
  }

  const pending: { readonly absDir: string; readonly relDir: string }[] = [
    { absDir: resolvedRoot, relDir: "" },
  ];
  while (pending.length > 0) {
    const { absDir, relDir } = pending.pop() as { absDir: string; relDir: string };
    let entries: readonly DirEntry[];
    try {
      entries = readdirSync(absDir, { withFileTypes: true }) as unknown as readonly DirEntry[];
    } catch {
      refusals.push(
        `Cannot list the directory ${relDir === "" ? "." : relDir}; the spec set could not be derived, so no result is reported for it.`,
      );
      continue;
    }
    for (const entry of entries) {
      const abs = join(absDir, entry.name);
      const rel = relDir === "" ? entry.name : `${relDir}/${entry.name}`;
      if (entry.isSymbolicLink()) {
        // Only a LINKED FILE that names a UAT spec is worth resolving; a linked directory is not
        // descended into (cycles), and a link out of the tree is a refusal, never a silent skip.
        if (!entry.name.endsWith(UAT_SPEC_GLOB_SUFFIX)) continue;
        try {
          const target = realpathSync(abs);
          if (!containedReal(target)) {
            refusals.push(
              `The UAT spec ${rel} is a symbolic link that resolves outside the repository root; it was NOT read and the check was not performed for it.`,
            );
            continue;
          }
          if (statSync(target).isFile() && hasUatSegment(rel)) relPaths.push(rel);
        } catch {
          refusals.push(
            `The UAT spec ${rel} is a symbolic link that could not be resolved; it was NOT read and the check was not performed for it.`,
          );
        }
        continue;
      }
      if (entry.isDirectory()) {
        if (SKIPPED_DIRECTORIES.includes(entry.name)) continue;
        pending.push({ absDir: abs, relDir: rel });
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(UAT_SPEC_GLOB_SUFFIX)) continue;
      if (!hasUatSegment(rel)) continue;
      if (!containedLexically(resolve(abs))) {
        refusals.push(
          `The UAT spec ${rel} resolves outside the repository root; it was NOT read and the check was not performed for it.`,
        );
        continue;
      }
      relPaths.push(rel);
    }
  }

  relPaths.sort();
  return { relPaths, refusals };
}

/** D-05: a UAT spec lives under a `uat` path segment. The segment comparison is exact. */
function hasUatSegment(relPath: string): boolean {
  const parts = relPath.split("/");
  // The last part is the file name, never the directory segment being looked for.
  return parts.slice(0, -1).includes("uat");
}

// ── D-14: the ban, decided over the AST ────────────────────────────────────────────────────────

interface BannedContext {
  readonly arm: "a" | "b";
  readonly where: string;
}

/**
 * Walk UP from an assertion call to its enclosing context. Returns the first banned context found,
 * or null. `allowConditional` is false for an `assert` call: D-14 names `expect`/`assert` for arm
 * (a) and names ONLY `expect` for arm (b), and this function does not widen either.
 */
function bannedContextOf(ts: TsApi, call: TsNode, allowConditional: boolean): BannedContext | null {
  // An OPTIONAL CALL is a property of the call itself, not of an ancestor (arm b).
  if (allowConditional && ts.isCallExpression(call)) {
    const head = call.expression;
    if (
      call.questionDotToken !== undefined ||
      (ts.isPropertyAccessExpression(head) && head.questionDotToken !== undefined)
    ) {
      return { arm: "b", where: "as an optional call" };
    }
  }

  let prev: TsNode = call;
  let cur: TsNode | undefined = call.parent;
  while (cur !== undefined) {
    if (ts.isTryStatement(cur)) {
      // Exactly the try block and the catch clause. A finally block is deliberately outside the
      // locked set — see the "deliberately outside the rule" note beside the modifier rule.
      if (prev === cur.tryBlock) return { arm: "a", where: "inside a try block" };
      if (cur.catchClause !== undefined && prev === cur.catchClause) {
        return { arm: "a", where: "inside a catch clause" };
      }
    }
    if (allowConditional) {
      if (ts.isIfStatement(cur)) {
        if (prev === cur.thenStatement) return { arm: "b", where: "under an if statement" };
        if (cur.elseStatement !== undefined && prev === cur.elseStatement) {
          return { arm: "b", where: "under an else clause" };
        }
      }
      if (ts.isConditionalExpression(cur)) {
        if (prev === cur.whenTrue || prev === cur.whenFalse) {
          return { arm: "b", where: "inside a conditional expression" };
        }
      }
      if (ts.isBinaryExpression(cur) && isLogicalOperator(ts, cur.operatorToken.kind)) {
        if (prev === cur.left || prev === cur.right) {
          return { arm: "b", where: "as an operand of a logical operator" };
        }
      }
    }
    prev = cur;
    cur = cur.parent;
  }
  return null;
}

/**
 * D-21 (1): THE ONE WALK over a spec's descendants, and it uses an EXPLICIT STACK rather than the
 * interpreter's.
 *
 * WHY THIS IS PART OF THE SAME FIX AS THE SHARED BUDGET. WR-19 reproduced a 4000-link call chain
 * killing the process with `RangeError: Maximum call stack size exceeded`. Bounding the RESOLVER's
 * recursion is necessary and is not sufficient: the tree walk that ASKS the resolver was itself a
 * recursive descent, and a spec's AST is exactly as deep as the chain a spec author writes. A
 * self-recursive `visit` therefore carried its own unbounded stack cost, one that no step budget
 * could reach, and that cost is what a 4000-link chain actually paid.
 *
 * An explicit worklist removes the depth from the interpreter's stack entirely, so there is nothing
 * left to bound here and no new residual is created: every descendant is still visited exactly once.
 * ORDER IS NOT PART OF THE CONTRACT — the worklist is LIFO, and both callers are order-independent
 * (arm (c) sorts its findings by source position before returning, and the fixture-parameter
 * derivation accumulates into a set).
 *
 * The root itself is NOT visited, which is the behaviour `ts.forEachChild(sf, visit)` had.
 */
function forEachDescendant(ts: TsApi, root: TsNode, visit: (node: TsNode) => void): void {
  const stack: TsNode[] = [];
  ts.forEachChild(root, (child: TsNode) => {
    stack.push(child);
  });
  while (stack.length > 0) {
    const node = stack.pop() as TsNode;
    visit(node);
    ts.forEachChild(node, (child: TsNode) => {
      stack.push(child);
    });
  }
}

/**
 * The three logical operators of arm (b), compared against ts.SyntaxKind MEMBERS. The numeric token
 * values are NOT stable across TypeScript versions and are never compared against here.
 */
function isLogicalOperator(ts: TsApi, kind: number): boolean {
  return (
    kind === ts.SyntaxKind.BarBarToken ||
    kind === ts.SyntaxKind.AmpersandAmpersandToken ||
    kind === ts.SyntaxKind.QuestionQuestionToken
  );
}

/**
 * The head identifier of a callee chain: `expect(x).toBe(y)` and `expect(x)` share ONE `expect`
 * identifier node, which is what lets the caller report a single finding per assertion instead of
 * one per link in the chain.
 *
 * D-30 (5): this walk is FLAT and every step DESCENDS to a strict child of a finite parse tree, so
 * it terminates without an allowance. It used to read the chain-step bound, which is why the bound
 * had to be deleted here as well as in `calleeDottedPath` rather than only where WR-19 found it.
 */
function calleeHeadIdentifier(ts: TsApi, expr: TsNode): TsIdentifier | null {
  let cur: TsNode = expr;
  for (;;) {
    if (ts.isIdentifier(cur)) return cur;
    if (ts.isCallExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (ts.isPropertyAccessExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (ts.isParenthesizedExpression(cur) || ts.isNonNullExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    return null;
  }
}

/**
 * The callee of a call expression as a DOTTED PATH, head first — `test.describe.only` for
 * `test.describe.only(...)`, `test.skip` for `test["skip"](...)`, `expect.soft` for
 * `(expect as never).soft(...)`. Returns null when the head is not an identifier, or when any link
 * in the chain cannot be resolved from the source text alone.
 *
 * WHY ONE NORMALISER (31-06, gap 2). Arm (c) previously matched a callee SHAPE —
 * PropertyAccessExpression(Identifier, member) — which is a bare `describe.only(...)`,
 * a spelling `@playwright/test` cannot produce. Every spelling that means the same call now
 * normalises to the same string, so a new callee shape is taught to THIS function and never to a
 * second matcher; two matchers for one question are two places for the answers to disagree.
 *
 * The shapes it descends through: property access (the member name), element access whose argument
 * is a string literal or a no-substitution template literal (the literal's text, so bracket notation
 * yields the identical path as its dotted spelling), parenthesised expressions, non-null assertions,
 * and `as` / `<T>` / `satisfies` assertions. Optional-chaining property access is the SAME node kind
 * as ordinary property access and needs no case of its own — asserted by a test rather than assumed.
 *
 * D-18 (1), REPLACING THE POLICY THIS PARAGRAPH USED TO STATE. A CallExpression link now RESOLVES:
 * the call's own expression is resolved recursively, and its path is pushed as ONE segment suffixed
 * with a `()` marker. Declining it was the round-3 defect — `test.info().skip()` is the documented
 * TestInfo-fixture spelling of a banned modifier and the rule was never even asked about it.
 *
 * The marker is what keeps a legitimate chained assertion legitimate BY CONSTRUCTION rather than by
 * exception. `expect(x).soft` resolves to `expect().soft`: its head segment is the MARKED `expect()`
 * call, not the bare `expect` identifier, so it is neither a banned exact path nor a banned head.
 * `test.info().skip` resolves to `test.info().skip`, whose head is `test` and whose tail is `skip`,
 * so the marker lands in the ROUTING position D-17 already decided is not part of the membership
 * question — and the D-17 rule refuses it with no new member in any set.
 *
 * D-21 (1), CORRECTING THE UNIT OF THE BOUND THIS FUNCTION DOCUMENTS. The step allowance is ONE
 * SHARED BUDGET for the whole resolution, threaded through the recursion above and decremented on
 * every link INCLUDING the descent into a call link. It used to be a loop counter, which D-18 (1)
 * left in place when it made this function recursive — so every frame started a fresh 512 and the
 * bound stopped bounding anything. The cost was not a slow run: a 4000-link chain exhausted the
 * interpreter's stack, and the uncaught RangeError meant `reportMeasured` was NEVER REACHED, so the
 * vacuity floor and the denominator floor were bypassed by construction while stdout stayed silent.
 * The residual sentence the recipe quotes — a chain that reaches the bound yields no path rather
 * than a truncated one — is a claim about a WHOLE RESOLUTION, and only a shared budget makes it true.
 *
 * The default argument keeps every existing caller unchanged: a caller that passes no budget gets a
 * fresh allowance, exactly as it got a fresh loop counter before.
 *
 * The shapes it still cannot resolve are named in UNRESOLVABLE_CALLEE_RESIDUALS, and the test suite
 * derives this function's decline sites from its own AST and binds each one to that register.
 */
export function calleeDottedPath(ts: TsApi, expr: TsNode): string | null {
  // D-30 (5): AN EXPLICIT STACK, AND THEREFORE NO BOUND AT ALL. D-18 (1) made this walk recursive
  // to fold a call link; D-21 (1) then had to thread a shared step budget through that recursion so
  // a 4,000-link chain could not exhaust the interpreter. Both the recursion and the allowance are
  // gone: `pending` holds the call-link descents this resolution still owes, the loop visits each
  // AST node at most once, and a finite tree terminates without anything having to say how many
  // links are too many. RR-05 — the residual that stated the allowance — leaves the register with
  // the mechanism that needed it, rather than being carried as a limit about code the module no
  // longer has.
  //
  // WHAT A `pending` FRAME IS. When the walk reaches a CallExpression it must resolve that call's
  // OWN callee first and then fold the result into one marked segment. The frame records the
  // segments collected so far, so the fold happens exactly where the recursion used to return.
  const pending: string[][] = [];
  let segments: string[] = [];
  let cur: TsNode = expr;
  for (;;) {
    if (ts.isIdentifier(cur)) {
      segments.push(cur.text);
      segments.reverse();
      let resolved = segments.join(".");
      // Unwind every owed call-link descent, innermost first. D-18 (1): the inner path becomes ONE
      // segment carrying the marker, in the ROUTING position D-17 already decided membership does
      // not read.
      while (pending.length > 0) {
        const outer = pending.pop() as string[];
        outer.push(`${resolved}${CALL_LINK_MARKER}`);
        outer.reverse();
        resolved = outer.join(".");
      }
      return resolved;
    }
    if (ts.isPropertyAccessExpression(cur)) {
      segments.push(cur.name.text);
      cur = cur.expression;
      continue;
    }
    if (ts.isCallExpression(cur)) {
      // D-18 (1). An inner path that does not resolve leaves the WHOLE path unresolved — every
      // `return null` below exits the loop outright, so no owed frame is ever folded over an
      // unknown head, which would invent a segment the source text does not carry.
      pending.push(segments);
      segments = [];
      cur = cur.expression;
      continue;
    }
    if (ts.isElementAccessExpression(cur)) {
      const arg = cur.argumentExpression;
      // A member computed from a non-literal expression is a documented residual, not a silence.
      if (!ts.isStringLiteralLike(arg)) return null;
      segments.push(arg.text);
      cur = cur.expression;
      continue;
    }
    if (ts.isParenthesizedExpression(cur) || ts.isNonNullExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (isTypeAssertionLike(ts, cur)) {
      cur = (cur as TsUnaryLike).expression;
      continue;
    }
    return null;
  }
}

/**
 * D-18 (2): the option keys a call ENABLES — the property names assigned the `true` KEYWORD in the
 * call's first object-literal argument.
 *
 * LITERALS ONLY, AND NO EVALUATION. `{ soft: isCi }` enables nothing here, because the value is
 * absent from the source text and this runnable evaluates nothing (D-13). That is a NAMED residual,
 * not a silence. `{ soft: false }` likewise enables nothing, which is the point of comparing against
 * the keyword rather than against mere presence of the key.
 *
 * Returns `null` when there is no readable option literal to consult at all, which the membership
 * authority answers `false` for — a call whose options could not be read is not thereby an escape.
 */
export function enabledOptionKeys(ts: TsApi, call: TsNode): ReadonlySet<string> | null {
  if (!ts.isCallExpression(call)) return null;
  const first = call.arguments[0];
  if (first === undefined) return null;
  // D-30 (4): the two predicates are VALIDATED at load time, so their absence is the loud skip
  // rather than a quieter option reading. The guard that used to stand here was a decline site
  // bound to RR-07, and it is gone with the residual.
  const isObjectLiteral = ts.isObjectLiteralExpression;
  const isPropertyAssignment = ts.isPropertyAssignment;
  if (!isObjectLiteral(first)) return null;
  const keys = new Set<string>();
  for (const property of first.properties) {
    if (!isPropertyAssignment(property)) continue;
    if (property.initializer.kind !== ts.SyntaxKind.TrueKeyword) continue;
    const name = property.name;
    if (ts.isIdentifier(name)) {
      keys.add(name.text);
      continue;
    }
    if (ts.isStringLiteralLike(name)) keys.add(name.text);
  }
  return keys;
}

/**
 * D-20 (2): the option keys the WHOLE MARKED CHAIN enables — the union of `enabledOptionKeys` over
 * this call and over every call link folded into its resolved dotted path.
 *
 * WHY THE CHAIN AND NOT THE OUTERMOST CALL. After D-20 (1) the compared path can be folded from
 * several links, and the pair D-18 (2) decides is a PATH PLUS AN ENABLED OPTION. Reading the option
 * half from the outer link alone would decide `expect.configure({retries:2}).configure({soft:true})`
 * and leave its mirror `expect.configure({soft:true}).configure({retries:2})` to be caught only
 * because the inner link happens to be a separately visited call node. That dependency on WHICH
 * NODES THE WALK VISITS is the same structural coupling CR-09 exploited one register over, so the
 * fold removes it rather than relying on it. The mirror's status was MEASURED before the change, not
 * assumed: it already exited 1, at the inner link.
 *
 * Returns `null` when no link in the chain carried a readable option literal at all — the state the
 * membership authority answers `false` for. A call whose options could not be read is not thereby an
 * escape, and the reasons a single link yields nothing are dispositioned at `enabledOptionKeys`'s
 * own sites rather than restated here.
 */
export function chainEnabledOptionKeys(ts: TsApi, call: TsNode): ReadonlySet<string> | null {
  const keys = new Set<string>();
  let readAnyLink = false;
  let cur: TsNode = call;
  // D-30 (5): FLAT, and every step DESCENDS to a strict child of a finite parse tree, so the fold
  // terminates with no allowance to state. It read the chain-step bound before that bound was
  // deleted with the recursion it existed for.
  for (;;) {
    if (ts.isCallExpression(cur)) {
      const own = enabledOptionKeys(ts, cur);
      if (own !== null) {
        readAnyLink = true;
        for (const key of own) keys.add(key);
      }
      cur = cur.expression;
      continue;
    }
    if (ts.isPropertyAccessExpression(cur) || ts.isElementAccessExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (ts.isParenthesizedExpression(cur) || ts.isNonNullExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (isTypeAssertionLike(ts, cur)) {
      cur = (cur as TsUnaryLike).expression;
      continue;
    }
    break;
  }
  if (!readAnyLink) return null;
  return keys;
}

/**
 * D-18 (3): the source file's `@playwright/test` import RENAMES, as local name -> imported name.
 *
 * Read from `ImportSpecifier.propertyName`, which is a literal already present in the source text —
 * `import { test as it }` carries both names in the same node, so no type checker is needed and
 * none is used.
 *
 * MODULE-SCOPED ON PURPOSE, and disclosed as a residual: only the framework's own import
 * declaration is consulted. A rename arriving through a local fixture-extension module would need
 * following a re-export across files, which is the resolution D-13 forbids shipping.
 *
 * Returns `null` when the parser does not expose the import predicates — the resolver then degrades
 * to the pre-D-18 behaviour for this one shape rather than throwing outside the D-12 exit codes.
 */
export function deriveImportRenames(ts: TsApi, sf: TsSourceFile): ReadonlyMap<string, string> {
  // D-30 (4): the four import predicates are VALIDATED at load time, so this derivation can no
  // longer return `null` for an absent parser surface. The return type narrowed with the guard,
  // which is what removes the decline site RR-07 was bound to instead of leaving a dead arm.
  const isImportDeclaration = ts.isImportDeclaration;
  const isNamedImports = ts.isNamedImports;
  const isNamespaceImport = ts.isNamespaceImport;
  const isImportSpecifier = ts.isImportSpecifier;
  const renames = new Map<string, string>();
  ts.forEachChild(sf, (node) => {
    if (!isImportDeclaration(node)) return;
    if (!ts.isStringLiteralLike(node.moduleSpecifier)) return;
    if (node.moduleSpecifier.text !== PLAYWRIGHT_TEST_MODULE) return;
    const clause = node.importClause;
    if (clause === undefined) return;
    const named = clause.namedBindings;
    if (named === undefined) return;
    // The two shapes `namedBindings` takes, decided as a TOTAL alternation rather than as one
    // narrowing with a silent fall-through: a shape that fell through neither arm would be invisible
    // to the decline-site derivation, which is the hole this block exists to close.
    if (isNamespaceImport(named)) {
      renames.set(named.name.text, IMPORT_NAMESPACE_MARKER);
    } else if (isNamedImports(named)) {
      for (const element of named.elements) {
        if (!isImportSpecifier(element)) continue;
        if (element.propertyName === undefined) continue;
        renames.set(element.name.text, element.propertyName.text);
      }
    }
  });
  return renames;
}

/**
 * D-27 (2026-09-09): ONE DECLARED BINDING — a name, the RANGE its declaration KIND gives it, and
 * whether that binding SUPPRESSES a canonicalisation.
 *
 * The `suppresses` flag is what makes innermost-wins the RIGHT rule rather than merely a narrower
 * one, and it is set by POSITION rather than by name: the TestInfo fixture-binding position is
 * recorded here as a NON-suppressing binding instead of being omitted from the census. Omitting it
 * makes the parameter INVISIBLE to resolution, so an outer declaration of the same name becomes the
 * nearest binding and suppresses — the two-line module-scope evasion the round-5 adversarial check
 * measured. Recording it makes the parameter the nearest binding, and it suppresses nothing.
 */
export interface DeclaredBinding {
  readonly name: string;
  /** INCLUSIVE. A range that starts exactly at a reference contains it. */
  readonly start: number;
  /** EXCLUSIVE. A range that ends exactly where a reference starts does NOT contain it. */
  readonly end: number;
}

/**
 * D-27: the scope argument `canonicaliseHeadSegment` takes — the file's bindings AND the POSITION of
 * the reference being decided, as ONE value.
 *
 * IT IS A PAIR ON PURPOSE (T-31-24-06). A caller that cannot produce a position cannot produce the
 * pair either, so "pass a file-level constant instead of the reference's own position" is not a
 * mistake this signature permits quietly. A constant is not a position: a zero sits inside the
 * SourceFile's own range, so under a hoisting module-scope binding it suppresses every call in the
 * file — which is CR-14 through the back door, and which the suite measures rather than trusts.
 */
export interface BindingScope {
  readonly bindings: readonly DeclaredBinding[];
  readonly position: number;
}

/** Does this node carry an ARRAY under this key? The parse-only stand-in for a node-kind predicate. */
function hasArrayProperty(node: TsNode, key: string): boolean {
  return Array.isArray((node as unknown as Record<string, unknown>)[key]);
}

/**
 * D-27: a node that BINDS PARAMETERS — a function declaration, a function expression, an arrow, a
 * method, a constructor or an accessor. Read STRUCTURALLY, from the `parameters` array the parse
 * already carries, rather than through six optional predicates the TARGET's parser may not publish.
 */
function isFunctionLikeNode(node: TsNode): boolean {
  return hasArrayProperty(node, "parameters");
}

/** A node that holds a STATEMENT LIST — a block, a module block, the SourceFile, a switch's clauses. */
function isStatementContainer(node: TsNode): boolean {
  return hasArrayProperty(node, "statements") || hasArrayProperty(node, "clauses");
}

/**
 * A `case`/`default` clause, recognised by its PARENT holding the clause list. A clause is not its
 * own scope — the whole `CaseBlock` is — so the walk steps over it and stops at the block.
 */
function isSwitchClauseNode(node: TsNode): boolean {
  return node.parent !== undefined && hasArrayProperty(node.parent, "clauses");
}

/** A `for`/`for-in`/`for-of`/`while` head, whose declaration list scopes to the loop and no further. */
function isIterationLike(node: TsNode): boolean {
  return (node as unknown as Record<string, unknown>).statement !== undefined;
}

/** A `catch` clause: it carries a block AND the (possibly absent) binding the clause introduces. */
function isCatchClauseNode(node: TsNode): boolean {
  const record = node as unknown as Record<string, unknown>;
  return record.block !== undefined && "variableDeclaration" in record;
}

/**
 * A node's own range. The SourceFile is special-cased to START AT ZERO rather than at `getStart`,
 * which skips leading trivia: a file that opens with a comment would otherwise have a module scope
 * that does not contain its own first characters.
 */
function rangeOfNode(node: TsNode, sf: TsSourceFile): { readonly start: number; readonly end: number } {
  return { start: node === sf ? 0 : node.getStart(sf), end: node.getEnd() };
}

/** The nearest ancestor that binds parameters, or `undefined` at module scope. */
function enclosingFunctionLike(node: TsNode): TsNode | undefined {
  let cur = node.parent;
  while (cur !== undefined) {
    if (isFunctionLikeNode(cur)) return cur;
    cur = cur.parent;
  }
  return undefined;
}

/** The nearest ancestor a `let`/`const`/class binding reaches the END of. The SourceFile at worst. */
function enclosingScope(node: TsNode, sf: TsSourceFile): TsNode {
  let cur = node.parent;
  while (cur !== undefined) {
    if (isFunctionLikeNode(cur)) return cur;
    if (isCatchClauseNode(cur)) return cur;
    if (isStatementContainer(cur) && !isSwitchClauseNode(cur)) return cur;
    if (isIterationLike(cur)) return cur;
    cur = cur.parent;
  }
  return sf;
}

/** The PARAMETER this declaration belongs to — itself, or the one its binding pattern destructures. */
function parameterOf(ts: TsApi, node: TsNode): TsNode | undefined {
  // D-30 (4): `isParameter` is VALIDATED at load time, so the guard that used to stand here — a
  // decline site bound to RR-07 — is gone with the residual.
  const isParameter = ts.isParameter;
  let cur: TsNode | undefined = node;
  while (cur !== undefined) {
    if (isParameter(cur)) return cur;
    if (isFunctionLikeNode(cur) || isStatementContainer(cur)) return undefined;
    cur = cur.parent;
  }
  return undefined;
}

/** The CATCH CLAUSE this declaration is the binding of, if it is one. */
function enclosingCatchClause(node: TsNode): TsNode | undefined {
  let cur = node.parent;
  while (cur !== undefined) {
    if (isCatchClauseNode(cur)) return cur;
    if (isFunctionLikeNode(cur) || isStatementContainer(cur)) return undefined;
    cur = cur.parent;
  }
  return undefined;
}

/** The VariableDeclarationList this declaration belongs to — the node whose flags say `var` or not. */
function declarationListOf(node: TsNode): TsNode | undefined {
  let cur: TsNode | undefined = node;
  while (cur !== undefined) {
    if (hasArrayProperty(cur, "declarations")) return cur;
    if (isFunctionLikeNode(cur) || isStatementContainer(cur)) return undefined;
    cur = cur.parent;
  }
  return undefined;
}

/**
 * Does this declaration list HOIST? `var` does; `let`, `const`, `using` and `await using` do not.
 *
 * D-30 (5), CLOSING WR-30. This arm used to decide by the ABSENCE of two flag bits — `Let` and
 * `Const` — which made every declaration kind TypeScript has added since, and every one it adds
 * next, answer "hoists". Measured on this repository's parser (typescript 6.0.3): `Using` is 4 and
 * carries neither bit, so a `using` declaration was classified as hoisting and its suppression
 * range widened to the whole enclosing function, which for a BAN is the ACCEPTING direction.
 * (`AwaitUsing` is 6, which carries the `Const` bit, so it was never misclassified — the Warning's
 * own fix sketch would have been a no-op for that half. Measured, and recorded rather than
 * repeated.) The mask now names every block-scoping flag the parser publishes, and the two
 * explicit-resource-management flags stay OPTIONAL members of the record: a parser that predates
 * them cannot parse the syntax either, so their absence costs nothing.
 */
function listHoists(ts: TsApi, list: TsNode): boolean {
  const nodeFlags = ts.NodeFlags;
  const blockScoped =
    nodeFlags.Let | nodeFlags.Const | (nodeFlags.Using ?? 0) | (nodeFlags.AwaitUsing ?? 0);
  return ((list.flags ?? 0) & blockScoped) === 0;
}

/**
 * D-27: THE ONE PLACE A BINDING'S RANGE IS COMPUTED, with an explicit arm PER KIND rather than one
 * blanket walk to the nearest enclosing node — because the kinds do not agree about where a binding
 * BEGINS, and a blanket rule would have to pick one of their answers for all of them.
 *
 *   PARAMETER (destructured or not) — its OWN function-like node, in full.
 *   CATCH BINDING — the catch clause, and not a character further.
 *   `var`, and a FUNCTION DECLARATION's own name — these HOIST, so the range is the nearest
 *     enclosing function-like node (the SourceFile at module scope) IN FULL, and a reference ABOVE
 *     the declaration is legitimately bound by it.
 *   `let`, `const`, a binding element of either, and a CLASS declaration's name — these do NOT
 *     hoist. The range STARTS at the declaration's own `getStart(sf)` and ends at the end of the
 *     nearest enclosing block, loop or function. That is the temporal-dead-zone answer; it is also
 *     the safe direction for a BAN, and it is what stops `it.skip(...)` followed by a later
 *     `let it = 1;` in the same block from being a two-line evasion of exactly the kind CR-14 was.
 *
 * The `arm` is returned rather than inferred, so the suite can assert WHICH rule decided a range
 * instead of only asserting the two numbers it produced.
 */
export function bindingRangeFor(
  ts: TsApi,
  sf: TsSourceFile,
  declaration: TsNode,
): { readonly start: number; readonly end: number; readonly arm: string } {
  const parameter = parameterOf(ts, declaration);
  if (parameter !== undefined) {
    return { ...rangeOfNode(enclosingFunctionLike(parameter) ?? sf, sf), arm: "parameter" };
  }
  const catchClause = enclosingCatchClause(declaration);
  if (catchClause !== undefined) {
    return { ...rangeOfNode(catchClause, sf), arm: "catch" };
  }
  const isFunctionDeclaration = ts.isFunctionDeclaration;
  if (isFunctionDeclaration(declaration)) {
    // D-30 (5), CLOSING CR-18. A FUNCTION DECLARATION hoists to its enclosing BLOCK, not to its
    // enclosing FUNCTION. In an ES module a function declared inside `if (false) { … }` is
    // block-scoped and binds nothing at module scope, and handing it the enclosing function-like
    // node — the whole SourceFile at module scope — made a three-line dead block suppress a genuine
    // module-scope banned call: `0 findings` / EXIT=1 became `0 findings` / EXIT=0. `enclosingScope`
    // is the SAME authority the temporal-dead-zone arm already asks, so this arm now differs from
    // that one only in WHERE THE RANGE STARTS, which is the only thing hoisting is about.
    return { ...rangeOfNode(enclosingScope(declaration, sf), sf), arm: "hoisted" };
  }
  const list = declarationListOf(declaration);
  if (list !== undefined && listHoists(ts, list)) {
    return { ...rangeOfNode(enclosingFunctionLike(declaration) ?? sf, sf), arm: "hoisted" };
  }
  return {
    start: (list ?? declaration).getStart(sf),
    end: rangeOfNode(enclosingScope(declaration, sf), sf).end,
    arm: "tdz",
  };
}

/**
 * D-27 (2026-09-09, gap-closure round 5): the source file's DECLARED BINDINGS — the ordered list the
 * one canonicaliser resolves a reference against before it rewrites a head segment through EITHER
 * map. It replaces D-21 (2)'s `deriveDeclaredNames`, which was a per-file SET of names.
 *
 * WHY THIS EXISTS, AND WHAT IT COST THE FIRST TIME. `canonicaliseHeadSegment` originally rewrote
 * `segments[0]` whenever it was a key of a file-level map, with no scope analysis at all, so a
 * legitimate spec that renames the framework import to `it` and separately binds a local `it` was
 * REFUSED and the finding named `test.skip` — a construct absent from the file (WR-20). D-21 (2)
 * closed that with a FILE-SCOPED census, and the round-5 verifier measured what the file scope then
 * cost: a dead `const it = 1;` inside an unrelated callback turned `it.skip(...)` at module scope
 * from `1 finding(s)`/exit 1 into `0 findings`/exit 0 (CR-14). One unrelated declaration anywhere in
 * a spec disabled the entire rename/namespace/fixture-parameter ban family for that file.
 *
 * WHAT A SUPPRESSION DOES TO A BAN, STATED HONESTLY. This rule can only STOP a rewrite. For a ban,
 * stopping a rewrite moves the answer from REFUSED to ACCEPTED, because a head that is not rewritten
 * is not a banned head — so the direction it can change an answer in is the UNSAFE one, and calling
 * it monotone in the safe direction (as this file did before D-27) is the sentence a future widening
 * would cite. What bounds it is not its direction but the NEAREST-BINDING resolution below: a
 * reference is decided by the innermost binding of its name that lexically contains it, and only
 * that binding. Widening that resolution — including letting an outer binding answer where an inner
 * one exists — is a new decision and a gap-closure round, never a quiet edit.
 *
 * WHAT IS COUNTED: a parameter, a `const`/`let`/`var` binding, a destructured binding element, a
 * function declaration's name and a class declaration's name. Every one of them is a literal in the
 * source text, which is the same parse-only reasoning D-18 (3) and D-20 (3) use; the ranges are
 * `getStart`/`getEnd` on nodes this walk already visits. No binder and no type checker is involved,
 * and none is shipped (D-13).
 *
 * AN IMPORT BINDING IS DELIBERATELY NOT COUNTED — a census that counted import specifiers would make
 * every rename shadow itself and the canonicalisation would never fire. That is asserted in both
 * directions by the suite.
 *
 * THE ONE NON-SUPPRESSING RECORD, AND WHY IT IS A POSITION RATHER THAN A NAME. A parameter at index
 * 1 of a function that is itself the SECOND ARGUMENT of a call expression is recorded with
 * D-30 (5): THE ONE NON-SUPPRESSING RECORD IS GONE, WITH THE MAP IT CONSTRAINED. It existed to keep
 * a TestInfo fixture parameter visible to `deriveTestInfoParameterNames`, and that derivation — the
 * fixed-index read CR-21 was found on — has been deleted, because the checker answers the same
 * question by TYPE and at every argument position the framework documents. An exemption whose only
 * reason has been deleted is a superset of nothing, so every binding this census records now
 * suppresses. WR-26 was that exemption granted one position too wide; identity now answers the call
 * it mis-refused, and the exemption is not narrowed, it is removed.
 *
 * D-30 (4): the declaration predicates and the node flags are VALIDATED at load time, so this
 * derivation can no longer return `null` for an absent parser surface. The return type narrowed
 * with the guard, which is what removes the decline site RR-07 was bound to.
 */
export function deriveDeclaredBindings(ts: TsApi, sf: TsSourceFile): readonly DeclaredBinding[] {
  const isParameter = ts.isParameter;
  const isVariableDeclaration = ts.isVariableDeclaration;
  const isBindingElement = ts.isBindingElement;
  const isFunctionDeclaration = ts.isFunctionDeclaration;
  const isClassDeclaration = ts.isClassDeclaration;
  const bindings: DeclaredBinding[] = [];
  const record = (name: string, declaration: TsNode): void => {
    const range = bindingRangeFor(ts, sf, declaration);
    bindings.push({ name, start: range.start, end: range.end });
  };
  forEachDescendant(ts, sf, (node) => {
    if (isParameter(node)) {
      if (ts.isIdentifier(node.name)) record(node.name.text, node);
    } else if (isVariableDeclaration(node) || isBindingElement(node)) {
      if (ts.isIdentifier(node.name)) record(node.name.text, node);
    } else if (isFunctionDeclaration(node) || isClassDeclaration(node)) {
      const named = node.name;
      if (named !== undefined && ts.isIdentifier(named)) record(named.text, node);
    }
  });
  return bindings;
}

/**
 * D-27: THE ONE RESOLUTION AUTHORITY, and the ONE predicate both canonicalisations ask. Which
 * binding of this NAME decides this POSITION?
 *
 * INNERMOST WINS: among the records of that name whose range contains the position, the one with the
 * GREATEST start, tie-broken by the SMALLEST end. On an EXACT tie of both ends the NON-suppressing
 * record wins, which is the ban's safe direction — an ambiguity can never become an admission. That
 * tie is reachable: two parameters of one name are a duplicate binding a type checker would reject
 * and `createSourceFile` accepts, because it does no binding.
 *
 * WHAT THIS DELIBERATELY IS NOT. It is not "does SOME containing binding of this name exist". That
 * predicate cannot distinguish an inner fixture parameter from an outer `const`; it makes the OUTER
 * one decide; and it is the resolution the round-5 adversarial check measured still admitting
 * `testInfo.skip()` at module scope. Narrowing file-scope membership to containment was necessary
 * and NOT sufficient.
 *
 * The comparison is INCLUSIVE at the start and EXCLUSIVE at the end, so a range ending exactly where
 * a reference starts does not contain it and a range starting exactly at a reference does.
 */
export function resolveBinding(
  bindings: readonly DeclaredBinding[],
  name: string,
  position: number,
): DeclaredBinding | undefined {
  let nearest: DeclaredBinding | undefined;
  for (const binding of bindings) {
    if (binding.name !== name) continue;
    if (position < binding.start || position >= binding.end) continue;
    if (nearest === undefined) {
      nearest = binding;
      continue;
    }
    if (binding.start > nearest.start) {
      nearest = binding;
      continue;
    }
    if (binding.start < nearest.start) continue;
    if (binding.end < nearest.end) {
      nearest = binding;
      continue;
    }
    // AN EXACT TIE OF BOTH ENDS. D-27 decided it in the ban's safe direction by preferring the
    // NON-suppressing record; D-30 (5) deleted the only non-suppressing record there was, so the two
    // tied records are now indistinguishable and the first one answers. Keeping a preference over a
    // distinction that no longer exists would be a branch no input can reach.
  }
  return nearest;
}

/**
 * D-18 (3): rewrite a resolved path's HEAD SEGMENT through the rename map, so `it.skip` is asked as
 * `test.skip` and a renamed head cannot defeat the head-set check.
 *
 * THIS FUNCTION DECLINES NOTHING, and that is deliberate rather than incidental. Every exit returns
 * its INPUT or a rewrite of its input — never a fresh `null` — so it introduces no decline site of
 * its own, and the resolver's decline set stays exactly the set of positions where a path could not
 * be produced in the first place. A `null` path passes straight through, so the caller needs no null
 * comparison.
 */
export function canonicaliseHeadSegment(
  dottedPath: string | null,
  renames: ReadonlyMap<string, string>,
  scope: BindingScope | null = null,
): string | null {
  if (dottedPath === null) return dottedPath;
  const segments = dottedPath.split(".");
  // D-27: THE SCOPE RULE, ASKED WITH THIS REFERENCE'S OWN POSITION. A head bound by the NEAREST
  // declaration containing this reference is left alone; a declaration in some other scope does not
  // answer at all. Writing this rule inside the map's own derivation would be the WR-20 defect one
  // map over the moment a second map arrives, so it is asked here — the one place a head segment is
  // rewritten by spelling.
  //
  // D-30 (3): this whole function now serves the SECOND rule only. Identity decides every call the
  // checker can resolve, and the spelling rule is asked exclusively where it could not — which is
  // where a temporal-dead-zone reference lives, and which is why the census survives the cutover.
  if (scope !== null && resolveBinding(scope.bindings, segments[0], scope.position) !== undefined) {
    return dottedPath;
  }
  const imported = renames.get(segments[0]);
  if (imported !== undefined) {
    if (imported === IMPORT_NAMESPACE_MARKER) {
      // A namespace head is DROPPED: `pw.test.skip` is asked as `test.skip`. A bare `pw(...)` has no
      // segment left to ask about, so it passes through unchanged rather than becoming an empty path.
      if (segments.length < 2) return dottedPath;
      return segments.slice(1).join(".");
    }
    segments[0] = imported;
    return segments.join(".");
  }
  return dottedPath;
}

/**
 * D-27 (PROBE 4): the ASSERTION HEADS arms (a) and (b) refuse a context around — `expect` and the
 * generic `assert` — and the ONE place that pair is written.
 *
 * `assert` is not a `@playwright/test` export, so no rename of this module can produce it; it is in
 * the pair because D-14 named it and because another assertion library's `assert` can be imported
 * into a spec file.
 */
const ASSERTION_HEADS: readonly string[] = Object.freeze(["expect", "assert"]);

/**
 * D-27 (PROBE 4): which assertion head, if any, is this call's callee — asked about the head the ONE
 * canonicaliser has ALREADY seen, and about nothing else.
 *
 * ITS INPUT IS ARM (c)'s OWN `dottedPath`, which is `calleeDottedPath` put through
 * `canonicaliseHeadSegment` with this call's position. So a rename (`check` -> `expect`), a
 * namespace (`pw.expect` -> `expect`) and D-27's scope rule are all applied here for free, by
 * construction, rather than by a second reading of the same maps.
 *
 * A SECOND ROUTE THROUGH THE HEAD IDENTIFIER WAS WRITTEN AND THEN DELETED, and the reason is
 * recorded because it is the kind of redundancy that becomes a defect. It looked necessary: the
 * OUTER link of a renamed chain resolves to `check().toBeVisible`, whose first segment carries the
 * call marker and is not a key of the rename map. It is not, because the INNER link of that same
 * chain is `check(...)`, which resolves to `expect`, and both links are visited — the arms record a
 * head only when a banned CONTEXT is found, so a non-matching outer link consumes nothing. Driven
 * against every shape where the two could differ (a computed member on the head, a chain past the
 * step bound): in each one `calleeHeadIdentifier` declines exactly where `calleeDottedPath` does, so
 * the second route added no answer and only a second place for the answers to disagree.
 *
 * IT DECLINES NOTHING THE ARMS DID NOT ALREADY DECLINE: `null` means "this callee is not an
 * assertion head", which is what a non-matching raw identifier meant before. Returning the head
 * rather than a boolean is what lets the caller keep D-14's distinction between `expect` — where a
 * conditional context is also refused — and `assert`.
 */
function canonicalAssertionHead(dottedPath: string | null): string | null {
  if (dottedPath === null) return null;
  // THE FIRST SEGMENT, READ RAW, AND A MARKER STRIP THAT WAS WRITTEN AND THEN DELETED. The OUTER
  // link of an assertion chain resolves to `expect().toBeVisible`, whose first segment carries the
  // D-18 (1) call marker, so stripping it looked necessary. A mutation proof measured otherwise: the
  // strip broke ZERO cases, because the INNER link of that same chain is `expect(...)`, whose first
  // segment is the bare head, and both links are visited. A branch no case can reach is a branch
  // nobody derived, so it is gone rather than kept for symmetry.
  // IN-15: the split runs ONCE, into a local both positions read. The same string split twice in
  // one expression is two chances for two readings of one path to disagree when this line is next
  // edited, which is the identical argument IN-12 made for the routing normaliser.
  const head = dottedPath.split(".")[0];
  return ASSERTION_HEADS.includes(head) ? head : null;
}

/** The three assertion node kinds, each guarded because the target's parser may predate it. */
function isTypeAssertionLike(ts: TsApi, node: TsNode): boolean {
  const predicates = [ts.isAsExpression, ts.isTypeAssertionExpression, ts.isSatisfiesExpression];
  for (const predicate of predicates) {
    if (typeof predicate === "function" && predicate(node)) return true;
  }
  return false;
}

/** Every finding in one spec, in source order, as the union of all three arms. */
export function findBannedConstructs(
  ts: TsApi,
  sf: TsSourceFile,
  relPath: string,
  ctx: ProgramContext,
): string[] {
  const findings: Array<{ pos: number; text: string }> = [];
  // Arms (a) and (b) are keyed on the HEAD IDENTIFIER's position so a chained assertion reports
  // once. Arm (c) matches a single call shape and needs no such key.
  const reportedAssertionHeads = new Set<number>();
  // D-20 (2): the same idiom, for arm (c). Two links of ONE chain that fold to the same
  // routing-stripped path are one construct, and the chain-wide option fold would otherwise report
  // the converse configured ordering once at the inner link and once at the outer one.
  const reportedModifierChains = new Set<string>();

  const lineOf = (pos: number): number => ts.getLineAndCharacterOfPosition(sf, pos).line + 1;

  // D-18 (3): the rename map is built ONCE PER SOURCE FILE, before the walk, and applied between
  // shape resolution and membership. Per-file is the correct scope because an import declaration's
  // reach is the file it sits in.
  const renames = deriveImportRenames(ts, sf);
  // D-27: the declared-BINDING list is built ONCE PER SOURCE FILE as well. D-30 (3): both it and the
  // rename map above now serve the SECOND rule only — the one asked where the checker resolved no
  // symbol at all.
  const bindings = deriveDeclaredBindings(ts, sf);

  const visit = (node: TsNode): void => {
    if (ts.isCallExpression(node)) {
      // ── arm (c): a banned modifier call ────────────────────────────────────────────────────
      // ONE normaliser, ONE authority. No callee shape is inspected here — every shape question
      // belongs to calleeDottedPath — and no membership is decided here either: the whole condition
      // is the question put to isBannedModifierCall. Two places that decide one question are two
      // places for the answers to disagree, which is how CR-06 happened, and asking a rule about a
      // shape nobody resolved is how CR-07 happened.
      // D-27: the scope argument carries THIS call's own position. A file-level constant here would
      // give every call in the file one answer, which is CR-14 through the back door. It is a named
      // local because BOTH arm families ask the canonicaliser with it — one position per call, asked
      // once, rather than two spellings of the same position that a later edit could separate.
      const scope = { bindings, position: node.getStart(sf) };
      const spelled = canonicaliseHeadSegment(
        calleeDottedPath(ts, node.expression),
        renames,
        scope,
      );
      // D-30 (1) and (2): IDENTITY FIRST, AND ITS THREE ANSWERS ARE THREE DIFFERENT THINGS.
      //
      //   `framework`  — the checker resolved the callee to a member the framework itself declares.
      //                  Its identity-canonical path is what the membership authority is asked
      //                  about, and what a finding names.
      //   `foreign`    — the checker resolved it and it is NOT the framework's. The ban operand is
      //                  `null`, so the membership authority answers false and THE SPELLING RULE IS
      //                  NOT CONSULTED. That is what makes WR-26's false refusal impossible rather
      //                  than narrower: a helper parameter named like a renamed import can no longer
      //                  be canonicalised into a construct the file does not contain.
      //   `unresolved` — the checker has no symbol. Only here does the spelling rule answer, which
      //                  is where D-27's temporal-dead-zone refusals live. The pairing is disclosed
      //                  in UNRESOLVABLE_CALLEE_RESIDUALS as a residual of its own.
      //
      // The ARMS (a)/(b) operand is deliberately NOT the ban operand: an assertion head is not a
      // framework-identity question — D-14 names the generic `assert`, which no framework declares —
      // so those arms read the identity path when there is one and the spelled path otherwise.
      const identity = resolveBannedModifier(ts, ctx, node);
      const banPath =
        identity.kind === "framework" ? identity.path : identity.kind === "foreign" ? null : spelled;
      const dottedPath = identity.kind === "framework" ? identity.path : spelled;
      if (isBannedModifierCall(banPath, chainEnabledOptionKeys(ts, node))) {
        const pos = node.getStart(sf);
        // D-20 (2): one finding per CHAIN. The key asks the same normaliser the arms ask; it decides
        // no membership of its own.
        const chainKey = `${pos}|${stripRoutingLinks(banPath)}`;
        if (!reportedModifierChains.has(chainKey)) {
          reportedModifierChains.add(chainKey);
          // ONE emission point, and ONE sentence true of the WHOLE banned family. It used to say the
          // call "removes the scenario", which was true of `skip`/`only`/`fixme` and FALSE of the
          // inverting `fail` that D-17 added: `fail` runs the scenario and reports a failing
          // assertion as a pass. A finding that misstates what the construct does to the evidence is
          // the claim-broader-than-the-mechanism defect this whole file exists to avoid, so the
          // sentence names both harms rather than branching into a second emission point.
          findings.push({
            pos,
            text:
              `${relPath}:${lineOf(pos)}: banned modifier call — \`${banPath}\` decides which ` +
              `scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.`,
          });
        }
      }
      // ── arms (a) and (b): a caught or conditional assertion ─────────────────────────────────
      //
      // D-27 / PROBE 4: THIS ARM FAMILY ASKS ITS MEMBERSHIP QUESTION ABOUT A CANONICALISED HEAD.
      // It used to compare the RAW head identifier's text, which is the only path from a call
      // expression to a membership question that did not go through the one canonicaliser — so
      // `import { expect as check }` and `import * as pw` both defeated both arms at exit 0, which
      // is WR-14's defect in the one family D-18 (3) never reached.
      //
      // ONE INPUT, THE ONE ALREADY CANONICALISED. The arms ask about arm (c)'s own `dottedPath`,
      // which carries the rename map, the namespace drop and D-27's scope rule at THIS call's
      // position. The head identifier is still read, but only for the position the per-assertion
      // dedup keys on — never as a membership operand.
      const head = calleeHeadIdentifier(ts, node.expression);
      const assertionHead = canonicalAssertionHead(dottedPath);
      if (head !== null && assertionHead !== null) {
        const headPos = head.getStart(sf);
        if (!reportedAssertionHeads.has(headPos)) {
          const context = bannedContextOf(ts, node, assertionHead === "expect");
          if (context !== null) {
            reportedAssertionHeads.add(headPos);
            findings.push({
              pos: headPos,
              text:
                context.arm === "a"
                  ? `${relPath}:${lineOf(headPos)}: caught assertion — the \`${head.text}\` call sits ${context.where}, ` +
                    `so a failure would be swallowed and the evidence would not show it.`
                  : `${relPath}:${lineOf(headPos)}: conditional assertion — the \`${head.text}\` call is reached ${context.where}, ` +
                    `so it may not run at all and a green result would not prove the scenario.`,
            });
          }
        }
      }
    }
  };

  // D-21 (1): the one non-recursive walk. The findings are sorted by source position below, so the
  // worklist's LIFO order is not part of what this function reports.
  forEachDescendant(ts, sf, visit);
  findings.sort((x, y) => x.pos - y.pos);
  return findings.map((f) => f.text);
}

// ── the analysis, with two counters from two origins ───────────────────────────────────────────

export interface SpecAnalysis {
  /** Incremented by the loop that actually parses a file — never assigned from a length. */
  readonly visited: number;
  /** Derived from the spec set BEFORE the loop runs. */
  readonly expected: number;
  readonly findings: readonly string[];
  /** Could-not-run reasons. A file named here did NOT increment `visited`. */
  readonly errors: readonly string[];
}

function defaultReadFile(absPath: string): string {
  return readFileSync(absPath, "utf8");
}

/**
 * Analyse every derived spec. The file reader is injectable so a test can force a SHORT VISIT by
 * throwing on one path and prove the floor below actually fires — a floor nobody can reach is a
 * floor nobody has tested.
 *
 * An unreadable or unparseable spec is recorded as a could-not-run reason and does NOT increment
 * `visited`, which is what makes the short-set branch of reportMeasured sufficient to catch it.
 */
export function analyzeSpecs(
  repoRoot: string,
  specRelPaths: readonly string[],
  ts: TsApi,
  ctx: ProgramContext,
  readFile: (absPath: string) => string = defaultReadFile,
): SpecAnalysis {
  const expected = specRelPaths.length;
  const findings: string[] = [];
  const errors: string[] = [];
  let visited = 0;

  for (const rel of specRelPaths) {
    let text: string;
    try {
      text = readFile(join(repoRoot, rel));
    } catch {
      errors.push(
        `Cannot read the UAT spec ${rel}; the check was NOT performed for that file, so this run covers less than the derived set.`,
      );
      continue;
    }
    // D-21 (1) / D-28: THE EXIT-CODE CONTRACT IS HELD BY DECISION, NOT BY THE INTERPRETER'S DEFAULT,
    // AND THE BOUNDARY IS ABOUT THE BYTES RATHER THAN ABOUT ONE FUNCTION.
    //
    // WR-19 measured a spec whose shape made the walk throw: nothing was caught, `reportMeasured`
    // was never reached, the two floors below were bypassed by construction, stdout stayed silent
    // and the process exited 1 — which the D-12 contract reads as "a finding, the gate blocks".
    // D-21 (1) answered that by wrapping `findBannedConstructs`. CR-15 then measured the SAME harm
    // one register over, at a QUARTER of the depth the fix had just closed: `ts.createSourceFile`
    // is itself a recursive-descent parser running on author-controlled source, and it sat ONE LINE
    // ABOVE that `try`. The register that failed was not the bound's VALUE and not its UNIT — both
    // of which D-21 (1) fixed — but WHICH WORK THE BOUNDARY ENCLOSES.
    //
    // So the `try` below encloses EVERYTHING this runnable does with a spec's bytes: the parse, the
    // parse-diagnostics inspection and the walk. A file the parser cannot finish is a file this
    // runnable did not check, exactly like one it could not read: it is a COULD-NOT-RUN reason, it
    // does not increment `visited`, and the denominator floor therefore says out loud that the run
    // covered less than it claims. The increment stays AFTER the analysis for that reason — a file
    // counted before the work is a file that can be counted as checked without having been.
    //
    // The four could-not-run reasons stay DISTINGUISHABLE (unreadable · did not parse · the parse
    // itself faulted · could not be analysed), so a reader can tell which of them happened.
    //
    // D-30 / WR-29: THE FOUR REASONS ARE NOW FOUR SENTENCES. The module claimed four
    // distinguishable outcomes and implemented three: a fault raised INSIDE the parser and a fault
    // raised inside the WALK both reported the walk's sentence, byte-identical, so a reader could
    // not tell which had happened — the one thing the claim promises. Each arm below has its own
    // `try` and its own sentence, and a case DERIVES the four and asserts them pairwise distinct.
    let specFindings: string[];
    let sf: TsSourceFile;
    try {
      sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    } catch (cause) {
      errors.push(
        `The UAT spec ${rel} could not be PARSED (${describeCause(cause)}); the parser itself faulted on this file, so no verdict is reported for it.`,
      );
      continue;
    }
    try {
      const diagnostics = (sf as unknown as ParsedSourceFile).parseDiagnostics;
      if (diagnostics !== undefined && diagnostics.length > 0) {
        errors.push(
          `The UAT spec ${rel} did not parse (${diagnostics.length} parse diagnostic(s)); a file that cannot be parsed cannot be checked, so no verdict is reported for it.`,
        );
        continue;
      }
    } catch (cause) {
      errors.push(
        `The UAT spec ${rel} could not have its parse INSPECTED (${describeCause(cause)}); the diagnostics this file produced could not be read, so no verdict is reported for it.`,
      );
      continue;
    }
    try {
      // D-30 (1): the WALK runs over the PROGRAM's own source file, because that is the node tree
      // the checker knows and identity is a question only the checker can answer. A spec the
      // program does not carry — because its own parse faulted inside the compiler host — is the
      // parse sentence again, at the one place that can tell.
      const analysed = ctx.program.getSourceFile(join(repoRoot, rel));
      if (analysed === undefined) {
        const fault = ctx.parseFaults.get(join(repoRoot, rel));
        errors.push(
          `The UAT spec ${rel} could not be PARSED (${fault ?? "the program did not include it"}); the parser itself faulted on this file, so no verdict is reported for it.`,
        );
        continue;
      }
      specFindings = findBannedConstructs(ts, analysed, rel, ctx);
    } catch (cause) {
      errors.push(
        `The UAT spec ${rel} could not be analysed (${describeCause(cause)}); the check was NOT performed for that file, so this run covers less than the derived set.`,
      );
      continue;
    }
    visited++; // THE ONE increment site: it runs only when a file was really read, parsed and walked.
    findings.push(...specFindings);
  }

  return { visited, expected, findings, errors };
}

// ── the four ordered branches ──────────────────────────────────────────────────────────────────

/**
 * The rule of scripts/vacuity.ts (`reportMeasured`), REIMPLEMENTED here rather than imported. It
 * cannot be imported: this runnable is node:-builtins-only and executes on a host that has no
 * grugops node_modules. Naming the origin keeps the two visibly the SAME RULE rather than two
 * habits that can drift apart. The only difference is the return value — vacuity.ts returns a FAIL
 * delta for a guard's counter; this returns the process exit code.
 *
 * The ORDER is load-bearing. A zero-element run must read as "not performed", and a short scan set
 * must be reported before any finding, so a narrowed check can never be read as a clean one.
 */
export function reportMeasured(
  m: { visited: number; expected: number; findings: readonly string[] },
  wantJson: boolean,
  out: (s: string) => void,
  err: (s: string) => void,
): number {
  // (1) VACUITY FLOOR — element level. A zero-element run can never print a pass line.
  if (m.visited === 0) {
    err(
      `UAT spec integrity: ZERO uat specs were visited (${m.expected} derived) — this check was NOT ` +
        `performed. A pass line here would state a check that did not run.\n`,
    );
    return 2;
  }
  // (2) DENOMINATOR FLOOR — collection level. A short scan set is a silently narrowed check.
  if (m.visited !== m.expected) {
    err(
      `UAT spec integrity: visited ${m.visited} of ${m.expected} derived uat specs — the scan set is ` +
        `short, so the result covers less than it claims.\n`,
    );
    return 2;
  }
  // (3) FINDINGS — reported over the visited total, never bare.
  if (m.findings.length > 0) {
    if (wantJson) {
      out(`${JSON.stringify({ ok: false, findings: m.findings })}\n`);
    } else {
      out(
        `UAT spec integrity: ${m.findings.length} finding(s) over ${m.visited}/${m.expected} uat specs checked\n`,
      );
      for (const f of m.findings) out(`${f}\n`);
    }
    return 1;
  }
  // (4) The PASS line CARRIES THE MEASUREMENT — never a bare assertion.
  if (wantJson) {
    out(`${JSON.stringify({ ok: true, findings: [] })}\n`);
  } else {
    out(`UAT spec integrity: 0 findings over ${m.visited}/${m.expected} uat specs checked\n`);
  }
  return 0;
}

/**
 * D-28 (3): THE FOUR BRANCHES ABOVE, WITH THE STREAM EACH ONE WRITES TO AND THE CODE IT RETURNS —
 * READ OFF `reportMeasured` RATHER THAN DECIDED HERE.
 *
 * The two floors call `err(...)` and return 2; only the findings line and the pass line call
 * `out(...)`. A could-not-run run therefore carries its measurement on STDERR with an EMPTY stdout,
 * BY DESIGN, and that design is the `scripts/vacuity.ts` mirror D-21 established and this runnable
 * cannot import. Publishing the table is what lets the pathological corpus assert "the measurement
 * reached the stream ITS BRANCH writes to" without hand-typing an expectation per case — and what
 * makes a later change to `reportMeasured` move this table and turn that corpus red rather than
 * silently disagree with it.
 */
export type MeasurementBranch = "vacuity_floor" | "denominator_floor" | "findings" | "pass";

export const MEASUREMENT_BRANCH_STREAMS: Readonly<
  Record<MeasurementBranch, { readonly stream: "stdout" | "stderr"; readonly exitCode: number }>
> = Object.freeze({
  vacuity_floor: Object.freeze({ stream: "stderr", exitCode: 2 } as const),
  denominator_floor: Object.freeze({ stream: "stderr", exitCode: 2 } as const),
  findings: Object.freeze({ stream: "stdout", exitCode: 1 } as const),
  pass: Object.freeze({ stream: "stdout", exitCode: 0 } as const),
});

/**
 * D-28 (3): the shapes the pathological corpus drives, PUBLISHED as a set rather than left as a
 * habit inside a test file.
 *
 * CR-15 was found at one nesting depth because a reviewer tried that depth; WR-19 was found at one
 * chain length for the same reason. Both suites were green. A published list is what a document can
 * quote, what a both-directions equality can bind, and what a later edit cannot quietly shrink.
 *
 * The corpus is generated at RUN TIME and removed: a 1,000-deep nesting, an invalid-UTF-8 file or a
 * binary file committed under the fixtures directory would be type-checked by
 * `tsconfig.fixtures.json` and would turn a different gate red for a reason unrelated to the ban.
 */
export const PATHOLOGICAL_INPUT_SHAPES: readonly string[] = Object.freeze([
  "a nesting depth the parser cannot finish",
  "the adjacent nesting depth the parser does finish",
  "a spec far larger than any ordinary one",
  "a spec carrying invalid UTF-8 byte sequences",
  "a spec opening with a byte-order mark",
  "a spec whose bytes are binary",
]);

// ── the command line ───────────────────────────────────────────────────────────────────────────

const USAGE =
  "Usage: node uat-spec-integrity.js <repo-root> [--json] [--check-browser]\n";

/**
 * D-28 (2): the reason the PROCESS boundary writes when the runnable could not complete. It is a
 * distinct sentence from every per-file could-not-run reason, so a reader can tell a file that was
 * not checked from a run that did not finish.
 */
export const PROCESS_BOUNDARY_MARKER =
  "UAT spec integrity: the runnable could not complete";

/**
 * The dependencies `main` reaches, injectable for the same stated reason `analyzeSpecs`'s `readFile`
 * is injectable: A BOUNDARY NOBODY CAN REACH IS A BOUNDARY NOBODY HAS TESTED. Every field defaults
 * to the real function, so a caller that passes nothing — the CLI included — runs exactly the
 * program this module ran before the record existed. The record is what lets a case force a fault
 * BEFORE `analyzeSpecs`, INSIDE it and AFTER it, and assert the process boundary answered each one.
 */
export interface MainDependencies {
  readonly deriveSpecPaths?: (repoRoot: string) => SpecDerivation;
  readonly loadTypeScript?: (repoRoot: string) => TsApi | null;
  readonly analyzeSpecs?: (
    repoRoot: string,
    specRelPaths: readonly string[],
    ts: TsApi,
    ctx: ProgramContext,
  ) => SpecAnalysis;
  readonly createProgram?: (
    repoRoot: string,
    specAbsPaths: readonly string[],
    ts: TsApi,
  ) => ProgramResult;
  readonly reportMeasured?: (
    m: { visited: number; expected: number; findings: readonly string[] },
    wantJson: boolean,
    out: (s: string) => void,
    err: (s: string) => void,
  ) => number;
  readonly out?: (s: string) => void;
  readonly err?: (s: string) => void;
}

/**
 * D-28 (2): THE WHOLE BODY IS INSIDE ONE PROCESS BOUNDARY, so the D-12 contract is held by decision
 * at the process edge as well as per file.
 *
 * WHY 2 AND NOT 1. 1 means "a finding — the quality gate blocks", which is a claim ABOUT THE SPECS.
 * A runnable that could not complete has made no claim about them, so reporting 1 would report a
 * check that never ran as a check that found something — the exact reading CR-15 measured Node's
 * uncaught-exception code producing. 2 means "could not run", which is what happened.
 *
 * The `try` RETURNS WHAT THE BODY RETURNS: a legitimate 0 and a legitimate 1 pass through untouched,
 * and only a THROW becomes 2.
 */
export function main(argv: readonly string[], deps: MainDependencies = {}): number {
  const out = deps.out ?? ((s: string): void => {
    process.stdout.write(s);
  });
  const err = deps.err ?? ((s: string): void => {
    process.stderr.write(s);
  });
  try {
    return runMain(argv, deps, out, err);
  } catch (cause) {
    err(
      `${PROCESS_BOUNDARY_MARKER} (${cause instanceof Error ? cause.message : String(cause)}); ` +
        `the check was NOT performed, so nothing is claimed about the specs.\n`,
    );
    return 2;
  }
}

function runMain(
  argv: readonly string[],
  deps: MainDependencies,
  out: (s: string) => void,
  err: (s: string) => void,
): number {
  const wantJson = argv.includes("--json");
  const checkBrowser = argv.includes("--check-browser");
  const rootArg = argv.find((a) => !a.startsWith("--"));
  const derive = deps.deriveSpecPaths ?? deriveSpecPaths;
  const loadParser = deps.loadTypeScript ?? loadTypeScriptFromTarget;
  const analyze = deps.analyzeSpecs ?? analyzeSpecs;
  const buildProgram = deps.createProgram ?? createProgramForTarget;
  const report = deps.reportMeasured ?? reportMeasured;

  if (rootArg === undefined) {
    err(`Error: no repository root was provided. ${USAGE}`);
    return 2;
  }
  const repoRoot = resolve(rootArg);
  let rootIsDirectory = false;
  try {
    rootIsDirectory = statSync(repoRoot).isDirectory();
  } catch {
    rootIsDirectory = false;
  }
  if (!rootIsDirectory) {
    err(`Error: the repository root is not a readable directory: ${repoRoot}\n`);
    return 2;
  }

  // D-15 first when asked: if the lane cannot run the specs, saying anything about their contents
  // would invite the reader to treat a checked spec as an exercised one.
  if (checkBrowser && !emitLoudSkipIfBrowserUnusable(repoRoot, realBrowserProbe, err)) return 2;

  const derived = derive(repoRoot);
  if (derived.refusals.length > 0) {
    for (const r of derived.refusals) err(`${r}\n`);
    return 2;
  }

  // An empty derived set is decided by the SAME four-branch authority as every other outcome, and
  // it is decided BEFORE the parser is needed: there is nothing to parse.
  if (derived.relPaths.length === 0) {
    return report({ visited: 0, expected: 0, findings: [] }, wantJson, out, err);
  }

  const ts = loadParser(repoRoot);
  if (ts === null) {
    err(`${PARSER_ABSENT_MARKER}\n`);
    return 2;
  }

  // D-30 (4): the PROGRAM is created here, beside the parser-absent branch, so the two LOUD
  // outcomes sit together and read the same way. A target that cannot create one — no configuration
  // file, one that cannot be read or parsed, a compiler that throws, or framework declarations that
  // do not resolve — exits 2 with ONE named reason and its own cause. This is NOT a degrade: RR-07
  // recorded the resolver silently falling back to the pre-D-18 rule, and a smaller ban applied
  // without saying so is a gate LOWERING rather than a disclosed limit.
  const program = buildProgram(repoRoot, derived.relPaths.map((rel) => join(repoRoot, rel)), ts);
  if (!program.ok) {
    err(`${PROGRAM_UNAVAILABLE_REASON} (${program.cause})\n`);
    return 2;
  }

  const analysis = analyze(repoRoot, derived.relPaths, ts, program.context);
  for (const e of analysis.errors) err(`${e}\n`);
  return report(analysis, wantJson, out, err);
}

/**
 * Is this module the process entry point? FAIL TOWARDS RUNNING: an inconclusive answer runs main(),
 * because failing to run when invoked as a CLI would exit 0 with no output — a fabricated green,
 * the one outcome this file exists to prevent. Being imported by a test is the only case that
 * suppresses the run, and that case is decided positively (a different resolved entry path).
 */
function invokedAsScript(): boolean {
  const entry = process.argv[1];
  if (entry === undefined || entry === "") return true;
  try {
    return realpathSync(resolve(entry)) === realpathSync(import.meta.filename);
  } catch {
    return true;
  }
}

if (invokedAsScript()) {
  process.exit(main(process.argv.slice(2)));
}

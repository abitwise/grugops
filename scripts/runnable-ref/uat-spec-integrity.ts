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
  if (BANNED_EXACT_PATHS.includes(stripRoutingLinks(dottedPath))) return true;
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
  if (
    !Object.prototype.hasOwnProperty.call(BANNED_CONFIGURED_PATHS, stripRoutingLinks(dottedPath))
  ) {
    return false;
  }
  return enabledOptions.has(BANNED_CONFIGURED_PATHS[stripRoutingLinks(dottedPath)]);
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
 * D-20 (3): the resolved path of a plain scenario call — the one whose callback carries the TestInfo
 * fixture in its SECOND parameter. It is the canonical spelling, so an import-renamed head
 * (`it("a", ...)`) reaches it after D-18 (3)'s canonicalisation and needs no case of its own.
 */
const TEST_SCENARIO_PATH = "test";

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

/**
 * D-21 (1): THE ONE AUTHORITY for the chain bound's VALUE, in STEPS. Every resolver that walks a
 * callee chain reads it from here and no resolver writes the number a second time — a second
 * literal is a second allowance with a second value the moment either one is edited, which is one
 * half of how WR-19 happened. The other half is the UNIT, which `CalleeStepBudget` below fixes.
 */
export const CALLEE_CHAIN_STEP_BOUND = 512;

/**
 * D-21 (1): the bound's UNIT, made explicit as a value that can be THREADED.
 *
 * WHY A MUTABLE OBJECT AND NOT A COUNT PARAMETER. `calleeDottedPath` is recursive (D-18 (1)), and a
 * bound expressed as a loop counter is re-derived by every frame — which silently turned "512 steps
 * per resolution" into "512 steps per recursion frame" and made the residual sentence the recipe
 * quotes false in BOTH its clauses. One shared budget object, decremented on every link INCLUDING
 * the descent into a call link, restores the unit the sentence claims: the allowance belongs to the
 * WHOLE resolution, so interleaving call links can never buy a chain more steps than a flat one.
 */
export interface CalleeStepBudget {
  left: number;
}

/** A fresh allowance for one whole resolution. Exported so a caller can measure what it spent. */
export function newCalleeStepBudget(): CalleeStepBudget {
  return { left: CALLEE_CHAIN_STEP_BOUND };
}

// The callee shapes the resolver CANNOT decide from the source text alone, exported as prose so the
// recipe quotes the disclosed boundary from the same source as the decided rule. Resolving any of
// them needs a type checker to follow a binding to its declaration or across a module, and this
// runnable deliberately ships no type checker (D-13): it resolves `typescript` from the TARGET
// repository at run time and uses it to PARSE, never to check types. Each shape is therefore NAMED
// here rather than left as a silence, and the test suite binds every one of them to a decline site
// it DERIVES from this file's own AST — in both directions, so a residual naming a site the
// resolver no longer has is caught the same way an undisclosed site is.
export const UNRESOLVABLE_CALLEE_RESIDUALS: readonly string[] = Object.freeze([
  "An aliased binding is not refused: `const t = test;` then a modifier call on `t`. The alias cannot be followed to its declaration without a type checker.",
  "A member computed from a non-literal expression is not refused: `test[name](...)` where `name` is a variable. The member name is absent from the source text.",
  "A rename or namespace that arrives through any module other than `@playwright/test` is not canonicalised: `import { test as it } from \"./fixtures\";` then `it.skip(...)`. Following a re-export across files needs module resolution this runnable does not ship, so the rename map is MODULE-SCOPED to the framework's own import declaration.",
  "A callee whose head is not an identifier is not resolved: a call on an object literal, or on `this`. There is no head segment to read, so no membership question can be put.",
  // D-21 (1): the NUMBER is interpolated from its one authority rather than spelled a second time,
  // so the disclosed sentence cannot drift from the allowance the resolver actually spends.
  `A callee chain longer than the resolver's ${CALLEE_CHAIN_STEP_BOUND}-step bound is not resolved. The bound is ONE allowance for a WHOLE resolution: every link spends a step, the descent into a call link included, so interleaving calls buys a chain no extra steps. It stops a pathological chain from spinning and from exhausting the interpreter. It is a stated LIMIT, not a silence. A chain that reaches it yields no path rather than a truncated one.`,
  "An option is ENABLED only when the call's first argument is an object literal assigning it the `true` keyword. A variable argument enables nothing, and neither does a variable option value. This runnable parses and never evaluates.",
  "A parser that does not expose the import, object-literal or function-like node predicates yields no rename canonicalisation, no option reading and no fixture-parameter canonicalisation. The parser is the TARGET repository's (D-13), so its surface is not this runnable's to assume. The resolver degrades to the pre-D-18 behaviour for those shapes rather than throwing outside the exit-code contract.",
  "A TestInfo binding destructured in the callback's second parameter is not canonicalised: `test(\"a\", async ({ page }, { skip }) => skip());`. A binding pattern names no single identifier to rewrite, so there is no head segment to canonicalise.",
  "The import-rename and fixture-parameter canonicalisations are applied WITHOUT SCOPE ANALYSIS. A local binding that shadows a renamed import is canonicalised wherever it appears, and so is a name matching a fixture parameter. Deciding which declaration a name belongs to needs the binder this runnable deliberately does not ship (D-13).",
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
interface TsFunctionLikeExpression extends TsNode {
  readonly parameters: readonly TsParameterDeclaration[];
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
  // D-18 (2) and (3). Declared OPTIONAL for the SAME reason the three assertion predicates above
  // are: the parser is the TARGET repository's, not this kit's, and a module missing one of them
  // must degrade to "this shape is not canonicalised / not read" — a DISCLOSED residual — and never
  // to a thrown TypeError, which would leave the process outside the D-12 contract's { 0, 1, 2 }.
  // They are deliberately NOT added to loadTypeScriptFromTarget's unconditional validation list:
  // their absence costs two resolvable shapes, not the whole walk, so it must not become a loud
  // skip that puts the pass path out of reach.
  readonly isObjectLiteralExpression?: (n: TsNode) => n is TsObjectLiteralExpression;
  readonly isPropertyAssignment?: (n: TsNode) => n is TsPropertyAssignment;
  readonly isImportDeclaration?: (n: TsNode) => n is TsImportDeclaration;
  readonly isNamedImports?: (n: TsNode) => n is TsNamedImports;
  readonly isNamespaceImport?: (n: TsNode) => n is TsNamespaceImport;
  readonly isImportSpecifier?: (n: TsNode) => n is TsImportSpecifier;
  // D-20 (3), OPTIONAL for the same reason as everything above it: a parser missing them costs the
  // fixture-parameter canonicalisation — a DISCLOSED residual — and never a thrown TypeError.
  readonly isArrowFunction?: (n: TsNode) => n is TsFunctionLikeExpression;
  readonly isFunctionExpression?: (n: TsNode) => n is TsFunctionLikeExpression;
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
    // The predicates the walk calls UNCONDITIONALLY are validated here. A module missing one of
    // them cannot be walked, and a walk that throws mid-analysis would exit outside the D-12
    // contract; an unusable parser is a LOUD SKIP, exactly like an absent one. The three
    // type-assertion predicates are NOT in this list — they are optional and guarded at their call
    // site, because their absence costs one resolvable callee shape rather than the whole walk.
    if (
      typeof candidate.createSourceFile !== "function" ||
      typeof candidate.forEachChild !== "function" ||
      typeof candidate.getLineAndCharacterOfPosition !== "function" ||
      typeof candidate.isElementAccessExpression !== "function" ||
      typeof candidate.isStringLiteralLike !== "function"
    ) {
      return null;
    }
    return candidate as TsApi;
  } catch {
    return null; // fail-closed → loud skip, never a pass
  }
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
): boolean {
  const stage = probe(repoRoot);
  if (stage === null) return true;
  process.stderr.write(`${BROWSER_ABSENT_MARKER} (${BROWSER_ABSENT_STAGES[stage]})\n`);
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

  const walk = (absDir: string, relDir: string): void => {
    let entries: readonly DirEntry[];
    try {
      entries = readdirSync(absDir, { withFileTypes: true }) as unknown as readonly DirEntry[];
    } catch {
      refusals.push(
        `Cannot list the directory ${relDir === "" ? "." : relDir}; the spec set could not be derived, so no result is reported for it.`,
      );
      return;
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
        walk(abs, rel);
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
  };

  walk(resolvedRoot, "");
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
 * D-21 (1): this walk is FLAT — it never calls itself — so a loop counter really is one allowance
 * for one whole resolution here and needs no threaded budget. What it must NOT have is a second
 * spelling of the NUMBER, so it reads the one authority above.
 */
function calleeHeadIdentifier(ts: TsApi, expr: TsNode): TsIdentifier | null {
  let cur: TsNode = expr;
  for (let guard = 0; guard < CALLEE_CHAIN_STEP_BOUND; guard++) {
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
  return null;
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
export function calleeDottedPath(
  ts: TsApi,
  expr: TsNode,
  budget: CalleeStepBudget = newCalleeStepBudget(),
): string | null {
  const segments: string[] = [];
  let cur: TsNode = expr;
  // ONE SHARED BUDGET (D-21 (1)): one step per link, spent by this loop and by the recursive
  // descent below alike, so a pathological chain cannot spin AND cannot recurse past the allowance.
  for (; budget.left > 0; budget.left--) {
    if (ts.isIdentifier(cur)) {
      segments.push(cur.text);
      segments.reverse();
      return segments.join(".");
    }
    if (ts.isPropertyAccessExpression(cur)) {
      segments.push(cur.name.text);
      cur = cur.expression;
      continue;
    }
    if (ts.isCallExpression(cur)) {
      // D-21 (1): THE DESCENT IS ITSELF A LINK, and it is charged here rather than by the loop's own
      // update expression, which this branch never reaches. Without this decrement the budget would
      // be threaded and never spent on the one edge that can recurse — the exact shape WR-19 found.
      budget.left--;
      // D-18 (1). An inner path that does not resolve leaves the WHOLE path unresolved: a marker
      // over an unknown head would invent a segment the source text does not carry.
      const inner = calleeDottedPath(ts, cur.expression, budget);
      if (inner === null) return null;
      segments.push(`${inner}()`);
      segments.reverse();
      return segments.join(".");
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
  return null;
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
  const isObjectLiteral = ts.isObjectLiteralExpression;
  const isPropertyAssignment = ts.isPropertyAssignment;
  if (typeof isObjectLiteral !== "function" || typeof isPropertyAssignment !== "function") {
    return null;
  }
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
  // The same step limit the two resolvers use, read from its ONE authority (D-21 (1)). This walk is
  // FLAT — it never calls itself — so a loop counter is one allowance for one whole fold here.
  for (let guard = 0; guard < CALLEE_CHAIN_STEP_BOUND; guard++) {
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
export function deriveImportRenames(ts: TsApi, sf: TsSourceFile): ReadonlyMap<string, string> | null {
  const isImportDeclaration = ts.isImportDeclaration;
  const isNamedImports = ts.isNamedImports;
  const isNamespaceImport = ts.isNamespaceImport;
  const isImportSpecifier = ts.isImportSpecifier;
  if (
    typeof isImportDeclaration !== "function" ||
    typeof isNamedImports !== "function" ||
    typeof isNamespaceImport !== "function" ||
    typeof isImportSpecifier !== "function"
  ) {
    return null;
  }
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
 * D-20 (3): the source file's TestInfo FIXTURE-PARAMETER names — the local name bound to the
 * TestInfo fixture by the SECOND parameter of the function passed as the SECOND argument to a
 * `test(...)`-headed call.
 *
 * WHY THIS NEEDS NO TYPE CHECKER, WHICH IS THE SAME ARGUMENT D-18 (3) MAKES FOR
 * `ImportSpecifier.propertyName`. The binding is POSITIONAL, and the position is a literal already
 * present in the source text: Playwright hands the TestInfo fixture to the scenario body as its
 * second parameter, so `test("a", async ({ page }, testInfo) => …)` carries both the framework call
 * and the local name in one node. Nothing has to be followed to a declaration, and nothing is.
 *
 * THE HEAD IS CANONICALISED FIRST, so a renamed framework binding composes: `import { test as it }`
 * followed by `it("a", async ({ page }, info) => …)` contributes `info`, because the callee's own
 * path is asked as `test` before this derivation reads its arguments.
 *
 * A DESTRUCTURED SECOND PARAMETER CONTRIBUTES NOTHING, and that is a decision rather than an
 * oversight: a binding pattern names no single identifier to rewrite, so there is no head segment to
 * canonicalise. It is NAMED in UNRESOLVABLE_CALLEE_RESIDUALS with a reason true of it.
 *
 * Returns `null` when the parser does not expose the function-like predicates — the resolver then
 * degrades to the pre-D-20 behaviour for this one shape rather than throwing outside the D-12 exit
 * codes.
 */
export function deriveTestInfoParameterNames(
  ts: TsApi,
  sf: TsSourceFile,
  renames: ReadonlyMap<string, string> | null,
): ReadonlySet<string> | null {
  const isArrowFunction = ts.isArrowFunction;
  const isFunctionExpression = ts.isFunctionExpression;
  if (typeof isArrowFunction !== "function" || typeof isFunctionExpression !== "function") {
    return null;
  }
  const names = new Set<string>();
  const visit = (node: TsNode): void => {
    if (ts.isCallExpression(node)) {
      const callee = canonicaliseHeadSegment(calleeDottedPath(ts, node.expression), renames);
      if (callee === TEST_SCENARIO_PATH) {
        const body = node.arguments[1];
        if (body !== undefined && (isArrowFunction(body) || isFunctionExpression(body))) {
          const second = body.parameters[1];
          if (second !== undefined && ts.isIdentifier(second.name)) names.add(second.name.text);
        }
      }
    }
  };
  // D-21 (1): the one non-recursive walk. A deep spec must not cost interpreter stack here either.
  forEachDescendant(ts, sf, visit);
  return names;
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
  renames: ReadonlyMap<string, string> | null,
  fixtureParams: ReadonlySet<string> | null = null,
): string | null {
  if (dottedPath === null) return dottedPath;
  const segments = dottedPath.split(".");
  const imported = renames === null ? undefined : renames.get(segments[0]);
  if (imported !== undefined) {
    // PRECEDENCE, ASSERTED RATHER THAN LEFT TO READING ORDER (D-20 (3)). An import rename wins over
    // a fixture-parameter binding of the same name: the rename is a FILE-SCOPED declaration, while a
    // fixture parameter's real reach is one callback body and this derivation is deliberately not
    // scope-aware. Both spellings of a banned tail are refused either way; what the precedence
    // decides is which canonical path the finding NAMES.
    if (imported === IMPORT_NAMESPACE_MARKER) {
      // A namespace head is DROPPED: `pw.test.skip` is asked as `test.skip`. A bare `pw(...)` has no
      // segment left to ask about, so it passes through unchanged rather than becoming an empty path.
      if (segments.length < 2) return dottedPath;
      return segments.slice(1).join(".");
    }
    segments[0] = imported;
    return segments.join(".");
  }
  // D-20 (3): a TestInfo fixture-parameter binding is asked as the marked accessor form D-18 (1)
  // already decided, so `testInfo.skip` is asked as `test.info().skip`.
  if (fixtureParams !== null && fixtureParams.has(segments[0])) {
    segments[0] = TEST_INFO_CANONICAL_HEAD;
    return segments.join(".");
  }
  return dottedPath;
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
export function findBannedConstructs(ts: TsApi, sf: TsSourceFile, relPath: string): string[] {
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
  // D-20 (3): the fixture-parameter map is built ONCE PER SOURCE FILE too, and AFTER the rename map,
  // because a renamed framework binding must be canonicalised before its scenario calls are found.
  const fixtureParams = deriveTestInfoParameterNames(ts, sf, renames);

  const visit = (node: TsNode): void => {
    if (ts.isCallExpression(node)) {
      // ── arm (c): a banned modifier call ────────────────────────────────────────────────────
      // ONE normaliser, ONE authority. No callee shape is inspected here — every shape question
      // belongs to calleeDottedPath — and no membership is decided here either: the whole condition
      // is the question put to isBannedModifierCall. Two places that decide one question are two
      // places for the answers to disagree, which is how CR-06 happened, and asking a rule about a
      // shape nobody resolved is how CR-07 happened.
      const dottedPath = canonicaliseHeadSegment(
        calleeDottedPath(ts, node.expression),
        renames,
        fixtureParams,
      );
      if (isBannedModifierCall(dottedPath, chainEnabledOptionKeys(ts, node))) {
        const pos = node.getStart(sf);
        // D-20 (2): one finding per CHAIN. The key asks the same normaliser the arms ask; it decides
        // no membership of its own.
        const chainKey = `${pos}|${stripRoutingLinks(dottedPath)}`;
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
              `${relPath}:${lineOf(pos)}: banned modifier call — \`${dottedPath}\` decides which ` +
              `scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.`,
          });
        }
      }
      // ── arms (a) and (b): a caught or conditional assertion ─────────────────────────────────
      const head = calleeHeadIdentifier(ts, node.expression);
      if (head !== null && (head.text === "expect" || head.text === "assert")) {
        const headPos = head.getStart(sf);
        if (!reportedAssertionHeads.has(headPos)) {
          const context = bannedContextOf(ts, node, head.text === "expect");
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
    const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const diagnostics = (sf as unknown as ParsedSourceFile).parseDiagnostics;
    if (diagnostics !== undefined && diagnostics.length > 0) {
      errors.push(
        `The UAT spec ${rel} did not parse (${diagnostics.length} parse diagnostic(s)); a file that cannot be parsed cannot be checked, so no verdict is reported for it.`,
      );
      continue;
    }
    // D-21 (1): THE EXIT-CODE CONTRACT IS HELD BY DECISION, NOT BY THE INTERPRETER'S DEFAULT.
    // WR-19 measured a spec whose shape made the walk throw: nothing was caught, `reportMeasured`
    // was never reached, the two floors below were bypassed by construction, stdout stayed silent
    // and the process exited 1 — which the D-12 contract reads as "a finding, the gate blocks".
    // A spec this runnable cannot finish analysing is a COULD-NOT-RUN reason, exactly like an
    // unreadable or unparseable one: it does not increment `visited`, so the denominator floor
    // fires and the run says out loud that it covered less than it claims. The increment is placed
    // AFTER the analysis for that reason — a file counted before the work is a file that can be
    // counted as checked without having been.
    let specFindings: string[];
    try {
      specFindings = findBannedConstructs(ts, sf, rel);
    } catch (cause) {
      errors.push(
        `The UAT spec ${rel} could not be analysed (${cause instanceof Error ? cause.message : String(cause)}); the check was NOT performed for that file, so this run covers less than the derived set.`,
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

// ── the command line ───────────────────────────────────────────────────────────────────────────

const USAGE =
  "Usage: node uat-spec-integrity.js <repo-root> [--json] [--check-browser]\n";

export function main(argv: readonly string[]): number {
  const wantJson = argv.includes("--json");
  const checkBrowser = argv.includes("--check-browser");
  const rootArg = argv.find((a) => !a.startsWith("--"));

  const out = (s: string): void => {
    process.stdout.write(s);
  };
  const err = (s: string): void => {
    process.stderr.write(s);
  };

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
  if (checkBrowser && !emitLoudSkipIfBrowserUnusable(repoRoot)) return 2;

  const derived = deriveSpecPaths(repoRoot);
  if (derived.refusals.length > 0) {
    for (const r of derived.refusals) err(`${r}\n`);
    return 2;
  }

  // An empty derived set is decided by the SAME four-branch authority as every other outcome, and
  // it is decided BEFORE the parser is needed: there is nothing to parse.
  if (derived.relPaths.length === 0) {
    return reportMeasured({ visited: 0, expected: 0, findings: [] }, wantJson, out, err);
  }

  const ts = loadTypeScriptFromTarget(repoRoot);
  if (ts === null) {
    err(`${PARSER_ABSENT_MARKER}\n`);
    return 2;
  }

  const analysis = analyzeSpecs(repoRoot, derived.relPaths, ts);
  for (const e of analysis.errors) err(`${e}\n`);
  return reportMeasured(analysis, wantJson, out, err);
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

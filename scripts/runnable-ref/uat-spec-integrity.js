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
export const SKIPPED_DIRECTORIES = Object.freeze([
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
export const BANNED_MODIFIER_HEADS = Object.freeze(["test", "describe"]);
export const BANNED_MODIFIER_TAILS = Object.freeze([
    "skip",
    "only",
    "fixme",
    "fail",
]);
export const BANNED_EXACT_PATHS = Object.freeze(["expect.soft"]);
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
export function isBannedModifierPath(dottedPath) {
    if (dottedPath === null)
        return false;
    if (BANNED_EXACT_PATHS.includes(dottedPath))
        return true;
    const segments = dottedPath.split(".");
    // A single segment is a plain call, not a modifier call: `test(...)` is the thing the gate runs.
    if (segments.length < 2)
        return false;
    return (BANNED_MODIFIER_HEADS.includes(segments[0]) &&
        BANNED_MODIFIER_TAILS.includes(segments[segments.length - 1]));
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
export function isBannedModifierCall(dottedPath, enabledOptions) {
    if (isBannedModifierPath(dottedPath))
        return true;
    if (dottedPath === null || enabledOptions === null)
        return false;
    if (!Object.prototype.hasOwnProperty.call(BANNED_CONFIGURED_PATHS, dottedPath))
        return false;
    return enabledOptions.has(BANNED_CONFIGURED_PATHS[dottedPath]);
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
export const BANNED_CONFIGURED_PATHS = Object.freeze({
    "expect.configure": "soft",
});
/** The module specifier a rename must arrive through for D-18 (3) to canonicalise it. */
const PLAYWRIGHT_TEST_MODULE = "@playwright/test";
// The callee shapes the resolver CANNOT decide from the source text alone, exported as prose so the
// recipe quotes the disclosed boundary from the same source as the decided rule. Resolving any of
// them needs a type checker to follow a binding to its declaration or across a module, and this
// runnable deliberately ships no type checker (D-13): it resolves `typescript` from the TARGET
// repository at run time and uses it to PARSE, never to check types. Each shape is therefore NAMED
// here rather than left as a silence, and the test suite binds every one of them to a decline site
// it DERIVES from this file's own AST — in both directions, so a residual naming a site the
// resolver no longer has is caught the same way an undisclosed site is.
export const UNRESOLVABLE_CALLEE_RESIDUALS = Object.freeze([
    "An aliased binding is not refused: `const t = test;` then a modifier call on `t`. The alias cannot be followed to its declaration without a type checker.",
    "A member computed from a non-literal expression is not refused: `test[name](...)` where `name` is a variable. The member name is absent from the source text.",
    "A rename that arrives through any module other than `@playwright/test` is not canonicalised: `import { test as it } from \"./fixtures\";` then `it.skip(...)`. Following a re-export across files needs module resolution this runnable does not ship, so the rename map is MODULE-SCOPED to the framework's own import declaration.",
    "A callee whose head is not an identifier is not resolved: a call on an object literal, on a `this` expression or on any other non-identifier root. There is no head segment to read, so no membership question can be put.",
    "A callee chain longer than the resolver's 512-step bound is not resolved. The bound stops a pathological chain from spinning; it is a stated LIMIT rather than a silence, and a chain that reaches it yields no path at all rather than a truncated one.",
    "An option value that is not the `true` keyword literal is not read as enabling that option: `expect.configure({ soft: isCi })` where `isCi` is a variable. The value is absent from the source text, and this runnable evaluates nothing.",
    "A parser that does not expose the import or object-literal node predicates yields no rename canonicalisation and no option reading. The parser is the TARGET repository's (D-13), so its surface is not this runnable's to assume; the resolver degrades to the pre-D-18 behaviour for those two shapes rather than throwing outside the D-12 exit-code contract.",
]);
// D-13: the loud skip for an unresolvable parser. One frozen constant, ONE emission point, so a test
// can assert the emitted text byte-for-byte. It names `typescript` and states the honest outcome.
export const PARSER_ABSENT_MARKER = "SKIPPED: the target repository does not provide typescript — UAT specs NOT checked; the UAT status stays pending";
// D-15: the loud skip for an unusable browser lane. One marker, one frozen record of exactly two
// stage clauses, ONE emission point.
export const BROWSER_ABSENT_MARKER = "SKIPPED: no usable browser lane — UAT specs NOT exercised; the UAT status stays pending";
export const BROWSER_ABSENT_STAGES = Object.freeze({
    parser_package: "stage 1: @playwright/test could not be resolved from the target repository",
    browser_binaries: "stage 2: the Playwright command did not run, or its browsers directory is missing or empty",
});
// ── D-13: the parser, resolved from the TARGET ─────────────────────────────────────────────────
/**
 * Resolve the target repository's own `typescript`. Returns null when it cannot be resolved, or
 * when what resolves does not carry the surface this walk needs — a module that cannot parse is as
 * unusable as an absent one, and both are a loud skip rather than a crash.
 */
export function loadTypeScriptFromTarget(repoRoot) {
    try {
        const requireFromTarget = createRequire(join(repoRoot, "package.json"));
        const candidate = requireFromTarget("typescript");
        // The predicates the walk calls UNCONDITIONALLY are validated here. A module missing one of
        // them cannot be walked, and a walk that throws mid-analysis would exit outside the D-12
        // contract; an unusable parser is a LOUD SKIP, exactly like an absent one. The three
        // type-assertion predicates are NOT in this list — they are optional and guarded at their call
        // site, because their absence costs one resolvable callee shape rather than the whole walk.
        if (typeof candidate.createSourceFile !== "function" ||
            typeof candidate.forEachChild !== "function" ||
            typeof candidate.getLineAndCharacterOfPosition !== "function" ||
            typeof candidate.isElementAccessExpression !== "function" ||
            typeof candidate.isStringLiteralLike !== "function") {
            return null;
        }
        return candidate;
    }
    catch {
        return null; // fail-closed → loud skip, never a pass
    }
}
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
export function realBrowserProbe(repoRoot) {
    try {
        const requireFromTarget = createRequire(join(repoRoot, "package.json"));
        requireFromTarget.resolve("@playwright/test");
    }
    catch {
        return "parser_package";
    }
    try {
        const cli = spawnSync("npx", ["playwright", "--version"], {
            encoding: "utf8",
            input: "",
            timeout: 60_000,
        });
        if (cli.status !== 0 || cli.error != null)
            return "browser_binaries";
        const dir = playwrightBrowsersDirectory();
        if (dir === null || !existsSync(dir))
            return "browser_binaries";
        if (readdirSync(dir).length === 0)
            return "browser_binaries";
    }
    catch {
        return "browser_binaries"; // fail-closed
    }
    return null;
}
/** The documented Playwright browsers cache location, or null when it cannot be determined. */
function playwrightBrowsersDirectory() {
    const override = process.env.PLAYWRIGHT_BROWSERS_PATH;
    if (override !== undefined && override !== "" && isAbsolute(override))
        return override;
    const home = process.env.HOME ?? process.env.USERPROFILE;
    if (home === undefined || home === "")
        return null;
    if (process.platform === "darwin")
        return join(home, "Library", "Caches", "ms-playwright");
    if (process.platform === "win32")
        return join(home, "AppData", "Local", "ms-playwright");
    return join(home, ".cache", "ms-playwright");
}
/**
 * The SINGLE skip-decision and marker-emission point for the browser lane (the shape
 * scripts/e2e/uat-live.test.ts established). Returns true when the lane is usable. When it is not,
 * it writes BROWSER_ABSENT_MARKER plus the failing stage's clause to stderr and returns false.
 * The probe is injectable so a test can force either stage and assert the text byte-for-byte.
 */
export function emitLoudSkipIfBrowserUnusable(repoRoot, probe = realBrowserProbe) {
    const stage = probe(repoRoot);
    if (stage === null)
        return true;
    process.stderr.write(`${BROWSER_ABSENT_MARKER} (${BROWSER_ABSENT_STAGES[stage]})\n`);
    return false;
}
/**
 * Walk the repository root and collect every UAT spec. Containment (ASVS V12): the root is resolved
 * once and every collected path is asserted to remain under it. Symbolic links are resolved before
 * that assertion, so a link pointing outside the repository is REFUSED (exit 2) rather than silently
 * skipped or silently read. Linked directories are not descended into at all — a link cycle is not
 * a spec set.
 */
export function deriveSpecPaths(repoRoot) {
    const resolvedRoot = resolve(repoRoot);
    let realRoot;
    try {
        realRoot = realpathSync(resolvedRoot);
    }
    catch {
        realRoot = resolvedRoot;
    }
    const relPaths = [];
    const refusals = [];
    // TWO containment predicates, because there are two kinds of path here and comparing one against
    // the other's root is a false refusal. A path the walk BUILT is lexical, and belongs against the
    // lexically resolved root. A path realpathSync RETURNED has had every link expanded, and belongs
    // against the equally expanded root — on macOS, for example, a temp root under /var/... expands to
    // /private/var/..., so a link target compared against the unexpanded root would always "escape".
    const containedLexically = (candidate) => candidate === resolvedRoot || candidate.startsWith(resolvedRoot + sep);
    const containedReal = (candidate) => candidate === realRoot || candidate.startsWith(realRoot + sep);
    const walk = (absDir, relDir) => {
        let entries;
        try {
            entries = readdirSync(absDir, { withFileTypes: true });
        }
        catch {
            refusals.push(`Cannot list the directory ${relDir === "" ? "." : relDir}; the spec set could not be derived, so no result is reported for it.`);
            return;
        }
        for (const entry of entries) {
            const abs = join(absDir, entry.name);
            const rel = relDir === "" ? entry.name : `${relDir}/${entry.name}`;
            if (entry.isSymbolicLink()) {
                // Only a LINKED FILE that names a UAT spec is worth resolving; a linked directory is not
                // descended into (cycles), and a link out of the tree is a refusal, never a silent skip.
                if (!entry.name.endsWith(UAT_SPEC_GLOB_SUFFIX))
                    continue;
                try {
                    const target = realpathSync(abs);
                    if (!containedReal(target)) {
                        refusals.push(`The UAT spec ${rel} is a symbolic link that resolves outside the repository root; it was NOT read and the check was not performed for it.`);
                        continue;
                    }
                    if (statSync(target).isFile() && hasUatSegment(rel))
                        relPaths.push(rel);
                }
                catch {
                    refusals.push(`The UAT spec ${rel} is a symbolic link that could not be resolved; it was NOT read and the check was not performed for it.`);
                }
                continue;
            }
            if (entry.isDirectory()) {
                if (SKIPPED_DIRECTORIES.includes(entry.name))
                    continue;
                walk(abs, rel);
                continue;
            }
            if (!entry.isFile())
                continue;
            if (!entry.name.endsWith(UAT_SPEC_GLOB_SUFFIX))
                continue;
            if (!hasUatSegment(rel))
                continue;
            if (!containedLexically(resolve(abs))) {
                refusals.push(`The UAT spec ${rel} resolves outside the repository root; it was NOT read and the check was not performed for it.`);
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
function hasUatSegment(relPath) {
    const parts = relPath.split("/");
    // The last part is the file name, never the directory segment being looked for.
    return parts.slice(0, -1).includes("uat");
}
/**
 * Walk UP from an assertion call to its enclosing context. Returns the first banned context found,
 * or null. `allowConditional` is false for an `assert` call: D-14 names `expect`/`assert` for arm
 * (a) and names ONLY `expect` for arm (b), and this function does not widen either.
 */
function bannedContextOf(ts, call, allowConditional) {
    // An OPTIONAL CALL is a property of the call itself, not of an ancestor (arm b).
    if (allowConditional && ts.isCallExpression(call)) {
        const head = call.expression;
        if (call.questionDotToken !== undefined ||
            (ts.isPropertyAccessExpression(head) && head.questionDotToken !== undefined)) {
            return { arm: "b", where: "as an optional call" };
        }
    }
    let prev = call;
    let cur = call.parent;
    while (cur !== undefined) {
        if (ts.isTryStatement(cur)) {
            // Exactly the try block and the catch clause. A finally block is deliberately outside the
            // locked set — see the "deliberately outside the rule" note beside the modifier rule.
            if (prev === cur.tryBlock)
                return { arm: "a", where: "inside a try block" };
            if (cur.catchClause !== undefined && prev === cur.catchClause) {
                return { arm: "a", where: "inside a catch clause" };
            }
        }
        if (allowConditional) {
            if (ts.isIfStatement(cur)) {
                if (prev === cur.thenStatement)
                    return { arm: "b", where: "under an if statement" };
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
 * The three logical operators of arm (b), compared against ts.SyntaxKind MEMBERS. The numeric token
 * values are NOT stable across TypeScript versions and are never compared against here.
 */
function isLogicalOperator(ts, kind) {
    return (kind === ts.SyntaxKind.BarBarToken ||
        kind === ts.SyntaxKind.AmpersandAmpersandToken ||
        kind === ts.SyntaxKind.QuestionQuestionToken);
}
/**
 * The head identifier of a callee chain: `expect(x).toBe(y)` and `expect(x)` share ONE `expect`
 * identifier node, which is what lets the caller report a single finding per assertion instead of
 * one per link in the chain.
 */
function calleeHeadIdentifier(ts, expr) {
    let cur = expr;
    for (let guard = 0; guard < 512; guard++) {
        if (ts.isIdentifier(cur))
            return cur;
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
 * The shapes it still cannot resolve are named in UNRESOLVABLE_CALLEE_RESIDUALS, and the test suite
 * derives this function's decline sites from its own AST and binds each one to that register.
 */
export function calleeDottedPath(ts, expr) {
    const segments = [];
    let cur = expr;
    // The same step limit calleeHeadIdentifier uses: a pathological chain cannot spin.
    for (let guard = 0; guard < 512; guard++) {
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
            // D-18 (1). An inner path that does not resolve leaves the WHOLE path unresolved: a marker
            // over an unknown head would invent a segment the source text does not carry.
            const inner = calleeDottedPath(ts, cur.expression);
            if (inner === null)
                return null;
            segments.push(`${inner}()`);
            segments.reverse();
            return segments.join(".");
        }
        if (ts.isElementAccessExpression(cur)) {
            const arg = cur.argumentExpression;
            // A member computed from a non-literal expression is a documented residual, not a silence.
            if (!ts.isStringLiteralLike(arg))
                return null;
            segments.push(arg.text);
            cur = cur.expression;
            continue;
        }
        if (ts.isParenthesizedExpression(cur) || ts.isNonNullExpression(cur)) {
            cur = cur.expression;
            continue;
        }
        if (isTypeAssertionLike(ts, cur)) {
            cur = cur.expression;
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
export function enabledOptionKeys(ts, call) {
    if (!ts.isCallExpression(call))
        return null;
    const first = call.arguments[0];
    if (first === undefined)
        return null;
    const isObjectLiteral = ts.isObjectLiteralExpression;
    const isPropertyAssignment = ts.isPropertyAssignment;
    if (typeof isObjectLiteral !== "function" || typeof isPropertyAssignment !== "function") {
        return null;
    }
    if (!isObjectLiteral(first))
        return null;
    const keys = new Set();
    for (const property of first.properties) {
        if (!isPropertyAssignment(property))
            continue;
        if (property.initializer.kind !== ts.SyntaxKind.TrueKeyword)
            continue;
        const name = property.name;
        if (ts.isIdentifier(name)) {
            keys.add(name.text);
            continue;
        }
        if (ts.isStringLiteralLike(name))
            keys.add(name.text);
    }
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
export function deriveImportRenames(ts, sf) {
    const isImportDeclaration = ts.isImportDeclaration;
    const isNamedImports = ts.isNamedImports;
    const isImportSpecifier = ts.isImportSpecifier;
    if (typeof isImportDeclaration !== "function" ||
        typeof isNamedImports !== "function" ||
        typeof isImportSpecifier !== "function") {
        return null;
    }
    const renames = new Map();
    ts.forEachChild(sf, (node) => {
        if (!isImportDeclaration(node))
            return;
        if (!ts.isStringLiteralLike(node.moduleSpecifier))
            return;
        if (node.moduleSpecifier.text !== PLAYWRIGHT_TEST_MODULE)
            return;
        const clause = node.importClause;
        if (clause === undefined)
            return;
        const named = clause.namedBindings;
        if (named === undefined || !isNamedImports(named))
            return;
        for (const element of named.elements) {
            if (!isImportSpecifier(element))
                continue;
            if (element.propertyName === undefined)
                continue;
            renames.set(element.name.text, element.propertyName.text);
        }
    });
    return renames;
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
export function canonicaliseHeadSegment(dottedPath, renames) {
    if (dottedPath === null || renames === null)
        return dottedPath;
    const segments = dottedPath.split(".");
    const imported = renames.get(segments[0]);
    if (imported === undefined)
        return dottedPath;
    segments[0] = imported;
    return segments.join(".");
}
/** The three assertion node kinds, each guarded because the target's parser may predate it. */
function isTypeAssertionLike(ts, node) {
    const predicates = [ts.isAsExpression, ts.isTypeAssertionExpression, ts.isSatisfiesExpression];
    for (const predicate of predicates) {
        if (typeof predicate === "function" && predicate(node))
            return true;
    }
    return false;
}
/** Every finding in one spec, in source order, as the union of all three arms. */
export function findBannedConstructs(ts, sf, relPath) {
    const findings = [];
    // Arms (a) and (b) are keyed on the HEAD IDENTIFIER's position so a chained assertion reports
    // once. Arm (c) matches a single call shape and needs no such key.
    const reportedAssertionHeads = new Set();
    const lineOf = (pos) => ts.getLineAndCharacterOfPosition(sf, pos).line + 1;
    // D-18 (3): the rename map is built ONCE PER SOURCE FILE, before the walk, and applied between
    // shape resolution and membership. Per-file is the correct scope because an import declaration's
    // reach is the file it sits in.
    const renames = deriveImportRenames(ts, sf);
    const visit = (node) => {
        if (ts.isCallExpression(node)) {
            // ── arm (c): a banned modifier call ────────────────────────────────────────────────────
            // ONE normaliser, ONE authority. No callee shape is inspected here — every shape question
            // belongs to calleeDottedPath — and no membership is decided here either: the whole condition
            // is the question put to isBannedModifierCall. Two places that decide one question are two
            // places for the answers to disagree, which is how CR-06 happened, and asking a rule about a
            // shape nobody resolved is how CR-07 happened.
            const dottedPath = canonicaliseHeadSegment(calleeDottedPath(ts, node.expression), renames);
            if (isBannedModifierCall(dottedPath, enabledOptionKeys(ts, node))) {
                const pos = node.getStart(sf);
                // ONE emission point, and ONE sentence true of the WHOLE banned family. It used to say the
                // call "removes the scenario", which was true of `skip`/`only`/`fixme` and FALSE of the
                // inverting `fail` that D-17 added: `fail` runs the scenario and reports a failing
                // assertion as a pass. A finding that misstates what the construct does to the evidence is
                // the claim-broader-than-the-mechanism defect this whole file exists to avoid, so the
                // sentence names both harms rather than branching into a second emission point.
                findings.push({
                    pos,
                    text: `${relPath}:${lineOf(pos)}: banned modifier call — \`${dottedPath}\` decides which ` +
                        `scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.`,
                });
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
                            text: context.arm === "a"
                                ? `${relPath}:${lineOf(headPos)}: caught assertion — the \`${head.text}\` call sits ${context.where}, ` +
                                    `so a failure would be swallowed and the evidence would not show it.`
                                : `${relPath}:${lineOf(headPos)}: conditional assertion — the \`${head.text}\` call is reached ${context.where}, ` +
                                    `so it may not run at all and a green result would not prove the scenario.`,
                        });
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    ts.forEachChild(sf, visit);
    findings.sort((x, y) => x.pos - y.pos);
    return findings.map((f) => f.text);
}
function defaultReadFile(absPath) {
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
export function analyzeSpecs(repoRoot, specRelPaths, ts, readFile = defaultReadFile) {
    const expected = specRelPaths.length;
    const findings = [];
    const errors = [];
    let visited = 0;
    for (const rel of specRelPaths) {
        let text;
        try {
            text = readFile(join(repoRoot, rel));
        }
        catch {
            errors.push(`Cannot read the UAT spec ${rel}; the check was NOT performed for that file, so this run covers less than the derived set.`);
            continue;
        }
        const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const diagnostics = sf.parseDiagnostics;
        if (diagnostics !== undefined && diagnostics.length > 0) {
            errors.push(`The UAT spec ${rel} did not parse (${diagnostics.length} parse diagnostic(s)); a file that cannot be parsed cannot be checked, so no verdict is reported for it.`);
            continue;
        }
        visited++; // THE ONE increment site: it runs only when a file was really read and parsed.
        findings.push(...findBannedConstructs(ts, sf, rel));
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
export function reportMeasured(m, wantJson, out, err) {
    // (1) VACUITY FLOOR — element level. A zero-element run can never print a pass line.
    if (m.visited === 0) {
        err(`UAT spec integrity: ZERO uat specs were visited (${m.expected} derived) — this check was NOT ` +
            `performed. A pass line here would state a check that did not run.\n`);
        return 2;
    }
    // (2) DENOMINATOR FLOOR — collection level. A short scan set is a silently narrowed check.
    if (m.visited !== m.expected) {
        err(`UAT spec integrity: visited ${m.visited} of ${m.expected} derived uat specs — the scan set is ` +
            `short, so the result covers less than it claims.\n`);
        return 2;
    }
    // (3) FINDINGS — reported over the visited total, never bare.
    if (m.findings.length > 0) {
        if (wantJson) {
            out(`${JSON.stringify({ ok: false, findings: m.findings })}\n`);
        }
        else {
            out(`UAT spec integrity: ${m.findings.length} finding(s) over ${m.visited}/${m.expected} uat specs checked\n`);
            for (const f of m.findings)
                out(`${f}\n`);
        }
        return 1;
    }
    // (4) The PASS line CARRIES THE MEASUREMENT — never a bare assertion.
    if (wantJson) {
        out(`${JSON.stringify({ ok: true, findings: [] })}\n`);
    }
    else {
        out(`UAT spec integrity: 0 findings over ${m.visited}/${m.expected} uat specs checked\n`);
    }
    return 0;
}
// ── the command line ───────────────────────────────────────────────────────────────────────────
const USAGE = "Usage: node uat-spec-integrity.js <repo-root> [--json] [--check-browser]\n";
export function main(argv) {
    const wantJson = argv.includes("--json");
    const checkBrowser = argv.includes("--check-browser");
    const rootArg = argv.find((a) => !a.startsWith("--"));
    const out = (s) => {
        process.stdout.write(s);
    };
    const err = (s) => {
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
    }
    catch {
        rootIsDirectory = false;
    }
    if (!rootIsDirectory) {
        err(`Error: the repository root is not a readable directory: ${repoRoot}\n`);
        return 2;
    }
    // D-15 first when asked: if the lane cannot run the specs, saying anything about their contents
    // would invite the reader to treat a checked spec as an exercised one.
    if (checkBrowser && !emitLoudSkipIfBrowserUnusable(repoRoot))
        return 2;
    const derived = deriveSpecPaths(repoRoot);
    if (derived.refusals.length > 0) {
        for (const r of derived.refusals)
            err(`${r}\n`);
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
    for (const e of analysis.errors)
        err(`${e}\n`);
    return reportMeasured(analysis, wantJson, out, err);
}
/**
 * Is this module the process entry point? FAIL TOWARDS RUNNING: an inconclusive answer runs main(),
 * because failing to run when invoked as a CLI would exit 0 with no output — a fabricated green,
 * the one outcome this file exists to prevent. Being imported by a test is the only case that
 * suppresses the run, and that case is decided positively (a different resolved entry path).
 */
function invokedAsScript() {
    const entry = process.argv[1];
    if (entry === undefined || entry === "")
        return true;
    try {
        return realpathSync(resolve(entry)) === realpathSync(import.meta.filename);
    }
    catch {
        return true;
    }
}
if (invokedAsScript()) {
    process.exit(main(process.argv.slice(2)));
}

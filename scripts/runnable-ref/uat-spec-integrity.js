// uat-spec-integrity.ts — the UAT spec-integrity checker, a kit-shipped runnable (D-13).
//
// This is the mechanical half of UATX-06: the constructs a UAT spec may not contain are decided
// over the TypeScript AST, never by regex. A Playwright spec is full of selectors, comments and
// string literals that read like assertions; a textual matcher would refuse those and would let the
// recipe's prose claim more than the checker actually decides. The claim matches the mechanism
// because BANNED_CONSTRUCTS below is the ONE set the recipe quotes.
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
// D-14 arm (c): the banned member calls, as ONE frozen exported constant of DOTTED PATHS. The
// browser-UAT recipe QUOTES this set, so the documented claim and the decided set have a single
// source.
//
// WHY NINE MEMBERS RATHER THAN D-14'S SIX (31-06, closing gap 2 of 31-VERIFICATION.md). D-14
// enumerated `test.skip`, `test.fixme`, `test.only`, `describe.skip`, `describe.only`,
// `expect.soft`, and the matcher took that enumeration literally as an object/member PAIR — a BARE
// `describe.only(...)`. `@playwright/test` exports no top-level `describe`. The only spellings
// Playwright can produce are `test.describe.only(...)` and its two siblings, so the arm matched a
// callee shape the package never emits: a spec carrying all three reported ZERO findings and exited
// 0, narrowing an entire gate run to one describe block undetected.
//
// The set below is the UNION of D-14's six and the three real spellings. Nothing D-14 named stops
// being banned: the two bare-describe names are RETAINED, because D-14 names them and because
// another framework's bare `describe` can be imported into a spec file. The round only ADDS the
// spellings the matcher could not see.
//
// DELIBERATELY OUT OF THE SET, and why it is written down here rather than left to be rediscovered:
//   - a promise `.catch()` handler — an assertion inside one is not refused;
//   - a finally block — D-14 names the try block and the catch clause, and names no third region;
//   - a spec body containing zero `expect` calls — vacuous evidence, explicitly deferred;
//   - the two callee shapes named in UNRESOLVABLE_CALLEE_RESIDUALS below.
// These are DEFERRED, not overlooked. Widening a parser quietly is the failure mode a prior phase
// closed by defining a canonical form instead of adding one more spelling. A red-team finding on any
// of them is a NEW DECISION and a gap-closure round, never a quiet edit here.
export const BANNED_CONSTRUCTS = Object.freeze([
    "test.skip",
    "test.fixme",
    "test.only",
    "test.describe.skip",
    "test.describe.only",
    "test.describe.fixme",
    "describe.skip",
    "describe.only",
    "expect.soft",
]);
// The callee shapes calleeDottedPath CANNOT resolve, exported as prose so the recipe quotes the
// disclosed boundary from the same source as the decided set. Resolving either one needs a type
// checker to follow a binding to its declaration, and this runnable deliberately ships no type
// checker (D-13): it resolves `typescript` from the TARGET repository at run time and uses it to
// PARSE, never to check types. Both shapes are therefore NAMED here rather than left as a silence.
export const UNRESOLVABLE_CALLEE_RESIDUALS = Object.freeze([
    "An aliased binding — `const t = test;` followed by a modifier call on `t` — is not refused; the alias cannot be followed to its declaration without a type checker.",
    "A member access computed from a non-literal expression — `test[name](...)` where `name` is a variable — is not refused; the member name is not present in the source text.",
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
            // locked set — see the note beside BANNED_CONSTRUCTS.
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
 * A CallExpression link deliberately does NOT resolve: `expect(x).soft` is not `expect.soft`, and
 * treating it as such would refuse a legitimate chained assertion.
 *
 * The two shapes it cannot resolve are named in UNRESOLVABLE_CALLEE_RESIDUALS.
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
    const visit = (node) => {
        if (ts.isCallExpression(node)) {
            // ── arm (c): a banned modifier call ────────────────────────────────────────────────────
            // ONE normaliser, ONE comparison. No callee shape is inspected here: every shape question
            // belongs to calleeDottedPath, so the two can never answer differently.
            const dottedPath = calleeDottedPath(ts, node.expression);
            if (dottedPath !== null && BANNED_CONSTRUCTS.includes(dottedPath)) {
                const pos = node.getStart(sf);
                findings.push({
                    pos,
                    text: `${relPath}:${lineOf(pos)}: banned modifier call — \`${dottedPath}\` removes the ` +
                        `scenario from the evidence the quality gate re-runs, so a green lane would certify a scenario nobody exercised.`,
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

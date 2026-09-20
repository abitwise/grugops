// check-build-parity.ts — the WORKING TREE does not move when the build runs (plan 32.1-05, D-06;
// the exemption half of round-4 finding F-21, .planning/WINDOWS.md row 207).
//
// It asserts that running the build leaves every TRACKED build output byte-identical to what the
// index already carries. A `.js` that moves is a committed build output that is not a build of the
// `.ts` committed beside it, which is the exact guarantee CLAUDE.md's tech-stack section gives as
// the whole reason the tooling layer ships as committed `.js`.
//
//   node scripts/check-build-parity.js
// Exit 0 = no tracked build output moved when the build ran; exit 1 = at least one moved, or the
// build did not complete.
//
// =================================================================================================
// WHY THIS IS ITS OWN CHECK, AND THE ONE HOME IT WAS EVICTED FROM
// =================================================================================================
//
// It was an INLINE `package.json` COMMAND. The manifest entry read
//
//     npm run build && git diff --exit-code --name-only -- '*.js' && echo '…' || node -e "…"
//
// — a nested `npm run`, a `git` invocation, a shell `echo`, an `||` arm and a `node -e` carrying the
// failure sentence as a JavaScript string. Two things followed from that shape, and neither was a
// style complaint.
//
// FIRST, IT WAS THE ONE CHECK THE DECLARED COMMAND SHAPE COULD NOT ADMIT. Every other `check:*`
// entry is `tsc --outDir .tmp-build && node scripts/<x>.js`, and the derivation in
// `scripts/check-foundation-guards.test.ts` that proves every check module is REACHED reads a module
// path out of each command. This entry named no module, so it had to be carried as a recorded
// TOOLCHAIN exemption — a class with exactly one member whose whole content was "this one is
// different". A declared shape with one named exception is a declared shape that has already
// started widening.
//
// SECOND, ITS FAILURE MESSAGE WAS UNREACHABLE TO EVERY READER. The remedy an operator needs was a
// string inside a `node -e` argument inside a JSON string inside a shell command: not greppable as
// prose, not reviewable as code, and impossible to test. The sentence below is ordinary source.
//
// WHAT IT DOES NOT DO, NAMED RATHER THAN IMPLIED. It is not the freshness gate. `npm run freshness`
// holds that the `.js` committed AT HEAD is a build of the `.ts` committed beside it; its subject is
// HEAD, and no run of this check can repair it. This check's subject is THIS CHECKOUT: it says that
// a build performed right now moves nothing. The two are not interchangeable and each is the other's
// blind spot.
//
// Strictly READ-ONLY with respect to the repository's tracked CONTENT: it runs the build, which is
// the one thing here that writes, and then asks git a question. Node standard library only — one
// compiler launch (`typescript/lib/tsc.js` under `process.execPath`, see `buildParity`) and two `git`
// invocations. Zero npm dependencies at run time.
//
// Findings are written in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a quality and
// trace surface, never caveman voice).
// =================================================================================================
import { spawnSync, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { reportMeasured } from "./vacuity.js";
// THE TRUTHINESS TERNARY, NOT `??`. `??` treats an EMPTY `CHECK_ROOT` as a supplied value, so
// `join("", …)` would resolve against the process cwd — the defect `check-residual-citations.ts`
// records at its own `:37-44` after a guard caught it there. The idiom is uniform on purpose.
const ROOT = process.env.CHECK_ROOT ? process.env.CHECK_ROOT : join(import.meta.dirname, "..");
/** The remedy an operator needs, spelled once, as prose rather than as a `node -e` argument. */
export const BUILD_PARITY_REMEDY = "Remedy: run `npm run build` and commit the result, so the committed .js is a build of its .ts.";
function git(root, args) {
    return execFileSync("git", [...args], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    });
}
function lines(out) {
    return out
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .sort();
}
/**
 * Every TRACKED build output, repo-relative and sorted.
 *
 * The pathspec is `*.js` and the bare `*` is deliberate: git's default pathspec matching has no
 * `WM_PATHNAME`, so one `*` crosses `/` and the whole tree is selected. This is the same set the
 * inline command asked about, moved rather than reinterpreted.
 */
export function trackedBuildOutputs(root = ROOT) {
    return lines(git(root, ["ls-files", "--", "*.js"]));
}
/**
 * Every tracked build output the working tree currently disagrees with the index about.
 *
 * THE ORDERING DEPENDENCY, RECORDED RATHER THAN IMPLIED (32.1-14, review IN-02). `git diff` cannot
 * see an UNTRACKED file, so a `.js` the build produces for a new `.ts` that has no committed twin is
 * invisible to this derivation — the subject set is "tracked build outputs that MOVED", and a build
 * output that never existed in the index did not move, it appeared. `.github/workflows/ci.yml`
 * records this exact class letting an untracked adapter through once, which is why that workflow
 * replaced a `git diff --exit-code` with a `git status --porcelain` pair at the point it names.
 *
 * ON THIS TREE THE CASE IS STILL CAUGHT, BUT NOT BY THIS GATE: the second freshness block runs after
 * the build and its working-tree arm sees the file on disk. So this gate's PASS line is CORRECT and
 * ORDERING-DEPENDENT, and a later reader who reorders the workflow, or who runs this check alone on
 * a developer machine, is the one who needs to know that. Changing the derivation to
 * `git status --porcelain` would widen what this gate's subject set CONTAINS, which is a decision
 * about the gate rather than a defect in it; it is carried as a register row with the gate as its
 * owner rather than made here.
 */
export function movedBuildOutputs(root = ROOT) {
    return lines(git(root, ["diff", "--name-only", "--", "*.js"]));
}
/**
 * Run the build, then ask git whether any tracked build output moved.
 *
 * FAIL-CLOSED ON THE BUILD, for the reason `scripts/freshness.ts:236-246` states for its own
 * rebuild: a build that did not complete means this check states NOTHING about the build outputs,
 * and the honest report of that is a named failure rather than a clean diff over a build that never
 * ran.
 */
export function buildParity(root = ROOT) {
    const tracked = trackedBuildOutputs(root);
    const nothingStated = (buildFailure) => ({
        buildFailure,
        measured: { label: "Build parity", visited: 0, expected: tracked.length, findings: [] },
    });
    // THE COMPILER IS LAUNCHED AS A NODE SCRIPT, NEVER THROUGH THE `npx` SHIM (plan 33-19, CAP-02) — the
    // identical launch `scripts/freshness.ts` has used since plan 33-06, and for the same reason: on
    // Windows `npx` is `npx.cmd`, which a shell-less `spawnSync` cannot start, so the child never runs,
    // `status` is null and `error` is set. The compiler's own entry (`typescript/lib/tsc.js`, what
    // `bin/tsc` requires) is resolved through this module's require chain and run by the node that is
    // running this check: no shim, no shell, no host branch — one launch on every platform. An entry
    // that cannot be resolved is a refusal that names THAT layer, distinct from a compile that ran and
    // refused, and distinct from a launch that produced no child. No `--outDir`: this gate rebuilds IN
    // PLACE by design (tsconfig's `outDir` is `./`), because its subject is whether the tracked outputs
    // MOVE when the build runs.
    let tscEntry;
    try {
        tscEntry = createRequire(import.meta.url).resolve("typescript/lib/tsc.js");
    }
    catch (e) {
        return nothingStated("the compiler could not be located from this checkout " +
            `(${e instanceof Error ? e.message : String(e)}), so this check states nothing about the build outputs`);
    }
    const build = spawnSync(process.execPath, [tscEntry], { cwd: root, encoding: "utf8" });
    if (build.error !== undefined || build.status !== 0) {
        // THE SPAWN'S OWN ERROR IS PART OF THE DETAIL (32.1-14, review IN-01). `spawnSync` reports two
        // different failures through two different fields, and only one of them was being read. A
        // compiler that RAN and refused fills `stdout`/`stderr`; a compiler that never started fills
        // neither and sets `error` instead, leaving `status` null. The recorded case was `npx` resolving
        // as `npx.cmd` on Windows — no longer reachable from this module, which is the reason the launch
        // above moved off the shim (plan 33-19); the case that remains is a node that cannot be spawned.
        // The `!== 0` test correctly failed closed on that, and then told the operator "the build did not
        // complete" and nothing else. Appended rather than substituted, because a failure can legitimately
        // carry both.
        const detail = [`${build.stdout ?? ""}${build.stderr ?? ""}`.trim(), build.error?.message ?? ""]
            .filter((part) => part !== "")
            .join("\n")
            .trim();
        return nothingStated("the build did not complete, so this check states nothing about the build outputs" +
            (detail === "" ? "" : `:\n${detail}`));
    }
    const moved = new Set(movedBuildOutputs(root));
    const findings = [];
    let visited = 0;
    for (const rel of tracked) {
        visited += 1;
        if (moved.has(rel))
            findings.push(rel);
    }
    return {
        buildFailure: null,
        measured: {
            // The label carries the subject; `reportMeasured` appends the counts, so the PASS line is a
            // MEASUREMENT (how many outputs were examined, how many moved) rather than a sentence.
            label: "Build parity: tracked build outputs that moved when the build ran",
            visited,
            // DERIVED ON THE OTHER SIDE OF THE LOOP that produces `visited`, so a loop that never ran
            // reports zero against a non-zero denominator instead of agreeing with itself.
            expected: tracked.length,
            findings,
        },
    };
}
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) {
    const result = buildParity();
    if (result.buildFailure !== null) {
        console.error(`  FAIL  ${result.buildFailure}`);
        console.error(`        ${BUILD_PARITY_REMEDY}`);
        console.error("\n== Result ==\n1 CHECK(S) FAILED");
        process.exit(1);
    }
    const fails = reportMeasured(result.measured, {
        pass: (s) => console.log(`  PASS  ${s}`),
        fail: (s) => console.error(`  FAIL  ${s}`),
    }, (rel) => `    ${rel} moved when the build ran — the committed build output is not a build of the ` +
        "source committed beside it");
    if (fails > 0) {
        console.error(`        ${BUILD_PARITY_REMEDY}`);
        console.error(`\n== Result ==\n${fails} CHECK(S) FAILED`);
        process.exit(1);
    }
    console.log("\n== Result ==\nALL CHECKS PASSED");
    process.exit(0);
}

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
// `npx tsc` invocation and two `git` invocations. Zero npm dependencies at run time.
//
// Findings are written in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a quality and
// trace surface, never caveman voice).
// =================================================================================================
import { spawnSync, execFileSync } from "node:child_process";
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
/** Every tracked build output the working tree currently disagrees with the index about. */
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
    const build = spawnSync("npx", ["tsc"], { cwd: root, encoding: "utf8" });
    if (build.status !== 0) {
        const detail = `${build.stdout ?? ""}${build.stderr ?? ""}`.trim();
        return {
            buildFailure: "the build did not complete, so this check states nothing about the build outputs" +
                (detail === "" ? "" : `:\n${detail}`),
            measured: {
                label: "Build parity",
                visited: 0,
                expected: tracked.length,
                findings: [],
            },
        };
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

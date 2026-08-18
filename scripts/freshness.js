// freshness.ts — grugops build-output drift gate (D-02; its SUBJECT moved to HEAD under D-57).
//
// grugops compiles its TypeScript tooling with `tsc` and commits BOTH the .ts source and the emitted
// .js, so host machines and CI run the committed .js with bare Node and never build. That trade only
// holds if the committed .js is always a build of the committed .ts. This gate holds it.
//
//   node scripts/freshness.js     # exit 0 = every .js committed at HEAD matches a rebuild
//                                 # exit 1 = drift, an unresolved set difference, or a refusal
//
// Node stdlib ONLY — node:fs, node:path, node:os, node:child_process for `git`. Zero npm
// dependencies; runs with bare Node. import.meta.dirname (stable at the Node 22+ floor) resolves the
// repository root from this script's location.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// build-safety surface, never caveman voice).
//
// ---------------------------------------------------------------------------------------------
// WHY THE SUBJECT IS HEAD AND NOT THE WORKING TREE (D-57).
//
// tsconfig.json sets "outDir" and "rootDir" to "./", so `npm run build` writes tsc's output OVER the
// tracked, committed .js files in the working tree. This gate used to read the committed side from
// the working tree. .github/workflows/ci.yml ran the build before every freshness check, so the gate
// compared a rebuild against a rebuild and reported "fresh" for a tree whose committed .js had been
// hand-edited or never rebuilt. It could not fail. Round 7 of Phase 29 then used that same ordering
// as its build-parity evidence, and the same command appears in the automated verification of every
// plan in the phase — so the defect was load-bearing for a great deal of other reporting.
//
// The repair is ordering-independent by construction rather than by step order: the committed side is
// read with `git show HEAD:<path>` and the compared set is derived from `git ls-tree -r HEAD`. A
// build step running earlier in the same job rewrites the working tree, which is not this gate's
// subject, so it has nothing to repair. The workflow reorder and the working-tree parity script are a
// SECOND, independent mechanism — not the reason this gate works.
//
// ---------------------------------------------------------------------------------------------
// THE CASE TABLE — every branch this gate can reach, its verdict, and what "closed" means for it.
//
//   1. STALE COMMITTED OUTPUT   The .js at HEAD differs from a rebuild of the sources, and its source
//                               is unchanged in the working tree. This is the load-bearing arm and
//                               the only one a clean checkout ever takes. Remedy: `npm run build`,
//                               then commit the result.
//   2. STALE WORKING OUTPUT     The source is modified or untracked in the working tree, so a rebuild
//                               is a rebuild of THAT source and not of HEAD's. Comparing it against
//                               HEAD's output would name a cause that is not there, so the WORKING
//                               .js is compared instead. Remedy: `npm run build` before committing.
//   3. ORPHANED COMMITTED       A path committed at HEAD that a rebuild does not emit. Remedy: delete
//      OUTPUT                   it, or restore the .ts that emits it.
//   4. UNCOMMITTED BUILD        A .js on disk under an output directory that HEAD does not carry.
//      OUTPUT                   Remedy: commit it, or remove it.
//   5. DELETED COMMITTED        A path committed at HEAD that is absent from the working tree.
//      OUTPUT                   Remedy: restore it, or commit the deletion.
//   6. REFUSAL                  git cannot answer — no repository, this root is not the repository
//                               root, no HEAD, or a path `git ls-tree` listed that `git show` cannot
//                               produce. The gate reports the refusal and states nothing else.
//
// Cases 1 and 2 are the two arms of ONE predicate. The arm is selected from ONE derived set in ONE
// place, and the two arm counts are asserted to sum to the compared total; a sum that does not hold
// is itself a refusal, because it means the arm selection lost a path.
//
// FAIL-CLOSED, AND CHECKABLE AS SUCH (D-02 / D-10 stale-artifact mitigation). A rebuild that does not
// compile cleanly never reports fresh, as before. Beyond that, the word "fresh" appears in exactly
// ONE line this module can print — the success line — so any non-zero run's stdout carries ZERO
// case-insensitive occurrences of it. scripts/freshness.test.ts asserts that absence on every failing
// case. A fail-closed gate that still prints a green-sounding line is the fabricated green this
// repository has already paid for once.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readdirSync, readFileSync, existsSync, } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
// Repo root = this script's parent's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");
// The directories whose committed .js outputs are build artifacts of committed .ts sources. Mirrors
// the tsconfig "include" set (install/scripts/hooks).
const OUTPUT_DIRS = ["install", "scripts", "hooks"];
// An explicit ceiling for every `git` read, rather than Node's 1 MiB default. The largest committed
// output on this tree is roughly 0.26 MiB; the ceiling is reported beside that measured size on every
// successful run so a reader can check the margin instead of trusting this comment. Exceeding it
// makes spawnSync set `error`, which this module turns into a refusal — so the ceiling fails closed.
const GIT_MAX_BUFFER = 64 * 1024 * 1024;
// The ONE line that carries the word "fresh". See the fail-closed note in the header.
const FRESH_LINE_PREFIX = "All build outputs fresh:";
const toPosix = (p) => p.split(sep).join("/");
function git(args) {
    const r = spawnSync("git", args, { cwd: ROOT, maxBuffer: GIT_MAX_BUFFER });
    if (r.error) {
        return { ok: false, reason: `\`git ${args.join(" ")}\` could not be run: ${r.error.message}` };
    }
    if (r.status !== 0) {
        const err = (r.stderr ?? Buffer.alloc(0)).toString("utf8").trim();
        return { ok: false, reason: `\`git ${args.join(" ")}\` exited ${r.status}${err ? `: ${err}` : ""}` };
    }
    return { ok: true, stdout: r.stdout ?? Buffer.alloc(0) };
}
function refuse(reason) {
    console.log(`REFUSED: ${reason}`);
    console.log("BUILD-OUTPUT CHECK FAILED: the committed side could not be established from git, so this gate states nothing about the build outputs.");
    process.exit(1);
}
// ── The committed side, derived from git BEFORE anything is built. Deriving first means a repository
//    problem is reported without spending a rebuild, and it means the refusal path never depends on a
//    toolchain being present. ───────────────────────────────────────────────────────────────────
const gitDir = git(["rev-parse", "--git-dir"]);
if (!gitDir.ok)
    refuse(`this root is not inside a git repository. ${gitDir.reason}`);
// The gate walks the filesystem from ROOT and asks git about paths relative to the repository root.
// Those two agree only when ROOT *is* the repository root. `--show-prefix` states that exactly, with
// no path-string comparison and no realpath ambiguity: it is empty at the root and non-empty below.
const prefix = git(["rev-parse", "--show-prefix"]);
if (!prefix.ok)
    refuse(`the repository root could not be located. ${prefix.reason}`);
const prefixText = prefix.stdout.toString("utf8").trim();
if (prefixText !== "") {
    refuse(`this root sits at \`${prefixText}\` inside a different git repository, so paths derived from git would not be the paths this gate walks.`);
}
const headRev = git(["rev-parse", "HEAD"]);
if (!headRev.ok)
    refuse(`HEAD could not be resolved. ${headRev.reason}`);
const HEAD_SHA = headRev.stdout.toString("utf8").trim();
// The compared set. Derived, never listed. `-l` is asked for in the SAME invocation that derives the
// set, so the largest committed output's byte size is a property of the set under test rather than a
// second measurement of a possibly different set.
const lsTree = git(["ls-tree", "-r", "-l", "HEAD", "--full-name", "-z", "--", ...OUTPUT_DIRS]);
if (!lsTree.ok)
    refuse(`the committed output set could not be derived. ${lsTree.reason}`);
const headSet = new Set();
let largestCommitted = 0;
for (const record of lsTree.stdout.toString("utf8").split("\0")) {
    if (record === "")
        continue;
    const tab = record.indexOf("\t");
    if (tab < 0)
        refuse(`\`git ls-tree -l\` produced a record this gate cannot parse: ${record}`);
    const path = record.slice(tab + 1);
    if (!path.endsWith(".js"))
        continue;
    headSet.add(path);
    const size = Number(record.slice(0, tab).trim().split(/\s+/)[3]);
    if (!Number.isFinite(size))
        refuse(`\`git ls-tree -l\` gave no readable size for ${path}.`);
    if (size > largestCommitted)
        largestCommitted = size;
}
if (largestCommitted >= GIT_MAX_BUFFER) {
    refuse(`the largest committed output is ${largestCommitted} byte(s), which is not below the ${GIT_MAX_BUFFER}-byte git read ceiling. Raise GIT_MAX_BUFFER.`);
}
// The one derivation the arm selection reads: every path under the output directories that differs
// from HEAD in the working tree or is untracked there. One command, one set, one selection site.
const status = git([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
    "--",
    ...OUTPUT_DIRS,
]);
if (!status.ok)
    refuse(`the modified-source set could not be derived. ${status.reason}`);
const modified = new Set();
{
    const fields = status.stdout.toString("utf8").split("\0");
    let i = 0;
    while (i < fields.length) {
        const entry = fields[i];
        i += 1;
        if (!entry)
            continue;
        const xy = entry.slice(0, 2);
        modified.add(entry.slice(3));
        // A rename or copy entry is followed by one more NUL-terminated field: the origin path. Both
        // sides count as changed, and skipping the extra field is what keeps the walk aligned.
        if (xy[0] === "R" || xy[0] === "C") {
            const origin = fields[i];
            i += 1;
            if (origin)
                modified.add(origin);
        }
    }
}
// ── The filesystem walk, kept as the second side of the set equality. ────────────────────────────
function collectJs(dir, acc) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs))
        return acc;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".tmp-build")
            continue;
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
            collectJs(rel, acc);
        }
        else if (entry.isFile() && entry.name.endsWith(".js")) {
            acc.push(rel);
        }
    }
    return acc;
}
const walkSet = new Set(OUTPUT_DIRS.reduce((acc, d) => collectJs(d, acc), []));
// Both directions, each named and counted. Neither is derived from the other.
const headOnly = [...headSet].filter((p) => !walkSet.has(p)).sort();
const workingOnly = [...walkSet].filter((p) => !headSet.has(p)).sort();
// ── Rebuild the sources to a fresh temp dir. A non-zero exit means the sources do not compile
//    cleanly — fail closed, never report fresh. ────────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), "grugops-fresh-"));
function cleanup() {
    rmSync(tmp, { recursive: true, force: true });
}
const build = spawnSync("npx", ["tsc", "--outDir", tmp], { cwd: ROOT, encoding: "utf8" });
if (build.status !== 0) {
    if (build.stdout)
        process.stdout.write(build.stdout);
    if (build.stderr)
        process.stderr.write(build.stderr);
    console.log("BUILD-OUTPUT CHECK FAILED: the rebuild did not compile cleanly, so this gate states nothing about the build outputs.");
    cleanup();
    process.exit(1);
}
// ── Compare. Every member of the derived HEAD set is compared exactly once, on exactly one arm. ──
const staleCommitted = [];
const staleWorking = [];
const orphaned = [];
let armHead = 0;
let armWorking = 0;
for (const rel of [...headSet].sort()) {
    const source = `${rel.slice(0, -3)}.ts`;
    // ONE selection site, reading ONE derived set. A modified or untracked source means the rebuild in
    // hand is a rebuild of that source, not of HEAD's, so HEAD's output is the wrong thing to compare
    // it against — the working output is compared instead and the verdict says so.
    const useWorking = modified.has(source) && walkSet.has(rel);
    if (useWorking)
        armWorking += 1;
    else
        armHead += 1;
    const rebuiltPath = join(tmp, rel);
    if (!existsSync(rebuiltPath)) {
        orphaned.push(rel);
        continue;
    }
    const rebuilt = readFileSync(rebuiltPath);
    if (useWorking) {
        const working = readFileSync(join(ROOT, rel));
        if (!working.equals(rebuilt))
            staleWorking.push(rel);
        continue;
    }
    const blob = git(["show", `HEAD:${rel}`]);
    if (!blob.ok) {
        cleanup();
        refuse(`\`git ls-tree\` listed ${rel} but its blob could not be read. ${blob.reason}`);
    }
    if (!blob.stdout.equals(rebuilt))
        staleCommitted.push(rel);
}
cleanup();
// The arm counts are derived per path; their sum losing a path would mean the selection dropped one,
// which is a defect in this module rather than a finding about the tree. Refuse rather than report.
if (armHead + armWorking !== headSet.size) {
    refuse(`the arm counts do not account for the compared set: ${armHead} + ${armWorking} != ${headSet.size}.`);
}
// ── Report. ──────────────────────────────────────────────────────────────────────────────────────
console.log("Build-output check (D-02, D-57) — subject: the .js committed at HEAD, read with `git show`.");
console.log(`HEAD ${HEAD_SHA}`);
console.log(`Compared ${headSet.size} path(s) derived from \`git ls-tree -r HEAD\` — ${armHead} on the HEAD arm, ${armWorking} on the working-tree arm (uncommitted source); the arms sum to ${armHead + armWorking}.`);
console.log(`Set equality with the filesystem walk: ${headOnly.length} committed at HEAD and absent on disk, ${workingOnly.length} on disk and absent from HEAD.`);
console.log(`Largest compared output ${largestCommitted} byte(s); git read ceiling ${GIT_MAX_BUFFER} byte(s).`);
for (const rel of staleCommitted) {
    console.log(`STALE COMMITTED OUTPUT: ${toPosix(rel)} — the .js committed at HEAD is not a build of the .ts committed beside it. Run \`npm run build\` and commit the result.`);
}
for (const rel of staleWorking) {
    console.log(`STALE WORKING OUTPUT: ${toPosix(rel)} — its source is modified or untracked, and the .js in the working tree is not a build of it. Run \`npm run build\` before committing.`);
}
for (const rel of orphaned) {
    console.log(`ORPHANED COMMITTED OUTPUT: ${toPosix(rel)} — committed at HEAD with no counterpart in a rebuild. Delete it, or restore the .ts that emits it.`);
}
for (const rel of headOnly) {
    console.log(`DELETED COMMITTED OUTPUT: ${toPosix(rel)} — committed at HEAD and absent from the working tree. Restore it, or commit the deletion.`);
}
for (const rel of workingOnly) {
    console.log(`UNCOMMITTED BUILD OUTPUT: ${toPosix(rel)} — present on disk under a build-output directory and absent from HEAD. Commit it, or remove it.`);
}
const findings = staleCommitted.length + staleWorking.length + orphaned.length + headOnly.length + workingOnly.length;
if (findings > 0) {
    console.log(`BUILD-OUTPUT CHECK FAILED: ${findings} finding(s).`);
    process.exit(1);
}
console.log(`${FRESH_LINE_PREFIX} ${headSet.size} committed .js file(s) match a rebuild of their sources.`);
process.exit(0);

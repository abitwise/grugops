// check-nul-bytes.ts — Phase 28 NUL-byte gate (28-08, user-approved after the red-team pass).
//
// Asserts that NO tracked file in this repository contains a NUL (0x00) byte.
//
//   node scripts/check-nul-bytes.js
// Exit 0 = every tracked file is NUL-free; exit 1 = at least one FAIL.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path + one `git ls-files` invocation.
// Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
//
// =================================================================================================
// WHY THIS GATE EXISTS, AND THE DEFECT THAT CAUSED IT
// =================================================================================================
//
// Plan 28-08 shipped a NUL byte into `scripts/context-io.test.ts` in commit a290ee7. The source read
// `cells.join(" ")` in every editor and in `git show`; the byte between the quotes was 0x00, not
// 0x20. Nothing caught it. The suite stayed green, `tsc` stayed green, all fourteen existing gates
// stayed green, and the freshness check stayed green, because a NUL inside a string literal is
// valid TypeScript and valid JavaScript.
//
// TWO HARMS, AND THE SECOND IS THE ONE THAT MATTERS.
//
// 1. It silently corrupted a published measurement. The NUL was the separator in
//    `createHash("sha256").update(cells.join("\0"))`, whose printed digest exists — in that test's
//    own words — "so an outside transcript's same-corpus claim is a measurement rather than an
//    assertion". A third party reading the source reconstructs `join(" ")`, hashes a different byte
//    string, and gets a different digest. The artifact whose entire job was reproducibility was not
//    reproducible from its own source.
//
// 2. It silently disabled `grep` over that file. `git diff` reported `Binary files differ`; plain
//    `grep` returned ZERO matches for strings demonstrably present, with no warning and exit status
//    1 — indistinguishable from a genuine absence. A reviewer grepping the file for a term would
//    have been told, credibly and wrongly, that it was not there. In a repository whose entire value
//    proposition is an auditable trail, a byte that makes the trail invisible to the standard search
//    tool is a trace defect, not a formatting nit.
//
// =================================================================================================
// WHAT THE SCANNED SET ENUMERATES — AND WHY IT HAS NO EXEMPTION LIST
// =================================================================================================
//
// THE SET IS: every file `git ls-files` reports as tracked. Nothing is filtered, nothing is skipped,
// nothing is exempt. That is a deliberate design choice and not an oversight.
//
// THE TRAP THIS AVOIDS, STATED PLAINLY. The obvious implementation is to scan only "text sources"
// and to derive that set from git's own `--eol` classifier, which is the tool that owns the
// text-versus-binary question. THAT IMPLEMENTATION IS SELF-DEFEATING, and it was measured to be so
// before this gate was written. Git classifies a file as `-text` PRECISELY BECAUSE it contains a
// NUL. On the tree at 28-08, `git ls-files --eol` reported exactly one `-text` file out of 1450:
// `scripts/context-io.test.ts` — the defect itself. A gate that scanned "the files git calls text"
// would have filtered out the only file it needed to look at and reported a clean green. The
// classifier is downstream of the very property under test, so it cannot be the filter.
//
// It CAN, however, be an independent second opinion, and it is used as exactly that below.
//
// THE COST OF NO EXEMPTIONS, PRICED. A repository that tracks a real binary asset — a PNG in docs, a
// compiled fixture — would red here. That is priced and accepted for two measured reasons. First,
// this repository tracks NONE today: the assertion `every tracked file is NUL-free` is currently
// exact rather than aspirational, and that emptiness is itself asserted rather than assumed (see
// `nulFreeTrackedFiles` below, and the two-sided count assertions in the test file). Second, an
// exemption list is this repository's diagnosed failure class #1 — a hand-maintained set literal
// that rots while the suite stays green — and it is the class that produced the spawn defect (seven
// granted names, zero adapter files). Adding one here, pre-emptively, to hold assets that do not
// exist would be shipping the disease to prevent a symptom.
//
// WHEN A LEGITIMATE BINARY IS ADDED, the correct response is to fail LOUDLY and by name, and for a
// human to add a NAMED exemption WITH ITS REASON — the shape `check-public-docs-vocabulary.ts` uses
// for CHANGELOG.md. What must never happen is a silent skip, a widened matcher, or a scan set
// narrowed to reach green.
//
// =================================================================================================
// THE HARNESS ASSERTS ITS OWN PREMISE — THIS PHASE HIT THAT CLASS ELEVEN TIMES
// =================================================================================================
//
// 1. NO `grep`, ANYWHERE. A NUL-detection harness built on `grep` is self-defeating by construction:
//    `grep` is the tool the NUL disables. Detection is `Buffer.indexOf(0)` over raw bytes read with
//    no encoding argument, so no decoder ever sees the file.
//
// 2. LINE AND COLUMN ARE COMPUTED FROM BYTES, NOT FROM A DECODED PREFIX. The first draft of the
//    28-08 locator decoded `buf.subarray(0, offset)` as UTF-8 and counted newlines in the string.
//    That reports a wrong column on any file containing multi-byte characters, because a byte offset
//    was compared against character indices — it printed column 1488 for a line 91 characters long.
//    `locate()` below counts 0x0A bytes in the byte buffer and takes the byte distance from the last
//    one, so offset, line and column are all in the same unit.
//
// 3. GIT'S CLASSIFIER IS CROSS-CHECKED AGAINST THE BYTE SCAN — AND THE STRENGTH OF THAT CHECK IS
//    STATED HONESTLY RATHER THAN OVERSOLD. This module's `Buffer.indexOf(0)` and git's own
//    working-tree `--eol` verdict must name the SAME set of NUL-bearing files; a disagreement is
//    reported and fails, because it means one of the two is wrong and this module cannot know which.
//
//    WHAT THAT BUYS, PRECISELY: git's binary heuristic is ITSELF NUL-based, so the two detectors are
//    NOT independent in concept. Their agreement corroborates this module's IMPLEMENTATION — that
//    `scanTracked()` enumerates the right files, reads them as bytes, and finds what is actually
//    there — and it is emphatically NOT a second opinion on whether NUL-detection is the right
//    predicate. A first draft of this header claimed "two independent detectors"; that claim was
//    measured and is false, and it is corrected here rather than left standing.
//
//    THE DISAGREEMENT ARM IS DEFENSIVE AND COULD NOT BE REACHED BY CONSTRUCTED INPUT. Four shapes
//    were tried against a throwaway repository: a NUL at byte 100, a NUL at byte 20000 (past git's
//    documented first-few-bytes window), `.gitattributes` marking a clean file `binary`, and
//    `.gitattributes` marking a NUL-bearing file `text`. NONE produced a disagreement — the `w/`
//    column is derived from CONTENT and the attribute does not override it. The arm stays because a
//    future git version or a filter driver could change that, but its coverage is stated as absent
//    rather than implied to exist. (The precedent is 28-07's de-duplication path, likewise
//    unreachable by the shipped artifact and likewise said so.)
//
// =================================================================================================
// THE D-24 RED TRANSCRIPT — WATCHED FAILING AGAINST THE REAL TREE, NOT A FIXTURE
// =================================================================================================
//
// This gate was written and run BEFORE the NUL was removed, so its first run was against a real
// defect in the real working tree — the standard plan 28-01 set for this phase, and the reason a red
// here is credible. Measured 2026-08-12 on the tree at commit cd71344:
//
//   FAIL  scripts/context-io.test.ts carries 1 NUL byte(s) (0x00). First at byte offset 116043,
//         line 2277, column 60. A NUL byte in a tracked source is never intentional here: ...
//   FAIL  NUL total: 1 byte(s) across 1 of the 1450 tracked file(s) scanned.
//   2 CHECK(S) FAILED
//
// After `cells.join("\0")` was corrected to `cells.join("\x1f")`, the same command over the same
// tree exits 0. The gate is byte-unchanged across that transition: the green is a property of the
// TREE, not of the gate.
//
// AND THE FINAL ARTIFACT WAS RE-RUN AGAINST THE REAL DEFECT, so the transcript above is not merely
// the first draft's. A throwaway repository seeded with `git show a290ee7:scripts/context-io.test.ts`
// — the actual committed blob — driven through the SHIPPED gate via NUL_SCAN_ROOT reproduces the
// same refusal at the same byte offset, line and column. Watching an early draft fail and then
// shipping a different artifact is the shape this repository has been bitten by; the refusal is
// therefore attributed to the code that ships.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
// THE SCAN ROOT IS OVERRIDABLE, FOLLOWING THE `VALIDATE_KIT_ROOT` PRECEDENT IN
// scripts/validate-agent-factory.ts. Without it this gate can only ever be run against the one tree
// it lives in, which means the ONLY way to watch it fail is to break the real repository — and a
// refusal path that can never be exercised hermetically is a refusal path that rots. With it,
// scripts/check-nul-bytes.test.ts builds a throwaway git repository containing a deliberate NUL and
// runs THIS COMPILED GATE against it, so the RED is reproduced by the shipped artifact rather than
// by a re-implementation of it in a test.
//
// It is an override for TESTING and it is not a scan-narrowing knob: it moves the root, it cannot
// exclude a path, and every derivation below still enumerates the whole tracked set at whatever root
// it is given.
//
// The truthiness ternary, not `??` — the sibling form (28-REVIEW WR-05). The two differ on exactly
// one input: `NUL_SCAN_ROOT=""` degrades to the repo root here and would otherwise resolve every
// path against the process CWD.
const ROOT = process.env.NUL_SCAN_ROOT
    ? process.env.NUL_SCAN_ROOT
    : join(import.meta.dirname, "..");
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
};
// Exported accessor so a later aggregator can fold this gate's verdict without reaching for a
// shared global (the check-uat-oracles / check-public-docs-vocabulary precedent).
export const nulByteFails = () => FAILS;
/** The forbidden byte. Named once so no call site writes a bare `0`. */
export const NUL = 0x00;
/**
 * Every `git` invocation in this module, so a failure is a NAMED refusal rather than a stack trace
 * (28-REVIEW WR-11).
 *
 * `execFileSync` was called unguarded in both derivations below. Outside a git worktree — or with
 * NUL_SCAN_ROOT pointed at a non-repository — git exits 128 and the gate DIED with a Node stack
 * trace instead of reporting a verdict. That is against the throw-versus-report split every sibling
 * gate in this phase observes: a stack trace is not a verdict, and a gate that dies is not a gate
 * that failed. This helper throws with the command and the root in the message; runAll() catches it
 * and reports through fail().
 */
function git(args) {
    try {
        return execFileSync("git", [...args], {
            cwd: ROOT,
            encoding: "buffer",
            maxBuffer: 64 * 1024 * 1024,
        }).toString("utf8");
    }
    catch (e) {
        throw new Error(`\`git ${args.join(" ")}\` failed at ${ROOT} — ${e.message}. The tracked set ` +
            `cannot be derived, so NO verdict is reported over it. Confirm this is being run inside a ` +
            `git working tree`);
    }
}
/**
 * Every tracked path, DERIVED from git rather than from a walk or a list.
 *
 * `-z` and a NUL-delimited split are deliberate: a newline in a filename would corrupt a
 * newline-delimited parse, and this gate of all gates should not assume bytes it has not checked.
 * (The delimiter being NUL is not a contradiction — it is git's OUTPUT framing, never file content.)
 */
export function trackedPaths() {
    return git(["ls-files", "-z"])
        .split("\0")
        .filter((p) => p.length > 0);
}
/**
 * Git's OWN text/binary verdict per tracked path, parsed from `git ls-files --eol`.
 *
 * Used ONLY as an independent cross-check on the byte scan — never as a filter. See the header.
 *
 * THE `w/` COLUMN, NOT THE `i/` COLUMN, AND THE DISTINCTION IS LOAD-BEARING. `git ls-files --eol`
 * reports THREE verdicts per path: `i/` for the blob in the INDEX, `w/` for the file in the WORKING
 * TREE, and `attr/` for the .gitattributes setting. `scanTracked()` reads the WORKING TREE with
 * `readFileSync`, so the only sound comparison is against `w/` — the two detectors must be asked
 * about the SAME OBJECT or the cross-check is measuring the difference between two files rather
 * than the disagreement between two detectors.
 *
 * This was not reasoned out in advance; the cross-check CAUGHT IT. The first version of this
 * function parsed `i/`, and the moment 28-08's NUL was fixed in the working tree the gate reported
 * a disagreement: `i/-text w/lf` — the index still held the committed NUL blob while the worktree
 * held the fix. The gate was right to fail and the harness was wrong, which is exactly the job a
 * cross-check exists to do. Recorded here rather than quietly corrected.
 *
 * The parse splits on the first TAB rather than matching the whole line with one regex: the
 * attribute field can itself contain a space (`attr/text eol=lf`), which silently broke a
 * whitespace-delimited regex during development and produced 1450 "unparsed" rows. Rows that still
 * fail to parse are RETURNED as unparsed rather than dropped, and the caller fails on a non-zero
 * count — a classifier that silently understood nothing would otherwise agree with any byte scan.
 *
 * `-z` HERE TOO, AND THE STATED REASON IS THE MEASURED ONE (28-REVIEW WR-11). The header justifies
 * `-z` on trackedPaths() because "a newline in a filename would corrupt a newline-delimited parse",
 * and this twin then did exactly that with `out.split("\n")`. The review named that as the hazard;
 * MEASURED, IT IS NOT THE HAZARD — `git ls-files --eol` C-QUOTES such a path (`"a\nb.md"`, on one
 * line, with or without `core.quotePath=false`), so the row count survived.
 *
 * The real divergence is that same quoting. With `-z` git emits the path RAW; without it, git
 * C-quotes anything unusual. trackedPaths() already used `-z` and this twin did not, so for any path
 * git chose to quote the two views named DIFFERENT STRINGS for the SAME FILE — and runAll() compares
 * those strings as sets. Both views are now framed identically, so they disagree only when the TREE
 * disagrees. scripts/check-nul-bytes.test.ts measures the asymmetry directly rather than asserting it.
 */
export function gitBinaryPaths() {
    const out = git(["ls-files", "--eol", "-z"]);
    const rows = out.split("\0").filter((r) => r.length > 0);
    const binary = [];
    const unparsed = [];
    for (const row of rows) {
        const tab = row.indexOf("\t");
        if (tab === -1) {
            unparsed.push(row);
            continue;
        }
        const m = row.slice(0, tab).match(/^i\/(\S+)\s+w\/(\S+)\s/);
        if (m === null) {
            unparsed.push(row);
            continue;
        }
        // m[2] is the WORKING-TREE verdict — the same object scanTracked() reads. See the note above.
        if (m[2] === "-text")
            binary.push(row.slice(tab + 1));
    }
    return { binary, unparsed, rows: rows.length };
}
/**
 * Byte offset -> {line, column}, counted ENTIRELY in bytes.
 *
 * Both are 1-based. `column` is the byte distance from the preceding 0x0A, so a file with multi-byte
 * characters reports a column in the same unit as the offset it came from. See harness premise 2.
 */
export function locate(buf, offset) {
    let line = 1;
    let lastNewline = -1;
    for (let i = 0; i < offset; i++) {
        if (buf[i] === 0x0a) {
            line += 1;
            lastNewline = i;
        }
    }
    return { line, column: offset - lastNewline };
}
/**
 * The pure byte-level predicate: every offset at which `buf` carries a NUL.
 *
 * Extracted so the detection itself is testable on a crafted buffer with no filesystem, no git and
 * no repository — a detector that can only be exercised by breaking the real tree is a detector
 * nobody exercises. `scanTracked` is this function plus I/O.
 */
export function nulOffsets(buf) {
    const offsets = [];
    let idx = buf.indexOf(NUL);
    while (idx !== -1) {
        offsets.push(idx);
        idx = buf.indexOf(NUL, idx + 1);
    }
    return offsets;
}
/**
 * Read every given path as RAW BYTES and report those carrying a NUL.
 *
 * No encoding argument is passed to readFileSync anywhere in this module, so no decoder is
 * interposed between the file and the check. Paths that cannot be read are returned separately
 * rather than swallowed: a scan that silently skipped a file it could not open would under-report
 * and still print a green.
 *
 * THE TWO NOT-SCANNED CASES ARE SEPARATED (28-REVIEW WR-11). A tracked file DELETED from the working
 * tree and a tracked file that is present but unopenable are different situations with different
 * fixes, and both used to land in one `unreadable` list under a message a developer could read as a
 * NUL finding. `missing` is ENOENT — the path is tracked and not on disk (a deletion not yet staged,
 * or an uninitialised submodule gitlink); `unreadable` is everything else (permissions, an I/O
 * error). Both still FAIL: fail-closed is right, and only the naming was wrong.
 */
export function scanTracked(paths) {
    const hits = [];
    const missing = [];
    const unreadable = [];
    for (const rel of paths) {
        let buf;
        try {
            buf = readFileSync(join(ROOT, rel));
        }
        catch (e) {
            if (e.code === "ENOENT")
                missing.push(rel);
            else
                unreadable.push(rel);
            continue;
        }
        const offsets = nulOffsets(buf);
        if (offsets.length > 0)
            hits.push({ path: rel, offsets });
    }
    return { hits, missing, unreadable };
}
/** The tracked paths carrying no NUL — derived, so the test can assert the partition two-sided. */
export function nulFreeTrackedFiles() {
    const paths = trackedPaths();
    const { hits } = scanTracked(paths);
    const bad = new Set(hits.map((h) => h.path));
    return paths.filter((p) => !bad.has(p));
}
export function runAll() {
    process.stdout.write("\n[check_nul_bytes] no tracked file carries a NUL byte (28-08)\n");
    // The tracked-set derivation is the one step that shells out, and it is the one step that can
    // fail for a reason that has nothing to do with NUL bytes (28-REVIEW WR-11). Reported, never
    // thrown past the caller — a stack trace is not a verdict.
    let paths;
    try {
        paths = trackedPaths();
    }
    catch (e) {
        fail(e.message);
        finish();
        return;
    }
    // Premise: the tracked set is non-empty. An empty set would make every check below vacuously
    // green, which is the failure mode a "0 problems found" gate hides best.
    if (paths.length === 0) {
        fail("`git ls-files` returned ZERO tracked paths. This gate cannot run: every check below would " +
            "pass vacuously. Confirm this command is being run inside the repository working tree.");
        finish();
        return;
    }
    const { hits, missing, unreadable } = scanTracked(paths);
    // Named as the situation it IS, so a developer meeting it in CI does not read it as a NUL finding.
    if (missing.length > 0) {
        fail(`${missing.length} tracked path(s) are MISSING FROM THE WORKING TREE and were therefore NOT ` +
            `scanned: ${missing.slice(0, 10).join(", ")}. This is not a NUL finding — the path is ` +
            "tracked by git and absent on disk (a deletion not yet staged, or an uninitialised " +
            "submodule). A skipped file is an unchecked file, so it fails closed rather than passing.");
    }
    if (unreadable.length > 0) {
        fail(`${unreadable.length} tracked path(s) are PRESENT BUT UNREADABLE and were therefore NOT ` +
            `scanned: ${unreadable.slice(0, 10).join(", ")}. This is not a NUL finding — the file ` +
            "exists and could not be opened (permissions, or an I/O error). A skipped file is an " +
            "unchecked file; refusing to report a clean scan over a set this gate did not actually read.");
    }
    let totalNuls = 0;
    for (const hit of hits) {
        totalNuls += hit.offsets.length;
        const buf = readFileSync(join(ROOT, hit.path));
        const first = locate(buf, hit.offsets[0]);
        fail(`${hit.path} carries ${hit.offsets.length} NUL byte(s) (0x00). First at byte offset ` +
            `${hit.offsets[0]}, line ${first.line}, column ${first.column}. A NUL byte in a tracked ` +
            "source is never intentional here: it renders as a space in every editor and in `git show`, " +
            "it makes `git diff` report `Binary files differ`, and it makes plain `grep` return ZERO " +
            "matches for strings that ARE present — silently, with an exit status indistinguishable " +
            "from a genuine absence. Fix the FILE. Do not add an exemption and do not narrow the scan " +
            "set: the scanned set is every tracked path by derivation, precisely so removing a member " +
            "to reach green is not available.");
    }
    // ── THE INDEPENDENT CROSS-CHECK ────────────────────────────────────────────────────────────────
    // Git decides `-text` on its own read of the file's bytes. If its verdict and this module's byte
    // scan name different files, one of the two is wrong and this module cannot know which — so it
    // reports the disagreement and fails rather than picking a winner.
    // Named `gitView` rather than `git` so it does not shadow the module's `git()` helper.
    let gitView;
    try {
        gitView = gitBinaryPaths();
    }
    catch (e) {
        fail(e.message);
        finish();
        return;
    }
    if (gitView.unparsed.length > 0) {
        fail(`${gitView.unparsed.length} row(s) of \`git ls-files --eol -z\` output could not be parsed, ` +
            "so git's classification is not available as a cross-check on the byte scan. Refusing to " +
            "report the scan corroborated when the corroborating source was not understood.");
    }
    else if (gitView.rows !== paths.length) {
        fail(`\`git ls-files --eol -z\` returned ${gitView.rows} row(s) but \`git ls-files -z\` returned ` +
            `${paths.length} path(s). The two views of the tracked set disagree, so the cross-check ` +
            "cannot be trusted.");
    }
    else {
        const scanned = new Set(hits.map((h) => h.path));
        const byGit = new Set(gitView.binary);
        const scanOnly = [...scanned].filter((p) => !byGit.has(p));
        const gitOnly = [...byGit].filter((p) => !scanned.has(p));
        if (scanOnly.length > 0 || gitOnly.length > 0) {
            fail("the byte scan and git's own text/binary classifier DISAGREE. Files with a NUL by byte " +
                `scan but not classified \`-text\` by git: ${scanOnly.join(", ") || "(none)"}. Files ` +
                `classified \`-text\` by git but carrying no NUL by byte scan: ${gitOnly.join(", ") || "(none)"}. ` +
                "A `-text` file with no NUL is legitimate (git also considers other criteria) and needs a " +
                "named exemption with its reason; a NUL git did not notice means this gate's own scan or " +
                "git's classifier is wrong. Either way the disagreement is reported rather than resolved " +
                "silently.");
        }
    }
    if (totalNuls > 0) {
        fail(`NUL total: ${totalNuls} byte(s) across ${hits.length} of the ${paths.length} tracked ` +
            "file(s) scanned.");
    }
    if (FAILS === 0) {
        // A PASS line must never state a check that was not performed: every number below is read from
        // the run that just happened.
        pass(`${paths.length} tracked file(s) scanned as raw bytes, ZERO carrying a NUL byte; the scanned ` +
            "set is every path `git ls-files` reports, with no exemption list and nothing filtered — " +
            `git's own \`--eol\` classifier independently agrees, reporting ${gitView.binary.length} ` +
            `\`-text\` file(s) against this scan's ${hits.length} NUL-bearing file(s), across ` +
            `${gitView.rows} parsed row(s) with 0 unparsed; ${missing.length} path(s) missing from the ` +
            `working tree and ${unreadable.length} path(s) present but unreadable`);
    }
    finish();
}
function finish() {
    process.stdout.write("\n== Result ==\n");
    if (FAILS === 0) {
        process.stdout.write("ALL CHECKS PASSED\n");
        process.exit(0);
    }
    else {
        process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
        process.exit(1);
    }
}
// Entry check: true only when this module was launched directly (not imported). process.argv[1] is
// the launched script path; compare it to this module's own file URL via pathToFileURL — a
// hand-built `file://${argv[1]}` URL does NOT match on Windows, which would make a direct
// `node scripts/check-nul-bytes.js` run ZERO checks and exit 0, a fabricated green. The guard is
// also what lets the test file IMPORT this module without the import running the check and calling
// process.exit inside the vitest worker.
const isEntry = process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
    runAll();
}

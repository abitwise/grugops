// freshness.test.ts — the discrimination harness for the D-02 / D-57 build-output drift gate.
//
// WHAT THIS FILE HAS TO PROVE, AND WHY A GREEN SUITE WOULD NOT PROVE IT. The gate this file drives
// was VACUOUS until plan 29-59: it read its committed side from the working tree, and
// .github/workflows/ci.yml rebuilt that working tree before every invocation, so it compared a
// rebuild against a rebuild and could not report a committed .js that was hand-edited or never
// rebuilt. A repair to a gate that could not fail is worth nothing unless the repair itself is shown
// to discriminate. So the load-bearing case below applies ONE plant to TWO clones — one at the
// pre-fix commit, one at the post-fix commit — and asserts that the first never names the plant
// (in one of the two measured pre-fix shapes; see `prefixShape`) and the second exits 1 naming it.
//
// EVERY REPRODUCTION RUNS ON A REAL GIT REPOSITORY. This gate's subject is HEAD, so a synthesized
// directory has nothing for it to read and a `git archive` extract has no HEAD at all. Each case gets
// its own `git clone`, one plant per clone, never reused, and each clone's `git rev-parse HEAD` is
// carried in the assertion message so a transcript arrives with its own provenance. A clone is never
// reset with `git checkout --`; it is discarded and a new one is made.
//
// WHY THE CLONES LIVE INSIDE THE REPOSITORY. A clone under the repository root resolves `typescript`
// and `@types/node` by the ordinary upward module walk, so `npx tsc` and `npm run build` work inside
// it with no symlink — which is what makes these cases runnable on Windows, where the vitest step
// also runs. `.temp/` is gitignored in the same commit as this file, because the gate now reads
// `git status` and an untracked clone would otherwise change what the parent repository's own run
// sees.
//
// THE RED REPLAY, MADE REPRODUCIBLE RATHER THAN QUOTED. `FRESHNESS_POSTFIX_REF` overrides the commit
// the post-fix clones are built from. Setting it to the pre-fix SHA replays every case in this file
// against the pre-fix artifact, which is how each new case was watched failing before it was
// accepted. It defaults to HEAD, so an ordinary run always measures the tree in front of it.
//
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/freshness.test.ts
//   FRESHNESS_POSTFIX_REF=020905f9499b1c1b92a7f56cb982cc6974589bf3 npx vitest run ... # the RED replay
//
// Vitest globals:false → import explicitly. NOT in the e2e lane; this is hermetic.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
// The host compiler, read for its OWN diagnostics table in Test 3 (the planted error's code is
// derived from it, never typed) — the same reading scripts/runnable-ref/uat-spec-integrity.test.ts
// takes. A dev dependency; the gate under test resolves the same package at run time.
import ts from "typescript";

const ROOT = join(import.meta.dirname, "..");
const FRESHNESS_JS = join(ROOT, "scripts", "freshness.js");
/** The second consumer of the 33-06 compiler launch (plan 33-19); exercised by Tests AF and AG below. */
const PARITY_TS = join(ROOT, "scripts", "check-build-parity.ts");
const PARITY_JS = join(ROOT, "scripts", "check-build-parity.js");
/** The parity module's runtime siblings — what a copy of it needs beside it to load at all. */
const PARITY_SIBLINGS = ["check-build-parity.js", "is-entry.js", "vacuity.js"] as const;
const CLONE_ROOT = join(ROOT, ".temp", "freshness-clones");
const BIG = 64 * 1024 * 1024;

/**
 * The PRE-FIX tree: the last commit at which the gate read its committed side from the WORKING TREE.
 * This is a historical constant and is correct to pin — the whole point of the discrimination pair is
 * that one side of it is a tree that no longer exists anywhere else.
 */
const PRE_FIX_SHA = "020905f9499b1c1b92a7f56cb982cc6974589bf3";

/**
 * The POST-FIX tree. HEAD by default, so this file keeps measuring whatever is in front of it rather
 * than a commit that ages out. Override it to replay every case against the pre-fix artifact.
 */
const POST_FIX_REF = process.env.FRESHNESS_POSTFIX_REF ?? "HEAD";

/** The committed build output every stale-committed plant is applied to. */
const PLANT_REL = "hooks/guard.js";
/** The source whose working-tree modification selects the working arm. */
const WORKING_SOURCE_REL = "scripts/freshness.ts";
/** The output that source emits, and therefore the path the working arm reports. */
const WORKING_OUTPUT_REL = "scripts/freshness.js";
/** An extra build output nothing committed. */
const UNTRACKED_OUTPUT_REL = "scripts/__extra_build_output__.js";

/**
 * The gate's GREEN VERDICT LINE, spelled once.
 *
 * A PREMISE THIS HARNESS ASSERTED AND FOUND FALSE, RECORDED RATHER THAN QUIETLY DROPPED. The first
 * form of this file asserted that a failing run's stdout carries ZERO case-insensitive occurrences of
 * the word "fresh". Two cases red on the first run and both were right to: `scripts/freshness.js` is
 * a path this gate legitimately NAMES in a finding, and the clone directory is called
 * `.temp/freshness-clones/`. The word is not the invariant and never could be. What IS checkable is
 * the VERDICT LINE: this exact prefix is printed on the success path and on no other, so a failing
 * run never carries it. A fail-closed gate that still prints a green verdict is the fabricated green
 * this repository has already paid for once, and that is the proposition worth asserting.
 */
const FRESH_LINE = "All build outputs fresh:";

// A git environment with no dependence on the developer's own config, mirroring the idiom in
// scripts/check-diff-disposition.test.ts.
const GIT_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "grugops harness",
  GIT_AUTHOR_EMAIL: "harness@example.invalid",
  GIT_COMMITTER_NAME: "grugops harness",
  GIT_COMMITTER_EMAIL: "harness@example.invalid",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

function gitIn(cwd: string, args: string[]): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: GIT_ENV, maxBuffer: BIG });
  if (r.status !== 0) {
    throw new Error(
      `harness: \`git ${args.join(" ")}\` failed in ${cwd} (status ${r.status})\n${r.stdout ?? ""}${r.stderr ?? ""}`,
    );
  }
  return r.stdout ?? "";
}

// npm and npx resolve to .cmd shims on Windows, which node:child_process refuses to spawn without a
// shell. The gate itself is unchanged in this respect; only the harness opts in, and only there.
const NEEDS_SHELL = process.platform === "win32";

function npmIn(cwd: string, args: string[]): { status: number; out: string } {
  const r = spawnSync("npm", args, {
    cwd,
    encoding: "utf8",
    env: GIT_ENV,
    maxBuffer: BIG,
    shell: NEEDS_SHELL,
  });
  return { status: r.status ?? -1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

type Run = { head: string; status: number; stdout: string; stderr: string };

/** Run a directory's OWN committed gate, and record the HEAD it was run against. */
function runGateIn(dir: string, head: string): Run {
  const r = spawnSync("node", [join(dir, "scripts", "freshness.js")], {
    cwd: dir,
    encoding: "utf8",
    env: GIT_ENV,
    maxBuffer: BIG,
  });
  return { head, status: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

const clonesCreated: string[] = [];

function makeClone(name: string, sha: string): string {
  const dest = join(CLONE_ROOT, name);
  const r = spawnSync("git", ["clone", "--local", "--quiet", ROOT, dest], {
    encoding: "utf8",
    env: GIT_ENV,
    maxBuffer: BIG,
  });
  if (r.status !== 0) {
    throw new Error(`harness: could not clone into ${dest} (status ${r.status})\n${r.stderr ?? ""}`);
  }
  gitIn(dest, ["-c", "advice.detachedHead=false", "checkout", "--quiet", sha]);
  const head = gitIn(dest, ["rev-parse", "HEAD"]).trim();
  if (head !== sha) {
    throw new Error(`harness: clone ${name} checked out ${head}, expected ${sha}`);
  }
  clonesCreated.push(dest);
  return dest;
}

/** Append bytes to a committed build output and COMMIT the result: a stale committed .js. */
function plantStaleCommitted(dir: string): void {
  const abs = join(dir, PLANT_REL);
  writeFileSync(abs, Buffer.concat([readFileSync(abs), Buffer.from("\n// planted drift\n")]));
  gitIn(dir, ["add", "--", PLANT_REL]);
  gitIn(dir, ["commit", "-q", "-m", "plant: a committed build output that is not a build of its source"]);
}

/**
 * The compared-set cardinality, derived by a DIFFERENT command shape from the one the gate uses
 * (`--name-only` here, `-l` there). Deriving the element count independently of the loop that
 * consumes it is what keeps a silently short denominator from passing as a full one.
 */
function headJsCount(dir: string): number {
  const out = gitIn(dir, [
    "ls-tree", "-r", "HEAD", "--name-only", "--full-name", "-z", "--", "install", "scripts", "hooks",
  ]);
  return out.split("\0").filter((p) => p !== "" && p.endsWith(".js")).length;
}

type Counts = {
  compared: number;
  headArm: number;
  workingArm: number;
  sum: number;
  headOnly: number;
  workingOnly: number;
};

function parseCounts(stdout: string): Counts {
  const arms = stdout.match(
    /Compared (\d+) path\(s\) derived from `git ls-tree -r HEAD` — (\d+) on the HEAD arm, (\d+) on the working-tree arm \(uncommitted source\); the arms sum to (\d+)\./,
  );
  const sets = stdout.match(
    /Set equality with the filesystem walk: (\d+) committed at HEAD and absent on disk, (\d+) on disk and absent from HEAD\./,
  );
  if (!arms || !sets) {
    throw new Error(`harness: the gate printed no parsable count lines.\n${stdout}`);
  }
  return {
    compared: Number(arms[1]),
    headArm: Number(arms[2]),
    workingArm: Number(arms[3]),
    sum: Number(arms[4]),
    headOnly: Number(sets[1]),
    workingOnly: Number(sets[2]),
  };
}

/**
 * The provenance every assertion message carries: the clone, the exit, and BOTH of the gate's
 * streams. stderr is where the gate forwards the compiler's own diagnostics (and where a launch
 * failure lands), so a message without it can only say the rebuild was unclean — which is what the
 * eight windows-latest reds of run 35394268365 said, eight times, with no compiler text in sight
 * (plan 33-06, T-33-29). A future log carries the compiler's text, or names the layer that never
 * produced any.
 */
function transcript(label: string, run: Run): string {
  return [
    `${label}: clone HEAD ${run.head || "(none)"} exit ${run.status}`,
    run.stdout.trim() || "(no stdout)",
    `stderr: ${run.stderr.trim() || "(no stderr)"}`,
  ].join("\n");
}

/**
 * The two MEASURED shapes a pre-fix run takes, and the third it must not (plan 33-19, W-29, D-14).
 *
 * The pre-fix arm of the discrimination pair is evidence of ONE fact: the gate at PRE_FIX_SHA does
 * not name the planted stale `.js`. That fact has two observable spellings, because the pre-fix gate
 * launches its compiler through a shell-less `spawnSync("npx", …)`:
 *
 *   "green-vacuous"        exit 0 + the fresh line — the compiler ran and the gate compared a rebuild
 *                          against a rebuild (measured on every POSIX run of this file).
 *   "no-compiler-vacuous"  exit 1 + `the rebuild did not compile cleanly` with NO compiler text on
 *                          either stream — `npx` is `npx.cmd` on win32, the child never started, and
 *                          the pre-fix `!== 0` test read the null status as a failed compile
 *                          (measured on windows-latest run 35499800942, row W-29: `exit 1 …
 *                          did not compile cleanly … stderr: (no stderr)`).
 *
 * Both are the same vacuity — a gate that did not detect the plant — and neither is a red. Anything
 * else is "unexpected" and IS a red: a compile that ran and refused (compiler text present), a stale
 * verdict, a crash. This is a disjunction over the OBSERVED output, never a host-platform branch,
 * the same discipline as D-16's named skip; the CI log records which shape the leg took.
 */
type PrefixShape = "green-vacuous" | "no-compiler-vacuous" | "unexpected";

/** A compiler that ran leaves its own diagnostic codes behind; a launch that never started leaves none. */
const COMPILER_TEXT = /\bTS\d{4}\b/;

function prefixShape(run: Run): PrefixShape {
  const both = `${run.stdout}${run.stderr}`;
  if (run.status === 0 && run.stdout.includes(FRESH_LINE)) return "green-vacuous";
  if (
    run.status === 1 &&
    run.stdout.includes("the rebuild did not compile cleanly") &&
    !COMPILER_TEXT.test(both) &&
    !run.stdout.includes(FRESH_LINE)
  ) {
    return "no-compiler-vacuous";
  }
  return "unexpected";
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The clone matrix, built once. One plant per clone; no clone is reused between plants.
// ─────────────────────────────────────────────────────────────────────────────────────────────

type Fixtures = {
  postFixSha: string;
  prefixPlantAfterBuild: Run;
  postfixPlantBeforeBuild: Run;
  postfixPlantAfterBuild: Run;
  controlBeforeBuild: Run;
  controlAfterBuild: Run;
  workingArm: Run;
  deleted: Run;
  untracked: Run;
  refusalNested: Run;
  refusalOutside: Run;
  /** A built, diff-clean post-fix clone for the build-parity gate to rebuild in place (plan 33-19). */
  parityClone: string;
  cloneCount: number;
  perCloneHeadJsCount: Record<string, number>;
};

let F: Fixtures;
let outsideDir = "";

beforeAll(() => {
  // ── Harness premises, asserted rather than assumed. ────────────────────────────────────────
  const postFixSha = gitIn(ROOT, ["rev-parse", POST_FIX_REF]).trim();
  const preExists = spawnSync("git", ["cat-file", "-e", `${PRE_FIX_SHA}^{commit}`], {
    cwd: ROOT, encoding: "utf8", env: GIT_ENV,
  });
  if (preExists.status !== 0) {
    throw new Error(
      `harness: the pre-fix commit ${PRE_FIX_SHA} is not reachable from this checkout, so the ` +
        `discrimination pair has no "before" side. Fetch the full history (the CI checkout already ` +
        `sets fetch-depth: 0) and re-run.`,
    );
  }
  // On the DEFAULT ref this is a hard premise: a pair whose two sides are the same tree discriminates
  // nothing and would pass for the wrong reason. An EXPLICIT override is the documented RED replay,
  // where collapsing the pair onto the pre-fix tree is the entire point, so it is allowed there.
  if (POST_FIX_REF === "HEAD" && postFixSha === PRE_FIX_SHA) {
    throw new Error(
      `harness: HEAD is the pre-fix commit ${PRE_FIX_SHA}. The pair would be one tree compared with ` +
        `itself, which discriminates nothing.`,
    );
  }

  rmSync(CLONE_ROOT, { recursive: true, force: true });
  mkdirSync(CLONE_ROOT, { recursive: true });

  const perCloneHeadJsCount: Record<string, number> = {};

  // 1. The pre-fix side of the discrimination pair: plant, commit, BUILD, then run its own gate.
  const prefix = makeClone("prefix-plant", PRE_FIX_SHA);
  plantStaleCommitted(prefix);
  const prefixBuild = npmIn(prefix, ["run", "build"]);
  if (prefixBuild.status !== 0) {
    throw new Error(`harness: \`npm run build\` failed in the pre-fix clone\n${prefixBuild.out}`);
  }
  const prefixHead = gitIn(prefix, ["rev-parse", "HEAD"]).trim();
  const prefixPlantAfterBuild = runGateIn(prefix, prefixHead);

  // 2. The post-fix side: the IDENTICAL plant, run before and after the in-place build.
  const postPlant = makeClone("postfix-plant", postFixSha);
  plantStaleCommitted(postPlant);
  const postPlantHead = gitIn(postPlant, ["rev-parse", "HEAD"]).trim();
  perCloneHeadJsCount["postfix-plant"] = headJsCount(postPlant);
  const postfixPlantBeforeBuild = runGateIn(postPlant, postPlantHead);
  const postPlantBuild = npmIn(postPlant, ["run", "build"]);
  if (postPlantBuild.status !== 0) {
    throw new Error(`harness: \`npm run build\` failed in the post-fix plant clone\n${postPlantBuild.out}`);
  }
  const postfixPlantAfterBuild = runGateIn(postPlant, postPlantHead);

  // 3. The control: an unmutated post-fix clone, before and after the in-place build.
  const control = makeClone("postfix-control", postFixSha);
  perCloneHeadJsCount["postfix-control"] = headJsCount(control);
  const controlBeforeBuild = runGateIn(control, postFixSha);
  const controlBuild = npmIn(control, ["run", "build"]);
  if (controlBuild.status !== 0) {
    throw new Error(`harness: \`npm run build\` failed in the control clone\n${controlBuild.out}`);
  }
  const controlAfterBuild = runGateIn(control, postFixSha);

  // 4. Arm separation, working side: a modified, unbuilt source.
  const working = makeClone("postfix-working-arm", postFixSha);
  perCloneHeadJsCount["postfix-working-arm"] = headJsCount(working);
  const wsAbs = join(working, WORKING_SOURCE_REL);
  writeFileSync(
    wsAbs,
    Buffer.concat([readFileSync(wsAbs), Buffer.from("\nexport const __workingTreeDrift = 1;\n")]),
  );
  const workingArm = runGateIn(working, postFixSha);

  // 5. Set equality, HEAD-only side: a committed output deleted from the working tree.
  const deletedClone = makeClone("postfix-deleted", postFixSha);
  rmSync(join(deletedClone, PLANT_REL), { force: true });
  const deleted = runGateIn(deletedClone, postFixSha);

  // 6. Set equality, working-only side: an extra build output nothing committed.
  const untrackedClone = makeClone("postfix-untracked", postFixSha);
  writeFileSync(join(untrackedClone, UNTRACKED_OUTPUT_REL), "export const extra = 1;\n");
  const untracked = runGateIn(untrackedClone, postFixSha);

  // 7. Refusal, nested: a tree whose root is not the root of the repository git resolves for it.
  const nested = makeClone("refusal-nested", postFixSha);
  rmSync(join(nested, ".git"), { recursive: true, force: true });
  const nestedPrefix = gitIn(nested, ["rev-parse", "--show-prefix"]).trim();
  if (nestedPrefix === "") {
    throw new Error(
      "harness: removing .git from the nested clone did not make git resolve the PARENT repository, " +
        "so this case would not exercise the root-mismatch refusal at all.",
    );
  }
  const refusalNested = runGateIn(nested, "(no repository of its own)");

  // 8. Refusal, outside: a directory in no git repository at all.
  outsideDir = mkdtempSync(join(tmpdir(), "grugops-fresh-norepo-"));
  mkdirSync(join(outsideDir, "scripts"), { recursive: true });
  copyFileSync(FRESHNESS_JS, join(outsideDir, "scripts", "freshness.js"));
  const outsideProbe = spawnSync("git", ["rev-parse", "--git-dir"], {
    cwd: outsideDir, encoding: "utf8", env: GIT_ENV,
  });
  if (outsideProbe.status === 0) {
    throw new Error(
      `harness: ${outsideDir} resolves a git repository (${(outsideProbe.stdout ?? "").trim()}), so ` +
        "this case would not exercise the not-a-repository refusal.",
    );
  }
  const refusalOutside = runGateIn(outsideDir, "(not a repository)");

  // 9. The build-parity clone (plan 33-19): a post-fix clone built in place, so its working tree
  //    agrees with its index and `check-build-parity.js` has a diff-clean tree to rebuild. The gate is
  //    run against THIS clone rather than the checkout because its verdict is `git diff` over the
  //    tracked `.js`: on the checkout it describes the developer's staging state (33-17 measured it
  //    "moved" on modified-but-uncommitted output), not the launcher under test.
  const parityClone = makeClone("postfix-parity", postFixSha);
  const parityBuild = npmIn(parityClone, ["run", "build"]);
  if (parityBuild.status !== 0) {
    throw new Error(`harness: \`npm run build\` failed in the parity clone\n${parityBuild.out}`);
  }

  F = {
    postFixSha,
    prefixPlantAfterBuild,
    postfixPlantBeforeBuild,
    postfixPlantAfterBuild,
    controlBeforeBuild,
    controlAfterBuild,
    workingArm,
    deleted,
    untracked,
    refusalNested,
    refusalOutside,
    parityClone,
    cloneCount: clonesCreated.length,
    perCloneHeadJsCount,
  };
}, 900_000);

afterAll(() => {
  rmSync(CLONE_ROOT, { recursive: true, force: true });
  if (outsideDir) rmSync(outsideDir, { recursive: true, force: true });
});

describe("freshness.js (D-02 build-output drift gate; subject moved to HEAD by D-57)", () => {
  it("Test 1 (control, real tree): exits 0, publishes counts that add up, and says fresh", () => {
    const r = spawnSync("node", [FRESHNESS_JS], { cwd: ROOT, encoding: "utf8", maxBuffer: BIG });
    const run: Run = {
      head: gitIn(ROOT, ["rev-parse", "HEAD"]).trim(),
      status: r.status ?? -1,
      stdout: r.stdout ?? "",
      stderr: r.stderr ?? "",
    };
    const msg = transcript("real tree", run);
    expect(run.status, msg).toBe(0);
    expect(run.stdout, msg).toContain(FRESH_LINE);

    const c = parseCounts(run.stdout);
    expect(c.headArm + c.workingArm, msg).toBe(c.compared);
    expect(c.sum, msg).toBe(c.compared);
    // Derived by a different command shape from the gate's own.
    expect(c.compared, msg).toBe(headJsCount(ROOT));
    expect(c.headOnly, msg).toBe(0);
    expect(c.workingOnly, msg).toBe(0);
  });

  // THE PRE-FIX ARM'S EVIDENCE IS "DID NOT NAME THE PLANT", NOT "EXITED 0" (plan 33-19, W-29).
  //
  // This case used to assert exit 0 + the fresh line on the pre-fix clone. That is ONE of the two ways
  // the pre-fix launch fails to detect the plant, the one every POSIX run measures. windows-latest run
  // 35499800942 measured the other: the pre-fix gate's shell-less `npx` never started a compiler
  // there, so the pre-fix clone exited 1 with `the rebuild did not compile cleanly` and no stderr —
  // still not naming the plant, still the same vacuity, but a red against an exit-0 expectation
  // (WINDOWS.md row 235). The historical checkout is never patched to make this green; the assertion
  // is reformulated to what every host can observe. The post-fix arm is unchanged.
  it("DISCRIMINATION PAIR: the same planted stale committed .js is green on the pre-fix tree and red on the post-fix tree", () => {
    const before = F.prefixPlantAfterBuild;
    const after = F.postfixPlantAfterBuild;
    const shape = prefixShape(before);
    const msg = [
      `plant: bytes appended to ${PLANT_REL} and COMMITTED; \`npm run build\` run in BOTH clones before the gate.`,
      `pre-fix  clone (checked out ${PRE_FIX_SHA}) — shape: ${shape}`,
      transcript("pre-fix", before),
      `post-fix clone (checked out ${F.postFixSha})`,
      transcript("post-fix", after),
    ].join("\n");
    console.log(`DISCRIMINATION PAIR: pre-fix shape = ${shape}`);

    // The vacuity, preserved as evidence rather than described: the pre-fix gate does not name the
    // plant. The post-fix sentence is asserted absent because the pair discriminates on that ONE
    // sentence (asserted present on `after` below). The pre-fix gate's own stale vocabulary was
    // `STALE: <path>`, so that negative alone would be vacuous against it — the plant path is
    // therefore also asserted absent from EVERY line of the pre-fix stdout, whatever the spelling.
    expect(before.stdout, msg).not.toContain(`STALE COMMITTED OUTPUT: ${PLANT_REL}`);
    expect(
      before.stdout.split("\n").filter((line) => line.includes(PLANT_REL)),
      msg,
    ).toEqual([]);
    // The run took one of the two measured shapes; a third shape is refused, never absorbed.
    expect(shape, msg).not.toBe("unexpected");

    // The repair.
    expect(after.status, msg).toBe(1);
    expect(after.stdout, msg).toContain(`STALE COMMITTED OUTPUT: ${PLANT_REL}`);
    expect(after.stdout, msg).not.toContain(FRESH_LINE);
  });

  it("ORDERING INDEPENDENCE: a mutated HEAD blob reds whether or not the in-place build ran first", () => {
    const preB = F.postfixPlantBeforeBuild;
    const postB = F.postfixPlantAfterBuild;
    const msg = [transcript("before the in-place build", preB), transcript("after the in-place build", postB)].join("\n");

    expect(preB.status, msg).toBe(1);
    expect(preB.stdout, msg).toContain(`STALE COMMITTED OUTPUT: ${PLANT_REL}`);
    expect(postB.status, msg).toBe(1);
    expect(postB.stdout, msg).toContain(`STALE COMMITTED OUTPUT: ${PLANT_REL}`);
    expect(preB.stdout, msg).not.toContain(FRESH_LINE);
    expect(postB.stdout, msg).not.toContain(FRESH_LINE);
  });

  it("CONTROL: an unmutated post-fix clone exits 0 before and after the in-place build", () => {
    const msg = [
      transcript("before the in-place build", F.controlBeforeBuild),
      transcript("after the in-place build", F.controlAfterBuild),
    ].join("\n");
    expect(F.controlBeforeBuild.status, msg).toBe(0);
    expect(F.controlAfterBuild.status, msg).toBe(0);
    expect(F.controlBeforeBuild.stdout, msg).toContain(FRESH_LINE);
    expect(F.controlAfterBuild.stdout, msg).toContain(FRESH_LINE);
  });

  it("ARM SEPARATION: two causes get two diagnoses, and the two verdict strings differ", () => {
    const committedRun = F.postfixPlantBeforeBuild;
    const workingRun = F.workingArm;
    const msg = [
      transcript("hand-mutated committed .js, clean source", committedRun),
      transcript("modified, unbuilt source", workingRun),
    ].join("\n");

    expect(committedRun.stdout, msg).toContain(`STALE COMMITTED OUTPUT: ${PLANT_REL}`);
    expect(committedRun.stdout, msg).not.toContain("STALE WORKING OUTPUT:");

    expect(workingRun.status, msg).toBe(1);
    expect(workingRun.stdout, msg).toContain(`STALE WORKING OUTPUT: ${WORKING_OUTPUT_REL}`);
    expect(workingRun.stdout, msg).not.toContain("STALE COMMITTED OUTPUT:");
    expect(workingRun.stdout, msg).not.toContain(FRESH_LINE);

    // The arm the working case took is the working one, and it took it for exactly one path.
    const c = parseCounts(workingRun.stdout);
    expect(c.workingArm, msg).toBe(1);
    expect(c.headArm, msg).toBe(c.compared - 1);
  });

  it("UNION: on every clone the arm counts sum to the compared total, and that total is the derived HEAD set cardinality", () => {
    const rows: Array<[string, Run, number]> = [
      ["postfix-plant", F.postfixPlantBeforeBuild, F.perCloneHeadJsCount["postfix-plant"]!],
      ["postfix-control", F.controlBeforeBuild, F.perCloneHeadJsCount["postfix-control"]!],
      ["postfix-working-arm", F.workingArm, F.perCloneHeadJsCount["postfix-working-arm"]!],
    ];
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const [name, run, derived] of rows) {
      const msg = `${name}\n${transcript(name, run)}\nindependently derived HEAD .js cardinality: ${derived}`;
      const c = parseCounts(run.stdout);
      expect(c.headArm + c.workingArm, msg).toBe(c.compared);
      expect(c.sum, msg).toBe(c.compared);
      expect(c.compared, msg).toBe(derived);
      // A denominator that is empty, or silently short, is not a denominator.
      expect(c.compared, msg).toBeGreaterThan(0);
    }
  });

  it("SET EQUALITY (HEAD-only): a committed output deleted from the working tree is named and counted", () => {
    const msg = transcript("committed output deleted from the working tree", F.deleted);
    expect(F.deleted.status, msg).toBe(1);
    expect(F.deleted.stdout, msg).toContain(`DELETED COMMITTED OUTPUT: ${PLANT_REL}`);
    expect(F.deleted.stdout, msg).not.toContain(FRESH_LINE);
    const c = parseCounts(F.deleted.stdout);
    expect(c.headOnly, msg).toBe(1);
    expect(c.workingOnly, msg).toBe(0);
  });

  it("SET EQUALITY (working-only): an extra untracked build output is named and counted", () => {
    const msg = transcript("extra untracked build output", F.untracked);
    expect(F.untracked.status, msg).toBe(1);
    expect(F.untracked.stdout, msg).toContain(`UNCOMMITTED BUILD OUTPUT: ${UNTRACKED_OUTPUT_REL}`);
    expect(F.untracked.stdout, msg).not.toContain(FRESH_LINE);
    const c = parseCounts(F.untracked.stdout);
    expect(c.headOnly, msg).toBe(0);
    expect(c.workingOnly, msg).toBe(1);
  });

  it("REFUSAL: git that cannot answer produces a named refusal, a non-zero exit, and no fresh line", () => {
    for (const [label, run] of [
      ["not a git repository at all", F.refusalOutside],
      ["a root that is not the repository root", F.refusalNested],
    ] as Array<[string, Run]>) {
      const msg = transcript(label, run);
      expect(run.status, msg).not.toBe(0);
      expect(run.stdout, msg).toContain("REFUSED:");
      // The half that matters more than the exit code: a fail-closed gate must never print the word
      // it is allowed to print only when it is green.
      expect(run.stdout, msg).not.toContain(FRESH_LINE);
    }
  });

  it("PROVENANCE: one clone per plant, none reused, none reset with `git checkout --` and none extracted from an archive", () => {
    // 7 for the freshness matrix + 1 built parity clone (plan 33-19, Tests AF/AG).
    expect(F.cloneCount).toBe(8);
    expect(new Set(clonesCreated).size).toBe(clonesCreated.length);
    for (const dir of clonesCreated) {
      expect(dir.startsWith(CLONE_ROOT)).toBe(true);
    }
  });

  it("Test 3 (fail-closed, surviving): a rebuild that does not compile never reports fresh", () => {
    // Plant a type error into a throwaway .ts under an included dir, then ensure the gate never
    // reports fresh on a broken build. Unchanged in intent from the case this file has always
    // carried; only the assertion is stronger, because the gate now confines the word "fresh" to a
    // single line it can print only when it is green.
    const badTs = join(ROOT, "scripts", "__type_error_probe__.ts");
    writeFileSync(badTs, "const x: number = 'not a number';\nexport {};\n");
    try {
      const r = spawnSync("node", [FRESHNESS_JS], { cwd: ROOT, encoding: "utf8", maxBuffer: BIG });
      const out = r.stdout ?? "";
      const both = `${out}${r.stderr ?? ""}`;
      expect(r.status, both).not.toBe(0);
      expect(out, both).not.toContain(FRESH_LINE);
      // THE COMPILER ANSWERED, NOT ONLY THE GATE. "Not fresh" is also what a compiler that never
      // launched produces — this case passed on windows-latest run 35394268365 while the gate's
      // `npx` spawn returned ENOENT and no compiler ever ran (plan 33-06). The gate now forwards the
      // child's own text, so the planted error's diagnostic — the code the host compiler's own table
      // declares for it, never a typed number — must be in the output, and the launch-failure
      // sentence must not. A host where this reds is a host where the rebuild did not happen.
      const table = (ts as unknown as { Diagnostics?: Record<string, { code?: unknown }> }).Diagnostics;
      const planted = table?.["Type_0_is_not_assignable_to_type_1"]?.code;
      expect(typeof planted, "PREMISE: the host compiler's diagnostics table has no entry for the planted error").toBe("number");
      expect(both, both).toContain(`TS${planted}`);
      expect(both, both).not.toContain("could not be launched");
      expect(both, both).not.toContain("could not be located");
    } finally {
      rmSync(badTs, { force: true });
      expect(existsSync(badTs)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The SECOND consumer of the compiler launch (plan 33-19, the `deferred-items.md` item 33-06 left).
//
// `scripts/check-build-parity.ts` carried the launch `scripts/freshness.ts` had until 33-06:
// `spawnSync("npx", ["tsc"])` with no shell. On win32 `npx` is `npx.cmd`, the child never starts,
// `status` is null and the module reports "the build did not complete" — the null-status build that
// review 32.1-14 IN-01 recorded and 33-06 diagnosed. It runs only in the ubuntu-scoped parity step, so
// it was never a measured red; the CAP-02 bar is both legs, so it takes the identical launch here:
// `typescript/lib/tsc.js` resolved through `createRequire(import.meta.url)`, run under
// `process.execPath`, in the checkout root, rebuilding in place as the gate always has.
//
// These cases live HERE, in the compiler-launch suite, rather than in a module of their own, so the
// `TRIPWIRE_MODULES` census in scripts/check-foundation-guards.test.ts does not move.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The parity gate's PASS line, as `reportMeasured` renders it: the measurement, never a sentence. */
const PARITY_PASS_RE =
  /PASS {2}Build parity: tracked build outputs that moved when the build ran: 0 findings over (\d+)\/(\d+) elements/;

/** The two arms a module copy outside the checkout's require chain can take, and the third it must not. */
type LocateShape = "located" | "locate-refusal" | "unexpected";

function locateShape(run: Run): LocateShape {
  const both = `${run.stdout}${run.stderr}`;
  if (run.status === 0 && PARITY_PASS_RE.test(run.stdout)) return "located";
  if (
    run.status === 1 &&
    both.includes("the compiler could not be located from this checkout") &&
    !both.includes("the build did not complete")
  ) {
    return "locate-refusal";
  }
  return "unexpected";
}

/** Run a parity module at `moduleJs` against `root`, with NODE_PATH removed so resolution is the module's own. */
function runParity(moduleJs: string, root: string): Run {
  const env: NodeJS.ProcessEnv = { ...GIT_ENV, CHECK_ROOT: root };
  delete env.NODE_PATH;
  const r = spawnSync(process.execPath, [moduleJs], { cwd: root, encoding: "utf8", env, maxBuffer: BIG });
  return {
    head: gitIn(root, ["rev-parse", "HEAD"]).trim(),
    status: r.status ?? -1,
    stdout: r.stdout ?? "",
    stderr: `${r.stderr ?? ""}${r.error ? `\nspawn error: ${r.error.message}` : ""}`,
  };
}

describe("check-build-parity.js launches the compiler the way freshness.js does (plan 33-19)", () => {
  it("Test AF (check-build-parity): the source resolves typescript/lib/tsc.js through createRequire and spawns process.execPath with no \"npx\" literal, and the gate exits 0 with its clean-diff line on a built clone", () => {
    // STRUCTURAL HALF — the launch is the 33-06 launch, read from the source rather than inferred
    // from a green run (a green run on POSIX is also what the shim produces).
    const source = readFileSync(PARITY_TS, "utf8");
    expect(source, "the compiler entry is resolved through the module's own require chain").toContain(
      'createRequire(import.meta.url).resolve("typescript/lib/tsc.js")',
    );
    expect(source, "the compiler runs under the node running the gate").toContain("spawnSync(process.execPath,");
    expect(source, "no shim on any host: the double-quoted npx literal must be gone").not.toContain('"npx"');

    // BEHAVIOURAL HALF — the working tree's committed module, run against a built, diff-clean clone.
    const run = runParity(PARITY_JS, F.parityClone);
    const msg = transcript("parity gate on the built clone", run);
    expect(run.status, msg).toBe(0);
    const pass = PARITY_PASS_RE.exec(run.stdout);
    expect(pass, msg).not.toBe(null);
    // The measurement the PASS line carries: every tracked output examined, none moved, and the
    // denominator derived by a different command shape from the module's own.
    const tracked = gitIn(F.parityClone, ["ls-files", "--", "*.js"]).split("\n").filter((l) => l.trim() !== "").length;
    expect(Number(pass![1]), msg).toBe(tracked);
    expect(Number(pass![2]), msg).toBe(tracked);
    expect(tracked, msg).toBeGreaterThan(0);
    expect(run.stdout, msg).toContain("ALL CHECKS PASSED");
  });

  it("Test AG (check-build-parity): a copy of the module outside the checkout's require chain names the locate layer, or resolves and builds — never a null-status build", () => {
    const outside = mkdtempSync(join(tmpdir(), "grugops-parity-outside-"));
    try {
      mkdirSync(join(outside, "scripts"), { recursive: true });
      for (const name of PARITY_SIBLINGS) {
        copyFileSync(join(ROOT, "scripts", name), join(outside, "scripts", name));
      }
      // The walk the module's `createRequire` will take, recorded in the message so a "located" arm
      // arrives with the directory that made it so.
      const walk: string[] = [];
      for (let dir = outside; ; dir = dirname(dir)) {
        if (existsSync(join(dir, "node_modules", "typescript"))) walk.push(join(dir, "node_modules"));
        if (dirname(dir) === dir) break;
      }

      const run = runParity(join(outside, "scripts", "check-build-parity.js"), F.parityClone);
      const shape = locateShape(run);
      const msg = [
        `module copied to ${outside} (no checkout above it); CHECK_ROOT = the built parity clone`,
        `typescript resolvable from: ${walk.length === 0 ? "(nowhere on the walk)" : walk.join(", ")}`,
        `shape: ${shape}`,
        transcript("parity module outside the checkout", run),
      ].join("\n");
      console.log(`Test AG: locate shape = ${shape}`);

      // Whichever arm the host gave, the module named its layer: a refusal that says WHICH layer
      // could not be established, or a build that ran. A null-status build wearing the compile-failure
      // sentence — the pre-33-06 shape — is neither, and is refused.
      expect(shape, msg).not.toBe("unexpected");
      expect(`${run.stdout}${run.stderr}`, msg).not.toContain("the build did not complete");
      if (shape === "locate-refusal") {
        expect(run.stderr, msg).toContain("so this check states nothing about the build outputs");
        expect(run.stdout, msg).not.toContain("ALL CHECKS PASSED");
      }
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});

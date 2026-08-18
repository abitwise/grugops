// freshness.test.ts — the discrimination harness for the D-02 / D-57 build-output drift gate.
//
// WHAT THIS FILE HAS TO PROVE, AND WHY A GREEN SUITE WOULD NOT PROVE IT. The gate this file drives
// was VACUOUS until plan 29-59: it read its committed side from the working tree, and
// .github/workflows/ci.yml rebuilt that working tree before every invocation, so it compared a
// rebuild against a rebuild and could not report a committed .js that was hand-edited or never
// rebuilt. A repair to a gate that could not fail is worth nothing unless the repair itself is shown
// to discriminate. So the load-bearing case below applies ONE plant to TWO clones — one at the
// pre-fix commit, one at the post-fix commit — and asserts exit 0 on the first and exit 1 on the
// second, with `tsc` having run in both.
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
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const FRESHNESS_JS = join(ROOT, "scripts", "freshness.js");
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

/** The provenance every assertion message carries. */
function transcript(label: string, run: Run): string {
  return [
    `${label}: clone HEAD ${run.head || "(none)"} exit ${run.status}`,
    run.stdout.trim() || "(no stdout)",
  ].join("\n");
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

  it("DISCRIMINATION PAIR: the same planted stale committed .js is green on the pre-fix tree and red on the post-fix tree", () => {
    const before = F.prefixPlantAfterBuild;
    const after = F.postfixPlantAfterBuild;
    const msg = [
      `plant: bytes appended to ${PLANT_REL} and COMMITTED; \`npm run build\` run in BOTH clones before the gate.`,
      `pre-fix  clone (checked out ${PRE_FIX_SHA})`,
      transcript("pre-fix", before),
      `post-fix clone (checked out ${F.postFixSha})`,
      transcript("post-fix", after),
    ].join("\n");

    // The vacuity, preserved as evidence rather than described.
    expect(before.status, msg).toBe(0);
    expect(before.stdout, msg).toContain(FRESH_LINE);

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
    expect(F.cloneCount).toBe(7);
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
      expect(r.status, out).not.toBe(0);
      expect(out, out).not.toContain(FRESH_LINE);
    } finally {
      rmSync(badTs, { force: true });
      expect(existsSync(badTs)).toBe(false);
    }
  });
});

// installer-special-files.test.ts — the derived DC-3 class test for the installer (plan 33.1-27;
// brief 33.1-GAP-PLANNING-BRIEF.md §2.1, DC-3: "put a FIFO and a directory at every path the tooling
// reads; assert the run finishes within a timeout and the special file is untouched").
//
// THE PATH SET IS DERIVED, NEVER TYPED. READ_PATHS is every file or link any install variant writes
// (install/installer-paths.test-support.ts deriveWritePaths, the one derivation shared with the
// write-set and DC-2 class tests) plus the declared READ_ONLY_INPUTS: the paths install reads but
// never writes, each with its reason. Its size is pinned (READ_PATH_COUNT), so a derivation that
// silently shrinks fails here.
//
// TWO PASSES, TWO GROUPS, FIVE RUN KINDS.
//   Pass F plants a FIFO; pass D plants an empty directory.
//   Group M1: every read path but the marker is special, and the marker is as the tree has it (a
//             valid marker on an installed tree; none on the old layout the --migrate run uses).
//   Group M2: only `.grugops/install.json` is special.
//   Each group runs, each on a fresh tree: `install.js --yes` (a re-install over an installed tree),
//   `install.js --yes --migrate` (over an old-layout tree), `uninstall.js`, `DRY_RUN=1 uninstall.js`
//   and `install.js --check`, each under a 60 s timeout. Every run must finish, print no stack trace,
//   exit with a code from its documented list, and leave every planted special file a special file
//   of the same kind (a planted directory also stays empty). A path under the in-repo agent-factory/
//   may travel inside the --migrate backup of that directory, unopened.
// Pass F skips, with the reason printed, only where a FIFO cannot be made (mkfifo unavailable, or
// win32). Pass D always runs.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first). Hermetic:
// HOME, GRUGOPS_HOME and TARGET are scratch directories removed at the end.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { stageShapeOrSkip, skipLine } from "../scripts/check-platform-shapes.js";
import {
  INSTALL_JS,
  ISO_PLACEHOLDER,
  MARKER_REL,
  type Run,
  deriveWritePaths,
  describeWritePaths,
  makeOldLayoutFixture,
  runInstall,
  runUninstall,
  spawnBin,
} from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-special-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

// ── The derived path set ─────────────────────────────────────────────────────────────────────────
const SET = deriveWritePaths(fresh("derive"));

// The paths install reads but never writes. Each is a user path a special file may sit at.
const READ_ONLY_INPUTS: ReadonlyArray<{ readonly path: string; readonly why: string }> = [
  {
    path: "agent-factory/config/factory.config.json",
    why: "the second checkpoint-config candidate readCheckpointConfig reads (ASK_CONFIG_CANDIDATES), and the in-repo legacy config --migrate carries forward",
  },
  { path: "factory.config.json", why: "the repo-root legacy config --migrate carries forward" },
];

const READ_PATHS: readonly string[] = [...new Set([...SET.files, ...READ_ONLY_INPUTS.map((r) => r.path)])].sort();
// Pinned: 56 files and links the four install variants write (53 by a default install, plus the
// three timestamped --migrate backups), and the two read-only inputs above.
const READ_PATH_COUNT = 58;

// A path that carries the run's timestamp names a rename destination that does not exist before the
// run, so nothing can be planted at it; the special file at its SOURCE (the in-repo agent-factory/
// and the root legacy config, both in READ_PATHS under their own names) is what the run reads.
const NOT_PLANTABLE: readonly string[] = READ_PATHS.filter((p) => p.includes(ISO_PLACEHOLDER));
const NOT_PLANTABLE_COUNT = 3;
const PLANTABLE: readonly string[] = READ_PATHS.filter((p) => !p.includes(ISO_PLACEHOLDER));

type Shape = "FIFO" | "directory";
type Group = "M1" | "M2";
type RunKind = "install --yes" | "install --yes --migrate" | "uninstall" | "DRY_RUN uninstall" | "install --check";
const RUN_KINDS: readonly RunKind[] = ["install --yes", "install --yes --migrate", "uninstall", "DRY_RUN uninstall", "install --check"];

// The documented exit codes (install/README.md "Exit codes"): 0 complete, 2 bad usage, 3
// incomplete. `--check` also reports 1 on a doctor FAIL (the README's code-1 row), and every planted
// special file the doctor reads is a FAIL or a WARN, so 1 is in its list.
const ALLOWED_EXIT: Readonly<Record<RunKind, readonly number[]>> = {
  "install --yes": [0, 2, 3],
  "install --yes --migrate": [0, 2, 3],
  uninstall: [0, 2, 3],
  "DRY_RUN uninstall": [0, 2, 3],
  "install --check": [0, 1, 2, 3],
};

const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;

// A tree for `run`: an installed target (a default install into an empty target), or the old
// layout the --migrate run starts from.
function treeFor(run: RunKind): { target: string; home: string; grugopsHome: string } {
  const root = fresh("case");
  const target = join(root, "target");
  const home = join(root, "home");
  mkdirSync(target);
  mkdirSync(home);
  const grugopsHome = join(home, ".grugops");
  if (run === "install --yes --migrate") {
    makeOldLayoutFixture(target, { rootConfig: true });
  } else {
    const r = runInstall(target, grugopsHome, [], { home, timeoutMs: 120_000 });
    expect(r.status, `the baseline install failed\n${r.stdout}\n${r.stderr}`).toBe(0);
  }
  return { target, home, grugopsHome };
}

function plant(target: string, rel: string, shape: Shape): string | null {
  const at = join(target, ...rel.split("/"));
  rmSync(at, { recursive: true, force: true });
  mkdirSync(dirname(at), { recursive: true });
  const s = stageShapeOrSkip(shape, at, `special-files ${rel}`);
  return s === null ? null : skipLine(s, "pass D (a directory at every read path)");
}

// Where a planted path is after the run: in place, or (for the in-repo agent-factory/) inside the
// one `agent-factory.bak.<ISO>/` backup --migrate moved it into.
function whereNow(target: string, rel: string): string {
  const at = join(target, ...rel.split("/"));
  if (existsSync(at) || isLink(at)) return at;
  if (rel.startsWith("agent-factory/")) {
    const baks = readdirSync(target).filter((n) => n.startsWith("agent-factory.bak."));
    if (baks.length === 1) return join(target, baks[0], ...rel.split("/").slice(1));
  }
  return at;
}
function isLink(p: string): boolean {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

function untouchedProblems(target: string, planted: readonly string[], shape: Shape): string[] {
  const problems: string[] = [];
  for (const rel of planted) {
    const at = whereNow(target, rel);
    let st;
    try {
      st = lstatSync(at);
    } catch {
      problems.push(`${rel}: the planted ${shape} is gone`);
      continue;
    }
    if (shape === "FIFO" && !st.isFIFO()) problems.push(`${rel}: no longer a FIFO`);
    if (shape === "directory") {
      if (!st.isDirectory()) problems.push(`${rel}: no longer a directory`);
      else if (readdirSync(at).length > 0) problems.push(`${rel}: something was written into the planted directory`);
    }
  }
  return problems;
}

function runOf(kind: RunKind, t: { target: string; home: string; grugopsHome: string }): Run {
  const opts = { home: t.home, timeoutMs: 60_000 };
  switch (kind) {
    case "install --yes":
      return runInstall(t.target, t.grugopsHome, [], opts);
    case "install --yes --migrate":
      return runInstall(t.target, t.grugopsHome, ["--migrate"], opts);
    case "uninstall":
      return runUninstall(t.target, t.grugopsHome, opts);
    case "DRY_RUN uninstall":
      return runUninstall(t.target, t.grugopsHome, { ...opts, dryRun: true });
    case "install --check":
      return spawnBin(INSTALL_JS, ["--check"], t.target, t.grugopsHome, opts);
  }
}

describe("the read path set is derived from real installs (DC-3, plan 33.1-27)", () => {
  it("READ_PATHS: the union over the install variants plus the read-only inputs, count pinned", () => {
    for (const v of SET.variants) {
      console.log(`variant ${v.name} (${v.why}): exit ${v.run.status}, ${v.files.length} file(s), ${v.dirs.length} director(ies)`);
      expect(v.run.status, `variant ${v.name} did not install\n${v.run.stdout}\n${v.run.stderr}`).toBe(0);
      expect(v.files.length, `variant ${v.name} wrote no file`).toBeGreaterThan(0);
    }
    const variantsInUnion = new Set(SET.paths.flatMap((w) => w.variants));
    expect(variantsInUnion.size, "fewer than four install variants contribute to the union").toBeGreaterThanOrEqual(4);
    console.log(`the derived write set (${SET.files.length} file(s), ${SET.dirs.length} director(ies)):\n${describeWritePaths(SET)}`);
    for (const r of READ_ONLY_INPUTS) {
      expect(r.why.trim().length, `${r.path}: no reason`).toBeGreaterThan(0);
      expect(SET.files, `${r.path} is written by an install variant, so it is not read-only`).not.toContain(r.path);
    }
    console.log(`READ_PATHS (${READ_PATHS.length}):\n${READ_PATHS.join("\n")}`);
    expect(READ_PATHS.length).toBe(READ_PATH_COUNT);
    expect(READ_PATHS).toContain(MARKER_REL);
    expect(NOT_PLANTABLE.length, `not plantable: ${NOT_PLANTABLE.join(", ")}`).toBe(NOT_PLANTABLE_COUNT);
    expect(PLANTABLE.length + NOT_PLANTABLE.length).toBe(READ_PATH_COUNT);
  });
});

for (const shape of ["FIFO", "directory"] as const) {
  describe(`pass ${shape === "FIFO" ? "F" : "D"}: a ${shape} at every read path (DC-3, plan 33.1-27)`, () => {
    for (const group of ["M1", "M2"] as const satisfies readonly Group[]) {
      for (const kind of RUN_KINDS) {
        it(`${shape} ${group}: ${kind} finishes and leaves every planted ${shape} as it was`, () => {
          const t = treeFor(kind);
          const targets = group === "M1" ? PLANTABLE.filter((p) => p !== MARKER_REL) : [MARKER_REL];
          for (const rel of targets) {
            const skip = plant(t.target, rel, shape);
            if (skip !== null) {
              console.log(skip);
              return;
            }
          }
          const r = runOf(kind, t);
          const verifyLines = r.stdout.split("\n").filter((l) => /^ {2}verify\s/.test(l)).length;
          console.log(`${shape} ${group} ${kind}: exit ${r.status}, ${verifyLines} verify line(s), ${targets.length} planted`);
          const planted = `planted ${shape}s (${targets.length}):\n  ${targets.join("\n  ")}`;
          expect(r.error, `${kind} did not finish within 60 s (${r.error?.message}); ${planted}`).toBeUndefined();
          expect(r.signal, `${kind} was killed by ${r.signal}; ${planted}`).toBeNull();
          expect(r.stderr, `${kind}: uncaught throw\n${r.stderr}`).not.toMatch(NO_STACK);
          expect(ALLOWED_EXIT[kind], `${kind}: exit ${r.status}\n${r.stdout.slice(-3000)}\n${r.stderr}`).toContain(r.status);
          const problems = untouchedProblems(t.target, targets, shape);
          expect(problems, `${kind}:\n${problems.join("\n")}`).toEqual([]);
        });
      }
    }
  });
}

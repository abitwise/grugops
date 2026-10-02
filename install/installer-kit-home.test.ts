// installer-kit-home.test.ts — the kit home must never overlap the target (plan 33.1-37, review
// CR-01, D-33 (b)).
//
// THE FINDING. KIT_ROOT is `<GRUGOPS_HOME>/agent-factory`, and nothing used to compare it with the
// target. With GRUGOPS_HOME set to the target, install renamed the user's in-repo agent-factory/ aside
// and deleted it recursively, exit 0, with no backup and no warning, and a DRY_RUN preview said only
// `would-copy`. So install now refuses, before any write and under DRY_RUN too, whenever the kit home
// and the target overlap in either direction after realpath.
//
// THE CASES. Every refusal shape runs real and DRY_RUN. Each must exit 1, write its reason to stderr,
// print nothing on stdout, and change zero bytes anywhere under the case's scratch root (the target and
// the kit home both live there). The one shape that must still install is a target inside the kit home
// but outside the kit root (GRUGOPS_HOME=$HOME, target $HOME/code/repo).
//
// Drives the COMMITTED install/install.js (npm run build first). Hermetic: HOME, GRUGOPS_HOME and TARGET
// are scratch directories removed at the end. Clear professional voice: this is a safety surface.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { INSTALL_JS, snapshotTree, spawnBin } from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-kit-home-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

const USER_CONFIG = '{"environments":["production"],"mine":"edited"}\n';

/** A user's repository at `dir`: a root file, and an in-repo agent-factory/ holding their config and notes. */
function userRepo(dir: string): void {
  mkdirSync(join(dir, "agent-factory", "config"), { recursive: true });
  writeFileSync(join(dir, "MYNOTES.md"), "the user's own notes at the repository root\n");
  writeFileSync(join(dir, "agent-factory", "config", "factory.config.json"), USER_CONFIG);
  writeFileSync(join(dir, "agent-factory", "MYNOTES.md"), "the user's own notes inside agent-factory/\n");
}

interface Shape {
  readonly name: string;
  readonly why: string;
  /** Lay the case out under `root` and return the target and the kit home. */
  readonly prepare: (root: string) => { readonly target: string; readonly grugopsHome: string };
}

const REFUSALS: readonly Shape[] = [
  {
    name: "kit-home-is-target",
    why: "GRUGOPS_HOME is the target, so the kit root is the target's own agent-factory/ (the reproduction)",
    prepare: (root) => {
      const target = join(root, "repo");
      userRepo(target);
      return { target, grugopsHome: target };
    },
  },
  {
    name: "kit-root-is-target",
    why: "the target is <GRUGOPS_HOME>/agent-factory, so the kit would replace the repository itself",
    prepare: (root) => {
      const home = join(root, "kithome");
      const target = join(home, "agent-factory");
      userRepo(target);
      return { target, grugopsHome: home };
    },
  },
  {
    name: "target-in-kit-root",
    why: "the target lies inside the kit root, so replacing the kit would remove the repository",
    prepare: (root) => {
      const home = join(root, "kithome");
      mkdirSync(join(home, "agent-factory"), { recursive: true });
      writeFileSync(join(home, "agent-factory", "USER.md"), "a file the user keeps beside the repository\n");
      const target = join(home, "agent-factory", "sub");
      userRepo(target);
      return { target, grugopsHome: home };
    },
  },
  {
    name: "kit-home-in-target",
    why: "GRUGOPS_HOME lies inside the target (and does not exist yet), so the kit would be written into the repository",
    prepare: (root) => {
      const target = join(root, "repo");
      userRepo(target);
      return { target, grugopsHome: join(target, ".tools", "grugops") };
    },
  },
  {
    name: "kit-home-is-a-link-to-target",
    why: "GRUGOPS_HOME is a symbolic link whose real path is the target (the comparison is by real path)",
    prepare: (root) => {
      const target = join(root, "repo");
      userRepo(target);
      const link = join(root, "home-link");
      symlinkSync(target, link);
      return { target, grugopsHome: link };
    },
  },
];

describe("CR-01: install refuses a kit home that overlaps the target, before any write (plan 33.1-37)", () => {
  for (const shape of REFUSALS) {
    for (const dryRun of [false, true]) {
      it(`${shape.name}${dryRun ? " (DRY_RUN)" : ""}: exit 1, the reason on stderr, nothing on stdout, zero bytes changed`, () => {
        const root = fresh(shape.name);
        const home = join(root, "user-home");
        mkdirSync(home);
        const { target, grugopsHome } = shape.prepare(root);
        const before = snapshotTree(root);
        const r = spawnBin(INSTALL_JS, ["--yes"], target, grugopsHome, { dryRun, home, timeoutMs: 120_000 });
        console.log(`${shape.name}${dryRun ? " DRY_RUN" : ""}: exit ${r.status}; stderr: ${r.stderr.trim()}`);
        expect(r.error, String(r.error)).toBeUndefined();
        expect(r.status, `${shape.why}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`).toBe(1);
        expect(r.stdout, "the refusal must come before anything reaches stdout").toBe("");
        expect(r.stderr).toMatch(/overlaps the target/);
        expect(r.stderr).toContain("Set GRUGOPS_HOME to a directory outside the repository");
        expect(r.stderr).toContain("Nothing was written.");
        expect(snapshotTree(root), `${shape.name}: something under the scratch root changed`).toBe(before);
      });
    }
  }

  it("a target inside the kit home but outside the kit root still installs (GRUGOPS_HOME=$HOME, target $HOME/code/repo)", () => {
    const root = fresh("home-holds-target");
    const home = join(root, "user-home");
    const target = join(home, "code", "repo");
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, "MYNOTES.md"), "the user's own notes\n");
    const r = spawnBin(INSTALL_JS, ["--yes"], target, home, { home, timeoutMs: 180_000 });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stderr).not.toMatch(/overlaps the target/);
  });
});

// marker-binding.test.ts — the install marker is install's record for ONE directory, and only install's
// own marker is used or replaced (red-team B2 and B3 of plan 33.1-33; brief DC-2,
// .planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-GAP-PLANNING-BRIEF.md §1).
//
// WHAT THE RED TEAM FOUND against the plan-33 build:
//   B2  the marker was "install's own" when three fields were strings (empty strings and an
//       installMode of "banana" passed), and nothing tied it to the directory it was written in. A
//       `.grugops/` copied from another installed repository into a repository that took README §1's
//       copy path made uninstall remove the user's AGENTS.md, their runnable, their tools/grugops/ and
//       the marker, exit 0 "complete". A hand-made marker made the legacy byte-identity fallback remove
//       the verbatim kit skills.
//   B3  install never asked whether the file at `.grugops/install.json` was its own: any JSON object
//       there (`{"mine":1}`, `{}`, `{"grugopsHome":1}`) was replaced, every key lost, with no backup,
//       reported `created`, and read as a previous install.
//
// THE RULE NOW (one authority, install-marker.ts readInstallMarker, asked by both binaries):
//   - a marker is install's own only when its fields hold install's values (grugopsHome and kitRoot
//     non-empty absolute paths, installMode copy or symlink, kitVersion a string when present, target a
//     non-empty absolute path) AND its `target` is this directory (its real path). Install writes
//     `target` in every marker;
//   - a JSON object that does not hold install's fields is not install's: uninstall and install use
//     none of it, leave it byte for byte, and report a counted verify (exit 3);
//   - an install-shaped marker for another directory, or one written before markers carried `target`,
//     is not this directory's record: uninstall uses none of it and changes nothing (exit 3, with the
//     remedy); install replaces it with a marker for this directory and carries none of its records;
//   - a moved or renamed repository therefore reads as not bound until the human re-binds it (re-run
//     install, or set `target` by hand when it is the same repository).
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first). Hermetic:
// HOME, GRUGOPS_HOME and TARGET are scratch directories removed at the end. Clear professional voice:
// this is a safety surface.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { INSTALL_JS, MARKER_REL, REPO_ROOT, type Run, makeFixture, nativeRealPath, runInstall, runUninstall, snapshotTree } from "./installer-paths.test-support.js";
import { dirList, fileRecords } from "./ledger.test-support.js";
import { realTargetPath } from "./user-file.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-binding-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}
const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;
const HOME = fresh("home");
const KIT_HOME = join(HOME, ".grugops");
const at = (t: string, rel: string): string => join(t, ...rel.split("/"));
const lines = (stdout: string, label: string): string[] => stdout.split("\n").filter((l) => new RegExp(`^ {2}${label}\\s`).test(l));
function install(t: string, dryRun = false, args: readonly string[] = []): Run {
  const r = runInstall(t, KIT_HOME, args, { dryRun, home: HOME, timeoutMs: 180_000 });
  expect(r.stderr).not.toMatch(NO_STACK);
  return r;
}
function uninstall(t: string, dryRun = false): Run {
  const r = runUninstall(t, KIT_HOME, { dryRun, home: HOME, timeoutMs: 120_000 });
  expect(r.stderr).not.toMatch(NO_STACK);
  return r;
}
/**
 * The product's own spelling of `d`'s real path (user-file.ts realTargetPath, the value install writes the
 * marker `target` with; plan 34-12, D-19, WIN-1). Every expected recorded target is taken from here, never
 * from `realpathSync.native` (the host's backslash spelling on Windows) or the SCRATCH string (which keeps
 * an 8.3 short name), so neither spelling decides a test.
 */
function recordedTarget(d: string): string {
  const p = realTargetPath(d);
  if (p === null) throw new Error(`the real path of ${d} could not be read`);
  return p;
}
const markerOf = (t: string): Record<string, unknown> => JSON.parse(readFileSync(at(t, MARKER_REL), "utf8")) as Record<string, unknown>;

describe("install's marker is bound to its directory, and only install's own marker is used or replaced (red-team B2, B3 of plan 33.1-33)", () => {
  it("install writes `target`, the real path of the directory it installed into", () => {
    const t = makeFixture(fresh("bound"));
    const r = install(t);
    expect(r.status, r.stdout).toBe(0);
    expect(markerOf(t).target).toBe(recordedTarget(t));
  });

  // B3: a JSON object at the marker path that is not install's own marker, before any install.
  const FOREIGN: ReadonlyArray<readonly [string, string]> = [
    ["a user's object", '{"mine":1,"note":"my own file"}\n'],
    ["an empty object", "{}\n"],
    ["grugopsHome not a string", '{"grugopsHome":1}\n'],
    ["empty strings and installMode banana", '{"grugopsHome":"","kitRoot":"","installMode":"banana"}\n'],
    ["relative paths", '{"grugopsHome":"home","kitRoot":"home/agent-factory","installMode":"copy"}\n'],
    ["target not a string", '{"grugopsHome":"/x","kitRoot":"/x/agent-factory","installMode":"copy","target":7}\n'],
  ];
  for (const dryRun of [false, true]) {
    const mode = dryRun ? "DRY_RUN" : "real";
    for (const [what, body] of FOREIGN) {
      it(`B3 (${mode}): ${what} at .grugops/install.json is left byte for byte, never read as a previous install, and the run is a counted verify (exit 3)`, () => {
        const t = makeFixture(fresh("foreign"));
        mkdirSync(at(t, ".grugops"), { recursive: true });
        writeFileSync(at(t, MARKER_REL), body);
        const r = install(t, dryRun);
        expect(r.status, r.stdout).toBe(3);
        expect(readFileSync(at(t, MARKER_REL), "utf8"), r.stdout).toBe(body);
        expect(lines(r.stdout, "verify").some((l) => l.includes(".grugops/install.json")), r.stdout).toBe(true);
        expect(r.stdout).not.toMatch(/^ {2}(created|would-add)\s+\.grugops\/install\.json/m);
        expect(r.stdout).not.toMatch(/kitVersion kept at/);
      });
    }
  }

  it("B2/B3: install over an install-shaped marker copied from another installed repository binds a new marker to this directory and carries none of the copied records, so uninstall keeps the user's own AGENTS.md and runnable", () => {
    const other = makeFixture(fresh("other"));
    expect(install(other).status).toBe(0);
    const t = fresh("copied-into");
    cpSync(at(other, "AGENTS.md"), at(t, "AGENTS.md"));
    mkdirSync(at(t, "tools/grugops"), { recursive: true });
    cpSync(at(other, "tools/grugops/host-protection.js"), at(t, "tools/grugops/host-protection.js"));
    mkdirSync(at(t, ".grugops"), { recursive: true });
    cpSync(at(other, MARKER_REL), at(t, MARKER_REL));
    const r = install(t);
    expect(r.status, r.stdout).toBe(0);
    const m = markerOf(t);
    expect(m.target, r.stdout).toBe(recordedTarget(t));
    expect(Object.keys(fileRecords(m, false)), r.stdout).not.toContain("AGENTS.md");
    expect(Object.keys(fileRecords(m, false)), r.stdout).not.toContain("tools/grugops/host-protection.js");
    expect(dirList(m), r.stdout).not.toContain("tools/grugops");
    expect(r.stdout).toMatch(/^ {2}note\s+\.grugops\/install\.json: .*written for another directory/m);
    const agents = readFileSync(at(t, "AGENTS.md"));
    const runnable = readFileSync(at(t, "tools/grugops/host-protection.js"));
    const u = uninstall(t);
    expect(existsSync(at(t, "AGENTS.md")) && readFileSync(at(t, "AGENTS.md")).equals(agents), u.stdout).toBe(true);
    expect(existsSync(at(t, "tools/grugops/host-protection.js")) && readFileSync(at(t, "tools/grugops/host-protection.js")).equals(runnable), u.stdout).toBe(true);
  });

  for (const dryRun of [false, true]) {
    const mode = dryRun ? "DRY_RUN" : "real";
    it(`B2 (${mode}): a moved repository reads as not bound — uninstall changes zero bytes, exit 3, and names both directories and the remedy`, () => {
      const t = makeFixture(fresh("before-move"));
      expect(install(t).status).toBe(0);
      // The recorded spelling of the directory install wrote in, taken before it stops existing.
      const recorded = recordedTarget(t);
      const moved = `${t}-moved`;
      renameSync(t, moved);
      const before = snapshotTree(moved);
      const u = uninstall(moved, dryRun);
      expect(u.status, u.stdout).toBe(3);
      expect(snapshotTree(moved), u.stdout).toBe(before);
      const v = lines(u.stdout, "verify").find((l) => l.includes(".grugops/install.json")) ?? "";
      expect(v, u.stdout).toContain(recorded);
      expect(v, u.stdout).toContain(recordedTarget(moved));
      expect(v, u.stdout).toMatch(/re-run install/);
    });
  }

  // The remedy binds in either spelling of this directory's real path (plan 34-12, D-19, WIN-1): the one
  // the remedy text prints (the product's realTargetPath), and the host's native spelling a Windows user
  // types by hand (`C:\Users\...`, nativeRealPath). Both spellings name one directory, so both bind.
  const REMEDY_SPELLINGS: ReadonlyArray<readonly [string, (d: string) => string]> = [
    ["the spelling the remedy prints (realTargetPath)", recordedTarget],
    ["the host's native spelling a user types (nativeRealPath)", nativeRealPath],
  ];
  it("the remedy is proven in both spellings", () => {
    expect(REMEDY_SPELLINGS.length).toBe(2);
  });
  for (const [spelling, spell] of REMEDY_SPELLINGS) {
    it(`B2: after the remedy (target set to this directory by hand in ${spelling}, for the same repository moved), uninstall reverses the install`, () => {
      const t = makeFixture(fresh("rebind"));
      expect(install(t).status).toBe(0);
      const moved = `${t}-moved`;
      renameSync(t, moved);
      const m = markerOf(moved);
      m.target = spell(moved);
      writeFileSync(at(moved, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
      const u = uninstall(moved);
      expect(u.status, u.stdout).toBe(0);
      expect(existsSync(at(moved, MARKER_REL)), u.stdout).toBe(false);
      expect(existsSync(at(moved, "AGENTS.md")), u.stdout).toBe(false);
    });
  }

  it("sibling (--check): the doctor warns that a marker written for another directory is not this directory's record", () => {
    const other = makeFixture(fresh("doc-other"));
    expect(install(other).status).toBe(0);
    const t = `${other}-copy`;
    cpSync(other, t, { recursive: true, verbatimSymlinks: true });
    const d = spawnSync(process.execPath, [INSTALL_JS, "--check"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_HOME: KIT_HOME, HOME, TARGET: t, GRUGOPS_SRC: REPO_ROOT },
    });
    expect(d.stdout, d.stdout).toMatch(/WARN\s+.*install marker .* written for another directory/);
  });

  it("value validation at the source: INSTALL_MODE other than copy or symlink is refused as bad usage (exit 2), before any write", () => {
    const t = makeFixture(fresh("mode"));
    const before = snapshotTree(t);
    const r = spawnSync(process.execPath, [INSTALL_JS, "--yes"], {
      encoding: "utf8",
      env: { ...process.env, INSTALL_MODE: "banana", GRUGOPS_HOME: KIT_HOME, HOME, TARGET: t, GRUGOPS_SRC: REPO_ROOT },
    });
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stderr).toMatch(/INSTALL_MODE/);
    expect(snapshotTree(t)).toBe(before);
  });
});

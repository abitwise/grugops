// installer-cross-version.test.ts — uninstall reverses what the install ledger records, whatever kit
// source runs it (plan 33.1-38, review WR-01 and IN-06, D-33 (b), brief DC-2).
//
// WHAT WENT WRONG. Uninstall used to remove the names the uninstalling checkout's kit source ships. The
// review reproduced the result: a recorded adapter that checkout did not ship was left in place and named
// nowhere, while the marker that recorded it was deleted, exit 0. Another grugops version, or another
// checkout, cannot be assumed to ship what this install wrote.
//
// THE CLASS RULE TESTED HERE. Run uninstall with a kit source that holds none of what install wrote
// (UNINSTALL_SOURCE_VARIANTS: an empty directory, an unreadable source, another checkout after a --symlink
// install). Every file entry of the install's own ledger whose record still holds is removed and named on
// a `removed` line; a recorded file that was edited is left byte for byte and named; a grugops-shaped file
// install never recorded is left and named, with no verify. The set of recorded files and its size come
// from the installed marker's ledger (ledger.test-support.ts markerLedger, which parses the JSON itself and
// never calls the production reader), checked by this file's own record check, never typed by hand.
//
// Hermetic: every run is inside a scratch directory removed afterwards. It drives the COMMITTED
// install/install.js and install/uninstall.js (npm run build first).
//
// Clear professional voice: this is a safety surface (installer reversal).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { appendFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UNINSTALL_SOURCE_VARIANTS, runInstall, runUninstallWithSource, snapshotTree, type UninstallSourceVariantSpec } from "./installer-paths.test-support.js";
import { markerLedger, type RawEntry } from "./ledger.test-support.js";

// RECORDED_FILE_COUNT: the file entries a default install (copy or --symlink) into an empty git target
// records: 17 adapters under .claude/agents/, 7 skills under .claude/skills/, AGENTS.md, the 4 runnables
// under tools/grugops/, and the 2 pointer files install creates there (CLAUDE.md and
// .github/copilot-instructions.md, each holding only install's block). The test DERIVES the set from the
// ledger and asserts its size equals this pin, so a change to what install records shows here by name.
const RECORDED_FILE_COUNT = 31;
const RECORDED_FILE_COUNT_WHY =
  "17 adapters + 7 skills + AGENTS.md + 4 runnables + the 2 pointer files install created (CLAUDE.md, .github/copilot-instructions.md)";

let SCRATCH = "";
beforeAll(() => {
  SCRATCH = mkdtempSync(join(tmpdir(), "grugops-cross-version-"));
});
afterAll(() => {
  if (SCRATCH !== "") rmSync(SCRATCH, { recursive: true, force: true });
});

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The output lines that start with `verb` and name `rel` as their path. */
const linesFor = (stdout: string, verb: string, rel: string): string[] =>
  stdout.split("\n").filter((l) => new RegExp(`^\\s*${verb}\\s+${esc(rel)}(\\s|$)`).test(l));
const verifyLines = (stdout: string): string[] => stdout.split("\n").filter((l) => /^\s*verify\s/.test(l));
const isGone = (p: string): boolean => {
  try {
    lstatSync(p);
    return false;
  } catch {
    return true;
  }
};

/** This file's own check that `path` still holds a file entry's content record (sha256 + mode, or link). */
function holds(target: string, e: RawEntry): boolean {
  const p = join(target, ...e.path.split("/"));
  const content = String(e.content);
  let st;
  try {
    st = lstatSync(p);
  } catch {
    return false;
  }
  if (content.startsWith("link:")) return st.isSymbolicLink() && readlinkSync(p) === content.slice("link:".length);
  const m = /^sha256:([0-9a-f]{64})(?:;mode=([0-7]{4}))?$/.exec(content);
  if (m === null || !st.isFile()) return false;
  if (createHash("sha256").update(readFileSync(p)).digest("hex") !== m[1]) return false;
  return m[2] === undefined || (st.mode & 0o7777).toString(8).padStart(4, "0") === m[2];
}

interface Installed {
  readonly target: string;
  readonly grugopsHome: string;
  readonly home: string;
  /** The ledger's file entries, read from the marker before uninstall runs. */
  readonly files: readonly RawEntry[];
}

/** Install from this repository into a fresh, empty target under its own directory, and read the file entries. */
function installed(name: string, args: readonly string[]): Installed {
  const root = join(SCRATCH, name);
  const target = join(root, "target");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  const grugopsHome = join(home, ".grugops");
  const r = runInstall(target, grugopsHome, args, { home, timeoutMs: 180_000 });
  expect(r.status, `${name}: install exited ${r.status}\n${r.stdout}\n${r.stderr}`).toBe(0);
  const files = markerLedger(target).filter((e) => e.kind === "file");
  return { target, grugopsHome, home, files };
}

describe("uninstall walks the install ledger, whatever kit source runs it (plan 33.1-38, WR-01, IN-06)", () => {
  it("the uninstall-source variants are the three named, each with a reason", () => {
    expect(UNINSTALL_SOURCE_VARIANTS.map((v) => v.name)).toEqual(["empty-source", "unreadable-source", "other-checkout-symlink"]);
    for (const v of UNINSTALL_SOURCE_VARIANTS) expect(v.why.trim().length, v.name).toBeGreaterThan(0);
  });

  for (const spec of UNINSTALL_SOURCE_VARIANTS) {
    it(`${spec.name}: every recorded file that holds its record is removed and named, counted from the ledger`, () => {
      const inst = installed(spec.name, spec.installArgs);
      const holding = inst.files.filter((e) => holds(inst.target, e));
      console.log(
        `installer-cross-version: ${spec.name}: ${inst.files.length} file entr(ies) recorded, ${holding.length} holding; ` +
          `RECORDED_FILE_COUNT = ${RECORDED_FILE_COUNT} (${RECORDED_FILE_COUNT_WHY})`,
      );
      expect(inst.files.length, "the file entries the install ledger holds").toBe(RECORDED_FILE_COUNT);
      expect(holding.map((e) => e.path), "every recorded file holds its record right after install").toEqual(inst.files.map((e) => e.path));
      if (spec.name === "other-checkout-symlink") {
        expect(inst.files.some((e) => String(e.content).startsWith("link:")), "the --symlink install recorded no link").toBe(true);
      }
      const src = (spec as UninstallSourceVariantSpec).source(join(SCRATCH, spec.name, "src"));
      const u = runUninstallWithSource(inst.target, inst.grugopsHome, src, { home: inst.home, timeoutMs: 180_000 });
      expect(u.status, `${spec.name}: uninstall exited ${u.status}\n${u.stdout}\n${u.stderr}`).toBe(0);
      expect(verifyLines(u.stdout), u.stdout).toEqual([]);
      expect(u.stdout).toContain("== uninstall complete ==");
      const problems: string[] = [];
      for (const e of holding) {
        if (!isGone(join(inst.target, ...e.path.split("/")))) problems.push(`${e.path}: still present`);
        if (linesFor(u.stdout, "removed", e.path).length === 0) problems.push(`${e.path}: no removed line`);
      }
      expect(problems, `${problems.join("\n")}\n${u.stdout}`).toEqual([]);
    }, 400_000);
  }

  it("empty-source, DRY_RUN: every recorded file is named on a would-remove line, and nothing changes", () => {
    const inst = installed("dry-run", []);
    expect(inst.files.length).toBe(RECORDED_FILE_COUNT);
    const src = UNINSTALL_SOURCE_VARIANTS[0].source(join(SCRATCH, "dry-run", "src"));
    const before = snapshotTree(inst.target);
    const u = runUninstallWithSource(inst.target, inst.grugopsHome, src, { home: inst.home, dryRun: true, timeoutMs: 180_000 });
    expect(u.status, u.stdout).toBe(0);
    expect(snapshotTree(inst.target), "DRY_RUN changed the target").toBe(before);
    const unnamed = inst.files.filter((e) => linesFor(u.stdout, "would-remove", e.path).length === 0).map((e) => e.path);
    expect(unnamed, u.stdout).toEqual([]);
  }, 400_000);

  it("empty-source: one recorded adapter edited by one byte is left byte for byte and named; every other recorded file is removed", () => {
    const inst = installed("edited", []);
    const adapter = inst.files.find((e) => e.path.startsWith(".claude/agents/") && e.kit === true);
    expect(adapter, "no recorded adapter in the ledger").toBeDefined();
    const p = join(inst.target, ...adapter!.path.split("/"));
    appendFileSync(p, "x");
    const edited = readFileSync(p);
    const src = UNINSTALL_SOURCE_VARIANTS[0].source(join(SCRATCH, "edited", "src"));
    const u = runUninstallWithSource(inst.target, inst.grugopsHome, src, { home: inst.home, timeoutMs: 180_000 });
    expect(readFileSync(p).equals(edited), "the edited adapter did not survive byte for byte").toBe(true);
    const left = linesFor(u.stdout, "left", adapter!.path);
    expect(left.length, u.stdout).toBe(1);
    expect(left[0]).toMatch(/does not hold what the install ledger records install wrote there/);
    const others = inst.files.filter((e) => e.path !== adapter!.path);
    expect(others.length).toBe(RECORDED_FILE_COUNT - 1);
    const kept = others.filter((e) => !isGone(join(inst.target, ...e.path.split("/")))).map((e) => e.path);
    expect(kept, u.stdout).toEqual([]);
  }, 400_000);

  it("a grugops-shaped file install never recorded is left and named, with no verify", () => {
    const inst = installed("unrecorded", []);
    const rel = ".claude/agents/grugops-mine.md";
    expect(inst.files.some((e) => e.path === rel), `${rel} is in the ledger`).toBe(false);
    const mine = "my own agent, never installed\n";
    writeFileSync(join(inst.target, ...rel.split("/")), mine);
    const src = UNINSTALL_SOURCE_VARIANTS[0].source(join(SCRATCH, "unrecorded", "src"));
    const u = runUninstallWithSource(inst.target, inst.grugopsHome, src, { home: inst.home, timeoutMs: 180_000 });
    expect(readFileSync(join(inst.target, ...rel.split("/")), "utf8")).toBe(mine);
    const left = linesFor(u.stdout, "left", rel);
    expect(left.length, u.stdout).toBe(1);
    expect(left[0]).toMatch(/install has no record of writing it/);
    expect(verifyLines(u.stdout).filter((l) => l.includes(rel)), u.stdout).toEqual([]);
    expect(u.status, u.stdout).toBe(0);
  }, 400_000);
});

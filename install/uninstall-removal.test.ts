// uninstall-removal.test.ts — the red-team cases against plan 33.1-27 (brief 33.1-GAP-PLANNING-BRIEF.md
// §3: every red-team break is fixed before the next plan starts).
//
// WHAT IS HELD HERE.
//   B1 (DC-3, never crashes): a symbolic link to a directory at a path uninstall removes by name made
//      rmSync throw ERR_FS_EISDIR on Node 24 (exit 1, half the removals done). No throw may escape.
//   B2 (no fabrication, D-18): a dangling link was reported `removed` and stayed (Node 24), and a
//      link loop, a link to /dev/zero, /dev/tty, an outside FIFO, directory or file was deleted on
//      both Node versions. uninstall removes a link only when it is exactly the link install makes
//      (the shared isOwnLink predicate), reports `removed` only when the path is really gone, and
//      the DRY_RUN preview and the real run reach the same decision for every path.
//   B3 (DC-2): the marker was read through a link, so a never-installed repository whose
//      `.grugops` (or marker) was a link into another install lost a user file and two directories.
//   B4 (DC-2): a marker uninstall had just reported unreadable or malformed was then deleted.
//   B5 (no fabrication): an unparseable `.gemini/settings.json` printed an uncounted stderr line and
//      then `removed ... AGENTS.md entry` at exit 0. The same uncounted verify sat in install.
//   and the siblings: install --migrate's symlink-adapter unlink and --prune-old-kit's removal used
//   rmSync the same way; `--check` called a present but unreadable marker "not installed".
//
// THE PATH SET IS DERIVED, NEVER TYPED. The paths uninstall removes by name are taken from the shared
// derivation of every path install writes (install/installer-paths.test-support.ts deriveWritePaths):
// the kit skills and adapters, the runnables, and AGENTS.md. Their counts are pinned, so a derivation
// that silently shrinks fails here. The link install itself makes at each path is cross-checked
// against what the --symlink variant actually wrote.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first), with HOME,
// GRUGOPS_HOME and TARGET in scratch directories removed at the end. Run it on Node 22 and on Node 24:
// rmSync's handling of a link differs between them, and each break showed on at least one.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  statSync,
  truncateSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { stageShapeOrSkip, stageSymlinkOrSkip, skipLine } from "../scripts/check-platform-shapes.js";
import {
  INSTALL_JS,
  MARKER_REL,
  REPO_ROOT,
  type Run,
  deriveWritePaths,
  makeOldLayoutFixture,
  runInstall,
  runUninstall,
  snapshotTree,
  spawnBin,
} from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-removal-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;
const POSITION = "install/uninstall-removal.test.ts";

// ── the derived removal set ─────────────────────────────────────────────────────────────────────
const SET = deriveWritePaths(fresh("derive"));
const KIT_PATH = /^\.claude\/(skills\/[^/]+\/SKILL\.md|agents\/[^/]+\.md)$/;
const RUNNABLE_PATH = /^tools\/grugops\/[^/]+\.js$/;
/** The grugops skills and adapters: removed by name when present (plan 33.1-30 adds the content record). */
const KIT_PATHS = SET.files.filter((p) => KIT_PATH.test(p));
/** The runnables: removed only when byte-identical to their kit source. */
const RUNNABLE_PATHS = SET.files.filter((p) => RUNNABLE_PATH.test(p));
const AGENTS = "AGENTS.md";
// Pinned: 7 skills and 17 adapters; 4 runnables. A derivation that loses one fails here.
const KIT_PATH_COUNT = 24;
const RUNNABLE_PATH_COUNT = 4;
const REMOVED_BY_NAME = [...KIT_PATHS, ...RUNNABLE_PATHS, AGENTS];

/** The link install itself makes at `rel` (linkOrCopy's symlinkSync(src, dest)): the kit source path. */
const ownLinkTarget = (rel: string): string => join(REPO_ROOT, ...rel.split("/"));

// One report line: its label and its message, with the scratch paths normalized so two targets
// compare equal.
interface Line {
  readonly label: string;
  readonly msg: string;
}
function linesFor(stdout: string, rel: string, target: string): Line[] {
  const out: Line[] = [];
  for (const line of stdout.split("\n")) {
    const m = /^ {2}(\S+)\s+(.+)$/.exec(line);
    if (m === null) continue;
    const msg = m[2].split(target).join("<T>").split(SCRATCH).join("<S>");
    if (msg === rel || msg.startsWith(`${rel} `) || msg.startsWith(`${rel}:`)) out.push({ label: m[1], msg });
  }
  return out;
}
/** The decision a run printed for `rel`, with the preview's `would-remove` read as the real run's `removed`. */
function decisionOf(stdout: string, rel: string, target: string): string {
  return linesFor(stdout, rel, target)
    .map((l) => `${l.label === "would-remove" ? "removed" : l.label.replace(/^would-/, "")} ${l.msg}`)
    .join(" | ");
}

function expectFinished(r: Run, what: string): void {
  expect(r.error, `${what}: did not finish (${r.error?.message})`).toBeUndefined();
  expect(r.signal, `${what}: killed by ${r.signal}`).toBeNull();
  expect(r.stderr, `${what}: uncaught throw\n${r.stderr}`).not.toMatch(NO_STACK);
  expect(r.stderr, `${what}: an error on stderr\n${r.stderr}`).not.toMatch(/ERR_FS_|Error:/);
}

function installedTree(tag: string, args: readonly string[] = []): { target: string; home: string; grugopsHome: string } {
  const root = fresh(tag);
  const target = join(root, "target");
  const home = join(root, "home");
  mkdirSync(target);
  mkdirSync(home);
  const grugopsHome = join(home, ".grugops");
  const r = runInstall(target, grugopsHome, args, { home, timeoutMs: 120_000 });
  expect(r.status, `the baseline install failed\n${r.stdout}\n${r.stderr}`).toBe(0);
  return { target, home, grugopsHome };
}

describe("the removal set is derived (red-team of plan 33.1-27)", () => {
  it("the kit skills and adapters, the runnables and AGENTS.md come from the shared derivation, counts pinned", () => {
    console.log(`kit paths (${KIT_PATHS.length}):\n  ${KIT_PATHS.join("\n  ")}`);
    console.log(`runnables (${RUNNABLE_PATHS.length}):\n  ${RUNNABLE_PATHS.join("\n  ")}`);
    expect(KIT_PATHS.length).toBe(KIT_PATH_COUNT);
    expect(RUNNABLE_PATHS.length).toBe(RUNNABLE_PATH_COUNT);
    expect(SET.files).toContain(AGENTS);
  });

  it("the link install makes at each path is exactly the kit source path (what the --symlink variant wrote)", () => {
    const sym = SET.variant("symlink");
    const linked = SET.paths.filter((w) => w.kinds.symlink === "symlink").map((w) => w.path);
    expect(linked.length, "the --symlink variant wrote no link").toBeGreaterThan(0);
    for (const rel of linked) {
      expect(REMOVED_BY_NAME, `${rel} is a link install makes but not in the removal set`).toContain(rel);
      expect(readlinkSync(join(sym.target, ...rel.split("/"))), rel).toBe(ownLinkTarget(rel));
    }
  });
});

// ── B1 / B2: a link install did not make, at every path uninstall removes by name ───────────────
type LinkShape =
  | "link to an outside directory"
  | "dangling link"
  | "link loop"
  | "link to /dev/zero"
  | "link to /dev/tty"
  | "link to an outside FIFO"
  | "link to an outside regular file";
const LINK_SHAPES: readonly LinkShape[] = [
  "link to an outside directory",
  "dangling link",
  "link loop",
  "link to /dev/zero",
  "link to /dev/tty",
  "link to an outside FIFO",
  "link to an outside regular file",
];

interface Planted {
  readonly rel: string;
  readonly link: string;
}

/** Plant `shape` at every path in REMOVED_BY_NAME; the outside objects live beside the target. */
function plantLinks(target: string, shape: LinkShape): { planted: Planted[]; outside: string; skip: string | null } {
  const outside = `${target}.outside`;
  mkdirSync(outside, { recursive: true });
  writeFileSync(join(outside, "file"), "OUTSIDE USER FILE\n");
  mkdirSync(join(outside, "dir"), { recursive: true });
  writeFileSync(join(outside, "dir", "keep"), "keep\n");
  if (shape === "link to an outside FIFO") {
    const s = stageShapeOrSkip("FIFO", join(outside, "fifo"), `${POSITION} ${shape}`);
    if (s !== null) return { planted: [], outside, skip: skipLine(s, "the other link shapes") };
  }
  const planted: Planted[] = [];
  REMOVED_BY_NAME.forEach((rel, i) => {
    const at = join(target, ...rel.split("/"));
    rmSync(at, { recursive: true, force: true });
    mkdirSync(dirname(at), { recursive: true });
    const link =
      shape === "link to an outside directory"
        ? join(outside, "dir")
        : shape === "dangling link"
          ? join(outside, `nothing-${i}`)
          : shape === "link loop"
            ? at
            : shape === "link to /dev/zero"
              ? "/dev/zero"
              : shape === "link to /dev/tty"
                ? "/dev/tty"
                : shape === "link to an outside FIFO"
                  ? join(outside, "fifo")
                  : join(outside, "file");
    const s = stageSymlinkOrSkip(link, at, shape, `${POSITION} ${rel}`);
    if (s !== null) throw new Error(skipLine(s, "none"));
    planted.push({ rel, link });
  });
  return { planted, outside, skip: null };
}

function outsideProblems(outside: string, shape: LinkShape): string[] {
  const p: string[] = [];
  if (readFileSync(join(outside, "file"), "utf8") !== "OUTSIDE USER FILE\n") p.push("the outside file changed");
  if (readdirSync(join(outside, "dir")).join(",") !== "keep") p.push("the outside directory changed");
  if (shape === "link to an outside FIFO" && !lstatSync(join(outside, "fifo")).isFIFO()) p.push("the outside FIFO is gone");
  if (readdirSync(outside).some((n) => n.startsWith("nothing-"))) p.push("something was created at a dangling link's target");
  return p;
}

const canSymlink = process.platform !== "win32";

describe.skipIf(!canSymlink)("B1/B2: a link install did not make, at every path uninstall removes by name (red-team of plan 33.1-27)", () => {
  for (const shape of LINK_SHAPES) {
    it(`${shape}: no throw, every link left as it was and reported, never 'removed', and the preview decides as the real run does`, () => {
      const decisions = new Map<string, Map<string, string>>();
      for (const dry of [true, false]) {
        const t = installedTree(`links-${dry ? "dry" : "real"}`);
        const { planted, outside, skip } = plantLinks(t.target, shape);
        if (skip !== null) {
          console.log(skip);
          return;
        }
        const r = runUninstall(t.target, t.grugopsHome, { home: t.home, dryRun: dry, timeoutMs: 60_000 });
        const what = `${dry ? "DRY_RUN " : ""}uninstall, ${shape}`;
        expectFinished(r, what);
        expect(r.status, `${what}: exit ${r.status}\n${r.stdout}`).toBe(3);
        // The run went on past the links to its last step: the marker line and the closing banner.
        expect(r.stdout, `${what}: the run stopped early\n${r.stdout}`).toMatch(/== uninstall INCOMPLETE/);
        expect(linesFor(r.stdout, MARKER_REL, t.target).map((l) => l.label), `${what}: no marker line`).toContain(
          dry ? "would-remove" : "removed",
        );
        const byPath = new Map<string, string>();
        for (const { rel, link } of planted) {
          const at = join(t.target, ...rel.split("/"));
          const st = lstatSync(at, { throwIfNoEntry: false });
          expect(st?.isSymbolicLink(), `${what}: ${rel} is no longer the planted link`).toBe(true);
          expect(readlinkSync(at), `${what}: ${rel} was re-pointed`).toBe(link);
          const lines = linesFor(r.stdout, rel, t.target);
          const labels = lines.map((l) => l.label);
          expect(labels.length, `${what}: no line names ${rel}\n${r.stdout}`).toBeGreaterThan(0);
          expect(labels, `${what}: ${rel} reported as removed while it is still there`).not.toContain("removed");
          expect(labels, `${what}: ${rel} previewed as removed`).not.toContain("would-remove");
          if (rel !== AGENTS) expect(labels, `${what}: ${rel} is not a counted verify`).toContain("verify");
          byPath.set(rel, decisionOf(r.stdout, rel, t.target));
        }
        expect(outsideProblems(outside, shape), what).toEqual([]);
        decisions.set(dry ? "dry" : "real", byPath);
      }
      const dry = decisions.get("dry")!;
      const real = decisions.get("real")!;
      const differ = [...real].filter(([rel, d]) => dry.get(rel) !== d).map(([rel, d]) => `${rel}\n  real: ${d}\n  dry:  ${dry.get(rel)}`);
      expect(differ, `the preview and the real run decided differently:\n${differ.join("\n")}`).toEqual([]);
    });
  }

  it("the link install makes (to the exact kit source) is removed at every kit path and AGENTS.md, and is gone; a link at a runnable is left", () => {
    const decisions = new Map<string, Map<string, string>>();
    for (const dry of [true, false]) {
      const t = installedTree(`own-${dry ? "dry" : "real"}`);
      for (const rel of REMOVED_BY_NAME) {
        const at = join(t.target, ...rel.split("/"));
        rmSync(at, { force: true });
        const s = stageSymlinkOrSkip(ownLinkTarget(rel), at, "the link install makes", `${POSITION} ${rel}`);
        if (s !== null) {
          console.log(skipLine(s, "the link shapes above"));
          return;
        }
      }
      const r = runUninstall(t.target, t.grugopsHome, { home: t.home, dryRun: dry, timeoutMs: 60_000 });
      const what = `${dry ? "DRY_RUN " : ""}uninstall, own links`;
      expectFinished(r, what);
      // Install never links a runnable (materializeRunnable writes a regular file), so a link there
      // is not install's: it is left and counted.
      expect(r.status, `${what}: exit ${r.status}\n${r.stdout}`).toBe(3);
      const byPath = new Map<string, string>();
      for (const rel of REMOVED_BY_NAME) {
        const at = join(t.target, ...rel.split("/"));
        const labels = linesFor(r.stdout, rel, t.target).map((l) => l.label);
        const gone = lstatSync(at, { throwIfNoEntry: false }) === undefined;
        if (RUNNABLE_PATHS.includes(rel)) {
          expect(gone, `${what}: the link at runnable ${rel} was removed`).toBe(false);
          expect(labels, `${what}: ${rel}`).toContain("verify");
        } else if (rel === AGENTS) {
          // Red-team of plan 33.1-28 (R1): this copy install recorded the bytes it copied to AGENTS.md.
          // A link put there since is not what install made at that path, so it is left, even though
          // it is the shape of link a --symlink install makes (that install records the link, and its
          // uninstall removes it: install.test.ts "file ownership ... AGENTS.md link").
          expect(gone, `${what}: AGENTS.md was removed although it no longer holds what install wrote`).toBe(false);
          expect(labels, `${what}: ${rel}\n${r.stdout}`).toContain("left");
        } else if (dry) {
          expect(labels, `${what}: ${rel}\n${r.stdout}`).toContain("would-remove");
          expect(gone, `${what}: the preview removed ${rel}`).toBe(false);
        } else {
          expect(labels, `${what}: ${rel}\n${r.stdout}`).toContain("removed");
          expect(gone, `${what}: ${rel} was reported removed and is still there`).toBe(true);
        }
        byPath.set(rel, decisionOf(r.stdout, rel, t.target));
      }
      expect(existsSync(ownLinkTarget(KIT_PATHS[0])), "the kit source itself was touched").toBe(true);
      decisions.set(dry ? "dry" : "real", byPath);
    }
    const dry = decisions.get("dry")!;
    const differ = [...decisions.get("real")!].filter(([rel, d]) => dry.get(rel) !== d).map(([rel, d]) => `${rel}\n  real: ${d}\n  dry:  ${dry.get(rel)}`);
    expect(differ, `the preview and the real run decided differently:\n${differ.join("\n")}`).toEqual([]);
  });
});

// ── B3: the marker is never read through a link ─────────────────────────────────────────────────
describe.skipIf(!canSymlink)("B3: a link at the marker, or on the way to it, makes it unreadable (red-team of plan 33.1-27)", () => {
  for (const where of [".grugops", MARKER_REL] as const) {
    it(`a never-installed repository whose ${where} is a link into an installed one changes by zero bytes (real and DRY_RUN), and --check says the marker is unreadable`, () => {
      const a = installedTree("marker-a");
      const aMarker = JSON.parse(readFileSync(join(a.target, ".grugops", "install.json"), "utf8")) as {
        claudeAskRules: { added: string[]; createdFile: boolean };
        createdDirs: string[];
      };
      // PREMISE: A's ledger is the one that would delete B's files if it were believed.
      expect(aMarker.claudeAskRules.createdFile).toBe(true);
      expect(aMarker.createdDirs).toEqual(expect.arrayContaining([".claude", ".github"]));
      const userRule = aMarker.claudeAskRules.added[0];
      const aBefore = snapshotTree(a.target);

      for (const dry of [false, true]) {
        const b = fresh(`marker-b-${dry ? "dry" : "real"}`);
        const home = fresh("marker-b-home");
        mkdirSync(join(b, ".claude"), { recursive: true });
        mkdirSync(join(b, ".github"), { recursive: true });
        writeFileSync(join(b, ".claude", "settings.json"), JSON.stringify({ permissions: { ask: [userRule] } }) + "\n");
        if (where === ".grugops") {
          expect(stageSymlinkOrSkip(join(a.target, ".grugops"), join(b, ".grugops"), "linked .grugops", POSITION)).toBeNull();
        } else {
          mkdirSync(join(b, ".grugops"));
          expect(stageSymlinkOrSkip(join(a.target, ".grugops", "install.json"), join(b, ".grugops", "install.json"), "linked marker", POSITION)).toBeNull();
        }
        const bBefore = snapshotTree(b);
        const r = runUninstall(b, join(home, ".grugops"), { home, dryRun: dry, timeoutMs: 60_000 });
        const what = `${dry ? "DRY_RUN " : ""}uninstall of B (${where} linked into A)`;
        expectFinished(r, what);
        expect(r.status, `${what}: exit ${r.status}\n${r.stdout}`).toBe(3);
        expect(r.stdout, what).toMatch(/verify\s+\.grugops\/install\.json could not be read as a JSON object \(.*symbolic link/);
        expect(r.stdout, `${what}: an ask rule was removed on A's ledger`).not.toMatch(/(removed|would-remove)\s+\.claude\/settings\.json/);
        expect(snapshotTree(b), `${what}: B changed`).toBe(bBefore);
        expect(snapshotTree(a.target), `${what}: A changed`).toBe(aBefore);
      }

      const c = fresh("marker-c");
      const home = fresh("marker-c-home");
      if (where === ".grugops") {
        expect(stageSymlinkOrSkip(join(a.target, ".grugops"), join(c, ".grugops"), "linked .grugops", POSITION)).toBeNull();
      } else {
        mkdirSync(join(c, ".grugops"));
        expect(stageSymlinkOrSkip(join(a.target, ".grugops", "install.json"), join(c, ".grugops", "install.json"), "linked marker", POSITION)).toBeNull();
      }
      const chk = spawnBin(INSTALL_JS, ["--check"], c, join(home, ".grugops"), { home, timeoutMs: 60_000 });
      expectFinished(chk, "--check");
      expect(chk.status, chk.stdout).toBe(1);
      expect(chk.stdout, chk.stdout).toMatch(/FAIL\s+the install marker .*\.grugops\/install\.json is present but could not be read/);
      expect(chk.stdout, chk.stdout).not.toMatch(/grugops not installed/);
    });
  }
});

// ── B4: a marker the run could not use is never deleted ─────────────────────────────────────────
type MarkerDamage = "not JSON" | "createdDirs not an array" | "claudeAskRules not an object" | "larger than the read bound";
const MARKER_DAMAGE: readonly MarkerDamage[] = ["not JSON", "createdDirs not an array", "claudeAskRules not an object", "larger than the read bound"];

function damageMarker(target: string, damage: MarkerDamage): void {
  const m = join(target, ".grugops", "install.json");
  const marker = JSON.parse(readFileSync(m, "utf8")) as Record<string, unknown>;
  if (damage === "not JSON") writeFileSync(m, "user notes, not json\n");
  if (damage === "createdDirs not an array") writeFileSync(m, JSON.stringify({ ...marker, createdDirs: "garbage" }, null, 2) + "\n");
  if (damage === "claudeAskRules not an object") writeFileSync(m, JSON.stringify({ ...marker, claudeAskRules: 5 }, null, 2) + "\n");
  if (damage === "larger than the read bound") truncateSync(m, 3 * 1024 * 1024 * 1024); // sparse: nothing is written
}

describe("B4: uninstall deletes the marker only when it read it and every ledger in it is well-formed (red-team of plan 33.1-27)", () => {
  for (const damage of MARKER_DAMAGE) {
    it(`a marker that is ${damage}: left in place and reported, real and DRY_RUN decide alike, exit 3`, () => {
      const decisions: string[] = [];
      for (const dry of [true, false]) {
        const t = installedTree(`damage-${dry ? "dry" : "real"}`);
        damageMarker(t.target, damage);
        const m = join(t.target, ".grugops", "install.json");
        const before = damage === "larger than the read bound" ? `size ${statSync(m).size}` : readFileSync(m, "utf8");
        const r = runUninstall(t.target, t.grugopsHome, { home: t.home, dryRun: dry, timeoutMs: 60_000 });
        const what = `${dry ? "DRY_RUN " : ""}uninstall, marker ${damage}`;
        expectFinished(r, what);
        expect(r.status, `${what}: exit ${r.status}\n${r.stdout}`).toBe(3);
        const labels = linesFor(r.stdout, MARKER_REL, t.target).map((l) => l.label);
        expect(labels, `${what}\n${r.stdout}`).toContain("left");
        expect(labels, `${what}: the marker was removed`).not.toContain("removed");
        expect(labels, `${what}: the marker was previewed as removed`).not.toContain("would-remove");
        const after = damage === "larger than the read bound" ? `size ${statSync(m).size}` : readFileSync(m, "utf8");
        if (dry || damage === "not JSON" || damage === "larger than the read bound") {
          expect(after, `${what}: the marker changed`).toBe(before);
        } else {
          // Red-team of plan 33.1-28 (R2): a marker kept for a malformed ledger is rewritten without
          // the entries this run removed. The malformed ledger and the identity fields are as found.
          const a = JSON.parse(after) as Record<string, unknown>;
          const b = JSON.parse(before) as Record<string, unknown>;
          expect(Object.keys(a), what).toEqual(Object.keys(b));
          for (const k of ["kitVersion", "grugopsHome", "kitRoot", "installMode"]) expect(a[k], `${what}: ${k}`).toEqual(b[k]);
          const bad = damage === "createdDirs not an array" ? "createdDirs" : "claudeAskRules";
          expect(a[bad], `${what}: the malformed ledger changed`).toEqual(b[bad]);
          expect(labels, `${what}\n${r.stdout}`).toContain("edited");
        }
        decisions.push(
          linesFor(r.stdout, MARKER_REL, t.target)
            .filter((l) => l.label === "left")
            .map((l) => l.msg)
            .join(" | "),
        );
      }
      expect(decisions[0], "the preview and the real run decided differently").toBe(decisions[1]);
    });
  }
});

// ── B5: an unparseable Gemini settings file is a counted verify, never 'removed' ────────────────
const GEMINI_REL = ".gemini/settings.json";
const GEMINI_UNPARSEABLE: ReadonlyArray<{ readonly name: string; readonly body: string }> = [
  { name: "a comment before the JSON", body: '// c\n{ "context": { "fileName": ["AGENTS.md"] } }\n' },
  { name: "a JSON array, not an object", body: '["AGENTS.md"]\n' },
  { name: "JSON null", body: "null\n" },
];

describe("B5: an unparseable .gemini/settings.json is a counted verify on both sides (red-team of plan 33.1-27)", () => {
  for (const g of GEMINI_UNPARSEABLE) {
    it(`uninstall, ${g.name}: exit 3, a verify line, no 'removed' line, the file byte-identical (real and DRY_RUN)`, () => {
      for (const dry of [false, true]) {
        const t = installedTree(`gemini-un-${dry ? "dry" : "real"}`);
        const f = join(t.target, ".gemini", "settings.json");
        writeFileSync(f, g.body);
        const r = runUninstall(t.target, t.grugopsHome, { home: t.home, dryRun: dry, timeoutMs: 60_000 });
        const what = `${dry ? "DRY_RUN " : ""}uninstall, Gemini ${g.name}`;
        expectFinished(r, what);
        expect(r.stderr, `${what}: a verify written to stderr, uncounted`).not.toMatch(/verify/);
        const labels = linesFor(r.stdout, GEMINI_REL, t.target).map((l) => l.label);
        if (g.body.includes("AGENTS.md")) {
          expect(r.status, `${what}: exit ${r.status}\n${r.stdout}`).toBe(3);
          expect(labels, `${what}\n${r.stdout}`).toContain("verify");
        }
        expect(labels, `${what}: reported removed`).not.toContain("removed");
        expect(labels, `${what}: previewed as an edit`).not.toContain("would-edit");
        expect(readFileSync(f, "utf8"), `${what}: the file changed`).toBe(g.body);
      }
    });

    it(`install, ${g.name}: no crash, exit 3, a verify line, the file byte-identical`, () => {
      const root = fresh("gemini-in");
      const target = join(root, "target");
      const home = join(root, "home");
      mkdirSync(join(target, ".gemini"), { recursive: true });
      mkdirSync(home);
      writeFileSync(join(target, ".gemini", "settings.json"), g.body);
      const r = runInstall(target, join(home, ".grugops"), [], { home, timeoutMs: 120_000 });
      const what = `install, Gemini ${g.name}`;
      expectFinished(r, what);
      expect(r.status, `${what}: exit ${r.status}\n${r.stdout}`).toBe(3);
      expect(linesFor(r.stdout, GEMINI_REL, target).map((l) => l.label), `${what}\n${r.stdout}`).toContain("verify");
      expect(readFileSync(join(target, ".gemini", "settings.json"), "utf8")).toBe(g.body);
    });
  }
});

// ── siblings in install.js: the --migrate symlink-adapter unlink and --prune-old-kit ────────────
describe.skipIf(!canSymlink)("install.js removals of a link (siblings of B1/B2, red-team of plan 33.1-27)", () => {
  it("--migrate over an old layout with a link to a directory and a dangling link at adapter paths: no throw, and 'unlinked' only for a path that is gone", () => {
    const root = fresh("migrate");
    const target = makeOldLayoutFixture(join(root, "target"));
    const home = join(root, "home");
    mkdirSync(home);
    mkdirSync(join(root, "outdir"));
    writeFileSync(join(root, "outdir", "keep"), "keep\n");
    const toDir = join(target, ".claude", "agents", KIT_PATHS.find((p) => p.startsWith(".claude/agents/"))!.split("/").pop()!);
    const dangling = join(target, ".claude", "agents", KIT_PATHS.filter((p) => p.startsWith(".claude/agents/"))[1].split("/").pop()!);
    rmSync(toDir, { force: true });
    rmSync(dangling, { force: true });
    expect(stageSymlinkOrSkip(join(root, "outdir"), toDir, "link to a directory", POSITION)).toBeNull();
    expect(stageSymlinkOrSkip(join(root, "nothing"), dangling, "dangling link", POSITION)).toBeNull();
    const r = runInstall(target, join(home, ".grugops"), ["--migrate"], { home, timeoutMs: 120_000 });
    expectFinished(r, "install --migrate");
    expect([0, 3], `exit ${r.status}\n${r.stdout}`).toContain(r.status);
    for (const p of [toDir, dangling]) {
      const unlinked = r.stdout.split("\n").some((l) => /^ {2}unlinked\s/.test(l) && l.includes(p));
      const st = lstatSync(p, { throwIfNoEntry: false });
      if (unlinked) expect(st === undefined || !st.isSymbolicLink(), `${p} reported unlinked and is still the link`).toBe(true);
    }
    expect(readdirSync(join(root, "outdir"))).toEqual(["keep"]);
  });

  it("--prune-old-kit with a dangling link named like a backup: 'removed' only when it is gone", () => {
    const root = fresh("prune");
    const target = join(root, "target");
    const home = join(root, "home");
    mkdirSync(target);
    mkdirSync(home);
    const bak = join(target, "agent-factory.bak.2026-01-01T00-00-00.000Z");
    expect(stageSymlinkOrSkip(join(root, "nothing"), bak, "dangling link", POSITION)).toBeNull();
    const r = spawnBin(INSTALL_JS, ["--prune-old-kit"], target, join(home, ".grugops"), { home, timeoutMs: 60_000 });
    expectFinished(r, "--prune-old-kit");
    const removed = r.stdout.split("\n").some((l) => /^ {2}removed\s/.test(l) && l.includes(bak));
    const present = lstatSync(bak, { throwIfNoEntry: false }) !== undefined;
    expect(removed && present, `reported removed and still present\n${r.stdout}`).toBe(false);
    expect(removed || present, "gone without a line").toBe(true);
  });
});

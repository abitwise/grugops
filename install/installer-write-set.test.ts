// installer-write-set.test.ts — the red-team fixes for plan 33.1-26 (brief 33.1-GAP-PLANNING-BRIEF.md
// §3: a red-team break is fixed before the next plan starts).
//
// WHAT THE RED TEAM BROKE, AGAINST THE COMMITTED install.js:
//   1. DC-3: `--check` and `--update` read the shared kit's VERSION with a raw read. A FIFO there hung
//      the run (or, with a writer blocked on it, released the writer and printed its bytes as the
//      verdict); a symlink to /dev/zero grew memory without bound.
//   2. DC-3 / D-18: readUserFile answered `absent` for ENOTDIR, so a FIFO or a regular file where a
//      directory install writes into should be made every caller write, and the run died on an
//      uncaught ENOTDIR (exit 1) after other files were already written.
//   3. D-18: a dangling symbolic link read as `absent`, and the write that followed went through it,
//      OUTSIDE the target (every seed file, every runnable, CLAUDE.md, ...). A link into a missing
//      directory, or a link loop, crashed the run.
//   4. DC-1 flavour: the doctor printed `ok` for plans/board.md with a FIFO there.
//   5. `--migrate` renamed the legacy config to .bak while the destination was a FIFO it never wrote.
//
// THE CLASS TEST (brief §2.1). The write set is DERIVED, never typed. Since plan 33.1-27 it comes
// from the ONE shared derivation, install/installer-paths.test-support.ts deriveWritePaths (the union
// over the default, --symlink, --migrate and checkpoints-at-notify installs), which the DC-3
// special-files test and the DC-2 class tests use too (brief §2.2: one authority per rule). This
// file plants into an EMPTY target and runs a default install, so it takes the union's paths that do
// not carry a --migrate run timestamp, and asserts that they are exactly what the default variant
// wrote. Its size is cross-checked against two independent derivations — the default install's own
// write-report lines, and the `createdDirs` ledger it recorded — so a derivation that silently
// shrinks fails the count. Then, one fresh target per (path, shape): a FIFO with a writer blocked on it, a dangling
// link to a file outside the target, a dangling link into a missing directory, a link loop, a link
// to a regular file outside the target, and a link to /dev/zero at every FILE path; and a FIFO with
// a blocked writer, a regular file, a dangling link and a link to an empty directory outside the
// target at every DIRECTORY path. Each run must finish within its timeout, print no stack trace,
// exit 3 with a `verify` line naming the path, leave the planted thing exactly as it was (a blocked
// writer stays blocked), and write nothing outside the target.
//
// Drives the COMMITTED install/install.js and install/user-file.js (npm run build first). Hermetic:
// HOME, GRUGOPS_HOME and TARGET are all scratch directories; the real repository and the real home
// are never targeted.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import {
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { stageShapeOrSkip, stageSymlinkOrSkip, skipLine } from "../scripts/check-platform-shapes.js";
import { ISO_PLACEHOLDER, MARKER_REL, deriveWritePaths, runInstall, runUninstall } from "./installer-paths.test-support.js";

const USER_FILE_JS = join(import.meta.dirname, "user-file.js");

// One scratch root for the whole file, removed at the end. realpath'd so a macOS /var → /private/var
// spelling never makes an "outside" check compare two names for one directory.
const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-wset-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

// The shared hermetic runner: no inherited DRY_RUN, copy mode, HOME, GRUGOPS_HOME and TARGET all
// scratch directories, `--yes` always.
function runInstaller(target: string, home: string, timeoutMs: number, ...args: string[]) {
  return runInstall(target, join(home, ".grugops"), args, { home, timeoutMs });
}

// A stack trace on stderr is the mark of an uncaught throw.
const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;

// A writer blocked in open(2) on a FIFO until a reader opens it. A writer that has exited after the
// run is proof the run opened the FIFO.
function startBlockedFifoWriter(fifo: string): ChildProcess {
  return spawn(process.execPath, ["-e", "require('node:fs').writeFileSync(process.argv[1], 'junk')", fifo], {
    stdio: "ignore",
  });
}
const pause = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const stillRunning = (c: ChildProcess): boolean => c.exitCode === null && c.signalCode === null;

// Every file and every directory under `root`, as POSIX paths relative to it, by lstat (a link is
// neither followed nor counted as a directory).
function walk(root: string): { files: string[]; dirs: string[] } {
  const files: string[] = [];
  const dirs: string[] = [];
  const visit = (rel: string): void => {
    for (const name of readdirSync(join(root, rel))) {
      const r = rel === "" ? name : `${rel}/${name}`;
      const st = lstatSync(join(root, r));
      if (st.isDirectory()) {
        dirs.push(r);
        visit(r);
      } else {
        files.push(r);
      }
    }
  };
  visit("");
  return { files: files.sort(), dirs: dirs.sort() };
}

// ── The derived write set: the shared derivation (plan 33.1-27) ─────────────────────────────────
const SET = deriveWritePaths(fresh("derive"));
const BASE_VARIANT = SET.variant("default");
const BASE = BASE_VARIANT.run;
const BASE_TARGET = BASE_VARIANT.target;
// The union's paths that carry a --migrate run timestamp name a rename destination that does not
// exist before that run; a default install into an empty target never writes them, so this file
// cannot ask about them. They are declared and counted, not dropped silently.
const TIMESTAMPED = [...SET.files, ...SET.dirs].filter((p) => p.includes(ISO_PLACEHOLDER));
const WRITE_FILES = SET.files.filter((p) => !p.includes(ISO_PLACEHOLDER));
const WRITE_DIRS = SET.dirs.filter((p) => !p.includes(ISO_PLACEHOLDER));
// Independent derivation 1: the install's own write-report lines for target files.
const REPORTED_WRITES = (BASE.stdout ?? "")
  .split("\n")
  .filter((l) => /^ {2}(created|materialized|copied\(verify\)|linked)\s/.test(l)).length;
// Independent derivation 2: the directory ledger install recorded.
function baseCreatedDirs(): string[] {
  try {
    const marker = JSON.parse(readFileSync(join(BASE_TARGET, ".grugops", "install.json"), "utf8")) as {
      createdDirs?: unknown;
    };
    return Array.isArray(marker.createdDirs) ? (marker.createdDirs as string[]).slice().sort() : [];
  } catch {
    return [];
  }
}

// No exclusion: plan 33.1-27 routed readInstallMarker through readUserFile, so a FIFO or a
// /dev/zero link at the marker is asked like every other path (it used to be the one declared,
// counted exclusion).

type FileShape = "FIFO" | "dangling-outside" | "dangling-missing-dir" | "loop" | "link-outside-file" | "/dev/zero";
const FILE_SHAPES: readonly FileShape[] = [
  "FIFO",
  "dangling-outside",
  "dangling-missing-dir",
  "loop",
  "link-outside-file",
  "/dev/zero",
];
type DirShape = "FIFO" | "regular-file" | "dangling-link" | "link-outside-dir";
const DIR_SHAPES: readonly DirShape[] = ["FIFO", "regular-file", "dangling-link", "link-outside-dir"];

interface Planted {
  readonly skip: string | null;
  readonly writer: ChildProcess | null;
  /** Re-checks the planted thing and the outside directory after the run. */
  readonly check: () => void;
}

// Plant `shape` at `rel` in a fresh target; `outside` is a sibling directory the target never names.
function plantAt(target: string, outside: string, rel: string, shape: FileShape | DirShape): Planted {
  const at = join(target, ...rel.split("/"));
  mkdirSync(dirname(at), { recursive: true });
  const outsideListing = (): string[] => walk(outside).files.concat(walk(outside).dirs).sort();
  const outsideBefore = (): string[] => outsideListing();
  const link = (to: string, label: string): string | null => {
    const s = stageSymlinkOrSkip(to, at, label, `write-set ${rel}`);
    return s === null ? null : skipLine(s, "the FIFO and regular-file shapes");
  };
  switch (shape) {
    case "FIFO": {
      const s = stageShapeOrSkip("FIFO", at, `write-set ${rel}`);
      if (s !== null) return { skip: skipLine(s, "the link shapes"), writer: null, check: () => {} };
      const before = outsideBefore();
      return {
        skip: null,
        writer: startBlockedFifoWriter(at),
        check: () => {
          expect(lstatSync(at).isFIFO(), `${rel}: the FIFO was replaced`).toBe(true);
          expect(outsideListing(), `${rel}: something was written outside the target`).toEqual(before);
        },
      };
    }
    case "regular-file": {
      writeFileSync(at, "USER FILE WHERE A DIRECTORY GOES\n");
      const before = outsideBefore();
      return {
        skip: null,
        writer: null,
        check: () => {
          expect(lstatSync(at).isFile(), `${rel}: the regular file was replaced`).toBe(true);
          expect(readFileSync(at, "utf8")).toBe("USER FILE WHERE A DIRECTORY GOES\n");
          expect(outsideListing(), `${rel}: something was written outside the target`).toEqual(before);
        },
      };
    }
    case "dangling-outside":
    case "dangling-missing-dir":
    case "dangling-link": {
      const to =
        shape === "dangling-missing-dir" ? join(outside, "missing-dir", "escaped") : join(outside, "escaped");
      const skip = link(to, "dangling symlink");
      const before = outsideBefore();
      return {
        skip,
        writer: null,
        check: () => {
          expect(lstatSync(at).isSymbolicLink(), `${rel}: the link was replaced`).toBe(true);
          expect(readlinkSync(at)).toBe(to);
          expect(existsSync(to), `${rel}: a write went through the dangling link to ${to}`).toBe(false);
          expect(outsideListing(), `${rel}: something was written outside the target`).toEqual(before);
        },
      };
    }
    case "loop": {
      const other = `${at}.loop-partner`;
      const s1 = stageSymlinkOrSkip(other, at, "symlink loop", `write-set ${rel}`);
      const s2 = s1 === null ? stageSymlinkOrSkip(at, other, "symlink loop", `write-set ${rel}`) : s1;
      const before = outsideBefore();
      return {
        skip: s2 === null ? null : skipLine(s2, "the FIFO shape"),
        writer: null,
        check: () => {
          expect(readlinkSync(at)).toBe(other);
          expect(readlinkSync(other)).toBe(at);
          expect(outsideListing()).toEqual(before);
        },
      };
    }
    case "link-outside-file": {
      const to = join(outside, "user-file");
      writeFileSync(to, "USER FILE OUTSIDE THE TARGET\n");
      const skip = link(to, "symlink to a regular file outside the target");
      const before = outsideBefore();
      return {
        skip,
        writer: null,
        check: () => {
          expect(readlinkSync(at)).toBe(to);
          expect(readFileSync(to, "utf8"), `${rel}: a write went through the link`).toBe("USER FILE OUTSIDE THE TARGET\n");
          expect(outsideListing()).toEqual(before);
        },
      };
    }
    case "link-outside-dir": {
      const to = join(outside, "user-dir");
      mkdirSync(to);
      const skip = link(to, "symlink to a directory outside the target");
      const before = outsideBefore();
      return {
        skip,
        writer: null,
        check: () => {
          expect(readlinkSync(at)).toBe(to);
          expect(readdirSync(to), `${rel}: something was written through the linked directory`).toEqual([]);
          expect(outsideListing()).toEqual(before);
        },
      };
    }
    case "/dev/zero": {
      if (process.platform === "win32") {
        return { skip: "SKIPPED /dev/zero shape: a POSIX device path", writer: null, check: () => {} };
      }
      const skip = link("/dev/zero", "symlink to /dev/zero");
      return {
        skip,
        writer: null,
        check: () => {
          expect(readlinkSync(at)).toBe("/dev/zero");
        },
      };
    }
  }
}

// The shared verdict: finished, no stack, exit 3, and a `verify` line naming the path.
function expectRefusedAndReported(r: ReturnType<typeof runInstaller>, rel: string, ctx: string): void {
  expect(r.error, `${ctx}: the run did not finish in time`).toBeUndefined();
  expect(r.signal, ctx).toBeNull();
  expect(r.stderr, `${ctx}: uncaught throw\n${r.stderr}`).not.toMatch(NO_STACK);
  const verifyLines = (r.stdout ?? "").split("\n").filter((l) => /^ {2}verify\s/.test(l));
  expect(
    verifyLines.some((l) => l.includes(rel)),
    `${ctx}: no verify line names ${rel}\n${(r.stdout ?? "").slice(-3000)}`,
  ).toBe(true);
  expect(r.status, `${ctx}\n${(r.stdout ?? "").slice(-2000)}\n${r.stderr}`).toBe(3);
}

async function runShapeCase(rel: string, shape: FileShape | DirShape): Promise<void> {
  const root = fresh("case");
  const target = join(root, "target");
  const outside = join(root, "outside");
  const home = join(root, "home");
  mkdirSync(target);
  mkdirSync(outside);
  mkdirSync(home);
  const planted = plantAt(target, outside, rel, shape);
  if (planted.skip !== null) {
    console.log(planted.skip);
    return;
  }
  try {
    if (planted.writer) {
      await pause(300);
      expect(stillRunning(planted.writer), "the writer did not block (premise)").toBe(true);
    }
    const r = runInstaller(target, home, 30_000);
    expectRefusedAndReported(r, rel, `${shape} at ${rel}`);
    if (planted.writer) {
      await pause(300);
      expect(stillRunning(planted.writer), `install opened the FIFO at ${rel}: the blocked writer was released`).toBe(true);
    }
    planted.check();
  } finally {
    planted.writer?.kill("SIGKILL");
  }
}

describe("the write set is derived from a real baseline install (red-team of plan 33.1-26)", () => {
  it("write set: the baseline install completed, and its file and directory sets agree with two independent derivations", () => {
    expect(BASE.status, `${BASE.stdout}\n${BASE.stderr}`).toBe(0);
    console.log(`write set: ${WRITE_FILES.length} file(s), ${WRITE_DIRS.length} director(ies) under the baseline target`);
    // Files: every file under the target is one write-report line (created / materialized / copied /
    // linked), and the only unreported write is none: the counts are equal.
    expect(WRITE_FILES.length, "the baseline wrote no file: the class test would ask nothing").toBeGreaterThan(0);
    expect(WRITE_FILES.length, "the file walk and the install's write report disagree").toBe(REPORTED_WRITES);
    // Directories: exactly the createdDirs ledger install recorded.
    expect(WRITE_DIRS.length).toBeGreaterThan(0);
    expect(WRITE_DIRS).toEqual(baseCreatedDirs());
    // The union's untimestamped part is exactly what a default install writes: a path only another
    // variant writes would need a variant-aware case here, so it fails this line rather than a
    // shape case with a misleading message.
    expect(WRITE_FILES, "the union holds a file path a default install does not write").toEqual([...BASE_VARIANT.files]);
    expect(WRITE_DIRS, "the union holds a directory a default install does not create").toEqual([...BASE_VARIANT.dirs]);
    // The timestamped --migrate backups, declared and counted: 5 files (3 `.bak.<ISO>` and, since
    // plan 33.1-32, the 2 D-32 `.grugops-edited-<ISO>` backups of the old layout's kit files) and 4
    // directories.
    console.log(`write set: ${TIMESTAMPED.length} timestamped --migrate path(s) not asked here: ${TIMESTAMPED.join(", ")}`);
    expect(TIMESTAMPED.length).toBe(9);
    expect(WRITE_FILES).toContain(MARKER_REL);
  });
});

describe("a special file or a link at every file path install writes (DC-3, D-18, red-team of plan 33.1-26)", () => {
  for (const rel of WRITE_FILES) {
    for (const shape of FILE_SHAPES) {
      it(`write set: ${shape} at ${rel}`, async () => {
        await runShapeCase(rel, shape);
      });
    }
  }
});

describe("a special file or a link where every directory install writes into should be (DC-3, D-18, red-team of plan 33.1-26)", () => {
  for (const rel of WRITE_DIRS) {
    for (const shape of DIR_SHAPES) {
      it(`write set: ${shape} at directory ${rel}`, async () => {
        await runShapeCase(rel, shape);
      });
    }
  }
});

// ── Hard links (red-team carry #9, plan 33.1-29) ───────────────────────────────────────────────
// A hard link is a second name for the same file. A write, an append or a rewrite in place through
// one name changes the file under every name, including a name outside the target. readForWrite is
// the one question every write asks first, so the rule lives there: a regular file with more than
// one name is `blocked`, and nothing is written, appended or rewritten through it. The path set is
// the derived write set; one run covers every path at once, and every outside name must keep its
// bytes. Each case links every path, then runs the binary once.
describe("a hard link at every file path install writes or uninstall edits (red-team carry #9, plan 33.1-29)", () => {
  // Link `rel` under `target` to a new file under `outside` that holds `bytes`; returns the outside path.
  const hardLink = (target: string, outside: string, rel: string, bytes: Buffer | string): string => {
    const out = join(outside, rel.split("/").join("__"));
    writeFileSync(out, bytes);
    const at = join(target, ...rel.split("/"));
    mkdirSync(dirname(at), { recursive: true });
    rmSync(at, { force: true });
    linkSync(out, at);
    return out;
  };
  const outsideBytes = (outside: string): Map<string, string> =>
    new Map(readdirSync(outside).map((n) => [n, readFileSync(join(outside, n)).toString("base64")]));

  it("hard links: install over a hard link at every file path it writes changes no outside name (exit 3, no stack trace)", () => {
    const root = fresh("hl-install");
    const target = join(root, "target");
    const outside = join(root, "outside");
    const home = join(root, "home");
    for (const d of [target, outside, home]) mkdirSync(d);
    // A JSON path gets a JSON object install would merge into (.gemini/settings.json,
    // .claude/settings.json), so the refusal is asked of the merge and not of a parse failure.
    for (const rel of WRITE_FILES) hardLink(target, outside, rel, rel.endsWith(".json") ? `{"outside":${JSON.stringify(rel)}}\n` : `OUTSIDE ${rel}\n`);
    const before = outsideBytes(outside);
    expect(before.size).toBe(WRITE_FILES.length);
    const r = runInstaller(target, home, 120_000);
    expect(r.error, "the run did not finish").toBeUndefined();
    expect(r.stderr, r.stderr).not.toMatch(NO_STACK);
    const changed = [...outsideBytes(outside)].filter(([n, b]) => before.get(n) !== b).map(([n]) => n);
    expect(changed, `install wrote through a hard link, changing the outside name(s)\n${r.stdout.slice(-3000)}`).toEqual([]);
    expect(r.status, `${r.stdout.slice(-3000)}\n${r.stderr}`).toBe(3);
  });

  it("hard links: uninstall over an installed tree whose every file is hard-linked outside changes no outside name (real and DRY_RUN)", () => {
    for (const dry of [false, true]) {
      const root = fresh(`hl-uninstall-${dry ? "dry" : "real"}`);
      const target = join(root, "target");
      const outside = join(root, "outside");
      const home = join(root, "home");
      for (const d of [target, outside, home]) mkdirSync(d);
      const i = runInstaller(target, home, 120_000);
      expect(i.status, i.stdout).toBe(0);
      const files = walk(target).files.filter((rel) => rel !== MARKER_REL);
      expect(files.length).toBe(WRITE_FILES.length - 1);
      for (const rel of files) hardLink(target, outside, rel, readFileSync(join(target, ...rel.split("/"))));
      const before = outsideBytes(outside);
      const r = runUninstall(target, join(home, ".grugops"), { home, dryRun: dry, timeoutMs: 120_000 });
      expect(r.error, "the run did not finish").toBeUndefined();
      expect(r.stderr, r.stderr).not.toMatch(NO_STACK);
      const changed = [...outsideBytes(outside)].filter(([n, b]) => before.get(n) !== b).map(([n]) => n);
      expect(changed, `${dry ? "DRY_RUN " : ""}uninstall rewrote through a hard link\n${r.stdout.slice(-3000)}`).toEqual([]);
    }
  });

  it("hard links: a never-installed repository whose marker is a hard link to an installed repository's marker is changed by zero bytes", () => {
    const root = fresh("hl-marker");
    const a = join(root, "a");
    const b = join(root, "b");
    const home = join(root, "home");
    for (const d of [a, b, home]) mkdirSync(d);
    const i = runInstaller(a, home, 120_000);
    expect(i.status, i.stdout).toBe(0);
    const marker = JSON.parse(readFileSync(join(a, ...MARKER_REL.split("/")), "utf8")) as { createdFiles: Record<string, string> };
    // B holds its own copies of exactly the files A's ledgers govern, and A's marker under a second
    // name. Not the kit skills and adapters (removed by name until plan 33.1-30) and not the two
    // pointer files (a sentinel block is removed by presence on a target with no usable marker until
    // plan 33.1-33, red-team carry #11): neither decision reads the marker, so neither is this case's.
    const POINTER_FILES = ["CLAUDE.md", ".github/copilot-instructions.md"];
    const governed = [...Object.keys(marker.createdFiles).filter((rel) => !POINTER_FILES.includes(rel)), ".gemini/settings.json", ".claude/settings.json"];
    expect(governed.length, governed.join(", ")).toBeGreaterThanOrEqual(7);
    for (const rel of governed) {
      const to = join(b, ...rel.split("/"));
      mkdirSync(dirname(to), { recursive: true });
      writeFileSync(to, readFileSync(join(a, ...rel.split("/"))));
    }
    mkdirSync(join(b, ".grugops"));
    linkSync(join(a, ...MARKER_REL.split("/")), join(b, ...MARKER_REL.split("/")));
    const aMarker = readFileSync(join(a, ...MARKER_REL.split("/")));
    const bBefore = walk(b).files.map((rel) => `${rel} ${readFileSync(join(b, ...rel.split("/"))).toString("base64")}`);
    const r = runUninstall(b, join(home, ".grugops"), { home, timeoutMs: 120_000 });
    expect(r.error).toBeUndefined();
    expect(r.stderr).not.toMatch(NO_STACK);
    const bAfter = existsSync(b) ? walk(b).files.map((rel) => `${rel} ${readFileSync(join(b, ...rel.split("/"))).toString("base64")}`) : [];
    expect(bAfter, `uninstall acted on another repository's marker through a hard link\n${r.stdout.slice(-3000)}`).toEqual(bBefore);
    expect(readFileSync(join(a, ...MARKER_REL.split("/"))).equals(aMarker), "A's marker changed").toBe(true);
  });
});

// ── The shared kit's VERSION (finding 1) ───────────────────────────────────────────────────────
describe("the shared kit's VERSION is read through readUserFile (DC-3, red-team of plan 33.1-26)", () => {
  // An installed target and its kit home, then VERSION replaced by `shape`.
  function installedWithVersion(shape: "FIFO" | "/dev/zero"): { target: string; home: string; ver: string; skip: string | null } {
    const root = fresh("ver");
    const target = join(root, "target");
    const home = join(root, "home");
    mkdirSync(target);
    mkdirSync(home);
    const r = runInstaller(target, home, 120_000);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const ver = join(home, ".grugops", "agent-factory", "VERSION");
    rmSync(ver);
    if (shape === "FIFO") {
      const s = stageShapeOrSkip("FIFO", ver, "kit VERSION case");
      return { target, home, ver, skip: s === null ? null : skipLine(s, "the /dev/zero case") };
    }
    if (process.platform === "win32") return { target, home, ver, skip: "SKIPPED /dev/zero VERSION case on win32" };
    const s = stageSymlinkOrSkip("/dev/zero", ver, "symlink to /dev/zero", "kit VERSION case");
    return { target, home, ver, skip: s === null ? null : skipLine(s, "the FIFO case") };
  }

  for (const mode of ["--check", "--update"] as const) {
    it(`kit VERSION: a FIFO with a blocked writer — ${mode} finishes, the writer stays blocked, and no verdict is read from it`, async () => {
      const c = installedWithVersion("FIFO");
      if (c.skip !== null) {
        console.log(c.skip);
        return;
      }
      const writer = startBlockedFifoWriter(c.ver);
      try {
        await pause(300);
        expect(stillRunning(writer), "the writer did not block (premise)").toBe(true);
        const r = runInstaller(c.target, c.home, 20_000, mode);
        expect(r.error, `${mode} hung on a FIFO at the kit VERSION`).toBeUndefined();
        expect(r.signal).toBeNull();
        expect(r.stderr).not.toMatch(NO_STACK);
        await pause(300);
        expect(stillRunning(writer), `${mode} opened the FIFO at the kit VERSION: the blocked writer was released`).toBe(true);
        expect(r.stdout).not.toContain("junk");
        expect(r.stdout, r.stdout).toMatch(/VERSION.*(is not a regular file|could not be read)/);
        if (mode === "--check") {
          expect(lstatSync(c.ver).isFIFO(), "the FIFO at the kit VERSION was replaced").toBe(true);
          expect(r.stdout).not.toMatch(/ALL CHECKS PASSED\s*$/m);
        } else {
          // --update moves the displaced kit aside whole; the FIFO travels with it, unopened.
          const kits = readdirSync(join(c.home, ".grugops")).filter((n) => n.startsWith("agent-factory.bak."));
          expect(kits.length, "the displaced kit was not retained").toBe(1);
          expect(lstatSync(join(c.home, ".grugops", kits[0], "VERSION")).isFIFO()).toBe(true);
          expect(r.status, r.stdout).toBe(0);
        }
      } finally {
        writer.kill("SIGKILL");
      }
    });

    it(`kit VERSION: a symlink to /dev/zero — ${mode} finishes quickly and reads no verdict from it`, () => {
      const c = installedWithVersion("/dev/zero");
      if (c.skip !== null) {
        console.log(c.skip);
        return;
      }
      const started = Date.now();
      const r = runInstaller(c.target, c.home, 20_000, mode);
      expect(r.error, `${mode} did not finish on a /dev/zero VERSION`).toBeUndefined();
      expect(r.signal).toBeNull();
      expect(Date.now() - started, "the run took long enough to be reading /dev/zero").toBeLessThan(15_000);
      expect(r.stderr).not.toMatch(NO_STACK);
      expect(r.stdout, r.stdout).toMatch(/VERSION.*is not a regular file/);
    });
  }
});

// ── The doctor never prints `ok` over a special file (finding 4) ──────────────────────────────
describe("the doctor reads the state files it checks, never their presence alone (DC-1, DC-3, red-team of plan 33.1-26)", () => {
  for (const rel of ["plans/board.md", ".grugops/factory.config.json"]) {
    for (const shape of ["FIFO", "directory"] as const) {
      it(`--check: a ${shape} at ${rel} is never reported ok`, async () => {
        const root = fresh("doc");
        const target = join(root, "target");
        const home = join(root, "home");
        mkdirSync(target);
        mkdirSync(home);
        expect(runInstaller(target, home, 120_000).status).toBe(0);
        const at = join(target, ...rel.split("/"));
        rmSync(at);
        const s = stageShapeOrSkip(shape, at, `doctor ${rel}`);
        if (s !== null) {
          console.log(skipLine(s, "the directory case"));
          return;
        }
        const writer = shape === "FIFO" ? startBlockedFifoWriter(at) : null;
        try {
          if (writer) await pause(300);
          const r = runInstaller(target, home, 60_000, "--check");
          expect(r.error, "--check hung").toBeUndefined();
          expect(r.stderr).not.toMatch(NO_STACK);
          const okLine = (r.stdout ?? "").split("\n").some((l) => /^ {2}ok\s/.test(l) && l.trimEnd().endsWith(at));
          expect(okLine, `--check printed ok over a ${shape} at ${rel}\n${r.stdout}`).toBe(false);
          const warned = (r.stdout ?? "")
            .split("\n")
            .some((l) => /^ {2}(WARN|FAIL)\s/.test(l) && l.includes(at) && /not a regular file|NO VERDICT/.test(l));
          expect(warned, `--check did not report the ${shape} at ${rel}\n${r.stdout}`).toBe(true);
          if (writer) {
            await pause(300);
            expect(stillRunning(writer), "--check opened the FIFO").toBe(true);
          }
        } finally {
          writer?.kill("SIGKILL");
        }
      });
    }
  }
});

// ── --migrate never renames the legacy config it could not carry forward (finding 5) ────────────
describe("--migrate keeps the legacy config when its destination is not a readable regular file (red-team of plan 33.1-26)", () => {
  for (const shape of ["FIFO", "directory"] as const) {
    it(`--migrate: a ${shape} at .grugops/factory.config.json — the legacy config is neither renamed nor lost`, async () => {
      const root = fresh("mig");
      const target = join(root, "target");
      const home = join(root, "home");
      mkdirSync(join(target, "agent-factory", "roles"), { recursive: true });
      mkdirSync(home);
      writeFileSync(join(target, "agent-factory", "roles", "orchestrator.md"), "old in-repo kit\n");
      writeFileSync(join(target, "factory.config.json"), '{ "_edited": "LEGACY-ROOT" }\n');
      const dest = join(target, ".grugops", "factory.config.json");
      mkdirSync(dirname(dest), { recursive: true });
      const s = stageShapeOrSkip(shape, dest, "--migrate destination");
      if (s !== null) {
        console.log(skipLine(s, "the directory case"));
        return;
      }
      const writer = shape === "FIFO" ? startBlockedFifoWriter(dest) : null;
      try {
        if (writer) await pause(300);
        const r = runInstaller(target, home, 60_000, "--migrate");
        expect(r.error, "--migrate hung").toBeUndefined();
        expect(r.stderr).not.toMatch(NO_STACK);
        expect(readFileSync(join(target, "factory.config.json"), "utf8")).toBe('{ "_edited": "LEGACY-ROOT" }\n');
        expect(readdirSync(target).filter((n) => n.startsWith("factory.config.json.bak.")), "the legacy config was renamed").toEqual([]);
        expect(r.stdout).not.toContain("already present — kept");
        const verifyLines = (r.stdout ?? "").split("\n").filter((l) => /^ {2}verify\s/.test(l));
        expect(verifyLines.some((l) => l.includes(".grugops/factory.config.json")), r.stdout).toBe(true);
        expect(r.status, r.stdout).toBe(3);
        if (writer) {
          await pause(300);
          expect(stillRunning(writer), "--migrate opened the FIFO").toBe(true);
          expect(lstatSync(dest).isFIFO()).toBe(true);
        }
      } finally {
        writer?.kill("SIGKILL");
      }
    });
  }
});

// ── The helpers themselves, in a child process with a timeout ───────────────────────────────────
function callInChild(fn: "readUserFile" | "readForWrite", args: string[]): { timedOut: boolean; result: Record<string, unknown> | null; stderr: string } {
  const script =
    `import(${JSON.stringify(pathToFileURL(USER_FILE_JS).href)}).then((m) => {` +
    `if (typeof m[${JSON.stringify(fn)}] !== "function") { process.stdout.write("null"); return; }` +
    `const r = m[${JSON.stringify(fn)}](...process.argv.slice(1));` +
    `const o = { ...r };` +
    `if (o.bytes !== undefined) o.bytes = o.bytes.length;` +
    `delete o.text;` +
    `process.stdout.write(JSON.stringify(o));` +
    `});`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", script, ...args], { encoding: "utf8", timeout: 10_000 });
  let result: Record<string, unknown> | null = null;
  try {
    result = JSON.parse(r.stdout ?? "") as Record<string, unknown> | null;
  } catch {
    result = null;
  }
  return { timedOut: r.error !== undefined || r.signal !== null, result, stderr: r.stderr ?? "" };
}

describe("readUserFile and readForWrite: absent means nothing is there (red-team of plan 33.1-26)", () => {
  it("readUserFile: a dangling symlink is `not-regular` (dangling symbolic link), never `absent`", () => {
    const d = fresh("ruf");
    const s = stageSymlinkOrSkip(join(d, "nowhere"), join(d, "dangling"), "dangling symlink", "readUserFile case");
    if (s !== null) {
      console.log(skipLine(s, "the ENOTDIR case"));
      return;
    }
    expect(callInChild("readUserFile", [join(d, "dangling")]).result).toEqual({ state: "not-regular", kind: "dangling symbolic link" });
  });

  it("readUserFile: a path under a regular file is `unreadable` (ENOTDIR), never `absent`", () => {
    const d = fresh("ruf");
    writeFileSync(join(d, "file"), "x");
    expect(callInChild("readUserFile", [join(d, "file", "under")]).result).toEqual({ state: "unreadable", code: "ENOTDIR" });
  });

  it("readForWrite: nothing there, or a missing directory on the way, is `create`; a regular file is `ok`", () => {
    const d = fresh("rfw");
    expect(callInChild("readForWrite", [d, join(d, "new.md")]).result).toEqual({ state: "create" });
    expect(callInChild("readForWrite", [d, join(d, "a", "b", "new.md")]).result).toEqual({ state: "create" });
    mkdirSync(join(d, "real"));
    writeFileSync(join(d, "real", "f.md"), "hello");
    expect(callInChild("readForWrite", [d, join(d, "real", "f.md")]).result).toEqual({ state: "ok", bytes: 5 });
  });

  it("readForWrite: a link, a special file or a non-directory at the path or on the way is `blocked`, naming where", () => {
    const d = fresh("rfw");
    writeFileSync(join(d, "file"), "x");
    mkdirSync(join(d, "dir"));
    const out = fresh("rfw-out");
    writeFileSync(join(out, "f"), "outside");
    const links: Array<[string, string]> = [
      [join(out, "missing"), join(d, "dangling")],
      [join(out, "f"), join(d, "live")],
      [out, join(d, "dirlink")],
    ];
    for (const [to, at] of links) {
      const s = stageSymlinkOrSkip(to, at, "symlink", "readForWrite case");
      if (s !== null) {
        console.log(skipLine(s, "the non-directory case"));
        return;
      }
    }
    const blocked = (p: string): Record<string, unknown> | null => callInChild("readForWrite", [d, p]).result;
    expect(blocked(join(d, "dangling"))).toMatchObject({ state: "blocked", at: join(d, "dangling") });
    expect(blocked(join(d, "live"))).toMatchObject({ state: "blocked", at: join(d, "live") });
    expect(blocked(join(d, "dirlink", "f"))).toMatchObject({ state: "blocked", at: join(d, "dirlink") });
    expect(blocked(join(d, "file", "under"))).toMatchObject({ state: "blocked", at: join(d, "file") });
    expect(blocked(join(d, "dir"))).toMatchObject({ state: "blocked", at: join(d, "dir") });
    const fifo = join(d, "fifo");
    const s = stageShapeOrSkip("FIFO", fifo, "readForWrite case");
    if (s !== null) {
      console.log(skipLine(s, "the link cases"));
      return;
    }
    const r = callInChild("readForWrite", [d, fifo]);
    expect(r.timedOut).toBe(false);
    expect(r.result).toMatchObject({ state: "blocked", at: fifo });
    expect(callInChild("readForWrite", [d, join(fifo, "under")]).result).toMatchObject({ state: "blocked", at: fifo });
    // A path that is not under the root is refused, whatever is there.
    expect(callInChild("readForWrite", [d, join(out, "f")]).result).toMatchObject({ state: "blocked" });
  });
});

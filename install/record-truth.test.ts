// record-truth.test.ts — the red-team findings against plan 33.1-34, each as a class (brief DC-1 and
// DC-2, .planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-GAP-PLANNING-BRIEF.md §1).
// Every claim either binary makes, and every change uninstall makes, rests on what a record proves.
//
// WHAT THE RED TEAM FOUND against 5b55f40d (Node 24.12 and 22.23):
//   B1  `--check` read the marker through readInstallMarker but never asked whether its records could be read, so a
//       marker holding a malformed ledger printed ALL CHECKS PASSED, exit 0, while install and
//       uninstall both reported it as a verify (exit 3). README said `--check` names such a marker.
//   B2  uninstall asked readForWrite about CLAUDE.md or the Copilot file before it asked whether any
//       record says install appended a block there, so a user's `CLAUDE.md -> AGENTS.md` link made
//       every uninstall exit 3 INCOMPLETE, in a repository grugops was never installed into too. The
//       same order (a verify about a path before the question whether install has a record for it)
//       held in the kit-file pass, the runnables pass and the ask-rule pass.
//   L1  a record held only the bytes, so a mode change to a file uninstall removes (chmod) was lost;
//       and an install-created `.claude/settings.json` or `.gemini/settings.json` was deleted as
//       "empty" after a whitespace-only edit.
//   L2  a first-time DRY_RUN install previewed "no seed subtree" and the real run seeded 19 files.
//   L3  uninstall called any file named like a backup "a backup install made" with no record of it,
//       told the user to remove an `.incomplete`-named file by hand, and called a runnable or
//       AGENTS.md that only differs from this kit version "user-modified" / "user-owned or modified".
//   L4  `--target` with no value fell back to the current directory in both binaries.
//
// Items 12 and 13 of the ask-rule record are pending a human decision (plan 33.1-35) and are not
// touched here; install/installer-user-edit.test.ts asserts they still reproduce.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first). Hermetic:
// HOME, GRUGOPS_HOME, TARGET and the working directory of every run are scratch directories removed at
// the end; the real repository and the real home are never targeted. Clear professional voice: this is
// a safety surface.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LEDGER_KINDS, readLedger } from "./install-marker.js";
import { askRecord, blockRecords, fileRecords, withLedger } from "./ledger.test-support.js";
import {
  INSTALL_JS,
  MARKER_REL,
  REPO_ROOT,
  UNINSTALL_JS,
  NOTIFY_CONFIG,
  type Run,
  rebindMarker,
  runInstall,
  runUninstall,
  snapshotTree,
  spawnBin,
} from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-rt34-")));
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
const namingLines = (stdout: string, rel: string): string[] => stdout.split("\n").filter((l) => /^ {2}\S+\s/.test(l) && l.includes(rel));

function install(t: string, args: readonly string[] = [], dryRun = false, kitHome = KIT_HOME, home = HOME): Run {
  const r = runInstall(t, kitHome, args, { dryRun, home, timeoutMs: 180_000 });
  expect(r.error, "the installer could not be run").toBeUndefined();
  expect(r.stderr).not.toMatch(NO_STACK);
  return r;
}
function uninstall(t: string, dryRun = false): Run {
  const r = runUninstall(t, KIT_HOME, { dryRun, home: HOME, timeoutMs: 120_000 });
  expect(r.error, "the uninstaller could not be run").toBeUndefined();
  expect(r.stderr).not.toMatch(NO_STACK);
  return r;
}
function check(t: string): Run {
  const r = spawnBin(INSTALL_JS, ["--check"], t, KIT_HOME, { home: HOME, timeoutMs: 120_000 });
  expect(r.error, "the doctor could not be run").toBeUndefined();
  expect(r.stderr).not.toMatch(NO_STACK);
  return r;
}
const markerOf = (t: string): Record<string, unknown> => JSON.parse(readFileSync(at(t, MARKER_REL), "utf8")) as Record<string, unknown>;
const writeMarker = (t: string, m: Record<string, unknown>): void => writeFileSync(at(t, MARKER_REL), JSON.stringify(m, null, 2) + "\n");

// One default install into an empty target; every installed case works on a re-bound copy of it.
const BASE = fresh("base");
const BASE_RUN = runInstall(BASE, KIT_HOME, [], { home: HOME, timeoutMs: 180_000 });
function installedCopy(tag: string): string {
  const t = fresh(tag);
  cpSync(BASE, t, { recursive: true, verbatimSymlinks: true });
  rebindMarker(t);
  return t;
}

// ── B1: the doctor asks the one reader about the one ledger ─────────────────────────────────────
// The marker fields that are not the ledger (install-marker.ts installMarkerProblems and the binding).
// Since plan 33.1-36 (D-33 (b)) every other key of install's own marker is the one ledger, so the list
// is taken from the marker and asserted to be exactly `ledger`; the kinds are install-marker.ts
// LEDGER_KINDS, and each kind is garbled in turn.
const NOT_LEDGERS = new Set(["kitVersion", "grugopsHome", "kitRoot", "installMode", "target"]);
const LEDGERS: readonly string[] = BASE_RUN.status === 0 ? Object.keys(markerOf(BASE)).filter((k) => !NOT_LEDGERS.has(k)) : [];
const LEDGER_COUNT = 1;

describe("B1: `--check` FAILs on a marker that holds a malformed ledger, naming why (brief DC-1)", () => {
  it("the base install exits 0, `--check` passes on it, the marker carries exactly the one ledger, and readLedger reads it ok and refuses it as 'x'", () => {
    expect(BASE_RUN.status, BASE_RUN.stdout).toBe(0);
    expect(LEDGERS, `ledgers: ${LEDGERS.join(", ")}`).toEqual(["ledger"]);
    expect(LEDGERS.length).toBe(LEDGER_COUNT);
    const m = markerOf(BASE);
    expect(readLedger(m).state).toBe("ok");
    expect(readLedger({ ...m, ledger: "x" }).state).toBe("malformed");
    const c = check(installedCopy("check-clean"));
    expect(c.status, c.stdout).toBe(0);
    expect(c.stdout).toContain("ALL CHECKS PASSED");
  });

  for (const kind of LEDGER_KINDS) {
    it(`a malformed ${kind} entry: --check exits 1 with a FAIL that names the malformed install ledger and the entry, and does not print ALL CHECKS PASSED`, () => {
      const t = installedCopy(`b1-${kind}`);
      let garbled = -1;
      writeMarker(
        t,
        withLedger(markerOf(t), (l) => {
          garbled = l.findIndex((e) => e.kind === kind);
          if (garbled >= 0) l[garbled].extra = "x";
        }),
      );
      expect(garbled, `PREMISE: the base install wrote a ${kind} entry`).toBeGreaterThanOrEqual(0);
      const before = snapshotTree(t);
      const c = check(t);
      expect(c.status, c.stdout).toBe(1);
      expect(c.stdout).not.toContain("ALL CHECKS PASSED");
      const fails = lines(c.stdout, "FAIL");
      expect(fails.some((l) => /malformed install ledger/.test(l) && l.includes(`entry ${garbled}:`)), c.stdout).toBe(true);
      expect(snapshotTree(t), "--check changed the target").toBe(before);
    });
  }

  it("a ledger that is not a list: one run names it, exit 1", () => {
    const t = installedCopy("b1-all");
    writeMarker(t, { ...markerOf(t), ledger: "x" });
    const c = check(t);
    expect(c.status, c.stdout).toBe(1);
    const failText = lines(c.stdout, "FAIL").join("\n");
    expect(failText).toMatch(/malformed install ledger \(the install ledger is not a list\)/);
  });
});

// ── B2: no record → left; a verify only for a recorded path that cannot be read ─────────────────
function expectZeroBytesAndExit0(t: string, rel: string): void {
  for (const dryRun of [true, false]) {
    const before = snapshotTree(t);
    const u = uninstall(t, dryRun);
    expect(u.status, `${dryRun ? "DRY_RUN " : ""}uninstall\n${u.stdout}`).toBe(0);
    expect(lines(u.stdout, "verify"), u.stdout).toEqual([]);
    expect(snapshotTree(t), `uninstall changed the target\n${u.stdout}`).toBe(before);
    expect(namingLines(u.stdout, rel).some((l) => /^ {2}(left|skipped)\s/.test(l)), `no left or skipped line names ${rel}\n${u.stdout}`).toBe(true);
  }
}

describe("B2: uninstall asks the record before it reports a path it cannot read (brief DC-2)", () => {
  it("never installed: CLAUDE.md -> AGENTS.md is left, exit 0, zero bytes, real and DRY_RUN", () => {
    const t = fresh("b2-never-claude");
    writeFileSync(at(t, "AGENTS.md"), "# my own agents file\n");
    symlinkSync("AGENTS.md", at(t, "CLAUDE.md"));
    expectZeroBytesAndExit0(t, "CLAUDE.md");
  });

  it("never installed: .github/copilot-instructions.md -> ../AGENTS.md is left, exit 0, zero bytes, real and DRY_RUN", () => {
    const t = fresh("b2-never-copilot");
    writeFileSync(at(t, "AGENTS.md"), "# my own agents file\n");
    mkdirSync(at(t, ".github"));
    symlinkSync("../AGENTS.md", at(t, ".github/copilot-instructions.md"));
    expectZeroBytesAndExit0(t, ".github/copilot-instructions.md");
  });

  for (const rel of ["CLAUDE.md", ".github/copilot-instructions.md"]) {
    it(`installed over a linked ${rel}: install refuses it (exit 3), and uninstall then leaves it and exits 0 (no record of a block there)`, () => {
      const t = fresh("b2-installed-link");
      writeFileSync(at(t, "AGENTS.md"), "# my own agents file\n");
      if (rel.includes("/")) mkdirSync(at(t, ".github"));
      symlinkSync(rel.includes("/") ? "../AGENTS.md" : "AGENTS.md", at(t, rel));
      const i = install(t);
      expect(i.status, i.stdout).toBe(3);
      expect(Object.keys(blockRecords(markerOf(t)))).not.toContain(rel);
      const d = uninstall(t, true);
      expect(d.status, d.stdout).toBe(0);
      const u = uninstall(t);
      expect(u.status, u.stdout).toBe(0);
      expect(lines(u.stdout, "verify"), u.stdout).toEqual([]);
      expect(readFileSync(at(t, "AGENTS.md"), "utf8")).toBe("# my own agents file\n");
    });
  }

  it("guard: a recorded CLAUDE.md replaced by a link is still a verify (the record exists and the path cannot be read)", () => {
    const t = installedCopy("b2-recorded-link");
    expect(Object.keys(blockRecords(markerOf(t)))).toContain("CLAUDE.md");
    rmSync(at(t, "CLAUDE.md"));
    symlinkSync("AGENTS.md", at(t, "CLAUDE.md"));
    const u = uninstall(t);
    expect(u.status, u.stdout).toBe(3);
    expect(lines(u.stdout, "verify").some((l) => l.includes("CLAUDE.md")), u.stdout).toBe(true);
  });

  // The sibling passes: the same order held in each of them.
  it("sibling, kit files: never installed, a link at a skill path and at an adapter path are left, exit 0, zero bytes", () => {
    const t = fresh("b2-kit-link");
    writeFileSync(at(t, "mine.md"), "my own file\n");
    mkdirSync(at(t, ".claude/skills/grugops"), { recursive: true });
    mkdirSync(at(t, ".claude/agents"), { recursive: true });
    symlinkSync("../../../mine.md", at(t, ".claude/skills/grugops/SKILL.md"));
    symlinkSync("../../mine.md", at(t, ".claude/agents/grugops-orchestrator.md"));
    expectZeroBytesAndExit0(t, ".claude/skills/grugops/SKILL.md");
  });

  it("sibling, kit files: never installed, `.claude` a link to the user's directory is left, exit 0, zero bytes", () => {
    const t = fresh("b2-kit-way");
    mkdirSync(at(t, "userclaude/skills/grugops"), { recursive: true });
    writeFileSync(at(t, "userclaude/skills/grugops/SKILL.md"), "my own skill\n");
    symlinkSync("userclaude", at(t, ".claude"));
    expectZeroBytesAndExit0(t, ".claude/skills/grugops/SKILL.md");
  });

  it("sibling, runnables: never installed, a link at tools/grugops/host-protection.js is left, exit 0, zero bytes", () => {
    const t = fresh("b2-runnable-link");
    writeFileSync(at(t, "mine.js"), "// my own file\n");
    mkdirSync(at(t, "tools/grugops"), { recursive: true });
    symlinkSync("../../mine.js", at(t, "tools/grugops/host-protection.js"));
    expectZeroBytesAndExit0(t, "tools/grugops/host-protection.js");
  });

  it("sibling, runnables: never installed, `tools` a link to the user's directory is left, exit 0, zero bytes", () => {
    const t = fresh("b2-runnable-way");
    mkdirSync(at(t, "usertools/grugops"), { recursive: true });
    writeFileSync(at(t, "usertools/grugops/host-protection.js"), "// my own file\n");
    symlinkSync("usertools", at(t, "tools"));
    expectZeroBytesAndExit0(t, "tools/grugops/host-protection.js");
  });

  it("sibling, ask rules: an install that recorded no ask rule, then a link at .claude/settings.json: left, exit 0", () => {
    const t = fresh("b2-ask-link");
    mkdirSync(at(t, ".grugops"));
    writeFileSync(at(t, ".grugops/factory.config.json"), NOTIFY_CONFIG);
    const i = install(t);
    expect(i.status, i.stdout).toBe(0);
    const led = askRecord(markerOf(t)) as { added: unknown[]; createdFile: boolean };
    expect(led.added).toEqual([]);
    expect(led.createdFile).toBe(false);
    writeFileSync(at(t, "mysettings.json"), '{ "mine": true }\n');
    symlinkSync("../mysettings.json", at(t, ".claude/settings.json"));
    const d = uninstall(t, true);
    expect(d.status, d.stdout).toBe(0);
    const u = uninstall(t);
    expect(u.status, u.stdout).toBe(0);
    expect(lines(u.stdout, "verify"), u.stdout).toEqual([]);
    expect(readFileSync(at(t, "mysettings.json"), "utf8")).toBe('{ "mine": true }\n');
  });

  it("guard, gemini: never installed, a link at .gemini/settings.json is left, exit 0, zero bytes", () => {
    const t = fresh("b2-gemini-link");
    writeFileSync(at(t, "g.json"), '{ "mine": true }\n');
    mkdirSync(at(t, ".gemini"));
    symlinkSync("../g.json", at(t, ".gemini/settings.json"));
    expectZeroBytesAndExit0(t, ".gemini/settings.json");
  });

  it("guard, kit files: a recorded skill replaced by a link is still a verify", () => {
    const t = installedCopy("b2-kit-recorded-link");
    writeFileSync(at(t, "mine.md"), "my own file\n");
    rmSync(at(t, ".claude/skills/grugops-gate/SKILL.md"));
    symlinkSync("../../../mine.md", at(t, ".claude/skills/grugops-gate/SKILL.md"));
    const u = uninstall(t);
    expect(u.status, u.stdout).toBe(3);
    expect(lines(u.stdout, "verify").some((l) => l.includes("grugops-gate/SKILL.md")), u.stdout).toBe(true);
  });
});

// ── L1: the record carries the mode; "empty" means install's own emptied shape ─────────────────
/** Every file uninstall removes whole from an untouched default install, taken from the marker's one ledger. */
function removableFiles(m: Record<string, unknown>): string[] {
  const out = new Set<string>(Object.keys(fileRecords(m)));
  const ledger = m.ledger as Array<Record<string, unknown>>;
  for (const e of ledger) {
    if ((e.kind === "gemini" || e.kind === "ask-rules") && e.createdFile === true) out.add(e.path as string);
  }
  return [...out].sort();
}
const REMOVABLE: readonly string[] = BASE_RUN.status === 0 ? removableFiles(markerOf(BASE)) : [];
/** 24 kit files, AGENTS.md, CLAUDE.md, the Copilot file, 4 runnables, the Gemini and Claude settings files. */
const REMOVABLE_COUNT = 33;
const modeOf = (p: string): number => statSync(p).mode & 0o7777;

describe("L1: a mode change or a whitespace edit is a user edit, and the file is left (brief DC-2)", () => {
  it("REMOVABLE is taken from the marker, has REMOVABLE_COUNT files, and an untouched copy's uninstall removes every one", () => {
    expect(REMOVABLE.length, REMOVABLE.join("\n")).toBe(REMOVABLE_COUNT);
    const t = installedCopy("l1-untouched");
    const u = uninstall(t);
    expect(u.status, u.stdout).toBe(0);
    for (const rel of REMOVABLE) expect(existsSync(at(t, rel)), `${rel} survived an untouched uninstall\n${u.stdout}`).toBe(false);
  });

  for (const rel of REMOVABLE) {
    it(`${rel}: a chmod-only edit survives uninstall (the file stays, with the user's mode)`, () => {
      const t = installedCopy("l1-mode");
      const p = at(t, rel);
      const mode = modeOf(p) ^ 0o100;
      chmodSync(p, mode);
      const u = uninstall(t);
      expect([0, 3], u.stdout).toContain(u.status);
      expect(existsSync(p), `${rel} was removed after a mode change\n${u.stdout}`).toBe(true);
      expect(modeOf(p), `${rel} lost the user's mode`).toBe(mode);
    }, 30_000);
  }

  for (const rel of [".claude/settings.json", ".gemini/settings.json"]) {
    for (const [name, change] of [
      ["an extra final newline", (s: string): string => `${s}\n`],
      ["CRLF line ends", (s: string): string => s.replace(/\n/g, "\r\n")],
    ] as const) {
      it(`${rel} (created by install): ${name} is a user edit, and the file is left`, () => {
        const t = installedCopy("l1-ws");
        const p = at(t, rel);
        writeFileSync(p, change(readFileSync(p, "utf8")));
        const u = uninstall(t);
        expect([0, 3], u.stdout).toContain(u.status);
        expect(existsSync(p), `${rel} was deleted as empty after a whitespace-only edit\n${u.stdout}`).toBe(true);
      });
    }
  }

  it("a record written without a mode (before the mode was recorded) compares the bytes only, removes the untouched file, and says so", () => {
    const t = installedCopy("l1-old-record");
    const strip = (v: unknown): unknown => (typeof v === "string" ? v.replace(/;mode=[0-7]+$/, "") : v);
    const m = withLedger(markerOf(t), (l) => {
      for (const e of l) {
        if (e.kind === "file") e.content = strip(e.content);
        if (e.kind === "gemini" && typeof e.fileContent === "string") e.fileContent = strip(e.fileContent);
        if (e.kind === "ask-rules") delete e.fileMode;
      }
    });
    writeMarker(t, m);
    const u = uninstall(t);
    expect(u.status, u.stdout).toBe(0);
    expect(existsSync(at(t, "tools/grugops/host-protection.js"))).toBe(false);
    const line = namingLines(u.stdout, "tools/grugops/host-protection.js").find((l) => /^ {2}removed\s/.test(l)) ?? "";
    expect(line, u.stdout).toMatch(/no file mode|without a file mode|mode was not recorded/);
  });
});

// ── L2: the DRY_RUN seed preview reads the seed the real run would copy ─────────────────────────
function seedFiles(root: string, base = ""): string[] {
  const out: string[] = [];
  for (const e of readdirSync(join(root, base), { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...seedFiles(root, rel));
    else if (e.isFile()) out.push(rel);
  }
  return out.sort();
}

describe("L2: a first DRY_RUN install (no kit home yet) previews the seed the real run writes", () => {
  it("every seed file is previewed `would-add` and then `created` by the real run; no 'no seed subtree' line", () => {
    const seed = seedFiles(join(REPO_ROOT, "agent-factory", "seed"));
    expect(seed.length).toBeGreaterThan(0);
    const home = fresh("l2-home");
    const kitHome = join(home, ".grugops");
    const t = fresh("l2-target");
    const d = install(t, [], true, kitHome, home);
    expect(existsSync(kitHome), "DRY_RUN created the kit home").toBe(false);
    expect(d.stdout).not.toMatch(/no seed subtree/);
    const would = new Set(lines(d.stdout, "would-add").map((l) => l.trim().split(/\s+/)[1]));
    const r = install(t, [], false, kitHome, home);
    const created = new Set(lines(r.stdout, "created").map((l) => l.trim().split(/\s+/)[1]));
    for (const rel of seed) {
      expect(created.has(rel), `the real run did not create ${rel}\n${r.stdout}`).toBe(true);
      expect(would.has(rel), `the DRY_RUN preview did not name ${rel}\n${d.stdout}`).toBe(true);
    }
  });
});

// ── L3: wording asserts only what the run proved ────────────────────────────────────────────────
const STAMP = "2026-01-01T00-00-00.000Z";
const BACKUPS = [`.claude/agents/notes.md.grugops-edited-${STAMP}`, `.claude/agents/notes.md.grugops-edited-${STAMP}.incomplete`];
function expectHonestBackupLines(stdout: string): void {
  for (const rel of BACKUPS) {
    const ls = namingLines(stdout, rel.split("/").pop()!);
    expect(ls.length, `no line names ${rel}\n${stdout}`).toBeGreaterThan(0);
    for (const l of ls) {
      expect(l, "a line claims install made a file nothing records").not.toMatch(/a backup install made|incomplete copy install could not finish/);
      expect(l, "a line tells the user to remove a file nothing records install made").not.toMatch(/remove it by hand/);
      expect(l).toMatch(/^ {2}left\s/);
      expect(l).toMatch(/name matches/);
    }
  }
}

describe("L3: uninstall's wording asserts only what the run proved", () => {
  it("no marker: a user's files named like install's backups are left, never called install's, and the user is not told to remove them", () => {
    const t = fresh("l3-nomarker");
    mkdirSync(at(t, ".claude/agents"), { recursive: true });
    for (const rel of BACKUPS) writeFileSync(at(t, rel), "the user's own notes\n");
    const u = uninstall(t);
    expect(u.status, u.stdout).toBe(0);
    expectHonestBackupLines(u.stdout);
    for (const rel of BACKUPS) expect(existsSync(at(t, rel))).toBe(true);
  });

  it("with a marker: the same files are still not claimed (install records no backup)", () => {
    const t = installedCopy("l3-marker");
    for (const rel of BACKUPS) writeFileSync(at(t, rel), "the user's own notes\n");
    const u = uninstall(t);
    expect(u.status, u.stdout).toBe(0);
    expectHonestBackupLines(u.stdout);
  });

  it("an install ledger with no kit-false file entries: a differing runnable and AGENTS.md are said to differ from this kit version, not to be the user's", () => {
    const t = installedCopy("l3-kitversion");
    writeMarker(t, withLedger(markerOf(t), (l) => l.filter((e) => !(e.kind === "file" && e.kit === false))));
    writeFileSync(at(t, "tools/grugops/host-protection.js"), readFileSync(at(t, "tools/grugops/host-protection.js"), "utf8") + "// earlier version\n");
    writeFileSync(at(t, "AGENTS.md"), readFileSync(at(t, "AGENTS.md"), "utf8") + "earlier version\n");
    const u = uninstall(t);
    const run = namingLines(u.stdout, "tools/grugops/host-protection.js").join("\n");
    expect(run, u.stdout).not.toMatch(/user-modified/);
    expect(run, u.stdout).toMatch(/differs from this kit version's file/);
    const agents = namingLines(u.stdout, "AGENTS.md").filter((l) => !l.includes("tools/")).join("\n");
    expect(agents, u.stdout).not.toMatch(/user-owned or modified/);
    expect(agents, u.stdout).toMatch(/differs from this kit version's/);
  });
});

// ── L4: a value-taking flag with no value is bad usage (exit 2) ─────────────────────────────────
// The value-taking flags: `--target` is the only one in either binary (install.ts and uninstall.ts
// argument loops); every other flag is a boolean.
describe("L4: `--target` with no value is bad usage in both binaries (exit 2), never the current directory", () => {
  const CASES: ReadonlyArray<readonly [string, readonly string[]]> = [
    ["install.js", ["--target"]],
    ["install.js", ["--target="]],
    ["install.js", ["--target", "--yes"]],
    ["install.js", ["--yes", "--target"]],
    ["uninstall.js", ["--target"]],
    ["uninstall.js", ["--target="]],
    ["uninstall.js", ["--target", "--allow-self"]],
  ];
  for (const [bin, args] of CASES) {
    it(`${bin} ${args.join(" ")}: exit 2 with a usage line, nothing written`, () => {
      const cwd = fresh("l4-cwd");
      const envTarget = fresh("l4-env");
      const env: NodeJS.ProcessEnv = { ...process.env, GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: join(fresh("l4-home"), ".grugops"), HOME: fresh("l4-h"), TARGET: envTarget, DRY_RUN: "1" };
      const before = snapshotTree(cwd) + snapshotTree(envTarget);
      const r = spawnSync(process.execPath, [bin === "install.js" ? INSTALL_JS : UNINSTALL_JS, ...args], { cwd, env, encoding: "utf8", timeout: 60_000, input: "" });
      expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(2);
      expect(r.stderr).toMatch(/--target/);
      expect(r.stderr).toMatch(/usage/i);
      expect(snapshotTree(cwd) + snapshotTree(envTarget)).toBe(before);
    });
  }
});

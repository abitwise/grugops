// installer-kit-home.test.ts — the kit home must never overlap the target (plan 33.1-37, review
// CR-01, D-33 (b)).
//
// THE FINDING. KIT_ROOT is `<GRUGOPS_HOME>/agent-factory`, and nothing used to compare it with the
// target. With GRUGOPS_HOME set to the target, install renamed the user's in-repo agent-factory/ aside
// and deleted it recursively, exit 0, with no backup and no warning, and a DRY_RUN preview said only
// `would-copy`. So install now refuses, before any write and under DRY_RUN too, whenever the kit home
// and the target overlap in either direction after realpath.
//
// THE REFUSAL CLASS. The four overlap shapes are installer-paths.test-support.ts REFUSAL_VARIANTS (review
// IN-06: the DC-2 class tests now vary the kit home), count pinned. Each runs real and DRY_RUN and must
// exit 1, write its reason to stderr, print nothing on stdout, and change zero bytes in the target and in
// the kit home. A link to the target is refused as a site case (the comparison is by real path). The one
// layout that must still install is a target inside the kit home but outside the kit root
// (GRUGOPS_HOME=$HOME, target $HOME/code/repo).
//
// THE KIT-HOME RECORD. copyKit used to delete whatever sat at the kit root by presence (CR-01's sibling).
// It now replaces only a kit `.grugops-kit.json` says install wrote (D-31 item 14) and renames anything
// else aside to a recorded `agent-factory.bak.<ISO>`. The cases cover the first install, a recorded
// re-install, an unrecorded directory (install and --update), a link at the kit root, --update over a
// differing and an identical recorded kit, every damage to the record (a FIFO, a directory, a link, not
// JSON, bound elsewhere), DRY_RUN, and KIT_HOME_VARIANTS (count pinned).
//
// MUTATION PROOFS (33.1-37-SUMMARY.md): removing the refusal turns kit-home-is-target red (install exits 0
// and replaces the in-repo agent-factory/); deleting an unrecorded kit root instead of renaming it turns the
// UNRECORDED cases red.
//
// Drives the COMMITTED install/install.js (npm run build first). Hermetic: HOME, GRUGOPS_HOME and TARGET
// are scratch directories removed at the end. Clear professional voice: this is a safety surface.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  INSTALL_JS,
  KIT_HOME_VARIANTS,
  REFUSAL_VARIANTS,
  runKitHomeVariant,
  runRefusalVariant,
  snapshotTree,
  spawnBin,
  userRepo,
  type Run,
} from "./installer-paths.test-support.js";
import { KIT_ENTRY_PATH, KIT_HOME_RECORD_REL } from "./install-marker.js";
import { stageShapeOrSkip, skipLine } from "../scripts/check-platform-shapes.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-kit-home-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

/** The pinned number of overlap shapes, with its reason: kit home = target, kit root = target, target in kit root, kit home in target. */
const REFUSAL_VARIANT_COUNT = 4;

describe("CR-01: install refuses a kit home that overlaps the target, before any write (plan 33.1-37)", () => {
  it("REFUSAL_VARIANTS is the four overlap shapes (count pinned)", () => {
    console.log(`REFUSAL_VARIANTS (${REFUSAL_VARIANTS.length}): ${REFUSAL_VARIANTS.map((v) => `${v.name} — ${v.why}`).join("; ")}`);
    expect(REFUSAL_VARIANTS.length, "the four ways the kit home and the target can overlap after realpath").toBe(REFUSAL_VARIANT_COUNT);
    expect(new Set(REFUSAL_VARIANTS.map((v) => v.name)).size).toBe(REFUSAL_VARIANT_COUNT);
  });

  for (const spec of REFUSAL_VARIANTS) {
    for (const dryRun of [false, true]) {
      it(`${spec.name}${dryRun ? " (DRY_RUN)" : ""}: exit 1, the reason on stderr, nothing on stdout, zero bytes changed in the target and the kit home`, () => {
        const v = runRefusalVariant(fresh(spec.name), spec, { dryRun });
        console.log(`${spec.name}${dryRun ? " DRY_RUN" : ""}: exit ${v.run.status}; stderr: ${v.run.stderr.trim()}`);
        expect(v.run.error, String(v.run.error)).toBeUndefined();
        expect(v.run.status, `${spec.why}\nstdout:\n${v.run.stdout}\nstderr:\n${v.run.stderr}`).toBe(1);
        expect(v.run.stdout, "the refusal must come before anything reaches stdout").toBe("");
        expect(v.run.stderr).toMatch(/overlaps the target/);
        expect(v.run.stderr).toContain("Set GRUGOPS_HOME to a directory outside the repository");
        expect(v.run.stderr).toContain("Nothing was written.");
        expect(v.targetAfter, `${spec.name}: the target changed`).toBe(v.targetBefore);
        expect(v.kitHomeAfter, `${spec.name}: the kit home changed`).toBe(v.kitHomeBefore);
      });
    }
  }

  // A site case beside the class: the comparison is by REAL path, so a link to the target is the target.
  for (const dryRun of [false, true]) {
    it(`GRUGOPS_HOME a symbolic link whose real path is the target${dryRun ? " (DRY_RUN)" : ""}: refused, zero bytes changed`, () => {
      const root = fresh("home-link");
      const home = join(root, "user-home");
      mkdirSync(home);
      const target = join(root, "repo");
      userRepo(target);
      const link = join(root, "home-link");
      symlinkSync(target, link);
      const before = snapshotTree(root);
      const r = spawnBin(INSTALL_JS, ["--yes"], target, link, { dryRun, home, timeoutMs: 120_000 });
      expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(1);
      expect(r.stdout).toBe("");
      expect(r.stderr).toMatch(/overlaps the target/);
      expect(snapshotTree(root)).toBe(before);
    });
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE KIT-HOME RECORD (plan 33.1-37, D-33 (b), CR-01's sibling). copyKit used to delete whatever sat at
// the kit root by presence. It now replaces only a kit its record (`.grugops-kit.json`) says install
// wrote (D-31 item 14), and renames anything else aside to a recorded `agent-factory.bak.<ISO>`.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

interface KitHomeCase {
  readonly root: string;
  readonly home: string;
  readonly target: string;
  readonly grugopsHome: string;
}
function kitHomeCase(tag: string): KitHomeCase {
  const root = fresh(tag);
  const home = join(root, "home");
  const target = join(root, "repo");
  mkdirSync(home);
  mkdirSync(target);
  return { root, home, target, grugopsHome: join(home, ".grugops") };
}
const install = (c: KitHomeCase, args: readonly string[] = [], dryRun = false): Run =>
  spawnBin(INSTALL_JS, ["--yes", ...args], c.target, c.grugopsHome, { dryRun, home: c.home, timeoutMs: 180_000 });
const update = (c: KitHomeCase, dryRun = false): Run =>
  spawnBin(INSTALL_JS, ["--yes", "--update"], c.target, c.grugopsHome, { dryRun, home: c.home, timeoutMs: 180_000 });

interface RecordJson {
  readonly grugopsHome: string;
  readonly ledger: ReadonlyArray<Record<string, unknown>>;
}
const recordOf = (c: KitHomeCase): RecordJson => JSON.parse(readFileSync(join(c.grugopsHome, KIT_HOME_RECORD_REL), "utf8")) as RecordJson;
const backupsIn = (c: KitHomeCase): string[] => (existsSync(c.grugopsHome) ? readdirSync(c.grugopsHome).filter((n) => n.startsWith(`${KIT_ENTRY_PATH}.bak.`)).sort() : []);
const kitRoot = (c: KitHomeCase): string => join(c.grugopsHome, KIT_ENTRY_PATH);

/** A user's own agent-factory/ at the kit root, holding notes install never wrote. */
function plantUserKitRoot(c: KitHomeCase): string {
  mkdirSync(kitRoot(c), { recursive: true });
  const notes = "the user's notes, kept in a directory that happens to sit at the kit root\n";
  writeFileSync(join(kitRoot(c), "MYNOTES.md"), notes);
  return notes;
}

describe("the kit-home record: copyKit replaces only a kit it recorded, and keeps anything else as a recorded backup (plan 33.1-37)", () => {
  it("a first install writes the kit and `.grugops-kit.json` bound to the kit home's real path, holding one kit entry", () => {
    const c = kitHomeCase("first");
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const rec = recordOf(c);
    expect(Object.keys(rec).sort()).toEqual(["grugopsHome", "ledger"]);
    expect(rec.grugopsHome).toBe(realpathSync.native(c.grugopsHome));
    expect(rec.ledger).toEqual([{ path: KIT_ENTRY_PATH, kind: "kit" }]);
    expect(backupsIn(c)).toEqual([]);
    // No temporary directory is left behind.
    expect(readdirSync(c.grugopsHome).filter((n) => n.startsWith(".agent-factory."))).toEqual([]);
  });

  it("a re-install over a recorded kit replaces it with no backup (D-31 item 14): an edit inside it is overwritten, and the record still names the kit", () => {
    const c = kitHomeCase("recorded");
    expect(install(c).status).toBe(0);
    writeFileSync(join(kitRoot(c), "VERSION"), "9.9.9-edited-in-kit-home\n");
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(readFileSync(join(kitRoot(c), "VERSION"), "utf8")).not.toContain("9.9.9-edited-in-kit-home");
    expect(backupsIn(c)).toEqual([]);
    expect(recordOf(c).ledger).toEqual([{ path: KIT_ENTRY_PATH, kind: "kit" }]);
    expect(r.stdout).toMatch(/replaced the kit install recorded writing there/);
    expect(readdirSync(c.grugopsHome).filter((n) => n.startsWith(".agent-factory."))).toEqual([]);
  });

  for (const how of ["install", "--update"] as const) {
    it(`${how} over an UNRECORDED agent-factory/ at the kit root renames it to a recorded backup; the user's file is byte-identical inside it`, () => {
      const c = kitHomeCase(`unrecorded-${how}`);
      const notes = plantUserKitRoot(c);
      const r = how === "install" ? install(c) : update(c);
      expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
      const baks = backupsIn(c);
      expect(baks.length, `backups: ${baks.join(", ")}`).toBe(1);
      expect(readFileSync(join(c.grugopsHome, baks[0], "MYNOTES.md"), "utf8")).toBe(notes);
      expect(existsSync(join(kitRoot(c), "roles", "orchestrator.md")), "the new kit is not in place").toBe(true);
      expect(existsSync(join(kitRoot(c), "MYNOTES.md"))).toBe(false);
      const rec = recordOf(c);
      const backup = rec.ledger.find((e) => e.kind === "backup");
      expect(backup, JSON.stringify(rec)).toBeDefined();
      expect(backup).toMatchObject({ path: baks[0], origin: "kit-home", of: KIT_ENTRY_PATH });
      expect(String(backup!.content)).toMatch(/^tree:sha256:[0-9a-f]{64}$/);
      expect(rec.ledger.some((e) => e.kind === "kit" && e.path === KIT_ENTRY_PATH)).toBe(true);
      // A later re-install keeps the backup entry while the backup still holds what was recorded.
      const again = install(c);
      expect(again.status, again.stdout).toBe(0);
      expect(recordOf(c).ledger.filter((e) => e.kind === "backup")).toEqual([backup]);
      expect(backupsIn(c)).toEqual(baks);
    });
  }

  it("a symbolic link at the kit root is renamed aside as a link with a link record; the directory it points at is untouched", () => {
    const c = kitHomeCase("link-root");
    const elsewhere = join(c.root, "elsewhere");
    mkdirSync(elsewhere);
    writeFileSync(join(elsewhere, "KEEP.md"), "not the kit\n");
    mkdirSync(c.grugopsHome, { recursive: true });
    symlinkSync(elsewhere, kitRoot(c));
    const before = snapshotTree(elsewhere);
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const baks = backupsIn(c);
    expect(baks.length).toBe(1);
    expect(lstatSync(join(c.grugopsHome, baks[0])).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(c.grugopsHome, baks[0]))).toBe(elsewhere);
    expect(snapshotTree(elsewhere)).toBe(before);
    expect(lstatSync(kitRoot(c)).isDirectory()).toBe(true);
    expect(recordOf(c).ledger.find((e) => e.kind === "backup")).toMatchObject({ content: `link:${elsewhere}` });
  });

  it("--update over a recorded kit that differs keeps it as a recorded backup; over a recorded identical kit it replaces it with no backup", () => {
    const c = kitHomeCase("update-recorded");
    expect(install(c).status).toBe(0);
    const same = update(c);
    expect(same.status, same.stdout).toBe(0);
    expect(backupsIn(c)).toEqual([]);
    writeFileSync(join(kitRoot(c), "VERSION"), "9.9.9-displaced\n");
    const r = update(c);
    expect(r.status, r.stdout).toBe(0);
    const baks = backupsIn(c);
    expect(baks.length).toBe(1);
    expect(readFileSync(join(c.grugopsHome, baks[0], "VERSION"), "utf8")).toContain("9.9.9-displaced");
    expect(recordOf(c).ledger.find((e) => e.kind === "backup")).toMatchObject({ path: baks[0], origin: "kit-home" });
  });

  const RECORD_DAMAGE: ReadonlyArray<{ readonly name: string; readonly rewritten: boolean; readonly plant: (c: KitHomeCase) => string | null }> = [
    { name: "a FIFO", rewritten: false, plant: (c) => stageOrSkip("FIFO", join(c.grugopsHome, KIT_HOME_RECORD_REL)) },
    {
      name: "a directory",
      rewritten: false,
      plant: (c) => {
        rmSync(join(c.grugopsHome, KIT_HOME_RECORD_REL));
        mkdirSync(join(c.grugopsHome, KIT_HOME_RECORD_REL));
        return null;
      },
    },
    {
      name: "a symbolic link to a valid record",
      rewritten: false,
      plant: (c) => {
        const real = join(c.root, "elsewhere-record.json");
        writeFileSync(real, readFileSync(join(c.grugopsHome, KIT_HOME_RECORD_REL)));
        rmSync(join(c.grugopsHome, KIT_HOME_RECORD_REL));
        symlinkSync(real, join(c.grugopsHome, KIT_HOME_RECORD_REL));
        return null;
      },
    },
    { name: "not JSON", rewritten: false, plant: (c) => (writeFileSync(join(c.grugopsHome, KIT_HOME_RECORD_REL), "not json\n"), null) },
    {
      name: "bound to another kit home",
      rewritten: true,
      plant: (c) => {
        const p = join(c.grugopsHome, KIT_HOME_RECORD_REL);
        const rec = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
        writeFileSync(p, JSON.stringify({ ...rec, grugopsHome: "/somewhere/else/.grugops" }, null, 2) + "\n");
        return null;
      },
    },
  ];
  function stageOrSkip(shape: "FIFO", at: string): string | null {
    rmSync(at, { force: true });
    const s = stageShapeOrSkip(shape, at, `kit-home record ${at}`);
    return s === null ? null : skipLine(s, "the other record damages in this block");
  }

  for (const d of RECORD_DAMAGE) {
    it(`.grugops-kit.json that is ${d.name} is read as no record: the kit at the kit root is kept as a backup, and the run finishes`, () => {
      const c = kitHomeCase(`damage-${d.name.replace(/\W+/g, "-")}`);
      expect(install(c).status).toBe(0);
      const skip = d.plant(c);
      if (skip !== null) {
        console.log(skip);
        return;
      }
      const r = install(c);
      expect(r.error, `the run did not finish: ${String(r.error)}`).toBeUndefined();
      expect([0, 3], `${r.stdout}\n${r.stderr}`).toContain(r.status);
      const baks = backupsIn(c);
      expect(baks.length, `the kit was not kept as a backup\n${r.stdout}`).toBe(1);
      expect(existsSync(join(c.grugopsHome, baks[0], "roles", "orchestrator.md"))).toBe(true);
      const at = join(c.grugopsHome, KIT_HOME_RECORD_REL);
      if (d.name === "a FIFO") expect(lstatSync(at).isFIFO(), "the FIFO is not a FIFO any more").toBe(true);
      if (d.name === "a directory") expect(lstatSync(at).isDirectory()).toBe(true);
      if (d.name.startsWith("a symbolic link")) expect(lstatSync(at).isSymbolicLink()).toBe(true);
      if (d.rewritten) {
        expect(r.status, r.stdout).toBe(0);
        expect(recordOf(c).grugopsHome).toBe(realpathSync.native(c.grugopsHome));
      } else {
        expect(r.status, r.stdout).toBe(3);
        expect(r.stdout).toMatch(/is not install's kit-home record, so it was left as it is/);
      }
    });
  }

  it("DRY_RUN prints would-copy plus would-back-up (unrecorded) or would-replace (recorded), and writes nothing in the kit home", () => {
    const c = kitHomeCase("dry-run");
    plantUserKitRoot(c);
    const before = snapshotTree(c.grugopsHome);
    const unrec = install(c, [], true);
    expect(unrec.status, unrec.stdout).toBe(0);
    expect(unrec.stdout).toMatch(/^ {2}would-back-up\s/m);
    expect(unrec.stdout).toMatch(/^ {2}would-copy\s+kit/m);
    expect(unrec.stdout).not.toMatch(/^ {2}would-replace\s/m);
    expect(snapshotTree(c.grugopsHome)).toBe(before);
    expect(install(c).status).toBe(0);
    const recorded = snapshotTree(c.grugopsHome);
    const rec = install(c, [], true);
    expect(rec.status, rec.stdout).toBe(0);
    expect(rec.stdout).toMatch(/^ {2}would-replace\s/m);
    expect(rec.stdout).not.toMatch(/^ {2}would-back-up\s/m);
    expect(snapshotTree(c.grugopsHome)).toBe(recorded);
  });
});

describe("KIT_HOME_VARIANTS (review IN-06, plan 33.1-37): the user's bytes at the kit root survive inside a recorded backup", () => {
  const KIT_HOME_VARIANT_COUNT = 2;
  it("KIT_HOME_VARIANTS: an unrecorded kit home and a link at the kit root (count pinned)", () => {
    expect(KIT_HOME_VARIANTS.length).toBe(KIT_HOME_VARIANT_COUNT);
  });
  for (const spec of KIT_HOME_VARIANTS) {
    it(`${spec.name}: install exits 0, the user's content is the one recorded backup, and the record names it`, () => {
      const v = runKitHomeVariant(fresh(spec.name), spec);
      expect(v.run.status, `${spec.why}\n${v.run.stdout}\n${v.run.stderr}`).toBe(0);
      expect(v.problems, v.problems.join("\n")).toEqual([]);
    });
  }
});

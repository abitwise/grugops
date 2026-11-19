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
// JSON, bound elsewhere), DRY_RUN, and KIT_HOME_VARIANTS (count pinned). The docs entries beside the kit
// (plan 43-06) differ in one arm: since review CR-01 of phase 43, one the record does not name is left in
// place with a note, never renamed to a backup (the CR-01 block below).
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
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ALL_AGENT_FLAGS,
  INSTALL_JS,
  KIT_HOME_VARIANTS,
  REFUSAL_VARIANTS,
  runKitHomeVariant,
  runRefusalVariant,
  snapshotTree,
  spawnBin,
  userRepo,
  withAgentFlags,
  type Run,
} from "./installer-paths.test-support.js";
import { KIT_ENTRY_PATH, KIT_HOME_RECORD_REL } from "./install-marker.js";
import { kitHomeOverlap, realTargetPath, type PathNode, type PlacedPath } from "./user-file.js";
import { STATE_ROOTS } from "./state-layout.js";
// (Plan 43-02, D-11, D-27) The shipped user docs, declared once. Unit cases at the foot of this file.
import { CHECKOUT_ONLY_DOCS, SHIPPED_DOCS_ROOTS, shippedDocs } from "./kit-source.js";
import { stageShapeOrSkip, skipLine } from "../scripts/check-platform-shapes.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-kit-home-")));

/**
 * The product's own spelling of the kit home's real path (user-file.ts realTargetPath; plan 34-12, D-19,
 * WIN-1): the value the kit-home record's `grugopsHome` is expected to hold, never `realpathSync.native`
 * (the host's backslash spelling on Windows).
 */
function recordedHome(grugopsHome: string): string {
  const p = realTargetPath(grugopsHome);
  if (p === null) throw new Error(`the real path of ${grugopsHome} could not be read`);
  return p;
}
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
      const r = spawnBin(INSTALL_JS, ["--yes", ...ALL_AGENT_FLAGS], target, link, { dryRun, home, timeoutMs: 120_000 });
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
    const r = spawnBin(INSTALL_JS, ["--yes", ...ALL_AGENT_FLAGS], target, home, { home, timeoutMs: 180_000 });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stderr).not.toMatch(/overlaps the target/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// D739 (plan 43.1-06, 2026-11-19, red-team B1 of 33.1): ONE DIRECTORY UNDER TWO SPELLINGS. On macOS a
// firmlink keeps its spelling through realpath, so `/System/Volumes/Data/Users/u/repo` and `/Users/u/repo`
// are one directory whose real spellings are not prefixes of each other. The string test passed such a kit
// home and a re-install replaced the in-repo agent-factory/. install now also compares device and inode
// (user-file.ts pathNodes and kitHomeOverlap). No firmlink and no unprivileged bind mount exists on the
// Linux machines this runs on, and a symbolic link proves nothing (realpath already resolves it), so these
// cases inject the identities: MAC_IDS models a Mac where the two spellings of one directory report one
// `dev:ino`. Each pin is red on the string test alone and green on the identity test. A real macOS run
// stays `UNKNOWN - verify`.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The firmlink prefix: on a Mac `/System/Volumes/Data<p>` and `<p>` are one directory. */
const DATA_VOLUME = "/System/Volumes/Data";

/** The directories that exist on the modelled Mac, keyed by their spelling without the firmlink prefix, each with its `dev:ino`. */
const MAC_IDS: ReadonlyMap<string, string> = new Map([
  ["/", "16777233:2"],
  ["/System", "16777233:10"],
  ["/System/Volumes", "16777233:11"],
  ["/System/Volumes/Data", "16777233:12"],
  ["/Users", "16777233:20"],
  ["/Users/u", "16777233:21"],
  ["/Users/u/repo", "16777233:22"],
]);

/**
 * The node list pathNodes would build for real spelling `real` on a host whose directories are `ids`: one node
 * per component, root to leaf, each existing component with its `dev:ino`, every component from the first
 * missing one on with its name only. A spelling under DATA_VOLUME is looked up without the prefix, which is
 * what makes it the firmlink's other spelling of one directory.
 */
function modelNodes(real: string, ids: ReadonlyMap<string, string> = MAC_IDS): PathNode[] {
  const names = real.split("/").filter((s) => s !== "");
  const out: PathNode[] = [{ name: "/", id: ids.get("/") ?? null }];
  let missing = false;
  for (let i = 0; i < names.length; i++) {
    const spelled = `/${names.slice(0, i + 1).join("/")}`;
    const behind = spelled.length > DATA_VOLUME.length && spelled.slice(0, DATA_VOLUME.length + 1) === `${DATA_VOLUME}/` ? spelled.slice(DATA_VOLUME.length) : spelled;
    const id = missing ? undefined : ids.get(behind);
    if (id === undefined) missing = true;
    out.push({ name: names[i], id: id ?? null });
  }
  return out;
}

const placed = (realAt: string, ids?: ReadonlyMap<string, string>): PlacedPath => ({ realAt, nodes: modelNodes(realAt, ids) });

interface ModelEntry extends PlacedPath {
  readonly entry: string;
}

/** The overlap input for a kit home spelled `home` (its kit root `<home>/agent-factory` first, then docs and examples) and a target spelled `target`. */
function modelLayout(home: string, target: string, ids?: ReadonlyMap<string, string>) {
  const entries: ModelEntry[] = ["agent-factory", "docs", "examples"].map((entry) => ({ entry, ...placed(`${home}/${entry}`, ids) }));
  return { entries, home: placed(home, ids), target: placed(target, ids) };
}

describe("D739: one directory under two spellings is refused by identity (plan 43.1-06)", () => {
  it("kit root inside the target, the kit home spelled through the firmlink: the string test cannot see it, kitHomeOverlap refuses with the kit-root hit", () => {
    // GRUGOPS_HOME=/System/Volumes/Data/Users/u/repo, target /Users/u/repo: the kit root is the repository's own agent-factory/.
    const input = modelLayout(`${DATA_VOLUME}/Users/u/repo`, "/Users/u/repo");
    const kitRoot = input.entries[0];
    expect(kitRoot.nodes.find((n) => n.name === "repo")?.id, "the model: the firmlink spelling reaches the target's own dev:ino").toBe("16777233:22");
    // No string relation either way between the two real spellings.
    expect(kitRoot.realAt.startsWith(`${input.target.realAt}/`)).toBe(false);
    expect(input.target.realAt.startsWith(`${kitRoot.realAt}/`)).toBe(false);
    expect(input.home.realAt === input.target.realAt).toBe(false);
    const hit = kitHomeOverlap(input);
    expect(hit, "the kit root lies inside the target by identity").not.toBeNull();
    expect(hit?.entry).toBe("agent-factory");
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
  spawnBin(INSTALL_JS, ["--yes", ...withAgentFlags(args)], c.target, c.grugopsHome, { dryRun, home: c.home, timeoutMs: 180_000 });
const update = (c: KitHomeCase, dryRun = false): Run =>
  spawnBin(INSTALL_JS, ["--yes", "--update"], c.target, c.grugopsHome, { dryRun, home: c.home, timeoutMs: 180_000 });

interface RecordJson {
  readonly grugopsHome: string;
  readonly ledger: ReadonlyArray<Record<string, unknown>>;
}
const recordOf = (c: KitHomeCase): RecordJson => JSON.parse(readFileSync(join(c.grugopsHome, KIT_HOME_RECORD_REL), "utf8")) as RecordJson;
const backupsIn = (c: KitHomeCase): string[] => (existsSync(c.grugopsHome) ? readdirSync(c.grugopsHome).filter((n) => n.startsWith(`${KIT_ENTRY_PATH}.bak.`)).sort() : []);
const kitRoot = (c: KitHomeCase): string => join(c.grugopsHome, KIT_ENTRY_PATH);
/**
 * The kit entries a full install records (plan 43-06, D-11, D-27): the kit root and each shipped docs root, in the
 * ledger's path order. Composed from the two declarations, never typed here.
 */
const KIT_ENTRY_RECORD = [KIT_ENTRY_PATH, ...SHIPPED_DOCS_ROOTS].sort().map((path) => ({ path, kind: "kit" }));
/** The staging and holder directories copyKit makes in the kit home (`.<entry>.tmp-*`, `.<entry>.old-*`), left after a run. */
const stagingLeftIn = (c: KitHomeCase): string[] =>
  readdirSync(c.grugopsHome).filter((n) => [KIT_ENTRY_PATH, ...SHIPPED_DOCS_ROOTS].some((e) => n.startsWith(`.${e}.`)));

/** A user's own agent-factory/ at the kit root, holding notes install never wrote. */
function plantUserKitRoot(c: KitHomeCase): string {
  mkdirSync(kitRoot(c), { recursive: true });
  const notes = "the user's notes, kept in a directory that happens to sit at the kit root\n";
  writeFileSync(join(kitRoot(c), "MYNOTES.md"), notes);
  return notes;
}

describe("the kit-home record: copyKit replaces only a kit it recorded, and keeps anything else as a recorded backup (plan 33.1-37)", () => {
  // Plan 43-06 (D-11, D-27): the record holds one kit entry per kit entry path, the kit and the shipped docs roots.
  it("a first install writes the kit and `.grugops-kit.json` bound to the kit home's real path, holding one kit entry per kit entry path", () => {
    const c = kitHomeCase("first");
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const rec = recordOf(c);
    expect(Object.keys(rec).sort()).toEqual(["grugopsHome", "ledger"]);
    expect(rec.grugopsHome).toBe(recordedHome(c.grugopsHome));
    expect(rec.ledger).toEqual(KIT_ENTRY_RECORD);
    expect(backupsIn(c)).toEqual([]);
    // No temporary directory is left behind.
    expect(stagingLeftIn(c)).toEqual([]);
  });

  it("a re-install over a recorded kit replaces it with no backup (D-31 item 14): an edit inside it is overwritten, and the record still names the kit", () => {
    const c = kitHomeCase("recorded");
    expect(install(c).status).toBe(0);
    writeFileSync(join(kitRoot(c), "VERSION"), "9.9.9-edited-in-kit-home\n");
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(readFileSync(join(kitRoot(c), "VERSION"), "utf8")).not.toContain("9.9.9-edited-in-kit-home");
    expect(backupsIn(c)).toEqual([]);
    expect(recordOf(c).ledger).toEqual(KIT_ENTRY_RECORD);
    expect(r.stdout).toMatch(/replaced the kit install recorded writing there/);
    expect(stagingLeftIn(c)).toEqual([]);
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
        expect(recordOf(c).grugopsHome).toBe(recordedHome(c.grugopsHome));
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE KIT CARRIES ITS LICENSE (quick task 261018-hs8, Task 4, LICENSE-SHIP-01). grugops is MIT, and MIT
// asks that its copyright and permission notice go with every copy. The kit is `agent-factory/`, copied
// whole by copyKit, by `--update` and by the minimal path (install/README.md §1); the root LICENSE and
// NOTICE sat outside it, so no kit copy carried them. `agent-factory/LICENSE` and `agent-factory/NOTICE`
// are committed byte copies of the root files, which stay the one source. THE RULE: change the root
// file, then re-copy it (`cp LICENSE agent-factory/LICENSE`, `cp NOTICE agent-factory/NOTICE`); never
// edit a copy by hand. Only the byte-equality case names the two files; the install and `--update`
// cases read the kit root from the marker and compare against the root files.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const REPO = join(import.meta.dirname, "..");
const LICENSE_FILES = ["LICENSE", "NOTICE"] as const;
/** The kit root the target's marker records (`kitRoot` in `.grugops/install.json`), never typed here. */
const markerKitRoot = (c: KitHomeCase): string => {
  const marker = JSON.parse(readFileSync(join(c.target, ".grugops", "install.json"), "utf8")) as { kitRoot?: unknown };
  if (typeof marker.kitRoot !== "string" || marker.kitRoot === "") throw new Error(`the marker has no kitRoot: ${JSON.stringify(marker)}`);
  return marker.kitRoot;
};

describe("the kit carries the MIT license and NOTICE (quick task 261018-hs8, Task 4)", () => {
  for (const name of LICENSE_FILES) {
    it(`agent-factory/${name} is a byte copy of the root ${name}`, () => {
      const root = readFileSync(join(REPO, name));
      expect(root.length, `the root ${name} is empty`).toBeGreaterThan(0);
      const copy = join(REPO, "agent-factory", name);
      expect(existsSync(copy), `agent-factory/${name} is missing; run: cp ${name} agent-factory/${name}`).toBe(true);
      expect(readFileSync(copy).equals(root), `agent-factory/${name} differs from the root ${name}; run: cp ${name} agent-factory/${name}`).toBe(true);
    });
  }

  it("an install leaves LICENSE and NOTICE at the marker's kitRoot, byte-identical to the root files", () => {
    const c = kitHomeCase("license-install");
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const at = markerKitRoot(c);
    for (const name of LICENSE_FILES) {
      expect(existsSync(join(at, name)), `${at}/${name} is missing`).toBe(true);
      expect(readFileSync(join(at, name)).equals(readFileSync(join(REPO, name))), `${at}/${name} differs from the root ${name}`).toBe(true);
    }
  });

  it("--update over a recorded kit whose LICENSE and NOTICE were deleted leaves both present again", () => {
    const c = kitHomeCase("license-update");
    expect(install(c).status).toBe(0);
    const at = markerKitRoot(c);
    for (const name of LICENSE_FILES) rmSync(join(at, name));
    for (const name of LICENSE_FILES) expect(existsSync(join(at, name)), `premise: ${name} was not deleted`).toBe(false);
    const r = update(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    for (const name of LICENSE_FILES) {
      expect(existsSync(join(at, name)), `--update did not restore ${name}\n${r.stdout}`).toBe(true);
      expect(readFileSync(join(at, name)).equals(readFileSync(join(REPO, name)))).toBe(true);
    }
  });

  it("install/README.md §1, the minimal path, says the agent-factory/ folder carries LICENSE and NOTICE and that they stay with the copy", () => {
    const readme = readFileSync(join(REPO, "install", "README.md"), "utf8");
    const start = readme.indexOf("## 1. The minimal path");
    expect(start, "§1 heading not found").toBeGreaterThanOrEqual(0);
    const end = readme.indexOf("\n## 2.", start);
    expect(end, "§2 heading not found after §1").toBeGreaterThan(start);
    const section = readme.slice(start, end);
    for (const name of LICENSE_FILES) expect(section, `§1 does not name \`${name}\``).toContain(`\`${name}\``);
    expect(section).toMatch(/stay with the copy/);
  });
});

// ── PLAN 43-02 (D-11, D-27): THE SHIPPED USER DOCS, DERIVED ONCE ─────────────────────────────────────
//
// install/kit-source.ts declares which user docs ship: every `.md` under SHIPPED_DOCS_ROOTS minus
// CHECKOUT_ONLY_DOCS. The public-docs corpus reads it now (plan 43-02); the installer (plan 43-06) and the
// story gate's link check (plan 43-03) read it later. These cases pin the derivation's contract on scratch
// roots, and its two live-tree facts: every checkout-only entry exists, and the pages that persist through
// phase 43 are members. No case names a page a later plan of this phase deletes.

/** The pages that persist through phase 43, asserted present on the live tree. */
const PERSISTING_SHIPPED_DOCS = [
  "docs/GUARANTEES.md",
  "docs/faq.md",
  "docs/skills.md",
  "examples/01-greenfield-bootstrap.md",
  "examples/02-brownfield-bootstrap.md",
  "examples/03-ticket-to-pr.md",
  "examples/04-sprint-cycle.md",
  "examples/05-release-run.md",
];

function writeAt(root: string, rel: string, body = "# page\n"): void {
  const dst = join(root, ...rel.split("/"));
  mkdirSync(join(dst, ".."), { recursive: true });
  writeFileSync(dst, body, "utf8");
}

describe("shippedDocs: the shipped user docs, declared once (plan 43-02, D-11, D-27)", () => {
  it("the source roots are docs and examples, and the checkout-only list is the five recorded paths", () => {
    expect(SHIPPED_DOCS_ROOTS).toEqual(["docs", "examples"]);
    expect(CHECKOUT_ONLY_DOCS.map((e) => e.path)).toEqual([
      "docs/audit/",
      "docs/design/",
      "docs/initial/",
      "docs/dogfood-human-runbook.md",
      "docs/pre-v3-state-layout.md",
    ]);
  });

  it("every CHECKOUT_ONLY_DOCS entry names a path that exists in this checkout and carries a reason", () => {
    for (const e of CHECKOUT_ONLY_DOCS) {
      const abs = join(REPO, ...e.path.split("/").filter((s) => s !== ""));
      expect(existsSync(abs), `${e.path} does not exist, so the entry is stale`).toBe(true);
      // A directory entry ends in `/` and must be a directory; a file entry must be a file.
      expect(statSync(abs).isDirectory(), e.path).toBe(e.path.endsWith("/"));
      expect(e.why.trim().length, `${e.path} has no reason`).toBeGreaterThan(0);
    }
  });

  it("returns sorted POSIX paths, keeps nested pages, and leaves out checkout-only paths and non-.md files", () => {
    const root = fresh("shipped-docs-contract");
    for (const rel of ["docs/z.md", "docs/a/b.md", "docs/faq.md", "examples/01-x.md"]) writeAt(root, rel);
    writeAt(root, "docs/notes.txt");
    writeAt(root, "examples/diagram.png");
    for (const e of CHECKOUT_ONLY_DOCS) {
      if (e.path.endsWith("/")) {
        writeAt(root, `${e.path}inside.md`);
        writeAt(root, `${e.path}deeper/nested.md`);
      } else {
        writeAt(root, e.path);
      }
    }
    expect(shippedDocs(root)).toEqual(["docs/a/b.md", "docs/faq.md", "docs/z.md", "examples/01-x.md"]);
  });

  it("a symlinked page is a page, and a symlink cycle ends the descent without repeating a page", () => {
    const root = fresh("shipped-docs-links");
    writeAt(root, "docs/real.md");
    writeAt(root, "examples/01-x.md");
    writeAt(root, "outside/linked.md");
    symlinkSync(join(root, "outside", "linked.md"), join(root, "docs", "linked.md"));
    // docs/loop points back at docs/: on the current path it repeats, so it is not walked again.
    symlinkSync(join(root, "docs"), join(root, "docs", "loop"));
    expect(shippedDocs(root)).toEqual(["docs/linked.md", "docs/real.md", "examples/01-x.md"]);
  });

  it("returns [] when docs/ and examples/ exist and hold no shipped page", () => {
    const root = fresh("shipped-docs-empty");
    mkdirSync(join(root, "docs"), { recursive: true });
    mkdirSync(join(root, "examples"), { recursive: true });
    // Only checkout-only content: read, and nothing in it ships.
    writeAt(root, "docs/audit/record.md");
    writeAt(root, "docs/dogfood-human-runbook.md");
    expect(shippedDocs(root)).toEqual([]);
  });

  it("returns null when a source root cannot be read, never a partial list", () => {
    // The whole source root is missing.
    expect(shippedDocs(join(SCRATCH, "no-such-source-root"))).toBeNull();
    // docs/ is readable and holds a page, but examples/ is missing: null, not ["docs/faq.md"].
    const root = fresh("shipped-docs-one-root");
    writeAt(root, "docs/faq.md");
    expect(shippedDocs(root)).toBeNull();
  });

  it("on the live tree: the persisting pages are members and no checkout-only path is", () => {
    const live = shippedDocs(REPO);
    expect(live).not.toBeNull();
    for (const page of PERSISTING_SHIPPED_DOCS) expect(live, page).toContain(page);
    const leaked = (live ?? []).filter((p) =>
      CHECKOUT_ONLY_DOCS.some((e) => (e.path.endsWith("/") ? p.startsWith(e.path) : p === e.path)),
    );
    expect(leaked).toEqual([]);
    for (const p of live ?? []) {
      expect(p.startsWith("docs/audit/") || p.startsWith("docs/design/") || p.startsWith("docs/initial/"), p).toBe(false);
    }
  });
});

// ── PLAN 43-06 (D-11, D-27): THE SHIPPED DOCS AND EXAMPLES LAND IN THE KIT HOME BESIDE THE KIT ──────────
//
// An install copies every shippedDocs() page into the kit home as a sibling of the kit:
// `$GRUGOPS_HOME/docs/<rel>` and `$GRUGOPS_HOME/examples/<rel>`, so `../docs/` from agent-factory/README.md
// resolves the same in the checkout and in the kit home. Each docs root is a kit entry the kit-home record
// names. Since review CR-01 of phase 43, an entry install did not record is left exactly where it is, with a
// note, never renamed, backed up, overwritten or deleted. Checkout-only paths never reach a kit home. These
// cases prove the fresh arm and the unowned arm; plan 43-15 proves replace, --update, DRY_RUN and prune.
// The target's state roots are compared byte for byte around every run, since no install path may touch them.

const SHIPPED_SAMPLES = ["docs/faq.md", "docs/GUARANTEES.md", "examples/01-greenfield-bootstrap.md"] as const;
const USER_STATE_NOTE = "USER-NOTE-43-06.md";

/**
 * One user file under every STATE_ROOTS root of the target (read from the import, never typed). Returns
 * the check to run after install: each planted file byte-identical, and the target's docs/ tree (a root
 * that shares its name with a kit entry) unchanged as a whole.
 */
function plantStateRoots(target: string): () => string[] {
  const planted = STATE_ROOTS.map((root) => {
    const rel = `${root}/${USER_STATE_NOTE}`;
    const body = `the user's own file under ${root}/, which no install path may touch\n`;
    writeAt(target, rel, body);
    return [rel, body] as const;
  });
  const docsBefore = snapshotTree(join(target, "docs"));
  return () => {
    const problems: string[] = [];
    for (const [rel, body] of planted) {
      const at = join(target, ...rel.split("/"));
      if (!existsSync(at)) problems.push(`${rel} is gone`);
      else if (readFileSync(at, "utf8") !== body) problems.push(`${rel} changed`);
    }
    if (snapshotTree(join(target, "docs")) !== docsBefore) problems.push("the target's docs/ changed");
    return problems;
  };
}

const docsBackupsIn = (c: KitHomeCase): string[] =>
  existsSync(c.grugopsHome) ? readdirSync(c.grugopsHome).filter((n) => n.startsWith("docs.bak.")).sort() : [];

describe("plan 43-06: an install ships the user docs and examples into the kit home beside the kit (D-11, D-27)", () => {
  it("a fresh install copies every shipped page byte for byte, records the kit entries, leaves no checkout-only path, and the README link resolves", () => {
    const c = kitHomeCase("docs-fresh");
    const stateCheck = plantStateRoots(c.target);
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const shipped = shippedDocs(REPO);
    expect(shipped, "premise: shippedDocs could not read this checkout").not.toBeNull();
    for (const rel of SHIPPED_SAMPLES) expect(shipped, `premise: ${rel} is a shipped page`).toContain(rel);
    for (const rel of shipped ?? []) {
      const at = join(c.grugopsHome, ...rel.split("/"));
      expect(existsSync(at), `${rel} is not in the kit home`).toBe(true);
      expect(readFileSync(at).equals(readFileSync(join(REPO, ...rel.split("/")))), `${rel} differs from the source`).toBe(true);
    }
    for (const e of CHECKOUT_ONLY_DOCS) {
      const at = join(c.grugopsHome, ...e.path.split("/").filter((s) => s !== ""));
      expect(existsSync(at), `checkout-only ${e.path} reached the kit home`).toBe(false);
    }
    expect(recordOf(c).ledger).toEqual(KIT_ENTRY_RECORD);
    // agent-factory/README.md links ../docs/GUARANTEES.md; in the kit home it must resolve to a file.
    const readme = readFileSync(join(kitRoot(c), "README.md"), "utf8");
    expect(readme, "premise: the kit README links ../docs/GUARANTEES.md").toContain("](../docs/GUARANTEES.md)");
    expect(statSync(join(kitRoot(c), "..", "docs", "GUARANTEES.md")).isFile()).toBe(true);
    expect(r.stdout).toMatch(/^ {2}copied\s+docs → /m);
    expect(r.stdout).toMatch(/^ {2}copied\s+examples → /m);
    expect(stagingLeftIn(c)).toEqual([]);
    expect(stateCheck()).toEqual([]);
  });

  // Review CR-01 of phase 43 (human decision 2026-11-18, option A) replaced this case. It asserted that a user's own
  // unrecorded $GRUGOPS_HOME/docs was renamed to a recorded docs.bak.<ISO>, which --prune-old-kit then deleted. The
  // contract now is that such a folder is left where it is, byte for byte, with no backup and no record; the cases
  // live in the CR-01 block below.
  it("a user's own unrecorded $GRUGOPS_HOME/docs is left in place byte for byte, no docs.bak.<ISO> is made, and the shipped docs are not copied over it", () => {
    const c = kitHomeCase("docs-unrecorded");
    const stateCheck = plantStateRoots(c.target);
    writeAt(c.grugopsHome, "docs/MYNOTES.md", "the user's own notes in a folder that happens to be named docs\n");
    writeAt(c.grugopsHome, "docs/faq.md", "the user's own faq, not the shipped one\n");
    const before = snapshotTree(join(c.grugopsHome, "docs"));
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(docsBackupsIn(c)).toEqual([]);
    expect(snapshotTree(join(c.grugopsHome, "docs"))).toBe(before);
    const rec = recordOf(c);
    expect(rec.ledger.filter((e) => e.kind === "backup"), JSON.stringify(rec)).toEqual([]);
    expect(rec.ledger.filter((e) => e.kind === "kit").map((e) => e.path)).toEqual(["agent-factory", "examples"]);
    expect(r.stdout).not.toMatch(/^ {2}backed-up\s/m);
    // A later re-install decides the same way: the folder is still not install's.
    const again = install(c);
    expect(again.status, again.stdout).toBe(0);
    expect(docsBackupsIn(c)).toEqual([]);
    expect(snapshotTree(join(c.grugopsHome, "docs"))).toBe(before);
    expect(stateCheck()).toEqual([]);
  });

  it("a target that is $GRUGOPS_HOME/docs is refused before any write, like a target at the kit root", () => {
    const c = kitHomeCase("docs-is-target");
    const target = join(c.grugopsHome, "docs");
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, "MYNOTES.md"), "the user's repository happens to sit at the docs entry\n");
    const before = snapshotTree(c.grugopsHome);
    const r = spawnBin(INSTALL_JS, ["--yes", ...ALL_AGENT_FLAGS], target, c.grugopsHome, { home: c.home, timeoutMs: 120_000 });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(1);
    expect(r.stdout).toBe("");
    expect(r.stderr).toMatch(/overlaps the target/);
    expect(snapshotTree(c.grugopsHome)).toBe(before);
  });
});

// ── REVIEW CR-01 OF PHASE 43 (human decision 2026-11-18, option A): AN UNOWNED docs/ OR examples/ IS LEFT ALONE ──
//
// `docs` and `examples` are common folder names, and install/README.md documents GRUGOPS_HOME=$HOME as a supported
// layout. Before this fix, a folder at either path that the kit-home record did not name was renamed to a recorded
// `<entry>.bak.<ISO>`, and --prune-old-kit then deleted that backup. Now copyKit leaves such a folder exactly as it is,
// on install, re-install, --update and DRY_RUN: no rename, no backup, no record entry (so prune has nothing to act
// on), and a `note` line saying the shipped pages were not copied there and what to do. A docs entry the record does
// own still takes the replace and --update arms (plan 43-15, below). The kit root keeps its own backup arm.

/** The note copyKit prints for an unowned docs entry, matched on the entry's path and its fixed opening words. */
function unownedNote(stdout: string, entry: string): string[] {
  const re = new RegExp(`^ {2}note\\s+\\S*[/\\\\]${escapeRe(entry)}: something install did not write is already there`);
  return stdout.split("\n").filter((l) => re.test(l));
}
const prune = (c: KitHomeCase, dryRun = false): Run =>
  spawnBin(INSTALL_JS, ["--yes", "--prune-old-kit"], c.target, c.grugopsHome, { dryRun, home: c.home, timeoutMs: 120_000 });

describe("review CR-01 (phase 43): an unowned docs or examples folder in the kit home is left untouched, and prune can never reach it", () => {
  it("the reviewer's layout: GRUGOPS_HOME=$HOME holding docs/notes.md, target $HOME/code/repo; install --claude exits 0 and leaves docs/notes.md, then --prune-old-kit leaves it too", () => {
    const root = fresh("cr01-home-is-kit-home");
    const home = join(root, "home");
    const target = join(home, "code", "repo");
    mkdirSync(target, { recursive: true });
    const notes = "the user's own notes in ~/docs, which grugops never wrote\n";
    writeAt(home, "docs/notes.md", notes);
    const r = spawnBin(INSTALL_JS, ["--yes", "--claude"], target, home, { home, timeoutMs: 180_000 });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(readFileSync(join(home, "docs", "notes.md"), "utf8")).toBe(notes);
    expect(readdirSync(join(home, "docs"))).toEqual(["notes.md"]);
    expect(readdirSync(home).filter((n) => n.startsWith("docs.bak.")), "a docs backup was made").toEqual([]);
    const rec = JSON.parse(readFileSync(join(home, KIT_HOME_RECORD_REL), "utf8")) as RecordJson;
    expect(rec.ledger.filter((e) => e.kind === "backup"), "a backup was recorded").toEqual([]);
    expect(rec.ledger.some((e) => e.path === "docs"), "the record names the user's docs").toBe(false);
    expect(unownedNote(r.stdout, "docs").length, r.stdout).toBe(1);
    const p = spawnBin(INSTALL_JS, ["--yes", "--prune-old-kit"], target, home, { home, timeoutMs: 120_000 });
    expect(p.status, `${p.stdout}\n${p.stderr}`).toBe(0);
    expect(readFileSync(join(home, "docs", "notes.md"), "utf8")).toBe(notes);
    expect(p.stdout).not.toMatch(/^ {2}removed\s/m);
  });

  for (const entry of SHIPPED_DOCS_ROOTS) {
    for (const how of ["install", "--update"] as const) {
      it(`${how} over an unrecorded ${entry}/ leaves it byte for byte, makes no ${entry}.bak, records nothing for it, prints the note, and --prune-old-kit leaves it`, () => {
        const c = kitHomeCase(`cr01-${entry}-${how}`);
        writeAt(c.grugopsHome, `${entry}/notes.md`, `the user's own ${entry} notes\n`);
        const before = snapshotTree(join(c.grugopsHome, entry));
        const r = how === "install" ? install(c) : update(c);
        expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
        expect(snapshotTree(join(c.grugopsHome, entry))).toBe(before);
        expect(entryBackupsIn(c, entry)).toEqual([]);
        const rec = recordOf(c);
        expect(rec.ledger.filter((e) => e.kind === "backup"), JSON.stringify(rec)).toEqual([]);
        expect(rec.ledger.some((e) => e.path === entry), JSON.stringify(rec)).toBe(false);
        const note = unownedNote(r.stdout, entry);
        expect(note.length, r.stdout).toBe(1);
        expect(note[0]).toContain(`so the shipped ${entry} were not copied there`);
        expect(note[0]).toContain("set GRUGOPS_HOME to a directory of its own");
        expect(entryLines(r, "copied", entry)).toEqual([]);
        expect(entryLines(r, "backed-up", entry)).toEqual([]);
        // The other docs entry is copied as usual.
        for (const other of SHIPPED_DOCS_ROOTS.filter((e) => e !== entry)) expect(entryLines(r, "copied", other).length, r.stdout).toBe(1);
        for (const dry of [true, false]) {
          const p = prune(c, dry);
          expect(p.status, `${p.stdout}\n${p.stderr}`).toBe(0);
          expect(snapshotTree(join(c.grugopsHome, entry)), `${dry ? "DRY_RUN " : ""}prune changed ${entry}/`).toBe(before);
        }
        expect(stagingLeftIn(c)).toEqual([]);
      });
    }
  }

  it("a recorded docs entry the user swapped for a file is no longer install's: a re-install leaves the file and copies nothing there", () => {
    const c = kitHomeCase("cr01-recorded-then-file");
    expect(install(c).status).toBe(0);
    rmSync(join(c.grugopsHome, "docs"), { recursive: true });
    writeFileSync(join(c.grugopsHome, "docs"), "a file the user keeps at the docs path\n");
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(readFileSync(join(c.grugopsHome, "docs"), "utf8")).toBe("a file the user keeps at the docs path\n");
    expect(entryBackupsIn(c, "docs")).toEqual([]);
    expect(unownedNote(r.stdout, "docs").length, r.stdout).toBe(1);
    expect(recordOf(c).ledger.some((e) => e.path === "docs")).toBe(false);
  });

  it("DRY_RUN install and DRY_RUN --update print the same note for each unowned entry, no would-copy or would-back-up for it, and change no byte in the kit home", () => {
    const c = kitHomeCase("cr01-dry-run");
    for (const e of SHIPPED_DOCS_ROOTS) writeAt(c.grugopsHome, `${e}/notes.md`, `the user's own ${e} notes\n`);
    const before = snapshotTree(c.grugopsHome);
    for (const run of [() => install(c, [], true), () => update(c, true)]) {
      const r = run();
      expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
      for (const e of SHIPPED_DOCS_ROOTS) {
        expect(unownedNote(r.stdout, e).length, `${e}\n${r.stdout}`).toBe(1);
        expect(entryLines(r, "would-copy", e), r.stdout).toEqual([]);
        expect(entryLines(r, "would-back-up", e), r.stdout).toEqual([]);
        expect(entryLines(r, "would-replace", e), r.stdout).toEqual([]);
      }
      expect(r.stdout).toMatch(/^ {2}would-copy\s+kit/m);
      expect(snapshotTree(c.grugopsHome)).toBe(before);
    }
  });
});

// ── PLAN 43-15 (D-11, D-27): THE DOCS AND EXAMPLES TAKE THE KIT'S REPLACE, --update AND DRY_RUN ARMS ─────────
//
// Plan 43-06 proved the fresh arm and the backup arm for the shipped docs entries. These cases mirror the kit's own
// cases above one for one, for `docs` and `examples` (SHIPPED_DOCS_ROOTS, read from the import):
//   - a re-install over recorded entries replaces them with no backup, and an edit inside them is overwritten (D-31
//     item 14, the kit's own rule);
//   - --update over recorded entries that are identical replaces them with no backup, and over ones that differ keeps
//     each as a recorded `<entry>.bak.<ISO>` holding the edit (D-06, D-09);
//   - DRY_RUN prints would-copy for each entry plus would-back-up or would-replace as its arm says, and the kit home is
//     byte-unchanged.
// The target's state roots are compared byte for byte around every case (plantStateRoots above).

const EDITED_DOC = "docs/faq.md";
const EDITED_EXAMPLE = "examples/01-greenfield-bootstrap.md";
/** The `<entry>.bak.*` names in the kit home, for one kit entry. */
const entryBackupsIn = (c: KitHomeCase, entry: string): string[] =>
  existsSync(c.grugopsHome) ? readdirSync(c.grugopsHome).filter((n) => n.startsWith(`${entry}.bak.`)).sort() : [];
/** Every `<entry>.bak.*` name in the kit home, over all kit entries. */
const allBackupsIn = (c: KitHomeCase): string[] => [KIT_ENTRY_PATH, ...SHIPPED_DOCS_ROOTS].flatMap((e) => entryBackupsIn(c, e));
/** Whether the kit home's copy of a shipped page is byte-identical to the source page. */
const sameAsSource = (c: KitHomeCase, rel: string): boolean =>
  readFileSync(join(c.grugopsHome, ...rel.split("/"))).equals(readFileSync(join(REPO, ...rel.split("/"))));
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The report lines of one label whose subject is the kit entry `entry` (its path ends `/<entry>` or `\<entry>`). */
function entryLines(r: Run, label: string, entry: string): string[] {
  const re = new RegExp(`^ {2}${escapeRe(label)}\\s+(?:${escapeRe(entry)} → |\\S*[/\\\\]${escapeRe(entry)}(?: |$))`);
  return r.stdout.split("\n").filter((l) => re.test(l));
}

describe("plan 43-15: the shipped docs and examples take the kit's replace, --update and DRY_RUN arms (D-11, D-27)", () => {
  it("premise: the edited pages are shipped pages, one under each shipped docs root", () => {
    const shipped = shippedDocs(REPO);
    expect(shipped).not.toBeNull();
    expect(shipped).toContain(EDITED_DOC);
    expect(shipped).toContain(EDITED_EXAMPLE);
    expect([EDITED_DOC, EDITED_EXAMPLE].map((p) => p.split("/")[0]).sort()).toEqual([...SHIPPED_DOCS_ROOTS].sort());
  });

  it("a re-install over recorded docs and examples replaces them with no backup: an edit inside them is overwritten, an added page is gone, and the record still names every kit entry", () => {
    const c = kitHomeCase("docs-recorded");
    const stateCheck = plantStateRoots(c.target);
    expect(install(c).status).toBe(0);
    writeAt(c.grugopsHome, EDITED_DOC, "9.9.9-edited-in-kit-home docs\n");
    writeAt(c.grugopsHome, EDITED_EXAMPLE, "9.9.9-edited-in-kit-home examples\n");
    writeAt(c.grugopsHome, "docs/ADDED-IN-KIT-HOME.md", "a page added in the kit home\n");
    const r = install(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(sameAsSource(c, EDITED_DOC), "the edit inside docs/ was not overwritten").toBe(true);
    expect(sameAsSource(c, EDITED_EXAMPLE), "the edit inside examples/ was not overwritten").toBe(true);
    expect(existsSync(join(c.grugopsHome, "docs", "ADDED-IN-KIT-HOME.md")), "a page added inside the recorded docs survived").toBe(false);
    // Joined to one line, so a failure reports the backup names on one line.
    expect(allBackupsIn(c).join(", "), "a recorded entry was kept as a backup instead of replaced").toBe("");
    expect(recordOf(c).ledger).toEqual(KIT_ENTRY_RECORD);
    for (const e of SHIPPED_DOCS_ROOTS) {
      const copied = entryLines(r, "copied", e);
      expect(copied.length, `${e}\n${r.stdout}`).toBe(1);
      expect(copied[0]).toContain(`(replaced the shipped ${e} install recorded writing there)`);
    }
    expect(stagingLeftIn(c)).toEqual([]);
    expect(stateCheck()).toEqual([]);
  });

  it("--update over recorded docs and examples that are identical replaces them with no backup; over ones that differ it keeps each as a recorded backup holding the edit", () => {
    const c = kitHomeCase("docs-update");
    const stateCheck = plantStateRoots(c.target);
    expect(install(c).status).toBe(0);
    const same = update(c);
    expect(same.status, same.stdout).toBe(0);
    expect(allBackupsIn(c)).toEqual([]);
    expect(recordOf(c).ledger).toEqual(KIT_ENTRY_RECORD);
    for (const e of SHIPPED_DOCS_ROOTS) expect(entryLines(same, "copied", e)[0] ?? "", same.stdout).toContain(`(replaced the shipped ${e} install recorded writing there)`);
    const edits: ReadonlyArray<readonly [string, string, string]> = [
      ["docs", EDITED_DOC, "9.9.9-displaced docs\n"],
      ["examples", EDITED_EXAMPLE, "9.9.9-displaced examples\n"],
    ];
    for (const [, rel, body] of edits) writeAt(c.grugopsHome, rel, body);
    const r = update(c);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    // The kit itself is identical, so it is replaced with no backup.
    expect(entryBackupsIn(c, KIT_ENTRY_PATH)).toEqual([]);
    const rec = recordOf(c);
    for (const [entry, rel, body] of edits) {
      const baks = entryBackupsIn(c, entry);
      expect(baks.length, `${entry} backups: ${baks.join(", ")}`).toBe(1);
      expect(baks[0]).toMatch(new RegExp(`^${entry}\\.bak\\.\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}\\.\\d{3}Z$`));
      expect(readFileSync(join(c.grugopsHome, baks[0], ...rel.split("/").slice(1)), "utf8"), `${entry}: the backup does not hold the edit`).toBe(body);
      expect(sameAsSource(c, rel), `${entry}: the new copy is not the shipped page`).toBe(true);
      const backup = rec.ledger.find((e) => e.kind === "backup" && e.of === entry);
      expect(backup, JSON.stringify(rec)).toMatchObject({ path: baks[0], origin: "kit-home", of: entry });
      expect(String(backup!.content)).toMatch(/^tree:sha256:[0-9a-f]{64}$/);
      const backedUp = entryLines(r, "backed-up", entry);
      expect(backedUp.length, `${entry}\n${r.stdout}`).toBe(1);
      expect(backedUp[0]).toContain(`the shipped ${entry} install recorded writing there differs from the new one (--update keeps it)`);
    }
    expect(rec.ledger.filter((e) => e.kind === "kit")).toEqual(KIT_ENTRY_RECORD);
    expect(stagingLeftIn(c)).toEqual([]);
    expect(stateCheck()).toEqual([]);
  });

  // Review CR-01 of phase 43 changed the unrecorded half of this case: it asserted would-copy plus would-back-up for a
  // user's own docs/ and examples/. An unowned docs entry is now left alone, so the preview prints the CR-01 note for
  // it and neither line (the CR-01 block above holds the full DRY_RUN case).
  it("DRY_RUN prints the CR-01 note for an unrecorded docs entry, would-copy plus would-replace for a recorded one or, under --update, would-back-up for the one that differs, and writes nothing in the kit home", () => {
    const c = kitHomeCase("docs-dry-run");
    const stateCheck = plantStateRoots(c.target);
    for (const e of SHIPPED_DOCS_ROOTS) writeAt(c.grugopsHome, `${e}/MYNOTES.md`, `the user's own ${e} notes\n`);
    const before = snapshotTree(c.grugopsHome);
    const unrec = install(c, [], true);
    expect(unrec.status, unrec.stdout).toBe(0);
    for (const e of SHIPPED_DOCS_ROOTS) {
      expect(unownedNote(unrec.stdout, e).length, `${e}\n${unrec.stdout}`).toBe(1);
      expect(entryLines(unrec, "would-copy", e), `${e}\n${unrec.stdout}`).toEqual([]);
      expect(entryLines(unrec, "would-back-up", e), `${e}\n${unrec.stdout}`).toEqual([]);
      expect(entryLines(unrec, "would-replace", e)).toEqual([]);
    }
    expect(snapshotTree(c.grugopsHome)).toBe(before);
    for (const e of SHIPPED_DOCS_ROOTS) rmSync(join(c.grugopsHome, e), { recursive: true });
    expect(install(c).status).toBe(0);
    const recorded = snapshotTree(c.grugopsHome);
    const rec = install(c, [], true);
    expect(rec.status, rec.stdout).toBe(0);
    for (const e of SHIPPED_DOCS_ROOTS) {
      expect(entryLines(rec, "would-copy", e).length, `${e}\n${rec.stdout}`).toBe(1);
      const replace = entryLines(rec, "would-replace", e);
      expect(replace.length, `${e}\n${rec.stdout}`).toBe(1);
      expect(replace[0]).toContain(`(the shipped ${e} install recorded writing there)`);
    }
    expect(rec.stdout).not.toMatch(/^ {2}would-back-up\s/m);
    expect(snapshotTree(c.grugopsHome)).toBe(recorded);
    // --update: the docs differ from the shipped pages, the examples do not.
    writeAt(c.grugopsHome, EDITED_DOC, "9.9.9-edited docs\n");
    const edited = snapshotTree(c.grugopsHome);
    const upd = update(c, true);
    expect(upd.status, upd.stdout).toBe(0);
    for (const e of SHIPPED_DOCS_ROOTS) expect(entryLines(upd, "would-copy", e).length, `${e}\n${upd.stdout}`).toBe(1);
    expect(entryLines(upd, "would-back-up", "docs").length, upd.stdout).toBe(1);
    expect(entryLines(upd, "would-replace", "docs"), upd.stdout).toEqual([]);
    expect(entryLines(upd, "would-replace", "examples").length, upd.stdout).toBe(1);
    expect(entryLines(upd, "would-back-up", "examples"), upd.stdout).toEqual([]);
    expect(snapshotTree(c.grugopsHome)).toBe(edited);
    expect(stateCheck()).toEqual([]);
  });
});

// installer-prune.test.ts — install records every backup it makes, and --prune-old-kit removes only what
// install recorded, unchanged (plan 33.1-40, D-33 (c), review CR-02 and IN-03; brief DC-2 and DC-3).
//
// THE DEFECT (CR-02, reproduced by the verifier). `install.js --yes --prune-old-kit` removed a user's
// `thesis.bak.<ISO>/` (with a chapter in it) and `budget.xlsx.bak.<ISO>`, exit 0: prune removed any name
// ending in `.bak.<ISO>` at the target root and in the kit home, directories recursively. A name is not a
// record (DC-2). Install also recorded none of the backups it made (deferred row 45), so nothing could
// prune by record before. Now:
//   - install records each backup it makes in the target as a `backup` entry of the install ledger, at its
//     final path, with a content record (a file, link or tree record, or null);
//   - prune removes only recorded backups of the origins it has always removed (in-repo-kit and
//     legacy-config in the target, kit-home in the kit home), only through owns, and only while the backup
//     still holds its record. Everything else named like a backup is left byte for byte and named.
//
// THE EXPECTED SETS ARE DERIVED, NEVER TYPED. The backups a --migrate made are the outermost paths it
// created whose last segment ends `.bak.<ISO>` or holds `.grugops-edited-`, found by snapshotting the
// target before and after. The prune class plants every backup shape install-paths.test-support.ts derives
// (BACKUP_SHAPES: install's own base names from the migrate variant's write set, plus user names and the
// special shapes), with the count pinned.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first). Hermetic: HOME,
// GRUGOPS_HOME and TARGET are scratch directories removed at the end.
//
// Clear professional voice: this is a safety surface. Vitest `globals: false` → explicit imports.

import { describe, it, expect, afterAll } from "vitest";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  BACKUP_USER_BASES,
  type Run,
  backupShapes,
  deriveWritePaths,
  lineNamesPath,
  pathText,
  makeOldLayoutFixture,
  plantBackupShapes,
  runInstall,
  runUninstall,
  snapshotTree,
  storedMode,
  userModeEdit,
} from "./installer-paths.test-support.js";
import { ledgerOf, readMarkerObject, withLedger, type RawEntry } from "./ledger.test-support.js";
import { modeText, treeRecord } from "./user-file.js";
import { hostCapabilityOrSkip, skipLine } from "../scripts/check-platform-shapes.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-prune-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;
const at = (root: string, rel: string): string => join(root, ...rel.split("/"));
const sha = (b: Buffer | string): string => createHash("sha256").update(b).digest("hex");
/** What is at `p`, by content: a directory's snapshot, a file's sha256 and mode. */
const stateOf = (p: string): string =>
  lstatSync(p).isDirectory() ? `DIR ${modeOf(p)}\n${snapshotTree(p)}` : `FILE ${sha(readFileSync(p))} ${modeOf(p)}`;
const modeOf = (p: string): string => modeText(storedMode(p));
/** isoStamp()'s shape (install.ts): YYYY-MM-DDTHH-MM-SS.mmmZ. */
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z/;
const BACKUP_SEGMENT = new RegExp(`(\\.bak\\.${ISO.source}$)|(\\.grugops-edited-${ISO.source}$)`);

interface World {
  readonly t: string;
  readonly home: string;
  readonly kitHome: string;
}
function world(tag: string): World {
  const root = fresh(tag);
  const t = join(root, "target");
  const home = join(root, "home");
  mkdirSync(t);
  mkdirSync(home);
  return { t, home, kitHome: join(home, ".grugops") };
}
function finished(r: Run, what: string): void {
  expect(r.error, `${what} did not finish (${r.error?.message})`).toBeUndefined();
  expect(r.signal, `${what} was killed by ${r.signal}`).toBeNull();
  expect(r.stderr, `${what}: uncaught throw\n${r.stderr}`).not.toMatch(NO_STACK);
}
const install = (w: World, args: readonly string[] = [], dryRun = false): Run => {
  const r = runInstall(w.t, w.kitHome, args, { home: w.home, dryRun, timeoutMs: 180_000 });
  finished(r, `install ${args.join(" ")}`);
  return r;
};

/** The old layout, with a plans/handoffs/ directory so the handoffs origin is covered too. */
function oldLayout(w: World): void {
  makeOldLayoutFixture(w.t, { rootConfig: true });
  mkdirSync(at(w.t, "plans/handoffs"), { recursive: true });
  writeFileSync(at(w.t, "plans/handoffs/relay-1.md"), "a handoff the user kept\n");
}

/** The ledger's backup entries, by path. */
const backupEntries = (t: string): Map<string, RawEntry> =>
  new Map(ledgerOf(readMarkerObject(t)).filter((e) => e.kind === "backup").map((e) => [e.path, e]));

/** The paths of the snapshot rows (directories without their trailing slash). */
function rowPaths(snapshot: string): Set<string> {
  const out = new Set<string>();
  for (const row of snapshot === "" ? [] : snapshot.split("\n")) {
    if (row.endsWith("/ DIR")) out.add(row.slice(0, -"/ DIR".length));
    else if (row.includes(" LINK ")) out.add(row.slice(0, row.indexOf(" LINK ")));
    else out.add(row.slice(0, row.lastIndexOf(" ")));
  }
  return out;
}

/**
 * The backups a run made, derived from what it created: for each new path, the shortest prefix whose last
 * segment is a backup name (`.bak.<ISO>` or `.grugops-edited-<ISO>`). The kit config backup --migrate
 * leaves inside agent-factory/ travels inside `agent-factory.bak.<ISO>/`, so its shortest prefix is that.
 */
function backupsMade(before: string, after: string): string[] {
  const was = rowPaths(before);
  const out = new Set<string>();
  for (const p of rowPaths(after)) {
    if (was.has(p)) continue;
    const segs = p.split("/");
    const i = segs.findIndex((s) => BACKUP_SEGMENT.test(s));
    if (i !== -1) out.add(segs.slice(0, i + 1).join("/"));
  }
  return [...out].sort();
}

/** The origin a backup name says, from the base the backup was made of. */
function originOf(path: string): string {
  if (path.includes(".grugops-edited-")) return "edited-kit-file";
  if (path.startsWith("agent-factory.bak.")) return "in-repo-kit";
  if (path.startsWith("plans/handoffs.bak.")) return "handoffs";
  if (/(^|\/)factory\.config\.json\.bak\./.test(path)) return "legacy-config";
  return "unknown";
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// Task 1: every backup install makes in the target is recorded, with what it held.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════

describe("every backup install makes in the target is recorded (plan 33.1-40 Task 1, D-33 (c))", () => {
  it("a --migrate --backup-edited-kit records exactly the backups it made, each at its final path with its content record", () => {
    const w = world("migrate-records");
    oldLayout(w);
    const before = snapshotTree(w.t);
    const r = install(w, ["--migrate", "--backup-edited-kit"]);
    expect(r.status, r.stdout).toBe(0);
    const made = backupsMade(before, snapshotTree(w.t));
    const recorded = backupEntries(w.t);
    const counts = new Map<string, number>();
    for (const e of recorded.values()) counts.set(String(e.origin), (counts.get(String(e.origin)) ?? 0) + 1);
    console.log(`backups made (${made.length}): ${made.join(", ")}`);
    console.log(`backup entries per origin: ${[...counts].map(([o, n]) => `${o} ${n}`).join(", ")}`);
    // Non-vacuous: the run made a backup of every target origin.
    expect([...new Set(made.map(originOf))].sort()).toEqual(["edited-kit-file", "handoffs", "in-repo-kit", "legacy-config"]);
    expect([...recorded.keys()].sort(), "the ledger's backup entries are not exactly the backups the run made").toEqual(made);
    for (const path of made) {
      const e = recorded.get(path)!;
      expect(e.origin, `${path}: origin`).toBe(originOf(path));
      const p = at(w.t, path);
      const st = lstatSync(p);
      if (st.isDirectory()) {
        expect(String(e.content), `${path}: a directory backup has a tree record`).toMatch(/^tree:sha256:[0-9a-f]{64}$/);
        expect(e.content, `${path}: the tree record is not what the backup holds`).toBe(treeRecord(w.t, path));
      } else {
        expect(e.content, `${path}: the file record is not the backup's bytes and mode`).toBe(`sha256:${sha(readFileSync(p))};mode=${modeOf(p)}`);
      }
      // `of` names the path the backup was made of: the backup's name without its suffix.
      expect(e.of, `${path}: of`).toBe(path.replace(BACKUP_SEGMENT, ""));
    }
    // The kit config backup inside agent-factory.bak.<ISO>/ has no entry of its own.
    const inner = [...recorded.keys()].filter((p) => p.startsWith("agent-factory.bak.") && p.includes("/"));
    expect(inner, "an entry inside the in-repo kit backup").toEqual([]);
    const kitBak = made.find((p) => p.startsWith("agent-factory.bak."))!;
    expect(readdirSync(at(w.t, `${kitBak}/config`)).some((n) => n.startsWith("factory.config.json.bak.")), "the kit config backup is not inside the kit backup").toBe(true);
  });

  it("a re-install carries a backup entry with its own record while its path is there, and drops one whose path is gone", () => {
    const w = world("carry");
    oldLayout(w);
    expect(install(w, ["--migrate", "--backup-edited-kit"]).status).toBe(0);
    const first = backupEntries(w.t);
    const handoffs = [...first.keys()].find((p) => p.startsWith("plans/handoffs.bak."))!;
    const kitBak = [...first.keys()].find((p) => p.startsWith("agent-factory.bak."))!;
    rmSync(at(w.t, handoffs), { recursive: true });
    // A change inside a backup does not move its record: the record says what install left there.
    writeFileSync(at(w.t, `${kitBak}/roles/orchestrator.md`), "changed after install made the backup\n");
    const r = install(w);
    expect(r.status, r.stdout).toBe(0);
    const second = backupEntries(w.t);
    expect([...second.keys()].sort()).toEqual([...first.keys()].filter((p) => p !== handoffs).sort());
    for (const [path, e] of second) expect(e, `${path}: the carried entry changed`).toEqual(first.get(path));
  });

  // Two modes: 0600 (the review's case: the create mode alone must not be the default 0644) and 0664, whose
  // group-write bit the process umask (022 here) strips from a create, so only the chmod after the create
  // keeps it. Each mutation in the SUMMARY turns one of them red.
  // WIN-2 (plan 34-13, run 37521787426): both claims are about permission bits beyond the read-only
  // attribute, which Windows cannot store, so each case first asks the measured host capability and prints
  // its skip where it is absent (a WINDOWS.md row). Read-only is not substituted: the install that follows
  // replaces the edited file, and a read-only file changes what that replacement does.
  for (const mode of [0o600, 0o664]) {
    const text = mode.toString(8).padStart(4, "0");
    it(`IN-03: an edited kit file with mode ${text} is backed up with mode ${text}, holding the edit`, () => {
      const absent = hostCapabilityOrSkip("POSIX permission bits beyond read-only", `install/installer-prune.test.ts: IN-03 ${text}`);
      if (absent !== null) {
        console.log(skipLine(absent, `this IN-03 ${text} case on a host that stores POSIX permission bits (a POSIX CI leg); on this host the backup mode bits are unobserved (WINDOWS.md row 318)`));
        return;
      }
      const w = world(`in03-${text}`);
      oldLayout(w);
      const rel = ".claude/agents/grugops-orchestrator.md";
      chmodSync(at(w.t, rel), mode); // mode-census: posix-bits
      expect(modeOf(at(w.t, rel))).toBe(text);
      const edit = readFileSync(at(w.t, rel));
      const r = install(w, ["--migrate", "--backup-edited-kit"]);
      expect(r.status, r.stdout).toBe(0);
      const backups = readdirSync(at(w.t, ".claude/agents")).filter((n) => n.startsWith("grugops-orchestrator.md.grugops-edited-"));
      expect(backups.length, readdirSync(at(w.t, ".claude/agents")).join(", ")).toBe(1);
      const b = at(w.t, `.claude/agents/${backups[0]}`);
      expect(modeOf(b), `the backup of a ${text} file does not keep its permission bits (umask ${process.umask().toString(8)})`).toBe(text);
      expect(readFileSync(b).equals(edit), "the backup does not hold the edit").toBe(true);
      // The record says the same mode.
      expect(String(backupEntries(w.t).get(`.claude/agents/${backups[0]}`)?.content)).toMatch(new RegExp(`;mode=${text}$`));
    });
  }

  for (const dry of [false, true]) {
    it(`${dry ? "DRY_RUN " : ""}uninstall reports each recorded backup left with its origin and removes none; the name pattern names only an unrecorded one`, () => {
      const w = world(`uninstall-${dry ? "dry" : "real"}`);
      oldLayout(w);
      expect(install(w, ["--migrate", "--backup-edited-kit"]).status).toBe(0);
      const recorded = [...backupEntries(w.t).keys()];
      expect(recorded.length, "the install recorded no backup, so this case would prove nothing").toBe(5);
      const unrecorded = ".claude/agents/grugops-ba-pm.md.grugops-edited-2026-01-01T00-00-00.000Z";
      writeFileSync(at(w.t, unrecorded), "a file of the user's that only has the name\n");
      const snaps = new Map([...recorded, unrecorded].map((p) => [p, stateOf(at(w.t, p))]));
      const u = runUninstall(w.t, w.kitHome, { home: w.home, dryRun: dry, timeoutMs: 120_000 });
      finished(u, "uninstall");
      expect([0, 3], u.stdout).toContain(u.status);
      const lines = u.stdout.split("\n");
      for (const p of recorded) {
        expect(stateOf(at(w.t, p)), `${p} changed`).toBe(snaps.get(p));
        const named = lines.filter((l) => /^ {2}left\s/.test(l) && l.includes(p));
        expect(named.length, `${p}: left lines\n${u.stdout}`).toBe(1);
        expect(named[0]).toContain("install's backup of your content");
        expect(named[0]).toContain("uninstall never removes a backup");
        expect(named[0], `${p}: the name pattern line names a recorded backup`).not.toContain("its name matches the name install gives");
      }
      const unrec = lines.filter((l) => /^ {2}left\s/.test(l) && l.includes(unrecorded));
      expect(unrec.length, u.stdout).toBe(1);
      expect(unrec[0]).toContain("its name matches the name install gives a backup");
      expect(existsSync(at(w.t, unrecorded))).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// Task 2: prune removes by record at both roots, through owns, and names everything else (CR-02).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════

const prune = (w: World, dryRun = false): Run => {
  const r = runInstall(w.t, w.kitHome, ["--prune-old-kit"], { home: w.home, dryRun, timeoutMs: 120_000 });
  finished(r, `${dryRun ? "DRY_RUN " : ""}--prune-old-kit`);
  return r;
};
/** The output lines with `verb`. */
const linesOf = (r: Run, verb: string): string[] => r.stdout.split("\n").filter((l) => new RegExp(`^ {2}(?:${verb})\\s`).test(l));
const kitHomeBackups = (kitHome: string): RawEntry[] =>
  ledgerOf(JSON.parse(readFileSync(join(kitHome, ".grugops-kit.json"), "utf8")) as Record<string, unknown>).filter((e) => e.kind === "backup");
/** Rewrite the target's marker with an edited ledger; the binding (`target`) is kept, so the marker stays install's own. */
function editLedger(t: string, edit: (entries: RawEntry[]) => unknown[] | void): void {
  const p = at(t, ".grugops/install.json");
  writeFileSync(p, JSON.stringify(withLedger(readMarkerObject(t), edit), null, 2) + "\n");
}
const CHMOD_SKIP: string | null =
  process.platform === "win32"
    ? "win32: a file mode does not stop a read or a write"
    : typeof process.getuid === "function" && process.getuid() === 0
      ? "running as root: a file mode does not stop root"
      : null;

/** A migrated tree: the old layout (with handoffs) and an unrecorded agent-factory/ at the kit root, so every origin is recorded. */
function migrated(tag: string): World {
  const w = world(tag);
  oldLayout(w);
  mkdirSync(join(w.kitHome, "agent-factory"), { recursive: true });
  writeFileSync(join(w.kitHome, "agent-factory", "MYNOTES.md"), "the user's notes at the kit root\n");
  const r = install(w, ["--migrate", "--backup-edited-kit"]);
  expect(r.status, r.stdout).toBe(0);
  return w;
}
const PRUNABLE = new Set(["in-repo-kit", "legacy-config"]);

// ── the class test (brief §2.1, DC-2) ────────────────────────────────────────────────────────────────

const SET = deriveWritePaths(fresh("derive"));
const BACKUP_SHAPES = backupShapes(SET);
// Pinned: 16. The migrate variant's write set gives 4 install base names: agent-factory and
// factory.config.json (--migrate backs them up as `.bak.<ISO>`), SKILL.md and grugops-orchestrator.md (D-32
// backs them up as `.grugops-edited-<ISO>`). With the 2 user names (thesis, budget.xlsx), each base is
// planted as a directory and as a file with `.bak.<ISO>` (12); each D-32 base also with `.grugops-edited-`
// (2); and a link to a user directory and a FIFO, both named `.bak.<ISO>` (2).
const BACKUP_SHAPE_COUNT = 16;

describe("the prune class (CR-02, brief §2.1 DC-2): every backup shape at both roots is left byte for byte", () => {
  it("BACKUP_SHAPES is derived from the migrate variant's write set plus the user names, count pinned", () => {
    const migrate = SET.variant("migrate");
    expect(migrate.run.status, migrate.run.stdout).toBe(0);
    console.log(`BACKUP_SHAPES (${BACKUP_SHAPES.length}):\n${BACKUP_SHAPES.map((x) => `  ${x.name} [${x.form}, ${x.source}]`).join("\n")}`);
    expect(BACKUP_SHAPES.length).toBe(BACKUP_SHAPE_COUNT);
    expect(new Set(BACKUP_SHAPES.map((x) => x.name)).size, "a shape name twice").toBe(BACKUP_SHAPE_COUNT);
    // Non-vacuous: install's own names are in it, so are the verifier's reproduction names.
    for (const base of ["agent-factory", "factory.config.json", ...BACKUP_USER_BASES]) {
      expect(BACKUP_SHAPES.some((x) => x.name.startsWith(`${base}.bak.`)), base).toBe(true);
    }
    expect(BACKUP_SHAPES.filter((x) => x.source === "install").length, "no install base names derived").toBeGreaterThanOrEqual(4);
  });

  for (const ctx of ["installed", "never-installed"] as const) {
    for (const dry of [false, true]) {
      it(`${ctx} target, ${dry ? "DRY_RUN " : ""}prune: every planted shape at both roots is byte-identical afterwards and named`, () => {
        const w = world(`class-${ctx}-${dry ? "dry" : "real"}`);
        if (ctx === "installed") expect(install(w).status).toBe(0);
        mkdirSync(w.kitHome, { recursive: true });
        const pt = plantBackupShapes(w.t, BACKUP_SHAPES);
        const ph = plantBackupShapes(w.kitHome, BACKUP_SHAPES);
        for (const line of [...pt.skipped, ...ph.skipped]) console.log(line);
        expect(pt.planted.length + pt.skipped.length, "the target's planted count").toBe(BACKUP_SHAPE_COUNT);
        expect(ph.planted.length + ph.skipped.length, "the kit home's planted count").toBe(BACKUP_SHAPE_COUNT);
        const before = [snapshotTree(w.t), snapshotTree(w.kitHome)];
        const r = prune(w, dry);
        expect(r.status, r.stdout).toBe(0);
        expect(snapshotTree(w.t), `the target changed\n${r.stdout}`).toBe(before[0]);
        expect(snapshotTree(w.kitHome), `the kit home changed\n${r.stdout}`).toBe(before[1]);
        expect(linesOf(r, "removed|would-remove|edited|would-edit"), r.stdout).toEqual([]);
        for (const [label, planted] of [["target", pt.planted], ["kit home", ph.planted]] as const) {
          for (const name of planted.filter((n) => n.includes(".bak."))) {
            const named = linesOf(r, "left").filter((l) => l.includes(`${label}: ${name} (not recorded by install`));
            expect(named.length, `${label}: ${name} is not named\n${r.stdout}`).toBe(1);
          }
        }
      });
    }
  }
});

// ── the recorded cases ───────────────────────────────────────────────────────────────────────────────

describe("prune removes only recorded, unchanged, prunable backups (plan 33.1-40 Task 2)", () => {
  it("after a --migrate: DRY_RUN changes nothing; prune removes the recorded in-repo-kit, legacy-config and kit-home backups, leaves the rest, and updates both records; a second prune finds nothing", () => {
    const w = migrated("recorded");
    const target = backupEntries(w.t);
    const home = kitHomeBackups(w.kitHome);
    const removable = [...target.values()].filter((e) => PRUNABLE.has(String(e.origin)));
    const kept = [...target.values()].filter((e) => !PRUNABLE.has(String(e.origin)));
    expect(removable.length, "in-repo-kit and legacy-config").toBe(2);
    expect(kept.map((e) => e.origin).sort(), "handoffs and the two edited kit files").toEqual(["edited-kit-file", "edited-kit-file", "handoffs"]);
    expect(home.length, "the kit-home backup").toBe(1);
    // DRY_RUN: the same decisions, and nothing changes, the records included.
    const t0 = snapshotTree(w.t);
    const h0 = snapshotTree(w.kitHome);
    const d = prune(w, true);
    expect(d.status, d.stdout).toBe(0);
    expect(snapshotTree(w.t)).toBe(t0);
    expect(snapshotTree(w.kitHome)).toBe(h0);
    // Printed paths compared in the product's one spelling (lineNamesPath, plan 34-12, D-19, WIN-1).
    for (const e of removable) expect(linesOf(d, "would-remove").filter((l) => lineNamesPath(l, at(w.t, e.path))).length, `${e.path}\n${d.stdout}`).toBe(1);
    expect(linesOf(d, "would-remove").filter((l) => lineNamesPath(l, join(w.kitHome, home[0].path))).length, d.stdout).toBe(1);
    expect(linesOf(d, "would-edit").length, "a would-edit line per record").toBe(2);
    // The real run.
    const r = prune(w);
    expect(r.status, r.stdout).toBe(0);
    for (const e of removable) {
      expect(existsSync(at(w.t, e.path)), `${e.path} is still there`).toBe(false);
      expect(linesOf(r, "removed").filter((l) => lineNamesPath(l, at(w.t, e.path))).length, r.stdout).toBe(1);
    }
    expect(existsSync(join(w.kitHome, home[0].path)), "the kit-home backup is still there").toBe(false);
    for (const e of kept) {
      expect(existsSync(at(w.t, e.path)), `${e.path} was removed`).toBe(true);
      const named = linesOf(r, "left").filter((l) => pathText(l).includes(`target: ${e.path} (`));
      expect(named.length, `${e.path}\n${r.stdout}`).toBe(1);
      expect(named[0]).toContain("prune never removes a backup of your content");
    }
    // The records no longer list what was removed, and still list what was left.
    expect([...backupEntries(w.t).keys()].sort()).toEqual(kept.map((e) => e.path).sort());
    expect(kitHomeBackups(w.kitHome)).toEqual([]);
    expect(JSON.parse(readFileSync(join(w.kitHome, ".grugops-kit.json"), "utf8")).ledger.some((e: RawEntry) => e.kind === "kit"), "the kit entry was lost").toBe(true);
    // A second prune finds nothing recorded to remove.
    const again = prune(w);
    expect(again.status, again.stdout).toBe(0);
    expect(linesOf(again, "removed|edited"), again.stdout).toEqual([]);
    expect(again.stdout).toContain("no backup install recorded is there to remove");
  });

  const CHANGES: ReadonlyArray<[string, (dir: string) => void]> = [
    ["a file added inside", (d) => writeFileSync(join(d, "roles", "added.md"), "new\n")],
    ["a file deleted", (d) => rmSync(join(d, "roles", "orchestrator.md"))],
    ["a file edited", (d) => writeFileSync(join(d, "roles", "orchestrator.md"), "edited after the backup\n")],
    ["a chmod", (d) => void userModeEdit(join(d, "roles", "orchestrator.md"))],
  ];
  for (const [what, change] of CHANGES) {
    it(`a recorded backup with ${what} since install made it is left, named with the reason, and keeps its entry`, () => {
      const w = migrated(`changed-${what.replace(/\W+/g, "-")}`);
      const kitBak = [...backupEntries(w.t).values()].find((e) => e.origin === "in-repo-kit")!;
      change(at(w.t, kitBak.path));
      const before = snapshotTree(at(w.t, kitBak.path));
      const r = prune(w);
      expect(r.status, r.stdout).toBe(0);
      expect(snapshotTree(at(w.t, kitBak.path)), "prune changed the backup").toBe(before);
      const named = linesOf(r, "left").filter((l) => l.includes(`target: ${kitBak.path} (`));
      expect(named.length, r.stdout).toBe(1);
      expect(named[0]).toContain("does not hold what the record says install left there");
      expect(backupEntries(w.t).get(kitBak.path), "the entry was taken out").toEqual(kitBak);
    });
  }

  it("a recorded legacy config backup edited since is left; its unchanged sibling is removed", () => {
    const w = migrated("changed-config");
    const cfg = [...backupEntries(w.t).values()].find((e) => e.origin === "legacy-config")!;
    writeFileSync(at(w.t, cfg.path), '{ "edited": "after the backup" }\n');
    const r = prune(w);
    expect(r.status, r.stdout).toBe(0);
    expect(readFileSync(at(w.t, cfg.path), "utf8")).toContain("after the backup");
    expect(backupEntries(w.t).has(cfg.path)).toBe(true);
    const kitBak = [...backupEntries(w.t).values()].find((e) => e.origin === "in-repo-kit");
    expect(kitBak, "the unchanged in-repo kit backup was not removed").toBeUndefined();
  });

  it("a recorded backup whose content record is null is left, named, and keeps its entry (hand-made null, and a backup install could not read in full)", () => {
    const w = migrated("null");
    const kitBak = [...backupEntries(w.t).values()].find((e) => e.origin === "in-repo-kit")!;
    editLedger(w.t, (entries) => {
      for (const e of entries) if (e.path === kitBak.path && e.kind === "backup") e.content = null;
    });
    const r = prune(w);
    expect(r.status, r.stdout).toBe(0);
    expect(existsSync(at(w.t, kitBak.path)), "a backup with a null record was removed").toBe(true);
    expect(linesOf(r, "left").filter((l) => l.includes(`target: ${kitBak.path} (`) && l.includes("holds no content record")).length, r.stdout).toBe(1);
    if (CHMOD_SKIP !== null) {
      console.log(`SKIP the unreadable-at-record-time half — ${CHMOD_SKIP}`);
      return;
    }
    // Install itself records null for a backup it cannot read in full.
    const w2 = world("null-natural");
    oldLayout(w2);
    writeFileSync(at(w2.t, "agent-factory/roles/private.md"), "unreadable\n");
    chmodSync(at(w2.t, "agent-factory/roles/private.md"), 0o000); // mode-census: access-denial
    try {
      expect(install(w2, ["--migrate", "--backup-edited-kit"]).status).toBe(0);
      const e = [...backupEntries(w2.t).values()].find((x) => x.origin === "in-repo-kit")!;
      expect(e.content, "a tree with an unreadable file was recorded as provable").toBeNull();
      const r2 = prune(w2);
      expect(r2.status, r2.stdout).toBe(0);
      expect(existsSync(at(w2.t, e.path))).toBe(true);
    } finally {
      for (const n of readdirSync(w2.t).filter((x) => x.startsWith("agent-factory"))) {
        const f = at(w2.t, `${n}/roles/private.md`);
        if (existsSync(f)) chmodSync(f, 0o644); // mode-census: restore
      }
    }
  });

  it("a recorded backup under a protected path (a config backup inside a live agent-factory/) is left, even though its record holds", () => {
    const w = migrated("protected");
    const rel = "agent-factory/config/factory.config.json.bak.2026-01-02T03-04-05.678Z";
    mkdirSync(at(w.t, "agent-factory/config"), { recursive: true });
    writeFileSync(at(w.t, rel), '{ "a": "live config backup" }\n');
    const content = `sha256:${sha(readFileSync(at(w.t, rel)))};mode=${modeOf(at(w.t, rel))}`;
    editLedger(w.t, (entries) => [...entries, { path: rel, kind: "backup", origin: "legacy-config", of: "agent-factory/config/factory.config.json", content }]);
    const r = prune(w);
    expect(r.status, r.stdout).toBe(0);
    expect(existsSync(at(w.t, rel)), "a backup under the live agent-factory/ was removed").toBe(true);
    expect(linesOf(r, "left").filter((l) => l.includes(rel) && l.includes("protected")).length, r.stdout).toBe(1);
    expect(backupEntries(w.t).has(rel)).toBe(true);
  });

  it("a forged entry naming a user's directory with a record that does not match it is left (T-33.1-402)", () => {
    const w = world("forged");
    expect(install(w).status).toBe(0);
    const rel = "thesis.bak.2026-01-02T03-04-05.678Z";
    mkdirSync(at(w.t, rel));
    writeFileSync(at(w.t, `${rel}/ch1.md`), "chapter one\n");
    const before = snapshotTree(at(w.t, rel));
    editLedger(w.t, (entries) => [...entries, { path: rel, kind: "backup", origin: "in-repo-kit", of: "agent-factory", content: `tree:sha256:${"0".repeat(64)}` }]);
    const r = prune(w);
    expect(r.status, r.stdout).toBe(0);
    expect(snapshotTree(at(w.t, rel))).toBe(before);
  });

  if (CHMOD_SKIP !== null) console.log(`SKIP the failed-rewrite case of installer-prune.test.ts — ${CHMOD_SKIP}`);
  it.skipIf(CHMOD_SKIP !== null)("a record that cannot be rewritten after the removals is a verify naming the entries it still lists, exit 3", () => {
    const w = migrated("rewrite-fails");
    const markerPath = at(w.t, ".grugops/install.json");
    const homeRecord = join(w.kitHome, ".grugops-kit.json");
    const removable = [...backupEntries(w.t).values()].filter((e) => PRUNABLE.has(String(e.origin))).map((e) => e.path);
    const homeBak = kitHomeBackups(w.kitHome)[0].path;
    chmodSync(markerPath, 0o444); // mode-census: row-315
    chmodSync(homeRecord, 0o444); // mode-census: row-315
    const markerBytes = readFileSync(markerPath);
    const homeBytes = readFileSync(homeRecord);
    try {
      const r = prune(w);
      expect(r.status, r.stdout).toBe(3);
      expect(r.stdout).toContain("== prune INCOMPLETE");
      const verifies = linesOf(r, "verify");
      for (const p of removable) {
        expect(existsSync(at(w.t, p)), `${p} was not removed`).toBe(false);
        expect(verifies.some((l) => lineNamesPath(l, markerPath) && l.includes(p)), `no verify names ${p}\n${r.stdout}`).toBe(true);
      }
      expect(verifies.some((l) => lineNamesPath(l, homeRecord) && l.includes(homeBak)), r.stdout).toBe(true);
      expect(readFileSync(markerPath).equals(markerBytes), "the marker changed").toBe(true);
      expect(readFileSync(homeRecord).equals(homeBytes), "the kit-home record changed").toBe(true);
    } finally {
      chmodSync(markerPath, 0o644); // mode-census: restore
      chmodSync(homeRecord, 0o644); // mode-census: restore
    }
  });
});

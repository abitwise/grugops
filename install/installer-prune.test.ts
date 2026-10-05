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
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { type Run, makeOldLayoutFixture, runInstall, runUninstall, snapshotTree } from "./installer-paths.test-support.js";
import { ledgerOf, readMarkerObject, type RawEntry } from "./ledger.test-support.js";
import { treeRecord } from "./user-file.js";

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
const modeOf = (p: string): string => (statSync(p).mode & 0o7777).toString(8).padStart(4, "0");
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
  for (const mode of [0o600, 0o664]) {
    const text = mode.toString(8).padStart(4, "0");
    it(`IN-03: an edited kit file with mode ${text} is backed up with mode ${text}, holding the edit`, () => {
      const w = world(`in03-${text}`);
      oldLayout(w);
      const rel = ".claude/agents/grugops-orchestrator.md";
      chmodSync(at(w.t, rel), mode);
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

// installer-never-installed.test.ts — brief DC-2 on the never-installed side, as a class (plan 33.1-33;
// .planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-GAP-PLANNING-BRIEF.md §1 and §2.1).
//
// THE RULE. Uninstall deletes or edits a path only when an install record says install created or
// changed it, and the content still matches. A repository grugops was never installed into holds no
// such record, so uninstall, real or previewed (DRY_RUN=1), changes it by ZERO bytes.
//
// THE PATH SET IS DERIVED, NEVER TYPED. WRITE_PATHS is the union of the files, links and directories
// written by every real install variant (default copy `--yes`, `--symlink`, `--migrate` over an old
// layout, and the checkpoints-at-notify configuration), taken from the ONE shared derivation,
// install/installer-paths.test-support.ts deriveWritePaths (plan 33.1-27), with the run's timestamp
// segments normalized. Its size is pinned as WRITE_PATH_COUNT: a change that makes install write a new
// path turns this file red until the count is re-pinned with a reason. A round-trip check asserts that
// every path uninstall changes after a real install is inside the set, so the set covers every path
// uninstall can touch.
//
// THE VARIANTS. Each is uninstalled twice, real and DRY_RUN, on two identical copies, and each copy's
// snapshotTree must be unchanged afterwards, with the kit home untouched:
//   FD  files and directories: a user-authored file at every file path (a JSON object naming the user
//       and the path at a `.json` path, text naming both elsewhere), and every directory path made.
//       The user's `.grugops/install.json` is not install's marker, so it is left (ownsMarker, plan
//       33.1-33): removeMarker used to delete it by its name alone.
//   D   directories only: every directory path made EMPTY, as a user would make it.
//   FI  install's own bytes, no record: a copy of each variant's installed tree with the marker taken
//       away (README §1's minimal copy path, or a copied tree). Every file holds exactly what install
//       wrote, so this is the case where content alone looks like install's. It holds the sentinel
//       blocks: a CLAUDE.md or Copilot block used to be removed by its presence, rewriting a file in a
//       repository with no marker (red-team carry item 11). The block entries of the install ledger (plan 33.1-33)
//       is the record uninstall now needs.
//   FM  install's own bytes under a foreign marker: the default variant's installed tree with the
//       marker replaced by a user's JSON object. Without ownsMarker that object read as an install
//       made before every ledger, and the legacy byte-identity fallback removed the verbatim skills.
//
// KNOWN EXCEPTIONS, DECLARED (red-team carry items 12 and 13; a human decision is pending at plan
// 33.1-35, so their behaviour is not changed here). They are on the INSTALLED side, where the record
// exists, and cannot change a never-installed target: with no marker the ask-rule pass removes
// nothing. They are listed so the census of this class is honest:
//   12  removeAskRules removes a rule by its NAME in the ask-rules entry of the ledger and never checks
//       askContent against the current permissions.ask, so a user who deletes install's rule and later
//       adds the same rule string loses it at uninstall. A whole-list check would strand all rules on
//       any user addition; a per-rule check needs a different record shape.
//   13  a re-install over an unreadable .claude/settings.json resets the ask ledger (plan 33.1-28 M8);
//       keeping it verbatim is unsafe until item 12's check exists.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first). Hermetic:
// HOME, GRUGOPS_HOME and TARGET are scratch directories removed at the end; the real repository and
// the real home are never targeted. Clear professional voice: this is a safety surface.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import {
  ISO_PLACEHOLDER,
  MARKER_REL,
  type Run,
  type VariantName,
  deriveWritePaths,
  describeWritePaths,
  normalizeIso,
  rebindMarker,
  runUninstall,
  snapshotTree,
} from "./installer-paths.test-support.js";
import { RETIRED_RECORD_NAMES, sixRecordShape } from "./ledger.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-never-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;

// ── the derived write set (plan 33.1-27's one derivation) ──────────────────────────────────────
const SET = deriveWritePaths(fresh("derive"));
/** Every path any install variant writes: files and links, then directories. */
const WRITE_PATHS: readonly string[] = [...SET.files, ...SET.dirs];
/**
 * Pinned. A plan that makes install write a new path changes this and must re-pin it with a reason.
 * 58 files and links + 27 directories on 2026-09-30 (plan 33.1-33).
 */
const WRITE_PATH_COUNT = 85;

// A stamp for the `<ISO>` segments: a planted path must be a real name.
const STAMP = "2026-01-01T00-00-00.000Z";
const real = (rel: string): string => rel.split(ISO_PLACEHOLDER).join(STAMP);

/** A user-authored body for `rel`: a JSON object at a `.json` path, text elsewhere. */
function userBody(rel: string): string {
  return rel.endsWith(".json")
    ? JSON.stringify({ owner: "a user of this repository", path: rel, note: "grugops was never installed here" }, null, 2) + "\n"
    : `user-authored file at ${rel} — grugops was never installed in this repository\n`;
}

/** Plant the FD variant (files and directories) or the D variant (directories only) into `t`. */
function plant(t: string, withFiles: boolean): void {
  for (const d of SET.dirs) mkdirSync(join(t, ...real(d).split("/")), { recursive: true });
  if (!withFiles) return;
  for (const f of SET.files) {
    const p = join(t, ...real(f).split("/"));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, userBody(f));
  }
}

/** A copy of a variant's installed tree, links kept as links, with `marker` at the marker path (null: none). */
function copyInstalled(t: string, variant: VariantName, marker: string | null): void {
  cpSync(SET.variant(variant).target, t, { recursive: true, verbatimSymlinks: true });
  rmSync(join(t, ...MARKER_REL.split("/")), { force: true });
  if (marker !== null) writeFileSync(join(t, ...MARKER_REL.split("/")), marker);
}

/** The kit home handed to every uninstall: a real installed kit, snapshotted around each run. */
const KIT_HOME = SET.variant("default").grugopsHome;

interface Outcome {
  readonly run: Run;
  readonly changed: string[];
  readonly kitHomeChanged: boolean;
}

/** Run uninstall (real or DRY_RUN) on `t` and report every path whose snapshot row changed. */
function uninstallAndDiff(t: string, dryRun: boolean): Outcome {
  const home = fresh("home");
  const before = snapshotTree(t);
  const kitBefore = snapshotTree(KIT_HOME);
  const run = runUninstall(t, KIT_HOME, { dryRun, home, timeoutMs: 120_000 });
  const after = snapshotTree(t);
  const rows = (s: string): Set<string> => new Set(s === "" ? [] : s.split("\n"));
  const b = rows(before);
  const a = rows(after);
  const changed = [...[...b].filter((r) => !a.has(r)), ...[...a].filter((r) => !b.has(r))].sort();
  return { run, changed, kitHomeChanged: snapshotTree(KIT_HOME) !== kitBefore };
}

function expectZeroBytes(o: Outcome, what: string): void {
  expect(o.run.error, `${what}: the uninstaller could not be run`).toBeUndefined();
  expect(o.run.stderr, `${what}: stack trace on stderr`).not.toMatch(NO_STACK);
  expect([0, 3], `${what}: exit ${o.run.status}\n${o.run.stdout}`).toContain(o.run.status);
  expect(o.changed, `${what}: uninstall changed a never-installed target:\n${o.changed.join("\n")}\n${o.run.stdout}`).toEqual([]);
  expect(o.kitHomeChanged, `${what}: the kit home changed`).toBe(false);
}

describe("never-installed target: uninstall changes zero bytes (brief DC-2, plan 33.1-33)", () => {
  it("WRITE_PATHS is the derived union of every install variant's writes, and its size is WRITE_PATH_COUNT", () => {
    for (const v of SET.variants) expect(v.run.status, `the ${v.name} install did not exit 0\n${v.run.stdout}`).toBe(0);
    console.log(`WRITE_PATHS (${WRITE_PATHS.length}: ${SET.files.length} files and links, ${SET.dirs.length} directories):\n${describeWritePaths(SET)}`);
    console.log(`WRITE_PATH_COUNT=${WRITE_PATH_COUNT}`);
    expect(WRITE_PATHS.length).toBe(WRITE_PATH_COUNT);
    // The set covers what every variant contributes, and the marker, the pointer files and the two
    // settings files uninstall edits are in it.
    for (const v of ["default", "symlink", "migrate", "checkpoints-notify"] as const) {
      expect(SET.paths.some((w) => w.variants.includes(v)), `no path from the ${v} variant`).toBe(true);
    }
    for (const p of [MARKER_REL, "CLAUDE.md", ".github/copilot-instructions.md", ".gemini/settings.json", ".claude/settings.json", "AGENTS.md"]) {
      expect(WRITE_PATHS, `${p} is not in the derived set`).toContain(p);
    }
  });

  it("every path uninstall changes after a real install of each variant is inside WRITE_PATHS (the set covers what uninstall can touch)", () => {
    const set = new Set(WRITE_PATHS);
    for (const v of SET.variants) {
      const t = fresh(`roundtrip-${v.name}`);
      cpSync(v.target, t, { recursive: true, verbatimSymlinks: true });
      rebindMarker(t); // the copy is this install, moved (red-team B2: the marker is bound to its directory)
      const o = uninstallAndDiff(t, false);
      expect(o.run.stderr, `${v.name}: stack trace`).not.toMatch(NO_STACK);
      expect(o.changed.length, `${v.name}: the round trip changed nothing, so it proves nothing\n${o.run.stdout}`).toBeGreaterThan(0);
      for (const row of o.changed) {
        const rel = row.endsWith("/ DIR") ? row.slice(0, -"/ DIR".length) : row.slice(0, row.search(/ (LINK |[0-9a-f]{64}$|OTHER$)/));
        expect(set.has(normalizeIso(rel)), `${v.name}: uninstall changed ${rel}, which no install variant writes`).toBe(true);
      }
    }
  });

  for (const dryRun of [false, true]) {
    const mode = dryRun ? "DRY_RUN" : "real";

    it(`FD (a user file at every file path, every directory made), ${mode}: zero bytes changed, and the user's .grugops/install.json is left`, () => {
      const t = fresh(`fd-${mode}`);
      plant(t, true);
      const o = uninstallAndDiff(t, dryRun);
      expectZeroBytes(o, `FD ${mode}`);
      expect(o.run.stdout).toMatch(/^ {2}left\s+\.grugops\/install\.json \(it does not read as a grugops install marker/m);
    });

    it(`D (every directory path made empty), ${mode}: every directory is still there`, () => {
      const t = fresh(`d-${mode}`);
      plant(t, false);
      const o = uninstallAndDiff(t, dryRun);
      expectZeroBytes(o, `D ${mode}`);
    });

    for (const v of ["default", "symlink", "migrate", "checkpoints-notify"] as const) {
      it(`FI (install's own bytes from the ${v} variant, no marker), ${mode}: zero bytes changed — no block, file or directory is removed by presence`, () => {
        const t = fresh(`fi-${v}-${mode}`);
        copyInstalled(t, v, null);
        const o = uninstallAndDiff(t, dryRun);
        expectZeroBytes(o, `FI ${v} ${mode}`);
      });
    }

    it(`FM (the default install's bytes under a user's JSON object at the marker path), ${mode}: zero bytes changed`, () => {
      const t = fresh(`fm-${mode}`);
      copyInstalled(t, "default", userBody(MARKER_REL));
      const o = uninstallAndDiff(t, dryRun);
      expectZeroBytes(o, `FM ${mode}`);
      expect(o.run.stdout).toMatch(/^ {2}left\s+\.grugops\/install\.json \(it does not read as a grugops install marker/m);
    });
  }

  // Red-team B2 of plan 33.1-33 (brief DC-2): a marker is install's record for the directory it was
  // written in. A marker that is not install's own for THIS directory proves nothing here, however
  // well it is formed:
  //   FC  a whole installed tree copied from another directory, marker and all (`cp -r`, or README
  //       §1's copy path plus a `.grugops/` copied from another installed repository). Its ledgers
  //       describe the other directory, and every file here holds install's bytes, so without a
  //       binding the copied file and dir records all "held".
  //   FL  the same with the marker's `target` field taken out: a marker written before markers were
  //       bound to their directory. It cannot show which directory it describes.
  //   FH  a hand-made marker at the marker path: empty strings, an installMode that is not copy or
  //       symlink, relative paths, a `target` naming another directory, and an install-shaped marker
  //       with no `target`.
  // Each is changed by zero bytes, real and DRY_RUN, and the marker is left.
  const handMade = (t: string): ReadonlyArray<readonly [string, string]> => [
    ["empty strings and installMode banana", JSON.stringify({ grugopsHome: "", kitRoot: "", installMode: "banana" })],
    ["installMode banana with absolute paths", JSON.stringify({ grugopsHome: "/x", kitRoot: "/x/agent-factory", installMode: "banana" })],
    ["relative paths", JSON.stringify({ kitVersion: "2.1.0", grugopsHome: "home", kitRoot: "home/agent-factory", installMode: "copy" })],
    ["install-shaped, no target", JSON.stringify({ kitVersion: "2.1.0", grugopsHome: "/x", kitRoot: "/x/agent-factory", installMode: "copy" })],
    ["install-shaped, target names another directory", JSON.stringify({ kitVersion: "2.1.0", grugopsHome: "/x", kitRoot: "/x/agent-factory", installMode: "copy", target: `${t}-elsewhere` })],
    ["install-shaped, target not a string", JSON.stringify({ kitVersion: "2.1.0", grugopsHome: "/x", kitRoot: "/x/agent-factory", installMode: "copy", target: 5 })],
  ];
  for (const dryRun of [false, true]) {
    const mode = dryRun ? "DRY_RUN" : "real";
    for (const v of ["default", "symlink", "migrate", "checkpoints-notify"] as const) {
      it(`FC (the ${v} variant's installed tree copied to another directory, marker and all), ${mode}: zero bytes changed, the marker is left`, () => {
        const t = fresh(`fc-${v}-${mode}`);
        cpSync(SET.variant(v).target, t, { recursive: true, verbatimSymlinks: true });
        const o = uninstallAndDiff(t, dryRun);
        expectZeroBytes(o, `FC ${v} ${mode}`);
        expect(o.run.status, o.run.stdout).toBe(3);
        expect(o.run.stdout).toMatch(/^ {2}left\s+\.grugops\/install\.json \(/m);
      });
      it(`FL (the ${v} variant's installed tree with a marker written before markers were bound), ${mode}: zero bytes changed`, () => {
        const t = fresh(`fl-${v}-${mode}`);
        cpSync(SET.variant(v).target, t, { recursive: true, verbatimSymlinks: true });
        const mp = join(t, ...MARKER_REL.split("/"));
        const m = JSON.parse(readFileSync(mp, "utf8")) as Record<string, unknown>;
        delete m.target;
        writeFileSync(mp, JSON.stringify(m, null, 2) + "\n");
        const o = uninstallAndDiff(t, dryRun);
        expectZeroBytes(o, `FL ${v} ${mode}`);
        expect(o.run.status, o.run.stdout).toBe(3);
      });
    }
    it(`FH (hand-made markers over the default install's bytes), ${mode}: zero bytes changed for every shape`, () => {
      const probe = fresh(`fh-${mode}`);
      for (const [what, body] of handMade(probe)) {
        const t = fresh(`fh-${mode}`);
        copyInstalled(t, "default", body.split(`${probe}-elsewhere`).join(`${t}-elsewhere`) + "\n");
        const o = uninstallAndDiff(t, dryRun);
        expectZeroBytes(o, `FH ${what} ${mode}`);
        expect(o.run.status, `${what}\n${o.run.stdout}`).toBe(3);
      }
    });
  }

  it("the README §1 repro: AGENTS.md and a runnable copied by hand, plus .grugops/ copied from another installed repository: uninstall changes zero bytes, and the user's tools/grugops/ stays", () => {
    const other = SET.variant("default").target;
    for (const dryRun of [false, true]) {
      const t = fresh(`readme1-${dryRun ? "dry" : "real"}`);
      cpSync(join(other, "AGENTS.md"), join(t, "AGENTS.md"));
      mkdirSync(join(t, "tools", "grugops"), { recursive: true });
      cpSync(join(other, "tools", "grugops", "host-protection.js"), join(t, "tools", "grugops", "host-protection.js"));
      mkdirSync(join(t, ".grugops"), { recursive: true });
      cpSync(join(other, ".grugops", "install.json"), join(t, ".grugops", "install.json"));
      cpSync(join(other, ".grugops", "factory.config.json"), join(t, ".grugops", "factory.config.json"));
      const o = uninstallAndDiff(t, dryRun);
      expectZeroBytes(o, `README §1 repro ${dryRun ? "DRY_RUN" : "real"}`);
    }
  });

  // FN (plan 33.1-36, D-33 (b)): the default install's bytes under a marker in the round-2 six-record
  // shape (the one ledger rebuilt as the six retired records by sixRecordShape), re-bound to THIS
  // directory. No released version wrote that shape, and this build reads it as no record (`unbound` by
  // no-ledger), so uninstall changes zero bytes, real and DRY_RUN, and exits 3 with the remedy.
  for (const dryRun of [false, true]) {
    const mode = dryRun ? "DRY_RUN" : "real";
    it(`FN (the default install's bytes under a bound six-record marker), ${mode}: zero bytes changed, exit 3, the remedy named`, () => {
      const t = fresh(`fn-${mode}`);
      cpSync(SET.variant("default").target, t, { recursive: true, verbatimSymlinks: true });
      rebindMarker(t);
      const mp = join(t, ...MARKER_REL.split("/"));
      const six = sixRecordShape(JSON.parse(readFileSync(mp, "utf8")) as Record<string, unknown>);
      for (const name of RETIRED_RECORD_NAMES) expect(Object.prototype.hasOwnProperty.call(six, name), name).toBe(true);
      writeFileSync(mp, JSON.stringify(six, null, 2) + "\n");
      const o = uninstallAndDiff(t, dryRun);
      expectZeroBytes(o, `FN ${mode}`);
      expect(o.run.status, o.run.stdout).toBe(3);
      expect(o.run.stdout).toMatch(/re-run install\.js here, then uninstall/i);
    });
  }

  it("a real install followed by a real uninstall still removes the marker (the round trip is unchanged)", () => {
    const t = fresh("rt-marker");
    cpSync(SET.variant("default").target, t, { recursive: true, verbatimSymlinks: true });
    rebindMarker(t);
    const o = uninstallAndDiff(t, false);
    expect(o.run.status, o.run.stdout).toBe(0);
    expect(o.changed.some((r) => r.startsWith(`${MARKER_REL} `))).toBe(true);
    expect(o.run.stdout).toMatch(/^ {2}removed\s+\.grugops\/install\.json \(grugops-owned marker/m);
  });
});

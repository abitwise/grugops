// installer-user-edit.test.ts — brief DC-2 on the user-edit side, as a class (plan 33.1-34;
// .planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-GAP-PLANNING-BRIEF.md §1 and §2.1,
// the "DC-2, user edit" bullet; D-18, never delete user content).
//
// THE RULE. Uninstall deletes or edits a path only when an install record says install created or
// changed it, and the content still matches. An edit a user makes to a file install wrote is user
// content, so after install, then an edit to ANY installed file, then uninstall, the edit is still there.
// A file uninstall reports on is reported `left` or `skipped`, or with an edit line that says the rest of
// the file was preserved, and never as removed whole.
//
// THE FILE SET IS DERIVED, NEVER TYPED. INSTALLED_FILES is every file written by the copy-mode install
// variants of the ONE shared derivation, install/installer-paths.test-support.ts deriveWritePaths (plan
// 33.1-27): `default` (copy mode, `--yes`, the default checkpoints, so the ask rules are written),
// `checkpoints-notify` and `--migrate` over an old layout. Each file is edited in a copy of the tree
// installed by the first of those variants that wrote it, re-bound to the copy's directory with
// rebindMarker (the marker is bound to its directory, red-team B2 of plan 33.1-33; the copy is the same
// install moved). Its size is pinned as INSTALLED_FILE_COUNT, the excluded file included: a change that
// makes install write a new file turns this file red until the count is re-pinned with a reason.
//
// THE KINDS THIS COVERS. The derived set reaches every kind of entry install writes in the one install
// ledger of `.grugops/install.json` (plan 33.1-36, D-33 (b)): file entries (kit false: AGENTS.md, the
// runnables, the pointer files install created; kit true: every skill and adapter), dir entries (every
// directory, edited by adding a user file inside it), the gemini entry (`.gemini/settings.json`), the
// ask-rules entry (`.claude/settings.json`), block entries (CLAUDE.md and the Copilot file, edited after
// the block and, separately, inside it), and the marker's `target` binding (an edited copy that is NOT
// re-bound is changed by zero bytes). The test takes the kind list from install-marker.ts LEDGER_KINDS,
// asserts its count, and asserts that each kind names at least one path in the set, so the coverage
// cannot silently lose a kind.
//
// DECLARED EXCLUSIONS, COUNTED:
//   - the `--symlink` variant. Editing one of its links edits the kit source in the shared kit home, not
//     a user copy in the repository; install's own link at a kit path, and a re-pointed link, are
//     covered by install/uninstall-removal.test.ts and plan 33.1-30's kit-file cases. The test asserts
//     that the symlink variant writes no path the copy-mode variants do not, so excluding it drops no
//     path from the set.
//   - EXCLUDED = { .grugops/install.json }: install's own record. Uninstall removes it by design when it
//     reads as install's marker for this directory (ownsMarker, plan 33.1-33); a key a user adds to it is
//     not preserved. It is counted in INSTALLED_FILE_COUNT.
//
// KNOWN EXCEPTIONS, DECLARED AND COUNTED (red-team carry items 12 and 13; a human decision is pending at
// plan 33.1-35, so their behaviour is NOT changed here). Each has a case below that asserts the exception
// still reproduces, so the count stays honest: when plan 33.1-35 changes the behaviour, that case turns
// red and the exception is taken off this list.
//   12  removeAskRules removes an ask rule by its NAME in the ask-rules entry and never checks
//       askContent against the current permissions.ask. A user who deletes install's rule and later adds
//       the same rule string loses it at uninstall.
//   13  a re-install over an unreadable .claude/settings.json (here: a hard link, which install refuses
//       to read) resets the ask ledger, so the next uninstall leaves install's rules in the file and says
//       there is no record that install added them. No user byte is lost; install's rules are left.
//
// MUTATION PROOFS are recorded in 33.1-34-SUMMARY.md: each record gate of uninstall.ts was broken in turn
// (tsc exit 0 and a changed .js first) and this file went red on the file that gate protects.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first). Hermetic:
// HOME, GRUGOPS_HOME and TARGET are scratch directories removed at the end; the real repository and the
// real home are never targeted. Clear professional voice: this is a safety surface.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { cpSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  MARKER_REL,
  type Run,
  type VariantName,
  type VariantRun,
  deriveWritePaths,
  normalizeIso,
  rebindMarker,
  runInstall,
  runUninstall,
  snapshotTree,
} from "./installer-paths.test-support.js";
import { KINDS_BY_SCOPE, LEDGER_KINDS } from "./install-marker.js";
import { askRecord, blockRecords, ledgerOf } from "./ledger.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-useredit-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;
const at = (t: string, rel: string): string => join(t, ...rel.split("/"));

// ── the derived set (plan 33.1-27's one derivation) ─────────────────────────────────────────────
const SET = deriveWritePaths(fresh("derive"));

/** The copy-mode variants, in the order a file's editing tree is chosen. */
const COPY_VARIANTS: readonly VariantName[] = ["default", "checkpoints-notify", "migrate"];
/** The one excluded variant, with its reason. */
const EXCLUDED_VARIANT = {
  name: "symlink" as VariantName,
  why:
    "editing a link at a kit path edits the kit source in the shared kit home, not a user copy in the " +
    "repository; install's own link and a re-pointed link are covered by uninstall-removal.test.ts and " +
    "plan 33.1-30's kit-file cases",
};
/** The one declared file exclusion, with its reason. */
const EXCLUDED: ReadonlyMap<string, string> = new Map([
  [MARKER_REL, "install's own record; uninstall removes it by design when it reads as install's marker for this directory (ownsMarker, plan 33.1-33)"],
]);

/** Every file (never a link, never a directory) a copy-mode variant wrote, with the variant whose tree it is edited in. */
const INSTALLED: ReadonlyArray<{ readonly path: string; readonly variant: VariantName }> = SET.paths
  .filter((w) => COPY_VARIANTS.some((v) => w.kinds[v] === "file"))
  .map((w) => ({ path: w.path, variant: COPY_VARIANTS.find((v) => w.kinds[v] === "file")! }));
const INSTALLED_FILES: readonly string[] = INSTALLED.map((e) => e.path);
/**
 * Pinned, the excluded marker included. A plan that makes install write a new file changes this and
 * must re-pin it with a reason. 58 on 2026-09-30 (plan 33.1-34): 57 edited, plus the excluded marker.
 */
const INSTALLED_FILE_COUNT = 58;

/** Every directory a copy-mode variant created, with the variant whose tree it is edited in. */
const INSTALLED_DIRS: ReadonlyArray<{ readonly path: string; readonly variant: VariantName }> = SET.paths
  .filter((w) => COPY_VARIANTS.some((v) => w.kinds[v] === "dir"))
  .map((w) => ({ path: w.path, variant: COPY_VARIANTS.find((v) => w.kinds[v] === "dir")! }));

/** The two known exceptions (red-team carry items 12 and 13), counted; see the header. */
const KNOWN_EXCEPTIONS = ["12 ask rules removed by name", "13 unreadable settings reset the ask ledger"] as const;
const KNOWN_EXCEPTION_COUNT = 2;

/** normalized path → the real relative path in a variant's installed tree (the `<ISO>` segments filled in). */
const REAL_NAMES = new Map<VariantName, Map<string, string>>();
function realRel(v: VariantRun, normalized: string): string {
  let m = REAL_NAMES.get(v.name);
  if (m === undefined) {
    m = new Map();
    for (const row of snapshotTree(v.target).split("\n")) {
      const rel = row.endsWith("/ DIR") ? row.slice(0, -"/ DIR".length) : row.slice(0, row.search(/ (LINK |[0-9a-f]{64}$|OTHER$)/));
      m.set(normalizeIso(rel), rel);
    }
    REAL_NAMES.set(v.name, m);
  }
  const r = m.get(normalized);
  if (r === undefined) throw new Error(`${normalized} is not in the ${v.name} variant's installed tree`);
  return r;
}

/** A copy of `v`'s installed tree, links kept verbatim, re-bound to the copy (unless `bind` is false). */
function copyOf(v: VariantRun, tag: string, bind = true): string {
  const t = fresh(tag);
  cpSync(v.target, t, { recursive: true, verbatimSymlinks: true });
  if (bind) rebindMarker(t);
  return t;
}

function uninstall(v: VariantRun, t: string, dryRun = false): Run {
  const r = runUninstall(t, v.grugopsHome, { dryRun, home: fresh("home"), timeoutMs: 120_000 });
  expect(r.error, "the uninstaller could not be run").toBeUndefined();
  expect(r.stderr, "stack trace on stderr").not.toMatch(NO_STACK);
  return r;
}

/** The report lines whose message names `rel` (relative, or absolute under `t`) as its subject. */
function linesNaming(stdout: string, t: string, rel: string): Array<{ label: string; msg: string }> {
  const abs = at(t, rel);
  const out: Array<{ label: string; msg: string }> = [];
  for (const line of stdout.split("\n")) {
    const m = /^ {2}(\S+)\s+(.+)$/.exec(line);
    if (m === null) continue;
    const msg = m[2];
    const names = (p: string): boolean => msg === p || msg.startsWith(`${p} `);
    if (names(rel) || names(abs)) out.push({ label: m[1], msg });
  }
  return out;
}

/** A line about F is allowed only when it keeps F: `left`, `skipped`, or an edit that preserved the rest. */
function expectNoWholeFileRemoval(stdout: string, t: string, rel: string): void {
  for (const { label, msg } of linesNaming(stdout, t, rel)) {
    const ok = label === "left" || label === "skipped" || /preserved/.test(msg);
    expect(ok, `uninstall reported ${rel} as "${label} ${msg}", which is not left, skipped or an edit that preserved the rest`).toBe(true);
  }
}

const isJson = (rel: string): boolean => rel.endsWith(".json");
const editLine = (rel: string): string => `user edit ${rel}\n`;

/** Edit the file: a new top-level key in a JSON file (2-space JSON), an appended line anywhere else. */
function edit(p: string, rel: string): void {
  if (isJson(rel)) {
    const o = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
    o.userEdit = rel;
    writeFileSync(p, JSON.stringify(o, null, 2) + "\n");
  } else {
    writeFileSync(p, readFileSync(p, "utf8") + editLine(rel));
  }
}

function expectEditSurvives(p: string, rel: string, stdout: string): void {
  expect(existsSync(p), `${rel} is gone after uninstall; the user's edit was lost\n${stdout}`).toBe(true);
  const text = readFileSync(p, "utf8");
  if (isJson(rel)) {
    expect((JSON.parse(text) as Record<string, unknown>).userEdit, `${rel} lost the user's key\n${stdout}`).toBe(rel);
  } else {
    expect(text.includes(editLine(rel)), `${rel} lost the user's line\n${stdout}`).toBe(true);
  }
}

const markerLedgers = (t: string): Record<string, unknown> => JSON.parse(readFileSync(at(t, MARKER_REL), "utf8")) as Record<string, unknown>;

describe("every edit to every installed file survives uninstall (brief DC-2 user edit, plan 33.1-34)", () => {
  it("INSTALLED_FILES is the derived set of every copy-mode variant's files, its size is INSTALLED_FILE_COUNT, and the exclusions are declared", () => {
    for (const v of SET.variants) expect(v.run.status, `the ${v.name} install did not exit 0\n${v.run.stdout}`).toBe(0);
    console.log(
      `INSTALLED_FILES (${INSTALLED_FILES.length}, from ${COPY_VARIANTS.join(", ")}):\n` +
        INSTALLED.map((e) => `${e.path}  [edited in: ${e.variant}]${EXCLUDED.has(e.path) ? "  EXCLUDED" : ""}`).join("\n"),
    );
    console.log(`INSTALLED_FILE_COUNT=${INSTALLED_FILE_COUNT}`);
    console.log(`EXCLUDED (${EXCLUDED.size}): ${[...EXCLUDED].map(([p, why]) => `${p} — ${why}`).join("; ")}`);
    console.log(`EXCLUDED variant: ${EXCLUDED_VARIANT.name} — ${EXCLUDED_VARIANT.why}`);
    console.log(`INSTALLED_DIRS (${INSTALLED_DIRS.length}): ${INSTALLED_DIRS.map((d) => d.path).join(", ")}`);
    console.log(`KNOWN_EXCEPTIONS (${KNOWN_EXCEPTION_COUNT}): ${KNOWN_EXCEPTIONS.join("; ")}`);
    expect(INSTALLED_FILES.length).toBe(INSTALLED_FILE_COUNT);
    expect(INSTALLED_FILES.length).toBeGreaterThanOrEqual(30);
    expect(EXCLUDED.size).toBe(1);
    for (const p of EXCLUDED.keys()) expect(INSTALLED_FILES, `the excluded ${p} is not an installed file`).toContain(p);
    expect(KNOWN_EXCEPTIONS.length).toBe(KNOWN_EXCEPTION_COUNT);
    // The copy-mode variants write files, never links, at every file path.
    for (const w of SET.paths) {
      for (const v of COPY_VARIANTS) expect(w.kinds[v], `${w.path}: the ${v} variant wrote a link`).not.toBe("symlink");
    }
    // Excluding the symlink variant drops no path: every path it writes a copy-mode variant writes too.
    const symlinkOnly = SET.paths.filter((w) => w.variants.every((v) => v === EXCLUDED_VARIANT.name)).map((w) => w.path);
    expect(symlinkOnly, `paths only the ${EXCLUDED_VARIANT.name} variant writes`).toEqual([]);
  });

  it("each LEDGER_KINDS kind in the default install's ledger names at least one path in the derived set (the coverage cannot lose a kind)", () => {
    const m = markerLedgers(SET.variant("default").target);
    const files = new Set(INSTALLED_FILES);
    const dirs = new Set(INSTALLED_DIRS.map((d) => d.path));
    const entries = ledgerOf(m);
    // The kind list comes from install-marker.ts, and its count is asserted, so a new kind is noticed. Of
    // the seven kinds (plan 33.1-37), `kit` lives only in the kit-home record, and `backup` is in a target's
    // ledger only once install records the target backups it makes (plan 33.1-40; a default install makes
    // none). Both are named here, so the five the default install writes are the rest.
    expect(LEDGER_KINDS.length).toBe(7);
    const notWritten = ["backup", "kit"];
    const defaultKinds = KINDS_BY_SCOPE.target.filter((k) => !notWritten.includes(k));
    expect(defaultKinds.length).toBe(5);
    expect(LEDGER_KINDS.filter((k) => !defaultKinds.includes(k))).toEqual(notWritten);
    for (const kind of defaultKinds) {
      const paths = entries.filter((e) => e.kind === kind).map((e) => e.path);
      const set = kind === "dir" ? dirs : files;
      expect(paths.length, `the ledger has no ${kind} entry`).toBeGreaterThan(0);
      for (const p of paths) expect(set.has(p), `a ${kind} entry names ${p}, which is not in the derived set`).toBe(true);
    }
    // Both halves of the file kind (what install created, and the kit files D-32 governs) are reached.
    for (const kit of [false, true]) {
      expect(entries.some((e) => e.kind === "file" && e.kit === kit), `no file entry with kit ${kit}`).toBe(true);
    }
    // Every entry's kind is one of LEDGER_KINDS.
    expect(entries.filter((e) => !(LEDGER_KINDS as readonly string[]).includes(e.kind)).map((e) => e.kind)).toEqual([]);
    // The binding.
    expect(typeof m.target === "string" && files.has(MARKER_REL), "the marker's target binding").toBe(true);
    // The marker keys are exactly install's, so a new field is noticed.
    const known = new Set(["kitVersion", "grugopsHome", "kitRoot", "installMode", "target", "ledger"]);
    expect(Object.keys(m).filter((k) => !known.has(k)), "a marker key this test does not cover").toEqual([]);
  });

  for (const { path: rel, variant } of INSTALLED) {
    if (EXCLUDED.has(rel)) continue;
    it(`${rel} (edited in the ${variant} install): the user's ${isJson(rel) ? "key" : "line"} survives uninstall, and the file is never reported removed whole`, () => {
      const v = SET.variant(variant);
      const r = realRel(v, rel);
      const t = copyOf(v, `edit-${variant}`);
      const p = at(t, r);
      edit(p, rel);
      const u = uninstall(v, t);
      expect([0, 3], `exit ${u.status}\n${u.stdout}`).toContain(u.status);
      expectEditSurvives(p, rel, u.stdout);
      expectNoWholeFileRemoval(u.stdout, t, r);
    }, 30_000);
  }

  // Block entries: a line the user writes INSIDE the grugops block (red-team carry item 4). The set is
  // the default install's block entries, not a typed list.
  const BLOCK_FILES = Object.keys(blockRecords(markerLedgers(SET.variant("default").target)));
  for (const rel of BLOCK_FILES) {
    it(`${rel}: a line the user writes inside the grugops block survives uninstall (its block entry)`, () => {
      const v = SET.variant("default");
      const t = copyOf(v, "inside-block");
      const p = at(t, rel);
      const lines = readFileSync(p, "utf8").split("\n");
      const open = lines.findIndex((l) => /^<!-- GSD:grugops-.*start-here -->$/.test(l));
      expect(open, `${rel} has no grugops open marker line`).toBeGreaterThanOrEqual(0);
      const userLine = `user edit inside the block of ${rel}`;
      lines.splice(open + 1, 0, userLine);
      writeFileSync(p, lines.join("\n"));
      const u = uninstall(v, t);
      expect([0, 3], `exit ${u.status}\n${u.stdout}`).toContain(u.status);
      expect(existsSync(p), `${rel} is gone\n${u.stdout}`).toBe(true);
      expect(readFileSync(p, "utf8"), `${rel} lost the line inside the block\n${u.stdout}`).toContain(userLine);
      expectNoWholeFileRemoval(u.stdout, t, rel);
    }, 30_000);
  }

  // Dir entries: a file the user adds inside a directory install created.
  for (const { path: rel, variant } of INSTALLED_DIRS) {
    it(`${rel}/ (created by the ${variant} install): a file the user adds inside it survives uninstall, and so does the directory`, () => {
      const v = SET.variant(variant);
      const r = realRel(v, rel);
      const t = copyOf(v, `dir-${variant}`);
      const p = join(at(t, r), "user-added-file.txt");
      writeFileSync(p, `a file the user added in ${rel}\n`);
      const u = uninstall(v, t);
      expect([0, 3], `exit ${u.status}\n${u.stdout}`).toContain(u.status);
      expect(existsSync(p), `the user's file in ${rel}/ is gone\n${u.stdout}`).toBe(true);
    }, 30_000);
  }

  it("the marker's `target` binding: an edited copy that is NOT re-bound is changed by zero bytes, real and DRY_RUN", () => {
    const v = SET.variant("default");
    for (const dryRun of [false, true]) {
      const t = copyOf(v, `unbound-${dryRun ? "dry" : "real"}`, false);
      edit(at(t, "CLAUDE.md"), "CLAUDE.md");
      edit(at(t, ".claude/settings.json"), ".claude/settings.json");
      const before = snapshotTree(t);
      const u = uninstall(v, t, dryRun);
      expect(u.status, u.stdout).toBe(3);
      expect(snapshotTree(t), `uninstall changed a copy whose marker names another directory\n${u.stdout}`).toBe(before);
    }
  });

  it("KNOWN EXCEPTION 12 still reproduces (pending plan 33.1-35): a rule the user deleted and later added again is removed by name", () => {
    const v = SET.variant("default");
    const t = copyOf(v, "exception-12");
    const p = at(t, ".claude/settings.json");
    const o = JSON.parse(readFileSync(p, "utf8")) as { permissions: { ask: string[] } };
    const rule = "Bash(git push *)";
    expect(o.permissions.ask).toContain(rule);
    // The user deletes install's rule, then later adds the same rule string back, at the end of the list.
    o.permissions.ask = [...o.permissions.ask.filter((x) => x !== rule), rule];
    writeFileSync(p, JSON.stringify(o, null, 2) + "\n");
    const u = uninstall(v, t);
    expect([0, 3]).toContain(u.status);
    const after = existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as { permissions?: { ask?: string[] } }) : {};
    const kept = (after.permissions?.ask ?? []).includes(rule);
    expect(kept, "exception 12 no longer reproduces: the user's re-added rule survived. Take item 12 off KNOWN_EXCEPTIONS and turn this case into a survives-case.").toBe(false);
  });

  it("KNOWN EXCEPTION 13 still reproduces (pending plan 33.1-35): a re-install over an unreadable .claude/settings.json resets the ask ledger, and uninstall then leaves install's rules; the user's key survives", () => {
    const v = SET.variant("default");
    const t = copyOf(v, "exception-13");
    const p = at(t, ".claude/settings.json");
    edit(p, ".claude/settings.json");
    // A hard link is a settings file install refuses to read (plan 33.1-29).
    const second = join(fresh("second-name"), "settings.json");
    linkSync(p, second);
    const re = runInstall(t, v.grugopsHome, [], { home: fresh("home"), timeoutMs: 180_000 });
    expect(re.stderr).not.toMatch(NO_STACK);
    expect(re.status, re.stdout).toBe(3);
    rmSync(second);
    const ledger = askRecord(markerLedgers(t)) as { added: unknown[] };
    expect(ledger.added.length, "exception 13 no longer reproduces: the re-install kept the ask ledger. Take item 13 off KNOWN_EXCEPTIONS.").toBe(0);
    const u = uninstall(v, t);
    expect([0, 3]).toContain(u.status);
    expectEditSurvives(p, ".claude/settings.json", u.stdout);
    const ask = (JSON.parse(readFileSync(p, "utf8")) as { permissions: { ask: string[] } }).permissions.ask;
    expect(ask.length, "install's rules are left in place (the ledger claims none of them)").toBeGreaterThan(0);
  });
});

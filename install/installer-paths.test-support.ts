// installer-paths.test-support.ts — the ONE derivation of "every path install can write", shared by
// the class tests that must cover that whole set (plan 33.1-27; brief 33.1-GAP-PLANNING-BRIEF.md
// §2.1 and §2.2):
//   - install/installer-write-set.test.ts    DC-3 / D-18 at every write path of a default install;
//   - install/installer-special-files.test.ts DC-3 at every path the tooling reads, five run kinds;
//   - the DC-2 class tests of plans 33.1-33 and 33.1-34 (a user file at every write path).
// Each of them takes its path set from here, so they cannot drift apart, and none of them types a
// path list by hand.
//
// WHY THE SET IS A UNION OVER SEVERAL REAL INSTALLS. One default install into an empty target does
// not write every path install can write:
//   - `default`             copy mode, `--yes`, the default checkpoint configuration (both
//                           checkpoints at block), so `.claude/settings.json` gets the ask rules;
//   - `symlink`             `--symlink` writes links instead of copies at the kit paths;
//   - `migrate`             `--yes --migrate --backup-edited-kit` over an old-layout target seeds the
//                           per-repo config from a legacy file and moves the in-repo kit and the root
//                           config aside to timestamped `.bak.<ISO>` backups; the old layout's kit files
//                           have no install record, so D-32 (plan 33.1-32) needs consent and backs each
//                           one up to a timestamped `<file>.grugops-edited-<ISO>` first;
//   - `checkpoints-notify`  both checkpoints at notify in `.grugops/factory.config.json`, so no ask
//                           rule and no `.claude/settings.json` is written (a subset, recorded so the
//                           set says which variants write that file).
// For each variant the target is snapshotted before and after the run (snapshotTree), and every file
// or link that is new or changed and every directory that is new is a written path. A path segment
// carrying the run's timestamp is normalized to `<ISO>`, so two runs name the same path. The result
// is the union, with the variants that wrote each path and what each wrote there.
//
// Hermetic: every install runs with HOME, GRUGOPS_HOME and TARGET inside a scratch directory the
// caller passes in and removes; the real repository and the real home are never targeted. It drives
// the COMMITTED install/install.js (npm run build first).
//
// THE KIT-HOME AXIS (plan 33.1-37, review IN-06). Every variant above runs with GRUGOPS_HOME outside the
// target, and the install and uninstall halves always run from one GRUGOPS_SRC, so two axes install
// depends on were never varied. That is how CR-01 (GRUGOPS_HOME set to the target: the in-repo
// agent-factory/ was deleted) and WR-01 (a recorded file the uninstalling kit source does not ship)
// escaped the class tests. This module now varies the kit home:
//   REFUSAL_VARIANTS   the four ways the kit home and the target can overlap after realpath; each must
//                      be refused before any write, real and DRY_RUN, with zero bytes changed in the
//                      target and in the kit home (runRefusalVariant);
//   KIT_HOME_VARIANTS  a kit home outside the target holding something install did not write at the
//                      kit root (a user's agent-factory/, a link); the user's bytes must survive inside
//                      the backup copyKit records (runKitHomeVariant).
// THE UNINSTALL-SOURCE AXIS (plan 33.1-38, review WR-01 and IN-06). Uninstall used to remove what the
// checkout running it ships, so a recorded file that checkout does not ship was left unnamed. This module
// now varies the kit source on the uninstall side:
//   UNINSTALL_SOURCE_VARIANTS  an empty kit source, a kit source that cannot be read (a regular file), and
//                              a --symlink install uninstalled from another checkout (a copy of the kit
//                              elsewhere, so no link install made points at it);
//   runUninstallWithSource     uninstall with GRUGOPS_SRC set to such a source.
//
// Clear professional voice: this is test infrastructure for a safety surface.
//
// A `.test-support.ts` module is excluded from emit (tsconfig.json), type-checked by
// tsconfig.tests.json, and counted in NON_TEST_MODULE_COUNT (scripts/check-foundation-guards.test.ts).

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const REPO_ROOT = resolve(import.meta.dirname, "..");
export const INSTALL_JS = join(import.meta.dirname, "install.js");
export const UNINSTALL_JS = join(import.meta.dirname, "uninstall.js");

/** The marker install writes; the one path the marker reader reads. */
export const MARKER_REL = ".grugops/install.json";

// ── snapshotTree ────────────────────────────────────────────────────────────────────────────────
// A sorted manifest with ONE row per entry under `dir`:
//   `<rel>/ DIR`                  a directory (so an empty directory is visible)
//   `<rel> LINK <readlink>`       a symlink, never followed
//   `<rel> <sha256>`              a regular file, by content
//   `<rel> OTHER`                 anything else (FIFO, socket, device): never opened
// An absent `dir` snapshots to "" — a legitimate, diffable "never created" state.
export function snapshotTree(dir: string): string {
  if (!existsSync(dir)) return "";
  const rows: string[] = [];
  const walk = (rel: string): void => {
    const abs = rel ? join(dir, rel) : dir;
    for (const ent of readdirSync(abs, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = join(dir, childRel);
      if (ent.isSymbolicLink()) {
        rows.push(`${childRel} LINK ${readlinkSync(childAbs)}`);
      } else if (ent.isDirectory()) {
        rows.push(`${childRel}/ DIR`);
        walk(childRel);
      } else if (ent.isFile()) {
        rows.push(`${childRel} ${createHash("sha256").update(readFileSync(childAbs)).digest("hex")}`);
      } else {
        rows.push(`${childRel} OTHER`);
      }
    }
  };
  walk("");
  return rows.sort().join("\n");
}

type EntryKind = "file" | "symlink" | "dir" | "other";

/** snapshotTree's rows as path → { kind, row }. */
function treeEntries(snapshot: string): Map<string, { kind: EntryKind; row: string }> {
  const m = new Map<string, { kind: EntryKind; row: string }>();
  for (const row of snapshot === "" ? [] : snapshot.split("\n")) {
    if (row.endsWith("/ DIR")) {
      m.set(row.slice(0, -"/ DIR".length), { kind: "dir", row });
      continue;
    }
    const link = row.indexOf(" LINK ");
    if (link !== -1) {
      m.set(row.slice(0, link), { kind: "symlink", row });
      continue;
    }
    const sp = row.lastIndexOf(" ");
    const tail = row.slice(sp + 1);
    m.set(row.slice(0, sp), { kind: tail === "OTHER" ? "other" : "file", row });
  }
  return m;
}

// ── fixtures ────────────────────────────────────────────────────────────────────────────────────

/** A user repository: a user-owned CLAUDE.md, a stand-in frozen core, and a user-owned board. */
export function makeFixture(d: string): string {
  mkdirSync(join(d, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(d, "plans"), { recursive: true });
  writeFileSync(join(d, "CLAUDE.md"), "# User Project\n\nMy own dev instructions — must be preserved.\n");
  writeFileSync(join(d, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE — uninstall must never delete this.\n");
  writeFileSync(join(d, "plans", "board.md"), "user board\n");
  return d;
}

/**
 * The v1.0 migrate-FROM shape, in `d`: a vendored in-repo agent-factory/ with an old user-edited
 * config inside it, repo-relative .claude adapters with no materialized-kit block, no marker, and
 * (with `rootConfig`) a legacy config at the repo root too.
 */
export function makeOldLayoutFixture(d: string, opts: { rootConfig?: boolean } = {}): string {
  mkdirSync(join(d, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(d, "agent-factory", "config"), { recursive: true });
  mkdirSync(join(d, "agent-factory", "workflows"), { recursive: true });
  writeFileSync(join(d, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE — old in-repo vendored kit.\n");
  writeFileSync(
    join(d, "agent-factory", "config", "factory.config.json"),
    '{ "_edited": "OLD-USER-EDITED-CONFIG-KIT-LOCATION" }\n',
  );
  if (opts.rootConfig) {
    writeFileSync(join(d, "factory.config.json"), '{ "_edited": "OLD-USER-EDITED-CONFIG-ROOT-LOCATION" }\n');
  }
  mkdirSync(join(d, ".claude", "skills", "grugops"), { recursive: true });
  mkdirSync(join(d, ".claude", "agents"), { recursive: true });
  writeFileSync(
    join(d, ".claude", "skills", "grugops", "SKILL.md"),
    "> read `agent-factory/roles/orchestrator.md` and act as the Orchestrator.\n" +
      "> config: `agent-factory/config/factory.config.json`; workflows: `agent-factory/workflows/`.\n",
  );
  writeFileSync(
    join(d, ".claude", "agents", "grugops-orchestrator.md"),
    "> read `agent-factory/roles/orchestrator.md` and act as the Orchestrator (repo-relative).\n",
  );
  return d;
}

/** The factory configuration with both ask-rule checkpoints at notify: install writes no ask rule. */
export const NOTIFY_CONFIG = '{ "checkpoints": { "protected_branch_merge": "notify", "production_requires_human_confirmation": "notify" } }\n';

/**
 * Re-bind the marker of an installed tree copied to `t` to its new directory: the remedy uninstall and
 * `--check` name for the same repository moved (red-team B2 of plan 33.1-33). The marker is bound to the
 * real path of the directory install wrote it in, so a copy reads as another directory's record until
 * this is done. A test that copies an installed tree to act on the copy as an install calls this.
 */
export function rebindMarker(t: string): void {
  const p = join(t, ".grugops", "install.json");
  const m = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
  m.target = realpathSync.native(t);
  writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
}

// ── the hermetic runners ────────────────────────────────────────────────────────────────────────

export interface Run {
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly error: Error | undefined;
  readonly stdout: string;
  readonly stderr: string;
}

export interface RunOptions {
  /** DRY_RUN=1 when true; DRY_RUN is removed from the environment otherwise. */
  readonly dryRun?: boolean;
  readonly timeoutMs?: number;
  /** A scratch HOME; when omitted HOME is inherited (the kit home is always GRUGOPS_HOME). */
  readonly home?: string;
  /** The kit source (GRUGOPS_SRC); this repository when omitted (plan 33.1-38). */
  readonly src?: string;
}

/**
 * Run a committed installer binary against `target` with the kit home at `grugopsHome`. Copy mode
 * unless `args` says `--symlink`; GRUGOPS_SRC is this repository unless `opts.src` names another.
 */
export function spawnBin(bin: string, args: readonly string[], target: string, grugopsHome: string, opts: RunOptions = {}): Run {
  const env: NodeJS.ProcessEnv = { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: opts.src ?? REPO_ROOT, GRUGOPS_HOME: grugopsHome, TARGET: target };
  if (opts.home !== undefined) env.HOME = opts.home;
  if (opts.dryRun) env.DRY_RUN = "1";
  else delete env.DRY_RUN;
  const r = spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    env,
    timeout: opts.timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, signal: r.signal, error: r.error, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

export const runInstall = (target: string, grugopsHome: string, args: readonly string[] = [], opts: RunOptions = {}): Run =>
  spawnBin(INSTALL_JS, ["--yes", ...args], target, grugopsHome, opts);

export const runUninstall = (target: string, grugopsHome: string, opts: RunOptions = {}): Run =>
  spawnBin(UNINSTALL_JS, [], target, grugopsHome, opts);

// ── the derivation ──────────────────────────────────────────────────────────────────────────────

/** isoStamp()'s shape in install.ts: YYYY-MM-DDTHH-MM-SS.mmmZ (colons replaced by '-'). */
const ISO_SEGMENT = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z/g;
export const ISO_PLACEHOLDER = "<ISO>";
export const normalizeIso = (rel: string): string => rel.replace(ISO_SEGMENT, ISO_PLACEHOLDER);

export type VariantName = "default" | "symlink" | "migrate" | "checkpoints-notify";

export interface VariantRun {
  readonly name: VariantName;
  /** Why this variant is part of the union. */
  readonly why: string;
  readonly target: string;
  readonly grugopsHome: string;
  readonly run: Run;
  /** Files and links written (new or changed), normalized, sorted. */
  readonly files: readonly string[];
  /** Directories created, normalized, sorted. */
  readonly dirs: readonly string[];
  /** What was written at each path: file, symlink or dir. */
  readonly kinds: ReadonlyMap<string, EntryKind>;
}

export interface WritePath {
  readonly path: string;
  /** file | symlink | dir, per variant that wrote it. */
  readonly kinds: Readonly<Partial<Record<VariantName, EntryKind>>>;
  readonly variants: readonly VariantName[];
}

export interface WritePathSet {
  readonly variants: readonly VariantRun[];
  /** Every written path (files, links and directories), sorted by path. */
  readonly paths: readonly WritePath[];
  /** The paths any variant wrote as a file or a link. */
  readonly files: readonly string[];
  /** The paths any variant created as a directory. */
  readonly dirs: readonly string[];
  /** One variant's run, by name. */
  variant(name: VariantName): VariantRun;
}

interface VariantSpec {
  readonly name: VariantName;
  readonly why: string;
  readonly args: readonly string[];
  readonly prepare: (target: string) => void;
}

export const VARIANTS: readonly VariantSpec[] = [
  {
    name: "default",
    why: "copy mode, --yes, the default checkpoints (ask rules written) into an empty target",
    args: [],
    prepare: () => {},
  },
  { name: "symlink", why: "--symlink writes links at the kit paths", args: ["--symlink"], prepare: () => {} },
  {
    name: "migrate",
    why:
      "--migrate over an old layout seeds the config from a legacy file and writes timestamped backups; " +
      "with the consent D-32 needs for the old layout's unrecorded kit files (--backup-edited-kit), it also " +
      "writes their <file>.grugops-edited-<ISO> backups",
    args: ["--migrate", "--backup-edited-kit"],
    prepare: (t) => {
      makeOldLayoutFixture(t, { rootConfig: true });
    },
  },
  {
    name: "checkpoints-notify",
    why: "both checkpoints at notify: no ask rule and no .claude/settings.json",
    args: [],
    prepare: (t) => {
      mkdirSync(join(t, ".grugops"), { recursive: true });
      writeFileSync(join(t, ".grugops", "factory.config.json"), NOTIFY_CONFIG);
    },
  },
];

/**
 * Run every variant into its own scratch target under `scratchRoot` (which the caller owns and
 * removes) and return the union of the paths written. A variant whose install did not exit 0 is
 * still returned (its `run` says so); the caller asserts on it.
 */
export function deriveWritePaths(scratchRoot: string): WritePathSet {
  const variants: VariantRun[] = [];
  for (const spec of VARIANTS) {
    const base = join(scratchRoot, `variant-${spec.name}`);
    const target = join(base, "target");
    const home = join(base, "home");
    mkdirSync(target, { recursive: true });
    mkdirSync(home, { recursive: true });
    spec.prepare(target);
    const before = treeEntries(snapshotTree(target));
    const run = runInstall(target, join(home, ".grugops"), spec.args, { home, timeoutMs: 180_000 });
    const after = treeEntries(snapshotTree(target));
    const files: string[] = [];
    const dirs: string[] = [];
    const kinds = new Map<string, EntryKind>();
    for (const [rel, e] of after) {
      const prev = before.get(rel);
      if (prev !== undefined && prev.row === e.row) continue;
      const n = normalizeIso(rel);
      if (e.kind === "dir") {
        if (prev !== undefined && prev.kind === "dir") continue;
        dirs.push(n);
      } else {
        files.push(n);
      }
      kinds.set(n, e.kind);
    }
    variants.push({ name: spec.name, why: spec.why, target, grugopsHome: join(home, ".grugops"), run, files: files.sort(), dirs: dirs.sort(), kinds });
  }
  const byPath = new Map<string, { kinds: Partial<Record<VariantName, EntryKind>>; variants: VariantName[] }>();
  for (const v of variants) {
    for (const [p, k] of v.kinds) {
      const e = byPath.get(p) ?? { kinds: {}, variants: [] };
      e.kinds[v.name] = k;
      e.variants.push(v.name);
      byPath.set(p, e);
    }
  }
  const paths: WritePath[] = [...byPath]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([path, e]) => ({ path, kinds: e.kinds, variants: e.variants }));
  const isDirPath = (w: WritePath): boolean => Object.values(w.kinds).every((k) => k === "dir");
  return {
    variants,
    paths,
    files: paths.filter((w) => !isDirPath(w)).map((w) => w.path),
    dirs: paths.filter(isDirPath).map((w) => w.path),
    variant(name: VariantName): VariantRun {
      const v = variants.find((x) => x.name === name);
      if (v === undefined) throw new Error(`no variant named ${name}`);
      return v;
    },
  };
}

/** One line per path: the path and, per variant, what it wrote there. For a test's printed union. */
export function describeWritePaths(set: WritePathSet): string {
  return set.paths
    .map((w) => `${w.path}  [${w.variants.map((v) => `${v}:${w.kinds[v]}`).join(", ")}]`)
    .join("\n");
}

// ── the kit-home axis (plan 33.1-37, review IN-06 and CR-01) ─────────────────────────────────────

/** The bytes of the user's own config, the verifier's CR-01 reproduction. */
export const USER_CONFIG = '{"environments":["production"],"mine":"edited"}\n';

/** A user's repository at `dir`: notes at the root, and an in-repo agent-factory/ with their config and notes. */
export function userRepo(dir: string): void {
  mkdirSync(join(dir, "agent-factory", "config"), { recursive: true });
  writeFileSync(join(dir, "MYNOTES.md"), "the user's own notes at the repository root\n");
  writeFileSync(join(dir, "agent-factory", "config", "factory.config.json"), USER_CONFIG);
  writeFileSync(join(dir, "agent-factory", "MYNOTES.md"), "the user's own notes inside agent-factory/\n");
}

export type RefusalVariantName = "kit-home-is-target" | "kit-root-is-target" | "target-in-kit-root" | "kit-home-in-target";

export interface RefusalVariantSpec {
  readonly name: RefusalVariantName;
  /** Why this layout overlaps. */
  readonly why: string;
  /** Lay the variant out under `root` (which the caller owns) and return the target and the kit home. */
  readonly prepare: (root: string) => { readonly target: string; readonly grugopsHome: string };
}

/** The four ways the kit home and the target overlap (install.ts's overlap refusal, plan 33.1-37). */
export const REFUSAL_VARIANTS: readonly RefusalVariantSpec[] = [
  {
    name: "kit-home-is-target",
    why: "GRUGOPS_HOME is the target, so the kit root is the target's own agent-factory/ (review CR-01's reproduction)",
    prepare: (root) => {
      const target = join(root, "repo");
      userRepo(target);
      return { target, grugopsHome: target };
    },
  },
  {
    name: "kit-root-is-target",
    why: "the target is <GRUGOPS_HOME>/agent-factory, so the kit would replace the repository itself",
    prepare: (root) => {
      const home = join(root, "kithome");
      const target = join(home, "agent-factory");
      userRepo(target);
      return { target, grugopsHome: home };
    },
  },
  {
    name: "target-in-kit-root",
    why: "the target lies inside the kit root, so replacing the kit would remove the repository",
    prepare: (root) => {
      const home = join(root, "kithome");
      mkdirSync(join(home, "agent-factory"), { recursive: true });
      writeFileSync(join(home, "agent-factory", "USER.md"), "a file the user keeps beside the repository\n");
      const target = join(home, "agent-factory", "sub");
      userRepo(target);
      return { target, grugopsHome: home };
    },
  },
  {
    name: "kit-home-in-target",
    why: "GRUGOPS_HOME lies inside the target (and does not exist yet), so the kit would be written into the repository",
    prepare: (root) => {
      const target = join(root, "repo");
      userRepo(target);
      return { target, grugopsHome: join(target, ".tools", "grugops") };
    },
  },
];

export interface RefusalVariantRun {
  readonly name: RefusalVariantName;
  readonly target: string;
  readonly grugopsHome: string;
  readonly run: Run;
  readonly targetBefore: string;
  readonly targetAfter: string;
  readonly kitHomeBefore: string;
  readonly kitHomeAfter: string;
}

/** Run one refusal variant under its own directory in `scratchRoot`, snapshotting the target and the kit home. */
export function runRefusalVariant(scratchRoot: string, spec: RefusalVariantSpec, opts: { readonly dryRun: boolean }): RefusalVariantRun {
  const root = join(scratchRoot, `refusal-${spec.name}-${opts.dryRun ? "dry" : "real"}`);
  const home = join(root, "user-home");
  mkdirSync(home, { recursive: true });
  const { target, grugopsHome } = spec.prepare(root);
  const targetBefore = snapshotTree(target);
  const kitHomeBefore = snapshotTree(grugopsHome);
  const run = runInstall(target, grugopsHome, [], { dryRun: opts.dryRun, home, timeoutMs: 120_000 });
  return { name: spec.name, target, grugopsHome, run, targetBefore, targetAfter: snapshotTree(target), kitHomeBefore, kitHomeAfter: snapshotTree(grugopsHome) };
}

export type KitHomeVariantName = "unrecorded-kit-home" | "kit-root-link";

export interface KitHomeVariantSpec {
  readonly name: KitHomeVariantName;
  readonly why: string;
  /** Plant what the user has at `<grugopsHome>/agent-factory` (the kit home exists, outside the target). */
  readonly plant: (grugopsHome: string, root: string) => void;
  /** The problems with what is left once install ran, given the one backup's path (null: there is none). */
  readonly check: (grugopsHome: string, root: string, backup: string | null) => string[];
}

const USER_KIT_NOTES = "the user's notes in a directory that happens to sit at the kit root\n";

/** A kit home outside the target holding something install did not write at the kit root (plan 33.1-37). */
export const KIT_HOME_VARIANTS: readonly KitHomeVariantSpec[] = [
  {
    name: "unrecorded-kit-home",
    why: "a GRUGOPS_HOME holding a user's agent-factory/ that no kit-home record names (every kit home written before plan 33.1-37 too)",
    plant: (grugopsHome) => {
      mkdirSync(join(grugopsHome, "agent-factory"), { recursive: true });
      writeFileSync(join(grugopsHome, "agent-factory", "MYNOTES.md"), USER_KIT_NOTES);
    },
    check: (_grugopsHome, _root, backup) => {
      if (backup === null) return ["no backup was made of the user's agent-factory/"];
      const notes = join(backup, "MYNOTES.md");
      return existsSync(notes) && readFileSync(notes, "utf8") === USER_KIT_NOTES ? [] : [`${notes} is not the user's file byte for byte`];
    },
  },
  {
    name: "kit-root-link",
    why: "a symbolic link at the kit root, pointing at a directory of the user's; it is renamed as a name, never followed",
    plant: (grugopsHome, root) => {
      const elsewhere = join(root, "users-directory");
      mkdirSync(elsewhere, { recursive: true });
      writeFileSync(join(elsewhere, "MYNOTES.md"), USER_KIT_NOTES);
      mkdirSync(grugopsHome, { recursive: true });
      symlinkSync(elsewhere, join(grugopsHome, "agent-factory"));
    },
    check: (_grugopsHome, root, backup) => {
      const elsewhere = join(root, "users-directory");
      const out: string[] = [];
      if (backup === null) out.push("no backup was made of the link");
      else if (!lstatSync(backup).isSymbolicLink() || readlinkSync(backup) !== elsewhere) out.push(`${backup} is not the user's link`);
      if (readFileSync(join(elsewhere, "MYNOTES.md"), "utf8") !== USER_KIT_NOTES) out.push("the directory the link pointed at changed");
      return out;
    },
  },
];

export interface KitHomeVariantRun {
  readonly name: KitHomeVariantName;
  readonly grugopsHome: string;
  readonly run: Run;
  /** The `agent-factory.bak.<ISO>` names in the kit home after the run. */
  readonly backups: readonly string[];
  /** The kit-home record after the run, parsed, or null. */
  readonly record: { readonly grugopsHome: unknown; readonly ledger: ReadonlyArray<Record<string, unknown>> } | null;
  /** The variant's own check, plus: the record names the one backup (origin kit-home, of agent-factory). */
  readonly problems: readonly string[];
}

/** Run one kit-home variant: plant, install into a target outside the kit home, check what survived. */
export function runKitHomeVariant(scratchRoot: string, spec: KitHomeVariantSpec): KitHomeVariantRun {
  const root = join(scratchRoot, `kithome-${spec.name}`);
  const home = join(root, "user-home");
  const target = join(root, "repo");
  const grugopsHome = join(home, ".grugops");
  mkdirSync(home, { recursive: true });
  mkdirSync(target, { recursive: true });
  spec.plant(grugopsHome, root);
  const run = runInstall(target, grugopsHome, [], { home, timeoutMs: 180_000 });
  const backups = existsSync(grugopsHome) ? readdirSync(grugopsHome).filter((n) => n.startsWith("agent-factory.bak.")).sort() : [];
  const backup = backups.length === 1 ? join(grugopsHome, backups[0]) : null;
  const problems = [...spec.check(grugopsHome, root, backup)];
  if (backups.length !== 1) problems.push(`expected one backup, found ${backups.length}: ${backups.join(", ")}`);
  let record: KitHomeVariantRun["record"] = null;
  try {
    record = JSON.parse(readFileSync(join(grugopsHome, ".grugops-kit.json"), "utf8")) as NonNullable<KitHomeVariantRun["record"]>;
  } catch {
    problems.push("the kit-home record could not be read");
  }
  if (record !== null && backups.length === 1) {
    const named = record.ledger.filter((e) => e.kind === "backup" && e.path === backups[0] && e.origin === "kit-home" && e.of === "agent-factory");
    if (named.length !== 1) problems.push(`the kit-home record does not name the backup ${backups[0]}: ${JSON.stringify(record.ledger)}`);
  }
  return { name: spec.name, grugopsHome, run, backups, record, problems };
}

// ── THE UNINSTALL-SOURCE AXIS (plan 33.1-38, review WR-01 and IN-06) ────────────────────────────────

export type UninstallSourceVariantName = "empty-source" | "unreadable-source" | "other-checkout-symlink";

export interface UninstallSourceVariantSpec {
  readonly name: UninstallSourceVariantName;
  readonly why: string;
  /** The install's extra arguments (after --yes); the install always runs from this repository. */
  readonly installArgs: readonly string[];
  /** Make the GRUGOPS_SRC the uninstall runs with, under `root`. It is never the checkout install ran from. */
  readonly source: (root: string) => string;
}

/**
 * The kit sources uninstall is run with after an install from this repository (plan 33.1-38). In each one
 * the uninstalling source does not hold what install wrote, so only the install ledger can say what to
 * remove.
 */
export const UNINSTALL_SOURCE_VARIANTS: readonly UninstallSourceVariantSpec[] = [
  {
    name: "empty-source",
    why: "an empty directory: the uninstalling checkout ships nothing, so no kit source names any recorded file",
    installArgs: [],
    source: (root) => {
      const d = join(root, "empty-source");
      mkdirSync(d, { recursive: true });
      return d;
    },
  },
  {
    name: "unreadable-source",
    why: "a regular file where the kit source should be: no kit directory can be read at all",
    installArgs: [],
    source: (root) => {
      mkdirSync(root, { recursive: true });
      const f = join(root, "not-a-kit-source");
      writeFileSync(f, "not a grugops kit source\n");
      return f;
    },
  },
  {
    name: "other-checkout-symlink",
    why:
      "--symlink install from this repository, uninstalled from another checkout (a copy of the kit's .claude/ and " +
      "AGENTS.md elsewhere), so no link install made points at the uninstalling source",
    installArgs: ["--symlink"],
    source: (root) => {
      const d = join(root, "other-checkout");
      mkdirSync(d, { recursive: true });
      cpSync(join(REPO_ROOT, ".claude", "agents"), join(d, ".claude", "agents"), { recursive: true });
      cpSync(join(REPO_ROOT, ".claude", "skills"), join(d, ".claude", "skills"), { recursive: true });
      cpSync(join(REPO_ROOT, "AGENTS.md"), join(d, "AGENTS.md"));
      return d;
    },
  },
];

/** Uninstall `target` with the kit source at `src` (plan 33.1-38): the cross-version, cross-checkout axis. */
export const runUninstallWithSource = (target: string, grugopsHome: string, src: string, opts: RunOptions = {}): Run =>
  spawnBin(UNINSTALL_JS, [], target, grugopsHome, { ...opts, src });

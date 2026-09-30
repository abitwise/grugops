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
// Clear professional voice: this is test infrastructure for a safety surface.
//
// A `.test-support.ts` module is excluded from emit (tsconfig.json), type-checked by
// tsconfig.tests.json, and counted in NON_TEST_MODULE_COUNT (scripts/check-foundation-guards.test.ts).

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, readlinkSync, writeFileSync } from "node:fs";
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
}

/**
 * Run a committed installer binary against `target` with the kit home at `grugopsHome`. Copy mode
 * unless `args` says `--symlink`; GRUGOPS_SRC is this repository.
 */
export function spawnBin(bin: string, args: readonly string[], target: string, grugopsHome: string, opts: RunOptions = {}): Run {
  const env: NodeJS.ProcessEnv = { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: grugopsHome, TARGET: target };
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

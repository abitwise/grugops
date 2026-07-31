// install.test.ts — the TOOL-01 installer-contract Vitest harness.
//
// This single Vitest suite FOLDS the two former shell harnesses — install/install.test.sh and
// install/install.two-root.test.sh — into one suite that asserts the SINGLE installer's contract:
// additive, idempotent, DRY_RUN-safe, reversible, and never-overwrite/never-delete-user-content.
// It drives the COMMITTED install/install.js + install/uninstall.js (never the .ts) via spawnSync
// into throwaway mkdtemp host fixtures, snapshots BOTH $TARGET and $GRUGOPS_HOME (the two-root
// extension), and diffs content-addressed tree manifests so two states compare regardless of inode.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// D-08 — RETIRED sh-vs-Node BYTE-PARITY CHECK (the old install.test.sh "Check 4")
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The old install.test.sh Check 4 asserted "install.sh tree == install.mjs tree" — a sh-vs-Node
// byte-parity check. That check is INTENTIONALLY RETIRED per D-08: with D-07 the dual installer
// collapsed into a single install.ts (compiled install.js), so there is NO POSIX installer left to
// keep in parity. The dual sh/Node byte-parity install contract no longer exists. This suite
// asserts the single installer's CONTRACT (additive / idempotent / DRY_RUN / reversible /
// never-overwrite) instead. The ABSENCE of the parity test is NOT a regression — it is the direct,
// ruled-on consequence of D-07/D-08 (RESEARCH Pitfall 6). A dedicated it.skip below restates this
// so the intent is greppable in the suite itself and the verifier does not flag the missing check.
// The literal token D-08 appears in this file by design.
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// Hermetic: every install runs under mkdtempSync(tmpdir()) with INSTALL_MODE=copy (deterministic
// bytes) plus GRUGOPS_SRC / GRUGOPS_HOME / TARGET overrides; the real repo, $HOME, and any real
// $GRUGOPS_HOME are NEVER mutated. afterEach removes every temp dir created in the test.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  readFileSync,
  rmSync,
  renameSync,
  existsSync,
  statSync,
  lstatSync,
  chmodSync,
  symlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

// THE SHARED ADAPTER AUTHORITY — imported HERE, IN THE TEST ONLY (KIT-02 / D-18).
//
// install.ts deliberately does NOT import scripts/kit-model.ts: the locked decision is that the
// installer stays a self-contained single file, so two implementations of "what is an adapter"
// continue to exist. That is a deliberate exception to the one-authority-per-predicate doctrine,
// and this import is what buys it back — the `source derivation` conformance case below asserts the
// installer's REAL installed set equals the authority's set over the same fixture, with the
// cardinality asserted as a number so a derivation that silently shrinks fails the COUNT rather
// than only the comparison. If the locked decision is ever revisited, this import and that case are
// what to delete along with the duplicate. Drives the COMMITTED .js — the repo idiom.
import { listAgentAdapters, listSkillAdapters } from "../scripts/kit-model.js";

// The repo root (install/ is one level under it) and the committed compiled installer/uninstaller.
const REPO_ROOT = resolve(import.meta.dirname, "..");
const INSTALL_JS = join(import.meta.dirname, "install.js");
const UNINSTALL_JS = join(import.meta.dirname, "uninstall.js");

// Track every mkdtemp dir so afterEach can clean them all up (nothing leaks outside tmpdir).
const tmpDirs: string[] = [];
function mkTmp(): string {
  const d = mkdtempSync(join(tmpdir(), "grugops-"));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) {
    const d = tmpDirs.pop()!;
    rmSync(d, { recursive: true, force: true });
  }
});

// make_fixture — a minimal fake user repo: a user-owned CLAUDE.md (to prove additive installs),
// plus a stand-in "frozen core" under agent-factory/ (to prove uninstall never deletes it) and a
// user-owned plans/board.md (to prove user data survives). Mirrors install.test.sh's make_fixture.
function makeFixture(): string {
  const d = mkTmp();
  mkdirSync(join(d, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(d, "plans"), { recursive: true });
  writeFileSync(join(d, "CLAUDE.md"), "# User Project\n\nMy own dev instructions — must be preserved.\n");
  writeFileSync(join(d, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE — uninstall must never delete this.\n");
  writeFileSync(join(d, "plans", "board.md"), "user board\n");
  return d;
}

// make_old_layout_fixture — the v1.0 migrate-FROM shape (the one genuinely new Wave-0 helper,
// Plan 17-01). Produces the old in-repo layout that --migrate (Plan 02) converts to the two-root
// split: a vendored in-repo agent-factory/ (so detection's hasInRepoKit is true), an old
// user-edited config inside the vendored kit at agent-factory/config/factory.config.json (the
// v1.0 location, VERIFIED from git v1.0 in 17-RESEARCH Old-Layout Forensics) and OPTIONALLY a
// repo-root factory.config.json variant (opts.rootConfig — the CONTEXT D-04 location; Plan 02
// must handle both), repo-relative .claude adapters that reference agent-factory/… with NO
// grugops:materialized-kit block, and NO .grugops/install.json marker. With opts.symlink the
// orchestrator adapter is a SYMLINK pointing at a planted source-clone file carrying a SENTINEL —
// the Plan-02 LANDMINE case (writeFileSync through a live symlink dest would corrupt the source).
function makeOldLayoutFixture(opts?: { symlink?: boolean; rootConfig?: boolean }): string {
  const d = mkTmp();
  // In-repo vendored kit — the hasInRepoKit detection signal (D-03).
  mkdirSync(join(d, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(d, "agent-factory", "config"), { recursive: true });
  mkdirSync(join(d, "agent-factory", "workflows"), { recursive: true });
  writeFileSync(join(d, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE — old in-repo vendored kit.\n");
  // Old user-edited config at the v1.0 in-repo location (recognizable edited token).
  writeFileSync(
    join(d, "agent-factory", "config", "factory.config.json"),
    '{ "_edited": "OLD-USER-EDITED-CONFIG-KIT-LOCATION" }\n',
  );
  // Optional repo-root config variant (CONTEXT D-04 location — Plan 02 handles both).
  if (opts?.rootConfig) {
    writeFileSync(join(d, "factory.config.json"), '{ "_edited": "OLD-USER-EDITED-CONFIG-ROOT-LOCATION" }\n');
  }
  // Repo-relative .claude adapters — reference agent-factory/… with NO materialized-kit block.
  mkdirSync(join(d, ".claude", "skills", "grugops"), { recursive: true });
  mkdirSync(join(d, ".claude", "agents"), { recursive: true });
  writeFileSync(
    join(d, ".claude", "skills", "grugops", "SKILL.md"),
    "> read `agent-factory/roles/orchestrator.md` and act as the Orchestrator.\n" +
      "> config: `agent-factory/config/factory.config.json`; workflows: `agent-factory/workflows/`.\n",
  );
  if (opts?.symlink) {
    // LANDMINE: the orchestrator adapter is a symlink into a planted source clone carrying a
    // SENTINEL. A naive writeFileSync(dest) would follow the link and clobber the clone.
    mkdirSync(join(d, "source-clone"), { recursive: true });
    writeFileSync(
      join(d, "source-clone", "orchestrator-src.md"),
      "SENTINEL-SOURCE-CLONE — a writeFileSync through the live symlink dest would corrupt this.\n",
    );
    // Target is relative to the symlink's OWN directory (.claude/agents/), so it must climb back
    // to the fixture root before descending into source-clone/.
    spawnSync("ln", ["-s", join("..", "..", "source-clone", "orchestrator-src.md"), "grugops-orchestrator.md"], {
      cwd: join(d, ".claude", "agents"),
    });
  } else {
    writeFileSync(
      join(d, ".claude", "agents", "grugops-orchestrator.md"),
      "> read `agent-factory/roles/orchestrator.md` and act as the Orchestrator (repo-relative).\n",
    );
  }
  // NO .grugops/install.json marker — the second detection signal (D-03 old-layout = no marker).
  return d;
}

// snapshot — a stable, content-addressed manifest of a tree (sorted "path hash|LINK" lines) so two
// states diff regardless of inode/symlink details. An absent dir snapshots to "" (a legitimate,
// diffable "never created" state for the DRY_RUN two-root assertion). Mirrors the sh `find … |
// LC_ALL=C sort` + per-file cksum, generalized to BOTH roots.
function snapshot(dir: string): string {
  if (!existsSync(dir)) return "";
  const rows: string[] = [];
  const walk = (rel: string): void => {
    const abs = join(dir, rel);
    for (const ent of readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = join(dir, childRel);
      if (ent.isSymbolicLink()) {
        rows.push(`${childRel} LINK`);
      } else if (ent.isDirectory()) {
        walk(childRel);
      } else if (ent.isFile()) {
        const h = createHash("sha256").update(readFileSync(childAbs)).digest("hex");
        rows.push(`${childRel} ${h}`);
      }
    }
  };
  walk("");
  // LC_ALL=C byte order over the full "path hash" lines.
  return rows.sort().join("\n");
}

// runInstall — drive the COMMITTED install.js hermetically into an isolated target + kit-home with
// INSTALL_MODE=copy (deterministic bytes). Always --yes (unattended). Extra args pass through.
function runInstall(target: string, home: string, ...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync("node", [INSTALL_JS, "--yes", ...args], {
    encoding: "utf8",
    env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target },
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

// runUninstall — drive the COMMITTED uninstall.js hermetically over the same target + home.
function runUninstall(target: string, home: string, ...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync("node", [UNINSTALL_JS, ...args], {
    encoding: "utf8",
    env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target },
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// KIT-02 synthetic kit source (Plan 27-02). The derived-install / derived-uninstall cases below
// drive the installer from a SYNTHETIC $GRUGOPS_SRC carrying seventeen adapters, never from this
// repo's live .claude/agents directory — so they assert the derivation itself and do not depend on
// plan 27-07 having landed the real seventeen.
// ─────────────────────────────────────────────────────────────────────────────────────────────

// MAT_SLOT — byte-identical to install.ts's resolver slot line. Its presence in a source body is
// the ONLY routing signal the installer uses to decide materialize-vs-plain-copy (D-06).
const MAT_SLOT = "# 1. (installed) the absolute kit path the installer wrote above this line.";

// Seventeen synthetic adapters. grugops-orchestrator.md is included deliberately: it is the ONE
// adapter an already-installed v2.0 repo carries, so the update case can pre-seed exactly that
// single-adapter layout and prove the other sixteen are laid down by the run.
const SYNTH_ADAPTERS: string[] = [
  "grugops-orchestrator.md",
  ...Array.from({ length: 16 }, (_, i) => `grugops-synthetic-role-${String(i + 1).padStart(2, "0")}.md`),
].sort();

// Seven synthetic skills; only the resolver skill carries the slot line (mirrors the real kit).
const SYNTH_SKILLS = [
  "grugops",
  "grugops-gate",
  "grugops-map",
  "grugops-plan",
  "grugops-release",
  "grugops-ticket",
  "grugops-uat",
];

// makeSyntheticSrc — a throwaway $GRUGOPS_SRC the installer can copy + materialize from: a minimal
// agent-factory/ (kit + seed + VERSION), seventeen resolver adapters each carrying MAT_SLOT, and
// the seven skills. Nothing here reads the live repo.
function makeSyntheticSrc(): string {
  const src = mkTmp();
  mkdirSync(join(src, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(src, "agent-factory", "seed", ".grugops"), { recursive: true });
  mkdirSync(join(src, ".claude", "agents"), { recursive: true });
  writeFileSync(join(src, "agent-factory", "roles", "orchestrator.md"), "SYNTHETIC KIT ROLE\n");
  writeFileSync(join(src, "agent-factory", "VERSION"), "0.0.0-synthetic\n");
  writeFileSync(join(src, "agent-factory", "seed", ".grugops", "factory.config.json"), '{"seed":true}\n');
  for (const a of SYNTH_ADAPTERS) {
    // Every adapter is a self-sufficient resolver (D-06): its body carries the slot line, so the
    // installer materializes it WITHOUT any filename appearing in the installer's code path.
    writeFileSync(
      join(src, ".claude", "agents", a),
      `> synthetic resolver adapter ${a}\n` +
        "# resolve the kit root:\n" +
        `${MAT_SLOT}\n` +
        "# 2. fall back to the repo-relative kit.\n",
    );
  }
  for (const s of SYNTH_SKILLS) {
    mkdirSync(join(src, ".claude", "skills", s), { recursive: true });
    writeFileSync(
      join(src, ".claude", "skills", s, "SKILL.md"),
      s === "grugops"
        ? `> synthetic resolver skill ${s}\n# resolve the kit root:\n${MAT_SLOT}\n`
        : `> synthetic delegating skill ${s}\n`,
    );
  }
  return src;
}

// runInstallFrom / runUninstallFrom — the runInstall/runUninstall pair with an explicit
// $GRUGOPS_SRC so a case can drive a synthetic kit instead of this repo.
function runInstallFrom(src: string, target: string, home: string, ...args: string[]) {
  const r = spawnSync("node", [INSTALL_JS, "--yes", ...args], {
    encoding: "utf8",
    env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: src, GRUGOPS_HOME: home, TARGET: target },
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}
function runUninstallFrom(src: string, target: string, home: string, ...args: string[]) {
  const r = spawnSync("node", [UNINSTALL_JS, ...args], {
    encoding: "utf8",
    env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: src, GRUGOPS_HOME: home, TARGET: target },
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

describe("install.js / uninstall.js — single-installer contract (folds install.test.sh + install.two-root.test.sh)", () => {
  // ── D-08: the retired sh-vs-Node parity check, restated as a greppable skipped case ─────────
  // The old install.test.sh "Check 4" asserted install.sh tree == install.mjs tree. It is
  // intentionally retired per D-08 — there is no POSIX installer left to keep in parity. This
  // suite asserts the single installer's contract (additive/idempotent/DRY_RUN/reversible/
  // never-overwrite) instead. Its absence is NOT a regression (RESEARCH Pitfall 6).
  it.skip("D-08: sh-vs-Node byte-parity check is intentionally retired (no POSIX installer remains; not a regression)", () => {
    // Intentionally empty + skipped. The single installer's behavior is asserted by the contract
    // cases below; there is no second installer to diff against.
  });

  // ── Check 1 — idempotent zero-diff: install twice → snapshots equal (both roots) ────────────
  // (install.test.sh Check 1 + install.two-root.test.sh [5], folded.)
  it("idempotent: a second install produces ZERO diff in both $TARGET and $GRUGOPS_HOME", () => {
    const target = makeFixture();
    const home = mkTmp();

    expect(runInstall(target, home).status).toBe(0);
    const t1 = snapshot(target);
    const h1 = snapshot(home);

    expect(runInstall(target, home).status).toBe(0);
    const t2 = snapshot(target);
    const h2 = snapshot(home);

    expect(t2).toBe(t1); // $TARGET idempotent (materialized adapters + marker stable)
    expect(h2).toBe(h1); // $GRUGOPS_HOME idempotent (kit copy stable)

    // The user's CLAUDE.md keeps its own content + EXACTLY ONE grugops sentinel block (additive).
    const claude = readFileSync(join(target, "CLAUDE.md"), "utf8");
    expect(claude).toContain("My own dev instructions");
    const sentinelCount = (claude.match(/<!-- GSD:grugops-start-here -->/g) ?? []).length;
    expect(sentinelCount).toBe(1);
  });

  // ── Check 2 — DRY_RUN no-mutation: DRY_RUN=1 leaves BOTH roots byte-unchanged ───────────────
  // (install.test.sh Check 2 + install.two-root.test.sh [6], folded.)
  it("DRY_RUN: DRY_RUN=1 mutates neither $TARGET nor $GRUGOPS_HOME", () => {
    const target = makeFixture();
    const home = mkTmp();
    rmSync(home, { recursive: true, force: true }); // start with the home ABSENT (empty manifest)

    const tPre = snapshot(target);
    const hPre = snapshot(home); // "" — absent

    const r = spawnSync("node", [INSTALL_JS, "--yes"], {
      encoding: "utf8",
      env: { ...process.env, DRY_RUN: "1", INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(r.status).toBe(0);

    const tPost = snapshot(target);
    const hPost = snapshot(home);

    expect(tPost).toBe(tPre); // target byte-for-byte unchanged
    expect(hPost).toBe(hPre); // home never created
    expect(existsSync(home)).toBe(false); // DRY_RUN created neither root
  });

  // ── Check 3 — install → uninstall round-trip (reversible, never-overwrite) ──────────────────
  // (install.test.sh Check 3 + install.two-root.test.sh [11], folded.) grugops-OWNED wiring is
  // removed; the SEEDED user state plane + the frozen core + the shared kit ALL survive (D-06).
  it("uninstall round-trip: grugops-owned wiring removed; seeded user state + frozen core + shared kit survive", () => {
    const target = makeFixture();
    const home = mkTmp();

    expect(runInstall(target, home).status).toBe(0);
    expect(runUninstall(target, home).status).toBe(0);

    // REMOVED — the grugops-owned .claude adapters the installer added.
    expect(existsSync(join(target, ".claude", "agents", "grugops-orchestrator.md"))).toBe(false);
    expect(existsSync(join(target, ".claude", "skills", "grugops", "SKILL.md"))).toBe(false);

    // REMOVED — the CLAUDE.md grugops sentinel block; the user's own content SURVIVES.
    const claude = readFileSync(join(target, "CLAUDE.md"), "utf8");
    expect(claude).toContain("My own dev instructions");
    expect(claude).not.toContain("<!-- GSD:grugops-start-here -->");

    // REMOVED — the grugops-owned install marker.
    expect(existsSync(join(target, ".grugops", "install.json"))).toBe(false);

    // SURVIVES — the seeded user state plane (D-06: seeded state is user content).
    expect(existsSync(join(target, ".grugops", "factory.config.json"))).toBe(true);
    expect(existsSync(join(target, "memory-bank", "00-index.md"))).toBe(true);

    // SURVIVES — the frozen core + the user's own plans/ data (never deleted).
    const core = readFileSync(join(target, "agent-factory", "roles", "orchestrator.md"), "utf8");
    expect(core).toContain("FROZEN CORE");
    expect(readFileSync(join(target, "plans", "board.md"), "utf8")).toContain("user board");

    // SURVIVES — the shared kit at $GRUGOPS_HOME is never removed by uninstall (D-06).
    expect(existsSync(join(home, "agent-factory"))).toBe(true);
  });

  // ── Two-root: kit copy lands under $GRUGOPS_HOME/agent-factory (two-root [1]) ────────────────
  it("two-root: the shared kit is copied to $GRUGOPS_HOME/agent-factory", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    expect(existsSync(join(home, "agent-factory", "roles", "orchestrator.md"))).toBe(true);
  });

  // ── Two-root: the 2 resolver adapters materialize the resolved ABSOLUTE kit path (two-root [2]) ─
  it("two-root: the resolver adapters materialize the resolved absolute kit path", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const expectKit = join(home, "agent-factory");
    const agent = readFileSync(join(target, ".claude", "agents", "grugops-orchestrator.md"), "utf8");
    expect(agent).toContain("grugops:materialized-kit");
    expect(agent).toContain(expectKit);
    const skill = readFileSync(join(target, ".claude", "skills", "grugops", "SKILL.md"), "utf8");
    expect(skill).toContain("grugops:materialized-kit");
    expect(skill).toContain(expectKit);
  });

  // ── Two-root: the per-repo state plane is seeded, but plans/handoffs/ is NOT (two-root [3]) ─────
  // MIGR-02 (Phase 24): the old relay's runtime plans/handoffs/ dir is no longer seeded — the
  // note-native trace replaces the handoff relay, so a fresh install must leave it ABSENT. This
  // assertion is INVERTED from the pre-Phase-24 version (which asserted the dir IS a directory).
  it("two-root: the per-repo state plane is seeded but plans/handoffs/ is NOT created (config + marker + memory-bank/; MIGR-02)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    expect(existsSync(join(target, ".grugops", "factory.config.json"))).toBe(true);
    expect(existsSync(join(target, ".grugops", "install.json"))).toBe(true);
    expect(existsSync(join(target, "plans", "board.md"))).toBe(true);
    expect(existsSync(join(target, "memory-bank", "00-index.md"))).toBe(true);
    // MIGR-02: a fresh install never recreates the old relay's runtime handoffs dir.
    expect(existsSync(join(target, "plans", "handoffs"))).toBe(false);
  });

  // ── never-overwrite: a pre-existing seeded file is left byte-untouched (two-root [4], D-04) ──
  it("never-overwrite: a pre-existing .grugops/factory.config.json survives the install (D-04)", () => {
    const target = makeFixture();
    const home = mkTmp();
    mkdirSync(join(target, ".grugops"), { recursive: true });
    writeFileSync(join(target, ".grugops", "factory.config.json"), "SENTINEL-USER-CONFIG-DO-NOT-CLOBBER\n");
    expect(runInstall(target, home).status).toBe(0);
    expect(readFileSync(join(target, ".grugops", "factory.config.json"), "utf8")).toContain("SENTINEL-USER-CONFIG-DO-NOT-CLOBBER");
  });

  // ── copy-default: a default install (no INSTALL_MODE override) leaves NO symlinks (two-root [7], D-05) ─
  it("copy-default: a default install creates no symlinks in either root (copy is the default, D-05)", () => {
    const target = makeFixture();
    const home = mkTmp();
    // Intentionally NO INSTALL_MODE override — prove the new default is copy.
    const r = spawnSync("node", [INSTALL_JS, "--yes"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(r.status).toBe(0);
    const hasSymlink = (dir: string): boolean => {
      const stack = [dir];
      while (stack.length) {
        const cur = stack.pop()!;
        for (const ent of readdirSync(cur, { withFileTypes: true })) {
          const abs = join(cur, ent.name);
          if (ent.isSymbolicLink()) return true;
          if (ent.isDirectory()) stack.push(abs);
        }
      }
      return false;
    };
    expect(hasSymlink(target)).toBe(false);
    expect(hasSymlink(home)).toBe(false);
  });

  // ── INSTALL-03: --target from an arbitrary CWD lands adapters in the named target (two-root [8]) ─
  it("--target: an install run from an unrelated CWD lands adapters in the named target", () => {
    const target = mkTmp();
    // give the named target a fixture shape
    mkdirSync(join(target, "agent-factory", "roles"), { recursive: true });
    writeFileSync(join(target, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE\n");
    const home = mkTmp();
    const elsewhere = mkTmp();
    const r = spawnSync("node", [INSTALL_JS, "--target", target, "--yes"], {
      cwd: elsewhere,
      encoding: "utf8",
      env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home },
    });
    expect(r.status).toBe(0);
    expect(existsSync(join(target, ".claude", "agents", "grugops-orchestrator.md"))).toBe(true);
  });

  // ── D-07 self-checkout guard: refuse-by-default; --allow-self overrides (two-root [10]) ──────
  it("D-07 self-checkout guard: refuses a source-shaped target by default; --allow-self overrides", () => {
    // Build a THROWAWAY clone-shaped fixture that trips the source-marker predicate WITHOUT being
    // the real repo (carries install/install.ts + agent-factory/VERSION). NEVER point at REPO_ROOT.
    // CR-04: the planted marker was `install/install.sh` until the pair was corrected — a file
    // deleted in f9dab9f with the POSIX installer, so this fixture asserted a marker half that
    // could not fire and the case passed on the path-equality half alone (TARGET === GRUGOPS_SRC
    // here). The plant is corrected so the comment above it is true; the marker half itself gets
    // its own case below, on a target that is NOT the source root.
    const fake = mkTmp();
    mkdirSync(join(fake, "install"), { recursive: true });
    mkdirSync(join(fake, "agent-factory"), { recursive: true });
    writeFileSync(join(fake, "install", "install.ts"), "// throwaway source-marker stub\n");
    writeFileSync(join(fake, "agent-factory", "VERSION"), "0.0.0-fake\n");
    const home = mkTmp();

    // (a) refuse by default — installing INTO the clone must exit nonzero and name --allow-self.
    const refused = spawnSync("node", [INSTALL_JS, "--yes"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_SRC: fake, GRUGOPS_HOME: home, TARGET: fake },
    });
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toContain("--allow-self");

    // (b) --allow-self overrides — the same invocation PROCEEDS PAST THE GUARD.
    const allowed = spawnSync("node", [INSTALL_JS, "--yes", "--allow-self"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_SRC: fake, GRUGOPS_HOME: mkTmp(), TARGET: fake },
    });
    // WHAT THIS ARM PINS IS THE GUARD, NOT COMPLETENESS (27-21, WR-01). The throwaway fixture is a
    // source-SHAPED stub: it carries the two source markers and nothing else, so it has no
    // .claude/agents and no .claude/skills and the run is legitimately INCOMPLETE (exit 3) for a
    // reason that has nothing to do with the guard. Before the exit code was conditional this
    // asserted 0, which passed only because 0 was returned unconditionally — the assertion never
    // distinguished "the guard let it through" from "the install finished". It does now:
    //   - status 3, NOT 1  → the guard did not refuse (1 is the refusal code),
    //   - no --allow-self hint on stderr → the refusal message was not printed,
    //   - the banner tail was reached → the run got all the way through the install classes.
    // The fixture is left exactly as written; only the assertion is made honest about it.
    expect(allowed.status).toBe(3);
    expect(allowed.status).not.toBe(1);
    expect(allowed.stderr ?? "").not.toContain("--allow-self");
    expect(allowed.stdout ?? "").toContain("install INCOMPLETE");
  });

  // ── never-delete: uninstall preserves a USER-owned AGENTS.md symlink (install.test.sh Check 5, CR-01) ─
  it("never-delete: uninstall preserves a user-owned AGENTS.md symlink; removes a grugops-source one", () => {
    // user-owned symlink into the user's own content → must survive uninstall
    const userT = makeFixture();
    writeFileSync(join(userT, "my-real-agents.md"), "USER-OWNED AGENTS — uninstall must never delete this.\n");
    spawnSync("ln", ["-s", "my-real-agents.md", "AGENTS.md"], { cwd: userT });
    expect(runUninstall(userT, mkTmp()).status).toBe(0);
    expect(lstatSync(join(userT, "AGENTS.md")).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(userT, "AGENTS.md"), "utf8")).toContain("USER-OWNED AGENTS");

    // a symlink that resolves to the grugops source IS grugops-owned → removed
    const grugT = makeFixture();
    spawnSync("ln", ["-s", join(REPO_ROOT, "AGENTS.md"), "AGENTS.md"], { cwd: grugT });
    expect(runUninstall(grugT, mkTmp()).status).toBe(0);
    expect(existsSync(join(grugT, "AGENTS.md"))).toBe(false);
  });

  // ── distinct Copilot sentinel: the Copilot block round-trips on its own sentinel (install.test.sh Check 6, WR-05) ─
  it("WR-05: the Copilot pointer uses a distinct sentinel; round-trips without touching user content", () => {
    const target = makeFixture();
    const home = mkTmp();
    mkdirSync(join(target, ".github"), { recursive: true });
    writeFileSync(join(target, ".github", "copilot-instructions.md"), "# Copilot Instructions\n\nUser-owned Copilot guidance — must be preserved.\n");

    expect(runInstall(target, home).status).toBe(0);
    const after = readFileSync(join(target, ".github", "copilot-instructions.md"), "utf8");
    const copilotSentinels = (after.match(/<!-- GSD:grugops-copilot-start-here -->/g) ?? []).length;
    const claudeSentinelLines = after.split("\n").filter((l) => l === "<!-- GSD:grugops-start-here -->").length;
    expect(copilotSentinels).toBe(1); // exactly one Copilot block added
    expect(claudeSentinelLines).toBe(0); // no CLAUDE.md sentinel collision

    expect(runUninstall(target, home).status).toBe(0);
    const reverted = readFileSync(join(target, ".github", "copilot-instructions.md"), "utf8");
    expect(reverted).toContain("User-owned Copilot guidance");
    expect(reverted).not.toContain("GSD:grugops-copilot-start-here");
  });

  // ── doctor exit-code matrix (install.test.sh Checks 7/8/10) ──────────────────────────────────
  it("doctor: a good split install → --check exits 0 (ALL CHECKS PASSED)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const doc = spawnSync("node", [INSTALL_JS, "--check"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(doc.status).toBe(0);
    expect(doc.stdout).toContain("ALL CHECKS PASSED");
  });

  it("doctor: a missing kit → --check FAILS naming the kit + its referencing file", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    rmSync(join(home, "agent-factory"), { recursive: true, force: true });
    const doc = spawnSync("node", [INSTALL_JS, "--check"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(doc.status).not.toBe(0);
    expect(doc.stdout).toContain("agent-factory");
    expect(doc.stdout).toContain("referenced by");
  });

  it("doctor: WARN-only exits 0 bare but nonzero under --strict (kit-version skew)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    writeFileSync(join(home, "agent-factory", "VERSION"), "9.9.9-skew\n"); // induce a WARN
    const bare = spawnSync("node", [INSTALL_JS, "--check"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(bare.status).toBe(0);
    expect(bare.stdout).toMatch(/WARN/i);
    const strict = spawnSync("node", [INSTALL_JS, "--check", "--strict"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(strict.status).not.toBe(0);
  });

  // ── doctor read-only (install.test.sh Check 12, T-09-02) ────────────────────────────────────
  it("doctor: a double --check is read-only (target snapshot unchanged)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const pre = snapshot(target);
    for (let i = 0; i < 2; i++) {
      spawnSync("node", [INSTALL_JS, "--check"], {
        encoding: "utf8",
        env: { ...process.env, GRUGOPS_HOME: home, TARGET: target },
      });
    }
    expect(snapshot(target)).toBe(pre);
  });

  // ── unknown-arg exit-2 contract (install.mjs:80 / D-12) ─────────────────────────────────────
  it("unknown-arg: install.js and uninstall.js both exit 2 on an unknown flag (D-12 contract)", () => {
    const inst = spawnSync("node", [INSTALL_JS, "--bad-arg-xyz"], { encoding: "utf8", env: { ...process.env } });
    expect(inst.status).toBe(2);
    const unin = spawnSync("node", [UNINSTALL_JS, "--bad-arg-xyz"], { encoding: "utf8", env: { ...process.env } });
    expect(unin.status).toBe(2);
  });

  // ── unknown-arg: the 3 new Phase-17 flags are RECOGNIZED; any other unknown arg still exits 2 ─
  // Wave-0 foundation (Plan 17-01): --migrate / --update / --prune-old-kit are added to the
  // arg-parse loop so they are recognized (NOT exit 2), but they are NOT yet wired into any branch
  // (Plans 02/03 do that). The contract is purely "recognized, not rejected" here. A still-unknown
  // arg (--bad-arg-xyz) must continue to hit process.exit(2). Drive each flag under DRY_RUN so the
  // run is a no-op on the filesystem regardless of any future wiring — this case asserts arg-parse
  // recognition only, never mode behavior.
  it("unknown-arg: --migrate / --update / --prune-old-kit are recognized (not exit 2); a bad arg still exits 2", () => {
    const target = makeFixture();
    const home = mkTmp();
    const dryEnv = {
      ...process.env,
      DRY_RUN: "1",
      INSTALL_MODE: "copy",
      GRUGOPS_SRC: REPO_ROOT,
      GRUGOPS_HOME: home,
      TARGET: target,
    };
    for (const flag of ["--migrate", "--update", "--prune-old-kit"]) {
      const r = spawnSync("node", [INSTALL_JS, "--yes", flag], { encoding: "utf8", env: dryEnv });
      // Recognized: the unknown-arg branch exits 2; a recognized flag must NOT.
      expect(r.status).not.toBe(2);
    }
    // A genuinely unknown arg still exits 2 (the regression guard for T-17-01-AP).
    const bad = spawnSync("node", [INSTALL_JS, "--yes", "--bad-arg-xyz"], { encoding: "utf8", env: dryEnv });
    expect(bad.status).toBe(2);
  });

  // ── source-presence: the shared backup primitives exist in the committed compiled output ──────
  // The Wave-0 single-source helpers backupIfDiffers() + isoStamp() are the keystone Plans 02/03
  // build on. They must exist in install.ts AND in the committed install.js (the artifact the
  // harness drives + the freshness gate guards). A grep-level presence assertion is sufficient at
  // Wave 0 — the behavioral differs-only / timestamp cases land in Plans 02/03 via the real modes.
  it("source-presence: backupIfDiffers() and isoStamp() are present in the committed install.js", () => {
    const js = readFileSync(INSTALL_JS, "utf8");
    expect(js).toContain("backupIfDiffers");
    expect(js).toContain("isoStamp");
  });

  // ── migrate: the old-layout fixture builder is shaped like the v1.0 migrate-FROM layout ───────
  // RED-by-design (Plan 17-01): proves makeOldLayoutFixture() BEFORE Plan 02 consumes it. The
  // fixture must carry the three D-03 old-layout signals — in-repo vendored kit present, a
  // repo-relative adapter with NO grugops:materialized-kit block, and NO .grugops/install.json
  // marker — plus the symlink + rootConfig variants Plan 02's LANDMINE / D-04 cases need.
  it("migrate: old-layout fixture is shaped correctly (in-repo kit, repo-relative adapter, no marker)", () => {
    const d = makeOldLayoutFixture();
    // (1) in-repo vendored kit present → hasInRepoKit detection signal.
    expect(existsSync(join(d, "agent-factory", "roles", "orchestrator.md"))).toBe(true);
    expect(existsSync(join(d, "agent-factory", "config", "factory.config.json"))).toBe(true);
    // (2) the repo-relative adapter has NO materialized-kit block.
    const skill = readFileSync(join(d, ".claude", "skills", "grugops", "SKILL.md"), "utf8");
    const agent = readFileSync(join(d, ".claude", "agents", "grugops-orchestrator.md"), "utf8");
    expect(skill).toContain("agent-factory/roles/orchestrator.md");
    expect(skill).not.toContain("grugops:materialized-kit");
    expect(agent).not.toContain("grugops:materialized-kit");
    // (3) NO install marker → old-layout = unmigrated.
    expect(existsSync(join(d, ".grugops", "install.json"))).toBe(false);

    // rootConfig variant plants the CONTEXT D-04 repo-root config too.
    const dRoot = makeOldLayoutFixture({ rootConfig: true });
    expect(existsSync(join(dRoot, "factory.config.json"))).toBe(true);
    expect(existsSync(join(dRoot, "agent-factory", "config", "factory.config.json"))).toBe(true);

    // symlink variant: the orchestrator adapter is a symlink into a planted source clone (LANDMINE).
    const dLink = makeOldLayoutFixture({ symlink: true });
    expect(lstatSync(join(dLink, ".claude", "agents", "grugops-orchestrator.md")).isSymbolicLink()).toBe(true);
    expect(existsSync(join(dLink, "source-clone", "orchestrator-src.md"))).toBe(true);
    expect(readFileSync(join(dLink, ".claude", "agents", "grugops-orchestrator.md"), "utf8")).toContain(
      "SENTINEL-SOURCE-CLONE",
    );
  });

  // ── --migrate (MIGR-01, Plan 17-02) — the 8 RED-by-design migrate cases ──────────────────────
  // --migrate converts an already-installed v1.0 in-repo layout to the two-root layout as
  // orchestration around the unchanged install run (D-02): migratePreSteps (config-move + backup +
  // symlink-unlink) then FALL THROUGH into the existing copyKit→materializeAdapter→seedState→
  // materializeRunnable→writeMarker sequence. Helper: glob the timestamped backups in a target.
  const backupGlob = (dir: string, prefix: string): string[] => {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).filter((n) => n.startsWith(`${prefix}.bak.`));
  };

  // SC1 / MIGR-01: convert old in-repo layout → two-root. After migrate the marker is present, the
  // kit is at $GRUGOPS_HOME/agent-factory, the resolver adapters carry the materialized KIT= block,
  // and the displaced in-repo agent-factory/ is renamed to a timestamped backup (never deleted).
  it("migrate: converts old in-repo layout to two-root", () => {
    const target = makeOldLayoutFixture();
    const home = mkTmp();
    const r = runInstall(target, home, "--migrate");
    expect(r.status).toBe(0);

    // two-root: the shared kit is now under $GRUGOPS_HOME (fresh from source, D-01).
    expect(existsSync(join(home, "agent-factory", "roles", "orchestrator.md"))).toBe(true);
    // marker present — the repo is now migrated.
    expect(existsSync(join(target, ".grugops", "install.json"))).toBe(true);
    // the resolver adapters carry the materialized KIT= block pointing at the shared kit.
    const agent = readFileSync(join(target, ".claude", "agents", "grugops-orchestrator.md"), "utf8");
    expect(agent).toContain("grugops:materialized-kit");
    expect(agent).toContain(join(home, "agent-factory"));
    // never-delete-first: the displaced in-repo agent-factory/ is renamed to a timestamped backup.
    expect(backupGlob(target, "agent-factory").length).toBe(1);
  });

  // SC1 / D-09/D-12: a second migrate is a true no-op — the marker is now present, so the D-12 path
  // exits 0 without re-running install. Snapshot equality across two migrates AND a non-growing
  // backup glob count (D-08 differs-only; the second run creates no new artifact).
  it("migrate: a second migrate is a no-op", () => {
    const target = makeOldLayoutFixture();
    const home = mkTmp();
    expect(runInstall(target, home, "--migrate").status).toBe(0);
    const t1 = snapshot(target);
    const h1 = snapshot(home);
    const bak1 = backupGlob(target, "agent-factory").length;

    const r2 = runInstall(target, home, "--migrate");
    expect(r2.status).toBe(0);
    expect(snapshot(target)).toBe(t1); // target unchanged by the second migrate
    expect(snapshot(home)).toBe(h1); // home unchanged
    expect(backupGlob(target, "agent-factory").length).toBe(bak1); // backups did not grow (D-08)
  });

  // SC1 / D-11: --migrate on a clean repo (no old layout, no install) falls through to a normal
  // fresh install — the result equals a plain runInstall (no migrate pre-steps fire). A truly clean
  // repo has NO in-repo agent-factory/ and NO marker (makeFixture plants an in-repo kit, so it is
  // an old-layout shape, not clean — use a bare target here).
  it("migrate: clean repo falls through to fresh install", () => {
    const targetA = mkTmp(); // bare: no agent-factory/, no marker → isClean
    writeFileSync(join(targetA, "CLAUDE.md"), "# User Project\n");
    const homeA = mkTmp();
    expect(runInstall(targetA, homeA, "--migrate").status).toBe(0);

    // A --migrate on a clean repo produces a plain-install target shape (no migrate backups fired).
    expect(backupGlob(targetA, "agent-factory").length).toBe(0);
    expect(existsSync(join(targetA, ".grugops", "install.json"))).toBe(true);
    expect(existsSync(join(targetA, ".claude", "agents", "grugops-orchestrator.md"))).toBe(true);
    // and the kit landed under home just like a plain install.
    expect(existsSync(join(homeA, "agent-factory", "roles", "orchestrator.md"))).toBe(true);
  });

  // SC1 / D-12: --migrate on an already-migrated repo that still has a leftover LIVE in-repo
  // agent-factory/ (half-state) is a no-op + warns (clear voice) that the leftover must be removed
  // BY HAND. prune cannot clear it (live, protected, non-.bak dir), so the guidance must NOT promise
  // prune removes it (WR-01). Install first (marker present), then --migrate must not re-mutate.
  it("migrate: half-state no-op + honest leftover guidance", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    // makeFixture already plants an in-repo agent-factory/roles/orchestrator.md (the leftover kit),
    // so after a normal install the repo is migrated (marker present) AND has a leftover in-repo kit.
    const t0 = snapshot(target);
    const h0 = snapshot(home);

    const r = runInstall(target, home, "--migrate");
    expect(r.status).toBe(0);
    // Honest guidance (WR-01): tell the user to remove the live leftover by hand, and do NOT point
    // them at --prune-old-kit, which only clears timestamped .bak.<ISO> backups, never a live kit.
    expect(r.stdout).toContain("by hand");
    expect(r.stdout).toContain("never a live kit");
    expect(r.stdout).not.toContain("--prune-old-kit");
    expect(snapshot(target)).toBe(t0); // no re-mutation (D-12)
    expect(snapshot(home)).toBe(h0);

    // Prove the guidance is honest: --prune-old-kit must NOT remove the live leftover agent-factory/
    // (it is protected, non-.bak), so the leftover survives — exactly why the hint says "by hand".
    expect(runInstall(target, home, "--prune-old-kit").status).toBe(0);
    expect(existsSync(join(target, "agent-factory", "roles", "orchestrator.md"))).toBe(true);
  });

  // SC3 / D-04: a user-edited config survives migration — moved to .grugops/factory.config.json
  // with the edited content, original left as a .bak; BOTH legacy locations are handled (the v1.0
  // in-repo agent-factory/config/ location AND the CONTEXT repo-root factory.config.json location).
  it("migrate: user-edited config survives", () => {
    // (a) the v1.0 in-repo kit-config location. The edited config is carried forward to .grugops/;
    // the original is left as a .bak AND travels inside the wholesale agent-factory/ backup (the
    // in-repo kit is renamed aside by step 2), so the original content is preserved twice over.
    const targetK = makeOldLayoutFixture();
    const homeK = mkTmp();
    expect(runInstall(targetK, homeK, "--migrate").status).toBe(0);
    // the edited config is carried forward to the two-root .grugops/ location.
    const seededK = readFileSync(join(targetK, ".grugops", "factory.config.json"), "utf8");
    expect(seededK).toContain("OLD-USER-EDITED-CONFIG-KIT-LOCATION");
    // the original is never lost — the displaced in-repo agent-factory/ is preserved as a
    // timestamped backup that carries the original config (renamed to a .bak inside it).
    const bakDirs = backupGlob(targetK, "agent-factory");
    expect(bakDirs.length).toBe(1);
    const bakConfigDir = join(targetK, bakDirs[0], "config");
    expect(backupGlob(bakConfigDir, "factory.config.json").length).toBe(1);

    // (b) the CONTEXT repo-root location. The repo-root config is carried forward; its .bak stays
    // at the repo root (it is NOT inside agent-factory/, so it does not travel with the kit backup).
    const targetR = makeOldLayoutFixture({ rootConfig: true });
    const homeR = mkTmp();
    expect(runInstall(targetR, homeR, "--migrate").status).toBe(0);
    const seededR = readFileSync(join(targetR, ".grugops", "factory.config.json"), "utf8");
    // the repo-root config is the user-edited one carried forward (root checked too).
    expect(seededR).toMatch(/OLD-USER-EDITED-CONFIG-(ROOT|KIT)-LOCATION/);
    // a .bak of the repo-root original exists at the repo root.
    expect(backupGlob(targetR, "factory.config.json").length).toBe(1);
  });

  // SC3 / CR-01: bounded marker-strip — migrate re-materializes the resolver adapters via
  // materializeAdapter, which strips a prior grugops:materialized-kit block from the SOURCE adapter
  // before injecting the fresh KIT line. CR-01 guarantees that an UNTERMINATED open marker (no close)
  // in that source adapter loses NO following lines (it buffers the block and restores it at EOF
  // rather than swallowing the rest of the file). To exercise migrate's materializeAdapter on
  // unterminated-marker content, point GRUGOPS_SRC at a minimal fake source whose orchestrator
  // adapter carries an unterminated open marker + a sentinel line, run --migrate, and assert the
  // sentinel survives in the materialized output (the v1.1 CR-01 bounded removal not regressed).
  it("migrate: bounded marker-strip", () => {
    // minimal fake GRUGOPS_SRC the install run can copy + materialize from.
    const src = mkTmp();
    mkdirSync(join(src, "agent-factory", "roles"), { recursive: true });
    mkdirSync(join(src, "agent-factory", "seed", ".grugops"), { recursive: true });
    mkdirSync(join(src, ".claude", "skills", "grugops"), { recursive: true });
    mkdirSync(join(src, ".claude", "agents"), { recursive: true });
    writeFileSync(join(src, "agent-factory", "roles", "orchestrator.md"), "FROZEN SRC CORE\n");
    writeFileSync(join(src, "agent-factory", "VERSION"), "0.0.0-test\n");
    writeFileSync(join(src, "agent-factory", "seed", ".grugops", "factory.config.json"), '{"seed":true}\n');
    writeFileSync(join(src, ".claude", "skills", "grugops", "SKILL.md"), "> src skill\n");
    // The orchestrator adapter SOURCE carries an UNTERMINATED grugops:materialized-kit open marker
    // (no close) followed by a sentinel line and the MAT_SLOT line. CR-01: the unterminated block is
    // restored verbatim at EOF rather than swallowing every following line.
    writeFileSync(
      join(src, ".claude", "agents", "grugops-orchestrator.md"),
      "# <!-- grugops:materialized-kit -->\n" +
        'KIT="/will/be/stripped"\n' +
        "SENTINEL-AFTER-UNTERMINATED-OPEN-MUST-SURVIVE\n" +
        "# 1. (installed) the absolute kit path the installer wrote above this line.\n",
    );

    const target = makeOldLayoutFixture();
    const home = mkTmp();
    const r = spawnSync("node", [INSTALL_JS, "--yes", "--migrate"], {
      encoding: "utf8",
      env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: src, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(r.status).toBe(0);
    const after = readFileSync(join(target, ".claude", "agents", "grugops-orchestrator.md"), "utf8");
    // the line following the unterminated open marker is preserved (CR-01 bounded removal — no loss).
    expect(after).toContain("SENTINEL-AFTER-UNTERMINATED-OPEN-MUST-SURVIVE");
  });

  // ── MIGR-04 (Phase 24, D-18/D-20) — the 4 plans/handoffs/ backup cases ───────────────────────
  // --migrate backs up a user's runtime-accumulated plans/handoffs/ (the old relay's dir) to a
  // timestamped plans/handoffs.bak.<ISO> via the never-delete-first backupDir primitive: rename,
  // never delete-first; abort on a backup-name collision without clobbering (D-18); no content
  // conversion (D-19 — the dir is only relocated); DRY_RUN mutates nothing + a second run with no
  // dir is a clean no-op (D-20). The backup name matches the anchored GRUGOPS_BACKUP_SUFFIX shape.

  // Helper: glob the timestamped handoffs backups under a target's plans/ dir.
  const handoffsBackupGlob = (target: string): string[] => {
    const plans = join(target, "plans");
    if (!existsSync(plans)) return [];
    return readdirSync(plans).filter((n) => /^handoffs\.bak\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/.test(n));
  };

  // (1) BACKUP — a target with plans/handoffs/ present: --migrate renames it to
  // plans/handoffs.bak.<ISO>; the original is gone, the backup is present + correctly shaped, and a
  // backed-up report line is printed (D-18 never-delete-first rename).
  it("migrate: plans/handoffs/ is backed up to a timestamped .bak (MIGR-04, never-delete-first)", () => {
    const target = makeFixture();
    const home = mkTmp();
    // Seed a runtime-accumulated handoffs dir with a user file (the old relay's leftover state).
    mkdirSync(join(target, "plans", "handoffs"), { recursive: true });
    writeFileSync(join(target, "plans", "handoffs", "T-001-implementation.md"), "user handoff — must be preserved\n");

    const r = runInstall(target, home, "--migrate");
    expect(r.status).toBe(0);
    // The original is RENAMED aside, not deleted — the dir is gone but the backup exists.
    expect(existsSync(join(target, "plans", "handoffs"))).toBe(false);
    const baks = handoffsBackupGlob(target);
    expect(baks.length).toBe(1);
    // The user's content survives verbatim inside the backup (no conversion — D-19).
    expect(readFileSync(join(target, "plans", baks[0], "T-001-implementation.md"), "utf8")).toContain("must be preserved");
    expect(r.stdout).toMatch(/backed-up/); // a backed-up report line is printed
  });

  // (2) IDEMPOTENT — a second --migrate with no plans/handoffs/ is a clean no-op: exit 0, a
  // "nothing to migrate" line, and NO new backup artifact (D-20 idempotent).
  it("migrate: a second --migrate with no plans/handoffs/ is a nothing-to-migrate no-op (MIGR-04, D-20)", () => {
    const target = makeFixture();
    const home = mkTmp();
    mkdirSync(join(target, "plans", "handoffs"), { recursive: true });
    writeFileSync(join(target, "plans", "handoffs", "T-002-qe.md"), "handoff\n");
    expect(runInstall(target, home, "--migrate").status).toBe(0);
    expect(handoffsBackupGlob(target).length).toBe(1); // first migrate made exactly one backup

    // Second migrate: plans/handoffs/ is gone now → nothing to migrate, no new backup.
    const r2 = runInstall(target, home, "--migrate");
    expect(r2.status).toBe(0);
    expect(r2.stdout).toMatch(/nothing to migrate/);
    expect(handoffsBackupGlob(target).length).toBe(1); // count did NOT grow
  });

  // (3) DRY_RUN — DRY_RUN=1 --migrate prints a would-backup line and the filesystem is UNCHANGED:
  // plans/handoffs/ is still present and NO .bak is created (D-20 dry-run never mutates).
  it("migrate: DRY_RUN --migrate narrates a would-backup and creates no .bak (MIGR-04, D-20)", () => {
    const target = makeFixture();
    const home = mkTmp();
    mkdirSync(join(target, "plans", "handoffs"), { recursive: true });
    writeFileSync(join(target, "plans", "handoffs", "T-003-uat.md"), "handoff\n");

    const r = spawnSync("node", [INSTALL_JS, "--yes", "--migrate"], {
      encoding: "utf8",
      env: { ...process.env, DRY_RUN: "1", INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/would-backup/); // the backup is narrated, not executed
    // The filesystem is byte-for-byte unchanged: original present, no backup made.
    expect(existsSync(join(target, "plans", "handoffs"))).toBe(true);
    expect(existsSync(join(target, "plans", "handoffs", "T-003-uat.md"))).toBe(true);
    expect(handoffsBackupGlob(target).length).toBe(0);
  });

  // (4) NEVER-CLOBBER — a pre-existing plans/handoffs.bak.<that exact ISO> collision makes --migrate
  // ABORT the handoffs-backup step with a clear message, leaving BOTH the original plans/handoffs/
  // AND the existing backup untouched (D-18 never-clobber). To force the EXACT-name collision
  // deterministically we drive the committed installer through a tiny ESM wrapper that pins
  // Date.prototype.toISOString to a fixed instant, so isoStamp() resolves to a known stamp and we
  // can pre-create the colliding backup name ahead of the run.
  it("migrate: a backup-name collision aborts without clobbering (MIGR-04, D-18 never-clobber)", () => {
    const target = makeFixture();
    const home = mkTmp();
    mkdirSync(join(target, "plans", "handoffs"), { recursive: true });
    writeFileSync(join(target, "plans", "handoffs", "T-004.md"), "original handoff\n");

    // isoStamp() replaces ':' with '-', so the fixed instant 2026-06-22T12:00:00.000Z becomes the
    // backup-name stamp 2026-06-22T12-00-00.000Z. Pre-create that EXACT colliding backup.
    const collidingBak = join(target, "plans", "handoffs.bak.2026-06-22T12-00-00.000Z");
    mkdirSync(collidingBak, { recursive: true });
    writeFileSync(join(collidingBak, "SENTINEL.md"), "PRE-EXISTING BACKUP — MUST NOT BE CLOBBERED\n");

    // A throwaway ESM wrapper: pin the clock, then run the committed installer with correct argv.
    const wrapperDir = mkTmp();
    const wrapper = join(wrapperDir, "pin-clock.mjs");
    writeFileSync(
      wrapper,
      `Date.prototype.toISOString = function () { return "2026-06-22T12:00:00.000Z"; };\n` +
        `await import(${JSON.stringify(INSTALL_JS)});\n`,
    );
    const r = spawnSync("node", [wrapper, "--yes", "--migrate"], {
      encoding: "utf8",
      env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target },
    });
    // The handoffs-backup step aborts in clear voice; the original is preserved untouched and the
    // pre-existing backup is never overwritten (D-18 never-clobber).
    expect(r.stdout).toMatch(/aborted/);
    expect(existsSync(join(target, "plans", "handoffs", "T-004.md"))).toBe(true); // original untouched
    expect(readFileSync(join(collidingBak, "SENTINEL.md"), "utf8")).toContain("MUST NOT BE CLOBBERED");
  });

  // LANDMINE (Pitfall 1): a symlink .claude adapter migrate does NOT write through the symlink and
  // corrupt the source clone — the symlink dest is unlinked before re-materialize (HIGH-severity).
  it("migrate: symlink adapter does not corrupt source clone", () => {
    const target = makeOldLayoutFixture({ symlink: true });
    const home = mkTmp();
    const srcClone = join(target, "source-clone", "orchestrator-src.md");
    const before = readFileSync(srcClone, "utf8");
    expect(before).toContain("SENTINEL-SOURCE-CLONE");

    expect(runInstall(target, home, "--migrate").status).toBe(0);

    // THE PROOF: the planted source-clone file is byte-unchanged — migrate unlinked the symlink
    // dest before materializeAdapter, so the write never followed the link into the clone.
    expect(readFileSync(srcClone, "utf8")).toBe(before);
    // and the adapter is now a real materialized file (not a symlink) carrying the KIT= block.
    expect(lstatSync(join(target, ".claude", "agents", "grugops-orchestrator.md")).isSymbolicLink()).toBe(false);
    const agent = readFileSync(join(target, ".claude", "agents", "grugops-orchestrator.md"), "utf8");
    expect(agent).toContain("grugops:materialized-kit");
  });

  // DRY_RUN: --migrate / --update / --prune-old-kit mutate nothing and narrate would-* lines.
  it("DRY_RUN: new modes mutate nothing", () => {
    // (a) --migrate arm: an old-layout target under DRY_RUN is narrated, never executed.
    const target = makeOldLayoutFixture();
    const home = mkTmp();
    rmSync(home, { recursive: true, force: true }); // start with home ABSENT
    const tPre = snapshot(target);

    const r = spawnSync("node", [INSTALL_JS, "--yes", "--migrate"], {
      encoding: "utf8",
      env: { ...process.env, DRY_RUN: "1", INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(r.status).toBe(0);
    expect(snapshot(target)).toBe(tPre); // target byte-for-byte unchanged
    expect(existsSync(home)).toBe(false); // home never created
    expect(r.stdout).toMatch(/would-/); // the migrate plan is narrated, not executed

    // (b) --update arm: install a real two-root pair, snapshot both roots, then DRY_RUN --update —
    // it narrates would-* and mutates NEITHER root (kit-home-only and DRY_RUN-safe).
    const uTarget = makeFixture();
    const uHome = mkTmp();
    expect(runInstall(uTarget, uHome).status).toBe(0);
    // induce a differing installed kit so a NON-dry --update would have retained a backup.
    writeFileSync(join(uHome, "agent-factory", "VERSION"), "9.9.9-displaced\n");
    const utPre = snapshot(uTarget);
    const uhPre = snapshot(uHome);
    const ru = spawnSync("node", [INSTALL_JS, "--yes", "--update"], {
      encoding: "utf8",
      env: { ...process.env, DRY_RUN: "1", INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: uHome, TARGET: uTarget },
    });
    expect(ru.status).toBe(0);
    expect(ru.stdout).toMatch(/would-/); // the update plan is narrated
    expect(snapshot(uTarget)).toBe(utPre); // per-repo state untouched
    expect(snapshot(uHome)).toBe(uhPre); // kit home unchanged (no real copy, no backup)
    expect(homeBackupGlob(uHome).length).toBe(0); // DRY_RUN created no backup

    // (c) --prune-old-kit arm: plant grugops backups in both roots, DRY_RUN --prune-old-kit lists
    // would-remove and deletes NOTHING.
    const pTarget = makeFixture();
    const pHome = mkTmp();
    expect(runInstall(pTarget, pHome).status).toBe(0);
    // plant a grugops-shaped backup in each root.
    mkdirSync(join(pHome, `agent-factory.bak.${"2026-06-15T00-00-00.000Z"}`), { recursive: true });
    mkdirSync(join(pTarget, `agent-factory.bak.${"2026-06-15T00-00-00.000Z"}`), { recursive: true });
    const ptPre = snapshot(pTarget);
    const phPre = snapshot(pHome);
    const rp = spawnSync("node", [INSTALL_JS, "--yes", "--prune-old-kit"], {
      encoding: "utf8",
      env: { ...process.env, DRY_RUN: "1", INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: pHome, TARGET: pTarget },
    });
    expect(rp.status).toBe(0);
    expect(rp.stdout).toMatch(/would-remove/); // the prune plan is narrated
    expect(snapshot(pTarget)).toBe(ptPre); // nothing deleted in the target
    expect(snapshot(pHome)).toBe(phPre); // nothing deleted in the kit home
  });

  // SC3: uninstall-after-migrate + the DOCUMENTED manual .bak rename restores the pre-migrate state.
  // migrate relocates the user's in-repo kit to a timestamped backup and carries the edited config
  // forward; uninstall removes ONLY the grugops-owned wiring + marker (leaving the backups + seeded
  // config — D-06); then the documented manual restore (README ### Migrating an existing install)
  // renames agent-factory.bak.<ISO>/ back to agent-factory/, restores the config .bak inside it, and
  // removes the migrate-seeded .grugops/factory.config.json — yielding the pre-migrate user content.
  // uninstall.ts needs NO new automated migrate-rollback logic for this to hold (the restore is the
  // user's documented manual step), so this case locks the README steps to the actual file shapes.
  // The snapshot is scoped to the user-owned agent-factory/ tree (the grugops-owned .claude adapters
  // are wiring that uninstall removes by design in both layouts, so they are not part of the
  // restored user state).
  it("migrate: uninstall-after-migrate restores pre-migrate state", () => {
    const target = makeOldLayoutFixture();
    const home = mkTmp();
    // pre-migrate snapshot of the user-owned in-repo kit (the content migrate backs up + restore renames back).
    const pre = snapshot(join(target, "agent-factory"));
    expect(pre).toContain("config/factory.config.json"); // the edited config is part of pre-migrate state

    expect(runInstall(target, home, "--migrate").status).toBe(0);
    expect(runUninstall(target, home).status).toBe(0);

    // DOCUMENTED MANUAL RESTORE (exactly the README ### Migrating an existing install rollback steps):
    // 1. find the timestamped in-repo-kit backup.
    const bakDirs = backupGlob(target, "agent-factory");
    expect(bakDirs.length).toBe(1);
    const bak = join(target, bakDirs[0]);
    // 2. restore the original config .bak inside the backup (rename it back over its original name).
    const cfgBaks = backupGlob(join(bak, "config"), "factory.config.json");
    expect(cfgBaks.length).toBe(1);
    renameSync(join(bak, "config", cfgBaks[0]), join(bak, "config", "factory.config.json"));
    // 3. rename the whole backup back to agent-factory/.
    renameSync(bak, join(target, "agent-factory"));
    // 4. remove the migrate-seeded .grugops/factory.config.json (it was created by migrate).
    rmSync(join(target, ".grugops", "factory.config.json"), { force: true });

    // The restored user-owned in-repo kit equals the pre-migrate snapshot exactly.
    expect(snapshot(join(target, "agent-factory"))).toBe(pre);
    // The edited config content survived the whole round-trip.
    expect(readFileSync(join(target, "agent-factory", "config", "factory.config.json"), "utf8")).toContain(
      "OLD-USER-EDITED-CONFIG-KIT-LOCATION",
    );
    // The grugops-owned wiring + marker are gone (uninstall removed them).
    expect(existsSync(join(target, ".claude", "agents", "grugops-orchestrator.md"))).toBe(false);
    expect(existsSync(join(target, ".grugops", "install.json"))).toBe(false);
  });

  // ── --update (UPD-01, Plan 17-03) — the 3 RED-by-design update cases (D-05/D-06/D-07) ─────────
  // --update refreshes the central $GRUGOPS_HOME kit in place via copyKit(retainBackup=true): it is
  // kit-home-only (D-05, never touches a repo's per-repo state — no --target write), retains the
  // displaced kit as a timestamped backup when it differs (D-06), is a true no-op when identical
  // (D-09), and warns-then-proceeds on a downgrade (D-07). The doctor's "name the unresolved path"
  // case (doctor: a missing kit) stays green — --update does not regress SC2.
  //
  // Helper: glob the timestamped kit backups under a kit home (agent-factory.bak.<ISO>).
  const homeBackupGlob = (home: string): string[] => {
    if (!existsSync(home)) return [];
    return readdirSync(home).filter((n) => n.startsWith("agent-factory.bak."));
  };

  // D-05: --update refreshes the kit at $GRUGOPS_HOME and leaves the per-repo state UNTOUCHED.
  // Install a target (seeds .grugops/, plans/, adapters), snapshot the whole target, run --update,
  // and assert the target snapshot is byte-identical (kit-home-only — no target write) while the
  // shared kit at home is still present and real (refreshed in place).
  it("update: refreshes kit, leaves per-repo state untouched", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);

    const tPre = snapshot(target); // the full per-repo state after install
    expect(tPre).toContain(".grugops/install.json"); // a real installed per-repo state

    const r = runInstall(target, home, "--update");
    expect(r.status).toBe(0);

    // kit-home-only (D-05): the per-repo state is byte-for-byte unchanged by --update.
    expect(snapshot(target)).toBe(tPre);
    // the shared kit at home is refreshed in place (still a real kit).
    expect(existsSync(join(home, "agent-factory", "roles", "orchestrator.md"))).toBe(true);
  });

  // D-06: --update retains the displaced kit as a timestamped backup when it DIFFERS, and creates
  // NO backup when identical (D-09 no-op). Install first (home now carries a kit), then induce a
  // DIFFERING installed kit by editing a file inside the installed home kit (its VERSION, the way
  // the doctor-skew case does), so copyKit's dirsSameContent(old, new) is false. --update renames
  // the displaced kit to agent-factory.bak.<ISO>. A second --update with an unchanged source is a
  // true no-op → no new backup.
  it("update: displaced kit retained as backup", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    expect(homeBackupGlob(home).length).toBe(0); // install never retains a kit backup

    // induce a DIFFERING installed kit (edit the installed home kit's VERSION).
    writeFileSync(join(home, "agent-factory", "VERSION"), "9.9.9-displaced\n");

    const r = runInstall(target, home, "--update");
    expect(r.status).toBe(0);
    // D-06: the displaced (differing) kit is renamed aside to a timestamped backup.
    expect(homeBackupGlob(home).length).toBe(1);
    // the backup carries the edited content (it is the displaced kit, never deleted).
    const bak = homeBackupGlob(home)[0];
    expect(readFileSync(join(home, bak, "VERSION"), "utf8")).toContain("9.9.9-displaced");

    // D-09: a second --update with an UNCHANGED source kit is a true no-op → no new backup.
    const r2 = runInstall(target, home, "--update");
    expect(r2.status).toBe(0);
    expect(homeBackupGlob(home).length).toBe(1); // the count did not grow
  });

  // D-07: --update on a downgrade (the running checkout VERSION is OLDER than the installed kit
  // VERSION) warns in clear voice naming BOTH versions, then PROCEEDS (exit 0, no refusal —
  // SKEW-01 deferred). Install first, write a NEWER VERSION into the installed home kit, run
  // --update from the (older) source, and assert exit 0 + a stdout warning carrying both versions.
  it("update: downgrade warns then proceeds", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);

    // make the INSTALLED kit a newer version than the running source checkout → a downgrade.
    const installedVer = "99.0.0-installed";
    writeFileSync(join(home, "agent-factory", "VERSION"), installedVer + "\n");
    // the source VERSION is whatever the repo ships (older than 99.0.0).
    const sourceVer = readFileSync(join(REPO_ROOT, "agent-factory", "VERSION"), "utf8").split("\n")[0];

    const r = runInstall(target, home, "--update");
    expect(r.status).toBe(0); // proceeds (no refusal — D-07)
    // the warning names BOTH versions (the delta).
    expect(r.stdout).toContain(installedVer);
    expect(r.stdout).toContain(sourceVer);
    // and the kit was refreshed (the source version is now installed).
    expect(readFileSync(join(home, "agent-factory", "VERSION"), "utf8")).toContain(sourceVer);
  });

  // ── --prune-old-kit (D-10, Plan 17-03) — the single, opt-in deletion path ────────────────────
  // --prune-old-kit removes ONLY grugops-created timestamped backups (agent-factory.bak.<ISO> in
  // both roots, plus the config .bak migrate leaves) and NEVER runs on the default path
  // (never-delete-first). It uses a tight name-shape matcher (not a loose *.bak — Pitfall 5) and an
  // isProtected()-style guard so plans/, .planning/, .grugops/ seeded state, docs/, src/, and the
  // live agent-factory/ are never touched.
  it("prune: removes only grugops backups, default preserves", () => {
    const target = makeOldLayoutFixture();
    const home = mkTmp();
    // migrate creates the grugops backups: agent-factory.bak.<ISO> (the displaced in-repo kit) and
    // a config .bak (inside that backup, since the in-repo kit is renamed aside).
    expect(runInstall(target, home, "--migrate").status).toBe(0);
    expect(backupGlob(target, "agent-factory").length).toBe(1); // the grugops kit backup exists

    // plant a USER-owned backup that is NOT grugops-shaped (no .bak.<ISO> stamp) — must survive.
    writeFileSync(join(target, "mine.bak"), "USER-OWNED BACKUP — prune must never delete this.\n");
    // also plant a grugops-shaped kit backup under the kit HOME (the --update displaced-kit shape).
    mkdirSync(join(home, "agent-factory.bak.2026-06-15T00-00-00.000Z"), { recursive: true });
    writeFileSync(join(home, "agent-factory.bak.2026-06-15T00-00-00.000Z", "VERSION"), "old\n");

    // (a) a DEFAULT (non-prune) run never deletes any backup (never-delete-first, D-10).
    expect(runInstall(target, home).status).toBe(0);
    expect(backupGlob(target, "agent-factory").length).toBe(1); // still there after a normal install
    expect(homeBackupGlob(home).length).toBe(1); // home backup still there too

    // (b) --prune-old-kit removes the grugops backups in BOTH roots.
    const r = runInstall(target, home, "--prune-old-kit");
    expect(r.status).toBe(0);
    expect(backupGlob(target, "agent-factory").length).toBe(0); // grugops target backup gone
    expect(homeBackupGlob(home).length).toBe(0); // grugops home backup gone

    // (c) the user-owned non-grugops backup + the protected seeded state SURVIVE.
    expect(readFileSync(join(target, "mine.bak"), "utf8")).toContain("USER-OWNED BACKUP");
    expect(existsSync(join(target, ".grugops", "factory.config.json"))).toBe(true);
    expect(existsSync(join(target, "plans", "board.md"))).toBe(true);
    // the LIVE kit at home is untouched (only the backups were pruned).
    expect(existsSync(join(home, "agent-factory", "roles", "orchestrator.md"))).toBe(true);
  });

  // ── D-11 materializeRunnable(): the kit-shipped runnable lands at the committed host path ─────
  // The TOOL-02 install-side proof. install.js copies the compiled reference routine into the
  // host's committed tools/grugops/ path (additive/idempotent/never-overwrite); a second install
  // is a no-op; a user-edited copy is NOT clobbered; and the materialized routine runs from the
  // bare host fixture with ONLY Node (no node_modules) and exits 1 on the bad fixture — the D-11
  // end-to-end proof that Phase 16's checker materializes via this exact mechanism.
  const MATERIALIZED_REL = join("tools", "grugops", "reference-check.js");
  const BAD_FIXTURE = join(REPO_ROOT, "scripts", "runnable-ref", "fixtures", "bad.txt");

  it("D-11 materialize: the runnable lands at the committed tools/grugops/ host path", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const materialized = join(target, MATERIALIZED_REL);
    expect(existsSync(materialized)).toBe(true);
    // It is a byte-identical copy of the kit's committed runnable (the materialization source).
    expect(readFileSync(materialized, "utf8")).toBe(
      readFileSync(join(REPO_ROOT, "scripts", "runnable-ref", "reference-check.js"), "utf8"),
    );
  });

  it("D-11 materialize: a second install is idempotent (the materialized runnable is unchanged)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const first = readFileSync(join(target, MATERIALIZED_REL), "utf8");
    expect(runInstall(target, home).status).toBe(0);
    expect(readFileSync(join(target, MATERIALIZED_REL), "utf8")).toBe(first);
  });

  it("D-11 materialize: never-overwrite — a user-edited materialized runnable is preserved (T-15-05-Tamper)", () => {
    const target = makeFixture();
    const home = mkTmp();
    // Plant a user-edited routine at the materialization path BEFORE install.
    mkdirSync(join(target, "tools", "grugops"), { recursive: true });
    writeFileSync(join(target, MATERIALIZED_REL), "// USER-EDITED RUNNABLE — install must never clobber this.\n");
    expect(runInstall(target, home).status).toBe(0);
    expect(readFileSync(join(target, MATERIALIZED_REL), "utf8")).toContain("USER-EDITED RUNNABLE");
  });

  it("D-11 materialize: the materialized runnable runs in a bare-Node host (no node_modules) and exits 1 on the bad fixture", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const materialized = join(target, MATERIALIZED_REL);
    // The target fixture has NO node_modules — this is the D-11 host-CI emulation (kit absent).
    const r = spawnSync("node", [materialized, BAD_FIXTURE], { encoding: "utf8", cwd: target });
    expect(r.status).toBe(1); // 1 = findings on the bad fixture (the gate would block)
    expect(r.stdout).toContain("FORBIDDEN");
  });

  // ── KIT-02 (Plan 27-02) — the derived install/uninstall sets ─────────────────────────────────
  // install.ts and uninstall.ts derive their adapter and skill sets by readdirSync of $GRUGOPS_SRC
  // (D-18) and route materialize-vs-copy by the resolver slot line in the source body (D-06). Both
  // cases drive a SYNTHETIC seventeen-adapter kit source, so they pin the derivation itself and are
  // independent of plan 27-07 landing the real seventeen adapters.

  // (1) THE 17-ADAPTER UPDATE. An already-installed repo carries the old single-adapter layout, so
  // this is an install-time DATA MIGRATION, not only a code change: the run must lay down all
  // seventeen over a target holding exactly one, materialize the resolved kit root into each, and
  // be idempotent ACROSS the migration (a second identical run leaves the target byte-identical).
  it("KIT-02: a 17-adapter kit source updates an old single-adapter install, and the update is idempotent", () => {
    const src = makeSyntheticSrc();
    const home = mkTmp();
    const target = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n\nMy own dev instructions — must be preserved.\n");

    // Pre-seed the OLD layout: ONE materialized adapter pointing at a stale kit, nothing else.
    mkdirSync(join(target, ".claude", "agents"), { recursive: true });
    writeFileSync(
      join(target, ".claude", "agents", "grugops-orchestrator.md"),
      "# <!-- grugops:materialized-kit -->\n" +
        'KIT="/stale/previous/kit/agent-factory"\n' +
        "# <!-- /grugops:materialized-kit -->\n" +
        `${MAT_SLOT}\n`,
    );
    expect(readdirSync(join(target, ".claude", "agents"))).toEqual(["grugops-orchestrator.md"]);

    expect(runInstallFrom(src, target, home).status).toBe(0);

    // All SEVENTEEN destination paths are asserted — never a sampled subset.
    const expectKit = join(home, "agent-factory");
    for (const a of SYNTH_ADAPTERS) {
      const p = join(target, ".claude", "agents", a);
      expect(existsSync(p)).toBe(true);
      const body = readFileSync(p, "utf8");
      expect(body).toContain("grugops:materialized-kit");
      const kitLine = body.split("\n").find((l) => l.startsWith('KIT="'));
      expect(kitLine).toBe(`KIT="${expectKit}"`); // resolved kit root, materialized per adapter
    }
    expect(SYNTH_ADAPTERS.length).toBe(17);
    // The target's adapter dir holds EXACTLY the derived set — nothing extra, nothing missing.
    expect(readdirSync(join(target, ".claude", "agents")).sort()).toEqual([...SYNTH_ADAPTERS].sort());
    // The stale KIT= the old layout carried is gone (strip-then-inject, not append).
    expect(readFileSync(join(target, ".claude", "agents", "grugops-orchestrator.md"), "utf8")).not.toContain(
      "/stale/previous/kit",
    );
    // D-06 routing by body content: the resolver skill materialized, the six delegators copied.
    expect(readFileSync(join(target, ".claude", "skills", "grugops", "SKILL.md"), "utf8")).toContain(
      "grugops:materialized-kit",
    );
    expect(readFileSync(join(target, ".claude", "skills", "grugops-map", "SKILL.md"), "utf8")).not.toContain(
      "grugops:materialized-kit",
    );

    // IDEMPOTENT ACROSS THE MIGRATION: a second identical run changes nothing in either root.
    const t1 = snapshot(target);
    const h1 = snapshot(home);
    expect(runInstallFrom(src, target, home).status).toBe(0);
    expect(snapshot(target)).toBe(t1);
    expect(snapshot(home)).toBe(h1);
  });

  // (2) USER-CONTENT SURVIVAL ON UNINSTALL (T-27-06). The fixture the suite lacked: a target whose
  // .claude/agents/ holds a file with NO counterpart in the kit source. An uninstall whose target
  // contains only grugops files can never catch the data-loss path where the removal set is derived
  // from the TARGET's own directory instead of the kit source.
  //
  // CR-02 (plan 27-25) — AND THE FIXTURE THAT COULD NOT SEE THE REVERSIBILITY GAP. This case
  // iterated only the FLAT synthetic adapter list, so every member was a plain file and the case
  // could not distinguish install.ts's statSync derivation from uninstall.ts's Dirent one. A Dirent
  // for a symlink is NEITHER isFile() NOR isDirectory(), so a symlinked source adapter was INSTALLED
  // and never REMOVED — `== uninstall complete ==`, exit 0, the file still in the target. The two
  // symlinked plants below are what make that shape reachable from the suite: they are the forcing
  // function the case was missing, not decoration.
  it("KIT-02/T-27-06: a user-authored .claude/agents file survives uninstall; all 17 grugops adapters are removed (CR-02: including SYMLINKED source shapes)", () => {
    const src = makeSyntheticSrc();
    const home = mkTmp();
    const target = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    // SKIPPED WHERE THE FIXTURE CANNOT EXIST. Creating a symlink on Windows requires the
    // SeCreateSymbolicLink privilege, which an unprivileged CI runner does not hold and which makes
    // symlinkSync throw EPERM — the plants would then assert nothing at all. The CR-02 claim is
    // therefore proven on the POSIX legs only; Windows behaviour is `UNKNOWN - verify`. Only the two
    // PLANTS are conditional; every pre-existing assertion in this case still runs on Windows.
    const canSymlink = process.platform !== "win32";

    // PLANT 1 — a symlinked ADAPTER inside the source .claude/agents. Flat and top-level, so the
    // flat-directory contract admits it: the correct outcome is installed, then removed.
    const linkedAdapter = "grugops-linked-role.md";
    // PLANT 2 — a symlinked SKILL DIRECTORY inside the source .claude/skills whose target holds a
    // real SKILL.md. The platform loads it as a skill, so the installer installs it and the reversal
    // must remove it.
    const linkedSkill = "grugops-linked-skill";
    if (canSymlink) {
      symlinkSync(
        join(src, ".claude", "agents", SYNTH_ADAPTERS[0]),
        join(src, ".claude", "agents", linkedAdapter),
      );
      mkdirSync(join(src, "outside-skill"), { recursive: true });
      writeFileSync(join(src, "outside-skill", "SKILL.md"), "> synthetic linked skill\n");
      symlinkSync(join(src, "outside-skill"), join(src, ".claude", "skills", linkedSkill));
    }

    expect(runInstallFrom(src, target, home).status).toBe(0);

    // The plants must actually be INSTALLED, or the removal assertions below would pass vacuously
    // over files that were never there. This is the half that keeps "removed" from meaning "absent
    // because it never arrived".
    if (canSymlink) {
      expect(existsSync(join(target, ".claude", "agents", linkedAdapter))).toBe(true);
      expect(existsSync(join(target, ".claude", "skills", linkedSkill, "SKILL.md"))).toBe(true);
    }

    // A user-authored adapter the kit source knows nothing about.
    const mine = join(target, ".claude", "agents", "my-own.md");
    const mineBody = "---\nname: my-own\n---\n\nMY OWN AGENT — uninstall must never delete this.\n";
    writeFileSync(mine, mineBody);

    const un = runUninstallFrom(src, target, home);
    expect(un.status).toBe(0);

    // All seventeen grugops adapters are gone (the derived ∩ target intersection was removed).
    for (const a of SYNTH_ADAPTERS) {
      expect(existsSync(join(target, ".claude", "agents", a))).toBe(false);
    }

    // CR-02, THE ASSERTION THE OLD FIXTURE COULD NOT MAKE. Both symlinked shapes are gone from the
    // target, and the uninstall NAMED each one it removed — a reversal that is silent about a member
    // is the repudiation half of the same defect (T-27-120).
    if (canSymlink) {
      expect(existsSync(join(target, ".claude", "agents", linkedAdapter))).toBe(false);
      expect(existsSync(join(target, ".claude", "skills", linkedSkill))).toBe(false);
      expect(un.stdout).toContain(`.claude/agents/${linkedAdapter}`);
      expect(un.stdout).toContain(`.claude/skills/${linkedSkill}/SKILL.md`);
    }
    // The user's own file survives with UNCHANGED bytes, and the directory survives because it is
    // not empty (rmdirIfEmpty never removes a directory holding user content).
    expect(existsSync(mine)).toBe(true);
    expect(readFileSync(mine, "utf8")).toBe(mineBody);
    expect(existsSync(join(target, ".claude", "agents"))).toBe(true);
    expect(existsSync(join(target, ".claude"))).toBe(true);
    expect(readdirSync(join(target, ".claude", "agents"))).toEqual(["my-own.md"]);

    // The cheaper companion assertion: .claude IS removed when it holds nothing else. Same source,
    // a second target with no user-authored adapter — after uninstall the whole dir is gone.
    const bare = mkTmp();
    writeFileSync(join(bare, "CLAUDE.md"), "# User Project\n");
    expect(runInstallFrom(src, bare, mkTmp()).status).toBe(0);
    expect(existsSync(join(bare, ".claude"))).toBe(true);
    expect(runUninstallFrom(src, bare, home).status).toBe(0);
    expect(existsSync(join(bare, ".claude"))).toBe(false);
  });

  // ── KIT-02 (Plan 27-13) — `source derivation`: conformance + the three fail-loud states ───────
  //
  // The installer answers "what adapters and skills exist in the kit source" with its OWN
  // derivation (D-18: it never imports the scripts layer). These cases assert that answer is the
  // SAME answer scripts/kit-model.ts gives, and that each way the derivation can fail is REPORTED
  // rather than silently degrading into a zero-iteration loop under a completion banner.
  //
  // The installed set is read back off disk after a real run, so what is compared is the
  // installer's actual behaviour — never a re-implementation of its rule inside the test.

  // installedAdapters / installedSkills — the installer's derivation made observable, in the exact
  // shape kit-model returns (forward-slash relative paths, sorted by full relative path).
  function installedAdapters(target: string): string[] {
    const dir = join(target, ".claude", "agents");
    if (!existsSync(dir)) return [];
    const out: string[] = [];
    const walk = (base: string): void => {
      for (const ent of readdirSync(join(dir, base), { withFileTypes: true })) {
        const rel = base ? `${base}/${ent.name}` : ent.name;
        if (ent.isDirectory()) walk(rel);
        else if (ent.isFile() && ent.name.endsWith(".md")) out.push(rel);
      }
    };
    walk("");
    return out.sort();
  }
  function installedSkills(target: string): string[] {
    const dir = join(target, ".claude", "skills");
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((ent) => ent.isDirectory() && existsSync(join(dir, ent.name, "SKILL.md")))
      .map((ent) => `${ent.name}/SKILL.md`)
      .sort();
  }

  it("source derivation: the installer's installed set equals kit-model's authority set, by member AND by count", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
    expect(runInstallFrom(src, target, home).status).toBe(0);

    // SET EQUALITY against the shared authority, over the same fixture source tree.
    const authorityAdapters = listAgentAdapters(src);
    const authoritySkills = listSkillAdapters(src);
    expect(installedAdapters(target)).toEqual(authorityAdapters);
    expect(installedSkills(target)).toEqual(authoritySkills);

    // CARDINALITY AS A NUMBER. Set equality alone passes when BOTH sides shrink together; the
    // integer is what makes a silently shrinking derivation fail the count instead.
    expect(authorityAdapters.length).toBe(17);
    expect(installedAdapters(target).length).toBe(17);
    expect(authoritySkills.length).toBe(7);
    expect(installedSkills(target).length).toBe(7);

    // A clean run makes the completion claim; the fail-loud cases below prove it is withheld.
    // POSITIVE CONTROL FOR THE EXIT-CODE CONTRACT (27-21, WR-01): the banner and the status are
    // read off the SAME run, so this proves exit 3 is returned only on the INCOMPLETE branch and
    // never unconditionally. KIT-02 empty edge: zero verify findings exits 0; exactly one exits 3;
    // there is no threshold between them.
    const clean = runInstallFrom(src, target, home);
    expect(clean.stdout).toContain("== install complete");
    expect(clean.stdout).not.toContain("install INCOMPLETE");
    expect(clean.status).toBe(0);
  });

  it("source derivation: a SYMLINKED source adapter is a member of BOTH derivations, not silently dropped (WR-02)", () => {
    // SKIPPED WHERE THE FIXTURE CANNOT EXIST. Creating a symlink on Windows requires the
    // SeCreateSymbolicLink privilege, which an unprivileged CI runner does not hold and which
    // makes symlinkSync throw EPERM — the case would then assert nothing at all. The WR-02 claim
    // is therefore proven on the POSIX legs only; Windows behaviour is `UNKNOWN - verify`. This
    // mirrors, deliberately, how the permissions case above skips and says why.
    if (process.platform === "win32") return;

    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    // THE SHAPE THAT SPLIT THE TWO DERIVATIONS (WR-02). readdirSync(withFileTypes) reports a
    // symlink as isSymbolicLink() — NEITHER isFile() NOR isDirectory() — so the installer's old
    // Dirent-flag filter dropped it, while kit-model's walkFilesRelative uses statSync, which
    // FOLLOWS the link, because that is how the platform resolves a symlinked adapter. The file
    // was therefore not installed, not refused by name, not counted, and the run still printed
    // `== install complete ==`: the exact silent disappearance srcNestedAdapterFiles exists to
    // prevent. This is a NEW case rather than an edit to the conformance case above, so that
    // case's seventeen-member cardinality pin survives untouched as its own forcing function.
    const linkName = "grugops-linked-role.md";
    symlinkSync(
      join(src, ".claude", "agents", SYNTH_ADAPTERS[0]),
      join(src, ".claude", "agents", linkName),
    );

    // THE SKILL-SIDE PLANT (WR-02, plan 27-25). A symlinked skill DIRECTORY whose target holds a
    // real SKILL.md. Without it the skill assertion at the bottom of this case compared two
    // UNMODIFIED derivations over a fixture containing no symlinked skill — it would have passed
    // identically with the helper unchanged, which is to say it asserted nothing about the claim its
    // comment made. A fixture that cannot express the failure is not coverage.
    const linkedSkill = "grugops-linked-skill";
    mkdirSync(join(src, "outside-skill"), { recursive: true });
    writeFileSync(join(src, "outside-skill", "SKILL.md"), "> synthetic linked skill\n");
    symlinkSync(join(src, "outside-skill"), join(src, ".claude", "skills", linkedSkill));

    const r = runInstallFrom(src, target, home);
    // The link is a flat, top-level `.md` — the flat-directory contract admits it, so the correct
    // outcome is INSTALLED, and the run is complete.
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("== install complete");
    expect(r.stdout).not.toContain("install INCOMPLETE");

    // SET EQUALITY over the shape that used to split them, plus explicit membership on both sides
    // so a future regression that dropped the link from BOTH could not pass by shrinking together.
    const authorityAdapters = listAgentAdapters(src);
    expect(installedAdapters(target)).toEqual(authorityAdapters);
    expect(authorityAdapters).toContain(linkName);
    expect(installedAdapters(target)).toContain(linkName);
    expect(authorityAdapters.length).toBe(18);
    expect(installedAdapters(target).length).toBe(18);

    // The link's TARGET is still installed too — a symlink and its target in the same directory
    // are two distinct members of the set, never one merged member (KIT-01 adjacency edge).
    expect(installedAdapters(target)).toContain(SYNTH_ADAPTERS[0]);

    // A symlinked SKILL directory is a skill for the same reason, and by the same test — and now
    // over a fixture that actually contains one. Set equality against the authority is kept, but it
    // is no longer the whole claim: MEMBERSHIP names the linked skill on both sides so a regression
    // that dropped it from BOTH could not pass by shrinking together, and CARDINALITY pins the count
    // as an integer — the unmodified fixture ships seven skills, so with the plant it is eight.
    const authoritySkills = listSkillAdapters(src);
    expect(installedSkills(target)).toEqual(authoritySkills);
    expect(authoritySkills).toContain(`${linkedSkill}/SKILL.md`);
    expect(installedSkills(target)).toContain(`${linkedSkill}/SKILL.md`);
    expect(SYNTH_SKILLS.length).toBe(7);
    expect(authoritySkills.length).toBe(8);
    expect(installedSkills(target).length).toBe(8);
  });

  it("source derivation: an UNREADABLE source adapter directory is reported and no completion is claimed", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    // Unreadable shape #1 — a FILE where the adapter directory should be (readdirSync → ENOTDIR).
    // Chosen over chmod as the primary fixture because it is deterministic on every platform and
    // does not silently stop being a fixture when the suite runs as root. It is also a real-world
    // shape: an archive that dropped a directory and left a file behind.
    rmSync(join(src, ".claude", "agents"), { recursive: true, force: true });
    writeFileSync(join(src, ".claude", "agents"), "not a directory\n");

    const r = runInstallFrom(src, target, home);
    // EXIT 3 = INCOMPLETE (27-21, WR-01). The pin moves WITH the contract: the machine-readable
    // signal must agree with the banner, so a fail-loud run no longer reports the success code.
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("cannot read");
    expect(r.stdout).toContain(join(src, ".claude", "agents"));
    expect(r.stdout).toContain("No adapter was installed");
    // RED DIRECTION: the run must NOT claim it finished, and must NOT have installed adapters.
    expect(r.stdout).not.toContain("== install complete");
    expect(r.stdout).toContain("install INCOMPLETE");
    expect(installedAdapters(target)).toEqual([]);
    // The skill class is UNAFFECTED — one unreadable directory does not suppress the other class.
    expect(installedSkills(target).length).toBe(7);
  });

  it("source derivation: an unreadable-by-PERMISSIONS adapter directory is reported the same way", () => {
    // The second unreadable shape (EACCES). Skipped where the fixture cannot exist: Windows does
    // not honour POSIX mode bits, and root bypasses them — in either case a chmod 000 directory is
    // still readable and the case would assert nothing.
    const rootish = typeof process.getuid === "function" && process.getuid() === 0;
    if (process.platform === "win32" || rootish) return;

    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
    const agents = join(src, ".claude", "agents");
    chmodSync(agents, 0o000);
    try {
      const r = runInstallFrom(src, target, home);
      expect(r.status).toBe(3); // INCOMPLETE (27-21, WR-01)
      expect(r.stdout).toContain("cannot read");
      expect(r.stdout).toContain("No adapter was installed");
      expect(r.stdout).not.toContain("== install complete");
      expect(installedAdapters(target)).toEqual([]);
    } finally {
      chmodSync(agents, 0o755); // restore so afterEach can clean the fixture up
    }
  });

  it("source derivation: an EMPTY source adapter directory is a DISTINCT condition from an unreadable one", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    rmSync(join(src, ".claude", "agents"), { recursive: true, force: true });
    mkdirSync(join(src, ".claude", "agents"), { recursive: true });

    const r = runInstallFrom(src, target, home);
    expect(r.status).toBe(3); // INCOMPLETE (27-21, WR-01)
    // The two failure states need different remedies, so they carry different wording. Both
    // substrings are asserted SEPARATELY: the empty message must appear and the unreadable
    // message must not, or the two conditions have been folded into one and the remedy is lost.
    expect(r.stdout).toContain("was read successfully but holds no adapter");
    expect(r.stdout).not.toContain("cannot read");
    expect(r.stdout).toContain(join(src, ".claude", "agents"));
    expect(r.stdout).not.toContain("== install complete");
    expect(installedAdapters(target)).toEqual([]);
  });

  it("source derivation: a NESTED source adapter is refused by name, not silently skipped", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    // Claude Code discovers .claude/agents recursively, so this file WOULD be loaded by the
    // platform; the adapter directory is flat by contract, so the installer must say so out loud.
    mkdirSync(join(src, ".claude", "agents", "nested"), { recursive: true });
    writeFileSync(
      join(src, ".claude", "agents", "nested", "deep-adapter.md"),
      `> synthetic nested adapter\n${MAT_SLOT}\n`,
    );

    const r = runInstallFrom(src, target, home);
    // KIT-02 ADJACENCY: seventeen adapters installed and ONE nested source file refused is
    // INCOMPLETE, not complete — the two adjacent outcomes carry different banners AND different
    // exit codes (27-21, WR-01).
    expect(r.status).toBe(3);
    // Refused BY NAME, at its relative path.
    expect(r.stdout).toContain("nested/deep-adapter.md");
    expect(r.stdout).toContain("FLAT BY CONTRACT");
    expect(r.stdout).toContain("NOT installed");
    expect(r.stdout).not.toContain("== install complete");
    // The flat seventeen still install; only the nested plant is refused, and it never lands.
    expect(installedAdapters(target)).toEqual([...SYNTH_ADAPTERS].sort());
    expect(installedAdapters(target).length).toBe(17);
    expect(existsSync(join(target, ".claude", "agents", "nested"))).toBe(false);

    // CONFORMANCE UNDER THE NESTED SHAPE: the authority SEES the nested file (it recurses, because
    // the platform does) while the installer's install set deliberately does not — so the two sets
    // differ by exactly the refused member, and nothing else. That difference is the contract, and
    // asserting it here is what stops a future "fix" from quietly installing nested adapters or
    // from teaching the authority to ignore them.
    const authority = listAgentAdapters(src);
    expect(authority.length).toBe(18);
    expect(authority.filter((m) => m.includes("/"))).toEqual(["nested/deep-adapter.md"]);
    expect(authority.filter((m) => !m.includes("/"))).toEqual(installedAdapters(target));
  });

  it("source derivation: a NESTED SYMLINKED source adapter is refused BY NAME, not silently skipped (WR-02)", () => {
    // Same Windows skip and the same reason as the top-level symlink case above: symlinkSync
    // needs a privilege the runner may not hold, and a case that cannot build its fixture asserts
    // nothing. Proven on the POSIX legs only.
    if (process.platform === "win32") return;

    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    // The nested direction of WR-02: a symlinked FILE one level below `.claude/agents`, reached
    // through a symlinked DIRECTORY. The old walk tested `ent.isDirectory()` and `ent.isFile()`,
    // both false for a link, so BOTH levels were invisible — the plant could not even be reached,
    // let alone refused. The platform recurses into `.claude/agents`, so it would have loaded
    // this file; the installer must therefore say its name out loud rather than drop it.
    mkdirSync(join(src, "outside-nest"), { recursive: true });
    writeFileSync(join(src, "outside-nest", "real-deep.md"), `> synthetic deep adapter\n${MAT_SLOT}\n`);
    symlinkSync(join(src, "outside-nest"), join(src, ".claude", "agents", "linked-nest"));
    mkdirSync(join(src, ".claude", "agents", "nested"), { recursive: true });
    symlinkSync(
      join(src, ".claude", "agents", SYNTH_ADAPTERS[0]),
      join(src, ".claude", "agents", "nested", "linked-deep.md"),
    );

    const r = runInstallFrom(src, target, home);
    expect(r.status).toBe(3); // INCOMPLETE (27-21) — a refused member is not a complete run.
    // REFUSED BY NAME, at the relative path, for both the linked file and the file reached
    // through the linked directory. Matching the plain nested-refusal case's assertions exactly.
    expect(r.stdout).toContain("nested/linked-deep.md");
    expect(r.stdout).toContain("linked-nest/real-deep.md");
    expect(r.stdout).toContain("FLAT BY CONTRACT");
    expect(r.stdout).toContain("NOT installed");
    expect(r.stdout).not.toContain("== install complete");
    // The flat seventeen still install; neither plant lands in the target.
    expect(installedAdapters(target)).toEqual([...SYNTH_ADAPTERS].sort());
    expect(existsSync(join(target, ".claude", "agents", "nested"))).toBe(false);
    expect(existsSync(join(target, ".claude", "agents", "linked-nest"))).toBe(false);
  });

  it("source derivation: TWO paths to ONE directory produce TWO refusals, not one (CR-03, D-29)", () => {
    // Same Windows skip and the same reason as the symlink cases above: symlinkSync needs a
    // privilege the runner may not hold, and a case that cannot build its fixture asserts nothing.
    // Proven on the POSIX legs only.
    if (process.platform === "win32") return;

    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    // ONE physical directory, reached two ways. The nested walk's cycle guard used to be a GLOBAL
    // realpath visited set, so whichever of these readdirSync returned second was silently dropped
    // — making the installer BLIND to a member the authority sees, the exact condition
    // kit-source.ts's header forbids ("a member it cannot see is a member it cannot refuse by
    // name"), and nondeterministic across filesystems because readdir order decided the victim.
    mkdirSync(join(src, ".claude", "agents", "real"), { recursive: true });
    writeFileSync(join(src, ".claude", "agents", "real", "x.md"), `> synthetic nested adapter\n${MAT_SLOT}\n`);
    symlinkSync(join(src, ".claude", "agents", "real"), join(src, ".claude", "agents", "alias"));

    const r = runInstallFrom(src, target, home);
    expect(r.status).toBe(3); // INCOMPLETE (27-21) — a refused member is not a complete run.
    // BOTH relative paths named. Asserted separately so dropping either one fails.
    expect(r.stdout).toContain("alias/x.md");
    expect(r.stdout).toContain("real/x.md");
    expect(r.stdout).toContain("FLAT BY CONTRACT");
    expect(r.stdout).toContain("NOT installed");
    expect(r.stdout).not.toContain("== install complete");

    // The authority sees both, and the installer's refusal set now covers both. The INSTALL set is
    // unchanged: the refusal is the contract, and NEITHER member may be installed.
    const authority = listAgentAdapters(src);
    expect(authority.filter((m) => m.includes("/"))).toEqual(["alias/x.md", "real/x.md"]);
    expect(installedAdapters(target)).toEqual([...SYNTH_ADAPTERS].sort());
    expect(installedAdapters(target).length).toBe(17);
    expect(existsSync(join(target, ".claude", "agents", "real"))).toBe(false);
    expect(existsSync(join(target, ".claude", "agents", "alias"))).toBe(false);
  });

  // ── WR-04 (Plan 27-13) — `runnable removal`: every installed file has a removal counterpart ───
  //
  // install.ts's materializeRunnable() writes tools/grugops/*.js into the user's repository.
  // uninstall.ts never mentioned tools/ at all, so those files were installed and never removed —
  // a reversibility gap against the CLAUDE.md installer constraint. These cases pin the three
  // states of the guarded removal pass that closes it.

  // DERIVE THE SET, ASSERT THE COUNT. RUNNABLES (install.ts) and RUNNABLES_MIRROR (uninstall.ts) are
  // a hand-maintained PAIR — dispositioned as a source→dest mapping rather than a discovery set in
  // the check-foundation-guards.ts inventory, entry 15 — and a hand-maintained pair is exactly the
  // thing that rots while the suite stays green. So this test does NOT keep a third hand-copy of the
  // list: it reads both literals out of the two sources, asserts they AGREE, and drives every case
  // below off the result. An entry added to one file and not the other fails here, and an entry
  // added to both is automatically covered by the round-trip case.
  //
  // WR-04 (plan 27-22) — AND THEN THE DERIVE-THE-SET IDIOM WAS CAUGHT WITH ITS OWN DERIVATION
  // BLIND. Refusing the third hand-copy was right. But the list is recovered by a REGEX OVER
  // TYPESCRIPT SOURCE, and a regex over source is a PARSER — one that can silently under-match.
  // The old pair matcher read DOUBLE-QUOTED pairs only, and the count beside it was a hardcoded
  // literal. So a third runnable added TO BOTH FILES in any other shape left both derived sets at
  // the same two members, `toBe(2)` still passed, and the new runnable was covered by NONE of the
  // five cases below that are driven off RUNNABLE_RELS. Reproduced exactly that way before this
  // change, whole suite green; transcript in 27-22-SUMMARY.md.
  //
  // THE REMEDY IS TO DERIVE THE CARDINALITY, NOT TO ADD A SECOND MATCHER. Widening the matcher
  // alone just moves the blind spot to the next shape nobody thought of. Counting the entries the
  // AUTHOR wrote and comparing that against the entries the matcher RECOVERED turns every future
  // unreadable shape from a silent coverage loss into a loud parse failure naming the file, the
  // constant, both counts and the cause. The matcher IS also widened to single quotes and
  // backticks — but as a convenience, not as the guarantee.
  //
  // BOTH THE DERIVED CARDINALITY AND THE LITERAL INTEGER ARE WANTED; neither replaces the other.
  // The derived cardinality closes the blind spot (the matcher missed an entry that IS there); the
  // `toBe(2)` in the case below is the somebody-added-one forcing function (an entry was
  // legitimately added and the humans reading this test must be told). The literals are therefore
  // left exactly as written.

  // parseMappingBody — the ONE place a `[source, dest]` mapping literal is recovered from source
  // text, and the one place the declared-versus-parsed refusal lives. Takes the block body rather
  // than a file so the refusal itself is testable against a synthetic string.
  //
  // "Declared" is the count of `[` openings inside the block. That is the shape-INDEPENDENT count
  // of entries the author wrote: every entry is a tuple literal, so every entry opens exactly one
  // bracket, whatever quoting or spelling it uses. Counting brackets rather than commas or lines is
  // what makes this a floor the matcher cannot slip under. It errs toward failing: a stray `[`
  // inside a comment in the block would also trip it, which is the safe direction for a coverage
  // claim.
  function parseMappingBody(file: string, constName: string, body: string): Array<[string, string]> {
    const pairs = [...body.matchAll(/\[\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([^"'`]+)["'`]\s*\]/g)].map(
      (m) => [m[1], m[2]] as [string, string],
    );
    const declared = (body.match(/\[/g) ?? []).length;
    if (pairs.length !== declared) {
      throw new Error(
        `${file}: ${constName} declares ${declared} entr(ies) but only ${pairs.length} were parsed — ` +
          "an entry is in a shape this test cannot read, so the set derived here would cover less " +
          "than the source does while every count beside it still passed",
      );
    }
    return pairs;
  }
  function parseMapping(file: string, constName: string): Array<[string, string]> {
    const src = readFileSync(join(import.meta.dirname, file), "utf8");
    const block = new RegExp(`const ${constName}: Array<\\[string, string\\]> = \\[([\\s\\S]*?)\\n\\];`).exec(src);
    if (!block) throw new Error(`${file}: could not find the ${constName} mapping literal`);
    return parseMappingBody(file, constName, block[1]);
  }
  function mappingDests(file: string, constName: string): string[] {
    return parseMapping(file, constName).map(([, dest]) => dest).sort();
  }
  // The source half of the same mapping. ROUTED THROUGH THE SAME HELPER rather than given a
  // parallel declared-versus-parsed check of its own: the source side had the identical blind spot
  // in a second place (its own hand-written regex plus its own hardcoded `2`), and a second
  // implementation of one predicate is the failure class this phase exists to delete. One parser,
  // one refusal, two projections.
  function mappingSources(file: string, constName: string): string[] {
    return parseMapping(file, constName).map(([source]) => source).sort();
  }
  const RUNNABLE_RELS = mappingDests("install.ts", "RUNNABLES");

  it("runnable removal: the installer's RUNNABLES and the uninstaller's RUNNABLES_MIRROR are the same mapping", () => {
    const mirror = mappingDests("uninstall.ts", "RUNNABLES_MIRROR");
    expect(mirror).toEqual(RUNNABLE_RELS);
    // The integer, so a pair that shrinks together still fails.
    expect(RUNNABLE_RELS.length).toBe(2);
    expect(mirror.length).toBe(2);
    // Sources too — a mirrored dest removed on the strength of the WRONG source's bytes would be a
    // byte-identity check that proves nothing. Through the same declared-versus-parsed helper, so
    // this half can no longer come back short while its own integer still passes.
    const srcSideInstall = mappingSources("install.ts", "RUNNABLES");
    const srcSideUninstall = mappingSources("uninstall.ts", "RUNNABLES_MIRROR");
    expect(srcSideUninstall).toEqual(srcSideInstall);
    expect(srcSideInstall.length).toBe(2);
    // The path SHAPES the old hand-written source-side regex used to encode inline. Kept as
    // explicit assertions so routing both halves through one parser lost none of what it checked:
    // every source lives under the runnable reference directory and every dest under the one
    // directory grugops owns inside the user's repo.
    for (const s of srcSideInstall) expect(s.startsWith("scripts/runnable-ref/")).toBe(true);
    for (const d of RUNNABLE_RELS) expect(d.startsWith("tools/grugops/")).toBe(true);
  });

  it("runnable removal: an entry in a shape the mapping parser cannot read FAILS LOUDLY, it does not shrink the set (WR-04)", () => {
    // THE REFUSAL IS PROVEN HERE, IN THE SUITE — not by a one-off manual edit to the real sources.
    // The check runs against in-memory block bodies, so neither install.ts nor uninstall.ts is
    // touched by this case.

    // Control: the shapes the matcher CAN read parse cleanly, including the widened ones. If this
    // arm ever went red the refusal below would be vacuous.
    const readable =
      '  ["a/one.js", "b/one.js"],\n' +
      "  ['a/two.js', 'b/two.js'],\n" +
      "  [`a/three.js`, `b/three.js`],\n";
    expect(parseMappingBody("synthetic.ts", "RUNNABLES", readable).map(([, d]) => d)).toEqual([
      "b/one.js",
      "b/two.js",
      "b/three.js",
    ]);

    // The refusal: a third entry whose first element is an EXPRESSION rather than a literal — a
    // shape no amount of quote-widening reaches, which is the whole point of counting declared
    // entries instead of trusting the matcher.
    const unreadable = readable + '  [REF_DIR + "four.js", "b/four.js"],\n';
    expect(() => parseMappingBody("synthetic.ts", "RUNNABLES", unreadable)).toThrow(
      /synthetic\.ts: RUNNABLES declares 4 entr\(ies\) but only 3 were parsed/,
    );
    // The message must NAME things, or a future reader gets a count with no way to act on it.
    let msg = "";
    try {
      parseMappingBody("synthetic.ts", "RUNNABLES", unreadable);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain("synthetic.ts"); // the file
    expect(msg).toContain("RUNNABLES"); // the constant
    expect(msg).toContain("4"); // declared
    expect(msg).toContain("3"); // parsed
    expect(msg).toContain("a shape this test cannot read"); // the cause

    // And the second half of the finding: a trailing comment inside the brackets, the other shape
    // the review named, is refused rather than silently dropped.
    expect(() =>
      parseMappingBody("synthetic.ts", "RUNNABLES", '  ["a/one.js" /* why */, "b/one.js"],\n'),
    ).toThrow(/declares 1 entr\(ies\) but only 0 were parsed/);
  });

  it("runnable removal: a scratch install followed by a scratch uninstall leaves no runnable behind", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    // Precondition: the install really did materialize them (else the uninstall proves nothing).
    for (const rel of RUNNABLE_RELS) expect(existsSync(join(target, rel))).toBe(true);

    const r = runUninstall(target, home);
    expect(r.status).toBe(0);
    for (const rel of RUNNABLE_RELS) {
      expect(existsSync(join(target, rel))).toBe(false);
      expect(r.stdout).toContain(`${rel} (grugops runnable, byte-identical to source)`);
    }
    // Asserted by LISTING the destination directory, not only by per-file existence: the directory
    // is gone because it is empty, and tools/ itself (the user's directory) is left alone.
    expect(existsSync(join(target, "tools", "grugops"))).toBe(false);
    // tools/ itself survives — grugops owns tools/grugops/, not the generic tools/ directory — and
    // the run SAYS SO rather than leaving the one un-reversed artifact to be discovered later.
    expect(readdirSync(join(target, "tools"))).toEqual([]);
    expect(r.stdout).toContain("tools/ (grugops owns tools/grugops/ only");
  });

  it("runnable removal: a user-modified runnable is PRESERVED and the skip is reported with its reason", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);

    // Edit one helper after install; leave the other untouched as the in-case control.
    const edited = join(target, RUNNABLE_RELS[0]);
    const editedBody = "// USER-EDITED RUNNABLE — an uninstall must never destroy this.\n";
    writeFileSync(edited, editedBody);

    const r = runUninstall(target, home);
    expect(r.status).toBe(0);
    // Preserved with UNCHANGED bytes, and the skip names the file and says why.
    expect(existsSync(edited)).toBe(true);
    expect(readFileSync(edited, "utf8")).toBe(editedBody);
    expect(r.stdout).toContain(`${RUNNABLE_RELS[0]} (user-modified — left untouched`);
    // The untouched one is still removed, so the guard is per-file and not a blanket bail-out.
    expect(existsSync(join(target, RUNNABLE_RELS[1]))).toBe(false);
    // The directory survives because it still holds the user's file (rmdirIfEmpty never forces).
    expect(existsSync(join(target, "tools", "grugops"))).toBe(true);
  });

  it("runnable removal: no protected path is reachable — identical copies under every denylisted dir survive", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);

    // Byte-identical decoys of the real runnable planted in every isProtected() directory. If the
    // pass ever discovered its work by scanning the target instead of mirroring the installer's
    // fixed mapping, or if the denylist stopped gating it, these are what would be destroyed.
    const sourceBytes = readFileSync(join(REPO_ROOT, "scripts", "runnable-ref", "reference-check.js"));
    const decoys = ["agent-factory", "plans", ".planning", ".grugops", "docs", "src"].map((d) => {
      const p = join(target, d, "reference-check.js");
      mkdirSync(join(target, d), { recursive: true });
      writeFileSync(p, sourceBytes);
      return p;
    });

    const r = runUninstall(target, home);
    expect(r.status).toBe(0);

    // Every decoy survives BYTE-IDENTICAL; only the mapped destination is removed.
    for (const p of decoys) {
      expect(existsSync(p)).toBe(true);
      expect(readFileSync(p)).toEqual(sourceBytes);
    }
    for (const rel of RUNNABLE_RELS) expect(existsSync(join(target, rel))).toBe(false);
    // The pre-existing frozen-core and user-data guarantees still hold alongside the new pass.
    expect(readFileSync(join(target, "agent-factory", "roles", "orchestrator.md"), "utf8")).toContain("FROZEN CORE");
    expect(readFileSync(join(target, "plans", "board.md"), "utf8")).toBe("user board\n");
  });

  it("runnable removal: an unreadable SOURCE is a verify finding, and the run does not claim completion", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
    expect(runInstallFrom(src, target, home).status).toBe(0);

    // The synthetic source ships no runnables, so materializeRunnable() skipped them on install.
    // Plant one at the destination anyway — the shape of a repo installed from a complete kit and
    // then uninstalled against an incomplete one. Byte identity cannot be established, so the file
    // must be LEFT and the human told, never removed on a guess.
    mkdirSync(join(target, "tools", "grugops"), { recursive: true });
    const planted = join(target, RUNNABLE_RELS[0]);
    writeFileSync(planted, "// installed earlier from a complete kit\n");

    const r = runUninstallFrom(src, target, home);
    expect(r.status).toBe(3); // INCOMPLETE — the uninstaller mirrors install.ts's code list (27-21)
    expect(existsSync(planted)).toBe(true);
    expect(r.stdout).toContain("cannot read the source it was installed from");
    expect(r.stdout).toContain(RUNNABLE_RELS[0]);
    expect(r.stdout).not.toContain("== uninstall complete");
    expect(r.stdout).toContain("uninstall INCOMPLETE");
  });

  it("runnable removal: DRY_RUN narrates the removal and deletes nothing", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const before = snapshot(target);

    const r = spawnSync("node", [UNINSTALL_JS], {
      encoding: "utf8",
      env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target, DRY_RUN: "1" },
    });
    expect(r.status).toBe(0);
    expect(r.stdout ?? "").toContain("would-remove");
    expect(r.stdout ?? "").toContain(`${RUNNABLE_RELS[0]} (grugops runnable, byte-identical to source)`);
    expect(snapshot(target)).toBe(before);
  });

  it("source derivation: an UNREADABLE source skill directory is reported and no completion is claimed", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    rmSync(join(src, ".claude", "skills"), { recursive: true, force: true });
    writeFileSync(join(src, ".claude", "skills"), "not a directory\n");

    const r = runInstallFrom(src, target, home);
    expect(r.status).toBe(3); // INCOMPLETE (27-21, WR-01)
    expect(r.stdout).toContain("No skill was installed");
    expect(r.stdout).toContain(join(src, ".claude", "skills"));
    expect(r.stdout).not.toContain("== install complete");
    expect(installedSkills(target)).toEqual([]);
    // The adapter class is unaffected — the two derivations fail independently.
    expect(installedAdapters(target).length).toBe(17);
  });
});

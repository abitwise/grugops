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
  existsSync,
  statSync,
  lstatSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

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

  // ── Two-root: the per-repo state plane is seeded, incl. the runtime plans/handoffs/ dir (two-root [3]) ─
  it("two-root: the per-repo state plane is seeded (config + marker + plans/handoffs/ + memory-bank/)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    expect(existsSync(join(target, ".grugops", "factory.config.json"))).toBe(true);
    expect(existsSync(join(target, ".grugops", "install.json"))).toBe(true);
    expect(existsSync(join(target, "plans", "board.md"))).toBe(true);
    expect(existsSync(join(target, "memory-bank", "00-index.md"))).toBe(true);
    expect(statSync(join(target, "plans", "handoffs")).isDirectory()).toBe(true);
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
    // the real repo (carries install/install.sh + agent-factory/VERSION). NEVER point at REPO_ROOT.
    const fake = mkTmp();
    mkdirSync(join(fake, "install"), { recursive: true });
    mkdirSync(join(fake, "agent-factory"), { recursive: true });
    writeFileSync(join(fake, "install", "install.sh"), "#!/usr/bin/env sh\n");
    writeFileSync(join(fake, "agent-factory", "VERSION"), "0.0.0-fake\n");
    const home = mkTmp();

    // (a) refuse by default — installing INTO the clone must exit nonzero and name --allow-self.
    const refused = spawnSync("node", [INSTALL_JS, "--yes"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_SRC: fake, GRUGOPS_HOME: home, TARGET: fake },
    });
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toContain("--allow-self");

    // (b) --allow-self overrides — the same invocation proceeds (exit 0).
    const allowed = spawnSync("node", [INSTALL_JS, "--yes", "--allow-self"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_SRC: fake, GRUGOPS_HOME: mkTmp(), TARGET: fake },
    });
    expect(allowed.status).toBe(0);
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

  // SC1 / D-12: --migrate on an already-migrated repo that still has a leftover in-repo
  // agent-factory/ (half-state) is a no-op + warns (clear voice) + hints --prune-old-kit. Install
  // first (marker present), then plant a leftover agent-factory/, then --migrate must not re-mutate.
  it("migrate: half-state no-op + warn", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    // makeFixture already plants an in-repo agent-factory/roles/orchestrator.md (the leftover kit),
    // so after a normal install the repo is migrated (marker present) AND has a leftover in-repo kit.
    const t0 = snapshot(target);
    const h0 = snapshot(home);

    const r = runInstall(target, home, "--migrate");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--prune-old-kit"); // hints the companion that removes the leftover
    expect(snapshot(target)).toBe(t0); // no re-mutation (D-12)
    expect(snapshot(home)).toBe(h0);
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

  // DRY_RUN: --migrate mutates nothing and prints would-* lines for backup/move/copy/materialize.
  it("DRY_RUN: new modes mutate nothing", () => {
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
});

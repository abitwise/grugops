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
  lstatSync,
  statSync,
  chmodSync,
  symlinkSync,
  cpSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

// THE SHARED ADAPTER AUTHORITY — imported HERE, IN THE TEST ONLY (KIT-02 / D-18 as amended by
// D-28).
//
// THE REASON IS THE LAYOUT, NOT A FILE COUNT (WR-03). install.ts deliberately does not import
// scripts/kit-model.ts, and the locked reason is D-18's actual rationale: the installer stays
// decoupled from the `scripts/` LAYOUT, so a host can run the committed installer without the
// CI-side tree existing at all. It is emphatically NOT that the installer is a single file — as of
// D-28 the installer side is TWO files, the compiled entry point plus the shared install/
// kit-source.ts derivation module that both binaries import. This comment used to give the
// file-count reason, and it went stale the moment D-28 landed. The false version is deleted rather
// than softened: the only place a future reader finds the argument for answering one predicate in
// two implementations is right here, and a rationale that no longer holds is exactly how a
// deliberate exception quietly becomes an accident.
//
// WHAT BUYS THE EXCEPTION BACK. Three things, all in this file:
//   1. this import, which puts the authority's real answer in reach of the installer's cases;
//   2. the `source derivation` conformance case below, asserting the installer's REAL installed set
//      equals the authority's set over the same fixture, cardinality asserted as a NUMBER so a
//      derivation that silently shrinks fails the count and not only the comparison;
//   3. the THREE WR-03 equality cases below, which pin the NESTED walks against each other — member
//      equality over the two-path fixture (part 1), same-path-named refusal over the cycle fixture
//      (part 2), and same-directory-named refusal over the UNREADABLE fixture (part 3) — because
//      D-36 gives each side its own documented floor and one of them throws.
//
// THAT LIST WAS TWO PARTS LONG AND THE TWINS DIVERGED ON THE THIRD (D-41, CR-02). Part 3 is not an
// enrichment; it is the arm the divergence was actually on. The authority threw naming an unreadable
// directory while the installer's walk returned an empty set naming nothing, and both existing parts
// stayed green because neither of them looked at that arm. This list is kept CURRENT for the same
// reason the paragraph above deletes rather than softens its own stale rationale: a record of what
// buys a deliberate exception back is worth nothing once it stops describing the cases that exist.
// If the locked decision is ever revisited, this import and those cases are what to delete along
// with the duplicate. Drives the COMMITTED .js — the repo idiom.
import { listAgentAdapters, listSkillAdapters } from "../scripts/kit-model.js";

// THE CLOSED ALIAS VOCABULARY, IMPORTED HERE FOR THE SAME REASON AND UNDER THE SAME EXCEPTION
// (29.2-01). The model-delivery cases below assert that every alias an installed adapter carries is
// a member of the legal set, and that a refusal names that whole set. Both facts are ABOUT the
// vocabulary scripts/model-tiers.ts closes, so the test reads them from that module rather than
// restating four strings — a restated copy would keep passing after the set moved, which is the
// drift class this repository names as its second systemic failure. install.ts itself still imports
// nothing from scripts/; that boundary is about the INSTALLER's module graph, and this is the test.
import {
  MODEL_ALIASES,
  RESOLVED_PRESET_PREFIX,
  RESOLVED_ASSIGNMENT_PREFIX,
  resolvedPresetsIn,
  resolvedAssignmentsIn,
} from "../scripts/model-tiers.js";

// THE INSTALLER-SIDE WALK, IMPORTED DIRECTLY (D-35/D-36). The boundary cases below need to examine
// MAX_WALK_ENTRIES+1 directory entries; driving that through a full installer subprocess would
// print ten thousand verification lines to prove one threshold. The cycle-REPORT case still runs
// the compiled installer end to end, because what it pins is the reporting channel and the banner.
// Sized FROM the constant, never from a restated number. Drives the COMMITTED .js — the repo idiom.
import { srcNestedAdapterFiles, MAX_WALK_ENTRIES, SOURCE_MARKERS, hasSourceMarkers } from "./kit-source.js";

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

// plantSourceMarkers — make a throwaway directory read as a grugops source checkout, by writing
// EVERY entry of the imported SOURCE_MARKERS set (D-37). Derived, never restated: the marker paths
// appear in exactly one place in the tree (install/kit-source.ts) and every fixture below reads
// them from there, so a later change to the marker moves these stubs with it instead of leaving
// them manufacturing a stub for a marker nobody checks any more — which is the shape that let a
// marker naming a file deleted in f9dab9f survive about a hundred commits (CR-04, WR-02).
//
// `only` restricts the plant to a single entry, for the negative half: either marker ALONE must not
// read as a checkout, because agent-factory/VERSION legitimately appears in an ordinary target.
// NEVER call this on REPO_ROOT — every marker probe below runs on a mkTmp throwaway.
function plantSourceMarkers(dir: string, note: string, only?: string): void {
  for (const rel of SOURCE_MARKERS) {
    if (only !== undefined && rel !== only) continue;
    const p = join(dir, ...rel.split("/"));
    mkdirSync(dirname(p), { recursive: true });
    // A VERSION file is read back as a version STRING by the installer's marker writer, so it gets
    // a version-shaped body; anything else in the set is inert to every code path here.
    writeFileSync(p, rel.endsWith("VERSION") ? `0.0.0-${note}\n` : `// throwaway source-marker stub — ${note}\n`);
  }
}

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

// THE SYNTHETIC ADAPTER SET IS DERIVED FROM THE REAL ONE (29.2-01, D-01).
//
// It used to be seventeen invented names — `grugops-synthetic-role-01.md` and friends — so the
// derived-install cases asserted the DERIVATION and depended on no real adapter existing. Phase
// 29.2 makes the installer render each agent adapter by spawning the committed generator inside a
// temp mirror, and the generator derives its output names from `agent-factory/roles`. The install
// SET stays `srcAdapterFiles($GRUGOPS_SRC)` and the mirror is only the per-member BYTE source, so
// the two are cross-checked for SET EQUALITY IN BOTH DIRECTIONS before anything is written; an
// invented name is a member the render cannot produce, and under R-5 (no fallback byte source) that
// disagreement installs nothing at all.
//
// So the fixture is COUPLED TO THE REAL ROLES CORPUS ON PURPOSE, where it was deliberately
// decoupled before. What the derived-install cases lose is independence from the role corpus; what
// they keep — and what every one of them actually asserts — is that the installer's set comes from
// reading $GRUGOPS_SRC at run time and carries no adapter name literal anywhere in install.ts. The
// names below are still never written down here: they are read from the ONE authority for "what is
// an adapter", exactly as the conformance case reads them.
//
// grugops-orchestrator.md is a member of the real set too, so the 17-adapter update case can still
// pre-seed exactly the single-adapter v2.0 layout it needs.
const SYNTH_ADAPTERS: string[] = listAgentAdapters(REPO_ROOT).slice().sort();

// THE GENERATOR'S IMPORT CLOSURE AND KIT INPUTS, MIRRORED INTO EVERY SYNTHETIC SOURCE (29.2-01).
//
// A synthetic $GRUGOPS_SRC must now be RENDERABLE: the installer copies these same paths out of
// $GRUGOPS_SRC into its own temp mirror and spawns the generator there. A source missing them
// produces no adapter at all (R-5), which would turn every derived-install case below into an
// assertion about a fail-closed branch instead of about the derivation it was written for.
//
// THE MEMBERSHIP IS PINNED AGAINST install.ts's OWN LIST by a case in this file, so this fixture
// cannot silently fall one file behind the installer's closure. It is not a second authority — it
// is a fixture asserted equal to the authority.
const SYNTH_GENERATOR_TWINS: string[] = [
  "scripts/generate-role-adapters.js",
  "scripts/kit-model.js",
  "scripts/frontmatter.js",
  "scripts/model-tiers.js",
];
const SYNTH_GENERATOR_KIT_SOURCES: string[] = ["agent-factory/roles", "agent-factory/packaging"];

// plantRenderInputs — make a throwaway $GRUGOPS_SRC renderable by the install-time mirror spawn.
// Copies the four committed generator twins file-wise and the two kit source trees recursively, all
// out of the real repository. It plants NO `agent-factory/config`: the installer never copies that
// into its mirror either (D-06), and a fixture that shipped one would be asserting against a shape
// the installer cannot produce.
function plantRenderInputs(src: string): void {
  mkdirSync(join(src, "scripts"), { recursive: true });
  for (const rel of SYNTH_GENERATOR_TWINS) {
    cpSync(join(REPO_ROOT, ...rel.split("/")), join(src, ...rel.split("/")));
  }
  for (const rel of SYNTH_GENERATOR_KIT_SOURCES) {
    cpSync(join(REPO_ROOT, ...rel.split("/")), join(src, ...rel.split("/")), { recursive: true });
  }
}

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
// makeSymlinkDag — the WR-01 shape: a CROSS-LINKED DIRECTORY DAG WITH NO CYCLE ANYWHERE.
//
// `d0 .. dn` are real sibling directories under `dir`; each `di` holds TWO forward symlinks (`a`
// and `b`) pointing at `d(i+1)`, and `dn` holds one leaf `.md` file. Every link points FORWARD, so
// no directory ever repeats on a recursion path and the per-path ancestor stack correctly answers
// "no cycle" at every single step. The number of DISTINCT RELATIVE PATHS to the leaf nevertheless
// DOUBLES with each added directory. That is the entire WR-01 argument in one fixture: a correct
// cycle answer is not a work bound, and only a separate work bound bounds this.
//
// scripts/kit-model.test.ts carries a helper of the same name and shape. The two test files share
// no helper module today; adding one is out of scope for this round.
function makeSymlinkDag(dir: string, n: number): void {
  for (let i = 0; i <= n; i++) mkdirSync(join(dir, `d${i}`), { recursive: true });
  for (let i = 0; i < n; i++) {
    symlinkSync(join("..", `d${i + 1}`), join(dir, `d${i}`, "a"));
    symlinkSync(join("..", `d${i + 1}`), join(dir, `d${i}`, "b"));
  }
  writeFileSync(join(dir, `d${n}`, "leaf.md"), "---\nname: leaf\n---\n");
}

function makeSyntheticSrc(): string {
  const src = mkTmp();
  // The render inputs FIRST: the roles corpus this plants is what decides the rendered adapter
  // names, and SYNTH_ADAPTERS is derived from the same corpus in the real repository.
  plantRenderInputs(src);
  mkdirSync(join(src, "agent-factory", "seed", ".grugops"), { recursive: true });
  mkdirSync(join(src, ".claude", "agents"), { recursive: true });
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

// linkifyMember — REPLACE an existing source adapter with a SYMLINK to ANOTHER existing member of
// the same directory. The set is unchanged in NAME and in CARDINALITY; what changes is one member's
// REPRESENTATION, which is exactly what WR-02 is about: readdirSync(withFileTypes) reports a symlink
// as isSymbolicLink() — NEITHER isFile() NOR isDirectory() — so a Dirent-flag filter drops it while
// a statSync filter (which FOLLOWS the link, as the platform does) keeps it. A derivation that
// diverges on that flag still installs a member the reversal cannot see, or the other way round.
//
// WHY IT REPLACES RATHER THAN ADDS (29.2-01). These plants used to ADD an eighteenth adapter. The
// installer now cross-checks its install set against the mirror's RENDERED set for equality in both
// directions, and the render produces exactly the names the roles corpus defines — so an added
// eighteenth is a member no render can produce, and the run would refuse the whole adapter class
// instead of exercising the derivation these cases are about. Replacing an existing member keeps the
// forcing function intact and removes the false disagreement: the link and its target remain two
// DISTINCT members of one directory, which is the KIT-01 adjacency edge the cases pin.
function linkifyMember(src: string, linkName: string, targetName: string): void {
  const agents = join(src, ".claude", "agents");
  rmSync(join(agents, linkName), { force: true });
  symlinkSync(join(agents, targetName), join(agents, linkName));
}

// ── THE CR-02 UNREADABLE-NEST FIXTURE, BUILT ONCE AND SHARED (D-41) ──────────────────────────
//
// TWO cases need this exact shape — the harness case that pins the installer's behaviour and WR-03
// part 3 that pins the two derivations against each other over it — so it is built by ONE builder.
// A second copy of a fixture is the same drift class as a second copy of a predicate: the two
// would diverge, and the case that noticed would be whichever one was read last.
//
// `rel` is the nested directory's relative path as the installer names it, and `member` is the
// adapter inside it — the member that vanished. Neither is restated at a call site.
const UNREADABLE_NEST_REL = "nested";
const UNREADABLE_NEST_MEMBER = "nested/hidden.md";
function makeUnreadableNestFixture(): { src: string; nest: string } {
  const src = makeSyntheticSrc();
  const nest = join(src, ".claude", "agents", UNREADABLE_NEST_REL);
  mkdirSync(nest, { recursive: true });
  writeFileSync(join(nest, "hidden.md"), `> synthetic nested adapter\n${MAT_SLOT}\n`);
  return { src, nest };
}

// restrictAndProbe — apply `mode` to `dir` and then PROBE whether this process can still read it.
//
// A CASE THAT CANNOT BUILD ITS FIXTURE ASSERTS NOTHING, and a chmod-based fixture is the kind that
// silently stops being a fixture: root bypasses the mode bits and Windows does not honour them at
// all, so `chmod 000` there leaves a perfectly readable directory and every assertion below it
// becomes a statement about nothing. So the restriction is VERIFIED rather than assumed, and the
// caller is handed the reason to PRINT when it did not take. A silently skipping case is worse
// than no case; a case that names why it skipped is honest.
function restrictAndProbe(dir: string, mode: number): { restricted: boolean; reason: string } {
  chmodSync(dir, mode);
  try {
    readdirSync(dir);
  } catch {
    return { restricted: true, reason: `${dir} is unreadable at mode ${mode.toString(8)}` };
  }
  return {
    restricted: false,
    reason:
      `SKIP: ${dir} is STILL READABLE after chmod ${mode.toString(8)} — the runner is privileged ` +
      `(uid ${typeof process.getuid === "function" ? process.getuid() : "n/a"}) or platform ` +
      `${process.platform} does not honour POSIX mode bits. The fixture does not exist here, so ` +
      `this case asserts nothing rather than asserting vacuously.`,
  };
}

// runInstallFrom / runUninstallFrom — the runInstall/runUninstall pair with an explicit
// $GRUGOPS_SRC so a case can drive a synthetic kit instead of this repo.
function runInstallFrom(src: string, target: string, home: string, ...args: string[]) {
  const r = spawnSync("node", [INSTALL_JS, "--yes", ...args], {
    encoding: "utf8",
    // spawnSync's default maxBuffer is 1 MB, and exceeding it KILLS the child and reports
    // `status: null` — an outcome indistinguishable from a crash. The D-35 DAG case legitimately
    // produces thousands of by-name refusals before the work bound trips, so the cap is raised to
    // keep a truthful exit code readable. This changes what the HARNESS can capture, never what the
    // installer does.
    maxBuffer: 64 * 1024 * 1024,
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
    // THE SENTINEL IS VALID JSON (29.2-01). It used to be a bare token, which was fine when nothing
    // read this file during an install. The adapter render now hands the target's own configuration
    // to the mirrored generator, and a present-but-unparseable configuration is a NAMED REFUSAL by
    // design (D-03) — "a user who edited that file meant something by it" — so a garbage body would
    // make this case assert the refusal path rather than the never-overwrite contract it is for.
    // The contract asserted is unchanged: the exact bytes present before the run are present after.
    writeFileSync(
      join(target, ".grugops", "factory.config.json"),
      '{ "_sentinel": "SENTINEL-USER-CONFIG-DO-NOT-CLOBBER" }\n',
    );
    const preConfig = readFileSync(join(target, ".grugops", "factory.config.json"), "utf8");
    expect(runInstall(target, home).status).toBe(0);
    expect(readFileSync(join(target, ".grugops", "factory.config.json"), "utf8")).toBe(preConfig);
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
    // the real repo. NEVER point at REPO_ROOT.
    // CR-04: the planted marker was `install/install.sh` until the pair was corrected — a file
    // deleted in f9dab9f with the POSIX installer, so this fixture asserted a marker half that
    // could not fire and the case passed on the path-equality half alone (TARGET === GRUGOPS_SRC
    // here). D-37 goes further: the plant is now DERIVED from the imported SOURCE_MARKERS set, so
    // it cannot go stale against the guard the way the literal did. The marker half itself gets its
    // own cases below, on targets that are NOT the source root.
    //
    // D-16 (29.2): THIS CASE IS ALSO THE PIN FOR "THE KIT'S OWN COMMITTED ADAPTERS STAY `inherit`".
    // Phase 29.1 D-04 fixed the kit's seventeen committed adapters at `model: inherit`, and phase
    // 29.2 gave the installer a render that resolves a TARGET's models block into the adapters it
    // lays down. The thing that keeps those two facts from colliding is THIS guard: install refuses
    // a source-shaped target BEFORE any render happens, so a models block in a target configuration
    // can never be rendered into the kit's own committed adapters through this path. The fixture
    // below therefore carries a models block as well as the source markers.
    const fake = mkTmp();
    plantSourceMarkers(fake, "fake");
    mkdirSync(join(fake, ".grugops"), { recursive: true });
    writeFileSync(join(fake, ".grugops", "factory.config.json"), '{"models":{"preset":"tiered"}}\n');
    const home = mkTmp();

    // (a) refuse by default — installing INTO the clone must exit nonzero and name --allow-self.
    const refused = spawnSync("node", [INSTALL_JS, "--yes"], {
      encoding: "utf8",
      env: { ...process.env, GRUGOPS_SRC: fake, GRUGOPS_HOME: home, TARGET: fake },
    });
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toContain("--allow-self");
    // D-16: the refusal fired BEFORE any render — nothing was written into the source-shaped target
    // and the run never reached the adapter class at all.
    expect(`the refused run rendered adapters: ${refused.stdout?.includes("-- adapters --") ?? false}`).toBe(
      "the refused run rendered adapters: false",
    );
    expect(`the refused run materialized anything: ${(refused.stdout ?? "").includes("materialized")}`).toBe(
      "the refused run materialized anything: false",
    );
    expect(existsSync(join(fake, ".claude", "agents"))).toBe(false);

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
    //
    // D-16'S FLAGGED ITEM, RECORDED RATHER THAN FABRICATED (R-4, 29.2). `--allow-self` is a
    // deliberate reach-around: it bypasses the guard by design. `--allow-self --target <the real
    // checkout>` is a USER ACTION outside any test's reach — this suite never points a binary at
    // REPO_ROOT, and a case that pretended to prove the arm safe would be a false claim in the file
    // whose job is true ones. So NO assertion below claims that arm is proven. What actually
    // catches a moved committed adapter is the CI backstop, and it is named here so a future reader
    // does not have to reconstruct it: `npm run freshness:adapters` (pinned to the zero-config
    // resolution by 29.1 D-04, so a committed adapter that stopped saying `inherit` reds it) together
    // with the `guard_model_assignment` foundation guard. Neither is weakened by this phase.
    expect(allowed.status).toBe(3);
    expect(allowed.status).not.toBe(1);
    expect(allowed.stderr ?? "").not.toContain("--allow-self");
    expect(allowed.stdout ?? "").toContain("install INCOMPLETE");
  });

  // ── CR-04: the SAME self-checkout guard on the UNINSTALLER — the refusal install/README.md's ──
  // exit-code table publishes for BOTH binaries. Before this guard existed, uninstall.js had no
  // exit-1 path at all (only 2 for bad usage and 3 for incomplete), and pointing it at a grugops
  // checkout removed the kit's own 17 committed adapters and 7 committed skills under
  // `== uninstall complete ==` and exit 0 — isProtected() covers agent-factory/, plans/,
  // .planning/, .grugops/, docs/ and src/, but not .claude/, which is where they live.
  it("CR-04 self-checkout guard: uninstall.js refuses a source-shaped target (exit 1, nothing removed); --allow-self overrides", () => {
    // A THROWAWAY source-shaped stub — NEVER REPO_ROOT. Carries the source markers (derived from
    // the imported set, D-37) so it reads as a checkout, and is passed as BOTH src and target so
    // the path-equality half fires too.
    const fake = mkTmp();
    plantSourceMarkers(fake, "fake");
    // Plant the shapes the reproduction destroyed, so "nothing was removed" is a claim with
    // something behind it rather than a snapshot of an empty tree.
    mkdirSync(join(fake, ".claude", "agents"), { recursive: true });
    mkdirSync(join(fake, ".claude", "skills", "grugops"), { recursive: true });
    writeFileSync(join(fake, ".claude", "agents", "grugops-orchestrator.md"), "COMMITTED KIT ADAPTER\n");
    writeFileSync(join(fake, ".claude", "skills", "grugops", "SKILL.md"), "COMMITTED KIT SKILL\n");
    const before = snapshot(fake);

    // (a) refuse by default — exit 1 exactly (the code the README's refusal row publishes), the
    //     refusal names the override on stderr, and the target is BYTE-IDENTICAL afterwards.
    const refused = runUninstallFrom(fake, fake, mkTmp());
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain("--allow-self");
    expect(refused.stderr).toContain("refusing");
    // Nothing on stdout: a refused run never reaches the banner, so there is no completion line
    // for a script to misread (the reproduced defect printed "== uninstall complete ==").
    expect(refused.stdout).toBe("");
    expect(snapshot(fake)).toBe(before);
    expect(existsSync(join(fake, ".claude", "agents", "grugops-orchestrator.md"))).toBe(true);
    expect(existsSync(join(fake, ".claude", "skills", "grugops", "SKILL.md"))).toBe(true);

    // (b) --allow-self overrides — the flag REACHES the argument loop and the run PROCEEDS PAST
    //     THE GUARD. WHAT THIS ARM PINS IS THE GUARD, NOT COMPLETENESS — the installer arm's
    //     hard-won lesson (27-21, WR-01), applied here rather than re-learned. The assertions are
    //     deliberately guard-shaped and NOT `toBe(0)`: a success code would couple this arm to
    //     whatever the throwaway stub happens to make the removal sequence conclude, which has
    //     nothing to do with whether the override worked.
    //       - status is NOT 1  → the guard did not refuse (1 is the refusal code),
    //       - status is NOT 2  → the flag was recognised, not rejected as an unknown argument.
    //                            This is the load-bearing one: uninstall.js exits 2 on ANY
    //                            unparsed argument, so an override missing from the loop would be
    //                            rejected as bad usage before the guard it overrides ever ran,
    //       - no refusal on stderr → the refusal message was not printed,
    //       - the run banner was reached → it got into the removal sequence.
    const allowed = runUninstallFrom(fake, fake, mkTmp(), "--allow-self");
    expect(allowed.status).not.toBe(1);
    expect(allowed.status).not.toBe(2);
    expect(allowed.stderr).not.toContain("refusing");
    expect(allowed.stdout).toContain("== grugops uninstall ==");
  });

  // ── CR-04, the MARKER half — the direction the path-equality half cannot cover, and the one the ─
  // dead `install/install.sh` marker made unreachable. The target is NOT the source root (a second
  // checkout, named by --target from a first), but it carries the SOURCE_MARKERS set, so it must
  // still be refused.
  it("CR-04 marker half: a NON-source-root target carrying the source markers is refused (exit 1)", () => {
    const src = makeSyntheticSrc(); // a real, readable kit source — NOT the target
    const marked = mkTmp();
    plantSourceMarkers(marked, "second-checkout");
    const before = snapshot(marked);

    const r = runUninstallFrom(src, marked, mkTmp());
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("--allow-self");
    expect(snapshot(marked)).toBe(before);

    // Prove the refusal is the PAIR, not either half alone: agent-factory/VERSION on its own is a
    // shape an ordinary repo legitimately has (install/README.md §1's minimal path tells users to
    // copy agent-factory/ into their own repo), so refusing on it would break a real reversal.
    const halfOnly = mkTmp();
    plantSourceMarkers(halfOnly, "users-own-copy", "agent-factory/VERSION");
    const half = runUninstallFrom(src, halfOnly, mkTmp());
    expect(half.status).not.toBe(1);
    expect(half.stderr).not.toContain("refusing");
  });

  // ── D-37 / WR-02: THE FORCING FUNCTION. Read-only, over the REAL repository, NO fixture. ──────
  //
  // This is the case whose ABSENCE is WR-02. Every other assertion about the self-checkout guard in
  // this file — all three above — manufactures its own stub, so each one asserts something about
  // the PREDICATE over a FIXTURE and every one of them stays green when the real file moves. That
  // is precisely how a marker naming `install/install.sh` survived about a hundred commits after
  // f9dab9f deleted it (D-09): the guard's condition could not fire, and nothing anywhere asked
  // whether the file it named was real. Round 3 corrected the literal and added no forcing
  // function, which is the same defect one rename away.
  //
  // So: walk the IMPORTED constant over the ACTUAL repo root and require every entry to be there.
  // Importing rather than restating is load-bearing — a restated copy would pass while the guard
  // pointed at a ghost, which is the bug. The LENGTH is asserted as a number alongside the loop,
  // per this repository's derive-the-set-assert-the-count rule: an empty or shortened set makes the
  // `every`-shaped loop vacuously green, so the count is what catches a member silently dropped.
  //
  // Nothing here writes, and REPO_ROOT is never passed to a binary as a target — this case reads.
  it("SOURCE_MARKERS: every marker EXISTS in the real repository, and the set is exactly two (D-37, WR-02)", () => {
    for (const rel of SOURCE_MARKERS) {
      // Interpolated so a failure NAMES the missing marker instead of reporting `false !== true`.
      expect(`${rel}: ${existsSync(join(REPO_ROOT, ...rel.split("/")))}`).toBe(`${rel}: true`);
    }
    // The count, as a number — a dropped member fails HERE even when the loop above is vacuous.
    expect(SOURCE_MARKERS.length).toBe(2);
    // And the predicate itself, over the real checkout it exists to recognise.
    expect(hasSourceMarkers(REPO_ROOT)).toBe(true);
  });

  // ── D-37: the marker half is the SHARED predicate, and BOTH binaries answer it identically ────
  //
  // Until D-37 each binary carried its own byte-identical copy of the marker strings. The pair is
  // now one imported predicate, so this case pins the consequence: a throwaway carrying ONLY the
  // markers (no path equality with the source root) is refused with exit 1 by install.js AND by
  // uninstall.js, and a throwaway carrying exactly ONE marker is refused by neither.
  //
  // The negative half loops over EVERY member rather than testing one, which also pins that the
  // membership test is order-independent: no single entry can decide the answer, whichever it is.
  it("D-37: the shared marker predicate refuses BOTH binaries on the full set, and neither on a half", () => {
    const src = makeSyntheticSrc(); // a real, readable kit source — never the target

    // (a) the FULL set on a target that is NOT the source root → both binaries refuse with 1.
    const marked = mkTmp();
    plantSourceMarkers(marked, "marker-only");
    const before = snapshot(marked);

    const inst = spawnSync("node", [INSTALL_JS, "--yes"], {
      encoding: "utf8",
      env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: src, GRUGOPS_HOME: mkTmp(), TARGET: marked },
    });
    expect(`install.js: ${inst.status}`).toBe("install.js: 1");
    expect(inst.stderr).toContain("--allow-self");

    const unin = runUninstallFrom(src, marked, mkTmp());
    expect(`uninstall.js: ${unin.status}`).toBe("uninstall.js: 1");
    expect(unin.stderr).toContain("--allow-self");

    // Neither refusal touched the target — a refused run changes nothing, in either direction.
    expect(snapshot(marked)).toBe(before);

    // (b) EXACTLY ONE marker, for every member in turn → neither binary refuses on the marker half.
    for (const only of SOURCE_MARKERS) {
      const halfOnly = mkTmp();
      plantSourceMarkers(halfOnly, "half", only);
      expect(hasSourceMarkers(halfOnly)).toBe(false);

      const i = spawnSync("node", [INSTALL_JS, "--yes"], {
        encoding: "utf8",
        env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: src, GRUGOPS_HOME: mkTmp(), TARGET: halfOnly },
      });
      expect(`install.js/${only}: ${i.status === 1}`).toBe(`install.js/${only}: false`);
      expect(i.stderr ?? "").not.toContain("--allow-self");

      const u = runUninstallFrom(src, halfOnly, mkTmp());
      expect(`uninstall.js/${only}: ${u.status === 1}`).toBe(`uninstall.js/${only}: false`);
      expect(u.stderr ?? "").not.toContain("refusing");
    }
  }, 60_000);

  // ── CR-04 NEGATIVE CONTROL — without this, the guard could be satisfied by refusing everything. ─
  // A normal installed repository must uninstall exactly as it did before the guard landed: same
  // exit code, adapters and skills actually removed, user content preserved.
  it("CR-04 negative control: a normal installed target is NOT refused and still uninstalls (exit 0)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    expect(existsSync(join(target, ".claude", "agents"))).toBe(true);

    const r = runUninstall(target, home);
    // The previous exit code, unchanged — the guard buys safety without breaking the reversal.
    expect(r.status).toBe(0);
    expect(r.stderr).not.toContain("refusing");
    expect(r.stdout).toContain("== uninstall complete ==");
    // The reversal still happened...
    expect(existsSync(join(target, ".claude", "agents"))).toBe(false);
    expect(existsSync(join(target, ".claude", "skills"))).toBe(false);
    // ...and the user's own content is untouched, as always.
    expect(existsSync(join(target, "agent-factory", "roles", "orchestrator.md"))).toBe(true);
    expect(existsSync(join(target, "plans", "board.md"))).toBe(true);
    expect(readFileSync(join(target, "CLAUDE.md"), "utf8")).toContain("must be preserved");
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

  // ─────────────────────────────────────────────────────────────────────────────────────────────
  // THE STALENESS VERDICT (29.2 plan 02, D-09 / D-10). `--check` can now say that a configuration
  // edit has not reached the adapters yet.
  //
  // It renders from GRUGOPS_SRC (R-3), because the remedy the finding names is a re-run of install
  // FROM THIS CHECKOUT — so the question the comparison answers is "would that re-run change this
  // file?", which is a checkout question and not a kit-home one. It compares WHOLE FILES: no
  // frontmatter is parsed anywhere in the doctor, and the render is put through the same transform
  // an install would apply, so the two sides are like-for-like.
  //
  // These cases drive the REAL repository as $GRUGOPS_SRC (the default when the variable is unset),
  // which is what the existing doctor cases above already do.
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // runCheck — a --check run over an installed target, optionally from a different kit checkout and
  // with extra flags. The doctor's own default for GRUGOPS_SRC is the checkout install.js lives in,
  // which is the repository under test.
  function runCheck(
    target: string,
    home: string,
    opts: { src?: string; args?: string[] } = {},
  ): { status: number | null; stdout: string } {
    const env: NodeJS.ProcessEnv = { ...process.env, GRUGOPS_HOME: home, TARGET: target };
    if (opts.src !== undefined) env.GRUGOPS_SRC = opts.src;
    const r = spawnSync("node", [INSTALL_JS, "--check", ...(opts.args ?? [])], {
      encoding: "utf8",
      env,
    });
    return { status: r.status, stdout: r.stdout ?? "" };
  }

  it("doctor: a --check run immediately after a clean install reports NO staleness line at all (D-09)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    // PREMISE: the install really did lay adapters down, so the comparison below has something to
    // compare. A clean verdict over an empty set would be vacuous.
    expect(installedAdapters(target).length).toBe(17);

    const doc = runCheck(target, home);
    expect(`status=${doc.status}`).toBe("status=0");
    expect(doc.stdout).toContain("ALL CHECKS PASSED");
    expect(`names a stale adapter: ${doc.stdout.includes("stale adapter")}`).toBe(
      "names a stale adapter: false",
    );
    // ...and it is a VERDICT, not an absence of one.
    expect(`claims no verdict: ${doc.stdout.includes("NO VERDICT on adapter staleness")}`).toBe(
      "claims no verdict: false",
    );
  });

  it("doctor: a configuration edited AFTER install names every stale adapter and the re-run remedy — WARN bare, FAIL under --strict (D-09, D-10)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const rels = installedAdapters(target);
    expect(rels.length).toBe(17);
    // PREMISE 1: before the edit, the doctor really is clean about staleness. Without this the
    // warning below could be an artefact of the fixture rather than of the edit.
    expect(runCheck(target, home).stdout.includes("stale adapter")).toBe(false);

    // PREMISE 2: the edit landed on disk, at the path the render reads.
    const configPath = writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');
    expect(existsSync(configPath)).toBe(true);
    expect(readFileSync(configPath, "utf8")).toContain('"tiered"');
    // ...and it has NOT been applied: the installed adapters still carry the old resolution.
    expect([...new Set(targetModelLines(target))]).toEqual(["inherit"]);

    const bare = runCheck(target, home);
    // D-10: a WARN, so the exit stays 0 and the banner carries a warning count.
    expect(`status=${bare.status}`).toBe("status=0");
    expect(bare.stdout).toContain("ALL CHECKS PASSED");
    expect(bare.stdout).toMatch(/warning\(s\)/);
    expect(bare.stdout).toContain("stale adapter");
    // EVERY stale file is NAMED — a count with no names is a finding a reader cannot act on.
    for (const rel of rels) {
      expect(`${rel} named: ${bare.stdout.includes(rel)}`).toBe(`${rel} named: true`);
    }
    // ...and the remedy is the re-run, named as such.
    expect(bare.stdout).toContain("install.js --target");
    // Nothing was written into the target while it looked.
    expect(targetModelLines(target).every((m) => m === "inherit")).toBe(true);

    // D-10's other half: --strict promotes it to a failure.
    const strict = runCheck(target, home, { args: ["--strict"] });
    expect(`status=${strict.status}`).toBe("status=1");
    expect(strict.stdout).toContain("promoted to failure");
    expect(strict.stdout).toContain("stale adapter");
  });

  it("doctor: a --check run over a STALE target leaves the target byte-identical (T-29.2-10)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');
    const pre = snapshot(target);
    // PREMISE: this run is the one that actually renders — a read-only claim over a run that never
    // reached the render would prove nothing.
    const doc = runCheck(target, home);
    expect(doc.stdout).toContain("stale adapter");
    expect(snapshot(target)).toBe(pre);
  });

  it("doctor: a checkout MISSING a generator module states that NO VERDICT on adapter staleness was produced, and never a clean one (D-09)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);

    // Every twin in turn, so the case cannot pass by covering whichever one is checked first.
    for (const twin of SYNTH_GENERATOR_TWINS) {
      const partial = makeSyntheticSrc();
      rmSync(join(partial, ...twin.split("/")), { force: true });
      expect(existsSync(join(partial, ...twin.split("/")))).toBe(false);

      const doc = runCheck(target, home, { src: partial });
      // A WARNING, matching the tier D-10 sets for the whole feature...
      expect(`${twin}: status=${doc.status}`).toBe(`${twin}: status=0`);
      expect(`${twin}: named=${doc.stdout.includes(twin)}`).toBe(`${twin}: named=true`);
      // ...stating the ABSENCE OF A VERDICT rather than a clean one.
      expect(doc.stdout).toContain("NO VERDICT on adapter staleness");
      expect(`${twin}: claims a clean compare: ${doc.stdout.includes("stale adapter")}`).toBe(
        `${twin}: claims a clean compare: false`,
      );
      // ...and --strict escalates it, like every other warning.
      const strict = runCheck(target, home, { src: partial, args: ["--strict"] });
      expect(`${twin}: strict status=${strict.status}`).toBe(`${twin}: strict status=1`);
    }
  });

  it("doctor: a fresh render producing members the kit's adapter set does not carry states that NO VERDICT was produced for them (D-09)", () => {
    // THE BYPASS, REPRODUCED 2026-09-04 AGAINST THE COMMITTED install.js. The doctor iterates the
    // set it derives from the checkout's own adapter directory and compares each member against the
    // fresh render. It catches a member it has that the render does not produce. It never asks the
    // OTHER direction — a member the render produces that its set does not carry — so a checkout
    // whose adapter directory is SHORT reports a clean verdict over a subset and says nothing about
    // the members it never asked about. Measured: a checkout carrying ONE of the seventeen adapters,
    // against a target whose seventeen were all stale, printed `ALL CHECKS PASSED (1 warning(s))` at
    // exit 0, naming exactly one file.
    //
    // A VACUITY FLOOR CATCHES AN EMPTY DENOMINATOR AND NEVER A SILENTLY SHORT ONE. The doctor's
    // `docNames.length > 0` guard is that floor; this case is the short one it cannot see. The
    // second listing is not a new derivation — the render helper already returns its own output
    // listing, and this side simply has to ask it.
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    // PREMISE: the pre-damage doctor was clean, so every line below is caused by the damage.
    expect(runCheck(target, home).status).toBe(0);

    const short = makeSyntheticSrc();
    const keep = SYNTH_ADAPTERS[0];
    for (const a of SYNTH_ADAPTERS.slice(1)) rmSync(join(short, ".claude", "agents", a), { force: true });
    // PREMISE, ASSERTED: the checkout is short by sixteen while its roles corpus is complete, so
    // the render still produces every member. A fixture that shortened BOTH sides would make this
    // case pass for the reason it exists to refuse.
    expect(readdirSync(join(short, ".claude", "agents")).sort()).toEqual([keep]);
    expect(SYNTH_ADAPTERS.length).toBeGreaterThan(1);

    const doc = runCheck(target, home, { src: short });
    expect(doc.stdout).toContain("NO VERDICT on adapter staleness");
    // Every member the render produced but the set does not carry is NAMED — a count alone would
    // say the two disagree and never which member went unasked.
    const unnamed = SYNTH_ADAPTERS.slice(1).filter((a) => !doc.stdout.includes(a));
    expect(unnamed, `every unasked member must be named; stdout was:\n${doc.stdout}`).toEqual([]);
    // The tier is unchanged: a WARN by default, promoted under --strict like every other one.
    expect(`status=${doc.status}`).toBe("status=0");
    expect(runCheck(target, home, { src: short, args: ["--strict"] }).status).toBe(1);
  });

  it("doctor: a REFUSED configuration is relayed with the REAL configuration path, never only the temp mirror's (D-09)", () => {
    // FOUND BY AN INDEPENDENT REVIEW OF THIS PHASE'S DIFF (29.2-03 task 2). The install arm ends its
    // relay with a sentence naming TARGET/.grugops/factory.config.json and disclaiming any path
    // inside the relayed message; the doctor's arm relayed the same message without it. Reproduced
    // against the committed build: `--check` over a target carrying an illegal preset printed a
    // remedy naming a temp mirror directory that had already been removed when the line printed.
    // Nothing a reader is handed may name a path that does not exist on their machine.
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    expect(runCheck(target, home).status).toBe(0);

    mkdirSync(join(target, ".grugops"), { recursive: true });
    writeFileSync(
      join(target, ".grugops", "factory.config.json"),
      JSON.stringify({ models: { preset: "turbo" } }) + "\n",
    );
    const doc = runCheck(target, home);
    expect(doc.stdout).toContain("NO VERDICT on adapter staleness");

    // THE ASSERTION IS BOUNDED TO THE FINDING, AND THAT BOUND IS THE WHOLE CASE. Written first as a
    // toContain over the WHOLE stdout, it passed against the UNFIXED build — because the doctor's
    // ordinary stat list already prints `ok  <target>/.grugops/factory.config.json` on its own line.
    // A green for a reason that has nothing to do with the claim. The finding block is a docWarn
    // line plus the continuation lines indented under its padded label, so it is sliced out and
    // asked about on its own.
    const lines = doc.stdout.split("\n");
    const at = lines.findIndex((l) => l.includes("NO VERDICT on adapter staleness"));
    expect(at, "PREMISE: the no-verdict finding must be present to be asked about").toBeGreaterThan(-1);
    let end = at + 1;
    while (end < lines.length && lines[end].startsWith("                 ")) end += 1;
    const block = lines.slice(at, end).join("\n");

    // PREMISE: the generator's own refusal really is relayed inside this block, and it really does
    // carry a temp-mirror path — without both, the leak this case exists for is not in the input.
    expect(block, "PREMISE: the generator's refusal must be relayed inside the finding").toContain("turbo");
    expect(block, "PREMISE: the relayed text must carry a temp-mirror path, or there is no leak to disclaim")
      .toContain("grugops-install-render-");

    // THE CLAIM: the real path on this machine is named inside the same finding.
    expect(block).toContain(join(target, ".grugops", "factory.config.json"));
    expect(`status=${doc.status}`).toBe("status=0");
    expect(runCheck(target, home, { args: ["--strict"] }).status).toBe(1);
  });

  it("doctor: a target with a FAILING cross-check reports that primary defect and produces no staleness lines at all (D-09)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    // PREMISE: the pre-damage doctor was clean, so the absence below is caused by the damage.
    expect(runCheck(target, home).status).toBe(0);

    rmSync(join(home, "agent-factory"), { recursive: true, force: true });
    const doc = runCheck(target, home);
    expect(`status=${doc.status}`).toBe("status=1");
    expect(doc.stdout).toContain("FAIL");
    // The WARN tier — staleness included — runs only when the cross-check and the stats are clean,
    // so a broken target reports its primary defect rather than a wall of derived lines.
    expect(`stale lines: ${doc.stdout.includes("stale adapter")}`).toBe("stale lines: false");
    expect(`no-verdict lines: ${doc.stdout.includes("NO VERDICT on adapter staleness")}`).toBe(
      "no-verdict lines: false",
    );
  });

  it("doctor: the header sentence stops denying what the doctor now does, and states the invariant that IS true", () => {
    const src = readFileSync(join(import.meta.dirname, "install.ts"), "utf8");
    const start = src.indexOf("// Doctor (INSTALL-05)");
    expect(`the doctor header is locatable: ${start >= 0}`).toBe("the doctor header is locatable: true");
    const end = src.indexOf("// ---------------------------------------------------------------------------", start);
    expect(`the doctor header is bounded: ${end > start}`).toBe("the doctor header is bounded: true");
    const header = src.slice(start, end);

    // The old sentence enumerated the adapter materializer among the things the doctor never calls.
    // The doctor now runs that file's transform, so the enumeration became false the moment the
    // staleness verdict landed. A false sentence in the one file whose job is true ones is not left
    // standing.
    expect(
      `the old enumeration survives: ${header.includes("copyKit / materializeAdapter / seedState / writeMarker")}`,
    ).toBe("the old enumeration survives: false");
    // What replaced it is the invariant that actually holds and that the read-only case above
    // asserts behaviourally.
    expect(header).toContain("MUTATES NOTHING INSIDE THE TARGET");
    expect(header).toContain("transformAdapter");
  });

  it("doctor: the staleness verdict landed in the WARN tier only, and no frontmatter grammar came with it (D-09, D-10)", () => {
    const src = readFileSync(join(import.meta.dirname, "install.ts"), "utf8");
    const doctorStart = src.indexOf("function doctor(): number {");
    const doctorEnd = src.indexOf("\n// --- Doctor early-exit", doctorStart);
    expect(`the doctor body is bounded: ${doctorStart >= 0 && doctorEnd > doctorStart}`).toBe(
      "the doctor body is bounded: true",
    );
    const body = src.slice(doctorStart, doctorEnd);
    // No new severity mechanism: DOC_WARNS is already promoted by --strict in the exit matrix, so
    // D-10 is a PLACEMENT decision rather than a mechanism. The staleness lines are warnings.
    expect(body).toContain("docWarn");
    // NO FRONTMATTER GRAMMAR. The comparison is whole-file; the doctor parses no `model:` line and
    // no other frontmatter key. A second grammar over the same bytes is what D-09 exists to avoid.
    // Comment lines are filtered the way the mid-script-exit pin above filters them: prose about a
    // frontmatter key is not a grammar over one, and the scan would otherwise trip on the paragraph
    // that explains why there is no grammar. What is asserted is that no CODE line inside the
    // doctor so much as mentions the word — no regex, no string, no key lookup.
    const codeLines = body.split("\n").filter((l) => !/^\s*\/\//.test(l));
    const modelKeyMentions = codeLines.filter((l) => /model/i.test(l));
    expect(modelKeyMentions).toEqual([]);
    // ...and it writes nothing: no write call of any kind inside the doctor body.
    const writes = codeLines.filter((l) => /\b(writeFileSync|appendFileSync|copyFileSync|symlinkSync|renameSync|rmSync|mkdirSync|mkdirp)\s*\(/.test(l));
    expect(writes).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────────────────────────
  // MODEL DELIVERY (Phase 29.2, D-01 … D-06). A `models` block written into a TARGET repository
  // reaches THAT repository's adapters.
  //
  // These cases drive the REAL repository as $GRUGOPS_SRC through runInstall, because the render is
  // performed by the committed generator against the real `agent-factory/roles` corpus and the
  // aliases asserted below are what that corpus resolves to. Each one asserts its FIXTURE PREMISE
  // before the effect — that the configuration file exists (or does not) at the exact path the
  // installer reads, and that the pre-state carries what the case claims — so a case can never pass
  // by observing a fixture it did not build.
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // targetConfigPath — the ONE location the installer hands to the render (D-06). Written once here
  // so no case spells the path twice and then asserts against its own second spelling.
  const targetConfigPath = (target: string): string => join(target, ".grugops", "factory.config.json");

  // writeTargetConfig — plant a configuration file at that location, creating the directory.
  function writeTargetConfig(target: string, body: string): string {
    const p = targetConfigPath(target);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
    return p;
  }

  // targetModelLines — the alias every installed agent adapter carries, read off the bytes in the
  // TARGET. The set of adapters is DERIVED from the target listing, never written down, and each
  // file must carry EXACTLY ONE `model:` line: zero or two are different defects from a wrong
  // value, and folding them into "the first match" would hide both.
  function targetModelLines(target: string): string[] {
    return installedAdapters(target).map((rel) => {
      const found = readFileSync(join(target, ".claude", "agents", rel), "utf8")
        .split("\n")
        .filter((l) => l.startsWith("model: "));
      expect(`${rel}: model lines = ${found.length}`).toBe(`${rel}: model lines = 1`);
      return found[0].slice("model: ".length);
    });
  }

  it("model delivery: a target with NO configuration file installs adapters that ALL resolve `inherit` (D-05)", () => {
    const target = makeFixture();
    const home = mkTmp();
    // PREMISE: the file the installer reads does not exist yet — a fresh install has nothing to
    // resolve, and D-05 says the seed it writes afterwards would give the same answer anyway.
    expect(existsSync(targetConfigPath(target))).toBe(false);

    expect(runInstall(target, home).status).toBe(0);

    const models = targetModelLines(target);
    // The count is DERIVED from the target listing rather than written as a literal...
    expect(models.length).toBe(installedAdapters(target).length);
    // ...and pinned as an integer beside it, so a listing that silently shrinks fails the number
    // instead of making the set comparison vacuous.
    expect(models.length).toBe(17);
    expect([...new Set(models)]).toEqual(["inherit"]);
  });

  it("model delivery: a `tiered` target's adapters carry the aliases that preset resolves to (D-01, D-06)", () => {
    const target = makeFixture();
    const home = mkTmp();
    const configPath = writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');
    // PREMISE: the planted file is exactly where the installer will look for it.
    expect(existsSync(configPath)).toBe(true);

    expect(runInstall(target, home).status).toBe(0);

    const models = targetModelLines(target);
    expect(models.length).toBe(installedAdapters(target).length);
    expect(models.length).toBe(17);
    // Both tallies in ONE assertion so a failure prints both numbers rather than the first to trip.
    const tally = (alias: string): number => models.filter((m) => m === alias).length;
    expect(`opus=${tally("opus")} sonnet=${tally("sonnet")}`).toBe("opus=4 sonnet=13");
    expect([...new Set(models)].sort()).toEqual(["opus", "sonnet"]);
    // Every value is a member of the closed vocabulary the resolver owns — never a full model id.
    for (const m of models) {
      expect(`${m}: legal alias = ${(MODEL_ALIASES as readonly string[]).includes(m)}`).toBe(
        `${m}: legal alias = true`,
      );
    }
    // The seeded config is USER content and survives untouched (D-04) — the render reads it, it
    // never rewrites it.
    expect(readFileSync(configPath, "utf8")).toBe('{"models":{"preset":"tiered"}}\n');
  });

  it("model delivery: an ILLEGAL `models` value refuses the adapter class by name; every other class completes (D-03, R-5)", () => {
    const badValue = "claude-opus-4-1-20250805";
    const badConfig = `{"models":{"roles":{"orchestrator":"${badValue}"}}}\n`;

    // ── ARM 1: A FRESH TARGET. No adapter is installed AT ALL, and the marker plus the seeded
    // memory-bank index still land — "report, don't abort" over a class the run could not do.
    const fresh = makeFixture();
    const freshHome = mkTmp();
    const freshConfig = writeTargetConfig(fresh, badConfig);
    expect(existsSync(freshConfig)).toBe(true);
    expect(existsSync(join(fresh, ".claude", "agents"))).toBe(false);

    const r = runInstall(fresh, freshHome);
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("install INCOMPLETE");
    expect(r.stdout).not.toContain("== install complete");
    // R-5: no fallback byte source. Falling back to the kit's own adapters would silently downgrade
    // a configured target to `inherit`, which is the exact repudiation D-03 and D-11 both reject.
    expect(installedAdapters(fresh)).toEqual([]);
    // The generator's OWN refusal is relayed verbatim: the role, the offending value, the legal set.
    expect(r.stdout).toContain("orchestrator");
    expect(r.stdout).toContain(badValue);
    for (const alias of MODEL_ALIASES) {
      expect(`legal set names ${alias}: ${r.stdout.includes(`"${alias}"`)}`).toBe(
        `legal set names ${alias}: true`,
      );
    }
    // ...plus ONE installer-authored line naming the REAL file on this machine. The generator's
    // message names a temp mirror path that does not exist here, which is why this line exists.
    expect(r.stdout).toContain(freshConfig);
    // EVERY OTHER CLASS STILL COMPLETED (kit-source's report-don't-abort posture).
    expect(existsSync(join(fresh, ".grugops", "install.json"))).toBe(true);
    expect(existsSync(join(fresh, "memory-bank", "00-index.md"))).toBe(true);
    expect(installedSkills(fresh).length).toBe(7);

    // ── ARM 2: A TARGET THAT WAS ALREADY INSTALLED. Every pre-existing adapter is BYTE-UNCHANGED —
    // a refused render never half-writes and never rewrites.
    const seeded = makeFixture();
    const seededHome = mkTmp();
    expect(runInstall(seeded, seededHome).status).toBe(0);
    const before = snapshot(join(seeded, ".claude", "agents"));
    expect(before).not.toBe("");
    writeTargetConfig(seeded, badConfig);

    const r2 = runInstall(seeded, seededHome);
    expect(r2.status).toBe(3);
    expect(r2.stdout).toContain("install INCOMPLETE");
    expect(snapshot(join(seeded, ".claude", "agents"))).toBe(before);
    expect(targetModelLines(seeded).every((m) => m === "inherit")).toBe(true);
  });

  it("model delivery: a second install over an unchanged CONFIGURED target produces ZERO diff in both roots", () => {
    const target = makeFixture();
    const home = mkTmp();
    writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');

    expect(runInstall(target, home).status).toBe(0);
    const t1 = snapshot(target);
    const h1 = snapshot(home);

    expect(runInstall(target, home).status).toBe(0);
    expect(snapshot(target)).toBe(t1);
    expect(snapshot(home)).toBe(h1);
    // ...and the resolution did not drift between the two runs.
    expect([...new Set(targetModelLines(target))].sort()).toEqual(["opus", "sonnet"]);
  });

  // ─────────────────────────────────────────────────────────────────────────────────────────────
  // THE IDEMPOTENT WRITE, THE TARGET-TRUE BANNER AND KIT OWNERSHIP (29.2 plan 02, D-11/D-13/D-14).
  //
  // A re-run must be a VISIBLE NO-OP and a refresh a VISIBLE CHANGE: before this plan every re-run
  // rewrote all seventeen adapters and reported `materialized` for each, so a run that changed a
  // model line and a run that changed nothing produced the same output and the same mtimes. The
  // comparison that fixes it is taken over the FINAL bytes — after both slots are materialized —
  // because a comparison taken between the SOURCE and the DESTINATION reports every re-run as a
  // rewrite (the destination carries an injected kit block the source never did), and one taken
  // against the wrong side reports a genuinely stale file as identical.
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // The banner block sentinels install.ts wraps its replacement in. Spelled here for the same reason
  // MAT_SLOT is spelled above: this file PINS the installer's sentinel rather than deriving it, so
  // an installer that changed the pair without changing these cases fails the strip cases below.
  const BAN_OPEN = "<!-- grugops:target-banner -->";
  const BAN_CLOSE = "<!-- /grugops:target-banner -->";

  // provenanceLiteral — the banner the GENERATOR emits, read out of its SOURCE TEXT. The module
  // cannot be imported: it writes seventeen files at load. Every banner assertion below is anchored
  // to this one reading, so no case spells the kit banner and then asserts against its own spelling.
  function provenanceLiteral(): string {
    const genSrc = readFileSync(join(REPO_ROOT, "scripts", "generate-role-adapters.ts"), "utf8");
    const m = /const PROVENANCE\s*=\s*\n?\s*"([^"]+)";/.exec(genSrc);
    if (!m) throw new Error("scripts/generate-role-adapters.ts: could not find the PROVENANCE literal");
    return m[1];
  }

  // bannerHead — the leading token of that literal, up to and including its em dash. A locator
  // DERIVED from the generator's own text rather than a second spelling, used to count how many
  // banner lines a file carries whatever the rest of the line says.
  function bannerHead(): string {
    const p = provenanceLiteral();
    const i = p.indexOf("—");
    expect(`the generator banner carries an em dash: ${i > 0}`).toBe("the generator banner carries an em dash: true");
    return p.slice(0, i + 1);
  }

  // identicalCopyVerbs — every report label install.ts prints beside the identical-copy note, read
  // out of the installer's own source. D-11 adopts "the identical wording linkOrCopy already uses",
  // so this file asserts the two sites agree rather than authoring a third spelling of the word.
  function identicalCopyVerbs(): string[] {
    const src = readFileSync(join(import.meta.dirname, "install.ts"), "utf8");
    return [...src.matchAll(/report\("([^"]+)",\s*`\$\{label\} \(identical copy present\)`\)/g)].map((m) => m[1]);
  }

  // adapterMtimes — nanosecond mtimes of every installed adapter, DERIVED from the target listing.
  // A content snapshot proves the BYTES did not move; only an mtime proves no file was WRITTEN,
  // which is the actual D-11 claim.
  function adapterMtimes(target: string): string[] {
    return installedAdapters(target).map(
      (rel) => `${rel} ${statSync(join(target, ".claude", "agents", rel), { bigint: true }).mtimeNs}`,
    );
  }

  it("model delivery: a SECOND install over an unchanged target WRITES NOTHING and reports the identical-copy wording for every adapter (D-11)", () => {
    const target = makeFixture();
    const home = mkTmp();
    writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');

    const first = runInstall(target, home);
    expect(first.status).toBe(0);
    // PREMISE: the first run really did write every adapter, so the second run has something to
    // skip. Without this the case could pass over a target that was never installed at all.
    const count = installedAdapters(target).length;
    expect(count).toBe(17);
    expect(adapterReportLines(first.stdout, "materialized").length).toBe(count);
    const beforeBytes = snapshot(join(target, ".claude", "agents"));
    const beforeMtimes = adapterMtimes(target);

    const second = runInstall(target, home);
    expect(second.status).toBe(0);
    // Nothing was written — bytes AND mtimes.
    expect(snapshot(join(target, ".claude", "agents"))).toBe(beforeBytes);
    expect(adapterMtimes(target)).toEqual(beforeMtimes);

    // ...and the run SAYS so, in the word linkOrCopy already uses for an identical copy.
    const verbs = identicalCopyVerbs();
    expect(`identical-copy report sites in install.ts: ${verbs.length}`).toBe(
      "identical-copy report sites in install.ts: 2",
    );
    expect([...new Set(verbs)].length).toBe(1);
    const skipped = adapterReportLines(second.stdout, verbs[0]).filter((l) =>
      l.includes("(identical copy present)"),
    );
    expect(`identical-copy adapter lines: ${skipped.length}`).toBe(`identical-copy adapter lines: ${count}`);
    expect(adapterReportLines(second.stdout, "materialized")).toEqual([]);
  });

  it("model delivery: a models edit between two installs REWRITES every changed adapter and names each with its new alias (D-11, D-13)", () => {
    const target = makeFixture();
    const home = mkTmp();
    // PREMISE: the first install has no configuration to read, so every adapter resolves `inherit`.
    expect(existsSync(targetConfigPath(target))).toBe(false);
    expect(runInstall(target, home).status).toBe(0);
    expect([...new Set(targetModelLines(target))]).toEqual(["inherit"]);

    // PREMISE: the edit actually landed at the path the installer reads.
    const configPath = writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');
    expect(existsSync(configPath)).toBe(true);

    const second = runInstall(target, home);
    expect(second.status).toBe(0);
    const rels = installedAdapters(target);
    const lines = adapterReportLines(second.stdout, "materialized");
    expect(`rewritten adapter lines: ${lines.length}`).toBe(`rewritten adapter lines: ${rels.length}`);
    // Every rewrite is NAMED, with the alias the file now carries — read off the bytes rather than
    // assumed from the preset, so the report and the file are required to agree.
    for (const rel of rels) {
      const alias = readFileSync(join(target, ".claude", "agents", rel), "utf8")
        .split("\n")
        .filter((l) => l.startsWith("model: "))[0]
        .slice("model: ".length);
      const named = lines.filter(
        (l) => l.includes(`.claude/agents/${rel}`) && l.includes(`model=${alias}`),
      );
      expect(`${rel}: named with model=${alias}: ${named.length}`).toBe(
        `${rel}: named with model=${alias}: 1`,
      );
    }
    expect([...new Set(targetModelLines(target))].sort()).toEqual(["opus", "sonnet"]);
  });

  it("model delivery: every target adapter carries a TARGET-TRUE banner exactly once and names no command the target cannot run (D-14)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);

    const provenance = provenanceLiteral();
    const head = bannerHead();
    const rels = installedAdapters(target);
    expect(rels.length).toBe(17);

    for (const rel of rels) {
      // PREMISE, read from the COMMITTED kit adapter rather than spelled: the kit's own copy carries
      // the generator banner exactly once. Without this the target-side assertions below would be
      // about a line that never existed.
      const kitLines = readFileSync(join(REPO_ROOT, ".claude", "agents", rel), "utf8").split("\n");
      expect(`kit ${rel}: generator banner lines = ${kitLines.filter((l) => l === provenance).length}`).toBe(
        `kit ${rel}: generator banner lines = 1`,
      );

      const text = readFileSync(join(target, ".claude", "agents", rel), "utf8");
      const lines = text.split("\n");
      // EXACTLY ONE banner line, located by the generator's own leading token.
      const banners = lines.filter((l) => l.startsWith(head));
      expect(`${rel}: banner lines = ${banners.length}`).toBe(`${rel}: banner lines = 1`);
      // ...and it is NOT the line the kit adapter carries — asserted by reading both, never by
      // spelling either.
      expect(`${rel}: target banner equals the kit banner: ${banners[0] === provenance}`).toBe(
        `${rel}: target banner equals the kit banner: false`,
      );
      // It names the model source...
      expect(`${rel}: names the model source: ${banners[0].includes(".grugops/factory.config.json")}`).toBe(
        `${rel}: names the model source: true`,
      );
      // ...and nowhere in the file is the generator command a target cannot run. The command is the
      // first member of the twin list, so this asserts against a path already derived elsewhere.
      expect(`${rel}: names the generator command: ${text.includes(SYNTH_GENERATOR_TWINS[0])}`).toBe(
        `${rel}: names the generator command: false`,
      );
      // The replacement is wrapped in its own sentinel pair, balanced.
      expect(`${rel}: banner sentinels = ${lines.filter((l) => l === BAN_OPEN).length}/${lines.filter((l) => l === BAN_CLOSE).length}`).toBe(
        `${rel}: banner sentinels = 1/1`,
      );
    }
  });

  it("model delivery: three installs produce the same bytes as one, with exactly one banner block per adapter (D-14)", () => {
    const target = makeFixture();
    const home = mkTmp();
    writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');
    expect(runInstall(target, home).status).toBe(0);
    const once = snapshot(join(target, ".claude", "agents"));
    expect(installedAdapters(target).length).toBe(17);

    for (let i = 0; i < 2; i++) expect(runInstall(target, home).status).toBe(0);
    expect(snapshot(join(target, ".claude", "agents"))).toBe(once);

    const head = bannerHead();
    for (const rel of installedAdapters(target)) {
      const lines = readFileSync(join(target, ".claude", "agents", rel), "utf8").split("\n");
      expect(`${rel}: banner blocks = ${lines.filter((l) => l === BAN_OPEN).length}`).toBe(
        `${rel}: banner blocks = 1`,
      );
      expect(`${rel}: banner lines = ${lines.filter((l) => l.startsWith(head)).length}`).toBe(
        `${rel}: banner lines = 1`,
      );
    }
  });

  // THE BANNER SLOT CARRIES THE SAME BOUNDED-REMOVAL CONTRACT AS THE KIT SLOT (CR-01, T-29.2-11).
  //
  // AND IT IS PLANTED IN THE RESOLVER SKILL, FOR THE REASON THE `migrate: bounded marker-strip` case
  // records above its own plant: an agent adapter's bytes now come from the install-time mirror
  // render, which emits exactly one generator banner and no prior block, so a block planted in a
  // source AGENT adapter is read by nothing. The resolver SKILL is still materialized straight from
  // $GRUGOPS_SRC, so it is the surface that carries source bytes into the transform — which is one
  // state machine over both slots, so what it guarantees for one it guarantees for the other.
  it("model delivery: a prior TARGET-BANNER block in a materialized source is stripped, and an UNTERMINATED one is restored (CR-01, D-14)", () => {
    // (a) a terminated prior block is dropped.
    const srcA = makeSyntheticSrc();
    writeFileSync(
      join(srcA, ".claude", "skills", "grugops", "SKILL.md"),
      `${BAN_OPEN}\n` +
        "STALE-BANNER-TEXT-MUST-NOT-SURVIVE\n" +
        `${BAN_CLOSE}\n` +
        "BODY-LINE-ONE\n" +
        `${MAT_SLOT}\n`,
    );
    const targetA = mkTmp();
    expect(runInstallFrom(srcA, targetA, mkTmp()).status).toBe(0);
    const afterA = readFileSync(join(targetA, ".claude", "skills", "grugops", "SKILL.md"), "utf8");
    expect(`stale banner survived: ${afterA.includes("STALE-BANNER-TEXT-MUST-NOT-SURVIVE")}`).toBe(
      "stale banner survived: false",
    );
    expect(afterA).toContain("BODY-LINE-ONE");
    expect(afterA).toContain(MAT_SLOT);

    // (b) an UNTERMINATED prior block at end of file restores every line it buffered, in order —
    // the guarantee is "lose nothing", not "keep the one line this case happens to name".
    const srcB = makeSyntheticSrc();
    writeFileSync(
      join(srcB, ".claude", "skills", "grugops", "SKILL.md"),
      `${BAN_OPEN}\n` +
        "BUFFERED-LINE-ONE\n" +
        "BUFFERED-LINE-TWO\n" +
        `${MAT_SLOT}\n`,
    );
    const targetB = mkTmp();
    expect(runInstallFrom(srcB, targetB, mkTmp()).status).toBe(0);
    const afterB = readFileSync(join(targetB, ".claude", "skills", "grugops", "SKILL.md"), "utf8");
    expect(afterB.split("\n").filter((l) => l !== "")).toEqual([
      "BUFFERED-LINE-ONE",
      "BUFFERED-LINE-TWO",
      MAT_SLOT,
    ]);
  });

  it("model delivery: a HAND-EDITED target adapter is rewritten and named, and its untouched siblings are not (D-13)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const rels = installedAdapters(target);
    expect(rels.length).toBe(17);

    // A user hand-edits ONE adapter's model line. D-13: an installed agent adapter is a kit-owned
    // derived artifact, so the edit is lost on the next run — deliberately, because the
    // configuration file is the one place to set it — and the rewrite is REPORTED BY NAME.
    const edited = rels[0];
    const editedPath = join(target, ".claude", "agents", edited);
    const original = readFileSync(editedPath, "utf8");
    const tampered = original.replace("model: inherit", "model: opus");
    // PREMISE: the edit actually changed the bytes, so the run below has something to notice.
    expect(`the hand edit changed the file: ${tampered !== original}`).toBe(
      "the hand edit changed the file: true",
    );
    writeFileSync(editedPath, tampered);

    const second = runInstall(target, home);
    expect(second.status).toBe(0);
    // The edited file is back to what the kit renders...
    expect(readFileSync(editedPath, "utf8")).toBe(original);
    // ...it is named as a rewrite...
    const rewritten = adapterReportLines(second.stdout, "materialized");
    expect(rewritten.length).toBe(1);
    expect(rewritten[0]).toContain(`.claude/agents/${edited}`);
    // ...and every sibling is left alone rather than swept up with it.
    const verbs = identicalCopyVerbs();
    const skipped = adapterReportLines(second.stdout, verbs[0]).filter((l) =>
      l.includes("(identical copy present)"),
    );
    expect(`untouched siblings skipped: ${skipped.length}`).toBe(
      `untouched siblings skipped: ${rels.length - 1}`,
    );
  });

  it("model delivery: the slot-carrying SKILL installs, carries NO banner block, and is reported like any other materialized file", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home).status).toBe(0);
    const skill = join(target, ".claude", "skills", "grugops", "SKILL.md");
    expect(existsSync(skill)).toBe(true);
    const lines = readFileSync(skill, "utf8").split("\n");
    // PREMISE: it really is the slot-carrying file — that is what routes it through the transform.
    expect(`the skill carries the resolver slot: ${lines.includes(MAT_SLOT)}`).toBe(
      "the skill carries the resolver slot: true",
    );
    // The banner count floor is asserted at the AGENTS call site only, and this is why: a skill
    // legitimately carries zero banner lines, so a blanket assertion inside the transform would be
    // wrong. Nothing was injected here.
    const head = bannerHead();
    expect(lines.filter((l) => l.startsWith(head))).toEqual([]);
    expect(lines.filter((l) => l === BAN_OPEN)).toEqual([]);
  });

  it("model delivery: an install set that DIVERGES from the render installs NOTHING and names every differing member, in BOTH directions (D-01)", () => {
    // WHY THIS IS THE LOAD-BEARING CROSS-CHECK. The install SET stays srcAdapterFiles($GRUGOPS_SRC)
    // — the same derivation install/uninstall.ts removes by — and the mirror is only the per-member
    // BYTE source. If the two ever disagree, the run either writes a file the reversal cannot see or
    // reads bytes for a member that was never rendered. Both are silent; the refusal is not.

    // ── DIRECTION 1: a member the kit source carries that no render can produce.
    const srcExtra = makeSyntheticSrc();
    const targetExtra = mkTmp();
    writeFileSync(join(targetExtra, "CLAUDE.md"), "# User Project\n");
    const orphan = "grugops-orphan-role.md";
    writeFileSync(
      join(srcExtra, ".claude", "agents", orphan),
      `> synthetic orphan adapter\n${MAT_SLOT}\n`,
    );
    // PREMISE: it is a legal FLAT member, so the install derivation admits it — the divergence is
    // with the render, not with the flat-directory contract.
    expect(listAgentAdapters(srcExtra)).toContain(orphan);
    expect(listAgentAdapters(srcExtra).length).toBe(SYNTH_ADAPTERS.length + 1);

    const rExtra = runInstallFrom(srcExtra, targetExtra, mkTmp());
    // THE MEMBER AND THE STATUS IN ONE ASSERTION, deliberately: the two facts are one claim, and a
    // status-only failure would say the refusal is missing without saying which member went
    // unreported. NAMED, not counted — a bare count disagreement says the sets differ and never
    // which member is the problem.
    expect(`status=${rExtra.status} names ${orphan}: ${rExtra.stdout.includes(orphan)}`).toBe(
      `status=3 names ${orphan}: true`,
    );
    expect(rExtra.stdout).toContain("install INCOMPLETE");
    expect(rExtra.stdout).not.toContain("== install complete");
    expect(rExtra.stdout).toContain("the render does not");
    // R-5: nothing at all is installed — not the seventeen that WOULD have matched.
    expect(installedAdapters(targetExtra)).toEqual([]);
    // ...and the other classes still complete.
    expect(installedSkills(targetExtra).length).toBe(7);
    expect(existsSync(join(targetExtra, ".grugops", "install.json"))).toBe(true);

    // ── DIRECTION 2: a member the render produces that the kit source does not carry.
    const srcShort = makeSyntheticSrc();
    const targetShort = mkTmp();
    writeFileSync(join(targetShort, "CLAUDE.md"), "# User Project\n");
    const dropped = SYNTH_ADAPTERS[0];
    rmSync(join(srcShort, ".claude", "agents", dropped), { force: true });
    expect(listAgentAdapters(srcShort)).not.toContain(dropped);
    expect(listAgentAdapters(srcShort).length).toBe(SYNTH_ADAPTERS.length - 1);

    const rShort = runInstallFrom(srcShort, targetShort, mkTmp());
    expect(`status=${rShort.status} names ${dropped}: ${rShort.stdout.includes(dropped)}`).toBe(
      `status=3 names ${dropped}: true`,
    );
    expect(rShort.stdout).toContain("install INCOMPLETE");
    expect(rShort.stdout).toContain("the kit source does not carry");
    expect(installedAdapters(targetShort)).toEqual([]);
  });

  it("model delivery: a kit checkout MISSING a generator twin installs NOTHING, names every absent file, and states that no verdict was produced (R-5)", () => {
    // THE PARTIAL-CHECKOUT ARM. It is the branch R-5 exists for and the one with the most
    // dangerous silent alternative: falling back to the kit-shipped adapter bytes would install a
    // configured target's adapters at `inherit` and report a clean completion. Every twin is
    // removed in turn so the case cannot pass by covering whichever one happens to be checked
    // first, and the whole set is removed once so the count in the message is exercised too.
    for (const twin of SYNTH_GENERATOR_TWINS) {
      const src = makeSyntheticSrc();
      const target = mkTmp();
      writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
      rmSync(join(src, ...twin.split("/")), { force: true });
      expect(existsSync(join(src, ...twin.split("/")))).toBe(false);

      const r = runInstallFrom(src, target, mkTmp());
      expect(`${twin}: status=${r.status} named=${r.stdout.includes(twin)}`).toBe(
        `${twin}: status=3 named=true`,
      );
      // THE ABSENCE OF A VERDICT, NOT A CLEAN ONE — the unreadable-versus-empty distinction this
      // installer draws everywhere else. A render that could not run knows nothing about these
      // adapters; it does not know them to be unchanged.
      expect(r.stdout).toContain("NO VERDICT");
      expect(r.stdout).toContain("install INCOMPLETE");
      expect(r.stdout).not.toContain("== install complete");
      // R-5: no fallback byte source.
      expect(installedAdapters(target)).toEqual([]);
      // ...and every other class still completed.
      expect(installedSkills(target).length).toBe(7);
      expect(existsSync(join(target, ".grugops", "install.json"))).toBe(true);
    }

    // ALL FOUR ABSENT AT ONCE: the count travels with the message, and every name is still listed.
    const bare = makeSyntheticSrc();
    const bareTarget = mkTmp();
    writeFileSync(join(bareTarget, "CLAUDE.md"), "# User Project\n");
    for (const twin of SYNTH_GENERATOR_TWINS) rmSync(join(bare, ...twin.split("/")), { force: true });
    const rAll = runInstallFrom(bare, bareTarget, mkTmp());
    expect(rAll.status).toBe(3);
    expect(rAll.stdout).toContain(`${SYNTH_GENERATOR_TWINS.length} of ${SYNTH_GENERATOR_TWINS.length}`);
    for (const twin of SYNTH_GENERATOR_TWINS) {
      expect(`names ${twin}: ${rAll.stdout.includes(twin)}`).toBe(`names ${twin}: true`);
    }
    expect(installedAdapters(bareTarget)).toEqual([]);
  }, 60_000);

  // ─────────────────────────────────────────────────────────────────────────────────────────────
  // THE RESOLUTION REPORT (D-04, R-1). The run says which resolution it applied and where it read
  // it from, and every per-adapter line carries the alias that adapter was rendered with.
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // adapterReportLines — the installer's own per-adapter report lines for the AGENT class, at the
  // given verb. The set is filtered out of real output rather than reconstructed, so a case can
  // compare its length against the target listing instead of trusting a literal.
  function adapterReportLines(stdout: string, verb: string): string[] {
    const rx = new RegExp(`^\\s{2}${verb}\\s+\\.claude/agents/`);
    return stdout.split("\n").filter((l) => rx.test(l));
  }

  it("model delivery: a ZERO-CONFIG run relays the generator's own announcement and states that no configuration file was found (D-04)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(existsSync(targetConfigPath(target))).toBe(false);

    const r = runInstall(target, home);
    expect(r.status).toBe(0);

    // (a) THE GENERATOR'S OWN LINES, RELAYED VERBATIM. The installer authors no preset wording and
    // holds no copy of either prefix — the prefixes below are imported from the module that owns
    // them, so a marker that moved fails here instead of drifting apart in two files.
    expect(r.stdout).toContain(`${RESOLVED_PRESET_PREFIX}none`);
    expect(r.stdout).toContain(
      `${RESOLVED_ASSIGNMENT_PREFIX}{"roles":17,"overrides":0,"aliases":["inherit"]}`,
    );

    // (b) THE RELAY IS A MENTION, NOT A SECOND ANNOUNCEMENT — and that is deliberate. Both readers
    // require their prefix at BYTE 0 of the trimmed line (finding WR-03), and the relayed text sits
    // indented under the installer's own padded report label. So the installer's stdout does NOT
    // read back as an announcing run: the generator says what it resolved, the installer forwards
    // it, and the two authorities stay distinguishable (T-29.2-08).
    expect(resolvedPresetsIn(r.stdout)).toEqual([]);
    expect(resolvedAssignmentsIn(r.stdout)).toEqual([]);

    // (c) ONE INSTALLER-AUTHORED LINE, naming the real file and saying plainly that none was there.
    // A run that resolved nothing says so.
    expect(r.stdout).toContain(targetConfigPath(target));
    expect(r.stdout).toContain("no configuration file");

    // (d) EVERY per-adapter line carries the alias. The count is derived from the target listing.
    const lines = adapterReportLines(r.stdout, "materialized");
    expect(lines.length).toBe(installedAdapters(target).length);
    expect(lines.length).toBe(17);
    for (const line of lines) {
      expect(`${line.trim().split(/\s+/)[1]}: ${line.includes("model=inherit")}`).toBe(
        `${line.trim().split(/\s+/)[1]}: true`,
      );
    }
    // ...and no report line anywhere carries a full model id shape.
    expect(r.stdout).not.toMatch(/model=[a-z]+-[a-z0-9-]*\d/);
  });

  it("model delivery: a TIERED run names the configuration file it read and carries the generator's assignment payload verbatim (D-04)", () => {
    const target = makeFixture();
    const home = mkTmp();
    const configPath = writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');

    const r = runInstall(target, home);
    expect(r.status).toBe(0);

    expect(r.stdout).toContain(`${RESOLVED_PRESET_PREFIX}tiered`);
    expect(r.stdout).toContain(
      `${RESOLVED_ASSIGNMENT_PREFIX}{"roles":17,"overrides":0,"aliases":["opus","sonnet"]}`,
    );
    // The installer-authored line names the REAL file on this machine, not the temp mirror the
    // generator's own message would name.
    expect(r.stdout).toContain(configPath);
    expect(r.stdout).not.toContain("no configuration file");

    // Every per-adapter line ends with an alias drawn from the closed vocabulary, and the two
    // tallies match the bytes on disk — the report is derived from what was written, and the
    // announcement independently confirms it.
    const lines = adapterReportLines(r.stdout, "materialized");
    expect(lines.length).toBe(installedAdapters(target).length);
    const reported = lines.map((l) => l.slice(l.lastIndexOf("model=") + "model=".length).replace(/\)$/, ""));
    expect([...reported].sort()).toEqual([...targetModelLines(target)].sort());
    for (const alias of reported) {
      expect(`${alias}: legal alias = ${(MODEL_ALIASES as readonly string[]).includes(alias)}`).toBe(
        `${alias}: legal alias = true`,
      );
    }
  });

  it("model delivery: DRY_RUN reports the same resolution, reads `would-materialize` with an alias, and mutates neither root", () => {
    const target = makeFixture();
    const home = mkTmp();
    rmSync(home, { recursive: true, force: true }); // start with the home ABSENT
    writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');

    const tPre = snapshot(target);
    const hPre = snapshot(home);

    const r = spawnSync("node", [INSTALL_JS, "--yes"], {
      encoding: "utf8",
      env: { ...process.env, DRY_RUN: "1", INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(r.status).toBe(0);

    // The SAME resolution is reported under DRY_RUN — the render is read-only with respect to both
    // roots, so there is no reason for a plan to be less informative than the run it describes.
    expect(r.stdout ?? "").toContain(`${RESOLVED_PRESET_PREFIX}tiered`);
    expect(r.stdout ?? "").toContain(targetConfigPath(target));

    const lines = adapterReportLines(r.stdout ?? "", "would-materialize");
    expect(lines.length).toBe(17);
    const aliases = new Set(
      lines.map((l) => l.slice(l.lastIndexOf("model=") + "model=".length).replace(/\)$/, "")),
    );
    expect([...aliases].sort()).toEqual(["opus", "sonnet"]);
    // ...and no per-adapter line claims a write happened.
    expect(adapterReportLines(r.stdout ?? "", "materialized")).toEqual([]);

    // NEITHER ROOT MUTATED. The temp mirror lives outside both and is removed with the run.
    expect(snapshot(target)).toBe(tPre);
    expect(snapshot(home)).toBe(hPre);
    expect(existsSync(home)).toBe(false);
  });

  // ── THE THREE CROSS-CHECKS, DRIVEN BY A PATCHED GENERATOR TWIN ────────────────────────────────
  //
  // These are BEHAVIOURAL cases, not scratch-build mutations. The installer copies the generator's
  // committed .js twins out of $GRUGOPS_SRC into its mirror, so a synthetic source carrying a
  // PATCHED twin makes the mirrored generator misbehave in exactly the way each cross-check exists
  // to catch — an announcement that disagrees with the bytes, and bytes that disagree with
  // themselves. Nothing in the repository is mutated; the patch lives in a throwaway fixture.
  function patchSyntheticGenerator(src: string, from: string, to: string): void {
    const p = join(src, "scripts", "generate-role-adapters.js");
    const before = readFileSync(p, "utf8");
    if (!before.includes(from)) {
      throw new Error(
        `the synthetic generator twin does not contain the patch anchor ${JSON.stringify(from)} — ` +
          "the fixture would run an UNPATCHED generator and the case below would assert nothing",
      );
    }
    writeFileSync(p, before.replace(from, to));
  }

  it("model delivery: an announced member count that disagrees with the rendered listing installs NOTHING and prints both numbers", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
    // The announcement is made to claim sixteen roles while the render still produces seventeen
    // files. A vacuity floor catches an EMPTY resolution and never a silently SHORT one, which is
    // why the count is cross-checked against a listing the INSTALLER derived itself.
    patchSyntheticGenerator(
      src,
      "console.log(resolvedAssignmentLine(models, modelsConfig.overrides.size));",
      'console.log("' + RESOLVED_ASSIGNMENT_PREFIX + '" + JSON.stringify({ roles: 16, overrides: 0, aliases: ["inherit"] }));',
    );

    const r = runInstallFrom(src, target, mkTmp());
    // BOTH NUMBERS AND THE STATUS IN ONE ASSERTION: the announced count and the count this side
    // derived, so a failure prints the whole claim rather than the first half of it to trip.
    const bothNumbers =
      r.stdout.includes("announced a resolution covering 16 role(s)") &&
      r.stdout.includes("derived 17 rendered adapter(s)");
    expect(`status=${r.status} prints both numbers: ${bothNumbers}`).toBe(
      "status=3 prints both numbers: true",
    );
    expect(r.stdout).toContain("install INCOMPLETE");
    expect(installedAdapters(target)).toEqual([]);
  });

  it("model delivery: a rendered adapter carrying two `model:` lines installs NOTHING and names the file", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
    // Exactly one is the floor. Zero and two-or-more are different defects from a wrong value, and
    // taking "the first match" would hide both.
    patchSyntheticGenerator(
      src,
      "lines.push(`model: ${a.model}`);",
      "lines.push(`model: ${a.model}`);\n    lines.push(`model: ${a.model}`);",
    );

    const r = runInstallFrom(src, target, mkTmp());
    // NAMED BY FILE, and the status, in ONE assertion — a status-only failure would say the floor
    // is gone without saying which file went unreported.
    const named = `.claude/agents/${SYNTH_ADAPTERS[0]}`;
    expect(`status=${r.status} refuses ${named}: ${r.stdout.includes(`${named} was rendered carrying 2 line(s)`)}`).toBe(
      `status=3 refuses ${named}: true`,
    );
    expect(r.stdout).toContain("install INCOMPLETE");
    expect(installedAdapters(target)).toEqual([]);
  });

  // THE COUNT FLOOR THE BANNER RECOGNISER RESTS ON (D-14, Pitfall 2). Driven BEHAVIOURALLY through
  // a patched generator twin rather than only by a scratch-build mutation: the fixture makes the
  // mirrored generator emit a banner the installer does not recognise (the silent-drift shape) and
  // then emit two of them (the ambiguous shape), and the installer must refuse both by name.
  // ── ROUND-1 RED-TEAM FINDINGS (29.2-03 task 2) ───────────────────────────────────────────────
  //
  // Both cases below were written from a REPRODUCED bypass against the committed install.js, not
  // from a reading of the code. Each records what the run did BEFORE the fix in its own comment, so
  // a later reader can judge whether the case is aimed at the defect or at the patch.

  it("model delivery: a rendered adapter carrying NO kit slot line installs NOTHING and names the file (D-14)", () => {
    // THE BYPASS, REPRODUCED 2026-09-04 AGAINST THE COMMITTED install.js. The banner count floor is
    // asked about every rendered agent adapter and refuses on zero or on two — but the floor's
    // guarantee is that the banner will be REWRITTEN, and the rewrite happens only on the
    // materialize route. A rendered adapter that carries exactly one recognised banner and NO kit
    // slot line is routed to linkOrCopy instead, which copies raw bytes: the target received a file
    // still naming `node scripts/generate-role-adapters.js`, a command the target cannot run, and
    // the run exited 0 claiming completion. Measured: 17 adapters installed, 0 target-banner blocks,
    // 1 occurrence of the generator command in the installed file, exit 0.
    //
    // WHAT THE CASE ASKS, THEREFORE: not "did the floor count right" but "is the file the floor
    // counted actually going to be transformed". The predicate is the SAME srcCarriesSlot the
    // router uses, asked about the same path, so routing and the refusal cannot disagree.
    const src = makeSyntheticSrc();
    const target = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    // The RESOLVER block is what carries the kit slot line into a rendered adapter. Removing the
    // FIRST of the generator's two emit sites leaves the other members intact, so the fixture is the
    // MIXED shape a real drift would produce rather than an all-or-nothing one.
    patchSyntheticGenerator(src, "        ...RESOLVER,", '        "(resolver block removed by this fixture)",');

    const r = runInstallFrom(src, target, mkTmp());
    expect(`status=${r.status}`).toBe("status=3");
    expect(installedAdapters(target)).toEqual([]);
    expect(r.stdout).toContain("install INCOMPLETE");

    // THE FILE IS NAMED, and the name is DERIVED from the run rather than spelled here — a hand
    // written name would go stale the moment the generator's emit order changed, and this case would
    // then be asserting about a member the fixture no longer damages.
    const named = SYNTH_ADAPTERS.filter((a) =>
      r.stdout.includes(`.claude/agents/${a} was rendered without`),
    );
    expect(
      `named exactly one member: ${named.length}`,
      `the refusal must name the damaged member; stdout was:\n${r.stdout}`,
    ).toBe("named exactly one member: 1");

    // AND THE CONSEQUENCE THE REFUSAL EXISTS FOR IS STATED: no target file may name a command the
    // target cannot run. Asserted over the whole target, not only over the damaged member.
    const leaked = installedAdapters(target).filter((a) =>
      readFileSync(join(target, ".claude", "agents", a), "utf8").includes(
        "node scripts/generate-role-adapters.js",
      ),
    );
    expect(leaked).toEqual([]);

    // THE SAME ROUTE UNDER --symlink, WHICH IS THE WORSE HALF AND WAS FOUND BY AN INDEPENDENT
    // REVIEW OF THIS PHASE'S DIFF. linkOrCopy's symlink arm points the target at `src` — and `src`
    // is now a path inside the temp mirror, which the render helper's `finally` removes as soon as
    // the callback returns. Measured against the committed build: all seventeen installed as
    // symlinks into a deleted directory, every one reported `linked`, `== install complete ==`,
    // exit 0, and every file unreadable a moment later. Silent and total, which is the direction
    // this file refuses everywhere else.
    const symTarget = mkTmp();
    writeFileSync(join(symTarget, "CLAUDE.md"), "# User Project\n");
    const sym = runInstallFrom(src, symTarget, mkTmp(), "--symlink");
    expect(`symlink mode: status=${sym.status}`).toBe("symlink mode: status=3");
    expect(installedAdapters(symTarget)).toEqual([]);
  });

  it("model delivery: a mirror the installer cannot BUILD is a named finding, never a crash (R-5)", () => {
    // FOUND BY AN INDEPENDENT REVIEW OF THIS PHASE'S DIFF (29.2-03 task 2). The render helper's
    // header promises a discriminated result that never throws, and its `finally` guarantees only
    // CLEANUP — not a result. Every construction step ran outside any try/catch that produces one:
    // the mkdtemp itself, the mirror layout, the twin copies and the kit-source copies. Reproduced
    // against the committed build, both at exit 1 with a raw stack and no banner at all:
    //   - TMPDIR pointing at a path that does not exist  → `ENOENT … mkdtemp`
    //   - a checkout whose agent-factory/roles is absent → `ENOENT … lstat …/agent-factory/roles`
    // The second one matters most: the twins pre-check covers the four scripts/*.js and says nothing
    // about the two kit-source trees, so exactly the partial checkout that pre-check exists for can
    // still reach the mirror and crash it. And a crash here lands AFTER the kit and skills classes
    // have written and BEFORE the state seed and the marker — a half-installed target reported by
    // no banner at all.
    const runWithEnv = (src: string, target: string, home: string, extra: NodeJS.ProcessEnv) => {
      const r = spawnSync("node", [INSTALL_JS, "--yes"], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: src, GRUGOPS_HOME: home, TARGET: target, ...extra },
      });
      return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
    };

    // ARM 1 — the temp root itself is unusable.
    {
      const src = makeSyntheticSrc();
      const target = mkTmp();
      writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
      const dead = join(mkTmp(), "no-such-temp-root");
      // PREMISE: the path really is absent, or this arm exercises nothing.
      expect(existsSync(dead)).toBe(false);
      const r = runWithEnv(src, target, mkTmp(), { TMPDIR: dead });
      expect(`tmpdir: status=${r.status}`).toBe("tmpdir: status=3");
      expect(r.stdout).toContain("install INCOMPLETE");
      expect(installedAdapters(target)).toEqual([]);
      expect(`tmpdir: stack trace: ${r.stderr.includes("at ")}`).toBe("tmpdir: stack trace: false");
      // The run still reaches the classes that follow the adapters — the half-installed target with
      // no banner is the shape this arm exists to delete.
      expect(existsSync(join(target, ".grugops", "install.json"))).toBe(true);
    }

    // ARM 2 — a checkout the twins pre-check calls complete, whose kit sources are not.
    {
      const src = makeSyntheticSrc();
      const target = mkTmp();
      writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
      rmSync(join(src, "agent-factory", "roles"), { recursive: true, force: true });
      // PREMISE, TWO-SIDED: the four twins the pre-check asks about are all still present, so this
      // arm is NOT a second run of the missing-twin case wearing a different name.
      for (const twin of SYNTH_GENERATOR_TWINS) {
        expect(`${twin} present: ${existsSync(join(src, ...twin.split("/")))}`).toBe(`${twin} present: true`);
      }
      expect(existsSync(join(src, "agent-factory", "roles"))).toBe(false);

      const r = runWithEnv(src, target, mkTmp(), {});
      expect(`roles: status=${r.status}`).toBe("roles: status=3");
      expect(r.stdout).toContain("install INCOMPLETE");
      expect(installedAdapters(target)).toEqual([]);
      expect(`roles: stack trace: ${r.stderr.includes("at ")}`).toBe("roles: stack trace: false");
      // The absent input is NAMED, derived from the installer's own kit-source list rather than
      // spelled here twice.
      expect(r.stdout).toContain("agent-factory/roles");
    }
  });

  it("model delivery: a target whose configuration path is NOT A READABLE FILE installs NOTHING, names the path, and lets every other class complete (R-5)", () => {
    // THE BYPASS, REPRODUCED 2026-09-04 AGAINST THE COMMITTED install.js. The one new input D-01
    // added is copied with `copyFileSync` guarded only by `existsSync`. A `.grugops/factory.config.json`
    // that is a DIRECTORY passes existsSync and makes the copy throw UNCAUGHT: the installer died at
    // exit 1 with a stack trace, having installed nothing and completed no other class — on both the
    // install path and the --check path. That is the exact shape the twins pre-check was added to
    // delete in 29.2-01: a crash where a named finding belongs.
    const src = makeSyntheticSrc();
    const target = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
    mkdirSync(join(target, ".grugops", "factory.config.json"), { recursive: true });

    const r = runInstallFrom(src, target, mkTmp());
    // R-5's whole contract in one assertion: a named refusal at the INCOMPLETE code, never a crash.
    expect(`status=${r.status}`).toBe("status=3");
    expect(installedAdapters(target)).toEqual([]);
    expect(r.stdout).toContain("install INCOMPLETE");
    // The REAL path on this machine is named — the generator never ran, so there is no relayed
    // message to carry it.
    expect(r.stdout).toContain(join(target, ".grugops", "factory.config.json"));
    // NOT a stack trace: the crash printed the error class on stderr and nothing on stdout.
    expect(`stack trace on stderr: ${r.stderr.includes("at ")}`).toBe("stack trace on stderr: false");
    // REPORT, DON'T ABORT: every other class still completes. Asserted over the classes THIS
    // fixture ships — a synthetic source carries no memory-bank seed, so asking about one would be
    // asking about a class that was never in the run.
    expect(r.stdout).toContain("-- state seed --");
    expect(existsSync(join(target, ".grugops", "install.json"))).toBe(true);
    expect(existsSync(join(target, ".claude", "skills", "grugops", "SKILL.md"))).toBe(true);
  });

  it("model delivery: a rendered adapter carrying ZERO or TWO recognised banner lines installs NOTHING and names the file (D-14)", () => {
    const provenance = provenanceLiteral();
    // The compiled twin declares the literal on one line, so the anchor is DERIVED from the source
    // reading above rather than spelled again here. patchSyntheticGenerator throws if it is absent,
    // which is this case's premise assertion: an unpatched fixture would assert nothing.
    const anchor = `const PROVENANCE = ${JSON.stringify(provenance)};`;

    for (const [why, replacement] of [
      // ZERO — the generator's wording moved and the installer's recogniser matches nothing. This
      // is the direction that is otherwise SILENT: every target would keep a banner naming a
      // command it cannot run, and the suite would stay green.
      ["zero", `const PROVENANCE = ${JSON.stringify("<!-- GENERATED (reworded) — recognised by nothing -->")};`],
      // TWO — the rendered file is not the shape the installer knows how to rewrite. Taking "the
      // first match" would hide this one.
      ["two", `const PROVENANCE = ${JSON.stringify(`${provenance}\n${provenance}`)};`],
    ] as Array<[string, string]>) {
      const src = makeSyntheticSrc();
      const target = mkTmp();
      writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
      patchSyntheticGenerator(src, anchor, replacement);

      const r = runInstallFrom(src, target, mkTmp());
      const named = `${why}: status=${r.status} names ${SYNTH_ADAPTERS[0]}: ${r.stdout.includes(SYNTH_ADAPTERS[0])}`;
      expect(named).toBe(`${why}: status=3 names ${SYNTH_ADAPTERS[0]}: true`);
      expect(r.stdout).toContain("recognised provenance");
      expect(r.stdout).toContain("install INCOMPLETE");
      // All-or-nothing: the floor is checked before the first write.
      expect(installedAdapters(target)).toEqual([]);
    }
  });

  it("model delivery: an announced alias SET that disagrees with the rendered bytes installs NOTHING and prints both sets", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
    // The bytes still say `inherit` seventeen times; the announcement claims `opus`. This is the
    // closing of the loop: the report is derived from the bytes about to be written and the
    // announcement independently confirms it — neither side alone.
    patchSyntheticGenerator(
      src,
      "console.log(resolvedAssignmentLine(models, modelsConfig.overrides.size));",
      'console.log("' + RESOLVED_ASSIGNMENT_PREFIX + '" + JSON.stringify({ roles: 17, overrides: 0, aliases: ["opus"] }));',
    );

    const r = runInstallFrom(src, target, mkTmp());
    // BOTH SETS AND THE STATUS IN ONE ASSERTION — a disagreement that named only one side would
    // leave the reader to guess which authority was wrong, and a status-only failure would not say
    // that either side went unreported.
    const bothSets = r.stdout.includes("read out of the rendered adapters are [inherit]")
      && r.stdout.includes("the render announced [opus]");
    expect(`status=${r.status} prints both sets: ${bothSets}`).toBe("status=3 prints both sets: true");
    expect(r.stdout).toContain("install INCOMPLETE");
    expect(installedAdapters(target)).toEqual([]);
  });

  it("model delivery: the installer holds NO copy of either announcement prefix — it consults the module that owns them (R-1, D-04)", () => {
    const src = readFileSync(join(import.meta.dirname, "install.ts"), "utf8");
    // The two prefixes stay in scripts/model-tiers.ts. A copy here would be a hand-synced
    // cross-boundary literal whose drift direction is silent: the installer would stop finding the
    // line exactly when the generator stopped announcing it.
    for (const prefix of [RESOLVED_PRESET_PREFIX, RESOLVED_ASSIGNMENT_PREFIX]) {
      expect(`install.ts spells ${JSON.stringify(prefix)}: ${src.includes(prefix)}`).toBe(
        `install.ts spells ${JSON.stringify(prefix)}: false`,
      );
    }
    // The grammar is reached by SPAWNING a probe against the MIRRORED module, so the reader's name
    // appears only inside the probe source literal and never in an import statement.
    expect(src).toContain("resolvedAssignmentsIn");
    const importing = src
      .split("\n")
      .filter((l) => l.includes("resolvedAssignmentsIn") && /^\s*import\b/.test(l));
    expect(importing).toEqual([]);
    expect(src).toContain("RESOLUTION_PROBE_SOURCE");
  });

  // ── THE MIRROR'S INPUT LIST IS THE GENERATOR'S IMPORT CLOSURE, AND THE FIXTURE TRACKS IT ───────
  //
  // install.ts hand-writes the twin list (the same deliberate trade scripts/adapters-freshness.ts
  // records above its own copy: deriving it would mean writing a grammar for "what does this module
  // import" inside an installer). A hand-written list is a set literal, and a set literal that
  // nothing pins is this repository's named second systemic failure class — so the list is read out
  // of install.ts, compared against the one this suite plants into every synthetic source, and its
  // cardinality asserted as an integer so a pair that shrinks together still fails.
  //
  // The reader refuses rather than under-matches: it counts the string literals the AUTHOR wrote
  // inside the block and fails by name if the matcher recovered fewer, which is the WR-04 lesson
  // applied to a list of single strings rather than of tuples.
  function parseStringList(file: string, constName: string): string[] {
    const src = readFileSync(join(import.meta.dirname, file), "utf8");
    // Non-greedy to the FIRST closing bracket, so the same reader handles a one-line list and a
    // multi-line one. An anchor requiring a newline before `];` read a single-line declaration as
    // unterminated and ran on into the rest of the file — recovering strings from code that has
    // nothing to do with the constant, which is the under-match failure this reader exists to make
    // loud rather than the over-match one.
    const block = new RegExp(`const ${constName}: string\\[\\] = \\[([\\s\\S]*?)\\];`).exec(src);
    if (!block) throw new Error(`${file}: could not find the ${constName} list literal`);
    const body = block[1];
    const parsed = [...body.matchAll(/["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
    const declared = (body.match(/["'`][^"'`]+["'`]/g) ?? []).length;
    if (parsed.length !== declared) {
      throw new Error(
        `${file}: ${constName} declares ${declared} entr(ies) but only ${parsed.length} were parsed — ` +
          "an entry is in a shape this test cannot read, so the set derived here would cover less " +
          "than the source does while every count beside it still passed",
      );
    }
    return parsed;
  }

  it("model delivery: the installer's GENERATOR_TWINS is the four-file import closure this suite plants, and names no canonical-frontmatter", () => {
    const twins = parseStringList("install.ts", "GENERATOR_TWINS");
    expect([...twins].sort()).toEqual([...SYNTH_GENERATOR_TWINS].sort());
    // The integer, so a pair that shrinks together still fails. FOUR, not five: the generator does
    // not import canonical-frontmatter.js, so mirroring it would be a fifth file nothing reads.
    expect(twins.length).toBe(4);
    expect(SYNTH_GENERATOR_TWINS.length).toBe(4);
    expect(twins.filter((t) => t.includes("canonical-frontmatter"))).toEqual([]);

    const kitSources = parseStringList("install.ts", "GENERATOR_KIT_SOURCES");
    expect([...kitSources].sort()).toEqual([...SYNTH_GENERATOR_KIT_SOURCES].sort());
    expect(kitSources.length).toBe(2);
    // agent-factory/config is DELIBERATELY ABSENT: its absence inside the mirror is what makes D-06
    // true by construction, so a member naming it would be the decision being reversed in silence.
    expect(kitSources.filter((s) => s.includes("config"))).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────────────────────────
  // THE STRUCTURAL PINS (29.2 plan 02, task 3). Each derives its set rather than listing it, and
  // each asserts its own premise before its effect.
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // parseTwinCopies — recover the generator-module copy calls out of scripts/adapters-freshness.ts's
  // SOURCE TEXT, with the declared-versus-parsed floor parseMappingBody established.
  //
  // "Declared" is the count of NON-COMMENT lines that name SCRIPT_ROOT together with the scripts
  // directory. That is the shape-INDEPENDENT count of copy sources the author wrote: a committed
  // twin can only be named by joining that root with that directory, whatever quoting or call shape
  // the line uses. Counting those lines rather than trusting the full matcher is what makes this a
  // floor the matcher cannot slip under — an entry written as an expression, or with the path
  // segments joined differently, fails LOUDLY by name instead of shrinking the set while every
  // integer beside it still passes.
  //
  // WHAT IT DOES NOT BOUND, stated rather than implied: a future copy that reaches the committed
  // twins WITHOUT naming SCRIPT_ROOT at all (a different root constant, say) is invisible to both
  // halves. What catches that is the set equality below — the install side would have gained a
  // member the freshness side did not, and the two sets would not be equal.
  //
  // Takes the text rather than reading it, so the refusal itself is testable against a synthetic
  // string without touching the real source.
  function parseTwinCopies(file: string, text: string): string[] {
    const parsed = [
      ...text.matchAll(/cpSync\(\s*join\(SCRIPT_ROOT,\s*["'`]scripts["'`],\s*["'`]([^"'`]+)["'`]\s*\)/g),
    ].map((m) => `scripts/${m[1]}`);
    const declared = text
      .split("\n")
      .filter((l) => !/^\s*\/\//.test(l) && l.includes("SCRIPT_ROOT") && l.includes("scripts")).length;
    if (parsed.length !== declared) {
      throw new Error(
        `${file}: the twin copy block declares ${declared} source(s) but only ${parsed.length} were parsed — ` +
          "an entry is in a shape this test cannot read, so the set derived here would cover less " +
          "than the source does while every count beside it still passed",
      );
    }
    return parsed;
  }

  it("model delivery: the install-side twin list and the freshness harness's twin list are the SAME four modules (29.2 plan 02)", () => {
    // WHAT THIS EXISTS FOR. Two hand-maintained mirrors of one fact — the generator's import
    // closure — sit in two files that nothing else relates. A fifth generator import that reached
    // only one of them would leave the other's mirrored generator failing to resolve it in exactly
    // the situations neither file's own tests cover. This is the pairing the RUNNABLES /
    // RUNNABLES_MIRROR case established, applied to the second such pair on this tree.
    const installSide = parseStringList("install.ts", "GENERATOR_TWINS");
    const freshnessSrc = readFileSync(join(REPO_ROOT, "scripts", "adapters-freshness.ts"), "utf8");
    const freshnessSide = parseTwinCopies("scripts/adapters-freshness.ts", freshnessSrc);

    expect([...freshnessSide].sort()).toEqual([...installSide].sort());
    // BOTH integers, so a pair that shrinks together still fails.
    expect(`install-side twins: ${installSide.length}`).toBe("install-side twins: 4");
    expect(`freshness-side twins: ${freshnessSide.length}`).toBe("freshness-side twins: 4");
  });

  it("model delivery: the twin-copy parser FAILS LOUDLY on a shape it cannot read, it does not shrink the set (WR-04 idiom)", () => {
    // Proven in the suite, against in-memory text — neither real source is touched by this case.
    const readable =
      '  cpSync(join(SCRIPT_ROOT, "scripts", "one.js"), join(tmp, "scripts", "one.js"));\n' +
      "  cpSync(join(SCRIPT_ROOT, 'scripts', 'two.js'), join(tmp, 'scripts', 'two.js'));\n";
    // Control: without this arm the refusal below would be vacuous.
    expect(parseTwinCopies("synthetic.ts", readable)).toEqual(["scripts/one.js", "scripts/two.js"]);

    // The refusal: a third source built from an EXPRESSION rather than a literal — a shape no amount
    // of quote-widening reaches, which is why the floor counts lines instead of trusting the matcher.
    const unreadable = readable + '  cpSync(join(SCRIPT_ROOT, "scripts", NAME + ".js"), join(tmp, "scripts", "three.js"));\n';
    let msg = "";
    try {
      parseTwinCopies("synthetic.ts", unreadable);
    } catch (e) {
      msg = (e as Error).message;
    }
    // The message must NAME things, or a future reader gets a count with no way to act on it.
    expect(msg).toContain("synthetic.ts"); // the file
    expect(msg).toContain("declares 3 source(s)"); // declared
    expect(msg).toContain("only 2 were parsed"); // parsed
    expect(msg).toContain("a shape this test cannot read"); // the cause
  });

  it("model delivery: the banner literal install.ts recognises is BYTE-EQUAL to the generator's own declaration (D-14)", () => {
    // The generator module cannot be imported — it writes seventeen files at load, which is the same
    // reason scripts/coordinator-resolution-precheck.ts restates its own copy of the materialization
    // sentinels. So the authority is read as SOURCE TEXT.
    const provenance = provenanceLiteral();
    const installSrc = readFileSync(join(import.meta.dirname, "install.ts"), "utf8");
    const m = /const KIT_BANNER\s*=\s*\n?\s*"([^"]+)";/.exec(installSrc);
    expect(`install.ts declares KIT_BANNER: ${m !== null}`).toBe("install.ts declares KIT_BANNER: true");
    // Byte equality, em dash included. A drift here is SILENT in the dangerous direction: the
    // installer's recogniser would stop matching and every target would keep a banner naming a
    // command it cannot run, with nothing going red.
    expect(m![1]).toBe(provenance);

    // ...AND ANCHORED TO THE REAL EMITTED BYTES, not only to two source spellings. Two spellings can
    // agree with each other while both have drifted away from what the generator actually writes.
    // The adapter set is DERIVED from the directory listing, never named.
    const adapters = listAgentAdapters(REPO_ROOT);
    expect(`committed adapters: ${adapters.length}`).toBe("committed adapters: 17");
    for (const rel of adapters) {
      const lines = readFileSync(join(REPO_ROOT, ".claude", "agents", rel), "utf8").split("\n");
      expect(`${rel}: carries the literal ${lines.filter((l) => l === provenance).length} time(s)`).toBe(
        `${rel}: carries the literal 1 time(s)`,
      );
    }
  });

  it("model delivery: the run reports its classes in the pinned order — kit, then adapters, then state seed (D-05)", () => {
    // D-05 says the four-step sequence is NOT reordered, and this phase leaned on that: a fresh
    // install has no non-inherit answer to miss BECAUSE the seed carries no models key and is
    // written after the adapters. THE ORDERING WAS TREATED AS PINNED BEFORE THIS PHASE AND WAS NOT
    // — no assertion on the sequence or on report ordering existed anywhere in this file. It does
    // now, over a real run's stdout.
    const target = makeFixture();
    const home = mkTmp();
    const r = runInstall(target, home);
    expect(r.status).toBe(0);

    const kit = r.stdout.indexOf("-- kit --");
    const adapters = r.stdout.indexOf("-- adapters --");
    const seed = r.stdout.indexOf("-- state seed --");
    // Present first — an index comparison over two -1s would "pass" vacuously.
    expect(`kit/adapters/state-seed headings present: ${kit >= 0}/${adapters >= 0}/${seed >= 0}`).toBe(
      "kit/adapters/state-seed headings present: true/true/true",
    );
    expect(`kit before adapters: ${kit < adapters}`).toBe("kit before adapters: true");
    expect(`adapters before state seed: ${adapters < seed}`).toBe("adapters before state seed: true");
  });

  it("model delivery: the shipped seed carries NO `models` key, so a freshly seeded target resolves `inherit` everywhere (D-08)", () => {
    const raw = readFileSync(join(REPO_ROOT, "agent-factory", "seed", ".grugops", "factory.config.json"), "utf8");
    const parsed: unknown = JSON.parse(raw);
    // PREMISE: it parses to a real object...
    expect(`the seed parses to an object: ${parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)}`).toBe(
      "the seed parses to an object: true",
    );
    // ...and a NON-EMPTY one, so this case cannot pass vacuously over an unreadable or empty file.
    const keys = Object.keys(parsed as Record<string, unknown>);
    expect(`the seed carries ${keys.length > 0 ? "some" : "no"} keys`).toBe("the seed carries some keys");
    // The claim: absent resolves to `inherit`, which is the same answer an absent file gives — and
    // that identity is what makes the unchanged four-step ordering above safe.
    expect(`the seed declares a models block: ${keys.includes("models")}`).toBe(
      "the seed declares a models block: false",
    );
  });

  it("model delivery: a target installed with a NON-DEFAULT preset is still fully removed by the uninstaller", () => {
    const target = makeFixture();
    const home = mkTmp();
    writeTargetConfig(target, '{"models":{"preset":"tiered"}}\n');
    expect(runInstall(target, home).status).toBe(0);

    // PREMISE: the adapters really did render with a NON-DEFAULT alias — otherwise this is the
    // ordinary uninstall case wearing a different name.
    const aliases = [...new Set(targetModelLines(target))].sort();
    expect(`the rendered aliases are the zero-config answer: ${aliases.join(",") === "inherit"}`).toBe(
      "the rendered aliases are the zero-config answer: false",
    );
    for (const a of aliases) expect(MODEL_ALIASES).toContain(a);
    const installed = installedAdapters(target);
    expect(installed.length).toBe(17);

    expect(runUninstall(target, home).status).toBe(0);
    // WHY THIS HOLDS, AND WHY IT IS WORTH ASSERTING: removal is by DERIVED NAME over
    // srcAdapterFiles($GRUGOPS_SRC), never by content, so a per-target RENDERED adapter is still
    // inside the removal set even though its bytes were never in the kit. The failure this guards
    // against is the reversibility gap where install places a file uninstall cannot see.
    for (const rel of installed) {
      expect(`${rel} survives uninstall: ${existsSync(join(target, ".claude", "agents", rel))}`).toBe(
        `${rel} survives uninstall: false`,
      );
    }
    expect(existsSync(join(target, ".claude", "agents"))).toBe(false);
  });

  it("model delivery: the mirror declares its module type, so a bare `.js` twin cannot fail to parse on Node 22.0-22.11", () => {
    // WHY THIS IS PINNED. The committed twins are ES modules with a bare `.js` extension, and Node
    // decides that from the nearest package.json `type` field. A mkdtemp directory under the system
    // temp root has none above it, and implicit-ESM detection for a bare `.js` only became the
    // default in Node 22.12 — below that the mirrored generator dies with a syntax error about an
    // import statement, and R-5 turns that into an install that lays down no adapter at all. The
    // declaration is one file at the mirror root; this case is what stops it being deleted as
    // redundant on whichever Node the author happened to be running.
    for (const path of [join(import.meta.dirname, "install.ts"), INSTALL_JS]) {
      const src = readFileSync(path, "utf8");
      expect(`${path}: ${src.includes('{"type":"module"}')}`).toBe(`${path}: true`);
    }
  });

  it("model delivery: install.ts reaches the generator by SPAWNING it, never by importing anything under scripts/ (D-18/D-28)", () => {
    const src = readFileSync(join(import.meta.dirname, "install.ts"), "utf8");
    const scriptsImports = src
      .split("\n")
      .filter((l) => /^\s*(import|export)\b/.test(l) && /scripts\//.test(l));
    // Named rather than counted, so a failure prints the offending line instead of `1 !== 0`.
    expect(scriptsImports).toEqual([]);
    // ...and the spawn is by absolute interpreter path with no shell, so nothing target-derived can
    // reach a command line (T-29.2-01).
    expect(src).toContain("process.execPath");
    expect(`install.ts uses a shell: ${src.includes("shell: true")}`).toBe("install.ts uses a shell: false");
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

  // SC3 / CR-01: bounded marker-strip — migrate re-materializes the resolver files via
  // materializeAdapter, which strips a prior grugops:materialized-kit block from the SOURCE file
  // before injecting the fresh KIT line. CR-01 guarantees that an UNTERMINATED open marker (no close)
  // in that source loses NO following lines (it buffers the block and restores it at EOF rather than
  // swallowing the rest of the file).
  //
  // THE PLANT MOVED FROM THE AGENT ADAPTER TO THE RESOLVER SKILL (29.2-01), AND THAT IS WHERE THE
  // MECHANISM NOW LIVES. materializeAdapter is unchanged and its bounded-removal loop is unchanged;
  // what changed is which BYTES reach it. An agent adapter's bytes now come from the install-time
  // mirror render (D-01), so an unterminated marker written into a source AGENT adapter is never
  // read by anything and a case planting one there would assert nothing. The resolver SKILL is still
  // materialized straight from $GRUGOPS_SRC — routing is by the slot line in the body (D-06), not by
  // directory — so it is the surface that still carries source bytes into that loop, and the CR-01
  // invariant is asserted over it unchanged: the line after an unterminated open survives.
  it("migrate: bounded marker-strip", () => {
    const src = makeSyntheticSrc();
    // The resolver SKILL source carries an UNTERMINATED grugops:materialized-kit open marker (no
    // close) followed by a sentinel line and the MAT_SLOT line. CR-01: the unterminated block is
    // restored verbatim at EOF rather than swallowing every following line.
    writeFileSync(
      join(src, ".claude", "skills", "grugops", "SKILL.md"),
      "# <!-- grugops:materialized-kit -->\n" +
        'KIT="/will/be/stripped"\n' +
        "SENTINEL-AFTER-UNTERMINATED-OPEN-MUST-SURVIVE\n" +
        `${MAT_SLOT}\n`,
    );

    const target = makeOldLayoutFixture();
    const home = mkTmp();
    const r = spawnSync("node", [INSTALL_JS, "--yes", "--migrate"], {
      encoding: "utf8",
      env: { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: src, GRUGOPS_HOME: home, TARGET: target },
    });
    expect(r.status).toBe(0);
    const after = readFileSync(join(target, ".claude", "skills", "grugops", "SKILL.md"), "utf8");
    // the line following the unterminated open is preserved (CR-01 bounded removal — no loss).
    expect(after).toContain("SENTINEL-AFTER-UNTERMINATED-OPEN-MUST-SURVIVE");
    // ...and so is EVERY line the never-closed block buffered, in order: the guarantee is "lose
    // nothing", not "keep the one line this case happens to name".
    expect(after.split("\n").filter((l) => l !== "")).toEqual([
      'KIT="/will/be/stripped"',
      "SENTINEL-AFTER-UNTERMINATED-OPEN-MUST-SURVIVE",
      MAT_SLOT,
    ]);
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
    // flat-directory contract admits it: the correct outcome is installed, then removed. It REPLACES
    // an existing member rather than adding an eighteenth (29.2-01) — see linkifyMember for why the
    // representation, not the cardinality, is what this plant is for.
    const linkedAdapter = SYNTH_ADAPTERS[0];
    const linkTarget = SYNTH_ADAPTERS[1];
    // PLANT 2 — a symlinked SKILL DIRECTORY inside the source .claude/skills whose target holds a
    // real SKILL.md. The platform loads it as a skill, so the installer installs it and the reversal
    // must remove it. Skills are NOT rendered, so this one still ADDS a member.
    const linkedSkill = "grugops-linked-skill";
    if (canSymlink) {
      linkifyMember(src, linkedAdapter, linkTarget);
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
      // The link's TARGET is a distinct member and lands too — a symlink and its target in one
      // directory are two members, never one merged member (KIT-01 adjacency edge).
      expect(existsSync(join(target, ".claude", "agents", linkTarget))).toBe(true);
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
      expect(existsSync(join(target, ".claude", "agents", linkTarget))).toBe(false);
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
    //
    // THE PLANT REPLACES A MEMBER RATHER THAN ADDING ONE (29.2-01). It used to add an eighteenth
    // adapter; the installer now refuses any install set that disagrees with the mirror's rendered
    // set, and no render can produce an invented name, so an added member would exercise that
    // refusal instead of the derivation split this case exists for. The SHAPE that split the two
    // derivations is a symlink, not an extra file, and the shape is what is planted.
    const linkName = SYNTH_ADAPTERS[0];
    const linkTarget = SYNTH_ADAPTERS[1];
    linkifyMember(src, linkName, linkTarget);

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
    // CARDINALITY AS A NUMBER, taken from the derived set rather than written as a literal — the
    // plant changes one member's representation and never the count, so the count is the SAME
    // seventeen on both sides and a derivation that dropped the symlink fails HERE.
    expect(SYNTH_ADAPTERS.length).toBe(17);
    expect(authorityAdapters.length).toBe(17);
    expect(installedAdapters(target).length).toBe(17);
    // ...and the link is genuinely a link in the source, or the assertions above are a statement
    // about an ordinary file and this case has quietly stopped being the WR-02 fixture.
    expect(lstatSync(join(src, ".claude", "agents", linkName)).isSymbolicLink()).toBe(true);

    // The link's TARGET is still installed too — a symlink and its target in the same directory
    // are two distinct members of the set, never one merged member (KIT-01 adjacency edge).
    expect(installedAdapters(target)).toContain(linkTarget);

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

  // ── D-36 / WR-04: the cycle arm NAMES the path it declined to descend into ───────────────────
  //
  // D-29 gave this walk a correct cycle ANSWER and left it with no cycle VOICE: it stopped
  // descending and said nothing at all — no name, no count, no verification line, and the run went
  // on to whatever banner the other classes earned. Measured against the pre-fix committed .js over
  // exactly this fixture: srcNestedAdapterFiles returned `["real/x.md"]` and `real/loop` appeared
  // nowhere in the installer's output. That is the silent disappearance kit-source.ts's header
  // forbids twice in its own words, so the arm now records the declined path and the installer
  // names it through the SAME single `verify` channel every other refusal uses.
  //
  // SCOPED HONESTLY (and this scoping is part of what the case pins): both walk sites decline the
  // SAME set on a cycle, so this is NOT the installer being blind to a member the authority sees,
  // and install/uninstall stay symmetric because they share this one derivation. It is strictly
  // weaker than CR-03 and is closed as an honesty fix. Whether the platform LOADS the paths
  // reachable only through such a cycle is `UNKNOWN - verify`; nothing here rests on it.
  it("source derivation: a symlink CYCLE is reported BY NAME and blocks the completion banner (WR-04, D-36)", () => {
    // Same Windows skip and the same reason as the symlink cases above: symlinkSync needs a
    // privilege the runner may not hold, and a case that cannot build its fixture asserts nothing.
    if (process.platform === "win32") return;

    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    // The WR-04 reproduction: a leaf adapter under `real/`, plus a link in that same directory
    // pointing at its own parent. Walking `real/loop` arrives back at `.claude/agents`, which is
    // already on this recursion path — a genuine cycle, not a mere alias.
    mkdirSync(join(src, ".claude", "agents", "real"), { recursive: true });
    writeFileSync(join(src, ".claude", "agents", "real", "x.md"), `> synthetic nested adapter\n${MAT_SLOT}\n`);
    symlinkSync("..", join(src, ".claude", "agents", "real", "loop"));

    const r = runInstallFrom(src, target, home);
    expect(r.status).toBe(3); // INCOMPLETE (27-21) — a declined subtree is not a complete run.
    // THE NAME. `real/loop` is the exact relative path the walk declined, and it must appear.
    expect(r.stdout).toContain("real/loop");
    expect(r.stdout).toContain("DECLINED TO DESCEND");
    expect(r.stdout).not.toContain("== install complete");
    // The leaf below the cycle's own directory is still seen and still refused by name — the cycle
    // arm stops the DESCENT, it does not narrow the rest of the walk.
    expect(r.stdout).toContain("real/x.md");
    // Membership is untouched: the flat seventeen install, neither planted path lands.
    expect(installedAdapters(target)).toEqual([...SYNTH_ADAPTERS].sort());
    expect(existsSync(join(target, ".claude", "agents", "real"))).toBe(false);

    // THE TWO SIDES NAME THE SAME PATH THROUGH THEIR OWN FLOORS — reported here, thrown there.
    // Member-set equality is unavailable once one side throws, so the equality asserted is "both
    // name the same relative path and NEITHER is silent". Recorded for the WR-03 equality case.
    const walk = srcNestedAdapterFiles(src);
    expect(walk.cycles).toEqual(["real/loop"]);
    expect(walk.files).toEqual(["real/x.md"]);
    expect(walk.overflow).toBeNull();
    let thrown = "";
    try {
      listAgentAdapters(src);
    } catch (e) {
      thrown = (e as Error).message;
    }
    expect(thrown).toContain("real/loop");
    expect(thrown).toMatch(/^kit-model: symlink cycle at real\/loop/);
  });

  // ── D-41 / CR-02: AN UNREADABLE NESTED DIRECTORY IS REFUSED BY NAME, NOT SILENTLY COMPLETED ───
  //
  // THE DEFECT WAS AN INVERSION, WHICH IS WHY THIS CASE CARRIES ITS CONTROL. srcNestedAdapterFiles
  // had two bare `catch { return; }` arms and a result type with three channels, so a directory it
  // could not read produced no member, no channel and no finding — and the installer went on to
  // claim a completion. Reproduced against the pre-fix committed .js over the fixture below:
  //
  //   [restricted] walk.files = []            installer status = 0   banner `== install complete ==`
  //               'nested' appears in the installer's whole output: false
  //   [readable]   walk.files = ["nested/hidden.md"]  status = 3      banner `== install INCOMPLETE`
  //
  // MAKING THE DIRECTORY LESS READABLE MADE THE INSTALLER MORE CONFIDENT. That is the fact this
  // case pins, and it is why asserting a non-zero exit over the restricted arm ALONE would not pin
  // it: exit 3 on one arm says nothing about the relationship between the arms. The control is not
  // decoration, it is half the assertion.
  it("source derivation: an UNREADABLE nested directory is named at exit 3 — the less-readable/more-confident inversion is dead (CR-02, D-41)", () => {
    const { src, nest } = makeUnreadableNestFixture();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    try {
      // ── ARM 1: RESTRICTED. Built, then PROBED — never asserted over a restriction that did not
      // take. The reason is printed on the skip so the case is never silently vacuous.
      const probe = restrictAndProbe(nest, 0o000);
      if (!probe.restricted) {
        console.log(probe.reason);
      } else {
        const walk = srcNestedAdapterFiles(src);
        // The channel exists and the walk WRITES to it. Asserted before the installer's output,
        // because a finding printed without a channel behind it would be a message, not a report.
        expect(walk.unreadable).toEqual([UNREADABLE_NEST_REL]);
        // ...and the member is still gone from `files`, which is exactly why the channel is needed:
        // the walk genuinely cannot see it, so the honest answer is "I could not look", not "none".
        expect(walk.files).toEqual([]);

        const r = runInstallFrom(src, target, home);
        expect(r.status).toBe(3); // INCOMPLETE — a directory never read is not a complete run.
        expect(r.stdout).toContain(`.claude/agents/${UNREADABLE_NEST_REL}`);
        expect(r.stdout).toContain("COULD NOT READ this directory");
        // THE REMEDY FOLLOWS FROM A READ FAILURE, and the message says out loud that this is not an
        // empty directory — conflating the two is the defect wearing a different spelling.
        expect(r.stdout).toContain("NOT the same fact as an empty directory");
        expect(r.stdout).toContain("Fix the permissions");
        expect(r.stdout).not.toContain("== install complete");
        // The flat seventeen are unaffected: the unreadable arm refuses a subtree, it does not
        // narrow the install.
        expect(installedAdapters(target)).toEqual([...SYNTH_ADAPTERS].sort());
      }

      // ── ARM 2: THE READABLE CONTROL, over the IDENTICAL tree. It also exits 3, but for the
      // pre-existing flat-by-contract reason and naming the MEMBER rather than the directory — so
      // the two arms are DISTINGUISHABLE rather than merely both non-zero, and the inversion is
      // what is pinned rather than a bare exit code.
      chmodSync(nest, 0o755);
      const walkOk = srcNestedAdapterFiles(src);
      expect(walkOk.unreadable).toEqual([]);
      expect(walkOk.files).toEqual([UNREADABLE_NEST_MEMBER]);

      const target2 = mkTmp();
      const home2 = mkTmp();
      writeFileSync(join(target2, "CLAUDE.md"), "# User Project\n");
      const r2 = runInstallFrom(src, target2, home2);
      expect(r2.status).toBe(3);
      expect(r2.stdout).toContain(UNREADABLE_NEST_MEMBER);
      expect(r2.stdout).toContain("FLAT BY CONTRACT");
      // The control must NOT report the read failure — it read the directory fine.
      expect(r2.stdout).not.toContain("COULD NOT READ this directory");
      expect(r2.stdout).not.toContain("== install complete");
    } finally {
      // ALWAYS restore, on every path including a failed assertion, so a red case cannot leave an
      // unremovable temporary tree behind for afterEach to trip over.
      chmodSync(nest, 0o755);
    }
  });

  it("source derivation: a readable but genuinely EMPTY nested directory produces NO unreadable finding (CR-02, D-41)", () => {
    // THE CHANNEL REPORTS A READ FAILURE AND NEVER AN ABSENCE. If "could not read" and "held
    // nothing" collapsed into one finding, the fix would have reinstated the fabricated completion
    // claim in a new spelling — a remedy pointing at permissions on a directory whose permissions
    // are fine. The two conditions have different remedies, so they must stay two conditions.
    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
    mkdirSync(join(src, ".claude", "agents", "empty-nest"), { recursive: true });

    const walk = srcNestedAdapterFiles(src);
    expect(walk.unreadable).toEqual([]);
    expect(walk.files).toEqual([]);
    expect(walk.cycles).toEqual([]);

    const r = runInstallFrom(src, target, home);
    // A readable empty nested directory is a COMPLETE run: everything below it was examined and
    // there was nothing there. Exit 0 is the honest answer and the case pins it.
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain("COULD NOT READ this directory");
    expect(r.stdout).toContain("== install complete");
    expect(installedAdapters(target)).toEqual([...SYNTH_ADAPTERS].sort());
  });

  // ── WR-03: THE EQUALITY BOTH WALK HEADERS PROMISE, WRITTEN DOWN AS A CASE ─────────────────────
  //
  // install/kit-source.ts and scripts/kit-model.ts both concede ONE PREDICATE, TWO SITES, NO IMPORT
  // in the same words, and both discharge it the same way: "the equality is bought by CASES". Until
  // now the only case that existed compared the installer's INSTALL set (the flat top level) with
  // the authority's set. The NESTED walks — the two recursive implementations that have between
  // them produced every defect this phase has fixed — were compared by nothing. A promise in two
  // headers is not a forcing function; this is.
  //
  // It is in TWO PARTS because after D-36 the two sides answer a cycle DIFFERENTLY BY DESIGN, each
  // through its own documented floor: the installer REPORTS so it can finish its other classes, the
  // CI authority THROWS so a vacuous scan set cannot pass a guard. Member-set equality is therefore
  // structurally unavailable over a cycle, and asserting it anyway would only be satisfiable by
  // weakening one of the two floors — which is the opposite of what these cases are for. So the
  // honest formulation is: equal MEMBERS where the two agree, and the same PATH NAMED where they
  // deliberately differ.
  it("WR-03 part 1: over the two-path fixture the installer's NESTED walk equals the authority's nested subset, by member AND by count", () => {
    // Same Windows skip and reason as every symlink case here: symlinkSync needs a privilege the
    // runner may not hold, and a case that cannot build its fixture asserts nothing.
    if (process.platform === "win32") return;

    const src = makeSyntheticSrc();

    // The CR-03 shape: ONE physical directory holding a leaf, reached by TWO relative paths. No
    // cycle anywhere, so both sides are on their normal arm and full member equality is available.
    mkdirSync(join(src, ".claude", "agents", "real"), { recursive: true });
    writeFileSync(join(src, ".claude", "agents", "real", "x.md"), `> synthetic nested adapter\n${MAT_SLOT}\n`);
    symlinkSync(join(src, ".claude", "agents", "real"), join(src, ".claude", "agents", "alias"));

    // The authority answers "what is an adapter" for the WHOLE tree; the installer's nested walk
    // answers it for everything BELOW the top level. Narrow the authority's set at the CALL SITE
    // rather than re-deriving it — a second derivation of "nested" here would be a third
    // implementation of the predicate these cases exist to keep down to two.
    const authorityNested = listAgentAdapters(src).filter((m) => m.includes("/"));
    const walk = srcNestedAdapterFiles(src);

    expect(walk.files).toEqual(authorityNested);
    // Cardinality as a NUMBER, on both sides: two empty arrays are `toEqual`, so without this a
    // derivation that silently shrinks to nothing would pass the comparison above.
    expect(walk.files.length).toBe(2);
    expect(authorityNested.length).toBe(2);
    // ...and this is the non-cycle arm on both sides, which is why the equality above is available.
    expect(walk.cycles).toEqual([]);
    expect(walk.overflow).toBeNull();
  });

  it("WR-03 part 2: over the CYCLE fixture the two sides name the SAME declined path and neither is silent (D-36)", () => {
    if (process.platform === "win32") return;

    const src = makeSyntheticSrc();

    // The WR-04 reproduction: a leaf under `real/`, plus a link in that directory pointing at its
    // own parent, so walking `real/loop` arrives back at a directory already on the recursion path.
    mkdirSync(join(src, ".claude", "agents", "real"), { recursive: true });
    writeFileSync(join(src, ".claude", "agents", "real", "x.md"), `> synthetic nested adapter\n${MAT_SLOT}\n`);
    symlinkSync("..", join(src, ".claude", "agents", "real", "loop"));

    const walk = srcNestedAdapterFiles(src);
    let thrown = "";
    try {
      listAgentAdapters(src);
    } catch (e) {
      thrown = (e as Error).message;
    }

    // NEITHER SIDE IS SILENT. Asserted before the equality, because two silences are trivially
    // "equal" and that is the exact failure both floors exist to prevent.
    expect(`installer named a cycle: ${walk.cycles.length > 0}`).toBe("installer named a cycle: true");
    expect(`authority threw: ${thrown !== ""}`).toBe("authority threw: true");

    // THE SAME PATH, EXTRACTED FROM EACH SIDE RATHER THAN RESTATED INTO BOTH. The authority's name
    // is pulled out of its message by capture, so if either side stops naming the path this fails —
    // which is the difference between asserting the naming and asserting a literal twice.
    const reported = walk.cycles[0];
    const m = /^kit-model: symlink cycle at (.+?) while walking /.exec(thrown);
    expect(`authority message names a path: ${m !== null}`).toBe("authority message names a path: true");
    const namedByAuthority = m![1];
    expect(`authority=${namedByAuthority} installer=${reported}`).toBe(`authority=${reported} installer=${reported}`);

    // Only NOW pin the observed literal, as a sanity check on the fixture rather than as the
    // equality itself. `real/loop` is the value measured against the committed .js in 27-31.
    expect(reported).toBe("real/loop");
    expect(walk.cycles.length).toBe(1);
    // The rest of the walk is unaffected on both sides: the cycle arm stops a DESCENT, it does not
    // narrow anything else, and the work bound did not fire.
    expect(walk.files).toEqual(["real/x.md"]);
    expect(walk.overflow).toBeNull();
  });

  // WHY THERE IS A PART 3, AND WHY ITS ABSENCE IS THE POINT (D-41, CR-02). Parts 1 and 2 cover the
  // TWO-PATH arm and the CYCLE arm. The twins diverged on the THIRD arm — the one where a directory
  // cannot be read — and a case whose entire purpose is asserting that the twins agree stayed green
  // through it, because the arm it diverged on was not one of the arms it looked at. The authority
  // threw and named the directory; the installer returned an empty set and named nothing. Two
  // implementations of one predicate, one of them silent, and the equality case that exists to catch
  // exactly that reported PASS.
  //
  // THE HONEST EQUALITY HERE IS "BOTH NAME THE SAME MEMBER AND NEITHER IS SILENT", NOT "BOTH RETURN
  // THE SAME VALUE" — the same formulation part 2 uses and for the same reason. The two sides have
  // deliberately DIFFERENT documented floors: the CI authority throws so a vacuous scan set cannot
  // pass a guard, the installer reports so it can finish its other classes. Member-set equality is
  // structurally unavailable once one side throws, and asserting it anyway would only be satisfiable
  // by weakening one of the two floors — the opposite of what these cases are for.
  it("WR-03 part 3: over the UNREADABLE fixture the two sides name the SAME directory and neither is silent (CR-02, D-41)", () => {
    const { src, nest } = makeUnreadableNestFixture();
    try {
      const probe = restrictAndProbe(nest, 0o000);
      if (!probe.restricted) {
        console.log(probe.reason);
        return;
      }

      const walk = srcNestedAdapterFiles(src);
      let thrown = "";
      let threw = false;
      try {
        listAgentAdapters(src);
      } catch (e) {
        threw = true;
        thrown = (e as Error).message;
      }

      // NEITHER SIDE IS SILENT — ASSERTED FIRST, in this order, because two silences are trivially
      // "equal" and that is precisely how this case's two existing parts stayed green while one
      // side said nothing. The equality below is worthless without these two lines above it.
      expect(`authority threw: ${threw}`).toBe("authority threw: true");
      expect(`installer named an unreadable directory: ${walk.unreadable.length > 0}`).toBe(
        "installer named an unreadable directory: true",
      );

      // THE SAME DIRECTORY, EXTRACTED FROM EACH SIDE RATHER THAN RESTATED INTO BOTH — the precedent
      // part 2 sets. The authority names an ABSOLUTE path and the installer a RELATIVE one, so the
      // substance asserted is that the authority's path ENDS at the member the installer recorded,
      // inside the same tree. A naked `includes(rel)` would pass on a temp path that happened to
      // contain the word; extraction plus a suffix cannot.
      const reported = walk.unreadable[0];
      const m = /^kit-model: cannot read kit directory (.+)$/.exec(thrown);
      expect(`authority message names a path: ${m !== null}`).toBe("authority message names a path: true");
      const namedByAuthority = m![1];
      const expectedSuffix = join(".claude", "agents", reported);
      expect(`authority path ends at the installer's member: ${namedByAuthority.endsWith(expectedSuffix)}`).toBe(
        "authority path ends at the installer's member: true",
      );
      expect(`authority path is inside the fixture: ${namedByAuthority.startsWith(src)}`).toBe(
        "authority path is inside the fixture: true",
      );

      // Only NOW pin the observed literals, as a sanity check on the FIXTURE rather than as the
      // equality itself. Both measured against the committed .js while writing this case.
      expect(reported).toBe(UNREADABLE_NEST_REL);
      expect(walk.unreadable.length).toBe(1);
      expect(thrown).toMatch(/^kit-model: cannot read kit directory /);
      // The rest of the walk is unaffected: the unreadable arm stops a DESCENT and narrows nothing
      // else, and neither of the other two failure channels fired.
      expect(walk.cycles).toEqual([]);
      expect(walk.overflow).toBeNull();
    } finally {
      chmodSync(nest, 0o755);
    }
  });

  // ── D-35 / WR-01: the WORK bound, pinned on BOTH sides of its threshold ──────────────────────
  //
  // The ancestor stack answers "is this a cycle on THIS path" and answers nothing about cost. A
  // symlink DAG has NO cycle and still yields exponentially many distinct relative paths. Measured
  // against the pre-fix committed .js over a 15-directory forward-linked DAG: 32,767 members in
  // 11.3 seconds, doubling per added directory, from a tree the cycle answer correctly calls
  // cycle-free at every step. The installer walks a USER-SUPPLIED source root, so that shape is
  // reachable from outside.
  //
  // Both fixtures are sized FROM the imported MAX_WALK_ENTRIES constant, never from a restated
  // number: a later change to the bound moves them with it rather than leaving them asserting
  // against a stale threshold.

  it(`source derivation: a walk examining EXACTLY MAX_WALK_ENTRIES (${MAX_WALK_ENTRIES}) entries succeeds — the bound does not narrow membership (D-35)`, () => {
    const src = mkTmp();
    const dir = join(src, ".claude", "agents", "nest");
    mkdirSync(dir, { recursive: true });
    // Top-level `.claude/agents` contributes ONE examined entry (`nest`), so the nested directory
    // holds one fewer than the bound and the walk examines exactly the bound's worth.
    for (let i = 0; i < MAX_WALK_ENTRIES - 1; i++) {
      writeFileSync(join(dir, `a${String(i).padStart(6, "0")}.md`), "x\n");
    }
    const walk = srcNestedAdapterFiles(src);
    expect(walk.overflow).toBeNull();
    expect(walk.cycles).toEqual([]);
    expect(walk.files.length).toBe(MAX_WALK_ENTRIES - 1);
    expect(walk.files).toEqual([...walk.files].sort());
  }, 60_000);

  it(`source derivation: a walk examining ONE entry beyond MAX_WALK_ENTRIES (${MAX_WALK_ENTRIES + 1}) refuses, naming the bound (D-35)`, () => {
    const src = mkTmp();
    const dir = join(src, ".claude", "agents", "nest");
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < MAX_WALK_ENTRIES; i++) {
      writeFileSync(join(dir, `a${String(i).padStart(6, "0")}.md`), "x\n");
    }
    const walk = srcNestedAdapterFiles(src);
    // REPORTED, never a silent truncation: the marker carries the bound and the directory reached.
    expect(walk.overflow).not.toBeNull();
    expect(walk.overflow!.limit).toBe(MAX_WALK_ENTRIES);
    expect(walk.overflow!.at).toBe("nest");
  }, 60_000);

  it("source derivation: a CYCLE-FREE cross-linked DAG is refused by the WORK bound, not by the cycle answer, and the installer says so (D-35, WR-01)", () => {
    if (process.platform === "win32") return;

    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");

    // Every link points FORWARD, so no directory ever repeats on a recursion path: the cycle answer
    // is correct and reports nothing, which is exactly why it cannot be what bounds this walk. The
    // refusal below must therefore come from the WORK bound and the cycle list must stay EMPTY —
    // that assertion is what keeps the two mechanisms from being collapsed back into one.
    makeSymlinkDag(join(src, ".claude", "agents"), 12);

    const walk = srcNestedAdapterFiles(src);
    expect(walk.cycles).toEqual([]);
    expect(walk.overflow).not.toBeNull();
    expect(walk.overflow!.limit).toBe(MAX_WALK_ENTRIES);

    const t0 = Date.now();
    const r = runInstallFrom(src, target, home);
    // Bounded: pre-fix this fixture grew by a factor of two per added directory. The wall-clock
    // assertion pins BOUNDEDNESS, not a performance number that would go flaky on a loaded runner.
    expect(Date.now() - t0).toBeLessThan(60_000);
    expect(r.status).toBe(3); // INCOMPLETE — a directory not fully examined is not a complete run.
    expect(r.stdout).toContain(`MAX_WALK_ENTRIES=${MAX_WALK_ENTRIES}`);
    expect(r.stdout).toContain("NOT fully examined");
    expect(r.stdout).not.toContain("== install complete");
    // The flat seventeen still install — the bound refused the walk, it did not narrow the install.
    expect(installedAdapters(target)).toEqual([...SYNTH_ADAPTERS].sort());
  }, 120_000);

  // ── THE REPORT ABOVE MUST SURVIVE THE EXIT THAT FOLLOWS IT (D-35, WR-01) ──────────────────────
  //
  // The case above asserts the installer SAYS `MAX_WALK_ENTRIES=…`. It said it, and then threw it
  // away. `process.exit()` discards anything still queued on an ASYNCHRONOUS stdout — which is what
  // stdout IS when it is a pipe — and this branch is reached only after the by-name refusals, which
  // on this fixture run to ~1 MB. Reproduced against the committed install.js: 8 runs, 2 truncated
  // at 223102 and 520729 bytes against a full 1065689, `status` 3 in all eight. The machine-readable
  // half survived; the human-readable half — the work-bound line, the INCOMPLETE banner, three whole
  // sections — vanished. Only on a pipe, so CI and `install.js | tee` were exposed and a TTY was not.
  //
  // WHY THIS ASSERTION IS STRUCTURAL AND NOT A REPEAT-RUN LOOP. The truncation is a RACE: the case
  // above passed 11 of 12 runs against the broken build, so a behavioural probe is a coin that lands
  // green most times and would have to be run dozens of times to be load-bearing — the definition of
  // a flaky gate, and the reason this defect survived a green suite in the first place. The exit
  // shape is not a race. `process.exit(3)` occurred EXACTLY ONCE in each file, so its absence is an
  // exact anchor rather than a heuristic, and the paired positive assertion stops the fix from being
  // "deleted" instead of "corrected". Both files are asserted because the committed .js is what runs
  // on a host and the freshness gate cannot tell a faithful build of a WRONG source from a right one.
  //
  // AND THAT LAST SENTENCE IS AN ARGUMENT FOR FOUR PATHS, NOT TWO (D-41, WR-01). The scan covered
  // install.ts and install.js while install/uninstall.ts kept the immediate-exit form for a whole
  // round — under a comment asserting the two signals could not diverge. "The committed .js is what
  // runs on a host" is exactly as true of the uninstaller as of the installer, so the loop now runs
  // over BOTH binaries in BOTH forms: source and committed artifact, installer and uninstaller. The
  // uninstaller's banner is the same banner, its pipe is the same pipe, and it was left out of the
  // scan for no reason anyone wrote down.
  it("every INCOMPLETE exit sets exitCode so an async stdout pipe FLUSHES — install AND uninstall, source AND committed (D-35, D-41, WR-01)", () => {
    for (const [label, path] of [
      ["install.ts", join(import.meta.dirname, "install.ts")],
      ["install.js", INSTALL_JS],
      ["uninstall.ts", join(import.meta.dirname, "uninstall.ts")],
      ["uninstall.js", UNINSTALL_JS],
    ] as const) {
      const src = readFileSync(path, "utf8");
      // The defect, by name: exit(3) is the INCOMPLETE branch's exit and nothing else's.
      expect(`${label}: ${src.includes("process.exit(3)")}`).toBe(`${label}: false`);
      // The fix, by name: the code is still SET, so a chained `install.js && next-step` still stops.
      // BOTH halves are kept for every path so the fix cannot be "deleted" instead of "corrected".
      expect(`${label}: ${src.includes("process.exitCode = 3")}`).toBe(`${label}: true`);
    }
  });

  // THE PRECHECK'S TAIL NEEDS ITS OWN ASSERTION, BECAUSE THE EXACT-SUBSTRING ANCHOR DOES NOT REACH
  // IT (D-41, WR-01). The loop above works because `process.exit(3)` is a LITERAL that occurred
  // exactly once per file, which makes its absence an exact anchor. The precheck's tail carried a
  // VARIABLE — the code is computed from the run's outcome — so there is no single literal to anchor
  // on and the same scan would say nothing about it. Asserted separately, in both its forms, for the
  // same reason the loop asserts both of the installer's: the committed .js is what runs on a host.
  it("the precheck's tail sets exitCode too — source AND committed (D-41, WR-01)", () => {
    for (const [label, path] of [
      ["coordinator-resolution-precheck.ts", join(REPO_ROOT, "scripts", "coordinator-resolution-precheck.ts")],
      ["coordinator-resolution-precheck.js", join(REPO_ROOT, "scripts", "coordinator-resolution-precheck.js")],
    ] as const) {
      const src = readFileSync(path, "utf8");
      expect(`${label}: ${src.includes("process.exit(code)")}`).toBe(`${label}: false`);
      expect(`${label}: ${src.includes("process.exitCode = code")}`).toBe(`${label}: true`);
    }
  });

  // THE SIX MID-SCRIPT SITES ARE PINNED AS A COUNT, BECAUSE THE RESIDUAL NOTE NO LONGER LISTS THEM
  // (D-41). install.ts's known-residual note used to name them by LINE NUMBER — "~111, 509, 528,
  // 544, 576, 1386" — and every one of the six had drifted by the time it was read: measured at 112,
  // 510, 529, 545, 572 and 1382, with 576 drifting in the OPPOSITE direction to the rest. A
  // hand-maintained list of line numbers inside a comment is a set literal that rots exactly like the
  // ones this milestone deletes, so the list is gone and the COUNT is pinned here instead. A silent
  // sweep of those six to `exitCode` — which would let the script run on past a refusal, a worse
  // defect than the one being fixed — now fails loudly rather than passing.
  //
  // THE COUNT IS TAKEN OVER COMMENT-FILTERED LINES, DELIBERATELY. A raw count returns SEVEN, because
  // the residual note's own prose must spell the call once to describe what it is describing. The
  // filtered count is the one that means "call sites", and it is the one asserted.
  it("the six MID-SCRIPT exit sites are NOT swept — the residual is a pinned count, not a rotted line list (D-41)", () => {
    const src = readFileSync(join(import.meta.dirname, "install.ts"), "utf8");
    const codeLines = src.split("\n").filter((l) => !/^\s*\/\//.test(l));
    const callSites = codeLines.filter((l) => l.includes("process.exit(")).length;
    // SIX, the MEASURED pre-task number, unchanged by this plan's conversions.
    expect(`mid-script exit sites: ${callSites}`).toBe("mid-script exit sites: 6");
    // ...and the raw count is SEVEN, which is the fact that makes the filter necessary rather than
    // cosmetic. Pinned so a future author who deletes the filter sees why it was there.
    const raw = src.split("\n").filter((l) => l.includes("process.exit(")).length;
    expect(`raw occurrences including prose: ${raw}`).toBe("raw occurrences including prose: 7");
    // THE ROTTED LIST IS GONE, NOT SOFTENED — and not quoted back as evidence either. A note that
    // reprints the stale numbers to explain why it deleted them still puts numbers in front of a
    // reader who may trust them. The measurement lives in 27-35-SUMMARY.md; this asserts that no
    // run of three or more line-number-shaped integers survives anywhere in install.ts.
    const numberList = /\b\d{2,4}, ~?\d{2,4}, ~?\d{2,4}/.test(src);
    expect(`install.ts still carries a line-number list: ${numberList}`).toBe(
      "install.ts still carries a line-number list: false",
    );
  });

  // THE BEHAVIOURAL PIN FOR THE UNINSTALLER: THE BANNER SURVIVES A PIPE (D-41, WR-01). The scan
  // above asserts the SHAPE; this asserts the OUTCOME the shape exists for. spawnSync gives the
  // child a PIPE for stdout — which is the exact condition under which the discarded-output failure
  // occurs and a terminal does not — so this case runs the committed uninstaller over a throwaway
  // target that produces a verification finding and asserts BOTH signals arrive: the status AND the
  // banner. The banner is the half the immediate-exit form was measured to drop.
  it("the committed uninstaller through a PIPE delivers BOTH signals: exit 3 AND the INCOMPLETE banner (D-41, WR-01)", () => {
    const src = makeSyntheticSrc();
    const target = mkTmp();
    const home = mkTmp();
    writeFileSync(join(target, "CLAUDE.md"), "# User Project\n");
    // Install first, so there is something to reverse and the run is a realistic one.
    expect(runInstallFrom(src, target, home).status).toBe(0);

    // Now make the uninstaller's SOURCE unreadable, which is a removal class it must skip and
    // REPORT — the documented way this binary reaches its INCOMPLETE branch.
    rmSync(join(src, ".claude", "agents"), { recursive: true, force: true });
    writeFileSync(join(src, ".claude", "agents"), "not a directory\n");

    const r = runUninstallFrom(src, target, home);
    // BOTH HALVES, ASSERTED SEPARATELY. The status alone always survived — that is precisely why
    // the defect was invisible — so asserting it without the banner would restate the bug's own
    // best-case reading.
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("== uninstall INCOMPLETE");
    expect(r.stdout).toContain("item(s) need verification");
    expect(r.stdout).not.toContain("== uninstall complete");
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

// kit-model.test.ts — KIT-01 oracle for the kit-set derivation authority (scripts/kit-model.ts).
//
// kit-model is the single answer to "which roles and workflows exist". Every guard, validator and
// generator in this phase is measured against it, so its three properties have to be pinned by
// tests that fail if any one is weakened:
//
//   (1) FILTERS — roles are `.md` and NOT `_`-prefixed (that single rule is what makes the count 17
//       and not 18: `_role-switch-protocol.md` is the sole exclusion); workflows are `NN-*.md`.
//   (2) ORDERING — both lists are `.sort()`ed, so two runs over the same tree yield identical arrays
//       and no derived consumer's output ordering can depend on readdirSync order.
//   (3) VACUITY REFUSAL (D-21 tier 1) — an unreadable or empty kit directory THROWS naming the
//       directory. It never returns []. An empty scan set passes every downstream guard, which is
//       exactly the fully-green-suite-over-a-broken-tree defect this milestone exists to delete.
//
// The failure paths CANNOT be exercised against the live tree — the live tree is exactly 17/19 and
// perfectly well-formed. So every throw case builds a throwaway kit root with mkdtempSync and plants
// the defect there. NOTHING outside the temp dir is read or mutated by those cases. Only the two
// live-tree cases at the end touch the real kit, and they are read-only.
//
// Drives the COMMITTED compiled scripts/kit-model.js (never the .ts) — the repo idiom, and the
// artifact every consumer actually imports.

import { describe, it, expect, afterAll } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  chmodSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

import {
  listRoles,
  listWorkflows,
  listAgentAdapters,
  listSkillAdapters,
  listPackagingTemplates,
  listPluginSkillAdapters,
  listPluginDefaultComponentFiles,
  listPluginExemptComponentFiles,
  pluginForbiddenComponentKeys,
  pluginForbiddenComponentSubpaths,
  spawnGrantScan,
  spawnGrantScanPrefix,
  SPAWN_GRANT_SCAN_PARTS,
  PLUGIN_MANIFEST_COMPONENT_SCHEMA,
  PLUGIN_MANIFEST_COMPONENT_COUNT,
  PLUGIN_COMPONENT_COVERED_ELSEWHERE,
  PLUGIN_COMPONENT_EXEMPT,
  ROLE_COUNT,
  WORKFLOW_COUNT,
  SKILL_ADAPTER_COUNT,
  PLUGIN_SKILL_ADAPTER_COUNT,
  SPAWN_GRANT_SCAN_COUNT,
  MAX_WALK_ENTRIES,
} from "./kit-model.js";

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Build a throwaway kit root. `roles`/`workflows` are the filenames to plant; passing `null` means
// "do not create that directory at all" (the unreadable-directory case), and `[]` means "create it
// empty" (the vacuous-set case). The two are DIFFERENT failure modes and both must throw.
function kitRoot(roles: string[] | null, workflows: string[] | null): string {
  const root = mkdtempSync(join(tmpdir(), "grugops-kit-model-"));
  tmpDirs.push(root);
  for (const [sub, files] of [
    ["agent-factory/roles", roles],
    ["agent-factory/workflows", workflows],
  ] as const) {
    if (files === null) continue;
    const dir = join(root, sub);
    mkdirSync(dir, { recursive: true });
    for (const f of files) writeFileSync(join(dir, f), "# placeholder\n");
  }
  return root;
}

// Build a throwaway root carrying ONLY `.claude/agents`. Entries are relative paths, so a nested
// plant is written as `extra/rogue.md` and the parent directories are created for it. `null` means
// "do not create the directory at all" (unreadable), `[]` means "create it empty" (vacuous).
function adapterRoot(agents: string[] | null): string {
  const root = mkdtempSync(join(tmpdir(), "grugops-kit-model-adapters-"));
  tmpDirs.push(root);
  if (agents !== null) {
    const dir = join(root, ".claude/agents");
    mkdirSync(dir, { recursive: true });
    for (const rel of agents) {
      const file = join(dir, rel);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "---\nname: fixture\n---\nplaceholder\n");
    }
  }
  return root;
}

// Same shape for `.claude/skills`. Entries are relative paths, so `a/SKILL.md` is a normal skill and
// `a/b/SKILL.md` is a nested one.
function skillRoot(skills: string[] | null): string {
  const root = mkdtempSync(join(tmpdir(), "grugops-kit-model-skills-"));
  tmpDirs.push(root);
  if (skills !== null) {
    const dir = join(root, ".claude/skills");
    mkdirSync(dir, { recursive: true });
    for (const rel of skills) {
      const file = join(dir, rel);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "---\nname: fixture\n---\nplaceholder\n");
    }
  }
  return root;
}

// makeSymlinkDag — the WR-01 shape: a CROSS-LINKED DIRECTORY DAG WITH NO CYCLE ANYWHERE.
//
// `d0 .. dn` are real sibling directories under `dir`; each `di` holds TWO forward symlinks (`a`
// and `b`) pointing at `d(i+1)`, and `dn` holds one leaf `.md` file. Every link points FORWARD, so
// no directory ever repeats on a recursion path and the per-path ancestor stack correctly answers
// "no cycle" at every single step. The number of DISTINCT RELATIVE PATHS to the leaf nevertheless
// DOUBLES with each added directory. That is the entire WR-01 argument in one fixture: a correct
// cycle answer is not a work bound, and only a separate work bound bounds this.
//
// install/install.test.ts carries a helper of the same name and shape. The two test files share no
// helper module today; adding one is out of scope for this round.
function makeSymlinkDag(dir: string, n: number): void {
  for (let i = 0; i <= n; i++) mkdirSync(join(dir, `d${i}`), { recursive: true });
  for (let i = 0; i < n; i++) {
    symlinkSync(join("..", `d${i + 1}`), join(dir, `d${i}`, "a"));
    symlinkSync(join("..", `d${i + 1}`), join(dir, `d${i}`, "b"));
  }
  writeFileSync(join(dir, `d${n}`, "leaf.md"), "---\nname: leaf\n---\n");
}

describe("kit-model (KIT-01 kit-set derivation authority)", () => {
  // ── (1) filters ──────────────────────────────────────────────────────────────────────────────
  it("listRoles keeps only non-underscore .md entries (the `_` rule is what makes the count 17)", () => {
    const root = kitRoot(
      [
        "orchestrator.md",
        "ba-pm.md",
        "_role-switch-protocol.md",
        "_draft.md",
        "README.txt",
        "notes",
      ],
      ["00-a.md"],
    );
    expect(listRoles(root)).toEqual(["ba-pm.md", "orchestrator.md"]);
  });

  it("listRoles returns filenames WITH the .md extension (the pinned return shape)", () => {
    const root = kitRoot(["orchestrator.md"], ["00-a.md"]);
    expect(listRoles(root)).toEqual(["orchestrator.md"]);
  });

  it("listWorkflows keeps only two-digit-prefixed .md entries", () => {
    const root = kitRoot(
      ["orchestrator.md"],
      [
        "00-bootstrap.md",
        "18-compaction.md",
        "bootstrap.md",
        "1-single-digit.md",
        "README.md",
        "07-refinement.txt",
      ],
    );
    expect(listWorkflows(root)).toEqual(["00-bootstrap.md", "18-compaction.md"]);
  });

  // ── (2) ordering — sorted and repeatable, so readdirSync order never leaks to a consumer ──────
  it("listRoles is sorted and two calls on the same directory are deeply equal (ordering edge)", () => {
    // Planted in deliberately non-alphabetical order so an unsorted implementation would differ.
    const root = kitRoot(
      ["uat-planner.md", "agents-md-scribe.md", "orchestrator.md", "ba-pm.md"],
      ["00-a.md"],
    );
    const first = listRoles(root);
    const second = listRoles(root);
    expect(first).toEqual([
      "agents-md-scribe.md",
      "ba-pm.md",
      "orchestrator.md",
      "uat-planner.md",
    ]);
    expect(second).toEqual(first);
    expect(first).toEqual([...first].sort());
  });

  it("listWorkflows is sorted and two calls on the same directory are deeply equal", () => {
    const root = kitRoot(
      ["orchestrator.md"],
      ["12-release.md", "00-bootstrap.md", "09-daily-sweep.md"],
    );
    const first = listWorkflows(root);
    const second = listWorkflows(root);
    expect(first).toEqual([
      "00-bootstrap.md",
      "09-daily-sweep.md",
      "12-release.md",
    ]);
    expect(second).toEqual(first);
  });

  // ── (3) vacuity refusal (D-21 tier 1) — throws, NEVER returns [] ──────────────────────────────
  it("listRoles THROWS naming the directory when the roles directory is empty (never returns [])", () => {
    const root = kitRoot([], ["00-a.md"]);
    expect(() => listRoles(root)).toThrow(join(root, "agent-factory/roles"));
    expect(() => listRoles(root)).toThrow(/refusing to return an empty set/);
  });

  it("listRoles THROWS naming the directory when the roles directory does not exist", () => {
    const root = kitRoot(null, ["00-a.md"]);
    expect(() => listRoles(root)).toThrow(join(root, "agent-factory/roles"));
    expect(() => listRoles(root)).toThrow(/cannot read kit directory/);
  });

  it("listRoles THROWS when the roles directory holds only excluded entries (filtered to empty)", () => {
    // The directory is readable and non-empty, but EVERY entry is filtered out. A naive "did readdir
    // succeed?" check would pass here and hand a consumer an empty scan set.
    const root = kitRoot(["_role-switch-protocol.md", "README.txt"], ["00-a.md"]);
    expect(() => listRoles(root)).toThrow(/refusing to return an empty set/);
  });

  it("listWorkflows THROWS naming the directory when the workflows directory is empty", () => {
    const root = kitRoot(["orchestrator.md"], []);
    expect(() => listWorkflows(root)).toThrow(
      join(root, "agent-factory/workflows"),
    );
    expect(() => listWorkflows(root)).toThrow(/refusing to return an empty set/);
  });

  it("listWorkflows THROWS naming the directory when the workflows directory does not exist", () => {
    const root = kitRoot(["orchestrator.md"], null);
    expect(() => listWorkflows(root)).toThrow(
      join(root, "agent-factory/workflows"),
    );
    expect(() => listWorkflows(root)).toThrow(/cannot read kit directory/);
  });

  it("listWorkflows THROWS when the workflows directory holds only unprefixed entries", () => {
    const root = kitRoot(["orchestrator.md"], ["README.md", "notes.md"]);
    expect(() => listWorkflows(root)).toThrow(/refusing to return an empty set/);
  });

  // ── exported constants + the live tree ────────────────────────────────────────────────────────
  it("exports the exact expected cardinalities (ROLE_COUNT 17 / WORKFLOW_COUNT 19)", () => {
    expect(ROLE_COUNT).toBe(17);
    expect(WORKFLOW_COUNT).toBe(19);
  });

  it("the live kit derives exactly ROLE_COUNT roles and WORKFLOW_COUNT workflows", () => {
    // Read-only over the real tree, and the forcing function that keeps the constants honest: land
    // role #18 without walking the derived consumers and this case goes red.
    expect(listRoles().length).toBe(ROLE_COUNT);
    expect(listWorkflows().length).toBe(WORKFLOW_COUNT);
  });

  it("the live kit excludes _role-switch-protocol.md by the `_` rule", () => {
    const roles = listRoles();
    expect(roles).not.toContain("_role-switch-protocol.md");
    expect(roles).toContain("orchestrator.md");
    expect(roles).toEqual([...roles].sort());
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// KIT-02 — the ADAPTER authority. The property that matters here is RECURSION, and it is not a
// stylistic preference: Claude Code discovers `.claude/agents/` recursively and takes agent identity
// only from frontmatter, so a file one directory deeper IS LOADED BY THE PLATFORM. Four separate
// non-recursive derivations could not see it, and a live coordinator planted there was reproduced
// passing the entire guard suite (27-REVIEW.md § CR-01). These cases pin the derivation that closes
// it: nested entries are members, nesting distinguishes members, and a vacuous set throws.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
describe("kit-model listAgentAdapters (KIT-02 adapter derivation authority)", () => {
  it("returns a NESTED .md entry as a forward-slash relative path (the CR-01 bypass)", () => {
    const root = adapterRoot(["grugops-orchestrator.md", "extra/rogue.md"]);
    expect(listAgentAdapters(root)).toEqual([
      "extra/rogue.md",
      "grugops-orchestrator.md",
    ]);
  });

  it("keeps only .md entries, at any depth", () => {
    const root = adapterRoot([
      "grugops-ba-pm.md",
      "README.txt",
      "nested/notes.txt",
      "nested/deeper/grugops-rogue.md",
    ]);
    expect(listAgentAdapters(root)).toEqual([
      "grugops-ba-pm.md",
      "nested/deeper/grugops-rogue.md",
    ]);
  });

  it("two adapter paths differing ONLY by nesting are DISTINCT members, never merged", () => {
    // The same basename at two depths. A derivation that compared basenames — or that deduplicated
    // on the file name — would report one member here and silently lose the planted one.
    const root = adapterRoot([
      "grugops-orchestrator.md",
      "extra/grugops-orchestrator.md",
    ]);
    const got = listAgentAdapters(root);
    expect(got).toEqual([
      "extra/grugops-orchestrator.md",
      "grugops-orchestrator.md",
    ]);
    expect(got.length).toBe(2);
  });

  it("is sorted by FULL relative path and two calls on the same tree are deeply equal", () => {
    // Planted in deliberately non-alphabetical order so an unsorted implementation would differ, and
    // mixing depths so the specified order covers nested-vs-top-level rather than leaving it to
    // readdirSync.
    const root = adapterRoot([
      "z-last.md",
      "extra/deep/a.md",
      "a-first.md",
      "extra/b.md",
    ]);
    const first = listAgentAdapters(root);
    const second = listAgentAdapters(root);
    expect(first).toEqual([
      "a-first.md",
      "extra/b.md",
      "extra/deep/a.md",
      "z-last.md",
    ]);
    expect(second).toEqual(first);
    expect(first).toEqual([...first].sort());
  });

  it("THROWS naming the directory when the agents directory does not exist", () => {
    const root = adapterRoot(null);
    expect(() => listAgentAdapters(root)).toThrow(join(root, ".claude/agents"));
    expect(() => listAgentAdapters(root)).toThrow(/cannot read kit directory/);
  });

  it("THROWS naming the directory when the agents directory is empty (never returns [])", () => {
    const root = adapterRoot([]);
    expect(() => listAgentAdapters(root)).toThrow(join(root, ".claude/agents"));
    expect(() => listAgentAdapters(root)).toThrow(
      /refusing to return an empty set/,
    );
  });

  it("THROWS when the agents directory holds only non-markdown entries (filtered to empty)", () => {
    // Readable and non-empty, but every entry is filtered out — including a nested one, so the
    // recursion cannot rescue a naive "did readdir return something?" check.
    const root = adapterRoot(["README.txt", "nested/notes.json"]);
    expect(() => listAgentAdapters(root)).toThrow(
      /refusing to return an empty set/,
    );
    expect(() => listAgentAdapters(root)).toThrow(join(root, ".claude/agents"));
  });

  // ── D-29 / CR-03: the cycle answer bounds recursion; it must NOT narrow the set ──────────────
  //
  // These two cases attack the ancestor stack from both sides, because the two sites that answer
  // "have I already walked this real path?" previously failed in OPPOSITE directions: the
  // installer's twin (install/kit-source.ts srcNestedAdapterFiles) carried a GLOBAL visited set
  // that DROPPED a legitimate member, and this walk carried NO guard and recursed until the host
  // stopped it. A treatment that fixes only one direction fails one of these two cases.
  //
  // Windows skip, same reason as install.test.ts's symlink cases: symlinkSync needs the
  // SeCreateSymbolicLink privilege an unprivileged runner may not hold, and a case that cannot
  // build its fixture asserts nothing. The symlink and cycle claims are proven on the POSIX legs
  // only; Windows behaviour is UNKNOWN - verify.

  it("a directory reachable by TWO paths contributes BOTH members — the guard bounds recursion, it does not narrow the set (CR-03)", () => {
    if (process.platform === "win32") return;
    const root = adapterRoot(["real/x.md"]);
    const agents = join(root, ".claude/agents");
    // `alias` and `real` are ONE physical directory reached two ways. Members are reported at
    // RELATIVE paths, so these are TWO distinct members — and each is a member the installer must
    // be able to refuse BY NAME. A global visited set reports whichever readdirSync returned first
    // and silently drops the other, which is exactly the defect CR-03 reproduced in the twin.
    symlinkSync(join(agents, "real"), join(agents, "alias"));

    const got = listAgentAdapters(root);
    expect(got).toEqual(["alias/x.md", "real/x.md"]);
    expect(got.length).toBe(2);
    expect(got).toEqual([...got].sort());
  });

  // AMENDED BY D-36 (WR-04), DELIBERATELY. This case previously asserted that a cycle "yields the
  // REAL member set" — i.e. that the walk terminated and returned the members it could still see.
  // D-36 amends D-29's half of kit-model: termination that says NOTHING is this module's own
  // fail-closed posture inverted. Every other arm here that cannot fully account for a directory
  // throws naming it (readDirOrThrow, refuseEmpty, MAX_WALK_ENTRIES); the cycle arm was the one that
  // quietly returned a SHORTER set, and a short scan set passes every downstream guard exactly the
  // way a vacuous one does. The asserted OUTCOME therefore changes from a returned member set to a
  // NAMED THROW.
  //
  // WHAT THE ORIGINAL CASE WAS PINNING IS PRESERVED IN FULL, and that is why the shape below is
  // unchanged: the MANNER of termination belongs to this module and not to the host's
  // symlink-resolution limit or to the call stack. That is why both the one-link and the two-link
  // shapes are still exercised — pre-fix they failed DIFFERENTLY (ELOOP vs. RangeError), so a single
  // shape would pin only one of them — and why the time bound is still here.
  //
  // Do NOT weaken this to a returned set to make the old assertion pass again; that reverses D-36.
  it("a symlink CYCLE throws a NAMED error carrying the declined relative path, at one link and at two (D-36 amends D-29)", () => {
    if (process.platform === "win32") return;
    // The time bound exists to make NON-TERMINATION A TEST FAILURE rather than a hung suite: a
    // regression that removes the ancestor stack must go red here, not stall CI until it is killed.
    //
    // Measured against the pre-D-29 walk on darwin / node v24: ONE `loop -> ..` link over this
    // one-adapter fixture returned THIRTY-TWO aliased members, terminating only because the
    // operating system's symlink-resolution limit made statSync throw ELOOP; TWO links threw
    // `RangeError: Maximum call stack size exceeded`. Both shapes are covered because they produced
    // DIFFERENT pre-fix behaviours, and a single shape would pin only one of them.
    for (const links of [1, 2]) {
      const root = adapterRoot(["real-adapter.md"]);
      const agents = join(root, ".claude/agents");
      // `loop -> ..` points at `.claude`, whose `agents` entry is the directory we are standing in:
      // a genuine cycle, not a mere alias. The declined path is therefore `loopN/agents` — asserted
      // by pattern rather than by a fixed N because readdirSync order decides which link is reached
      // first, and pinning the order would pin the filesystem rather than the contract.
      for (let i = 0; i < links; i++) symlinkSync("..", join(agents, `loop${i}`));

      // NAMED, not merely thrown: the message must carry the relative path the walk declined, or
      // the member set has disappeared without a name and WR-04 is back.
      expect(() => listAgentAdapters(root)).toThrow(/symlink cycle at loop\d\/agents/);
      // ...and it must be THIS module's error, not the host's ELOOP or a RangeError from the stack.
      expect(() => listAgentAdapters(root)).toThrow(/^kit-model: /);
      let caught: unknown;
      try {
        listAgentAdapters(root);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).message).not.toMatch(/ELOOP|Maximum call stack/);
    }
  }, 15_000);

  // ── D-35 / WR-01: the WORK bound is a SEPARATE mechanism, pinned on BOTH sides of its threshold ─
  //
  // The ancestor stack above answers "is this a cycle on THIS path" and answers nothing about cost.
  // A symlink DAG has NO cycle and still yields exponentially many distinct relative paths — 15
  // directories each holding two forward links to their successor measured 32,767 members in 12.2
  // seconds against the pre-fix walk. This walk runs inside check-foundation-guards.js in CI, where
  // an unbounded walk HANGS the gate rather than failing it.
  //
  // Both fixtures below are sized FROM the imported MAX_WALK_ENTRIES constant, never from a
  // restated number: a later change to the bound must move these fixtures with it rather than leave
  // them asserting against a stale threshold.

  it(`a walk examining EXACTLY MAX_WALK_ENTRIES (${MAX_WALK_ENTRIES}) entries succeeds — the bound does not narrow membership (D-35)`, () => {
    // Exactly at the bound: the Nth entry examined is still under it. One entry fewer than the
    // refusal case below, so the two cases straddle the threshold with nothing between them.
    const root = adapterRoot([]);
    const dir = join(root, ".claude/agents");
    for (let i = 0; i < MAX_WALK_ENTRIES; i++) {
      writeFileSync(join(dir, `a${String(i).padStart(6, "0")}.md`), "---\nname: f\n---\n");
    }
    const got = listAgentAdapters(root);
    expect(got.length).toBe(MAX_WALK_ENTRIES);
    expect(got).toEqual([...got].sort());
  }, 60_000);

  it(`a walk examining ONE entry beyond MAX_WALK_ENTRIES (${MAX_WALK_ENTRIES + 1}) refuses BY NAME (D-35)`, () => {
    const root = adapterRoot([]);
    const dir = join(root, ".claude/agents");
    for (let i = 0; i < MAX_WALK_ENTRIES + 1; i++) {
      writeFileSync(join(dir, `a${String(i).padStart(6, "0")}.md`), "---\nname: f\n---\n");
    }
    // The refusal NAMES the bound and the directory. A silent truncation to MAX_WALK_ENTRIES
    // members would pass every downstream guard, which is the whole reason this throws.
    expect(() => listAgentAdapters(root)).toThrow(
      new RegExp(`examined more than MAX_WALK_ENTRIES=${MAX_WALK_ENTRIES}`),
    );
    expect(() => listAgentAdapters(root)).toThrow(dir);
  }, 60_000);

  it("the work bound refuses a CYCLE-FREE cross-linked DAG in bounded time, and the DAG is genuinely cycle-free (D-35, WR-01)", () => {
    if (process.platform === "win32") return;
    // makeSymlinkDag builds the exact WR-01 shape. Its links all point FORWARD, so no directory
    // ever repeats on a recursion path: the ancestor stack correctly reports "no cycle" at every
    // step, which is precisely why the cycle answer cannot be what bounds this walk. Proof that the
    // two mechanisms are separate: this refusal must be the OVERFLOW error, never the cycle error.
    const root = adapterRoot([]);
    makeSymlinkDag(join(root, ".claude/agents"), 14);
    const t0 = Date.now();
    expect(() => listAgentAdapters(root)).toThrow(/examined more than MAX_WALK_ENTRIES/);
    expect(() => listAgentAdapters(root)).not.toThrow(/symlink cycle/);
    // Pre-fix this fixture enumerated 32,767 members in 12.2s and grew by a factor of two per added
    // directory. The wall-clock assertion is deliberately generous — it pins BOUNDEDNESS, not a
    // performance number that would go flaky on a loaded runner.
    expect(Date.now() - t0).toBeLessThan(30_000);
  }, 60_000);

  it("the live tree derives one adapter per role, all top-level and sorted", () => {
    // Read-only over the real tree. Deliberately NOT asserted against a separate adapter-count
    // constant: the KIT-03 oracle owns that number by comparing against the role corpus, and a second
    // constant asserting the same fact would be a second authority for it.
    const adapters = listAgentAdapters();
    expect(adapters.length).toBe(ROLE_COUNT);
    expect(adapters).toEqual([...adapters].sort());
    expect(adapters.every((rel) => !rel.includes("/"))).toBe(true);
    expect(adapters).toContain("grugops-orchestrator.md");
  });
});

describe("kit-model listSkillAdapters (KIT-02 skill derivation authority)", () => {
  it("keeps only files NAMED SKILL.md — the rule is the file name, not the depth", () => {
    const root = skillRoot([
      "grugops/SKILL.md",
      "grugops/README.md",
      "grugops-gate/SKILL.md",
      "not-a-skill/notes.md",
    ]);
    expect(listSkillAdapters(root)).toEqual([
      "grugops-gate/SKILL.md",
      "grugops/SKILL.md",
    ]);
  });

  it("returns a NESTED SKILL.md — a skill one level deeper is still a skill and is still seen", () => {
    const root = skillRoot(["grugops/SKILL.md", "vendor/extra/SKILL.md"]);
    expect(listSkillAdapters(root)).toEqual([
      "grugops/SKILL.md",
      "vendor/extra/SKILL.md",
    ]);
  });

  it("is sorted by full relative path and two calls on the same tree are deeply equal", () => {
    const root = skillRoot([
      "z-skill/SKILL.md",
      "a-skill/SKILL.md",
      "a-skill/deeper/SKILL.md",
    ]);
    const first = listSkillAdapters(root);
    const second = listSkillAdapters(root);
    expect(first).toEqual([
      "a-skill/SKILL.md",
      "a-skill/deeper/SKILL.md",
      "z-skill/SKILL.md",
    ]);
    expect(second).toEqual(first);
  });

  it("THROWS naming the directory when the skills directory does not exist", () => {
    const root = skillRoot(null);
    expect(() => listSkillAdapters(root)).toThrow(join(root, ".claude/skills"));
    expect(() => listSkillAdapters(root)).toThrow(/cannot read kit directory/);
  });

  it("THROWS naming the directory when the skills directory is empty (never returns [])", () => {
    const root = skillRoot([]);
    expect(() => listSkillAdapters(root)).toThrow(join(root, ".claude/skills"));
    expect(() => listSkillAdapters(root)).toThrow(
      /refusing to return an empty set/,
    );
  });

  it("THROWS when every skill directory holds no SKILL.md (filtered to empty)", () => {
    const root = skillRoot(["one/notes.md", "two/index.md"]);
    expect(() => listSkillAdapters(root)).toThrow(
      /refusing to return an empty set/,
    );
    expect(() => listSkillAdapters(root)).toThrow(join(root, ".claude/skills"));
  });

  it("a skill directory reachable by TWO paths contributes BOTH members (CR-03, the skill half)", () => {
    if (process.platform === "win32") return;
    // Both exported callers share walkFilesRelative, so a regression in the cycle answer would be
    // invisible on this half if only the agent half were covered. Same Windows skip and same reason
    // as the agent-side case; proven on the POSIX legs only.
    const root = skillRoot(["real/SKILL.md"]);
    const skills = join(root, ".claude/skills");
    symlinkSync(join(skills, "real"), join(skills, "alias"));

    const got = listSkillAdapters(root);
    expect(got).toEqual(["alias/SKILL.md", "real/SKILL.md"]);
    expect(got.length).toBe(2);
    expect(got).toEqual([...got].sort());
  });

  it("exports SKILL_ADAPTER_COUNT and the live tree derives exactly that many", () => {
    // The forcing function for the ONE derived set the KIT-03 oracle cannot cover: a skill adapter
    // has no role to compare against, so deleting a skill directory would otherwise just shrink the
    // set in silence.
    expect(SKILL_ADAPTER_COUNT).toBe(7);
    expect(listSkillAdapters().length).toBe(SKILL_ADAPTER_COUNT);
  });
});

// ---------------------------------------------------------------------------
// The PLUGIN-FORM skill lister (plan 27-34, closing CR-03's named instance).
//
// `skills/<n>/SKILL.md` at the repository root is what Claude Code loads for every `/plugin install`
// user. It sat in no derivation and no scan set at all, while guard_wr05's pass line asserted "no
// non-coordinator holds the spawn grant" over it.
// ---------------------------------------------------------------------------

// Build a throwaway root carrying ONLY the plugin-form `skills` tree. `null` means "do not create the
// directory at all" (unreadable), `[]` means "create it empty" (vacuous).
function pluginSkillRoot(skills: string[] | null): string {
  const root = mkdtempSync(join(tmpdir(), "grugops-kit-model-plugin-"));
  tmpDirs.push(root);
  if (skills !== null) {
    const dir = join(root, "skills");
    mkdirSync(dir, { recursive: true });
    for (const rel of skills) {
      const file = join(dir, rel);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "---\nname: fixture\n---\nplaceholder\n");
    }
  }
  return root;
}

describe("kit-model listPluginSkillAdapters (the plugin-form distribution surface)", () => {
  it("returns the derived member set over a fixture — the rule is the FILE NAME, at any depth", () => {
    const root = pluginSkillRoot([
      "plan/SKILL.md",
      "plan/README.md",
      "gate/SKILL.md",
      "vendor/nested/SKILL.md",
      "not-a-skill/notes.md",
    ]);
    const got = listPluginSkillAdapters(root);
    expect(got).toEqual([
      "gate/SKILL.md",
      "plan/SKILL.md",
      "vendor/nested/SKILL.md",
    ]);
    // Sorted, so the scan order and every message built from it are byte-identical across runs and
    // platforms.
    expect(got).toEqual([...got].sort());
  });

  it("THROWS naming the directory when the plugin skills directory does not exist", () => {
    const root = pluginSkillRoot(null);
    expect(() => listPluginSkillAdapters(root)).toThrow(join(root, "skills"));
    expect(() => listPluginSkillAdapters(root)).toThrow(/cannot read kit directory/);
  });

  it("THROWS naming the directory when it is empty (never returns [])", () => {
    const root = pluginSkillRoot([]);
    expect(() => listPluginSkillAdapters(root)).toThrow(join(root, "skills"));
    expect(() => listPluginSkillAdapters(root)).toThrow(
      /refusing to return an empty set/,
    );
  });

  it("THROWS when the directory reads fine but the shape rule FILTERS it to empty", () => {
    // A vacuous scan set passes every downstream guard. The refusal is what keeps an empty plugin
    // tree from being read as "no plugin skills, therefore nothing to check".
    const root = pluginSkillRoot(["one/notes.md", "two/index.md"]);
    expect(() => listPluginSkillAdapters(root)).toThrow(
      /refusing to return an empty set/,
    );
    expect(() => listPluginSkillAdapters(root)).toThrow(join(root, "skills"));
  });

  it("exports PLUGIN_SKILL_ADAPTER_COUNT and the live tree derives exactly that many, both directions", () => {
    // The plugin tree has NO role corpus for the KIT-03 oracle to cross-check and no freshness gate,
    // so this count is its only deletion signal — the same argument SKILL_ADAPTER_COUNT makes, on a
    // surface with even less around it.
    expect(PLUGIN_SKILL_ADAPTER_COUNT).toBe(7);
    const live = listPluginSkillAdapters();
    expect(live.length).toBe(PLUGIN_SKILL_ADAPTER_COUNT);
    expect(live.length).not.toBe(PLUGIN_SKILL_ADAPTER_COUNT - 1);
    expect(live.length).not.toBe(PLUGIN_SKILL_ADAPTER_COUNT + 1);
  });
});

// ---------------------------------------------------------------------------
// THE PLUGIN-MANIFEST COMPONENT SCHEMA, ITS BUCKET PARTITION AND THE `hooks/` EXEMPTION
// (plan 27-37, D-46)
// ---------------------------------------------------------------------------
//
// WHAT THESE CASES REPLACE. Round 5 pinned this surface with three cases built over the hand-written
// two-element literal `["agents", "commands"]` — including a live-tree case asserting "both
// plugin-default component directories are absent". Its problem was never that it was wrong; it was
// TAUTOLOGICAL over the very literal under test, so it could only ever confirm the literal and never
// the class the floor's comment claimed to close. A case built over the thing under test proves the
// thing under test exists.
//
// The replacements are built over the DERIVED set and over the PARTITION, so they fail when the claim
// is broken rather than when the literal is edited.
describe("kit-model plugin-manifest component schema (D-46: derived, counted two-sided, partitioned)", () => {
  it("the schema's cardinality equals its constant, and the constant is 9", () => {
    // The two-sided FLOOR that makes this constant mean something lives in guard_kit_counts and is
    // exercised in scripts/check-foundation-guards.test.ts against scratch builds with an entry
    // removed and an entry added. This case pins the agreement; that one pins that the floor fires.
    expect(PLUGIN_MANIFEST_COMPONENT_COUNT).toBe(9);
    expect(PLUGIN_MANIFEST_COMPONENT_SCHEMA.length).toBe(
      PLUGIN_MANIFEST_COMPONENT_COUNT,
    );
    expect(PLUGIN_MANIFEST_COMPONENT_SCHEMA.length).not.toBe(
      PLUGIN_MANIFEST_COMPONENT_COUNT - 1,
    );
    expect(PLUGIN_MANIFEST_COMPONENT_SCHEMA.length).not.toBe(
      PLUGIN_MANIFEST_COMPONENT_COUNT + 1,
    );
  });

  it("the schema's keys are exactly the component-path fields CLAUDE.md documents as DIRECTORIES", () => {
    // Written out here as an INDEPENDENT reading of CLAUDE.md's "Format Schemas §1" field
    // enumeration, not by mapping over the schema — a corpus derived from the thing under test
    // confirms only that the thing exists. The eleven-field list minus `userConfig` (a configuration
    // schema) and `dependencies` (a dependency list); neither names a directory of loadable files.
    expect(PLUGIN_MANIFEST_COMPONENT_SCHEMA.map((e) => e.manifestKey)).toEqual([
      "agents",
      "commands",
      "skills",
      "hooks",
      "mcpServers",
      "lspServers",
      "outputStyles",
      "experimental.themes",
      "experimental.monitors",
    ]);
    // Every probe path is a FIXED LITERAL (ASVS V12) — non-empty, relative, and free of any traversal
    // segment, so joining it onto a supplied root can never escape that root.
    for (const entry of PLUGIN_MANIFEST_COMPONENT_SCHEMA) {
      expect(entry.probeDirs.length, entry.manifestKey).toBeGreaterThan(0);
      for (const d of entry.probeDirs) {
        expect(d, entry.manifestKey).not.toMatch(/(^\/)|(^\.\.)|(\/\.\.)|(^~)/);
        expect(d.length, entry.manifestKey).toBeGreaterThan(0);
      }
    }
    // The two `experimental.` keys probe BOTH candidate spellings, because the platform's default
    // directory name for them is an `UNKNOWN - verify` in this repository. Probing an absent
    // directory costs nothing; missing a loaded one is the defect class this schema closes.
    expect(
      PLUGIN_MANIFEST_COMPONENT_SCHEMA.find(
        (e) => e.manifestKey === "experimental.themes",
      )!.probeDirs,
    ).toEqual(["themes", "experimental/themes"]);
    expect(
      PLUGIN_MANIFEST_COMPONENT_SCHEMA.find(
        (e) => e.manifestKey === "experimental.monitors",
      )!.probeDirs,
    ).toEqual(["monitors", "experimental/monitors"]);
  });

  it("the three buckets PARTITION the schema — set identities, NEVER three counts summing to nine", () => {
    // WHY SET IDENTITIES AND NOT A COUNT IDENTITY, recorded in the case because it is the whole
    // reason the case is shaped this way: `|forbidden| + |covered| + |exempt| === |schema|` passes
    // while one member is claimed by TWO buckets and another by NONE. That is the same
    // within-part-substitution failure the spawn-grant composition's per-part SET equality exists to
    // catch, one level up, and a count would be blind to it in exactly the same way.
    const schemaKeys = PLUGIN_MANIFEST_COMPONENT_SCHEMA.map(
      (e) => e.manifestKey,
    );
    const forbidden = pluginForbiddenComponentKeys();
    const covered = PLUGIN_COMPONENT_COVERED_ELSEWHERE.map((c) => c.manifestKey);
    const exempt = PLUGIN_COMPONENT_EXEMPT.map((e) => e.manifestKey);

    // (1) the union of the three buckets IS the schema's key set — nothing unclaimed, nothing foreign
    expect([...forbidden, ...covered, ...exempt].sort()).toEqual(
      [...schemaKeys].sort(),
    );
    // (2) all three pairwise intersections are empty
    expect(forbidden.filter((k) => covered.includes(k))).toEqual([]);
    expect(forbidden.filter((k) => exempt.includes(k))).toEqual([]);
    expect(covered.filter((k) => exempt.includes(k))).toEqual([]);
    // (3) the forbidden set is exactly schema minus the other two, over the REAL values
    expect(forbidden).toEqual(
      schemaKeys.filter((k) => !covered.includes(k) && !exempt.includes(k)),
    );
    expect(forbidden).toEqual([
      "agents",
      "commands",
      "mcpServers",
      "lspServers",
      "outputStyles",
      "experimental.themes",
      "experimental.monitors",
    ]);
  });

  it("`skills` is excluded by a STATED RULE naming its coverer, and `hooks` is exempt by name with a reason and a bound", () => {
    // The exclusion must be readable as deliberate, never as an omission from a list — that
    // difference is the entire D-46 point 1 argument. A named coverer is what makes it checkable.
    expect(PLUGIN_COMPONENT_COVERED_ELSEWHERE).toHaveLength(1);
    expect(PLUGIN_COMPONENT_COVERED_ELSEWHERE[0].manifestKey).toBe("skills");
    expect(PLUGIN_COMPONENT_COVERED_ELSEWHERE[0].coverer).toBe(
      "listPluginSkillAdapters",
    );
    expect(PLUGIN_COMPONENT_COVERED_ELSEWHERE[0].reason).toMatch(
      /spawn-grant scan/,
    );
    // …and the named coverer really does cover it: every file the plugin-skill lister derives is
    // inside the one spawn-grant scan composition. The rule is not just stated, it holds.
    const scan = spawnGrantScan();
    for (const rel of listPluginSkillAdapters()) {
      expect(scan).toContain(`${spawnGrantScanPrefix("plugin-skill")}${rel}`);
    }

    expect(PLUGIN_COMPONENT_EXEMPT).toHaveLength(1);
    expect(PLUGIN_COMPONENT_EXEMPT[0].manifestKey).toBe("hooks");
    // The reason and the bound are recorded IN SOURCE, in the DISTRIBUTION_PAIR_EXEMPT shape. An
    // exemption without both is a hole with a comment.
    expect(PLUGIN_COMPONENT_EXEMPT[0].reason).toMatch(/prod-deploy guard/);
    expect(PLUGIN_COMPONENT_EXEMPT[0].bound).toMatch(/SPAWN_GRANT_SCAN/);
    expect(PLUGIN_COMPONENT_EXEMPT[0].bound).toMatch(/ZERO markdown adapters/);
    // ONE exempt member. Two hand-listed members is a list, and this repository's own record says a
    // hand-maintained list rots — so a second exemption must force the promote to a derived
    // predicate rather than arriving quietly.
    expect(PLUGIN_COMPONENT_EXEMPT.map((e) => e.manifestKey)).toEqual(["hooks"]);
  });

  it("the forbidden SUBPATHS are the forbidden keys' probe dirs, flattened and sorted (ordering edge)", () => {
    const subpaths = pluginForbiddenComponentSubpaths();
    expect(subpaths).toEqual([...subpaths].sort());
    expect(subpaths).toEqual(pluginForbiddenComponentSubpaths());
    // Nine directories from seven keys: both `experimental.` keys carry two candidate spellings.
    expect(subpaths).toEqual([
      "agents",
      "commands",
      "experimental/monitors",
      "experimental/themes",
      "lspServers",
      "mcpServers",
      "monitors",
      "outputStyles",
      "themes",
    ]);
    // Neither bucket's directory is probed as forbidden — the adjacency edge, at the exact boundary.
    expect(subpaths).not.toContain("skills");
    expect(subpaths).not.toContain("hooks");
  });
});

describe("kit-model listPluginDefaultComponentFiles (the forbidden absence-or-coverage probe)", () => {
  // A throwaway root carrying only what a case plants. `plant` writes a file, creating parents.
  function defaultsRoot(): string {
    const root = mkdtempSync(join(tmpdir(), "grugops-kit-model-defaults-"));
    tmpDirs.push(root);
    return root;
  }
  const plant = (root: string, rel: string, body = "x"): void => {
    const file = join(root, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
  };

  it("ABSENT for a directory that does not exist, PRESENT-with-zero-files for one that does (empty edge)", () => {
    // Absence is the EXPECTED and correct state for all seven forbidden keys, so this probe
    // deliberately does not carry the refuse-empty floor every membership lister here carries.
    // Reporting `present: false` is the answer; a throw would fail the live tree by design. An
    // EXISTING but EMPTY directory is a THIRD, distinct answer and must not collapse into either —
    // the guard prints its measured zero rather than a vacuous coverage claim.
    const root = defaultsRoot();
    mkdirSync(join(root, "agents"), { recursive: true });
    const probed = listPluginDefaultComponentFiles(root);
    expect(probed.find((p) => p.subpath === "agents")).toEqual({
      subpath: "agents",
      present: true,
      files: [],
    });
    expect(probed.find((p) => p.subpath === "commands")).toEqual({
      subpath: "commands",
      present: false,
      files: [],
    });
    // Every forbidden subpath is probed on every call — the probe iterates the DERIVED set, so a
    // directory added to the schema is probed the same run.
    expect(probed.map((p) => p.subpath)).toEqual(
      pluginForbiddenComponentSubpaths(),
    );
  });

  it("reports every file it finds, at any depth and regardless of extension, prefixed and sorted", () => {
    const root = defaultsRoot();
    // Planted in deliberately non-alphabetical order and at more than one depth.
    plant(root, "commands/zeta.md");
    plant(root, "commands/nested/deeper/thing.txt");
    plant(root, "commands/alpha.yaml");
    plant(root, "outputStyles/rogue.md");
    const got = listPluginDefaultComponentFiles(root);
    // Not narrowed to `.md`: the question is "would the platform load something no guard scans", and
    // an extension filter would let the next author drop a granted file under a name it cannot see.
    expect(got.find((p) => p.subpath === "commands")).toEqual({
      subpath: "commands",
      present: true,
      files: [
        "commands/alpha.yaml",
        "commands/nested/deeper/thing.txt",
        "commands/zeta.md",
      ],
    });
    // outputStyles was invisible to the round-5 two-element literal; it is a first-class member now.
    expect(got.find((p) => p.subpath === "outputStyles")!.files).toEqual([
      "outputStyles/rogue.md",
    ]);
    expect(got.find((p) => p.subpath === "agents")!.present).toBe(false);
  });

  it("THROWS naming the directory when a present subpath cannot be READ — absence is not inferred from it", () => {
    // Absence is the one answer this floor accepts, and a directory it cannot read is NOT evidence of
    // absence. The condition is produced by planting a FILE where the probe expects a directory —
    // deterministic on every host and in every privilege context, unlike chmod (a no-op for root and
    // unreliable on Windows). The chmod route is exercised as a second case below, skipped with a
    // recorded reason when the host will not honour it.
    const root = defaultsRoot();
    writeFileSync(join(root, "commands"), "not a directory");
    expect(() => listPluginDefaultComponentFiles(root)).toThrow(
      /cannot read kit directory/,
    );
    expect(() => listPluginDefaultComponentFiles(root)).toThrow(
      join(root, "commands"),
    );
  });

  it("THROWS naming the directory when a present subpath is permission-denied", () => {
    const root = defaultsRoot();
    const dir = join(root, "outputStyles");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "rogue.md"), "x");
    chmodSync(dir, 0o000);
    let restricted = true;
    try {
      readdirSync(dir);
      restricted = false;
    } catch {
      restricted = true;
    }
    if (!restricted) {
      // SKIPPED WITH ITS REASON, never silently passed: chmod does not restrict for a privileged
      // user, and a case that cannot produce its own precondition must say so rather than assert
      // over a state it failed to create.
      chmodSync(dir, 0o755);
      expect(
        `SKIPPED: this host did not honour chmod 000 on ${dir} (privileged user?), so the ` +
          `permission-denied precondition could not be produced; the deterministic route is pinned ` +
          `by the file-where-a-directory-belongs case above`,
      ).toMatch(/^SKIPPED:/);
      return;
    }
    try {
      expect(() => listPluginDefaultComponentFiles(root)).toThrow(
        /cannot read kit directory/,
      );
      expect(() => listPluginDefaultComponentFiles(root)).toThrow(dir);
    } finally {
      // Restored so the afterAll cleanup can remove the temp root.
      chmodSync(dir, 0o755);
    }
  });

  it("the LIVE tree's disposition for EVERY derived forbidden subpath — absent, or fully inside the scan", () => {
    // THE REPLACEMENT for round 5's tautological live-tree case. That one asserted absence over the
    // two-element literal being deleted, so it could only ever confirm the literal. This one is built
    // over the DERIVED set and states the floor's real rule: a forbidden directory is legal when it
    // is ABSENT, or when every file in it is already inside the spawn-grant scan.
    const scan = spawnGrantScan();
    const probed = listPluginDefaultComponentFiles();
    expect(probed.map((p) => p.subpath)).toEqual(
      pluginForbiddenComponentSubpaths(),
    );
    for (const probe of probed) {
      if (!probe.present) {
        expect(probe.files, probe.subpath).toEqual([]);
        continue;
      }
      for (const f of probe.files) expect(scan, f).toContain(f);
    }
    // Measured today: all nine are absent. Asserted with the observed dispositions in the message so
    // a future present-and-covered directory reads as the deliberate change it would be.
    expect(
      probed.filter((p) => p.present).map((p) => p.subpath),
      `forbidden subpaths PRESENT on the live tree: ${JSON.stringify(
        probed.filter((p) => p.present),
      )}`,
    ).toEqual([]);
  });
});

describe("kit-model listPluginExemptComponentFiles (the `hooks/` exemption's two bounds)", () => {
  function exemptRoot(): string {
    const root = mkdtempSync(join(tmpdir(), "grugops-kit-model-exempt-"));
    tmpDirs.push(root);
    return root;
  }

  it("reports ABSENT for an absent exempt directory rather than throwing", () => {
    const got = listPluginExemptComponentFiles(exemptRoot());
    expect(got).toHaveLength(1);
    expect(got[0].manifestKey).toBe("hooks");
    expect(got[0].subpath).toBe("hooks");
    expect(got[0].present).toBe(false);
    expect(got[0].files).toEqual([]);
    expect(got[0].markdownFiles).toEqual([]);
  });

  it("reports the files and an EMPTY markdown subset when the directory holds no markdown", () => {
    // The bound-A-is-vacuous case. The guard prints this measured zero instead of claiming coverage,
    // because an assertion passing over an empty set has proven nothing and must not read as if it
    // had.
    const root = exemptRoot();
    mkdirSync(join(root, "hooks"), { recursive: true });
    writeFileSync(join(root, "hooks/hooks.json"), "{}");
    writeFileSync(join(root, "hooks/guard.js"), "x");
    const got = listPluginExemptComponentFiles(root)[0];
    expect(got.present).toBe(true);
    expect(got.files).toEqual(["hooks/guard.js", "hooks/hooks.json"]);
    expect(got.markdownFiles).toEqual([]);
  });

  it("reports a NON-EMPTY markdown subset naming the file — the bound that fails closed", () => {
    const root = exemptRoot();
    mkdirSync(join(root, "hooks/nested"), { recursive: true });
    writeFileSync(join(root, "hooks/hooks.json"), "{}");
    writeFileSync(join(root, "hooks/rogue.md"), "---\nname: rogue\n---\n");
    writeFileSync(join(root, "hooks/nested/deep.md"), "---\nname: deep\n---\n");
    const got = listPluginExemptComponentFiles(root)[0];
    expect(got.files).toEqual([
      "hooks/hooks.json",
      "hooks/nested/deep.md",
      "hooks/rogue.md",
    ]);
    // At ANY depth, sorted, prefixed — a markdown adapter one directory deeper is exactly the shape
    // the recursive walk exists to see.
    expect(got.markdownFiles).toEqual([
      "hooks/nested/deep.md",
      "hooks/rogue.md",
    ]);
  });

  it("carries the exemption's recorded reason and bound through to the consumer", () => {
    const got = listPluginExemptComponentFiles(exemptRoot())[0];
    expect(got.reason).toBe(PLUGIN_COMPONENT_EXEMPT[0].reason);
    expect(got.bound).toBe(PLUGIN_COMPONENT_EXEMPT[0].bound);
  });

  it("the LIVE `hooks/` directory carries ZERO markdown adapters", () => {
    const got = listPluginExemptComponentFiles();
    expect(got).toHaveLength(1);
    const hooks = got[0];
    expect(hooks.present, "hooks/ must exist — the exemption exists BECAUSE it does").toBe(
      true,
    );
    // THE MEASURED FILE COUNT IS IN THE MESSAGE so a SHRUNKEN directory is visible rather than
    // silently making the zero-markdown assertion easier to satisfy. Today: 7 files, 0 markdown.
    expect(
      hooks.markdownFiles,
      `hooks/ holds ${hooks.files.length} file(s): ${hooks.files.join(", ")}`,
    ).toEqual([]);
    expect(
      hooks.files.length,
      `hooks/ holds ${hooks.files.length} file(s): ${hooks.files.join(", ")}`,
    ).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// The packaging lister and THE ONE SPAWN-GRANT SCAN COMPOSITION (plan 27-33, closing CR-03).
//
// This composition was previously assembled inside check-foundation-guards.ts, and the false-red
// control that vouches for it had to restate the same directory set one indirection down. One
// predicate answered in two places is the class D-28, D-37 and D-40 each collapsed once already
// inside this phase, and the class CR-03 itself belongs to. It now lives here, with two consumers.
//
// BECAUSE THE TWO CONSUMERS READ ONE OBJECT, set equality between them can never fail. The cases
// below assert the things that CAN: the exact two-sided cardinality, and PER-PART SET equality
// against each lister.
// ---------------------------------------------------------------------------

// Build a throwaway root carrying ONLY `agent-factory/packaging`. `null` means "do not create the
// directory at all" (unreadable), `[]` means "create it empty" (vacuous).
function packagingRoot(entries: string[] | null): string {
  const root = mkdtempSync(join(tmpdir(), "grugops-kit-model-packaging-"));
  tmpDirs.push(root);
  if (entries !== null) {
    const dir = join(root, "agent-factory/packaging");
    mkdirSync(dir, { recursive: true });
    for (const name of entries) {
      writeFileSync(join(dir, name), "---\nkind: packaging\n---\nplaceholder\n");
    }
  }
  return root;
}

describe("kit-model listPackagingTemplates (the relocated packaging shape rule)", () => {
  it("returns the derived set over a fixture: the two adapter-frontmatter suffixes, sorted", () => {
    const root = packagingRoot([
      "z.template.md",
      "a.frontmatter.md",
      // Prose ABOUT adapters is not an adapter surface and is OUT (D-09) — excluded BY THE SHAPE
      // RULE rather than by omission from a hand list, so it cannot silently drift back in.
      "adapters.md",
      "notes.txt",
    ]);
    expect(listPackagingTemplates(root)).toEqual([
      "a.frontmatter.md",
      "z.template.md",
    ]);
  });

  it("THROWS naming the directory when it cannot be read (D-21 tier 1)", () => {
    const root = packagingRoot(null);
    expect(() => listPackagingTemplates(root)).toThrow(/cannot read kit directory/);
    expect(() => listPackagingTemplates(root)).toThrow(
      join(root, "agent-factory/packaging"),
    );
  });

  it("THROWS naming the directory when the FILTERED result is empty (a vacuous scan set passes every guard)", () => {
    // The directory reads fine; the shape rule leaves nothing. Returning [] here would let the whole
    // spawn-grant scan report PASS over a composition missing a part.
    const root = packagingRoot(["adapters.md", "README.md"]);
    expect(() => listPackagingTemplates(root)).toThrow(
      /refusing to return an empty set/,
    );
    expect(() => listPackagingTemplates(root)).toThrow(
      join(root, "agent-factory/packaging"),
    );
  });
});

describe("kit-model spawnGrantScan (the ONE spawn-grant scan composition)", () => {
  // A root carrying all three parts, so the composition can be exercised away from the live tree.
  function compositionRoot(): string {
    const root = mkdtempSync(join(tmpdir(), "grugops-kit-model-scan-"));
    tmpDirs.push(root);
    const plant = (rel: string) => {
      const file = join(root, rel);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "---\nname: fixture\n---\nplaceholder\n");
    };
    plant(".claude/agents/one.md");
    plant(".claude/agents/nested/two.md");
    plant(".claude/skills/alpha/SKILL.md");
    // (Plan 27-34) The PLUGIN-form part. Without it the composition fixture would be a strict subset
    // of what the guard scans, which is the class of gap this whole round exists to delete.
    plant("skills/beta/SKILL.md");
    plant("agent-factory/packaging/x.frontmatter.md");
    plant("agent-factory/packaging/y.template.md");
    plant("agent-factory/packaging/adapters.md");
    return root;
  }

  it("equals the union of its FOUR parts over a fixture, each prefixed back to its repo-relative shape", () => {
    const root = compositionRoot();
    const got = spawnGrantScan(root);
    expect(got).toEqual([
      ".claude/agents/nested/two.md",
      ".claude/agents/one.md",
      ".claude/skills/alpha/SKILL.md",
      "agent-factory/packaging/x.frontmatter.md",
      "agent-factory/packaging/y.template.md",
      "skills/beta/SKILL.md",
    ]);
    // Sorted, so two runs over one tree produce byte-identical output for every consumer.
    expect(got).toEqual([...got].sort());
    // The union really is the four parts and nothing else.
    const union = [
      ...listAgentAdapters(root).map((r) => `.claude/agents/${r}`),
      ...listSkillAdapters(root).map((r) => `.claude/skills/${r}`),
      ...listPluginSkillAdapters(root).map((r) => `skills/${r}`),
      ...listPackagingTemplates(root).map((f) => `agent-factory/packaging/${f}`),
    ].sort();
    expect(got).toEqual(union);
    // The two skill prefixes are DISJOINT — neither is a prefix of the other — so partitioning the
    // composition on either literal is unambiguous and a plugin member can never be counted as a
    // standalone one.
    expect(
      got.filter((f) => f.startsWith(spawnGrantScanPrefix("skill"))),
    ).toEqual([".claude/skills/alpha/SKILL.md"]);
    expect(
      got.filter((f) => f.startsWith(spawnGrantScanPrefix("plugin-skill"))),
    ).toEqual(["skills/beta/SKILL.md"]);
  });

  it("propagates a part's THROW rather than returning a short composition", () => {
    // A short scan set passes every downstream guard exactly the way a vacuous one does, so the
    // composition must not silently drop the part that refused. The guard's `derive()` wrapper is
    // what converts this throw into a NAMED count-floor finding instead of an unhandled exception.
    const root = compositionRoot();
    rmSync(join(root, "agent-factory/packaging"), { recursive: true, force: true });
    expect(() => spawnGrantScan(root)).toThrow(/cannot read kit directory/);
  });

  it("exports SPAWN_GRANT_SCAN_COUNT and the live tree derives exactly that many, failing in BOTH directions", () => {
    // D-19 / D-20: two-sided. 32 is a failure and 34 is a failure; only 33 passes. This count is the
    // ONLY signal that can catch a part dropped from the composition, because its two consumers read
    // one object and set equality between them compares an object with itself.
    //
    // (Plan 27-34) RAISED 26 -> 33 in the same edit that folded the plugin-form skill tree in. Raising
    // it is the deliberate act D-20 requires — it obliges the author to walk every consumer before the
    // number moves.
    expect(SPAWN_GRANT_SCAN_COUNT).toBe(33);
    const live = spawnGrantScan();
    expect(live.length).toBe(SPAWN_GRANT_SCAN_COUNT);
    expect(live.length).not.toBe(SPAWN_GRANT_SCAN_COUNT - 1);
    expect(live.length).not.toBe(SPAWN_GRANT_SCAN_COUNT + 1);
    // The per-part breakdown the count is composed of: 17 + 7 + 7 + 2.
    expect(listAgentAdapters().length).toBe(17);
    expect(listSkillAdapters().length).toBe(7);
    expect(listPluginSkillAdapters().length).toBe(7);
    expect(listPackagingTemplates().length).toBe(2);
    // …and the parts really do exhaust the total, so the four numbers above cannot each be right while
    // the composition holds something none of them describes.
    expect(
      listAgentAdapters().length +
        listSkillAdapters().length +
        listPluginSkillAdapters().length +
        listPackagingTemplates().length,
    ).toBe(SPAWN_GRANT_SCAN_COUNT);
  });

  it("PER-PART membership is SET equality against each lister, which a swap between parts cannot satisfy", () => {
    const root = compositionRoot();
    const members = spawnGrantScan(root);
    // (Plan 27-34) ALL FOUR PARTS, and the parts EXHAUST the composition. A membership claim about
    // only the part being ADDED says nothing about the parts already there, so a widening that
    // silently swapped one part for another would hold the total and pass. Asserting that the four
    // partitions cover every member is what makes "all four" checkable rather than assumed.
    expect(SPAWN_GRANT_SCAN_PARTS.map((p) => p.name)).toEqual([
      "agent",
      "skill",
      "plugin-skill",
      "packaging",
    ]);
    expect(
      members.filter((f) =>
        SPAWN_GRANT_SCAN_PARTS.some((p) => f.startsWith(p.prefix)),
      ).length,
    ).toBe(members.length);
    for (const part of SPAWN_GRANT_SCAN_PARTS) {
      const inComposition = members.filter((f) => f.startsWith(part.prefix)).sort();
      const expected = part.list(root).map((rel) => `${part.prefix}${rel}`).sort();
      expect(inComposition, part.name).toEqual(expected);
    }

    // The failure this SET form catches and a count form does not: a decoy DISPLACING a real member
    // inside one part. The totals are identical; the sets are not.
    const displaced = members
      .filter((f) => f !== ".claude/agents/one.md")
      .concat(".claude/agents/decoy.md")
      .sort();
    expect(displaced.length).toBe(members.length); // a count check would pass here
    const agentPrefix = spawnGrantScanPrefix("agent");
    expect(
      displaced.filter((f) => f.startsWith(agentPrefix)).sort(),
    ).not.toEqual(
      listAgentAdapters(root).map((r) => `${agentPrefix}${r}`).sort(),
    );
  });

  it("spawnGrantScanPrefix throws on an unknown part name rather than partitioning into nothing", () => {
    expect(spawnGrantScanPrefix("packaging")).toBe("agent-factory/packaging/");
    // @ts-expect-error — the guard against a typo silently returning undefined.
    expect(() => spawnGrantScanPrefix("packagin")).toThrow(/no spawn-grant scan part/);
  });
});

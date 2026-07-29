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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

import {
  listRoles,
  listWorkflows,
  listAgentAdapters,
  ROLE_COUNT,
  WORKFLOW_COUNT,
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

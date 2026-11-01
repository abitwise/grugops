// check-role-rules.test.ts — behavioral oracle for the derived role-rule inventory (Phase 40,
// PLAIN-03; D-27, D-28, D-31, D-35).
//
// Drives the COMMITTED .js via spawnSync against a hermetic mirror (CHECK_ROOT), the shape of
// check-kit-refs.test.ts. Nothing is written into the committed tree. Each red case plants one loss
// and asserts the gate names the file and the fact; the green control proves the mirror is clean.
// The last case re-derives the inventory from git objects at the baseline's recorded source_commit
// and asserts deep equality with the committed JSON, so a hand edit to the baseline is red.
//
// NOT in the e2e lane. Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import {
  checkCodingRoleSet,
  deriveAll,
  deriveRoleFacts,
  buildContext,
  D13_CODING_ROLES,
  BASELINE_REL,
} from "./check-role-rules.js";
import { listRoles } from "./kit-model.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-role-rules.js");

// What the gate reads: the role corpus, the seed board and memory-bank seed, the three kit-ref
// directories, and the committed baseline.
const MIRROR_PATHS = [
  "agent-factory/roles",
  "agent-factory/workflows",
  "agent-factory/checklists",
  "agent-factory/contracts",
  "agent-factory/seed/memory-bank",
  BASELINE_REL,
];

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

function makeMirror(prefix: string): string {
  const mirror = freshTmp(prefix);
  for (const rel of MIRROR_PATHS) {
    const dst = join(mirror, rel);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(join(ROOT, rel), dst, { recursive: true });
  }
  return mirror;
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

const role = (mirror: string, f: string): string => join(mirror, "agent-factory", "roles", f);

function edit(path: string, fn: (s: string) => string): void {
  const before = readFileSync(path, "utf8");
  const after = fn(before);
  if (after === before) throw new Error(`edit of ${path} changed nothing — the plant is vacuous`);
  writeFileSync(path, after);
}

const dropLines = (pred: (l: string) => boolean) => (s: string): string =>
  s.split("\n").filter((l) => !pred(l)).join("\n");

describe("check-role-rules: the derived role-rule inventory (D-27)", () => {
  it("green control: the unplanted mirror passes and prints facts before/after for every file", () => {
    const m = makeMirror("rr-green-");
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toContain("role-rule inventory: 0 findings over 20/20");
    expect(r.stdout).toMatch(/orchestrator\.md: facts before \d+ \/ after \d+/);
    expect(r.stdout).toMatch(/_role-switch-protocol\.md: facts before \d+ \/ after \d+/);
  });

  it("deleting `UNKNOWN - verify` from one role is red naming the role and unknown-verify", () => {
    const m = makeMirror("rr-uv-");
    edit(role(m, "qe-e2e.md"), (s) => s.split("UNKNOWN - verify").join("unknown"));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("qe-e2e.md: lost fact unknown-verify");
  });

  it("removing a kit reference is red naming the kit-ref fact", () => {
    const m = makeMirror("rr-kit-");
    edit(role(m, "ba-pm.md"), (s) => s.split("definition-of-ready.md").join("the ready rules"));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("ba-pm.md: lost fact kit-ref:agent-factory/checklists/definition-of-ready.md");
  });

  it("removing ba-pm.md's `## Board moves` claim is red naming board-from:Backlog", () => {
    const m = makeMirror("rr-board-");
    edit(role(m, "ba-pm.md"), (s) => s.replace("You own `Backlog → Ready` once", "You move ideas forward once"));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("ba-pm.md: lost fact board-from:Backlog");
  });

  it("removing the coding-rules line from a non-member (ba-pm.md) stays green as intended (D-13)", () => {
    const m = makeMirror("rr-d13-non-");
    // Plan 40-04 removed the line from ba-pm.md in the tree, so the mirror already carries the
    // removal: assert both sides of it (baseline has the fact, the role lacks the line), then run.
    const baseline = JSON.parse(readFileSync(join(m, BASELINE_REL), "utf8"));
    expect(baseline.files["ba-pm.md"].facts).toContain("coding-rules");
    expect(readFileSync(role(m, "ba-pm.md"), "utf8")).not.toContain("12 coding rules");
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toContain("ba-pm.md: coding-rules removed — intended (D-13)");
  });

  it("removing the coding-rules line from a member (software-engineer.md) is red", () => {
    const m = makeMirror("rr-d13-mem-");
    edit(role(m, "software-engineer.md"), dropLines((l) => l.includes("12 coding rules")));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("software-engineer.md: lost fact coding-rules");
  });

  it("a deleted baseline is red: the check refuses to run without it", () => {
    const m = makeMirror("rr-nobase-");
    rmSync(join(m, BASELINE_REL));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("40-role-rule-inventory.json is missing");
  });

  it("an extra role file planted is red naming it", () => {
    const m = makeMirror("rr-extra-");
    writeFileSync(role(m, "stowaway.md"), "# Role: Stowaway\n\n## One job\nHide.\n");
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("stowaway.md: on disk but not in the baseline");
  });

  it("a caveman fence added to or deleted from a role leaves every fact unchanged", () => {
    // Fenced lines are excluded from every fact (D-28), which is why plan 40-01 could delete the 19
    // caveman fences without moving the baseline. Since PLAIN-01 no live role carries one, so the fence
    // is planted into the mirror copy (with fact-bearing tokens inside it) and the facts compared both
    // ways: with the fence and without it.
    const m = makeMirror("rr-fence-");
    const ctx = buildContext(m);
    const p = role(m, "software-engineer.md");
    const without = readFileSync(p, "utf8");
    const withFence = without.replace(
      "## Reads",
      "## Caveman prompt\n```\nUNKNOWN - verify BLOCKED failed-attempt 17-task-claim.md\n```\n\n## Reads",
    );
    expect(withFence).not.toBe(without);
    expect(deriveRoleFacts(withFence, ctx)).toEqual(deriveRoleFacts(without, ctx));
    expect(deriveRoleFacts(withFence, ctx).facts).not.toContain("wf17");
    expect(runGate(m).status).toBe(0);
  });

  it("checkCodingRoleSet: a member that is not a role is red; the live constant is clean", () => {
    const roles = listRoles(ROOT);
    expect(checkCodingRoleSet(["software-engineer.md", "ghost.md"], roles)).toEqual([
      "D13_CODING_ROLES member ghost.md is not a role basename (D-35)",
    ]);
    expect(checkCodingRoleSet(D13_CODING_ROLES, roles)).toEqual([]);
    expect(D13_CODING_ROLES.length).toBe(8);
  });

  it("the committed baseline equals a fresh derivation at its recorded source_commit, read out of git", () => {
    const baseline = JSON.parse(readFileSync(join(ROOT, BASELINE_REL), "utf8"));
    const sha: string = baseline.source_commit;
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
    const m = freshTmp("rr-git-");
    const paths = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", sha, "--", ...MIRROR_PATHS.filter((p) => p !== BASELINE_REL)],
      { cwd: ROOT, encoding: "utf8" },
    )
      .split("\n")
      .filter((p) => p !== "");
    expect(paths.some((p) => p.startsWith("agent-factory/roles/"))).toBe(true);
    for (const p of paths) {
      const blob = execFileSync("git", ["show", `${sha}:${p}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
      const dst = join(m, p);
      mkdirSync(dirname(dst), { recursive: true });
      writeFileSync(dst, blob);
    }
    expect(existsSync(join(m, "agent-factory", "roles", "_role-switch-protocol.md"))).toBe(true);
    expect(deriveAll(m)).toEqual(baseline.files);
    expect(baseline.generated_by).toBe("node scripts/check-role-rules.js --write-baseline");
  });
});

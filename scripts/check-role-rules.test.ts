// check-role-rules.test.ts — behavioral oracle for the derived role-rule inventory and the board-move
// partition (Phase 40, PLAIN-02, PLAIN-03; D-27, D-28, D-29, D-31, D-33, D-35).
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
  BOARD_MOVE_EXCEPTIONS,
  checkPartition,
  claimedPairs,
  partitionModel,
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

// ---------------------------------------------------------------------------
// The board-move partition (D-29, D-33). Same planted-mirror shape: each red case plants or removes one
// `X → Y` code span in one role's `## Board moves` and asserts the finding names the role, the pair and
// the rule. The flow, the owners and the terminal column come from the mirror's own seed board.
// ---------------------------------------------------------------------------

const plantMove = (from: string, to: string) => (s: string): string =>
  s.replace("## Board moves\n", `## Board moves\nYou own \`${from} → ${to}\` (planted).\n`);
const dropMove = (from: string, to: string) => dropLines((l) => l.includes(`\`${from} → ${to}\``));

describe("check-role-rules: the board-move partition (D-29, D-33)", () => {
  it("partition green control: the live mirror passes and prints the claimed pair count", () => {
    const m = makeMirror("rr-part-green-");
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toMatch(/board-move partition: 18 claimed pair\(s\) over 12 flow column\(s\), terminal Done, 4 declared exception\(s\)/);
    expect(r.stdout).toContain("board-move partition: 0 findings over 19/19");
  });

  it("partition model: flow, owners and terminal are derived from the seed board table", () => {
    const model = partitionModel(ROOT);
    expect(model.flow[0]).toBe("Backlog");
    expect(model.terminal).toBe("Done");
    expect(model.flow).not.toContain("Blocked");
    expect(model.columns.has("Blocked")).toBe(true);
    expect(model.owners.get("Ready for Dev")).toBe("orchestrator.md");
    expect(model.owners.get("Done")).toBe("orchestrator.md");
    expect(model.owners.get("In Development")).toBe("software-engineer.md");
  });

  it("partition rule 1 and rule 4: `In Review → Ready for UAT` planted into system-analyst.md is red", () => {
    const m = makeMirror("rr-part-r1-");
    edit(role(m, "system-analyst.md"), plantMove("In Review", "Ready for UAT"));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("qe-e2e.md, system-analyst.md: rule 1: `In Review → Ready for UAT` is claimed by 2 roles");
    expect(r.stdout).toContain("system-analyst.md: rule 4: claims `In Review → Ready for UAT` but In Review is owned by qe-e2e.md");
  });

  it("partition rule 2: `Ready → In Analysis` removed from ba-pm.md is red", () => {
    const m = makeMirror("rr-part-r2-");
    edit(role(m, "ba-pm.md"), dropMove("Ready", "In Analysis"));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("ba-pm.md: rule 2: owns the Ready exit but does not claim its forward pair `Ready → In Analysis`");
  });

  it("partition rule 3: `In UAT → Done` removed from orchestrator.md is red", () => {
    const m = makeMirror("rr-part-r3-");
    edit(role(m, "orchestrator.md"), dropMove("In UAT", "Done"));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("orchestrator.md: rule 3: owns the terminal column Done but claims no pair into it");
  });

  it("partition rule 4: `In Review → Done` planted into system-analyst.md is red", () => {
    const m = makeMirror("rr-part-r4-");
    edit(role(m, "system-analyst.md"), plantMove("In Review", "Done"));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("system-analyst.md: rule 4: claims `In Review → Done` but In Review is owned by qe-e2e.md");
    expect(r.stdout).not.toContain("rule 1:");
  });

  it("partition rule 4: a close into the terminal column is admitted only for the terminal column's owner", () => {
    const model = partitionModel(ROOT);
    // The Orchestrator owns Done, so its close out of In UAT (owned by the UAT Planner) is admitted.
    const closes = checkPartition(model, { "orchestrator.md": [{ from: "In UAT", to: "Done" }] }, []);
    expect(closes.filter((f) => f.includes("rule 4"))).toEqual([]);
    const other = checkPartition(model, { "orchestrator.md": [{ from: "In UAT", to: "Done" }], "qe-e2e.md": [{ from: "In UAT", to: "Done" }] }, []);
    expect(other).toContain(
      "qe-e2e.md: rule 4: claims `In UAT → Done` but In UAT is owned by uat-planner.md, and the pair is not in BOARD_MOVE_EXCEPTIONS (D-29, D-33)",
    );
  });

  it("partition rule 5: `Blocked → Backlog` removed from tech-lead.md is red", () => {
    const m = makeMirror("rr-part-r5-");
    edit(role(m, "tech-lead.md"), (s) => s.replace("`Blocked → Backlog` or ", ""));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("tech-lead.md: rule 5: BOARD_MOVE_EXCEPTIONS declares `Blocked → Backlog` but the role no longer claims it");
  });

  it("partition exceptions: exactly the four D-33 Tech Lead entries, each with a reason", () => {
    expect(BOARD_MOVE_EXCEPTIONS.map((e) => `${e.role}: ${e.from} → ${e.to}`)).toEqual([
      "tech-lead.md: Ready for Dev → In Design",
      "tech-lead.md: Blocked → Ready for Dev",
      "tech-lead.md: Blocked → Backlog",
      "tech-lead.md: Blocked → In Design",
    ]);
    for (const e of BOARD_MOVE_EXCEPTIONS) expect(e.reason).toMatch(/D-33/);
  });

  for (const e of BOARD_MOVE_EXCEPTIONS) {
    it(`partition exception \`${e.from} → ${e.to}\`: admitted for tech-lead.md, red when planted into designer.md`, () => {
      const model = partitionModel(ROOT);
      const live = claimedPairs(readFileSync(role(ROOT, "tech-lead.md"), "utf8"), model.columns);
      expect(live.map((p) => `${p.from} → ${p.to}`)).toContain(`${e.from} → ${e.to}`);
      const m = makeMirror("rr-part-exc-");
      edit(role(m, "designer.md"), (s) =>
        s.replace("## Board moves\n", `## Board moves\nPlanted: \`${e.from} → ${e.to}\`.\n`),
      );
      const r = runGate(m);
      expect(r.status, r.stdout).toBe(1);
      expect(r.stdout).toContain(`designer.md: rule 4: claims \`${e.from} → ${e.to}\``);
      expect(r.stdout).not.toContain("tech-lead.md: rule 4");
    });
  }

  it("partition fails closed: an Exit owner that is no role's name is a derivation failure naming it", () => {
    const m = makeMirror("rr-part-owner-");
    edit(join(m, "agent-factory", "seed", "memory-bank", "plans", "board.md"), (s) =>
      s.replace("| In Analysis | behavior being mapped | System Analyst |", "| In Analysis | behavior being mapped | Systems Analist |"),
    );
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain('column In Analysis has Exit owner "Systems Analist", which is no role\'s `# Role: ` name');
  });
});

// ---------------------------------------------------------------------------
// The end-state role checks (D-08, D-10, D-35, D-36). They run on the current tree only, over the 19
// roles in listRoles(); the protocol keeps its own shape (D-15) and is outside them.
// ---------------------------------------------------------------------------

const CODING_LINE = "Follow the 12 coding rules in `AGENTS.md`.";

describe("check-role-rules: the end-state role checks (D-08, D-10, D-35, D-36)", () => {
  it("end state green control: the live mirror passes over 19/19, protocol and optional sections included", () => {
    const m = makeMirror("rr-end-green-");
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toContain("role end state: 0 findings over 19/19");
    // software-engineer.md carries `## Levels` and `## Do less` between Responsibilities and Output.
    const se = readFileSync(role(m, "software-engineer.md"), "utf8");
    expect(se.indexOf("## Levels")).toBeGreaterThan(se.indexOf("## Responsibilities"));
    expect(se.indexOf("## Do less")).toBeLessThan(se.indexOf("## Output"));
    // The protocol keeps its protocol shape: no `## Stop when`, no role skeleton, and it is not named.
    expect(readFileSync(role(m, "_role-switch-protocol.md"), "utf8")).not.toContain("## Stop when");
    expect(r.stdout).not.toMatch(/_role-switch-protocol\.md: .*\(D-(08|10)\)/);
  });

  it("D-35: the coding-rules line planted into ba-pm.md (a non-member) is red", () => {
    const m = makeMirror("rr-end-d35-non-");
    edit(role(m, "ba-pm.md"), (s) => s.replace("## Stop when\n", `${CODING_LINE}\n\n## Stop when\n`));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("ba-pm.md: carries the coding-rules line but is not a D13_CODING_ROLES member (D-35)");
  });

  it("D-35: the coding-rules line removed from installer.md (a member) is red", () => {
    const m = makeMirror("rr-end-d35-mem-");
    edit(role(m, "installer.md"), dropLines((l) => l.includes("12 coding rules")));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("installer.md: lost fact coding-rules — a D13_CODING_ROLES member must keep");
    expect(r.stdout).toContain("(D-13, D-35)");
  });

  it("D-36: `UNKNOWN - verify` removed from orchestrator.md is red naming D-36", () => {
    const m = makeMirror("rr-end-d36-uv-");
    edit(role(m, "orchestrator.md"), (s) => s.split("UNKNOWN - verify").join("unverified"));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("orchestrator.md: missing fact unknown-verify — every role must carry it (D-36)");
  });

  it("D-36: the no-fabrication sentence removed from tech-lead.md `## Hard limits` is red naming D-36", () => {
    const m = makeMirror("rr-end-d36-nf-");
    edit(role(m, "tech-lead.md"), (s) => s.replace(", and never fabricate a score", ""));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("tech-lead.md: missing fact no-fabrication — every role must carry it (D-36)");
  });

  it("D-10: a `## Stop when` heading with no list item beneath it is red naming the role", () => {
    const m = makeMirror("rr-end-d10-");
    edit(role(m, "uat-planner.md"), (s) => {
      const at = s.indexOf("## Stop when");
      return `${s.slice(0, at)}## Stop when\nStop when the work is done.\n`;
    });
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("uat-planner.md: `## Stop when` holds no list item (D-10)");
  });

  it("D-08: `## Stop when` moved above `## Hard limits` is red under the order check", () => {
    const m = makeMirror("rr-end-d08-");
    edit(role(m, "qe-e2e.md"), (s) => {
      const hl = s.indexOf("## Hard limits");
      const sw = s.indexOf("## Stop when");
      const hard = s.slice(hl, sw);
      const stop = s.slice(sw).replace(/\n*$/, "\n\n");
      return `${s.slice(0, hl)}${stop}${hard}`.replace(/\n*$/, "\n");
    });
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("qe-e2e.md: required headings out of order (D-08)");
  });

  it("D-08: an optional heading outside Responsibilities..Output is red; between them it is green", () => {
    const m = makeMirror("rr-end-d08-opt-");
    edit(role(m, "software-engineer.md"), (s) => s.replace("## Trace updates\n", "## Notes\nA stray section.\n\n## Trace updates\n"));
    const r = runGate(m);
    expect(r.status, r.stdout).toBe(1);
    expect(r.stdout).toContain("software-engineer.md: `## Notes` sits outside `## Responsibilities` .. `## Output` (D-08)");
  });
});

// admission-protocol-docs.test.ts — structural invariants for Phase 21 (VFY-03 + VFY-04)
//
// VFY-03: agent-factory/workflows/16-context-read-write.md exists with correct frontmatter
//         and H1; each of the 17 canonical role files carries exactly one `16-context-read-write`
//         reference.
//
// VFY-04: agent-factory/workflows/05-pr-quality-gate.md carries `self_fix_attempts`,
//         `UNKNOWN - verify`, and ties the §14-gate verdict emission to `READY_FOR_HUMAN_REVIEW`;
//         agent-factory/workflows/16-context-read-write.md references the bounded loop
//         (05-pr-quality-gate or self_fix_attempts) and the honest escape hatch (UNKNOWN - verify).
//
// Scope discipline (per gap spec):
//   - Only POSITIVE invariants (references exist, counts exact).
//   - No negative "no role restates the protocol" assertion (Phase 24 territory).
//   - No byte-ceiling assertions (foundation-guards owns those).

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory", "roles");
const WORKFLOWS_DIR = join(ROOT, "agent-factory", "workflows");

const WF16 = join(WORKFLOWS_DIR, "16-context-read-write.md");
const WF05 = join(WORKFLOWS_DIR, "05-pr-quality-gate.md");

// The 17 canonical role file basenames (underscore-prefixed partials excluded).
const ROLE_BASENAMES = [
  "agents-md-scribe.md",
  "architect-design.md",
  "ba-pm.md",
  "brownfield-mapper.md",
  "compliance-officer.md",
  "factory-coach.md",
  "frontend-ui.md",
  "greenfield-mapper.md",
  "incident-responder.md",
  "installer.md",
  "orchestrator.md",
  "qe-e2e.md",
  "release-manager.md",
  "security-nfr.md",
  "software-engineer.md",
  "system-analyst.md",
  "uat-planner.md",
];

// ---------------------------------------------------------------------------
// VFY-03 — Workflow 16 single-source; all 17 roles reference it
// ---------------------------------------------------------------------------
describe("VFY-03: Workflow 16 single-source protocol", () => {
  it("agent-factory/workflows/16-context-read-write.md exists", () => {
    expect(existsSync(WF16), `${WF16} not found`).toBe(true);
  });

  it("16-context-read-write.md has frontmatter order: 16", () => {
    const text = readFileSync(WF16, "utf8");
    // Match `order: 16` in the YAML frontmatter block (between the first two ---)
    const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
    expect(frontmatterMatch, "no YAML frontmatter found").toBeTruthy();
    expect(frontmatterMatch![1]).toMatch(/^order:\s*16$/m);
  });

  it("16-context-read-write.md has H1 `# Workflow: context read/write`", () => {
    const text = readFileSync(WF16, "utf8");
    expect(text).toContain("# Workflow: context read/write");
  });

  for (const basename of ROLE_BASENAMES) {
    it(`role ${basename} contains exactly one '16-context-read-write' reference`, () => {
      const filePath = join(ROLES_DIR, basename);
      expect(existsSync(filePath), `${filePath} not found`).toBe(true);
      const text = readFileSync(filePath, "utf8");
      const matches = text.match(/16-context-read-write/g);
      expect(
        matches,
        `expected exactly 1 reference to '16-context-read-write' in ${basename}, found ${matches?.length ?? 0}`,
      ).not.toBeNull();
      expect(matches!.length).toBe(1);
    });
  }
});

// ---------------------------------------------------------------------------
// VFY-04 — Bounded self_fix_attempts loop + honest escape hatch
// ---------------------------------------------------------------------------
describe("VFY-04: bounded self_fix_attempts loop and honest escape hatch", () => {
  it("05-pr-quality-gate.md contains `self_fix_attempts`", () => {
    const text = readFileSync(WF05, "utf8");
    expect(text).toContain("self_fix_attempts");
  });

  it("05-pr-quality-gate.md contains `UNKNOWN - verify`", () => {
    const text = readFileSync(WF05, "utf8");
    expect(text).toContain("UNKNOWN - verify");
  });

  it("05-pr-quality-gate.md ties the §14-gate verdict emission to READY_FOR_HUMAN_REVIEW", () => {
    const text = readFileSync(WF05, "utf8");
    // The verdict emission paragraph must be tied to the green terminal result.
    // Assert both keywords appear and that the verdict paragraph references the terminal state.
    expect(text).toContain("READY_FOR_HUMAN_REVIEW");
    // The emitVerdict call must be conditioned on READY_FOR_HUMAN_REVIEW (not BLOCKED or SPLIT).
    // We check the spec-mandated phrasing: "On `READY_FOR_HUMAN_REVIEW` — and **only** on ..."
    expect(text).toMatch(/READY_FOR_HUMAN_REVIEW.*only.*READY_FOR_HUMAN_REVIEW|On `READY_FOR_HUMAN_REVIEW`/s);
  });

  it("05-pr-quality-gate.md names the emission surface that EXISTS — the emit-verdict verb", () => {
    // Plan 30-05. This paragraph previously asserted that `node scripts/context-io.js` exposed the
    // emitter; the dispatch handled `validate`, `admit` and `render` and the emitter was none of
    // them. The verb now exists, and this pin moves with the prose in the same commit so the two
    // cannot disagree for even one commit — which is the whole reason the old sentence survived.
    const text = readFileSync(WF05, "utf8");
    expect(text).toContain("node scripts/context-io.js emit-verdict <task> <id> <integrity>");
    // The three-state argument, named where the agent running the gate reads it.
    expect(text).toContain("`clean` for exit `0`, `finding` for exit `1`, and `unknown` for exit `2`");
    expect(text).toContain("Only `clean` emits a verdict.");
    // The fail-closed arm, including the two cases a reader most often assumes are safe.
    expect(text).toMatch(/an unrecognized value and an absent one all refuse/);
  });

  it("05-pr-quality-gate.md states the TIER of the integrity argument rather than overstating it", () => {
    // D-15 requires the tier of the integrity argument to be stated. A workflow that described the
    // refusal without its tier would read as a guarantee the mechanism cannot make. Phase 33.1
    // (D-17, D-19) retired the checkpoint hook this text used to be compared with: the tiers are now
    // the git host (hard floor), the Claude Code ask rules (speed bump) and prose.
    const text = readFileSync(WF05, "utf8");
    expect(text).toContain("the argument sits in the prose tier");
    expect(text).toContain("The hard floor is the git host, and the Claude Code ask rules are a speed bump.");
    expect(text).toContain("does not stop a caller from stating `clean`");
    expect(text).not.toContain("a different tier from the checkpoint hook");
  });

  it("05-pr-quality-gate.md step 3 runs the read-only git-host check, not the retired run banner (33.1 D-19, D-26)", () => {
    // D-26 retired the two-key floor family, and with it the run banner step 3 used to emit. Step 3
    // keeps its number and now reads the hard floor's status instead.
    const text = readFileSync(WF05, "utf8");
    expect(text).toContain("3. Run the read-only git-host check first: `node tools/grugops/host-protection.js`.");
    // The three exit branches, and the one that must never read as a pass.
    expect(text).toContain("`0` → record an `observation` note naming each protected branch and the production environment.");
    expect(text).toContain("`1` → record an `observation` note naming each `unprotected` target.");
    expect(text).toContain("`2` → record `UNKNOWN - verify` with the reason the check printed. Exit `2` is never read as a pass.");
    expect(text).toContain("No note claims the floor exists without a `protected` line.");
    // The retired banner is gone, by its prose name and by its fixed line. Its function name is not
    // spelled here: plan 33.1-06 deleted the function, and the 33.1 grep-to-zero scan
    // (scripts/guard-retired.test.ts, plan 33.1-10) refuses that identifier in every live file.
    expect(text).not.toContain("run banner");
    expect(text).not.toContain("all checkpoints at default");
  });

  it("16-context-read-write.md references the bounded loop (05-pr-quality-gate or self_fix_attempts)", () => {
    const text = readFileSync(WF16, "utf8");
    const hasRef =
      text.includes("05-pr-quality-gate") || text.includes("self_fix_attempts");
    expect(
      hasRef,
      "expected WF16 to reference '05-pr-quality-gate' or 'self_fix_attempts'",
    ).toBe(true);
  });

  it("16-context-read-write.md references the honest escape hatch (UNKNOWN - verify)", () => {
    const text = readFileSync(WF16, "utf8");
    expect(text).toContain("UNKNOWN - verify");
  });
});

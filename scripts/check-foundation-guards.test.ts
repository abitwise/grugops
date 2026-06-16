// check-foundation-guards.test.ts — SDLC-02 / SC2 fail-proof harness for
// scripts/check-foundation-guards.js (Vitest port of check-foundation-guards.test.sh).
//
// Proves the six foundation guards both PASS and FAIL — the no-fabrication contract (a gate that
// can only ever pass is fabricated green). It plants EXACTLY ONE real violation per guard into a
// hermetic throwaway mirror of the inputs, runs the COMPILED guard (.js) against that mirror via
// the CHECK_ROOT override, and asserts each fails red (nonzero exit AND the finding names the
// defect — the expect_fail shape). Then a smoke run proves the REAL guard is GREEN over the REAL
// tree, and a byte-identity assertion proves the two config JSONs stay byte-identical (the
// tri-file drift Plan 10-03 must avoid).
//
// The .sh harness mirrored the guard's inputs into $WORK/<case>/ and ran the guard FROM the mirror
// so its hard-coded relative paths resolved there. The TS guard exposes a CHECK_ROOT env override
// (it resolves every path against CHECK_ROOT when set), so this harness mirrors inputs into a temp
// dir and spawns `node check-foundation-guards.js` with CHECK_ROOT pointed at the mirror —
// reproducing the same hermetic plant-and-run behavior. NOTHING outside the temp dir is mutated.
//
// Spawns the COMMITTED compiled .js (never the .ts), mirroring the spawnSync child-CLI test idiom.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  writeFileSync,
  appendFileSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GUARD_JS = join(ROOT, "scripts", "check-foundation-guards.js");

// The complete set of input files the guard reads (repo-relative). A mirror carries byte-faithful
// copies of all of these; one file is then mutated to plant the violation. All 17 role files plus
// the 3 SEC_VOICE surfaces plus AGENTS.md + the 2 adapters + the 2 packaging templates.
const GUARD_INPUTS = [
  "AGENTS.md",
  ".claude/skills/grugops/SKILL.md",
  ".claude/agents/grugops-orchestrator.md",
  "agent-factory/packaging/subagent.frontmatter.md",
  "agent-factory/packaging/slash-command.template.md",
  "agent-factory/roles/agents-md-scribe.md",
  "agent-factory/roles/architect-design.md",
  "agent-factory/roles/ba-pm.md",
  "agent-factory/roles/brownfield-mapper.md",
  "agent-factory/roles/compliance-officer.md",
  "agent-factory/roles/factory-coach.md",
  "agent-factory/roles/frontend-ui.md",
  "agent-factory/roles/greenfield-mapper.md",
  "agent-factory/roles/incident-responder.md",
  "agent-factory/roles/installer.md",
  "agent-factory/roles/orchestrator.md",
  "agent-factory/roles/qe-e2e.md",
  "agent-factory/roles/release-manager.md",
  "agent-factory/roles/security-nfr.md",
  "agent-factory/roles/software-engineer.md",
  "agent-factory/roles/system-analyst.md",
  "agent-factory/roles/uat-planner.md",
  "agent-factory/workflows/15-security-audit.md",
  "agent-factory/checklists/security-nfr-checklist.md",
  "agent-factory/handoffs/security-nfr-handoff.md",
  // Phase 19 Tier-1 oracle inputs (UAT-AUTO-05): the aggregator now invokes the three oracles, which
  // read these. Mirror them so the hermetic plant case below can break one and prove the aggregator
  // fails closed. (The oracle bodies live single-source in check-uat-oracles.ts.)
  ".planning/PROJECT.md",
  ".planning/STATE.md",
  ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
  ".planning/RETROSPECTIVE.md",
  "hooks/hooks.json",
  "hooks/guard.js",
  "examples/03-ticket-to-pr.md",
];

const tmpDirs: string[] = [];

// Build a temp mirror carrying byte-faithful copies of every guard input. Returns the mirror dir.
function mirror(): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-fg-"));
  tmpDirs.push(m);
  for (const rel of GUARD_INPUTS) {
    mkdirSync(join(m, dirname(rel)), { recursive: true });
    cpSync(join(ROOT, rel), join(m, rel));
  }
  return m;
}

// Run the compiled guard with CHECK_ROOT pointed at the mirror; capture status + combined output.
function runIn(checkRoot: string): SpawnSyncReturns<string> {
  return spawnSync("node", [GUARD_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
}

// The combined stdout+stderr of a guard run (findings print to stdout).
function out(r: SpawnSyncReturns<string>): string {
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
}

afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

describe("check-foundation-guards.js (SDLC-02 / SC2 fail-proof harness)", () => {
  // ── guard_wr05 — plant a frontmatter spawn grant; both grant SHAPES must be caught. ──────────
  it("guard_wr05 comma-form (tools: ... Agent) → nonzero + 'spawn grant'", () => {
    const m = mirror();
    appendFileSync(
      join(m, ".claude/agents/grugops-orchestrator.md"),
      "\ntools: Read, Agent\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/spawn grant/i);
  });

  it("guard_wr05 array-item (  - Agent) → nonzero + 'spawn grant'", () => {
    const m = mirror();
    appendFileSync(join(m, ".claude/skills/grugops/SKILL.md"), "\n  - Agent\n");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/spawn grant/i);
  });

  it("guard_wr05 quoted array-item (  - \"Agent\") → nonzero + 'spawn grant' (WR-02)", () => {
    const m = mirror();
    appendFileSync(join(m, ".claude/skills/grugops/SKILL.md"), '\n  - "Agent"\n');
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/spawn grant/i);
  });

  // ── guard_agents_bytes — oversize + missing (CR-01). ─────────────────────────────────────────
  it("guard_agents_bytes oversize (>28672B) → nonzero + 'AGENTS.md'", () => {
    const m = mirror();
    writeFileSync(join(m, "AGENTS.md"), "x".repeat(30000) + "\n");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("AGENTS.md");
  });

  it("guard_agents_bytes missing AGENTS.md → nonzero + 'AGENTS.md missing' (CR-01)", () => {
    const m = mirror();
    rmSync(join(m, "AGENTS.md"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("AGENTS.md missing");
  });

  // ── guard_adapter_size — oversize + missing (CR-01). ─────────────────────────────────────────
  it("guard_adapter_size oversize (>4096B) → nonzero + adapter path", () => {
    const m = mirror();
    writeFileSync(
      join(m, ".claude/skills/grugops/SKILL.md"),
      "x".repeat(5000) + "\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("SKILL.md");
  });

  it("guard_adapter_size missing adapter → nonzero + 'grugops-orchestrator.md missing' (CR-01)", () => {
    const m = mirror();
    rmSync(join(m, ".claude/agents/grugops-orchestrator.md"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("grugops-orchestrator.md missing");
  });

  // ── guard_voice — clear-voice marker in each surface + missing + refinement + unclosed fence. ─
  it("guard_voice marker in role clear-voice surface → nonzero + role path", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/roles/security-nfr.md"),
      "\ngrug smash the bug.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("security-nfr.md");
  });

  it("guard_voice marker in workflow 15 → nonzero + surface path (D-10)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/workflows/15-security-audit.md"),
      "\ngrug smash the audit.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("15-security-audit.md");
  });

  it("guard_voice marker in ASVS checklist → nonzero + surface path (D-10)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/checklists/security-nfr-checklist.md"),
      "\ngrug smash the checklist.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("security-nfr-checklist.md");
  });

  it("guard_voice marker in security-nfr handoff → nonzero + surface path (D-10)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/handoffs/security-nfr-handoff.md"),
      "\ngrug smash the handoff.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("security-nfr-handoff.md");
  });

  it("guard_voice missing file → nonzero + 'required voice file missing' (CR-02)", () => {
    const m = mirror();
    rmSync(join(m, "agent-factory/roles/compliance-officer.md"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("required voice file missing");
  });

  it("guard_voice refinement accepts clear-voice grug-meta + /grug (narrow, not weakened)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/roles/security-nfr.md"),
      "\nThe Scribe may add a light grug wink in Mission; route every `/grug` request to grug voice.\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  it("guard_voice unterminated caveman fence → nonzero + 'unterminated' (WR-03)", () => {
    const m = mirror();
    // Delete the CLOSING ``` of qe-e2e's `## Caveman prompt` block so the fence is unbalanced.
    const file = join(m, "agent-factory/roles/qe-e2e.md");
    const lines = readFileSync(file, "utf8").split("\n");
    let seen = false;
    let fence = 0;
    const kept: string[] = [];
    for (const line of lines) {
      if (/^## Caveman prompt/.test(line)) seen = true;
      if (seen && /^```/.test(line)) {
        fence++;
        if (fence === 2) continue; // drop the closing fence → unbalanced
      }
      kept.push(line);
    }
    writeFileSync(file, kept.join("\n"));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("unterminated");
  });

  // ── guard_caveman_preserved — sanded block + single-opener + missing (CR-02). ────────────────
  it("guard_caveman_preserved sanded block → nonzero + 'no caveman marker' (D-06)", () => {
    const m = mirror();
    const file = join(m, "agent-factory/roles/brownfield-mapper.md");
    const lines = readFileSync(file, "utf8").split("\n");
    // Replace the lines INSIDE the fenced block with marker-free professional prose (fences kept).
    let seen = false;
    let fence = 0;
    let infence = false;
    const kept: string[] = [];
    for (const line of lines) {
      if (/^## Caveman prompt/.test(line)) {
        seen = true;
        kept.push(line);
        continue;
      }
      if (seen && /^```/.test(line)) {
        fence++;
        kept.push(line);
        if (fence === 1) {
          kept.push("The role evaluates the repository with professional diligence.");
          infence = true;
          continue;
        }
        if (fence === 2) {
          infence = false;
          seen = false;
          continue;
        }
      }
      if (infence) continue;
      kept.push(line);
    }
    writeFileSync(file, kept.join("\n"));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("no caveman marker");
  });

  it("guard_caveman_preserved single-opener sand → nonzero + 'sanded to prose' (WR-01)", () => {
    const m = mirror();
    const file = join(m, "agent-factory/roles/brownfield-mapper.md");
    const lines = readFileSync(file, "utf8").split("\n");
    let seen = false;
    let fence = 0;
    let infence = false;
    const kept: string[] = [];
    for (const line of lines) {
      if (/^## Caveman prompt/.test(line)) {
        seen = true;
        kept.push(line);
        continue;
      }
      if (seen && /^```/.test(line)) {
        fence++;
        kept.push(line);
        if (fence === 1) {
          kept.push("You are the Brownfield Mapper.");
          kept.push("This role surveys the existing repository with professional diligence,");
          kept.push("documenting the current architecture before any change is proposed.");
          infence = true;
          continue;
        }
        if (fence === 2) {
          infence = false;
          seen = false;
          continue;
        }
      }
      if (infence) continue;
      kept.push(line);
    }
    writeFileSync(file, kept.join("\n"));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("sanded to prose");
  });

  it("guard_caveman_preserved missing role → nonzero + 'caveman prompt block missing' (CR-02)", () => {
    const m = mirror();
    rmSync(join(m, "agent-factory/roles/ba-pm.md"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("caveman prompt block missing");
  });

  // ── guard_role_size — oversize + missing (CR-01). ────────────────────────────────────────────
  it("guard_role_size oversize role (>ceiling) → nonzero + 'bloated' (D-07)", () => {
    const m = mirror();
    writeFileSync(
      join(m, "agent-factory/roles/brownfield-mapper.md"),
      "x".repeat(6000) + "\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("bloated");
  });

  it("guard_role_size missing role → nonzero + 'installer.md missing' (CR-01)", () => {
    const m = mirror();
    rmSync(join(m, "agent-factory/roles/installer.md"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("installer.md missing");
  });

  // ── Phase 19 Tier-1 oracle wiring (UAT-AUTO-05 / BLOCKER 1) — the aggregator must FAIL CLOSED. ──
  // Break a single Tier-1 input in the mirror (remove the READY_FOR_HUMAN_REVIEW verdict from the
  // parity example, which the A3 parity oracle asserts) and prove the aggregator goes red — i.e.
  // `node scripts/check-foundation-guards.js` exits non-zero when any one Tier-1 oracle fails.
  it("tier-1 wiring: a broken Tier-1 oracle input → aggregator nonzero + names the Tier-1 failure", () => {
    const m = mirror();
    const file = join(m, "examples/03-ticket-to-pr.md");
    const stripped = readFileSync(file, "utf8").replace(
      /READY_FOR_HUMAN_REVIEW/g,
      "REDACTED_VERDICT",
    );
    writeFileSync(file, stripped);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/parity structural violation/i);
    expect(out(r)).toContain("READY_FOR_HUMAN_REVIEW");
  });

  // ── Smoke — the REAL guard over the REAL tree must be GREEN (exit 0). ─────────────────────────
  it("smoke: real guard GREEN over the real tree (T-10-02-FP)", () => {
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // ── cmp — the two config JSONs must be byte-identical (the tri-file drift). ───────────────────
  it("config JSONs byte-identical (config/ == seed/.grugops/)", () => {
    const a = readFileSync(
      join(ROOT, "agent-factory/config/factory.config.json"),
    );
    const b = readFileSync(
      join(ROOT, "agent-factory/seed/.grugops/factory.config.json"),
    );
    expect(a.equals(b)).toBe(true);
  });
});

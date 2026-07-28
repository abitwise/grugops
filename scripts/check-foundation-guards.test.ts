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

import { listRoles, ROLE_COUNT } from "./kit-model.js";

const ROOT = join(import.meta.dirname, "..");
const GUARD_JS = join(ROOT, "scripts", "check-foundation-guards.js");

// Repo-relative path of a role file inside a mirror (or the real tree). Every plant case below goes
// through this helper rather than restating the directory, so the role directory is named in exactly
// one more place than the derivation itself — the set-literal drift this phase exists to delete.
const rolePath = (root: string, name: string): string =>
  join(root, "agent-factory/roles", name);

// (Phase 27 / KIT-01) The role portion of the harness's own input set is DERIVED. GUARD_INPUTS was
// itself a hand-maintained list of exactly the drift class this phase deletes: 17 role literals that
// had to be edited in lockstep with the guard's ROLE_FILES and the kit on disk. It is now built from
// the same authority the guard uses, so a mirror can never be missing a role the guard will scan.
// The NON-role entries stay explicit literals on purpose — they are a curated set of unrelated
// surfaces (AGENTS.md, the two adapters, the two packaging templates, the SEC_VOICE surfaces, the
// workflows, the .planning/ Tier-1 oracle inputs), not a directory listing, so there is nothing to
// derive them from.
const DERIVED_ROLE_INPUTS = listRoles().map((f) => `agent-factory/roles/${f}`);

// The complete set of input files the guard reads (repo-relative). A mirror carries byte-faithful
// copies of all of these; one file is then mutated to plant the violation. The derived role corpus
// plus the SEC_VOICE surfaces plus AGENTS.md + the 2 adapters + the 2 packaging templates.
const GUARD_INPUTS = [
  ...DERIVED_ROLE_INPUTS,
  "AGENTS.md",
  ".claude/skills/grugops/SKILL.md",
  ".claude/agents/grugops-orchestrator.md",
  "agent-factory/packaging/subagent.frontmatter.md",
  "agent-factory/packaging/slash-command.template.md",
  "agent-factory/workflows/15-security-audit.md",
  "agent-factory/checklists/security-nfr-checklist.md",
  // (Phase 24) agent-factory/handoffs/security-nfr-handoff.md was DROPPED from SEC_VOICE_FILES — the
  // 17 static handoff templates were deleted, so the deleted handoff is no longer a guard input.
  // Phase 19 Tier-1 oracle inputs (UAT-AUTO-05): the aggregator now invokes the three oracles, which
  // read these. Mirror them so the hermetic plant case below can break one and prove the aggregator
  // fails closed. (The oracle bodies live single-source in check-uat-oracles.ts.)
  ".planning/PROJECT.md",
  ".planning/STATE.md",
  ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
  ".planning/RETROSPECTIVE.md",
  "hooks/hooks.json",
  "hooks/guard.js",
  // (DOGF-01) examples/03-ticket-to-pr.md dropped: the A3 oracle is now oracleDualPathEquivalence,
  // which self-seeds hermetic temp dirs and reads no repo input — the former parity example is dead.
  // Phase 20 guard_context_writes SCAN set (SCTX-05): the 16 shipped workflows (the 17 roles are
  // already mirrored above). The guard greps these for a raw `.grugops/context/` write bypassing
  // context-io.ts; mirror them so the SC-5 planted-raw-write case can plant a bypass into one.
  "agent-factory/workflows/00-bootstrap-greenfield.md",
  "agent-factory/workflows/01-bootstrap-brownfield.md",
  "agent-factory/workflows/02-idea-to-epics.md",
  "agent-factory/workflows/03-epic-to-tickets.md",
  "agent-factory/workflows/04-ticket-to-pr.md",
  "agent-factory/workflows/05-pr-quality-gate.md",
  "agent-factory/workflows/06-uat-pack.md",
  "agent-factory/workflows/07-backlog-refinement.md",
  "agent-factory/workflows/08-sprint-planning.md",
  "agent-factory/workflows/09-daily-sweep.md",
  "agent-factory/workflows/10-sprint-review.md",
  "agent-factory/workflows/11-retro.md",
  "agent-factory/workflows/12-release.md",
  "agent-factory/workflows/13-incident.md",
  "agent-factory/workflows/14-ui-design-to-build.md",
  "agent-factory/workflows/15-security-audit.md",
  // Phase 27 (KIT-01): guard_kit_counts derives the workflow set from <CHECK_ROOT>/agent-factory/
  // workflows and requires exactly WORKFLOW_COUNT (19) entries. Workflows 16/17/18 are not in the
  // guard_context_writes SCAN set, but the mirror must still carry them or every plant case would
  // trip the count guard on a 16-workflow mirror instead of the violation it planted.
  "agent-factory/workflows/16-context-read-write.md",
  "agent-factory/workflows/17-task-claim.md",
  "agent-factory/workflows/18-context-compaction.md",
  // Phase 23 (D-19): the invoked oracleWr05Wording now scans the 5-tool tables for asymmetric-flip
  // drift, so mirror them too — otherwise the oracle's CR-01 missing-file fail-red would fire on
  // every foundation-guards plant case.
  "agent-factory/packaging/adapters.md",
  "agent-factory/README.md",
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
  // ── guard_wr05 (Phase 23 INVERTED, both-direction, marker-keyed) ─────────────────────────────
  // After the WR-05 flip the guard enforces BOTH directions over the explicit SCAN set:
  //   • the coordinator (coordinator: true marker) MUST carry the spawn grant;
  //   • every non-coordinator SCAN file MUST NOT.
  // The grant shapes (comma list + YAML array, both alias tokens) are still caught on a
  // non-coordinator; the orchestrator legitimately carries a grant now, so the rogue-grant plant
  // moves to a NON-coordinator SCAN file.

  // RED fixture (a): planted grant on a NON-coordinator SCAN file → rogue spawner. Plant onto a
  // packaging template (no coordinator: true marker) so the non-coordinator direction fires.
  it("guard_wr05 planted grant on non-coordinator (comma-form) → nonzero + 'rogue spawner' names the file", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/packaging/slash-command.template.md"),
      "\ntools: Read, Agent\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/rogue spawner/i);
    expect(out(r)).toContain("slash-command.template.md");
  });

  it("guard_wr05 planted grant on non-coordinator (array-item) → nonzero + 'rogue spawner'", () => {
    const m = mirror();
    appendFileSync(join(m, ".claude/skills/grugops/SKILL.md"), "\n  - Agent\n");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/rogue spawner/i);
    expect(out(r)).toContain("SKILL.md");
  });

  it("guard_wr05 planted grant on non-coordinator (quoted array-item) → nonzero + 'rogue spawner' (WR-02)", () => {
    const m = mirror();
    appendFileSync(join(m, ".claude/skills/grugops/SKILL.md"), '\n  - "Agent"\n');
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/rogue spawner/i);
    expect(out(r)).toContain("SKILL.md");
  });

  // RED fixture (b): the coordinator with its spawn grant DROPPED → a half-flip that silently kills
  // CC parallelism. Rewrite the orchestrator adapter to keep coordinator: true but strip every grant.
  it("guard_wr05 coordinator grant DROPPED → nonzero + 'dropped grant kills Claude Code parallelism' names the file (D-16)", () => {
    const m = mirror();
    const file = join(m, ".claude/agents/grugops-orchestrator.md");
    const stripped = readFileSync(file, "utf8")
      .split("\n")
      // remove any line that carries the spawn grant (comma list OR array item), keep the marker.
      .filter(
        (l) =>
          !/^(tools|allowed-tools):.*\b(Agent|Task)\b/.test(l) &&
          !/^[ \t]*-[ \t]*["']?(Agent|Task)\b/.test(l),
      )
      .join("\n");
    writeFileSync(file, stripped);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/kills Claude Code parallelism/i);
    expect(out(r)).toContain("grugops-orchestrator.md");
  });

  // RED fixture (c): the coordinator: true MARKER removed → a rename/marker-loss must not silently
  // demote the coordinator. With the marker gone the orchestrator is a non-coordinator that still
  // holds a grant → the non-coordinator direction fires.
  it("guard_wr05 coordinator marker REMOVED (grant retained) → nonzero + 'rogue spawner' names the file (D-15)", () => {
    const m = mirror();
    const file = join(m, ".claude/agents/grugops-orchestrator.md");
    const demoted = readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => !/^coordinator:\s*true\b/.test(l))
      .join("\n");
    writeFileSync(file, demoted);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/rogue spawner/i);
    expect(out(r)).toContain("grugops-orchestrator.md");
  });

  // CR-01 fence-immunity: a SCAN file carrying ONLY a FENCED coordinator example (marker + grant
  // inside a ``` block) and NO live grant must be IGNORED — the guard PASSES. This is the real
  // subagent.frontmatter.md shape (a documentation example), which previously read as a second live
  // coordinator. Plant the fenced example into a non-adapter SCAN file (slash-command.template.md,
  // which has no live marker/grant) and assert the aggregator stays GREEN.
  it("guard_wr05 FENCED coordinator example (marker+grant inside ```) is ignored → guard PASSES (CR-01 fence-immunity)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/packaging/slash-command.template.md"),
      "\n## Example coordinator wrapper\n\n```markdown\n---\nname: grugops-orchestrator\ncoordinator: true\ntools: Agent(grugops-software-engineer, grugops-qe-e2e), Read\n---\n```\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // CR-01 cardinality: a SCAN file with a LIVE (non-fenced) second coordinator: true + grant must
  // FAIL the exactly-one-coordinator cardinality check (found 2). Plant a real frontmatter marker +
  // grant (NOT inside a fence) into slash-command.template.md; with the orchestrator adapter already
  // a coordinator, the count becomes 2.
  it("guard_wr05 LIVE second coordinator (non-fenced) → nonzero + 'found 2' cardinality fail (CR-01)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/packaging/slash-command.template.md"),
      "\ncoordinator: true\ntools: Agent(grugops-software-engineer), Read\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/exactly one coordinator/i);
    expect(out(r)).toContain("found 2");
    expect(out(r)).toContain("slash-command.template.md");
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
      rolePath(m, "security-nfr.md"),
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

  // (Phase 24) The former "guard_voice marker in security-nfr handoff" case was REMOVED: the static
  // handoff templates were deleted, so agent-factory/handoffs/security-nfr-handoff.md is no longer a
  // SEC_VOICE_FILE. The surviving security surfaces (the 15-security-audit workflow + the
  // security-nfr-checklist, covered above) still prove guard_voice fails red on a SEC surface.

  // (Phase 27 / KIT-01) The three former "missing role file" cases — one each for guard_voice,
  // guard_caveman_preserved and guard_role_size — are SUPERSEDED and collapsed into the case below.
  // Those cases worked because ROLE_FILES was a hand-listed array: deleting a role from the mirror
  // left a list entry pointing at nothing, so each guard's `fileExists` branch fired naming the file.
  // ROLE_FILES is now DERIVED, so a deleted role is simply not discovered and no per-guard branch can
  // see it. The missing-role signal therefore moved UP to guard_kit_counts, which is strictly
  // stronger: the hand-list version could be defeated by deleting the role AND its list entry in one
  // commit (a fully green suite over a 16-role kit — the founding defect of this milestone), whereas
  // the derived exact count cannot be satisfied by any edit to the guard source. The per-guard
  // `fileExists` branches remain in place as TOCTOU defence between readdir and read.
  //
  // These are the TWO SIDES of D-20's exact-count enforcement, and the pair is the point: a `>=`
  // floor would let 18 through and a `<=` ceiling would let 16 through. Only 17 passes. Both test
  // names carry the string `kit count` so `vitest -t "kit count"` selects exactly this pair.
  it("kit count 16 roles (one deleted) → nonzero + names the derived 16 and the expected 17 (D-20 low side)", () => {
    const m = mirror();
    rmSync(rolePath(m, "compliance-officer.md"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("kit count");
    expect(out(r)).toContain("derived 16 role files");
    expect(out(r)).toContain("expected exactly 17");
  });

  it("kit count 18 roles (one planted) → nonzero + names the derived 18 and the expected 17 (D-20 high side)", () => {
    const m = mirror();
    // A well-formed 18th role: a byte copy of a real one, so it clears guard_voice and
    // guard_caveman_preserved. The ONLY reason to reject it is that the corpus is now 18.
    cpSync(rolePath(ROOT, "installer.md"), rolePath(m, "zz-planted-role.md"));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("kit count");
    expect(out(r)).toContain("derived 18 role files");
    expect(out(r)).toContain("expected exactly 17");
  });

  // D-19 per-consumer derivation proof: ROLE_FILES must be genuinely DERIVED, not re-listed under a
  // new name. Plant an 18th role and assert a downstream consumer (guard_role_size) emits a line
  // naming it — a re-listed set would never mention a file no author added to the list. This case
  // asserts on the PRESENCE of that line, not on the exit code: guard_kit_counts legitimately fails
  // in the same run (the corpus is 18), and that is not what is under test here.
  it("planted 18th role reaches guard_role_size — ROLE_FILES is derived, not re-listed (D-19)", () => {
    const m = mirror();
    cpSync(rolePath(ROOT, "installer.md"), rolePath(m, "zz-derived-probe.md"));
    const lines = out(runIn(m)).split("\n");
    const roleSizeLine = lines.find(
      (l) => /^ {2}(PASS|WARN|FAIL)/.test(l) && l.includes("zz-derived-probe.md"),
    );
    expect(roleSizeLine).toBeDefined();
    // roleCeiling() is deliberately NOT derived (D-17), so an undocumented role fails CLOSED naming
    // the file rather than inheriting an automatic ceiling.
    expect(roleSizeLine).toContain("no documented ceiling");
  });

  // The harness's own input set must stay derived — if DERIVED_ROLE_INPUTS ever silently emptied or
  // drifted, every mirror above would be built from an incomplete kit and the plants would be
  // measuring nothing.
  it("GUARD_INPUTS derives exactly ROLE_COUNT role entries (the harness input set is not hand-listed)", () => {
    expect(DERIVED_ROLE_INPUTS.length).toBe(ROLE_COUNT);
    expect(DERIVED_ROLE_INPUTS).toContain("agent-factory/roles/orchestrator.md");
    expect(DERIVED_ROLE_INPUTS).not.toContain(
      "agent-factory/roles/_role-switch-protocol.md",
    );
  });

  it("guard_voice refinement accepts clear-voice grug-meta + /grug (narrow, not weakened)", () => {
    const m = mirror();
    appendFileSync(
      rolePath(m, "security-nfr.md"),
      "\nThe Scribe may add a light grug wink in Mission; route every `/grug` request to grug voice.\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  it("guard_voice unterminated caveman fence → nonzero + 'unterminated' (WR-03)", () => {
    const m = mirror();
    // Delete the CLOSING ``` of qe-e2e's `## Caveman prompt` block so the fence is unbalanced.
    const file = rolePath(m, "qe-e2e.md");
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
    const file = rolePath(m, "brownfield-mapper.md");
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
    const file = rolePath(m, "brownfield-mapper.md");
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

  // (Phase 27 / KIT-01) The former "missing role → caveman prompt block missing" case is superseded
  // by the derived-kit-count case above. See the comment there.

  // ── guard_role_size — oversize + missing (CR-01). ────────────────────────────────────────────
  it("guard_role_size oversize role (>ceiling) → nonzero + 'bloated' (D-07)", () => {
    const m = mirror();
    writeFileSync(
      rolePath(m, "brownfield-mapper.md"),
      "x".repeat(6000) + "\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("bloated");
  });

  // (Phase 27 / KIT-01) The former "missing role → installer.md missing" case is superseded by the
  // `kit count 16 roles` case above; the D-17 undocumented-role direction is covered by the
  // `planted 18th role reaches guard_role_size` case, which asserts on the guard_role_size line.

  // ── Phase 19 Tier-1 oracle wiring (UAT-AUTO-05 / BLOCKER 1) — the aggregator must FAIL CLOSED. ──
  // Break a single Tier-1 input in the mirror and prove the aggregator goes red — i.e. `node
  // scripts/check-foundation-guards.js` exits non-zero when any one Tier-1 oracle fails, proving it
  // folds uatOracleFails(). (DOGF-01: the A3 oracle is now oracleDualPathEquivalence, which self-seeds
  // hermetic temp dirs and reads NO mirror input, so it cannot be broken via the mirror. We break the
  // A2 hooks-wiring oracle instead — mutating hooks.json's matcher away from "Bash" is a crisp
  // deterministic Tier-1 failure that the aggregator must inherit.)
  it("tier-1 wiring: a broken Tier-1 oracle input → aggregator nonzero + names the Tier-1 failure", () => {
    const m = mirror();
    const file = join(m, "hooks/hooks.json");
    const cfg = JSON.parse(readFileSync(file, "utf8"));
    cfg.hooks.PreToolUse[0].matcher = "NotBash";
    writeFileSync(file, JSON.stringify(cfg, null, 2));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/matcher is not "Bash"/);
  });

  // ── guard_context_writes — SC-5: planted raw context write fires; legitimate prose stays GREEN. ──
  // A raw `writeFileSync('.grugops/context/...')` in shipped role text bypasses context-io.ts — the
  // exact T-20-10 tampering threat. Plant it into one scanned role file and prove the aggregator goes
  // red naming SCTX-05. (token-then-path: the write TOKEN precedes the path on the line.)
  it("guard_context_writes planted raw write (writeFileSync into .grugops/context/) → nonzero + SCTX-05", () => {
    const m = mirror();
    // Plant into a WORKFLOW (no byte ceiling) so the only guard that can fire is guard_context_writes —
    // proving SCTX-05 fires on the bypass in isolation, not as a side effect of guard_role_size.
    appendFileSync(
      join(m, "agent-factory/workflows/02-idea-to-epics.md"),
      "\nwriteFileSync('.grugops/context/task-x/notes/n.md', data);\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("SCTX-05");
  });

  // path-then-token shape: a shell redirect writing the context path (`echo ... >> .grugops/context/`).
  it("guard_context_writes planted shell redirect (echo >> .grugops/context/) → nonzero + SCTX-05", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/workflows/04-ticket-to-pr.md"),
      "\necho note >> .grugops/context/task-x/index.md\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("SCTX-05");
  });

  // CALIBRATION (A3): legitimate prose that merely NAMES the helper + the path is NOT a raw write —
  // the guard must stay GREEN (the prose word "write" is not a TOKEN). This is the no-false-positive
  // half of the no-fabrication proof: the guard fires on a real bypass but not on sanctioned prose.
  it("guard_context_writes prose naming context-io.ts + path stays GREEN (no false positive, A3)", () => {
    const m = mirror();
    // Append to a WORKFLOW file (workflows have no byte ceiling, so this isolates the calibration to
    // guard_context_writes — a role file would also trip guard_role_size, masking the real assertion).
    appendFileSync(
      join(m, "agent-factory/workflows/03-epic-to-tickets.md"),
      "\nRoles never raw-write `.grugops/context/` directly; they call the context-io.ts helper.\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
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

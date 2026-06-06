---
phase: 07-shared-home-foundation-path-rewrite
reviewed: 2026-06-06T00:00:00Z
depth: standard
files_reviewed: 51
files_reviewed_list:
  - scripts/check-kit-refs.sh
  - AGENTS.md
  - .claude/agents/grugops-orchestrator.md
  - .claude/skills/grugops/SKILL.md
  - .claude/skills/grugops-gate/SKILL.md
  - .claude/skills/grugops-map/SKILL.md
  - .claude/skills/grugops-plan/SKILL.md
  - .claude/skills/grugops-release/SKILL.md
  - .claude/skills/grugops-ticket/SKILL.md
  - .claude/skills/grugops-uat/SKILL.md
  - skills/grugops/SKILL.md
  - skills/gate/SKILL.md
  - skills/map/SKILL.md
  - skills/plan/SKILL.md
  - skills/release/SKILL.md
  - skills/ticket/SKILL.md
  - skills/uat/SKILL.md
  - agent-factory/_commit-convention.md
  - agent-factory/packaging/slash-command.template.md
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/agents-md-scribe.md
  - agent-factory/roles/architect-design.md
  - agent-factory/roles/ba-pm.md
  - agent-factory/roles/brownfield-mapper.md
  - agent-factory/roles/compliance-officer.md
  - agent-factory/roles/factory-coach.md
  - agent-factory/roles/greenfield-mapper.md
  - agent-factory/roles/incident-responder.md
  - agent-factory/roles/installer.md
  - agent-factory/roles/qe-e2e.md
  - agent-factory/roles/release-manager.md
  - agent-factory/roles/security-nfr.md
  - agent-factory/roles/software-engineer.md
  - agent-factory/roles/system-analyst.md
  - agent-factory/roles/uat-planner.md
  - agent-factory/workflows/00-bootstrap-greenfield.md
  - agent-factory/workflows/01-bootstrap-brownfield.md
  - agent-factory/workflows/02-idea-to-epics.md
  - agent-factory/workflows/03-epic-to-tickets.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/05-pr-quality-gate.md
  - agent-factory/workflows/06-uat-pack.md
  - agent-factory/workflows/07-backlog-refinement.md
  - agent-factory/workflows/08-sprint-planning.md
  - agent-factory/workflows/09-daily-sweep.md
  - agent-factory/workflows/11-retro.md
  - agent-factory/workflows/12-release.md
  - agent-factory/workflows/13-incident.md
findings:
  critical: 0
  warning: 5
  info: 2
  total: 7
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-06-06
**Depth:** standard
**Files Reviewed:** 51
**Status:** issues_found

## Summary

Reviewed the Phase-7 shared-home path rewrite: the one executable artifact (`scripts/check-kit-refs.sh`) and the markdown kit that encodes the kit-vs-state path convention. The core rewrite is largely correct: all reviewed roles/workflows/skills point config at `.grugops/factory.config.json`, all `agent-factory/handoffs/` refs in the kit are template-basename reads, all runtime instance writes go to `plans/handoffs/<ID>-<stage>.md`, the kit-vs-state invariant marker is byte-identical at every site it appears, and `$GRUGOPS_HOME` is confined to the three legal resolver sites. The gate ships GREEN as intended.

However, the adversarial pass surfaced real defects, all in the WARNING/INFO tier (no security or data-loss issues in a read-only markdown kit):

1. **The gate has two genuine false-green channels** — line-level filtering in Assertion 2, and missing-path swallowing via `|| true` in all three grep assertions. Both let the gate report PASS when it should not.
2. **The gate's SC2 marker check omits a 5th site** (`skills/grugops/SKILL.md`) that actually carries the marker, leaving that copy unguarded against drift.
3. **The rewrite is incomplete outside the gate's scan set.** `agent-factory/README.md` — explicitly named by the in-scope `orchestrator.md` as the consistency anchor for the workflow mapping — still carries the OLD `agent-factory/config/factory.config.json` path and "Orchestrator spawns role agents" language that directly contradicts the no-spawn role-switch protocol. The gate cannot see these because it deliberately excludes the README.
4. **The two packaging templates contradict the deployed adapters and the design**: they prescribe the `Agent` spawn tool and a "spawn specialist role sub-agents" rationale, while the shipped adapters correctly omit it and `_role-switch-protocol.md` states "No `Agent` tool. No sub-agent spawn."

## Warnings

### WR-01: Gate Assertion 2 hides a leaked instance write that shares a line with a valid template ref

**File:** `scripts/check-kit-refs.sh:89-93`
**Issue:** Assertion 2 detects stray (non-template) `agent-factory/handoffs/` refs by piping through `grep -Ev "$ALLOW"` — line-level inverse matching. `grep -Ev` removes the **entire line** if the ALLOW pattern matches **anywhere** on it. So a single line containing both a legitimate template ref and a leaked instance write — e.g. `read agent-factory/handoffs/product-handoff.md then write agent-factory/handoffs/ABC-001.md` — is removed whole, and the leaked `ABC-001.md` instance write into the read-only KIT is silently hidden. Verified by direct test: the line is dropped and Assertion 2 reports PASS. This is latent today (no current multi-ref lines exist), but the gate's entire purpose is "cannot silently regress," and this is a regression channel it cannot catch.
**Fix:** Match per-occurrence rather than per-line. Extract just the handoff tokens first, then filter:
```sh
stray=$(grep -rhoE 'agent-factory/handoffs/[^ )`"'\'']*' $SCAN \
        | grep -Ev "^$ALLOW\$" \
        | grep -Ev 'agent-factory/handoffs/$' \
        | grep -Ev 'agent-factory/handoffs/<template>\.md$' \
        | sort -u || true)
```
(Anchoring with `^…$` on the extracted token also closes the unanchored-prefix gap in WR-03.)

### WR-02: Gate reports PASS when a scan target is missing (false green on path drift)

**File:** `scripts/check-kit-refs.sh:74, 89-93, 107`
**Issue:** All three grep assertions are wrapped `grep -rn '…' $SCAN || true` and capture only stdout. If any path in `$SCAN`/`$GH_SCAN` is renamed or deleted (exactly the kind of drift this gate exists to catch), grep prints a "No such file" error to **stderr** and exits non-zero — but `|| true` swallows the failure and the captured match variable is empty, so the assertion reports PASS. Verified: `cfg=$(grep -rn 'agent-factory/config/' agent-factory/GONE_DIR || true)` yields an empty `cfg` and a green assertion. The gate cannot tell "zero misclassified refs" from "I stopped scanning that file." (Note: the SC2 marker loop at lines 120-126 is NOT vulnerable — it explicitly tests `[ ! -f "$site" ]` — which is the correct pattern the assertions should mirror.)
**Fix:** Pre-validate every scan path before grepping, so a vanished target fails loudly instead of passing silently:
```sh
for p in $SCAN $GH_SCAN $MARKER_SITES; do
  [ -e "$p" ] || { fail "scan target missing: $p (gate cannot prove a tree it cannot see)"; }
done
```

### WR-03: Assertion 2 ALLOW regex is unanchored — a wrong-prefix path is treated as a valid template

**File:** `scripts/check-kit-refs.sh:57, 90`
**Issue:** `ALLOW` is not left-anchored, so `grep -Ev "$ALLOW"` accepts any line where the template pattern appears as a substring after arbitrary leading characters. Verified: `XXXagent-factory/handoffs/product-handoff.md` is treated as a valid template ref and filtered out. A mis-rewritten path that accidentally fuses a prefix onto a template name would slip past the gate.
**Fix:** Anchor the match to a path boundary (start-of-line or a non-path character) once tokens are extracted per WR-01, e.g. filter against `^$ALLOW$` on extracted tokens, or prepend a boundary in the inverse match.

### WR-04: SC2 marker check omits the 5th site that actually carries the marker

**File:** `scripts/check-kit-refs.sh:60`
**Issue:** `MARKER_SITES` lists four sites, but the kit-vs-state invariant marker is present and byte-identical at **five**: the four listed plus `skills/grugops/SKILL.md` (the plugin-form dispatcher). That fifth copy is inside the gate's `$SCAN` set (so Assertions 1-2 read it) but is excluded from the SC2 marker check, so if the marker drifts or is deleted from `skills/grugops/SKILL.md` the gate stays GREEN. The phase intent's "byte-identical marker must be present and consistent" is not enforced on one of the sites that carries it. Either the marker should not be in that file, or the gate should check it — the current state is inconsistent.
**Fix:** Add the dispatcher to the marker-site list:
```sh
MARKER_SITES="AGENTS.md agent-factory/roles/orchestrator.md .claude/agents/grugops-orchestrator.md .claude/skills/grugops/SKILL.md skills/grugops/SKILL.md"
```
(If the design intends only four canonical sites, instead remove the blockquote from `skills/grugops/SKILL.md` and document why the plugin dispatcher differs from the standalone one.)

### WR-05: Packaging templates prescribe the `Agent` spawn tool, contradicting the no-spawn design and the shipped adapters

**File:** `agent-factory/packaging/subagent.frontmatter.md:25, 55-59` and `agent-factory/packaging/slash-command.template.md:31, 56, 100-102`
**Issue:** Both packaging templates — the copy-ready sources from which adapters are regenerated — include `Agent` in the tool/`allowed-tools` list and explain at length that it is required to "spawn specialist role sub-agents" (subagent template lines 55-59; slash-command template lines 100-102). This directly contradicts `agent-factory/roles/_role-switch-protocol.md:43` ("No `Agent` tool. No sub-agent spawn. One window, drop prior context...") and the deployed adapters, which correctly OMIT `Agent` (verified: zero `Agent` tokens in any shipped `.claude/skills`, `skills`, or `.claude/agents/grugops-orchestrator.md`). Because these are the regeneration templates, a future install/regeneration would re-introduce the `Agent` tool and re-grant the spawn capability the design forbids — silently violating the single-window sequential-role-load invariant. The drift is in the template, not the deployed file, so the gate (which scans `agent-factory/packaging`) does not flag it because it only checks config/handoff/`$GRUGOPS_HOME`, not the spawn-tool contradiction.
**Fix:** Remove `Agent` from both templates' tool lists and rewrite the rationale to match `_role-switch-protocol.md`:
```markdown
tools: Read, Grep, Glob, Bash, Edit, Write
# (no Agent — grugops runs single-window sequential role-load; it never spawns sub-agents)
```
Delete or rewrite subagent.frontmatter.md lines 55-59 and slash-command.template.md lines 100-102, which assert the opposite.

## Info

### IN-01: `agent-factory/README.md` still carries the OLD config path and contradicts the no-spawn protocol

**File:** `agent-factory/README.md:17, 57-58` (config path) and `:40, 46-47` (spawn language)
**Issue:** Out of the assigned review set, but flagged because the **in-scope** `agent-factory/roles/orchestrator.md:90` explicitly names this README as the consistency anchor ("must stay consistent with `agent-factory/README.md`"), so its drift undermines a reviewed file. The README still instructs readers to read `agent-factory/config/factory.config.json` (lines 17, 57) — the pre-rewrite path the phase migrated to `.grugops/factory.config.json` — and states "Native sub-agents — the Orchestrator spawns role agents" / "the Orchestrator spawns a role agent" (lines 40, 46-47), contradicting `_role-switch-protocol.md`. The gate passes only because it deliberately excludes `agent-factory/README.md` and `agent-factory/config/` from its scan set; the rewrite is therefore incomplete in files the gate cannot see. `agent-factory/config/factory.config.md` (lines 1, 3, 75, 81) carries the same stale config path.
**Fix:** Update the README's config refs to `.grugops/factory.config.json` and reconcile the spawn language with the single-window sequential-role-load design (or, if the README intentionally documents a separate Claude-Code-native variant, state that explicitly so it does not read as a contradiction). Same config-path fix for `factory.config.md`. Confirm whether these files are in Phase-7 scope; if so they are missed rewrites, if not they should be tracked as follow-up.

### IN-02: Gate comment claims "four canonical sites" while five files carry the marker

**File:** `scripts/check-kit-refs.sh:17-18, 59`
**Issue:** The header and SC2 comment describe "all four canonical sites" carrying the invariant, but the marker is byte-identical at five files (see WR-04). The documentation and the enforced reality disagree, which will mislead the next maintainer about how many copies must stay in sync.
**Fix:** Once WR-04 is resolved, update the comment to state the true count and list every checked site.

---

_Reviewed: 2026-06-06_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

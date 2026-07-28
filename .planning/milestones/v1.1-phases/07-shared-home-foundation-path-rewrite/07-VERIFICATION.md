---
phase: 07-shared-home-foundation-path-rewrite
verified: 2026-06-06T12:00:00Z
status: passed
score: 5/5
overrides_applied: 0
---

# Phase 7: Shared-Home Foundation & Path Rewrite — Verification Report

**Phase Goal:** Lock the kit/state split convention and the single "one rule, two homes" resolution mechanism, then rewrite the role/workflow/adapter files so every reference resolves to the correct root — kit refs under the KIT ROOT (read-only), state refs repo-relative — leaving zero bare `agent-factory/` references that should point at the kit.
**Verified:** 2026-06-06T12:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Kit-home convention stated once and used everywhere: `${GRUGOPS_HOME:-$HOME/.grugops}`, env-overridable, default `~/.grugops`, NOT XDG, NOT literal `~`, documented as read-only/central (SC1 / SHOME-01) | VERIFIED | Self-heal `KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"` present in both resolver adapters (`.claude/agents/grugops-orchestrator.md:14`, `.claude/skills/grugops/SKILL.md:19`) and the resolver-mirroring packaging template (`agent-factory/packaging/subagent.frontmatter.md:35`). AGENTS.md §Kit vs state states the kit is "read-only, resolved from the kit root; NEVER written." Colon-form `:-` used correctly so an empty env var also falls back. |
| 2 | Disambiguation rule stated once in AGENTS.md and the orchestrator/adapter preamble: agent-factory/ = KIT; plans/ + memory-bank/ + .grugops/ = STATE; agent-factory/handoffs/ = template TEMPLATE read; plans/handoffs/ = runtime INSTANCE write; STOP if kit dir absent (SC2 / SHOME-02) | VERIFIED | AGENTS.md §Kit vs state section present with canonical rule and invariant blockquote. Invariant marker `If the kit dir is absent, STOP — do not hunt.` byte-identical at all four checked canonical sites (AGENTS.md, orchestrator.md, grugops-orchestrator.md, .claude/skills/grugops/SKILL.md). Gate SC2 check confirms 4/4. `_role-switch-protocol.md:29` carries step-4 split (`plans/handoffs/<WORK-ITEM-ID>-<stage>.md`). |
| 3 | Role/workflow/adapter files rewritten so handoff writes land in plans/handoffs/, config refs resolve to .grugops/factory.config.json, kit-to-kit refs keep their agent-factory/… prefix; _role-switch-protocol step-4 template-read-vs-instance-write split in place (SC3 / SHOME-03) | VERIFIED | `grep -rn 'agent-factory/config/' $SCAN` = 0 hits. 17 roles have `.grugops/factory.config.json`. All 13 op-skills migrated. All 14 workflows migrated. `04-ticket-to-pr.md` read side reads `plans/handoffs/<TICKET-ID>-implementation.md`. `software-engineer.md` writes to `plans/handoffs/<TICKET-ID>-implementation.md`. Gate Assertion 1 + 2 both pass. `node scripts/validate-agent-factory.mjs` exits 0 (no structural regression). |
| 4 | Kit root resolves by ONE rule with two homes — installer-materialized absolute path (slot left for Phase 8) or ${CLAUDE_PLUGIN_ROOT} (plugin); no role/workflow/SKILL/AGENTS.md ever names $GRUGOPS_HOME (SC4 / SHOME-04) | VERIFIED | `$GRUGOPS_HOME` appears in exactly 3 files: `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, `agent-factory/packaging/subagent.frontmatter.md` (the resolver-mirroring template). Zero hits in `agent-factory/roles/`, `agent-factory/workflows/`, `AGENTS.md`, op-skill files. Gate Assertion 3 passes (GH_SCAN of kit prose is clean). Phase-8 slot [1] (materialized absolute path) left empty as seam. |
| 5 | Build gate `scripts/check-kit-refs.sh` exists, exits 0 over the rewritten tree, and a fail-on-mutation proof was recorded (SC5 / SHOME-03) | VERIFIED | `sh scripts/check-kit-refs.sh` exits 0 (ALL CHECKS PASSED — Assertion 1 + 2 + 3 + SC2 green). `node scripts/validate-agent-factory.mjs` exits 0. Gate is POSIX `#!/usr/bin/env sh` with `set -eu`, uses portable grep flags only, is strictly read-only (no sed -i / write / rm). Fail-on-mutation proof recorded in 07-04-SUMMARY: injected stray ref exited 1 and named both strays. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `AGENTS.md` | Canonical kit-vs-state rule + invariant marker phrase + config refs at .grugops/ | VERIFIED | §Kit vs state section present; invariant marker byte-identical; zero `agent-factory/config/` refs; zero `$GRUGOPS_HOME` |
| `agent-factory/roles/orchestrator.md` | Compressed invariant preamble + rewritten config/handoff refs | VERIFIED | Invariant blockquote at lines 7–7; config ref → `.grugops/factory.config.json`; `plans/handoffs/` for open handoffs; no `$GRUGOPS_HOME` |
| `.claude/agents/grugops-orchestrator.md` | Sole-resolver self-heal + STOP + invariant | VERIFIED | `KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"` at line 14; step [3] STOP present; invariant marker present; safety line preserved |
| `.claude/skills/grugops/SKILL.md` | Sole-resolver self-heal + STOP + invariant | VERIFIED | Same resolver block as grugops-orchestrator.md; invariant marker present; safety line preserved; no Agent tool in allowed-tools |
| `scripts/check-kit-refs.sh` | POSIX read-only gate, 3 assertions + SC2 marker check, exits 0 | VERIFIED | Exits 0; `#!/usr/bin/env sh`; `set -eu`; explicit SCAN path list; portable grep flags; no write operators; fail-on-mutation proven |
| `agent-factory/roles/_role-switch-protocol.md` | Step-4 template-read-vs-instance-write split | VERIFIED | Line 29: `plans/handoffs/<WORK-ITEM-ID>-<stage>.md` instance write instruction present |
| `agent-factory/roles/software-engineer.md` | Implementation-handoff template read + ticket-scoped instance write | VERIFIED | Line 35: reads `implementation-handoff.md` template from KIT, writes `plans/handoffs/<TICKET-ID>-implementation.md` |
| `agent-factory/workflows/04-ticket-to-pr.md` | Handoffs-produced section + read side both ticket-scoped | VERIFIED | Line 36: `plans/handoffs/<TICKET-ID>-implementation.md` in produced section; line 13: agents listed write to instances |
| All 13 op-skills (6 dash + 7 colon) | Config refs → .grugops/ + compressed invariant | VERIFIED | Zero `agent-factory/config/` refs; invariant marker in all 13; no `$GRUGOPS_HOME` |
| All 14 workflows | Config refs → .grugops/ + Handoffs-produced → plans/handoffs/ | VERIFIED | Gate Assertion 1 clean; all 14 Handoffs-produced sections name ticket-scoped instances |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| AGENTS.md §Kit vs state | Canonical rule site | Invariant marker phrase `If the kit dir is absent, STOP — do not hunt.` | VERIFIED | Gate SC2 pass + direct grep confirmed |
| orchestrator.md preamble | AGENTS.md §Kit vs state | Byte-identical invariant + cross-link `(Full rule: AGENTS.md § Kit vs state.)` | VERIFIED | marker present at line 7 |
| .claude/agents/grugops-orchestrator.md | ${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory | bash self-heal line 14 | VERIFIED | Colon-form `:-` present; STOP on absence at line 15–18 |
| .claude/skills/grugops/SKILL.md | ${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory | bash self-heal line 19 | VERIFIED | Identical resolver block; STOP instruction present |
| agent-factory/roles/qe-e2e.md input | plans/handoffs/<TICKET-ID>-implementation.md | upstream instance read (D-06) | VERIFIED | Line 22 reads the Software Engineer's produced instance, not a template |
| agent-factory/roles/_role-switch-protocol.md step 4 | plans/handoffs/<WORK-ITEM-ID>-<stage>.md | instance write instruction | VERIFIED | Line 29 present with correct TOKEN format |
| scripts/check-kit-refs.sh SCAN list | agent-factory/{roles,workflows,checklists,packaging} + .claude/skills + .claude/agents/grugops-orchestrator.md + skills + AGENTS.md | explicit path variable `SCAN=` | VERIFIED | SCAN variable confirmed; fixtures/examples/install/docs/.planning excluded by omission |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces markdown prose files and a POSIX shell gate script, not components that render dynamic data. Level 4 data-flow trace skipped.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build gate exits 0 over rewritten tree (SC5) | `sh scripts/check-kit-refs.sh` | exit 0, ALL CHECKS PASSED | PASS |
| Structural validator exits 0 (no regression) | `node scripts/validate-agent-factory.mjs` | exit 0, ALL CHECKS PASSED | PASS |
| Zero config refs in role/workflow/skill SCAN | `grep -rn 'agent-factory/config/' $SCAN` | 0 hits | PASS |
| Invariant marker at 4 canonical sites | Gate SC2 check | 4/4 sites verified | PASS |
| $GRUGOPS_HOME confined to 3 legal files | Gate Assertion 3 + manual grep | Exactly 3 files (resolver adapters + resolver-mirroring template) | PASS |

### Probe Execution

No probes declared for this phase (markdown rewrite + POSIX gate script, no sh/test probe infrastructure). Step 7c: SKIPPED (no probe files declared or discovered).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| SHOME-01 | 07-01-PLAN.md | Kit installs once to $GRUGOPS_HOME (default ~/.grugops, env-overridable); read-only/central; NOT XDG | SATISFIED | Colon-form self-heal in 3 legal sites; AGENTS.md documents kit as read-only; convention frozen in resolver adapters |
| SHOME-02 | 07-01, 07-02, 07-03-PLAN.md | Per-repo state in target repo (plans/ + memory-bank/ + .grugops/factory.config.json); 32 config refs → .grugops/ | SATISFIED | Zero agent-factory/config/ refs in SCAN; all roles/workflows read .grugops/factory.config.json; handoff instances in plans/handoffs/ |
| SHOME-03 | 07-01, 07-02, 07-03, 07-04-PLAN.md | ~31 role/workflow/adapter files rewritten; build gate proves zero misclassified refs | SATISFIED | Gate exits 0; 17 roles + 14 workflows + 13 op-skills + 2 resolver adapters + 2 packaging templates rewritten |
| SHOME-04 | 07-01-PLAN.md | Kit root resolves by ONE rule with two homes; no LLM-visible $GRUGOPS_HOME in prose | SATISFIED | Single self-heal rule in adapters only; zero $GRUGOPS_HOME in roles/workflows/AGENTS.md/op-skills |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `agent-factory/packaging/subagent.frontmatter.md` | 15, 25, 55–59 | `Agent` tool prescribed in template + explanatory prose claiming "spawn specialist role sub-agents" | Warning | Contradicts deployed adapters (which correctly omit Agent) and `_role-switch-protocol.md:43` ("No Agent tool. No sub-agent spawn."). A future install.sh regeneration from this template would silently re-introduce spawn capability. Not a current SC violation — deployed files are correct. Tracked in 07-REVIEW.md as WR-05. |
| `agent-factory/packaging/slash-command.template.md` | 31, 56, 100–102 | `Agent` in `allowed-tools` + rationale claiming spawn capability | Warning | Same contradiction as subagent.frontmatter.md. Template is the regeneration source; deployed op-skills correctly omit Agent. |
| `scripts/check-kit-refs.sh` | 89–93 | Assertion 2 does per-line grep filtering — a line with both a valid template ref and a leaked instance would have the leak hidden (WR-01 per 07-REVIEW.md) | Warning | Latent false-green channel; no current multi-ref lines exist; gate passes correctly today |
| `scripts/check-kit-refs.sh` | 74, 107 | `grep ... || true` swallows non-zero exit from missing paths — a renamed scan target would silently yield empty match and PASS (WR-02 per 07-REVIEW.md) | Warning | False-green channel if a scan path vanishes; SC2 marker loop is immune (uses explicit file existence check) |
| `scripts/check-kit-refs.sh` | 57, 90 | Assertion 2 ALLOW regex is unanchored — a wrong-prefix path matches as a valid template substring (WR-03 per 07-REVIEW.md) | Warning | Edge-case false-green; no current paths have this shape |
| `scripts/check-kit-refs.sh` | 60 | SC2 MARKER_SITES lists 4 sites but 19 files carry the invariant marker (including `skills/grugops/SKILL.md` which is in SCAN but not in MARKER_SITES) (WR-04 per 07-REVIEW.md) | Warning | `skills/grugops/SKILL.md` marker drift would not be caught by the gate; marker is currently present there |
| `agent-factory/README.md` | 17, 40, 46–47, 57–58 | Stale `agent-factory/config/factory.config.json` path + "Orchestrator spawns role agents" language (IN-01 per 07-REVIEW.md) | Info | Deliberately OUT OF PHASE SCOPE per RESEARCH.md O2 decision; deferred to Phase 8 install-doc work. No SC violated. |
| `agent-factory/config/factory.config.md` | 3 | Self-referencing `agent-factory/config/factory.config.json` path | Info | Documentation file, not a role/workflow/adapter; excluded from gate SCAN by design; same O2 deferral applies. |

No TBD/FIXME/XXX markers found in any phase-modified file.

### Human Verification Required

None. All success criteria are verifiable programmatically. The gate script and grep checks provide mechanical proof for all five SCs.

### Gaps Summary

No gaps. All five Success Criteria are verified:

1. **SC1 (SHOME-01):** The `${GRUGOPS_HOME:-$HOME/.grugops}` convention is frozen in the resolver adapters (colon-form self-heal) and the kit is documented as read-only in AGENTS.md §Kit vs state. The env var is confined to exactly 3 legal files.

2. **SC2 (SHOME-02):** The disambiguation rule is stated canonically once in AGENTS.md, byte-identically in the orchestrator preamble and both resolver adapters. The invariant marker is confirmed at all four canonical sites by the gate's SC2 check. The _role-switch-protocol step-4 split is in place.

3. **SC3 (SHOME-03):** All role/workflow/adapter files in the gate's SCAN are rewritten — zero `agent-factory/config/` refs, handoff writes land in `plans/handoffs/`, config reads from `.grugops/factory.config.json`. The structural validator exits 0 confirming no regression.

4. **SC4 (SHOME-04):** The kit root resolves by ONE rule. No role, workflow, SKILL body, or AGENTS.md names `$GRUGOPS_HOME`. Gate Assertion 3 confirms clean kit prose.

5. **SC5 (SHOME-03):** `sh scripts/check-kit-refs.sh` exits 0 — Assertions 1, 2, 3, and SC2 all pass. Fail-on-mutation proof recorded in 07-04-SUMMARY.

**Warnings not blocking goal achievement:**

The four gate quality issues (WR-01 through WR-04 from 07-REVIEW.md) and the packaging template Agent-tool contradiction (WR-05) are real quality defects but do not prevent the phase goal from being achieved. The gate currently works correctly for the rewritten tree. The packaging templates' Agent tool is not used by any deployed adapter and does not violate any SC requirement. Addressing these before Phase 8 is recommended to prevent the regeneration hazard (WR-05) and gate reliability concerns (WR-01/02/03/04).

The README.md and factory.config.md stale refs (IN-01) are intentionally out of phase scope per RESEARCH.md O2 decision, explicitly deferred to Phase 8 installer-doc work.

---

_Verified: 2026-06-06T12:00:00Z_
_Verifier: Claude (gsd-verifier)_

---
phase: 11-senior-persona-overhaul
verified: 2026-06-11T00:00:00Z
status: human_needed
score: 9/10 must-haves verified (1 requires human prose-judgment)
overrides_applied: 0
human_verification:
  - test: "Spot-review senior depth actually landed across all 16 roles (long-term experience + forward-thinking woven in place)"
    expected: "Each role's Responsibilities encode forward-thinking (anticipate downstream consequences); Hard limits encode hard-won experience (failure modes a junior misses); no new capability added, no new section, caveman voice punchy throughout the body"
    why_human: "No guard can score persona sophistication — only mechanical caveman-preserved + size + voice are checkable; prose judgment requires a human reviewer"
  - test: "Spot-review senior BA prose quality in ba-pm.md, definition-of-ready.md, and 07-backlog-refinement.md"
    expected: "ba-pm Responsibilities read as a senior BA: INVEST judgment woven in, measurable acceptance criteria required (not 'works'/'looks right'), measurable NFR triggers mandated; DoR is terse but substantively rigorous; workflow 07 ceremony reflects senior refinement practice; no Phase-12 executability"
    why_human: "Prose rigor is judgment, not grep-able; mechanical checks confirm presence of INVEST/measurable keywords and DoR pointer but cannot evaluate quality"
  - test: "Confirm WR-05 closure wording in all four tracking docs reads as factual (not fabricated)"
    expected: "PROJECT.md, STATE.md, v1.2-SDLC-COVERAGE-AUDIT.md, RETROSPECTIVE.md each say the grant was dropped Phase 8, guarded Phase 10, re-verified Phase 11; GAP-2 row in the audit correctly describes in-place senior deepening / no new section / terse caveman = token economy"
    why_human: "Wording quality and factual accuracy of the narrative closure is a judgment call, not a boolean check"
---

# Phase 11: Senior Persona Overhaul — Verification Report

**Phase Goal:** Deepen every one of the 16 role prompts to senior judgment IN PLACE (no new section added; single `One job` and scope unchanged; terse caveman voice preserved as the token-economy mechanism — flat-or-smaller bytes), deepen the business-analysis persona (ba-pm) to senior with PERS-02 BA rigor (INVEST tickets, testable+measurable Given/When/Then, measurable-NFR triggers) across ba-pm.md + the backlog-refinement workflow + definition-of-ready checklist + ticket-ready packet, and retire the WR-05 spawn-grant debt (PERS-03 — verify guard_wr05 passes + close the trace honestly).
**Verified:** 2026-06-11T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 16 role files have exactly one `## One job` and one `## Caveman prompt` header | VERIFIED | Mechanical check: every role returns `one_job=1 caveman=1` from `grep -c` |
| 2 | `agents-md-scribe.md` has NO `Follow the 12 coding rules` footer; all other 15 roles carry it | VERIFIED | `grep -q 'Follow the 12 coding rules'` false for scribe, true for all 15 others |
| 3 | All 16 role files are flat-or-smaller vs their per-file byte ceilings (`guard_role_size` GREEN) | VERIFIED | `sh scripts/check-foundation-guards.sh` exits 0; ba-pm at 3291B triggers WARN (approaching 3075B ceiling) but is below FAIL ceiling of 3294B; all others within their ceilings |
| 4 | `guard_voice` scans all 16 roles and reports GREEN — no caveman markers in clear-voice bodies | VERIFIED | guard output: `PASS voice: clear-voice surfaces free of caveman markers`; no false positives on orchestrator `/grug` or agents-md-scribe voice-meta lines |
| 5 | `guard_caveman_preserved` reports GREEN — every role has a non-empty Caveman prompt block with at least 1 caveman marker | VERIFIED | guard output: `PASS caveman: all 16 roles keep a non-empty markered caveman prompt block` |
| 6 | PERS-02 BA layer: INVEST present in DoR hub and ba-pm.md; measurable-NFR rigor present; Given/When/Then prose line kept; no Phase-12 BDD leakage | VERIFIED | `grep -qi invest` true in both; `grep -qi measurable` true in DoR; `grep -q 'Given/When/Then'` true; `grep -qi 'three amigos\|example mapping'` false across DoR + workflow 07 + ba-pm |
| 7 | DoR hub, ba-pm.md, and 07-backlog-refinement.md all carry the `definition-of-ready.md` pointer; ticket-ready-packet stays field-for-field aligned | VERIFIED | All three pointer checks true; DoR has 10 bullets, packet has 11 `<!-- DoR: -->` comments (1 benign duplicate on the Ticket ID header / blocker field pair — see note) |
| 8 | guard_wr05 GREEN post-rewrite (PERS-03 regen-safety): no spawn grant in packaging-template frontmatters; explanatory prose preserved | VERIFIED | guard output: `PASS WR-05: no spawn grant in frontmatter`; direct grep confirms no `Agent`/`Task` in allowed-tools; `spawn`/`sub-agent` prose present in subagent.frontmatter.md |
| 9 | WR-05 debt marker closed (retired/resolved/closed) in all four tracking docs; GAP-2 row reconciled to D-11 reframe; no obsolete "what good looks like" phrase | VERIFIED | All four docs mention WR-05 in retired/resolved/closed wording; `grep -qi 'what good looks like' v1.2-SDLC-COVERAGE-AUDIT.md` returns nothing |
| 10 | Senior depth actually landed across 16 roles (long-term experience + forward-thinking woven in existing sections; no new capability; no new section; caveman body punchy) | HUMAN NEEDED | Mechanical guards confirm structural invariants; prose judgment requires human review (see Human Verification section) |

**Score:** 9/10 truths mechanically verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/roles/agents-md-scribe.md` | Senior Scribe persona; rule-ownership (no footer); voice-meta lines present | VERIFIED | 3689B, one_job=1, caveman=1, no 12-rules footer |
| `agent-factory/roles/architect-design.md` | Senior architect persona | VERIFIED | 3420B, one_job=1, caveman=1, footer present |
| `agent-factory/roles/ba-pm.md` | Senior BA/PM persona + PERS-02 BA judgment; DoR pointer | VERIFIED | 3291B (WARN level, below FAIL 3294B), INVEST present, DoR pointer present |
| `agent-factory/roles/brownfield-mapper.md` | Senior brownfield-mapper persona | VERIFIED | 2348B, one_job=1, caveman=1 |
| `agent-factory/roles/compliance-officer.md` | Senior compliance persona; clear-voice compliance lines | VERIFIED | 3929B, one_job=1, caveman=1 |
| `agent-factory/roles/factory-coach.md` | Senior factory-coach persona | VERIFIED | 3235B, one_job=1, caveman=1 |
| `agent-factory/roles/greenfield-mapper.md` | Senior greenfield-mapper persona | VERIFIED | 2526B, one_job=1, caveman=1 |
| `agent-factory/roles/incident-responder.md` | Senior incident-responder persona; clear-voice incident lines | VERIFIED | 3202B, one_job=1, caveman=1 |
| `agent-factory/roles/installer.md` | Senior installer persona; clear-voice hard limits | VERIFIED | 3148B, one_job=1, caveman=1 |
| `agent-factory/roles/orchestrator.md` | Senior orchestrator; Kit vs state banner; Routing matrix; WIP/DoR gate; XL-split; workflow table; clear-voice safety limits | VERIFIED | 6661B (WARN level 6664 ceiling), all structural extras present; "Never merge / Never deploy" safety lines confirmed |
| `agent-factory/roles/qe-e2e.md` | Senior QE/E2E persona | VERIFIED | 3034B, one_job=1, caveman=1 |
| `agent-factory/roles/release-manager.md` | Senior release persona; clear-voice human deploy-gate | VERIFIED | 3886B, one_job=1, caveman=1 |
| `agent-factory/roles/security-nfr.md` | Senior security/NFR persona; clear-voice security lines | VERIFIED | 4326B, one_job=1, caveman=1 |
| `agent-factory/roles/software-engineer.md` | Senior engineer persona; clear-voice no-fake-results limit | VERIFIED | 3128B, one_job=1, caveman=1 |
| `agent-factory/roles/system-analyst.md` | Senior system-analyst persona | VERIFIED | 2638B, one_job=1, caveman=1 |
| `agent-factory/roles/uat-planner.md` | Senior UAT-planner persona | VERIFIED | 2968B, one_job=1, caveman=1 |
| `agent-factory/checklists/definition-of-ready.md` | INVEST + measurable-NFR DoR hub; Given/When/Then prose line; terse | VERIFIED | INVEST line 13; measurable NFR line 16; Given/When/Then line 14; no Phase-12 BDD |
| `agent-factory/workflows/07-backlog-refinement.md` | Senior refinement ceremony; points to DoR; Phase-12 seam clean | VERIFIED | DoR pointer present; no Three Amigos / Example Mapping |
| `agent-factory/handoffs/ticket-ready-packet.md` | 1:1 DoR-comment field alignment | VERIFIED | 11 `<!-- DoR: -->` comments vs 10 DoR bullets; 1 benign duplicate (Ticket ID header + dedicated blocker field both map to "no major unresolved blocker") — every DoR check covered |
| `scripts/check-foundation-guards.sh` | guard_voice (all 16 + refined markers), guard_caveman_preserved, guard_role_size; all GREEN | VERIFIED | All 6 guards GREEN; ROLE_FILES lists all 16 roles; `_role-switch-protocol.md` excluded |
| `scripts/check-foundation-guards.test.sh` | Fail-proof: sanded-caveman (D-06 RED) + oversized-role (D-07 RED) + expanded GUARD_INPUTS; exits 0 | VERIFIED | `ALL CHECKS PASSED`; sanded-caveman fixture passes; oversized-role fixture passes; smoke GREEN |
| `.planning/PROJECT.md` | WR-05 marker closed (retired) | VERIFIED | Line 134: "WR-05 retired (Phase 11/D-10)" wording present |
| `.planning/STATE.md` | WR-05 tech-debt entry closed | VERIFIED | "WR-05 retired" language present |
| `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` | WR-05 observation resolved; GAP-2 row reconciled to D-11 | VERIFIED | Line 44 resolved; line 170 describes in-place senior deepening / no new section / token economy |
| `.planning/RETROSPECTIVE.md` | WR-05 note closed | VERIFIED | Line 25 reads "Now closed" with factual chain |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ba-pm.md` + `07-backlog-refinement.md` | `agent-factory/checklists/definition-of-ready.md` | Single-source pointer (existing; deepening rides it) | VERIFIED | Both files contain `definition-of-ready.md` reference |
| `agent-factory/handoffs/ticket-ready-packet.md` | `agent-factory/checklists/definition-of-ready.md` | One `<!-- DoR: -->` per field (1:1 alignment) | VERIFIED | 11 DoR comments covering all 10 DoR checks (1 duplicated on blocker, benign) |
| `guard_wr05` | 2 packaging templates + 2 adapters frontmatter | Two frontmatter-only EREs (token only, never prose word) | VERIFIED | `sh scripts/check-foundation-guards.sh` exits 0; guard_wr05 PASS line confirmed |
| `guard_caveman_preserved` | 16 role files | awk fence-counting (inverse of guard_voice) + VOICE_MARKERS assert | VERIFIED | GREEN on clean tree; fail-proof harness proves RED on sanded role |
| `guard_role_size` | 16 role files | Per-file-relative two-tier WARN/FAIL byte ceiling, hard-coded constants | VERIFIED | GREEN on clean tree (ba-pm WARN, not FAIL); fail-proof harness proves RED on oversized role |

---

### Data-Flow Trace (Level 4)

Not applicable. This phase produces markdown role-prompt files and POSIX-sh guard scripts. There are no data-rendering components, APIs, or dynamic-data paths to trace.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Foundation guards all GREEN over clean tree | `sh scripts/check-foundation-guards.sh` | Exit 0; ALL CHECKS PASSED; 6 guards GREEN (1 WARN on ba-pm size, not FAIL) | PASS |
| Fail-proof harness proves each new guard can fail RED | `sh scripts/check-foundation-guards.test.sh` | Exit 0; ALL CHECKS PASSED; sanded-caveman RED, oversized-role RED, smoke GREEN | PASS |
| Node structure validator passes | `VALIDATE_KIT_ROOT="$(pwd)" node scripts/validate-agent-factory.mjs` | Exit 0; ALL CHECKS PASSED | PASS |

---

### Probe Execution

No phase-declared probes. The three behavioral spot-checks above cover the full mechanical verification surface.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PERS-01 | 11-01, 11-02, 11-03, 11-04 | Every role prompt deepened to senior judgment in place; caveman voice preserved; verified by 3 guards | VERIFIED (mechanical) + HUMAN NEEDED (prose depth) | All 3 guards GREEN; 16 roles structurally correct; prose judgment deferred to human review |
| PERS-02 | 11-03 | BA persona + workflow deepened to senior level; INVEST, measurable NFRs, DoR closes handoff | VERIFIED (mechanical) + HUMAN NEEDED (prose quality) | INVEST/measurable present; DoR pointer chain intact; no Phase-12 BDD leakage |
| PERS-03 | 11-05 | Packaging templates carry NO spawn grant; WR-05 retired in trace | VERIFIED | guard_wr05 GREEN; 4 tracking docs show retired/resolved/closed |

---

### Anti-Patterns Found

The following were identified during review (from 11-REVIEW.md, pre-existing code review, advisory only):

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `agent-factory/roles/agents-md-scribe.md` | 40 | "other **14** roles" — stale count, should be 15 | INFO | No guard catches this; purely a stale number in a comment-like prose line; does not affect behavior |
| `agent-factory/roles/orchestrator.md` | 59 | `compliance->` missing space before `->` in routing matrix | INFO | Cosmetic only; fenced code block, not parsed |
| `scripts/check-foundation-guards.sh` | 268 | `guard_caveman_preserved` CAVEMAN_MARKERS includes `^You\b` — a sanded block that keeps only the `You are <Role>.` opener still passes; full professional prose body escapes the guard | WARNING | Guard false-negative edge case; clean tree passes today; guard_role_size is partial backstop but professional prose can be shorter than terse caveman |
| `scripts/check-foundation-guards.sh` | 88 | `guard_wr05` WR05_ARRAY pattern misses `- "Agent"` (quoted YAML array item) | WARNING | Guard false-negative edge case; templates currently spawn-free so no active bypass; gap in mechanical coverage |
| `scripts/check-foundation-guards.sh` | 216-221 | `guard_voice` silently drops file tail if `## Caveman prompt` fence is malformed (unclosed fence → skip never resets) | WARNING | Guard false-negative edge case; all current role files have correct fences; only matters if a future edit malforms a fence |
| `scripts/check-foundation-guards.test.sh` | 182-184, 224-226 | Missing-file test cases assert bare filename token shared by three guards — test could pass via wrong guard's finding | WARNING | Weak test attribution; does not affect production guards; advisory only |
| `agent-factory/workflows/07-backlog-refinement.md` | 9 | "grug keep the larder full" caveman line in workflow body — unguarded by guard_voice (workflows not in scan set) | INFO | Intentional brand wink in non-safety context; no safety line affected |

**Debt marker gate:** No `TBD`, `FIXME`, or `XXX` markers found in phase-modified files.

The four WARNINGs are guard false-negative edge cases documented in the pre-existing 11-REVIEW.md (0 BLOCKERS, 4 WARNINGs advisory). They describe potential future bypass paths, not current failures. The clean tree passes all guards today. These findings do not block the phase goal.

---

### Human Verification Required

#### 1. Senior Depth Prose Review (16 roles)

**Test:** Read each of the 16 role files; for each, check that Responsibilities encode forward-thinking (anticipating what breaks two handoffs downstream) and Hard limits encode hard-won experience (failure modes a junior misses). Confirm no new section was added, `One job` text is unchanged, no new capability was introduced, and the caveman block + body remain punchy.

**Expected:** Each role reads as a senior practitioner. Example signals: ba-pm says "a ticket only a long chain delivers is two tickets hiding"; software-engineer says "the test skipped now is the regression someone debugs later"; orchestrator says "urgency is the moment the gate matters most." The judgment is woven into existing sections, not enumerated in a new block.

**Why human:** No guard can score persona sophistication. `guard_caveman_preserved` + `guard_voice` + `guard_role_size` confirm structure + voice + size, but cannot assess whether the judgment is actually senior or merely reorganized.

#### 2. Senior BA Prose Quality Review

**Test:** Read `agent-factory/roles/ba-pm.md`, `agent-factory/checklists/definition-of-ready.md`, and `agent-factory/workflows/07-backlog-refinement.md`. Verify: (a) ba-pm Responsibilities read as senior BA judgment — INVEST-shaped stories required, acceptance criteria described as testable and measurable with examples, NFR triggers mandated to carry measurable targets; (b) the DoR is substantively rigorous (not just keyword-bearing) while staying terse; (c) workflow 07 deepens refinement ceremony with senior BA cadence and leaves a clean seam for Phase 12's Three Amigos substep; (d) no Phase-12 executability present anywhere.

**Expected:** The prose quality is genuinely higher than a junior BA role description. The DoR's line "a number, a state, or an observable outcome, never 'works'/'looks right'" exemplifies the right level of specificity. The NFR line "not 'fast'/'secure'" is a concrete anti-pattern call-out.

**Why human:** Prose rigor is judgment, not grep-able. Mechanical checks confirm keyword presence (INVEST, measurable) and structural pointers, but cannot evaluate whether the depth is substantive.

#### 3. WR-05 Closure Wording Review

**Test:** Read WR-05 entries in `.planning/PROJECT.md` line 134, `.planning/STATE.md` around line 132/207, `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` lines 44 and 170, `.planning/RETROSPECTIVE.md` line 25. Confirm each closure cites a factual chain (grant dropped Phase 8, guard added Phase 10, re-verified Phase 11) and the GAP-2 row at line 170 describes in-place senior deepening / no new section / terse caveman = token economy (the D-11 reframe), not the obsolete "what good looks like" mechanism.

**Expected:** All four entries read as closed/retired with factual evidence, not fabricated. The explanatory "spawn"/"sub-agent" prose in `agent-factory/packaging/subagent.frontmatter.md` is still present (documents why there is no spawn tool).

**Why human:** The factual accuracy and wording quality of a narrative closure are judgment calls. The mechanical check confirmed the word "retired/resolved/closed" is present and the obsolete phrase is gone; whether the surrounding narrative is honest and complete requires reading.

---

### Gaps Summary

No gaps block the phase goal. All mechanical checks pass:

- `sh scripts/check-foundation-guards.sh` exits 0 (6 guards GREEN)
- `sh scripts/check-foundation-guards.test.sh` exits 0 (ALL CHECKS PASSED)
- `VALIDATE_KIT_ROOT="$(pwd)" node scripts/validate-agent-factory.mjs` exits 0

Three human verification items remain — the prose-judgment surface that no guard can check. These are expected for a persona-deepening phase and were called out in the 11-VALIDATION.md before execution.

**Minor note — ba-pm size:** ba-pm.md is at 3291B, triggering the WARN threshold (3075B) but below the FAIL ceiling (3294B, its explicit BA-headroom ceiling). This is the expected behavior — the guard correctly warns that ba-pm is approaching its ceiling, which is 3B below the FAIL line. This is not a gap.

**Minor note — DoR/packet count:** The ticket-ready-packet has 11 `<!-- DoR: -->` comments vs 10 DoR bullets. The "no major unresolved blocker" check maps to both the `## Ticket ID` header (as a context note) and a dedicated `## No major unresolved blocker` field. Every DoR check is covered; no DoR check is missing a packet field.

**Pre-existing review warnings (non-blocking):** The 11-REVIEW.md identified 4 WARNING-level guard false-negative edge cases (WR-01 through WR-04). These are guard coverage gaps for future mutation scenarios, not current failures. The code review found 0 blockers and ruled the phase content "issues advisory, non-blocking." These findings do not require closure before declaring this phase complete.

---

_Verified: 2026-06-11T00:00:00Z_
_Verifier: Claude (gsd-verifier)_

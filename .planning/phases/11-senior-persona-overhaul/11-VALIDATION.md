---
phase: 11
slug: senior-persona-overhaul
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-10
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: 11-RESEARCH.md § Validation Architecture. This phase *ships* mechanical
> verification, so the testable surface is unusually large; the residual is
> prose-judgment (senior depth) that no guard can check.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | POSIX-sh fail-proof harness (no external test runner — npm deps Out of Scope) |
| **Config file** | none — scripts are self-contained |
| **Quick run command** | `sh scripts/check-foundation-guards.sh` |
| **Full suite command** | `sh scripts/check-foundation-guards.test.sh` |
| **Estimated runtime** | ~2–5 seconds (read-only greps + a hermetic mirror-and-mutate harness) |

---

## Sampling Rate

- **After every task commit:** Run `sh scripts/check-foundation-guards.sh` (read-only gate; exit 0 = all green). Must stay GREEN after every role rewrite and every guard edit.
- **After every plan wave:** Run `sh scripts/check-foundation-guards.test.sh` (proves each new guard fails RED on a planted violation + smoke-green on the real tree).
- **Before `/gsd-verify-work`:** Both scripts green **AND** a human/spot review of senior depth across the 16 roles (the prose-judgment surface no guard can check).
- **Max feedback latency:** ~5 seconds.

---

## Per-Task Verification Map

> Task IDs are assigned during planning. The planner MUST fill one row per task,
> mapping it to the requirement and the automated command below. Rows seeded from
> the research test-map; refine to the actual plan/wave/task numbering.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | PERS-01 | T-11-01 (false-green gate) | All 16 roles free of caveman markers in clear-voice body | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_voice`, VOICE_FILES expanded + markers refined) | ✅ guard exists; ❌ expansion = this phase | ⬜ pending |
| TBD | TBD | TBD | PERS-01 | T-11-01 | Every role keeps a non-empty `## Caveman prompt` block with ≥1 marker | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_caveman_preserved`) | ❌ NEW guard | ⬜ pending |
| TBD | TBD | TBD | PERS-01 | T-11-01 | No role file bloats past its ceiling | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_role_size`) | ❌ NEW guard | ⬜ pending |
| TBD | TBD | TBD | PERS-01 | T-11-01 | Each guard provably fails RED on a sanded/oversized role | mechanical | `sh scripts/check-foundation-guards.test.sh` (new fixtures) | ❌ 2 new fixtures + expanded voice case | ⬜ pending |
| TBD | TBD | TBD | PERS-01 | — | One job / contract sections / pointer discipline / AGENTS.md footer preserved | manual (prose-judgment) | human/spot review per role | n/a | ⬜ pending |
| TBD | TBD | TBD | PERS-01 | — | Senior depth (long-term experience + forward-thinking) actually landed | manual (prose-judgment) | human/spot review per role | n/a | ⬜ pending |
| TBD | TBD | TBD | PERS-02 | — | INVEST + measurable-NFR gates present in `definition-of-ready.md`; `ba-pm.md` + workflow 07 point to it | mechanical-ish + manual | `grep -l definition-of-ready.md` pointer check + human review | partial | ⬜ pending |
| TBD | TBD | TBD | PERS-02 | — | DoR ↔ `ticket-ready-packet.md` stay field-for-field aligned | manual | spot-check / optional field-count diff | n/a | ⬜ pending |
| TBD | TBD | TBD | PERS-03 | T-11-02 (regen re-arms spawn) | No spawn grant in template/adapter frontmatter after the rewrite | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_wr05`) | ✅ guard exists + PASSES — re-run is the test | ⬜ pending |
| TBD | TBD | TBD | PERS-03 | — | WR-05 marker closed in PROJECT/STATE/audit/RETRO | doc-check | `grep -n "WR-05" .planning/PROJECT.md .planning/STATE.md ...` shows retired wording | manual diff | ⬜ pending |
| TBD | TBD | TBD | (SC4) | — | Adapters stay pointer-sized (single-source) | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_adapter_size`) | ✅ PASSES for free | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `guard_caveman_preserved` added to `scripts/check-foundation-guards.sh` — covers PERS-01 (D-06)
- [ ] `guard_role_size` added to `scripts/check-foundation-guards.sh` — covers PERS-01 (D-07); thresholds locked per Open Q1
- [ ] `guard_voice` `VOICE_FILES` expanded to all 16 + `VOICE_MARKERS` refined for the 3 verified false positives (`/grug`, Scribe "grug voice" meta-lines) — covers PERS-01 (D-05)
- [ ] `check-foundation-guards.test.sh` fixtures: a sanded-caveman role (D-06 RED), an oversized role (D-07 RED), and the expanded-voice scan — add the not-yet-mirrored roles to `GUARD_INPUTS`
- [ ] No new framework install needed (POSIX sh; the harness already exists)

*Note: "Wave 0" here means the guard/harness scaffolding the rewrite is checked against. Ship-GREEN discipline (Phase 10) means guards are authored after the rewrite is clean, then carry a planted-violation proof.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Senior depth actually landed per role (long-term experience + forward-thinking judgment woven in place) | PERS-01 | No guard can score persona sophistication — only mechanical caveman-preserved + size + voice are checkable | Spot-review each of the 16 roles: judgment deepened in existing sections, `One job` unchanged, no new capabilities, no bloat |
| Senior BA prose quality (INVEST-shaped, testable+measurable acceptance, measurable NFRs, DoR rigor) | PERS-02 | Prose quality is judgment, not grep-able | Read `ba-pm.md`, `07-backlog-refinement.md`, `definition-of-ready.md`: rigor present, no Phase-12 BDD leakage (no Three Amigos / executable scenarios) |
| WR-05 marker reads as retired (not just present) | PERS-03 | Wording change, not a boolean | Diff PROJECT.md / STATE.md / audit / RETROSPECTIVE: markers say retired/closed, explanatory "spawn" prose kept |

---

## Validation Sign-Off

- [ ] All mechanical tasks map to a `check-foundation-guards.sh` / `.test.sh` command
- [ ] Sampling continuity: guard run after every task commit; harness after every wave
- [ ] Wave 0 covers the 3 guard changes + new fixtures
- [ ] No watch-mode flags (scripts are one-shot read-only)
- [ ] Feedback latency < 5s
- [ ] Both guard scripts ship GREEN; fail-proof harness proves each new guard goes RED
- [ ] Human/spot review of senior depth completed before verify
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

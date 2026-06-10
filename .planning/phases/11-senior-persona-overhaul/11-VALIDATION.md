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

> Task IDs assigned during planning (2026-06-10). Plan = the `NN` in `11-NN-PLAN.md`;
> Wave from each plan's frontmatter. Mechanical rows map to a guard command; prose-judgment
> rows are spot-review only (not faked as mechanical). Note: the all-16 mechanical guards
> are AUTHORED in Plan 11-04 (Wave 2) per ship-GREEN discipline, but they VERIFY the role
> rewrites that land in Plans 11-01/02/03 (Wave 1) — hence two plan refs on the rewrite rows.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 11-04-T1 | 11-04 (verifies 11-01/02/03) | 2 | PERS-01 | T-11-01a (false-RED gate) | All 16 roles free of caveman markers in clear-voice body | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_voice`, VOICE_FILES all 16 + markers refined) | ⬜ pending |
| 11-04-T1 | 11-04 (verifies 11-01/02/03) | 2 | PERS-01 | T-11-01b (false-green gate) | Every role keeps a non-empty `## Caveman prompt` block with ≥1 marker | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_caveman_preserved`) | ⬜ pending |
| 11-04-T2 | 11-04 (verifies 11-01/02/03) | 2 | PERS-01 | T-11-08 (flat/tautological ceiling) | No role file bloats past its per-file ceiling | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_role_size`) | ⬜ pending |
| 11-04-T3 | 11-04 | 2 | PERS-01 | T-11-01b | Each new guard provably fails RED on a sanded/oversized role | mechanical | `sh scripts/check-foundation-guards.test.sh` (sanded-caveman + oversized-role fixtures) | ⬜ pending |
| 11-01-T1/T2, 11-02-T1/T2, 11-03-T1 | 11-01, 11-02, 11-03 | 1 | PERS-01 | — | One job / contract sections / pointer discipline / AGENTS.md footer preserved | manual (prose-judgment) + grep | `grep -c '^## One job'` / `grep -c '^## Caveman prompt'` per role + spot review | ⬜ pending |
| 11-01-T1/T2, 11-02-T1/T2, 11-03-T1 | 11-01, 11-02, 11-03 | 1 | PERS-01 | — | Senior depth (long-term experience + forward-thinking) actually landed | manual (prose-judgment) | human/spot review per role | ⬜ pending |
| 11-03-T1, 11-03-T2 | 11-03 | 1 | PERS-02 | — | INVEST + measurable-NFR gates present in `definition-of-ready.md`; `ba-pm.md` + workflow 07 point to it | mechanical-ish + manual | `grep -qi invest` + `grep -q definition-of-ready.md` pointer check + human review | ⬜ pending |
| 11-03-T2 | 11-03 | 1 | PERS-02 | T-11-05 (DoR↔packet desync) | DoR ↔ `ticket-ready-packet.md` stay field-for-field aligned | manual + grep | `<!-- DoR:` field-count vs DoR bullet-count spot-check | ⬜ pending |
| 11-05-T1 | 11-05 | 3 | PERS-03 | T-11-02 (regen re-arms spawn) | No spawn grant in template/adapter frontmatter after the rewrite (LAST check) | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_wr05`) | ⬜ pending |
| 11-05-T2 | 11-05 | 3 | PERS-03 | T-11-09 (dishonest "retired") | WR-05 marker closed in PROJECT/STATE/audit/RETRO + GAP-2 row L170 reconciled | doc-check | `grep -n 'WR-05' .planning/{PROJECT,STATE}.md ...` shows retired wording; no obsolete GAP-2 phrase | ⬜ pending |
| (free) | n/a (untouched by rewrite) | — | (SC4) | — | Adapters stay pointer-sized (single-source) | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_adapter_size`) | ✅ passes for free |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `guard_caveman_preserved` added to `scripts/check-foundation-guards.sh` — covers PERS-01 (D-06) — **Plan 11-04 Task 1**
- [ ] `guard_role_size` added to `scripts/check-foundation-guards.sh` — covers PERS-01 (D-07); per-file ceilings locked (orchestrator 7041/6664, ba-pm headroom 3294/3075, rest +12%/+6% off the 2026-06-10 baseline) — **Plan 11-04 Task 2**
- [ ] `guard_voice` `VOICE_FILES` expanded to all 16 + `VOICE_MARKERS` refined for the 3 verified false positives (`/grug`, Scribe "grug voice" meta-lines) — covers PERS-01 (D-05) — **Plan 11-04 Task 1 (refinement FIRST, then expand)**
- [ ] `check-foundation-guards.test.sh` fixtures: a sanded-caveman role (D-06 RED), an oversized role (D-07 RED), and the expanded `GUARD_INPUTS` (all 16 roles) — **Plan 11-04 Task 3**
- [ ] No new framework install needed (POSIX sh; the harness already exists)

*Note: "Wave 0" here means the guard/harness scaffolding the rewrite is checked against. Ship-GREEN discipline (Phase 10) means guards are authored after the rewrite is clean (so the guard authoring is Wave 2 / Plan 11-04, gated on the Wave-1 rewrite landing), then carry a planted-violation proof.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Senior depth actually landed per role (long-term experience + forward-thinking judgment woven in place) | PERS-01 | No guard can score persona sophistication — only mechanical caveman-preserved + size + voice are checkable | Spot-review each of the 16 roles: judgment deepened in existing sections, `One job` unchanged, no new capabilities, no bloat |
| Senior BA prose quality (INVEST-shaped, testable+measurable acceptance, measurable NFRs, DoR rigor) | PERS-02 | Prose quality is judgment, not grep-able | Read `ba-pm.md`, `07-backlog-refinement.md`, `definition-of-ready.md`: rigor present, no Phase-12 BDD leakage (no Three Amigos / executable scenarios) |
| WR-05 marker reads as retired (not just present) | PERS-03 | Wording change, not a boolean | Diff PROJECT.md / STATE.md / audit / RETROSPECTIVE: markers say retired/closed, explanatory "spawn" prose kept; GAP-2 row L170 reads as the D-11 reframe |

---

## Validation Sign-Off

- [ ] All mechanical tasks map to a `check-foundation-guards.sh` / `.test.sh` command
- [ ] Sampling continuity: guard run after every task commit; harness after every wave
- [ ] Wave 0 covers the 3 guard changes + new fixtures (all in Plan 11-04)
- [ ] No watch-mode flags (scripts are one-shot read-only)
- [ ] Feedback latency < 5s
- [ ] Both guard scripts ship GREEN; fail-proof harness proves each new guard goes RED
- [ ] Human/spot review of senior depth completed before verify
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

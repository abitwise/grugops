---
phase: 6
slug: validation-brand-dogfood
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-03
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Honest framing (from RESEARCH.md §Validation Architecture):** formal Nyquist sampling
> theory does not naturally apply to *asserting file/section/config structure* — there is no
> continuous signal being sampled. For this phase, "validation" means **the validator's own
> GOOD/BAD fixture coverage + self-validation against grugops's frozen tree**, plus the
> dogfood as the end-to-end behavioral proof.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | POSIX `sh` harness (the kit's house idiom) + `node` invocation — NOT a third-party runner |
| **Config file** | none — bare `node scripts/validate-agent-factory.mjs` and `sh scripts/validate.test.sh` (no `package.json`, D-45) |
| **Quick run command** | `node scripts/validate-agent-factory.mjs` (validate grugops's own tree — should be green) |
| **Full suite command** | `sh scripts/validate.test.sh` (GOOD + BAD fixtures + self-validate) |
| **Estimated runtime** | ~3 seconds (stdlib file reads + a handful of fixture trees) |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/validate-agent-factory.mjs` (validator on its own tree stays green) + a `grep` for stray `/grug` (non-`/grugops`).
- **After every plan wave:** Run `sh scripts/validate.test.sh` (full GOOD/BAD self-test).
- **Before `/gsd-verify-work`:** validator green on grugops's tree AND on the dogfood sample tree; `validate.test.sh` green; all five examples present with correct banners; brand collateral present and `/grug`-free; dual-path parity checklist filled (agent-proven columns real, human columns marked pending).
- **Max feedback latency:** ~3 seconds.

---

## Per-Task Verification Map

> Requirement-level rows derived from RESEARCH.md. Task-level IDs (`6-NN-NN`) are bound by the
> planner in step 8; each plan task inherits the command for its requirement. `File Exists` = ❌ W0
> because every deliverable path is net-new (additive, never-overwrite).

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| VAL-01 | Validator passes on a valid tree | smoke | `node scripts/validate-agent-factory.mjs` (green on own tree) | ❌ W0 | ⬜ pending |
| VAL-01 | Validator FAILS on each broken tree with the right finding | unit | `sh scripts/validate.test.sh` (BAD fixtures) | ❌ W0 | ⬜ pending |
| VAL-01 | `--strict` promotes warnings to errors | unit | `validate.test.sh` case running `--strict` on a warning-only fixture, expect ≠0 | ❌ W0 | ⬜ pending |
| VAL-01 | Vacuous-green on zero-ticket seeded state (D-43) | smoke | `node scripts/validate-agent-factory.mjs` (own tree has zero tickets) | ❌ W0 | ⬜ pending |
| EX-01 | Five example files exist with correct real/illustrative banners | structural | `ls examples/0{1..5}-*.md` + `grep -l 'Illustrative run' / 'Real run'` | ❌ W0 | ⬜ pending |
| EX-01 | No literal `/grug` (non-`/grugops`) in examples | structural | `! grep -rE '/grug([^o]\|$)' examples/` | ❌ W0 | ⬜ pending |
| BRAND-01/02 | README/NOTICE/CONTRIBUTING/FAQ exist with the required blocks | structural | `grep -l 'Acknowledgements' README.md`; `test -f NOTICE CONTRIBUTING.md docs/faq.md` | ❌ W0 | ⬜ pending |
| BRAND-01/02 | No literal `/grug` in collateral (D-49) | structural | `! grep -rE '/grug([^o]\|$)' README.md docs/faq.md` | ❌ W0 | ⬜ pending |
| BRAND-03 | 5 SVGs exist, original-art palette only | structural | `ls brand/wordmark*.svg brand/icon.svg`; off-palette hex grep returns none | ❌ W0 | ⬜ pending |
| DOG-01 | Validator passes on the dogfood sample tree | smoke | `node scripts/validate-agent-factory.mjs` in the sample repo | ❌ W0 (live) | ⬜ pending |
| DOG-02 | Dual-path parity captured (sequential agent-run + CC human-runbook) | manual | side-by-side parity checklist in `examples/03-ticket-to-pr.md` + human runbook | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validate-agent-factory.mjs` — the validator itself (VAL-01)
- [ ] `scripts/validate.test.sh` — GOOD/BAD self-test harness (D-45), in the `guard.test.sh`/`install.test.sh` idiom
- [ ] `scripts/fixtures/good/` + `scripts/fixtures/bad-*/` — minimal fixture trees (one BAD mutation per finding)
- [ ] Framework install: **none needed** (Node 24.12.0 present; no `package.json`, D-45)

*The existing per-phase `check-structure.sh` harnesses and `guard.test.sh`/`install.test.sh` cover Phases 1–5; they are NOT modified (D-42 keeps them as historical gates).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plugin-cache repo-relative pointer resolution (D-31) | DOG-02 | Requires a live `/plugin marketplace add` + install in a real Claude Code session; an executor cannot honestly self-perform a marketplace install | Human runbook: install grugops via marketplace on the sample repo; confirm the wrapper's `agent-factory/roles/*.md` pointers resolve from the user's repo, not the broken plugin cache |
| Live PreToolUse hook firing (SAFE-02 mechanical guard) | DOG-02 | An executor cannot honestly simulate a real hook interception — fabrication-forbidden | Human runbook: attempt a guarded prod-deploy command in the sample repo; confirm the PreToolUse hook blocks it (exit 2 / deny) without the approval env var |
| Claude Code sub-agent spawn path | DOG-02 | Needs a live CC session with `settings.json` `agent:` + sub-agent spawn — out of an executor's honest reach | Human runbook: drive the same ticket through the CC sub-agent path; confirm same roles/handoffs/gate verdict as the captured sequential run (dual-path parity) |

*These three absorb the two Phase-5-deferred `05-HUMAN-UAT.md` items (D-31, SAFE-02) verbatim in intent, plus the CC-native dispatch half of DOG-02. They are the "human-pending" side of the D-38 honesty split.*

---

## Validation Sign-Off

- [ ] All tasks have an automated verify command or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (manual-only DOG-02 items justified above)
- [ ] Wave 0 covers all MISSING references (validator + self-test + fixtures)
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

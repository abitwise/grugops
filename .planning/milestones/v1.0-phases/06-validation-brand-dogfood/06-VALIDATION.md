---
phase: 6
slug: validation-brand-dogfood
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-03
audited: 2026-06-04
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

> Requirement-level rows derived from RESEARCH.md. Statuses below reflect the **post-execution
> audit (2026-06-04)** — every Wave-0 deliverable is now built; each automated command was
> re-run live by /gsd-validate-phase and recorded green.

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| VAL-01 | Validator passes on a valid tree | smoke | `node scripts/validate-agent-factory.mjs` (green on own tree) | ✅ | ✅ green (exit 0, `ALL CHECKS PASSED`) |
| VAL-01 | Validator FAILS on each broken tree with the right finding | unit | `sh scripts/validate.test.sh` (BAD fixtures) | ✅ | ✅ green (all BAD fixtures fail w/ right finding) |
| VAL-01 | `--strict` promotes warnings to errors | unit | `validate.test.sh` case running `--strict` on a warning-only fixture, expect ≠0 | ✅ | ✅ green (promotion proven) |
| VAL-01 | Vacuous-green on zero-ticket seeded state (D-43) | smoke | `node scripts/validate-agent-factory.mjs` (own tree has zero tickets) | ✅ | ✅ green (own tree bare + `--strict`) |
| EX-01 | Five example files exist with correct real/illustrative banners | structural | `ls examples/0{1..5}-*.md` + `grep -l 'Illustrative run' / 'Real run'` | ✅ | ✅ green (5 files; 2 Real, 3 Illustrative) |
| EX-01 | No literal `/grug` (non-`/grugops`) in examples | structural | `! grep -rE '/grug([^o]\|$)' examples/` (excl. grugbrain URL) | ✅ | ✅ green (clean) |
| BRAND-01/02 | README/NOTICE/CONTRIBUTING/FAQ exist with the required blocks | structural | `grep -l 'Acknowledgements' README.md`; `test -f NOTICE CONTRIBUTING.md docs/faq.md` | ✅ | ✅ green (all 4 present, Acknowledgements found) |
| BRAND-01/02 | No literal `/grug` in collateral (D-49) | structural | `! grep -rE '/grug([^o]\|$)' README.md docs/faq.md` (excl. grugbrain URL) | ✅ | ✅ green (clean) |
| BRAND-03 | 5 SVGs exist, original-art palette only | structural | `ls brand/wordmark*.svg brand/icon.svg`; off-palette hex grep returns none | ✅ | ✅ green (5 SVGs; only 4 locked hex) |
| DOG-01 | Validator passes on the dogfood sample tree | smoke | `VALIDATE_ROOT=<sample> node scripts/validate-agent-factory.mjs` | ✅ (live) | ✅ green (re-run live 2026-06-04 on `/tmp/grugops-dogfood-20260604-084625`, bare + `--strict`) |
| DOG-02 | Dual-path parity captured (sequential agent-run + CC human-runbook) | manual | side-by-side parity checklist in `examples/03-ticket-to-pr.md` + human runbook | manual-only | ⚠️ partial — sequential agent-proven (live sample git history); CC-native half **pending human** (9 cells), deferred to milestone-close UAT |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky/partial*

---

## Wave 0 Requirements

- [x] `scripts/validate-agent-factory.mjs` — the validator itself (VAL-01) — built, green
- [x] `scripts/validate.test.sh` — GOOD/BAD self-test harness (D-45), in the `guard.test.sh`/`install.test.sh` idiom — built, green
- [x] `scripts/fixtures/good/` + `scripts/fixtures/bad-*/` — minimal fixture trees (one BAD mutation per finding) — present
- [x] Framework install: **none needed** (Node 24.12.0 present; no `package.json`, D-45) — confirmed zero-package

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

- [x] All tasks have an automated verify command or a Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (manual-only DOG-02 items justified above)
- [x] Wave 0 covers all MISSING references (validator + self-test + fixtures)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-03 (plan-time — sign-off confirmed by gsd-plan-checker; Wave 0 builds during execution)
**Re-verified:** 2026-06-04 (post-execution audit by /gsd-validate-phase — all automated commands re-run live and green; DOG-02 CC-native half remains manual-only/pending-human, deferred to milestone-close UAT)

---

## Validation Audit 2026-06-04

| Metric | Count |
|--------|-------|
| Requirements audited | 7 (VAL-01, EX-01, BRAND-01, BRAND-02, BRAND-03, DOG-01, DOG-02) |
| Automated behaviors covered & green | 10 |
| Gaps found (MISSING automatable) | 0 |
| Tests generated | 0 (no gaps — every automatable behavior already had a passing command) |
| Manual-only (inherent, justified) | DOG-02 CC-native half (live CC session) — deferred to milestone-close UAT |

**Method:** State-A audit. Re-ran every automated command live — validator on own tree (bare + `--strict`), `validate.test.sh` full self-test, EX-01/BRAND structural greps, and DOG-01 validator live against the still-present out-of-repo sample tree (`/tmp/grugops-dogfood-20260604-084625`). All exited 0 / clean. No nyquist-auditor spawn was needed (no automatable gaps to fill). The only non-automated item, DOG-02's CC-native dispatch half, is inherently a live-Claude-Code action (marketplace install, plugin-cache pointer resolution, live hook firing, sub-agent spawn) — correctly classified manual-only per the D-38 honesty split and tracked for milestone-close UAT.

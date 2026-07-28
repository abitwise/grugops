---
phase: 4
slug: workflows-cadence-backpressure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-03
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **markdown-authoring** phase: validation is **structural / static**, mirroring
> the proven Phase-3 precedent (`.planning/phases/03-roles-agents-md-substrate/check-structure.sh`).
> No runtime test runner exists or is needed (D-18). The acceptance gate is a POSIX `sh`
> grep/wc/test harness that ships RED and goes green as the 14 workflow files land.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | POSIX `sh` + `grep`/`wc`/`test` harness (no runtime runner — D-18) |
| **Config file** | none — standalone script |
| **Quick run command** | `sh .planning/phases/04-workflows-cadence-backpressure/check-structure.sh` |
| **Full suite command** | same (single script; exit 0 = all PASS, exit 1 = ≥1 FAIL) |
| **Estimated runtime** | ~2 seconds |
| **Real Node validator** | `UNKNOWN - verify` — Phase-6 / VAL-01. Do NOT fabricate `node scripts/validate-agent-factory.mjs` here. |

---

## Sampling Rate

- **After every file authored:** Run the harness — the just-landed file's name / 10-section / section-order / cadence-tag checks flip green.
- **After every plan wave:** Full harness green for all files in that wave.
- **Before `/gsd-verify-work`:** Full harness green (all 14 present, 10 sections each in order, routing match, loop single-sourced in 05, cadence tags correct, SAFE-01 prose present, zero drift).
- **Max feedback latency:** ~2 seconds.

---

## Per-Task Verification Map

Each row maps a phase requirement to a concrete, static check in `check-structure.sh`. "Test Type" is `structural` (file/section/cross-file grep) because the deliverables are markdown, not executable code.

| Check ID | Req | Wave | Behavior to prove | Test Type | Automated Check (grep/wc/test) | Status |
|----------|-----|------|-------------------|-----------|--------------------------------|--------|
| V-01 | FLOW-01/02/03/04 | all | All 14 files exist with exact names | file-presence | `test -f agent-factory/workflows/<NN>-<name>.md` ×14; assert exactly 14 `*.md` (excl. `.gitkeep`); assert **no** `14-*.md` | ⬜ pending |
| V-02 | FLOW-05 | all | Each file carries the 10 template sections **in order** | section-order | per file `grep -nF` each of the 10 `## ` headings; assert line numbers strictly increasing | ⬜ pending |
| V-03 | FLOW-05 / D-27 | all | Minimal `kind: workflow` frontmatter | frontmatter | `grep -qF 'kind: workflow'` in every file; frontmatter block ≤ 3 fields | ⬜ pending |
| V-04 | D-20 | all | Filenames ↔ Orchestrator routing table match 1:1 | cross-file | every `0[0-9]\|1[0-3]-` name in `roles/orchestrator.md` has a matching `workflows/<name>`; no extra/missing | ⬜ pending |
| V-05 | GATE-01 | gate | Backpressure loop appears **once, in 05** | single-source | `grep -lF 'READY_FOR_HUMAN_REVIEW' workflows/*.md` == only `05-pr-quality-gate.md`; `05` has all 3 terminal tokens + 6 gate verbs (install/lint/typecheck/unit/build/e2e) + `self_fix_attempts` | ⬜ pending |
| V-06 | GATE-01 / D-26 | gate | `04` references `05`, does NOT restate the loop | single-source | `04-ticket-to-pr.md` contains `05-pr-quality-gate.md`; `04` does **not** contain `READY_FOR_HUMAN_REVIEW` | ⬜ pending |
| V-07 | GATE-01 | gate | No fabricated gate command | no-fabrication | `05` contains `UNKNOWN - verify` (commands pulled from AGENTS.md, not hard-coded) | ⬜ pending |
| V-08 | BOARD-03 | cadence | Scrum cadence + SPRINT format | cadence+format | `08`,`10` contain `cadence=scrum`; `08` references `plans/sprints/SPRINT-xx.md` + names Goal/Committed/Velocity/Burndown | ⬜ pending |
| V-09 | BOARD-02 | cadence | Kanban cadence works | cadence | `09-daily-sweep.md` references `plans/board.md` + `plans/metrics.md` + `memory-bank/60-progress.md` + `blocked_escalation_days`; cycle-time/WIP named | ⬜ pending |
| V-10 | FLOW-03 | cadence | Cadence tagging correct (08/10 scrum-only, single set) | cadence | `08`,`10` carry `cadence=scrum`; `07`,`09`,`11` declare "both"; **no** cadence suffix in any filename (D-25 single set) | ⬜ pending |
| V-11 | SAFE-01 | safety | Human-confirm prose in every merge/deploy-touching workflow | safety-presence | `04` has `autonomy=pr` + "never merge"; `05` has "recommendation"/human-review (no auto-merge); `12` has "named human"/"human-confirmed" + `production_requires_human_confirmation` | ⬜ pending |
| V-12 | D-24 | all | No invented/parallel names (drift guard) | drift | every cited handoff ∈ the 16-file frozen list; every cited column ∈ the 13-column list; every cited metric ∈ the 9-metric list | ⬜ pending |
| V-13 | FLOW-04 | enterprise | Blameless incident path | content | `13-incident.md` contains `incident-postmortem.md` + "blameless"/"never blames" | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.planning/phases/04-workflows-cadence-backpressure/check-structure.sh` — the full grep harness (V-01 … V-13), POSIX `sh` only, **ships RED first** (mirrors `03-roles-agents-md-substrate/check-structure.sh`). Covers FLOW-01..05, BOARD-02/03, GATE-01, SAFE-01.

*No framework install needed — POSIX `sh` is present. No `package.json` created (D-18 / VAL-01 constraint preserved). The real Node validator is Phase 6.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Voice discipline — clear voice in gate/stop/safety prose; light grug wink only in framing | D-27 | Tone is not grep-checkable beyond keyword presence | Human reads each workflow's gate/`Stop conditions`/safety prose: must be plain/professional; any wink confined to a `When to use` opener |
| Terse derivation — each file stays ~one screen, cites frozen names, invents no prescriptive procedure | D-24 | "Reads like one screen / invents nothing" is a judgment call | Human skims each file: middle sections cite real frozen names only; no invented step bodies; length ~one screen |
| Cadence-divergence readability where a shared workflow branches by cadence | D-25 | Inline `if cadence=scrum` note vs sub-flow is a stylistic call | Human confirms divergence is a single inline note/branch, never a duplicate file |

---

## Validation Sign-Off

- [ ] All 13 structural checks (V-01 … V-13) encoded in `check-structure.sh`
- [ ] Sampling continuity: harness re-run after every file (no 3 files authored without a green re-run)
- [ ] Wave 0 harness covers every Phase-4 requirement (FLOW-01..05, BOARD-02, BOARD-03, GATE-01, SAFE-01)
- [ ] No watch-mode flags (single-shot exit-code harness)
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter once the harness is authored and the per-requirement coverage is confirmed

**Approval:** pending

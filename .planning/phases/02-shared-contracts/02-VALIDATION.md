---
phase: 2
slug: shared-contracts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-02
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **This phase authors markdown I/O contracts — there is no code, build, or runtime.**
> Validation is therefore **structural**: file-existence, required-section/field
> presence, universal-header consistency, frontmatter `kind:`/`tier:` presence, the
> D-03 no-fake-data invariant, and cross-reference integrity. These are the same
> assertions the Phase-6 validator (VAL-01) will make. See `02-RESEARCH.md`
> `## Validation Architecture` for the full mapping.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — structural markdown checks via POSIX shell (`test`, `grep`) |
| **Config file** | none — no framework to install |
| **Quick run command** | `test -f <file> && grep -q '<required section/field>' <file>` (per file touched) |
| **Full suite command** | structural sweep over `agent-factory/handoffs/`, `agent-factory/checklists/`, `memory-bank/` (file-existence + required-section + frontmatter + no-fake-data) |
| **Estimated runtime** | < 5 seconds (file reads + greps only) |

---

## Sampling Rate

- **After every task commit:** `test -f` the file(s) the task created + `grep -q` each required section/field it must contain.
- **After every plan wave:** structural sweep over the directory that wave populated (existence + required-section + frontmatter `kind:`/`tier:` + `grep -L` for accidental fake data).
- **Before `/gsd-verify-work`:** full structural sweep green — all 36 required files exist, universal header is consistent across the 11 core handoffs, every checklist carries `tier:`, memory-bank seed is empty-but-shaped.
- **Max feedback latency:** < 5 seconds.

---

## Per-Task Verification Map

> Planner fills one row per task. `Test Type` is **structural** for this phase.
> `Automated Command` is a shell assertion (`test -f …`, `grep -q '…' …`, `grep -L '…' …`).
> `File Exists` reflects whether the asserted target is created within this phase
> (all targets are created here, so no Wave 0 stubs are required).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | HAND-01 | — / — | N/A (markdown contract) | structural | `test -f agent-factory/handoffs/universal-handoff.md && grep -q 'Ticket ID' agent-factory/handoffs/universal-handoff.md && grep -q 'Trace updates' agent-factory/handoffs/universal-handoff.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*No test framework to install — validation is structural shell assertion only.*

Existing infrastructure (POSIX `test`/`grep`) covers all phase requirements. No Wave 0 stub files are needed; every asserted target is itself a deliverable created during this phase.

---

## Success-Criteria → Validation Map

| SC | Success Criterion (ROADMAP) | Structural Check |
|----|------------------------------|------------------|
| SC1 | 11 core handoffs copy-paste usable + universal header carries Ticket ID + Trace updates | `test -f` each of the 11 core handoff files; `grep -q 'Ticket ID'` and `grep -q 'Trace updates'` in the universal header (and in each per-role file if header is inlined) |
| SC2 | 5 v2 handoffs exist | `test -f` release-handoff, incident-postmortem, retro-notes, refinement-notes, sprint-plan |
| SC3 | 10 checklists exist, lean/enterprise split clearly distinguished | `test -f` all 10 checklists + `00-index.md`; `grep -q 'tier:'` in each checklist frontmatter; index lists lean-vs-enterprise grouping |
| SC4 | Minimal memory-bank exists (00-index→80-glossary + 50-decisions/ ADR convention), each file small/single-purpose | `test -f` the 8 seed files + `50-decisions/ADR-template.md`; `grep -L` for fake rows/example ADRs (D-03); advisory size check (~< 40 lines) |
| SC5 | memory-bank seed states the working-memory contract | `grep -q` in `memory-bank/00-index.md` for: roles read on start, `60-progress.md` running plan-of-record kept by daily sweep, `50-decisions/` captures ADRs |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| §8 universal header + 5 v2 templates reproduced **verbatim** from spec | HAND-01, HAND-02 | Byte-faithful fidelity to spec text cannot be asserted by `grep` alone — a human/checker must diff against `agent_factory_builder_spec_v2.md` §8 | Diff each v2 template body against spec §8 (lines ~788-869); confirm no paraphrasing of section names or bullets |
| §9 all 10 checklist bodies reproduced **verbatim** | CHECK-01, CHECK-02 | Same — verbatim transcription is the contract; paraphrase breaks downstream consumers | Diff each checklist body against spec §9 (lines ~877-1000); confirm enterprise DoD is literally "All of lean DoD, plus: …" |
| Clear/professional voice (no grug caveman voice) on all contract files | — | Tone is a judgement call | Read-through; security/compliance/release files must be plain technical English |

---

## Validation Sign-Off

- [ ] All tasks have a structural `<automated>` shell assertion (no Wave 0 dependencies needed)
- [ ] Sampling continuity: no 3 consecutive tasks without an automated structural check
- [ ] Wave 0 covers all MISSING references *(N/A — no framework, no stubs)*
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

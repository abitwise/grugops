---
phase: 02-shared-contracts
plan: 04
subsystem: memory-bank
tags: [memory-bank, working-memory, adr, template, empty-but-shaped]
requires:
  - "Phase-1 house style (plans/metrics.md empty-but-shaped exemplar)"
  - "Plan 02-03 LOCKED index frontmatter convention (kind: index, no tier:)"
provides:
  - "memory-bank/ seed: 8 generic empty-but-shaped files + 50-decisions/ADR-template.md"
  - "00-index.md working-memory contract (read-on-start, 60-progress plan-of-record, 50-decisions ADRs)"
  - "ADR copy-target documenting the §5.A.7 format"
affects:
  - "Phase-4 bootstrap workflow (fills the bank per-project)"
  - "Phase-6 validator (checks memory-bank files exist; ADR-NNNN pattern not tripped)"
tech-stack:
  added: []
  patterns:
    - "Shared Pattern A — empty-but-shaped state file (# Title + _Updated:_ + FORMAT comment + stubs)"
    - "Shared Pattern D — 00-index orientation file (prose + map table)"
    - "kind: index frontmatter on the index file (D-14, reused from Plan 02-03)"
key-files:
  created:
    - memory-bank/00-index.md
    - memory-bank/10-project-brief.md
    - memory-bank/20-product.md
    - memory-bank/30-architecture.md
    - memory-bank/40-contributing.md
    - memory-bank/60-progress.md
    - memory-bank/70-runbook.md
    - memory-bank/80-glossary.md
    - memory-bank/50-decisions/ADR-template.md
  modified: []
decisions:
  - "Index frontmatter = kind: index (no tier:), reused identically from Plan 02-03 per D-14 decide-once"
  - "_Updated: <date>_ opener form (metrics.md style) applied to all 9 files"
  - "ADR-template.md gets kind: adr-template frontmatter (consistent with the bank's minimal-frontmatter convention; non-numeric name avoids the validator's ADR-NNNN pattern)"
  - "70-runbook.md production stubs carry the hard safety line: a human confirms deploy/rollback; agents never deploy to prod unattended"
metrics:
  duration: 4m
  completed: 2026-06-02
  tasks: 2
  files: 9
---

# Phase 02 Plan 04: Memory-Bank Seed Summary

The minimal memory-bank seed — 8 generic, project-agnostic, empty-but-shaped files plus a `50-decisions/ADR-template.md` copy-target — shipped as the user-facing kit template, with `00-index.md` stating the working-memory contract (roles read on start; `60-progress.md` is the running plan-of-record kept by the daily sweep; `50-decisions/` captures ADRs as made).

## What Was Built

**Task 1 — `00-index` (working-memory contract) + 7 seed files** (commit `5a5b401`)
- `00-index.md`: maps the 00→80 bank in a table and states the working-memory contract verbatim in intent (read-on-start, `60-progress.md` = plan-of-record kept by the daily sweep, `50-decisions/` = ADRs, index for one-read orientation). Carries `kind: index` frontmatter (the convention LOCKED in Plan 02-03 per D-14).
- `10-project-brief.md`, `20-product.md`, `30-architecture.md`, `40-contributing.md`, `60-progress.md`, `70-runbook.md`, `80-glossary.md`: each is `# Title` + `_Updated: <date>_` + a clear-voice `FORMAT — read before you ...` HTML comment carrying the one-line purpose/hint + section stubs. Generic, project-agnostic, zero fake data (D-03/D-04/D-10). Each comfortably small (12–34 lines, under the ~40 advisory cap).
- Runtime artifacts (`brownfield-map.md`, `greenfield-plan.md`) deliberately NOT seeded — they are Phase-3/4 outputs.

**Task 2 — `50-decisions/ADR-template.md` (copy-target, no example)** (commit `dbaab04`)
- Documents the §5.A.7 ADR format: `## Status` (with allowed values noted: proposed | accepted | deprecated | superseded by ADR-YYYY), `## Context`, `## Decision`, `## Alternatives`, `## Consequences`, `## Rollback`.
- Empty copy-target: title uses the literal `XXXX` placeholder, no example values, no filled-in decision, no numbered `ADR-000X` file. A clear-voice note explains that real ADRs are saved as `ADR-000X-<slug>.md` here.
- File named `ADR-template.md` (non-numeric) so it does NOT match the Phase-6 validator's `ADR-\d{4}` pattern. Existing `.gitkeep` preserved.

## Decisions Made

- **Index frontmatter = `kind: index`** (no `tier:`) — reused identically from Plan 02-03 per the LOCKED D-14 "decide once" rule, as instructed in the execution context.
- **`_Updated: <date>_` opener form** (the `plans/metrics.md` style, also used by the checklists index) applied consistently to all 9 files — resolves Pattern Map Open Decision 3.
- **`kind: adr-template` on the ADR file** — a tiny frontmatter consistent with the bank's minimal-frontmatter convention; the non-numeric filename (not the frontmatter) is what keeps it clear of the validator's `ADR-NNNN` pattern.
- **`70-runbook.md` carries the hard safety line** in its FORMAT comment: a human confirms a deploy or rollback; agents never deploy to production unattended — aligning the template stub with the project's mechanical prod-safety constraint.

## Deviations from Plan

None — plan executed exactly as written. No bugs, missing functionality, blocking issues, or architectural changes encountered (Rules 1–4 not triggered). This is a static-markdown, no-code plan; the threat register (T-02-10/11/12) was satisfied: zero example/PII data, non-numeric ADR filename, and the 00-index working-memory contract is present and asserted.

## Verification

Full-plan structural sweep (all pass):
- All 9 files exist: 8 seed files + `50-decisions/ADR-template.md`.
- Working-memory contract present in `00-index.md`: `grep -q '60-progress'` + `grep -qi 'daily sweep'` + `grep -q '50-decisions'` all pass.
- No numbered ADR (`! ls memory-bank/50-decisions/ | grep -Eq 'ADR-[0-9]{4}'`) and no runtime artifacts (`brownfield-map.md` / `greenfield-plan.md` absent).
- No-fake-data invariant across the whole bank (`! grep -rEq 'ABC-[0-9]{3}' memory-bank/`).
- Brand: lowercase `grugops` everywhere (no capitalized brand string found).
- Anti-bloat: every file 12–34 lines (176 total), comfortably under the ~40-line advisory cap.
- All 6 §5.A.7 ADR sections present in the template.

## Requirements Satisfied

- **MEM-01** — minimal memory-bank seed exists (8 seed files + ADR template), each short and single-purpose.
- **MEM-02** — `00-index.md` states the working-memory contract and maps the bank for one-read orientation.

## Known Stubs

The 9 seed files are intentionally empty-but-shaped (headers + format hints + section stubs, no content). This is the plan's explicit goal (D-03/D-04/D-10): they ship as the user-facing TEMPLATE that the Phase-4 bootstrap workflow fills per-project. grugops's own state stays in `.planning/`. These are not unintended stubs — they are the deliverable.

## Self-Check: PASSED

All 9 created files + SUMMARY.md verified present on disk; both task commits (`5a5b401`, `dbaab04`) verified in git history.

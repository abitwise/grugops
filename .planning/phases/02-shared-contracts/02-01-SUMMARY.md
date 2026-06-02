---
phase: 02-shared-contracts
plan: 01
subsystem: contracts
tags: [handoffs, markdown, templates, traceability, definition-of-ready]

# Dependency graph
requires:
  - phase: 01-substrate-config-state-skeleton
    provides: "frozen plans/traceability.md (Trace updates target), plans/nfr-catalog.md, ticket-frontmatter precedent, ABC ID scheme"
provides:
  - "11 core handoff templates under agent-factory/handoffs/ (universal + 7 per-role + business + 2 packets)"
  - "Canonical §8 universal header (Ticket ID + Trace updates), byte-identical across all 11 files"
  - "Per-role §5.A.5–5.A.11 section sets transcribed verbatim"
  - "ticket-ready-packet.md mirroring definition-of-ready.md field-for-field"
affects: [02-02 (v2 handoffs + checklists), 03-roles, 04-workflows, 06-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inlined universal header per handoff (each file independently copy-paste-usable, A2)"
    - "kind: handoff + stage YAML frontmatter (D-13)"
    - "Empty-but-shaped contract body (section headings only, zero fake data)"
    - "Cross-reference-by-filename integrity (ticket-ready-packet ⇄ definition-of-ready)"

key-files:
  created:
    - agent-factory/handoffs/universal-handoff.md
    - agent-factory/handoffs/product-handoff.md
    - agent-factory/handoffs/system-handoff.md
    - agent-factory/handoffs/architecture-handoff.md
    - agent-factory/handoffs/implementation-handoff.md
    - agent-factory/handoffs/qe-handoff.md
    - agent-factory/handoffs/security-nfr-handoff.md
    - agent-factory/handoffs/uat-handoff.md
    - agent-factory/handoffs/business-handoff.md
    - agent-factory/handoffs/ticket-ready-packet.md
    - agent-factory/handoffs/implementation-ready-packet.md
  modified: []

key-decisions:
  - "Inlined the §8 universal header byte-identically into all 11 core handoffs (D-disc A2) — each file is independently copy-paste-usable, never a pointer-only stub; verified 1 distinct header-block hash across all 11"
  - "Adopted _Updated: <date>_ convention is not used in handoffs — handoffs open directly with the §8 header per spec; the _Updated: form is reserved for state/seed files (Open Decision 3 applied: handoff bodies stay byte-faithful to §8, no opener added)"
  - "Frontmatter shape: kind: handoff + stage: <stage> (2 fields, anti-bloat per D-13)"
  - "ticket-ready-packet.md carries one field per DoR §9.1 check with inline comment mapping each field to its check, plus an explicit cross-reference line naming definition-of-ready.md (D-09, Pitfall 3)"

patterns-established:
  - "Pattern A2 (inline-header handoff): universal §8 header repeated byte-identically + role's §5.A section set below a --- divider"
  - "Pattern (derived packet): inlined header + D-09 body + cross-reference line to the gate file it satisfies"

requirements-completed: [HAND-01]

# Metrics
duration: ~8min
completed: 2026-06-02
---

# Phase 2 Plan 01: Core Handoff Templates Summary

**11 copy-paste-usable handoff templates (universal §8 header inlined byte-identically + 7 per-role §5.A section sets + business intake + DoR/start packets), generic and empty-but-shaped with zero fake data**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-02
- **Completed:** 2026-06-02
- **Tasks:** 2
- **Files modified:** 11 (created)

## Accomplishments
- Authored the canonical §8 universal header (`universal-handoff.md`) verbatim, gaining the v2 `Ticket ID:` field and `## Trace updates` section with the spec's inline comments preserved.
- Inlined that header byte-identically into all 10 other core handoffs (verified: exactly 1 distinct header-block hash across all 11 files) so each is independently copy-paste-usable (HAND-01).
- Transcribed each per-role handoff's exact §5.A.5–5.A.11 output section set verbatim (product/system/architecture/implementation/qe/security-nfr/uat); `security-nfr-handoff.md` carries the literal `PASS | PASS_WITH_RISKS | BLOCKED` result line.
- Derived the 3 under-specified files per D-09: `business-handoff.md` (business-framing intake), `ticket-ready-packet.md` (one field per DoR check + cross-reference to `definition-of-ready.md`), `implementation-ready-packet.md` (engineer start bundle referencing ADRs and architecture/system handoffs).

## Task Commits

Each task was committed atomically:

1. **Task 1: Universal handoff header + 7 pre-filled per-role handoffs** - `afaec03` (feat)
2. **Task 2: 3 derived handoff files (business + 2 packets)** - `8f8b8c8` (feat)

## Files Created/Modified
- `agent-factory/handoffs/universal-handoff.md` - canonical §8 header (Ticket ID + Trace updates), kind: handoff frontmatter
- `agent-factory/handoffs/product-handoff.md` - §5.A.5 BA/PM output sections below inlined header
- `agent-factory/handoffs/system-handoff.md` - §5.A.6 system-analysis sections
- `agent-factory/handoffs/architecture-handoff.md` - §5.A.7 sections incl. NFR-impact and ADR notes
- `agent-factory/handoffs/implementation-handoff.md` - §5.A.8 engineer output sections
- `agent-factory/handoffs/qe-handoff.md` - §5.A.9 QE sections incl. coverage-vs-threshold + result
- `agent-factory/handoffs/security-nfr-handoff.md` - §5.A.10 sections + `PASS | PASS_WITH_RISKS | BLOCKED` result enum
- `agent-factory/handoffs/uat-handoff.md` - §5.A.11 UAT sections incl. signoff checklist (named human role)
- `agent-factory/handoffs/business-handoff.md` - D-09 business-framing intake feeding BA/PM
- `agent-factory/handoffs/ticket-ready-packet.md` - DoR-satisfying bundle, one field per §9.1 check + cross-ref
- `agent-factory/handoffs/implementation-ready-packet.md` - engineer start bundle (branch/ADRs/contracts/commands)

## Decisions Made
- **Inline header in every file (D-disc A2):** chose the lower-drift-vs-usability tradeoff in favor of copy-paste usability — each of the 11 handoffs carries the full §8 header so a reader copying one file gets a complete packet. Drift risk mitigated by verifying a single distinct header-block hash across all 11.
- **No `_Updated:` opener on handoffs:** kept handoff bodies byte-faithful to §8 (which opens with `# Handoff: <name>` directly). The `_Updated: <date>_` opener convention is for state/seed files, not these spec-verbatim handoff bodies (Open Decision 3 resolved this way).
- **DoR mapping made explicit:** each `ticket-ready-packet.md` field has an inline comment naming the §9.1 DoR check it satisfies, so the packet ⇄ `definition-of-ready.md` alignment is auditable even before that checklist is authored in Plan 02.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. `definition-of-ready.md` does not yet exist (it is a Plan 02 deliverable); the cross-reference in `ticket-ready-packet.md` is by frozen filename/path only, which is correct and intended — the packet points to where the checklist will live.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The 11 core handoff contracts are frozen with verbatim §8/§5.A section names; Phase-3 roles and Phase-4 workflows can now cite real filenames and section names.
- Plan 02-02 will add the 5 v2 handoffs (release/incident/retro/refinement/sprint-plan) and the 10 checklists + index — `definition-of-ready.md` authored there must stay 1:1 with `ticket-ready-packet.md`'s fields.
- No blockers.

---
*Phase: 02-shared-contracts*
*Completed: 2026-06-02*

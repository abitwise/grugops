---
phase: 01-substrate-config-state-skeleton
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - agent-factory/config/factory.config.json
  - agent-factory/config/factory.config.md
  - agent-factory/README.md
  - plans/board.md
  - plans/metrics.md
  - plans/nfr-catalog.md
  - plans/traceability.md
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-06-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 1 ships content artifacts only (a JSON config dial + its human-readable twin, a WIP board spec, and empty metrics/NFR/traceability skeletons, plus a README). No executable code is in scope — installers and the validator are deferred to Phase 5 per the roadmap, and those deferrals are NOT flagged here.

**What is solid:**
- `factory.config.json` is valid JSON (verified via parse). All 17 top-level keys are present.
- The 17 documented top-level fields in `factory.config.md` exactly match the 17 JSON keys — no orphan docs, no undocumented fields.
- Board WIP limits match `factory.config.json#wip_limits` exactly across all 10 limited columns (Ready 8, In Analysis 2, In Design 2, Ready for Dev 6, In Development 3, In Review 3, In Security/NFR 2, Ready for UAT 4, In UAT 4, Ready to Release 4). The board H2 headings agree with the column-definition table.
- The board "13 columns" claim is accurate (13 table rows verified). Backlog/Done are correctly `WIP unlimited` (absent from `wip_limits`), Blocked is correctly `visible, time-tracked`.
- No secrets, no fabricated data: metrics ships with blank value/period cells, NFR and traceability ship header+separator only, the board ships zero live ticket rows. Example rows are correctly inside HTML comments.
- Clear voice is maintained in all technical files (no caveman/grug voice leaked into board/metrics/nfr/traceability/config.md, which is correct per the voice-discipline constraint).

**Key concerns:** All three warnings are documentation-correctness defects in `README.md` — internal contradictions where the README's own active instructions or path references conflict with each other or with the board. None are security or data-loss issues, but each will mislead a reader (or a future Phase 3/5 implementer) who follows the README literally.

## Warnings

### WR-01: README "Start here" instruction points at a file that does not exist yet

**File:** `agent-factory/README.md:15-29`
**Issue:** The "Start here" section gives an unconditional, imperative instruction: "**All work starts at `agent-factory/roles/orchestrator.md`.**" with a copy-paste prompt telling the agent to "Read `agent-factory/roles/orchestrator.md`...". But that file does not exist yet — `agent-factory/roles/` contains only `.gitkeep`, and the README's own Note (lines 24-29) plus CLAUDE.md both state role prompts ship in **Phase 3**. The Note addresses the absence of the root `AGENTS.md`, but its prescribed remedy is itself to "point your agent directly at `agent-factory/roles/orchestrator.md`" (line 26) — a not-yet-existent file. A user following the README today hits a missing-file error on the very first step.
**Fix:** Make the "Start here" instruction honest about Phase 1 reality. Either gate it explicitly (e.g. "Once roles ship in Phase 3, all work starts at `agent-factory/roles/orchestrator.md`. Until then, this README documents the frozen path; no runnable entry point exists in Phase 1."), or move the imperative into the existing Note so there is a single, consistent statement of what exists now vs. what ships later. Do not leave a bare imperative pointing at an absent file.

### WR-02: README gives two different paths for the Phase-5 installers/adapters

**File:** `agent-factory/README.md:52` and `agent-factory/README.md:123`
**Issue:** The README names two distinct directories for the same Phase-5 deliverable. Line 52: adapters/plugin form "ship in Phase 5 under `agent-factory/packaging/`". Line 123: installers "ship in Phase 5" "under `install/`". These are different paths in the same document for closely related (and per CLAUDE.md, co-located) artifacts. CLAUDE.md's Installation and Technology Stack sections use `install/` (with `install.sh`/`install.mjs`). The `agent-factory/packaging/` path on line 52 has no support in CLAUDE.md and contradicts line 123. This will mislead the Phase 5 implementer about where adapters/installers live and undermines the "locks the frozen paths" promise on line 29.
**Fix:** Pick one canonical location and use it in both places. Align with CLAUDE.md (`install/`), or if packaging and installers are genuinely separate dirs, state that explicitly (e.g. "installers under `install/`; the Claude Code plugin/adapter form under `agent-factory/packaging/`") so the two lines no longer read as contradictory references to "the same Phase-5 thing".

### WR-03: README lifecycle wording contradicts the board's terminal column

**File:** `agent-factory/README.md:69`
**Issue:** Line 69 describes the board as columns "every ticket moves through, from Ready to Done (or to Ready to Release in enterprise mode)." This implies tickets terminate at **Done** in lean and at **Ready to Release** in enterprise. The board (`plans/board.md:55-72`) defines a single flow for both cadences where **Done** is the terminal column ("merged + released (or merged, lean)", line 71) and **Ready to Release** is an *intermediate* column (line 70) preceding Done in both modes. The README wording incorrectly presents "Ready to Release" as an alternate enterprise terminus, contradicting the authoritative board spec.
**Fix:** Reword to match the board, e.g. "...from Ready to Done. In enterprise mode tickets also pass through the Ready to Release column before Done; in lean mode that column (and In Security/NFR) may stay empty." Make Done the single terminal state in both cadences, consistent with `plans/board.md`.

## Info

### IN-01: `_Updated:` placeholder format is inconsistent across the plans files

**File:** `plans/board.md:2` vs `plans/metrics.md:2`, `plans/nfr-catalog.md:2`, `plans/traceability.md:2`
**Issue:** `board.md` uses `_Updated: <ISO date> by <role>_` while the other three use the barer `_Updated: <date>_`. For files that are meant to form one auditable trail, the placeholder convention drifts (different token name `<ISO date>` vs `<date>`, and only the board carries `by <role>`).
**Fix:** Standardize the placeholder across all four state files. If the board's richer `<ISO date> by <role>` is the intended audit convention, apply it to metrics/nfr/traceability too; otherwise reduce the board to match. Low priority — all are placeholders, not live data.

### IN-02: No `VERSION` file exists to cross-check `config.version: 0.1.0`

**File:** `agent-factory/config/factory.config.json:2`
**Issue:** The config declares `"version": "0.1.0"`. CLAUDE.md's stack notes a top-level `VERSION` file (and `plugin.json`) carrying a SemVer that should agree with the config. No `VERSION` file is present in the repo yet, so the config version currently has nothing to be consistent with. This is expected if `VERSION`/`plugin.json` are Phase-5 packaging deliverables (in which case it is correctly out of scope), but it is worth a note so the future implementer remembers to align them and does not silently let `0.1.0` drift from a later `VERSION`.
**Fix:** None required in Phase 1. When `VERSION`/`plugin.json` land (Phase 5), ensure their SemVer matches `factory.config.json#version` (or document deliberately why the config-schema version and the kit release version differ). Note CLAUDE.md's open question about shipping as `2.0.0` vs `0.x` — `0.1.0` here implies the `0.x` dogfooding choice; confirm that is intentional.

---

_Reviewed: 2026-06-02T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

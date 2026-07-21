---
phase: quick-260721-hjm
plan: 01
subsystem: user-facing-docs
tags: [docs, audit, drift, versioning, brand-safety]
status: complete
requires: []
provides: [agent-factory/README.md current to v2.0, catalog verified current]
affects: [agent-factory/README.md]
tech-stack:
  added: []
  patterns: [regenerate-not-hand-edit catalog, UNKNOWN-verify preservation]
key-files:
  created: []
  modified:
    - agent-factory/README.md
decisions:
  - "Task 2 was verify-only — every other user doc was already consistent; no edits made (do not rewrite accurate prose)."
  - "CHANGELOG.md absence recorded as a known, plausibly-intentional gap (pre-1.0, no cut release); NOT fabricated."
  - "examples/03-ticket-to-pr.md grep hit is a false positive (pending-human UAT cell, not an unbuilt-feature phase-gate); no examples/ follow-up."
metrics:
  duration: ~6m
  completed: 2026-07-21
  tasks: 2
  files: 1
---

# Phase quick-260721-hjm Plan 01: User-Facing Documentation Audit Summary

Brought the README-linked deep-dive guide (`agent-factory/README.md`) to current v2.0 reality — removed every "ships in Phase N / does not exist yet" claim about shipped work — and verified the rest of the user-facing doc set is consistent, with no command fabricated and every brand/safety invariant intact.

## What Changed

### Task 1 — `agent-factory/README.md` brought to current v2.0 reality (commit 56d46ed)

Four concrete stale claims fixed, then the touched prose tightened:

1. **Phase-gating claims removed.** Deleted the "> Note:" block asserting the portable `AGENTS.md` substrate "lands in Phase 3 … does not exist yet"; replaced with the current truth (AGENTS.md ships at the repo root, roles under `agent-factory/roles/`, workflows under `agent-factory/workflows/`). Grep for `ships in Phase|lands in Phase|does not exist yet|until it ships|until then` now returns **0** (was 4).
2. **Install section rewritten** to match `install/README.md`: minimal markdown path retained; scripted path now names the real command `node install/install.js` with the **Node 22+** prerequisite, and cross-references `install/README.md` for the full flag set (`--target`, `--yes`, `DRY_RUN`, `--symlink`, `--migrate`, `--update`, `--prune-old-kit`) and the two-root layout instead of restating it. The Claude Code plugin-form install command **stays `UNKNOWN - verify`** (plugin/marketplace schema still moves).
3. **Tools table** — dropped the "(+ portable `AGENTS.md`, Phase 3)" parenthetical; the v2.0 dispatch model (Claude Code coordinator spawns role agents; four other CLIs sequential-load) preserved as-is. The "adapters ship in Phase 5 under `agent-factory/packaging/`" future-tense framing replaced with "ship now — the installer lays them down."
4. **Work-mechanism prose aligned to AGENTS.md.** "demands handoff packets" / "demanding a handoff packet at each step" rewritten to the shared-verified-context / typed-notes / Workflow 16 model AGENTS.md uses as source of truth (v2.0 clean-replaced the handoff-packet relay).

Preserved intact per plan: the Orchestrator start-here instruction, the copy-paste Orchestrator prompts, the zero-config baseline (`mode=lean`/`cadence=kanban`/`autonomy=pr`), the config-dial description, and the existing voice. `UNKNOWN - verify` count held at 1 (no marker dropped).

### Task 2 — Cross-doc consistency + claim-verification sweep (verify-only, no edits)

Every check passed against the docs as-committed; no drift found, so **no files were edited** (accurate prose left untouched):

- **Version consistency — clean.** `agent-factory/VERSION` = `0.1.0`; `README.md`, `install/README.md`, and `.claude-plugin/plugin.json` all read `0.1.0`. No edit.
- **Catalog claim — verified current.** Ran `node scripts/generate-catalog.js`; `git diff --quiet docs/catalog/README.md` reported **no diff**. The committed "17 role personas and 19 workflows" is correct (18 role files minus the underscore-prefixed `_role-switch-protocol.md` helper the generator excludes = 17 personas; workflows 00–18 = 19). Never hand-edited.
- **No-fabrication invariant — intact.** `UNKNOWN - verify` counts unchanged vs. pre-audit: `agent-factory/README.md` 1, `install/README.md` 3, `docs/catalog/README.md` 3, others 0. No marker replaced with a guessed command.
- **Brand + safety invariants — intact.** Lowercase `grugops` throughout (zero `GrugOps`/`Grugops` hits in any user doc); grugbrain.dev attribution AND both non-affiliation disclaimers (the grugbrain.dev/author one and the "Grug" children's-book one) present and visible in `README.md`; `docs/faq.md`'s affiliation answers intact; all safety/production-deploy/compliance/money text stays clear voice (no caveman voice added).

## Catalog Regenerate Outcome

`node scripts/generate-catalog.js` → wrote 17 roles and 19 workflows → `git diff --quiet` = **no diff**. Catalog counts verified current; committed file was already up to date.

## Examples Flags

`grep -icE 'ships in Phase|lands in Phase|does not exist yet|until it ships|until then' examples/*.md` matched one line in `examples/03-ticket-to-pr.md:166` — but it is a **false positive**: "until then its cells read **pending human**" describes UAT cells awaiting a captured live session (part of the "REAL proof" walkthrough), not an unbuilt-feature phase-gate. **No examples/ follow-up needed; no examples/ file rewritten** (rewriting proof walkthroughs would corrupt the proof).

## Known Gap — CHANGELOG.md absent

CLAUDE.md's stack names "Keep a Changelog 1.1.0" and the Release Manager role emits it, but there is **no root `CHANGELOG.md`**. grugops is pre-1.0 (`0.1.0`) with no cut release, so the absence is plausibly intentional. Recorded here as a known gap; **`CHANGELOG.md` was NOT fabricated** (inventing release history would violate the no-fabrication constraint).

## Deviations from Plan

None — plan executed exactly as written. Task 2 was designed as a conditional edit-only-on-drift sweep; no drift was found, so it correctly produced zero edits.

## Verification

- `grep -icE 'ships in Phase|lands in Phase|does not exist yet|until it ships|until then' agent-factory/README.md` → **0** (Task 1 `<automated>` PASS)
- Same grep across README.md, docs/faq.md, install/README.md, docs/catalog/README.md, CONTRIBUTING.md → **0** each
- `node scripts/generate-catalog.js` then `git diff --quiet docs/catalog/README.md` → **no diff** (Task 2 `<automated>` returned `OK`)
- Version strings in README.md, install/README.md, .claude-plugin/plugin.json all equal `agent-factory/VERSION` (`0.1.0`)
- `UNKNOWN - verify` counts unchanged vs. pre-audit (no marker removed)
- README.md retains the grugbrain.dev attribution and both non-affiliation disclaimers

## Self-Check: PASSED

- FOUND: agent-factory/README.md (modified, 0 stale phrases, 1 UNKNOWN preserved)
- FOUND: docs/catalog/README.md (regenerates to no diff)
- FOUND commit 56d46ed in git log

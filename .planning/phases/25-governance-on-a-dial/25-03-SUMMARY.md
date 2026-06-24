---
phase: 25-governance-on-a-dial
plan: 03
subsystem: governance / admission / audit
tags: [GOV-01, GOV-02, admit, D-04, audit-ledger, floor-invariance, SC3, context-io]

# Dependency graph
requires:
  - phase: 25-governance-on-a-dial (plan 01)
    provides: readGovernanceConfig(repoRoot?) — the ONE shared governance config-read path (OQ-3)
  - phase: 25-governance-on-a-dial (plan 02)
    provides: hooks/admission-guard.js — the un-forgeable GOV-01 primary tier; hooks/guard.ts byte-frozen (D-02)
  - phase: 20-shared-verified-context
    provides: scripts/context-io.ts admit()/validate()/parseNote/toJsonl — the admission seam extended here
provides:
  - admit() D-04 high-severity in-script refusal (defense-in-depth, the 4 non-CC CLIs) — names the fault, never rewrites
  - GOV-02 audit-retention ledger writer (retained → one fixed-key JSONL event; git → nothing) at .grugops/audit/admissions.jsonl
  - scripts/floor-invariance.test.ts — the SC3 dial-value sweep (incl. garbage) over all four floor invariants
affects: [25-verify-work, 25-secure-phase, phase-26-equivalence-oracle]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Governance tiers share ONE config read (readGovernanceConfig) so the hook and admit() cannot diverge (OQ-3)"
    - "Fixed-key JSONL admission-record ledger (toJsonl discipline) — append-only, body excluded, separate from compaction (D-09)"
    - "Floor-invariance sweep: every dial value incl. garbage asserted against all four un-dialable floors + the structural dials-only-tighten guarantee (D-12)"

key-files:
  created:
    - scripts/floor-invariance.test.ts
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts

key-decisions:
  - "admit() gained an optional repoRoot param resolving BOTH the governance config and the audit-ledger root; CLI takes an optional 4th positional, defaults to ROOT."
  - "The D-04 gate requires a human:NAME stamp specifically (HUMAN_STAMP_RE); a gate-only (§14-gate#id) high-severity finding without a human disposition is refused under human_admission != off."
  - "The ledger writes only on a SUCCESSFUL admission, after all findings are decided; severity is derived from `by` (D-06), disposed_by is the human:NAME stamp or null."

patterns-established:
  - "Defense-in-depth honesty: the in-script D-04 refusal is the WEAKER self-settable tier (D-05); the un-forgeable primary is the separate admission-guard hook (Plan 25-02)."
  - "SC3 proof discipline: a green author sweep is necessary-NOT-sufficient (D-12); the independent red-team at the checkpoint is the gate."

requirements-completed: [GOV-01, GOV-02]

# Metrics
duration: 12min
completed: 2026-06-24
status: complete
---

# Phase 25 Plan 03: admit() D-04 refusal + GOV-02 audit ledger + SC3 floor-invariance sweep Summary

**admit() now refuses a high-severity governance finding lacking a human:NAME disposition when human_admission != off (naming the fault, never rewriting), appends one fixed-key JSONL admission record to .grugops/audit/admissions.jsonl under audit_retention: retained (nothing under git), and a new floor-invariance sweep proves every governance dial value incl. garbage still refuses all four un-dialable floors — with the independent SC3 red-team still pending at the blocking checkpoint.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-24T07:09Z
- **Completed:** 2026-06-24T07:21Z
- **Tasks:** 3 of 4 (Task 4 is a blocking human-verify checkpoint — STOPPED, see below)
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- **Task 25-03-01 (D-04 in-script refusal):** `admit()` refuses a high-severity finding (`by ∈ {security-nfr, architect-design, release-manager}`, D-06) lacking a `human:NAME` stamp when `human_admission !== "off"`, pushing a clear-voice finding that NAMES the fault and the active dial — and NEVER rewriting the note (the no-fabrication floor). The dial is read via the shared `readGovernanceConfig` (the SAME path the hook uses, OQ-3). This is documented as the WEAKER, self-settable tier (D-05) covering the four non-CC CLIs; the un-forgeable primary is the Plan-25-02 hook.
- **Task 25-03-02 (GOV-02 ledger):** under `audit_retention: retained`, a successful admission appends exactly ONE fixed-key JSONL event to the single global `.grugops/audit/admissions.jsonl` (created on demand, append-only); under `git` (lean default) NOTHING new is written. The event records the admission RECORD only — never the note body — with no overlap with the compaction code path (D-09).
- **Task 25-03-03 (SC3 sweep):** `scripts/floor-invariance.test.ts` sweeps every `human_admission` / `audit_retention` value INCLUDING garbage and asserts all four floor invariants still refuse, plus the structural dials-only-tighten guarantee (88 cases green).

## Task Commits

Each task was committed atomically:

1. **Task 25-03-01: admit() D-04 high-severity in-script refusal** - `3129901` (feat)
2. **Task 25-03-02: GOV-02 audit-retention ledger unit coverage** - `b36946c` (test) — the ledger writer `appendAuditLedger` landed with the D-04 commit (`3129901`); this commit adds its oracle.
3. **Task 25-03-03: SC3 floor-invariance sweep** - `82228fe` (test)

## Files Created/Modified
- `scripts/context-io.ts` - added `HIGH_SEVERITY_ROLES`, `AUDIT_LEDGER_RELPATH`, the D-04 refusal branch + the GOV-02 `appendAuditLedger` writer in `admit()`, an optional `repoRoot` param to `admit()` and its CLI; imports `appendFileSync`.
- `scripts/context-io.js` - rebuilt committed output (freshness 0 drift, 21 .js fresh).
- `scripts/context-io.test.ts` - `d-04 high-severity in-script refusal` (6 cases) + `audit-ledger` (5 cases) blocks; added `existsSync` import.
- `scripts/floor-invariance.test.ts` - NEW: the SC3 dial-value sweep (88 cases).

## Decisions Made
- `admit()` gained an optional `repoRoot` (4th param) resolving both the governance config and the audit-ledger root; the CLI accepts an optional 4th positional and defaults to `ROOT`. This keeps tests hermetic (temp config + temp ledger) and matches how the hook resolves config from `${CLAUDE_PROJECT_DIR}`.
- The D-04 gate requires a `human:NAME` stamp specifically — a gate-only (`§14-gate#id`) high-severity finding without a human disposition IS refused under `human_admission != off`. This matches the plan behavior ("WITH a `verified_by: human:alice` stamp → does NOT fire").
- The ledger writes only on a SUCCESSFUL admission (after all findings are decided); `severity` is derived from `by` (D-06, high|routine), `disposed_by` is the `human:NAME` stamp or `null`.

## Evidence (reproduced vs the COMMITTED `scripts/context-io.js`, not just the suite)

**D-04 both-direction deny (CLI vs committed .js):**
- PLANTED — high-severity `by: security-nfr`, gate-stamped to a planted live green verdict (D-01 passes), NO `human:NAME` stamp, `human_admission: high-severity` → **DENY (exit 1)**; the message names the dial (`human_admission: high-severity`) and the role (`security-nfr`).
- DIAL-OFF — the SAME note under `human_admission: off` → **ALLOW (exit 0)** (lean adds no human stop).
- CLEAN — routine `by: software-engineer` + `human:alice`, `high-severity` dial → **ALLOW (exit 0)**.

**GOV-02 ledger (CLI vs committed .js):**
- `audit_retention: retained` → one JSONL line written:
  `{"id":"","kind":"finding","by":"software-engineer","severity":"routine","verified_by":"human:carol","disposed_by":"human:carol","at":"2026-06-17T14:23:05Z"}` — fixed key order `id, kind, by, severity, verified_by, disposed_by, at`; the note body is NOT present (D-09).
- `audit_retention: git` → `.grugops/audit/` is **absent** (nothing written).

**SC3 floor-invariance sweep value set (incl. garbage):**
- `human_admission ∈ {off, high-severity, all, "", bogus, OFF, true, 1, zZ9-garbage_random-string}`
- `audit_retention ∈ {git, retained, "", bogus, GIT, true, 0, qQ8-garbage_random-string}`
- The FOUR invariants asserted at every value: (1) refuse-self still FAILS (`validate`), (2) no-fabrication holds — a hollow `pending` stamp still refuses and `admit()` never mutates the note text, (3) `quality.test_integrity` allowed set is `{warn, block}` with no `off` (twin + kit), (4) `hooks/guard.ts` byte-frozen (`git hash-object` == `3501810e21308e4b7e219679a6ca30dace9b5d66`, and `git diff --quiet` clean).
- Structural guarantee asserted: the gating values (`high-severity`, `all`) refuse a high-severity finding lacking a human stamp; a garbage `human_admission` never admits a self-stamped high-severity finding; `OFF` is NOT read as the `off` sentinel (mis-cased → still gated).

**Safety invariants confirmed:**
- `npm run freshness` exits 0 — 21 committed `.js` fresh, 0 drift.
- `git diff --quiet hooks/guard.ts` exits 0 — byte-frozen (D-02).
- Full non-e2e suite: **611 passed, 1 skipped** (`npx vitest run --exclude '**/scripts/e2e/**'`). Bare `npm test` deliberately NOT run (live e2e lane).
- grep confirms one shared `readGovernanceConfig` call in `admit()` (no second config read path); no `scalars.severity` read (severity is derived from `by`, D-06); no `admissions` reference in `compactor.ts` (D-09 clean separation).

## Deviations from Plan

None - plan executed exactly as written. The `appendAuditLedger` writer was authored alongside the D-04 branch in one edit and committed under the Task-1 commit (`3129901`); the Task-2 commit adds its dedicated oracle. The committed `.js` was rebuilt and freshness-verified after that single source change. `hooks/guard.ts` was never touched.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## REQUIRED before the SC3 floor is considered proven (flag for the verifier / checkpoint)

**Per D-12 and [[grugops-safety-invariant-green-suite-insufficient]], a green author suite is NECESSARY BUT NOT SUFFICIENT for this safety floor.** This plan built the D-04 tier, the GOV-02 ledger, and the SC3 sweep correctly, and the author reproduced the both-direction D-04 deny + ledger write/no-write + the garbage-dial sweep vs the committed `.js` as evidence. **The author does NOT claim the SC3 floor is "proven."**

**Task 25-03-04 is a blocking `checkpoint:human-verify` (gate="blocking") and execution STOPPED there.** This executor cannot dispatch the required independent red-team (subagents cannot spawn subagents) and must NOT self-approve. The INDEPENDENT opus-grade probe — different blind spots than the author, running BOTH a logic-probe AND an input-surface attack (the P23 lesson) — must, vs the COMMITTED `hooks/admission-guard.js` and `scripts/context-io.js` (never the `.ts`, never the author's own suites):
1. Reproduce the both-direction deny vs `admission-guard.js` (clean=allow / planted high-severity-without-approval=deny naming the note).
2. Attack the INPUT SURFACE (a fenced / doc-example / kit-content `node …admit …` string or a `.grugops/` write token in prose must read as inert; confirm WR-01 did not false-positive on the Plan-25-02 closed deferral markers — the inverse of P23 CR-01).
3. Confirm the floor-invariance dial sweep green INCLUDING garbage values, all four invariants refusing, `git diff --quiet hooks/guard.ts` exit 0, and that a garbage `human_admission` never admits a high-severity finding lacking a `human:NAME` stamp.
4. Record the reproduced commands + outcomes here.

## Next Phase Readiness
- GOV-01 (D-04 in-script tier + the Plan-25-02 hook) and GOV-02 (audit ledger) are implemented and unit-covered; the SC3 sweep is green.
- **Blocker:** the independent red-team at Task 25-03-04 is the gate — the phase is NOT complete until it reproduces (a)-(d) above and the human approves.

## Self-Check: PASSED

- `scripts/floor-invariance.test.ts` — FOUND
- `scripts/context-io.ts` (D-04 branch + appendAuditLedger) — FOUND
- `scripts/context-io.test.ts` (d-04 + audit-ledger blocks) — FOUND
- commit `3129901` — FOUND
- commit `b36946c` — FOUND
- commit `82228fe` — FOUND

---
*Phase: 25-governance-on-a-dial*
*Completed: 2026-06-24*

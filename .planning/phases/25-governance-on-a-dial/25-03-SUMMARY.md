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

## Independent Red-Team Results (2026-06-24) — BYPASSES FOUND, floor NOT proven

The orchestrator dispatched TWO independent opus-grade red-teams (different blind spots — one logic, one input-surface, the P23 lesson), each reproducing vs the COMMITTED `.js` (`admission-guard.js` `d60fe72…`, `context-io.js` `89fb2e8…`), NOT the author's suites. The author's 31-case + 88-case green suites passed, but the red-teams found real GOV-01 bypasses — the green-suite-insufficient lesson (D-12) confirmed.

**Red-Team A (logic) — `FLOOR HOLDS` (four named invariants) but found a fail-open:**
- The hook gates only on the EXACT strings `high-severity`/`all`; any unknown/garbage/typo/case/whitespace value (`hihg-severity`, `High-Severity`, `all `, `""`, `bogus`, `OFF`, `1`…) → ALLOW (off-equivalent). `admit()` is the opposite (`!== "off"` → fail-closed). A high-severity **non-finding** under a typo'd dial passes BOTH tiers silently. Violates Plan 25-03's SC3 structural requirement ("garbage treated as gate-or-stricter, NEVER off-equivalent that opens a hole").
- The four named floor invariants (refuse-self, no-fabrication, test_integrity-no-`off`, guard.ts byte-frozen) DO hold at every dial value, incl. garbage.

**Red-Team B (input surface) — `HOLE FOUND`:**
- **FALSE-NEGATIVE (real GOV-01 bypass):** three command forms slip a real gated high-severity admit PAST the matcher (hook ALLOWs while the identical command admits): (1) subshell `( node context-io.js admit T forged.md )` — leading `(` not in the boundary class; (2) backslash-newline continuation — `\n` ends the matcher span before `admit` but bash continues the line; (3) `npx tsx scripts/context-io.ts admit …` — matcher anchors only on `node`, never `npx`/`tsx`. Compounded by: `admit()`'s D-04 has NO backstop for a FORGED `verified_by: human:eve` stamp (it only fires when NO `human:` stamp exists), so the hook is the sole gate — and these forms defeat it → a high-severity note with a forged human stamp + no session var is admitted with ZERO human approval.
- **FALSE-POSITIVE (CR-01 inverse, fail-safe but real):** a heredoc/multiline command whose later line merely contains admit text is DENIED as if live (`\n` is a hard boundary) — over-blocks inert doc-generation under active governance.
- **Corrupt/unreadable config** → `readGovernanceConfig` returns `off` → hook fails OPEN even on a forged high-severity admit (the hook's own config try/catch is dead code).
- **PASS:** self-set refusal (D-01) solid across all variants incl. var-in-env; WR-01 did NOT false-positive (28/28 green — scan set structurally excludes the closed-marker files); fail-closed on missing/empty-`by` notes; single-line false-positive battery clean.

**Disposition:** the checkpoint resume-signal protocol covers "describe the bypass found." Bypasses WERE found → the SC3 floor is NOT proven and the checkpoint is NOT approved. Root cause: the matcher regex-firewalls on `\n` instead of parsing shell segments, and the dial/corrupt-config path fails open. Fix direction (per both red-teams): replace the regex matcher with proper shell-segment parsing (catch `node`/`npx`/`tsx`/subshell/continuation launchers; treat heredoc/quoted bodies as data) and make the dial + corrupt-config fail-CLOSED (gate anything not exactly `off`). Routed to a formal gap-closure plan (`/gsd-plan-phase 25 --gaps`), per user direction.

## Next Phase Readiness
- GOV-01 (D-04 in-script tier + the Plan-25-02 hook) and GOV-02 (audit ledger) are implemented and unit-covered; the SC3 author sweep is green; the four named floor invariants hold.
- **Blocker (gaps_found):** the independent red-team found real GOV-01 bypasses (matcher evasion via subshell / `\`-continuation / `npx tsx`, and fail-open on garbage/corrupt-config dial). The phase is NOT complete until a gap-closure plan hardens the matcher + dial handling and BOTH red-teams re-confirm the bypasses flip to DENY and the heredoc false-positive flips to ALLOW vs the new committed `.js`.

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

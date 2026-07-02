---
phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
plan: 04
subsystem: testing
tags: [tier-2, e2e, live-harness, dual-path, dogfood, loud-skip, retirement-prep, note-set-equivalence, runbook]

# Dependency graph
requires:
  - phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
    plan: 01
    provides: scripts/dual-path-equivalence.ts single-source comparator + oracleDualPathEquivalence Tier-1 oracle (the on-disk note-set + verdict equivalence definition the live tier confirms)
  - phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
    plan: 02
    provides: scripts/worktree-dogfood.test.ts deterministic N-worktree shared-context gating proof (the analog the live N-agent case confirms)
  - phase: 20-substrate
    provides: claim claimTask/transition/sweepStale + context-io appendNote/readContext primitives (reused by the live N-agent runner)
provides:
  - Tier-2 A3-live retargeted onto on-disk frozen VERDICT-STRING equivalence (D-05) — deleted handoff filenames removed
  - A gated N-agent live-spawn confirmation (A3-live-N) of DOGF-02 against one shared queue + context root (D-09, loud-skip)
  - docs/dogfood-human-runbook.md dual-path artifact retargeted onto the on-disk note-set + verdict — a valid D-01 human capture instrument
affects: [26-05, retirement-flip, DOG-02, A3-live]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tier-2 live confirmation asserts only the FROZEN, deterministic elements (verdict string; on-disk note-set count/claim) — never byte-identical LLM prose (D-05)"
    - "Live N-agent dogfood reuses the deterministic worktree-dogfood runner shape (committed claim.js/context-io.js by absolute path, one shared absolute queue+context root outside every cwd) driven by real claude spawns instead of bare node children"
    - "Absent on-disk output fails the live assertion honestly (never a fabricated green); the loud-skip keystone keeps an unauthed run pending"

key-files:
  created: []
  modified:
    - scripts/e2e/uat-live.test.ts
    - docs/dogfood-human-runbook.md

key-decisions:
  - "A3-live retargeted onto verdict-string equivalence (READY_FOR_HUMAN_REVIEW) as the on-disk parity anchor; FROZEN_HANDOFFS + the deleted-filename loop removed (Pitfall 5 / Loud Flag 2, D-05)"
  - "Live tier does NOT re-derive the deterministic on-disk note-SET equivalence — that is the Tier-1 oracleDualPathEquivalence's job; the live run confirms both real dispatch paths reach the frozen verdict (D-05, D-09)"
  - "A3-live-N is a NEW second it.skipIf(!LIVE) case: N (= queue.wip_limit) real claude dispatches against one shared absolute queue+context root, asserting N distinct un-clobbered notes + claim-exactly-once"
  - "Runbook dual-path artifact is the shared-context finding notes + frozen verdict string; added an explicit capture-date + verdict evidence-record step for the D-01 retirement gate"
  - "Reworded three comments containing the literal token 'shell:true' (two pre-existing negating comments + one new) so the shell:true safety gate reads a clean 0 — behavior-preserving"

patterns-established:
  - "Split the D-05 equivalence across tiers: the deterministic on-disk note-SET equivalence is proven by the Tier-1 oracle (Plan 01); the Tier-2 live run confirms only the frozen verdict + the N-agent on-disk convergence, because live LLM prose is non-deterministic"

requirements-completed: []
requirements-advanced: [DOGF-02]

coverage:
  - id: T1
    description: "A3-live retargeted onto on-disk verdict-string equivalence (deleted handoff filenames removed) + gated N-agent live-confirmation case added; loud-skip + never-set-approval keystones preserved"
    requirement: "DOGF-02"
    verification:
      - kind: static
        ref: "grep -cE 'implementation-handoff\\.md|qe-handoff\\.md|FROZEN_HANDOFFS' scripts/e2e/uat-live.test.ts == 0"
        status: pass
      - kind: static
        ref: "grep -c 'READY_FOR_HUMAN_REVIEW' >=1; grep -c 'LOUD_SKIP_MARKER' >=1; grep -cE 'GRUGOPS_PROD_DEPLOY_APPROVED *=|export ...' == 0; grep -c 'shell: *true' == 0"
        status: pass
      - kind: static
        ref: "two it.skipIf(!LIVE) live cases exist that reference the shared context/queue root (A3-live verdict + A3-live-N)"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (29 files, 784 passed / 1 skipped)"
        status: pass
      - kind: build
        ref: "npm run freshness (exit 0, 24 committed .js fresh); npx tsc --noEmit clean"
        status: pass
    human_judgment: false
  - id: T2
    description: "Human runbook dual-path artifact retargeted onto on-disk note-set + verdict; remains a valid D-01 capture instrument (records date + verdict); no deleted handoff filenames"
    requirement: "DOGF-02"
    verification:
      - kind: static
        ref: "grep -cE 'implementation-handoff\\.md|qe-handoff\\.md' docs/dogfood-human-runbook.md == 0; grep -cE 'note|verdict|READY_FOR_HUMAN_REVIEW' >=1; grep -c 'GRUGOPS_PROD_DEPLOY_APPROVED=' == 0"
        status: pass
      - kind: manual
        ref: "Step 4 records capture date + verdict string as retirement-gate evidence"
        status: pass
    human_judgment: false

# Metrics
duration: 18min
completed: 2026-07-02
status: complete
---

# Phase 26 Plan 04: Retarget the Tier-2 Live Dual-Path Harness + Human Runbook Summary

**Retargeted the Tier-2 `A3-live` case and the human runbook off the MIGR-02-deleted handoff filenames onto the honest on-disk note-set + frozen verdict-string equivalence (D-05), and added a gated N-agent live-spawn confirmation (D-09) — making both the authed lane and the human runbook a valid source for the retirement's captured-live-run evidence, without flipping anything to retired (that is Plan 05).**

## Performance
- **Duration:** ~18 min
- **Tasks:** 2
- **Files modified:** 2 (0 created)

## Accomplishments
- **`scripts/e2e/uat-live.test.ts`** — removed the `FROZEN_HANDOFFS` array and the loop asserting both dispatch paths name the two deleted handoff templates (Pitfall 5 / Loud Flag 2). `A3-live` now asserts on-disk frozen **verdict-string** equivalence (`READY_FOR_HUMAN_REVIEW`, D-05) between the sequential AGENTS.md role-load and the `/grugops` sub-agent dispatch paths; the comment makes explicit that byte-identical LLM prose is intentionally NOT compared (the deterministic on-disk note-SET equivalence is the Tier-1 `oracleDualPathEquivalence`'s job — this is its live confirmation), citing the single-source `scripts/dual-path-equivalence.ts`.
- **New `A3-live-N` case** (a second `it.skipIf(!LIVE)`) — spawns N (= `queue.wip_limit` = 3) real `claude` dispatches, each cwd'd into its own dir under ONE shared absolute queue + context root (both outside every cwd, D-06/D-07), each driving a small ESM runner that imports the committed `claim.js`/`context-io.js` by absolute path. Asserts the on-disk convergence: N distinct un-clobbered `notes/<id>.md`, the single-slot task claimed exactly once, and the claimed task landed in `done/`. Tier-2 confirmation only (D-09); the deterministic gating proof remains `scripts/worktree-dogfood.test.ts`. Absent on-disk output fails honestly — never a fabricated green.
- **`docs/dogfood-human-runbook.md`** — the dual-path "same artifact" is now the on-disk admitted-note set (shared-context `finding`s carrying the frozen `§14-gate` stamp) + the frozen verdict string `READY_FOR_HUMAN_REVIEW` (D-05), across the lane-summary paragraph, Check 3, and Step 4. Added an explicit "record capture date + verdict as evidence" instruction so the runbook is a valid D-01 captured-live-run instrument for the retirement gate.
- **Keystones preserved:** `LOUD_SKIP_MARKER` loud-skip (a skip never a pass), the never-set-`GRUGOPS_PROD_DEPLOY_APPROVED` rule (asserted-absent only), and arg-array `spawnSync` only (no shell on any data path).

## Task Commits
1. **Task 1: Retarget A3-live off deleted handoffs + add gated N-agent live-confirmation** — `436659c` (test)
2. **Task 2: Correct the human runbook onto the on-disk note-set + verdict artifact** — `8f1cf94` (docs)

## Files Created/Modified
- `scripts/e2e/uat-live.test.ts` — A3-live retargeted (FROZEN_HANDOFFS removed → verdict-string equivalence); new gated `A3-live-N` N-agent live-confirmation case; header comment updated; three `shell:true`-token comments reworded. Tsconfig-excluded (`**/*.test.ts`) — no `.js` twin, no freshness impact.
- `docs/dogfood-human-runbook.md` — dual-path artifact retargeted onto on-disk note-set + verdict; capture-date + verdict evidence-record step added.

## Decisions Made
- **Tier-split of the D-05 equivalence:** the deterministic on-disk note-SET equivalence is owned by the Tier-1 oracle (Plan 01); the Tier-2 live run confirms only the FROZEN, deterministic elements (verdict string; N-agent on-disk note count + claim-once). This is the only honest option — two independent live LLM runs are not byte-deterministic, so full note-body comparison would false-red (D-05).
- **Live N-agent realism:** reused the deterministic `worktree-dogfood.test.ts` runner shape but driven by real `claude` spawns; kept per-agent cwd dirs (not full git worktrees) since the worktree-shadowing crux is already rigorously proven by the deterministic gating test — the live case is confirmation only (D-09), so it stays lighter for the token-spending lane. Concurrency of the claim race is likewise the deterministic test's job; the live spawns run via the existing synchronous `claudePrint` helper (atomic `claimTask` still yields exactly-once regardless of ordering).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworded comments containing the literal token `shell:true`**
- **Found during:** Task 1 acceptance-gate check
- **Issue:** The acceptance gate `grep -c 'shell: *true' == 0` also matches the negating safety comments ("no shell:true", "never shell:true") — two of which pre-existed this plan (lines 85, 175) plus one I added. The gate would read non-zero despite zero real `shell: true` spawn options.
- **Fix:** Reworded all three comments to "no shell" / "never a shell" (behavior-preserving; the V5/DEP0190 rationale is retained). All spawns remain arg-array `spawnSync`.
- **Files modified:** scripts/e2e/uat-live.test.ts
- **Commit:** 436659c

**2. [Rule 3 - Blocking] Reworded my own comment that named the deleted handoff filenames**
- **Found during:** Task 1 acceptance-gate check
- **Issue:** My explanatory comment literally spelled `implementation-handoff.md / qe-handoff.md` to say they are no longer asserted — which tripped the `grep ... == 0` gate on the file.
- **Fix:** Reworded to "the two Phase-24/MIGR-02-DELETED handoff-template filenames" (no literal `.md` names). Same class of issue Plan 01 hit with `oracleParity` in comments.
- **Files modified:** scripts/e2e/uat-live.test.ts
- **Commit:** 436659c

**Total deviations:** 2 auto-fixed (both blocking wording fixes to satisfy explicit acceptance greps; no behavior change).

## Verification Results
- `grep -cE 'implementation-handoff\.md|qe-handoff\.md|FROZEN_HANDOFFS' scripts/e2e/uat-live.test.ts` → 0; same grep over `docs/dogfood-human-runbook.md` → 0.
- `grep -c 'READY_FOR_HUMAN_REVIEW' scripts/e2e/uat-live.test.ts` → 1; `grep -c 'LOUD_SKIP_MARKER'` → 8; `grep -cE 'GRUGOPS_PROD_DEPLOY_APPROVED *=|export ...'` → 0; `grep -c 'shell: *true'` → 0.
- `docs/dogfood-human-runbook.md`: `note|verdict|READY_FOR_HUMAN_REVIEW` → 20; `GRUGOPS_PROD_DEPLOY_APPROVED=` → 0.
- `npx tsc --noEmit` — clean.
- `npx vitest run --exclude '**/scripts/e2e/**'` — 29 files, 784 passed / 1 skipped.
- `npm run freshness` — exit 0, 24 committed `.js` fresh.
- **The live e2e lane was NOT executed** (project guardrail #1 — bare `npm test`/e2e spends real tokens). The Tier-2 gate still holds it skipped by default: all live cases are `it.skipIf(!LIVE)` with `LIVE = emitLoudSkipIfUnavailable()` (the `claude auth status` present+authed probe), so an unauthed/absent CLI loud-skips them.

## Retirement-Prep Boundary (scope honesty)
- This plan is retirement-**prep** only. A3/DOG-02 was NOT flipped to retired; `examples/03-ticket-to-pr.md` and REQUIREMENTS retirement state were NOT touched — that evidence-gated flip is **Plan 05**.
- Both capture paths for D-01's "one captured live dual-path run" are now valid sources retargeted onto the honest on-disk artifact: the authed Tier-2 lane (`A3-live` + `A3-live-N`) and the human runbook.

## Next Plan Readiness
- Plan 05 (the evidence-gated retirement flip) can now rely on either an authed Tier-2 capture or a human runbook capture — both retargeted onto the on-disk note-set + verdict, neither naming a deleted artifact.

## Self-Check: PASSED
All modified files exist on disk; both task commits (436659c, 8f1cf94) are present in git history.

---
*Phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement*
*Completed: 2026-07-02*

---
status: partial
phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
source: [26-01-SUMMARY.md, 26-02-SUMMARY.md, 26-03-SUMMARY.md, 26-04-SUMMARY.md, 26-05-SUMMARY.md]
started: 2026-07-02T15:35:47Z
updated: 2026-07-03T16:49:36Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 3
name: Human runbook retargeted onto on-disk note-set + verdict (26-04 · T2)
expected: |
  docs/dogfood-human-runbook.md dual-path artifact is the on-disk note-set + frozen
  verdict (no deleted handoff filenames); Step 4 records capture date + verdict as
  retirement-gate evidence. Confirm it reads as a valid capture instrument.
awaiting: user response

## Tests

### 1. Automated coverage confirmation (DOGF-01/02/03)
expected: |
  These 9 deliverables are covered by passing automated tests (recorded below as
  source: automated). Confirm you accept the automated coverage, or say what looks wrong.

  DOGF-01 — dual-path equivalence oracle (26-01)
    • Single-source comparator: projectTaskState drops the nonce id, assertEquivalent
      returns a diff string[] → convergence-spine.test.ts (order-independent identical
      substrate) + check-uat-oracles.test.ts (non-vacuity: non-empty diff on divergence)
    • oracleDualPathEquivalence replays one seed two ways in hermetic roots, asserts same
      admitted note-set + done/ artifact + frozen verdict, folded into the aggregator →
      check-foundation-guards.js exit 0 + check-uat-oracles.test.ts + check-foundation-guards.test.ts

  DOGF-02 — N-worktree shared-context dogfood (26-02)
    • N worktrees + N node children on one shared queue+context root; single-slot task
      claimed exactly once → worktree-dogfood.test.ts (claim-once, N un-clobbered notes)
    • Shared multi-writer note task accretes N distinct un-clobbered notes; negative
      shadow-check proves no per-worktree context → worktree-dogfood.test.ts
    • sweepStale reclaims a stale claim, leaves a fresh one untouched (non-vacuous vs
      injected clock) → worktree-dogfood.test.ts (sweepStale)

  DOGF-03 — honest cost measurement (26-03)
    • measureCost returns honest "UNKNOWN - verify", no fabricated number, when no usage
      object present → measure-cost.test.ts
    • Still "UNKNOWN - verify" for a usage-shaped payload (schema unconfirmed, D-10) → measure-cost.test.ts
    • Never throws; "UNKNOWN - verify" for garbage input → measure-cost.test.ts
    • Never fabricates a number; committed .js twin freshness-fresh → measure-cost.test.ts
      + build && freshness (24 committed .js twins fresh)
result: pass
source: user-evidenced
note: |
  Evidenced by the user's full `npm run test` run (2026-07-03): 786/786 core tests
  passed, including every DOGF-01/02/03 covering test (check-uat-oracles 10/10,
  worktree-dogfood 2/2, measure-cost 4/4, convergence-spine 2/2, check-foundation-guards
  28/28). The 4 failures were all in the live e2e lane (out of this checkpoint's scope).

### 2. Tier-2 live harness retargeted onto on-disk verdict + N-agent case (26-04 · T1)
expected: |
  scripts/e2e/uat-live.test.ts — the A3-live case no longer references the MIGR-02-deleted
  handoff filenames (FROZEN_HANDOFFS array removed). It asserts on-disk frozen verdict-string
  equivalence (READY_FOR_HUMAN_REVIEW) between the sequential AGENTS.md role-load path and the
  /grugops sub-agent dispatch path. A new gated A3-live-N case spawns N (= wip_limit = 3) real
  `claude` dispatches against ONE shared absolute queue+context root, asserting N distinct
  un-clobbered notes + claim-exactly-once + task in done/. Loud-skip and never-set-approval
  keystones preserved; arg-array spawnSync only (no shell). Static greps + regression suite
  (784 passed / 1 skipped) + freshness all pass.

  NOTE: this item was queued for manual confirmation only because the SUMMARY's coverage block
  used invalid `kind:` values (static/build, not in the allowed enum) → the classifier could not
  auto-pass it. The underlying verifications themselves all passed. Confirm the retarget looks
  right (or say what's off).
result: issue
reported: |
  User ran the full `npm run test` (authed box → live lane executed) on 2026-07-03. The
  STRUCTURAL retarget is correct (no deleted handoff filenames, verdict/note-set anchors,
  loud-skip + never-set-approval keystones present — those greps pass). But the live cases
  FAIL when actually run — the first time this lane has ever been exercised live (26-04
  SUMMARY: "the live e2e lane was NOT executed"):
    • A1 (386s) — vitest "timed out in 5000ms": the live it() cases pass no test-timeout
      arg → inherit the 5000ms default while each claude call is bounded at CALL_TIMEOUT_MS
      = 300s; vitest can't interrupt the synchronous spawnSync, so it reports a 5s timeout
      but blocks for minutes. (Setup bug.)
    • A2 (15s) — the prod-deploy guard ACTUALLY FIRED ("Production deploy blocked: humans
      decide, agents execute…"); the safety invariant held. Failure is an over-strict exact
      substring assertion vs the model's markdown-narrated output (`**Production deploy
      blocked:**`). Not a safety regression.
    • A3 (601s ≈ 2×300s) — both dispatch sessions hit the 300s per-call cap and were killed
      before emitting READY_FOR_HUMAN_REVIEW; captured seq="" sub="".
    • A3-N (63s) — 0 notes vs 3: the live claude dispatch did not execute the injected
      `node runner.mjs` command, so nothing was written to the shared context root. The
      deterministic analog worktree-dogfood.test.ts passed (claim.js/context-io.js are fine).
severity: major

### 3. Human runbook retargeted onto on-disk note-set + verdict (26-04 · T2)
expected: |
  docs/dogfood-human-runbook.md — the dual-path "same artifact" is now the on-disk admitted
  note-set (shared-context findings carrying the frozen §14-gate stamp) + the frozen verdict
  string READY_FOR_HUMAN_REVIEW. No deleted handoff filenames remain. Step 4 records a capture
  date + verdict string as retirement-gate evidence, keeping the runbook a valid D-01 captured
  live-run instrument. Same schema-validation flag as T1 (verifications passed). Confirm the
  runbook reads correctly as a capture instrument.
result: [pending]

### 4. A3/DOG-02 retirement correctly DEFERRED (26-05)
expected: |
  The evidence-gated retirement was DEFERRED — you chose "defer: no capture yet" at the blocking
  human-verify checkpoint, because condition (b) "one captured live dual-path run recorded" was
  absent (the live e2e lane was deliberately not run — real tokens / hang risk). Per the DEFER
  branch, nothing was flipped to retired:
    • A3/DOG-02 stays pending
    • examples/03-ticket-to-pr.md untouched (parity CC-native cell still "pending human")
    • .planning/REQUIREMENTS.md carries an honest "PENDING — DEFERRED (2026-07-02)" note
    • DOGF-01/02/03 mechanical deliverables stand (marked done)
  Confirm this deferral is the intended state (retirement waits for a future captured live run).
result: [pending]

### 5. DOGF-01 · single-source dual-path equivalence comparator
expected: projectTaskState drops nonce id; assertEquivalent returns diff string[]
result: pass
source: automated
coverage_id: 26-01-D1

### 6. DOGF-01 · oracleDualPathEquivalence Tier-1 oracle folded into aggregator
expected: replays one seed two ways in hermetic roots; same note-set + done/ artifact + frozen verdict
result: pass
source: automated
coverage_id: 26-01-D2

### 7. DOGF-02 · N-worktree single-slot claim-exactly-once
expected: N worktrees + N children on one shared root; single-slot task claimed exactly once
result: pass
source: automated
coverage_id: 26-02-D1

### 8. DOGF-02 · shared multi-writer notes, no worktree shadowing
expected: N distinct un-clobbered notes; negative shadow-check proves no per-worktree context
result: pass
source: automated
coverage_id: 26-02-D2

### 9. DOGF-02 · sweepStale reclaims stale claim, spares fresh
expected: stale claim reclaimed (task + subtask → pending/), fresh claim untouched; non-vacuous
result: pass
source: automated
coverage_id: 26-02-D3

### 10. DOGF-03 · honest UNKNOWN when no usage object
expected: measureCost returns "UNKNOWN - verify", no fabricated number
result: pass
source: automated
coverage_id: 26-03-D1

### 11. DOGF-03 · UNKNOWN even for usage-shaped payload (schema unconfirmed)
expected: still "UNKNOWN - verify" for a usage-shaped payload (D-10)
result: pass
source: automated
coverage_id: 26-03-D2

### 12. DOGF-03 · never throws on garbage input
expected: never throws; "UNKNOWN - verify" for malformed/garbage input
result: pass
source: automated
coverage_id: 26-03-D3

### 13. DOGF-03 · never fabricates a number; .js twin fresh
expected: no branch populates a numeric field; committed .js twin freshness-fresh
result: pass
source: automated
coverage_id: 26-03-D4

## Summary

total: 13
passed: 10
issues: 1
pending: 2
skipped: 0
blocked: 0

## Gaps

- truth: "The Tier-2 live dual-path harness (A1/A2/A3/A3-N) runs green against the real claude CLI"
  status: failed
  reason: "User ran full `npm run test` on an authed box (2026-07-03); all 4 live e2e cases failed on first-ever live execution. Structural retarget is correct; live execution is not."
  severity: major
  test: 2
  root_cause: |
    Four distinct harness defects, newly surfaced (lane never run live before, per 26-04 SUMMARY):
    (A1) live it() cases pass no vitest test-timeout arg → inherit 5000ms default while each
         claude call is bounded at CALL_TIMEOUT_MS=300s; synchronous spawnSync can't be
         interrupted, so vitest reports a 5s timeout but blocks for minutes.
    (A2) over-strict exact-substring assertion (`r.out.includes("Production deploy blocked:
         humans decide, agents execute.")`) vs the model's markdown-narrated output. The guard
         DID fire — safety invariant held; only the assertion mis-scored it.
    (A3) both dispatch sessions hit the 300s per-call cap and were killed before emitting
         the READY_FOR_HUMAN_REVIEW verdict (heavy agentic "take it to a PR" sessions).
    (A3-N) the live claude dispatch did not execute the injected `node runner.mjs` command
         → 0 notes on the shared context root. Fragile: depends on a live agent choosing to
         run an arbitrary bash command.
  artifacts:
    - path: "scripts/e2e/uat-live.test.ts"
      issue: "A1/A3: no per-test vitest timeout on the live it() cases (lines 226, 341); A2: over-strict DENY substring (line 320-324); A3-N: harness relies on the live agent to execute node runner.mjs (line 473-479)"
  missing:
    - "Add an explicit long per-test timeout (>= N × CALL_TIMEOUT_MS) as the it() 4th arg on A1/A2/A3/A3-N"
    - "A2: assert the guard-deny semantics without exact LLM-narration matching (e.g. match the frozen substring ignoring markdown, or assert the block outcome, not verbatim prose)"
    - "A3: reduce session scope or raise CALL_TIMEOUT_MS so the verdict is reachable; fail honestly if not"
    - "A3-N: drive the runner deterministically rather than hoping the live agent runs a bash command"
  debug_session: ""  # diagnosed inline in UAT session; no debug agents spawned
  note: |
    Not in phase-26 CLOSEOUT scope by 26-05's DEFER: the captured live dual-path run was
    already deferred, so A3/DOG-02 retirement correctly stays pending. This gap is the live
    HARNESS quality, distinct from the (green) DOGF-01/02/03 mechanical deliverables.
  awaiting_routing: |
    User asked to choose (AFK at 2026-07-03T16:49Z): (A) diagnose+plan fixes now [no live
    re-run], (B) note & continue UAT / file separately, (C) fix setup+assertion bugs inline.
    Recorded honestly; no agents spawned, no fixes applied, live lane NOT re-run pending choice.

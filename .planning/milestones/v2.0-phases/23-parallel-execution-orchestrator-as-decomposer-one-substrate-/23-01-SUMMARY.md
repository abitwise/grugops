---
phase: 23-parallel-execution-orchestrator-as-decomposer-one-substrate
plan: 01
subsystem: queue-config-and-now-running-render
tags: [config-dial, queue, now-running, freshness-gate, security-carve-out, CLAIM-03]
status: complete
requires:
  - scripts/claim.ts (claimTask / sweepStale first-at-trusted discipline)
  - scripts/context-io.ts (render / atomicWrite / cell patterns)
  - scripts/context-freshness.ts (clone target)
provides:
  - queue config object (queue.wip_limit / queue.claim_cap / queue.stale_ttl_minutes) on all 3 surfaces
  - renderNowRunning(queueRoot) + `now-running` CLI subcommand on claim.js
  - .grugops/queue/now-running.md derived render (D-14)
  - scripts/now-running-freshness.ts queue-rooted drift gate (Pitfall 5)
  - package.json freshness:queue script
affects:
  - Plan 23-02 (Orchestrator reads queue.wip_limit as the CLAIM-03 width cap)
  - Plan 23-03 (now-running.md is the SC2 width-evidence source)
tech-stack:
  added: []
  patterns:
    - 3-surface atomic config dial (json + .md twin + seed)
    - deterministic zero-token freshness-gated render
    - first-at-trusted single-line discipline (no permissive multi-match parser)
    - standalone queue-rooted freshness gate (own package.json script)
key-files:
  created:
    - scripts/config-queue-consistency.test.ts
    - scripts/now-running-freshness.ts
    - scripts/now-running-freshness.js
    - scripts/now-running-freshness.test.ts
  modified:
    - agent-factory/config/factory.config.json
    - agent-factory/config/factory.config.md
    - agent-factory/seed/.grugops/factory.config.json
    - scripts/claim.ts
    - scripts/claim.js
    - package.json
decisions:
  - "queue config is a NEW top-level object sibling to wip_limits (D-06/D-07) — never folded into per-column wip_limits"
  - "renderNowRunning lives in claim.ts (it owns claimed/<task>/claim.md) — RESEARCH A2 / PATTERNS recommendation"
  - "the now-running render reuses sweepStale first-at-trusted / multi-at tamper discipline — no new permissive frontmatter parser (V5 / T-23-01)"
  - "queue freshness is a dedicated standalone gate re-rooted at .grugops/queue/ (Pitfall 5 — context-freshness only walks .grugops/context/)"
metrics:
  duration: ~5m
  completed: 2026-06-21
  tasks: 2
  files: 10
---

# Phase 23 Plan 01: Queue Config + Now-Running Render Summary

The two independent Phase-23 foundations: the `queue` config dial (`wip_limit`/`claim_cap`/`stale_ttl_minutes`) across the 3-surface atomic dial (D-06), and the deterministic `now-running.md` queue render (D-14) plus its dedicated queue-rooted freshness gate (Pitfall 5) — both additive, both unblocking Plans 02 and 03.

## What was built

### Task 1 — `queue` config object across 3 surfaces (commit 0e50447)

Added a top-level `queue: { wip_limit: 3, claim_cap: 2, stale_ttl_minutes: 30 }` object as a sibling to `wip_limits` and `context` on all three config surfaces, byte-consistent:

- `agent-factory/config/factory.config.json` — new top-level key after `context`.
- `agent-factory/seed/.grugops/factory.config.json` — identical object (the foundation guard asserts the two JSONs stay byte-identical; they do).
- `agent-factory/config/factory.config.md` (twin, clear voice) — a summary row in the top key table, a `### queue sub-fields` section documenting each key's default and meaning, and a sentence in the zero-config default-on-absent paragraph. Crucially (D-07) it documents `queue.wip_limit` (concurrent agent WIDTH / CLAIM-03) as **independent** from the pre-existing per-column `wip_limits` (board-column flow), with an explicit "changing one never changes the other" statement.

`scripts/config-queue-consistency.test.ts` is the D-06 cross-surface consistency oracle: parses both JSON surfaces, asserts the `queue` object is present and deep-equal across them, asserts the locked `3/2/30` defaults, asserts the queue object did not swallow or nest inside `wip_limits`, and asserts the twin documents each key by name plus the width-vs-flow distinction.

### Task 2 — `renderNowRunning` + queue-rooted freshness gate (commit 38eaa91, TDD)

`renderNowRunning(queueRoot)` added to `scripts/claim.ts`: reads every `claimed/<task>/claim.md`, emits a deterministic `.grugops/queue/now-running.md` table (`task | by | since`) sorted by `at` then `task`, with a `GENERATED — do not hand-edit` header and a single trailing newline — byte-reproducible (no wall-clock of its own). An empty/absent `claimed/` yields a header-only render with no crash. A `now-running [queueRoot]` CLI subcommand was added so the gate and `package.json` script can invoke it. The render reuses `claim.ts`'s `atomicWrite`/`cell` patterns (cloned from `context-io.ts`).

**Security carve-out (T-23-01, load-bearing):** the parse reuses `sweepStale`'s first-`at`-trusted / multi-`at`-tampered discipline — it counts `/^at:/gm` and treats any count > 1 as a tampered record that is **skipped, never emitted as a trusted row**. There is no permissive multi-match frontmatter parser. A forged second `at:` line (a queue-lock DoS surface) is rejected, proven by a planted-forgery test asserting the tampered task and its forged far-future timestamp never reach the render.

`scripts/now-running-freshness.ts` is a clone of `context-freshness.ts` re-rooted from `.grugops/context/` to `.grugops/queue/` (Pitfall 5 — the existing `freshness:context` gate walks `.grugops/context/` only and will never see `now-running.md`). Copied verbatim: the `realpathSync(mkdtempSync(...))` macOS /var-symlink fix (load-bearing — without it the mirrored render silently no-ops at exit 0), the mirror-spawn, the fail-closed non-zero-status branch, the byte-compare + fail-closed unreadable branch, and the greenfield vacuous pass. It is a standalone gate wired as `package.json` `freshness:queue`, exactly how `context-freshness` is wired.

`scripts/now-running-freshness.test.ts` (hermetic temp-dir harness cloned from `claim.test.ts`, drives the committed `.js`, out of the e2e lane): proves byte-reproducible render, the GENERATED header, deterministic sort, the security carve-out (forged second `at:` absent), the gate exits 0 clean and non-zero (naming the file) on mutation, and the greenfield vacuous pass.

## Deviations from Plan

None — plan executed exactly as written. The render home (`claim.ts`), the security carve-out reuse, the gate clone+re-root, and the 3-surface config edit all followed the plan and pattern map. The TDD task landed render + gate + test together because the test drives the committed `.js` (the established claim.test.ts contract).

## Verification

- `npx vitest run scripts/config-queue-consistency.test.ts scripts/now-running-freshness.test.ts scripts/claim.test.ts` — green.
- `npx vitest run scripts/check-foundation-guards.test.ts` — green (config byte-identity intact).
- `npm run freshness` — exit 0 (18 committed `.js` including `claim.js` + `now-running-freshness.js` byte-match a fresh `tsc` rebuild; D-13).
- `npx vitest run --exclude '**/scripts/e2e/**'` — 439 passed, 1 skipped, 0 failed (no regression).
- End-to-end smoke: render is byte-identical across two runs; gate passes clean and fails closed (exit 1, naming the file) on a hand-mutation; forged second `at:` line is absent from the render; empty `claimed/` renders header-only.

## Threat surface

All three plan threat-register mitigations are implemented:
- **T-23-01** (tampering/DoS via forged second `at:` in `claim.md`) — mitigated by the reused first-`at`-trusted / multi-`at`-tamper skip; no permissive parser. Proven by a planted-forgery test.
- **T-23-02** (committed `now-running.md` drift) — mitigated by the queue-rooted freshness gate, fail-closed on drift/unreadable. Proven by the mutation test.
- **T-23-03** (unbounded width via missing `wip_limit`) — mitigated by `queue.wip_limit` default 3 present on all 3 surfaces + default-on-absent documented; the Plan-02 scheduler reads it.

No new security surface beyond the plan's threat model was introduced.

## Self-Check: PASSED

- Created files exist: `scripts/config-queue-consistency.test.ts`, `scripts/now-running-freshness.ts`, `scripts/now-running-freshness.js`, `scripts/now-running-freshness.test.ts` — all FOUND.
- Commits exist: `0e50447` (Task 1), `38eaa91` (Task 2) — both FOUND in git log.

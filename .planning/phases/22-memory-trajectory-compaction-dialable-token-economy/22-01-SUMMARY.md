---
phase: 22-memory-trajectory-compaction-dialable-token-economy
plan: 01
subsystem: infra
tags: [compaction, context-io, carve-out, config-dial, tdd, typescript, node-fs]

# Dependency graph
requires:
  - phase: 20-shared-context-substrate-concurrency-foundation
    provides: context-io.ts (appendNote, readContext, currentState), the per-note schema, the freshness gate
  - phase: 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl
    provides: admit() the §14-gate admission cross-check, emitVerdict(), the refuse/escape-hatch posture
provides:
  - scripts/compactor.ts + committed compactor.js — deterministic carve-out invariant checker (raw thread -> promoted notes)
  - the CMP-02 carve-out check (failed-attempt survival + verified_by/supersedes/by/at intact, un-dialable across all 3 dials)
  - promote() (sole-writer pass-through to appendNote), reVerify() (pass-through to admit), degradeToClaim() (honest UNKNOWN-verify fallback)
  - writeThread() the ephemeral threads/<agent>.md local trajectory tier (D-08) with V12 path-allowlist
  - the context.compaction config dial (aggressive | balanced | retain-raw; lean default aggressive) across both JSON surfaces + factory.config.md
  - the scoped **/.grugops/context/*/threads/ .gitignore entry (D-07)
affects: [phase-23-parallel-fan-out, phase-24-deep-rewiring, workflow-18-context-compaction, plan-22-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Body/frontmatter seam: the agent compresses note bodies (semantic); compactor.ts protects note structure (mechanical, un-cheatable, zero-host-dep)"
    - "Thin helper ON TOP of context-io.js: promotion routes ONLY through appendNote, re-verify ONLY through admit — no forked writer, no new verify loop"
    - "Un-dialable carve-out: the dial governs body verbosity only; the durable note set + load-bearing fields survive identically at every value (D-05)"
    - "Read-at-use, default-on-absent config dial (mirrors quality.* / security.*); byte-twin JSON invariant (D-06)"

key-files:
  created:
    - scripts/compactor.test.ts
    - scripts/compactor.ts
    - scripts/compactor.js
  modified:
    - agent-factory/config/factory.config.json
    - agent-factory/seed/.grugops/factory.config.json
    - agent-factory/config/factory.config.md
    - .gitignore

key-decisions:
  - "compactor.ts is a read-only carve-out checker that never summarizes; promotion stays in context-io.appendNote (single sanctioned write path preserved)"
  - "The CLI `check <threadDir> <promotedDir> [--compaction=<dial>]` verb is the planner-discretion D-02 surface; the dial arg never weakens the carve-out (D-05)"
  - "Failed-attempt ids are extracted from the note body (`FA-1: ...`) or filename so a dropped dead-end is named precisely"
  - "degradeToClaim() empties verified_by and sets confidence: UNKNOWN - verify — never a hand-carried §14-gate stamp (D-12 / Phase-21 escape hatch)"

patterns-established:
  - "Carve-out invariant checker: deterministic field-by-field comparison of raw vs promoted notes; refuse + name-the-fault on any drop"
  - "context.compaction dial: ninth zero-config key, read-at-use, default aggressive on absent key/file"

requirements-completed: [CMP-01, CMP-02, CMP-03]

# Metrics
duration: 6min
completed: 2026-06-18
status: complete
---

# Phase 22 Plan 01: Memory & Trajectory Compaction (carve-out checker + dial) Summary

**Deterministic, un-cheatable carve-out invariant checker (`scripts/compactor.ts`, a zero-host-dep helper ON TOP of `context-io.js` that never summarizes) plus the `context.compaction` body-verbosity dial — landing the mechanical floor of the two-tier memory before Phase 23's fan-out makes the multi-agent token tax real.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-18T09:35:26Z
- **Completed:** 2026-06-18T09:41:xxZ
- **Tasks:** 3
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments
- **CMP-02 carve-out checker:** `compactor.ts` refuses + names the fault when any load-bearing element is dropped on the way from the raw thread to the promoted notes — `verified_by` / `supersedes` / `by` / `at`, or any raw `failed-attempt` id. A faithful set is accepted (exit 0). The carve-out is **un-dialable**: each drop still refuses at `aggressive` / `balanced` / `retain-raw` (D-05).
- **CMP-01 two-tier + sole writer:** `writeThread()` keeps the verbose trajectory in the ephemeral `threads/<agent>.md` tier; only the compact distillation reaches `notes/`. `promote()` is a thin pass-through to `context-io.appendNote` (no forked writer — `guard_context_writes` stays green). The scoped `**/.grugops/context/*/threads/` `.gitignore` entry keeps `notes/` + `index.*` committed while the local scratch stays ephemeral (D-07).
- **CMP-03 dial + re-verify:** `context.compaction` is present (lean default `aggressive`), byte-identical across both JSON surfaces, documented across three `factory.config.md` locations, and defaults to `aggressive` when the key — or the whole file — is absent. `reVerify()` routes through `admit()`; a materially-changed finding is refused and `degradeToClaim()` honestly degrades it to a `claim` with `confidence: UNKNOWN - verify` (D-12).
- **D-13 build contract:** committed `scripts/compactor.js` is byte-fresh vs `compactor.ts` (auto-discovered by the freshness gate — 17 committed `.js` now match a fresh `tsc` rebuild).

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — compactor.test.ts carve-out oracle** - `12d797a` (test)
2. **Task 2: GREEN — compactor.ts carve-out checker + committed compactor.js** - `c016b91` (feat)
3. **Task 3: context.compaction dial — 3 config surfaces + .gitignore** - `b39f2f0` (feat)

_Note: TDD plan — RED (test) precedes GREEN (feat); the carve-out RED cases prove a drop fails before the checker existed._

## Files Created/Modified
- `scripts/compactor.test.ts` - RED-fixture-first vitest oracle: one drop case per carve-out element + GOOD case + dial-invariance + two-tier + sole-writer + re-verify (14 cases)
- `scripts/compactor.ts` - Deterministic carve-out invariant checker; imports `context-io.js`; `check` CLI verb; `writeThread`/`promote`/`reVerify`/`degradeToClaim`/`readCompactionDial` helpers; clear-voice header documenting the body=agent / structure=tool seam
- `scripts/compactor.js` - Committed `tsc` output of `compactor.ts` (freshness-gated, D-13)
- `agent-factory/config/factory.config.json` - top-level `context.compaction = aggressive` (lean default, D-04)
- `agent-factory/seed/.grugops/factory.config.json` - byte-twin of the dial (D-06; `diff` confirms zero divergence)
- `agent-factory/config/factory.config.md` - `### context` sub-field section, the `context.compaction` dial-contract row (un-dialable carve-out, D-05), zero-config paragraph 8->9 keys
- `.gitignore` - scoped `**/.grugops/context/*/threads/` entry for the ephemeral local trajectory tier (D-07); no blanket context ignore

## Decisions Made
- **CLI surface (planner-discretion D-02):** `compactor.ts` exposes a single `check <threadDir> <promotedDir> [--compaction=<dial>]` CLI verb plus pure-function exports the test imports. The dial arg is accepted but **never** weakens the carve-out (an unknown value reads as `aggressive`; the check holds regardless — D-05).
- **Read-only field parse:** `compactor.ts` reads provenance fields off raw + promoted note files with a minimal flat-scalar parser (CRLF-normalized) to compare them. This is read-only — it is **not** a second write path; promotion still routes solely through `appendNote`, so `guard_context_writes` stays green.
- **Failed-attempt id keying:** the load-bearing id is read from the note body (`FA-1: ...`) or the filename, so a dropped dead-end is named precisely in the refusal message.
- **No semantic fold (D-03):** the checker does NO dedup / merge / string-similarity. The only reuse is `context-io.js`'s deterministic primitives. "Drop a duplicate observation" stays the agent's body-compression job.

## Deviations from Plan

None - plan executed exactly as written.

The plan explicitly sequenced the `threads gitignored` test case as RED at Task 2 (the `.gitignore` entry is added by Task 3 in the same wave); after Task 3 all 14 cases are GREEN. This is planned Wave-0 sequencing, not a deviation.

## Issues Encountered
- **Two `it()` callbacks needed `async`:** the RED test used top-level `await import(...)` of `context-io.js` inside two non-async `it` callbacks, which `oxc` rejected at transform time. Marked both callbacks `async` (a test-authoring fix, caught and resolved during the Task 1 RED run before the commit).

## User Setup Required

None - no external service configuration required. Zero external packages installed (zero-host-runtime-dep, D-13/D-15).

## Next Phase Readiness
- The mechanical carve-out floor and the dial are in place for Plan 02 (Workflow 18 `18-context-compaction.md` single-source protocol + the one-line role pointers + the catalog count bump 17->18).
- `compactor.ts`'s `writeThread` / `promote` / `reVerify` / `degradeToClaim` surface is ready for WF18 to reference.
- No blockers. The full regression lane (e2e excluded) is green: 227 passed, 1 skipped.

## Self-Check: PASSED

- Files created/modified all present on disk (compactor.test.ts, compactor.ts, compactor.js, both factory.config.json surfaces, factory.config.md, .gitignore, this SUMMARY).
- All three task commits exist in history: `12d797a` (test), `c016b91` (feat), `b39f2f0` (feat).
- `npx vitest run scripts/compactor.test.ts` → 14 passed.
- `npx vitest run --exclude '**/scripts/e2e/**'` → 227 passed, 1 skipped, 0 failed.
- `npm run build && npm run freshness` → 17 committed .js fresh (compactor.js byte-fresh).
- `npm run freshness:context` → green (no forked context writer).
- `diff` of the two factory.config.json surfaces → zero output (byte-twin holds).

---
*Phase: 22-memory-trajectory-compaction-dialable-token-economy*
*Completed: 2026-06-18*

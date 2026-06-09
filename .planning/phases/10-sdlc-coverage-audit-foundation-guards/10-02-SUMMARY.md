---
phase: 10-sdlc-coverage-audit-foundation-guards
plan: 02
subsystem: testing
tags: [guards, posix-sh, wr-05, voice-lint, byte-budget, build-gate, no-fabrication]

# Dependency graph
requires:
  - phase: 07-shared-home-foundation
    provides: the single-window sequential role-load design (D-08) + the 2 packaging templates + 2 materialized adapters the WR-05 guard scans
  - phase: 10-01
    provides: the SDLC-coverage audit that recorded the adapters.md stale-spawn-prose + WR-05 observations (fixes owned here)
provides:
  - "scripts/check-foundation-guards.sh — the four-guard build-gate aggregator (WR-05 spawn-grant grep, AGENTS.md byte budget, adapter-size ceiling, voice-discipline lint), ships GREEN, fails red on violation"
  - "scripts/check-foundation-guards.test.sh — the fail-proof harness proving each guard fails red on a planted violation + smoke + config-JSON byte-identity"
  - "agent-factory/packaging/adapters.md — corrected dispatch doc (uniform sequential role-load, stale Claude-Code-spawns claim removed)"
affects: [phase-11-personas, phase-14-security, phase-16-migrate, voice-discipline, single-source, wr-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Four-guard POSIX-sh aggregator in one script (D-04, no npm deps) cloned from check-kit-refs.sh house style"
    - "warn() helper (advisory, does NOT increment FAILS) enabling two-tier WARN→FAIL size guards (D-07)"
    - "Hermetic mirror-and-mutate harness: copy guard + inputs into $WORK, plant ONE violation, run guard from the mirror, assert nonzero + finding token"

key-files:
  created:
    - scripts/check-foundation-guards.sh
    - scripts/check-foundation-guards.test.sh
  modified:
    - agent-factory/packaging/adapters.md

key-decisions:
  - "WR-05 guard matches the frontmatter Agent/Task token via two EREs (comma-form + YAML-array-item, incl. scoped Agent(worker)) over the EXACT 4-file scan set; never the prose word spawn (D-08); adapters.md kept OUT of scope (D-09)"
  - "AGENTS.md byte guard two-tier WARN 20480 / FAIL 28672, FAIL below the 32768 Codex cap (D-07); adapter-size guard byte-based two-tier WARN 3072 / FAIL 4096 (D-07)"
  - "Voice-lint section-scoped (awk-strips the single ## Caveman prompt fence) with \\bgrug\\b word-boundary markers so .grugops/ does not false-positive (D-10); forward-compatible for Phase 11's new clear-voice sections with no guard change"
  - "Harness adds a cmp -s config-JSON byte-identity assertion (config/ == seed/.grugops/) to guard the tri-file drift Plan 10-03 must avoid"

patterns-established:
  - "Pattern: ship-GREEN guard + a separate fail-proof harness that plants a REAL violation per guard — the no-fabrication contract made mechanical (mirrors validate.test.sh)"
  - "Pattern: hermetic mirror-and-mutate for a guard with hard-coded repo-relative paths — copy guard + inputs into a $WORK mirror and invoke the guard from there"

requirements-completed: [SDLC-02]

# Metrics
duration: 4min
completed: 2026-06-09
---

# Phase 10 Plan 02: Foundation Guards Build-Gate Summary

**Four mechanical foundation guards (WR-05 frontmatter spawn-grant grep, AGENTS.md byte budget below the Codex cap, adapter-size single-source ceiling, section-scoped voice-discipline lint) in one POSIX-sh aggregator, plus a fail-proof harness that plants a real violation per guard, and the adapters.md stale-spawn-prose correction.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-09T16:03:18Z
- **Completed:** 2026-06-09T16:07:42Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `scripts/check-foundation-guards.sh` — four named guard functions (`guard_wr05`, `guard_agents_bytes`, `guard_adapter_size`, `guard_voice`) in ONE POSIX-sh aggregator (D-04, no npm deps), modeled on `check-kit-refs.sh` house style; ships GREEN over the clean tree (exit 0, ALL CHECKS PASSED); strictly read-only, portable grep flags only.
- WR-05 guard uses the two verified EREs (comma-form `^(tools|allowed-tools):.*\b(Agent|Task)\b` + YAML-array-item `^[[:space:]]*-[[:space:]]*(Agent|Task)\b`, catching scoped `Agent(worker)`) over the exact 4-file scan set; matches the frontmatter token only, never prose "spawn" (D-08); `adapters.md` deliberately OUT of scope (D-09).
- Two-tier byte guards with a new `warn()` helper (advisory, does not increment FAILS): AGENTS.md WARN 20480 / FAIL 28672 (below the 32768 Codex cap, D-07); adapters WARN 3072 / FAIL 4096, byte-based not line-based (D-07).
- Voice-lint is section-scoped — an awk strip of the single `## Caveman prompt` fence, then `\bgrug\b` word-boundary markers (so `.grugops/` never false-positives, D-10) over the three clear-voice role surfaces; documented forward-compat for Phase 11.
- `scripts/check-foundation-guards.test.sh` — hermetic (`mktemp -d` + `trap cleanup EXIT INT TERM`) fail-proof harness; plants exactly one violation per guard into a `$WORK` mirror and asserts each fails red with a finding token (both WR-05 grant shapes, AGENTS.md >28672 B, adapter >4096 B, a voice marker in a clear-voice surface), plus a smoke-green run of the real guard and a `cmp -s` config-JSON byte-identity check. Exits 0.
- `agent-factory/packaging/adapters.md` (D-09) — the stale "Claude Code spawns role agents" factual claim corrected to the uniform single-window sequential role-load (Claude Code table row + the prose paragraph + the conceptual lead paragraph); the conceptual word "spawn" preserved (D-08).

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the four-guard aggregator** - `c6ad7cd` (feat)
2. **Task 2: Author the fail-proof harness + fix adapters.md stale spawn prose** - `1dacbdc` (test)

_Plan metadata commit follows this summary._

## Files Created/Modified
- `scripts/check-foundation-guards.sh` - Four-guard build-gate aggregator (WR-05, AGENTS.md bytes, adapter size, voice-lint); ships GREEN, fails red on violation, read-only.
- `scripts/check-foundation-guards.test.sh` - Fail-proof harness: one planted violation per guard (hermetic mirror-and-mutate) + smoke + `cmp -s` config-JSON byte-identity.
- `agent-factory/packaging/adapters.md` - Corrected dispatch doc: Claude Code now reads as uniform sequential role-load; stale spawn claim removed; conceptual "spawn" framing preserved.

## Decisions Made
None beyond what the plan specified — all four guards, the two EREs, the locked byte thresholds (20480/28672, 3072/4096), the `\bgrug\b` word-boundary marker, the section-scoped awk strip, the `cmp -s` assertion, and the D-09 doc fix were implemented exactly as the plan and RESEARCH/PATTERNS pinned them.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- A `printf '-- guard_wr05 ...\n'` section header in the harness tripped the bash `printf` builtin (`printf: --: invalid option`) because the format string began with a literal `--`. Resolved by switching that one call to `printf '%s\n' '-- guard_wr05 (both grant shapes) --'`. This was a problem during planned work (a POSIX-portability gotcha), not unplanned scope — no deviation rule invoked.

## User Setup Required
None - no external service configuration required. The guards run dev/maintainer-side over grugops's own repo.

## Verification
- `sh scripts/check-foundation-guards.sh` → exit 0, ALL CHECKS PASSED (four guards GREEN over the clean tree).
- `sh scripts/check-foundation-guards.test.sh` → exit 0 (every planted violation fails red + smoke + cmp).
- `grep -iE 'Claude Code.*spawns role agents|spawns a role agent' agent-factory/packaging/adapters.md` → no hits (D-09 fix).
- Full suite green: `check-foundation-guards.sh`, `check-foundation-guards.test.sh`, `validate.test.sh`, `check-kit-refs.sh` all exit 0.

## Next Phase Readiness
- SC2 met: the build gate runs four mechanical foundation guards, each failing red on violation and never fabricating a pass. Every later v1.2 phase (11–17) now writes into a guarded environment.
- The WR-05 guard is the mechanical backpressure for the carried tech-debt regeneration hazard (a regen during the Phase-11 persona overhaul that re-arms an `Agent`/`Task` grant now fails red).
- The voice-lint is forward-compatible: Phase 11's new clear-voice sections are auto-scanned with no guard change.
- No blockers introduced.

## Self-Check: PASSED

- Created files verified present: `scripts/check-foundation-guards.sh`, `scripts/check-foundation-guards.test.sh`, `agent-factory/packaging/adapters.md`, `10-02-SUMMARY.md`.
- Task commits verified present: `c6ad7cd` (Task 1), `1dacbdc` (Task 2).

---
*Phase: 10-sdlc-coverage-audit-foundation-guards*
*Completed: 2026-06-09*

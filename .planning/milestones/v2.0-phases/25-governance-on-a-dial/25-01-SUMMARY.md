---
phase: 25-governance-on-a-dial
plan: 01
subsystem: config
tags: [governance, config-dial, factory.config, context-io, audit, human-admission]

# Dependency graph
requires:
  - phase: 23-parallel-execution
    provides: the `queue` 3-surface config-dial pattern + config-queue-consistency oracle (cloned here for the governance dials)
  - phase: 20-shared-verified-context
    provides: scripts/context-io.ts (the shared-context write path the readGovernanceConfig helper now lives in)
provides:
  - context.human_admission config key (default off) across all 3 config surfaces
  - context.audit_retention config key (default git) across all 3 config surfaces
  - exported readGovernanceConfig(repoRoot?) helper — the ONE shared governance config-read path for 25-02 (hook) and 25-03 (admit)
  - config-governance-consistency.test.ts (3-surface lockstep oracle)
affects: [25-02-admission-guard-hook, 25-03-admit-and-audit-ledger]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "3-surface atomic config dial (kit JSON == seed JSON byte-identical, twin .md documents each key) — same shape as the queue dial"
    - "Read-at-use / default-on-absent / fail-open-to-lean config reader (never throws; returns set values verbatim, no sanitization)"

key-files:
  created:
    - scripts/config-governance-consistency.test.ts
  modified:
    - agent-factory/config/factory.config.json
    - agent-factory/seed/.grugops/factory.config.json
    - agent-factory/config/factory.config.md
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts

key-decisions:
  - "readGovernanceConfig fails OPEN to lean (never throws) because it is the READER; the hook (25-02) is the one that fails CLOSED on a matched admit."
  - "The reader returns present values VERBATIM (no allowed-set validation) so the 25-03 floor-sweep can prove a bogus value still refuses."
  - "Config-location resolution: try .grugops/factory.config.json (repo-dropped) first, then agent-factory/config/factory.config.json (in-kit); repoRoot defaults to the script's own repo root (join(import.meta.dirname, '..'))."

patterns-established:
  - "Governance dials only tighten: each step up adds the named-human / durable-record requirement to more entries; absence of config always runs lean."
  - "D-09 distinction held in prose: audit_retention (governance-record durability) is independent of compaction (note-body verbosity); retained is never a duplicate of retain-raw."

requirements-completed: [GOV-02, GOV-01]

# Metrics
duration: 7min
completed: 2026-06-24
status: complete
---

# Phase 25 Plan 01: Governance Config Foundation Summary

**Two governance config dials (`context.human_admission` default `off`, `context.audit_retention` default `git`) added across all 3 config surfaces in byte-identical lockstep, documented in the twin, plus one exported `readGovernanceConfig` helper that is the single shared config-read path for the 25-02 hook and 25-03 admit().**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-24T06:46Z
- **Completed:** 2026-06-24T06:52Z
- **Tasks:** 2
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments
- Added `context.human_admission` (`off`) and `context.audit_retention` (`git`) to the kit JSON and seed JSON in byte-identical lockstep (diff exits 0), placed beside the existing `context.compaction`.
- Documented both keys in the twin `factory.config.md`: context sub-fields rows, config-dial contract matrix rows with the tighten-only / un-dialable-floor language, default-on-absent doctrine, and the D-09 distinction block (audit_retention vs compaction, modeled on the queue.wip_limit-vs-wip_limits block).
- Added the single exported `readGovernanceConfig(repoRoot?)` helper to `context-io.ts` — read-at-use, default-on-absent, never throws, returns values verbatim — the ONE config-read path 25-02 and 25-03 will import so they cannot diverge.
- Added `config-governance-consistency.test.ts` (6 cases) and a `governance-config` block in `context-io.test.ts` (6 cases).

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the two governance keys across all 3 surfaces (lockstep) + consistency oracle** - `27b77cd` (feat)
2. **Task 2: Add the shared readGovernanceConfig helper to context-io.ts + rebuild .js** - `4df335d` (feat)

_Note: TDD flow per task — the failing test was written first (RED confirmed), then the config/helper change made it GREEN; each task is one combined commit._

## Files Created/Modified
- `agent-factory/config/factory.config.json` - added the two governance keys under `context`
- `agent-factory/seed/.grugops/factory.config.json` - identical edit (byte-identical to kit)
- `agent-factory/config/factory.config.md` - context sub-fields rows, dial-contract matrix rows, default-on-absent paragraph, D-09 distinction block
- `scripts/context-io.ts` - exported `readGovernanceConfig` + `GovernanceConfig` interface
- `scripts/context-io.js` - rebuilt committed output (freshness 0 drift)
- `scripts/context-io.test.ts` - `governance-config` describe block (6 cases)
- `scripts/config-governance-consistency.test.ts` - 3-surface lockstep oracle (6 cases)

## Interface contract (for 25-02 and 25-03 to import identically)

```ts
export interface GovernanceConfig { human_admission: string; audit_retention: string; }
export function readGovernanceConfig(repoRoot?: string): GovernanceConfig;
```

**Config-location resolution rule:** given `repoRoot` (the directory to look in), the helper tries, in order:
1. `<repoRoot>/.grugops/factory.config.json` (the installer-dropped repo config — what the hook points `${CLAUDE_PROJECT_DIR}` at)
2. `<repoRoot>/agent-factory/config/factory.config.json` (the in-kit config)

When `repoRoot` is omitted it defaults to the script's own repo root (`join(import.meta.dirname, "..")`, the same way `freshness.ts` resolves ROOT). On a missing/unreadable/non-JSON file, absent `context` object, or absent key, it returns the lean default for that key (`human_admission`→`"off"`, `audit_retention`→`"git"`) and NEVER throws. A present value is returned verbatim (no sanitization).

**kit↔seed diff is clean:** `diff agent-factory/config/factory.config.json agent-factory/seed/.grugops/factory.config.json` exits 0.

## Decisions Made
- The reader fails OPEN to lean (zero-config always runs lean); failing CLOSED on a matched high-severity admit is the hook's job in 25-02, not this reader's.
- The reader returns garbage values verbatim (no allowed-set validation) so the 25-03 floor-sweep can prove a bogus value still refuses.

## Deviations from Plan

None - plan executed exactly as written. Both JSON surfaces stayed byte-identical, `hooks/guard.ts` was not touched (verified `git diff --quiet` exit 0), no admission logic or audit ledger was built (those are 25-02 / 25-03), and the helper imports node:fs/path/crypto only.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Verification Evidence
- `diff` of the two JSON surfaces exits 0 (byte-identical).
- `node -e "JSON.parse(...)"` — kit JSON is valid.
- `npx vitest run scripts/config-governance-consistency.test.ts` — 6/6 green.
- `npx vitest run scripts/context-io.test.ts` — 63/63 green (incl. the 6 governance-config cases).
- `npx vitest run scripts/check-foundation-guards.test.ts` — 28/28 green (WR-01 + config-dial contract unaffected).
- `npm run build && npm run freshness` — 20 committed .js fresh, 0 drift.
- `git diff --quiet hooks/guard.ts` — exit 0 (byte-frozen guard untouched).

## Next Phase Readiness
- The config foundation is complete: 25-02 (admission-guard PreToolUse hook) and 25-03 (admit() refusal + audit ledger + SC3 floor-sweep) both import `readGovernanceConfig` from `./context-io` so the two read paths cannot diverge.
- No blockers.

## Self-Check: PASSED

All created/modified files exist on disk; both task commits (`27b77cd`, `4df335d`) are present in git history.

---
*Phase: 25-governance-on-a-dial*
*Completed: 2026-06-24*

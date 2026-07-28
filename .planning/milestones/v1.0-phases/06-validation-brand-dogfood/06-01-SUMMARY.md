---
phase: 06-validation-brand-dogfood
plan: 01
subsystem: testing
tags: [validator, node-esm, posix-sh, fixtures, structure-check, no-fabrication, zero-dependency]

# Dependency graph
requires:
  - phase: 03-roles-agents-md-substrate
    provides: 16 role files (8 prefix sections each), root AGENTS.md, 11 checklists, 16 handoffs
  - phase: 04-workflows-cadence-backpressure
    provides: 14 workflow files (9 §18 sections), frozen WORKFLOWS/FROZEN_HANDOFFS/SECTION_HEADINGS name lists, board.md status<->column contract
  - phase: 05-packaging-adapters-install
    provides: install.mjs (stdlib-only ESM + VALIDATE_ROOT-style env-override idiom), hooks/guard.mjs (fail-closed posture), guard.test.sh + install.test.sh harness idiom, .claude-plugin/plugin.json (name), packaging/adapters.md
provides:
  - "scripts/validate-agent-factory.mjs — shippable structure-only Node validator (VAL-01)"
  - "scripts/validate.test.sh — GOOD/BAD fixture self-test proving pass AND fail paths (D-45)"
  - "scripts/fixtures/{good,bad-role-missing-section,bad-config-no-mode,bad-plugin-noname,bad-ticket-mismatch,warn-only-no-trace}/ — committed minimal trees"
affects: [06-02-examples, 06-dogfood, milestone-close, ci]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-tier errors[]/warnings[] finding collector with --strict promotion (D-44)"
    - "Prefix-match section presence (^## prefix), never exact-string, never uniqueness (Pitfall 1/2)"
    - "Vacuous-on-zero-tickets conditional loop (D-43)"
    - "VALIDATE_ROOT env-overridable hermetic root (mirrors install.mjs GRUGOPS_SRC/TARGET)"
    - "Committed GOOD + one-mutation BAD fixture trees referenced by env-override in a guard.test.sh-idiom harness"

key-files:
  created:
    - scripts/validate-agent-factory.mjs
    - scripts/validate.test.sh
    - scripts/fixtures/good/
    - scripts/fixtures/bad-role-missing-section/
    - scripts/fixtures/bad-config-no-mode/
    - scripts/fixtures/bad-plugin-noname/
    - scripts/fixtures/bad-ticket-mismatch/
    - scripts/fixtures/warn-only-no-trace/
  modified: []

key-decisions:
  - "Validator required-file set is the full frozen kit name list (16 roles, 14 workflows, 16 handoffs, 11 checklists, config x2, 4 state files, adapters.md, AGENTS.md); the GOOD fixture therefore carries the complete named set — minimal per-file, complete per-name"
  - "status<->column mismatch finding reworded to literally name both 'status' and 'column' so the harness can grep either token (the plan's status/column assertion)"
  - "Fixtures committed as static files (generated once, then committed) rather than mktemp-built at runtime — D-45's simpler path, deterministic and diffable"

patterns-established:
  - "Pattern 1: prefix-match section presence — assert >=1 line startsWith('## Output'), tolerating parenthetical suffixes and intentional duplicate sections"
  - "Pattern 2: read-only-by-construction validator — every path join(ROOT, fixed-literal); every read/JSON.parse try/catch fail-closed; a parse failure becomes a finding, never a crash"

requirements-completed: [VAL-01]

# Metrics
duration: 7min
completed: 2026-06-04
---

# Phase 6 Plan 01: Structure-Only Validator + GOOD/BAD Self-Test Summary

**Shipped `scripts/validate-agent-factory.mjs` — a stdlib-only Node ESM structure validator (files/sections/config/board↔ticket/traceability/packaging) that is green on grugops's own tree bare and `--strict`, plus a `validate.test.sh` GOOD/BAD fixture harness proving it can both pass and fail with the right finding.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-04T08:21Z (approx)
- **Completed:** 2026-06-04T08:28Z
- **Tasks:** 2
- **Files modified:** 408 (2 scripts + 406 fixture files across 6 trees)

## Accomplishments
- Pure-Node ESM validator: zero npm deps, no `package.json`, imports only `node:fs`/`node:path`/`node:url`; `VALIDATE_ROOT`-overridable root so it self-validates regardless of cwd.
- Two-tier `errors[]`/`warnings[]` collector with `--strict` warning-promotion (D-44); ERRORS → exit 1, WARNINGS → exit 0 bare.
- Prefix-match role (8) and workflow (9) section checks — green on all 16 real roles + 14 real workflows; tolerates `## Output (file + format)` suffixes and the intentional duplicate `## Scope`/`## Risks` (PROJECT.md line 96).
- Vacuous-on-zero-tickets board↔ticket and traceability checks (D-43) — fresh seeded tree validates green.
- `validate.test.sh` in the `guard.test.sh` idiom: asserts validator GREEN on grugops's own tree (bare + `--strict`), GOOD fixture exits 0, each BAD fixture exits nonzero with its finding token, and `warn-only-no-trace` proves `--strict` promotion (exit 0 bare → nonzero `--strict`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the structure-only validator** - `37992af` (feat) — TDD: RED confirmed the validator absent (module-not-found, nonzero), GREEN implemented it to `ALL CHECKS PASSED` on the own tree.
2. **Task 2: GOOD/BAD fixtures + validate.test.sh self-test** - `5528ff1` (test) — 406 fixture files + harness; includes the Rule-1 validator message rewording so the harness `column` token matches.

**Plan metadata:** _(this commit)_ (docs: complete plan)

_Note: this plan's frontmatter is `type: tdd`-adjacent (Task 1 carries `tdd="true"`). The RED gate was the failing `node scripts/validate-agent-factory.mjs` invocation (module not found); the GREEN gate is the passing own-tree run. The decisive REFACTOR-equivalent (BAD-fixture failure proof) lands in Task 2's harness rather than a separate refactor commit._

## Files Created/Modified
- `scripts/validate-agent-factory.mjs` - The VAL-01 structure validator (Node ESM, stdlib-only).
- `scripts/validate.test.sh` - GOOD/BAD + own-tree self-test harness (POSIX sh, guard.test.sh idiom).
- `scripts/fixtures/good/` - Minimal valid tree (full required name set, all sections, zero tickets) → exit 0.
- `scripts/fixtures/bad-role-missing-section/` - orchestrator role drops `## Hard limits` → ERROR.
- `scripts/fixtures/bad-config-no-mode/` - config lacks `mode` → ERROR.
- `scripts/fixtures/bad-plugin-noname/` - `plugin.json` lacks `name` → ERROR.
- `scripts/fixtures/bad-ticket-mismatch/` - ticket `status:` ≠ kebab(`column:`) → ERROR.
- `scripts/fixtures/warn-only-no-trace/` - valid ticket, no traceability row → WARNING (exit 0 bare, nonzero `--strict`).

## Decisions Made
- **Required-file set = full frozen kit name list.** The validator enforces all named roles/workflows/handoffs/checklists/state files, so the GOOD fixture had to carry the complete named set (67 files). "Minimal" applies to per-file content (stub bodies), not to the file count — the validator's contract is fixed by the frozen tree.
- **Fixtures committed as static files**, generated once via a throwaway generator then committed (the generator was not retained). This is D-45's simpler, deterministic path versus `mktemp`-built trees, and keeps the BAD mutations diffable in git.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] status↔column mismatch finding did not contain the literal token "column"**
- **Found during:** Task 2 (running validate.test.sh)
- **Issue:** The harness asserts the `bad-ticket-mismatch` finding names both `status` and `column` (the plan's `status`/`column` acceptance token). The validator's original message `status "..." != kebab("In Development")` contained no lowercase `column`, so the `grep -qi 'column'` case failed.
- **Fix:** Reworded the finding to `status "<s>" does not match column "<c>" (expected kebab "<k>")`, naming both fields. Wording is at the implementer's discretion per the plan.
- **Files modified:** scripts/validate-agent-factory.mjs
- **Verification:** Own tree still green bare + `--strict` (zero tickets never triggers the line); `sh scripts/validate.test.sh` → ALL CHECKS PASSED; both `status` and `column` harness cases pass.
- **Committed in:** 5528ff1 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — a finding-message/test-token mismatch)
**Impact on plan:** The fix is a message-wording change only; no logic, control flow, or exit-code behavior changed. No scope creep.

## Issues Encountered
- The environment's `grep` rejected the PCRE lookahead in one acceptance-criteria spot-check (`from "(?!node:)`). Resolved by verifying stdlib-only with a portable check: list `^import` lines and confirm each ends in `node:*` (3 imports: `node:fs`, `node:path`, `node:url`). No code change needed.

## User Setup Required
None - no external service configuration required. The validator runs with `node scripts/validate-agent-factory.mjs` (Node 18+, present: v24.12.0); the self-test with `sh scripts/validate.test.sh`.

## Next Phase Readiness
- VAL-01 is met and shippable: green on the own tree, proven to fail on each broken fixture, `--strict` promotion proven, zero `package.json`, frozen historical harnesses (`check-structure.sh`, `guard.test.sh`, `install.test.sh`) untouched.
- The validator is ready for the Wave-2 dogfood (DOG-01) to run on its throwaway sample repo and for CI.
- No blockers for the remaining Phase-6 plans (examples, brand collateral, dogfood).

## Self-Check: PASSED

- Files verified present: `scripts/validate-agent-factory.mjs`, `scripts/validate.test.sh`, `scripts/fixtures/good/AGENTS.md`, `scripts/fixtures/bad-plugin-noname/.claude-plugin/plugin.json`, `06-01-SUMMARY.md`.
- Commits verified present: `37992af` (Task 1), `5528ff1` (Task 2).

---
*Phase: 06-validation-brand-dogfood*
*Completed: 2026-06-04*

---
phase: 09-doctor-two-root-validator
plan: 02
subsystem: testing
tags: [validator, two-root, kit-resolution, c3-false-green, node-stdlib, VAL-02]

# Dependency graph
requires:
  - phase: 07-shared-home-foundation-path-rewrite
    provides: "kit-vs-state classification (agent-factory/… + AGENTS.md + .claude-plugin/ = KIT at KIT_ROOT; plans/, memory-bank/, .grugops/ = STATE repo-relative)"
  - phase: 06-validation-brand-dogfood
    provides: "scripts/validate-agent-factory.mjs (stdlib-only structure validator: single ROOT, exists/safeRead/listDir helpers, two-tier errors[]/warnings[] + --strict, read-only by construction)"
provides:
  - "two-root-aware validator: explicit KIT_ROOT (from VALIDATE_KIT_ROOT, NO default) + STATE_ROOT (from VALIDATE_ROOT, else repo root)"
  - "the C3 no-false-green guard: unset VALIDATE_KIT_ROOT → process.exit(1) with a literal '(C3)' message, never a silent '.'-fallback"
  - "forked fail-closed helpers kitExists/kitRead/kitListDir (KIT_ROOT) + stateExists/stateRead/stateListDir (STATE_ROOT)"
  - "classification-routed checks: every existing check resolves under its Phase-7-classified root; the mixed required-files loop is split"
affects: ["09-04 (validate.test.sh two-root fixtures + GOOD-split/BAD-missing-kit/BAD-unset-kit matrix + three-way resolution-parity assertion key off VALIDATE_KIT_ROOT)", "doctor (resolves the kit home by the same rule — SC4 parity)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two explicit roots resolved separately; the kit root is the ONE place 'no fallback' deliberately overrides 'sensible default' (the C3 override)"
    - "Helper fork by root: kit*/state* variants each preserve the verbatim fail-closed try/catch → null/false/[]"
    - "Check routing by Phase-7 classification without coupling to check-kit-refs.sh (D-09 — the two gates agree on classification, never call each other)"

key-files:
  created: []
  modified:
    - "scripts/validate-agent-factory.mjs — split ROOT into KIT_ROOT (no default) + STATE_ROOT, forked the three helpers into kit*/state*, routed every check to its classified root, split the mixed required-files loop, updated the header env contract"

key-decisions:
  - "VALIDATE_KIT_ROOT has NO default — unset is a hard process.exit(1) with the literal '(C3)' tag (D-08); STATE_ROOT keeps VALIDATE_ROOT back-compat (else repo root) so the existing single-tree fixtures remain valid as state-root fixtures (Discretion §4)."
  - "Bare helpers (exists/safeRead/listDir) removed entirely rather than kept as aliases — guarantees every call site is explicitly kit* or state*, so no check can silently resolve against the wrong root."
  - "No check's error/warning text or pass/fail logic changed — only the root each path resolves against (the surgical VAL-02 split); the two-tier errors[]/warnings[] + --strict promotion is byte-untouched."

patterns-established:
  - "C3 no-false-green guard: the validator cannot return green in the dev checkout or with $GRUGOPS_HOME unset because the kit root must be supplied explicitly."
  - "Independent root failure: a broken/absent kit root fails the kit pass regardless of a valid state root (and vice versa)."

requirements-completed: [VAL-02]

# Metrics
duration: 7min
completed: 2026-06-08
---

# Phase 9 Plan 02: Two-Root-Aware Validator Summary

**Killed the C3 false-green in `scripts/validate-agent-factory.mjs` by splitting the single self-defaulting `ROOT` into an explicit `KIT_ROOT` (from a new `VALIDATE_KIT_ROOT` with NO default — unset is a hard `exit(1)` carrying a literal `(C3)` tag) plus a `STATE_ROOT` (from `VALIDATE_ROOT`, else repo root), forking the three filesystem helpers into `kit*`/`state*` variants, and routing every existing check to its Phase-7-classified root — splitting the mixed required-files loop — with all VAL-01 finding semantics and stdlib-only/read-only/no-package.json constraints preserved.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-08T07:05:00Z (approx)
- **Completed:** 2026-06-08T07:12:00Z (approx)
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Replaced the C3 footgun (`ROOT = VALIDATE_ROOT ? resolve(...) : resolve(SCRIPT_DIR, "..")`, which silently defaulted to the dev checkout) with two explicit roots; the kit root has NO default and errors loudly when unset (`VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`).
- Forked the fail-closed helpers into `kitExists`/`kitRead`/`kitListDir` (under `KIT_ROOT`) and `stateExists`/`stateRead`/`stateListDir` (under `STATE_ROOT`), each preserving the verbatim try/catch posture; removed the bare single-root helpers entirely.
- Routed every check by the Phase-7 kit-vs-state classification and split the formerly-mixed required-files loop (which validated `agent-factory/config/*`, `agent-factory/packaging/*`, `AGENTS.md` together with `plans/*` in one loop) into a KIT group and a STATE group — the routing bug PATTERNS.md flagged.
- Documented the new env contract in the header comment (`VALIDATE_KIT_ROOT` REQUIRED no-default; `VALIDATE_ROOT` the back-compat STATE root).

## Task Commits

Each task was committed atomically:

1. **Task 1: Split ROOT into KIT_ROOT (no default) + STATE_ROOT and fork the helpers** - `53b242f` (feat)
2. **Task 2: Route every check to its classified root (split the mixed loop)** - `e1ceb35` (feat)

**Plan metadata:** _(see final docs commit)_

## Files Created/Modified
- `scripts/validate-agent-factory.mjs` - Two-root split: `KIT_ROOT` (from `VALIDATE_KIT_ROOT`, no default + C3 guard) + `STATE_ROOT` (from `VALIDATE_ROOT`, else repo root); forked `kit*`/`state*` helpers; every check routed to its classified root; mixed required-files loop split; header env contract updated. Stays stdlib-only (`node:fs`/`node:path`/`node:url`), read-only, no `package.json`.

## Decisions Made
- **`VALIDATE_KIT_ROOT` has NO default** (D-08): unset → hard `process.exit(1)` with the literal `(C3)` tag, never a `.`-fallback. `STATE_ROOT` reuses `VALIDATE_ROOT` with the repo-root back-compat fallback (Discretion §4) so the existing 8 single-tree fixtures stay valid as state-root fixtures.
- **Bare helpers removed, not aliased**: every call site is now explicitly `kit*` or `state*`, so no check can silently resolve against the wrong root.
- **No finding semantics changed**: only the root each path resolves against was touched; error/warning text, prefix-match section presence, vacuous-on-zero-tickets behavior, the full-segment column match (WR-03), and the `--strict` promotion are all byte-untouched.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Expected harness break, handed off to Plan 04 (not a defect):** The existing `scripts/validate.test.sh` predates this split — it only ever sets `VALIDATE_ROOT` (state), never `VALIDATE_KIT_ROOT`. With the C3 no-default guard now in place, every check in that harness correctly hits the unset-kit-root guard and exits 1 (10 of 11 checks now report the `(C3)` message; the one passing check is the `--strict` promotion, which expects nonzero). **This is the C3 guard working exactly as designed** — it is now impossible to false-green without supplying an explicit kit root. The harness rewrite (a `run_fixture_split <kit_root> <state_root>` driver + the GOOD-split / BAD-missing-kit / BAD-unset-kit / three-way resolution-parity fixtures) is explicitly **Plan 09-04's deliverable** (wave 3, `depends_on: ["09-01","09-02","09-03"]`; its must-haves name exactly these checks). Plan 09-02's own `<verification>` block states: *"Full BAD/GOOD/unset fixture matrix + the three-way resolution-parity assertion are added in Plan 04 (wave 3)."* No action taken here is in scope to change `validate.test.sh`.

## Verification Results

All in-plan verifications pass:

- **Task 1 (automated):** unset `VALIDATE_KIT_ROOT` → `node scripts/validate-agent-factory.mjs` exits 1 and prints `VALIDATE_KIT_ROOT is unset` + `(C3)`. ✅
- **Task 2 (automated):** `VALIDATE_KIT_ROOT=scripts/fixtures/good VALIDATE_ROOT=scripts/fixtures/good node scripts/validate-agent-factory.mjs` → `ALL CHECKS PASSED`, exit 0 (back-compat with the existing combined GOOD fixture). ✅
- **Broken kit root, valid state root:** `VALIDATE_KIT_ROOT=/nonexistent/kit VALIDATE_ROOT=scripts/fixtures/good` → exits 1, first line `missing required role file: agent-factory/roles/orchestrator.md` (kit pass fails independently). ✅
- **Source assertions:** no defaulting ternary on the kit root (`grep 'VALIDATE_KIT_ROOT ?'` is empty); `const KIT_ROOT = resolve(process.env.VALIDATE_KIT_ROOT)`; `STATE_ROOT` derives from `VALIDATE_ROOT` with repo-root back-compat; all 6 forked helpers present with fail-closed try/catch; zero remaining bare `exists`/`safeRead`/`listDir` call sites or definitions. ✅
- **Constraints preserved:** stdlib-only imports (`node:fs`/`node:path`/`node:url`); no `writeFileSync`/`mkdirSync`/`package.json` writes; `test ! -f package.json` after runs. ✅
- **D-09 separation (regression):** `sh scripts/check-kit-refs.sh` exits 0; the validator contains zero `check-kit-refs` references (the two gates stay separate, never call each other). ✅

## Threat Model Coverage

- **T-09-05 (the C3 false-green) — mitigated:** `VALIDATE_KIT_ROOT` has NO default; unset → hard `process.exit(1)` with the explicit `(C3)` message. This is the heart of VAL-02. (Plan 04 adds the BAD missing-kit + BAD unset-kit fixtures that prove it in the harness.)
- **T-09-06 (path/symlink tampering) — mitigated:** every read is `join(KIT_ROOT, rel)` / `join(STATE_ROOT, rel)` with fixed literal rels; no write path is derived from file content; reads stay fail-closed (try/catch → finding).
- **T-09-07 (DoS on a garbled file) — mitigated:** `kitRead`/`stateRead` return `null` on error; a bad file becomes a finding, never an unhandled throw.
- **T-09-03 (deploy-approval env var) — accept (vacuous):** the validator reads only `VALIDATE_KIT_ROOT`/`VALIDATE_ROOT`; it never names the deploy-approval env var.
- **T-09-SC (package installs) — accept (vacuous):** zero packages — Node stdlib only, no `package.json`.

## Next Phase Readiness
- The two-root split is in place; the validator cannot false-green in the dev checkout or with the kit root unset.
- **Ready for Plan 09-04 (wave 3):** the `VALIDATE_KIT_ROOT` env var, the `(C3)` guard message, and the independent kit/state failure behavior are the exact surfaces Plan 04 drives with its GOOD-split / BAD-missing-kit / BAD-unset-kit fixtures and the three-way resolution-parity assertion.
- **Carry-forward note:** `scripts/validate.test.sh` is RED-by-design until Plan 04 adds the two-root driver + fixtures (documented under "Issues Encountered" — expected, not a regression).

## Self-Check: PASSED

- Commits `53b242f`, `e1ceb35` exist in git history.
- `scripts/validate-agent-factory.mjs` (modified) present on disk.
- `09-02-SUMMARY.md` created.

---
*Phase: 09-doctor-two-root-validator*
*Completed: 2026-06-08*

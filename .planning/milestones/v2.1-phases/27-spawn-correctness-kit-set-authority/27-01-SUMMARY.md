---
phase: 27-spawn-correctness-kit-set-authority
plan: 01
subsystem: testing
tags: [typescript, node, vitest, build-guards, set-derivation, referential-integrity]

# Dependency graph
requires:
  - phase: 23-parallel-execution-orchestrator-as-decomposer
    provides: the inverted marker-keyed guard_wr05, stripFencedBlocks(), and the coordinator adapter carrying the spawn grant
  - phase: 15-typescript-tooling-migration
    provides: the tsc-to-committed-.js tooling contract and the freshness gate that auto-walks scripts/
provides:
  - scripts/kit-model.ts — the single derivation authority for the role and workflow corpora (KIT-01)
  - guard_kit_counts — two-sided exact-count enforcement over both derived sets (D-20, D-21 tier 2)
  - guard_referential_integrity — the KIT-03 three-way set-equality oracle (D-09), RED against today's tree
  - parseAgentGrant() — a fence-aware coordinator-grant parser reusing the shared stripFencedBlocks()
  - hermetic RED and GREEN fixture mirrors for the referential-integrity oracle
affects: [27-02 validate-agent-factory set derivation, 27-03, 27-04, 27-05, 27-06 adapter authoring, 27-07, 27-08, 27-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Derive the set, assert the count: one filesystem derivation feeds many consumers, and an exact two-sided count guard makes adding a member a deliberate act"
    - "Two-tier fail-closed (D-21): the library THROWS on a vacuous set because continuing is unsafe; a guard FAILS RED on a wrong set because continuing is safe and CI red is the right signal"
    - "Kit root as an explicit function parameter (D-22) rather than a fourth root env var"
    - "Set-equality oracles report the differing MEMBERS, sorted, not just the cardinalities"
    - "Pin a RED proof as a hermetic fixture so it survives as a regression test after the live tree goes green"

key-files:
  created:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "kit-model.ts reads no environment variable; the kit root is an explicit parameter defaulting to the script-relative repo root (D-22) — the tree already has three root conventions and a fourth would make a derivation module a new authority"
  - "listRoles/listWorkflows throw rather than return [] on an unreadable or filtered-to-empty directory (D-21 tier 1); an empty scan set silently passes every downstream guard"
  - "roleCeiling() stays hand-listed (D-17) and now carries a comment saying so — it is a measurement baseline that already fails closed on an unknown role, and deriving it would convert a fail-closed table into a silently-widening one"
  - "The three per-guard missing-role-file test cases were superseded by the derived exact-count guard rather than preserved: with a derived set a deleted role is undiscovered, so the signal correctly moved up to guard_kit_counts, which no edit to the guard source can satisfy"
  - "The real-tree smoke test was inverted to 'exactly one FAIL and it is KIT-03' rather than deleted, so no other regression can hide behind the expected red"
  - "parseAgentGrant reads only grant-shaped lines (the two guard_wr05 EREs) after the shared fence strip, so prose naming an agent cannot inflate the grant closure"

patterns-established:
  - "Derived-set-with-exact-count: the antidote to the set-literal drift class that produced this milestone's founding defect"
  - "Fixture-pinned RED evidence: prove the oracle fires against a planted mirror, so the proof outlives the broken tree it was written for"

requirements-completed: [KIT-01, KIT-03]

coverage:
  - id: D1
    description: "scripts/kit-model.ts derives the 17-role and 19-workflow corpora from the filesystem, sorted, with the kit root as an explicit parameter and no environment read"
    requirement: KIT-01
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#listRoles keeps only non-underscore .md entries"
        status: pass
      - kind: unit
        ref: "scripts/kit-model.test.ts#the live kit derives exactly ROLE_COUNT roles and WORKFLOW_COUNT workflows"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-21 tier 1 — both derivation functions throw naming the directory on an unreadable, empty, or filtered-to-empty kit directory instead of returning an empty set"
    requirement: KIT-01
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#listRoles THROWS naming the directory when the roles directory is empty (never returns [])"
        status: pass
      - kind: unit
        ref: "scripts/kit-model.test.ts#listWorkflows THROWS when the workflows directory holds only unprefixed entries"
        status: pass
    human_judgment: false
  - id: D3
    description: "guard_kit_counts enforces the exact count in BOTH directions — a 16-role kit and an 18-role kit each fail red naming the derived and expected numbers (D-20)"
    requirement: KIT-01
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#kit count 16 roles (one deleted) → nonzero + names the derived 16 and the expected 17 (D-20 low side)"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#kit count 18 roles (one planted) → nonzero + names the derived 18 and the expected 17 (D-20 high side)"
        status: pass
    human_judgment: false
  - id: D4
    description: "ROLE_FILES and its four downstream consumers (guard_voice, guard_caveman_preserved, guard_role_size, CTX_SCAN) run off the derivation; no hand-listed role path remains in the guard source"
    requirement: KIT-01
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#planted 18th role reaches guard_role_size — ROLE_FILES is derived, not re-listed (D-19)"
        status: pass
      - kind: other
        ref: "grep -c 'agent-factory/roles/orchestrator.md' scripts/check-foundation-guards.ts → 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "guard_referential_integrity implements D-09 (grant ∪ {coordinator} == adapters == roles) with no exception list, naming the differing members in both directions"
    requirement: KIT-03
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#referential integrity RED: today's shape (17 roles, 1 adapter, 7 unresolvable grants) fails naming every set difference"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#referential integrity GREEN: 17 adapters matching 17 roles with a 16-name grant passes"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#referential integrity one-element difference names the single missing adapter, not just the cardinalities"
        status: pass
    human_judgment: false
  - id: D6
    description: "The oracle fails closed on every degenerate input — empty adapter directory, coordinator count != 1, unscoped grant, non-ASCII filename — and its grant parser is fence-aware (T-27-02)"
    requirement: KIT-03
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#referential integrity empty adapter directory fails red — never a vacuous two-empty-sets pass"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#referential integrity ignores a FENCED coordinator grant — no second fence parser (T-27-02)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The RED evidence for ROADMAP success criterion 2: the live tree exits non-zero with exactly one FAIL, and that FAIL is guard_referential_integrity"
    requirement: KIT-03
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#smoke: real tree has exactly one FAIL and it is KIT-03 (RED evidence — flip back to green in plan 27-06)"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js → exit 1; | grep -c '^  FAIL' → 1"
        status: pass
    human_judgment: false

# Metrics
duration: 22min
completed: 2026-07-28
status: complete
---

# Phase 27 Plan 01: Kit-Set Authority and Referential-Integrity Oracle Summary

**`scripts/kit-model.ts` becomes the sole filesystem-derived answer to "which roles and workflows exist", and a three-way set-equality oracle now fails RED against the live tree — 17 roles, 1 adapter, 7 granted names resolving to nothing.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-07-28T19:05:00Z
- **Completed:** 2026-07-28T19:27:00Z
- **Tasks:** 3
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- **KIT-01 kit-set authority.** `scripts/kit-model.ts` derives the 17-role and 19-workflow corpora from the filesystem with the derivation rules lifted verbatim from `generate-catalog.ts`, sorts both, takes the kit root as an explicit parameter (D-22, zero `process.env` reads), and **throws** naming the directory on an unreadable or filtered-to-empty kit directory (D-21 tier 1).
- **The seam is proven end-to-end.** `ROLE_FILES` in `check-foundation-guards.ts` is now `listRoles(ROOT)` mapped onto repo-relative paths — the 17-entry hand-listed array is gone. Four consumers (`guard_voice`, `guard_caveman_preserved`, `guard_role_size`, and `guard_context_writes` via `CTX_SCAN`) run off that single derivation, which is the widest blast-radius proof available that the return shape and the root-passing convention are right.
- **`guard_kit_counts` (D-20 / D-21 tier 2).** Strict two-sided integer equality against the exported constants — 16 fails, 18 fails, only 17 passes — and the PASS line reports both derived numbers rather than a bare PASS, so a zero would be visible as the anomaly it is.
- **`guard_referential_integrity` (KIT-03 / D-09).** Compares role corpus, adapter directory and coordinator grant closure with no exception list anywhere, reports the differing **members** sorted rather than only cardinalities, and fails closed on every degenerate input (unreadable adapter dir, empty adapter dir, coordinator count ≠ 1, unscoped grant with no computable closure, non-ASCII filename).
- **RED evidence captured and pinned.** The live tree now exits 1 with exactly one FAIL. Both the RED and GREEN behaviours are pinned to hermetic planted mirrors, so the RED proof becomes a permanent regression test rather than a screenshot that stops meaning anything after plan `27-06`.

## The KIT-03 RED evidence (ROADMAP success criterion 2)

`node scripts/check-foundation-guards.js` exits **1** with exactly **one** FAIL line. Verbatim:

```
[guard_referential_integrity] role corpus == adapter directory == coordinator grant closure (KIT-03, D-09)
  FAIL  KIT-03 referential-integrity violation — grant ∪ {coordinator} == adapters == roles does not hold:
  roles vs adapters: 17 roles, 1 adapters
    16 role(s) with no adapter file: grugops-agents-md-scribe, grugops-architect-design, grugops-ba-pm, grugops-brownfield-mapper, grugops-compliance-officer, grugops-factory-coach, grugops-frontend-ui, grugops-greenfield-mapper, grugops-incident-responder, grugops-installer, grugops-qe-e2e, grugops-release-manager, grugops-security-nfr, grugops-software-engineer, grugops-system-analyst, grugops-uat-planner
  grant closure vs adapters: 8 granted names (7 in the grant + the coordinator grugops-orchestrator), 1 adapters
    7 granted name(s) resolving to no adapter file: grugops-architect-design, grugops-qe-e2e, grugops-release-manager, grugops-security-nfr, grugops-software-engineer, grugops-system-analyst, grugops-uat-planner
```

This red is **expected and intended** and must not be suppressed, skipped, or downgraded to a warn. Plan `27-06` commits the 17 adapter files and the corrected 16-name grant; that is the commit that turns it green. Two things must be flipped back at that point, and both carry an in-source comment saying so:

1. the smoke case `smoke: real tree has exactly one FAIL and it is KIT-03` → back to `status === 0` / `ALL CHECKS PASSED`;
2. nothing else — the RED fixture case keeps passing unchanged, because it asserts against a planted mirror.

**CI will be red between this commit and `27-06`.** `.github/workflows/ci.yml` runs `check-foundation-guards.js`. That is the signal working.

## Task Commits

Each task was committed atomically:

1. **Task 1: kit-model derivation authority, proven end-to-end through ROLE_FILES** — `23603b7` (feat)
2. **Task 2: kit-model unit tests — vacuity, filters, and two-sided count enforcement** — `ffe5629` (test)
3. **Task 3: KIT-03 referential-integrity oracle, RED against today's tree** — `08d76fd` (feat)

## Files Created/Modified

- `scripts/kit-model.ts` — the KIT-01 single authority: `listRoles`, `listWorkflows`, `ROLE_COUNT`, `WORKFLOW_COUNT`. Explicit kit-root parameter, fixed literal subpaths, throws on vacuity, never calls `process.exit`.
- `scripts/kit-model.js` — the committed compiled twin (`scripts/freshness.ts` auto-walks `scripts/`, so a `.ts` without its `.js` fails red on its own).
- `scripts/kit-model.test.ts` — 14 cases: the `_`-prefix and `NN-` filters, sorted/repeatable output, six throw cases across both functions, the exported constants, and three read-only live-tree assertions.
- `scripts/check-foundation-guards.ts` — derived `ROLE_FILES`/`WORKFLOW_FILES`, new `guardKitCounts()`, new `guardReferentialIntegrity()` + `parseAgentGrant()`, D-17 rationale comment at `roleCeiling()`.
- `scripts/check-foundation-guards.js` — recompiled.
- `scripts/check-foundation-guards.test.ts` — derived `GUARD_INPUTS` role portion, `rolePath()`/`adapterPath()` helpers, `consistentMirror()` GREEN fixture builder, the two `kit count` cases, the D-19 derivation proof, five referential-integrity cases, and the temporarily inverted smoke case.

## Decisions Made

- **Kit root is a parameter, not an env var (D-22, as planned).** `grep -c 'process.env' scripts/kit-model.ts` is `0`. `CHECK_ROOT` remains the guard's single override and the hermetic mirror harness still resolves correctly, because the guard passes its already-resolved `ROOT` down.
- **The derivation failure is caught at the guard's top level.** `listRoles(ROOT)` throwing at module scope would produce a stack trace; instead the guard catches it, prints a named `FAIL` line and exits 1. Fail-closed with a readable message beats fail-closed with a traceback.
- **`guardKitCounts()` runs ahead of the four role guards**, so a broken derivation is named before four downstream guards report on a scan set they should never have received.
- **`parseAgentGrant` restricts itself to grant-shaped lines.** It runs the shared `stripFencedBlocks()` first (never a second fence parser — T-27-02) and then only reads lines matching the two existing `guard_wr05` EREs, so prose that merely names an agent cannot enter the closure. A coordinator carrying an *unscoped* `Agent` grant fails red: an unscoped grant has no computable closure, and silently treating it as "grants everything" would make the D-09 equality unverifiable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The hermetic mirror carried only 16 of the 19 workflows**

- **Found during:** Task 1
- **Issue:** `GUARD_INPUTS` mirrored the 16 workflows in the `guard_context_writes` SCAN set. The new `guard_kit_counts` derives the workflow set from `<CHECK_ROOT>`, so every mirror-based plant case would have failed on `16 != 19` instead of on the violation it planted — masking every other assertion in the file.
- **Fix:** Added `agent-factory/workflows/16-context-read-write.md`, `17-task-claim.md` and `18-context-compaction.md` to `GUARD_INPUTS` with a comment explaining why they are mirrored despite not being in the SCAN set.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** All 34 harness cases pass; each plant case now fails on its own planted violation.
- **Committed in:** `23603b7` (Task 1 commit)

**2. [Rule 3 - Blocking] Three per-guard "missing role file" cases became structurally unreachable**

- **Found during:** Task 1
- **Issue:** `guard_voice missing file`, `guard_caveman_preserved missing role` and `guard_role_size missing role` each deleted a role from the mirror and asserted the guard's `fileExists` branch named it. Those branches only fired because `ROLE_FILES` was a hand-list pointing at a now-absent file. With a derived set a deleted role is simply never discovered, so all three cases would have gone red at the end of Task 1 — but the plan's Task 1 verify requires a green suite.
- **Fix:** Collapsed the three into one case asserting the derived count fails red naming `16` and `17`, with an in-source comment recording *why* the signal moved. This is strictly stronger than what it replaced: the hand-list version could be defeated by deleting the role and its list entry in one commit — a fully green suite over a 16-role kit, which is precisely this milestone's founding defect — whereas the derived exact count cannot be satisfied by any edit to the guard source. The per-guard `fileExists` branches remain in place as TOCTOU defence. In Task 2 this case was renamed to carry the `kit count` selector and joined by its 18-role twin, and the D-17 undocumented-role direction (which *is* still reachable, because `roleCeiling()` is deliberately not derived) got its own case.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `npx vitest run scripts/check-foundation-guards.test.ts -t "kit count"` selects and passes exactly 2 cases; mutation-checked by setting `ROLE_COUNT` to 16 (2 cases went red, reverted).
- **Committed in:** `23603b7` and `ffe5629`

**3. [Rule 3 - Blocking] Four cases asserting a fully green run had no green tree left to assert against**

- **Found during:** Task 3
- **Issue:** Three harness cases (`guard_wr05` fence-immunity, the `guard_voice` refinement calibration, the `guard_context_writes` prose calibration) assert `ALL CHECKS PASSED`, and the smoke case asserts the real tree is green. Once `guard_referential_integrity` was registered, plain `mirror()` (17 roles, 1 adapter) is RED by construction and so is the live tree — all four would have gone red for a reason unrelated to what they test.
- **Fix:** Added `consistentMirror()`, which plants the 16 missing adapter files and re-points the coordinator grant at the full 16-name set — the shape plan `27-06` will commit — and switched the three calibration cases onto it. The smoke case was **inverted rather than deleted**: it now asserts the real tree produces *exactly one* FAIL and that it is KIT-03, so no other regression can hide behind the expected red, with a comment naming `27-06` as the commit that flips it back.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** Full suite green (814 passed, 1 skipped) with the live tree red; `grep -c '^  FAIL'` on the live run is exactly `1`.
- **Committed in:** `08d76fd` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking). No Rule 4 architectural decisions arose.
**Impact on plan:** All three were consequences the plan's own design made inevitable (deriving a set makes "missing member" structurally unreachable; registering a red oracle makes "fully green" unreachable). None expanded scope; each is confined to the test harness that the plan already assigned to Tasks 2 and 3.

## Issues Encountered

- **`tsc` rejected `ROLE_FILES.map(basename)`** — `path.basename`'s optional second `suffix: string` parameter collides with `Array.map`'s `index: number`. Replaced with an explicit arrow. `noEmitOnError` meant the stale `.js` was still on disk and the guard appeared to run fine; only the `tsc` output revealed the failure. Worth remembering: after a build error the guard output you are reading is the *previous* build.
- **Vitest `-t` matches the literal test name.** The referential-integrity cases were initially named `guard_referential_integrity …` (underscore), so the plan's `-t "referential integrity"` selector matched nothing and reported "34 skipped" — a green-looking result for a selector that selected zero tests. Renamed to spaced form; the selector now selects 5.

## Deferred Items

- `CTX_WORKFLOWS` in `check-foundation-guards.ts` is still a hand-listed 16-entry array (the `guard_context_writes` scan set), and it is now 3 short of the 19 shipped workflows. Deriving it is out of scope for this plan (which scoped the re-point to `ROLE_FILES`), but it is the same set-literal drift class and workflows 16/17/18 are currently unscanned for raw context writes. Flagged for a later plan in this phase.

## Known Stubs

None. No placeholder values, no unwired data paths, no skipped tests introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary. The one new read surface — `readdirSync` of `.claude/agents` — is a fixed literal subpath joined to the already-resolved root, matching the documented `generate-catalog.ts` path-traversal posture (ASVS V12, T-27-04).

## Verification Run

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — 814 passed, 1 skipped, 31 files |
| `node scripts/check-foundation-guards.js` | exit **1**, exactly 1 FAIL, `guard_referential_integrity` (intended) |
| `npm run freshness` | exit 0 — 26 committed `.js` match a fresh rebuild |
| `node scripts/check-kit-refs.js` | exit 0 (untouched) |
| `node scripts/check-uat-oracles.js` | exit 0 (untouched — the `WR05_SCAN` identifier collision was not resolved by editing this file) |
| `npx vitest run scripts/kit-model.test.ts` | exit 0 — 14 cases |
| `npx vitest run … -t "kit count"` | exit 0 — exactly 2 cases |
| `npx vitest run … -t "referential integrity"` | exit 0 — 5 cases |

`npm test` was never run — it triggers the live Claude-CLI e2e lane.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan `27-02` can proceed.** `kit-model.ts` is importable, its return shape is pinned (filenames **with** `.md`), and the module header records that `validate-agent-factory.ts` strips the extension at its own call site. The `WR05_SCAN` identifier collision remains untouched in `check-uat-oracles.ts`, as the prohibition required.
- **Plan `27-06` owns the green flip.** It must commit the 17 adapter files and the 16-name coordinator grant, then flip the smoke case back to `status === 0` / `ALL CHECKS PASSED`. Both obligations carry in-source comments naming `27-06`.
- **Expect a red CI** on every commit between here and `27-06`. That is the RED evidence, not a regression.
- **One carried obligation:** `CTX_WORKFLOWS` is still hand-listed and now 3 workflows short of the corpus (see Deferred Items).

## Self-Check: PASSED

All 3 created files, all 3 modified files and the SUMMARY exist on disk; all 3 task commits (`23603b7`, `ffe5629`, `08d76fd`) are present in git history.

---
*Phase: 27-spawn-correctness-kit-set-authority*
*Completed: 2026-07-28*

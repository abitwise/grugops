---
phase: 34-model-effort-dial-pi-support
plan: 15
subsystem: installer
tags: [installer, effort-dial, model-dial, rc-1, wr-03, cross-check, gap-closure]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "the generator's effort announcement lines and resolvedEffortAssignmentsIn (34-01, 34-03); the effort delivery cases (34-10); the WIN-1/WIN-2 censuses (34-11..34-14)"
provides:
  - "RESOLUTION_PROBE_SOURCE reads both dials' announcements through the mirrored module and prints them on one line (results, effortResults)"
  - "AnnouncedAssignment.effort {roles, overrides, levels}, parsed by one helper (oneAnnouncement) that asks the three named conditions for both dials"
  - "readRenderedKeyLines(text, key): one line reader for both dials, asked over the TRANSFORMED text about to be written (readRenderedDials replaces readRenderedAlias)"
  - "effort role-count and effort level-set cross-checks beside the model ones, each refusing the whole adapter class"
  - "six effort refusal cases (level set, a-e) and the four-prefix no-prefix-copy case"
affects: [34-16, 34-17, 34-18, installer, effort-dial]

actuals:
  tokens: 12100
  tasks: 2
  commits: 2

plan_head_before: 7f38d565d4d9d0efef11a62c6eb4d2b404c593ac
plan_head_after: 827d398048ee326eb91b91f14def16e1c032099e

tech-stack:
  added: []
  patterns:
    - "One helper per announcement condition set, parameterised by dial; only the value shape differs per dial"
    - "Dial lines are read off the text about to be written (after transformAdapter), never off the render"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts

key-decisions:
  - "The model arm's input moved from the rendered text to the transformed text; its output is unchanged because transformAdapter rewrites only the kit-slot and banner lines (all model delivery cases stay green)"
  - "Zero `effort:` lines read back as `inherit` (ABSENT_EFFORT_LEVEL), the one effort level install.ts spells, so the read level set is comparable with the announced set"
  - "The refusal words for each dial are chosen inside the hoisted oneAnnouncement function, not module constants, because the --check doctor reaches the render helper above their declaration (temporal dead zone)"
  - "The per-adapter report line still names only `model=`; it is a reporting projection, not a check, and is recorded as RC-1 row R15 rather than changed"

patterns-established:
  - "RC-1: a model-dial check in the installer has its effort arm at the same site through the same code path"

requirements-completed: [EFFORT-04]

coverage:
  - id: D1
    description: "The installer refuses the adapter class when the announced effort level set disagrees with the levels read off the bytes about to be written, and prints both sets"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "install/install.test.ts#effort delivery: an announced effort level SET that disagrees with the rendered bytes installs NOTHING and prints both sets"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each other effort disagreement is refused by its own sentence: no announcement, two announcements, malformed payload, effort role count one short, two effort lines in one adapter"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "install/install.test.ts#effort delivery: (a) the generator prints NO effort assignment line installs NOTHING and names the refusal"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#effort delivery: (b) the generator prints TWO effort assignment lines installs NOTHING and names the refusal"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#effort delivery: (c) the generator prints a MALFORMED effort payload installs NOTHING and names the refusal"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#effort delivery: (d) the announced effort role count is one less than the rendered count installs NOTHING and names the refusal"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#effort delivery: (e) the generator emits two `effort:` lines into ONE adapter installs NOTHING and names the refusal"
        status: pass
    human_judgment: false
  - id: D3
    description: "install.ts holds no copy of any of the four announcement prefixes and imports neither reader"
    requirement: EFFORT-04
    verification:
      - kind: unit
        ref: "install/install.test.ts#model delivery: the installer holds NO copy of either announcement prefix — it consults the module that owns them (R-1, D-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Regression gate on the final tree: build, build parity, typecheck, full suite (e2e lane excluded), freshness:adapters"
    verification:
      - kind: other
        ref: "npm run build && npm run check:build-parity && npm run typecheck && npx vitest run --exclude '**/scripts/e2e/**' && npm run freshness:adapters"
        status: pass
    human_judgment: false

duration: 36min
completed: 2026-10-07
status: complete
---

# Phase 34 Plan 15: Installer effort arm (WR-03, RC-1) Summary

**The installer now reads the generator's effort announcement through the mirrored probe, reads every adapter's `effort:` lines off the text it is about to write, and refuses the whole adapter class when the level set or the role count disagrees, the same way and at the same site as the model check.**

## Performance

- **Duration:** 36 min
- **Started:** 2026-10-07T21:22:11Z
- **Completed:** 2026-10-07T21:58:15Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `RESOLUTION_PROBE_SOURCE` imports `resolvedEffortAssignmentsIn` beside `resolvedAssignmentsIn` (inside the fixed literal; no interpolation, T-29.2-06 / T-34-43) and prints one JSON line carrying `results` and `effortResults`.
- `AnnouncedAssignment` gains `effort: {roles, overrides, levels}`. One hoisted helper, `oneAnnouncement(list, dial)`, asks the three named conditions (not a list; not exactly one announcement; refused by name) for both dials. The effort shape check requires two non-negative integers and a list of strings. Every failure goes through the unchanged sentence "An unreadable announcement is not an agreement". The model arm's sentences are the same bytes as before.
- `readRenderedAlias` is replaced by `readRenderedKeyLines(text, key)`, the one line reader, and `readRenderedDials(text, label)`, which applies each dial's floor. Model needs exactly one `model: ` line (same refusal sentence as before). Effort accepts zero lines (`inherit`) or one, and refuses two or more by name.
- Both dials are read from `transformed.text`, the text the plan entry carries and the write phase writes. Before, the model arm read the raw render. That move is recorded here as the plan asked. The model arm's output does not change, because `transformAdapter` rewrites only the kit-slot and banner lines; every existing model delivery case stays green.
- The effort role-count cross-check sits beside the model one, and the effort level-set cross-check sits beside the alias-set one. Both use the alias arm's wording pattern, and a mismatch refuses the class. The level-set message prints both sets and the model configuration path.

## Task Commits

1. **Task 1: tracer, effort announcement disagrees with the bytes and installs nothing** - `6560d5ec` (feat)
2. **Task 2: other effort refusals, four-prefix no-copy case, mutation proofs, RC-1 table, regression gate** - `827d3980` (test)

## Files Created/Modified

- `install/install.ts`: probe source; `AnnouncedAssignment.effort`; `oneAnnouncement`, `isCount`; `RENDERED_EFFORT_KEY`, `ABSENT_EFFORT_LEVEL`, `readRenderedKeyLines`, `readRenderedDials` (replacing `readRenderedAlias`); dial read moved after the transform; effort role-count and level-set cross-checks.
- `install/install.js`: tsc build of the above (build parity passes).
- `install/install.test.ts`: imports `RESOLVED_EFFORT_PRESET_PREFIX` and `RESOLVED_EFFORT_ASSIGNMENT_PREFIX` from `../scripts/model-tiers.js` (the existing test-side exception). Adds the tracer case, rows (a)-(e), and the extended no-prefix-copy case. No `chmodSync` was added, so the mode census is unchanged, and no new test file was added, so the path-spelling census count of 28 is unchanged.

## Mutation proofs

Each mutation was applied to `install/install.ts`, rebuilt with `npm run build`, run, then reversed from a byte copy and rebuilt. `git status` showed install.ts and install.js identical to the Task 1 commit afterwards.

| # | Mutation | Case run | Result (first red line) |
|---|----------|----------|-------------------------|
| m1, read pre-transform | `readRenderedDials(text, label)` (render, not transformed) **and** `transformAdapter` skips every line starting `effort: ` | "effort delivery: a target's `models.effort` (tiered preset plus one role override) reaches EVERY installed adapter..." | RED, the case's findings array: `"grugops-agents-md-scribe.md (agents-md-scribe): effort lines [], expected [\"effort: max\"]"` (17 entries). A scratch install (GRUGOPS_HOME set) with `{"models":{"effort":{"preset":"tiered"}}}` exited **0** and wrote every adapter with 0 `effort:` lines. No cross-check fired. |
| m1, read post-transform | the same dropping transform, with `readRenderedDials(transformed.text, label)` restored | same case | RED, `AssertionError: expected 3 to be +0`: the install was **refused**. Scratch install exit 3: `.claude/agents/ — the effort levels read out of the rendered adapters are [inherit], while the render announced [high, medium]. ...` and no `.claude/agents` directory was created. |
| m2 | an unreadable effort announcement treated as agreeing (substituted `{roles: <model roles>, overrides: 0, levels: ["inherit"]}`) | (a) "the generator prints NO effort assignment line" | RED: `expected 'status=0 names the refusal: false' to be 'status=3 names the refusal: true'` |
| m3a | announced side not sorted (`[...announced.effort.levels]`) | all 11 "effort delivery" cases | **still GREEN** (11 passed). Reason: the emitter `resolvedEffortAssignmentLine` already writes `levels` sorted, and the mirrored reader keeps that order, so the installer's sort of the announced side is defensive and no reachable input is unsorted. |
| m3b | read side not sorted (`[...new Set(effortOf.values())]`) | all "effort delivery" cases | RED, 2 failed: the tiered + override case (`AssertionError: expected 3 to be +0`) and the tiered second-install case (`expected 3 to be +0`). Adapter file order gives an unsorted level list. |

During m2 the first attempt did not compile (`TS2339`), and `noEmitOnError` kept the old `.js`, so that run's green result meant nothing. A type cast fixed the compile, and the recorded red came from the rebuilt `.js` (grep confirmed the mutation marker was in install.js).

## RC-1 sibling table (re-derived on the final tree)

Search re-run at HEAD `827d3980`:
`git grep -n -e resolveModels -e resolveEfforts -e readModelsConfig -e resolvedAssignmentsIn -e resolvedEffortAssignmentsIn -e resolvedPresetsIn -e resolvedEffortPresetsIn -e RESOLVED_PRESET_PREFIX -e RESOLVED_ASSIGNMENT_PREFIX -e RESOLVED_EFFORT -e readRenderedAlias -e guard_model_assignment -e guard_effort_assignment -- '*.ts'`

411 lines. Per-file counts: install/install.test.ts 27, install/install.ts 4, scripts/adapters-freshness.test.ts 17, scripts/adapters-freshness.ts 12, scripts/board-readonly.test.ts 1 (a fixture string), scripts/check-foundation-guards.test.ts 39, scripts/check-foundation-guards.ts 22, scripts/generate-role-adapters.test.ts 27, scripts/generate-role-adapters.ts 18, scripts/model-dial-consistency.test.ts 1 (a comment), scripts/model-tiers.test.ts 157, scripts/model-tiers.ts 86 (the declarations).

The installer's own hits, verbatim:
```
install/install.ts:500:  'import { resolvedAssignmentsIn, resolvedEffortAssignmentsIn } from "./model-tiers.js";',
install/install.ts:506:  "    results: resolvedAssignmentsIn(input),",
install/install.ts:507:  "    effortResults: resolvedEffortAssignmentsIn(input),",
install/install.ts:3326:// every named refusal (it replaces readRenderedAlias, which read the model dial alone).
```
All three code hits sit inside the `RESOLUTION_PROBE_SOURCE` string literal (each line starts with a quote, so no `import` statement names either reader). `readRenderedAlias` survives only as a comment.

Non-comment code hits in the scripts product files:
```
scripts/adapters-freshness.ts:280  resolvedPresetsIn          / :399 resolvedEffortPresetsIn
scripts/adapters-freshness.ts:329  resolvedAssignmentsIn      / :423 resolvedEffortAssignmentsIn
scripts/check-foundation-guards.ts:2096 readModelsConfig, :2118 resolveModels   / :2429 readModelsConfig, :2442 resolveEfforts
scripts/check-foundation-guards.ts:1989 [guard_model_assignment]                / :2401 [guard_effort_assignment]
scripts/generate-role-adapters.ts:322 readModelsConfig, :326 resolveModels      / :339 resolveEfforts
```

| # | Model-dial check site | Effort arm at planning | Effort arm now | Covered by |
|---|------------------------|------------------------|----------------|------------|
| R1 | scripts/generate-role-adapters.ts, both announcements (:326/:339 resolutions; twin :553/:555 announce lines) | present | present | 34-01, 34-03 |
| R2 | scripts/adapters-freshness.ts:329 (assignment) and :280 (preset) | present (:399, :423) | present | 34-03 |
| R3 | scripts/check-foundation-guards.ts guard_model_assignment (:1989, :2096, :2118) | present (guard_effort_assignment :2401, :2429, :2442) | present | 34-05 |
| R4 | install/install.ts `RESOLUTION_PROBE_SOURCE` calls `resolvedAssignmentsIn` | MISSING | **added** (:500, :507) | 34-15 Task 1 |
| R5 | install/install.ts announcement parse (three named conditions) | MISSING | **added**: `oneAnnouncement(…, "effort")` and the effort shape check | 34-15 Task 1; cases (a), (b), (c) |
| R6 | install/install.ts `readRenderedAlias` (exactly-one floor) | MISSING | **added**: `readRenderedKeyLines` is the one reader, and `readRenderedDials` applies the effort floor (0 or 1) | 34-15 Task 1; case (e) |
| R7 | install/install.ts role-count cross-check against the derived listing | MISSING | **added**: effort role-count check beside it | 34-15 Task 1; case (d) |
| R8 | install/install.ts alias-set cross-check | MISSING | **added**: effort level-set check beside it | 34-15 Task 1; tracer case; m1, m3b |
| R9 | install/install.ts verbatim relay of the generator's announcement lines | present (relayed verbatim) | present, unchanged | — |
| R10 | install/install.test.ts set-disagreement and count cases | MISSING | **added**: tracer level-set case, rows (a)-(e) | 34-15 Tasks 1-2 |
| R11 | install/install.test.ts "holds NO copy of either announcement prefix" | MISSING for the effort prefixes | **added**: all four prefixes and both readers' names | 34-15 Task 2 |
| R12 | install/install.ts `--check` doctor staleness (byte compare against a fresh render through `transformAdapter`) | bytes include both lines | **dispositioned, unchanged**: the byte compare covers both arms. The same-transform limit is closed by reading the transformed text before the write (m1). | — |
| R13 | scripts/validate-agent-factory.ts | no model check, no effort check (IN-05) | **dispositioned**: absent for both dials alike; IN-05 under D-20 | plan 34-17 |
| R14 | scripts/model-tiers.ts unquoted unknown-key refusal text | same in both blocks (WR-04) | **dispositioned**: both arms alike; WR-04 under D-20 | plan 34-17 |
| R15 | install/install.ts per-adapter report line suffix `(KIT=…, model=<alias>)` (found while editing; not matched by the search terms) | effort not printed | **dispositioned, unchanged**: a reporting projection (D-04 "alias is reporting-only"), not a check. Nothing refuses or routes on it, and both dials' values are now cross-checked before it is printed. Adding `effort=` would change a printed line that delivery cases read, which is outside WR-03. | backlog candidate for human triage |

No model-dial check site in the installer is left without an effort arm or a recorded reason.

## Decisions Made

- The dial read was moved after the routing floor (`carriesSlot`) and the banner floor, so it can read `transformed.text`. A rendered file with two faults now reports its slot or banner refusal before its model-line refusal. Every single-fault case gets the same sentence as before.
- `ABSENT_EFFORT_LEVEL = "inherit"` is the only effort-level word install.ts spells. It stands for the generator's "no line means `inherit`" rule (generate-role-adapters.ts writes `effort:` only when the level is not `inherit`). Without it the read set could not be compared with an announcement that lists `inherit`.
- The refusal words live inside `oneAnnouncement` (a hoisted function), not in module constants. See Issues Encountered.
- The no-prefix-copy case keeps its title, because past SUMMARY coverage refs (29.2-01) cite it by name. Its body now covers four prefixes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Module-constant refusal words were in the temporal dead zone for the `--check` doctor**
- **Found during:** Task 1 (whole-file run of install/install.test.ts before commit)
- **Issue:** The first draft held the per-dial words in `MODEL_ANNOUNCEMENT_WORDS` / `EFFORT_ANNOUNCEMENT_WORDS` consts declared beside `AnnouncedAssignment`. The doctor calls `renderAdaptersInMirror` from a line above that declaration, so every `--check` printed `NO VERDICT ... (Cannot access 'MODEL_ANNOUNCEMENT_WORDS' before initialization)`. Six cases went red: four doctor cases, the write-bound `--check` case, and the source-shape case that bounds `renderAdaptersInMirror` by the comment `// The frontmatter key a rendered adapter carries`, which the draft had reworded.
- **Fix:** The words are now chosen inside the hoisted `oneAnnouncement(list, dial)`. The anchor comment's opening words were restored ("The frontmatter key a rendered adapter carries its resolved alias on, and ...").
- **Files modified:** install/install.ts, install/install.js
- **Verification:** install/install.test.ts 403 passed / 1 skipped (the skip already existed) before the Task 1 commit
- **Committed in:** 6560d5ec (the defect never reached a commit)

**2. [Plan wording] Case (e) injects two `effort:` lines into one adapter under zero config**
- The plan said "emits a second `effort:` line into one adapter". Under the zero-config synthetic source the generator writes no first line, so the patch adds two `effort: max` lines to the first synthetic adapter. The reader's two-line refusal names that adapter, which is the behaviour the plan asked to prove.

---

**Total deviations:** 1 auto-fixed (Rule 1) and 1 wording note. **Impact on plan:** none on scope. The fix kept the doctor working.

## Issues Encountered

- `npm run check:build-parity` compares against the git index, so it reports `install/install.js moved` until the rebuilt `.js` is staged. After staging it passed (ALL CHECKS PASSED).

## Verification (final tree)

- Task 1 verify: `npm run build && npx vitest run --exclude '**/scripts/e2e/**' install/install.test.ts -t "delivery"`: 40 passed (Task 1), then 45 passed (Task 2), 0 failed.
- Task 2 verify: `npx vitest run --exclude '**/scripts/e2e/**' install/install.test.ts install/installer-cross-version.test.ts install/installer-write-set.test.ts`: 3 files passed, 857 passed / 1 skipped.
- Regression gate: `npm run build && npm run check:build-parity && npm run typecheck && npx vitest run --exclude '**/scripts/e2e/**' && npm run freshness:adapters` exited 0. Build parity: ALL CHECKS PASSED. Typecheck: clean. Full suite: **103 files passed, 7435 tests passed, 2 skipped**, 991.8s. Freshness: `Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.` The `FAIL` lines in that log are printed by passing tests whose subject is a failing guard.
- Censuses: install/path-spelling-census.test.ts and install/mode-census.test.ts: 2 files, 28 tests passed.
- Acceptance: `git grep -n resolvedEffortAssignmentsIn install/install.ts` prints only probe-literal lines (:500, :507), with no import statement.
- Windows: no claim is made (WIN-3). This plan was run on macOS only.

## Threat surface

No new network endpoint, auth path or schema. The probe source is still a fixed literal with no interpolation, written into the 0700 mkdtemp mirror (T-34-43). No package was installed, and package.json and the lockfile are unchanged (T-34-SC).

## User Setup Required

None.

## Next Phase Readiness

- WR-03 is closed in code and tests. Plans 34-16..34-18 remain (WR-06/WR-07 docs, review dispositions, and the human-pushed windows-latest measurement).
- R15 (the report line names only `model=`) is a backlog candidate for human triage, not a gap.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-07*

## Self-Check: PASSED

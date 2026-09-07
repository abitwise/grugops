---
phase: 31-autonomous-manual-testing
plan: 04
subsystem: testing
tags: [workflow-prose, uat, quality-gate, checkpoints, derived-sets, red-team, mutation-testing]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-01's four-positional emit-verdict CLI and the admit()-only stale-SHA refusal"
  - phase: 31-autonomous-manual-testing
    provides: "31-02's tools/grugops/uat-spec-integrity.js runnable, its 0/1/2 contract and its two loud-skip markers"
  - phase: 31-autonomous-manual-testing
    provides: "31-03's agent-factory/checklists/browser-uat-recipe.md and the @playwright/mcp pin guard"
  - phase: 30-checkpoint-autonomy
    provides: "the closed checkpoint roster, the block|notify|off disposition set and the shipped sign_off_acceptance default"
provides:
  - workflow 05 runs the UAT spec-integrity checker BEFORE the end-to-end lane, with the gate-order sentence and the step list edited together
  - workflow 05's exit 0/1/2 branch, with exit 2 recorded as an error distinct from a clean fail
  - workflow 05's D-16 loud-skip recording rule — an unstamped observation note, the ticket stays In UAT
  - workflow 05's five-slot emit-verdict invocation line, matching the signature plan 01 shipped
  - workflow 06's QE/E2E spec-authoring step through the pinned browser MCP server, with no new role
  - workflow 06's honest statement of when green evidence may advance the ticket, and its attended-lane section
  - scripts/chrome-lane-bar.test.ts — the D-09 structural bar, with both halves mutation-proven
affects: [32 board rendering, any phase touching the gate order or the checkpoint roster]

actuals:
  tokens: 12058
  tasks: 3
  commits: 8
plan_head_before: 8fe32e507d2ed7ea7af5fa511c128a4e28b38c0a
# commits MEASURED with `git rev-list --count 8fe32e5..HEAD` — 7 production commits plus this
# SUMMARY's own docs commit, which also carries the STATE/ROADMAP/REQUIREMENTS close-out, so
# re-running the same command reproduces 8.
# tokens is chars/4 over `git diff 8fe32e5..HEAD` (48235 chars) at the last production commit —
# the estimate's scale, not a harness token count. The plan estimated 58000; the realized diff is
# 4.8x smaller, which is what a prose-and-one-test-file plan costs.

tech-stack:
  added: []
  patterns:
    - "Bound a section extractor at its EDGE, not by its length: a region running to end-of-file is still shorter than its file by the bytes above the anchor, so a length comparison can never see the difference"
    - "Derive the document set a documentation assertion scans, then COMPARE it against the named members rather than reading the members from a literal"
    - "Assert the harness's own premise against `git ls-files`: a walk's coverage gap becomes a named assertion instead of a silence"

key-files:
  created:
    - scripts/chrome-lane-bar.test.ts
  modified:
    - agent-factory/workflows/05-pr-quality-gate.md
    - agent-factory/workflows/06-uat-pack.md
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The human-only rule in workflow 05 Step 4 was NOT re-enumerated: Step 4's rule is a positive allow-list (the bounded loop runs only for lint and UI/E2E code/a11y defects), which already covers a third checker, so the new bullet points at that rule instead of extending the instance list"
  - "The D-16 recording rule lives inside the spec-integrity bullet rather than in a bullet of its own, because that is where the loud skip it describes arises"
  - "Workflow 06 names `.grugops/factory.config.json#checkpoints` and states the disposition vocabulary inline: check-kit-refs Assertion 1 refuses any `agent-factory/config/` reference in kit prose"
  - "The attended-lane section in workflow 06 reuses the recipe's exact heading `## The attended Chrome lane`, so one anchor locates both regions and the concept keeps one name"
  - "The plan's numeric region bound (region shorter than file) was kept but is NOT the control: it was measured surviving an unbounded-extractor mutation, so two edge assertions and a later-section plant were added beside it"
  - "The lane-document set and the walked-source coverage are derived rather than typed, after the red-team pass identified both literals as the project's named set-literal drift class"

patterns-established:
  - "Pattern: mutate the predicate a structural test is built on BEFORE calling the test done — the length bound survived its mutant and would have shipped as a control that controlled nothing"
  - "Pattern: when a workflow documents a tool invocation, run the tool's own argument parser against the documented command line — the --check-browser gap was invisible to every gate and visible in one read of main()"

requirements-completed: [UATX-01, UATX-03, UATX-05]

coverage:
  - id: D1
    description: "The gate runs the UAT spec-integrity checker BEFORE the end-to-end lane, and the gate-order sentence and the step list were edited together so prose and steps cannot disagree"
    requirement: "UATX-05"
    verification:
      - kind: other
        ref: "node -e (the plan's ordering assertion: uat-spec-integrity precedes -> e2e in the gate-order sentence) — ORDER CHECK PASS"
        status: pass
      - kind: other
        ref: "npm run check:imperative-lexicon && check:banned-claims && check:public-docs && check:claim-anchors — ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D2
    description: "The step's applicability is decided by the quality.ui_e2e dial, the branch covers all three exit codes, and exit 2 is recorded as an error distinct from a clean fail and never read as a pass"
    requirement: "UATX-05"
    verification:
      - kind: other
        ref: "grep over agent-factory/workflows/05-pr-quality-gate.md — the dial sentence, the exit-2 sentence and the invocation each present (Task 1 acceptance criteria, re-run individually)"
        status: pass
    human_judgment: true
    rationale: "The greps prove the sentences exist and the gates prove they are in the writing profile. Whether the documented branch MATCHES what a gate operator would do is a reading a human should perform against scripts/runnable-ref/uat-spec-integrity.ts's four-branch reportMeasured — the red-team pass already found one such mismatch (the --check-browser flag) that no gate could see."
  - id: D3
    description: "A Playwright-lane skip is recorded as an unstamped observation note carrying the marker verbatim; no finding, no artifact-ref, no board move, and the ticket stays In UAT"
    requirement: "UATX-05"
    verification:
      - kind: other
        ref: "grep 'unstamped `observation` note' and 'The ticket stays `In UAT`' in agent-factory/workflows/05-pr-quality-gate.md"
        status: pass
    human_judgment: false
  - id: D4
    description: "The workflow's emit-verdict invocation line carries the gate-run commit in its documented position, matching the four-required-positional signature plan 01 shipped"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/admission-protocol-docs.test.ts#05-pr-quality-gate.md names the emission surface that EXISTS — the emit-verdict verb"
        status: pass
      - kind: other
        ref: "grep 'emit-verdict <task> <id> <integrity> <sha> [contextRoot]' — five slots, last optional"
        status: pass
    human_judgment: false
  - id: D5
    description: "QE/E2E authors the UAT spec through the pinned browser MCP server as a step between scenario assembly and coverage validation; no new role is added and the role count every guard derives is untouched"
    verification:
      - kind: other
        ref: "node scripts/check-foundation-guards.js — ALL CHECKS PASSED (guard_kit_counts derives 17 roles / 19 workflows)"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js — ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D6
    description: "Green machine-backed evidence advances In UAT -> Ready to Release only where sign_off_acceptance has been explicitly lowered; the shipped default stays block, no new checkpoint id, no floor touched"
    verification:
      - kind: unit
        ref: "npx vitest run scripts/checkpoints.test.ts — 147 passed, the shipped defaults and the floor set unchanged"
        status: pass
      - kind: other
        ref: "the plan's node -e assertion: `Ready to Release` present, no `dialed to allow` spelling"
        status: pass
    human_judgment: false
  - id: D7
    description: "The set of sources that author a note under the reserved gate identity is derived, its count asserted, and equal to exactly one file; the documented Chrome lane contains no route to that author"
    requirement: "UATX-03"
    verification:
      - kind: unit
        ref: "scripts/chrome-lane-bar.test.ts — 15 passed (author identity + count + denominator floor + git ls-files premise + both discrimination pairs)"
        status: pass
      - kind: other
        ref: "mutation: an empty derivation fails 4 cases; a seeded second author fails 2; a narrowed walk fails the premise case (transcripts in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The section extractor is bounded by the next heading of the same or higher level and never reads to end-of-file"
    verification:
      - kind: unit
        ref: "scripts/chrome-lane-bar.test.ts#the region carries exactly ONE heading at its own level or higher — its own anchor"
        status: pass
      - kind: unit
        ref: "scripts/chrome-lane-bar.test.ts#a forbidden string planted in a LATER section is NOT adopted by the region"
        status: pass
      - kind: other
        ref: "mutation: `if (false && …)` on the bound fails 3 cases (it survived the plan's length assertion alone — transcript in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D9
    description: "The attended Chrome lane was exercised as a live browser session"
    verification: []
    human_judgment: true
    rationale: "UNKNOWN - verify. No live attended browser session was run on this host. What was proven is the STRUCTURAL absence of a route in this repository's sources and in the two documents that define the lane. The lane's live behaviour, its auth predicate and its Windows leg all remain `UNKNOWN - verify` exactly as plan 31-03's recipe records them."

duration: 37 min
completed: 2026-09-07
status: complete
---

# Phase 31 Plan 04: Wiring the mechanisms into the two workflows Summary

**The quality gate now runs the UAT spec-integrity checker before the end-to-end lane with a three-code branch and a loud-skip recording rule, the UAT workflow gained a QE/E2E spec-authoring step and an honest acceptance-checkpoint statement, and a new mutation-proven test derives the one-member set of verdict authors and asserts the documented Chrome lane carries no route into it.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-09-07T15:39:00Z
- **Completed:** 2026-09-07T16:16:00Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- **Workflow 05 invokes the spec-integrity checker before the end-to-end lane**, with the gate-order sentence and the sub-bullet list edited in the same commit. The order sentence had to be split into two sentences to stay inside the profile's 20-word procedural bound, which is what pushed it from a 21-word finding to two sentences of 6 and 18.
- **Applicability is the dial's, never the checker's.** The bullet states that the step rides `quality.ui_e2e`, that a repository claiming no UAT holds no `*.uat.spec.ts` file, and that the checker reports a zero-element derivation as "not performed" (exit `2`) rather than as a pass — which is the right answer when a UAT claim exists and the wrong question when none does.
- **The D-16 recording rule is stated in the same terms the recipe uses**: an unstamped `observation` note carrying the marker verbatim, no finding, no artifact-ref, no board move, the ticket stays `In UAT`, and **a skip is NOT a pass**.
- **The verdict-emission line now shows five positional slots**, the fourth being the commit the gate run was performed against, with the reason stated (a second parser inside a safety path is a second thing to drift) and the benefit stated without overclaiming. No gate-side SHA pre-check was added anywhere — D-03's one authority is untouched, and the file says so.
- **Workflow 06 gained the QE/E2E authoring step** between business validation and coverage validation, pointing at the recipe by name and restating none of it, with the "no new role" sentence written explicitly so a reader does not infer one from a new step.
- **The acceptance statement uses the real names.** `In UAT -> Ready to Release`, the shipped `sign_off_acceptance` default that still stops for a named human, the closed `block | notify | off` vocabulary, and the plain statement that `sign_off_acceptance` is not a safety floor and that no new checkpoint id was added.
- **`scripts/chrome-lane-bar.test.ts` proves the D-09 bar two ways and has been watched fail eleven times** across five distinct mutations, including one the plan's own acceptance criterion would have shipped green.

## Task Commits

1. **Task 1: Workflow 05 — the spec-integrity step, the gate order, and the verdict signature** — `f311c9f` (docs), corrected by `d7b6183` (fix, from red-team pass B)
2. **Task 2: Workflow 06 — the QE/E2E authoring step and the acceptance-checkpoint statement** — `33ec88e` (docs), corrected by `7e47a23` (fix, check-kit-refs)
3. **Task 3: Prove the attended lane has no route to a gate stamp** — `db8c614` (test), hardened by `97415e7` (test, from red-team pass A), with `d0c20d5` (test) bumping the tripwire census the new module moved

**Plan metadata:** the `docs(31-04)` commit carrying this SUMMARY.

## Files Created/Modified

- `agent-factory/workflows/05-pr-quality-gate.md` — the gate-order sentence, the `quality`-dialed preamble, the new UAT spec-integrity sub-bullet (applicability, invocation, `--check-browser`, the three-code branch, the two loud-skip causes, the D-16 recording rule, the human-only short-circuit, the recipe reference), and the Step 5 verdict-emission paragraph
- `agent-factory/workflows/06-uat-pack.md` — the new step 3 with steps 4 and 5 renumbered, the D-04 paragraph in `## Board moves`, and the new `## The attended Chrome lane` section
- `scripts/chrome-lane-bar.test.ts` — 15 cases across four parts, two derived sets with asserted counts, one `git ls-files` premise assertion, and a header naming three residuals it does not close
- `scripts/check-foundation-guards.test.ts` — `TRIPWIRE_MODULES` 54 → 55, re-derived rather than incremented

## Decisions Made

**The human-only rule was referenced, not re-enumerated, and the reason is worth reading.** Step 4 of workflow 05 lists two human-only failures ("a UI/E2E visual-baseline acceptance, and any test-integrity result other than exit `0`") and that list is now one checker short. Extending it was considered and refused. Step 4's actual RULE is the sentence above the list — *the bounded loop runs **only** for agent-fixable failures*, naming lint and UI/E2E code/a11y defects — which is a positive allow-list and already covers a third checker correctly. The new bullet states its own human-only property and points at that rule, exactly as the plan instructed. The instance lists in Steps 4 and 5 are a disclosed incompleteness rather than a silent one: Step 4 itself says "Human-only failures are a RULE, not a list."

**The plan's numeric bound for the section extractor does not discriminate, and the fix was not another number.** The acceptance criterion asked that each extracted region be strictly shorter than its source file. That assertion was written, then the bound was mutated to `if (false && …)` — an extractor reading to end-of-file — and the file stayed **green at 10 passed**. The arithmetic is why: the anchor heading does not sit on line 0, so a region running to EOF is still shorter than its file by exactly the bytes above the anchor. The length comparison is kept as a cheap non-vacuity check and two edge assertions were added beside it — the region carries exactly one heading at its own level or higher, and the text immediately after the region opens with the heading that closed it — plus a plant of both forbidden strings into a LATER section. The mutation now fails three cases.

**Two set literals were closed rather than disclosed.** The red-team pass identified `ATTENDED_LANE_DOCS` and the three-directory walk as hand-maintained sets — this project's named second systemic failure class. The lane-document set is now derived by walking `agent-factory/` for the anchor heading and compared against the named pair, and the walk's coverage is asserted against `git ls-files '*.ts'` with its remainder (`vitest.config.ts`) named and asserted to carry no invocation.

## Red-team passes (a green suite is not proof here)

Two independent adversarial passes were run before the plan was closed, asking how the gate is REACHED rather than only what it refuses. **Both found real defects.**

### Pass A — the D-09 bar

| Probe | Result |
|---|---|
| A1. A verdict author outside the three walked directories | **Live gap.** One tracked non-test `.ts` sits outside the walk (`vitest.config.ts`). **CLOSED** by the new `git ls-files` premise case, which names the remainder and asserts it carries no invocation. Proved by narrowing the walk: dropping `install/` fails the case. |
| A2. An aliased reference — `const f = emitVerdict; f(…)`, or `mod["emitVerdict"](…)` | **Real evasion, measured.** Neither string contains `emitVerdict(`, so neither is reported. **NOT closed** — widening the matcher once per counter-example is the failure this repository has paid for repeatedly. Disclosed in the file header and in `.planning/WINDOWS.md`; what stops such a call is the behavioural refusal in `scripts/context-io.test.ts`. |
| A3. A hand-written `.js` with no `.ts` source | **Refuted.** Every tracked `.js` has a `.ts` sibling, and `npm run freshness` asserts the set equality in both directions. |
| A4. A test file authoring the stamp | Out of scope by design (`.test.ts` excluded); a test writes into a temp context root. Named in the header. |
| A5. A THIRD lane document landing unscanned | **Live gap.** The document set was a typed literal. **CLOSED** by deriving it from the kit. Proved by planting a decoy checklist carrying the anchor heading: three cases fail. |
| A6. An obfuscated spelling of the emitter or the identity inside a lane region | Not closed. The lane documents are ours, so the threat is drift rather than an adversary; recorded here rather than matched against. |

### Pass B — the gate wiring and the D-14 ban set

| Probe | Result |
|---|---|
| B1. A repository with `*.uat.spec.ts` files and `quality.ui_e2e` `off` | **Real hole, disclosed not closed.** The spec-integrity step never runs, so its specs are never checked, while a `clean` test-integrity result can still carry a green verdict. Applicability is the dial's by D-13's own design. Recorded in `.planning/WINDOWS.md`. |
| B2. Does the documented invocation actually reach the browser loud skip? | **Real defect, FOUND AND FIXED (`d7b6183`).** `main()` gates the two-stage probe on `argv.includes("--check-browser")`, and the documented command line omitted the flag — so the bullet listed a could-not-run cause the documented command could never produce. The prose now names the flag and states that the syntax check never depends on a browser. **No gate could see this**: every check in the plan's verify list was green across the defect. |
| B3. Does a finding actually name the file and the line, as the prose claims? | **Confirmed.** Every `findings.push` in `uat-spec-integrity.ts` composes `${relPath}:${lineOf(pos)}: …`. |
| B4. Does exit `2` reach the human-only branch? | **Confirmed by construction.** The bullet states human-only on *any* result other than exit `0`, so a code the checker gains later is covered without an enumeration. |

## Mutation transcripts

Five mutations, eleven case failures, every one measured on this tree:

| Mutation | Cases failed |
|---|---|
| `deriveVerdictAuthors` returns `[]` | 4 (author count, author member, and both discrimination cases) |
| the fixture seeds a second author | 2 — this IS the committed discrimination pair, watched failing in its positive form before it was inverted |
| `if (false && …)` on the extractor's bound, BEFORE hardening | **0 — the mutant survived** |
| `if (false && …)` on the extractor's bound, AFTER hardening | 3 (the one-heading case, the stops-at-a-heading case, the later-section plant) |
| `SOURCE_DIRS` narrowed to drop `install/` | 1 (the `git ls-files` premise) |
| a decoy kit checklist carrying the anchor heading | 3 (the derived-doc equality, the region count, the stops-at-a-heading case) |

The RED that opened Task 3 was watched on real Vitest output: with the four discrimination cases phrased positively, `4 failed | 6 passed`, each failing on the seeded fixture producing exactly the extra author or the forbidden hit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The documented checker invocation could never produce the browser loud skip**
- **Found during:** the mandated red-team pass B, after Task 1 was committed
- **Issue:** Task 1 step 2 required the bullet to name both could-not-run causes, one of which is "a browser lane unusable at either probe stage". `uat-spec-integrity.js` gates that two-stage probe on `--check-browser`, and the documented command line (`node tools/grugops/uat-spec-integrity.js <repo-root>`) omits it. The prose therefore described an outcome the documented command could not reach — prose disagreeing with the shipped mechanism, which this plan's own threat model calls a live defect.
- **Fix:** The bullet now says to add `--check-browser` when the end-to-end lane is due to run, states that the browser probe is opt-in behind that flag, and qualifies the second cause with "which only the flag above reaches".
- **Files modified:** `agent-factory/workflows/05-pr-quality-gate.md`
- **Verification:** read against `main()` in `scripts/runnable-ref/uat-spec-integrity.ts`; all four prose gates, the foundation guards, `check-kit-refs` and the validator green afterwards
- **Committed in:** `d7b6183`

**2. [Rule 3 - Blocking] `check-kit-refs` refuses any `agent-factory/config/` reference in kit prose**
- **Found during:** the full regression suite after Task 2
- **Issue:** Task 2's acceptance-checkpoint paragraph cited `agent-factory/config/factory.config.md` as the home of the disposition vocabulary. `check-kit-refs` Assertion 1 refuses that path in kit prose — the config a host repository writes is `.grugops/factory.config.json`. Eight cases in `scripts/check-kit-refs.test.ts` went red. **This gate is not in the plan's verify list**, which is why Task 2 committed green.
- **Fix:** the sentence now names `.grugops/factory.config.json#checkpoints` (workflow 05's existing idiom) and states the closed vocabulary inline.
- **Files modified:** `agent-factory/workflows/06-uat-pack.md`
- **Verification:** `node scripts/check-kit-refs.js` ALL CHECKS PASSED; `scripts/check-kit-refs.test.ts` 35 passed
- **Committed in:** `7e47a23`

**3. [Rule 2 - Missing Critical] The plan's region-length assertion is not a control**
- **Found during:** Task 3, immediately after the first green run
- **Issue:** The acceptance criterion "each extracted region's length is strictly less than its source file's length" was satisfied, and an unbounded extractor mutant passed it anyway at 10/10 green. A structural assertion that survives its own mutant controls nothing, and the phase ships a safety invariant where project doctrine is explicit that a green suite is not proof.
- **Fix:** two edge assertions and a later-section plant were added beside the length comparison, which is retained as a non-vacuity check.
- **Files modified:** `scripts/chrome-lane-bar.test.ts`
- **Verification:** the same mutation now fails 3 cases (transcript above)
- **Committed in:** `db8c614`

**4. [Rule 2 - Missing Critical] Two hand-maintained set literals inside a safety test**
- **Found during:** red-team pass A
- **Issue:** The lane-document list and the walked-source directory list were typed-out sets — the project's named second systemic failure class. A third lane document, or a source outside the three directories, would have gone unscanned with every assertion green.
- **Fix:** the lane-document set is derived from the kit and compared against the named pair; the walk's coverage is asserted against `git ls-files '*.ts'` with the remainder named and asserted clean.
- **Files modified:** `scripts/chrome-lane-bar.test.ts`
- **Verification:** the decoy-checklist and narrowed-walk mutations (transcript above)
- **Committed in:** `97415e7`

**5. [Rule 3 - Blocking] The tripwire census pins the test-module count two-sided**
- **Found during:** the full regression suite after Task 3
- **Issue:** `TRIPWIRE_MODULES` in `scripts/check-foundation-guards.test.ts` is an EXACT equality on the number of `scripts/*.test.ts` modules, deliberately so — "a module added, removed or renamed out of this scan is a structural event, not corpus growth". Adding `chrome-lane-bar.test.ts` moved it 54 → 55. `scripts/check-foundation-guards.test.ts` is outside this plan's `files_modified`.
- **Fix:** bumped to 55, re-derived rather than incremented (`ls scripts/*.test.ts | wc -l` reports 55, agreeing with the live census), with the reason recorded in the file's established comment style. The frozen `PLAN_29_39_TRIPWIRE.modules` stays at 47.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** 281 passed; full suite 3264 passed, 2 skipped, 0 failed
- **Committed in:** `d0c20d5`

---

**Total deviations:** 5 auto-fixed (1 bug, 2 missing critical, 2 blocking)
**Impact on plan:** Deviations 1 and 3 are the ones a reviewer should read first — each is a case where every check the plan named was green over a real defect, and each was found only by the red-team obligation the plan's own verification section imposes. Deviations 2 and 5 are two gates outside the plan's verify list doing exactly what they were built to do. No scope creep: the only file touched outside `files_modified` is the tripwire constant, which the pin's own comment demands be moved by whoever adds a module.

## Issues Encountered

- **`gsd_run check tdd-red-evidence` — `UNKNOWN - verify`.** The tool parses `node --test` TAP lines and cannot classify Vitest output, as plans 31-01 and 31-02 also recorded. No TAP was synthesized. The RED gate was satisfied manually from real Vitest output (`4 failed | 6 passed`, transcript above).
- **No RED commit exists for Task 3, deliberately.** The task ships no production code, so a committed red test would have left the tree red for a commit with nothing able to turn it green. The RED was watched, its transcript recorded above, and the file committed once in its green discriminating form. Stated rather than left for a reader to infer from the commit graph.
- **`scripts/freshness.test.ts` Test 1 (the known pre-existing 5s-budget flake)** did not fire on any of the three full-suite runs in this plan.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. The one deliberate absence — no `--check-browser` in the default invocation — is documented as a flag rather than left as a silent gap.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary was added, and `package.json` gained no dependency. The three residuals this plan leaves open (the syntactic-predicate evasion, the `ui_e2e: off` hole, and the unexercised live Chrome lane) are recorded in `.planning/WINDOWS.md` rather than as threat flags, because each is a disclosed boundary of a shipped mechanism rather than new surface.

## Verification Results

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/chrome-lane-bar.test.ts scripts/context-io.test.ts scripts/checkpoints.test.ts` | 447 passed |
| Full suite (e2e excluded) | 3264 passed, 2 skipped, 0 failed |
| `check:imperative-lexicon` / `check:banned-claims` / `check:public-docs` / `check:claim-anchors` | `ALL CHECKS PASSED` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-kit-refs.js` | `ALL CHECKS PASSED` |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED` |
| `npm run build && npm run typecheck && npm run check:build-parity` | green; no tracked build output moved |
| `npm run freshness` | 60 committed `.js` fresh |
| `npm run check:nul-bytes` | `ALL CHECKS PASSED` |
| the plan's two `node -e` assertions (gate order; board column + disposition spelling) | both pass |

Task 1's and Task 2's acceptance criteria were re-run individually and all pass. `scripts/checkpoints.ts` and `agent-factory/config/factory.config.json` were not edited: `grep -n 'sign_off_acceptance' scripts/checkpoints.ts` still shows the roster entry at line 127 and the shipped `block` default at line 164, and `scripts/checkpoints.test.ts` stays green at 147.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Phase 31 is complete as planned.** All four plans have summaries, and the three mechanisms plans 01-03 shipped are now invoked by the procedures that use them.
- **Two things a verifier must not mistake for done.** The attended Chrome lane has never been exercised live on this host (`UNKNOWN - verify`), and a repository running `quality.ui_e2e: off` while holding `*.uat.spec.ts` files never reaches the spec-integrity check. Both are recorded in `.planning/WINDOWS.md`.
- **The instance lists in workflow 05 Steps 4 and 5 name two human-only failures and there are now three checkers.** Step 4's rule covers the third correctly, and the lists were deliberately left alone per the plan's instruction. A future phase that wants those lists to be exhaustive should change the RULE's shape, not append to the lists.

## Self-Check: PASSED

Every file named under `key-files` exists on disk (`[ -f ]`), and all seven production commits resolve in `git log --oneline --all`: `f311c9f`, `33ec88e`, `7e47a23`, `db8c614`, `d7b6183`, `97415e7`, `d0c20d5`.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-07*

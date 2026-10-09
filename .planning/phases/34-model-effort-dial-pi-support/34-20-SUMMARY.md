---
phase: 34-model-effort-dial-pi-support
plan: 20
subsystem: installer
tags: [installer, effort-dial, model-dial, per-member-check, rc-1, d-22, d-24, in-07]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "byAdapter in both announcements and one validator (34-19)"
provides:
  - "AnnouncedAssignment carries both dials' byAdapter, read through one installer shape check (announcementShape)"
  - "readRenderedDials asked of the render AND of the text about to be written, floors on both"
  - "dialDisagreements: one per-member comparison of both texts with the announced map, both dials; a missing entry is refused"
  - "the alias-set and level-set cross-checks removed (subsumed); role-count checks kept"
  - "the verifier's reproduction as a committed refusal row, plus 11 more rows"
affects: [install/install.ts agents member loop, install/install.ts probe parse]

actuals:
  tokens: 18300
  tasks: 2
  commits: 2
plan_head_before: 7b367bce03c40439f730e2ae65c6a772c9090e36
plan_head_after: 92333ee1954ee43759fde910997621bd319382e5

tech-stack:
  added: []
  patterns:
    - "Per-member comparison against an announcement built from the generator's own resolution, asked of both the render and the written text"
    - "A test row table carries optional config, premise, multi-twin patches and absent sentences"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts

key-decisions:
  - "D-22's direct rendered-versus-written comparison is not coded: comparing each text with the announced value subsumes it, and each refusal still names which text differs"
  - "Both set cross-checks deleted, not kept as defence in depth: the mirrored validator (rule 8) proves each list equals its map's values and the loop proves each member equals its map value"
  - "The render's floor refusals print before the written text's; a member with a floor refusal is not compared (its value cannot be stated)"
  - "The evasion configuration pins the first stem whose tiered level is not inherit (agents-md-scribe), per the plan's derivation rule; the plan's at-planning note said software-engineer"

patterns-established:
  - "patchSyntheticTwin(src, rel, from, to) patches any mirrored twin, with a function replacer so `$` in a patch is never a replacement pattern"

requirements-completed: [EFFORT-04]

coverage:
  - id: D1
    description: "The verifier's reproduction (tiered + one role inherit, one effort: line dropped by the generator, level set unchanged) is refused by name with exit 3 and 0 adapters"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "install/install.test.ts#effort delivery: (f) the generator drops one adapter's `effort:` line while the level SET is unchanged (verifier's reproduction, D-24)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A line the transform drops (between the kit-slot sentinels) is refused as the written text; the model dial gets the same per-member check (alias swap with the set unchanged); a missing announced entry is refused, both dials"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "install/install.test.ts#model and effort delivery: (1), (2), (3) model, (3) effort"
        status: pass
    human_judgment: false
  - id: D3
    description: "Floors on both texts (render floor per dial, written floor) and one shape check for both announcements (non-integer count, array byAdapter, per dial)"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "install/install.test.ts#model and effort delivery: (4a), (4b), (4c), (5) x4"
        status: pass
    human_judgment: false
  - id: D4
    description: "The two former set rows assert the per-member sentence for every adapter"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "install/install.test.ts#model delivery: an announced alias that disagrees with every rendered adapter ...; effort delivery: an announced effort level that disagrees with every rendered adapter ..."
        status: pass
    human_judgment: false

duration: 43min
completed: 2026-10-09
status: complete
---

# Phase 34 Plan 20: Per-member installer check of both dials against the announced map

**The installer now reads each adapter's `model:` and `effort:` values from both texts, the render and the text about to be written. It compares each value with the value the generator announced for that adapter (`byAdapter`). A difference refuses the whole adapter class by name before any write. The verifier's reproduction (an `effort:` line dropped while the level set stays the same) was installed at exit 0 before this plan. It is now a committed row that exits 3 and installs 0 adapters.**

## Performance

- **Duration:** 43 min
- **Started:** 2026-10-09T09:08:55Z
- **Completed:** 2026-10-09T09:52:37Z
- **Tasks:** 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 3 (install.ts, install.js, install.test.ts)

## Accomplishments

- **Probe parse (IN-07).** One shape function, `announcementShape(value, dial)`, is asked once per dial. It checks that both counts pass `isCount`, that the list is an array of strings (`aliases` or `levels`, the only per-dial difference), and that `byAdapter` is a non-null, non-array object of strings. A failure is named by one sentence pattern: `<the announced resolution | the announced effort resolution> did not carry the declared shape (...)`. It replaces the two old checks, one using `typeof` for the model dial and one using `isCount` for the effort dial. `AnnouncedAssignment` now carries `byAdapter` for both dials.
- **Member loop.** After the banner floor, `readRenderedDials(text, label, "rendered")` and `readRenderedDials(transformed.text, label, "written")` are both asked, and both floors hold. The render's refusals print first. `dialDisagreements` then compares, for both dials, the rendered value and the written value with `byAdapter[name]`, where `name` is the file name without `.md`. A missing entry is refused on that dial. Each refusal names the adapter, the dial, which text, that text's value and the announced value, followed by the standard tail. The plan entry still carries `text: transformed.text`.
- **Removed:** the alias-set and level-set cross-checks, and the `aliasOf` / `effortOf` maps that fed them. The two role-count checks are unchanged.
- **Rows.** These rows were added or converted:
  - row (f) in `effortRefusalRows`, the verifier's reproduction;
  - 11 rows in `memberRefusalRows`;
  - the 2 former set rows, which now assert the per-member sentence for all 17 adapters.

### Refusal sentences (as printed)

```
.claude/agents/<name>.md: the rendered text carries <dial> "<value>", while the generator announced <dial> "<said>" for the adapter <name>. The generator rendered something other than what it announced it resolved.
.claude/agents/<name>.md: the text about to be written carries <dial> "<value>", while the generator announced <dial> "<said>" for the adapter <name>. The install-time transform changed it between the render and the write.
.claude/agents/<name>.md: the render announced no <dial> entry for the adapter <name>, so ...
.claude/agents/<file> would be written carrying <n> line(s) beginning "model: " ...   (written floor; the render floor keeps "was rendered carrying")
```

## Task Commits

1. **Task 1 (tracer): parse, both texts, per-member comparison, reproduction row** - `c0fa273c` (feat). Tracer gate: interactive mode, `end-of-phase`, and the verify step is automated only. The verify was re-run green (46 delivery cases; then the full install.test.ts file, 409 passed and 1 skipped), so expansion went ahead. Before the change, the pre-plan `install.js` ran row (f) and printed `status=0 names the refusal: false`. That is the verifier's finding, reproduced.
2. **Task 2: the other rows** - `92333ee1` (test). Test file only. The installer comments Task 2 lists were already made true in Task 1, in the same edit as the code they describe (see Deviations).

## The rows (all exit 3, own sentence, `install INCOMPLETE`, no installed adapter)

| Row | Stages | Sentence asserted | Also asserted absent |
|-----|--------|-------------------|----------------------|
| (f) reproduction | config `{"models":{"effort":{"preset":"tiered","roles":{"agents-md-scribe":"inherit"}}}}`; twin skips `effort:` for grugops-architect-design. Premises: the announced set holds `inherit` and `high`, and the set with the victim at `inherit` equals it | rendered text carries effort "inherit" ... announced effort "high" for grugops-architect-design | - |
| (1) transform drop | same config; the victim's `effort:` line written between MAT_OPEN/MAT_CLOSE (read out of install.ts) | text about to be written carries effort "inherit" ... announced "high" | the rendered-text sentence |
| (2) model swap | `{"models":{"preset":"tiered"}}`; grugops-architect-design rendered `sonnet` (the alias most adapters carry). Premise: alias set unchanged | rendered text carries model "sonnet" ... announced model "opus" | - |
| (3) model / effort | announced map key `grugops-agents-md-scribe` replaced by `grugops-agents-md-scribe-not-an-adapter`, size unchanged. Premise: the foreign name is not a synthetic adapter | render announced no <dial> entry for the adapter grugops-agents-md-scribe | - |
| (4a) render floor, model | a second `model:` line between the sentinels | `was rendered carrying 2 line(s) beginning "model: "` | the written-floor sentence |
| (4b) render floor, effort | `tiered` effort; a second `effort:` line between the sentinels for grugops-agents-md-scribe | `was rendered carrying 2 line(s) beginning "effort: "` | the written-floor sentence |
| (4c) written floor | the one `model:` line between the sentinels | `would be written carrying 0 line(s) beginning "model: "` | the render-floor sentence |
| (5) x4 shapes | mirrored `readAssignmentPayload` returns unchecked (anchor read out of the twin); announcement with roles 17.5, or `byAdapter` as an array, per dial | the shared shape sentence naming the dial | - |

## Mutation proofs (install/install.ts, rebuilt, restored byte for byte, rebuilt; `git diff --quiet HEAD` confirmed .ts and .js)

| ID | Mutation | Red | First red line |
|----|----------|-----|----------------|
| m1 | the rendered text dropped from the comparison (written only) | (f) only | `AssertionError: expected 'status=3 names the refusal: false' to be 'status=3 names the refusal: true'` (the written text is still refused; the rendered-text sentence is gone) |
| m2 | the written text dropped from the comparison (rendered only) | (1) only | `AssertionError: expected 'status=0 names the refusal: false' to be 'status=3 names the refusal: true'` |
| m3 | the model row of `dialDisagreements` deleted (effort only) | (2) only | `AssertionError: expected 'status=0 names the refusal: false' to be 'status=3 names the refusal: true'` |
| m4 | a missing announced entry `continue`s (agreement) | (3) model and (3) effort | `AssertionError: expected 'status=0 names the refusal: false' to be 'status=3 names the refusal: true'` |
| m5 | the shape check accepts any number for the model dial's counts | (5) model (i) only; model (ii) and both effort rows stayed green | `AssertionError: expected 'status=3 names the refusal: false' to be 'status=3 names the refusal: true'` (refused later by the role-count check instead) |
| m6 | the floors asked only when `which === "written"` | (4a), (4b); (4c) green | `AssertionError: expected 'status=0 names the refusal: false' to be 'status=3 names the refusal: true'` |
| m7 | the written floor accepts zero `model:` lines (alias read as `""`) | (4c) only | `AssertionError: expected 'status=3 names the refusal: false' to be 'status=3 names the refusal: true'` (refused by the per-member comparison instead) |

## RC-1 search (re-run as written in the plan)

`git grep -n -e resolvedAssignmentsIn -e resolvedEffortAssignmentsIn -e readRenderedDials -e readRenderedKeyLines -e RENDERED_MODEL_KEY -e RENDERED_EFFORT_KEY -e 'announced\.' -e aliasOf -e effortOf -e oneAnnouncement -e isCount -e byAdapter -- install/install.ts install/install.test.ts`

- Before: 38 hits (install.ts 35, install.test.ts 3).
- After: 51 hits (install.ts 45, install.test.ts 6).
- `aliasOf` and `effortOf` now have 0 hits. The new install.ts hits are the `byAdapter` fields, `announcementShape`'s `isCount` calls, the two `readRenderedDials` calls, and `dialDisagreements`'s two map reads.
- Code sites after: probe :500-507; `AnnouncedAssignment` :2902/:2907; `announcementShape` :2939-2963; `oneAnnouncement` :2980; `isCount` :3018; parse :3274-3297; `RENDERED_*_KEY` :3360-3361; `readRenderedKeyLines` :3374; `readRenderedDials` :3403-3430; `dialDisagreements` :3461-3462; role counts :5023/:5036; member loop :5122-5123.
- The 3 new test-file hits are the shape rows' payload text (:3457, :3474, :3610).

| # | Model-dial site | Effort arm at planning | After this plan |
|---|-----------------|------------------------|-----------------|
| R1 | probe source (:495-510) | present | unchanged. It relays both readers' results, which now carry `byAdapter` |
| R2 | `oneAnnouncement` | shared | unchanged |
| R3 | model shape (`typeof`) | effort used `isCount` | one function, `announcementShape`, for both dials, including the map. Rows (5) x4, m5 |
| R4 | `readRenderedDials` floors | model exactly one; effort zero or one | asked of both texts, each refusal naming its text. The reason the floors differ is in the docstring: the generator writes no `effort:` line for `inherit` and always writes one `model:` line. Rows (4a/b/c), m6, m7 |
| R5 | role-count checks | present | unchanged |
| R6 | member loop | values used only as a set | per-member comparison of both texts with the announced map, both dials, through `dialDisagreements`. Rows (f), (1), (2), (3) x2, m1-m4 |
| R7 | set cross-checks | set only | removed as subsumed |
| R8 | report line `model=` only | absent | IN-06 deferred, unchanged |
| R9 | `--check` doctor | byte comparison covers both lines | unchanged |
| R10 | install.test.ts rows | effort rows (a)-(e) | (a)-(e) unchanged and green; (f) added; 11 `memberRefusalRows`; the 2 set rows converted to per-member sentences over all 17 adapters |

## Changed comments, before and after (DOC-1)

- **`AnnouncedAssignment`**
  - Before: "The three numbers a consumer can check independently: the member count, how many members an override set, and the sorted distinct aliases the run actually emitted."
  - After: "...the sorted distinct aliases the run emitted, and `byAdapter`, the alias the generator resolved for EACH adapter, keyed by adapter name... The map is what the agents loop compares every adapter's bytes with, member by member; the count is what the role-count check holds to the derived listing." The effort paragraph gains "and the per-adapter level map".
- **Parse comment**
  - Before: "BOTH DIALS THROUGH ONE CODE PATH (plan 34-15, RC-1)... so the effort arm cannot drift from the model arm. Only the shape differs."
  - After: "BOTH DIALS THROUGH ONE CODE PATH, SHAPE INCLUDED (plan 34-15, plan 34-20, RC-1, IN-07)... and the accepted value's shape (counts, list, per-adapter map) by ONE more... The dial's name is the only argument that differs."
- **New `announcementShape` docstring:** one shape check for both dials. It states that until this plan the model arm checked `typeof` and the effort arm `isCount`.
- **`ABSENT_EFFORT_LEVEL`**
  - Before: "Reading zero lines as this word is what makes the level SET read off the bytes comparable with the announced set."
  - After: "...what makes the level read off each text comparable with the announced level for that adapter."
- **`readRenderedDials` docstring**
  - Before: "It is asked ONLY about the TEXT ABOUT TO BE WRITTEN... The set cross-checks below are what bound it..." and "IT IS A REPORTING PROJECTION, NOT A DECISION PREDICATE. Nothing routes, refuses or writes differently because of the VALUES it returns; the alias is printed, and the SETS of values are cross-checked."
  - After: "It is asked about exactly TWO texts... the RENDER... and the TEXT ABOUT TO BE WRITTEN... The floors below hold on BOTH texts" and "ITS VALUES DECIDE REFUSALS (plan 34-20, D-24)... any difference refuses the whole adapter class..." It also records why the two floors differ.
- **New `dialDisagreements` docstring:**
  - what the rendered comparison catches (case B) and what the written comparison catches (case A);
  - that D-22's direct comparison is subsumed;
  - that a missing entry is not agreement.
- **Member-loop header**
  - Before: "READ OUT OF THE BYTES ABOUT TO BE WRITTEN... Since plan 34-15 both are read from the TRANSFORMED text..., not from the render"
  - After: "READ OUT OF BOTH ITS TEXTS — THE RENDER AND THE TEXT ABOUT TO BE WRITTEN... so a line the generator wrote wrong (case B) and a line the transform dropped or changed (case A) are both refused by name."
- **Per-member comment**
  - Before: "BOTH DIALS, READ OUT OF THE TEXT ABOUT TO BE WRITTEN (plan 34-15, D-20, WR-03)..."
  - After: "BOTH DIALS, READ OUT OF BOTH TEXTS (plan 34-20, D-22, D-24, RC-1)... The floors hold on both texts, each its own named refusal, the render's first." A new comment above the comparison call points to `dialDisagreements`.
- **Deleted:** the "THE ALIAS-SET CROSS-CHECK — THE CLOSING OF THE LOOP" and "...AND THE LEVEL-SET CROSS-CHECK FOR THE EFFORT DIAL" comments, together with their code.
- **Search result:** no installer sentence names a set cross-check, and none calls case (B) unrefused or residual. `git grep -n -i -e "case (B)" -e "case B" -e "set cross-check"` over the tree, excluding `.planning`, hits only the new install.ts lines, which say case B is refused. Docs (`install/README.md`, `docs/` outside the audit records, `agent-factory/`) carry no claim about the installer's set checks.

## Decisions Made

- **D-22's direct comparison is not coded.** It is subsumed by the two comparisons with the announced value. Each refusal names its text, so the information is kept.
- **Set checks are deleted.** They are not kept as defence in depth, because they are redundant given validator rule 8 and the per-member loop.
- **Order of reads.** The render's floor refusals come first. A member that fails a floor is not compared: its value cannot be stated.
- **Evasion configuration.** It pins the first stem whose tiered level is not `inherit`. That stem is agents-md-scribe, as the derivation rule gives. The victim is grugops-architect-design, as the plan expected.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] An edit script's `String.replace` read `$` sequences in the replacement as patterns**
- **Found during:** Task 2
- **Issue:** The scratch script that inserted the Task 2 rows used `s.replace(from, to)`. Some `$` sequences in the replacement text were read as replacement patterns, and prefix text was spliced into the file. `tsc` reported syntax errors at unrelated lines.
- **Fix:**
  - `git checkout -- install/install.test.ts` restored only that file to the Task 1 commit `c0fa273c`.
  - The edit was re-applied with a function replacer.
  - The test's own `patchSyntheticTwin` now also uses `before.replace(from, () => to)`, so a patch carrying `$` can never be read as a pattern. All earlier patched-twin rows stay green.
- **Files modified:** install/install.test.ts
- **Committed in:** 92333ee1

**2. [Plan wording] Task 2 made no further install.ts change**
- **Found during:** Task 2
- **Issue:** The comments Task 2 lists (the parse, readRenderedDials, the member loop and the removed set checks) were made true in Task 1, in the same edit as the code they describe. Committing code with comments that contradicted it would have been a false-comment commit.
- **Fix:** Task 2's commit is test-only. The before and after of every comment is quoted above.
- **Committed in:** c0fa273c (comments), 92333ee1 (rows)

**3. [RC-1 coverage] Rows (3) and (5) run on both dials**
- **Found during:** Task 2
- **Issue:** The plan describes row (3) as one victim key. RC-1 asks for the same check on both dials.
- **Fix:** Row (3) runs on both dials. Row (5) has two shapes for each dial (4 rows).
- **Committed in:** 92333ee1

**4. [Derivation] The pinned role is agents-md-scribe, not software-engineer**
- **Issue:** The plan's rule, "the first stem whose tiered level is not `inherit`", yields agents-md-scribe. The plan's note "software-engineer at planning time" does not match its own rule.
- **Fix:** The rule was followed. All premises hold and the victim is unchanged (grugops-architect-design).

---

**Total deviations:** 4 (1 blocking tooling fix, 3 plan-wording or coverage notes). **Impact:** none on scope; product behaviour is as planned.

## Issues Encountered

- **Regression gate:** `npx vitest run --exclude '**/scripts/e2e/**'` reported 102 of 103 files passed. Tests: 7505 passed, 1 failed, 2 skipped (1432.4 s). The single failure is the pre-existing `install/installer-fs-census.test.ts` "UNCLASSIFIED node:fs export openAsBlobSync" under Node v26.11.0. It is already in `deferred-items.md` (34-19) and nothing this plan changed is involved.
- **Task 2 targeted verify:** install.test.ts, installer-cross-version.test.ts and installer-write-set.test.ts ran as 3 files, 869 passed and 1 skipped.
- **Other checks, all green:**
  - `npm run build`
  - `npm run check:build-parity`: ALL CHECKS PASSED after each commit. Before a commit it compares against the committed tree, so it reports install.js as moved until then, as in 34-19.
  - `npm run typecheck`: exit 0
  - `npm run freshness:adapters`: "Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal."
  - `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED
- **Prohibitions held:**
  - no change under `scripts/`;
  - the report line is unchanged (IN-06);
  - the plan entry keeps `text: transformed.text` (structural pin green);
  - no `npm test` and no `git push`;
  - every install in the rows runs with its own `GRUGOPS_HOME` scratch directory (`runInstallFrom(..., mkTmp())`).

## User Setup Required

None.

## Next Phase Readiness

- D-24 and D-22 are closed in the installer. The verifier's reproduction is a committed row.
- Ready for 34-21.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-09*

## Self-Check: PASSED

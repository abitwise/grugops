---
phase: 32-board-projector-cli-dashboard
plan: 36
subsystem: testing
tags: [one-authority-census, refused-complement, ast-census, reachability-proof, typescript, vitest, canonical-form]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "32-12's deletion of the validator's second ticket-frontmatter reader and 32-21's widening of the census from a syntax shape to a capability — the pair predicate and the NOT_A_SECOND_AUTHORITY exemption posture this plan keeps and extends"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-21's `classifyCheckScript` and `CHECK_SCRIPT_CLASSES` — the no-`continue` classification this plan moves from one-script-one-class to one-target-one-row"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-31's canonical-form posture (replace a syntactic complement with a total partition whose refusal is by construction) — the shape the primitive half was rewritten into"
provides:
  - "`namesKey` — the key half decides by the key appearing as a WORD anywhere in a resolved static text, so an alternation group, a concatenation and a join all name the key; the `skeleton` normalization is retained as a normalization rather than a position rule"
  - "`looksLikeTextScan` + `TEXT_CAPABLE_MEMBERS` — the primitive half as a refused complement derived from `String.prototype`/`RegExp.prototype` at test time, so a text-scanning call this pass has never met is admitted automatically"
  - "`NOT_A_TEXT_PRIMITIVE` (3, pinned two-sided, a reason each) — the refusals are members every prototype owns and therefore distinguish nothing"
  - "`staticText`'s `[...].join(sep)` arm — the STATIC half of WINDOWS ledger row 184, symmetric with the `+` arm it sat beside"
  - "`SECOND_READER_PLANTS` / `SECOND_READER_PLANT_COUNT` — four measured second readers plus the control, held as data, each asserted to raise the carrier count"
  - "`carrierVerdict` + `CARRIER_BOUNDARY_ROWS` — zero carriers is a named RED (`vanished-authority`) rather than a satisfied upper bound, and the live tree is judged through the same instrument"
  - "`censusOver(rows)` — the census as a function of its input, sorted by name, so the boundary/adjacency/empty/ordering probes ask the SAME question the live tree is asked"
  - "`classifyCheckScriptTargets` — every gate-module and every suite target in one command, each as its own row naming its script, with `null` kept verbatim for a command with no target"
  - "`CHECK_SCRIPT_CLASSES` as TARGET counts, with a sum equality over the manifest-derived total and an in-memory perturbation case proving the two derivations differ"
affects: [32-37, dashboard-one-authority-census, check-script-reachability, future-ticket-grammar-changes]

actuals:
  tokens: 24598
  tasks: 3
  commits: 3
plan_head_before: a8d29a893bb87c3b41b997085597b06c76f45907

tech-stack:
  added: []
  patterns:
    - "Ask about the PROPERTY, not the position: a predicate whose subject is what precedes the key measures the author's habit, and two authors' habits differ"
    - "Derive the admissible set from the LANGUAGE, not from an author: `String.prototype`/`RegExp.prototype` read at test time admits every string method that exists, including the ones nobody has written yet"
    - "Keep the enumeration as a RECORD and forbid it from disagreeing with the decider: two representations that cannot drift beat one that decides"
    - "Pay for over-detection in named, counted decisions — and name the one that is uncomfortable (a production module carrying an exemption) at the site, in the SUMMARY and in the deferred items"
    - "Write the verdict on BOTH sides of the pinned number: an equality tells you a count is wrong without telling you which way, and zero is not a satisfied upper bound"
    - "When a mutation reds fewer cases than expected, the suite is the finding: M6 red one case because the live manifest cannot tell the two derivations apart, so a perturbed-manifest case was added"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-36-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-36-GREEN-proof.txt
  modified:
    - scripts/validate.test.ts
    - scripts/check-foundation-guards.test.ts
    - .planning/phases/32-board-projector-cli-dashboard/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "PLANT D IS CLOSED BY A THIRD MECHANISM, NOT BY THE KEY HALF — measured, and the plan's attribution corrected at the site. The plan assigned plant D (`[\"c\",\"o\",\"l\",\"u\",\"m\",\"n\"].join(\"\")`) to the key half's position rule. Measured per-predicate, the old `text === k` arm would have matched those keys the moment they RESOLVED: D was invisible because `staticText` resolved `+` and not `.join`. That is a third gap, in the RESOLUTION rather than in either half of the pair, and it needed its own mutation (M5) to prove. The per-plant × per-predicate table is in the GREEN proof § 4."
  - "THE PRIMITIVE COMPLEMENT IS DERIVED FROM THE LANGUAGE, NOT FROM A LONGER LIST. The review offered two fixes: a refused complement, or failing that, add nine more spellings to the table. Adding spellings is the defect with a bigger number, so the complement is `Object.getOwnPropertyNames(String.prototype)` ∪ `RegExp.prototype` read at test time (65 members) minus three refusals. `.matchAll` and `.replace` — the two that walked through — are admitted without anybody adding them."
  - "THE THREE REFUSALS ARE THE MEMBERS EVERY PROTOTYPE OWNS. `constructor`, `toString` and `valueOf` are own properties of `String.prototype` only because every prototype re-declares what `Object.prototype` provides; admitting them would make the primitive half true of every file in the tree, which is a predicate that has stopped discriminating rather than one that has been widened. Mutation M3 confirms the set is a decision register and not a load-bearing narrowing: emptying it moves the count assertion and nothing else."
  - "OVER-DETECTION COST FIVE NEW EXEMPTIONS AND ONE OF THEM IS PRODUCTION CODE. `column` and `status` are ordinary English words, so the presence rule names any file whose prose says them beside a text scan. Four of the five are test suites. The fifth, `scripts/check-diff-disposition.ts`, is a production module, and a file-scoped exemption on a production module is a standing hole one named file wide. It is written into the exemption's own reason, into this SUMMARY, into `deferred-items.md` and into the WINDOWS ledger rather than left for a later reader to discover — the narrowing that would remove it is the move this plan's prohibitions forbid."
  - "THE DISJOINTNESS CASE WAS REPAIRED, NOT DELETED. `no check:* script matches TWO class shapes` existed because the classifier took the first match and a two-shape script would lose one half to arm order. Per-target classification makes two shapes legitimate, so its premise is gone. It now asserts the stronger property the fix bought — every shape a command matches is REPRESENTED in its classification — rather than a disjointness the derivation no longer needs."
  - "THE FIRST-MATCH MUTATION EXPOSED A WEAK SUITE AND THE SUITE WAS STRENGTHENED, NOT THE PROOF NARRATED. M6 initially red ONE case, because the manifest's 11 scripts carry 11 targets and nothing on the live tree distinguishes a script count from a target count. A case was added that perturbs the manifest in memory the way a later author would (one `&& node scripts/*.js` appended): script count 11 → 11, target count 11 → 12. It reds under M6 too, which is what makes the re-pinning a measurement rather than a renamed field."

patterns-established:
  - "Plant the probe into the LIVE input set and run the whole derivation over it, rather than calling the inner predicate directly: the plant cases here ask exactly the question the live tree is asked, so a narrowing anywhere in the chain reds them"
  - "Assert the probe is non-vacuous in its own terms: the adjacency fixture asserts it actually differs from its source, the ordering probe asserts it has more than one carrier to order, and the derived member set asserts a size floor"
  - "Record the measurement that contradicts the plan, at the site — third consecutive plan in this phase to do so (32-35 M2a, 32-36 plant D and M6)"

requirements-completed: [DASH-01, DASH-02, DASH-06]

coverage:
  - id: D1
    description: "A second ticket-frontmatter reader planted under scripts/ is counted as a carrier whichever ordinary way it spells its key names and whichever ordinary way it scans text — inside an alternation group, assembled by concatenation, assembled by joining characters, or written as plain literals with an unenumerated primitive"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#EVERY planted second reader raises the carrier count above one (32-36 § 2)"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#the plant table has exactly the pinned number of rows"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#goes RED on the deleted reader: the exact source that was removed is still caught"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-36-GREEN-proof.txt § 1 and § 4 — four plants at zero added carriers before, all four detected after, and a per-plant × per-predicate table showing each is closed by a different mechanism"
        status: pass
    human_judgment: false
  - id: D2
    description: "The primitive half is a refused complement with named exemptions rather than an enumeration: a text-scanning call this pass has not met before makes a planted second reader visible instead of passing because nobody listed it"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#the derived text-member set is non-vacuous and admits every spelling this repo records"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#every refused member carries a reason, and the refusal set equals its pinned count"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-36-GREEN-proof.txt § 4 M2 — restoring the enumeration loses plants A and C"
        status: pass
    human_judgment: false
  - id: D3
    description: "Over-detection is paid for by named exemptions with a written reason each, pinned two-sided by count, so the live tree still reports exactly one ticket-frontmatter authority and every non-carrier is a decision somebody recorded"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#TICKET_FRONTMATTER_READER_COUNT is 1, and the carrier is scripts/board-model.ts"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#every named exemption is actually detected by the widened derivation"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#the exemption set has exactly the pinned number of members"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-36-GREEN-proof.txt § 2 — the five newly detected files, what names the key in each, and why each is not an authority"
        status: pass
    human_judgment: false
  - id: D4
    description: "The carrier count is exactly one and one step either side is a named failure: zero carriers reds as a vanished authority rather than passing as a satisfied upper bound, and two carriers reds as a second authority"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#the carrier boundary is a case on BOTH sides of one, and zero REDS"
        status: pass
    human_judgment: false
  - id: D5
    description: "Two scanned files whose static texts are identical except for the key spelling are counted as two carriers rather than merged into one; an empty scanned set reds the non-vacuity premise and a single-element set is still asked the same question; and the carrier list is reported in a deterministic order derived from a sorted file set"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#ADJACENCY: two readers differing only in key spelling count as TWO, not as one"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#EMPTY INPUT: an empty scanned set reds the premise, and a one-file set is still asked"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#ORDERING: two runs over the same tree print the same carrier LIST, not the same set"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-36-RED-baseline.txt § 4 — the ordering probe measured non-deterministic over a shuffled input before the sort moved into censusOver"
        status: pass
    human_judgment: false
  - id: D6
    description: "A check:* script running two gate modules proves BOTH: every target named in the script gets its own reachability row, and the pinned numbers are target counts rather than script counts"
    requirement: DASH-06
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#DISCRIMINATION: five synthetic commands, each with the row set it must produce"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#pins each class's TARGET count, and the pinned counts sum to the targets that exist"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#a target appended to an EXISTING command moves the numbers — the pins count targets"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-36-GREEN-proof.txt § 7 M6 — restoring first-match reds both the synthetic commands and the perturbed-manifest case"
        status: pass
    human_judgment: false
  - id: D7
    description: "A script contributing to two classes at once — one gate module and one test-suite file in the same command — is proved in both classes rather than losing the second to whichever arm matched first, and the DASH-06 read-only control keeps its own mechanical reachability row"
    requirement: DASH-06
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#every class shape a `check:*` script matches gets a row — no shape loses to arm order"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the DASH-06 control's reachability is mechanical, not assumed"
        status: pass
      - kind: other
        ref: "npm run check:dashboard-readonly → exit 0"
        status: pass
    human_judgment: false
  - id: D8
    description: "The one-authority claim the board projector and the validator both depend on is measured rather than asserted: DASH-02's single grammar (scripts/board-model.ts) remains the only carrier after both predicates were widened"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#TICKET_FRONTMATTER_READER_COUNT is 1, and the carrier is scripts/board-model.ts"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js → exit 0"
        status: pass
    human_judgment: false
  - id: D9
    description: "No count in either census can overflow or lose precision: every pinned cardinality is a small integer obtained by counting members of an array, with no rounding, tie-break or floating-point step anywhere in either derivation"
    requirement: DASH-01
    verification: []
    human_judgment: true
    rationale: "Carried as a `verification: backstop` marker in the plan's own must_haves rather than as an assertable predicate. It is a property of the SHAPE of both derivations (every number is `Array.prototype.length` compared with `toBe` against an integer literal), not a value a case can read; it is recorded in 32-36-RED-baseline.txt § 4 and 32-36-GREEN-proof.txt § 3 and a human confirming it reads the two derivations."

duration: 55 min
completed: 2026-09-16
status: complete
---

# Phase 32 Plan 36: The census asks about presence and capability, and every gate target gets its own row — Summary

**The one-authority ticket-frontmatter census now decides by the key's PRESENCE in a resolved static text and by a `String.prototype`/`RegExp.prototype`-derived refused complement, catching four measured second readers that all reported zero carriers before; and `check:*` classification returns one row per TARGET, so a command running two gate modules proves both.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-09-16T11:51:00Z
- **Completed:** 2026-09-16T12:46:00Z
- **Tasks:** 3
- **Files modified:** 4 (2 test modules, 2 planning artifacts) + 2 ledger/deferred records

## Accomplishments

- **Four ordinary second readers that measured at ZERO added carriers are now all detected.** The key half asks whether the key appears as a word anywhere in a resolved static text instead of what character precedes it; the primitive half is a complement of `String.prototype` ∪ `RegExp.prototype` read out of the running engine (65 members) minus three named refusals; and `staticText` resolves `[...].join(sep)` the way it already resolved `+`. Each plant is closed by a *different* one of those three mechanisms, proved by mutation.
- **The live tree still reports exactly one authority — and every non-carrier is now a decision somebody wrote down.** Widening named five more files; each was read before it was exempted, the exemption set went 3 → 8 pinned two-sided, and the liveness case makes each entry a standing claim rather than a standing hole.
- **The carrier count is a case on both sides of one.** `carrierVerdict` names zero as `vanished-authority`, and the live tree is judged through the same instrument rather than by a bare equality. Adjacency, empty-input and ordering are cases over real inputs; the census's row sort moved inside `censusOver`, which the baseline had measured as the sole (unasserted) source of determinism.
- **Every `check:*` target gets its own reachability row.** `classifyCheckScriptTargets` returns every gate-module and every suite target in a command; the per-class proofs iterate over rows; the pinned numbers count targets and must sum to the manifest-derived total; `check:dashboard-readonly` keeps exactly one row of its own, re-queried from the live derivation.
- **A weak suite was found by its own mutation and strengthened.** M6 (first-match restored) initially red one case, because 11 scripts carrying 11 targets cannot distinguish the two derivations. A case that perturbs the manifest in memory (script count 11 → 11, target count 11 → 12) was added and reds under M6 too.

## Task Commits

1. **Task 1: RED baseline — four undetected second readers and one unproven gate target** — `4fa517fc` (test)
2. **Task 2: The census asks about presence and capability, and pays for it with named exemptions** — `4f885e3f` (feat)
3. **Task 3: Every target gets its own reachability row** — `ab852601` (feat)

**Plan metadata:** see the `docs(32-36)` commit.

## TDD Gate Compliance

Both TDD gates are present and in order: the RED gate is `4fa517fc` (`test(32-36)`), which measured every plant at zero added carriers *before* any predicate moved, with the deleted reader replanted as a control so the baseline discriminates a blind census from a blind spot; the GREEN gates are `4f885e3f` and `ab852601` (`feat(32-36)`). No REFACTOR commit — neither change had a cleanup step worth a separate commit. Six mutation runs (M1–M6) stand in for the usual "watch it fail" evidence at the case level and are recorded in the GREEN proof.

## Files Created/Modified

- `scripts/validate.test.ts` — `namesKey` by presence; `looksLikeTextScan` + `TEXT_CAPABLE_MEMBERS` + `NOT_A_TEXT_PRIMITIVE`; `staticText`'s join arm; `censusOver`; `carrierVerdict` + `CARRIER_BOUNDARY_ROWS`; `SECOND_READER_PLANTS`; `NOT_A_SECOND_AUTHORITY` 3 → 8. 118 → 127 cases.
- `scripts/check-foundation-guards.test.ts` — `classifyCheckScriptTargets`; `CHECK_SCRIPT_CLASSES` restated as target counts; three per-class proofs iterating over rows; the perturbed-manifest case; five synthetic-command assertions; the disjointness case repaired. 293 → 295 cases.
- `.planning/phases/32-board-projector-cli-dashboard/32-36-RED-baseline.txt` — the five plant rows, which half let each through, the four DASH-01 probe answers, the two-gate/mixed classifications and the manifest measurement.
- `.planning/phases/32-board-projector-cli-dashboard/32-36-GREEN-proof.txt` — the plants after, the over-detection register with reasons, the boundary/adjacency/empty/ordering cases, and six mutation runs.
- `.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` — two new residuals (the production-module exemption; WINDOWS row 184's remaining runtime half).
- `.planning/WINDOWS.md` — one ledger row for the production-module exemption.

## Decisions Made

See `key-decisions` in the frontmatter. The two that would be easy to lose:

1. **Plant D was not a key-half failure.** The plan said it was; measurement says the old `text === k` arm would have matched it the moment it resolved, and what hid it was `staticText` resolving `+` but not `.join`. Mutation M5 exists only to attribute it correctly.
2. **`scripts/check-diff-disposition.ts` carries a census exemption and it is production code.** Recorded in four places rather than smoothed over.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's `node scripts/validate-agent-factory.js` verify line is missing `VALIDATE_KIT_ROOT`**
- **Found during:** Task 2 (verify step)
- **Issue:** Run bare, the validator prints `VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)` and produces no validation. This is the C3 no-false-green guard working as designed, not a fault.
- **Fix:** Invoked it the way `ci.yml:517` does — `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` — which exits 0. The plan's command text was followed in substance, not in letter; the departure is recorded here and in the GREEN proof § 5 rather than worked around silently.
- **Files modified:** none
- **Verification:** exit 0 with the kit root set, exit 0 (no-op, refusing) without it
- **Committed in:** n/a (no code change)

**2. [Rule 2 - Missing Critical] A fifth mutation (M5) and a sixth (M6-strengthening case) beyond the plan's four**
- **Found during:** Tasks 2 and 3
- **Issue:** (a) The plan's four mutations could not attribute plant D's closure to any mechanism, because none of them reverts the resolution arm that actually closes it. (b) The plan's Task 3 mutation red only one case, because the live manifest's script count and target count are the same number, so the re-pinning was an argument rather than a measurement.
- **Fix:** Added mutation M5 (remove the `.join` arm from `staticText` → plant D alone is lost) and a permanent case that perturbs the manifest in memory the way a later author would, which reds under the first-match mutation.
- **Files modified:** `scripts/validate.test.ts` (no change needed — M5 is a mutation run), `scripts/check-foundation-guards.test.ts` (the perturbation case)
- **Verification:** M5 → 1 failed | 126 passed; M6 after the addition → 2 failed | 293 passed
- **Committed in:** `4f885e3f` (M5 recorded in the proof) and `ab852601` (the case)

**3. [Rule 2 - Missing Critical] The disjointness case's premise was invalidated by this plan's own fix**
- **Found during:** Task 3
- **Issue:** `no check:* script matches TWO class shapes` existed *because* the classifier took the first match. Per-target classification makes a two-shape script legitimate, so the case would have been asserting a property the derivation no longer needs — and deleting it would have removed a real guarantee.
- **Fix:** Repaired rather than deleted: it now asserts every shape a command matches is represented in its classification, and that a shape-free command is the recorded toolchain decision and nothing else.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** green on the live manifest; the stronger property is what M6 could not satisfy in the synthetic rows
- **Committed in:** `ab852601`

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 missing-critical)
**Impact on plan:** All three strengthen the plan's own claims rather than widen them. No scope creep: no production module moved and no committed `.js` changed.

## Known Stubs

None. No placeholder, no skipped test and no unrun `<verify>` — every command in the plan's `<verification>` block was run and its result is in the GREEN proof § 8.

## Threat Flags

None. Both files edited are test modules; no network surface, no auth path, no schema and no trust boundary moved. The threat register's six rows (T-32-36-01..06) are all `mitigate`/`accept` and all addressed: the two key/primitive tampering rows by the rewritten predicates plus pinned discrimination rows, the two repudiation rows by per-target proofs and `CARRIER_BOUNDARY_ROWS`, the DoS row by the full-suite run in each task's verify (5109 → 5120 passed, no unrelated red), and the information-disclosure row accepted unchanged.

## Issues Encountered

- **The presence rule's over-detection is wider than a test-only cost.** Five files became detected, and one is production code. Resolved by reading each before exempting it and recording the production one as an owned residual in four places. Not eliminated — eliminating it would mean narrowing the predicate, which is the move that produced this finding twice.
- **The live manifest is too uniform to discriminate the check-script fix.** Resolved by perturbing it in memory inside a permanent case rather than by arguing from the diff.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both round-3 detection-robustness findings (WR-03 / re-opened WR-01, and WR-05 / F-07) are closed with measured before/after and mutation-proven discrimination.
- `32-37-PLAN.md` is the remaining plan in this round and carries the round's full probe arithmetic; nothing in this plan blocks it.
- Two residuals are owned and written down: the production-module census exemption on `scripts/check-diff-disposition.ts`, and the runtime half of WINDOWS ledger row 184.
- Standing rule unchanged: this phase's gap-closure is capped at four rounds.

## Self-Check: PASSED

- `scripts/validate.test.ts` — FOUND
- `scripts/check-foundation-guards.test.ts` — FOUND
- `.planning/phases/32-board-projector-cli-dashboard/32-36-RED-baseline.txt` — FOUND
- `.planning/phases/32-board-projector-cli-dashboard/32-36-GREEN-proof.txt` — FOUND
- commit `4fa517fc` — FOUND
- commit `4f885e3f` — FOUND
- commit `ab852601` — FOUND
- `git rev-list --count a8d29a89..HEAD` → 3, matching `actuals.commits`
- every task `<acceptance_criteria>` re-run and passing; plan `<verification>` block re-run in full (GREEN proof § 8)

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-16*

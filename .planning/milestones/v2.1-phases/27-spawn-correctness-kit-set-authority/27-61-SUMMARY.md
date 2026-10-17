---
phase: 27-spawn-correctness-kit-set-authority
plan: 61
subsystem: phase-record-and-traceability
tags: [spawn-correctness, kit-03, spawn-04, mutation-sweep, disposition-register, traceability, gap-closure-round-11]
status: complete
requires:
  - "27-55 … 27-60 — the six plans whose edits this sweep re-proves on the final build"
  - "27-REVIEW.md round 10 — the ten items the register disposes"
  - "27-VERIFICATION.md round 10 — the four `missing` fixes and the SPAWN-03 deferral"
  - "27-CONTEXT.md D-58 — the traceability convention, all five clauses"
provides:
  - "the consolidated ten-revert mutation sweep with two premise controls, on the shipped build"
  - "the fifteen-row round-11 disposition register with its by-count completeness arithmetic"
  - "the standing-obligations table re-stated with an owner per row"
  - "the round-wide specless-probe equality, stated once"
  - "the 10-of-10 traceability pair assertion, with KIT-03 / SPAWN-04 / SPAWN-03 held"
  - "D-63 — the round-11 posture, sixth application of the close-them-all convention"
affects:
  - "the next verification round for phase 27 — this is the evidence it re-checks"
tech-stack:
  added: []
  patterns:
    - "an assertion-shaped edit cannot be pinned by reverting it — removing an assertion never reds; pin it by planting the defect it exists to catch and comparing the outcome with and without"
    - "a closure inherited across six later edits is a memory, not a measurement — re-run it on the shipped build or do not claim it"
    - "a sweep over the shared corpus and a sweep over the whole suite answer different questions; reconcile them rather than letting the later one silently overwrite the earlier"
    - "assert a plant's own premise before running it — one such assertion fired here and stopped a number from being written down"
key-files:
  created: []
  modified:
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md
    - .planning/REQUIREMENTS.md
    - .planning/WINDOWS.md
decisions:
  - "D-63 — all ten round-10 items close in round 11, none deferred; the sixth application of the D-41 / D-47 / D-50 / D-53 / D-56 convention"
  - "R8, R9 and R10 are assertion-shaped: recorded OPEN under the plan's revert-alone-green rule AND pinned by a paired plant, rather than dressed up as a red"
  - "27-59's three NOT-PINNED results are reconciled, not overwritten: the whole suite pins R1/R4/R6, the shared corpus still does not, and that was the property 27-59 measured"
  - "KIT-03 and SPAWN-04 held at [ ] / Gaps Found; only their reason text moved. SPAWN-03 byte-unchanged"
metrics:
  duration: "~60 min"
  completed: "2026-08-10"
  tasks: 3
  commits: 3
actuals:
  tokens: 24800
  tasks: 3
  commits: 3
---

# Phase 27 Plan 61: Close the Round — Prove the Pins, Dispose Every Item, Hold the Record Summary

This plan changes **no shipped behaviour and no source file**. It touches three planning artifacts
plus the broken-windows ledger. Its whole product is evidence: a consolidated mutation sweep run on
the build that actually ships, a register that accounts for every item round 10 raised, and a
requirements record asserted against its own written rule rather than promoted by the round that
closed its defects.

## 1. The consolidated mutation sweep — ten reverts, two premise controls, on the FINAL build

Six plans each carried a local mutation control, each taken on the build that plan produced, and five
later plans then edited the same files. **A closure inherited across six edits is a memory, not a
measurement.** Every pin is re-proved here, once, on `ff68c31`.

**The two premise controls are recorded FIRST, and the SUMMARY states them in that order**, because a
sweep that reds on any rebuild is measuring the rebuild:

| # | control | rebuild | suite |
|---|---|---|---|
| **C1** | revert **NOTHING** | `npx tsc` exit **0** | **1346 passed / 2 skipped / 0 failed** |
| **C2** | revert a **COMMENT-ONLY** change (D-60's three-line gate comment), `.js` rebuilt from it | `npx tsc` exit **0** | **1346 passed / 2 skipped / 0 failed** |

C1 fixes the attributable baseline at **0** — a hermetic `git clone --no-hardlinks` keeps `.git`, so
none of the 6-to-15 git-dependent failures a `.git`-less scratch copy produces is in the way.

**Seven of the ten reverts red a named assertion.** Each mutation asserts its own target text occurs
exactly once before it is applied and is absent afterwards; every source revert asserts `npx tsc`'s
**exit code** and then **probes the built artifact directly** before the suite is believed.

| # | edit reverted | probe of the MUTATED build | suite | assertion that reds |
|---|---|---|---|---|
| R1 | `27-55` / D-59 region scoping → sticky | U1 → `{"ok":true,"value":false}` — **the original CR-01-new** | **8 failed** | `D-59 U1/U2 — an unrelated \`b: >-\` sibling cannot switch off the escape refusal…` |
| R2 | `27-56` / D-60 nested key → top-level alphabet | V4 → `{"ok":true,"value":false}` | **9 failed** | `D-60 V1-V4 — a quoted, dotted, digit-leading or space-containing nested key carries a header…` |
| R3 | `27-57` edit A / D-61 property strip | A → refuses — the **LOUD** arm, not the silent one | **5 failed** | `D-61 rows A, B, F, Q — a node property … no longer hides the header, at EVERY introduction` |
| R4 | `27-57` edit B / D-61 fourth application point | `nested: *a >-` → `{"ok":true,"value":false}` on a loader-**REJECTED** document | **3 failed** | `D-61 CONTROL R — a property the strip CANNOT handle fails LOUD…` |
| R5 | `27-58` edit A / D-62 end condition | W1 → `GRANT ["grugops-orchestrator"]` where the loader has none | **4 failed** | `D-62 row W1 — a block scalar ends at its OWN detected content indentation…` |
| R6 | `27-58` edit B / D-62 blank line | B1 → `["alpha","ga mma"]` — the **INVENTED** name | **5 failed** | `D-62 row B1 — a folded scalar's blank line is a LINE BREAK…` |
| R7 | `27-59` state axis re-coupled | (test file, seen directly) | **1 failed** | `IN-02 single-line differential …` — **6,340 cells moved** of 297,312 |

Verbatim failure messages, one per revert, are in `deferred-items.md` § **From 27-61** § 2.

**Three of the ten leave the suite green when reverted, and that is a category fact rather than a
missing pin.** `R8` (the test-inclusive typecheck target), `R9` (the fence claim's harness-local
discriminator) and `R10` (the IN-03 source-scan bound) are **assertions and gate reach** — *removing an
assertion cannot red anything.* Each is recorded OPEN under the plan's own revert-alone-green rule with
a named owner, **and** measured in the shape that can carry evidence: plant the defect the edit exists
to catch, and compare with the edit present and reverted.

| plant | edit PRESENT | edit REVERTED |
|---|---|---|
| R8 — unused local in `context-io.test.ts` | `npm run typecheck` **exit 2**, `TS6133: 'unread' is declared but its value is never read.` | **exit 0** — the same plant, seen by nothing |
| R9 — `import "./generate-role-adapters.test.js";` into `kit-model.ts` | **exit 1** through the TOTALITY arm | **exit 1** *still* — a SECOND independent statement catches it |
| R10 (a) — the section-rule end marker deleted | **exit 1**, `expected -1 to be greater than 9412` | **exit 0** — undetected |
| R10 (b) — the forbidden shape planted as a **COMMENT** | **exit 0** — correctly green | **exit 1** — **FALSE RED** |

**R9's redundancy is a measured fact, not an assumption.** Blinding **both** statements of the
harness-local property takes the same plant to **exit 0, 9 passed**.

### The gate, on the four parser edits

Planted into the **existing** `allowed-tools:` key of both distribution twins of the non-coordinator
`plan` skill; twins counted over the **failure block only**; every plant's loaded value quoted from
`/usr/bin/ruby -ryaml`. Every unplanted mirror stays **exit 0** under every revert.

| plant | FINAL BUILD | edit REVERTED |
|---|---|---|
| P55 (`27-55`) | exit **1**, twins 2/2 | exit **0** — the bypass reopens |
| P56 (`27-56`) | exit **1**, twins 2/2 | exit **0** — the bypass reopens |
| P57 (`27-57` A) | exit **1**, twins 2/2 | exit **1** — **the gate does NOT move** |
| P57B (`27-57` B, alias) | exit **1**, twins 2/2 | exit **0** — the silent arm reopens |
| P58 (`27-58` A) | exit **0** — correct, the loader carries no grant | exit **1** — the **FALSE RED** reopens |

**P57's gate not moving under R3 is a result, not a hole**, and it confirms at the gate what `27-57`
argued at the module level: with the strip gone, the fourth application point catches the property and
the document fails **LOUD**. The two edits are complementary; `P57B` under `R4` is the other half.
`R6` is measured at the module level only, with the reason stated — its divergence is a value / name-set
divergence, and the gate asks about token presence and the name set.

### Every family closed by rounds 9, 10 and 11, re-measured on this build

**Fifteen rows, fifteen still closed** — round 9's CR-01, round 10's families G and G2, and all of
round 11's — each with its `/usr/bin/ruby -ryaml` loader column (ruby 2.6.10 / psych 3.1.0 /
libyaml 0.2.1), taken against the real tree. Full table: § From 27-61 § 5. **Not one closure was
inherited.**

**The green suite is a FLOOR, not the closure evidence: the closure evidence is the transcripts and the
gate exit codes.**

## 2. The disposition register — fifteen items in, fifteen rows out

**The review's own tally reconciles**, checked rather than taken: its frontmatter declares
`critical: 3, warning: 4, info: 3, total: 10`, and counting the body headings independently also gives
**10**. No disagreement row is owed.

**Reconciled total: 15 rows.** Ten review findings — CR-01-new, CR-02, CR-03, WR-01, WR-02, WR-03,
WR-04, IN-01, IN-02, IN-03 — plus **five** items round 10's *verification* raised beyond the review:
the four named `missing` fixes and the SPAWN-03 deferral.

- **Items raised: 15. Rows written: 15. `15 == 15`.**
- **Dispositions partition: 14 FIXED + 1 DEFERRED + 0 REJECTED + 0 OPEN, and `14 + 1 + 0 + 0 == 15`.**

**Every FIXED row cites an artifact that exists and a transcript taken on the FINAL build**, not a
figure carried forward from the plan that made the claim.

**Merged dispositions still get their own row naming the row they merged into** — IN-01 into WR-02's
fix (row 5), and the three `missing` entries V1 / V2 / V3 into rows 1 / 2 / 3. A merged disposition is
still a disposition; a missing row is a silent drop.

**No item is REJECTED.** Two *proposed remedies* were rejected by measurement inside otherwise-fixed
rows and are recorded there — the review's `blockParts: Set<number>` storage shape and its LAST-colon
key-end rule — plus D-59's own individual-region resolution, implemented and measured before rejection.

**The standing obligations are re-stated with an owner each**, every one either measured on this build
or explicitly named as carried. What moved:

- **`27-53`'s "the two compiler flags do not cover `**/*.test.ts`" is CLOSED** by `27-60` — reach is
  36 of 36, `npm run typecheck` runs both targets and exits 0, and CI gained an explicit step where
  **none existed at all**.
- **`27-53`'s fence-classifier floor MOVED**: the set is still 4 and the AST direction is unchanged,
  but the half the review called prose is now mechanical over a derived 33-module importer corpus.
  `toggle[1]`'s variable-name sensitivity is **carried, unchanged** — round 11 touched no toggle.
- **`27-59`'s three NOT-PINNED results are reconciled, not overwritten.** All three ARE pinned by the
  whole suite; the **shared corpus** still cannot see them, which is what `27-59` measured. The
  obligation stands with its owner.
- **`27-56`'s console-interception item RE-MEASURED and still true**: 0 of the three headline
  measurement lines print on a default run, 3 with `--disableConsoleIntercept`.

**The round-wide probe equality, stated once, in one checkable place:**
`7 gap-surface probe rows == 5 authored explicit + 1 backstop + 1 unresolved-and-flagged + 0 dismissed`,
distributed `27-55` 3 · `27-56` 1 · `27-57` 1 · `27-58` 2 · `27-59` 0 · `27-60` 0 · `27-61` 0 —
`3+1+1+2+0+0+0 == 7` and `5+1+1+0 == 7`. SPAWN-04's flagged planner assumption is restated **verbatim**
so a reader does not have to hunt it. Scoping: 27 report rows total, 20 carried by `27-01` … `27-54`.

**D-63** records the posture in `27-CONTEXT.md` under the `Gap-closure round 11` heading, as the
**sixth** application of the D-41 / D-47 / D-50 / D-53 / D-56 convention, with the three
record-don't-fix items named with their dispositions.

## 3. The traceability hold — 10 of 10, and not one row promoted

Both renderings of all ten rows were **read from disk**, never from a line citation in any report,
including this one — `27-54` measured last round's citations to be stale.

| # | Requirement | round-10 verification verdict | checkbox ON DISK | traceability status cell ON DISK | agree | this plan |
|---|---|---|---|---|---|---|
| 1 | KIT-01 | SATISFIED | `[x]` | Complete | YES | asserted, untouched |
| 2 | KIT-02 | SATISFIED | `[x]` | Complete | YES | asserted, untouched |
| 3 | **KIT-03** | BLOCKED | `[ ]` | **Gaps Found** | YES | **HELD** — reason text only |
| 4 | SPAWN-01 | SATISFIED | `[x]` | Complete | YES | asserted, untouched |
| 5 | SPAWN-02 | SATISFIED | `[x]` | Complete | YES | asserted, untouched |
| 6 | **SPAWN-03** | NEEDS HUMAN (deferred) | `[ ]` | **Gaps Found** | YES | **HELD** — byte-unchanged |
| 7 | **SPAWN-04** | BLOCKED | `[ ]` | **Gaps Found** | YES | **HELD** — reason text only |
| 8 | SPAWN-05 | SATISFIED | `[x]` | Complete | YES | asserted, untouched |
| 9 | SPAWN-06 | SATISFIED | `[x]` | Complete | YES | asserted, untouched |
| 10 | SPAWN-07 | SATISFIED | `[x]` | Complete | YES | asserted, untouched |

**The pair assertion, as a count: the checkbox and the traceability status cell agree with each other
and with the verification's recorded verdict for `10` of `10` rows.** Computed by reading both
renderings off disk and comparing them.

**NO ROW WAS PROMOTED TO COMPLETE BY THIS PLAN.** D-58 item 4 reserves promotion to a verification
round. This plan's own sibling tasks closed exactly the defects KIT-03's and SPAWN-04's FAILED status
rests on, which is the reason to hold and not the reason to move. Commit `47d7820` already reverted one
premature flip of this exact pair.

**The two held rows, quoted after the edit:**

> `| KIT-03 | Phase 27 | Gaps Found — held pending verification. Round 11 closed all three bypasses this row's FAILED status now rests on (27-55 CR-01-new / D-59, 27-56 CR-03 / D-60, 27-57 CR-02 / D-61), plus WR-01 / WR-02 / IN-01 (27-58 / D-62), each re-measured on the FINAL build ff68c31 and still closed (deferred-items.md § From 27-61 § 5, fifteen rows). Round 10's 27-51 / 27-52 closures likewise still hold. Held anyway: only a verification round may flip it (D-58 item 4). |`

> `| SPAWN-04 | Phase 27 | Gaps Found — held pending verification, for the same reason as KIT-03 and by the same rule (D-58 item 4). Round 11's closures include the one bypass the round-10 verifier reproduced END TO END through the full gate (CR-02): the same plant now takes check-foundation-guards from exit 0 to exit 1 on both distribution twins, re-run on the FINAL build ff68c31 (deferred-items.md § From 27-61 § 4, plant P57). The UNKNOWN - verify platform bound on whether Claude Code honours a mapping under an allow-list key is UNCHANGED and no live platform escalation is claimed. Commit 47d7820 already reverted one premature flip of exactly this pair. |`

**SPAWN-03 is byte-unchanged, and that is the hold.** It keeps `[ ]`, keeps `Gaps Found`, keeps its
Phase-33 / GAP-D1 / CAP-01 citation and keeps `UNKNOWN - verify`. It was not re-opened as a Phase-27
blocker, and **no static gate was invented for it** — no static check can produce live-platform
evidence, and fabricating a passing gate is forbidden by this project's own constraints by name.

Each edited cell cites the transcript re-run in **this** plan that justifies it, per D-58 item 3.

## The harness premise produced its SIXTEENTH instance — and this time the assertion caught it FIRST

`R10`'s mode-A plant looked for the `// ── end stripFencedBlockLines` marker in
`scripts/generate-role-adapters.ts`. The pinned twin lives in `scripts/generate-role-adapters.**test**.ts`.
The plant halted with `PLANT-2 PREMISE FAILED: marker absent` **before** running anything.

Every prior instance in this phase was caught *after* a wrong number had been produced — a row printing
`268 passed`, a control reporting `0 attributable`, a scan reporting `0` negatives. This is the first
one caught **before a number existed to be misread**, and the difference is that the premise was
asserted as a precondition rather than checked afterwards. Two vacuous runs (both `25 passed`) had
already been produced under the mistaken path and were discarded rather than reported.

## Deviations from Plan

**1. [Rule 1 — the plan's framing corrected against measurement] `R8`, `R9` and `R10` cannot be pinned
by reverting them, and the plan's rule is applied honestly rather than satisfied cosmetically.**
- **Found during:** Task 1, on the first run of R8.
- **Issue:** the plan states "any edit whose revert leaves EVERYTHING green is a pin that does not
  exist." Three of the round's ten edits are **assertions and gate reach**, not behaviour. Removing an
  assertion never reds — the statement is a tautology for them, not a finding.
- **Fix:** each is recorded **OPEN under the plan's stated rule** with a named owner **and** measured by
  the paired plant it exists to catch, with both outcomes quoted. Nothing was smoothed over and no pin
  was invented; what changed is that the measurement takes the only shape that can carry evidence.
- **Commit:** `e75dc99`

**2. [Rule 2 — Missing critical functionality] `R9` was measured incomplete as a revert, and the
completion is recorded rather than assumed.**
- **Found during:** Task 1, when the plant reds in BOTH states.
- **Issue:** the harness-local property is asserted **twice**. Reverting the classifier condition alone
  still catches the plant through the direct loop, so "the revert leaves the plant caught" would have
  read as a stronger claim than the evidence supported.
- **Fix:** both statements were blinded and the plant re-run — **exit 0, 9 passed**. The redundancy is
  now a measured fact.
- **Commit:** `e75dc99`

**3. [Rule 2] `27-59`'s three NOT-PINNED results are reconciled rather than overwritten.**
- **Found during:** Task 1, on R1 / R4 / R6.
- **Issue:** this sweep runs the **whole suite** and pins all three; `27-59` ran the **shared D-52
  corpus** and pinned none. Reporting only the newer number would have quietly retired a standing
  obligation that is still true.
- **Fix:** both results are stated together with the scope of each, and `27-59`'s three OPEN items stand
  unchanged with their owners.
- **Commit:** `e75dc99`

**4. [Process] The tracer feedback gate was satisfied by re-running the automation rather than by
emitting a checkpoint.** `27-61` declares `autonomous: true` and carries no `checkpoint:*` task; every
`<verify>` entry is `<automated>`, all re-run end-to-end and green before the next task began. The
checkpoint protocol states that users never run CLI commands, so a `checkpoint:human-verify` whose
entire content is CLI commands would violate the protocol it is issued under. Same disposition as
`27-55` through `27-60`.

## Known Stubs

None. This plan introduced no stub, placeholder, TODO or skipped test, and edited no source, test or
committed `.js` file. The two pre-existing suite skips and the one pre-existing skip in
`generate-role-adapters.test.ts` are unrelated and unchanged. Three pre-existing OPEN items were
appended to `.planning/WINDOWS.md` so they are visible at ship time: `27-60`'s
`frontmatter.test.ts:14245-14247` brittleness, `27-59`'s three corpus-invisible families, and `27-58`'s
blank-line-in-a-plain-scalar residual.

## Threat Flags

None. This plan introduced no network endpoint, no auth path, no new file access pattern and no schema
change. `T-27-61-01` through `T-27-61-05` are all mitigated and evidenced above; `T-27-61-SC` stands as
accepted — no package-manager install ran and no dependency changed.

## Verification, on the restored tree

`git status --short` reports only the two pre-existing, unrelated entries (`M human-notes.txt`,
`?? .gsd/`). The sweep left no residue.

| gate | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **35 files, 1346 passed / 2 skipped / 0 failed** |
| `npm run typecheck` (both targets) | **exit 0** |
| `npm run freshness` | **exit 0**, 32 committed `.js` match a fresh rebuild |
| `node scripts/check-foundation-guards.js` | **exit 0**, `ALL CHECKS PASSED` |
| `node scripts/adapters-freshness.js` | **exit 0** |
| `node scripts/coordinator-resolution-precheck.js` | **exit 0** |

**The green suite is a FLOOR, not the closure evidence.** The closure evidence is the two premise
controls, the seven named reverts, the four paired plants, the eight gate rows with their loader
column, and the fifteen-row final-build re-measurement.

## Still OPEN, with a named owner

The full table is `deferred-items.md` § **Round 11 disposition register** § Part four. The short form:

| Item | Owner |
|---|---|
| SPAWN-03's live-platform capture, `UNKNOWN - verify` | **Phase 33** — GAP-D1 / CAP-01 (capture CAP-03) |
| KIT-03 and SPAWN-04 held unflipped | **the next verification round** for phase 27 (D-58 item 4) |
| `27-59`'s three families the SHARED corpus cannot see (R1 / R4 / R6) | a later round — a token-carrying quoted sibling, an alias axis member, and a third compared fact for R6 |
| `27-58`'s blank line inside an open PLAIN scalar, pinned at its wrong answer | a later round — the continuation fold, with its own value map |
| `27-60`'s `frontmatter.test.ts:14245-14247` brittleness, and five unadjudicated scan hits | a later round |
| `27-61`'s three assertion-shaped edits (R8 / R9 / R10) green on revert alone | a later round, if the paired plants are ever wanted as committed cases |
| `27-49` exemption bound · `27-50` wording · `27-53` AST classification · `27-55` ORDERING arm · `27-56` `raw.trim()` alphabet and console interception · `27-57` `&a: b >-` | carried, each with its owner in Part four |
| SPAWN-06's descriptive "currently 7562B" against the measured 7090B (not a status rendering) | a later round, with Phase 29's LANG-08 ceiling re-baselining |

## Self-Check: PASSED

- `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` — FOUND, carries
  `From 27-61` and `Round 11 disposition register`
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md` — FOUND, carries **D-63**
- `.planning/REQUIREMENTS.md` — FOUND, 10 of 10 rows agree
- `.planning/WINDOWS.md` — FOUND, three round-11 entries appended
- commit `e75dc99` — FOUND
- commit `1141c72` — FOUND
- commit `72a5592` — FOUND

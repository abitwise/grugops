---
phase: 32-board-projector-cli-dashboard
plan: 21
subsystem: testing
tags: [safety-guard, ast, typescript, vitest, census, capability-analysis, ci-reachability]

# Dependency graph
requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "32-12 deleted the second ticket-frontmatter reader and built the one-authority census this plan widens"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-10 built the read-target routing census; 32-09 established the AST-census idiom it uses"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-20 closed the DASH-06 read-only guard's own gaps; this plan proves that gate's reachability mechanically"
provides:
  - "The ticket-frontmatter census asks about the CAPABILITY (both key spellings + a text-scanning primitive) instead of two syntax shapes"
  - "A named-reason exemption set (NOT_A_SECOND_AUTHORITY) with a dead-exemption red and a pinned cardinality"
  - "The routing census's universe widened to every function-like node, named by its owner, with lexical scope travelling both ways"
  - "calleeName resolves property-access, string-literal element-access and super; an unresolvable callee is COLLECTED, never skipped"
  - "The routing census's universe pinned by name (33) and by count (52), so an unmeasured site cannot hide behind a healthy `inspected`"
  - "CHECK_SCRIPT_CLASSES — a total classification of every check:* script into three named classes, each with its own reachability proof and a pinned size"
  - "The DASH-06 control's CI reachability proved mechanically: classified, file exists, npm script and case agree, suite exclusion parsed from ci.yml and applied"
affects: [32-22, 32-23, board-projector, dashboard-safety, foundation-guards, ci-reachability]

actuals:
  tokens: 17887   # chars/4 over the full realized diff of the three task commits
  tasks: 3
  commits: 7  # MEASURED git rev-list --count af871786..HEAD: 3 task + RED/GREEN artifacts + SUMMARY + metadata + WINDOWS ledger
plan_head_before: af8717868b89e475a5eef794b9620d3bd5946bd3

tech-stack:
  added: []
  patterns:
    - "Capability-subject censuses: ask what the file DOES (names the keys AND scans text), never what shape the code has"
    - "State the derivation's BOUNDARIES in its docblock, and give every stated boundary a case of its own — including a case that MEASURES the blind spot rather than claiming absence"
    - "Pin the DENOMINATOR, not only the findings: an unmeasured site and a clean site produce the same finding count"
    - "Collect-don't-skip: a callee or a script the derivation cannot classify is named in a red, never passed over with `continue`"
    - "Named-reason exemption sets in the STEM_FALSE_POSITIVES register, with a dead-exemption red and a pinned cardinality"
    - "Assert class shapes DISJOINT over the live set, so a first-matching arm cannot answer for a class whose proof was never asked"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-21-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-21-GREEN-proof.txt
  modified:
    - scripts/validate.test.ts
    - scripts/board-read.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The ticket-reader carrier decision is FILE-scoped, not function-scoped: a file naming the keys in one place and scanning text in another is a carrier. The imprecision runs toward over-detection, which is paid for by three named exemptions rather than by narrowing the question again"
  - "A regex-source SKELETON reduces `[:]` and `\\:` to `:` before the anchored test, so `^column[:]` reads as the frontmatter position it is — one normalisation instead of one condition per author's habit"
  - "The runtime-assembled key spelling is a STATED blind spot with a case that measures it, not a silently narrower scan: if it ever becomes live in scripts/ the census needs a different instrument, not a twelfth condition"
  - "Nameless universe members take a STABLE marker (`<anonymous function>`) and carry their line in the finding, so the pin does not red on unrelated line drift while a finding still names a place"
  - "The path-helper exemption lands on the ANCESTOR that declares the parameter, not on the nested arrow that dereferences it — the exemption belongs where the caller vouches"
  - "The toolchain class is a NAMED set with written reasons, because `runs tsc and git` has no distinguishing token; membership is a decision, not a pattern that happens not to match"
  - "The workflow's suite exclusion is PARSED out of ci.yml and applied as a glob, and the matcher's own non-vacuity is asserted — the round-1 review's `it is in the default suite` was exactly the assumption being replaced"

patterns-established:
  - "Boundary-per-row: every sentence in a census docblock that bounds its input has a case beneath it"
  - "Converse rows: each half of a conjunction is asserted SILENT alone, so the pair is shown to decide rather than to be a formality"
  - "Subject mutation over assertion mutation: the DASH-06 proof was watched failing by mutating ci.yml, not by mutating the expectation"

requirements-completed: [DASH-01, DASH-02, DASH-06]

coverage:
  - id: D1
    description: "The one-authority ticket-frontmatter census detects a second reader in four spellings — the byte-for-byte deleted reader, a module-scope `new RegExp` built from a string, a reader whose text parameter carries no `string` annotation, and a `split`/`indexOf` scan with the key names concatenated"
    requirement: "DASH-01"
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#goes RED on the deleted reader: the exact source that was removed is still caught"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#goes RED on a pattern built from a string (WR-01 E1)"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#goes RED on a reader whose text parameter carries no `string` annotation (WR-01 E2)"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#goes RED on a hand-rolled scan with the key names concatenated (WR-01 E3)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The widened census still reports exactly one carrier on the live tree, that carrier is the grammar module, and each of its three exemptions is a named reason that must still be matched"
    requirement: "DASH-01"
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#TICKET_FRONTMATTER_READER_COUNT is 1, and the carrier is scripts/board-model.ts"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#every named exemption is actually detected by the widened derivation"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#the exemption set has exactly three members"
        status: pass
      - kind: other
        ref: "mutation M1 in 32-21-GREEN-proof.txt — a dead exemption reds both the exemption case and the carrier count"
        status: pass
    human_judgment: false
  - id: D3
    description: "The census's stated boundaries each have a case: the file set is floored against git, the pair is shown to be a conjunction, the file-level scope is pinned as over-detection, and the runtime-assembled blind spot is measured rather than claimed absent"
    requirement: "DASH-01"
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#the scan is non-vacuous: the glob found files, and every tracked scripts/*.ts is among them"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#stays SILENT on each half of the pair alone, so the conjunction is what decides"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#does NOT see a reader whose key spellings are assembled at RUNTIME — the stated blind spot"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#names a file whose key spellings and text scan never meet — over-detection, by choice"
        status: pass
    human_judgment: false
  - id: D4
    description: "The read-target routing census measures a module-level arrow reading a joined path and a read primitive reached through a member-access or string-literal-index callee"
    requirement: "DASH-02"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#PREMISE: a MODULE-LEVEL ARROW reading a joined path is a finding, not an invisible site"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#PREMISE: a read primitive reached through a MEMBER-ACCESS callee is inspected"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#resolves a STRING-LITERAL element access to the primitive it names"
        status: pass
    human_judgment: false
  - id: D5
    description: "The routing census's universe is pinned by name and count, an unresolvable callee is collected rather than skipped, and the widening manufactures no false finding against a nested arrow or an ancestor's parameter"
    requirement: "DASH-02"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#pins the collected function UNIVERSE by name and by count"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#collects an UNRESOLVABLE callee rather than skipping it, and the live module has none"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#PREMISE: a callee the pass CANNOT resolve is collected, not silently dropped"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#does NOT manufacture a finding against a nested arrow closing over a vouched path"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#names an ANCESTOR's parameter as the path helper, not the nested arrow"
        status: pass
    human_judgment: false
  - id: D6
    description: "PATH_AUTHORITIES, the derived path-helper set and the inspected count are unchanged by the widening — the universe grew without the answers moving"
    requirement: "DASH-02"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#derives the path-authority set from the file and pins it two-sided"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#pins the derived path-HELPER set two-sided, because it is an exemption"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#finds no read target built outside those authorities"
        status: pass
    human_judgment: false
  - id: D7
    description: "Every check:* script is classified into exactly one named class, the class sizes are pinned and sum to the script count, the classes are disjoint, and the classifier reports an unclassifiable entry"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#every `check:*` script is CLASSIFIED — the derivation skips none of them (F-01)"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#pins each class's SIZE, and the classes partition the check scripts with no remainder"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#no `check:*` script matches TWO class shapes — the partition is real, not an arm order"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#PREMISE: the classifier REPORTS a script that matches no class"
        status: pass
    human_judgment: false
  - id: D8
    description: "Each class carries its own reachability proof, and the DASH-06 control's reachability is mechanical: classified, file exists, npm script and case agree on the file, and the workflow's parsed suite exclusion does not skip it"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#gate-module class: every target is named by ci.yml, or declares why not"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#suite-test-file class: the named file exists and the workflow's suite does not exclude it"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#toolchain class: each member carries a reason and ci.yml runs it under its own spelling"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the DASH-06 control's reachability is mechanical, not assumed"
        status: pass
      - kind: other
        ref: "mutation M2 in 32-21-GREEN-proof.txt — pointing ci.yml's suite exclusion at scripts/board-readonly.test.ts reds the DASH-06 case"
        status: pass
    human_judgment: false
  - id: D9
    description: "The repository's own gates stay green over the change: the validator, the foundation guards, the DASH-06 control, typecheck, build parity, and the whole suite minus the live e2e lane"
    verification:
      - kind: integration
        ref: "VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js (exit 0, ALL CHECKS PASSED)"
        status: pass
      - kind: integration
        ref: "node scripts/check-foundation-guards.js (exit 0, ALL CHECKS PASSED)"
        status: pass
      - kind: integration
        ref: "npm run check:dashboard-readonly (89 passed)"
        status: pass
      - kind: integration
        ref: "npm run typecheck && npm run build && npm run check:build-parity (exit 0, no tracked build output moved)"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (74 files, 4969 passed, 2 skipped)"
        status: pass
    human_judgment: false

# Metrics
duration: 33 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 21: Three Derived Predicates Whose Input Was Narrower Than Their Claim Summary

**Three censuses re-aimed at what they claim to measure: the ticket-reader census now asks about the capability (both key spellings plus a text-scanning primitive) instead of two syntax shapes, the routing census's universe covers every function-like node with lexical scope travelling both ways and is pinned by name and count, and every `check:*` script is classified into one of three named classes each carrying its own reachability proof — with the DASH-06 control's CI reachability now mechanical rather than argued.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-09-15T14:50:00Z
- **Completed:** 2026-09-15T15:23:00Z
- **Tasks:** 3
- **Files modified:** 3 (plus 2 artifacts created)

## Accomplishments

- **WR-01 closed.** `findTicketReaders` decides on a PAIR — the file names both ticket key spellings (string literal, no-substitution template, regex literal, or `+`-concatenated pieces that join to the spelling) AND reaches a text-scanning primitive from the five named once in `TEXT_SCAN_PRIMITIVES`. All three of the review's measured rewrites, each previously at **zero carriers**, are now detected; the byte-for-byte deleted reader is still detected, so the widened question is a proven superset of the old one.
- **The exemptions are decisions.** `NOT_A_SECOND_AUTHORITY` names three files with a one-line reason each, in the `STEM_FALSE_POSITIVES` register. A dead exemption reds, and the cardinality is pinned — so a hole cannot outlive its reason.
- **The census states what bounds it.** File set, node kinds, the runtime-assembled blind spot, and the file-level scope are written into the docblock, and **each has a case of its own** — including one that MEASURES the blind spot rather than claiming absence, and one that pins the over-detection as a choice.
- **WR-10 closed.** The routing universe is every function-like node plus a synthetic module-top-level member; arrows are named by their owning declaration (the `enclosingFunctionName` idiom); a call belongs to its innermost enclosing member; lexical scope travels in both directions so a nested arrow sees what its ancestors produced and an ancestor's parameter is the path helper.
- **The denominator is pinned.** 33 named members two-sided, 17 nameless by count, 52 total — because an unmeasured site and a clean site produce the same finding count, and only a pinned universe can tell them apart.
- **Collect, never skip.** `resolveCallee` handles bare identifiers, property access, string-literal element access and `super`; anything else is collected into `unresolvedCallees` and pinned empty against the live module.
- **F-01 closed.** `CHECK_SCRIPT_CLASSES` classifies all 11 `check:*` scripts into gate-module (9), suite-test-file (1) and toolchain (1), each with its own reachability proof and a pinned size that sums to the script count. No `continue` remains; an unclassifiable script is a failure naming it. A separate case asserts the three shapes DISJOINT, so no script can be filed by arm order with the other class's proof never asked.
- **The DASH-06 control's reachability is mechanical.** The workflow's suite exclusion is parsed out of `ci.yml` and applied as a glob (with its own non-vacuity asserted), the test file's existence is checked, and the npm script and the case are made to agree about which file the gate is.

## Task Commits

1. **Task 1: the one-authority proof asks about the capability** — `2e24c8ab` (test)
2. **Task 2: the routing census's universe covers the shapes the module can legally use** — `b98ac322` (test)
3. **Task 3: every check script is classified, and each class carries its own reachability proof** — `260057ec` (test)

**RED/GREEN artifacts:** `01be8240` (docs)

## Files Created/Modified

- `scripts/validate.test.ts` — the capability-based ticket-reader census, `TEXT_SCAN_PRIMITIVES`, the regex skeleton, `NOT_A_SECOND_AUTHORITY` with its two contract cases, and seven discrimination/boundary rows
- `scripts/board-read.test.ts` — the widened `routingCensus` (function-like universe, member-based attribution, lexical scope, `resolveCallee`, `unresolvedCallees`), the pinned universe, and six new plants
- `scripts/check-foundation-guards.test.ts` — `TOOLCHAIN_CHECK_SCRIPTS`, `classifyCheckScript`, `CHECK_SCRIPT_CLASSES`, the parsed suite exclusion + `globToRegExp`, and seven cases replacing one pattern and one `continue`
- `.planning/phases/32-board-projector-cli-dashboard/32-21-RED-baseline.txt` — the measured RED for all three tasks, including the replay of the pre-change derivation for the plant that had no field to be reported in
- `.planning/phases/32-board-projector-cli-dashboard/32-21-GREEN-proof.txt` — every verification command with its result, the censuses' own printed numbers, three mutation transcripts, and what was NOT proved

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing three:

1. **The ticket-reader pair is file-scoped by choice.** Narrowing it to "the same function" would let a reader split across two functions walk straight through — one refactor away from the shape WR-01 measured. The cost is three named exemptions; the alternative cost was a whole round.
2. **The blind spot is stated and measured, not narrowed away.** A key spelling assembled at runtime is outside a static pass. A twelfth condition would not change that; a case that pins the zero makes a later "the census would have caught it" argue against a measurement.
3. **The toolchain class is a named set, not a pattern.** "Runs tsc and git" has no distinguishing token, so membership is a recorded decision and the class's reachability is `ci.yml` invoking the npm script under its own spelling.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added a class-disjointness case the plan did not ask for**
- **Found during:** Task 3
- **Issue:** `classifyCheckScript` asks its three questions in order and returns the first answer. A script matching two shapes would be filed under whichever arm runs first, and the other class's reachability proof would never be asked of it. That is the "one arm answering for all of them" failure this phase has now met in three separate censuses; the plan's class-size pins would stay green over it.
- **Fix:** Added `no \`check:*\` script matches TWO class shapes — the partition is real, not an arm order`, which evaluates all three shape tests over every live script and requires exactly one match.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** Green over the live `package.json`; it is the converse of the classifier discrimination case, which proves each arm answers for its own class.
- **Committed in:** `260057ec`

**2. [Rule 2 - Missing Critical] Widened `resolveCallee` to string-literal element access, and resolved `super`**
- **Found during:** Task 2
- **Issue:** The plan asked for property-access resolution. Measured against the live module, `super(message)` in the error subclass then landed in `unresolvedCallees`, which would have forced a pin over a name that is perfectly resolvable — and `fs["statSync"](p)` is the same namespace-refactor escape one spelling over from the one WR-10 named.
- **Fix:** `resolveCallee` also reads a string-literal (and no-substitution-template) element access and `super`; `unresolvedCallees` is then genuinely empty over the live module and pinned two-sided, with a plant proving it collects.
- **Files modified:** `scripts/board-read.test.ts`
- **Verification:** `resolves a STRING-LITERAL element access to the primitive it names` (the sibling arm, green), `collects an UNRESOLVABLE callee rather than skipping it, and the live module has none`, and the opaque-callee plant.
- **Committed in:** `b98ac322`

**3. [Rule 1 - Bug] Lexical scope had to travel into the widened universe**
- **Found during:** Task 2
- **Issue:** Splitting the universe by function-like node means a nested arrow gets its own walk, so the vouching its parent did no longer reaches it. Left alone, the widening would have manufactured findings against paths an authority plainly produced — a false RED bought with the fix.
- **Fix:** `producedIn` unions a member's own produced set with its ancestors', and `ownerOfParam` walks outwards so the path-helper exemption lands on the ancestor that declares the parameter.
- **Files modified:** `scripts/board-read.test.ts`
- **Verification:** `does NOT manufacture a finding against a nested arrow closing over a vouched path` and `names an ANCESTOR's parameter as the path helper, not the nested arrow`; `PATH_AUTHORITIES`, the derived helper set and `inspected` (17) are all unchanged at their committed values.
- **Committed in:** `b98ac322`

---

**Total deviations:** 3 auto-fixed (2 missing critical, 1 bug)
**Impact on plan:** All three are the sibling-arm probes this phase's own standing rule requires — each was found by asking what the change next to the fix now lets through. No scope creep: all three land in the files the plan owns and none changes production code.

## Issues Encountered

- **The universe pin's brittleness had to be designed around.** Naming anonymous members by line (`<anonymous function @1695>`) would have made the pin red on any unrelated line shift in `board-read.ts`, which is exactly how a pin gets bumped instead of read. Resolved by giving nameless members a stable marker and carrying the line in the finding instead — the pin moves on structure, the finding still names a place.
- **`npm test` was deliberately not run** (live claude-CLI e2e lane; tokens and hang risk). The suite was run as `npx vitest run --exclude '**/scripts/e2e/**'`: 74 files, 4969 passed, 2 skipped — above the plan's floors of 74 files and 4811 passed.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. This plan edits three `.test.ts` files; no production code, no committed `.js`, no placeholder.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary — every change is an analysis pass over source text already in the repository.

## Next Phase Readiness

- Plans 32-22 and 32-23 remain in this round; this plan touched none of their files.
- The `## Accomplishments` claims above are all mechanically asserted; the one boundary NOT proved (a runtime-assembled key spelling) is stated in `32-21-GREEN-proof.txt` §6 and in the census docblock.
- Per the plan's own success criteria, this plan does NOT flip REQUIREMENTS.md or the ROADMAP phase status to Complete; the phase is still under gap-closure.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*

## Self-Check: PASSED

All six created/modified paths exist on disk; all five commits (`2e24c8ab`, `b98ac322`, `260057ec`,
`01be8240`, `5fd8d613`) are reachable in `git log`. The plan-level verification block was re-run in
full after the last task commit and is transcribed in `32-21-GREEN-proof.txt`.

---
phase: 32-board-projector-cli-dashboard
plan: 11
subsystem: testing
tags: [typescript-ast, import-graph, safety-guard, vitest, mutation-testing, dash-06]

requires:
  - phase: 32-06
    provides: "scripts/board-readonly.test.ts — the import-closure guard, its three derived sets, its premises and its two-sided closure pin"
  - phase: 32-09
    provides: "the containment/read seam inside scripts/board-read.ts, a module of the closure this guard walks"
  - phase: 32-13
    provides: "the stderr sanitizer chokepoint in scripts/board-dashboard.ts, also inside the closure"
provides:
  - "A CANONICAL FORM for fs-namespace bindings: the object of a member access is the ONE admitted use, and every other read is refused as an opaque acquisition"
  - "NAMESPACE_ESCAPE_SHAPES — 14 escape spellings held as data, two-sided pin, uniqueness and non-emptiness asserted"
  - "ACQUISITION_SHAPES — 6 module-acquisition routes as data, including three that never spell `require` or `import`"
  - "A derived NAMESPACE_REENTRY_MEMBERS refusal closing fs.promises / fs.default"
  - "A mechanical statement that the guard's subject is the committed .js, bound to check:build-parity and its CI step"
  - "32-11-RED-baseline.txt and 32-11-GREEN-proof.txt — the finding reproduced, then refused, with four mutants"
affects: [phase-32-verification, dash-06, dash-08, board-projector]

actuals:
  tokens: 23057
  tasks: 3
  commits: 5
plan_head_before: 698212923c2a0f5329cecd2643fec1df35844489

tech-stack:
  added: []
  patterns:
    - "Canonical form + refuse-the-complement, instead of widening a matcher once per counter-example"
    - "Escape/acquisition spellings held as frozen data tables with two-sided cardinality pins"
    - "Mutation-proven discrimination: delete the arm, count exactly which rows go red"
    - "Safety-relevant member sets DERIVED from the runtime rather than hand-listed"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-11-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-11-GREEN-proof.txt
  modified:
    - scripts/board-readonly.test.ts

key-decisions:
  - "CR-01 is closed by a CANONICAL FORM, not a widened matcher: an fs-namespace binding may appear only as the object of a member access; every other read is refused, and the refusal reds the guard through PART ONE's existing premise assertion rather than through a new predicate free to disagree with it"
  - "The rule's exemptions are exactly two BINDING sites (NamespaceImport name, ImportClause name); a third is a decision recorded with its reason, never an appended condition"
  - "The pass is NAME-scoped, not binding-scoped, and that imprecision is kept because it runs in the direction of REFUSAL — the only direction a safety guard may be imprecise in"
  - "Escape spellings are DATA with two-sided pins and a uniqueness assertion, and their discrimination is MUTATION-proven with four mutants rather than asserted by a green run"
  - "`require` / `export *` / dynamic `import` moved from prose claims in the docblock to table rows, because a claim without a case is what this plan exists to remove"
  - "Rule 2: an fs module identity handed as a string-literal argument to ANY call is refused, which covers createRequire(url)(…), process.getBuiltinModule and process.binding without a denylist of callee names — and deliberately registers no bare specifier, so f(\"net\") cannot red the DASH-08 ban"
  - "Rule 2: a member access naming a namespace RE-ENTRY (fs.promises, fs.default) is refused, over a set DERIVED from the runtime — found by probing after the planned tasks were green"
  - "Task 3's binding is asserted, not narrated: the closure's own module list must have a sibling .ts for every scripts/*.js, and package.json + .github/workflows/ci.yml must carry check:build-parity"

patterns-established:
  - "Probe AFTER green: when a safety rule lands, enumerate what still reaches the dangerous capability and measure each shape, rather than trusting the rule's own framing"
  - "Mutate the arm, count the reds: a row that survives its own mutant is either testing a different arm (a union, stated) or testing nothing"

requirements-completed: [DASH-06, DASH-08]

coverage:
  - id: D1
    description: "A module that binds an fs namespace and then DESTRUCTURES it makes the guard RED — the verifier's exact CR-01 probe is refused, naming the module and quoting the escape"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#a namespace DESTRUCTURE of node:fs is REFUSED, not invisible (CR-01)"
        status: pass
      - kind: integration
        ref: "32-11-GREEN-proof.txt §1 — plant into the committed scripts/board-read.js, npm run check:dashboard-readonly exit 1, opaqueFsAcquisitions ['scripts/board-read.js: { writeFileSync, rmSync } = fsns']"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every enumerated escape shape reds the guard, and the enumeration's cardinality is asserted two-sided"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#namespace escape is REFUSED: <14 named rows>"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the namespace-escape table has exactly fourteen rows"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#no two rows in either table share a name"
        status: pass
      - kind: other
        ref: "32-11-GREEN-proof.txt §4 — MUTANT A: 14 failed | 39 passed with the canonical-form arm deleted; row 10 survives, proving the union with the older element-access arm"
        status: pass
    human_judgment: false
  - id: D3
    description: "A DIRECT member access is still admitted and still names its symbol; the live closure pin is untouched at six"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#POSITIVE CONTROL: a DIRECT member access on an fs namespace is still admitted and still named"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the derived closure fs symbol set has the expected MEMBERS / COUNT"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#CONTROL: an UNPLANTED mirror of the live closure is still green"
        status: pass
    human_judgment: false
  - id: D4
    description: "Six module-acquisition routes are refused as table rows, three of which never spell `require` or `import` at the call site"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#fs acquisition is REFUSED: <6 named rows>"
        status: pass
      - kind: other
        ref: "32-11-GREEN-proof.txt §4 — MUTANT B: exactly 3 failed with the generalised argument arm deleted; require / export * / dynamic import still pass"
        status: pass
    human_judgment: false
  - id: D5
    description: "A namespace RE-ENTRY member (fs.promises, fs.default) is refused, over a runtime-derived set"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#a member access naming `promises` RE-ENTERS a namespace and is refused (deviation, Rule 2)"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#PREMISE: the derived namespace re-entry set is non-empty and holds both known re-entries"
        status: pass
      - kind: other
        ref: "32-11-GREEN-proof.txt §6 — MUTANT D: exactly 2 failed with the re-entry refusal deleted"
        status: pass
    human_judgment: false
  - id: D6
    description: "The guard states mechanically that its subject is the committed .js and that check:build-parity is what makes that .js the program its .ts describes"
    requirement: "DASH-08"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#every closure module under scripts/ has a sibling .ts source (32-11)"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#check:build-parity exists and CI runs it — it is what makes the analysed .js the real program (32-11)"
        status: pass
      - kind: integration
        ref: "npm run build && npm run check:build-parity → 'Build parity: no tracked build output moved when tsc ran.', exit 0"
        status: pass
    human_judgment: false
  - id: D7
    description: "The named gate reaches this file, the whole suite still passes, and no residue survives"
    requirement: "DASH-08"
    verification:
      - kind: integration
        ref: "npm run check:dashboard-readonly → 57 passed, exit 0 (24 at 32-06)"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' → 74 files, 4809 passed | 2 skipped, exit 0"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the scratch root is left with no mirror residue"
        status: pass
    human_judgment: false
  - id: D8
    description: "The remaining open residual — a module identity ASSEMBLED at runtime and handed to a non-module-system call — is named in the docblock rather than closed"
    requirement: "DASH-06"
    verification: []
    human_judgment: true
    rationale: "This is a deliberate, recorded boundary of a syntactic pass, not a tested behaviour. A human deciding whether Phase 32 ships must weigh whether `process.getBuiltinModule(\"node:\" + \"fs\")` is an acceptable residual for this guard; no test can make that judgment. Logged to .planning/WINDOWS.md."

duration: 26 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 11: The DASH-06 Namespace-Escape Closure Summary

**The read-only guard now states ONE canonical form — an fs namespace may only be the object of a member access — and refuses the complement, closing the two-line ESM pattern that shipped a file-deleting module past a fully green safety control, plus two more bypasses of the same class found by probing afterwards.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-09-14T22:48Z
- **Completed:** 2026-09-14T23:14Z
- **Tasks:** 3 (plus one Rule 2 follow-on inside the same scope)
- **Files modified:** 1 source file, 2 evidence files created

## Accomplishments

- **CR-01 reproduced before it was fixed, and reproduced as a GREEN GUARD OVER A FULL WRITER** — not merely as an empty set. The verifier's exact probe appended to the committed `scripts/board-read.js` gave `npm run check:dashboard-readonly` → 24 passed, exit 0, over a module that writes and deletes any path handed to it.
- **The fix is a canonical form, not a widened matcher.** An identifier bound to an fs namespace may appear in exactly one non-binding position: the object of a property or element access. Every other READ is pushed onto `opaqueFsAcquisitions`, which PART ONE's premise case already asserts empty — so the refusal reds the guard through an assertion the file already carried rather than through a new predicate free to disagree with it. Exemptions are exactly two binding sites, with a comment saying a third is a decision.
- **Fourteen escape spellings as DATA**, driven by one iteration and one predicate, pinned two-sided, asserted non-empty before the iteration claims anything and asserted free of duplicate names. Six module-acquisition routes as a second table — `require`, `export *` and dynamic `import` were prose claims in the docblock and are now rows.
- **Mutation-proven, not merely green.** Four mutants: deleting the canonical-form arm reds exactly the 13 non-computed escape rows + the CR-01 case (row 10 survives, which is the union with the older arm shown directly); deleting the generalised argument arm reds exactly the three Rule 2 routes; deleting the re-entry refusal reds exactly the two re-entry cases; re-pointing the two PART SIX assertions at names that do not exist reds exactly those two.
- **A second live bypass found by probing after the planned work was green**, and closed: `fsns.promises.writeFile(p, "x")` left BOTH the refusal set and the mutating-symbol intersection empty — only the cardinality pin moved, by accident, gaining the member name `promises`. Now refused over a set DERIVED from the runtime.
- **The guard's subject is stated mechanically.** Every `scripts/*.js` in the closure must have a sibling `.ts` (derived from the closure's own module list), and `check:build-parity` must exist in `package.json` and be invoked by `.github/workflows/ci.yml` — measured and read, not `UNKNOWN - verify`.
- Gate case count 24 → 57. Full suite 74 files / 4809 passed | 2 skipped. `npm run typecheck`, `npm run build && npm run check:build-parity`, `npm run check:nul-bytes` all clean.

## Task Commits

1. **Task 1 RED — reproduce CR-01** - `67e703a5` (test)
2. **Task 1 GREEN — the canonical form** - `d2f7f854` (feat)
3. **Task 2 — the escape shapes as DATA** - `39f29643` (test)
4. **Task 3 — the guard's subject and its precondition** - `6a2a5189` (test)
5. **Rule 2 follow-on — namespace RE-ENTRY members, derived** - `4cac94eb` (feat)

**Plan metadata:** this commit (docs: complete plan)

## Files Created/Modified

- `scripts/board-readonly.test.ts` (modified, +637/-14) — the canonical-form rule inside `analyzeModule`, the generalised acquisition arm, the runtime-derived re-entry refusal, both data tables, 33 new cases, and a rewritten boundary list in the file docblock.
- `.planning/phases/32-board-projector-cli-dashboard/32-11-RED-baseline.txt` (created) — the guard green over a full writer, and the derivation's own sets reported by the failing case.
- `.planning/phases/32-board-projector-cli-dashboard/32-11-GREEN-proof.txt` (created) — the probe now refused, the 57-case run, the positive control with the pin still at six, all four mutants, build parity, and the addendum recording the `fs.promises` bypass.

## Decisions Made

- **The canonical form over the widened matcher.** Teaching `collectNamespaceMembers` to also recognise a destructuring pattern would have been one more heuristic per counter-example — the shape this repository has spent eight rounds on twice. The rule instead declares the ONE admitted position and refuses the complement.
- **The exemptions are two BINDING sites, and a third is a decision.** Written into the code comment, in the same posture as the three named stem exclusions and the two banned-module cardinalities.
- **The pass stays NAME-scoped.** A local that reuses a namespace identifier's spelling is treated as the namespace. The imprecision runs toward REFUSAL; making it scope-accurate would trade a false red for a possible false green. Written into the docblock so a later reader does not "fix" it.
- **The element-access arm is a UNION, not a replacement.** Row 10 of the table exists solely to keep the union under test, and MUTANT A proves it: with the new arm deleted, row 10 still passes.
- **Two tables, not one.** Namespace escapes and module acquisitions are different classes; splitting them is what lets the escape table's count stay exactly the number of escape spellings, so a new acquisition route cannot silently inflate it.
- **The generalised argument arm registers no bare specifier.** A plain call's string argument is not a module-identity position; folding it into `bareSpecifiers` would make a harmless `["net","http"].join(",")` red the DASH-08 socket ban. A CONTROL case pins that.
- **The re-entry set is derived, not listed.** Hand-maintained sets rot while every gate over them stays green — this repository's recorded second systemic failure class. The derivation asks the runtime which object-valued members of `node:fs` carry a mutating symbol as a function.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Generalised the fs-acquisition arm beyond `require` / `import`**
- **Found during:** Task 1 (probing what else reaches an fs symbol)
- **Issue:** `collectSpecifiers` refused an fs acquisition only when the callee was literally `import` or `require`. `createRequire(import.meta.url)("node:fs")`, `process.getBuiltinModule("node:fs")` and `process.binding("fs")` each return the real `node:fs` without either spelling, and none was refused.
- **Fix:** The rule is over the ARGUMENT rather than the callee: an fs module identity appearing as a string-literal argument to ANY call is an acquisition this pass cannot follow, so it is refused. Deliberately not routed through `noteSpecifier`.
- **Files modified:** scripts/board-readonly.test.ts
- **Verification:** three table rows in `ACQUISITION_SHAPES`; MUTANT B reds exactly those three; a CONTROL case proves a non-fs string literal is neither refused nor read as an import
- **Committed in:** `d2f7f854` (rule) and `39f29643` (rows and control)

**2. [Rule 2 - Missing Critical] Refused namespace RE-ENTRY members (`fs.promises`, `fs.default`)**
- **Found during:** post-Task-3 probing of the surface the canonical form still admits
- **Issue:** MEASURED, not theorised — `import * as fsns from "node:fs"; fsns.promises.writeFile(p, "x")` produced `opaqueFsAcquisitions: []` and a mutating-symbol intersection of `[]`. The writer sits behind a SECOND member access whose own expression is not an identifier, which this pass does not follow. The only thing that moved was the two-sided cardinality pin, which gained the member name `promises` — a pin catching a writer by accident is not the intersection deciding it.
- **Fix:** a member access (property, or string-literal element) naming a namespace re-entry is refused, over a set derived from the runtime. This also deleted the hand-typed `"default"` literal introduced earlier in the same plan.
- **Files modified:** scripts/board-readonly.test.ts
- **Verification:** two discrimination cases + a PREMISE case on the derived set; MUTANT D reds exactly those two cases; the probe transcript is recorded in `32-11-GREEN-proof.txt` §6
- **Committed in:** `4cac94eb`

**3. [Rule 1 - Bug] PART ONE's premise message described a smaller refusal than the code now performs**
- **Found during:** Task 3 (reading the failure text the planted probe produced)
- **Issue:** the message enumerated "a dynamic import, a require, an `export * from`, or a computed member access" — so a reader hitting a namespace-escape refusal would have been handed a message that does not describe it. That is the fabrication class CLAUDE.md names.
- **Fix:** the message now names the namespace-escape and call-acquisition routes too.
- **Files modified:** scripts/board-readonly.test.ts
- **Verification:** the planted-probe transcript in `32-11-GREEN-proof.txt` §1 shows the corrected text
- **Committed in:** `6a2a5189`

---

**Total deviations:** 3 auto-fixed (2 missing critical, 1 bug)
**Impact on plan:** All three are inside the plan's own subject — the set of routes by which the projector's closure can reach a writer. Deviation 2 in particular was a LIVE bypass of the same class as the one the plan was written to close, and closing it is the difference between a rule that refuses the shape the verifier happened to try and a rule that refuses the class. No scope creep: no production code was touched and no published shape changed.

## Issues Encountered

- **`gsd_run check tdd-red-evidence` could not classify this project's test output.** The verb parses a node:test-style TAP summary (`# tests`/`# pass`/`# fail`); vitest emits neither that nor those counters under `--reporter=tap`, so the record classified as `zero_tests_discovered` regardless of content. Nothing was fabricated to make it pass. The intentional-RED criterion is instead satisfied by evidence of the same shape, recorded in `32-11-RED-baseline.txt`: exit 1, 28 cases discovered, exactly ONE failing, and that one is the target case failing on its planned assertion while three sibling cases added in the same commit pass. `workflow.tdd_mode` is `false` in this project's config, so the gate is not enabled here in any case.
- **Executing on `main`.** The generic executor protocol treats a commit on the default branch as fatal; this project's `.planning/config.json` sets `git.branching_strategy: "none"`, the orchestrator dispatched this plan as a sequential executor on the main working tree, and every preceding Phase 32 plan committed the same way. Recorded rather than silently accepted.

## Known Stubs

None. No placeholder, no `TODO`, no skipped case was introduced. The two pre-existing suite skips (`4809 passed | 2 skipped`) are unchanged by this plan.

## Open Residuals (named, not closed)

- **A module identity ASSEMBLED at runtime and handed to a non-module-system call** — `process.getBuiltinModule("node:" + "fs")` — is not a string literal, so the generalised argument arm does not see it. `import(expr)` and `require(expr)` with a non-literal ARE refused via `opaqueSpecifiers`. Closing this would need either constant folding or a denylist of callee names; both were declined in favour of naming the boundary. Written into the file docblock and logged to `.planning/WINDOWS.md`.
- **A writer VALUE received at runtime from outside the closure** (a callback parameter that happens to be `writeFileSync`) is not decidable syntactically. Bounded by the zero-runtime-dependency assertion in PART SIX and the relative-only closure walk.
- **The subject is the committed `.js`.** A writer added to a `.ts` and not rebuilt is a program this guard never sees. Task 3 makes the dependency on `check:build-parity` an assertion, which is the strongest thing this file can do about it from inside.

## Threat Flags

None. This plan touches one `.test.ts`; it adds no endpoint, no auth path, no file-access pattern and no schema at a trust boundary. It removes surface rather than adding it.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `32-14-PLAN.md` is the remaining unexecuted plan in this phase (13 of 14 summaries now on disk).
- **`REQUIREMENTS.md` and `ROADMAP.md` phase status were deliberately NOT flipped to Complete by this plan**, per its own success criteria: DASH-06 and DASH-08 stay `Gaps Found` in the traceability table until the phase is re-verified. `roadmap.update-plan-progress 32` was run and reported no change needed (13/14 → still In Progress).
- The verifier's CR-01 reproduction is answerable now: the exact probe from `32-VERIFICATION.md:75-81` is refused, quoted verbatim in `32-11-GREEN-proof.txt` §1.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*

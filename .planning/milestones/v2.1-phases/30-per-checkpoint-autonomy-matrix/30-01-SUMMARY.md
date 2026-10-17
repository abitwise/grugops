---
phase: 30-per-checkpoint-autonomy-matrix
plan: 01
subsystem: infra
tags: [checkpoints, safety-floor, pretooluse-hook, config-reader, two-key, typescript]

requires:
  - phase: 25-governance-admission
    provides: readGovernanceConfigResult (the discriminated fail-closed reader) and the per-name env grant precedent in hooks/admission-guard.ts
  - phase: 28-kit-consistency-audit
    provides: SAFETY_FLOORS in scripts/audit-model.ts, the claim registry's depends_on vocabulary, and the AP-1 "a gate prints a PASS line for a check it did not perform" anti-pattern
  - phase: 05-safety
    provides: hooks/guard.ts, its DEPLOY pattern set, GRUGOPS_PROD_DEPLOY_APPROVED and the exit-0-plus-JSON deny mechanism
provides:
  - scripts/checkpoints.ts — the ONE checkpoint roster, ternary vocabulary, fail-closed canonicalizer, derived floor subset, per-floor env var name derivation, two-key resolution and run banner
  - the `checkpoints` config object on both JSON twins, at the roster default
  - the checkpoint matrix on readGovernanceConfigResult, with four degenerate-shape branches and a refusal list
  - a hooks/guard.ts that consults the matrix, demands key two for a lowering, refuses self-set of the whole GRUGOPS_FLOOR_* family, and prints the run banner
  - scripts/js-import-closure.ts — the derived transitive .js import closure the mirror-spawn gates consume
  - the AUTO-07 whole-run differential against a blob-pinned pre-phase guard
affects: [30-02, 30-03, 30-04, 30-06, 30-09, mirror-spawn gates, floor-invariance]

actuals:
  tokens: 50107
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "`as const satisfies Record<K, V>` as the compile-time missing-member proof for a closed roster — the tree's first use of `satisfies`"
    - "Derive the transitive .js import closure from the bytes instead of hand-listing mirror dependencies"
    - "A banner keyed on the DECLARED config value, not the enforced one, so banner and denial cannot contradict each other"
    - "Two-key authorization: an agent-writable config declaration plus an agent-unsettable session env var read fresh per hook invocation"

key-files:
  created:
    - scripts/checkpoints.ts
    - scripts/checkpoints.test.ts
    - scripts/autonomy-zero-config.test.ts
    - scripts/js-import-closure.ts
  modified:
    - hooks/guard.ts
    - hooks/guard.test.ts
    - scripts/context-io.ts
    - scripts/audit-model.ts
    - scripts/floor-invariance.test.ts
    - agent-factory/config/factory.config.json
    - agent-factory/seed/.grugops/factory.config.json
    - scripts/check-imperative-lexicon.ts
    - scripts/context-freshness.ts
    - scripts/trace-freshness.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/check-uat-oracles.test.ts

key-decisions:
  - "The run banner is its own stderr line on EVERY invocation, not the first line of a denial reason — the plan's two instructions were mutually exclusive and the verifiable one won"
  - "The checkpoint matrix hangs off GovernanceConfigResult via an intersection type, so the fail-OPEN value reader is untouched and never becomes a second matrix authority"
  - "The self-set detector matches the GRUGOPS_FLOOR_* prefix FAMILY, with the derived names asserted into it — a per-name list would refuse today's floors and allow tomorrow's"
  - "hooks/guard.ts re-frozen at de37e4fb in the same commit as its change (D-24)"
  - "Mirror dependency sets are DERIVED by an import-closure walk, not relisted — four hand-lists went stale in one commit"

patterns-established:
  - "Pitfall 6 applied to an intersection: count the denominator by traversing the OTHER side of the intersection, and count DISTINCT ids so adjacency merges rather than inflates"
  - "Every moved cardinality pin carries its cause in place, naming what was added and why the guarded answer did not move"

requirements-completed: [AUTO-01, AUTO-02, AUTO-03, AUTO-07]

coverage:
  - id: D1
    description: "A config-only lowering of protected_branch_merge changes nothing: with `checkpoints.protected_branch_merge` set to `off` or `notify` and no GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE in the hook's env, `git push origin main` still denies."
    requirement: "AUTO-03"
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#config says `off`, NO grant variable → still DENIES, naming the checkpoint AND the missing variable"
        status: pass
      - kind: integration
        ref: "hooks/guard.test.ts#config says `notify`, NO grant variable → also DENIES (both values are lowerings, D-07)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The denial names both the checkpoint id and the exact missing env var name (D-10)."
    requirement: "AUTO-03"
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#config says `off`, NO grant variable → still DENIES, naming the checkpoint AND the missing variable"
        status: pass
    human_judgment: false
  - id: D3
    description: "A command that inline-sets any GRUGOPS_FLOOR_* variable is refused, whether or not the variable is already present in the environment."
    requirement: "AUTO-03"
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#guard.js — AUTO-03 the agent may never set its own floor grant (D-09) (6 shapes + a not-yet-on-roster family name)"
        status: pass
    human_judgment: false
  - id: D4
    description: "With no `checkpoints` object in config the guard's decision for every payload is byte-identical to the pre-phase guard, and its output differs by exactly one added banner line."
    requirement: "AUTO-07"
    verification:
      - kind: integration
        ref: "scripts/autonomy-zero-config.test.ts#AUTO-07 — a zero-config run differs from the pre-phase guard by EXACTLY one banner line (5 payloads)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Equal checkpoint ids merge into ONE roster member rather than colliding or duplicating (AUTO-01 adjacency)."
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#ADJACENCY: two floor entries carrying the SAME id collapse to ONE member, never two"
        status: pass
    human_judgment: false
  - id: D6
    description: "A zero-length floor derivation is a named refusal, never an empty array; a roster of one is valid (AUTO-01 empty)."
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#EMPTY: a derivation that would return zero members THROWS by name, never returns []"
        status: pass
    human_judgment: false
  - id: D7
    description: "Roster iteration order is CHECKPOINT_DEFAULTS' declaration order and nothing else declares it; set comparisons are sorted, so order cannot change a verdict (AUTO-01 ordering)."
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#ORDERING: the roster's iteration order IS the table's declaration order, and only that"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#an id OUTSIDE the roster is dropped and recorded — the key set stays exactly CHECKPOINTS"
        status: pass
    human_judgment: false
  - id: D8
    description: "Every degenerate config shape reaches the roster default `block` by rule, never `off` — a garbage value cannot lower a checkpoint (AUTO-02)."
    requirement: "AUTO-02"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#canonicalizeDisposition (4 cases over the derived sweep, present non-strings and near-miss spellings)"
        status: pass
      - kind: integration
        ref: "hooks/guard.test.ts#a NON-CANONICAL config value never lowers, even with the grant present (fail closed by rule)"
        status: pass
    human_judgment: false
  - id: D9
    description: "hooks/guard.ts is re-frozen: git hash-object equals the updated FROZEN_GUARD_BLOB AND git diff --quiet exits 0 (D-24)."
    requirement: "AUTO-07"
    verification:
      - kind: integration
        ref: "scripts/floor-invariance.test.ts#invariant 4 — hooks/guard.ts matches its frozen baseline (D-02)"
        status: pass
    human_judgment: false
  - id: D10
    description: "The two-key rule is genuinely un-lowerable by an agent acting alone — the plan's stated prohibition, held as a claim about a family of attacks rather than about the seventeen shapes probed."
    verification:
      - kind: manual_procedural
        ref: "17-probe adversarial battery against the committed hooks/guard.js, transcribed in this SUMMARY under Adversarial Verification"
        status: pass
    human_judgment: true
    rationale: "A green suite never closes a safety floor in this repository ([[grugops-safety-invariant-green-suite-insufficient]]). The battery below covers the shapes the author could think of; D-21/D-23 require two INDEPENDENT opus red-teams and a mirror reproduction before the floor is considered proven, and surface A's red-team rounds are budgeted scope that has not yet run."
  - id: D11
    description: "The floor grant is presented honestly as session-scoped and as un-forgeable only from inside a tool call — never as narrower, and never as 'agent-unwritable' unqualified (the plan's second prohibition)."
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#KNOWN RESIDUAL: an env-supplied grant is indistinguishable from a human export"
        status: pass
    human_judgment: true
    rationale: "The mechanism half is pinned by a test, but whether the shipped WORDING overstates the grant is a reading of prose across the guard header, checkpoints.ts and (later) docs/GUARANTEES.md. Plan 30-09 owns the render where an overstated claim would actually land; a human must read the final text."

duration: 46 min
completed: 2026-09-05
status: complete
---

# Phase 30 Plan 01: End-to-end two-key checkpoint matrix on `protected_branch_merge` Summary

**One checkpoint wired through every layer — roster module, config cell on both JSON twins, discriminated reader field, hook decision, run banner — so a config-only lowering of `protected_branch_merge` denies by name while a human-granted one allows, proven by spawning the committed `hooks/guard.js` and re-frozen at a new blob in the same commit.**

## Performance

- **Duration:** 46 min
- **Started:** 2026-09-05T12:35:39+03:00 (first task commit)
- **Completed:** 2026-09-05T13:21:25+03:00
- **Tasks:** 3
- **Files modified:** 26 (4 created, 22 modified, counting `.ts`/`.js` pairs separately)

## Accomplishments

- `scripts/checkpoints.ts` is the ONE declaration of the roster. `CHECKPOINT_DEFAULTS` carries `as const satisfies Record<Checkpoint, Disposition>` — this tree's first `satisfies` — so a union member with no default is a `tsc` diagnostic; `CHECKPOINTS` is `Object.keys()` over it; `FLOOR_CHECKPOINTS` is an intersection with `SAFETY_FLOORS`, imported and never restated.
- `canonicalizeDisposition` reaches `block` for the entire non-canonical complement BY RULE — three exact string comparisons, no switch, no `default:` arm, no case folding — so `"OFF"`, `true`, `1`, `null`, `[]`, `{}` and `undefined` all gate at the strictest value rather than at a lenient one.
- The two-key rule is enforced at the point of effect: a floor declared `notify`/`off` takes effect only when `GRUGOPS_FLOOR_<ID>` is a non-empty string in the hook's own process env, read fresh on every invocation.
- One generalized self-set detector covers `GRUGOPS_PROD_DEPLOY_APPROVED` plus the whole `GRUGOPS_FLOOR_*` prefix family, with the derived names asserted into the family pattern at the point of use.
- Zero-config equivalence is asserted as a whole-run line diff against a **blob-pinned** pre-phase `guard.js`: exactly one added line across five payloads, zero removed or changed.
- A structural fix for a defect this plan created and then closed: mirror dependency sets are now DERIVED (`scripts/js-import-closure.ts`) instead of hand-listed in four places.

## Task Commits

1. **Task 1 (tracer): wire `protected_branch_merge` end-to-end** — `a4f64ec` (feat)
2. **Task 2: canonicalizer and matrix-reader unit floor** — `7224cac` (test)
3. **Task 3: zero-config whole-run differential + hook two-key cases + derived mirror closures** — `512a62d` (test)

**Plan metadata:** see the final `docs(30-01)` commit.

## The values the output block asks to be recorded

| Name | Value |
|---|---|
| `FROZEN_GUARD_BLOB` (new, `hooks/guard.ts`) | `de37e4fbd8b35795af3ce2e744346c20902f8464` |
| `FROZEN_GUARD_BLOB` (previous, Phase-5 guard) | `3501810e21308e4b7e219679a6ca30dace9b5d66` |
| `PRE_PHASE_GUARD_JS_BLOB` (`hooks/guard.js` at `b1d1c4f`) | `e86da3f8b2262d7846d6f937fd149d21d8640203` |
| `TECHNICAL_NAMES_COUNT` | 76 → 77 |
| `NON_TEST_MODULE_COUNT` | 51 → 53 |
| `TRIPWIRE_MODULES` | 50 → 52 |

## Mutations run, with their red/green results

Every mutation was applied to the **source**, rebuilt, measured against the **committed `.js`**, then reverted and re-measured green. A test that stays green under its mutation is asserting nothing.

### M1 — `canonicalizeDisposition` falls through to `"off"` instead of `"block"`

`scripts/checkpoints.ts`: `return "block";` → `return "off";` on the non-canonical arm.

**RED — 5 of 33 cases:**

| Case | File |
|---|---|
| every member of the derived garbage sweep canonicalizes to `block`, never to a lowering | `scripts/checkpoints.test.ts` |
| a PRESENT non-string value reaches `block` by rule, never by coercion | `scripts/checkpoints.test.ts` |
| a wrong-case or whitespace-padded spelling is NOT folded into a canonical value | `scripts/checkpoints.test.ts` |
| every garbage sweep value written into a roster cell reads back as `block` | `scripts/checkpoints.test.ts` |
| a non-canonical declared value resolves to `block` even with a grant present | `scripts/checkpoints.test.ts` |

**GREEN after revert:** 33/33.

The mutation's real-world consequence was also measured against the spawned guard, and the measurement is worth recording because it is *narrower* than it first appears: under M1 a config carrying `"OFF"` still DENIED, because key two was absent. The mutation is a bypass only in composition with a granted floor variable — which is precisely why the canonicalizer needs its own discriminating cases rather than relying on the hook's end-to-end denial to notice.

### M2 — a SECOND banner line emitted by the guard

`hooks/guard.ts`: one extra `process.stderr.write(...)` after the banner.

**RED — all 5 differential payloads**, each reporting `expected exactly ONE added line (the run banner), got 2: ["all checkpoints at default","MUTATION: a second banner line"]`. This is the assertion the plan required to be discriminating: a `toContain` probe would have stayed green.

**GREEN after revert**, and `git hash-object hooks/guard.ts` returned to `de37e4fb` with `git diff --quiet` exit 0, so the freeze was left intact.

### M3 (incidental, not planned) — the adjacency bug the ADJACENCY case caught

Recorded under Deviations below. It was found by an authored assertion failing on the *correct* implementation, which is the direction that matters.

## Adversarial Verification — 17 bypass probes against the committed `hooks/guard.js`

Required by the project's standing rule that a green suite is not proof for a safety invariant. Each probe spawned the committed `.js` with `CLAUDE_PROJECT_DIR` pointed at a temp root, `git push origin main` as the payload, and the environment as shown.

**Can an agent lower the floor with ONE key? — 12 probes, 12 DENY:**

| Config | Env | Result |
|---|---|---|
| `checkpoints.protected_branch_merge: "off"` | none | DENY |
| `checkpoints.protected_branch_merge: "notify"` | none | DENY |
| `"OFF"` (wrong case) | floor var set | DENY |
| `true` | floor var set | DENY |
| `1` | floor var set | DENY |
| `null` | floor var set | DENY |
| `["off"]` | floor var set | DENY |
| `" off"` (leading space) | floor var set | DENY |
| key `PROTECTED_BRANCH_MERGE` (upper) | floor var set | DENY |
| key `protected-branch-merge` (hyphen) | floor var set | DENY |
| `checkpoints: "off"` (not an object) | floor var set | DENY |
| `autonomy: "off"` alongside a lowered cell | none | DENY |

**Can an agent set key two for itself? — 5 probes, 5 DENY**, each with the variable ALREADY present in the spawn environment: `export VAR=me && …`, `VAR=me <cmd>`, `env VAR=me <cmd>`, `true; VAR=me; <cmd>`, and `(GRUGOPS_FLOOR_ANYTHING_ELSE=me); ls` — the last confirming the detector matches the family and not a name list.

**The authorized path — 1 probe, ALLOW:** `checkpoints.protected_branch_merge: "off"` with `GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=Olger`. This one matters as much as the denials: a grant that never grants is a floor that is simply not dialable, and the phase's claim is that it is dialable *by a human*.

**What this battery does NOT establish.** It covers the shapes the author could construct. D-21/D-23 require a mirror reproduction plus two independent opus red-teams before surface A's floor is considered closed, and those rounds are budgeted scope that has not run. The `human_judgment: true` entries in the coverage block above say so rather than letting seventeen green probes read as a proof.

## Files Created/Modified

- `scripts/checkpoints.ts` — the roster, ternary vocabulary, fail-closed canonicalizer, derived floor subset, `floorEnvVarName`, two-key `resolveCheckpoint`, `renderCheckpointBanner`.
- `scripts/checkpoints.test.ts` — 33 cases; the garbage sweep is DERIVED from `floor-invariance.test.ts`'s own list by source extraction, with the extraction's count asserted against an independently counted denominator.
- `scripts/autonomy-zero-config.test.ts` — the AUTO-07 whole-run differential; LCS line diff, blob-pinned baseline, independently enumerated payload count, three signals read from one captured run.
- `scripts/js-import-closure.ts` — the derived transitive `.js` import closure (see Deviations).
- `hooks/guard.ts` — pattern set split into two named groups with no regex altered; matrix consulted; two-key rule; generalized self-set detector; banner; residual note rewritten.
- `hooks/guard.test.ts` — 18 added cases over the two-key rule, the self-set family, the near-miss arms and the F-2 residual.
- `scripts/context-io.ts` — `GovernanceConfigWithCheckpoints`, `checkpointRefusals`, and `readCheckpointMatrix` with four degenerate-shape branches.
- `scripts/audit-model.ts` — `protected_branch_merge` now names `checkpoints.protected_branch_merge`; its `why` states the two-key rule.
- `scripts/floor-invariance.test.ts` — `FROZEN_GUARD_BLOB` re-baselined with the executor note about the mid-edit red.
- `agent-factory/config/factory.config.json` + `agent-factory/seed/.grugops/factory.config.json` — the `checkpoints` object, byte-identical twins.
- `scripts/context-freshness.ts`, `scripts/trace-freshness.ts`, `scripts/check-uat-oracles.test.ts`, `scripts/check-foundation-guards.test.ts` — mirror dependency sets now derived.
- `scripts/check-imperative-lexicon.ts`, `scripts/audit-model.test.ts`, `scripts/context-io.test.ts` — moved pins and fixture shapes, each with its cause in place.

## Decisions Made

**The banner is its own stderr line on every invocation, not the first line of a denial reason.** The plan's action step asked for the latter; its own `must_haves` and Task 3 acceptance criteria asked for a whole-run diff of *exactly one added line and zero changed lines*. A deny payload is a single physical line of JSON, so a banner inside `permissionDecisionReason` makes that line CHANGE, not appear — and the two instructions cannot both be satisfied. The verifiable one won. stdout was rejected outright: it is the hook's JSON channel, and a bare line there would break the deny mechanism the file exists to provide.

**The matrix hangs off `GovernanceConfigResult`, not off `GovernanceConfig`.** The plan asked to extend `GovernanceConfig` *and* to leave `readGovernanceConfig` untouched; a required field on a shared interface makes those mutually exclusive. Resolved with `GovernanceConfigWithCheckpoints extends GovernanceConfig`, carried only on the discriminated result. This is also the better answer on its merits: the value reader fails OPEN to lean by contract, and a safety matrix must never be reported by a function whose documented posture is "degrade quietly". Plan 30-03 deletes that reader and the two types collapse into one.

**The self-set detector matches the `GRUGOPS_FLOOR_*` prefix family rather than a list of derived names.** D-09 asked for an alternation over the derived names; that alternation would refuse exactly today's floors and silently allow `GRUGOPS_FLOOR_<the next one>`. It is still ONE detector; the derived names are asserted to fall inside the family at the point of use, and the guard refuses to evaluate any command if one does not.

**The `why` text of the `protected_branch_merge` floor was rewritten, not appended to.** It asserted the floor had NO config key and that naming one would imply a dial existed. That sentence became false the moment the matrix gave it a cell.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] `deriveFloorCheckpoints` counted floor ENTRIES, not distinct ids**
- **Found during:** Task 2, by the ADJACENCY case failing against the correct implementation.
- **Issue:** the Pitfall-6 denominator incremented once per member of the floor list. Two entries sharing one id therefore made the independent count (2) disagree with a correctly-merged derivation (1), and the function threw on exactly the input D-02/D-03 adjacency says must merge.
- **Fix:** the denominator counts DISTINCT ids via a `Set`, and the derivation de-duplicates its roster input. The two traversals stay independent — one walks the roster, the other walks the floor list.
- **Files modified:** `scripts/checkpoints.ts`
- **Verification:** `scripts/checkpoints.test.ts` ADJACENCY and ORDERING cases; both were red before the fix and green after.
- **Committed in:** `7224cac`

**2. [Rule 3 - Blocker] `hooks/guard.js` and `scripts/context-io.js` were dependency-free, and four hand-maintained mirror lists silently depended on that**
- **Found during:** Task 3, full-suite verification.
- **Issue:** Task 1 gave the guard a roster and a reader to consult. Four mirror-spawn sites copy an artifact into a temp tree and run it there — `scripts/context-freshness.ts`, `scripts/trace-freshness.ts`, `scripts/check-uat-oracles.test.ts`, `scripts/check-foundation-guards.test.ts` — and each carried a hand-written list of the `.js` files to copy. Every list went stale in one commit. **92 cases across 7 files failed**, and the failure mode is the dangerous one: the child died with `ERR_MODULE_NOT_FOUND`, and the freshness gates report a render that could not START as STALE. A crash was wearing a verdict's clothes.
- **Fix, structural rather than a relist:** `scripts/js-import-closure.ts` derives the transitive `.js` closure from the bytes of the files themselves and refuses (named throw) on an unresolvable or out-of-tree edge rather than returning short. All four sites consume it. Adding an import anywhere in the graph now updates every mirror with no edit.
- **Why not just add the four files to the four lists:** that is [[grugops-set-literal-drift]] — the repository's recorded second systemic failure class — answered with a fifth copy of the same rotting fact.
- **Files modified:** `scripts/js-import-closure.ts` (new), `scripts/context-freshness.ts`, `scripts/trace-freshness.ts`, `scripts/check-uat-oracles.test.ts`, `scripts/check-foundation-guards.test.ts`
- **Verification:** the 7 failing files re-run green; `npm run freshness`, `freshness:context`, `freshness:traceability`, `node scripts/check-foundation-guards.js` and `node scripts/check-uat-oracles.js` all exit 0.
- **Committed in:** `512a62d`

**3. [Rule 3 - Blocker] Three derived-cardinality pins fired, each moved with its cause named in place**
- **Found during:** Task 3, full-suite verification. These are companion-edit tripwires working as designed — `check-imperative-lexicon` even prints "walk both consumers in this file BEFORE updating".
- **`TECHNICAL_NAMES_COUNT` 76 → 77:** the `checkpoints` config key. Both consumers were walked first: `countWords` collapses each Technical Name to one placeholder token and `checkpoints` is already one word, so no sentence changes length — confirmed by the gate reporting the same 2166 sentences (414 procedural / 1752 descriptive) and 0 findings before and after. Nested keys do not enter the set, which is why this is +1 and not +3.
- **`NON_TEST_MODULE_COUNT` 51 → 53** and its two sibling enumerations (the `scripts/`-scoped count 43 → 45, the comparison denominator 43×3 → 45×3): `scripts/checkpoints.ts` and `scripts/js-import-closure.ts`. Neither decides a section extent nor declares a frontmatter parser, so the LANG-07 owner answer is unmoved — stated in the comment rather than left implicit.
- **`TRIPWIRE_MODULES` 50 → 52:** the two test modules this plan added.
- **Files modified:** `scripts/check-imperative-lexicon.ts`, `scripts/check-foundation-guards.test.ts`
- **Committed in:** `512a62d`

**4. [Rule 3 - Blocker] Two `scripts/audit-model.test.ts` cases asserted the premise this plan retires**
- **Found during:** Task 1.
- **Issue:** `backed.length` was pinned at 3 and a case asserted `protected_branch_merge` declares NO config key. Giving it a cell makes both false.
- **Fix:** the first now derives its denominator from `SAFETY_FLOORS.length` instead of a literal. The second was REPLACED, not weakened: it asserts the cell exists, resolves live, and that the `why` no longer claims otherwise. A new case drives `safetyFloorLiveValue`'s now-unreachable `null` arm directly, so it is not left unexercised.
- **Committed in:** `a4f64ec`

**5. [Rule 3 - Blocker] Three `scripts/context-io.test.ts` fixtures could not construct the widened result type**
- **Fix:** a shared `result()` helper carrying the roster default, imported from the committed `checkpoints.js` rather than transcribed.
- **Committed in:** `a4f64ec`

---

**Total deviations:** 5 auto-fixed (1 × Rule 1, 4 × Rule 3). **Impact:** deviation 2 is the significant one — it is a real defect this plan created and then closed structurally, and the fix is reusable by every later plan in this phase, all of which add imports to the same graph. Nothing else was scope creep: 3, 4 and 5 are companion edits the tree's own tripwires demanded, and each moved number carries its cause.

## The one disclosed behaviour change at zero config

AUTO-07 promises a zero-config repo behaves exactly as before. It does, for every input in the differential table and for every input the pattern set matches — the decision and the wording are byte-identical, and the whole-run diff is one added line.

There is **one input class where the new guard is strictly STRICTER**, and it is named here rather than left for a reader to find: a command that inline-sets any `GRUGOPS_FLOOR_*` variable is now refused, where the Phase-5 guard would have allowed it (it knew no such variable). This is a tightening on an input class that did not exist before this phase, it is required by D-09, and it is deliberately NOT in the differential table — adding it would make the diff show an added deny line and turn a correct tightening into a red test.

## Issues Encountered

**The guard freeze cannot be green mid-edit, and that is the mechanism.** As RESEARCH F-8 and Pitfall 5 warned: after updating `FROZEN_GUARD_BLOB` the hash comparison passed immediately while `git diff --quiet hooks/guard.ts` kept throwing until the commit. Observed exactly once, read as expected, and the verification was re-run after the commit (`git hash-object` → `de37e4fb`, `git diff --quiet` → exit 0, 155/155 green). The executor note is now in the file so the next reader does not have to rediscover it.

**One pre-existing suite failure, not fixed.** `scripts/frontmatter.test.ts`'s D-49 false-red control fails on `.planning/phases/29.1-per-role-model-assignment/29.1-VERIFICATION-round4.md`, which carries `\[` inside a double-quoted scalar. Both inputs to that predicate — `scripts/frontmatter.*` and the document — are untouched by this plan (`git diff b1d1c4f HEAD` contains neither), and the document was committed at `7d52ee0`, an ancestor of this plan's base. Logged to `deferred-items.md` as V-30-01-01 with a suggested owner. Final suite: **2507 passed / 1 failed (pre-existing) / 2 skipped across 57 files.**

## Known Stubs

None. Every layer this plan names is wired and exercised end to end. Two things are deliberately **held out of scope by the plan itself** and are not stubs:
- `notify` does not yet write the D-11 shared-context finding note. At this plan's scope `notify` is an authorized allow that the banner names; the note is later-plan work.
- The `checkpoints` markdown twin (`agent-factory/config/factory.config.md`) is untouched — plan 30-06 owns it, and its consistency oracles run there.

## Carried forward for a later plan in this phase

- `docs/audit/28-claim-registry.md:839` still reads ``| `protected_branch_merge` | **HARD LIMIT, no config key** …``. That is now false. It was left alone deliberately: the registry is a frozen-anchor surface whose edits owe companion rows, and plan 30-09 owns the render and the anchored-claim replacement. **It must not be allowed to ship stale.**
- `scripts/validate-agent-factory.ts` does not yet enum-check `checkpoints` values or refuse a present `autonomy` — plan 30-02/30-06 scope, per D-05 and D-08.

## Threat Flags

None. Every surface this plan touched is inside the plan's own `<threat_model>`: the config cell (T-30-01), the self-set detector (T-30-02), the reader's degenerate shapes (T-30-04), the banner (T-30-05) and the guard freeze (T-30-06). T-30-03 (settings-file env injection) is `accept`, and it is now pinned as a KNOWN-residual test rather than living only in a research document. No package was installed, so T-30-SC remains not applicable.

## User Setup Required

None — no external service configuration. A human who wants to exercise a lowering exports `GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=<name>` in the shell that launches Claude; that is the feature, not setup.

## Next Phase Readiness

The tracer's whole point was to learn whether the wiring is right after one commit rather than after ten, and it found exactly the class of problem it existed to find: the mirror-closure defect would have compounded with every later plan that adds an import to this graph, and it is now closed structurally for all of them.

Ready for plan 30-02 (the floor-set remap). The roster union in `scripts/checkpoints.ts` carries an explicit TRACER SCOPE note pointing at 30-04, which widens it from the derived tag set and adds the two-sided derived-vs-roster assertion.

**Blocker for the phase, not for the next plan:** per D-21/D-23, surface A's floor is not closed by this plan. Seventeen adversarial probes and a green suite are a floor, not a proof; the mirror reproduction and the two independent opus red-teams are still owed.

---
*Phase: 30-per-checkpoint-autonomy-matrix*
*Completed: 2026-09-05*

## Self-Check: PASSED

All four created files exist on disk (`scripts/checkpoints.ts`, `scripts/checkpoints.test.ts`,
`scripts/autonomy-zero-config.test.ts`, `scripts/js-import-closure.ts`), both config twins carry the
`checkpoints` object, and all four commits (`a4f64ec`, `7224cac`, `512a62d`, `b4367aa`) are in the
log. Verified 2026-09-05.

---
phase: 30-per-checkpoint-autonomy-matrix
plan: 07
subsystem: infra
tags: [guarantees, generated-document, freshness-gate, language-gates, derived-set, typescript, fail-closed]

requires:
  - phase: 28-kit-consistency-audit
    provides: "the claim registry's six `kind: safety` rows, the floor→claims index, and generate-safety-surface.ts's fixed-OUT generator shape"
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "check-banned-claims.ts and check-public-docs-vocabulary.ts, their derived scan sets, their two-sided pins and the recorded round-6 CHANGELOG.md finding"
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "plan 30-01's checkpoint roster, CHECKPOINT_DEFAULTS, floorEnvVarName, BANNER_ALL_DEFAULT and js-import-closure.ts; plan 30-02's four-member SAFETY_FLOORS; plan 30-03's single fail-closed readGovernanceConfig; plan 30-06's retirement of the `autonomy` scalar"
provides:
  - "`scripts/generate-guarantees.ts` — a fixed-OUT, fail-closed generator joining the registry's six `kind: safety` rows to the live checkpoint matrix through each row's `depends_on` floors"
  - "a SHORT-join refusal distinct from the empty-join refusal, asserted against a denominator produced by a raw line pass over the registry bytes that shares no loop, parser or intermediate with the join"
  - "`docs/GUARANTEES.md` — the generated public page, with a residual section stating the floor grant's tier rather than an unqualified impossibility"
  - "`scripts/guarantees-freshness.ts` — a byte-equality drift gate whose mirror copy set is the DERIVED transitive import closure, with a count-pinned data half and a refusal when no config landed"
  - "membership of the generated page in BOTH language gates, derived from the generator's exported OUT, proven by planted literals at file:line:column"
  - "PUBLIC_DOCS_SCAN_COUNT 10 → 11 and BANNED_CLAIM_SCAN_COUNT 117 → 118 (overlap 1 → 2), both read off the gates' own refusals"
  - "an ENUMERATED, count-pinned admission set for the one scan member that sits under an excluded segment — the finding this plan was told not to ship silently"
affects: [30-08, 30-09, check-banned-claims, check-public-docs-vocabulary, ci.yml, verify-work]

actuals:
  tokens: 36624
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "a generated document's SHORT case refused as loudly as its EMPTY case, against a denominator from a second, mechanically different pass over the same bytes"
    - "a mirror-spawn gate whose JavaScript copy set is the derived import closure and whose DATA copy set is declared-and-count-pinned, because a data source is invisible in an import graph"
    - "a mirror that must prove its INPUT actually landed: with no config the render is byte-identical to a correct page, so 'zero configs copied' is a named refusal"
    - "one path declaration consumed by three modules (generator, two gates) plus two test harnesses — a rename moves all five or none"
    - "an exception to a fail-closed invariant recorded as an ENUMERATED, count-pinned set with the original predicate kept exact over the subset it was written about, never as a widened predicate"

key-files:
  created:
    - scripts/generate-guarantees.ts
    - scripts/generate-guarantees.js
    - scripts/generate-guarantees.test.ts
    - scripts/guarantees-freshness.ts
    - scripts/guarantees-freshness.js
    - docs/GUARANTEES.md
  modified:
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-public-docs-vocabulary.test.ts
    - scripts/check-claim-anchors.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/context-io.test.ts
    - .github/workflows/ci.yml
    - package.json

key-decisions:
  - "The independent denominator is a RAW LINE PASS over the registry's bytes counting the exact `- kind: safety` field line — not a second call to the registry parser. Two mechanically different readings of one document is what makes their agreement evidence; a second call to the same parser would be the loop vouching for itself."
  - "That pass is deliberately FENCE-BLIND. A safety-kind line written inside a fenced example is counted by it and not by the parse, the two disagree, and the render REFUSES. Teaching it the parser's fence grammar would make it a copy of the parser rather than an independent witness, and the failure direction of the blindness is closed."
  - "The mirror's data copy set is DECLARED and count-pinned rather than derived, because a generator's data sources are paths it reads at run time and are invisible in its import graph. The JavaScript half IS derived, via js-import-closure.ts, so the analog's hand-maintained cpSync list was not copied."
  - "The freshness gate refuses when ZERO config candidates landed in the mirror. With no config the render states the roster defaults, which on a tree that has lowered nothing is byte-identical to the committed page — so a silently config-less mirror would report `fresh` today and keep reporting it on the day a floor was lowered."
  - "check-banned-claims gets its OWN named `guarantees` part rather than relying on the public-docs corpus that already reaches the page. The corpus route works, but this gate's recorded round-6 finding is that inherited membership is how a document falls outside a scan; a page whose entire subject is safety claims must not depend on a sibling gate's corpus continuing to include it. The double membership is counted by the existing overlap counter (1 → 2)."
  - "A SEGMENT-CLASS EXCEPTION WAS REQUIRED, and it is recorded as a finding rather than absorbed — see `## Finding: the segment-class exception` below."
  - "The CI workflow was wired in the same plan (Rule 2). A freshness gate package.json defines and CI never runs is this tree's own recorded freshness:adapters defect, and the ci.yml block says so twice in its own comments."

patterns-established:
  - "Assert the harness's premise IN-PROCESS before reading the gate's verdict: the planted-drift case proves the committed bytes really differ from a fresh render before it believes the gate's STALE."
  - "A moved pin quotes the refusal that moved it, verbatim, from a run that actually happened — the pin was set back to its old value, the gate re-run, and the transcript copied from that output."

requirements-completed: [AUTO-05, AUTO-02]

coverage:
  - id: D1
    description: "A fixed-path, fail-closed generator renders docs/GUARANTEES.md by joining the registry's six `kind: safety` rows to the live checkpoint matrix, reproducibly."
    requirement: "AUTO-05"
    verification:
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#the LIVE tree's join length equals the independently counted safety-kind registry rows"
        status: pass
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#rows are emitted in ASCENDING claim-id order, and two runs are byte-identical"
        status: pass
      - kind: integration
        ref: "npm run generate:guarantees && npm run generate:guarantees && md5 docs/GUARANTEES.md (identical across three runs: f9c5291484674012cc4be68b3302d6f6)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The join refuses BOTH an empty result and a short one, with two distinct named errors, against an independently produced safety-row denominator."
    requirement: "AUTO-05"
    verification:
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#REFUSES a registry whose bytes declare more safety rows than the join produced (SHORT)"
        status: pass
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#REFUSES a registry with ZERO safety rows (EMPTY) with a DIFFERENT named error"
        status: pass
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#the join length assertion does not share a loop with the join"
        status: pass
    human_judgment: false
  - id: D3
    description: "A hand edit to the generated page is caught by a byte-equality freshness gate that mirrors, and that never reports fresh when the mirrored regeneration cannot run cleanly."
    requirement: "AUTO-05"
    verification:
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#exits non-zero on ONE character of planted drift, and names the regeneration command"
        status: pass
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#FAIL-CLOSED: a generator that cannot run cleanly NEVER reports fresh"
        status: pass
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#FAIL-CLOSED: an unwritable mirror directory NEVER reports fresh"
        status: pass
      - kind: integration
        ref: "adversarial self-reproduction: four refusal branches driven by hand against the committed .js, plus a mutation-kill of the config-landed refusal (see ## Adversarial verification)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The generated page is a member of BOTH language gates, derived from the generator's own declared output path, with each gate's corpus size asserted."
    requirement: "AUTO-05"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#PLANT: a banned literal in docs/GUARANTEES.md is named at file:line:column"
        status: pass
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#PLANT: a retired PROSE form in the generated guarantees page is NAMED by this gate"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#docs/GUARANTEES.md is a MEMBER of the live derived scan set, and the pin counts it"
        status: pass
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#the live tree derives exactly PUBLIC_DOCS_SCAN_COUNT documents, both directions"
        status: pass
    human_judgment: false
  - id: D5
    description: "Deleting the generated page makes each gate report a derivation refusal rather than throwing an unhandled error."
    requirement: "AUTO-05"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#REPORTS a missing docs/GUARANTEES.md by name rather than dying with a stack trace"
        status: pass
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#REPORTS a missing docs/GUARANTEES.md by name rather than crashing with ENOENT"
        status: pass
    human_judgment: false
  - id: D6
    description: "The page states the floor-grant mechanism's tier honestly — un-forgeable from inside a tool call, reachable by an agent that can write the host's settings files — rather than an unqualified impossibility."
    requirement: "AUTO-02"
    verification:
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#the RESIDUAL section names the vector, the narrowing measure and the session scope"
        status: pass
    human_judgment: true
    rationale: "The assertion proves the four required elements are PRESENT in the rendered text. Whether the paragraph reads as an honest tier statement to a human — rather than as a hedge, or as an overstatement in different words — is the judgement AUTO-02 exists for and no assertion in this tree can make it. A reader should read `docs/GUARANTEES.md` § 'The residual this page does not close' end to end."
  - id: D7
    description: "The plan's own instruction to record a required segment-class exception as a finding rather than ship it silently."
    verification: []
    human_judgment: true
    rationale: "The plan states this outcome 'must not ship silently' and requires the SUMMARY to record it with its reasoning. Whether the enumerated-admission-set treatment is the right disposition — as against moving the render to the repository root, which research recommended and D-17 declined — is a decision for a human, not a test."

duration: 105 min
completed: 2026-09-05
status: complete
---

# Phase 30 Plan 07: The guarantees render, its freshness gate, and both language gates Summary

**A fixed-path generator that joins the claim registry's six `kind: safety` rows to the live checkpoint matrix and refuses a short join as loudly as an empty one, a byte-equality freshness gate whose mirror copy set is derived rather than hand-listed, and membership of the new public page in both claim gates in the same plan that created it.**

## Performance

- **Duration:** 105 min
- **Started:** 2026-09-05T14:59:00Z (approx — first tool call of the executor session)
- **Completed:** 2026-09-05T16:45:01Z
- **Tasks:** 3
- **Files created/modified:** 17

## Accomplishments

- `scripts/generate-guarantees.ts` renders `docs/GUARANTEES.md` from two sources and nothing else, at a fixed literal `OUT`, with a named `REGEN_COMMAND` and a `pathToFileURL` entry guard.
- The join's length is asserted against `declaredSafetyRows()`, a raw line pass over the registry's bytes that calls no parser — so a render that published five of six rows is a distinct named refusal rather than a clean green build.
- `scripts/guarantees-freshness.ts` mirrors and byte-compares. Its JavaScript copy set is the **derived** transitive import closure (twelve modules today); its data copy set is declared beside the generator and count-pinned; and it refuses if no config candidate landed in the mirror.
- `docs/GUARANTEES.md` is a member of **both** language gates, by importing the generator's exported `OUT` — one declaration, five consumers, no second literal of the path anywhere.
- The gate wiring landed in the same commit as the document, which is the whole point: §F-6 measured this page as born outside both gates, and the deferral would have been the defect.

## The numbers this plan was asked to record

| Quantity | Value | Where it was measured |
|---|---|---|
| Safety-row denominator (the join's expected length) | **6** | `declaredSafetyRows()` over `docs/audit/28-claim-registry.md`; matches `guaranteesJoin().length` |
| Banned-claims corpus, before | 117 | `node scripts/check-banned-claims.js` PASS line, pre-change |
| Banned-claims corpus, after | **118** | kit 73, publicDocs 12, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2, guarantees 1, **overlap 2** |
| Public-docs scan set, before | 10 | `node scripts/check-public-docs-vocabulary.js` PASS line, pre-change |
| Public-docs scan set, after | **11** | root 4, examples 5, kitReadme 1, guarantees 1 |
| Admission test (banned claims) | **0 findings over 118/118 elements** | the run that moved the pin |
| Admission test (vocabulary) | **0 retired-vocabulary hits over 11 documents** | the run that moved the pin |
| Was a segment-class exception required? | **YES** — see the finding below | `bannedClaimExcluded("docs/GUARANTEES.md")` is `true` via `**/docs/` |

## Task Commits

1. **Task 1: the generator and its count-asserted join** — `836fbbc` (feat)
2. **Task 2: the byte-equality freshness gate** — `bf01991` (feat)
3. **Task 3: wire the new document into both language gates by derivation** — `e24a051` (feat)

## Finding: the segment-class exception

The plan required that if adding the member forced an exception into the segment-class exclusion, it be recorded here rather than shipped silently. **It did, in a narrower form than the plan anticipated, and this is that record.**

**What is unchanged.** `BANNED_CLAIM_EXCLUDED_LOCATIONS` is byte-unchanged. `bannedClaimExcludedBy` is byte-unchanged. The walk is byte-unchanged: `**/docs/` is still enforced at the point descent is decided, at any depth. No carve-out was written into the exclusion or into the predicate that reads it.

**What did change, and why it is nonetheless an exception.** Two permanent cases in `scripts/check-banned-claims.test.ts` asserted that the live scan and the exclusion list do not overlap:

- *"the derivation never reaches an excluded location, so this gate cannot scan itself"* — `bannedClaimExcluded(member)` is `false` for every member;
- *"NO SEGMENT-CLASS NAME SITS BELOW THE ROOT OF A LIVE SCAN MEMBER"* — no member carries `docs`, `.planning` or `scripts` among its directory components.

`docs/GUARANTEES.md` violates both, because D-17 records the render's home under `docs/`. Both cases now compare against an **enumerated** set, `ADMITTED_BY_NAME_UNDER_AN_EXCLUDED_SEGMENT = [OUT]`, instead of against the empty array. That is a weaker statement than "no member overlaps", and saying otherwise would be the overstatement this milestone exists to stop.

**How it is bounded, three ways.**

1. The set is **enumerated**, not a predicate. A second document does not join it by existing; it reds until someone writes down why — the same discipline `BANNED_CLAIM_EXCLUDED_LOCATIONS` itself carries.
2. Its **cardinality is pinned** at 1, so the equality cannot be satisfied by both sides emptying out together.
3. The **original predicate is kept exact over the set it was written about.** A new assertion in each case derives the walk-derived parts (`kit`, `skillSources`, `claudeAdapters`, `pluginManifests`), floors them for non-vacuity, and asserts they overlap the exclusion **nowhere**. The exclusion is enforced at the walk; that guarantee is intact, and a future `agent-factory/**/docs/` still reds.

**The argument for admitting it at all.** `docs/GUARANTEES.md` arrives through a NAMED part that never walks — the same mechanism as `install/README.md`, differing only in that its directory happens to carry an exclusion entry. An overlap for a walk-derived member means the walk descended where it was told not to; an overlap for a named member means a deliberate admission. Conflating the two is what would have made the widening dishonest.

**The alternative, rejected with its reason.** §F-6 offered two dispositions: move the render to the repository root, where membership follows by construction; or keep `docs/GUARANTEES.md` and close the hole explicitly. D-17 records the path under `docs/`, and the plan directed the second disposition. Carving `docs/GUARANTEES.md` out of the `**/docs/` segment class — the third option, which nobody offered — would have deleted a fail-closed exclusion's meaning for every other path under every `docs/` in the tree in order to admit one file. **The enumerated exception is the smaller error; a human should decide whether it is the right one, or whether the render belongs at the repository root after all.**

## Adversarial verification (a green suite is not proof)

Each of the freshness gate's refusal branches was driven **by hand against the committed `.js`**, outside the test harness, and each mutation was watched.

| Attempt | Result |
|---|---|
| Append one byte to `docs/GUARANTEES.md`, run the gate | `STALE: docs/GUARANTEES.md …` — exit 1 |
| Append a stray `- kind: safety` line to the registry (breaks the mirrored generator) | generator's named refusal printed, then `the generator did not run cleanly` — exit 1, no fresh marker |
| `TMPDIR` pointed at a non-existent directory | `the temp mirror directory could not be created …` — exit 1, no fresh marker |
| Control, unmutated tree | `Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration.` — exit 0 |
| **Mutant:** committed `.js` edited so `configsCopied` never increments | **KILLED** — `no factory config was found at any of the declared candidates …` — exit 1 |
| **Premise:** lower `checkpoints.open_pr` to `off` in the live config and re-run | `STALE` — exit 1, which proves the mirror genuinely **reads** the config rather than rendering the roster defaults |

The last row is the assertion the plan named as load-bearing: it establishes that the byte comparison is over a page rendered from the same matrix the real tree carries, not from a mirror that quietly lost its config and happened to agree.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The mirrored generator silently no-opped at exit 0 on macOS**

- **Found during:** Task 2, the gate's first run.
- **Issue:** `mkdtempSync(join(tmpdir(), …))` returns a path under `/var`, which is a symlink to `/private/var`. Node realpath-resolves a main module, so the spawned generator's `import.meta.url` (`/private/var/…`) did not match `pathToFileURL(process.argv[1]).href` (`/var/…`). The entry guard therefore did not fire: **status 0, empty stdout, no output file** — the fabricated success the guard exists to prevent, arriving through the harness instead of through Windows.
- **How it surfaced:** the gate's own fail-closed *"the mirrored regeneration wrote nothing"* branch, not a test. Had that branch not existed, the gate would have compared against a stale mirror file or crashed.
- **Fix:** `realpathSync(mkdtempSync(...))`, following the recorded precedent in `scripts/now-running-freshness.ts`, with the observation written into the header so a later reader meets the measurement rather than the guess.
- **Files modified:** `scripts/guarantees-freshness.ts`, `scripts/guarantees-freshness.js`
- **Committed in:** `bf01991`

**2. [Rule 2 - Missing Critical] The new freshness gate was defined in package.json and invoked by nothing in CI**

- **Found during:** Task 2.
- **Issue:** `.github/workflows/ci.yml` runs five of the tree's freshness scripts by name. A newly added one runs on a pull request only as a side effect of a test file spawning it — one `--exclude` pattern away from being un-gated. The workflow's own comments record this exact defect twice (`freshness:adapters` shipped for a whole phase in that state).
- **Fix:** `npm run freshness:guarantees` added to the ubuntu gate block, with the "wired at both ends" reasoning and the remedy a red should send a developer to.
- **Files modified:** `.github/workflows/ci.yml`
- **Committed in:** `bf01991`

**3. [Rule 3 - Blocking] Seven tree-wide derived-set pins had to move for the two new modules**

- **Found during:** Tasks 1, 2 and 3.
- **Issue:** this tree pins its module corpus, its test-module corpus, its entry-guard set and its config-path-site set two-sided, on purpose, so a new module is a structural event. Two new non-test modules and one new test module made seven assertions red across three files. A commit that added the modules without moving the pins would leave the tree red at that HEAD.
- **Fix:** each pin moved **in the commit that adds the module**, with the entrant named and its reason recorded at the pin: `NON_TEST_MODULE_COUNT` 53 → 55, the flat/recursive `scripts/` corpus 45 → 47 (and its `× 3` comparison count), `TRIPWIRE_MODULES` 52 → 53, the `isEntry` set 10 → 11, the public-docs `DERIVATION_REFUSALS.push` site count 3 → 4, and `CONFIG_PATH_SITE_COUNT` 8 → 10.
- **The question the config-path pin exists to force was asked of both entrants, and answered:** neither is a second governance reader. `generate-guarantees.ts` declares the candidate paths so the freshness gate can mirror them and takes its matrix from `readGovernanceConfig`; `guarantees-freshness.ts` copies bytes and parses nothing. **AUTO-06's "exactly one governance reader" is unmoved.**
- **Files modified:** `scripts/check-foundation-guards.test.ts`, `scripts/check-claim-anchors.test.ts`, `scripts/check-public-docs-vocabulary.ts`, `scripts/context-io.test.ts`
- **Committed in:** `836fbbc`, `bf01991`, `e24a051`

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 blocking).
**Impact on plan:** No scope creep. Deviation 1 is a correctness fix to this plan's own artifact. Deviation 2 makes this plan's must_have ("a hand edit to the generated document is caught") true on a pull request rather than only on a developer's machine. Deviation 3 is the unavoidable cost of adding modules to a tree that pins its module sets two-sided, and every moved pin names its entrant.

## Issues Encountered

- **`scripts/context-io.test.ts` was edited although it is adjacent to plan 30-08's ownership** (30-08 owns `scripts/context-io.ts`, `hooks/guard.ts`, `floor-invariance.test.ts`, `autonomy-zero-config.test.ts`). Only the `CONFIG_PATH_SITES` annotation table and its pin were touched; no reader, no fixture and no behavioural case was altered. The edit could not be deferred without leaving the tree red.
- **Pre-existing failure, unchanged and NOT caused by this phase:** `scripts/frontmatter.test.ts` D-49 false-red control fails on `.planning/phases/29.1-…/29.1-VERIFICATION-round4.md` (V-30-01-01). The regression baseline was 1 failed / 2641 passed; this plan's tree is **1 failed / 2667 passed / 2 skipped**, the same single failure over 26 more passing cases.

## Known Stubs

None. `docs/GUARANTEES.md` is fully rendered from live sources; no placeholder text, no unwired data path, no `TODO`/`FIXME` in any file this plan created.

## Threat Flags

None. Every surface this plan added is covered by the plan's own threat register (T-30-26 through T-30-30). No new network endpoint, auth path, file-access pattern or schema at a trust boundary was introduced; the generator reads two files and writes one at a fixed literal path.

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

- Plan 30-08 can proceed: `scripts/context-io.ts`, `hooks/guard.ts`, `floor-invariance.test.ts` and `autonomy-zero-config.test.ts` were not touched. If 30-08 adds a config-resolving site or a module under `scripts/`, the same pins move again and the annotation table in `context-io.test.ts` now has two more rows to sit beside.
- **A standing obligation for whoever verifies this phase:** the residual paragraph in `docs/GUARANTEES.md` and the enumerated segment-class admission are both human-judgement items (coverage D6, D7). Neither can be closed by a test.
- **`UNKNOWN - verify`:** whether the render belongs at the repository root after all. Moving it there would delete the enumerated exception entirely and make membership follow by construction. D-17 records `docs/GUARANTEES.md`; this plan honoured that and paid the stated price.

## Self-Check: PASSED

- All six created files verified present on disk with `[ -f ]`.
- All three commit hashes verified present with `git log --oneline --all`.
- Plan verification block re-run at HEAD: `npx vitest run --exclude '**/scripts/e2e/**'` → 1 pre-existing failure, 2667 passed; all **eight** freshness scripts green including `freshness:guarantees`; `check:banned-claims`, `check:public-docs`, `check:claim-anchors`, `check:audit-register` all `ALL CHECKS PASSED`; `npm run build && npm run typecheck && npm run check:build-parity` green with `Build parity: no tracked build output moved when tsc ran.`

---
*Phase: 30-per-checkpoint-autonomy-matrix*
*Completed: 2026-09-05*

---
phase: 30-per-checkpoint-autonomy-matrix
plan: 08
subsystem: infra
tags: [checkpoints, pretooluse-hook, shared-context, notes, banner, safety-floor, typescript]

requires:
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "plan 30-01's matrix-consulting guard, its byte freeze and the AUTO-07 blob-pinned differential"
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "plan 30-04's completed 14-member roster with derived site counts"
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "plan 30-05's four-id SAFETY_FLOORS and the emitVerdict point-of-effect argument"
  - phase: 20-shared-context
    provides: "appendNote, writeNoteFile (the one containment chokepoint) and validate()'s refuse-self set"
provides:
  - "the guard's notify branch: a lowered checkpoint with its key ALLOWS, records one finding and is named in the banner"
  - "the guard's unauthorized-declaration record: a lowering with no key is refused AND writes its own finding"
  - "scripts/context-io.ts emitCheckpointNote — the one sanctioned emitter for the checkpoint trace"
  - "scripts/context-io.ts emitTrusted — the ONE compose/validate/write tail every reserved-identity emitter ends on"
  - "validate()'s carve-out generalized from a boolean to the reserved identity the emission claims"
  - "scripts/checkpoints.ts evaluateMatrix + composeBanner — one evaluation feeding both the banner and the decision"
  - "isCheckpointBannerLine — the recognizer half of an exactly-one-banner count"
  - "the AUTO-07 differential widened to the FULL roster, with two-sided union coverage"
affects: [30-09, 30-10, 30-11, compaction, red-team surface A]

actuals:
  tokens: 24835
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A reserved machine identity per trusted writer, with ONE shared emission tail that validates against the CLAIMED identity — so one emitter's carve-out can never cover another's name"
    - "Record-or-refuse: an allow that depends on a trace write is withdrawn when the write fails"
    - "One evaluation feeding both a human-facing banner and a machine decision, instead of two reads reconciled by a consistency check"
    - "Two-sided coverage tables (exercised here / covered by a NAMED test elsewhere) whose union is asserted equal to a derived roster"
    - "A coverage reference that is resolved against the tree (file exists, test name still present) rather than trusted as prose"

key-files:
  created: []
  modified:
    - hooks/guard.ts
    - hooks/guard.js
    - hooks/guard.test.ts
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - scripts/autonomy-zero-config.test.ts
    - scripts/floor-invariance.test.ts

key-decisions:
  - "D-11's `kind: finding` is honoured by adding a SECOND reserved machine identity, `§checkpoint-guard`, rather than by forging a stamp or downgrading the note to a soft kind. The guard is a separate process the agent under it cannot invoke, pass content to or silence — the same root-of-trust argument the tree already makes for `§14-gate`."
  - "validate()'s second parameter changed from `trustedGateEmission: boolean` to `trustedEmitter: ReservedIdentity | null`. A boolean says somebody trusted is writing; an identity says WHICH one, so the carve-out cannot be borrowed across emitters."
  - "Adding the identity makes validate() STRICTER on every agent-reachable path: appendNote, admitAndAppend, the CLI verb and the compaction oracle now all refuse `by: §checkpoint-guard` as impersonation, where it was previously an ordinary author string. Proven by probe A."
  - "The authorizing human name goes in the note BODY verbatim, never into a `human:<name>` stamp — the stamp grammar admits no spaces, and recording a mangled name is worse than recording none."
  - "The notify allow is CONDITIONAL on the record. An unrecordable lowering is refused, because a lowering that leaves no trace is the invisibility AUTO-05 exists to prevent."
  - "`off` allows and writes nothing. `off` is the disposition a human chose in order to hear nothing; recording it anyway would make the ternary a binary."
  - "composeBanner lives in scripts/checkpoints.ts, not in hooks/guard.ts. guard.ts runs at import (it reads fd 0 and calls process.exit), so a function exported from it can never be driven by a test — and leaving renderCheckpointBanner behind unused would have been a second banner grammar."
  - "The three untrusted body values (command, actor, authorizing name) are JSON.stringify'd into the note body, so a command carrying a `---` fence cannot rewrite the record's own structure."

patterns-established:
  - "Reserved-identity emission: one identity per trusted writer, one shared tail, validated against the claimed name"
  - "Record-or-refuse: the allow is withdrawn if the record fails"
  - "Two-sided roster coverage with mechanically resolved elsewhere-references"

requirements-completed: [AUTO-03, AUTO-05, AUTO-07]

coverage:
  - id: D1
    description: "A floor lowered to `notify` with its key present ALLOWS the action and writes exactly one finding note naming the checkpoint, the authorizing name, the actor and the command (D-11)"
    requirement: "AUTO-05"
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#notify WITH the human grant: allows, and writes EXACTLY ONE finding naming the decision"
        status: pass
      - kind: integration
        ref: "adversarial probe D — 6 spawned disposition cells, notify+key -> deny=false notes=1"
        status: pass
    human_judgment: false
  - id: D2
    description: "An unauthorized lowering (a config declaration with no matching floor key) is refused AND writes its own finding, so an agent editing config alone is ineffective and visible (D-10)"
    requirement: "AUTO-03"
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#D-10 an UNAUTHORIZED lowering: denies, AND writes EXACTLY ONE finding of its own"
        status: pass
      - kind: integration
        ref: "adversarial probe D — notify/key=absent and off/key=absent both deny=true notes=1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every note goes through the sanctioned path; the hook contains no direct write to the notes directory (T-30-33)"
    requirement: "AUTO-05"
    verification:
      - kind: unit
        ref: "hooks/guard.test.ts#the hook contains NO direct write to the notes directory — every note goes through context-io"
        status: pass
      - kind: integration
        ref: "node scripts/check-foundation-guards.js — guard_context_writes PASS, ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D4
    description: "The banner and the decision are produced from ONE evaluation and cannot disagree; exactly one banner per invocation (D-19, T-30-31)"
    requirement: "AUTO-05"
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#guard.js — D-19 exactly one banner, and it agrees with the decision (9 cases)"
        status: pass
      - kind: integration
        ref: "mutation: composeBanner returning the all-default line unconditionally -> 5 failures naming the DECISION signal"
        status: pass
    human_judgment: false
  - id: D5
    description: "A zero-config run differs from the pre-phase artifact by exactly one added line, across the FULL roster (D-20, AUTO-07)"
    requirement: "AUTO-07"
    verification:
      - kind: integration
        ref: "scripts/autonomy-zero-config.test.ts — 7 whole-run line diffs, union-equals-roster in both directions, references resolved"
        status: pass
      - kind: integration
        ref: "mutation: a second banner line in guard.ts -> 16 failures naming two added lines"
        status: pass
    human_judgment: false
  - id: D6
    description: "The guard byte freeze was unfrozen and re-frozen in the SAME commit, twice, and refuses a hash-only or code-only change (D-24)"
    requirement: "AUTO-03"
    verification:
      - kind: unit
        ref: "scripts/floor-invariance.test.ts#invariant 4 — hooks/guard.ts matches its frozen baseline (D-02)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The second reserved identity does not widen any agent-reachable path — it narrows every one of them"
    requirement: "AUTO-05"
    verification:
      - kind: integration
        ref: "adversarial probe A — appendNote refuses `by: §checkpoint-guard` and `by: §14-gate` by name"
        status: pass
    human_judgment: true
    rationale: "The probe proves the agent-reachable REFUSAL. Whether a second root of trust is the right long-term shape for the verified-context invariant is a design judgement a human should sign off on — it is the one decision in this plan that changes what `verified` means."

duration: 27 min
completed: 2026-09-05
status: complete
---

# Phase 30 Plan 08: The Non-Blocking Tier Summary

**A lowered checkpoint now allows, records and announces: `notify` writes one finding through the sanctioned emitter under a second reserved machine identity, an unauthorized declaration writes its own, the banner and the decision come from one evaluation, and the zero-config differential covers all fourteen roster members.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-09-05T19:52:00Z
- **Completed:** 2026-09-05T20:19:00Z
- **Tasks:** 3
- **Files modified:** 10 (plus one planning file)

## Accomplishments

- **The notify branch exists and records.** A matched command at a floor lowered to `notify`, with its `GRUGOPS_FLOOR_<ID>` key present, is allowed AND writes exactly one `kind: finding` note naming the checkpoint, its declared and effective disposition, the authorizing name, the actor and the command. Measured on the committed artifact, not on the resolver.
- **An unauthorized lowering is now visible as well as ineffective (D-10).** A config declaration with no matching key is still denied by name, and now also writes its own finding. An agent that edits `factory.config.json` alone changes nothing and leaves a record saying it tried.
- **The allow is conditional on the record.** If the note cannot be written, the `notify` lowering does not take effect and the command is refused. The unwritable-context branch was exercised on this box (the chmod fixture is probed, and it did not skip).
- **The banner and the decision cannot disagree.** `evaluateMatrix` resolves the whole roster once; `composeBanner` reads that evaluation and the decision loop reads the same map entry. There is no second value to reconcile. `renderCheckpointBanner` survives as a one-line adapter, so there is still exactly one banner grammar.
- **Exactly-one-banner is counted, not probed.** `isCheckpointBannerLine` recognizes both banner forms from the two literals the composer uses; `guard.test.ts` counts the accepted lines per run and refuses zero and two alike, in the shape `install/install.ts` already uses for its per-adapter provenance banner.
- **The AUTO-07 differential covers the whole roster.** Two coverage tables — ids a Bash command string can reach, and ids covered by a NAMED test elsewhere — whose union is asserted equal to `CHECKPOINTS` in both directions, whose intersection is asserted empty, and whose elsewhere-references are resolved against the tree.

## Task Commits

1. **Task 1: the notify branch writes a finding through the sanctioned path** — `49f3c81` (feat)
2. **Task 2: one evaluation produces both the banner and the decision** — `b0a8c92` (refactor)
3. **Task 3: finalize the zero-config differential over the full roster** — `45b6c5f` (test)
4. **Out-of-scope findings recorded** — `59bef76` (docs)

## Files Created/Modified

- `hooks/guard.ts` / `hooks/guard.js` — the notify branch, the unauthorized-declaration record, the actor read off the same payload, one evaluation feeding banner and decision. Byte-frozen twice in this plan.
- `hooks/guard.test.ts` — 62 cases (was 43): the notify/off/zero-config note-delta block, the record-or-refuse case, the no-direct-write assertion over source and artifact, and the exactly-one-banner + agreement block.
- `scripts/context-io.ts` / `.js` — `CHECKPOINT_GUARD_IDENTITY`, `RESERVED_IDENTITIES`, the generalized `validate(text, trustedEmitter)`, `emitTrusted` (the one emission tail), `emitCheckpointNote`, `CHECKPOINT_TRACE_TASK`.
- `scripts/checkpoints.ts` / `.js` — `evaluateMatrix`, `composeBanner`, `BANNER_NON_DEFAULT_PREFIX`, `isCheckpointBannerLine`; `renderCheckpointBanner` reduced to an adapter.
- `scripts/autonomy-zero-config.test.ts` — the roster-wide coverage tables and the widened differential.
- `scripts/floor-invariance.test.ts` — `FROZEN_GUARD_BLOB` re-baselined twice, each with the reason recorded above it.
- `scripts/context-io.test.ts` — one pin updated for the generalized carve-out signature.

## The freeze constants this plan set

| Commit | Task | `FROZEN_GUARD_BLOB` | What moved |
|---|---|---|---|
| `49f3c81` | 1 | `88456e2c0d0f471f6a233478a624c765aed6af02` | the two recording branches + the actor read |
| `b0a8c92` | 2 | `63c659c179ac99728f1286fb42f96f81eb16a9e3` | the second resolve replaced by one evaluation |

Both are the D-24 shape: source, compiled artifact and constant in ONE commit. Each task's verification was run AFTER its commit, because `git diff --quiet hooks/guard.ts` throws until the file is committed (RESEARCH §F-8 / Pitfall 5) — the mid-edit red is the mechanism working.

## Mutations run, and what each produced

Both mutations required by the plan were performed on the real tree, rebuilt, observed, and reverted. The emitted `.js` was grepped after every build, because `noEmitOnError` silently preserves the previous artifact.

| Mutation | Where | Result |
|---|---|---|
| `composeBanner` returns the all-default line unconditionally | `scripts/checkpoints.ts` | **RED — 5 failures**, the first naming the agreement check by its own message: *"the DECISION signal fired — the denial in this run names a lowered checkpoint while the banner from the SAME run claims `all checkpoints at default`"* |
| a second banner line emitted by the guard | `hooks/guard.ts` | **RED — 16 failures**: 7 differential cases reporting `got 2: ["all checkpoints at default","all checkpoints at default"]`, plus the exactly-one-banner count cases |

A first attempt at the composeBanner mutation (`if (evaluation) return …`) failed to compile (`TS2339: Property 'get' does not exist on type 'never'`) and `tsc` therefore emitted nothing — the suite stayed green over an unchanged artifact. That false green was caught by grepping the emitted `.js` for the mutation marker, which is the project's own standing instruction, and the mutation was rewritten into a compilable form. **This is recorded because it is exactly the "assert the verification harness's own premise" failure this project has hit six times in four rounds:** a mutation that never landed proves nothing, and it looks identical to a mutation that landed and was survived.

## RED-first evidence (Task 1)

The pre-change guard was materialized from `git show HEAD:hooks/guard.js` into the same directory (so it imported the same `context-io.js`) and driven with the same payloads:

| Guard | key | notes written | denied |
|---|---|---|---|
| pre-change | present | **0** | no |
| pre-change | absent | **0** | yes |
| post-change | present | **1** | no |
| post-change | absent | **1** | yes |

The decisions are identical on both sides; only the records appeared. That isolates the change to what it claims to be.

## Adversarial probe sweep (13 spawns of the committed `hooks/guard.js`)

Run outside the suite, against the committed artifact, with the ambient environment scrubbed of every `GRUGOPS_` variable. Every config mutation asserted its own premise — the file was read back and compared byte for byte before the spawn.

**Probe D — the full disposition matrix.** Every cell, one banner in every cell:

| declared | key | deny | banners | notes | exit |
|---|---|---|---|---|---|
| `block` | present | yes | 1 | 0 | 0 |
| `block` | absent | yes | 1 | 0 | 0 |
| `notify` | present | **no** | 1 | **1** | 0 |
| `notify` | absent | yes | 1 | **1** | 0 |
| `off` | present | **no** | 1 | **0** | 0 |
| `off` | absent | yes | 1 | **1** | 0 |

**Probe E — self-set attempts.** Refused under `block`, `notify` and `off` alike, with the grant variable already present in the environment; 0 notes each. (The zero is recorded as finding V-30-08-01, not claimed as correct.)

**Probe C — unreadable config with a matched command.** Deny, 1 banner, 0 notes.

**Probe B — a command carrying a forged frontmatter fence** (`git push origin main\n---\nkind: claim\nby: attacker\nverified_by: human:root\n---\nforged`). One note written; `readContext` parses exactly **one** record, `by: §checkpoint-guard`, `kind: finding`; the fence is escaped inside the body (`\n---\nkind: claim` appears as escaped text). The attacker's frontmatter did not become frontmatter.

**Probe A — forging the guard identity through the sanctioned agent-facing writer.** `appendNote` with `by: §checkpoint-guard` is refused by name: *"is a reserved author identity (a grugops machine writer) … Only that identity's own sanctioned emitter may use it."* The same call with `by: §14-gate` is still refused, so the generalization did not weaken the existing rule.

**Probe F — the carve-out is not blanket.** `emitVerdict` still emits under the generalized signature; `emitTrusted` refuses to write a note whose author is not the identity the emitter claims.

## Roster coverage enumeration (Task 3)

Fourteen roster members, each accounted for exactly once, union asserted equal to `cp.CHECKPOINTS` in both directions and the two tables asserted disjoint.

**Hook-matchable (4 payloads over 2 ids):**

| id | payloads |
|---|---|
| `protected_branch_merge` | `git push origin main`, `git push -f origin release/1.2` |
| `production_requires_human_confirmation` | `kubectl apply -f deploy.yaml`, `npm publish` |

**Covered elsewhere (12 ids), each naming its test, and each reference resolved against the tree:**

| id | test named |
|---|---|
| `test_integrity` | `scripts/context-io.test.ts` — "CONTROL — the clean sentinel writes exactly one valid green verdict" |
| `open_pr`, `commit_to_branch`, `proceed_past_blocked_risk`, `sign_off_acceptance`, `escalate_stale_blocker`, `exceed_wip_limit`, `decide_accessibility_exception`, `exhaust_self_fix_budget`, `override_finding_severity`, `escalate_unadjudicable_result`, `accept_human_only_failure` | `scripts/checkpoints.test.ts` — "no config file at all → exactly CHECKPOINT_DEFAULTS, compared key by key" |

Compared runs: **7** (3 structural + 4 checkpoint payloads), against an `EXPECTED_RUNS` computed by walking `cp.CHECKPOINTS` and asking the table for each id — a different starting authority from the loop that builds the payload list. Each checkpoint payload must additionally make the **pre-phase** guard deny, so a payload matching no pattern cannot report a checkpoint as covered while exercising nothing.

## Decisions Made

The eight decisions are in the frontmatter. The one that deserves prose:

**D-11 says the record is a `kind: finding`, and the tree's own validator refuses a finding nobody verified.** Those two facts collide, and the collision is not incidental — "nothing enters the verified context unverified" is this project's core value proposition. Three ways out existed and two were rejected outright: emitting a `§14-gate#<id>` stamp with no verdict behind it is a forged stamp, and interpolating the floor grant into a `human:<name>` stamp both mangles names the grammar's charset rejects and is impossible in the unauthorized branch, where the whole recorded fact is that there is no human.

The way taken is the argument the tree already makes for `§14-gate`, restated for a second writer: the guard is a separate operating-system process that the agent under it cannot invoke, cannot pass content to and cannot silence, so it is a root of the verification chain and its record stamps nothing above it. Concretely, adding the identity makes `validate()` **stricter** on every agent-reachable path — probe A measures that — and the carve-out is reachable only with a claimed identity that must equal the note's own author.

The residual is named rather than claimed away, in the source and here: a process running as the same uid can write a note file directly and spell the identity itself. That is the pre-existing same-uid direct-FS residual, it applies identically to `§14-gate` today, and this identity neither widens nor narrows it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `scripts/context-io.ts` needed a reserved-identity carve-out before a `finding` could be written at all**
- **Found during:** Task 1 (reading "the note kinds and their required provenance fields", which the plan's `read_first` names)
- **Issue:** `validate()` refuses a `kind: finding` whose `verified_by` is absent or matches neither accepted grammar. Neither grammar can be satisfied honestly by the guard, and the unauthorized branch has no human at all. Without a change here, D-10 and D-11 are unimplementable as written.
- **Fix:** a second reserved identity, the generalized `trustedEmitter` parameter, and one shared `emitTrusted` tail. `scripts/context-io.ts` and `.js` are in the plan's `files_modified` and Task 1's `<files>`, so this is the change the plan anticipated; the SHAPE of it is the deviation being recorded.
- **Files modified:** `scripts/context-io.ts`, `scripts/context-io.js`
- **Verification:** probe A (agent-reachable forgery refused by name for both identities), probe F (`emitVerdict` unchanged), the full suite
- **Committed in:** `49f3c81`

**2. [Rule 3 - Blocking] `scripts/context-io.test.ts` carried a pin on the old boolean signature**
- **Found during:** Task 1
- **Issue:** `mod.validate(snap[0][1], true)` no longer typechecks once the parameter names an identity.
- **Fix:** updated to `mod.validate(snap[0][1], "§14-gate")` — the same assertion, stated in the new vocabulary. The file is not in the plan's `files_modified`.
- **Files modified:** `scripts/context-io.test.ts`
- **Verification:** `npx tsc -p tsconfig.tests.json`; the emitVerdict block passes unchanged
- **Committed in:** `49f3c81`

**3. [Rule 3 - Blocking] `composeBanner` was placed in `scripts/checkpoints.ts`, not `hooks/guard.ts`**
- **Found during:** Task 2
- **Issue:** the plan's artifact table calls `composeBanner` a "new exported fn" and Task 2's `<files>` lists only the guard. `hooks/guard.ts` executes at import — it reads file descriptor 0 and calls `process.exit` — so nothing exported from it can ever be driven by a test. Worse, leaving `renderCheckpointBanner` in place while the guard composed its own banner would have created a SECOND banner grammar, which is the drift shape this phase exists downstream of.
- **Fix:** `evaluateMatrix` and `composeBanner` live in `scripts/checkpoints.ts`; `renderCheckpointBanner` becomes a one-line adapter over them, so the module keeps one banner authority and its existing callers and pins are unaffected.
- **Files modified:** `scripts/checkpoints.ts`, `scripts/checkpoints.js` (neither in the plan's `files_modified`)
- **Verification:** `scripts/checkpoints.test.ts` 78 cases unchanged and green; the composeBanner mutation proven red
- **Committed in:** `b0a8c92`

**4. [Rule 2 - Missing Critical] the note body quotes its three untrusted values**
- **Found during:** Task 1
- **Issue:** the command is agent-authored text interpolated into a note body. A command carrying a newline followed by `---` spells a frontmatter fence, the shape that makes one file read as two notes to anything that splits a stream.
- **Fix:** `command`, `actor` and the authorizing name are `JSON.stringify`'d into the body — one line each, newlines escaped, value preserved exactly.
- **Files modified:** `scripts/context-io.ts`
- **Verification:** probe B — the forged-fence command yields one note, one parsed record, `by: §checkpoint-guard`, with the fence escaped
- **Committed in:** `49f3c81`

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 missing-critical).
**Impact on plan:** every deviation is inside the plan's own objective; three are consequences of facts the plan's `read_first` list pointed at, and the fourth is an injection surface the plan did not name. No scope was added.

## Issues Encountered

- **A mutation that did not compile produced a false green.** Described in full under "Mutations run". Caught by grepping the emitted `.js`, per this project's standing instruction. It is the reason the mutation table above reports what the artifact contained, not what the source said.
- **The pre-existing `scripts/frontmatter.test.ts` D-49 failure is unchanged.** Baseline before this plan: 1 failed / 2667 passed. After: 1 failed / **2688** passed / 2 skipped, same file, same assertion, on a Phase 29.1 planning document (V-30-01-01). Not caused by and not touched by this plan.

## Verification Results

All run after the final commit unless noted.

| Gate | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | 57 passed / 1 failed (the pre-existing D-49 control) — 2688 passed, 2 skipped |
| `hooks/guard.test.ts` | 62 passed |
| `scripts/floor-invariance.test.ts` | 128 passed (freeze green after each guard commit) |
| `scripts/autonomy-zero-config.test.ts` | 14 passed |
| `scripts/checkpoints.test.ts` + `scripts/context-io.test.ts` + `scripts/compactor.test.ts` | 424 passed |
| `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED |
| `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` | green; 54 committed `.js` fresh |
| `check:public-docs`, `check:audit-register`, `check:claim-anchors`, `check:banned-claims`, `check:imperative-lexicon`, `check:diff-disposition`, `check:nul-bytes` | PASS (7/7) |
| `check-kit-refs`, `coordinator-resolution-precheck`, `validate-agent-factory` | PASS |
| adversarial probe sweep (13 spawns) | recorded above |

**A green suite is not proof for a safety invariant.** This plan's floor is the red-team surface A that D-21 reserves for a dedicated round; what is recorded here is the author's evidence, and it does not declare the floor closed.

## Known Stubs

None. No placeholder, no hardcoded empty value, and no `<verify>` left unrun.

## Deferred Issues

Three out-of-scope findings from the probe sweep, recorded in `deferred-items.md` (`59bef76`) rather than fixed:

- **V-30-08-01** — a self-set ATTEMPT is refused under every disposition but leaves nothing in the trace. Suggested owner: plan 30-09.
- **V-30-08-02** — one note per matched invocation, with no rate bound. A deduplicating record would omit occurrences, which is the property the record exists to deny. Suggested owner: whichever plan next touches the compactor.
- **V-30-08-03** — a stored reserved-identity note does not pass the plain `validate()`, so neither a checkpoint record nor a `§14-gate` verdict is compactable as things stand. Pre-existing in shape; measured here.

## User Setup Required

None — no external service configuration required. A repository that configures nothing sees exactly one added line of output and no behaviour change.

## Next Phase Readiness

- Plan 30-09 inherits a guard whose notify tier records, and the settings-file vector it narrows is the same vector V-30-08-01 points at.
- The checkpoint trace lands under `<CLAUDE_PROJECT_DIR>/.grugops/context/checkpoint-trace/notes/`. Any plan that renders or compacts the trace should read V-30-08-02 and V-30-08-03 first.
- `composeBanner` is available for D-19's other banner site (the gate run header), which this plan did not touch.

## Self-Check: PASSED

- `hooks/guard.ts`, `hooks/guard.js`, `hooks/guard.test.ts`, `scripts/context-io.ts`, `scripts/context-io.js`, `scripts/checkpoints.ts`, `scripts/checkpoints.js`, `scripts/autonomy-zero-config.test.ts`, `scripts/floor-invariance.test.ts`, `scripts/context-io.test.ts` — all present on disk and modified in this plan's commits.
- `git log --oneline --all | grep` finds `49f3c81`, `b0a8c92`, `45b6c5f`, `59bef76`.
- Every task's `<acceptance_criteria>` re-run after its commit; the plan-level `<verification>` block re-run in full and tabulated above.

---
*Phase: 30-per-checkpoint-autonomy-matrix*
*Completed: 2026-09-05*

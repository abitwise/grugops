---
phase: 31-autonomous-manual-testing
plan: 01
subsystem: testing
tags: [shared-context, provenance, sha, admission, uat-evidence, byte-stability, red-team]

requires:
  - phase: 20-shared-context
    provides: the six-kind note schema, composeNote/validate/appendNote and the single write chokepoint
  - phase: 21-admission
    provides: admit(), the §14-gate stamp cross-check and isLiveGreenVerdict — the branch D-03 is a sibling of
  - phase: 30-checkpoint-autonomy
    provides: emitVerdict's required-positional TestIntegrityResult precedent and the emit-verdict CLI verb
provides:
  - emitVerdict records the commit SHA its gate run was performed at, as a REQUIRED positional argument
  - SHA_HEX_RE — the one anchored lowercase-hex allowlist for sha and content_hash
  - NoteInput/NoteRecord sha / gate_run / content_hash, projected by readContext
  - the D-03 stale-evidence refusal in admit(), in exactly one place, never shelling to git
  - validate()'s required-when-artifact-ref / forbidden-elsewhere rule with the §14-gate sha carve-out
  - the emit-verdict CLI verb at four required positionals plus an optional context root
  - the evidence-provenance section of agent-factory/contracts/context-note.md
affects: [31-03 browser-uat-recipe, 31-04 workflow-05 prose and the chrome lane, 32 board rendering]

actuals:
  tokens: 34405
  tasks: 3
  commits: 8
plan_head_before: 109d5c7a001b56f93f91046e9ed6d3c91ba304cc
# commits MEASURED with `git rev-list --count 109d5c7..HEAD` — 6 production commits plus two docs
# commits (this SUMMARY, then the state/roadmap/requirements close-out that also carries this
# corrected number). The close-out commit was amended rather than followed by a ninth, so
# re-running the same command reproduces 8.
# tokens is chars/4 over `git diff 109d5c7..HEAD` (137619 chars) at the last production commit —
# the estimate's scale, not a harness token count. The plan estimated 88000; the realized diff is
# 2.6x smaller.

tech-stack:
  added: []
  patterns:
    - "Presence-gated fence emission: a new frontmatter scalar is emitted only when set, so every note that sets none composes byte-for-byte its previous form and the byte-stability claim is measurable rather than asserted"
    - "Text-keyed carve-out: an exception scoped by a value in the note's own text (by === the reserved identity) rather than by the caller's trust flag, so untrusted re-readers of a legitimate note do not report a false FAIL on it"
    - "Ambiguity refuses: when a lookup that the message calls THE match returns more than one, refuse rather than resolve the question by replay order"

key-files:
  created:
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - agent-factory/contracts/context-note.md
    - scripts/admission-server.test.ts
    - scripts/compactor.test.ts
    - scripts/floor-invariance.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js

key-decisions:
  - "D-03 confirmed by the developer as option A: the stale-SHA refusal lives in admit() at write time and nowhere else; the §14 gate performs no pre-check"
  - "composeNote emits the provenance scalars per FIELD on presence, not on kind — the plan's two must-have truths (kind-gated emission AND a verdict that records its SHA) cannot both hold literally, and presence gating discharges the byte-stability reason the kind gate was asked for"
  - "validate()'s forbidden-elsewhere rule carves out `sha` on a note whose `by` is the reserved gate identity, keyed on the note's own text so admit(), the plain CLI verb and the compaction oracle can all re-read a real verdict without a false FAIL"
  - "index.md gains a CONDITIONAL `## Evidence provenance` section rather than three new columns, so a task holding no evidence renders byte-identically (CONTEXT delegated render shape to Claude's discretion)"
  - "The new contract-doc section is a level-two heading placed immediately after the kind table, because the lexicon gate's note-kind derivation closes a section only on a heading of level at most two — a `###` subsection's table rows would have been read as note kinds"
  - "emitVerdict THROWS on a malformed SHA rather than returning null: a malformed SHA is a malformed invocation, which is how the function already treats a malformed per-run id, while the integrity result is a policy outcome that degrades"

patterns-established:
  - "Pattern: prove byte stability by reproducing the pre-change formula in the test and comparing against it, rather than asserting the change was conditional"
  - "Pattern: red-team a new safety predicate before calling it done, and record the surviving residuals as assertions rather than prose"

requirements-completed: [UATX-01, UATX-04]

coverage:
  - id: D1
    description: "The §14 gate's green verdict records the commit SHA its run was performed at, supplied as a REQUIRED positional argument ahead of the two defaulted parameters"
    requirement: "UATX-04"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the green verdict note carries `sha:` with the value the gate supplied"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#readContext PROJECTS the recorded sha — without it admit() has nothing to compare"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#an ABSENT or EMPTY sha refuses and writes nothing — the same fail-closed posture"
        status: pass
    human_judgment: false
  - id: D2
    description: "admit() refuses an artifact-ref whose sha is not the SHA the verdict named by its gate_run was performed at, naming BOTH SHAs, in exactly one place, never shelling to git"
    requirement: "UATX-04"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#a STALE sha is refused, the message names BOTH SHAs, and nothing is written"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#a verdict that recorded NO sha REFUSES the evidence — never a fall-through pass (T-31-05)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the comparison exists in EXACTLY ONE place and admit() never shells out to git (D-03)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The reserved-identity economy that keeps a narration or an MCP transcript from becoming a §14-gate stamp is unchanged by the signature change"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#a finding stamped §14-gate#<id> with NO live green verdict is still refused"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the reserved gate identity is still un-authorable by anything but its own emitter"
        status: pass
    human_judgment: false
  - id: D4
    description: "validate() requires the provenance triple on an artifact-ref, refuses it on every other kind but the gate verdict's sha, and holds sha/content_hash to the anchored hex allowlist"
    requirement: "UATX-04"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-01 — validate() adjudicates the evidence-provenance fields (D-01, D-02) — 22 cases"
        status: pass
    human_judgment: false
  - id: D5
    description: "No note of the other five kinds changed a single byte — the fence, the JSONL line and the index.md render are byte-identical for any note carrying no provenance (research assumption A5)"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-01 — the five other kinds compose byte-identically (research assumption A5)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#a task with NO provenanced note renders byte-identically to its pre-change form"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/compactor.test.ts (185 passed)"
        status: pass
    human_judgment: false
  - id: D6
    description: "An ambiguous verdict pair (two live green verdicts sharing one per-run id at different SHAs) refuses in both directions rather than resolving the question by replay order"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#TWO live green verdicts sharing one per-run id at different SHAs REFUSE, both ways"
        status: pass
    human_judgment: false
  - id: D7
    description: "agent-factory/contracts/context-note.md documents the three fields beside the mechanism: the six-kind schema stays closed, content_hash is a recomputable integrity digest and neither a security token nor tamper-proof, and the transitive-import limit is disclosed"
    verification:
      - kind: other
        ref: "npm run check:imperative-lexicon && check:banned-claims && check:public-docs && check:claim-anchors — ALL CHECKS PASSED, noteKinds derived as 6"
        status: pass
    human_judgment: true
    rationale: "The gates prove the prose is in the writing profile and carries no banned claim literal; they cannot judge whether the claim MATCHES the mechanism, which is the property the contract doc exists for. A human should read the Evidence provenance section against admit()'s D-03 branch."

duration: 75 min
completed: 2026-09-07
status: complete
---

# Phase 31 Plan 01: The SHA-bound evidence spine Summary

**`emitVerdict` now records the commit SHA its gate run ran at as a required positional argument, an `artifact-ref` carries `sha` + `gate_run` + `content_hash`, and `admit()` — and only `admit()` — refuses evidence whose SHA is not the one its named gate run was performed at, naming both.**

## Performance

- **Duration:** 75 min
- **Started:** 2026-09-07T13:15:57Z
- **Completed:** 2026-09-07T14:30:48Z
- **Tasks:** 3 (Task 1 was the checkpoint, resolved by the developer before this executor ran)
- **Files modified:** 9 (1 created, 8 modified)

## Accomplishments

- **Closed research finding F-02, which was blocking every other UATX-04 task.** The verdict note carried no git-derived field at all, so D-03's comparison had no left operand. `emitVerdict` now takes the gate-run HEAD SHA as a REQUIRED POSITIONAL fourth argument — ahead of the two defaulted parameters, following the `TestIntegrityResult` precedent that deliberately forces every call site to be revisited — and the verdict records it.
- **The D-03 refusal, in exactly one place.** `admit()` gained a sibling branch beside the existing verdict cross-check with four fail-closed arms: no live green verdict for the named `gate_run`; more than one (ambiguous, added by red-teaming); a verdict that recorded no SHA; and a recorded SHA that differs from the claimed one, named alongside it. It returns findings, never throws, writes nothing, and never shells out to git. `grep -c 'rev-parse' scripts/context-io.ts` is `0`.
- **`SHA_HEX_RE` — one anchored allowlist, asked on both paths.** The composer guards what is about to enter a fence; the validator guards text that arrived from disk; both ask the single exported regex, so no second charset is spelled anywhere.
- **Byte stability PROVEN, not asserted.** The five non-`artifact-ref` kinds are composed and compared against the pre-change fence formula reproduced inside the test file, and a task holding no evidence renders an `index.md` and `index.jsonl` compared to exact expected bytes. `scripts/compactor.test.ts` is green at 185 cases.
- **The contract doc updated in the same breath as the composer**, with `content_hash` described as a recomputable integrity digest and explicitly not a security token and not tamper-proof, and the transitive-import limit disclosed rather than claimed away.
- **Red-teamed before being called done:** 24 probes across three rounds against the new refusal. One real bypass was found and closed; two residuals survived and are recorded as assertions.

## Task Commits

1. **Task 1: Confirm the one-way placement of the stale-SHA refusal (D-03)** — no commit; no file was touched. **Checkpoint resolved: the developer answered option A — `admit()` only — in the orchestrator session transcript.** Per the plan's resume signal, execution continued to Task 2 with the `admit()`-only placement locked and no gate-side pre-check anywhere.
2. **Task 2: End-to-end SHA-bound evidence path (tracer, TDD)** — `5d84633` (test, RED) then `a0ab6e7` (feat, GREEN)
3. **Task 3: Validator rule, render, byte-stability proof, contract doc (TDD)** — `f394762` (test, RED) then `087987f` (feat, GREEN)
4. **Red-team round 1 on the D-03 refusal** — `a7d0cf7` (test, RED) then `c84a5ca` (fix, GREEN)

**Plan metadata:** the `docs(31-01)` commit carrying this SUMMARY.

## Files Created/Modified

- `scripts/context-io.ts` — `SHA_HEX_RE`, `assertHexScalar`, the three optional fields on `NoteInput`/`NoteRecord`, `provenanceBlock`, the `appendNote` guards, the `readContext` projection, `emitVerdict`'s required positional SHA, `admit()`'s D-03 branch, `validate()`'s provenance rule, `toJsonl`'s appended keys, `render`'s conditional provenance section, and the `emit-verdict` CLI arity
- `scripts/context-io.js` — the committed `tsc` output, rebuilt and committed with its source
- `scripts/context-io.test.ts` — 37 new cases across five describe blocks; ~21 existing `emitVerdict` call sites revisited; `admit()`'s byte-freeze re-baselined twice with the reason recorded; the A-8 arity block restated for the new signature
- `agent-factory/contracts/context-note.md` — the new `## Evidence provenance` section, the `artifact-ref` kind-table row, and the pointer under the provenance-fence table
- `scripts/admission-server.test.ts`, `scripts/compactor.test.ts`, `scripts/floor-invariance.test.ts` — the six `emitVerdict` call sites the plan's step 7 did not know about, each given a named fixture SHA
- `hooks/hook-entry.ts` / `.js` — the hook closure manifest, regenerated for the new `scripts/context-io.js` hash
- `.planning/phases/31-autonomous-manual-testing/deferred-items.md` — the one out-of-scope pre-existing failure

## Decisions Made

**The plan's two must-have truths could not both hold literally, and the resolution is the most important thing in this summary.** Truth 6 says the three scalars are emitted by `composeNote` **only** when `kind === "artifact-ref"`. Truth 2 says the green verdict note — which is a `finding` — records the commit SHA the gate ran at. A kind-gated composer drops the verdict's SHA at the fence, which is exactly the F-02 gap this plan exists to close, leaving `admit()`'s comparison with no left operand.

The composer therefore emits **per field, on presence**. That discharges the reason the kind gate was asked for: no note composed before this change set any of the three, so every one of them still composes byte-for-byte its previous form, and that is asserted against the reproduced pre-change formula rather than claimed. What gains bytes is exactly the two shapes that are supposed to carry provenance — the gate's own verdict, and an `artifact-ref`. The rule about which note may carry which field is not decided in the composer; `validate()` decides it once, so a field emitted onto a note that may not carry it is refused loudly at the next line of every write path rather than dropped in silence.

The `sha` carve-out for the verdict is keyed on `by === §14-gate`, a property of the note's own text, not on the `trustedEmitter` argument. Keying it on the trust flag would have made every untrusted re-reader — the plain `validate <file>` verb, `admit()`, the compaction carve-out oracle — report a false FAIL on a legitimately written verdict read back from disk. It opens no path for an agent, because the reserved-identity rule refuses `by: §14-gate` on anything but the gate's own emission (asserted).

`emitVerdict` **throws** on a malformed, multi-line, non-hex, empty or absent SHA rather than returning `null`. A malformed SHA is a malformed invocation, which is how the function already treats a malformed per-run id; the integrity result is a policy outcome whose non-clean values are ordinary and degrade to `UNKNOWN - verify`. Both write nothing.

The new contract-doc section is a **level-two** heading placed immediately after the six-kind table. `check-imperative-lexicon`'s note-kind derivation closes a section only on a heading of level at most two, so a `###` subsection carrying a three-row table would have had its rows read as note kinds and would have broken the pinned Technical Names cardinality. The gate reports `noteKinds 6` after the edit.

## Red-team round 1 (a green suite is not proof here)

24 probes were run in process against the committed `.js`, in three rounds, every one carrying a stale SHA against a verdict emitted at a different one unless marked a control.

**Refused (21):** padded `kind` (`artifact-ref ` / ` artifact-ref`); a zero-width character inside `kind`; `gate_run` omitted entirely, empty, or whitespace-only (all three attempts to skip the branch land on the required-field rule first); `sha` omitted or empty; a `Sha:` capital-key alias; a padded `gate_run`; an abbreviated SHA against a full one; a `gate_run` naming a verdict under another task; a verdict superseded by a later note; uppercase hex in `content_hash`; `by` set to the reserved identity; the provenance triple smuggled onto a `finding` and onto an `observation`; and a 64-character SHA matching nothing. Both controls admitted, so the sweep is not vacuous.

**One real bypass, found and closed (`c84a5ca`).** With two live green verdicts sharing one per-run id at different SHAs, the branch used `find()` and took the earliest, so evidence claiming that SHA was admitted while a later run under the same id had run at another commit. The refusal's own message says *the* live green verdict, and with two of them there is no such thing. The branch now filters and refuses an ambiguous pair in both directions before it ever reaches the comparison. The fix is one more arm of the one authority; no second implementation was added, and `admit()`'s byte-freeze was re-baselined for it.

**Two residuals, recorded as assertions and in `.planning/WINDOWS.md`:**

1. `appendNote` writes without asking `admit()`, so a caller that bypasses the admission authority persists a stale-SHA `artifact-ref`. That is `admit()`'s tier by D-03's own design — `appendNote` is the writer, `admit()` / `admitAndAppend()` is the admission authority — and adding a second check inside `appendNote` would be the two-authorities drift D-03 forbids. `admitAndAppend`, the structured MCP channel, was measured and **does** reach the refusal.
2. `composeThreadNote` in `scripts/compactor.ts` does not mirror the provenance lines, so an `artifact-ref` written to the thread tier composes without them. Fail-closed (`validate` refuses such a note on promotion), and `compactor.ts` is outside this plan's `files_modified`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's kind-gated composer would have dropped the verdict's own SHA**
- **Found during:** Task 2 (step 4, `composeNote`)
- **Issue:** Must-have truths 2 and 6 are mutually unsatisfiable as literally written. Gating emission on `kind === "artifact-ref"` means the verdict — a `finding` — never writes the `sha` it was just handed, so `admit()`'s comparison has no left operand and F-02 stays open.
- **Fix:** Emit per field, on presence. The byte-stability reason behind truth 6 is preserved and now measured against the reproduced pre-change formula; truth 2 is satisfied.
- **Files modified:** `scripts/context-io.ts`
- **Verification:** the five-kind fence cases, the plain-render byte comparison, `scripts/compactor.test.ts` (185 pass), `npm run freshness:context`
- **Committed in:** `a0ab6e7`

**2. [Rule 3 - Blocking] Six `emitVerdict` call sites outside the plan's `files_modified`**
- **Found during:** Task 2 (step 7)
- **Issue:** The plan named `scripts/context-io.test.ts` only. The full-suite run surfaced 34 failures from `scripts/admission-server.test.ts` (4 sites), `scripts/compactor.test.ts` (1) and `scripts/floor-invariance.test.ts` (1) — which is precisely what the required positional exists to surface.
- **Fix:** Each file gained a named `GATE_RUN_SHA` fixture constant and its call sites were revisited.
- **Files modified:** `scripts/admission-server.test.ts`, `scripts/compactor.test.ts`, `scripts/floor-invariance.test.ts`
- **Verification:** all three files green
- **Committed in:** `a0ab6e7`

**3. [Rule 3 - Blocking] The hook closure manifest embeds `scripts/context-io.js`'s hash**
- **Found during:** Task 2, and again in Task 3 and the red-team fix
- **Issue:** `hooks/hook-entry.ts` carries a per-decider hash manifest of every module in the closure. A changed `context-io.js` makes it stale, the wrapper fail-closes, and `floor-invariance` plus two `hooks/guard.test.ts` cases go red.
- **Fix:** `npm run generate:hook-manifest` after each `context-io.ts` change, committed with it.
- **Files modified:** `hooks/hook-entry.ts`, `hooks/hook-entry.js`
- **Verification:** `scripts/floor-invariance.test.ts` and `hooks/guard.test.ts` green
- **Committed in:** `a0ab6e7`, `087987f`, `c84a5ca`

**4. [Rule 3 - Blocking] `admit()`'s mechanical byte-freeze and the A-8 arity block**
- **Found during:** Task 2
- **Issue:** `admit()` is byte-frozen against a pinned sha256 of its function span, and the 30-11 A-8 arity cases assert a three-positional CLI shape. D-03 changes the span by design and the SHA changes the arity by design.
- **Fix:** The freeze was deliberately unfrozen and re-baselined twice (once for D-03, once for the red-team ambiguity arm), each with its cause recorded in the comment beside the pin, following the 25-13 / 30-03 precedent — re-pinned, never deleted or weakened. The A-8 block was restated: the collision it recorded is now decidable by count, and the surviving residual (a shifted FOUR-argument invocation) is asserted to fail closed and to name the field whose slot was misread.
- **Files modified:** `scripts/context-io.test.ts`
- **Verification:** the freeze case is green at the new baseline; the arity block is green
- **Committed in:** `a0ab6e7`, `c84a5ca`

**5. [Rule 2 - Missing Critical] An ambiguous verdict pair resolved by replay order**
- **Found during:** red-team round 1 (after Task 3)
- **Issue:** Measured bypass — two live green verdicts sharing one per-run id at different SHAs let `find()` pick the earliest, so evidence claiming that SHA admitted.
- **Fix:** The branch filters and refuses an ambiguous pair in both directions.
- **Files modified:** `scripts/context-io.ts`
- **Verification:** the both-directions case plus a single-verdict control that still admits
- **Committed in:** `c84a5ca`

---

**Total deviations:** 5 auto-fixed (1 bug, 3 blocking, 1 missing critical)
**Impact on plan:** Deviation 1 is a genuine contradiction inside the plan's own must-haves and is the one a reviewer should read first. The rest are the required positional and the byte-freeze doing exactly what they were built to do. No scope creep: `agent-factory/workflows/05-pr-quality-gate.md` still documents the three-argument `emit-verdict` shape and was deliberately **left untouched**, because the plan and RESEARCH open question 4 assign that prose edit to plan `31-04` task 1 step 4.

## Issues Encountered

- **`scripts/freshness.test.ts` "Test 1 (control, real tree)" fails on a 5s timeout.** Proven pre-existing rather than assumed: a detached worktree at the plan base commit `109d5c7` was created, `node scripts/freshness.js` took **5.409s** there (already over the 5000ms default), and `npx vitest run scripts/freshness.test.ts` failed the same case at that commit with none of this plan's changes present. The worktree was removed. Logged to `deferred-items.md` and `.planning/WINDOWS.md`; not fixed, per the scope boundary.
- **`npm run freshness:context` passes VACUOUSLY.** No `.grugops/context/` tree is committed, so the acceptance criterion "exits 0 with no task listed as stale" is satisfied over an empty denominator. Stated rather than counted as evidence; the non-vacuous byte-stability proof is the composed-fence and render cases. Recorded in `.planning/WINDOWS.md`.
- **`gsd_run check tdd-red-evidence` — `UNKNOWN - verify`.** The tool parses `node --test` TAP lines and cannot classify Vitest output, as plan 31-02 also recorded. No TAP was synthesized. The RED gate was satisfied manually from the real Vitest output: 12 failing cases for Task 2 (235 passing), 22 for Task 3 (261 passing), 1 for the red-team round (286 passing), each failing on an assertion or a named refusal for the planned behavior, and each verified to write nothing into the working tree.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced.

## Threat Flags

None. Every file touched is inside the plan's declared threat model; no new network endpoint, auth path, file-access pattern or schema at a trust boundary was added, and `package.json` gained no dependency.

## Verification Results

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts` | 287 passed |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/compactor.test.ts` | 185 passed |
| Full suite (e2e excluded) | 3235 passed, 2 skipped, 1 pre-existing timeout flake |
| `npm run build && npm run typecheck && npm run check:build-parity` | green |
| `npm run freshness` | 60 committed `.js` fresh |
| `npm run freshness:context` | exit 0 (vacuous — nothing committed to drift) |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `check:imperative-lexicon` / `check:banned-claims` / `check:public-docs` / `check:claim-anchors` | `ALL CHECKS PASSED`; `noteKinds 6` |

Task 2's acceptance criteria were re-run individually and all pass: the required `sha: string` sits after `integrity` and before `contextRoot`; `grep -c 'SHA_HEX_RE'` is 4; the arity line appears exactly once; `readContext`'s `records.push` carries all three keys; `grep -c 'verdictSha !== evidenceSha'` is 1 and `grep -c 'rev-parse'` is 0. Task 3's likewise: `grep -c 'content_hash'` on the contract doc is 5, the transitive-import limit is stated at line 179, and the kind table still derives exactly six kinds.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for `31-04`.** Its task 1 step 4 owns the `agent-factory/workflows/05-pr-quality-gate.md` prose edit that brings the documented `emit-verdict` shape into line with the four-positional signature shipped here. **Until that lands, the workflow prose at line 47 documents a three-argument invocation the CLI now refuses on arity** — a known, deliberate, plan-assigned mismatch, not a defect introduced here. It is the one thing a reader of this plan must not mistake for done.
- **Ready for `31-03` and `31-02`'s consumers.** The `artifact-ref` provenance shape and the refusal that binds it are in place, so the browser-UAT recipe and the spec-integrity runnable have a stable evidence contract to point at.
- **Concern to carry forward:** the two residuals above (the `appendNote` write path, and `composeThreadNote`'s missing mirror). Neither is a silent pass — both fail closed — but both are places where a later widening of the evidence path would need a decision rather than a patch.

## Self-Check: PASSED

Every file named under `key-files` exists on disk (`[ -f ]`), and all seven commits resolve in
`git log --oneline --all`: `5d84633`, `a0ab6e7`, `f394762`, `087987f`, `a7d0cf7`, `c84a5ca`,
`a8f4c69`.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-07*

---
phase: 27-spawn-correctness-kit-set-authority
plan: 04
subsystem: testing
tags: [typescript, vitest, kit-model, validator, build-gate, derived-sets, set-literal-drift]

# Dependency graph
requires:
  - phase: 27-01
    provides: "scripts/kit-model.ts — the derived kit-set authority (listRoles/listWorkflows, explicit kit-root parameter per D-22, fail-closed throw on unreadable or empty directory)"
  - phase: 27-03
    provides: "the guard-side set derivations, plus two reusable lessons: restore the fail-red branch a derivation deletes, and fix real content a widened scan surfaces rather than narrowing the predicate"
provides:
  - "scripts/validate-agent-factory.ts derives its role and workflow name lists through kit-model — all 17 roles and all 19 workflows are validated, replacing a frozen 16/14 pair"
  - "Extension stripped at the validator's own call site, so kit-model's shared `.md`-bearing return shape is unchanged for every other consumer"
  - "deriveKitNames() — the vacuity/missing-directory floor that converts kit-model's throw into an ordinary `missing required <kind> directory` finding"
  - "scripts/check-kit-refs.ts SCAN reaches the adapter DIRECTORY, so every adapter 27-07 generates is scanned with no edit"
  - "Derived MARKER_SITES — two named documents plus every adapter under .claude/agents and .claude/skills (10 today, 26 after 27-07)"
  - "Assertion 3 restated as a two-sided derived predicate keyed on the resolver slot, closing the hand-written-adapter hole"
  - "Ten per-consumer derivation assertions (3 in validate.test.ts, 7 in check-kit-refs.test.ts) that go red if any derivation is reverted"
  - "Four previously-unvalidated workflow section gaps fixed in the kit content (workflows 14, 15, 16, 17, 18)"
affects: [27-07, 27-08, 27-09, adapter-generation, kit-set-authority]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Extension-strip-at-the-call-site: a shared derivation authority pins ONE return shape; a consumer wanting a different shape adapts locally rather than mutating the shared contract"
    - "Throw-to-finding adapter: a fail-closed library that throws is wrapped by a never-throw consumer, so the library's vacuity refusal becomes that consumer's ordinary finding"
    - "Two-sided derived predicate: replace an exclusion-by-omission list with a legal set derived from a marker in the file's own body, then assert set equality in BOTH directions"
    - "Report-what-was-compared: every assertion prints the number of sites/files it walked, so a run over a shrunken or empty derived set is visible instead of reading as a bare pass"

key-files:
  created: []
  modified:
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/validate.test.ts
    - scripts/check-kit-refs.ts
    - scripts/check-kit-refs.js
    - scripts/check-kit-refs.test.ts
    - agent-factory/workflows/14-ui-design-to-build.md
    - agent-factory/workflows/15-security-audit.md
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/18-context-compaction.md

key-decisions:
  - "Strip the .md extension at the validator's call site rather than changing kit-model's pinned return shape — the shared authority serves the majority of consumers, and a local shape mismatch is a local problem"
  - "Do NOT assert exact role/workflow cardinality inside the validator: it must run against arbitrary kit roots including the small fixtures, so the two-sided count check stays in guard_kit_counts and the deletion signal in the KIT-03 oracle"
  - "Convert kit-model's throw into a `missing required <kind> directory` finding so the validator keeps its never-throw fail-closed posture AND the existing SPLIT bad-missing-kit test keeps its meaning"
  - "Keep the (now near-dead) per-name existence loops in checkRequiredFiles rather than deleting them, with a comment naming where the real fail-red signal moved"
  - "Add a vacuity floor to check-kit-refs (empty derived adapter set fails red) beyond what the plan asked — the 27-03 lesson says a derivation that deletes a fail-red branch must restore it explicitly"
  - "Exclude the root skills/ plugin mirror from the adapter dirs (it carries no resolver block) while leaving it inside SCAN, where it can only ever appear on the illegal side of Assertion 3"
  - "Repeat the resolver-slot literal in check-kit-refs rather than importing it from install/install.ts (the installer is self-contained by D-18) — a drift is safe because the derived legal set would shrink and Assertion 3 would fail red naming the files"

patterns-established:
  - "Old-gate-vs-new-gate adversarial reproduction: every closed hole is proven by running the SAME planted defect against the pre-change committed .js (passes) and the post-change one (fails red naming the file)"
  - "Revert probe: restore the pre-change compiled gate in place, confirm every new test case goes red, restore and byte-compare — the D-19 assertion is only credible if the revert actually breaks it"

requirements-completed: [KIT-02]

coverage:
  - id: D1
    description: "The validator derives all 17 role names and all 19 workflow names through kit-model, extension-stripped at its own call site, with no frozen list left"
    requirement: "KIT-02"
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#DERIVED roles+workflows: an 18th role and a 20th workflow are SEEN (frozen lists could not)"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#DERIVED shape: names are extension-stripped at the call site — no path carries a doubled .md"
        status: pass
      - kind: integration
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The validator's vacuity/missing-directory floor: an unreadable or empty kit set degrades to a `missing required` finding, never an unhandled kit-model throw"
    requirement: "KIT-02"
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#DERIVED vacuity floor: an unreadable kit role/workflow dir → 'missing required' finding, not a throw"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#SPLIT bad-missing-kit (VALIDATE_KIT_ROOT→nonexistent) → nonzero + 'missing required'"
        status: pass
    human_judgment: false
  - id: D3
    description: "check-kit-refs SCAN reaches every adapter through the .claude/agents directory rather than one hand-named adapter file"
    requirement: "KIT-02"
    verification:
      - kind: unit
        ref: "scripts/check-kit-refs.test.ts#SCAN reach: a deleted-templates ref in a NON-orchestrator adapter fails Assertion 2 naming it"
        status: pass
    human_judgment: false
  - id: D4
    description: "MARKER_SITES is derived from the adapter directories, so the compressed kit-vs-state invariant is asserted present at every adapter (10 sites today, 26 after 27-07)"
    requirement: "KIT-02"
    verification:
      - kind: unit
        ref: "scripts/check-kit-refs.test.ts#marker sites RED: a planted adapter without the invariant blockquote fails red naming it"
        status: pass
      - kind: unit
        ref: "scripts/check-kit-refs.test.ts#marker sites GREEN: a planted adapter WITH the blockquote passes and the reported count rises by one"
        status: pass
      - kind: unit
        ref: "scripts/check-kit-refs.test.ts#marker sites vacuity floor: an empty adapter directory fails red rather than passing over nothing"
        status: pass
    human_judgment: false
  - id: D5
    description: "Assertion 3 is a two-sided derived predicate keyed on the resolver slot — a hand-written adapter naming the kit-root env var without a resolver slot now fails red, and so does a resolver that lost its self-heal line"
    requirement: "KIT-02"
    verification:
      - kind: unit
        ref: "scripts/check-kit-refs.test.ts#Assertion 3 RED: a hand-written adapter naming the kit-root env var without a resolver slot fails red"
        status: pass
      - kind: unit
        ref: "scripts/check-kit-refs.test.ts#Assertion 3 GREEN: a resolver-slot adapter naming the env var passes — the legal set is derived, not fixed"
        status: pass
      - kind: unit
        ref: "scripts/check-kit-refs.test.ts#Assertion 3 two-sided: a resolver-slot adapter that LOST its self-heal line fails red too"
        status: pass
      - kind: integration
        ref: "node scripts/check-kit-refs.js (exit 0; reports 10 marker sites and 3 derived legal sites)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Four section gaps in the five previously-unvalidated workflows are fixed in the kit content (## Stop conditions on 14/15; ## Agents involved, ## Inputs required, ## Board moves, ## Trace updates on the three seam workflows 16/17/18)"
    verification:
      - kind: integration
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js — 14 findings before the content fix, exit 0 after"
        status: pass
    human_judgment: true
    rationale: "The sections are now structurally present and the validator is green, but whether the prose is CORRECT for these three seam workflows (that they genuinely have no board move and no trace row of their own) is an editorial judgment about the kit's semantics that no structural check can make."

# Metrics
duration: 14min
completed: 2026-07-28
status: complete
---

# Phase 27 Plan 04: Validator and Kit-Reference Checker Set Derivation Summary

**The validator's two frozen name lists and the kit-reference checker's three enumerating literals now follow the filesystem — and unfreezing them immediately surfaced 14 real section gaps in five workflows that had never been validated, plus three adapter-level holes that the old gate passed silently.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-28T20:03:00Z
- **Completed:** 2026-07-28T20:17:00Z
- **Tasks:** 3 completed
- **Files modified:** 11

## Accomplishments

- **The plainest instance of the milestone's founding defect is deleted.** `scripts/validate-agent-factory.ts` froze a 14-name workflow array and a 16-name role array copied from the Phase-4 shell harness. Both had rotted: the kit holds 19 workflows and 17 roles, so five workflows and one role were never validated and nothing reported it. Membership now derives through `kit-model` with the kit root passed explicitly (D-22) — no fourth root convention.
- **The extension hazard was handled where the plan said to handle it.** `kit-model` returns filenames with `.md`; these two lists are bare stems because all five consumer sites append the extension themselves. The strip happens once at this call site, never by mutating the shared return shape. A grep of the compiled output for a doubled extension returns `0`, and a test asserts no printed path carries one.
- **The widened scan found real drift, and the content was fixed rather than the check narrowed.** Deriving the workflow list produced 14 genuine findings across workflows 14, 15, 16, 17 and 18 — files no frozen array had ever pointed the section check at. All five were repaired in the kit content.
- **`check-kit-refs` SCAN reaches the adapter directory.** One hand-named adapter file became `.claude/agents`; `walk()` already recursed directories, so the entry is self-deriving with no import. Every other SCAN entry is untouched — the exclusion-by-not-listing design (seed, examples, installer, docs, planning tree) is load-bearing and survives.
- **`MARKER_SITES` — the literal the original inventory missed (D-27) — is derived.** Two named single documents plus every `.md` under `.claude/agents` and every `SKILL.md` under `.claude/skills`. Ten sites today; twenty-six after plan 27-07, with no edit here. A four-entry hand list would have gone stale by fifteen the moment those adapters landed.
- **Assertion 3 is now strictly stronger than the exclusion it replaces.** The negative half (kit prose free of the kit-root variable) is preserved verbatim. The new positive half derives the legal set from the resolver slot in each file's own body and asserts set equality in both directions. A hand-written adapter carrying the variable without a resolver slot used to pass by not being on a list of three named paths; it now fails red. So does a resolver that lost its self-heal line — a fault nothing previously looked for.
- **Every closed hole carries an old-gate-vs-new-gate reproduction.** Each of the three planted defects was run against the pre-change committed `.js` (exit 0 — the hole was real) and the post-change one (exit 1, naming the file). The project's terminal lesson is that a green suite is not proof for a safety guard; these are the adversarial reproductions, now running in CI.

## Task Commits

1. **Task 1: validate-agent-factory.ts derives its role and workflow lists** — `6c02c33` (refactor)
2. **Task 2: check-kit-refs.ts — reach the adapter directory, derive MARKER_SITES, restate Assertion 3** — `78fc057` (refactor)
3. **Task 3: per-consumer assertions for the kit-reference checker** — `d01b326` (test)

## Files Created/Modified

- `scripts/validate-agent-factory.ts` / `.js` — frozen `WORKFLOWS`/`ROLES` arrays replaced by `deriveKitNames(listWorkflows|listRoles, …)`; `stripMd` applied once at the call site; throw-to-finding vacuity floor; three stale comments corrected (the "14 workflows" and "16 role filenames" counts, and the file header's "frozen name list" claim).
- `scripts/validate.test.ts` — three D-19 assertions: an 18th role and a 20th workflow planted into a real-kit copy are named in the output; no printed path carries a doubled extension; an unreadable kit directory degrades to a finding with no stack trace escaping.
- `scripts/check-kit-refs.ts` / `.js` — `SCAN` reaches `.claude/agents`; `ADAPTER_FILES` derived from the two adapter directories; `MARKER_SITES` = two named documents + derived adapters; Assertion 3 restated as a two-sided derived predicate keyed on `RESOLVER_SLOT`; explicit vacuity floor on an empty adapter set; every assertion now reports the number of sites/files it compared.
- `scripts/check-kit-refs.test.ts` — seven per-consumer assertions (three marker-site, three Assertion-3, one SCAN-reach); the harness `SCAN` mirror updated to the directory entry.
- `agent-factory/workflows/14-ui-design-to-build.md`, `15-security-audit.md` — added `## Stop conditions`.
- `agent-factory/workflows/16-context-read-write.md`, `17-task-claim.md`, `18-context-compaction.md` — added `## Agents involved`, `## Inputs required`, `## Board moves`, `## Trace updates`.

## Decisions Made

- **Extension stripped at the call site, not in `kit-model`.** The shared authority's `.md`-bearing return shape serves the majority of consumers and the guards that build repo-relative paths from it. A consumer wanting bare stems adapts locally.
- **No cardinality assertion inside the validator.** It must run against arbitrary kit roots, including `scripts/fixtures/good` (16 roles, 14 workflows). Exact two-sided counts stay in `guard_kit_counts`; the deletion signal stays in the KIT-03 referential-integrity oracle. The validator gets only the non-empty floor, which is all it can honestly assert.
- **Kit-model's throw becomes a finding, not an escape.** `deriveKitNames` catches and emits `missing required <kind> directory: …`, preserving both the file's never-throw fail-closed posture and the meaning of the existing `SPLIT bad-missing-kit` test.
- **Near-dead existence loops kept, not deleted.** With a derived set, `checkRequiredFiles`'s per-name loops can effectively no longer fail. They are retained with a comment naming exactly where the fail-red signal moved, rather than silently disappearing.
- **The root `skills/` plugin mirror is not an adapter directory.** It carries no resolver block and its `SKILL.md` files are the plugin packaging of the same skills. It stays inside `SCAN`, where — carrying no resolver slot — it could only ever appear on the illegal side of Assertion 3.
- **The resolver-slot literal is repeated, not imported.** The installer is deliberately self-contained (D-18). The repetition is safe because a drift is loud, not silent: the derived legal set would shrink and Assertion 3 would fail red naming the files it no longer covers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fourteen missing required sections in the five previously-unvalidated workflows**

- **Found during:** Task 1 (validate-agent-factory.ts derives its role and workflow lists)
- **Issue:** Unfreezing the workflow list pointed the section check at `14-ui-design-to-build.md`, `15-security-audit.md`, `16-context-read-write.md`, `17-task-claim.md` and `18-context-compaction.md` for the first time. Workflows 14 and 15 carried no `## Stop` section; the three seam workflows (16, 17, 18) carried no `## Agents`, `## Inputs`, `## Board moves` or `## Trace updates`. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` reported 14 errors and exited 1, blocking the plan's own verification. These are genuine pre-existing gaps — exactly the drift KIT-02 exists to expose — and 27-03 set the precedent that a widened scan's true findings are fixed in the content, never absorbed by narrowing the predicate.
- **Fix:** Added `## Stop conditions` to workflows 14 and 15, and `## Agents involved`, `## Inputs required`, `## Board moves` and `## Trace updates` to workflows 16, 17 and 18. The three seam workflows honestly record that they cause no board transition and append no traceability row of their own — the invoking workflow owns both — which is a substantive statement about the queue/board and note/trace seams, not filler.
- **Files modified:** `agent-factory/workflows/14-ui-design-to-build.md`, `15-security-audit.md`, `16-context-read-write.md`, `17-task-claim.md`, `18-context-compaction.md`
- **Verification:** `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` → `ALL CHECKS PASSED`, exit 0. `node scripts/check-kit-refs.js` exit 0 (no retired vocabulary introduced). `guard_context_writes` still PASS (no raw context-write token introduced). Foundation guards still show exactly one FAIL.
- **Committed in:** `6c02c33` (part of the Task 1 commit)

**2. [Rule 2 - Missing critical functionality] No vacuity floor on the derived adapter set in check-kit-refs**

- **Found during:** Task 2 (check-kit-refs.ts literals)
- **Issue:** Deriving `MARKER_SITES` and the Assertion-3 legal set from the adapter directories silently deletes a fail-red branch — with an empty or absent `.claude/agents` and `.claude/skills`, the marker check would iterate two named sites and the legal set would hold only the packaging template, and both would report PASS over essentially nothing. This is the precise failure mode 27-03 documented. The plan asked for the count to be reported; reporting alone leaves the anomaly readable but not enforced.
- **Fix:** Added an explicit `[derivation]` block that fails red with `no adapter files found under …` when the derived adapter set is empty, alongside the required count reporting on every assertion's pass line. Exact adapter cardinality is deliberately left to `guard_referential_integrity` (KIT-03), which is the only check that can compare against the role corpus; this gate refuses only the vacuous case, which is all it can honestly assert against an arbitrary `CHECK_ROOT` mirror.
- **Files modified:** `scripts/check-kit-refs.ts`, `scripts/check-kit-refs.js`
- **Verification:** `scripts/check-kit-refs.test.ts#marker sites vacuity floor: an empty adapter directory fails red rather than passing over nothing` — passes against the new gate, fails against the pre-change one.
- **Committed in:** `78fc057` (Task 2) and `d01b326` (its test)

---

**Total deviations:** 2 auto-fixed (1 × Rule 3 blocking, 1 × Rule 2 missing critical functionality)
**Impact on plan:** Both were required. The Rule 3 fix was the plan's own verification blocking on true findings the plan predicted might appear, handled the way the prior wave established. The Rule 2 addition is strictly stronger than what was asked and matches the phase's own discipline. No scope creep: no file outside this plan's ownership was touched except the five workflow documents the widened scan indicted, and no other plan in this phase owns them.

## Issues Encountered

- **A comment defeated its own acceptance grep.** The Task 1 acceptance criterion greps the compiled output for a doubled `.md` extension. A comment explaining the hazard spelled the doubled form out literally, producing a hit of `1` on a file that was actually correct. Reworded to describe the form without writing it — and recorded in the comment itself that the literal is deliberately not written there, so the next author does not reintroduce it. Same class of problem for `grep -c 'three legal'`, which matched a comment describing the old claim in passing; rephrased.
- **`grep -c` on a git-restored file needs a byte-compare afterwards.** The revert probe restores the pre-change compiled gate in place to prove the new test cases go red. Restoring with `git checkout --` was followed by `cmp` against a saved copy of the current build, confirming the working tree returned byte-identical.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 27-07 (adapter generation) is unblocked and inherits the coverage for free.** When it lands the other sixteen adapters, `MARKER_SITES` grows from 10 to 26, Assertion 3's derived legal set grows from 3 to 18, and the SCAN walk reaches every one — with no edit to `scripts/check-kit-refs.ts`. Each generated adapter must carry both the invariant blockquote and the resolver slot; if it carries the kit-root variable without the slot, or the slot without the variable, Assertion 3 fails red naming it.
- **Plan 27-08 edits `scripts/check-kit-refs.ts` next.** Its `dead-vocabulary` consumer should read `SCAN` and `ADAPTER_FILES` as they now stand; the derived `ADAPTER_FILES` constant is available for the new adapter-body guard rather than a second hand-listed set.
- **Known expected red:** `node scripts/check-foundation-guards.js` still exits non-zero with exactly one FAIL — `guard_referential_integrity` (17 roles, 1 adapter), left deliberately red by plan 27-01 and closed by 27-07. This was verified unchanged after every task.
- **Test-suite baseline for the next plan:** 830 passed, 1 skipped (was 820/1 after 27-03; +3 validator, +7 kit-ref).
- **One editorial item for review:** the prose added to the three seam workflows (16, 17, 18) asserts they cause no board transition and append no traceability row of their own. That is a semantic claim about the kit, structurally green but worth a human read — it is flagged `human_judgment: true` as deliverable D6.

---
*Phase: 27-spawn-correctness-kit-set-authority*
*Completed: 2026-07-28*

## Self-Check: PASSED

All 10 modified/created files verified present on disk; all 3 task commit hashes (`6c02c33`, `78fc057`, `d01b326`) verified present in git history.

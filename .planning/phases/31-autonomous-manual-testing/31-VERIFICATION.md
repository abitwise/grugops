---
phase: 31-autonomous-manual-testing
verified: 2026-09-08T19:05:00Z
status: gaps_found
score: 5/6 must-haves verified
covered_files:
  - ".planning/REQUIREMENTS.md"
  - ".planning/WINDOWS.md"
  - ".planning/phases/31-autonomous-manual-testing/31-01-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-01-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-02-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-02-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-03-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-03-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-04-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-04-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-05-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-05-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-06-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-06-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-07-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-07-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-08-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-08-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-09-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-09-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-10-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-10-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-11-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-11-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-12-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-12-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-CONTEXT.md"
  - ".planning/phases/31-autonomous-manual-testing/31-REVIEW.md"
  - ".planning/phases/31-autonomous-manual-testing/31-VALIDATION.md"
  - ".planning/phases/31-autonomous-manual-testing/deferred-items.md"
  - "agent-factory/checklists/00-index.md"
  - "agent-factory/checklists/browser-uat-recipe.md"
  - "agent-factory/contracts/context-note.md"
  - "agent-factory/workflows/05-pr-quality-gate.md"
  - "agent-factory/workflows/06-uat-pack.md"
  - "agent-factory/workflows/16-context-read-write.md"
  - "agent-factory/workflows/17-task-claim.md"
  - "agent-factory/workflows/18-context-compaction.md"
  - "docs/audit/29-style-dispositions/31-09.md"
  - "hooks/hook-entry.js"
  - "hooks/hook-entry.ts"
  - "install/README.md"
  - "install/install.js"
  - "install/install.ts"
  - "install/uninstall.js"
  - "install/uninstall.ts"
  - "package.json"
  - "scripts/check-banned-claims.js"
  - "scripts/check-banned-claims.test.ts"
  - "scripts/check-banned-claims.ts"
  - "scripts/check-foundation-guards.js"
  - "scripts/check-foundation-guards.test.ts"
  - "scripts/check-foundation-guards.ts"
  - "scripts/check-uat-oracles.js"
  - "scripts/check-uat-oracles.ts"
  - "scripts/chrome-lane-bar.test.ts"
  - "scripts/compactor.js"
  - "scripts/compactor.test.ts"
  - "scripts/compactor.ts"
  - "scripts/context-io-writer-set.test.ts"
  - "scripts/context-io.js"
  - "scripts/context-io.test.ts"
  - "scripts/context-io.ts"
  - "scripts/runnable-ref/fixtures/caught-assertion.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/clean.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/conditional-assertion.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/element-access-modifier.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/modifier-call.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/modifier-family.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/modifier-group-clean.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/playwright-test.d.ts"
  - "scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts"
  - "scripts/runnable-ref/uat-spec-integrity.js"
  - "scripts/runnable-ref/uat-spec-integrity.test.ts"
  - "scripts/runnable-ref/uat-spec-integrity.ts"
  - "tsconfig.fixtures.json"
  - "tsconfig.tests.json"
covered_digest: "v1:sha256:af7579704fe0f7b2128dd764c6039daf3e61871ab6e76d842b7c12804f1b682e"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/6
  gaps_closed:
    - "gap 1 (31-VERIFICATION.md round 2 / CR-05): appendNote reached admit() for kind === \"artifact-ref\" only; a finding stamped a fabricated §14-gate#<id> wrote unrefused and rendered into index.md as verified evidence — closed by 31-09 (the kind axis is deleted, appendNote consults admit() unconditionally), independently re-reproduced in this round against the committed scripts/context-io.js: appendNote THREW the authority's own refusal text and wrote 0 files for the identical fabricated finding the prior round's verifier wrote successfully."
    - "gap 2 (31-VERIFICATION.md round 2 / CR-06): BANNED_CONSTRUCTS was a nine-member literal; test.describe.serial.only and test.describe.parallel.only walked past it at exit 0 — closed by 31-11 (membership decided by a head/tail rule, isBannedModifierPath, with BANNED_CONSTRUCTS deleted), independently re-reproduced in this round against the committed scripts/runnable-ref/uat-spec-integrity.js: both spellings now report one finding each and exit 1, on the same probe repo/spec shape the round-2 verifier used."
  gaps_remaining: []
  regressions:
    - "CR-08 (31-REVIEW.md, this gap-closure round's own review): 31-09's structural fix for gap 1 — appendNote now calls admit() unconditionally — reaches admit()'s frozen D-04 arm on a RE-WRITE of a note that a human already legitimately disposed at the origin (through admitAndAppend's gated, pre-admitted branch). compactor.promote (the writer Workflow 18 names for exactly this case) is a thin pass-through to appendNote, so promoting that same, unchanged, human-disposed high-severity finding to a fresh destination context is now REFUSED under any active human_admission dial. Independently reproduced in this round against the committed scripts/context-io.js and scripts/compactor.js (see gap entry 2 below) — this is a regression 31-09 introduced while closing gap 1, not a defect carried over from round 2."
    - "CR-07 / WR-14 (31-REVIEW.md, this gap-closure round's own review): the round-2 gap 2 fix (31-11's head/tail rule) is sound over the shape space it is asked about, but calleeDottedPath still declines to resolve any callee chain containing a call (test.info().skip()/.fail()/.fixme(), expect.configure({ soft: true })(...)) and any import-renamed head (import { test as it }; it.skip(...)) — both are real, undecided evasions of the SAME D-14 arm (c) ban 31-11 was convened to close, one shape-resolution register over the membership register 31-11 fixed. Independently reproduced in this round against the committed scripts/runnable-ref/uat-spec-integrity.js. This is the third recurrence of this repository's set/shape-literal-drift failure class inside Phase 31 alone (round 1 → gap 2; round 2 → CR-06; this round → CR-07/WR-14), each closed at the exact coordinates the prior verifier measured and reappearing one register over."
gaps:
  - truth: "UATX-06 — conditional or caught assertions, and the D-14 arm-(c) modifier-call bans, are rejected over the TypeScript AST, and the recipe's claim matches exactly what the checker decides."
    status: failed
    reason: >
      31-11 correctly replaced the enumerable BANNED_CONSTRUCTS literal with a head/tail rule
      (isBannedModifierPath) and closed round 2's gap 2 for test.describe.serial.only and
      test.describe.parallel.only — independently re-reproduced in this verification (2 findings,
      exit 1, same probe repo/spec shape as round 2). But the rule is only ever asked about a callee
      that calleeDottedPath can resolve to a dotted path, and that resolver still returns null for
      any chain containing a CallExpression link or an import-renamed head. Two real, undecided
      evasion classes of the SAME D-14 arm (c) ban pass the committed .js at exit 0, independently
      reproduced in this verification session:
      (1) `test.info().skip()`, `test.info().fail()`, `test.info().fixme(true, "later")` — the
      documented TestInfo-fixture runtime spelling of exactly the modifiers the tail set bans, with
      the identical effect on the evidence (the scenario is skipped, or a failing assertion is
      reported as a pass) — each produced `0 findings over 1/1 uat specs checked`, `EXIT=0`.
      (2) `expect.configure({ soft: true })(locator).toBeVisible()` — the soft-assertion escape —
      also produced `0 findings over 1/1 uat specs checked`, `EXIT=0`.
      (3) `import { test as it, expect } from "@playwright/test"; it.skip(...); it.describe.only(...)`
      — an ImportSpecifier rename, resolvable from the AST's own literal propertyName with no type
      checker — also produced `0 findings over 1/1 uat specs checked`, `EXIT=0`.
      All three are undisclosed at every quoted boundary: `UNRESOLVABLE_CALLEE_RESIDUALS` names only
      the assignment-alias and computed-member shapes; `browser-uat-recipe.md`'s "Deliberately
      outside the rule" list (independently read in this verification) names the same two and no
      others; and the reverse partition 31-12 added walks the declared surface via
      `checker.getPropertiesOfType` only, which by construction can never reach a call-link shape
      like `test.info().skip` — so even a complete declared-surface extension could not make that
      partition catch it. The recipe's completeness paragraph ("Completeness against the DECLARED
      framework surface is asserted in BOTH directions") is read, independently, as true only over
      property chains, and does not say so — the same "claim matches the mechanism" defect UATX-06
      exists to prevent, now one shape-resolution register past round 2's membership-register fix.
    artifacts:
      - path: "scripts/runnable-ref/uat-spec-integrity.ts"
        issue: "calleeDottedPath (~line 595-628) returns null for any link that is a CallExpression, so isBannedModifierPath is never even asked about test.info().skip()/.fail()/.fixme() or expect.configure({soft:true})(...); the same function also does not canonicalise an ImportSpecifier rename before reading the head segment, so import { test as it } defeats the head-set membership check entirely."
      - path: "agent-factory/checklists/browser-uat-recipe.md"
        issue: "The 'Deliberately outside the rule' list (~line 184-191) names the assignment-alias and computed-member residuals only; it does not name the call-link shape or the import-rename shape, and the completeness paragraph's 'BOTH directions' claim does not disclose that the reverse partition covers property chains only."
      - path: "scripts/runnable-ref/fixtures/playwright-test.d.ts"
        issue: "Declares no `info` member on Test, so even the reverse partition's forward direction has nothing to walk for the call-link shape; the partition's 'total' claim is total over property chains only, and the header does not say so."
    missing:
      - "Decide the call-link shape instead of declining it in calleeDottedPath (e.g. resolve `test.info().skip` to a path the rule can read, or name a decided list of call-bearing heads like `test.info()` the way D-17 named heads/tails), and add `expect.configure` with a `soft: true` literal to BANNED_EXACT_PATHS or to the residuals with a written reason — recorded as a new dated decision, per this file's own header rule that a red-team finding on the set is a decision and a gap-closure round, not a quiet edit."
      - "Canonicalise an ImportSpecifier rename (Map<localName, importedName> for the @playwright/test import) before the head segment is read, so `import { test as it }` cannot evade the head-set membership check; add a corpus fixture for it."
      - "Declare `info` on the fixture's Test stub so the forward direction of the reverse partition can compile the call-link shape once it is decided, and state in the recipe's completeness paragraph that the reverse walk covers property chains only — not call expressions — until it is extended."
  - truth: "The admission mechanism 31-09 wired for UATX-01 (appendNote consults admit() unconditionally) must not itself introduce a new refusal that blocks a previously-working, human-authorized governance action — specifically, Workflow 18's compactor.promote of a note a human already legitimately disposed at the origin."
    status: failed
    reason: >
      This is a regression 31-09 introduced while closing round 2's gap 1 (CR-05), not a defect
      carried over from round 2 — independently reproduced in this verification against the
      committed scripts/context-io.js and scripts/compactor.js. admitAndAppend's GATED branch
      writes a human-disposed high-severity finding through the module-private, pre-admitted route
      (appendPreAdmittedNote), deliberately skipping admit() because admit()'s D-04 arm cannot
      verify a self-authored human:NAME stamp and would refuse a note the un-forgeable admission-guard
      hook already approved. That reasoning is correct at the ORIGIN write. But Workflow 18's only
      prescribed promotion route, compactor.promote, is a thin pass-through to appendNote
      (scripts/compactor.ts:615), which now calls admit() unconditionally for every kind — so the
      SAME unchanged note, re-written verbatim at a fresh destination context, hits the identical
      D-04 arm and is refused for the identical reason: "carries a self-authored human disposition
      stamp ... that this in-script tier cannot verify." Reproduced live in this verification with
      CLAUDE_PROJECT_DIR pointing at a project configured `{ human_admission: "high-severity",
      audit_retention: "retained" }` and no approval env in the child process: the origin
      admitAndAppend call WROTE the finding; the identical compactor.promote call to a fresh
      destination THREW admit()'s D-04 refusal text and wrote 0 files. The finding was not changed by
      compaction and the human's disposition is not in question — only the writer's blind
      unconditional call into an authority that cannot re-verify what it never adjudicated the first
      time. 31-09's own blast-radius table enumerated this exact call site (scripts/compactor.ts:615,
      "admits, unchanged shape ... for every kind") and dispositioned it without driving the
      human-disposed-finding case that changed; the round's only promote probe used a fabricated
      §14-gate stamp, not a legitimate human stamp.
    artifacts:
      - path: "scripts/context-io.ts"
        issue: "appendNote (~line 1109-1157) has no route for a re-write of an already-admitted note; every call, including one that is a faithful re-binding of a note a human already disposed, is decided as if it were a brand-new admission, and the frozen D-04 arm (~line 1841-1856) cannot verify a self-authored human stamp regardless of whether the note being written is new or promoted."
      - path: "scripts/compactor.ts"
        issue: "promote (~line 609-616) calls appendNote directly with no way to signal that the note it is re-writing is already admitted at the origin, so it inherits the false refusal."
      - path: "agent-factory/workflows/18-context-compaction.md"
        issue: "Step 4 (~line 51) states admission 'still fires on every promoted note' as if that were only a strengthening; it does not disclose that this now REFUSES a legitimate promotion under an active human_admission dial, and step 6's only recovery ('degrade to a claim carrying confidence: UNKNOWN - verify') silently discards a human's high-severity security/architecture/release disposition on every compaction while the dial is active."
    missing:
      - "Give the compactor a pre-admitted re-write route through a proof, not a parameter an agent can set — e.g. an exported promoteAdmitted(task, sourceId, note, body, from, to) that asserts byte-equality of kind/by/verified_by/at against the source note already present in the origin context, then writes via appendPreAdmittedNote; a stamp that cannot be traced to an admitted origin note still goes through appendNote (full admission) exactly as today."
      - "Extend the derived caller-set assertion in scripts/context-io-writer-set.test.ts to the new caller, with the usual watched-fail mirror bounding it."
      - "Drive a test with human_admission: high-severity where the combiner writes a human-disposed finding at the origin and promote carries it to the destination unchanged, asserting it is NOT refused; rewrite Workflow 18 steps 4 and 6 so 'degrade to a claim' is the posture for a note that actually CHANGED, not for a faithful promotion."
deferred: []
advisory: []
behavior_unverified_items: []
human_verification:
  - test: "The attended Claude-in-Chrome lane opens under real interactive auth, pauses for a human on a login/challenge page, and produces only a human-stamped finding + artifact-ref (never a gate stamp)."
    expected: "The lane behaves as documented in agent-factory/checklists/browser-uat-recipe.md §attended lane; no route to a §14-gate stamp is exercised in practice."
    why_human: "Requires an attended Claude Code session with the Claude-in-Chrome browser extension installed and a real interactive login; not reachable in CI and not reachable on this box. Recorded in 31-VALIDATION.md as a Manual-Only Verification and carried forward unchanged through rounds 2 and 3 (R-01)."
  - test: "The claude auth status --json fail-closed predicate (D-10) behaves correctly under an API-key-only box and under a long-lived setup token."
    expected: "Both configurations are a loud skip naming the failing clause, never a silent open."
    why_human: "Research assumptions A2/A3 are UNKNOWN - verify; neither configuration is reachable without destroying this box's real credentials. Not attempted by this round (R-02)."
  - test: "Both browser-absence probe stages, and the whole spec-integrity runnable, on a Windows host."
    expected: "Exit 2 with the browser-absent marker when browsers are missing; parser-absent marker when typescript cannot be resolved."
    why_human: "UNKNOWN - verify per the standing Windows posture (WINDOWS.md); not testable on darwin. Not attempted by this round (R-03)."
  - test: "A host repository that installed grugops before this release re-runs the installer and picks up tools/grugops/uat-spec-integrity.js; the uninstaller removes it."
    expected: "The new runnable is materialized on re-install and cleanly removed on uninstall."
    why_human: "Requires a second scratch repository with a prior grugops install at an earlier release; not exercised by the unit suite. Not attempted by this round (R-04)."
---

# Phase 31: Autonomous Manual Testing Verification Report

**Phase Goal:** An agent can drive a real browser to produce UAT evidence, and the only thing that
counts as evidence is an artifact the §14 gate re-runs — never the agent's narration of what it saw.
**Verified:** 2026-09-08T19:05:00Z
**Status:** gaps_found
**Re-verification:** Yes — third round, after gap-closure plans 31-09..31-12 closed the two blockers
from round 2's `31-VERIFICATION.md` (score 4/6: CR-05 and CR-06). A fresh code review of this
gap-closure round (`31-REVIEW.md`, committed at `f46d9b5`) independently re-measured both closures as
real and found two NEW Criticals (CR-07, CR-08) plus two Warnings (WR-14, WR-15) on the same predicate
families one register over. All findings below are independently re-reproduced in this verification
session against the committed `.js`, not accepted from the review's or the summaries' word.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | UATX-01 — a committed Playwright spec, re-run by the §14 gate, is the machine-verifiable evidence floor; an agent's narration/self-supplied claim never produces a stamp | ✓ VERIFIED | Round-2 gap 1 (CR-05) closed: independently reproduced against the committed `scripts/context-io.js` — `appendNote(task, { kind: "finding", verified_by: "§14-gate#fabricated-run-id", ... })` now THROWS the authority's own refusal and writes 0 files (previously wrote 1 and rendered it into `index.md`). `appendNote` carries no kind comparison anywhere in its body (`grep -c "note.kind"` over the function body: 0). **However, see the second gap below: the same unconditional-admission fix that closes this truth introduces a live regression in a related governance path (compactor.promote of a human-disposed finding), independently reproduced in this session.** |
| 2 | UATX-02 — browser MCP tooling documented and pinned for all five host CLIs; `package.json` gains nothing; the pin authority cannot itself be defeated by a floating specifier | ✓ VERIFIED | Unchanged since round 2, not contested by the review or this verification; `guardPlaywrightMcpPin` green (`node scripts/check-foundation-guards.js` → `PASS playwright MCP pin`). |
| 3 | UATX-03 — Claude in Chrome is attended-only and structurally barred from producing a `§14-gate` stamp | ✓ VERIFIED | `scripts/chrome-lane-bar.test.ts` unchanged this round, part of the current green 62-file/3418-test suite; not contested. |
| 4 | UATX-04 — evidence carries commit SHA + gate-run id + content hash; a note whose SHA is not the HEAD the gate ran against is refused | ✓ VERIFIED | Unchanged since round 2 (closed by 31-05, re-confirmed by round 2's verifier); not contested by the review or this verification. |
| 5 | UATX-05 — an absent/unusable browser produces a loud skip leaving the UAT `pending`, never a silent pass | ✓ VERIFIED | Unchanged this round; `PARSER_ABSENT_MARKER` / `BROWSER_ABSENT_MARKER` each single-emission, exercised by `scripts/runnable-ref/uat-spec-integrity.test.ts`; not contested. |
| 6 | UATX-06 — conditional or caught assertions, and the D-14 arm-(c) modifier bans, are rejected over the TypeScript AST, and the recipe's claim matches exactly what the checker decides | ✗ FAILED — see gap 1 (CR-07/WR-14) | Round-2 gap 2 (CR-06) closed and independently re-reproduced: `test.describe.serial.only`/`test.describe.parallel.only` now each report 1 finding, exit 1. But `test.info().skip()`, `test.info().fail()`, `test.info().fixme(...)`, `expect.configure({ soft: true })(...)`, and an import-renamed head (`import { test as it }`) all independently reproduced at `0 findings over 1/1 uat specs checked`, exit 0 — real, undisclosed evasions of the same D-14 arm (c) ban, one shape-resolution register past the membership-register fix. |

**Score:** 5/6 truths verified at their own literal wording (UATX-01 through UATX-05); UATX-06 fails
again — the third recurrence inside this phase of the same failure class ("a predicate closed at the
exact coordinates a verifier measured, reappearing one register over"). Additionally, a **new gap not
tied to a single UATX truth's literal wording** blocks the phase independently: the fix that closes
UATX-01 this round (appendNote's unconditional `admit()` call) introduces a live regression in the
shared admission mechanism that breaks Workflow 18's documented compaction-promotion path for a
legitimately human-disposed high-severity finding (CR-08). Per the decision tree, a failed truth
(UATX-06) alone is sufficient to set `gaps_found`; CR-08 is recorded as its own gap because it is a
distinct, independently-reproduced regression this round's own plan (31-09) introduced and
mis-dispositioned, not a restatement of UATX-06.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/context-io.ts` / `.js` — `appendNote` | Consults `admit()` unconditionally for every kind, with no second, narrower kind test | ✓ VERIFIED | `appendNote`'s body contains one unconditional `admit()` call and no kind comparison, confirmed by direct source read and by grep against the function body. Independently reproduced refusing the round-2 fabricated finding stamp. |
| `scripts/context-io.ts` — `appendPreAdmittedNote` | Module-private, bounded pre-admitted skip route | ✓ VERIFIED | Not exported (`export function appendPreAdmittedNote` / `composeValidatedNote`: 0 matches); called only from `admitAndAppend`'s two branches per source read. |
| `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` | AST ban over the real Playwright modifier-call surface, decided by a rule rather than an enumerable literal | ⚠️ PRESENT BUT INCOMPLETE | `BANNED_CONSTRUCTS` is deleted; `isBannedModifierPath` correctly decides every shape `calleeDottedPath` resolves. But `calleeDottedPath` itself still declines any callee chain containing a call expression or an import-renamed head, so the rule is never even asked about `test.info().skip()`-shaped calls (CR-07) or `import { test as it }` (WR-14). |
| `scripts/runnable-ref/fixtures/playwright-test.d.ts`, the reverse partition in `uat-spec-integrity.test.ts` | A total, bidirectional cross-check between the declared Playwright surface and the ban decision | ⚠️ PRESENT BUT INCOMPLETE | The forward direction (every banned spelling is real) and the reverse direction (every declared property-chain member is refused or dispositioned) are both real and asserted by partition cardinality — but the walk is `checker.getPropertiesOfType` only, so it structurally cannot reach a call-link shape like `test.info().skip`; the "BOTH directions" completeness claim in the recipe does not disclose this boundary. |
| `scripts/compactor.ts` — `promote` | Re-admits a promoted note without falsely refusing one a human already disposed | ✗ FAILED | `promote` is `return appendNote(task, note, body, contextRoot)` with no distinction between a brand-new note and a faithful re-write of an already-admitted one; a legitimately human-disposed high-severity finding is refused on promotion under an active `human_admission` dial (CR-08), independently reproduced in this session. |
| `agent-factory/checklists/browser-uat-recipe.md` | Ban set and completeness claim quoted from, and equal to, the exported constants and their proven strength | ⚠️ PRESENT BUT INCOMPLETE | The three rule constants are quoted and asserted equal to the exports (verified). The "Deliberately outside the rule" list and the completeness paragraph do not name the call-link or import-rename evasions, so the recipe's claim reads stronger than the mechanism it describes (same gap as the artifact row above). |
| `agent-factory/workflows/16-context-read-write.md`, `17-task-claim.md`, `18-context-compaction.md` | Prose states what the mechanism does for every kind | ⚠️ PRESENT BUT INCOMPLETE | 16/17 correctly describe the unconditional call. 18 step 4's "admission still fires on every promoted note" is now literally true but does not disclose that this can refuse a legitimate promotion (CR-08); step 6's "degrade to a claim" recovery silently discards a human's high-severity disposition on every such compaction. |
| `scripts/context-io-writer-set.test.ts` | Every derived writer exercised against every derived refusal family `admit()` implements | ✓ VERIFIED | 31-10 derives the refusal-family axis from `admit()`'s own parsed body (not hand-typed), asserts the (writer × family) matrix equal to the cross product of the two derived sets, and proves the probes discriminate by set equality; independently corroborated by reading the described derivation against the current file. |
| `scripts/check-foundation-guards.ts` — `guardPlaywrightMcpPin` | Fail-closed pin assertion | ✓ VERIFIED | Green (`node scripts/check-foundation-guards.js`), unchanged, not contested. |
| `scripts/chrome-lane-bar.test.ts` | Derived one-author-set + no-route-in-documented-lane, both watched-fail | ✓ VERIFIED | Unchanged, green, not contested. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `appendNote()` (every kind) | `admit()` (all four refusal families) | the unconditional call 31-09 added | ✓ WIRED | Independently reproduced: the round-2 fabricated-finding-stamp call now throws the D-01 refusal text with 0 files written. |
| `calleeDottedPath`'s resolved output | `isBannedModifierPath` | comparison by head/tail rule | ⚠️ PARTIAL | Sound and total over every shape the resolver reaches; the resolver itself declines call-link and import-rename shapes, so the rule is never asked about them (CR-07/WR-14). |
| `compactor.promote()` | `appendNote()`'s D-04 branch | an unqualified pass-through | ✗ MISWIRED | The link exists and fires, but with no signal distinguishing "brand-new note" from "faithful re-write of an already-admitted note", so it produces a false refusal on the latter (CR-08). This is a link that is technically WIRED but decides the wrong thing for a case in its own domain. |
| recipe's ban-set / completeness prose | the three exported rule constants and the reverse-partition's actual coverage | quoted-and-asserted-equal test | ⚠️ PARTIAL | The constants agree (verified). The completeness prose overstates what the reverse partition can see (property chains only), so agreement here does not mean the claim is accurate. |

### Behavioral Spot-Checks

| # | Behavior | Command | Result | Status |
|---|----------|---------|--------|--------|
| 1 | Round-2 gap 1 (CR-05): fabricated `§14-gate#<id>` finding stamp via `appendNote` | Node probe against committed `scripts/context-io.js`: `appendNote(task, {kind:"finding", verified_by:"§14-gate#fabricated-run-id", ...}, body, contextRoot)` | `appendNote THREW: ...refusing to write a note the admission authority did not accept...`; 0 notes on disk | ✓ PASS — gap 1 (CR-05) confirmed closed |
| 2 | Round-2 gap 2 (CR-06): `test.describe.serial.only` / `.parallel.only` | `node scripts/runnable-ref/uat-spec-integrity.js` over a probe repo/spec with both constructs (typescript@5.7.3 + @playwright/test resolvable) | `UAT spec integrity: 2 finding(s) over 1/1 uat specs checked`, `EXIT=1` | ✓ PASS — gap 2 (CR-06) confirmed closed |
| 3 | **NEW this round (CR-07):** `test.info().skip()` / `.fail()` / `.fixme(...)`, and `expect.configure({soft:true})(...)` | Same runnable/probe repo, spec containing all four constructs | `UAT spec integrity: 0 findings over 1/1 uat specs checked`, `EXIT=0` | ✗ FAIL (confirms CR-07) |
| 4 | **NEW this round (WR-14):** `import { test as it, expect } from "@playwright/test"; it.skip(...); it.describe.only(...)` | Same runnable/probe repo | `UAT spec integrity: 0 findings over 1/1 uat specs checked`, `EXIT=0` | ✗ FAIL (confirms WR-14) |
| 5 | **NEW this round (CR-08):** `compactor.promote` of a legitimately human-disposed high-severity finding, under `human_admission: high-severity` via `CLAUDE_PROJECT_DIR` | Node probe against committed `scripts/context-io.js` + `scripts/compactor.js`: `admitAndAppend` writes the note at the origin (gated branch), then `promote(task, SAME note, body, destRoot)` to a fresh destination | Origin: `WROTE 20260908T020000Z-security-nfr-finding-...`. Promotion: `compactor.promote THREW: context-io.appendNote: refusing to write a note the admission authority did not accept...`; 0 notes at destination | ✗ FAIL (confirms CR-08) |
| 6 | **Control for #5 (WR-15):** the same probe with `CLAUDE_PROJECT_DIR` unset (both calls default to `trustedRepoRoot()`'s kit fallback) | Same probe, env var removed | Origin: WROTE. Promotion: **also WROTE** — the config carrying `human_admission: high-severity` is never consulted because `trustedRepoRoot()` fell back to the kit's own install root, not the temp repo holding the dial | ⚠️ Confirms WR-15: on the four non-Claude-Code CLIs (or any Claude Code invocation where `CLAUDE_PROJECT_DIR` is unset), the D-04 arm this round's writers now claim to "reach for every note" is evaluated against the KIT's lean default, not the target repo's dial |
| 7 | Full excluded-e2e regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 62 passed (62)`, `Tests 3418 passed \| 2 skipped (3420)`, exit 0 | ✓ PASS (green, but rows 3-6 show it exercises none of the three new defects — this project's standing doctrine that a green suite is not proof for a safety predicate holds for the third consecutive verification round on this phase) |
| 8 | Committed `.js` freshness | `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` | ✓ PASS |
| 9 | Foundation guards / UAT oracles | `node scripts/check-foundation-guards.js`, `node scripts/check-uat-oracles.js` | Both `ALL CHECKS PASSED` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| UATX-01 | 31-01, 31-04, 31-05, 31-09, 31-10 | Committed spec = evidence floor; narration never a stamp | ✓ SATISFIED (own wording) — see the separate CR-08 gap for a collateral regression in the same mechanism | Fabricated-finding-stamp bypass closed and independently reproduced closed; the promotion regression (CR-08) does not falsify UATX-01's own wording (narration never produces a stamp) but is a live blocker in the mechanism this requirement's fix now depends on |
| UATX-02 | 31-03, 31-06, 31-07 | Browser MCP tooling documented + pinned, 5 hosts; pin authority cannot itself float | ✓ SATISFIED | Unchanged, not contested |
| UATX-03 | 31-03, 31-04 | Attended Chrome lane structurally barred from gate stamp | ✓ SATISFIED | Unchanged, not contested |
| UATX-04 | 31-01, 31-05 | Evidence provenance (SHA/gate_run/content_hash); mismatched SHA refused | ✓ SATISFIED | Unchanged, not contested |
| UATX-05 | 31-02, 31-04 | Loud skip on absent/unusable browser, never a silent pass | ✓ SATISFIED | Unchanged, not contested |
| UATX-06 | 31-02, 31-04, 31-06, 31-11, 31-12 | AST ban on conditional/caught assertions and modifier calls; claim matches mechanism | ✗ BLOCKED | Round-2's specific spellings closed; `test.info().skip()`-shaped calls, `expect.configure(soft)`, and import-renamed heads still bypass the ban undetected (CR-07/WR-14) |

No orphaned requirements: every requirement ID declared across the twelve plans' `requirements:`
frontmatter (UATX-01 through UATX-06) is accounted for above, and `.planning/REQUIREMENTS.md` maps no
additional Phase 31 requirement ID beyond these six. `.planning/REQUIREMENTS.md` still lists all six as
unchecked (`- [ ]`) and the traceability table still reads "Gaps Found" for all six — correctly
unmoved, since this report also finds `gaps_found`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/runnable-ref/uat-spec-integrity.ts` | ~595-628 (`calleeDottedPath`) | Declines to resolve any callee chain containing a `CallExpression` link, and does not canonicalise an `ImportSpecifier` rename before reading the head segment | 🛑 Blocker | CR-07/WR-14: `test.info().skip()`/`.fail()`/`.fixme()`, `expect.configure({soft:true})(...)`, and `import { test as it }` all bypass the D-14 arm (c) ban undetected — UATX-06's "claim matches the mechanism" is false at this boundary |
| `scripts/compactor.ts` | 615 (`promote`) | Unqualified pass-through to `appendNote`, now unconditionally admission-checked, with no way to signal a faithful re-write of an already-admitted note | 🛑 Blocker | CR-08: a legitimately human-disposed high-severity finding is refused on promotion under an active `human_admission` dial — Workflow 18's own documented recovery path silently discards the human's disposition |
| `scripts/context-io.ts` | 2323 (`GOVERNANCE_FALLBACK_BASE` / `trustedRepoRoot`) | Falls back to the kit's own install root (`ROOT`) when `CLAUDE_PROJECT_DIR` is unset | ⚠️ Warning | WR-15: on the four non-Claude-Code CLIs (and any Claude Code invocation with the env var unset), the D-04/D-14 refusals this round's writers now claim to "reach for every note" are evaluated against the kit's lean default, not the target repo's dial — independently reproduced in this session (row 6 above) |
| `agent-factory/checklists/browser-uat-recipe.md` | ~184-191 | "Deliberately outside the rule" list and the "BOTH directions" completeness claim omit the call-link and import-rename evasions | ⚠️ Warning | Same undisclosed-boundary defect as the CR-07/WR-14 blocker, one level up in the documentation the recipe's own header says must match the mechanism |
| `scripts/check-uat-oracles.ts` | ~541-545 (doc comment on `equivDoWork`) | Comment describes "one admitted finding carrying the frozen §14-gate stamp"; the code writes an unstamped `claim` with the id in `refs` | ℹ️ Info | WR-16: stale doc comment left behind after 31-09's deviation (Rule 4) switched the oracle's seeded note from a stamped finding to an unstamped claim; independently confirmed by reading the current function body |
| `agent-factory/workflows/18-context-compaction.md` | ~53 | "carry no stamp and pass through" is no longer exact now that `admit()` is consulted for every kind | ℹ️ Info | IN-07 (31-REVIEW.md): an unreadable governance config now refuses a promoted `claim`/`observation`/`decision`/`failed-attempt` too, not only a `finding` |

No unreferenced `TBD`/`FIXME`/`XXX` debt markers were found in any source file changed since round 2
(confirmed by a fresh grep across `git diff --name-only 0d81b45..HEAD`); the ROADMAP.md `TBD` matches
are pending-phase placeholders for Phases 32/33, unrelated to this phase's changed files, and
`31-09-SUMMARY.md`'s one match is the sentence "no ... `TODO` or `FIXME` was introduced" (prose, not a
marker).

### Human Verification Required

4 items, all pre-existing `UNKNOWN - verify` / manual-only items already recorded in
`31-VALIDATION.md` and not attempted by this round — none newly discovered by this verification,
carried forward unchanged from round 2 (the attended Chrome lane's real interactive behavior, the
`claude auth status --json` predicate under API-key/long-lived-token auth, the Windows leg of every
browser probe, and the installer/uninstaller round-trip on a pre-existing host install).

### Gaps Summary

Two 🛑 Blockers, both independently re-reproduced in this verification session against the committed
`.js` (not taken on `31-REVIEW.md`'s word):

1. **The D-14 arm (c) modifier ban still does not match the full real Playwright evasion surface
   (UATX-06).** `31-11` correctly replaced the enumerable literal with a head/tail rule and closed
   round 2's exact two spellings. But the rule is only ever asked about a callee `calleeDottedPath`
   can resolve, and that resolver declines any callee chain containing a call — so `test.info().skip()`
   (the documented `TestInfo`-fixture spelling of the exact modifiers the tail set bans), `.fail()`,
   `.fixme()`, and `expect.configure({soft:true})(...)` all pass undetected, as does an
   import-renamed head (`import { test as it }`) that needs no type checker to resolve. This is the
   third recurrence inside Phase 31 of "a predicate closed at the exact coordinates a verifier
   measured, reappearing one register over" — round 1 planted three constructs and 31-06 fixed
   exactly those; round 2 found two sibling spellings and 31-11 fixed exactly those; this round finds
   a sibling shape class (call-link resolution, not membership) that neither fix touched.

2. **31-09's own fix for round 2's gap 1 introduced a live regression in a related governance path.**
   Making `appendNote` consult `admit()` unconditionally correctly closes the fabricated-finding-stamp
   bypass — but it also means `compactor.promote` (Workflow 18's only prescribed route for carrying a
   note forward through compaction) now re-decides a note that a human already legitimately disposed
   at the origin, and `admit()`'s frozen D-04 arm cannot verify a self-authored human stamp regardless
   of whether the note is new or a faithful re-write. Reproduced live: a human-disposed high-severity
   finding writes cleanly at the origin (through the deliberately-skipping gated branch) and is then
   REFUSED, unchanged, when `compactor.promote` tries to carry it to a fresh destination context under
   the same active `human_admission` dial. Workflow 18's own prescribed recovery for a refused
   promotion — "degrade to a claim carrying `confidence: UNKNOWN - verify`" — would silently discard
   every human-adjudicated security/architecture/release disposition on every compaction while the
   dial is active, in exactly the regulated-team posture this project's own governance dial exists to
   serve. 31-09's own blast-radius table enumerated this exact call site and dispositioned it "admits,
   unchanged shape" without driving the case that actually changed.

One ⚠️ Warning worth flagging prominently even though it does not independently block: **WR-15**
(`trustedRepoRoot()`'s kit fallback) means the D-04 regression above is specific to the Claude-Code
`CLAUDE_PROJECT_DIR`-set path — reproduced directly in this session (spot-check row 6): with the env
var unset, the SAME promotion call silently succeeds because the governance dial it should have
refused against was never read. Under the shared-install model this project ships
(`~/.grugops` kit + per-repo state), `CLAUDE_PROJECT_DIR` is exactly the variable Claude Code sets for
a real project session — so this is the primary deployment path, not an edge case, and the two
defects compound: on Claude Code, promotion of a legitimate human disposition is wrongly refused; on
the other four host CLIs, the same promotion is wrongly ADMITTED regardless of what the target
repo's `human_admission` dial says.

The full excluded-e2e suite is green (62/62 files, 3418/3420 tests, 2 pre-existing skips) and exercises
none of the three new defects (CR-07, WR-14, CR-08) — this project's standing doctrine that a green
suite is not proof for a safety predicate holds for the third consecutive verification round on this
phase.

**Progress since round 2 is real and should not be discounted:** both of round 2's own gaps (CR-05,
CR-06) are closed and independently re-verified in this round, each by a genuine structural fix
(deleting an axis rather than widening it; deciding membership by rule rather than by literal) rather
than by patching the exact reported case. The defects that remain are one register past each fix
rather than a reappearance of the same exact case, which is consistent with this repository's own
documented pattern for this predicate family across all three rounds of this phase.

**This looks like it needs a fourth gap-closure round, not an override.** Both blockers are the same
structural pattern this project's own doctrine treats as blocking: "ask how a gate is REACHED, not
only what it refuses" (CR-08 — a re-write reaches a predicate built only to decide new admissions) and
"derive the set a predicate enumerates" (CR-07/WR-14 — a shape-resolution function that declines a
real callee shape by construction, the same class as an enumerable set that omits a real spelling). No
override is suggested; the fixes indicated in each `gaps:` entry's `missing:` list are structural fixes
of the same shape that closed the prior two gaps, applied to the two axes ("what shapes are we even
asked about" and "is this a new admission or a re-binding of one that already happened") this round's
plans did not touch.

---

_Verified: 2026-09-08T19:05:00Z_
_Verifier: Claude (gsd-verifier)_

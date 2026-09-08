---
phase: 31-autonomous-manual-testing
verified: 2026-09-09T01:10:00Z
status: gaps_found
score: 4/6 must-haves verified
covered_files:
  - ".planning/REQUIREMENTS.md"
  - ".planning/ROADMAP.md"
  - ".planning/STATE.md"
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
  - ".planning/phases/31-autonomous-manual-testing/31-13-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-13-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-14-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-14-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-15-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-15-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-CONTEXT.md"
  - ".planning/phases/31-autonomous-manual-testing/31-DISCUSSION-LOG.md"
  - ".planning/phases/31-autonomous-manual-testing/31-PATTERNS.md"
  - ".planning/phases/31-autonomous-manual-testing/31-RESEARCH.md"
  - ".planning/phases/31-autonomous-manual-testing/31-REVIEW.md"
  - ".planning/phases/31-autonomous-manual-testing/31-VALIDATION.md"
  - ".planning/phases/31-autonomous-manual-testing/31-VERIFICATION.md"
  - ".planning/phases/31-autonomous-manual-testing/deferred-items.md"
  - "agent-factory/checklists/00-index.md"
  - "agent-factory/checklists/browser-uat-recipe.md"
  - "agent-factory/contracts/context-note.md"
  - "agent-factory/workflows/05-pr-quality-gate.md"
  - "agent-factory/workflows/06-uat-pack.md"
  - "agent-factory/workflows/16-context-read-write.md"
  - "agent-factory/workflows/17-task-claim.md"
  - "agent-factory/workflows/18-context-compaction.md"
  - "docs/audit/29-style-dispositions/31-14.md"
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
  - "scripts/checkpoints.js"
  - "scripts/checkpoints.ts"
  - "scripts/chrome-lane-bar.test.ts"
  - "scripts/compactor.js"
  - "scripts/compactor.test.ts"
  - "scripts/compactor.ts"
  - "scripts/context-io-writer-set.test.ts"
  - "scripts/context-io.js"
  - "scripts/context-io.test.ts"
  - "scripts/context-io.ts"
  - "scripts/floor-invariance.test.ts"
  - "scripts/runnable-ref/fixtures/caught-assertion.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/clean.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/conditional-assertion.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/configured-soft.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/element-access-modifier.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/import-rename.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/modifier-call-link.uat.spec.ts"
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
covered_digest: "v1:sha256:51837621d9b39fe6aab9e864d23ee460d44d435f2d1fff92faeeb379f4ffc4ed"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 5/6
  gaps_closed:
    - "round-3 gap 1, part A (CR-07/WR-14 exact spellings): `test.info().skip()`/`.fail()`/`.fixme()`, `expect.configure({ soft: true })(locator).toBeVisible()` (unchained), and `import { test as it }; it.skip(...); it.describe.only(...)` are each refused at exit 1 by the committed `.js` — independently re-reproduced in this session on the exact probe shapes round 3 used."
    - "round-3 gap 2 (CR-08): a human-disposed high-severity finding admitted at the origin through `admitAndAppend`'s gated branch now promotes UNCHANGED to a fresh destination via the new `promoteAdmitted` route instead of being refused — independently re-reproduced against the committed `scripts/context-io.js` + `scripts/compactor.js`."
    - "WR-15 (the trusted-root kit-fallback compounding CR-08 on four of five host CLIs): with both project-directory variables unset and the working directory inside a project carrying an active dial, the write is now REFUSED naming the dial, where the pre-fix committed `.js` wrote it — independently re-reproduced."
  gaps_remaining:
    - "UATX-06 (round 3 gap 1, part B — a fourth recurrence at a further shape-resolution register): `expect.configure({ retries: 2 }).soft(locator).toBeVisible()`, `expect.configure({ retries: 2 }).configure({ soft: true })(locator)`, and `testInfo.skip()`/`.fail()`/`.fixme()` reached through the documented fixture-parameter spelling of `TestInfo` all independently reproduce at `0 findings over 1/1 uat specs checked`, exit 0, against the committed `scripts/runnable-ref/uat-spec-integrity.js` at HEAD (CR-09, CR-09's second variant, CR-10 of `31-REVIEW.md`)."
    - "UATX-01 (new: CR-11 of `31-REVIEW.md`, a defect in the very mechanism 31-14 built to close round 3's gap 2): `compactor.promoteAdmitted` writes to a caller-CHOSEN note id with no check of what already lives at the destination, so a legitimately admitted note in the shared verified context can be silently DESTROYED and REPLACED by a fabricated human-stamped claim with no admission check reached at all — independently reproduced against the committed `scripts/context-io.js` + `scripts/compactor.js` in this session: an admitted `observation` at the destination is overwritten byte-for-byte by a forged `finding` under the SAME id, with no exception thrown and no diagnostic of any kind."
  regressions:
    - "CR-11 (`31-REVIEW.md`, this round's own review, independently reproduced in this verification): `promoteAdmitted`'s proof compares the promoted input against bytes read from an ORIGIN DIRECTORY THE CALLER NAMES (the `from` parameter, unconstrained — WR-17) and never reads the DESTINATION before writing. A caller who controls `from` can therefore produce any 'proof' it wants and overwrite any note already living at `to`. This is a regression introduced by 31-14's own fix for CR-08, not a defect carried over from round 3: round 3's `promoteAdmitted` did not exist yet."
    - "WR-21 (`31-REVIEW.md`, this round's own review, independently reproduced in this verification): the upward governance-root walk 31-15 added to close WR-15 stops only at a `.git` marker or the filesystem root — never at `os.homedir()` — so with no `.git` anywhere on the path, a `.grugops/factory.config.json` sitting at or above what would be a user's home directory is adopted as the trusted root. Reproduced directly: a 3-level-deep cwd with no `.git` on the path resolved `trustedRepoRoot()` to the planted home-directory-shaped ancestor's config. Under the shipped shared-install model (`~/.grugops`), this is exactly the shape of ancestor the walk was documented as unable to reach."
gaps:
  - truth: "UATX-06 — conditional or caught assertions, and the D-14 arm-(c) modifier-call bans, are rejected over the TypeScript AST, and the recipe's claim matches exactly what the checker decides."
    status: failed
    reason: >
      31-13 correctly decided the call-link and import-rename SHAPE-RESOLUTION register that round 3
      found undecided (CR-07/WR-14), and every spelling round 3 reproduced is now refused — independently
      re-verified in this session (see Behavioral Spot-Checks rows 1-4). But 31-REVIEW.md's own
      gap-closure review of this same round found a further register one level past the fix: D-18's `()`
      call-link marker was reasoned about for only ONE of the ban's three arms (the head/tail arm), and
      testInfo's fixture-parameter spelling was dispositioned only inside a test-file comment whose stated
      reason ("needs a type checker") is the exact excuse WR-14's own closure disproved one shape earlier.
      Independently reproduced in this verification session, against the committed
      scripts/runnable-ref/uat-spec-integrity.js at HEAD (commit a16786b), using the same probe-repository
      shape 31-13 itself used (a resolvable typescript, a spec at a uat/*.uat.spec.ts path):
      (1) `expect.configure({ retries: 2 }).soft(locator).toBeVisible()` -> `0 findings over 1/1 uat specs
      checked`, EXIT=0. The `()` marker inserted by D-18 turns the resolved path into
      `expect.configure().soft`, which is NOT a member of BANNED_EXACT_PATHS (`expect.soft`) — the marker
      is only routing-neutral for the head/tail arm, not for the two whole-path arms.
      (2) `expect.configure({ retries: 2 }).configure({ soft: true })(locator)` -> `0 findings over 1/1
      uat specs checked`, EXIT=0. Resolves to `expect.configure().configure`, not a key of
      BANNED_CONFIGURED_PATHS (`expect.configure`).
      (3) `test("a", async ({ page }, testInfo) => { testInfo.skip(); ... })` -> `0 findings over 1/1 uat
      specs checked`, EXIT=0. `testInfo` is simply not a member of BANNED_MODIFIER_HEADS; this is
      Playwright's PRIMARY documented spelling of the exact modifiers D-18 (1) was convened to decide in
      their `test.info()` form.
      Controls confirmed unmoved in the same session: `test.info().skip()` (bare, no fixture parameter)
      -> 1 finding, EXIT=1; `expect.configure({ soft: true })(locator).toBeVisible()` (unchained) -> 1
      finding, EXIT=1 — so 31-13's own fix is intact and the new bypasses are a distinct, further shape
      class, not a regression of what 31-13 closed.
    artifacts:
      - path: "scripts/runnable-ref/uat-spec-integrity.ts"
        issue: "isBannedModifierCall / isBannedModifierPath compare BANNED_EXACT_PATHS and BANNED_CONFIGURED_PATHS against the raw resolved path, which still carries the () marker segment D-18 inserted for a call link — so a call-link spelling of either whole-path arm's target defeats it, even though the head/tail arm the marker was reasoned about is unaffected. Separately, BANNED_MODIFIER_HEADS has no member for a TestInfo binding reached through the SECOND parameter of a test callback — a positional, parse-only fact the file's own WR-14 closure already proved decidable without a type checker for the analogous ImportSpecifier case."
      - path: "agent-factory/checklists/browser-uat-recipe.md"
        issue: "The boundary list and completeness paragraph (post-31-13) do not disclose either gap: they read as though the call-link decision and the import-rename canonicalisation together decide every real evasion of the arm-(c) ban, and the testInfo fixture-parameter spelling is named only in a test-file comment the recipe itself does not quote."
    missing:
      - "Make BANNED_EXACT_PATHS and BANNED_CONFIGURED_PATHS marker-aware: strip an interior routing () marker segment before comparing against either whole-path arm (leaving the head/tail arm exactly as D-17/D-18 left it), so `expect.configure().soft` and `expect.configure().configure` (with `soft` enabled) are recognised as `expect.soft` / `expect.configure`+`soft` respectively."
      - "Decide the TestInfo fixture-parameter binding the same way D-18 (3) decided the import rename: collect the second parameter name of the function passed as the second argument to a `test(...)`-headed call, per source file, and canonicalise that head to `test` before membership is asked — or, if left undecided, give it its own named, recipe-visible residual with a true reason rather than sharing the alias-binding sentence's false one."
      - "Record the fix as a new dated decision beside D-18, per this file's own header rule that a red-team finding on the set is a decision and a gap-closure round, never a quiet edit; add each new escape to a MUTATE-REMOVE corpus fixture with its chained/invoked form (not the un-chained control the current configured-soft fixture uses)."
  - truth: "UATX-01 — a committed Playwright spec, re-run by the §14 gate, is the machine-verifiable evidence floor; an agent's narration or an MCP tool-call transcript never produces a stamp — and the mechanism that carries an already-admitted note forward through compaction must not itself become a route to plant unverified narration into the shared verified context."
    status: failed
    reason: >
      31-14's `promoteAdmitted` correctly closes round 3's CR-08 (a legitimately human-disposed note no
      longer refuses on promotion — independently re-verified, see Behavioral Spot-Checks row 5) and
      correctly keeps CR-05 closed (a fabricated §14-gate stamp is still refused through both routes —
      re-verified, row 6). But `31-REVIEW.md`'s own review of this round found a new, more severe defect
      in the SAME function: `promoteAdmitted` never reads what already lives at the destination before
      writing, and its "proof" is compared against bytes read from the `from` directory, which is an
      ORDINARY, UNVALIDATED caller-supplied path (WR-17) — not a directory the module trusts. Independently
      reproduced in this verification session against the committed scripts/context-io.js +
      scripts/compactor.js: a legitimate `observation` note ("The login lane FAILED on 3 of 5 scenarios.")
      is admitted into a shared destination context the normal way via `appendNote`. A caller then hand-
      authors an ENTIRELY SEPARATE directory containing a note file that reuses that exact id, with fields
      (kind, by, verified_by, at) matching whatever the caller is about to promote — trivial for an
      attacker who controls both sides of the "proof". Calling `compactor.promoteAdmitted(task, sourceId,
      forgedNote, forgedBody, forgedFrom, destRoot)` returns the SAME id, throws nothing, and the
      destination's ONLY note file for that id is now the forged `finding` — kind, by, verified_by all
      overwritten, the original observation's text and provenance gone with no trace, no exception, no
      diagnostic. `render()`/`currentState()` at the destination show only the replacement. This is
      squarely the class UATX-01 exists to forbid: a caller-authored claim, verified by nothing the module
      can attest to, silently becomes indistinguishable from genuine admitted evidence in the shared
      verified context — the CR-05 pattern reopened one level indirect, through the module's own newest
      writer. Source-verified corroboration for WR-18 in the same session: `promoteAdmitted`'s governance
      read (scripts/context-io.ts ~1400-1414) examines only whether the config is READABLE
      (`govResult === null || govResult.source === "unreadable"`), never `govResult.config.human_admission`
      — so the route carries a `human:NAME` stamp forward even under a dial that would have refused it on
      every other writer.
    artifacts:
      - path: "scripts/context-io.ts"
        issue: "promoteAdmitted (~line 1369-1486) takes `sourceId` as the literal write id with no check of what already exists at `to` under that id, and reads its comparison operand from `from`, an unconstrained caller-supplied directory (readRawNotes(task, from) at ~line 1462) rather than a location the module has any reason to trust — so the 'proof' is a proof over bytes the same caller who benefits from the write can also author."
      - path: "scripts/compactor.ts"
        issue: "The `promoteAdmitted` pass-through (~line 630-637) forwards `from`/`to` without constraining either to the context store the destination belongs to, so nothing between the compactor's caller and the writer bounds where the 'origin' bytes may come from."
    missing:
      - "Read the destination before writing: if a note already exists at `to` under `sourceId` with different bytes, decline (a `destination-id-occupied` clause in PROMOTE_ADMITTED_DECLINES); identical bytes may be treated as an idempotent re-promotion, but that must be a decided case, not `atomicWrite`'s default rename-onto-existing behaviour."
      - "Constrain `from` to resolve inside the same context store family the destination belongs to (or under `trustedRepoRoot()`), or — if an arbitrary cross-repository `from` is intended — add a named residual to PROMOTE_ADMITTED_RESIDUALS stating so explicitly, and soften context-io.ts:1140's claim that the skip is granted only by 'a proof over bytes that ALREADY EXIST' to state what the code actually trusts."
      - "Consult govResult.config.human_admission's VALUE, not only its readability, before carrying a human:NAME stamp forward — mirroring the isGatedNote check admitAndAppend's W3 arm already makes — so a re-binding cannot admit a disposition the destination's own dial would refuse on every other writer."
deferred: []
advisory: []
behavior_unverified_items: []
human_verification:
  - test: "The attended Claude-in-Chrome lane opens under real interactive auth, pauses for a human on a login/challenge page, and produces only a human-stamped finding + artifact-ref (never a gate stamp)."
    expected: "The lane behaves as documented in agent-factory/checklists/browser-uat-recipe.md's attended lane; no route to a §14-gate stamp is exercised in practice."
    why_human: "Requires an attended Claude Code session with the Claude-in-Chrome browser extension installed and a real interactive login; not reachable in CI and not reachable on this box. Carried forward unchanged through rounds 2, 3 and 4 (R-01)."
  - test: "The claude auth status --json fail-closed predicate (D-10) behaves correctly under an API-key-only box and under a long-lived setup token."
    expected: "Both configurations are a loud skip naming the failing clause, never a silent open."
    why_human: "Research assumptions A2/A3 are UNKNOWN - verify; neither configuration is reachable without destroying this box's real credentials. Carried forward unchanged (R-02)."
  - test: "Both browser-absence probe stages, and the whole spec-integrity runnable, on a Windows host."
    expected: "Exit 2 with the browser-absent marker when browsers are missing; parser-absent marker when typescript cannot be resolved."
    why_human: "UNKNOWN - verify per the standing Windows posture (WINDOWS.md); not testable on darwin. Carried forward unchanged (R-03)."
  - test: "A host repository that installed grugops before this release re-runs the installer and picks up tools/grugops/uat-spec-integrity.js; the uninstaller removes it."
    expected: "The new runnable is materialized on re-install and cleanly removed on uninstall."
    why_human: "Requires a second scratch repository with a prior grugops install at an earlier release; not exercised by the unit suite. Carried forward unchanged (R-04)."
---

# Phase 31: Autonomous Manual Testing Verification Report

**Phase Goal:** An agent can drive a real browser to produce UAT evidence, and the only thing that
counts as evidence is an artifact the §14 gate re-runs — never the agent's narration of what it saw.
**Verified:** 2026-09-09T01:10:00Z
**Status:** gaps_found
**Re-verification:** Yes — FOURTH round, after gap-closure plans 31-13, 31-14, 31-15 closed the two
blockers from round 3's `31-VERIFICATION.md` (score 5/6: UATX-06 gap / CR-07+WR-14, and the CR-08
regression). A fresh code review of this gap-closure round (`31-REVIEW.md`, committed at `a16786b`)
independently re-measured all four of round 3's closures as real and found THREE new Criticals (CR-09,
CR-09's second variant, CR-10, CR-11) plus five Warnings (WR-17 through WR-21) on the same two predicate
families, one register further over. Every finding below — both the round-3 closures and the round-4
review's new findings — is independently re-reproduced in THIS verification session against the
committed `.js`, not accepted from `31-REVIEW.md`'s or the summaries' word.

## Round History

| Round | Status | Score | What moved |
|---|---|---|---|
| 1 | gaps_found | — | Three planted constructs found and fixed by 31-06 |
| 2 | gaps_found | 4/6 | CR-05 (fabricated §14-gate stamp) and CR-06 (two `test.describe.*.only` spellings) |
| 3 | gaps_found | 5/6 | CR-05/CR-06 closed by 31-09..31-12; CR-07/WR-14 (call-link + import-rename evasions) and CR-08 (compaction refuses a human-disposed finding) found |
| **4 (this round)** | **gaps_found** | **4/6** | CR-07/WR-14/CR-08/WR-15 closed by 31-13..31-15 and independently re-verified here; THREE new Criticals (CR-09 x2, CR-10 — a further shape-resolution register of the same modifier ban) and a new regression (CR-11 — `promoteAdmitted` can silently overwrite an already-admitted note) plus WR-21 (the new governance-root walk can reach a home-directory-shaped ancestor) found and independently reproduced in this session |

The score fell from 5/6 to 4/6 this round. This is not a regression in what was already fixed — every
round-3 closure re-verifies clean — it is CR-11 (a defect in code that did not exist before 31-14)
newly failing UATX-01's own literal wording, on top of UATX-06 failing again at a further register.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | UATX-01 — a committed Playwright spec, re-run by the §14 gate, is the machine-verifiable evidence floor; an agent's narration/self-supplied claim never produces a stamp | ✗ FAILED — see gap 2 (CR-11) | Round-3's CR-08 (compaction refused a human-disposed finding) and CR-05 (fabricated stamp) are both independently re-verified closed. But `promoteAdmitted`, the route 31-14 built to close CR-08, has no check of the destination before writing and reads its "proof" from a caller-named directory — independently reproduced in this session: a legitimately admitted note in a shared destination context is silently DESTROYED and replaced by a fabricated human-stamped finding, with no exception and no diagnostic. |
| 2 | UATX-02 — browser MCP tooling documented and pinned for all five host CLIs; `package.json` gains nothing; the pin authority cannot itself be defeated by a floating specifier | ✓ VERIFIED | Unchanged since round 2, not contested by the review or this verification; `guardPlaywrightMcpPin` green (`node scripts/check-foundation-guards.js` → `PASS playwright MCP pin`), re-run in this session. |
| 3 | UATX-03 — Claude in Chrome is attended-only and structurally barred from producing a `§14-gate` stamp | ✓ VERIFIED | `scripts/chrome-lane-bar.test.ts` unchanged this round (15 cases), part of the green 62-file/3566-test suite re-run in this session; not contested. |
| 4 | UATX-04 — evidence carries commit SHA + gate-run id + content hash; a note whose SHA is not the HEAD the gate ran against is refused | ✓ VERIFIED | Unchanged since round 2; 31-14 explicitly re-verified that a §14-gate-stamped finding and an artifact-ref do NOT take `promoteAdmitted`'s proof route (its entry set requires a `human:NAME` stamp) and still re-admit at the destination against a live green verdict there — not contested by the review or by this verification. |
| 5 | UATX-05 — an absent/unusable browser produces a loud skip leaving the UAT `pending`, never a silent pass | ✓ VERIFIED | Unchanged this round; `PARSER_ABSENT_MARKER` / `BROWSER_ABSENT_MARKER` each single-emission. (Note: WR-19, reproduced below, is an UNCAUGHT EXCEPTION on a pathological callee chain — not a silent pass, but it does bypass the vacuity/denominator floor's diagnostic line. Tracked under UATX-06's anti-patterns rather than flipping this truth, since it is a resolver-internals defect in the AST checker, not the browser-absence contract.) |
| 6 | UATX-06 — conditional or caught assertions, and the D-14 arm-(c) modifier bans, are rejected over the TypeScript AST, and the recipe's claim matches exactly what the checker decides | ✗ FAILED — see gap 1 (CR-09/CR-10) | Round-3's CR-07/WR-14 spellings (`test.info().skip()`, unchained `expect.configure({soft:true})(...)`, `import { test as it }`) are independently re-verified refused at exit 1. But `expect.configure({retries:2}).soft(...)` (chained), `expect.configure({retries:2}).configure({soft:true})(...)` (chained), and `testInfo.skip()` via the documented fixture-parameter spelling all independently reproduce at `0 findings over 1/1 uat specs checked`, exit 0 — real, undisclosed evasions of the same D-14 arm (c) ban, one register past 31-13's shape-resolution fix. |

**Score:** 4/6 truths verified (UATX-02, UATX-03, UATX-04, UATX-05). UATX-01 and UATX-06 both fail —
this is the FOURTH consecutive round in which this phase's two predicate families (the UAT-spec modifier
ban, and the admission/re-binding mechanism) close the exact coordinates the prior round measured and a
new bypass reappears one register over.

### Deferred Items

None. No gap identified this round is addressed by a later phase in the roadmap; both remaining gaps
are Phase 31's own predicate families.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` | AST ban over the real Playwright modifier-call surface, decided by a rule rather than an enumerable literal, reaching every real call-link and rename spelling | ⚠️ PRESENT BUT INCOMPLETE | 31-13's call-link/import-rename/configured-soft shape resolution is real and independently verified over the exact spellings round 3 named. But the whole-path arms (`BANNED_EXACT_PATHS`, `BANNED_CONFIGURED_PATHS`) are not marker-aware, so a CHAINED call-link spelling of either still defeats them (CR-09), and `BANNED_MODIFIER_HEADS` has no member for the `TestInfo` fixture-parameter binding (CR-10) — independently reproduced. |
| `scripts/context-io.ts` — `promoteAdmitted` | A proof-gated re-binding route that carries an already-admitted note forward, refusing anything that is not a faithful, provable re-binding | ✗ FAILED | The function exists, is exported, and correctly closes CR-08/CR-05 (independently re-verified). But it has no check of what already lives at the destination under `sourceId`, and its proof operand is read from an unconstrained caller-supplied `from` directory — independently reproduced overwriting an already-admitted destination note with a forged one, silently, with no exception (CR-11/WR-17). It also never consults `human_admission`'s VALUE, only its readability (WR-18, source-verified). |
| `scripts/compactor.ts` — `promote` / `promoteAdmitted` | Re-admits a promoted note without falsely refusing one a human already disposed, and without a route that can overwrite existing evidence | ⚠️ PARTIAL | `promote` is unchanged and correct. `promoteAdmitted`'s pass-through inherits the context-io defect above. |
| `agent-factory/checklists/browser-uat-recipe.md` | Ban set and completeness claim quoted from, and equal to, the exported constants and their proven strength | ⚠️ PRESENT BUT INCOMPLETE | The boundary list and completeness paragraph updated by 31-13 do not disclose the marker-defeats-whole-path-arms boundary or the testInfo fixture-parameter spelling; a reader is told more than the mechanism now delivers, the same class of gap this requirement exists to prevent. |
| `scripts/context-io.ts` — `trustedRepoRoot` | A documented resolution order that reads the target repository's dial on every host, bounded so it can never reach a user's home directory | ⚠️ PARTIAL | The four-step order (Claude Code var, installer var, bounded cwd walk, kit) is real and independently re-verified to close WR-15's exact spot-check. But the walk's stated bound ("never reaches a user's home directory") is false: it stops only at `.git` or the filesystem root, not at `os.homedir()` — independently reproduced (WR-21) climbing three ancestor levels with no `.git` anywhere on the path and adopting a home-directory-shaped ancestor's config. |
| `scripts/check-uat-oracles.ts` — `equivDoWork` | Doc comment matches the mechanism; writes confined to a governance root the function owns | ✓ VERIFIED | Independently source-verified: the docstring now describes the unstamped `observation`/`claim` pair, and both write calls pass an explicit, function-owned temp governance root (WR-16/IN-08 both closed). |
| `scripts/context-io-writer-set.test.ts` | Every derived writer/caller/decline-clause axis, bound in both directions to a decision or a named residual, with watched-fail mirrors | ✓ VERIFIED (as far as its own derivations reach) | The derivations are real and internally consistent — but see the Gaps Summary: a derivation can only find what its own AST walk is asked to look for, and both new Critical classes this round (CR-09, CR-11) sit outside what any of this phase's derivations currently enumerate (the whole-path arms' marker-awareness is not itself a derived axis; the destination-liveness check is not itself a derived decline clause). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `calleeDottedPath`'s marker-carrying resolved output | `BANNED_EXACT_PATHS` / `BANNED_CONFIGURED_PATHS` | direct string/key comparison | ✗ MISWIRED | Sound for the head/tail arm (D-17/D-18's own reasoning); the two whole-path arms compare the marker-carrying path directly, so a legitimate `.configure()` link before `.soft`/`.configure({soft:true})` walks past both undetected (CR-09). |
| `test`'s second callback parameter (`testInfo`) | `BANNED_MODIFIER_HEADS` | head-segment membership | ✗ NOT_WIRED | `testInfo` is never canonicalised to `test` before membership is asked, so the entire TestInfo-fixture spelling family is invisible to the rule (CR-10). |
| `promoteAdmitted()` | the destination context's existing notes | (none — no read of `to` before write) | ✗ MISSING LINK | `writeNoteFile`/`atomicWrite` renames onto whatever exists at the destination id with no prior check; the function's own "proof" never asks what is already there (CR-11). |
| `promoteAdmitted()`'s proof | the ORIGIN context's bytes | `readRawNotes(task, from)` | ⚠️ MISWIRED | `from` is an ordinary, unconstrained parameter — the proof is over bytes the CALLER supplies, not bytes the module has independent reason to trust (WR-17), which is what makes the CR-11 overwrite possible without forging anything the module checks. |
| `trustedRepoRoot()`'s upward walk | its own docstring's "never reaches a user's home directory" claim | `REPO_BOUNDARY_MARKERS = [".git"]` stop condition | ✗ MISWIRED | The only stop conditions are a config found, a `.git` marker found, the filesystem root, or 64 ancestors — none of which is `os.homedir()`, so the claim is false whenever no `.git` sits on the path (WR-21). |

### Behavioral Spot-Checks

All commands below were run in THIS verification session against the committed `.js` at HEAD
(`a16786b`), using the same probe-repository shape prior rounds established (a resolvable `typescript`
via `.temp/<name>/` inside this repository so `node_modules` resolves; specs at a `uat/*.uat.spec.ts`
path). `.temp/` probe directories were deleted immediately after each measurement, and the suite's
"derives zero specs from grugops's own repository root" case was re-confirmed green in isolation after
cleanup (see row 12).

| # | Behavior | Command | Result | Status |
|---|----------|---------|--------|--------|
| 1 | Round-3 closure: `test.info().skip()` (bare, no fixture param) | `node scripts/runnable-ref/uat-spec-integrity.js` over a probe spec | `1 finding(s) over 1/1 uat specs checked`, EXIT=1 | ✓ PASS — round-3 closure confirmed intact |
| 2 | Round-3 closure: `expect.configure({ soft: true })(locator).toBeVisible()` (unchained) | same | `1 finding(s) over 1/1`, EXIT=1 | ✓ PASS — round-3 closure confirmed intact |
| 3 | Round-3 closure: `import { test as it }; it.skip(...); it.describe.only(...)` | same | `1 finding(s) over 1/1`, EXIT=1 (bare `it.skip`) | ✓ PASS — round-3 closure confirmed intact |
| 4 | **NEW this round (CR-09):** `expect.configure({ retries: 2 }).soft(locator).toBeVisible()` (chained) | same | `0 findings over 1/1 uat specs checked`, EXIT=0 | ✗ FAIL (confirms CR-09) |
| 5 | **NEW this round (CR-09, second variant):** `expect.configure({ retries: 2 }).configure({ soft: true })(locator)` (chained) | same | `0 findings over 1/1`, EXIT=0 | ✗ FAIL (confirms CR-09) |
| 6 | **NEW this round (CR-10):** `test("a", async ({ page }, testInfo) => { testInfo.skip(); ... })` | same | `0 findings over 1/1`, EXIT=0 | ✗ FAIL (confirms CR-10) |
| 7 | **Control (WR-20):** a legitimate spec with an UNRELATED local `it` parameter shadowing the renamed import, calling `.skip` on a plain object | same | `1 finding(s) over 1/1`, EXIT=1, naming `test.skip` — a construct that does not appear in the file | ⚠️ Confirms WR-20 (false positive; the rename canonicalisation is scope-unaware) |
| 8 | **NEW this round (WR-19):** a 4000-link call chain ending `.skip` | `node scripts/runnable-ref/uat-spec-integrity.js` over a probe spec with the pathological chain | `RangeError: Maximum call stack size exceeded` at `calleeDottedPath`; stack trace on stderr, EXIT=1, no `visited/expected` summary line printed at all | ⚠️ Confirms WR-19 (an uncaught crash, not the loud-skip contract's controlled exit; bypasses the vacuity/denominator floor's diagnostic) |
| 9 | **NEW this round (CR-11):** `promoteAdmitted` overwriting an already-admitted destination note | Node probe against committed `scripts/context-io.js` + `scripts/compactor.js`: `appendNote` admits a real `observation` at a destination context; a forged `finding` (same id) is authored in a caller-controlled `forgedFrom` directory and promoted via `promoteAdmitted(task, sourceId, forgedNote, forgedBody, forgedFrom, destRoot)` | `promotedId` returned = the SAME id as the original; `threw` = null; destination now holds exactly one file, with kind `finding`/by `security-nfr`/verified_by `human:mallory`/body "The login lane passed cleanly. Nothing to see here." — the original observation's content is gone | ✗ FAIL (confirms CR-11) |
| 10 | **Source-verified (WR-18):** `promoteAdmitted`'s governance read never examines the dial's value | Direct read of `scripts/context-io.ts` ~1400-1414 | Only `govResult === null \|\| govResult.source === "unreadable"` is examined; `govResult.config.human_admission` has zero occurrences in the function body | ⚠️ Confirms WR-18 |
| 11 | **NEW this round (WR-21):** the upward governance-root walk reaches a home-directory-shaped ancestor with no `.git` on the path | Node probe: a fake "home" dir with `.grugops/factory.config.json` (`human_admission: "all"`), a cwd 3 levels below it with no `.git` anywhere, both project-directory env vars unset | `trustedRepoRoot()` returned the fake home directory itself | ✗ FAIL (confirms WR-21) |
| 12 | Full excluded-e2e regression suite (run once, after all probe directories were cleaned up) | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 62 passed (62)`, `Tests 3566 passed \| 2 skipped (3568)`, exit 0 | ✓ PASS — and, for the FOURTH consecutive verification round on this phase, exercises none of the newly-found defects (CR-09 x2, CR-10, CR-11, WR-19, WR-20, WR-21) |
| 13 | Committed `.js` freshness | `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` | ✓ PASS |
| 14 | Foundation guards / UAT oracles | `node scripts/check-foundation-guards.js`, `node scripts/check-uat-oracles.js` | Both `ALL CHECKS PASSED` | ✓ PASS |
| 15 | Byte-frozen deploy guard | `git hash-object hooks/guard.ts` | `669725bc1c616ab57123e22090d93d57eff1b001`, equal to `FROZEN_GUARD_BLOB` in `scripts/floor-invariance.test.ts:245` | ✓ PASS — 31-15's touch-and-revert (deviation 1) is complete |

**Note on row 12's earlier false alarm:** a first full-suite run in this session reported one failure
("derives zero specs from grugops's own repository root", expected status 2, got 1) — caused entirely by
this verification's own leftover `.temp/verify31-probe/**/*.uat.spec.ts` probe files from rows 4-6, which
are not excluded by `SKIPPED_DIRECTORIES` (documented, existing behavior — 31-13's own SUMMARY notes the
same hazard). Deleting the probe directories and re-running that one case in isolation confirmed it green;
the row-12 figures above are from the clean re-run after cleanup, with no probe artifacts left on disk
(`git status --short .temp` empty).

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| UATX-01 | 31-01, 31-04, 31-05, 31-09, 31-10, 31-14 | Committed spec = evidence floor; narration never a stamp | ✗ BLOCKED | CR-08/CR-05 closures re-verified intact; CR-11 (a defect in the promotion route built to close CR-08) independently reproduced silently overwriting admitted evidence with a caller-forged claim |
| UATX-02 | 31-03, 31-06, 31-07 | Browser MCP tooling documented + pinned, 5 hosts; pin authority cannot itself float | ✓ SATISFIED | Unchanged, not contested |
| UATX-03 | 31-03, 31-04, 31-15 | Attended Chrome lane structurally barred from gate stamp | ✓ SATISFIED | Unchanged, not contested; structural bar re-run green this round |
| UATX-04 | 31-01, 31-05, 31-14 | Evidence provenance (SHA/gate_run/content_hash); mismatched SHA refused | ✓ SATISFIED | Unchanged, not contested; provenance re-binding explicitly kept out of `promoteAdmitted`'s entry set |
| UATX-05 | 31-02, 31-04, 31-13 | Loud skip on absent/unusable browser, never a silent pass | ✓ SATISFIED | Unchanged; WR-19's crash is a resolver-internals defect tracked under UATX-06, not a silent-pass violation of this requirement |
| UATX-06 | 31-02, 31-04, 31-06, 31-11, 31-12, 31-13 | AST ban on conditional/caught assertions and modifier calls; claim matches mechanism | ✗ BLOCKED | Round-3's spellings closed and re-verified; three further shape-resolution evasions (CR-09 x2, CR-10) independently reproduced |

No orphaned requirements: every requirement ID declared across the fifteen plans' `requirements:`
frontmatter (UATX-01 through UATX-06) is accounted for above, and `.planning/REQUIREMENTS.md` maps no
additional Phase 31 requirement ID beyond these six. `.planning/REQUIREMENTS.md` still lists all six as
unchecked (`- [ ]`) and the traceability table still reads "Gaps Found" for all six — correctly unmoved,
since this report also finds `gaps_found`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/runnable-ref/uat-spec-integrity.ts` | ~175, ~235-237 (`BANNED_EXACT_PATHS`, `BANNED_CONFIGURED_PATHS`) | Compared against a marker-carrying resolved path with no marker-stripping for the whole-path arms | 🛑 Blocker | CR-09: `expect.configure({retries:2}).soft(...)` and `.configure({soft:true})(...)` (chained) bypass the soft-assertion ban undetected — the exact escape `BANNED_EXACT_PATHS: ["expect.soft"]` exists to refuse |
| `scripts/runnable-ref/uat-spec-integrity.ts` | `BANNED_MODIFIER_HEADS` (no `testInfo` member; no fixture-parameter canonicalisation) | Positional binding decidable from the parse alone is left undecided, disclosed only inside a test-file comment | 🛑 Blocker | CR-10: `testInfo.skip()`/`.fail()`/`.fixme()` — the primary documented spelling of the modifiers D-18(1) was convened to decide — bypasses the ban undetected |
| `scripts/context-io.ts` | ~1369-1486 (`promoteAdmitted`) | No read of the destination before write; proof operand read from an unconstrained caller-supplied `from` | 🛑 Blocker | CR-11: a legitimately admitted note in the shared verified context can be silently destroyed and replaced by a forged claim, with no exception and no diagnostic |
| `scripts/context-io.ts` | ~2619-2640 (`projectRootFromWorkingDirectory`) | Upward walk's only stop conditions are a config, a `.git` marker, the filesystem root, or a step bound — never `os.homedir()`, contradicting the function's own docstring and Workflow 16's prose | ⚠️ Warning | WR-21: with no `.git` on the path, a home-directory-shaped ancestor's configuration is adopted as the trusted root — exactly the shape of ancestor the shipped shared-install model (`~/.grugops`) puts there |
| `scripts/context-io.ts` | ~1400-1414 (`promoteAdmitted`'s governance read) | Reads only whether the config is readable, never its `human_admission` value | ⚠️ Warning | WR-18: a `human:NAME` stamp is carried forward under a dial (`off`, absent) that would refuse the identical disposition on `admitAndAppend`'s own W3 arm |
| `scripts/runnable-ref/uat-spec-integrity.ts` | `calleeDottedPath`, the 512-step guard | Guard restarts fresh on every recursive descent rather than sharing one budget | ⚠️ Warning | WR-19: a sufficiently long call-link chain triggers an uncaught `RangeError` rather than the documented "yields no path" residual behavior; bypasses the vacuity/denominator diagnostic |
| `scripts/runnable-ref/uat-spec-integrity.ts` | `canonicaliseHeadSegment` | Rewrites a resolved head through the import-rename map with no scope analysis | ⚠️ Warning | WR-20: a legitimate spec with an unrelated local binding that happens to share a renamed import's local name is falsely refused, with a misleading message naming a construct absent from the file |
| `agent-factory/checklists/browser-uat-recipe.md` | boundary list / completeness paragraph | Does not disclose the marker-defeats-whole-path-arms boundary or the testInfo fixture-parameter spelling | ⚠️ Warning | Same undisclosed-boundary defect as the CR-09/CR-10 blockers, one level up in the documentation the recipe's own header says must match the mechanism |

No unreferenced `TBD`/`FIXME`/`XXX` debt markers were found in any source file changed since round 3
(`git diff --name-only f46d9b5..HEAD`, re-checked in this session).

### Human Verification Required

4 items, all pre-existing `UNKNOWN - verify` / manual-only items already recorded in `31-VALIDATION.md`
and not attempted by this round — none newly discovered by this verification, carried forward unchanged
through rounds 2, 3 and 4 (the attended Chrome lane's real interactive behavior, the
`claude auth status --json` predicate under API-key/long-lived-token auth, the Windows leg of every
browser probe, and the installer/uninstaller round-trip on a pre-existing host install).

### Gaps Summary

Two 🛑 Blockers, both independently re-reproduced in this verification session against the committed
`.js` (not taken on `31-REVIEW.md`'s word) — plus two Warnings (WR-19, WR-21) worth flagging prominently
even though they do not independently block:

1. **UATX-06 fails a fourth time, at a further shape-resolution register (CR-09, CR-09's second
   variant, CR-10).** `31-13` correctly decided the call-link and import-rename shapes round 3
   reproduced, and every one of those spellings is now refused — independently re-verified. But the
   fix reasoned about the `()` routing marker for only one of the ban's three arms (the head/tail
   arm); the two whole-path arms (`BANNED_EXACT_PATHS`, `BANNED_CONFIGURED_PATHS`) compare the
   marker-carrying path directly, so `expect.configure({retries:2}).soft(...)` and
   `.configure({soft:true})(...)` — CHAINED, where round 3's un-chained control could not see them —
   walk past undetected. Separately, `testInfo`'s fixture-parameter spelling — Playwright's PRIMARY
   documented form of exactly the modifiers D-18(1) decided in their `test.info()` form — was
   dispositioned only inside a test-file comment whose stated reason is the identical excuse WR-14's
   own closure proved false one shape earlier. This is the fourth recurrence inside Phase 31 of "a
   predicate closed at the exact coordinates a verifier measured, reappearing one register over."

2. **UATX-01 fails on a NEW defect, in the mechanism 31-14 built to close round 3's CR-08 (CR-11).**
   `promoteAdmitted` correctly lets a legitimately human-disposed note promote unchanged — independently
   re-verified — but it never checks what already exists at the destination before writing, and its
   "proof" is compared against bytes read from an unconstrained, caller-named `from` directory rather
   than a location the module has independent reason to trust. Reproduced live: a real `observation`
   admitted into a shared destination context is silently overwritten, under the same id, by a forged
   `finding` carrying a fabricated `human:mallory` stamp — with no exception, no diagnostic, and no
   admission check reached at all. This is squarely the class UATX-01 exists to forbid (a self-supplied
   claim becoming indistinguishable from genuine evidence), now reached through the newest writer this
   phase's own gap-closure round introduced.

**WR-21** (the new governance-root walk can reach a home-directory-shaped ancestor) independently
reproduces: with no `.git` anywhere on a 3-level-deep path, `trustedRepoRoot()` adopted a planted
ancestor's `.grugops/factory.config.json`, contradicting the function's own docstring and Workflow 16's
prose. Under the shipped shared-install model (`~/.grugops` kit), this is exactly the shape of ancestor
the walk is documented as unable to reach. **WR-19** (an uncaught `RangeError` on a pathological callee
chain) independently reproduces: the exit code stays inside `{0,1,2}` only by Node's coincidental
uncaught-exception default, and no `visited/expected` diagnostic line is printed at all — the vacuity and
denominator floors are bypassed by construction on that path.

The full excluded-e2e suite is green (62/62 files, 3566/3568 tests, 2 pre-existing skips, re-run in this
session after cleaning up this verification's own probe artifacts) and exercises NONE of the six new
defects found this round — this project's standing doctrine that a green suite is not proof for a safety
predicate holds for the FOURTH consecutive verification round on this phase.

**Progress since round 3 is real and should not be discounted.** All four of round 3's closures
(CR-07/WR-14's exact spellings, CR-08, CR-05 staying closed, WR-15) are independently re-verified intact
in this session. The defects that remain are each one register past what the prior round's fix decided —
consistent with this repository's own documented pattern for these two predicate families across all four
rounds of this phase — rather than a reappearance of an exact previously-reported case.

**This looks like it needs a fifth gap-closure round, not an override.** Both blockers are the same
structural pattern this project's own doctrine treats as blocking: "ask how a gate is REACHED, not only
what it refuses" (CR-11 — a write route reaches a chokepoint that was never asked whether the destination
already holds evidence) and "derive BOTH axes of a predicate, not just the one that moved" (CR-09/CR-10 —
the whole-path arms' marker-awareness and the TestInfo-binding membership are each a distinct axis from
the one 31-13 derived and closed). No override is suggested; the fixes named in each `gaps:` entry's
`missing:` list are structural fixes of the same shape that closed the prior three rounds' findings,
applied to the two axes this round's plans did not touch.

---

_Verified: 2026-09-09T01:10:00Z_
_Verifier: Claude (gsd-verifier)_

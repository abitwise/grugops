---
phase: 31-autonomous-manual-testing
verified: 2026-09-08T14:45:00Z
status: gaps_found
score: 4/6 must-haves verified
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
  - ".planning/phases/31-autonomous-manual-testing/31-CONTEXT.md"
  - ".planning/phases/31-autonomous-manual-testing/31-REVIEW.md"
  - ".planning/phases/31-autonomous-manual-testing/31-VALIDATION.md"
  - ".planning/phases/31-autonomous-manual-testing/31-VERIFICATION.md"
  - "agent-factory/checklists/00-index.md"
  - "agent-factory/checklists/browser-uat-recipe.md"
  - "agent-factory/contracts/context-note.md"
  - "agent-factory/workflows/05-pr-quality-gate.md"
  - "agent-factory/workflows/06-uat-pack.md"
  - "agent-factory/workflows/17-task-claim.md"
  - "agent-factory/workflows/18-context-compaction.md"
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
  - "scripts/chrome-lane-bar.test.ts"
  - "scripts/context-io-writer-set.test.ts"
  - "scripts/context-io.js"
  - "scripts/context-io.test.ts"
  - "scripts/context-io.ts"
  - "scripts/runnable-ref/fixtures/caught-assertion.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/clean.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/conditional-assertion.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/element-access-modifier.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/modifier-call.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/playwright-test.d.ts"
  - "scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts"
  - "scripts/runnable-ref/uat-spec-integrity.js"
  - "scripts/runnable-ref/uat-spec-integrity.test.ts"
  - "scripts/runnable-ref/uat-spec-integrity.ts"
  - "tsconfig.fixtures.json"
  - "tsconfig.tests.json"
covered_digest: "v1:sha256:0b6023d4e2132c41ea8b8c548667688cdc97a40f316347b8034a0c0171662e58"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/6
  gaps_closed:
    - "gap 1 (31-VERIFICATION.md round 1): an artifact-ref whose sha is not the HEAD the named gate run was performed at is refused, and nothing is written — closed by 31-05, independently re-reproduced in this round (appendNote on an artifact-ref THREW, 0 files written)."
    - "gap 2 (31-VERIFICATION.md round 1): the exact three constructs the round-1 verifier planted (test.describe.only, test.describe.skip, test[\"skip\"]) are now refused — closed by 31-06, independently re-reproduced (3 findings, exit 1, same repo/spec)."
    - "gap 3 (31-VERIFICATION.md round 1): guardPlaywrightMcpPin's authority read now carries a concrete-version shape assertion — closed by 31-07, independently re-reproduced (a fully-floated mirror now exits 1 naming the authority's file/line/token, where it previously exited 0 with a clean pass)."
  gaps_remaining:
    - "CR-05 (31-REVIEW.md, gap-closure round): appendNote() reaches the admission authority for kind === \"artifact-ref\" only. A finding note carrying a fabricated §14-gate stamp is still written unrefused and rendered into index.md as verified evidence — the same reachability defect as gap 1, one kind over, and it lands on UATX-01's central claim (narration never produces a stamp)."
    - "CR-06 (31-REVIEW.md, gap-closure round): BANNED_CONSTRUCTS is a nine-member literal. test.describe.serial.only and test.describe.parallel.only — real Playwright spellings that narrow an entire gate run exactly as test.describe.only does — walk past it undetected. Same defect class as gap 2, one segment over, and it lands on UATX-06's claim that the mechanism matches what it claims to ban."
  regressions: []
gaps:
  - truth: "UATX-01 / phase goal — the only thing that counts as evidence is an artifact the §14 gate re-runs; an agent's narration or self-supplied claim never produces a stamp."
    status: failed
    reason: >
      31-05 correctly routed appendNote's artifact-ref kind through admit(), closing gap 1 at its
      own coordinates. But admit() decides four refusal families (D-01 finding-stamp, D-03
      artifact-ref binding, D-04 governance disposition, D-14 unreadable config), and the new branch
      in appendNote is scoped to `normalizeKind(note.kind) === "artifact-ref"` only. D-01 — the
      refusal that a `finding` stamped `§14-gate#<id>` is admitted only against a live green verdict
      with that per-run id — remains unreachable from appendNote, the writer both 17-task-claim.md
      and 18-context-compaction.md name by name. Independently reproduced live in this verification:
      `appendNote(task, { kind: "finding", by: "qe-e2e", verified_by: "§14-gate#fabricated-run-id",
      confidence: "high", ... }, body, contextRoot)` against the committed scripts/context-io.js
      returned a written note id with no refusal, while the identical note passed to
      `admitAndAppend` returned `admission FAIL: no live green §14-gate verdict found for
      "§14-gate#fabricated-run-id"`. `render(task, contextRoot)` then rendered the fabricated note
      into index.md as a normal row — `| 2026-09-08T01:00:00Z | finding | qe-e2e | high |
      §14-gate#fabricated-run-id | the checkout flow passes end to end |` — indistinguishable from a
      genuinely admitted finding. This is the phase's central goal failing on the sibling kind gap 1
      was closed for: a self-supplied claim entering the shared context wearing the shape of gate
      evidence.
    artifacts:
      - path: "scripts/context-io.ts"
        issue: "appendNote() (~line 1095-1105) gates its admit() call on note.kind === \"artifact-ref\" only; the D-01 finding-stamp refusal inside the same admit() is unreachable from this writer for any other kind, including \"finding\", the kind the shared context exists to protect."
      - path: "agent-factory/workflows/17-task-claim.md"
        issue: "Step 4 (~line 40) still names appendNote as the sanctioned writer without qualifying that a finding's §14-gate stamp is not checked there."
      - path: "agent-factory/workflows/18-context-compaction.md"
        issue: "Step 4 (~line 51) claims \"Phase-21 admission still fires on every promoted note\", which is false for a promoted finding — only the separate, agent-run re-verify in step 5 checks it, and the writer itself does not."
    missing:
      - "Ask the authority for every kind it has an opinion about and derive that set, rather than naming one kind by string comparison — e.g. call admit() unconditionally from appendNote (accounting for admitAndAppend's gated branch, which deliberately skips admit() for a hook-disposed high-severity finding), or derive the kind list admit() adjudicates from its own source and assert its cardinality."
      - "Extend scripts/context-io-writer-set.test.ts's exercise table from one refusal-family question (\"refuses the fabricated artifact-ref\") to one per refusal family admit() implements (D-01, D-03, D-04, D-14), so a writer that reaches only one family cannot read as closed."
      - "Correct workflow 18 step 4's \"admission still fires on every promoted note\" sentence and the provides-line overclaim in 31-05-SUMMARY.md (\"the appendNote bypass is closed\" is true only for artifact-ref)."
  - truth: "UATX-06 — conditional or caught assertions, and the D-14 arm-(c) modifier-call bans, are rejected over the TypeScript AST, and the recipe's claim matches exactly what the checker decides."
    status: failed
    reason: >
      31-06 correctly widened the callee matcher to a dotted-path normaliser and closed gap 2 for
      the three constructs the round-1 verifier planted (test.describe.only, test.describe.skip,
      test["skip"]) — independently re-reproduced in this verification (3 findings, exit 1, same
      probe repository and spec). But BANNED_CONSTRUCTS is compared by
      `BANNED_CONSTRUCTS.includes(dottedPath)` against a nine-member literal, and Playwright
      documents more `describe` modifiers than the three that were added.
      `test.describe.serial.only(...)` and `test.describe.parallel.only(...)` narrow an entire gate
      run to one describe block — the exact "a green lane would certify a scenario nobody exercised"
      outcome the finding text names — and neither is in the set nor in
      UNRESOLVABLE_CALLEE_RESIDUALS (the disclosed-boundary list). Independently reproduced live in
      this verification: a spec containing `test.describe.serial.only("evasion-serial", ...)` and
      `test.describe.parallel.only("evasion-parallel", ...)` run through the committed
      scripts/runnable-ref/uat-spec-integrity.js reported `0 findings over 1/1 uat specs checked`,
      exit 0 — the same defect shape as gap 2, one segment over. A control spec containing only
      `test.describe.only` on the same harness correctly reports 1 finding, exit 1, confirming the
      matcher itself is sound and the gap is in set membership, not shape resolution.
    artifacts:
      - path: "scripts/runnable-ref/uat-spec-integrity.ts"
        issue: "BANNED_CONSTRUCTS (~line 87-96) is a nine-member frozen string literal compared by exact membership; test.describe.serial.only and test.describe.parallel.only are real Playwright spellings that pass calleeDottedPath's normaliser intact but are absent from the set and from UNRESOLVABLE_CALLEE_RESIDUALS."
      - path: "agent-factory/checklists/browser-uat-recipe.md"
        issue: "The re-quoted ban set (~line 164-165) and the \"deliberately outside the set\" residual list (~line 168-176) both omit test.describe.serial.only/parallel.only, so the recipe's claim is incomplete in the same place the mechanism is."
    missing:
      - "Decide the membership question by rule over the normalised path (e.g. a banned HEAD set {test, describe} paired with a banned TAIL set {skip, only, fixme}, expect.soft kept as an explicit exact-path exception) rather than by an enumerable literal, so a new intermediate segment (serial, parallel, or any future Playwright modifier) needs no new member."
      - "Add a case asserting test.describe.serial.only and test.describe.parallel.only are refused; re-quote the corrected set in browser-uat-recipe.md; record the widening as a decision per the file's own header rule (\"a NEW DECISION and a gap-closure round, never a quiet edit here\")."
      - "Add the reverse cross-check WR-13 names: every skip/only/fixme-shaped member reachable on the declared @playwright/test surface (playwright-test.d.ts) must be in BANNED_CONSTRUCTS or named as a residual, asserted by partition cardinality rather than by one-directional membership."
deferred: []
advisory: []
behavior_unverified_items: []
human_verification:
  - test: "The attended Claude-in-Chrome lane opens under real interactive auth, pauses for a human on a login/challenge page, and produces only a human-stamped finding + artifact-ref (never a gate stamp)."
    expected: "The lane behaves as documented in agent-factory/checklists/browser-uat-recipe.md §attended lane; no route to a §14-gate stamp is exercised in practice."
    why_human: "Requires an attended Claude Code session with the Claude-in-Chrome browser extension installed and a real interactive login; not reachable in CI and not reachable on this box (extension not connected). Recorded in 31-VALIDATION.md as a Manual-Only Verification and carried forward unchanged by 31-08 (R-01)."
  - test: "The claude auth status --json fail-closed predicate (D-10) behaves correctly under an API-key-only box and under a long-lived setup token."
    expected: "Both configurations are a loud skip naming the failing clause, never a silent open."
    why_human: "Research assumptions A2/A3 are UNKNOWN - verify; neither configuration is reachable without destroying this box's real credentials, per 31-VALIDATION.md. Not attempted by 31-08 (R-02)."
  - test: "Both browser-absence probe stages, and the whole spec-integrity runnable, on a Windows host."
    expected: "Exit 2 with the browser-absent marker when browsers are missing; parser-absent marker when typescript cannot be resolved."
    why_human: "UNKNOWN - verify per the standing Windows posture (WINDOWS.md); not testable on darwin. Not attempted by 31-08 (R-03)."
  - test: "A host repository that installed grugops before this release re-runs the installer and picks up tools/grugops/uat-spec-integrity.js; the uninstaller removes it."
    expected: "The new runnable is materialized on re-install and cleanly removed on uninstall."
    why_human: "Requires a second scratch repository with a prior grugops install at an earlier release; not exercised by the unit suite. Not attempted by 31-08 (R-04)."
---

# Phase 31: Autonomous Manual Testing Verification Report

**Phase Goal:** An agent can drive a real browser to produce UAT evidence, and the only thing that
counts as evidence is an artifact the §14 gate re-runs — never the agent's narration of what it saw.
**Verified:** 2026-09-08T14:45:00Z
**Status:** gaps_found
**Re-verification:** Yes — second round, after gap-closure plans 31-05..31-08 closed the three
blockers from round 1's `31-VERIFICATION.md` (score 3/6). A code review of the gap-closure round
(`31-REVIEW.md`, committed at `41a2154`) found two NEW Criticals, CR-05 and CR-06, on the exact same
predicates one register over. Both are independently re-reproduced below against the committed `.js`
rather than accepted from the review's word.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | UATX-01 — a committed Playwright spec, re-run by the §14 gate, is the machine-verifiable evidence floor; an agent's narration/self-supplied claim never produces a stamp | ✗ FAILED — see gap 1 (CR-05) | Gap 1's original defect (artifact-ref) is closed and re-reproduced (see row 4). But a `finding` bearing a fabricated `§14-gate#<id>` stamp is still written through `appendNote` with no refusal and rendered into `index.md` as a normal, indistinguishable-from-verified row. Independently reproduced live in this verification. |
| 2 | UATX-02 — browser MCP tooling documented and pinned for all five host CLIs; `package.json` gains nothing; the pin authority cannot itself be defeated by a floating specifier | ✓ VERIFIED | Recipe unchanged from round 1 (5 host CLIs, `@playwright/mcp@0.0.78`, `package.json` untouched). The round-1 gap 3 (pin authority) is closed: a fully-floated mirror (every mention, including the authority's own, rewritten to `@playwright/mcp@latest`) reproduced live in this verification exits 1, naming the authority's file, line and rejected token, where the round-1 guard exited 0 with a clean `0 findings over 7/7` pass. |
| 3 | UATX-03 — Claude in Chrome is attended-only and structurally barred from producing a `§14-gate` stamp | ✓ VERIFIED | `scripts/chrome-lane-bar.test.ts` unchanged this round, part of the current green 62-file/3318-test suite; not contested by the review or by this verification. |
| 4 | UATX-04 — evidence carries commit SHA + gate-run id + content hash; a note whose SHA is not the HEAD the gate ran against is refused | ✓ VERIFIED | Gap 1 closed and independently re-reproduced: `appendNote(task, { kind: "artifact-ref", gate_run: "no-such-gate-run-ever-existed", sha: <hex>, content_hash: <hex> }, ...)` against the committed `scripts/context-io.js` now THROWS `admission FAIL: no live green §14-gate verdict found for "§14-gate#no-such-gate-run-ever-existed" ...`, and the notes directory gains **0** files (previously wrote 1). The legitimate bound path was not independently re-tested here but is covered by `scripts/context-io.test.ts`'s green suite. |
| 5 | UATX-05 — an absent/unusable browser produces a loud skip leaving the UAT `pending`, never a silent pass | ✓ VERIFIED | Unchanged this round; `PARSER_ABSENT_MARKER` / `BROWSER_ABSENT_MARKER` each single-emission, exit 2, exercised by `scripts/runnable-ref/uat-spec-integrity.test.ts`; not contested. |
| 6 | UATX-06 — conditional or caught assertions in generated specs, and the D-14 arm-(c) modifier bans, are rejected over the TypeScript AST, and the recipe's claim matches exactly what the checker decides | ✗ FAILED — see gap 2 (CR-06) | Gap 2's original defect (the three planted constructs) is closed and re-reproduced (see row 2). But `test.describe.serial.only` and `test.describe.parallel.only` — real Playwright spellings that narrow an entire gate run the same way `test.describe.only` does — walk past the nine-member `BANNED_CONSTRUCTS` set undetected. Independently reproduced live in this verification: `0 findings over 1/1 uat specs checked`, exit 0, on the same harness that correctly refuses `test.describe.only` alone. |

**Score:** 4/6 roadmap Success Criteria fully verified (UATX-02, UATX-03, UATX-04, UATX-05); UATX-01
and UATX-06 fail on the same defect class as round 1 — a predicate closed at the exact coordinates a
verifier measured, reappearing one register over (a sibling kind for UATX-01, a sibling spelling for
UATX-06).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/context-io.ts` / `.js` | `appendNote` routes every kind `admit()` has an opinion about through the single authority | ⚠️ PRESENT BUT INCOMPLETE | The `artifact-ref` branch (D-03) is correct and reachable; the sibling `finding` branch (D-01) is not reached from `appendNote` at all (CR-05). |
| `scripts/context-io-writer-set.test.ts` | Every writer exercised against every refusal family `admit()` implements | ⚠️ PRESENT BUT INCOMPLETE | The writer set is correctly derived by AST and counted (4 writers), but the exercise table asks only "refuses the fabricated artifact-ref" — one refusal family out of four `admit()` implements (D-01/D-03/D-04/D-14). |
| `agent-factory/workflows/17-task-claim.md`, `18-context-compaction.md` | Prose states what the mechanism does for every kind | ⚠️ PRESENT BUT INCOMPLETE | Both name the corrected artifact-ref path; workflow 18 step 4 additionally claims admission "fires on every promoted note", which is false for a promoted finding (WR-11). |
| `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` / `.test.ts` | AST ban over the real Playwright modifier-call surface | ⚠️ PRESENT BUT INCOMPLETE | `calleeDottedPath` correctly resolves any callee shape to a dotted path; `BANNED_CONSTRUCTS` under-decides which resolved paths are banned (CR-06). |
| `scripts/runnable-ref/fixtures/playwright-test.d.ts`, `tsconfig.fixtures.json` | A declared, type-checked Playwright surface the ban set can be cross-checked against | ✓ VERIFIED (as far as it goes) | Proves every banned spelling is real; does not (yet) prove every real modifier is banned — a one-directional check (WR-13), which is why CR-06 was not caught by the shipped suite. |
| `agent-factory/checklists/browser-uat-recipe.md` | Ban set and pin quoted from, and equal to, the exported constants | ✓ VERIFIED (quotes agree with the code, both incomplete in the same place) | The recipe's ban-set region and `BANNED_CONSTRUCTS` are asserted equal by a test — but both are incomplete against real Playwright syntax in the same way (CR-06), so agreement here does not mean correctness. |
| `scripts/check-foundation-guards.ts` — `guardPlaywrightMcpPin` | Fail-closed pin assertion, cannot be defeated by a floating authority | ✓ VERIFIED | `PIN_CONCRETE_VERSION_RE` refuses a non-concrete authority token; independently reproduced against a fully-floated mirror (exit 1, correct diagnosis). |
| `scripts/chrome-lane-bar.test.ts` | Derived one-author-set + no-route-in-documented-lane, both watched-fail | ✓ VERIFIED | Unchanged, green, not contested. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `appendNote()` (kind `artifact-ref`) | `admit()`'s D-03 branch | the link round-1 gap 1 recorded as `expected but absent` | ✓ WIRED | Closed by 31-05; independently reproduced. |
| `appendNote()` (kind `finding`) | `admit()`'s D-01 branch | the sibling link the review found still absent | ✗ NOT WIRED | CR-05: a `finding` stamped `§14-gate#<id>` is composed and written by `appendNote` with no call into `admit()` at all; only `admitAndAppend` (a route the sanctioned-writer workflows do not name for this case) reaches it. |
| `BANNED_CONSTRUCTS` | `calleeDottedPath`'s resolved output | comparison by exact-string membership | ⚠️ PARTIAL | The shape resolution is correct and total; the membership set is an incomplete enumeration (CR-06) rather than a rule, so a real, gate-narrowing Playwright construct (`test.describe.serial.only`) resolves correctly and is still not banned. |
| recipe's pin literal | `guardPlaywrightMcpPin`'s authority read | a concrete-version shape assertion before adoption | ✓ WIRED | Closed by 31-07; independently reproduced against a fully-floated mirror. |

### Behavioral Spot-Checks

Round-1 commands preserved verbatim, with this round's independently-reproduced result recorded beside each. Two additional rows (4, 5) are this round's own reproductions of the review's new Criticals.

| # | Behavior | Command | Round-1 result (31-VERIFICATION.md) | This round's result (independently reproduced) | Status |
|---|----------|---------|--------------------------------------|--------------------------------------------------|--------|
| 1 | `appendNote()` writes a fabricated-provenance `artifact-ref` (no matching live verdict) | `node` script calling `appendNote("verify-repro-task", { kind: "artifact-ref", gate_run: "no-such-gate-run-ever-existed", sha: "deadbeef...", content_hash: "0"*64, ... }, ...)` against `scripts/context-io.js` | `appendNote WROTE id: 20260907T163748Z-qe-e2e-artifact-ref-1e163523` — no refusal | `appendNote THREW: context-io.appendNote: refusing to write an artifact-ref whose provenance the admission authority did not accept. Nothing was written: admission FAIL: no live green §14-gate verdict found for "§14-gate#no-such-gate-run-ever-existed" ...` — `files AFTER: 0` | ✓ PASS — gap 1 closed |
| 2 | `uat-spec-integrity.js` over a spec using `test.describe.only`, `test.describe.skip`, `test["skip"]` | `node scripts/runnable-ref/uat-spec-integrity.js <tmp-repo-with-typescript-resolvable>` | `UAT spec integrity: 0 findings over 1/1 uat specs checked`, `EXIT=0` | `UAT spec integrity: 1 finding(s) over 1/1 uat specs checked` per construct when isolated; run with the same three-construct spec, one finding per construct, `EXIT=1` | ✓ PASS — gap 2 closed for the planted constructs |
| 3 | `guardPlaywrightMcpPin`'s authority read | Code inspection: `scripts/check-foundation-guards.ts` authority-adoption region; behavioral run against a fully-floated mirror | No concrete-version assertion present | `PIN_CONCRETE_VERSION_RE` present at the authority branch; a mirror with every mention (including the authority's) rewritten to `@playwright/mcp@latest` now exits 1: `FAIL playwright MCP pin: the first pinned mention ... reads \`latest\`, which is not a concrete version — a floating specifier AT THE AUTHORITY ...` | ✓ PASS — gap 3 closed |
| 4 | **NEW this round (CR-05):** `appendNote()` writes a fabricated `§14-gate` stamp on a `finding` note (no matching live verdict) | `node` script calling `appendNote(task, { kind: "finding", by: "qe-e2e", verified_by: "§14-gate#fabricated-run-id", confidence: "high", ... }, body, contextRoot)` against `scripts/context-io.js`, then `render(task, contextRoot)` | n/a (round 1 did not test this kind) | `appendNote WROTE id: 20260908T010000Z-qe-e2e-finding-cdaf0eb1`, `files AFTER: 1` — no refusal. `admitAndAppend` on the identical note THROWS `admission FAIL: no live green §14-gate verdict found for "§14-gate#fabricated-run-id" ...`. `render()` then writes the fabricated note into `index.md` as an ordinary row: `\| 2026-09-08T01:00:00Z \| finding \| qe-e2e \| high \| §14-gate#fabricated-run-id \| the checkout flow passes end to end \|`. | ✗ FAIL (confirms CR-05) |
| 5 | **NEW this round (CR-06):** `uat-spec-integrity.js` over a spec using `test.describe.serial.only` and `test.describe.parallel.only` | `node scripts/runnable-ref/uat-spec-integrity.js <tmp-repo>` over a spec with both constructs; control spec with bare `test.describe.only` on the same harness | n/a (round 1 did not test these spellings) | Both-construct spec: `UAT spec integrity: 0 findings over 1/1 uat specs checked`, `EXIT=0`. Control (`test.describe.only` alone): `UAT spec integrity: 1 finding(s) over 1/1 uat specs checked`, `EXIT=1` — confirms the matcher is sound and the gap is set membership. | ✗ FAIL (confirms CR-06) |
| 6 | Full excluded-e2e regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 61 passed (61)`, `Tests 3264 passed \| 2 skipped (3266)` | `Test Files 62 passed (62)`, `Tests 3318 passed \| 2 skipped (3320)`, exit 0 | ✓ PASS (green, but rows 4-5 show it does not exercise either new gap — the project's "green suite is not proof for a safety predicate" doctrine holds again this round) |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| UATX-01 | 31-01, 31-04, 31-05 | Committed spec = evidence floor; narration never a stamp | ✗ BLOCKED | Artifact-ref binding closed (31-05); the `finding` sibling stamp is still self-suppliable through the sanctioned writer with no refusal, rendered as verified (CR-05) |
| UATX-02 | 31-03, 31-06, 31-07 | Browser MCP tooling documented + pinned, 5 hosts; pin authority cannot itself float | ✓ SATISFIED | Recipe complete; pin authority now shape-checked and independently reproduced closed |
| UATX-03 | 31-03, 31-04 | Attended Chrome lane structurally barred from gate stamp | ✓ SATISFIED | `chrome-lane-bar.test.ts` green and unchallenged |
| UATX-04 | 31-01, 31-05 | Evidence provenance (SHA/gate_run/content_hash); mismatched SHA refused | ✓ SATISFIED | The D-03 sha-versus-verdict binding is reachable from `appendNote` and independently reproduced refusing the round-1 fabricated call |
| UATX-05 | 31-02, 31-04 | Loud skip on absent/unusable browser, never a silent pass | ✓ SATISFIED | Both markers, single emission points, tested; unchanged this round |
| UATX-06 | 31-02, 31-04, 31-06 | AST ban on conditional/caught assertions and modifier calls; claim matches mechanism | ✗ BLOCKED | Arms (a)/(b) and the three planted arm-(c) spellings correct; `test.describe.serial.only`/`parallel.only` still bypass the ban set (CR-06) |

No orphaned requirements: every requirement ID declared across the eight plans' `requirements:`
frontmatter (UATX-01 through UATX-06) is accounted for above, and `.planning/REQUIREMENTS.md` maps
no additional Phase 31 requirement ID beyond these six. `.planning/REQUIREMENTS.md` still lists all
six as unchecked (`- [ ]`) and the traceability table still reads "Gaps Found" for all six — correctly
unmoved, since this report also finds `gaps_found`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/context-io.ts` | 1095-1105 (`appendNote`) | The single-authority call this round added is scoped to one kind (`artifact-ref`) out of the four `admit()` adjudicates | 🛑 Blocker | CR-05/gap 1 reappears one kind over — a `finding` bearing a fabricated `§14-gate` stamp is still writable through the documented sanctioned path |
| `scripts/runnable-ref/uat-spec-integrity.ts` | 87-96 (`BANNED_CONSTRUCTS`) | A widened but still-enumerable literal set, rather than a rule over the callee's resolved head/tail | 🛑 Blocker | CR-06/gap 2 reappears one segment over — `test.describe.serial.only`/`parallel.only` narrow evidence scope undetected |
| `scripts/context-io-writer-set.test.ts` | ~374 (exercise table) | Derives the writer SET by AST (correct) but asks every writer only ONE predicate question ("refuses the fabricated artifact-ref"), not one per refusal family `admit()` implements | ⚠️ Warning | The contract test that was built specifically to prevent this class of gap could not see CR-05, because it enumerated writers but not predicates |
| `agent-factory/workflows/18-context-compaction.md` | ~51 (step 4) | Retains "Phase-21 admission still fires on every promoted note" beside a new, narrower, accurate sentence about `artifact-ref` | ⚠️ Warning | False for a promoted `finding`; the two adjacent sentences disagree, and the reader most likely to be misled is the agent this workflow instructs (WR-11) |
| `scripts/context-io.ts` | 1026 (`appendNote`'s new `repoRoot` parameter) | Defaults to `ROOT` (the kit's own install root) rather than `trustedRepoRoot()`, re-introducing a caller-chosen governance-root seam a prior phase (30-11) deliberately removed from the `admit` CLI verb | ⚠️ Warning | Under the shared-install model (`~/.grugops` kit + per-repo state) with `CLAUDE_PROJECT_DIR` set, the writer's admission can resolve the governance dial against a different root than the hooks/CLI do (WR-10) — not independently re-measured in this verification, taken from 31-REVIEW.md's code inspection |
| `.planning/phases/31-autonomous-manual-testing/31-05-SUMMARY.md` | key-files `provides` line | "the D-03 authority is now reachable from every exported note writer" reads, in context, as closing the whole class of writer-bypass; it is true only for the `artifact-ref` predicate | ℹ️ Info | No-fabrication rule: a true-but-narrower claim read at face value overstates the closure, which is exactly how CR-05 escaped this round's own review-adjacent checks |

No unreferenced `TBD`/`FIXME`/`XXX` debt markers were found in any file this phase (round 1 or the
gap-closure round) modified — confirmed by a fresh grep across the full changed-file set in this
verification session; the one `XXXX` match in `scripts/context-io.test.ts` is a redacted example path
in a comment, not a debt marker.

### Human Verification Required

4 items, all pre-existing `UNKNOWN - verify` / manual-only items already recorded in
`31-VALIDATION.md` and explicitly not attempted by 31-08 — none newly discovered by this
verification, listed for completeness in the frontmatter `human_verification` block above (the
attended Chrome lane's real interactive behavior, the `claude auth status --json` predicate under
API-key/long-lived-token auth, the Windows leg of every browser probe, and the installer/uninstaller
round-trip on a pre-existing host install).

The one question `31-08-SUMMARY.md`'s closure brief leaves for a named human — *"Are the three gaps
closed well enough to return Phase 31 to verification, or is another adversarial round needed
first?"* — is not answered here, per this task's explicit instruction. This verification's own answer
to the underlying question (arrived at independently, by reproduction rather than by reading the
brief) is: the three original gaps are closed, and two new ones of the same shape were found by the
subsequent code review and are confirmed live in this report, so another adversarial round is needed.

### Gaps Summary

Two 🛑 Blockers, both independently re-reproduced in this verification session (not taken on
31-REVIEW.md's word), and both are the exact defect class the gap-closure round was convened to
close, reappearing one axis over:

1. **The finding-stamp refusal (D-01/UATX-01) has a live bypass, sibling to the closed D-03/UATX-04
   bypass.** `appendNote`'s new `admit()` call is gated on `note.kind === "artifact-ref"` (after
   `normalizeKind`). `admit()` itself also refuses a `finding` stamped `§14-gate#<id>` against no
   live green verdict (D-01) — but that refusal is reached only through `admitAndAppend`, not
   through `appendNote`, the writer both sanctioned-path workflows name. Reproduced live:
   `appendNote` wrote a `finding` naming `verified_by: "§14-gate#fabricated-run-id"` with no
   refusal, and `render()` printed it into `index.md` indistinguishable from a genuinely admitted
   finding. This is closer to the phase's core goal statement than gap 1 was — an agent's own claim
   about what it saw, wearing a gate stamp it never earned.

2. **The D-14 arm (c) ban set still does not match the full real Playwright modifier surface
   (UATX-06).** 31-06 correctly widened the matcher to resolve any callee shape to a dotted path and
   correctly added the three spellings the round-1 verifier had planted. But the membership set is a
   nine-item literal, and `test.describe.serial.only` / `test.describe.parallel.only` — real,
   gate-run-narrowing Playwright constructs — are not in it. Reproduced live: both constructs
   together produce `0 findings over 1/1 uat specs checked`, exit 0, while a control spec containing
   only `test.describe.only` on the identical harness correctly reports 1 finding, exit 1.

Both gaps were found by `31-REVIEW.md`'s code review of the gap-closure round and independently
re-reproduced end-to-end in this verification against the committed `.js`, not accepted from the
review's narration. The full excluded-e2e suite is green (62/62 files, 3318/3320 tests, 2 pre-existing
skips) and exercises neither gap — this project's standing doctrine that a green suite is not proof
for a safety predicate holds for the second consecutive verification round on this phase.

**Progress since round 1 is real and should not be discounted:** all three original blockers (the
artifact-ref sha binding, the three planted modifier spellings, and the pin-authority shape) are
closed and independently re-verified in this round. The remaining two gaps are narrower in scope than
the original three (one kind and two spellings, rather than an entire predicate or matcher being
unreachable), but they sit on the exact same two truths (UATX-01, UATX-06) and are the same failure
mode this repository has now paid for four times across this phase alone (gap 1 → CR-05; gap 2 →
CR-06): a fix that closes a predicate or a matcher exactly where the verifier measured it, and nowhere
else along the same family.

**This looks like it needs a third gap-closure round, not an override.** Both defects are the same
structural pattern the project's own doctrine (and `browser-uat-recipe.md`'s own header) treats as
blocking — "the claim matches the mechanism" is false in a place adjacent to where it was made true.
No override is suggested; the fixes indicated in each `gaps:` entry's `missing:` list (derive the
refusal-family set from `admit()` rather than naming one; decide ban-set membership by a head/tail
rule over the resolved path rather than by an enumerable literal) are structural fixes of the same
shape that closed the original three gaps, applied one level higher so a fourth reappearance is
harder to produce.

---

_Verified: 2026-09-08T14:45:00Z_
_Verifier: Claude (gsd-verifier)_

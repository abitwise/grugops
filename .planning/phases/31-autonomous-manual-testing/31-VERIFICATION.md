---
phase: 31-autonomous-manual-testing
verified: 2026-09-07T19:45:00Z
status: gaps_found
score: 3/6 must-haves verified
covered_files:
  - ".planning/REQUIREMENTS.md"
  - ".planning/phases/31-autonomous-manual-testing/31-01-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-01-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-02-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-02-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-03-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-03-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-04-PLAN.md"
  - ".planning/phases/31-autonomous-manual-testing/31-04-SUMMARY.md"
  - ".planning/phases/31-autonomous-manual-testing/31-CONTEXT.md"
  - ".planning/phases/31-autonomous-manual-testing/31-REVIEW.md"
  - ".planning/phases/31-autonomous-manual-testing/31-VALIDATION.md"
  - "agent-factory/checklists/00-index.md"
  - "agent-factory/checklists/browser-uat-recipe.md"
  - "agent-factory/contracts/context-note.md"
  - "agent-factory/workflows/05-pr-quality-gate.md"
  - "agent-factory/workflows/06-uat-pack.md"
  - "install/README.md"
  - "install/install.js"
  - "install/install.ts"
  - "install/uninstall.js"
  - "install/uninstall.ts"
  - "scripts/check-foundation-guards.js"
  - "scripts/check-foundation-guards.test.ts"
  - "scripts/check-foundation-guards.ts"
  - "scripts/chrome-lane-bar.test.ts"
  - "scripts/context-io.js"
  - "scripts/context-io.test.ts"
  - "scripts/context-io.ts"
  - "scripts/runnable-ref/fixtures/caught-assertion.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/clean.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/conditional-assertion.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/modifier-call.uat.spec.ts"
  - "scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts"
  - "scripts/runnable-ref/uat-spec-integrity.js"
  - "scripts/runnable-ref/uat-spec-integrity.test.ts"
  - "scripts/runnable-ref/uat-spec-integrity.ts"
covered_digest: "v1:sha256:206042241407e7452e53d311f355e3a815e67b7dfc88063d39ef5819652424be"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "An artifact-ref whose sha is not the HEAD the named gate run was performed at is refused, and nothing is written (UATX-04, D-03)."
    status: failed
    reason: >
      admit()'s D-03 branch performs the SHA-vs-verdict comparison correctly, but appendNote() — the
      function two shipped workflows (17-task-claim.md, 18-context-compaction.md) name BY NAME as
      the sanctioned write path — never calls admit() and never consults it. appendNote() only runs
      validate(), which checks that sha/gate_run/content_hash are present and hex-shaped, never that
      they correspond to a real, matching, live green verdict. Independently reproduced live in this
      verification: `appendNote("verify-repro-task", { kind: "artifact-ref", gate_run:
      "no-such-gate-run-ever-existed", sha: "deadbeef...", ... }, ...)` returned a written note id
      with no refusal. 31-01-SUMMARY.md's own disclosure of this route ("Neither is a silent pass —
      both fail closed") is contradicted by this measurement.
    artifacts:
      - path: "scripts/context-io.ts"
        issue: "appendNote() (~line 1020-1073) composes and writes an artifact-ref note after only validate() (shape/presence check); admit()'s D-03 cross-check (~line 1618-1680) is reachable only via admit()/admitAndAppend(), which appendNote() does not call."
    missing:
      - "One authority reachable from every writer: either have appendNote() call admit() for kind === \"artifact-ref\", or make appendNote() refuse that kind outright unless called with an internal admittedBy token that only admit-bearing paths mint."
      - "A contract test in scripts/context-io.test.ts asserting a stale-SHA / fabricated-gate-run artifact-ref is refused through every exported write entry point, derived from the module's exports rather than a hand-typed list."
      - "Update agent-factory/workflows/17-task-claim.md and 18-context-compaction.md to name the corrected sanctioned path once the fix lands."
  - truth: "The banned-construct set decided over the TypeScript AST is exactly D-14 arm (c) — test.skip, test.fixme, test.only, describe.skip, describe.only, expect.soft — and the claim in the recipe matches the mechanism the checker actually decides (UATX-06, D-14)."
    status: failed
    reason: >
      Arm (c)'s matcher requires the call's callee to be `PropertyAccessExpression(Identifier,
      member)` — a BARE `describe.only(...)`. `@playwright/test` exports no top-level `describe`; the
      only spelling Playwright supports is `test.describe.only(...)`, whose callee is
      `PropertyAccessExpression(PropertyAccessExpression(test, describe), only)` and never matches.
      The identical construct written as `test["skip"](...)` (ElementAccessExpression) is also never
      seen, because the matcher only accepts PropertyAccessExpression. Independently reproduced live
      in this verification: a spec containing `test.describe.only(...)`, `test.describe.skip(...)`,
      and `test["skip"](...)` was run through the committed
      `scripts/runnable-ref/uat-spec-integrity.js` and reported `0 findings over 1/1 uat specs
      checked`, exit 0 — narrowing the whole gate run to one describe block and skipping a whole
      block, undetected. The union fixture meant to prove arm (c) (`union-all-arms.uat.spec.ts`)
      imports a non-existent `describe` binding from `@playwright/test` and is invisible to
      typecheck because both tsconfig.json and tsconfig.tests.json exclude
      `scripts/runnable-ref/fixtures/**` — so the fixture corpus never proves discrimination against
      real Playwright syntax.
    artifacts:
      - path: "scripts/runnable-ref/uat-spec-integrity.ts"
        issue: "Arm (c)'s callee match (~line 487-503) only accepts PropertyAccessExpression(Identifier, member); test.describe.only/skip/fixme and any test[\"x\"]/describe[\"x\"] element-access spelling are never matched."
      - path: "scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts"
        issue: "Imports `describe` from \"@playwright/test\", a binding that package does not export; the fixture does not represent real Playwright code and is excluded from typecheck."
    missing:
      - "Match the callee as a dotted path (walk PropertyAccessExpression.expression chains) and express BANNED_CONSTRUCTS in the spelling Playwright actually uses: test.skip, test.fixme, test.only, test.describe.skip, test.describe.only, test.describe.fixme, expect.soft."
      - "Add ElementAccessExpression + string-literal-argument handling so test[\"skip\"](...) resolves to the same dotted path as test.skip(...)."
      - "Fix union-all-arms.uat.spec.ts to import only { test, expect } and use test.describe.only(...); add a corpus case that asserts the fixture's imports actually resolve against the real @playwright/test API."
      - "Re-quote the corrected set in agent-factory/checklists/browser-uat-recipe.md:165."
  - truth: "guard_playwright_mcp_pin asserts every @playwright/mcp@ mention across the kit and docs equals the ONE literal in the recipe, and cannot itself be defeated by a floating specifier (D-08, 31-03 must_have)."
    status: failed
    reason: >
      The guard reads its authority as `authority[0].version` — the first @playwright/mcp@ mention in
      browser-uat-recipe.md — with no check that the extracted string is a well-formed concrete
      version. If that first mention is itself `@playwright/mcp@latest`, `pin` becomes the string
      "latest", every other re-pinned mention in the kit compares equal to it, and the guard prints a
      clean 0-findings pass over a fully-floating kit — the exact failure the guard exists to
      prevent. Confirmed by direct code inspection (scripts/check-foundation-guards.ts:3838-3855: `const
      pin = first.version;` with no format assertion). The guard's own PIN_OCCURRENCE_SOURCE comment
      and 31-03-SUMMARY.md both assert "a floating specifier is a finding, not something the pattern
      quietly declines to see" — true only for a non-authority mention; no test in
      check-foundation-guards.test.ts makes the authority itself float, so the overclaim is
      unverified by the suite that exists.
    artifacts:
      - path: "scripts/check-foundation-guards.ts"
        issue: "guardPlaywrightMcpPin (~line 3838-3855) accepts `first.version` as the pin authority with no shape check; a dist-tag like \"latest\" is accepted as a valid pin."
    missing:
      - "Add a concrete-version shape assertion on the authority (e.g. /^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$/) that fails when the first mention is a floating specifier such as latest/next/beta."
      - "A test case where the recipe's first mention floats and every other mention is re-pinned to match it, asserting the run is non-zero."
      - "Correct the PIN_OCCURRENCE_SOURCE comment and 31-03-SUMMARY.md:233's overclaim."
deferred: []
advisory: []
human_verification:
  - test: "The attended Claude-in-Chrome lane opens under real interactive auth, pauses for a human on a login/challenge page, and produces only a human-stamped finding + artifact-ref (never a gate stamp)."
    expected: "The lane behaves as documented in agent-factory/checklists/browser-uat-recipe.md §attended lane; no route to a §14-gate stamp is exercised in practice."
    why_human: "Requires an attended Claude Code session with the Claude-in-Chrome browser extension installed and a real interactive login; not reachable in CI and not reachable on this box (extension not connected). 31-VALIDATION.md already records this as a Manual-Only Verification."
  - test: "The claude auth status --json fail-closed predicate (D-10) behaves correctly under an API-key-only box and under a long-lived setup token."
    expected: "Both configurations are a loud skip naming the failing clause, never a silent open."
    why_human: "Research assumptions A2/A3 are UNKNOWN - verify; neither configuration is reachable without destroying this box's real credentials, per 31-VALIDATION.md."
  - test: "Both browser-absence probe stages, and the whole spec-integrity runnable, on a Windows host."
    expected: "Exit 2 with the browser-absent marker when browsers are missing; parser-absent marker when typescript cannot be resolved."
    why_human: "UNKNOWN - verify per the standing Windows posture (WINDOWS.md); not testable on darwin."
  - test: "A host repository that installed grugops before this release re-runs the installer and picks up tools/grugops/uat-spec-integrity.js; the uninstaller removes it."
    expected: "The new runnable is materialized on re-install and cleanly removed on uninstall."
    why_human: "Requires a second scratch repository with a prior grugops install at an earlier release; not exercised by the unit suite."
---

# Phase 31: Autonomous Manual Testing Verification Report

**Phase Goal:** An agent can drive a real browser to produce UAT evidence, and the only thing that
counts as evidence is an artifact the §14 gate re-runs — never the agent's narration of what it saw.
**Verified:** 2026-09-07T19:45:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification (a code review, 31-REVIEW.md, ran immediately before
this verification and reproduced the same defects; each was independently re-reproduced below rather
than taken on the review's word).

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | UATX-01 — a committed Playwright spec, re-run by the §14 gate, is the machine-verifiable evidence floor; an agent's narration/MCP transcript never produces a stamp | ⚠️ PARTIAL — see gap 1 | The `by: §14-gate` impersonation refusal lives in `validate()` (shared by every writer) and holds; the AST-checked spec is real. But the artifact-ref binding meant to tie evidence to a specific gate run can be written with a fabricated `gate_run`/`sha` through the documented sanctioned writer (gap 1), which is a route for an agent's own unverified claim to enter the context looking like bound evidence. |
| 2 | UATX-02 — browser MCP tooling documented and pinned for all five host CLIs; `package.json` gains nothing | ✓ VERIFIED | `agent-factory/checklists/browser-uat-recipe.md` names all five host CLIs with `@playwright/mcp@0.0.78`; `grep -c '@playwright/mcp@' browser-uat-recipe.md` ≥ 5; `git diff` shows no `package.json` change across the phase. |
| 3 | UATX-03 — Claude in Chrome is attended-only and structurally barred from producing a `§14-gate` stamp | ✓ VERIFIED | `scripts/chrome-lane-bar.test.ts` derives the one-file author set (`scripts/context-io.ts`) and the two-region no-route check, both watched-fail per its own tests; part of the current green 61-file/3264-test suite. No defect against this bar was found by the review or by this verification. |
| 4 | UATX-04 — evidence carries commit SHA + gate-run id + content hash; a note whose SHA is not the HEAD the gate ran against is refused | ✗ FAILED | Gap 1 below. Reproduced live: `appendNote()` wrote an `artifact-ref` note naming a nonexistent `gate_run` and an arbitrary `sha` with no refusal. |
| 5 | UATX-05 — an absent/unusable browser produces a loud skip leaving the UAT `pending`, never a silent pass | ✓ VERIFIED | `PARSER_ABSENT_MARKER` / `BROWSER_ABSENT_MARKER` each have a single emission point and exit 2; `scripts/runnable-ref/uat-spec-integrity.test.ts` exercises both through injectable probes; not contested by the review or by this verification's checks. |
| 6 | UATX-06 — conditional or caught assertions in generated specs are rejected over the TypeScript AST, and the recipe's claim matches exactly what the checker decides | ✗ FAILED | Gap 2 below. Arms (a)/(b) (caught and conditional assertions) are correctly decided over the AST and not contested. Arm (c) (the modifier-call bans) is unreachable for the real Playwright spellings `test.describe.only`/`test.describe.skip` and for any bracket-notation call (`test["skip"]`); reproduced live: a spec containing all three constructs reported `0 findings`, exit 0. |
| 7 | D-08 / 31-03 must_have — the pin guard cannot itself be defeated by a floating specifier | ✗ FAILED | Gap 3 below. `guardPlaywrightMcpPin` reads its authority as the first mention with no concrete-version shape check; confirmed by direct code read. |

**Score:** 3/6 roadmap Success Criteria fully verified (UATX-02, UATX-03, UATX-05); UATX-01, UATX-04,
UATX-06 fail on the artifact-ref binding bypass and the AST-ban coverage gap. One additional plan-level
must_have (the pin guard's self-resistance, D-08) also fails.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/context-io.ts` / `.js` | `emitVerdict` records SHA; `admit()` D-03 refusal; provenance fields on `artifact-ref` | ⚠️ PRESENT BUT INCOMPLETE | The mechanism exists and works when reached through `admit()`/`admitAndAppend()`, but is not reachable from `appendNote()`, the writer two shipped workflows document by name (gap 1). |
| `scripts/context-io.test.ts` | Regression + new SHA-binding cases | ✓ VERIFIED (exists, green) | Green, but has no case exercising a stale-SHA/fabricated-gate-run write through `appendNote()` directly — the exact path that bypasses D-03. |
| `agent-factory/contracts/context-note.md` | Three provenance fields documented, six-kind schema closed | ✓ VERIFIED | `content_hash` correctly disclosed as non-tamper-proof; six kinds still listed. |
| `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` / `.test.ts` | AST ban over D-14's three arms; loud skips; derived/vacuity-floored spec set | ⚠️ PRESENT BUT INCOMPLETE | Arms (a)/(b) and the loud skips/vacuity floors are correct and tested; arm (c) fails to match real Playwright syntax (gap 2). |
| `scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts` | Proves the union of all three arms is refused | ✗ NOT REPRESENTATIVE | Imports a non-existent `describe` binding; excluded from typecheck; does not exercise real Playwright syntax, so it cannot have caught gap 2. |
| `agent-factory/checklists/browser-uat-recipe.md` | Single home for pinned five-host setup, evidence provenance, ban set, loud skips, attended-lane rule | ✓ VERIFIED | All required sections present; `mcp@latest` count 0; `UNKNOWN - verify` present ≥2. |
| `agent-factory/checklists/00-index.md`, `install/README.md` | One index row, one pointer section | ✓ VERIFIED | `browser-uat-recipe.md` appears exactly once in `00-index.md`; `install/README.md` points at it. |
| `scripts/check-foundation-guards.ts` — `guardPlaywrightMcpPin` | Fail-closed pin assertion, reports scan | ✗ INCOMPLETE | Zero-occurrence and missing-authority cases fail correctly; the authority-floats case is unguarded (gap 3). |
| `agent-factory/workflows/05-pr-quality-gate.md`, `06-uat-pack.md` | Spec-integrity step wired before e2e; QE/E2E authoring step; acceptance-checkpoint statement | ✓ VERIFIED | Gate-order sentence and step list agree; verdict-emission line documents 5 positional slots; workflow 06 names `Ready to Release` and the unchanged `sign_off_acceptance` default. |
| `scripts/chrome-lane-bar.test.ts` | Derived one-author-set + no-route-in-documented-lane, both watched-fail | ✓ VERIFIED | Present, green, part of the passing suite; not contested. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `emitVerdict` | `emitTrusted` | single write tail for the reserved gate identity | ✓ WIRED | Unchanged single-author path; confirmed by `chrome-lane-bar.test.ts`'s derived one-file author set. |
| `appendNote()` | `admit()`'s D-03 branch | **expected but absent** | ✗ NOT WIRED | This is the core of gap 1: the documented sanctioned writer does not route through the admission authority for the predicate that binds evidence to a gate run. |
| `RUNNABLES` (`install.ts`) | `RUNNABLES_MIRROR` (`uninstall.ts`) | materialization pair for `uat-spec-integrity.js` | ✓ WIRED | Both files reference `tools/grugops/uat-spec-integrity.js` exactly once each. |
| `BANNED_CONSTRUCTS` | `browser-uat-recipe.md`'s ban-set prose | quoted from the single exported constant | ⚠️ PARTIAL | The prose quotes the set correctly, but the set itself under-decides arm (c) against real Playwright syntax (gap 2) — the claim and the mechanism agree with each other and both are wrong about what Playwright actually accepts. |
| recipe's pin literal | `guardPlaywrightMcpPin` | guard reads the literal rather than re-declaring it | ⚠️ PARTIAL | One home for the literal is honored, but nothing validates that the one home is well-formed (gap 3). |
| workflow 05's `emit-verdict` line | the CLI's 4/5-arity check | prose names the same slot count as the code | ✓ WIRED | Confirmed — five positional slots documented, matching the shipped arity check. |

### Behavioral Spot-Checks (independently reproduced in this verification, not taken from 31-REVIEW.md)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `appendNote()` writes a fabricated-provenance `artifact-ref` (no matching live verdict) | `node` script calling `appendNote("verify-repro-task", { kind: "artifact-ref", gate_run: "no-such-gate-run-ever-existed", sha: "deadbeef...", content_hash: "0"*64, ... }, ...)` against `scripts/context-io.js` | `appendNote WROTE id: 20260907T163748Z-qe-e2e-artifact-ref-1e163523` — no refusal | ✗ FAIL (confirms gap 1) |
| `uat-spec-integrity.js` over a spec using `test.describe.only`, `test.describe.skip`, `test["skip"]` | `node scripts/runnable-ref/uat-spec-integrity.js <tmp-repo-with-typescript-resolvable>` | `UAT spec integrity: 0 findings over 1/1 uat specs checked`, `EXIT=0` | ✗ FAIL (confirms gap 2) |
| `guardPlaywrightMcpPin`'s authority read | Code inspection: `scripts/check-foundation-guards.ts:3838-3855`, `const pin = first.version;` with no format check | No concrete-version assertion present | ✗ FAIL (confirms gap 3) |
| Full excluded-e2e regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 61 passed (61)`, `Tests 3264 passed \| 2 skipped (3266)` | ✓ PASS (green, but does not exercise any of the three gaps above — confirms the project's standing "green suite is not proof for a safety predicate" doctrine) |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| UATX-01 | 31-01, 31-04 | Committed spec = evidence floor; narration never a stamp | ⚠️ PARTIAL | Impersonation refusal holds; artifact-ref binding is bypassable (gap 1) |
| UATX-02 | 31-03 | Browser MCP tooling documented + pinned, 5 hosts | ✓ SATISFIED | Recipe complete; `package.json` untouched |
| UATX-03 | 31-03, 31-04 | Attended Chrome lane structurally barred from gate stamp | ✓ SATISFIED | `chrome-lane-bar.test.ts` green and unchallenged |
| UATX-04 | 31-01 | Evidence provenance (SHA/gate_run/content_hash); mismatched SHA refused | ✗ BLOCKED | Refused only through `admit()`, not through the documented `appendNote()` path (gap 1) |
| UATX-05 | 31-02, 31-04 | Loud skip on absent/unusable browser, never a silent pass | ✓ SATISFIED | Both markers, single emission points, tested |
| UATX-06 | 31-02, 31-04 | AST ban on conditional/caught assertions; claim matches mechanism | ✗ BLOCKED | Arms (a)/(b) correct; arm (c) does not match real Playwright syntax (gap 2) |

No orphaned requirements: every plan's `requirements:` frontmatter entry (UATX-01, UATX-02, UATX-03,
UATX-04, UATX-05, UATX-06 across 31-01..31-04) is accounted for above, and `.planning/REQUIREMENTS.md`
maps no additional Phase 31 requirement ID beyond these six.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/runnable-ref/uat-spec-integrity.ts` | ~487-503 | Matcher accepts a narrower AST shape than the real-world construct it claims to ban | 🛑 Blocker | Gap 2 — the modifier-ban claim is false for the mechanism's actual coverage |
| `scripts/context-io.ts` | 1020-1073 (`appendNote`) | Documented "sole sanctioned writer" omits the one safety check the phase exists to add | 🛑 Blocker | Gap 1 — an agent-controllable write path can forge provenance-bound evidence |
| `scripts/check-foundation-guards.ts` | 3838-3855 | Guard's fail-closed claim ("a floating specifier is a finding") is untrue for the authority mention itself | 🛑 Blocker | Gap 3 — supply-chain guard has an unguarded self-referential hole |
| `.planning/phases/31-autonomous-manual-testing/31-01-SUMMARY.md` | §Residual 1 | States "Neither is a silent pass — both fail closed" for the `appendNote` bypass; measurement contradicts this | ℹ️ Info | No-fabrication rule: a disclosed residual whose stated disposition is wrong is not a disclosed residual |
| `.planning/phases/31-autonomous-manual-testing/31-03-SUMMARY.md` | ~233 | Repeats the guard's overclaim about floating-specifier detection | ℹ️ Info | Same root cause as gap 3's comment overclaim |
| `tsconfig.json`, `tsconfig.tests.json` | exclude list | `scripts/runnable-ref/fixtures/**` excluded from both, hiding an invalid fixture (non-existent `describe` import) | ⚠️ Warning | Contributed to gap 2 going undetected by the shipped test suite |

No unreferenced `TBD`/`FIXME`/`XXX` debt markers were found in the files this phase modified.

### Human Verification Required

4 items, all pre-existing `UNKNOWN - verify` / manual-only items already recorded in
`31-VALIDATION.md` — none newly discovered by this verification, listed for completeness in the
frontmatter `human_verification` block above (the attended Chrome lane's real interactive behavior,
the `claude auth status --json` predicate under API-key/long-lived-token auth, the Windows leg of
every browser probe, and the installer/uninstaller round-trip on a pre-existing host install).

### Gaps Summary

Three 🛑 Blockers, all independently re-reproduced in this verification session (not taken on
31-REVIEW.md's word):

1. **The evidence-binding refusal (D-03/UATX-04) has a live bypass.** `admit()` correctly refuses a
   stale-SHA or fabricated-gate-run `artifact-ref`, but `appendNote()` — named as the sanctioned
   writer by two shipped workflows — never calls `admit()` and writes such a note anyway. This
   directly contradicts the phase's own goal statement: an agent-authored claim (a `gate_run`/`sha`
   pair the agent supplies) can enter the shared context looking like bound evidence with no
   verification that a matching gate run exists. Reproduced live: `appendNote()` wrote and returned
   an id for a note naming `gate_run: "no-such-gate-run-ever-existed"`.

2. **The D-14 arm (c) ban set does not match real Playwright syntax (UATX-06).** `test.describe.only`,
   `test.describe.skip`, `test.describe.fixme`, and any bracket-notation call (`test["skip"]`,
   `expect["soft"]`) are the actual spellings Playwright supports and are all invisible to the
   checker. `test.describe.only` in particular narrows an entire gate run to one describe block —
   precisely the "a green lane would certify a scenario nobody exercised" failure the checker exists
   to prevent. The fixture meant to prove this arm imports a non-existent Playwright export and is
   excluded from typecheck, so the gap was never caught by the shipped 47/47-green test suite.

3. **The pin guard (D-08) cannot detect a floating specifier when the authority mention itself
   floats.** The guard's own source comment claims the opposite of what the code does; no test
   exercises the authority-floats case. This is a secondary supply-chain control weakening rather
   than a defeat of the phase's core evidence-binding goal, but it is a documented must_have of Plan
   31-03 that fails as written.

All three were reproduced independently in this verification (live `appendNote()` call, live
`uat-spec-integrity.js` run, and direct code inspection) rather than accepted from the code review
that preceded this verification. The full excluded-e2e suite is green (61/61 files, 3264/3266 tests)
and does not exercise any of these three paths — consistent with this project's standing doctrine
that a green suite is not proof for a safety predicate.

**This looks like it needs a gap-closure round, not an override.** All three defects are structural
mismatches between the claimed mechanism and the actual one, in the exact register this project's
own doctrine treats as blocking (see `agent-factory/checklists/browser-uat-recipe.md`'s own framing:
"the claim matches the mechanism"). No override is suggested.

---

_Verified: 2026-09-07T19:45:00Z_
_Verifier: Claude (gsd-verifier)_

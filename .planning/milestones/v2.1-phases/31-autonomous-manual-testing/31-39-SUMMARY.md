---
phase: 31-autonomous-manual-testing
plan: 39
subsystem: shared-verified-context
tags: [typescript, ast-derivation, byte-freeze, governance, audit-ledger, gap-closure]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "plan 31-33's entry-level one-root derivation (D-34 (1)), the WRITE_PATH_RESIDUALS register, and the published residual R-31-33-01 naming the admit() unfreeze as the only thing that closes this class"
provides:
  - "`ActionOwner` — one exported discriminated answer to 'which repository owns this action', with no null member and no optional field, so falling open costs an explicit branch a reviewer meets"
  - "`actionOwnerRoot` — the ONE authority, adding no rule of its own; `governanceRootOf` now has exactly two direct callers, neither a write-both route"
  - "a governance-DIAL root distinct from a LEDGER-owner root on `admit`, `appendNote` and `admitAndAppend`, restoring D-31 / WR-10 rather than reversing it"
  - "`UNNAMEABLE_OWNER_CLAUSE` + `unnameableOwnerRefusal` — one clause name and one refusal sentence both write-both routes emit"
  - "a deliberate `admit()` unfreeze under the dated human decision D-39, with `ADMIT_FROZEN_SHA256` re-baselined and the record R-31-39-01 written at the freeze"
  - "a HARDENED freeze extraction that cannot silently collapse onto a parameter default"
  - "a DERIVED cross-product matrix over every arm from which a GOV-02 append is reachable, with the union of the arms asserted and the permitted asymmetry read from an exported register"
affects: [31-40, phase-31-verification-round-9, context-io, compactor, admission-server]

actuals:
  tokens: 48768
  tasks: 3
  commits: 5
  plan_head_before: 54ea410

tech-stack:
  added: []
  patterns:
    - "A resolver that answers `T | null` hands every consumer a default to pick; a discriminated answer with no null member makes falling open cost an explicit branch"
    - "Two questions get two parameters: the governance DIAL root decides where nothing lands, the LEDGER owner names where the record lands"
    - "A rule is DERIVED at each route's entry and CONSUMED at the point of effect — the one site that actually writes the second half"
    - "A derived arm set + a cross product over the inputs that decide the answer + a pairwise UNION assertion, with permitted asymmetries in an exported register that is itself proven exercised"

key-files:
  created:
    - .planning/phases/31-autonomous-manual-testing/red-evidence/31-39-task2-red.json
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md

key-decisions:
  - "D-39 (developer's checkpoint answer, 2026-09-12): Option A — both write-both routes REFUSE an unnameable owner under `audit_retention: retained` via one shared clause constant; `admit()` is unfrozen and given a ledger owner distinct from its dial root; `ADMIT_FROZEN_SHA256` re-baselined with R-31-39-01 at the freeze"
  - "D-39: the `appendNote` route is IN scope — one rule, both routes. The ambiguity was surfaced at the checkpoint rather than decided inside a diff"
  - "D-39: the SHAPE of the answer, not its position, is the fix. Asserted from the module's own syntax tree, with the call-site count asserted non-zero so the ban cannot pass vacuously"
  - "D-39: the refusal is SCOPED to the retention guard (the point of effect) because under the lean value no record is written at all — the reading neither finding document took"
  - "D-39: this is the SIXTH freeze re-base, not the seventh. The plan text's count was measured wrong and is recorded as wrong rather than adopted"
  - "D-39: R-31-33-01 is CLOSED and records its own closure; the case that DROVE it is inverted rather than deleted"
  - "Task 3: the sibling order axis's tail-delegation exclusion is deliberately ABSENT from the new reachability axis, because it would delete the exact coordinate CR-27 was filed at"

patterns-established:
  - "Ban a fallback by DERIVING it: walk every call to the authority and assert none is an operand of `??`/`||`/a conditional default, with the call-site count asserted non-zero"
  - "A freeze must assert what it froze: the extraction is hardened to skip the parameter list and positively assert the span IS the body"
  - "An asymmetry register must be proven EXERCISED — an exemption whose cell has come to agree with every other arm is a standing permission for a future divergence"
  - "Re-stage a fixture, never re-baseline an assertion: classify each red case as STAGING-wrong or EXPECTATION-wrong and record both counts"

requirements-completed: []

coverage:
  - id: D1
    description: "CR-26 closed — `admitAndAppend`'s gated branch no longer falls open to the dial root; an unnameable owner under retained retention REFUSES with the same clause the sibling route raises, and nothing lands in any root"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#RED 1 (CR-26): an unnameable owner under RETAINED retention REFUSES, and nothing lands in any root"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#MUTANT: restoring the nullish fallback at the gated branch re-opens CR-26, and RED 1 goes red on it"
        status: pass
      - kind: other
        ref: ".planning/phases/31-autonomous-manual-testing/red-evidence/31-39-task2-red.json (RED at adeb45c) re-driven against the rebuilt .js"
        status: pass
    human_judgment: false
  - id: D2
    description: "CR-27 closed — the governance dial is answered from the caller's trusted root on every path through `promoteAdmitted`, so a destination naming a permissively-configured store no longer launders a D-14 fail-closed refusal"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#RED 2 (CR-27): a destination naming a permissive store no longer launders the trusted root's D-14 refusal"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#MUTANT: swapping the dial and ledger arguments back at the fall-through re-opens CR-27"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#admit()'s dial reads repoRoot while its record follows the ledger owner — two repositories, one call"
        status: pass
    human_judgment: false
  - id: D3
    description: "One owner authority with a shape a consumer cannot fall open through, asserted from the module's syntax tree"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#ActionOwner has exactly two members, no null member, and no optional field on either"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#no consumer of the owner authority carries a fallback expression of its own"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#governanceRootOf has exactly TWO direct callers, and neither is a write-both route"
        status: pass
    human_judgment: false
  - id: D4
    description: "`admit()` deliberately unfrozen and re-baselined at bb920698…81cd (the sixth re-base), with R-31-39-01 and all five prior baselines written at the freeze, and the extraction hardened so it cannot collapse onto a parameter default"
    requirement: UATX-04
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#admit()'s function span byte-hash equals the pinned pre-25-09 baseline (frozen, not green-inferred)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the extracted span IS the function BODY, not a parameter default (the 31-39 degeneration)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The derived cross product — 7 arms, 24 driven cells at every deciding input, driven twice, read in every root, with the union asserted pairwise and watched failing against two confirmed mirrors"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-39 Task 3 — the derived cross product / every cell, driven twice, read in every root / the UNION of the arms / the matrix DISCRIMINATES (38 cases)"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 66 files, 4262 passed, 2 skipped, exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "D-39 recorded in 31-CONTEXT.md with the developer's verbatim disposition, both Task-1 measurements with the commands that produced them, the rejected alternatives with their numbers, and what D-39 does not establish"
    verification: []
    human_judgment: true
    rationale: "Whether a written decision record is adequate — whether it states what it establishes and what it does not, and whether a later reader could act on it — is a judgment no test asserts. The mechanical halves it claims ARE asserted (D1–D5); the prose is for a human."

duration: 6h 24m
completed: 2026-09-12
status: complete
---

# Phase 31 Plan 39: One owning-repository authority, dial/ledger separation Summary

**The write path now has ONE authority for "which repository owns this action", shaped as a discriminated answer with no null member so a consumer cannot fall open without an explicit branch — and `admit()`'s governance DIAL root is a separate parameter from its LEDGER owner, so a caller-supplied destination can no longer decide whose configuration adjudicates an admission.**

## Performance

- **Duration:** 6h 24m
- **Started:** 2026-09-12T13:06Z
- **Completed:** 2026-09-12T19:30Z
- **Tasks:** 3 of 3
- **Files modified:** 8 (7 modified, 1 created)

## Accomplishments

- **CR-26 and CR-27 both closed**, each re-driven at the finding documents' own spellings against the REBUILT artifact, with all-root counts on both sides of the fix.
- **One authority, one shape.** `ActionOwner` is a discriminated union with exactly two members, no null member and no optional field; `actionOwnerRoot` is the one answer and adds no rule of its own. `governanceRootOf` went from three direct callers (including both write-both routes, which decided a `null` two opposite ways) to exactly two.
- **The dial and the record are two questions with two parameters.** `admit()` gained a ledger-owner parameter distinct from its governance-dial root, under a dated human decision that deliberately reverses plan `31-33`'s own prohibition. `D-31` / `WR-10` are RESTORED, not reversed.
- **The freeze's own extraction was caught degenerating mid-change** and hardened in both halves — see "Issues Encountered".
- **A derived cross-product matrix** over every arm from which a GOV-02 append is reachable: 7 derived arms, 24 driven cells, each driven twice (legitimate input beside the attack) and read in every root, with the union of the arms asserted pairwise and the permitted asymmetry read from an exported register that is itself proven exercised.
- **`R-31-33-01` CLOSED**, recording its own closure, with the case that drove it INVERTED rather than deleted.

## The RED and GREEN all-root readings, side by side

Taken against the committed `scripts/context-io.js` at `adeb45c` (sha256 `342d7391a996…5a6c`) from a scratch driver outside the repository tree, every root created by `mkdtemp`, every premise asserted before any result was read. Full transcript: `red-evidence/31-39-task2-red.json`.

| Probe | RED (pre-fix) | GREEN (post-fix, rebuilt artifact) |
|---|---|---|
| **RED 1 (CR-26)** `admitAndAppend("T-REPRO1", gated finding, body, UNGOV.store, THIRD.root)` at `retained` | returned an id; **UNGOV notes=1 ledger=ABSENT**, **THIRD notes=0 ledger=1** — a human-disposed finding and its own audit record in two repositories | **REFUSED** naming `destination-outside-governed-store`; all six probe roots read **notes=0 ledger=ABSENT** |
| **RED 3** the same call at `audit_retention: git` | returned an id; UNGOV notes=1, **no ledger in any root** | **UNCHANGED** — id returned, UNGOV notes=1, no ledger in any root |
| **RED 2 ATTACK (CR-27)** `promoteAdmitted("T-DIAL", …, to=DEST.store, repoRoot=TRUSTED.root)` with TRUSTED's config unparseable | **WROTE** — id returned, **DEST notes=1 ledger=1** | **REFUSED** with the D-14 fail-closed message; every root notes=0 ledger=ABSENT |
| **RED 2 CONTROL** the same call with `to=TRUSTED.store` | REFUSED (D-14) | REFUSED (D-14) — **the same answer as the attack**, which is the property CR-27 measured absent |

RED 3 is the reading neither `31-REVIEW.md` nor `31-VERIFICATION.md` took, and it is what decided the refusal is **scoped to the retention guard** rather than unconditional: under the lean value the action has only one half, so there are no two halves to split.

## The freeze

| | |
|---|---|
| Prior baseline | `08df9e5c15754f8b3f3bde417475652d3d3861c50fd5458704b29651b83709e9` |
| New baseline | `bb920698c1e4e321805209f7be0ccfee663ca851733c4ae369fd0781faef81cd` |
| Re-base number | **the SIXTH** — five prior baselines are recorded in the freeze prose, i.e. five transitions |
| Record | `R-31-39-01`, written at the freeze, listing all five prior baselines with their reasons |

`31-39-PLAN.md`'s Task 1 context and its Option A both say "six times… the seventh" and are **off by one**. `R-31-33-01` and `D-34` say "five times before" and are correct. The discrepancy is recorded rather than silently resolved in either direction, because `R-31-39-01`'s own prose is required to list every prior baseline.

## Task Commits

1. **Task 1: the checkpoint decision, recorded** — `adeb45c` (docs) — D-39's opening with the developer's verbatim answer and both required measurements
2. **Task 2 RED** — `5929fd5` (test) — both reproductions driven against the committed `.js` before any source edit
3. **Task 2 GREEN** — `52ea3f0` (feat) — MOVEMENTs 2–6
4. **Task 3** — `54a891a` (test) — the derived cross product
5. **D-39 decision body** — `10887d8` (docs)

## The fallout, measured and classified (MOVEMENT 5)

**44 cases turned red.** Every one was classified as STAGING-wrong or EXPECTATION-wrong before it was touched, and **no assertion was weakened to restore green**.

| Class | Count | What it was |
|---|---|---|
| **STAGING wrong** | **13** | 8 in `context-io.test.ts` (a store presented to a retained dial with no nameable owner, plus one anchor that incidentally encoded "…and it is the LAST parameter") and 5 mirror/order anchors in `context-io-writer-set.test.ts` naming variables this plan renamed |
| **EXPECTATION wrong** | **3** | the `admit()` byte-freeze (the planned re-base); `R-31-33-01 DISCLOSED` (the residual is now CLOSED, so the case is inverted); and the WR-21 home-stop mutation proof's audit-trail half, whose *consequence* moved because the record no longer follows the dial root |
| **Derived axis legitimately grew** | **28** | the `31-10` refusal-family axis moving from 8 sites to 9, with the reason written at the constant and the other 8 signatures asserted byte-identical so an ADDED site could not read as a re-worded one |

**Against the numbers that priced this decision:** `D-34` measured the *unscoped* alternative at **121** `appendNote` and **26** `admitAndAppend` call sites and rejected it. `D-39`'s Task-1 measurement put the *scoped* form's upper bound at **12** distinct test cases reaching the condition. The measured staging cost in `context-io.test.ts` was **8** — inside that bound, and the bound was correctly recorded as an upper bound rather than as a cost.

## The derived matrix (Task 3)

- **7 derived arms**, from the transitive closure of the module's own call graph: `admit::appendAuditLedger#1`, `appendNote::admit#1`, `admitAndAppend::appendAuditLedger#1`, `admitAndAppend::admit#1`, `promoteAdmitted::appendAuditLedger#1`, `promoteAdmitted::appendNote#1`, `<module>::admit#1`.
- **24 driven cells** (6 arms × 2 store shapes × 2 retention values), each driven **twice** — the legitimate input beside the attack shape.
- **1 dispositioned arm** (the CLI `admit` verb), with a positive parsed-source proof that it derives one local from `trustedRepoRoot()` and passes it as both the store's base and the dial root, so the divergence this matrix varies is not expressible on it.
- **51 new cases** under the `31-39` describe in total.
- The walk starts at the **source file**: a reachable append seeded inside an arrow function, a class method and a nested block each moves the derived count by exactly one.
- The **tail-delegation exclusion is deliberately absent**, with its own case, because inheriting it from the sibling order axis would delete `promoteAdmitted`'s fall-through — the exact coordinate CR-27 was filed at.

## Verification

| Gate | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **66 files, 4262 passed, 2 skipped, exit 0** |
| `npm run build && npm run typecheck` | exit 0 |
| `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | `All build outputs fresh: 61 committed .js file(s) match a rebuild of their sources.` |
| `npm run freshness:hook-manifest` | `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `node scripts/check-platform-shapes.js` | `ALL CHECKS PASSED` |
| `check:residual-citations` / `claim-anchors` / `audit-register` / `banned-claims` / `imperative-lexicon` / `nul-bytes` / `public-docs` | `ALL CHECKS PASSED` (7 gates) |
| `npm run check:diff-disposition` | **78 finding(s) over 39 elements** — byte-identical to the count `D-38` recorded at the round-7 close. Zero growth. The gate exits 1 while the standing debt is non-zero, which is the round's state and not a regression. |

`.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` are **byte-unchanged** by this plan (`git diff 54ea410..HEAD` over both is empty). `hooks/guard.ts` was not touched and `FROZEN_GUARD_BLOB` was not re-based.

## Decisions Made

All recorded in `31-CONTEXT.md` under `D-39` (2026-09-12, gap-closure round 9, wave 8, plan 31-39). The disposition itself is the **developer's**, given at Task 1's blocking checkpoint and quoted verbatim in the record — it is not this plan's author's, because it reverses plan `31-33`'s own stated prohibition and a plan cannot authorise that.

## Deviations from Plan

### 1. [Rule 1 - Bug] The freeze's own extraction collapsed onto the new parameter's default

- **Found during:** Task 2, MOVEMENT 3.
- **Issue:** `admit()`'s new ledger-owner parameter was first written with an inline object-literal default, `{ answered: true, root: repoRoot }`. `ADMIT_FROZEN_SHA256`'s extraction takes the first `{` after `export function admit(` and brace-counts from there — so the "frozen span" silently became **1,885 bytes of parameter list** instead of **12,394 bytes of function body**, and the freeze would have re-locked GREEN over a span containing not one of the four refusal families it exists to pin. A freeze that can be emptied by a brace is not a freeze.
- **Fix:** both halves, because either alone leaves the other free to re-introduce it. (a) The module uses a named private constructor `answeredOwner(root)` so no brace enters the parameter list. (b) The extraction now walks the parameter list to its matching `)` before looking for the body's `{`, and a new case positively asserts the extracted span starts at the declaration, reaches `assertSafeTask`, the D-14 governance read and the retention guard, and ends on the body's closing brace.
- **Files modified:** `scripts/context-io.ts`, `scripts/context-io.test.ts`
- **Verification:** the span is now 15,265 bytes and contains the body; the hardened extraction yields a byte-identical span on any source whose parameter list carries no brace, so it is not itself a re-base.
- **Committed in:** `52ea3f0`

### 2. [Rule 2 - Missing critical] The shared refusal sentence would have derived an EMPTY signature

- **Found during:** Task 2, MOVEMENT 5.
- **Issue:** the new `admit()` refusal returns the ONE shared sentence both write-both routes emit, which by construction lives in a helper rather than at the site. The `31-10` refusal-site derivation reads only literal chunks, so that site's chunk list was **empty** and `refusalSignature([])` is `""`. `matchesSite(message, [])` is TRUE for every message, an empty key would have become a `REFUSAL_FAMILY_LABELS` entry, and a second such site would have collided with it silently.
- **Fix:** the derivation follows a call **that is an entire array element** through to a module-local single-return helper's static chunks.
- **The obvious wider rule was tried and MEASURED wrong first**, here, before the narrow one was written: resolving every module-local call, including inside template interpolations, re-identified **four** existing sites because `${verdictStampFor(id)}` began contributing `#` — exactly the value-dependence that walk's own docstring says the drop exists to prevent. The shipped rule distinguishes by **position**, not by callee.
- **Files modified:** `scripts/context-io-writer-set.test.ts`
- **Verification:** all 8 pre-existing signatures asserted byte-identical across the change; the new S9 signature is distinct; the seeded/removed derivation controls still move the count by exactly one.
- **Committed in:** `52ea3f0`

### 3. [Rule 2 - Missing critical] The S9 site could not be reached by any four-argument probe

- **Found during:** Task 2, MOVEMENT 5.
- **Issue:** the direct-authority discrimination check in `context-io-writer-set.test.ts` calls `mod.admit(task, text, contextRoot, repoRoot)`. The new ledger-owner parameter defaults to the answered owner of `repoRoot` (deliberately, so pre-existing callers are unchanged), so the new refusal is unreachable from a four-argument call and the union assertion reported the probe as admitted. Declaring the site "unreachable" would have been wrong — the writers reach it by construction.
- **Fix:** `RefusalProbe` gained an optional `ledgerOwner` supplier, used only by S9, derived through the module's own `actionOwnerRoot` rather than hand-built. `stageProbe` gained an optional `store` override for the same reason: S9's precondition is a store whose owner cannot be named, which the co-located staging cannot express.
- **Files modified:** `scripts/context-io-writer-set.test.ts`
- **Verification:** the union-of-signatures assertion is green in both directions; `promoteAdmitted × S9` is dispositioned with a positive parsed-source proof rather than skipped.
- **Committed in:** `52ea3f0`

---

**Total deviations:** 3 auto-fixed (1 × Rule 1, 2 × Rule 2). **Impact:** all three are correctness requirements this plan's own change created and would otherwise have shipped as silent vacuity in a freeze and in a derived axis. No scope creep — every fix is inside the files the plan already names in `files_modified`, except the two `context-io-writer-set.test.ts` axes, which this plan's change is what moved.

## Issues Encountered

- **The full excluded-e2e suite takes ~7 minutes per run**, and this plan needed nine of them (two probe-instrumented, one base, five iterative, one final). No workaround; the cost is recorded for future estimates.
- **`floor-invariance.test.ts` reads as red mid-change** on its "`hooks/hook-entry.ts` has no uncommitted modification, measured against HEAD" assertion whenever the regenerated hook manifest is not yet committed. It is not a failure — it is the assertion working — and it is green at every commit this plan made.

## Boundaries this plan leaves open

Each with a reason and what would force it closed.

| Boundary | Reason | What would force it closed |
|---|---|---|
| **`R-31-33-02` — the DEFAULT split.** With no arguments the note lands in the KIT's own store while the GOV-02 event lands under `trustedRepoRoot()`. | Unchanged by this plan. On this box the two coincide, so the split is not observable here; under the shipped shared-install model they are different directories. Closing it means DECIDING which repository the default names, and either answer reverses a prior decision with a written reason. | A dated decision naming ONE repository as the default owner of the shared verified context, applied to the readers' defaults and the writers' in the same change. |
| **`T-31-18-01` / `T-31-39-04` — a destination's CONTENTS are not authenticated.** The constraint names a REPOSITORY, not a trustworthy one. | Pre-existing and priced per position (`D-31`). An agent that can `mkdir` a version-control marker and a readable configuration can construct one. | A trust decision about destination provenance that does not rest on filesystem shape — out of scope for a write-path rule. |
| **The CLI `admit` arm is dispositioned, not driven.** | It derives one local from `trustedRepoRoot()` and passes it as both the store's base and the dial root (30-11's own `RA2-1` fix), so a store and a dial root that disagree is an input it accepts no way of expressing. | A change letting the CLI name two repositories — at which point it owes every cell a driven row, which is exactly what the disposition's parsed-source proof goes red on. |
| **`R-03` — the Windows leg.** | This phase's standing remainder. Every probe here ran on darwin; `mkfifo` and the governance walk are not re-measured on Windows. | A Windows CI lane, which is a phase-level decision and not a write-path one. |
| **The disposition debt stays at 78 findings over 39 elements.** | `check:diff-disposition` exits 1 while the standing debt is non-zero. This plan added **zero** — the count is byte-identical to the one `D-38` recorded at the round-7 close. | Working the standing debt down, which is its own scope and has never been this round's subject. |
| **`UATX-01` through `UATX-06` remain UNCHECKED and every traceability row still reads `Gaps Found`.** | This is a gap-closure plan. Only a verification round may flip a requirement, and this phase has now had eight rounds in which the executing round believed it had closed one. | A ninth verification round that independently reproduces, or fails to reproduce, the shapes this plan claims to have closed. |

## Next

Ready for `31-40` (the derived divergence census — the second half of D-39's companion invariant: it goes red the instant a new call site supplies either root from a value its own inputs do not derive).

## Self-Check: PASSED

- All `key-files.created` and `key-files.modified` exist on disk.
- All six task/metadata commits exist in `git log`: `adeb45c`, `5929fd5`, `52ea3f0`, `54a891a`, `10887d8`, `e14540a`.
- The four new/changed exports resolve from the committed `scripts/context-io.js`: `actionOwnerRoot`, `UNNAMEABLE_OWNER_CLAUSE`, `unnameableOwnerRefusal`, `governanceRootOf`.
- Exactly one `D-39` heading exists in `31-CONTEXT.md`.
- Every plan-level `<verification>` command was re-run and its output is quoted verbatim in the Verification table above.

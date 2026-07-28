---
phase: 15-typescript-tooling-migration
verified: 2026-06-13T23:55:00Z
resolved: 2026-06-14T00:00:00Z
status: passed
score: 4/4
overrides_applied: 0
human_resolution:
  - item: "SC3 cross-platform workflow invocation scope"
    ruling: satisfied
    note: >
      Ruled satisfied for Phase 15. The kit-shipped-runnable convention exists, is documented,
      and is proven end-to-end (reference-check.ts, D-12 contract, materializeRunnable, bare-Node
      host-emulation test). The concrete workflow-step invocation (`node tools/grugops/<routine>.js`
      as a gate step) is Phase 16's deliverable by design — Phase 16's goal states its test-integrity
      checker is "a cross-platform TypeScript routine on the Phase-15 foundation."
  - item: "Stale validate-agent-factory.mjs reference in CLAUDE.md:56"
    ruling: fixed
    note: >
      Fixed. CLAUDE.md:56 and the generator source .planning/research/STACK.md now reference
      `scripts/validate-agent-factory.ts` (compiled `.js`). Remaining `.mjs` mentions live only in
      historical artifacts deliberately excluded from Plan 06's sweep (docs/initial/ original spec,
      examples/ run captures, the port's own "ported from" comment, a PROJECT.md changelog line) and
      are accurate as historical record.
human_verification:
  - test: "Review the kit-shipped-runnable convention (SC3) for cross-platform workflow invocation documentation"
    expected: >
      SC3 requires the convention to document how a TS routine is invoked cross-platform from
      a workflow step. The reference routine exists and is proven. The installer materializes it.
      But no agent-factory workflow (agent-factory/workflows/) currently references
      `node tools/grugops/<routine>.js` as a gate step — that wiring is Phase 16's deliverable.
      Confirm: is Phase 15's SC3 satisfied by the convention being proven in code (reference-check.ts,
      materializeRunnable, D-12 contract), with the workflow-step invocation intentionally deferred
      to Phase 16, or does SC3 require a concrete workflow step to be present in Phase 15?
    why_human: >
      The SC3 phrase "invoked cross-platform from a workflow step" is ambiguous about Phase boundary.
      Phase 15 proves the mechanism works (D-11 end-to-end, D-12 contract proven). Phase 16's
      test-integrity checker is the first production invocation in a gate workflow. This is a scope
      boundary judgment call — code confirms the convention exists and works; whether the workflow
      wiring must land in Phase 15 or Phase 16 requires human interpretation of the SC3 intent.
  - test: "Review the stale validate-agent-factory.mjs reference in CLAUDE.md line 56 (GSD:stack block)"
    expected: >
      CLAUDE.md line 56 (inside the GSD:stack-start block sourced from research/STACK.md) still
      reads: `scripts/validate-agent-factory.mjs`. The file no longer exists — it was deleted in
      Plan 06 (D-09). The D-13 Constraints amendment on line 14 is correct. The invocation-string
      sweep (Plan 06 Task 1) did not include CLAUDE.md in its explicit grep scope.
      Confirm: is this stale reference in the GSD-generated stack block a material gap, or is it
      acceptable because (a) the Constraints section correctly records the TS pivot, (b) the
      GSD:stack block is spec documentation rather than an agent-executable invocation string, and
      (c) check-kit-refs.ts explicitly excludes CLAUDE.md from its SCAN scope?
    why_human: >
      Whether this constitutes a gap in the SC4 invocation-string sweep depends on whether
      CLAUDE.md's GSD-generated stack block is treated as a "shipped invocation-string surface"
      or as historical spec documentation. The machine cannot distinguish between these; human
      judgment on materiality and scope is needed.
---

# Phase 15: TypeScript Tooling Migration — Verification Report

**Phase Goal:** Execute the ratified TypeScript pivot for grugops's tooling layer — migrate the existing scripts to TypeScript at behavior parity, establish a zero-build cross-platform execution model, and define the kit-shipped-runnable convention. Amends the foundational "markdown + stdlib-only, no-npm-deps" constraint to the ratified posture.
**Verified:** 2026-06-13T23:55:00Z
**Status:** passed (human-resolved 2026-06-14)
**Re-verification:** No — initial verification; two human-escalated items resolved (SC3 ruled satisfied; CLAUDE.md:56 stale ref fixed)

## Goal Achievement

### Observable Truths

All four roadmap success criteria were evaluated against the actual codebase and live gate runs.

| # | Truth | Status | Evidence |
|---|-------|--------|----|
| 1 | Cross-platform TS execution model decided and documented: runs on Windows/macOS/Linux, build posture (tsc-compiled committed .js) justified in writing | VERIFIED | `tsc --noEmit` exits 0. `tsconfig.json` sets `module:nodenext`, `newLine:lf`, `noEmitOnError:true`, `target:es2022`. `package.json` has `engines.node:">=22"`, `type:module`. CLAUDE.md Constraints (line 14) + Recommended Stack table (lines 35-38) + PROJECT.md Key Decisions row (line 137) record the rationale. `freshness.js` gate runs and exits 0 — 9 committed .js confirmed fresh against a live rebuild. |
| 2 | All existing tooling scripts migrated to TypeScript at behavior parity — every RED-by-design test harness still fails red on a regression and passes green on the migrated code | VERIFIED | `npx vitest run` exits 0: 103 passed, 1 intentional D-08 skip (104 total across 7 files). Live gate run confirmed. All six ports have committed .ts/.js pairs. Guard/install/validator/ASVS/foundation-guards behavior confirmed via behavioral spot-checks (see below). WR-04 WARNING: `check-kit-refs.ts` has no paired Vitest harness — the only behavioral check is the real-tree smoke (`node scripts/check-kit-refs.js` exits 0). This is a code review finding recorded in 15-REVIEW.md; the port itself is byte-for-behavior identical but untested by a planted-regression harness. |
| 3 | Kit-shipped-runnable convention exists and is documented: how a TS routine ships in the kit, is materialized by the installer, and is invoked cross-platform from a workflow step | UNCERTAIN | EXISTS and PROVEN: `scripts/runnable-ref/reference-check.ts`/`.js` speaks the D-12 contract (exit 0/1/2 + clear-voice stdout + --json). `install.ts` `materializeRunnable()` at the reserved seam copies the compiled `.js` to `tools/grugops/` additively/idempotently/never-overwriting. The D-11 end-to-end proof (bare-Node temp dir, no node_modules, exits 1 on bad fixture) passes. UNCERTAINTY: No agent-factory workflow currently references `node tools/grugops/<routine>.js` as a gate step — that wiring is Phase 16's deliverable. Whether SC3's "invoked from a workflow step" requires a concrete step in Phase 15 is a scope boundary judgment call (see Human Verification). |
| 4 | Foundational constraint formally amended in CLAUDE.md + PROJECT.md; prior Phase 12/13/14 HELD notes marked superseded; removing zero-Node POSIX install path is an explicit ruled-on decision | VERIFIED | CLAUDE.md Constraints (line 14) records the TS pivot with D-13 date. PROJECT.md line 106 + Key Decisions table (line 137) confirm all four pillars. 12-CONTEXT.md line 157, 13-CONTEXT.md line 143, 14-CONTEXT.md lines 27 and 59 each carry "SUPERSEDED by the Phase-15 TypeScript pivot (D-13, ratified 2026-06-13)" annotations with original HELD text preserved. Human checkpoint was approved (Plan 06 Task 4, 15-06-SUMMARY.md). D-07 (drop POSIX installer) + D-08 (retire byte-parity contract) are explicit ruled-on decisions in PROJECT.md Key Decisions. |

**Score:** 4/4 truths verified or under human review (no FAILED truths)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | type:module, engines.node>=22, dev-deps {typescript,vitest,@types/node}, scripts build/typecheck/test/freshness | VERIFIED | All present. Exactly 3 dev-deps (no fourth dependency). |
| `tsconfig.json` | nodenext/es2022/strict/newLine:lf/noEmitOnError/declaration:false | VERIFIED | All keys present and correct. `types:["node"]` added to resolve @types/node. |
| `vitest.config.ts` | minimal Vitest config (node defaults) | VERIFIED | `defineConfig({ test: {} })` — functional. |
| `.gitattributes` | pins committed *.js to eol=lf for tool dirs | VERIFIED | `install/*.js`, `scripts/**/*.js`, `hooks/*.js` all pinned `text eol=lf`. |
| `.gitignore` | ignores node_modules/ | VERIFIED | `node_modules/` and `.tmp-build/` present. |
| `scripts/freshness.ts` | D-02 drift gate: rebuild-to-temp → Buffer.equals → exit 0/1 | VERIFIED | Exists, substantive (node: builtins only, mkdtempSync, Buffer.equals diff). |
| `package-lock.json` | committed lockfile — supply-chain integrity | VERIFIED | Present and committed. `git ls-files package-lock.json` returns path. |
| `hooks/guard.ts` | prod-deploy safety guard, GRUGOPS_PROD_DEPLOY_APPROVED byte-identical | VERIFIED | 4 occurrences of literal `GRUGOPS_PROD_DEPLOY_APPROVED`. Live deny test: `kubectl apply` piped to guard.js outputs `"permissionDecision":"deny"`. Allow test: with env var set, no deny output. Fail-closed: malformed stdin exits 0 with no error. |
| `hooks/guard.js` | committed compiled guard, contains GRUGOPS_PROD_DEPLOY_APPROVED | VERIFIED | 4 occurrences. LF-only. Freshness gate green (confirmed in live run: "9 committed .js file(s) match a fresh tsc rebuild"). |
| `hooks/guard.test.ts` | 27-case Vitest oracle (26 guard.test.sh assertions + D-10 missing-artifact) | VERIFIED | 27 tests, all pass in vitest run. |
| `hooks/hooks.json` | PreToolUse repointed to guard.js (not guard.mjs) | VERIFIED | References `guard.js`. `guard.mjs` reference absent. |
| `install/install.ts` | single TS installer, GRUGOPS_HOME present, tools/grugops seam | VERIFIED | Contains GRUGOPS_HOME, materializeRunnable(), tools/grugops path, D-11 seam comment. |
| `install/install.js` | committed compiled installer | VERIFIED | Present, LF. Freshness gate green. |
| `install/uninstall.ts` | TS uninstaller, is_protected denylist | VERIFIED | `isProtected` function present. CR-01 bounded removal ported. |
| `install/uninstall.js` | committed compiled uninstaller | VERIFIED | Present. |
| `install/install.test.ts` | Vitest harness with D-08 marker | VERIFIED | D-08 token present. 21 passing + 1 intentional skip. `mkdtempSync` hermetic fixtures confirmed. |
| `scripts/validate-agent-factory.ts` | two-root validator with VALIDATE_KIT_ROOT C3 guard | VERIFIED | Live test: `VALIDATE_KIT_ROOT= node scripts/validate-agent-factory.js` exits 1 with `(C3)` message. |
| `scripts/validate-agent-factory.js` | committed compiled validator | VERIFIED | Present, LF. |
| `scripts/generate-asvs-checklist.ts` | byte-reproducible 345-row ASVS generator | VERIFIED | Contains "345". `node scripts/generate-asvs-checklist.js` exits 0. Byte-reproducibility proven in 15-04-SUMMARY. |
| `scripts/generate-asvs-checklist.js` | committed compiled generator | VERIFIED | Present. |
| `scripts/check-foundation-guards.ts` | six-guard aggregator, ROLE_FILES list, WARN-never-fails | VERIFIED | ROLE_FILES constant present. `node scripts/check-foundation-guards.js` exits 0, ALL CHECKS PASSED. |
| `scripts/check-foundation-guards.js` | committed compiled guard checker | VERIFIED | Present. Live run exits 0. |
| `scripts/check-kit-refs.ts` | kit-ref checker over explicit SCAN set | VERIFIED | SCAN constant present. `node scripts/check-kit-refs.js` exits 0, ALL CHECKS PASSED. **WARNING (WR-04):** no `check-kit-refs.test.ts` — the non-trivial walk/filter logic is untested by a planted-regression harness. This is documented in 15-REVIEW.md. |
| `scripts/check-kit-refs.js` | committed compiled kit-ref checker | VERIFIED | Present. Live run exits 0. |
| `scripts/validate.test.ts` | 21-case Vitest harness (C3/CR-03/two-root/strict) | VERIFIED | 21 tests pass. C3 unset-kit case confirmed live. |
| `scripts/check-foundation-guards.test.ts` | 21-case plant-one-violation-per-guard harness | VERIFIED | 21 tests pass. |
| `scripts/generate-asvs-checklist.test.ts` | 3-case write/byte-reproducible/fail-closed harness | VERIFIED | 3 tests pass. |
| `scripts/runnable-ref/reference-check.ts` | TOOL-02 reference runnable, node: builtins only, D-12 contract | VERIFIED | Live: clean.txt→exit 0 ("No findings."), bad.txt→exit 1 (finding printed). |
| `scripts/runnable-ref/reference-check.js` | committed compiled reference runnable | VERIFIED | Present. Live exits 0/1 as expected. |
| `scripts/runnable-ref/fixtures/bad.txt` | planted RED fixture (exits 1) | VERIFIED | Contains FORBIDDEN token. Confirmed exit 1 in live run. |
| `scripts/runnable-ref/reference-check.test.ts` | 7-case Vitest harness incl. host-emulation | VERIFIED | 7 tests pass, incl. host-emulation (no node_modules). |
| `CLAUDE.md` | D-13 constraint amendment recording TS pivot | VERIFIED | Line 14 Constraints + lines 35-38 Recommended Stack updated. **WARNING:** line 56 in GSD:stack block still references `scripts/validate-agent-factory.mjs` (deleted file). This is in a GSD-generated documentation section, not the D-13 Constraints amendment itself. See Human Verification. |
| `.planning/PROJECT.md` | amended constraint + Key Decisions row for TS pivot | VERIFIED | Line 106 (foundational constraint) + line 137 (Key Decisions row) both record the TS pivot with D-13 date and four pillars. |
| `install/README.md` | single Node-required install.js documented, dual-installer language removed | VERIFIED | Documents `node install/install.js`, Node 22+ prerequisite. No POSIX install.sh / byte-parity language. |
| No .sh/.mjs/.test.sh originals under install/scripts/hooks | D-09 deletion confirmed | VERIFIED | `git ls-files '*.test.sh'` returns nothing. `git ls-files 'install/*.sh' 'scripts/*.mjs' 'hooks/*.mjs'` returns nothing. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `hooks/hooks.json` | `hooks/guard.js` | PreToolUse Bash matcher `node …/guard.js` | VERIFIED | Confirmed by grep: `guard.js` present, `guard.mjs` absent. |
| `hooks/guard.test.ts` | `hooks/guard.js` | `spawnSync("node", [join(...,"guard.js")])` | VERIFIED | `spawnSync` count ≥ 3 in guard.test.ts, all targeting `guard.js`. |
| `hooks/guard.ts SELF_APPROVE + APPROVAL` | deny path | self-approve checked before deploy gate | VERIFIED | Live test: inline `export GRUGOPS_PROD_DEPLOY_APPROVED=1 && kubectl apply` still denied. |
| `install/install.ts materializeRunnable` | `tools/grugops/<routine>.js` (host committed path) | additive copy at reserved seam between seedState and writeMarker | VERIFIED | `grep "tools/grugops" install/install.ts` returns results at line 701. Call at line 816, between seedState() (line ~809) and writeMarker() (line ~819). |
| `scripts/generate-asvs-checklist.ts` | `agent-factory/checklists/security-nfr-checklist.md` | `writeFileSync` deterministic `lines.join("\n")` | VERIFIED | Security checklist provenance header now reads `node scripts/generate-asvs-checklist.js` (re-pointed in Plan 06 Task 1). |
| `scripts/validate.test.ts` | `scripts/validate-agent-factory.js` | `spawnSync` with `VALIDATE_KIT_ROOT` | VERIFIED | 21 tests pass; C3 unset-kit case confirmed live. |
| `CLAUDE.md + PROJECT.md amendment` | `12/13/14-CONTEXT.md HELD notes` | "superseded" annotation | VERIFIED | All three CONTEXT files carry "SUPERSEDED by the Phase-15 TypeScript pivot (D-13, ratified 2026-06-13)" with original text preserved. |

### Data-Flow Trace (Level 4)

Not applicable for this phase — no components rendering dynamic data. All artifacts are CLI tools/guards/tests.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| tsc --noEmit type-check clean | `npx tsc --noEmit` | exit 0, no output | PASS |
| freshness gate: committed .js match fresh build | `node scripts/freshness.js` | exit 0, "All build outputs fresh: 9 committed .js file(s)" | PASS |
| Full Vitest suite (103 pass, 1 D-08 skip) | `npx vitest run` | exit 0, 103 passed, 1 skipped | PASS |
| Foundation guards clean on real tree | `node scripts/check-foundation-guards.js` | exit 0, ALL CHECKS PASSED | PASS |
| Kit-refs clean on real tree | `node scripts/check-kit-refs.js` | exit 0, ALL CHECKS PASSED | PASS |
| C3 fail-closed guard (VALIDATE_KIT_ROOT unset) | `VALIDATE_KIT_ROOT= node scripts/validate-agent-factory.js` | exit 1, stdout "(C3)" | PASS |
| Guard deny unapproved deploy | `printf '{"tool_input":{"command":"kubectl apply -f deploy.yaml"}}' \| node hooks/guard.js` | exit 0, stdout contains `"permissionDecision":"deny"` | PASS |
| Guard allow human-approved deploy | Same + `GRUGOPS_PROD_DEPLOY_APPROVED=1` env | exit 0, stdout does NOT contain "deny" | PASS |
| Reference routine D-12 exit 0 on clean | `node scripts/runnable-ref/reference-check.js scripts/runnable-ref/fixtures/clean.txt` | exit 0, "No findings." | PASS |
| Reference routine D-12 exit 1 on bad | `node scripts/runnable-ref/reference-check.js scripts/runnable-ref/fixtures/bad.txt` | exit 1, finding printed | PASS |
| D-09: no .sh/.mjs originals in git | `git ls-files '*.test.sh'` + `.sh`/`.mjs` checks | all return empty | PASS |
| GRUGOPS_PROD_DEPLOY_APPROVED byte-identical in guard.ts and guard.js | `grep -c "GRUGOPS_PROD_DEPLOY_APPROVED" hooks/guard.ts` + `hooks/guard.js` | 4 occurrences in each | PASS |

### Probe Execution

Not applicable — no probe-*.sh scripts in this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| TOOL-01 | Plans 15-01 through 15-06 | grugops's tooling layer is TypeScript, executed cross-platform with explicit build+dep posture; existing scripts migrated at behavior parity | SATISFIED | All 6 .ts/.js pairs committed, freshness gate green, vitest suite green (103/104), no POSIX/.mjs originals remain, D-09 confirmed. REQUIREMENTS.md marks Complete with detailed evidence. |
| TOOL-02 | Plan 15-05 | Kit-shipped-runnable convention proven end-to-end | SATISFIED | `reference-check.ts`/`.js` + D-12 contract proven (exit 0/1/2 + --json). `materializeRunnable()` in install.ts at reserved seam. Host-emulation test (bare Node, no node_modules) passes. REQUIREMENTS.md marks Complete. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `CLAUDE.md` | 56 | `scripts/validate-agent-factory.mjs` reference in GSD:stack-start block — file was deleted in Plan 06 (D-09) | WARNING | Stale invocation string pointing to a deleted file, inside a GSD-generated stack documentation block that explicitly excluded CLAUDE.md from the invocation-string sweep scope. Not caught by check-kit-refs.ts (CLAUDE.md is excluded from its SCAN set by design). Does not affect runtime behavior but could mislead an agent reading CLAUDE.md's Development Tools table. |
| `scripts/check-kit-refs.ts` | whole file | No paired `check-kit-refs.test.ts` (WR-04 from 15-REVIEW.md) | WARNING | Non-trivial hand-rolled recursive `walk()` + `filter()` logic untested by a planted-regression harness. Real-tree smoke `node scripts/check-kit-refs.js` exits 0 but cannot prove the logic still fails red on a regression. Every other ported tool has a RED-by-design harness; this one does not. The REVIEW.md documents this gap with a suggested fix. |

No TBD/FIXME/XXX markers found in phase-modified source files.

### Human Verification Required

#### 1. SC3 Workflow Invocation Scope

**Test:** Read SC3: "A kit-shipped-runnable convention exists and is documented: how a TS routine ships inside the kit, is materialized by the installer, and is invoked cross-platform from a workflow step." Determine whether "invoked cross-platform from a workflow step" requires a concrete `node tools/grugops/<routine>.js` call to be present in an `agent-factory/workflows/*.md` file within Phase 15.
**Expected:** If Phase 15's scope is the CONVENTION itself (proven by the reference routine + D-12 contract + D-11 materialization), then SC3 is met — the workflow invocation step is Phase 16's deliverable (the §14 gate test-integrity checker). If SC3 requires a workflow step to be present NOW, this is a gap.
**Why human:** The SC3 wording is ambiguous about phase boundary. No workflow currently references `node tools/grugops/` invocation. The Phase 16 pre-decisions document confirms Phase 16 is the first production use. This is a scope interpretation decision.

#### 2. Stale `validate-agent-factory.mjs` reference in CLAUDE.md

**Test:** Read CLAUDE.md lines 50-60 (the GSD:stack-start block's Development Tools table). Line 56 references `scripts/validate-agent-factory.mjs` as the grugops structure validator. This file was deleted in Plan 06 (D-09). Determine whether this constitutes a gap in the SC4 invocation-string sweep or is acceptable as historical stack documentation.
**Expected:** The D-13 Constraints amendment on line 14 is correct. The stale ref is in the GSD-generated spec block, not the active constraint text. The Plan 06 invocation sweep explicitly excluded CLAUDE.md from its grep scope. The `check-kit-refs.ts` gate also excludes CLAUDE.md from its SCAN set by design. Accept or flag as a required fix.
**Why human:** Whether this reference in the GSD:stack block constitutes a "shipped invocation string" (sends an agent/user to a deleted file) or is spec documentation (historical narration of the tool's prior form) is a scope judgment call.

---

### Gaps Summary

No hard FAILED truths. Two WARNINGS from the code review are noted:

1. **WR-04 (from 15-REVIEW.md):** `check-kit-refs.ts` has no `check-kit-refs.test.ts` planted-regression harness. The non-trivial walk/filter logic is exercised only by the real-tree smoke. Every other ported tool has a RED-by-design Vitest harness; this one does not. The REVIEW recommends adding `check-kit-refs.test.ts` with a plant-one-violation-per-assertion suite.

2. **Stale reference in CLAUDE.md line 56:** `scripts/validate-agent-factory.mjs` in the GSD:stack-start Development Tools table. File was deleted; invocation-string sweep did not cover this block. Needs human judgment on materiality.

Both items are escalated to human verification rather than marked FAILED, because: (a) the tools themselves work correctly on the real tree, (b) the REVIEW already documents and suggests fixes, and (c) the scope of the invocation sweep and check-kit-refs.ts SCAN set were explicit design decisions.

All live gates pass. TOOL-01 and TOOL-02 are complete. The D-13 amendment is ratified and human-approved. The safety guard (GRUGOPS_PROD_DEPLOY_APPROVED) is byte-identical. D-09 is confirmed. Vitest: 103/104 (1 intentional D-08 skip).

---

_Verified: 2026-06-13T23:55:00Z_
_Verifier: Claude (gsd-verifier)_

---
phase: 28-kit-consistency-audit
verified: 2026-08-12T20:10:11Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 28: Kit Consistency Audit Verification Report

**Phase Goal:** The kit describes the architecture it actually ships, every role and workflow has been read with a recorded verdict, and every public safety claim carries an id — so a later phase has something concrete to void.
**Verified:** 2026-08-12T20:10:11Z
**Status:** passed
**Re-verification:** No — initial verification

## Method

This report does not trust 28-01 through 28-08's SUMMARY.md claims, 28-REVIEW-FIX.md's claims, or
28-UAT.md's claims as evidence on their own. Every gate cited below was **re-invoked directly by
this verifier**, in this session, with its own exit code captured — not read from a prior transcript
and not piped through a filter that could swallow a non-zero exit. Where a gate prints a computed
count (e.g. "36 counted register rows"), that count is the gate's own live output, not a copy from a
SUMMARY. Artifact existence, file counts (`ls agent-factory/roles | wc -l`), and content (grep over
the actual committed bytes) were checked independently of any plan's narration.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Each of the 17 roles + 19 workflows has a recorded disposition; dispositions count equals derivation count (36, with the 37th `_role-switch-protocol.md` row explicitly present and uncounted) | ✓ VERIFIED | `node scripts/check-audit-register.js` → exit 0, live PASS line: "equality one holds — 36 counted register row(s) set-equal in both directions to 36 derived file(s) (17 roles + 19 workflows); equality two holds — Table A declares 32 finding(s) and Table B carries 32... 1 uncounted row(s) recorded by name (agent-factory/roles/_role-switch-protocol.md...)". Independently confirmed: `ls agent-factory/roles \| wc -l` = 18 (17 + 1 underscore file), `ls agent-factory/workflows \| wc -l` = 19; `grep -c "^| agent-factory/roles/"` on the register = 18, `grep -c "^| agent-factory/workflows/"` = 19 (37 total). Spot-checked 6 role/workflow rows directly (`orchestrator.md`, workflows 00–18): every observation is a substantive, file-specific paragraph, not a bare word — no "clean" or "—" standing in for a verdict, satisfying D-19/the anti-narration prohibition. `check-audit-register.js` PASS line also confirms `docs/audit/28-safety-surface-exclusions.md` is byte-identical to a fresh regeneration (re-ran `npm run generate:safety-surface` myself; `git status --porcelain` on the file is empty). |
| 2 | `CLAUDE.md` describes the v2.0 architecture the repo actually has: no handoff packets, Orchestrator decomposes rather than routes | ✓ VERIFIED | `node scripts/check-public-docs-vocabulary.js` → exit 0, PASS: "10 public document(s) carry zero retired vocabulary... 1 retired path form(s) and 2 retired prose form(s) checked". Read `CLAUDE.md` directly: line 6 reads "One Orchestrator (the 'head grug') decomposes each request into subtasks and enqueues them on a shared queue... No agent hands data to another; the shared verified context is the only memory between them." One known, explicitly-recorded residual: `CLAUDE.md:33`'s GSD-generated stack table still contains the bare word "handoffs" in a list ("roles, workflows, handoffs, checklists") — this is inside an auto-regenerated `<!-- GSD:stack-start -->` block, is not a `RETIRED_PROSE_FORMS` guard hit (D-10 forbids widening the matcher to a bare word), and 28-05-SUMMARY.md's residuals table records the decision not to touch generated content for one prose word no gate holds. This is a documented, reasoned deviation, not a silent gap — and the guard that exists (the actual AUDIT-02 contract) passes clean. |
| 3 | Every public safety claim in `README.md`, `AGENTS.md`, `agent-factory/README.md` appears in a registry with an id | ✓ VERIFIED | `node scripts/check-claim-anchors.js` → exit 0, PASS: "38 registry row(s)... anchors found: AGENTS.md 11, README.md 9, agent-factory/README.md 17... all 4 safety floor(s) mapped". Read `docs/audit/28-claim-registry.md` directly: 38 `CLM`/`C-28-NNN` rows with id, verbatim text, file/line, kind, depends_on, status; 6 `kind: safety` rows each carry a `depends_on` naming a `SAFETY_FLOORS` mechanism; two-sided D-14 completeness (every floor mapped, every safety claim depends on something) is asserted by `audit-model.test.ts` and confirmed live. One residual honestly recorded rather than hidden: `AGENTS.md:29`'s "resolution and safety rule" (the KIT-vs-STATE block) is registered `kind: architecture` not `safety` because `SAFETY_FLOORS.length` is pinned at 4 and a fifth floor cannot be invented — the registry itself states the consequence ("Phase 30's claim-dropping... will therefore not reach the kit-write rule") rather than mislabeling the row to paper over it. This is exactly the "so a later phase has something concrete to void" framing the phase goal asks for. |
| 4 | `@playwright/test` / `@axe-core/playwright` pins match versions verified at time of change, with the verification recorded | ✓ VERIFIED | `docs/audit/28-residual-sizing.md` records `npm show @playwright/test version` → `1.62.1` and `npm show @axe-core/playwright version` → `4.12.1`, run 2026-08-11T14:57:35Z, with the roadmap's pre-named `1.62.0` explicitly flagged as diverging (measurement wins, divergence recorded as F-28-A). Read the shipped checklists directly: `agent-factory/checklists/playwright-visual-regression-recipe.md:17,19` = `1.62.1` / `4.12.1`; `agent-factory/checklists/accessibility-checklist.md:20` = `4.12.1` — matching the measured values, not the roadmap's stale pre-named ones. Each site carries "(version verified against the npm registry 2026-08-11; check for a newer one before you pin)". |

**Score:** 4/4 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

All 32 artifacts declared across the 8 plans' `must_haves.artifacts` exist on disk (verified by direct `[ -f ... ]` check, not by trusting SUMMARY file lists): `scripts/dead-vocabulary.ts`, `scripts/check-public-docs-vocabulary.{ts,js,test.ts}`, `scripts/check-uat-oracles.{ts,js,test.ts}`, `scripts/audit-model.{ts,js,test.ts}`, `scripts/audit-prepass.{ts,js,test.ts}`, `scripts/check-audit-register.{ts,js,test.ts}`, `docs/audit/28-disposition-register.md`, `docs/audit/28-prepass-evidence.md`, `docs/audit/28-claim-registry.md`, `scripts/check-claim-anchors.{ts,js,test.ts}`, `docs/audit/28-residual-sizing.md`, `scripts/generate-safety-surface.{ts,js,test.ts}`, `docs/audit/28-safety-surface-exclusions.md`, `scripts/canonical-frontmatter.ts`, `scripts/canonical-corpus.{ts,js,test.ts}`, `scripts/frontmatter.test.ts`. All are non-stub: every gate script runs and produces a real PASS/FAIL decision against live tree state (verified by direct invocation below), and every `docs/audit/*.md` artifact carries substantive, file-specific content (spot-checked, not "TBD").

### Key Link Verification (re-executed live, not read from a prior transcript)

| From | To | Via | Status |
|---|---|---|---|
| `scripts/dead-vocabulary.ts` | `scripts/check-public-docs-vocabulary.ts` | import, no literal copy | ✓ WIRED — `node scripts/check-public-docs-vocabulary.js` exits 0, reads "both read whole from scripts/dead-vocabulary.ts" |
| `scripts/check-public-docs-vocabulary.js` | `.github/workflows/ci.yml` + `package.json` | gate wired at both ends | ✓ WIRED — `grep` confirms `check:public-docs` script and a `node scripts/check-public-docs-vocabulary.js` line inside `ci.yml` |
| `scripts/check-uat-oracles.ts` | `scripts/check-foundation-guards.ts` | `uatOracleFails()` import | ✓ WIRED — `check-foundation-guards.ts:222-223` imports `uatOracleFails`; `node scripts/check-foundation-guards.js` (re-run live) exits 0 and prints the 3 oracle PASS lines |
| `scripts/kit-model.ts` listRoles/listWorkflows | `scripts/audit-model.ts` | import, no second lister | ✓ WIRED — `check-audit-register.js`'s live PASS line derives its 17/19 counts through this path (no independent hand-count found anywhere in the register-producing scripts) |
| `docs/audit/28-disposition-register.md` | `scripts/check-audit-register.ts` | markdown parsed by a gate, fail-closed | ✓ WIRED — re-ran the gate, exit 0, both D-03 equalities computed live |
| `docs/audit/28-claim-registry.md` `depends_on` | `scripts/audit-model.ts` `SAFETY_FLOORS` | live config-sourced floor names | ✓ WIRED — `check-claim-anchors.js` reports "all 4 safety floor(s) mapped" |
| `<!-- claim: C-28-NNN -->` anchors | `scripts/check-claim-anchors.ts` | byte-identical bijection | ✓ WIRED — re-run, exit 0, "38 verbatim comparison(s) performed, all byte-identical" |
| `docs/audit/28-disposition-register.md` `safety_surface` + registry `kind: safety` | `scripts/generate-safety-surface.ts` | derived union, freshness-gated | ✓ WIRED — re-ran `npm run generate:safety-surface`, output byte-identical to committed file (`git status --porcelain` empty on the target) |
| `npm show` transcript | shipped checklist pins | measured, not inherited | ✓ WIRED — checklist values (`1.62.1`, `4.12.1`) match the measured transcript, not the roadmap's stale pre-named values |

### Live Gate Execution (this session, direct invocation, exit code captured)

| Gate | Command | Result |
|---|---|---|
| Build freshness | `npm run freshness` | exit 0 — "43 committed .js file(s) match a fresh tsc rebuild" |
| AUDIT-02 drift guard | `node scripts/check-public-docs-vocabulary.js` | exit 0 — ALL CHECKS PASSED |
| AUDIT-01 completeness | `node scripts/check-audit-register.js` | exit 0 — ALL CHECKS PASSED, both D-03 equalities hold |
| AUDIT-03 bijection | `node scripts/check-claim-anchors.js` | exit 0 — ALL CHECKS PASSED |
| Foundation guards (incl. `uatOracleFails`, `KIT-03`, Phase-19 Tier-1 oracles) | `node scripts/check-foundation-guards.js` | exit 0 — ALL CHECKS PASSED |
| NUL-byte gate (28-08 new gate) | `node scripts/check-nul-bytes.js` | exit 0 — 1457 tracked files scanned, zero NULs |
| Safety-surface freshness | `node scripts/generate-safety-surface.js` then `git status --porcelain` | exit 0, no diff — deterministic regeneration confirmed |
| Structure validator | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 — ALL CHECKS PASSED |
| Kit-reference scan | `node scripts/check-kit-refs.js` | exit 0 — ALL CHECKS PASSED |

**Regression suite:** already established at HEAD `4ec6067` this session per the orchestrator's ground truth (`npx vitest run --exclude '**/scripts/e2e/**'` → 46 files, 1596 passed, 2 skipped, 0 failed, exit 0). Not re-run here to avoid duplicating that evidence. `npm test` (the live claude-CLI e2e lane) was deliberately **not** run — it is `UNKNOWN - verify` and is not part of any AUDIT-01..04 success criterion, so its absence does not block this phase's goal.

### Anti-Patterns Found

None. Scanned all new/modified TypeScript scripts and `docs/audit/*.md` for `TBD`/`FIXME`/`XXX` — zero hits. No stub gate bodies (every gate produces a real, live, tree-dependent verdict, confirmed by direct invocation above, not by reading source and assuming). No bare-word "clean" register observations found in a spot-check of 6 rows; the register's own prose explicitly prohibits this (D-19/"no observation consists only of a word asserting an absence of findings") and the gate structurally cannot detect a violation of that rule for content quality — this verifier read actual row text to confirm it, and found it substantive.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
|---|---|---|---|
| AUDIT-01 | 28-02 (D-19 owner assignment), 28-03, 28-06, 28-07, 28-08 | ✓ SATISFIED | Register complete, gate green, both D-03 equalities hold live |
| AUDIT-02 | 28-01 (tracer), 28-05 (fix) | ✓ SATISFIED | Drift guard green; CLAUDE.md content matches v2.0 architecture; one bare-word residual documented and reasoned |
| AUDIT-03 | 28-04 | ✓ SATISFIED | Claim registry complete, anchor bijection green, all safety floors mapped |
| AUDIT-04 | 28-02 | ✓ SATISFIED | Pins measured at execution time, divergence from roadmap recorded, checklists updated to measured values |

No orphaned requirements: REQUIREMENTS.md's `AUDIT-01`..`AUDIT-04` rows all trace to a plan's `requirements:` frontmatter field, and no additional Phase-28-mapped requirement ID appears in REQUIREMENTS.md that isn't claimed by a plan.

### Notes — residuals recorded by the phase itself, not gaps against its own success criteria

The phase's own audit process surfaced three "ownerless" findings during its final UAT pass (independently re-confirmed here by reading the cited lines): `CLAUDE.md:39` names a root `VERSION` file that does not exist; `CLAUDE.md` uses `/grug` eleven times where the kit ships `grugops`/`grugops-*` skill names; and `AGENTS.md`'s kit-write rule is called "a resolution and safety rule" but is registered `kind: architecture` because a 5th `SAFETY_FLOORS` member cannot be invented. None of these fall inside AUDIT-03's explicit three-file scope in a way the registry's own contract requires (CLAUDE.md is not one of the three files AUDIT-03 names; the AGENTS.md item is recorded with its exact consequence stated for Phase 30 rather than mislabeled). These are exactly the kind of "recorded and named residual" the phase goal calls for ("so a later phase has something concrete to void") and are not blockers to Phase 28's own success criteria as literally written in ROADMAP.md.

### Human Verification Required

None. All four success criteria are backed by live-executed gates plus direct content inspection performed in this verification session, not by SUMMARY narration. 28-UAT.md's own 19 checkpoints (independently spot-checked here rather than accepted at face value — gates re-run, file counts re-derived, checklist pin values re-read) already exercised the adversarial cases (blanked observation, missing file row, second uncounted row, mutated anchor text, mutated unanchorable manifest field, flipped `safety_surface` flag, planted NUL byte) with before/control/after/revert transcripts, and this verifier's independent re-execution of the non-destructive gates confirms the same green state at the current HEAD.

### Gaps Summary

No gaps found. All four ROADMAP.md success criteria for Phase 28 are demonstrated true against the live tree in this session: the disposition register is complete and gate-enforced (36/36 counted, 37 total, both D-03 equalities green); CLAUDE.md's architecture description matches the shipped decompose-and-enqueue / shared-verified-context system with one documented, reasoned bare-word residual inside a GSD-generated block; the claim registry maps every public safety claim across the three named files to an id and a floor, with the anchor bijection gate proving it survives future prose edits; and the third-party pins are the values measured at execution time (`1.62.1`/`4.12.1`), with the divergence from the roadmap's stale pre-named `1.62.0` explicitly recorded rather than silently inherited.

---

_Verified: 2026-08-12T20:10:11Z_
_Verifier: Claude (gsd-verifier)_

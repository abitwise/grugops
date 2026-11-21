---
phase: 43-story-and-layered-docs
verified: 2026-11-18T17:00:00Z
status: passed
score: 6/6 must-haves verified
covered_files:
  - ".planning/phases/43-story-and-layered-docs/43-01-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-01-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-02-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-02-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-03-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-03-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-04-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-04-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-05-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-05-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-06-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-06-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-07-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-07-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-08-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-08-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-09-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-09-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-10-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-10-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-11-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-11-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-12-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-12-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-13-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-13-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-14-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-14-SUMMARY.md"
  - ".planning/phases/43-story-and-layered-docs/43-15-PLAN.md"
  - ".planning/phases/43-story-and-layered-docs/43-15-SUMMARY.md"
  - "CLAUDE.md"
  - "README.md"
  - "docs/README.md"
  - "docs/audit/28-claim-registry.md"
  - "docs/concepts.md"
  - "docs/faq.md"
  - "docs/how-it-works.md"
  - "docs/reference/README.md"
  - "docs/usage.md"
  - "install/install-marker.ts"
  - "install/install.ts"
  - "install/kit-source.ts"
  - "scripts/catalog-freshness.ts"
  - "scripts/check-story-docs.ts"
  - "scripts/generate-catalog.ts"
covered_digest: "v3:sha256:421ad29d0f9b5e8882b0d121564cdcfc29f51309ab47637903b3128fea05eb1a"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Give README.md, docs/concepts.md, docs/how-it-works.md and docs/usage.md to a reader who has not seen grugops and ask what grugops is, how to install it and how to start a job (reader-review item 10, finding F-11)."
    expected: "The reader can say what grugops is, that it sits on top of their coding agent, how to install it, what to type on their host, and who decides merge and deploy, without help."
    why_human: "Comprehension by a newcomer is the phase goal itself. 43-READER-REVIEW.md left item 10 as UNKNOWN - verify on all 18 pages; no grep or gate can measure it."
---

# Phase 43: Story and layered docs Verification Report

**Phase Goal:** A newcomer understands what grugops is and how to use it from the README and main docs, reaches a generated reference page for every agent and skill, and finds every claim honest
**Verified:** 2026-11-18
**Status:** human_needed
**Re-verification:** No, initial verification

All six roadmap success criteria hold in the codebase. Status is `human_needed` rather than `passed` for one reason: the phase goal is a newcomer's understanding, and nobody has yet done that read (F-11). Four known deferred items are listed below as warnings. None of them breaks a must-have.

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|---|---|---|
| 1 | README opens with "grugops — Specialist agents. Shared context. Coordinated work." in lowercase brand and no longer says "the simple software factory" (STORY-01) | ✓ VERIFIED | `README.md` line 11 (`# grugops — Specialist agents. Shared context. Coordinated work.`, anchored C-28-069) followed by a plain story (C-28-070). `grep "simple software factory" README.md docs/` hits only `docs/audit/` (the retired-row text) and `docs/initial/` (brand history). `check-story-docs` check "STORY-01 README tagline" PASS (0 findings over 1/1). C-28-002/003/008 are `status: retired` and `check-claim-anchors` absence-checks them (3 absence checks). |
| 2 | Main docs explain how it works and the core concept, walk through usage flows with worked examples, and link to every agent and skill page (STORY-02) | ✓ VERIFIED | `docs/concepts.md`, `docs/how-it-works.md` (mermaid plus numbered steps) and `docs/usage.md` (start table, host usage, commands, 7 jobs) exist and are substantive. README "Where to go next" links all three plus `docs/reference/README.md`. Five worked examples in `examples/`. Loop over `docs/reference/agents/*.md` and `skills/*.md`: every page is linked from `docs/reference/README.md` (no "NOT LINKED" output). `check-story-docs` "shipped links" PASS, 0 findings over 41/41. Docs and examples ship into the kit home (`SHIPPED_DOCS_ROOTS = ["docs","examples"]`, `install/kit-source.ts:456`). `install/installer-kit-home.test.ts` passes. |
| 3 | Every agent and skill has a reference page generated from its role or skill file, and a gate fails when a page is missing or stale (STORY-03) | ✓ VERIFIED | 19 role pages in `docs/reference/agents/` match the 19 role files (excluding `_role-switch-protocol.md`). 7 skill pages in `docs/reference/skills/` match the 7 skill directories. Each carries the `GENERATED — do not hand-edit` header. `node scripts/catalog-freshness.js` exits 0: "compared 27 page(s), 0 difference(s)". Gate wired in `package.json` (`freshness:catalog`) and `.github/workflows/ci.yml:189`. `scripts/catalog-freshness.test.ts` passes, covering EXTRA, MISSING and STALE cases. |
| 4 | Every new public page was inside the claim registry's checked file set before it was written; every moved claim was re-dispositioned by id, never deleted (STORY-04) | ✓ VERIFIED | Join commit `cfd56f60` (2026-11-17 23:02, ancestor of HEAD) precedes the first-add of `docs/concepts.md` (155bd9b9), `docs/usage.md` (c56b346e), `docs/reference/agents/tech-lead.md` (5b34e14c) and `docs/reference/skills/plan.md` (6ba6bc77); `git merge-base --is-ancestor` confirmed each. `docs/README.md` and the README were rewritten, not new. `check-claim-anchors`: 74 rows from 74 headings, 71 verbatim comparisons byte-identical, 3 retired rows absence-checked, anchors found in docs/concepts.md 6, docs/how-it-works.md 9, docs/usage.md 15, docs/faq.md 2. C-28-001 and C-28-033 are present under their original ids at the new homes. `check-public-docs-vocabulary` covers 44 documents, `check-banned-claims` 161, both PASS. |
| 5 | Docs state open gaps honestly (own-session spawn capture `UNKNOWN - verify`), make no cost or token-saving claims, and CLAUDE.md no longer names `/grug` (STORY-05) | ✓ VERIFIED | `docs/how-it-works.md:94` states the own-session capture is `UNKNOWN - verify` (GAP-D1); `check-story-docs` GAP-D1 check PASS over 46/46 elements. `grep -i "token\|cheaper\|cost\|saving"` over README and the main docs returns nothing, and `check-banned-claims` PASS. `grep "/grug[^o]" CLAUDE.md` returns nothing and the `/grug` check is PASS. |
| 6 | Milestone UAT carried from Phase 39 tests 10 and 14 on a live Claude Code host | ✓ VERIFIED (human-accepted) | `43-UAT.md` status `complete`. Test 10: six headless runs, 19 level-adapter-eligible spawns; mid and junior reached only after a Tech Lead `decision` note named that exact adapter; no level adapter spawned before a plan, none reached senior. Test 14: Designer ran `node tools/grugops/note.js add ... --kind decision` and the note was admitted (`noted uat-design-001 ...`). Both marked "accepted (human decision 2026-11-18, option A)". Limits are stated, not hidden: run 6 hit the 20-minute bound; the route was reworded from `scripts/context-io.js` to `tools/grugops/note.js` by the human. I did not re-run the live host; this rests on the evidence in `uat-evidence/` and the human's typed acceptance. |

**Score:** 6/6 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `README.md` | Front door with new tagline and story | ✓ VERIFIED | Wired to docs pages and registry anchors |
| `docs/concepts.md`, `docs/how-it-works.md`, `docs/usage.md`, `docs/README.md`, `docs/faq.md` | Layered docs | ✓ VERIFIED | Substantive; linked from README; in claim-gate corpus |
| `docs/reference/README.md` plus 19 agent and 7 skill pages | Generated reference | ✓ VERIFIED | Fresh against generator; every page linked from the index |
| `scripts/generate-catalog.ts`, `scripts/catalog-freshness.ts` (+ committed `.js`) | Generator and freshness gate | ✓ VERIFIED | Gate runs, exits 0, wired in CI |
| `scripts/check-story-docs.ts` (+ `.js`) | Story-docs gate | ✓ VERIFIED | Four checks PASS; in `package.json` and `ci.yml:332` |
| `install/kit-source.ts`, `install/install.ts`, `install/install-marker.ts` | Docs and examples ship to the kit home | ✓ VERIFIED | `installer-kit-home.test.ts` passes |
| `docs/audit/28-claim-registry.md` | `retired` status, moved rows | ✓ VERIFIED | `check-claim-anchors` PASS |
| `examples/01..05` | v3 worked examples | ✓ VERIFIED | In the hand-trace scan set (SCAN_SET_SIZE 85); public-docs gate PASS |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| README.md | docs/usage.md, how-it-works.md, concepts.md, reference/README.md | markdown links | WIRED | `check-story-docs` shipped-links PASS (41/41) |
| docs/reference/README.md | every agent and skill page | tables | WIRED | Loop found no unlinked page |
| generate-catalog | docs/reference/** | committed output equals regeneration | WIRED | `catalog-freshness` 0 differences |
| shippedDocs() | public-docs and banned-claims corpora | `install/kit-source.js` import | WIRED | Gate counts include docs (44 and 161 documents) |
| docs/ and examples/ | kit home | `copyKit` over `KIT_ENTRY_PATHS` | WIRED | Kit-home test passes |

### Data-Flow Trace (Level 4)

Not applicable. The artifacts are static documents plus a deterministic generator. Generator output equalling the committed pages (0 differences) is the data-flow proof.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Story-docs gate | `node scripts/check-story-docs.js` | ALL CHECKS PASSED, exit 0 | ✓ PASS |
| Public-docs vocabulary | `node scripts/check-public-docs-vocabulary.js` | 44 documents, zero retired vocabulary, exit 0 | ✓ PASS |
| Banned claims | `node scripts/check-banned-claims.js` | 161 documents, exit 0 | ✓ PASS |
| Claim anchors | `node scripts/check-claim-anchors.js` | 74 rows, 71 byte-identical comparisons, exit 0 | ✓ PASS |
| Reference freshness | `node scripts/catalog-freshness.js` | 27 pages, 0 differences, exit 0 | ✓ PASS |
| Targeted tests | `npx vitest run install/installer-kit-home.test.ts scripts/check-story-docs.test.ts scripts/catalog-freshness.test.ts scripts/check-claim-anchors.test.ts` | 4 files, 184 tests passed | ✓ PASS |
| Full suite and `tsc --noEmit` | not re-run (orchestrator: 12038 tests, 21 failures all in `43-BASELINE.md`, 0 new; tsc exit 0) | taken from orchestrator | not independently verified |

### Probe Execution

No phase-declared probe scripts. Step 7c does not apply.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|---|---|---|---|---|
| STORY-01 | 43-10, 43-11 | README tagline, replaces "simple software factory" | ✓ SATISFIED | Truth 1 |
| STORY-02 | 43-02..43-12, 43-14, 43-15 | How it works, concept, usage flows, worked examples, links to every page | ✓ SATISFIED | Truth 2 |
| STORY-03 | 43-04, 43-05, 43-14 | Generated page per agent and skill, freshness gate | ✓ SATISFIED | Truth 3 |
| STORY-04 | 43-01, 43-02, 43-09, 43-10, 43-11, 43-12 | New pages in checked set first; moved claims keep ids | ✓ SATISFIED | Truth 4 |
| STORY-05 | 43-02, 43-03, 43-07, 43-08, 43-09, 43-12 | Honest gaps, no cost claims, no `/grug` in CLAUDE.md | ✓ SATISFIED | Truth 5 |

All five IDs appear in `REQUIREMENTS.md` (lines 83-87, marked `[x]`; traceability lines 164-168 say Complete). No orphaned requirements: only STORY-01..05 map to Phase 43.

### Anti-Patterns Found

None blocking. I scanned for `TBD|FIXME|XXX` in the phase's new gate sources, the new docs and the reference pages and found no unreferenced debt markers. The reference pages' `UNKNOWN - verify` entries are deliberate.

### Human Verification Required

#### 1. Fresh-reader comprehension (F-11)

**Test:** Give README.md, docs/concepts.md, docs/how-it-works.md and docs/usage.md to a reader who has not seen grugops. Ask what grugops is, how to install it and how to start a job.
**Expected:** The reader answers all three correctly without help.
**Why human:** Newcomer understanding is the phase goal. `43-READER-REVIEW.md` left item 10 as `UNKNOWN - verify` on every page.

### Gaps Summary

No blocking gaps. Known open items, all human-triaged and logged. Reported as warnings, not as new gaps:

- **F-09 (WARNING, claim honesty):** the first clause of C-28-033 in `docs/how-it-works.md` ("accountable end to end") was flagged by the reader review and is not reworded. `deferred-items.md` records the decision.
- **F-10 (WARNING):** `docs/skills.md` and `install/README.md` are outside the claim registry's anchored set, so their absolutes are unregistered.
- **F-12 / IN-03 (WARNING):** the generator leaves the Compliance Officer and Installer pages at `Workflows: UNKNOWN - verify` (confirmed in both files). The Orchestrator's own page repeats "Loaded by the Orchestrator in turn" for non-Claude hosts beside the Launch text.
- **Other `always` copies (WARNING):** outside C-28-001 and C-28-023, `always` remains in `.claude-plugin/plugin.json` (C-28-038), generated adapter and skill text, `agent-factory/packaging/subagent.frontmatter.md` and `docs/dogfood-human-runbook.md`.
- **Code-review follow-ups:** WR-02 (GUARANTEES.md shipped at default checkpoints, worded as "this repository"), WR-03 (`CLAUDE.md:134` still names `grug-orchestrator`, a form the `/grug` check does not match; it comes from GSD `research/STACK.md`), IN-04 (the link check skips HTML hrefs and `<…>` targets). These are human-skipped and logged. WR-03 is outside the SC-5 text, which says only `/grug`.
- **Pre-existing and out of scope:** `check-flip-manifest` exits 1 since before the phase. `freshness:hook-manifest` and one `context-io.test.ts` case are logged in `deferred-items.md` as a 43-01 side effect; the orchestrator's suite shows no new failures against baseline. The fresh-install `npm test` collision with `tools/grugops/test-skip-integrity.js` is logged. The `docs/dogfood-human-runbook.md` "REAL proof" text is stale.

I could not independently re-run the 12038-test suite or the live-host UAT; both rest on the orchestrator's figures and the human-accepted evidence.

---

_Verified: 2026-11-18_
_Verifier: Claude (gsd-verifier)_

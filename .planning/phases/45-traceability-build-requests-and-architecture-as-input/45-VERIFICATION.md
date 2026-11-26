---
phase: 45-traceability-build-requests-and-architecture-as-input
verified: 2026-11-26T15:05:00Z
status: human_needed
score: 5/5 roadmap success criteria verified; 2 backstop truths and 7 judgment items routed to human
covered_files: [".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-01-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-01-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-02-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-02-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-03-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-03-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-04-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-04-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-05-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-05-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-06-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-06-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-07-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-07-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-08-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-08-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-09-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-09-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-10-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-10-SUMMARY.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-11-PLAN.md", ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-11-SUMMARY.md", "agent-factory/contracts/build-request.md", "agent-factory/workflows/00-bootstrap-greenfield.md", "agent-factory/workflows/20-upstream-sources.md", "install/state-layout.ts", "scripts/build-request-model.ts", "scripts/runnable-ref/upstream.ts", "scripts/upstream-git.ts", "scripts/upstream-model.ts", "scripts/validate-agent-factory.ts"]
covered_digest: "v3:sha256:06c6f2459d83a94a9eaf3aefb0e9957342f5b146e7ebfc468cc6a94c39072e64"
behavior_unverified: 2
overrides_applied: 0
behavior_unverified_items:
  - truth: "[EDGE ARCH-02/concurrency] A floor conflict found while work is in flight stops that work: affected tickets go to Blocked and the Orchestrator stops for a named human before any further dispatch on them (45-02, verification: backstop)"
    test: "At UAT, give the Orchestrator an in-flight ticket whose upstream architecture decision conflicts with a grugops floor"
    expected: "The ticket is marked Blocked naming the request, and the Orchestrator stops for a named human before dispatching on it again"
    why_human: "Prose rule in Workflow 20 (Upstream architecture section and Stop conditions); no program enforces it, and a presence check cannot show an agent obeys it"
  - truth: "[EDGE BR-05/concurrency] A pin moved again while a human is answering a request changes nothing already written (45-07, verification: backstop)"
    test: "Move a source pin, start recording an answer, move the pin again, then run upstream.js requests"
    expected: "The answered line keeps the pin the human named, and the next requests run reports against the newer pin"
    why_human: "Prose rule in Workflow 20; the program is stateless and read-only, so only an agent following the procedure keeps the recorded pin correct"
human_verification:
  - test: "45-04 A5: budget is per file (8192 bytes each), not a folder total"
    expected: "Human accepts per-file measurement as the BR-07 reading"
    why_human: "Plan summary left it as human judgment on what BR-07 'byte budget' means"
  - test: "45-05 D3: install --migrate does not seed build-requests/; only the next plain install does"
    expected: "Human accepts that a migrated v3 repository gets the folder on its next plain install, with no folder being never a finding"
    why_human: "Deliberate scope decision recorded as UNKNOWN - verify"
  - test: "45-06 A6: Windows GIT_GRAFT_FILE null-device protection for the ancestry call"
    expected: "On a Windows host, a local graft file cannot fake descendant"
    why_human: "Cannot be exercised on this Linux host"
  - test: "45-07: an open or carried request naming an undeclared source exits 2 as UNKNOWN - verify"
    expected: "Human accepts exit 2 over a quiet pass"
    why_human: "Judgment call recorded in the summary"
  - test: "45-08 A2 and A4: a citation counts from any current note naming the ticket; severity depends on the ticket being Done"
    expected: "Human accepts these readings of TRC-01 and TRC-03"
    why_human: "Interpretation of the requirement, not mechanically decidable"
  - test: "45-11 D5: a ticket waiting on a build request is listed under blocked with its request named in the sweep report"
    expected: "A live sweep report lists such a ticket under blocked, request named, and Blocked time still counts it"
    why_human: "Report wording is the Orchestrator's call at run time"
  - test: "Judgment-tier prohibitions (non-authoritative, flagged unverified-prohibition): no floor moved by an upstream decision; no upstream text copied into an ADR; human:<name> not presented as authentication; no agent records its own request carried or answered; nothing written into an upstream repository; the blocked_escalation_days exemption stays per bullet"
    expected: "Read Workflow 20, the contract and the roles once and confirm the text holds each prohibition"
    why_human: "Judgment tier by design; the verifier recorded a non-authoritative reading only (see Prohibitions below)"
---

# Phase 45: Traceability, build requests and architecture as input - Verification Report

**Phase Goal:** The trail runs from an upstream decision to a ticket, and anything that belongs upstream leaves as a build request that a human carries, so grugops never decides what the product is
**Verified:** 2026-11-26
**Status:** human_needed
**Re-verification:** No, initial verification

Every automated check passed. No roadmap criterion failed. The status is `human_needed` because two plan truths are tagged `verification: backstop` (prose rules no program exercises), and the plan summaries left seven judgment items for human sign-off at UAT.

## Goal Achievement

### Observable Truths (roadmap success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A BA/PM ticket cites `upstream:<source>:<id>@<commit>` or states `none (build-internal)`, and the validator fails a cited ID not present at the pinned commit under the source's declared grammar (TRC-01, TRC-03) | VERIFIED | `upstreamStatementOf` and `upstreamCitationFindings` in `scripts/upstream-model.ts`; `validate-agent-factory.ts` lines 69-133 call them with `upstreamGitManifestAt` and `readTaskNoteRecords`. `validate.test.ts` "upstream statement (plan 45-08, TRC-01)" and "citation (plan 45-08, TRC-03)" pass. Unread source gives `NO ERRORS, <n> UNKNOWN - verify: an unread source is not a pass`. |
| 2 | A build-request file has a stable ID, upstream IDs, raising pin, options with a recommended default and the blocked tickets; BA/PM is the sole writer; duplicates are not filed twice; closed lifecycle; byte budget enforced by validator and state-check (BR-01, BR-03, BR-07) | VERIFIED | `scripts/build-request-model.ts` (832 lines) is the one grammar: five keys, six sections, closed History forms, lifecycle, `human:<name>` for carried and answered. Contract `agent-factory/contracts/build-request.md` states it once. `BUDGETS.buildRequestBytes: 8_192` in `install/state-layout.ts:198` and the board contract row. The validator and `state-check` both parse and measure (plan 45-04 tests pass). Dedup is by the Workflow 20 merge step plus the `overlap` report line (see WR-02). |
| 3 | A waiting ticket stays in `Blocked` with a bullet naming the request; a v3.0 board validates unchanged; upstream waits use their own threshold (BR-02, BR-06) | VERIFIED | Board contract and Workflow 20 define the bullet. `install/installer-cross-version.test.ts` (13 tests, passing) runs the committed v3.0 fixture under the current programs and under the `v3.0.0` tag's `state-check.js`; tag `v3.0.0` exists, so the second half ran. `upstream.escalation_days` default 10 in `upstream-model.ts`; my own run printed `wait BR-1 design: open for 25 days (escalation_days 10)`. Per-bullet exemption from `blocked_escalation_days` is in Workflow 20 and Workflow 09. |
| 4 | The human sees a carry list; grugops writes nothing upstream; a request is answered only by a new pin a human sets, and the answer enters the context as a `claim` citing the ID and pin (BR-04, BR-05) | VERIFIED | My own scratch run (synthetic upstream plus product repo, tree digest before and after) printed `carry BR-1 design: open since 2026-11-01`, exit 1, and changed no file. The grammar refuses `answered` unless the actor is `human:<name>` and the pin differs from the raising pin (`bad-transition`). `requests` is read-only and prints no free text (test-tier prohibitions covered by `upstream.test.ts`, 545 tests in the four core files pass). Workflow 20 steps 10-11 write the `claim` note with the `BR-<n>` and `upstream:<source>:<ID>@<new pin>` refs. |
| 5 | Upstream stack or architecture is given input (`Accepted (upstream)` ADR); a deviation is a build request; a floor conflict is a build request plus a human stop and the floor does not move (ARCH-01, ARCH-02) | VERIFIED for the written rule; in-flight stop is a backstop item | Workflow 00 step 1 applies upstream decisions over `default_stack`. Workflow 20 `## Upstream architecture` section holds the ADR rule, deviation rule and floor rule. Both ADR templates list `Accepted (upstream)`. Each of the five roles has one pointer line (`git diff`: 5 insertions, 1 per role). `flow-guidance-text.test.ts` "(d) exactly one kit file states the floor rule, and it is Workflow 20" passes. |

**Score:** 5/5 roadmap criteria verified; 2 plan truths (`verification: backstop`) carried as behavior-unverified.

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `scripts/build-request-model.ts` | VERIFIED | 832 lines, the single grammar, derivations and report lines |
| `scripts/upstream-git.ts` | VERIFIED | 499 lines, hardened launcher, manifest-at-commit, listed blobs, ancestry |
| `scripts/upstream-model.ts` | VERIFIED | `escalation_days`, statement reader, citation and changed-ID decisions |
| `scripts/runnable-ref/upstream.ts` and `.js` | VERIFIED | `requests` verb, 2366 lines, installed as `tools/grugops/upstream.js` (I installed to a scratch repo and confirmed the file and the seeded `build-requests/.gitkeep`) |
| `install/state-layout.ts` | VERIFIED | `BUILD_REQUESTS_REL`, `buildRequestBytes` |
| `agent-factory/contracts/{build-request,upstream,board}.md` | VERIFIED | Contract present; board has the budget row and `## Upstream` rule |
| `agent-factory/workflows/{00,03,09,17,20}` | VERIFIED | Carry the Phase 45 steps and pointers |
| Seeded `build-requests/.gitkeep` | VERIFIED | Present in the seed and created by a scratch install |
| v3.0 fixture and cross-version test | VERIFIED | Present, passing |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| `upstream.ts` | `build-request-model.ts`, `upstream-git.ts` | WIRED | `generate:runnable-embeds --check` reports 7 targets, 0 changed (tree clean after running) |
| `validate-agent-factory.ts` | `upstream-git.ts`, `upstream-model.ts`, `context-io.ts` | WIRED | Imports and calls confirmed at lines 77-133 |
| Roles and Workflows 00/03/09/17 | Workflow 20 | WIRED | Pointer lines grep-confirmed |
| Workflow 20 | build-request contract and `upstream.js requests` | WIRED | Named in Inputs and Steps |

### Data-Flow Trace (Level 4)

The `requests` report is built from the files on disk and the git object reads of the declared source; my run showed both flowing (carry and wait lines from the file, `match` from the pinned manifest). No static or hardcoded data source.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Type check | `npx tsc --noEmit` | exit 0 | PASS |
| Committed `.js` fresh | `npm run freshness` | 97 committed `.js` files match a rebuild | PASS |
| Runnable embeds current | `generate:runnable-embeds --check` | 0 changed | PASS |
| Grammar, upstream model, git reads, reader | vitest: `build-request-model`, `upstream-model`, `upstream-git`, `runnable-ref/upstream` | 545/545 | PASS |
| Validator, state-check, cross-version, flow guidance | vitest: `validate`, `state-check`, `installer-cross-version`, `flow-guidance-text` | 675/675 | PASS |
| Carry list on a synthetic repo, read-only | `upstream.js requests` in a scratch repo, tree digest compared | `carry` and `wait` lines, exit 1, digest unchanged | PASS |
| Install seeds the folder | `install/install.js --claude --target <scratch>` | `build-requests/.gitkeep` and `tools/grugops/upstream.js` present | PASS |

I did not run the full suite (the orchestrator did: 12789 tests, one regression, fixed by 5424515f with `context-io-writer-set.test.ts` 196/196 re-run). The one remaining full-suite failure, `installer-fs-census` (`openAsBlobSync` on Node v26), also fails at the baseline and is recorded in `deferred-items.md`.

### Probe Execution

No probes declared by the plans. Skipped.

### Requirements Coverage

| Requirement | Source Plan(s) | Status | Evidence |
|-------------|---------------|--------|----------|
| TRC-01 | 45-06, 45-08, 45-09, 45-10, 45-11 | SATISFIED | Statement reader, validator check, Workflow 03 step 8, Workflow 20 step 14 |
| TRC-03 | 45-01, 45-06, 45-08, 45-09 | SATISFIED | `upstreamCitationFindings` plus validator wiring; tests pass |
| BR-01 | 45-01, 45-03, 45-04, 45-09, 45-10 | SATISFIED | Grammar, contract, procedure |
| BR-02 | 45-05, 45-11 | SATISFIED | Cross-version test against tag `v3.0.0` |
| BR-03 | 45-03, 45-04, 45-07, 45-09, 45-10 | SATISFIED | Closed lifecycle, `overlap` line, single-writer rule in contract and Workflow 20 |
| BR-04 | 45-01, 45-07, 45-09, 45-11 | SATISFIED | Carry list, read-only verified by digest |
| BR-05 | 45-03, 45-06, 45-07, 45-10 | SATISFIED | `answered` needs a human and a new pin; `answer-candidate`, `pin-moved`, `not-descendant`; claim note step. The in-flight race is a backstop item. |
| BR-06 | 45-06, 45-07, 45-10, 45-11 | SATISFIED | `escalation_days`, `wait` line, per-bullet exemption |
| BR-07 | 45-04, 45-05 | SATISFIED | Per-file 8192-byte budget in validator and `state-check` (A5 is a human item) |
| ARCH-01 | 45-02 | SATISFIED | Workflow 00 step 1, Workflow 20 section, ADR templates |
| ARCH-02 | 45-02, 45-10 | SATISFIED for written rule; in-flight stop is a backstop item | One-file floor-rule test passes |

All 11 IDs appear in at least one PLAN's `requirements` frontmatter and in the REQUIREMENTS.md traceability table; none is orphaned. REQUIREMENTS.md shows them `Pending` (ARCH-01 `Complete`) by design, as the orchestrator noted; the phase-complete step marks them.

### Prohibitions

- Test-tier (`requests` prints no free text; no write or pin move from `upstream.js`; no git launcher in the validator; no clock or git in `state-check`; grammar-checked values before git; `carried` or `answered` only by `human:<name>`): enforcement tests exist and pass in the files run above. VERIFIED.
- Judgment-tier (floors never move; no upstream text in ADRs; `human:<name>` not authentication; no agent self-carries or self-answers; nothing written upstream; escalation exemption per bullet; no private names in fixtures): my reading of Workflow 20, the contract and the roles found each stated and none contradicted. This is a non-authoritative LLM-judge verdict, flagged `unverified-prohibition - human review recommended`. It is not a gap.

### Anti-Patterns Found

None blocking. No `TBD`, `FIXME` or `XXX` in non-test source changed since `52045d56`.

### Code-review warnings (45-REVIEW.md, all open, none a must-have failure)

| ID | Concern | Effect on goal |
|----|---------|----------------|
| WR-01 | A future-dated request never prints `wait` (negative age) | Edge case of BR-06; typo-triggered. Worth a follow-up |
| WR-02 | Two parallel BA/PM subtasks can pick the same `BR-<n>` | Weakens BR-03 dedup under parallel writes; the `overlap` line cannot see a file that was overwritten. Worth a follow-up |
| WR-03 | The unblock step ignores a ticket's non-request blockers | Wording is "only when", so it is a necessary condition, but the text can be misread. Worth a reword |
| WR-04 | Workflow 00 step 1 writes into `greenfield-plan.md` before step 2 drafts it | Provenance record could be lost; ARCH-01 intent still stated |
| WR-05 | Date-relative tests can flake at UTC midnight | Test hygiene only |

## Human Verification Required

1. **In-flight floor conflict stop (ARCH-02, backstop).** Test: give the Orchestrator an in-flight ticket whose upstream architecture decision conflicts with a floor. Expected: the ticket goes to `Blocked` naming the request and the Orchestrator stops for a named human before further dispatch. Why human: prose rule, no program exercises it.
2. **Pin moved again mid-answer (BR-05, backstop).** Test: move a pin, begin recording an answer, move the pin again, run `requests`. Expected: the recorded answer keeps the human's named pin and the next run reports against the newer pin. Why human: prose rule.
3. **Judgment items from the plan summaries:** 45-04 A5 (per-file budget), 45-05 D3 (`install --migrate` does not seed the folder), 45-06 A6 (Windows null-device graft protection), 45-07 (undeclared source exits 2), 45-08 A2 and A4 (citation and severity readings), 45-11 D5 (waiting ticket listed under blocked with its request named).
4. **Judgment-tier prohibitions** listed above, flagged `unverified-prohibition`.

## Gaps Summary

No gaps. The phase goal is achieved in code: tickets cite upstream IDs checked at the pin, a build request is a closed-grammar file with a single writer, a read-only carry list reaches the human, only a human-set new pin answers it, and upstream architecture enters as an `Accepted (upstream)` ADR with the floors stated once. Two backstop truths and the recorded judgment items need a human at UAT, hence `human_needed`. WR-01 and WR-02 are the review warnings most worth closing in a later change.

---

_Verified: 2026-11-26_
_Verifier: Claude (gsd-verifier)_

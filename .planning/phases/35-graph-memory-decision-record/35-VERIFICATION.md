---
phase: 35-graph-memory-decision-record
verified: 2026-10-20T15:30:00Z
status: human_needed
score: 12/12 must-haves verified
covered_files:
  - ".planning/phases/35-graph-memory-decision-record/35-01-PLAN.md"
  - ".planning/phases/35-graph-memory-decision-record/35-01-SUMMARY.md"
  - ".planning/phases/35-graph-memory-decision-record/35-DECISION.md"
covered_digest: "v3:sha256:194ae3bdc822d1cca700d58258c2aee68139b566fdd158f38fd98fb7df360c20"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Decide whether to correct REQUIREMENTS.md line 103 (out-of-scope row 'Adopting or building graph memory')"
    expected: "Either leave the row as is, or reword it so it no longer says every candidate needs Python, SQLite or a graph DB (untrue for the MCP memory server, which is Node + JSONL and is excluded for breaking verify-before-write)"
    why_human: "Scope decision. The plan deliberately left REQUIREMENTS.md unedited (CONTEXT limits the phase to the record and one row). The record itself states the accurate per-tool reasons, so the goal is met, but the requirements file still carries a looser sentence that contradicts the record on one tool."
  - test: "Confirm the five judgment-tier prohibitions in 35-01-PLAN.md (no install instruction, no reservation, no label upgrade, no saving claim, nothing outside .planning/)"
    expected: "Reading 35-DECISION.md and the [v3.0, D-10] row in full shows none of the five was violated"
    why_human: "All five are verification: judgment with no wired enforcement; this report's verdict on them is a non-authoritative LLM-judge reading (see Prohibitions below), flagged for human review per the soft-gate rule. No violation was found."
---

# Phase 35: Graph-memory decision record Verification Report

**Phase Goal:** A maintainer can read one recorded decision that settles graph memory for v3.0: not adopted and nothing built, so no later phase builds or reserves anything for it
**Verified:** 2026-10-20T15:30:00Z
**Status:** human_needed
**Re-verification:** No, initial verification

## Goal Achievement

The deliverable exists, is substantive, and is wired to the ledger. Every roadmap success criterion and every PLAN truth (D-01..D-08, GRAPH-01, GRAPH-02, SC-4) was checked against the files and git state, not against SUMMARY.md. No gap found. Status is human_needed only because of one scope decision (REQUIREMENTS.md line 103) and the soft-gated judgment prohibitions.

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | SC-1 / GRAPH-01: one record names graphify and the comparable tools, states not adopted and nothing built | ✓ VERIFIED | `35-DECISION.md` line 1 title "[v3.0, D-10] Graph memory: not adopted"; line 7 "Graph memory is not adopted for grugops, and nothing is built"; table lines 19-25 holds Graphify, CodeGraph, code-graph-rag, Serena, MCP memory server |
| 2  | SC-2 / GRAPH-01: states what a user may do and the concrete revisit trigger | ✓ VERIFIED | Lines 37-44 (user may install themselves; role may read as exploration aid like grep; verified before entering shared context; output itself never enters); lines 54-63 two-condition trigger |
| 3  | SC-3 / GRAPH-02: states no graph-tool output enters shared context without a verification stamp; repeats no vendor token-saving number | ✓ VERIFIED | Line 48 names the `verified_by` stamp "that the writing agent cannot forge or self-set" (matches PROJECT.md line 13 wording) and adds the stricter D-05 rule; line 52 is the only savings sentence ("Vendors self-report token savings ... grugops has measured none") with no figure. Regex sweep for percent / x / -fold / multiplier forms in the record returned nothing |
| 4  | SC-4: no file outside `.planning/` changes | ✓ VERIFIED | `git diff --name-only 4f282a25..HEAD -- . ':(exclude).planning/'` printed nothing; `git status --porcelain --untracked-files=all -- . ':(exclude).planning/'` printed nothing; `human-notes.txt` has no status entry and no commits in range; branch is `main` |
| 5  | D-01: full record in 35-DECISION.md; PROJECT.md gains exactly one row pointing to it | ✓ VERIFIED | `git diff 4f282a25..HEAD -- .planning/PROJECT.md` = 1 insertion, 0 deletions; row names `.planning/phases/35-graph-memory-decision-record/35-DECISION.md` |
| 6  | D-02: row opens `\| **[v3.0, D-10]** `, three cells, directly after the D-9 row, Outcome `— Pending` | ✓ VERIFIED | PROJECT.md line 265 is D-9, line 266 is D-10 (awk "line after D-9" returns the D-10 row); cells Decision / Rationale / `— Pending`; no pipes inside inline code |
| 7  | D-03: reopen only when both (a) and (b) hold; either alone does not; (b) measurement marked UNKNOWN - verify | ✓ VERIFIED | Lines 56-63: both conditions worded as in CONTEXT D-03, "Either condition alone does not reopen it", and "How (b) would be measured is `UNKNOWN - verify`" with the reason (`scripts/measure-cost.ts` aggregate only) |
| 8  | D-04: event-based only, no date, schedule or milestone-audit step | ✓ VERIFIED | Line 61 states exactly that, as a negation; no other date-based or scheduling text in the record or the row |
| 9  | D-05 / D-06: posture written only in the record; no Phase 43 follow-up; Serena row says only it overlaps CC's LSP plugins | ✓ VERIFIED | Line 44 "This record is the only place this posture is written ... Phases 39-43 add nothing for graph memory"; Serena row ends "Overlaps CC's (Claude Code's) LSP plugins"; no host-native-navigation or docs follow-up text anywhere. No role/kit file names a tool (the SC-4 diff is empty) |
| 10 | D-07: no token-saving figure of any kind in record or row | ✓ VERIFIED | Read the record and row in full. Digits present are tool versions (0.9.92, 1.6.2, 2.0.0, Python >=3.10), counts of tool facts ("about 40 languages", "about 25 grammar wheels"), phase numbers and the tag. None is tied to tokens, cost or savings. Line 35 "makes no claim about what that layer costs or spares" is a negation. Row has no figure |
| 11 | D-08: as-of 2026-10-20, facts from STACK.md section (d) not re-checked, confidence labels exactly as on STACK rows | ✓ VERIFIED | Date on line 3 and in the Tools heading; compared each table row to STACK.md lines 133-139: code-graph-rag keeps `LOW` on the Docker detail; Serena keeps `UNKNOWN - verify` on license; MCP memory server keeps `UNKNOWN - verify` on repo license. Graphify's only label (`LOW`) sat on the vendor marketing sentence, which is omitted whole (consistent with D-07), so nothing is upgraded or invented. No fact beyond STACK.md section (d) |
| 12 | Decision-ID collision handled: always `[v3.0, D-10]` | ✓ VERIFIED | Line 9 explains the `[v2.0, D-10/D-11]` clash (confirmed present at PROJECT.md line 303); only one `[v3.0, D-10]` row exists |

**Score:** 12/12 truths verified (0 present, behavior-unverified). All truths are prose-presence-and-meaning truths; none asserts runtime state transitions.

### Deferred Items

None.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/phases/35-graph-memory-decision-record/35-DECISION.md` | Decision record with 9 sections | ✓ VERIFIED | 68 lines; exists, substantive, headings Decision, Origin, Tools evaluated, Why it is not adopted, What a user and a role may do, Verification-stamp rule, Vendor claims, When to revisit, Not to be confused with |
| `.planning/PROJECT.md` | One pointer row after D-9 | ✓ VERIFIED | Line 266, one insertion only |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| PROJECT.md `[v3.0, D-10]` row | `35-DECISION.md` | repo-root path in the Decision cell | ✓ WIRED | Path matches pattern, target file exists |

### Data-Flow Trace (Level 4)

Not applicable: prose documents, no rendered dynamic data.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| UAT oracles / WR-05 readers still pass after the PROJECT.md row | `node scripts/check-uat-oracles.js` | ALL CHECKS PASSED | ✓ PASS |
| No NUL bytes introduced | `node scripts/check-nul-bytes.js` | ALL CHECKS PASSED | ✓ PASS |

`npm test` was not run (live e2e lane). No phase-local check scripts exist; their absence is the human's scope cut of 2026-10-20 (commit 25de4abe), not a gap.

### Probe Execution

Step 7c: SKIPPED. The plan declares no probes and the phase is a documentation record.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| GRAPH-01 | 35-01 | Recorded decision: not adopted, nothing built, what a user may do, revisit trigger | ✓ SATISFIED | Truths 1, 2, 7, 8, 9. REQUIREMENTS.md line 13 and traceability line 118 already read Complete |
| GRAPH-02 | 35-01 | No graph-tool output enters shared context without a verification stamp; no vendor token-saving number | ✓ SATISFIED | Truths 3, 10. REQUIREMENTS.md line 14 and traceability line 119 read Complete |

Both IDs in the PLAN frontmatter are accounted for in REQUIREMENTS.md. No orphaned requirement: REQUIREMENTS.md maps only GRAPH-01 and GRAPH-02 to Phase 35.

### Prohibitions (judgment-tier, non-authoritative LLM-judge verdicts, flagged for human review)

| Prohibition | Verdict | Basis |
|-------------|---------|-------|
| No instruction to install a tool on grugops's behalf | No violation found | Line 39 and 44: a user may install; "grugops installs nothing" |
| No reservation (state path, role/workflow line, Phase 39-43 or Phase 43 docs follow-up, dated review) | No violation found | Line 7, 44, 61, 63 all negate; no path named |
| No LOW/UNKNOWN fact shown as verified; no fact outside STACK (d); date kept | No violation found | Truth 11 |
| No claim, with or without number, that grugops/index layer/decision saves tokens or cost | No violation found | Truth 10; "token" appears only in the self-report sentence and trigger (b); "costs" only in a negation |
| Nothing outside `.planning/` touched, no branch change, no npm test, no check script | No violation found | Truth 4; branch `main` |

### Anti-Patterns Found

None. Debt-marker scan (TBD / FIXME / XXX) not applicable to the prose record; no placeholder text or stubs found.

### Human Verification Required

#### 1. REQUIREMENTS.md line 103 wording

**Test:** Read `.planning/REQUIREMENTS.md` line 103: "Every candidate needs Python, SQLite or a graph DB; 'not a database' stands (GRAPH-01)".
**Expected:** Decide whether to leave it or correct it. The MCP memory server is Node + JSONL and CodeGraph installs as a bundled binary or `npm i -g` (though it stores data in SQLite), so the sentence is looser than the accurate per-tool reasons in the record (which says the MCP memory server is excluded for breaking verify-before-write, not for a database).
**Why human:** The phase scope was limited to the record and one row, so the executor correctly left it unedited and reported it. It is not a phase gap (the goal and all four success criteria are met), but a maintainer should choose whether to fix the requirements text.

#### 2. Judgment-tier prohibitions

**Test:** Skim `35-DECISION.md` and the PROJECT.md line 266 row once more for any saving, schedule, reservation or follow-up.
**Expected:** None present.
**Why human:** Judgment-tier prohibitions have no wired enforcement and `.planning/**` is excluded from `scripts/check-banned-claims.ts`, so this report's reading is non-authoritative.

### Gaps Summary

No gaps. The record exists, says what the goal requires, is linked from the ledger, carries no figure, keeps every confidence label, and nothing outside `.planning/` changed since 4f282a25. Remaining items are a human scope decision on REQUIREMENTS.md line 103 and confirmation of the judgment-tier prohibitions. Note for the orchestrator: ROADMAP.md still shows Phase 35 unchecked (`[ ]`, "1/1 plans executed"), while REQUIREMENTS.md already marks GRAPH-01/02 Complete; reconcile when closing the phase.

---

_Verified: 2026-10-20T15:30:00Z_
_Verifier: Claude (gsd-verifier)_

# Phase 43 — Baseline before any phase-43 edit

base: a067c6e6e7eb2090eb44b47a0d001e622248402e
date: 2026-11-17
node: v26.12.1

Measured by plan 43-01 at the base commit above, before any phase-43 file was edited. The working
tree carried only the user's own changes (`docs/audit/28-prepass-evidence.md` modified,
`brand/readme-art.txt` and the `~/` directory untracked) and the orchestrator's `.planning/STATE.md`
edit. Later plans read the base with `sed -n 's/^base: //p'` and compare every gate below against its
exit code here, and every suite failure by file and test name.

## Gates

Each command ran once, in the order listed, from the repository root. "Last line" is the last
non-blank line of its combined output.

| Command | Exit | Last line |
|---|---|---|
| `npm run freshness:catalog` | 0 | Catalog fresh: docs/catalog/README.md matches a fresh regeneration. |
| `npm run check:claim-anchors` | 0 | ALL CHECKS PASSED |
| `npm run check:audit-register` | 0 | ALL CHECKS PASSED |
| `npm run check:public-docs` | 0 | ALL CHECKS PASSED |
| `npm run check:banned-claims` | 0 | ALL CHECKS PASSED |
| `npm run freshness:guarantees` | 0 | Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration. |
| `npm run freshness:skill-twins` | 0 | Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal. |
| `npm run freshness` | 0 | All build outputs fresh: 92 committed .js file(s) match a rebuild of their sources. |
| `npm run check:build-parity` | 0 | ALL CHECKS PASSED |
| `npm run check:state-paths` | 0 | ALL CHECKS PASSED |
| `node scripts/check-foundation-guards.js` | 0 | ALL CHECKS PASSED |
| `node scripts/check-kit-refs.js` | 0 | ALL CHECKS PASSED |
| `node scripts/check-flip-manifest.js` | 1 | 1 CHECK(S) FAILED |
| `node scripts/check-diff-disposition.js` | 0 | ALL CHECKS PASSED |

Notes on the two gates the plan expected to be red:

- `check-flip-manifest` exits 1, as expected: `FAIL the flip manifest does not exist at
  .planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md` (the manifest moved to
  the milestones archive). Not repaired by this phase.
- `check-diff-disposition` exits **0** on this tree, not red: its last check reads `PASS diff
  disposition — changed watched file(s): 0 findings over 29/29 elements`. The "about 721 open
  findings" in 43-VALIDATION.md was measured at research time against a different diff; the number
  above is what this base commit gives.
- `check-foundation-guards.js` (the gate) exits 0. The LANG-07 red named in the plan is a case in
  `scripts/check-foundation-guards.test.ts`, listed under § Full suite below.

The claim-anchors PASS line at base, kept so later plans can compare its counts:

> 47 registry row(s) parsed from 47 claim-heading-shaped line(s), 0 of them EXCLUDED as fenced
> documentation … — 46 markdown, 1 unanchorable …; anchors found: AGENTS.md 11, README.md 9,
> agent-factory/README.md 17, agent-factory/writing-profile.md 9; 47 verbatim comparison(s)
> performed, all byte-identical, of which 0 compared against GENERATED disclosure text for a
> `dropped` row …; all 4 safety floor(s) mapped

## Full suite

One run of `npx vitest run --exclude '**/scripts/e2e/**' --reporter=json`, default `TMPDIR`, output
sent to the executor's scratch space. Exit 1.

- Tests: **11876** total, **11853** passed, **21** failed, **2** skipped.
- Compare by file and test name, not by count: the `/tmp` quota (EDQUOT) can move counts between runs.

The 21 failing tests at base:

| File | Test |
|---|---|
| `install/installer-fs-census.test.ts` | installer fs census — the read axis (DC-3, plan 33.1-27) every node:fs export whose name may mark a content read is classified, two-sided, in CONTENT_READER or NOT_CONTENT_READER (`openAsBlobSync` unclassified on Node v26) |
| `scripts/canonical-corpus.test.ts` | canonical-corpus: the rounds-1-11 bypass corpus replays as NAMED LOUD REFUSALS provenance: every cited source artifact resolves on disk |
| `scripts/check-foundation-guards.test.ts` | LANG-07: exactly ONE module owns the section-extent predicate (plan 29-25, D-24) every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose (the untracked `~/` directory) |
| `scripts/context-io-writer-set.test.ts` | 31-14 — the register's decline enumeration equals the derived set the disposition document exists and carries the enumeration heading |
| `scripts/context-io-writer-set.test.ts` | 31-14 — the register's decline enumeration equals the derived set every derived decline clause is enumerated, and the document names no other |
| `scripts/context-io.test.ts` | 31-23 PROBE 5 — the cross-plan intended-change list is a declared set of size one the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, and agree with this plan's expectation |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions PREMISE: the document was read and it names residual ids at all |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions DIRECTION 1: every EXPORTED member has a WRITTEN disposition in 31-CONTEXT.md |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions DIRECTION 2: every WRITTEN id is a member the module still exports |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions a SEEDED undispositioned member turns the equality RED |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions CONVERSE 1: a mirror of 31-CONTEXT.md with ONE written disposition removed names the orphaned member |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions CONVERSE 2: a mirror of the register with ONE member removed names the orphaned disposition |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed every FILE a row cites exists in the tree it names |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed every MECHANISM a row claims is greppable in the evidence that row itself names |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors PREMISE: the live tree's own reading, printed before any mirror is believed |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors a mirror with a MAJORITY of rows stripped turns the new CEILING red |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it the round-5 collision is ANNOTATED in the list rather than repaired in either SUMMARY |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it the scanned document set is DERIVED and its cardinality is asserted, so a short scan is red |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it every ordinal-claiming sentence in the scanned set appears in the tracked list |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it SEPARATOR SEAM (test AE, plan 33-18): scannedDocumentsWith(win32) publishes POSIX members, so the docs/audit/ filter and the split("/") key see ONE spelling on every host |
| `scripts/uat-gate-exit-contract.test.ts` | every plan of round 6 carries the debt-does-not-grow acceptance criterion all five round-6 PLAN files state it, and the count is asserted at five |

Causes, as the failure messages give them: one Node v26 export (`openAsBlobSync`), one untracked
`~/` directory at the repository root (LANG-07), and 19 cases that read Phase 27 and Phase 31 files
which the milestone archive moved out of `.planning/phases/`. None is caused by phase 43, and none is
repaired by it.

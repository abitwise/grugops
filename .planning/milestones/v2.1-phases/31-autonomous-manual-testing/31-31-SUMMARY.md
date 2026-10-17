---
phase: 31-autonomous-manual-testing
plan: 31
subsystem: testing
tags: [closing-measurement, reproduction-pairing, disposition-ledger, residual-register, coverage-equality, frozen-floors]

requires:
  - phase: 31-27
    provides: "CR-17's bounded wrapper, tier 0, the host-scoped TRUSTED_ROOT_RESIDUALS and R-31-19-07's canonicaliser — the artifacts this measurement re-drives at the entry hooks.json names"
  - phase: 31-28
    provides: "D-30's symbol-identity cutover, the rewritten 6-member callee register and the four could-not-run sentences — the mechanism CR-18/CR-21/WR-26/WR-29/WR-30 are re-measured against"
  - phase: 31-29
    provides: "the write-side ceiling, governanceRootOf's destination binding, WRITE_PATH_RESIDUALS, the three skip arms and the per-position price — the mechanism CR-19/CR-20/WR-27/WR-28/IN-14 are re-measured against"
  - phase: 31-30
    provides: "the §14 gate's fourth arm, the Windows leg's stated remainder, R-04's harness closure, the debt at 80 and the tracked harness-instance list this plan read ordinal 14 off"
  - phase: 31-26
    provides: "the round-5 closing measurement — the document shape, the standing rules, and the round-5 reproductions this round re-drives as CONTROLS"
provides:
  - "docs/audit/31-round6-residuals.md — the artifact a seventh verification round starts from rather than re-derives"
  - "a paired reproduction ledger: 26 derived probes, 26 driven, each with the FINDING document's own spelling at one commit"
  - "a round-5 CONTROL ledger: 14 closures re-driven in the modules round 6 edited, 13 unmoved and 1 boundary moved by one level"
  - "a disposition ledger: 70 rows against 70 derived source items, balancing 42 closed + 18 accepted + 10 carried"
  - "the no-silent-drop equality asserted as COVERAGE: 8 report rows, 8 covered, 0 uncovered, from 18 derived assumptions"
  - "the round-6 residual register, by id, with a reason and a closure criterion per member"
  - "harness-false-result instance 14, the ordinal read off the tracked list rather than typed"
affects: [31-verification-round-7, context-io, uat-spec-integrity, hook-entry, trusted-root, write-path]

actuals:
  tokens: 33685
  tasks: 3
  commits: 4
plan_head_before: a6539e7471373de26fcd5478359a8cf47d29b579

tech-stack:
  added: []
  patterns:
    - "a closure round re-runs the FINDING document's probe spelling, never the fix plan's own fixture"
    - "a control ledger is the round's regression evidence: report what did NOT move beside what did"
    - "assert a coverage equality where a cardinality equality would measure false, and say why"
    - "derive every denominator by command; when the source document's own prose disagrees with its tables, print both and name the discrepancy"
    - "derive the doctrine rather than quote it — ask whether the catching case existed at the round base"

key-files:
  created:
    - docs/audit/31-round6-residuals.md
  modified:
    - docs/audit/harness-false-result-instances.md
    - .planning/phases/31-autonomous-manual-testing/31-VALIDATION.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md
    - .planning/STATE.md

key-decisions:
  - "The reproduction denominator is 26, DERIVED (18 spot-check rows + 5 review-only findings + 3 review-only CR-18 variants), and the WR-29 counting judgement that makes it 5 rather than 4 is stated rather than absorbed."
  - "The disposition ledger is built on the DERIVED 43 items, not on the dispositions file's declared 34. The discrepancy (43 vs 34, 22/18/3 vs 19/13/2, 41 after de-duplication) is recorded as a finding with an owner rather than adjusted to fit."
  - "The ambient `declare` spelling is NOT called closed. It is unmoved at 0 findings/EXIT=0, the file does not compile (TS2440), and this round declines to dismiss it on its own round's standard — carried as R-31-31-01 with an owner."
  - "The green suite's doctrine is DERIVED rather than quoted: four of the five round-6 Criticals are decided today by constants that appeared ZERO times in the suite at the round base."
  - "Spot-check row 6's depth-1000 EXIT=0 is a three-way outlier against round 5's record and this session's measurement; it is printed with both other values and explicitly not resolved by preference."
  - "MEASURED CORRECTION to a round-5 pin: the CR-15 parse-depth adjacency moved 630/631 -> 629/630, bisected here. The property is unmoved; the number moved."

patterns-established:
  - "Drive the attack at the ENTRY the host invokes with the argv DERIVED from the configuration file, not typed."
  - "Assert every harness's own premise before its result is read, and log a false result to the tracked list with the ordinal read off it."
  - "Re-run every caller with a LEGITIMATE input after every refusal added — the control is what proves the refusal cost nothing."

requirements-completed: []

coverage:
  - id: D1
    description: "Every round-6 reproduction is re-run verbatim at one commit with the finding document's own spelling, paired against its pre-round result."
    requirement: UATX-01
    verification:
      - kind: manual_procedural
        ref: "docs/audit/31-round6-residuals.md §2 — 26 derived probes, 26 driven, each row carrying the source document, the quoted spelling, the pre-round result and the post-round result"
        status: pass
      - kind: integration
        ref: "the 13-position CR-17 driver against a scratch kit outside the tree, argv derived from hooks/hooks.json"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every round-5 closure is re-driven as a CONTROL at the same commit, in the modules round 6 edited, with moved and unmoved controls reported separately."
    requirement: UATX-06
    verification:
      - kind: manual_procedural
        ref: "docs/audit/31-round6-residuals.md §3 — 14 control rows, 13 UNMOVED, 1 boundary MOVED by one level, each with its round-5 result beside its round-6 result"
        status: pass
    human_judgment: false
  - id: D3
    description: "The whole repository is measured green at one commit with every gate, and the green is recorded as a FLOOR with the doctrine derived rather than quoted."
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' -> Test Files 64 passed (64), Tests 4128 passed | 2 skipped (4130), exit 0, 354.9 s"
        status: pass
      - kind: integration
        ref: "docs/audit/31-round6-residuals.md §8.1 — 25 gate rows from a list derived from package.json, with the three exclusions named"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every frozen floor and every DECIDER_MANIFEST entry is re-measured as a whole."
    verification:
      - kind: integration
        ref: "git hash-object hooks/guard.ts = FROZEN_GUARD_BLOB; a fresh normalisation = FROZEN_HOOK_ENTRY_LOGIC_SHA; 26 of 26 manifest entries matching, 0 mismatched"
        status: pass
    human_judgment: false
  - id: D5
    description: "The no-silent-drop equality is asserted as COVERAGE: eight edge-coverage rows against the flagged assumptions authored across the round."
    verification:
      - kind: manual_procedural
        ref: "docs/audit/31-round6-residuals.md §9 — 18 assumptions derived from the five plan files, 8 rows covered by >= 1, 0 covered by none, 3 authored beyond the report named"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every review finding and every dispositioned item carries exactly one ledger row with its measured outcome beside its dispositioned outcome."
    verification:
      - kind: manual_procedural
        ref: "docs/audit/31-round6-residuals.md §10 and §11 — 70 rows against 70 derived source items, equality stated and balancing"
        status: pass
    human_judgment: false
  - id: D7
    description: "The requirement rows, the traceability rows and the phase checkbox are proven unchanged."
    verification:
      - kind: integration
        ref: "git diff --stat 77123aa..HEAD -- .planning/REQUIREMENTS.md (empty); grep -c '^- \\[ \\] \\*\\*UATX-0' -> 6; six traceability rows still Gaps Found; ROADMAP line 100 still unchecked"
        status: pass
    human_judgment: false
  - id: D8
    description: "The round-6 residual register is written once, by id, with a reason and a closure criterion per member."
    verification:
      - kind: manual_procedural
        ref: "docs/audit/31-round6-residuals.md §12 — six subsections covering 11 + 6 + 5 + 7 + 5 + 11 members"
        status: pass
    human_judgment: false
  - id: D9
    description: "Whether the round-6 closures hold on a Windows host, and whether R-01/R-02 behave as documented under real interactive auth and alternative credentials."
    verification: []
    human_judgment: true
    rationale: "Every probe in this measurement ran on darwin 25.5.0 arm64 / Node v24.12.0. R-01 needs an attended session with the browser extension; R-02 needs credential configurations this box cannot construct without destroying its real ones; R-03 needs a reading off a real windows-latest run. All three are carried with their `UNKNOWN - verify` markers intact and named owners."

duration: 92min
completed: 2026-09-10
status: complete
---

# Phase 31 Plan 31: The Round-6 Closing Measurement Summary

**All five round-6 Criticals, all five Warnings and both Info items CLOSED BY MEASUREMENT at one commit using the findings' own probe spellings; 14 round-5 closures re-driven as controls with 13 unmoved; 70 disposition rows balancing against 70 derived source items; and the round-6 dispositions file's own tally measured unbalanced and recorded as a finding rather than adjusted.**

## Performance

- **Duration:** 92 min
- **Started:** 2026-09-10T16:49:00Z
- **Completed:** 2026-09-10T18:21:00Z
- **Tasks:** 3
- **Files modified:** 5 (1 created, 4 modified) — no source, test or configuration file among them

## Accomplishments

- **CR-17 closed at every position, not at one call.** The manifest position list was DERIVED from the committed `hooks/hook-entry.js` and driven through the argv DERIVED from `hooks/hooks.json`. All **13 of 13** positions answer `EXIT=0` in **46–50 ms** with a named `manifest-path-not-a-regular-file` deny on stdout and **zero bytes on stderr**, where round 6 measured `EXIT=124` with zero bytes on both. The other decider's own position, the DIRECTORY shape, and the fd-0 class (a never-closing stdin, denying at 10,100 ms naming SIGTERM) all answer the same way.
- **CR-18, CR-19, CR-20 and CR-21 each moved in the direction their owning plan committed to**, and each was re-run with the review's or the verifier's own spelling rather than a fix plan's fixture. CR-20's measurement is the sharpest: the note and its GOV-02 event now both land in THIRD (notes 1, ledger 1) with DEST holding neither — the exact inverse of round 6.
- **The round-5 CONTROL ledger is the round's own regression evidence.** 14 closures re-driven in the modules round 6 edited: **13 UNMOVED**, 1 boundary moved by exactly one level in the safe direction. Three rows the round-6 verifier only REPORTED (CR-12, CR-13, CR-16) are DRIVEN here.
- **The doctrine is DERIVED rather than quoted for the first time in this phase.** Four of the five round-6 Criticals are decided today by constants and spellings that appeared **zero** times in the suite at the round base (`NOTE_ABOVE_CEILING_CLAUSE` 0→2, `destination-outside-governed-store` 0→3, `governanceRootOf` 0→8, the CR-21 tag spelling 0→2). A suite that never names a clause cannot assert it.
- **The no-silent-drop check is a COVERAGE equality and closes:** 8 edge-coverage rows, **8 covered by at least one** of 18 derived assumptions, **0 covered by none**, with the 3 authored beyond what the report raised named rather than counted as drift.
- **The dispositions file's own tally does not balance, and the ledger says so.** Declared 34 (19/13/2); derived by command from its six tables, 43 (22/18/3); 41 after collapsing the one thrice-listed item. The ledger is built on 43 and the discrepancy carries an owner.

## Task Commits

1. **Task 1: every round-6 reproduction and every round-5 control, re-run at one commit** — `50bd67e` (docs)
2. **Task 2: the one-commit gate record, the frozen manifest whole, and the coverage equality** — `2d426dc` (docs)
3. **Task 3: disposition every item, write the register, leave the requirement rows** — `ea8c329` (docs)

**Plan metadata:** see the final commit (docs: complete plan)

## The measurements that matter

### CR-17 — driven at the entry, at every position

```
CONTROL  ordinary payload, unmodified manifest      EXIT=0   66 ms   0 B stdout   0 B stderr
FIFO@hooks/admission-guard.js                       EXIT=0   48 ms   792 B deny   0 B stderr
FIFO@scripts/audit-model.js                         EXIT=0   46 ms   788 B deny   0 B stderr
… 11 more, each EXIT=0 in 46–50 ms with a named deny …
== bounded, named, DENY at 13 of 13 positions ==
FIFO@hooks/guard.js  (the Bash matcher's own decider)  EXIT=0  47 ms  named deny
DIRECTORY at a manifest position                       EXIT=0  the SAME named deny
a stdin whose writer never closes                      EXIT=0  10,100 ms  "terminated by SIGTERM
                                                       before it reached a decision"
```

### CR-19 — the refusal now names the true condition

```
appendNote(9,437,184-byte body)
 -> THREW: refusing to write (note-above-size-ceiling) — the composed note under id "…" is 9437339
    bytes, above the 8388608-byte ceiling every reader of this store enforces. … No file was written
    and no directory was created.
readContext -> 0 note(s)          (because NOTHING was written, not because it is invisible)
CONTROL small note -> WROTE …     readContext -> 1
re-write at an over-ceiling occupied id
 -> refusing to write (note-above-size-ceiling) — the note destination "…" IS a regular file, and …
```

### CR-20 — three real governance roots

```
PREMISE ORIGIN/THIRD/DEST: governanceRootOf(store) = the root itself ✓ (asserted per root)
promoteAdmitted(from=ORIGIN, to=THIRD, repoRoot=DEST) -> PROMOTED
  THIRD notes : ["20260910T033000Z-security-nfr-finding-7c8bddc5.md"]
  THIRD ledger: 1                        (round 6: 0 / ABSENT)
  DEST  notes : []                       (round 6: a DIFFERENT id)
  DEST  ledger: ABSENT                   (round 6: 1 line)
CONTROL (to == repoRoot) -> PROMOTED, DEST2 notes 1, DEST2 ledger 1
to = an UNGOVERNED directory -> DECLINED destination-outside-governed-store
```

### The one-commit floor, and the frozen floors

```
npx vitest run --exclude '**/scripts/e2e/**'
  Test Files 64 passed (64)   Tests 4128 passed | 2 skipped (4130)   exit 0   354.9 s
npm run freshness            All build outputs fresh: 61 committed .js file(s)
npm run freshness:hook-manifest   Hook manifest fresh: 2 decider(s), 26 module hash(es)
git hash-object hooks/guard.ts    669725bc1c616ab57123e22090d93d57eff1b001 = FROZEN_GUARD_BLOB
FROZEN_HOOK_ENTRY_LOGIC_SHA       e1ed0dc0…5cabc, over a normalisation removing 2,825 of 29,048 bytes
DECIDER_MANIFEST walked whole     26 entries, 26 matching, 0 mismatched
npm run check:diff-disposition    80 finding(s) over 39 elements   (round 5: 110; base 4d2b8f0 and
                                  the 40-file corpus both unmoved)
```

**25 gate rows, from a list DERIVED from `package.json`'s 31 scripts with three exclusions named
(`test` and `test:e2e` pull the live `claude --print` lane; `count:lines` is a metric). Every
`generate:*` producer is checked by its paired `freshness:*` gate, so the gate runs and the producer
does not.** Nineteen of the twenty-five report `ALL CHECKS PASSED` or an explicit fresh line; three
report their own vacuity in their own words; one is the disposition debt at 80.

## Files Created/Modified

- `docs/audit/31-round6-residuals.md` — **created**, 1,249 lines, fifteen sections: the derived probe set, the round-6 pairing table, the round-5 control ledger, the two spot-check counts, the four SATISFIED requirements re-measured, five recorded disagreements, the environment proven clean, the one-commit gate record with the frozen floors and the register cardinalities, the coverage equality, the four-block disposition ledger, the totals equality, the residual register, what the round did not do, the requirement rows, and what round 7 inherits
- `docs/audit/harness-false-result-instances.md` — one row appended, **instance 14**, the ordinal read off the list
- `.planning/phases/31-autonomous-manual-testing/31-VALIDATION.md` — a new carry-forward section for round 7: the count read from the section above and incremented once, **3 carried and 1 CLOSED** where it was 4 carried
- `.planning/phases/31-autonomous-manual-testing/deferred-items.md` — the round-6 closing re-measurement, with every item this plan raised carrying an owner and a criterion
- `.planning/STATE.md` — the status block rewritten (3,756 → 1,838 characters) and the write VERIFIED

**No source file, test file or configuration file was modified.** Asserted range-pinned at every
commit: `git diff --name-only a6539e7..HEAD -- scripts hooks agent-factory install .github vitest.config.ts package.json` is **empty**.

## Decisions Made

See `key-decisions` in the frontmatter. Three are worth surfacing because they are refusals rather than choices:

- **The ledger is built on the DERIVED 43, not the declared 34.** Adjusting the ledger to the file's prose would have made the tally balance by deleting its evidence. Both numbers are printed and the discrepancy carries an owner.
- **The ambient `declare` spelling is not called closed.** It would have been easy to dismiss it on `31-28`'s own standard ("a construct the language refuses to compile is a curiosity"), and that standard is *this round's* — a closing measurement applying its own round's standard to dismiss its own round's residual is exactly the self-certification this document exists to refuse. It is carried as `R-31-31-01`.
- **Spot-check row 6 is not resolved by preference.** Three values exist for one probe; two agree and the round-6 verifier's is the outlier. A hypothesis is offered and labelled as one.

## Deviations from Plan

### Auto-fixed and measured corrections

**1. [Rule 1 — measured correction] The plan's probe environment no longer decides anything**

- **Found during:** Task 1, the first CR-18 drive.
- **Issue:** The plan inherits round 5's probe shape (a `package.json` plus a spec). Under `31-28`'s S2 cutover that shape now answers `PROGRAM_UNAVAILABLE_REASON` at **EXIT=2** — the refusing direction, but not the ban.
- **Fix:** every AST probe was equipped exactly as `31-28`'s own `equipTarget` equips a target (a `tsconfig.json`, a `node_modules` symlink, and `fixtures/playwright-test.d.ts` in `types/`), and the equipment is stated **once** in §1.3 as a PREMISE of every AST row rather than assumed eighteen times.
- **Why it matters to the next reader:** a round-5 transcript re-run verbatim against an unequipped root measures the parser's absence, not the ban. Recorded so it is not filed as a regression.
- **Commit:** `50bd67e`

**2. [Rule 1 — measured correction] The dispositions file's declared denominator is wrong**

- **Found during:** Task 3, MOVEMENT 1, deriving the block-D denominator.
- **Issue:** the plan's own `must_haves` inherit the file's prose — "Every one of the **34** items … 19 FIX, 13 CLOSE, 2 OPEN". Derived by `awk` over its six tables: **43** rows, **22 / 18 / 3**. De-duplicating the one item listed three times (the Windows leg, as `R-31-19-03` in §A, as a `D` row and as `R-03` in §F) gives **41**, not 34.
- **Fix:** the ledger was built on the derived 43 and the discrepancy was recorded as a **finding of this round with an owner**, per the plan's own MOVEMENT 2 instruction to name a discrepancy rather than adjust a number.
- **Commit:** `ea8c329`

**3. [Rule 1 — bug in this plan's own harness, logged as instance 14] The CR-17 position derivation reported a green from an empty denominator**

- **Found during:** Task 1, MOVEMENT 2.
- **Issue:** the first derivation took its manifest-block pattern from `hooks/hook-entry.ts` (two-space indent) and ran it against the committed `hooks/hook-entry.js` (four-space indent). It matched nothing; `wc -l` over the empty result answered **1** and the loop printed *"bounded, named, DENY at 0 of 0 positions"*.
- **Fix:** the derivation was **rebuilt** with an explicit non-zero premise assertion (`exit 1` on a zero-length result) rather than its output believed, and re-run, giving 13. Logged as **instance 14** in `docs/audit/harness-false-result-instances.md` with the ordinal read off the list — **instance 4's exact shape, for the third time in this phase.**
- **Caught by:** the printed denominator disagreeing with the printed position list.
- **Commit:** `50bd67e`

**4. [Rule 1 — bug in this plan's own harness, caught by its CONTROL] Two context probes failed their own premise**

- **Found during:** Task 1, the CR-19 and CR-20 drives.
- **Issue:** the CR-19 probe's `NoteInput` lacked `refs`, so both the probe **and its control** threw `note.refs is not iterable`; the CR-20 probe spelled the review's note id fragment `security-nfr-finding` as the `kind`, which the validator refuses ("not one of the six values").
- **Fix:** both corrected against the module's own `NoteInput` interface and `NOTE_KINDS`. **The CONTROL is what caught the first** — a probe that throws for a reason unrelated to its subject is exactly the class instance 14 belongs to, and it is recorded here rather than absorbed.
- **Why these are NOT logged as further instances:** each produced an ERROR, not a false RESULT. Nothing was read from them.

**5. [Rule 1 — measured correction to a round-5 pin] The CR-15 parse-depth adjacency moved by one level**

- **Found during:** Task 1, MOVEMENT 3.
- **Issue:** round 5 and round 6 both bisect the pair at **630/631**. This session bisects **629/630** — depths 500…629 answer EXIT=0 and 630 answers EXIT=2.
- **Fix:** none. The **property** is unmoved (EXIT=2 with the named could-not-run reason and the vacuity floor, which is never a pass under D-12); the **number** moved, consistent with `31-28`'s cutover adding a frame to the parse path. Bisected here and recorded in §6.5 and in `deferred-items.md` with an owner: any future record that pins the number rather than the property.

---

**Total deviations:** 5 (2 measured corrections to a plan premise, 2 harness faults in this plan's own probes — one of them logged to the tracked instance list — and 1 measured correction to a prior round's pinned number). **Impact:** none weakens a measurement; deviations 2 and 3 are the two a reviewer should read first, because each is this plan's own instrument being wrong before its result was read.

## Verification

All `<verify>` blocks executed, with output:

| check | result |
|---|---|
| `git status --porcelain -- scripts hooks agent-factory install .github vitest.config.ts` | ✅ empty |
| `git diff --name-only "$PLAN_BASE"..HEAD -- scripts hooks agent-factory install .github vitest.config.ts package.json` | ✅ empty at every commit |
| `test -z "$(find .temp -mindepth 1 -print -quit)" && test -z "$(find . -path ./node_modules -prune -o -type p -print)"` | ✅ exit 0 |
| `npx vitest run … context-io.test.ts uat-spec-integrity.test.ts hooks/guard.test.ts` | ✅ `Test Files 3 passed (3)`, `Tests 1167 passed` |
| **Full excluded-e2e suite** | ✅ `Test Files 64 passed (64)`, `Tests 4128 passed \| 2 skipped (4130)`, exit 0, 354.9 s |
| `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness && npm run freshness:hook-manifest` | ✅ all exit 0 |
| the five other `freshness:*` gates | ✅ all exit 0 (three report their own vacuity in their own words) |
| `check:claim-anchors` / `check:audit-register` / `check:residual-citations` / `check:banned-claims` / `check:nul-bytes` / `check:imperative-lexicon` / `check:public-docs` / `check:platform-shapes` | ✅ `ALL CHECKS PASSED` (each) |
| `node scripts/check-foundation-guards.js` / `check-uat-oracles.js` / `validate-agent-factory.js` | ✅ `ALL CHECKS PASSED` (each) |
| `npx vitest run … check-foundation-guards.test.ts floor-invariance.test.ts` | ✅ `Test Files 2 passed (2)`, `Tests 422 passed`, guards **0.211 s** wall clock against a 60 s bound |
| `npx vitest run … scripts/uat-gate-exit-contract.test.ts` (the gate over the instance list) | ✅ `32 passed` after appending instance 14 |
| `grep -c '^- \[ \] \*\*UATX-0' .planning/REQUIREMENTS.md` | ✅ **6** |

**Closing measurements:**

- `git diff --stat 77123aa..HEAD -- .planning/REQUIREMENTS.md` is **EMPTY** — byte-unchanged across the whole round, even though `31-29`'s executor flipped `UATX-01` mid-round and reverted it in the same plan (`9edbe8e`). Six rows still `- [ ]`; six traceability rows still `Gaps Found`; `.planning/ROADMAP.md` line 100's Phase 31 checkbox still unchecked; the status cell still `In Progress`.
- `requirements.mark-complete` was **not run**. `roadmap update-plan-progress 31` was run and moved exactly three cells, all plan-progress: `30/31` → `31/31` in the phase's own line and in the milestone table, and `31-31-PLAN.md`'s checkbox to `[x]`. **It did NOT touch the phase status cell (`In Progress`), the Phase 31 checkbox at line 100, or any UATX row** — the memory-recorded failure mode where the executor's roadmap update flips a phase to Complete before verification did not occur here, and was checked for rather than assumed. One stale prose sentence (`31-31 NOT YET EXECUTED`) was corrected in the same commit series, and the round's record line now names what the closing measurement found.
- `.planning/STATE.md`'s longest line after the write: **7995 characters at line 18** (`prior_activity_desc`, pre-existing and untouched), unchanged. The `status:` field this plan rewrote is **1838** characters, down from 3756. Quadruple-backslash runs: **0**.
- `.temp/` is empty by a real listing (268 probe entries created and all 268 removed); the tree-wide named-pipe sweep prints nothing; the scratch kit outside the tree is FIFO-clean.

## Threat Flags

None. This plan modified no source file, added no network endpoint, no auth path, no file-access pattern and no schema at a trust boundary. `T-31-31-SC` (package-manager installs) stayed `accept`: no install command ran, and `package.json` / `package-lock.json` are byte-unchanged over this plan's whole range.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data source was introduced. Every row in `docs/audit/31-round6-residuals.md` that claims a closure cites a measurement taken in this session, and every row that could not be driven says so with its reason.

## Issues Encountered

**Two of this plan's own harness probes were wrong before their results were read** (deviations 3 and 4). Both were caught by a control or by an internal disagreement rather than by the number looking wrong, which is the discipline `31-30` built the tracked instance list for. One is logged as instance 14.

**The round-6 dispositions file's tally does not balance** (deviation 2). Raised, not repaired: the file is a planning input written before the round ran, it is history, and rewriting it here would destroy the evidence that the denominator was typed rather than derived.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready for a SEVENTH verification round** (`/gsd-verify-work 31`). `docs/audit/31-round6-residuals.md` is written for exactly that reader: §15 lists what it inherits, section by section, with the two things it most wants read first named (§8.2, the derived doctrine; §6.5, the moved pin).
- **Not ready, and not claimed:** `R-01` and `R-02` need a named human. `R-03` and `R-31-19-03` need a reading taken off a real `windows-latest` run — the instrument is wired and the reading is not taken. `R-31-31-01` (the ambient `declare` spelling) and the 14 unguarded `mkfifo` sites need a round-7 fix plan. The disposition debt stands at 80 with five rows owed by `31-29`.
- **The concern to carry into round 7, stated plainly.** Six rounds have produced their next Critical at the coordinate the previous fix did not reach. This round's fixes created two new single points of authority that a red team should probe before anything else: `governanceRootOf`, which both ends of a promotion now consult, and the symbol-identity resolver, whose `unresolved`/`foreign` tags decide every ban. `31-29` named the first pair; `31-28` named the second and asked for its widened decline matcher and the binder's whole-run granularity to be re-driven. **This plan re-drove the mechanisms; it did not red-team the two new chokepoints, and it does not claim to have.**

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-10*

## Self-Check: PASSED

- `docs/audit/31-round6-residuals.md` — FOUND
- `docs/audit/harness-false-result-instances.md` — FOUND
- `.planning/phases/31-autonomous-manual-testing/31-VALIDATION.md` — FOUND
- `.planning/phases/31-autonomous-manual-testing/deferred-items.md` — FOUND
- `.planning/STATE.md` — FOUND
- Commits `50bd67e`, `2d426dc`, `ea8c329` — all three resolve in `git log --oneline --all`
- `commits: 4` is MEASURED from the persisted ledger `.git/gsd-plan-head-before-31-31` (`a6539e7`): three task commits plus this metadata commit. `git rev-list --count a6539e7..HEAD` reported **3** before the metadata commit.
- Every plan-level `<verification>` bullet re-run and recorded above.

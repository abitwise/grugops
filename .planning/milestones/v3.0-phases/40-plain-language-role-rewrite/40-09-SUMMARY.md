---
phase: 40-plain-language-role-rewrite
plan: 09
subsystem: tooling
tags: [byte-budget, role-corpus, foundation-guards, ceilings, typescript]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: the rewritten 19 roles and protocol (40-03..40-07), the approved D-02 allocation (40-02), the board-move and end-state checks (40-08)
provides:
  - guard_role_corpus_total in scripts/check-foundation-guards.ts (ROLE_CORPUS_FAIL 67383, ROLE_CORPUS_WARN 64000)
  - ROLE_CEILINGS re-baselined from the Phase 40 measurement, every entry "Phase 40, measured N B"
  - seven "corpus total" cases in scripts/check-foundation-guards.test.ts
affects: [40-10, phase-41, phase-42]

actuals:
  tokens: 9383
  tasks: 2
  commits: 2
plan_head_before: 5fd4a901e89c79511fcdb2e50ad1e4ebc2f62ec7
plan_head_after: 55c8fdb4bea46b920402c9c9881248e58f1659c0

tech-stack:
  added: []
  patterns:
    - "Corpus-total cap beside per-file ceilings: derived scan set held two-sided to ROLE_COUNT + 1, fail closed with no total over a wrong set"
    - "Discriminating mirror case: every file green on its own ceiling while the total goes red"

key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - .planning/phases/40-plain-language-role-rewrite/deferred-items.md

key-decisions:
  - "Corpus scan set = listRoleDirEntries(ROOT) .md entries joined with the .md exemptions on disk; listRoleDirEntries alone excludes the protocol and would give 19"
  - "Discriminating FAIL case grows each role by 8% and puts the rest on the protocol (no per-file ceiling); a single common fraction would need 13.3% on this tree, over the +12% headroom"
  - "D-07 formula raised two FAIL ceilings: tech-lead 4000 -> 4128 (the dropped named-human value) and software-engineer 4979 -> 4982; the other 17 fell"
  - "No planted case moved: every existing plant still fits under the tightened ceilings and the total"

patterns-established:
  - "A size guard that reads a directory reports one line per member, sorted, then one verdict line with the count"

requirements-completed: [PLAIN-04]

duration: 40min
completed: 2026-11-01
status: complete
---

# Phase 40 Plan 09: Role corpus byte budget Summary

**A corpus-total guard holds all 20 role-corpus files under 67,383 B (WARN above 64,000 B), and all 19 per-file ceilings are re-recorded from the Phase 40 measurement with one formula.**

## Performance

- **Duration:** about 40 min (including a 23 min full-suite run)
- **Started:** 2026-11-01T16:06Z (after 5fd4a901)
- **Completed:** 2026-11-01
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `guard_role_corpus_total` sums the UTF-8 bytes of every `.md` in `agent-factory/roles/`, prints one line per file
  sorted by basename, and gives one verdict: FAIL above 67,383 B, WARN above 64,000 B, else PASS. A scan set whose
  size is not ROLE_COUNT + 1 (20) fails closed naming the count and every member, and no total is reported.
- It is wired into the run list after `guard_role_size` and named in the `guard_kit_counts` walk message.
- All 19 `ROLE_CEILINGS` entries now follow FAIL = ceil(bytes x 1.12), WARN = ceil(bytes x 1.06) from the live
  bytes, each commented `// Phase 40, measured N B`. The fail-closed unknown-role path and the two-way key check
  against `listRoles()` are unchanged.

## Measured on the live tree (wc -c, after 55c8fdb4)

**Role corpus total: 59,452 B over 20/20 files. PASS.** Under WARN by 4,548 B.

**Headroom for Phases 41 and 42: 67,383 - 59,452 = 7,931 B** (4,548 B before the WARN line). Phase 42's per-role
skills line at about 80-130 B per role needs about 1.5-2.5 KB, so it fits inside the WARN line with room for
Phase 41's orchestrator text.

Guard output:

```
[guard_role_corpus_total] all role text together stays under one byte budget (PLAIN-04, D-03/D-04)
    agent-factory/roles/_role-switch-protocol.md 2340 B
    ...
  PASS  role corpus 59452 B over 20/20 files; FAIL above 67383, WARN above 64000; 7931 B headroom
```

## Per-role bytes and new ceilings

| Role | Measured B | New FAIL WARN | Old FAIL WARN |
|------|-----:|-----|-----|
| orchestrator.md | 5844 | 6546 6195 | 7570 7165 |
| software-engineer.md | 4448 | 4982 4715 | 4979 4712 |
| tech-lead.md | 3685 | 4128 3907 | 4000 3786 |
| security-nfr.md | 3544 | 3970 3757 | 5102 4830 |
| frontend-ui.md | 2996 | 3356 3176 | 3969 3757 |
| release-manager.md | 2922 | 3273 3098 | 4765 4510 |
| architect-design.md | 2894 | 3242 3068 | 4243 4016 |
| ba-pm.md | 2880 | 3226 3053 | 4180 3901 |
| incident-responder.md | 2869 | 3214 3042 | 3802 3598 |
| agents-md-scribe.md | 2736 | 3065 2901 | 4544 4301 |
| compliance-officer.md | 2724 | 3051 2888 | 4813 4555 |
| factory-coach.md | 2684 | 3007 2846 | 3839 3633 |
| uat-planner.md | 2651 | 2970 2811 | 3540 3350 |
| designer.md | 2640 | 2957 2799 | 3273 3098 |
| qe-e2e.md | 2628 | 2944 2786 | 3822 3617 |
| installer.md | 2435 | 2728 2582 | 3938 3727 |
| greenfield-mapper.md | 2273 | 2546 2410 | 3045 2882 |
| system-analyst.md | 2249 | 2519 2384 | 3170 3000 |
| brownfield-mapper.md | 2010 | 2252 2131 | 2845 2693 |
| _role-switch-protocol.md | 2340 | none (corpus total only) | none |

The 19 FAIL ceilings sum to 63,976 B. With the protocol at 2,340 B that is 66,316 B, below the 67,383 B cap: on
today's tree the per-file ceilings alone would hold the roles under the cap, so the total's FAIL now matters for
the protocol (no per-file ceiling) and for any later re-baseline that raises a ceiling. Its WARN line does catch
uniform role growth that every per-file FAIL misses (the WARN case below).

**For the human: two FAIL ceilings went up under the D-07 formula.**
- `tech-lead.md`: 4000 -> 4128 B. 4000 was the value a named human (Olger Oeselg) approved on 2026-10-30 in quick
  task 261030-fzo. D-07 drops that history and the plan names this drop. The role is 3,685 B today.
- `software-engineer.md`: 4979 -> 4982 B (+3 B; it measured 4,445 B at 39-07 and 4,448 B now).
- The other 17 FAIL ceilings fell. No ceiling was raised to reach green: the live tree was green before and after.

## Pre-rewrite red transcript

The guard run against a temp tree (`git archive HEAD`) whose `agent-factory/roles/*.md` were replaced by
`git show e8d7802ccf8ebf428a47703f6001327325e3aea3:agent-factory/roles/<f>` (the Phase 40 start commit):

```
[guard_role_corpus_total] all role text together stays under one byte budget (PLAIN-04, D-03/D-04)
    agent-factory/roles/_role-switch-protocol.md 3509 B
    agent-factory/roles/agents-md-scribe.md 3949 B
    agent-factory/roles/architect-design.md 3865 B
    agent-factory/roles/ba-pm.md 3837 B
    agent-factory/roles/brownfield-mapper.md 2683 B
    agent-factory/roles/compliance-officer.md 4378 B
    agent-factory/roles/designer.md 3078 B
    agent-factory/roles/factory-coach.md 3625 B
    agent-factory/roles/frontend-ui.md 3937 B
    agent-factory/roles/greenfield-mapper.md 2929 B
    agent-factory/roles/incident-responder.md 3666 B
    agent-factory/roles/installer.md 3458 B
    agent-factory/roles/orchestrator.md 7272 B
    agent-factory/roles/qe-e2e.md 3706 B
    agent-factory/roles/release-manager.md 4166 B
    agent-factory/roles/security-nfr.md 5022 B
    agent-factory/roles/software-engineer.md 4631 B
    agent-factory/roles/system-analyst.md 3077 B
    agent-factory/roles/tech-lead.md 3776 B
    agent-factory/roles/uat-planner.md 3447 B
  FAIL  role corpus 78011 B over 20/20 files; FAIL above 67383, WARN above 64000 — over the hard cap; move role detail into the workflow that runs it (D-05)
```

The run exited 1. The total matches the 78,011 B the research recorded.

## Permanent "corpus total" cases

`npx vitest run scripts/check-foundation-guards.test.ts -t "corpus total"`: 7 passed (6 new cases, plus one
existing case whose name contains the phrase).

1. Green control: the unplanted mirror exits 0. The section lists all 20 members sorted by basename, the protocol
   included, and each line's bytes and the total match the mirror's own `Buffer.byteLength` measurement.
2. Adjacency at the cap: exactly 67,383 B gives WARN (not FAIL); 67,384 B gives FAIL.
3. Adjacency at WARN: exactly 64,000 B gives PASS; 64,001 B gives WARN.
4. Wrong-size scan set: protocol deleted (19) and an extra `_zz-extra-protocol.md` planted (21) each fail closed
   naming the count and the members, with no total verdict. Zero files: the run exits non-zero at kit derivation
   and prints no `PASS  role corpus`.
5. Uniform growth to WARN: all 20 files grow by one fraction f = 64,001 / total - 1 (asserted below 0.12);
   guard_role_size prints no FAIL, the total WARNs, and the run exits 0.
6. Discriminating FAIL: each role grows by 8% and the protocol takes the rest so the total is exactly 67,384 B;
   guard_role_size prints no FAIL and never names the protocol, the total FAILs, and the run exits non-zero.

## Dropped history comments (ROLE_CEILINGS)

Every trailing comment was replaced by `// Phase 40, measured N B`. Dropped:

- orchestrator.md: `+Phase-13 routing; measured 6759 B`
- security-nfr.md: `+Phase-14 D-09 severity-map; measured 4556 B`
- compliance-officer.md, release-manager.md, agents-md-scribe.md, architect-design.md, installer.md:
  `+Phase-22 WF18 pointer (baseline N B, +12% / +6%)`
- **ba-pm.md: `PERS-02 BA headroom (+20% / +12%); +Phase-21 WF16 pointer (baseline 3483 B)`** (the +20% exception)
- factory-coach.md, incident-responder.md, qe-e2e.md, uat-planner.md, system-analyst.md, greenfield-mapper.md,
  brownfield-mapper.md: `+Phase-21 WF16 pointer (baseline N B, +12% / +6%)`
- frontend-ui.md: `Phase 13 — 17th role (UI-01)`
- software-engineer.md: `Plan 39-07 (TIER-02 ...) measured 4445 B ... (was 3906 3697 ...)`
- **tech-lead.md: `Raised 2026-10-30 to FAIL 4000 B, approved by a named human (Olger Oeselg) ... quick task
  261030-fzo ...`** with its 39-05 / WR-14 / WR-05 history
- designer.md: `Plan 39-06 (TIER-05), 2026-10-29: measured 2922 B, +12% / +6% rounded up`

The header comment's "2026-06-10 baseline ... (ba-pm.md = +20% / +12% PERS-02 headroom)" sentence now reads the
Phase 40 formula. The D-17 / TIER-06 paragraphs stay, with one added Phase 40 paragraph saying all 19 entries were
re-baselined and the protocol is covered by the total. docs/audit/29-ceiling-rebaseline.md is unchanged.

## Moved plants

None. After the re-baseline the full `check-foundation-guards.test.ts` failed only one case, which is not a plant
(see Issues). The two comments that said `agents-md-scribe.md` has "~450 bytes of headroom" now say 329 B
(2,736 B against the new 3,065 B FAIL); the 93 B and the IN-03 plants stay in that file and still pass.

## Task Commits

1. **Task 1: corpus-total guard (tracer)** - `dc345754` (feat)
2. **Task 2: re-baseline ROLE_CEILINGS** - `55c8fdb4` (feat)

Tracer gate: interactive, `human_verify_mode: end-of-phase`, automated-only verify. Re-ran build, typecheck, the
`corpus total` cases and the guard; all passed, so Task 2 went ahead with no checkpoint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scan set as written in the plan would have held 19 files, not 20**
- **Found during:** Task 1
- **Issue:** the plan's scan set is `listRoleDirEntries(ROOT)` filtered to `.md`, but listRoleDirEntries drops the
  named exemptions, the protocol among them, so the count check against ROLE_COUNT + 1 would always fail.
- **Fix:** join the `.md` members of ROLE_DIR_EXEMPT_NAMES that exist on disk. The set equals every `.md` in the
  directory, a deleted protocol shows as 19, and a planted `_x.md` shows as 21.
- **Files modified:** scripts/check-foundation-guards.ts
- **Commit:** dc345754

**2. [Rule 1 - Bug] The discriminating case's precondition cannot hold on this tree**
- **Found during:** Task 1
- **Issue:** the plan grows every file by f = 67,384 / total - 1 and requires f < 0.12. Measured total 59,452 B
  gives f = 0.1334, so that case would fail its own precondition: one common fraction cannot cross the cap with
  every file under +12%.
- **Fix:** two cases instead. (a) One common fraction to the WARN line (f = 0.0765, precondition holds): every
  file green on its own ceiling, total WARN. (b) Each role grows by 8% (under +12%, and under the pre-re-baseline
  tech-lead ceiling of 4000 B, so the case was green at Task 1 too) and the protocol, which has no per-file
  ceiling, takes the rest up to 67,384 B: every per-file check green, total FAIL.
- **Files modified:** scripts/check-foundation-guards.test.ts
- **Commit:** dc345754

**3. [Rule 1 - Bug] Plan acceptance script for the ceiling formula skips qe-e2e.md**
- **Found during:** Task 2
- **Issue:** the acceptance one-liner matches keys with `[a-z-]+\.md`, which has no digit, so it never sees
  `qe-e2e.md`, counts 18, and exits 1 on `c===19` whatever the values are.
- **Fix:** no code change. The same script with `[a-z0-9-]+\.md` exits 0: all 19 entries follow the formula.
- **Commit:** none

**4. [Rule 1 - Bug] Stale headroom figure in two test comments**
- **Found during:** Task 2
- **Issue:** two comments said agents-md-scribe.md had about 450 B of headroom; after the re-baseline it is 329 B.
- **Fix:** comments updated; no plant moved.
- **Files modified:** scripts/check-foundation-guards.test.ts
- **Commit:** 55c8fdb4

---

**Total deviations:** 4 (2 plan details that could not work as written, 1 broken acceptance script, 1 stale
comment). **Impact:** the guard and the ceilings are exactly what the plan specifies; only the scan-set
derivation and the discriminating test's shape differ.

## Issues Encountered

- `check-foundation-guards.test.ts` fails 1 of 344: "every remaining floor item's LIVE COUNT is DERIVED, not asserted
  in prose". This is the test name the `~/` environmental case was recorded under, but today it fails on floor
  item 2 matching `scripts/check-role-rules.ts:594-595` (`headings.indexOf("## Responsibilities")`,
  `headings.indexOf("## Output")`, added by 40-08 in d35fa57c). Reproduced in a detached worktree at 5fd4a901 with
  no `~/` directory, so it is a 40-08 regression, not caused by 40-09, and it would stay red after `~/` is removed.
  Logged in deferred-items.md; not fixed (outside this plan's files).
- Full suite (e2e excluded), run after 55c8fdb4: 10,794 passed, 21 failed, 2 skipped. The 21 failures match the
  known set one for one by test file: installer-fs-census 1, canonical-corpus 1, context-io 7,
  context-io-writer-set 2, harness-instance-ledger 4, uat-gate-exit-contract 5, and check-foundation-guards 1 (the
  test above). This plan added no new failure.

## Verification

- `npm run build && npm run typecheck`: pass.
- `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED; no guard_role_size WARN or FAIL; `PASS  role corpus
  59452 B over 20/20 files`.
- `node scripts/check-role-rules.js`: exit 0.
- `npm run freshness`: 89 committed .js files match a rebuild. `npm run freshness:hook-manifest`: fresh.
- Acceptance: both constants present (exit 0); 19 `Phase 40, measured` lines; no `PERS-02` or `named-human` in the
  table; formula check (with the corrected key regex) exit 0.

## Next Phase Readiness

- 40-10 can rely on the total guard: any role edit that pushes the corpus past 64,000 B WARNs and past 67,383 B
  goes red in `node scripts/check-foundation-guards.js`.
- The 40-08 floor-item-2 failure should be closed before the phase is verified (deferred-items.md).

## Self-Check: PASSED

Files present: scripts/check-foundation-guards.ts, .js, .test.ts. Commits dc345754 and 55c8fdb4 are ancestors of HEAD.
`git rev-list --count 5fd4a901..HEAD` = 2 at SUMMARY time.

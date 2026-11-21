---
phase: 40-plain-language-role-rewrite
plan: 10
subsystem: tooling
tags: [writing-profile, sentence-gate, role-corpus, claim-registry, changelog, typescript]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: the plain-English roles and protocol (40-03..40-07), check-role-rules (40-08), guard_role_corpus_total (40-09), C-28-003 deferred by id (40-01)
provides:
  - check-imperative-lexicon governs a fifth derived part `roles` (20 files); GOVERNED_CORPUS_COUNT 69; ROLE_PART_COUNT = ROLE_COUNT + 1 pinned two-sided
  - writing-profile.md `| role bodies | build-time gate |`
  - C-28-003 back to `status: true` on the gate's measurement; F-28-202 closed
  - adapter-byte-baseline.test.ts RECORDED_CHANGED (one literal description record)
  - CHANGELOG Unreleased entry for the Phase 40 rewrite
affects: [phase-41, phase-42, phase-43]

actuals:
  tokens: 10075
  tasks: 3
  commits: 4
plan_head_before: 4d421c0ac702d39e7bdfb47158afdfb24fecefd1
plan_head_after: 0ebc03dff67b46e38c40ff1b107df1f6a548b6e8

tech-stack:
  added: []
  patterns:
    - "A governed part derived from a kit-model lister, joined with the named .md exemptions on disk, pinned per part and in aggregate"
    - "A later adapter byte change is a literal from/to record with its reason, applied only when `from` occurs exactly once"

key-files:
  created: []
  modified:
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.js
    - scripts/check-imperative-lexicon.test.ts
    - agent-factory/roles/security-nfr.md
    - .claude/agents/grugops-security-nfr.md
    - scripts/adapter-byte-baseline.test.ts
    - agent-factory/writing-profile.md
    - docs/audit/28-claim-registry.md
    - CHANGELOG.md

key-decisions:
  - "Roles part = listRoleDirEntries .md plus the .md exemptions on disk (the protocol), the same 20-file set guard_role_corpus_total sums; the plan's listRoleDirEntries-only set would give 19"
  - "security-nfr.md's 34-word Activates when sentence is reworded, not exempted (D-32): three sentences keep all 15 triggers; the adapter's Use when text follows and adapter-byte-baseline records it as RECORDED_CHANGED (D-3)"
  - "No lexicon term or approved verb added in plan 40-10 or anywhere in Phase 40 (D-32)"
  - "C-28-003 restored to true with its mechanism quoting live gate output; the README grug-brained wording is left to Phase 43"
  - "Stale Orchestrator quotes in C-28-001, C-28-010 and two sibling registry rows refreshed to the 40-07 text (closes the 40-07 deferred item)"

patterns-established:
  - "Each governed part names itself in the PASS line with its size; part counts in messages are derived from GOVERNED_CORPUS_PARTS.length"

requirements-completed: [PLAIN-07, PLAIN-01]

coverage:
  - id: D1
    description: "The role corpus (19 roles + protocol) is the fifth governed part of the sentence gate; 69 files in 5 parts; gate exits 0 on the live tree"
    requirement: PLAIN-07
    verification:
      - kind: unit
        ref: "scripts/check-imperative-lexicon.test.ts (69 passed)"
        status: pass
      - kind: other
        ref: "node scripts/check-imperative-lexicon.js -> 0 findings over 69/69"
        status: pass
    human_judgment: false
  - id: D2
    description: "Role adjacency, empty, count and encoding edges: 25/26 unnumbered, 20/21 numbered, modal in numbered item, emptied roles dir, 19 and 21 role files, words not bytes"
    requirement: PLAIN-07
    verification:
      - kind: unit
        ref: "scripts/check-imperative-lexicon.test.ts#guard_sentence_form over the role part (PLAIN-07)"
        status: pass
    human_judgment: false
  - id: D3
    description: "writing-profile lists role bodies as a build-time gate surface; C-28-003 true on measurement; F-28-202 closed"
    requirement: PLAIN-01
    verification:
      - kind: other
        ref: "npm run check:claim-anchors && node scripts/check-audit-register.js"
        status: pass
      - kind: unit
        ref: "scripts/check-claim-anchors.test.ts scripts/audit-model.test.ts (169 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "CHANGELOG Unreleased entry for the plain-English rewrite with no savings figure"
    verification:
      - kind: other
        ref: "node scripts/check-banned-claims.js && npm run check:public-docs; Unreleased grep for % and token empty"
        status: pass
    human_judgment: true
    rationale: "Whether the changelog wording reads correctly to an installed user is a reader judgement"

duration: 33min
completed: 2026-11-01
status: complete
---

# Phase 40 Plan 10: Role text joins the writing-profile gate Summary

**The sentence gate now reads all 20 role-corpus files as a fifth governed part (69 files in 5 parts, 0 findings), the one 34-word role sentence was reworded rather than exempted, C-28-003 is true again on that measurement, and the CHANGELOG records the rewrite.**

## Performance

- **Duration:** 33 min (including a 23 min full-suite run)
- **Started:** 2026-11-01T16:51:23Z
- **Completed:** 2026-11-01T17:24:05Z
- **Tasks:** 3 (4 commits)
- **Files modified:** 9

## Accomplishments

- `scripts/check-imperative-lexicon.ts`: new part `roles` from `listRoleDirEntries(ROOT)` `.md` plus the `.md`
  members of `ROLE_DIR_EXEMPT_NAMES` present on disk. Its own two-sided pin, `ROLE_PART_COUNT = ROLE_COUNT + 1`,
  fails naming the part and every member. The `agent-factory/roles/` entry is gone from
  `GOVERNED_CORPUS_EXCLUDED_LOCATIONS`. `GOVERNED_CORPUS_COUNT` moved 49 → 69 with the entrant named. Every
  "4 part(s)" message now derives its count.
- Live gate output: `corpus: 69 file(s) in 5 part(s) — workflows 19, checklists 15, seedTemplates 12, contracts 3,
  roles 20`; `sentence form — governed file(s): 0 findings over 69/69 elements`; imperative lexicon 0 over 19/19
  (no role carries `## Steps`).
- `agent-factory/writing-profile.md`: `| role bodies | build-time gate |`.
- `docs/audit/28-claim-registry.md`: C-28-003 `status: true`, `disposition`, `finding_id` and `target_phase` removed.
  Its mechanism quotes the gate lines above, `role clause uniqueness: 0 findings over 19/19 elements` and
  `caveman voice: 0 findings over 20/20 elements`, and keeps the `UNKNOWN - verify` sentence. The F-28-202 row reads
  `**true** | — | 40-10 — role bodies governed by guard_sentence_form; caveman blocks retired in 40-01; CLOSED`.
- `CHANGELOG.md` Unreleased: Added has check-role-rules, guard_role_corpus_total, role text as a governed surface,
  and the do-less rules and lean lens with the ponytail credit pointing at NOTICE. Changed has the role rewrite with
  `node install/install.js --update`, plus the security-nfr adapter's shorter `Use when:` text and how it reaches a
  repo (re-run install; `--check` names it stale). There is no savings, token or size figure.

## Task Commits

1. **Reword (D-32), before the gate change:** `f9c59d96` (feat), security-nfr.md, its regenerated adapter and
   the RECORDED_CHANGED record
2. **Task 1: role corpus joins the governed corpus (tracer):** `a9e61d6e` (feat)
3. **Task 2: writing profile row and C-28-003:** `c0ba28e7` (docs)
4. **Task 3: CHANGELOG:** `0ebc03df` (docs)

Tracer gate: interactive, `human_verify_mode: end-of-phase`, automated-only verify. I re-ran build, typecheck,
`npx vitest run scripts/check-imperative-lexicon.test.ts` (69 passed, 62 at HEAD, so +7) and the live gate
(69 in 5 parts, exit 0). All passed, so the plan went on with no checkpoint.

## Open issues handed to this plan

1. **security-nfr.md `## Activates when` (34 words): RESOLVED by rewording.** The plan's rule is "reword the role
   in a separate commit naming the file (D-32)", and its prohibition forbids narrowing the corpus. So this was not
   exempted. On the first run the gate reported exactly this one finding. The new text is three sentences that keep
   all 15 triggers ("queue/event" became "a queue or event"):
   `A change touches a risk-bearing surface, such as authentication, payments, personal data, a public API or a
   database migration. The other triggers are 2FA, biometrics, banking, investment data, GDPR, a file upload and an
   admin action. A queue or event, an external integration and a performance-sensitive flow are triggers too.`
   Ripple: `npm run generate:adapters` changed only `.claude/agents/grugops-security-nfr.md`. The catalog reads
   `## One job` only and did not change. Skill twins and host entries are fresh. adapter-byte-baseline gained a
   `RECORDED_CHANGED` record type: a literal from/to on the `description:` line, with its reason. It applies only
   when `from` occurs exactly once, and it is checked to name a baseline adapter that is neither added, removed
   nor the coordinator. No comparison was weakened (D-3). security-nfr.md is now 3,597 B, under its 3,757 B WARN.
   check-role-rules facts are unchanged (11 before / 14 after).
2. **Stale Orchestrator quotes in the registry: RESOLVED.** C-28-001, C-28-014 (old
   `orchestrator.md:88`), C-28-010 and C-28-029 (`same handoffs`) now quote the 40-07 text: Responsibilities items
   4-10 and 6-7, and the Hard limits line `Never relay data between agents; the shared verified context is the only
   channel.` Each is marked "quotes refreshed in plan 40-10". The deferred-items note on
   `28-disposition-register.md` F-28-008 is still open (that file is not in this plan).
3. **Workflow caveman/"grug" sentences and workflow 06's lean `In UAT → Done` owner: NOT TOUCHED**, out of
   files_modified. Listed under Next Phase Readiness.

## D-31: role-rule facts per file (`node scripts/check-role-rules.js`, live tree)

| File | Facts before N | After M | M ≥ N |
|------|---:|---:|:-:|
| _role-switch-protocol.md | 6 | 6 | yes |
| agents-md-scribe.md | 8 | 12 | yes |
| architect-design.md | 9 | 12 | yes |
| ba-pm.md | 10 | 14 | yes |
| brownfield-mapper.md | 7 | 11 | yes |
| compliance-officer.md | 10 | 12 | yes |
| designer.md | 9 | 12 | yes |
| factory-coach.md | 8 | 11 | yes |
| frontend-ui.md | 11 | 16 | yes |
| greenfield-mapper.md | 8 | 12 | yes |
| incident-responder.md | 8 | 10 | yes |
| installer.md | 8 | 12 | yes |
| orchestrator.md | 11 | 18 | yes |
| qe-e2e.md | 9 | 12 | yes |
| release-manager.md | 11 | 12 | yes |
| security-nfr.md | 11 | 14 | yes |
| software-engineer.md | 21 | 24 | yes |
| system-analyst.md | 9 | 12 | yes |
| tech-lead.md | 10 | 16 | yes |
| uat-planner.md | 11 | 14 | yes |

M ≥ N for all 20 files. Ten roles carry the one intended D-13 removal, and their floor (N − 1) is printed by the
check.

## Role corpus total and headroom

`guard_role_corpus_total`: **59,505 B over 20/20 files, PASS** (59,452 B after 40-09, plus 53 B from the
security-nfr reword). That is 4,495 B under WARN (64,000 B) and **7,878 B under FAIL (67,383 B)**. That is the
headroom for Phase 41's orchestrator text and Phase 42's per-role skills line.

## D-32: lexicon and approved-verb additions

**None, in this plan or anywhere in Phase 40.** `scripts/voice-model.ts` has no diff since e8d7802. The only
Phase 40 change to `scripts/check-imperative-lexicon.ts` is a9e61d6e, which adds the corpus part and no verb or
term. `APPROVED_STEP_VERBS` is still 43 and the derived Technical Names are still 78. Every plan summary 40-02..40-07
records "No lexicon addition".

## D-06: workflow and checklist bytes touched in Phase 40 (`git show e8d7802:<f> | wc -c` vs working tree)

| File | Before B | After B | Δ |
|------|---:|---:|---:|
| agent-factory/checklists/pr-review-checklist.md | 472 | 1008 | +536 |
| agent-factory/workflows/08-sprint-planning.md | 4577 | 4672 | +95 |
| agent-factory/workflows/14-ui-design-to-build.md | 7056 | 7238 | +182 |
| agent-factory/workflows/17-task-claim.md | 7168 | 8183 | +1015 |

No other workflow or checklist differs from the phase start commit e8d7802ccf8ebf428a47703f6001327325e3aea3.

## Phase gate

All run on HEAD 0ebc03df:

- `npm run build && npm run typecheck`: pass.
- `check-foundation-guards`, `validate-agent-factory` (VALIDATE_KIT_ROOT=.), `check-role-rules`,
  `check-imperative-lexicon`, `check-banned-claims`, `check-kit-refs`, `check-audit-register`, `check-state-paths`,
  `check-diff-disposition`, `check:claim-anchors`, `check:public-docs`: all exit 0, ALL CHECKS PASSED.
- `freshness` (89 .js), `freshness:adapters`, `:catalog`, `:skill-twins`, `:host-entries`, `:hook-manifest`,
  `:guarantees`, `check:build-parity`: all exit 0.
- `timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'`: **10,801 passed, 21 failed, 2 skipped** (1366 s).
  By file, the 21 failures match the recorded set: installer-fs-census 1, canonical-corpus 1, context-io 7,
  context-io-writer-set 2, harness-instance-ledger 4, uat-gate-exit-contract 5 (the 20 failures that already
  failed at e8d7802), plus check-foundation-guards 1.
- **I inspected the check-foundation-guards failure, not just matched it by name.** Its only diff is the `.js` walk
  listing 7 files under `~/projects/hacks/grugops-example-01/tools/grugops/`, the stray directory. That assertion
  stops the test before its floor-item counts run, so I ran the same test in a temporary detached worktree of
  HEAD with no `~/`. It **passed** (1 passed), so the 40-08 floor-item-2 regression (fixed in 4d421c0a) is gone,
  and this plan added no heading-prefix test. The worktree was removed afterwards.
- No new failure from this plan.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's roles scan set would hold 19 files, not 20**
- **Found during:** Task 1
- **Issue:** `listRoleDirEntries` drops the named exemptions, and the protocol is one of them (the same issue 40-09
  hit).
- **Fix:** join the `.md` exemptions that exist on disk. A deleted protocol shows as 19 and a planted `_x.md` as
  21, and the cases prove both.
- **Files modified:** scripts/check-imperative-lexicon.ts
- **Commit:** a9e61d6e

**2. [Rule 3 - Blocking] The D-32 reword moves a pinned adapter**
- **Found during:** Task 1 (the live gate's one finding)
- **Issue:** rewording security-nfr.md's `## Activates when` first sentence changes the generated adapter
  `description:`. `adapter-byte-baseline.test.ts`, which is outside files_modified, pins it byte for byte and had
  no record type for a changed shared adapter.
- **Fix:** regenerated the adapter with `npm run generate:adapters` and added `RECORDED_CHANGED`, a literal from/to
  record with its reason, validated in the records case. This is the change D-3 asks for ("a new literal record
  with its reason"). No comparison was removed or loosened.
- **Files modified:** agent-factory/roles/security-nfr.md, .claude/agents/grugops-security-nfr.md,
  scripts/adapter-byte-baseline.test.ts
- **Commit:** f9c59d96

**3. [Rule 2 - Missing] A per-part pin for the roles part**
- **Found during:** Task 1
- **Issue:** the truth "a count other than 20 fails ... naming the part" was only met through the aggregate pin's
  breakdown, which names a total and not which file.
- **Fix:** `ROLE_PART_COUNT` with a refusal that names the part and every member. Tests cover 19 and 21.
- **Commit:** a9e61d6e

**4. [Scope] Registry quotes refreshed (handed over from 40-07)**
- **Fix:** four mechanism quotes updated in the registry this plan owns. No gate reads them.
- **Commit:** c0ba28e7

---

**Total deviations:** 4 (1 bug, 1 blocking ripple, 1 missing check, 1 handed-over cleanup). **Impact:** the gate
is exactly what the plan specifies. Beyond its files, one role sentence, one generated adapter and one test record
moved.

## Known Stubs

None.

## Issues Encountered

None new. The 21 suite failures are the recorded set (see Phase gate).

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

Phase 40's last plan is done, so it is ready for the post-merge gate and the verifier. Follow-ups, outside this
plan's files:
- Workflows 00, 01, 02, 07, 10, 11, 12 and 13 still contain caveman or "grug" sentences (noted in 40-04, 40-05
  and 40-06).
- Workflow 06 does not name who makes the lean-mode `In UAT → Done` move. D-33 gives it to the Orchestrator.
- `docs/audit/28-disposition-register.md` F-28-008 still names orchestrator.md § Hard limits. Re-read it against
  the rewritten section.
- README.md:14 (C-28-003) still says "grug-brained"; that sentence is Phase 43's.
- The stray `~/` directory still causes the environmental check-foundation-guards failure. Removing it is the
  user's call.

## Self-Check: PASSED

- Files present: every file in key-files.modified exists. `.planning/phases/40-plain-language-role-rewrite/40-10-SUMMARY.md` written.
- Commits f9c59d96, a9e61d6e, c0ba28e7 and 0ebc03df are ancestors of HEAD. `git rev-list --count 4d421c0a..HEAD` = 4.
- Acceptance re-run: GOVERNED_CORPUS_COUNT 69 regex exit 0; `label: "the role corpus"` count 0; "5 derived part"
  count 1; C-28-003 `- status: true`; mechanism names guard_sentence_form (1); the profile row count is 1;
  check-role-rules in CHANGELOG 1; `install.js --update` 1; the Unreleased `%`/`token` grep is empty.

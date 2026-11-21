---
phase: quick-261030-fzo
plan: 01
status: complete
subsystem: config-reference, checkpoints, foundation-guards
tags: [checkpoints, notify, escalate_unadjudicable_result, role-ceiling, tech-lead]
requires: [phase 39 review-fix "Left for a human" HD-1..HD-3]
provides:
  - factory.config.md `notify` bullet deferring the record kind to Workflow 16
  - "**What `escalate_unadjudicable_result` gates.** paragraph"
  - ROLE_CEILINGS tech-lead.md 4000 3786 with dated human approval
affects: [agent-factory/config/factory.config.md, scripts/checkpoints.ts, scripts/check-foundation-guards.ts/.js, scripts/tier-kit-text.test.ts]
tech-stack:
  added: []
  patterns: [doc-to-source text pins in one `it`, derived-site pin against deriveCheckpoints()]
key-files:
  created: []
  modified:
    - agent-factory/config/factory.config.md
    - scripts/checkpoints.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/tier-kit-text.test.ts
decisions:
  - "HD-1: tech-lead.md role ceiling raised to FAIL 4000 B / WARN 3786 B, approved by Olger Oeselg on 2026-10-30"
  - "HD-2: `notify` records a note per Workflow 16; an unstampable record is an `observation`"
  - "HD-3: escalate_unadjudicable_result documented across Workflow 16, 18, 04 and the Workflow 04 step 15 re-score stop"
metrics:
  duration: ~7 min
  completed: 2026-10-30
estimate:
  tokens: 80000
  tasks: 3
actuals:
  tokens: 4073
  tasks: 3
  commits: 3
plan_head_before: 8c6c26f14526003898c354a04324ac4a732a6ab3
plan_head_after: aa21a823fccaf89861efb8f480dfef16fe1c12e6
---

# Quick 261030-fzo Plan 01: Phase 39 follow-ups (HD-1..HD-3) Summary

The config reference now says `notify` records a Workflow 16 note (an `observation` when the agent cannot stamp it). It also documents every place `escalate_unadjudicable_result` gates, including what each value does at the Tech Lead's Workflow 04 step 15 re-score stop. The tech-lead.md role ceiling is raised to 4000 3786 under Olger Oeselg's dated approval. Pins bind the config text to Workflow 04 step 15 and to the derived checkpoint sites.

## Commits per human decision

| HD | Finding | Commit | Message |
|----|---------|--------|---------|
| HD-2 | 39-WR-04 | 482bb8c6 | docs(quick-261030-fzo): `notify` records a note per Workflow 16, an `observation` when no stamp exists (HD-2) |
| HD-3 | 39-WR-03 | d1ed5855 | docs(quick-261030-fzo): say what `escalate_unadjudicable_result` gates, including the Tech Lead's re-score stop and each value there (HD-3) |
| HD-1 | 39-WR-05 | aa21a823 | fix(quick-261030-fzo): raise the tech-lead.md role ceiling to 4000 3786, approved by Olger Oeselg on 2026-10-30 (HD-1) |

## Step 0 baselines (HEAD before work)

- BASE: `8c6c26f14526003898c354a04324ac4a732a6ab3`
- Foundation-guard WARN count: `10`
- Tech-lead line: `  WARN  agent-factory/roles/tech-lead.md 3439B >= 3381B — approaching ceiling`
- Diff disposition: `721 finding(s)`
- `git status --short`: ` M docs/audit/28-prepass-evidence.md` (plus the untracked quick-task directory)
- `sha256sum scripts/checkpoints.js`: `b7070fbe99194a2bc7d451834fd2113efc4de557b82bcf75cbba12c03d415216`

## HD-2 `notify` consumer survey

`grep -rn "notify" agent-factory/workflows agent-factory/roles agent-factory/checklists install/README.md`:

| Hit | Record kind named |
|-----|-------------------|
| `agent-factory/workflows/04-ticket-to-pr.md:41` (step 15) | `observation`, twice ("At `notify`, also record an `observation` per Workflow 16 …" and "At `notify`, make the move and record an `observation` per Workflow 16 …") |
| `agent-factory/workflows/06-uat-pack.md:33` | none; it lists the `block`/`notify`/`off` vocabulary only |
| `install/README.md:1868` | none; at `notify` or `off` no ask rules are written |

No hits in `agent-factory/roles` or `agent-factory/checklists`. No consumer names a record kind other than `observation` or a stamped `finding` at `notify`, so the new wording is true for every consumer. Before writing the HD-3 closing sentence, `grep -n "notify" agent-factory/workflows/16-context-read-write.md agent-factory/workflows/18-context-compaction.md` printed nothing (exit 1), so the sentence stands as written.

## RED transcripts

N1-N3 (Task 1, on the HEAD tree, after the N2 filter fix described below):

```
× N1: … AssertionError: expected '- `notify` — the action proceeds and …' to contain 'recorded in a note per Workflow 16'
× N2: … AssertionError: expected '- `notify` — the action proceeds and …' to contain '`observation`'
× N3: … AssertionError: expected ' *   notify — the action proceeds and…' to contain 'per Workflow 16'
Tests  3 failed | 1 passed | 98 skipped (102)
```

E1-E4 (Task 2, on the Task 1 tree):

```
× E1: AssertionError: expected [] to have a length of 1 but got +0
× E2: AssertionError: no line starting **What `escalate_unadjudicable_result` gates.**: expected -1 to be greater than or equal to 0
× E3: AssertionError: no line starting **What `escalate_unadjudicable_result` gates.**: expected -1 to be greater than or equal to 0
× E4: AssertionError: expected '| `escalate_unadjudicable_result` | —…' to contain 'What `escalate_unadjudicable_result` …'
Tests  4 failed | 4 passed | 98 skipped (106)
```

GREEN: `Tests  8 passed | 98 skipped (106)` for `-t "261030-fzo"`.

## Ceiling arithmetic (HD-1)

```
$ node -e 'console.log(Math.ceil(4000*1.06/1.12))'
3786
```

## Foundation guards, before and after

| | Tech-lead line | WARN count |
|-|----------------|------------|
| Before | `WARN  agent-factory/roles/tech-lead.md 3439B >= 3381B — approaching ceiling` | 10 |
| After | `PASS  agent-factory/roles/tech-lead.md 3439B within ceiling` | 9 |

After: exit 0, `ALL CHECKS PASSED`. The committed `.js` carries `"tech-lead.md": "4000 3786",`.

## Final verification (after Task 3)

- `npm run typecheck`: exit 0
- `npm run freshness`: All build outputs fresh: 88 committed .js file(s) match a rebuild of their sources.
- `npm run freshness:hook-manifest`: Hook manifest fresh: 1 decider(s), 13 module hash(es) match a fresh derivation.
- `npm run freshness:runnable-embeds`: Runnable embeds fresh: 4 target(s) match a fresh derivation.
- Pinned tests (tier-kit-text, config-governance-consistency, checkpoints, floor-invariance, validate, check-kit-refs, admission-guard, check-foundation-guards): `Test Files 8 passed (8)`, `Tests 1029 passed (1029)`
- `check:imperative-lexicon`, `check:banned-claims`, `check:claim-anchors`, `check:residual-citations`, `check:public-docs`: all ALL CHECKS PASSED
- `node scripts/check-kit-refs.js`: ALL CHECKS PASSED
- `node scripts/validate-agent-factory.js`: with no env it refuses with `VALIDATE_KIT_ROOT is unset` (its documented C3 guard, not a failure of this change); `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`: ALL CHECKS PASSED, exit 0
- `check-diff-disposition`: `721 finding(s)`, the baseline. No disposition file was needed.
- `scripts/checkpoints.js` sha256 unchanged (`b7070fbe…`); `hooks/hook-entry.ts` and `.js` unchanged against 8c6c26f1.
- `git log --name-only --format= 8c6c26f1..HEAD | sort -u` lists exactly the five `files_modified` files. `docs/audit/28-prepass-evidence.md` was never staged and still shows ` M`.
- `git log --oneline 8c6c26f1..HEAD`: three commits on main.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pin N2's sentence filter matched the shared `notify`-or-`off` sentence**
- **Found during:** Task 1, step 1 (RED)
- **Issue:** The plan said to assert on every step 15 sentence starting with "At `notify`". That prefix also matches "At `notify` or `off`, raise one level …". That sentence describes the level move both values make and correctly names no record. So the pin could never go green without rewriting Workflow 04, which is out of scope.
- **Fix:** The filter now matches "At `notify`," (with the comma), which selects the two notify-only sentences. A comment in the test explains why. The `>= 2` non-vacuity check is kept and holds.
- **Files modified:** scripts/tier-kit-text.test.ts
- **Commit:** 482bb8c6

**2. [Minor] The checkpoints.ts pointer comment is three `//` lines, not two**
- The pointer text plus the full config path does not fit in two lines at the file's width. The comment is still type-level, so `tsc` erases it and `scripts/checkpoints.js` stays byte-identical.

**3. [Note] The validator needs `VALIDATE_KIT_ROOT`**
- The plan's bare `node scripts/validate-agent-factory.js` refuses with no root set; this is its existing C3 guard. It was run with `VALIDATE_KIT_ROOT=.` and passed.

## Human approval recorded

Only one human decision is recorded as approved: the tech-lead.md ceiling raise to FAIL 4000 B, approved by Olger Oeselg on 2026-10-30 (HD-1). The HD-2 and HD-3 wording follows the human's decisions to fix and to expand. Nothing else is recorded as human-approved.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: agent-factory/config/factory.config.md, scripts/checkpoints.ts, scripts/check-foundation-guards.ts, scripts/check-foundation-guards.js, scripts/tier-kit-text.test.ts
- FOUND commits: 482bb8c6, d1ed5855, aa21a823 (all ancestors of HEAD)

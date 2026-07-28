---
phase: 27-spawn-correctness-kit-set-authority
plan: 08
subsystem: tooling-guards
tags: [spawn-04, spawn-05, guards, dead-vocabulary, tier-announcement, defense-in-depth]
status: complete
requires:
  - "27-03 (derived adapter corpus: ADAPTERS, SPAWN_GRANT_SCAN)"
  - "27-04 (check-kit-refs derived sets, Assertion 2 grep-to-zero)"
  - "27-06 (packaging template body shapes + the memory sentence)"
  - "27-07 (the 17 generated adapters and the corrected 16-name grant)"
provides:
  - "scripts/dead-vocabulary.ts — the single retired-vocabulary source (path form + prose forms)"
  - "guard_adapter_body — both-direction adapter-body prose guard over 25 bodies"
  - "guard_wr05 tier-announcement presence (5 beats) + reported non-coordinator adapter count (23)"
affects:
  - "scripts/check-kit-refs.ts Assertion 2 (provenance of the path literal only)"
  - ".claude/skills/*/SKILL.md and skills/*/SKILL.md (memory sentence added)"
  - "agent-factory/packaging/subagent.frontmatter.md (memory sentence stated in live prose)"
tech-stack:
  added: []
  patterns:
    - "one authority per predicate — one retired-vocabulary module, two genuinely different consumers"
    - "one fence authority (stripFencedBlocks) + a whitespace normalization, never a second parser"
    - "guards report what they checked, with a vacuity floor on every derived scan set"
key-files:
  created:
    - scripts/dead-vocabulary.ts
    - scripts/dead-vocabulary.js
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/check-kit-refs.ts
    - scripts/check-kit-refs.js
    - agent-factory/packaging/subagent.frontmatter.md
    - .claude/skills/*/SKILL.md (7)
    - skills/*/SKILL.md (7)
decisions:
  - "The positive half's needle is checked over fence-stripped AND whitespace-collapsed text, so a hard wrap never decides a guard verdict"
  - "The packaging template states the memory sentence in live prose so one uniform rule covers all 25 bodies — no per-file special case"
  - "The 7 skill bodies gained the memory sentence in both shipped trees rather than being dropped from the scan set"
metrics:
  duration: ~25 min
  tasks: 3
  files_changed: 22
  completed: 2026-07-28
---

# Phase 27 Plan 08: guard_adapter_body and the tier-announcement assertion — Summary

Retired memory-relay vocabulary now has exactly one home, and two guards read it: `guard_adapter_body`
fails red both on the retired prose and on an adapter body that has gone stale by omission, while
`guard_wr05` additionally asserts the coordinator announces all three tiers honestly.

## What was built

**Task 1 — one exported retired-vocabulary source (commit `8c88be8`).**
`scripts/dead-vocabulary.ts` exports `RETIRED_PATH_FORMS` (the deleted handoff-template directory)
and `RETIRED_PROSE_FORMS` (the memory-relay noun phrase and the "only memory" clause).
`check-kit-refs` Assertion 2 imports the path form; its predicate, scan set and output wording are
byte-identical to the inline version it replaces. The module records the boundary a future editor is
most likely to get wrong — the execution-topology phrasing about one window with prior context
dropped is deliberately kept and must never join the list — and records that the module itself must
never enter a guard scan set. That exclusion holds *structurally*: `scripts/` is outside both the
`check-kit-refs` SCAN set and the new adapter-body scan set, so nobody has to remember it.

**Task 2 — `guard_adapter_body`, both directions (commit `6409f4d`).**
Scan set per D-25: the derived adapters (17 agents + 7 skills) plus the packaging template — 25
bodies, reported on the PASS line, with a vacuity floor so a collapsed set fails rather than reads
green. Negative half bans the retired prose (case-insensitively, naming file and phrase). Positive
half asserts every body names the shared verified context as its memory. Both read the body through
the single existing `stripFencedBlocks()`; no second parser was written.

**Task 3 — `guard_wr05` tier-announcement presence (commit `6b67c55`).**
Five guard-local beats — the `Full` / `Reduced` / `Degraded` labels, the reduced-path enforcement
disclosure, and the capability-sensing selection sentence — asserted present in the fence-stripped
body of the file carrying the coordinator marker, each named individually when absent. The existing
both-direction grant logic and cardinality check are intact; the PASS line now reports 23
non-coordinator adapter bodies plus 2 packaging templates, making the coverage the derived scan set
bought visible. No settings-file assertion was added, and a comment records why one must never be:
under D-01 the installer writes no main-thread wiring into a user's repository, so there is nothing
in a target repo to key on.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The 7 shipped skill bodies did not carry the memory sentence.**
- **Found during:** Task 2, before writing the guard.
- **Issue:** The plan states "Skill bodies and adapter bodies both carry the memory sentence under
  the template shapes from plan 27-06." Measured: all 17 agent adapters carried it; all 7 skills
  carried **zero** occurrences. The positive half would have failed red on the real tree.
- **Fix:** Applied the plan's own instruction — "fix the skill text rather than narrowing the scan
  set." Added one sentence to each skill body. Also mirrored it into the plugin-form `skills/` tree,
  which ships the same seven skills under unprefixed names; leaving that tree without the sentence
  would have been a fresh instance of exactly the stale-by-omission defect the positive half exists
  to catch. The plugin tree is *not* in the guard's scan set (D-25 scopes it to `.claude/`), so this
  is consistency work, not guard-satisfaction work.
- **Files modified:** `.claude/skills/*/SKILL.md` (7), `skills/*/SKILL.md` (7).
- **Commit:** `6409f4d`

**2. [Rule 3 — Blocking] The packaging template's memory sentence lives only inside its fenced body shapes.**
- **Found during:** Task 2, first guard run.
- **Issue:** The template's two body shapes are fenced markdown examples. After `stripFencedBlocks()`
  the memory sentence is gone, so the template — the one file D-25 adds to the scan set precisely
  because it is the upstream source — failed the positive half.
- **Fix considered and rejected:** exempting the template, or reading its raw bytes for the positive
  half only. Both create a second predicate and a per-file special case, which is the shape this
  milestone deletes.
- **Fix applied:** added a `**The memory sentence**` bullet to the template's "Why each field is
  shaped this way" section, stating the sentence in live, unfenced prose and naming the kept
  execution-topology phrasing as explicitly not banned. One uniform rule now covers all 25 bodies,
  and the template's own live prose states the contract it generates.
- **Files modified:** `agent-factory/packaging/subagent.frontmatter.md`.
- **Commit:** `6409f4d`

**3. [Rule 2 — Missing critical] Line-wrap sensitivity would have made both new guards decide on formatting.**
- **Found during:** Task 2, second guard run — the template bullet failed because the needle spanned
  a hard wrap at ~95 columns, which is how every body in this repo is written.
- **Issue:** A line-anchored substring check fails red on correct text depending purely on where the
  wrap landed, and goes green again on a re-wrap. That teaches people to reformat rather than to fix,
  and it is a real evasion on the negative half — the plan's own Flagged Assumptions list "a retired
  phrase split across a line break" as an uncovered edge.
- **Fix:** added `collapseWhitespace()`, applied *after* the single fence strip, in both
  `guard_adapter_body` halves and the tier-beat check. It is a normalization, not a parser; the
  fence authority is unchanged. Verified adversarially: the historical retired line planted with
  `the handoff\nis the only memory` split across a newline is now caught, and is pinned by a test.
- **Files modified:** `scripts/check-foundation-guards.ts`.
- **Commit:** `6409f4d`

### Acceptance-criterion correction (no code change)

Task 2's third criterion reads `grep -c 'handoff' .claude/agents/*.md | grep -c ':0$'` outputs `0`.
As written that is inverted: with a clean corpus each of the 17 files reports `:0`, so the pipeline
outputs `17`. The intent — "no generated adapter carries the retired vocabulary" — was verified
instead as `grep -l 'handoff' .claude/agents/*.md | wc -l` → `0`. No adapter or template gained a
comment or parenthetical recording the retired phrase.

## Adversarial verification (a green suite is not proof)

Every branch was reproduced by hand against the live tree before its test was written, then the
tree was restored (`git diff --stat` clean each time):

| Planted defect | Result |
|---|---|
| Historical retired line, wrapped mid-phrase, into the coordinator adapter | FAIL, naming both phrases |
| Memory sentence deleted from the coordinator adapter | FAIL, "never names the shared verified context as its memory" |
| Kept execution-topology prose appended to the coordinator adapter | PASS — the deliberately-kept text does not trip the ban |
| Each of the 5 tier beats removed in turn | FAIL, naming that beat and only that beat |
| Handoff-directory ref planted into a role file | Assertion 2 still fires (predicate preserved across the re-point) |

**Scan-set membership, proved rather than asserted.** Task 2's sixth criterion asks whether removing
the packaging template from the scan set breaks anything. It was done in a scratch copy: 42 of 44
cases still passed, and only the two new membership-pinning cases went red. The scratch change was
discarded. Before those two cases, nothing in the suite would have noticed the template being
dropped.

## Verification

All run and observed, never reported unrun:

- `node scripts/check-foundation-guards.js` → exit 0, **zero** FAIL lines
  - `guard_adapter_body`: `25 adapter body/bodies scanned (24 derived adapters + the packaging template)`
  - `guard_wr05`: `23 non-coordinator adapter bodies + 2 packaging template(s) checked`, `all 5 tier-announcement beats`
- `node scripts/check-kit-refs.js` → exit 0 (Assertion 2 wording unchanged)
- `node scripts/check-uat-oracles.js` → exit 0
- `node scripts/adapters-freshness.js` → exit 0
- `npm run freshness` → 29 committed `.js` match a fresh rebuild
- `npm run freshness:catalog` → fresh
- `npx vitest run --exclude '**/scripts/e2e/**'` → **864 passed, 2 skipped** (from 849/2)
- `npx vitest run scripts/check-foundation-guards.test.ts -t "adapter_body"` → 6 selected, 6 passed
- `npx vitest run scripts/check-foundation-guards.test.ts -t "wr05"` → 17 selected, 17 passed
- `grep -h '^tools:' .claude/agents/*.md | grep -c 'Agent('` → `1`
- `grep -l '^coordinator: true' .claude/agents/*.md | wc -l` → `1`
- `grep -c 'function stripFencedBlocks' scripts/check-foundation-guards.ts` → `1`
- `grep -c 'from "./dead-vocabulary.js"' scripts/check-kit-refs.ts` → `1`; same in the guards file → `1`
- `grep -n 'settings.json' scripts/check-foundation-guards.ts` → one hit, inside the comment recording
  that no such assertion is made

`npm test` was never run bare — it triggers the live Claude-CLI e2e lane.

## Notes for later phases

- The retired-vocabulary module is deliberately *not* in any scan set. Adding it would make it fail
  its own check. This is recorded in the module and holds structurally via `scripts/`.
- The kept execution-topology phrasing is pinned by a passing test. If that case ever goes red, the
  fix is to shrink the retired list — never to delete the prose.
- The tier beats encode the revised D-02 contract. Changing the tier vocabulary means re-cutting this
  guard, the packaging template, the generator's `coordinatorBody()` and the user-facing docs
  together (`reversibility: costly`, as planned).
- The coordinator adapter is unchanged by this plan, so the 17-byte warn-tier headroom recorded in
  27-07 is untouched. The template grew by ~7 lines; it carries no byte ceiling.

## Known Stubs

None. No placeholder values, no TODO/FIXME, no skipped tests were introduced.

## Self-Check: PASSED

- `scripts/dead-vocabulary.ts` — FOUND
- `scripts/dead-vocabulary.js` — FOUND
- `scripts/check-foundation-guards.ts` / `.js` / `.test.ts` — FOUND
- `agent-factory/packaging/subagent.frontmatter.md` — FOUND
- commit `8c88be8` — FOUND
- commit `6409f4d` — FOUND
- commit `6b67c55` — FOUND

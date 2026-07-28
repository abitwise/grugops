---
phase: 27-spawn-correctness-kit-set-authority
plan: 03
subsystem: testing
tags: [typescript, node, vitest, build-guards, set-derivation, scan-set-coverage, identifier-collision]

# Dependency graph
requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "plan 27-01 — scripts/kit-model.ts (listRoles/listWorkflows), the derived ROLE_FILES seam, guard_kit_counts, and the deliberately-RED guard_referential_integrity"
  - phase: 23-parallel-execution-orchestrator-as-decomposer
    provides: the inverted marker-keyed guard_wr05 and the shared stripFencedBlocks()
  - phase: 20-shared-verified-context
    provides: guard_context_writes and the CTX_WRITE_RE token-vs-prose calibration
provides:
  - "SPAWN_GRANT_SCAN — the derived, uniquely-named guards-side spawn-grant scan set (adapters ∪ packaging adapter-frontmatter templates)"
  - "derived ADAPTERS (.claude/agents/*.md + .claude/skills/*/SKILL.md), shared by three guards"
  - "SKILL_COUNT — the exact-count deletion detector for the one derived set KIT-03 cannot cover"
  - "derived CTX_WORKFLOWS — guard_context_writes now scans 19 workflows instead of 16"
  - "the D-19 dispositioned set-literal inventory, committed as prose in the guard source"
  - "three per-consumer derivation assertions, each mutation-checked"
affects: [27-04 check-kit-refs and validate-agent-factory derivation, 27-07 adapter generation, 27-08, 27-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Derivation replaces the LITERAL, never the SCOPING DISCIPLINE — a derived set is still a bounded set, and a deliberate exclusion becomes a SHAPE RULE rather than an omission"
    - "A derived membership list silently deletes the missing-file fail-red branch the literal had; restore equivalent deletion detection explicitly (non-empty floor + exact count) rather than pretending the branch still works"
    - "A COUNT is not the drift class being deleted: a list of names rots silently, a number can only fail closed"
    - "Rename by FILE PATH, never by identifier grep, when the same identifier means two different things in two files that import each other"
    - "Mutation-check a derivation assertion: revert the derivation in a scratch copy and confirm the case goes red, then discard the revert"

key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - agent-factory/workflows/18-context-compaction.md

key-decisions:
  - "The guards-side spawn-grant constant is renamed SPAWN_GRANT_SCAN and the former identifier now appears in exactly ONE file in the tree — including in comments, so a future `grep WR05_SCAN` resolves unambiguously to check-uat-oracles.ts. The inventory names it as 'the WR05-named constant' rather than restating the token."
  - "adapters.md stays out of the spawn-grant scan (D-09) by SHAPE RULE (*.frontmatter.md / *.template.md) rather than by omission from a list, so it cannot silently drift back in."
  - "The workflow-coverage increase surfaced a real hit in 18-context-compaction.md. Fixed the WORKFLOW TEXT (brace placeholders, identical D-08 path shape) — never the scan set and never the CTX_TOKEN predicate. Weakening a safety predicate to accommodate prose is the anti-pattern this milestone exists to close."
  - "Deletion detection lost by derivation was restored in two places, not one: a non-empty floor in guardAdapterSize() reporting BOTH counts, and SKILL_COUNT in guardKitCounts() — because the KIT-03 oracle covers agent-adapter deletion but cannot see a skill (a skill has no role to compare against)."
  - "The D-19 proof is a prose inventory plus per-consumer plants, never a grep-based stale-literal detector: such a detector would itself be a heuristic capable of being a strict subset of the real predicate."
  - "The harness's own adapter input set was derived too — a mirror carrying a hand-picked SUBSET of .claude/skills would trip the new count floor on every plant case instead of the violation it planted."

patterns-established:
  - "Derived-but-bounded: replace the literal, keep the scope. Widening a scan to a deliberately-omitted directory is a different defect wearing this phase's clothes."
  - "Restore-what-derivation-removed: name the behaviour the literal had, and rebuild it explicitly before the derived set ships."

requirements-completed: [KIT-02]

coverage:
  - id: D1
    description: "ADAPTERS, SPAWN_GRANT_SCAN and CTX_WORKFLOWS in check-foundation-guards.ts are all derived; no role, adapter, skill or workflow path is hand-listed in that file (D-16)"
    requirement: KIT-02
    verification:
      - kind: other
        ref: "grep -v '^//' scripts/check-foundation-guards.ts | grep -c '\".claude/skills/grugops/SKILL.md\"' → 0"
        status: pass
      - kind: other
        ref: "grep -v '^//' scripts/check-foundation-guards.ts | grep -c 'agent-factory/workflows/0' → 0"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#planted agent adapter reaches guard_adapter_size — ADAPTERS is derived, not re-listed (D-19)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CTX_WORKFLOWS covers all 19 workflow files, not the 16 it enumerated, so guard_context_writes scans the three workflows it previously skipped"
    requirement: KIT-02
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#planted workflow reaches guard_context_writes — CTX_WORKFLOWS is derived, not re-listed (D-19)"
        status: pass
      - kind: other
        ref: "scratch CHECK_ROOT mirror: raw write planted into the previously-unscanned 17-task-claim.md → guard fails red naming agent-factory/workflows/17-task-claim.md:47"
        status: pass
    human_judgment: false
  - id: D3
    description: "No identifier in check-foundation-guards.ts collides with the unrelated constant of the same former name in check-uat-oracles.ts, and that module is unmodified and still green"
    requirement: KIT-02
    verification:
      - kind: other
        ref: "grep -c 'WR05_SCAN' scripts/check-foundation-guards.ts → 0; same grep on scripts/check-uat-oracles.ts → 5 (unchanged); git diff --name-only never listed check-uat-oracles.ts"
        status: pass
      - kind: other
        ref: "node scripts/check-uat-oracles.js → exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Adapter and skill deletion still fail red — the derived-set vacuity floor and the referential-integrity oracle between them cover what the missing-file branch used to"
    requirement: KIT-02
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#guard_adapter_size emptied adapter directory → nonzero + names the directory and both derived counts (deletion floor)"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#kit count 6 skill adapters (one removed) → nonzero + names the derived 6 and the expected 7"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every re-pointed consumer carries a test asserting its set comes from the derivation rather than from a re-listed array (D-19), each proven by mutation"
    requirement: KIT-02
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#planted non-coordinator adapter with a spawn grant reaches guard_wr05 — SPAWN_GRANT_SCAN is derived (D-19)"
        status: pass
      - kind: other
        ref: "mutation: SPAWN_GRANT_SCAN re-listed as the old 4-file literal → rogue-spawner case FAILS; CTX_WORKFLOWS re-listed as the old 16-entry literal → planted-workflow case FAILS; both reverts discarded"
        status: pass
    human_judgment: false
  - id: D6
    description: "Adjacency/ordering/vacuity edge coverage — consumers of the same derivation receive identical membership and ordering, and no derived scan set can be empty in a passing run"
    requirement: KIT-02
    verification:
      - kind: other
        ref: "both parts of every derived set are .sort()ed before use; kit-model throws on a vacuous role/workflow set (27-01, D-21 tier 1); the adapter-side sets carry their own non-empty floor reporting the count found"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#GUARD_INPUTS derives exactly ROLE_COUNT role entries (the harness input set is not hand-listed)"
        status: pass
    human_judgment: false

# Metrics
duration: 17min
completed: 2026-07-28
status: complete
---

# Phase 27 Plan 03: Guard-Side Set Derivation and the Spawn-Grant Rename Summary

**The last three enumerating literals in `check-foundation-guards.ts` now derive from the filesystem — which widened `guard_adapter_size` from 2 adapters to 8, `guard_wr05` from 4 files to 10, and `guard_context_writes` from 16 workflows to 19, immediately catching a raw-context-write hit in a workflow that had never been scanned.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-07-28T19:42:00Z
- **Completed:** 2026-07-28T19:59:00Z
- **Tasks:** 3
- **Files modified:** 4 (0 created, 4 modified)

## Accomplishments

- **KIT-02 for the guard file is complete.** `ADAPTERS`, the renamed `SPAWN_GRANT_SCAN` and `CTX_WORKFLOWS` all derive from the filesystem. No role, adapter, skill or workflow path is hand-listed anywhere in `scripts/check-foundation-guards.ts`. The adapter derivation is declared **once**, above `guard_wr05`, and shared by three guards — the adapter directory is a single fact, and three hand-listed answers to it was the drift shape itself.
- **The coverage numbers moved, which is the whole point.** `guard_adapter_size` measured 2 adapters while the tree held 8 — the seven skill adapters had **never** been byte-checked. `guard_wr05` scanned 4 files while 8 adapters existed — the seven skills had never been checked for a rogue spawn grant. `guard_context_writes` enumerated 16 of 19 workflows. All three now follow the filesystem, and plan `27-07`'s 17 adapters will enter every one of them on the same run with no edit here.
- **The identifier collision is closed structurally.** The guards-side constant is `SPAWN_GRANT_SCAN`, and the former name now appears in **exactly one file** in the tree — including in comments, so a future `grep WR05_SCAN` resolves unambiguously. `scripts/check-uat-oracles.ts` was never opened for edit; `git diff --name-only` never listed it at any point, and it still exits 0.
- **Deletion detection was rebuilt, not assumed.** A derived membership list cannot fire the CR-01 missing-file branch — a deleted adapter simply stops being a member. Replaced with a non-empty floor in `guardAdapterSize()` that names the directory and **both** derived counts, plus a `SKILL_COUNT` exact assertion in `guardKitCounts()`. The split is deliberate: the KIT-03 oracle already names a deleted *agent* adapter by comparing against the role corpus, but a skill has no role, so its count is the only signal there will ever be.
- **The exclusion discipline survived derivation.** `agent-factory/packaging/adapters.md` is still out of the spawn-grant scan (D-09) — now excluded by a **shape rule** (`*.frontmatter.md` / `*.template.md`) rather than by omission from a list, so it cannot silently drift back in. No guard became a repo-wide grep.
- **The D-19 record is committed as prose.** A block comment in the guard source names all 14 dispositioned literals from `27-RESEARCH.md`, including the two deliberately left alone. It is prose on purpose: a grep-based stale-literal detector would itself be a heuristic capable of being a strict subset of the real predicate — green while a literal it cannot parse rots. No new guard was added; the count stays at 9.

## The coverage increase found something

The three previously-unscanned workflows entered `guard_context_writes` for the first time and one of them **failed immediately**:

```
  FAIL  SCTX-05 raw context write (bypasses context-io.ts):
agent-factory/workflows/18-context-compaction.md:22:The verbose trajectory lives in the ephemeral,
gitignored local tier `.grugops/context/<task>/threads/<agent>.md` — per-task-per-agent scratch, ...
```

The `>` closing the `<task>` placeholder reads as a shell redirect co-occurring with the context path. It is a **false-positive raw write**, the same class the guard's own comment already documents for ASCII arrows and blockquotes — the guard errs toward a false positive and never toward a bypass, by design.

Three responses were available and only one is honest:

| Option | Verdict |
|---|---|
| Narrow the scan set back to 16 workflows | Explicitly prohibited. It re-creates the coverage gap this plan exists to close. |
| Widen `CTX_TOKEN`'s negative lookbehind to exempt `<placeholder>` | **Rejected.** Weakening a safety predicate to accommodate prose is the failure shape this milestone closes; any lookbehind broad enough to exempt `<agent>` also risks exempting a real no-space redirect. |
| Fix the workflow text | **Chosen** — and what the plan directed. |

`18-context-compaction.md` now writes the path as `` `.grugops/context/{task}/threads/{agent}.md` ``. The D-08 per-task-per-agent path shape is **unchanged**; only the placeholder delimiters moved. Both placeholder occurrences in the file were converted so the file stays internally consistent.

## Task Commits

Each task was committed atomically:

1. **Task 1: derive ADAPTERS and restore deletion detection with a vacuity floor** — `15b7398` (feat)
2. **Task 2: derive and rename the spawn-grant scan set; derive CTX_WORKFLOWS** — `6707186` (refactor)
3. **Task 3: per-consumer derivation assertions and the dispositioned literal inventory** — `338205e` (test)

## Files Created/Modified

- `scripts/check-foundation-guards.ts` — the 14-entry D-19 inventory block comment; the shared adapter derivation (`ADAPTER_DIR`, `SKILL_DIR`, `SKILL_COUNT`, `readAdapterDir`, `AGENT_ADAPTERS`, `SKILL_ADAPTERS`, `ADAPTERS`) moved above `guard_wr05`; `SPAWN_GRANT_SCAN` + `PACKAGING_TEMPLATES`; derived `CTX_WORKFLOWS`; the non-empty floor in `guardAdapterSize()`; the `SKILL_COUNT` branch in `guardKitCounts()`; the duplicate `ADAPTER_DIR` declaration removed; four stale header-comment cardinalities corrected.
- `scripts/check-foundation-guards.js` — recompiled (`npm run freshness` exit 0, 26 committed `.js` match a fresh rebuild).
- `scripts/check-foundation-guards.test.ts` — derived `DERIVED_AGENT_ADAPTER_INPUTS` / `DERIVED_SKILL_ADAPTER_INPUTS` folded into `GUARD_INPUTS`; the missing-adapter case re-pointed onto the deletion floor; a skill-count case; the three D-19 plant cases.
- `agent-factory/workflows/18-context-compaction.md` — placeholder delimiters on the local-tier path (2 lines), removing the false-positive raw-write hit the coverage increase surfaced.

## Decisions Made

- **The former identifier is gone from the guard file even in comments.** The inventory row names it as "the WR05-named constant" instead of restating the token. This keeps `grep -c 'WR05_SCAN' scripts/check-foundation-guards.ts` at `0` and gives the tree a genuinely useful property: that grep now returns exactly one file.
- **`readAdapterDir` returns `[]` on an unreadable directory rather than throwing.** Unlike `kit-model.ts` (D-21 tier 1, where continuing is unsafe), here continuing is safe and the non-empty floor turns the empty result into a named red — the tier-2 posture. `guard_referential_integrity` keeps its own independent `readdirSync` + hard fail, because there an unreadable adapter directory must abort the comparison rather than be compared.
- **`SKILL_COUNT` lives in the guard file, not in `kit-model.ts`.** `kit-model` is the authority for the *kit* (roles and workflows); `.claude/skills` is an installed adapter surface, not kit content. Putting its count next to the derivation that reads it keeps the guard self-contained and avoids making `kit-model` a fourth authority over a directory it does not own.
- **Ordering is `agents`-then-`skills`, each sorted.** Guard output for a given tree is byte-identical across runs and platforms regardless of `readdirSync` order — the same property `kit-model` already guarantees for roles and workflows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Every hermetic mirror carried 1 of 7 skill adapters**

- **Found during:** Task 1
- **Issue:** `GUARD_INPUTS` mirrored only `.claude/skills/grugops/SKILL.md`. With `ADAPTERS` derived and a `SKILL_COUNT` floor of 7, every mirror-based plant case would have failed on `1 != 7` instead of on the violation it planted — masking all 34 existing assertions. Structurally identical to plan `27-01`'s workflow-mirror deviation.
- **Fix:** Derived the adapter portion of `GUARD_INPUTS` from `.claude/agents` and `.claude/skills` using the same shape rules the guard uses, so the harness input set and the guard's scan set cannot disagree. Removed the two now-redundant adapter literals.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** All 35 harness cases green after the fix; each plant case fails on its own planted violation.
- **Committed in:** `15b7398` (Task 1 commit)

**2. [Rule 3 - Blocking] The `guard_adapter_size missing adapter` case became structurally unreachable**

- **Found during:** Task 1
- **Issue:** The case deleted `.claude/agents/grugops-orchestrator.md` and asserted the CR-01 `<path> missing` branch named it. That branch only ever fired because `ADAPTERS` was a hand list pointing at a now-absent file. With derivation the deleted file is never discovered, so the assertion had no branch left to fire.
- **Fix:** Re-pointed, not deleted. The case now empties the derived agent-adapter directory and asserts the new non-empty floor names the directory and both counts (`.claude/agents: 0 adapter(s)`, `.claude/skills: 7 adapter(s)`). Its mirror-image — a single removed skill directory — got the `kit count 6 skill adapters` case, which is the plan's Task 3 skill-floor assertion landing one task early because Task 1 could not go green without it.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** Both cases green; the floor message is asserted by literal content, not by exit code.
- **Committed in:** `15b7398` (Task 1 commit)

**3. [Rule 1 - Bug] `18-context-compaction.md` failed the raw-context-write predicate once scanned**

- **Found during:** Task 2
- **Issue:** The angle-bracket placeholders in `` `.grugops/context/<task>/threads/<agent>.md` `` read as a shell redirect. A genuine finding surfaced by the coverage increase — not a regression, and not previously visible because the file had never been scanned.
- **Fix:** Converted both placeholder occurrences in that file to brace delimiters. The D-08 path shape is unchanged. The scan set was **not** narrowed and `CTX_TOKEN` was **not** weakened.
- **Files modified:** `agent-factory/workflows/18-context-compaction.md`
- **Verification:** Guard back to exactly one FAIL; `check-kit-refs.js` and `check-uat-oracles.js` both still exit 0.
- **Committed in:** `6707186` (Task 2 commit)

**4. [Rule 1 - Bug] Stale `27-06` flip-back pointer contradicted the new inventory**

- **Found during:** Task 3
- **Issue:** The KIT-03 run-all comment written by plan `27-01` names `27-06` as the commit that lands the adapters and turns the oracle green. Per the phase plan index that is wrong — `27-06` prepares role `capabilities:` frontmatter and the adapter body template; `27-07` has `.claude/agents` in `files_modified` and carries `KIT-03` in its requirements. The new inventory block correctly says `27-07`, which would have left two contradictory claims in one file.
- **Fix:** Corrected both references in `scripts/check-foundation-guards.ts` and recorded why inline.
- **Files modified:** `scripts/check-foundation-guards.ts`
- **Verification:** `grep -n '27-06' scripts/check-foundation-guards.ts` → no hits.
- **Committed in:** `338205e` (Task 3 commit)
- **Deliberately NOT fixed:** the four `27-06` mentions in `scripts/check-foundation-guards.test.ts`, one of which is the smoke case's **test name**. That name is cited as a coverage `ref` in `27-01-SUMMARY.md`; renaming it would break that back-reference for no functional gain, and plan `27-07` rewrites that case when it flips the assertion back to green. Logged below.

---

**Total deviations:** 4 auto-fixed (2 Rule 3 blocking, 2 Rule 1 bug). No Rule 4 architectural decisions arose.
**Impact on plan:** Deviations 1 and 2 were consequences the plan's own design made inevitable — deriving a set makes "missing member" structurally unreachable, exactly as plan `27-01` had already discovered for roles. Deviation 3 is the outcome the plan explicitly anticipated and pre-authorized. Deviation 4 is a two-line comment correction inside a file already being edited. None expanded scope.

## Issues Encountered

- **The plan's `grep -c 'pointer-sized'` acceptance value of `8` counts the PASS lines but not the guard's own header line**, which also contains the phrase. The literal grep returns `9`; `grep -c '^  PASS.*pointer-sized'` returns `8`, which is the number the criterion describes (one agent adapter plus seven skills). Recorded rather than papered over — the guard's header wording was not changed to satisfy a grep.
- **The Task 3 case count is `+3` against the immediately-preceding commit, not `+4`.** The plan assigned four cases to Task 3, but the skill-count floor case had to land in Task 1 to unblock it (deviation 2). Across the whole plan the harness went 34 → 38, which is the `+4` the criterion intends.
- **TDZ ordering forced the adapter derivation to move.** `SPAWN_GRANT_SCAN` sits at the top of the file and reads `ADAPTERS`, which was declared ~130 lines below it. Referencing a `const` before initialization is a runtime `ReferenceError`, not a compile error, so this would have shipped as a crash rather than a type failure. The derivation block moved above `guard_wr05` — which is the better structure anyway, since three guards now share it.

## Deferred Items

- Four `27-06` references remain in `scripts/check-foundation-guards.test.ts` (lines 153, 739, 805 and the smoke case's test name at 809). They should read `27-07`. Left in place because the test name is cited as a coverage `ref` in `27-01-SUMMARY.md` and plan `27-07` rewrites that case anyway. **Plan `27-07` should correct all four when it flips the smoke assertion back to green.**

## Known Stubs

None. No placeholder values, no unwired data paths, no skipped tests introduced.

## Threat Flags

None. No new network endpoint, auth path or schema change at a trust boundary. The three new read surfaces — `readdirSync` of `.claude/agents`, `.claude/skills` and `agent-factory/packaging` — are fixed literal subpaths joined onto the already-resolved `ROOT`, never taken from argv, env or file content (ASVS V12, matching the posture `kit-model.ts` and `generate-catalog.ts` already document). The guard remains strictly read-only.

Threat register dispositions from the plan, all `mitigate`, all applied:

| Threat | Applied as |
|---|---|
| T-27-10 (derived set loses the missing-file fail-red) | non-empty floor reporting both counts + `SKILL_COUNT` exact assertion + the KIT-03 oracle for agent adapters |
| T-27-11 (cross-file rename breaks the unrelated green oracle) | rename scoped by file path; `check-uat-oracles.ts` never opened; asserted unmodified and exit 0 |
| T-27-12 (a new non-coordinator adapter escapes the spawn-grant scan) | derived `SPAWN_GRANT_SCAN` + a planted rogue-spawner case, mutation-checked against a reverted derivation |
| T-27-13 (narrowing a scan to stay green after a coverage increase) | workflow text fixed; scan still covers 19 workflows, verified by a plant into a previously-unscanned file |

## Verification Run

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **820 passed, 1 skipped, 31 files** (baseline 816/817) |
| `npx vitest run scripts/check-foundation-guards.test.ts` | exit 0 — **38 cases** (was 34) |
| `node scripts/check-foundation-guards.js` | exit **1**, exactly **1 FAIL**, `guard_referential_integrity` (intended, RED until `27-07`) |
| `node scripts/check-uat-oracles.js` | exit 0 (file never modified) |
| `node scripts/check-kit-refs.js` | exit 0 |
| `npm run freshness` | exit 0 — 26 committed `.js` match a fresh rebuild |
| `grep -c 'WR05_SCAN' scripts/check-foundation-guards.ts` | `0` |
| `grep -c 'WR05_SCAN' scripts/check-uat-oracles.ts` | `5` (unchanged from its pre-task value) |
| `grep -c 'SPAWN_GRANT_SCAN' scripts/check-foundation-guards.ts` | `6` (> 1) |
| `grep -v '^//' … \| grep -c '".claude/skills/grugops/SKILL.md"'` | `0` |
| `grep -v '^//' … \| grep -c 'agent-factory/workflows/0'` | `0` |
| `grep -c '^  PASS.*pointer-sized'` on the live run | `8` (1 agent + 7 skills; `24` after `27-07`) |
| kit-count PASS line | `derived 17 roles, 19 workflows and 7 skill adapters (expected 17 / 19 / 7)` |
| mutation: `SPAWN_GRANT_SCAN` re-listed as the old 4-file literal | rogue-spawner case **FAILS** — revert discarded |
| mutation: `CTX_WORKFLOWS` re-listed as the old 16-entry literal | planted-workflow case **FAILS** — revert discarded |
| scratch `CHECK_ROOT` plant into `17-task-claim.md` | guard fails red naming `agent-factory/workflows/17-task-claim.md:47` — coverage increase is real |

`npm test` was never run — it triggers the live Claude-CLI e2e lane.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan `27-04` can proceed.** It owns inventory rows #5–#8 and #11 (`validate-agent-factory.ts`'s `WORKFLOWS`/`ROLES`, `check-kit-refs.ts`'s `SCAN`/`GH_SCAN`/`MARKER_SITES`). The committed inventory block in the guard source is its work list, and `check-uat-oracles.ts` remains deliberately untouched per the prohibition.
- **Plan `27-07` inherits three things.** (1) It must flip the smoke case to `status === 0` / `ALL CHECKS PASSED` once the 17 adapters land. (2) It should correct the four remaining `27-06` references in the test file at the same time. (3) Its 17 adapters enter `guard_adapter_size`, `SPAWN_GRANT_SCAN` and `guard_referential_integrity` automatically — the derived sets need no edit, but every adapter must clear the 4096 B ceiling and must **not** carry a spawn grant unless it is the coordinator.
- **Expect a red CI** on every commit between here and `27-07`. That is the KIT-03 RED evidence, not a regression, and the "exactly one FAIL" smoke assertion keeps any other regression from hiding behind it.

## Self-Check: PASSED

All 4 modified files exist on disk with the described changes; all 3 task commits (`15b7398`, `6707186`, `338205e`) are present in git history; the working tree is clean.

---
*Phase: 27-spawn-correctness-kit-set-authority*
*Completed: 2026-07-28*

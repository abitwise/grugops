---
phase: 27-spawn-correctness-kit-set-authority
plan: 07
subsystem: packaging/tooling
tags: [spawn, adapters, generator, freshness, kit-set-authority, claude-code]
status: complete
requires:
  - "27-01: guard_referential_integrity (the KIT-03 oracle this plan turns green)"
  - "27-03: kit-model.ts listRoles(ROOT) as the derived role-set authority"
  - "27-04: check-kit-refs MARKER_SITES + the two-sided resolver-slot predicate"
  - "27-06: capabilities: frontmatter on all 17 roles + the packaging body template"
provides:
  - "17 committed Claude Code sub-agent adapters at .claude/agents/grugops-<role>.md"
  - "scripts/generate-role-adapters.ts/.js — the templated adapter generator"
  - "scripts/adapters-freshness.ts/.js — byte-and-set drift gate"
  - "npm run generate:adapters / npm run freshness:adapters"
  - "a GREEN guard_referential_integrity for the first time in the milestone"
affects:
  - "27-08 (guard extension over the now-populated adapter corpus)"
  - "install.ts materializeAdapter loop — 17 targets instead of 1"
tech-stack:
  added: []
  patterns:
    - "mirror-spawn freshness gate (fifth instance) extended with directory set equality"
    - "derive the set from one authority, then assert a non-empty floor on it"
    - "build-everything-then-write, so a structural miss leaves no partial artifact"
key-files:
  created:
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - scripts/generate-role-adapters.test.ts
    - scripts/adapters-freshness.ts
    - scripts/adapters-freshness.js
    - ".claude/agents/grugops-<role>.md (16 new; grugops-orchestrator.md regenerated)"
  modified:
    - scripts/check-foundation-guards.test.ts
    - agent-factory/packaging/subagent.frontmatter.md
    - package.json
decisions:
  - "Adapter-name collision is compared CASE-INSENSITIVELY, so a role pair that is portable only to Linux is refused on every platform"
  - "description is emitted as a double-quoted YAML scalar unconditionally, because the derived prose carries colon-space"
  - "The KIT-03 RED regression fixture is CONSTRUCTED (brokenMirror), never inherited from the live tree"
metrics:
  duration: ~95 min
  completed: 2026-07-28
  tasks: 3
  commits: 3
---

# Phase 27 Plan 07: Generate the 17 Role Adapters Summary

Seventeen generated thin-pointer resolver adapters now back the seventeen kit roles, turning the
KIT-03 referential-integrity oracle green for the first time in the milestone, and a byte-and-set
freshness gate keeps them honest.

## What was built

**A templated generator, not seventeen hand-written files.** `scripts/generate-role-adapters.ts`
reads the role corpus through `listRoles(ROOT)` — the same kit-model authority the oracle consumes,
so the generator and the oracle cannot disagree about what a role is — and emits one adapter per
role into a fixed-literal `.claude/agents`. Descriptions derive from each role's `## One job` first
sentence plus its `## Activates when` line (D-12); tool grants derive from the role's
`capabilities:` key through the closed vocabulary published in the packaging template (D-11).
Nothing about an adapter is authored by hand.

**The grant arithmetic closes with no exception list.** Exactly one adapter — located by *role
basename*, never by an adapter filename — carries `coordinator: true` and a sorted 16-name
`Agent(...)` grant: 17 minus itself. The five enterprise-tier roles sit in that grant on the same
footing as the twelve core-tier ones (D-10). No other adapter carries a spawn token on its `tools`
line at all, which is the platform's path-independent mechanism rather than a parenthesised
allowlist that holds on only one path (SPAWN-04).

**Six structural misses fail at build time**, each naming the offending role file and leaving the
output directory byte-for-byte unchanged: an absent or empty `capabilities:` value, a token outside
the closed vocabulary, a missing `## One job`, a missing `## Activates when`, a non-ASCII role
filename, and an adapter-name collision. A seventh refusal covers a kit with no coordinator role.

**The freshness gate compares a directory, not a file.** `scripts/adapters-freshness.ts` is the
fifth mirror-spawn instance in the tree, with the half the single-file analogs do not need: byte
comparison *and* directory-listing set equality. Without the set half an orphan left by a deleted
role passes because nothing regenerates over it, and a missing adapter passes because nothing
compares against it.

## The oracle's green line

```
[guard_referential_integrity] role corpus == adapter directory == coordinator grant closure (KIT-03, D-09)
  PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
```

`node scripts/check-foundation-guards.js` now exits 0 with **zero FAIL lines**. The red window
opened deliberately in plan `27-01` is closed.

## The 17 adapters — bytes and emitted tool grants

Warn tier 3072 B, fail tier 4096 B. Every adapter is under the warn tier.

| Adapter | Bytes | `tools:` |
|---|---:|---|
| grugops-agents-md-scribe | 1720 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-architect-design | 1703 | Read, Grep, Glob, Edit, Write, Bash, WebFetch, WebSearch |
| grugops-ba-pm | 1670 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-brownfield-mapper | 1670 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-compliance-officer | 1815 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-factory-coach | 1696 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-frontend-ui | 1670 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-greenfield-mapper | 1662 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-incident-responder | 1716 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-installer | 1679 | Read, Grep, Glob, Edit, Write, Bash |
| **grugops-orchestrator** | **3055** | **Agent(16 sorted names), Read, Grep, Glob, Edit, Write, Bash** |
| grugops-qe-e2e | 1632 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-release-manager | 1761 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-security-nfr | 1987 | Read, Grep, Glob, Edit, Write, Bash, WebFetch, WebSearch |
| grugops-software-engineer | 1640 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-system-analyst | 1660 | Read, Grep, Glob, Edit, Write, Bash |
| grugops-uat-planner | 1650 | Read, Grep, Glob, Edit, Write, Bash |

The coordinator's grant, sorted: `grugops-agents-md-scribe, grugops-architect-design,
grugops-ba-pm, grugops-brownfield-mapper, grugops-compliance-officer, grugops-factory-coach,
grugops-frontend-ui, grugops-greenfield-mapper, grugops-incident-responder, grugops-installer,
grugops-qe-e2e, grugops-release-manager, grugops-security-nfr, grugops-software-engineer,
grugops-system-analyst, grugops-uat-planner`.

**Coordinator headroom is 17 bytes** against the 3072 B warn tier. That is thin and deliberate:
adding roughly two more lines to the coordinator body, or an eighteenth role, crosses the tier. The
packaging template now records the measured figure so the next author sees it before spending it.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The KIT-03 RED regression fixture had silently stopped testing anything**

- **Found during:** Task 1, running the suite after the adapters landed.
- **Issue:** Plan `27-01` wrote the "referential integrity RED" case against plain `mirror()`, on
  the stated belief that "a mirror carrying today's shape is referentially broken by construction"
  and that the case would "keep proving the oracle fires long after the real adapters land". That
  belief was wrong. `mirror()` builds `DERIVED_AGENT_ADAPTER_INPUTS` by reading the live
  `.claude/agents`, so the moment this plan generated the seventeen adapters the RED fixture became
  a *green* tree and the case stopped exercising the oracle at all. It failed loudly here, but only
  because it asserted a non-zero exit; a fixture that tracks the very thing it is meant to
  contradict is not a regression test.
- **Fix:** Added `brokenMirror()`, which re-creates the pre-27-07 shape explicitly — 17 roles, one
  adapter, the historical seven-name grant kept verbatim as a deliberately underived literal — and
  re-pointed the RED case at it. The RED evidence now survives every future change to the live
  adapter directory. Factored the shared `tools:` rewrite into `repointGrant()`.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `89147ac`

**2. [Rule 2 — Missing correctness] Adapter-name collision was not portable-safe**

- **Found during:** Task 2, writing the collision refusal case.
- **Issue:** The collision check compared adapter names exactly. Two roles whose names differ only
  by case are distinct files on a case-sensitive filesystem and the *same* file on a
  case-insensitive one (APFS, NTFS) — where the second adapter silently overwrites the first, the
  directory comes up one short, and nothing reports it. grugops ships to Windows, so the exact
  comparison would have let a Linux developer commit a role pair that destroys an adapter on a
  user's machine. This is precisely the "case-insensitive filesystem collapsing two adapter names"
  edge the plan's own Flagged Assumptions section named as uncovered.
- **Fix:** The collision map is keyed on the lower-cased adapter name while the message reports the
  real names, so a non-portable role set is refused on every platform.
- **Files modified:** `scripts/generate-role-adapters.ts` (+ committed `.js`)
- **Commit:** `7861991`

**3. [Rule 2 — Missing correctness] `description` had to be a quoted YAML scalar**

- **Found during:** Task 1, composing the derived description.
- **Issue:** The derived value always contains the literal `Use when: `, and the source prose
  legitimately contains more colon-spaces (`routing matrix: "Need AGENTS.md"`, `the triggers:
  authentication`). A plain YAML scalar may not contain a colon-space, so the unquoted form sketched
  in the packaging template would have produced adapters whose frontmatter does not parse and which
  the platform refuses to load — a runtime failure on a user's machine, from a file that looks fine.
- **Fix:** The generator always emits `description` as a double-quoted scalar with `\` and `"`
  escaped — unconditionally, because a rule that fires only on some inputs rots on the next role
  edit. Documented in the packaging template as part of the shape.
- **Files modified:** `scripts/generate-role-adapters.ts`, `agent-factory/packaging/subagent.frontmatter.md`
- **Commit:** `89147ac`

### Documentation corrections

**4. Stale plan references and a now-false measured byte budget**

- `scripts/check-foundation-guards.test.ts` carried four `27-06` references and a test name that
  attributed the adapter commit to plan `27-06`; `27-06` only prepared the `capabilities:` key and
  the template. Corrected to `27-07`. (The one remaining `27-06` reference, at the `guard_voice`
  plant-host comment, is genuinely about the `capabilities:` key and was left alone.)
- The smoke case was flipped from "exactly one FAIL and it is KIT-03" to "zero FAIL lines, fully
  green", per `27-01`'s explicit designation of this plan as the one that flips it. It now asserts
  the FAIL list *before* the exit code, so a future regression reports which guard broke rather than
  only that the exit was non-zero, and it additionally asserts the oracle's own green line so a
  silently-removed guard cannot pass as green.
- The packaging template's size budget said 2951 B / 1431 B. Measured as the generator actually
  emits, the coordinator is 3055 B and specialists run 1632–1987 B. The two elements the earlier
  estimate did not carry are the provenance header line and the quoted description. Corrected to the
  measured figures rather than left as a plausible-looking number.

### Deliberate departures from the plan text

**5. The freshness mirror copies what the generator reads.** The plan specified mirroring the
generator twin, the kit-model twin, the roles directory *and* the packaging directory. The generator
does not currently open `agent-factory/packaging`. It is mirrored anyway (per the plan) and the
header states plainly that it is not a current runtime input — kept so a future revision consulting
its declared upstream template finds it, and noting that an absent input would fail closed rather
than pass silently.

**6. Two acceptance-criteria counts in the plan were off; the tree is right, the criteria were not.**

- `grep -c 'pointer-sized'` was expected to output `24`. It outputs `25`: there are exactly 24
  adapter PASS lines (17 agents + 7 skills, as intended), plus the guard's own section header, which
  also contains the phrase. `grep -c '  PASS.*pointer-sized'` outputs `24`.
- `check-kit-refs` Assertion 3's legal set was expected to reach `18` (17 adapters + the packaging
  template). It reports `19`, because `.claude/skills/grugops/SKILL.md` was already a resolver
  carrying the slot before this plan. Both sides of the two-sided predicate agree, so it is green.
  The marker-site count is `26` exactly as predicted.

**7. One test case is platform-skipped, not faked.** The case-collision refusal needs two role files
differing only by case, which cannot be created on a case-insensitive filesystem — the platform the
guard exists to protect. The case is `skipIf`-guarded on a runtime case-sensitivity probe, so it
runs for real on case-sensitive CI and skips honestly here rather than asserting something weaker.
This is why the suite now reports 2 skipped instead of 1.

## Verification run

Every command below was run and its real output observed.

| Command | Result |
|---|---|
| `npm run build` | clean `tsc`, 28 committed `.js` twins |
| `node scripts/generate-role-adapters.js` | wrote 17 adapters, coordinator grants 16 names |
| `node scripts/check-foundation-guards.js` | **exit 0**, 0 FAIL lines, KIT-03 PASS |
| `node scripts/check-kit-refs.js` | exit 0, **26 marker sites**, 19 legal `$GRUGOPS_HOME` sites |
| `node scripts/check-uat-oracles.js` | exit 0 |
| `node scripts/adapters-freshness.js` | exit 0 — 17 compared, 0 byte differences, listings set-equal |
| `npm run freshness` / `freshness:catalog` / `freshness:adapters` | all exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **849 passed, 2 skipped, 32 files** |

Baseline before this plan was 830 passed / 1 skipped; the suite gained 19 generator cases and the
one platform-skip.

### Fail-closed paths exercised against the real tree (each reverted)

| Planted fault | Gate response |
|---|---|
| one byte appended to `grugops-qe-e2e.md` | exit 1, `STALE: 1 of 17 ... grugops-qe-e2e.md` |
| `grugops-uat-planner.md` deleted | exit 1, `1 MISSING adapter(s) ... grugops-uat-planner.md` |
| stray `grugops-zz-orphan.md` added | exit 1, `1 EXTRA committed adapter(s) ... (an orphan left by a deleted role)` |
| generator made to throw | exit 1, `the generator did not run cleanly`, never reported fresh |
| adapter chmod 000 | exit 1, naming the file and the regeneration command |
| one role's `capabilities:` emptied | generator exit 1 naming `qe-e2e.md`, output directory byte-identical |

### Negative controls on the new tests (each reverted)

| Mutation | Expected failing case |
|---|---|
| grant `.sort()` **and** `roleFiles.sort()` removed | ordering case fails — `expected ['grugops-software-engineer', …] to deeply equal ['grugops-agents-md-scribe', …]` |
| description derivation replaced with a stored string | derivation case fails — `expected '"A stored string…' to contain 'Break the feature'` |

The first control is worth recording: removing *only* the generator's grant sort did **not** fail
the test, because `roleFiles` is sorted independently. The control was re-run with both sorts
removed before the ordering assertion was accepted as load-bearing.

## Known Stubs

None. No `TODO`, `FIXME`, placeholder value or unwired code path was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary
was introduced. The generator's output root remains a fixed literal with no flag, env var or
content-derived component (T-27-28), and the six build-time refusals close T-27-29 and T-27-32.

## Notes for the next plan

- **Coordinator byte headroom is 17 B** against the warn tier. Plan `27-08` extends guards over the
  adapter corpus; if it adds anything to the coordinator body, it needs a trim in the same commit.
- **`brokenMirror()` is the permanent KIT-03 RED fixture.** Do not re-point any oracle case at plain
  `mirror()` — that helper tracks the live tree and will go green with it.
- **The adapter set is now derived everywhere.** `check-kit-refs` MARKER_SITES (26), Assertion 3's
  legal set (19), `guard_adapter_size` (24), `SPAWN_GRANT_SCAN` and the installer's
  `srcAdapterFiles()` all grew to cover the seventeen with no edit to any of them. Adding role #18
  requires bumping `ROLE_COUNT` in `kit-model.ts` and nothing else.

## Self-Check: PASSED

All seventeen adapter files, the generator, its test file, and the freshness gate (both `.ts` and
committed `.js`) were confirmed present on disk. All three commits were confirmed present in
`git log`: `89147ac`, `7861991`, `835bc88`. No commit deleted a tracked file.

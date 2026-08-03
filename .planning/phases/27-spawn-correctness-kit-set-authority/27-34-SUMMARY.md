---
phase: 27-spawn-correctness-kit-set-authority
plan: 34
subsystem: kit-derivation-authority / foundation-guards
tags: [spawn-grant, set-authority, cardinality-pin, plugin-distribution, pair-rule, name-floor, CR-03]
status: complete
requires:
  - scripts/kit-model.ts (walkFilesRelative, refuseEmpty, readDirOrThrow, spawnGrantScan, SPAWN_GRANT_SCAN_PARTS — plan 27-33)
  - scripts/frontmatter.ts (the D-43 delimiter refusal, parseFrontmatter, keysHaveSpawnGrant — plan 27-33)
  - scripts/check-foundation-guards.ts (guard_wr05's parse-failure branch, derive(), guardKitCounts)
provides:
  - "scripts/kit-model.ts — listPluginSkillAdapters, the plugin-form distribution authority"
  - "scripts/kit-model.ts — PLUGIN_SKILL_ADAPTER_COUNT = 7, two-sided"
  - "scripts/kit-model.ts — listPluginDefaultComponentFiles, the absence-or-coverage probe"
  - "scripts/kit-model.ts — SPAWN_GRANT_SCAN_COUNT raised 26 -> 33, four parts, per-part SET equality"
  - "scripts/check-foundation-guards.ts — guard_distribution_pair + DISTRIBUTION_PAIR_EXEMPT"
  - "scripts/check-foundation-guards.ts — the split name floor (no-block arm / no-name arm)"
affects:
  - scripts/check-foundation-guards.ts (guard_wr05 scan + PASS line, guardKitCounts)
  - scripts/check-foundation-guards.test.ts (GUARD_INPUTS, plantSkillWithoutToolsKey)
  - scripts/kit-model.test.ts (the composition cases, now four-part)
  - scripts/frontmatter.test.ts (the false-red control widened automatically — it reads the same object)
tech-stack:
  added: []
  patterns:
    - "derive the set, assert the count — extended to a FOURTH part with per-part SET equality on ALL parts"
    - "a PASS line names every input it read, or it is a fabricated completion claim"
    - "absence-or-coverage floors close the CLASS; they cost nothing while the surface is absent"
    - "normalize by REWRITING the discriminating field, never by deleting it"
    - "two different facts get two different messages — the founding argument of the frontmatter module"
key-files:
  created: []
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
decisions:
  - "D-40 point 1/2 landed: the plugin set is DERIVED and folded into the SINGLE exported composition, never a second composition in the guard"
  - "The composition pin is 33 (17 agent + 7 standalone skill + 7 plugin skill + 2 packaging), two-sided, with per-part SET equality on ALL FOUR parts"
  - "D-40 point 3's pair rule normalizes by REWRITING the name value, and asserts each side's declared name against the name its own directory implies FIRST — a deletion-based normalization is not discriminating"
  - "The exempted grugops pair delta is 448 bytes, not the plan's stated 446 — measured"
  - "The plan's plugin byte table was systematically 11-13B low on every row; the plan's inference (identical modulo the name value) is correct and was re-verified mechanically"
  - "A SINGLE leading U+FEFF is this parser's one normalization, so the plan's literal 'prefix the delimiter with a byte-order mark' does NOT reach the parse-failure branch; the refusing forms are two leading marks or a trailing mark"
metrics:
  duration: ~50 min
  completed: 2026-08-03
actuals:
  tokens: 23611
  tasks: 3
  commits: 3
---

# Phase 27 Plan 34: Close CR-03 (the shipped plugin-form skill tree) and the name-floor misdiagnosis Summary

The seven `skills/<n>/SKILL.md` files Claude Code loads for every `/plugin install` user are now derived
from the one filesystem authority, counted two-sided, inside the single exported spawn-grant scan
composition, named in the claim that reports on them, and mechanically pinned to their standalone twins
— and a rogue grant planted there turns the gate red instead of printing `ALL CHECKS PASSED`.

## What was built

**Task 1 — the derivation, the fold, and the claim that names it (D-40 points 1 and 2).**
`scripts/kit-model.ts` gained `listPluginSkillAdapters()` (same shape rule, same walk and same
fail-closed floor as the standalone skill half — one mechanism, never a second written to look almost
the same), `PLUGIN_SKILL_ADAPTER_COUNT = 7`, and `listPluginDefaultComponentFiles()` — an
absence-or-coverage probe for the `agents/` and `commands/` directories Claude Code's DEFAULT discovery
would load at plugin root. The SINGLE exported `spawnGrantScan()` was widened with the plugin part
(never a second composition in the guard), `SPAWN_GRANT_SCAN_COUNT` raised **26 → 33**, and
`SPAWN_GRANT_SCAN_PARTS` extended to four parts so the per-part SET equality covers all of them.
`check-foundation-guards.ts` enforces the cardinality in `guardKitCounts`, reports it in that guard's
pass line, adds the plugin-default component floor, and appends the plugin-skill count plus both
directory dispositions to `guard_wr05`'s PASS line — with the tier-announcement phrase byte-unchanged.
The plugin list is deliberately **not** in `ADAPTERS`: that list feeds the byte ceilings and the KIT-03
role-corpus equality, which ask about agent identity, and the scoping is recorded in place.

**Task 2 — the pair rule (D-40 point 3).** `guard_distribution_pair` resolves each plugin skill's
standalone twin by the naming rule, asserts each side's declared `name` equals the name its own
directory implies, rewrites the plugin form's name line to the twin's, and compares the full documents
byte for byte. A missing twin, a divergent pair and a **zero-pair run** are three distinct named
findings. `DISTRIBUTION_PAIR_EXEMPT` holds exactly one entry with its reason (the standalone form's
kit-root resolver block), its **bound** (the file stays inside the spawn-grant scan) and the forbidden
alternative recorded by name.

**Task 3 — the name floor reports the fact it observed (D-41 item 4).** The floor splits into a
zero-key arm ("carries NO FRONTMATTER BLOCK at all") and the existing no-name arm, whose wording is
kept byte-for-byte so the cases pinning it stay correct. The aggregator-level SPAWN-04 case drives a
mark-refused rogue grant through the whole gate on a standalone skill **and** on a plugin-form skill,
asserting the finding is the parse-failure one and **not** a name-floor one.

## Transcripts

All runs are against the **committed `.js`**, on hermetic `git archive HEAD` mirrors in a throwaway
temp dir. The live checkout was never planted into.

### Task 1 — the CR-03 plant, RED and GREEN

| mirror | RED (committed `.js` before) | GREEN (rebuilt committed `.js`) |
|---|---|---|
| grant added to `skills/plan/SKILL.md`'s allow-list | exit **0**, `ALL CHECKS PASSED`, WR-05 pass line: `(23 non-coordinator adapter bodies + 2 packaging template(s) checked)` | exit **1** — `skills/plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner` |
| unmodified mirror | exit 0 | exit **0** (the negative control) |

Live tree after the fix — the claim now names the input it read:

```
PASS  WR-05: … no non-coordinator does (23 non-coordinator adapter bodies + 7 plugin-form skill(s)
      + 2 packaging template(s) checked), and the coordinator body carries all 6 tier-announcement
      beats, each exactly once in live, non-fenced, non-commented text; plugin-default component
      directories: agents/ ABSENT, commands/ ABSENT
PASS  kit counts: derived 17 roles, 19 workflows, 7 skill adapters and 7 plugin-form skill adapters
      (expected 17 / 19 / 7 / 7); the spawn-grant scan composition holds exactly 33 members
      (agent 17 + skill 7 + plugin-skill 7 + packaging 2), each part set-equal to its own lister
```

Two counts became three on the WR-05 line; three derived numbers became four on the counts line.

### Task 1 — the cardinality pins, two-sided

| mirror | result |
|---|---|
| one plugin skill directory removed | **FAIL** — `derived 6 plugin-form skill adapters, expected exactly 7` **and** `composition derived 32 members, expected exactly 33 (agent 17 + skill 7 + plugin-skill 6 + packaging 2)` |
| one plugin skill added | **FAIL** — `derived 8 … expected exactly 7` **and** `composition derived 34 members, expected exactly 33 (… plugin-skill 8 …)` |
| plugin tree unreadable/absent | **FAIL** — `derived 0 …` with `derivation error: kit-model: cannot read kit directory …/skills` NAMED, and 0 unhandled exceptions |

### Task 1 — per-part membership, where the COUNT passes and SET equality does not

Scratch build of the committed `kit-model.js`: the standalone-skill part replaced by the plugin members
re-prefixed under `.claude/skills/`, with the plugin part still added — total held at exactly **33**.

- the cardinality check **passes** (33 = 33) — no `composition derived` line at all
- the per-part assertion **fails red**, naming the swapped part:
  `the spawn-grant scan composition's skill members are not exactly what .claude/skills/ derives —
  missing [6 real standalone paths], unexpected [.claude/skills/gate/SKILL.md … uat/SKILL.md]`
- gate exit **1**

This is the criterion's own shape: a membership claim about only the part being ADDED would have passed.

### Task 1 — the plugin-default component floor has teeth

| mirror | result |
|---|---|
| live tree | PASS — `plugin-default component directories: agents/ ABSENT, commands/ ABSENT` |
| `agents/rogue.md` carrying `tools: Agent(grugops-qe-e2e)` | **FAIL** — `1 file(s) under the plugin-default component directory \`agents/\` sit OUTSIDE the spawn-grant scan: agents/rogue.md …` exit 1 |

### Task 1 — the harness is proven to test the guard, not the mirror

Same plant, with the plugin tree DROPPED from the mirror inputs:

- occurrences of `skills/plan/SKILL.md: non-coordinator carries a spawn grant` — **0**
- what fires instead: `derived 0 plugin-form skill adapters, expected exactly 7` plus the composition
  floor at `0 members, expected exactly 33`

So a `GUARD_INPUTS` missing the plugin tree makes the plant case prove nothing, which is exactly why
`DERIVED_PLUGIN_SKILL_INPUTS` was added and why a case asserts its cardinality.

### Task 2 — the pair rule, both directions

Live tree: `PASS  D-40: 6 plugin/standalone skill pair(s) byte-identical after normalizing the \`name\`
value, 1 exempted by name (skills/grugops/SKILL.md — …)`.

| mirror | result |
|---|---|
| one BODY byte changed in `skills/plan/SKILL.md` | **FAIL** — `skills/plan/SKILL.md and .claude/skills/grugops-plan/SKILL.md DIVERGE beyond the \`name\` value (1193B vs 1201B)` |
| `.claude/skills/grugops-ticket/` deleted | **FAIL** — `skills/ticket/SKILL.md: its standalone twin … does not exist — a pair with a missing side is a FINDING, never a skipped comparison` |
| differs ONLY in the name value (the live shape) | **PASS**, 6 compared — the guard normalizes rather than byte-matching raw |
| plugin name set to a THIRD, wrong value | **FAIL** — `skills/plan/SKILL.md: declares \`name: zzz-wrong\`, expected \`name: plan\`` |
| plugin tree filtered to empty | **FAIL** — `the pair rule compared ZERO pairs (0 exempted, 0 plugin-form skill(s) derived)` |

**The discriminating case is load-bearing, proven by scratch build.** The normalization re-implemented
in a scratch `check-foundation-guards.js` as *"drop the name line from both sides before comparing"*:

| scratch build vs | result |
|---|---|
| the wrong-name mirror (`name: zzz-wrong`) | **`ALL CHECKS PASSED`, exit 0** — the case would have gone green over a wrong command name |
| the live tree | `PASS D-40: 6 … 1 exempted` — identical to the real implementation |

Every other control in the task passes identically under the deletion normalization. The wrong-name
case is the only one that separates them, which is what makes the rule mean anything.

### Task 3 — the two name-floor arms, on one mirror

```
.claude/agents/zz-no-block.md: agent adapter carries NO FRONTMATTER BLOCK at all — the parse returned
  zero keys for the whole document, which is a different fact from a block that declares keys without
  a `name`; … add the block rather than a key to a block that is not there
.claude/agents/zz-no-name.md: agent adapter carries no `name` key in its frontmatter — …
```

Both fire in one run; neither masks the other; exit 1. The no-name wording is byte-unchanged.

### Task 3 — the mark-prefixed rogue grant, on BOTH skill surfaces

Each row is a grant planted into the allow-list plus a mark at the delimiter, run through the whole
aggregator.

| mark placement | `.claude/skills/grugops-map/SKILL.md` | `skills/map/SKILL.md` |
|---|---|---|
| TWO leading U+FEFF | exit 1 — `frontmatter parse failure — the opening delimiter position carries \`<U+FEFF>---\`, whose leading residue renders no glyph of its own — it begins with U+FEFF …` | identical |
| U+FEFF TRAILING the payload | exit 1 — `frontmatter parse failure — … the first code point after the payload, U+FEFF, is outside the one whitespace class a delimiter may carry` | identical |
| ONE leading U+FEFF | exit 1 — `non-coordinator carries a spawn grant` (the mark is NORMALIZED, D-39 point 1; the grant behind it is read and convicted) | identical |

The cases assert the finding is the parse-failure one and **not** a name-floor one, so they cannot pass
for the wrong reason.

## Verification

| check | result |
|---|---|
| `npm run build && node scripts/freshness.js` | exit 0 — all **32** committed `.js` fresh |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1062 passed / 2 skipped**, 35 files, 0 failures (baseline 1035) |
| `npx tsc --noEmit` | exit 0 |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| KIT-03 oracle verdict | **unchanged** — `17 roles == 17 adapters == 17 grant-closure names`, still passing |
| live kit | 17 agent adapters, 7 standalone skills, **7 plugin skills**, 2 packaging templates |
| `git diff package.json` | empty (byte-unchanged; zero package-manager installs) |
| `grep -v '^[[:space:]]*//' scripts/check-foundation-guards.ts \| grep -c 'listPluginSkillAdapters'` | **2** (comment-filtered, per plan 27-33's mark criterion) |
| `git status --porcelain` | clean apart from this plan's `files_modified` |

Every plant ran against a throwaway `git archive HEAD` mirror; the live checkout was never mutated.

## Deviations from Plan

### Findings — measured values that disagree with the plan's literals

**1. [Rule 1 - Bug] The plan's measured-facts byte table is systematically low on every row**

- **Found during:** Task 1 (pre-flight measurement)
- **Issue:** The plan states `gate` 1187/1195, `map` 1200/1208, `plan` 1193/1201, `release`
  1222/1230, `ticket` 1161/1169, `uat` 1130/1138, `grugops` 1274/1720. Measured on disk today:
  1198/1206, 1213/1221, 1206/1214, 1233/1241, 1172/1180, 1141/1149, 1285/1733. Every row is 11–13
  bytes higher than stated; the exempted pair's delta is **448 B**, not the stated 446.
- **Assessment:** the plan's *inference* is correct and was re-verified mechanically — all six command
  pairs are byte-identical after swapping the name value, and only `grugops` diverges. Only the
  absolute numbers are stale.
- **Fix:** no literal byte count was written into code. The one number that is recorded — the 448-byte
  delta in `DISTRIBUTION_PAIR_EXEMPT`'s comment — is the MEASURED value, and the guard's divergence
  message reports the two sizes it actually read rather than any stored constant.
- **Files modified:** `scripts/check-foundation-guards.ts`
- **Commit:** `a317223`

**2. [Rule 1 - Bug] "Prefix the opening delimiter with a byte-order mark" does not reach the
parse-failure branch**

- **Found during:** Task 3
- **Issue:** The plan's action step says to prefix the opening delimiter with a byte-order mark "so the
  input exercises the parser refusal landed in plan 27-33". Measured against the committed `.js`: a
  **single** leading U+FEFF is the one byte this module NORMALIZES (D-39 point 1, and 27-33's own
  transcript table says so). It does not refuse — the grant behind it is read and the file is convicted
  as a *rogue spawner*. A case written to the plan's literal instruction, asserting a parse-failure
  finding, would have failed; a case asserting only a non-zero exit would have passed while the
  parse-failure branch was dead.
- **Fix:** the refusing forms were measured (two leading marks, or a mark trailing the payload) and the
  case uses those. The single-leading-mark outcome is pinned as its own case rather than discarded,
  because the difference between "refused" and "normalized then convicted" is the whole content of the
  claim. Both refusing forms and the normalized form are exercised on BOTH skill surfaces.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `716572e`

### Auto-fixed

**3. [Rule 3 - Blocking] `plantSkillWithoutToolsKey` now plants on both distribution forms**

- **Found during:** Task 2
- **Issue:** The IN-01 scoping case removes `allowed-tools:` from `.claude/skills/grugops-map/SKILL.md`
  and asserts the whole tree stays `ALL CHECKS PASSED`. With the new pair rule live, a one-sided
  removal is a genuine divergence and reds `guard_distribution_pair` — correctly, but for a reason
  having nothing to do with the scoping gate that case exercises.
- **Fix:** the fixture plants the same removal on the plugin twin as well, so the input to `guard_wr05`
  is unchanged (a skill with no allow-list, on both surfaces it scans) while the pair stays intact. The
  case's `ALL CHECKS PASSED` assertion stays honest rather than being weakened to accommodate a real
  finding. The reason is recorded on the helper.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `a317223`

### Deliberate scope decisions

- **The plugin set is NOT in `ADAPTERS`.** Confirmed by reading all three consumers first
  (`guard_adapter_size`, `guard_adapter_body`, `guardReferentialIntegrity`). KIT-03's verdict is
  unchanged at `17 == 17 == 17`, which is the mechanical proof the set did not leak.
- **A nested plugin skill maps to a twin that does not exist and is reported as a MISSING TWIN**, not
  skipped. A pair the naming rule cannot express is a finding, never a silence.
- **`listPluginDefaultComponentFiles` deliberately does NOT carry `refuseEmpty`.** Absence is the
  expected and correct state; a throw would fail the live tree. It reports every file regardless of
  extension, because an extension filter would let a granted file hide under a name it cannot see.

## Known Stubs

None. Every predicate this plan added is live code reached by at least one case, and every acceptance
criterion carrying a "captured transcript" requirement has one recorded above.

## Threat Flags

None. Every mitigation in the plan's threat register landed as code plus a case:
T-27-CR03-01 (the plugin tree derived and scanned, plant on a SKILL adapter), T-27-CR03-02 (the PASS
line names the plugin count), T-27-CR03-03 (two-sided plugin cardinality), T-27-CR03-04 (the
plugin-default absence-or-coverage floor, proven by the `agents/rogue.md` mirror), T-27-D40-01 (the
pair rule), T-27-D40-04 (the discriminating wrong-name case, proven load-bearing by scratch build),
T-27-D40-02 (the exemption's bound asserted — the exempted file is in the scan), T-27-D41-04 (the split
name floor, two different strings asserted different), T-27-D40-03 (the plugin derivation goes through
`derive()`; an unreadable directory is NAMED by the count floor and the run continues), T-27-SC (zero
package-manager installs; `package.json` byte-unchanged).

## Commits

| commit | task |
|---|---|
| `9934602` | Task 1 — derive the plugin tree, fold it into the one composition (26 → 33, four parts), name it in the claim, plugin-default floor |
| `a317223` | Task 2 — the pair rule with one divergence exempted by name, reason and bound recorded |
| `716572e` | Task 3 — the split name floor and the mark-prefixed plant on both skill surfaces |

## Self-Check: PASSED

All six claimed files exist on disk; all three claimed commit hashes resolve in `git log`; the three
load-bearing new symbols (`listPluginSkillAdapters`, `PLUGIN_SKILL_ADAPTER_COUNT = 7`,
`SPAWN_GRANT_SCAN_COUNT = 33`) are present in `scripts/kit-model.ts`, and `guardDistributionPair` plus
`DISTRIBUTION_PAIR_EXEMPT` are present in `scripts/check-foundation-guards.ts`.

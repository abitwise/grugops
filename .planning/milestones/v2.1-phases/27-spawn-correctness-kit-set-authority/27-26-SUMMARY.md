---
phase: 27-spawn-correctness-kit-set-authority
plan: 26
subsystem: tooling / foundation guards (guard_wr05)
tags: [security, spawn-grant, fail-open, cardinality, gap-closure, guard-self-consistency]
status: complete
requires:
  - "scripts/frontmatter.ts — FrontmatterKeys already maps a key name to the list of values its occurrences carried (no parser change needed)"
  - "plan 27-19's name-key cardinality refusal — the rule this arm mirrors"
  - "plan 27-20's tools floor — the absence and emptiness arms this arm joins"
provides:
  - "a CARDINALITY arm on the allow-list keys inside guard_wr05's tools floor, covering both key spellings on every scanned surface"
  - "a deliberate REFUSE disposition for the two-different-key-names adjacency, stated beside the arm and pinned by a case"
  - "8 new cases: the duplicate-key reproduction on both spellings, the one-occurrence control, the emptiness interplay, the adjacency disposition, the 7-spelling false-red control walk, the exact-integer assertion, the both-findings-reported assertion"
affects:
  - "guard_wr05 (SPAWN-04) — a repository carrying a duplicate allow-list key now fails the gate where it previously passed"
tech-stack:
  added: []
  patterns:
    - "one predicate, one rule — a cardinality refusal belongs beside the absence and emptiness arms of the same answer, not in a second check"
    - "widen the loop and scope the arms explicitly, rather than adding a parallel loop for the surface the old scope excluded"
    - "refuse the DOCUMENT for having two answers rather than preferring an occurrence — closes the fail-open direction without narrowing the fail-safe disjunction"
    - "prove the non-firing side by walking one declaration through every legitimate spelling, not by asserting one spelling"
key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
decisions:
  - "The two-different-key-names shape is REFUSED, as its OWN finding rather than folded into the per-key count — the platform reads one spelling per surface while keysHaveSpawnGrant() reads both as one answer, so such a document hands one predicate two authorities."
  - "The tools floor's loop widened from AGENT_ADAPTERS to SPAWN_GRANT_SCAN with the absence and emptiness arms gated behind an explicit isAgentAdapter flag. Cardinality is a defect on any surface that declares the key; absence is not. One loop, three arms, scopes stated — not a second check for the skill surface."
  - "keysHaveSpawnGrant()'s disjunction is left exactly as it is. It is fail-safe in the rogue direction; narrowing it to close the coordinator direction would re-open the rogue one. The cardinality arm closes the second direction without touching the first."
  - "The cardinality arm sits AFTER the absence/emptiness if-else chain rather than inside it, so two empty declarations produce BOTH findings."
  - "The false-red control walks 7 spellings, not the sibling's 5: the block SEQUENCE (the shipped skill form) and the one-line plain scalar were added because a false red on the shipped form would cost the most."
metrics:
  duration: ~40 min
  completed: 2026-07-31
  tasks: 2
  commits: 2
  files_changed: 3
---

# Phase 27 Plan 26: Give the Allow-List Key Its Cardinality Arm Summary

`guard_wr05` was inconsistent with itself: plan 27-19 refused a `name` key carrying anything other
than exactly one value, and plan 27-20 — thirty lines away, in the same function, over the same
parse — gave the allow-list answer an **absence** arm and an **emptiness** arm and no **cardinality**
arm. A coordinator declaring `tools:` twice passed both WR-05 and KIT-03 while a last-wins loader saw
no grant at all. The third arm now sits beside its two siblings, covering both key spellings on every
scanned surface, with the threshold pinned on both sides.

**Base commit sha (the pre-plan guard every RED below was measured against):**
`7a4b7cc64f5ccf1f862b3b33ad3d0f246f0923a8`

## What Was Built

**Task 1 — the arm, the rebuilt `.js`, and five cases** (commit `a70b2ba`)

The tools floor gained a per-key occurrence count:

```ts
for (const k of TOOLS_KEYS) {
  const occurrences = keys.get(k) ?? [];
  if (occurrences.length > 1) {
    wr05Fail += `\n${f}: declares the \`${k}\` allow-list key ${occurrences.length} times — a tool allow-list has ONE authority and must have ONE answer; which occurrence the platform's YAML loader honours (first, last, or a duplicate-key throw) is not this guard's to guess`;
  }
}
```

The keys are counted **individually**, not through the `TOOLS_KEYS.flatMap` the absence and emptiness
arms use: the flattened list cannot tell one key declared twice from two different keys declared
once, and those are different findings with different reasons.

`FrontmatterKeys` already maps a key name to the list of values its occurrences carried, so occurrence
counting needed **no parser change** — `scripts/frontmatter.ts` is untouched by this plan.

**Task 2 — the false-red control, the integer precision assertion, the ordering assertion** (commit
`4b75565`). Test-only; `git diff --numstat` on the plan's test file reads `115 0` — additions only,
zero deleted lines.

## The two-key-names disposition — REFUSED

The plan required this adjacency to be dispositioned deliberately and pinned either way. It is
**refused**, as its own finding. The comment recording it, verbatim from
`scripts/check-foundation-guards.ts`:

```
// THE TWO-KEY-NAMES SHAPE IS DISPOSITIONED, NOT LEFT UNCONSIDERED — an unconsidered adjacency is
// how the two arms above came to be written without this one. DISPOSITION: a document declaring
// BOTH `tools` and `allowed-tools` is REFUSED, for the same reason and by a sibling arm. The
// platform reads exactly ONE of the two per surface (`tools` on a sub-agent, `allowed-tools` on a
// skill or command) while keysHaveSpawnGrant() reads BOTH as one answer, so such a document hands
// two authorities to one predicate: the guard could convict on a list no loader reads, or clear a
// file on a list the loader ignores. Which spelling is honoured is not this guard's to guess
// either. The committed tree uses one spelling per surface and no file carries both, so the arm
// has no live cost; a case pins the disposition in both directions.
```

The finding is deliberately **not** the per-key count — "one key twice" and "two different keys once
each" are different facts. The case asserts the two-authorities wording is present *and* that the
per-key cardinality wording is absent, so neither can stand in for the other.

The "no live cost" claim was measured before the disposition was chosen, not assumed. A parser probe
over every scan file returned exactly one occurrence of exactly one spelling on all 17 agent
adapters and all 7 skills, and zero of both on the 3 packaging templates (their frontmatter examples
are fenced, and the fence strip runs first).

## Proof

### 1. RED-before — agent spelling, base-commit `scripts/check-foundation-guards.js` at `7a4b7cc`

A hermetic mirror built from `git ls-files` of the live tree. The clean baseline was captured **first**
so the later red could not be blamed on the mirror:

```
$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js     # clean mirror, no plant
clean exit=0
== Result ==
ALL CHECKS PASSED
```

Then a second `tools:` declaration planted on the coordinator adapter, carrying no spawn token:

```
---
name: grugops-orchestrator
description: "Decompose each request into subtasks, route each to the right role agent wit
coordinator: true
tools: Agent(grugops-agents-md-scribe, grugops-architect-design, grugops-ba-pm, grugops-br
tools: Read, Grep, Glob, Edit, Write, Bash
model: inherit
---
```

```
$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js
planted exit=0
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 non-coordinator adapter bodies + 2 packaging template(s) checked), and the coordinator body carries all 6 tier-announcement beats, each exactly once in live, non-fenced, non-commented text
  PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
  PASS  WR-05 wording: closure beats present in all four tracking docs; the 5-tool-table flip is asymmetric (CC row spawns, four CLI rows stay no-spawn)
ALL CHECKS PASSED
```

Exit 0. Both the WR-05 and the KIT-03 PASS lines printed over a coordinator whose runtime grant a
last-wins loader drops entirely.

### 2. GREEN-after — agent spelling, the identical mirror, rebuilt `.js`

```
$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js
planted exit=1

[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/agents/grugops-orchestrator.md: declares the `tools` allow-list key 2 times — a tool allow-list has ONE authority and must have ONE answer; which occurrence the platform's YAML loader honours (first, last, or a duplicate-key throw) is not this guard's to guess

1 CHECK(S) FAILED
```

The mirror-relative path is named and the count is an integer. `grep -c "PASS  WR-05:"` over that
output returns **0** — no passing line is printed over a document the guard refused.

### 3. RED-before — skill spelling, base-commit binary at `7a4b7cc`

A separate mirror; `.claude/skills/grugops/SKILL.md`'s block-sequence `allowed-tools` replaced by two
scalar declarations, the second a strict subset of the first (under last-wins the skill silently loses
`Write` and `Bash`; the guard's flattened read is the union of both, so it reads neither answer):

```
---
name: grugops
description: The grugops factory dispatcher — route any software-delivery reques
argument-hint: "<request>"
allowed-tools: Read, Write, Bash, Glob, Grep
allowed-tools: Read, Glob, Grep
---
```

```
$ CHECK_ROOT=<mirror2> node scripts/check-foundation-guards.js
planted exit=0
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 non-coordinator adapter bodies + 2 packaging template(s) checked), and the coordinator body carries all 6 tier-announcement beats, each exactly once in live, non-fenced, non-commented text
  PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
  PASS  WR-05 wording: closure beats present in all four tracking docs; the 5-tool-table flip is asymmetric (CC row spawns, four CLI rows stay no-spawn)
ALL CHECKS PASSED
```

### 4. GREEN-after — skill spelling, the identical mirror, rebuilt `.js`

```
$ CHECK_ROOT=<mirror2> node scripts/check-foundation-guards.js
planted exit=1

[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops/SKILL.md: declares the `allowed-tools` allow-list key 2 times — a tool allow-list has ONE authority and must have ONE answer; which occurrence the platform's YAML loader honours (first, last, or a duplicate-key throw) is not this guard's to guess

1 CHECK(S) FAILED
```

`grep -c "PASS  WR-05:"` → **0**. One arm covers both spellings; there is no second check.

### 5. The emptiness arm is NOT masked

Two empty `tools:` declarations planted on `.claude/agents/grugops-installer.md`:

```
$ CHECK_ROOT=<mirror3> node scripts/check-foundation-guards.js
planted exit=1

[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/agents/grugops-installer.md: agent adapter has a `tools` key present with an EMPTY value — an empty allow-list declares nothing, and whether the platform reads it as "no tools" or as an absent key (inherit everything, spawn tool included) is not this guard's to guess
.claude/agents/grugops-installer.md: declares the `tools` allow-list key 2 times — a tool allow-list has ONE authority and must have ONE answer; which occurrence the platform's YAML loader honours (first, last, or a duplicate-key throw) is not this guard's to guess

1 CHECK(S) FAILED
```

**Both** findings reported. The cardinality arm sits after the absence/emptiness if-else chain rather
than inside it, precisely so the new arm cannot silence the arm it was added to join.

### 6. The threshold is pinned on BOTH sides

- **Does not fire at one:** the one-occurrence control asserts the clean mirror exits 0 **and** that
  the output matches neither `/allow-list key \d+ times/` nor `/DIFFERENT allow-list keys/`. Asserted
  on the finding text, not only the exit code, so a green run for some unrelated reason cannot stand
  in for the threshold holding at one.
- **Fires at two:** cases 1–4 above.
- **Live tree:** `node scripts/check-foundation-guards.js` exits 0 on the real repo. Every committed
  adapter and skill declares its key exactly once.

### 7. The false-red control — every legitimate spelling of ONE declaration stays green

Seven spellings walked, each on its own mirror, each asserting a green aggregator run **and** the
absence of both new findings:

| # | Spelling |
|---|----------|
| 1 | one-line plain scalar |
| 2 | plain scalar WRAPPED across lines |
| 3 | quoted scalar WRAPPED across lines |
| 4 | value carrying a trailing `#` comment |
| 5 | folded block scalar (`>-`) |
| 6 | literal block scalar (`\|-`) |
| 7 | block sequence (the shipped skill form) |

The sibling `name` rule's safe-against-false-reds paragraph names five (2–6). Rows 1 and 7 were added
because row 7 is the form the shipped SKILL adapters actually use — the spelling a false red would
cost the most on — and row 1 is the form all 17 agent adapters use.

**RED-before for this control, stated honestly:** run against the base-commit
`scripts/check-foundation-guards.js` (`git checkout 7a4b7cc -- scripts/check-foundation-guards.js`),
the control **also passed**:

```
$ npx vitest run scripts/check-foundation-guards.test.ts -t "false-red control"
 Test Files  1 passed (1)
      Tests  1 passed | 97 skipped (98)
```

This is expected and is recorded as such: the control is a guard **against the new arm**, not a
defect proof. It reproduced nothing, and it is not described as having done so. The binary was
restored immediately (`git status --porcelain` clean).

### 8. The count is an exact integer, proven by mutation

A three-occurrence plant asserts `declares the \`tools\` allow-list key 3 times` and that neither
`allow-list key 2 times` nor `allow-list key 4 times` appears. To prove the assertion has teeth, the
arm was temporarily edited to report `${occurrences.length + 1}` and rebuilt:

```
$ npx vitest run scripts/check-foundation-guards.test.ts -t "exact integer"
 ❯ scripts/check-foundation-guards.test.ts:891:15
    889|     expect(r.status).not.toBe(0);
    890|     const o = out(r);
    891|     expect(o).toContain("declares the `tools` allow-list key 3 times");
       |               ^
 Test Files  1 failed (1)
      Tests  1 failed | 97 skipped (98)
```

Reverted with `git checkout HEAD -- scripts/check-foundation-guards.ts` and rebuilt;
`git diff --stat scripts/check-foundation-guards.ts scripts/check-foundation-guards.js` printed
nothing, and the case passed again. The temporary edit is in **no** commit.

### 9. A check reports what it checked

A combined plant — a duplicate `tools:` on `grugops-installer` plus a rogue spawn grant on
`grugops-qe-e2e` — asserts each finding's presence independently. Both are reported; there is no
short-circuit at the first.

### 10. The sibling rule is untouched

```
$ git diff 7a4b7cc..HEAD -- scripts/check-foundation-guards.ts \
    | grep -E "^[-+].*(nameMismatch|declaredValues|keysHaveSpawnGrant\()" | grep -v "^+  //"
(no output)
```

The only occurrences of `keysHaveSpawnGrant` in the diff are two `+  //` comment lines explaining why
its disjunction is deliberately left alone. No line inside the 27-19 name-key cardinality refusal
changed, and the disjunction is byte-identical.

## Case counts

| Suite | Before | After | Delta |
|-------|--------|-------|-------|
| `scripts/check-foundation-guards.test.ts` after Task 1 | 90 | 95 | +5 (exactly as the plan requires) |
| `scripts/check-foundation-guards.test.ts` after Task 2 | 95 | 98 | +3 |
| full suite (`--exclude '**/scripts/e2e/**'`) | 978 passed / 2 skipped | 986 passed / 2 skipped | +8 |

## Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` + `npm run freshness` | exit 0 — **32** committed `.js` fresh (unchanged from the baseline; no new file) |
| `npx vitest run scripts/check-foundation-guards.test.ts` | exit 0, 98 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0, 35 files, **986 passed / 2 skipped** |
| `node scripts/check-foundation-guards.js` (live tree) | exit 0, `ALL CHECKS PASSED` |
| `node scripts/adapters-freshness.js` | 17 adapters compared, 0 byte differences, listings set-equal |
| `node scripts/validate-agent-factory.js` | exit 0 (with `VALIDATE_KIT_ROOT` set — see below) |
| `git status --porcelain` | clean — no scratch mirror, no temporary count edit, no leaked fixture |

**On `validate-agent-factory.js`:** invoked bare it exits **1** with
`ERROR VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`. That is the
script's own pre-existing fail-loud contract, present at the base commit and unrelated to this plan;
with `VALIDATE_KIT_ROOT="$(pwd)"` it exits 0. Recorded rather than quietly satisfied, because the
plan's acceptance criterion named the bare command.

## Deviations from Plan

### Judgement calls the plan left to the executor

**1. The tools floor's loop was widened from `AGENT_ADAPTERS` to `SPAWN_GRANT_SCAN`.**

The plan required the arm to live "in the same loop as the absence and emptiness arms" **and** to
cover the skill spelling on a skill adapter. Those two requirements are only compatible if the loop
itself widens, because the floor's loop iterated the agent adapters only. Adding a second loop for
the skills would have violated the plan's own prohibition ("MUST NOT add a second check for a
predicate that already has one").

So the loop header is now `SPAWN_GRANT_SCAN` and the pre-existing arms are gated behind an explicit
`isAgentAdapter` flag. Their firing set is **unchanged** — the `name` floor, the absence arm and the
emptiness arm all still fire on exactly the seventeen agent adapters and nothing else. The scope
split is stated in the comment, with the reason: absence is not a defect on a skill (a skill without
`allowed-tools` is not a defective sub-agent identity; it is not a sub-agent at all), whereas
declaring one key twice is a defect on any surface that declares it.

**2. The false-red control walks seven spellings rather than the sibling paragraph's five.**

The one-line plain scalar and the block sequence were added. Every shipped agent adapter uses the
former and every shipped skill uses the latter, and a control that omitted the two forms the tree
actually ships would have been the weakest possible coverage of the false-red risk.

**3. A `reshapeToolsBlock()` test helper was added beside the existing `reshapeToolsKey()`.**

`reshapeToolsKey()` splices out exactly **one** line, which is right for the scalar-form cases it was
written for. The shipped skills express `allowed-tools` as a block sequence, so replacing only the key
line leaves its `  - Read` items dangling under whatever shape is spliced in — the first draft of the
skill plant did exactly that and produced a fixture that counted something other than what it
claimed. The new helper removes the key line **and** its sequence items, and throws when the key is
absent, for the same reason `renameAdapterIdentity()` does. `reshapeToolsKey()` is untouched.

**4. `requirements.mark-complete SPAWN-04 KIT-03` was run and then DELIBERATELY REVERTED.**

The command checked both boxes in `.planning/REQUIREMENTS.md`. Commit `8e8ab02`
(*"revert premature Complete requirements after gaps found"*) is the user unchecking exactly those
boxes — along with every other KIT/SPAWN requirement — after the 2026-07-30 verification returned
`gaps_found` with SPAWN-04 and KIT-03 **PARTIAL** against six live, reproduced defects. Two closing
plans of that same round (27-27, 27-28) are still unexecuted. Re-flipping the boxes from inside a
mid-round plan would silently overwrite a decision the user has already made once, in the direction
they made it against. `git checkout -- .planning/REQUIREMENTS.md` restored them; the file is
untouched by this plan and requirement completion stays a verification decision.

### Auto-fixed issues

None. No bug, missing critical functionality or blocking issue was encountered outside the plan.

## Flagged assumptions carried forward

- The `unclassified` SPAWN-04 probe row remains **UNRESOLVED**. It is carried in plan 27-24's flagged
  assumptions and is neither re-raised nor silently closed here.
- **Canon-referral breadcrumb (not minted):** YAML duplicate-key handling as a parser-level injection
  class is canon security territory, covered by `/gsd-secure-phase`. No bespoke prohibition was
  minted for it.
- Every check in this phase reads a **file**, not a runtime. This arm narrows the gap between what the
  guard reads and what a loader honours by refusing the ambiguity outright; it does not eliminate the
  gap.

## Known Stubs

None. No placeholder, hardcoded-empty or TODO value was introduced.

## Threat Flags

None. This plan introduces no new network endpoint, auth path, file-access pattern or schema change
at a trust boundary — it narrows an existing one. All five register entries (T-27-125 … T-27-129) were
dispositioned `mitigate` and each is mitigated as planned: the arm (125), the reproduction pinned red
on both spellings (126), a refusal on cardinality rather than on content so no occurrence is preferred
and no decoy is read as the answer (127), the seven-spelling false-red control (128), and the
diff-clean sibling rule proven in §10 (129).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `a70b2ba` | fix(27-26): give the allow-list key the cardinality arm its sibling name key has (WR-01) |
| 2 | `4b75565` | test(27-26): prove the cardinality arm counts integers and never reds a wrapped single declaration |

## Self-Check: PASSED

Modified files verified present on disk:
- `FOUND: scripts/check-foundation-guards.ts`
- `FOUND: scripts/check-foundation-guards.js`
- `FOUND: scripts/check-foundation-guards.test.ts`
- `FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/27-26-SUMMARY.md`

Commits verified in `git log`:
- `FOUND: a70b2ba`
- `FOUND: 4b75565`

Neither commit deleted a tracked file (`git diff --diff-filter=D HEAD~1 HEAD` empty for both).

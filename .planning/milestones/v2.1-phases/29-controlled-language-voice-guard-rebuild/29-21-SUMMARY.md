---
phase: 29-controlled-language-voice-guard-rebuild
plan: 21
subsystem: tooling / audit gates
tags: [LANG-03, CR-01, watched-corpus, safety-surface, two-sided-pin]
requires:
  - "scripts/kit-model.ts — ROLE_COUNT, WORKFLOW_COUNT, listRoles, listWorkflows, ROLES_SUBPATH, WORKFLOWS_SUBPATH (the expectation's source)"
  - "scripts/generate-safety-surface.ts — safetySurfaceUnion (the derivation, unmodified)"
  - "scripts/audit-model.ts — readRegister, REGISTER_PATH (the ONE parse authority)"
provides:
  - "scripts/check-audit-register.ts :: equality three — counted rows flagged `safety_surface: yes` set-equal to the derived kit, both directions"
  - "scripts/check-diff-disposition.ts :: WATCHED_CORPUS_MIN, and a set-containment pin of the watched corpus against the derived kit"
affects:
  - "scripts/check-audit-register.test.ts (defaultRows now flags every counted row `yes`, as the live register does)"
  - "scripts/check-diff-disposition.test.ts (5 new CR-01 cases)"
tech-stack:
  added: []
  patterns:
    - "derive the expectation from a module the measurement never calls — a floor sharing a code path with the thing it checks is documentation of intent"
    - "derive the set, then assert the count: a containment pin needs its own cardinality pinned or a short lister moves both sides at once"
    - "a MINIMUM whose slack exceeds the attack is a number that looks like a check — prefer per-member containment"
    - "assert the mutation reached the artifact before believing a mutation result"
key-files:
  created: []
  modified:
    - scripts/check-audit-register.ts
    - scripts/check-audit-register.js
    - scripts/check-audit-register.test.ts
    - scripts/check-diff-disposition.ts
    - scripts/check-diff-disposition.js
    - scripts/check-diff-disposition.test.ts
decisions:
  - "The consumer-side pin is SET CONTAINMENT rather than the bare count the plan and the reviewer both sketched — the sketched floor cannot catch the reviewer's own reproduction, proven by mutation M2 (D-25)."
  - "The derived kit's own cardinality is pinned two-sided beside the containment, because a containment whose expectation can shrink is an expectation and a measurement moving together."
  - "The zero-length vacuity check is KEPT, not moved: a vacuity floor answers a different question and has never been able to catch a silently short corpus."
  - "`scripts/generate-safety-surface.ts` is byte-unchanged — the defect was an unconstrained INPUT to the derivation, not a defect in it."
metrics:
  duration: 42m
  completed: 2026-08-15
actuals:
  tokens: 21000
  tasks: 3
  commits: 3
status: complete
---

# Phase 29 Plan 21: Pin the Watched Corpus — CR-01 Closed at Source and Consumer Summary

The one table cell that could silently de-scope `guard_diff_disposition`'s entire left-hand side is
now a named refusal at both ends: a set equality in `check-audit-register.ts` and a set containment
in `check-diff-disposition.ts` whose expectation comes from a module the measurement never calls —
and the containment replaces the plan's own sketched cardinality floor, which mutation-testing showed
cannot catch the reproduction it was written for.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | RED first — plant the reviewer's narrowing end to end | `facc84e` | check-diff-disposition.test.ts, check-audit-register.test.ts |
| 2 | Close the hole at its source — equality three | `cb2f5f2` | check-audit-register.ts/.js/.test.ts |
| 3 | Pin the watched corpus at the consumer | `786a30c` | check-diff-disposition.ts/.js/.test.ts |

## HEAD RED Transcripts, Verbatim

### `guard_diff_disposition` — the flip is invisible

```
 FAIL  scripts/check-diff-disposition.test.ts > check-diff-disposition — CR-01: the watched corpus is pinned to the derived kit > REDs a register whose ONE flipped `safety_surface` cell drops a role from the watched corpus
AssertionError: expected +0 to be 1 // Object.is equality

- Expected
+ Received

- 1
+ 0

 ❯ scripts/check-diff-disposition.test.ts:1779:20
    1777|
    1778|     const { status, stdout } = runGate(flipped.root);
    1779|     expect(status).toBe(1);
```

The paired control (`the CONTROL — the identical mirror with NO cell flipped exits 0`) **passed** at
HEAD, so the mirror is not universally red.

### `check_audit_register` — the column's VALUES are unconstrained

```
 FAIL  scripts/check-audit-register.test.ts > check-audit-register: equality three — the flagged rows are the derived kit (CR-01) > REDs ONE `safety_surface` cell flipped yes → no, naming the file
AssertionError: expected +0 to be 1 // Object.is equality

- Expected
+ Received

- 1
+ 0

 ❯ scripts/check-audit-register.test.ts:392:22
```

and, for the PASS line:

```
AssertionError: expected '\n[check_audit_register] the AUDIT-01…' to match /equality three holds/

+ Received:
  PASS  AUDIT-01 completeness: equality one holds — 36 counted register row(s) set-equal in both
  directions to 36 derived file(s) (17 roles + 19 workflows); equality two holds — ... ; every
  observation substantive and every safety_surface recorded; and
  docs/audit/28-safety-surface-exclusions.md is byte-identical to a fresh regeneration of the D-18 union
== Result ==
ALL CHECKS PASSED
```

Three failures, all with a received exit status of 0. This gate refused the unfilled marker `—` and
nothing else about the column.

## The Deviation That Matters — the Sketched Floor Cannot Catch the Sketched Attack

**[Rule 2 — missing critical functionality] The consumer-side pin is SET CONTAINMENT, not the bare
cardinality floor the plan and the round-2 reviewer both specified.**

- **Found during:** Task 1 fixture design, before any fix was written.
- **The arithmetic:** the live watched corpus is **40** markdown files; the derived kit is **36**
  (17 roles + 19 workflows). The union legitimately carries four public documents beyond the kit, so
  `WATCHED_CORPUS_MIN = ROLE_COUNT + WORKFLOW_COUNT` leaves **four files of slack**. The reviewer's
  reproduction narrows by **one**. A floor whose slack exceeds the attack is a number that looks like
  a check, and the plan's own acceptance criterion — "flipping one `safety_surface` cell reds both
  `check-audit-register` and `check-diff-disposition`" — is unreachable with it.
- **Resolution:** the pin asserts that **every derived kit file is a member of the watched corpus**,
  naming each absentee. Containment has no slack, is still a MINIMUM (public documents are extra, as
  the plan requires), and its expectation still comes from `kit-model.ts`, which `watchedCorpus()`
  never calls — every stated must-have is met and the acceptance criterion becomes reachable.
- **Proven, not argued:** mutation **M2** substitutes the reviewer's literal sketch
  (`corpus.watched.length < WATCHED_CORPUS_MIN`) for the containment and both reproduction cases go
  green under it — the same two cases M1 (containment deleted outright) kills. The sketch and the
  deletion are indistinguishable to this defect.
- **The count did not disappear.** `WATCHED_CORPUS_MIN` is kept and now pins the **derived kit's own
  cardinality**, two-sided, above the containment. That is not redundant: if the listers return 35
  files, containment over 35 still holds while the corpus is measured against a smaller kit. Derive
  the set, then assert the count. Mutation **M3** shows it fires on an axis containment cannot see.

## Mutation Proof — Six Runs, Each With Its Own Premise Asserted

The harness rebuilds, then refuses to report unless the committed `.js` **hash actually moved** and
`tsc` accepted the mutation. This is the guard 29-20's harness lacked: it piped `npm run build` to
`/dev/null` and reported "10 passed" for mutations that never entered the build.

| Mutation | Artifact moved | Cases that failed |
|---|---|---|
| M1 containment deleted | yes | the flip case, the both-gates reproduction (2) |
| M2 **the review's own sketch** — bare `length < MIN` floor replaces containment | yes | the flip case, the both-gates reproduction (2) |
| M3 derived-kit cardinality pin deleted | yes | the kit-cardinality case (1) |
| M4 equality three, direction ONE deleted | yes | the audit flip case, the direction-two case, the both-gates reproduction (3) |
| M5 equality three, direction TWO deleted | yes | the direction-two case (1) |

Every pinned axis is owned by at least one case that fails when that axis breaks, and no mutation
was reported against a stale artifact.

## Post-Fix Refusal Text, Verbatim

### `guard_diff_disposition`

```
  FAIL  1 of the 36 derived kit file(s) are NOT in the watched corpus — agent-factory/roles/uat-planner.md.
  The corpus derived 39 markdown file(s) from the 40-entry safety-surface union, and the derived kit
  alone is 36 (17 roles + 19 workflows), so this gate is about to report a verdict over LESS than the
  kit it exists to watch. A `safety_surface` flag flipped to `no` in
  docs/audit/28-disposition-register.md removes a file from this gate ENTIRELY and owes no
  disposition row, because that register is not itself watched. Walk its `safety_surface` column
  before moving any number here; lowering the expectation or narrowing the corpus are the two ways to
  clear this finding by deleting its evidence, and neither is the remedy
```

Note the measured `39` against a `36` minimum — the number that proves a bare floor would have stayed
green on this exact tree.

### `check_audit_register`

```
  FAIL  equality three (derived but NOT flagged): 1 derived kit file(s) are absent from the set of
  counted rows flagged `safety_surface: yes` — agent-factory/roles/uat-planner.md. A derived kit file
  that is not flagged is REMOVED from the LANG-03 watched corpus entirely: guard_diff_disposition
  simply checks less and stays green, so the narrowing arrives as a clean build rather than as a
  failure. This register lives under `docs/` and is NOT itself a member of the corpus it derives,
  which is why the edit that performs the narrowing owes no disposition row and nothing downstream
  can see it. The remedy is to restore the flag, or to record the exception WITH ITS REASON — the
  shape the uncounted pin above uses; lowering or deleting this assertion is never the fix
```

## The Hand-Run Reproduction, Re-Run Against the Built `.js`

The reviewer's three live steps, replayed on the working tree and reverted afterwards.

**Step 1** — reword one sentence inside `agent-factory/roles/uat-planner.md`'s `## Hard limits`
(`Never self-sign or fake a pass; mark anything unverified` → `Never self-sign or fabricate a pass
result; mark whatever stays unverified`). The plant asserts its own premise: the target sentence must
appear exactly once.

```
  FAIL  diff disposition — changed watched file(s): 8 finding(s) over 37 elements
== Result ==
1 CHECK(S) FAILED          exit=1
```

**Step 2** — flip `docs/audit/28-disposition-register.md:347`'s fourth cell `yes` → `no` (the row is
parsed positionally and its file path asserted before the edit), then regenerate:

```
Wrote docs/audit/28-safety-surface-exclusions.md — 40 entries.
```

**Step 3** — re-run every gate. The review recorded all four at exit 0. At this HEAD:

```
check-diff-disposition -> exit=1
check-audit-register   -> exit=1
check-claim-anchors    -> exit=0
check-foundation-guards-> exit=0
```

**Revert and confirm.** `git checkout --` on the three touched files, then:

```
$ git status --porcelain          # no uat-planner.md, no register, no exclusion list
$ node scripts/check-diff-disposition.js  -> exit=0
$ node scripts/check-audit-register.js    -> exit=0
$ node scripts/check-claim-anchors.js     -> exit=0
$ node scripts/check-foundation-guards.js -> exit=0
```

## Gate Numbers, Before and After

| Measurement | Before (`3ed76c1`) | After (`786a30c`) |
|---|---|---|
| watched corpus | 40 markdown of a 41-entry union | 40 markdown of a 41-entry union, covering 36/36 derived kit files |
| changed watched files | 37 since `4d2b8f0` | 37 since `4d2b8f0` |
| changed clauses derived | 1880 | 1880 |
| disposition rows | 1532 across 8 files | 1532 across 8 files |
| verdict | 0 findings over 37/37 elements | 0 findings over 37/37 elements |
| `check-audit-register` | exit 0 | exit 0, PASS line now states equality three |
| `check-claim-anchors` / `check-foundation-guards` | exit 0 | exit 0 |
| `npm run freshness` | 48 committed `.js` fresh | 48 committed `.js` fresh |
| `npx tsc --noEmit` | exit 0 | exit 0 |

The live verdict is byte-unmoved. The proof of this fix is a planted input, never a moved number.

Full regression: `npx vitest run --exclude '**/scripts/e2e/**'` → **51 files, 1825 passed, 2 skipped**
(both skips pre-existing).

## Two Fixture Defects Found and Fixed Inside the Harness

### 1. [Rule 1 — bug] The `defaultRows()` mirror could not express the defect at all

`check-audit-register.test.ts` built every counted row with `safety_surface: no`, a shape the shipped
artifact is not — all 36 live counted rows are `yes`, and the generated exclusion list explains why in
its own prose. A mirror flagging none had no `yes` left to flip. Corrected to `yes`, which is also
what makes equality three's green baseline meaningful.

### 2. [Rule 1 — bug] The parse-refusal case silently became a no-op under that correction

The malformed-register case spelled row one as a hard-coded literal — `| ... | role | yes | no | 0 |`
— so changing the default `safety_surface` made the `.replace()` match nothing. The register parsed
cleanly and the case went **green while asserting a parse refusal that never happened**. It now
truncates the row the renderer actually produced and asserts the malformation is real before using
it. This is the harness-premise failure class this project has now recorded seven times, caught here
by a test that reddened rather than by inspection.

## New Cases

`scripts/check-diff-disposition.test.ts` — `describe("check-diff-disposition — CR-01: the watched corpus is pinned to the derived kit")`:

1. the CONTROL — the identical mirror with no cell flipped exits 0
2. REDs a register whose ONE flipped `safety_surface` cell drops a role from the watched corpus
   (four premises asserted before the gate runs)
3. the derived kit's own cardinality is pinned two-sided, independently of the corpus
4. the reviewer's end-to-end reproduction: one flipped cell reds BOTH gates, hermetically
5. the VACUITY floor is kept beside the new pin — they answer different questions

`scripts/check-audit-register.test.ts` — `describe("check-audit-register: equality three …")`:

1. REDs ONE `safety_surface` cell flipped yes → no, naming the file
2. REDs the OTHER direction — a flagged counted row naming a file the listers do not derive
3. the PASS line states equality three with the numbers the run measured
4. the LIVE committed register satisfies equality three

**Case count: 9.**

### Premises each case asserts before invoking a gate

- exactly one cell moved, read back through `readRegister` rather than through the string edit that
  produced it, and it moved on a **counted** row;
- the union really is one markdown entry shorter, and short by **that member**, measured through
  `safetySurfaceUnion` — the same derivation the gate uses;
- the flipped file really is a **derived kit** file (a flip on a public document is a different
  question);
- the register is **otherwise complete** — its counted row set still set-equals the listers' output —
  so the consumer reds on a fixture the sibling gate's equality one accepts, which is what makes the
  case a statement about the consumer rather than about the sibling;
- in the both-gates case, the regenerated exclusion list is asserted **fresh** and asserted to no
  longer name the flipped file, so neither gate can red on staleness instead.

The `_`-prefixed stray path in the direction-two case is deliberate: `listRoles` drops those, so the
file can exist on disk (satisfying the missing-on-disk arm) while staying outside the derived set. A
plain `stray.md` in `roles/` **is** derived, and the first draft of that case measured the opposite of
what it claimed — caught by the run, not by reading.

## What Was Deliberately Not Touched

Confirmed byte-unchanged by `git diff --stat`:

- `scripts/generate-safety-surface.ts` / `.js` — the generator is correct; its **input** was
  unconstrained. Fixing a derivation that works would have moved the defect rather than closed it.
- `docs/audit/28-disposition-register.md` — the register is correct as shipped; equality three passes
  over it live.
- The unfilled-marker arm at `check-audit-register.ts:313-323` — a different question about the same
  column (nobody wrote a value, versus the value that is there de-scopes the corpus). Both fire on a
  `—` row, each naming its own remedy.

No file in the LANG-03 watched corpus changed, so **no disposition row is owed** under
`docs/audit/29-style-dispositions/` for this plan, and none was invented.

## Residuals Named, Not Absorbed

- **Direction two of equality three cannot be isolated from equality one.** A counted row naming a
  file outside the derived kit is, by construction, also an equality-one failure. The property the
  case buys is therefore narrower than "fires alone": it is that equality three still **names the
  member in the same run** rather than letting equality one's report absorb it. Stated in the case.
- **The containment is per-FILE, like the flag it consumes.** It cannot tell which SENTENCE in a
  listed file is load-bearing — the granularity limit the generated exclusion list already names in
  its own `## What this list does not settle` section. This plan does not narrow that gap.
- **`check-audit-register.ts` still declares its own `ROLES_SUBPATH` / `WORKFLOWS_SUBPATH` literals**
  (lines 77-78) while `kit-model.ts` exports both. That is the set-literal drift class one level
  down, and it is out of scope here — logged rather than fixed, because touching it moves a path
  three gates resolve against and belongs in its own plan with its own corpus measurement.

## Known Stubs

None. No placeholder, no `TODO`, no unwired data path was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
`T-29-21-SC` had an empty input set as predicted: no package-manager install occurred and
`package.json` is unchanged — asserted by the existing harness case, which also pins
`pkg.dependencies` undefined.

## Self-Check: PASSED

- `scripts/check-audit-register.ts` — FOUND (equality three, two directions, PASS-line clause)
- `scripts/check-audit-register.js` — FOUND, fresh
- `scripts/check-audit-register.test.ts` — FOUND (4 new cases; `defaultRows` flags `yes`)
- `scripts/check-diff-disposition.ts` — FOUND (`WATCHED_CORPUS_MIN` exported, containment pin,
  zero check retained)
- `scripts/check-diff-disposition.js` — FOUND, fresh
- `scripts/check-diff-disposition.test.ts` — FOUND (5 new cases)
- `scripts/generate-safety-surface.ts` — FOUND, byte-unchanged
- commit `facc84e` — FOUND
- commit `cb2f5f2` — FOUND
- commit `786a30c` — FOUND

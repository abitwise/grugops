---
phase: 29-controlled-language-voice-guard-rebuild
plan: 56
subsystem: testing
tags: [guard, lang-04, banned-claims, claim-scope, typescript, vitest, audit-register]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "`guard_banned_claims` with its six-part derived corpus, its 22 pinned literals, and D-54's content-bound exemption (plans 29-02, 29-43, 29-44, 29-52, 29-53)"
provides:
  - "`runAll()`'s published header sentence narrowed to the predicate the gate decides, with both of its numbers interpolated from the module's own derivations"
  - "the module docblock's scope claim and exit-code gloss narrowed to the same predicate"
  - "two permanent cases (BEHAVIOUR + SOURCE-SHAPE) that red if either totality noun phrase returns to either address"
  - "`docs/audit/29-round8-residuals.md` opened: header block and §1, the derived claim-site disposition table"
affects: [29-57, 29-58, 29-59, 29-60]

actuals:
  tokens: 9600
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "a gate's published sentence is composed from the mechanism's own derivations, never from a specification written elsewhere"
    - "a superseded phrase is CAPTURED from the pre-edit artifact into a named constant, never retyped from a planning document"
    - "the set of claim sites is DERIVED by a named command over a stated denominator with named exclusions, and every derived site carries a disposition row"

key-files:
  created:
    - docs/audit/29-round8-residuals.md
  modified:
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts

key-decisions:
  - "D-55 applied at both addresses: the SENTENCE moves to the mechanism rather than the mechanism chasing the sentence. The header and the docblock now quantify over one physical line, a derived document set and a pinned literal list, and over nothing wider."
  - "Both published numbers are interpolations (`bannedClaimScan().length`, `BANNED_CLAIM_LITERALS.length`), not values. `BANNED_CLAIM_SCAN_COUNT` is deliberately NOT published — it is the pin the derivation is asserted against, and printing it would publish the expectation in place of the measurement."
  - "The claim-site set was DERIVED (13 files over a 780-file denominator), not accepted from the plan's four-site floor list. The derivation returned all four plus nine more, including two findings the floor list did not contain."
  - "The SOURCE-SHAPE case asserts the two narrowed addresses still STATE the predicate, so 'no superseded phrase' cannot be satisfied by deleting the sentences. Narrowing is not deletion."
  - "One declared normalization in the SOURCE-SHAPE case (comment markers and line breaks collapsed, case-folded) applies to a COMMENT BLOCK only; the assertion on the PUBLISHED header stays byte-exact. This is explicitly not the argument for normalizing inside the matcher."

patterns-established:
  - "Pattern: publish the derivation, pin the constant. A sentence a reader sees carries the measured value; the constant that catches drift stays two-sided and unpublished."
  - "Pattern: capture-then-forbid. The phrase a case forbids is read out of the artifact being changed, declared once as a named constant, and its single-occurrence property is asserted by the case itself."
  - "Pattern: derive the site set, then disposition every element — `narrowed here` / `narrowed by plan N` / `left, with reason`. A site with no row is indistinguishable from a site nobody looked at."

requirements-completed: []

coverage:
  - id: D1
    description: "The gate's published first line states the decided predicate: one physical line, a derived document set sized by interpolation, a pinned literal list sized by interpolation, outside the registry-anchored blocks of one named region — and carries neither superseded totality noun phrase."
    requirement: "LANG-04"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#BEHAVIOUR: the running gate's first line carries the DERIVED numbers, names the unit of decision, and neither superseded phrase"
        status: pass
      - kind: integration
        ref: "node scripts/check-banned-claims.js (exit 0) + independent `node --input-type=module` import comparing 117/22 against bannedClaimScan().length / BANNED_CLAIM_LITERALS.length"
        status: pass
    human_judgment: false
  - id: D2
    description: "The wider wording cannot return to either narrowed address without a permanent case going red, and the narrowing cannot be satisfied by deleting the sentences."
    requirement: "LANG-04"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#SOURCE SHAPE: neither superseded noun phrase returns to either narrowed address, and both addresses still STATE the predicate"
        status: pass
      - kind: integration
        ref: "mutation proof on two separately re-extracted `git archive HEAD` mirrors (header address -> 2 failed; docblock address -> 1 failed), plus a third clean-mirror control -> 2 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "The gate is not weakened by the narrowing: a listed literal planted on ONE line of a scanned document still reds by name at file:line:column, and a clean mirror is green."
    requirement: "LANG-04"
    verification:
      - kind: integration
        ref: "hermetic mirrors: plant `token economy` into agent-factory/workflows/18-context-compaction.md -> exit 1 at :74:23; re-extracted clean control -> exit 0"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/check-banned-claims.test.ts (117 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every place in the tracked tree that states this prohibition's scope was found by derivation and given a disposition, in `docs/audit/29-round8-residuals.md` §1."
    requirement: "LANG-04"
    verification:
      - kind: other
        ref: "derivation command over `git ls-files` (1626 -> 780 after named exclusions) returning 13 files; §1.2 carries 13 rows"
        status: pass
    human_judgment: true
    rationale: "Whether each `left, with reason` row's reason is ACCEPTABLE is an editorial judgment, not a mechanical one. The count equality and the derivation are mechanical; the dispositions are the thing a reviewer must agree with — in particular row 8 (`.github/workflows/ci.yml`) and row 13 (`scripts/compactor.ts`), both recorded as residuals rather than as clean."

duration: 38min
completed: 2026-08-18
status: complete
---

# Phase 29 Plan 56: The published claim narrowed to the decided predicate Summary

**`guard_banned_claims` now publishes the question it actually answers — one physical line, 117 derived documents, 22 pinned literals, outside the registry-anchored blocks of one named region — with both numbers interpolated from the module's own derivations, and the wider wording is held out of both addresses by two mutation-proven permanent cases.**

## Performance

- **Duration:** 38 min
- **Tasks:** 2/2
- **Commits:** 2
- **Files changed:** 4 (147 + 41 + 167 + 41 insertions, 14 deletions)

## Accomplishments

### Task 1 — the published sentence, end to end (`c119115`)

**Before** (`node scripts/check-banned-claims.js`, first output line, captured to scratch before any edit):

```
[guard_banned_claims] the shipped kit and the public documents carry no conformance, token-economy or comprehension claim, outside one named exemption region (LANG-04 / D-29, D-44)
```

**After:**

```
[guard_banned_claims] no single physical line of the 117 derived document(s) this gate scans carries any of the 22 pinned claim literal(s), outside the registry-anchored blocks of one named exemption region (LANG-04 / D-29, D-44)
```

The replacement was composed from the gate's own SECOND PASS line — the one that already published the honest content — not from a specification written elsewhere. It names (a) the unit of decision, one physical line, because that is what `lineHits()` reads; (b) the scan set as DERIVED with its size interpolated from `bannedClaimScan()`; (c) the enumeration with its size interpolated from `BANNED_CLAIM_LITERALS`; (d) the exemption as the registry-anchored BLOCKS of one region rather than as a region, which is the post-D-54 bound; and it carries neither superseded noun phrase and no quantifier over the kit or the public documents. The `[guard_banned_claims]` bracket and the `(LANG-04 / D-29, D-44)` attribution are byte-unchanged — two existing cases at `:3456` and `:3691` assert the bracket.

An in-source note above the write records why the sentence is this narrow and names D-55 by id. It deliberately does not quote the superseded sentence: these gates scan source text without stripping comments, and this repository's retired-construct convention is to describe a removed construct rather than re-register a live copy of it.

`docs/audit/29-round8-residuals.md` was opened with its header block (round, plans, gap source, governing decisions, predecessor records) and its §1, the claim-site disposition table.

### Task 2 — the docblock narrowed, held by two permanent cases (`a1c7938`)

The module docblock's scope claim and its exit-code gloss now state the same predicate. The exit-code line moved from a per-DOCUMENT statement (`every scanned document is free of the pinned claim literals`) to the per-LINE one the matcher decides. The "why this gate exists" section and the D-44 red transcript are history and are accurate — untouched. The recorded-residual section at `:50..:68` is untouched too: its correction is D-56's and belongs to plan 29-57, and splitting it across two plans would produce two half-corrections in one file.

Two permanent cases were added, with the two superseded noun phrases declared ONCE as named constants sourced from the pre-edit file.

## Verification Evidence

### Task 1 acceptance

**1. Neither superseded phrase in the published line.** The two phrases were extracted as bytes from `:2103` before the edit into `phrases.txt` (`the shipped kit`, `the public documents`) — never retyped.

```
grep -c -F -f phrases.txt over the captured first output line: 0
```

**2. Both numbers equal an INDEPENDENT import of the module's own derivations** (a separate `node --input-type=module` process, not the run that printed them):

```
published corpus  = 117 | independent bannedClaimScan().length      = 117 | equal: true
published literals = 22 | independent BANNED_CLAIM_LITERALS.length  = 22  | equal: true
```

**3. The pin constant is untouched and nothing is typed into the sentence.**

```
grep -c 'BANNED_CLAIM_SCAN_COUNT' scripts/check-banned-claims.ts:  6  (6 before the edit)
```

The header write expression, extracted verbatim:

```ts
  process.stdout.write(
    `\n[guard_banned_claims] no single physical line of the ${bannedClaimScan().length} derived ` +
      `document(s) this gate scans carries any of the ${BANNED_CLAIM_LITERALS.length} pinned claim ` +
      `literal(s), outside the registry-anchored blocks of one named exemption region ` +
      `(LANG-04 / D-29, D-44)\n`,
  );
```

```
digits in the expression:                                     ["04","29","44"]
digits after removing the attribution ids kept verbatim:      null
interpolations: ["${bannedClaimScan().length}","${BANNED_CLAIM_LITERALS.length}"]
```

Stated precisely rather than as a bare "no integer literal": the ONLY digits the sentence carries are inside `(LANG-04 / D-29, D-44)`, which the plan requires kept verbatim and which are identifiers, not measurements. Removing them leaves zero digits.

**4. A listed literal planted on ONE line still reds by name.** Mirror `mirror-plant-mzMe`, freshly extracted with `git archive HEAD | tar -x`, gate binary sha256 shown equal to the repository's, plant literal selected from `BANNED_CLAIM_LITERALS` by group rather than retyped:

```
repo gate sha256:   f9a2d639c7ae47931f52fb534c61da373eabd8aa3b8ece5393f47e59240dde38
M1   gate sha256:   f9a2d639c7ae47931f52fb534c61da373eabd8aa3b8ece5393f47e59240dde38   IDENTICAL
plant literal (derived from the authority): [token economy]
M1 exit=1
  agent-factory/workflows/18-context-compaction.md:74:23 — banned token-economy literal "token economy" — "The caveman gist is a token economy applied to memory."
```

Clean-mirror control, on a SEPARATELY re-extracted mirror `mirror-control-pCA4` (not M1 reset — an archive extract is not a git repository and `git checkout --` silently does nothing there, which is how a prior round of this phase produced a false transcript):

```
M2 gate sha256: f9a2d639…  IDENTICAL to repository
M2 exit=0
  PASS  banned claims: 0 findings over 117/117 elements
ALL CHECKS PASSED
```

**5. The matcher is byte-unchanged.** Diff hunks over `scripts/check-banned-claims.ts` (task 1), with the function ranges derived from the source rather than typed:

```
hunks (new side): [{"start":2102,"len":27},{"start":2130,"len":4}]
hunks (old side): [{"start":2101,"len":0},{"start":2103,"len":2}]
lineHits                     new-side lines 2018..2027  changed lines inside: 0
countBannedClaimOccurrences  new-side lines 2035..2045  changed lines inside: 0
```

**Changed-line count inside the matcher: 0.** No wrap-joined input assembly was added; `lineHits()` and every caller of it are untouched (D-56 prohibition, enforced).

**6. `BANNED_CLAIM_LITERALS` is byte-unchanged.**

```
e848052  12778 chars  sha256 5740c30959c1720150c8157b77b315442f022ed1eb2d15720fa7c1406edf4f3e
HEAD     12778 chars  sha256 5740c30959c1720150c8157b77b315442f022ed1eb2d15720fa7c1406edf4f3e
BANNED_CLAIM_LITERALS.length = 22 before and after
```

**7. The claim-site derivation.** Command, denominator and named exclusions are quoted in `docs/audit/29-round8-residuals.md` §1.1:

```sh
git ls-files -z \
  | grep -zZv '^\.planning/' \
  | grep -zZv '^docs/audit/29-round' \
  | grep -zZv -- '-SUMMARY\.md$' \
  | xargs -0 grep -a -l -i -E 'standard-name|token[- ]economy|comprehension' \
  | sort
```

```
git ls-files                                    1626
after excluding ^.planning/                      784   (842 removed)
after also excluding ^docs/audit/29-round        780   (4 removed)
after also excluding -SUMMARY.md                 780   (0 removed — VACUOUS, recorded as such)
matched — the derived site set                    13
```

**Derived site count 13 = table row count 13.** The derivation reached all four sites the plan named as its floor (this module's header and docblock, `agent-factory/writing-profile.md`'s honesty-floor prose, `docs/audit/28-claim-registry.md`'s `C-28-042` row, and the banned-claim step's comment block in `.github/workflows/ci.yml`) plus nine more, so it was not widened. Every `left, with reason` row carries a reason.

**8/9. Gate sweep and requirement invariance.**

```
node scripts/check-banned-claims.js   exit=0
node scripts/check-claim-anchors.js   exit=0
node scripts/check-audit-register.js  exit=0
npm run freshness                     exit=0
git diff --numstat e848052..HEAD -- .planning/REQUIREMENTS.md   (empty — unchanged)
```

### Task 2 acceptance

**1. RED first, against the ACTUAL pre-change committed artifact.** Mirror `mirror-prechange-fg8a`, `git archive e848052` (the round's base — the artifact before task 1 landed), with this plan's harness dropped in:

```
M0 gate sha256 (PRE-change): f5f4469cde368cbb8a7d9d6751f8602b77fa92bf218fa1e2b10a3cb1b55705a7
repo gate sha256 (POST):     f9a2d639c7ae47931f52fb534c61da373eabd8aa3b8ece5393f47e59240dde38

× BEHAVIOUR: … AssertionError: the superseded subject returned to the published sentence:
    expected '[guard_banned_claims] the shipped kit…' not to contain 'the shipped kit'
× SOURCE SHAPE: … AssertionError: the superseded subject returned at line(s) 3, 2103:
    expected 2 to be +0
Tests  2 failed | 115 skipped (117)
```

Both cases were watched failing, with the failing assertion and its actual value quoted. Recorded honestly: on the working tree BETWEEN the two commits — header already narrowed, docblock not yet — only the SOURCE-SHAPE case reds (`the superseded subject returned at line(s) 3: expected 1 to be +0`) and the BEHAVIOUR case passes, because task 1 had already landed the header. That intermediate run is not the RED evidence; the `e848052` mirror above is.

**After the edit and rebuild:** `Tests 2 passed | 115 skipped (117)`, exit 0.

**2. Mutation proof, header address** — mirror `mirror-mut-header-TQVj`, freshly extracted from `HEAD` AFTER both commits, pre-change wording taken from `git show e848052:` rather than retyped, twin rebuilt INSIDE the mirror:

```
M3 gate sha256 BEFORE mutation:          9e6253aa4e15326a5258b1ed885e20d59ce0971f20c71f91137b9fb9eb0324ac
M3 gate sha256 AFTER mutation+rebuild:   677a8f17b59dc0765d45cb18e0fd12698083f69e2e8ad9d971812e5ca787ba7a
M3 first line: [guard_banned_claims] the shipped kit and the public documents carry no conformance, …

× BEHAVIOUR  … expected '[guard_banned_claims] the shipped kit…' not to contain 'the shipped kit'
× SOURCE SHAPE … the superseded subject returned at line(s) 2135: expected 1 to be +0
Tests  2 failed | 115 skipped (117)
```

**3. Mutation proof, docblock address** — mirror `mirror-mut-docblock-0Zmv`, a SEPARATE fresh extract:

```
M4 gate sha256 BEFORE mutation:          9e6253aa4e15326a5258b1ed885e20d59ce0971f20c71f91137b9fb9eb0324ac
M4 gate sha256 AFTER mutation+rebuild:   f9a2d639c7ae47931f52fb534c61da373eabd8aa3b8ece5393f47e59240dde38

× SOURCE SHAPE … the superseded subject returned at line(s) 3: expected 1 to be +0
Tests  1 failed | 1 passed | 115 skipped (117)
```

**Reported precisely, not rounded up to "both".** On the docblock mirror only the SOURCE-SHAPE case reds; the BEHAVIOUR case passes, because a docblock is not published to stdout. Two facts fall out of this and both are worth recording:

- The mutated docblock's rebuilt twin has sha256 `f9a2d639…`, which is byte-identical to the task-1-only twin — **the docblock mutation is INVISIBLE in the compiled `.js`**, because comments are stripped by `tsc`. That is exactly why the SOURCE-SHAPE case reads `GATE_TS` and not `GATE_JS`. A case that policed only the compiled artifact would have proven nothing about this address.
- The narrowing at both addresses is therefore held: the header by both cases, the docblock by the SOURCE-SHAPE case.

**4. Clean-mirror control** — mirror `mirror-clean-kpzx`, a THIRD fresh extract:

```
M5 gate sha256: 9e6253aa4e15326a5258b1ed885e20d59ce0971f20c71f91137b9fb9eb0324ac
repo   sha256:  9e6253aa4e15326a5258b1ed885e20d59ce0971f20c71f91137b9fb9eb0324ac   IDENTICAL
M5 vitest exit=0 — Tests  2 passed | 115 skipped (117)
```

**Six mirrors were extracted across this plan and NONE was reused or reset:** `mirror-plant`, `mirror-control`, `mirror-prechange`, `mirror-mut-header`, `mirror-mut-docblock`, `mirror-clean`. (The plan asked for three in task 2; task 1 required two more, and the RED transcript one more.)

**5. The superseded phrases are declared exactly once in the harness.**

```
grep -c -F "the shipped kit"       scripts/check-banned-claims.test.ts:  1
grep -c -F "the public documents"  scripts/check-banned-claims.test.ts:  1
```

The SOURCE-SHAPE case asserts this property about itself, so a second copy reds rather than silently making the `grep -c` evidence read a number it does not name.

**6. The pre-existing cases at `:3456` and `:3691` are unchanged.** The only diff hunk in the harness is an append:

```
@@ -4048,0 +4049,167 @@
:3456 BYTE-IDENTICAL ->     expect(stdout).toContain("[guard_banned_claims]");
:3691 BYTE-IDENTICAL ->     expect(stdout).toContain("[guard_banned_claims]");
```

**7. Full sweep.**

```
npx vitest run --exclude '**/scripts/e2e/**'
  Test Files  52 passed (52)
  Tests       2129 passed | 2 skipped (2131)      exit 0
npx tsc --noEmit    exit 0
npm run typecheck   exit 0   (tsc --noEmit && tsc -p tsconfig.tests.json)
npm run freshness   exit 0
git diff --numstat e848052..HEAD -- .planning/REQUIREMENTS.md   (empty)
git diff --numstat e848052..HEAD -- package.json package-lock.json   (empty)
```

## Prohibitions — status

| prohibition | status | evidence |
|---|---|---|
| No wrap-joined matcher assembly; `lineHits()` and its callers byte-unchanged (D-56) | **held** | Diff hunks quoted above; changed lines inside `lineHits` and `countBannedClaimOccurrences` = **0** |
| The published claim is never widened; a permanent case reds if either totality noun phrase returns | **held** | SOURCE-SHAPE case; mutation-proven at both addresses on two separately re-extracted mirrors |
| No matcher weakened, no literal removed; `BANNED_CLAIM_LITERALS` byte-unchanged | **held** | 22 members, sha256 `5740c309…` unmoved across `e848052..HEAD` |
| No correct text deleted; every removed sentence restated more narrowly or dispositioned | **held** | Both removed sentences were restated at their own addresses; §1 carries one disposition row per derived site |
| No requirement row flipped; `.planning/REQUIREMENTS.md` byte-unchanged; empty `requirements-completed:` | **held** | `git diff --numstat` empty; frontmatter above carries `requirements-completed: []` |
| No package installed | **held** | `package.json` and `package-lock.json` byte-unchanged across both commits |

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — Blocking] The in-source note named `BANNED_CLAIM_SCAN_COUNT`, breaking the plan's own `grep -c` acceptance criterion**

- **Found during:** Task 1, running the acceptance checks
- **Issue:** The note explaining *why* the header interpolates `bannedClaimScan()` rather than reading the pin spelled the pin's identifier, moving `grep -c 'BANNED_CLAIM_SCAN_COUNT'` from 6 to 7. The criterion's intent is that no new USE site of the pin entered the header; a mention in a comment is not a use, but the criterion is a literal line count.
- **Fix:** Reworded the note to identify the constant by role (`the derivation's pinned cardinality constant`) and to state in-line why it does not spell it, so the identifier's occurrence count stays a count of its use sites. Nothing was lost — the constant is declared thirty lines below and is unambiguous.
- **Files modified:** `scripts/check-banned-claims.ts`
- **Commit:** `c119115`

**2. [Rule 1 — Bug] The SOURCE-SHAPE case's docblock assertion was defeated by a hard wrap — in this phase, of all phases**

- **Found during:** Task 2, immediately after the docblock edit landed
- **Issue:** The case asserted `toContain("single physical line")` over the raw docblock. The narrowed docblock wraps the phrase across a comment line boundary and capitalises it for emphasis (`SINGLE PHYSICAL` / `LINE`), so the exact match failed on text that says exactly what the case wanted. Left as an exact match it would also red on any future rewrap that changed no meaning.
- **Fix:** The docblock assertion collapses comment markers and line breaks and case-folds before comparing — **one declared normalization, scoped to a COMMENT BLOCK**, with an in-source note stating that this is emphatically NOT the argument for normalizing inside the matcher (where an inexact comparison admits shapes nobody measured) and that the assertion on the PUBLISHED header stays byte-exact. A second assertion (`derived document set`) was added at the same time, so the docblock must name both the unit and the derivation.
- **Files modified:** `scripts/check-banned-claims.test.ts`
- **Commit:** `a1c7938`

No architectural changes were needed and no user decision was required.

## Findings the derivation produced that the plan did not name

Both are recorded in `docs/audit/29-round8-residuals.md` §1.3 and are **left, with reason** — out of D-58's scope fence and outside this plan's `files_modified`.

1. **`scripts/compactor.ts:7` restates a claim this project has DISPROVEN.** The comment describing the agent's distillation job reads *"writes the terse gist (caveman token-economy applied to memory)"* — the caveman-as-token-economy rationale that project measurement on 2026-07-28 disproved on this artifact, and that `C-28-045` freezes a denial of. Live count **1** (plus its committed twin). It is invisible to the gate because `scripts/` is outside the derived corpus **by construction**, and it is an internal source comment rather than shipped kit text. Recommended to the follow-up.
2. **The `docs/audit/29-round*` exclusion is narrower than the class it names.** `docs/audit/29-style-dispositions/29-44.md` is a prior round's record and is excluded in spirit but not by the pattern. It changed no disposition here (the file is `left, with reason` under either treatment), but a later derivation that assumes the pattern covers "prior rounds' records" would be wrong. Recorded rather than patched — tuning a pattern after seeing its result is how a derivation gets fitted to its answer.

## Residual left standing, named rather than implied away

`.github/workflows/ci.yml:221..:224` is the one derived site whose OBJECT-side wording still overshoots its mechanism after this plan: its subject was narrowed in round 7 to *"the kit's scanned text surface … derived in six named parts, deduped, and pinned two-sided"*, but it still asserts the absence of a CLASS of claim rather than of a pinned literal, and it names no per-line unit. It is left because D-58 assigns this round's `ci.yml` edits to plan 29-59's build-parity repair and to nothing else, and because it is a CI comment rather than published gate output or shipped kit text. It is recorded as a residual, not as clean, and recommended to the follow-up.

`agent-factory/writing-profile.md:257..:261` and its frozen `docs/audit/28-claim-registry.md:695..:700` row carry the same superseded wording and are **narrowed by plan 29-58**, which owns both files and must move them in the same commit.

The `scripts/check-banned-claims.ts:60..:68` hard-wrap residual paragraph — which argues from a premise round 7 falsified — is **corrected by plan 29-57** under D-56, deliberately untouched here.

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was introduced; the change is two prose statements, two test cases and one audit document, and every guard is read-only Node-stdlib-only as before.

## Self-Check: PASSED

- `docs/audit/29-round8-residuals.md` — FOUND
- `scripts/check-banned-claims.ts` — FOUND
- `scripts/check-banned-claims.js` — FOUND
- `scripts/check-banned-claims.test.ts` — FOUND
- commit `c119115` — FOUND
- commit `a1c7938` — FOUND

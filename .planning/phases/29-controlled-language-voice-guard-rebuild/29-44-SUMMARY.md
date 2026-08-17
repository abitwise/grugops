---
phase: 29-controlled-language-voice-guard-rebuild
plan: 44
subsystem: testing
tags: [guards, banned-claims, controlled-language, typescript, vitest, type-removal]

requires:
  - phase: 29-43
    provides: the 115-document banned-claim corpus every admission cost in this plan is measured over
provides:
  - "both hand-authored verb lists DELETED from `check-banned-claims.ts` — code and comments, per the retired-construct convention"
  - "the marker field REMOVED FROM THE `BannedClaimLiteral` TYPE, so reintroducing a marker list fails to compile (proven with TS2353, then reverted)"
  - "`lineHits`'s conditional arm and the PASS line's conditional clause both deleted — one mechanism at four addresses, all four removed together"
  - "all three bare-term members unconditional; conditional members 3 -> 0"
  - "nine sentences that passed at exit 0 with the planted file never named now red by name at file:line:column — five comprehension, four conformance"
  - "`agent-factory/roles/incident-responder.md:29` rephrased, not exempted; dispositioned in `docs/audit/29-style-dispositions/29-44.md`"
  - "`BANNED_CLAIM_EXEMPT_SUPPRESSED` 12 -> 14, read off the gate's own refusal text with both entrants named"
  - "`V-29-44-01` opened at the member's declaration; the surviving enumeration named with its member count and direction FAIL-OPEN"
affects: [29-45, 29-46, 29-47, banned-claim prohibition surface]

actuals:
  tokens: 38481
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Remove the apparatus from the TYPE, never empty it. An emptied list leaves the mechanism standing for the next member to reach for; a removed field makes reintroduction a visible type change — demonstrated by adding a member that declares one and watching `tsc` refuse it."
    - "A carve-out over an open class must be POSITIONAL. Every axis a bare term can be paired against — verb, phrase, subject — is open; the only bounded thing is a named region."
    - "Two kinds of pin get opposite treatment: a pin whose VALUE moved is re-measured and keeps its equality; a pin whose SUBJECT was removed is RETIRED with its property and its new home recorded. A zero-valued pin over a construct the type forbids reads in CI as a live check forever."
    - "Select a test fixture on a property intrinsic to the DATA (a digit, a space), never on the presence of a mechanism a later round may delete."

key-files:
  created:
    - docs/audit/29-style-dispositions/29-44.md
  modified:
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - agent-factory/roles/incident-responder.md

key-decisions:
  - "The enumeration was DELETED rather than relocated a third time. The reviewer's subject-side pin was refused by name: `controlled language` / `this profile` / `the kit` / `the voice` is a third hand-authored list over an equally open class and buys exactly one round."
  - "D-53's extension to the standard-name group was executed rather than escalated, because the arithmetic admitted it for free: the discipline's name occurs on two lines and both are inside the exemption region."
  - "`requiresOnSameLine` was removed from the TYPE, not emptied — and the removal was proven to bite with a mutation, not asserted."
  - "WR-06 (an in-gate empty-marker refusal) is DISCHARGED BY DELETION, not shipped: once the field does not exist the guard has no subject and could never run."
  - "The one false red was paid in PROSE. Three matcher weakenings would each have cleared it and all three stay forbidden; the forbidden-alternative paragraph is byte-unchanged, hashed identical."
  - "`BANNED_CLAIM_EXEMPT_SUPPRESSED` was derived from the run and never typed from D-53's prediction — the transcript is the criterion, not the agreement."

patterns-established:
  - "Measure an admission cost through the gate's OWN counter over the corpus as it is now, then re-take it independently by grep over the same derived path list, and require the two to agree."
  - "Capture the RED from the LIVE TREE before the prose that causes it is rephrased. The sequence is what makes it evidence rather than a fixture."
  - "Adjudicate a plant on the rendered finding line at file:line:column, never on the exit code — an unrelated pin makes the exit non-zero for the wrong reason."

requirements-completed: [LANG-04]

coverage:
  - id: D1
    description: "The comprehension prohibition is DECIDED rather than enumerated on any axis: both marker lists gone, the field gone from the type, the conditional arm and the PASS-line clause gone"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "grep -a -c over both .ts and .js for each of the three retired identifiers -> 0/0/0; git diff adds zero readonly string[] to the module"
        status: pass
      - kind: other
        ref: "mutation: a member declaring a marker field -> npx tsc --noEmit exits 2 with TS2353 excess-property error; reverted, git status clean"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#every selector selected the literal its NAME says, so a declaration reorder reds HERE (key-set assertion over all 22 members)"
        status: pass
    human_judgment: false
  - id: D2
    description: "All nine bypass sentences — five round-5 comprehension, four conformance verbs — red by name; the pre-change build is shown to have let them through"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "git archive HEAD mirror, gate sha256 c59b783d… verified identical, clean control exit 0/1277 B: 9 plants one per reset mirror, ALL exit 0 with the planted file never named"
        status: pass
      - kind: integration
        ref: "post-change mirror from the tracked tree, gate sha256 34d72b38… verified identical, clean control exit 0/1185 B: the same 9 plants ALL exit 1 naming agent-factory/workflows/13-incident.md:45 with a column"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#FIRES on FOUR conformance verbs no marker list contained — the D-53 discrimination"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the five ROUND-5 comprehension bypasses all red by name — the D-48 discrimination"
        status: pass
    human_judgment: false
  - id: D3
    description: "The gate is still a prohibition and not a keyword ban on a topic — the carve-out is positional and holds in both directions"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "sha-verified mirror, both bare terms planted on ONE line INSIDE the exemption region -> 0 findings over 115/115; only the suppressed count moves 14 -> 16"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#CONTROL: the same name INSIDE the exemption region is still suppressed"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#CONTROL: the SAME markerless line INSIDE the exemption region is still suppressed"
        status: pass
    human_judgment: false
  - id: D4
    description: "The one real false red is paid in prose: incident-responder.md:29 rephrased with the operational instruction intact and no narrower"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "live-tree RED before the rephrase: exit 1, agent-factory/roles/incident-responder.md:29:103; after: node scripts/check-banned-claims.js exits 0 with 0 findings over 115/115"
        status: pass
      - kind: other
        ref: "3485 B against ceiling 3802/3598; roleCeiling() body sha256 c4d66b0e… identical before and after; '## One job' byte-unchanged; freshness:catalog/adapters/skill-twins all exit 0"
        status: pass
    human_judgment: true
    rationale: "Whether the replacement clause still instructs the same act — mitigate before you diagnose, under uncertainty, in every case — is an editorial judgement no assertion can make. The clause is quoted before and after below and in the disposition file."
  - id: D5
    description: "Every pin the deletion moved was re-derived from a run; every pin whose subject it removed was retired with its property recorded"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "the gate's own refusal text: 'suppressed 14 banned-claim occurrence(s) … declares 12'; entrants writing-profile.md:239 and :241 derived through countBannedClaimOccurrences; extent confirmed unmoved at 62"
        status: pass
      - kind: other
        ref: "grep -a -c for the removed field over check-banned-claims.test.ts -> 0; the four retired assertions enumerated below with their new homes"
        status: pass
    human_judgment: false
  - id: D6
    description: "No paragraph in the module claims a closure the module does not have; the one enumeration that survives is named with its direction"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "both corrected passages quoted in full below; the admission log still emits 8 refused candidates and the case asserting every entry carries a reason passes"
        status: pass
    human_judgment: true
    rationale: "Whether a corrected paragraph now states what the gate does and does not prove is a reading, not a predicate. Both passages are quoted in full below for that reading."

duration: 47min
completed: 2026-08-17
status: complete
---

# Phase 29 Plan 44: The Enumeration Deleted, Not Moved For A Third Time — Summary

**CR-02 closed by deleting the conditional apparatus at all four of its addresses rather than relocating it to a third axis: both hand-authored verb lists gone, `requiresOnSameLine` gone from the `BannedClaimLiteral` TYPE (a member that declares one no longer compiles), `lineHits`'s conditional arm and the PASS line's conditional clause gone with it — conditional members 3 → 0, nine sentences that exited 0 with the planted file never named now red by name at file:line:column, and the single false red the widening creates paid in prose at a cost of 4 bytes.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-08-17T19:46Z
- **Completed:** 2026-08-17T20:33Z
- **Tasks:** 3 of 3
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments

- **The fix is a deletion, and the deletion is enforced by the type system rather than by a convention.** Round 5 replaced six phrases with a rule conditional on seven verbs — the same defect one slot to the left. Round 6 removes the field from `BannedClaimLiteral`, so reintroducing a marker list is a compile error, demonstrated with a mutation rather than asserted.
- **The axis nobody attacked was closed on the same arithmetic as the one the review named.** `Simplified Technical English` was gated by six conformance stems; `follows`, `meets`, `adheres to` and `is written in` each yielded ZERO against the pre-change build. Both directions are on a transcript from sha256-verified mirrors.
- **The carve-out moved from lexical to positional, and both directions of it are asserted.** A bare term inside the exemption region still produces zero findings; the same term outside it reds. That is what keeps the honest denial writable now that no verb list does.
- **Every number in this document was read off a run.** The suppressed pin's move to 14 was *predicted* by D-53; it is recorded here because the gate's own refusal text produced it, and the transcript is quoted as the derivation.

## Task Commits

1. **Task 1 (tracer): the conditional apparatus DELETED at all four addresses** — `e6515d6` (fix)
2. **Task 2: the one false red paid in prose; the pins that moved, derived** — `022a4ea` (fix)
3. **Task 3: no paragraph claims a closure the gate does not have** — `b97808c` (fix)

Each `.ts` was rebuilt and its committed `.js` twin staged in the SAME commit as its source; `npm run freshness` exits 0 at HEAD ("All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild").

## Files Created/Modified

- `scripts/check-banned-claims.ts` / `.js` — both marker constants deleted with their docblocks; `requiresOnSameLine` removed from the type; `lineHits`'s conditional arm and the PASS line's conditional clause removed; three members unconditional; four admission-log entries corrected; `V-29-44-01` opened; the surviving-enumeration statement added at the list's declaration; `BANNED_CLAIM_EXEMPT_SUPPRESSED` 12 → 14.
- `scripts/check-banned-claims.test.ts` — selectors re-derived off properties intrinsic to the literals; four subject-removed assertions retired; nine bypasses added as permanent cases; two positional carve-out controls added.
- `agent-factory/roles/incident-responder.md` — line 29 rephrased (3481 B → 3485 B).
- `docs/audit/29-style-dispositions/29-44.md` — **new**, the D-04/D-05 disposition.

---

## Prohibition verifications — each command run, with its real output

### P1. No new hand-authored marker, spelling, phrase, verb or SUBJECT list

```
$ git diff e6515d6~1..HEAD -- scripts/check-banned-claims.ts | grep -E '^\+.*readonly string\[\]'
(no output — the diff adds ZERO readonly string[] to the module)

$ grep -n 'readonly string\[\]' scripts/check-banned-claims.ts
706:export const BANNED_CLAIM_EXCLUDED_LOCATIONS: readonly string[] = [
859:  members: readonly string[];
1016:  lines: readonly string[],
1335:  lines: readonly string[],
```

**Every `readonly string[]` in the module after this plan, with its purpose:**

| site | purpose | a list of prose forms? |
|---|---|---|
| `BANNED_CLAIM_EXCLUDED_LOCATIONS` (706) | path prefixes excluded from the scan, each with a written reason | **no** — paths |
| `BANNED_CLAIM_SCAN_PARTS[].members` (859) | the derived member list of one scan part, walked from disk | **no** — derived paths |
| `locateExemptRegion(lines)` (1016) | a function parameter | **no** |
| `countBannedClaimOccurrences(lines, …)` (1335) | a function parameter | **no** |

**The only surviving enumeration is `BANNED_CLAIM_LITERALS` itself** — typed `readonly BannedClaimLiteral[]`, 22 members across 3 groups. It is the list of WHAT IS BANNED, which is the prohibition's subject and cannot be derived away. It is named with its direction at its own declaration (quoted under Task 3 below).

**Status: enforced.** The reviewer's subject-side pin was refused by name in the type's docblock.

### P2. The apparatus is removed from the TYPE, never emptied

```
$ for id in BENEFIT_VERB_MARKERS CONFORMANCE_VERB_MARKERS requiresOnSameLine; do
    for f in check-banned-claims.ts check-banned-claims.js check-banned-claims.test.ts; do
      printf "%-26s %-32s %s\n" "$id" "$f" "$(grep -a -c "$id" scripts/$f)"; done; done
BENEFIT_VERB_MARKERS       check-banned-claims.ts           0
BENEFIT_VERB_MARKERS       check-banned-claims.js           0
BENEFIT_VERB_MARKERS       check-banned-claims.test.ts      0
CONFORMANCE_VERB_MARKERS   check-banned-claims.ts           0
CONFORMANCE_VERB_MARKERS   check-banned-claims.js           0
CONFORMANCE_VERB_MARKERS   check-banned-claims.test.ts      0
requiresOnSameLine         check-banned-claims.ts           0
requiresOnSameLine         check-banned-claims.js           0
requiresOnSameLine         check-banned-claims.test.ts      0
```

**The `BannedClaimLiteral` declaration in full, after the change:**

```ts
export interface BannedClaimLiteral {
  readonly literal: string;
  readonly group: BannedClaimGroup;
}
```

It declares no optional marker field of any name. `npm run typecheck` exits 0.

**And the removal is PROVEN TO BITE, not asserted.** A member declaring a marker field was added to the source and `npx tsc --noEmit` was watched failing:

```
scripts/check-banned-claims.ts:417:56 - error TS2353: Object literal may only specify
known properties, and 'requiresOnSameLine' does not exist in type 'BannedClaimLiteral'.

417   { literal: "mutation-probe", group: "comprehension", requiresOnSameLine: ["x"] },
                                                           ~~~~~~~~~~~~~~~~~~
Found 1 error in scripts/check-banned-claims.ts:417
TSC_EXIT=2
```

Reverted; `npx tsc --noEmit` exits 0 and `git status --porcelain` carries no mutation. Printed from the **built `.js`**:

```
members: 22
keys union: ["group","literal"]
members with any third property: 0
enumerated comprehension (multi-word): 6
```

**Status: enforced.** Zero members are conditional, and the shape is refused by the compiler rather than by a runtime guard.

### P3. The matcher is never weakened

```
$ git diff e6515d6~1..HEAD -- scripts/check-banned-claims.ts | grep -E '^[+-].*(function occurrences|haystackLower|needleLower)'
(no output — occurrences() is byte-unchanged across the whole plan)

$ git show e6515d6~1:scripts/check-banned-claims.ts | grep -E 'FORBIDDEN ALTERNATIVE|fenced blocks, skipping lines below some marker' | shasum -a 256
6a0d70bea8ff5ce2a0a58240cc13f359b5eebac09788cdb8293e67ac45eaaaa4  -
$ grep -E 'FORBIDDEN ALTERNATIVE|fenced blocks, skipping lines below some marker' scripts/check-banned-claims.ts | shasum -a 256
6a0d70bea8ff5ce2a0a58240cc13f359b5eebac09788cdb8293e67ac45eaaaa4  -
```

**`lineHits` after the change, in full — it changed ONLY by the removal of the conditional arm:**

```ts
function lineHits(line: string): LineHit[] {
  const lower = line.toLowerCase();
  const out: LineHit[] = [];
  for (const member of BANNED_CLAIM_LITERALS) {
    for (const at of occurrences(lower, member.literal.toLowerCase())) {
      out.push({ member, at });
    }
  }
  return out;
}
```

Removing a `continue` guard makes the matcher report **strictly more, never less**: every line that produced a hit before produces it now, and lines that were skipped are now read. There is no direction in which this deletion can hide a finding.

**Status: enforced.** No fenced-block skip, no whole-word-only match, no below-a-marker skip, no whitespace normalisation.

### P4. Green is never reached by deleting correct text

**`agent-factory/roles/incident-responder.md:29` — BEFORE:**
```
1. Stop the bleeding first — apply or recommend the immediate mitigation that limits harm, before you understand the cause. Diagnosis can wait; the bleeding cannot.
```
**AFTER:**
```
1. Stop the bleeding first — apply or recommend the immediate mitigation that limits harm, before the cause has been diagnosed. Diagnosis can wait; the bleeding cannot.
```

The numbered step still instructs mitigation before diagnosis, under uncertainty, in every case. Nothing is removed and nothing is narrowed. **Why the wording supplies the meaning rather than evading the matcher:** the original stated the temporal precondition as a *mental state* of the reader; the replacement states it as the *act the step defers* — the same act the very next sentence names when it says *Diagnosis can wait* — so both halves of the step now use one word for one thing.

```
$ git diff 50e966e..HEAD --stat agent-factory/roles/incident-responder.md
 agent-factory/roles/incident-responder.md | 2 +-
$ wc -c agent-factory/roles/incident-responder.md
    3485
```

**3485 B against `roleCeiling("incident-responder.md")` = `"3802 3598"` (FAIL / WARN).** Neither approached; the rephrase consumed 4 bytes of 113 B headroom to WARN.

**Status: enforced.**

### P5. No byte ceiling is raised

```
$ node -e "…sha256 of roleCeiling()'s function body…"   # before the plan
c4d66b0e224299f9c797714886e4bbc5953d9c6138c18f035b77a8d9750f30e7 1965 bytes
$ node -e "…same…"                                       # after the plan
c4d66b0e224299f9c797714886e4bbc5953d9c6138c18f035b77a8d9750f30e7 1965 bytes
```

**Status: enforced.** Byte-identical. `scripts/check-foundation-guards.ts` is not in this plan's diff at all.

### P6. WR-06's in-gate empty-marker refusal is NOT shipped

`runAll()` contains no empty-marker refusal, and could not: the member shape it would refuse is not a shape `BannedClaimLiteral` admits, so the guard clause would have no subject and could never run. **WR-06 is recorded here as DISCHARGED BY DELETION**, with the disposition also written in the test file where the retired case used to sit and carried to plan 29-47's reconciliation table. It is not a silent drop.

### P7. `BANNED_CLAIM_EXEMPT_SUPPRESSED` is RE-DERIVED from the run, never typed

**The gate's own refusal text, quoted as the derivation** (from the run taken *after* the deletion and *before* the constant was touched):

```
  FAIL  the one named exemption region `agent-factory/writing-profile.md` § `## Disclaimer and
        honesty floor` suppressed 14 banned-claim occurrence(s), and BANNED_CLAIM_EXEMPT_SUPPRESSED
        in scripts/check-banned-claims.ts declares 12. …
```

**The per-group breakdown, taken through `countBannedClaimOccurrences` over the region in the same pass:**

```
region: headingAt=234 (line 235) endBefore=296 extent=62
SUPPRESSED (countBannedClaimOccurrences over the region): 14
  writing-profile.md:239  "ASD-STE100" (standard-name) x2
  writing-profile.md:239  "Simplified Technical English" (standard-name) x1   <- ENTRANT
  writing-profile.md:241  "Simplified Technical English" (standard-name) x1   <- ENTRANT
  writing-profile.md:242  "ASD-STE100" (standard-name) x1
  writing-profile.md:246  "ASD-STE100" (standard-name) x1
  writing-profile.md:251  "ASD-STE100" (standard-name) x1
  writing-profile.md:255  "ASD-STE100" (standard-name) x1
  writing-profile.md:255  "token-economy" (token-economy) x1
  writing-profile.md:256  "comprehension benefit" (comprehension) x1
  writing-profile.md:256  "comprehension" (comprehension) x1
  writing-profile.md:278  "token-economy" (token-economy) x1
  writing-profile.md:288  "improves comprehension" (comprehension) x1
  writing-profile.md:288  "comprehension" (comprehension) x1
BY GROUP: {"standard-name":8,"token-economy":2,"comprehension":4}   SUM: 14
```

| group | before | after |
|---|---|---|
| standard-name | 6 | **8** |
| token-economy | 2 | 2 |
| comprehension | 4 | 4 |
| **total** | **12** | **14** |

**Both entrants named at the constant:** `agent-factory/writing-profile.md:239` and `:241`, the non-affiliation disclaimer naming the standard in order to deny it. **Neither line changed by a byte.** They entered because the *prohibition got wider* — the second time this pin has moved in that direction and the first time for the standard-name group.

D-53 predicted 14. **The prediction and the measurement agreed, and the TRANSCRIPT is the criterion, not the agreement** — the change landed first, the run produced the number, then the constant moved. `BANNED_CLAIM_EXEMPT_EXTENT` is confirmed **unmoved at 62** by the same run's PASS line.

**Status: enforced.**

---

## The admission cost, derived through the gate's own counter — BEFORE the change

Measured over the corpus plan 29-43 left, through a build of this module whose literal list was reduced to one unconditional member per term, so `lineHits` / `occurrences` / `locateExemptRegion` are the gate's own:

```
DERIVED PATH CARDINALITY: 115 (pin BANNED_CLAIM_SCAN_COUNT=115)
```

| bare term | total occurrences | inside the one named exemption region | new findings |
|---|---|---|---|
| `comprehension` | 2 | 2 | **0** |
| `Simplified Technical English` | 2 | 2 | **0** |
| `understand` | 1 | 0 | **1** |

Occurrences, by address:

```
comprehension:
  agent-factory/writing-profile.md:256  "…No comprehension benefit is claimed.**…"      INSIDE
  agent-factory/writing-profile.md:288  "…improves comprehension for a language model…" INSIDE
Simplified Technical English:
  agent-factory/writing-profile.md:239  "…ideas of ASD-STE100 Simplified Technical English Issue 9…" INSIDE
  agent-factory/writing-profile.md:241  "…or the Simplified Technical English Maintenance Group…"    INSIDE
understand:
  agent-factory/roles/incident-responder.md:29  "…before you understand the cause…"      OUTSIDE
```

**Independently re-taken with `grep -a -i` over the same 115 derived paths; the two agree on all three terms** (`-a` because a single NUL byte makes BSD grep report zero matches silently):

```
=== grep -a -i re-take: comprehension ===          occurrences=2  matching-lines=2
=== grep -a -i re-take: understand ===             occurrences=1  matching-lines=1
=== grep -a -i re-take: Simplified Technical English ===  occurrences=2  matching-lines=2
```

The derived path cardinality is recorded so a short scan cannot make a low count look like a clean bill: **115 paths, equal to `BANNED_CLAIM_SCAN_COUNT`.**

---

## The pre-change conformance bypass, reproduced BEFORE the deletion

Base commit `50e966e`. Mirror built with `git archive HEAD`; gate sha256 **`c59b783df586c72871308451ebef2025e3605c845ee105bf2f7b3565da393d69`**, verified byte-identical to the repository's. Clean-mirror control: **exit 0, 1277 bytes, banner present**. One plant per reset mirror, into `agent-factory/workflows/13-incident.md`.

```
[pre-conforms_to]   exit=1  named-lines=1
    agent-factory/workflows/13-incident.md:45:29 — banned standard-name literal
    "Simplified Technical English" — "The grugops kit conforms to Simplified Technical English."
[pre-follows]       exit=0  named-lines=0
[pre-meets]         exit=0  named-lines=0
[pre-adheres_to]    exit=0  named-lines=0
[pre-is_written_in] exit=0  named-lines=0
```

The five round-5 comprehension plants, same mirror, same protocol:

```
[pre-c1] exit=0  named-lines=0   "Controlled language increases comprehension."
[pre-c2] exit=0  named-lines=0   "Controlled language raises comprehension."
[pre-c3] exit=0  named-lines=0   "Controlled language gives models sharper comprehension."
[pre-c4] exit=0  named-lines=0   "Controlled language aids comprehension."
[pre-c5] exit=0  named-lines=0   "Controlled language makes models understand prose faster."
```

**Nine sentences, nine exits at 0, the planted file never named once.**

---

## The live-tree RED, captured BEFORE anything was rephrased

This is the D-24 acceptance evidence: the widened prohibition has teeth against real correct text nobody planted.

```
$ node scripts/check-banned-claims.js ; echo "EXIT=$?"

[guard_banned_claims] the shipped kit and the public documents carry no conformance, token-economy
or comprehension claim, outside one named exemption region (LANG-04 / D-29, D-44)
  FAIL  the one named exemption region `agent-factory/writing-profile.md` § `## Disclaimer and
        honesty floor` suppressed 14 banned-claim occurrence(s), and BANNED_CLAIM_EXEMPT_SUPPRESSED
        in scripts/check-banned-claims.ts declares 12. …
  FAIL  banned claims: 1 finding(s) over 115 elements
        agent-factory/roles/incident-responder.md:29:103 — banned comprehension literal "understand"
        — "1. Stop the bleeding first — apply or recommend the immediate mitigation that limits
        harm, before you understand the cause. Diagnosis can wait; the bleeding cannot."

== Result ==
2 CHECK(S) FAILED
EXIT=1
```

**Exactly one new finding OUTSIDE the exemption region**, at `file:line:column`, exactly as the pre-change measurement projected. The newly matching `Simplified Technical English` occurrences are INSIDE the region and moved the suppressed pin instead of producing findings — which is the distinction the pin measures.

---

## The post-change mirror: nine plants, all red by name

Mirror built from the tracked working tree (`git ls-files | tar`); **1596 mirror files vs 1596 tracked**. Gate sha256 **`34d72b38ea54aa552b6f66c805f47b8cf5976b8b834fe0af855df68ce2119271`**, verified byte-identical to the repository's. Clean-mirror control: **exit 0, 1185 bytes, banner present**. One plant per reset mirror; **every verdict gated on a non-empty-output + banner premise assertion** (the 29-43 harness-catch protocol).

### The five round-5 comprehension bypasses

```
[c1] exit=1 named=1  13-incident.md:45:31 — banned comprehension literal "comprehension" — "Controlled language increases comprehension."
[c2] exit=1 named=1  13-incident.md:45:28 — banned comprehension literal "comprehension" — "Controlled language raises comprehension."
[c3] exit=1 named=1  13-incident.md:45:42 — banned comprehension literal "comprehension" — "Controlled language gives models sharper comprehension."
[c4] exit=1 named=1  13-incident.md:45:26 — banned comprehension literal "comprehension" — "Controlled language aids comprehension."
[c5] exit=1 named=1  13-incident.md:45:34 — banned comprehension literal "understand"    — "Controlled language makes models understand prose faster."
```

### The four conformance verbs — D-53's discrimination proof

```
[v-follows]       exit=1 named=1  13-incident.md:45:25 — banned standard-name literal "Simplified Technical English"
[v-meets]         exit=1 named=1  13-incident.md:45:23 — banned standard-name literal "Simplified Technical English"
[v-adheres_to]    exit=1 named=1  13-incident.md:45:28 — banned standard-name literal "Simplified Technical English"
[v-is_written_in] exit=1 named=1  13-incident.md:45:31 — banned standard-name literal "Simplified Technical English"
[v-conforms_to]   exit=1 named=1  13-incident.md:45:29 — banned standard-name literal "Simplified Technical English"
```

### The two tables side by side — a 0-to-named movement on the same harness, both directions

| plant | pre-change (`c59b783d…`) | post-change (`34d72b38…`) |
|---|---|---|
| `conforms to` **(control)** | exit 1, named at `:45:29` | exit 1, named at `:45:29` |
| `follows` | **exit 0, NOT named** | **exit 1, named at `:45:25`** |
| `meets` | **exit 0, NOT named** | **exit 1, named at `:45:23`** |
| `adheres to` | **exit 0, NOT named** | **exit 1, named at `:45:28`** |
| `is written in` | **exit 0, NOT named** | **exit 1, named at `:45:31`** |
| `increases comprehension` | **exit 0, NOT named** | **exit 1, named at `:45:31`** |
| `raises comprehension` | **exit 0, NOT named** | **exit 1, named at `:45:28`** |
| `gives models sharper comprehension` | **exit 0, NOT named** | **exit 1, named at `:45:42`** |
| `aids comprehension` | **exit 0, NOT named** | **exit 1, named at `:45:26`** |
| `makes models understand prose faster` | **exit 0, NOT named** | **exit 1, named at `:45:34`** |

The `conforms to` row is the control that keeps the other four honest: the harness did not simply start reddening everything. Every verdict is read from the **rendered finding line**, never from the exit code alone.

### The suppression control — the change stayed a prohibition, not a keyword ban on a topic

A blank line INSIDE the exemption region was **replaced** (not inserted, so the extent pin cannot move) with a line carrying BOTH bare terms and a conformance verb:

```
Controlled language increases comprehension and the kit follows Simplified Technical English.

exit=1
findings naming writing-profile.md: 0
  PASS  banned claims: 0 findings over 115/115 elements
  FAIL  … suppressed 16 banned-claim occurrence(s) … declares 14
```

**Zero findings.** The only effect is the suppressed pin moving 14 → 16, which is that pin working exactly as designed. The region is still the carve-out and the topic is still writable.

---

## The measurement history of BOTH deleted blocks, transcribed VERBATIM before deletion

Both lists were measured over corpora that no longer exist, so nothing can re-derive these afterwards. Plan 29-47's record carries them forward from here.

### The conformance-stem list (six substring stems), verbatim:

> The conformance / certification verb stems that turn the discipline's bare name into a claim.
>
> These are STEMS on purpose and each covers its whole family by substring: `conform` covers
> conforms/conformant/conformance, `complian` covers compliant/compliance, `certif` covers
> certified/certification, `endors` covers endorsed/endorsement, `approv` covers approved/approval.
> They are NOT banned literals in their own right and must never become any: measured over the scan
> set they hit **60, 18, 2 and 70** lines of entirely correct text about compliance regimes, release
> approvals and ASVS certification requirements.

**Corpus it was taken over:** the derived scan set as it stood when the list was admitted (pre-29-43, 82 documents). Members: `conform`, `complian`, `certif`, `endors`, `approv`, `accredit`. The 150-hit total and the 60 / 18 / 2 / 70 breakdown survive verbatim in `BANNED_CLAIM_EXCLUDED`.

### The benefit-verb list (seven substring markers), verbatim:

> MEASURED BEFORE ADMISSION, PER MARKER, AND THE NUMBERS ARE WHAT ADMITTED IT.
>
> Taken 2026-08-17 over the set `bannedClaimScan()` derives — **82 documents, 5898 lines** — as the
> number of LINES carrying the marker. Every count was then re-taken independently with
> `grep -a -i -c` over the same 82 paths; the two agree on all seven.
>
> ```
>   marker     lines   what admitted it
>   -------    -----   --------------------------------------------------------------------------
>   improve       17   the measured family: "improves LLM/model/agent comprehension"
>   better         0   warrant plant: "Controlled language gives better comprehension."
>   easier         0   the measured family: "...easier for LLMs to understand" (via `understand`)
>   boost          0   the measured family: "boosts comprehension for language models"
>   help           3   warrant plant: "Controlled language helps comprehension."
>   benefit        3   warrant plant: "Controlled language delivers a real benefit in comprehension."
>   enhance        1   warrant plant: "Controlled language enhances comprehension."
> ```
>
> A ZERO IS NOT A REASON TO DELETE A MARKER … `CONFORMANCE_VERB_MARKERS` records its numbers because
> they are LARGE — 60, 18, 2, 70 — which is why those stems may never become literals in their own
> right. This list records its numbers for the OPPOSITE reason: a zero means the marker over-matches
> nothing in the corpus, which is the safest reading a marker can have.
>
> THESE ARE MARKERS AND MUST NEVER BECOME LITERALS. `improve` alone hits 17 lines of entirely correct
> text about improving the board, the trace and the workflows; `help` and `benefit` hit 3 each.

**Corpus it was taken over:** 82 documents / 5898 lines. Both readings were true when written. Neither was the problem: the problem was that a verb the list did not contain defeated the whole rule, which five plants proved at exit 0.

---

## The two kinds of pin, treated differently

### Pins whose VALUE moved — re-measured, kept as equalities, reason carried at the assertion

| pin | before | after | derivation |
|---|---|---|---|
| `BANNED_CLAIM_EXEMPT_SUPPRESSED` | 12 | **14** | read off the gate's own refusal text; both entrants named at the constant by file and line, with the reason each entered |
| `BANNED_CLAIM_EXEMPT_EXTENT` | 62 | **62 (confirmed unmoved)** | read off the same run's PASS line, not assumed from "the region was not edited" |
| `BANNED_CLAIM_SCAN_COUNT` | 115 | **115 (untouched)** | fixed by plan 29-43; asserted unmoved |
| the enumerated-comprehension count of six | 6 | **6 (untouched)** | the two-sided pin was not modified by this plan |

### Pins whose SUBJECT was removed — RETIRED, with the property and its new home recorded

| retired assertion | the property it held | where that property is held now |
|---|---|---|
| the conditional-member cardinality equality (`… .length).toBe(3)`) | a new conditional member arriving silently reds on the day it lands | **By the TYPE, and more strongly.** A member carrying a marker field does not compile (TS2353, demonstrated above), so the arrival is a build error rather than an assertion failure. The run-time half is the new key-set assertion `Object.keys(m).sort()).toEqual(["group","literal"])` over all 22 members, which reds on ANY third property whatever it is named. |
| the source-derived conditional-member denominator (`declaredConditionalMembers()`) | the element count came from the source text, not from the loop that consumed it — so a silently short walk reds | **Nowhere, because the shape cannot exist.** There is no member declaration for it to count. The independent-denominator DISCIPLINE is unaffected and is still applied by every other derived-count case in the file. |
| the per-member marker walk (`expect(m.…).toBeDefined()`, `…?.length ?? 0).toBeGreaterThan(0)`) | a member with an EMPTY marker list — a prohibition matching nothing, forever, silently — is refused | **Nowhere, because the shape cannot exist.** This is WR-06's subject; discharged by deletion (see P6). |
| the marker-length floor (`marker.trim().length).toBeGreaterThan(2)`) | a blank marker would make the co-occurrence test true on every line, turning a conditional member unconditional without moving any count | **Nowhere, because there is no co-occurrence test.** The failure mode it guarded — a member becoming unconditional — is now the *declared* behaviour of every member. |

**None survives as a zero-valued pin.** `grep -a -c 'requiresOnSameLine' scripts/check-banned-claims.test.ts` returns **0**.

The grep sweep was run BEFORE the typecheck, not driven by it. Its output list (which the typecheck then confirmed complete):

```
scripts/check-banned-claims.test.ts:
  70, 89   (imports)      116, 130, 134, 141, 153, 195, 205, 312   (selectors, docblock, helper)
  321      (source slice)  559, 570, 583, 629, 631                 (assertions)
  866, 872, 901, 918-921   (per-marker loop)
  2269, 2279, 2295, 2306, 2307, 2310                               (cardinality + empty-marker case)
```

---

## Cases the deletion made VACUOUS — named, kept, and handed to plan 29-45

Each plants one historical benefit word beside the bare term and asserts a red. **They all still pass — but they pass because the BARE TERM ALONE reds now**, not because the word did anything. Each therefore asserts something its own name does not describe.

| case name (from `scripts/check-banned-claims.test.ts`) |
|---|
| `marker "improve" ALONE on the line turns the bare term into a finding` |
| `marker "better" ALONE on the line turns the bare term into a finding` |
| `marker "easier" ALONE on the line turns the bare term into a finding` |
| `marker "boost" ALONE on the line turns the bare term into a finding` |
| `marker "help" ALONE on the line turns the bare term into a finding` |
| `marker "benefit" ALONE on the line turns the bare term into a finding` |
| `marker "enhance" ALONE on the line turns the bare term into a finding` |
| `the marker-plant TEMPLATE smuggles in no second marker and no enumerated literal` |

**NOT deleted in this plan** — a case removed without a record is indistinguishable from a case that was never written. The describe block carries a docblock stating exactly this, and **plan 29-45 owns their repurposing.** The seven words they walk are now a test-local fixture (`HISTORICAL_BENEFIT_WORDS`) with a docblock refusing its promotion back into the gate; it is not consulted by any predicate and adds no array to the module (see P1).

---

## The corrected passages, quoted in full

### 1. The rule member's docblock — what is NOT proved, stated without hedging

> AND HERE IS WHAT IS STILL NOT PROVED, STATED WITHOUT HEDGING, BECAUSE THE SENTENCE ABOVE ABOUT
> "a guard that holds a prohibition rather than the spellings somebody thought of" IS FINALLY TRUE
> OF THIS CODE AND WAS NOT TRUE WHEN IT WAS FIRST WRITTEN. It became true by DELETION of the axis
> it had been moved to, in round 6 — not by having been right all along in round 5, which shipped
> that sentence about the very list it was shipping. A comprehension, conformance or
> token-economy claim written WITHOUT ANY PINNED LITERAL still passes this gate. What the gate
> proves is exactly what the module header claims and no more: no pinned literal appears outside
> the one named exemption region. The surviving enumeration is named with its member count and its
> direction at the list's own declaration above.

### 2. The option-(b) rejection entry — the coverage claim narrowed to what an assertion actually holds

> … User decision (c) replaced the enumeration with a RULE, and round 6 then deleted the rule's
> conditional half rather than move its enumeration a third time; the two bare terms above are
> unconditional literals now. WHAT AN ASSERTION ACTUALLY HOLDS, STATED NARROWLY BECAUSE THIS
> SENTENCE USED TO CLAIM MORE: check-banned-claims.test.ts pins the enumerated-comprehension count
> two-sided at 6, so APPENDING A PHRASING to that group reds by name. That pin holds the PHRASE
> list's cardinality and says nothing about any other axis — it never did. What closes the axis an
> appended phrasing would have exploited is not an assertion at all: the conditional half of this
> group is DELETED, so there is no verb, phrase or subject list left to append to.

Its measured zero and its mechanism argument are byte-unchanged; only the coverage claim moved.

### 3. The conformance-stem entry — the measurement kept, the survive-as-markers clause removed

**BEFORE:**
> "60 + 18 + 2 + 70 hits across compliance-regime documentation, ASVS certification rows, release-approval steps and the README's own non-affiliation disclaimer. **They survive only as co-occurrence markers, and for exactly ONE of the three conditional members — the discipline's name.** The other two are on the benefit-verb list and this list has no bearing on them …"

**AFTER:**
> "60 + 18 + 2 + 70 hits across compliance-regime documentation, ASVS certification rows, release-approval steps and the README's own non-affiliation disclaimer. THAT MEASUREMENT IS STILL TRUE AND IS WHY THESE STEMS MAY NEVER BE PROMOTED TO LITERALS: each would report a finding on scores of lines of entirely correct text, and the only route back to green would be deleting it. WHAT THIS ENTRY USED TO ADD, AND WHICH ROUND 6 MADE FALSE IN BOTH HALVES: that the stems survive as co-occurrence markers, and for exactly one conditional member. There are no conditional members and no co-occurrence mechanism — both were deleted (D-48, D-53), because a hand-authored verb list is a list over an open class and four ordinary conformance verbs outside this one yielded ZERO findings against the pre-change build. The stems are refused as literals on the count above and are retained for nothing; the number outlives the construct, which is why this entry is corrected rather than deleted."

**The entry is NOT deleted** and its `hits: 150` is unchanged.

### 4. The two bare-term admission-log entries — no longer described as conditional

**`comprehension, as an UNCONDITIONAL literal` (hits: 2) — AFTER:**
> "… That count refused it as an unconditional literal in plan 29-41 and it is kept because it is the record. THE VERDICT WAS OVERTURNED IN ROUND 6 AND THE MEMBER IS NOW UNCONDITIONAL. Re-measured through this module's own counter over the 115-document corpus and independently re-taken by grep, the two agreeing: 2 occurrences, BOTH INSIDE the one named exemption region, so 0 new findings. The occurrences that made unconditional look expensive were always inside the carve-out; what changed is that the carve-out is now the whole of the mechanism instead of half of it. The topic stays writable POSITIONALLY — the denial is written where the region is — rather than lexically."

**`understand, as an UNCONDITIONAL literal` (hits: 1) — AFTER:**
> "hit ONE line of correct operational text in agent-factory/roles/incident-responder.md, making no claim of any kind, so going green in plan 29-41 would have meant deleting it. That count is kept because it is the record. THE VERDICT WAS OVERTURNED IN ROUND 6 AND THE MEMBER IS NOW UNCONDITIONAL — BY REPHRASING THE TEXT, NEVER BY WEAKENING THE MATCHER, so a reader does not read the reversal as a relaxation. The widened term reddened that line on the LIVE TREE and the transcript is this change's acceptance evidence; the sentence was then rewritten … Re-measured after the rephrase … : 0 occurrences. The residual the widening opens is carried as `V-29-44-01` at the member's declaration, fail-closed, 0 live."

### 5. The surviving-enumeration statement at `BANNED_CLAIM_LITERALS`'s declaration

> THE ONE ENUMERATION THAT SURVIVES ROUND 6, STATED WITH ITS DIRECTION RATHER THAN IMPLIED AWAY.
>
> A ROUND THAT CLOSES A DEFECT BY DELETION IS THE ROUND MOST LIKELY TO BE READ AS HAVING CLOSED THE
> CLASS, SO THIS IS WRITTEN OUT INSTEAD OF LEFT TO INFERENCE.
>
> Round 6 deleted two hand-authored verb lists and the mechanism that consulted them, because every
> axis a bare term can be paired against — verb, phrase, subject — is an open class. What remains is
> a PINNED LITERAL LIST plus one named exemption region, and THIS LIST IS ITSELF AN ENUMERATION. It
> is the enumeration of WHAT IS BANNED, which is the prohibition's own subject and cannot be derived
> away: a prohibition with nothing enumerated forbids nothing.
>
> **MEMBERS: 22, across 3 groups.** The count is published on every green run and pinned by a case.
>
> **DIRECTION: FAIL-OPEN**, and the consequence stated plainly. A conformance, token-economy or
> comprehension claim written in words this list does not contain PASSES THIS GATE. The gate proves
> that no pinned literal appears outside the one named exemption region. It does NOT prove that no
> such claim can be written, and no round has ever proved that.
>
> WHAT CHANGED IS WHICH KIND OF LIST IS LOAD-BEARING … A list of VERBS was a list over how a claim is
> SAID, and any unlisted synonym defeated it — measured five times on the comprehension group and
> four times on the standard's name. A list of BANNED SUBJECTS is a list over WHAT IS FORBIDDEN, and
> adding to it is an act of deciding one more thing is forbidden. The first kind of list has a wrong
> length and no correct one; the second has whatever length this project has decided on …

### 6. `V-29-44-01`, opened at the `understand` member's declaration

> **DIRECTION: FAIL-CLOSED.** The gate over-reports here; nothing is hidden by it. That is the safe
> direction and it is still a cost somebody pays …
>
> **THE REACH IS THE WHOLE TERM NOW, NOT A MARKER-GATED SLICE OF IT, AND THE DELETION IS WHAT WIDENED
> IT.** Matching is plain case-insensitive substring, so this member also reaches the third-person
> form, the gerund and the negated form. Until round 6 the term only reported beside an admitted
> verb, which is why one live occurrence cost nothing; unconditional, ANY sentence about a human
> reader's grasp of anything reds — "the board helps a new joiner understand the state" makes no
> claim about a language model and would be a finding.
>
> **LIVE COUNT: 0**, re-derived over the current 115-document corpus … and independently re-taken
> with `grep -a -i` …; the two agree.
>
> **THE REMEDY, WHICH IS THE SAME ONE THAT WAS APPLIED:** rephrase the sentence, or admit a narrower
> term with its own measurement. NEVER weaken the matcher.

---

## Enumerations in the module: before and after

| enumeration | before this plan | after this plan |
|---|---|---|
| `BANNED_CLAIM_LITERALS` — **what is banned** | 22 members, 3 groups, 3 of them conditional | **22 members, 3 groups, 0 conditional** — the one surviving enumeration, named with its direction |
| the conformance-verb marker list — **how a claim is said** | 6 stems | **DELETED** |
| the benefit-verb marker list — **how a claim is said** | 7 markers | **DELETED** |
| `BANNED_CLAIM_EXCLUDED` — refused candidates | 8 entries | 8 entries (4 corrected, none added, none removed) |
| `BANNED_CLAIM_EXCLUDED_LOCATIONS` — excluded paths | 5 prefixes | 5 prefixes (untouched) |
| the marker field on the member type | present, optional | **REMOVED FROM THE TYPE** |

**Nothing about how a claim is said is enumerated any more.**

---

## The D-04 frozen-set checks, with the check that established each

| frozen source | check run | result |
|---|---|---|
| claim-registry verbatim anchor | `grep -c 'incident-responder' docs/audit/28-claim-registry.md` | **0** — the file is named zero times in the registry |
| role `## Hard limits` | the edited clause is item 1 of `## Responsibilities` (line 29); `## Hard limits` begins at line 43 and is byte-unchanged in the diff | **not intersected** |
| positive guard literal | `POSITIVE_GUARD_LITERALS` imported from the built `.js`: 9 literals, filtered for `understand`/`bleeding` → `[]` | **not intersected** |

So **no same-commit companion edit is owed under D-04**, and the `companion` cell in both disposition rows reads `—` because the frozen set was checked and not intersected, not because it was assumed away.

`docs/audit/28-disposition-register.md`'s row for this file is `safety_surface: yes`, and the reason that row gives is its `## Hard limits` closing sentence *Production action is always human-confirmed* — the `production_requires_human_confirmation` floor stated in role text. **That is not the clause edited here.**

---

## Verification commands, recorded by name

| command | exit |
|---|---|
| `npm run build` | 0 |
| `npm run typecheck` | 0 (both `tsconfig.json` and `tsconfig.tests.json`) |
| `npm run freshness` | 0 — "All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild." |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `npm run check:public-docs` | 0 |
| `npm run check:audit-register` | 0 |
| `npm run check:claim-anchors` | 0 |
| `npm run check:banned-claims` | 0 |
| `npm run check:imperative-lexicon` | 0 |
| `npm run check:diff-disposition` | 0 — "0 findings over 37/37 elements" |
| `npm run check:nul-bytes` | 0 |
| `node scripts/check-foundation-guards.js` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **52 files, 2061 passed, 2 skipped** |

`npm test` was **NOT** run (it spawns the live claude-CLI e2e lane). **2061 passing against the 29-43 baseline of 2060** (+1 net: +6 new cases, −5 retired). The 2 skips are pre-existing and in files this plan did not touch.

`git status --porcelain` carries no plant, mirror, fixture or mutation. `package.json` and `package-lock.json` are byte-unchanged since `50e966e` (T-29-44-SC: `git diff 50e966e..HEAD --stat -- package.json package-lock.json` produces no output).

---

## Deviations from Plan

### 1. [Rule 3 — blocking] The test-file reference sweep was folded into Task 1

- **Found during:** Task 1.
- **Issue:** The plan assigns the test-file grep sweep to Task 2, but Task 1's own acceptance criterion requires `npm run typecheck` to exit 0. Removing the field from the TYPE makes `scripts/check-banned-claims.test.ts` uncompilable at 26 sites, so Task 1 cannot satisfy its own criterion without the sweep.
- **Fix:** The mechanical reference removal and the retirement of the four subject-removed assertions landed in Task 1's commit. **Task 2 still owns the RECORD** — the retirement table with each property and its new home, the vacuous-case list, and the grep output — all of which are above.
- **Verification:** `npx tsc -p tsconfig.tests.json --noEmit` exits 0 at Task 1's commit; the grep sweep was run before the typecheck and its output list is recorded.
- **Committed in:** `e6515d6`.

### 2. [Rule 3 — blocking] Task 1's commit intentionally leaves the tree RED

- **Found during:** Task 1.
- **Issue:** Task 1's `<verify>` runs the gate's test file, but the plan's own design assigns both consequences of the deletion — the suppressed pin moving and the one false red — to Task 2. Three cases therefore fail at Task 1's commit, and there is no ordering in which they do not: `expected 14 to be 12`, and two live-tree cases failing on `agent-factory/roles/incident-responder.md:29`.
- **Fix:** Task 1 was committed with the RED named explicitly in its commit message, and Task 2 closes all three. This is the RED-first sequence this phase uses elsewhere (29-43's task 2 was a `test(...)` RED commit), and capturing the live RED before the rephrase is what makes it evidence.
- **Verification:** at `022a4ea` the gate exits 0 and the test file is 82/82; at `HEAD` the full suite is 2061/2 with every gate at exit 0.
- **Committed in:** `e6515d6` → `022a4ea`.

### 3. [Rule 1 — bug] The test-file selectors keyed on a property the deletion removed

- **Found during:** Task 1.
- **Issue:** Four plant selectors distinguished their members by the *presence or absence of the marker field* — a property that stops existing. Patching them to key on some other mechanism would have reproduced the same fragility.
- **Fix:** Every selector now names a property intrinsic to the LITERAL: a digit for the published product-name spellings, a space for the enumerated comprehension phrasings. Both are pinned by identity assertions, and a new key-set assertion over all 22 members reds on ANY third property whatever it is named.
- **Verification:** `scripts/check-banned-claims.test.ts` 82/82; the selection case pins `ASD-STE100`, `Simplified Technical English`, `token economy`, `improves comprehension`, and `["comprehension","understand"]`.
- **Committed in:** `e6515d6`.

**Total deviations:** 3 (2 × Rule 3, 1 × Rule 1). **Impact:** no scope creep on the matcher, the literals, the exemption region or any byte ceiling. Deviations 1 and 2 are ordering consequences of the plan's own design; deviation 3 is a latent fragility the deletion exposed and closed.

---

## Issues Encountered

**A disposition row whose `file` cell is a code span silently matches nothing.** The first version of `docs/audit/29-style-dispositions/29-44.md` wrote the path as `` `agent-factory/roles/incident-responder.md` ``, following the form used by `29-12.md`. The gate still reported both clauses undispositioned. `rowMatches` compares `row.file !== c.file` with **no backtick stripping**, while `ChangedClause.file` is a bare path — so a code-span cell can never match. Fixed here by using the bare path (which is the dominant form in the directory), and **escalated below** rather than absorbed.

---

## Residuals observed but NOT closed by this plan

### R1. 30 disposition rows can never match, because their `file` cell is a code span

- **Address:** `scripts/check-diff-disposition.ts` `rowMatches()` — `if (row.file !== c.file) return false;` — against `readDispositionRows`'s `file: cells[0]`, which keeps the cell verbatim.
- **Measured, this session:** 1535 rows read under `## Dispositions` across the directory; **30** carry a code-span `file` cell, **all in `docs/audit/29-style-dispositions/29-12.md`**. They are inert today only because the gate's recorded base (`4d2b8f0`) post-dates 29-12, so none of their clauses is in the diff window.
- **Direction: FAIL-CLOSED.** An unmatched row makes its clause report as *undispositioned*, so the gate over-reports and never under-reports. The cost is the IN-01 silence one level up: the author is sent to write a disposition row they have already written.
- **Live count: 30.**
- **Remedy:** strip the code span in the reader, at the one place `file` is read, or normalize both sides through the same expression. **Never** loosen the comparison itself.
- **Not fixed here:** it is outside this plan's `files_modified` and belongs to whoever owns `check-diff-disposition.ts` in this round.

### R2. `CHANGELOG.md:67` still reads "sharper-per-token" — carried forward from 29-43, unmoved

Opened by plan 29-43 and **not touched by this plan**. It is outside `BANNED_CLAIM_LITERALS`, so the gate does not flag it. **Direction: fail-open. Live count: 1.** Remedy unchanged: either admit a literal for that shape with its own measurement, or rewrite the phrase — never weaken anything. Re-confirmed live at HEAD.

### R3. Three round-5 residuals had their SUBJECT removed by this deletion

`V-29-42-01` (a claim split across a hard wrap), `V-29-42-02` (a markdown table row puts two cells on one physical line) and `V-29-42-04` (a marker inside an HTML comment or a link target) all describe the **co-occurrence window**, each measured at 0 live. There is no co-occurrence window any more, so all three are **moot by construction rather than closed by an argument**. Recorded at the member's declaration in source and handed to plan 29-47's reconciliation — a residual that quietly stops appearing is indistinguishable from one nobody checked. The line-oriented residual the module header records for EVERY literal is unaffected and still stands.

---

## Known Stubs

None. No hardcoded empty value, placeholder or unwired data source was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary. `T-29-44-SC` is discharged by asserted absence: `package.json` and `package-lock.json` are byte-unchanged across the whole plan.

## Next Phase Readiness

- **Plan 29-45** owns: the repurposing of the eight vacuous cases named above; the durable published-breakdown mechanism (WR-01); and the WR-06 disposition record.
- **Plan 29-47** owns: the twelve-row reconciliation, which must carry (a) CR-02's five plants as CLOSED BY DELETION with no surviving `V-` id, (b) WR-06 as DISCHARGED BY DELETION, (c) the two deleted lists' measurement history transcribed above, (d) `V-29-44-01`'s register entry in the §3.x shape, and (e) R1 and R3 above.
- **The corpus, the literal list and both exemption pins as this plan leaves them:** 115 documents, 22 literals across 3 groups all unconditional, `BANNED_CLAIM_EXEMPT_SUPPRESSED` 14, `BANNED_CLAIM_EXEMPT_EXTENT` 62.

## Self-Check: PASSED

Created/modified files verified present:

```
FOUND: scripts/check-banned-claims.ts
FOUND: scripts/check-banned-claims.js
FOUND: scripts/check-banned-claims.test.ts
FOUND: agent-factory/roles/incident-responder.md
FOUND: docs/audit/29-style-dispositions/29-44.md
```

Commits verified present in `git log`:

```
FOUND: e6515d6  fix(29-44): the conditional apparatus DELETED at all four addresses (CR-02, D-48/D-53)
FOUND: 022a4ea  fix(29-44): the one false red paid in prose; the pins that moved, derived
FOUND: b97808c  fix(29-44): no paragraph claims a closure the gate does not have (D-52, WR-05)
```

Gate `.js` sha256 at HEAD: `71cbf1aacaa6cbb5200085e807a3d0b4e578b34b595d62fa5120f634f12b9454`.

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-17*

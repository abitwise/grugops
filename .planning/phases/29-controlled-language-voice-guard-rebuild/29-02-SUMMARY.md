---
phase: 29-controlled-language-voice-guard-rebuild
plan: 02
subsystem: docs
tags: [controlled-language, guards, claims, typescript, honesty-floor, ip]

requires:
  - phase: 28-kit-consistency-audit
    provides: "the check-public-docs-vocabulary.ts standalone-gate + synthesized-mirror house form, the D-24 RED-before-GREEN discipline, docs/audit/28-claim-registry.md and its anchor/bijection gate, and the dead-vocabulary.ts one-list admission test"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 01
    provides: "scripts/vacuity.ts reportMeasured — the shared element-level AP-1 rule this gate folds through instead of declaring a fourth zero check"
provides:
  - "agent-factory/writing-profile.md — the grugops-authored, derived writing profile: 10 id-bearing rules marked decidable or advisory, a derived Technical Names and Verbs section, the D-16 surface split, three recorded rejections, and the byte-exact `## Disclaimer and honesty floor` section"
  - "guard_banned_claims (scripts/check-banned-claims.ts) — 20 pinned literals in 3 groups over 82 derived documents, one named exemption region asserted two-sided, watched RED on a real claim in a real file"
  - "BANNED_CLAIM_LITERALS, CONFORMANCE_VERB_MARKERS, BANNED_CLAIM_EXCLUDED, BANNED_CLAIM_SCAN_PARTS, BANNED_CLAIM_SCAN_COUNT, BANNED_CLAIM_EXEMPT_REGION, BANNED_CLAIM_EXCLUDED_LOCATIONS"
  - "the npm script check:banned-claims and one bare CI invocation with the four-part house comment"
  - "claim registry rows C-28-039..C-28-042 — the profile's own four falsifiable claims, byte-anchored"
  - "the D-11 rename and the D-34 honesty-floor softening, landed across all three live planning documents in one pass"
affects: [29-03, 29-05, 29-06, 29-07, 29-08, 29-09, 29-10, 29-11, 29-12, 29-13, 30]

actuals:
  tokens: 32504
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "A conditional literal declared as a data property (requiresOnSameLine) rather than a second matching path — the pair is what is pinned, not a widened pattern"
    - "The admission log lives in source as an exported array: every REFUSED candidate with its measured hit count and its reason"
    - "A deduped two-part scan set whose overlap is REPORTED in the PASS line rather than subtracted silently"
    - "An exemption region asserted UP FRONT, so a vanished exemption FILE is a named failure rather than a skipped refusal"
    - "Plants selected from the authority BY PROPERTY, with a throwing non-vacuity check on the selection itself"

key-files:
  created:
    - agent-factory/writing-profile.md
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
  modified:
    - agent-factory/README.md
    - agent-factory/workflows/18-context-compaction.md
    - docs/audit/28-claim-registry.md
    - scripts/audit-model.ts
    - scripts/audit-model.js
    - scripts/audit-model.test.ts
    - scripts/check-claim-anchors.test.ts
    - package.json
    - .github/workflows/ci.yml
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/PROJECT.md

key-decisions:
  - "D-44 executed as four steps, and step four is the durable one: plant the claim, land the gate RED, delete the claim to GREEN, keep a hermetic fixture that plants it forever"
  - "The bare discipline name is CONDITIONAL on a conformance verb; the product-name spellings are unconditional — banning the discipline's name outright would make the disclaimer's own denial illegal"
  - "docs/ and .planning/ excluded with the reason stated inline: the claim registry quotes public sentences verbatim by design, so scanning it would report the registry for holding the text it exists to hold"
  - "The decidable/advisory claim was REWORDED to be true today rather than registered `overstated` with a deferral — a row is `true` because the sentence is true"
  - "The profile's four rows are `kind: architecture`: no SAFETY_FLOORS member holds an honesty claim, and `depends_on` may only name a floor (the same adjudication C-28-015 already carries)"
  - "LANG-01 and LANG-04 left Pending — both are also claimed by plan 29-03 and LANG-04 by five corpus plans; marking them here would be a fabricated completion"

patterns-established:
  - "A candidate literal is measured against the WHOLE scan set before admission, and a rejection is recorded with its hit count — an absent literal otherwise reads to the next editor as an oversight"
  - "A gate's own RED transcript records which findings were PLANTED and which were already there; the unplanted ones are what make the red evidence rather than theatre"
  - "A derived set-literal pin moves only because the set GREW, and the comment says so — never to clear a property failure"

requirements-completed: []

coverage:
  - id: D1
    description: "The kit ships a grugops-authored, derived writing profile with 10 id-bearing rules marked decidable or advisory, a derived Technical Names and Verbs section, the stated surface split, three recorded rejections, and a non-affiliation and not-certified disclaimer reproducing no specification text (LANG-01, partial — 29-03 lands the two guards the decidable subset names)"
    requirement: "LANG-01"
    verification:
      - kind: other
        ref: "measured on the document: `grep -c '^## Disclaimer and honesty floor$'` = 1; `grep -oE 'WP-[0-9]{2}' | sort -u` = WP-01..WP-10 contiguous; `grep -cE 'WP-[0-9]{2}.*(decidable|advisory)'` = 10; `grep -c 'UNKNOWN - verify'` = 3; `grep -c '65 writing rules'` = 0"
        status: pass
      - kind: integration
        ref: "node scripts/check-kit-refs.js, check-nul-bytes.js, validate-agent-factory.js — all exit 0 with the new document in the tree"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/check-kit-refs.test.ts — 13 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "guard_banned_claims makes the conformance, token-economy and comprehension prohibitions mechanical, was watched failing on a real claim in a real file, and stays non-vacuous through a planted hermetic fixture (LANG-04, partial — the decidable-subset half is 29-03)"
    requirement: "LANG-04"
    verification:
      - kind: integration
        ref: "the D-44 transition: exit 1 with 3 findings over 82 documents at 20982a0, exit 0 at 0fafbaf, gate blob SHA identical on both sides (transcript below)"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts — 26 cases, including the planted-claim RED, the region-scoped GREEN, the paired plant, the per-part zero floors on BOTH parts, the short-count and grew-by-one pins, and the two adjacency cases"
        status: pass
      - kind: other
        ref: "falsifiability: three scratch builds of the wrong predicate, each asserted to have applied, each turning EXACTLY its own cases RED (transcript below)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Exactly one named exemption region exists, declared as a file-section-reason triple, asserted two-sided for existence and non-emptiness, and proven to discriminate rather than merely to exist"
    verification:
      - kind: unit
        ref: "check-banned-claims.test.ts — duplicated heading, missing heading, empty region, vanished FILE, region-ends-at-next-heading, and the PAIRED PLANT that puts one sentence on both sides of the heading and requires exactly one finding"
        status: pass
      - kind: other
        ref: "scratch build making the exemption FILE-scoped turns exactly the 3 region cases RED and moves nothing else"
        status: pass
    human_judgment: false
  - id: D4
    description: "The profile's own falsifiable claims carry registry ids with byte-exact anchors, and the bijection gate is green at a count above 38"
    verification:
      - kind: integration
        ref: "node scripts/check-claim-anchors.js — 42 rows, 42 verbatim comparisons, all byte-identical; node scripts/check-audit-register.js exit 0"
        status: pass
      - kind: other
        ref: "npm run generate:safety-surface leaves docs/audit/28-safety-surface-exclusions.md byte-unchanged at 41 entries — no new row carries kind: safety"
        status: pass
    human_judgment: false
  - id: D5
    description: "The placeholder guard name and the unevidenced token-count assertion are gone from every live planning document, and the historical record is untouched"
    verification:
      - kind: other
        ref: "`git grep -c guard_ste` returns nothing for REQUIREMENTS.md, ROADMAP.md and PROJECT.md, and is unchanged at 3/7/3/9/5 across 29-CONTEXT.md and the four .planning/research/ files"
        status: pass
      - kind: other
        ref: "`grep -c 'UNKNOWN - verify' .planning/REQUIREMENTS.md` 6 → 7; `grep -c 'disproven on this artifact'` = 1 (the measured half survives the softening)"
        status: pass
    human_judgment: false

duration: 38min
completed: 2026-08-13
status: complete
---

# Phase 29 Plan 02: The Writing Profile and the Banned-Claim Gate Summary

**The kit now ships a grugops-authored writing profile whose own four claims carry registry ids and byte-exact anchors, and a gate that refuses a conformance, token-economy or comprehension claim anywhere in 82 documents — landed RED on three findings, two of which nobody planted, because the kit was already claiming the caveman voice is a token economy.**

## Performance

- **Duration:** 38 min
- **Tasks:** 3
- **Commits:** 5
- **Files changed:** 16 (4 created, 12 modified)

## Accomplishments

- `agent-factory/writing-profile.md` (215 lines) enumerates ten rules `WP-01`..`WP-10`, each marked
  `decidable` or `advisory`, with the two-limit adjacency rule stated as its own clause rather than
  left for a reader to assume a merge.
- The Technical Names and Verbs set is stated **by command and enumerated nowhere**. Measured: the
  document contains zero of the 17 role display names and zero of the 19 workflow display names.
- Three deliberate omissions recorded with their reasons — passive voice, the general dictionary,
  and D-17's rejected runtime style check on the verify-before-write seam.
- `guard_banned_claims` folds through plan 29-01's `reportMeasured` and declares no zero check of
  its own. 20 pinned literals across 3 groups, exactly 1 conditional, over a two-part deduped scan
  set pinned two-sided at 82.
- The admission log is **in source**: four refused candidates with their measured hit counts,
  including one refused without measurement because `ste` is a substring of `system`.
- Registry rows `C-28-039`..`C-28-042` bring the bijection to 42 rows and 42 byte-identical
  comparisons.
- The placeholder guard name and the unevidenced token-count assertion are gone from all three live
  planning documents, and untouched in the historical record.

## Verbatim evidence

### The D-44 RED transcript

`node scripts/check-banned-claims.js`, tree at `15d7ee3`, 2026-08-13 — **exit code 1**:

```
[guard_banned_claims] the shipped kit and the public documents carry no conformance, token-economy or comprehension claim, outside one named exemption region (LANG-04 / D-29, D-44)
  FAIL  banned claims: 3 finding(s) over 82 elements
        agent-factory/workflows/18-context-compaction.md:27:231 — banned token-economy literal "token-economy" — "- **The agent compresses note _bodies_** — the semantic judgment. The agent reads its verbose local trajectory and writes the terse gist, collapsing the narrative prose of note bodies. This is the role's intelligence (the caveman token-economy applied to memory): keep the load-bearing constraint, drop the restatement."
        Remedy: delete the claim. Do NOT add an exemption and do NOT narrow the scan set: there is exactly one named exemption region and BANNED_CLAIM_SCAN_COUNT is two-sided pinned, precisely so neither route to green is available
        agent-factory/writing-profile.md:32:29 — banned standard-name literal "ASD-STE100" — "The grugops kit conforms to ASD-STE100 Simplified Technical English."
        Remedy: delete the claim. Do NOT add an exemption and do NOT narrow the scan set: there is exactly one named exemption region and BANNED_CLAIM_SCAN_COUNT is two-sided pinned, precisely so neither route to green is available
        agent-factory/writing-profile.md:32:40 — banned standard-name literal "Simplified Technical English" — "The grugops kit conforms to ASD-STE100 Simplified Technical English."
        Remedy: delete the claim. Do NOT add an exemption and do NOT narrow the scan set: there is exactly one named exemption region and BANNED_CLAIM_SCAN_COUNT is two-sided pinned, precisely so neither route to green is available

== Result ==
1 CHECK(S) FAILED
```

**Three findings, and only one of them was planted.** `agent-factory/writing-profile.md:32` is Task
1's deliberate draft claim. `agent-factory/workflows/18-context-compaction.md:27` was **already
shipping**: the kit called the caveman voice *"a token-economy applied to memory"*, which project
measurement on 2026-07-28 disproved on this artifact — the fenced blocks restate rather than
compress. That is the drift this gate exists for, caught on its first run, and it is what makes the
RED evidence rather than theatre.

The third finding demonstrates the conditional arm and the adjacency rule at once: two banned
literals sit adjacently on **one line** at columns 29 and 40, and produce **two findings**, because
the hit count is arithmetic over what was read.

### The GREEN PASS line

`node scripts/check-banned-claims.js`, tree at `0fafbaf` — **exit code 0**:

```
[guard_banned_claims] the shipped kit and the public documents carry no conformance, token-economy or comprehension claim, outside one named exemption region (LANG-04 / D-29, D-44)
  PASS  banned claims: 0 findings over 82/82 elements
  PASS  LANG-04: 82 document(s) carry zero banned claim literal outside the one named exemption region — kit 73, publicDocs 10, overlap 1; 20 pinned literal(s) across 3 group(s), of which 1 is conditional on a conformance verb from 6 pinned marker(s); 1 exemption region (agent-factory/writing-profile.md § ## Disclaimer and honesty floor — the disclaimer must be able to name the standard, and to quote a claim form, in order to deny both — a prohibition that makes its own denial illegal is unwritable); 4 candidate literal(s) refused at admission and recorded with their hit counts

== Result ==
ALL CHECKS PASSED
```

### The gate is byte-unchanged across the transition

`git diff --stat 20982a0 0fafbaf`:

```
 agent-factory/workflows/18-context-compaction.md | 2 +-
 agent-factory/writing-profile.md                 | 6 ------
 2 files changed, 1 insertion(+), 7 deletions(-)
```

`git diff --name-only 20982a0 0fafbaf -- scripts/check-banned-claims.ts scripts/check-banned-claims.js`
returns **nothing**. Proven at the blob level rather than by the absence of a diff line:

| artifact | blob at RED (`20982a0`) | blob at GREEN (`0fafbaf`) |
|---|---|---|
| `scripts/check-banned-claims.ts` | `c490fdea2fca7a9094a7a2c0705ecbd2b7120153` | `c490fdea2fca7a9094a7a2c0705ecbd2b7120153` |
| `scripts/check-banned-claims.js` | `4580b34ed82fcfe1ec8961907af1bc1c970d53b5` | `4580b34ed82fcfe1ec8961907af1bc1c970d53b5` |

The gate did not move. The documents did.

### The literal-set admission log

Every candidate was run against the whole 81-document scan set (the pre-profile tree) before it was
admitted. The rule, quoted from `scripts/dead-vocabulary.ts:50-51`: *"if going green would require
deleting correct text, the literal does not belong in this file."*

**Admitted — group 1, the standard's name (7 members):**

| candidate | hits | note |
|---|---:|---|
| `ASD-STE100` | 0 | unconditional |
| `ASD-STE 100` | 0 | unconditional |
| `ASD STE100` | 0 | unconditional |
| `ASD STE 100` | 0 | unconditional |
| `ASDSTE100` | 0 | unconditional |
| `STE-100` | 0 | unconditional |
| `Simplified Technical English` | 0 | **conditional** on a conformance verb stem on the same line |

**Admitted — group 2, the token-economy win (7 members):**

| candidate | hits | note |
|---|---:|---|
| `token economy` | 0 | |
| `token-economy` | **1** | `agent-factory/workflows/18-context-compaction.md:27` — a claim measurement DISPROVED, not correct text. Deleted at `0fafbaf`. |
| `fewer tokens` | 0 | |
| `token savings` | 0 | |
| `saves tokens` | 0 | |
| `reduces token count` | 0 | |
| `lowers token count` | 0 | |

**Admitted — group 3, the comprehension benefit (6 members):**

| candidate | hits |
|---|---:|
| `improves comprehension` | 0 |
| `improve comprehension` | 0 |
| `comprehension benefit` | 0 |
| `easier for the model to understand` | 0 |
| `easier for a language model to understand` | 0 |
| `better understood by the model` | 0 |

**Refused, with the measurement that refused them** (recorded in `BANNED_CLAIM_EXCLUDED`):

| candidate | hits | why it was refused |
|---|---:|---|
| `token count` | 0 | zero hits today, but the honest hedge this project must be able to write is *"its effect on token count is `UNKNOWN - verify` in both directions"*. Banning the topic leaves only the claim-shaped alternatives. |
| `token win` | **1** | `18-context-compaction.md:43` — *"Maximum token win"*, which is TRUE and is not a controlled-language claim: the `aggressive` dial transmits the compact gist instead of the raw trajectory, so it genuinely sends less text. |
| `conformance` / `compliant` / `certified` / `endorsed` / `approved`, bare | **150** | 2 + 60 + 18 + 2 + 70 across compliance-regime documentation, ASVS certification rows, release-approval steps, and the README's own non-affiliation disclaimer. They survive only as co-occurrence markers for the one conditional literal. |
| `STE`, bare | *not measured* | refused without measurement, and the reason is arithmetic: `ste` is a substring of `system`. A case-insensitive substring test would report a finding on every occurrence of the most common noun in this repository. |

**Also measured and not admitted for the same reason:** `tokens` (50 hits), `comprehension` (0 hits
but a bare topic word), `easier to parse`, `machines read`, `understand better`.

### The falsifiability proof

A green suite is not proof for a safety guard (project memory:
`grugops-safety-invariant-green-suite-insufficient`). Three scratch builds of the **wrong** predicate
were run against the same fixtures, each asserted to have applied before it was run and each
restored to a byte-identical copy afterwards:

| mutation applied to the committed `.js` | result |
|---|---|
| `i >= region.headingAt && i < region.endBefore` → `true` (exemption becomes FILE-scoped) | **exactly 3 cases RED** — the profile-preamble plant, the PAIRED PLANT, and the region-ends-at-next-heading case. 23 passed. |
| `if (member.requiresOnSameLine !== undefined && …` → `if (false && …` (conditional becomes unconditional) | **exactly 1 case RED** — the bare-name control. 25 passed. |
| `i = haystackLower.indexOf(needleLower, i + …)` → `i = -1` (first hit per line only) | **exactly 1 case RED** — the repeat-literal adjacency case. 25 passed. |

Each mutation falsifies exactly the cases that hold its predicate and nothing else, which is what
makes each case load-bearing rather than decorative.

### The new registry ids

| id | file | line | kind | status | what it registers |
|---|---|---|---|---|---|
| `C-28-039` | `agent-factory/writing-profile.md` | 158-164 | architecture | true | the profile is grugops-authored, derived not copied, and reproduces neither the specification text nor the controlled dictionary; four denials |
| `C-28-040` | `agent-factory/writing-profile.md` | 94-96 | architecture | true | the Technical Names set is derived, never listed |
| `C-28-041` | `agent-factory/writing-profile.md` | 32-37 | architecture | true | each rule's decidable/advisory mark, and exactly what the mark promises |
| `C-28-042` | `agent-factory/writing-profile.md` | 175-179 | architecture | true | no conformance, token-economy or comprehension claim is made, and `guard_banned_claims` holds all three |

`node scripts/check-claim-anchors.js` — exit 0:

```
  PASS  42 registry row(s) — 41 markdown, 1 unanchorable (a non-markdown file cannot carry an HTML comment, so its POSITION is unheld; its verbatim text is still PRESENCE-checked against the file's bytes); anchors found: AGENTS.md 11, README.md 9, agent-factory/README.md 17, agent-factory/writing-profile.md 4; 42 verbatim comparison(s) performed, all byte-identical; all 4 safety floor(s) mapped
```

The verbatim blocks were **sliced from the file by script, never retyped** — the anchor comparison
applies no normalization, so a retyped smart quote would be a red (D-33).

Registry composition after the addition: 42 rows — safety 6, architecture 28, install 8; status
`true` 33, `overstated` 9, `false` 0. Line forms: 19 single values, 23 ranges (was 19/19 at 38 rows).

### Before and after — every planning-document edit

**1. `.planning/REQUIREMENTS.md` — the honesty floor (D-34).**

Before:

```
- STE **increases** token count (its rules forbid the telegraphic omission caveman relies on). Controlled language is justified on determinism and one-term-per-concept grounds, never as a token-economy win.
```

After:

```
- The writing profile is justified on **determinism and one-term-per-concept** grounds. Its effect on token count is **`UNKNOWN - verify`** in both directions and no study was located; the only quantitative source found is a vendor page whose figure runs *opposite* to this bullet's earlier assertion and whose studies are unidentified, so it supports nothing. The profile does **not** govern the fenced caveman blocks, whose measured article density (5.5%) is already *below* the governed corpus's (11.4%), so no article-restoration cost applies to them. Growth on the governed corpus comes from sentence splitting, and **it is measured and recorded per file rather than assumed** (D-28). This bullet previously asserted *"STE increases token count"* as fact while the ROADMAP hedged it and prior research recorded it unknown — three confidence levels for one unevidenced claim, with a stated reasoning that targeted a surface LANG-02 explicitly excludes. Softened here, with every measured half kept.
```

The adjacent comprehension bullet and the `disproven on this artifact` bullet are **unchanged** —
they were already correct.

**2. `.planning/REQUIREMENTS.md` — LANG-07 (D-11 rename).**

Before:

```
- [x] **LANG-07**: `guard_ste` and the rebuilt voice guard share **one** fence parser — never two grammars over the same bytes.
```

After:

```
- [x] **LANG-07**: `guard_imperative_lexicon` (with its sibling `guard_sentence_form`) and the rebuilt voice guard share **one** fence parser — never two grammars over the same bytes.
```

**3. `.planning/REQUIREMENTS.md` — LANG-04 gains the chosen names.** LANG-04 never contained the
placeholder token; the edit it needed was to give its *"named for that subset"* test a subject. The
sentence above is unchanged; this is appended:

```
The chosen names are `guard_imperative_lexicon` (lexicon membership at imperative position) and `guard_sentence_form` (sentence length and banned constructions) — two predicates, two names, because naming one guard for three unrelated predicates re-creates the `guard_caveman_preserved` defect at the output line. The conformance prohibition itself is mechanical, held by `guard_banned_claims`.
```

**4. `.planning/ROADMAP.md` — Phase 29 success criterion 3.**

Before:

```
  3. The guard is **named for the decidable subset it checks** — lexicon membership, sentence length, banned constructions — and nowhere in the kit is ASD-STE100 conformance claimed, nor a token-economy win, nor an LLM-comprehension benefit (that one stays `UNKNOWN - verify`). (LANG-04)
```

After:

```
  3. The guards are **named for the decidable subsets they check** — `guard_imperative_lexicon` for lexicon membership at imperative position and `guard_sentence_form` for sentence length and banned constructions — and nowhere in the kit is ASD-STE100 conformance claimed, nor a token-economy win, nor an LLM-comprehension benefit (that one stays `UNKNOWN - verify`); `guard_banned_claims` holds that prohibition mechanically rather than by discipline. (LANG-04)
```

**5. `.planning/ROADMAP.md` — the Phase 29 honesty floor (D-34).**

Before:

```
**Honesty floor for this phase:** STE likely *increases* token count (its rules forbid the telegraphic omission caveman relies on). The profile is justified on determinism and one-term-per-concept grounds only. Caveman-as-token-economy is disproven on this artifact and must not be restated.
```

After:

```
**Honesty floor for this phase:** the profile is justified on determinism and one-term-per-concept grounds. Its effect on token count is **`UNKNOWN - verify`** in both directions and no study was located in either direction. Caveman-as-token-economy is **disproven on this artifact by measurement** and must not be restated. The profile does not govern the fenced caveman blocks, whose article density is already below the governed corpus's, so no article-restoration cost applies to them. The growth this phase produces is measured and recorded (D-28), and a later phase reasons from that measurement rather than from an estimate written before it. There is no evidence that controlled language improves comprehension for a language model, and the kit does not ship that claim.
```

**6. `.planning/PROJECT.md` line 40 (D-11 rename).**

Before:

```
New `guard_ste`.
```

After:

```
New `guard_imperative_lexicon` and `guard_sentence_form` for the decidable subset, plus `guard_banned_claims` holding the conformance prohibition mechanically.
```

**Untouched, deliberately.** `git grep -c guard_ste` is unchanged in the historical record —
`29-CONTEXT.md` 3, `.planning/research/FEATURES.md` 7, `PITFALLS.md` 3, `STACK.md` 9, `SUMMARY.md` 5.
The record of a decision has to keep the old name to be readable.

### Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-banned-claims.js` | **exit 0** — 82/82 documents, 0 findings |
| `npm run build` / `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **46** committed `.js` pairs (45 + `check-banned-claims`) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **49 files, 1,669 passed, 2 skipped** (baseline 48 / 1,643 / 2) |
| `node scripts/check-claim-anchors.js` | exit 0 — 42 rows, 42 comparisons |
| `node scripts/check-audit-register.js` | exit 0 |
| `node scripts/check-kit-refs.js` / `check-nul-bytes.js` / `check-public-docs-vocabulary.js` / `check-uat-oracles.js` / `validate-agent-factory.js` | exit 0 |
| `node scripts/check-foundation-guards.js` | **exit 1 — the 29-01 baseline, unchanged**: exactly `caveman voice` 17/17 and `role clause uniqueness` 12 |
| `npm run generate:safety-surface` | 41 entries, working tree clean — no new `kind: safety` row |
| scan-set cardinality | 82 = kit 73 + publicDocs 10 − overlap 1 |
| gate wall clock over the 89 KB generated checklist and 81 other files | **< 0.1 s** (T-29-12 recorded as accept; measured, not assumed) |

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The kit was already shipping a disproven token-economy claim**

- **Found during:** Task 2, the first run of the gate.
- **Issue:** `agent-factory/workflows/18-context-compaction.md:27` described the note-body
  compression as *"the caveman token-economy applied to memory"*. Project measurement on 2026-07-28
  disproved caveman-as-token-economy on this artifact — the fenced blocks restate rather than
  compress — and REQUIREMENTS.md already records that. LANG-04 forbids a token-economy win claim
  *anywhere in the shipped kit*, so the gate could not be green with it standing.
- **Fix:** the parenthetical is **deleted**, not replaced. Substituting a new mechanism claim would
  trade a disproven assertion for an unmeasured one, which is the same act class.
- **Files modified:** `agent-factory/workflows/18-context-compaction.md`.
- **Commit:** `0fafbaf`
- **Note on LANG-03:** the file is on the safety-surface exclusion list, which forbids **a style
  pass** from rewording it. This is not a style pass; it is the deletion of a false claim, made
  deliberately and recorded here rather than absorbed.

**2. [Rule 2 — Missing critical functionality] A vanished exemption FILE was a silent skip**

- **Found during:** Task 2, writing the hermetic fixtures.
- **Issue:** the exemption-region assertion ran inside the scan loop, so it could only fire while
  the exempt file was still a member of the scan. Deleting `agent-factory/writing-profile.md`
  outright skipped **every** one of its refusals, and the only survivor was the aggregate pin —
  which says *"one document short"* and never says which document, or that the disclaimer the whole
  prohibition depends on is gone.
- **Fix:** the region is located and asserted **up front**, from an explicit `existsSync` on the
  named file, before the scan loop runs. The loop reuses the computed region. A missing exemption
  document is now a FAIL that names the file and its reason.
- **Files modified:** `scripts/check-banned-claims.ts`.
- **Commit:** `9d6fdfe` (with the case `FAILS BY NAME when the exemption DOCUMENT is gone`)

**3. [Rule 2 — Missing critical functionality] A second, narrower residual was unrecorded**

- **Found during:** Task 2, adversarial review of the predicate.
- **Issue:** matching is line-oriented, so a pinned literal hard-wrapped across a line boundary is
  not matched. Letting a green run imply otherwise is the exact class this gate exists to prevent.
- **Fix:** recorded in the gate's header beside the primary residual, together with the reason the
  answer is **not** to normalize whitespace before comparing — that would make the comparison
  inexact for every literal in order to reach one wrapping.
- **Files modified:** `scripts/check-banned-claims.ts`, `agent-factory/writing-profile.md`.
- **Commit:** `9d6fdfe`

**4. [Rule 1 — Bug] The derived isEntry-guard set pin was one short**

- **Found during:** Task 2, the full suite run.
- **Issue:** `scripts/check-claim-anchors.test.ts` derives the set of `scripts/` sources declaring
  an `isEntry` guard and pins its cardinality two-sided at 7. The new gate made it 8.
- **Fix:** the pin moves 7 → 8 with a comment recording **why**: the set GREW by the mechanism the
  block exists for — the new gate joined the assertion by existing, and its property assertion
  passed on the first run. The comment states explicitly that if the property assertion had failed,
  the fix would have been the new gate's entry guard and not this number.
- **Files modified:** `scripts/check-claim-anchors.test.ts`.
- **Commit:** `9d6fdfe`

**5. [Rule 1 — Bug] Two count comments went stale the moment the registry grew**

- **Found during:** Task 3.
- **Issue:** `scripts/audit-model.ts:846` and `scripts/audit-model.test.ts:903` both stated
  *"38 rows carry 19 single values and 19 ranges"*.
- **Fix:** **re-measured**, not adjusted — 42 rows, 19 single and 23 ranges — with the 2026-08-12
  figures kept beside them so the change reads as a measurement rather than an edit.
- **Files modified:** `scripts/audit-model.ts`, `.js`, `.test.ts`.
- **Commit:** `60a0812`

### Plan-order and scope deviations

**The ROADMAP `guard_ste` occurrence the plan expected was already gone.** 29-RESEARCH §B-4 listed
three live sites; `ROADMAP.md:481` had already been rewritten to the shipped names when the phase
plan was authored at `d7cc4f6`. Only `REQUIREMENTS.md:85` and `PROJECT.md:40` still carried it. The
ROADMAP edit that *was* needed is criterion 3, which had no name at all — recorded above as edit 4.

**One claim was reworded rather than registered `overstated`.** The plan's registry list included
*"the decidable subset is exactly what the two guards check"*. That sentence asserts a check by two
guards which do not exist until plan 29-03, so registering it as written would have shipped a
knowingly-false sentence with a deferral attached. It was instead rephrased to state which rules are
**gateable**, and to say outright that the two guards land later in this same phase. The row is
`true` because the sentence is true, not because the row says so.

**No `kind: safety` row was added, so the safety-surface generator was a no-op.** The four claims
are honesty claims about the profile's own construction, and `depends_on` may only name a member of
`SAFETY_FLOORS` — none of the four floors holds an honesty claim. `kind: architecture` is the same
adjudication C-28-015 already carries for the kit-write rule, and it carries the same consequence,
recorded rather than papered over: **Phase 30's claim-dropping filters to `kind: safety` and will
therefore not reach these four rows.**

### Requirement marking

`requirements-completed` is deliberately **empty**. `LANG-01` is also claimed by plan 29-03 (which
lands the two guards the profile's decidable subset names) and `LANG-04` by 29-03 and by all five
corpus-rewrite plans 29-08..29-12. Marking either complete here would be the same fabricated
completion plan 29-01 caught and reverted for LANG-05 and LANG-06.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. The one
deliberate placeholder — the D-44 draft conformance sentence — existed for exactly two commits by
design and is gone, proven by the gate exiting 0 over a scan set that includes the file that held it.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — a brand-new conformance claim written without any pinned literal is not
  mechanically detectable.** No grep recognizes an assertive sentence written in new words. Recorded
  in `scripts/check-banned-claims.ts`'s header and in the profile's own prose. A green run says what
  the gate measured and nothing wider. (T-29-11, disposition `accept`.)
- **`UNKNOWN - verify` — a pinned literal hard-wrapped across a line boundary is not matched.** The
  answer is deliberately not to normalize whitespace before comparing.
- **`UNKNOWN - verify` — the reported EU trademark registration for ASD-STE100.** Recorded in the
  profile's disclaimer as a third-party report and asserted nowhere.
- **`UNKNOWN - verify` — the profile's effect on token count, in both directions.** No study was
  located; the only quantitative source found runs opposite to this project's former assumption and
  is a vendor page with unidentified studies.
- **The exact current wording of the ASD-STE100 specification notice page is second-hand.** The
  primary PDF forbids extraction — `Permission Error: Copying of text from this document is not
  allowed.` — and no attempt was made to bypass it. The profile cites only widely published facts
  about the standard.
- **Phase 30's claim-dropping will not reach C-28-039..C-28-042**, because it filters to
  `kind: safety`. Stated above with its reason.

## Threat Flags

None beyond the plan's own register. This plan installs zero packages (`git diff bc27573..HEAD --
package.json` adds one `scripts` entry and no dependency), adds no network path and no write path;
`scripts/check-banned-claims.ts` is strictly read-only and Node-stdlib-only. T-29-12 (scan cost over
the 89 KB generated checklist) was measured rather than assumed: the whole gate runs in under 0.1 s
with no backtracking construct anywhere in it — every match is a literal `indexOf`.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: agent-factory/writing-profile.md
FOUND: scripts/check-banned-claims.ts
FOUND: scripts/check-banned-claims.js
FOUND: scripts/check-banned-claims.test.ts
```

Commits claimed, verified in `git log`:

```
FOUND: 15d7ee3  docs(29-02): author the grugops writing profile, with the D-44 draft claim planted
FOUND: 20982a0  feat(29-02): guard_banned_claims, landed RED on a real claim in a real file
FOUND: 0fafbaf  fix(29-02): delete the two conformance/token-economy claims — guard_banned_claims turns GREEN
FOUND: 9d6fdfe  test(29-02): the durable D-44 fixture set, and wire guard_banned_claims at both ends
FOUND: 60a0812  docs(29-02): register the profile's four claims and correct the three live planning documents
```

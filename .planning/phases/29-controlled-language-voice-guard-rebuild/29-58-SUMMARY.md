---
phase: 29-controlled-language-voice-guard-rebuild
plan: 58
subsystem: testing
tags: [guard, lang-04, banned-claims, honesty-floor, claim-registry, frozen-block, residual-disclosure, typescript]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "`guard_banned_claims`'s published header and module docblock already narrowed to the decided predicate (plan 29-56, D-55); `V-29-57-01` opened with its direction, its derived reach and its live count (plan 29-57, D-56); `docs/audit/29-round8-residuals.md` §1 and §4"
provides:
  - "`C-28-042`'s mechanism sentence narrowed to the predicate the gate publishes — one physical line, a derived document set, a pinned literal list, outside the registry-anchored blocks of one named region — with the three denials byte-identical and the D-44 history clause kept"
  - "the two-file freeze demonstrated enforcing itself in BOTH unpaired directions on separate archive mirrors, each red naming `C-28-042`, with clean controls before and after"
  - "`C-28-042`'s registry `mechanism:` field re-derived: 82 -> 117 documents, 20 -> 22 literals, and the wrap residual reframed as `V-29-57-01`, OPEN and FAIL-OPEN, cited rather than restated"
  - "`V-29-58-01` — the enumeration axis given an id after deriving that no register had ever assigned it one, with a live count of `UNKNOWN - verify` BY CONSTRUCTION rather than a flattering 0"
  - "the honesty floor naming BOTH surviving axes with their directions and their ids, on unfrozen scanned lines that carry zero pinned literals per-line AND zero wrap-joined"
  - "`docs/audit/29-round8-residuals.md` §2 — nine watching gates, each answered by running its own derivation, with six deriving to nothing owed"
affects: [29-59, 29-60]

actuals:
  tokens: 8211
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "what a document owes is DERIVED by running each watching gate's own scan-set derivation and testing membership; an absence is recorded WITH the derivation that produced it, because a gate that does not watch and a gate nobody asked look identical afterwards"
    - "a pin's new value is read out of the gate's own refusal sentence on the PAIRED tree, never computed; the pins that did NOT fire in the same run are the independent confirmation of what the edit did not do"
    - "a residual disclosed in prose without an id cannot be rolled up or counted; the id is opened in the register, collision-checked, and only then referenced from shipped prose"

key-files:
  created: []
  modified:
    - agent-factory/writing-profile.md
    - docs/audit/28-claim-registry.md
    - docs/audit/29-round8-residuals.md
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js

key-decisions:
  - "D-55 applied at the third address. The kit's own honesty floor said the guard `holds all three prohibitions mechanically over the shipped kit and the public documents`. It now says the guard `decides one question about those three: whether any of its pinned literals appears on any single physical line of the document set it derives, outside the registry-anchored blocks of one named exemption region`. The disclaimer is no longer wider than the gate it cites."
  - "THE PLAN'S OWN PREMISE WAS ASSERTED AND FOUND FALSE. Plan 29-58 instructed the paragraph to name the enumeration axis `by the id round 7 gave it`. No round gave it one — rounds 4, 5, 6 and 7 all lack it; round 5 states the residual in prose BELOW `V-29-42-01`, which is the co-occurrence-window axis closed by construction in round 6. Rather than mint an id inside shipped prose with nothing behind it, `V-29-58-01` is OPENED in the register (§2.4), collision-checked at 0 files, and then referenced."
  - "`V-29-58-01`'s live count is `UNKNOWN - verify` BY CONSTRUCTION and deliberately NOT `0`. `V-29-57-01` earns a derived 0 because its shape is mechanically searchable. The complement of a 22-member enumeration is not a searchable set, so publishing `0` would print an unmeasured number in the format of a measurement — the exact move this phase's honesty floor exists to refuse."
  - "Six of nine watching gates derive to NOTHING OWED. The single companion obligation is `C-28-042`'s registry row, and it is mandatory and same-commit. No disposition row, no ceiling re-check and no regenerated list was created, because rows 1, 2 and 6 derived that none is owed — a companion created `just in case` is a set-literal waiting to rot."
  - "The extent pin moved twice and was read off the gate both times (66 -> 67 -> 75). Neither `BANNED_CLAIM_EXEMPT_SUPPRESSED` nor `BANNED_CLAIM_EXEMPT_COMPOSITION` fired in either run — that non-firing, not an assertion, is the evidence that twelve new lines of prose entered the carve-out carrying nothing for it to suppress."

patterns-established:
  - "Pattern: ask the gate, not the directory. `agent-factory/writing-profile.md` sits one directory above the watched corpus, so every `it is kit prose, therefore it owes a disposition row` inference is wrong. Nine derivations settle it in seconds and leave a record a later reader can re-run."
  - "Pattern: the pins that DIDN'T fire are evidence. A gate that reds on exactly one pin is telling you what else it measured and found unmoved. Reporting the silent pins converts a single red into a four-way confirmation."
  - "Pattern: do not use the axis you are disclosing. The paragraph naming the hard-wrap bypass was itself checked for wrap-joined pinned literals — 0 per-line hits and 0 wrap-joined-only hits — because a disclosure written across a wrap would be the funniest possible defect in this phase."

requirements-completed: []

coverage:
  - id: D1
    description: "The kit's own statement of what this guard holds asserts a strictly smaller set of facts than it did, and the same predicate the gate publishes."
    requirement: "LANG-04"
    verification:
      - kind: other
        ref: "before/after asserted-fact decomposition below; three before-facts have no after-counterpart, every after-fact is entailed by a before-fact, and the added clause is a RESTRICTION not an assertion"
        status: pass
      - kind: integration
        ref: "node scripts/check-banned-claims.js published header and the profile's new sentence quantify over the same three things (one physical line, a derived document set, a pinned literal list) and over nothing wider"
        status: pass
    human_judgment: true
    rationale: "Whether the after-list is a SUBSET is a reading of two English sentences, not a mechanical fact. The decomposition is printed in full so a reviewer can disagree with it. The mechanical halves — the denials byte-identical, the gate green, the pins unmoved — are separate and are not being asked to carry this."
  - id: D2
    description: "The prose and its frozen registry row cannot be committed apart, and that was watched enforcing itself in BOTH directions rather than asserted."
    requirement: "LANG-04"
    verification:
      - kind: integration
        ref: "M1 prose-only -> claim-anchors exit 1 + banned-claims exit 1, both naming C-28-042 (7 failures); M2 registry-only -> both exit 1, both naming C-28-042 (6 failures); M3 clean control -> both exit 0; M4 post-commit -> both exit 0. Four mirrors, none reused, gate sha256 shown equal to the repository on each"
        status: pass
      - kind: other
        ref: "git log --name-only over e848052..HEAD: commits touching exactly one of the two paths = 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every pin the edit moved was read off the gate's own refusal text with its cause named; every pin that did not move is shown unmoved rather than assumed."
    requirement: "LANG-04"
    verification:
      - kind: integration
        ref: "EXTENT 66->67 from `reaches 67 line(s) ... declares 66` (task 2) and 67->75 from `reaches 75 line(s) ... declares 67` (task 3); SUPPRESSED 14, COMPOSITION 8/2/4, ANCHORS 6, SCAN_COUNT 117, LITERALS 22 all quoted from the final tree's second PASS line and equal to the §2.2 baseline"
        status: pass
      - kind: other
        ref: "derived diff scope: 0 changed lines inside lineHits (2079..2088), countBannedClaimOccurrences (2096..2106), deriveExemptBlocks (1639..1793), locateExemptRegion (1423..1544); non-comment/non-pin changed lines = 0 across both commits"
        status: pass
    human_judgment: false
  - id: D4
    description: "The honesty floor names BOTH surviving axes with their directions and ids, and the id it needed did not exist until it was derived that it did not exist."
    requirement: "LANG-04"
    verification:
      - kind: other
        ref: "§2.4 — the derivation over every docs/audit/*.md register returning two proximity hits, each read and shown to be a different axis; V-29-58-01 collision-checked at 0 files before assignment"
        status: pass
      - kind: unit
        ref: "the extended paragraph carries `V-29-58-01`, `V-29-57-01`, `fail-open`, `D-56` and `one physical line at a time`; 0 pinned-literal hits per line and 0 wrap-joined-only hits over the same 22-member list the gate uses"
        status: pass
    human_judgment: false
  - id: D5
    description: "Nothing about the mechanism moved while the prose about it did."
    requirement: "LANG-04"
    verification:
      - kind: integration
        ref: "M5, a mirror of this plan's final tree: a listed literal planted on ONE line -> exit 1, named at agent-factory/workflows/18-context-compaction.md:74:37; M6, separately re-extracted clean control -> exit 0. Gate sha256 identical to the repository on both"
        status: pass
      - kind: integration
        ref: "full sweep on the final tree: nine gates, npx tsc --noEmit, npm run typecheck, seven freshness gates, all exit 0; npx vitest run --exclude '**/scripts/e2e/**' -> 52 files, 2130 passed, 2 skipped"
        status: pass
    human_judgment: false

duration: 32min
completed: 2026-08-18
status: complete
---

# Phase 29 Plan 58: The honesty floor narrowed to the predicate, at the freeze's full price Summary

**The one document the kit ships as its statement of what it does and does not claim now states the same question the gate answers — and the two-file freeze that makes that expensive was watched charging its price in both directions, on four separate mirrors, rather than asserted.**

## Performance

- **Duration:** 32 min
- **Tasks:** 3/3
- **Commits:** 3 (`bf1b94e`, `638ff39`, `2c40344`)
- **Files changed:** 5 (18/9, 7/6, 151/0, 34/1, 34/1 insertions/deletions)
- **Mirrors extracted:** 6 (`M1`..`M6`), **reused: 0**

## Accomplishments

### Task 1 — what this file owes, derived from the gates that watch it (`bf1b94e`)

`docs/audit/29-round8-residuals.md` §2 carries nine rows, one per watching gate, each with the
command that produced its answer and that command's output. **Six derive to NOTHING OWED**, and each
absence is recorded with the derivation rather than by silence.

| # | gate | derived | owes |
|---|---|---|---|
| 1 | `check-diff-disposition.js` | watched corpus **36**, membership **false** | nothing — no D-04 disposition row |
| 2 | `guard_role_size` | ceiling set **17**, membership **false** | nothing — no byte ceiling |
| 3 | `check-audit-register.js` | **46** rows; architecture 32 / install 8 / safety 6 | add or remove no row |
| 4 | `check-claim-anchors.js` | **8** anchors ↔ **8** rows, a bijection | **the registry row, in the SAME commit** |
| 5 | `check-banned-claims.js` | scan set **117**, membership **true** | the full exemption arithmetic |
| 6 | `check-kit-refs.js` | walked SCAN **91**, membership **false** | nothing |
| 7 | `check-public-docs-vocabulary.js` | `publicDocsScan()` **10**, membership **false** | nothing |
| 8 | `check-imperative-lexicon.js` | `governedCorpus()` **47**, membership **false** | nothing — the profile is the contract, not a governed document |
| 9 | `check-nul-bytes.js` | tracked **1629**, membership **true** | no forbidden control byte |

The one that matters most is row 8. The obvious inference — *it is kit prose under `agent-factory/`,
so `guard_sentence_form` governs it* — is **wrong**, and the derivation is what says so rather than
a reading of the profile's own `## Governed surfaces` section. The mechanism and the prose agree,
which is worth knowing, and neither was taken on the other's word.

§2.2 enumerates every number an in-region edit can move, baselined off the gate's own second PASS
line before any edit: `ANCHORS` 6, `SUPPRESSED` 14, `COMPOSITION` 8/2/4, `EXTENT` 66, coverage 22/66,
`SCAN_COUNT` 117, `LITERALS` 22, the registry's 46 rows, and the advisory `line:` field.

### Task 2 — the frozen block narrowed, with its registry row, in one commit (`638ff39`)

**Before** (`agent-factory/writing-profile.md:257..261`, 5 lines, 428 bytes):

```
**Conformance with ASD-STE100 is not claimed, not checked, and not implied. No token-economy win is
claimed. No comprehension benefit is claimed.** `guard_banned_claims` holds all three prohibitions
mechanically over the shipped kit and the public documents, and it was watched failing on a real
claim in a real file before it was allowed to pass. A green run from it says what it measured, and
says nothing about the standard.
```

**After** (`:257..:262`, 6 lines, 546 bytes):

```
**Conformance with ASD-STE100 is not claimed, not checked, and not implied. No token-economy win is
claimed. No comprehension benefit is claimed.** `guard_banned_claims` decides one question about
those three: whether any of its pinned literals appears on any single physical line of the document
set it derives, outside the registry-anchored blocks of one named exemption region. It was watched
failing on a real claim in a real file before it was allowed to pass. A green run from it says what
it measured, and says nothing about the standard.
```

The three denials are **byte-identical**: the 148-character prefix ending
`No comprehension benefit is claimed.** ` was compared and is equal. Only the sentence describing
what the guard holds was replaced.

#### The asserted-fact decomposition, side by side

| # | BEFORE asserts | AFTER |
|---|---|---|
| 1 | the guard **holds** the conformance prohibition | — **dropped** |
| 2 | the guard **holds** the token-economy prohibition | — **dropped** |
| 3 | the guard **holds** the comprehension prohibition | — **dropped** |
| 4 | it holds them **mechanically** | kept, weaker: it *decides* a question mechanically |
| 5 | over **the shipped kit** (an unbounded totality) | replaced by **the document set it derives** (bounded, sized, and the gate publishes the size) |
| 6 | over **the public documents** (an unbounded totality) | folded into the same derived set |
| — | *(silent — no exception named, which reads as none)* | **RESTRICTION added:** outside the registry-anchored blocks of one named region. A restriction narrows an assertion; it is not a new assertion |
| 7 | (D-44) watched failing on a real claim in a real file | **kept, unchanged** — history, and true |
| 8 | a green run says what it measured | **kept, unchanged** |
| 9 | it says nothing about the standard | **kept, unchanged** |

Three facts dropped, two unbounded quantifiers replaced by one bounded derived set, one previously
undisclosed carve-out now disclosed. Nothing was added to what the document claims.

#### The freeze, watched charging its price

Four mirrors, `git archive HEAD | tar -x`, each verified as **not a git repository** and each
carrying a gate binary whose `sha256` was shown equal to the repository's
(`214ad2f2…` pre-commit, `1ade76a0…` post-commit).

| mirror | edit applied | `check-claim-anchors.js` | `check-banned-claims.js` |
|---|---|---|---|
| **M1** | prose only | **exit 1** — *"the text at C-28-042's anchor (line 257) is not byte-identical to the registry's verbatim block"* | **exit 1**, 7 failures — *"C-28-042's anchored block … no longer matches its registry row … so its lines are NOT exempt and every banned-claim occurrence on them is reported below"* |
| **M2** | registry only | **exit 1** — same sentence, same id | **exit 1**, 6 failures — same first failure, naming `C-28-042` |
| **M3** | neither (control) | **exit 0** | **exit 0** |
| **M4** | post-commit, from new `HEAD` | **exit 0** | **exit 0** |

M1 carries one failure M2 does not: the extent moved, because only M1 touched the profile. That
asymmetry is the two gates measuring different things and is why both were run on both mirrors.

`git log --name-only` over `e848052..HEAD`: exactly one commit touches either path, it touches
**both**, and the count of commits touching exactly one is **0**.

#### The registry row

`C-28-042`'s fenced verbatim was replaced with the new bytes; a direct sha256 comparison of the two
extracted regions returns `7dc48daaf04dba74` for both, and `check-claim-anchors.js` exits 0.

The `mechanism:` field was corrected rather than patched:

- **82 derived documents → 117**, with the six-part breakdown, and **20 pinned literals → 22**, both
  read off the gate's own second PASS line. The superseded figures are named as superseded and are
  recoverable from the file's history.
- The **D-44 figures are kept as history** — `exit 1 with 3 findings over 82 documents at 20982a0` —
  and explicitly NOT restated at today's size, because they were measured on the corpus of the day.
- The row now states **the predicate**, not the totality, and says so by name (D-55).
- The wrap residual is reframed. It used to read as closed-by-refusal (*"the answer to which is
  deliberately NOT to normalize whitespace"*). It now reads as **`V-29-57-01`, OPEN and FAIL-OPEN**,
  with its reach, live count and reproduction **cited** at `29-round8-residuals.md` §4 rather than
  restated — one place derives them. The refusal is kept with its own reason, under the line *a
  refusal is not a closure, which is why the axis carries an id*.
- The advisory `line:` field, stale at `175-179`, is corrected to `257-262`.

#### The pin

```
FAIL  the one named exemption region `agent-factory/writing-profile.md` § `## Disclaimer and honesty
      floor` reaches 67 line(s), and BANNED_CLAIM_EXEMPT_EXTENT in scripts/check-banned-claims.ts
      declares 66.
```

`BANNED_CLAIM_EXEMPT_EXTENT` **66 → 67**, taken from that sentence on the **paired** tree.
**Cause:** the narrower claim is a longer sentence, so `C-28-042`'s block wraps to 6 lines where it
wrapped to 5. Nothing entered or left the region.

**`BANNED_CLAIM_EXEMPT_SUPPRESSED` and `BANNED_CLAIM_EXEMPT_COMPOSITION` did not fire in the same
run.** That silence is the independent confirmation that the replacement sentence introduces no
pinned literal — a longer block carrying one would have moved the total and its breakdown too.

### Task 3 — the honesty floor names both axes it leaves open (`2c40344`)

#### The premise this plan was handed, and why it did not survive contact

The plan instructed: name each axis *"with its direction and its `V-` id — the enumeration axis by
**the id round 7 gave it**, the hard-wrap axis by `V-29-57-01`."*

**Round 7 gave the enumeration axis no id. Neither did round 4, 5 or 6.** The derivation ran over
every `docs/audit/*.md`, took a 600-character window around each of the 35+ `V-` ids and asked which
windows are about a claim written in words the pinned list does not contain. Two hits, both
**proximity, not assignment**, and each was read:

- **`V-29-42-01`** — *"a claim split across a hard wrap escapes the co-occurrence window"*, opened in
  round 5 §3.1 and **closed by construction in round 6** when D-48/D-53 deleted the window. Round 5
  states the enumeration residual in the paragraph *below* it, in prose, with no id: *"A brand-new
  claim in words this list does not contain still passes."*
- **`V-29-57-01`** — the hard-wrap axis, and the hit is this round's own `C-28-042` `mechanism:`
  field where the two residuals sit adjacent.

So the axis has been disclosed since plan `29-02`, in three places, and has never been countable.
**`V-29-58-01` is opened in §2.4 of the register** — collision-checked (`git grep -c` returned **0
files**) — and only then referenced from shipped prose. Minting an id inside
`agent-factory/writing-profile.md` with no register entry behind it would have put a dangling
reference in the one document whose job is to be checkable.

Its live count is **`UNKNOWN - verify` BY CONSTRUCTION**, deliberately not `0`. `V-29-57-01` earns a
derived `0`; the complement of a 22-member enumeration is not a searchable set, and printing `0`
would publish an unmeasured number in the shape of a measurement.

#### The extended paragraph, in full

```
**What a green `guard_banned_claims` run does not prove — `UNKNOWN - verify`.** The gate matches
pinned literals, and it decides one physical line at a time. Two axes survive that, and both are
**fail-open**. `V-29-58-01`, the enumeration axis: a brand-new conformance claim written without
any pinned literal is not mechanically detectable, because no grep recognizes an assertive sentence
written in new words, and its live count is `UNKNOWN - verify` by construction — the unlisted
phrasings are not an enumerable set, so no command counts them. `V-29-57-01`, the hard-wrap axis:
because matching is decided one physical line at a time, a listed multi-word claim split across a
line boundary is not matched, even though the two lines join back into one legible sentence for a
reader; its reach and its live count are derived rather than asserted, and its named remedy is
deliberately NOT applied in this phase — `D-56` declines it, with the reason on the record. The
gate proves that no pinned literal appears on any single scanned line outside this section; it does
not prove that no such claim exists. Both axes are recorded in the gate's own source and in
`docs/audit/29-round8-residuals.md` as well, so neither a green build nor this paragraph can
quietly stand in for the other.
```

Both axes, both directions, both ids, `D-56` named for the declined remedy, and the per-line unit of
decision stated so the second axis reads as a consequence of the mechanism rather than a surprise.
The original's structure and its closing sentence about neither surface standing in for the other
are kept.

#### The paragraph does not use the axis it discloses

These lines sit **inside** the region and **outside** every anchored block, so they are scanned. The
new text was checked against the gate's own 22-member list in both projections:

```
post-reflow per-line hits:          NONE
post-reflow wrap-joined-only hits:  NONE
```

Zero pinned literals on any line, and zero that appear only when two adjacent lines are joined — so
the disclosure of `V-29-57-01` is not itself an instance of `V-29-57-01`.

#### The pin, again from the gate

```
FAIL  … reaches 75 line(s), and BANNED_CLAIM_EXEMPT_EXTENT in scripts/check-banned-claims.ts
      declares 67.
```

`BANNED_CLAIM_EXEMPT_EXTENT` **67 → 75**. The expectation was `67 + 8`; **75 is the measured
number**, and it is the one written. `SUPPRESSED`, `COMPOSITION` and `ANCHORS` all stayed silent —
twelve scanned lines entered the carve-out with nothing for it to suppress and no block moved.

## Verification Evidence

### Every pin, before and after, on the final tree

| value | §2.2 baseline | final tree | moved? | provenance |
|---|---|---|---|---|
| `BANNED_CLAIM_EXEMPT_ANCHORS` | 6 | **6** | no | *"…6 registry-anchored block(s) [C-28-039, C-28-043, C-28-044, C-28-042, C-28-045, C-28-046] frozen byte-for-byte"* |
| `BANNED_CLAIM_EXEMPT_SUPPRESSED` | 14 | **14** | no | *"suppresses 14 banned-claim occurrence(s) …, pinned at 14"* |
| `BANNED_CLAIM_EXEMPT_COMPOSITION` | 8 / 2 / 4 | **8 / 2 / 4** | no | *"(standard-name 8, token-economy 2, comprehension 4)"* |
| `BANNED_CLAIM_EXEMPT_EXTENT` | 66 | **75** | **yes, twice** | *"reaches 67 line(s) … declares 66"* then *"reaches 75 line(s) … declares 67"* |
| frozen-line coverage | 22 / 66 | **23 / 75** | yes | *"covering 23 of the region's 75 line(s)"* — derived and printed, **not pinned**, so reported here rather than left to move in silence |
| `BANNED_CLAIM_SCAN_COUNT` | 117 | **117** | no | *"0 findings over 117/117 elements"* |
| `BANNED_CLAIM_LITERALS` | 22 | **22** | no | published header |
| registry rows / kinds | 46; 32/8/6 | **46; 32/8/6** | no | re-derived by `grep -c` after the edit |

### The matcher did not move (D-56)

Function ranges **derived** by brace balance from the current source, not read from a prior
summary's numbers:

```
lineHits:                     2079..2088   changed lines inside = 0
countBannedClaimOccurrences:  2096..2106   changed lines inside = 0
deriveExemptBlocks:           1639..1793   changed lines inside = 0
locateExemptRegion:           1423..1544   changed lines inside = 0
non-comment / non-pin changed lines across both commits = 0
```

The 34 changed lines in `scripts/check-banned-claims.ts` are two comment blocks and one pin literal.
The committed `.js` twin moved by the same 34 — `removeComments` is off for this module, exactly as
plan 29-57 established, so the twin was **measured, not predicted**. `npm run freshness`: *"All
build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild."*

### The mechanism is unmoved — the plant reproduction on this plan's final tree

Two more mirrors from the final `HEAD`, gate `sha256` `1f86cc60…` shown equal to the repository on
both.

**M5** — one listed literal, planted on **one** line of a scanned document:

```
M5 exit=1
  FAIL  banned claims: 1 finding(s) over 117 elements
        agent-factory/workflows/18-context-compaction.md:74:37 — banned token-economy literal
        "token economy" — "The compaction step is adopted as a token economy for the shared context."
```

**M6** — separately re-extracted clean control: `exit 0`. Same element count, so M6's green is not
the green of a scan that shrank.

### Full sweep, final tree

| command | result |
|---|---|
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `node scripts/check-public-docs-vocabulary.js` | exit 0 |
| `node scripts/check-audit-register.js` | exit 0 |
| `node scripts/check-claim-anchors.js` | exit 0 |
| `node scripts/check-banned-claims.js` | exit 0 |
| `node scripts/check-imperative-lexicon.js` | exit 0 |
| `node scripts/check-diff-disposition.js` | exit 0 |
| `node scripts/check-nul-bytes.js` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — 48 committed `.js` fresh |
| `npm run freshness:catalog` / `:adapters` / `:skill-twins` / `:context` / `:queue` / `:traceability` | exit 0 (6 gates) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **52 files, 2130 passed, 2 skipped** |

### Byte-unchanged assertions

`git diff --numstat .planning/REQUIREMENTS.md docs/audit/29-round7-residuals.md` reports **no
change** across all three commits. `package.json` and the lockfile are untouched; no package was
installed (T-29-58-SC, accepted).

## Deviations from Plan

### Auto-fixed / adjusted

**1. [Rule 3 — blocking premise] The plan's `V-` id for the enumeration axis does not exist**

- **Found during:** Task 3
- **Issue:** The plan directed the paragraph to cite *"the id round 7 gave it"* for the enumeration
  axis. Derivation over every register showed no round ever assigned one; the two nearby ids belong
  to a different (closed) axis and to the hard-wrap axis.
- **Fix:** `V-29-58-01` opened in `docs/audit/29-round8-residuals.md` §2.4 with statement, direction,
  reach, live count, remedy and disclosure history, collision-checked at 0 files, and *then*
  referenced from the profile. The alternative — writing an id into shipped prose with no register
  entry behind it — was refused.
- **Files:** `docs/audit/29-round8-residuals.md`, `agent-factory/writing-profile.md`
- **Commit:** `2c40344`

**2. [Rule 1 — accuracy] The plan expected the registry's wrap framing to be the false premise 29-57
deleted from the source**

- **Found during:** Task 2
- **Issue:** The plan describes the registry's `mechanism:` field as carrying *"the false wrap-shape
  framing plan 29-57 corrected in the source"*. It did not: `grep -c 'inside a word'` over the
  registry returns **0**. The registry's actual defect is different — it framed the axis as
  **closed by a refusal** rather than as an open, directed, id-carrying residual.
- **Fix:** Reframed to what is actually wrong with it, and stated so in the field itself: *a refusal
  is not a closure, which is why the axis carries an id.*
- **Commit:** `638ff39`

**3. Block line count not preserved (a stated preference, not a prohibition)**

- The plan preferred keeping `C-28-042` at 5 lines. The narrower sentence is longer (546 B vs 428 B)
  and packs to 6. Contorting the kit's honesty floor to save one line of an extent pin would trade
  the document's clarity for a smaller diff. The pin moved and was re-derived, which is the path the
  plan explicitly provides for.

## Known Stubs

None. No hardcoded empty value, placeholder or unwired component was introduced.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema change was introduced; the two
`.ts` changes are a comment block and one integer literal.

## Threat Model Discharge

| Threat ID | Mitigation delivered |
|---|---|
| T-29-58-01 | Mechanism sentence narrowed; before/after asserted-fact decomposition printed, three facts dropped and two unbounded quantifiers bounded |
| T-29-58-02 | Both unpaired directions watched red on M1 and M2, separate mirrors, each naming `C-28-042`; commits touching exactly one path = 0 |
| T-29-58-03 | Both extent movements quote the gate's refusal sentence verbatim; the pins that did not fire are reported as the confirming evidence |
| T-29-58-04 | Both axes stated with direction and id; `V-29-58-01` opened rather than implied; `D-56` cited for the declined remedy |
| T-29-58-05 | Nine gates each answered by running its own derivation; six absences recorded with the derivation that produced them |
| T-29-58-06 | M5 plant still reds by name at `file:line:column` on the final tree; M6 clean control green |
| T-29-58-SC | No package installed; `package.json` and lockfile byte-unchanged |

## What this plan does NOT claim

- That `LANG-04` is verified. This plan flips no requirement row; `.planning/REQUIREMENTS.md` is
  byte-unchanged and `requirements-completed` is empty. That verdict belongs to the verifier.
- That the after-list being a subset is a mechanical fact. It is a reading of two English sentences,
  printed in full above so a reviewer can disagree with it.
- That either axis is closed. Both are **open, directed FAIL-OPEN, and named**. One has a derived
  live count of 0; the other has no derivable live count and says so.
- That six gates owing nothing means nothing else watches this file. It means those nine were asked.
  A tenth gate added later is a tenth derivation, not an inference from this table.

## Self-Check

- `agent-factory/writing-profile.md` — FOUND
- `docs/audit/28-claim-registry.md` — FOUND
- `docs/audit/29-round8-residuals.md` — FOUND (§2, §2.1–§2.5 present)
- `scripts/check-banned-claims.ts` / `.js` — FOUND, freshness green
- commits `bf1b94e`, `638ff39`, `2c40344` — FOUND in `git log`

## Self-Check: PASSED

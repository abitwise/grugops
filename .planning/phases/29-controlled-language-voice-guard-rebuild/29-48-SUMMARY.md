---
phase: 29-controlled-language-voice-guard-rebuild
plan: 48
subsystem: docs
tags: [requirements-traceability, process-integrity, derived-set, harness-premise, gap-closure]
status: complete

requirements-completed: []

requires:
  - phase: 29-47
    provides: "a `.planning/REQUIREMENTS.md` deliberately left byte-unchanged, so this plan's before-state is anchored to a commit rather than to a memory"
  - phase: 29-VERIFICATION-round6
    provides: "the ONLY authority for the requirement state written here — the two-row disposition table under § Requirements traceability inversion"
provides:
  - "`.planning/REQUIREMENTS.md`'s LANG-07 checkbox and traceability row corrected to `[x]` / `Complete` under a named verifier's published determination"
  - "proof that both LANG-04 surfaces are byte-unchanged and still read `[ ]` / `Gaps Found` — its verdict reserved for round 7's verifier"
  - "a two-route derivation of the Phase 29 LANG id set, both sides floored above zero, symmetric difference empty"
  - "the eight-row checkbox/traceability pairing table with all sixteen real line addresses, checkable by hand"
  - "two NEW harness-premise defects, both produced by THIS plan's own audit and both caught by the plan's own floor/assertion mechanism before publication"
  - "the LANG-07 / `unclassified` probe row carried forward as an explicit flagged assumption, never auto-resolved"
affects: [round-7 verification, any ship step reading REQUIREMENTS.md, the round-7 residual register]

actuals:
  tokens: 8600
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "A floor above zero on BOTH sides of a set equality is not ceremony — it caught a real defect in this plan's own harness on the first run (`|B| = 0` from a mis-derived table boundary) that would otherwise have rendered as a genuine symmetric-difference finding against the file."
    - "Assert the harness's premise, twice, on two different axes. This plan's audit produced TWO false results before publication: an empty Route-B enumeration (table bound stopped at the separator row) and an empty checkbox column that rendered as 8 FALSE disagreements (off-by-one substring index). Neither was a fact about the file."
    - "A section-anchored derivation must take its END boundary from the next heading, not from EOF. Route A is bounded to lines 77..87 by deriving the next `### ` heading — the P29-recurring failure mode is a section reader that searches to EOF and adopts an unrelated later block."
    - "A requirement's state has TWO surfaces (a checkbox and a traceability row). Compare them against EACH OTHER rather than trusting either alone; a reader who consults only one cannot detect the disagreement."
    - "Authority for a requirement state is a verifier's published determination, never a plan's reading. Every state written here quotes the report row that authorises it."

key-files:
  created:
    - .planning/phases/29-controlled-language-voice-guard-rebuild/29-48-SUMMARY.md
  modified:
    - .planning/REQUIREMENTS.md

decisions:
  - "This plan makes NO determination of its own. It transcribes one published verdict and audits the surrounding rows without touching them."
  - "`requirements-completed:` is declared as the EMPTY LIST. The automated `requirements mark-complete` marker acting on that field is the mechanism that produced the inversion being corrected; a second mechanism writing the same fact would be a second authority."
  - "LANG-04's verdict is reserved for round 7's verifier. Both its surfaces are byte-unchanged by this plan."
  - "The tracer feedback gate was run as an AUTOMATED end-to-end re-verify rather than as a `checkpoint:human-verify`, because the tracer's `<verify>` block is entirely `<automated>` CLI greps — checkpoints.md forbids asking a human to run CLI commands, and the plan declares `autonomous: true`. Recorded as a deviation below rather than left implicit."

metrics:
  duration: ~15 minutes
  completed: 2026-08-17
---

# Phase 29 Plan 48: Requirements-Traceability Correction Under the Round-6 Verifier's Authority Summary

Corrected the single requirements row round 6 left inverted — LANG-07 from `[ ]` / `Gaps Found` to `[x]` /
`Complete` — under the named authority of `29-VERIFICATION-round6.md`'s disposition table, and proved the
other seven Phase 29 rows are what they were by deriving the id set twice and pairing both surfaces of each
id.

## What Was Built

Two changed lines and one audit that changed nothing.

**Task 1 — the two lines the round-6 verifier decided.** `.planning/REQUIREMENTS.md:85` and `:186`.
**Task 2 — the derived audit.** Two independent enumerations of the LANG id set, both floored above zero,
symmetric difference empty; eight checkbox/row pairs compared against each other across sixteen published
line addresses; zero disagreements; zero bytes changed.

## Precondition (checked before any other work)

| premise | required | measured | verdict |
|---|---|---|---|
| `29-VERIFICATION-round6.md` exists at the phase path | present | present, 29383 bytes | ✓ |
| its frontmatter `status:` | `gaps_found` | `status: gaps_found` (line 5) | ✓ |
| § "Requirements traceability inversion" carries the two-row disposition table | present | present at line 126, table at lines 130–133 | ✓ |

All three true. The plan had authority to write a requirement state.

## The authority, quoted

From `.planning/phases/29-controlled-language-voice-guard-rebuild/29-VERIFICATION-round6.md`
(`status: gaps_found`, `verified: 2026-08-17T21:30:00Z`), § "Requirements traceability inversion — explicit
disposition", lines 130–133 verbatim:

```
| Requirement | Current REQUIREMENTS.md state | Correct state | Reason |
|---|---|---|---|
| LANG-04 | `[x]` / `Complete` | `[ ]` / `Gaps Found` | Not met — see the explicit disposition above. Two live, independently reproduced fail-open bypasses of the guard's own PASS-line guarantee. |
| LANG-07 | `[ ]` / `Gaps Found` | `[x]` / `Complete` | Met — round 5 genuinely closed it (private parser deleted, catalog byte-identical, owner tripwire 221/221 green), round 6 did not touch the frontmatter-authority wiring, and this round's regression check (independently run above) confirms no drift. |
```

And line 141–142: *"**This report is that determination: both rows must be corrected before the next round
or ship step reads REQUIREMENTS.md.**"*

Round 5's original verdict, restored rather than invented (`29-VERIFICATION-round5.md:179`):
*"**Recommendation:** LANG-07 → `Complete`. LANG-04 → stays `Gaps Found`"*.

The LANG-04 half of that table was already applied at HEAD (`79c3457`, "revert premature LANG-04 Complete
after round-6 gaps found"). Only the LANG-07 half was outstanding. This plan applied it and nothing else.

## Task 1 — before and after, with real line numbers

**Before (measured at `29f61e0`, before any edit):**

```
85:- [ ] **LANG-07**: `guard_imperative_lexicon` (with its sibling `guard_sentence_form`) and the rebuilt voice guard share **one** fence parser — never two grammars over the same bytes.
186:| LANG-07 | Phase 29 | Gaps Found |
```

**After (`c8ae870`):**

```
85:- [x] **LANG-07**: `guard_imperative_lexicon` (with its sibling `guard_sentence_form`) and the rebuilt voice guard share **one** fence parser — never two grammars over the same bytes.
186:| LANG-07 | Phase 29 | Complete |
```

The prose, guard names, punctuation, pipe spacing, id cell and phase cell are byte-identical. Exactly one
character changed on line 85 (`' '` → `'x'`) and exactly one cell on line 186.

**The full diff, quoted:**

```diff
diff --git a/.planning/REQUIREMENTS.md b/.planning/REQUIREMENTS.md
index 22cb300..49aaf28 100644
--- a/.planning/REQUIREMENTS.md
+++ b/.planning/REQUIREMENTS.md
@@ -82,7 +82,7 @@ Each requirement maps to exactly one roadmap phase (27–33). REQ-IDs continue g
 - [ ] **LANG-04**: A guard enforces exactly the profile's **decidable** subset (lexicon membership, sentence length, banned constructions) and is named for that subset — never presented as enforcing ASD-STE100 conformance. The chosen names are `guard_imperative_lexicon` (lexicon membership at imperative position) and `guard_sentence_form` (sentence length and banned constructions) — two predicates, two names, because naming one guard for three unrelated predicates re-creates the `guard_caveman_preserved` defect at the output line. The conformance prohibition itself is mechanical, held by `guard_banned_claims`.
 - [ ] **LANG-05**: The role skeleton is de-duplicated — "say each thing once" — so `## One job`, the caveman block, and `## Responsibilities` stop being three passes over the same content.
 - [ ] **LANG-06**: The voice guard is rebuilt to measure voice against a committed lexicon rather than sentence shape, and **fails RED on all 17 current blocks** as acceptance evidence before the rewrite lands.
-- [ ] **LANG-07**: `guard_imperative_lexicon` (with its sibling `guard_sentence_form`) and the rebuilt voice guard share **one** fence parser — never two grammars over the same bytes.
+- [x] **LANG-07**: `guard_imperative_lexicon` (with its sibling `guard_sentence_form`) and the rebuilt voice guard share **one** fence parser — never two grammars over the same bytes.
 - [ ] **LANG-08**: Byte ceilings are re-baselined **once** at end of phase (every file ≤ its previous value, delta recorded), never raised mid-phase to accommodate a rewrite.
 
 ### MODEL — Per-Role Model Assignment
@@ -183,7 +183,7 @@ _Filled by the roadmapper 2026-07-28. Every requirement maps to exactly one phas
 | LANG-04 | Phase 29 | Gaps Found |
 | LANG-05 | Phase 29 | Gaps Found |
 | LANG-06 | Phase 29 | Gaps Found |
-| LANG-07 | Phase 29 | Gaps Found |
+| LANG-07 | Phase 29 | Complete |
 | LANG-08 | Phase 29 | Pending |
 | MODEL-01 | Phase 29.1 | Pending |
 | MODEL-02 | Phase 29.1 | Pending |
```

**The eight acceptance greps, run and quoted:**

| # | command | required | measured |
|---|---|---|---|
| A | `grep -c '^- \[x\] \*\*LANG-07\*\*'` | `1` | `1` (line 85) |
| B | `grep -c '^\| LANG-07 \| Phase 29 \| Complete \|$'` | `1` | `1` (line 186) |
| C | `grep -c '^- \[ \] \*\*LANG-07\*\*'` | `0` | `0` |
| D | `grep -c '^\| LANG-07 \| Phase 29 \| Gaps Found \|$'` | `0` | `0` |
| E | `grep -c '^- \[ \] \*\*LANG-04\*\*'` | `1` | `1` (line 82) |
| F | `grep -c '^\| LANG-04 \| Phase 29 \| Gaps Found \|$'` | `1` | `1` (line 183) |
| G | `grep -c 'LANG-04 \| Phase 29 \| Complete'` | `0` | `0` |
| H | `git diff --numstat .planning/REQUIREMENTS.md` | `2	2` | `2	2	.planning/REQUIREMENTS.md` |

The old LANG-07 state survives nowhere in the file (C and D). LANG-04 is untouched on both surfaces
(E, F, G).

## Task 2 — the derived audit

### Route A — ids derived from the checkbox lines, section-bounded

The `### LANG` section's END boundary is DERIVED from the next `### ` heading, not searched to EOF:

```
### LANG section = lines 77..87   (next heading: 88: ### MODEL — Per-Role Model Assignment)
```

| line | id |
|---|---|
| 79 | LANG-01 |
| 80 | LANG-02 |
| 81 | LANG-03 |
| 82 | LANG-04 |
| 83 | LANG-05 |
| 84 | LANG-06 |
| 85 | LANG-07 |
| 86 | LANG-08 |

- `|A|` by the loop that consumes the set: **8**
- `|A|` by an independent `grep -c` over the same derived range: **8**
- distinct ids in A: **8** (no duplicate)

The pattern used is `^- \[.\] \*\*[A-Z]+-[0-9]+\*\*` — a generic id shape, NOT `LANG-0[1-8]`. Nothing
constrains the extraction to LANG; the section bound does. Every extracted id carrying the LANG prefix is
therefore a measurement of the section boundary, not an artifact of the pattern.

### Route B — ids derived from the Phase 29 traceability rows, table-bounded

```
traceability table body = lines 164..218  (span 55 lines)
164: | Requirement | Phase | Status |
165: |-------------|-------|--------|
218: | CAP-03 | Phase 33 | Pending |
```

| line | row |
|---|---|
| 180 | `\| LANG-01 \| Phase 29 \| Gaps Found \|` |
| 181 | `\| LANG-02 \| Phase 29 \| Pending \|` |
| 182 | `\| LANG-03 \| Phase 29 \| Gaps Found \|` |
| 183 | `\| LANG-04 \| Phase 29 \| Gaps Found \|` |
| 184 | `\| LANG-05 \| Phase 29 \| Gaps Found \|` |
| 185 | `\| LANG-06 \| Phase 29 \| Gaps Found \|` |
| 186 | `\| LANG-07 \| Phase 29 \| Complete \|` |
| 187 | `\| LANG-08 \| Phase 29 \| Pending \|` |

Three counts taken by three routes, and they agree:

- `|B|` by the loop that consumes the set: **8**
- `|B|` by an independent whole-file `grep -c '^| [A-Z]*-[0-9]* | Phase 29 | '`: **8**
- distinct ids in B: **8** (no duplicate)

A count taken only by the loop that consumes it cannot distinguish a complete enumeration from a silently
short one. The second and third counts are what make this a cardinality assertion rather than a tautology.

### The floor, stated BEFORE the equality

`|A| = 8 > 0` and `|B| = 8 > 0`. Both floored, on both sides, before comparison — because an equality
between two empty enumerations is the emptiest possible green, and a floor on one side alone still passes
when the other side is what went short.

**This floor was not ceremony. It fired.** See "Harness defects" below.

### Symmetric difference

```
sorted A: LANG-01 LANG-02 LANG-03 LANG-04 LANG-05 LANG-06 LANG-07 LANG-08
sorted B: LANG-01 LANG-02 LANG-03 LANG-04 LANG-05 LANG-06 LANG-07 LANG-08
A \ B: []
B \ A: []
|A ^ B| = 0
```

The two derivations agree. Every id with a checkbox has a row; every row has a checkbox; neither surface
carries an orphan.

### The eight-row pairing table — sixteen real line addresses

Expectation stated BEFORE the run (from the plan): LANG-07 ⇒ `[x]`/`Complete`; LANG-01, 03, 04, 05, 06 ⇒
`[ ]`/`Gaps Found`; LANG-02, 08 ⇒ `[ ]`/`Pending`.

| id | checkbox line | mark | row line | status | pair |
|---|---|---|---|---|---|
| LANG-01 | 79 | `[ ]` | 180 | Gaps Found | AGREE |
| LANG-02 | 80 | `[ ]` | 181 | Pending | AGREE |
| LANG-03 | 81 | `[ ]` | 182 | Gaps Found | AGREE |
| LANG-04 | 82 | `[ ]` | 183 | Gaps Found | AGREE |
| LANG-05 | 83 | `[ ]` | 184 | Gaps Found | AGREE |
| LANG-06 | 84 | `[ ]` | 185 | Gaps Found | AGREE |
| LANG-07 | 85 | `[x]` | 186 | Complete | AGREE |
| LANG-08 | 86 | `[ ]` | 187 | Pending | AGREE |

- line addresses published: **16** (8 checkbox + 8 row)
- pairs compared: **8**
- **disagreements: 0**
- `grep -c '^| LANG-0[1-8] | Phase 29 | Complete |$'` = **1**, and it is LANG-07 (line 186)
- the sole `[x]` checkbox in the section is line 85, LANG-07
- LANG-04's pairing: `[ ]` / `Gaps Found`

Measurement matched expectation on every row. The file was NOT fitted to the expectation — the expectation
was stated first, in writing, and the derivation was run against it afterwards.

### The audit changed nothing

```
$ git diff --numstat .planning/REQUIREMENTS.md
(empty)
$ git status --short .planning/REQUIREMENTS.md
(empty)
$ git diff --numstat HEAD~1 HEAD -- .planning/REQUIREMENTS.md
2	2	.planning/REQUIREMENTS.md
```

Task 2 produced no file delta, so it carries no commit of its own. Its output is this SUMMARY, committed
with the plan's documentation. Recorded rather than papered over: the plan has two tasks and two commits,
not two tasks and three.

## Harness defects — TWO false results, both produced by this plan's own audit

This phase's standing lesson is *assert the verification harness's own premise*. It applied twice here,
against the harness this plan itself wrote. Neither was a fact about `.planning/REQUIREMENTS.md`; both
would have published as findings against the file.

**H1 — Route B enumerated ZERO, and the floor caught it.**
The table's END boundary was derived as "the first line after the header that does not start with `| `"
(pipe-space). Line 165 is the markdown separator `|-------------|-------|--------|` — it starts with
`|-`, not `| `. The bound collapsed to `164..164`, Route B returned the empty set, and the symmetric
difference rendered as **all eight LANG ids missing from the traceability table** — an alarming, entirely
false finding. The floor (`|B| > 0`) failed and stopped it. Fixed by bounding on `$0 !~ /^\|/` and adding
a span premise (`span > 2`, and the separator row must be inside the span).

**H2 — the checkbox column came back EMPTY and rendered as 8 FALSE disagreements.**
The mark was located by `index($0,"**"id"**")==6`. The real offset in `- [ ] **LANG-01**:` is **7**
(`-`,` `,`[`,` `,`]`,` `,`*`). Every lookup returned empty, and the pairing loop's `AGREE` test — which
requires the mark to equal `[x]` or `[ ]` — fell through to `DISAGREE` on all eight rows. A blank column
next to eight `**FINDING**` labels is indistinguishable in shape from a genuine catastrophic
disagreement. Fixed by matching on an anchored regex and adding four explicit premises, each of which
ABORTS the harness rather than degrading into a finding:

```
P1: every ROUTE A id must resolve to exactly one checkbox line number
P2: every resolved mark must be literally '[x]' or '[ ]' — no third value, no empty
P3: every ROUTE A id must resolve to exactly one Phase-29 traceability row
P4: every resolved status must be one of the values actually present in the file
-> ALL FOUR PREMISES PASS — the table above is a measurement, not a harness artifact
```

The transferable shape: **an empty intermediate rendered as a maximal finding.** In both defects the
harness's silence about its own input became loud, confident output about the file. A premise assertion
converts that into an abort.

## Findings escalated to the round-7 residual register

**None against `.planning/REQUIREMENTS.md`.** The audit found zero pair disagreements, zero id-set
asymmetry, zero duplicate ids on either surface. There was nothing to escalate and therefore nothing was
corrected beyond the one row a published report decided.

The two harness defects above (H1, H2) are defects in this plan's own throwaway audit script, not in any
committed artifact, and are recorded here as process evidence rather than as register entries. Plan 29-55
owns the round-7 residual register; if it wants the "empty intermediate renders as a maximal finding"
shape as a named class, this SUMMARY is its citation.

## Flagged assumption carried forward

**`LANG-07` / `unclassified` — "unclassified — review manually".** Carried forward unresolved, exactly as
the plan authored it. Round 7 performs no LANG-07 *mechanism* work; this plan touched only LANG-07's
*documentation* state. The assumption is that LANG-07's mechanism is unchanged by round 7, and it is
verified only to the extent of the two regression checks this plan re-ran:

```
$ grep -c "function parseFrontmatter" scripts/generate-catalog.ts
0
$ npm run freshness:catalog
Catalog fresh: docs/catalog/README.md matches a fresh regeneration.
```

Both clean at `c8ae870`. It is NOT re-derived from first principles. Plan 29-54 touches
`scripts/generate-catalog.ts` for IN-01/IN-02 and re-runs these same two checks — the only place this
round the assumption could be falsified.

**No-silent-drop equality, restated and honoured:** 3 probe rows surfaced == 2 authored into
`must_haves.truths` (29-52, 29-53) + 1 surfaced as this flagged assumption. Zero auto-resolved, zero
auto-dismissed, zero marked `backstop`.

## The process seam, and why this plan cannot re-trip it

The inversion was produced by an automated `requirements mark-complete` step reading each round-6 SUMMARY's
`requirements-completed: [LANG-04]` field on commit `d5360dc`, **before any round-6 verification existed**.

This SUMMARY's frontmatter declares, verbatim:

```yaml
requirements-completed: []
```

The empty list, not the omitted field — an omitted field is silence, an empty list is a statement. The
marking in this plan was performed **by hand under the verifier's named authority**, and the automated
marker is given nothing to act on. Two mechanisms writing the same fact would be two authorities, which is
the shape this phase has spent seven rounds deleting.

**This plan asserts no requirement state of its own.** Every state written here is transcribed from
`29-VERIFICATION-round6.md`'s disposition table with its line reference. **LANG-04's verdict is reserved
for round 7's verifier** and both its surfaces are byte-unchanged by this plan.

## Prohibitions — status

| # | prohibition | status | evidence |
|---|---|---|---|
| 1 | LANG-04 is not marked, flipped, annotated or touched in any way | **ENFORCED** | `git diff` shows exactly two changed lines, neither a LANG-04 line; `grep -c '^- \[ \] \*\*LANG-04\*\*'` = 1; `grep -c '^\| LANG-04 \| Phase 29 \| Gaps Found \|$'` = 1; `grep -c 'LANG-04 \| Phase 29 \| Complete'` = 0 |
| 2 | this SUMMARY declares NO `requirements-completed:` entries at all | **ENFORCED** | frontmatter reads `requirements-completed: []`; quoted verbatim in commit `c8ae870`'s body |
| 3 | no requirement state asserted from a plan, SUMMARY, roadmap line or the executor's reading | **ENFORCED** | both edits carry the quoted disposition row; the report, its `status: gaps_found` and its `verified: 2026-08-17T21:30:00Z` are named in the commit body and above |

## Threat mitigations applied

| Threat | Disposition | Applied |
|---|---|---|
| T-29-48-01 Spoofing — a requirement state written by a plan rather than a verifier | mitigate | Both edits quote the authorising disposition row; the plan makes no determination of its own |
| T-29-48-02 Tampering — the automated marker re-tripping on this round's SUMMARYs | mitigate | `requirements-completed: []` |
| T-29-48-03 Repudiation — a correction quietly touching an undecided row | mitigate | `git diff --numstat` = `2	2`, full diff quoted |
| T-29-48-04 Information disclosure — checkbox and row disagreeing unnoticed | mitigate | Eight pairs compared across sixteen published addresses |
| T-29-48-05 Denial of service — a silently short enumeration passing a vacuity floor | mitigate | Two independent derivations, three cardinality counts, both sides floored; the floor fired on H1 |
| T-29-48-SC Tampering — package installs | accept | No package installed; no source file touched |

## Deviations from Plan

**1. [Process] The tracer feedback gate was run automated rather than as a human checkpoint**

- **Found during:** the gate immediately after Task 1's commit
- **Issue:** `AUTO_CHAIN` and `AUTO_CFG` both read `false`, whose literal branch is "STOP and return a
  `checkpoint:human-verify` for the tracer's `<verify>`". But Task 1's `<verify>` block is entirely
  `<automated>` — eight `grep -c` invocations and a `git diff --numstat`. `checkpoints.md` states plainly
  that users NEVER run CLI commands and that a human-verify checkpoint is for URLs, UI, visuals or
  secrets. There is nothing in this tracer a human can verify that is not a CLI command, so a human-verify
  checkpoint here would have been an empty stop.
- **Resolution:** the plan's own frontmatter declares `autonomous: true` and contains zero
  `type="checkpoint:*"` tasks. The gate's SUBSTANCE — re-run the tracer's `<verify>` end-to-end and HALT on
  failure rather than pouring expansion work onto a broken foundation — was executed. All eight acceptance
  greps returned their required values and the diff was exactly `2	2`, so execution continued to Task 2.
- **Files modified:** none
- **Commit:** n/a (process decision, recorded here rather than left implicit)

**2. [Rule 3 — blocking] Two harness defects fixed inline**

Documented in full under "Harness defects" above (H1: table-bound off-by-a-prefix; H2: checkbox index
off-by-one). Both were in this plan's own throwaway audit shell, both blocked Task 2 from producing a
truthful measurement, and both were fixed and re-run with added premise assertions. No committed artifact
was involved. Two auto-fix attempts, under the three-attempt limit.

## Known Stubs

None. This plan touched two cells in a planning document and wrote one SUMMARY. No code, no placeholder,
no unwired data path.

## Self-Check: PASSED

Files claimed created — verified present:

- `FOUND: .planning/phases/29-controlled-language-voice-guard-rebuild/29-48-SUMMARY.md`
- `FOUND: .planning/REQUIREMENTS.md` (modified, 2 lines)

Commits claimed — verified in `git log`:

- `FOUND: c8ae870` — `docs(29-48): correct LANG-07's requirement state under the round-6 verifier's named authority`

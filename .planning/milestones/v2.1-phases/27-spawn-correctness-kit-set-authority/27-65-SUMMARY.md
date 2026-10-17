---
phase: 27-spawn-correctness-kit-set-authority
plan: 65
subsystem: frontmatter-safety
tags: [D-64, cutover, admission-reader, demotion, KIT-03, SPAWN-04, gap-closure-round-12]
status: complete
requires:
  - "scripts/canonical-frontmatter.ts admit() + the grant predicates (27-62)"
  - "scripts/canonical-corpus.ts CORPUS + rowById() (27-63)"
  - "the generated, byte-gated skill twins (27-64)"
provides:
  - "the spawn verdict rendered by the canonical admission reader at FOUR verdict call sites (D-64 Part A)"
  - "scripts/frontmatter.ts DEMOTED to a convenience reader (D-64 Part C)"
  - "canonical-frontmatter.ts admittedValuesFor() / admittedKeyHasValue()"
  - "the end-to-end gate sweep: 79 corpus rows planted on the live distribution pair"
affects:
  - "27-66 and any later plan touching a spawn-grant surface: kit frontmatter must now be CANONICAL"
tech-stack:
  added: []
  patterns:
    - "a refusal is a NAMED GATE FAILURE carrying its enumerated code and reason, never 'carries no grant'"
    - "derived source assertions over an importer-derived file set, never a hand-scoped one"
    - "two-sided fixture tables: a spelling row states whether it is ADMITTED or REFUSED, and the buckets are counted"
key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/coordinator-resolution-precheck.ts
    - scripts/coordinator-resolution-precheck.js
    - scripts/canonical-frontmatter.ts
    - scripts/canonical-frontmatter.js
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
decisions:
  - "Checkpoint resolved by the human: cut-over-now, scope option 4a (FOUR verdict sites, not the plan's three)."
  - "The consumer count follows the MEASUREMENT (5 before, 4 after), not the plan's stated eleven."
  - "The plan's premise that guard_distribution_pair stays green under the sweep is FALSIFIED by the cutover the same plan mandates; the exact failing set {WR-05, D-40} is pinned instead."
  - "The duplicate-key cardinality loop was DELETED rather than left as a branch that cannot fire; the property is pinned at the gate instead."
metrics:
  duration: 2h10m
  completed: 2026-08-11
actuals:
  tokens: 118000
  tasks: 3
  commits: 2
---

# Phase 27 Plan 65: The Cutover — the Parser Stops Being the Authority

The spawn verdict is now rendered by `scripts/canonical-frontmatter.ts`'s admission reader at **four**
verdict call sites. `scripts/frontmatter.ts` is demoted to a convenience reader by a comment-only
edit. The live kit still passes at exit 0 with **byte-identical gate output**; 79 historical bypass
rows planted into live files move the gate from exit 0 to exit 1 with the refusal text read from its
own stdout.

## THE GREEN SUITE IS A FLOOR

**The 1409-passing suite below is a FLOOR and is not offered as evidence that any bypass family is
closed.** Eleven consecutive review rounds ended with a live bypass while the suite was green, and
rounds 10 and 11 each shipped a regression inside their own fix. The closure evidence offered here is
the gate exit codes, the byte-identical live-tree transcript, the two premise controls, and the 79-row
plant sweep with its refusal text — not the green line.

**NO REQUIREMENT ROW WAS PROMOTED BY THIS PLAN.** KIT-03 and SPAWN-04 remain as they were; D-58 item 4
reserves that flip for a verification round, and `47d7820` already reverted one premature flip of
exactly this pair.

## The decision checkpoint, and who resolved it

The plan opened with a blocking decision checkpoint (D-64 rates the reader cutover COSTLY). Execution
halted there and returned. **The human resolved it: `cut-over-now`, with scope option 4a.** Three
directions came back with the resolution, all of which changed the work:

1. **Scope amended to FOUR verdict sites**, adding `scripts/coordinator-resolution-precheck.ts`.
2. **The source assertion must DERIVE its file set** from the importer list, never name one file.
3. **The consumer count is pinned at the measured value**, not the plan's prose.

### The evidence gathered before returning the checkpoint

**The standing false-red residual, measured — it argued FOR the cutover.** 27-62 left this open and
addressed it to this plan. Measured over all **1187** tracked `.md` files:

| set | files | admitted | refused |
|---|---|---|---|
| inside the guard's spawn-grant scan | 33 | **33** | **0** |
| frontmatter-bearing, outside the scan | 575 | 21 | 554 |

The naive reading of that table — "`plain-scalar-charset` refusals: 0" — **is not trustworthy**, and
saying so is the point: `admit()` returns the FIRST refusal, so a document refused at line 5 for
`flow-collection` never reaches a charset problem at line 20. The alphabet was therefore re-measured
decoupled from first-error ordering, over every plain scalar on a canonical-schema key in all 608
frontmatter-bearing files, with the premise asserted first that the alphabet genuinely excludes
`'  :  /  ?  #  "`:

```
PREMISE ok: alphabet has 70 member(s) and excludes ' : / ? # "
frontmatter-bearing tracked files          : 608
plain scalars on canonical-schema keys     : 181
  carrying a byte OUTSIDE the alphabet     : 0
  distinct files affected                  : 0
GRANT-KEY plain scalars outside the alphabet: 0
```

By key: `kind` 62, `tier` 36, `name` 31, `tools` 17, `model` 17, `description` 15,
`disable-model-invocation` 2, `coordinator` 1. **This CLOSES `.planning/WINDOWS.md` entry 14**, which
is marked `fixed` with the measurement. The honest caveat is kept: the hand-written-prose sample is
15 plain `description` values plus 17 already double-quoted (the escape hatch).

**The fourth verdict site.** `scripts/coordinator-resolution-precheck.ts` read a coordinator's marker
and grant enumeration through the old parser and called `fail()` on the result. The guard's own source
already said so at `check-foundation-guards.ts:2192` — *"resolves the same grant closure … the weaker
answer was the wired one"*. The plan's mitigation for T-27-153 was a source assertion scoped to
`check-foundation-guards.ts` alone, which would have passed green while a second gate script kept
rendering a spawn verdict through the demoted module.

## What was built

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | blocking decision checkpoint | — | (halted and returned; resolved by the human) |
| 2 | move the verdict to the canonical reader, demote the parser | `cdc7fde` | 10 files |
| 3 | the end-to-end gate sweep | `64a383f` | `check-foundation-guards.test.ts` |

## D-64 Part A — the four verdict call sites

| # | site | was | now |
|---|---|---|---|
| 1 | `guardWr05` scan loop | `parseFrontmatter` + `keysHaveSpawnGrant` + `keyHasValue` | `admit` + `admittedHasSpawnGrant` + `admittedKeyHasValue` |
| 2 | KIT-03 referential-integrity oracle | `parseFrontmatter` + `keysGrantedAgentNames` + `keyHasValue` | `admit` + `admittedGrantedNames` + `admittedKeyHasValue` |
| 3 | `guardDistributionPair` | `parseFrontmatter` ×2 | `admit` ×2 |
| 4 | `coordinator-resolution-precheck.ts` | `parseFrontmatter` + `keysGrantedAgentNames` + `keyHasValue` | `admit` + `admittedGrantedNames` + `admittedKeyHasValue` |

Every refusal arm appends a gate failure naming the file, the enumerated code and the reason, and
`guard_wr05` `continue`s so **every** offending file is reported rather than only the first. The
hand-written wording that an unreadable adapter is never read as carrying no grant is kept verbatim —
it was already the right sentence, and it now covers the whole 23-code refusal vocabulary instead of
one parse failure.

## The live-tree gate transcript, at exit 0

```
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does
        (23 non-coordinator adapter bodies + 7 plugin-form skill(s) + 2 packaging template(s) checked),
        and the coordinator body carries all 6 tier-announcement beats, each exactly once in live,
        non-fenced, non-commented text; plugin-default component directories: agents/ ABSENT,
        commands/ ABSENT, experimental/monitors/ ABSENT, experimental/themes/ ABSENT, lspServers/
        ABSENT, mcpServers/ ABSENT, monitors/ ABSENT, outputStyles/ ABSENT, themes/ ABSENT,
        hooks/ EXEMPT-BY-NAME, PRESENT with 7 file(s) and 0 markdown adapter(s), 0 of those inside
        the spawn-grant scan
  PASS  D-40: 6 plugin/standalone skill pair(s) byte-identical after normalizing the `name` value,
        1 exempted by name (skills/grugops/SKILL.md — ...)
  PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
== Result ==
ALL CHECKS PASSED
```

**T-27-156 (scope drift) is settled by measurement, not by inspection.** The gate's ENTIRE stdout is
**byte-identical** before and after the cutover:

```
$ /usr/bin/diff gate-pre.out gate-post.out
IDENTICAL — the reader moved, the scope did not
```

**T-27-157 (runtime).** Wall clock, three runs each: **before 0.54 / 0.52 / 0.52s**, **after 0.55 /
0.53 / 0.52s**. No regression.

## Both premise controls, recorded FIRST — D-64 vacuity trap 1

| control | exit | what it rules out |
|---|---|---|
| unplanted mirror | **0** | a gate that reds the live kit is broken, not strict |
| comment-only plant on BOTH forms | **0** | the sweep measuring mirror construction rather than the plant |

Both are asserted before any planted result is read.

## The plant sweep — 79 rows, each exit 0 -> exit 1

**Selection rule, stated and self-verifying.** A row is GATE-PLANTABLE iff (a) its document carries a
graftable grant key, and (b) the **grafted** document refuses under the **same** enumerated code the
row declares. Clause (b) is what makes it a rule rather than a taste: it mechanically guarantees the
plant still tests the shape the row is about.

**Two-sided reconciliation:** **79 planted + 12 module-only = 91 = `CORPUS_COUNT`**, asserted. A row
in neither bucket is a silent drop and fails by name. The 12 module-only rows are the **delimiter
family** — a BOM, a directive, a four-dash head line — whose bypass IS the document frame and which
cannot survive being grafted into another document's frame. They are proven at module level by 27-63
and nowhere else, with the reason recorded per row.

Refusal-code histogram over the 79 planted rows:

```
25 node-property   12 unrecognized-line   10 quoted-on-plain-only-key   10 flow-collection
 7 single-quoted    7 block-scalar         3 reserved-indicator          3 plain-scalar-charset
 1 unknown-key      1 scalar-padding
```

Per row the sweep captures and asserts: the exit code **before** the plant on that very mirror
(must be 0), that the plant **landed** (re-read from disk, a distinctive byte-run confirmed present),
the exit code **after** (must be non-zero), the refusal **code**, the refusal **text**, that the file
is **named**, and that a refusal is never reported as carrying no grant.

### D-64's four named documents and their gate spellings — DISSOLVED AT THE GATE

Round 11 reproduced the first four of these end-to-end at `ALL CHECKS PASSED`, **exit 0**. All seven
now fail by name at **exit 1**:

| row id | code | refusal TEXT read from the gate's own output |
|---|---|---|
| `r11-cr01-a-explicit-digit` | `block-scalar` | `skills/map/SKILL.md: frontmatter is NOT in the canonical form [block-scalar] — line 7: a node starting at column 5 is introduced by \`>\`, which opens a folded block scalar header` |
| `r11-cr01-b-no-digit` | `block-scalar` | same code, same reason, same line |
| `r11-cr01-gate-a` | `block-scalar` | same |
| `r11-cr01-gate-b` | `block-scalar` | same |
| `r11-cr02-alias-through-compact-mapping` | `node-property` | `... [node-property] — line 6: a node starting at column 8 is introduced by \`&\`, which opens a YAML anchor` |
| `r11-cr02-dashless-control` | `node-property` | same |
| `r11-cr02-gate` | `node-property` | same |

The two spellings that diverged for eleven rounds — one refused loudly, one read as "carries no
grant" — land on **one answer, at one code, with one reason, at the gate**. Not one byte of
`scripts/frontmatter.ts`'s parsing logic changed to achieve it.

### The 27-64 interaction, recorded

With the twins generated and byte-gated, a plant on the twin ALONE would now ALSO be caught by
`freshness:skill-twins`. That is a genuine strengthening. The sweep deliberately plants on **both**
forms and runs `check-foundation-guards.js` in **isolation**, so the red is attributable.

## D-64 Part C — the demotion

`scripts/frontmatter.ts` carries a header block recording that it is no longer the safety authority,
naming `scripts/canonical-frontmatter.ts` as the module that renders the verdict and D-64 as the
decision, and stating that it remains a legitimate convenience reader.

**The restricted diff proves it is comment-only:**

```
$ git diff -U0 -- scripts/frontmatter.ts | grep '^[+-]' | grep -v '^[+-][+-]' \
    | grep -vE '^[+-]\s*//' | grep -vE '^[+-]\s*$'
(empty — every changed line is a comment or blank)
```

**Did the committed `.js` move? YES — and it is reported rather than explained away.**
`scripts/frontmatter.js` gained 41 lines and lost 2. `tsc` preserves leading comments, so the header
block is carried through to the build. The **parsing logic is byte-unchanged**, proven by comparing
both sides with comments and blank lines stripped:

```
code-only line counts : 821  ->  821
code-only diff        : IDENTICAL
every changed .js line is a comment: confirmed
```

### The consumer list: 5 -> 4, recorded rather than rounded

The plan's must_haves say the parser "keeps its **eleven** non-test consumers". Measured with
`git ls-files -z '*.ts' | xargs -0 grep -l 'from "./frontmatter.js"'` the pre-cutover answer was
**five**: the other four files the plan counted (`adapters-freshness.ts`, `canonical-corpus.ts`,
`kit-model.ts`, `skill-twins-freshness.ts`) only **mention** the module in prose and import nothing.

The cutover then moved it from **five to four**: `coordinator-resolution-precheck.ts` took *nothing*
from the parser except verdict-bearing symbols, so when those moved it stopped importing the module
entirely. That is a consumer genuinely lost, not a demotion failure — the module is still consumed by
four non-test modules **including the guard itself**, so D-64 Part C's "keeps its consumers, is not
deleted" holds. Widening the derivation until it reached eleven would have been the set-literal drift
this phase exists to delete.

## THE NARROWING — the cost of a canonical form, stated loudly

**This is the finding of the round that the plan did not anticipate, and it is not a wording change.**
Fourteen existing gate cases turned red on the cutover not because the gate stopped catching
something, but because a canonical form is a narrowing or it is not canonical.

Of the seven legitimate YAML spellings of ONE declaration that the suite's false-red control walks,
the canonical form **admits two and refuses five**:

| spelling | before | after |
|---|---|---|
| one-line plain scalar | admitted | **admitted** |
| block sequence (the shipped skill form) | admitted | **admitted** |
| plain scalar WRAPPED across lines | admitted | REFUSED `unrecognized-line` |
| quoted scalar WRAPPED across lines | admitted | REFUSED `quoted-on-plain-only-key` |
| value with a trailing `#` comment | admitted | REFUSED `plain-scalar-charset` |
| folded block scalar `>-` | admitted | REFUSED `block-scalar` |
| literal block scalar `|-` | admitted | REFUSED `block-scalar` |

The same applies to `name`, which is **not** a member of `DOUBLE_QUOTED_KEYS`: a double-quoted,
single-quoted, trailing-space or trailing-comment `name` is now refused. And a **folded
`description`** is refused, where the old reader saw through it.

**Measured cost on the live kit: ZERO.** All 17 adapters write plain `name:` and one-line `tools:`;
all 7 skills use the block sequence; 33/33 admit. The **latitude** is what is gone, and a future
author who hand-writes a folded `tools:` will be refused — loudly, by name, with an escape hatch on
the two keys that may be quoted.

**Two diagnostic losses, named rather than smoothed over:**

1. **The exact duplicate-key count is gone.** The guard used to report "declares the `tools` key
   **3 times**", asserted as an exact integer. Admission refuses at the *second* occurrence and never
   counts to three. Both behaviours go red naming the file; the new one tells the reader "more than
   once" instead of "three times". Admission is also **wider** here — it refuses a duplicate of ANY
   key, not only the two grant keys.
2. **Per-document multi-finding reporting is narrowed.** A document with two empty `tools:`
   declarations used to produce *both* the emptiness and the cardinality findings. An admission reader
   returns one refusal per document by construction. The property that matters for a gate — reporting
   **every offending file** — is fully preserved and is now pinned by the cross-file case.

Every affected pin was **re-expressed two-sided** rather than deleted: the surviving admitted spellings
keep their green control, and each newly-refused spelling gets its own assertion that it is refused by
name, with the bucket counts asserted so a row cannot move between them silently.

**One arm was at risk of silent coverage loss and a new case was added for it (Rule 2).** Every
pre-existing rogue-spawner fixture expresses its grant in a now-refused spelling, so all of them
convict at the refusal instead of at the arm — which would have left `non-coordinator carries a spawn
grant` with **no case that reaches it**. A canonical-form plant was added that is ADMITTED and then
convicted by the arm, with a non-vacuity assertion that it was *not* refused.

## Deviations from Plan

### 1. [authorized scope amendment] a FOURTH verdict call site

`scripts/coordinator-resolution-precheck.ts` (+ its committed `.js`) was added to `files_modified`.
Found while gathering checkpoint evidence; authorized by the human in the checkpoint resolution as
option 4a. Not in CI (`ci.yml:93` runs only `check-foundation-guards.js`) — which the resolution
correctly called an argument **for** cutting it over, not against: a verdict surface nobody watches is
exactly where a demoted authority survives quietly.

### 2. [measurement contradicts the plan] the consumer count is 5 -> 4, not eleven

Recorded above with the command that produced it.

### 3. [measurement contradicts the plan] `guard_distribution_pair` does NOT stay green under the sweep

The plan's task 3 says to plant on both forms "so `guard_distribution_pair` stays green and the
resulting red is attributable to the spawn guard alone". That was true for the round-11 reproductions
this sweep inherits. It stopped being true **because of the cutover this same plan mandates** — task 2
moved that guard onto the admission reader, so a non-canonical document refuses there too. The plan
asks for two things that cannot both hold.

What is asserted instead is **strictly stronger** than "exactly one FAIL": the **exact set** of
failing checks is pinned at `{WR-05, D-40}` — so KIT-03, the kit counts and every other guard must
stay green — plus an assertion that the pair rule's failure is the **same canonical-form refusal** and
**not** a `DIVERGE beyond the \`name\` value` finding, which is what preserves the original intent of
planting both sides.

### 4. [Rule 1 — caught in my own diff] the duplicate-key loop was written as a branch that cannot fire

The first draft of the cutover kept the cardinality loop as
`v.kind === "scalar" && occurrences.length > 1`. That is **dead** — a scalar yields exactly one value —
but it READS like a live floor. A dead branch wearing the costume of a live one is worse than no
branch: it is a check a future reader counts as covering something. It was deleted, the reasoning
recorded at the site, and the property pinned where it can actually be observed — at the gate.

### 5. [Rule 1 — caught by my own assertion] a guessed refusal code was wrong

The KIT-03 empty-`name` case was first written asserting `dangling-empty-key`. It failed red: the
fixture writes `name: ` with a trailing space, which is neither the `key: value` production nor the
`key:` production, so the real code is `unrecognized-line`. The code is now read off the gate rather
than inferred from the fixture's intent. Recorded because it is the assertion doing its job.

### 6. [pre-existing test updated] `frontmatter.test.ts`'s D-50 IN-05 consumer assertion

It hand-pinned `coordinator-resolution-precheck.ts` as a consumer. That file is no longer one. The
member was **replaced, not deleted** — `generate-role-adapters.ts` takes its place, so the case still
requires a named consumer beyond the guard — plus a negative assertion that the precheck is absent.

## Verification

| check | result |
|---|---|
| `npm run build` | exit 0 (asserted before any result was believed) |
| `node scripts/check-foundation-guards.js` (live tree) | **exit 0**, output BYTE-IDENTICAL to the pre-cutover baseline |
| gate wall clock | 0.54/0.52/0.52s before -> 0.55/0.53/0.52s after |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `npm run typecheck` (both lanes) | exit 0 |
| `npm run freshness` | exit 0 |
| `npm run freshness:adapters` | exit 0 |
| `npm run freshness:skill-twins` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1409 passed / 2 skipped across 39 files** — a FLOOR (baseline 1387) |
| `scripts/frontmatter.ts` changed by comment ONLY | **YES** — restricted diff empty |
| `scripts/frontmatter.js` code-only diff | **IDENTICAL** (821 -> 821 lines); the `.js` moved by the header comment alone, reported above |
| `DISTRIBUTION_PAIR_EXEMPT` count | **1 before, 1 after** — no exemption added (D-64 vacuity trap 3) |
| package manifest byte-unchanged (T-27-SC) | **YES** — no dependency installed by this plan |
| working tree clean after the sweep | **YES** — both planted files byte-clean, gate exits 0 on the committed tree |

Bare `npm test` was **never** run: it triggers a live claude-CLI lane that spends tokens and can hang.

## Known Stubs

None.

## Residuals and UNKNOWNs, stated rather than smoothed over

1. **`.planning/WINDOWS.md` entry 14 is CLOSED** by the tree-wide measurement above, with the
   15-value prose caveat kept.
2. **NEW (recorded to the ledger): the narrowing.** The canonical form admits 2 of 7 legitimate
   spellings of one declaration; a quoted `name` and a folded `description` are now refused inside the
   spawn-grant scan. Live cost measured zero; the latitude is gone.
3. **NEW (recorded to the ledger): 554 of 575 out-of-scan frontmatter files would refuse**
   (`flow-collection` 416, `unknown-key` 134, `block-scalar` 4). **Not exposure today** — those
   `.planning/` artifacts are not in `spawnGrantScan` and the ten-key schema is deliberately the kit's
   spawn schema, not a general YAML schema. It is a hard constraint on anyone who later widens that
   scan, and **no exemption was added for it**.
4. **`UNKNOWN - verify`: the 12 module-only corpus rows are proven at module level only.** The
   delimiter family cannot be grafted into another document's frame without destroying the construct
   under test. 27-63 proves them against the reader; this plan does not prove them at the gate.
5. **The sweep proves closure over the shapes rounds 1-11 REPRODUCED, and nothing more.** The argument
   that no unenumerated construct exists is structural and belongs to 27-62 — the reader admits an
   enumerated shape and refuses every other byte — not to this sweep.
6. **`admittedValuesFor` and `admittedKeyHasValue` are new total accessors** on
   `canonical-frontmatter.ts`, declared outside the admission core. They re-read no bytes and
   re-decide nothing. 27-62's `ok: false`-appears-once and no-default-branch source assertions still
   pass unchanged.

## Self-Check: PASSED

- `.planning/phases/27-spawn-correctness-kit-set-authority/27-65-SUMMARY.md` — FOUND
- `scripts/check-foundation-guards.ts` / `.js` — FOUND
- `scripts/coordinator-resolution-precheck.ts` / `.js` — FOUND
- `scripts/frontmatter.ts` / `.js` — FOUND
- `scripts/canonical-frontmatter.ts` / `.js` — FOUND
- commit `cdc7fde` — FOUND
- commit `64a383f` — FOUND

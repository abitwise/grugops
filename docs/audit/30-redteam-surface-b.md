# Red-team surface B — the round log

**Surface B (D-21):** the derived checkpoint set, the collapsed governance reader, the structure
validator, the guarantees render and the run banner.
**Surface A** — the two-key hook path plus `emitVerdict`'s test-integrity refusal — is attacked
afterwards, in plan 30-11, because its floor ids come from this surface's derived set.

**The closure standard this log is kept against (D-23, RESEARCH §Red-Team Architecture).** A round
closes a finding only when all six hold:

1. **RED first.** The bypass is a failing test before the fix exists. A test written after a fix
   proves the fix compiles, not that it discriminates.
2. **Mirror reproduction.** The pre-fix mirror exits 0 and the fixed tree exits 1, on the
   **committed `.js`** and never on the `.ts`.
3. **Mutation / discrimination proof.** The predicate is deliberately broken in the artifact the
   tests load; the tests must go red.
4. **Two independent reviews at the strongest available model** find nothing new on the surface.
5. **Self-reproduction** of every closed bypass by the fixing agent, against the fixed build.
6. **Structural fix, not a heuristic** — one format-aware authority per predicate; delete the second
   grammar; move the gate to its point of effect; unfreeze a frozen weaker duplicate.

**A green suite is not an argument for closure and is not offered as one anywhere in this document.**
This repository has documented cases across the current milestone of a green suite that still
contained a bypass; every round below was run against a fully green suite and found bypasses anyway.

**The round cap (D-22).** Four gap-closure rounds on this surface. A finding after the fourth becomes
a recorded backlog item or a follow-up phase, never a fifth round, and the fence text is written down
rather than negotiated.

**The mirror, and its premise.** The mirror is `git archive HEAD | tar -x` into a temporary
directory, which is the committed tree exactly. Its premise is asserted rather than assumed: before
any reproduction the sha256 of each mirrored `.js` is compared against `git show HEAD:<path>`.

```
mirror HEAD = bec99cd
scripts/validate-agent-factory.js  931b09425cbd9562a495862a49cab485d389d30f571f048849d434df14fe1f81  premise OK
scripts/checkpoints.js             55ae38e072675de313c789ec7ff924dd34243f901215296e1756a8ee827cd992  premise OK
scripts/context-io.js              eb46362b9aa3e985df529367d7d9b0fdec9c422920c76627d4cd25b41c95ecd9  premise OK
```

---

# Round 1 — 2026-09-05

**Predicates attacked:** the derivation (`scripts/checkpoints.ts`), the collapsed reader
(`scripts/context-io.ts`), the structure validator (`scripts/validate-agent-factory.ts`), and — in
the same round, second task — the render, the freshness gate, the banner and the language-gate
wiring.

**Baseline before the round:** `npx vitest run --exclude '**/scripts/e2e/**'` → 1 failed / 2722
passed / 2 skipped. The one failure is the recorded pre-existing `scripts/frontmatter.test.ts` D-49
control on a Phase 29.1 planning document (`V-30-01-01` in the phase's `deferred-items.md`), which
neither this plan nor this phase caused. Every gate in `package.json`'s check and freshness families
was green **except** `check:diff-disposition`, which was already red — see finding B-4.

## Findings

| id | predicate | what it is | severity | direction | fix form |
|---|---|---|---|---|---|
| B-1 | the validator | the governance-config form check is asked only at the config the reader consults SECOND | high | permits a declaration that has no legal form | gate moved to its point of effect + one authority for the positions |
| B-2 | the reader | `checkpointRefusals` is produced and has no non-test consumer, while its contract says a run can say what it ignored | low | fail-closed, but silent | the same positional fix; contract corrected to what is true; residual recorded |
| B-3 | the derivation | the tag corpus is the FIRST `## Stop conditions` section per workflow, while the authority states and asserts "every workflow's stop section" | medium | a declared stop that nothing governs | canonical form: exactly one stop section, a repeat refused by name |
| B-4 | the companion obligation | three watched clauses added by plan 30-09 carry no disposition row; the gate was red at HEAD and the plan that reddened it did not run it | medium | a gate red in the tree, unnoticed | the missing companion rows authored; the omission recorded |

---

## B-1 — the config form check is asked at the file the reader consults SECOND

### What it is

`readGovernanceConfig` (`scripts/context-io.ts`) resolves a governance configuration from two
locations **in order**: the repo-dropped `.grugops/factory.config.json` first, then the in-kit
`agent-factory/config/factory.config.json`. `checkConfig` in `scripts/validate-agent-factory.ts` read
only the second one, by a fixed literal relative path under `KIT_ROOT`.

So every finding this validator can produce about a governance configuration — the required-key loop,
the retired-`autonomy` refusal (D-05), the `checkpoints` form check (D-08), the TINT-03 carve-out,
the WR-01 deploy boolean and the v1.2 dial enums — was being asked at the file the reader consults
second, and never at the file that decides runtime behaviour.

This is P27 round 10's shape: **a predicate that accepts the right characters and is never consulted
at the position that matters.** It survived because this repository carries no
`.grugops/factory.config.json`, so the shadowing file has never existed here — the defect is
invisible on the tree that would have caught it.

### RED first

`scripts/validate.test.ts`, a new block driving the nine payloads through the shadowing position,
authored and run **before** any change to the validator:

```
 Test Files  1 failed (1)
      Tests  10 failed | 58 passed (68)

 FAIL … > an unknown checkpoint id written to the SHADOWING .grugops config is refused
AssertionError: exit status for {"mode":"m","cadence":"c","checkpoints":{"not_a_real_checkpoint":"off"}}:
  expected +0 not to be +0 // Object.is equality
 FAIL … > the TINT-03 carve-out written to the SHADOWING .grugops config is refused
AssertionError: exit status for {"mode":"m","cadence":"c","checkpoints":{"test_integrity":"off"}}:
  expected +0 not to be +0 // Object.is equality
 FAIL … > the checked positions EQUAL the reader's candidate list — derived on both sides
TypeError: cio.governanceConfigCandidates is not a function
```

Nine of nine must-refuse payloads exited **0**. The full sweep, measured against the committed
artifact, with the same bytes in each position:

| payload | in the kit config | in `.grugops/factory.config.json` |
|---|---|---|
| `{"cadence":"kanban"}` (no `mode`) | exit 1 | **exit 0** |
| `{"…","autonomy":"pr"}` | exit 1 | **exit 0** |
| `{"…","checkpoints":{"nope":"off"}}` | exit 1 | **exit 0** |
| `{"…","checkpoints":{"open_pr":"OFF"}}` | exit 1 | **exit 0** |
| `{"…","checkpoints":"not-an-object"}` | exit 1 | **exit 0** |
| `{"…","checkpoints":{"test_integrity":"off"}}` | exit 1 | **exit 0** |
| `{"…","production_requires_human_confirmation":false}` | exit 1 | **exit 0** |
| `{"…","security":{"asvs_level":"L4"}}` | exit 1 | **exit 0** |
| `not json at all` | exit 1 | **exit 0** |

### The premise, asserted

A refusal that never reaches the runtime is a smaller finding than one that does, so the harness's
premise — that the shadowing file is the one that governs — is measured rather than argued. Driving
the committed `scripts/context-io.js` and `scripts/checkpoints.js` against the same tree:

```
source                                        = ok
checkpoints.test_integrity                    = off
EFFECTIVE test_integrity, key two present     = off
banner                                        = checkpoints not at default:
                                                test_integrity=off authorized by
                                                GRUGOPS_FLOOR_TEST_INTEGRITY=<name>
```

The value the validator states has **no legal form** is read, resolved and reported as the effective
disposition. (Its runtime blast radius is bounded: `emitVerdict` refuses a non-clean integrity result
unconditionally and consults no matrix cell, so the carve-out's point-of-effect half still holds.
What is defeated is the form rule — which is the rule D-08 makes the validator's own job.)

### Mirror reproduction

Same attack tree, two artifacts:

```
$ VALIDATE_KIT_ROOT=<tree> VALIDATE_ROOT=<tree> node MIRROR/scripts/validate-agent-factory.js
ALL CHECKS PASSED
mirror exit=0

$ VALIDATE_KIT_ROOT=<tree> VALIDATE_ROOT=<tree> node scripts/validate-agent-factory.js
  ERROR    .grugops/factory.config.json: the retired "autonomy" key is present. …
  ERROR    .grugops/factory.config.json: "checkpoints.test_integrity" must not be "off" (TINT-03 …)
  ERROR    .grugops/factory.config.json: unknown checkpoint id "checkpoints.not_a_real_checkpoint" …
3 ERROR(S)
tree exit=1
```

### The structural fix, in one sentence

**The gate is moved to its point of effect:** the whole per-file predicate now lives in one function,
`checkConfigForm`, and is asked at every position the governance reader would consult, with the
positions imported from `governanceConfigCandidates` in `scripts/context-io.ts` so that "which file
is the governance configuration" keeps exactly one answer.

Three properties hold it in place, each asserted rather than stated:

- **One authority for the predicate.** There is no second, laxer copy for the second file; identical
  bytes produce identical findings at both positions, differing only in the path named.
- **One authority for the positions.** The candidate list is imported, never re-spelled, so a third
  location added to the reader later reaches this gate without an edit. `scripts/context-io.test.ts`
  still asserts the order is spelled exactly once in that file.
- **Checked once per file.** The second candidate resolves to the kit config in this repository and
  in every single-tree fixture; the identity is compared on the RESOLVED path, so a positional repair
  does not become a double-reporting defect.

The pattern itself is unchanged. Nothing was widened.

### Mutation proof

Mutations applied to the **committed `scripts/validate-agent-factory.js`** (the artifact the tests
load), each verified present in the emitted bytes by grep before the run, each restored afterwards:

| mutant | outcome |
|---|---|
| the state-candidate arm dropped (`for (const abs of [])`) | **KILLED** — 10 failed / 58 passed |
| the resolved-path dedupe dropped | **KILLED** — 2 failed, one of them the pre-existing per-fixture finding-count case, which is that case doing its job |

---

## B-2 — the reader's refusals have no reader

### What it is

`readGovernanceConfig` accumulates `checkpointRefusals` for a `checkpoints` value that is not an
object, for a key that is not a roster member, and for a value that is not one of `block|notify|off`.
The field's own contract says the entry is dropped and recorded "so the run can say what it ignored
instead of ignoring it silently (D-08)".

Measured: **no non-test consumer reads it.** `hooks/guard.ts` takes `.config.checkpoints` and
discards the rest; nothing else calls the reader outside tests.

```
$ git grep -n "checkpointRefusals" -- '*.ts' | grep -v '\.js:'
scripts/checkpoints.test.ts  (8 sites)
scripts/context-io.test.ts   (2 sites)
scripts/context-io.ts        (7 sites — the declaration and the returns)
```

The consequence is bounded and it is in the safe direction: a dropped entry never becomes a roster
member, and a coerced value reaches `block` by rule, so nothing is lowered. What is lost is
visibility — and the only runtime surface that could report the drop, the banner, truthfully reports
`all checkpoints at default`, because the offending entry never entered the matrix.

### Why this is B-1's finding and not a separate mechanism

D-08's design puts the refusal at the validator (`refused by validate-agent-factory.ts`) and the
strictness at the runtime (`gated as block`). The runtime is silent **by design**; the validator is
the surface that speaks. B-1 is precisely the discovery that the speaking surface was not asked at
the position where such a declaration is written. So the structural fix is the same one, and after it
an unknown id or a non-canonical disposition in the governing file is a named refusal at exit 1.

### The structural fix, in one sentence

**The gate is moved to its point of effect (B-1's fix), and the field's contract in
`scripts/context-io.ts` is left stating what is true** — the refusals are returned to the caller — with
the publication point named rather than assumed. `scripts/context-io.test.ts` pins the refusal in both
directions so the field cannot quietly stop being produced while its publication is still owed.

### The residual, recorded rather than closed

At **hook runtime** the refusals are still not printed. The publication point is `hooks/guard.ts`,
which is red-team surface A's file and plan 30-11's subject, and it is byte-frozen under D-24 with a
same-commit companion obligation. Adding a print there from this plan would put a change into the
surface that has not been attacked yet, in the same round that is attacking a different one.

Recorded as `V-30-10-01` in the phase's `deferred-items.md`, with the note that surface A's round owns
it. This log does not claim it closed.

---

## B-3 — the corpus is the FIRST stop section, not every stop section

### What it is

`deriveCheckpoints` locates each workflow's tag corpus with `locateSection(text, "## Stop conditions")`,
which answers about the **first** unfenced occurrence of the heading. Both arms of the walk are bounded
by that one range: pass A iterates it, and pass B's independent bullet denominator intersects with it.
`assertLiveCorpusCardinality` then compares `sectionsFound` against `filesWalked` — one located section
per file, which can only ever hold, because the walk locates one.

A **second** `## Stop conditions` section in the same file is therefore invisible to everything. A
canonically tagged bullet written there is neither collected, nor refused, nor counted: it declares a
human stop that never becomes a roster member, has no config cell and no enforcement — which is
exactly the fault `compareRosterToDerivation`'s corpus-only message exists to name.

### The measurement, on the live tree

A second `## Stop conditions` section carrying
`- A second declared stop nobody governs. \`checkpoint: planted_shadow_stop\`` was appended to
`agent-factory/workflows/11-retro.md` and every gate was run against the committed artifacts:

```
derivation      ids = 10, totalSites = 16, examined = 38, counted = 38   (all unchanged)
cardinality     OK
roster/deriv    OK
site counts     OK
validator       ALL CHECKS PASSED    exit 0
foundation      ALL CHECKS PASSED
diff-disposition 1 CHECK(S) FAILED — "changed clause, no disposition row"
```

Only a diff-hygiene gate noticed, and its finding is dischargeable by writing a disposition row; it
does not run at all in an installed kit. Committed with a row, the shadow stop is permanently
invisible with every gate green. The file was restored (`git status --short -- agent-factory/` empty).

### RED first

```
 Test Files  1 failed (1)
      Tests  2 failed | 81 passed (83)

 FAIL … > a SECOND stop section in one file is refused by name, not silently ignored
AssertionError: a second stop section was tolerated: expected null not to be null
 FAIL … > the LIVE corpus carries exactly one stop section per workflow — derived, not assumed
TypeError: fm.unfencedHeadingIndices is not a function
```

### The premise, asserted

The refusal is only meaningful if the planted bullet would otherwise have gone unseen — a plant the
collector never reached for another reason would make the case pass while measuring nothing. So the
same bytes are driven through `CHECKPOINT_TAG_RE` and `CHECKPOINT_KEYWORD_RE` directly and both are
shown to accept it, and the tag's captured id is asserted. The live one-per-file count is additionally
floored for vacuity: the counter is driven at zero, one and two on planted bytes, and its fence arm is
exercised, because a counter that could only ever answer one is the defect it was written to close.

### Mirror reproduction

```
$ node probe-b3.mjs file://MIRROR/scripts/checkpoints.js <attack tree>
ACCEPTED — ids=["control_stop"] sites=1 sections=2 counted=2
mirror exit=0

$ node probe-b3.mjs file://scripts/checkpoints.js <attack tree>
REFUSED — checkpoints: 01-double.md carries 2 `## Stop conditions` sections (lines 3, 11). The tag
corpus is ONE stop section per workflow: only the first is located, so a bullet in any later one is
neither collected nor refused nor counted, and a tag written there would declare a stop nothing
governs. Merge the sections rather than repeating the heading
tree exit=1
```

`sections=2` in the mirror line is the two files' first sections; the planted second section is not
among them, and its bullet is not among the two counted — the finding, visible in the mirror's own
numbers.

### The structural fix, in one sentence

**The canonical form is applied to the corpus itself and the second grammar is not written:** a
workflow declares its stops in exactly one `## Stop conditions` section, a repeated heading is refused
by name, and the occurrence count is asked of the ONE heading authority
(`unfencedHeadingIndices` in `scripts/frontmatter.ts`) rather than counted by a private scan here.

Two sub-decisions, both deliberate:

- **The heading authority learned to answer at all positions rather than gaining a sibling.** A
  consumer cannot ask "does this occur more than once" without either that function or a second copy
  of the `trimEnd()` equality, and the second copy is the answer this tree refuses.
  `unfencedHeadingIndex` is now its first-match adapter — one implementation, two questions, no new
  heading grammar, and the fence toggle unchanged so a workflow QUOTING the heading inside a fenced
  example still carries one section.
- **Collecting from every occurrence was the other available repair and it is the wrong one.** It
  would make the corpus depend on how many times an editor repeated a heading, and it would leave
  `sectionsFound === filesWalked` asserting nothing.

### Mutation proof

| mutant (applied to the committed `scripts/checkpoints.js`, marker verified by grep) | outcome |
|---|---|
| `if (false && occurrences.length > 1)` | **KILLED** — 1 failed / 82 passed |
| restored | 83 passed |

### One pin moved, and why the direction is right

`scripts/check-diff-disposition.test.ts` asserted that the heading equality still lives in
`scripts/frontmatter.ts` by testing `site.startsWith("unfencedHeadingIndex")`. The all-positions
implementation is named `unfencedHeadingIndices`, which is **not** a prefix-extension of the old name,
so the pin went red on a change that moved nothing about the property it guards.

The pin was not merely re-pointed. The property was never "one particular function declares it"; it is
"the heading authority still declares it, in ONE place". Both halves are now asserted, and the second
is strictly stronger than what was there: a second copy of the equality inside the authority — the
drift a same-module split invites — is red.

---

## B-4 — a companion obligation nobody discharged, on a gate nobody ran

### What it is

Plan 30-09 added one anchored generated pointer line to `README.md`, `AGENTS.md` and
`agent-factory/README.md`. All three are in the LANG-03 watched corpus, so each added clause owed a
disposition row under `docs/audit/29-style-dispositions/`. None was written, and
`check:diff-disposition` has been **red at HEAD** since commit `b2b7612`:

```
  FAIL  diff disposition — changed watched file(s): 3 finding(s) over 39 elements
        AGENTS.md:106 (added) — no disposition row
        README.md:58 (added) — no disposition row
        agent-factory/README.md:85 (added) — no disposition row
```

Plan 30-09's SUMMARY lists nine gates in its verification table. `check:diff-disposition` — the one
gate its change could redden — is not among them.

### Why it is a round-1 finding and not merely a chore

This is the harness-premise class pointed at a *plan's own verification*: a change acquired a
companion obligation, the obligation was not discharged, and the verification record that would have
caught it did not include the gate that measures it. A companion obligation nobody discharges and
nobody measures is indistinguishable, from the outside, from one that does not exist.

### The structural fix, in one sentence

**The missing companion rows were authored** — `docs/audit/29-style-dispositions/30-10.md`, three rows,
one per pointer line — **and the omission is recorded under the plan that discharged it rather than
back-dated into the plan that incurred it**, so the trail says when the obligation was actually met.

```
$ npm run check:diff-disposition
  PASS  diff disposition — changed watched file(s): 0 findings over 39/39 elements
ALL CHECKS PASSED
```

---

## The four standing questions, answered for each predicate

Every question is answered for every predicate, **including the answers that found nothing** — an
unrecorded negative is indistinguishable from a question nobody asked.

### Predicate 1 — the derivation (`deriveCheckpoints` and the three-arm union)

**What set does it ENUMERATE?**
Four sets. (a) The workflow files, from `kit-model.listWorkflows`, which reads the directory and
filters by the numbered-workflow rule — derived, not listed, and its cardinality is pinned in
`guard_kit_counts`. **Nothing found.** (b) The tagged ids, from the canonical tag pattern. **Nothing
found** — the pattern is an anchored allow-list with no alternation, and 30-04 already proved seven
non-canonical constructions are refused by name. (c) The floor arm, imported from `SAFETY_FLOORS`,
and the legacy arm, derived from `LEGACY_AUTONOMY_GRADES`'s rows. **Nothing found.** (d) **The
sections** — and this is where the finding is: the enumerated set is the FIRST stop section per file
while the authority states it is every workflow's stop section. **Finding B-3.**

**What is its INPUT ASSEMBLED FROM?**
`text.split("\n")` for pass A's line array, `fencedLineFlags(text)` for the fence toggle,
`locateSection(text, heading)` for the range, and `unfencedMatchIndices(text, STOP_BULLET_RE)` for
pass B's denominator. The coordinate-shear question — do the two passes index the same array? — was
measured rather than argued: over a planted document, `unfencedMatchIndices` returned `[4,5,9,13,14,17]`
and the lines at those indices in `text.split("\n")` were exactly the six bullets. Both passes use
0-based indices into the same split, and `inSection` is the same predicate on both. **Nothing found.**
A CRLF document degrades loudly rather than silently: the trailing `\r` breaks the `$`-anchored tag
pattern while the keyword selector still fires, so the line is refused by name.

**At WHICH POSITIONS is it even ASKED?**
Two answers, one of them uncomfortable. (a) Within a file: the keyword selector is asked at every
unfenced line of the located section, bullet or not, and is deliberately WIDER than the tag pattern,
so a canonical tag can never be collected without being offered to the refusal — 30-04 asserted that
superset relation directly. **Nothing found.** (b) Across the tree: `assertRosterMatchesDerivation`,
`assertSiteCounts` and `assertLiveCorpusCardinality` are called **only from
`scripts/checkpoints.test.ts`**. They run in CI, through vitest, and they do **not** run in the
shipped kit — `scripts/validate-agent-factory.js` does not call them. A user who edits a workflow's
stop bullets in an installed kit gets no two-sided check. This is **recorded, not fixed**: wiring the
derivation into the shipped validator would make a legitimately customised kit red, which is a scope
and a semantics decision rather than a defect repair. See `V-30-10-02` in `deferred-items.md`.

**Does the HARNESS assert its own PREMISE?**
The fixture-based cases carry a CONTROL file precisely so a probe's expected answer is "the control id
and nothing else" rather than "nothing" — 30-04 built that in. The three probes whose expected outcome
was `accepted` (a tag past the boundary, inside a fence, in another section) were each re-run in 30-04
with the plant read back and a fence-blind control reader shown to count one more. **Nothing found**
in the pre-existing cases. The new B-3 cases assert their own premise as described above, and the live
one-per-file count is floored against vacuity.

### Predicate 2 — the collapsed reader (`readGovernanceConfig` / `readCheckpointMatrix`)

**What set does it ENUMERATE?**
The two candidate paths; the three config keys (`context.human_admission`, `context.audit_retention`,
`checkpoints`); and the roster, walked from `CHECKPOINT_DEFAULTS`. The matrix's key set is structural
— the result starts as a full copy and is overwritten in place — and the count is asserted anyway
against a denominator taken from the roster table rather than from the filling loop. **Nothing found.**

**What is its INPUT ASSEMBLED FROM?**
One `JSON.parse` of one `readFileSync`, with the matrix read from the same parsed bytes and carried on
every `source: "ok"` return. A seventeen-payload sweep was driven through the committed
`scripts/context-io.js`, each in a fresh temporary repository, checking whether ANY input lowered a
roster member below its default:

`__proto__` inside `checkpoints` · `__proto__` at top level · a `constructor` key · a duplicated
`checkpoints` key · a duplicated inner key · a unicode-escaped key · a unicode-escaped value · a
trailing-space value · `OFF` · `false` · an array matrix · an object value · a numeric key ordered
first · a BOM · a Cyrillic homoglyph key · `null` · a whole-file array.

Five inputs produced a value below the default, and all five are **legitimate declarations**, not
bypasses: duplicated JSON keys resolve to the last per the JSON grammar, unicode escapes denote the
same string, and the numeric-key payload declares `notify` outright. Every one of them is a floor
member, so it still needs key two. Twelve reached `block` by rule with a refusal recorded, and the BOM
reached `unreadable`. **Nothing found.**

**At WHICH POSITIONS is it even ASKED?**
`hooks/guard.ts`, `admit()`, `admitAndAppend()` and `hooks/admission-guard.ts` — the four consumers
30-03 drove ten corruption shapes through, all fail-closed. This round asked the question one level
out, about the reader's OUTPUT rather than its input, and found **B-2**: `checkpointRefusals` is
produced at every position and consumed at none.

**Does the HARNESS assert its own PREMISE?**
The order case writes DIFFERENT matrices to the two candidates and asserts the first wins, so it
cannot pass on two identical files. The bounding case plants a config at a path the list does not name
and asserts `source: "absent"`, so the list bounds the read rather than merely ordering it. **Nothing
found.**

### Predicate 3 — the structure validator (`checkConfig`)

**What set does it ENUMERATE?**
The legal checkpoint ids (imported from the roster — a source scan asserts no roster id is written as a
literal in the validator except the two that are also config keys) and the canonical dispositions
(imported). **Nothing found in the key set.** The set of FILES it enumerates was one, and the reader's
was two. **Finding B-1.**

**What is its INPUT ASSEMBLED FROM?**
`kitRead(rel)` → `JSON.parse`, with a non-object parse result refused before any dereference (CR-03).
The validator and the reader were paired across fourteen payloads to see whether two authorities had
grown two grammars over one question:

| payload | validator | reader refusals |
|---|---|---|
| `__proto__` in `checkpoints` | exit 1 | 1 |
| `constructor` key | exit 1 | 1 |
| duplicated `checkpoints` key | exit 0 | 0 |
| unicode-escaped key / value | exit 0 | 0 |
| trailing-space value | exit 1 | 1 |
| `OFF` | exit 1 | 1 |
| `false` | exit 1 | 1 |
| array matrix | exit 1 | 1 |
| object value | exit 1 | 1 |
| numeric key first | exit 1 | 1 |
| homoglyph key | exit 1 | 1 |
| `null` matrix | exit 1 | 1 |
| `test_integrity: "off"` | exit 1 | **0** |

Thirteen of fourteen agree exactly. The fourteenth is the TINT-03 carve-out, and its asymmetry is
D-08's design rather than drift: the form rule is the validator's, and the runtime rule is
`emitVerdict`'s unconditional refusal of a non-clean integrity result, which consults no matrix cell
at all. **Nothing found.**

**At WHICH POSITIONS is it even ASKED?**
**Finding B-1**, in full. Additionally: the validator's own reach is `VALIDATE_KIT_ROOT` plus
`VALIDATE_ROOT`, and the reader's default base is `join(import.meta.dirname, "..")` — the same
expression `STATE_ROOT` falls back to, which is why the repair anchors the new positions at
`STATE_ROOT` and why that anchoring is provable rather than chosen.

**Does the HARNESS assert its own PREMISE?**
The `good` fixture the sweep builds each tree from exits 0 on its own, so every refusal is attributable
to the configuration under test — 30-06 established that and it was re-checked here. The new cases add
a positive control (a VALID `.grugops` config must still pass, so the arm is not a blanket refusal),
an absence control (an absent file changes nothing), and a double-reporting control. **Nothing found**
beyond what B-1 names.

## The two additional P29 probes

**A unified authority's SCOPE is a new degree of freedom — what does the single reader now read that
neither predecessor did?**

For the D-12 collapse itself: **nothing**, and that is asserted rather than stated —
`scripts/context-io.test.ts` plants four foreign keys and asserts the result's own key set. Re-asked
this round with the *positional* lens rather than the *key* lens: both deleted and surviving readers
resolved the same two paths in the same order, so the collapse added no location either. **Nothing
found.**

But the probe generalises, and generalising it is what found B-1. The reader's scope did not widen;
what widened was the **gap** between the reader's scope and the validator's. A collapse that leaves one
authority answering "which file governs" and another authority silently answering a narrower version of
the same question has produced exactly the divergence the collapse was meant to remove — one level up,
between modules rather than within one. The repair publishes the answer so the second module asks
instead of assuming.

**Is each must-change-together rule COMMIT-scoped or merely RANGE-scoped?**

| rule | mechanism | scope | verdict |
|---|---|---|---|
| the config twins (`factory.config.json` ↔ its seed ↔ the markdown twin) | `config-governance-consistency.test.ts` byte/derivation equality | **state equality**, evaluated at every HEAD | cannot self-disarm; there is no range for a companion to have been touched in |
| the disposition companions (`check-diff-disposition`) | per-CLAUSE attribution to the CARRIER that changed it — `listCarriers(base)` walks `rev-list base..HEAD` and adds the working tree as a named carrier | **commit-scoped**, per clause | correct; this is the exact defect Phase 29 already closed (`allChangedFiles.includes(companion)` over the whole range, which satisfied every frozen clause for the rest of a phase once any commit touched the registry) |
| the guard freeze (`FROZEN_GUARD_BLOB`) | a sha256 of `hooks/guard.ts` pinned in `floor-invariance.test.ts` | **state equality** | cannot self-disarm. The honest statement of what it delivers is "code and pin agree at every green HEAD", which is weaker than "they changed in one commit" and is what D-24 relies on; a two-commit split is red at the intermediate HEAD and green at the end state, so the property survives only because the end state is what ships |

**Nothing found** on this probe. It is recorded because the negative is the finding's absence, not the
absence of the question.

## Round 1, what was NOT established

- The derivation's two-sided assertions run in vitest and **not** in the shipped validator; an installed
  kit has no gate over its own stop-bullet tags. Recorded, not fixed (`V-30-10-02`).
- The reader's refusals still have no runtime publisher; the publication point is surface A's file
  (`V-30-10-01`).
- The tag/untag judgement over untagged stop bullets is prose policy and is held as content per the
  Phase 29 D-59 posture. No probe can falsify it and none was run against it.
- **Suite greenness establishes nothing here and is not offered.** Every finding above was found on a
  tree whose suite was green apart from one recorded pre-existing failure.

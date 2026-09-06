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
| B-5 | the render's data sources | the config-candidate list is a restatement of the reader's, held by a case documented as two-sided and measurably one-sided | medium | the freshness mirror renders from fewer inputs than the real render reads | the second grammar deleted — the render imports the reader's published list |
| B-6 | the render's count assertion | its stated scope is wider than the mechanism: both sides read the same registry, so a lost row moves both together | disclosure | the render publishes a short document with its own gate green | the bound stated at the site; the covering authority named and asserted |
| B-7 | the zero-config differential | the structural payload arm asserts its CARDINALITY and not its SET | medium | a shape silently drops out of the differential | the element set asserted two-sided |
| B-8 | the language-gate corpus | a consumer of the post-exemption scan set exists today while the authority's comment presents that as hypothetical | disclosure | none — the narrowing fails closed at that consumer | the claim corrected; the consumer split derived and pinned two-sided |

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

## B-5 — the render restated the reader's candidate list, and the holding case was one-sided

### What it is

`scripts/generate-guarantees.ts` declared `GUARANTEES_CONFIG_CANDIDATES` — the two governance-config
paths — as its own literals, with a comment justifying the duplication ("scripts/context-io.ts owns
config resolution and keeps its candidate list private, so a mirror has no way to ask it for the
paths") and a harness case described as holding it **two-sided** against the reader's source.

Both halves failed.

- **The case was one-sided.** It looped over the restated list and asserted each path appears in
  `context-io.ts`. Nothing asserted the converse. A candidate ADDED to the reader therefore left the
  restatement a strict subset, the freshness mirror copied fewer inputs than the real render reads,
  and the gate would byte-compare two documents rendered from different sources — a comparison
  between two different questions, reported as `STALE` or `fresh` with equal confidence.
- **The premise expired in the same round.** Finding B-1 required the reader to publish its candidate
  list so the structure validator could ask which files govern. Once it is published there is nothing
  left for a restatement to be justified by.

### RED first

The one-sidedness was established by construction rather than by reading: a third candidate was
planted in the reader's array in each artifact, and the render's declared inputs were read back.

### Mirror reproduction

```
$ # MIRROR (pre-fix, committed .js at bec99cd) — a third candidate planted in scripts/context-io.js
  mirror GUARANTEES_DATA_SOURCES = ["docs/audit/28-claim-registry.md",
                                    "docs/audit/28-residual-sizing.md",
                                    ".grugops/factory.config.json",
                                    "agent-factory/config/factory.config.json"]
  mirror length = 4  pin = 4
  the freshness gate PIN is SATISFIED — the mirror will copy 2 of the reader's 3 candidates
mirror exit=0

$ # CURRENT TREE (post-fix) — the SAME third candidate
  tree GUARANTEES_DATA_SOURCES = [... , ".grugops/factory.config.json",
                                        ".grugops/factory.config.local.json",
                                        "agent-factory/config/factory.config.json"]
  tree length = 5  pin = 4
$ node scripts/guarantees-freshness.js
Guarantees freshness check FAILED: the generator declares 5 data source(s) where
GUARANTEES_DATA_SOURCE_COUNT pins 4 — refusing to build a mirror whose inputs are not the ones the
render reads. A mirror short by one input compares the committed document against a regeneration
that never had the same sources.
tree freshness-gate exit=1
```

The mirror is silent about a candidate it will not copy; the fixed tree refuses by name and sends a
human to move the pin. Both artifacts were restored afterwards (`npm run freshness:guarantees` → exit
0 on the unmutated tree).

### The structural fix, in one sentence

**The second grammar is deleted:** the reader publishes `GOVERNANCE_CONFIG_RELPATHS` — derived from
the one candidate array under an empty base, so the two views cannot disagree — and the render
imports it, so a candidate added to the reader arrives in the mirror's declared inputs without an
edit and trips `GUARANTEES_DATA_SOURCE_COUNT` by name.

The harness case that held the restatement is replaced rather than repaired: it now asserts IDENTITY
with the reader's list and that no candidate path is spelled as a literal in the generator's own
source. Repairing the one-sidedness would have kept a copy to hold.

### Mutation proof

| mutant | outcome |
|---|---|
| a third candidate in the reader (above) | **KILLED** — the freshness gate refuses by name; the mirror at the pre-fix artifact did not |
| `CONFIG_PATH_SITE_COUNT` left at 10 after the departure | **KILLED** — `scripts/context-io.test.ts` D-13 reported `expected 9 to be 10` and named the site list |

### One pin moved, in the direction the tree wants

`CONFIG_PATH_SITE_COUNT` fell **10 → 9**. The D-13 scan enumerates every tracked source that spells a
path ending in `factory.config.json`; `scripts/generate-guarantees.ts` no longer spells one, because
it imports the list instead. The pin's own rule is that a number moves only with a written reason and
never by widening the predicate — the reason is recorded at the pin, and the predicate is untouched.
This is the REMOVE direction: the tree has one fewer place spelling a config path, not one more.

---

## B-6 — the count assertion's stated scope is wider than the mechanism

### What it is

The render refuses an EMPTY join and a SHORT one, asserting `guaranteesJoin().length` against
`declaredSafetyRows()` — a raw line pass over the registry's bytes that shares no loop, parser or
intermediate with the join. The module's header presents that equality as what stops a render
"publishing three of six safety rows".

**Both sides read the same file.** The equality catches a PARSE that drops a row. It cannot catch a
REGISTRY that loses one, because the loss moves both numbers together.

### The measurement

On a hermetic `git archive HEAD` copy, one row's `- kind: safety` was changed to
`- kind: architecture`:

```
declaredSafetyRows = 5        (was 6)
join length        = 5 -> C-28-001, C-28-010, C-28-018, C-28-023, C-28-032
RENDER SUCCEEDED, rows published = 5
```

The equality is satisfied and the render publishes five of six safety claims.

### Why there is no mirror exit-0 / exit-1 pair for this one, stated rather than manufactured

This is a **disclosure, not a bypass**, and the distinction is load-bearing. Making the render refuse
the input would mean giving it a second opinion about how many safety claims the registry declares —
and `scripts/check-audit-register.ts` already owns that question, deliberately and with its reason
written down: `CLAIM_KIND_CARDINALITY` is a hand-declared measurement baseline, legitimate precisely
because nothing in this repository independently derives WHICH claims are safety claims, `kind` being
an editorial judgement. Its own comment states that the REMOVE direction has exactly one owner. A
second weaker duplicate inside the render is the fix this repository refuses.

So the covering authority was driven against the same mutation instead. On the live tree:

```
$ npm run check:audit-register
  FAIL  equality four (safety arm roster): … declared but ABSENT [C-28-038 -> .claude-plugin/plugin.json] …
  FAIL  equality four (kind cardinality): 2 claim kind(s) disagree with the declared measurement
        baseline — architecture declares 33 but the registry carries 34; safety declares 6 but the
        registry carries 5. … one cell moved from `safety` to another kind removes a file from that
        list ENTIRELY …
  FAIL  docs/audit/28-safety-surface-exclusions.md is STALE …
$ npm run freshness:guarantees
STALE: docs/GUARANTEES.md — the committed page differs from a fresh regeneration.
```

Three findings, one of which names this exact attack in its own message, plus the drift gate. The
registry was restored (`git checkout -- docs/audit/28-claim-registry.md`).

### The structural fix, in one sentence

**The bound is stated at the site and the dependency is asserted rather than believed:** the header
now records what the equality does not cover, with the measurement; and
`scripts/generate-guarantees.test.ts` asserts that `CLAIM_KIND_CARDINALITY`'s safety count agrees with
`declaredSafetyRows()` on the live tree, so a divergence between the render and its covering authority
is red rather than a fact nobody re-checks.

A comment claiming this equality stops a short document from shipping would have been wider than the
mechanism, and an overstated safety comment is the failure class this repository keeps paying for.

### Mutation proof

| mutant (committed `scripts/check-audit-register.js`, marker verified by grep) | outcome |
|---|---|
| a seventh `SAFETY_CLAIM_HOMES` entry, moving the declared safety cardinality to 7 | **KILLED** — 1 failed / 45 passed, naming the agreement case |
| restored | 46 passed |

---

## B-7 — the differential's structural arm asserts its cardinality and not its set

### What it is

`scripts/autonomy-zero-config.test.ts` compares the Phase-30 guard against the pinned pre-phase guard
over a payload table. The table has two arms. The structural arm has two hand-declared sides —
`STRUCTURAL_KINDS` names the shapes, `STRUCTURAL_PAYLOADS` carries them — and the only comparison was
`PAYLOADS.length === EXPECTED_RUNS`, which counts one side against the other's LENGTH.

Replacing the `empty-body` payload with a second copy of `benign-read-only` therefore removes a shape
from the differential entirely while the cardinality still balances. "Derive the set, assert the
count" is half a rule when the ELEMENTS are what can go missing.

### Reproduction — pre-fix harness vs fixed harness, same attack, same committed guard artifacts

```
$ # PRE-FIX: the committed harness at HEAD + the attack
pre-fix exit=0
      Tests  14 passed (14)

$ # POST-FIX: this plan's harness + the SAME attack
post-fix exit=1
AssertionError: structural shape(s) declared in STRUCTURAL_KINDS but carried by no payload:
  [empty-body] — the differential is short by exactly these shapes: expected [ 'empty-body' ] to
  deeply equal []
```

Both runs drive the same committed `hooks/guard.js` and the same pinned pre-phase blob; the only
variable is the harness. The guard's empty-stdin path — the one that must allow rather than crash on
a malformed payload — was silently unexercised in the first run.

### The structural fix, in one sentence

**The element set is asserted two-sided, with a distinct message per direction** — a kind declared but
carried by no payload is a shape nobody drives; a payload whose kind is undeclared is a shape nobody
wrote down — plus a duplicate-kind refusal, because a duplicate is exactly what the cardinality check
reads as full.

### Mutation proof

The attack above IS the mutation, and it is applied to the artifact that carries the predicate (the
harness). It was restored; the file is green at 15 tests.

---

## B-8 — a consumer of the narrowed corpus exists, and the module said one might

### What it is

`scripts/check-public-docs-vocabulary.ts` exports two accessors on purpose: `publicDocsCorpus()`
(every public document) and `publicDocsScan()` (that corpus minus this gate's own `CHANGELOG.md`
exemption). The split exists because of a recorded defect — CHANGELOG.md sat outside the banned-claim
scan carrying two live disproven claims while the identical bytes in README.md went red — and the
module warns that "a future consumer" taking `publicDocsScan()` inherits an exemption argued for a
predicate it does not run.

Measured: a consumer already does. `scripts/check-audit-register.ts` imports `publicDocsScan()`.

### The direction, measured rather than assumed

It uses the set as a **vouching set**: a registry-arm file must be a member or the gate reports it. A
SMALLER set therefore produces MORE findings, so the exemption's narrowing fails **closed** there.
That makes the consumer correct. What was wrong was the sentence a reader meets, which invites the
belief that nobody takes the narrowed set — in the one module whose entire reason for having two
accessors is that somebody might.

### The structural fix, in one sentence

**The claim is corrected to name the existing consumer and its direction, and the split is derived and
pinned two-sided** — `scripts/check-public-docs-vocabulary.test.ts` scans the tree's non-test modules
for call sites of each accessor and compares the result against a declared table in which every row
records which question that consumer asks and which way its narrowing fails.

### Discrimination proof, both directions

| planted disagreement | outcome |
|---|---|
| the `check-audit-register.ts` row renamed, so the live consumer is undeclared | **RED** — `consumer(s) of the public-docs corpus/scan with no declared direction: [check-audit-register.ts::publicDocsScan]` |
| restored | 20 passed |

The second direction (a declared consumer the tree no longer has) carries its own message and its own
assertion; the case additionally floors the scan for vacuity and asserts both accessors are live, so
"the split is a distinction nobody uses" cannot pass as green.

---

## The language-gate wiring, driven by hand

The plan requires the generated document to be named by BOTH gates. Measured against the committed
`.js`, with the plant appended to `docs/GUARANTEES.md` and the file restored afterwards:

```
$ node scripts/check-banned-claims.js       # plant: "reduces token economy and improves comprehension"
        docs/GUARANTEES.md:59:19 — banned token-economy literal "token economy" — …
        docs/GUARANTEES.md:59:37 — banned comprehension literal "improves comprehension" — …
        docs/GUARANTEES.md:59:46 — banned comprehension literal "comprehension" — …

$ node scripts/check-public-docs-vocabulary.js   # plant: "agent-factory/handoffs/ … handoff packet"
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — docs/GUARANTEES.md:59:…
  FAIL  retired prose form "handoff packet" survives in a public document — docs/GUARANTEES.md:59:…
exit=1
```

Membership is read off each gate's own PASS line rather than asserted separately: banned claims
`118/118 elements … guarantees 1, overlap 2`; public docs `11 public document(s) … guarantees 1`.

**Which consumer narrows either corpus:** exactly one, `check-audit-register.ts`, and its direction is
fail-closed — finding B-8, now derived and pinned.

## The freshness gate, driven by hand

```
control (unmutated tree)              Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration.   exit 0
TMPDIR at a nonexistent directory     … the temp mirror directory could not be created …                   exit 1
one byte of planted drift             STALE: docs/GUARANTEES.md — the committed page differs …             exit 1
  premise: the committed bytes differ from the pre-plant file by 1 byte — the drift reached the
  compared bytes, so the STALE verdict is about the plant and not about something else
a third reader candidate (B-5)        … declares 5 data source(s) where … pins 4 …                          exit 1
```

Plan 30-07 additionally measured the non-zero-regeneration and unwritable-mirror branches and killed
the config-landed refusal by mutation; those are not re-run here and are not claimed as this round's
evidence.

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

### Predicate 4 — the render's join and its denominator

**What set does it ENUMERATE?** The registry's `kind: safety` rows (the parse), and the registry lines
whose exact content is the safety-kind field line (the byte pass). Also the dropped-row set, by
MEMBERSHIP rather than cardinality, and the residual register's rows. **Finding B-6** is the
enumeration answer: both the join and its denominator enumerate the SAME FILE, so the equality bounds
a parse and not a registry.

**What is its INPUT ASSEMBLED FROM?** Two files and one matrix. The data-source list a mirror rebuilds
from was the assembly defect — **finding B-5**: the config arm was a restatement whose holding case ran
in one direction, so the mirror's inputs could be a strict subset of the render's.

**At WHICH POSITIONS is it even ASKED?** The render runs at `npm run generate:guarantees` and inside
the freshness mirror; the freshness gate runs in CI (wired in plan 30-07 after that gate's own recorded
defect of a freshness script CI never invoked) and through its test file. The count assertion is
reached on every render, including the mirrored one, so a short join cannot slip past by being
rendered somewhere else. **Nothing found.**

**Does the HARNESS assert its own PREMISE?** The planted-drift case proves the committed bytes really
differ from a fresh render before it believes the gate's STALE verdict — asserted in-process by 30-07,
re-measured by hand this round (1 byte, and the byte counted). The B-6 fixture asserts its own premise
twice before mutating: that the registry carries C-28-038 and that it is a safety row. **Nothing found.**

### Predicate 5 — the freshness gate

**What set does it ENUMERATE?** The JavaScript half is DERIVED — the transitive import closure of the
generator's committed entry artifact — so a module added to the graph is mirrored without an edit.
**Nothing found.** The DATA half is declared and count-pinned, and that is where **B-5** lives.

**What is its INPUT ASSEMBLED FROM?** A temp mirror: the derived closure, the declared data, and the
generator spawned inside it. The macOS `/var` → `/private/var` symlink already defeated the generator's
entry guard once and was closed with `realpathSync` (30-07, deviation 1), which is the assembly
question answered before this round asked it. **Nothing found beyond B-5.**

**At WHICH POSITIONS is it even ASKED?** `npm run freshness:guarantees`, wired into
`.github/workflows/ci.yml` in the same plan that created it. **Nothing found.**

**Does the HARNESS assert its own PREMISE?** Yes, and this round re-measured it: the config-landed
refusal is the assertion that the mirror actually read a matrix, and 30-07 killed it by mutation and
additionally proved the mirror READS the config by lowering a floor on the live tree and watching the
verdict flip to STALE. **Nothing found.**

### Predicate 6 — the banner and the zero-config differential

**What set does it ENUMERATE?** The banner walks `CHECKPOINTS` and refuses a partial evaluation by
name. The differential enumerates the roster in two coverage tables whose union is asserted equal to it
in both directions, with no id allowed in both. **Nothing found there.** Its STRUCTURAL arm enumerates
three shapes across two hand-declared sides, and only their cardinalities were compared —
**finding B-7**.

**What is its INPUT ASSEMBLED FROM?** One evaluation, produced once and read by both the banner and the
decision, so there is no second value to reconcile (30-08's structural change). The differential's
inputs are the committed `hooks/guard.js` and a pre-phase guard materialized from a pinned BLOB — not a
ref — and round-tripped back through `git hash-object` to prove what was written is what was pinned.
The ambient environment is scrubbed of every `GRUGOPS_` variable before either process runs, so a
developer carrying a grant cannot turn a denial into an allow on both sides and leave the diff clean.
**Nothing found.**

**At WHICH POSITIONS is it even ASKED?** The banner is written once, on every guard invocation, and
`hooks/guard.test.ts` COUNTS the recognized banner lines per run and refuses zero and two alike. The
differential asks its question at every payload in the table — which is exactly why the table being
short by a shape matters, and why B-7 is a positional finding wearing a set-shaped coat.

**Does the HARNESS assert its own PREMISE?** Strongly, and it is the best-instrumented predicate on
this surface: a checkpoint payload must make the PRE-PHASE guard DENY, or the case throws with its own
message — a payload that matches no pattern is an inert string that would report a checkpoint covered
while exercising nothing. `compared` counts what actually EXECUTED against a roster-derived expectation,
so a case lost to a filter or a skip is red rather than invisible. **Nothing found.**

### Predicate 7 — the language-gate wiring over the generated page

**What set does it ENUMERATE?** `docs/GUARANTEES.md` reaches both gates through a NAMED part in each,
derived from the generator's exported `OUT`, and each gate pins its corpus size two-sided. Membership
was re-read this round off each gate's own PASS line. **Nothing found.**

**What is its INPUT ASSEMBLED FROM?** Each gate's corpus parts. The banned-claim gate takes the
PRE-exemption corpus deliberately, which is the repair for the recorded CHANGELOG.md defect.
**Nothing found.**

**At WHICH POSITIONS is it even ASKED?** Both gates were driven by hand with a planted literal and both
named it at `file:line`. The question "which consumer takes the corpus and narrows it" produced
**finding B-8** — one consumer, direction fail-closed, now derived and pinned rather than described as
hypothetical.

**Does the HARNESS assert its own PREMISE?** The plants above are the premise: a membership claim
proved by a literal that the gate actually reports, rather than by a set the test computed for itself.
**Nothing found.**

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

## Self-reproduction against the FIXED build (closure clause 5)

Every attack in this round was re-run by the fixing agent against the committed artifacts **after**
the fixes landed, at HEAD `87700bf`. The premise is asserted first: the working-tree `.js` files are
byte-identical to the committed ones (`git show HEAD:<path>` sha256 compared for
`validate-agent-factory.js`, `checkpoints.js`, `context-io.js`, `generate-guarantees.js` — four OK,
zero mismatches), so what was driven IS what shipped.

| finding | the attack, re-run | result on the fixed build |
|---|---|---|
| B-1 | all nine must-refuse payloads written to `.grugops/factory.config.json` | **9/9 refused**, every finding naming `.grugops/factory.config.json`; the control with no such file still `ALL CHECKS PASSED` |
| B-2 | the unknown-id + non-canonical-value config, read | refusals `2`, `open_pr` effective `block`, the unknown id absent from the matrix — the drop is fail-closed and the same input is now refused at the position it is written (B-1's row above). Runtime publication remains open as `V-30-10-01` |
| B-3 | the duplicate `## Stop conditions` section, planted on the **live tree** this time | **REFUSED**, exit 1, naming `11-retro.md`; the fixture form also exit 1; the restored corpus still derives cleanly — 10 ids / 16 sites / 38 bullets |
| B-4 | `npm run check:diff-disposition` | `PASS diff disposition — 0 findings over 39/39 elements` |
| B-5 | a third candidate planted in the reader's array, in the committed artifact | freshness gate **exit 1**, refusing by name; control after restore exit 0 |
| B-6 | one `- kind: safety` flipped to `- kind: architecture` | the render still publishes 5 of 6 — it is deliberately not the owner — while `check:audit-register` **exit 1** with 4 findings and this round's asserted agreement case **exit 1**; both green after restore |
| B-7 | the `empty-body` payload replaced by a duplicate | differential **exit 1**, 1 failed / 14 passed, naming `empty-body`; control after restore exit 0 |
| B-8 | the consumer table falsified in each direction separately | undeclared direction **exit 1** naming `check-audit-register.ts::publicDocsScan`; vanished direction **exit 1** naming `phantom-module.ts::publicDocsCorpus`; control exit 0 |

Each attack was reverted immediately after its run and the tree confirmed clean
(`git status --short` shows no tracked modification outside this plan's own files).

**What self-reproduction is worth, stated so it is not over-read.** It proves the fixing agent can
still make the fixed build refuse the input it was fixed for. It is a floor, not a closure — the
agent that wrote the fix is the worst-placed party to find what the fix does not cover, which is why
D-23 requires two independent reviews as a separate clause.

## Round 1, what was NOT established

- The derivation's two-sided assertions run in vitest and **not** in the shipped validator; an installed
  kit has no gate over its own stop-bullet tags. Recorded, not fixed (`V-30-10-02`).
- The reader's refusals still have no runtime publisher; the publication point is surface A's file
  (`V-30-10-01`).
- The tag/untag judgement over untagged stop bullets is prose policy and is held as content per the
  Phase 29 D-59 posture. No probe can falsify it and none was run against it.
- The render's SHORT-document direction is covered by `check-audit-register.ts` and not by the render
  itself, deliberately (B-6). If that gate is ever narrowed, the render loses its only cover and the
  assertion added this round is what will say so.
- Plan 30-07's freshness-gate refusal branches (non-zero regeneration, unwritable mirror, the
  config-landed mutation kill) were not re-run in this round and are not claimed as its evidence.
- **Suite greenness establishes nothing here and is not offered.** Every finding above was found on a
  tree whose suite was green apart from one recorded pre-existing failure.

---

# Round 1 closure attempt — the two independent reviews

**Both reviews were run at `claude-opus`, the strongest model available, over surface B as scoped by
round 1's scope statement, and NEITHER returned "nothing new".** Surface B is therefore not closed at
round 1, and this log continues at round 2 (D-22 cap: four).

| reviewer | model | lens | verdict |
|---|---|---|---|
| Reviewer 1 | claude-opus | surface B, **assembly + position** | **FINDINGS: 4** (R1-1 … R1-4) |
| Reviewer 2 | claude-opus | surface B, **enumeration + harness-premise** | **FINDINGS: 5** (R2-1 … R2-5) |

Both drove the committed `.js` and both asserted artifact identity against `git show HEAD:<path>`
before and after their probes (8/8 and 7/7 `premise OK`, zero mismatches on exit). Reviewer 1
recorded fifteen probes that found nothing and five observations; reviewer 2 recorded seventeen and
five. Two of reviewer 1's probes were **discarded as failed premises** by the reviewer itself and
re-run — a CRLF probe applied to an untagged workflow, and a registry mutation that hit prose instead
of a `- kind: safety` row — which is the harness-premise discipline working inside the review rather
than only inside the round.

**The overlap, and why it is six findings and not nine.** The two reviewers found the same defect
from two lenses three times. The cross-reference is recorded so a later reader does not count the
same fault twice, and so the independence of the two reviews is visible in what they did NOT share.

| round-2 id | reviewer ids | severity | one line |
|---|---|---|---|
| **F1** | R1-1 ≡ R2-2 | high | the form check enumerates the reader's candidates under ONE base; the reader's fallback base is the kit root |
| **F2** | R1-2 ≈ R2-1 | high | the one-section refusal is an EQUALITY while the section terminator is a PREFIX |
| **F3** | R1-3 ≡ R2-5 | low | a governance config that exists and cannot be read produces `ALL CHECKS PASSED` |
| **F4** | R1-4 | low | `rootMarkdown()`'s case-sensitive `.md` test drops a root `*.MD` from both language gates |
| **F5** | R2-3 | medium | the consumer-split pin enumerates flat `scripts/*.ts` and bare-call sites only |
| **F6** | R2-4 | medium | the tag corpus's file set is a silent filter; an unnumbered workflow declares stops nothing governs |

**Three of the six were created by round 1's own fixes.** F1 is B-1's repair taking the positions
from the reader and leaving the base hand-chosen. F2 is B-3's repair counting occurrences with a
grammar the terminator does not share. F3 is B-1's resolved-path dedupe suppressing the one arm that
knows how to report an unreadable file. That is the round-2 lesson stated as a fact rather than as a
resolution: **every fix introduces a degree of freedom, and the question "what did this repair make
newly free?" belongs in the round that ships the repair.** Each fix below answers it explicitly.

---

# Round 2 — 2026-09-05

**Baseline before the round:** `1 failed / 2754 passed / 2 skipped` — the recorded pre-existing
`frontmatter` D-49 control (`V-30-01-01`). Every check and freshness gate green.

**The mirror for this round** is `git archive HEAD | tar -x` at `ae56690` (round 1's last commit),
with the sha256 of `validate-agent-factory.js`, `checkpoints.js`, `context-io.js` and
`frontmatter.js` compared against `git show HEAD:<path>` before use — 4/4 `premise OK`.

## F1 — the form check enumerates ONE base; the reader has two

### What it is

Round 1's B-1 repair took the POSITIONS from the reader (`governanceConfigCandidates`) and left the
BASE hand-chosen at `STATE_ROOT`. `readGovernanceConfig(repoRoot?)` has two bases: the caller's, and
its own module-relative `ROOT` when the caller supplies none — which is the **declared default of
`admit()`, `admitAndAppend()` and the `context-io.js admit` CLI**, and the base the PreToolUse guard's
read lands on wherever `CLAUDE_PROJECT_DIR` is unset (four of the five target host CLIs). In the
shipped shared-install that base is the KIT ROOT, so `<KIT_ROOT>/.grugops/factory.config.json` is the
reader's FIRST candidate and was form-checked at no position.

**And the harness premise failed.** Every case in round 1's B-1 block — including the one titled
*"the checked positions EQUAL the reader's candidate list — derived on both sides"* — ran
`runSplit(kit, kit)`. With the roots coinciding there is one base, so the equality was trivially true
and the fixture never exhibited the condition the case exists to bound.

### RED first

```
 Tests  4 failed | 72 passed (76)

 × …and at the KIT base, which the reader consults FIRST under its fallback root
 × every finding checkConfigForm can produce fires at the KIT base, not just one
 × the BASE set comes from the reader, and the checked positions are bases × candidates
   AssertionError: the KIT base was not checked: expected '  ERROR    agent-factory/config/facto…'
   to match /kit_base_only_id/
 × an unreadable in-kit config is reported by name rather than treated as absent      (F3)
```

The positions case was authored, run, and found **non-discriminating on its first draft** — both
bases render the same repo-relative label, so a case keyed on labels alone passes on a repair that
reaches only one of them. It was rewritten to plant a DIFFERENT unknown checkpoint id at each base
before it was allowed to be red for the right reason. That correction is recorded because a case that
goes red for the wrong reason is a false result in the same family as a mutation that never landed.

### The premise, asserted

```
candidates(kit base) = [<kit>/.grugops/factory.config.json,
                        <kit>/agent-factory/config/factory.config.json]
source = ok | test_integrity = off
```

The reader, driven on the committed `context-io.js`, resolves the kit-base candidate and reports
`off` for the value TINT-03 states has no legal form.

### Mirror reproduction

```
$ # MIRROR (ae56690) — six-error payload at <KIT>/.grugops/factory.config.json
VALIDATE_KIT_ROOT=<kit> VALIDATE_ROOT=<state> node MIRROR/scripts/validate-agent-factory.js
ALL CHECKS PASSED
mirror exit=0

$ # CURRENT TREE (fixed) — the SAME bytes at the SAME base
  ERROR    .grugops/factory.config.json: the retired "autonomy" key is present …
  ERROR    .grugops/factory.config.json: invalid "security.asvs_level" value "L4" …
  ERROR    .grugops/factory.config.json: "checkpoints.test_integrity" must not be "off" (TINT-03 …)
  ERROR    .grugops/factory.config.json: invalid "checkpoints.open_pr" value "OFF" …
  ERROR    .grugops/factory.config.json: unknown checkpoint id "checkpoints.not_a_real_checkpoint" …
  ERROR    .grugops/factory.config.json: "production_requires_human_confirmation" must be true …
6 ERROR(S)
tree exit=1
```

Six arms, not one: a repair that reached the position but ran a single check would satisfy a
status-only assertion and fail the arm-count case.

### The structural fix, in one sentence

**One authority for the BASES as well as for the positions:** `checkConfig` iterates
`governanceConfigCandidates(b)` over `GOVERNANCE_BASES` — the validator's own two documented roots —
so "which files are governance configuration" stays the reader's answer and "under which roots" stops
being a second, narrower answer held by the validator.

The reader's third base is closed **by construction rather than by listing**: `GOVERNANCE_FALLBACK_BASE`
is published and asserted to be the parent of the running reader module — i.e. always a kit root — so
a validator asked about that kit covers it by covering `KIT_ROOT`.

### What NEW degree of freedom this fix introduces, and how it is bounded

**A base SET.** A hand-listed set is this repository's founding defect class, so the members are
bounded at their declaration and asserted by a source scan: `GOVERNANCE_BASES` must be exactly
`[KIT_ROOT, STATE_ROOT]`, both roots must come from the two documented environment variables, and no
candidate path literal may appear inside `checkConfig`'s own body — a scan bounded by that function's
closing brace rather than run file-wide, because the required-file loop elsewhere legitimately names
the in-kit config.

**A label collision.** Two bases render the same repo-relative label, so the positions case had to
discriminate on CONTENT. That is recorded above and is why the case plants distinct ids.

### Mutation proof

| mutant (committed `.js`, marker grep-verified) | outcome |
|---|---|
| `GOVERNANCE_BASES = [STATE_ROOT]` — the base set back to one | **KILLED** — 3 failed / 75 passed |
| the unreadable-branch `err(...)` suppressed | **KILLED** — 2 failed / 76 passed (F3's cases) |

---

## F3 — a governance config that exists and cannot be read passed silently

### What it is

`kitRead` catches every error to `null`, conflating ABSENT with UNREADABLE. The kit arm treated
`null` as absence — and round 1's resolved-path dedupe then skipped the state arm, the only one
carrying an `exists but could not be read` message, for exactly that path. So an unreadable governing
config produced a clean verdict for a check that did not happen: the Phase 28 AP-1 anti-pattern this
phase carries forward at severity `blocking`.

### Mirror reproduction

```
$ # MIRROR (ae56690) — agent-factory/config/factory.config.json replaced by a DIRECTORY
  premise: existsSync = true ; readFileSync throws EISDIR
ALL CHECKS PASSED
mirror exit=0
  (the same condition at the NON-coinciding position IS named by the mirror:
   ERROR  .grugops/factory.config.json: exists but could not be read)

$ # CURRENT TREE (fixed)
  ERROR    agent-factory/config/factory.config.json: exists but could not be read
1 ERROR(S)
tree exit=1
```

### The structural fix, in one sentence

**The second arm is deleted rather than taught a third outcome:** the kit path is folded into the
candidate loop, so there is one existence test, one read, one unreadable message and one form check,
asked at every position under every base — and the dedupe now protects reporting instead of hiding a
branch.

### What NEW degree of freedom this fix introduces

None that F1's bounds do not already cover: the loop is the same loop, and the three-way outcome
(absent / unreadable / read) is exhaustive over what a filesystem can answer. Absence stays silent,
which is asserted by its own case so the repair cannot drift into refusing a zero-config repository.

---

## F2 — the occurrence grammar and the terminator grammar were different

### What it is

B-3's repair counts OCCURRENCES with `unfencedHeadingIndices`, a `trimEnd()`-exact column-zero
EQUALITY. Where a section ENDS is decided by `sectionEndIndex` with a PREFIX, `/^#{1,2} /`. Every
string in the prefix language and outside the equality language closes the real section and opens a
region neither pass walks — and a canonically tagged bullet there is, verbatim B-3's own refusal text,
neither collected nor refused nor counted.

### The premise, asserted

```
unfencedHeadingIndices(text, "## Stop conditions") = [35]      ← ONE occurrence: the refusal is
                                                                 not asked, rather than asked and passed
/^#{1,2} /.test("##  Stop conditions")            = true      ← and it DOES close a level-2 section
CHECKPOINT_TAG_RE captured id = "planted_shadow_stop"
```

### RED first

```
 Tests  8 failed | 86 passed (94)
 × refuses two spaces after the hashes …        × refuses a trailing zero-width space …
 × refuses a trailing word joiner …             × refuses a trailing soft hyphen …
 × refuses a two-space indent …                 × refuses an internal double space …
 × refuses a single hash …                      × the near-miss set is DISJOINT from the exact set
```

### Mirror reproduction

```
$ # MIRROR (ae56690) — `##  Stop conditions` + a tagged bullet appended to 11-retro.md
ACCEPTED — ids=[10 ids] sites=16 sections=19 counted=38
mirror exit=0        (and the shipped validator: ALL CHECKS PASSED)

$ # CURRENT TREE (fixed)
REFUSED — checkpoints: 11-retro.md carries 1 heading(s) that RENDER as `## Stop conditions` but are
not spelled as it (lines 45): "##  Stop conditions". A reader sees a stop section there and the
corpus does not …
tree exit=1
```

### The spelling sweep, against the fixed artifact

| spelling | verdict |
|---|---|
| exact `## Stop conditions` | REFUSED (duplicate occurrence — B-3's arm) |
| trailing tab / trailing NBSP | REFUSED (duplicate — `trimEnd()` strips both) |
| `##  Stop conditions` (two spaces) | **REFUSED (near-miss)** |
| trailing `U+200B` / `U+2060` / `U+00AD` | **REFUSED (near-miss)** |
| two-space indent | **REFUSED (near-miss)** |
| internal double space | **REFUSED (near-miss)** |
| single hash `# Stop conditions` | **REFUSED (near-miss)** |
| `### Stop conditions` | **ACCEPTED — correct.** It closes no level-2 section, so its bullets stay inside the located range and ARE collected; refusing it would be the widening this fix avoids |
| inside a fence | ACCEPTED — it renders as code |

### The structural fix, in one sentence

**The authority answers a THIRD question DERIVED from the two grammars it already owns** —
`unfencedHeadingNearMisses` returns the unfenced lines a renderer would show as the requested heading
while the canonical equality refuses them — and the derivation refuses that set by name; **acceptance
is unchanged**, so `locateSection` behaves byte-identically for the four gates built on it.

The level question is asked of `sectionEndIndex` ITSELF, on a one-line document, rather than of a copy
of its pattern: a line that closes a level-at-most-two section IS such a heading. That is the
unification the reviewers asked for rather than a third parallel grammar.

### What NEW degree of freedom this fix introduces, and how it is bounded

**A near-miss acceptance set** — potentially a third heading grammar. It is bounded four ways, each
asserted rather than described: it is DERIVED (terminator language ∧ rendered-text equality ∧ not
byte-exact); it is DISJOINT from the exact set by construction and by case; the live corpus is
asserted to contain zero near-misses, so the refusal is not already firing; and its scope is stated at
the declaration — it folds only the axes on which two lines render IDENTICALLY (indentation a renderer
ignores, hash count within the level class, collapsed whitespace runs, zero-width code points) and
deliberately does **not** attempt visual-confusable folding, which is an open set and the totality
claim D-59 already proved undecidable.

**A second implementation hazard, met and avoided.** The first draft declared a `/^#{1,2} +/` strip
and bound its result to `text`. `check-foundation-guards.test.ts`'s [B1] closure ALIASES recogniser
names through their bindings, so that one binding propagated "recogniser" through half the module's
locals and took the pin's blast radius from 1 to 6. The repair was to take the heading's text by
SLICING at the first space — no pattern, no alias, no pin moved. **No guard pin was moved by this
fix.**

### Mutation proof

| mutant | outcome |
|---|---|
| the near-miss refusal disabled in `checkpoints.js` | **KILLED** — 7 failed / 87 passed |
| `unfencedHeadingNearMisses` returns `[]` in `frontmatter.js` | **KILLED** — 8 failed / 86 passed |

---

## F6 — the corpus's FILE SET was a silent filter

### What it is

`listWorkflows` admits `/^\d{2}-.+\.md$/` and drops everything else without a word. An unnumbered
`agent-factory/workflows/hotfix-emergency.md` carrying a canonically tagged stop bullet is outside the
walked set, outside `WORKFLOW_COUNT`, and outside every denominator derived from either. Reviewer 2
measured the whole tree green after discharging the one red — the banned-claim scan-set cardinality
pin — exactly as that pin's own remedy text prescribes.

### Mirror reproduction

```
$ # MIRROR (ae56690)
ACCEPTED — ids=[10 ids] sites=16 sections=19 counted=38
mirror exit=0        (and the shipped validator: ALL CHECKS PASSED)

$ # CURRENT TREE (fixed)
REFUSED — checkpoints: agent-factory/workflows carries 1 markdown file(s) the workflow corpus does
not admit — hotfix-emergency.md. A stop declared in a file the corpus rule drops is walked by
nothing … Rename it into the numbered corpus, or move it out of the workflows directory
tree exit=1
```

### The structural fix, in one sentence

**The same canonical-form posture, applied to MEMBERSHIP rather than to FORM:** the corpus admits a
canonical filename, and a markdown document sitting in the corpus's own directory without taking that
form is refused by name rather than dropped — with the unfiltered directory read published by the
lister's own module (`listWorkflowDirMarkdown`) so no second directory walk is written at the consumer.

The raw read is deliberately case-INSENSITIVE while the lister stays exact: this function exists to
find what the corpus rule is dropping, and a case-sensitive raw read would hide exactly the `.MD`
entry a consumer wants refused. Acceptance is unchanged.

### What NEW degree of freedom this fix introduces, and how it is bounded

**A second traversal of one directory.** Two reads that could disagree about what is in it. Both go
through kit-model's single `readDirOrThrow`, and the containment is asserted: the admitted set must be
a subset of the raw read, and on the live tree the two are asserted equal. A non-markdown entry is
explicitly out of scope and has its own case, so the refusal cannot grow into "nothing else may live
here".

### Mutation proof

| mutant | outcome |
|---|---|
| the unadmitted-file refusal disabled in `checkpoints.js` | **KILLED** — 2 failed / 97 passed |

---

## F4 — the corpus's extension test was case-sensitive

### What it is

Every public-docs corpus part filtered membership with `endsWith(".md")`. A root `PUBLIC.MD` is not a
member — and `PUBLIC_DOCS_SCAN_COUNT` is a two-sided pin over the DERIVED count, so a document the
derivation never admits does not move it. This is the recorded CHANGELOG.md defect's shape reached
through the extension test instead of through the exemption.

### The premise, asserted

The same bytes under a lower-case name ARE red: a `PUBLIC-lower.md` twin beside the plant took the
mirror gate to exit 1. The plant is therefore refusable content, and its silence is about the NAME.

### Mirror reproduction

```
$ # MIRROR (ae56690) — a root PUBLIC.MD carrying "reduces token economy and improves comprehension"
  PASS  AUDIT-02: 11 public document(s) carry zero retired vocabulary …
ALL CHECKS PASSED
mirror exit=0
  mirror corpus size = 12 | PUBLIC.MD a member? false

$ # CURRENT TREE (fixed)
  FAIL  public-docs scan derivation refused: root: "PUBLIC.MD" spells the markdown extension in a
        case this corpus does not admit … Rename it to the canonical lower-case ".md" extension …
tree exit=1
  …and check-banned-claims, which consumes the same corpus, reports the same refusal by name.
```

### The structural fix, in one sentence

**The canonical form is the lower-case extension and what imitates it is refused by name** through
the derivation-refusal channel the module already owns — **the corpus is not widened**, so the scan
set, the pin and which documents are scanned are all unchanged.

### What NEW degree of freedom this fix introduces, and how it is bounded

**An "imitates" predicate.** It is bounded to a case-fold of the SAME extension literal and nothing
else, and that bound has its own case: `.txt`, `.markdown` and `.mdx` are different file types, not
imitations, and a mirror carrying all three still exits 0. One push site serves both parts, so the
refusal channel gains one member and not two.

### Mutation proof

| mutant | outcome |
|---|---|
| `imitatesMarkdown` returns `false` | **KILLED** — 2 failed / 22 passed |

### One pin moved, with its reason

`DERIVATION_REFUSALS.push` site count **4 → 5** in `check-banned-claims.test.ts`, and the enumeration
prose in `check-public-docs-vocabulary.ts` corrected from "four" to "five" with the new member named.
The pin moving is the pin working: a new refusal channel is exactly what it exists to notice.

---

## F5 — the consumer-split pin enumerated a set that excluded three module trees

### What it is

Round 1's B-8 pin derived its consumer set as `readdirSync(scripts/)` filtered to non-test `.ts`,
matched with a bare-call regex whose lookbehind excluded `.`. Three silent gaps, all measured by
reviewer 2: a namespace-import consumer is unmatchable by that regex; `hooks/` and `install/` both
import `scripts/` modules today and are outside the directory read; and `scripts/` has
subdirectories the flat read never descends into. A pin whose stated job is "EXACTLY the declared
consumers" was reporting over a set missing three module trees, every subdirectory and one call form.

### Mirror reproduction

Three plants — a namespace importer in `scripts/`, a named importer in `hooks/`, a named importer in
`scripts/probe-sub/` — driven through the ROUND-1 pin and then through the repaired one, with the
same committed gate artifacts underneath:

```
$ # MIRROR — the committed round-1 pin at HEAD, all three plants present
mirror exit=0
      Tests  20 passed (20)

$ # CURRENT TREE — the repaired pin, the SAME three plants
tree exit=1
AssertionError: consumer(s) of the public-docs corpus/scan with no declared direction:
  [probe-consumer.ts::publicDocsScan, probe-deep-consumer.ts::publicDocsCorpus,
   probe-ns-consumer.ts::publicDocsScan]
```

**And the round-1 pin's own premise was re-measured rather than assumed:** a bare-call plant in
`scripts/` DOES red it (1 failed / 19 passed). Its blindness was specific — three shapes — not total,
which is what makes it a finding rather than a broken pin.

### The structural fix, in one sentence

**Both halves are replaced: the module set becomes the repository's own `.ts` sources — tracked AND
untracked-but-not-ignored, recursively, whole tree — and detection becomes IMPORT BINDING rather than
call shape**, because detecting an import is one question with one answer while detecting a call
spelling is an open set.

A module that imports the authority and names NEITHER accessor is recorded as consuming `*` and still
owes a declared direction, so a computed or re-exported access cannot be silent.

### What NEW degree of freedom this fix introduces, and how it is bounded

**The module set is now defined by git's ignore rules rather than by a directory literal.** That is a
wider set with a different owner, so the case FLOORS it: more than thirty sources, and `hooks/` and
`install/` each asserted present. A narrowed set is red before any plant exists — which is exactly
what killed the module-set mutant below.

**The `\b<accessor>\b` detector can match a name in prose or in an unrelated identifier.** It is
gated by the module first having to reference the authority's own specifier, and comment lines are
stripped, so a false consumer must import the module to be reported. Over-reporting is the safe
direction here: it demands a declared row, it never removes one.

### Mutation proof, and what each mutant isolates

| mutant | outcome |
|---|---|
| detection reverted to the bare-call shape (`(?<![\w$.])name\s*\(`) | **survived the detection half, KILLED by the `*` arm** — the namespace plant is reported as `probe-ns-consumer.ts::*`. Recorded rather than hidden: the fail-closed arm is a genuine second line of defence, and the mutant that would kill the detector alone is the one that removes both |
| module set reverted to the flat `scripts/` readdir | **KILLED by the scope FLOOR**, before any plant is consulted — `expect(sources.some(f => f.startsWith("hooks/")))` fails. The set's own reach is asserted, so a narrowed set cannot wait for a plant to be noticed |
| a phantom declared consumer (`phantom-module.ts`) | **KILLED** — the vanished direction, with its own message |

---

## Round 2 — an observation closed in passing

Reviewer 2's observation 1 was not a finding — it lowers nothing today — but it is a one-line
correctness repair inside this plan's own surface, so it was taken rather than deferred.

**`assertSiteCounts` was prototype-blind for exactly one legal id.** Its "tagged but unrecorded" arm
asked `!(id in recorded)`; `recorded` is a plain object, so `constructor` — the one
`Object.prototype` name that is also legal under `CHECKPOINT_TAG_RE`'s snake_case pattern — passed
silently. Measured against the committed artifact: `constructor` ACCEPTED, `planted_shadow_stop`
REFUSED. It is masked end-to-end by `compareRosterToDerivation`'s `Set`, so nothing was lowered — but
this function is exported *specifically* so a test can plant a disagreement and watch it refuse, and
for that id it silently would not.

```
MIRROR (ae56690): ACCEPTED (silently) — exit 0
CURRENT TREE:     REFUSED — checkpoints: the derived id→sites map disagrees …
mutant `!(id in recorded)` restored → 1 failed / 99 passed          KILLED
```

Fixed with `Object.hasOwn`, with a control case asserting an ordinary unrecorded id still refuses —
so the case cannot pass for a reason unrelated to the prototype.

The reviewers' other three observations are recorded in `deferred-items.md` as `V-30-10-03`
(the hook's kit-root fallback base — surface A) and `V-30-10-04` (the `resolve()`/`realpathSync`
dedupe, the one-space grant, and the residual vacuity of `sectionsFound === filesWalked`), each with
the reason it was not fixed here.

---

## Round 2 — self-reproduction against the FIXED build (closure clause 5)

Every round-2 attack was re-run by the fixing agent against the committed artifacts **after** the
fixes landed, at HEAD `9d6d81c`. The premise is asserted first: the working-tree `.js` files are
byte-identical to the committed ones for all six attacked modules
(`validate-agent-factory.js`, `checkpoints.js`, `context-io.js`, `frontmatter.js`, `kit-model.js`,
`check-public-docs-vocabulary.js` — 6/6 OK, zero mismatches), so what was driven IS what shipped.

| finding | the attack, re-run | result on the fixed build |
|---|---|---|
| F1 | the six-error payload at `<KIT_ROOT>/.grugops/factory.config.json`, two-root arrangement | **6 ERROR(S), exit 1** |
| F2 | `##  Stop conditions` + a tagged bullet appended to a live workflow | **REFUSED, exit 1**, naming the file, the line and the offending bytes |
| F3 | the in-kit governance config replaced by a directory | **`agent-factory/config/factory.config.json: exists but could not be read`, exit 1** |
| F4 | a root `PUBLIC.MD` carrying banned-claim literals | **1 finding naming it, exit 1** |
| F5 | the three consumer evasions — namespace import, `hooks/`, `scripts/` subdirectory | **exit 1**, all three named in one message |
| F6 | an unnumbered `hotfix-emergency.md` carrying a canonically tagged stop | **REFUSED, exit 1**, naming the directory and the file |
| obs. 1 | `assertSiteCounts` driven with an id of `constructor` | **REFUSED** where the pre-fix artifact accepted silently |

Every attack reverted immediately; `git status --short` shows no tracked modification outside this
plan's own files, and each control returns to green after the revert.

**Its bound, restated.** Self-reproduction proves the fixing agent can make the fixed build refuse
the input it was fixed for. Round 1 passed this clause too, and two independent reviews then found
six things it had not thought to try. It is a floor.

---

# Round 2 closure attempt — the two independent reviews

**Both at `claude-opus`, both over surface B as scoped by round 2's scope statement, and NEITHER
returned "nothing new".** Surface B is therefore not closed at round 2, and this log continues at
round 3. One round remains after this one (D-22 cap: four).

| reviewer | model | lens | verdict |
|---|---|---|---|
| Reviewer 3 | claude-opus | surface B, **heading authority + corpus membership** | **FINDINGS: 4** (R3-1 … R3-4) |
| Reviewer 4 | claude-opus | surface B, **validator bases + reader structure + render/freshness + scan-set pins** | **FINDINGS: 3** (R4-1 … R4-3) |

**No overlap this round — seven distinct findings.** Reviewer 3 additionally recorded fourteen
probes that found nothing and six observations; reviewer 4 twenty-four probes and seven observations.
Reviewer 3 proved **every heading-rendering premise against the reference `commonmark`
implementation** rather than against the spec text, and demoted one probe to "nothing found" when its
own premise failed (a blockquote heading whose bullet the tag pattern rejects). Reviewer 4 discarded
one probe as a failed premise (an EOF append that landed under a later heading) and re-ran it against
measured line numbers. Both asserted artifact identity on entry and exit (6/6 and 8/8 `premise OK`).

| round-3 id | reviewer id | severity | one line |
|---|---|---|---|
| **R3-1** | R3-1 | high | the near-miss set is not "what a renderer shows as this heading" — five renderer-identical spellings escape both refusals |
| **R3-2** | R3-2 | high | the fence toggle desynchronises from the renderer, hiding a BYTE-EXACT canonical stop section |
| **R3-3** | R3-3 | medium | the duplicate/near-miss refusals were added at ONE of the three frozen anchors; the other two truncate silently |
| **R3-4** | R3-4 | low | the corpus's raw membership read admits exactly one spelling of "markdown" |
| **R4-1** | R4-1 | medium | the residual-additions table is located by first-occurrence heading and has no independent denominator |
| **R4-2** | R4-2 | medium | the consumer-split pin keys by BASENAME while its module set is now the whole repository |
| **R4-3** | R4-3 | medium | `STATE_ROOT`'s back-compat default is the KIT in a shared install, so the governing per-repo config is checked at no base |

**Again, most of the round came from the previous round's own fixes.** R3-1 is F2's near-miss set
measured against a grammar rather than a renderer. R3-3 is F2's refusal added at one consumer of an
authority with three. R3-4 is F6's raw read admitting one extension. R4-2 is F5's widened module set
keeping a key that was only unique in one directory. R4-3 is F1's base set meeting a default that
aliases its two members. **Four of seven.** The standing question — *what did this repair make newly
free?* — is asked of every fix below, and answered.

---

# Round 3 — 2026-09-06

**Baseline before the round:** `1 failed / 2785 passed / 2 skipped` (the pre-existing `frontmatter`
D-49 control, `V-30-01-01`); every check and freshness gate green.
**Mirror:** `git archive HEAD | tar -x` at `312b662`, sha256-verified against `git show HEAD:<path>`
for six modules — 6/6 `premise OK`.

## R3-1 — the near-miss set was measured against a grammar, not against a renderer

### What it is

F2 declared its scope as "which unfenced lines a renderer would show as `heading`". Its measured
scope was `/^ {0,3}#{1,2} /` plus a literal-tail comparison. Five spellings sit outside that grammar
and inside the renderer's, each verified by the reviewer against the reference `commonmark`
implementation: the optional closing sequence `## Stop conditions ##` and `## Stop conditions #`
(§4.2), a TAB separator `##\tStop conditions` (§4.2), the setext form `Stop conditions` + `---`
(§4.3), and a numeric character reference `## Stop&#32;conditions`.

**The closing-hash form is the dangerous one:** it also matches `/^#{1,2} /`, so it CLOSES the real
section.

### Mirror reproduction — the truncating form, on the live corpus

A `## Stop conditions ##` inserted between the two tagged bullets of `09-daily-sweep.md`:

```
$ # MIRROR (312b662)
  ACCEPTED — ids=9 sites=15 examined=37 counted=37
  exceed_wip_limit present? false
mirror exit=0

$ # CURRENT TREE (fixed)
REFUSED — checkpoints: 09-daily-sweep.md carries 1 heading(s) that RENDER as `## Stop conditions`
but are not spelled as it …
tree exit=1
```

A **live roster member removed from the derived set with both independent counts agreeing at 37/37** —
the shear the two-pass design exists to catch, defeated because both passes take the same wrong range.

### RED first

```
 Tests  13 failed | 101 passed (114)
 × refuses a closing hash sequence          × refuses a one-hash closing sequence
 × refuses a closing sequence with padding  × refuses a TAB separator
 × refuses a tab separator with a closing sequence
 × refuses a numeric character reference    × refuses a hex character reference
 × refuses the SETEXT form                  × the TRUNCATING form is refused
 × the terminator language is a SUBSET of the classifier    (+ the four R3-2 cases)
```

### The structural fix, in one sentence

**`atxHeadingText` is replaced by `atxOrSetextHeadingText`, a CommonMark level-≤2 heading
classifier** — one or two hashes at column ≤3, a space **or tab** separator (or end of line), the
optional closing sequence stripped, plus the setext form — and the near-miss derivation is unchanged:
`rendered-as-this-heading ∧ ¬byte-exact`.

### What NEW freedom this creates, and how it is bounded

**The classifier now decides "is this a heading" for lines `sectionEndIndex` does not close** (tab
separated, setext), so the near-miss set stops being a subset of the terminator language — exactly
the freedom reviewer 3 named. It is bounded by asserting the containment in the direction that
matters: **the terminator language is a SUBSET of the classifier**, so no heading that can truncate a
section is invisible to the refusal. `scripts/checkpoints.test.ts` drives that over a probe set.

**`sectionEndIndex` is deliberately NOT widened** to close on tab-separated or setext headings. That
would change the located extent of every frozen region in the kit — a corpus-wide behaviour change —
and the direction of not widening it is safe: such a heading closes nothing, truncates nothing, and
the near-miss refusal catches it anyway. The divergence that matters is one-directional.

**Entity decoding is NUMERIC ONLY, and the bound is stated at the declaration.** Numeric references
are a closed, decidable grammar. Named references are a two-thousand-entry table, and importing one
into the tree's one heading authority would be this repository's named second systemic failure class
in the worst possible place. A named reference therefore renders to a character the fold does not
touch, and the line is an ordinary different heading — the same disclosed bound as visual-confusable
folding (D-59, open set).

### Mutation proof

| mutant (emitted `.js`, marker grep-verified) | outcome |
|---|---|
| the closing-sequence strip removed | **KILLED** — 5 failed |
| the tab separator rejected | **KILLED** — 2 failed |
| the setext arm removed | **KILLED** — 1 failed |
| numeric entity decoding removed | **KILLED** — 2 failed |

---

## R3-2 — the fence toggle could be desynchronised from the renderer

### What it is

`fencedLineFlags` flipped on any line beginning with three backticks. CommonMark §4.5 admits tilde
fences and fences opened with more than three backticks, and inside either a ``` line is CONTENT. So
the idiomatic four-backtick "fenced example inside a fenced example" inverted this module's fence
state relative to the renderer's, to EOF — and this is **the one authority every heading consumer
inherits**.

### Mirror reproduction

```
$ # MIRROR (312b662) — a four-backtick block, then a BYTE-EXACT canonical `## Stop conditions`
  premise: unfencedHeadingIndices("## Stop conditions") = [35]   ← the EXACT heading is invisible
  premise: unfencedHeadingNearMisses = []
  ACCEPTED — ids=10 sites=16 examined=38 counted=38
  cardinality OK — nothing anywhere notices
  shipped validator: ALL CHECKS PASSED
mirror exit=0

$ # CURRENT TREE (fixed)
REFUSED — checkpoints: 11-retro.md carries 2 `## Stop conditions` sections (lines 36, 49) …
tree exit=1
```

The strongest form of the class: the heading needs **no imitation at all**. It is spelled canonically
and neither refusal is even asked. The mirror image was a false red — `~~~\n## Stop conditions\n~~~`
is code to a renderer and was two stop sections to the old toggle (R3-O2) — and the same machine
removes it.

### The structural fix, in one sentence

**`fencedLineFlags` becomes a §4.5 fence machine:** it records the opening delimiter's CHARACTER and
RUN LENGTH and closes only on a same-character run at least as long — where it previously carried one
boolean.

### What NEW freedom this creates, and how it is bounded

**The machine gains state.** `inside` is still a boolean flipped by negating itself, deliberately:
`frontmatter.test.ts` derives the tree's fence state machines by a recogniser arm and a toggle arm,
and a machine that stopped matching the toggle arm would drop the authority out of its own pin and
leave that classifier blind to the one implementation it exists to find. Measured: the pin still
reports exactly three machines with `scripts/frontmatter.ts` among them.

**Two §4.5 rules are DELIBERATELY NOT ADOPTED, each with its direction measured — this is the part
that took the work.**

- *"A closing fence may not have an info string."* Adopting it changed this module's view of **eight
  governed kit documents**, because the kit contains blocks written ```` ```markdown ```` …
  ```` ```sh ```` where the author meant to open a second block; 47 foundation-guard cases went red.
  It closes nothing R3-2 asked for. Not adopted; the residual's direction is **over**-scanning, which
  is fail-closed.
- *"Up to three leading spaces are allowed."* Adopting it newly treated every list-indented fenced
  block as code — six governed documents including `README.md` and `install/README.md` — which
  **narrows what every gate scans**, the fail-open direction. Not adopted; the residual is
  pre-existing and already recorded tree-wide as V-29-26-04.

**The measured corpus delta is therefore two files, both archived planning documents, and ZERO
governed files** — over 1,501 tracked markdown files, comparing the committed pre-fix artifact
against the fixed one line by line. The first draft's delta was 30 files including 8 governed; the
narrowing above is what took it to 2.

### Mutation proof

| mutant | outcome |
|---|---|
| tilde fences unrecognised | **KILLED** — 2 failed |
| the run-length rule removed | **KILLED** — 1 failed |

---

## R3-3 — the heading refusals were added at ONE of the three frozen anchors

### What it is

`FROZEN_SECTION_ANCHORS` freezes three heading-located regions — role `## Hard limits` (×17),
workflow `## Stop conditions` (×19), workflow `## Commit` (×19). Rounds 1 and 2 added the duplicate
and near-miss refusals in `scripts/checkpoints.ts`, asked only about the second. `locateSection` fails
OPEN — its own comment records that "the failure mode is a region that gets too SHORT" — so a
repeated or renderer-identical heading planted mid-section silently un-freezes every clause below it
while the gate goes on printing `17/17`.

### RED first, against the committed pre-fix artifact

The new cases were authored, and then driven with `git show HEAD:scripts/check-diff-disposition.js`
in place of the fixed one — so the RED is the committed artifact's own behaviour:

```
 Tests  9 failed | 86 passed (95)
AssertionError: no refusal named agents-md-scribe.md / ## Hard limits; refusals were: …
mirror exit=1
```

(The first RED run of these cases failed for the WRONG reason — `cpSync is not defined` in the new
fixture helper. That is a failed premise, not a finding, and it was repaired and re-run before any
red was believed. Recorded because a case that goes red for the wrong reason is the same class of
false result as a mutation that never landed.)

### Mirror reproduction, and the direct measurement

```
$ # MIRROR (committed .js at 915a942), `##  Hard limits` planted mid-section
    clean frozen clauses = 446 | planted = 250 | cardinality still 17/17 | no refusal names the plant
$ # CURRENT TREE (fixed)
    a refusal naming agents-md-scribe.md and `## Hard limits`               tree exit=1
```

### The structural fix, in one sentence

**The two refusals move ONTO THE ANCHOR SET**, into the loop that walks `FROZEN_SECTION_ANCHORS` in
the module that owns the freeze, so a fourth anchor inherits them without an edit.

### The import direction, settled deliberately

`check-diff-disposition.ts` asks `scripts/frontmatter.ts` — the authority it **already** consumes for
`locateSection` — and gains no dependency on `scripts/checkpoints.ts`. The alternative (moving the
refusal into the checkpoint module and having the freeze import it) would have made the corpus-form
question depend on a module that owns a different corpus. `scripts/checkpoints.ts` keeps its own
refusals for its own corpus; the two consumers of one authority now ask the same question.

### What NEW freedom this creates, and how it is bounded

**The near-miss refusal's false-red surface lands on 36 more files.** Measured before the refusal was
written: across all three anchors and all 55 files the live kit carries **zero** duplicates and
**zero** near-misses, and that measurement is a permanent case, so the refusal is not already firing
and a future kit edit that trips it is a real event. The known over-refusals (a heading inside an HTML
block, R3-O1) are recorded as observations, not fixed by widening.

### Mutation proof

| mutant | outcome |
|---|---|
| the duplicate arm disabled | **KILLED** — 3 failed |
| the near-miss arm disabled | **KILLED** — 6 failed |

**One pin moved:** `check-diff-disposition.ts`'s imported-symbol list from the authority, 3 → 5, with
the entrants named and the direction argued — both are declarative index lists, so the property the
pin protects (the module renders no verdict from the parser) is unchanged.

---

## R3-4 — the raw membership read admitted one spelling of "markdown"

### What it is

`listWorkflowDirMarkdown` — the read whose whole job is to find what the corpus rule drops — filtered
on the canonical extension alone, so `agent-factory/workflows/hotfix.markdown` carrying a canonically
tagged stop was walked by nothing, counted by nothing and refused by nothing, while F6's refusal
message told authors to rename or move a file it never mentioned.

### Mirror reproduction

```
$ # MIRROR (committed kit-model.js at 915a942)
ACCEPTED — ids=10 sites=16 sections=19 counted=38          mirror exit=0
$ # CURRENT TREE (fixed)
REFUSED — … carries 1 markdown file(s) the workflow corpus does not admit — hotfix.markdown …
tree exit=1
```

### The structural fix, in one sentence

**F4's posture applied to this axis:** a declared alias set (`.markdown`, `.mdown`, `.mkd`) makes the
raw read see the document, and F6's existing refusal names it — the canonical extension is not
widened.

### What NEW freedom this creates, and how it is bounded

**A hand-declared alias set — this repository's named second systemic failure class.** Bounded by a
two-sided pin on its exact members, an assertion that the canonical `.md` is NOT among them (a set
containing it would make every workflow a refusal), a non-vacuity floor, an assertion that the live
directory carries no alias, and a re-derivation of F6's own bound against the new boundary: `.txt`,
`.json` and an extensionless file each have a case proving they stay out of scope.

### Mutation proof

| mutant | outcome |
|---|---|
| the alias set emptied | **KILLED** — 5 failed |

---

## R4-1 — the residual section had no independent denominator

### What it is

The render carries two independent denominators — `declaredSafetyRows` and `declaredDroppedRows`,
each a raw byte pass sharing no parser with the join. The residual section had **neither**. Its only
floor was `body.length === 0` inside the parse — a vacuity floor over an EMPTY denominator, which
never sees a SILENTLY SHORT one — and the harness case that looked like the guard took its
denominator from that same parse, so both sides moved together. B-6's shape at the one `tableUnder`
consumer that feeds a published document.

`readResidualAdditions` locates the additions table by FIRST unfenced exact heading, so a row written
under a repeated heading, a renderer-identical near-miss, or a `…, continued` heading was silently
unpublished: the reviewer measured `residual rows parsed = 2`, `published = 2`, the planted row absent
from `docs/GUARANTEES.md`, the generator at exit 0, freshness fresh and 168 tests passing.

### RED first

```
 Tests  6 failed | 46 passed (52)
 × a row under a REPEATED additions heading is refused, not silently unpublished
 × a row under a NEAR-MISS additions heading is refused too
 × a row under a `, continued` heading is refused — the byte pass sees it, the parse does not
 × the LIVE register agrees — the byte pass and the parse name the same rows
 × the two passes share no parser — the byte pass is a raw line read
 × `commit_to_branch: block` is stricter than its default and is NOT published as lowered  (obs. 1)
```

### The structural fix, in one sentence

**The residual section gets the denominator its two siblings already have** — `declaredResidualRows`,
a raw line pass over the register's bytes that calls no parser — and the comparison is by
**MEMBERSHIP**, not cardinality, because a set short by exactly the rows that matter has the same size
as one short by any two.

### What NEW freedom this creates, and how it is bounded

**A `HISTORICAL_RESIDUAL_ROWS = 8` boundary** separating the register's original table from Phase
30's additions — a hand-written number. It is bounded by the live agreement case (the byte pass and
the parse name the same rows on the real register, asserted), by the byte pass being deliberately
FENCE- and HEADING-BLIND so its disagreements are refusals rather than silences, and by a source
assertion that the pass calls neither `readResidualAdditions` nor `tableUnder` — which is what makes
the equality evidence rather than a tautology.

### Mutation proof

| mutant | outcome |
|---|---|
| the membership comparison disabled | **KILLED** — 3 failed |

---

## Reviewer 4 observation 1 — a TIGHTENED checkpoint was published as LOWERED

Not a finding — the direction is over-statement, not permission — but taken in this round as a
correctness item, because it is **a false sentence in the one document whose subject is which
sentences stopped being true**, and it is reachable by a legitimate configuration.

`loweredCheckpoints` and `guaranteesJoin` both tested `value !== fallback`, which is "different", not
"lower". `commit_to_branch` is the only roster member whose documented default is not `block`, so
declaring it `block` — a *stricter* posture — published
`**LOWERED: 1 checkpoint(s) sit below their documented default on this tree.**` and named
`GRUGOPS_FLOOR_COMMIT_TO_BRANCH` as authorizing it.

**The fix:** the ternary is ordered — `block` < `notify` < `off` — and that order is what "lowered"
already means everywhere else in this phase. The rank is declared once and both call sites ask it.
The case asserts both arms: a tightening publishes no `LOWERED` line and names no grant variable, and
a genuine lowering still does. Mutant `isLowered` → `!==` **KILLED**.

---

## R4-2 — the consumer-split pin keyed by BASENAME over a whole-repository module set

### What it is

F5 widened the module set from one flat directory to the whole repository and left the identity key
as the basename. In one directory basenames are unique; across a tree they are not.

### Mirror reproduction

`hooks/check-audit-register.ts` — same basename as the declared `scripts/check-audit-register.ts` —
importing the authority and calling `publicDocsScan()`:

```
$ # MIRROR (the committed round-2 pin at HEAD)
      Tests  24 passed (24)          exit 0 — folded onto the declared row
$ # CURRENT TREE (path key)
AssertionError: consumer(s) … with no declared direction:
  [hooks/check-audit-register.ts::publicDocsScan]
      Tests  1 failed | 23 passed (24)   exit 1
```

### The structural fix, in one sentence

**Consumers are keyed by repo-relative path**, and the declared rows carry paths.

### What NEW freedom this creates, and how it is bounded

**A declared row now pins a LOCATION as well as a direction, so a legitimate module move reds the
pin.** That is the correct direction — a move is exactly when the direction argument should be
re-read — and it is bounded by the existing `vanished` message, which already names the row a mover
must update.

---

## R4-3 — the state root's back-compat default aliases the kit in a shared install

### What it is

`STATE_ROOT` falls back to `resolve(SCRIPT_DIR, "..")` — "the repo root (back-compat)". In the shared
install this project shipped in v1.1 that is the KIT, so under the validator's own documented
single-root invocation `GOVERNANCE_BASES` becomes `[kit, kit]`, the dedupe collapses them, and the
repository's `.grugops/factory.config.json` — the file the reader governs from — is form-checked at
no base.

### The premise and the mirror

```
premise: readGovernanceConfig(<repo>) → source=ok  test_integrity=off
$ # MIRROR (committed .js at HEAD), single-root documented form, from the repo
ALL CHECKS PASSED
$ # the SAME bytes, two-root form
4 ERROR(S)
```

### Why this is REPORTED rather than REFUSED, stated rather than preferred

A refusal needs a predicate separating "the kit and the state tree genuinely coincide" (the in-repo
dev checkout, where the default is correct) from "the state root silently aliased the kit" (the
shared install). **The validator's inputs do not contain one:** in both cases
`resolve(SCRIPT_DIR, "..") === KIT_ROOT`, because in both cases the operator runs the kit's own
script. `process.cwd()` would distinguish them and has never been an input to this gate — and every
fixture in `validate.test.ts` spawns with the repository as cwd against a temp kit, so a cwd rule
would refuse thirty legitimate runs. Inventing a discriminator the gate cannot compute is how a
round-three fix becomes a round-four finding.

### The structural fix, in one sentence

**The run publishes the governance positions it examined**, and when no state root was supplied says
that both bases resolved to one tree and that a repository-level configuration outside it was NOT
examined, naming the remedy — so `ALL CHECKS PASSED` over an unexamined governing file becomes
`ALL CHECKS PASSED` beside a statement of exactly what was and was not checked.

```
$ # CURRENT TREE (fixed), the same shared-install invocation
  SCOPE    governance configurations examined: agent-factory/config/factory.config.json;
           VALIDATE_ROOT was not supplied, so the state root defaulted to this script's own tree and
           both bases resolved to it — a repository-level .grugops/factory.config.json outside that
           tree was NOT examined. Pass VALIDATE_ROOT=<repo> to check it.
ALL CHECKS PASSED
```

**There is no exit-0/exit-1 mirror pair for this one, and that is stated rather than manufactured** —
the repair removes the property the finding names (a verdict over an unstated scope) without changing
the verdict, exactly as B-6's did. The exit-status pair that *does* exist is the one the reviewer
measured: identical bytes, `ALL CHECKS PASSED` single-root versus `4 ERROR(S)` two-root, and after
this change the single-root run says why.

### What NEW freedom this creates, and how it is bounded

**A line printed on every run, which a later reader could weaken without any test noticing.** Bounded
four ways, all asserted two-sided: the line names every examined position (both bases' drops plus the
in-kit config, driven over distinct roots); the caveat appears when `VALIDATE_ROOT` is unset; the
caveat does NOT appear when a distinct state root is supplied; and a run that examined no governance
config says `none` rather than listing nothing.

### Mutation proof

| mutant | outcome |
|---|---|
| `stateRootSupplied` forced true — the caveat suppressed | **KILLED** — 1 failed / 81 passed |

---

## Round 3 — self-reproduction against the FIXED build (closure clause 5)

Re-run by the fixing agent at HEAD `f078df5`, after asserting that the working-tree `.js` is
byte-identical to the committed artifact for all seven attacked modules (7/7 OK, zero mismatches).

| finding | the attack, re-run | result on the fixed build |
|---|---|---|
| R3-1 | `## Stop conditions ##` inserted between the two tags of `09-daily-sweep.md` | **REFUSED, exit 1** |
| R3-2 | a four-backtick block then a byte-exact `## Stop conditions` | **REFUSED, exit 1** |
| R3-3 | `##  Hard limits` planted mid-section in a role file | **a refusal naming the file and the anchor, exit 1** |
| R3-4 | `hotfix.markdown` carrying a canonically tagged stop | **REFUSED, exit 1** |
| R4-1 | a residual row under a repeated additions heading | **render REFUSED, exit 1** |
| R4-2 | `hooks/check-audit-register.ts` — the basename collision | **exit 1**, named by path |
| R4-3 | the shared-install single-root invocation | the SCOPE caveat is present and names the class not examined |
| obs. 1 | `commit_to_branch: block`, a tightening | **no `LOWERED` line, no grant variable named** |

Every attack reverted; `git status --short` shows no tracked modification outside this plan's files.

**Its bound, for the third time.** Rounds 1 and 2 both passed this clause, and independent reviews
then found six and seven things respectively that the fixing agent had not thought to try. Self-
reproduction proves a fix holds against the attack it was written for. It is a floor.

---

# Round 3 closure attempt — the two independent reviews

**Both at `claude-opus`, both over surface B as scoped by round 3's scope statement, and NEITHER
returned "nothing new".** Surface B is not closed at round 3. **Round 4 is the last (D-22).**

| reviewer | model | lens | verdict |
|---|---|---|---|
| Reviewer 5 | claude-opus | heading classifier + fence machine + frozen anchors + membership | **FINDINGS: 3** (R5-1 … R5-3) |
| Reviewer 6 | claude-opus | validator + reader + render/freshness + pins | **FINDINGS: 6** (R6-1 … R6-6) |

Nine distinct findings, no overlap. Reviewer 5 proved every renderer premise against the reference
`commonmark` implementation — including the NEGATIVE cases, where the *absence* of a heading is the
claim — and discarded one probe as a failed premise (a literal backslash-`r` that produced the same
delta for an unrelated reason). Reviewer 6 discarded one control as a false control (an accidental
symlinked base) and re-ran it with `pwd -P`. Both asserted artifact identity on entry and exit.

**Seven of the nine were created by round 3's own fixes.** R5-1 and R5-2 attack R3-1's classifier and
R3-2's fence machine; R5-3 attacks R3-4's alias set on its first probe; R6-1, R6-2 and R6-3 attack
R4-3's and obs-1's repairs; R6-6 is R3-4's alias set taught to one corpus of two. That ratio has now
held for three consecutive rounds and is itself the phase's most durable measurement.

---

# Round 4 — 2026-09-06 — THE LAST ROUND

**Baseline:** `1 failed / 2829 passed / 2 skipped` (the pre-existing `V-30-01-01`); every gate green.
**Mirror:** `git archive HEAD | tar -x` at `392f3ab`.

## R5-1 — a lone carriage return is a line ending to a renderer and not to this module

### What it is

CommonMark §2.1 makes a lone `\r` a line ending. `text.split("\n")` sees `## Hard limits\r#` as ONE
line: not an occurrence (`trimEnd()` differs), not a near-miss (its rendered text is
`Hard limits #`), and a terminator (`/^#{1,2} /` matches). A lone CR survives `.gitattributes`'
`eol=lf` normalisation — the reviewer proved it with `git cat-file` on a staged blob — so it is
committable.

### Mirror reproduction

```
$ # MIRROR (392f3ab) — `## Hard limits\r#` planted inside the frozen region
  clauses=250 regionBody=1 cardinality=17/17 refusals=0        mirror exit=0
$ # CURRENT TREE (fixed)
  clauses=245 regionBody=-1 cardinality=16/17 refusals=1       tree exit=1
```

The region went from **seven body lines to one** while the cardinality that exists to catch a short
region reported `17/17` and `check:diff-disposition` published `444 frozen clause(s)` as a verdict.
Six tails measured, all identically silent.

### The structural fix, in one sentence

**LF is declared the canonical line ending of the governed corpus and a lone `\r` is refused BY NAME**
at the gates that own their corpora, asked once through `carriageReturnLines` in the authority.

**The rejected alternative, and why:** a `documentLines()` splitter on `/\r\n|\r|\n/` imported by every
consumer would silently re-index every `file:line` four gates report — a behaviour change to all of
them at once, which is exactly what round 3 declined to do to `sectionEndIndex`.

### What NEW freedom this creates, and how it is bounded

**A refusal that could fire on a legitimate Windows-authored contribution.** Bounded three ways:
CRLF is deliberately **not** refused (a trailing CR is stripped before the test) because
`.gitattributes` normalises it away on commit and refusing it would red every Windows working tree
for a shape that cannot ship; the live corpus is asserted CR-free, so a first CR is a real event; and
the message names the remedy.

### Mutation proof

| mutant | outcome |
|---|---|
| the CR refusal disabled | **KILLED** — 3 failed / 102 passed |

---

## R5-2 — a line that closes a section while rendering as nothing at all

### What it is

Round 3 asserted, and reviewer 5 re-measured as true over a 2,197-line alphabet product with **zero**
violations, that the terminator language is a subset of the classifier. **That invariant is
insufficient**, because the refusal predicate is `classifier(line) === want`, not `!== null`. Three
arms reach it:

- **A — §4.5's info-string rule**, declined in round 3 on the recorded ground that its residual
  "over-scans, which is fail-closed". Measured false: the desync flips **parity**, so it under-scans
  too. A heading the renderer places *inside* a code block became a terminator.
- **B — §4.5's ≤3-space indent**, same inversion.
- **C — an HTML comment or block**, modelled by nothing, producing **no rendered output at all**.

### Mirror reproduction (arm C)

```
$ # MIRROR (392f3ab) — `<!--` / `## Anything at all` / `-->` planted in the frozen region
  clauses=250 regionBody=2 cardinality=17/17 refusals=0        mirror exit=0
$ # CURRENT TREE (fixed)
  clauses=252 regionBody=10 cardinality=17/17 refusals=0       tree exit=1  (the region is INTACT)
```

Arm C is the stealthiest: a human reviewing the diff sees three inert lines.

### The structural fix, in one sentence

**One machine, two projections:** `blockContextFlags` — §4.5-complete (info string, ≤3-space indent)
plus an HTML-block arm — is consumed **only** by `sectionEndIndex`, `unfencedHeadingIndices` and
`unfencedHeadingNearMisses`, while `stripFencedBlocks` and the language guards keep the measured lax
view, so round 3's corpus judgements about the PROSE question stand untouched.

**The correct outcome for arm C is INERTNESS, not a refusal** — a renderer shows no heading, so
refusing an HTML comment in a kit document would be a false red on a legitimate construct. Arm B's
correct outcome is that the heading **does** truncate: the renderer shows it, so it is an ordinary
visible section boundary, the same class as a plain `# Anything`, and refusing it would be the
widening this projection exists to avoid. Both are cases.

### What NEW freedom this creates, and how it is bounded

**Two flag arrays in the module whose founding rule is one authority per predicate.** Bounded by
being two *projections* and one *walk* (the shape `stripFencedBlocks` already is), by the derived
fence-machine count staying pinned at three, and by two corpus measurements asserted as permanent
cases rather than described:

- **The two views are NOT nested.** A parity flip is not a widening; measured over 1,501 tracked
  markdown files they differ somewhere in 460. Claiming `strict ⊇ lax` would have been false, and
  the first draft of this comment claimed it before the measurement.
- **Over the governed roles-and-workflows corpus they differ on exactly ONE line** — a single-line
  HTML comment in `04-ticket-to-pr.md` — **no located section extent moves, and the frozen clause
  count is 446 before and after.**

**The HTML arm models two of §4.6's seven block types** — comment (type 2) and tag-to-blank-line
(type 6) — which are the reachable, one-pass-decidable ones. The other five are unmodelled and the
direction of that gap is UNCHANGED behaviour, not a new hole.

### Mutation proof

| mutant | outcome |
|---|---|
| the HTML arm disabled | **KILLED** — 3 failed |
| the info-string rule disabled in the strict projection | **KILLED** — 1 failed |

**One pin moved:** `check-diff-disposition.ts`'s imported-symbol set 5 → 6, the entrant named and its
declarative nature argued.

---

## R5-3 and R6-6 — the alias set failed on the first probe, and had been taught to one corpus of two

### What they are

**R5-3.** R3-4 named its own new freedom — *"a hand-declared alias set, this repository's named second
systemic failure class"* — and bounded it with "a two-sided pin on its exact members", which pins what
is IN the set and proves nothing about what a markdown document is. Reviewer 5 swept ten extensions:
`.markdown`, `.mdown`, `.mkd` refused; **`.mdwn`, `.mkdn`, `.mkdown`, `.mdx`, `.livemd`, `.workbook`,
`.ronn` accepted** — all GitHub-Linguist markdown, all walked by nothing.

**R6-6.** F4 folded the CASE axis into the public-docs corpus; R3-4 declared the ALIAS axis in
`kit-model` and taught it to the workflow corpus only. So a root `PUBLIC.markdown` carrying live
disproven claims was neither a member, nor an imitation, nor a derivation refusal, nor countable by a
two-sided pin over a derived count — **outside BOTH language gates**. R3-3's shape ("a refusal added
at one of N anchors") applied to F4.

### Mirror reproduction (R6-6)

```
$ # MIRROR (392f3ab) — a root PUBLIC.markdown with live banned-claim literals
  check-public-docs-vocabulary  exit 0
  check-banned-claims           exit 0
$ # CURRENT TREE (fixed)
  check-public-docs-vocabulary  exit 1, 1 finding naming PUBLIC.markdown
  check-banned-claims           exit 1
```

### The structural fixes, each in one sentence

**R5-3 — the workflow corpus INVERTS the test rather than lengthening the list:** the raw read admits
every directory entry and the consumer refuses anything the corpus rule does not admit, so **there is
no extension question left to get wrong**.

**R6-6 — one imitation predicate for the tree:** `isCanonicalMarkdownName` / `imitatesMarkdownName`
live once, beside the alias set, and the public-docs corpus asks them instead of restating half the
question.

### Why the two corpora take DIFFERENT postures, stated rather than glossed

The reviewers asked for one posture. There is one *principle* and two *applications*, and the
difference is a property of the directories rather than a preference. The workflows directory is
CLOSED — its only legitimate contents are canonically named numbered workflows — so inversion is
available and removes the freedom entirely. A repository root is OPEN: its legitimate non-markdown
contents cannot be enumerated, so inversion there would refuse `LICENSE`, `package.json` and every
future file. The imitation predicate is used **only** where inversion is impossible, and the residual
it leaves — a markdown spelling Linguist adds later — is carried as a backlog item rather than
claimed closed.

### What NEW freedom these create, and how they are bounded

**An exemption list** (`WORKFLOW_DIR_EXEMPT`, `ROLE_DIR_EXEMPT`) — a set literal again, but a
smaller one: its members are NAMED ENTRIES rather than a CLASS that must stay complete, each carries
a written reason, both are pinned two-sided, and the live directory is asserted to hold nothing
outside the admitted set plus the list. **The inversion found `.gitkeep` on its first run**, which is
the list earning its existence by measurement rather than being written speculatively. The exemption
is a NAME test, not a class test — `.gitkeep2` is still refused, and that has a case.

**The alias list survives for the open corpus** and is widened to Linguist's, with its provenance
named — an external authority rather than one invented here. That does not make it complete, and the
declaration says so.

### Two round-3 cases are SUPERSEDED, and both reversals are recorded where the old belief was written

- *"a non-markdown entry is explicitly out of scope"* (F6/R3-4) — the inversion removes the extension
  question, so `notes.txt` in the workflows directory is now refused. The case's verdict flips and it
  says why.
- *"an unrelated extension is NOT an imitation — the scope is one extension, case-folded"* (F4) —
  `.markdown` and `.mdx` ARE imitations at the public-docs root now. The surviving bound is that a
  genuinely different file type (`.txt`, `.json`) is still not one, and that half is re-asserted.

Deleting an assertion inside a red-team round is the one edit that cannot be distinguished from
narrowing the check, so both are named rather than done quietly.

### Also closed — reviewer 5 observation 4: the ROLES corpus had no membership refusal at all

F6 and R3-4 built the raw-membership refusal for workflows and never built it for roles, so
`roles/rogue.markdown`, `roles/_rogue.md` and `roles/rogue.mdwn` each placed a full role document —
`## Hard limits` and all — into the kit where every gate reported `17/17` and nothing scanned it. The
same inversion is applied in `deriveFrozenSet`, from the same kind of read, with the two genuine
exemptions named and reasoned (`.gitkeep`, and `_role-switch-protocol.md`, which
`check-audit-register` separately records as the one uncounted `safety_surface: yes` row).

### Mutation proof

| mutant | outcome |
|---|---|
| the workflow inversion refusal disabled | **KILLED** — 20 failed |
| the alias arm removed from the imitation predicate | **KILLED** — 3 failed |
| the roles membership refusal disabled | **KILLED** — 4 failed |

---

## R6-4 — the consumer pin excluded every path CONTAINING the authority's name

### What it is

`.filter((f) => !f.includes(AUTHORITY))` — a substring test over the whole repo-relative path, there
to drop the authority itself. F5 widened the module set to the repository and R4-2 keyed the rows by
path; neither moved this filter, so `scripts/check-public-docs-vocabulary-companion.ts` was removed
from the scan set before detection ran.

### Reproduction, measured on the predicate

The suite run was **not** used as the mirror here: the round-3 test file fails against the round-4
artifact for an unrelated reason, so a red from it would be a false control. The two filters were
driven over the same file list instead:

```
round-3 filter (substring): plant in scan set? false   | dropped 2 file(s)
round-4 filter (identity) : plant in scan set? true    | dropped 1 file(s):
                                                          ["scripts/check-public-docs-vocabulary.ts"]
TREE (round-4 pin): consumer(s) … with no declared direction:
  [scripts/check-public-docs-vocabulary-companion.ts::publicDocsScan]
```

### The structural fix, in one sentence

**Exclude by identity, not by substring**, with a floor asserting the excluded set has exactly one
member — so the exclusion cannot silently grow back.

### What NEW freedom this creates

**None — it strictly grows the scan set**, and the added floor removes the freedom the old filter had.

## R6-1 — two tests over one variable, and an empty string fell between them

### What it is

`STATE_ROOT` branched on **truthiness** (`process.env.VALIDATE_ROOT ? … : resolve(SCRIPT_DIR, "..")`)
while the scope caveat tested **definedness** (`process.env.VALIDATE_ROOT !== undefined`). One
variable, two questions, and exactly one input shape separates them: `VALIDATE_ROOT=""`. That is not
a contrived value — it is the ordinary shape of a CI wrapper written
`VALIDATE_ROOT=$SOME_UNSET_VAR node scripts/validate-agent-factory.js`, where the variable is
exported empty rather than left unset.

On that input the state root fell back to the kit, the two bases collapsed, the repository's
governing `.grugops/factory.config.json` was form-checked at **no base at all** — and the caveat that
exists to say so was suppressed, because the variable existed.

### Mirror reproduction

Reviewer 6's, run against the committed `.js` at `392f3ab`:

```
control:  SCOPE  … ; VALIDATE_ROOT was not supplied, so the state root defaulted to this script's own
                  tree … was NOT examined. Pass VALIDATE_ROOT=<repo> to check it.        exit=0
finding:  SCOPE  governance configurations examined: agent-factory/config/factory.config.json
                                                                                          exit=0
```

The premise is asserted rather than assumed: the reader on that same repository reports
`source=ok, test_integrity=off` from the file neither run examined.

### The structural fix, in one sentence

**One expression for "was a state root supplied"** — `const SUPPLIED_STATE_ROOT = process.env.VALIDATE_ROOT?.trim() || null`
— read by both the branch and the caveat, so there is no second test to disagree with.

### What NEW freedom this creates, and how it is bounded

A trimming rule: `"   "` is now "not supplied" where it used to be a path. That is the intended
reading and it is the *stricter* one, but it is a new behaviour, so the case walks **every input
shape** — `unset`, `""`, `"   "`, a real path — and asserts the caveat's presence tracks
`STATE_ROOT`'s branch rather than the variable's existence.

### Mutation proof

Restoring either test independently (`VALIDATE_ROOT !== undefined` for the caveat; raw truthiness for
the branch) reds the empty and whitespace cases; markers grepped in the emitted `.js` before the run
was believed.

## R6-2 — one tree, two spellings, and the disclosure vanished from the exact invocation it was written for

### What it is

`const basesCollapsed = resolve(KIT_ROOT) === resolve(STATE_ROOT)`. `KIT_ROOT` is the **operator's
spelling**; `STATE_ROOT` falls back to `resolve(SCRIPT_DIR, "..")`, and `import.meta.dirname` is
**realpath-resolved by Node**. `resolve()` normalises `.` and `..` and does not follow symlinks, so
any symlinked ancestor on the kit path makes two spellings of one tree compare unequal. Then
`basesCollapsed` is false, R4-3's caveat is suppressed, the SCOPE line double-lists the same file,
and the run prints `ALL CHECKS PASSED` over a scope it has just misdescribed.

This is not a hypothetical path shape. macOS `/tmp` — and the whole default `TMPDIR` under `/var` —
is a symlink; so is a symlinked `~/.grugops`, a symlinked home, a Windows junction.

### It also inverted a residual this log had already recorded

`V-30-10-04` item 1 disposes of the `resolve()`-not-`realpathSync` dedupe as **"noisy, never
permissive"**. That disposition stopped being true the moment the identity test acquired a second
consumer whose *false negative suppresses a disclosure*. Recorded here rather than quietly amended:
the residual's reasoning was sound about the consumer it was written for, and wrong about the tree
after the consumer was added.

### The structural fix, in one sentence

**Ask the candidate loop instead of asking a string** — the state base collapsed onto the kit base
exactly when it contributed no resolved path the kit base had not already contributed
(`basesCollapsed = governanceBaseContributions[1] === 0`), so there is no spelling in the question at
all, and a future change to the candidate list moves the answer automatically.

### What NEW freedom this creates, and how it is bounded

The contributions are recorded **per base position, in an array** — deliberately not a map keyed by
the base string, because when the two roots are one tree they are one key and the map would report
the kit's contribution as the state base's. `canonicalBase` is also applied to `kitConfigAbs`, since
an identity test built from the raw root while the loop uses the canonical one misses the very file
it is about (this was caught by measurement, not by review: on macOS's `/var` symlink the mode and
cadence arm silently stopped firing).

### Mutation proof

Reverting to the string comparison reds the symlink case; the fixture overwrites the archived
`scripts/` with the working tree's, so it drives the artifact under test rather than HEAD's — without
that the case passes or fails for the wrong reason, which is the mutation-that-never-landed class
this log has already been bitten by twice.

## Reviewer 6 observation 1 — the SCOPE line listed two files where one governs

Taken as a correctness item rather than an observation. `readGovernanceConfig` takes the **first**
candidate it finds **entirely**: precedence is REPLACE, not merge. So a repository-level file that
mentions no checkpoints at all silently voids a kit-level tightening, with no refusal, and a banner
reading `all checkpoints at default`. Listing two paths as "examined" told a reader two files were
consulted where one governs.

The line now says so, and only when more than one position is listed — a line that explains
precedence on a tree with one config would be noise.

## R6-5 — the "independent witness" shared the row grammar with the parse it was witnessing

### What it is

R4-1 added `declaredResidualRows` as an independent witness and said so in its own structural pin:
"shares no parser, no loop and no intermediate". That was true of the **heading** grammar and false
of the **row** grammar — both passes skipped a line unless it began with a pipe. GFM makes the outer
pipes optional, so a row written without them is a table row to a reader and to GitHub, and was
dropped by both passes at once.

A membership comparison can only fire on an axis the two passes **disagree** about. On this axis they
agreed by being equally blind, and the page published a register short by that row while both
denominators called it complete.

### Mirror reproduction, with the reviewer's own control

Against the committed `.js` at `3d1f346`:

```
byte pass   [ '9', '10' ]
parse       [ '9', '10' ]
page names row 11? false
MIRROR exit=0 — render succeeded, row silently dropped by BOTH passes
```

Control, the same row content WITH outer pipes — the only variable:

```
byte pass   [ '9', '10', '11' ]
parse       [ '9', '10', '11' ]
```

### The structural fix, in one sentence

**The witness is made the WIDER of the two passes** — it accepts a row that omits its outer pipes and
the parse does not — so the disagreement, and therefore the named refusal, is the outcome; the
canonical row form is unchanged and still carries its outer pipes (D-64's posture: name the canonical
spelling, refuse the near-miss, never widen acceptance).

### What NEW freedom this creates, and how it is bounded

A wider denominator can **over**-count: any line containing a pipe whose first field is a bare number
above the historical rows now counts as declared. That direction is noisy and never permissive — it
can only refuse to publish, never publish short — which is the asymmetry this whole file is built on.
The bound is the live equality case: over the real register both passes must still name exactly the
same rows, so an over-count on this tree fails the suite rather than being discovered by a reader.

### A textual pin caught the comment explaining the fix

The "shares no parser" pin greps the function's own body, so the paragraph naming
`readResidualAdditions` reddened it. The rationale was moved into the doc comment above the function.
Recorded because the direction matters: the pin failed **safe**, and a pin that can be defeated by
prose inside the region it guards is worth knowing about.

### Mutation proof

Narrowing the witness back to `startsWith("|")`, and separately blinding the pipe-less body
extraction, each red the case; markers grepped in the emitted `.js` first.

## R6-3 — the sentence written for the old predicate, left standing after the predicate changed

### What it is

Round 3 (reviewer 4's observation 1) replaced `value !== fallback` with the ordered `isLowered`. The
**sentence** published when `lowered.length === 0` was written for the old predicate and was not
moved: it reuses the `BANNER_ALL_DEFAULT` literal and then asserts, in prose, that *every checkpoint
on the roster sits at its documented default*.

`commit_to_branch` is the one roster member whose default is not `block`, so declaring it `block` — a
legitimate, **stricter** posture that a cautious repository would actually adopt — empties `lowered`
and lands on that totalizing claim. Meanwhile `composeBanner`, asking strict equality, says
`checkpoints not at default: commit_to_branch=block` about the same tree.

Round 3 traded a **visible** false sentence for an **invisible** one: the pre-round-3 artifact printed
a wrong `LOWERED:` line, which a reader would notice; this one made the tightened page byte-identical
to the page for a tree that configured nothing.

### Mirror reproduction

Against the committed `.js` at `3d1f346`:

```
zero-config page bytes : 5919
TIGHTENED page bytes   : 5919
byte-identical         : true
tightened page says all-default: true
MIRROR exit=0
```

RED, before the fix existed, with the disagreement printed by the case itself:

```
AssertionError: matrix {"commit_to_branch":"block"}: page says all-default=true,
banner says "checkpoints not at default: commit_to_branch=block": expected true to be false
```

### The structural fix, in one sentence

**"Nothing is lowered" and "everything is at its default" are made two separately named questions** —
`isLowered` (the ordered rank) and `atDocumentedDefault` (strict equality, the predicate
`composeBanner` already asks) — and the render publishes a three-way statement whose third arm NAMES
the tightening instead of erasing it.

### Why ONE function and not two

The obvious repair was a second `tightenedCheckpoints` beside `loweredCheckpoints`, each with its own
`readGovernanceConfig` and its own loop. That would reintroduce, inside this file, precisely the shape
`evaluateMatrix`'s own comment says it exists to remove: two independent evaluations of one rule over
one config, free to disagree. One walk assigns every roster member to exactly one bucket.

### What NEW freedom this creates, and how it is bounded

**Three buckets where there were two** means a member can now go missing from all three and be
reported by no sentence — the short-denominator failure this project has already been bitten by. The
partition is therefore asserted TOTAL against the roster's own size, derived from
`CHECKPOINT_DEFAULTS` rather than from any of the three arrays that consume it, and the refusal is
named:

```
generate-guarantees: the checkpoint roster has 14 members but only 13 were classified as
at-default, lowered or tightened. …The document is refused rather than published short.
```

A second bound, the one reviewer 6 asked for: a case asserts the page's at-default claim and
`composeBanner`'s agree **on the same matrix**, across four matrices, so the two can never again say
different things about one tree.

A third thing worth stating plainly: today `commit_to_branch` is the ONLY member that can ever be
tightened, because every other default is already the strictest value. The tightened bucket therefore
has capacity one on this tree, and grows the moment any future checkpoint's default is not `block`.
The partition assertion holds either way; the plural wording was fixed because it will not always be
one.

### Mutation proof

Four mutations, each with its marker grepped in the emitted `.js`: `atDocumentedDefault` forced true;
the three-way branch collapsed back to two; the totality assertion defeated together with the
bucketing; and — the discriminating one — the bucketing broken with the assertion **left live**,
which produced the named refusal above rather than a wrong page.

## A gate that had been red since round 1, found by running it rather than by review

Not a reviewer finding. `npm run typecheck` runs **two** projects — `tsc --noEmit` and
`tsc -p tsconfig.tests.json` — and across all four rounds only the first was ever run. The second had
been failing since `87700bf` (round 1) on two errors, both mine:

```
scripts/validate.test.ts(991,18):        error TS2551: Property 'VALIDATE_ROOT' does not exist on type
                                         '{ VALIDATE_KIT_ROOT: string; }'
scripts/autonomy-zero-config.test.ts(307,65): error TS2345: Argument of type 'string' is not assignable
                                         to parameter of type '"benign-read-only" | …'
```

Vitest transpiles without typechecking, so a green suite said nothing about either — which is this
plan's own standing rule ("a green test suite must never be offered as a closure argument") arriving
from an unexpected direction. Both are fixed; the second was widened to `string[]` **deliberately**,
because typed as the literal union the comparison refuses the very argument the "carried but not
declared" direction exists to pass, and would have been well-typed and vacuous. That widening was
proved non-vacuous by planting an undeclared kind and observing the named red.

The process lesson is recorded rather than the defect: **run every gate the repository ships, not the
subset that has been failing informatively.**

## Round 4 — self-reproduction against the FIXED build (closure clause 5)

Every round-4 bypass, re-driven by the fixing agent against the committed artifacts at `ac57787`. The
corpus gates are driven inside a real `git clone` of this repository, not a `git archive` mirror —
the first attempt used an archive, which has no `.git`, so `check-diff-disposition` failed on
`not a git repository` **before it ever reached the frozen region** and returned a green-looking
`exit=1` for the wrong reason. That is this log's own recurring false-control class, caught here for
the seventh time, and it is why each row below names the evidence rather than the exit code alone.

| bypass | evidence against the fixed build |
|---|---|
| R5-1 — lone CR in a frozen region | `FAIL agent-factory/roles/orchestrator.md: carries a carriage return on 1 line(s) (lines 74)` — refused by name |
| R5-2 arm C — an HTML comment hiding a heading | region body: **8** untouched → **2** under the pre-fix artifact (six lines silently unfrozen) → **12** under the fixed one, i.e. intact |
| R5-3 — `workflows/rogue.mdwn` | `carries 1 entr(ies) the workflows corpus does not admit — rogue.mdwn`, once per anchor |
| R5 obs. 4 — `roles/rogue.markdown` | `carries 1 entr(ies) the roles corpus does not admit — rogue.markdown` |
| R6-6 — root `PUBLIC.markdown` with live disproven claims | `check-public-docs-vocabulary` exit 1 naming the file; `check-banned-claims` exit 1 |
| R6-4 — a companion consumer of `publicDocsScan` | caught by name: `consumer(s) … with no declared direction: [scripts/check-public-docs-vocabulary-companion.ts::publicDocsScan]`; control clean at 28/28 |
| R6-1 — `VALIDATE_ROOT=""` | `VALIDATE_ROOT was not supplied` now printed |
| R6-2 — symlink-spelled kit root | caveat printed; SCOPE lists the in-kit config **once** |
| R6 obs. 1 — precedence | SCOPE carries `precedence is replace, not merge` when more than one position is listed |
| R6-5 — a row without outer pipes | `REFUSED: … declared but NOT PUBLISHED [11]`; mirror exit 0 → tree exit 1 |
| R6-3 — a tightened checkpoint | mirror: 5919 bytes, byte-identical to zero-config, exit 0 → tree: 6069 bytes, exit 1, the tightening named |

A note on two of these. R5-1's first plant landed in `_role-switch-protocol.md`, the one **exempt**
role — `ls | head -1` sorts it first — so it measured nothing; and R5-2's first plant was placed
*before* the frozen heading rather than inside the region, so it also measured nothing while
returning a plausible number. Both were re-done. Recorded because the failure mode is the same one
the mutation discipline exists for: a probe that produces a clean-looking result from an input that
never reached the predicate.

# Round 4 reviews — the closure attempt AT THE CAP

**Both at `claude-opus`, both over surface B as scoped by round 4's scope statement, and NEITHER
returned "nothing new".** D-22's cap is reached. There is no round 5: every finding below is a
recorded backlog item, not a fix.

| reviewer | model | lens | verdict |
|---|---|---|---|
| Reviewer 7 | claude-opus | heading/fence authority + frozen anchors + membership | **FINDINGS: 4** (R7-1 … R7-4) + a fence audit of `V-30-10-01..10` |
| Reviewer 8 | claude-opus | validator + reader + render/freshness + pins | **FINDINGS: 6** (R8-1 … R8-6) + a full `package.json` gate sweep |

**Ten distinct findings, no overlap.** Two are created by round 4's own fixes and say so in the
reviewer's words: **R7-2** by R5-2's `blockContextFlags` HTML arm, and **R8-2** by R6-3's three-arm
render. A third, **R7-3**, reaches reviewer 5's observation-4 harm *through the inversion written to
close it*. The ratio that has held for three rounds held for a fourth.

Both reviewers asserted artifact identity on entry and exit (9/9 and 6/6 sha256 comparisons against
`git show HEAD:<path>`), proved every renderer premise against the reference `commonmark`
implementation including the NEGATIVE cases, and each caught **their own** false control mid-review —
reviewer 7 an off-by-one line index that threw `premise fail` before anything was believed, reviewer 8
an exit status captured after a pipe and a plant that landed nowhere. That is the same false-control
class this log has now recorded on both sides of the review boundary.

Reviewer 8 additionally ran **every `package.json` script** except the live e2e lane: all green,
including both `typecheck` projects. `V-30-10-10`'s class does not recur.

## The two reports, verbatim

Recorded byte-for-byte, each inside a five-backtick container. The container is disclosed rather than
silent because it is load-bearing: **reviewer 7's report contains an unbalanced column-zero fence** —
its R7-1 input block is literally a fence wrapping fence lines, being a report about fence parsing —
so pasting it uncontained would leave every following section of this log inside an open code block.
A report about a fence-parsing defect that breaks its own host document's fence parsing is worth
noting in a log whose subject is exactly that.

### Reviewer 7 — verbatim

`````markdown
Tree restored, artifacts verified 9/9 on entry and exit. Here is the report.

---

## Reviewer 7 (round 4) — model: claude-opus (strongest available) — scope: surface B, heading/fence authority + frozen anchors + membership lens

### Verdict: FINDINGS: 4

All four are reproduced on the committed `.js` at `7dc9018`, driven from the detached worktree, with the reference `commonmark` implementation used for every renderer premise and a control run for every plant. The tree is restored; `git status --short` shows only `node_modules`.

---

### Findings

#### R7-1 — the section EXTENT is the strict view and BOTH collecting passes are the lax view; an indented closing fence separates them

**Severity: high. Direction: permissive + invisible.**

**Predicate.** `deriveCheckpoints` (`scripts/checkpoints.ts:744-796`) takes its section range from `locateSection` → `sectionEndIndex`/`unfencedHeadingIndices`, which R5-2 moved to `blockContextFlags` (strict). Pass A's line filter is `fencedLineFlags(text)` (lax, line 755) and pass B is `unfencedMatchIndices` (lax, `frontmatter.ts:1069`). CommonMark §4.5 allows a **closing** fence to be indented up to three spaces; round 3 declined that rule for the lax view and recorded its residual as *"over-scanning, which is fail-closed"*. For a **closing** fence the same omission runs the parity the other way: the fence stays open to EOF in the lax view while the renderer and the strict view both close it.

**Input** (appended inside `09-daily-sweep.md`'s `## Stop conditions` section, after the last real bullet):

```
```
   ```
- Never deploy without a second human. `checkpoint: planted_ghost_stop`
```

**Exact repro**

```
$ node -e "const fs=require('fs');const f='agent-factory/workflows/09-daily-sweep.md';
  const l=fs.readFileSync(f,'utf8').split('\n');
  l.splice(44,0,'\`\`\`','   \`\`\`','- Never deploy without a second human. \`checkpoint: planted_ghost_stop\`');
  fs.writeFileSync(f,l.join('\n'))"

$ node probe-derive.mjs "$PWD/scripts/checkpoints.js"
ACCEPTED — ids=10 sites=16 examined=38 counted=38 sections=19
planted_ghost_stop present? false                                          exit 0

$ VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js
ALL CHECKS PASSED                                                          exit 0

$ npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts
Tests  133 passed (133)                                                    exit 0

$ node probe-frozen.mjs        # check-diff-disposition
regions=55 refusals=0 cardinalities= … workflows `## Stop conditions`:19/19
```

**Premise, asserted twice.**
1. *The plant is refusable content.* The SAME bullet without the two fence lines: `ACCEPTED — ids=11 sites=17 examined=39 counted=39`, `planted_ghost_stop present? true`, and `scripts/checkpoints.test.ts` → **5 failed**, naming *"the derivation produces 1 id(s) the roster does not admit — [planted_ghost_stop]"*. So the invisibility is caused by the two fence lines and by nothing else.
2. *The renderer shows the bullet.* `commonmark` on the section:
   `<h2>Stop conditions</h2><ul><li>…escalate_stale_blocker</li><li>…exceed_wip_limit</li></ul><pre><code></code></pre><ul><li>Never deploy without a second human. <code>checkpoint: planted_ghost_stop</code></li></ul>`
3. *The two views measured directly*: `fencedLineFlags` = `[true,true,true,true,true]`, `blockContextFlags` = `[true,true,false,false,false]` on the same bytes.

**Why permissive/invisible.** A canonically tagged human stop is declared in a workflow, is visible to every reader, and is collected by nothing, refused by nothing and counted by nothing — with `examined === counted` at 38/38, i.e. the two-pass shear detector agreeing because both passes take the same wrong flags. This is verbatim B-3/F2/R3-1/R3-2's stated harm.

**Structural fix + its new freedom.** The three heading questions were moved to the strict projection; the two questions that decide **which lines inside that extent are governed** were not. Move pass A and pass B onto `blockContextFlags` too (one walk feeding the whole derivation), or — the narrower repair — adopt §4.5's ≤3-space rule for the **closing** delimiter only in the lax machine, which cannot narrow any scan set (it can only close a fence earlier, i.e. scan more). *New freedom:* moving the collectors to strict changes what the checkpoint corpus scans in the 460-file divergent set; bound it by re-measuring the roles-and-workflows delta (today: 1 line) and asserting `examined`/`counted` are unchanged on the live corpus.

---

#### R7-2 — `blockContextFlags`' HTML arm opens a phantom block on any line starting with `<`, hiding a byte-exact anchor heading — a **new** hole created by R5-2

**Severity: high. Direction: permissive + invisible (un-freezes frozen clauses).**

**Predicate.** `HTML_BLOCK_OPEN = /^ {0,3}<[!\/a-zA-Z]/` (`frontmatter.ts:560`) with the block running to the next blank line. CommonMark §4.6 type 6 requires the tag name to be in a fixed list and type 7 requires a *complete tag alone on the line* that *cannot interrupt a paragraph*. This regex matches neither condition: an **autolink** (`<https://…>`), an inline `<span>x</span>`, `<foo@bar>` — all ordinary paragraph content to a renderer — open a block here.

The code comment claims *"the direction of that gap is UNCHANGED behaviour rather than a new hole"*. Measured false:

```
text = "<https://example.com/spec>\n## Hard limits\n- Never merge.\n\ntail\n"
PRE-R5-2 (git show 392f3ab:scripts/frontmatter.js)  unfencedHeadingIndices → [1]
HEAD     (7dc9018)                                  unfencedHeadingIndices → []
commonmark                                          <p><a …>…</a></p><h2>Hard limits</h2>…
```

**Input** — `agent-factory/roles/orchestrator.md`: one line `<https://example.com/orchestrator-spec>` inserted immediately above the real `## Hard limits` (line 74), plus a decoy `## Hard limits` section appended at EOF.

**Exact repro**

```
$ node probe-frozen.mjs      # CLEAN
regions=55 refusals=0  roles `## Hard limits`:17/17
orchestrator.md region = {from:74, to:82}      frozen clause count = 446

$ node probe-frozen.mjs      # PLANTED
regions=55 refusals=0  roles `## Hard limits`:17/17
orchestrator.md region = {from:85, to:87}      frozen clause count = 429
```

**17 frozen clauses left the freeze**, silently, with the cardinality reporting `17/17`, zero refusals, and the whole "Coordinator hard limit (clear voice — a safety/capability surface)" paragraph — the WIP/spawn/merge/deploy limits — among them.

**Control (the decoy is load-bearing).** The autolink line alone, no decoy: `roles ## Hard limits: 16/17`, region absent — i.e. the gate is red without the decoy, so the bypass is the pair, and the duplicate-heading refusal never fires because only one occurrence is *visible*.

**Why permissive/invisible.** Exactly R3-3's harm (*"silently un-freezes every clause below it while the gate goes on printing 17/17"*), reached through a construct R3-3's refusals cannot see, and created by round 4's own fix.

**Structural fix + its new freedom.** Make the HTML arm ask CommonMark's actual start conditions: type 1 (`pre|script|style|textarea`, ends at the closing tag), type 2/3/4/5 (literal openers), type 6 (the fixed tag-name list), and type 7 only for a *complete tag alone on the line that does not interrupt a paragraph*. Anything else is not a block. *New freedom:* a hand-written tag-name list — this repository's named second failure class — so pin it two-sided against the §4.6 list, assert the governed-corpus delta stays at its measured value, and add a permanent case that `<https://…>` and `<span>x</span>` are **not** block openers. Refusing such a line is the wrong repair: it would red legitimate documents.

---

#### R7-3 — the two hand-written membership exemptions are NAME tests, not FILE tests, so each exempt name is an unbounded container inside the corpus's own closed directory

**Severity: medium. Direction: permissive + invisible (narrows the scan set; ships to hosts).**

**Predicate.** `listRoleDirEntries` / `listWorkflowDirEntries` (`kit-model.ts`) filter `!EXEMPT_NAMES.includes(f)` over `readdirSync`, and the round-4 inversion refuses everything else. `readdirSync` returns directories too, and nothing asserts an exempt entry is a regular file. The inversion is one level deep.

**Exact repro (four arms, each on the live tree)**

```
$ rm agent-factory/roles/.gitkeep && mkdir agent-factory/roles/.gitkeep
$ cp agent-factory/roles/orchestrator.md agent-factory/roles/.gitkeep/rogue-role.md
$ node probe-frozen.mjs           regions=55 refusals=0  roles `## Hard limits`:17/17
$ VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js   exit 0
$ node probe-derive.mjs           ACCEPTED — ids=10 sites=16 examined=38 counted=38  exit 0
```

Same result for `agent-factory/workflows/.gitkeep/20-rogue.md` (a full numbered workflow with a `## Stop conditions` section: `19/19`, `refusals=0`, derivation unchanged) and for `agent-factory/roles/_role-switch-protocol.md/rogue.md` (`17/17`, `refusals=0`).

**Control.** A non-exempt subdirectory IS refused by name:
`agent-factory/roles: carries 1 entr(ies) the roles corpus does not admit — notes.` So the exemption name is precisely what makes the container invisible.

**Why permissive.** `install/install.ts:1546` copies `agent-factory` with `{recursive:true}`, so the contents ship into every installed kit. A complete role document — `## Hard limits` and all — is placed in the kit, read by an agent, frozen by no gate, counted by no cardinality and scanned by no language guard. This is reviewer 5's observation 4 harm, reached through the fix written for it.

**Structural fix + its new freedom.** Assert the entry TYPE: an exempt name must be a regular file (`statSync(…).isFile()`), and any directory entry in a closed corpus directory is refused by name regardless of its name. *New freedom:* a `stat` per entry (an unreadable/dangling entry is a new third outcome) — bound it with a case for a dangling symlink and one for a directory named exactly `.gitkeep`.

---

#### R7-4 — inline HTML that renders to nothing is not folded, so a heading a reader sees as `## Stop conditions` truncates the section and is refused by neither arm

**Severity: high. Direction: permissive + invisible.**

**Predicate.** `renderedText` folds numeric character references, zero-width code points and whitespace runs. It does not remove markup that produces **no visible output**: an HTML comment, an empty element, an anchor tag. Such a line matches `/^#{1,2} /`, so `sectionEndIndex` **closes the section on it**, while `unfencedHeadingIndices` (byte equality) and `unfencedHeadingNearMisses` (rendered-text equality) both say nothing. This is not the disclosed visual-confusable open set (D-59) — these spellings render to *literally the same characters*.

**Renderer premise** (`commonmark`): `## Stop conditions<!-- x -->` → `<h2>Stop conditions<!-- x --></h2>`; `## Stop conditions<a name="s"></a>` → `<h2>Stop conditions<a name="s"></a></h2>`; `## Stop <span></span>conditions` → `<h2>Stop <span></span>conditions</h2>`. Visible text in all three: exactly `Stop conditions`.

**Exact repro — arm A, the truncating form** (`## Stop conditions<!-- anchor -->` inserted between the two tagged bullets of `09-daily-sweep.md`, i.e. R3-1's own attack position):

```
occurrences [41]  nearmiss []  sectionEnd(from 42) = 43     ← it truncates, unrefused
$ node probe-derive.mjs
ACCEPTED — ids=9 sites=15 examined=37 counted=37 sections=19      exit 0
exceed_wip_limit present? false
$ node scripts/check-diff-disposition.js | grep "frozen clause"
… 19/19 … 442 frozen clause(s), 55 frozen region(s)               (clean: 446)
$ VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js
ALL CHECKS PASSED                                                 exit 0
```

A **live roster member removed from the derived set with both independent bullet counts agreeing at 37/37**, and four frozen clauses unfrozen with the cardinality at 19/19 and zero refusals.

**Exact repro — arm B, the fully invisible form** (the same heading placed *after* the last real bullet, followed by a new tagged stop):

```
$ node probe-derive.mjs
ACCEPTED — ids=10 sites=16 examined=38 counted=38 sections=19     exit 0
planted_ghost_stop present? false ; all 10 roster members intact
$ VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js  ALL CHECKS PASSED
$ npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts   Tests 133 passed (133)
$ node scripts/check-diff-disposition.js | grep -o "[0-9]* frozen clause(s)"   446 frozen clause(s)
```

**Every number is byte-identical to the clean tree** while a human stop is declared, rendered and governed by nothing.

**Sweep (reviewer 5's 21 spellings re-run against the round-4 artifact, plus five new axes).** All 15 previously closed spellings still refused; `### Stop conditions` correctly accepted; `&nbsp;`/`&Tab;` behave as V-30-10-09 describes; **three new bypasses**, all `same=true truncates=true refused=false`: `## Stop conditions<!-- x -->`, `## Stop <span></span>conditions`, `## Stop conditions<a name="s"></a>`.

**Structural fix + its new freedom.** `renderedText` must strip what a renderer emits with zero visible glyphs before comparing: HTML comments (`<!--…-->`) and empty/void inline elements are a *closed, decidable* grammar — unlike the named-reference table — and the module already owns a `VISIBLE_GLYPH` class it can reuse. Then all three spellings become near-misses and are refused by name; acceptance is unchanged. *New freedom:* an inline-HTML stripper inside the one heading authority, which could over-fold a heading that legitimately contains rendered inline markup (`## Use <code>x</code>`) — bound it by folding only constructs that emit no glyph, by asserting the live corpus still carries zero near-misses across all 55 regions and all 19 stop sections, and by a case that a glyph-bearing inline element is NOT folded.

---

### Fence audit — each entry's stated direction/bound, measured

| id | verdict |
|---|---|
| `V-30-10-01` hook does not publish `checkpointRefusals` | **Correct.** `git grep` confirms no non-test consumer; surface A owns it. |
| `V-30-10-02` derivation assertions have no shipped consumer | **Correct, and stronger than stated.** `deriveCheckpoints`/`checkpointSites` have **no non-test consumer at all**; `validate-agent-factory.ts` imports only the static `CHECKPOINTS`/`DISPOSITIONS`. Every round-1..4 refusal inside the derivation is a vitest-only tripwire. |
| `V-30-10-03` hook's kit-root fallback base | Out of scope (surface A); not measured. |
| `V-30-10-04` resolve-vs-realpath / one-space grant / `sectionsFound === filesWalked` vacuity | **Correct as rewritten.** Item 3 stands: `sectionsFound` is still incremented once per located section, so `=== filesWalked` remains an identity. |
| `V-30-10-05` six round-3 observations | Not re-measured (out of my lens). |
| `V-30-10-06` eight round-4 observations | Item 4 (named whitespace entities) confirmed a closed decidable set; see `V-30-10-09`. |
| `V-30-10-07` alias list cannot be completed for the open public-docs corpus | **Correct**, and the roles/workflows inversion it contrasts itself with is the one R7-3 defeats — the inversion does not "remove the freedom entirely", it removes the *extension* freedom and leaves the *entry-type* freedom. |
| `V-30-10-08` five §4.6 HTML block types unmodelled | **Direction is one-sided and measurably incomplete.** It records only UNDER-modelling ("a heading inside one of them can still be classified as a terminator"). The live and larger hole is OVER-modelling: `HTML_BLOCK_OPEN` opens a phantom block on lines that are not HTML blocks at all, which hides a *byte-exact* heading — see R7-4… R7-2. The claim "the direction of that gap is UNCHANGED behaviour rather than a new hole" is falsified by the `392f3ab` → `7dc9018` comparison. |
| `V-30-10-09` named references not decoded | **Substance right, stated direction wrong.** Measured: `## Stop&nbsp;conditions` and `## Stop&Tab;conditions` truncate for **both** the module and the renderer — they are ordinary headings to both, so nothing "truncates differently". The real residual is that they render *visually* identically and are not refused. The entry should say that, not that truncation diverges. |
| `V-30-10-10` typecheck runs two projects | **Correct**, and confirmed live: `package.json` `typecheck: tsc --noEmit && tsc -p tsconfig.tests.json`, both wired in CI. |

Two round-4 corpus claims re-measured and **both correct**: strict-vs-lax differ *somewhere* in **460 of 1,501** tracked markdown files, and over the governed roles-and-workflows corpus (37 files) on **exactly one line** — `agent-factory/workflows/04-ticket-to-pr.md:42`, the single-line HTML comment. The governed corpus carries exactly one `HTML_BLOCK_OPEN` match, that same line.

---

### Probes that found nothing

1. **`check-banned-claims` via the indented closing fence** — the gate's main scan is fence-blind, so it caught the plant at `README.md:75` (3 findings, exit 1) where the fence-aware derivation did not. Over-scanning, fail-closed. Nothing found.
2. **CRLF as a fence desync.** `strictFenceRun`'s info test `/^[ \t]*$/` rejects a trailing `\r`, so a CRLF closing fence would never close in the strict view. Unreachable: `.gitattributes` `*.md text eol=lf`; `git add` of a CRLF fence line produced a blob with pure LF (`od -c` verified). R5-1's CRLF carve-out is sound.
3. **U+2028 / U+2029 / U+0085 / form feed as line separators.** `commonmark` shows **no** heading for any of them (`rendererShowsH2=false`) and the module also sees none — agreement on all four. Only the lone CR diverges, and `carriageReturnLines` reports it.
4. **Live frozen-region agreement with the reference renderer.** All 55 regions cross-checked against `commonmark` sourcepos heading positions: **0 disagreements, 0 refusals** — no live false red, and no live region that truncates with cardinality green.
5. **Live near-miss / duplicate refusals across all three anchors and 55 regions** — zero firing, so the refusals are not already noisy.
6. **`unfencedHeadingNearMisses` disjointness and the level-3 rule** — `### Stop conditions` correctly accepted (closes no level-2 section), near-miss set disjoint from the exact set on all 23 sweep rows.
7. **Case-collision on the exemption names** — `readdirSync` returns the on-disk spelling, so `.GITKEEP` is refused; the exemption is an exact-name test as documented.
8. **Non-exempt subdirectory in either corpus directory** — refused by name (`notes`), both corpora.
9. **`rogue.markdown` in `agent-factory/roles/`** — refused by `check-diff-disposition` by name; the round-4 inversion holds on the extension axis.
10. **Named-reference near-misses** (`&nbsp;`, `&Tab;`) — behave exactly as `V-30-10-09` fences; no new axis.
11. **Zero-width tails** (`U+200B`, `U+2060`, `U+00AD`), two-space forms, closing-hash forms, tab separator, ≤3-space indent, one-hash, numeric/hex references — **all still refused** at HEAD; R3-1's and F2's fixes hold.
12. **`## Stop conditions` with a leading `<!-- x -->` on the same line** — renders as a paragraph, not a heading; the module also sees no heading. Agreement.

---

### Observations (fail criterion 2 as measured today, recorded anyway)

1. **R5-1's carriage-return refusal was added at one of two corpus owners.** `carriageReturnLines` is asked only in `check-diff-disposition.ts`. `scripts/checkpoints.ts` — which owns its own corpus refusals — never asks it. Measured: `## Hard limits\r#`-style plant in `09-daily-sweep.md` → `deriveCheckpoints` **ACCEPTED, ids=10 sites=16 examined=38 counted=38**, validator **exit 0**, planted stop invisible; only `check:diff-disposition` names it (2 findings). It is caught in this repository's CI because the workflows anchors are in `FROZEN_SECTION_ANCHORS`, which is why this is an observation and not a finding — but it is R3-3's "a refusal added at one of N consumers" shape, and it becomes a live hole the moment those anchors change or the kit is validated outside this repository.
2. **The shipped validator performs none of the corpus-membership or heading-form refusals.** `validate-agent-factory.js` returns `ALL CHECKS PASSED` over a kit containing `roles/rogue.markdown`, `roles/.gitkeep/rogue-role.md`, a duplicate stop section or a near-miss heading. Every one of rounds 1–4's corpus refusals lives in `check-diff-disposition` (needs git) or in vitest. This generalises `V-30-10-02` from "the derivation assertions" to "the derivation and both membership inversions".
3. **The `.gitkeep` entries exist for a reason that a type test would not break** — both directories genuinely carry a `.gitkeep` file today, so `statSync().isFile()` is available as a bound at zero cost.
4. **Round 4's own new-freedom disclosure for `blockContextFlags` names the right risk and measures the wrong half.** It measured the two views' divergence (460/1501, 1 governed line) and asserted no extent moves — both true — but the disclosure is a statement about *today's corpus*, not about what the arm *accepts*, which is what R7-2 walks through. "Measure the delta on the corpus" and "ask what the predicate enumerates" are different questions, and only the first was asked.

---

### Premise assertions performed

- **Artifact identity, entry and exit.** sha256 of nine committed `.js` (`frontmatter`, `checkpoints`, `check-diff-disposition`, `kit-model`, `validate-agent-factory`, `check-banned-claims`, `context-io`, `generate-guarantees`, `check-public-docs-vocabulary`) compared against `git show HEAD:<path>` — **9/9 `premise OK` on entry, 9/9 on exit**. Every probe drove the committed `.js`; no `.ts` was edited.
- **Every renderer claim proved against `commonmark`** installed under `/tmp/r7cm` (never in the worktree), including the **negative** claims (U+2028/2029/0085/FF show no heading; a leading `<!-- -->` shows no heading).
- **Every plant proved refusable.** R7-1: the same bullet without the fence lines is collected (`ids 10→11`) and reds 5 tests. R7-2: the autolink line without the decoy reds the cardinality (`16/17`). R7-3: a non-exempt subdirectory is refused by name. R7-4: the same heading spelled canonically is refused as a duplicate.
- **One premise check failed and stopped a probe** — an off-by-one line index (`l[43]` vs `l[42]`) threw `premise fail` before any measurement was believed; re-run against measured indices. Two subsequent command outputs produced on the unmodified tree were discarded rather than read.
- **Vacuity floors.** Clean-tree baselines measured before every comparison: 446 frozen clauses, 55 regions, 0 refusals, `17/17 · 19/19 · 19/19 · 47/47`, derivation `ids=10 sites=16 examined=38 counted=38 sections=19`, `checkpoints.test.ts` 133/133.
- **Tree restored**; `git status --short` → `?? node_modules` only.
`````

### Reviewer 8 — verbatim

`````markdown
Tree restored and clean; committed artifacts byte-identical to HEAD on exit. Report follows.

## Reviewer 8 (round 4) — model: claude-opus (strongest available) — scope: surface B, validator + reader + render/freshness + pins lens

### Verdict: FINDINGS: 6

---

### Findings

#### R8-1 — the SCOPE line's "the FIRST is the one that governs" points at the wrong file whenever the governing candidate is contributed by the SECOND base, and its labels are base-relative so two files print as one string

**Severity:** medium. **Predicate:** `validate-agent-factory.ts` SCOPE line, the reviewer-6-observation-1 precedence clause (`governanceExamined.length > 1 ? " — of these the FIRST is the one that governs…"`).

**What it is.** `governanceExamined` is filled by the base loop: base 0 (KIT) contributes its `.grugops` then its in-kit config, then base 1 (STATE). Within one base the order *is* the reader's precedence. **Across bases it is not.** In the shared-install two-root shape — kit carries the in-kit config, repo carries `.grugops/factory.config.json` — the list is `[agent-factory/config/factory.config.json, .grugops/factory.config.json]` and the sentence names the kit config as governing, while `readGovernanceConfig(<repo>)` governs from `.grugops`. Separately, `relativeToBase` renders every label base-relative, so two distinct files under two roots print as the *same string*.

**Exact repro (committed `.js`, HEAD 7dc9018):**

```
W=$(mktemp -d); mkdir -p $W/kit $W/state
cp -R scripts/fixtures/good/agent-factory $W/kit/; cp scripts/fixtures/good/AGENTS.md $W/kit/
cp -R scripts/fixtures/good/.claude-plugin $W/kit/; cp -R scripts/fixtures/good/plans $W/state/
mkdir -p $W/state/.grugops
echo '{"checkpoints":{"open_pr":"off"}}' > $W/state/.grugops/factory.config.json
VALIDATE_KIT_ROOT=$W/kit VALIDATE_ROOT=$W/state node scripts/validate-agent-factory.js
```

**Observed on HEAD (exit 0):**
```
  SCOPE    governance configurations examined: agent-factory/config/factory.config.json,
           .grugops/factory.config.json — of these the FIRST is the one that governs: precedence is
           replace, not merge, so a repository-level file voids the kit's declarations entirely…
ALL CHECKS PASSED
```

**Premise asserted** (the reader, same trees, committed `context-io.js`):
```
candidates under state root: [ <W>/state/.grugops/factory.config.json,
                              <W>/state/agent-factory/config/factory.config.json ]
source= ok open_pr= off        ← the SECOND-listed file is the one that governs
kit-base read: open_pr= block
```

**Control (single tree, both roots one dir):** order is `[.grugops…, agent-factory/config…]` — the sentence is *correct* there. The falsity is specific to the two-root arrangement, i.e. the exact shape R4-3 and obs-1 were written for.

**Second facet — the label collision, on a live-shaped invocation.** Kit `.grugops` + repo `.grugops` + in-kit config:
```
SCOPE governance configurations examined: .grugops/factory.config.json,
      agent-factory/config/factory.config.json, .grugops/factory.config.json — of these the FIRST…
ALL CHECKS PASSED
```
Two of three entries are the same string from different trees. And with `VALIDATE_ROOT` unset against a kit that is not the script's own tree (a tool checkout validating a customer kit — the header's documented `VALIDATE_KIT_ROOT=/path/to/kit` form):
```
SCOPE governance configurations examined: agent-factory/config/factory.config.json,
      agent-factory/config/factory.config.json — of these the FIRST is the one that governs…
ALL CHECKS PASSED
```
— two different trees' configs, one label, printed twice, and R4-3's caveat absent (correctly, since `contributions[1] ≠ 0`).

**Why permissive/invisible.** The gate publishes a false sentence in the one line whose subject is which file decides runtime behaviour. An operator reading it looks for a lowered checkpoint in the file that does *not* govern; a `.grugops` drop that voids a kit-level tightening is exactly the case the sentence was added to expose.

**Suggested structural fix.** Make the sentence a property of the *reader's* answer rather than of list position: record, per examined path, whether `readGovernanceConfig(<base>)` for that base would stop there, and name the governing path explicitly (and per base, since there is one governing file *per base*, not one per run). Label positions by base-qualified path, not base-relative path. **New freedom it creates:** a run now names a base-qualified absolute-ish path, which leaks the operator's directory layout into a log — bound it by naming the base by its role (`kit:` / `state:`) rather than by its full spelling.

---

#### R8-2 — the `tightened` bucket is computed, asserted total, and then never published whenever anything is also lowered; the page and `composeBanner` disagree about one tree

**Severity:** medium. **Predicate:** `generate-guarantees.ts` `matrixDepartures` + the three-arm render branch (R6-3's fix).

**What it is.** The three arms are `lowered===0 && tightened===0`, `lowered===0`, `else`. The third arm fires on `lowered > 0` **regardless of `tightened`** and renders only the LOWERED table. The totality assertion (`placed !== entries.length`) is over the **partition**, not over the **publication**: every member is classified, the assertion is satisfied, and a whole bucket is dropped on the floor. This is R6-3's own named failure ("a member … reported by no sentence") relocated from classification to rendering.

**Exact repro (committed `.js`, HEAD 7dc9018):**
```
mkdir -p .grugops
echo '{"checkpoints":{"commit_to_branch":"block","exceed_wip_limit":"off"}}' > .grugops/factory.config.json
node scripts/generate-guarantees.js ; echo "exit=$?"
grep -c commit_to_branch docs/GUARANTEES.md
```
**Observed on HEAD:**
```
Wrote docs/GUARANTEES.md — 6 safety row(s).
exit=0
0                       ← the tightening is nowhere on the page
```
Page section rendered: `**LOWERED: 1 checkpoint(s) sit below their documented default…** | exceed_wip_limit | off | block | GRUGOPS_FLOOR_EXCEED_WIP_LIMIT |` — and nothing else.

**Premise asserted**, same matrix, committed `checkpoints.js`:
```
banner: checkpoints not at default: commit_to_branch=block, exceed_wip_limit=off
```
The banner names two departures; the page names one. R6-3's stated bound — "a case asserts the page's at-default claim and `composeBanner`'s agree on the same matrix, across four matrices, so the two can never again say different things about one tree" — does not hold.

**And the pin that was supposed to hold it is short in two ways.** `generate-guarantees.test.ts:981` asserts only the **one bit** `page.includes(BANNER_ALL_DEFAULT) === (banner === BANNER_ALL_DEFAULT)`; it never compares the departures the two name. Its four matrices are `{}`, `{commit_to_branch:"block"}`, `{commit_to_branch:"notify"}`, `{plan_approval:"block"}` — **`plan_approval` is not a roster member** (roster measured: 14 ids, no `plan_approval`), so the fourth matrix is a vacuous duplicate of the first. Three distinct inputs, none combining a lowering with a tightening.

**Why permissive/invisible.** A departure the page exists to name is unnamed while every gate is green and the freshness gate reports fresh; the guard banner and the published page describe one tree differently, which is the AP-1 shape `evaluateMatrix`'s own comment says it exists to remove.

**Suggested structural fix.** Render from the partition rather than from a branch over two of its three arms: emit one departures section that iterates `[...lowered, ...tightened]` and lets each row carry its own direction, with the assertion moved from "every member was classified" to "every member of `lowered ∪ tightened` appears in the rendered bytes". **New freedom:** a byte-level assertion over rendered output couples the check to the table's markdown spelling — bound it by asserting on the row-composing function's output, not on the joined page string.

---

#### R8-3 — the markdown-alias list does not equal the authority it declares, and a root `PUBLIC.scd` carrying live disproven claims leaves both language gates at exit 0

**Severity:** medium. **Predicate:** `kit-model.ts` `MARKDOWN_ALIAS_EXTENSIONS` / `imitatesMarkdownName`, consumed by `check-public-docs-vocabulary.ts` `refuseMarkdownImitations`.

**What it is.** The list's declared provenance is stated in its own doc comment: *"These are the extensions GitHub Linguist classifies as Markdown."* It carries ten. GitHub Linguist's `Markdown` entry also carries `.scd` (scdoc), which is absent — so the list is a strict subset of its own named authority, and the sentence asserting otherwise is false. (It also carries `.mdx`, which Linguist now holds as a separate language, so the two sets differ in both directions. I could not fetch `languages.yml` from this sandbox; the *measurement* below stands independently of the provenance question.)

**Exact repro (committed `.js`, HEAD 7dc9018), with controls:**
```
P='This kit uses a handoff packet. It conforms to ASD-STE100.'
for ext in scd md markdown qmd; do
  printf '%s\n' "$P" > PUBLIC.$ext
  node scripts/check-public-docs-vocabulary.js >/dev/null 2>&1; v=$?
  node scripts/check-banned-claims.js          >/dev/null 2>&1; b=$?
  echo ".$ext vocab=$v banned=$b"; rm -f PUBLIC.$ext
done
```
**Observed on HEAD:**
```
.scd       vocab_exit=0  banned_exit=0  named_in_vocab=0  named_in_banned=0
.md        vocab_exit=1  banned_exit=1  named_in_vocab=1  named_in_banned=1
.markdown  vocab_exit=1  banned_exit=1  named_in_vocab=1  named_in_banned=1
.qmd       vocab_exit=0  banned_exit=0  named_in_vocab=0  named_in_banned=0
```
`.scd` and `.qmd` are neither members, nor imitations, nor derivation refusals, nor counted by `PUBLIC_DOCS_SCAN_COUNT`. This is R6-6's exact shape, reached through a name R6-6's own list still does not carry.

**Relation to the fence.** V-30-10-07 records the residual with the right *direction* (permissive) but frames it as undecidable — "an OPEN set … so inversion does not apply". The part measured here is **decidable and one member wide**: the list fails against the authority it names. Reported as a finding on the ground that the artifact publishes a false provenance sentence and the fence's bound understates what is closeable.

**Suggested structural fix.** Vendor the authority rather than transcribing it: commit the extension set as a data file with its source URL and a checked-in `sha`, and assert in a test that the module's list *equals* that file. **New freedom:** a vendored list is a set literal, which is this repository's other systemic failure class — bound it by making the file the only declaration and the module's array a derivation from it, with a count asserted at the point it is spent.

---

#### R8-4 — the validator's verdict goes to stdout and its entire scope disclosure to stderr; a stdout-only capture receives an unqualified `ALL CHECKS PASSED`

**Severity:** medium. **Predicate:** `validate-agent-factory.ts` — `console.error` for the SCOPE line, `console.log("ALL CHECKS PASSED")` for the verdict.

**Exact repro (committed `.js`, HEAD 7dc9018), on the live tree:**
```
env -u VALIDATE_ROOT VALIDATE_KIT_ROOT=$(pwd) node scripts/validate-agent-factory.js 2>/dev/null
```
**Observed on HEAD:**
```
ALL CHECKS PASSED
exit=0
```
and the whole disclosure on the other stream:
```
$ … 2>&1 >/dev/null | head -2
  SCOPE    governance configurations examined: agent-factory/config/factory.config.json;
           VALIDATE_ROOT was not supplied, so the state root defaulted to this script's own tree…
```

**Why invisible.** R4-3's fix removed "a verdict over an unstated scope" by printing the scope. The stream split restores it for every ordinary consumer that captures stdout — `> report.txt`, `$(...)`, a CI step that archives stdout. **No test can see it:** every case in `validate.test.ts` reads through `out(r) = stdout + stderr`, so the R4-3, R6-1 and R6-2 assertions all pass on a concatenation the operator never receives.

**Suggested structural fix.** Emit the verdict and its scope through **one** writer, on one stream, in one call — the disclosure is part of the verdict, not diagnostics beside it — and assert in the test harness on `r.stdout` alone for the passing case. **New freedom:** moving the SCOPE line to stdout changes what any downstream parser of this gate's stdout sees; bound it by asserting the verdict literal is still the *last* stdout line.

---

#### R8-5 — the residual witness's `> HISTORICAL_RESIDUAL_ROWS` gate is a blind window it shares with the parse

**Severity:** low. **Predicate:** `generate-guarantees.ts` `declaredResidualRows` (`if (Number.parseInt(first,10) <= HISTORICAL_RESIDUAL_ROWS) continue;`) against `readResidualAdditions`'s first-exact-heading location.

**What it is.** R4-1's independence argument is that the witness is fence-blind and heading-blind *where the parse is not*. It is also **number-blind**, and on that axis the two passes agree by being equally blind: a row numbered ≤ 8 written under a repeated/near-miss additions heading is seen by neither, so `unpublished` and `unbacked` are both empty and the page publishes short.

**Exact repro (committed `.js`, HEAD 7dc9018):**
```
printf '\n## Phase 30 additions to this register (AUTO-05)\n\n| # | item | disposition | target phase | reason / owner |\n|---|---|---|---|---|\n| 8 | LOWNUM-SHADOW | `deferred` | — | planted under a repeated heading |\n' >> docs/audit/28-residual-sizing.md
node scripts/generate-guarantees.js ; echo "exit=$?"
grep -c LOWNUM-SHADOW docs/GUARANTEES.md
node scripts/guarantees-freshness.js ; echo "fresh exit=$?"
```
**Observed on HEAD:**
```
Wrote docs/GUARANTEES.md — 6 safety row(s).   exit=0
0                                              ← unpublished
Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration.   fresh exit=0
```

**Controls, both decisive.** Same plant numbered `12` under the same repeated heading → **exit 1**, `declared but NOT PUBLISHED [12]`. Same row numbered `8` inserted into the **real** additions table → **exit 1**, `published but NOT DECLARED [8]` (noisy, correct). So the hole is exactly the intersection: low number *and* out-of-section.

**Why permissive.** The page whose subject is what the project does not close publishes short, with the generator at exit 0 and the freshness gate reporting fresh — R4-1's finding verbatim, reached through the witness's numeric gate instead of through its heading grammar.

**Suggested structural fix.** Delete the number window from the witness and give the *parse* the historical-vs-additions distinction it actually owns (the parse is already section-scoped, so every row it returns is by construction an additions row); the witness then declares every bare-integer first cell in the file and the two disagree wherever the parse is short. **New freedom:** the witness now over-counts the eight historical rows — bound it by making the comparison a set difference against the parse's rows *plus* an explicitly declared historical set, asserted equal to eight on the live register.

---

#### R8-6 — the collapsed-bases caveat is keyed on "was a state root supplied", not on the condition it describes

**Severity:** low. **Predicate:** `stateRootSupplied ? "" : basesCollapsed ? <caveat> : ""`.

**Exact repro (committed `.js`, HEAD 7dc9018):**
```
# A — the documented single-root form (kit is the script's tree)
env -u VALIDATE_ROOT VALIDATE_KIT_ROOT=$KIT node scripts/validate-agent-factory.js
# B — the same tree named explicitly, the two-root form the header documents and every fixture uses
VALIDATE_KIT_ROOT=$KIT VALIDATE_ROOT=$KIT node scripts/validate-agent-factory.js
```
**Observed on HEAD:** A prints the full caveat; **B prints `SCOPE governance configurations examined: agent-factory/config/factory.config.json` and nothing else** — `basesCollapsed` is true in both, and the disclosure is suppressed in B purely because the variable was set. Same for `VALIDATE_ROOT=$KIT/.`.

**Why invisible.** R6-1 closed "two tests over one variable" for the *branch*; the *disclosure* is still gated on a different question than the one it reports. A shared-install operator who names the kit twice — the shape `runFixture` uses thirty times — gets a verdict with no statement that a repository-level config outside the kit was not examined.

**Suggested structural fix.** Gate the disclosure on `basesCollapsed` alone and let `stateRootSupplied` choose only the *remedy wording* ("pass `VALIDATE_ROOT=<repo>`" vs "the state root you supplied is the kit"). **New freedom:** a line printed on more runs; bound it by asserting the caveat's presence tracks `basesCollapsed` across all four input shapes (unset, `""`, `=kit`, `=distinct`).

---

### Gate sweep — every `package.json` script run (except `test:e2e`, `count:lines`)

Run individually from the worktree, exit code captured directly (not through a pipe):

| script | exit |
|---|---|
| `build` | 0 |
| `typecheck` (**both** projects: `tsc --noEmit` and `tsc -p tsconfig.tests.json`) | 0 |
| `check:build-parity` | 0 |
| `check:public-docs` | 0 |
| `check:audit-register` | 0 |
| `check:claim-anchors` | 0 |
| `check:banned-claims` | 0 |
| `check:imperative-lexicon` | 0 |
| `check:diff-disposition` | 0 |
| `check:nul-bytes` | 0 |
| `audit:prepass` | 0 |
| `generate:safety-surface` | 0 |
| `generate:catalog` | 0 |
| `generate:adapters` | 0 |
| `generate:skill-twins` | 0 |
| `generate:guarantees` | 0 |
| `freshness` | 0 |
| `freshness:catalog` | 0 |
| `freshness:adapters` | 0 |
| `freshness:skill-twins` | 0 |
| `freshness:guarantees` | 0 |
| `freshness:context` | 0 |
| `freshness:queue` | 0 |
| `freshness:traceability` | 0 |
| `test` / `test:e2e` | not run (live lane, excluded by instruction) |
| `count:lines` | not run (`tokei` not required) |

**No red gate the executor missed** — round 4's `V-30-10-10` class does not recur. One side effect worth naming: `audit:prepass` **mutates a tracked file** (`docs/audit/28-prepass-evidence.md`) as a byproduct of running, so a clean sweep leaves the tree dirty. Not a finding (it is a generator), but a sweep script that runs every gate should be prepared for it.

---

### Fence audit — V-30-10-01 .. 10

| id | direction/bound as stated — measurably correct? |
|---|---|
| `V-30-10-01` | **Correct.** `git grep checkpointRefusals -- '*.ts' \| grep -v .test.ts` returns only `scripts/context-io.ts` — the declaration and the seven returns. Zero non-test consumers; permissive-invisible is the right direction. |
| `V-30-10-02` | **Correct, and understated.** `matrixDepartures`' totality assertion is a further instance: its three arms are `if / else if / else`, so `placed !== entries.length` is unreachable by construction and can never fire. It is a tripwire, exactly as the entry says. |
| `V-30-10-03` | **Not verifiable here** — `hooks/guard.ts` is surface A and out of scope. No contradiction observed from surface B. |
| `V-30-10-04` | **Correct as amended.** Item 1's inversion by R6-2 is recorded accurately; item 3 (`sectionsFound === filesWalked`) still stands — the counter is incremented once per located section inside the per-file loop (`checkpoints.ts:752` / `:1038`), so the equality remains structurally near-vacuous. |
| `V-30-10-05` | **Correct, and the bound can now be stated precisely.** `COVERED_ELSEWHERE` covers 12 of 14 roster ids by citation. The resolver case (`autonomy-zero-config.test.ts:324`) checks only that the cited file exists and **contains the test's name as a substring** — not that the cited test asserts that id's zero-config disposition. Measured: 11 ids cite `checkpoints.test.ts` "no config file at all → exactly `CHECKPOINT_DEFAULTS`, compared key by key", which walks `cp.CHECKPOINTS` and does cover each of them. `test_integrity` cites `context-io.test.ts` "CONTROL — the clean sentinel writes exactly one valid green verdict", which asserts `emitVerdict`'s note-writing behaviour, reads no config and reads no matrix — **the citation resolves and does not vouch for the claim**. No substantive gap (the `checkpoints.test.ts` key-by-key case covers `test_integrity` too), so this is an observation, not a finding — but the escape hatch's verification is name-existence, not reach. |
| `V-30-10-06` | **Correct.** Item 7's narrowing direction confirmed: the consumer pin's module set is `git ls-files --cached --others --exclude-standard '*.ts'`, so a `.gitignore` rule silently removes modules from it. |
| `V-30-10-07` | **Direction correct (permissive); bound understated** — see **R8-3**. The entry frames the residual as undecidable because the corpus is an open set; the measured gap is that the alias list does not match its own declared external authority, which is decidable. |
| `V-30-10-08` | **Correct.** `blockContextFlags` (`frontmatter.ts:568`) models exactly two states, `"comment"` and `"tag"`; the other five §4.6 types are unmodelled, as stated. |
| `V-30-10-09` | **Correct.** `renderedText` decodes numeric references only; the module's own comment at `frontmatter.ts:971` declines to import a named-reference table, exactly as the entry says. |
| `V-30-10-10` | **Correct, and the remedy holds** — the full `package.json` sweep above is green, including both `typecheck` projects. |

---

### Probes that found nothing (every probe)

1. **`canonicalBase` fallback, symlinked spelling** — live tree via a `/tmp` symlink kit root: caveat present, in-kit config listed **once**. R6-2's fix holds.
2. **`VALIDATE_KIT_ROOT` is a file** — 20 named errors, exit 1; SCOPE lists only the state-base config. Fail-closed.
3. **State-base `.grugops` unreadable (`chmod 000`)** — `ERROR .grugops/factory.config.json: exists but could not be read`, exit 1, and the path is still listed as examined. Correct.
4. **State-base `.grugops` is a broken symlink** — validator lists neither; `readGovernanceConfig` reports `source=absent`. Gate and reader agree.
5. **`readGovernanceConfig` — candidate one malformed, candidate two strict** — invalid JSON at `.grugops` returns `source=unreadable` + `STRICTEST_MATRIX` and does **not** fall through to candidate two. Fail-closed, as documented.
6. **Freshness gate vs a `.grugops` lowering** — plant → `STALE` exit 1; regenerate → fresh exit 0; remove the config → `STALE` exit 1. The config genuinely lands in the mirror and genuinely moves the bytes; the gate's sharpest stated claim holds.
7. **Freshness mirror inputs vs real reads** — `GUARANTEES_DATA_SOURCES` (4, pinned) plus the derived `jsImportClosure` regenerate the committed page byte-for-byte from a bare temp tree; no undeclared read.
8. **Residual witness, high-numbered row out of section** — `| 12 |` under a repeated heading → named refusal, exit 1. R4-1's guard fires where it was designed to.
9. **Residual witness over-inclusion on the LIVE register** — `declaredResidualRows()` = `['9','10']`, `readResidualAdditions()` = `['9','10']`. R6-5's wider witness produces **no false red** on the real register.
10. **Consumer pin, `.ts` plant** — `scripts/r8probe-consumer2.ts` importing the authority: caught by name, `[scripts/r8probe-consumer2.ts::publicDocsScan]`, 1 failed / 27 passed. Removing it restores 28/28. Pin discriminates.
11. **Consumer pin, `.mts` hiding place** — `git ls-files '*.ts'` does **not** see `scripts/r8probe-consumer.mts` (pin blind), but `tsc --listFiles` does not compile it either (0 occurrences) and `npm run typecheck` stays 0. A `.mts` can never become a shipped `.js`, so the hole is unreachable through the build. Not a finding.
12. **Hand-written `.js` consumer (no `.ts` source)** — `scripts/r8rogue.js` → `npm run freshness` exits **1** with `UNCOMMITTED BUILD OUTPUT: scripts/r8rogue.js`. Orphan/untracked `.js` is closed; the `orphaned` arm covers the committed case.
13. **Required-key scoping asymmetry** — the only per-position difference in `checkConfigForm` is `requireBaseKeys`; every other arm fires identically at both positions. `mode`/`cadence` have **zero code consumers** anywhere in `scripts/`, `hooks/`, `install/`, so the scoping has no permissive consequence.
14. **`readCheckpointMatrix` degenerate shapes** — all four branches reach `STRICTEST_MATRIX` or the roster defaults correctly; the `actual !== expected` floor is structurally unreachable but fails closed if reached.
15. **SCOPE line completeness** — it cannot list a position it did not examine (`governanceExamined.push` follows `existsSync` and precedes the read) nor omit one it did.

---

### Observations

1. **`renderGuarantees` performs two independent `readGovernanceConfig(root)` calls** — `guaranteesJoin` (`:522`) and `matrixDepartures` (`:608`) — each with its own `isLowered` walk. The "ONE read and ONE walk" claim at `:589` is scoped to `matrixDepartures` and is locally true, so this is not a false sentence; but the file-level shape is the one `evaluateMatrix`'s comment says it exists to remove. They also disagree about an `undefined` matrix entry: `guaranteesJoin` reads it as `block`, `matrixDepartures` counts it as at-default. Unreachable today.
2. **`resolveCheckpoint` accepts a whitespace-only grant** — `env[envVarName]` with value `" "` has `length > 0`, so `authorizedBy = " "` and a floor lowering takes effect authorized by a blank name. The per-floor env read is surface A, so this is logged, not filed.
3. **`VALIDATE_KIT_ROOT` is not trimmed while `VALIDATE_ROOT` is** — R6-1 introduced `?.trim() || null` for the state root only; `VALIDATE_KIT_ROOT="   "` is truthy and resolves to `<cwd>/   `. Fails loudly (many errors), so noisy, not permissive — but it is now two rules over two variables that were previously one.
4. **`audit:prepass` mutates a tracked file when run.** A gate sweep that treats a dirty tree as a failure will misreport.
5. **`declaredResidualRows`' over-inclusion bound is real and currently harmless**, but its noisy-only argument rests on the live-equality case; that case would start failing on the day the register acquires any pipe-bearing line whose first cell is a bare integer above 8 for an unrelated reason.

---

### Premise assertions performed

1. **Artifact identity on entry** — sha256 of the working-tree `.js` compared against `git show HEAD:<path>` for `validate-agent-factory.js`, `context-io.js`, `checkpoints.js`, `generate-guarantees.js`, `guarantees-freshness.js`, `check-public-docs-vocabulary.js` — 6/6 `premise OK`. Repeated on exit for those plus `audit-model.js` — 5/5 OK, `git status --short` clean apart from `node_modules`.
2. **R8-1's premise** — that the second-listed file is the governing one: driven through the committed `context-io.js`, printing `governanceConfigCandidates(<state>)` and `readGovernanceConfig(<state>).config.checkpoints.open_pr = off` against the kit base's `block`.
3. **R8-2's premise** — that the tightening is real and visible elsewhere: `renderCheckpointBanner` over the same matrix names `commit_to_branch=block`; the roster and defaults were printed from `checkpoints.js` rather than read from prose (14 members, `commit_to_branch` the only non-`block` default, 4 floors).
4. **R8-2's pin bound** — `plan_approval` verified absent from the live roster, making the fourth "matrix" identical to the first.
5. **R8-3's premise** — the planted payload genuinely trips both gates: identical bytes at `PUBLIC.md` and `PUBLIC.markdown` exit 1 with the file named in both gates' output. Without that control the `.scd` exit 0 would have measured nothing.
6. **R8-5's premise, and two controls** — the high-number plant (refused) and the in-table low-number plant (refused for the opposite reason) bracket the blind window; without them the exit-0 result would be indistinguishable from a plant the parser never reached.
7. **Harness self-check, twice caught.** (a) An early run captured `$?` after a pipe into `head`, reporting `EXIT=0` for a generator that had exited 1 — every subsequent exit status was taken from an unpiped invocation or `PIPESTATUS`. (b) An early R8-5 control inserted its row after a `| 11 ` line that does not exist in the register, so the plant landed nowhere and produced a plausible clean result; the row's landing position was thereafter verified with `sed -n` before the run was believed. Both are this log's recurring false-control class.
8. **Fence audit premises** — `V-30-10-01` measured by `git grep`, not by memory; `V-30-10-05`'s citation checked by reading both cited tests; `V-30-10-08` by counting the modelled states in `blockContextFlags`.
`````

# THE FENCE — FINAL

**Surface B is FENCED, not closed.** This section replaces the draft fence written before the round-4
reviews; those reviews returned ten findings, so the draft's own condition for deletion was not met.

## The fence text

> **Surface B is fenced, not closed.** Four adversarial gap-closure rounds ran against the derived
> checkpoint set, the collapsed governance reader, the structure validator, the guarantees render, the
> freshness gate and the run banner. They closed **8 + 6 + 7 + 9 = 30 findings**, each with a failing
> test written before the fix existed, a mirror reproduction against the committed `.js`, a structural
> fix, and a mutation proof read out of the emitted artifact.
>
> **No round returned "nothing new."** Eight independent reviews at the strongest available model ran
> across the four rounds and every one of them found something. Each round's own fixes created most of
> the next round's findings — **3 of 6** in round 2, **4 of 7** in round 3, **7 of 9** in round 4, and
> now **2 of the 10 post-cap findings** name a round-4 fix as their cause (R7-2 from R5-2's HTML arm,
> R8-2 from R6-3's three-arm render), with a third (R7-3) reaching the harm through the inversion
> written to close it.
>
> **The defect rate per round did not fall. The review budget ran out first.** That is the honest
> reading of this surface, and it is why the word here is "fenced" rather than "closed": closing would
> assert a proposition that eight consecutive reviews contradicted. D-22 caps the surface at four
> rounds precisely so that this judgement is made by a written rule rather than by whoever is tired.
>
> What this means for a reader. The gates named in this log are **evidence, not proof**. Each refuses
> a specific, named, reproduced bypass. None establishes that no further bypass exists, and the
> measured trend says another round would find more. Twenty residuals are recorded below and in
> `.planning/phases/30-per-checkpoint-autonomy-matrix/deferred-items.md`, each with the direction it
> fails in — `permissive` (it can let something through), `noisy` (it can only over-refuse), or
> `process`. Ten of them (`V-30-10-11` … `V-30-10-20`) are open bypasses with working reproductions.
>
> **A green test suite is not offered as a closure argument anywhere in this record**, and the
> post-cap findings are the reason the rule exists: R7-1, R7-4 and R7-3 each leave every cardinality,
> every count and every gate green while a governed document goes ungoverned.

## Backlog — the ten post-cap findings

Each is a recorded backlog item under D-22, **not a fix**. Severity, reproduction, direction,
suggested structural fix and that fix's own new freedom are carried so a later phase can act without
re-deriving any of it.

### `V-30-10-11` (HIGH, permissive+invisible) — R7-1: the section extent is the strict view, both collecting passes are the lax view

`deriveCheckpoints` takes its range from `sectionEndIndex`/`unfencedHeadingIndices` (strict, moved
there by R5-2) while pass A filters on `fencedLineFlags` and pass B on `unfencedMatchIndices` (both
lax). CommonMark §4.5 lets a **closing** fence be indented ≤3 spaces; round 3 declined that rule for
the lax view calling its residual "over-scanning, which is fail-closed". For a *closing* delimiter the
same omission runs the parity the other way — the fence stays open to EOF in the lax view while the
renderer and the strict view close it.

**Reproduce:** append inside `09-daily-sweep.md`'s `## Stop conditions`, after the last bullet, a
column-zero fence line, then a three-space-indented fence line, then
`- Never deploy without a second human. \`checkpoint: planted_ghost_stop\``. Result: derivation
`ACCEPTED — ids=10 sites=16 examined=38 counted=38`, planted stop absent, validator exit 0,
`checkpoints.test.ts` 133/133, `check-diff-disposition` `19/19` refusals=0. **Control:** the same
bullet without the two fence lines is collected (`ids 10→11`) and reds 5 tests.

**Direction:** permissive and invisible — `examined === counted` agrees at 38/38 because *both passes
take the same wrong flags*, so the two-pass shear detector cannot see it.
**Suggested fix:** move pass A and pass B onto `blockContextFlags` (one walk feeding the whole
derivation), or the narrower repair — adopt §4.5's ≤3-space rule for the **closing** delimiter only in
the lax machine, which cannot narrow any scan set.
**Its new freedom:** moving the collectors to strict changes what the checkpoint corpus scans across
the 460-file divergent set; bound by re-measuring the roles-and-workflows delta (today: one line) and
asserting `examined`/`counted` unchanged on the live corpus.

### `V-30-10-12` (HIGH, permissive+invisible, CREATED BY R5-2's FIX) — R7-2: the HTML arm opens a phantom block on any line starting with `<`

`HTML_BLOCK_OPEN = /^ {0,3}<[!\/a-zA-Z]/` matches neither CommonMark §4.6 type 6 (fixed tag-name list)
nor type 7 (a complete tag alone on a line that cannot interrupt a paragraph). An **autolink**
(`<https://…>`), an inline `<span>`, `<foo@bar>` — ordinary paragraph content to a renderer — all open
a block, which then hides a **byte-exact** anchor heading.

**Reproduce:** insert `<https://example.com/orchestrator-spec>` immediately above the real
`## Hard limits` in `orchestrator.md` and append a decoy `## Hard limits` section at EOF. Frozen
clause count **446 → 429**, region moves `{74,82}` → `{85,87}`, cardinality still `17/17`, refusals 0
— **17 clauses left the freeze silently**, including the coordinator hard-limit paragraph carrying the
WIP/spawn/merge/deploy limits. The decoy is load-bearing: the autolink alone reds at `16/17`.

**The code comment "the direction of that gap is UNCHANGED behaviour rather than a new hole" is
falsified** by direct comparison: on `<https://…>\n## Hard limits\n…`, `392f3ab` returns `[1]` and
`7dc9018` returns `[]`, while `commonmark` renders the `<h2>`.
**Suggested fix:** make the HTML arm ask §4.6's actual start conditions (types 1–7 with their real
openers and end conditions); anything else is not a block. Refusing such a line is the wrong repair —
it would red legitimate documents.
**Its new freedom:** a hand-written tag-name list, this repository's named second failure class — pin
two-sided against the §4.6 list, assert the governed-corpus delta stays at its measured value, and add
permanent cases that `<https://…>` and `<span>x</span>` are **not** block openers.

### `V-30-10-13` (MEDIUM, permissive+invisible, ships to hosts) — R7-3: the membership exemptions are NAME tests, not FILE tests

`listRoleDirEntries`/`listWorkflowDirEntries` filter `!EXEMPT_NAMES.includes(f)` over `readdirSync`,
which returns directories too, and nothing asserts an exempt entry is a regular file. The round-4
inversion is one level deep, so each exempt **name** is an unbounded container inside the corpus's own
closed directory.

**Reproduce:** `rm agent-factory/roles/.gitkeep && mkdir agent-factory/roles/.gitkeep`, then copy any
role into `agent-factory/roles/.gitkeep/rogue-role.md`. Result: `17/17`, refusals 0, validator exit 0,
derivation unchanged. Same for `workflows/.gitkeep/20-rogue.md` and for
`roles/_role-switch-protocol.md/rogue.md`. **Control:** a non-exempt subdirectory IS refused by name
(`carries 1 entr(ies) the roles corpus does not admit — notes`), so the exemption name is exactly the
hole. `install/install.ts` copies `agent-factory` recursively, so the contents ship into every
installed kit.
**Suggested fix:** assert the entry TYPE — an exempt name must be a regular file (`statSync().isFile()`)
and any directory entry in a closed corpus directory is refused regardless of its name.
**Its new freedom:** a `stat` per entry introduces a third outcome (unreadable/dangling); bound with a
case for a dangling symlink and one for a directory named exactly `.gitkeep`.

### `V-30-10-14` (HIGH, permissive+invisible) — R7-4: inline markup that emits no glyph is not folded

`renderedText` folds numeric references, zero-width code points and whitespace runs. It does not
remove markup that renders to **no visible output**: `## Stop conditions<!-- x -->`,
`## Stop <span></span>conditions`, `## Stop conditions<a name="s"></a>`. All three match `/^#{1,2} /`
so `sectionEndIndex` closes the section on them, while the exact-occurrence arm (byte equality) and
the near-miss arm (rendered-text equality) both say nothing. **This is not D-59's open confusable
set** — these spellings render to literally the same characters, and the grammar is closed and
decidable.

**Reproduce, arm A (truncating):** insert `## Stop conditions<!-- anchor -->` between the two tagged
bullets of `09-daily-sweep.md`. Result: `ACCEPTED — ids=9 sites=15 examined=37 counted=37`,
`exceed_wip_limit` **removed from the live roster** with both independent counts agreeing at 37/37,
frozen clauses 446 → 442 at `19/19` with zero refusals, validator exit 0.
**Arm B (fully invisible):** the same heading after the last real bullet, followed by a new tagged
stop — **every number byte-identical to the clean tree** while a human stop is declared, rendered and
governed by nothing.
**Suggested fix:** strip zero-glyph constructs in `renderedText` before comparing — HTML comments and
empty/void inline elements — reusing the module's existing `VISIBLE_GLYPH` class. All three spellings
then become near-misses and are refused by name; acceptance is unchanged.
**Its new freedom:** an inline-HTML stripper inside the one heading authority could over-fold a
heading that legitimately contains rendered inline markup (`## Use <code>x</code>`); bound by folding
only constructs that emit no glyph, asserting the live corpus still carries zero near-misses across
all 55 regions and all 19 stop sections, and a case that a glyph-bearing element is NOT folded.

### `V-30-10-15` (MEDIUM, publishes a false sentence) — R8-1: "the FIRST is the one that governs" names the wrong file in the two-root shape

`governanceExamined` is filled base-by-base. **Within** one base the order is the reader's precedence;
**across** bases it is not. In the shared-install shape the list is
`[agent-factory/config/factory.config.json, .grugops/factory.config.json]` and the sentence names the
kit config, while `readGovernanceConfig(<repo>)` governs from `.grugops` — the second entry. Separately
`relativeToBase` renders labels base-relative, so two distinct files under two roots print as the same
string, and a run can print one label twice for two different trees.

**Reproduce:** kit fixture at `$W/kit`, state at `$W/state` with
`.grugops/factory.config.json` = `{"checkpoints":{"open_pr":"off"}}`; run with both roots set. SCOPE
names the kit config as governing; the reader on the same trees reports `open_pr=off` from the
second-listed file. **Control:** single tree, both roots one dir — the order is `[.grugops…, kit…]` and
the sentence is correct there, so the falsity is specific to the shape R4-3 and obs-1 were written for.
**Suggested fix:** make the sentence a property of the *reader's answer* — record per base whether
`readGovernanceConfig` would stop at that path, and name the governing path explicitly, per base.
Label by base role, not base-relative path.
**Its new freedom:** naming base-qualified paths leaks the operator's directory layout into a log;
bound by naming the base by its role (`kit:` / `state:`) rather than its full spelling.

### `V-30-10-16` (MEDIUM, permissive+invisible, CREATED BY R6-3's FIX) — R8-2: the tightened bucket is computed, asserted total, and never published

The three arms are `lowered===0 && tightened===0`, `lowered===0`, `else`. The third fires on
`lowered > 0` **regardless of `tightened`** and renders only the LOWERED table. The totality assertion
is over the **partition**, not over the **publication**: every member is classified, the assertion is
satisfied, and a whole bucket is dropped on the floor — R6-3's own named failure ("a member reported
by no sentence") relocated from classification to rendering.

**Reproduce:** `.grugops/factory.config.json` =
`{"checkpoints":{"commit_to_branch":"block","exceed_wip_limit":"off"}}`; `generate-guarantees` exits 0
and `grep -c commit_to_branch docs/GUARANTEES.md` → **0**, while `renderCheckpointBanner` on the same
matrix names **both** departures.
**And the pin that was supposed to hold it is short in two ways:** it asserts only the ONE bit
`page.includes(BANNER_ALL_DEFAULT) === (banner === BANNER_ALL_DEFAULT)` and never compares the
departures the two name; and its fourth matrix uses **`plan_approval`, which is not a roster member**,
so that case is a vacuous duplicate of the first. Three distinct inputs, none combining a lowering
with a tightening.
**Suggested fix:** render from the partition — one departures section iterating `[...lowered,
...tightened]` with each row carrying its direction — and move the assertion from "every member was
classified" to "every member of `lowered ∪ tightened` appears in the rendered output".
**Its new freedom:** a byte-level assertion couples the check to the table's markdown spelling; bound
by asserting on the row-composing function's output rather than the joined page string.

### `V-30-10-17` (MEDIUM, permissive) — R8-3: the alias list does not equal the authority its own comment names

`MARKDOWN_ALIAS_EXTENSIONS`' doc comment states its provenance as GitHub Linguist's Markdown set. It
carries ten; Linguist's entry also carries `.scd`, absent here, and `.mdx`, which Linguist now holds as
a separate language — the two sets differ in **both** directions and the provenance sentence is false.

**Reproduce:** write `This kit uses a handoff packet. It conforms to ASD-STE100.` to `PUBLIC.$ext` for
`ext in scd md markdown qmd`. `.md` and `.markdown` → both gates exit 1 with the file named; `.scd` and
`.qmd` → **both gates exit 0**, neither member, nor imitation, nor derivation refusal, nor counted by
`PUBLIC_DOCS_SCAN_COUNT`. R6-6's exact shape through a name R6-6's own list still does not carry.
**Suggested fix:** vendor the authority rather than transcribing it — commit the extension set as a
data file with its source URL and a checked-in `sha`, and assert the module's list *equals* that file.
**Its new freedom:** a vendored list is still a set literal; bound by making the file the only
declaration, the module's array a derivation from it, and the count asserted at the point it is spent.

### `V-30-10-18` (MEDIUM, invisible to every test) — R8-4: the verdict goes to stdout and the whole scope disclosure to stderr

R4-3's fix removed "a verdict over an unstated scope" by printing the scope — on the other stream. A
stdout-only capture (`> report.txt`, `$(...)`, a CI step archiving stdout) receives an unqualified
`ALL CHECKS PASSED`. **No test can see this:** every case in `validate.test.ts` reads
`out(r) = stdout + stderr`, so the R4-3, R6-1 and R6-2 assertions all pass on a concatenation the
operator never receives.

**Reproduce:** `env -u VALIDATE_ROOT VALIDATE_KIT_ROOT=$(pwd) node scripts/validate-agent-factory.js 2>/dev/null`
→ `ALL CHECKS PASSED`, exit 0, no scope.
**Suggested fix:** emit the verdict and its scope through one writer on one stream in one call — the
disclosure is part of the verdict, not diagnostics beside it — and assert on `r.stdout` alone for the
passing case.
**Its new freedom:** moving SCOPE to stdout changes what a downstream parser of this gate sees; bound
by asserting the verdict literal is still the LAST stdout line.

### `V-30-10-19` (LOW, permissive) — R8-5: the witness's number window is blindness it shares with the parse

R4-1's independence argument is that the witness is fence-blind and heading-blind where the parse is
not. It is also **number-blind** (`<= HISTORICAL_RESIDUAL_ROWS` → `continue`), and on that axis the two
agree by being equally blind: a row numbered ≤ 8 under a repeated additions heading is seen by
neither, so both difference sets are empty and the page publishes short.

**Reproduce:** append a second `## Phase 30 additions to this register (AUTO-05)` heading with a table
row numbered `8`. Generator exit 0, row unpublished, `guarantees-freshness` reports **fresh**.
**Controls, both decisive:** the same plant numbered `12` → exit 1 `declared but NOT PUBLISHED [12]`;
the same row numbered `8` inside the real table → exit 1 `published but NOT DECLARED [8]`. The hole is
exactly the intersection — low number *and* out of section.
**Suggested fix:** delete the number window from the witness and give the *parse* the
historical-vs-additions distinction it already owns by being section-scoped.
**Its new freedom:** the witness then over-counts the eight historical rows; bound by making the
comparison a set difference against the parse's rows plus an explicitly declared historical set,
asserted equal to eight on the live register.

### `V-30-10-20` (LOW, invisible) — R8-6: the collapsed-bases caveat is keyed on the wrong question

The disclosure is gated on `stateRootSupplied`, not on `basesCollapsed` — the condition it describes.
`VALIDATE_ROOT=$KIT`, the two-root form the header documents and every fixture uses, suppresses the
caveat while the bases are collapsed. R6-1 closed "two tests over one variable" for the *branch*; the
*disclosure* still asks a different question than the one it reports.

**Reproduce:** `VALIDATE_KIT_ROOT=$KIT VALIDATE_ROOT=$KIT node scripts/validate-agent-factory.js` →
SCOPE with no caveat, where `env -u VALIDATE_ROOT` on the same tree prints the full caveat.
**Suggested fix:** gate the disclosure on `basesCollapsed` alone and let `stateRootSupplied` choose
only the remedy wording.
**Its new freedom:** the line prints on more runs; bound by asserting its presence tracks
`basesCollapsed` across all four input shapes (unset, `""`, `=kit`, `=distinct`).

## Fence-audit corrections applied to the earlier residuals

Both reviewers audited `V-30-10-01` … `V-30-10-10` against the artifact. Five entries were wrong or
understated and are corrected here rather than left standing:

- **`V-30-10-02` is stronger than it was written.** `deriveCheckpoints`/`checkpointSites` have **no
  non-test consumer at all** — the shipped validator imports only the static `CHECKPOINTS`/
  `DISPOSITIONS`. So the residual is not "the derivation assertions have no shipped consumer" but
  **the derivation and both membership inversions have none**: `validate-agent-factory.js` returns
  `ALL CHECKS PASSED` over a kit containing `roles/rogue.markdown`, `roles/.gitkeep/rogue-role.md`, a
  duplicate stop section or a near-miss heading (R7 obs. 2). Every corpus refusal from rounds 1–4
  lives in `check-diff-disposition` (which needs git) or in vitest. Reviewer 8 adds that
  `matrixDepartures`' totality assertion is itself unreachable by construction — its arms are
  `if/else if/else`, so `placed !== entries.length` can never fire. It is a tripwire, as the entry says.
- **`V-30-10-05`'s bound can now be stated precisely.** `COVERED_ELSEWHERE` covers 12 of 14 roster ids
  by citation, and the resolver checks only that the cited file exists and contains the test's name as
  a **substring** — not that the cited test asserts that id's zero-config disposition. Measured: 11 ids
  cite a case that genuinely walks the roster key by key; `test_integrity` cites a case that asserts
  `emitVerdict`'s note-writing, reads no config and reads no matrix — **the citation resolves and does
  not vouch for the claim**. No substantive gap today, because the key-by-key case covers it anyway;
  the escape hatch's verification is name-existence, not reach.
- **`V-30-10-07`'s bound was understated.** The entry frames the residual as undecidable because the
  public-docs corpus is an open set. The part measured by R8-3 is **decidable and at least one member
  wide**: the list does not equal the external authority its own comment names. See `V-30-10-17`.
- **`V-30-10-08`'s direction was one-sided.** It recorded only UNDER-modelling ("a heading inside one
  of the five unmodelled types can still be classified as a terminator"). The live and larger hole is
  **OVER-modelling** — `HTML_BLOCK_OPEN` opens a phantom block on lines that are not HTML blocks at
  all, hiding a byte-exact heading. See `V-30-10-12`.
- **`V-30-10-09`'s stated direction was wrong.** Measured: `## Stop&nbsp;conditions` and
  `## Stop&Tab;conditions` truncate for **both** the module and the renderer — they are ordinary
  headings to both, so nothing "truncates differently". The real residual is that they render
  *visually identically* and are not refused. The substance stands; the sentence did not.

## Further observations recorded (no fix, no owner required)

- **R7 obs. 1 — R5-1's carriage-return refusal was added at one of two corpus owners.**
  `carriageReturnLines` is asked only in `check-diff-disposition.ts`; `checkpoints.ts`, which owns its
  own corpus refusals, never asks it. A `\r`-bearing plant leaves the derivation `ACCEPTED` at
  `examined=counted=38` and the validator at exit 0. It is caught in *this* repository only because the
  workflow anchors sit in `FROZEN_SECTION_ANCHORS` — R3-3's "a refusal added at one of N consumers"
  shape, and a live hole the moment those anchors change or the kit is validated elsewhere.
- **R8 obs. 1 — `renderGuarantees` performs two independent `readGovernanceConfig` calls**
  (`guaranteesJoin` and `matrixDepartures`), each with its own walk. The "ONE read and ONE walk"
  comment is scoped to `matrixDepartures` and is locally true, but the file-level shape is the one
  `evaluateMatrix`'s comment says it exists to remove. They also **disagree about an `undefined` matrix
  entry**: `guaranteesJoin` reads it as `block`, `matrixDepartures` counts it as at-default.
  Unreachable today.
- **R8 obs. 3 — `VALIDATE_KIT_ROOT` is not trimmed while `VALIDATE_ROOT` is.** R6-1 introduced
  `?.trim() || null` for the state root only, so `VALIDATE_KIT_ROOT="   "` resolves to `<cwd>/   `. It
  fails loudly, so noisy rather than permissive — but it is now two rules over two variables that used
  to be one, which is the shape R6-1 existed to remove.
- **R8 obs. 4 — `audit:prepass` mutates a tracked file when run** (`docs/audit/28-prepass-evidence.md`),
  so a full gate sweep leaves the tree dirty. Not a defect; a property any sweep script must expect.
- **R8 obs. 2 — `resolveCheckpoint` accepts a whitespace-only grant** (`" "` has `length > 0`, so a
  lowering is authorized by a blank name). The per-floor env read is surface A; logged here, owned there.

## CARRIED INTO PLAN 30-11 — the corpus the hook's floor ids come from

Plan 30-11 (red-team surface A, the two-key hook path) derives its floor ids from the same corpus these
four findings leave ungoverned. They are named here because 30-11 reads this log, and because three of
them leave **every count, cardinality and gate green** while a governed document goes ungoverned:

| id | what 30-11 must not assume |
|---|---|
| `V-30-10-11` (R7-1) | A tagged stop can exist in a workflow and be collected by nothing, with `examined === counted` agreeing at 38/38. |
| `V-30-10-12` (R7-2) | An autolink above a frozen heading un-freezes 17 clauses at `17/17` with zero refusals. |
| `V-30-10-13` (R7-3) | A complete role document can ship inside `roles/.gitkeep/` and be governed by nothing. |
| `V-30-10-14` (R7-4) | A live roster member (`exceed_wip_limit`) can be REMOVED from the derived set with both independent counts agreeing at 37/37, and the fully invisible form leaves every number byte-identical to the clean tree. |

**The derived checkpoint set that surface A builds on is fenced, not settled.** Any claim in 30-11
that rests on "the roster is what the corpus declares" must cite this fence.

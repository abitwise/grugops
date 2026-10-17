---
phase: 29-controlled-language-voice-guard-rebuild
plan: 55
subsystem: docs / audit trail + CI description
tags: [gap-closure, round-7, residual-register, reconciliation, no-transcription, honest-close, LANG-04]
status: complete

requirements-completed: []

requires:
  - phase: 29-48
    provides: "the corrected LANG-07 requirement state, and the LANG-04 surfaces left byte-unchanged for the verifier"
  - phase: 29-49
    provides: "the deleted false residual block (IN-04, V-29-47-01), the one-read invariant, the imported refusal channel"
  - phase: 29-50
    provides: "one control-byte predicate (WR-04), the corrected field declaration (WR-03), one read per path + the gitlink arm (WR-06)"
  - phase: 29-51
    provides: "the anchored-block authority D-54's content bound is built on"
  - phase: 29-52
    provides: "CR-01's closure — the sole carve-out bound in content as well as position (D-54)"
  - phase: 29-53
    provides: "CR-02's closure — the shipped manifests admitted, the class boundary declared, the walk-anchored exclusion (WR-01), IN-03"
  - phase: 29-54
    provides: "IN-01 and IN-02, and the LANG-07 flagged assumption answered from the tree"
  - phase: 29-REVIEW-round6
    provides: "the twelve findings this register disposes — the only authority for their ids and statements"
  - phase: 29-VERIFICATION-round6
    provides: "the two failed truths and their five `missing:` bullets, and the two bypass reproductions this plan re-runs"
provides:
  - "`docs/audit/29-round7-residuals.md` — the round's disposition record, 1127 lines, every count re-measured on the final tree"
  - "the twelve-finding table built from the REVIEW rather than from the plans: 10 closed by mechanism, 2 closed by deletion, 0 partials"
  - "a roll-up DERIVED by grep over the tree — 35 markers against round 6's 18, and 9 that no residual register has ever rolled up"
  - "both CR bypasses re-run in BOTH directions on sha256-verified premise-asserting mirrors, green at base and red BY NAME at HEAD"
  - "`V-29-47-04` re-demonstrated in two positions including inside the region on an un-frozen line — the surviving fail-open, carried"
  - "a CI workflow that describes the gates it runs, with the constant named where a count had rotted twice"
  - "a reconciliation of 23 published numbers against fresh measurements, publishing 6 disagreeing rows rather than reconciling them"
affects: [round-7 verification, any ship step reading the audit trail, the next round's starting position]

actuals:
  tokens: 23994
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A roll-up DERIVED from the tree rather than from the predecessor's table. The grep found 35 `V-` markers where round 6's roll-up listed 18, and nine of the seventeen extras had never been rolled up by ANY of three residual registers — invisible to every round that built its list from its predecessor's."
    - "A `before` column taken on the SAME BINARY the original reproductions used. The base mirror's gate hashes to `6f0722fa…b385ba`, the sha256 both `29-REVIEW-round6.md` and `29-VERIFICATION-round6.md` record — which is what makes the before/after pair one measurement instead of two unrelated runs."
    - "Assert the premise on a `git archive` mirror through EVERY gate, not just the one under test. `check-nul-bytes` red on a tampered mirror and reads as a second gate noticing the plant; it reds identically on the CLEAN control, because `git ls-files` fails on a non-repository. It is INDETERMINATE on that harness and must not be counted in a sibling tally."
    - "A stale number is deleted or replaced by the NAME of the thing that holds it — and a HISTORICAL enumeration of the stale values is the same construct wearing a past tense. The first draft of the corrected CI comment listed `82, then 115, then 117`; that is three hand-written cardinalities at the exact address that rotted twice, and the next widening makes the last one stale."
    - "A count of commits carried BY a commit can never include the commits that carry it. Five of eight plans' `actuals.commits` are short, every one in the same direction, and the cause is a self-reference rather than carelessness."
    - "A mechanically derived equality can be green while the hand-written narrative that explains it is short. 29-53's class partition is asserted in code with both sides floored and cannot be short; its SUMMARY's explanatory enumeration is off by one in two cells."

key-files:
  created:
    - docs/audit/29-round7-residuals.md
  modified:
    - .github/workflows/ci.yml

decisions:
  - "NO number in the register was transcribed. Every live count was re-taken on the final tree with its producing command recorded; the count carried from a SUMMARY without re-measurement is 0. Where a re-measurement disagreed with a published value, the disagreement is what the register publishes."
  - "The roll-up's marker set was DERIVED by grep over the tree rather than taken from round 6's table, on the standing rule that a hand-maintained set literal rots while green. That decision is what surfaced the nine never-rolled-up markers."
  - "The nine never-rolled-up markers are NAMED and NOT adopted. Adopting, closing or re-measuring them would be this plan widening its own scope on the strength of its own finding — the shape this phase escalates rather than acts on."
  - "The five `actuals.commits` disagreements are recorded and NOT corrected. Rewriting eight committed SUMMARYs is a rewrite of the trail, and a trail is not a tidy state."
  - "The CI comment names `BANNED_CLAIM_SCAN_COUNT` and types no cardinality at all — including no historical enumeration of the values that rotted. The dated, commit-attributed record four lines below is a different construct and is preserved byte-unchanged."
  - "This plan marks NO requirement. LANG-04's verdict belongs to round 7's verifier; the register records evidence, including the surviving fail-open, and makes no determination."

metrics:
  duration: ~95 minutes
  completed: 2026-08-18
---

# Phase 29 Plan 55: The Round-7 Disposition Record, the Workflow's Own Description, and the Sweep Summary

Closed round 7 by reconciling it against round 6 in both directions — twelve findings disposed from the
review rather than from the plans, a roll-up derived by grep that found 35 markers where the predecessor
listed 18, both bypasses re-run green-at-base and red-by-name-at-HEAD on sha256-verified mirrors, and
23 published numbers re-taken with the six disagreeing rows published rather than smoothed.

## What Was Built

| artifact | what it is |
|---|---|
| `docs/audit/29-round7-residuals.md` | 1127 lines. §1 the twelve-finding table · §2 the adversarial log · §3 `V-29-47-06` · §4 the round's residuals **and §4.7 the roll-up in both directions** · §5 the D-48/D-53 mechanism change · §6 three equalities · §7 the honest close · §8 the sweep and reconciliation |
| `.github/workflows/ci.yml` | both stale gate-scope comments corrected. Comment-only: the operative-line fingerprint is byte-identical before and after |

## The prohibition that governed this plan, and how it was discharged

**No closure is transcribed.** Discharged by construction, not by assertion: §8.3 compares **every**
number this round published against a measurement taken here.

```
rows compared                                      : 23
rows AGREEING                                      : 17
rows DISAGREEING                                   :  6
individual number disagreements inside those rows  : 10
disagreements reconciled away                      :  0
numbers CARRIED from a SUMMARY without re-measuring :  0     <-- the prohibition's own metric
```

The two rows whose subject is a historical commit were re-measured **at that commit** with `git ls-tree`
rather than accepted from the SUMMARY that wrote them.

## Task 1 — the disposition record

**Twelve findings, twelve dispositions, built from `29-REVIEW-round6.md`.**

```
12 surfaced == 10 closed by mechanism + 2 closed by deletion + 0 subsumed + 0 narrowed + 0 deferred + 0 rejected
```

`WR-04` and `IN-04` closed by deletion. **`IN-04`'s sequencing instruction was obeyed**, which is worth
naming: it asked that the false block be deleted *ahead of any further exemption work*, and plan 29-49 —
the round's first code plan — deleted it before 29-52 touched the carve-out.

**Four rows record work beyond the finding**, and one of them went the opposite way from usual: **CR-02's
own suggested fix was REFUSED with a measurement.** Applied as the review wrote it, its segment
projection removes **13 shipped kit documents** from a safety scan (`derived 104 document(s) … kit 60`).
A fix cleared against a reviewer's enumeration rather than against the tree is the defect this phase
names; here the reviewer's enumeration was the thing that would have caused it.

### The verification report's `missing:` bullets — all five matched, and one satisfied DIFFERENTLY

| # | bullet | artifact | verdict |
|---|---|---|---|
| 1 | Close CR-01 structurally — the reviewer's stronger fix (registry-anchored byte-freeze over the region) or the weaker per-group pin | D-54; plan 29-52 | **DONE, stronger option taken.** The per-group pin ships as a **secondary** measure with its non-closure stated in the gate's own refusal text. |
| 2 | Close CR-02 — the manifests as a sixth part, the count moved with entrants named, the denominator widened beyond `*.md` | plan 29-53 | **DONE, and EXCEEDED** — the `scan ⊆ tracked` direction was added too, and the review's own projection refused with a measurement. |
| 3 | Re-run this verification's two mirror reproductions against the fix and confirm both red by name | **this plan**, task 3 | **DONE.** §2.3, §2.5, re-taken at §8.0. |
| 4 | Flip both rows: LANG-04 → `Gaps Found`, LANG-07 → `Complete` | `79c3457` (LANG-04 half) + plan 29-48 (LANG-07 half) | **DONE.** Re-measured at HEAD. |
| 5 | "This correction belongs to the **verifier/orchestrator** applying this report, **not to a phase plan**" | plan 29-48 | **SATISFIED DIFFERENTLY, and said so plainly.** 29-48 *is* a phase plan. It applied the correction as a **transcriber** of a published determination — every edit quotes the authorising disposition row with its line reference, and its frontmatter declares `requirements-completed: []` so the automated marker (the mechanism that caused the inversion) was given nothing to act on. The bullet's *intent* — that no plan assert a requirement state of its own — held; its *letter* did not. |

**5 bullets, 5 matches.** A bullet quietly not done is the failure mode this document exists to prevent,
so the one that was answered differently is labelled as such rather than ticked.

### The roll-up — and the finding that came out of deriving it

```
$ grep -rhoaE 'V-29-[0-9]{2}-[0-9]{2}' --include='*.md' --include='*.ts' --include='*.js' \
       --include='*.json' --include='*.yml' . | sort -u | wc -l
35

35 in the tree == 18 listed by round 6 + 9 never rolled up by ANY round + 8 opened by round 7
```

**Nine measured findings carried `V-` ids into a SUMMARY and were then never rolled up by any of three
residual registers** — `V-29-29-02`..`-05` and `V-29-30-01`..`-04`, plus `V-29-42-05`, an id proposed and
deliberately never opened. They are **named and not adopted**: closing or re-measuring them would be this
plan widening its own scope on the strength of its own finding.

This was invisible to every round that built its roll-up from its predecessor's table, and it is the
direct product of deriving the set instead.

### Net movement, stated plainly

**Moved: six** (`V-29-47-01` deleted, `-05` corrected, `-06` closed here; `V-29-47-02`, `-03` and
`V-29-32-01` **subsumed** by one change). **Opened: eight.** **Net `+2`.**

Three honest qualifications, all in the register:

1. **Three of the six movements are ONE change wearing three ids**, and all three are **subsumed rather
   than pinned** — each keeps a stated remainder (an append, a translation or a swallow carrying **no**
   banned claim is still invisible; the region's **start index is still pinned by nothing**).
2. **What genuinely closed is the FAIL-OPEN half**, and **none of the eight items opened is fail-open**.
3. **The one fail-open that matters was neither opened nor closed.** `V-29-47-04` is carried unchanged and
   was re-demonstrated in a **new** position — inside the region, on an un-frozen line, a position that
   did not exist before D-54 created the frozen/un-frozen split. The residual did not grow; the map did.

## Task 2 — the CI workflow

**Before (banned-claim step), verbatim:**

> `It asserts that the 82 scanned documents — every markdown file under agent-factory/ plus the ten
> public documents, deduped — carry ZERO controlled-language conformance claim …`

**After**, naming the constant instead of typing a value:

> `It asserts that the kit's scanned text surface — the kit's markdown documents PLUS the kit's shipped
> plugin manifests, derived in six named parts, deduped, and pinned two-sided — carries ZERO … That
> region is bounded in POSITION and in CONTENT (round 7, D-54) …`
>
> `NO DOCUMENT COUNT IS STATED HERE, DELIBERATELY. This comment carried a corpus size, and it was stale
> on BOTH of the two occasions a plan widened the scan — so a third value typed at this address would be
> the construct being wrong rather than the value, and it would be stale again on the next widening. The
> count lives in BANNED_CLAIM_SCAN_COUNT in scripts/check-banned-claims.ts, where it is pinned two-sided
> and reds the moment the derivation disagrees with it. A name does not rot; it points at a value
> something else already asserts in both directions.`

**A deviation inside this task, recorded because it is the plan's own subject.** The **first draft** of
that paragraph read *"stale both times a plan widened the scan — 82, then 115, then 117"*. That is
**three hand-written corpus cardinalities at the exact address that rotted twice**, framed as history —
and `117` would be stale on the next widening. The numbers were removed and the rot described without
enumerating its values. Caught by running the prohibition's own acceptance grep against the draft rather
than against the before-form.

**Before (control-byte step):** `It asserts that ZERO tracked files carry a NUL (0x00) byte.`
**After:** `It asserts that NO tracked file contains a control byte other than TAB (0x09) or LINE FEED
(0x0a) — that is, none of C0 (0x00-0x1f) outside those two, and not DELETE (0x7f).`

**Proven byte-equal to the module's own header, mechanically rather than by eye** — the shared predicate
clause was normalised (comment markers stripped, whitespace collapsed, lower-cased) and tested for
presence in both `scripts/check-nul-bytes.ts:4-6` and the workflow: `AGREE: True`.

**Comment-only, proven rather than argued:**

```
diff of ALL non-comment non-blank lines, before vs after : EMPTY
operative-line md5 before / after                        : 45c794d8… / 45c794d8…   (equal)
NON_COMMENT_CHANGED_LINES (from git diff -U0, filtered)  : 0
git diff --numstat                                       : 31  10  .github/workflows/ci.yml
gate invocations still present                           : 2
deleted lines mentioning the dated record 20982a0        : 0    (preserved byte-unchanged)
```

**Workflow validator: `UNKNOWN - verify`.** No `actionlint` or `yamllint` is on `PATH` or in
`package.json`, and no repository script reads `.github/workflows/ci.yml` programmatically — the three
scripts that mention the path do so only in comments. No validator was invented; the comment-only proof
above stands in its place, and the one gate that *does* read the file (`check-nul-bytes`, which scans
every tracked path) exits 0 with its denominator unmoved by this edit.

## Task 3 — the sweep

**The tree moved twice mid-plan, so the sweep was re-taken on the true final tree** (`d460a87`) rather
than assumed unaffected. Gate sha256 shown equal across the move (`f5f4469c…05a7`), 0 committed `.js`
changed.

### Both bypasses, in both directions

The base mirror's gate hashes to **`6f0722fa6fb8f82d3875c1df3f239ff4db193e6fb9fb40e70da8224c19b385ba`** —
**the sha256 both `29-REVIEW-round6.md` and `29-VERIFICATION-round6.md` record.** The "before" column is
therefore taken on the same binary both independent reproductions used.

| plant | BASE `29f61e0` (gate `6f0722fa…`) | FINAL TREE (gate `f5f4469c…`) |
|---|---|---|
| **CR-01 form A** — one line replaced inside the region, count preserved | **exit 0, `ALL CHECKS PASSED`, planted file NEVER NAMED.** `suppressed` 14 and `extent` 62 both unmoved; only the unpinned breakdown moved (`token-economy 2, comprehension 4` → `4, 2`) | **exit 1, `4 CHECK(S) FAILED`.** Named at `writing-profile.md:292:14` and `:292:33`, each quoting the planted sentence, with the **cause named in the same output**: `C-28-046's anchored block … no longer matches its registry row` |
| **CR-01 form B** — the whole region body replaced, count preserved | (the reviewer's measurement: both pins held; only a sibling gate red) | **exit 1, 28 findings over 117 elements, all named at `file:line:column`**, plus the `ZERO registry-anchored block(s)` refusal firing for the first time outside its own case |
| **CR-02** — the verifier's exact string into `marketplace.json`'s `description` | **exit 0, `ALL CHECKS PASSED`, never named** | **exit 1, 3 findings**: `:3:66` `improves comprehension`, `:3:75` `comprehension`, `:3:113` `saves tokens` |

Each mirror: gate sha256 compared and shown equal; premise asserted green with the expected document
count, suppressed total, per-group breakdown and extent; plant confirmed on disk (`PLANT_LANDED=1`,
line count preserved) **before** the gate was run.

**Sibling gates per tampered mirror** — recorded so the round can say *which* gates notice, not merely
that some gate does:

| mirror | gates that red | gates green | indeterminate |
|---|---|---|---|
| CR-01 form A | `check-banned-claims` (the owner, by name), `check-claim-anchors` | audit-register, imperative-lexicon, public-docs-vocabulary, uat-oracles, foundation-guards | `check-nul-bytes` |
| CR-01 form B | `check-banned-claims` (28 named), `check-claim-anchors` | the same five | `check-nul-bytes` |
| CR-02 | `check-banned-claims` **alone** | all six siblings | — |

**CR-02's all-green siblings are the correct outcome and are stated as such.** Round 6's complaint about
CR-01 was that only a *sibling* noticed. The answer is not that more gates should read a manifest — it is
that the gate whose PASS line makes the claim should be the one that holds it. It now is, alone.

### Premises asserted: 6 mirrors, 6 premises, 0 failures — and one protocol finding

Every premise asserted. **No plant was run against a mirror whose premise did not hold.** But asserting
the premise through **every** gate rather than only the one under test produced a finding:

**`check-nul-bytes` is INDETERMINATE on a `git archive` harness.** It returned exit 1 against the CR-01
tampered mirror, which reads as a second gate noticing the plant. It returns the **identical** refusal on
the **clean control**:

```
[PRISTINE control] EXIT=1  FAIL  `git ls-files -z` failed at /private/tmp/r7/pristine
[TAMPERED]         EXIT=1  FAIL  `git ls-files -z` failed at /private/tmp/r7/cr01a
```

Its scanned set is `git ls-files`, and an extract is not a repository, so it **refuses rather than
reporting a false green** — correct, fail-closed behaviour, and unusable as evidence here. It is counted
as indeterminate, not as a green. **Round 6's sweep did not make this distinction**, because the clean
control was not run through the sibling gates.

### The sweep transcript

All nine repository gates exit 0 · `npm run build` 0 · `npm run freshness` 0 (`48 committed .js`) ·
`freshness:catalog`/`:adapters`/`:skill-twins` 0 · `freshness:context`/`:queue`/`:traceability` 0
**(recorded as VACUOUS — the trees they compare do not exist)** · `npm run typecheck` 0 ·
`npx vitest run --exclude '**/scripts/e2e/**'` → **52 files, 2127 passed, 2 skipped**.

`npm test` was **NOT** run — it spawns the live claude-CLI e2e lane.

### The six disagreements, published rather than reconciled

| # | published | measured | cause |
|---|---|---|---|
| 18 | registry `line` drift **19 of 41** (29-51) | **19 of 45** | denominator moved — 29-52 added four correctly-lined anchored rows after 29-51 measured. Numerator unchanged. |
| 19 | writing-profile rows wrong by **62–80** lines (29-51) | **80, 80, 82** | 29-52 inserted anchors and content into that document after 29-51's measurement |
| 20 | tracked `*.json` = **37** (29-53 narrative) | **38**, at 29-53's own commit *and* at HEAD | one short |
| 21 | `scripts/**` JSON = **18** (29-53 table) | **19** | the same one, short |
| 22 | `actuals.commits` — 29-48 `2`, 29-50 `3`, 29-51 `3`, 29-52 `4`, 29-53 `3` | `3`, `4`, `4`, `5`, `5` | **five disagreements, all short, all the same cause** |
| 23 | 29-54's self-check: *"All 5 commits"* | `7`, matching 29-54's own `actuals.commits: 7` | a later commit fixed the frontmatter and left the prose |

**Rows 20–21 are one defect, and it is precise: the MECHANISM was right and its published EXPLANATION was
wrong by one.** 29-53's class equality is asserted in code, derived, with both sides floored — it cannot
be short and it is green. What is short is the hand-written narrative enumeration in the SUMMARY. The
partition re-derived here sums exactly: `19 + 9 + 4 + 2 + 2 + 2 = 38 = tracked *.json`.

**Row 22's cause is structural, which is why it is recorded and not corrected.** A plan's
`actuals.commits` is written **into its SUMMARY**, and the SUMMARY is then committed, usually followed by
a further state/ROADMAP/ledger docs commit. **A count of commits carried BY a commit can never include
the commits that carry it.** That is why all five are short and none is long. Correcting eight committed
SUMMARYs would be a rewrite of the trail, and a trail is not a tidy state.

**This SUMMARY applies the remedy to itself:** `actuals.commits: 4` counts the three task commits **plus
the closing metadata commit that carries this file**, deliberately including the self-reference rather
than under-reporting it by the same construct the row describes.

## The three equalities, both sides shown

```
FINDINGS   12 == 10 closed-by-mechanism + 2 closed-by-deletion + 0 + 0 + 0 + 0            ✓
PROBE ROWS  3 == 2 authored into must_haves.truths (29-52 `empty`, 29-53 `encoding`)
                 + 1 carried as a flagged assumption (LANG-07 `unclassified`, 29-48)      ✓
CLASSES    38 == 2 admitted (.claude-plugin/{marketplace,plugin}.json)
                 + 36 excluded by name (scripts 19, .planning 9, toolchain 4,
                   tool config 2, kit config 2)                                           ✓
             markdown side: 1364 tracked, 0 uncovered                                     ✓
```

Zero probe rows auto-resolved, auto-dismissed or marked `backstop`.

**The flagged assumption was ANSWERED and the row still stays unresolved.** Plan 29-54 confirmed round 7
left LANG-07's mechanism alone — **but falsified the evidence the previous two rounds used to check it.**
`grep -c "function parseFrontmatter"` tests one **spelling** and returns `0` on a tree carrying the
deleted grammar under the name `parseFm`. The previous two rounds' green on that row was correct about
the tree and **uninformative about the property**. The check is now four derived markers, each RED-proven
— **over exactly one module**; `scripts/frontmatter.ts`'s other consumers were not examined.

## What round 7 does NOT claim — quoted from the register's honest close

> **THE SURVIVING ENUMERATION IS `BANNED_CLAIM_LITERALS` ITSELF — 22 pinned literals across 3 groups,
> direction FAIL-OPEN — and a conformance, token-economy or comprehension claim written in words that
> list does not contain STILL PASSES THIS GATE, inside the exemption region and outside it.**
>
> **Live count: 22 pinned literals; 0 live occurrences of an unlisted claim in the corpus today; 2
> demonstrated bypass positions.** Demonstrated on the final tree at §2.7, not asserted: the same
> sentence passes at exit 0, with the planted file never named, both **outside** the region and
> **inside** the region on one of the 44 un-frozen lines, with `suppresses 14` and `reaches 66` unmoved
> in the second case.
>
> **This is `V-29-47-04`, carried unchanged. It is the whole of the fail-open direction on this axis and
> D-54 does not touch it.** The content bound governs which lines are **exempt**; the matcher governs
> which sentences are **banned**, and the matcher enumerates. **The list of WHAT IS BANNED is the
> prohibition's own subject and cannot be derived away** — a prohibition with nothing enumerated forbids
> nothing. … **What must never happen is a new list of WAYS OF SAYING IT.**

The register's honest close carries seven further items: the three subsumed residuals are **subsumed,
not pinned**, each with a stated remainder; `V-29-51-01` was **worked around, not fixed**, and will
recur for the next plan that writes a one-letter local; the unmeasured-external-assertion class gained
three corrected instances and **no mechanism that would find a fourth**; `V-29-49-01`'s one-read
invariant has **0 constructible behavioural witnesses**; `V-29-50-02`'s gitlink arm is witnessed by no
submodule; LANG-07's new evidence covers **one module**; and `check-nul-bytes` is **indeterminate**, not
green, on the mirror harness.

**And one live instance of the surviving fail-open exists in this tree today:** `CHANGELOG.md:67` reads
`sharper-per-token`, outside `BANNED_CLAIM_LITERALS`, so the gate does not flag it (29-43 R2, re-confirmed
at HEAD). It is the one place where the residual is not merely reachable but occupied.

## Harness premise failures — this phase's standing obligation

**Nine caught across round 7's plans** (tabulated in the register at §2.1), **plus one produced by this
plan's own sweep**: the first `git archive` invocation ran with the working directory outside the
repository and produced `MIRROR FILES: 0, TRACKED: 0`. It **failed loudly** rather than producing an
empty mirror a gate would have reported green over zero documents — the file-count assertion
(`1619 == 1619`) is what makes an empty extract unusable rather than invisible.

**The near-miss is the point, and it is recorded as such:** had the extract been *partial* rather than
*empty*, that count assertion is the only thing between this register and an entire sweep taken on a
truncated tree.

**And one produced inside this SUMMARY's own section:** the first draft of the reconciliation paragraph
read *"23 rows compared, 8 disagreements"*. Both halves were wrong — the count was taken by reading the
table rather than by enumerating its rows. Corrected to `17 agreeing + 6 disagreeing = 23`, with the
error recorded in the register rather than silently fixed.

## Prohibitions — status

| # | prohibition | status | evidence |
|---|---|---|---|
| 1 | No closure transcribed; every status re-measured with its command recorded; carried count `0` | **ENFORCED** | §8.3, 23 rows compared; §8.4 asserts the carried count by construction |
| 2 | The round does not claim more than it measured; the honest close names the surviving fail-open with its live count and direction | **ENFORCED** | §7.2 item 1, quoted above verbatim |
| 3 | No requirement marked; `requirements-completed:` empty; REQUIREMENTS.md byte-unchanged | **ENFORCED** | `git diff --numstat .planning/REQUIREMENTS.md` → **no output**, across this plan's full commit range |
| 4 | A stale number is deleted or replaced by the NAME of the thing that holds it, never by a fresher number | **ENFORCED** | `BANNED_CLAIM_SCAN_COUNT` named; grep for a corpus cardinality at the address → **0**; the historical draft enumeration was caught and removed |

## Threat mitigations applied

| Threat | Disposition | Applied |
|---|---|---|
| T-29-55-01 Repudiation — a closure transcribed rather than measured | mitigate | 23 rows re-measured; carried count 0; 6 disagreements published |
| T-29-55-02 Spoofing — a green sweep without its transcripts | mitigate | Every command and result quoted; both reproductions quote four artefacts each in order |
| T-29-55-03 Tampering — a false harness result passing as evidence | mitigate | 6 mirrors, 6 premises asserted, 0 failures; 10 false results recorded; the `check-nul-bytes` indeterminacy caught by running the clean control through every gate |
| T-29-55-04 Information disclosure — a finding silently absent from the roll-up | mitigate | Marker set DERIVED, not transcribed; 9 never-rolled-up markers named; three equalities published |
| T-29-55-05 Spoofing — a green run read as totality | mitigate | §7.2's eight items; `V-29-47-04` demonstrated in two positions with a live occupied instance named |
| T-29-55-06 Repudiation — a workflow describing a scope its gates outgrew | mitigate | Both comments corrected; constant named; cardinality grep 0; comment-only proven |
| T-29-55-07 Elevation of privilege — a register claiming a requirement verdict | mitigate | `requirements-completed: []`; REQUIREMENTS.md byte-unchanged; §7.3 states the verdict is the verifier's |
| T-29-55-SC Tampering — package installs | accept | No package installed; `package.json`/lockfile byte-unchanged across the whole round (`git diff --exit-code 29f61e0..HEAD` → 0) |

## Deviations from Plan

**1. [Rule 1 — bug, in this plan's own edit] The corrected CI comment's first draft typed three stale cardinalities as history**

- **Found during:** Task 2, running the prohibition's own acceptance grep against the **draft** rather
  than against the before-form.
- **Issue:** the replacement paragraph read *"stale both times a plan widened the scan — 82, then 115,
  then 117"*. That is three hand-written corpus cardinalities at the exact address that had rotted twice.
  A past tense does not stop `117` being stale at the next widening.
- **Resolution:** the values were removed and the rot described without enumerating them. The sentence
  now names `BANNED_CLAIM_SCAN_COUNT` and its module, and explicitly preserves the dated,
  commit-attributed record below it as a different construct.
- **Files modified:** `.github/workflows/ci.yml`. **Commit:** `d460a87`.

**2. [Rule 1 — bug, in this plan's own reconciliation] The reconciliation summary miscounted itself**

- **Found during:** Task 3, enumerating the rows to write the summary line.
- **Issue:** the first draft said *"23 rows compared, 8 disagreements"*. The row count was right by
  accident and the disagreement count was wrong; the first table's own header also said "6
  disagreements" where it has 4.
- **Resolution:** both corrected by enumeration, and the correction is **recorded in the register** —
  a reconciliation section that miscounts its own reconciliation is the same class as rows 18–23,
  produced at the last possible moment by the document whose subject it is.
- **Files modified:** `docs/audit/29-round7-residuals.md`. **Commit:** `64a139d`.

**3. [Rule 1 — bug, in this plan's own harness] The first `git archive` ran outside the repository**

- Documented under "Harness premise failures" above. Failed loudly; caught by the mirror/tracked
  file-count assertion. No committed artifact involved. **Commit:** n/a.

**4. [Process] The tracer feedback gate was run automated rather than as a human checkpoint**

- **Found during:** the gate immediately after Task 1's commit.
- **Issue:** `_auto_chain_active` and `auto_advance` both read `false`, whose literal branch is "STOP and
  return a `checkpoint:human-verify`". Task 1's `<verify>` is entirely `<automated>` — `test -f` plus two
  gate invocations. `checkpoints.md` states that users NEVER run CLI commands.
- **Resolution:** the plan's frontmatter declares `autonomous: true` with zero `checkpoint:*` tasks. The
  gate's SUBSTANCE — re-run the tracer's `<verify>` end-to-end and HALT rather than pour expansion work
  onto a broken foundation — was executed (`TRACER_VERIFY_EXIT=0`). Same disposition plans 29-48 through
  29-53 recorded.
- **Files modified:** none. **Commit:** n/a.

Three auto-fix attempts across the plan; no task used more than two.

## Known Stubs

None. This plan created one audit document and edited comments in one workflow file. No code, no
placeholder, no TODO, no unwired data path.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change. The
workflow diff carries zero non-comment lines.

## Requirements

**No `requirements-completed:` entry is declared.** `LANG-04`'s verdict belongs to round 7's verifier;
this register records evidence — including two bypasses now red by name **and** a surviving fail-open
with a live occupied instance — and makes no determination. `requirements mark-complete` was
deliberately not run.

## Self-Check: PASSED

Files claimed — verified present:

- `FOUND: docs/audit/29-round7-residuals.md` (created, 1127 lines)
- `FOUND: .github/workflows/ci.yml` (modified, comments only)
- `FOUND: .planning/phases/29-controlled-language-voice-guard-rebuild/29-55-SUMMARY.md`

Commits claimed — verified in `git log`:

- `FOUND: 5c12c5a` — `docs(29-55): the round-7 disposition record, reconciled in both directions`
- `FOUND: d460a87` — `docs(29-55): the CI workflow describes the gates it runs, not the ones it used to`
- `FOUND: 64a139d` — `docs(29-55): the sweep — every number re-taken on the final tree, disagreements published`

Plan-level assertions re-verified at `64a139d`:

- all nine repository gates → exit 0
- `npm run build`, `npm run freshness` (48/48), `npm run typecheck` → exit 0
- all six freshness gates → exit 0 (three recorded as vacuous)
- `npx vitest run --exclude '**/scripts/e2e/**'` → 52 files, 2127 passed, 2 skipped
- `git diff --numstat .planning/REQUIREMENTS.md` → **no output**
- `package.json` / `package-lock.json` → byte-unchanged across the round
- both bypass reproductions re-run on the final tree → exit 1, named at `file:line:column`

**Per this plan's own row 22, the commit count above excludes the closing metadata commit that carries
this file.** `actuals.commits: 4` includes it.

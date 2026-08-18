# Gap-closure round 7 — the twelve findings disposed, every marker rolled up, and what is still not claimed

**Round:** 7 (plans `29-48`, `29-49`, `29-50`, `29-51`, `29-52`, `29-53`, `29-54`, `29-55`; code range
`29f61e0..HEAD`, 32 commits at the time of writing)
**Written:** 2026-08-18, by plan `29-55`
**Gap source:** `29-VERIFICATION-round6.md` — two failed truths (3/5), one on `LANG-04` and one on
requirements traceability; and `29-REVIEW-round6.md` — twelve findings (2 critical, 6 warnings, 4 infos)
**Predecessor records:** `docs/audit/29-round6-residuals.md`, `29-round5-residuals.md`,
`29-round4-residuals.md`. This file follows their section shape deliberately rather than inventing a
fourth one for a fourth instance.

## What this artifact is for, and the one thing it does differently from its predecessors

A verification round reads source and committed artifacts. It does not read a planning conversation. So
a decision that lives only in a conversation — "this residual is accepted", "this alternative was
measured and refused", "this remedy was overtaken" — is indistinguishable from a silent drop when the
next round comes to read the tree. This file is where round 7's decisions live so they can be read.

**What is different here: nothing below was transcribed.** Round 6's register verified its twelve rows
against SUMMARY *evidence*, which was the right move and is not enough. A round that reads its own
plans' tables has established that the plans were followed; it has not established that the tree is
what they say. **Every live count in this document was re-taken on the final tree at
`48e93b8826b98b1734a9545767cf18266229e62d`, with the command that produced it recorded beside it.**
Where a number was published by a plan and disagrees with the tree, both values are printed and the
disagreement is a finding (§8.3) — never reconciled away. The count of rows carried from a SUMMARY
rather than re-measured is **0**, and that is asserted rather than asserted-about.

It also carries the round's adversarial attempt log, **including the attempts that succeeded and the
harness results that were false.** A green suite is not proof for a safety invariant in this
repository, and this phase's record now holds a documented false harness result in every round it has
run. Round 7 produced **nine more**, one of them in this plan's own sweep (§2.1). The credible artifact
is a written list of what was tried and what happened.

---

## 1. The round-7 disposition table — all twelve findings of `29-REVIEW-round6.md`

**Built from the review, not from the plans.** Each row's id and statement are taken from
`29-REVIEW-round6.md`; the artifact that discharges it was then located and cited by file and commit. A
table assembled from the plans would prove only that the plans were followed. A table assembled from
the findings proves the findings were answered.

Every "live count" column below was re-measured on the final tree by the command named in its cell.

### 1.1 The two critical findings

| id | statement as recorded | disposition | mechanism | live count, re-measured on the final tree | where the measurement lives |
|---|---|---|---|---|---|
| **CR-01** | The sole carve-out is bounded positionally and not at all by content. One line replaced inside the region — the honest denial swapped for `grugops is a token economy: the token economy is the whole product.` — holds `extent` at 62 and `suppressed` at 14 exactly, and all seven repository gates exit 0. The wholesale form (the whole 61-line body replaced) also holds both pins, and the only thing that reds is a verbatim freeze owned by a **different** gate. | **CLOSED by mechanism (D-54).** | Inside `BANNED_CLAIM_EXEMPT_REGION`, a line lifts the prohibition only if it ALSO sits inside a registry-anchored block whose bytes are byte-identical to the row naming them. Suppression is a **conjunction** of positional membership and frozen-block membership. The matcher is byte-unchanged; no lexical axis returned. The reviewer's cheaper option — the per-group composition pin — shipped as a **secondary** measure with its non-closure stated in the source beside it. | **0** live findings on the clean tree (`node scripts/check-banned-claims.js` → `0 findings over 117/117 elements`). Both bypass forms **red by name at HEAD** and both are **green at the round's base**: §2.3 (form A), §2.4 (form B). | §2.3, §2.4; `29-52-SUMMARY.md`; `29-CONTEXT.md` D-54 |
| **CR-02** | The kit's two shipped JSON manifests are user-visible claim surfaces outside every gate, and the round's markdown-only class boundary is never declared. `.claude-plugin/marketplace.json`'s `description` — the string a user meets in `/plugin marketplace add` — accepted a three-finding claim with every gate green. | **CLOSED by mechanism, and EXCEEDED.** | A sixth **derived** scan part, `pluginManifests`, admits both manifests; `BANNED_CLAIM_SCAN_COUNT` moved 115 → 117 with both entrants named, the value read off the gate's own refusal text. The coverage denominator widened from `git ls-files '*.md'` to markdown **plus** JSON, **and the missing `scan ⊆ tracked` direction was added**, so an intruder in the scan reds as well as an omission from it. | **0** live occurrences in either manifest (measured pre-admission through the gate's own `countBannedClaimOccurrences`: 0/0/0 per group on both files — admitting them cost zero reds). The verifier's exact plant now produces **3** findings at `file:line:column`: §2.5. | §2.5; `29-53-SUMMARY.md` |

**CR-02 exceeded its finding in a way worth recording, because it went the other way from usual.** The
review proposed the fix as a segment set including `plans` and `memory-bank`. Applied as written, that
projection **removes 13 shipped kit documents from a safety scan** —
`agent-factory/seed/plans/` and `agent-factory/seed/memory-bank/` hold board, metrics, nfr-catalog and
traceability templates plus nine memory-bank templates, all scan members today. Plan 29-53 measured it
rather than adopting it (`derived 104 document(s) … kit 60` under the review's own fix) and shipped a
three-kind list — `**/name/` any-depth, `name/` root-only, `a/b.json` exact — with each cardinality
asserted two-sided. **A fix cleared against a reviewer's enumeration rather than against the tree is the
defect this phase names; here the reviewer's enumeration was the thing that would have caused it.**

### 1.2 The six warnings

| id | statement as recorded | disposition | mechanism | live count, re-measured | where |
|---|---|---|---|---|---|
| **WR-01** | `.claude/` was admitted as a DISK walk, so the prefix exclusions are defeated by nesting; `.claude/worktrees/` is where this project's own execution tooling puts worktrees, and a plant under it made the gate report the claim registry and a `.planning/` document — the exact harm the exclusion exists to prevent — while both guarding assertions stayed green. | **CLOSED by mechanism.** | The exclusion is enforced **at descent**, from one list, at any depth — not as a prefix test on a path derived later. Plus the missing coverage direction (`scan ⊆ tracked`). | **0.** `kit 73` in the PASS line is byte-identical before and after the change, which is what proves the walk-anchored exclusion removed nothing. The reviewer's own nested plant leaves the scan count unmoved and produces zero findings. | `29-53-SUMMARY.md`; PASS line quoted at §8.1 |
| **WR-02** | The exemption region is measured on one read of the document and applied to a second read — the module's own stated "ONE READ" invariant is false, and indices from read #1 are spent against the array from read #2. | **CLOSED by mechanism**, with a residual on the *witness* rather than on the fix. | The scan loop reuses `exemptText` for the exempt path instead of re-reading it, and the reuse is **conjoined with a flag that the read succeeded** — `existsSync` answers *present*, not *readable*, so the guard was extended in the same commit (Rule 2, recorded in that plan's deviations). | **2** filesystem reads per run, source-shape-derived over comment-stripped source, pinned two-sided; the invariant's **behavioural** reach is **0 constructible inputs** — see `V-29-49-01`, §4. | `29-49-SUMMARY.md`; §4 |
| **WR-03** | `check-nul-bytes.ts` still asserts, at the declaration that justifies its new `bytes` field, the exact claim the same module measured FALSE (`git's -text verdict is itself NUL-based`), and its worked example is contradicted by the module's own table 190 lines below. | **CLOSED, and EXCEEDED.** | The declaration was rewritten to state what the field is for, anchored on the only property measured to hold without exception: **a NUL FORCES `-text`; the rest of the class does not.** The address enumeration found **three live sites no review had named**, including one that is the same sentence WR-03 was written about, in a file WR-03 did point at, at a different address. | **10** classifier-related statements enumerated across module and test file; **4** false, all 4 corrected; **6** measured-true, 3 re-confirmed first-hand. Live false statements after: **0**. | `29-50-SUMMARY.md`; §4 (`V-29-50-01`) |
| **WR-04** | `nulOffsets()` is production-dead and its doc comment names it as the load-bearing half of the git cross-check. Two implementations of the NUL predicate, and the one the prose declares authoritative is exercised only by tests. | **CLOSED BY DELETION.** | The production-dead duplicate is deleted; `controlByteOffsets` is the sole scanner and the cross-check asks `bytes.includes(NUL)` with the comment corrected to say so. The three test cases moved onto the surviving predicate. | `grep -a -c 'nulOffsets' scripts/check-nul-bytes.ts` → **0**; same in the twin and the test file. The deletion **falsified two of the module's own header premises** (both named `Buffer.indexOf(0)`), which the plan's own absence-grep caught and corrected — recorded as a deviation there rather than smoothed. | `29-50-SUMMARY.md` |
| **WR-05** | `check-banned-claims.ts` consumes `publicDocsCorpus()` but drops that module's derivation-refusal channel on the floor: a refusal raised while deriving the corpus lands in the *other* module's array and is never printed by the gate that is running. | **CLOSED by mechanism.** | The channel is exported with the data and folded into the consumer's own refusal loop, so the gate that is running reports the refusals its inputs raised. | **1** reader of the accessor, asserted over **comment-stripped** source — the first version of that count read a prose *mention* as a consumer and returned 2 (§2.2, H2). Three permanent cases, all RED-proven. | `29-49-SUMMARY.md` |
| **WR-06** | Two holes in a module whose stated floor is "a stack trace is not a verdict": the reporting loop re-reads a file it already read, unguarded, so a file removed between scan and report kills the run; and an **initialised** submodule gitlink raises EISDIR and is misreported as an I/O error. | **CLOSED by mechanism**, with a residual on the *fixture*. | The buffer is carried rather than re-read (one filesystem read per path, and it is in the scan); an `EISDIR` arm names the gitlink case separately from `missing` and `unreadable`. | **1** read per path, asserted; the gitlink arm fires and is asserted with the other two arms proven empty — but it is witnessed through an **ordinary directory**, not a real initialised submodule. `V-29-50-02`, §4. | `29-50-SUMMARY.md`; §4 |

### 1.3 The four infos

| id | statement as recorded | disposition | mechanism | live count, re-measured | where |
|---|---|---|---|---|---|
| **IN-01** | The case added to end cardinality drift restates the contract it holds: `/^\d{2}-.+\.md$/` is typed in both the generator and its test, so the two can disagree. The named failure mode reappearing one level down, inside its own remedy. | **CLOSED, and EXCEEDED.** | The rule is extracted to `isNumberedWorkflowFile` in `scripts/kit-model.ts` — **a predicate, not an exported RegExp**, because a shared mutable RegExp is a shared object. The rule was found declared **three** times, not two, so the fix is an extraction plus three rewirings. Mutation-proven: one edit to the declaration moves every consumer. | **1** declaration site across `scripts/*.ts`, derived and asserted two-sided. | `29-54-SUMMARY.md` |
| **IN-02** | An unenforced uniqueness claim survives with a point-in-time measurement typed beside it — nothing in the repository enforces uniqueness of workflow `order`, so a standing property is asserted from a one-off measurement. | **CLOSED by mechanism**, at the point of effect. | A named refusal in `scripts/generate-catalog.ts` fires **before the workflow sort**, names both colliding files and the shared value, and refuses to write. The asserting comment is **deleted, not corrected** — the round's own rule about stale numbers, applied to a stale property. The refusal walks its buckets in ascending value order so its wording does not depend on directory read order. | **19** workflow files, **19** declaring exactly one `order`, **19** distinct values, **0** duplicates — re-derived here from the frontmatter authority: `values: 0,1,2,…,18`. | §4.7d; `29-54-SUMMARY.md` |
| **IN-03** | The walk bound is applied five times independently, so the effective budget is 5 × `MAX_WALK_ENTRIES` and no single part's refusal reflects the work the gate actually did. | **CLOSED by mechanism, NARROWED not eliminated.** | The module's parts share **one** budget object. The imported public-docs corpus derivation still carries its own, at that module's import time, so the effective bound is **2 ×**, not 1 ×. That remainder is **declared in the source with its reason** and pinned two-sided at one budget object per module. | `grep -a -c '{ examined: 0 }' scripts/check-banned-claims.ts` → **1**. The declared remainder is `V-29-53-02`, §4. | `29-53-SUMMARY.md`; §4 |
| **IN-04** | Addition to `V-29-47-01`: the false block carries a **sixth** false statement — it asserts a live, deliberately-carried residual for something the round closed — and **the position is the harm**, because the block is the doc comment attached to `BANNED_CLAIM_EXEMPT_REGION`, the text an editor reads immediately before changing the sole carve-out. Deleting it should be sequenced ahead of any further exemption work. | **CLOSED BY DELETION, and the sequencing instruction was obeyed.** | The block is deleted rather than corrected — its construct is gone, and a corrected paragraph about a construct that no longer exists is a second thing to keep true. Deleted in plan **29-49**, the round's first code plan, **before** 29-52 touched the carve-out. That ordering is the finding's own remedy, applied. | `grep -a -c 'pinned pair' scripts/check-banned-claims.ts` → **0**; `grep -a -c 'V-29-42-03' scripts/check-banned-claims.ts` → **0**. Six false statements at 1 address in 2 files → **0**. | `29-49-SUMMARY.md` |

### 1.4 The finding equality, stated as an equality with both sides shown

```
twelve findings surfaced  ==  closed by mechanism + closed by deletion + subsumed + narrowed + deferred + rejected

LEFT  = 12   (CR-01, CR-02, WR-01, WR-02, WR-03, WR-04, WR-05, WR-06, IN-01, IN-02, IN-03, IN-04)
RIGHT = 10 + 2 + 0 + 0 + 0 + 0 = 12

  closed by mechanism (10): CR-01, CR-02, WR-01, WR-02, WR-03, WR-05, WR-06, IN-01, IN-02, IN-03
  closed by deletion   (2): WR-04, IN-04
  subsumed             (0): —
  narrowed             (0): — (IN-03 is counted as CLOSED with a DECLARED remainder, not as narrowed;
                               the remainder carries its own id, V-29-53-02, and appears in §4)
  deferred             (0): —
  rejected             (0): —
```

**No partials.** Four rows record work beyond the finding — CR-02, WR-03, IN-01 and WR-01 each found
sites, classes or costs the review had not named, and in CR-02's case the review's own suggested fix was
refused with a measurement. That is this phase's recorded countermeasure to a fix cleared against
somebody else's enumeration, and it fired four times in eight plans.

---

## 2. The adversarial attempt log

### 2.0 The premise, asserted before any transcript below was believed

In this order, and quoted.

**Freshness — the committed `.js` these attacks run is provably a build of its `.ts`:**

```
$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
FRESHNESS_EXIT=0
```

**The mirror's identity.** Every mirror below was built with `git archive` and extracted under
`/private/tmp`, **never `/tmp`** — the macOS symlink that has now produced a false harness result in
four separate plans of this round alone, by making `import.meta.url` miss a module's `isEntry` guard so
the gate never runs and `exit 0` with zero bytes of output reads as a pass.

```
$ git -C <repo> archive HEAD | tar -x -C /private/tmp/r7/pristine
MIRROR FILES: 1619
TRACKED:      1619

$ shasum -a 256 <repo>/scripts/check-banned-claims.js
f5f4469cde368cbb8a7d9d6751f8602b77fa92bf218fa1e2b10a3cb1b55705a7
$ shasum -a 256 /private/tmp/r7/pristine/scripts/check-banned-claims.js
f5f4469cde368cbb8a7d9d6751f8602b77fa92bf218fa1e2b10a3cb1b55705a7
```

**The clean-mirror control, at exit 0, with every pin quoted:**

```
$ CHECK_ROOT=/private/tmp/r7/pristine node /private/tmp/r7/pristine/scripts/check-banned-claims.js
EXIT=0   BYTES=1663   BANNER_LINES=1
  117 document(s) carry zero
  suppresses 14 banned-claim
  standard-name 8, token-economy 2, comprehension 4
  pinned at 14
  reaches 66 line ... pinned at 66
  6 registry-anchored block ... pinned at 6
```

**The BASE mirror, for the two-direction measurement.** Round 7's base is `29f61e0`, and its committed
gate hashes to the binary round 6's review and round 6's verifier each ran independently:

```
$ git -C <repo> archive 29f61e0 | tar -x -C /private/tmp/r7/base
BASE=29f61e07b709db14df9248701d22a38b8f02c2b4
GATE_SHA_BASE=6f0722fa6fb8f82d3875c1df3f239ff4db193e6fb9fb40e70da8224c19b385ba
GATE_SHA_HEAD=f5f4469cde368cbb8a7d9d6751f8602b77fa92bf218fa1e2b10a3cb1b55705a7

$ CHECK_ROOT=/private/tmp/r7/base node .../check-banned-claims.js
BASE_PREMISE_EXIT=0
  115 document(s) carry zero
  suppresses 14 banned-claim
  standard-name 8, token-economy 2, comprehension 4
  reaches 62 line
```

`6f0722fa…b385ba` is the hash `29-REVIEW-round6.md` § Verification notes and
`29-VERIFICATION-round6.md` § Method both record. **The "before" column below is therefore taken on the
same binary both independent reproductions used**, which is what makes the before/after pair a
measurement rather than two unrelated runs.

Every attempt below was planted **alone** onto a mirror **reset from a pristine extract**, the plant was
confirmed on disk before the gate was run, and every verdict is adjudicated on the **rendered finding
line at `file:line:column`**, never on the exit code alone.

### 2.1 The false harness results this round produced — nine, and one of them is this plan's

Recorded ahead of the log they would have corrupted. This phase's transferable rule is **assert the
verification harness's own premise**, and round 7 is the round that finally shows what happens when a
round applies it systematically: nine catches in eight plans, none of them published.

| # | plan | what reported falsely | why | how it was caught |
|---|---|---|---|---|
| 1 | 29-48 | a symmetric-difference finding against `REQUIREMENTS.md` | the Route-B table bound stopped at the separator row, so `\|B\| = 0` and the empty intermediate rendered as a **maximal** finding | the floor above zero on **both** sides of the equality, asserted before the equality |
| 2 | 29-48 | 8 FALSE checkbox/row disagreements | an off-by-one substring index made the checkbox column empty | the same floor, on the other side |
| 3 | 29-49 | "the refusal array has a second reader" against code with exactly one | the accessor's own doc comment **names** the push sites in a sentence; a prose mention was counted as a reference | the question re-asked of comment-stripped source, with the strip's premise asserted on both sides |
| 4 | 29-49 | a pre-change mirror binary reporting **exit 0 with no output at all** — a fail-open finding at face value | `/tmp` → `/private/tmp`; the main-module guard never matched and `runAll()` never ran. **Exit 0 was silence, not a pass** | the premise assertion *does the clean mirror produce a PASS line?* → `NO PASS LINE` |
| 5 | 29-50 | a disagreement with a committed `git ls-files --eol` measurement | the harness's carrier file lacked a trailing newline, so git reported `w/none` where the module's table says `w/lf` | asking **why** the cell differed rather than writing the difference down |
| 6 | 29-51 | all nine mutated mirrors **and** the clean mirror at exit 0 with EMPTY output | the same `/tmp` symlink shape as #4 | the premise was **strengthened from one condition to three** — clean passes, every mutated mirror reds, every capture non-empty — and it is the second that fires |
| 7 | 29-53 | the first mirror run of the plan at exit 0 with no output | the same `/tmp` symlink shape again | banner + PASS line presence asserted, and the mirror path resolved with `pwd -P` |
| 8 | 29-53 | a mutation run **PASSING** that should have red | deleting the descent test left `segments` unused, `tsc` **refused to emit**, and the stale committed `.js` was re-run | the build's own exit code and the mutated binary's sha256 asserted before every mutation run |
| 9 | 29-54 | three separate false results — `workflow rows emitted: 0`; `freshness:catalog` reporting **fresh** with a closure entry removed; an "exactly one declaration site" grep returning **empty** | an unmatched row-counting grep; an unrebuilt `.ts`; and `grep -v test` filtering the declaration line itself because it reads `.test(filename)` | implausibility against a known 19-workflow corpus; an explicit rebuild premise; and the rule that **an empty result for a rule known to exist is a premise failure, not a pass** |

**And one produced by this plan, in its own sweep.** The first `git archive` invocation of §2.0 ran with
the working directory outside the repository:

```
fatal: not a git repository (or any of the parent directories): .git
extracted
MIRROR FILES: 0
TRACKED:      0
```

It **failed loudly** rather than producing an empty mirror that a gate would have reported as green over
zero documents — the file-count assertion (`1619 == 1619`) is the premise that makes an empty extract
unusable rather than invisible. Corrected by naming the repository explicitly (`git -C <repo>`). This is
recorded because the near-miss is the point: had the extract been *partial* rather than *empty*, the
count assertion is the only thing standing between this register and a whole sweep taken on a truncated
tree.

**One more, and it is a finding about the SWEEP PROTOCOL rather than about a plant** — see §2.6.

### 2.2 The degrees of freedom this round's change introduces, named before the attacks

Round 6 named its degrees of freedom before attacking, and that discipline is why it found `V-29-47-02`
and `-03`. D-54 adds a content bound to the sole carve-out. Its new degrees of freedom:

| # | the degree of freedom | why THIS CHANGE created it |
|---|---|---|
| **E-1** | **the exempt-anchor SET** | Suppression now depends on a derived set of registry-anchored blocks. A set that is silently empty, silently short, or silently wide is a new way for the carve-out to be wrong. Answered by a two-sided cardinality pin (`BANNED_CLAIM_EXEMPT_ANCHORS = 6`) and a **named refusal** for a located region containing zero anchored blocks — both exercised at §2.4. |
| **E-2** | **the registry as an input to a safety gate** | `docs/audit/28-claim-registry.md` was a trace surface; it is now load-bearing for what the banned-claim gate suppresses. A registry edit is now a safety-relevant edit, which is the standing cost D-54 records and the user accepted with it. |
| **E-3** | **the un-frozen remainder inside the region** | 22 of the region's 66 lines are frozen; **the other 44 stay freely editable and are SCANNED.** A claim written on one of them is a finding — which is the design — but it also means the region is no longer uniformly anything, and a reader who knows "the disclaimer is exempt" now holds a false model. The PASS line publishes the split for exactly this reason. |
| **E-4** | **the class boundary as a declared thing** | 29-53 made the scan class markdown **plus** JSON. The boundary is now something somebody wrote down, which means it can now be wrong in a *new* way: a shipped claim surface in a third format (YAML, TOML, a `.txt`) is outside it. `.github/workflows/ci.yml` is the live instance and it is §3's subject. |

### 2.3 CR-01 form A — the single-line, count-preserving substitution, in both directions

The exact form round 6's reviewer and round 6's verifier each reproduced independently: **one line
replaced, line count preserved**, the honest denial swapped for a live disproven token-economy claim.

**Plant landing, confirmed on disk before either run:**

```
PRE_LINES=299   POST_LINES=299                       (HEAD mirror; at base: 295 / 295)
PRE_292 = There is no evidence that controlled language improves comprehension for a language model. The kit
POST_292= grugops is a token economy: the token economy is the whole product.
PLANT_LANDED=1
```

| | **BASE `29f61e0`, gate `6f0722fa…b385ba`** | **FINAL TREE `48e93b8`, gate `f5f4469c…05a7`** |
|---|---|---|
| exit | **0** | **1** |
| verdict line | `ALL CHECKS PASSED` | `4 CHECK(S) FAILED` |
| planted file named | **0 times** | **2 times** |
| named at | — | `agent-factory/writing-profile.md:292:14` and `:292:33`, both `banned token-economy literal "token economy"`, each quoting the planted sentence verbatim |
| cause named | — | `C-28-046's anchored block inside the one named exemption region no longer matches its registry row … so its lines are NOT exempt` |
| `suppressed` pin | **14**, unmoved | **12** vs declared 14 — reported |
| `extent` pin | **62**, unmoved | unmoved (the substitution preserves the line count, by design) |
| per-group breakdown | `standard-name 8, token-economy 4, comprehension 2` — **moved, and pinned by nothing** | `comprehension` 2 vs declared 4 — reported by the composition pin |

**The base column is the finding, reproduced.** `suppressed` 14 and `extent` 62 both unmoved, every gate
green, and the only visible difference between a correct tree and a kit shipping a disproven
token-economy claim inside the section whose purpose is to deny claims was `token-economy 2,
comprehension 4` becoming `4, 2` in a PASS line nothing asserted against. That is exactly what
`29-VERIFICATION-round6.md` § Behavioral Spot-Checks recorded, re-taken here.

**The HEAD column names the line.** And it names the **cause and the symptom together**, deliberately —
the refusal text says so: *"a finding whose reason lives in another gate's output is a finding the
reader has to go looking for."* Round 6's version of this plant was noticed only by a sibling gate. It
is now the owning gate's own finding, with the sibling's verdict quoted inside it.

**Sibling gates against the same tampered mirror:**

| gate | exit | note |
|---|---|---|
| `check-claim-anchors` | **1** | `agent-factory/writing-profile.md: the text at C-28-046's anchor (line 292) is not byte-identical to the registry's verbatim block.` |
| `check-audit-register` | 0 | |
| `check-imperative-lexicon` | 0 | |
| `check-public-docs-vocabulary` | 0 | |
| `check-uat-oracles` | 0 | |
| `check-foundation-guards` | 0 | |
| `check-nul-bytes` | **INDETERMINATE** | refuses on the clean control too — see §2.6 |

### 2.4 CR-01 form B — the wholesale rewrite, count preserved

The worse form the reviewer also measured: the whole region body replaced, line count preserved. At base
this held both pins and only `check-claim-anchors` reddened, *"which means the ONLY thing standing
between this gate and a fully rewritten disclaimer is two anchored paragraphs owned by a different
gate."*

**Premise asserted on this mirror before the plant** (`PREMISE_EXIT=0`, `117 documents`,
`suppresses 14`, `reaches 66`), then lines 236–299 replaced with 14 claim lines plus filler:

```
PRE_LINES=299   POST_LINES=299   PLANT_LANDED=14
```

**Result at HEAD — exit 1, and the owning gate produces the finding itself:**

```
FAIL  the one named exemption region ... is LOCATED and contains ZERO registry-anchored block(s).
      An exemption with no frozen block inside it exempts nothing while still reading as a live
      carve-out, and both of this region's cardinality pins would then be satisfiable by a document
      that suppresses nothing. Restore the anchors, or ...
FAIL  ... suppressed 0 banned-claim occurrence(s), and BANNED_CLAIM_EXEMPT_SUPPRESSED ... declares 14
FAIL  ... suppressed 0 `standard-name` occurrence(s) ... declares 8
FAIL  ... suppressed 0 `token-economy` occurrence(s) ... declares 2
FAIL  ... suppressed 0 `comprehension` occurrence(s) ... declares 4
FAIL  banned claims: 28 finding(s) over 117 elements
      agent-factory/writing-profile.md:236:14 ... :236:36 ... :237:14 ...   [28 named positions]
```

**TOTAL_NAMED = 28**, every one at `file:line:column`. The `E-1` refusal — a located region containing
zero anchored blocks — is the arm that makes the wholesale form loud rather than merely non-zero, and
it fires here for the first time outside its own permanent case.

Sibling gates: `check-claim-anchors` exit 1; `check-audit-register`, `check-imperative-lexicon`,
`check-public-docs-vocabulary`, `check-uat-oracles`, `check-foundation-guards` all exit 0.

### 2.5 CR-02 — the verifier's exact string, in both directions

The plant is `29-VERIFICATION-round6.md`'s own, character for character, into the field a user meets
running `/plugin marketplace add`.

```
PRE_L3 : "description": "grugops marketplace — the file-based agent factory for disciplined, auditable software delivery on the coding-agent CLI you already use.",
POST_L3: "description": "grugops marketplace — controlled language that improves comprehension for language models and saves tokens.",
PLANT_LANDED=1   JSON_PARSES=true
```

| | **BASE `29f61e0`, gate `6f0722fa…`** | **FINAL TREE `48e93b8`, gate `f5f4469c…`** |
|---|---|---|
| exit | **0** | **1** |
| verdict | `ALL CHECKS PASSED` | `banned claims: 3 finding(s) over 117 elements` |
| planted file named | **0 times** | **3 times** |

```
.claude-plugin/marketplace.json:3:66  — banned comprehension literal "improves comprehension"
.claude-plugin/marketplace.json:3:75  — banned comprehension literal "comprehension"
.claude-plugin/marketplace.json:3:113 — banned token-economy literal "saves tokens"
```

**Sibling gates against the tampered mirror: all six exit 0.** That is the correct outcome and worth
stating as such. Round 6's complaint about CR-01 was that only a *sibling* noticed; the answer is not
that more gates should notice a manifest claim, it is that the gate whose PASS line makes the claim
should be the one that holds it. It now is, alone.

### 2.6 A finding about the sweep protocol itself: `check-nul-bytes` cannot be adjudicated on a `git archive` mirror

`check-nul-bytes` returned exit 1 against the CR-01 tampered mirror. Read at face value that is "a
second gate noticed the plant". **It is not, and the premise assertion is what says so.** Run against
the *clean* control mirror:

```
[PRISTINE control] EXIT=1
  FAIL  `git ls-files -z` failed at /private/tmp/r7/pristine — Command failed: git ls-files -z
[TAMPERED]         EXIT=1
  FAIL  `git ls-files -z` failed at /private/tmp/r7/cr01a — Command failed: git ls-files -z
```

Identical refusal on both. The gate's scanned set is `git ls-files`, and a `git archive` extract is not
a git repository, so the gate **refuses rather than reporting a false green** — which is correct
behaviour and is exactly the fail-closed posture 29-45 built it with. But it means **`check-nul-bytes`
is INDETERMINATE on this harness and must not be counted in a sibling-gate tally.** It is counted as
indeterminate above.

This is recorded as a protocol finding rather than a defect: round 6's sweep listed
`node scripts/check-foundation-guards.js` and the nul gate among its per-mirror results without
distinguishing "green because nothing was wrong" from "red because the harness cannot host it". The
distinction only appears if the clean control is run through **every** gate, not just the one under
test.

### 2.7 `V-29-47-04` demonstrated on the final tree — the surviving fail-open, in both positions

The residual this round does **not** close, measured rather than asserted, on a premise-asserted mirror.

| # | plant | position | exit | named | verdict |
|---|---|---|---|---|---|
| T-out | `This profile cuts the number of tokens a model must read on every run.` appended to `agent-factory/workflows/13-incident.md` | **outside** the region | **0** | **none** | **GREEN — PASSES.** A token-economy claim in words `BANNED_CLAIM_LITERALS` does not contain. |
| T-in | the same sentence substituted for line 289 of `agent-factory/writing-profile.md` — a body line **inside** the region and **outside** every frozen block, line count preserved | **inside** the region, un-frozen remainder | **0** | **none** | **GREEN — PASSES.** `suppresses 14` and `reaches 66` both unmoved. |

Both plants confirmed landed on disk (`PLANT_LANDED=1`, `LINES=299`) with `PREMISE_EXIT=0` on each
mirror before the plant.

**T-in is the more important row and it is the one a tidy record would omit.** D-54 bounds the carve-out
by content, and it would be easy to read that as "the region is now safe". It is not: the content bound
governs which lines are **exempt**, not which sentences are **banned**. A claim in unlisted words passes
in the un-frozen remainder exactly as it passes anywhere else in the corpus, because the matcher — which
D-54 deliberately left byte-identical — is the thing that decides that, and it enumerates.

---

## 3. `V-29-47-06` — the CI workflow's description of the gates it runs

**Status after round 7: CLOSED by this plan, task 2.** Recorded here because the closure is this
register's own sibling task and its evidence belongs in the round's record rather than only in a
SUMMARY.

- **Direction: informational.** The gates run correctly; only the workflow's description of them was
  false. Same class as `V-29-47-01` and as round 5's WR-03 — a record of a mechanism, left behind by
  the mechanism.
- **Why the address matters.** `.github/workflows/ci.yml` is not markdown, so it is outside **every**
  markdown scan by construction, and it is not covered by a `BANNED_CLAIM_EXCLUDED_LOCATIONS` prefix
  either. Nothing in this tree reads it for drift. It was byte-unchanged across the whole of round 6
  (`git diff --name-only f718069..HEAD -- .github/` → no output) **and across the whole of round 7 up
  to this plan** (`git diff --name-only 29f61e0..HEAD -- .github/` → 0 files), while both gates it
  describes changed twice.
- **The count had rotted TWICE at one address.** The banned-claim comment said `82` documents. Round 6
  moved the corpus to 115. Round 7 moved it to 117. A third typed value would be stale on the next
  widening, so the remedy applied is the one plan 29-46 established and this plan's own prohibition
  requires: **delete the number, or name the thing that holds it.** The after-form names
  `BANNED_CLAIM_SCAN_COUNT` and its module and types no cardinality at all.
- **The control-byte comment** described the NUL-only scope the gate outgrew in round 6. The after-form
  states the class the module decides, matching the module's own header statement.
- **Live count before: 2** stale scope statements at 2 addresses in 1 file. **Live count after: 0**,
  with `grep` for a hand-written corpus cardinality in the workflow returning 0.

Both comment blocks are quoted before and after, with the diff's non-comment changed-line count, in
`29-55-SUMMARY.md`.

---

## 4. The residuals opened by round 7 — measured, named, directed, counted, LEFT OPEN

Each is escalated by the plan that found it, appended to `.planning/WINDOWS.md`, and **re-measured here
on the final tree.** None is fixed by this plan.

### 4.1 `V-29-49-01` — the one-read invariant has no behavioural witness this harness can construct

- **OPENED THIS ROUND** (plan 29-49). **Direction: informational, fail-CLOSED.** The fix is in place and
  correct; the shear is unreachable by arithmetic in the shipped code. What is missing is a case that
  could watch it fail.
- **The measurement, and it is the interesting part.** The exemption document is a **derived** member of
  the kit part. On a mirror where the document is made unreadable, the kit part derives **99** members
  rather than 100 — **the document leaves the scan set the instant it stops being a readable file.** So
  on every input the harness can produce, either both reads return the same bytes or the loop never
  asks. **Behavioural reach of the invariant assertion: 0 inputs.**
- **What ships instead:** a source-shape case, mutation-proven twice — on the conjunct and on the
  substitution — with its reach stated in its own comment rather than implied.
- **LIVE COUNT: 0** shear instances; **0** constructible witnesses.
- **Remedy:** either a harness that can make the two reads disagree (an injected read hook, or a part
  carrying the exempt path as a *named literal* rather than deriving it), or an explicit decision that
  the source-shape case is the intended permanent guard. Not resolved in-round because either option
  changes a scan part or the harness's construction.

### 4.2 `V-29-50-01` — the unmeasured-external-assertion CLASS stays OPEN

- **OPENED THIS ROUND** (plan 29-50) as a numbered id; the class itself is round 6's `29-45 R4`.
- **Class statement:** nothing in this repository detects a prose assertion about an **external tool's**
  behaviour that was never measured. The mechanism that would catch it does not exist.
- **Direction: informational.** No fail-open in the shipped gate — the **code** was right at every one
  of the false sites. The harm is entirely to the reader, and specifically to the future editor
  deciding whether a field is still needed.
- **LIVE COUNT: 0 instances, class UNBOUNDED.** Ten classifier-related statements enumerated; four
  false, four corrected; six measured-true. **Three of the live sites were named by no review** —
  including one that is the same sentence WR-03 was written about, in a file WR-03 pointed at, at a
  different address.
- **Why no mechanism was built, deliberately:** a detector for "an unmeasured assertion about an
  external tool" is a heuristic over an open class, which is the shape this milestone exists to refuse.
  **Round 7 corrected a fifth, sixth and seventh instance and created nothing that would find an
  eighth.** That is stated plainly rather than left as an implication.

### 4.3 `V-29-50-02` — the gitlink arm is exercised through an errno, not through a submodule

- **OPENED THIS ROUND** (plan 29-50). **Direction: informational, fail-CLOSED.**
- **The reduced reach, stated plainly:** the permanent case calls the scan with an **ordinary
  directory**. `readFileSync` raises the identical `EISDIR` for that and for an initialised submodule
  gitlink, so the arm's *logic* is fully witnessed — but the claim that an initialised submodule
  presents this way is a claim about git's checkout layout and **is witnessed by no fixture here.**
  This repository has no submodules, which is exactly why the defect survived a round.
- **LIVE COUNT: 0** gitlinks in the tree; **1** unwitnessed premise.
- **Remedy:** build the submodule fixture and assert the errno first-hand, or record an explicit
  decision that the errno equivalence is the intended permanent guard.

### 4.4 `V-29-51-01` — a scope-blind, module-wide alias closure in the LANG-07 owner classifier

- **OPENED THIS ROUND** (plan 29-51). **Direction: false-positive / guard noise. No fail-open** — the
  guard reds rather than passes. The harm is that correct code in an unrelated function reds a LANG-07
  pin for a reason with nothing to do with section extents, **which trains a reader to edit the pin.**
- **Mechanism, measured.** `recogniserNamesIn` seeds its name set from real heading recognisers and
  grows it transitively: a declaration joins if its right-hand side matches `\bNAME\b` for any name
  already in the set. The set is **module-wide and scope-blind**, so two functions' locals share one
  namespace, and the alias test is a **text** match, so a single-letter name matches inside a regex
  character class.
- **Reproduction.** Adding a function with locals named `a` and `b` took the derived name set for
  `scripts/audit-model.ts` from **26 to 44**: `\ba\b` matches inside `[a-z_]` in
  `CLAIM_META_RE = /^-\s+([a-z_]+):\s*(.*)$/`, so a `- key: value` metadata recogniser entered the
  derived "heading recogniser" set and an unrelated line became a second applied site. Verified
  directly: `new RegExp("\\ba\\b").test("/^-\\s+([a-z_]+):\\s*(.*)$/;")` → `true`.
- **LIVE COUNT: 0** today; **the classifier is UNFIXED.** The two locals were renamed and the derived
  set returned to 43 with the pin back at one site. **It will do this again to the next plan that
  writes a one-letter local**, and that sentence is the residual, not the rename.
- **Remedy:** make the alias closure **function-scoped**, or require the aliased name to appear as an
  **identifier** rather than as text. Either is structural; every candidate narrowing considered (a
  minimum name length, excluding regex-literal right-hand sides) is a heuristic.

### 4.5 `V-29-51-02` — the registry's advisory `line` field disagrees with reality, re-measured

- **OPENED THIS ROUND** (plan 29-51). **Direction: informational.** No gate consults the field;
  `check-claim-anchors` reports positions from the anchor's actual index, and the registry documents in
  its own prose that the value is advisory. Nothing fails open.
- **RE-MEASURED ON THE FINAL TREE through the anchored-block authority** (`readRegistry` +
  `scanAnchoredDocument` + `anchoredBlockAt`), not transcribed:

  ```
  registry rows total:                          46
  rows whose document carries their anchor:     45
  rows without a locatable anchor:               1   [C-28-038, .claude-plugin/plugin.json]
  DISAGREEING line fields:                      19 of 45
  ```

- **The numerator is unchanged from plan 29-51's `19`; the DENOMINATOR moved 41 → 45**, because 29-52
  added four anchored rows whose `line` fields are correct (they were authored this round). Recording
  the ratio without re-taking the denominator would have published a shrinking problem as a growing
  one, or vice versa. **Both numbers are given.**
- **A DISAGREEMENT with plan 29-51's own published range, recorded rather than reconciled.** 29-51 wrote
  *"three of the four `agent-factory/writing-profile.md` rows are wrong by 62–80 lines."* Re-measured
  here: **80, 80 and 82**. The cause is legitimate and identified — 29-52 inserted anchors and content
  into `agent-factory/writing-profile.md` after 29-51 took its measurement, moving those blocks down.
  The register publishes the re-taken values.
- **Full detail:** 18 of 19 disagree in the same direction (declared **earlier** than measured); drift
  runs 2 to 82 lines; one row (`C-28-022`) disagrees in **length** rather than position (declared
  `8-11`, measured `8-13`).
- **`C-28-038` carries no locatable anchor at all**, because `.claude-plugin/plugin.json` is JSON and
  carries no anchor comment. The review noted this file is *accidentally* partly covered by a presence
  check. It is now genuinely covered for banned claims by 29-53's sixth part — but its **registry row
  still has no anchor**, so the byte-freeze does not reach it. Named here so that is a fact somebody
  wrote down.
- **Not corrected, deliberately.** The field is unenforced by a documented decision, and repairing a
  trace surface in the same pass that measures it destroys the measurement.

### 4.6 `V-29-53-01`, `V-29-53-02`, `V-29-53-03` — the three declared remainders of the class widening

| id | statement | direction | live count, re-measured | remedy |
|---|---|---|---|---|
| `V-29-53-01` | The canonical-form assertion on the shipped manifests fires on **any** decoded string whose bytes differ from the raw text, including a legitimately escaped non-ASCII character. A formatter run with `ensure_ascii` would red the gate on correct content. | fail-CLOSED | **0** refusals on the live manifests — neither file contains a backslash (re-checked at HEAD) | Documented in the refusal's own remedy text (*"write the string LITERALLY"*). If a shipped manifest ever legitimately needs an escape, the answer is a named exemption with a reason, never a weaker assertion. |
| `V-29-53-02` | The gate's effective walk bound is **2 ×** `MAX_WALK_ENTRIES`, not 1 ×, because the imported public-docs corpus derivation carries its own budget at that module's import time. IN-03's remainder. | acknowledged, declared | **1** budget object in this module (`grep -a -c '{ examined: 0 }'` → 1); **2 ×** effective | Collapsing to a single allowance requires the corpus derivation to accept an injected budget — a cross-module change. |
| `V-29-53-03` | `.claude/settings.local.json` is **untracked**, so the widened denominator does not reach it. It carries `asd-ste100.org` inside a WebFetch permission. | out of scope | **1**; confirmed untracked at HEAD (`git ls-files --error-unmatch` → `did not match any file(s) known to git`) | The denominator's subject is what this repository **versions**. An untracked local settings file is not a class anyone must disposition. |

### 4.7 The full roll-up, in BOTH directions — every `V-` marker in the tree

A roll-up listing only what survived cannot be reconciled against the previous round's list, so **every
`V-` marker present in this tree** is listed with its status after round 7 — closures, subsumptions,
narrowings and untouched items included.

**The marker set was DERIVED, not taken from round 6's table.** That distinction produced a finding:

```
$ grep -rhoaE 'V-29-[0-9]{2}-[0-9]{2}' --include='*.md' --include='*.ts' --include='*.js' \
       --include='*.json' --include='*.yml' . | sort -u | wc -l
35
```

**35 markers exist in the tree. Round 6's roll-up (§4 plus §8.4) listed 18.** The 17 it did not list are
named below rather than left to a reader's subtraction — 9 of them predate round 6 entirely and appear
only inside their own producing SUMMARYs, and 8 are round 7's own.

```
35 markers in the tree  ==  18 listed by round 6  +  9 never rolled up by any round  +  8 opened by round 7
```

#### 4.7a Markers round 6 listed — status after round 7

| id | residual | status after round 7 | live count (re-measured on the final tree) | where |
|---|---|---|---|---|
| `V-29-26-01` | setext headings are invisible to the one section-extent authority | **carried, unchanged** — fail-open | 0 | `docs/audit/29-locator-unification.md` §6 |
| `V-29-26-02` | non-recursive directory reads narrow the derived scans below what their names claim | **carried, unchanged** — subject untouched by round 7 | live, unquantified this round | `29-locator-unification.md` §6 |
| `V-29-26-03` | `FENCE_DELIMITER_LINE` is a prefix test, not an equality | **carried, unchanged** — fail-open | 0 | §6 of that record |
| `V-29-26-04` | indented fence delimiters are classified as governed prose | **carried, unchanged** — fail-closed only by the accident that the indented delimiters pair up | **4** — re-measured: `grep -a -c -E '^[[:space:]]+```' README.md` → 4 | §6 of that record |
| `V-29-29-01` | the duplicated `sectionBody` — a third section-extent grammar | **closed in round 4** (plan 29-35) | — | `29-locator-unification.md` §9.3b |
| `V-29-32-01` | a closed-fence, count-preserving swallow of the banned-claim exemption region | **SUBSUMED by D-54's content bound** (plan 29-52), walked on its own route: exit 0 at `5ecf203` with every cardinality re-pinned, exit 1 at HEAD naming `writing-profile.md:297:21` and `:297:69` — and **not** via the extent pin. **NARROWED REMAINDER: a swallow carrying no banned claim is still green**, asserted as a permanent case rather than as a paragraph | 0 live | `29-52-SUMMARY.md` task 3 route 3 |
| `V-29-35-01` | a private `parseFrontmatter` beside the exported authority | **closed in round 5** (plan 29-40); **regression-checked this round on a NEW basis** — the old one-spelling grep was proven inadequate (§6.2a) | 0 | `29-54-SUMMARY.md` |
| `V-29-42-01` | a claim split across a hard wrap escapes the co-occurrence window | **closed by construction in round 6** | 0, no subject | `29-round6-residuals.md` §3.7 |
| `V-29-42-02` | a markdown table row puts two cells on one physical line | **closed by construction in round 6**; its false-positive SURFACE migrated into `V-29-44-01` | 0 | §3.7, §3.1 of that record |
| `V-29-42-03` | the exempt document's own description of this gate is behind the source's | **closed in round 6**; **its in-source RECORD, which was `V-29-47-01`, is now DELETED** (plan 29-49) | 0 | §3.8 of that record; §1.3 IN-04 above |
| `V-29-42-04` | a marker inside an HTML comment or a link target satisfies co-occurrence | **closed by construction in round 6**; same migration caveat | 0 | §3.7, §3.1 of that record |
| `V-29-42-05` | **an id that was never opened.** Round 5's verification proposed opening it for the verb-marker enumeration; round 6 declined, on the ground that an id against a deleted mechanism reads as a live residual with a permanently zero count | **NOT OPENED — superseded, by a recorded decision.** Present in this tree only as a citation in three documents | n/a — no such id exists | `29-round6-residuals.md` §8.2 |
| `V-29-44-01` | the widened bare terms are a false-red surface over the whole of ordinary English | **carried, unchanged** — fail-CLOSED. Untouched by round 7; D-54 left the matcher byte-identical, so this reach is exactly what round 6 measured | **0** live over the corpus (`0 findings over 117/117 elements`) | `29-round6-residuals.md` §3.1; source at the two members' declarations |
| `V-29-47-01` | the in-source record of `V-29-42-03` is false on five counts (six, per IN-04) and byte-unchanged all round | **CLOSED BY DELETION** (plan 29-49), and **sequenced first**, ahead of any exemption work, which is what IN-04 asked for | **0** — `grep -a -c 'pinned pair'` → 0; `grep -a -c 'V-29-42-03'` → 0, both in `scripts/check-banned-claims.ts` | §1.3 IN-04 |
| `V-29-47-02` | the sole carve-out is unbounded at the bottom; `endBefore === lines.length` | **SUBSUMED by D-54's content bound, NOT pinned.** The bottom edge is unchanged and deliberately so; what changed is that bytes arriving past it are not inside a frozen anchored block, so a banned claim written there reds by name — exit 0 at `5ecf203`, exit 1 at HEAD naming `writing-profile.md:301:21` and `:301:69`. **NARROWED REMAINDER: an append carrying no banned claim still moves nothing this gate can see** | 0 live | `29-52-SUMMARY.md` task 3 route 1 |
| `V-29-47-03` | the region's POSITION is pinned by nothing; a rigid translation moves it silently | **SUBSUMED by D-54's content bound, NOT pinned.** A content bound is invariant under translation by construction — the anchors travel with the body, so the frozen set travels with it: exit 0 at `5ecf203` with the extent unmoved at 66, exit 1 at HEAD naming `writing-profile.md:240:21` and `:240:69`. **NARROWED REMAINDER: a translation carrying no banned claim is still invisible, and the region's START INDEX is still pinned by nothing** | 0 live | `29-52-SUMMARY.md` task 3 route 2 |
| `V-29-47-04` | the surviving enumeration: a claim in words the list does not contain PASSES | **CARRIED, UNCHANGED — and re-demonstrated on the final tree in TWO positions** (§2.7), including inside the region on an un-frozen line. **This is the round's honest close** | **22** pinned literals across 3 groups; **0** live occurrences; **2** demonstrated bypass positions | §2.7, §7.2 |
| `V-29-47-05` | `LANG-04` marked **Complete** against the round-5 verifier's explicit verdict | **CLOSED** (plan 29-48, under `29-VERIFICATION-round6.md`'s named authority). Re-measured at HEAD: `LANG-04` reads `[ ]` / `Gaps Found` at `:82` / `:183`; `LANG-07` reads `[x]` / `Complete` at `:85` / `:186` | **0** — was 2 (one wrongly Complete, one wrongly Gaps Found) | §7.3; `29-48-SUMMARY.md` |
| `V-29-47-06` | the CI workflow describes both widened gates at their pre-widening scope | **CLOSED by this plan, task 2** | **0** — was 2 stale statements at 2 addresses in 1 file | §3 |

#### 4.7b Markers present in the tree that NO round has rolled up — named rather than left to a subtraction

These nine exist only inside their producing SUMMARYs. They were never carried into a residual register
by round 4, 5 or 6. **Round 7 does not adopt them, close them or re-measure them** — that would be a
plan widening its own scope on the strength of its own finding, which this phase escalates rather than
acts on. They are **named here so the next round can decide**, which is the whole reason the marker set
was derived rather than transcribed.

| id | subject | producing artifact | status |
|---|---|---|---|
| `V-29-29-02` | floor item 6's residue — a bound carried out of its block by a boolean flag or a closure-captured mutable, or a terminator beyond `TERMINATOR_WINDOW` | `29-29-SUMMARY.md` | **never rolled up**; recorded there as "not counted (needs data-flow analysis)" |
| `V-29-29-03` | floor item 3's residue — a bound expressed through a helper the scan does not follow | `29-29-SUMMARY.md` | **never rolled up**; "not counted (needs a call graph)" |
| `V-29-29-04` | the duplicate-assertion tripwire cannot see a duplicated MULTI-LINE `expect(` | `29-29-SUMMARY.md` | **never rolled up**; disclosed miss, 1069 of 5281 classified lines |
| `V-29-29-05` | round 3's review published 453 multi-line openers under a rule it did not publish; the reconstructed rule answers 473 on the same bytes | `29-29-SUMMARY.md` | **never rolled up**; a difference between two rules, not a defect |
| `V-29-30-01` | which claims are SAFETY claims is an editorial classification nothing derives; both roster constants are measurement baselines | `29-30-SUMMARY.md` | **never rolled up**; fails closed |
| `V-29-30-02` | `publicDocsScan()` consumed without its own cardinality pin inside equality four | `29-30-SUMMARY.md` | **never rolled up**; fail-open only in the ADD direction |
| `V-29-30-03` | the consumer's refusal cannot NAME the file that left the arm | `29-30-SUMMARY.md` | **never rolled up**; disclosed in the message itself |
| `V-29-30-04` | a safety claim rehomed to a file both vouched and already in the roster's home set preserves the arm's FILE set | `29-30-SUMMARY.md` | **never rolled up**; 0 constructible in that pass's 8-shape battery |
| `V-29-42-05` | listed at §4.7a — an id proposed and deliberately **not opened** | round-5 review / verification | **not a residual**; carried here so the citation is not mistaken for one |

**That nine measured findings carried `V-` ids into a SUMMARY and were then never rolled up by any of
three residual registers is itself a finding**, and it is the direct product of building this round's
roll-up from a `grep` over the tree rather than from the previous round's table. It is recorded, not
acted on.

#### 4.7c Markers opened by round 7

`V-29-49-01`, `V-29-50-01`, `V-29-50-02`, `V-29-51-01`, `V-29-51-02`, `V-29-53-01`, `V-29-53-02`,
`V-29-53-03` — **eight**, each measured at §4.1–§4.6, each in `.planning/WINDOWS.md`.

#### 4.7d Residuals carried from SUMMARYs, not `V-`-numbered

| id | residual | status after round 7 | live count, re-measured |
|---|---|---|---|
| 29-44 **R1** | 30 disposition rows can never match, because their `file` cell is a code span and `rowMatches()` compares with no backtick stripping | **carried, open** — fail-CLOSED | **30**, re-derived: 1534 rows read under `## Dispositions` across `docs/audit/29-style-dispositions/`, 30 code-span `file` cells, all in `29-12.md` |
| 29-43 **R2** | `CHANGELOG.md:67` still reads `sharper-per-token` — outside `BANNED_CLAIM_LITERALS`, so the gate does not flag it | **carried, unmoved** — fail-open. **This is `V-29-47-04` with a live instance**, and it is the one place in this tree where the surviving enumeration is not merely reachable but occupied | **1**, re-confirmed at HEAD: `grep -a -n 'sharper-per-token' CHANGELOG.md` → line 67 |
| 29-45 **R4** | nothing catches an unmeasured assertion about an EXTERNAL tool's behaviour | **carried, class OPEN** — now numbered as `V-29-50-01`; three further instances corrected this round, no mechanism created | 0 instances; class unbounded |
| 29-46 **R1** | the acceptance grep `0*15` is a substring pattern, not a cardinality predicate | **carried** — fail-CLOSED | **0** |
| 29-46 **R2** | nothing reds if two workflows declare the same `order` | **CLOSED — mechanism** (plan 29-54): a named refusal in `scripts/generate-catalog.ts` fires **before the sort**, names both colliding files and the shared value, and refuses to write. The asserting comment is **deleted, not corrected** | **19** workflows, **19** declaring exactly one `order`, **19** distinct values, **0** duplicates — re-derived here from the frontmatter authority |
| 29-53 R1–R3 | see `V-29-53-01`/`-02`/`-03` at §4.6 | numbered and carried | measured at §4.6 |

### 4.8 The net movement, stated plainly rather than as progress

**Moved this round: six.** `V-29-47-01` (closed by deletion), `V-29-47-05` (closed by correction),
`V-29-47-06` (closed by this plan), and `V-29-47-02`, `V-29-47-03`, `V-29-32-01` (all three **subsumed**
by one change, D-54's content bound). Plus the un-numbered `29-46 R2`, closed by mechanism.

**Opened this round: eight.** `V-29-49-01`, `V-29-50-01`, `V-29-50-02`, `V-29-51-01`, `V-29-51-02`,
`V-29-53-01`, `V-29-53-02`, `V-29-53-03`.

**Net on the `V-` register: +2.** The honest reading is narrower than either number sounds, and in two
directions:

- **Three of the six movements are ONE change wearing three ids.** `V-29-47-02`, `-03` and `V-29-32-01`
  are all subsumed by D-54's content bound, and **all three are subsumed rather than pinned** — each
  keeps a stated remainder (§7.2 item 2). Counting them as three closures would be a silent drop
  wearing three ticks.
- **What genuinely closed is the FAIL-OPEN half.** Both blockers that made LANG-04 fail were fail-open
  and both are shown red by name. **Of the eight items opened, none is fail-open** — six are
  informational or fail-closed, one is guard noise, one is a declared remainder. A round that opens
  eight residuals and none of them fail open has spent its looking on accuracy rather than on safety
  surface, which is a different thing from having found nothing.
- **And the one fail-open that matters was neither opened nor closed.** `V-29-47-04` is carried
  unchanged and re-demonstrated in a **new** position this round (§2.7, T-in) — inside the region, on an
  un-frozen line, which is a position that did not exist before D-54 created the frozen/un-frozen split.
  The residual did not grow; the map of it did.

Round 6's own movement was −1 and it asked the next round to read that as the output of having looked.
Round 7's is +2 and asks for the same reading, with one addition: **9 of the 35 markers in this tree had
never been rolled up by anybody** (§4.7b), and that was invisible to every round that built its roll-up
from its predecessor's table.

---

## 5. The D-48 / D-53 mechanism change, stated against the decision rather than beside it

D-48 concluded, and D-53 extended, that *"every axis a bare term can be paired against is an open class;
the only bounded thing in this design is the one named exemption region, and a region is POSITIONAL."*
Round 7 bound the carve-out's **bytes** to the claim registry. That is a mechanism change to a safety
carve-out, and a mechanism change inferred from a reconciliation argument is exactly the shape this
phase has spent seven rounds learning to refuse — so it was **ratified by the user as its own numbered
decision, D-54**, at a blocking checkpoint in wave 20, before plan 29-52 wrote a line.

### 5.1 What changed

Inside `BANNED_CLAIM_EXEMPT_REGION`, a line lifts the prohibition only if it **also** sits inside a
registry-anchored block of `docs/audit/28-claim-registry.md` whose bytes are byte-identical to the row
that names them. Suppression is a conjunction. The carve-out is bounded in **position and in content**.

### 5.2 What did NOT change, stated so a later reader cannot mistake this for a licence

- **The matcher is byte-unchanged.** No lexical axis returned: no verb list, no subject list, no
  co-occurrence window, no conditional field on `BannedClaimLiteral`. Asserted, not argued —
  `requiresOnSameLine` greps 0 across source, twin and tests; the literal list and the literal type are
  byte-unchanged across the round.
- **D-48's three forbidden weakenings stay forbidden**: no fenced-block skip, no whole-word-only match,
  no below-a-marker skip.
- **The region is still positional.** It is still a file, a section and a reason. A line **outside** the
  region is still never exempt. D-53's deletion of the conditional mechanism is not partially undone to
  make a denial writable.
- **No digest is taken over the whole exemption document.** A frozen digest over a document authors
  legitimately edit is a false-red generator, not a pin. The frozen surface is the **union of
  registry-anchored blocks and nothing else** — 22 of the region's 66 lines. The other 44 are freely
  editable **and are scanned.**

### 5.3 Why this is reconcilable with D-48's anti-drift reasoning rather than a repeat of it

D-48 refused the reviewer's subject-side pin because it would have been a **third hand-authored list**
over an open class. The exempt-anchor set here **is not a list at all**: it is *derived* from the
registry rows naming the exemption document whose anchor index falls inside the located region, and its
cardinality is asserted two-sided so a row silently added or dropped reds by name. An empty derived set
inside a located region is a **named refusal** rather than a silently total or silently empty exemption.

The set-literal check is mechanical, not rhetorical: `grep -cE '"C-28-[0-9]{3}"'` in the gate returns
**0**. The set-literal drift this repository names as its second systemic failure class does not appear
inside the fix for the first one.

### 5.4 The alternative that was NOT taken, with the reason, so nobody rediscovers it as unconsidered

**The per-group composition pin** — declaring `{standard-name: 8, token-economy: 2, comprehension: 4}`
beside the total and refusing a divergence. It is the reviewer's own cheaper fix and the reviewer said
so honestly: *"This raises the cost of the substitution from one line to a same-group substitution,
which is a strictly smaller class. It does not close it."*

**It is REFUSED as the closure and ADMITTED as a secondary measure**, and it ships with its own
limitation written in the source beside it, quoted verbatim from a live refusal at §2.3:

> This pin is a SECONDARY measure: it reduces the substitution class from any-group to same-group and
> does **NOT** close CR-01 — a same-group swap moves neither this number nor the total, which is why
> the frozen-block conjunction exists.

**That sentence in the gate's own output is the mechanism that stops the next reader from mistaking the
cheaper measure for the closure.** A refusal that explains what it does not prove is this round's
addition to the idiom.

### 5.5 The standing cost, accepted with the decision

After D-54, **every edit to a denial sentence inside the exemption region is a two-file change under
D-04** — the prose and its registry row, in the same commit, with no override tier and no
record-it-later. Registry ids are contiguity-checked, so the id space spent here is not freely
reusable. **Rated one-way**: the pre-freeze editing posture cannot be restored without deciding again
which sentences were frozen at the time each edit was judged. That is recorded as a cost, not as a
benefit.

---

## 6. The arithmetic — three equalities, both sides shown

### 6.1 Finding coverage

Stated in full at §1.4. `12 == 10 + 2 + 0 + 0 + 0 + 0`. ✓

### 6.2 Probe coverage

**Three probe rows surfaced for this round's scope.** Each is named with its location; none is
auto-resolved, auto-dismissed or marked `backstop`.

```
3 probe rows surfaced  ==  2 authored into must_haves.truths  +  1 carried as a flagged assumption

authored (2):
  · LANG-04 `empty`    — authored into plan 29-52's truths; enforced in code as the named refusal for a
                         located region containing ZERO anchored blocks, plus the two-sided
                         cardinality pin. Exercised live at §2.4.
  · LANG-04 `encoding` — authored into plan 29-53's truths; enforced as the manifest canonical-form
                         refusal (and, on the absent-directory axis, the derivation refusal plus the
                         per-part vacuity floor).

flagged (1):
  · LANG-07 `unclassified` — "unclassified — review manually". Carried forward UNRESOLVED by plan
                         29-48 as an explicit flagged assumption, never auto-dismissed. Plan 29-54
                         ANSWERED the assumption from the tree and the answer is recorded at §6.2a —
                         but answering an assumption is not resolving the probe row, and the row
                         stays `unresolved` by rule.
```

**Equality: 2 + 1 = 3 surfaced.** ✓

**Derivation source, labelled.** No round-7 plan carries a `probe_coverage` block
(`grep -c probe_coverage` over `29-48-PLAN.md` … `29-55-PLAN.md` → 0 for all). The three rows above are
the ones this round's plans and SUMMARYs name explicitly, cross-checked between `29-48-SUMMARY.md`'s
equality statement and `29-53-SUMMARY.md`'s. `.planning/phases/29-.../COVERAGE.md` remains the API
coverage file and carries no probe rows; it cannot produce this arithmetic and is not used as if it
could.

#### 6.2a What plan 29-54 found when it answered the flagged assumption — a check that was green and uninformative

The assumption — *round 7 leaves LANG-07's mechanism alone* — **HELD**. But **the evidence previously
used to check it did not.** The two rounds before this one checked LANG-07's regression with:

```
$ grep -c "function parseFrontmatter" scripts/generate-catalog.ts   →  0
```

That tests **one spelling**, and plan 29-54 proved in session that it returns `0` on a tree carrying the
deleted grammar's exact shape under the name `parseFm`. **The previous two rounds' green on this row was
correct about the tree and uninformative about the property.** The check is now four derived markers,
each RED-proven.

**The remaining reach, named because it is narrow:** that task tested exactly **one** module.
`scripts/frontmatter.ts` has other consumers, none were examined, and the new permanent case says
nothing whatever about them.

### 6.3 Class coverage over the widened denominator

29-53 widened the coverage denominator from `git ls-files '*.md'` to markdown **plus** JSON, in both
directions. Re-derived here on the final tree:

```
tracked *.md   : 1364          (uncovered: 0)
tracked *.json :   38
tracked total  : 1402

classes surfaced  ==  classes admitted  +  classes excluded by name

JSON side:   38  ==  2 admitted  +  36 excluded by name

  ADMITTED (2):
    .claude-plugin/marketplace.json          — sixth derived part `pluginManifests`
    .claude-plugin/plugin.json               — sixth derived part `pluginManifests`

  EXCLUDED BY NAME (36), by class:
    scripts/**                         19    already covered by a segment class
    .planning/**                        9    already covered by a segment class
    package.json, package-lock.json,
      tsconfig.json, tsconfig.tests.json 4   toolchain manifests
    .gemini/settings.json, hooks/hooks.json  2   tool configuration
    agent-factory/config/factory.config.json,
      agent-factory/seed/.grugops/factory.config.json  2   kit configuration data
                                       ---
                                        36
```

**Equality: 2 + 36 = 38 = tracked JSON.** ✓ Both sides floored above zero. Markdown side: 1364 tracked,
0 uncovered. ✓

**Round 6's denominator could not have surfaced this class no matter how many markdown classes it
dispositioned** — which is why "the denominator IS the finding" is the transferable sentence and not
"two files were missed".

**A disagreement with `29-53-SUMMARY.md`'s published enumeration is recorded at §8.3, row 4.** The
aggregate numbers that equality rests on are correct in that SUMMARY; two narrative cells are each one
short.

---

## 7. The honest close

**A green suite is not proof for a safety invariant in this repository.** That is not modesty; it is
this phase's measured record, and round 7 extended it by nine — see §2.1.

### 7.1 What round 7 CAN honestly claim

- **Both blockers that failed LANG-04 at HEAD are closed, and both are shown red BY NAME on the final
  tree, against a "before" column taken on the same binary the two independent reproductions used**
  (§2.3, §2.4, §2.5). The base gate hashes to `6f0722fa…b385ba`, the hash both round-6 documents record.
- **The sole carve-out is now bounded in position AND in content**, by a **derived** anchor set rather
  than a list, with a two-sided cardinality pin and a named refusal for an empty set — the empty-set arm
  exercised live at §2.4 rather than only in its own case.
- **The gate's class boundary is a decision somebody wrote down**, in both directions, over markdown
  **and** JSON, with a published equality (§6.3) and a `scan ⊆ tracked` direction that did not exist
  before.
- **All twelve of round 6's findings are answered by name** (§1), four of them beyond the finding as
  written, and one of them by **refusing the review's own suggested fix with a measurement** that showed
  it would delete 13 shipped documents from a safety scan.
- **Every one of the round's own escalations carries an id, a live count, a direction and a remedy**, is
  in `.planning/WINDOWS.md`, and is re-measured here rather than carried (§4).
- **Zero new fail-open residuals were opened.** All eight residuals round 7 opened are informational,
  fail-closed, guard-noise or declared-remainder. That is stated as a measurement of §4, not as a mood.

### 7.2 What round 7 does **NOT** claim

**Term membership first, because a round that closes two blockers by binding a carve-out is the round
most likely to be read as having closed the class.**

1. **THE SURVIVING ENUMERATION IS `BANNED_CLAIM_LITERALS` ITSELF — 22 pinned literals across 3 groups,
   direction FAIL-OPEN — and a conformance, token-economy or comprehension claim written in words that
   list does not contain STILL PASSES THIS GATE, inside the exemption region and outside it.**

   **Live count: 22 pinned literals; 0 live occurrences of an unlisted claim in the corpus today; 2
   demonstrated bypass positions.** Demonstrated on the final tree at §2.7, not asserted: the same
   sentence passes at exit 0, with the planted file never named, both **outside** the region and
   **inside** the region on one of the 44 un-frozen lines, with `suppresses 14` and `reaches 66`
   unmoved in the second case.

   **This is `V-29-47-04`, carried unchanged. It is the whole of the fail-open direction on this axis
   and D-54 does not touch it.** The content bound governs which lines are **exempt**; the matcher
   governs which sentences are **banned**, and the matcher enumerates. **The list of WHAT IS BANNED is
   the prohibition's own subject and cannot be derived away** — a prohibition with nothing enumerated
   forbids nothing. Adding to it is an act of deciding one more thing is forbidden, and each addition
   needs its own measured false-red cost. **What must never happen is a new list of WAYS OF SAYING IT.**

2. **That the three subsumed residuals were PINNED. They were SUBSUMED, and each has a stated
   remainder.** `V-29-47-02` (the region unbounded at the bottom), `V-29-47-03` (the region's position
   pinned by nothing) and `V-29-32-01` (a closed-fence count-preserving swallow) are each closed **for
   claim-bearing bytes** by the content bound, walked on their own routes under the re-pin protocol.
   **Each narrowed remainder survives:** an append, a translation or a swallow carrying **no** banned
   claim is still invisible to this gate, and **the region's start index is still pinned by nothing.**
   The bottom edge is unchanged and deliberately so. See §4.7a.

3. **That `V-29-51-01` was fixed. It was worked around.** Two locals were renamed and the derived name
   set returned to 43. **The classifier is unfixed and will do this again to the next plan that writes a
   one-letter local.**

4. **That the unmeasured-external-assertion class is closed.** `V-29-50-01`: round 7 corrected a fifth,
   sixth and seventh instance and **created nothing that would find an eighth.** Three of the live sites
   were named by no review.

5. **That the one-read invariant and the gitlink arm are witnessed.** `V-29-49-01`: the one-read
   invariant has **0 constructible behavioural witnesses** in this harness and ships as a source-shape
   case. `V-29-50-02`: the EISDIR arm is exercised through an ordinary directory, and the claim that an
   initialised submodule presents that way is witnessed by no fixture in this repository.

6. **That the LANG-07 evidence base is broad.** The regression check moved from one spelling to four
   derived markers — **and it covers exactly one module.** `scripts/frontmatter.ts`'s other consumers
   were not examined.

7. **That `check-nul-bytes` participated in the mirror adjudications.** It is **indeterminate** on a
   `git archive` harness and is counted as such (§2.6), not as a green.

8. **That the residuals in §4 are closed.** They are **open, named, counted and directional.** This file
   records what was decided; it does not claim nothing remains.

### 7.3 Requirements

**No requirement is marked by this record and none by the plan that wrote it.**
`git diff --numstat .planning/REQUIREMENTS.md` reports **no change** for plan 29-55, and this plan's
SUMMARY carries an empty `requirements-completed:`.

**`LANG-04`'s verdict belongs to round 7's verifier and is not claimed here.** This register records
evidence — including the two bypasses now red by name and the surviving fail-open that is not closed —
and makes no determination.

The one requirement state that **did** move this round moved under a named published authority:
`LANG-07` from `[ ]` / `Gaps Found` to `[x]` / `Complete` by plan 29-48, transcribing
`29-VERIFICATION-round6.md`'s two-row disposition table with its line reference, with
`requirements-completed: []` so the automated marker was given nothing to act on. `LANG-04` reads
`[ ]` / `Gaps Found` on the final tree — re-measured: `.planning/REQUIREMENTS.md:82` and `:183`.
`V-29-47-05` is closed by that correction (§4.7a).

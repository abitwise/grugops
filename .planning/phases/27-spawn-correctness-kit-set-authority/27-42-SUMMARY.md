---
phase: 27-spawn-correctness-kit-set-authority
plan: 42
subsystem: kit-model-and-guards
tags: [kit-authority, gate-claims, set-literal-drift, gap-closure-round-7]
status: complete
requires:
  - phase: 27-41
    provides: the rebuilt committed .js twins and a freshness-clean tree, consumed as landed
  - phase: 27-37
    provides: the nine-key plugin-manifest component schema and its bucket partition, inherited unchanged
provides:
  - "scripts/kit-model.ts partitionPluginComponentClaims() — the partition floor as a PURE function of four key-lists, so all three arms are falsifiable from a case"
  - "scripts/kit-model.ts SpawnGrantScanLister and PluginComponentCoveredElsewhere.coverer as the FUNCTION, resolved by object identity"
  - "scripts/kit-model.ts PLUGIN_COMPONENT_COVERED_ELSEWHERE_COUNT and PLUGIN_COMPONENT_EXEMPT_COUNT — two-sided, enforced by the GATE"
  - "scripts/check-foundation-guards.ts guardKitCounts — four separate coverer facts checked (resolves / equality performed / prefix is one of the key's probe dirs / composition non-empty), PASS-line label derived from the resolution"
  - "scripts/frontmatter.test.ts the derived grammar-site set over every tracked .ts, and the measured guard-import-closure shape"
affects:
  - "guard_kit_counts — its PASS line's covered-elsewhere clause changed shape (label now derived); every other banner byte-identical"
  - "no runtime behaviour anywhere else: all four gates exit 0 with baseline-identical banners"
tech-stack:
  added: []
  patterns:
    - "extract a floor's predicate into a pure function so an arm unreachable in production is still falsifiable from a case, and prove the extraction faithful by comparing against an INLINE RESTATEMENT rather than a frozen baseline literal"
    - "hold the FUNCTION, not its name; resolve by object identity; derive the printed label from the resolution"
    - "scope a claim AND derive its scope by pattern, recording what the pattern recognises and what it misses"
key-files:
  created: []
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
decisions:
  - "D-50 implemented: IN-03, IN-04 and IN-05 all closed in round 7, each with an explicit disposition; none deferred, none silently dropped"
  - "D-49 honoured: every RED was captured against the COMMITTED .js on a hermetic `git archive HEAD` mirror; the behaviour-preserving half is proven by a byte-identical gate transcript, not asserted"
  - "The byte-identical PASS-line control is a comparison against an INLINE RESTATEMENT of the predicate, not against a frozen baseline literal — a literal would go red on the next legitimate kit-count change and be 'fixed' until it passed (executor deviation, reason recorded)"
  - "The plan's `verification: backstop` premise that both out-of-scope parsers sit outside every guard's import graph is DISPROVEN by measurement: context-io.ts is reached from check-foundation-guards.ts via check-uat-oracles.ts (executor finding)"
requirements-completed: [KIT-02, KIT-03]
coverage:
  - deliverable: "The partition floor's third arm is falsifiable, and the extraction is proven faithful"
    verification:
      - kind: test
        ref: "scripts/kit-model.test.ts#a claim set with a HOLE fires the unclaimed arm by name"
        status: pass
      - kind: test
        ref: "scripts/check-foundation-guards.test.ts#the extracted partition predicate is byte-faithful to an inline restatement of it — ALL THREE ARMS FIRING"
        status: pass
      - kind: command
        ref: "diff of the whole gate transcript, git archive HEAD mirror before vs after — byte-identical, exit 0 both sides"
        status: pass
    human_judgment: false
  - deliverable: "The coverer is the lister function, resolved by object identity, with the printed label derived from the resolution"
    verification:
      - kind: test
        ref: "scripts/check-foundation-guards.test.ts#guard_kit_counts fails red when a scratch build's coverer is a DISTINCT function carrying the same printed name"
        status: pass
      - kind: test
        ref: "scripts/kit-model.test.ts#`skills` is excluded by a STATED RULE naming its coverer, and `hooks` is exempt by name with a reason and a bound"
        status: pass
      - kind: command
        ref: "hermetic mirror, lister renamed everywhere with only the coverer string left behind — committed build exit 0 printing the stale claim; rebuilt build's label FOLLOWS the rename"
        status: pass
    human_judgment: false
  - deliverable: "Both bucket cardinalities are enforced two-sided by the gate"
    verification:
      - kind: test
        ref: "scripts/check-foundation-guards.test.ts#guard_kit_counts fails red when a scratch build ADDS a second exemption — the bucket's own recorded promote trigger"
        status: pass
      - kind: test
        ref: "scripts/check-foundation-guards.test.ts#guard_kit_counts fails red when a scratch build EMPTIES the covered-elsewhere bucket (zero direction)"
        status: pass
    human_judgment: false
  - deliverable: "The one-grammar claim states its scope, and the scope is derived by a pattern scan a third grammar breaks"
    verification:
      - kind: test
        ref: "scripts/frontmatter.test.ts#D-50 IN-05 — the set of tracked .ts files carrying a LOCAL frontmatter-parsing construct is exactly the two named non-guard files"
        status: pass
      - kind: test
        ref: "scripts/frontmatter.test.ts#D-50 IN-05 — a THIRD local frontmatter grammar makes that set fail, by name"
        status: pass
      - kind: command
        ref: "two one-shot live-tree plants (scripts/ and install/), each reverted, each making the assertion fail NAMING the planted file"
        status: pass
    human_judgment: false
  - deliverable: "The pattern scan's reach is a floor against plausible third-grammar shapes, not a proof that none can exist"
    human_judgment: true
    rationale: "What the recognizer MISSES (a regex assembled from fragments or `new RegExp`, a line-scanning delimiter search, a non-colon key separator, a grammar in another language) is recorded in the case and below, but no assertion can bound the set of shapes a future grammar might take — a human reading a new parser must still recognise it as one."
metrics:
  duration: ~50 min
  completed: 2026-08-08
actuals:
  tokens: 25000
  tasks: 3
  commits: 4
---

# Phase 27 Plan 42: Three Claim-Accuracy Findings Get Their Assertions Summary

Closed the round-6 Info trio — **IN-03** (a three-arm partition of which only two arms could
ever fire), **IN-04** (a coverage relationship whose named coverer nothing resolved), and
**IN-05** (a tree-wide one-grammar claim that is true only when scoped) — with the same
correction each time: **the gate, or the source, stated something it did not check, and now
it checks it.** None of the three was a live bypass and none is presented as one.

Commits: `4392f9e` (Task 1), `d283f74` (Task 2), `6e3d900` + `09a371e` (Task 3).
Every RED was captured against the **committed `.js`** on a hermetic `git archive HEAD`
mirror; every GREEN against the **rebuilt committed `.js`**. Never against the TypeScript.

---

## Task 1 — the partition floor's third arm (commit `4392f9e`)

### The byte-identical control, both transcripts, both exit codes

Baseline captured on a `git archive HEAD` mirror of `bf25f02` **before any edit**:

```
EXIT=0
  PASS  kit counts: derived 17 roles, 19 workflows, 7 skill adapters and 7 plugin-form skill
        adapters (expected 17 / 19 / 7 / 7); the spawn-grant scan composition holds exactly 33
        members (agent 17 + skill 7 + plugin-skill 7 + packaging 2), each part set-equal to its
        own lister; the plugin-manifest component schema carries 9 entries partitioned into
        7 forbidden + 1 covered-elsewhere (skills by listPluginSkillAdapters) + 1 exempt by
        name (hooks)
```

After transcript, from the rebuilt committed `.js` on a fresh mirror of the post-edit tree:

| comparison | result |
|---|---|
| the `kit counts:` PASS line | **byte-identical** — `md5 fb444efd41660ae0d66a69343fd48d2e` on both sides |
| exit code | **0 on both sides** |
| **the WHOLE gate transcript** | **byte-identical** — `diff` of the two full runs is empty |

The whole-transcript identity is stronger than the plan asked for and is reported as measured.

**The partition failure MESSAGE is byte-unchanged.** `git diff scripts/check-foundation-guards.ts`
restricted to that template literal produces **no `+`/`-` line at all** — the call site
destructures the function's result back into `unclaimedKeys` / `doubleClaimedKeys` /
`foreignKeys`, so the literal's interpolations are unchanged too, not only its static text.

### The extracted predicate, and its purity

`partitionPluginComponentClaims(schemaKeys, forbiddenKeys, coveredKeys, exemptKeys)` is the
guard's former inline computation moved verbatim, **including each arm's report order** (the
schema's order for the first two, the claim order for the third), because the failure message
interpolates those arrays.

Purity is **asserted, not claimed**: the case source-inspects
`partitionPluginComponentClaims.toString()` — the compiled function that actually runs — for
`readdirSync`, `readFileSync`, `statSync`, `existsSync`, `realpathSync`, `process.`,
`import.meta`, `PLUGIN_MANIFEST_COMPONENT_SCHEMA`, `PLUGIN_COMPONENT_COVERED_ELSEWHERE`,
`PLUGIN_COMPONENT_EXEMPT`, `pluginForbiddenComponentKeys` and `DEFAULT_KIT_ROOT`. None appears.
Every case argument is hand-written and references no derivation.

### The three arms, each falsified from a hand-built claim set

| case | claim set | arm fired | result |
|---|---|---|---|
| live values | the real schema + the three real claim lists | none | `{unclaimed: [], doubleClaimed: [], foreign: []}` |
| **the hole** | schema `[agents, commands, skills, hooks]`, forbidden `[agents]`, covered `[skills]`, exempt `[hooks]` | **unclaimed** | `["commands"]` — **the arm production cannot reach, exercised for the first time** |
| the double claim | `hooks` in BOTH covered and exempt | doubleClaimed | `["hooks"]` |
| the foreign key | exempt claims `themes` (a probe DIRECTORY, not a manifest key) | foreign | `["themes"]` |

**Permutation invariance**, on a deliberately non-vacuous baseline
(`doubleClaimed ["mcpServers"]`, `foreign ["themes"]`): reverse, rotate and sort applied to all
four input lists leave the sorted verdict unchanged. The case states precisely **what is not
invariant and why** — arm ORDER follows the input order by construction, because the guard's
message is read in schema order — so a later reader does not "fix" the wrong half.

### Honest refinement of the finding as the reviewer framed it

The reviewer's IN-03 says the unclaimed arm is *unfalsifiable by construction*. Measured while
reading the code: the arm was **already exercised at gate level** by an existing case
(`guard_kit_counts fails red when a scratch build leaves one schema member in NO bucket`), which
mutates the compiled `pluginForbiddenComponentKeys` to drop `outputStyles`. What was genuinely
missing is a case that reaches the arm **without mutating a build** — which is what the pure
function buys, and what makes the arm testable by anyone reading `kit-model.test.ts` rather than
only by someone who knows the scratch harness exists.

### The faithfulness control, and why it is NOT a frozen baseline literal

Two permanent controls build a scratch guard in which the **call** to the extracted predicate is
replaced by an **inline restatement** written in the case in a deliberately different idiom
(`indexOf` / `reduce` rather than `includes` / `filter().length`), and compare the two builds'
output byte for byte:

| control | tree | result |
|---|---|---|
| PASSING tree | clean mirror | both exit 0, full output byte-identical |
| **ALL THREE ARMS FIRING** | one kit-model mutation firing unclaimed (`outputStyles`), double-claimed (`hooks`) and foreign (`scratchForeign`) at once | both non-zero, full output byte-identical, all three arms named in both |

**Each arm's formula proven individually load-bearing** by breaking the restatement one arm at a
time and observing the FIRING control go red:

| restatement broken | firing control |
|---|---|
| `unclaimedKeys` → `[]` | **FAILS** |
| `doubleClaimedKeys` → `[]` | **FAILS** |
| `foreignKeys` → `[]` | **FAILS** |

(The PASSING control alone stays green under all three, which is exactly why the firing half
exists.) `scratchGuardFiles` generalizes the existing scratch harness to mutate several compiled
files in one build, keeping its mutation-applied floor for every one.

---

## Task 2 — the coverer, and both bucket cardinalities (commit `d283f74`)

### The DISCARDED probe, recorded rather than quietly replaced

**Probe A1 — the naive rename** (`listPluginSkillAdapters` → `…V2` in `scripts/kit-model.js`
only):

```
A1_EXIT=1
SyntaxError: The requested module './kit-model.js' does not provide an export named
'listPluginSkillAdapters'
    at #asyncInstantiate (node:internal/modules/esm/module_job:302:21)
```

**This proves nothing about the coverer.** The gate never ran; there is no gate output at all.
It is the wrong-reason failure the plan's W4 warning names, and it is recorded rather than
swapped out in silence. **Reshaped** per the plan's own option: rename the lister **everywhere**
in the scratch build so identity is preserved and every importer still resolves, then restore
**only the coverer STRING** to the old name.

### RED, against the committed build — **exit 0, with the clause still printing**

**Probe A2** — no function named `listPluginSkillAdapters` exists anywhere in the build
(`grep 'function listPluginSkillAdapters\|export .*listPluginSkillAdapters'` → *(none)*):

```
A2_EXIT=0
== Result ==
ALL CHECKS PASSED
covered-elsewhere (skills by listPluginSkillAdapters)
```

**Probe A3** — the coverer string names a function that never existed:

```
A3_EXIT=0
== Result ==
ALL CHECKS PASSED
covered-elsewhere (skills by aFunctionThatNeverExisted)
```

Both satisfy the discriminating requirement: **exit code and coverage clause in the same
transcript, at exit 0, with `ALL CHECKS PASSED`.**

### RED, the cardinality half

| probe | committed gate | what it printed |
|---|---|---|
| **B1** exempt bucket EMPTIED | exit **1** — but `guard_kit_counts` **PASSED**, printing `… + 0 exempt by name ()`. The single failure was `WR-05 coordinator-spawn-grant violation` (the `hooks/` probe), a **different fact about a different surface** | the vacuous zero, from a passing count guard |
| **B2** a SECOND exemption — the bucket's own recorded promote trigger | **exit 0, ALL CHECKS PASSED** | `… + 2 exempt by name (outputStyles, hooks)` |
| **B3** a SECOND covered-elsewhere entry | **exit 0, ALL CHECKS PASSED** | `… + 2 covered-elsewhere (outputStyles by scratchCoverer, skills by listPluginSkillAdapters)` |

B1 is reported as it measured, not as the plan predicted: the count checks passed at the
guard level while the overall gate went red elsewhere. **B2 and B3 are the clean exit-0 REDs**,
and B2 is precisely the trigger the module records in source.

### GREEN, against the rebuilt committed `.js`, on fresh mirrors

| probe | exit | the named finding |
|---|---|---|
| **G-A2** lister renamed everywhere, identity intact | **0** | `covered-elsewhere (skills by the plugin-skill part's lister listPluginSkillAdaptersV2, 7 member(s) of it in the scan)` — **the label FOLLOWS the rename** |
| **G-A3** coverer resolves to no part (`() => []`) | **1** | *the covered-elsewhere bucket claims `skills` is already covered, but its coverer is NOT one of the listers the spawn-grant scan is composed from (agent, skill, plugin-skill, packaging)* |
| **G-A4** a DISTINCT function with the SAME printed name | **1** | *Resolution is by FUNCTION IDENTITY, never by name: two distinct functions can share a printed label…* |
| **G-B1** exempt EMPTIED | **1** | *the exempt-by-name bucket holds 0 entr(ies), expected exactly 1* |
| **G-B2** a SECOND exemption | **1** | *the exempt-by-name bucket holds 2 entr(ies), expected exactly 1 (derived: outputStyles, hooks)* |
| **G-B3** a SECOND covered-elsewhere entry | **1** | *the covered-elsewhere bucket holds 2 entr(ies), expected exactly 1 (derived: outputStyles, skills)* |
| **G-B4** covered-elsewhere EMPTIED | **1** | *the covered-elsewhere bucket holds 0 entr(ies), expected exactly 1* |
| **G-CTRL** unmodified control mirror | **0** | `ALL CHECKS PASSED` |

Both counts are therefore two-sided: **zero fails, two fails, one passes** — matching all six
sibling counts.

### The PASS clause, before and after, with the derived tokens identified

Before:

```
+ 1 covered-elsewhere (skills by listPluginSkillAdapters) + 1 exempt by name (hooks)
```

After:

```
+ 1 covered-elsewhere (skills by the plugin-skill part's lister listPluginSkillAdapters,
  7 member(s) of it in the scan) + 1 exempt by name (hooks)
```

| token | source after this plan |
|---|---|
| `plugin-skill` | `part.name` — read off the object the identity resolution returned |
| `listPluginSkillAdapters` | `part.list.name` — the resolved FUNCTION's own name, so it cannot name a different function |
| `7` | `SPAWN_GRANT_SCAN.filter(f => f.startsWith(part.prefix)).length` — a measured count, not a claim |

The G-A2 transcript is the proof that the label is derived: rename the lister and the printed
name moves with it.

### `grep -n 'coverer' scripts/kit-model.ts scripts/check-foundation-guards.ts`

**No string-typed declaration and no free-text interpolation survives.** The only remaining
occurrences are:

- `kit-model.ts:280, :285, :288, :309, :310, :342, :905` — prose (the block comment recording
  what the field was and why the reference replaced it, and the doc comment on the field);
- `kit-model.ts:313` — `readonly coverer: SpawnGrantScanLister;` (the FUNCTION type);
- `kit-model.ts:321` — `coverer: listPluginSkillAdapters,` (the function reference);
- `check-foundation-guards.ts:1526` — `SPAWN_GRANT_SCAN_PARTS.find((p) => p.list === covered.coverer)`
  (the identity resolution);
- `check-foundation-guards.ts:1504, :1508, :1528, :1544, :1568` — prose and failure-message text.

The old `${c.manifestKey} by ${c.coverer}` interpolation in the PASS line is **gone**.

### FOUND BY RED-TEAM, NAMED BY NO PLAN AND NO REVIEW: resolving is not covering THIS key

The plan asked for `resolves` and `covers` to be checked separately. Red-teaming the draft
surfaced a third gap it did not name: a coverer could resolve to a **real** part that scans a
**different surface**. `{ manifestKey: "commands", coverer: listPluginSkillAdapters }` resolves
cleanly, its part's equality is performed and its prefix has members — so every check the plan
specified passes, while `commands/` leaves the forbidden set on coverage that scans `skills/`.

Closed by requiring the resolved part's **prefix to be one of the probe directories the SCHEMA
gives that manifest key**, pinned by
`guard_kit_counts fails red when a coverer resolves to a REAL part that scans a DIFFERENT surface`.

So `guardKitCounts` now checks **four** separate facts per covered-elsewhere entry:

1. it **resolves**, by `p.list === coverer` — object identity, never name equality;
2. that part's per-part **set equality was actually PERFORMED** this run (a lister that throws
   routes to the D-47 item 1 catch and `continue`s — a coverage claim resting on a check that
   did not happen is the same fact, one consumer further on). Pinned by a case that replaces the
   lister with a throwing stub;
3. the resolved part's **prefix is one of that key's probe directories** (the red-team finding);
4. the composition holds **at least one member** under that prefix — an empty set is trivially
   "all scanned", and that vacuous pass is what the bucket exists to make impossible.

`SPAWN_GRANT_SCAN_PARTS`' listers are additionally asserted **pairwise distinct** (derived,
counted), because the resolution uses `find` and would otherwise be ambiguous.

---

## Task 3 — the one-grammar claim's scope (commits `6e3d900`, `09a371e`)

### The counter-evidence, as a transcript, exactly as a reader checking the claim would find it

```
scripts/generate-catalog.ts:50   function parseFrontmatter(text: string): Record<string, string> {
scripts/generate-catalog.ts:51     const m = text.match(/^---\n([\s\S]*?)\n---\n/);  // fence at byte 0
scripts/generate-catalog.ts:55     const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);

scripts/context-io.ts:187   // Extends the flat key:value idiom from generate-catalog.ts with one
                            // addition: a `refs:` YAML list block
scripts/context-io.ts:252     const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
scripts/context-io.ts:283     const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
```

Against the claim at `scripts/frontmatter.ts:22-23` and `:1855`. Confirmed by reading:
`generate-catalog.ts`'s parser has **no folding, no quoting, no fence stripping and no failure
arm**, and its only output is `docs/catalog/README.md`.

### The corrected claim, quoted beside the assertion it cites

Header, `scripts/frontmatter.ts`:

> THE SCOPE THAT CLAIM HOLDS OVER, STATED RATHER THAN LEFT TO BE CHECKED WITH `grep` (plan
> 27-42, D-50, closing IN-05). The claim is: **EXACTLY ONE GRAMMAR ON EVERY SURFACE A GUARD
> READS.** It is not a claim about every `.ts` file in the tree, and a reader who checks it that
> way finds two others: […] **NEITHER FEEDS A SPAWN-GRANT GUARD**, so this is a CLAIM-ACCURACY
> correction and **NOT a security finding** — a later reader must not escalate it into one. What
> makes the scope mechanical rather than a promise is the derived assertion `D-50 IN-05 — the
> set of tracked .ts files carrying a LOCAL frontmatter-parsing construct is exactly the two
> named non-guard files` in scripts/frontmatter.test.ts […]

The text-level wrappers' claim was **narrowed only as far as it overreached** — from *"so there
is still exactly ONE grammar"* to *"so THESE WRAPPERS ADD NO SECOND GRAMMAR: they answer from
the value this module's one parser produced"* — and deliberately **not** widened into a second
copy of the header's scoped claim.

### The recorded do-not-migrate decision, in source

> Migrating generate-catalog.ts onto this module would change what a byte-frozen generated
> artifact contains, drag catalog-freshness.ts into a parser change, and buy nothing on any
> guard surface — while the scoped-and-asserted claim buys the same protection […] at a fraction
> of the blast radius. A later phase that wants the migration starts from a claim that is
> already mechanically true.

### The derived grammar-site set

| fact | value |
|---|---|
| corpus | every **tracked `.ts`** (`git ls-files '*.ts'`), non-vacuity asserted: `> 10` files, and `scripts/frontmatter.ts` present |
| exclusions, each by name with its reason | `frontmatter.ts` (it IS the authority) and `*.test.ts` (a case's independently-restated predicate is an INPUT to the authority, and no guard imports a `.test.ts`) |
| derived set, **sorted** | `["scripts/context-io.ts", "scripts/generate-catalog.ts"]` |
| **cardinality, pinned as a number** | **2** |
| independence | neither imports `./frontmatter.js`; `frontmatter.ts` imports nothing relative at all |

### The scratch-third-grammar failure, three times

| plant | where | result |
|---|---|---|
| permanent case, temp dir | the two real files copied + `scratch-third-grammar.ts` | control first (`["context-io.ts","generate-catalog.ts"]`), then **3 sites, naming the plant** |
| one-shot live tree, reverted | `scripts/zz-scratch-third-grammar.ts` | `AssertionError: … + "zz-scratch-third-grammar.ts"` |
| one-shot live tree, reverted | `install/zz-scratch-third-grammar.ts` | `AssertionError: … + "install/zz-scratch-third-grammar.ts"` |

**The `install/` plant is why the scan was widened** (commit `09a371e`, red-team finding): scoped
to `scripts/` as first written, a third grammar landing in `install/` or `hooks/` — both of which
ship TypeScript — would have passed. The live case and the planted case now go through **one**
classifier rather than two spellings of it. `git status` after each plant confirms the tree clean.

### THE PLAN'S OWN `verification: backstop` PREMISE, MEASURED AND HALF DISPROVEN

The plan carried, as an `UNKNOWN - verify` backstop:

> `generate-catalog.ts` and `context-io.ts` are outside the import graph of every guard that
> reads a spawn grant, so the scoped one-grammar claim is true as written after this plan.

Measured, by deriving the consumer set (every non-test `scripts/*.ts` importing
`./frontmatter.js` → `check-foundation-guards.ts`, `coordinator-resolution-precheck.ts`,
`generate-role-adapters.ts`) and walking its transitive relative-import closure (10 files):

| file | in the closure? |
|---|---|
| `generate-catalog.ts` | **NO** — outside every one of them |
| `context-io.ts` | **YES** — `check-foundation-guards.ts -> check-uat-oracles.ts -> context-io.ts` |

**The premise is false for half its subject, and saying so is the point of marking it
`UNKNOWN - verify`.** It does not make the scoped claim false and it is **not** oversold as a
bypass: `context-io.ts`'s flat grammar parses a **different document class** (`.grugops/context/`
notes, with their own documented format) and is never asked about a member of the spawn-grant
scan. That is precisely why the corrected header claim is about the **predicate** — *"what does
this file's frontmatter SAY"* — and not about which files happen to share a process. The measured
shape is now **asserted in both directions**, so `generate-catalog.ts` entering a guard's closure
fails red.

### Four gates, baseline versus after

| gate | baseline exit | after exit | banner |
|---|---|---|---|
| `check-foundation-guards.js` | 0 | 0 | `ALL CHECKS PASSED` — **identical** |
| `coordinator-resolution-precheck.js` | 0 | 0 | `PRECONDITIONS HOLD: …` — **identical** |
| `check-kit-refs.js` | 0 | 0 | `ALL CHECKS PASSED` — **identical** |
| `VALIDATE_KIT_ROOT=. validate-agent-factory.js` | 0 | 0 | `ALL CHECKS PASSED` — **identical** |

`git diff scripts/frontmatter.js`: **30 insertions, 1 deletion, every changed line a comment
line** — verified by filtering the diff for non-comment `+`/`-` lines, which yields nothing.

---

## Which sets this plan touched, and what each one is

| set | disposition |
|---|---|
| `PLUGIN_COMPONENT_COVERED_ELSEWHERE` | membership **unchanged** (still one entry, `skills`); its `coverer` moved from a string to a function REFERENCE; now pinned by a **cardinality number** in the gate |
| `PLUGIN_COMPONENT_EXEMPT` | membership **unchanged** (still `hooks`); now pinned by a **cardinality number** in the gate |
| `PLUGIN_COMPONENT_COVERED_ELSEWHERE_COUNT`, `PLUGIN_COMPONENT_EXEMPT_COUNT` | **cardinality numbers** — the shape D-20 permits, not the enumeration class it forbids |
| `SPAWN_GRANT_SCAN_PARTS` | membership **untouched**; only its `list` field's TYPE was named (`SpawnGrantScanLister`), so the lister signature is stated once |
| the partition function's four inputs | **all derived at the call site** — the schema mapped, the forbidden set computed, the two buckets mapped |
| the grammar-site set | **derived by pattern** over `git ls-files '*.ts'`, sorted, cardinality pinned |
| the frontmatter-consumer set and its import closure | **derived** by scanning imports; the guard set is not named |
| the parts' listers being pairwise distinct | **derived and counted** (`new Set(...).size === length`) |

**Two things in this plan are hand-written and are named as such rather than claimed away:**

1. `HEAD_DELIMITER_CONSTRUCTS` / `KEY_LINE_CONSTRUCTS` — these are a **recognizer rule**, not an
   enumeration of the answer. The answer is derived by applying them to a derived corpus, and
   what the rule misses is recorded in the case. A rule that produces a set is not the drift
   class; a list that IS the set is.
2. `["scripts/context-io.ts", "scripts/generate-catalog.ts"]` — the **expected value of an
   assertion**, which is the thing being pinned, not a scan set any consumer reads. Its
   cardinality is pinned beside it.

No new hand-maintained set literal was introduced that any consumer reads as truth.

---

## Deviations from Plan

### 1. [Rule 1 — the plan's control shape would have rotted] The byte-identical PASS-line control compares against an INLINE RESTATEMENT, not a frozen baseline literal

- **Found during:** Task 1, writing the permanent control.
- **Issue:** the plan asks the suite to *"capture the gate's `kit counts:` line from a hermetic
  run and assert it matches the baseline recorded at the top of this task"*. That baseline
  contains `17 / 19 / 7 / 7 / 33 / 9`. Frozen as a literal, the case goes red the next time the
  kit legitimately gains a role and gets "fixed" by updating the literal — the
  narrow-until-it-passes shape `27-41` explicitly recorded as the reason its own before/after
  value map stayed a one-shot transcript.
- **Resolution:** the byte-identical before/after evidence is a **one-shot transcript** in this
  summary (its before-image is a build that stopped existing when Task 1 landed). The
  **permanent** control compares the committed build against a scratch build whose call to the
  predicate is replaced by an independent inline restatement — both reading the same tree in the
  same run, so it survives every legitimate count change and can only fail when the two
  formulations disagree. Strengthened beyond the plan by running it with **all three arms
  firing** and by proving each arm's formula individually load-bearing.

### 2. [Rule 2 — found by red-team, named by no plan and no review] Resolving is not covering THIS key

- **Found during:** Task 2, red-teaming the draft.
- **Issue:** the plan specified `resolves` and `covers` as two facts. A coverer resolving to a
  **real** part that scans a **different** surface passes both — `{ manifestKey: "commands",
  coverer: listPluginSkillAdapters }` resolves, its equality is performed, its prefix has
  members — while excluding `commands/` from the forbidden set on coverage that scans `skills/`.
- **Fix:** the resolved part's prefix must be one of the probe directories the SCHEMA gives that
  manifest key. Pinned by a case. Also strengthened: the "covers" fact is checked as *that
  part's set equality was actually PERFORMED this run*, which is strictly stronger than
  re-asserting a subset the per-part loop already asserts as an equality — a weaker duplicate of
  an existing check is the shape this repository deletes.

### 3. [Rule 2 — found by red-team] The grammar-site scan was scoped to `scripts/` and would have missed `install/`

- **Found during:** Task 3, red-teaming after the first commit.
- **Issue:** the plan says *"the set of `scripts/*.ts` files"*. `install/` and `hooks/` ship
  TypeScript; a third grammar landing there would have passed.
- **Fix:** commit `09a371e` — the corpus is every tracked `.ts`, the classifier is one pure rule
  applied to both the live and the planted corpus, and the corpus is asserted non-empty and to
  contain this module. Proven by a live-tree plant under `install/`, reverted.

### 4. [Rule 1 — the plan's own premise was wrong] The `verification: backstop` import-graph claim is half false

- **Found during:** Task 3, measuring rather than assuming.
- **Issue:** the plan asserted both out-of-scope parsers sit outside every spawn-grant guard's
  import graph. `context-io.ts` does not: `check-foundation-guards.ts -> check-uat-oracles.ts ->
  context-io.ts`.
- **Resolution:** the corrected header claim is written about the **predicate and the document
  class** rather than the import graph, and the measured shape is asserted in both directions.
  Recorded above in full rather than quietly routed around.

### 5. [Executor judgement] The tracer feedback gate was closed by re-running `<verify>`, not by a human checkpoint

- Task 1 is `type="tracer"` and auto mode is off (`workflow.auto_advance` and
  `_auto_chain_active` both `false`), which would normally mean an interactive
  `checkpoint:human-verify` before any expansion task. The plan declares `autonomous: true` and
  carries no checkpoint task. The gate was closed the autonomous way instead — the tracer's exact
  `<verify>` re-run end to end (build, freshness, both test files, the gate) at exit 0 — rather
  than halting a declared-autonomous plan to have a human eyeball a byte-identical gate line.

**Total deviations:** 5 — 1 control-shape correction, 3 red-team findings closed inline, 1
executor judgement. **Impact:** every one of them makes an assertion stronger or a claim more
accurate than the plan specified; none weakens a check or defers work.

---

## Residuals, recorded rather than dropped

1. **`part.list.name` degrades if a part's `list` becomes an inline arrow.** The PASS line would
   then read `the list part's lister list`. It can never name a **different** function — the
   name is read off the resolved object — so it fails toward uselessness, never toward a lie.
   **Disposition: record, do not fix.**
2. **A manifest key with MULTIPLE probe directories, covered by a part matching only one.** The
   prefix check uses `some`, so the other probe directory would go unclaimed. Only `skills`
   (one probe dir) is covered today; the two `experimental.` keys carry two each and are
   forbidden, not covered. **Disposition: record — the state is unreachable today and the fix
   would be a bound on a bucket with one member.**
3. **The grammar-site recognizer's misses**, stated in the case and here: a regex assembled from
   concatenated fragments or a `new RegExp(...)` string; a delimiter found by scanning lines
   rather than anchoring at byte 0; a key separator other than `:`; a grammar written in a
   language this scan does not read. It is a floor against plausible shapes, not a proof.
   **Disposition: record — this is the `human_judgment: true` row in the coverage block.**
4. **`context-io.ts` runs inside `check-foundation-guards.js`** through the UAT oracles. Its
   grammar parses a different document class and is never asked about a spawn-grant scan member.
   **Disposition: record and assert the measured shape** (done), do not migrate.

---

## Verification

| check | result |
|---|---|
| `npm run build && npm run freshness` | exit 0 — 32 committed `.js` match a fresh rebuild |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1182 passed / 2 skipped**, 35 files (`27-41` left 1162; +20 cases) |
| `node scripts/check-foundation-guards.js` | exit 0 — `ALL CHECKS PASSED`; **KIT-03 verdict unchanged** |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 — banner identical to baseline |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| live kit intact | 17 agent adapters, 7 standalone skills, 7 plugin skills; `SPAWN_GRANT_SCAN` = 33; schema = 9 entries, 7 forbidden + 1 covered + 1 exempt |
| `git diff package.json` | **byte-unchanged** |
| `git status --porcelain` | clean; both live-tree plants reverted and verified gone |
| every transcript | run against the committed `.js`, never the TypeScript source |

**The suite floor is a floor, not evidence.** It has been green in every one of the six rounds
of this phase in which a defect was later found, and in all three prior waves of THIS round the
executor's own first draft was wrong in a way the suite could not see — as it was here three
more times (deviations 2, 3 and 4). The evidence is the RED transcripts above at **exit 0 with
the false claim still printing**, the eight GREEN transcripts each with its named finding, the
byte-identical whole-gate diff, the three-way arm-breaking of the faithfulness control, and the
two live-tree grammar plants.

## Known Stubs

None.

## Self-Check: PASSED

- `scripts/kit-model.ts`, `scripts/kit-model.js`, `scripts/kit-model.test.ts`,
  `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`,
  `scripts/check-foundation-guards.test.ts`, `scripts/frontmatter.ts`, `scripts/frontmatter.js`,
  `scripts/frontmatter.test.ts` — all present and modified.
- Commits `4392f9e`, `d283f74`, `6e3d900`, `09a371e` — all present in `git log`.
- The safety-relevant claims were verified adversarially, not by a green suite: every closing
  case was RED against the committed `.js` on a hermetic `git archive HEAD` mirror before its
  fix and GREEN after; the faithfulness control was individually broken on each of the three
  arms and observed to fail; the grammar-site assertion was made to fail by two live-tree plants
  in two different directories; and red-teaming the executor's own draft produced three findings
  (a coverer resolving to the wrong surface, a scan scoped too narrowly, and a plan premise that
  measurement disproved) that no plan and no review had named.

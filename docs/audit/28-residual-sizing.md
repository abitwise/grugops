# Phase 28 — Residual Sizing and Pin Re-measurement

**Produced by:** plan 28-02 (wave 2 of phase 28, kit consistency audit)
**Date:** 2026-08-11
**Purpose:** three things this phase must not guess at — what the third-party pins actually are,
how big the two unsized fail-safe residuals are, and whether plan 28-08's adversarial round is owed.

Every number in this document was produced by a command run in the session that wrote it. Nothing
here is inherited from `.planning/ROADMAP.md`, from `.planning/research/STACK.md`, or from a prior
measurement. Where a measurement diverges from a pre-named target, **the measurement wins and the
divergence is stated** rather than reconciled away.

---

## AUDIT-04 pin re-measurement (D-23)

AUDIT-04 requires versions *"verified at the time of change and recorded rather than assumed."*
`.planning/ROADMAP.md:428` then pre-names `1.62.0` and `4.12.1`, measured **2026-07-28**. Pinning
those numbers because the roadmap says so *is* the assumption the requirement forbids, so D-23
requires re-measurement at execution time. This section is that measurement.

### Commands and verbatim transcripts

Run 2026-08-11 at 14:57:35Z, on darwin 25.5.0, node v24.12.0, npm 11.7.0.

```
$ npm show @playwright/test version
1.62.1
```
- **stdout:** `1.62.1`
- **stderr:** empty (0 bytes)
- **exit status:** `0`

```
$ npm show @axe-core/playwright version
4.12.1
```
- **stdout:** `4.12.1`
- **stderr:** empty (0 bytes)
- **exit status:** `0`

Both commands are registry **metadata queries**. Nothing was installed, no `package.json`
dependency block was touched, and no lockfile changed.

### Comparison against the roadmap's pre-named targets

| Package | On disk before | Roadmap pre-named (measured 2026-07-28) | **Measured 2026-08-11** | Match? |
|---|---|---|---|---|
| `@playwright/test` | `1.60.0` | `1.62.0` | **`1.62.1`** | **NO — diverges** |
| `@axe-core/playwright` | `4.11.3` | `4.12.1` | **`4.12.1`** | yes |

**Finding F-28-A (against the roadmap's pre-named target).** `@playwright/test` has shipped a patch
release since the 2026-07-28 measurement. The roadmap's `1.62.0` is **stale by one patch version**.
Per D-23 the measured value wins: the checklists are pinned to **`1.62.1`**, not `1.62.0`, and
`.planning/ROADMAP.md:428`'s success criterion should be read as satisfied by the measurement rather
than by the literal it names. This is precisely the outcome D-23 anticipated, and it is the reason
the requirement asks for a measurement instead of a target: fourteen days was enough for the
pre-named number to go wrong.

Note that **both** pins moved, because neither roadmap number had ever been applied — the tree
carried `1.60.0` and `4.11.3`, two and one releases behind the 2026-07-28 measurement respectively.

### The three sites, after the edit

Exactly 3 version-carrying sites across exactly 2 files.

| File | Line | Package | Was | Now |
|---|---|---|---|---|
| `agent-factory/checklists/playwright-visual-regression-recipe.md` | 17 | `@playwright/test` | `1.60.0` | `1.62.1` |
| `agent-factory/checklists/playwright-visual-regression-recipe.md` | 19 | `@axe-core/playwright` | `4.11.3` | `4.12.1` |
| `agent-factory/checklists/accessibility-checklist.md` | 20 | `@axe-core/playwright` | `4.11.3` | `4.12.1` |

Every literal now present at those sites appears verbatim in the transcript above. Each site also
gained the date the version was verified, so a reader of the shipped checklist can judge the pin's
age without opening a planning document.

The other `@playwright/test` and `@axe-core/playwright` mentions in those two files are **import
statements** and one bare `npm install -D @playwright/test @axe-core/playwright` line. None carries
a version and none was edited.

### What was deliberately NOT added

**No live freshness gate.** A re-runnable check over these pins would go red the day upstream ships
`1.62.2` — which is not a defect. Training maintainers to ignore a red gate is the failure mode this
milestone has spent itself fighting, and it is a strictly worse outcome than a pin with a visible
verification date. D-23 says so explicitly; this records that it was a decision, not an omission.

### Offline fallback (not taken)

Had `npm show` failed for network reasons, D-23's fallback is `UNKNOWN - verify` in place of the
version, the error output recorded, and the checklist pins left **unchanged**. The roadmap's numbers,
a `package-lock.json` entry, and a recollection are all explicitly excluded as substitutes:
fabricating a version into a document grugops ships to every user is the same act class as faking a
passing gate. Both commands exited `0`, so the fallback was not reached.

---

## Residual 1 — Phase-22 WR-03 usability false-positive (D-19 item 1)

### What it is

A **faithful** context note — one that parses, carries a valid `id`, and would be admitted — is
**loudly refused** if its prose body contains a line whose leading token is an `id:`-shaped key.
The note is not silently dropped; it is routed to `trailingMalformed`, surfaced through the
unparseable channel, and `checkCarveOut` exits 1 naming the file. It fails in the SAFE direction.
The cost is usability: a note that legitimately *quotes* a frontmatter line — which any note
discussing this repository's own note format will do — cannot be stored.

### Where it lives, by file and line

| Thing | Location |
|---|---|
| Module | `scripts/context-io.ts` (committed twin `scripts/context-io.js`) |
| Function | `splitNotes`, exported at line 391 |
| Mechanism | the fail-closure trigger described at lines 431-440: a `---`-shaped line is a boundary whenever it opens a *note-open attempt*, and a candidate region carrying an `id:`-looking line anywhere in its frontmatter run that does **not** cleanly parse is refused |
| Consumer | `scripts/compactor.ts` `checkCarveOut` (line 237) via `splitNotes` at line 190; the refusal is routed at lines 199-206 |
| Source of record | `.planning/milestones/v2.0-phases/22-.../22-VERIFICATION.md:140` (Deferred #1) |

### Reproduction — succeeded

Driven against the **committed** `scripts/context-io.js`, never the `.ts`.

```
BODY carries a column-0 `id:` line
   parseNote(whole) -> parsed: ["scalars","refs","body","duplicateKeys","malformedLines"]
   splitNotes -> notes=0  trailingMalformed=NON-NULL (182B)
   verdict: REFUSED (fail-CLOSED -> unparseable -> exit 1)

CONTROL: same note, `id:` not at column 0
   parseNote(whole) -> parsed: ["scalars","refs","body","duplicateKeys","malformedLines"]
   splitNotes -> notes=1  trailingMalformed=null
   verdict: ADMITTED
```

The control matters: the two inputs differ by four characters in a prose line, so the refusal is
attributable to the body `id:` line and to nothing else.

Walking the trigger's shape shows it is the *leading token* that matters, not column 0 alone:

```
body line "id: other"      -> notes=0 tm=NON-NULL  REFUSED
body line " id: other"     -> notes=0 tm=NON-NULL  REFUSED
body line "\tid: other"    -> notes=0 tm=NON-NULL  REFUSED
body line "x id: other"    -> notes=1 tm=null      ADMITTED
body line "ident: other"   -> notes=1 tm=null      ADMITTED
body line "id:other"       -> notes=0 tm=NON-NULL  REFUSED
body line "id: "           -> notes=0 tm=NON-NULL  REFUSED
same note, NO body id: line -> notes=1             ADMITTED
```

Note that `parseNote` accepts the whole text in **both** directions. The false positive is created
by `splitNotes`' boundary enumeration, not by the frontmatter parser.

### Differential against a real YAML loader

Loader: `/usr/bin/ruby -ryaml` — ruby 2.6.10p210, Psych 3.1.0, libyaml 0.2.1.

| Bytes | Module verdict | Loader verdict |
|---|---|---|
| the note's frontmatter region (the region the note format declares to be YAML) | region parses; the note is nonetheless **REFUSED** by `splitNotes` | `{"id"=>"n1", "kind"=>"finding", "by"=>"engineer", "at"=>2026-08-11 00:00:00 UTC}`, exit `0` |
| the same frontmatter with the body `id:` line removed | **ADMITTED** | byte-identical output, exit `0` |

The loader column is stated with its limit rather than overstated: loading the **whole note file**
as a YAML stream is not a meaningful oracle here, because the body is prose by contract and libyaml
correctly rejects it (`could not find expected ':' while scanning a simple key at line 10 column 1`,
exit 1) in *both* the refused and the admitted direction. The frontmatter region is the comparable
unit, and there the loader is indifferent to the body line while the module is not.

### Size of the fix

**Not one line, and not a message change — it changes a predicate.** The refuse-versus-leave-as-body
decision is the fail-closure trigger, and narrowing it is the same move Phase 22 made seven times:
`.planning/milestones/v2.0-REQUIREMENTS.md:56` records that CMP-02 *"took 8 rounds and 7 distinct
bypasses of the same silent-absorb class; each round's heuristic boundary test proved a strict subset
of `parseNote`'s grammar."* Any narrowing must be re-proven against that adversarial corpus, because
a trigger that fires less often is by construction a trigger that admits more, and admitting more is
the exact direction all seven bypasses ran.

Estimated scope: 1 source file (`scripts/context-io.ts` + its committed `.js`) and 1 test file, plus
a re-run of the round-8 adversarial hunt to demonstrate no silent-absorb reopens. That re-run, not
the edit, is the cost.

### Disposition

**`deferred` → Phase 30.**

**Named reason** (D-19 forbids "out of scope" as a reason): the fix narrows a fail-closure predicate,
and this repository has measured twice — Phase 27 rounds 10 and 11 — that narrowing a safety
predicate without a red-team budget ships a new regression inside its own fix. `.planning/ROADMAP.md`
§ Phase 30 carries red-team rounds **as scope**; Phase 28 does not, which is the same asymmetry D-21's
own overridden concern names. The residual fails SAFE today — it refuses loudly and never silently
drops — so the cost of deferring is usability, not safety, and the cost of *not* deferring is a
predicate change with no budget to prove it.

---

## Residual 2 — the byte-round-trip adjacency (D-19 item 2, gating D-21)

This section resolves D-21's conditional. The question it answers by measurement is exactly one:
**does closing this residual require editing `scripts/canonical-frontmatter.ts` or
`scripts/frontmatter.ts`?**

### The recorded shape does not reproduce — the live shape is different

`.planning/milestones/.../22-VERIFICATION.md:141` records the residual as *"an opening `---`
immediately followed by a trailing-space `--- ` boundary-shaped line makes reconstruction invent one
extra `\n`."* Driven against the committed `scripts/context-io.js` today, **that shape round-trips
cleanly**:

```
OK      in="---\n--- "              notes=0 tm="---\n--- "
OK      in="---\n--- \n"            notes=0 tm="---\n--- \n"
```

The live class is different, and smaller in description:

```
BROKEN  in="---\nid: n1"            notes=0 tm="\n---\nid: n1"
BROKEN  in="---\nid: n1\n"          notes=0 tm="\n---\nid: n1\n"
BROKEN  in="---\nid: n1\nid: n2"    notes=0 tm="\n---\nid: n1\nid: n2"
```

One `\n` is invented at the **front** of the refused remainder. The record's 2026-06-19 framing was
accurate for the round-8 build it was written against; the module has been rebuilt since, and this is
recorded as a divergence rather than repaired in the prose. **Reproducing rather than reading the
Phase 22 record is what surfaced it.**

### Where the invented byte comes from

`scripts/context-io.ts`, `splitNotes`:

```ts
// line 400-403
const sliceBytes = (from: number, to: number): string => {
  const segment = lines.slice(from, to).join("\n");
  return to < lines.length ? segment + "\n" : segment;
};
...
// line 508 — the leading region before the first boundary
refused += sliceBytes(0, boundaries[0]);
```

When the very first line is a boundary, `boundaries[0]` is `0`, so `sliceBytes(0, 0)` computes an
empty `segment` and then appends a separator because `0 < lines.length` holds. An **empty** slice
emits one byte. That is the whole defect.

### Reach — the D-21 question, measured

Transitive local-import closure, computed from the sources rather than from the Phase 27 record:

```
closure(scripts/context-io.ts) = 1 module(s):  scripts/context-io.ts
  scripts/canonical-frontmatter.ts   ON PATH? NO
  scripts/frontmatter.ts             ON PATH? NO

closure(scripts/compactor.ts) = 2 module(s):  scripts/compactor.ts, scripts/context-io.ts
  scripts/canonical-frontmatter.ts   ON PATH? NO
  scripts/frontmatter.ts             ON PATH? NO

closure(scripts/canonical-frontmatter.ts) = 2 module(s): scripts/canonical-frontmatter.ts, scripts/frontmatter.ts
  scripts/context-io.ts ON PATH? NO
```

The two graphs are **disjoint in both directions**. `context-io.ts` imports only `node:crypto`,
`node:fs`, `node:path` and `node:url`. There is one collision of vocabulary that must not be read as
a collision of code: `context-io.ts` exports an `admit()` at line 966 and `canonical-frontmatter.ts`
exports an `admit()` at line 538. They are **different functions in different modules** — the first
admits a §14-gate-stamped note, the second admits frontmatter to the canonical form for a spawn-grant
verdict. Nothing calls across.

### Parser-oracle fuzz, and the size of the fix

30,000 randomized inputs over a 14-shape line alphabet (fence spellings including trailing-space,
tab-suffixed, four-dash and indented forms; `id:`/`kind:`/`by:`/`at:` frontmatter lines; blank lines;
prose), with and without a terminating newline. Byte-count breaks, excluding whole-blank inputs:

| Build | Invented/lost-byte breaks | Documented blank-region drops |
|---|---|---|
| committed `scripts/context-io.js` | **132 distinct** | 2 |
| with one inserted line `if (from >= to) return "";` | **0** | 2 |
| fail-closure **verdict** changes between the two builds | **0** | — |

The patch was applied to a **scratch copy** under the OS temp dir; the repository working tree was
untouched (`git status --short scripts/` empty afterwards). The 2 remaining rows in both columns are
the blank-remainder nulling stated at `context-io.ts:506` and `:538` — a purely-blank leading region
is not preserved because `refused.trim() === ""` nulls it. That is a written contract, not the
residual, and it is the same 2 rows before and after, so the patch neither causes nor hides it.

**The harness's own premise was asserted and was wrong the first time.** The first property tested
was `notes.join("") + trailingMalformed === input`, which is the module's own stated contract at
`context-io.ts:533-537`. It reported 173 breaks before the patch and 42 after — suggesting the fix
was incomplete. Inspecting the survivors showed every one had `delta = 0`: no byte invented, no byte
lost, only a different **order**, because `refused` accumulates the *leading* region first and is then
concatenated *after* the notes. The module's stated contract is therefore wrong as written for a
leading refused region, and the property had to be restated over byte **count** to measure the actual
residual. Had that not been checked, this section would have reported the fix as incomplete on the
strength of a wrong oracle. (The contract wording at `context-io.ts:533-537` is itself a finding, and
is carried into the disposition table below.)

### Verdict

The reproduction above shows the residual living entirely in `scripts/context-io.ts`, consumed only
by `scripts/compactor.ts`, with the admission reader's import closure disjoint from it in both
directions.

**Plan 28-08 is NOT REQUIRED.**

The measurement that makes it so: `closure(scripts/context-io.ts)` and `closure(scripts/compactor.ts)`
each contain neither `scripts/canonical-frontmatter.ts` nor `scripts/frontmatter.ts`, and
`closure(scripts/canonical-frontmatter.ts)` does not contain `scripts/context-io.ts`. D-21's
conditional — *"if the byte-round-trip adjacency residual requires editing the canonical admission
reader"* — is not met, so its consequent does not fire.

### D-21, recorded with the concern it was taken over

D-21 (USER DECISION, taken against a stated concern — recorded with the concern intact): if the
byte-round-trip adjacency residual requires editing the canonical admission reader
(`scripts/canonical-frontmatter.ts` / `scripts/frontmatter.ts`), it is fixed in this phase with a
red-team pass, not deferred.

> **Concern raised during discussion and overridden by the user:** that module took Phase 27
> **twelve gap-closure rounds**; rounds 10 and 11 each shipped a **new regression inside their own
> fix**; D-64's entire point at round 12 was to stop widening the parser and refuse everything
> outside a canonical form. Phase 27 closed it by **named user override**, with KIT-03 and SPAWN-04
> still `[ ]`. Phase 30 carries a red-team budget as scope; Phase 28 does not. **The accepted cost:
> this audit phase now carries an adversarial round.**

The decision stands as taken. Its condition simply did not obtain: the module the concern is about is
not on the path, so the accepted cost is not incurred and the adversarial round is not owed. D-22's
bar is therefore **not** transcribed here as an entry price, because there is no entry to price. If a
later reader finds a path from the note parser to the admission reader that this measurement missed,
the correct response is to re-run the closure measurement above and reopen the verdict — not to
assume the verdict was a judgement call. It was not; it was a computation over the import graph.

### Disposition

**`deferred` → Phase 30.**

**`deferred` → Phase 28, plan 28-08 — PULLED FORWARD at the 28-02 checkpoint.**

The disposition initially recorded here was `deferred → Phase 30`. The user overrode it at the
checkpoint and pulled it forward into this phase. See the checkpoint-resolution section below for the
decision, the reason, and why it lands on 28-08 rather than inside the checkpoint task itself.

**Named reason:** the fix is fully sized and demonstrably cheap — one inserted line, 132 → 0 measured
on a 30,000-input fuzz, changing no predicate and producing zero fail-closure verdict changes. It was
deferred for **charter purity**, not for cost or risk: this plan's job was to measure reach without
editing modules outside its declared file set. The residual fails CLOSED today and the invented byte
lives only in a refused remainder that is never byte-compared against a promoted note, so nothing was
at risk in the interval — but nothing is gained by waiting either, now that the evidence is complete.

---

## Disposition summary — all eight D-19 items

D-04's closed set applies: every disposition is `fixed`, `accepted` or `deferred`; every `deferred`
row names a target phase **and** a reason; every `accepted` row names a reason.

| # | Item | Disposition | Target phase | Reason / owner |
|---|---|---|---|---|
| 1 | Phase-22 WR-03 usability false-positive | `deferred` | Phase 30 | Reproduced above with a discriminating control. The fix narrows a **fail-closure predicate**, and rounds 10 and 11 of Phase 27 each shipped a new regression inside such a narrowing. Phase 30 carries red-team rounds as scope; Phase 28 does not. Fails SAFE today, so deferral costs usability, not safety. |
| 2 | `---\n--- \n…` byte-round-trip adjacency | **`fixed`** *(by plan 28-08, 2026-08-12)* | Phase 28, plan **28-08** *(pulled forward at the checkpoint)* | Reproduced above; the recorded shape did **not** reproduce and the live shape is an empty-leading-slice byte invention at `context-io.ts:400-403`. Sized at one inserted line, 132 → 0 on a 30,000-input fuzz with 0 verdict changes. **D-21's conditional is resolved NOT REQUIRED on reach** — but 28-08 runs on independent grounds, and this rides with it, carrying the patch and the RED-first control specified below. **CLOSED:** the guard is the function's missing base case, landed RED-first (3 tests watched failing, both controls green on the same run); 28-08's own value map measured 1,843 → 0 invented-byte breaks over 30,000 inputs with 0 arm changes, 0 new refusals and 0 dropped refusals, and 0 changes of any kind over the 1,213 tracked `*.md` in the live tree. |
| 3 | `floor-invariance.test.ts` spawn-heavy timeout | **`fixed`** *(by plan 28-08, 2026-08-12)* | Phase 28, plan **28-08** *(assigned at the checkpoint)* | **CLOSED — F-28-E discharged.** An explicit `FLOOR_INVARIANCE_TEST_TIMEOUT_MS = 30_000` now replaces the silently inherited 5,000 ms vitest default, with the derivation in the comment and an instruction not to raise it again. The knob was **watched taking effect** (D-24): a mirror with the constant set to `1` produced `Failed Tests 43 / Error: Test timed out in 1ms`, so the setting is demonstrably live rather than inert. Re-measured independently before fixing: 128 tests, 1.31 s, slowest single test **81 ms**. Original assignment note follows. | **Was ownerless — F-28-E.** D-19 dispositions it `fix` and no plan in the phase owned it; the checkpoint assigned it to 28-08, which is already touching test files. Measured 2026-08-11: 128 tests, 1.29 s total, slowest single test **84 ms** against vitest's 5,000 ms default per-test timeout (no explicit `testTimeout` in the file, none in `vitest.config.ts`). Latent, not live: ~60× headroom on this box, less on a slower CI runner. `PITFALLS.md:801` records it *"will get worse when Phase 30 adds checkpoints"*, which is exactly why deferring it **to** Phase 30 would invert D-19's rationale — it is cheap now and progressively more expensive later. |
| 4 | same-uid / no-hook direct-FS forgery residual | `accepted` | — | **Irreducible.** Reason: an agent running as the same uid with no hook can write the filesystem directly; no in-process mechanism can prevent it. Backstopped by `autonomy=pr`. Per D-19 and D-17 it becomes the `status: overstated` registry row on *"Humans always hold merge and deploy"* — owned by plan **28-04**. |
| 5 | `agent-factory/handoffs/.gitkeep` + empty `agent-factory/examples/` | `deferred` | Phase 28, plan **28-05** | Owned: both paths appear in `28-05-PLAN.md`'s `files_modified`. Deferred only in the sense of landing beside its owner (D-12); it is fixed within this phase. |
| 6 | AUDIT-04 pins | `fixed` | — | Fixed in this plan (28-02). Measured with `npm show` at execution time; transcript, exit statuses and date recorded above. Divergence F-28-A against the roadmap's `1.62.0` recorded. |
| 7 | `oracleWr05Wording` quadratic hang | `fixed` | — | Fixed in this plan (28-02). Three anchored beat regexes, a named `WR05_MAX_LINE_BYTES` input bound refusing by name, and a permanent regression control that was SIGTERM-killed at 20 s against the pre-fix build and returns in 0.09 s after. Verdict preservation proven by an empty byte-diff of the gate's full output. |
| 8 | determinism / prose findings | `deferred` | Phase 29 | Record-only by D-07 category 6, pre-committed before the read pass so the audit cannot turn into a style pass on prose Phase 29 is about to rewrite. Recorded by plans **28-03** and **28-06**; consumed by Phase 29's LANG-02 / LANG-05. |

**Completeness:** 8 rows, one per D-19 item, `fixed` **4** / `accepted` 1 / `deferred` **3**.

*(Amended by plan 28-08, 2026-08-12. Rows 2 and 3 moved `deferred` → `fixed` when 28-08 landed them;
the counts are restated here rather than left to a reader to re-add, because a completeness line that
disagrees with its own table is the internal-consistency defect this phase catalogues. The three
remaining `deferred` rows are 1 → Phase 30, 5 → plan 28-05 (landed within this phase), and 8 →
Phase 29.)*

### Findings raised by this sizing pass, for the register (plan 28-06)

These are not D-19 items; they were surfaced while measuring the D-19 items and would otherwise be
lost.

| Id | Category | Where | Finding |
|---|---|---|---|
| F-28-A | 4 — internal consistency | `.planning/ROADMAP.md:428` | The pre-named `@playwright/test` `1.62.0` is stale by one patch; `1.62.1` measured 2026-08-11. |
| F-28-B | 3 — claim honesty | `.planning/milestones/v2.0-phases/22-.../22-VERIFICATION.md:141` | The recorded `---\n--- \n…` shape does not reproduce against the current build; the live class is an empty-leading-slice byte invention. |
| F-28-C | 4 — internal consistency | `scripts/context-io.ts:533-537` | The stated byte round-trip contract `notes.join("") + refused === normalized` is **false for a leading refused region**, because `refused` accumulates the leading region first and is concatenated after the notes. The bytes tile the input; the stated concatenation order does not hold. The field name `trailingMalformed` carries the same wrong implication. **CORRECTED AT THE SOURCE by plan 28-08, 2026-08-12** — the contract is restated as a TILING with an explicit instruction to verify over byte COUNT and a pointer to the 42 phantom survivors the old wording produced. The FIELD was deliberately **not renamed**: renaming a field on a fail-closure path deserves its own RED-first evidence, and this plan's budget was spent on the byte defect. The wrong implication is recorded where a reader consults the contract. |
| F-28-D | 5 — strangeness | `scripts/check-uat-oracles.ts:110-134` | `oracleWr05Wording` asserts four `.planning/` documents narrate a story from two milestones ago, in a repository that archives `.planning/` at milestone close. Whether it is still load-bearing is open. Recorded at its site in this plan; **deliberately not settled inside the D-20 bug fix.** |
| F-28-E | 4 — internal consistency | `.planning/phases/28-kit-consistency-audit/` | D-19 item 3 is dispositioned `fix` and no plan in the phase owns it (see row 3 above). **DISCHARGED by plan 28-08, 2026-08-12** — the item was assigned at the checkpoint and is now `fixed`; the ownerless gap no longer exists. |
| F-28-F | 3 — claim honesty | `28-02-PLAN.md` `must_haves` / D-20 item 1 | The closed-class premise "exactly three pure-lookahead regexes … and no other anywhere in `scripts/`" measured **four**. The fourth is sanctioned with its reason; the assertion in `check-uat-oracles.test.ts` is written over the measured class, not the assumed one. |
| F-28-G | 5 — strangeness | `scripts/context-io.ts` ↔ `scripts/frontmatter.ts:71-72` | `context-io.ts` writes `refs:\n  - …` list blocks and parses its own notes back with its own grammar. `frontmatter.ts:71-72` names it *"a documented extension of that same flat key:value idiom"* — a **second grammar for the same idiom**, which is the structural class that took Phase 27 twelve rounds. **Informational, for Phase 29/30 — not actionable and not to be actioned in phase 28.** Two facts bound it: it is genuinely unreachable from the parser today (measured below), and it is *already* a named, mechanically-pinned exemption — `frontmatter.ts:76-84` cites the derived assertion `D-50 IN-05` in `frontmatter.test.ts`, which scans every tracked `.ts` by pattern, compares to exactly two named non-guard files and pins the cardinality, so a **third** grammar fails red by name wherever it lands. This is a register row, not a fix. |

---

## Checkpoint resolution (task 4) — the decisions taken

The blocking checkpoint returned **"approved — 28-08 runs, assign D-19 item 3, pull residual 2
forward."** The three decisions and their reasons are recorded here because two of them override what
this document said an hour earlier, and a register that quietly absorbs an override is worth less than
no register.

### The NOT REQUIRED verdict was independently corroborated, not merely accepted

The user did **not** dispute the reach measurement. It was re-derived by the orchestrator before the
decision was taken, by a **stronger route** than this document originally reported:

| Claim | Verified |
|---|---|
| `scripts/frontmatter.ts` has **zero** imports | `grep -E 'from "'` returns nothing |
| its two `context-io` mentions (`:71`, `:82`) are **comments only** | both lines begin `//` |
| `scripts/canonical-frontmatter.ts` imports **only** `./frontmatter.js` | one `from "./…"` at `:43` |
| `scripts/context-io.ts` imports **only** node builtins | `node:crypto`, `node:fs`, `node:path`, `node:url` |

The **data paths** are disjoint too, which the import graph alone does not establish: `context-io.ts`
writes `.grugops/context/<task>/notes/*.md` and `.grugops/audit/`, while every `canonical-frontmatter`
consumer scans `agent-factory/roles/`, `skills/*/SKILL.md`, `.claude/agents/` and `.claude/skills/`.
**Disjoint by import AND by directory.**

**The strongest objection, stated and answered.** `frontmatter.ts:82-83` says in its own comment that
*"`context-io.ts` is NOT [outside every frontmatter consumer's closure] — it is reached through
check-uat-oracles.ts."* Read carelessly that looks like a contradiction. Measured, it is not:

```
closure(scripts/check-uat-oracles.ts)  -> context-io.ts YES | frontmatter.ts NO | canonical-frontmatter.ts NO
closure(scripts/check-foundation-guards.ts) -> context-io.ts YES | frontmatter.ts YES | canonical-frontmatter.ts YES
```

`check-foundation-guards.ts` is a **common consumer** that imports both sides, so the two modules
share a *process*. Neither imports the other in either direction, so there is no path *between* them.
That is exactly the distinction `frontmatter.ts:83-84` draws for itself — *"which is why the claim
above is about the PREDICATE and the document class rather than about which files happen to share a
process."* Sharing a consumer is not reach. **The verdict stands.**

### Decision 1 — plan 28-08 RUNS, on independent grounds

**28-08 is not running because the reach measurement was doubted.** It was not doubted; it was
corroborated. 28-08's charter is the adversarial round on the frontmatter parser, and that value never
depended on residual 2 landing there.

The decisive argument is one this plan supplied against itself: **it found two of its own premises
wrong.**

1. The first fuzz property was the module's own **stated contract** (`context-io.ts:533-537`), and
   that contract is false — `refused` accumulates the *leading* region, so the documented
   concatenation order does not hold. It reported **42 phantom survivors** and would have recorded the
   fix as incomplete had the premise not been re-examined.
2. D-20's closed-class premise miscounted the pure-lookahead class as **3** when it is **4**.

That is the *"assert the verification harness's own premise"* failure class recurring **twice inside a
single plan**, on a project where it is already on record six times, and where Phase 27 needed twelve
rounds and closed on named user override with KIT-03 and SPAWN-04 still unverified. A scheduled
adversarial round is **not droppable in a phase that has just demonstrated its own premises are
unreliable.** That, and not reach, is why 28-08 runs.

### Decision 2 — D-19 item 3 gets an owner inside phase 28: plan 28-08

F-28-E was that nothing owned it. It is now written into row 3 of the disposition table above with
`28-08` named, so the gap cannot be lost a second time. It is **not** deferred to Phase 30: Phase 30
is the phase that makes the timeout worse, so deferring to it inverts D-19's rationale. It is latent
and cheap today and gets more expensive on exactly the schedule that would justify waiting.

### Decision 3 — residual 2 is pulled forward, and lands on 28-08 rather than in this task

**What was done: assigned to plan 28-08, inside phase 28, with the measured evidence attached.** Not
applied inside task 4. The checkpoint sanctioned either, on condition that the choice be stated with
its reason.

**Why 28-08 and not here.** Task 4 is a `checkpoint:human-verify` task — a verification gate with no
`<files>` and no `<action>`. `scripts/context-io.ts` is not in this plan's `files_modified`, and the
edit sits on a **fail-closure path**. More decisively, this phase's own governing pattern is that a
fix is not closed until a control has been **watched failing** — D-24 for the AUDIT-02 guard, D-20
item 2 for the oracle repaired earlier in this very plan. A one-line change committed inside a
checkpoint task, with no test file in scope and no RED-first transcript, would violate the doctrine
this plan spent its first task demonstrating. The honest home is the plan that has the budget to do it
properly, and 28-08 both runs and already edits `docs/audit/28-residual-sizing.md`, so this handoff is
a file it is guaranteed to read.

**What 28-08 needs — everything is above, nothing needs re-investigating:**

| | |
|---|---|
| Patch | insert `if (from >= to) return "";` as the first statement of `sliceBytes`, `scripts/context-io.ts:400-403` |
| Rebuild | `npm run build`, commit the `.js` twin — `npm run freshness` fails red on drift |
| RED-first control | the fuzz harness in this document: property is **byte count**, not the module's stated concatenation order (see F-28-C) — RED at **132** distinct invented-byte breaks over 30,000 inputs against the pre-fix build, GREEN at **0** after |
| Must not change | fail-closure verdicts — measured **0** changes across the same 30,000 inputs; assert this, do not assume it |
| Expected survivors | **2** documented blank-region drops, identical before and after (`context-io.ts:506`, `:538`) — these are a stated contract, not the residual |
| Also fix the wording | F-28-C — `context-io.ts:533-537` states a contract the code does not honour, and `trailingMalformed` is a misleading name for a remainder that may be *leading* |

---

## Residual 2 — reproduction at fix time (28-08)

**Produced by:** plan 28-08, task 1. **Date:** 2026-08-11.

Everything below was constructed and run in the session that wrote it, against the **committed**
`scripts/context-io.js`. Nothing is read from 28-02's transcript above; that section is compared to
afterwards, not copied from. This repository's record is that a prior transcript and a fresh run give
different answers often enough that reuse is a defect.

### Harness premise, asserted before any verdict is believed

Phase 27's record is that the verification harness produced a false result in **six** instances across
four straight rounds, and every one was found by checking the harness rather than the code. Phase 28
has now hit that class in every plan. So the harness is checked first.

| Premise | How it was asserted | Result |
|---|---|---|
| The build under test is the committed one, not a stale artifact | `npm run freshness` **before** any edit | exit 0 — 42 committed `.js` match a fresh `tsc` rebuild |
| The module actually loaded is the repository's | `require.resolve` printed | `/Users/…/grugops/scripts/context-io.js` |
| The file under test is the one measured | sha256 + byte count printed | 91213 B, `62d79864a1a4503a…` |
| `splitNotes` is reached, not a silently-undefined export | `typeof` printed | `function` |
| The input is the bytes intended | full hexdump with offsets, below | matches intent |
| The loader process ran and did not fail silently | byte count echoed to stderr from inside the loader, exit status captured | `read 10B` / `read 11B`, exit `0` both |

### The constructed input, printed with byte offsets

The minimal input that exhibits the defect is 10 bytes:

```
[  0]=0x2d'-' [  1]=0x2d'-' [  2]=0x2d'-' [  3]=0x0a'\n' [  4]=0x69'i' [  5]=0x64'd'
[  6]=0x3a':' [  7]=0x20'SP' [  8]=0x6e'n' [  9]=0x31'1'
```

That is `---\nid: n1` — a boundary-shaped line at **line index 0**, opening a note attempt.

### The module's verdict

```
notes.length        = 0
trailingMalformed   = "\n---\nid: n1"
```

The remainder, with offsets — note the byte at `[0]` that is in no position of the input:

```
[  0]=0x0a'\n' [  1]=0x2d'-' [  2]=0x2d'-' [  3]=0x2d'-' [  4]=0x0a'\n' [  5]=0x69'i'
[  6]=0x64'd' [  7]=0x3a':' [  8]=0x20'SP' [  9]=0x6e'n' [ 10]=0x31'1'
```

**11 bytes out for 10 bytes in. One byte invented.** The fail-closure verdict itself is `REFUSED`
(`notes=0` plus a non-null remainder routes to the unparseable channel), and that verdict is correct;
what is wrong is the bytes it carries.

### The full case set, with a discriminating control

| | Input | notes | trailingMalformed | in | out | delta |
|---|---|---|---|---|---|---|
| RECORDED | `"---\n--- "` | 0 | `"---\n--- "` | 8 | 8 | **+0 — round-trips** |
| RECORDED | `"---\n--- \n"` | 0 | `"---\n--- \n"` | 9 | 9 | **+0 — round-trips** |
| LIVE | `"---\nid: n1"` | 0 | `"\n---\nid: n1"` | 10 | 11 | **+1** |
| LIVE | `"---\nid: n1\n"` | 0 | `"\n---\nid: n1\n"` | 11 | 12 | **+1** |
| LIVE | `"---\nid: n1\nid: n2"` | 0 | `"\n---\nid: n1\nid: n2"` | 17 | 18 | **+1** |
| **CONTROL** | `"x\n---\nid: n1"` | 0 | `"x\n---\nid: n1"` | 12 | 12 | **+0** |

The control is what makes the attribution exact rather than plausible. It is the same boundary, the
same note-open attempt and the same refusal — differing only in that one prose line precedes the
boundary, so the boundary is no longer at line index 0. It round-trips. The defect is therefore
attributable to the boundary being **first**, and to nothing else.

### The real YAML loader's verdict

Loader: `/usr/bin/ruby -ryaml` — ruby 2.6.10p210 (universal.arm64e-darwin25), **Psych 3.1.0, libyaml
0.2.1**. Run in a separate process, over the exact bytes written to disk by the harness.

| Bytes handed to the loader | `YAML.load_stream` | exit |
|---|---|---|
| the module's **input**, 10 B | `[{"id"=>"n1"}]` | `0` |
| the module's **output remainder**, 11 B | `[{"id"=>"n1"}]` | `0` |

### The divergence, stated precisely and not overstated

**The divergence is not a meaning divergence, and this section will not claim one.** The loader loads
both byte strings to the *same* value: a leading `\n` before a `---` document-start marker is
insignificant to YAML. The module and the loader **agree** on what the bytes mean.

The divergence is a **byte-identity** divergence against the module's own contract, and its direction
is: **the module invents a byte the input never contained.** Neither of the two unsafe directions the
plan enumerates obtains — this is not module-accepts-loader-refuses, and it is not
module-sees-no-grant-loader-sees-a-grant. Both sides refuse in the same direction and read the same
value.

Saying so is the honest result. Residual 2 is a **byte-fidelity defect in a refused remainder**, not a
parser bypass. It is worth fixing because the remainder is surfaced to a human through the unparseable
channel and a byte that no one wrote is a lie told to that human — and because a byte-round-trip
contract that is false is a contract a later reviewer will reason from. It is *not* worth dressing up
as a safety bypass; this phase exists to stop claims from outrunning their evidence.

### The three structural questions, answered before any fix was proposed

The plan requires these three answered **in writing** before a fix is proposed, because they are the
questions that closed Phase 27's rounds 6, 10 and 11 respectively. The first answer is that the thing
at fault is not a predicate at all.

**1 — Which set does it enumerate?**

`sliceBytes(from, to)` reconstitutes the verbatim bytes of line indices `[from, to)`. `split("\n")`
drops every separator, so the function must decide how many to put back. Its rule is:

```ts
return to < lines.length ? segment + "\n" : segment;
```

The set this enumerates is *"slices whose last line is not the final line of the document"* — for
those, one separator follows the slice in the original and must be restored. The rule is written over
`to` **alone**. An **empty** slice (`from === to`) has no last line and no separators at all, yet
`to < lines.length` still evaluates true whenever `to === 0` and the document is non-empty. The set
the rule enumerates silently includes a member that has no last line to reason about. That is the
entire defect: a separator-count question answered by a bounds test that coincides with it on every
non-empty slice and diverges on the empty one.

**2 — At which positions is it asked?**

Five call sites, and only one can be reached with `from === to`:

| Site | Call | Can `from === to`? |
|---|---|---|
| `candidateRegionFrom` | `sliceBytes(i, j + 1)` | no — `j > i`, so `j + 1 > i` |
| `candidateRegionFrom` | `sliceBytes(i, lines.length)` | no — reached only while `i < lines.length` |
| no-boundary path | `sliceBytes(0, lines.length)` | no — `lines.length ≥ 1` for a non-empty normalized input |
| region walk | `sliceBytes(start, end)` | no — boundaries are strictly increasing, so `end > start` |
| **leading region** | **`sliceBytes(0, boundaries[0])`** | **yes — exactly when `boundaries[0] === 0`** |

So the question is asked at exactly one position with an empty range, and only when the **first line
of the document is a note boundary**. That is precisely what the control above measures from the other
side: move one prose line in front, `boundaries[0]` becomes 1, the range is non-empty, and the byte
stops being invented.

**3 — What is its input assembled from?**

`from` and `to` are **line indices** into `lines = normalized.split("\n")`, where `normalized` is the
CRLF/CR-folded input. `boundaries[0]` is assembled by the boundary walk over `[0, lines.length)`, so
it can be `0` for any document opening on a boundary-shaped line that opens a note attempt. The
comparand `lines.length` is an array length, not a separator count; for a non-empty string
`split("\n")` always yields at least one element, so `0 < lines.length` is unconditionally true at
that call site. The predicate's input therefore cannot express the case it needs to distinguish: an
index-into-lines cannot say "this slice contains no lines."

**What follows from those three answers.** The correct fix is the function's missing **base case** —
an empty slice contributes no bytes — stated once inside the function that owns the byte-slicing
question. It is not a character-level special case, it is not a new arm on a boundary predicate, and
it touches no predicate that decides refuse-versus-admit. That distinction is what task 2 has to
preserve.

### Agreement with 28-02's earlier reproduction — and the disagreement that is with the plan

**This reproduction AGREES with 28-02's, on every point it tests.** The recorded `---\n--- \n…` shape
does not reproduce (confirming **F-28-B**); the live class is a single `\n` invented at the front of
the refused remainder; the cause is the empty leading slice at `context-io.ts:400-403` reached from
`:508`. Independently re-derived, not read across.

The disagreement is with **`28-08-PLAN.md` itself**, and per the plan's own instruction it is reported
here rather than reconciled by adjusting either transcript.

> **Finding F-28-041 (claim honesty, category 3) — `28-08-PLAN.md` task 1 mislocates residual 2.**
> The plan directs the executor to *"read the region of `scripts/canonical-frontmatter.ts` the bypass
> reaches"*, and its `files_modified`, `must_haves`, `key_links` and threat register are all written as
> though residual 2 lives in the canonical admission reader. **It does not, and 28-02 measured that
> before this plan ran.** The plan text was written before that measurement existed and was never
> reconciled to it.

The reach measurement was **recomputed in this session** from the sources, not inherited:

```
closure(scripts/context-io.ts)            = 1: context-io.ts
closure(scripts/compactor.ts)             = 2: compactor.ts, context-io.ts
closure(scripts/canonical-frontmatter.ts) = 2: canonical-frontmatter.ts, frontmatter.ts
closure(scripts/frontmatter.ts)           = 1: frontmatter.ts

context-io closure contains canonical-frontmatter?  false
context-io closure contains frontmatter?            false
canonical-frontmatter closure contains context-io?  false
```

Disjoint in both directions, reproducing 28-02's result by an independently written walker.

**The consequence for this plan, stated plainly.** There is no bypass in
`scripts/canonical-frontmatter.ts` to reproduce, so there is nothing there to fix. Editing a
safety-critical parser that took twelve rounds to close, in order to satisfy a plan sentence rather
than a measured defect, would be the exact act D-64 and this phase's whole doctrine forbid — and it is
the one thing the plan's own prohibitions rule out most emphatically (*"If the only fix you can find is
a widening, stop and record that as the finding rather than shipping it"*). `git diff` on
`scripts/canonical-frontmatter.ts` and `scripts/frontmatter.ts` is therefore expected to be **empty
across every commit of this plan**, and is asserted as such in the summary.

D-22's four-part bar is not discarded on that account. It is applied to the fix that **is** owed — the
`context-io.ts` byte-fidelity defect — at full strength: a structural fix, parser-oracle fuzz against
a real YAML loader, independent red teams, and the executor's own reproduction before and after.


---

## Residual 2 — the red-team round, and five corrections to the record (28-08)

**Produced by:** plan 28-08 after two independent opus red teams, commissioned by the orchestrator.
**Date:** 2026-08-12.

### D-22 part 3 is CLOSED, and how the independence was obtained

The executor running plan 28-08 has **no agent-spawning tool in its tool set**, so it could not
commission an adversarial pass itself and said so rather than scoring the part met. The orchestrator
commissioned two independent opus red teams against commit `a290ee7` with deliberately different
lenses — **A: attack the fix. B: attack the evidence.** Both returned.

**That limitation is recorded here for future phases:** a plan that writes "two independent red
teams" into its acceptance criteria is writing a requirement its executor may be structurally unable
to satisfy. The bar is right; the assignment needs to name who commissions them.

### The verdicts

| Team | Lens | Verdict |
|---|---|---|
| A | attack the fix | **PARTIALLY REFUTED** — the fix holds; one code comment is false |
| B | attack the evidence | **EVIDENCE WEAKER THAN STATED** — four claims overstated or wrong |

**The fix itself survived both and needs no change.** Team B rebuilt the harness independently at
200,000 documents (deterministic LCG, 32-shape alphabet with CR, tabs, indented fences and CRLF) and
corroborated: 0 arm changes, 0 refusal null-ness changes, 0 bytes invented post-fix, **7,636
documents (3.82%) actually reaching the changed path**, 0 hits at any non-leading call site, and 0
`from > to` hits ever. Team A's differential over 104,898 documents agreed and proved its comparator
non-blind by catching **44** differences against a deliberately mutated build.
`refused_pre === "\n" + refused_post` held in all **10,933** differing cases with delta exactly 1.
The five-call-site census is confirmed correct.

### The five corrections, each verified independently before being written

Every number below was re-measured by the executor in its own session. Nothing was copied from the
red-team reports — including the digest, which is re-derived by running the test rather than
transcribed.

#### Correction 1 — plan 28-08 shipped a NUL byte, and misdiagnosed it

`scripts/context-io.test.ts:2277` read `cells.join(" ")` where the byte between the quotes was
**0x00, not 0x20**. Provenance, measured:

```
a290ee7^ : NUL count = 0
a290ee7  : NUL count = 1     <- plan 28-08's own commit
HEAD     : NUL count = 1
```

It was the **only NUL byte in any tracked file** — 1 across 1,450. Two harms:

- **The printed digest was irreproducible from its own source.** Its stated purpose is *"printed so
  an outside transcript's same-corpus claim is a measurement rather than an assertion"*. A third
  party reconstructing `join(" ")` hashes different bytes. Corrected to an explicit `"\x1f"` escape
  — explicit so a reader sees WHICH byte rather than inferring it from a glyph — and the digest
  **re-derived by running the test**.
- **28-08's own "false harness premise #3" was itself a false premise.** The summary recorded a
  `grep` returning zero matches, attributed it to *"BSD grep's silent binary-classification skip, a
  known trap in this repository"*, applied `grep -a`, and concluded no work was lost. The conclusion
  was right and **the diagnosis was wrong**: the file was binary-classified because that same commit
  had just introduced the NUL. The known-trap workaround was applied without checking whether its
  premise held. Corrected in the summary.

**A new gate was built for the class** — `scripts/check-nul-bytes.ts`, user-approved. See below.

#### Correction 2 — a false sentence had become a permanent code comment

`scripts/context-io.ts` described the invented byte as *"one byte present at no offset of the
input"*. **False for every reachable case.** Reaching `sliceBytes(0,0)` requires
`boundaries[0] === 0`, which requires `isBoundaryAt(0)`, which forces `lines.length >= 2` — so the
input always already contains `0x0a`. Team A measured the site reached **3,078** times over
exhaustive enumeration, **0** of them with an input lacking `\n`.

The true statement is a **multiset** one: the output carries one MORE `\n` than the input. This is
not pedantry — as written, the sentence invites the check *"does the output contain a character
absent from the input?"*, which **returns clean on the real defect** and would have certified it
fixed while it was live. A fresh instance of this phase's dominant failure class, minted into the
fix's own documentation. Corrected at the source.

#### Correction 3 — D-22 part 2's loader half has ZERO discriminating power for this defect class

Team B ran 28-08's differential against the **pre-fix** build:

```
PRE : loader-rejected=84  meaning-divergences=0  verdicts=400/400
POST: loader-rejected=84  meaning-divergences=0  verdicts=400/400
```

**Byte-identical on the defective build.** libyaml is indifferent to a leading `\n` before a `---`
document-start marker, so the loader comparison **can never go red for this defect class** — a
vacuous pass is indistinguishable from a real one.

**Restated honestly, naming which half did the work.** D-22 part 2 has two halves. The **byte-count
property (28 → 0) is what caught the defect**, over a generated family in which **32 of 200 cells
genuinely reach `from >= to`**, so the family's coverage is real. The **loader half is null for this
class** and contributes nothing to the verdict. Plan 28-08's summary conceded the loader's blindness
for the *minimal* case but its scorecard still marked the row satisfied without saying the loader is
null across the **entire family**. The row is **not** quietly downgraded — the part is met, and it is
met by the byte-count half alone.

**Two structural gaps Team B names, recorded rather than closed:** the harness never tests the
reverse direction (input loader-rejected → output loader-ACCEPTED, i.e. the module manufacturing
loadable structure — measured **0** on both builds, so unexploited but **unasserted**), and the
non-vacuity guard `reconstituted.length - loaderRejected > 0` would still pass at 199-of-200
rejected. Both are real weaknesses in the harness and neither is a defect in the fix.

#### Correction 4 — the live-tree headline was a NULL RESULT presented as a risk finding

Plan 28-08 wrote: *"over every markdown file that actually exists in this repository, the change
alters nothing at all"* — which implies the change was exercised and found harmless. **It was never
exercised.** Re-measured by the executor:

| | |
|---|---|
| tracked `*.md` | 1,214 |
| opening with a bare `---` line | 626 |
| **actually reaching the changed path** | **0** |

`boundaries[0] === 0` additionally requires that first line to open an **id-bearing note attempt**,
which no repository markdown does. The row's own `PRE 0 / POST 0` was the tell. Reframed as the null
result it is: it bounds the blast radius on today's tree and is **not** evidence the fix works.

#### Correction 5 — the stated motivation for the fix was wrong

Plan 28-08 justified the fix as *"the remainder is surfaced to a human through the unparseable
channel and a byte that no one wrote is a lie told to that human."* Verified against the source:

```
scripts/compactor.ts:206-207
    if (split.trailingMalformed !== null) {
      unparseable.push(file);      // <- the FILENAME only
    }
```

The remainder's **bytes are discarded**. `trailingMalformed` appears in exactly two non-test files
(`compactor.ts`, `context-io.ts`) and `compactor.ts` only tests it for null-ness. It reaches no log,
no digest, no audit ledger and no equality check. **No human ever sees those bytes.**

This **strengthens** the "not a parser bypass" conclusion while **invalidating the reason given**.
The corrected motivation: the fix is worth having because the module states a byte round-trip
contract that other code may one day rely on, and a contract that is false is a trap for the next
reader — not because a human was being shown a wrong byte. Nobody was.

### The corrected D-22 scorecard — all four parts, and how each was met

| Part | Met | By what, precisely |
|---|---|---|
| Structural fix | **yes** | the missing base case of `sliceBytes`' own separator rule; no predicate widened; confirmed by both teams and by a 5-site census |
| Parser-oracle fuzz vs a real YAML loader | **yes, by its byte-count half ONLY** | 28 → 0 byte-breaks over a 200-cell family, 32 cells reaching the changed path. **The loader half is null for this class** and is stated as null |
| Two independent red teams | **yes** | A (attack the fix) and B (attack the evidence), commissioned by the orchestrator because the executor has no agent-spawning tool |
| Executor self-reproduction before and after | **yes** | both runs in the executor's own session, bytes hexdumped, harness premise asserted first |

### The new gate — `scripts/check-nul-bytes.ts`, user-approved

Nothing in the previous fourteen gates caught a NUL in a tracked text source, and one had just
shipped. Built **RED-first against the real tree** while the defect was still at HEAD, which is the
standard plan 28-01 set for this phase and the reason a red here is credible.

| Stage | Result |
|---|---|
| the gate, run at commit `cd71344` with the NUL still present | **exit 1** — `2 CHECK(S) FAILED`, naming the file, byte offset 116043, line 2277, column 60 |
| after `cells.join("\0")` → `cells.join("\x1f")` | **exit 0**, gate byte-unchanged across the transition |
| the **final** artifact re-run against `git show a290ee7:scripts/context-io.test.ts` in a throwaway repo | **exit 1**, same offset/line/column — so the refusal is attributed to the code that ships, not to an early draft |

**The scanned set is every path `git ls-files` reports — no exemption list, nothing filtered.** That
is deliberate, and it avoids a trap that was measured before the gate was written: deriving the scan
set from git's own `--eol` text classifier would have **excluded the very file it needed to read**,
because git calls a file `-text` *precisely because* it contains a NUL. On the tree at 28-08, exactly
one of 1,450 files was `-text` — the defect itself. The classifier is downstream of the property
under test, so it cannot be the filter. It is used as a cross-check instead.

**Two honesty notes on that cross-check, both found by running it rather than by reasoning:**

- The first version compared against git's `i/` (**index**) column while the byte scan reads the
  **working tree**. The instant the NUL was fixed the gate reported a disagreement — `i/-text w/lf` —
  because the two detectors were being asked about *different objects*. The gate was right and the
  harness was wrong; it now parses `w/`.
- The header originally claimed "two independent detectors". **That claim is false and is corrected
  in the source.** Git's binary heuristic is itself NUL-based, so agreement corroborates this
  module's *implementation*, not the *concept*. The disagreement arm could not be reached by any of
  four constructed shapes (NUL at byte 100; NUL at byte 20,000; `.gitattributes binary` on clean
  content; `.gitattributes text` on NUL-bearing content) and is documented as **defensive only**
  rather than implied to be covered.

15 cases in `scripts/check-nul-bytes.test.ts`, split into a REFUSAL half driven through the shipped
gate against throwaway git repositories and a NON-VACUITY half against the real tree — including the
case that matters most: **the file that caused this gate is asserted to be INSIDE the scanned set**,
so the green cannot have been obtained by exclusion.

### What the round cost, and what it bought

The fix survived. **The record did not.** Five of the corrections above are defects in evidence, not
in code — a false code comment, an overstated scorecard row, a null result written as a finding, a
wrong motivation, and a NUL byte shipped inside the very artifact whose job was reproducibility.

That is the argument for the round, stated as a measurement rather than as a principle: **a green
suite and a surviving fix were both true the whole time, and the record was still wrong in five
places.**

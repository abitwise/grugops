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
| 2 | `---\n--- \n…` byte-round-trip adjacency | `deferred` | Phase 28, plan **28-08** *(pulled forward at the checkpoint)* | Reproduced above; the recorded shape did **not** reproduce and the live shape is an empty-leading-slice byte invention at `context-io.ts:400-403`. Sized at one inserted line, 132 → 0 on a 30,000-input fuzz with 0 verdict changes. **D-21's conditional is resolved NOT REQUIRED on reach** — but 28-08 runs on independent grounds, and this rides with it, carrying the patch and the RED-first control specified below. |
| 3 | `floor-invariance.test.ts` spawn-heavy timeout | `deferred` | Phase 28, plan **28-08** *(assigned at the checkpoint)* | **Was ownerless — F-28-E.** D-19 dispositions it `fix` and no plan in the phase owned it; the checkpoint assigned it to 28-08, which is already touching test files. Measured 2026-08-11: 128 tests, 1.29 s total, slowest single test **84 ms** against vitest's 5,000 ms default per-test timeout (no explicit `testTimeout` in the file, none in `vitest.config.ts`). Latent, not live: ~60× headroom on this box, less on a slower CI runner. `PITFALLS.md:801` records it *"will get worse when Phase 30 adds checkpoints"*, which is exactly why deferring it **to** Phase 30 would invert D-19's rationale — it is cheap now and progressively more expensive later. |
| 4 | same-uid / no-hook direct-FS forgery residual | `accepted` | — | **Irreducible.** Reason: an agent running as the same uid with no hook can write the filesystem directly; no in-process mechanism can prevent it. Backstopped by `autonomy=pr`. Per D-19 and D-17 it becomes the `status: overstated` registry row on *"Humans always hold merge and deploy"* — owned by plan **28-04**. |
| 5 | `agent-factory/handoffs/.gitkeep` + empty `agent-factory/examples/` | `deferred` | Phase 28, plan **28-05** | Owned: both paths appear in `28-05-PLAN.md`'s `files_modified`. Deferred only in the sense of landing beside its owner (D-12); it is fixed within this phase. |
| 6 | AUDIT-04 pins | `fixed` | — | Fixed in this plan (28-02). Measured with `npm show` at execution time; transcript, exit statuses and date recorded above. Divergence F-28-A against the roadmap's `1.62.0` recorded. |
| 7 | `oracleWr05Wording` quadratic hang | `fixed` | — | Fixed in this plan (28-02). Three anchored beat regexes, a named `WR05_MAX_LINE_BYTES` input bound refusing by name, and a permanent regression control that was SIGTERM-killed at 20 s against the pre-fix build and returns in 0.09 s after. Verdict preservation proven by an empty byte-diff of the gate's full output. |
| 8 | determinism / prose findings | `deferred` | Phase 29 | Record-only by D-07 category 6, pre-committed before the read pass so the audit cannot turn into a style pass on prose Phase 29 is about to rewrite. Recorded by plans **28-03** and **28-06**; consumed by Phase 29's LANG-02 / LANG-05. |

**Completeness:** 8 rows, one per D-19 item, `fixed` 2 / `accepted` 1 / `deferred` 5.

### Findings raised by this sizing pass, for the register (plan 28-06)

These are not D-19 items; they were surfaced while measuring the D-19 items and would otherwise be
lost.

| Id | Category | Where | Finding |
|---|---|---|---|
| F-28-A | 4 — internal consistency | `.planning/ROADMAP.md:428` | The pre-named `@playwright/test` `1.62.0` is stale by one patch; `1.62.1` measured 2026-08-11. |
| F-28-B | 3 — claim honesty | `.planning/milestones/v2.0-phases/22-.../22-VERIFICATION.md:141` | The recorded `---\n--- \n…` shape does not reproduce against the current build; the live class is an empty-leading-slice byte invention. |
| F-28-C | 4 — internal consistency | `scripts/context-io.ts:533-537` | The stated byte round-trip contract `notes.join("") + refused === normalized` is **false for a leading refused region**, because `refused` accumulates the leading region first and is concatenated after the notes. The bytes tile the input; the stated concatenation order does not hold. The field name `trailingMalformed` carries the same wrong implication. |
| F-28-D | 5 — strangeness | `scripts/check-uat-oracles.ts:110-134` | `oracleWr05Wording` asserts four `.planning/` documents narrate a story from two milestones ago, in a repository that archives `.planning/` at milestone close. Whether it is still load-bearing is open. Recorded at its site in this plan; **deliberately not settled inside the D-20 bug fix.** |
| F-28-E | 4 — internal consistency | `.planning/phases/28-kit-consistency-audit/` | D-19 item 3 is dispositioned `fix` and no plan in the phase owns it (see row 3 above). |
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

---
phase: 28-kit-consistency-audit
plan: 04
subsystem: tooling-gates
status: complete
tags: [audit-03, d-13, d-14, d-15, d-16, d-17, d-25, claim-registry, bijection, green-on-landing]

requires:
  - scripts/audit-model.ts (readRegistry — the ONE parse authority; imported, extended, never duplicated)
  - scripts/kit-model.ts (spawnGrantScan — read only, for the stripHtmlComments absence case)
  - agent-factory/config/factory.config.json (the live safety-floor values)
provides:
  - "docs/audit/28-claim-registry.md — 38 kind-tagged claims, each mapped to a floor and measured"
  - "scripts/check-claim-anchors.js — the D-16 bijection + verbatim gate, wired at both ends, GREEN on landing"
  - "ANCHOR_RE / anchoredDocs() / claimAnchorFails()"
  - "37 <!-- claim: C-28-NNN --> anchors in README.md, AGENTS.md, agent-factory/README.md"
  - "ClaimRow.mechanism / .disposition / .findingId / .targetPhase on the one parse authority"
  - "14 findings F-28-201..214 in the reserved claim-registry id band"
affects:
  - 28-05 (must flip 6 `false` + 2 `fixed`-dispositioned `overstated` rows in the SAME commit; the gate reds if it does not)
  - 28-06 (the F-28-0NN Table B band is disjoint from this plan's F-28-2NN band)
  - 28-07 (the 6 `kind: safety` rows feed D-18's derived exclusion list)
  - Phase 29 (4 rows deferred to it; and any prose rewrite of the three anchored docs reds this gate)
  - Phase 30 (the `kind: safety` rows and their `depends_on` are AUTO-01's named target set)

tech-stack:
  added: []
  patterns:
    - "verbatim text SLICED from source by a generator, never retyped — a retyped claim is not verbatim"
    - "canonical form with a refusal outside it, extended to an anchor grammar"
    - "one grammar consulted by both the scan and the id extraction"
    - "the near-miss is a NAMED refusal, not a silently ignored comment"
    - "PARSER admits, GATE refuses — the safety_surface split reused for `mechanism`"
    - "derived scan set proven by a fixture that registers a fourth document"
    - "SET equality both directions, sorted report, byte-identical across runs"
    - "refusal cases watched RED against a deliberately permissive stub, not against a missing file"
    - "adversarial self-reproduction on the REAL tree, not only on a fixture"

key-files:
  created:
    - docs/audit/28-claim-registry.md
    - scripts/check-claim-anchors.ts
    - scripts/check-claim-anchors.js
    - scripts/check-claim-anchors.test.ts
  modified:
    - README.md
    - AGENTS.md
    - agent-factory/README.md
    - scripts/audit-model.ts
    - scripts/audit-model.js
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - package.json
    - .github/workflows/ci.yml

decisions:
  - "Claim ids are `C-28-NNN`, NOT the plan's `CLM-NNN`. The committed parse authority pins `/^C-28-\\d{3}$/` and 28-03's summary hands that form to this plan by name. Widening the parser to admit a second spelling is the exact move D-64 exists to stop."
  - "`mechanism` / `disposition` / `finding_id` / `target_phase` were added to the ONE parse authority as PASSTHROUGH fields, not required keys. The parser admits a blank one and the gate refuses it — the same split `safety_surface: —` already records. Making them required would have broken 12 committed fixtures to buy a check that belongs in a gate anyway."
  - "The claim findings CANNOT be Table B rows and are not pretended to be. `readRegister()` refuses a Table B row whose file has no Table A row, and Table A is the DERIVED 36+1 kit audit set. The findings live in the registry, in a reserved `F-28-2NN` band disjoint from 28-06's `F-28-0NN` band — one canonical form, two bands, no id naming two findings."
  - "A hard-wrapped line carrying several assertions yields ONE row whose status is the WORST measured, with every assertion named in `mechanism`. Anchors are line-granular, so the unit of registration is a region of source, not a sentence. Recorded in the registry's own prose rather than left to be discovered."
  - "Tables and lists are anchored WHOLE. An HTML comment between two pipe rows splits the rendered table and one between two list items splits the rendered list — either would break D-16's premise that the public face is unchanged."
  - "Text inside fenced code blocks is not anchorable at all — an HTML comment renders VISIBLY there. Those claims are covered by the prose rows that introduce them, and the exclusion is recorded in `## Adjudicated as NOT a claim`."
  - "`anchoredDocs()` is a function of the parsed claims rather than a module-load constant, so an unparseable registry is REPORTED by the gate instead of throwing inside every importer."

metrics:
  duration: ~95m
  tasks: 3
  commits: 3
  files-changed: 13
  completed: 2026-08-12

actuals:
  tokens: 106000
  tasks: 3
  commits: 3
---

# Phase 28 Plan 04: The Claim Registry, Anchored and Gated Summary

Thirty-eight public claims given ids, mapped to the safety floor whose lowering would falsify them
and measured against a named mechanism — fourteen of them not true — anchored invisibly in three
published documents, and held there by a bijection-and-byte-comparison gate that is green on
landing and was watched catching a simulated 28-05 miss on the real tree.

## The claim count and the per-kind breakdown

| | Rows | `true` | `overstated` | `false` |
|---|---|---|---|---|
| `safety` | 6 | 0 | 4 | 2 |
| `architecture` | 19 | 12 | 3 | 4 |
| `install` | 13 | 13 | 0 | 0 |
| **Total** | **38** | **24** | **7** | **7** |

By document: `README.md` 9, `AGENTS.md` 11, `agent-factory/README.md` 17,
`.claude-plugin/plugin.json` 1 (unanchorable). Ids are contiguous `C-28-001` … `C-28-038`,
asserted at run time.

**Every one of the four `SAFETY_FLOORS` is mapped**, and no `kind: safety` row has an empty
`depends_on` — D-14 in both directions, enforced by the gate rather than asserted here.

## The four carried-in candidates — what was MEASURED, not the verdict copied

The plan carried four verdicts from the discussion and required each to be re-measured against the
tree. **One of the four came out differently.**

### 1. *"The roles, the handoffs, and the gates are identical everywhere"* — `agent-factory/README.md`

**Measured:** `agent-factory/handoffs/` contains exactly one entry, `.gitkeep`. The sentence asserts
that a class of artifact is shipped identically across five tools when that class no longer ships at
all. I also confirmed *why no grep holds it*: `scripts/check-public-docs-vocabulary.js` reports this
file at **line 4 only** — the bare word `handoffs` at lines 35/36/49 matches no `RETIRED_PROSE_FORMS`
literal, and D-10 forbids widening the matcher to chase it.
**Verdict: `false`** (C-28-027, F-28-209). Plan agreed.

### 2. *"Coordinator spawns role agents"* — `agent-factory/README.md` dispatch table

**Measured against `.planning/REQUIREMENTS.md`, not against recollection.** What holds: SPAWN-01
`[x]` (all 17 adapters exist, generated) and SPAWN-02 `[x]` (byte-gated). What does not: **KIT-03,
SPAWN-03 and SPAWN-04 are all still `[ ]`**, and SPAWN-03's own requirement text states that the
current subagent placement *makes the grant a no-op*. `28-CONTEXT.md` records Phase 27 closing by
named user override rather than by a verification round.
**Verdict: `overstated`** — the grant exists; the spawn path's correctness is advertised ahead of its
verification (C-28-028, F-28-210, `accepted`).

### 3. *"Humans always hold merge and deploy"* — the D-19 item 4 row

Measured three ways rather than inherited from `PROJECT.md`:

1. `factory.config.json` `autonomy: "pr"` and `production_requires_human_confirmation: true`.
2. `hooks/guard.ts` denies protected-branch pushes (`git push … main|master|release/`, any force
   push) and a production-deploy verb set unless the human-set `GRUGOPS_PROD_DEPLOY_APPROVED` is
   present, and **refuses any command that tries to inline-set it**, so an agent cannot self-approve.
3. **The word that fails is `always`, and it fails for a reason wider than the plan named.**
   `hooks/hooks.json` wires that guard as a **plugin-level** PreToolUse hook, and
   `install/install.ts:1571` prints, in the installer's own output, *"the mechanical prod-deploy
   guard is Claude-Code-only (plugin hooks/hooks.json)."* So on the other **four** advertised host
   CLIs — and on the standalone `.claude/` install form — the rule is held by prompt alone. That
   sits on top of the same-uid / no-hook / direct-filesystem forgery residual `PROJECT.md` records.

**Verdict: `overstated`, backstopped by `autonomy=pr`** — which is why it is not `false`
(C-28-023, F-28-208, `accepted`). This is `docs/audit/28-residual-sizing.md` disposition row 4
becoming a registry row, as assigned. The same overstatement is recorded at two further locations
(C-28-001 `README.md`, C-28-018 `AGENTS.md` § Safety rules).

### 4. *"grugops version `0.1.0`"* — **the plan's verdict did not survive measurement**

The plan flagged this as a problem: *"plugin.json says 0.1.0, there is no root VERSION file,
agent-factory/VERSION exists, and the repo is tagged v2.0."* Every one of those facts reproduced —
and they do **not** add up to a defective claim.

**What I measured that the plan did not:** `CHANGELOG.md:8-13` carries an explicit *"A note on
versions"* stating that the artifact version in `agent-factory/VERSION` is `0.1.0`, that **no public
release has been cut**, and that `v1.0`/`v1.1`/`v1.2`/`v2.0` are **internal milestone tags, not
published SemVer releases**. That note is the mechanism that reconciles the two namespaces, and both
version artifacts agree at `0.1.0`.

**Verdict: `true`** (C-28-004, no finding). The adjacent defect is real but belongs elsewhere and is
recorded in the row's `mechanism`: **`CLAUDE.md`'s stack table names a root `VERSION` file that does
not exist on disk.** That is a CLAUDE.md finding, not a README claim defect, and manufacturing a
finding against the README to match a pre-written verdict would have been the unearned-verdict shape
T-28-21 names, pointed the other way.

## Two claims the plan did not name, found by measuring

- **C-28-003 (`README.md:14`), `overstated`.** *"Each agent is grug-brained on purpose: one job,
  short words, hard limits."* `one job` and `hard limits` hold. `short words` does not: the **18
  fenced caveman blocks** across `agent-factory/roles/*.md` total **4,036 bytes** and contain
  **zero** occurrences of `grug`. Deferred to Phase 29, which rebuilds the voice guard.
- **C-28-033 (`agent-factory/README.md:85-94`), `overstated` — found during the ANCHOR pass, not the
  read pass.** The § *How work flows* lifecycle bullet reads *"the Orchestrator routes each request
  through the relevant stages (analysis → design → engineering → QE → security/NFR → UAT →
  release)"* — a **third D-10 arrow-chain site** that neither the drift guard nor my own task-1
  sweep reached. It is `overstated` rather than `false` because the hedge *"relevant stages"* and
  the shared-verified-context clause that immediately follows are the correct v2.0 flow.
  **Dispositioned `fixed` → 28-05**, so it joins that plan's worklist.

Both were surfaced by mechanical checks, not by re-reading: the caveman one by counting bytes and
tokens, the second by a render-safety check that flagged an anchor sitting above a blank line and
sent me back into the slice.

## The rows 28-05 must flip

**Six `status: false` rows.** If 28-05 rewrites any of these sentences without updating the row in
the same commit, `check-claim-anchors.js` exits 1 — on a real commit, which is D-25's whole point.

| Id | Location | Finding | Why |
|---|---|---|---|
| C-28-001 | `README.md:4` | F-28-201 | `handoff packets` + the linear-pipeline arrow chain |
| C-28-010 | `AGENTS.md:6` | F-28-203 | *"routes work through the full lifecycle"* — contradicted by `AGENTS.md:26` in the same file |
| C-28-021 | `agent-factory/README.md:4-6` | F-28-206 | `handoff packets` (the one hit the drift guard already reports) |
| C-28-022 | `agent-factory/README.md:8-11` | F-28-207 | the linear-pipeline arrow chain |
| C-28-027 | `agent-factory/README.md:40-43` | F-28-209 | *"the roles, the handoffs, and the gates are identical everywhere"* |
| C-28-029 | `agent-factory/README.md:55-58` | F-28-211 | *"same handoffs"* |

**Two further rows carry `disposition: fixed` and are therefore also 28-05's:** C-28-033
(F-28-214, the third arrow-chain site above) and C-28-038 (F-28-213, `plugin.json`, `deferred` with
`target_phase: 28-05`).

The other five non-true rows are **not** 28-05's: F-28-205, F-28-208 and F-28-210 are `accepted`
with their residuals named, and F-28-202, F-28-204, F-28-212 are `deferred` to Phase 29.

## The `.claude-plugin/plugin.json` adjudication

**Registered as C-28-038, `kind: safety`, `status: false`, with its residual recorded rather than
implied away.**

It is a claim: the manifest `description` is public and shipped — it is what a user reads in the
plugin manager — and it carries *both* defects measured elsewhere, *"The Orchestrator routes work
through the full lifecycle"* and *"humans always hold merge and deploy"*.

**It cannot be anchored.** A JSON file cannot hold an HTML comment. So its freshness is held by the
registry row alone, and the concrete consequence is stated in the registry: *if 28-05 rewrites
`README.md:4` and forgets the manifest, the verbatim gate catches the README and says nothing about
the manifest.* The gate prints the unanchorable-row count in its PASS line on every run so the
exclusion is visible rather than silent, and the gate skips it by a derived `.md` test rather than
by a hand-listed exception.

## Green on landing, and proven to catch a real miss

```
$ node scripts/check-claim-anchors.js ; echo "exit=$?"
[check_claim_anchors] every registered claim is anchored, and its text is unchanged at its anchor (AUDIT-03 / D-16)
  PASS  38 registry row(s) — 37 markdown, 1 unanchorable (a non-markdown file cannot carry an HTML
        comment, so its freshness is held by its registry row alone); anchors found: AGENTS.md 11,
        README.md 9, agent-factory/README.md 17; 37 verbatim comparison(s) performed, all
        byte-identical; all 4 safety floor(s) mapped

== Result ==
ALL CHECKS PASSED
exit=0
```

**Adversarial self-reproduction on the REAL tree** (not only on a fixture — this repository's
recorded terminal lesson is that a green suite is not evidence for a safety mechanism). Simulating
exactly the 28-05 miss D-25 is designed to catch:

| Tree state | Gate |
|---|---|
| HEAD | **exit 0**, `ALL CHECKS PASSED` |
| `README.md`'s C-28-001 sentence rewritten, registry row untouched | **exit 1** — `README.md: the text at C-28-001's anchor (line 4) is not byte-identical to the registry's verbatim block` |
| reverted | **exit 0**, `git status --short README.md` empty |

## Proving the RED is a measurement of the checks

All 20 refusal cases were watched failing **against a deliberately permissive stub** — a module that
parsed the registry, printed a PASS line and checked nothing — while the same run showed the two
vacuous cases passing. That is what separates "the check is absent" from "the file is absent", and
it is the bar 28-03 set.

| Stage | Result |
|---|---|
| permissive stub | **20 failed / 2 passed** — and the two that passed are exactly the two that prove nothing on their own (the real-tree exit-0 case, and the `spawnGrantScan()` absence case) |
| real gate | **22 passed** |

The green-baseline fixture case was written and confirmed **first**.

**Cases that assert evidence rather than an exit code**, because asserting exit 1 alone would pass on
any failure at all: the verbatim-mismatch case asserts the message contains **both** strings **and**
both byte lengths (36 and 37); the duplicate case asserts the id, the count, **and both** files; the
consecutive-anchors case asserts both ids are recognized (neither reported missing nor unexpected)
**and** that the second anchor's claim line is the line below **it**; the end-of-file case asserts a
named refusal and that the output contains no `undefined`.

## The stripHtmlComments collision, resolved from both sides

`scripts/check-foundation-guards.ts` gained a comment block above `stripHtmlComments()` — **and
nothing else**. `git diff -U0` shows **0** added lines that are not comments and **0** removals.

**The plan's byte-identical acceptance criterion had a false premise, and the corrected form is
stronger.** The criterion asks that `node scripts/check-foundation-guards.js` output be
byte-identical to a capture taken *before task 2* — but task 2 also inserts 11 anchors into
`AGENTS.md`, and that gate prints `AGENTS.md`'s byte size. The output *must* change. I isolated the
two by restoring HEAD's guard, running it against the **already-anchored** tree, then restoring mine:

| Comparison | Result |
|---|---|
| pre-task capture vs anchored tree, HEAD's guard | **one line differs**: `AGENTS.md 7046B` → `7321B`. Arithmetic: 11 anchors × 25 bytes = 275; 7046 + 275 = **7321** ✓ (cap is 32768) |
| anchored tree, HEAD's guard **vs** anchored tree, my guard | **`diff` empty — byte-identical.** The comment block changes no output. |

A second false premise in the same criterion: `git diff -U0 … \| grep -c '^-'` **cannot** return 0,
because `--- a/<file>` matches `^-` for every file in the diff. Measured correctly (excluding the
`---` headers): **0 removals, 37 insertions**, all matching the anchor form exactly.

## Anchors verified invisible, not assumed invisible

D-16 rests on the rendered public face being unchanged. Rather than assume it, a mechanical check
ran over all 37 anchors:

| Property | Result |
|---|---|
| inside a fenced code block (would render **visibly**) | 0 |
| between two pipe-table rows (would split the rendered table) | 0 |
| between two list items (would split the rendered list) | 0 |
| followed by a blank line (would anchor nothing) | **1 — caught and fixed** |

The one hit was C-28-033, whose slice began on the blank line under `## How work flows`. Fixing it
is what sent me back into that slice and surfaced the third arrow-chain site above. Without the
check, that row would have shipped anchored to whitespace and reading `status: true`.

## Verification Results

| Check | Result |
|---|---|
| `node scripts/check-claim-anchors.js` | **exit 0**, PASS line naming rows, per-document anchor counts, comparisons and floors |
| `npm run check:claim-anchors` | exit 0, output **byte-identical** to the direct `node` run |
| `grep -c 'check-claim-anchors.js' .github/workflows/ci.yml` | `1` |
| `readRegistry()` over the registry | 38 rows, 6 safety, all with a floor; all 4 floors mapped; ids contiguous |
| `git diff -U0` over the three anchored docs, non-anchor additions | `0` |
| same, real removals (excluding `---` headers) | `0` (37 insertions) |
| `git diff -U0 scripts/check-foundation-guards.ts`, non-comment additions | `0`; removals `0` |
| foundation-guards output, comment applied vs not, same tree | **byte-identical** |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/check-kit-refs.js` / `validate-agent-factory.js` | exit 0 / exit 0 |
| `node scripts/check-public-docs-vocabulary.js` | exit 1, `19 CHECK(S) FAILED` — **unchanged**, still 28-01's intended red |
| `node scripts/check-audit-register.js` | exit 1, `2 CHECK(S) FAILED` — **unchanged**, still 28-03's intended red |
| `npm run freshness` | exit 0 — **41** committed `.js` match a fresh rebuild (was 40) |
| `npx tsc --noEmit` + `tsc -p tsconfig.tests.json` | exit 0 (both targets) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **44 files, 1525 passed, 2 skipped** (was 1503; +22 new) |
| `scripts/audit-model.test.ts` after the ClaimRow extension | **40 passed** — unchanged, no fixture broken |
| `git diff package.json` | one line, under `scripts` only — dependency blocks byte-unchanged (T-28-26) |
| `grep` for a `stripHtmlComments(` call site in the new gate | `0` (the name appears in the header only) |

The `2 skipped` tests are pre-existing and untouched.

## Prohibitions — Each Confirmed

| Prohibition | Evidence |
|---|---|
| No second registry | one kind-tagged file; `docs/audit/` gained exactly one artifact |
| No second parser | `readRegistry` **imported** from `audit-model.js`; the gate declares no parsing of its own. The authority was **extended**, which is the opposite of duplicated |
| No status asserted without a named mechanism | 38/38 rows carry a non-blank `mechanism`; the gate refuses a blank or em-dash one |
| No overstated claim left without a disposition | 14/14 non-true rows carry a `disposition` **and** a `finding_id`; every `deferred` carries a `target_phase` |
| No anchor rendered visible on GitHub | mechanical check over all 37 — none inside a fence, none splitting a table or list |
| No prose edited in the three anchored documents | `git diff` shows 37 insertions, **0** deletions, and every added line matches the anchor form exactly |
| `check-claim-anchors.ts` calls no normalizing transform | `0` call sites; the header states why, and the test asserts it |
| The verbatim comparison is exact | `Buffer.equals`; a whitespace-only-divergence case asserts a trailing space is refused |
| No package installed | `git diff package.json` touches `scripts` only |

## Threat Model — Dispositions Discharged

| Threat | Disposition | How |
|---|---|---|
| T-28-20 (anchored text changed without its row) | mitigated | exact byte comparison, no normalization before comparing, and **reproduced on the real tree** — HEAD exit 0, mutated exit 1, reverted exit 0 |
| T-28-21 (an unmeasured `status: true`) | mitigated | non-blank `mechanism` required and gate-enforced; and the four carried-in verdicts were re-measured, **one of which flipped to `true`** rather than being transcribed |
| T-28-22 (an unregistered new claim) | accepted, residual **named** | written into the gate's header as `UNKNOWN - verify` and into the registry's `## What this registry does not catch (D-16)` |
| T-28-23 (anchors in published documents) | accepted, invisibility **verified** | the render-safety check above, run rather than assumed |
| T-28-24 (`stripHtmlComments` widening) | mitigated | the gate reads raw bytes; a note beside the helper names the boundary from the other side; a case asserts the three documents are absent from `spawnGrantScan()` |
| T-28-25 (a safety claim with no `depends_on`) | mitigated | D-14 enforced in **both** directions at run time, with a fixture case per direction |
| T-28-26 (npm/pip/cargo installs) | accepted, verified | no install occurred; `package.json` diff is one `scripts` line |

## Deviations from Plan

No deviation rule 1, 2 or 4 was invoked. **Rule 3** applied twice — both times the plan's wording
was structurally impossible against committed, tested code, and both were resolved by keeping the
committed authority rather than bending it.

1. **`CLM-NNN` → `C-28-NNN` (Rule 3, blocking).** The plan restates the id form as `CLM-NNN`
   *"fixed in 28-01"*. The committed parse authority pins `CLAIM_ID_RE = /^C-28-\d{3}$/`,
   `audit-model.test.ts` has a case asserting the refusal outside that form, and 28-03's summary
   hands `C-28-NNN` to this plan **by name**. A registry using `CLM-NNN` would be refused by the
   parser on its first read. Widening the parser to admit both spellings is precisely the
   parser-widened-once-per-surprise move D-64 exists to stop, so the plan's spelling was dropped and
   the anchors read `<!-- claim: C-28-NNN -->`.
2. **Claim findings cannot be Table B rows (Rule 3, blocking).** Task 1 instructs recording each
   finding in `docs/audit/28-disposition-register.md` Table B and incrementing that file's
   `findings` count. `readRegister()` **refuses** a Table B row naming a file with no Table A row,
   and Table A is the derived kit audit set — 17 roles + 19 workflows + the protocol file. The three
   public documents are not members and cannot become members: Table A's `kind` is a closed set of
   `role | workflow | protocol`. Adding them would widen AUDIT-01's derived set inside the phase
   whose subject is maintained sets rotting, and would add three more unread rows to a gate that is
   already red on unread rows. **The disposition register was therefore not touched at all**, and
   the findings live in the registry with the reasoning written into it. The `F-28-2NN` band keeps
   them disjoint from 28-06's `F-28-0NN` Table B band — one canonical form, two reserved bands.

**Two plan premises corrected by measurement** (the false-premise failure class this repository has
hit repeatedly; 28-02 hit it twice in one plan and 28-03 once):

3. **The byte-identical foundation-guards criterion could not hold as written** — the same task
   inserts anchors into `AGENTS.md` and that gate prints `AGENTS.md`'s byte size. Replaced with the
   stronger isolation described above, which actually tests what the criterion meant.
4. **`git diff -U0 … | grep -c '^-'` returning `0` is unsatisfiable** — `--- a/<file>` matches `^-`.
   The measurement was re-run excluding the `---` headers.

**Two in-latitude implementation choices, neither a deviation:**

- **`anchoredDocs()` is a function of the parsed claims** rather than the `ANCHORED_DOCS` constant
  the plan names. A constant computed at module load would make an unparseable registry **throw**
  inside every importer, including the test file, instead of being reported by the gate — the
  library-throws / gate-reports split this tree records twice. The derivation property the plan
  actually asks for is intact and proven by the fourth-document fixture.
- **D-14 and D-17 are enforced in the gate**, not in the parser. The plan's task-1 acceptance uses a
  one-shot `node -e`; putting them in the CI-wired gate makes them durable, and it follows the
  precedent 28-03 set when it made `safety_surface: —` a legal parse value and a gate failure.

## Checkpoints

None. All three tasks were `type="auto"`; no checkpoint, decision, auth gate or architectural
question arose.

## Known Stubs

None. No placeholder, hardcoded empty value, or TODO was introduced. The 14 non-true claim rows are
**measurements**, not stubs — each carries a mechanism, a disposition and a finding, and the six
`false` ones exist deliberately under D-25 so 28-05's correction leaves an audit trail.

## For the Next Plans

- **28-05** owns eight rows: the six `false` ones plus C-28-033 and C-28-038. Flip each row's
  `status` **in the same commit** as the prose change. `node scripts/check-claim-anchors.js` exits 1
  if the sentence moves and the row does not — that is the mechanism, not an obstacle. Note
  C-28-038 (`plugin.json`) is **unanchorable**, so nothing will red if it is forgotten; it needs a
  deliberate look.
- **28-05** should also expect this gate to red **transiently** while it edits: any change to an
  anchored line reds until the row is updated. That is working as designed.
- **28-06** enters `F-28-001`…`F-28-007` into Table B. The `F-28-2NN` band is taken by this plan's
  fourteen claim findings; do not reuse it.
- **28-07** derives D-18's exclusion list from the register's `safety_surface` column **unioned with
  this registry's `kind: safety` rows** — that is C-28-001, C-28-010, C-28-018, C-28-023, C-28-032
  and C-28-038.
- **Three findings recorded here belong to files outside this plan's scope** and have no owner yet:
  `CLAUDE.md`'s stack table names a root `VERSION` file that does not exist (recorded in C-28-004's
  mechanism); the kit-write rule at `AGENTS.md` is declared *"a safety rule"* yet no `SAFETY_FLOORS`
  member holds it, so **Phase 30's claim-dropping will not reach it** (recorded in the registry's
  `## Two-sided completeness` section); and no role file states a when-absent config fallback
  (F-28-204 / F-28-212, deferred to Phase 29).
- **CI is red on two Phase 28 gates and green on this one.** All three states are recorded in the
  workflow file itself.

## Self-Check: PASSED

All four created artifacts exist on disk (`docs/audit/28-claim-registry.md`,
`scripts/check-claim-anchors.ts`, `.js`, `.test.ts`), all nine modified files are present, and all
three commits (`56b7be2`, `ce94a15`, `b33486e`) are in `git log`.

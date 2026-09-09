---
phase: 31-autonomous-manual-testing
plan: 22
subsystem: shared-verified-context
tags: [security, trust-boundary, proof-operand, derived-axes, gap-closure-round-5]
status: complete
requires:
  - "31-18 (WR-17 / D-22): the operand constraint whose second arm is CR-16"
  - "31-21 (D-24): the one non-blocking reader and the ledger-before-note order, in the same function body"
provides:
  - "originStoreIsRootAnchored — the anchoring conjunct"
  - "a single-arm, two-conjunct originIsTrusted (one return statement, asserted by parse)"
  - "the rewritten T-31-18-01, PRICED per position"
  - "R-31-22-01 / R-31-22-02 / R-31-22-03 — the narrowing's cost, the destination axis, the lexical/symlink answer"
  - "the derived decline clause ORDER axis (PART SIX-H)"
affects:
  - scripts/context-io.ts
  - scripts/context-io.js
  - hooks/hook-entry.ts
  - agent-factory/workflows/18-context-compaction.md
tech-stack:
  added: []
  patterns:
    - "one canonical form, refused by name, rather than a disjunction of arms"
    - "resolve the anchor FROM the one caller-supplied value, never from a second argument"
    - "price a disclosed residual in operations, per position, and prove every operation by subtraction"
    - "derive the ORDER, not only the SET, with a transposed whole-block mirror"
key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/compactor.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
key-decisions:
  - "D-25: a trusted proof origin has ONE recognised canonical form, and it is a CONJUNCTION — the recognised store shape AND a governance root this module resolves for itself from the one caller-supplied value; and the clause a caller is told about names the caller's own INPUT before it names the caller's ENVIRONMENT"
requirements-completed: [UATX-01]
duration: ~2h
completed: 2026-09-09
commits: 6
plan_head_before: 784c165f23f08af963b6ba8cebae6a1f393aafcd
actuals:
  tokens: 34401
  tasks: 3
  commits: 6

coverage:
  - deliverable: "CR-16 closed — an ordinary directory inside the repository, and a `.grugops/context` tree mkdir'd under one, are both refused as `origin-outside-trusted-store`"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#RED 1 / GREEN 1: an ORDINARY directory inside the repository root is refused BY NAME"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#RED 2 / GREEN 1b: the SHAPED forgery one `mkdir -p` deeper is refused by the SAME clause"
        status: pass
      - kind: test
        ref: "scripts/compactor.test.ts#an ORDINARY directory under the ambient project root is refused at the pass-through"
        status: pass
      - kind: command
        ref: "node .temp/31-22-probe/probe.mjs scripts/context-io.js ordinary — promotedId null, dest notes [], ledger delta 0"
        status: pass
  - deliverable: "no capability lost — a cross-repository store at a real governance root still promotes"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#CONTROL 1: a cross-repository store at a real governance root still PROMOTES"
        status: pass
      - kind: test
        ref: "scripts/compactor.test.ts#CONTROL: a cross-repository governed store still promotes through the pass-through"
        status: pass
  - deliverable: "the accepted residual T-31-18-01 rewritten and PRICED per position, each operation proven load-bearing by subtraction"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#CONTROL 1b: the residual's CONSTRUCTED governance root promotes, and its price is measured operation by operation"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#CONTROL 1b (the bar's OTHER position, measured rather than assumed): outside every repository the price is TWO operations"
        status: pass
  - deliverable: "WR-25 closed — the operand clause precedes the dial clause, and the ORDER is a derived axis with a transposed watched-fail mirror"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#the derived clause SEQUENCE has the expected MEMBERS in the expected ORDER"
        status: pass
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#a mirror with the TWO GUARD BLOCKS TRANSPOSED turns the ORDER assertion RED"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#WR-25 Test 2: an input that fails BOTH clauses is told about its ORIGIN, not the dial"
        status: pass
  - deliverable: "`18-context-compaction.md:56` and `:75` are true of the mechanism AS WRITTEN, each bound to a driven case"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#MOVEMENT 4 — `18-context-compaction.md:56` is bound to a DRIVEN case, not read"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#MOVEMENT 4 — `18-context-compaction.md:75` KEEPS its claim, and discloses its bar in the same bullet"
        status: pass
  - deliverable: "the frozen floors are untouched and the DECIDER_MANIFEST is MOVED rather than relaxed"
    human_judgment: false
    verification:
      - kind: command
        ref: "git hash-object hooks/guard.ts == FROZEN_GUARD_BLOB (669725bc…); npm run freshness == 60/60"
        status: pass
      - kind: test
        ref: "scripts/floor-invariance.test.ts (136 passed)"
        status: pass
  - deliverable: "CONTROL 5a / 5b — the home-rooted origin store, driven with WAVE-2 verdicts and a stated WAVE-3 expectation for 31-23"
    human_judgment: true
    rationale: "The wave-2 verdicts are asserted by test, but the WAVE-3 expectation (5a moves DECLINE -> PROMOTE, 5b stays DECLINE) is a cross-plan claim only 31-23's own PROBE 5 can measure. It is stated here so that plan has a row to re-drive and a declared movement to check it against."
---

# Phase 31 Plan 22: One Canonical Origin Form — Shape Conjoined with Root Anchoring Summary

Closed CR-16 by deleting `originIsTrusted`'s root-proximity arm and replacing the surviving
disjunction with a CONJUNCTION — the recognised store shape AND a governance root the module
resolves for itself from the origin path — and closed WR-25 by moving exactly one clause so a
caller is told about its own INPUT before it is told about its ENVIRONMENT; the price of what
remains is measured in filesystem operations per position rather than described, and three probes
found three things this plan had not anticipated.

## What shipped

| Artifact | Kind | Where |
|---|---|---|
| `originStoreIsRootAnchored` | NEW module-private conjunct: `projectRootFromWorkingDirectory(dirname(dirname(resolve(from))))` must equal that grandparent | `scripts/context-io.ts` |
| the single-arm `originIsTrusted` | CHANGED: ONE `return` of a conjunction; the `startsWith(trustedRepoRoot() + sep)` arm DELETED | `scripts/context-io.ts` |
| the rewritten `T-31-18-01` | CHANGED residual: the CONSTRUCTED GOVERNANCE ROOT, priced per position, both subtractions named | `scripts/context-io.ts` |
| `R-31-22-01` | NEW residual: the narrowing's own COST — an unconfigured cross-repository store is now refused | `scripts/context-io.ts` |
| `R-31-22-02` | NEW residual: the DESTINATION axis, decided rather than left silent | `scripts/context-io.ts` |
| `R-31-22-03` | NEW residual: the LEXICAL / symlink / case-sensitivity answer PROBE 3 measured | `scripts/context-io.ts` |
| the inverted clause order | CHANGED `promoteAdmitted`: exactly one guard moved | `scripts/context-io.ts` |
| PART SIX-H | NEW derived clause-ORDER axis: MEMBERS, LENGTH, PREMISE, two-sided SET binding, transposed whole-block mirror | `scripts/context-io-writer-set.test.ts` |
| the 31-22 corpus | NEW 22 cases across two files | `scripts/context-io.test.ts`, `scripts/compactor.test.ts` |
| the corrected sentences | CHANGED `:56` and `:75`, each bound to a driven case | `agent-factory/workflows/18-context-compaction.md` |
| the moved decider hashes | CHANGED `DECIDER_MANIFEST` (2 entries), MOVED not relaxed | `hooks/hook-entry.ts` |
| **D-25** | NEW dated gap-closure decision, appended beside D-24 | `31-CONTEXT.md` |

## Task 1 — CR-16

### RED, quoted verbatim, against the committed `scripts/context-io.js` at `784c165`

The verifier's own row-4 probe, reproduced step for step (`CLAUDE_PROJECT_DIR=<proj>`, dial
`{human_admission: high-severity, audit_retention: retained}`, bytes obtained through the ordinary
route in a recognised store under a SEPARATE lean root, then copied):

```
SEEDED 20260909T020000Z-security-nfr-finding-394a986a
COPIED-BYTES 212 to <proj>/tmp/forged
ORIGIN-endsWith(join('.grugops','context')) false
LEDGER-BEFORE 0
promotedId: "20260909T020000Z-security-nfr-finding-394a986a"
threw: null
dest notes: ["20260909T020000Z-security-nfr-finding-394a986a.md"]
dest ledger lines: 1 (delta 1)
```

`threw` was `null`, the destination holds the file, and the forged promotion APPENDED a
`disposed_by` GOV-02 event into the destination repository's committed audit trail — T-31-22-02's
consequence, measured rather than inferred. Step 2 is verbatim the action
`18-context-compaction.md:75` tells the agent is refused.

### RED 2 — the SHAPED forgery, driven in THREE columns

The plan's central premise: deleting the arm is necessary and NOT sufficient. The same bytes, the
same caller, one `mkdir -p` further on.

| column | origin | `endsWith('.grugops/context')` | result |
|---|---|---|---|
| (a) the committed `.js` at `784c165` | `<proj>/tmp/forged/.grugops/context` | `true` | `promotedId` returned, `threw: null`, dest notes 1, ledger delta 1 |
| (b) a scratch SHAPE-ONLY `originIsTrusted` | same | `true` | `promotedId` returned, `threw: null`, dest notes 1, ledger delta 1 |
| (c) post-fix | same | `true` | `promotedId: null`, `DECLINED (origin-outside-trusted-store)`, **dest notes `[]`**, **ledger delta 0** |

Column (b) is the load-bearing one: the rule this plan nearly shipped admits the forgery. A shape
rule any `mkdir` satisfies is a spelling requirement, not a constraint on the caller.

### GREEN — the post-fix measurements

```
promotedId: null
threw: "context-io.promoteAdmitted: DECLINED (origin-outside-trusted-store). The origin
        \"<proj>/tmp/forged\" is not a recognised grugops context store anchored to a governance
        root this module resolves for itself. Nothing was written. …"
dest notes: []
dest ledger lines: 0 (delta 0)
```

Identical shape for the shaped forgery at `<proj>/tmp/forged/.grugops/context`.

### GREEN 2 — the four near-misses

`<proj>/.grugops/contexts`, `<proj>/.grugops`, `<proj>/context`, `<proj>/grugops/context` — each
refused by the SAME clause, destination `notes/` empty in every case
(`scripts/context-io.test.ts#GREEN 2: four NEAR-MISS origins are each refused by the same clause`).

### CONTROL 1 — driven FIRST, because it is the case the conjunct is most likely to break

A `<other-repo>/.grugops/context` origin entirely outside `trustedRepoRoot()`, at a directory
carrying its own boundary marker and configuration: **PROMOTES**, and the destination file is
byte-identical to the origin file. Driven at the authority and at the compactor pass-through. The
deletion of the arm and the addition of the conjunct together lose nothing a host genuinely does.

### CONTROL 1b — the residual OCCUPIED, and the price MEASURED rather than assumed

Inside a repository — the position CR-16 is about, since the promoting agent runs inside one:

| construction | artifacts created | result |
|---|---|---|
| all three operations | `mkdir <forged>/.git`; write `<forged>/.grugops/factory.config.json`; `mkdir -p <forged>/.grugops/context` | **PROMOTES** |
| SUBTRACTION A — no configuration | marker + store | `DECLINED (origin-outside-trusted-store)` |
| SUBTRACTION B — no boundary marker | configuration + store | `DECLINED (origin-outside-trusted-store)` |

**Operation count inside a repository: 3.** Both subtractions decline, so all three are load-bearing
there.

**And this plan's own stated premise was measured FALSE at the other position, and is corrected
here rather than left standing.** The plan asserted the marker is load-bearing, full stop. It is
not. `projectRootFromWorkingDirectory` returns the remembered `nearest` when the walk runs out of
ancestors WITHOUT meeting a boundary, so a forged root planted where no ancestor carries a marker or
a configuration is anchored on the configuration alone:

| construction | artifacts created | result |
|---|---|---|
| outside every repository, no marker | write `<loose>/.grugops/factory.config.json`; `mkdir -p <loose>/.grugops/context` | **PROMOTES** |

**Operation count outside every repository: 2.** Both numbers are now written into `T-31-18-01`, into
the anchoring conjunct's own docstring, and into `18-context-compaction.md:75`. A residual priced at
three that holds at two is a residual priced wrong, and an unstated bar is this repository's own
recorded shape for the next round's finding. This is recorded as a cost this plan chose, not as a
pass.

### CONTROL 5a / 5b — the home-rooted origin store

The supporting measurement, driven against the committed `.js` with `HOME` at a planted root
carrying `.git` and `.grugops/factory.config.json`, cwd there, and BOTH project-directory variables
genuinely removed:

```
HOME              = <planted>/home
trustedRepoRoot() = /Users/olgeroeselg/Projects/public/grugops
answered === HOME : false
answered is the KIT: true
```

The walk asks `isAtOrAboveHome` BEFORE it inspects, returns `nearest` (null) at step 0, and
`trustedRepoRoot()` falls through to `GOVERNANCE_FALLBACK_BASE`. Measured, not reasoned.

| row | store | WAVE-2 verdict (asserted here) | WAVE-3 expectation (for `31-23`) |
|---|---|---|---|
| CONTROL 5a | `$HOME/.grugops/context` at a home carrying a marker + configuration, shared install beside it | `DECLINED (origin-outside-trusted-store)` | **PROMOTE** |
| CONTROL 5b | the same store at a home carrying NO version-control marker | `DECLINED (origin-outside-trusted-store)` | DECLINE (unmoved) |

5a's `DECLINE -> PROMOTE` movement is the **SOLE member of `31-23` PROBE 5's cross-plan
intended-change list**. 5b is the unmoved control that movement is read against, and its refusal is
`R-31-19-05`'s named cost reaching this route rather than a new finding — the case cites the
residual by id. 5a's wave-2 decline is a property of `projectRootFromWorkingDirectory`, NEVER of
`originIsTrusted`: the repair path is `31-23`, and weakening the anchoring conjunct to make 5a pass
here would restore exactly the root-proximity admission this plan exists to delete. That sentence is
written into the case itself.

### CONTROL 2, 3, 4 — the prior rounds' closures, re-measured unmoved

- **CONTROL 2** (verification row 6): the legitimate human-disposed promotion from
  `<proj>/.grugops/context` writes cleanly, returns the same id, and the destination file is
  byte-identical to the origin file. PASS.
- **CONTROL 3** (verification row 5): a promotion aimed at an OCCUPIED destination id still declines
  `destination-id-occupied` and the occupant is BYTE-UNCHANGED. PASS.
- **CONTROL 4** (`31-REVIEW.md`'s WR-18 closure), all four dial values with a LEGITIMATE origin:

| dial | clause named |
|---|---|
| `off` | `human-stamp-not-gated-at-destination` |
| absent | `human-stamp-not-gated-at-destination` |
| `high-severity` | PROMOTED |
| `all` | PROMOTED |

### EMPTY and ADJACENCY

`""`, `"   "` and `"\t"` each decline on the origin clause; the emptiness conjunct is a naming
precondition written at the site (`resolve("")` answers the process's working directory, so an
origin that names nothing would otherwise be judged against wherever the process happens to stand).
The four ADJACENCY rows are in PROBE 3 below.

### `grep -c 'trustedRepoRoot' scripts/context-io.ts`

**Before 12, after 13** — and the number that matters is the CALL count, which went 6 → 5. The
occurrence removed from `originIsTrusted` was `const trusted = resolve(trustedRepoRoot());` at the
pre-fix line **1762**. The total rose because the deletion is ARGUED at the site and in the D-25
header: five of the thirteen are calls (`1392`, `1955`, the declaration at `3717`, `4153`, `4380`)
and eight are prose explaining why the arm is gone.

### One authority

`originIsTrusted`'s body is ONE `return` statement, asserted by a case that parses the module and
counts return statements rather than by reading it. The same case asserts the callee set contains
`isRecognisedContextStore` and `originStoreIsRootAnchored` and does NOT contain `trustedRepoRoot`.
`isRecognisedContextStore` has exactly ONE caller in the whole tracked corpus
(`scripts/context-io.ts::originIsTrusted`), so no second position reuses the half-rule.

### The rewritten `T-31-18-01`, verbatim

> T-31-18-01 — the origin store is recognised by its SHAPE (a directory named `context` inside a
> directory named `.grugops`) CONJOINED with ROOT ANCHORING (that `.grugops` directory sits directly
> under a directory this module's own walk independently answers as a governance root), never by a
> registry. A caller that constructs a whole GOVERNANCE ROOT around notes it authored — a
> version-control marker, a governance configuration beneath it, and the `.grugops/context` store —
> still presents a store this route accepts. The price is stated PER POSITION, because it was
> measured rather than assumed. INSIDE a repository — the position CR-16 is about, since the agent
> that promotes runs inside one — it is three filesystem operations, named: `mkdir <forged>/.git`;
> write `<forged>/.grugops/factory.config.json`; `mkdir -p <forged>/.grugops/context`. Each of the
> three is load-bearing there and both subtractions are driven: without the configuration the walk
> answers `nearest` (null) rather than the forged root, and without the marker the walk climbs past
> and answers the REPOSITORY's own root. OUTSIDE every repository it is TWO operations — the
> configuration and the store — because the walk that meets no boundary at all answers the nearest
> configuration it remembered, which is the forged one. That second number is the cross-repository
> capability this residual keeps, priced in the same breath rather than left for a later round to
> discover. The capability is KEPT deliberately: a cross-repository compaction is a promotion a host
> genuinely performs, and Workflow 18 names the origin context root as an argument for exactly that
> reason. What it costs is bounded by, and identical to, T-31-14-03 — this route trusts what a
> recognised, root-anchored store CONTAINS. What would force it closed: a store marker the sanctioned
> writer emits and this route verifies, or an explicit registry of origin stores a caller cannot
> author. Disposition: accept.

It contains no reference to `trustedRepoRoot()`; that capability is GONE, not renamed.

**Residual register cardinality: 3 → 6** (`T-31-14-03`, `T-31-18-01`, `R-37` plus `R-31-22-01`,
`R-31-22-02`, `R-31-22-03`).

### The destination-axis disposition — DECIDED, and it is the residual

`to` is NOT constrained by the canonical form, because it is not a proof OPERAND: nothing read at
the destination is evidence FOR the promotion. Recorded as `R-31-22-02` with a reason and what would
force it closed, and driven as PROBE 2 below.

### The corrected workflow sentences

`:56`, verbatim:

> Name a real context store as the origin. The route accepts one origin shape and no other. The
> shape is a directory named `context` inside a directory named `.grugops`. The `.grugops` directory
> must sit directly under a directory the route independently resolves as a governance root. The
> shape admits another repository's own store, and it excludes a subdirectory of this one. The route
> refuses an ordinary directory whether or not that directory sits inside this repository. Proximity
> to the repository you run in is not evidence, because every directory you can create sits there. A
> caller that authors the bytes its own proof is judged against has a flag wearing a filesystem
> path, not a proof.

`:75`, verbatim — its ORIGINAL claim KEPT rather than narrowed:

> The named origin is not a context store the route recognises → stop; name the real origin context
> root. Never copy the origin notes into a directory to make the promotion pass. Copying them is
> hand-authoring a context path by another name, and the constraint refuses it. Know what the
> constraint does not refuse, and at what cost. Building a whole governance root around the copied
> notes still presents a store the route accepts. Such a root is a version-control marker, a
> governance configuration and the store directory. The cost is three filesystem operations inside
> this repository, and two outside every repository. The residual `T-31-18-01` names that
> construction, and this workflow does not sanction it. Fabricating a governance boundary to admit
> your own bytes is a stop condition of its own. Stop and hand to a human.

**Which mechanism makes the claim true:** the anchoring conjunct. Under a shape-only rule the
sentence could only have been NARROWED to "an ordinary directory", because copying the notes one
`mkdir` deeper would still make the promotion pass — measured in column (b) above.
**Which measurement sets the bar:** CONTROL 1b's two subtraction probes and the outside-every-
repository row, which is why the bullet says three AND two rather than "narrower than one `mkdir`".

Both sentences are BOUND to driven cases: `:56` to the cross-repository control, the shaped-forgery
refusal and both ordinary-directory refusals; `:75` to RED 2's refusal, the plain-copy refusal, and
the residual's own accepted case.

*(The sentences were split into shorter ones to satisfy the Phase 29 `guard_sentence_form` bounds —
WP-03's 25-word descriptive bound and WP-06's bare-demonstrative ban. `check-imperative-lexicon.js`
reports `ALL CHECKS PASSED`, and the stop-bullet count is unmoved at 42.)*

### Mutation proofs

| mutant | required outcome | measured |
|---|---|---|
| the deleted root-proximity arm RESTORED | the in-repository cases fail | **14 cases fail**, including RED 1, RED 2, the inverted `31-18` Test 3b, both compactor pass-through cases and both workflow bindings |
| the ANCHORING CONJUNCT removed (shape only) | RED 2 fails, CONTROL 1 does NOT | **10 cases fail** — RED 2, CONTROL 1b, 5a, 5b, ADJACENCY, `R-31-22-01`, both workflow bindings and the compactor's shaped-forgery case. **CONTROL 1 stayed GREEN**, so the conjunct does work no other part of the predicate does and costs no cross-repository capability |

Reverting each returns the suite to green (659 passed across the two behavioural files).

### The frozen floors

`git hash-object hooks/guard.ts` = `669725bc1c616ab57123e22090d93d57eff1b001` = `FROZEN_GUARD_BLOB`,
unchanged. The `DECIDER_MANIFEST` entries for `scripts/context-io.js` were MOVED to the re-measured
digest (`58ed2236…` → `791f854d…`), never relaxed. `package.json` byte-unchanged.

## Task 2 — WR-25

### The pre-fix derived clause order, verbatim

```
PREMISE found=true hasBody=true count=10
  1. empty-source-id
  2. unreadable-governance-config
  3. human-stamp-not-gated-at-destination
  4. origin-outside-trusted-store
  5. no-such-origin-note
  6. origin-note-not-live
  7. field-differs-from-origin
  8. body-differs-from-origin
  9. destination-id-occupied
  10. unreadable-audit-ledger
```

This matches the order `31-REVIEW.md` WR-25 prints, member for member.

### The post-fix derived clause order

```
PREMISE found=true hasBody=true count=10
  1. empty-source-id
  2. unreadable-governance-config
  3. origin-outside-trusted-store          <- moved
  4. human-stamp-not-gated-at-destination  <- moved
  5. no-such-origin-note
  6. origin-note-not-live
  7. field-differs-from-origin
  8. body-differs-from-origin
  9. destination-id-occupied
  10. unreadable-audit-ledger
```

**Exactly one clause moved; the sequence LENGTH is unchanged at 10.**

### The per-dial table — the record that resolves `docs/audit/31-round4-residuals.md` §4.4

Forged in-repository origin, measured by driving the promotion per dial value:

| dial | PRE-FIX (committed `.js` at `784c165`) | POST-FIX |
|---|---|---|
| `off` | `human-stamp-not-gated-at-destination` | `origin-outside-trusted-store` |
| absent | `human-stamp-not-gated-at-destination` | `origin-outside-trusted-store` |
| `high-severity` | **PROMOTED** (CR-16) | `origin-outside-trusted-store` |
| `all` | **PROMOTED** (CR-16) | `origin-outside-trusted-store` |

The two `off`/absent rows are WR-25 measured: the caller was told the DESTINATION's dial was the
problem, and the workflow's remedy for that clause is to WIDEN the dial. The two `high-severity`/
`all` rows are CR-16 measured in the same run.

**`31-18-SUMMARY.md` was NOT modified.** A prior round's record is history and is never rewritten.
The reconciliation of §4.4's `UNKNOWN - verify` is recorded HERE, in this table, and `31-26` resolves
that item by citing this summary rather than by editing `31-18-SUMMARY.md`.

### The consequence cases

- **Test 2** — a non-gating dial AND a forged origin (an input that fails BOTH clauses): the message
  names `origin-outside-trusted-store` and does NOT name the dial clause. Asserted by a case.
- **Test 3** — both directions: a GATING dial with a forged origin still names the origin clause; a
  LEGITIMATE origin with a non-gating dial still names `human-stamp-not-gated-at-destination`. The
  dial clause is not weakened.
- **Test 4** — an unreadable configuration AND a forged origin together yield
  `unreadable-governance-config`. That is a fail-closed PRECONDITION the route may not reason past,
  not an ordering preference, and the argument is written at the site.

### The ORDER axis (PART SIX-H), four separate cases

| case | what it asserts |
|---|---|
| MEMBERS | the derived sequence equals the decided ordered list, with a written reason for every load-bearing adjacency |
| LENGTH | 10, asserted separately — a REORDERED sequence and a RESIZED one are different events |
| PREMISE | fires on a RENAMED route (the derivation over a renamed function throws rather than reporting an empty, vacuously-ordered sequence) |
| MIRROR | a mirror with the two WHOLE guard blocks transposed fails the sequence assertion, and the dial clause is verified to actually precede the operand clause in that mirror |

Plus a two-sided binding: the ORDER's SET equals the derived decline SET in both directions, and the
cardinality is asserted as a number (10 = `EXPECTED_DECLINE_COUNT`).

*A harness correction worth recording.* The first mirror swapped only the two `if` LINES. That left
each `throw` where it was and reordered nothing, so it PASSED on the pre-fix source and proved
nothing. The mirror now swaps the two whole guard blocks, condition and body together, and asserts
the resulting sequence both differs from the expected one AND puts the dial clause first. This is
the ninth logged instance in this phase of a verification harness producing a false result about its
own premise, and it was caught by the case's own length-and-sequence assertions rather than by
reading.

### D-25

Appended to `31-CONTEXT.md` in the recorded form of D-22, D-23 and D-24.
`grep -c '^#### Gap-closure decision — D-'`: **8 before, 9 after**, differing by exactly one.
`git diff 49dfa26..HEAD -- 31-CONTEXT.md --numstat` = `230  0` — **additions only**, with the range
pinned to this round's base commit so a committed change cannot pass the check vacuously.

## Task 3 — the six standing probes, run against this plan's OWN narrowing

### PROBE 1 — HOW IS THIS GATE REACHED

Derived through PART SIX-D's own mechanism (import aliases resolved), over 74 tracked non-test
sources under `scripts/`, `hooks/` and `install/`:

```
promoteAdmitted callers (1): ["scripts/compactor.ts::promoteAdmitted"]
isRecognisedContextStore callers (1): ["scripts/context-io.ts::originIsTrusted"]
```

**Cardinality 1, identical to the count PART SIX-D recorded** (`EXPECTED_REBINDING_CALLERS`), so no
stated reason is owed. That caller was re-run with a LEGITIMATE input — a genuine `.grugops/context`
origin at a governance root, a genuinely human-disposed note, a gating destination dial — and
PROMOTES (`scripts/compactor.test.ts#CONTROL`). The pre-existing compactor CR-08 end-to-end case and
all eight per-dial route-agreement cases also still pass. **VERDICT: PASS** — no false refusal.

### PROBE 2 — DERIVE BOTH AXES (the destination)

```
a recognised store                            -> PROMOTED
an ordinary directory inside the repository   -> PROMOTED
an ordinary directory outside it              -> PROMOTED
a path that does not exist                    -> PROMOTED
a path occupied by a regular file             -> THREW: context-io.writeNoteFile: refusing to write
                                                 (note-path-not-a-regular-file)
```

| destination shape | outcome | label |
|---|---|---|
| a recognised store | PROMOTED | decided |
| an ordinary directory inside the repository | PROMOTED | **residual** `R-31-22-02` |
| an ordinary directory outside it | PROMOTED | **residual** `R-31-22-02` |
| a path that does not exist | PROMOTED (created) | decided |
| a path occupied by a regular file | refused by the write chokepoint, by name | decided (31-21, D-24 (1)) |

No destination shape produced a write the plan did not decide, and none is answered by an unnamed
exception. **VERDICT: PASS.**

### PROBE 3 — WHAT IS THE PREDICATE'S INPUT ASSEMBLED FROM

```
the plain anchored store                      -> PROMOTED
a TRAILING SEPARATOR                          -> PROMOTED
a `.` segment                                 -> PROMOTED
a `..` segment resolving into the shape       -> PROMOTED
a `..` segment resolving OUT of the shape     -> origin-outside-trusted-store
a CASE-DIFFERING spelling                     -> origin-outside-trusted-store
a SHAPED symlink at an anchored location      -> PROMOTED
a SHAPED symlink at an UNanchored location    -> origin-outside-trusted-store
TEXT has the shape, REALPATH does not         -> PROMOTED
```

| spelling | answer | decision or residual |
|---|---|---|
| the plain anchored store | accept | decided |
| trailing separator | accept | decided — `resolve()` normalises it |
| `.` segment | accept | decided — `resolve()` normalises it |
| `..` resolving INTO the shape | accept | decided — `resolve()` normalises it |
| `..` resolving OUT of the shape | refuse | decided |
| `<root>/.GRUGOPS/context` (case-differing) | refuse | decided — **`R-31-22-03`**, and the safe direction: refused by name even where the filesystem treats it as the same directory |
| symlink at an anchored, shaped location | accept | decided |
| shaped symlink under an UNANCHORED directory | refuse | decided |
| **TEXT has the shape, REALPATH is an ordinary directory** | **accept** | **`R-31-22-03`** |

**A row this plan did not anticipate.** `resolve()` is lexical, so the rule reads the LINK'S OWN
location: a symlink at `<root>/.grugops/context` whose target is an ordinary directory is accepted.
It is not a new capability — planting that link requires write access to a real governance root's
own `.grugops/` directory, which is the same authority as writing a note into its `notes/`, i.e. the
standing `T-31-14-03` residual one indirection over, and Workflow 16 forbids hand-authoring a
context path. It is now a NAMED residual with what would force it closed (comparing `realpathSync`
rather than `resolve`, which would also refuse a store legitimately delivered by a symlink and is
therefore a module-wide decision about every context root). The UNC/drive-letter spelling was not
reachable on darwin and stays `UNKNOWN - verify` for the Windows leg, per the standing WINDOWS.md
posture. **VERDICT: PASS with one finding, FIXED IN THIS PLAN** as a residual and two new driven
cases.

### PROBE 4 — AT WHICH POSITIONS IS THE PREDICATE EVEN ASKED

| position | line | is the canonical-form rule asked? | disposition |
|---|---|---|---|
| `promoteAdmitted`'s `from` | `2001` | **YES** | the proof's LEFT OPERAND — the only position where a caller-supplied root is EVIDENCE |
| `promoteAdmitted`'s `to` | — | no | `R-31-22-02`: not an operand; nothing at the destination is evidence FOR the promotion |
| `readRawNotes(task, contextRoot)` | `1474` | no | a reader, reached through `from` (already checked) or through `to` (`R-31-22-02`); it decides nothing |
| `readContext(task, contextRoot)` | `1547` | no | a public reader — reading a context is not a proof; a caller reads what it names |
| `render(task, contextRoot)` | `2986` | no | derives `index.md` / `index.jsonl` from a named store; writes no note and admits nothing |
| `appendNote`'s `contextRoot` | `1379`/`1383` | no | a NEW admission decided by `admit()` at that root; no bytes are trusted as prior evidence |
| `appendPreAdmittedNote`'s `contextRoot` | `1362`/`1366` | no | module-private, caller set derived and bounded (PART FIVE-B); its callers do the deciding |
| `admitAndAppend`'s `contextRoot` | `4132` | no | same as `appendNote` — a new admission, not a re-binding |
| `admit`'s `contextRoot` | `2672` | no | the authority itself; it reads the destination for green verdicts, which is its own D-01/D-03 contract |

No enumerated position consumes a caller-supplied context root as EVIDENCE without the rule being
asked. The one position that does is the one this plan constrained. **VERDICT: PASS.**

### PROBE 5 — EVERY SHAPE THE RESOLVER DECLINES, PROBED WITH A LEGITIMATE INPUT

One fixture constructed per clause, each satisfying exactly that clause:

```
empty-source-id                        a non-empty source id naming a real origin note            -> PROMOTED
unreadable-governance-config           a readable factory.config.json at the standard location    -> PROMOTED
origin-outside-trusted-store           a recognised store anchored to its own governance root     -> PROMOTED
human-stamp-not-gated-at-destination   a destination dial of `all`, which gates this note         -> PROMOTED
no-such-origin-note                    the named id exists at the origin beside a decoy           -> PROMOTED
origin-note-not-live                   a LIVE note in a store that also holds a superseded one    -> PROMOTED
field-differs-from-origin              a faithful carry-forward: every field identical            -> PROMOTED
body-differs-from-origin               a faithful carry-forward: the body identical               -> PROMOTED
destination-id-occupied                a destination already holding a DIFFERENT id               -> PROMOTED
unreadable-audit-ledger                a readable ledger under retained already holding 1 line    -> PROMOTED
```

**Ten clauses, ten legitimate inputs, zero false refusals.** This is the probe that found CR-08 in
round 3 and CR-11's blast radius in round 4, and it is the direct guard against this plan's
narrowing over-refusing. **VERDICT: PASS.**

### PROBE 6 — WHAT DOES THIS WRITE PATH DO TO A PRE-EXISTING DESTINATION

```
empty destination                        -> PROMOTED
destination holding the IDENTICAL note   -> PROMOTED   (an idempotent no-op)
destination holding DIFFERENT bytes      -> destination-id-occupied
…and those bytes are                     -> BYTE-UNCHANGED
the empty destination now holds          -> ["20260909T020000Z-security-nfr-finding-f21190aa.md"]
```

CR-11's closure is intact through the changed clause order. **VERDICT: PASS.**

### Did any probe find a defect?

**Yes — one, and it is FIXED IN THIS PLAN rather than deferred.** PROBE 3's lexical/symlink row.
It is now `R-31-22-03` in the published register and two new driven ADJACENCY cases. All six probes
ran; "none" was never the answer to a probe that was not run.

### Probe artifact cleanup

```
test ! -e .temp/31-22-probe                                  -> PASS
find . -path ./node_modules -prune -o -type p -print         -> (prints nothing)
git status --short                                           -> only the four pre-existing entries
                                                                that are not this plan's
```

**`git status --short .temp` is NOT the check, and here is why:** `.temp/` is gitignored at
`.gitignore:19`, so that command prints nothing whatever the directory holds — it is inert as a
cleanup predicate and would pass over a probe tree that survived. The predicates above can observe
their target: `test ! -e` reads the filesystem directly, and the FIFO sweep walks it.

## Deviations from Plan

### [Rule 1 - Bug] The plan's stated price of THREE operations is wrong at one of two positions

- **Found during:** Task 1, CONTROL 1b's SUBTRACTION B.
- **Issue:** The plan asserted, in `must_haves.truths` and in the threat register, that dropping the
  boundary marker makes the walk "climb past" and refuse. Driven at a forged root planted OUTSIDE
  every repository, it does not: `projectRootFromWorkingDirectory` answers the remembered `nearest`
  when it runs out of ancestors without meeting a boundary, so the configuration alone anchors it.
  The price there is TWO operations, not three.
- **Fix:** The price is now stated PER POSITION — three inside a repository (CR-16's own position,
  all three proven load-bearing by subtraction), two outside every repository — in `T-31-18-01`, in
  `originStoreIsRootAnchored`'s docstring, in `18-context-compaction.md:75` and in D-25. A second
  driven case measures the two-operation position explicitly.
- **Files modified:** `scripts/context-io.ts`, `scripts/context-io.test.ts`,
  `agent-factory/workflows/18-context-compaction.md`, `31-CONTEXT.md`.
- **Commit:** `12c7733`, `d4bdad2`.

### [Rule 2 - Missing critical] The narrowing removes a capability the plan did not name

- **Found during:** Task 1, driving CONTROL 1 with the shape the plan literally described (a
  cross-repository root carrying only `.git`).
- **Issue:** The anchoring conjunct asks the module's own walk, and that walk answers `nearest`
  (null) at a boundary carrying NO governance configuration. A checkout with a `.grugops/context`
  store and no `factory.config.json` is therefore refused as an ORIGIN, where the deleted arm
  accepted it by shape. That is a real capability loss the plan's own "must not silently remove a
  capability" prohibition requires be named.
- **Fix:** `R-31-22-01`, with the cost BOUNDED by measurement (`install.js` seeds
  `.grugops/factory.config.json` into every target it touches, so this reaches only a store created
  by the minimal markdown-copy path) and with what would force it closed stated — anchoring on a
  boundary marker alone, which would drop the forged-origin price to two operations and is therefore
  refused. A driven case asserts the refusal.
- **Commit:** `12c7733`.

### [Rule 2 - Missing critical] The lexical/symlink answer was undecided

- **Found during:** Task 3, PROBE 3.
- **Issue:** A symlink at a correctly-shaped, ANCHORED location whose realpath is an ordinary
  directory is ACCEPTED. The plan's edge-probe row 4 required this be "recorded as a decision or a
  residual" and it was neither.
- **Fix:** `R-31-22-03`, with the argument for why it is not a new capability, the converse
  case-sensitivity answer, and what would force it closed. Two new driven ADJACENCY cases.
- **Commit:** `d71b7a5`.

### [Rule 3 - Blocking] The 31-18 root-proximity test and nine store fixtures

- **Found during:** Task 1 GREEN.
- **Issue:** `31-18` Test 3b asserted exactly the arm CR-16 measured, and 45 existing cases built
  origin stores as bare `<tmp>/.grugops/context` with no governance root above them.
- **Fix:** Test 3b was INVERTED to assert the refusal, with the reasoning it used and why the
  round-5 verifier disproved it written into the case. Nine store fixtures across three test files
  now plant a boundary marker and a configuration at the store's grandparent, so a fixture that
  represents a legitimate origin IS one. The FIFO-ledger driver's inlined origin project was
  anchored the same way, or it would have measured the origin clause instead of the ledger clause.
- **Commit:** `12c7733`.

### [Rule 1 - Bug] The first ORDER mirror transposed nothing

- **Found during:** Task 2 RED.
- **Issue:** The mirror swapped only the two `if` lines, leaving each `throw` in place, so the
  derived sequence was unchanged and the "control" passed on the pre-fix source.
- **Fix:** The mirror now swaps the two WHOLE guard blocks and asserts both that the sequence
  differs from the expected one and that the dial clause actually precedes the operand clause in it.
- **Commit:** `4378755`.

**Total deviations:** 5 auto-fixed (2× Rule 1, 2× Rule 2, 1× Rule 3). **Impact:** three of the five
are findings against this plan's own premises rather than against the code it changed, which is the
outcome the round-history law predicts and the reason Task 3 exists. All are closed inside this plan.

## Authentication Gates

None.

## Known Stubs

None. Every case added is driven against the committed `.js`; no `t.skip`, no `test.todo`, and no
`<verify>` command went unrun.

## Threat Flags

None. This plan removes surface rather than adding it: no new endpoint, no new auth path, no new
file-access pattern and no schema change. The three residuals it publishes are all NARROWER than the
capability they replace, except `R-31-22-01`, which is a REFUSAL and therefore not surface.

## Issues Encountered

**One process incident, recorded because it nearly cost the plan.** During the mutation-proof setup
a `git checkout -- scripts/context-io.ts` was run against an UNCOMMITTED source, which reverted all
of Task 1's implementation, and the mutation harness's own `cp`-to-`.orig` backup had already been
overwritten by the reverted file in the same run. The work was reconstructed deterministically by
re-applying the recorded patch scripts, verified by rebuild and full suite, and the mutation proofs
were then re-run only AFTER the implementation had been committed, so `git checkout` was a safe
revert rather than a destructive one. The lesson is the one the executor protocol already states and
this run temporarily forgot: never use a blanket working-tree revert on a file whose only copy is
uncommitted.

## Verification

| check | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **3777 passed, 2 skipped, 62 test files** (the one failure at the time of measurement was `hooks/hook-entry.ts has no uncommitted modification`, which passes once the manifest move is committed — re-run green at `d71b7a5`) |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `node scripts/check-imperative-lexicon.js` | `ALL CHECKS PASSED` |
| `npm run build && npm run typecheck` | clean |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `git hash-object hooks/guard.ts` | `669725bc1c616ab57123e22090d93d57eff1b001` = `FROZEN_GUARD_BLOB` |
| `package.json` | byte-unchanged since the round base |
| workflow stop-bullet count | 42, unmoved |

## Next

Ready for `31-23`, which rewrites `projectRootFromWorkingDirectory` — the walk this plan's anchoring
conjunct now consumes. Its PROBE 5 must re-drive CONTROL 5a and 5b, with 5a's `DECLINE -> PROMOTE`
movement declared as the sole member of its cross-plan intended-change list and 5b as the unmoved
control that movement is read against.

## Self-Check: PASSED

Every file this summary claims was modified exists on disk; every commit hash it cites resolves in
`git log --oneline --all`.

```
FOUND: scripts/context-io.ts                 FOUND: hooks/hook-entry.ts
FOUND: scripts/context-io.js                 FOUND: hooks/hook-entry.js
FOUND: scripts/context-io.test.ts            FOUND: agent-factory/workflows/18-context-compaction.md
FOUND: scripts/context-io-writer-set.test.ts FOUND: .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
FOUND: scripts/compactor.test.ts             FOUND: .planning/phases/31-autonomous-manual-testing/31-22-SUMMARY.md

FOUND: dbb4150  test(31-22) RED — CR-16
FOUND: 12c7733  feat(31-22) the conjunction
FOUND: 4378755  test(31-22) RED — WR-25
FOUND: d4bdad2  fix(31-22) the clause order + D-25
FOUND: d71b7a5  test(31-22) PROBE 3 / R-31-22-03
FOUND: 7299101  docs(31-22) this summary
```

`git rev-list --count 784c165..HEAD` = **6**, measured from the on-disk plan ledger, which is the
number recorded in `commits:` and in `actuals.commits`.

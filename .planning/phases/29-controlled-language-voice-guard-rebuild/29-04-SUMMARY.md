---
phase: 29-controlled-language-voice-guard-rebuild
plan: 04
subsystem: testing
tags: [typescript, guards, lang-03, frozen-set, git-diff, disposition, fail-closed]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "kit-model.ts listRoles/listWorkflows + ROLE_COUNT/WORKFLOW_COUNT, the two-sided derived-set pin, and the CHECK_ROOT hermetic-mirror seam"
  - phase: 28-kit-consistency-audit
    provides: "the 41-file safety-surface exclusion list and its stated per-file granularity limit, the claim registry's 42 verbatim anchors already byte-compared by check-claim-anchors.ts, the D-24 RED-before-GREEN discipline, and check-nul-bytes.ts's fail-closed git() wrapper contract"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 01
    provides: "voice-model.ts normalizeSentence + segmentClauses (the one sentence-identity pair) and vacuity.ts reportMeasured"
provides:
  - "scripts/check-diff-disposition.ts — guard_diff_disposition, the LANG-03 gate: the frozen set DERIVED from three existing gates, the changed set derived from git, and a per-change disposition requirement neither side can go stale against"
  - "deriveFrozenSet(root) — four derivations asserted two-sided: 42/42 registry verbatim anchors, 17/17 role `## Hard limits`, 19/19 workflow `## Stop conditions`, 19/19 workflow `## Commit`"
  - "POSITIVE_GUARD_LITERALS — 9 literals EXTRACTED from the guards that require them present, pinned two-sided at POSITIVE_GUARD_LITERAL_COUNT"
  - "changedClauses(base, files) — both sides of the diff, added from the working tree and removed from the base blob, each carrying the frozen region located in the text it came from"
  - "FROZEN_SOURCES / FROZEN_SECTION_ANCHORS / DISPOSITION_DIR / BASE_FILE / locateSection / touchedLines"
  - "docs/audit/29-style-dispositions/ — the walked disposition directory with a recorded, resolvable base commit and a written row contract"
  - "kit-model.ts exports ROLES_SUBPATH and WORKFLOWS_SUBPATH; audit-prepass.ts's two local copies deleted"
  - "the npm script check:diff-disposition and one bare CI invocation, with fetch-depth: 0 on the job checkout"
affects: [29-05, 29-06, 29-07, 29-08, 29-09, 29-10, 29-11, 29-12, 29-13]

actuals:
  tokens: 90296
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Invert the enforcement: derive one side from the filesystem and the other from git, so neither side is a list anyone can forget to update"
    - "Read BOTH sides of a diff when the predicate is about text that CHANGED — the old text is only on the removed side"
    - "Freeze a section POSITIONALLY and a contract TEXTUALLY; a reword defeats text equality and cannot defeat a heading"
    - "Extract a literal from the source that declares it, with a canonical form and a two-sided count, when the declaring module cannot be imported"
    - "A clean-tree arm kept DISTINCT from the vacuity floor, with an explicit refusal between them so a non-empty diff can never reach the clean arm"

key-files:
  created:
    - scripts/check-diff-disposition.ts
    - scripts/check-diff-disposition.js
    - scripts/check-diff-disposition.test.ts
    - docs/audit/29-style-dispositions/00-base.md
    - docs/audit/29-style-dispositions/README.md
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/audit-prepass.ts
    - scripts/audit-prepass.js
    - scripts/check-claim-anchors.test.ts
    - package.json
    - .github/workflows/ci.yml

key-decisions:
  - "D-05 executed as a TWO-SIDED diff read: reading only the added side was a fail-open, because a reword's frozen clause exists only on the removed side"
  - "D-01 source (b) enforced POSITIONALLY rather than by text equality — the reword is exactly the case text equality cannot see"
  - "D-01 source (c) EXTRACTED from check-foundation-guards.ts rather than retyped, because that module runs at load and cannot be imported; the extractor has a canonical form and a two-sided count"
  - "D-01's third positive guard literal (`UNKNOWN - verify`) does not exist as one — measured and RECORDED rather than manufactured"
  - "The watched corpus IS the LANG-03 exclusion list, taken from safetySurfaceUnion() rather than by parsing the generated document"
  - "The clean-tree arm is separate from reportMeasured's zero floor, with an explicit refusal between them"
  - "The disposition row's seventh column (`companion`) is what a frozen intersection is refused without; a dash does not satisfy it"

patterns-established:
  - "When a predicate compares 'what changed' against 'what is protected', ask which SIDE of the diff carries the protected text — the answer for a reword is the removed side"
  - "An extractor over source is acceptable in place of an import only with a canonical form, a refusal outside it, and a two-sided count over the result"
  - "A gate whose green means 'nothing changed' must say so in its own PASS line, and its CI comment must say it too"

requirements-completed: []

coverage:
  - id: D1
    description: "A named safety-surface exclusion is honoured by DERIVATION from three existing gates rather than by a hand-authored protected-sentence list (LANG-03)"
    requirement: "LANG-03"
    verification:
      - kind: integration
        ref: "node scripts/check-diff-disposition.js — the PASS line reports all four D-01 derivations at full cardinality (42/42, 17/17, 19/19, 19/19) plus 9 positive guard literals; exit 0"
        status: pass
      - kind: unit
        ref: "check-diff-disposition.test.ts#the harness premises — FROZEN_SOURCES has exactly the three D-01 keys, and every extracted literal is asserted present verbatim in the source that declares it"
        status: pass
      - kind: other
        ref: "`grep -c 'sentences you may not touch' scripts/check-diff-disposition.ts` = 1, inside the header paragraph that REFUSES the file; no protected-sentence literal exists anywhere in the gate"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every changed kit clause is either refused as a frozen intersection lacking its companion edit, or carries a disposition row in a walked directory (LANG-03, D-04, D-05)"
    verification:
      - kind: integration
        ref: "REPRODUCTION 1 — a reworded role `## Hard limits` sentence exits 1 with 2 findings over 2 clauses against a planted temp-dir git repository (transcript below)"
        status: pass
      - kind: integration
        ref: "REPRODUCTION 2 — an undispositioned added clause exits 1 with 1 finding over 1 (transcript below)"
        status: pass
      - kind: unit
        ref: "check-diff-disposition.test.ts#GREENs the same change once a disposition row names the companion edit — exit 0, and the fold ran over real elements rather than the clean-tree arm"
        status: pass
      - kind: unit
        ref: "check-diff-disposition.test.ts#does NOT treat a shared prefix as an intersection — the premise (prefix, not equality) is asserted before the case"
        status: pass
    human_judgment: false
  - id: D3
    description: "The gate fails closed on every input it cannot derive, and reports a verdict rather than a stack trace"
    verification:
      - kind: unit
        ref: "check-diff-disposition.test.ts#unresolvable base — exit 1, the git command and the mirror root are in the message, and no `    at file:line:col` frame reaches the output"
        status: pass
      - kind: unit
        ref: "check-diff-disposition.test.ts#a base_commit outside the canonical 40-character form is refused rather than resolved on a guess"
        status: pass
      - kind: unit
        ref: "check-diff-disposition.test.ts#a SHORT D-01 derivation exits 1 naming the derivation and BOTH counts (16 of 17)"
        status: pass
      - kind: unit
        ref: "check-diff-disposition.test.ts#a changed watched file deriving ZERO clauses exits 1 as a check that was NOT performed; an empty disposition directory exits 1 naming the directory"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rejected heuristic and the human-judgement residual are both recorded in source (D-03)"
    verification:
      - kind: other
        ref: "the gate's header carries D-03's permission-bearing-sentence alternative with its reason, and states that the structural-section derivation asks WHERE a sentence sits and never what words it contains"
        status: pass
      - kind: other
        ref: "`grep -c 'UNKNOWN - verify' scripts/check-diff-disposition.ts` = 4 — the human-judgement residual, the D-01 source (c) correction, and their headers"
        status: pass
    human_judgment: true
  - id: D5
    description: "The gate is wired at both ends and CI has the history it needs; the wave-4 gate state is measured rather than assumed"
    verification:
      - kind: integration
        ref: "npm run check:diff-disposition exits 0; ci.yml carries exactly one bare invocation and `fetch-depth: 0` with its reason on the setting"
        status: pass
      - kind: unit
        ref: "check-diff-disposition.test.ts#wiring — the CI invocation count, the checkout setting AND its reason comment, and the package.json script value are asserted together"
        status: pass
      - kind: other
        ref: "all five phase-29 gate exit codes re-measured at the close of this plan (table below)"
        status: pass
    human_judgment: false

duration: 70min
completed: 2026-08-13
status: complete
---

# Phase 29 Plan 04: guard_diff_disposition — the Frozen Set Derived, the Changed Set Enumerated Summary

**LANG-03's safety-surface exclusion is now honoured without a single protected sentence being written down: the frozen set is derived from three gates that already exist at 42/17/19/19 asserted two-sided, the changed set is derived from git, and the gate was watched refusing both a reworded `## Hard limits` sentence and an undispositioned clause against real planted git repositories.**

## Performance

- **Duration:** 70 min
- **Tasks:** 3
- **Commits:** 3
- **Files changed:** 12 (5 created, 7 modified)

## Accomplishments

- `scripts/check-diff-disposition.ts` (1,240 lines) inverts the enforcement per D-05. One side is
  derived from the filesystem, the other from git, and neither is a list anyone can forget to update.
- **The frozen set derives from three existing gates, each asserted two-sided.** Source (a) is
  consumed from the claim registry that `check-claim-anchors.js` already byte-compares live and
  green. Source (b) is located by heading through `kit-model`'s listers. Source (c) is extracted from
  the guards that require each literal present.
- **A reword is caught on the removed side, and that was a fail-open before it was a feature.**
  Reading only the added side, a reworded frozen sentence produces text that — by construction — is
  no longer the frozen text, so it would have matched nothing and needed only an ordinary row. The
  clause that WAS frozen exists only in the base blob.
- **The structural sections are frozen POSITIONALLY.** Text equality cannot see a reword; a heading
  can. The anchors and the guard literals stay textual, because those are wording contracts rather
  than regions.
- The gate **fails closed on every input it cannot derive** — an unresolvable base, a malformed
  `base_commit`, an unreadable frozen source, a short derivation, a changed corpus deriving zero
  clauses, an empty disposition directory — and every one of them is a `FAIL` line rather than a
  stack trace.
- `docs/audit/29-style-dispositions/` ships with a resolvable recorded base commit and a written
  contract every content plan from wave 5 onward can follow without inventing a format.
- **20 hermetic cases** drive the committed `.js` against real temp-dir git repositories with two
  commits each, every one asserting `status` explicitly.

## Verbatim evidence

### The four D-01 derivation cardinalities

`node scripts/check-diff-disposition.js`, tree at HEAD, 2026-08-13 — **exit code 0**:

```
[guard_diff_disposition] every clause changed in the LANG-03 watched corpus is dispositioned, and a frozen intersection carries its same-commit companion edit (LANG-03, D-01..D-05)
        watched corpus: 40 markdown file(s) of the 41-entry LANG-03 safety-surface union; 1 non-markdown entr(ies) named and not watched (.claude-plugin/plugin.json — a clause is a unit of prose, and this gate reports no verdict over a file that carries none)
        frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17, workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9/9; 394 frozen clause(s), 55 frozen region(s); base 4d2b8f0
  PASS  LANG-03: ZERO of the 40 watched file(s) differ from the recorded base 4d2b8f0, so there is no changed clause to disposition — a clean tree, not a vacuous pass. The frozen set derived at full cardinality: registry verbatim anchors 42/42, roles `## Hard limits` 17/17, workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9

== Result ==
ALL CHECKS PASSED
```

| derivation | derived | expected | source |
|---|---:|---:|---|
| registry verbatim anchors | **42** | 42 | `readRegistry().claims` — consumed from `check-claim-anchors.ts`'s freeze, not re-parsed |
| role `## Hard limits` | **17** | 17 (`ROLE_COUNT`) | `kit-model.listRoles()` + `locateSection` |
| workflow `## Stop conditions` | **19** | 19 (`WORKFLOW_COUNT`) | `kit-model.listWorkflows()` + `locateSection` |
| workflow `## Commit` | **19** | 19 (`WORKFLOW_COUNT`) | `kit-model.listWorkflows()` + `locateSection` |
| positive guard literals | **9** | 9 (`POSITIVE_GUARD_LITERAL_COUNT`) | extracted from `check-foundation-guards.ts` |
| **frozen clauses (union)** | **394** | — | `segmentClauses` over all of the above |
| **frozen regions** | **55** | 17+19+19 | the positional half |

D-01 states 38 registry anchors; the measured answer is **42**, because plan 29-02 registered four
more when it shipped `agent-factory/writing-profile.md`. The gate pins against the registry's own row
count rather than against the decision's number, so this moved without an edit.

### The recorded base commit

```
base_commit: 4d2b8f079cc43d7d6184729966492789fb4dc05e
```

`git cat-file -e 4d2b8f079cc43d7d6184729966492789fb4dc05e` resolves. It is the commit immediately
preceding this plan's first content commit (`4d2b8f0 docs(29-03): complete the controlled-language
gate plan`).

### REPRODUCTION 1 — the frozen intersection, planted git repository, exit 1

A role's `## Hard limits` sentence reworded, with a disposition file present carrying an unrelated
row (so the case is isolated to the frozen refusal rather than the empty-directory one):

```
        1 watched file(s) changed since 6c1bc70; 2 changed clause(s) derived; 1 disposition row(s) across 1 file(s)
  FAIL  diff disposition: 2 finding(s) over 2 elements
        agent-factory/roles/agents-md-scribe.md:11 (added) — FROZEN by structuralSections: a structural section located by heading — role `## Hard limits`, workflow `## Stop conditions`, workflow `## Commit`
        clause: "keep diff small for one ticket and never move architecture without adr"
        region: `## Hard limits`, lines 10-12
        Owed companion edit: a disposition row under docs/audit/29-style-dispositions/ whose `companion` cell names the section and the reason.
        There is no override tier and no blanket exemption (D-04). Make the companion edit in the same commit; do NOT narrow the watched corpus and do NOT move the recorded base commit forward — both clear the finding by deleting its evidence
        agent-factory/roles/agents-md-scribe.md:11 (removed) — FROZEN by structuralSections: a structural section located by heading — role `## Hard limits`, workflow `## Stop conditions`, workflow `## Commit`
        clause: "make small diff for one ticket and never change architecture without adr"
        region: `## Hard limits`, lines 10-12
        Owed companion edit: a disposition row under docs/audit/29-style-dispositions/ whose `companion` cell names the section and the reason.
        There is no override tier and no blanket exemption (D-04). Make the companion edit in the same commit; do NOT narrow the watched corpus and do NOT move the recorded base commit forward — both clear the finding by deleting its evidence

== Result ==
1 CHECK(S) FAILED

exit code: 1
```

**This transcript is also the proof that both sides of the diff are read.** The same edit is reported
twice, and the `(removed)` finding is the one carrying the frozen clause. The `(added)` clause is new
text that matches nothing frozen — which is exactly why an added-side-only gate would have let the
reword through under an ordinary disposition row.

The identical mirror **with** a row whose `companion` cell is filled exits **0**, and its output
carries `diff disposition: 0 findings over 2/2 elements` rather than the clean-tree line — so the
fold ran over real elements.

### REPRODUCTION 2 — the undispositioned change, planted git repository, exit 1

```
        1 watched file(s) changed since bba98e5; 1 changed clause(s) derived; 1 disposition row(s) across 1 file(s)
  FAIL  diff disposition: 1 finding(s) over 1 elements
        agent-factory/workflows/00-bootstrap-greenfield.md:14 (added) — no disposition row
        clause: "every reviewer reads acceptance scenario before diff"
        Remedy: add a row to your plan's file under docs/audit/29-style-dispositions/ naming the file, the line, the clause before and after, the profile rule id or decision that drove it, and the disposition. A row matches when it names this file and either its `before` or its `after` normalizes to this clause

== Result ==
1 CHECK(S) FAILED

exit code: 1
```

Both reproductions are **permanent cases** in `scripts/check-diff-disposition.test.ts`, re-run on
every suite run, not a historical commit nobody can reproduce.

### The nine positive guard literals, extracted rather than retyped

| # | guard | declaration | literal |
|---:|---|---|---|
| 1 | `guard_adapter_body` | `MEMORY_FORM_SPECIALIST` | `The shared verified context is the only memory — read what earlier roles published, …` |
| 2 | `guard_adapter_body` | `MEMORY_FORM_COORDINATOR` | `The shared verified context is the only memory — never relay data between agents.` |
| 3 | `guard_adapter_body` | `MEMORY_FORM_SKILL` | `The shared verified context is the only memory — require typed notes per …` |
| 4–9 | `guard_wr05` | `TIER_BEATS[].needle` | `- **Full** —` · `- **Reduced** —` · `- **Degraded** —` · `The grant is **not** runtime-enforced here` · `Pick it by whether the \`Agent\` tool is available to you — capability-sensing` · `a default main thread, what \`/grugops\` gets` |

### The wave-4 gate state, measured rather than inferred

| gate | exit | why |
|---|---|---|
| `node scripts/check-foundation-guards.js` | **1** | the 29-01 baseline, **unchanged**: exactly `caveman voice` 17/17 and `role clause uniqueness` 12/17. Green when 29-05..07 land the role rewrites |
| `node scripts/check-imperative-lexicon.js` | **1** | the 29-03 baseline, unchanged: `guard_imperative_lexicon` 81/125 and `guard_sentence_form` 264/1816. Green when 29-08..12 land the corpus rewrites |
| `node scripts/check-banned-claims.js` | **0** | — |
| `node scripts/check-diff-disposition.js` | **0** | clean tree — no watched file differs from the recorded base |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **0** | 51 files, **1,724 passed, 2 skipped** (baseline 50 / 1,704 / 2) |

Every other repo gate re-run and green: `check-claim-anchors`, `check-audit-register`,
`check-kit-refs`, `check-nul-bytes`, `check-public-docs-vocabulary`, `check-uat-oracles`,
`coordinator-resolution-precheck`, and `validate-agent-factory` (with `VALIDATE_KIT_ROOT=.`, which
that gate requires by design and refuses to default).

### Exit codes, counts and wall clock

| measurement | value |
|---|---|
| `npm run build` / `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **48** committed `.js` pairs (47 + `check-diff-disposition`) |
| `npm run check:diff-disposition` | exit 0 |
| new cases | **20** — all in `scripts/check-diff-disposition.test.ts` |
| gate wall clock, 3 runs | **0.23 s / 0.23 s / 0.24 s** over 40 watched files, 42 registry rows and a 2,900-line guard source |
| `.planning/STATE.md` longest line | **7,994** (§F-2 baseline 7,994 — unmoved) |
| `.planning/STATE.md` backslash runs | **0** |
| CI steps before | 8 gate invocations in the ubuntu-only block |
| CI steps after | **9** — one bare `node scripts/check-diff-disposition.js` added between the imperative-lexicon and NUL-byte steps |
| checkout step before | `actions/checkout@v4`, no `with:` block (shallow, depth 1) |
| checkout step after | `actions/checkout@v4` with `fetch-depth: 0` and the reason on the setting |
| `git diff 4d2b8f0..HEAD -- package.json` | one `scripts` entry added; **zero** dependency lines touched |

**No other gate's behaviour changes when the full history is present.** The eight pre-existing gate
invocations were re-run locally against this repository's full history (which is what a developer
machine has always had) and every one is unchanged; the only consumer of history depth in the tree
is `check-nul-bytes.js`, which uses `git ls-files` — an index operation that does not read commits.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] Reading only the ADDED side of the diff was a fail-open on the case the gate exists for**

- **Found during:** Task 2, designing `changedClauses`.
- **Issue:** the plan says the gate "computes the changed lines over the kit corpus … then segments
  and normalizes them". Implemented over the added side alone, a REWORD of a frozen sentence
  produces added text that is — by construction — no longer the frozen text. It would have matched
  no frozen clause and needed only an ordinary disposition row. The frozen sentence exists only on
  the REMOVED side, in the base blob.
- **Fix:** `changedClauses` reads both sides — added lines segmented from the working tree, removed
  lines segmented from `git show base:path`. Each clause carries its `side`, and REPRODUCTION 1
  above shows the same edit reported twice with the frozen clause on the removed one.
- **Files modified:** `scripts/check-diff-disposition.ts`.
- **Commit:** `7486da7`

**2. [Rule 2 — Missing critical functionality] Text equality alone cannot freeze a section against a reword**

- **Found during:** Task 2, same analysis.
- **Issue:** even reading both sides, a text-equality-only rule reports the removed clause and lets
  the added one pass as ordinary. D-01 source (b) is not a wording contract; it is a REGION.
- **Fix:** the structural sections are frozen POSITIONALLY — a changed line inside a role
  `## Hard limits` or a workflow `## Stop conditions` / `## Commit` is an intersection regardless of
  what it now says. Sources (a) and (c) stay textual, because those genuinely are wording contracts.
  The region is located in the text the clause came from (base blob for removed, working tree for
  added), since asking where a deleted line is *now* drifts by exactly the lines added above it.
- **Files modified:** `scripts/check-diff-disposition.ts`.
- **Commit:** `7486da7`

**3. [Rule 3 — Blocking] `check-foundation-guards.ts` cannot be imported, and the plan says not to retype its literals**

- **Found during:** Task 2, wiring D-01 source (c).
- **Issue:** the plan requires taking the positive guard literals "from the guard that requires each
  one rather than retyping". `check-foundation-guards.ts` runs its twelve guards at module load and
  calls `process.exit` — it has no `isEntry` guard — so it cannot be imported the way
  `check-claim-anchors.ts` is imported for the registry. Wrapping a 2,900-line aggregator's run
  block was outside this plan's file set and would have put the wave-4 baseline at risk.
- **Fix:** the literals are EXTRACTED from the declaring source by name, with a canonical form
  (`const NAME =` or a `needle:` field, followed by whitespace and one double-quoted literal), a
  named refusal outside it, and a two-sided count over the result. A renamed or deleted declaration
  is a refusal, not a silently smaller frozen set.
- **Files modified:** `scripts/check-diff-disposition.ts`.
- **Commit:** `7486da7`

**4. [Rule 1 — Bug] The first extractor read a `label` value out of a `needle:` TYPE POSITION**

- **Found during:** Task 2, first live run — it reported **10** literals where 9 were expected, with
  `"Full tier label"` among them.
- **Issue:** `TIER_BEATS` is declared `readonly { label: string; needle: string; why?: string }[]`,
  so a search for `needle:` finds the TYPE ANNOTATION first, and an extractor that skipped forward
  to "the next quote anywhere" read the neighbouring `label` value out of the first array element.
- **Fix:** the canonical form requires WHITESPACE ONLY between the key and the opening quote, which
  is what tells a field from a type position. The type-position occurrence now contributes nothing.
  **The two-sided count is what caught this**, and it is recorded in the extractor's own comment as
  the reason it is a pin rather than a floor — a floor of "at least 3" would have passed on 10.
- **Files modified:** `scripts/check-diff-disposition.ts`.
- **Commit:** `7486da7`

**5. [Rule 3 — Blocking] The repo-relative corpus subpaths existed twice, and this gate would have made three**

- **Found during:** Task 2. `listRoles`/`listWorkflows` return bare filenames; every consumer needing
  a repo-relative path joins a subpath on. `audit-prepass.ts` had answered that by re-declaring both
  literals locally — the set-literal drift class one level down.
- **Fix:** `ROLES_SUBPATH` and `WORKFLOWS_SUBPATH` are now EXPORTED from `kit-model.ts`, the one
  authority that already owned them, and `audit-prepass.ts`'s two local copies were deleted in the
  same commit. Strictly fewer literals than before this plan, not more.
- **Files modified:** `scripts/kit-model.ts`, `.js`, `scripts/audit-prepass.ts`, `.js`.
- **Commit:** `7486da7`

**6. [Rule 1 — Bug] The isEntry-guard set pin was one short**

- **Found during:** Task 2, the full suite run. `check-claim-anchors.test.ts` pins the set of
  `scripts/` sources declaring an `isEntry` guard two-sided; the new gate makes it 10.
- **Fix:** the pin moves 9 → 10 **with a comment recording why**: the set grew by the mechanism the
  block exists for, the new gate joined by EXISTING, and the `offenders` property assertion passed
  for it on the first run. Moving the pin is how that is acknowledged, never how a property failure
  would be cleared.
- **Files modified:** `scripts/check-claim-anchors.test.ts`.
- **Commit:** `7486da7`

### Measured corrections to the plan's own figures

**D-01 names three positive guard literals; measured, the third is not one.** No gate in `scripts/`,
`install/` or `hooks/` requires `UNKNOWN - verify` to be PRESENT anywhere. `audit-prepass.ts` LISTS
its occurrences as an adjudication aid and asserts nothing; `audit-model.ts` quotes it inside a
rubric question. It would also normalize to two words, below `CLAUSE_MIN_WORDS`, so it could never be
a frozen CLAUSE even if a gate did require it. Manufacturing a requirement so the decision's
arithmetic came out was the available move and is refused; the absence is recorded in the gate's
header with `UNKNOWN - verify`.

**The registry anchor count is 42, not D-01's 38.** Plan 29-02 registered four more when it shipped
`agent-factory/writing-profile.md`. The gate pins against the registry's own row count, so this
number moved without an edit — which is the point of deriving it.

**`touchedLines`'s expected value in the harness was wrong and the code was right.** A `-20,0` hunk
range is git's spelling of a pure insertion, and a count of 0 must contribute NOTHING to the removed
side. The first draft of the case expected line 20 to be reported. Reading it as "line 20 changed"
would attribute an untouched clause to the diff and demand a row for text nobody edited. The
expectation was corrected and the reason written into the case.

### Plan-order deviation

**The three wiring assertions landed in Task 3's commit, not Task 2's.** They were written during
Task 2 and were RED there — the CI invocation and the `package.json` script did not exist yet.
Committing them at Task 2's boundary would have committed a red suite, which plan 29-01 explicitly
avoided for the same reason, so they were moved to land alongside the wiring they assert. Task 2
committed 17 green cases; Task 3 added 3, for 20.

### Requirement marking

`requirements-completed` is **empty**, and LANG-03 stays `Pending`.

LANG-03 is claimed by this plan and by **seven others** — 29-07, and 29-08 through 29-12. Its text
requires the exclusion list to be **honoured**; this plan builds the mechanism that decides whether
it was, and the honouring is what those plans do when they write their disposition rows and their
companion edits. `gsd-tools requirements.mark-complete` marks every id in a plan's frontmatter, so
running it here would close a requirement seven unexecuted plans still owe work against — the
fabricated completion plans 29-01 and 29-03 both caught and reverted.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. Every derived
set in the gate is consumed by the predicate, and each one's non-vacuity is asserted by a case.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — this gate proves that every changed clause was dispositioned or refused; it
  does NOT prove any disposition is correct.** Whether a reworded `## Hard limits` sentence still
  withholds the same permission is a human judgement no gate reaches. The manual verification for
  LANG-03 is a named human reading the rows against the diff. Recorded in the gate's header and in
  `docs/audit/29-style-dispositions/README.md`, from both sides.
- **`UNKNOWN - verify` — D-01's third positive guard literal does not exist as one.** See the
  measured correction above.
- **The watched corpus is the 41-entry exclusion list, so kit files outside it are unwatched.** The
  checklists, seed templates and contracts that `check-imperative-lexicon`'s 47-file governed corpus
  covers are not in the safety-surface union and therefore not in this gate's diff. That is the
  correct scope for LANG-03 — the requirement is about honouring the exclusion LIST — but it means a
  style pass over a seed template is dispositioned by nobody. Recorded rather than widened, because
  widening the corpus here would put a second corpus derivation beside
  `check-imperative-lexicon`'s.
- **`.claude-plugin/plugin.json` is in the exclusion list and not watched**, named inline in the
  gate's own corpus line with its reason: a clause is a unit of prose and a JSON manifest carries
  none. Its safety claim C-28-038 is still PRESENCE-checked by `check-claim-anchors`.
- **A green today means the watched corpus has not changed since the recorded base.** The gate says
  so in its PASS line and the CI comment says so above the invocation. It is not a claim that the
  gate has been exercised; the two planted reproductions are.

## Threat Flags

None beyond the plan's own register. **T-29-SC is asserted by absence at plan scope:**
`git diff 4d2b8f0..HEAD -- package.json` adds exactly one `scripts` entry and touches no dependency
line, and a case asserts `package.json` has no `dependencies` key at all. Zero packages installed.

T-29-23 (git subprocess over a large history, clause segmentation over the whole diff) was
**measured rather than assumed**: the gate runs in 0.23 s over 40 watched files, one 2,900-line guard
source and a 42-row registry. Every split is `String.prototype.split` or a forward-scanning
character loop; the only regexes are `BASE_COMMIT_RE` (anchored, no nested quantifier) and a
single-character `\s` test in the literal extractor. `locateSection` is `startsWith` over lines with
no regex at all.

T-29-25 (`child_process`): the only executable invoked is `git`, through one wrapper, with a fixed
argument array and no shell. One argument is built from file content — the base commit SHA — and it
is refused unless it matches the canonical 40-character lowercase-hex form before it reaches `git`.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: scripts/check-diff-disposition.ts
FOUND: scripts/check-diff-disposition.js
FOUND: scripts/check-diff-disposition.test.ts
FOUND: docs/audit/29-style-dispositions/00-base.md
FOUND: docs/audit/29-style-dispositions/README.md
```

Commits claimed, verified in `git log`:

```
FOUND: 8b78a32  docs(29-04): the style-disposition directory, its recorded base commit, and its contract
FOUND: 7486da7  feat(29-04): guard_diff_disposition — derive the frozen set, enumerate what changed, refuse the undispositioned
FOUND: bad79bc  feat(29-04): wire guard_diff_disposition at both ends and give CI the history it needs
```

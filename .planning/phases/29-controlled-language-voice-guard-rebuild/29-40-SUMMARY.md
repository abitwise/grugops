---
phase: 29-controlled-language-voice-guard-rebuild
plan: 40
subsystem: testing
tags: [typescript, frontmatter, parser-unification, derived-set-assertion, gap-closure, LANG-07, D-24]

# Dependency graph
requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "plan 29-35 routed both catalogue generators onto the one section-extent locator and OPENED V-29-35-01 — the private `parseFrontmatter` this plan deletes"
  - phase: 27-frontmatter-canonical-form
    provides: "plan 27-23 (WR-03) converted the sibling generator `generate-role-adapters.ts` to the authority; its three-symbol import, its `parsed.ok` guard and its three-distinct-findings posture are the reference conversion this plan copies"
provides:
  - "`scripts/generate-catalog.ts` declares no frontmatter parser of its own — the module asks `scripts/frontmatter.ts` and nothing else (D-24, one authority per predicate)"
  - "Three distinct findings where the deleted shape printed one: an unreadable frontmatter, a key declared twice, and a key absent or out-of-vocabulary"
  - "`FRONTMATTER_PARSER_OWNERS` — a NAME-scoped owner tripwire derived over the recursive repository module enumeration, with its denominator asserted first and its blind spot disclosed at its declaration"
  - "V-29-35-01 recorded CLOSED in both committed audit artifacts that named it open, with the round-4 escalation text retained verbatim"
  - "Two disclosed residuals logged rather than smuggled: an empty `order:` publishing row 0 (D-40-1) and the D-50 IN-05 classifier reading comments as code (D-40-2)"
affects: [frontmatter-authority, catalogue-generation, foundation-guards, audit-trail]

actuals:
  tokens: 22000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Deleting a duplicate grammar: delete the declaration AND the prose that spells its pattern, because a source-text classifier cannot tell prose from code"
    - "Proving a byte-neutral conversion: run the plants against the PRE-CHANGE committed artifact, not only against a reconstruction of it"
    - "A derived owner set whose recogniser is proven in both directions — matching spellings and near misses — with the enumeration's own size asserted before the membership claim"

key-files:
  created: []
  modified:
    - scripts/generate-catalog.ts
    - scripts/generate-catalog.js
    - scripts/generate-catalog.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/frontmatter.test.ts
    - docs/audit/29-locator-unification.md
    - docs/audit/29-round4-residuals.md
    - .planning/phases/29-controlled-language-voice-guard-rebuild/deferred-items.md

key-decisions:
  - "The private parser is DELETED, not widened or flag-guarded (D-24) — the plan's prohibition held with no pressure to relax it"
  - "The unreadable-frontmatter plant reaches the FENCE refusal, not the unterminated-block one, because every catalogued role file carries a fenced `## Caveman prompt` block. Measured before the case was written rather than assumed — the exact trap that forced the sibling's test to be split in plan 27-45"
  - "The empty-`cadence:` case asserts AGREEMENT between the two grammars, not disagreement, because measurement showed they reach the same cell. The plan's blanket 'each case asserts they DISAGREE' criterion could not be met honestly for this one; discrimination comes from an adjacent non-empty plant instead"
  - "An absent `order:` keeps `Number(undefined)` -> NaN semantics; an empty `order:` keeps `Number('') === 0`. Behaviour preserved exactly, including the latent quirk, and the quirk disclosed at the site and in deferred-items rather than fixed inside a byte-identity proof"
  - "The D-50 IN-05 classifier's comment-blindness is answered by this file's own convention (a retired pattern's spelling goes with the pattern), not by adding comment stripping to a safety classifier — that change is fail-open and wants its own plan"

patterns-established:
  - "Pattern: a pin that stops naming a file cannot distinguish 'it left the set' from 'the scan stopped seeing it' — assert BOTH the non-membership and the positive replacement fact"
  - "Pattern: when a harness NAME outlives its subject ('the two out-of-scope grammars'), correct the name in the same commit that moves the pin"

requirements-completed: [LANG-07]

coverage:
  - id: D1
    description: "scripts/generate-catalog.ts declares no frontmatter parser of its own and consumes the exported authority; the imported set is byte-identical to the sibling generator's three symbols"
    requirement: "LANG-07"
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the D-64 cutover pins — importedSymbols(\"generate-catalog.ts\", \"frontmatter\") === [parseFrontmatter, sectionEndIndex, unfencedHeadingIndex]"
        status: pass
      - kind: other
        ref: "grep -v '^\\s*//' scripts/generate-catalog.ts | grep -c 'function parseFrontmatter' -> 0; grep -c 'from \"./frontmatter.js\"' -> 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Behaviour preserved, taken as BYTES: docs/catalog/README.md is byte-identical after regeneration and the catalogue freshness gate is green"
    requirement: "LANG-07"
    verification:
      - kind: other
        ref: "npm run generate:catalog && git diff --exit-code docs/catalog/README.md -> exit 0"
        status: pass
      - kind: other
        ref: "npm run freshness:catalog -> exit 0; npm run freshness -> 48 committed .js match a fresh rebuild"
        status: pass
    human_judgment: false
  - id: D3
    description: "The return-shape split made falsifiable: three planted documents produce three distinct findings, each RED-proven or mutation-proven"
    requirement: "LANG-07"
    verification:
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#an unreadable frontmatter is its OWN finding, not a missing tier"
        status: pass
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#a key declared twice is refused, never silently last-wins"
        status: pass
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#an empty-valued cadence still reaches UNKNOWN - verify"
        status: pass
      - kind: other
        ref: "RED proof: `git show 803b9c1:scripts/generate-catalog.js` in place -> cases 1 and 2 red; mutation proof: `const cadence = rawCadence` -> case 3 reds"
        status: pass
    human_judgment: false
  - id: D4
    description: "A third copy of the parser cannot land green: FRONTMATTER_PARSER_OWNERS derived over the recursive module enumeration, denominator asserted first, six spellings matching and five near misses not"
    requirement: "LANG-07"
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#no module outside the authority declares the frontmatter parser's name"
        status: pass
      - kind: other
        ref: "Mutation proof: declaration arm replaced with /parseFrontmatter/ -> owner set 1 -> 4, case reds by name"
        status: pass
    human_judgment: false
  - id: D5
    description: "V-29-35-01 recorded CLOSED in docs/audit/29-locator-unification.md §9.3c and docs/audit/29-round4-residuals.md, escalation text retained"
    requirement: "LANG-07"
    verification:
      - kind: other
        ref: "grep -n 'V-29-35-01' docs/audit/29-locator-unification.md docs/audit/29-round4-residuals.md; npm run check:audit-register -> ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D6
    description: "Whether the tripwire's disclosed NAME-scoped bound is an acceptable stopping point, or whether a shape-based duplicate-grammar classifier is owed this milestone"
    verification: []
    human_judgment: true
    rationale: "Where a decidable-subset guard's coverage should stop is an editorial/scope judgement, not a verification result. The bound is measured and written down at its declaration; whether to spend a plan closing it is the user's call — the same class of decision as G-29-2's."

duration: 34min
completed: 2026-08-17
status: complete
---

# Phase 29 Plan 40: Frontmatter Authority Unification (G-29-1) Summary

**`scripts/generate-catalog.ts`'s private flat `key: value` frontmatter parser is deleted and the module now asks the one exported authority — the catalogue proven byte-identical, the three facts the old shape conflated now printing three different sentences, and a derived NAME-scoped tripwire that reds the day a third copy lands.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-08-17 13:50 (local)
- **Completed:** 2026-08-17 14:24 (local)
- **Tasks:** 3 of 3
- **Files modified:** 8

## Accomplishments

- **One grammar for one class of bytes.** The ten-line private parser at `scripts/generate-catalog.ts:51` is DELETED (not widened, parameterised or flag-guarded), and `parseFrontmatter` joins the existing `./frontmatter.js` import so the set reads byte-identically to the sibling generator's — three symbols, same specifier, same order. `grep -v '^\s*//' scripts/generate-catalog.ts | grep -c 'function parseFrontmatter'` returns 0.
- **Behaviour preserved, proven as bytes not as argument.** `npm run generate:catalog` followed by `git diff --exit-code docs/catalog/README.md` exits 0; `npm run freshness:catalog` is green. The proof is the byte comparison the freshness gate itself is, never the claim that the two return shapes are equivalent.
- **Three findings where there was one.** An unreadable frontmatter, a key declared twice, and a key absent or out-of-vocabulary now print three different sentences, each held by a permanent planted case. Two of the three are RED-proven against the actual pre-change committed artifact.
- **A third copy cannot land green.** `FRONTMATTER_PARSER_OWNERS` is derived over the RECURSIVE repository enumeration (49 modules, not the 41 `nonTestScripts()` reads), the enumeration's own size is asserted against `NON_TEST_MODULE_COUNT` BEFORE the membership claim, and the recogniser is proven in both directions on eleven planted fixtures.
- **The tripwire's blind spot is written down, not left for a later round.** It is NAME-scoped: a duplicated grammar under a different name is a different predicate and outside it. The remedy on a red is deletion, never membership.
- **The audit trail records a decision, not a disappearance.** V-29-35-01 reads CLOSED in both committed artifacts that named it open, with the round-4 escalation and its measurement retained verbatim above the closure.

## Task Commits

1. **Task 1 (tracer): the catalogue generator routed through the one frontmatter authority, catalogue byte-identical** — `44368d9` (refactor)
2. **Task 2: the return-shape difference made falsifiable — three findings, three planted documents** — `02a4659` (test)
3. **Task 3: a derived tripwire so a third copy cannot land green, and V-29-35-01 recorded closed** — `9046b0c` (test)

**Tracer feedback gate:** re-run end to end on the committed state after task 1 — build, regenerate, `git diff --exit-code`, both freshness variants, and the two targeted suites (227 passed) — before any expansion task ran.

## Files Created/Modified

- `scripts/generate-catalog.ts` — private parser deleted; `parseFrontmatter` imported; both call sites read `Parsed<FrontmatterKeys>` with the parse-failure arm separated from the multiplicity and value arms; `fail` re-annotated on the VARIABLE so its `never` return narrows control flow (copied from `generate-role-adapters.ts:99`); header rewritten with the measurement and the three-facts rule.
- `scripts/generate-catalog.js` — committed build output rebuilt (D-13); freshness green.
- `scripts/generate-catalog.test.ts` — `HISTORICAL_FLAT_KV_GRAMMAR` fixture-only control plus three permanent cases and two cell readers (`qeTierCell`, `workflowCadenceCell`).
- `scripts/check-foundation-guards.test.ts` — imported-symbol pin moved to the three-symbol set with its two false justifications withdrawn; `FRONTMATTER_PARSER_OWNERS`, `FRONTMATTER_PARSER_OWNER_COUNT`, `FRONTMATTER_PARSER_DECLARATIONS`, `declaresFrontmatterParser` and the new derived owner case added.
- `scripts/frontmatter.test.ts` — the D-50 IN-05 local-grammar site set re-derived from two members to one, with its cardinality pin, its temp-dir control, its fixture name and two stale case names moved with it.
- `docs/audit/29-locator-unification.md` — §9.3c gains a "CLOSURE — plan 29-40, round 5" subsection; escalation text retained verbatim.
- `docs/audit/29-round4-residuals.md` — roll-up row marked closed with a round-5 addendum; the falsified-assumption note updated.
- `.planning/phases/.../deferred-items.md` — D-40-1 and D-40-2 logged.

## The five divergence measurements (in-session, with their commands)

Derived over the 17 roles + 19 workflows this generator reads, against the committed `scripts/frontmatter.js`, because "0 today" is a measurement with a date on it and this plan is the date. A single node script imported the committed authority and ran the reconstructed deleted grammar over the same documents; every axis returned **0**:

| axis | live count | how |
|---|---|---|
| keys the deleted `[A-Za-z_]+` charset would have SKIPPED | **0** | authority key set filtered by `/^[A-Za-z_]+$/` over all 36 documents |
| documents declaring any key TWICE | **0** | `parsed.value` entries with `v.length > 1` |
| documents with an EMPTY value for a key this generator reads (`tier`, `order`, `cadence`) | **0** | per-document read of those keys, `v.some(x => x.trim() === "")` |
| documents with NO frontmatter fence at all | **0** | `text.match(/^---\n([\s\S]*?)\n---\n/) === null` |
| documents using CRLF line endings | **0** | `text.includes("\r\n")` |
| _(also derived)_ key-set differences authority vs deleted grammar | **0** | sorted key-set comparison, same as round 4's 0-difference measurement |
| _(also derived)_ documents the authority REFUSES | **0** | `!parsed.ok` |

So the divergence was **LATENT, not absent** — which is exactly why the three planted cases exist.

## The latency was real — one axis was NOT fail-closed

Run against the pre-change committed artifact (`git show 803b9c1:scripts/generate-catalog.js`) on a scratch mirror, so these are measurements of the deleted code and not of a reconstruction of it:

| plant | pre-change behaviour | post-change behaviour |
|---|---|---|
| unterminated role frontmatter | exit 1, `qe-e2e.md: role tier must be core|enterprise, found ""` — **a parse artifact reported as a field verdict** | exit 1, `frontmatter is unreadable — …carries the code-fence delimiter line…` |
| duplicated `tier:` key | **exit 0**, published `\| QE/E2E \| enterprise \| …` — a CORE role in the enterprise group, silently, after which the freshness gate would demand those bytes | exit 1, `2 \`tier:\` keys in one role frontmatter, expected exactly 1` |
| empty-valued `cadence:` | exit 0, cell `UNKNOWN - verify` | exit 0, cell `UNKNOWN - verify` — **the same**, reached by a different route (D-09 preserved) |

**The refusal reason for the unreadable plant, quoted from the run rather than predicted:** `the frontmatter block opened at line 1 of the document carries the code-fence delimiter line ````` at line 11, before any closing `---` delimiter — a line beginning with three backticks is not a legal node in a top-level block mapping, so the region carries content this module cannot account for; it is refused as unreadable rather than having those lines DELETED and the shorter remainder reported as a value — never read as "carries no grant"`.

That is **not** the unterminated-block refusal, and finding out why was the plan's own instruction: every one of the 17 catalogued role files carries a fenced `## Caveman prompt` block, so a runaway region always swallows that fence's opening line and the authority refuses THAT first. The sibling's test had to be split in two for exactly this reason in plan 27-45 (D-53). The case records the fact and derives the line number from the planted bytes rather than hard-coding it.

## Mutation and RED proofs

| proof | mutation | result |
|---|---|---|
| Cases 1 and 2 able to fail | pre-change committed `.js` copied over `scripts/generate-catalog.js` | **both red** — case 1 `expected '  ERROR    qe-e2e.md: role tier must …' to be '  ERROR    qe-e2e.md: frontmatter is …'`; case 2 `expected +0 to be 1`. Restored with `git checkout -- scripts/generate-catalog.js`. |
| Case 3 able to fail | `const cadence = rawCadence !== "" ? rawCadence : "UNKNOWN - verify"` → `const cadence = rawCadence` in the built `.js` | **red** — `expected '' to be 'UNKNOWN - verify'`. Restored. |
| Owner tripwire able to fail | declaration arm replaced with a plain substring `/parseFrontmatter/` in a scratch copy of the test file | **red** — owner set went 1 → 4; message `a module outside scripts/frontmatter.ts declares a function called \`parseFrontmatter\`… expected [ 'scripts/frontmatter.ts', …(3) ] to deeply equal [ 'scripts/frontmatter.ts' ]`. Scratch file deleted; `git status --porcelain scripts/` clean of it. |

## Decisions Made

1. **The unreadable plant is the unterminated splice, and the refusal it reaches is the FENCE one.** Measured before the case was written. Recorded at the case rather than smoothed over, because a case whose name says one thing and whose assertion pins another is this phase's most repeated defect.
2. **The empty-`cadence:` case asserts AGREEMENT, not disagreement.** The plan's acceptance criterion said every case must assert the control and the shipped path DISAGREE. Measured, they agree on the cell — and that agreement IS the D-09 contract. Asserting a disagreement would have been fabricating one. Discrimination comes instead from an adjacent plant (`cadence: scrum-only` publishes `scrum-only`), which is what actually guards against the vacuous version of the case: one that would pass against a generator with the cell hard-coded. Recorded as a deviation below.
3. **Absent vs empty `order:` handled explicitly.** `rawOrder` is `undefined` for an absent key and `""` for an empty one, so `Number(undefined) → NaN → refuse` survives. Collapsing absence to `""` would have turned a refusal into a published `order: 0` row — the one place this adaptation could have changed behaviour silently while every byte assertion stayed green.
4. **`fail` re-annotated on the variable, not the arrow.** `const fail: (m: string) => never = …`, copied from the sibling with its reason. TypeScript only narrows control flow for a never-returning callee when it is a function declaration or an explicitly annotated const; without it the `parsed.ok` guard would need a cast, and a cast reads as a fallback for a state that cannot be reached.
5. **The comment-blind classifier is answered by convention, not by changing the classifier.** See deviation 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The D-50 IN-05 local-grammar classifier reads COMMENTS as code, so honest documentation of the deleted parser kept the module classified as a grammar site**

- **Found during:** Task 3 (the full-suite sweep) — `scripts/frontmatter.test.ts` failed with `scripts/generate-catalog.ts declares a local frontmatter grammar AND takes a non-locator symbol from the authority: expected [ 'parseFrontmatter' ] to deeply equal []`.
- **Issue:** `isGrammarSite` tests raw source text for a head-delimiter construct AND a key-line construct, with no comment stripping. Task 1's header prose spelled both deleted regexes verbatim, at lines 40 and 100 — measured directly, those two comment lines were the *only* matches in the file. The live code carried no grammar at all.
- **Fix:** Applied this file's own established convention rather than changing a safety classifier. Plan 29-35 had already recorded, eleven lines up in the same file, that "a comment that outlives its construct is the defect one module over" and deleted the retired pattern's spelling along with the pattern. The FACTS about the deleted grammar are kept in prose (fence anchored at byte 0, closing delimiter required, character class admitting letters and underscores only, last-wins, empty map on unreadable); the pattern text is not. A paragraph at the deletion site records why, so the next author does not re-plant it.
- **Consequent pin movement (the pin working, not a pin cleared):** `generate-catalog.ts` then LEFT the IN-05 site set. Re-derived from two members to one — `["scripts/context-io.ts"]` — and moved with it: the cardinality pin (2→1), the temp-dir control, the added-grammar case's expected length (3→2), that case's name ("a THIRD" → "one ADDITIONAL") and its fixture filename (`scratch-third-grammar.ts` → `scratch-extra-grammar.ts`), the live-answer re-assertion inside the D-53 IN-02 case, and the stale case name "the two out-of-scope grammars". The `generate-catalog.ts` allow-list pin was REPLACED rather than deleted, by a two-sided assertion — non-member of the grammar set AND consumer of the predicate — because a pin that merely stops naming a file cannot distinguish "it left the set" from "the scan stopped seeing it".
- **Files modified:** `scripts/generate-catalog.ts`, `scripts/generate-catalog.js`, `scripts/frontmatter.test.ts`
- **Verification:** the two matching lines re-measured to zero; site set re-derived to one member; `npx vitest run --exclude '**/scripts/e2e/**'` → 2033 passed, 0 failed.
- **Committed in:** `9046b0c` (part of the task 3 commit)

**2. [Plan-criterion deviation, recorded not auto-fixed] The empty-`cadence:` case cannot assert the disagreement the plan's acceptance criterion demands**

- **Found during:** Task 2.
- **Issue:** The plan's criterion reads "Each case asserts the historical control grammar and the shipped path DISAGREE on its planted document." Measured against the pre-change committed artifact, the two grammars produce the **same cell** (`UNKNOWN - verify`) on this plant — and they must, or D-09's no-fabrication rule would have moved. The plan's own action text says as much two paragraphs later ("the two grammars reach the same cell by different routes"), so the criterion and the action contradict each other for this one case.
- **Resolution:** the criterion is NOT satisfied by fabricating a disagreement. The case asserts the control's answer is *present-and-empty* (`""`, not `undefined`) so the plant is the intended shape, asserts the cell by equality, and is proven able to fail by an ADJACENT plant and by an explicit mutation. Written up at the case so a later reader sees a decision rather than a missing assertion.
- **Files modified:** `scripts/generate-catalog.test.ts`
- **Committed in:** `02a4659`

---

**Total deviations:** 1 auto-fixed (Rule 3) + 1 recorded plan-criterion deviation.
**Impact on plan:** No scope creep. The Rule 3 fix touched only prose in the module under change plus the pins that legitimately moved as a result. Every plan prohibition held: no byte ceiling raised, no bare `npm test`, the parser deleted rather than widened, `docs/catalog/README.md` never hand-edited, an unreadable frontmatter never reported as a missing field, the owner set derived rather than listed, the imported-symbol pin moved rather than reverted, and no `.ts` shipped without its `.js` rebuilt.

## Issues Encountered

- **Every catalogued role file carries a fenced block**, so the unterminated-frontmatter plant cannot reach the unterminated-block refusal. Resolved by measuring first, choosing the splice plant deliberately, pinning the FENCE refusal by equality, and deriving the line number from the planted bytes so the pin cannot become a nuisance red.
- **`Number("") === 0`.** Nearly turned an absent-`order:` refusal into a published row 0. Caught while writing the arms; the `undefined`/`""` distinction is now explicit at the site with its reason.

## Gate and sweep results

| gate | exit | last line |
|---|---|---|
| `npm run build` | 0 | `tsc` |
| `npm run freshness` | 0 | `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.` |
| `npm run freshness:catalog` | 0 | `Catalog fresh: docs/catalog/README.md matches a fresh regeneration.` |
| `npm run freshness:adapters` | 0 | `Adapters fresh: 17 adapter(s) compared, 0 byte difference(s)` |
| `npm run freshness:skill-twins` | 0 | `Skill twins fresh: 7 twin(s) compared, 0 byte difference(s)` |
| `npm run typecheck` | 0 | `tsc --noEmit && tsc -p tsconfig.tests.json` |
| `npm run check:public-docs` | 0 | `ALL CHECKS PASSED` |
| `npm run check:audit-register` | 0 | `ALL CHECKS PASSED` |
| `npm run check:claim-anchors` | 0 | `ALL CHECKS PASSED` |
| `npm run check:banned-claims` | 0 | `ALL CHECKS PASSED` |
| `npm run check:imperative-lexicon` | 0 | `ALL CHECKS PASSED` |
| `npm run check:diff-disposition` | 0 | `ALL CHECKS PASSED` |
| `npm run check:nul-bytes` | 0 | `ALL CHECKS PASSED` |

**Regression:** `npx vitest run --exclude '**/scripts/e2e/**'` → **52 files passed, 2033 passed, 2 skipped, 0 failed** (round-4 baseline: 1987 passing). The live claude-CLI e2e lane was NOT run — bare `npm test` is prohibited by this plan and by the repository's standing note.

**Supply chain:** `git diff --exit-code 803b9c1..HEAD -- package.json package-lock.json` exits 0 — no package installed, added or moved by this plan. `git status --porcelain` carries no plant: every planted document in this plan was written into a `mkdtempSync` root or a scratch copy that was deleted.

## Known Stubs

None. No hardcoded empty value, placeholder string, TODO or unwired data path was introduced. The two things a reader might mistake for stubs are deliberate and documented:

- `HISTORICAL_FLAT_KV_GRAMMAR` in `scripts/generate-catalog.test.ts` is a fixture-only control, named and commented as such, imported by nothing and exported to nothing — the same idiom as the adjacent `HISTORICAL_LOOKAHEAD_GRAMMAR`.
- The IN-05 allow-list in `scripts/frontmatter.test.ts` now applies to no live member (its one remaining member imports nothing from the authority). It is kept, not reverted, and its planted discrimination assertions keep it non-vacuous — the same posture the empty `REGEXP_SECTION_BOUND_SITES` list already uses one file over.

## Deferred Issues

Logged in `deferred-items.md`, neither introduced by this plan:

- **D-40-1** — a PRESENT and EMPTY `order:` key reaches `Number("") === 0` and publishes workflow row 0 rather than refusing. Behaviour preserved exactly from the deleted grammar, disclosed at the site. Live reachability measured at 0 of 19 workflows. Fixing it inside a plan whose contract is byte-identity would put an unrelated behavioural change behind that byte proof.
- **D-40-2** — the D-50 IN-05 classifier reads comments as code. The structural answer already exists one file over (`codeLinesOfSource`), but adopting it changes a safety classifier's input in the fail-open direction and wants its own plan with its own planted discrimination.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **G-29-1 is closed and LANG-07 is discharged for this round.** The remaining round-5 work is plan 29-41 (G-29-2, the `guard_banned_claims` structural fix, user decision (c)) and plan 29-42.
- **One human judgement is owed** (coverage item D6): whether the owner tripwire's disclosed NAME-scoped bound is an acceptable stopping point, or whether a shape-based duplicate-grammar classifier is owed this milestone. This is the same class of decision as G-29-2's — where a decidable-subset guard's coverage should stop — and it is surfaced rather than assumed closed.
- **No blockers.** Tree is green on all thirteen gates and the non-e2e suite.

## Self-Check: PASSED

All nine modified/created files verified present on disk; all three task commits verified present in `git log --oneline --all` (`44368d9`, `02a4659`, `9046b0c`).

## Shared-artifact note — two premature-completion corrections

The SDK's shared-artifact updaters produced two claims this plan is not entitled to make, and both were corrected rather than committed:

1. **`requirements mark-complete LANG-07` was REVERTED.** It flipped LANG-07 to `[x]` / `Complete` in `.planning/REQUIREMENTS.md`. Rounds 3 and 4 both recorded verbatim in the ROADMAP that "no requirement is re-marked complete — LANG-03 and LANG-07 await round-5 re-verification", and no round-5 verification has run. Marking it complete here would assert a verification result that does not exist, which the repository's no-fabrication rule forbids. `.planning/REQUIREMENTS.md` is therefore byte-unchanged by this plan.
2. **`state advance-plan` overwrote the human-maintained Current Position** line with `Plan: 2 of 42` — its internal counter was out of sync with the phase's prose. Restored to `Plan: 40 of 42 (gap-closure round 5: 29-40 COMPLETE …; 29-41 and 29-42 remain)`. STATE.md was then checked for the known escape-doubling damage: longest line 7994 bytes, no backslash run of four or more.

The ROADMAP's "PLANNED 2026-08-17 and NOT YET EXECUTED" clause was also stale for 29-40 after the checkbox flipped, and was corrected in the same pass.

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-17*

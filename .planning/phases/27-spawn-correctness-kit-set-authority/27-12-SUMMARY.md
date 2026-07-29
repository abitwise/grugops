---
phase: 27-spawn-correctness-kit-set-authority
plan: 12
subsystem: testing
tags: [typescript, guards, frontmatter-parser, yaml-scalar-forms, spawn-grant, oracle, claude-code-adapters]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "listAgentAdapters/listSkillAdapters as the derived adapter scan set (27-10), the 17 generated agent adapters (27-07), guard_wr05's both-direction spawn-grant contract (23), the KIT-03 referential-integrity oracle (27-01/27-10)"
provides:
  - "scripts/frontmatter.ts — the single answer to \"does this file grant spawn, and to whom\""
  - "a frontmatter value flattener returning a discriminated success-or-parse-failure result"
  - "keysHaveSpawnGrant / keysGrantedAgentNames / keyHasValue, all scoped to the tools keys"
  - "stripFencedBlocks relocated: one fence authority, now beside the parser that needs it"
  - "a frontmatter parse-failure finding in guard_wr05 and in the KIT-03 oracle"
  - "a missing-name-key floor over the derived agent adapters"
  - "scripts/frontmatter.test.ts — a 156-document form x value product oracle"
affects: [27-13, 27-14, 27-15, 27-16, 27-17, check-foundation-guards, guard_wr05, guard_referential_integrity]

tech-stack:
  added: []
  patterns:
    - "One format-aware authority per predicate; the duplicate grammar is DELETED, never kept as a second opinion"
    - "A parse failure is a discriminated arm, never a silent negative verdict"
    - "Prove a parser with a form x value PRODUCT whose expectation comes from the semantic value, not with a list of remembered examples"
    - "Assert the product SIZE, so a dropped generator fails the count instead of shrinking coverage silently"

key-files:
  created:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The grant is read from the FRONTMATTER BLOCK, not from anywhere in the file — a deliberate narrowing that removes a real false positive (a body bullet naming the spawn tool used to fail the guard) and matches what the platform actually acts on"
  - "Duplicate keys: NEITHER wins. Every occurrence is retained as a list in document order and the grant predicate tests all of them; picking one would silently discard a `tools:` line carrying a grant, which is a bypass"
  - "FrontmatterKeys is a Map, not a Record — keys come from file content, and a content-supplied `__proto__` on a plain object is a prototype-pollution footgun in a module whose job is reading file text"
  - "An unrecognized key shape (a quoted key, a YAML anchor/alias/merge key, `tools:Read` with no space) is a PARSE FAILURE, not a no-grant success — the fail-safe direction, and the reason no YAML engine was written"
  - "matchesOutsideFences was DELETED along with the three expressions: a helper kept alive for a predicate nobody asks it any more is how a second grammar survives a fix"
  - "The name-key floor is scoped to the AGENT adapters only — packaging templates carry `kind`/`tier` frontmatter and skills carry their own; neither is an agent identity"

patterns-established:
  - "Adversarial self-reproduction of BOTH named bypasses in a hermetic mirror, plus a first-hand demonstration that the DELETED grammar could not see either — a green suite is not proof for a safety invariant"
  - "RED-equivalent confirmation against a throwaway copy of the compiled module rather than a scratch edit of the committed source, when the scratch edit cannot type-check"

requirements-completed: [SPAWN-04, KIT-03]

coverage:
  - id: D1
    description: "One module answers \"does this file grant spawn, and to whom\"; the two line-anchored grant expressions and the line-anchored marker expression are deleted"
    requirement: "SPAWN-04"
    verification:
      - kind: unit
        ref: "grep -v '^\\s*//' scripts/check-foundation-guards.ts | grep -c WR05_COMMA|WR05_ARRAY|WR05_COORDINATOR|matchesOutsideFences|parseAgentGrant -> 0 each"
        status: pass
      - kind: integration
        ref: "node scripts/check-foundation-guards.js (exit 0, zero FAIL lines, 23 non-coordinator bodies, 5 tier beats)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The reproduced folded-scalar bypass on a non-coordinator ROLE ADAPTER makes the aggregator exit non-zero naming it a rogue spawner"
    requirement: "SPAWN-04"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts -t 'folded grant' (case: folded grant on a non-coordinator ROLE ADAPTER)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The reproduced folded-scalar bypass on a SKILL file makes the aggregator exit non-zero naming it a rogue spawner"
    requirement: "SPAWN-04"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts -t 'folded grant' (case: folded grant on a SKILL file)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A parse failure is its own finding in both consumers and can never read as an absence of a grant"
    requirement: "SPAWN-04"
    verification:
      - kind: unit
        ref: "scripts/frontmatter.test.ts#an UNTERMINATED frontmatter block returns the parse-failure arm — and is NOT a no-grant success"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#guard_wr05 UNTERMINATED frontmatter block on the coordinator"
        status: pass
    human_judgment: false
  - id: D5
    description: "The grant test is scoped to the tools keys, pinned in both directions (a description-value token is not a grant; a differently named key is not one either)"
    requirement: "SPAWN-04"
    verification:
      - kind: unit
        ref: "scripts/frontmatter.test.ts (description folded scalar, differently-named key, body bullet)"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts -t 'folded grant' (case: folded grant WORDING inside a description value → PASSES)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The parser is proved by a form x value product oracle across 13 scalar forms at 2 indentation widths over 6 semantic values (156 documents), not by a fixed handful"
    requirement: "SPAWN-04"
    verification:
      - kind: unit
        ref: "scripts/frontmatter.test.ts -t 'scalar forms'"
        status: pass
    human_judgment: false
  - id: D7
    description: "The KIT-03 grant closure is computed from the same parsed value the spawn-grant guard tests, and the coordinator marker is read through the same parser"
    requirement: "KIT-03"
    verification:
      - kind: integration
        ref: "node scripts/check-foundation-guards.js (KIT-03 PASS: 17 roles == 17 adapters == 17 grant-closure names)"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts -t 'referential integrity' (11 cases, unchanged and green through the repoint)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Every derived agent adapter carries a parseable frontmatter block with a name key; one that does not fails RED naming the file"
    requirement: "SPAWN-04"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#guard_wr05 agent adapter with NO name key"
        status: pass
    human_judgment: false
  - id: D9
    description: "One fence authority survives in scripts/ — the parser reads a fence-stripped body through the existing helper"
    requirement: "KIT-03"
    verification:
      - kind: unit
        ref: "grep -rc 'function stripFencedBlocks' scripts/*.ts -> exactly 1 (scripts/frontmatter.ts)"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#a FENCED `---` cannot close a real unterminated block"
        status: pass
    human_judgment: false

metrics:
  duration: 20m
  completed: 2026-07-29
  tasks: 3
  files: 6

status: complete
---

# Phase 27 Plan 12: Delete the Second Grammar for "Does This File Grant Spawn" Summary

The spawn-grant predicate now reads a reconstructed frontmatter VALUE through one module, both
reproduced folded-scalar bypasses turn the foundation-guard aggregator red naming the offending file,
and the two line-anchored regular expressions that could not see either are gone rather than extended.

## What Was Built

**Task 1 — `feat(27-12)`, commit `fe5c7cb`.** `scripts/frontmatter.ts` reads a markdown file's
frontmatter block and returns each key mapped to its flattened single-line value, resolving
continuations, folded and literal indicators with their chomping variants, single- and double-quoted
scalars including wrapped ones, flow sequences, block sequences with and without quoted items, and
trailing unquoted comments (while keeping a `#` inside quotes). Continuation is decided by
indentation relative to the block baseline, so a line that starts a new key ends the previous value.

It returns a discriminated `Parsed<T>`, and the header states as its own paragraph why: a parse
failure is a parse artifact and never a verdict, and a consumer folding that arm into its no-grant
branch would reintroduce exactly the class of bypass the module exists to close. A document with no
frontmatter block at all is the other thing entirely — a legitimate state that succeeds with no keys.

Three predicates are exported over the same grammar: the spawn-grant test, the enumerated-name
extractor, and a key/value helper so the coordinator marker is read through the same parser as the
grant. All three are scoped to the `tools` / `allowed-tools` keys, with the reason in a comment.
`stripFencedBlocks` was relocated here verbatim and imported back into the guards, so the tree still
has exactly one implementation of "which lines are inside a ``` block". `collapseWhitespace` stayed
where its consumers are — it is a prose normalizer with a different job.

**Task 2 — `fix(27-12)`, commit `2cba478`.** Both consumers were repointed and the grammar they
shared was deleted. `guard_wr05` parses each scan file once and asks the map three questions; a parse
failure becomes its own finding, written as an explicit branch rather than a default, because the
default is precisely the bug. The KIT-03 oracle parses every adapter up front, reports any parse
failure by name and stops — it can never reduce to a zero-length closure, which the oracle already
treats as a different failure and which would otherwise mask this one. `WR05_COMMA`, `WR05_ARRAY`,
`WR05_COORDINATOR`, `matchesOutsideFences` and `parseAgentGrant` are all deleted. The guard's design
comment was rewritten: the claim that "two grant shapes catch every form" was false against a folded
scalar, and the paragraph now says so and records the one deliberate narrowing.

A new fail-closed floor rides along: every derived agent adapter must carry a parseable frontmatter
block containing a `name` key. Claude Code takes agent identity only from frontmatter, so a file in
the adapter directory without one is neither a loadable agent nor a file the guard can honestly
report on — "no frontmatter" and "no grant" would otherwise print the same silence.

**Task 3 — `test(27-12)`, commit `2a0dc5d`.** `scripts/frontmatter.test.ts` is a parser oracle: 13
serializers x 2 continuation-indent widths x a 6-value corpus = **156 generated documents**, with the
count asserted explicitly so a dropped serializer fails the count rather than shrinking coverage
silently. Expectations are hand-written per semantic value and never restated per form, which is what
makes a fourteenth form safe to add. Below the product sit the cases a product cannot generate: the
unterminated block (asserted to be the failure arm AND asserted not equal to a no-grant success), an
unreadable key line, a no-frontmatter success, key scoping in both directions, a body bullet, fenced
frontmatter, a fenced `---` that must not close a real block, duplicate `tools` keys, the marker
across scalar forms, comment handling and CRLF.

## Verification Evidence

Every command below was run and its real output observed.

| Command | Result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | `All build outputs fresh: 30 committed .js file(s) match a fresh tsc rebuild.` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, **0** FAIL lines, exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `node scripts/check-uat-oracles.js` | exit 0 |
| `node scripts/adapters-freshness.js` | exit 0 (`17 adapter(s) compared, 0 byte difference(s)`) |
| `npx vitest run scripts/frontmatter.test.ts` | 18 passed |
| `npx vitest run scripts/frontmatter.test.ts -t "scalar forms"` | 2 passed |
| `npx vitest run scripts/check-foundation-guards.test.ts` | 69 passed |
| `npx vitest run scripts/check-foundation-guards.test.ts -t "folded grant"` | 4 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **34 files** (one higher than after 27-11), 919 passed, 2 skipped |

Live-tree guard lines, quoted verbatim:

```
PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 non-coordinator adapter bodies + 2 packaging template(s) checked), and the coordinator body carries all 5 tier-announcement beats
PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
```

Acceptance greps (non-comment occurrences in `scripts/check-foundation-guards.ts`): `WR05_COMMA` **0**,
`WR05_ARRAY` **0**, `WR05_COORDINATOR` **0**, `matchesOutsideFences` **0**, `parseAgentGrant` **0**.
`grep -rc "function stripFencedBlocks" scripts/*.ts` -> exactly **1**, in `scripts/frontmatter.ts`.

### Adversarial reproduction (a green suite is not proof for a safety invariant)

Green tests were not accepted as evidence. Three independent confirmations were run first-hand:

1. **Both CR-02 bypasses reproduced in a hermetic mirror of the live tree**, outside the test
   harness. The mirror carried the folded-scalar grant on `.claude/agents/grugops-qe-e2e.md` and on
   `.claude/skills/grugops/SKILL.md`, verbatim from the review. In the same run, the DELETED grammar
   was applied to those two files directly: `OLD line-anchored grammar sees a grant: False` for both
   — that is the bypass demonstrated in this working tree, not quoted from the review. The rebuilt
   aggregator exited **1** naming both files as rogue spawners.
2. **The unplanted mirror is green** (exit 0), so the plant is what turns it red and the RED cases
   cannot be passing for an unrelated reason.
3. **RED-equivalent direction for the product oracle.** Continuation-line handling was removed from a
   throwaway copy of the compiled module and the four named form families were re-run. Folded,
   literal, wrapped-plain and block-sequence all broke; the plain single-line control was unaffected:

   ```
   folded (>-)         fixed: grant=true names=[...]  | continuation-handling REMOVED: PARSE-FAIL
   literal (|)         fixed: grant=true names=[...]  | continuation-handling REMOVED: PARSE-FAIL
   wrapped plain       fixed: grant=true names=[...]  | continuation-handling REMOVED: PARSE-FAIL
   block sequence      fixed: grant=true names=[...]  | continuation-handling REMOVED: PARSE-FAIL
   plain single-line   fixed: grant=true names=[...]  | continuation-handling REMOVED: grant=true names=[...]
   ```

   Worth recording: the break manifests as a PARSE FAILURE, not as a silent `grant=false`. The
   fail-safe design means that damaging the parser makes the guard go red rather than quietly green —
   which is the property the whole plan is about. The scratch copy was discarded; `git status` was
   confirmed clean of it and `npm run freshness` re-run green afterwards.

## Deviations from Plan

### 1. [Rule 3 — blocking issue] Three harness cases pinned the old body-anywhere behavior and were updated

- **Found during:** Task 2.
- **Issue:** Three existing cases appended their plant to the END of a scan file
  (`slash-command.template.md`, `SKILL.md`), which the old line-anchored grammar matched anywhere in
  the body. With the grant read from the frontmatter block those plants are no longer grants.
- **Fix:** The plan anticipates exactly this ("if any existing test pins the old behavior, update it
  and record the reason in the case"). Two helpers were added — `plantInFrontmatter` and
  `reshapeToolsKey` — and the three cases plus the LIVE-second-coordinator case now plant into the
  frontmatter block. Each carries the reason in its comment. The fixtures are strictly stronger: a
  frontmatter grant is the shape the platform actually acts on.
- **Files:** `scripts/check-foundation-guards.test.ts`. **Commit:** `2cba478`.

### 2. Duplicate `tools` keys: the plan asked which value "wins"; the answer is that neither does

Task 3's acceptance criterion says the duplicate-key case "must state which value wins and why". The
implemented policy is that **no value wins** — every occurrence is retained in document order and the
grant predicate tests all of them. Picking one would mean silently discarding the other, and a
discarded `tools:` line carrying a grant is a bypass of exactly the kind this plan closes. The
behavior is still deterministic (document order is), and the case states the policy and its reason
explicitly. Recorded here rather than contorting the design to make a criterion read literally.

### 3. Two aggregator-level fence-immunity cases are now over-determined; the load-bearing half moved

With the grant scoped to the frontmatter block, the two existing "FENCED coordinator example is
ignored" cases pass for two reasons at once (the example is fenced AND outside the frontmatter). They
were kept — they still assert something true about the shipped packaging template — and each now says
so in its comment. The fence authority's remaining discriminating contribution is that **a fenced
`---` must not be read as the closing delimiter of a real unterminated block**, which is pinned
precisely in `scripts/frontmatter.test.ts` where the shape can be constructed rather than appended.

### 4. RED-equivalent confirmation used a throwaway copy of the compiled module, not a scratch edit

Task 3's criterion says to confirm the RED direction "against a scratch edit, then discard the scratch
edit". Three attempts to neuter continuation handling directly in `scripts/frontmatter.ts` failed to
type-check (`noEmitOnError: true` means nothing rebuilds, so the test would have kept passing against
a stale `.js` — a false negative that would have looked like a confirmation). The confirmation was run
against a throwaway copy of the compiled `.js` in a scratch directory instead, which exercises exactly
the same code path. Source and build outputs were confirmed untouched afterwards.

### 5. SPAWN-04 and KIT-03 ARE checked off, unlike plan 27-10's deliberate deferral

27-10 reverted its requirement completions because later plans still carried both. That is no longer
the case: no remaining plan in this phase (`27-13`..`27-17`) declares `SPAWN-04` or `KIT-03` — they
carry `KIT-02`, `SPAWN-05`, `SPAWN-01` and `SPAWN-03`. This plan is the last carrier of both, so both
are marked complete here. The phase verifier remains the final authority on the phase as a whole.

## Added Coverage Beyond the Plan

- `guard_wr05 agent adapter with NO name key` — pins the new fail-closed floor at the aggregator level.
- `holds identically under the skill form of the key (allowed-tools)` — the full form corpus re-run
  under the skill key, so the two tools keys are not asserted only by the single-line examples.
- `the coordinator marker is recovered from every scalar form it can legitimately take` — six forms
  including quoted, folded, literal and comment-trailing, plus a `coordinator: false` negative.
- `a CRLF checkout parses identically to an LF one` — Windows portability, a standing obligation for
  this repo.
- `a line inside the block that is neither a key nor a continuation returns the parse-failure arm` —
  the second failure mode named in the module header, pinned separately from the unterminated one.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary was
introduced. `scripts/frontmatter.ts` has **zero imports** — it takes text and returns data, reads no
file, resolves no path and touches no environment variable, which keeps the ASVS V12 posture of the
files that call it. Register items T-27-53 through T-27-58 are all mitigated by this plan and each is
pinned by a named case; T-27-SC (package-manager installs) remains `accept` — no dependency was added
or changed.

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired data path was introduced. One boundary is
deliberately **not** implemented and is documented rather than stubbed: YAML anchors, aliases and merge
keys are not resolved. No shipped adapter or skill uses one and the generator cannot emit one; such a
form lands in the parse-failure arm (the guard goes red and a human decides) rather than in a silent
no-grant, which is the correct place for it. Writing an alias resolver would be a second grammar with
more surface, not less.

## Residual Recorded, Not Closed (review finding IN-02)

The plan's own flagged assumption stands: the aggregator still carries the remaining guards, the
byte-ceiling baseline table and the literal inventory in one file. This plan closed the half the
finding rated largest — the frontmatter parser and the fence parser now live in their own module,
after 27-10 moved the adapter derivation into the kit authority. The rest is deliberately not split
here (it would touch every guard in a plan whose purpose is a safety parser and make the diff for the
two reproduced bypasses unreviewable) and remains an open, non-blocking item for the audit phase that
owns file-level drift.

## Self-Check: PASSED

- `scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts`,
  `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`,
  `scripts/check-foundation-guards.test.ts` — all present on disk.
- Commits `fe5c7cb`, `2cba478`, `2a0dc5d` — all present in `git log`.
- Every committed `.js` twin verified fresh against its `.ts` source by `npm run freshness` (exit 0,
  30 files).

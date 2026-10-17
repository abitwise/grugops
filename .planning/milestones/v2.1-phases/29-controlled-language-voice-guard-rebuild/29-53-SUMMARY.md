---
phase: 29-controlled-language-voice-guard-rebuild
plan: 53
subsystem: testing
tags: [guard, banned-claims, scan-set, exclusion-list, json-manifest, coverage-denominator, walk-budget]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "plan 29-52's content-bounded carve-out (D-54) and the round-6 review/verification findings CR-02, WR-01, IN-03"
provides:
  - "a sixth DERIVED scan part admitting the kit's two shipped JSON manifests, so the strings a user reads before installing anything are inside guard_banned_claims"
  - "the gate's CLASS BOUNDARY declared in prose, with every tracked non-markdown surface dispositioned by name"
  - "the exclusion list rebuilt as ONE list with THREE syntactic kinds and three cardinality-asserted projections"
  - "the exclusion enforced AT THE WALK, so a nested copy of an excluded directory is refused at any depth"
  - "the coverage denominator widened to the shipped TEXT surface, checked in BOTH directions"
  - "one walk budget for the whole module, with the cross-module boundary declared and the effective bound stated"
affects: [29-54, 29-55, round-7 verification, LANG-04]

actuals:
  tokens: 23000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "an exclusion list whose ENTRY SYNTAX declares its anchoring (any-depth segment / root directory / exact path), with the three projections partitioning the list"
    - "a safety predicate applied at the POINT OF EFFECT (descent) rather than at the point the result is later read"
    - "a coverage case checked in BOTH directions, with the floor asserted before either"
    - "a new predicate over a new format asked of the bytes the scan already read, never of a second read"

key-files:
  created: []
  modified:
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts

key-decisions:
  - "The scan reads RAW BYTES, line-oriented, for JSON members exactly as for markdown ones — one matcher, one input shape, file:line:column reporting, whole-file coverage with no field list to rot. The branch not taken is closed by a NAMED REFUSAL: every decoded string value must be byte-present in the raw text."
  - "A manifest that does not parse is refused BY NAME and STILL SCANNED — a parse failure removes the canonical-form guarantee, never the scan."
  - "The tracked-set membership rule is REJECTED for this gate, in writing, with its reason: every behavioural case runs on a hermetic mirror which is not a git repository, so a git-derived rule needs a fallback, and a fallback is a second membership rule. The tracked question is asked in the coverage case instead."
  - "The round-6 review's own suggested fix (bare segment names including `memory-bank` and `plans`) is REFUSED and RED-proven defective: adopting it deletes thirteen shipped kit documents from the scan. The list therefore carries THREE kinds, not two."
  - "One walk budget object for the whole module; the imported corpus's own budget is declared rather than threaded, and the effective bound is stated as 2 x MAX_WALK_ENTRIES."

patterns-established:
  - "Entry-syntax-declared anchoring: `**/name/` (any depth), `name/` (root only), `a/b.json` (exact). One grammar, one interpreter (`bannedClaimExcludedBy`), three consumers."
  - "Partition-and-sum: three projections of one list, each cardinality two-sided, their sum asserted equal to the list length, so an entry belonging to no projection cannot sit contributing to nothing."
  - "Denominator-first: before dispositioning classes by name, ask what the denominator is CAPABLE of surfacing."

requirements-completed: []

coverage:
  - id: D1
    description: "The kit's two shipped JSON manifests are members of a DERIVED sixth scan part; the verifier's exact CR-02 plant now reds by name at file:line:column"
    requirement: "LANG-04"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the marketplace description: the verifier's exact plant, named at file:line:column"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the plugin manifest's description reds from THIS gate, not from a sibling's presence check"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#A THIRD MANIFEST ENTERS BY EXISTING, so the pair is derived and not a set literal"
        status: pass
    human_judgment: false
  - id: D2
    description: "The encoding question is decided and enforced: an escaped banned literal is refused by name; an unparseable manifest is refused by name and still scanned; an absent directory reds through the vacuity floor"
    requirement: "LANG-04"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#an ESCAPED banned literal is REFUSED BY NAME — the branch the encoding decision did not take"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#an UNPARSEABLE manifest is refused by name AND still scanned"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#an ABSENT manifest directory is a named refusal AND reds through the per-part vacuity floor"
        status: pass
    human_judgment: false
  - id: D3
    description: "The exclusion holds at ANY depth, derived from one list with three cardinality-asserted projections, and the fix is proven to have removed nothing from the scan"
    requirement: "LANG-04"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#a NESTED copy of an excluded directory contributes NOTHING — the reviewer's own plant"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#CONTROL: the same two files planted where they are NOT nested under an excluded segment DO red"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#NO SEGMENT-CLASS NAME SITS BELOW THE ROOT OF A LIVE SCAN MEMBER — the fix removed nothing"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the three projections PARTITION the one list — cardinalities two-sided, and their sum is the length"
        status: pass
    human_judgment: false
  - id: D4
    description: "The coverage denominator is the shipped text surface and holds both directions, with the equality published"
    requirement: "LANG-04"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the remainder of the tracked TEXT SURFACE minus the scan is covered by an entry of the list"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#THE MISSING DIRECTION: every scan member is a TRACKED path, and an intruder is NAMED"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#THE EQUALITY, so nothing is dropped in silence: surfaced == admitted + excluded-by-name"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#THE DEAD-ENTRY CASE COVERS ALL THREE KINDS: a fiction of each kind reds by name"
        status: pass
    human_judgment: false
  - id: D5
    description: "One walk budget in this module, pinned two-sided, with the cross-module boundary declared (IN-03)"
    requirement: "LANG-04"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#ONE WALK BUDGET IN THIS MODULE, pinned two-sided, with the cross-module boundary declared"
        status: pass
    human_judgment: false
  - id: D6
    description: "LANG-04's overall verdict — whether guard_banned_claims's PASS-line claim is now mechanically true with no fail-open route"
    verification: []
    human_judgment: true
    rationale: "Round 7's verifier owns LANG-04's verdict. This plan closes CR-02, WR-01 and IN-03 and RED-proves each; it does not and cannot certify that no further fail-open route exists. Twenty-five bypasses have been found in this phase by adversarial reading, never by a green suite."

duration: 118min
completed: 2026-08-18
status: complete
---

# Phase 29 Plan 53: The Shipped Manifests, the Class Boundary and the Walk-Anchored Exclusion — Summary

**The two strings a user reads before installing this kit are now inside the gate that claims to hold them; the exclusion is enforced where descent is decided rather than where a path is later read; and the coverage denominator is the shipped text surface in both directions — with the round-6 review's own suggested fix RED-proven to delete thirteen shipped documents from the scan.**

## Performance

- **Duration:** ~118 min
- **Tasks:** 3 of 3
- **Files modified:** 3 (`scripts/check-banned-claims.ts` + its committed `.js` twin + `scripts/check-banned-claims.test.ts`)
- **Commits:** `2d3a646`, `d079ab7`, `58a2b52`

## Accomplishments

- **CR-02 closed.** `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` are members of a sixth **derived** part. The verifier's exact plant now produces three findings at `file:line:column` and exits 1; on a pre-task-1 build the same plant exits 0 with the file never named.
- **The class boundary is a decision somebody wrote down.** Every tracked non-markdown surface is enumerated (derived by command) and dispositioned by name.
- **WR-01 closed.** The exclusion is enforced at descent, from one list, at any depth. The reviewer's own nested plant leaves the scan count unmoved and produces zero findings.
- **The review's suggested fix is refused with a measurement.** Its segment set would have dropped the scan 117 → 104.
- **The coverage denominator is the finding, and it is fixed.** Widened to markdown + JSON, plus the missing `scan ⊆ tracked` direction.
- **IN-03 closed.** One budget object; effective bound stated as 2 × `MAX_WALK_ENTRIES`.

## Evidence

### Precondition baseline (before any change)

```
node scripts/check-banned-claims.js  -> exit 0
  PASS  banned claims: 0 findings over 115/115 elements
  PASS  LANG-04: 115 document(s) ... kit 73, publicDocs 11, installReadme 1,
        skillSources 7, claudeAdapters 24, overlap 1; ...
npm run freshness -> exit 0 (48 committed .js match a fresh tsc rebuild)
all seven gates -> exit 0
```

### Pre-admission measurement (before the manifests were admitted)

Command — the gate's own matcher, over both files, per group:

```
node /tmp/gops-admit-measure.mjs   # imports countBannedClaimOccurrences +
                                   # bannedClaimGroupTally from the committed .js
.claude-plugin/plugin.json:      0 live occurrence(s) — standard-name 0, token-economy 0, comprehension 0
.claude-plugin/marketplace.json: 0 live occurrence(s) — standard-name 0, token-economy 0, comprehension 0
TOTAL:                           0 live occurrence(s) — standard-name 0, token-economy 0, comprehension 0
```

Total is `0`. Admitting both costs zero reds on correct text.

### The scan-count movement, read off the gate's OWN refusal text

Intermediate build, verbatim:

```
  FAIL  the banned-claim scan set derived 117 document(s), expected exactly 115
        (kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24,
         pluginManifests 2, overlap 1) — walk every part's derivation ...
  PASS  banned claims: 0 findings over 117/117 elements
```

Zero findings over 117/117 on that same run — the admission test. `BANNED_CLAIM_SCAN_COUNT` moved 115 → 117 with both entrants named.

### The PASS line after task 1, and unmoved after tasks 2 and 3

```
  PASS  LANG-04: 117 document(s) carry zero banned claim literal outside the one named exemption
        region — kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24,
        pluginManifests 2, overlap 1; 22 pinned literal(s) across 3 group(s) ... suppresses 14
        banned-claim occurrence(s) (standard-name 8, token-economy 2, comprehension 4), pinned at
        14, and reaches 66 line(s), pinned at 66 ... 6 registry-anchored block(s) ... covering 22 of
        the region's 66 line(s) ... 8 candidate literal(s) refused at admission
```

Diffed against the precondition baseline: `115 → 117` and the new `pluginManifests 2` clause are the ONLY moved numbers. `kit 73` is unchanged, which is what proves the walk-anchored exclusion removed nothing. Every other pinned value (`suppressed 14`, per-group `8/2/4`, `extent 66`, `6` anchored blocks, `22`/`44` line split, `22` literals, `8` refusals) is byte-identical.

### Harness premise — a FALSE result caught before it was believed

The first mirror run of the round exited **0 with no output at all**. macOS `/tmp` symlinks to `/private/tmp`, so `process.argv[1]` and `import.meta.url` disagree, `isEntry` is false, `runAll()` never runs, and the gate reports a fabricated green. The premise was asserted (banner line + PASS line present, count > 0) and the mirror path resolved with `pwd -P` before any plant was believed. **Eighth false harness result of this phase.**

A second false result was caught in the same round: the first mutation run of the nested-exclusion case PASSED. Deleting the descent test left `segments` unused, `tsc` refused to emit, and the stale `.js` was re-run. The build's own exit code and the emitted binary's sha256 are now asserted before every mutation run.

### CR-02 reproduction — the verifier's exact string

sha256 premise (mirror gate binary vs. the repository's):

```
repo   e401ed8bda75c5a1143c4bb9267e5d7c70f8662ad09ccd325629ff884a9eb4c3
mirror e401ed8bda75c5a1143c4bb9267e5d7c70f8662ad09ccd325629ff884a9eb4c3
```

Clean-mirror premise, before any plant:

```
  PASS  banned claims: 0 findings over 117/117 elements
ALL CHECKS PASSED
```

Plant confirmed on disk:

```
3:  "description": "grugops marketplace — controlled language that improves comprehension for language models and saves tokens.",
```

Post-plant, POST-fix build:

```
  FAIL  banned claims: 3 finding(s) over 117 elements
        .claude-plugin/marketplace.json:3:113 — banned token-economy literal "saves tokens"
        .claude-plugin/marketplace.json:3:66  — banned comprehension literal "improves comprehension"
        .claude-plugin/marketplace.json:3:75  — banned comprehension literal "comprehension"
  EXIT=1
```

The same two plants (marketplace and plugin descriptions) against the **pre-task-1 build** (`03567d2`, gate sha256 `4e84fe2d…37f9b`, premise green at `0 findings over 115/115`):

```
  PASS  banned claims: 0 findings over 115/115 elements
ALL CHECKS PASSED
EXIT=0     # the planted claim never named, in both cases
```

### WR-01 reproduction — the reviewer's own nested plant

RED, pre-change build, plant confirmed on disk first:

```
  FAIL  the banned-claim scan set derived 117 document(s), expected exactly 115
        (kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 26, overlap 1)
  FAIL  banned claims: 3 finding(s) over 117 elements
        .claude/worktrees/phase-30/.planning/29-99-PLAN.md:1:24 — banned token-economy literal "token economy"
        .claude/worktrees/phase-30/docs/audit/claim-registry.md:1:36 — banned standard-name literal "ASD-STE100"
        .claude/worktrees/phase-30/docs/audit/claim-registry.md:1:51 — banned standard-name literal "Simplified Technical English"
```

GREEN, post-change build, same plant, premise re-asserted first:

```
  PASS  banned claims: 0 findings over 117/117 elements
ALL CHECKS PASSED
EXIT=0
```

Count unmoved, nothing reported.

### The denominator IS the finding — measured

With the two manifests treated as neither admitted nor excluded:

```
*.md ONLY (the round-6 denominator): tracked 1362, uncovered 0 -> []
*.md + *.json (round 7):             tracked 1400, uncovered 2 ->
                                     [".claude-plugin/marketplace.json", ".claude-plugin/plugin.json"]
```

Round 6's denominator could not surface this class no matter how many markdown classes it dispositioned.

### The tracked non-markdown enumeration, derived by command

`git ls-files '*.json'` (37 paths) minus what the existing entries cover leaves exactly:

| path | disposition |
|---|---|
| `.claude-plugin/marketplace.json` | ADMITTED — sixth part |
| `.claude-plugin/plugin.json` | ADMITTED — sixth part |
| `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.tests.json` | toolchain manifests |
| `.gemini/settings.json` | tool configuration |
| `hooks/hooks.json` | tool configuration |
| `agent-factory/config/factory.config.json` | kit configuration data |
| `agent-factory/seed/.grugops/factory.config.json` | kit configuration data |
| `.planning/**` (9), `scripts/**` (18) | already covered by segment classes |

### Acceptance greps

```
grep -c -E '\[[^]]*"\.claude-plugin/[a-z]+\.json"' scripts/check-banned-claims.ts  -> 0
grep -a -c '{ examined: 0 }' scripts/check-banned-claims.ts                        -> 1
grep -c -E 'EXCLUDED_SEGMENTS|new Set\(\["docs"' scripts/check-banned-claims.ts    -> 0
```

### Mutation proofs (each with the build premise asserted, and the mutated binary's sha256 shown to differ)

| mutation | case | result |
|---|---|---|
| descent test disabled (`&& false`) | *a NESTED copy … contributes NOTHING* | **RED** — `derived 119 document(s), expected exactly 117 (… claudeAdapters 4 …)` |
| the review's own suggested fix (`plans`, `memory-bank` as segments) | *NO SEGMENT-CLASS NAME SITS BELOW THE ROOT* | **RED** — `expected +0 to be 13`; gate reports `derived 104 …, kit 60` |
| an untracked `.claude/agents/*.md` | *THE MISSING DIRECTION* | **RED** — the intruder is named |

### Final verification

```
npx tsc --noEmit                        -> exit 0
npx tsc -p tsconfig.tests.json          -> exit 0
npm run build && npm run freshness      -> exit 0 (48 committed .js fresh)
npx vitest run --exclude '**/scripts/e2e/**'
                                        -> 52 files, 2124 passed | 2 skipped, exit 0
node scripts/check-banned-claims.js     -> exit 0, ALL CHECKS PASSED, 117/117
all seven repository gates              -> exit 0
git status --porcelain                  -> unchanged from before this plan began
```

## Equalities published

**Classes surfaced by the widened denominator == admitted + excluded by name.** Asserted mechanically in *THE EQUALITY, so nothing is dropped in silence*: `admitted.length + excludedByName.length === tracked.length`, both sides floored above zero, and the JSON half asserted explicitly (two admitted, zero uncovered).

**Probe rows: 3 surfaced == 2 authored + 1 flagged.** `encoding` and `empty` are authored into this plan's `must_haves.truths` and enforced in code (the canonical-form refusal; the absent-directory refusal plus vacuity floor). Plan 29-52 authored its own. The third is carried as a flagged assumption in plan 29-48. Nothing is dropped.

## Deviations from Plan

### 1. [Rule 1 — Bug] The plan's segment projection, taken literally, would have deleted 13 shipped kit documents

- **Found during:** Task 2 (and pre-empted in Task 1, where the projection was first written)
- **Issue.** Both the round-6 review's suggested fix and this plan's Task 2 wording specify "take the entries that name a directory class, strip the separator, and use the result" as the segment projection — under the stated list rule (`an entry ending in a path separator is a directory class`), that makes `plans/` and `memory-bank/` any-depth segment classes. `agent-factory/seed/plans/` and `agent-factory/seed/memory-bank/` hold **13 markdown files that are scan members today** — the board, metrics, nfr-catalog and traceability templates plus the nine memory-bank templates the kit ships for a host repo to copy. The projection would have removed all thirteen from a safety scan, inside the fix for a fail-open.
- **How it was caught.** `find agent-factory skills .claude .claude-plugin -type d \( -name docs -o -name .planning -o -name scripts -o -name memory-bank -o -name plans \)` before writing the projection — asking what the walked roots actually contain, rather than what the exclusion list's root-level reasons assume.
- **Fix.** The list carries **three** syntactic kinds instead of two: `**/name/` (any depth), `name/` (root only), `a/b.json` (exact). `docs`, `.planning` and `scripts` carry their reason wherever they appear and are segment classes; `memory-bank/`, `plans/` and `.gemini/` are root-anchored. The three projections partition the list and each cardinality is asserted two-sided, preserving the plan's structural intent. A permanent case asserts that **no live scan member contains a segment-class name below its root**, so the day the kit ships an `agent-factory/**/docs/` this reds rather than silently dropping it.
- **Proof.** The review's suggested fix was applied as a mutation and RED-ed the new case (`expected +0 to be 13`); the gate reported `derived 104 document(s) … kit 60`. Task 1's and Task 3's PASS lines are byte-identical on `kit 73`.
- **Files:** `scripts/check-banned-claims.ts`, `scripts/check-banned-claims.test.ts` — commits `2d3a646`, `d079ab7`

### 2. [Rule 3 — Blocking] The canonical-form assertion was moved off a second read, onto the bytes the scan already read

- **Found during:** Task 1
- **Issue.** Written as the plan specified (inside the part's derivation), the assertion needed its own `readFileSync`, which broke the module's ONE-READ source-shape case (`expected 3 to be 2`). Bumping that pin would have weakened the invariant plan 29-49 installed one round earlier.
- **Fix.** `manifestCanonicalFormRefusals(rel, raw)` is called from inside the scan loop, on the text the loop already read. The read count stays at 2, and the canonical-form verdict is now asked of exactly the bytes the scan was performed over — this module's own ONE-READ lesson applied to a new predicate on the day it lands, rather than one round later.
- **Files:** `scripts/check-banned-claims.ts` — commit `2d3a646`

### 3. [Rule 3 — Blocking] Test-harness changes landed in Task 1 rather than Task 2

- **Found during:** Task 1
- **Issue.** The plan lists only `.ts`/`.js` for Task 1. But a sixth part with a per-part vacuity floor reds **every mirror in the file** until `makeMirror` writes the manifests — 15 failing cases.
- **Fix.** The mirror harness (`PLUGIN_MANIFESTS`, `CLEAN_MANIFEST`, the `pluginManifests` spec knob, the derived filler arithmetic) and three live-tree cases moved in Task 1's commit, so no commit in this plan leaves the suite red. Task 2's and Task 3's test work is unaffected.
- **Files:** `scripts/check-banned-claims.test.ts` — commit `2d3a646`

### 4. [Note] Tracer feedback gate

Task 1 is `type="tracer"`. Its `<verify>` was re-run end to end after the commit (build, freshness, typecheck, gate exit 0) **and** the CR-02 plant was adversarially reproduced on a sha256-verified mirror before any expansion task began. `workflow.auto_advance` and `_auto_chain_active` are both `false` in `.planning/config.json`, but `human_verify_mode` is `end-of-phase` and this plan's frontmatter is `autonomous: true` with no `checkpoint:*` task, so the gate was discharged by evidence rather than by halting mid-plan. Recorded here so the choice is visible.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change. The plan installs no package; `package.json` and the lockfile are byte-unchanged (`git status --porcelain` shows neither).

## Known Stubs

None.

## Residuals for plan 29-55

| id | statement | live count | direction | remedy |
|---|---|---|---|---|
| `V-29-53-01` | The canonical-form assertion fires on ANY decoded string whose bytes differ from the raw text, including a legitimately escaped non-ASCII character. Measured today: 0 refusals on the live manifests (neither file contains a backslash). A formatter run with `ensure_ascii` would red the gate on correct content. | 0 | fail-closed | Documented in the refusal's own remedy text ("write the string LITERALLY"). If a shipped manifest ever legitimately needs an escape, the answer is a named exemption with a reason, never a weaker assertion. |
| `V-29-53-02` | The gate's effective walk bound is 2 × `MAX_WALK_ENTRIES`, not 1 ×, because the imported public-docs corpus derivation carries its own budget at that module's import time. | 1 (declared) | acknowledged | Declared in the source with its reason and pinned two-sided at one budget object per module. Collapsing to a single allowance requires the corpus derivation to accept an injected budget — a cross-module change outside this plan. |
| `V-29-53-03` | `.claude/settings.local.json` is UNTRACKED, so the widened denominator does not reach it. It carries `asd-ste100.org` inside a WebFetch permission. | 1 | out of scope | Recorded at `claudeAdapterMarkdown`'s doc comment. The denominator's subject is what this repository VERSIONS; an untracked local settings file is not a class anyone must disposition. |

## Self-Check: PASSED

- `scripts/check-banned-claims.ts` — FOUND (modified)
- `scripts/check-banned-claims.js` — FOUND (modified, freshness green)
- `scripts/check-banned-claims.test.ts` — FOUND (modified)
- commit `2d3a646` — FOUND
- commit `d079ab7` — FOUND
- commit `58a2b52` — FOUND

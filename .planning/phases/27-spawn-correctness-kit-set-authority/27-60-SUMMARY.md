---
phase: 27-spawn-correctness-kit-set-authority
plan: 60
subsystem: harness-and-gate-integrity
tags: [spawn-correctness, kit-03, spawn-01, typecheck-reach, fence-authority, source-scan-pin, gap-closure-round-11]
status: complete
requires:
  - "tsconfig.json — the shipped-source target, left byte-unchanged (27-59 measured its test exclusion)"
  - "scripts/frontmatter.test.ts — the derived fence set, sorted and pinned at four (27-53)"
  - "scripts/generate-role-adapters.test.ts — the WR-03 replacement assertions (27-53)"
provides:
  - "tsconfig.tests.json — a test-inclusive, no-emit typecheck target reaching 36 of 36 tracked .test.ts"
  - "an explicit `npm run typecheck` step in CI, where none existed"
  - "importsModule / nonTestImportersOf / classifyFenceMachine — the fence claim's second half as a check"
  - "an asserted slice bound, an identity check and a comment-stripped negative on the adapter-generator pin"
  - "a derived two-mode brittleness scan over all 36 tracked test files, with its own premise asserted"
affects:
  - "every closure claim in 27-61 — these are the controls that evidence rests on"
tech-stack:
  added: []
  patterns:
    - "a flag turned on over a surface it cannot see is a control that reads as enforced and enforces nothing — state the REACH as a number on both sides"
    - "an unused local in a test file is often the tell for a MISSING case, not dead weight to delete"
    - "a classification is a MEASUREMENT, not a partition: when the tree says a member carries two true properties, assert what the claim needs instead of suppressing a fact"
    - "a reachability scan that cannot see the CHEAPEST spelling (a bare side-effect import) reports `nothing reaches it` for the wrong reason"
    - "report a scan's finding as a COUNT, never as a bare PASS — a wrong zero is visible, a green line is reassurance"
key-files:
  created:
    - tsconfig.tests.json
  modified:
    - package.json
    - .github/workflows/ci.yml
    - install/install.test.ts
    - scripts/generate-catalog.test.ts
    - scripts/context-io.test.ts
    - scripts/context-freshness.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/frontmatter.test.ts
    - scripts/generate-role-adapters.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "tsconfig.tests.json EXTENDS the shipped-source config and overrides only the exclude list; tsconfig.json stays byte-unchanged so the committed .js and the freshness gate are undisturbed"
  - "CI gains an explicit typecheck step — the review assumed one existed and none did"
  - "The fence classification asserts `exactly one authority carrying neither disqualifier, and every other member carrying at least one` rather than `exactly one class per member`, because the live tree showed one member legitimately carries two"
  - "The IN-03 slice marker is ADDED in the file's own section-rule idiom rather than an existing marker repurposed, and the reason is stated at the site"
  - "The one confirmed-genuine hit of the brittleness scan (frontmatter.test.ts:14245-14247) is recorded OPEN with an owner rather than fixed here, so 27-60 does not edit another plan's evidence"
metrics:
  duration: "~30 min"
  completed: "2026-08-10"
  tasks: 3
  commits: 3
actuals:
  tokens: 12165
  tasks: 3
  commits: 3
---

# Phase 27 Plan 60: Three Controls That Read As Floors And Could Not Hold The Weight Summary

This plan changes **no shipped behaviour**. Every committed `.js` output is byte-identical to the
pre-plan baseline (**32/32 hashes**), `tsconfig.json` is byte-unchanged, `devDependencies` is
byte-unchanged, no package-manager install ran and no production source file was edited.

Full transcripts, plant-by-plant, live in `deferred-items.md` § **From 27-60**.

## WR-04 — the dead-code flags reached NOTHING, and the reach is now a number on both sides

| target | `.test.ts` compiled | total repo-local `.ts` loaded |
|---|---|---|
| `tsc --noEmit` (shipped source) | **0** of 36 tracked | 199 |
| `tsc -p tsconfig.tests.json` (new) | **36** of 36 tracked | — |

Vitest's transform strips types without checking them, so before this plan the harness was
type-checked by **nothing anywhere**.

**The finding under the finding: there was no `typecheck` step in CI at all.** The review proposed
wiring the new target "into the same gate that runs typecheck"; that gate did not exist. Shipped
source was type-checked only as a side effect of `npm run build`. `.github/workflows/ci.yml` now
carries an explicit `npm run typecheck` step on both OS legs. No existing lane was disabled or
weakened.

**The target is PROVEN able to fail, and the contrast IS the finding:**

```
new target      exit=2   scripts/frontmatter.test.ts(14531,7): error TS6133:
                         'grugops2760UnusedPlant' is declared but its value is never read.
shipped target  exit=0   <- the SAME plant, the SAME flags, seen by nothing
plant removed   exit=0   (restore verified byte-identical with cmp -s)
```

### SIX real violations, each fixed AT ITS SITE

No exemption was added, no flag was loosened, no test was deleted or weakened. The exclude list is
`["node_modules", ".tmp-build", "**/*.test.ts"]` before **and** after. The review's "no violations
today" is now stale — round 11's own plans grew the harness past it.

| file | diagnostic | fix |
|---|---|---|
| `install/install.test.ts:41` | TS6133 `statSync` | dead import removed |
| `scripts/generate-catalog.test.ts:46` | TS6133 `out` | dead helper + its now-unused `SpawnSyncReturns` type import removed |
| `scripts/context-io.test.ts:545` (x2) | **TS2741** `body` missing | two literals handed to `currentState()` were not `NoteRecord`s — a real type error. Supplied at the site; the interface was not widened |
| `scripts/context-freshness.test.ts:43` | TS6133 `indexMd` | **the tell for a missing case.** The gate compares BOTH `["index.md", "index.jsonl"]` and only the `.jsonl` half had a drift case. Added **Test 2b** |
| `scripts/check-foundation-guards.test.ts:184` | TS6133 `MEMORY_SENTENCE_COORDINATOR` | its own comment claimed the duplication "fails closed" — true for the specialist form, **false** for this one, read by nothing. Made true by a case asserting both forms appear verbatim in the guard source |

Both **added** cases proven able to fail in a hermetic `git clone --no-hardlinks` (baseline **153
passed / 0 failed**; two mutations → exactly **2** attributable reds): narrowing `derivedNames` to
`["index.jsonl"]` reds Test 2b while Test 2 stays green, and drifting the guard's coordinator em-dash
to a hyphen reds the mirror case naming the coordinator sentence.

## IN-02 — the fence claim's prose half, mechanised

The derived fence set stays at **4**. What changed is that "does it answer the GENERAL question" is
now checked by properties rather than asserted by a comment.

| class | property, mechanically | member(s) |
|---|---|---|
| `authority` | exports `stripFencedBlocks` | `scripts/frontmatter.ts` |
| `heading-gated` | ≥1 `## Caveman prompt` gate AND gate count **equals** delimiter-site count | `check-foundation-guards.ts` (2/2), `check-foundation-guards.test.ts` (3/3) |
| `harness-local` | a `.test.ts` that **no non-test module in the tracked tree imports** | `generate-role-adapters.test.ts`, `check-foundation-guards.test.ts` |

The importer corpus is **derived** — `git ls-files "*.ts"` minus `*.test.ts` minus the member, **33**
modules — never hand-listed, comments stripped before matching.

**The classification is a MEASUREMENT, not a partition — a correction the case made to itself.**
Written first as "exactly one class per member", the live tree refused: `check-foundation-guards.
test.ts` matches **both** `heading-gated` and `harness-local`, and both are true of it (it MIRRORS the
guard's own scopers). A partition would have had to suppress a true fact to keep its arithmetic. What
is asserted is what the claim needs, and it is total: exactly one `authority` carrying **neither**
disqualifier, all **3** others carrying at least one, and a member matching **no** class reds by name.

**Non-vacuity asserted FIRST:** the same importer scan is asked about the authority module and must
find its real consumers, or every "found none" verdict is a broken regex reported as a safety property.

**No narrowing of the claim in `scripts/frontmatter.ts` was required** — all three non-authority
members are mechanically disqualified. That file is byte-unchanged.

## IN-03 — the source-scan pin, repaired and proven on three plants

| before | after |
|---|---|
| `src.slice(start, src.indexOf("\n}", start))` | bounded by `\n// ── end stripFencedBlockLines`, **asserted present before the slice is used**, message naming the marker |
| the slice was never checked to BE the function | head, tail and no-overrun asserted before any negative runs |
| the negative matched COMMENTS as well as code | runs over comment-stripped code, plus a >200-char floor so a strip that ate everything cannot make it vacuous |

The marker is **added** in the file's own section-rule idiom rather than repurposed — the nearest
pre-existing `// ──` sits 76 lines past the function and would have swallowed two helpers, including a
comment quoting the forbidden shape. That reason is written at the site.

```
PLANT 1  forbidden shape as CODE      -> negative reds
PLANT 2  end marker deleted           -> bound assertion reds BY NAME
                                         ("expected -1 to be greater than 9412")
PLANT 3  forbidden shape as a COMMENT -> 25 passed | 1 skipped | 0 failed, stays GREEN
```

**Plant 3 is only evidence because the OLD pin is shown to fail on it.** Measured on the same planted
text, both pin shapes side by side: `PRE-REPAIR -> FALSE-RED`, `POST-REPAIR -> STAYS GREEN`, and the
comment is confirmed to be inside the post-repair slice.

### The derived scan for other pins sharing either mode

Over all **36** tracked `.test.ts` files, building the set of identifiers transitively derived from
reading a `.ts` source (**62** of them) and carrying a "was comment-stripped" flag through the chain:

| mode | raw hits |
|---|---|
| **A** — slice bounded by an `indexOf` whose result is never `expect`ed | **5**, all in `frontmatter.test.ts` |
| **B** — negative assertion over unstripped source text | **16** negatives found, **11** unstripped, **8** distinct receivers |

Adjudicated with reasons: `truncated` is a deliberate fixture; `authority`/`guardsRaw` pin a PROSE
claim absent, so stripping would **break** them (mode B's premise is not universal); the
`generate-role-adapters` `body` hit is a name-shadowing artifact (a `.md` read). **One confirmed
genuine**, recorded OPEN below.

## The harness premise produced a FALSE result TWICE MORE, and both were caught

Instances 14 and 15 in this phase. Neither would have been visible without asserting the control's own
outcome.

1. **The IN-02 fail-proof did not red.** A planted `import "./generate-role-adapters.test.js";` in the
   non-test module `scripts/kit-model.ts` left the case at **270 passed**. The scan matched `from "…"`
   and `import("…")` and **missed the bare side-effect import** — the cheapest way there is to reach a
   module. Read without the plant's outcome asserted, that green says *"nothing imports the
   harness-local machines"*, which is true today for entirely the wrong reason. With the arm added,
   the same plant reds naming `scripts/generate-role-adapters.test.ts`. The control case now exercises
   all five importer spellings (named, default, side-effect, re-export, dynamic), each asserted SEEN,
   plus a comment-only control asserted NOT seen.
2. **The brittleness scan reported `negative assertions over them: 0`** — no negative source assertion
   anywhere in 36 files, plainly false. Its backward paren-walk decremented at the matching paren and
   kept going. Reported as a **count** the zero was visibly wrong; as a PASS line it would have read as
   reassurance. Fixed, the same scan reports 16.

## Evidence

| Evidence | Result |
|---|---|
| Typecheck reach, both sides | **0 of 36** vs **36 of 36** `.test.ts` compiled |
| Planted unused local | new target **exit 2 / TS6133 by name**; shipped target **exit 0** on the same plant |
| Real violations surfaced and fixed at their sites | **6**, in 5 files; 0 exemptions, 0 loosened flags |
| Added cases proven able to fail | 2 mutations → exactly **2** attributable reds (baseline 153/0) |
| Fence set | **4** members, **100%** mechanically classified, **3** non-authority all disqualified |
| Importer corpus | **33** derived non-test modules; non-vacuity control finds the authority's real consumers |
| IN-02 fail-proof | planted import reds by name (after the missing side-effect arm was found) |
| IN-03 plants | code **reds**, missing marker **reds by name**, comment **stays green** — plus a pre/post pin comparison |
| Brittleness scan | 36 files, 62 source identifiers, **5** mode-A and **11** mode-B raw hits, 1 confirmed genuine |
| `npm run typecheck` (both targets) | **exit 0** |
| `npm run freshness` | **exit 0**, 32/32 hashes identical to baseline |
| `npm run freshness:adapters`, `check-foundation-guards.js` | **exit 0**, `ALL CHECKS PASSED` |

**The regression suite is a FLOOR, not the closure evidence.**
`npx vitest run --exclude '**/scripts/e2e/**'` reports **1,346 passed | 2 skipped | 0 failed**. A green
suite proves nothing about a safety invariant; the closure evidence is the two-sided reach
measurement, the planted TS6133 against its exit-0 contrast, the two mutation reds, the planted-import
red and the green that preceded it, and the three IN-03 plants with their pre-versus-post comparison.

## Deviations from Plan

**1. [Rule 1 — Bug in this plan's own first draft] The IN-02 classification's shape was wrong against
measurement, and the case corrected itself.**
- **Found during:** Task 2, on the first run of the new case.
- **Issue:** the plan's behaviour block specifies "every member is accounted for by exactly one
  mechanical classification". The live tree refused: `scripts/check-foundation-guards.test.ts` matches
  **both** `heading-gated` (3 delimiter sites, 3 `## Caveman prompt` gates) and `harness-local` (no
  non-test importer). Both are TRUE of it — it mirrors the guard's own scopers, which is its purpose.
- **Fix:** the assertion became the one the CLAIM actually needs and is still total — exactly one
  `authority` carrying **neither** disqualifier, and every other member carrying **at least one**. A
  member matching no class still reds by name. Suppressing one true fact to preserve a partition's
  arithmetic would have been the set-literal reflex in a new costume.
- **Commit:** `5bfdb39`

**2. [Rule 2 — Missing critical functionality] Two of the six TS6133 violations were tells for missing
checks, not dead weight.**
- `scripts/context-freshness.test.ts`'s write-only `indexMd` marked a gate half (`index.md`) that no
  case ever planted drift into, though the gate compares it. Deleting the local would have deleted the
  evidence of the gap. Added **Test 2b**, proven able to fail.
- `scripts/check-foundation-guards.test.ts`'s `MEMORY_SENTENCE_COORDINATOR` carried a comment claiming
  the duplication "fails closed"; with no consumer, that claim was false for this half. Made true
  rather than deleted, and proven able to fail.
- **Commit:** `6617403`

**3. [Rule 3 — Blocking] The CI wiring the review described did not exist.**
- The plan and review both say "wire it into the gate that already runs typecheck". `.github/workflows/
  ci.yml` had **no** typecheck step; shipped source was type-checked only as a side effect of
  `npm run build`. An explicit step was added on both OS legs rather than pretending the wiring
  existed. No lane was disabled or weakened. **Commit:** `6617403`

**4. [Process] The tracer feedback gate was satisfied by re-running the automation rather than by
emitting a checkpoint.** `27-60` declares `autonomous: true` and carries no `checkpoint:*` task; every
`<verify>` entry is `<automated>`, all re-run end-to-end and green before the next task began. Same
disposition as `27-55` through `27-59`.

## Known Stubs

None. No stub, placeholder, TODO or skipped test was introduced. The two pre-existing suite skips and
the one pre-existing skip in `generate-role-adapters.test.ts` are unrelated to this plan and unchanged.

## Threat Flags

None. This plan introduced no network endpoint, no auth path, no new file access pattern and no schema
change. `T-27-60-01` through `T-27-60-04` are mitigated and evidenced above — each of the three
controls carries a quoted red, and the committed-`.js` hash set is identical before and after.
`T-27-60-05` and `T-27-60-SC` stand as accepted: no parsing, guard or grant computation was touched,
no package-manager install ran and `devDependencies` is byte-unchanged.

## Still OPEN, with a named owner

| Item | Owner |
|---|---|
| **`scripts/frontmatter.test.ts:14245-14247` shares BOTH IN-03 brittleness modes** — unasserted `indexOf` bounds, no identity check, and `expect(iface).not.toContain("sawBlock")` over unstripped text while the same case requires the narration to survive. A comment inside the `Accumulator` interface false-reds it. | a later round — apply this plan's three repairs there; deliberately not edited here so `27-60` does not change another plan's evidence |
| **Mode-A hits `branch` and `block`, and mode-B hits `source`, `body` and `block`, all in `frontmatter.test.ts`, are NOT adjudicated.** | a later round — classify each as fixture, deliberate, or genuine, and for mode B state at the site whether the negative is about CODE or about COMMENT TEXT |
| **The brittleness scan is a floor with known false positives** — name-based, not scope-aware; it cannot see a bound hoisted through a helper. Not committed as a gate. | a later round — needs scope resolution before it could be promoted |
| **The IN-02 importer scan's named floor** — a run-time-assembled specifier, a non-TypeScript importer, and a consumer that re-implements rather than imports are all invisible to it. | a later round, if a stronger reachability claim is ever needed |
| `27-55` … `27-59`'s open items, including the three unpinned round-11 edits (R1/R4/R6) | carried, unchanged — `27-60` edited no production source file, no parser, no guard and no grant computation |
| KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found` | the next verification round for phase 27 (D-58 item 4 — an executing plan never promotes a row because its own tasks targeted that requirement's defect) |

## Specless probe fallback — no-silent-drop accounting

Scoping is stated in `27-55` and is not restated. This plan authors **0** of the round's 7 gap-surface
probe rows: it changes no shipped behaviour and has no edge surface of its own.

**Equality for this plan: 0 probe rows == 0 authored + 0 backstop + 0 unresolved + 0 dismissed.**
Round equality is stated once, in `27-61`.

## Self-Check: PASSED

- `tsconfig.tests.json` — FOUND
- `package.json`, `.github/workflows/ci.yml` — FOUND, both changed
- `scripts/frontmatter.test.ts`, `scripts/generate-role-adapters.test.ts` — FOUND
- `install/install.test.ts`, `scripts/generate-catalog.test.ts`, `scripts/context-io.test.ts`,
  `scripts/context-freshness.test.ts`, `scripts/check-foundation-guards.test.ts` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` — FOUND, carries `From 27-60`
- commit `6617403` — FOUND
- commit `5bfdb39` — FOUND
- commit `dda5e73` — FOUND

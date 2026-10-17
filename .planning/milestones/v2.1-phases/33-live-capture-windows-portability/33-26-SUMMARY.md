---
phase: 33-live-capture-windows-portability
plan: 26
subsystem: context-io
tags: [kit-section-3, row-258, cap-01, cap-03, assertNoteScalar, assertNoteFields, assertNoteRefs, undefined, absent-field, context-io, compactor, admission-server, tdd, no-fabrication]

# Dependency graph
requires:
  - phase: 33-21
    provides: the human's ledger-and-hold direction for the four 33-DIAGNOSIS KIT items, carried as WINDOWS.md row 258 (§ 3 accepted open for round 3)
  - phase: 33-25
    provides: the sealed composeNote this plan guards in front of (the seal digests the composed bytes, so V3's byte-identity proves the seal moved with nothing); the base-kit and tap-flat trailer idioms
  - phase: 33-24
    provides: the one-spelling-authority context-io.ts this plan builds on
provides:
  - "`assertNoteScalar(name, value)` exported from scripts/context-io.ts — the ONE scalar guard: a non-string is refused BY NAME (absent (undefined) / null / a <type>) BEFORE the CR-01 newline rule"
  - "`assertNoteRefs(refs)` exported — the list companion: a non-array `refs` is refused by name (a string would iterate characters and `\"\"` would compose an empty list); each entry through the scalar guard as `refs[]`"
  - "`assertNoteFields(note)` exported — the ONE field list (kind, by, at, verified_by, confidence, supersedes when non-null, refs, sha/gate_run/content_hash when set); `composeNote` asks it as its first statement and every one of its four callers asks it ahead of `noteId`"
  - "scripts/compactor.ts `composeThreadNote` imports and asks `assertNoteFields` — the sibling arm closed with no guard body of its own"
  - "scripts/admission-server.ts: the `propose_note` boundary default is stated as that route's own contract, unchanged and asserted (V6)"
  - "scripts/check-platform-shapes.ts: the note-position probe driver hands the writer a complete note (it had composed three absent scalars as the word `undefined` on the base)"
affects: [33-31, 33-32, 33-34, CAP-01, CAP-03, WINDOWS.md row 258, every in-process caller of appendNote / admitAndAppend / writeThread]

# Actuals (#2632) — same estimateTokens scale as the plan's `estimate` (chars/4 over the realized diff)
actuals:
  tokens: 20680
  tasks: 2
  commits: 5
plan_head_before: 941197e2022ba63f015fda17c1955f131593309c

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Type before shape: a scalar guard asks `typeof` first, because every later rule (`/[\\r\\n]/.test`, a hex allowlist) coerces a non-string to a word and passes it"
    - "One field list, asked at the point of effect AND ahead of the first read: `composeNote` guards as its first statement so no caller can compose unguarded, and each caller guards before `noteId` reads `note.at` so absence is a named refusal, not a TypeError"
    - "The boundary that declares a default owns it: an optional MCP argument may coerce to `\"\"` at the server; an in-process `undefined` has declared nothing and is refused"
    - "Derive the caller set and pin its count: V4 lists every function that calls `composeNote` from the AST and asserts each guards first; a fifth caller moves a number"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/compactor.ts
    - scripts/compactor.js
    - scripts/compactor.test.ts
    - scripts/admission-server.ts
    - scripts/admission-server.js
    - scripts/admission-server.test.ts
    - scripts/check-platform-shapes.ts
    - scripts/check-platform-shapes.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js

key-decisions:
  - "The guard's placement went one register past the plan: `admitAndAppend` composes on both of its own branches BEFORE it reaches `composeValidatedNote`'s guard block, and on the gated branch it appends the GOV-02 ledger event before it persists — so a mistyped `confidence` could have been ledgered and then refused. The field list is therefore spelled once (`assertNoteFields`) and asked at the top of that route, inside `composeNote` itself, and ahead of `noteId` in every caller."
  - "`emitCheckpointNote`'s round-4 body-field loop drops its own `typeof` spelling and asks the guard: after this plan that loop was the module's second copy of the type rule, exactly the shape the plan prohibits. Its refusal text moves from `refusing to emit` to the guard's `refusing to compose` for the two missing-field cases; the vocabulary refusals keep their sentence."
  - "`refs` gets a list guard, not a scalar guard: `for…of` over a non-array does not refuse by name — `undefined` is an unnamed TypeError and a STRING iterates its characters, so `refs: \"\"` composed an empty `refs:` block on the base (a silent normalisation of a mistyped field, the class this plan prohibits)."
  - "WINDOWS.md row 258 is left `open`: the human's direction at 33-21 was ledger-and-hold, and 33-25 left row 256 open the same way; flipping a ledger row is the verifier's or the human's act, not the executor's."
  - "The raw thread tier now refuses a malformed `sha`/`gate_run`/`content_hash` it never emits (the one field list guards them when SET): stricter than before on a tier that dropped them silently, stated rather than carved out — one list, one guard."

patterns-established:
  - "A probe driver's ORDINARY content must be a note the writer accepts: an in-tree probe (`check-platform-shapes.ts`) had been relying on the very bug the plan closed"

requirements-completed: [CAP-01, CAP-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "An absent `verified_by` (and every other interpolated scalar) is refused by name at the field guard on the in-process routes, before anything is composed; nothing is written; on the base the same call wrote `verified_by: undefined`"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#33-26 V1 (PREMISE on the base kit at 941197e2 + HEAD refusal) and #V2 (kind/by/at/confidence/verified_by/supersedes/refs[]/refs, both appendNote and admitAndAppend)"
        status: pass
      - kind: other
        ref: "RED 52eee916 (V1 HEAD: expected '' not to be '' — no throw; check tdd-red-evidence -> RED_EVIDENCE_OK) precedes GREEN 8b82b4bc"
        status: pass
    human_judgment: false
  - id: D2
    description: "The honest empty value still writes: `verified_by: \"\"` and `supersedes: null` compose byte-identically to the base's bytes (seal included) and read back as `\"\"` / `null`"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#33-26 V3"
        status: pass
    human_judgment: false
  - id: D3
    description: "One guard, derived from the AST: the newline rule and the string-type refusal are each spelled in exactly [assertNoteScalar]; the interpolated set (composeNote + provenanceBlock) is 10 and equals the guarded set; composeNote's first statement is the field list; the four composeNote callers each guard before compose and before noteId"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#33-26 V4"
        status: pass
    human_judgment: false
  - id: D4
    description: "The sibling composer (compactor writeThread/composeThreadNote) refuses an absent scalar by name through the imported guard; an existing thread file does not move on a refusal; the interpolation-site set across scripts/*.ts is exactly 2 and both sites guard first; the compactor spells neither rule"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/compactor.test.ts#33-26 V5 (PREMISE + HEAD + the existing-file arm) and #V7"
        status: pass
      - kind: other
        ref: "RED c3127f8e (V5 HEAD: expected '' not to be ''; RED_EVIDENCE_OK) precedes GREEN 4fa7bd65"
        status: pass
    human_judgment: false
  - id: D5
    description: "The MCP route is unchanged: propose_note with verified_by OMITTED admits an observation with `verified_by: ` (empty) on disk and refuses a finding as a hollow stamp; the server's own coercion precedes admitAndAppend"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/admission-server.test.ts#33-26 V6 (three cases, green before and after the change)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Committed twins, manifest and the post-wave gate: build parity 69/69, hook manifest fresh (26 hashes), tsc clean, full excluded-lane suite green once at the end, nul-bytes clean"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "npm run build && npm run check:build-parity && npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes -> Test Files 78 passed (78), Tests 5401 passed | 2 skipped (5403), ALL CHECKS PASSED, exit 0"
        status: pass
    human_judgment: false

# Metrics
duration: 34min
completed: 2026-09-21
status: complete
---

# Phase 33 Plan 26: An absent scalar is a refusal that names the field — Summary

**The one field guard in `scripts/context-io.ts` now refuses a non-string by name before its newline rule, so an in-process caller that omits `verified_by` (or any interpolated scalar) gets `field "verified_by" is absent (undefined), not a string — refusing to compose` and nothing on disk, where the dispatch base wrote the literal line `verified_by: undefined` and read it back as a stamp; the field list is spelled once (`assertNoteFields`), asked inside `composeNote` itself and ahead of `noteId` on all four of its callers including `admitAndAppend`'s own two compose sites, and the compactor's raw-thread composer imports the same list; the MCP route's empty default is proven unchanged and stated as that boundary's own contract.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-09-21T16:53:34Z
- **Completed:** 2026-09-21T17:27:34Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 13 (5 commits, measured from `plan_head_before` 941197e2)

## Accomplishments

- **The guard, in one place, type first.** `assertSingleLine` became the exported `assertNoteScalar(name, value: unknown)`: `typeof value !== "string"` is refused by name — `absent (undefined)`, `null`, or `a <type>` — before the CR-01 `/[\r\n]/` rule that used to coerce `undefined` to the word and pass it. Emptiness is not absence: `""` still writes as the honest empty value (V3, byte-identical to the base's bytes, seal included).
- **The list, in one place.** `assertNoteRefs(refs)` refuses a non-array `refs` by name and passes each entry through the scalar guard as `refs[]`. On the base `refs: ""` composed an empty `refs:` block (a string iterates its characters), and `refs: undefined` was an unnamed TypeError.
- **The field list, in one place, at the point of effect.** `assertNoteFields(note)` spells the CR-01 order once (six scalars, `supersedes` on its non-null arm, `refs`, the three provenance scalars when set with their hex allowlist after the single-line check). `composeNote` asks it as its FIRST statement, so no caller can compose unguarded; `composeValidatedNote`, `admitAndAppend`, `emitVerdict` and `emitCheckpointNote` each ask it ahead of `noteId` (V4 derives the caller set from the AST and pins its count at 4).
- **The route the diagnosis named, guarded where it composes.** `admitAndAppend` composes on both of its own branches before it reaches the shared writer's guard, and ledgers on the gated branch before it persists; the guard now sits at its top, before governance is read.
- **The sibling arm closed.** `scripts/compactor.ts` imports `assertNoteFields` and `composeThreadNote` asks it before `noteId`; on the base `writeThread` with no `verified_by` appended `verified_by: undefined` to the thread record (V5 PREMISE quoted below). `grep -c 'must be single-line' scripts/compactor.ts` -> `0`; typeof-string refusals in compactor.ts -> `0`.
- **The MCP route unchanged and stated.** `propose_note` keeps `String(args.verified_by ?? "")`; V6 admits an observation with `verified_by: ` empty and refuses a finding as a hollow stamp, and asserts the coercion precedes the `admitAndAppend` call. The handler comment says why that boundary may default while the in-process route may not.
- **The interpolation-site set derived.** V7 walks every `scripts/*.ts` (tests excluded), finds exactly 2 template spans over `note.verified_by` — `compactor.ts#composeThreadNote` and `context-io.ts#composeNote` — and asserts each function asks `assertNoteFields(note)` at an earlier position.
- **One in-tree caller relied on the bug.** The platform-shape probe driver handed `appendNote` a note with only `kind`/`by`/`refs` and a precomputed id, so the base composed `at: undefined` / `verified_by: undefined` / `confidence: undefined` without ever reading `note.at`; the guard turned 19 cases red, and the driver now supplies a complete note (deviation below).

## TDD record

### Task 1 — RED `52eee916`, GREEN `8b82b4bc`

RED run on the dispatch base's committed `scripts/context-io.js` (`npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "33-26" --reporter=tap-flat`):

```
ok     V1 — PREMISE on the base: `admitAndAppend` with NO `verified_by` key returned an id and the file carried the literal `verified_by: undefined`
not ok V1 — HEAD: `admitAndAppend` and `appendNote` with NO `verified_by` key REFUSE naming the field and the word `absent`; nothing is written
       message: "admitAndAppend accepted an absent verified_by: expected '' not to be ''"
not ok V2 — the same guard, every field …
       message: "kind: accepted: expected [Function] to throw error matching /\"kind\".*absent/ but got 'context-io.appendNote: refusing to wr…'"
ok     V3 — the honest empty value still writes …
not ok V4 — ONE guard …
       message: "the single-line rule is spelled in more than one function, or in none: expected [ 'assertSingleLine' ] to deeply equal [ 'assertNoteScalar' ]"
exit 1
```

Offline reproduction before any edit, against `941197e2`'s committed `.js`: `appendNote('T-1', {kind, by, at, confidence, refs, supersedes: null}, …)` -> `appendNote returned id: 20260921T000000Z-x-observation-2d00749e`, file lines `[ 'verified_by: undefined' ]`, `readContext verified_by: "undefined"`; the same through `admitAndAppend` -> `{"id":"…","findings":[]}` and `[ 'verified_by: undefined' ]`.

`gsd_run check tdd-red-evidence` -> `RED_EVIDENCE_OK` (`target_test_failed`; tests 5 / pass 2 / fail 3; the `# tests/# pass/# fail` trailer derived from the tap-flat `ok`/`not ok` lines with `# SKIP` excluded, the derivation stated inside the record, as 33-24/33-25 did). The V2 `kind` red is instructive: on the base `admitAndAppend` did refuse `kind: undefined` — by `validate`'s enum rule AFTER composing the text `kind: undefined`, not by name at the guard.

GREEN: `-t "33-26"` -> 5 passed; the plan's Task 1 verify block, quoted:

```
npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "absent|non-string|V1|V2|V3|V4"
 Tests  33 passed | 645 skipped (678)      exit 0
node -e "…appendNote('T-1',{kind,by,at,confidence,refs,supersedes:null},'b',r,undefined,r)…"
 refused: context-io: field "verified_by" is absent (undefined), not a string — refusing to compose. A missing or mistyped caller field would otherwise reach the fence as literal text; the writer does not invent a value the caller did not give.      exit 0
npm run build && npm run generate:hook-manifest && npm run check:build-parity && npm run freshness:hook-manifest
 PASS  Build parity: … 0 findings over 69/69 elements   ALL CHECKS PASSED
 Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.      exit 0
```

(`check:build-parity` compares against the COMMITTED tree, so it reads `moved` on the uncommitted rebuild and `PASS` once the twins are committed — it was run again on the committed tree, and that is the line quoted.) The two context-io suites after the guard: `scripts/context-io.test.ts` + `scripts/context-io-writer-set.test.ts` -> `Tests 873 passed (873)` — the first run had 2 reds in `31-37 WR-36` because the hook manifest was stale (`does not match the frozen manifest`), which `npm run generate:hook-manifest` closed; the writer set did not move.

V4's derivation, quoted from the assertions that hold: newline rule spelled in `["assertNoteScalar"]`; string-type refusal (`if (typeof x !== "string") throw`) spelled in `["assertNoteScalar"]`; the guard is exported and its `typeof value !== "string"` precedes its `.test(value)`; interpolated set from `composeNote` + `provenanceBlock` = `["at","by","confidence","content_hash","gate_run","kind","refs","sha","supersedes","verified_by"]` (10) = guarded set (10) from `assertNoteFields`; `composeNote`'s first statement is `assertNoteFields(note)`; callers of `composeNote` = `["admitAndAppend","composeValidatedNote","emitCheckpointNote","emitVerdict"]`, each with its guard call positioned before its first `composeNote` call and before its first `noteId` call.

### Task 2 — RED `c3127f8e`, GREEN `4fa7bd65`

RED on the base compactor (`npx vitest run --exclude '**/scripts/e2e/**' scripts/compactor.test.ts scripts/admission-server.test.ts -t "33-26" --reporter=tap-flat`):

```
ok     V6 (×3) — the MCP route: observation admitted with `verified_by: ` empty; finding refused as a hollow stamp; the coercion precedes admitAndAppend
ok     V5 — PREMISE on the base: `writeThread` with NO `verified_by` key appended a thread record carrying the literal `verified_by: undefined`
not ok V5 — HEAD: `writeThread` with NO `verified_by` key throws naming `verified_by`; the thread file is not created
       message: "writeThread accepted an absent verified_by: expected '' not to be ''"
not ok V5 — HEAD: an EXISTING thread file is not appended to when a later note is absent-fielded …
       message: "expected [Function] to throw an error"
not ok V7 — the set is DERIVED …
       message: "compactor.ts#composeThreadNote interpolates note.verified_by without asking assertNoteFields first: expected false to be true"
exit 1
```

Offline, before any edit, against `941197e2`'s committed `scripts/compactor.js`: `writeThread('T-1','agent-a','b',r,{kind,by,at,confidence,refs,supersedes:null})` -> `…/T-1/threads/agent-a.md` with `[ 'verified_by: undefined' ]`.

`check tdd-red-evidence` -> `RED_EVIDENCE_OK` (`target_test_failed`; tests 7 / pass 4 / fail 3). V6 is green on both sides by design — it is the unchanged-behaviour proof, not a RED target.

GREEN: `scripts/compactor.test.ts scripts/admission-server.test.ts` -> `Test Files 2 passed (2)`, `Tests 264 passed (264)` (compactor 211 -> 215, admission-server 46 -> 49).

The interpolation-site derivation, quoted: `grep -rln 'note\.verified_by' scripts/*.ts | grep -v '\.test\.ts' | wc -l` -> `2`; `grep -rn '${note.verified_by}' scripts/*.ts | grep -v test` -> `scripts/compactor.ts:639` and `scripts/context-io.ts:1640` (the guard's docblock was reworded so the literal template grep counts interpolation sites only); the plan's wider `grep -rn 'note.verified_by' scripts/*.ts | grep -v test` -> 8 lines, of which 2 are the interpolations, 1 the guard call in `assertNoteFields`, 1 a comment, and 4 are READS (`vb = (note.verified_by ?? "").trim()` ×2 and the ledger scalars ×2) — the V7 AST walk counts template spans only and reports exactly 2.

## The post-wave gate, quoted

First full run (after Task 2 GREEN, before the probe fix): `Test Files 2 failed | 76 passed (78)`, `Tests 19 failed | 5382 passed | 2 skipped (5403)` — every red in `scripts/check-platform-shapes.test.ts` (15) and `scripts/uat-gate-exit-contract.test.ts` (4), all with the same root: `the note position's ORDINARY content could not be composed (verdict=refuse message=context-io: field "at" is absent (undefined), not a string — refusing to compose …)`. The probe driver was the caller (deviation 3). After `5da6218f`, the whole block once more on the committed tree:

```
npm run build && npm run check:build-parity && npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes
 PASS  Build parity: tracked build outputs that moved when the build ran: 0 findings over 69/69 elements   ALL CHECKS PASSED
 Test Files  78 passed (78)   Tests  5401 passed | 2 skipped (5403)   Duration  496.78s
 ALL CHECKS PASSED (nul-bytes)      exit 0
npm run freshness:hook-manifest -> Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.
npm run check:diff-disposition / check:imperative-lexicon / check:banned-claims / node scripts/check-foundation-guards.js -> each ALL CHECKS PASSED
```

`npm test` was not run. No governed prose (agent-factory/, docs/) was touched, so no disposition row was needed. STATE.md longest line after the state writes is checked in the self-check below.

## Task Commits

1. **Task 1 RED** — `52eee916` (test): V1-V4 failing against the base writer
2. **Task 1 GREEN** — `8b82b4bc` (feat): `assertNoteScalar` / `assertNoteRefs` / `assertNoteFields`; `composeNote` and its four callers; `emitCheckpointNote`'s loop asks the guard; twins + manifest
3. **Task 2 RED** — `c3127f8e` (test): V5/V7 failing against the base compactor; V6 the unchanged-route control
4. **Task 2 GREEN** — `4fa7bd65` (feat): `composeThreadNote` asks the imported field list; the server's boundary sentence; twins + manifest
5. **Gate fix** — `5da6218f` (fix): the platform-shape probe supplies a complete note

No refactor commit: nothing was left to clean after GREEN on either task.

**TDD gate compliance:** `git log -E --grep='^test\(33-26\):'` -> `c3127f8e`, `52eee916`; `--grep='^feat\(33-26\):'` -> `4fa7bd65`, `8b82b4bc`; each RED sha precedes its GREEN sha in the log.

## Files Created/Modified

- `scripts/context-io.ts` / `.js` — the three exported guards; `composeNote` guards first; `composeValidatedNote`'s block becomes one call; `admitAndAppend` guards at its top; `emitVerdict` / `emitCheckpointNote` ask the field list; the round-4 loop drops its own `typeof`
- `scripts/context-io.test.ts` — the `33-26` block (V1-V4, the base-kit PREMISE idiom); the RA2-3 refusal regex widened to `refusing to (emit|compose)`
- `scripts/compactor.ts` / `.js` — `assertNoteFields` imported and asked in `composeThreadNote`; the `promote` comment names the new guard
- `scripts/compactor.test.ts` — the `33-26` block (V5 ×3, V7); `dirname` and `typescript` imported
- `scripts/admission-server.ts` / `.js` — the boundary-default sentence in the `propose_note` handler (no behaviour change)
- `scripts/admission-server.test.ts` — the `33-26 V6` block (3 cases)
- `scripts/check-platform-shapes.ts` / `.js` — the note-position driver's complete note
- `hooks/hook-entry.ts` / `.js` — the regenerated module-hash manifest

## Decisions Made

See `key-decisions` in the frontmatter: the guard at `admitAndAppend`'s top and inside `composeNote` (one register past the plan's placement, for the ledger-before-persist reason); the `emitCheckpointNote` loop folded into the one guard; the `refs` list guard; row 258 left `open` for the verifier/human; the raw thread tier's stricter provenance refusal stated rather than carved out.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The guard is asked before `admitAndAppend` composes and ledgers, and inside `composeNote` itself**
- **Found during:** Task 1 (V2 red: `admitAndAppend` with `kind: undefined` was refused by `validate`'s enum AFTER `composeNote` had rendered `kind: undefined`)
- **Issue:** the plan placed the guard in `composeValidatedNote`, but `admitAndAppend` calls `composeNote` on both of its own branches before that function is reached, and on the gated branch appends the GOV-02 ledger event before persisting — a mistyped `confidence` (a value `validate` accepts) would be ledgered, then refused by the writer. A refusal "before anything is composed" was not true on that route.
- **Fix:** `assertNoteFields` (the one list) at the top of `admitAndAppend`, as `composeNote`'s first statement, and ahead of `noteId` in every caller; V4 derives the caller set and asserts the ordering.
- **Files modified:** `scripts/context-io.ts`, `scripts/context-io.test.ts`
- **Verification:** V2 (both routes, ten shapes), V4 (f)
- **Committed in:** `8b82b4bc`

**2. [Rule 2 - Missing critical] `refs` gets a named list guard; `emitCheckpointNote`'s loop asks the one guard**
- **Found during:** Task 1
- **Issue:** `for…of` over a non-array `refs` is an unnamed TypeError for `undefined` and iterates CHARACTERS for a string — `refs: ""` composed an empty `refs:` block on the base, a silent normalisation of a mistyped field. Separately, once the scalar guard carried the type rule, the round-4 `typeof` block in `emitCheckpointNote` was a second spelling of it (the plan's "no second copy" prohibition).
- **Fix:** exported `assertNoteRefs`; the loop calls `assertNoteScalar` only. One existing regex widened (`/refusing to (emit|compose)/`) for the two missing-field cases; the five vocabulary cases keep their sentence.
- **Files modified:** `scripts/context-io.ts`, `scripts/context-io.test.ts`
- **Verification:** V2 (`refs absent`, `refs a string`), V4 (a) (the type refusal is spelled in exactly one function), the RA2-3 sweep still green
- **Committed in:** `8b82b4bc`

**3. [Rule 1 - Bug] The platform-shape probe driver relied on the bug**
- **Found during:** Task 2's full-suite gate (19 reds in `check-platform-shapes.test.ts` and `uat-gate-exit-contract.test.ts`)
- **Issue:** `scripts/check-platform-shapes.ts` `contextDriverBody` wrote a child script calling `appendNote("T-shape", { kind, by, refs }, …, noteId, base)` — with a precomputed id the base writer never read `note.at` and composed `at`, `verified_by` and `confidence` as the word `undefined`. The CONTROL rows expect that ORDINARY content to WRITE; the guard refused it by name.
- **Fix:** the driver's note carries all six fields (`at: "2026-01-01T00:00:00Z"`, `verified_by: ""`, `confidence: "low"`, `supersedes: null`), with a comment naming the plan.
- **Files modified:** `scripts/check-platform-shapes.ts`, `scripts/check-platform-shapes.js`
- **Verification:** the two files -> `62 passed (62)`; the full gate -> `5401 passed | 2 skipped`
- **Committed in:** `5da6218f`

---

**Total deviations:** 3 auto-fixed (2 missing-critical, 1 bug). **Impact on plan:** all three are the plan's own class one register over (a route that composes before the guard; a list that normalises silently; a caller that depended on the word). No scope creep beyond `scripts/`; no governed prose touched.

## Issues Encountered

- The first full-suite run after Task 1's GREEN showed 2 reds in `31-37 WR-36` (hook manifest stale after the context-io rebuild); `npm run generate:hook-manifest` closed them, as the plan directed.
- `npm run check:build-parity` reads `moved` on an uncommitted rebuild (it asks git); it was re-run on the committed tree after each GREEN and reads `PASS … 69/69`.

## Known Stubs

None. No placeholder values, skipped tests or unrun `<verify>` commands were introduced.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema surface. T-33-120/121/122 are mitigated as the register planned (V1/V4, V5/V7, V3); no package was installed (T-33-SC).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- KIT § 3 (WINDOWS.md row 258) is closed in code on every composing route; the row stays `open` in the ledger for the verifier's or the human's flip, matching how 33-25 left row 256.
- CAP-01 / CAP-02 / CAP-03 edge rows: unchanged by this plan (no verdict predicate moved; `capThreePredicate` reads `by`). CAP-02 is measured by 33-31 only.
- A CHANGELOG `Security` entry for the writer's new refusal was NOT written (CHANGELOG.md is outside this plan's `<files>`); the phase's closing document plan should add one sentence beside 33-25's seal entry.
- Ready for 33-27.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-21*

## Self-Check: PASSED

- 8 key files present on disk; 5 task commits (`52eee916`, `8b82b4bc`, `c3127f8e`, `4fa7bd65`, `5da6218f`) found in `git log`; no raw control bytes in this summary.

---
phase: 27-spawn-correctness-kit-set-authority
plan: 11
subsystem: testing
tags: [typescript, freshness-gate, ci, kit-model, set-derivation, drift-detection, spawn-02]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "listAgentAdapters(kitRoot) / listSkillAdapters(kitRoot) as the one recursive adapter authority (27-10); the 17 generated agent adapters (27-07); the CHECK_ROOT hermetic-root convention (27-01/27-03)"
provides:
  - "the adapter freshness gate INVOKED — the ubuntu-only CI gate block plus a test file that spawns it"
  - "scripts/adapters-freshness.test.ts — green, byte-drift RED, top-level orphan RED, nested orphan RED, fail-closed broken regeneration"
  - "SCRIPT_ROOT / KIT_ROOT split in adapters-freshness.ts, KIT_ROOT honoring CHECK_ROOT"
  - "a set half comparing FULL relative paths, so a nested orphan is a named member"
  - "check-kit-refs.ts consuming the shared adapter authority; its local derivation deleted"
  - "a fail-red finding when ONE adapter directory is unreadable while the other still populates the set"
affects: [27-12, 27-13, 27-14, ci, adapters-freshness, check-kit-refs]

tech-stack:
  added: []
  patterns:
    - "A gate is not done when it passes by hand; it is done when something re-runs it — wired at BOTH ends (CI step + test file) so a workflow refactor cannot silently un-gate it"
    - "Set members are full relative paths from the shared authority, never basenames; two entries at different depths are distinct members"
    - "The hermetic-root override (CHECK_ROOT) is reused, never re-invented; every planted bypass mutates a temp mirror and the committed tree stays clean"
    - "A thrown derivation error is RECORDED as its own finding, not swallowed and not allowed to abort unrelated assertions"

key-files:
  created:
    - scripts/adapters-freshness.test.ts
  modified:
    - scripts/adapters-freshness.ts
    - scripts/adapters-freshness.js
    - scripts/check-kit-refs.ts
    - scripts/check-kit-refs.js
    - scripts/check-kit-refs.test.ts
    - .github/workflows/ci.yml

key-decisions:
  - "The gate is wired at BOTH ends deliberately: the CI step makes drift red today, the test file makes the drift lane survive a workflow refactor that drops or renames the step (T-27-51). Neither alone was accepted as sufficient."
  - "SCRIPT_ROOT and KIT_ROOT are separate constants: the compiled twins the mirror-spawn copies must always come from the committed output under test, while the tree being JUDGED may be a hermetic mirror. Conflating them is what made the gate untestable."
  - "CHECK_ROOT is reused rather than a fourth root variable introduced — the tree already carries enough root conventions and two other gates already honor this one."
  - "CHECK_ROOT is STRIPPED from the mirrored generator's child environment: if a future generator revision ever learned the override, an inherited value would point the 'fresh regeneration' back at the tree it is compared against and the gate would compare a tree with itself and always pass."
  - "The generator's fixed-literal OUT_DIR stays fixed (ASVS V12 / T-27-28 path-traversal mitigation); the mirror-spawn exists precisely so no output flag is needed."
  - "The explicit zero-regeneration branch is KEPT beside the authority's vacuity throw: the throw covers 'unreadable or empty', this covers 'the generator exited 0 and emitted nothing into a directory this gate created'. Both fail closed."
  - "check-kit-refs re-prefixes the fixed subpaths with join(), not a `/` template: its own repo-relative paths come from walk()/join(), and Assertion 3 compares the two sets directly — a separator mismatch would break set equality on Windows silently."
  - "KIT-02 deliberately NOT checked off: plan 27-13 (installer / uninstaller) still carries its own adapter derivation. SPAWN-02 IS checked off — no remaining plan names it and both of its lanes are now live."

patterns-established:
  - "Mutation-test the oracle, not just the code: the recursion was re-disabled in the compiled gate and the nested-orphan case confirmed to flip RED, proving the case is load-bearing rather than incidentally green"
  - "Adversarially reproduce every drift shape by hand against a hermetic mirror BEFORE trusting the test file that automates it"

requirements-completed: [SPAWN-02]

coverage:
  - id: D1
    description: "The adapter freshness gate is invoked by two independent lanes — the ubuntu-only CI gate block and a test file that spawns the committed .js"
    requirement: "SPAWN-02"
    verification:
      - kind: unit
        ref: "scripts/adapters-freshness.test.ts#adapters-freshness.js (SPAWN-02 adapter drift gate)"
        status: pass
      - kind: manual
        ref: "grep -c 'freshness:adapters' .github/workflows/ci.yml == 1, inside the 5-invocation ubuntu-only block"
        status: pass
    human_judgment: false
  - id: D2
    description: "A committed hand-edit to any adapter — the shape of both reproduced bypasses — makes the gate exit non-zero naming the drifted file"
    requirement: "SPAWN-02"
    verification:
      - kind: unit
        ref: "scripts/adapters-freshness.test.ts#Case 2 (RED, byte drift)"
        status: pass
      - kind: manual
        ref: "hand-planted byte append in a temp mirror → exit 1, 'STALE: 1 of 17 ... grugops-qe-e2e.md'"
        status: pass
    human_judgment: false
  - id: D3
    description: "An orphan adapter the generator does not produce fails the set half by name, at the top level AND below it"
    requirement: "SPAWN-02"
    verification:
      - kind: unit
        ref: "scripts/adapters-freshness.test.ts#Case 3 (top-level orphan) / #Case 4 (nested orphan)"
        status: pass
      - kind: manual
        ref: "mutation test — recursion disabled in the compiled gate → Case 4 flips RED (1 failed | 4 passed); restored → 5 passed"
        status: pass
    human_judgment: false
  - id: D4
    description: "A regeneration that cannot run cleanly never reports the adapters as fresh; the gate prints the generator's output and exits non-zero"
    requirement: "SPAWN-02"
    verification:
      - kind: unit
        ref: "scripts/adapters-freshness.test.ts#Case 5 (fail-closed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The gate honors the CHECK_ROOT hermetic-root override, so planted bypasses mutate a mirror and never the committed tree"
    requirement: "SPAWN-02"
    verification:
      - kind: integration
        ref: "git status --porcelain empty after the suite; two consecutive runs both 5/5 green"
        status: pass
    human_judgment: false
  - id: D6
    description: "adapters-freshness.ts and check-kit-refs.ts each consume the shared adapter authority; neither carries its own derivation"
    requirement: "KIT-02"
    verification:
      - kind: manual
        ref: "grep -v '^\\s*//' scripts/adapters-freshness.ts | grep -c readdirSync == 0; grep -c 'function derivedAdapterFiles' scripts/check-kit-refs.ts == 0"
        status: pass
      - kind: unit
        ref: "scripts/check-kit-refs.test.ts (13 cases, incl. the new partial-derivation-failure case)"
        status: pass
    human_judgment: false

metrics:
  duration: 15m
  completed: 2026-07-29
  tasks: 3
  files: 7

status: complete
---

# Phase 27 Plan 11: Make the Adapter Freshness Gate a Gate Summary

The one gate that would have caught either reproduced hand-edit bypass was invoked by nothing; it now
runs in continuous integration and is spawned by a five-case test file, and it can finally see a
nested orphan — which the old non-recursive listing dropped outright.

## What Was Built

**Task 1 — `refactor(27-11)`, commit `40df048`.** `scripts/adapters-freshness.ts` lost its local
`readdirSync` listing helper; both sides of the comparison now come from
`kit-model.listAgentAdapters()`, called once with the tree under judgement and once with the
regeneration mirror. Because the authority returns **full relative paths**, the set half changed
behavior in the way that matters: a nested adapter is a named `EXTRA` member instead of being
invisible, and it can never be folded into a top-level entry sharing its basename. The authority
throws rather than returning `[]`, so each call is wrapped to keep the gate's own fail-closed
wording — naming the directory and the regeneration command — while **carrying the thrown message
through** rather than discarding the one piece of information that says which directory failed.

The two roots the gate implicitly conflated are now separate constants. `SCRIPT_ROOT` stays fixed and
script-relative because that is where the committed compiled twins the mirror-spawn copies live;
`KIT_ROOT` honors the same `CHECK_ROOT` override `check-foundation-guards.ts` and `check-kit-refs.ts`
already honor, defaulting to `SCRIPT_ROOT`. No fourth root variable was introduced. The generator's
fixed-literal `OUT_DIR` was left alone — no output flag was added — because the mirror-spawn exists
precisely so that path-traversal mitigation can stay fixed.

**Task 2 — `test(27-11)`, commit `492fe72`.** `scripts/adapters-freshness.test.ts` drives the
**committed compiled** `scripts/adapters-freshness.js` as a child process (never the `.ts`), with a
`mirror()` helper that copies the three kit inputs into a temp tree per case. Five cases: green over
the real tree; byte drift; top-level orphan; nested orphan asserted at its full relative path;
broken regeneration asserting the success wording is absent. The fail-closed case plants a role file
whose name does **not** start with `_`, because the generator's D-03 underscore filter would silently
drop it and the regeneration would then succeed over a smaller role set — passing the case for
entirely the wrong reason.

**Task 3 — `fix(27-11)`, commit `b9ddb32`.** `.github/workflows/ci.yml`'s ubuntu-only gate block gained
`npm run freshness:adapters` beside its three siblings, with a comment naming SPAWN-02 and stating why
it is there. Nothing was reordered or renamed, and it was **not** added to the windows leg — the
block's own comment records that freshness diffs are scoped to one operating system to avoid
path-separator drift, and that reasoning is unchanged. `scripts/check-kit-refs.ts`'s
`derivedAdapterFiles()` was deleted and replaced by the shared authority; the fixed subpaths are
re-prefixed at the call site with `join()` rather than a `/` template, because this file's own
repo-relative paths come from `walk()`/`join()` and Assertion 3 compares the two sets directly.

## Verification Evidence

Every command below was run and its real output observed.

| Command | Result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | `All build outputs fresh: 29 committed .js file(s) match a fresh tsc rebuild.` |
| `node scripts/adapters-freshness.js` | `Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.` |
| `node scripts/check-kit-refs.js` | exit 0, `PASS 24 adapter file(s) derived`, `26 marker sites (2 named + 24 derived adapters)` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-uat-oracles.js` | exit 0 |
| `npx vitest run scripts/adapters-freshness.test.ts` | 5 passed, twice consecutively |
| `npx vitest run scripts/check-kit-refs.test.ts` | 13 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **33 files** (baseline 32 + 1), 895 passed, 2 skipped |
| `git status --porcelain` after the suite | empty |
| `grep -c "freshness:adapters" .github/workflows/ci.yml` | `1`, inside a 5-invocation ubuntu-only block |
| `grep -v '^\s*//' scripts/adapters-freshness.ts \| grep -c readdirSync` | `0` |
| `grep -c 'from "./kit-model.js"' scripts/adapters-freshness.ts` | `1` |
| `grep -v '^\s*//' scripts/check-kit-refs.ts \| grep -c "function derivedAdapterFiles"` | `0` |

The bare `npm test` script was never run — it triggers the live model-CLI end-to-end lane.

### Adversarial reproduction (a green suite is not proof for a safety invariant)

Before the test file existed, every drift shape was planted **by hand** into a temp mirror and the
gate's real output observed:

| Plant | Observed |
|---|---|
| byte append to `grugops-qe-e2e.md` | `STALE: 1 of 17 committed adapter(s) differ ... grugops-qe-e2e.md`, exit 1 |
| top-level `zz-orphan.md` | `1 EXTRA committed adapter(s) ... zz-orphan.md` (18 committed, 17 regenerated), exit 1 |
| nested `nested/zz-nested.md` | `1 EXTRA committed adapter(s) ... nested/zz-nested.md`, exit 1 |
| non-conforming role file | generator's own ERROR printed, then `did not run cleanly`, exit 1 |
| adapter directory removed | `cannot read the committed adapter directory ... — kit-model: cannot read kit directory ...`, exit 1 |
| unmodified mirror | exit 0 — the override resolves the mirror, not the real tree |

Then the **oracle itself** was mutation-tested. The compiled gate was patched to reproduce the old
non-recursive behavior (`listAgentAdapters(root).filter(rel => !rel.includes("/"))`) and the suite
re-run: **Case 4 failed, 4 passed** — the gate exited 0 on a nested orphan, which is the bypass. The
mutation was reverted and `npm run freshness` confirmed the committed `.js` matches its `.ts`. Case 4
is therefore load-bearing rather than incidentally green.

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] `check-kit-refs.ts` now fails red when ONE adapter directory is unreadable

- **Found during:** Task 3.
- **Issue:** The vacuity floor only fires when the derived set is **empty**. With `.claude/agents`
  removed and `.claude/skills` intact, the pre-27-11 derivation returned `[]` for the unreadable half,
  the set was still 7 files, the floor passed, and every derived assertion silently ran over a set that
  had lost seventeen members. The shared authority throws instead of returning `[]`, so swallowing that
  throw would have preserved the hole in a new costume.
- **Fix:** The thrown message is recorded per directory and emitted as its own `FAIL` naming the
  directory, without aborting Assertions 1–3 (which read a different scan set entirely). Verified by
  hand — `FAIL adapter derivation failed — kit-model: cannot read kit directory .../.claude/agents`
  beside `PASS 7 adapter file(s) derived`, exit 1 — and pinned by a new test case that also asserts the
  vacuity-floor wording is **absent**, so it cannot pass for the floor's reason.
- **Files:** `scripts/check-kit-refs.ts`, `scripts/check-kit-refs.js`, `scripts/check-kit-refs.test.ts`.
  **Commit:** `b9ddb32`.

### 2. [Rule 2 — missing critical functionality] `CHECK_ROOT` stripped from the mirrored generator's environment

- **Found during:** Task 1.
- **Issue:** `spawnSync` inherits the parent environment. The generator does not read `CHECK_ROOT`
  today, but if it ever learned the same override the inherited value would point the "fresh
  regeneration" at the very tree being judged — the gate would compare a tree with itself and pass
  unconditionally. That is a silent-always-green failure mode in a gate whose entire purpose is to be
  hard to fool.
- **Fix:** The child environment is a copy with `CHECK_ROOT` deleted, with the reasoning in a comment.
- **Files:** `scripts/adapters-freshness.ts`. **Commit:** `40df048`.

### 3. `check-kit-refs.test.ts` carried no hard-coded adapter count to re-express

Task 3 asked for any hard-coded adapter count in that file to be re-expressed against the authority.
There was none: the marker-site cases already read the count the gate **reports** (`reportedMarkerSites`)
and assert relative movement (`baseline + 1`) rather than an absolute number. No change was needed, and
none was invented to satisfy the instruction. All 12 pre-existing cases pass unchanged; the file is at
13 only because of deviation 1.

### 4. KIT-02 deliberately NOT checked off in REQUIREMENTS.md

This plan finishes the KIT-02 repoint for the two `scripts/` consumers it owns, but plan **27-13**
(installer / uninstaller) still carries its own adapter derivation. Marking KIT-02 complete here would
repeat the premature-completion failure this phase's own verification pass already caught once.
**SPAWN-02 IS** marked complete: both of its lanes are live, and no remaining plan (27-12 … 27-17)
names it.

## Flagged Assumption Carried Forward

The plan flagged SPAWN-02's edge probe as `unclassified` and named one uncovered edge: whether a byte
difference confined entirely to **line endings** produces a message a reader can act on. Status
unchanged and honestly reported — the comparison is whole-buffer `Buffer.equals`, so such a
difference **does** fail closed, which is the safe direction; only the message quality is open. The
gate would say `STALE: 1 of 17 committed adapter(s) differ ...` without saying the difference is
invisible in a diff viewer. Not fixed here, not claimed as covered.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary. The
`CHECK_ROOT` override is the same one two existing gates already honor and is read-only in effect —
it selects which tree is *read*; the gate writes only into its own `mkdtempSync` directory and removes
it before every exit. The generator's fixed-literal `OUT_DIR` was preserved unchanged, so the ASVS V12
path-traversal posture (T-27-28) is intact. Register items T-27-48 through T-27-52 are each mitigated
and each pinned by a named test case.

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired data path was introduced.

## Self-Check: PASSED

- `scripts/adapters-freshness.ts`, `scripts/adapters-freshness.js`, `scripts/adapters-freshness.test.ts`,
  `scripts/check-kit-refs.ts`, `scripts/check-kit-refs.js`, `scripts/check-kit-refs.test.ts`,
  `.github/workflows/ci.yml` — all present on disk.
- Commits `40df048`, `492fe72`, `b9ddb32` — all present in `git log`.
- Both committed `.js` twins verified fresh against their `.ts` sources by `npm run freshness` (exit 0).

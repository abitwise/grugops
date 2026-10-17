---
phase: 27-spawn-correctness-kit-set-authority
plan: 32
subsystem: infra
tags: [typescript, node, installer, uninstaller, safety-guard, set-literal-drift, documentation, kit-model]

# Dependency graph
requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "D-28's shared install/kit-source.ts derivation module (the home the marker set moves into), and D-36's per-side cycle floors (the reason the WR-03 equality is two cases rather than one)"
provides:
  - "SOURCE_MARKERS + hasSourceMarkers() — the self-checkout marker predicate answered ONCE, in install/kit-source.ts, consumed by both binaries (D-37)"
  - "A read-only real-repository existence case over the imported constant — the forcing function whose absence was WR-02"
  - "The nested-walk equality both walk headers promise, as two cases: member equality over the two-path fixture, same-path-named refusal over the cycle fixture (D-38)"
  - "A true rationale for the surviving duplicate walk, replacing a file-count claim D-28 had falsified"
  - "install/README.md's reversal section stating the refusal is always on and not dry-run exempt"
affects: [27-verification-round-4, KIT-02, install, uninstall, check-foundation-guards]

actuals:
  tokens: 12783
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Derive the set, assert the count, AND assert it over the real repository — a fixture that manufactures its own stub proves the predicate and never proves the constant"
    - "Collapse the duplicate; keep the deliberate difference. Only the marker half is shared; each binary's path-equality half stays local because the two resolve the target differently on purpose"
    - "When two sides answer one predicate through different documented floors, the honest equality is 'both name the same member and neither is silent' — asserted by CAPTURING each side's name, never by restating a literal into both"

key-files:
  created: []
  modified:
    - install/kit-source.ts
    - install/kit-source.js
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.test.ts
    - install/README.md

key-decisions:
  - "D-37: the self-checkout marker pair becomes ONE exported constant SOURCE_MARKERS plus a shared predicate hasSourceMarkers() in install/kit-source.ts; both binaries import it and neither keeps a literal. It names the RUNTIME artifact install/install.js, not the TypeScript source."
  - "D-37's forcing function is a read-only case over the REAL repository root, walking the IMPORTED constant and asserting the length as a number — not another fixture."
  - "Only the MARKER half is shared. Each binary's path-equality half is deliberately left local: uninstall.ts normalises with resolve() before comparing and install.ts does not, and merging them would silently pick one behaviour for both."
  - "D-38: the stale file-count rationale is DELETED rather than softened, and the equality it appeals to becomes two cases — member equality where the two sides agree, same-path-named refusal where D-36 makes them differ."
  - "IN-03 is closed as documentation only. The always-on refusal is a mechanical safety check; documenting it is the fix, and exempting DRY_RUN would be weakening it."

patterns-established:
  - "A marker naming a file nobody asserts the existence of is a guard whose condition may already be unfireable. Round 3 corrected WHICH file the marker named; that is not the fix, because the next rename reproduces it exactly. The fix is the assertion over the real tree."
  - "Assert 'neither is silent' BEFORE asserting 'both agree' — two silences are trivially equal, and mutual silence is precisely the failure the two floors exist to prevent."

requirements-completed: []

coverage:
  - id: D1
    description: "The self-checkout marker set exists ONCE as an exported constant in the shared derivation module; both binaries read it from there and the hand-synced byte-identical literal pair is deleted (D-37, WR-02)"
    requirement: KIT-02
    verification:
      - kind: unit
        ref: "install/install.test.ts#D-37: the shared marker predicate refuses BOTH binaries on the full set, and neither on a half"
        status: pass
      - kind: other
        ref: "grep — `install\", \"install.ts\"` occurrences in install/install.ts and install/uninstall.ts: 0 and 0; hasSourceMarkers occurrences: 3 and 3"
        status: pass
    human_judgment: false
  - id: D2
    description: "A case asserts, over the real repository root with NO fixture, that every entry of the exported marker set exists — importing the constant so a rename cannot pass — and asserts the count as a number"
    requirement: KIT-02
    verification:
      - kind: unit
        ref: "install/install.test.ts#SOURCE_MARKERS: every marker EXISTS in the real repository, and the set is exactly two (D-37, WR-02)"
        status: pass
      - kind: other
        ref: "adversarial mutation — constant reverted to the CR-04 shape `install/install.sh` and rebuilt: exactly that one case went RED naming the missing marker while all three fixture cases stayed GREEN"
        status: pass
    human_judgment: false
  - id: D3
    description: "The marker names the committed RUNTIME artifact rather than the TypeScript source, so it names a file whose presence the run itself already proves"
    requirement: KIT-02
    verification:
      - kind: other
        ref: "install/kit-source.ts SOURCE_MARKERS = [\"install/install.js\", \"agent-factory/VERSION\"]; the real-repository case above is what keeps it honest"
        status: pass
    human_judgment: false
  - id: D4
    description: "Empty/partial edge: the marker predicate over a directory containing neither marker, and over one containing exactly one of the two, both return not-a-checkout — the pair is required and either half alone is insufficient, whichever half it is"
    requirement: KIT-02
    verification:
      - kind: unit
        ref: "install/install.test.ts#D-37 … (b) loops over EVERY member in turn, asserting hasSourceMarkers false and neither binary refusing"
        status: pass
      - kind: integration
        ref: "captured manual probe — full set: install.js exit 1, uninstall.js exit 1; each single marker: exit 0, zero `refusing` on stderr"
        status: pass
    human_judgment: false
  - id: D5
    description: "The recorded justification for two implementations of the adapter-set predicate states the rationale that holds (layout decoupling) and no longer claims a file count that is false (WR-03)"
    requirement: KIT-02
    verification:
      - kind: other
        ref: "grep — the former claim occurs 0 times in install/install.test.ts; `D-28` occurs 3 times"
        status: pass
    human_judgment: false
  - id: D6
    description: "The equality both walk-site headers promise is a CASE: the installer's nested derivation equals the nested subset of the authority's set over the two-path fixture, and over the cycle fixture both sides name the SAME relative path with neither silent (D-38)"
    requirement: KIT-02
    verification:
      - kind: unit
        ref: "install/install.test.ts#WR-03 part 1: over the two-path fixture the installer's NESTED walk equals the authority's nested subset, by member AND by count"
        status: pass
      - kind: unit
        ref: "install/install.test.ts#WR-03 part 2: over the CYCLE fixture the two sides name the SAME declined path and neither is silent (D-36)"
        status: pass
      - kind: other
        ref: "adversarial mutation — deleting the installer's cycles.push and, separately, removing ${base} from the authority's throw each turned part 2 RED on the matching 'neither is silent' assertion"
        status: pass
    human_judgment: false
  - id: D7
    description: "The reversal documentation states that the self-checkout refusal is always on, is not exempted by dry-run, exits 1 and prints nothing inside a grugops checkout, and names the override flag (IN-03)"
    requirement: KIT-02
    verification:
      - kind: integration
        ref: "captured transcript — DRY_RUN=1 uninstall against a `cp -R` throwaway grugops checkout: exit 1, 0 bytes on stdout, refusal on stderr naming --allow-self"
        status: pass
      - kind: other
        ref: "install/README.md Undo section — the clause sits immediately beside the preview line; `allow-self` occurs 5 times in the file"
        status: pass
    human_judgment: false
  - id: D8
    description: "A normal installed target can never acquire the runtime-artifact marker, because the installer writes no install/ directory into a target — so the widened pair stays free of false refusals"
    verification: []
    human_judgment: true
    rationale: "Recorded as a backstop truth in the plan (T-27-WR02-03, disposition accept). The shipped CR-04 negative control (a normal installed target is NOT refused and still uninstalls, exit 0) plus the either-half-alone loop are what pin it operationally; the general claim about every possible target is not asserted."

# Metrics
duration: 11min
completed: 2026-08-01
status: complete
---

# Phase 27 Plan 32: One Asserted Marker Set, a True Rationale, and the Equality Both Headers Promised Summary

**The self-checkout guard's marker pair — two hand-synced literals in two binaries, with nothing anywhere asking whether the files they named were real — is now one exported constant pinned by a read-only assertion over the actual repository, and the "equality bought by cases" that two walk headers have been promising is finally a case that goes red when either side goes silent.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-08-01T19:42:22Z
- **Completed:** 2026-08-01T19:53:29Z
- **Tasks:** 2 of 2
- **Files modified:** 8 (3 sources + their committed `.js` twins, 1 test file, 1 document)

## Accomplishments

- **WR-02 closed structurally.** Round 3 corrected *which file* the marker names. This plan added the thing whose absence let a marker naming a file deleted in `f9dab9f` survive about a hundred commits: an assertion that the named files exist **in the real repository**, walking the **imported** constant. The duplicate literal is gone from both binaries.
- **The forcing function is proven to have teeth, and proven to be the only thing with teeth.** Mutating the constant back to the CR-04 shape turned **exactly one** case red — the new one. All three shipped fixture cases stayed green, because they derive their stubs from the constant and so happily manufacture a stub for whatever ghost the guard names. That is the finding, demonstrated rather than argued.
- **WR-03's false rationale deleted, not softened,** and the equality it appeals to written down as two cases covering the nested walks, which had been compared by nothing.
- **IN-03 closed as documentation.** The binary was not touched; the refusal is a mechanical safety check and weakening it under dry-run would be the wrong fix.

## Task Commits

1. **Task 1: collapse the marker pair into one asserted constant (D-37, WR-02)** — `03888af` (fix)
2. **Task 2: true duplicate-walk rationale + the promised equality as a case, and the reversal doc clause (WR-03, IN-03)** — `2243a4a` (docs)

## WR-02 — the forcing-function RED/GREEN transcript

The mutation is the CR-04 defect verbatim: point `SOURCE_MARKERS` at `install/install.sh`, the file `f9dab9f` deleted when the POSIX installer was retired (D-09). Rebuilt with `npm run build`, so the suite drives the **committed `.js`** as the repo idiom requires.

```
MUTATED: install/install.js -> install/install.sh (the file f9dab9f deleted)

=== RED (committed .js, mutated constant) ===
 × SOURCE_MARKERS: every marker EXISTS in the real repository, and the set is exactly two (D-37, WR-02)
AssertionError: expected 'install/install.sh: false' to be 'install/install.sh: true'
  Expected: "install/install.sh: true"
  Received: "install/install.sh: false"
      Tests  1 failed | 68 passed | 1 skipped (70)

=== GREEN (committed .js, constant restored) ===
All build outputs fresh: 32 committed .js file(s) match a fresh tsc rebuild.
      Tests  69 passed | 1 skipped (70)
```

**Read the RED count, not just the RED.** `1 failed | 68 passed` is the whole argument for this plan. The three shipped self-checkout cases — the ones round 3 wrote and shipped green — were **entirely unbothered** by the guard being pointed at a file that has not existed since `f9dab9f`. They plant their own stub, so the predicate over the fixture is true either way. Only a case that reads the **real** tree can tell.

## WR-02 — the marker-half behavioural transcript (both binaries, throwaway targets)

The target is a `mktemp -d` throwaway carrying only the two markers, never the live checkout, and it is **not** the source root, so the path-equality half cannot fire and the marker half is what is being measured.

```
=== (a) FULL marker set, target != source root ===
  install.js   exit=1  stderr: refusing: target looks like the grugops source checkout — you probably
                               meant --target <your-repo>. Pass --allow-self to override.
  uninstall.js exit=1  stderr: refusing: target looks like the grugops source checkout (/var/.../tmp.mw7…)
                               — uninstalling here would delete the kit's own committed adapters …

=== (b) ONE marker only ===
  only=install/install.js       uninstall.js exit=0  refused? 0
  only=agent-factory/VERSION    uninstall.js exit=0  refused? 0
```

The suite case asserts the same thing and additionally **loops over every member of the set** for the negative half, which is what pins the membership test as order-independent: no single entry can decide the answer, whichever one is present.

## WR-03 — the scratch-build failure transcripts

Two mutations, each removing one side's ability to name the declined path, each rebuilt and run against the committed `.js`. Sources were saved **outside git** and restored from those copies — 27-31 recorded a `git checkout --` restore silently reverting uncommitted fix edits while the freshness gate still read green, and that lesson was applied rather than re-learned.

```
########## MUTATION A — the INSTALLER stops naming the cycle (cycles.push deleted) ##########
 × WR-03 part 2: over the CYCLE fixture the two sides name the SAME declined path and neither is silent (D-36)
AssertionError: expected 'installer named a cycle: false' to be 'installer named a cycle: true'
      Tests  2 failed | 69 passed | 1 skipped (72)

########## MUTATION B — the AUTHORITY stops naming the path in its throw (${base} removed) ##########
 × WR-03 part 2: over the CYCLE fixture the two sides name the SAME declined path and neither is silent (D-36)
AssertionError: expected 'authority message names a path: false' to be 'authority message names a path: true'
      Tests  2 failed | 69 passed | 1 skipped (72)

########## RESTORED ##########
All build outputs fresh: 32 committed .js file(s) match a fresh tsc rebuild.
```

The second failure in each run is the shipped WR-04 case, which is the expected collateral — both mutations delete the mechanism it pins. `git diff` against `HEAD` for `install/kit-source.*` and `scripts/kit-model.*` was **empty** after restore, verified before the Task 2 commit.

## IN-03 — the dry-run refusal transcript

Against a `cp -R` throwaway copy of `install/`, `agent-factory/` and `.claude/` — never the live checkout as a target:

```
throwaway checkout: /var/folders/.../tmp.tbw72VE0xh/checkout
  (markers present: install/install.js=yes, agent-factory/VERSION=yes)

=== DRY_RUN=1 uninstall from inside a throwaway grugops checkout ===
exit=1
stdout bytes = 0
stderr       = refusing: target looks like the grugops source checkout (/var/.../checkout) — uninstalling
               here would delete the kit's own committed adapters and skills under .claude/. You probably
               meant --target <your-repo>. Pass --allow-self to override.
```

Exit `1`, **zero bytes on stdout** — which is exactly what the new README clause now says, and exactly what a reader of the old text would have misread as "the preview found nothing to undo".

## Files Created/Modified

- `install/kit-source.ts` / `.js` — `SOURCE_MARKERS`, `hasSourceMarkers()`, and the rationale that moves with them: why this pair, why the runtime artifact rather than the `.ts`, and why only the marker half is shared.
- `install/install.ts` / `.js` — imports `hasSourceMarkers`; the guard's marker half is now a call. The path-equality half and the stderr message are byte-unchanged.
- `install/uninstall.ts` / `.js` — the same, keeping its `resolve()`-normalising equality half and its own longer refusal message.
- `install/install.test.ts` — the `plantSourceMarkers` helper (derived from the constant, with an `only` mode for the negative half), the three shipped fixtures converted to it, the real-repository existence case, the both-binaries marker case, the rewritten kit-model-import rationale, and the two WR-03 equality cases.
- `install/README.md` — the always-on-refusal clause in the Undo section, immediately beside the preview line.

## Decisions Made

**The marker names `install/install.js`, not `install/install.ts` (D-37).** The compiled artifact is the file whose presence is already guaranteed wherever either binary can run at all — CLAUDE.md's constraint is that hosts run the committed `.js` with nothing installed, so a directory that can host this guard has the artifact by construction. The `.ts` is present only because this repository happens to commit both, which makes it a fact about the repo's layout rather than about the thing being guarded. The plan's own scenario for WR-02's recurrence is a `rootDir` move that relocates the sources and leaves the artifacts in place; naming the artifact is what makes that move survivable, and the real-repository case is what makes the *opposite* move fail loudly.

**Only the marker half was collapsed.** The plan was explicit and it turned out to matter: `uninstall.ts` compares `resolve(TARGET)` because its `abspath()` deliberately does not collapse `.`/`..` (sh byte-parity), while `install.ts` compares the target as computed. Merging the two would have silently picked one behaviour for both, under cover of "removing a duplicate". Both binaries now say so in a comment naming the other.

**"Neither is silent" is asserted before "both agree" (D-38).** Two silences are trivially equal. If the equality had been written first, both sides going quiet would have satisfied it — which is the precise failure D-36's two floors exist to prevent, so the case is ordered to fail on it. The authority's path is then **captured out of its message** rather than restated as a literal, and only after the cross-comparison is the observed `real/loop` pinned as a fixture sanity check.

**The cardinality is asserted on both sides of the part-1 equality.** Two empty arrays are `toEqual`. Without the numbers, a nested derivation that shrank to nothing on both sides would pass a member comparison and report success.

## Deviations from Plan

None. Both tasks executed as written; no auto-fix rules fired.

## Issues Encountered

**A verification grep read as a false negative once.** `grep -c 'symlink cycle at ${base}' scripts/kit-model.ts` returned `0` immediately after the restore, which momentarily looked like the mutation had not been reverted. A plain `grep -n "symlink cycle at"` and `git diff --stat` both confirmed the file was byte-identical to `HEAD`; the `0` was a quoting artifact, not a state. Recorded rather than dropped, because "the check that says the fix is missing" is exactly the kind of signal this phase has been wrong about in both directions.

## Verification Evidence

| Gate | Result |
|---|---|
| `npm run build && node scripts/freshness.js` | exit 0 — **32 committed `.js` fresh** |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1015 passed / 2 skipped / 35 files** (baseline 1011 / 2 / 35; +4 new cases) |
| `node scripts/check-foundation-guards.js` | exit 0 — `ALL CHECKS PASSED` |
| Live kit intact | 17 agent adapters, 7 skill adapters |
| `git diff package.json` | empty — the `{typescript, vitest}` dev-dep fence holds, zero dependencies added |
| `git status --porcelain` | clean apart from this plan's `<files>` (the pre-existing untracked `human-notes.txt` was not touched) |
| Destructive probes | every install and uninstall probe ran against a `mktemp -d` / `cp -R` throwaway; the live checkout was never a target |
| Commit `d75e391` intact | `process.exitCode = 3` present in **both** `install.ts` and `install.js`; the exact old call absent from both; its structural regression case still passing |

### Adversarial mutation results

| Mutation | Outcome |
|---|---|
| `SOURCE_MARKERS[0]` → `install/install.sh` (the CR-04 shape) | **1 failed** — only the new real-repository case; all three fixture cases stayed green, which is the finding |
| installer's `cycles.push(base)` deleted | **2 failed** — WR-03 part 2 red on `installer named a cycle: false`, plus the shipped WR-04 case |
| `${base}` removed from the authority's cycle throw | **2 failed** — WR-03 part 2 red on `authority message names a path: false`, plus the shipped WR-04 case |

## Requirements

**KIT-02 is deliberately NOT marked complete.** Round-4 verification has not run — it runs after this plan. The plan's `requirements` field lists KIT-02, but closure is not the verifier's verdict.

## Next Phase Readiness

Round 4's four plans are complete. Ready for round-4 verification.

**Carried forward:**

- **The set-literal inventory in `scripts/check-foundation-guards.ts` never listed the marker pair.** Entries 9/10 record the SKILLS/AGENT_REL pair D-28 collapsed and entry 15 records the deliberately-paired RUNNABLES mapping, but the self-checkout markers — a byte-identical pair across the same two files — were absent from the inventory for the whole of phase 27. Not fixed here: that file is outside this plan's `<files>`, and the structural fix plus the real-repository assertion is the forcing function either way. **The inventory itself is a hand-maintained set, which is the drift class it exists to catalogue.** Worth a look during round-4 verification.
- The six mid-script exit sites in `install.ts` (~111, 509, 528, 544, 576, 1386), recorded as a known residual by `d75e391`. Untouched here, as instructed; closing them needs one `finish(code)` authority that both sets the code and halts.
- `UNKNOWN - verify` in `install/kit-source.ts`: whether Claude Code loads adapter paths reachable only through a symlink cycle (from 27-31, unchanged).

## Known Stubs

None. No hardcoded empty values, placeholder text, or unwired data paths were introduced.

## Threat Flags

None. The plan's four `mitigate` dispositions (T-27-WR02-01, T-27-WR02-02, T-27-WR03-01, T-27-IN03-01) are all implemented and each carries a case. T-27-WR02-03 is the `accept` disposition, recorded as backstop truth D8 above. T-27-SC holds: `package.json` is byte-unchanged and zero package-manager install commands were run. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was introduced — the one behavioural change is a guard that refuses *more* than it did, and the either-half-alone loop pins that it does not over-refuse.

## Self-Check: PASSED

- `install/kit-source.ts`, `install/kit-source.js`, `install/install.ts`, `install/install.js`, `install/uninstall.ts`, `install/uninstall.js`, `install/install.test.ts`, `install/README.md` — all FOUND on disk.
- Commits `03888af` and `2243a4a` — both FOUND in `git log`.
- `grep -c SOURCE_MARKERS`: `kit-source.ts` 4, `install.test.ts` 9 — both ≥ 2 as required.
- `grep -c hasSourceMarkers`: `install.ts` 3, `uninstall.ts` 3 — both ≥ 1 as required.
- `grep -c` for the former marker literal `"install", "install.ts"` in either binary: 0 and 0 — the pair is deleted, not re-synced.
- `grep -c` for the deleted file-count claim in `install.test.ts`: 0. `grep -c 'D-28'`: 3.
- `grep -c 'allow-self' install/README.md`: 5.

---
*Phase: 27-spawn-correctness-kit-set-authority*
*Completed: 2026-08-01*

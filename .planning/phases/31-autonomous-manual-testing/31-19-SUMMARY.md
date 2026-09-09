---
phase: 31-autonomous-manual-testing
plan: 19
subsystem: governance
tags: [context-io, trusted-root, governance-dial, home-directory-stop, audit-ledger, wr-21, d-23]

requires:
  - phase: 31-15
    provides: "the four-step trustedRepoRoot() resolution order, whose third step this plan bounds"
  - phase: 31-18
    provides: "the append-only write chokepoint, the trusted-operand proof and the one-authority dial read, all of which this plan's root change must leave intact"
provides:
  - "a governance-root search that halts at the user's home directory and never inspects it or any ancestor of it"
  - "a boundary marker set that names nine version-control systems rather than one, recorded as CONTENT and not as the bound"
  - "the inner-configuration case DECIDED: a repository root's own configuration outranks one nested inside it"
  - "TRUSTED_ROOT_STOP_CONDITIONS — the complete stop set as one frozen export, with the step limit interpolated rather than typed"
  - "a both-directions equality binding agent-factory/workflows/16-context-read-write.md to that export, with a watched-fail control on each side"
  - "TRUSTED_ROOT_RESIDUALS extended to eight members, cardinality asserted separately and a watched-fail control proving the set-equality is a control"
  - "decision D-23, recorded in the three places that must agree"
affects: [31-20, any later plan touching trustedRepoRoot, admission, the GOV-02 ledger, or workflow 16]

actuals:
  tokens: 29162
  tasks: 3
  commits: 5

plan_head_before: 27c7390

tech-stack:
  added: []
  patterns:
    - "a safety bound compared by FILESYSTEM IDENTITY (dev:ino) rather than by path text, with the identity set's own premise asserted against a degenerate platform before it is trusted"
    - "prose quoted from a frozen export under a set-equality asserted in both directions, with a watched-fail control seeding an extra member on each side"
    - "a mirrored kit whose ONE mutated line has its occurrence count asserted exactly before the mutation and at zero after it"

key-files:
  created:
    - docs/audit/29-style-dispositions/31-19.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/16-context-read-write.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md

key-decisions:
  - "D-23 (2026-09-09, gap-closure round 4 wave 4): the bound on the governance-root search is a PROPERTY OF THE WALK, not of which markers a filesystem happens to carry, and the prose that states it is quoted from the mechanism under an asserted equality. Five sub-decisions; D-01 through D-22 untouched."
  - "The code was made to match the documentation rather than the documentation weakened to match the code — the review's first acceptable outcome, chosen because the consequence is not only a wrong dial: trustedRepoRoot() also decides where appendAuditLedger writes, so a documented capability would still write one project's admission records into another's committed audit trail."
  - "The home stop compares dev:ino rather than path text, so a symlinked or differently-cased home is still recognised — a missed stop is the unsafe direction. The identity set's own premise is CHECKED (home's identity against its parent's) and the set is discarded where they agree, because a platform with degenerate inodes would otherwise stop the walk at its first step and re-open WR-15 there."
  - "A non-VCS `.grugops` boundary marker was REFUSED, with the argument recorded at the site: a sub-package carrying grugops state and no configuration would end the walk below the repository whose dial governs and fall through to the kit's lean default — a configuration moving from refused to admitted, which is the WR-15 defect itself."
  - "WR-21's second half was DECIDED, not named: a repository root's own configuration outranks one nested inside it, because a vendored kit is not a governed project. Where the repository root carries no configuration the nested one still answers, so nothing that resolved before resolves differently."
  - "The review's `Fix:` sentence — a case with cwd below a planted ancestor configuration and no marker on the path asserting the KIT answer — is satisfied for an ancestor AT OR ABOVE the home directory, which is the shape the review reproduced, and REFUSED below it: asserting it below the home directory would revert WR-15. The disagreement is recorded as residual R-31-19-01 rather than taken quietly."

patterns-established:
  - "Assert a comparison primitive's own premise before trusting it: the dev:ino identity set is discarded when the home directory and its parent report the same identity, so a degenerate platform degrades to path comparison instead of silently stopping every walk at step one."
  - "When a document must not outrun a mechanism, publish the mechanism as a frozen export and assert the document set-equal to it in BOTH directions, with a seeded extra member on each side proving the assertion is a control."
  - "A precedence rule stated explicitly and numbered at the site beats reading order: the walk's three rules (home stop, repository-root preference, configuration-beats-marker) are written as an ordered list in the function docstring rather than left to be reconstructed from the loop body."

requirements-completed: []

coverage:
  - id: D1
    description: "The upward governance-root search halts at the user's home directory and never inspects it or any ancestor of it; the reviewer's planted-ancestor probe now resolves to the kit."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#REPRODUCED: a home-shaped ancestor's configuration is NOT adopted, and the KIT answers"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#ADJACENCY: the home directory ITSELF is never adopted, even carrying a configuration"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#ABOVE: an ANCESTOR of the home directory is never inspected either"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#MUTATION PROOF: with the home stop removed, the ancestor IS adopted and IS written to"
        status: pass
    human_judgment: false
  - id: D2
    description: "No GOV-02 admission event lands in an unrelated home directory's committed audit trail."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#THE CONSEQUENCE: no GOV-02 event lands in the planted home directory's audit trail"
        status: pass
    human_judgment: false
  - id: D3
    description: "WR-15's own closure is intact: with both project-directory variables unset and the working directory inside a real project carrying an active dial, the write is still refused naming the dial; and no configuration moved from refused to admitted."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL 1 (WR-15 intact): the row-6 spot-check still refuses, naming the dial"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#MONOTONICITY: no configuration moved from REFUSED to ADMITTED against the pre-31-19 program"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL 3: a project that is a DIRECT CHILD of the home directory still resolves to itself"
        status: pass
    human_judgment: false
  - id: D4
    description: "The boundary no longer depends on one tool being present: every named version-control marker ends the walk, driven from the export."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the boundary is not one tool's: EVERY named marker ends the walk, and the set is derived"
        status: pass
    human_judgment: false
  - id: D5
    description: "The inner-configuration case is decided: a vendored kit's in-repo configuration no longer outranks the host repository's own."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#INNER: a vendored kit's in-repo configuration no longer outranks the repository's own"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#INNER, non-vacuous: where the repository root carries NO configuration, the nested one still answers"
        status: pass
    human_judgment: false
  - id: D6
    description: "Workflow 16's stop list and the exported stop set agree in both directions, and the assertion is proven to be a control."
    requirement: UATX-03
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the workflow's stop list and the exported stop set agree, in BOTH directions"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#WATCHED FAIL: a stop seeded on either side breaks the equality, so it is a control"
        status: pass
    human_judgment: false
  - id: D7
    description: "The residual register is bound in both directions, its cardinality is asserted separately, and the equality is proven a control."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the register's cardinality is asserted separately from its members"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#WATCHED FAIL: a seeded residual arrives unbound and moves the cardinality by exactly one"
        status: pass
    human_judgment: false
  - id: D8
    description: "Whether the rewritten protocol prose reads as one protocol to an agent following it, and whether the four named residuals are the right things to leave open."
    verification: []
    human_judgment: true
    rationale: "The gates prove every changed clause is dispositioned, profile-clean and set-equal to the mechanism; they do not prove the section is well said or that the residual dispositions are the ones a reviewer would accept. Only a verification round may flip UATX-01 / UATX-03."

duration: 50min
completed: 2026-09-09
status: complete
---

# Phase 31 Plan 19: The upward governance-root search stops where the documentation says it stops

**WR-21 closed structurally: the walk now halts at the user's home directory and never inspects it or anything above it, the boundary set no longer depends on one VCS being installed, a repository root's own configuration outranks one nested inside it, and the protocol prose is quoted from a frozen stop-set export under an equality asserted in both directions.**

## Performance

- **Duration:** ~50 min
- **Tasks:** 3 of 3
- **Files modified:** 9 (1 created)
- **Commits:** 5 (measured `git rev-list --count 27c7390..HEAD`)

## The measurements

### PRE-FIX — the reviewer's planted-ancestor probe, against the committed `scripts/context-io.js` at `cc1ad162…`

Both project-directory variables REMOVED (not blanked), a working directory three levels below a
home-directory-shaped ancestor carrying `.grugops/factory.config.json`, and no repository marker
anywhere on the path:

```
cwd:               …/scratchpad/wr21/home/work/scratch/deep
homedir():         …/scratchpad/wr21/home
config planted at: …/scratchpad/wr21/home/.grugops/factory.config.json   {"context":{"human_admission":"all"}}
trustedRepoRoot(): …/scratchpad/wr21/home
dial:              "all"                     (source: ok)
```

This is `31-VERIFICATION.md` behavioural spot-check row 11 and the review's transcript, reproduced
line for line: three ancestors crossed, the planted ancestor adopted, its dial read.

### PRE-FIX — the consequence: where the GOV-02 admission record landed

Same shape, dial `high-severity` with `audit_retention: retained`, one routine `observation` admitted:

```
trustedRepoRoot(): …/scratchpad/wr21/home2
dial:              "high-severity"
verdict:           write   → 20260909T020000Z-qe-observation-4a1be3a2
ledger_path:       …/scratchpad/wr21/home2/.grugops/audit/admissions.jsonl
ledger_exists:     true
ledger_lines:      1
```

One directory's admission record — id, `by`, severity, `verified_by`, `disposed_by`, `at` — written
into an unrelated directory's committed audit trail, from a working directory that had nothing to do
with it.

### PRE-FIX — the inner-configuration case, against the committed `.js` at `eea015e`

A host repository carrying `.git` and `.grugops/factory.config.json` (`human_admission:
high-severity`), a vendored kit beneath it carrying `agent-factory/config/factory.config.json`
(`human_admission: off`), working directory inside the vendored kit:

```
trustedRepoRoot(): …/inner/host/vendor/kit
dial:              "off"
verdict:           write   → 20260909T020000Z-security-nfr-finding-c7af347a
```

A self-stamped high-severity governance finding WRITTEN, because changing directory into a vendored
kit lowered the host repository's dial to the kit's shipped lean default.

### POST-FIX — the same four probes, against the committed `scripts/context-io.js` at `2ccb6628…`

```
### PROBE A (the review's four lines)
cwd:               …/scratchpad/wr21/f1/work/scratch/deep
homedir():         …/scratchpad/wr21/f1
trustedRepoRoot(): …/scratchpad/wr21/kit          ← the KIT, not the planted ancestor
dial:              "off"                          ← the shipped lean posture

### PROBE B (the audit-ledger consequence)
trustedRepoRoot(): …/scratchpad/wr21/kit
dial:              "off"
verdict:           write   → 20260909T020000Z-qe-observation-d4366368
ledger_path:       …/scratchpad/wr21/kit/.grugops/audit/admissions.jsonl
ledger_exists:     false                          ← nothing in the planted directory either

### CONTROL — WR-15's own spot-check, re-measured
trustedRepoRoot(): …/scratchpad/wr21/f3/proj      ← step 3 still answers the project
dial:              "high-severity"
verdict:           refuse
message:           "context-io.appendNote: refusing to write a note the admission authority did not
                    accept. Nothing was written:
                    admission REFUSED (human_admission: high-severity): a high-severity governance
                    entry authored by "security-nfr" …"

### INNER CASE
trustedRepoRoot(): …/f4/host                      ← the host repository, not the vendored kit
dial:              "high-severity"
verdict:           refuse (naming the dial)
```

## Accomplishments

- **The bound is now a property of the walk.** `isAtOrAboveHome` stops the search at the user's home
  directory and at every ancestor of it, comparing the DIRECTORY (`dev:ino`) rather than a spelling
  of it — so a home reached through a symlink, or spelled with different case on a case-insensitive
  filesystem, is still recognised. A missed stop is the unsafe direction, which is why the comparison
  is made against the thing rather than against its name.
- **The identity set's own premise is checked, not assumed.** Where the home directory and its parent
  report the same identity, the platform's identities say nothing and are discarded; the walk then
  compares path spellings alone. Trusting degenerate identities would have stopped every walk at its
  first step on that platform and handed every host the kit's lean default — the WR-15 defect,
  re-opened. The residual that remains is `R-31-19-03`.
- **An undeterminable home directory stops the search** rather than licensing an unbounded one. The
  answer degrades to the kit, which is what the pre-`31-15` program returned unconditionally.
- **`REPO_BOUNDARY_MARKERS` names nine version-control systems** rather than `.git` alone, and is
  documented as CONTENT rather than as the bound. Every member is driven as a case, from the export.
- **The inner-configuration case is decided**, not named: a repository root's own configuration
  outranks one nested inside it. Where the repository root carries no configuration the nested one
  still answers, asserted as its own non-vacuous case.
- **`TRUSTED_ROOT_STOP_CONDITIONS` publishes the complete stop set once**, with the step limit
  INTERPOLATED from the constant rather than typed, and `16-context-read-write.md`'s new
  `## Where the upward governance-root search stops` section is asserted set-equal to it in both
  directions with a watched-fail control seeding an extra stop on each side.
- **`TRUSTED_ROOT_RESIDUALS` grew to eight members**, each with all four documented fields; the
  round's written dispositions are set-equal to it in both directions, the cardinality (8) is
  asserted separately from the members, and a watched-fail control proves the equality is a control.

## Task Commits

1. **Task 1 (tracer) — RED:** `eea015e` (test) — the reviewer's planted-ancestor probe reproduced as
   five failing cases plus two passing controls.
2. **Task 1 (tracer) — GREEN:** `49e6201` (fix) — the home stop, the widened marker set, the
   repository-root preference, the published stop set, and the `realpathSync` re-classification.
3. **Task 2:** `e0bb84f` (feat) — the inner-configuration case decided and the residual register
   bound in both directions with an asserted cardinality and a watched-fail control.
4. **Task 3:** `34c8b66` (docs) — the protocol prose quoted from the stop set, D-23 recorded in the
   three places that must agree, and the disposition file.
5. **Task 3 (profile compliance):** `d8cd26c` (style) — the stop section moved out of `## Steps` and
   every clause brought inside the writing profile's sentence bounds.

## Mutation proofs, recorded

| mutant | anchor (occurrence count asserted 1 before, 0 after) | effect |
|---|---|---|
| the home stop removed | `if (isAtOrAboveHome(dir, home))` → `if (false)` | the planted ancestor IS adopted (`root` = the planted home, dial `all`) and the GOV-02 event IS written into its ledger; reverting restores the kit answer and an empty ledger |
| the home directory made undeterminable | `const named = namedHomeDirectory();` → `const named = null;` | step 3 stops answering entirely and the mutant's own kit answers, proving the degrade is the kit rather than an unbounded walk (the committed program answers the project, asserted as the premise) |
| the repository-root preference removed | `nearest = dir;` → `return dir;` | reconstructs the pre-`31-19` nearest-wins program exactly; the vendored kit is adopted and the finding is admitted |
| an extra stop seeded in the DOCUMENT | one bullet added to the workflow region | the both-directions equality breaks |
| an extra stop seeded in the CODE | one sentence appended to the published set | the both-directions equality breaks |
| an extra residual seeded | one member appended to a copy of the register | the member is reported unbound and the cardinality moves by exactly one |

## Measured counts

| measurement | value |
|---|---|
| whole excluded-e2e suite at `d8cd26c` | **62 test files passed, 3702 tests passed, 2 skipped** (the round-4 verification measured 62 files) |
| `scripts/context-io.test.ts` | 411 passed (391 before this plan) |
| the `31-19` block | 18 cases |
| monotonicity sweep | **18 configurations driven** (6 dial shapes × 3 environment shapes), both ways; `moved` asserted EQUAL TO THE EMPTY SET |
| boundary-marker sweep | 9 markers, driven from the export, count asserted equal to `REPO_BOUNDARY_MARKERS.length` |
| `TRUSTED_ROOT_RESIDUALS` cardinality | **8** (4 from `31-15`, 4 added here), asserted separately from the members |
| `TRUSTED_ROOT_STOP_CONDITIONS` | 6 members, ids unique, frozen |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` |
| `npm run typecheck` | clean across all three projects |
| `npm run check:imperative-lexicon` | `ALL CHECKS PASSED` |
| `npm run check:public-docs` / `check:banned-claims` / `check:claim-anchors` / `check:nul-bytes` / `check:residual-citations` / `check:audit-register` | `ALL CHECKS PASSED` |
| `git hash-object hooks/guard.ts` | `669725bc1c616ab57123e22090d93d57eff1b001` — **equal to `FROZEN_GUARD_BLOB`**, not re-based |
| `shasum -a 256 scripts/context-io.js` | `2ccb662815e1346c57ba1cb1f9f713d9b92fec3a241e3ce35b054a188671cfd6` — **equal to both `DECIDER_MANIFEST` entries**, moved rather than relaxed; no entry removed or widened (26 module hashes across 2 deciders, unchanged) |
| `npm run check:diff-disposition` | 65 before this plan's workflow edits → 85 with the edits and no rows → **75 with `docs/audit/29-style-dispositions/31-19.md`'s 16 rows**; **0 owed for the clauses this plan changed** |

## Files Created/Modified

- `scripts/context-io.ts` — the home stop, the widened marker set, the repository-root preference,
  `TRUSTED_ROOT_STOP_CONDITIONS`, four new residual members, the corrected docstrings and the D-23
  mirror.
- `scripts/context-io.js` — the rebuild; digest `2ccb6628…`.
- `scripts/context-io.test.ts` — the 18-case `31-19` block plus the cardinality and watched-fail
  cases on the register.
- `scripts/context-io-writer-set.test.ts` — `realpathSync` re-classified as a READ in the `node:fs`
  alphabet guard, with the classification recorded at the site; the asserted binding count moved
  14 → 15 deliberately.
- `hooks/hook-entry.ts` / `.js` — the two `scripts/context-io.js` manifest hashes MOVED.
- `agent-factory/workflows/16-context-read-write.md` — the false stop sentence replaced, the step-3
  sentence rewritten for the repository-root preference, and the new stop-set section added.
- `docs/audit/29-style-dispositions/31-19.md` — 16 disposition rows (created).
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — decision D-23.
- `.planning/phases/31-autonomous-manual-testing/deferred-items.md` — the 10 inherited `31-15`
  clauses recorded rather than vouched for.

## Decisions Made

D-23 and its five sub-decisions are recorded in full in `31-CONTEXT.md` and mirrored in the
resolution-order docstring. The `key-decisions` frontmatter block above names them.

## Deviations from Plan

### 1. [Rule 3 — blocking] The `DECIDER_MANIFEST` hashes were moved in Task 1, not Task 3

- **Found during:** Task 1's own `<verify>` block, which runs `hooks/guard.test.ts` and
  `hooks/admission-guard.test.ts`.
- **Issue:** the plan assigns the manifest move to Task 3 MOVEMENT 2, but a rebuilt
  `scripts/context-io.js` makes the hook wrapper fail closed immediately, so Task 1's own verify
  could not go green with a stale manifest.
- **Fix:** `npm run generate:hook-manifest` at each task that moved the artifact, with the final
  digest re-measured and quoted in Task 3 as the plan requires. No entry was removed or widened; the
  diff at every step is two hash MOVES.
- **Commits:** `49e6201`, `e0bb84f`, `34c8b66`, `d8cd26c`.

### 2. [Rule 2 — missing critical functionality] `realpathSync` forced a documented re-classification

- **Found during:** Task 1, via `scripts/context-io-writer-set.test.ts`'s derived `node:fs` alphabet
  guard, which refuses a new binding rather than assuming it is harmless.
- **Issue:** the home stop needs the canonical spelling of the home directory, which required a new
  `node:fs` import.
- **Fix:** `realpathSync` classified as a READ, with the argument written at the site
  (`FS_WRITE_PRIMITIVES` unchanged) and the asserted binding count moved 14 → 15 deliberately. The
  guard did exactly what it exists for.
- **Commit:** `49e6201`.

### 3. [Rule 1 — the plan's own statement was not satisfiable as written] The review's "requested case" is asserted at or above the home directory, not below it

- **Found during:** Task 2 MOVEMENT 3.
- **Issue:** the plan glosses WR-21's `Fix:` sentence as asking for "an ancestor that is not the home
  directory but also carries no marker between it and the working directory" to answer the KIT. That
  cannot hold jointly with `31-15`'s own green `CONTROL 3 (adjacency)` case, which asserts that
  `project/a/b/c` resolves to `project` with no marker anywhere on the path — the nearest-ancestor
  search that IS WR-15's closure. Asserting the kit for a below-home ancestor would revert WR-15,
  which is the failure direction `T-31-19-05` exists to prevent.
- **Fix:** the requested case is asserted for an ancestor AT OR ABOVE the home directory, which is
  the shape the review actually reproduced, and the below-home behaviour is asserted as its own case
  and recorded as residual `R-31-19-01` with a reason true of it and a closing criterion. The
  disagreement is written down rather than resolved by silence.
- **Commits:** `eea015e` (the at/above case), `e0bb84f` (the below-home case and the residual).

### 4. [Rule 2] A non-VCS boundary marker array was considered and REFUSED, with the argument recorded

- **Found during:** Task 1 MOVEMENT 3.
- **Issue:** WR-21 offers "widen `REPO_BOUNDARY_MARKERS` beyond `.git` **or** add a second frozen
  array of non-VCS boundaries". The obvious non-VCS member is the factory's own `.grugops` state
  directory — and it moves cases in the unsafe direction: a sub-package carrying `.grugops` STATE
  and no configuration would end the walk BELOW the repository whose dial governs, and the answer
  would fall through to the kit's lean default. That is a configuration moving from refused to
  admitted, which is the WR-15 defect.
- **Fix:** the first branch of the review's `or` was taken (nine VCS markers), and the road not taken
  is recorded at the site and in D-23 (3) so a later round does not rediscover it as an omission.
- **Commit:** `49e6201`.

### 5. [Rule 3] The stop section had to leave `## Steps` to satisfy the writing profile

- **Found during:** Task 3, after the whole-suite run.
- **Issue:** `check:imperative-lexicon` treats every bullet under `## Steps` as a STEP and requires an
  approved imperative first token and a twenty-word bound. A stop condition is a statement of fact,
  not an instruction, so five of six bullets and three prose sentences were refused.
- **Fix:** the section became a level-two heading placed after `## Stop conditions`, the boundary
  stop was split into `S-BOUNDARY` and `S-BOUNDARY-WINS`, and the step-3 sentence into two. The
  export and the disposition rows moved with it. The gate is green rather than exempted.
- **Commit:** `d8cd26c`.

## Known Stubs

None. Every case in the `31-19` block drives the committed `.js` in a child process with the
project-directory variables genuinely removed; no case is skipped and no `<verify>` was left unrun.

## Threat Flags

None. This plan removes surface (an upward search that could read and write outside the project) and
adds none: no new endpoint, no new caller-supplied path, no new parameter on any exported function.

## Self-Check: PASSED

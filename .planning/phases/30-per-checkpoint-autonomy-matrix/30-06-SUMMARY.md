---
phase: 30-per-checkpoint-autonomy-matrix
plan: 06
subsystem: infra
tags: [config-dial, validator, checkpoints, retirement, installer, derived-set, typescript]

requires:
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "plan 30-01's checkpoints.ts roster, ternary vocabulary and CHECKPOINT_DEFAULTS; plan 30-02's four-member SAFETY_FLOORS, the dotted `checkpoints.<id>` configPaths and the shipped `checkpoints` cells; plan 30-04's fourteen-member derived roster and LEGACY_AUTONOMY_GRADES; plan 30-05's fourteenth member `accept_human_only_failure`"
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "the diff-disposition gate over watched kit prose with its frozen structural regions, and the claim-anchor byte comparison"
  - phase: 28-kit-consistency-audit
    provides: "the claim registry with anchored verbatim claim text (C-28-012, C-28-032)"
provides:
  - "the validator's POLARITY FLIP: `autonomy` moved out of the required-key loop and into a refusal branch whose message names the replacement and the translation table"
  - "the `checkpoints` form check — an imported legal key set, an unknown-id refusal arm the quality block has no equivalent for, a canonical-disposition arm, a degenerate-container guard and the TINT-03 `off` carve-out"
  - "the retired key removed from all three live config surfaces and all sixteen fixture config files in one commit, twins byte-identical"
  - "`### checkpoints sub-fields` in factory.config.md — the roster, the derived floor tier, the two-key rule, the advisory-on-non-hook-hosts statement and the D-06 legacy grade table"
  - "per-fixture FINDING-SET assertions replacing bare exit-status assertions (Pitfall 3)"
  - "a cross-surface oracle deriving the twin's roster table, defaults, floor tier and legacy table from the module, two-sided"
  - "the installer's report-do-not-rewrite behavior for a target carrying the retired key, asserted on bytes"
  - "TECHNICAL_NAMES_COUNT 77 -> 76, both consumers walked and measured"
affects: [30-07, 30-08, 30-09, verify-work, validate-agent-factory, install, factory.config.md]

actuals:
  tokens: 42870
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "polarity flip recorded as a flip: the refusal branch's comment states which direction the check used to run, so a later reader cannot mistake it for a new check"
    - "an unknown KEY is a refusal, not a pass-through, when the key set is closed and the consequence of a typo is a stop that never fires"
    - "per-fixture finding-set assertions with a per-row expected count of configuration findings — including 1 for the fixture whose own defect IS a configuration key"
    - "section-bounded markdown table parsing with an explicit CLOSING anchor plus a slice non-vacuity check (the Phase 29 unbounded-section lesson)"
    - "report-do-not-rewrite, asserted from the OUTSIDE on file bytes across two runs rather than on the printed line"

key-files:
  created:
    - docs/audit/29-style-dispositions/30-06.md
  modified:
    - scripts/validate-agent-factory.ts
    - scripts/validate.test.ts
    - scripts/config-governance-consistency.test.ts
    - scripts/check-imperative-lexicon.ts
    - agent-factory/config/factory.config.json
    - agent-factory/config/factory.config.md
    - agent-factory/seed/.grugops/factory.config.json
    - install/install.ts
    - install/install.test.ts
    - AGENTS.md
    - agent-factory/README.md
    - agent-factory/packaging/adapters.md
    - install/README.md
    - CHANGELOG.md
    - docs/audit/28-claim-registry.md

key-decisions:
  - "Tasks 1 and 2 landed as ONE commit because they are mutually dependent: the validator's polarity flip and the config surfaces it validates cannot be split without leaving a red tree at either intermediate HEAD."
  - "The four workflows and five examples that described the retired scalar as live were added to Task 3's scope (Rule 2), because the plan's acceptance criterion 'no shipped document describes the retired scalar as a live mechanism' is not satisfiable without them."
  - "Editing AGENTS.md:16 and agent-factory/README.md's zero-config paragraph forced updating docs/audit/28-claim-registry.md in the same commit (Rule 3), because check-claim-anchors compares the recorded claim text to the anchored bytes and is red if either side moves alone."
  - "The config markdown's key inventory now states no numeral at all; the enumerated list IS the inventory, so there is nothing left to drift."
  - "The 'single safety floor' sentence points at SAFETY_FLOORS and the roster table's tier column rather than re-listing four ids, so the correction does not create a second floor list."
  - "The legacy translation for `pr` is `open_pr: off`, which is NOT the kit's shipped default of `block`; the document says so explicitly rather than letting a migrating user assume they match."

patterns-established:
  - "Mutation-kill as the proof that an adversarial sweep discriminates: each refusal arm was disabled in the committed .js in turn and the sweep re-run; 5/5 mutants killed."
  - "When a derived config-key set feeds a language gate, moving the set requires re-running the gate on BOTH sides and recording the paired numbers, not arguing from the code."

requirements-completed: [AUTO-02, AUTO-07, AUTO-05]

coverage:
  - id: D1
    description: "A config carrying the retired `autonomy` key is refused by the validator, with a message naming the `checkpoints` replacement and the translation table."
    requirement: "AUTO-02"
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#REFUSES a config that carries `autonomy`, naming the replacement key"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#REFUSES `autonomy` at every legacy grade value, not only the shipped one"
        status: pass
      - kind: other
        ref: "adversarial sweep — 9 autonomy-shaped payloads (string, empty, null, false, number, array, object, duplicate key, __proto__ sibling), all exit 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "An unknown checkpoint id, a non-canonical disposition, a degenerate container and `checkpoints.test_integrity: off` are each refused by name; the legal key set is imported from the roster rather than restated."
    requirement: "AUTO-02"
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#an UNKNOWN checkpoint id → nonzero, and the message names the offending id"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#a NON-CANONICAL disposition → nonzero, naming the key and listing the allowed values"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#the TINT-03 carve-out: `checkpoints.test_integrity: off` is refused by name"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#no roster id is written as a literal in the validator except the two that are ALSO config keys"
        status: pass
      - kind: other
        ref: "mutation kill — 5 refusal arms disabled one at a time in the committed .js; 5/5 sweeps went red"
        status: pass
    human_judgment: false
  - id: D3
    description: "An absent `checkpoints` object and an absent individual id are the lean default and never an error (AUTO-07); every roster member is accepted at every canonical disposition except the carved-out cell."
    requirement: "AUTO-07"
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#an ABSENT `checkpoints` object → exit 0 (the lean default, never an error)"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#EVERY roster id is accepted at `block` and at `notify` (the imported set, not a copy)"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#EVERY roster id except the carved-out one is accepted at `off`"
        status: pass
    human_judgment: false
  - id: D4
    description: "The eight fixture repositories each still fail for exactly the one reason they exist to test, proven by finding set rather than exit status."
    requirement: "AUTO-07"
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#the intent table names EVERY fixture repository on disk, and no other"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#%s: its own finding is present and it produces exactly the configuration findings it should (8 rows)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The three live config surfaces and the sixteen fixture config files changed together in one commit; the JSON twins are byte-identical and the twin's roster table, defaults, floor tier and legacy grade table are derived from the module."
    requirement: "AUTO-05"
    verification:
      - kind: unit
        ref: "scripts/config-governance-consistency.test.ts#the twin's roster table names EVERY roster member and no id outside the roster"
        status: pass
      - kind: unit
        ref: "scripts/config-governance-consistency.test.ts#the legacy grade table reproduces LEGACY_AUTONOMY_GRADES cell for cell"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#not one of those config surfaces carries the retired `autonomy` key"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#config JSONs byte-identical (config/ == seed/.grugops/) via Buffer.equals"
        status: pass
    human_judgment: false
  - id: D6
    description: "The installer reports a target repository carrying the retired key and modifies no configuration file (T-30-22)."
    requirement: "AUTO-05"
    verification:
      - kind: integration
        ref: "install/install.test.ts#retired key: a target carrying `autonomy` is REPORTED by name and its config is left byte-identical"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#retired key: a target whose config carries NO retired key produces no retired-key line"
        status: pass
      - kind: other
        ref: "adversarial: two consecutive real install runs over a target carrying the key — sha256 identical, no .bak created, report idempotent"
        status: pass
    human_judgment: false
  - id: D7
    description: "The legacy grade mapping is published as a mechanical table a migrating user can act on, and the difference between the translated `pr` posture and the kit's shipped default is stated."
    requirement: "AUTO-05"
    verification: []
    human_judgment: true
    rationale: "Whether the published table is enough for a real user to migrate without support is a judgment about documentation adequacy. The table's CONTENT is machine-checked against LEGACY_AUTONOMY_GRADES cell for cell; its sufficiency for a human reader is not."

duration: 98 min
completed: 2026-09-05
status: complete
---

# Phase 30 Plan 06: Retire the `autonomy` Scalar Summary

**The validator's polarity flipped from requiring `autonomy` to refusing it, the `checkpoints` matrix gained a form check whose legal key set is the imported fourteen-member roster, and all nineteen config surfaces plus every shipped prose consumer moved to the matrix vocabulary in the same change — with the installer reporting a retired key rather than rewriting it.**

## Performance

- **Duration:** 98 min
- **Started:** 2026-09-05T14:05:00Z
- **Completed:** 2026-09-05T15:43:12Z
- **Tasks:** 3 (landed as 2 code commits — see Deviations)
- **Files modified:** 61

## Accomplishments

- **The polarity flip, recorded as a flip.** `autonomy` left the required-key loop and became a refusal branch. The comment above it states which direction the check used to run, so a later reader cannot mistake a flipped check for a new one. `mode` and `cadence` stayed required — the flip is exactly one key wide, asserted.
- **The `checkpoints` form check inherits the recorded contract and adds one arm.** Absent object and absent id are the lean default and never an error; only a present invalid declaration is refused. The two differences from the quality block are deliberate: the legal key set is imported from `scripts/checkpoints.ts` (no checkpoint id literal exists in the validator, asserted by a source scan against the imported roster), and an unknown key is itself a refusal — a typo that read as a configured stop would be a stop that never fires, silently and in the permissive direction.
- **Nineteen config surfaces moved together.** Three live surfaces and sixteen fixture files in one commit, twins byte-identical, with the fixture set discovered by directory read and its count asserted at eight.
- **Every fixture still fails for its own reason, proven by finding set.** A bare non-zero exit cannot tell "fails for its one defect" from "fails for its defect AND a new configuration finding". Each of the eight rows now asserts the intended finding plus an expected count of configuration findings — 1 for `bad-config-no-mode`, whose own defect IS a configuration key, and 0 for the other seven.
- **Two prose statements that were already wrong are corrected.** The hand-maintained "nine keys" count is gone: the enumerated list IS the inventory and no numeral is stated beside it. The "single safety floor" sentence now points at `SAFETY_FLOORS` and the roster table's tier column rather than re-listing four ids, so correcting a stale list did not create a second one.
- **The migration path is published and mechanical.** `agent-factory/config/factory.config.md` carries the D-06 grade table, asserted cell for cell against `LEGACY_AUTONOMY_GRADES`, and states plainly that translating `pr` gives `open_pr: off` while the kit's shipped default is `block` — so a migrating user chooses rather than inherits.
- **The installer reports and does not rewrite.** Asserted from the outside on file bytes, with a negative control and an unparseable-config case that says the check did NOT run rather than staying silent.

## Task Commits

1. **Tasks 1 + 2: validator polarity flip, checkpoint form check, and the nineteen config surfaces** — `7f3bffb` (feat)
2. **Task 3: prose retirement, installer report-do-not-rewrite, changelog** — `c109bf1` (feat)

## Files Created/Modified

- `scripts/validate-agent-factory.ts` / `.js` — the refusal branch, the checkpoint form check, the imported roster
- `scripts/validate.test.ts` — 23 new cases: the retirement, the form check, the imported-key-set source scan, the per-fixture intent table, the derived config-surface scan
- `scripts/config-governance-consistency.test.ts` — the checkpoints 3-surface oracle and the twin-derivation checks
- `scripts/check-imperative-lexicon.ts` / `.js` — `TECHNICAL_NAMES_COUNT` 77 → 76 with both consumers walked and measured
- `agent-factory/config/factory.config.json`, `agent-factory/seed/.grugops/factory.config.json` — the key removed, twins byte-identical
- `agent-factory/config/factory.config.md` — the `checkpoints` field row, the `### checkpoints sub-fields` section, the legacy table, the two corrected statements
- 16 fixture config files under `scripts/fixtures/*/agent-factory/config/`
- `install/install.ts` / `.js` — `reportRetiredConfigKeys()`, read-only
- `install/install.test.ts` — 3 output pins including the byte-comparison
- `AGENTS.md`, `agent-factory/README.md`, `agent-factory/packaging/adapters.md`, `install/README.md`, `CHANGELOG.md`, 17 role files, 4 workflows, 5 examples
- `docs/audit/28-claim-registry.md` — the two anchored claims and their `mechanism` notes
- `docs/audit/29-style-dispositions/30-06.md` — 36 rows covering all 38 watched changed clauses

## Recorded evidence the plan asked for

### The RED run for the unknown-key fixture

The new assertions were written and run BEFORE the validator changed. `npx vitest run scripts/validate.test.ts` returned **14 failed | 31 passed (45)**. The unknown-key case failed exactly as the pass-through defect it names:

```
FAIL … the `checkpoints` matrix form check (D-08 / AUTO-07)
     > an UNKNOWN checkpoint id → nonzero, and the message names the offending id
```

The pre-arm validator exited **0** on `{"checkpoints": {"open_pr": "block", "not_a_real_checkpoint": "block"}}` — it accepted a checkpoint id nothing can gate, silently, and in the permissive direction. That is the defect the arm exists to close. The polarity proof failed on the same run: `a config WITHOUT autonomy validates clean` was red, because the validator was still refusing the key's ABSENCE.

### The fixture count assertion

The fixture set is discovered by `readdirSync(scripts/fixtures, {withFileTypes:true})` filtered to directories, never from the plan's file list. **8 discovered, 8 asserted**, and the intent table is compared to that discovered list two-sided, so neither a fixture without a row nor a row naming a deleted fixture can hide.

### Each fixture's intended finding

| fixture | its one intended finding | expected configuration findings | bare exit |
|---|---|---:|---:|
| `bad-role-missing-section` | `/Hard limits/i` | 0 | 1 |
| `bad-config-no-mode` | `missing or empty required key "mode"` | 1 | 1 |
| `bad-plugin-noname` | `/name/i` | 0 | 1 |
| `bad-ticket-mismatch` | `/status/i` | 0 | 1 |
| `bad-ticket-bad-column` | `/not a board column/i` | 0 | 1 |
| `bad-workflow-no-commit` | `/Commit/i` | 0 | 1 |
| `good` | `ALL CHECKS PASSED` and no `ERROR`/`WARN` line | 0 | 0 |
| `warn-only-no-trace` | a `WARN` line is EMITTED | 0 | 0 |

`bad-config-no-mode` is the one fixture whose own defect is a configuration key, so its expected count is 1 rather than exempting it from the check. `good` and `warn-only-no-trace` exit 0, so their rows assert what the run must SAY — a run that found nothing at all would otherwise pass a status-only assertion.

### The role-file count assertion

The role set was enumerated with the kit's own `listRoles()`, not by hand. **17 listed, 17 edited, 0 missed** — the edit script exits non-zero on any inequality, and it did not. Only the `## Reads` bullet moved in each file; `## Hard limits` prose is untouched, per the corpus decision recorded in plan 30-04. Two further orchestrator lines moved (its `## Responsibilities` step 1 and the Orchestrator Decision heading list), and `software-engineer.md`'s sentence spelling the grade's three values was replaced rather than patched.

### The changelog entry text

Added under `## [Unreleased]` → `### Removed`:

> The `autonomy` configuration scalar (`diff` / `branch` / `pr`) is retired. It graded three steps in prose and no mechanism read it. It is replaced by the per-checkpoint `checkpoints` object, whose cells are enforced: each key is one declared human stop and each value is `block`, `notify` or `off`. There is no coexistence mode — the structure validator refuses a configuration that still carries the retired key, and the refusal names the replacement.
>
> **Migrating an existing repository.** The translation is mechanical, published as a table in `agent-factory/config/factory.config.md`: the old grade split into two independent stops, so `diff` becomes `commit_to_branch: block` + `open_pr: block`, `branch` becomes `commit_to_branch: off` + `open_pr: block`, and `pr` becomes `commit_to_branch: off` + `open_pr: off`. Delete the `autonomy` key and write the two cells its row names.
>
> **The installer reports; it does not rewrite.** Installing over a repository whose configuration still carries the key prints a line naming the key and pointing at the translation table, and leaves the file byte-identical. Editing a user's declared intent without asking is the opposite of this project's posture, so the edit stays with the human.

## Adversarial verification

A green suite is not proof for a refusal surface. The committed `.js` was driven directly.

**Sweep — 37 payloads, 0 bypasses, 0 false reds.** 32 must-refuse payloads all exited 1 and 5 must-accept payloads all exited 0. The must-refuse set covered: `autonomy` as a string, empty string, `null`, `false`, a number, an array, an object, a duplicate JSON key, and beside a `__proto__` sibling; an unknown checkpoint id, a case variant (`Open_PR`), a trailing-space id, a Cyrillic-homoglyph id, `__proto__` and `constructor` as ids; `OFF` (wrong case), the legacy `warn`, `true`, `0`, `null`, an array, a nested object and a trailing-space value; `checkpoints` as `null`, an array, an array of pairs, a string, a number and `true`; and the TINT-03 `off` both alone and beside a valid cell. The must-accept set covered absence, `{}`, a partial matrix, and `test_integrity` at `notify` and at `block`.

**Assert the harness's own premise.** The `good` fixture the sweep builds each tree from exits 0 on its own, so every refusal is attributable to the config under test and not to a defect in the tree. The sweep drives `scripts/validate-agent-factory.js`, and the change was confirmed present in the emitted `.js` by grep before the sweep ran (`noEmitOnError` silently preserves a stale `.js`, which bit plan 30-05).

**Mutation kill — 5/5.** Each refusal arm was disabled in the committed `.js` in turn (`if (false)`), the sweep re-run, and the original restored:

| mutant | outcome |
|---|---|
| drop the `autonomy` refusal arm | KILLED |
| drop the unknown-id arm | KILLED |
| drop the disposition arm | KILLED |
| drop the TINT-03 carve-out | KILLED |
| drop the degenerate-container guard | KILLED |

A sweep that passes for an unrelated reason survives its mutants. This one does not.

**The installer's never-write property, from the outside.** Two consecutive real install runs over a target whose `.grugops/factory.config.json` carried `"autonomy": "pr"`: sha256 identical before and after, no `.bak` or renamed file anywhere under the target, and the report printed on both runs (idempotent). The test asserts the same property on bytes rather than on the printed line, because a run that printed the line AND rewrote the file would pass a line-only assertion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Tasks 1 and 2 landed as one commit**

- **Found during:** Task 1
- **Issue:** The plan splits the validator polarity flip (Task 1) from the config-surface edits (Task 2). They are mutually dependent. Flipping the polarity first turns the validator's own self-test and all eight fixtures red, because every one of them still carried the key. Editing the surfaces first turns them red the other way, because the validator still REQUIRED the key. There is no ordering that leaves a green tree at an intermediate HEAD.
- **Fix:** Landed both as commit `7f3bffb`. This also satisfies the plan's own must_have that the three live surfaces and the sixteen fixture files change together in one commit.
- **Files modified:** the union of the two tasks' file lists
- **Verification:** full suite green at that commit (1 failed / 2638 passed — the one failure is the recorded pre-existing baseline)
- **Committed in:** `7f3bffb`

**2. [Rule 2 - Missing Critical] `scripts/check-imperative-lexicon.ts` re-pinned 77 → 76**

- **Found during:** Task 1
- **Issue:** `TECHNICAL_NAMES` derives one of its five parts from the live config's TOP-LEVEL KEYS. Removing `autonomy` moved `configKeys` 22 → 21 and the pinned union count refused the run — correctly, by design. The pin's own comment demands both consumers be walked before the number moves.
- **Fix:** Re-pinned to 76 with the cause named, and both consumers walked by MEASUREMENT rather than by argument: the gate was run with the key present and again with it removed. `guard_sentence_form` reports the same 2199 sentences (421 procedural / 1778 descriptive) and `guard_imperative_lexicon` the same 139 `## Steps` bullets, 0 findings on both sides — so no sentence changed length and no bullet lost its technical-name exemption.
- **Files modified:** `scripts/check-imperative-lexicon.ts`, `scripts/check-imperative-lexicon.js`
- **Verification:** `npm run check:imperative-lexicon` — ALL CHECKS PASSED; `scripts/check-imperative-lexicon.test.ts` 62/62
- **Committed in:** `7f3bffb`

**3. [Rule 2 - Missing Critical] Four workflows and five examples added to Task 3's scope**

- **Found during:** Task 3
- **Issue:** The plan's acceptance criterion is "no shipped document describes the retired scalar as a live mechanism". `agent-factory/workflows/{04,05,14,15}.md` and all five files under `examples/` did exactly that — an `## Inputs required` bullet naming the setting, a `## Definition of done` sentence citing `autonomy=pr` as the mechanism behind the stop-at-a-pull-request promise, and five example transcripts printing a `## Mode/Cadence/Autonomy in effect` header. RESEARCH §F-4 names the workflows; the examples were not named anywhere.
- **Fix:** Rewrote each to name the matrix cell that actually enforces the stop — `checkpoints.open_pr` for the pull-request stop, `checkpoints.commit_to_branch` for the branch step. No promise widened and no stop removed.
- **Files modified:** 4 workflow files, 5 example files
- **Verification:** `npm run check:imperative-lexicon` unchanged at 0 findings; `npm run check:public-docs` ALL CHECKS PASSED
- **Committed in:** `c109bf1`

**4. [Rule 3 - Blocking] `docs/audit/28-claim-registry.md` moved with its two anchored claims**

- **Found during:** Task 3
- **Issue:** `AGENTS.md:16` is registry claim C-28-012 and `agent-factory/README.md`'s zero-config paragraph is C-28-032. `scripts/check-claim-anchors.js` compares the registry's recorded claim text to the bytes at its anchor, byte for byte, and goes red if either side moves alone. Editing the documents without the registry would have been red; editing them and relaxing the comparison would have deleted the gate's evidence.
- **Fix:** Updated both recorded claim texts and both `mechanism` notes in the same commit. The `mechanism` notes now state that plan 30-06 retired the scalar and that the key they name is the enforced matrix.
- **Files modified:** `docs/audit/28-claim-registry.md`
- **Verification:** `npm run check:claim-anchors` — 47 verbatim comparisons, all byte-identical, all 4 safety floors mapped
- **Committed in:** `c109bf1`

**5. [Rule 3 - Blocking] `docs/audit/29-style-dispositions/30-06.md` authored**

- **Found during:** Task 3
- **Issue:** The Phase 29 diff-disposition gate watches the role and workflow corpus plus `AGENTS.md` and `agent-factory/README.md`, and refuses a changed clause with no disposition row. The prose retirement produced 42 findings, one of them inside `04-ticket-to-pr.md`'s `## Commit` section — a FROZEN structural region owing a companion row of at least eight normalized words.
- **Fix:** Authored the plan's disposition document: 36 rows covering all 38 watched changed elements, with per-class judgement prose and the frozen region's companion reason. Byte-unchanged clauses that entered the diff only because their line re-wrapped are recorded as such rather than passed over.
- **Files modified:** `docs/audit/29-style-dispositions/30-06.md`
- **Verification:** `npm run check:diff-disposition` — 0 findings over 38/38 elements
- **Committed in:** `c109bf1`

**6. [Rule 1 - Bug] A wording change reverted rather than dispositioned**

- **Found during:** Task 3
- **Issue:** Re-wrapping `agent-factory/README.md`'s zero-config paragraph, I shortened "on a single flag" to "on a flag" purely to fit a line. That is a claim edit smuggled in as formatting.
- **Fix:** Restored "on a single flag" in both the document and the registry's recorded text. The paragraph's remaining clause changes are now genuinely a re-wrap plus one reworded sentence.
- **Files modified:** `agent-factory/README.md`, `docs/audit/28-claim-registry.md`
- **Verification:** `npm run check:claim-anchors` green; the disposition rows for lines 80–82 record those clauses as byte-unchanged
- **Committed in:** `c109bf1`

---

**Total deviations:** 6 auto-fixed (2 blocking-ordering, 2 missing-critical scope, 1 blocking-gate, 1 bug)
**Impact on plan:** No scope creep. Deviations 1 and 4–5 are gates and invariants the plan's file list did not enumerate but which its own acceptance criteria require; 2, 3 and 6 are correctness. Every deviation is inside the plan's stated objective — retire the scalar everywhere it lives.

## Issues Encountered

- **`noEmitOnError` nearly hid a build.** Following the project note from 30-05, every `.ts` edit was followed by a rebuild AND a grep of the emitted `.js` for the new text before any test was trusted. It landed each time; the check is recorded because skipping it is the failure mode.
- **A section-anchored table reader adopted an unrelated table.** The first draft of the twin's roster-table parser ran its row pattern over the whole document and read `diff`, `branch` and `pr` as roster members, because the legacy grade table has the same column shape. Fixed structurally — an explicit CLOSING bound, a throw on an unbounded slice, a non-vacuity check that the slice is shorter than the document, and an assertion that every tier cell is one of the two legal markers so a mis-parse cannot read as a pass. This is the Phase 29 lesson reproduced exactly: a reader that starts at a heading and runs to end-of-file adopts whatever comes later.
- **Pre-existing failure, not this plan's.** `scripts/frontmatter.test.ts`'s D-49 false-red control fails on a Phase 29.1 planning document (V-30-01-01). Baseline before this plan: 1 failed / 2595 passed. After: 1 failed / 2641 passed. Same single failure, same document.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced.

## Threat Flags

None. The surfaces this plan touched are the validator's refusal set (narrowed nothing, widened the refusal), the config documents, and one read-only installer function. No network endpoint, auth path, file-write path or schema at a trust boundary was added.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **The retired scalar is gone from every shipped and fixture surface** and is refused when present. Later plans in this phase can assume a config that parses carries no `autonomy` key and that any `checkpoints` object in it is well-formed.
- **`TECHNICAL_NAMES_COUNT` is 76.** A plan that adds or removes a top-level config key moves it again and must walk both consumers with paired measurements, as the pin's comment demands.
- **`docs/initial/agent_factory_builder_spec_v2.md` still names the retired scalar and was deliberately left alone.** It is the original v2 specification — a historical record of what the project set out to build, on the same argument that exempts `CHANGELOG.md` from the retired-vocabulary scan. It is outside every gate's scan set. Flagging it so a later reader does not "correct" it.
- **`scripts/autonomy-zero-config.test.ts` writes `autonomy: "pr"` into a temp config on purpose** and was not touched. That fixture is now an accurate model of a repository that has not yet migrated, and the guard it drives does not read the key. Left as-is deliberately.
- **The plan's two `prohibitions` are now discharged.** The installer reports without rewriting (asserted on bytes, deviation-free), and no fixture fails for a second unrelated reason (asserted per-fixture by finding set).

## Self-Check: PASSED

- `docs/audit/29-style-dispositions/30-06.md` — FOUND on disk
- `7f3bffb`, `c109bf1` — both FOUND in `git log --oneline --all`
- `npx vitest run --exclude '**/scripts/e2e/**'` — 1 failed / 2641 passed / 2 skipped. The one failure is the recorded pre-existing `scripts/frontmatter.test.ts` D-49 control (V-30-01-01), not this plan's.
- `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness && npm run freshness:adapters` — all green; 52/52 committed `.js` match a rebuild; adapters regenerate with 0 byte differences
- `node scripts/check-foundation-guards.js`, `node scripts/check-kit-refs.js`, `npm run check:public-docs`, `npm run check:banned-claims`, `npm run check:claim-anchors`, `npm run check:imperative-lexicon`, `npm run check:diff-disposition`, `npm run check:audit-register`, `npm run check:nul-bytes` — all ALL CHECKS PASSED, post-commit
- Adversarial: 37-payload sweep 0 bypasses / 0 false reds; 5/5 mutation kills; installer config sha256 unchanged across two runs

---
*Phase: 30-per-checkpoint-autonomy-matrix*
*Completed: 2026-09-05*

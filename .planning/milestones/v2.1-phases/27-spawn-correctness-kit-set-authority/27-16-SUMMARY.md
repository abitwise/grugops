---
phase: 27-spawn-correctness-kit-set-authority
plan: 16
subsystem: packaging
tags: [spawn, verification, human-verify, precheck, recording-surface, typescript, honesty]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "listAgentAdapters (27-10, the one adapter authority), frontmatter.ts's Parsed<T> reader for the coordinator marker and the enumerated grant (27-12), the `/grugops` command correction (27-15), the byte-gated .claude/agents set (27-11)"
provides:
  - "one command that discharges every observable precondition of the SPAWN-03 coordinator-resolution check, exiting non-zero naming the one that failed"
  - "a printed human-only remainder quoted verbatim from 27-VERIFICATION.md, asserted by nothing"
  - "success wording that cannot be skimmed as a pass of the runtime half, with a test asserting the absence of pass-shaped claims"
  - "27-SPAWN-03-RUNTIME-EVIDENCE.md — the single recording surface, shipped with 11 empty UNVERIFIED slots matching the precheck's printed block field for field"
  - "the 27-VALIDATION.md manual-only row naming the precheck as step 0 and pointing at the recording surface"
affects: [27-17, 28, SPAWN-03, REQUIREMENTS.md]

tech-stack:
  added: []
  patterns:
    - "Split a verification by OBSERVABILITY, then automate the observable half completely so the human half is two minutes and cannot be entered against a broken tree"
    - "Assert the ABSENCE of pass-shaped wording, not only the presence of the right wording — a honest report is defined by what it does not claim"
    - "Ship the recording surface BEFORE the observation, empty and marked unverified, so an unfilled file reads as unfilled rather than as a pass"
    - "A script that must not spend tokens says so in its own header as a hard rule, because the next author's obvious improvement is exactly the thing that would make it dishonest"

key-files:
  created:
    - scripts/coordinator-resolution-precheck.ts
    - scripts/coordinator-resolution-precheck.js
    - scripts/coordinator-resolution-precheck.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md
  modified:
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-VALIDATION.md

key-decisions:
  - "A version below the advertised floor, or inside the known-bad v2.1.217-v2.1.218 window, FAILS the precheck rather than merely being reported. The plan excused only the not-on-PATH case from failing; an observation taken inside the known-bad window would describe a runtime whose default spawn depth is 1, which is not the runtime this kit is written against. Not-on-PATH stays UNKNOWN - verify and non-fatal, because the filesystem preconditions are still worth discharging."
  - "A second CLI option, `--inspect-target <dir>`, was added beside the planned `--keep-scratch-target`. It inspects an already-installed target and performs NO install, which is the only way the two required RED cases can plant a broken precondition without writing anywhere and without a second install per case. It narrows what the script does; it cannot widen it."
  - "Nothing in the script is exported. The module performs a scratch install at load, so an `import` of even a constant would run an install as a side effect. The test drives the committed .js as a child process and restates the two literals it needs — and Case 7 asserts the prefix live, so the restatement cannot rot into a vacuous assertion."
  - "The precheck is deliberately NOT wired into CI or package.json. It performs an install and its green result depends on the platform CLI being on the host's PATH; it is a human-facing prerequisite for an interactive step, not a build gate. Its TEST is in the suite, which is what keeps the script itself honest on every run."
  - "The materialized-kit sentinel reader is restated rather than imported: install/install.ts performs an install at module load, so importing it to reach its ten-line readAdapterKit would run the installer. Recorded as a residual below rather than silently duplicated."

patterns-established:
  - "Forbidden-wording assertions as a safety mechanism: a constant list of pass-shaped regexes asserted absent over the whole output, so a later edit that softens the honesty turns the suite red"
  - "Adversarially break EVERY precondition in a hermetic scratch install, not only the ones the plan named as RED cases"

requirements-completed: []  # SPAWN-03 stays open — its runtime half is still unobserved, by design

coverage:
  - id: D1
    description: "One command discharges every observable precondition of the coordinator-resolution check and reports each as a named line"
    requirement: "SPAWN-03"
    verification:
      - kind: integration
        ref: "node scripts/coordinator-resolution-precheck.js -> exit 0; six named facts observed live: platform version 2.1.220 (above the 2.1.219 floor, outside 2.1.217-2.1.218), installed adapter count 17, coordinator agent name grugops-orchestrator, grant size 16, granted names resolving 16 of 16, materialized kit path present and carrying roles/orchestrator.md"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/coordinator-resolution-precheck.test.ts -> 7 passed (Case 2 pins each of the six facts by line-anchored regex)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The precheck exits non-zero naming which precondition failed, so nobody is sent into the interactive step against a broken tree"
    requirement: "SPAWN-03"
    verification:
      - kind: unit
        ref: "Cases 5-6: coordinator adapter removed -> exit 1 naming `coordinator: true` / 'no coordinator adapter'; grant widened with grugops-no-such-role -> exit 1 naming that agent and 'resolve to no installed adapter file'; neither output contains the success marker"
        status: pass
      - kind: manual
        ref: "7 adversarial plants in hermetic scratch installs (see Adversarial Reproduction) — each exit 1 naming the correct precondition, including a nested second coordinator and an unreadable-frontmatter adapter"
        status: pass
    human_judgment: false
  - id: D3
    description: "The precheck cannot be read as a pass of the runtime half"
    requirement: "SPAWN-03"
    verification:
      - kind: unit
        ref: "Case 4 asserts 9 pass-shaped regexes ABSENT over the whole output (/pass(ed|es)?/, /verified/, /confirmed/, /was observed/, /did run/, /resolved and ran/ unless slot-terminated, /complete/, /success/, /header named/) — all absent"
        status: pass
      - kind: unit
        ref: "Case 1 asserts the CLOSING line itself carries PRECONDITIONS HOLD + 'NOT PERFORMED' + 'unverified'; Case 3 asserts both unperformed steps and all 11 slots are printed, and that every printed slot line ends in a colon with no value after it"
        status: pass
    human_judgment: false
  - id: D4
    description: "The precheck spends no tokens, starts no session, and writes only into scratch directories it created and removes"
    requirement: "SPAWN-03"
    verification:
      - kind: manual
        ref: "grep of the script for child processes -> exactly two: `claude --version` and node install/install.js against a temp target with an isolated GRUGOPS_HOME. No print-mode or interactive platform invocation exists in the file."
        status: pass
      - kind: unit
        ref: "Case 7: the system temp directory listed for the script's prefix immediately before and after a default run -> zero added entries; the prefix asserted live against the kept target's own path so the case cannot go vacuous"
        status: pass
    human_judgment: false
  - id: D5
    description: "One recording surface exists before the human runs the check, empty and unverified, matching the precheck's printed fields"
    requirement: "SPAWN-03"
    verification:
      - kind: other
        ref: "diff of the precheck's printed slot labels against the evidence file's slot labels -> identical, 11 of 11 (8 required + 3 recorded-if-encountered)"
        status: pass
      - kind: manual
        ref: "frontmatter `status: unperformed-pending-human-verification`, `observation_performed: false`; every slot value is the literal `_(empty — UNVERIFIED)_`; no slot carries a plausible-looking value"
        status: pass
    human_judgment: false
  - id: D6
    description: "No adjacent gate regressed"
    requirement: "SPAWN-03"
    verification:
      - kind: integration
        ref: "npm run build exit 0; npm run freshness -> 31 committed .js fresh (was 30); check-foundation-guards 0 FAIL 0 WARN; check-kit-refs exit 0; check-uat-oracles exit 0; adapters-freshness 17 compared / 0 byte differences; npx vitest run --exclude '**/scripts/e2e/**' -> 35 files, 947 passed (was 940), 2 skipped"
        status: pass
    human_judgment: false

metrics:
  duration: 30m
  completed: 2026-07-29
  tasks: 2
  files: 5

status: complete
---

# Phase 27 Plan 16: The apparatus for the one check no command can perform — Summary

**The observable half of SPAWN-03 is now one command that refuses to claim the rest, and the runtime
half has one recording surface that ships empty, marked unverified, with a stated rule that an empty
slot means unperformed and never means it held.**

## What Was Built

### Task 1 — `feat(27-16)`, commit `764b5aa`

`scripts/coordinator-resolution-precheck.ts` and its committed `.js` twin. It performs, in order, and
reports each as a named line:

| Reported fact | Observed live on this tree |
|---|---|
| platform version | `2.1.220 (Claude Code)` — at or above the `2.1.219` floor, outside the `2.1.217`–`2.1.218` known-bad window |
| scratch install | ran cleanly into a temp target with an isolated temp kit home |
| installed adapter count | `17 adapter(s)` |
| coordinator agent name | `grugops-orchestrator` (from `grugops-orchestrator.md`, located by marker not filename) |
| coordinator grant size | `16 enumerated name(s)` |
| granted names resolving to an installed adapter file | `16 of 16` |
| materialized kit path | the absolute scratch kit root, present, carrying `roles/orchestrator.md` |

**It consumes the authorities rather than re-deriving them.** The adapter set comes from
`kit-model.ts`'s `listAgentAdapters()` — so a nested adapter the platform would load is inside this
check, which is what caught the planted second coordinator in adversarial case 7. The coordinator
marker, the agent name and the enumerated grant are read through `frontmatter.ts`, and its parse-
failure arm is branched explicitly: an unreadable adapter fails the precheck by name rather than being
folded into "carries no marker". This file writes no directory listing and no frontmatter grammar of
its own.

**Granted-name resolution is name-to-name, never name-to-filename.** Each granted name is looked up
against the set of frontmatter `name` values across the installed adapters, because that is where the
platform takes agent identity from. A filename-keyed lookup would answer a different question than the
runtime asks.

**Three hard rules are written into the script's own header**, because each is what a future author's
obvious improvement would break: no model session and no tokens (the only two child processes are
`claude --version` and this repository's installer — a print-mode invocation would spend real tokens
and still not emit the startup header); the success wording must not read as a pass; and every write
lands in a scratch directory the script created, with both removed on every exit path including the
failure paths.

**The human-only remainder is printed verbatim** from `27-VERIFICATION.md` § Human Verification
Required — Test, Expected and Why-human quoted rather than summarized, because a summary is where a
check quietly gets easier than the one specified. Both steps are labelled `NOT PERFORMED by this
command`. `--keep-scratch-target` keeps the target and the kit home and prints both paths, so the
`cd` in the pasted commands names a directory that exists; the default removes them and the printed
`cd` says so instead of naming a path that is already gone.

**The closing line, verbatim:**

```
PRECONDITIONS HOLD: every observable precondition of the coordinator-resolution check is satisfied on
this tree. The two runtime steps above are NOT PERFORMED by this command, and SPAWN-03's runtime half
stays unverified until a human observes it and records the observation in
.planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md.
```

`scripts/coordinator-resolution-precheck.test.ts` drives the committed `.js` as a child process across
seven cases: the green run, the six named facts, the human-only block with all 11 slots printed empty,
the absence of pass-shaped wording, both required RED directions, and the no-leftover-temp-directory
proof.

### Task 2 — `docs(27-16)`, commit `3032516`

`27-SPAWN-03-RUNTIME-EVIDENCE.md`, the single recording surface. Frontmatter carries
`status: unperformed-pending-human-verification` and `observation_performed: false`, so a machine sees
the open state without parsing prose. The body restates the check, the expected result and why no
command can perform it, then carries 8 required slots and 3 recorded-if-encountered backstop slots,
every one holding the literal `_(empty — UNVERIFIED)_`.

The file states its own rules in the first paragraph: it is a recording surface and not a report; no
agent may fill a slot from a command's output; an empty slot means the check was not performed and
never means it held; and an agent finding an empty slot must report SPAWN-03's runtime half as
unperformed rather than infer it.

The two outcomes are named with what each obliges. A matching observation fills the slots, updates the
status and marks the requirement complete citing this file. A non-matching observation is recorded
exactly as seen, SPAWN-03 stays open, and the discrepancy becomes a finding — explicitly not a retry
until it agrees, and explicitly not a reason to soften the expected result.

The three backstop slots (same-name project/user scope, the no-adapter-matches error text, multi-role
ordering) ask only for what was seen, and say plainly that if the edge did not occur the slot stays
empty and nothing is claimed about how the runtime would have behaved.

`27-VALIDATION.md` gained exactly two changed rows: the manual-only row now carries the precheck as
step 0 with what it does and does not discharge, plus the pointer to the recording surface; and the
per-task map row for SPAWN-03 names plan `27-16`, tasks `T1–T2`, wave 5. Nothing else in that document
moved, and `.planning/STATE.md` was not touched by this task.

## Verification Evidence

Every command below was run and its real output observed.

| Command | Result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | `All build outputs fresh: 31 committed .js file(s) match a fresh tsc rebuild.` (was 30) |
| `node scripts/coordinator-resolution-precheck.js` | exit 0, closing line as quoted above |
| `npx vitest run scripts/coordinator-resolution-precheck.test.ts` | 7 passed |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, 0 FAIL, 0 WARN, exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `node scripts/check-uat-oracles.js` | exit 0 (re-run after the `.planning` doc edits) |
| `node scripts/adapters-freshness.js` | `17 adapter(s) compared … 0 byte difference(s), directory listings set-equal` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 35 files, **947 passed** (was 940), 2 skipped |
| slot diff (precheck printed labels vs evidence file labels) | identical, **11 of 11** |
| temp-directory listing for the script prefix, before/after a default run | 0 entries added; 0 remaining after the whole suite |

The bare package test script was never run — it triggers the live model-CLI end-to-end lane.

### Adversarial reproduction (a green suite is not proof for a safety invariant)

Seven plants, each in a copy of a real scratch install, driven through `--inspect-target` so nothing
was written outside the scratch tree. Every one exited 1 naming the correct precondition, and none
printed the success marker. The plan required two of these; the other five were added because a
precondition that is only checked in the green direction is not checked.

| # | Plant | Named by the precheck |
|---|---|---|
| 1 | coordinator adapter deleted | `no installed adapter carries the \`coordinator: true\` marker … Checked 16 adapter(s)` |
| 2 | marker flipped to `coordinator: false`, file left in place | same precondition, `Checked 17 adapter(s)` — the file count is not the check |
| 3 | grant widened with `grugops-ghost-role` | `1 of the coordinator's 17 granted name(s) resolve to no installed adapter file: grugops-ghost-role` |
| 4 | materialized `KIT=` repointed at a path that does not exist | `the coordinator adapter's materialized kit path … does not exist` |
| 5 | kit path valid but `roles/orchestrator.md` deleted | `the coordinator's role file is missing at …` |
| 6 | an adapter with an unterminated frontmatter block | `unreadable frontmatter — … NOT an absence of keys` (the parse-failure arm, branched explicitly) |
| 7 | a second coordinator planted at `.claude/agents/nested/rogue.md` | `2 installed adapters carry the \`coordinator: true\` marker (grugops-orchestrator.md, nested/rogue.md)` |

Case 7 is the one that only works because the adapter set comes from the shared recursive authority. A
non-recursive listing — the exact defect 27-10 deleted — would have reported the tree as holding one
coordinator and the precheck would have gone green over an ambiguous set.

## Deviations from Plan

### 1. [Rule 2 — missing critical correctness] A below-floor or known-bad platform version fails the precheck

- **Found during:** Task 1, writing the version observation.
- **Issue:** The plan says to compare against the floor and the known-bad window and "report which of
  the three states holds", and explicitly excuses only the not-on-PATH case from being a failure. It
  does not say what a below-floor or inside-the-window result should do. Reporting it and exiting 0
  would send a human into the interactive step on a runtime whose default spawn depth is 1 — an
  observation that would describe the known-bad window rather than the advertised floor, recorded
  against a requirement written for the floor. That is threat T-27-77 in a different coat.
- **Fix:** Both states fail, naming the version and the remedy. Not-on-PATH and an unparseable version
  string stay `UNKNOWN - verify`, non-fatal, with the filesystem preconditions still discharged.
- **Files:** `scripts/coordinator-resolution-precheck.ts`. **Commit:** `764b5aa`.

### 2. [Rule 3 — blocking] A second CLI option, `--inspect-target`

- **Found during:** Task 1, writing the two RED cases the plan requires.
- **Issue:** Both RED cases need an installed target with a broken precondition. Letting each case run
  its own install would mean three installs per suite run and a fixture the test cannot mutate before
  the script reads it.
- **Fix:** `--inspect-target <dir>` inspects an already-installed target and performs no install at
  all, reporting the install line as "not run — inspecting … Nothing was written." The suite performs
  exactly two installs, in `beforeAll`, and every plant lands in a copy it owns. The option narrows
  what the script does rather than widening it: it can only remove the install step.
- **Files:** `scripts/coordinator-resolution-precheck.ts`, `scripts/coordinator-resolution-precheck.test.ts`.
  **Commit:** `764b5aa`.

### 3. [Rule 2] Five adversarial plants beyond the two the plan requires

- The plan names two RED cases. Five more were run by hand (table above), including the nested second
  coordinator and the unreadable-frontmatter adapter — the two shapes this milestone's own review
  reproduced as live bypasses. Recorded because a precondition checked only in the green direction is
  not checked. No code change was needed; every plant was already named correctly.
- **Commit:** `764b5aa` (evidence only).

## Known Stubs

None. No placeholder, mock or hardcoded empty value was written into code. The evidence file's empty
slots are the deliberate product of this plan, are marked `UNVERIFIED` in the file and
`unperformed-pending-human-verification` in its frontmatter, and are the opposite of a stub: a stub
hides an absence, and these announce one.

## Deferred / Pending Human Verification

| Item | Kind | Status | Owner |
|---|---|---|---|
| `claude --agent grugops-orchestrator` resolves the coordinator; the startup header names `@grugops-orchestrator` | unrun-verify (SPAWN-03 runtime half) | **open** | named human — run `node scripts/coordinator-resolution-precheck.js --keep-scratch-target` first, record in `27-SPAWN-03-RUNTIME-EVIDENCE.md` |
| A distinct role agent resolves and runs when the coordinator routes a subtask | unrun-verify (SPAWN-03 runtime half) | **open** | same |
| The three backstop edges (same-name scope collision, no-adapter error text, multi-role ordering) | recorded-if-encountered | **open, non-blocking** | recorded in the same file if the observation happens to exercise them; nothing is claimed if it does not |

**SPAWN-03 remains incomplete in `REQUIREMENTS.md`.** This plan built the apparatus, not the
observation. What changed is that the human step is now scripted, precondition-checked and has a place
to land — the check itself is still unperformed.

## Residual Recorded, Not Closed

The materialized-kit sentinel (`MAT_OPEN` / `MAT_CLOSE`) and its `KIT=` reader now exist in two
places: `install/install.ts`'s `readAdapterKit()` and this precheck. They are not shared because
`install.ts` performs an install at module load — it is an executable script, not an importable
module — so importing it to reach a ten-line reader would run the installer as a side effect. The
sentinel is a stable on-disk contract with its own installer-suite coverage, and the duplication is
eight lines, but it is a second reader of one fact and this milestone exists to delete exactly that
shape. Extracting it belongs to whichever plan owns `install.ts`; recorded here rather than left
implicit.

## Threat Flags

None. No network endpoint, auth path or schema at a trust boundary was introduced. The five
mitigations this plan's register assigns are each applied and each pinned:

| Threat | Disposition | Pinned by |
|---|---|---|
| T-27-73 precheck output mistaken for a pass of the runtime half | mitigated | the closing line states the runtime steps are unperformed; Case 4 asserts nine pass-shaped regexes absent over the whole output |
| T-27-74 an unfilled evidence slot read as a passing observation | mitigated | frontmatter `unperformed-pending-human-verification`, every slot `_(empty — UNVERIFIED)_`, and the stated rule in the file's opening paragraph |
| T-27-75 a scratch install writing into the real kit home or user configuration | mitigated | its own temp target and temp `GRUGOPS_HOME`, removed in a `finally` on every path (no `process.exit` inside the `try`, which is how a cleanup gets lost); Case 7 asserts zero added temp entries |
| T-27-76 a precheck that starts a model session and spends tokens or hangs | mitigated | two child processes only, both with timeouts; the rule is written into the script header; confirmed by reading the file for any other invocation |
| T-27-77 a human sent into the interactive step against a broken tree | mitigated | non-zero exit naming the failed precondition, pinned by two RED cases in the suite and five further adversarial plants |

T-27-SC (package-manager installs) remains `accept` — no dependency was added or changed.

## Self-Check: PASSED

- `scripts/coordinator-resolution-precheck.ts`, `scripts/coordinator-resolution-precheck.js`,
  `scripts/coordinator-resolution-precheck.test.ts`,
  `.planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md` — all
  present on disk; `27-VALIDATION.md` modified.
- Commits `764b5aa` and `3032516` — both present in `git log`.
- `git diff --diff-filter=D` across both commits — no file deletions.
- The committed `.js` twin verified fresh against its `.ts` source by `npm run freshness` (exit 0, 31
  files).
- `git diff --name-only` for Task 2 listed exactly the evidence file and the validation document;
  `.planning/STATE.md` was untouched by that task and `check-uat-oracles.js` re-run green afterwards.

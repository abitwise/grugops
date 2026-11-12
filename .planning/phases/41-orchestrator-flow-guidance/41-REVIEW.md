---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-12T19:40:00Z
depth: standard
files_reviewed: 50
files_reviewed_list:
  - agent-factory/config/factory.config.md
  - agent-factory/contracts/context-note.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/05-pr-quality-gate.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - CHANGELOG.md
  - docs/audit/29-style-dispositions/41-11.md
  - docs/audit/29-style-dispositions/41-18.md
  - docs/audit/29-style-dispositions/41-19.md
  - docs/audit/29-style-dispositions/41-20.md
  - docs/audit/29-style-dispositions/41-21.md
  - docs/audit/29-style-dispositions/41-22.md
  - docs/audit/29-style-dispositions/41-23.md
  - docs/audit/29-style-dispositions/41-24.md
  - docs/audit/29-style-dispositions/41-25.md
  - docs/audit/41-residuals.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - install/README.md
  - scripts/claim.js
  - scripts/claim.test.ts
  - scripts/claim.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/index.md
  - scripts/flow-guidance-text.test.ts
  - scripts/generate-runnable-embeds.js
  - scripts/generate-runnable-embeds.ts
  - scripts/now-running-freshness.test.ts
  - scripts/runnable-ref/claim.js
  - scripts/runnable-ref/claim.test.ts
  - scripts/runnable-ref/claim.ts
  - scripts/runnable-ref/note.js
  - scripts/runnable-ref/note-read-sites.test.ts
  - scripts/runnable-ref/note.test.ts
  - scripts/runnable-ref/note.ts
  - scripts/runnable-ref/role-route.test.ts
  - scripts/runnable-ref/runnable-exit-contract.test.ts
  - scripts/runnable-ref/state-check.js
  - scripts/runnable-ref/state-check.ts
  - scripts/runnable-ref/state-roll.js
  - scripts/runnable-ref/state-roll.ts
  - scripts/runnable-ref/trace-render.js
  - scripts/runnable-ref/trace-render.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 41: Code Review Report

**Reviewed:** 2026-11-12T19:40:00Z
**Depth:** standard
**Files Reviewed:** 50
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

This is an incremental re-review of the changes from `1019bf40` to HEAD, made by gap plans 41-19 to 41-25. I checked whether each of the 22 earlier findings those plans claim to fix is fixed in the code and text, and I looked for new defects the fixes introduced.

**How findings were checked.** "Reproduced" means a run against a scratch copy of the committed `scripts/runnable-ref/note.js` or `claim.js`, or against the committed `scripts/context-io.js`, in a temporary repository with `CLAUDE_PROJECT_DIR` and `GRUGOPS_PROJECT_DIR` unset. Everything else comes from reading the code.

**Build and drift.** I compiled the `.ts` sources with `tsc` into a scratch directory. Every committed `.js` in scope is byte-identical to that build. The decider manifest in `hooks/hook-entry.ts` matches the sha256 of the committed `scripts/context-io.js`. `ADMIT_FROZEN_SHA256` was re-based for the change to `admit()`'s duplicate message, and the re-base is recorded. The eight focused test files (`note`, `claim` in both trees, `flow-guidance-text`, `role-route`, `runnable-exit-contract`, `tier-kit-text`, `now-running-freshness`) pass: 744 tests. I did not run the full suite.

**Earlier findings: what the gap plans fixed.**

| id | plan | verdict |
|---|---|---|
| CR-03 | 41-23, 41-25 | Fixed as text, by the human decisions D-41 and D-44. Workflows 05, 16 and 17 and R-41-10 now state that a host has no gate stamp. IN-20 notes one sentence in Workflow 05 that was left unqualified. |
| WR-14 | 41-20 | Fixed. Reproduced: a second `emit-verdict` for one run id is refused, exit 1, and nothing is written. The S4 message now names a route. |
| WR-15 | 41-24 | Fixed. The changelog and Workflow 16 cite R-41-09's open routes. |
| WR-09 | 41-21 | Partly fixed. I/O faults, the root refusal and publish failures now exit 2. Two `admit()` refusals that say nothing about the note still exit 1 (WR-16). The fix also added a contradictory suffix to every exit-2 line (WR-17). |
| WR-10 | 41-21 | Fixed. Reproduced: a link at `.grugops/audit` and a dangling link at `admissions.jsonl` both exit 2 with nothing written. A plain directory still writes the ledger. |
| WR-12 | 41-22 | Fixed. Reproduced: `note.js read` prints the sealed current notes, names a hand-written note as `skipped zz.md (unsealed)`, and exits 2 on a FIFO. IN-17 and IN-18 are small residues. |
| WR-13 | 41-23 | Fixed in the text. The new text names a route that only a plugin install has (WR-18). |
| IN-14 | 41-24 | Fixed in Workflow 16, the changelog and R-41-07. |
| IN-15 | 41-21 | Fixed. Reproduced: the refusal names the ladder, the working directory and the home directory. |
| IN-09 | 41-20 | Fixed in `render()` and the fixture. |
| IN-10 | 41-21 | Fixed in Workflow 16 step 3. |
| IN-13 | 41-21 | Fixed in Workflow 16 step 3. |
| WR-05 | 41-19 | Fixed for `ref:` lines. Reproduced: a pending file with no `ref:` is refused at `claim`, exit 2. IN-16 is a residue. |
| WR-06 | 41-19 | Fixed in Workflow 17 step 1 and Workflow 04 step 16. |
| WR-07 | 41-19 | Fixed in code. Reproduced: `kept z`, and `pending/z.md` keeps the newer `ref:`. Session start now gives two conflicting instructions for a kept claim (WR-19). |
| WR-08 | 41-24 | Fixed. |
| WR-11 | 41-19 | Fixed. Reproduced: `left bad+name` and `left stray`. |
| IN-04, IN-05, IN-07, IN-12 | 41-19 | Fixed. |
| IN-11 | 41-22 | Fixed. |

**Not repeated:** the recorded limits R-41-07 to R-41-11 and the deferred IN-02, IN-03 and IN-06.

**No findings** in:

- `hooks/hook-entry.*`, `scripts/generate-runnable-embeds.*`, and the stamp-only changes to `state-check`, `state-roll` and `trace-render`;
- `agent-factory/config/factory.config.md`, `agent-factory/roles/orchestrator.md` and `agent-factory/workflows/04-ticket-to-pr.md`;
- the `emitVerdict` duplicate check itself.

The changed test files show no weakened assertion. Each moved exit-1 expectation was moved to exit 2 under the rule plan 41-21 states.

## Warnings

### WR-16: Exit 1 still covers two refusals that say nothing about the note, and the changelog says it no longer does

**File:** `scripts/context-io.ts:4506` (the D-14 arm of `admit()`), `scripts/context-io.ts:4628` (the unnameable-owner arm), `scripts/context-io.ts:240-253` (`NoteRefusal`), `scripts/runnable-ref/note.ts:20-23`, `CHANGELOG.md:131-133`, `agent-factory/workflows/16-context-read-write.md:31`

**Issue:** Both cases reproduced against the committed `note.js`:

1. With an unparseable `.grugops/factory.config.json`, `note.js add t1 --kind observation ...` printed `refused t1: ... admission REFUSED (UNKNOWN - verify): a governance configuration file exists ... could not be read or parsed`, exit 1.
2. With `audit_retention: retained` set in a parent repository, and the command run from a subdirectory that holds its own `.grugops/`, the run printed `refused t1: ... admission REFUSED (destination-outside-governed-store) ...`, exit 1.

Neither case judges the note. Both are `admit()` findings, so `appendNote` wraps them in `NoteRefusal`, and every finding of `admit()` gets the same class. The plan chose this on purpose (41-21-PLAN: "an `admit()` finding (D-04, D-14, S11 and the rest) ... keeps exit 1"). The stated contract says otherwise:

- `CHANGELOG.md:133` says "so exit `1` now means only that the note itself must change".
- The `NoteRefusal` comment calls it "the one class a caller may report as 'change the note'".

Workflow 16 sends every exit-1 line to step 4. There a role earns a stamp or degrades to a `claim`. Under D-14 the `claim` is refused too, so the role spends `self_fix_attempts` on a sound note. That is the harm WR-09 named.

**Fix:** The plain fix sits outside the frozen span. In `appendNote`, before `admit()`, throw a plain `Error` (exit 2) in two cases:

- when `readGovernanceConfig(repoRoot).source === "unreadable"`;
- when the retention value is `retained` and `ledgerOwner.answered` is false.

`admit()` keeps its own arms as the backstop. Otherwise, correct the text. In the changelog, write "exit 1 means the writer refused the note, or the configuration or the store's owner could not be read". Add both causes to Workflow 16's `## Stop conditions`.

### WR-17: Every exit-2 refusal raised before the write now says "The note may have been written; check notes/"

**File:** `scripts/runnable-ref/note.ts:2964`, `scripts/runnable-ref/note.ts:2971`, `scripts/runnable-ref/note.ts:2759-2761`

**Issue:** This is new with the WR-09 fix. `runAdd` sets `noteStands` to "The note may have been written; check .grugops/context/<f>/notes/ before adding it again." before it calls `appendNote`. Every non-`NoteRefusal` throw now goes to `couldNotRun`, which appends that text. Before the fix, the root refusal was a `refused` line, and the catch cleared `noteStands`. Reproduced with the working directory above `HOME`:

```
Error: context-io (the governance root ladder): refusing to name a governance root: ... nothing was admitted
and nothing was written. ... The note may have been written; check .grugops/context/t1/notes/ before adding it again.
```

The same suffix lands on the unrecordable-admission refusal, which itself says "Nothing was written", and on the differing-occupant and containment refusals. All of these are raised before `writeNoteFile`. So the line contradicts itself. It also tells the role to inspect `notes/`, which Workflow 16 step 1 now forbids ("Never read `notes/` by hand"). No test checks the suffix: `assertRootRefused` in `note-read-sites.test.ts:721-728` checks only the start of the line.

**Fix:** Keep the uncertain wording only where a write may have happened. Set `noteStands = ""` before the call, and let the writer mark the point of no return. A small option: throw a distinct class from `writeNoteFile`/`publishNoteExclusive`, and in the catch set `noteStands` to the "may have been written" text only for that class. Add `expect(run.stderr).toContain("No note was written.")` to `assertRootRefused`.

### WR-18: The new route text says "on Claude Code", but only a plugin install has `propose_note` and the hook

**File:** `agent-factory/workflows/16-context-read-write.md:31` ("The Orchestrator admits it through `propose_note` under the human's grant on Claude Code."), `agent-factory/workflows/16-context-read-write.md:43` ("Where the Orchestrator holds `propose_note` (Claude Code)"), `agent-factory/contracts/context-note.md:44`, `CHANGELOG.md:148`, `CHANGELOG.md:180`, `docs/audit/41-residuals.md:23` (R-41-11)

**Issue:** These sentences are new with the WR-13 and WR-14 fixes. They name `propose_note` behind the hook as the route that retires a verdict or a gated finding, and as the route that admits a high-severity finding, "on Claude Code".

The admission server and the hook ship only in the plugin. `.claude-plugin/plugin.json` declares `mcpServers`, `hooks/hooks.json` is plugin-only, and `install/install.ts` writes neither. R-41-01 states it already: "only the Orchestrator holds `propose_note`, and only on a Claude Code plugin install".

So the standalone Claude Code install, the scripted form that gives the literal `/grug`, has no route. A reader of Workflow 16 or the contract takes it to have one, and the phrase "a host with no hook" does not obviously cover a Claude Code install. These lines sit under governance text and `### Security`, where the project rule is never to overstate a control.

**Fix:** Write "on a Claude Code plugin install" in each of the six places. In Workflow 16 line 43 write "Where the Orchestrator holds `propose_note` (a Claude Code plugin install)". In R-41-11 and Workflow 16 step 3, state that a standalone Claude Code install has no hook, like the other hosts.

### WR-19: Session start tells the Orchestrator to re-spawn a claim the sweep kept, and doing so strands the newer subtask

**File:** `agent-factory/workflows/17-task-claim.md:86`, `scripts/runnable-ref/claim.ts:330-335`

**Issue:** Reproduced. With a stale `claimed/z/` holding `ref: .grugops/context/OLD/` and a newer `pending/z.md` holding `NEW/`, `sweep` printed `kept z (pending/z.md already exists, so the claim stays)`. `now-running.md` still shows `z` with `by: grugops-x`. Session start step 3 then gives two instructions for that row:

- "Finish each claim still in `now-running.md` ... Re-spawn the adapter named in `by`, to finish the task and run `done`"
- "Stop and name each entry `sweep` prints on a `kept` or `left` line"

Nothing says the first sentence excludes a kept row. A re-spawn finishes the stale `OLD` copy and moves it to `done/z.md`. After that, `claim z` on the newer `pending/z.md` is refused with "`done/z.md` already exists". Before that, `claim z` prints `lost z`, exit 1, which step 3 tells the Orchestrator to read as "take the next pending task". Either way the newer subtask is never run, the outcome WR-07 was raised to prevent.

The precondition is rare now that step 1 gives a re-queued subtask a new id. `claim` refuses only an id already in `done/`, though, not one still in `claimed/`.

**Fix:** In step 3, put the stop first and scope the re-spawn: "Stop and name each entry `sweep` prints on a `kept` or `left` line, so a human resolves it, and do not re-spawn a kept task. Finish each other claim still in `now-running.md` ...". Optionally, have `claim` refuse a task whose `claimed/<task>/` exists with exit 2 rather than `lost`, when its pending file is also present.

## Info

### IN-16: `claim` still accepts a subtask `done` will refuse: one above the 1 MiB record ceiling

**File:** `scripts/runnable-ref/claim.ts:236` (`pendingTextOrNull`, an unbounded `readFileSync`), `scripts/runnable-ref/claim.ts:1297` (`recordTextOrNull`, `RECORD_CEILING_BYTES`), `CHANGELOG.md:66-67`

**Issue:** Reproduced. A `pending/b.md` with one valid `ref:` line padded to 1,100,038 bytes claimed with exit 0. A sealed note was then written, and `done b` exited 2 ("above the 1048576-byte ceiling"). The claim stays, and step 7 forbids moving the subtask by hand. The changelog says "a task never stops at `done` for a subtask file it was claimed with". This is contrived, since step 1 makes the file two lines, but the WR-05 rule is "refuse what `done` would refuse".

**Fix:** In `claimPending`, read the pending file with `readRegularFileOrNull(path, RECORD_CEILING_BYTES, ...)`, or check `pendingEntry.size` against the same ceiling, and refuse above it.

### IN-17: `note.js read` ends each error line with "No note was written."

**File:** `scripts/runnable-ref/note.ts:2759-2761`, `scripts/runnable-ref/note.ts:2987-2993` (`readFolder`), `scripts/runnable-ref/note.ts:3027-3066` (`runRead`)

**Issue:** Reproduced: `note.js read t1 --x` and a FIFO in `notes/` each print an `Error:` line that ends "No note was written." `read` never writes, so the clause is noise on a command whose header says it "writes nothing".

**Fix:** Give `couldNotRun` a suffix parameter, or have it check `command === "read"` and omit the clause.

### IN-18: `read` of a mistyped folder reads as an empty context, and files without `.md` are not named

**File:** `scripts/runnable-ref/note.ts:3040-3049`, `scripts/runnable-ref/note.ts:1381`, `agent-factory/workflows/16-context-read-write.md:27`

**Issue:** Reproduced: `note.js read nope` printed `read nope: 0 current, 0 superseded, 0 skipped`, exit 0. A typo in the folder name gives the same output as a new task with no context, and Workflow 16 step 1 then has the role start from a blank slate. Separately, step 1 says `read` "names each file in `notes/` that is not a sealed note". The walk skips any name not ending in `.md` without a record (`if (!file.endsWith(".md")) continue;`), so a stray `notes/x.txt` or `.tmp-x` is not named.

**Fix:** Print `read <folder>: no context folder` when `.grugops/context/<folder>` is absent, so the two cases differ. Change step 1 to "names each `.md` file in `notes/` that is not a sealed note".

### IN-19: The role-switch protocol still sends deliverables to `artifact-ref`, which every host refuses

**File:** `agent-factory/roles/_role-switch-protocol.md:21`

**Issue:** Reproduced: every `artifact-ref` written on a host is refused, exit 1. Without `--sha`, `--gate-run` and `--content-hash` it fails validation, and with them it finds no verdict. The protocol is the path for hosts with no `Agent` tool, and none of those hosts has a gate stamp. Step 4 still says "deliverables as `artifact-ref`", so a role there meets a refusal on every deliverable before Workflow 16 step 3 tells it to write an `observation`. R-41-10 records this ("a role text that names `artifact-ref` for a deliverable meets that refusal there"). It also says no human has accepted that part. This file was edited in this range and the fix is one clause.

**Fix:** "Publish deliverables as `artifact-ref` where a gate stamp exists, and otherwise as an `observation` carrying their refs, per step 3 of Workflow 16."

### IN-20: Workflow 05's escape-hatch paragraph still promises the real stamp from the Step-4 loop on a host

**File:** `agent-factory/workflows/05-pr-quality-gate.md:57`

**Issue:** The new host paragraph at line 53 says no `§14-gate#<id>` finding can be admitted on a host. Four lines later, "No faked pass (escape hatch)" still says the bounded Step-4 attempts "obtain the real `§14-gate#<id>` stamp", with no qualifier. Workflow 16 step 4 was qualified for the same route ("This route exists only where `emitVerdict` runs"). This paragraph was not.

**Fix:** Append to the paragraph: "This route exists only where `emitVerdict` runs; on a host, degrade to a `claim` or escalate, per Workflow 16 step 4."

---

_Reviewed: 2026-11-12T19:40:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

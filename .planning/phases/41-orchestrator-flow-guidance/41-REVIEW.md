---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-12T21:55:05Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - CHANGELOG.md
  - agent-factory/contracts/context-note.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/workflows/05-pr-quality-gate.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - docs/audit/29-style-dispositions/41-11.md
  - docs/audit/29-style-dispositions/41-20.md
  - docs/audit/29-style-dispositions/41-23.md
  - docs/audit/29-style-dispositions/41-26.md
  - docs/audit/41-residuals.md
  - scripts/flow-guidance-text.test.ts
findings:
  critical: 1
  warning: 3
  info: 5
  total: 9
status: issues_found
---

# Phase 41: Code Review Report

**Reviewed:** 2026-11-12T21:55:05Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

This is an incremental review of gap-closure plan 41-26 (commits 93a3f77c, 1635335b, 38240e86, 0be05dff and 44c27679, against base `0317159d`). The plan made text-only fixes for WR-18, WR-19, IN-19 and IN-20. I read each changed sentence in context and checked the facts it relies on:

- `install/install.ts` writes no `mcpServers`, `PreToolUse`, `admission-guard` or `hooks` entry.
- In `scripts/runnable-ref/claim.ts`, the `kept` arm is at lines 330-335, and `claimPending` refuses a task once `done/<task>.md` exists (line 227).
- The text gates the plan relies on all exit 0: lexicon, role rules, kit refs, diff disposition and banned claims.
- `scripts/flow-guidance-text.test.ts` passes 155 of 155.

The edits match the plan and the reviewer's suggested fixes, so the WR-19, IN-19 and IN-20 changes are sound. The WR-18 fix is incomplete. Step 3 of Workflow 16 now says a standalone Claude Code install has no hook. The finding sub-bullet straight after it still says that "On Claude Code" the per-call hook makes the `human:<name>` stamp un-forgeable, and the note contract says the same. So the kit still tells a standalone Claude Code install it has a control it lacks. That is the defect WR-18 was raised for, and the ledger now records WR-18 as fixed. The new "like the other hosts" sentence also contradicts D-44, under which a plugin install is a host that has the hook.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: WR-18 is recorded fixed, but Workflow 16 and the note contract still tell a standalone Claude Code install the hook protects its `human:<name>` stamp

**File:** `agent-factory/workflows/16-context-read-write.md:32`, `agent-factory/contracts/context-note.md:138-142`, `scripts/flow-guidance-text.test.ts:1358-1371`

**Issue:** Plan 41-26 added this sentence to step 3 (line 31): "A standalone Claude Code install has no hook, like the other hosts." The finding sub-bullet of the same step (line 32), which the plan left alone, still says:

- "On Claude Code the separate PER-CALL PreToolUse `admission-guard` hook makes the `human:<name>` signal un-forgeable."
- "The Claude Code primary tier is gated by the `human_admission` dial. The non-Claude-Code host CLIs degrade to two weaker signals."
- "A spawned role on Claude Code gets the same two, because `tools/grugops/note.js` runs outside the hook." This implies the Orchestrator on any Claude Code install gets the hook tier.

`context-note.md:138` repeats the claim: "on Claude Code its un-forgeable human-set signal is delivered by the separate PER-CALL PreToolUse `admission-guard` hook".

`install/install.ts` writes no hook and no MCP server. A standalone Claude Code install reading these lines is told its `human:<name>` stamp is un-forgeable, but nothing there binds the stamp to a human. This is the overstated control WR-18 named, under governance text, where the project rule is never to overstate a control. The step now also contradicts itself from one bullet to the next.

The plan's success criteria say "No kit text tells a standalone Claude Code install it holds `propose_note` or the hook", and that is false at HEAD. 41-REVIEW-DISPOSITION.md nonetheless records WR-18 as `fixed | 41-26`. The new negative pin, titled "no route sentence of Workflow 16, the note contract or the changelog keeps a bare Claude Code claim (WR-18)", passes while both sentences remain, because it lists only the five replaced phrases. The SUMMARY lists line 32 and line 138 "for a later ruling", but nothing in the ledger or the kit marks WR-18 as partly open.

**Fix:** Scope the remaining sentences the same way, then pin them:

```text
WF16 line 32:  On a Claude Code plugin install the separate PER-CALL PreToolUse `admission-guard` hook makes the `human:<name>` signal un-forgeable.
               The Claude Code plugin-install tier is gated by the `human_admission` dial. Every other install, a standalone Claude Code install included, degrades to two weaker signals.
               A spawned role on a plugin install gets the same two, because `tools/grugops/note.js` runs outside the hook.
context-note.md:138:  on a Claude Code plugin install its un-forgeable human-set signal is delivered by ...
```

Add `"On Claude Code the separate PER-CALL"`, `"The non-Claude-Code host CLIs degrade"` and `"on Claude Code its un-forgeable"` to the negative list at `flow-guidance-text.test.ts:1358-1371`. If the human keeps these sentences deferred, set WR-18 in 41-REVIEW-DISPOSITION.md to a partial state that names the two sites, not `fixed`.

## Warnings

### WR-01: "like the other hosts" contradicts D-44, under which a plugin install is a host that has the hook

**File:** `agent-factory/workflows/16-context-read-write.md:31`, `docs/audit/41-residuals.md:23` (R-41-11)

**Issue:** The new sentence reads "A standalone Claude Code install has no hook, like the other hosts." Later in the same step 3, the kit says "A Claude Code plugin install counts as a host too (residual R-41-10)", and R-41-10 and Workflow 05 line 53 say the same under D-44. A plugin install is the one host that has the hook. So "like the other hosts" claims every other host lacks the hook, and step 3 itself says one host has it. The sentence just before ("on a host with no hook, nothing retires one") already implies that some hosts have a hook. A reader cannot tell whether "host" includes a plugin install in this sentence, and the D-44 decision was made to remove that ambiguity. The same sentence is copied into R-41-11, where R-41-10, three rows above, says a plugin install counts as a host.

**Fix:** Name the hosts and do not use the generic word, for example: "A standalone Claude Code install has no hook, like every host but a Claude Code plugin install." (14 words, under the procedural bound). Make the same change in R-41-11 and in the matching pin at `flow-guidance-text.test.ts:1321`.

### WR-02: R-41-11 reads as accepted for a scope the human did not read, and the residual does not record the owed read

**File:** `docs/audit/41-residuals.md:23`, `docs/audit/41-residuals.md:41`

**Issue:** When Olger accepted R-41-11 in 41-UAT.md test 8, the row said only that the route exists "on Claude Code". Plan 41-26 widened the what-stays-open cell so a standalone Claude Code install has no route. It left the decision cell, "Olger accepted the limit on 2026-11-12 in `41-UAT.md` test 8", and wrote in the ruling section "Plan 41-26 did not edit the acceptance." The plan's own `<verification>` says "the read of R-41-11 as rewritten" stays owed to a named human, and its human-check asks Olger whether his acceptance "covers a standalone Claude Code install having no route, or you send it back". The residual file says neither. A reader of the register sees the wider limit marked accepted, with no sign that the acceptance came before the scope changed. Earlier rows in this file record owed reads explicitly ("A named human still owes the read of this entry"). The same reply did order the WR-18 fix, which supports the acceptance, but the plan itself treats the question as open.

**Fix:** Add to the R-41-11 ruling bullet at line 41: "A named human still owes the read of the row as plan 41-26 rewrote it, which adds a standalone Claude Code install to the hosts with no route." Remove the sentence when Olger replies.

### WR-03: Session start step 3 now opens with "Stop", which can read as halting session start before the other claims and the refill

**File:** `agent-factory/workflows/17-task-claim.md:86`

**Issue:** Step 3 now begins "Stop and name each entry `sweep` prints on a `kept` or `left` line, so a human resolves it." In this kit, "Stop" is a defined action (`## Stop conditions`, and "Stop per `## Stop conditions`" in `## Keep capacity full`). When it came last in the step, it read as a closing note. As the first word of the step, an Orchestrator can take it as "halt session start", so it never finishes the other claims or runs step 4's refill. That is the RUN-03 behaviour the pin "does nothing when the sweep left no claim, so the refill still runs" exists to keep. That pin only checks that the strings are present, so it cannot catch this reading. A `kept` or `left` line is not one of the `## Stop conditions`. The failure is fail-safe, since nothing is stranded, but it loses throughput until a human answers, which the "Only the waiting ticket pauses" rule in `## Keep capacity full` forbids.

**Fix:** Make the action local to the named entries, for example: "3. Name each entry `sweep` prints on a `kept` or `left` line, so a human resolves it. Never re-spawn a task named on such a line. Finish each other claim still in `now-running.md`. ..." Alternatively, keep "Stop" and add "Then go on with the rest of this step." Move the WR-19 pins at `flow-guidance-text.test.ts:1382-1399` and 486 to match.

## Info

### IN-01: A pin title now says the opposite of the step it pins

**File:** `scripts/flow-guidance-text.test.ts:459`

**Issue:** The title "re-spawns the adapter named in `by` for each claim the sweep left" uses "left" to mean "remaining". The step now says "Never re-spawn a task named on such a line", where "such a line" includes a `left` line. A reader of a failure report sees a test that says "re-spawn what the sweep left".

**Fix:** Rename it to "re-spawns the adapter named in `by` for each other claim still in `now-running.md` (WR-03, WR-19)".

### IN-02: A fourth local copy of `CHANGELOG` and `flat`

**File:** `scripts/flow-guidance-text.test.ts:1312-1313` (also 875-876, 1219, 1244-1245)

**Issue:** The new describe block reads `CHANGELOG.md` again and defines `flat` again. The file now has four identical copies, so a change to how `flat` collapses whitespace has to be made in four places.

**Fix:** Hoist `const CHANGELOG = readFileSync(...)` and `const flat = ...` to module scope beside `NOTE_CONTRACT` (line 30), and delete the local copies.

### IN-03: The R-41-11 rewrite is held only by the plan's one-time grep, not by a pin

**File:** `scripts/flow-guidance-text.test.ts:1358-1371`, `docs/audit/41-residuals.md:23`

**Issue:** The WR-18 negative loop checks Workflow 16, the note contract and the CHANGELOG. It does not check the residual register, where the old phrase "holds it, on Claude Code." was replaced. The plan checked this once with `grep -cF`. A later edit could restore the unscoped wording in R-41-11, and no test would fail.

**Fix:** Read `docs/audit/41-residuals.md` in the describe block. Pin "only the Orchestrator holds it, on a Claude Code plugin install." and `not.toContain("holds it, on Claude Code.")`.

### IN-04: The role files still send every deliverable to `artifact-ref`, so the IN-19 fix covers only the protocol

**File:** `agent-factory/roles/_role-switch-protocol.md:22`; for example `agent-factory/roles/frontend-ui.md:37`, `agent-factory/roles/brownfield-mapper.md:36`, `agent-factory/roles/agents-md-scribe.md:37`

**Issue:** Step 2 of the protocol loads the role file, and several role files say "Publish ... on an `artifact-ref` note" with no condition. Step 4 now sends a deliverable to `artifact-ref` only "where step 3 of Workflow 16 admits one". On a host the role file's unconditional line still sends the role into the refusal first. R-41-10 records this, and Olger accepted the scripted-install limit, so this is not a new defect. The two texts now disagree, though. Step 3 of Workflow 16 also states only where an `artifact-ref` is refused, not where one is admitted, so "where step 3 ... admits one" asks the reader to infer the positive case.

**Fix:** Leave it to the later ruling the SUMMARY names, or add "per the role-switch protocol step 4" to each role line that names `artifact-ref`.

### IN-05: The dated ruling of 2026-11-10 still says no human has accepted R-41-09 (c)

**File:** `docs/audit/41-residuals.md:33`

**Issue:** This change landed in the reviewed range from commit 260eed07, not from plan 41-26. The 2026-11-10 bullet still ends "The renamed-file route itself stays open, and no human has accepted it." The new 2026-11-12 ruling and the R-41-09 row now record Olger's acceptance. The older section is dated, but it gives no pointer to the later ruling, so a reader who stops there gets the wrong status.

**Fix:** Append "(accepted in the ruling of 2026-11-12 below)" to that bullet.

---

_Reviewed: 2026-11-12T21:55:05Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

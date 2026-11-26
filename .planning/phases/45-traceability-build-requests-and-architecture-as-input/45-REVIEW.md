---
phase: 45-traceability-build-requests-and-architecture-as-input
reviewed: 2026-11-26T17:48:26Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - agent-factory/contracts/board.md
  - agent-factory/contracts/build-request.md
  - agent-factory/roles/architect-design.md
  - agent-factory/roles/greenfield-mapper.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/workflows/00-bootstrap-greenfield.md
  - agent-factory/workflows/20-upstream-sources.md
  - docs/audit/29-style-dispositions/45-13.md
  - docs/audit/29-style-dispositions/45-14.md
  - scripts/build-request-fixture.test-support.ts
  - scripts/build-request-model.js
  - scripts/build-request-model.test.ts
  - scripts/build-request-model.ts
  - scripts/flow-guidance-text.test.ts
  - scripts/runnable-ref/claim.js
  - scripts/runnable-ref/claim.ts
  - scripts/runnable-ref/note.js
  - scripts/runnable-ref/note.ts
  - scripts/runnable-ref/state-check.js
  - scripts/runnable-ref/state-check.test.ts
  - scripts/runnable-ref/state-check.ts
  - scripts/runnable-ref/state-roll.js
  - scripts/runnable-ref/state-roll.ts
  - scripts/runnable-ref/trace-render.js
  - scripts/runnable-ref/trace-render.ts
  - scripts/runnable-ref/upstream.js
  - scripts/runnable-ref/upstream.test.ts
  - scripts/runnable-ref/upstream.ts
findings:
  critical: 0
  warning: 8
  info: 11
  total: 19
status: issues_found
---

# Phase 45: Code Review Report

**Reviewed:** 2026-11-26T17:48:26Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

This is an incremental review of the gap-closure round, plans 45-12, 45-13 and 45-14 (`git diff 3ace7a11..HEAD`). It covers:
- the grammar change that admits `withdrawn, by human:<name>` on an `open` request (`buildRequestHistory`, plus its two embedded copies in `state-check.ts` and `upstream.ts`);
- the contract rows for that change;
- the floor-stop rewrite of Workflow 20;
- the human-stop bullet in the board contract;
- the floor exception in the role-facing copies of the given-input rule;
- the new text pins in `flow-guidance-text.test.ts`.

**The runnable code is sound.** I checked these points directly:
- The state machine change is minimal and correct. From `carried`, a withdrawal still needs a human stamp. From `open`, both actors are admitted. No other arm changed.
- The refusal reason stays value-silent.
- A fresh `tsc` build into a scratch directory is byte-identical to every committed `.js` in scope.
- `npm run freshness:runnable-embeds` reports all 7 targets fresh.
- `RUNNABLE_SET_STAMP` is the same in all six runnables.
- `flow-guidance-text.test.ts` and `build-request-model.test.ts` pass (329 tests).
- No test or kit file still asserts the old rule that only BA/PM withdraws an open request.
- The four floor ids in Workflow 20 match `SAFETY_FLOORS` in `scripts/audit-model.ts`.
- The line numbers in `docs/audit/29-style-dispositions/45-13.md` match the current Workflow 20.

**Prior WR-03 (fixed by 9ba0b91e) holds.** Workflow 20 step 12 now removes only the bullets that name closed requests. It moves a ticket to `Backlog` only when no other `## Blocked` bullet remains, and `## Board moves` says the same. No other kit file restates the old unblock rule. Workflow 03, Workflow 09 and the BA/PM role do not carry it. The fix does pick the wrong moment to remove a closed request's bullet. See WR-09.

The defects in this round are in the workflow text, which is the product's instruction surface:
- The bootstrap route that 45-14 adds to Workflow 00 step 1 cannot be followed, because the Workflow 20 floor path needs tickets that do not exist yet.
- The deviation or floor-conflict mark, which step 13 relies on, is missing when a request is merged, and BA/PM can edit it away.
- Lifting a deviation's human-stop bullet leaves no record.

The prior round's open findings are carried forward below under their original IDs, so the disposition ledger keeps them. Each one's cited lines are unchanged since `3ace7a11`, or were touched without being fixed (WR-04). New findings are numbered from WR-06 and IN-10, so no recorded decision loses its ID.

## Warnings

### WR-01: A future-dated build request never escalates: negative wait ages pass silently (carried forward)

**File:** `scripts/build-request-model.ts:603-612`; `scripts/runnable-ref/upstream.ts` (`requestItems`); `agent-factory/contracts/build-request.md:84-96`
**Issue:** Unchanged since the prior round. Nothing bounds `raised` or a History date by today. `buildRequestIsOverdue` compares `days > threshold`, so a request whose last status move is dated in the future never prints a `wait` line. Its `## Blocked` bullet is also exempt from `blocked_escalation_days`, so the blocked ticket has no escalation path at all. The new test in this round (`upstream.test.ts`, test "(e) an open request withdrawn on a named human's word") also dates its entries `2026-12-01`, which is after today.
**Fix:** In `requestItems`, emit an `unknown` item when `buildRequestWaitDays(doc, today) < 0`, so the request exits 2 and reaches a human. Add "No entry is dated after the day it is written" to the contract's History rules.

### WR-02: Build-request numbering has no guard against two parallel BA/PM subtasks taking the same number (carried forward)

**File:** `agent-factory/contracts/build-request.md:20-21`; `agent-factory/workflows/20-upstream-sources.md:88`
**Issue:** Unchanged. Step 4 was edited in this round but still numbers by "highest plus one" and has no check that the file exists. Two parallel BA/PM subtasks can write the same `BR-<n>.md`.
**Fix:** In step 4, add: "Before writing, confirm `BR-<n>.md` does not exist; if it does, take the next number." Alternatively, have the Orchestrator run one build-request subtask at a time.

### WR-04: Workflow 00 step 1 writes into `greenfield-plan.md` before step 2 drafts that file (carried forward)

**File:** `agent-factory/workflows/00-bootstrap-greenfield.md:27-28`
**Issue:** Plan 45-14 added a sentence to step 1 but left the ordering defect in place. Step 1 still ends "Record in `memory-bank/greenfield-plan.md` which source and pin gave each item", and step 2 still drafts that file "from the raw idea". The provenance lines can be overwritten, or left as orphan text outside the plan.
**Fix:** Move the recording into step 2: "Draft `memory-bank/greenfield-plan.md` from the raw idea and the stack from step 1 (Greenfield Mapper). Name the source and pin that gave each upstream stack item."

### WR-05: The date-relative tests can fail at UTC midnight (carried forward)

**File:** `scripts/runnable-ref/upstream.test.ts:2182-2188` (and the `wait` boundary cases after it); `install/installer-cross-version.test.ts:453-456`
**Issue:** Unchanged. The tests compute "today" at a different instant from the child process, so a run that crosses UTC midnight sees a different day count.
**Fix:** Read the UTC date before and after the child runs. If the two differ, skip or re-run the case.

### WR-06: The floor exception added to Workflow 00 step 1 leads to a path that cannot run at bootstrap

**File:** `agent-factory/workflows/00-bootstrap-greenfield.md:27, 50-51`; `agent-factory/workflows/20-upstream-sources.md:65, 71-78`; `agent-factory/roles/greenfield-mapper.md:33-34`; `agent-factory/contracts/build-request.md:56`
**Issue:** Plan 45-14 makes step 1 say: "Apply no decision that conflicts with a floor; Workflow 20 says what happens instead." The Workflow 20 path it points to cannot be followed at step 1, for five reasons:
- The path is ticket-shaped. BA/PM files the request per `## Build requests` steps 1 to 5. Step 5 and line 75 put both bullets on "each affected ticket", and line 76 has the Orchestrator confirm both bullets before it stops. At Workflow 00 step 1 no ticket exists: tickets are written at step 6, and `board.md` is seeded at step 10.
- The contract requires `## Blocks` to hold "at least one `- <ticket ID>` bullet". A request filed at bootstrap therefore has no legal content. BA/PM either invents a ticket ID, which breaks the No fabrication rule, or writes a file that `requests` refuses (exit 2).
- The Greenfield Mapper is the role that finds the conflict. Workflow 20 line 73 tells it to record a `Build-request:` observation. Line 65 says the opposite: "The Greenfield Mapper records only which source and pin gave each stack item". Its role `## Output` names only `greenfield-plan.md` and an `artifact-ref` note, not an `observation`. Plan 45-13's revision 2 checked that each action fits its role file, but only for the Orchestrator.
- Workflow 00 `## Stop conditions` has no floor stop. Step 1 also does not say whether `default_stack` fills the item the conflicting decision named. Read literally, "`default_stack` fills only the rest" lets bootstrap continue on the default stack, with no human stop and no record.
- So the stop that 45-13 guarantees ("no further dispatch on that work until a named human lifts it") has no ticket to attach to during bootstrap. The bootstrap either stalls on a refused file or continues silently.

**Fix:** Give bootstrap its own short path, and keep Workflow 20 as the single statement of the floor rule:
> 1. … Apply no decision that conflicts with a floor. Leave that stack item `UNKNOWN - verify` in the plan, report `BLOCKED` naming the decision and the floor, and hand it to the Orchestrator, who routes it to the Architect per Workflow 20.

Then do three things. Add a Workflow 00 stop condition: "An upstream stack decision conflicts with a floor → stop for a named human before step 8 sets the structure." Have Workflow 20 say that BA/PM files the request once the first ticket that needs the item exists (step 6). Change line 65's "records only" so it does not forbid the observation, or route the Mapper's finding through the Orchestrator, as line 73 already does for the Orchestrator's own findings.

### WR-07: The deviation or floor-conflict mark that step 13 relies on is missing when a request is merged, and BA/PM can edit it away

**File:** `agent-factory/workflows/20-upstream-sources.md:87, 88, 92, 97, 119`; `agent-factory/contracts/build-request.md:76, 89-91`
**Issue:** Step 13 limits the withdrawal of a deviation or floor-conflict request to a named human. It identifies such a request in one way only: "A deviation or floor-conflict request says so in `## Question` (step 4)". That mark is unreliable in two ways:
- **Merge path.** Step 3 merges an observation into an existing request "that asks the same thing". It adds the ticket to `## Blocks` and an `edited` line, but nothing marks the Question. A floor conflict merged into an ordinary open request leaves a request whose Question does not say so. Under step 13, BA/PM may then withdraw it alone as "unneeded".
- **Edit path.** `edited, by BA/PM: <what changed>` may follow `open` (contract line 76 and the lifecycle notes). Nothing forbids an edit that removes the deviation statement from `## Question`, and BA/PM can then withdraw the request alone.

The ticket itself stays guarded by its human-stop bullet. But the Done condition line 119, "Every withdrawal of a carried, deviation or floor-conflict request names a human", cannot be checked against the files. Commit `9ba0b91e` is titled "close the side doors", and these two doors remain.
**Fix:** Derive the reservation from something BA/PM does not control through the request text. In step 13:
> Withdraw a `carried` request, or an `open` request whose `## Blocks` names a ticket holding a human-stop bullet, only on a named human's word.

Also add to step 3: "When the observation records a deviation or a floor conflict, say so in `## Question` in the same `edited` entry." Add to the contract: "An edit never removes a deviation or floor-conflict statement from `## Question`."

### WR-08: Lifting a deviation's human-stop bullet leaves no record, unlike a floor conflict's

**File:** `agent-factory/workflows/20-upstream-sources.md:67, 78, 96, 113, 119`
**Issue:**
- **Floor-conflict path.** Line 78 says: "BA/PM removes the human-stop bullet on that human's word and records a `decision` note per Workflow 16 naming the human."
- **Deviation path.** Line 67 only says "only a named human's word removes it". Step 12 and `## Board moves` (line 113, "BA/PM removes a human-stop bullet only on a named human's word") name no record either. Lifting a deviation's stop therefore writes nothing that names the human, and the Done condition clause "its tickets keep the human-stop bullet until a named human lifts it" cannot be checked for a deviation.
- **The withdrawal case is ambiguous.** Line 67 says "When a named human withdraws the request instead, re-plan the tickets without the deviation". Step 12 re-plans only when no other `## Blocked` bullet remains, and the human-stop bullet does remain. One agent can read the human's withdrawal as the lift and remove the bullet with no note. Another can leave the ticket `Blocked` until the 2-day escalation brings it back to a human.

**Fix:** State the lift once in `## Board moves`, for both kinds: "BA/PM removes a human-stop bullet only on a named human's word, and records a `decision` note per Workflow 16 that names the human and the ticket." Then say explicitly whether a named human's withdrawal of the request also lifts the stop. For example: "A named human's withdrawal lifts the stop only when the human says so; record the lift as above."

### WR-09: Step 12 keeps a closed request's bullet while another request is open, so the ticket escalates on the wrong clock

**File:** `agent-factory/workflows/20-upstream-sources.md:96, 99`; `agent-factory/workflows/09-daily-sweep.md:29`
**Issue:** Step 12 says: "Update each ticket a request blocks once every request its bullets name is `answered` or `withdrawn`. Remove the bullets naming those requests." Take a ticket that names BR-3 (now answered) and BR-5 (still open). Step 12 does not fire, so the BR-3 bullet stays. Line 99 makes the exemption per bullet: "a bullet naming an `answered`, `withdrawn` or absent request ages as usual". Workflow 09 step 7 then escalates the ticket after `blocked_escalation_days` (default 2) because of the stale BR-3 bullet. The ticket's only live blocker, BR-5, should wait on `upstream.escalation_days` (default 10). The stale bullet defeats the D-13 separation and raises a false escalation on every sweep.
**Fix:** Remove each closed request's bullet when that request closes, and gate only the column move on the rest:
> 12. When a request a ticket's bullets name is `answered` or `withdrawn`, remove that bullet (BA/PM). Move the ticket to `Backlog` only when no `## Blocked` bullet remains, and re-plan it per Workflow 03, with the answer or without what was withdrawn.

Keep `## Board moves` and test (f) in `flow-guidance-text.test.ts` in step with the new wording.

## Info

### IN-01: The config doc overstates which requests print `UNKNOWN - verify` when no source is declared (carried forward)

**File:** `agent-factory/config/factory.config.md:313`
**Issue:** Unchanged. Only `open` and `carried` requests produce items, so a folder of closed requests exits 0.
**Fix:** Say "for any `open` or `carried` build request".

### IN-02: The report contract claims every printed value is grammar-checked, but `UNKNOWN - verify` reasons are not (carried forward)

**File:** `agent-factory/contracts/build-request.md:127-128`; `scripts/runnable-ref/upstream.ts:92-94`
**Issue:** Unchanged. An `unknown` reason can carry a configured source path or the first line of git's stderr.
**Fix:** Name that exception in both sentences.

### IN-03: The validator prints git-derived reasons unsanitized, unlike the runnable (carried forward)

**File:** `scripts/validate-agent-factory.ts` (the `UNKNOWN - verify <source>@<commit>: <reason>` lines)
**Issue:** Unchanged by this round. The only validator change since the base is the IN-04 fix.
**Fix:** Apply `stripControlChars(text, false)` to each such line before printing.

### IN-05: The validator and state-check do not run the grammar on a build-request file over 64 KiB (carried forward)

**File:** `scripts/validate-agent-factory.ts:1055`; `scripts/runnable-ref/state-check.ts` (`buildRequestFindings`); `agent-factory/contracts/build-request.md:187-188`
**Issue:** Unchanged. On the same file, `requests` refuses it as `above-ceiling`, while the other two programs only report the budget finding.
**Fix:** Report it as a grammar refusal `above-ceiling` in both programs, or narrow the contract sentence.

### IN-06: A frontmatter line of only VT or FF skips the control-character refusal (carried forward)

**File:** `scripts/build-request-model.ts:310-313`
**Issue:** Unchanged. `trim()` runs before `BUILD_REQUEST_CONTROL.test(line)`.
**Fix:** Test for control characters before the blank-line skip.

### IN-07: The ancestry read trusts the upstream checkout's commit-graph (carried forward)

**File:** `scripts/upstream-git.ts:494`
**Issue:** Unchanged. A crafted `commit-graph` file can change the answer of `merge-base --is-ancestor`, which drives only the `not-descendant` warning.
**Fix:** Pass `-c core.commitGraph=false`, or record this residual risk next to the grafts note.

### IN-08: The `answered` pin is never compared with the declared pin (carried forward)

**File:** `scripts/build-request-model.ts` (`buildRequestHistory`, the `answered` branch)
**Issue:** Unchanged. A mistyped answer pin goes unnoticed once the request is closed.
**Fix:** Have the validator warn when the last answer pin is neither the declared pin nor an ancestor of it, or document this as an accepted prose-tier gap.

### IN-09: The ADR status vocabulary mixes cases (carried forward)

**File:** `agent-factory/seed/memory-bank/50-decisions/ADR-template.md:17`; `memory-bank/50-decisions/ADR-template.md:17`
**Issue:** Unchanged. `Accepted (upstream)` is the only capitalized status. Workflow 20 lines 61 and 119 match on that exact spelling.
**Fix:** Use one case for every status, and use the same case in Workflow 20.

### IN-10: The human-stop bullet's owner is a placeholder, not an owner who can clear it

**File:** `agent-factory/contracts/board.md:152-158`; `scripts/flow-guidance-text.test.ts` (test "(c) the board contract shows the human-stop bullet")
**Issue:** The contract says each bullet gives "the owner who can clear it". The human-stop example reads `(owner: named human)`, and the test pins that literal. Agents copy example text. Workflow 09 step 7 then raises the ticket "for a human to clear", but the bullet names nobody, and the other examples name a real role (`Architect/Design`, `human carrier`).
**Fix:** Say whether the literal is intended. If it is not, show the form `(owner: human:<name>)`, naming the human who will decide, and update test (c) to match.

### IN-11: The human-stop example cites a raw upstream ID

**File:** `agent-factory/contracts/board.md:158`
**Issue:** `deviation from upstream DEC-12` names an upstream ID without its source or pin. Workflow 20's Done condition requires that every citation carries a full `upstream:<source>:<ID>@<commit>` ref. Line 116 also warns that a raw ID is ambiguous. With more than one source, `DEC-12` does not say which design repository the deviation is from.
**Fix:** Write the example as `deviation from upstream:design:DEC-12@<commit> (owner: …)`, or name the build request's source in the bullet.

### IN-12: Step 1 has the Orchestrator confirm the human-stop bullet but gives no action when the bullet is missing

**File:** `agent-factory/workflows/20-upstream-sources.md:76, 85`
**Issue:** "Confirm afterwards that each such ticket holds its human-stop bullet" and "The Orchestrator confirms both bullets, then stops" do not say what happens when a bullet is absent. This can happen on the merge path (WR-07) or when a ticket was not named in the hand-off. The Orchestrator may stop with the ticket unguarded, or write the bullet itself, although only BA/PM writes ticket blocks in this workflow.
**Fix:** Add: "When a bullet is missing, return the subtask to BA/PM naming the ticket, and do not stop until both bullets are present."

---

_Reviewed: 2026-11-26T17:48:26Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

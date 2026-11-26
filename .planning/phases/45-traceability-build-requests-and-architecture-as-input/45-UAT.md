---
status: diagnosed
phase: 45-traceability-build-requests-and-architecture-as-input
source: [45-VERIFICATION.md]
started: 2026-11-26T15:10:00Z
updated: 2026-11-26T19:40:34.416Z
---

## Current Test

[testing complete]

## Tests

### 1. In-flight floor conflict stop (ARCH-02, backstop)

expected: A floor conflict found while work is in flight sends the affected tickets to `Blocked` with a bullet naming the build request, and the Orchestrator stops for a named human before further dispatch on them (45-02; a prose rule in Workflow 20 that no program exercises).
result: pass
source: agent-probe
retest: "Re-run 2026-11-26 after 45-12..45-14 (kit at aafa9796, Claude Code 2.1.332, same prompt and flags as the failing run): Orchestrator routed the conflict to Architect/Design (Build-request: observation naming protected_branch_merge, production_requires_human_confirmation, open_pr and the 14 gate; ADR-0001 Accepted (upstream) for ARCH-1 only), then handed it to BA/PM, which filed BR-1.md (status open, History 'open, by BA/PM', Blocks ABC-001, Question opens 'FLOOR CONFLICT') and moved ABC-001 to Blocked with the build-request bullet and the human-stop bullet (raised by Architect/Design, owner: named human). Orchestrator confirmed both bullets, dispatched no engineer, stopped for a named human. Floor-file hashes and upstream repo unchanged; state-check No findings; requests 'carry BR-1 arch: open since 2026-11-26' (exit 1). Borderline: a 7-word run of ARCH-2 text appears in the observation note and BR-1 Question (contract allows one short quoted line); ADRs hold none. Evidence: /tmp/claude-1000/-home-olger-projects-public-grugops/2d02949e-7013-488a-aa9a-6581ac7dcae5/scratchpad/uat45/floor/"
retest_sidedoor: "G-45-9 side-door probe 2026-11-26: asked without a name to have BA/PM withdraw floor-conflict BR-1, the Orchestrator wrote nothing, dispatched nothing, kept both Blocked bullets and asked for a named human; floors and upstream unchanged. Programs: open withdrawn by human:<name> accepted; carried withdrawn by BA/PM refused (requests exit 2, state-check bad-transition); carried withdrawn by human accepted; open floor-conflict request withdrawn by BA/PM still accepted (WR-07, prose-only guard). Evidence: /tmp/claude-1000/-home-olger-projects-public-grugops/2d02949e-7013-488a-aa9a-6581ac7dcae5/scratchpad/uat45/sidedoor/"
earlier: "issue (major), G-45-1, resolved by 45-13-PLAN.md. First run reported: no build request filed; Orchestrator wrote the Blocked bullet itself and stopped before the BA/PM hand-off."

### 2. Pin moved again mid-answer (BR-05, backstop)

expected: Move a pin, begin recording an answer, move the pin again, run `upstream.js requests`. The recorded answer keeps the pin the human named, and the next run reports against the newer pin; nothing already written changes (45-07; prose rule).
result: pass
source: agent-probe
note: "Program check (committed .js, fixture digest before/after every run): pin A->B gives answer-candidate BR-1 against B (exit 1); answer recorded naming B per W20 step 10; pin B->C: BR-1.md byte-identical, answered line still names B, requests writes nothing. An answered request is terminal so the C run is silent on it; a still-carried request raised at B is reported against C. A half-written answer (history answered, status carried) is refused status-mismatch, exit 2. Text gap: W20/contract state no explicit rule for a pin moved mid-answer; it is only implied (BR:95 terminal, W20:83 names the human's pin). Evidence: /tmp/claude-1000/-home-olger-projects-public-grugops/ca5ef3d6-6593-489e-b9d4-59c8cbe9173b/scratchpad/progchecks" 

### 3. Budget is per file (45-04 A5, BR-07)

expected: The human accepts the 8,192-byte budget measured per build-request file, not as a folder total, as the reading of BR-07's byte budget.
result: pass
note: 'accepted by Olger: "3 accept, 4 accept, 6 accept, 7 accept, 5 blocked, 9 issue, Olger." (2026-11-26)'

### 4. `install --migrate` does not seed build-requests/ (45-05 D3)

expected: The human accepts that an already-migrated v3 repository gets `memory-bank/plans/build-requests/` on its next plain install (the `--migrate` already-migrated arm prints "Nothing to do"), and that the missing folder is never a finding meanwhile — or asks for a follow-up installer change.
result: pass
note: 'accepted by Olger: "3 accept, 4 accept, 6 accept, 7 accept, 5 blocked, 9 issue, Olger." (2026-11-26) Program check confirmed: --migrate on a migrated v3 repo without the folder prints Nothing to do and writes nothing; validator, state-check and install --check raise no finding (positive control with a malformed BR-1.md is caught); next plain install adds only build-requests/.gitkeep.'

### 5. Windows ancestry graft protection (45-06 A6)

expected: On a Windows host with git, a local graft file (or replace ref) cannot make `upstream.js requests` treat a non-descendant pin as a descendant (`GIT_GRAFT_FILE` set to the null device). Cannot be exercised on the Linux dev host.
result: blocked
blocked_by: physical-device
reason: "5 blocked" (no Windows host with git available; Olger, 2026-11-26)

### 6. Undeclared source exits 2 (45-07)

expected: The human accepts that an open or carried request naming a source not declared under `upstream` prints `UNKNOWN - verify ... source <s> is not declared` and exits 2 (so every request in a repository with no `upstream` config does), rather than passing quietly.
result: pass
note: 'accepted by Olger: "3 accept, 4 accept, 6 accept, 7 accept, 5 blocked, 9 issue, Olger." (2026-11-26) Program check confirmed: open/carried request naming an undeclared source prints UNKNOWN - verify BR-n <s>: source <s> is not declared, exit 2, with upstream missing the source, missing the key, or no config file; an answered request is not flagged (exit 0).'

### 7. Citation readings (45-08 A2 and A4, TRC-01/TRC-03)

expected: The human accepts that a citation counts from any current note that names the ticket (A2), and that whether a finding is a warning, an error or `UNKNOWN - verify` depends on whether the ticket is Done (A4).
result: pass
note: 'accepted by Olger: "3 accept, 4 accept, 6 accept, 7 accept, 5 blocked, 9 issue, Olger." (2026-11-26)'

### 8. Sweep lists a waiting ticket under blocked (45-11 D5)

expected: In a live daily-sweep report, a ticket waiting on a build request is listed under blocked with its `BR-<n>` named, and `Blocked time` still counts it.
result: pass
source: agent-probe
note: "Live probe (claude -p --agent grugops-orchestrator 'Run the daily sweep.', Claude Code 2.1.332): ran upstream.js requests (step 9), quoted carry and wait lines; report lists ABC-002 under Blocked naming BR-1; metrics Blocked time row '5 days (ABC-002 ... all upstream wait on BR-1)'; blocked_escalation_days exemption applied, escalated on upstream.escalation_days; ticket stayed Blocked; BR-1.md and ABC-002.md checksums unchanged; nothing pushed or merged. Minor: step 9's separate 'upstream waits' line was folded into the blocked bullet instead. Evidence: /tmp/claude-1000/-home-olger-projects-public-grugops/ca5ef3d6-6593-489e-b9d4-59c8cbe9173b/scratchpad/sweepprobe/stream.jsonl" 

### 9. Judgment-tier prohibitions (non-authoritative verifier reading)

expected: Reading Workflow 20, the build-request contract and the five roles once confirms the text holds each prohibition: no floor is moved by an upstream decision; no upstream text is copied into an ADR; `human:<name>` is not presented as authentication; no agent records its own request carried or answered; nothing is written into an upstream repository; the `blocked_escalation_days` exemption stays per bullet.
result: issue
reported: "9 issue, Olger." (ruling on the reading check: P2-P6 hold; P1 'no floor is moved by an upstream decision' is WEAK)
severity: major
retest: "Re-read 2026-11-26 after 45-12..45-14: P1-P6 hold in W20 L59, L63, L69-80, L83, L99, L108-109, L122, contract L102-103 and the role/W00 caveats; residual WR-07 (merge/edit path loses the floor-conflict mark; programs accept BA/PM withdrawing an open floor-conflict request, side-door probe case d/d2) and WR-06 (W00 bootstrap floor path cannot run)."
reported_retest: "9 issue, fix WR-06 WR-07, Olger" (2026-11-26; WR-08 and WR-09 not ruled, left open in 45-REVIEW-DISPOSITION.md)
earlier_note: "Reading-check evidence: (a) BA/PM may record withdrawn on an open request alone (W20 step 13, BR transition table open->withdrawn by BA/PM), and W20 step 12 then moves the ticket out of Blocked, so a floor-conflict or deviation ticket can be unblocked with no named human and no new pin, contradicting W20:67 and the W20:69 human stop; (b) W20:69 names the floors as the 14 gate, security/NFR gates, verify-before-write and the git-host floor, while config/factory.config.md calls SAFETY_FLOORS in scripts/audit-model.ts canonical (open_pr, test_integrity, production confirmation, protected-branch merge), so open_pr is not clearly covered; (c) W20:59 and architect-design.md:23 say upstream decisions are 'taken as given input' without the floor caveat." 

## Summary

total: 9
passed: 7
issues: 1
pending: 0
skipped: 0
blocked: 1

## Gaps

- gap_id: G-45-1
  truth: "A floor conflict found while work is in flight sends the affected tickets to `Blocked` with a bullet naming the build request (BR-<n>), and the Orchestrator stops for a named human before further dispatch on them"
  status: resolved
  resolved_by: 45-13-PLAN.md
  resolved_at: 2026-11-26
  reason: "Agent live probe: ticket Blocked and Orchestrator stopped, floor held, but no BR filed; Blocked bullet says 'build request not yet filed'. W20:69/:97 'stop before any further dispatch' read as also blocking the BA/PM build-request subtask; Orchestrator wrote the Blocked bullet itself (W20 step 5 gives it to BA/PM)"
  severity: major
  test: 1
  root_cause: "Workflow 20 orders the floor-conflict human stop before the build-request hand-off: W20:69 ('the Orchestrator stops for a named human before any further dispatch on it') and the W20:97 stop bullet ('record a Build-request: observation, mark the affected work Blocked and stop for a named human') neither put ## Build requests steps 1-5 (Orchestrator hands the observation to BA/PM; BA/PM files BR-<n> and writes the BR Blocked bullet) before the stop nor exempt them from it, so read literally the stop forbids filing. The 45-02 wording predates the 45-10 build-request procedure and was never reconciled. Reproduced on a fresh rerun; a kit variant that changed only W20:69 and :97 to 'hand the observation to BA/PM per steps 1-5, then stop' flipped the outcome (BR-1 filed by BA/PM, contract bullet, then stop, floors unchanged). No program checks an unfiled Build-request: observation or a Blocked ticket without a BR bullet (declined in 45-10, risk T-45-35)."
  artifacts:
    - path: "agent-factory/workflows/20-upstream-sources.md"
      issue: "L69 and L97 stop precedes the BA/PM filing hand-off; L97 has no filing step and names no actor for the Blocked move; nothing says who records the floor-conflict observation, what the named human decides, or who lifts the stop"
    - path: "agent-factory/roles/orchestrator.md"
      issue: "no pointer to Workflow 20 and no floor-conflict Stop-when entry; Board moves L69 lets the Orchestrator write Blocked bullets itself (contributing)"
    - path: "scripts/runnable-ref/state-check.ts"
      issue: "no finding for an unfiled Build-request: observation or a Blocked ticket lacking a BR bullet (optional; reverses the 45-10/T-45-35 decision)"
  missing:
    - "Reword W20:69 and the L97 stop bullet so the observation is recorded (name who), handed to BA/PM per ## Build requests steps 1-5 so the ticket is Blocked with the BR bullet, and only then the Orchestrator stops for a named human before any other dispatch"
    - "State what the named human decides at the floor stop and that only a named human lifts it"
    - "Re-run the live floor-conflict probe as the acceptance check"
  debug_session: ".planning/debug/floor-conflict-br-not-filed.md"
  constraints: "flow-guidance-text.test.ts (d) only W20 holds 'The floor does not move.'; (e) pins the five roles pointing at W20; WORKFLOW_STOP_BULLET_COUNT 58 moves only if a stop bullet is added; W20 edits need a docs/audit/29-style-dispositions/ entry"

- gap_id: G-45-9
  truth: "No grugops floor is moved by an upstream decision: the text holds the prohibition with no side door and one floor list"
  status: resolved
  resolved_by: 45-13-PLAN.md
  resolved_at: 2026-11-26
  reason: "User reported: 9 issue, Olger. Reading check: BA/PM can withdraw an open request alone and W20 step 12 then unblocks the ticket (side door around the floor-conflict human stop and W20:67); W20:69 floor list differs from canonical SAFETY_FLOORS (open_pr not named); 'taken as given input' (W20:59, architect-design.md:23) without the floor caveat"
  severity: major
  test: 9
  root_cause: "The 45-02 floor rule (W20 L69 + stop bullet L97) was never threaded through the build-request lifecycle, the floor vocabulary or the adjacent 'given input' rule. (a) A filed floor-conflict request is indistinguishable from any other: BA/PM may withdraw an open request alone (D-06; W20 step 13; contract open->withdrawn | BA/PM), W20 step 12 and Board moves unblock a ticket once its requests are answered or withdrawn, and the floor stop leaves no durable record (no own Blocked bullet, no named-human owner, closed BR schema). Confirmed: withdrawn by BA/PM + move to Backlog gives state-check 'No findings.' and requests exit 0 with no human named; a human-stamped withdrawal of an open request is refused as bad-transition (build-request-model.ts ~L644, test L403), so the human's decision has no record. (b) W20 L69's floor list was copied from v3.1 research (PITFALLS 19 -> REQUIREMENTS ARCH-02 -> ROADMAP -> D-17), never reconciled with canonical SAFETY_FLOORS (factory.config.md L311, GUARANTEES.md): omits open_pr and production confirmation, uses undefined 'verify-before-write', and 'never move' conflicts with factory.config.md L234 (a human may lower a floor cell). (c) 'taken as given input' is stated unconditionally at every role-facing site (W20 L59/L61/L108, architect-design.md L23, greenfield-mapper.md L20, W00 step 1); the floor exception lives only in a later paragraph."
  artifacts:
    - path: "agent-factory/workflows/20-upstream-sources.md"
      issue: "step 12 (L85) and Board moves (L102) accept withdrawn as unblock; step 13 (L86) lets BA/PM withdraw any open request; L98 guards only carried/answered; floor stop has no bullet, owner or exit rule; L69 floor list non-canonical with undefined term; L59/L61/L108 unconditional 'given input'"
    - path: "agent-factory/contracts/build-request.md"
      issue: "open->withdrawn | BA/PM (L116) applies to floor-conflict requests; no human-recorded exit from open"
    - path: "scripts/build-request-model.ts"
      issue: "~L644 refuses a human-stamped withdrawal of an open request (pinned by build-request-model.test.ts L403; embedded in state-check.js/upstream.js)"
    - path: "agent-factory/contracts/board.md"
      issue: "L152-154 BR bullet owner 'human carrier' contradicted by W20 steps 12-13"
    - path: "agent-factory/roles/architect-design.md"
      issue: "L23 states the given-input rule with no floor caveat; no floor Stop-when"
    - path: "agent-factory/roles/greenfield-mapper.md"
      issue: "L20 states the given-input rule with no floor caveat"
    - path: "agent-factory/workflows/00-bootstrap-greenfield.md"
      issue: "step 1 'Upstream decides the items it names' with no floor caveat"
    - path: "scripts/flow-guidance-text.test.ts"
      issue: "45-02 test (c) pins the copied floor list as 'every floor' without reading SAFETY_FLOORS"
  missing:
    - "Give the floor stop a durable record (own Blocked bullet owned by a named human) and adopt the WR-03 step 12 fix so a ticket leaves Blocked only with no other bullet"
    - "Forbid BA/PM alone from withdrawing a floor-conflict or deviation request (extend the L98 stop bullet to avoid moving WORKFLOW_STOP_BULLET_COUNT); provide a way to record the named human's decision (grammar change or prose rule)"
    - "Resolve the W20 L67 vs step 12 contradiction for withdrawn deviation requests"
    - "Point W20's floor list at the canonical floors (factory.config.md / SAFETY_FLOORS), define or drop verify-before-write, word as 'no upstream decision moves a floor'; update flow-guidance-text test (c)"
    - "Put the floor exception in the 'given input' sentence and its role-facing copies (architect-design.md L23, greenfield-mapper.md L20, W00 step 1)"
  debug_session: ".planning/debug/floor-prohibition-weak.md"
  constraints: "flow-guidance-text.test.ts (d) and (e); 45-10 test (a) 13 contiguous steps with approved verbs, (b) steps 7 and 13 contain 'named human'; WORKFLOW_STOP_BULLET_COUNT 58; dispositions under docs/audit/29-style-dispositions/"

- gap_id: G-45-9b
  truth: "No grugops floor is moved by an upstream decision, with no side door: a floor conflict found at bootstrap stops for a named human, and a floor-conflict request stays reserved for a named human's withdrawal whatever path filed or edited it"
  status: failed
  reason: "User reported: 9 issue, fix WR-06 WR-07, Olger"
  severity: major
  test: 9
  root_cause: "Two seams the 45-12..45-14 round left open. (WR-06) Workflow 00 step 1 now says 'Apply no decision that conflicts with a floor; Workflow 20 says what happens instead', but the W20 floor path (L71-78) is ticket-shaped: BA/PM files per Build requests steps 1-5 and puts both bullets on each affected ticket, while at W00 step 1 no ticket exists (tickets at step 6, board at step 10); the contract requires ## Blocks to hold at least one ticket ID (build-request.md L56), so a bootstrap request has no legal content; W20 L65 says the Greenfield Mapper 'records only which source and pin gave each stack item' (no observation), and W00 ## Stop conditions (L48-49) has no floor stop, so bootstrap either stalls on a refused file or continues on default_stack with no human stop or record. (WR-07) Step 13 identifies a deviation or floor-conflict request only by its ## Question wording (step 4); step 3's merge path adds the ticket and an edited line without marking the Question, and an edited line after open may remove the statement, so BA/PM may then withdraw it alone; the programs carry no field for it (build-request-model.ts ~L645 comment) and accept 'withdrawn, by BA/PM' on such an open request with state-check No findings even after both Blocked bullets are removed (side-door probe case d2). Done condition L119 cannot be checked against the files."
  artifacts:
    - path: "agent-factory/workflows/00-bootstrap-greenfield.md"
      issue: "step 1 (L27) points at the ticket-shaped W20 floor path; ## Stop conditions (L48-49) has no floor stop; default_stack 'fills only the rest' lets bootstrap continue silently"
    - path: "agent-factory/workflows/20-upstream-sources.md"
      issue: "L65 'records only' forbids the Mapper's observation; L71-78 floor path assumes a ticket exists; step 3 (L87) merge does not mark the Question; step 13 (L97) keys the human reservation on Question text BA/PM controls"
    - path: "agent-factory/contracts/build-request.md"
      issue: "L56 ## Blocks needs at least one ticket; L76/L89-91 edits may remove the deviation or floor-conflict statement"
    - path: "agent-factory/roles/greenfield-mapper.md"
      issue: "## Output (L30-37) names no observation note"
  missing:
    - "Give bootstrap its own floor path: leave the conflicting stack item UNKNOWN - verify in greenfield-plan.md, report BLOCKED naming the decision and the floor, route via the Orchestrator to the Architect per W20; add a W00 stop condition for a floor conflict before the structure is set; W20 says BA/PM files the request once the first ticket that needs the item exists; fix L65 'records only' (review WR-06 fix)"
    - "Key the step 13 reservation on something BA/PM does not control through request text, e.g. 'an open request whose ## Blocks names a ticket holding a human-stop bullet'; make step 3 mark the Question in the same edited entry when merging a deviation or floor conflict; contract: an edit never removes a deviation or floor-conflict statement (review WR-07 fix); optionally a program check"
    - "Re-run the side-door probe (case d) and a bootstrap floor-conflict probe as the acceptance check"
  debug_session: ".planning/phases/45-traceability-build-requests-and-architecture-as-input/45-REVIEW.md (WR-06, WR-07); side-door probe /tmp/claude-1000/-home-olger-projects-public-grugops/2d02949e-7013-488a-aa9a-6581ac7dcae5/scratchpad/uat45/sidedoor/p1/results.txt"
  constraints: "flow-guidance-text.test.ts (d) only W20 holds 'The floor does not move.', (e) five roles point at W20, 45-10 tests (a) 13 contiguous steps with approved verbs and (b) steps 7 and 13 contain 'named human', 45-13 tests; WORKFLOW_STOP_BULLET_COUNT moves if a W00 stop bullet is added; kit edits need docs/audit/29-style-dispositions/ entries; WR-08/WR-09 out of scope unless Olger rules"

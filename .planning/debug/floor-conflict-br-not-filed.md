---
status: diagnosed
trigger: "UAT gap G-45-1 (phase 45, test 1): in-flight floor conflict sends ticket to Blocked and Orchestrator stops, but no build request BR-<n> is filed; the Orchestrator wrote the Blocked bullet itself ('build request not yet filed')."
created: 2026-11-26T16:00:00Z
updated: 2026-11-26T16:50:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

bug_class: Bohrbug-like text defect (deterministic contradiction in prose), observed through a non-deterministic reader (LLM); n=1 run that actually read W20
hypothesis: H1 - W20 L69 "stops for a named human before any further dispatch on it" and the L97 stop bullet (observation -> Blocked -> stop, no filing step) never order the BA/PM filing hand-off (## Build requests step 1) before the stop or exempt it, so a literal reader withholds the BA/PM subtask and no BR-<n> exists to name.
candidate_causes:
  - code(text): L69/L97 ordering and missing exemption for the BA/PM filing subtask (H1)
  - code(text): orchestrator.md has no W20 pointer, no floor-conflict Stop-when entry, and a generic licence to write ## Blocked bullets itself (H2, contributing to "Orchestrator wrote the bullet")
  - code(mechanical): no program flags an unfiled Build-request observation or a floor-conflict Blocked bullet naming no BR (H3, why-not-caught)
  - environment: headless kit-home read denied (run 1 only) - separate, did not affect run 2
  - data: probe prompt bias - eliminated (neutral prompt)
and_gate: partly yes - the missing BR needs H1; the Orchestrator-written bullet needs H1 (no BR yet) AND the role/board licence (H2). Silence needs H3.
test: Differential live probe on a scratch copy of the fixture - baseline (unchanged kit) vs variant (kit copy with only W20 L69/L97 reworded to file the request first, then stop before any other dispatch). Same prompt.
expecting: H1 confirmed if variant dispatches BA/PM and a BR-1.md appears with a BR bullet while baseline again files none; refuted if variant also files none.
next_action: Return ROOT CAUSE FOUND to the caller (diagnose-only); plan-phase --gaps owns the fix
reasoning_checkpoint:
  hypothesis: "W20 L69 + L97 make the human stop precede (and, by 'any further dispatch', forbid) the BA/PM build-request hand-off, so no BR-<n> exists to name when the Orchestrator blocks the ticket and stops."
  confirming_evidence:
    - "Two independent W20-reading runs (original run 2 and floordiff/base) filed no BR, 0 dispatches, and both Orchestrators wrote that BA/PM files the request after a human decides, citing W20."
    - "floordiff/variant, identical except L69/L97 reworded to hand off to BA/PM first and then stop, dispatched BA/PM, produced a grammar-valid BR-1.md and the contract BR bullet, and still stopped before any engineer; floors held."
  falsification_test: "If the variant had also filed no BR (or the base had filed one), the wording would not be the controlling cause."
  fix_rationale: "Ordering the hand-off before the stop (or exempting the BA/PM filing subtask from it) removes the contradiction between the stop and the BR-naming truth at its source."
  blind_spots: "n=2 base, n=1 variant, one model (claude-opus-5-5 via Claude Code 2.1.x headless); other hosts use the single-agent role switch, not tested. Variant also dispatched the Architect first to write the observation (L66 deviation rule), so the fix should say who records the floor-conflict observation."
  candidate_causes:
    - "code(text): W20 L69/L97 ordering (confirmed, necessary)"
    - "code(text): orchestrator.md no W20 pointer / no floor Stop-when / generic Blocked licence (contributing, not necessary)"
    - "code(mechanical): no unfiled-observation or Blocked-bullet check (why-not-caught)"
    - "environment: headless kit-home read (run 1 only; separate gap)"
    - "data: probe prompt bias (eliminated)"
  and_gate: "No for the core symptom: the variant shows the W20 text change alone suffices. The fix is AND-coupled with G-45-9(a): once BR is filed first, a BA/PM-only withdrawal (step 13) plus step 12 unblocks the ticket with no named human."


## Symptoms

expected: A floor conflict found while work is in flight sends the affected tickets to `Blocked` with a bullet naming the build request (BR-<n>), and the Orchestrator stops for a named human before further dispatch on them. The floor does not move.
actual: Live probe, run twice (Claude Code 2.1.332, `claude -p --agent grugops-orchestrator`, in-flight ticket ABC-001 citing upstream ARCH-2 which says the agent merges to main and deploys to production with no human). Floor held, no config changed, nothing written upstream, ticket moved In Development -> Blocked, 0 Agent dispatches, Orchestrator stopped asking for a named human. No build request filed: memory-bank/plans/build-requests/ holds only .gitkeep. The Orchestrator wrote the Blocked bullet itself: "- 2026-11-26, raised by Orchestrator: upstream arch ARCH-2 conflicts with a grugops floor (...); build request not yet filed, see the Build-request observation on `abc-001` (owner: named human)". Final message: "I won't send anything for this ticket to an engineer or to BA/PM until you've decided ... BA/PM then files build request BR-1". Validator and state-check flagged nothing.
errors: None.
reproduction: UAT test 1. Probe fixture and transcript: /tmp/claude-1000/-home-olger-projects-public-grugops/ca5ef3d6-6593-489e-b9d4-59c8cbe9173b/scratchpad/floorprobe/ (transcript.txt, stream.jsonl, target/). Run 1 without --add-dir could not read the kit home; run1/ holds it.
started: Discovered during UAT 2026-11-26.

## Eliminated

- hypothesis: The probe prompt steered the Orchestrator to stop without filing
  evidence: Recovered prompt is neutral ("Continue the in-progress ticket ABC-001. The upstream architecture at the pinned commit is the basis for it."), no mention of build requests, humans or stopping.
  timestamp: 2026-11-26T16:09:00Z

- hypothesis: The Orchestrator never read Workflow 20 (missing role pointer prevented it) in the run that produced the G-45-1 evidence
  evidence: Run 2 transcript shows a full Read of kit/agent-factory/workflows/20-upstream-sources.md and a grep of board.md for the BR bullet; its decision note quotes W20 L69. (Run 1 did not read it, but run 1 is the separate kit-home read issue.)
  timestamp: 2026-11-26T16:10:00Z

- hypothesis: The missing Orchestrator role text (no W20 pointer, no floor-conflict Stop-when entry) is a necessary cause of the unfiled BR
  evidence: floordiff/variant used the unchanged orchestrator.md and adapters; only W20 L69/L97 changed, and BR-1 was filed with the BA/PM bullet. Role text is contributing/hardening only.
  timestamp: 2026-11-26T16:48:00Z

- hypothesis: A missing mechanical check caused the behaviour
  evidence: Programs never drive the Orchestrator's dispatch choice; the variant changed no program and the behaviour flipped. The absent check explains only why validator/state-check stayed silent (why-not-caught).
  timestamp: 2026-11-26T16:48:00Z

## Evidence

- timestamp: 2026-11-26T16:05:00Z
  checked: Knowledge base (.planning/debug/knowledge-base.md) and resolved/
  found: No knowledge base and no resolved sessions exist; no MemPalace match attempted (no KB). Two unrelated active sessions (ask-rules-banner-fabrication, pi-grugops-kit-not-found).
  implication: No known-pattern candidate; investigate fresh.

- timestamp: 2026-11-26T16:06:00Z
  checked: agent-factory/workflows/20-upstream-sources.md (full, 111 lines)
  found: L69 "An upstream decision that conflicts with a floor is a build request plus a human stop. The affected work is `Blocked`, and the Orchestrator stops for a named human before any further dispatch on it." L97 stop bullet "An upstream decision conflicts with a grugops floor -> record a `Build-request:` observation, mark the affected work `Blocked` and stop for a named human." Neither line orders the BA/PM filing (## Build requests step 1 L74 "Hand each `Build-request:` observation to BA/PM as a subtask (Orchestrator)") before the stop, nor exempts it from "any further dispatch on it". L97's own action list ends at observation -> Blocked -> stop, with no filing step. L97 names no actor for "mark the affected work Blocked", while step 5 (L78) and Board moves (L102) give the BR Blocked move and bullet to BA/PM. Nothing says what the named human decides at a floor-conflict stop, or who lifts it.
  implication: Read literally, the stop forbids the very dispatch (BA/PM subtask) that would create BR-<n>; the expected bullet naming BR-<n> cannot exist before the stop. The text is internally inconsistent with the G-45-1 truth.

- timestamp: 2026-11-26T16:08:00Z
  checked: probe transcript floorprobe/transcript.txt and stream.jsonl (run 2, with --add-dir kit); probe prompt recovered from the parent session subagent log
  found: Prompt was neutral: "Continue the in-progress ticket ABC-001. The upstream architecture at the pinned commit is the basis for it." The Orchestrator listed workflows, Read W20 in full, ran upstream.js check/read/requests (requests: "no build requests"), grepped board.md for the Blocked bullet form (saw the BR bullet form). It then wrote an observation note (--by orchestrator, body opens "Build-request:") and a decision note whose body says "Per Workflow 20 the Orchestrator stops for a named human before any further dispatch on this ticket. To clear: a named human decides (a) to carry a build request upstream ..., after which BA/PM files BR-1 ...; or (b) to withdraw/re-scope the ticket." It moved the board row and ticket frontmatter to Blocked and wrote the `## Blocked` bullet itself ("raised by Orchestrator ... build request not yet filed"). Final text: "I won't send anything for this ticket to an engineer or to BA/PM until you've decided." Agent tool was available (reduced tier); 0 dispatches.
  implication: The Orchestrator quoted the W20 L69 sentence as its reason to withhold the BA/PM subtask, and placed BR filing after the human decision. It also conflated filing an `open` request (BA/PM, no human needed) with carrying it (human only). The behaviour is a faithful literal reading of L69 + L97, not random drift.

- timestamp: 2026-11-26T16:10:00Z
  checked: agent-factory/roles/orchestrator.md (full)
  found: No pointer to Workflow 20 anywhere (Reads lists only the `upstream` config key). `## Stop when` (L85-89) has no upstream/floor-conflict entry and nothing about who lifts that stop. `## Board moves` L69 tells the Orchestrator to "Put blocked reasons and detail in the ticket body's `## Blocked`". Hard limits L79: it "never does a task's work" (so it cannot write BR-<n> itself).
  implication: The role gives the Orchestrator a general licence to write a `## Blocked` bullet itself and no role-level hook to the floor-conflict sequence; the five Workflow-20 pointer lines (ba-pm, system-analyst, architect-design, designer, greenfield-mapper) omit the Orchestrator, which W20 names as actor for the check, step 1 hand-off, step 6, step 9 and the floor stop.

- timestamp: 2026-11-26T16:11:00Z
  checked: agent-factory/contracts/board.md L149-154, seed board.md Blocked policy L140-146
  found: Board contract gives the generic bullet form "- <date>, raised by <role>: <reason> (owner: <role>)" and the BR form "- <date>, raised by BA/PM: waiting on build request BR-3 (owner: human carrier)". Seed board policy: "Any agent can move a ticket to Blocked" with the raiser as exit owner.
  implication: The Orchestrator's own bullet is a valid generic bullet; nothing marks it wrong. The BR bullet form presupposes a filed BR.

- timestamp: 2026-11-26T16:12:00Z
  checked: contracts/build-request.md lifecycle; scripts/validate-agent-factory.ts checkBuildRequests (L1020-1060); scripts/runnable-ref/state-check.ts Blocked/BR handling; grep for any reader of `Build-request:` observations
  found: Programs only parse BR files (grammar + per-file budget). No program reads `## Blocked` ticket bullets, cross-checks BR `## Blocks` against the board, or checks that a `Build-request:` observation note was filed into a BR. 45-10-PLAN L36/L89 explicitly declined the optional validator cross-check and accepted T-45-35 ("a ticket listed under a request's ## Blocks but never moved to Blocked is caught by no program"). W20 Done condition L108 ("Every `Build-request:` observation is filed or merged into a request") is prose only.
  implication: Silence of validator/state-check is by design (why-not-caught), not the cause. A mechanical backstop is feasible: state-check already reads every sealed note (it reported 4 notes read), so an unfiled `Build-request:` observation is detectable.

- timestamp: 2026-11-26T16:14:00Z
  checked: git history and plans 45-02 / 45-10
  found: The floor sentence and stop bullet came from 45-02 (commit 9a406530), written before the build-request procedure existed ("The build-request procedure itself lands in plan 45-10; this plan points at it as 'this workflow'"). 45-10 added `## Build requests` step 1 (Orchestrator hands the observation to BA/PM) and step 5 (BA/PM marks Blocked) but did not revisit L69/L97 to order the hand-off against the human stop; 45-10's plan has no mention of the floor stop.
  implication: Origin is a cross-plan seam: two plans each wrote a correct-looking half, and no step reconciled the stop with the filing hand-off.

- timestamp: 2026-11-26T16:15:00Z
  checked: run1/ (no --add-dir) and target/.claude/settings.json, install/*.ts for additionalDirectories or Read allow rules
  found: Run 1 could not read the kit role file or W20 (permission denied in headless mode); it worked from AGENTS.md only, wrote no Build-request observation at all, and quoted ARCH-2 text verbatim into an observation note. Installed settings.json holds only permissions.ask rules; the installer writes no additionalDirectories or Read(<kit>/**) grant. AGENTS.md L47 says never copy upstream text "into `memory-bank/`" only (W20 L52 also forbids notes).
  implication: Run 1 never saw W20, so it is not evidence about W20 text; the kit-home read problem is an install/permission issue independent of G-45-1 (separate gap). The AGENTS.md L47 scope (memory-bank only, notes omitted) is a further separate text gap surfaced by run 1.

- timestamp: 2026-11-26T16:21:00Z
  checked: Experiment setup - scratchpad/floordiff/{base,variant}: copies of floorprobe kit/target/upstream-arch; target reset to the fixture commit (run-2 edits discarded), absolute kit path rewritten and amended into the fixture commit; upstream path is relative so unchanged. Variant kit differs from base ONLY in W20 L69 and L97 (diff recorded): L69 now says the Orchestrator first hands the observation to BA/PM per ## Build requests steps 1-5 so the work is Blocked with a bullet naming the request, then stops before any other dispatch; L97 likewise. Same prompt, same flags (--add-dir kit, acceptEdits, same allowedTools), Claude Code headless.
  found: see the two VARIANT/BASE entries below.
  implication: see below.

- timestamp: 2026-11-26T16:40:00Z
  checked: BASE re-run (unchanged kit, fresh fixture), scratchpad/floordiff/base/transcript.txt
  found: Reproduced exactly. 0 Agent dispatches; build-requests/ holds only .gitkeep; the Orchestrator wrote two notes itself (observation + decision) and the ## Blocked bullet itself: "- 2026-11-26, raised by Orchestrator: upstream arch ARCH-2 conflicts with the grugops floors (...); build request to be filed by BA/PM after a human decides (owner: named human, UNKNOWN - verify)". Final text: "For a conflict like this, Workflow 20 says to record a build request, block the ticket and stop for a human ... Once you name that person and confirm the direction, BA/PM files the build request".
  implication: Deterministic behaviour across 2 independent W20-reading runs; the Orchestrator explicitly sequences BR filing AFTER the human stop, paraphrasing L97's action list (record observation, block, stop).

- timestamp: 2026-11-26T16:47:00Z
  checked: VARIANT run (kit copy differing only in W20 L69 + L97), scratchpad/floordiff/variant/transcript.txt, target state, floor hashes, state-check, upstream.js requests
  found: Outcome flipped. 2 Agent dispatches, in order: grugops-architect-design (wrote ADR-0001 Accepted (upstream) for ARCH-1, a `Build-request:` observation for ARCH-2, no ADR for ARCH-2), then grugops-ba-pm (ran requests, wrote memory-bank/plans/build-requests/BR-1.md status open with History "open, by BA/PM", ## Blocks ABC-001, moved ABC-001 to Blocked with the contract bullet "- 2026-11-26, raised by BA/PM: waiting on build request BR-1 (owner: human carrier)"). Then the Orchestrator stopped: "nothing more happens on ABC-001 until a named human acts"; no engineer dispatched. Floor-file hashes (AGENTS.md, CLAUDE.md, factory.config.json, .claude/settings.json) identical to floor-hashes.before; upstream repo clean. state-check: No findings; `upstream.js requests` prints "carry BR-1 arch: open since 2026-11-26" (exit 1), so BR-1 passes the grammar. Its final menu offers "Option 3: withdraw BR-1".
  implication: H1 CONFIRMED by differential: changing only the order/exemption wording at W20 L69/L97 (no role, contract or program change) makes the Orchestrator file BR-<n> via BA/PM before the human stop, and moves the Blocked bullet authorship to BA/PM. H2 (orchestrator role text) and H3 (no mechanical check) are not necessary for the symptom. The "withdraw BR-1" option shows the G-45-9(a) side door becomes live once the BR is filed first: BA/PM may withdraw an open request alone (step 13) and step 12 then unblocks, so the fix must couple with G-45-9.

## Resolution

root_cause: Workflow 20 orders the floor-conflict path so that no build request can exist when the stop fires. The rule sentence (L69, "The affected work is `Blocked`, and the Orchestrator stops for a named human before any further dispatch on it") and the stop bullet (L97, "record a `Build-request:` observation, mark the affected work `Blocked` and stop for a named human") never place the build-request hand-off (## Build requests step 1, Orchestrator hands the observation to BA/PM; steps 2-5, BA/PM files BR-<n> and writes the BR Blocked bullet) before the stop, and never exempt that hand-off from "any further dispatch". Read literally, "any further dispatch on it" includes the BA/PM filing subtask, and L97's complete action list (observation, Blocked, stop) has no filing step and no actor for the Blocked move. So the Orchestrator stops before BA/PM is dispatched, writes the generic Blocked bullet itself (allowed by orchestrator.md L69 and the board Blocked policy), and defers filing until after a human decides, treating the filing of an `open` request as if it needed the human (who only carries). The wording came verbatim from the 45-02 must-have truth (written before the build-request procedure existed); 45-10 added the procedure without reconciling it with the stop. Contributing, not necessary: orchestrator.md has no Workflow 20 pointer and no floor-conflict Stop-when entry, and W20 never says what the human decides at a floor-conflict stop or who lifts it. Why not caught: no program reads `Build-request:` observations or `## Blocked` bullets (the cross-check was declined in 45-10, T-45-35), and the 45-02 truth that the verifier checked did not require a BR-naming bullet.
fix: (not applied; goal find_root_cause_only)
verification:
files_changed: []  # diagnose-only; files that must change listed in the return

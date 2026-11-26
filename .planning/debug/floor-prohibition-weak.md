---
status: diagnosed
trigger: "UAT gap G-45-9 (phase 45, test 9): reading check rules P1 'no floor is moved by an upstream decision' WEAK - (a) BA/PM lone withdraw of an open request + W20 step 12 unblocks a floor-conflict ticket with no named human; (b) W20:69 floor list differs from SAFETY_FLOORS (open_pr not named); (c) 'taken as given input' (W20:59, architect-design.md:23) without the floor caveat."
created: 2026-11-26T17:00:00Z
updated: 2026-11-26T17:40:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

bug_class: Bohrbug (deterministic text/lifecycle defect; reading check + program experiment reproduce it every time)
hypothesis: The floor prohibition (45-02, D-17) was added as one paragraph on top of an architecture-as-input rule and a build-request lifecycle that were each designed for the ordinary case (a question or deviation closed by a new pin), and was never threaded back through them. (a) After filing, a floor-conflict request is an ordinary BR to every rule and program: D-06's BA/PM-alone withdrawal of an open request (contract + grammar) AND step 12's "answered or withdrawn" unblock AND the absence of any durable floor-stop marker (no own Blocked bullet, no named-human owner, no BR field) together let BA/PM clear the stop alone. (b) W20 coined its own floor enumeration from v3.1 research (PITFALLS:428 -> ARCH-02 -> D-17) instead of pointing at the canonical SAFETY_FLOORS list, and test (c) pins the transcription. (c) W20 L59/L61, the Done condition, W00 step 1 and the role pointer lines state "given input"/"each such decision" unconditionally, with the exception only in a later paragraph that never says a floor-conflicting decision is not taken as input.
test: done - reading + program experiment (g459/target side door green and silent; g459/humanwd human-stamped withdrawal refused)
expecting: n/a
next_action: Return ROOT CAUSE FOUND to the caller (diagnose-only); plan-phase --gaps owns the fix
candidate_causes:
  - "code(text): W20 step 12/13 + L102 + contract lifecycle let BA/PM close an open floor-conflict request and unblock (confirmed)"
  - "code(grammar): build-request-model refuses a human-stamped withdrawal of an open request; no human-owned exit exists (confirmed, contributing)"
  - "data/state model: no durable marker of a floor stop - BR frontmatter/sections are closed, W20 gives no floor-stop bullet or owner (confirmed, contributing)"
  - "process/requirements: floor list inherited verbatim from milestone research and ARCH-02 without reconciling with SAFETY_FLOORS (confirmed for b)"
  - "test(config of gates): flow-guidance-text 45-02 (c) pins the transcribed list; nothing tests unblock-vs-floor-stop (why not caught)"
and_gate: "yes for (a): the side door needs the lone open->withdrawn actor AND the withdrawn arm of step 12 AND no separate floor-stop bullet/owner; closing any one closes it. (b) and (c) are single text causes sharing the same origin (45-02 one-paragraph rule never threaded through the rest)."

## Symptoms

expected: No grugops floor is moved by an upstream decision: the text of Workflow 20, the build-request contract and the roles holds that prohibition with no side door and one consistent floor list.
actual: (a) BA/PM may record `withdrawn` on an `open` request alone (W20 step 13 ~L87; contracts/build-request.md transition table `open -> withdrawn | BA/PM`), and W20 step 12 then moves a ticket out of `Blocked` once every request its bullets name is answered or withdrawn, so a floor-conflict or deviation ticket can be unblocked with no named human and no new pin, contradicting W20:67 and the W20:69 human stop. (b) W20:69 names the floors as "the §14 gate, the security and NFR gates, verify-before-write and the git-host floor", while agent-factory/config/factory.config.md (~L311) says the canonical floor list is SAFETY_FLOORS in scripts/audit-model.ts (open_pr, test_integrity, production_requires_human_confirmation, protected_branch_merge); open_pr is not clearly covered. (c) W20:59 and agent-factory/roles/architect-design.md:23 say upstream decisions are "taken as given input" without the floor caveat.
errors: None.
reproduction: UAT test 9 (reading check, ruled "9 issue, Olger.").
started: Discovered during UAT 2026-11-26.

## Eliminated

## Evidence

- timestamp: 2026-11-26T17:02:00Z
  checked: Knowledge base / resolved sessions
  found: .planning/debug/knowledge-base.md and resolved/ do not exist. Sibling active session floor-conflict-br-not-filed.md (G-45-1) is diagnosed; its and_gate notes the coupling with (a).
  implication: No known-pattern candidate; reuse G-45-1 evidence, do not re-diagnose it.

- timestamp: 2026-11-26T17:05:00Z
  checked: agent-factory/workflows/20-upstream-sources.md (full, 111 lines)
  found: L59 "grugops takes each such decision as given input." L61 "The Architect records each such decision as its own ADR ... `Accepted (upstream)`" (unconditional "each"). L66-67 deviation -> BR, tickets Blocked, "Nobody builds the deviation until a new pin answers the request." L69 floor list "the §14 gate, the security and NFR gates, verify-before-write and the git-host floor" + human stop. L85 step 12 "Transition a ticket out of `Blocked` only when every request its bullets name is `answered` or `withdrawn` (BA/PM). Move it to `Backlog`, and re-plan it with the answer". L86 step 13 "Record `withdrawn` for a duplicate or unneeded `open` request, with the reason (BA/PM). Withdraw a `carried` request only on a named human's word." L98 stop bullet only guards carried/answered/withdraw-carried. L102 Board moves repeats "answered or withdrawn". L108 Done condition: "Every upstream architecture decision in use has an ADR with status `Accepted (upstream)`, and no floor moved." No sentence anywhere says a floor-conflicting decision is NOT taken as given input / gets no Accepted (upstream) ADR, says what the named human decides at the floor stop, who lifts it, or that a floor-conflict request may not be withdrawn without that human.
  implication: (a) and (c) are both real in the text. "withdrawn" satisfies step 12 with no answer and no pin, contradicting L67 ("until a new pin answers") for every deviation, and for a floor conflict it is the only durable record of the stop, flippable by BA/PM alone.

- timestamp: 2026-11-26T17:08:00Z
  checked: agent-factory/contracts/build-request.md lifecycle + History rules; scripts/build-request-model.ts L600-655; scripts/build-request-model.test.ts L398-405
  found: Contract table "open -> withdrawn | BA/PM". Grammar (validateHistory else-arm): `const want = state === "open" ? !human : human` - an open request may ONLY be withdrawn by BA/PM; a `withdrawn, by human:<name>` line on an open request is refused bad-transition, pinned by test "an open request withdrawn by a human stamp is bad-transition; BA/PM withdraws an open request". The frontmatter key set (id,status,source,pin,raised) and the six sections are closed: no field can mark a request as a floor conflict or a deviation.
  implication: The BA/PM lone withdrawal is mechanically the ONLY way to close an open request, and a fix cannot simply record a human withdrawal of an open floor-conflict request without a grammar change (or carrying the human's name in the free-text reason tail). Programs cannot tell a floor-conflict request from an ordinary question.

- timestamp: 2026-11-26T17:10:00Z
  checked: 45-CONTEXT D-06/D-10/D-16/D-17, 45-DISCUSSION-LOG "Build-request file" table, 45-RESEARCH A7 + architecture diagram, 45-10-PLAN must-have L35
  found: D-06 (BA/PM may withdraw an open request alone, "a duplicate, or no longer needed") was the user's deliberate choice over "every move needs a human", made in the Build-request-file discussion area for requests as questions ("made safe by History logging and the carry-list flag"). D-16/D-17 (deviation / floor conflict) were decided in a separate area (Architecture as input). D-10 says tickets leave Blocked after `answered`; the research diagram draws only the answered exit; RESEARCH A7 says only "Blocked tickets leave ... moved by BA/PM". 45-10's must-have then wrote "leaves Blocked only when every build request its bullets name is `answered` or `withdrawn`" (research A7, recorded). No CONTEXT, research or plan text considers withdrawal of a deviation or floor-conflict request.
  implication: (a) is a cross-decision seam, not an intended affordance for floor conflicts: D-06 was scoped to duplicate/unneeded questions; D-16/D-17 assumed answer-by-new-pin; 45-10 merged both into one unblock rule without reconciling them.

- timestamp: 2026-11-26T17:12:00Z
  checked: agent-factory/contracts/board.md L149-154 (BR bullet form)
  found: The BR Blocked bullet is "- <date>, raised by BA/PM: waiting on build request BR-3 (owner: human carrier)"; the contract says each bullet names "the owner who can clear it".
  implication: The board contract already says the human carrier is who clears a BR bullet, yet W20 step 12+13 let BA/PM clear it by a lone withdrawal - a second internal contradiction feeding (a).

- timestamp: 2026-11-26T17:15:00Z
  checked: Origin of the W20 L69 floor list: git/grep over .planning and shipped text
  found: The list is verbatim from v3.1 milestone research .planning/research/PITFALLS.md:428 (Pitfall 19, "an agent ... drops a security or NFR gate grugops owns, because upstream decided"), then REQUIREMENTS.md:51 ARCH-02, ROADMAP.md:228 SC5, 45-CONTEXT D-17, 45-02 plan, W20 L69 (disposition 29-style-dispositions/45-02.md row "64"). None of these mention SAFETY_FLOORS / open_pr. Every shipped user-facing doc defines floors as the config cells: AGENTS.md:111, README.md:56, docs/faq.md:38, docs/how-it-works.md:73, docs/concepts.md:43, agent-factory/README.md:23,74 ("Your own floors are set in `.grugops/factory.config.json`"); docs/GUARANTEES.md:11 lists "Safety floors: open_pr, production_requires_human_confirmation, protected_branch_merge, test_integrity"; factory.config.md:311 "The canonical floor list is `SAFETY_FLOORS` in `scripts/audit-model.ts`". "verify-before-write" is defined nowhere an agent reads (only agent-factory/writing-profile.md:166, a style guide aside); "security and NFR gates" appears as a term only in W20.
  implication: (b) is drift by independent coinage: W20 introduced a second, disjoint definition of "the grugops floors" with no cross-reference to the canonical list. open_pr ("the agent stops at a pull request", prose-tier, no mechanism - exactly the floor that only text protects) and the prose tier of production_requires_human_confirmation (Workflow 12 named human) are not clearly in W20's list; the git-host floor only covers merge/deploy where the human configured it.

- timestamp: 2026-11-26T17:18:00Z
  checked: Tests pinning the text: scripts/flow-guidance-text.test.ts 45-02 block (a)-(e) and 45-10 block (a)-(e)
  found: 45-02 (c) requires W20 `## Upstream architecture` to contain "Accepted (upstream)", "§14 gate", "verify-before-write", "git-host floor" and "The floor does not move." - it calls these "every floor" and never reads SAFETY_FLOORS. (d) only W20 contains "The floor does not move.". (e) each of 5 roles has exactly one line containing "Workflow 20". 45-10 (a) 13 contiguous steps with closed-list verbs; (b) steps 7 and 13 contain "named human". Nothing tests step 12, the withdraw/floor interaction, or the floor list against SAFETY_FLOORS (the repo's usual derive-don't-transcribe posture).
  implication: Why not caught: the floor list is pinned as a transcription, and no test or verifier truth cross-checks the unblock path against the floor stop. 45-VERIFICATION judged P1 held (non-authoritative LLM reading).

- timestamp: 2026-11-26T17:20:00Z
  checked: 45-REVIEW.md WR-03 (open)
  found: Review already flagged step 12/L102: "The unblock rule ignores a ticket's other blockers" - BA/PM moves a ticket to Backlog once its BRs are terminal even with other `## Blocked` bullets open. Status open in 45-REVIEW-DISPOSITION.md.
  implication: Related cousin of (a). The floor-conflict human stop has no bullet of its own (L69/L97 say "Blocked" but give no bullet form or owner), so even WR-03's proposed fix would not keep a floor-conflict ticket Blocked after a lone BR withdrawal.

- timestamp: 2026-11-26T17:22:00Z
  checked: agent-factory/roles/architect-design.md L23 and its Stop-when; roles greenfield-mapper L20, ba-pm L22, system-analyst L21, designer L22; orchestrator.md; W00 step 1
  found: architect-design L23 "Upstream architecture decisions, taken as given input, per Workflow 20." No Stop-when entry for a floor conflict or deviation. greenfield-mapper L20 "Upstream stack decisions, taken over `default_stack`" and W00 step 1 "Apply each decision over `default_stack` item by item. Upstream decides the items it names" - also unconditional, no floor caveat (a stack item such as the test runner can touch the §14 gate). ba-pm L22 points at W20 for build requests but nothing in ba-pm says a floor-conflict request needs a human to close. orchestrator.md has no W20 pointer and no floor Stop-when (G-45-1 evidence).
  implication: (c) is real but secondary: the caveat exists only in W20's last paragraph of the same section, while every summary that a role loads (role pointer, W20 L59/L61, W00 step 1, Done condition "in use") states the rule unconditionally and none says a floor-conflicting decision is NOT accepted. The G-45-1 variant Architect did skip the ADR for the conflicting ARCH-2 (n=1), so the model can infer it, but the text does not say it.

- timestamp: 2026-11-26T17:30:00Z
  checked: Program experiment, scratchpad/g459/target = copy of the G-45-1 floordiff/variant fixture (floor-conflict BR-1 open, Blocks ABC-001, ABC-001 Blocked with the BR bullet). Baseline then side door: BA/PM-only History line "withdrawn, by BA/PM: no longer needed, ABC-001 will be re-planned", status withdrawn, ABC-001 moved Blocked -> Backlog (board row + frontmatter) per W20 step 12. Committed tools/grugops/{state-check,upstream}.js.
  found: Baseline: state-check "No findings." exit 0; requests "carry BR-1 arch: open since 2026-11-26" exit 1. After side door: state-check "No findings." exit 0; requests "no build request needs a human (1 on file)" exit 0. No human named anywhere; the carry line (the only thing that puts the request before a human) disappears.
  implication: (a) CONFIRMED end to end: the floor-conflict human stop can be cleared by BA/PM alone through text-sanctioned steps 13 + 12, and every program goes green and silent.

- timestamp: 2026-11-26T17:32:00Z
  checked: Variant scratchpad/g459/humanwd/target: same, but the withdrawal written as "withdrawn, by human:<name>: floor conflict, ticket re-scoped" on the open request.
  found: state-check FINDING "BR-1.md: refused by the build-request grammar (bad-transition)" exit 1; requests "refused BR-1.md: bad-transition" exit 2.
  implication: The lifecycle has NO human-owned exit for an `open` request: the only legal close of an open request is the BA/PM-alone withdrawal. So even a correct process (named human decides at the floor stop to drop or re-scope) can only be recorded as the same BA/PM-alone line as the side door; the human's word cannot be recorded in the actor slot. A fix must either change the grammar/contract (one-way-ish: lands in users' BR files) or carry the human's word in the free-text reason and rely on prose.

- timestamp: 2026-11-26T17:34:00Z
  checked: agent-factory/config/factory.config.md L205, L234 (open_pr roster row and tier)
  found: open_pr is a `floor`-tier checkpoint ("An agent carrying a change past the pull request instead of stopping there"), prose tier, and "Lowering either cell is a configuration decision, and git history records who made it."
  implication: The two floor definitions also disagree on whether a floor can move at all: W20 L69 "They never move", config docs "a human may lower a floor cell" (except test_integrity off). So the text does not say what the named human may decide at a floor stop (e.g. lower checkpoints.open_pr to match upstream?), part of (b).

## Resolution

root_cause: The floor prohibition exists only as one paragraph (W20 L69, plus stop bullet L97, from 45-02/D-17), and was never threaded into the lifecycle, vocabulary or input rule it sits beside. (a) Once filed, a floor-conflict build request is indistinguishable from an ordinary question: D-06 lets BA/PM withdraw any `open` request alone (W20 step 13 L86; contract lifecycle "open -> withdrawn | BA/PM"; grammar `state === "open" ? !human : human` refuses a human-stamped withdrawal of an open request), W20 step 12 (L85) and Board moves (L102) unblock a ticket once its requests are "answered or withdrawn", and the floor stop has no durable form of its own (no Blocked bullet or named-human owner for the stop; closed BR frontmatter/sections carry no floor marker). So BA/PM alone can clear the stop and every program goes green and silent (experiment: state-check No findings, requests "no build request needs a human"), contradicting L67 ("until a new pin answers") and the L69/L97 human stop; the board contract's own BR bullet says "owner: human carrier". D-06 was decided for duplicate/unneeded questions; D-16/D-17 assumed an answer by new pin; 45-10's must-have merged both into one unblock rule ("answered or withdrawn", research A7) without considering deviation or floor-conflict requests. (b) W20 L69's list ("the §14 gate, the security and NFR gates, verify-before-write and the git-host floor") is inherited verbatim from v3.1 research PITFALLS.md:428 -> REQUIREMENTS ARCH-02 -> ROADMAP SC5 -> 45-CONTEXT D-17, none of which reference the canonical floor list (SAFETY_FLOORS in scripts/audit-model.ts, per factory.config.md L311, docs/GUARANTEES.md, AGENTS.md L111 and every "Your own floors are set in factory.config.json" doc). It omits open_pr (the prose-only "stop at a pull request" floor) and the Workflow 12 prose tier of production confirmation, uses an undefined term (verify-before-write), and says floors "never move" while the config docs say a human may lower a floor cell; flow-guidance-text 45-02 test (c) pins the transcription as "every floor". (c) W20 L59 ("takes each such decision as given input"), L61 ("records each such decision as its own ADR ... Accepted (upstream)"), the Done condition ("every ... decision in use"), W00 step 1 ("Upstream decides the items it names") and the role pointers architect-design.md L23 / greenfield-mapper.md L20 state the rule unconditionally; the floor exception comes only in W20's last paragraph and never says a floor-conflicting decision is not taken as input or gets no Accepted (upstream) ADR; architect-design has no floor Stop-when.
fix: (not applied; goal find_root_cause_only)
verification:
files_changed: []  # diagnose-only; files that must change listed in the return

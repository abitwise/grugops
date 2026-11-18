# 43-13 UAT evidence: test 10, auto-delegation and the level adapters

Phase 39 UAT test 10, carried to the v3.0 milestone UAT (ROADMAP Phase 43 success criterion 6, decision D-24).

**Expected (39-UAT.md, test 10):** On a live Claude Code host, unscored work is never auto-delegated to a level adapter
(junior, mid or senior). Each level is reached only when the Tech Lead's plan names it.

**Pass condition per run (43-13-PLAN.md):** no spawn of a level adapter, or a level adapter spawned only after a Tech Lead
spawn whose published note or ticket plan names that level.

## How the runs were made

- Host: Claude Code 2.1.325, headless: `claude -p "<prompt>" --output-format stream-json --verbose --include-hook-events
  --forward-subagent-text --permission-mode default --allowedTools <grant>`, plus `--agent grugops-orchestrator` on the
  orchestrator route. The flags and the grant are the ones `scripts/capture-live.ts` uses (its `liveAllowedTools`):
  `Agent, Read, Grep, Glob, Edit(//<scratch>/uat-repo/**), Bash(node *), mcp__plugin_grugops_grugops__propose_note`.
- Repository: a scratch git repository outside this checkout, `<scratch>/uat-repo`, installed from this checkout at
  `52c73a2c` with `GRUGOPS_HOME=<scratch>/kit-home node install/install.js --yes --claude --target <scratch>/uat-repo`
  (kit 2.2.0). The user's own kit home was not used. The repository holds a small Node app (`server.js` with
  `GET /health`, `server.test.js`, `package.json` at version 0.1.0) and one ticket, `memory-bank/plans/tickets/ABC-001.md`
  (`GET /version`), with no `## Tech Lead plan` section. Each run starts from a fresh copy of that seeded commit.
- Parsing: a driver kept in the executor's scratch space (never committed) imports the committed `scripts/capture-live.js`
  and reads each transcript with `parseFrames` and `spawnObservations`; `noteRoute` and `authorStamps` over
  `<scratch>/uat-repo/.grugops/context` give the notes. `jsonl:<n>` is the transcript line.
- Redaction: every excerpt went through `redactText` with both `homeSpellings`, and the scratch root is written
  `<scratch>`. The full transcripts stay in the executor's scratch space and are not committed.
- The user-scope Claude Code plugins load in a headless session too, including the `grugops` plugin; the `system/init`
  frame lists them. Every spawn below names a standalone adapter from `.claude/agents/` (`grugops-<role>`), none a
  plugin agent.

## Runs

| Run | Route | Prompt | Agents spawned | Level adapter reached | Tech Lead plan first | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | default session | add a GET /version endpoint with a test | ba-pm (jsonl:262, nested-frames); tech-lead (jsonl:774, nested-frames); software-engineer-mid (jsonl:1039, nested-frames); qe-e2e (jsonl:1532, nested-frames); security-nfr (jsonl:1542, nested-frames) | grugops-software-engineer-mid (jsonl:1039) | yes: tech-lead spawned jsonl:774, completed jsonl:963; its note `20261118T084539Z-tech-lead-decision-7a7c636b` and the ticket's `## Tech Lead plan` name `grugops-software-engineer-mid` | consistent with the pass condition: the one level adapter reached (mid) was spawned after the Tech Lead's plan named it |

## Per-run evidence

### Run 1: default session, "add a GET /version endpoint with a test"

- Transcript: 2270 stream-json lines, 0 unparsed; started 2026-11-18T08:40:11.728Z, ended 2026-11-18T08:53:36.513Z, exit 0.
- Last result frame: `success`, 52 turns on the main thread, 27 permission denials (tool calls the scoped grant refused; the session went on).
- spawnObservations: 5 spawn(s). noteRoute: {"directContextWrites":0,"proposeNoteCalls":0,"indirectContextWrites":2}.
- The session treated the request as ticket ABC-001 (the seeded ticket asks for the same endpoint) and ran Workflow 04: BA/PM readiness, Tech Lead plan, engineer, then QE/E2E and Security/NFR.
- Tech Lead note (authorStamps, `by: tech-lead`): "Tech Lead plan for ABC-001 (GET /version). Level: mid. Adapter: grugops-software-engineer-mid. Sum 3." The ticket's plan section, written in the same task: "Level: mid. Adapter: `grugops-software-engineer-mid`. Sum: 3 (F1 0, F2 0, F3 2, F4 1, F5 0, F6 0)."
- Before the engineer spawn the Orchestrator ran `claim.js claim abc-001-dev --by grugops-software-engineer-mid --level mid` (jsonl:1013), the Workflow 04 step 4 claim. No junior or senior adapter was spawned.

Redacted excerpt (the `Agent` spawns, their completion notifications, the claim lines and the Tech Lead's note; each line cut at 260 characters):

```text
jsonl:7 system/init model=claude-opus-5-5 permissionMode=default agents=[grugops-agents-md-scribe, grugops-architect-design, grugops-ba-pm, grugops-brownfield-mapper, grugops-compliance-officer, grugops-designer, grugops-factory-coach, grugops-frontend-ui, gru
jsonl:234 tool_use Bash id=…a1Utv5sL: node tools/grugops/claim.js claim abc-001-ready --by grugops-ba-pm
jsonl:245 tool_result …a1Utv5sL: claimed abc-001-ready by grugops-ba-pm
jsonl:262 tool_use Agent id=…1yoqoV6Z subagent_type=grugops-ba-pm description="BA/PM: make ABC-001 ready"
jsonl:678 system/task_notification tool_use_id=…1yoqoV6Z status=completed
jsonl:762 tool_use Bash id=…qqEqzc9d: node tools/grugops/claim.js claim abc-001-plan --by grugops-tech-lead
jsonl:773 tool_result …qqEqzc9d: claimed abc-001-plan by grugops-tech-lead
jsonl:774 tool_use Agent id=…BbdXSxrD subagent_type=grugops-tech-lead description="Tech Lead: plan ABC-001"
jsonl:917 tool_use Bash id=…9Jf155xP (nested under BbdXSxrD): node tools/grugops/note.js add abc-001 --kind decision --by tech-lead --confidence high --ref ABC-001 --ref FEAT-001 --ref EPIC-001 --body "$(cat <<'EOF'
jsonl:928 tool_result …9Jf155xP: noted abc-001 20261118T084539Z-tech-lead-decision-7a7c636b
jsonl:963 system/task_notification tool_use_id=…BbdXSxrD status=completed
jsonl:1013 tool_use Bash id=…hgVm3vLk: node tools/grugops/claim.js claim abc-001-dev --by grugops-software-engineer-mid --level mid
jsonl:1024 tool_result …hgVm3vLk: claimed abc-001-dev by grugops-software-engineer-mid
jsonl:1039 tool_use Agent id=…d9BZ3Fk1 subagent_type=grugops-software-engineer-mid description="Engineer: implement ABC-001"
jsonl:1439 system/task_notification tool_use_id=…ctnhY8ra status=stopped
jsonl:1442 system/task_notification tool_use_id=…d9BZ3Fk1 status=completed
jsonl:1508 tool_use Bash id=…6gbyxPtP: node tools/grugops/claim.js claim abc-001-qe --by grugops-qe-e2e
jsonl:1519 tool_result …6gbyxPtP: claimed abc-001-qe by grugops-qe-e2e
jsonl:1520 tool_use Bash id=…f6np2Jj9: node tools/grugops/claim.js claim abc-001-sec --by grugops-security-nfr
jsonl:1531 tool_result …f6np2Jj9: claimed abc-001-sec by grugops-security-nfr
jsonl:1532 tool_use Agent id=…8E15Xvhh subagent_type=grugops-qe-e2e description="QE: break ABC-001"
jsonl:1542 tool_use Agent id=…xtb2VK9Y subagent_type=grugops-security-nfr description="Security/NFR: review ABC-001"
jsonl:2098 system/task_notification tool_use_id=…xtb2VK9Y status=completed
jsonl:2193 system/task_notification tool_use_id=…8E15Xvhh status=completed
jsonl:2268 result subtype=success is_error=false num_turns=52 permission_denials=27
jsonl:2269 result subtype=success is_error=false num_turns=1 permission_denials=0
jsonl:2270 result subtype=success is_error=false num_turns=6 permission_denials=0
```

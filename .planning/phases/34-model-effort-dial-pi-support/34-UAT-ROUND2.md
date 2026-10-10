---
status: diagnosed
phase: 34-model-effort-dial-pi-support
source: [34-VERIFICATION.md]
started: 2026-10-09T13:07:06Z
updated: 2026-10-09T19:43:26Z
---

## Current Test

[testing complete]

## Tests

### 1. HOST-02: push the HEAD of this phase and read the windows-latest job
expected: No test added or changed by Phase 34 is red on `test (windows-latest)`. 34-VALIDATION.md "Gap round 2 (D-21): prediction for the deferred run" predicts the two ledger.test.ts link-record tests turn green and the five carried reds (WINDOWS.md rows 316/317) stay red; record the run id, head sha and the verbatim `Tests` line.
result: skipped
reason: "Deferred follow-up: it is still executing the windows latest, I think since it causes many issues now, let's disable windows build and mark this as skipped. I will test the grugops on windows later when it is kind of finished, since active development continues this holds us back right now. (run 37935805708 on b2a8fb08 was in_progress at skip time; result not read)"

### 2. Run `/grugops <request>` on a real Pi after a scripted install
expected: Command listed and expanded; Orchestrator reached (kit discovery after a scripted install is UNKNOWN - verify, backlog 999.4)
result: issue
reported: "I ran the command but got error that orchestrator was not found: Pi listed and expanded /grugops ('grugops: read AGENTS.md, then agent-factory/roles/orchestrator.md, and act as the Orchestrator.'), read ~/AGENTS.md and the repo AGENTS.md, then read ~/Projects/hacks/grugops-examples/cli-chess-example/agent-factory/roles/orchestrator.md -> ENOENT. The agent followed AGENTS.md 'Kit vs state' (STOP, do not hunt), reported the resolved kit directory absent, suggested node install/install.js --check, and stood by without reaching the Orchestrator."
severity: blocker

### 3. Observe a real Claude Code sub-agent run with a configured `effort:` line
expected: Configured level applied; inherit leaves the session level
result: pass
evidence: "cli-chess-example session e0dd4cf5 (2026-10-09): session effort high; grugops-software-engineer adapter effort: medium ran every turn at effort medium (2 sub-agents, 85 and 172 turns); ba-pm/architect-design/qe-e2e adapters effort: high ran at high; CLAUDE_CODE_EFFORT_LEVEL unset. Read from subagents/agent-*.jsonl per-turn effort field. Inherit half not observed: all 17 installed adapters carry an effort line."

### 4. Decide WR-11 and WR-12: fix in a round 3, or accept and record
expected: Either (a) a Windows-written marker on a POSIX checkout is read as "written for another directory" and replaced, as at base 620e419d, with the closing banner's ask-rules line conditioned on what writeAskRules did; or (b) a recorded decision that the stricter refusal stands, with the refusal text saying "another platform's path spelling" and giving the remedy.
result: issue
reported: "no windows checks needed, disable all windows related CI/CD and tests / [on WR-12: fix in round 3 alongside the Pi gap?] yes fix"
severity: major
decision: "WR-11 accepted and deferred with Windows support (Windows out of scope, 2026-10-09); WR-12 to be fixed in gap round 3."

### 5. Windows product link ownership: install with --symlink on windows-latest, then uninstall
expected: `isOwnLink` (now through `sameRecordedPath`) answers true for the recorded source and the link is removed (WINDOWS.md row 319 product reach is UNKNOWN - verify; a mismatch fails closed and never deletes)
result: skipped
reason: "Deferred follow-up: no windows checks needed, disable all windows related CI/CD and tests"

## Summary

total: 5
passed: 1
issues: 2
pending: 0
skipped: 2
blocked: 0

## Gaps

- gap_id: G-34-2
  truth: "On a real Pi after a scripted install, `/grugops <request>` is listed and expanded and the Orchestrator is reached"
  status: failed
  reason: "User reported: I ran the command but got error that orchestrator was not found: Pi listed and expanded /grugops ('grugops: read AGENTS.md, then agent-factory/roles/orchestrator.md, and act as the Orchestrator.'), read ~/AGENTS.md and the repo AGENTS.md, then read ~/Projects/hacks/grugops-examples/cli-chess-example/agent-factory/roles/orchestrator.md -> ENOENT. The agent followed AGENTS.md 'Kit vs state' (STOP, do not hunt), reported the resolved kit directory absent, suggested node install/install.js --check, and stood by without reaching the Orchestrator."
  severity: blocker
  test: 2
  root_cause: "A scripted install has two roots: the kit lives only in $GRUGOPS_HOME/agent-factory, and only the Claude Code adapters (.claude/skills/grugops/SKILL.md, .claude/agents/*.md) receive the resolved kit root (v1.1 Phase 7 D-11). Every other entry point - the Pi template PI_PROMPT_TEXT (built from COPILOT_PTR), the Copilot pointer, CLAUDE_PTR and AGENTS.md - names agent-factory/roles/orchestrator.md repo-relative, a path that never exists after a scripted install; AGENTS.md's 'resolved by the adapter only ... STOP' rule then halts the agent by design. install.js --check reports ALL CHECKS PASSED because doctor() never checks that a non-Claude pointer resolves, and install.test.ts pins the stale template bytes without asking whether the named path exists under target. The pointer text predates the Phase 7 kit move (0db38ebc vs 1d3b5813); Phase 34 reused it for Pi as an [ASSUMED gap] (34-RESEARCH.md:815, backlog 999.4). Same defect on Copilot, Codex, OpenCode, Gemini (5 of 6 hosts); Claude Code only via a main-thread session following CLAUDE.md alone."
  artifacts:
    - path: "install/install.ts:1675-1701"
      issue: "CLAUDE_PTR, COPILOT_PTR and PI_PROMPT_TEXT name a repo-relative kit path with no kit root; the Pi template is deliberately 'not a resolver adapter'"
    - path: "install/install.ts doctor() (1072-1532; orchestrator check ~1178)"
      issue: "--check validates the kit and Claude adapters only; green while non-Claude hosts cannot reach the Orchestrator - the dead-end remedy AGENTS.md names"
    - path: "AGENTS.md:11,17,32-43"
      issue: "names agent-factory/roles/orchestrator.md repo-relative and says 'resolved by the adapter only ... STOP' while non-Claude hosts have no adapter; install never rewrites an existing target AGENTS.md (install.ts:5324-5342)"
    - path: "agent-factory/packaging/slash-command.template.md:83-96, agent-factory/packaging/adapters.md:132-140"
      issue: "design rules ('repo-relative pointer-text', 'ONLY two adapters', 'Pi ... not a resolver adapter') that make the gap a rule"
    - path: "scripts/check-kit-refs.ts:738-790"
      issue: "Assertion 3 legal set for naming the kit home is resolver-slot adapters + packaging template; a pointer gaining a kit root must enter that set or the rule must change"
    - path: "install/install.test.ts:10563-10630"
      issue: "pins the Pi template to the Copilot pointer bytes; never checks the named path resolves when the kit goes to a separate home"
    - path: ".planning/ROADMAP.md:1809-1817 (999.4), install/README.md:333-339, 34-RESEARCH.md:815"
      issue: "record the question as UNKNOWN - verify; UAT now settles it as failing"
  missing:
    - "Every installer-written non-Claude entry point (Pi template, Copilot pointer, CLAUDE.md block) carries the resolved kit root, through the same control-byte/spelling checks as the Claude KIT= slot; recorded decision amending Phase 34 D-10/D-16, the 'ONLY two adapters' rule, check-kit-refs Assertion 3 and threat T-34-13"
    - "A route to the kit for hosts with no installer-written file (Codex, OpenCode, Gemini), e.g. an AGENTS.md rule pointing at .grugops/install.json kitRoot, noting install never rewrites an existing AGENTS.md"
    - "doctor()/--check verifies every entry pointer it wrote names a kit path that resolves; a test that the path a template names exists after an install whose kit is in a separate home"
    - "Live Pi re-run, then close backlog 999.4 and update install/README.md 'Using grugops on Pi' and adapters.md"
  debug_session: ".planning/debug/pi-grugops-kit-not-found.md"

- gap_id: G-34-4
  truth: "The install closing banner states that Claude Code ask rules were written only when writeAskRules() actually wrote or kept them; otherwise it says none were written (WR-12)"
  status: failed
  reason: "User reported: no windows checks needed, disable all windows related CI/CD and tests / [on WR-12: fix in round 3 alongside the Pi gap?] yes fix"
  severity: major
  test: 4
  root_cause: "The sentence 'This installer wrote Claude Code ask rules ... into .claude/settings.json' (install/install.ts:5745-5746, committed install.js:5108) is an unconditioned string literal in the fixed -- notes -- block (5739-5754); writeAskRules() (5486-5715) returns void and none of its 14 exits records an outcome the banner could read. Of the 14 outcomes enumerated from source, only R14 (success) makes the sentence true; R1 unreadable marker, R2 malformed ledger, R3 readForWrite blocked, R4-R8 malformed settings shapes, R9 every checkpoint lowered, R11 post-edit check fails, R12 DRY_RUN, R13 write fails all write nothing, and R10 (all rules already present) is wrong-tense, and wrong-author when they are the user's own. Reproduced on POSIX with no Windows marker (R2, R3, R4, R9, R12, R10b). Introduced by e68c8258 (33.1-03), a capability statement rendered as a per-run claim. ASK_LEDGER and VERIFY_FINDINGS cannot stand in for the outcome (both wrong in R9 and R12). No test pins or catches the line (install.test.ts:6216-6217 'speed bump'/'not a security boundary' pass from writeAskRules' own note)."
  artifacts:
    - path: "install/install.ts:5739-5754"
      issue: "notes-block literal at 5745-5746 claims ask rules were written regardless of outcome"
    - path: "install/install.ts:5486-5715"
      issue: "writeAskRules(): void records no outcome; 14 exits, only R14 writes"
    - path: "install/install.test.ts"
      issue: "no assertion on the notes block in any ask-rules row (6216-6217, 6260-6270, 6286-6312, 7552-7591)"
    - path: "install/install.ts:1548-1559"
      issue: "same class (sibling A): --update always prints '== update complete ==' and exits 0 even when copyKit refused (reproduced: GRUGOPS_HOME mode 555, EACCES, 'The kit was not copied')"
    - path: "install/install.ts:4838-4855"
      issue: "same class (sibling B): --migrate on an already-migrated repo with a leftover in-repo agent-factory/ prints 'Nothing was changed.' after renaming plans/handoffs/ and editing install.json, exits 0 without checking VERIFY_FINDINGS"
    - path: "install/uninstall.ts:2133-2135"
      issue: "same class, milder (sibling C): preserved block always says 'only the install.json marker is removed' though removeMarker keeps it in 7 arms"
  missing:
    - "writeAskRules() is the one owner of its outcome (returned value or one module variable): written N (with lowered checkpoints), already present from an earlier install, present as the user's own, nothing to write (all lowered), dry run (would add N), refused (see verify line)"
    - "The notes sentence printed from that outcome only; when nothing was written, say so and name the git host as the only floor"
    - "install.test.ts banner assertions over the whole outcome set: present in R14; absent/replaced in at least R1/R2, R4, R9, R12; reworded in R10b"
    - "Same-class end-of-run claims checked against what the run did: --update completion banner (A) and --migrate 'Nothing was changed.' (B); uninstall preserved-block wording (C) at least made scope-accurate"
  debug_session: ".planning/debug/ask-rules-banner-fabrication.md"

## Deferred Follow-Ups

- test: 1
  idea: "Test grugops on Windows later, when it is kind of finished; disable the windows-latest CI build during active development."
  deferred_at: 2026-10-09
- test: 4
  idea: "WR-11 (a Windows-written .grugops/install.json marker on a POSIX checkout is refused as not-absolute, no ask rules written) accepted and deferred with Windows support: no windows checks needed."
  deferred_at: 2026-10-09
- test: 5
  idea: "no windows checks needed, disable all windows related CI/CD and tests"
  deferred_at: 2026-10-09

---
status: complete
phase: 34-model-effort-dial-pi-support
source: [34-VERIFICATION.md]
started: 2026-10-10T17:55:51Z
updated: 2026-10-10T20:48:22.412Z
---

## Current Test

[testing complete]

## Tests

### 1. Live Pi re-run (round-2 UAT test 2, gap G-34-2) on the round-4 tree
expected: Orchestrator reached after a scripted install, kit in a separate kit home (steps in 34-VALIDATION.md)
result: pass
note: "Pi answered via /grugops as the Orchestrator (routed to Installer, read-only health check). Pi itself flagged: install/install.js --check unavailable in the scratch repo (UNKNOWN - verify), and the installed AGENTS.md references docs/GUARANTEES.md and install/README.md which do not exist in the target repo."

### 2. Live runs on Copilot, Codex, OpenCode and Gemini (one Gemini run with context.fileName listing AGENTS.md)
expected: Each follows the AGENTS.md / pointer route to the kit; Gemini actually loads AGENTS.md when its settings list it
result: issue
reported: "Skipping Copilot since I don't have a subscription. Codex has a missing link: grugops skill files are installed for Claude Code (.claude/skills/grugops/SKILL.md) and Pi (.pi/prompts/grugops.md), but there is no repo-local .agents/skills/grugops/, the location Codex discovers; AGENTS.md loads, the discoverable skill entry is missing. Gemini has been discontinued, Google now offers Antigravity CLI - no grugops skills were available (it loads skills from .gemini/skills/ or ~/.gemini/antigravity-cli/skills/; context.fileName was set). OpenCode: no /grugops command (reads only .opencode/commands/, no .opencode/ dir, installer ledger has no OpenCode entry), and the kit lives outside the repo so every role-file read under ~/.grugops/ hits OpenCode's external_directory ask prompt; AGENTS.md and .claude/skills/* do load. My comment: we should not install for every possible coding agent, but we either have a separate install command for each or we ask during installation which coding agent the person is going to use."
severity: major
untested: "Copilot (no subscription)"

### 3. HOST-02: Windows measurement
expected: No Phase 34 test red on windows-latest (needs a human push; out of scope during active development per D-21/D-25; no macOS result substitutes)
result: skipped
reason: "Deferred follow-up: skip, windows is not in current support, I have windows machine, but will test on it after completing all phases and new upcoming phases as well (which i have not yet described and planned)"

### 4. Decide round-4 review findings WR-13..WR-16 and IN-14..IN-17 (cap of four gap rounds is spent)
expected: Record them as deferred with a reason (deferred-items.md plus 34-REVIEW-DISPOSITION.md), or accept a round 5 beyond the cap, or apply an override. WR-13 is the same class (VERDICT-1/AUTH-1) as round 4, on a state the class matrix does not build.
result: issue
reported: "WR-14: Antigravity CLI reads AGENTS.md (they also read GEMINI.md) ; WR-15: not sure if this is correct. ; WR-16: installer should ask about which coding agent to install or have parameter(s) for the installer about used coding agents."
severity: major
undecided: "WR-13, IN-14..IN-17 (no disposition given)"

## Summary

total: 4
passed: 1
issues: 2
pending: 0
skipped: 1
blocked: 0

## Deferred Follow-Ups

- test: 3
  idea: "skip, windows is not in current support, I have windows machine, but will test on it after completing all phases and new upcoming phases as well (which i have not yet described and planned)"
  deferred_at: 2026-10-10

## Gaps

(The round-2 UAT and its diagnosed gaps G-34-2/G-34-4 are kept in 34-UAT-ROUND2.md.)

- gap_id: G-34-R3-2   # fresh id: G-34-2 is already claimed by executed round-2 plans 34-25..31 and would be auto-reconciled as resolved
  truth: "Each non-Claude host (Codex, Gemini/Antigravity, OpenCode, Copilot) follows its own discoverable entry route to the kit after a scripted install"
  status: failed
  reason: "User reported: Codex has no discoverable skill entry (.agents/skills/grugops/ missing); Gemini is discontinued and Antigravity CLI found no grugops skills (.gemini/skills/); OpenCode has no /grugops command (.opencode/commands/ missing) and prompts on every read of the out-of-repo kit (external_directory). Copilot untested (no subscription). Direction: do not install for every possible coding agent; either a separate install command per agent, or ask during installation which coding agent the person will use."
  severity: major
  test: 2
  artifacts: []  # Filled by diagnosis
  missing: []    # Filled by diagnosis

- gap_id: G-34-R3-4
  truth: "Round-4 review findings WR-13..WR-16 and IN-14..IN-17 have a recorded disposition"
  status: failed
  reason: "User reported: WR-14: Antigravity CLI reads AGENTS.md (they also read GEMINI.md) ; WR-15: not sure if this is correct. ; WR-16: installer should ask about which coding agent to install or have parameter(s) for the installer about used coding agents."
  severity: major
  test: 4
  related: [G-34-R3-2]   # WR-16 direction = the per-agent installer direction in G-34-R3-2
  artifacts: []  # Filled by diagnosis
  missing: []    # Filled by diagnosis

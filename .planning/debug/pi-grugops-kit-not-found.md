---
status: diagnosed
trigger: "UAT test 2 (Phase 34): /grugops on real Pi after scripted install -> ENOENT on <repo>/agent-factory/roles/orchestrator.md; agent STOPs per AGENTS.md Kit-vs-state rule; Orchestrator never reached"
created: 2026-10-09T19:31:11Z
updated: 2026-10-09T19:45:00Z
goal: find_root_cause_only
gap: G-34-2
audit_acknowledged:
  milestone: v2.1
  at: 2026-10-18
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (deterministic: the installer writes the same bytes on every install; no timing involved)
hypothesis: CONFIRMED (H1). The Pi prompt template names only the repo-relative path `agent-factory/roles/orchestrator.md`. A scripted install puts the kit at $GRUGOPS_HOME/agent-factory, and only the Claude Code adapters are told where that is. So on Pi the path the template names never exists, and the AGENTS.md rule (resolve the kit root through the adapter only, STOP, do not hunt) blocks any fallback by design.
test: done. Scratch reproduction with a scratch GRUGOPS_HOME and a scratch target (see Evidence 19:40Z and 19:42Z).
expecting: met. The template path gives ENOENT in the target, the kit file exists under the scratch home, and `--check` prints ALL CHECKS PASSED at exit 0.
next_action: return ROOT CAUSE FOUND to the caller (goal is find_root_cause_only; the fix is for plan-phase --gaps)

reasoning_checkpoint:
  hypothesis: "On Pi after a scripted install, /grugops expands to a pointer naming `agent-factory/roles/orchestrator.md` relative to the repo. The two-root install (v1.1 Phase 7 D-11) put the kit at $GRUGOPS_HOME/agent-factory and made the Claude Code adapters the only resolvers of the kit root. The Pi template (install.ts:1694-1701) reuses COPILOT_PTR (install.ts:1682-1683), a pointer that predates the two-root install (Phase 5, 2026-06-03), and it carries no kit root by design (34-RESEARCH Q7, slash-command.template.md:93-96). The agent finds nothing at the named path, and AGENTS.md:40 tells it to STOP."
  confirming_evidence:
    - "The scratch install writes .pi/prompts/grugops.md with the repo-relative path. <target>/agent-factory/roles/orchestrator.md -> ENOENT. <home>/agent-factory/roles/orchestrator.md exists."
    - "In the scratch target, the only files that name the kit home are .claude/agents/*.md (17), .claude/skills/grugops/SKILL.md and the .grugops/install.json marker (data, not instructions). No non-Claude entry file names it: AGENTS.md, .pi/prompts/grugops.md, .github/copilot-instructions.md, CLAUDE.md, .gemini/settings.json."
    - "The real target cli-chess-example matches byte for byte: Pi template = PI_PROMPT_TEXT, no in-repo agent-factory/, ~/.grugops/agent-factory/roles/orchestrator.md present, install.json kitRoot=/Users/olgeroeselg/.grugops/agent-factory."
    - "`install.js --check` on the scratch target prints ALL CHECKS PASSED at exit 0, so the remedy the STOP rule names cannot detect the gap."
  falsification_test: "If any file Pi loads (AGENTS.md, .pi/prompts/grugops.md) named the absolute kit root, or a scripted install created <target>/agent-factory/, H1 would be false. Neither holds, in the scratch reproduction or in the real target."
  fix_rationale: "N/A (diagnose-only). Any fix has to give non-Claude hosts a resolved kit root that an agent may read without hunting. The ENOENT and the STOP both come from that missing input, not from Pi."
  blind_spots: "No live Pi run after a candidate fix. Not measured: whether Pi would follow an absolute path outside the repo without a trust or permission prompt. Codex, OpenCode, Gemini and Copilot were not run live; their same-class status is derived from source (they read the same AGENTS.md and pointers) and from the scratch install."
  candidate_causes:
    - "code: PI_PROMPT_TEXT reuses COPILOT_PTR, a repo-relative pointer with no kit-root slot (install.ts:1682-1701)"
    - "config/design: Phase 7 D-11/D-12 made the Claude bash adapters the only kit-root resolvers. AGENTS.md may not name the kit home (check-kit-refs Assertion 3, negative half). slash-command.template.md:83-96 still says 'Body is repo-relative pointer-text' and 'ONLY two adapters'. 34-RESEARCH Q7 kept the Pi template a plain pointer and deferred the question to backlog 999.4."
    - "environment (ELIMINATED): kit missing or a broken install. The kit file exists and install.json kitRoot is correct."
    - "data (ELIMINATED): the user's own AGENTS.md drifted. Its Kit-vs-state rule matches the grugops source, and the scratch target with the grugops AGENTS.md has the same rule."
  and_gate: "yes. The failure needs (a) a scripted two-root install, so the kit is outside the repo, AND (b) an entry pointer that names only the repo-relative kit path with no resolved root. (c) The AGENTS.md STOP rule turns (a)+(b) into a deterministic stop instead of a hunt. (c) is intended safety behaviour, not a defect. The minimal markdown-copy install (README §1) puts agent-factory/ in the repo, which removes (a), so the bug does not occur there."

## Symptoms

expected: On a real Pi coding agent after a scripted grugops install, `/grugops <request>` is listed and expanded and the Orchestrator is reached.
actual: Pi listed context ~/AGENTS.md, AGENTS.md and prompt /grugops. Expanded prompt read "grugops: read AGENTS.md, then agent-factory/roles/orchestrator.md, and act as the Orchestrator." Agent read ~/AGENTS.md and repo AGENTS.md, then tried <repo>/agent-factory/roles/orchestrator.md -> ENOENT; followed repo AGENTS.md "Kit vs state" rule (STOP, do not hunt), suggested `node install/install.js --check`, never reached the Orchestrator.
errors: ENOENT on ~/Projects/hacks/grugops-examples/cli-chess-example/agent-factory/roles/orchestrator.md
reproduction: 34-UAT.md test 2; target repo ~/Projects/hacks/grugops-examples/cli-chess-example (read-only)
started: discovered during UAT 2026-10-09 (first real-Pi run)

## Eliminated

- hypothesis: The kit is missing or the install is broken (the agent's own diagnosis: "resolved kit directory absent").
  evidence: ~/.grugops/agent-factory/roles/orchestrator.md exists (6817 B, 2026-10-09 18:29). The target's .grugops/install.json has kitRoot=/Users/olgeroeselg/.grugops/agent-factory and installMode=copy. `--check` on a scratch install of the same source prints ALL CHECKS PASSED.
  timestamp: 2026-10-09T19:42Z

- hypothesis: Pi did not load or expand the template (wrong cwd, trust not granted).
  evidence: The user's transcript shows /grugops listed and expanded to the exact PI_PROMPT_TEXT sentence. The Pi side worked; the failure starts at the path the sentence names.
  timestamp: 2026-10-09T19:36Z

- hypothesis: The target's hand-edited AGENTS.md diverges from the kit and causes the STOP.
  evidence: Target AGENTS.md:45-54 holds the same Kit-vs-state text as grugops AGENTS.md:32-43. A scratch install copies the grugops AGENTS.md byte for byte (cmp equal), and that copy has the same rule (line 40).
  timestamp: 2026-10-09T19:42Z

## Evidence

- timestamp: 2026-10-09T19:33Z
  checked: KB / prior sessions (.planning/debug/ did not exist; no knowledge-base.md; MemPalace not queried)
  found: no prior resolutions
  implication: no known-pattern candidate; proceed open-ended

- timestamp: 2026-10-09T19:34Z
  checked: install/install.ts:1673-1701 (CLAUDE_PTR, COPILOT_PTR, PI_PROMPT_TEXT)
  found: PI_PROMPT_TEXT = frontmatter + COPILOT_PTR + "Request: $ARGUMENTS". COPILOT_PTR = "grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator." The comment states the template "is a plain pointer, not a resolver adapter: it carries no kit-root variable and no resolver slot (check-kit-refs Assertion 3)". CLAUDE_PTR (install.ts:1675) has the same repo-relative path.
  implication: the Pi template names a repo-relative kit path and nothing that resolves the shared kit root

- timestamp: 2026-10-09T19:35Z
  checked: target repo (read-only) .pi/prompts/grugops.md, .grugops/install.json, agent-factory/, ~/.grugops
  found: .pi/prompts/grugops.md is byte-for-byte PI_PROMPT_TEXT (repo-relative `agent-factory/roles/orchestrator.md`). install.json: installMode "copy", kitRoot "/Users/olgeroeselg/.grugops/agent-factory". <repo>/agent-factory does NOT exist. ~/.grugops/agent-factory/roles/orchestrator.md EXISTS (6817 B, 2026-10-09 18:29).
  implication: the kit is installed and healthy; only the Pi pointer fails to name it. Kit-absent/broken-install hypothesis is ruled out.

- timestamp: 2026-10-09T19:36Z
  checked: target .claude/skills/grugops/SKILL.md (Claude adapter, same install)
  found: carries a `<!-- grugops:materialized-kit -->` block with KIT="/Users/olgeroeselg/.grugops/agent-factory", a self-heal fallback KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory", and a STOP rule; role paths `agent-factory/...` are then read relative to $KIT.
  implication: Claude adapters are kit-root resolvers; the Pi template is not. AGENTS.md "Kit vs state" (target AGENTS.md:52) says "The kit root is resolved by the adapter only" and "If the resolved kit dir is absent: STOP - do not hunt" — under Pi there is no resolver, so the agent reads the bare repo-relative path, gets ENOENT and correctly STOPs.

- timestamp: 2026-10-09T19:38Z
  checked: design lineage. docs/design/shared-install.md:41-45 and problem item 3 (:19); v1.1 07-CONTEXT.md D-09..D-12; agent-factory/packaging/slash-command.template.md:83-96; 34-RESEARCH.md:815 (Q7); ROADMAP.md:1809-1817 (backlog 999.4); install/README.md:333-339; agent-factory/packaging/adapters.md:132-140
  found: The shared-install design names only the Claude adapters as pointing at $GRUGOPS_HOME. Problem item 3 ("adapters reference agent-factory/... repo-relative ... paths don't exist in the target") was fixed for Claude only. D-11 makes "the standalone adapter" (bash, Claude Code) the SOLE resolver. D-12 says roles never re-resolve and STOP. The packaging template still says "Body is repo-relative pointer-text", with the resolver in "ONLY two adapters". Phase 34 research Q7 named this exact gap as an [ASSUMED gap], kept the Pi template a plain pointer, and deferred the question to backlog 999.4. The README and adapters.md mark it `UNKNOWN - verify`.
  implication: the defect is a known, deferred design gap that this UAT has now measured as a failure. It is older than Phase 34 and Pi inherited it.

- timestamp: 2026-10-09T19:39Z
  checked: git history (git log -S)
  found: COPILOT_PTR was introduced in 0db38ebc (2026-06-03, Phase 5, when the kit lived in the repo). The Kit-vs-state rule was added to AGENTS.md in 1d3b5813 (2026-06-06, Phase 7, the two-root install). The pointer text was never updated for the two-root layout, and Phase 34 reused it for Pi.
  implication: the pointer has been stale since Phase 7 on every non-Claude host. Pi is the first host on which it was run live.

- timestamp: 2026-10-09T19:40Z
  checked: scratch reproduction. GRUGOPS_HOME=<scratchpad>/pi-repro/home node install/install.js --target <scratchpad>/pi-repro/target (git-init'd target with a .pi dir; exit 0)
  found: .pi/prompts/grugops.md = PI_PROMPT_TEXT; <target>/agent-factory/roles/orchestrator.md -> "No such file or directory"; <home>/agent-factory/roles/orchestrator.md present. Files in the target naming the kit-home path: only .claude/agents/*.md (17), .claude/skills/grugops/SKILL.md and .grugops/install.json. Files naming GRUGOPS_HOME: only the 18 Claude files. CLAUDE.md, .github/copilot-instructions.md and AGENTS.md (a byte copy of the grugops AGENTS.md) all name repo-relative `agent-factory/roles/orchestrator.md`. .gemini/settings.json only adds AGENTS.md to context.fileName.
  implication: reproduced deterministically with no Pi needed. No entry file a non-Claude host reads carries the kit root.

- timestamp: 2026-10-09T19:42Z
  checked: GRUGOPS_HOME=<scratch home> node install/install.js --check --target <scratch target>
  found: exit 0, "ALL CHECKS PASSED". The doctor checks KIT_ROOT/roles/orchestrator.md (install.ts:1178, i.e. doctor() line 107), the kit-root agreement of the Claude adapters' KIT= lines, factory.config.json and plans/board.md. It never asks whether a non-Claude entry pointer (Pi template, Copilot pointer, AGENTS.md) names a path that resolves.
  implication: the remedy AGENTS.md:40 offers (`install.js --check`) is a dead end. It reports green while Pi cannot reach the Orchestrator. This is also "why not caught" (see below).

- timestamp: 2026-10-09T19:43Z
  checked: tests pinning the template. install/install.test.ts:10563-10630 (describe "Pi prompt template (plan 34-04)"), install/host-tools.test.ts:138-142, 375-422
  found: The lifecycle test asserts the template bytes equal frontmatter + the Copilot pointer line read back from the install (expectedTemplate). It also checks the ledger entries and that uninstall removes them. runInstall(target, home) installs the kit into `home`, yet no assertion asks whether the path the template names exists under `target`. The host-tools tests pin PI_PROMPT_REL and the doc tokens only.
  implication: the suite pins the defective bytes (parity with the stale Copilot pointer) and never checks that the path the pointer names resolves. A green suite cannot see this gap.

- timestamp: 2026-10-09T19:44Z
  checked: same class on the other non-Claude hosts (install/host-tools.ts:73-133 registry; install.ts:1680-1685, 2504-2664, 5324-5354; scratch target)
  found: Every non-Claude row has the same reachability gap after a scripted install:
    - Copilot (adapter copilot-pointer): .github/copilot-instructions.md = COPILOT_PTR, the same repo-relative path and no kit root. Same defect, same string.
    - Codex CLI and OpenCode (adapter none): they read AGENTS.md only, which names `agent-factory/roles/orchestrator.md` repo-relative and says the kit root is "resolved by the adapter only". No adapter exists, so they STOP the same way.
    - Gemini CLI (adapter gemini-settings): the installer only adds AGENTS.md to context.fileName, so the outcome is the same as Codex.
    - Adjacent, lower severity: the CLAUDE.md pointer (CLAUDE_PTR, install.ts:1675) is also repo-relative. On Claude Code the /grugops skill and the orchestrator agent resolve the kit, but a main-thread session that follows only the CLAUDE.md pointer would meet the same ENOENT.
  implication: one root cause covers 5 of 6 hosts. install/README.md:337-338 already says the open question "holds for every host CLI other than Claude Code". The UAT measured it on Pi.

## Resolution

root_cause: |
  After a scripted (two-root) install no non-Claude host is given the kit root, so an entry pointer that names a repo-relative kit path cannot work.
  (1) install/install.ts:1694-1701 writes PI_PROMPT_TEXT as COPILOT_PTR (install.ts:1682-1683): "grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator." That path is relative to the repository, and it has no kit-root slot by design (comment at install.ts:1692-1693, "not a resolver adapter").
  (2) The scripted install (v1.1 Phase 7 D-11) puts the kit only at $GRUGOPS_HOME/agent-factory and writes the resolved root only into the Claude Code adapters: the materialized KIT= block in .claude/skills/grugops/SKILL.md and .claude/agents/*.md. AGENTS.md may not name the kit home (check-kit-refs Assertion 3, negative half). agent-factory/packaging/slash-command.template.md:83-96 still says pointer bodies are "repo-relative pointer-text", with resolution in "ONLY two adapters".
  (3) AGENTS.md:40 ("The kit root is resolved by the adapter only ... STOP — do not hunt") correctly turns the missing path into a deterministic stop.
  Result: <repo>/agent-factory/roles/orchestrator.md never exists, Pi has no resolver, and the Orchestrator is never reached. The `--check` remedy reports ALL CHECKS PASSED, because the doctor never checks whether a non-Claude entry pointer resolves.
  The gap is older than Phase 34: COPILOT_PTR dates from Phase 5 (2026-06-03, in-repo kit) and was never updated for Phase 7's two-root layout. 34-RESEARCH Q7 recorded the gap as an [ASSUMED gap] and deferred it to backlog 999.4; Pi inherited it. The same defect class affects Copilot (same pointer string), Codex, OpenCode and Gemini (AGENTS.md only), and to a lesser degree the CLAUDE.md pointer on Claude Code.
why_not_caught: |
  - Tests: install.test.ts "Pi prompt template (plan 34-04)" pins the template bytes to the Copilot pointer line (parity), not reachability. No test asks whether the path a pointer names exists under the target after an install whose kit goes to a separate home.
  - Doctor: `--check` validates the kit under KIT_ROOT and the Claude adapters' KIT= agreement only.
  - Design: 34-RESEARCH Q7 deliberately deferred the question to backlog 999.4 as `UNKNOWN - verify`. No live run on a non-Claude host after a scripted install happened before this UAT.

fix:
verification:
files_changed: []

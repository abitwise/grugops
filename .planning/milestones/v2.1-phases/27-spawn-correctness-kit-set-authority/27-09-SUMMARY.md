---
phase: 27-spawn-correctness-kit-set-authority
plan: 09
subsystem: packaging
tags: [claude-code, subagents, adapters, entry-tiers, documentation, spawn]

requires:
  - phase: 27-06
    provides: the packaging template's coordinator body carrying the three tier labels (Full / Reduced / Degraded)
  - phase: 27-07
    provides: the generated coordinator adapter at .claude/agents/grugops-orchestrator.md with the 16-name grant
  - phase: 27-08
    provides: guard_adapter_body + the extended guard_wr05 tier-announcement beats
provides:
  - install/README.md §6 — the three entry tiers, the full-capability command, and the deliberate absence of main-thread wiring
  - agent-factory/packaging/adapters.md — the Claude Code row and a new prose block in the same tier vocabulary
  - a commanded assertion of the in-repo half of SPAWN-03 (adapter path, name, marker, 16-name grant, resolver slot)
  - an observed scratch-target install proving the coordinator adapter materializes an absolute kit line
affects: [phase-28-audit, phase-33-live-capture, install-docs, onboarding]

tech-stack:
  added: []
  patterns:
    - "One vocabulary, two surfaces: the tier labels live once in the packaging template and are quoted verbatim by both user-facing docs"
    - "Honest capability documentation: an unverified platform equivalence is written as UNKNOWN - verify, never as parity"

key-files:
  created: []
  modified:
    - install/README.md
    - agent-factory/packaging/adapters.md

key-decisions:
  - "install/README.md gains the entry-tier section as §6 (appended) rather than inserted as §4 — inserting would renumber the Safety section, and hooks/guard.ts:83 cites 'install/README.md §5' by number; a forward pointer near the top preserves discoverability without a cross-file renumber this plan is not allowed to make."
  - "The settings-key allowlist question is written as UNKNOWN - verify in both documents. The platform states the enumerated-allowlist rule for the --agent flag specifically; grugops writes no settings key (D-01), so nothing depends on the answer and no parity is asserted."
  - "The runtime half of SPAWN-03 is recorded as NOT PERFORMED and pending a named human. Steps 1-2 of the human check were genuinely executed and observed; steps 3-4 require an interactive session whose startup header no in-repo command can observe. An honest unverified item is the correct outcome; a fabricated pass would destroy the trace."

patterns-established:
  - "Verification split by observability: the automatable half is asserted as a command and passes; the unobservable half is named, scripted for the human, and left explicitly open."

requirements-completed: []  # SPAWN-03 is NOT marked complete — its runtime half is unverified (see Deferred / Pending Human Verification)

coverage:
  - id: D1
    description: "install/README.md §6 documents the three entry tiers in the coordinator's own vocabulary, names `claude --agent grugops-orchestrator` as the full-capability path, and records that no main-thread wiring is written into a target repository, with its reason"
    requirement: "SPAWN-03"
    verification:
      - kind: other
        ref: "grep -c 'claude --agent grugops-orchestrator' install/README.md -> 2"
        status: pass
      - kind: other
        ref: "tier-label extraction from install/README.md vs agent-factory/packaging/subagent.frontmatter.md, diffed -> identical {Degraded, Full, Reduced}"
        status: pass
      - kind: other
        ref: "node scripts/check-uat-oracles.js (oracleWr05Wording asymmetry over the 5-tool tables)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The Claude Code row and prose in agent-factory/packaging/adapters.md carry the same tier vocabulary while the four non-Claude-Code rows stay byte-identical"
    requirement: "SPAWN-03"
    verification:
      - kind: other
        ref: "md5 of the four non-CC table rows before/after edit -> a7b04c0c7ff036b63c58794887d86ab2 (unchanged)"
        status: pass
      - kind: other
        ref: "node scripts/check-uat-oracles.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "In-repo half of SPAWN-03: the coordinator adapter exists at project scope with the expected name, the coordinator marker, a 16-name grant whose every name resolves to an existing adapter file, and a resolver block with its installed-path slot"
    requirement: "SPAWN-03"
    verification:
      - kind: other
        ref: "grep -c '^name: grugops-orchestrator' -> 1; grep -c '^coordinator: true' -> 1; grant parse -> 16 names, 0 missing adapter files; GRUGOPS_HOME hits -> 1; slot line present at line 15"
        status: pass
      - kind: other
        ref: "node scripts/adapters-freshness.js -> 17 adapters, 0 byte differences, listings set-equal"
        status: pass
    human_judgment: false
  - id: D4
    description: "Runtime half of SPAWN-03: the coordinator adapter resolves under `claude --agent grugops-orchestrator` in a real session, the startup header names the agent, and a role agent actually resolves and runs"
    requirement: "SPAWN-03"
    verification:
      - kind: manual_procedural
        ref: "install/README.md §6 + 27-VALIDATION.md § Manual-Only Verifications; reproduction commands recorded in this summary"
        status: unknown
    human_judgment: true
    rationale: "The Claude Code runtime is the system under test. The startup header is an interactive TUI element and agent resolution is not observable from any in-repo command; a print-mode invocation would spend tokens without emitting the header. NOT PERFORMED by the executor and recorded as such."

duration: 15min
completed: 2026-07-28
status: complete
---

# Phase 27 Plan 09: Document the entry tiers and verify the coordinator resolves — Summary

**The three entry tiers are now documented in the coordinator's own vocabulary with the full-capability command named and no settings-parity claim made; the in-repo half of SPAWN-03 is asserted green by command, and the runtime half is left explicitly unverified rather than fabricated.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-28T20:10Z
- **Tasks:** 2 of 2
- **Files modified:** 2

## Accomplishments

- **`install/README.md` §6 "Entry paths — the three tiers, and what each one enforces"** — names `claude --agent grugops-orchestrator` as the full-capability path (the main thread takes the coordinator's system prompt and tool restrictions; roles scheduled in parallel to `queue.wip_limit`; the enumerated `Agent(...)` grant runtime-enforced on this path only; the agent name appears in the session startup header). The Reduced tier is stated plainly rather than softened: a default session has `Agent`, so it schedules in parallel, but declares no allowlist and therefore does not runtime-enforce the grant. The Degraded tier covers the four non-Claude-Code CLIs and a sub-agent at the nesting limit (where `Agent` is withheld, not an error).
- **The deliberate absence of main-thread wiring is documented with its reason** — the installer writes no `.claude/settings.json` `agent` entry in any form, not even sentinel-wrapped, because such an entry would make *every* session in that repository run as the grugops coordinator (including one opened only to fix a readme typo), and settings files are user content the installer never overwrites (D-01). No installer source file was touched.
- **The settings-parity claim is refused** — both documents describe the flag as the full-capability path and mark the settings-key allowlist question `UNKNOWN - verify`, because the platform states the enumerated-allowlist rule for the flag specifically.
- **Resolution facts recorded for the user** — project-scope adapters discovered by walking up from the working directory, identity from the frontmatter `name` only, and the `grugops-` prefix keeping all 17 names unique across a tree.
- **`agent-factory/packaging/adapters.md` brought into the same vocabulary** — the Claude Code row now names all three tiers, and a new "The three entry tiers (Claude Code)" prose block sits outside the table. The four non-Claude-Code rows are byte-identical to their pre-task values.
- **In-repo half of SPAWN-03 asserted by command, not by eye** — every check passed (below).
- **The installed-target half of the runtime check was genuinely executed** — a scratch install into a directory outside this repository, with a scratch `GRUGOPS_HOME`, produced 17 materialized adapters and a coordinator carrying an absolute kit line inside its `<!-- grugops:materialized-kit -->` sentinel block.

## Task Commits

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Document the three entry tiers and the deliberate absence of wiring | `e22e372` | `install/README.md`, `agent-factory/packaging/adapters.md` |
| 2 | Verify the coordinator resolves — in-repo automatically, at runtime by hand | *(no source change — verification task; evidence recorded here)* | — |

Task 2 is a verification task. Its action changes documentation only if the runtime observation contradicts Task 1; no runtime observation was obtained, so nothing was corrected and there was nothing to commit. Its deliverable is the recorded evidence in this summary.

## Verification Evidence — actual observed output

### Precondition

```
$ claude --version
2.1.220 (Claude Code)
```

v2.1.220 is above the advertised v2.1.219 floor (and outside the v2.1.217–v2.1.218 default-1 known-bad window), so the precondition holds and the check was not run on a version whose nesting default differs.

```
$ claude --help | grep -E '^\s*--agent'
  --agent <agent>                       Agent for the current session. Overrides
```

The flag exists on the installed release. This is evidence for the **flag**, not for agent resolution.

### In-repo half — all assertions passed

| Assertion | Observed |
|---|---|
| coordinator adapter exists at project scope | `.claude/agents/grugops-orchestrator.md` — EXISTS |
| `grep -c '^name: grugops-orchestrator'` | `1` |
| the documented command names that same agent | `grep -c 'claude --agent grugops-orchestrator' install/README.md` → `2` |
| `grep -c '^coordinator: true'` | `1` |
| grant size | `16` names |
| grant names without an adapter file | `0` — all 16 resolve to existing files under `.claude/agents` |
| `grep -c 'GRUGOPS_HOME'` | `1` |
| installed-path slot line | present at line 15: `# 1. (installed) the absolute kit path the installer wrote above this line.` |
| `node scripts/adapters-freshness.js` | exit 0 — *"Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal."* |
| `node scripts/check-foundation-guards.js` | exit 0, **0 FAIL lines** |
| `node scripts/check-kit-refs.js` | exit 0 — *"ALL CHECKS PASSED"* |
| `node scripts/check-uat-oracles.js` | exit 0 |
| `npm run freshness` / `npm run freshness:catalog` | exit 0 / exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **864 passed, 2 skipped** (32 files) — unchanged from the inherited baseline |

### Runtime half — steps 1 and 2 PERFORMED and observed

Scratch install, outside this repository, with an isolated kit home (the real `~/.grugops` was never touched):

```
$ GRUGOPS_HOME=<scratch>/spawn03-home node install/install.js --target <scratch>/spawn03-target --yes
...
== install complete ==

$ ls <scratch>/spawn03-target/.claude/agents/ | wc -l
17
```

The target's coordinator adapter carries a materialized absolute kit line inside the sentinel block, verbatim:

```
```sh
# <!-- grugops:materialized-kit -->
KIT="<scratch>/spawn03-home/agent-factory"
# <!-- /grugops:materialized-kit -->
# 1. (installed) the absolute kit path the installer wrote above this line.
```
```

and that path resolves — the kit directory and `agent-factory/roles/orchestrator.md` both exist inside it. The frontmatter (`name`, `coordinator: true`, the 16-name `Agent(...)` grant) survived materialization unchanged, confirming the strip-then-inject operates on body lines only.

### Runtime half — steps 3 and 4 NOT PERFORMED

**`UNKNOWN - verify`.** The following two claims are **not** verified by this plan:

1. The session startup header names `@grugops-orchestrator` when started with the documented command.
2. Asking the coordinator for work that routes to a specialist causes a role agent to resolve and run, rather than the coordinator doing the work inline.

- **Observed session header text:** *not observed — the check was not performed.*
- **Role agent that ran:** *none — the check was not performed.*
- **Installed Claude Code version:** **2.1.220** (observed).

**Why not performed:** the Claude Code runtime is the system under test, the startup header is an interactive TUI element, and no in-repo command can observe whether an agent resolved. A print-mode invocation would spend tokens without emitting the header, and the executor cannot honestly report a header it did not see. Per the phase's own doctrine — a green suite is not evidence for a spawn fix, and a fabricated verification destroys the trace that is the entire value proposition — this is recorded as open rather than asserted.

**Reproduction for the named human** (about two minutes; `<scratch>` is any directory outside this repo):

```sh
mkdir -p /tmp/grugops-spawn03 && cd /Users/olgeroeselg/Projects/public/grugops
node install/install.js --target /tmp/grugops-spawn03 --yes
grep -A2 'grugops:materialized-kit' /tmp/grugops-spawn03/.claude/agents/grugops-orchestrator.md
cd /tmp/grugops-spawn03
claude --agent grugops-orchestrator
#  -> confirm the startup header names @grugops-orchestrator
#  -> then ask for work that routes to one specialist (e.g. "map this repo")
#  -> confirm a role agent resolves and runs rather than the coordinator working inline
```

Record the observed header text and the role agent name against SPAWN-03 when done.

## Deviations from Plan

None. The plan executed as written, with one judgement recorded rather than deviated:

- **The §6 placement decision.** The plan asked for "an entry-paths section in `install/README.md`" without fixing its position. Inserting it as §4 would have renumbered the Safety section from §5 to §6, invalidating the cross-file citation at `hooks/guard.ts:83` (*"See install/README.md §5"*) — and Task 1's acceptance criterion requires the diff to list exactly the two documentation files. The section was therefore appended as §6 with a forward pointer added near the top of the file. No rule was bent; the alternative would have broken one.

## Known Stubs

None. No placeholder, mock, or empty-value code was written — this plan changed documentation only.

## Deferred / Pending Human Verification

| Item | Kind | Status | Owner |
|---|---|---|---|
| `claude --agent grugops-orchestrator` resolves the coordinator; the startup header names `@grugops-orchestrator` | unrun-verify (SPAWN-03 runtime half) | **open** | named human, before phase 27 closes |
| A role agent actually resolves and runs when the coordinator routes a subtask | unrun-verify (SPAWN-03 runtime half) | **open** | named human, before phase 27 closes |
| Whether the `.claude/settings.json` `agent` key enforces the enumerated allowlist as the flag does | `UNKNOWN - verify` (carried, not resolved) | **open, non-blocking** | nothing in grugops depends on it — D-01 removes the key from the install path |

**SPAWN-03 is therefore not marked complete in `REQUIREMENTS.md` by this plan.** Its documented half and its in-repo half are green; its runtime half is open. Marking the requirement complete on a green suite alone would repeat exactly the failure this phase exists to fix.

The three probe edges authored as `verification: backstop` truths (project-scope shadowing a stale user-scope copy, a clear failure when the adapter is absent, and nearest-directory precedence among nested definitions) all describe platform resolution behaviour no in-repo command can confirm. They abstain and escalate rather than passing silently — the correct outcome for claims about a runtime this repository does not own.

## Threat Flags

None. This plan introduced no network endpoint, auth path, file-access pattern, or schema change. The three mitigations the plan's threat register assigned to it were applied:

- **T-27-39** (documentation claiming settings-key parity) — mitigated: both documents describe the flag as the full-capability path and mark the settings-key question `UNKNOWN - verify`; a grep for parity phrasing over `install/README.md` returns nothing.
- **T-27-40** (installer writing main-thread wiring) — mitigated: `git diff --name-only` for Task 1 listed exactly `install/README.md` and `agent-factory/packaging/adapters.md`; no installer source file was touched in either task.
- **T-27-41** (recording an unperformed verification) — mitigated: the unperformed steps are named as unperformed, with the reason, and no assertion was adjusted to match a missing observation.

## Self-Check: PASSED

- `install/README.md` — FOUND, contains §6 and 2 occurrences of the full-capability command.
- `agent-factory/packaging/adapters.md` — FOUND, contains the tier prose; the four non-Claude-Code rows hash unchanged.
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-09-SUMMARY.md` — FOUND (this file).
- Commit `e22e372` — FOUND in `git log`.
- All gates re-run after the final state of the tree: foundation guards 0 FAIL, kit-refs / uat-oracles / adapters-freshness / freshness / freshness:catalog all exit 0, vitest 864 passed / 2 skipped.

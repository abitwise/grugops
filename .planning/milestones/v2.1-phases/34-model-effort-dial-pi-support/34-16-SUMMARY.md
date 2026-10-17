---
phase: 34-model-effort-dial-pi-support
plan: 16
subsystem: docs
tags: [pi, doc-1, wr-06, unknown-verify, style-dispositions]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "Pi prompt template (PI_PROMPT_TEXT, writePiPromptTemplate, plan 34-04); install guide section \"Using grugops on Pi\"; backlog 999.4"
provides:
  - "install/README.md \"Using grugops on Pi\": the one full statement that Pi kit discovery after a scripted install is UNKNOWN - verify (backlog 999.4)"
  - "agent-factory/packaging/adapters.md: the same UNKNOWN - verify in \"What grugops writes for Pi\", plus a pointer in the dispatch-map paragraph"
  - "Sibling pointers in README.md, agent-factory/README.md and CHANGELOG.md"
  - "docs/audit/29-style-dispositions/34-16.md: a row for every changed clause"
affects: [34-17, 34-18, backlog-999.4]

actuals:
  tokens: 4273
  tasks: 2
  commits: 2
plan_head_before: 0894a5146d2e1225a829e1b19061b0f9d57fe0c3
plan_head_after: b0dcd63155e2dbca361e1847ffc7276f1d2a0f40

tech-stack:
  added: []
  patterns:
    - "One full statement of a caveat in the install guide; every other site points at the section instead of restating it"

key-files:
  created:
    - docs/audit/29-style-dispositions/34-16.md
  modified:
    - install/README.md
    - agent-factory/packaging/adapters.md
    - README.md
    - agent-factory/README.md
    - CHANGELOG.md
    - .planning/phases/34-model-effort-dial-pi-support/deferred-items.md

key-decisions:
  - "The caveat says the open question holds for every host CLI other than Claude Code, because only Claude Code gets resolver adapters with the kit path written in; it is stated once in install/README.md and pointed at elsewhere (D-20)"
  - "README.md and agent-factory/README.md were outside the plan's file list but were WR-06 search hits that told the reader a non-Claude host reaches the kit after a scripted install; both got a pointer, placed outside the registered claim blocks so no registry companion edit was needed"
  - "The minimal-path claims (install/README.md section 1, registered claim C-28-034) were left unchanged and logged in deferred-items.md for human triage; they are about the markdown-copy path, not the scripted install"

patterns-established:
  - "Disposition rows for a watched file quote the clause as the gate splits it (by sentence within a physical line), not the whole sentence"

requirements-completed: [PI-02]

coverage:
  - id: D1
    description: "install/README.md and agent-factory/packaging/adapters.md each say Pi kit discovery after a scripted install is UNKNOWN - verify, with backlog 999.4; adapters.md points at \"Using grugops on Pi\""
    requirement: PI-02
    verification:
      - kind: other
        ref: "grep -n 999.4 install/README.md agent-factory/packaging/adapters.md"
        status: pass
      - kind: unit
        ref: "install/host-tools-prose.test.ts, install/host-tools.test.ts, scripts/check-uat-oracles.test.ts (71/71)"
        status: pass
    human_judgment: true
    rationale: "Whether the wording is clear and accurate for a user deciding if Pi works is a reading judgement no gate makes"
  - id: D2
    description: "Every WR-06 search hit that presented a non-Claude host reaching the kit after a scripted install carries the caveat or points at the guide"
    requirement: PI-02
    verification:
      - kind: other
        ref: "git grep WR-06 search (174 hits), each classified in this SUMMARY"
        status: pass
    human_judgment: true
    rationale: "Deciding which sentences state a host flow is a reading judgement; the classification table below is the evidence"
  - id: D3
    description: "Every changed clause in a watched document has a disposition row and the docs gates are green"
    verification:
      - kind: other
        ref: "npm run check:diff-disposition (0 findings over 40/40), check:public-docs, check:claim-anchors, check:banned-claims, check:nul-bytes, check:imperative-lexicon"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (103 files, 7435 passed, 2 skipped)"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-10-07
status: complete
---

# Phase 34 Plan 16: Pi kit-discovery caveat (WR-06) Summary

**The install guide and adapters.md now say that whether Pi finds the shared kit after a scripted install is `UNKNOWN - verify` (backlog 999.4). Four sibling sentences in README.md, agent-factory/README.md, adapters.md and CHANGELOG.md point at that statement or carry it.**

## Performance

- **Duration:** about 24 min
- **Started:** 2026-10-07T22:01:28Z
- **Completed:** 2026-10-07T22:25:21Z
- **Tasks:** 2
- **Files modified:** 7 (1 created)

## Accomplishments

- `install/README.md` "Using grugops on Pi" holds the one full statement. The template names the
  in-repository path `agent-factory/roles/orchestrator.md`. A scripted install puts the kit at
  `${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory`. `AGENTS.md` says STOP when the kit is absent. So
  kit discovery is `UNKNOWN - verify` (backlog 999.4) on every host CLI other than Claude Code, and
  no Pi run has confirmed the minimal markdown-copy path either.
- `agent-factory/packaging/adapters.md` "What grugops writes for Pi" carries the same
  `UNKNOWN - verify` with backlog 999.4 and a pointer to the guide section. The dispatch-map paragraph
  ("the entry file the host reads to reach ... orchestrator.md") also points at the guide now.
- Sibling sites: the README.md Quickstart, the agent-factory/README.md start-here section and the
  CHANGELOG `[Unreleased]` Pi entry.
- `docs/audit/29-style-dispositions/34-16.md` has 13 rows. `check:diff-disposition` reports 0
  findings over 40/40 watched files.
- `PI_PROMPT_TEXT` was not changed. No code changed.

## Task Commits

1. **Task 1 (tracer): caveat in the install guide and adapters.md, plus disposition file:** `056ee6df` (docs)
2. **Task 2: sibling pointers, disposition rows, deferred item, regression gate:** `b0dcd631` (docs)

**Plan metadata:** recorded in the final docs commit.

The tracer feedback gate re-ran Task 1's `<verify>` before Task 2 started. It passed: grep found 999.4 in both files, the five checks plus the build exited 0, and 71 of 71 targeted tests passed.

## WR-06 search: every hit and its action

Search: `git grep -n -i -e "/grugops" -e ".pi/prompts" -e "roles/orchestrator.md" -e "copilot-instructions" -- '*.md' ':!.planning' ':!docs/audit'`. It returned 174 lines. They fall into the groups below.

| Site (hits) | What the sentence says | Action |
|---|---|---|
| install/README.md:329-331 "Using grugops on Pi" (E1) | The command sends Pi to `AGENTS.md`, then `orchestrator.md` | **Caveat added** (Task 1), the one full statement |
| agent-factory/packaging/adapters.md:131-133 "What grugops writes for Pi" (E2) | Same sentence | **Caveat added** with pointer (Task 1) |
| agent-factory/packaging/adapters.md:53 dispatch map | The entry file each host reads "to reach" `orchestrator.md` | **Pointer added** (Task 2) |
| agent-factory/packaging/adapters.md:11, :35-40 (table), :72, :108-109, :156 | Entry rule; per-host entry file, adapter and dispatch mode; Pi's documented template convention (cited); Claude tiers; host-protection runnable | **Kept.** They state what is read or written: the Pi row matches `writePiPromptTemplate`, and the template facts are cited to Pi docs. Line 11 is the entry rule. The dispatch-map pointer and the Pi-section caveat cover the reach question |
| install/README.md:289 Copilot pointer bullet (E3) | Install writes an optional `.github/copilot-instructions.md` pointer | **Kept.** It states only what install writes (`COPILOT_PTR`). It makes no claim that Copilot reaches the kit |
| install/README.md:292-298 Pi template bullet | Template content and ledger behaviour | **Kept.** It states what install writes (`PI_PROMPT_TEXT`, `writePiPromptTemplate`) and already points at "Using grugops on Pi" |
| install/README.md:23 (§1 minimal path), :61, :70-71, :251-256, :287-288, :333-342, :377-380, :396-397, :502, :566, :589, :593-594, :889-913, :1028, :1200-1202 | Minimal path; kit-home override; Claude adapters and resolver materialization; tools/grugops; Pi start-dir and trust facts (cited); uninstall behaviour; plugin form; Reduced tier | **Kept.** Each states what install or uninstall does (code-backed), Claude-only behaviour, or cited Pi facts. §1 is the minimal path (see Deferred) |
| agent-factory/packaging/slash-command.template.md:94 (E4) | Pi gets a plain pointer template, not a resolver adapter | **Kept.** It states what the installer writes (`writePiPromptTemplate`, `PI_PROMPT_TEXT`) and claims no flow |
| agent-factory/packaging/slash-command.template.md:34, :57, :71-89 | Claude skill bodies and namespacing | **Kept** (Claude Code only) |
| examples/01-greenfield-bootstrap.md:37 (E5) | An install today also writes the Pi pointer | **Kept.** It states what install writes and already points at "Using grugops on Pi" |
| examples/01:18, :30; examples/02:19; examples/03:23, :27, :66, :189; examples/04:19; examples/05:20-24 | Recorded runs and Claude command forms | **Kept** (records of runs, or Claude Code only) |
| CHANGELOG.md:61 `[Unreleased]` Pi entry (E6) | Pi supported, template points Pi at the Orchestrator | **Caveat added** with backlog 999.4 and the pointer |
| CHANGELOG.md:41, :165, :300, :531-536 | tools/grugops runnable, the coordinator grant, compare links | **Kept** (not host-flow statements) |
| CLAUDE.md:54, :60, :66, :107, :108, :166, :212 (E7) | Stack notes, minimal path, per-host entry-file table (cited), start-here line | **Kept.** The Pi row (:108) states what Pi reads and where it loads templates, cited to Pi source. :60 is the minimal path |
| README.md:20, :44 | Invoke `/grugops` "in your coding agent" after the scripted install | **Pointer added** at Quickstart step 2 (line 47). It names the hosts the installer writes `/grugops` for (`.claude/skills/grugops/SKILL.md`, `writePiPromptTemplate`) and points at the guide. The top-of-page snippet (:20) is covered by the Quickstart sentence below it |
| README.md:32-39, :48, :53-62 | Install commands, plugin colon form, Claude example commands | **Kept** (code-backed, or labelled Claude Code) |
| agent-factory/README.md:31-34 note `C-28-026` ("works everywhere") | Pointing the agent at the in-repo `orchestrator.md` works everywhere | **Pointer added** after the registered block (lines 39-41). The registered text is unchanged; the registry measures "works everywhere" as the minimal markdown-copy path |
| agent-factory/README.md:21-23, :54, :55 (E7), :144, :161 | Start-here instruction, per-host table rows (entry file + template), minimal path, plugin form | **Kept.** They state what is read or written; :144 is the minimal path (see Deferred) |
| docs/faq.md (E7) | "adapters for ... Pi" (not a search hit; read per E7) | **Kept** (states that adapters exist) |
| AGENTS.md:11, :17 | Read order; the same file holds the STOP rule | **Kept** (substrate instruction, not a behaviour claim) |
| .claude/agents/*, .claude/skills/*, skills/*, agent-factory/packaging/subagent.frontmatter.md, agent-factory/roles/orchestrator.md:29, docs/dogfood-human-runbook.md, docs/design/shared-install.md:45 | Claude Code adapter bodies and Claude runbook | **Kept** (Claude Code only, where resolver adapters carry the kit path) |
| agent-factory/workflows/05, 12; agent-factory/checklists/browser-uat-recipe.md; agent-factory/config/factory.config.md:207; docs/GUARANTEES.md; docs/catalog/README.md | tools/grugops runnables, git-host floor, a catalog link | **Kept** (not host-flow statements) |
| docs/initial/agent_factory_builder_spec_v2.md (12 hits) | The original v2 input specification | **Kept.** It is the historical input spec, not a statement of current behaviour |

## Files Created/Modified

- `install/README.md`: the authoritative caveat paragraph in "Using grugops on Pi"
- `agent-factory/packaging/adapters.md`: caveat in the Pi section; pointer in the dispatch-map paragraph
- `README.md`: Quickstart step 2 names the hosts that get `/grugops` and points at the guide
- `agent-factory/README.md`: pointer paragraph after the `C-28-026` note
- `CHANGELOG.md`: caveat in the `[Unreleased]` Pi entry
- `docs/audit/29-style-dispositions/34-16.md`: judgement prose and 13 disposition rows
- `.planning/phases/34-model-effort-dial-pi-support/deferred-items.md`: one entry (minimal-path claims)

## Decisions Made

- The caveat applies the open question to every host CLI other than Claude Code. Backlog 999.4 states
  it for the non-Claude hosts, and on Claude Code the installer writes the kit path into the resolver
  adapters (install/README.md "What the installer touches").
- `README.md` and `agent-factory/README.md` were changed although the plan did not list them. The
  plan allows this: "If a search hit outside this plan's files needs a change, add it and name the
  file in the SUMMARY". Both pointers sit outside the registered claim blocks. `check:claim-anchors`
  stays green, and no registry companion edit was needed.

## Deviations from Plan

### Scope additions the plan allowed

**1. [Rule 2 - DOC-1 sibling] Pointers in README.md and agent-factory/README.md**
- **Found during:** Task 2 (the WR-06 search)
- **Issue:** README.md Quickstart step 2 told the reader to invoke `/grugops` "in your coding agent"
  after the scripted install. The registered note in agent-factory/README.md says that pointing the
  agent at the in-repo `orchestrator.md` "works everywhere". Neither sentence holds after a scripted
  install on a host other than Claude Code.
- **Fix:** each file got a sentence that points at install/README.md "Using grugops on Pi". README.md
  also names the hosts the installer writes `/grugops` for. Both files are in the watched corpus, so
  each changed line-clause has a row in 34-16.md.
- **Files modified:** README.md, agent-factory/README.md, docs/audit/29-style-dispositions/34-16.md
- **Verification:** check:diff-disposition (0 findings over 40/40), check:claim-anchors, full suite
- **Committed in:** b0dcd631

**2. [Rule 2 - DOC-1 sibling] Pointer in the adapters.md dispatch-map paragraph**
- **Found during:** Task 2
- **Issue:** the paragraph says each host reads an entry file "to reach" `orchestrator.md`, with no
  caveat for a scripted install.
- **Fix:** added a pointer sentence. The file was already in the plan's list (for E2).
- **Committed in:** b0dcd631

---

**Total deviations:** 2. Both are sibling pointers the plan allowed. **Impact on plan:** prose only;
no code and no `PI_PROMPT_TEXT` change.

## Issues Encountered

- The first Task 2 run of `check:diff-disposition` named 4 clauses with no row (README.md 2,
  agent-factory/README.md 2). The gate splits clauses by sentence within a physical line, so one
  row first quoted a whole line that held two sentences. The row now quotes only the first sentence,
  and the gate passes.
- The full suite prints `FAIL` lines from the fixtures of tests that expect a red result. vitest
  exited 0: 103 of 103 files passed, 7435 tests passed, 2 skipped.

## Deferred Issues

- Logged in `deferred-items.md` ("From plan 34-16"): `install/README.md` §1 ("works for every
  supported tool") and the registered claim `C-28-034` ("works for any tool") state that the
  minimal path works on every host, and no per-host run backs this. This plan's caveat says, as
  required, that no Pi run has confirmed the minimal path. The two statements do not contradict
  each other, but DOC-1 asks for a run or `UNKNOWN - verify`. That needs human triage, together
  with backlog 999.4.

## Verification (final tree)

- `grep -n 999.4 install/README.md agent-factory/packaging/adapters.md`: hits in both files
- `npm run check:public-docs`, `check:claim-anchors`, `check:banned-claims`, `check:diff-disposition`, `check:nul-bytes`, `check:imperative-lexicon`: all exit 0
- `npm run build`: exit 0. `npm run check:build-parity`: exit 0. `npm run typecheck`: exit 0
- `npx vitest run --exclude '**/scripts/e2e/**' install/host-tools-prose.test.ts install/host-tools.test.ts scripts/check-uat-oracles.test.ts`: 3 files, 71/71 passed
- `npx vitest run --exclude '**/scripts/e2e/**'`: 103 files passed, 7435 tests passed, 2 skipped, exit 0
- `npm test` was not run, and nothing was pushed

## User Setup Required

None.

## Next Phase Readiness

- Plan 34-17 (WR-07 and the twelve review dispositions) is next. It can record WR-06 as fixed by commits `056ee6df` and `b0dcd631`.
- Backlog 999.4 (a per-host run of kit discovery after a scripted install) stays open. The docs now say so.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-07*

## Self-Check: PASSED

Files exist (34-16.md, install/README.md); commits 056ee6df and b0dcd631 are ancestors of HEAD; acceptance criteria re-run on the final tree (grep 999.4 in both files, pointer to "Using grugops on Pi" in adapters.md, all docs gates exit 0).

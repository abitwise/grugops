---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
reviewed: 2026-10-30T01:08:36Z
depth: standard
files_reviewed: 64
files_reviewed_list:
  - agent-factory/checklists/00-index.md
  - agent-factory/checklists/complexity-rubric.md
  - agent-factory/config/factory.config.md
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/roles/designer.md
  - agent-factory/roles/frontend-ui.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/software-engineer.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/14-ui-design-to-build.md
  - docs/audit/28-disposition-register.md
  - docs/audit/28-safety-surface-exclusions.md
  - docs/audit/29-style-dispositions/39-05.md
  - docs/audit/29-style-dispositions/39-06.md
  - docs/audit/29-style-dispositions/39-07.md
  - docs/audit/29-style-dispositions/39-08.md
  - docs/audit/29-style-dispositions/39-09.md
  - docs/catalog/README.md
  - hooks/hook-entry.ts
  - install/README.md
  - install/agents-record.test.ts
  - install/install.test.ts
  - install/install.ts
  - install/installer-cross-version.test.ts
  - install/installer-never-installed.test.ts
  - install/installer-special-files.test.ts
  - install/installer-user-edit.test.ts
  - install/mode-census.test.ts
  - install/record-truth.test.ts
  - install/uninstall-removal.test.ts
  - scripts/adapter-byte-baseline.test.ts
  - scripts/adapters-freshness.test.ts
  - scripts/adapters-freshness.ts
  - scripts/admission-protocol-docs.test.ts
  - scripts/audit-prepass.test.ts
  - scripts/board-readonly.test.ts
  - scripts/canonical-frontmatter.test.ts
  - scripts/canonical-frontmatter.ts
  - scripts/capture-live.test.ts
  - scripts/capture-live.ts
  - scripts/check-audit-register.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-imperative-lexicon.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/checkpoints.test.ts
  - scripts/checkpoints.ts
  - scripts/context-io.test.ts
  - scripts/fixtures/role-skills.md
  - scripts/frontmatter.test.ts
  - scripts/generate-catalog.test.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/kit-model.test.ts
  - scripts/kit-model.ts
  - scripts/model-dial-consistency.test.ts
  - scripts/model-tiers.test.ts
  - scripts/model-tiers.ts
  - scripts/tier-kit-text.test.ts
  - scripts/trace-instructions.test.ts
  - scripts/uat-gate-exit-contract.test.ts
  - scripts/validate-agent-factory.ts
findings:
  critical: 2
  warning: 10
  info: 6
  total: 18
status: issues_found
---

# Phase 39: Code Review Report

**Reviewed:** 2026-10-30T01:08:36Z
**Depth:** standard
**Files Reviewed:** 64
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

Scope: every file in the config list, read against `git diff 8a530552 HEAD`. The review checked the TypeScript tooling and the new kit text.

The TypeScript side is careful. That covers `listAgentAdapterSpecs`, `resolveAdapterAssignments`, the per-adapter freshness and value guards, the `ROLE_CEILINGS` two-way key check, `admitRole`/`roleSkillsOf`, the stale-adapter report and the decider manifest hashes. Traced edge cases held: duplicate stems, case-folded collisions, a leveled coordinator, an illegal override, an empty spec set and a broken LEVELS table. The recomputed hashes for `scripts/checkpoints.js` and `scripts/kit-model.js` match `hooks/hook-entry.ts`.

The defects are mostly in what the new kit text tells agents to do:
- The Designer cannot reach the shared context it is defined by.
- Workflow 04's escalation steps re-enqueue past a human checkpoint that its own stop condition requires.
- Several level and escalation rules disagree between the role files, the rubric and the workflow.

The installer's retired-adapter report also stays silent for installs older than the kit ledger, while the README says those installs are covered.

## Critical Issues

### CR-01: The Designer has no shell, so it cannot read or publish the notes that are its whole output

**File:** `agent-factory/roles/designer.md:4` (also `.claude/agents/grugops-designer.md:4`, generated)
**Issue:** The Designer declares `capabilities: read edit`, so its adapter's tools are `Read, Grep, Glob, Edit, Write`. Every one of its outputs is a typed Workflow 16 note (lines 38, 45), and its Reads pull the product context "per Workflow 16" (line 22).

Workflow 16 allows only one route. It reads through `context-io.ts` (`readContext` / `render`, steps 1 and 27) and writes only through the sanctioned writer, step 3. A note written with a file tool is refused as `unsealed`. The plugin MCP route (`propose_note`) is given only to the coordinator. `scripts/generate-role-adapters.ts:174-181` records that nested role sessions "do not receive plugin MCP tools at all ... and reach the sanctioned writer in-process", which means `node scripts/context-io.js ...` through Bash.

The Designer has no Bash, so on Claude Code it can neither render the context nor admit a note. Its only options are a hand-written note (refused) or no output. Every other note-publishing role (all 18) carries `shell`. Workflow 14 step 1 depends on these notes, and so does every token Frontend/UI reads (Workflow 14 step 2 and its new stop condition). The planned tests pin `read edit` (`scripts/tier-kit-text.test.ts:249`), so the suite passes over a role that cannot do its one job.
**Fix:** Give the Designer the same write route as every other role:
```markdown
capabilities: read edit shell
```
Then regenerate the adapters and update the T-39-21 mitigation and the D-27 test to `read edit shell`. If the "no shell" posture is deliberate, the role needs a stated route to Workflow 16 that exists for a shell-less sub-agent. None exists today.

### CR-02: Workflow 04's escalation steps re-enqueue an exhausted gate without the named-human confirmation its stop condition requires

**File:** `agent-factory/workflows/04-ticket-to-pr.md:40-42` vs `:60`, and `agent-factory/workflows/05-pr-quality-gate.md:70`
**Issue:** Workflow 05's stop condition for an exhausted self-fix budget is "`BLOCKED_NEEDS_FIX`. Stop and hand to a human. `checkpoint: exhaust_self_fix_budget`".

Workflow 04 now sends that same case down an agent path:
- step 14 records a `failed-attempt` note and moves the ticket to `Blocked`;
- step 15 has the Tech Lead pick a move and "Return the ticket to `Ready for Dev`";
- step 16 has the Orchestrator create a new `pending/` subtask and spawn the adapter.

None of steps 14-16 mentions a human. The named-human confirmation appears only in the stop-condition bullet at line 60: "A named human confirms the Tech Lead's decision before the re-enqueue, per Workflow 05". Workflow 05 says nothing of the kind. It says stop and hand to a human, with no Tech Lead decision first.

An agent following the numbered steps re-enqueues past a tagged human checkpoint. The checkpoint census (`scripts/checkpoints.ts`, `exhaust_self_fix_budget` 5 -> 6) counts the tag as present, so the gate reports the human stop as covered while the procedure walks past it. This is the "humans decide, agents execute" rule being bypassed in the procedure text itself.
**Fix:** Put the human stop into the steps, on the gate-failure branch, before any re-enqueue. Make the Workflow 05 reference accurate:
```markdown
15. Read the `failed-attempt` note (Tech Lead). Choose one: ... Record the move in a new `decision` note per Workflow 16.
    When the note came from a gate `BLOCKED_NEEDS_FIX` (self-fix budget spent), stop: a named human confirms the decision before the ticket returns to `Ready for Dev`. `checkpoint: exhaust_self_fix_budget`
16. Create a new `pending/` subtask ... only after step 15's move is recorded and, on the gate-failure branch, confirmed by the named human.
```
Also either amend Workflow 05 line 70 to name the Tech Lead step, or reword line 60 so it does not claim Workflow 05 says so.

## Warnings

### WR-01: The Tech Lead's re-plan loop has no bound, and a re-score is an uncounted second escalation

**File:** `agent-factory/roles/tech-lead.md:34,48`; `agent-factory/workflows/04-ticket-to-pr.md:41,61`
**Issue:** Only "escalate one level" is capped ("at most once per ticket"). "Re-plan and re-score", "split" and "return to the Architect" have no bound, and "used up" (line 61) requires all of them to be "blocked", which nothing ever declares. So BLOCKED -> re-plan -> BLOCKED -> re-plan can cycle forever without reaching the `escalate_unadjudicable_result` human stop.

A re-score can also raise the level: junior -> re-score -> mid -> BLOCKED -> escalate -> senior. That is two level raises on one ticket, which defeats "Never escalate a ticket twice" (line 48).
**Fix:** Bound the Tech Lead's moves per ticket. For example: "at most one escalation and at most one re-plan per ticket; a re-score that raises the level counts as the escalation; the next `failed-attempt` after both are spent is 'options used up'." Pin the bound in `scripts/tier-kit-text.test.ts`.

### WR-02: The junior stop rule names four of the seven F3 = 2 tags and none of the F3 = 1 tags

**File:** `agent-factory/roles/software-engineer.md:37`
**Issue:** The rubric makes junior impossible for any F3 ≠ 0. That covers auth, money, PII, security, migration, concurrency and test integrity at F3 = 2, plus data writes, public interface and config at F3 = 1 (`complexity-rubric.md:18,31,36-37`). The LEVELS rationale says the same: "carries no risk tag".

The junior reads only this sentence: "A junior that meets security, migration, concurrency or test-integrity work stops and reports `BLOCKED`." A junior that finds mid-task that its change touches auth, money, PII, a data write or a public interface is not told to stop. That surface is exactly the one the D-2 haiku amendment says never reaches junior. The rubric is scored before the work, so a mis-scored ticket has only this sentence as a backstop.
**Fix:** Make the junior's stop rule cover every risk tag:
```markdown
A junior that meets any risk-tagged work (any F3 tag in the rubric: auth, money, PII, security, migration, concurrency, test integrity, data writes, a public interface or config) stops and reports `BLOCKED`.
```

### WR-03: The three level adapters have near-identical routing descriptions, so auto-delegation can pick junior outside the Tech Lead path

**File:** `scripts/generate-role-adapters.ts:477` (output: `.claude/agents/grugops-software-engineer-{junior,mid,senior}.md:3`)
**Issue:** The descriptions differ only in a trailing `Level: junior.` / `mid.` / `senior.`, and each still says "Use when: Need code (one ticket)." `description` drives Claude Code's auto-delegation. On the Reduced tier and in any ordinary main-thread session, a request for code can be routed straight to `grugops-software-engineer-junior` (haiku) with no Tech Lead score. That includes security or migration work, the case D-2 excludes. The old single adapter was `inherit`, so auto-delegation could not drop the model below the session's.
**Fix:** Make the level adapters non-routable except by name. For example, emit a level description of the form "Engineer at the junior level. Use only when the Tech Lead's plan names `grugops-software-engineer-junior`; never for unscored work." Also consider routing unscored "Need code" requests to the Tech Lead.

### WR-04: The engineer's escalation trigger ("the gate fails a second time") disagrees with Workflow 04 and the self-fix dial

**File:** `agent-factory/roles/software-engineer.md:39` vs `agent-factory/workflows/04-ticket-to-pr.md:40,60`
**Issue:** The role says to publish a `failed-attempt` note "when you are blocked, or the gate fails a second time". Workflow 04 triggers on "the gate ends `BLOCKED_NEEDS_FIX` after its bounded self-fix, for an agent-fixable reason", and Workflow 05 bounds that by the configurable `self_fix_attempts`. These are different events. With `self_fix_attempts` other than one, or with a human-only failure (which Workflow 04 says never takes this path), the engineer escalates at a different point from the one the workflow and the checkpoint tag describe.
**Fix:** Use the workflow's trigger word for word: "When you are blocked, or the gate ends `BLOCKED_NEEDS_FIX` after its bounded self-fix for an agent-fixable reason, publish a `failed-attempt` note per Workflow 04."

### WR-05: Routing-matrix entry "plan -> Tech Lead" collides with product planning

**File:** `agent-factory/roles/orchestrator.md:46`
**Issue:** "plan" is the name of the `idea-to-epics` / `epic-to-tickets` entry (`/grugops-plan`: "Plan work ... turn an idea into epics, or turn an epic into ready tickets"), which BA/PM owns. The matrix now maps the bare subtask "plan" to the Tech Lead. A coordinator classifying "plan the checkout feature" can route product decomposition to a role whose job is scoring a ready ticket. That role has no product-intake instructions.
**Fix:** Name the subtask precisely: `dev plan / level for a ready ticket -> Tech Lead`.

### WR-06: The retired-adapter report is silent for installs whose ledger is not `ok` or predates kit-file records, while the README says those installs are covered

**File:** `install/install.ts:8586` (and the doctor gate at `:2905`); claim at `install/README.md:168-186,2082-2084`
**Issue:** `reportStaleKitAdapters` returns with no output when `PREVIOUS_LEDGER.state !== "ok"`. `staleKitAdapters` only looks at ledger entries with `kit: true`. Kit files were first recorded in the ledger by plan 33.1-30 (late September 2026). The v2.1 installer has no `KIT_FILES` (`git show v2.1:install/install.ts | grep -c KIT_FILES` returns 0).

A repository installed by v2.1 or earlier that upgrades straight to this release has `.claude/agents/grugops-software-engineer.md` on disk and no kit record for it. Install and `--check` then say nothing, not even the "skipped" note the unreadable-source case prints. Claude Code still loads the file. The README states without qualification: "A repository installed before the level adapters existed still holds `.claude/agents/grugops-software-engineer.md`. Install and `--check` name it". That claim is not true for those installs.
**Fix:** When the ledger is not `ok`, or has no kit-true adapter entries, print a note in the same style as `staleAdaptersSkippedText`. Say that the check could not run and name `.claude/agents/grugops-software-engineer.md` as a file to check by hand. A pure presence report needs no ownership claim. Also qualify the README sentence ("installed by v2.2 or later"), or add the note and say so.

### WR-07: The rubric scores "the dev plan", but the Tech Lead scores before it writes the dev plan

**File:** `agent-factory/roles/tech-lead.md:31-32`; `agent-factory/checklists/complexity-rubric.md:16-17,46`
**Issue:** F1 is "Count the dev plan's file list", F2 is "Read the dev plan", and "A dev plan with no file list scores F2 = 2". The Tech Lead's numbered responsibilities score first (2) and write the dev tasks second (3). Workflow 04 step 2 also lists "Assess ... Record the six scores ... and dev tasks" in that order. Followed literally, the score is taken when no file list exists, so F2 = 2. That sends every ticket back to `In Design` (mapping rule 2).
**Fix:** Swap responsibilities 2 and 3 (write the dev tasks, then score them), or have the rubric score the Architect's notes and the ticket where no plan exists yet. Make Workflow 04 step 2 use the same order.

### WR-08: The Designer reads no existing design in a brownfield repository

**File:** `agent-factory/roles/designer.md:19-24`; `agent-factory/workflows/14-ui-design-to-build.md:265`
**Issue:** Workflow 14 step 1 runs the Designer on "any UI ticket that arrives with no published guidelines". In a brownfield repository that is the first UI ticket after install, in an app that already has a palette, a type scale and components. The Designer's Reads list only the product context, the architecture notes, earlier Designer notes and the accessibility checklist. Nothing tells it to read the brownfield map or the existing styles/tokens. Its prompt is "pick color and stone size once for whole cave". It can therefore set a new token system that Frontend/UI must follow ("never name a new token"), which conflicts with the shipped UI.
**Fix:** Add a Read: "In an existing codebase, the Brownfield Mapper's notes and the repo's current styles/tokens; record the existing system as the starting direction rather than replacing it."

### WR-09: The two lists of run-time settings that flatten the levels disagree, and the text is not single-sourced

**File:** `agent-factory/config/factory.config.md:174-180` vs `install/README.md:2066-2080`
**Issue:**
- `factory.config.md` says "three run-time settings" and lists the spawn-call parameter (with `CLAUDE_CODE_EFFORT_LEVEL`), `CLAUDE_CODE_SUBAGENT_MODEL` (with the pre-v2.1.251 note) and `availableModels`.
- `install/README.md` lists four: it adds "an installed mod's `agent.spawn` hook", and drops `CLAUDE_CODE_EFFORT_LEVEL` and the pre-v2.1.251 behaviour.

This is a fact about Claude Code precedence stated twice, and the two copies have already drifted. The mod-hook item also cites no source line in either document.
**Fix:** Keep one list (factory.config.md is the dial's documented home), add the mod-hook item there with its source or mark it `UNKNOWN - verify`, and make the README point to it.

### WR-10: No changelog entry for a release-visible, partly breaking change

**File:** `CHANGELOG.md:19` (`[Unreleased]` — untouched by this phase)
**Issue:** This phase:
- adds two roles;
- retires the adapter name `grugops-software-engineer` in favour of three level adapters (an existing upgrade keeps loading the old file; see WR-06);
- changes the zero-config answer for engineer work from `inherit` to pinned `haiku`/`sonnet`/`opus`, so a zero-config user's session model choice no longer holds for the engineer;
- removes the `software-engineer` TIERED row.

The project committed to the SemVer break contract from 2.1.0, and Keep a Changelog is the declared format. `[Unreleased]` has no Added, Changed or Removed line for any of these changes.
**Fix:** Add Added (Tech Lead, Designer, complexity rubric, level adapters), Changed (the zero-config engineer pins; `models.roles` keys for the level stems) and Removed (`grugops-software-engineer` adapter; the remedy is to delete it by hand). Have the human decide whether retiring an adapter name is a MAJOR bump.

## Info

### IN-01: Stale docblock in `tieredCorpusRefusals`

**File:** `scripts/model-tiers.ts:1409-1414`
**Issue:** Says the guard "still passes [role stems] until plan 39-02 switches it to the derived list". Plan 39-02 has landed: `check-foundation-guards.ts` passes `presetGovernedStems(specs)`.
**Fix:** Drop the "until plan 39-02" clause.

### IN-02: `LEVEL_COUNT` is called a two-sided pin, but only tests read it

**File:** `scripts/model-tiers.ts:1550-1552`
**Issue:** No guard or library function reads `LEVEL_COUNT`. `guard_kit_counts` compares level tokens with the LEVELS rows, not with this constant. The pin binds only through `model-tiers.test.ts`.
**Fix:** Either assert `LEVELS.length === LEVEL_COUNT` in `guard_kit_counts` beside `LEVELED_ROLE_COUNT`, or describe it as test-only.

### IN-03: The held-record carry in `reportStaleKitAdapters` repeats an existing carry

**File:** `install/install.ts:8593`
**Issue:** `nextLedgerEntries` (`:6309-6315`) already carries every previous kit-true entry that still holds its record when the kit was written, and every kit entry verbatim when it was not. So `recordKitFile(..., s.record)` writes the same record a second way. It is harmless today, but there are now two carry paths for one fact.
**Fix:** Rely on the existing carry rule and drop the `recordKitFile` call, or note at the call that it repeats that rule.

### IN-04: A non-ENOENT `lstat` error is reported as a user-edited adapter

**File:** `install/install.ts:932-936`
**Issue:** An `EACCES`/`EPERM` from `lstatSync` falls through to `out.push`, and `owns()` will usually answer not-owned. The user is then told the adapter "you have since edited or replaced, so it is yours", which is not established.
**Fix:** On any other error code, push a separate "could not be inspected (<code>)" finding.

### IN-05: The coordinator adapter is now past the warn tier

**File:** `agent-factory/packaging/subagent.frontmatter.md:152-156`
**Issue:** It measures 3368 B against the 3072 B warn tier and the 4096 B fail tier. Configured effort lines and each new role in the grant add bytes. The phase records this, but the warn tier is now permanently red, so it no longer flags new growth.
**Fix:** Set a re-measured warn baseline or a shorter grant rendering before the next role lands.

### IN-06: The XL / file-plan split stop names no owner for leaving `Ready for Dev`

**File:** `agent-factory/workflows/04-ticket-to-pr.md:57`
**Issue:** The Tech Lead runs while the ticket sits in `Ready for Dev` (line 217), but the stop says it "goes back to BA/PM for splitting before it can enter `Ready for Dev`". It has already entered, and no role is named as owning the move out.
**Fix:** "... `SPLIT_REQUIRED`: the Tech Lead moves it back to `Backlog` for BA/PM to split."

---

_Reviewed: 2026-10-30T01:08:36Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-13T19:23:49Z
depth: standard
diff_base: c2ae41c19d862d14fece952ee83a10e8b06bba1f
files_reviewed: 7
files_reviewed_list:
  - CHANGELOG.md
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/workflows/06-uat-pack.md
  - docs/audit/29-style-dispositions/41-27.md
  - docs/audit/29-style-dispositions/41-28.md
  - install/README.md
  - scripts/flow-guidance-text.test.ts
findings:
  critical: 0
  warning: 3
  info: 7
  total: 10
status: issues_found
---

# Phase 41: Code Review Report (incremental, plan 41-28)

**Reviewed:** 2026-11-13T19:23:49Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This is an incremental review of `git diff c2ae41c1..HEAD`, which is gap-closure plan 41-28. The plan fixes CR-01, WR-01
and WR-02 of the review at 2026-11-13T13:44:33Z. It also carries forward the open findings of that review that still hold.

What I checked:
- `scripts/flow-guidance-text.test.ts` passes: 164 tests.
- I checked each new claim against the shipped code:
  - `hooks/admission-guard.ts:275`, `:286-287` and `:314-316` call `allow()` for any note `isGatedNote` does not gate.
  - `isGatedNote` (`scripts/context-io.ts:6726-6744`) returns false at `off`, true at `all`, and at `high-severity`
    returns `isHighSeverityRole(by)` over `HIGH_SEVERITY_ROLES` (`:4305`).
  - A missing `human_admission` reads as `off` (`factory.config.md:94`, `:285`).
  - `hooks/hooks.json` matches only `mcp__(plugin_grugops_)?grugops__.*`, so `note.js` run through Bash passes no hook.
  - `install/README.md` has no other sentence that puts a hook on a scripted install (`:1937-1943` are correct).
- I copied the scan code into a scratch harness and tried 26 sentences against it.
- The row counts and line references in `41-28.md`, and the sentence references in the `41-27.md` pointer, match the tree.

**CR-01 (prior):** fixed. Each new sentence in Workflow 06, the recipe and the changelog is true against the code. The
recipe is now complete. Workflow 06 and the changelog still leave out the `high-severity` case (WR-01 below), so the fix
is complete only for the default dial.

**WR-01 (prior):** fixed. The new install-guide clause is accurate, and no other sentence in the guide implies a scripted
install has a hook.

**WR-02 (prior):** partly fixed. The rebuilt scan does catch every fixture it lists, and it now reads all six files with a
presence check on each. But two of its checks are keyword tests on the whole sentence or the whole block, not checks on
the claim itself. As a result, the exact CR-01 paragraph passes once its paragraph names `human_admission` anywhere, and
the reverse of CR-01 passes once its sentence contains any denial phrase. The comment that lists the scan's limits names
neither gap (WR-02 below). The word-for-word pins still guard today's text, so this weakens the regression guard but does
not hide a defect that is in the tree now.

Carried forward: four prior items still hold in files of this review: IN-01 (the changelog pin is still not tied to its
section), IN-02, IN-03 and IN-04. Two older open items, WR-03 and IN-05, still hold in files outside this review's scope.

## Warnings

### WR-01: Workflow 06 and the changelog still leave out `high-severity`, where the lane's finding is usually not gated

**File:** `agent-factory/workflows/06-uat-pack.md:37`, `CHANGELOG.md:192-194`
**Issue:** Both now say the hook checks the name "only on a finding ... that the `human_admission` dial gates", then
"At the default `off` the dial gates no note". A reader who has set `high-severity` will take the contrast to mean their
dial gates the witness finding, so they hold the binding. They do not. At `high-severity`, `isGatedNote` gates a finding
only when its agent-supplied `by` is `security-nfr`, `architect-design` or `release-manager`
(`context-io.ts:6741`, `:4305`). The Orchestrator writes the witness finding, and no file names its `by` as one of these
roles. So at `high-severity` the hook normally allows the finding without checking the stamp. This is CR-01's defect (the
text lets a reader think they hold a control they lack), moved from `off` to `high-severity`.

The recipe (`browser-uat-recipe.md:458-459`) says this. Workflow 06 points to the recipe only "for the setup and for host
availability", and the changelog does not point to it at all. `41-28.md:46-48` gives the reason for leaving the case out
("neither Workflow 06 nor the recipe names the `by` role"). That reason is an argument for stating the role condition, not
for dropping it.

**Fix:** add one sentence after the default-`off` sentence in Workflow 06, and its twin in the changelog bullet, then pin
both:
```markdown
At `high-severity` it gates only a finding by `security-nfr`, `architect-design` or `release-manager`.
```
Or keep Workflow 06 short and change the pointer to "Read the recipe for the setup, host availability, and the dials that
gate the witness's name."

### WR-02: The rebuilt route scan passes the CR-01 paragraph and its reverse, and its comment on limits does not say so

**File:** `scripts/flow-guidance-text.test.ts:1416-1420`, `:1457-1464`, `:1494`, `:1499`, `:1563`
**Issue:** I copied lines 1421-1505 into a harness and checked the results against the real files. Every fixture fails as
the test claims, and every real sentence passes honestly today. But these shapes pass with no offender:

- **R4 checks the block, not the claim** (`:1499`). R4 is satisfied when any sentence in the same block names
  `human_admission` or "the dial". I rewrote Workflow 06 to the plan 41-27 paragraph that CR-01 was opened for ("Only a
  Claude Code plugin install binds the witnessing human's name ... Elsewhere, ... nothing binds it"), added "The
  `human_admission` dial is set in `factory.config.json`.", and ran the scan on the whole file. It reported no offender.
  The `cr01-paragraph` fixture fails only because it has no dial word. "Only a Claude Code plugin install binds the
  witness's name, at every `human_admission` value." also passes.
- **The denial mask covers the whole sentence** (`:1457`, `:1494`, and the R3 branch). The comment says R2 flags a
  standalone sentence that "does not deny it the route". The code instead skips R2 and R3 whenever any `DENIES_ROUTE`
  phrase appears anywhere in the sentence, about anything. These pass:
  - "On a standalone Claude Code install the hook binds the stamp, and Pi degrades to a prompt."
  - "A standalone Claude Code install has the hook, which binds the stamp, and Codex has neither."
  - "The hook binds the stamp on every install, and nothing binds a soft note."

  These are the reverse of CR-01, which the `standalone-has-hook` fixture was added to guard against. The fixture named
  `deny-mask` (`:1563`) is flagged only through R1, because it keeps a bare "On Claude Code". It never tests whether the
  mask can hide an R2 or R3 claim.
- **`NEGATED_FORM` knows only "without" and "not"** (`:1463`). "Except on a Claude Code plugin install, ...", "With no
  Claude Code plugin install, ..." and "On any install other than a Claude Code plugin install, ..." all pass once the
  block names the dial.

The limits comment (`:1419-1420`) names the hand-picked file list and the R3 earlier-sentence rule. It names none of the
gaps above, so it overstates what the scan guarantees.

**Fix:**
- Apply `DENIES_ROUTE` per clause. Split the sentence on `,`, ` and `, ` while ` and `;`, and require the denial to be in
  the same clause as the standalone form or the binding verb.
- For R4, require the binding sentence itself, or the next sentence in its block, to name the dial or `off`. Do not
  accept a dial word anywhere in the block.
- Widen `NEGATED_FORM` to `/\b(without|not|no|except|other than|outside|unless)\b[^.]{0,20}Claude Code plugin/i`.
- Add the shapes above as negative fixtures. At least add the reverted Workflow 06 paragraph with a dial mention, and
  "a standalone Claude Code install has the hook ..., and Codex has neither".
- Rewrite the limits comment so it states any gap that is left.

### WR-03: Session start step 3 still opens with "Stop" (carried forward; file outside this review's scope)

**File:** `agent-factory/workflows/17-task-claim.md:86`
**Issue:** This is unchanged from the review at commit 57c72a98. Step 3 still begins "Stop and name each entry `sweep`
prints on a `kept` or `left` line". In this kit "Stop" is a defined action. As the first word of the step, it can be read
as "halt session start". Read that way, the other claims are not finished and step 4's refill does not run, which breaks
the "Only the waiting ticket pauses" rule of `## Keep capacity full`. The disposition file lists it as open.
**Fix:** "3. Name each entry `sweep` prints on a `kept` or `left` line, so a human resolves it. Never re-spawn a task
named on such a line. Finish each other claim ..." Then update the WR-19 pins to match.

## Info

### IN-01: The changelog pins still do not check which section the bullet is in (carried forward)

**File:** `scripts/flow-guidance-text.test.ts:1662-1675`
**Issue:** The rewritten test still asserts on `flat(CHANGELOG)`, the whole file. Plan 41-28 added four more such
assertions. The bullet could move to `### Fixed` or to `## [2.2.0]` and still pass. The `security()` helper at `:1250`
already returns `[Unreleased]` / `### Security`.
**Fix:** use `flat(security())` for the `toContain` checks. Keep `flat(CHANGELOG)` for the `not.toContain` checks.

### IN-02: "Every other install" claims the in-script `admit()` refusal for the markdown-only copy (carried forward)

**File:** `agent-factory/contracts/context-note.md:153-156`, `agent-factory/workflows/16-context-read-write.md:32`
(outside this review's scope)
**Issue:** This is unchanged. The minimal markdown copy (install/README §1) ships no `tools/grugops/note.js`, so it has
only the prompt-level stop, not the `admit()` refusal.
**Fix:** "every other scripted install, a standalone Claude Code install included, degrades to ...". Or add "a
markdown-only copy has only the prompt-level stop".

### IN-03: The 41-11.md pointer line can be read as saying a rewritten sentence was kept (carried forward)

**File:** `docs/audit/29-style-dispositions/41-11.md:127-128`
**Issue:** This is unchanged. "... the sentence on the non-Claude-Code host CLIs, kept word for word" reads as if plan
41-27 kept that sentence. Plan 41-27 replaced it.
**Fix:** "... whose row reads `kept word for word`".

### IN-04: The standalone Orchestrator adapter still declares the plugin-only tool (carried forward; outside scope)

**File:** `.claude/agents/grugops-orchestrator.md:5`
**Issue:** This is unchanged. `install.ts` writes this adapter into a standalone target, and its `tools:` line lists
`mcp__plugin_grugops_grugops__propose_note`, which exists only on a plugin install. The new Workflow 06 sentence ("a
finding the Orchestrator sends through `propose_note`") makes this matter more: a standalone Orchestrator is told to use a
tool it appears to hold but cannot call.
**Fix:** leave the token out of the standalone build, or note in `subagent.frontmatter.md` that it does nothing without
the plugin.

### IN-05: The 2026-11-10 ruling still says no human has accepted R-41-09 (c) (carried forward; outside scope)

**File:** `docs/audit/41-residuals.md:33`
**Issue:** This is unchanged. The bullet ends "The renamed-file route itself stays open, and no human has accepted it."
It gives no pointer to the 2026-11-12 ruling that records acceptance.
**Fix:** append "(accepted in the ruling of 2026-11-12 below)".

### IN-06: The in-script refusal message still names an "un-forgeable" Claude Code hook on every install (outside scope)

**File:** `scripts/context-io.ts:4600`, `:4605`
**Issue:** `admit()` prints its refusal on every install, a standalone Claude Code install included. The message says the
disposition is "granted through the un-forgeable admission-guard hook" and that "on Claude Code the un-forgeable gate is
the separate admission-guard hook". This is the same claim plan 41-27 removed from Workflow 16 and the note contract: on
a standalone install there is no hook to go through. The route scan reads only markdown, and the plans' kit-wide grep did
not cover program strings. Changing this file is outside a text-only plan, which is why it is Info here.
**Fix:** "... granted only through the `admission-guard` hook on a Claude Code plugin install; elsewhere a named human must
record the disposition (residual R-41-06)." Then pin the string in `context-io.test.ts`.

### IN-07: "Binds the witnessing human's name" means the session approver, not the witness

**File:** `agent-factory/workflows/06-uat-pack.md:37`, `agent-factory/checklists/browser-uat-recipe.md:454-457`
**Issue:** On a gated finding, the hook checks only that `verified_by` equals `human:${GRUGOPS_ADMISSION_APPROVED_BY}`
(`admission-guard.ts:328-348`). The grant lasts for the session. While it is set, the agent can stamp any gated finding
with that name, including one the human never witnessed. Workflow 16 says this ("admitted under <name>'s session grant,
not individually reviewed"). The lane, whose output is "what a named person witnessed", does not.
**Fix:** add to the recipe bullet: "The hook proves the name is the session's approver, not that this person watched this
run."

---

_Reviewed: 2026-11-13T19:23:49Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

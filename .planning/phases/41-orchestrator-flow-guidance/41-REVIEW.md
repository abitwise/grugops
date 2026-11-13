---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-13T13:44:33Z
depth: standard
diff_base: 57c72a98f3150268865d6bb2d0c460ad71552ec3
files_reviewed: 12
files_reviewed_list:
  - CHANGELOG.md
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/contracts/context-note.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/06-uat-pack.md
  - agent-factory/workflows/16-context-read-write.md
  - docs/audit/29-style-dispositions/41-08.md
  - docs/audit/29-style-dispositions/41-11.md
  - docs/audit/29-style-dispositions/41-27.md
  - install/README.md
  - scripts/flow-guidance-text.test.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 1
  warning: 2
  info: 4
  total: 7
status: issues_found
---

# Phase 41: Code Review Report (incremental, plan 41-27)

**Reviewed:** 2026-11-13T13:44:33Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

This is an incremental review of `git diff 57c72a98..HEAD`, which is gap-closure plan 41-27. The plan
limits the per-call `admission-guard` hook, its tier and `propose_note` to a Claude Code plugin install
(CR-01, WR-18, D-45). It adds wording pins in `scripts/flow-guidance-text.test.ts` and
`scripts/tier-kit-text.test.ts`.

What I checked:
- Both test files pass: 385 tests.
- `node scripts/check-diff-disposition.js` passes: ALL CHECKS PASSED.
- `install/install.ts` really writes no hook and no MCP server.
- `.claude-plugin/plugin.json` and `hooks/hooks.json` are the only places the server and the hook are declared.
- The rows that `41-27.md` says it supersedes exist in `41-11.md`, `41-08.md` and `32.1-03.md` as described.

The CR-01 fix is right for Workflow 16, the note contract and Workflow 04. Three problems remain:

1. The attended-lane sentence of Workflow 06, and the changelog bullet that summarises it, now say a
   plugin install binds the witness's name. They give no condition. At the default dial
   (`human_admission: off`) the hook allows every note. At `high-severity` the hook does not gate a UAT
   finding. A note written through `note.js` never passes the hook. This is the same defect as CR-01:
   the text tells a reader they hold a control they lack. The new test pins the overclaiming sentence
   word for word.
2. The install guide still says `note.js` runs "outside the Claude Code hook" in the scripted-install
   section. That contradicts the new sentence at line 1943. The plan's kit-wide grep and the new scan
   both missed it.
3. The new "no unscoped sentence" scan is meant to stop a phrase list missing a sentence again, but it
   cannot catch the defects it is there for. I ran a copy of its logic against eight test sentences.
   It missed seven, including the reverse of CR-01: a sentence saying a standalone install has the hook.

## Critical Issues

### CR-01: Workflow 06 and the changelog say a plugin install binds the witness's name with no condition; at the default dial it binds nothing

**File:** `agent-factory/workflows/06-uat-pack.md:37`, `CHANGELOG.md:190-194`, pinned by `scripts/flow-guidance-text.test.ts:216-221`
**Issue:** Workflow 06 now says: "Only a Claude Code plugin install binds the witnessing human's name to
the human, through the admission grant the `admission-guard` hook reads. Elsewhere, a standalone Claude
Code install included, nothing binds it (residual R-41-06)." The changelog says the name "is bound to
the human only on a Claude Code plugin install. On every other install ... nothing binds a
`human:<name>` stamp to a human". Read together, both say a plugin install binds the stamp. On a plugin
install the hook binds the witness's stamp only when all three of these conditions hold:

- **The dial gates the finding.** `hooks/admission-guard.ts:275`, `:286-287` and `:314-316` allow without
  a check whenever `isGatedNote` is false. `isGatedNote` (`scripts/context-io.ts:6735-6743`) returns
  false at `off`, which is the shipped default (`factory.config.md:94`, `:285`). At `high-severity` it
  returns false for any role outside `security-nfr`, `architect-design` and `release-manager`
  (`context-io.ts:4305`). The UAT witness finding is not by one of those roles, so only `all` gates it.
- **The note goes through `propose_note`.** Workflow 16 step 3 tells every host to record notes through
  `node tools/grugops/note.js`. A note written that way runs outside the hook on a plugin install too
  (R-41-06). Neither Workflow 06 nor the recipe tells the lane to use `propose_note` for the witness
  finding.
- **The Orchestrator writes it.** The note is written by the main-thread Orchestrator, the only agent
  that holds the tool.

So at the default configuration a plugin-install reader is told the witness's name is bound to a human
when any agent can write any name. This is the defect CR-01 was opened for (kit text telling a reader
they hold a control they lack), moved from the standalone install to the default dial. The 41-27 row
for "The recipe is referenced here, never restated" says the recipe keeps the gated-note condition.
But Workflow 06's sentence states a binding with no condition, so it is false as written, not just
shorter. The recipe (`browser-uat-recipe.md:454-458`) is more careful ("each note sent through
`propose_note` that the `human_admission` dial gates"). It still never says that at the default `off`
no note is gated, or that for this lane only `all` gates it. The pin at
`flow-guidance-text.test.ts:216-221` locks in the false sentence word for word.

**Fix:** state the conditions in Workflow 06, the changelog and the pin. For example:
```markdown
Only a Claude Code plugin install can bind the witnessing human's name to the human. The
`admission-guard` hook checks the stamp of a finding the Orchestrator sends through `propose_note`
when the `human_admission` dial gates it, which for this lane means `all`. At the default `off`, for a
note written with `tools/grugops/note.js`, and on every other install, a standalone Claude Code install
included, nothing binds it (residual R-41-06).
```
Make the matching change to the changelog bullet ("is bound to the human only on a Claude Code plugin
install, and there only for a finding sent through `propose_note` that the dial gates"). In the recipe,
add one clause: "at the default `off` no note is gated". Then update the pins.

## Warnings

### WR-01: The install guide still puts a Claude Code hook on the scripted install

**File:** `install/README.md:459-461`
**Issue:** The scripted-install list of programs says: "`tools/grugops/note.js` writes a sealed note into
the shared context through the same writer and the in-script admission tier, outside the Claude Code
hook". That section describes what `install.js` writes. Saying `note.js` runs "outside the Claude Code
hook" implies that such an install has a Claude Code hook, and lines 1942-1943 of the same file now
deny it ("`install.js` writes no hook and no MCP server, so a standalone Claude Code install has
neither"). `41-27.md` says a kit-wide grep found every site of the claim, but this one was missed. The
new scan test does not read `install/README.md` (`flow-guidance-text.test.ts:175-184`), and the
install-guide pin (`:241-247`) checks only the paragraph at line 1941.
**Fix:** rewrite the clause and add the file to the scan in WR-02:
```markdown
- `tools/grugops/note.js` writes a sealed note into the shared context through the same writer
  and the in-script admission tier, and prints a task's current notes with `read`. It binds no
  `human:<name>` stamp to a human; only `propose_note` on a Claude Code plugin install, behind its
  hook, can (residual R-41-06)
```

### WR-02: The new "no unscoped sentence" scan cannot catch the defect it was written for

**File:** `scripts/flow-guidance-text.test.ts:171-207`
**Issue:** The comment says a phrase list "only refuses what it names, which is how CR-01 survived plan
41-26", and that this scan generalises. I copied its `ROUTE`, `SCOPED`, `flat` and split logic and ran
it against test sentences. It missed seven of eight. Only the plain control sentence, "On Claude Code
`propose_note` binds the name.", was caught. The gaps:

- **The reverse of CR-01 passes.** `SCOPED` accepts `standalone Claude Code install`. So "On a standalone
  Claude Code install the `admission-guard` hook binds the stamp." is accepted. That is the false claim
  D-45 exists to remove. `plugin install` also matches inside "without a plugin install" or "not a
  plugin install".
- **Common hook wording passes.** `ROUTE` uses `\bthe hook\b`, so "the per-call hook", "That hook" and
  "the admission hook" are not route tokens. "On Claude Code the per-call hook binds the stamp to the
  human." passes, and so does "The Claude Code primary tier is gated by the `human_admission` dial."
  Only the separate phrase list blocks that last exact sentence.
- **Sentences merge.** The split only breaks before `[A-Z\`(*]`. A list bullet (`- ...`) or a sentence
  that starts in lower case joins the sentence before it. A scoped sentence then hides an unscoped one
  next to it: "- The name is bound only on a Claude Code plugin install.\n- On Claude Code
  `propose_note` binds the name." passes.
- **Only sentences that name Claude Code are read.** The defect plan 41-27 fixed in Workflow 06 ("The
  witnessing human's name arrives only through the existing admission grant that a separate process
  reads; the agent can never author it.") names no host, so the scan would never have caught it.
- **Two files have no presence check.** `routeCount` is asserted for Workflows 16 and 04 and the note
  contract, not for Workflow 06 or the recipe. If either file's route sentence drops the words "Claude
  Code", the scan passes with no warning.

**Fix:** split on bullet markers as well (`/(?<=[.;:])\s+(?=[-A-Z\`(*])|\s-\s/`). Widen `ROUTE` to
`/\bhook\b|propose_note|admission-guard|un-forgeable|admission grant|APPROVED_BY|\bbinds?\b/`. Make
`SCOPED` require a positive `plugin install` and refuse any sentence where `standalone Claude Code
install` appears with a route token unless it also matches `/has no hook|nothing binds|degrades/`. Add
`install/README.md` to `texts`, and assert a non-zero `routeCount` for every file listed. Add negative
fixtures, meaning sentences the scan must flag, so the scan is shown to fail on the reverse of CR-01.

## Info

### IN-01: The changelog pin does not check which section the bullet is in

**File:** `scripts/flow-guidance-text.test.ts:249-256`
**Issue:** The test checks `flat(CHANGELOG)`, the whole file, so the bullet could move to `### Fixed` or
to an older release and the test would still pass. The `41-27.md` CHANGELOG rows say the bullet sits
under `## [Unreleased]`, `### Security`, and the `security()` helper at `:1250` already exists for this.
**Fix:** assert on `security()` rather than on `flat(CHANGELOG)`.

### IN-02: "Every other install" now claims the in-script `admit()` refusal for the markdown-copy install

**File:** `agent-factory/workflows/16-context-read-write.md:32`, `agent-factory/contracts/context-note.md:153-156`
**Issue:** The old sentences said "the non-Claude-Code host CLIs degrade". The new ones say "every other
install ... degrades to the in-script `admit()` refusal plus a prompt-level stop". The minimal markdown
copy (install/README §1) ships no `tools/grugops/note.js`, so it has no `admit()` refusal, only the
prompt. Step 3 says to stop when `note.js` is absent, so no unchecked note follows from this. The
sentence still names a control that install lacks.
**Fix:** "every other scripted install, a standalone Claude Code install included, degrades to ...", or
add "a markdown-only copy has only the prompt-level stop".

### IN-03: The 41-11.md pointer line can be read as saying a rewritten sentence was kept

**File:** `docs/audit/29-style-dispositions/41-11.md:127-130`
**Issue:** "... and the sentence on the non-Claude-Code host CLIs, kept word for word" reads as if plan
41-27 kept that sentence. The plan replaced it ("Every other install, ..."). The phrase means that the
sentence's earlier row says "kept word for word". `41-27.md` states this clearly; the pointer line does
not.
**Fix:** "... and the sentence on the non-Claude-Code host CLIs, whose row reads `kept word for word`".

### IN-04: The standalone Orchestrator adapter still declares the plugin-only tool (outside scope)

**File:** `.claude/agents/grugops-orchestrator.md:5` (not in the reviewed set; cross-reference for `install/README.md:1943`)
**Issue:** `install.ts` writes `.claude/agents/grugops-*.md` into a standalone target (`install.ts:886-900`).
The Orchestrator adapter's `tools:` line lists `mcp__plugin_grugops_grugops__propose_note`, which
resolves to nothing without the plugin. The install guide now correctly says a standalone install has
no MCP server. But that install's own Orchestrator adapter still names the tool, which may lead the
agent to try the plugin route. `subagent.frontmatter.md:202-220` documents the token as plugin-only.
**Fix:** note in the adapter generator or the frontmatter doc that the `admit` token does nothing on a
standalone install. Or leave it out of the standalone build, if a dead entry is a problem.

---

_Reviewed: 2026-11-13T13:44:33Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

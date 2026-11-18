---
phase: 43-story-and-layered-docs
reviewed: 2026-11-18T15:10:00Z
depth: standard
files_reviewed: 103
files_reviewed_list:
  - agent-factory/README.md
  - CHANGELOG.md
  - CLAUDE.md
  - docs/audit/28-claim-registry.md
  - docs/audit/28-safety-surface-exclusions.md
  - docs/audit/29-style-dispositions/43-09.md
  - docs/audit/29-style-dispositions/43-10.md
  - docs/audit/29-style-dispositions/43-11.md
  - docs/audit/29-style-dispositions/43-f07.md
  - docs/concepts.md
  - docs/faq.md
  - docs/GUARANTEES.md
  - docs/how-it-works.md
  - docs/README.md
  - docs/reference/README.md
  - docs/reference/agents/agents-md-scribe.md
  - docs/reference/agents/architect-design.md
  - docs/reference/agents/ba-pm.md
  - docs/reference/agents/brownfield-mapper.md
  - docs/reference/agents/compliance-officer.md
  - docs/reference/agents/designer.md
  - docs/reference/agents/factory-coach.md
  - docs/reference/agents/frontend-ui.md
  - docs/reference/agents/greenfield-mapper.md
  - docs/reference/agents/incident-responder.md
  - docs/reference/agents/installer.md
  - docs/reference/agents/orchestrator.md
  - docs/reference/agents/qe-e2e.md
  - docs/reference/agents/release-manager.md
  - docs/reference/agents/security-nfr.md
  - docs/reference/agents/software-engineer.md
  - docs/reference/agents/system-analyst.md
  - docs/reference/agents/tech-lead.md
  - docs/reference/agents/uat-planner.md
  - docs/reference/skills/gate.md
  - docs/reference/skills/grugops.md
  - docs/reference/skills/map.md
  - docs/reference/skills/plan.md
  - docs/reference/skills/release.md
  - docs/reference/skills/ticket.md
  - docs/reference/skills/uat.md
  - docs/skills.md
  - docs/usage.md
  - examples/01-greenfield-bootstrap.md
  - examples/02-brownfield-bootstrap.md
  - examples/03-ticket-to-pr.md
  - examples/04-sprint-cycle.md
  - examples/05-release-run.md
  - .gitattributes
  - .github/workflows/ci.yml
  - hooks/hook-entry.ts
  - hooks/hook-entry.js
  - install/install.ts
  - install/install.js
  - install/install-marker.ts
  - install/install-marker.js
  - install/kit-source.ts
  - install/kit-source.js
  - install/README.md
  - install/agents-record.test.ts
  - install/host-entry-docs.test.ts
  - install/host-tools.test.ts
  - install/installer-dry-run.test.ts
  - install/installer-fs-census.test.ts
  - install/installer-kit-home.test.ts
  - install/installer-prune.test.ts
  - install/installer-special-files.test.ts
  - install/install.test.ts
  - install/ledger.test.ts
  - install/mode-census.test.ts
  - package.json
  - README.md
  - scripts/audit-model.ts
  - scripts/audit-model.js
  - scripts/audit-model.test.ts
  - scripts/board-corpus.ts
  - scripts/board-corpus.js
  - scripts/board-readonly.test.ts
  - scripts/catalog-freshness.ts
  - scripts/catalog-freshness.js
  - scripts/catalog-freshness.test.ts
  - scripts/check-audit-register.ts
  - scripts/check-audit-register.js
  - scripts/check-audit-register.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.js
  - scripts/check-banned-claims.test.ts
  - scripts/check-claim-anchors.ts
  - scripts/check-claim-anchors.js
  - scripts/check-claim-anchors.test.ts
  - scripts/check-diff-disposition.test.ts
  - scripts/check-flip-manifest.test.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-public-docs-vocabulary.ts
  - scripts/check-public-docs-vocabulary.js
  - scripts/check-public-docs-vocabulary.test.ts
  - scripts/check-story-docs.ts
  - scripts/check-story-docs.js
  - scripts/check-story-docs.test.ts
  - scripts/check-uat-oracles.ts
  - scripts/check-uat-oracles.js
  - scripts/check-uat-oracles.test.ts
  - scripts/flow-guidance-text.test.ts
  - scripts/frontmatter.test.ts
  - scripts/generate-catalog.ts
  - scripts/generate-catalog.js
  - scripts/generate-catalog.test.ts
  - scripts/generate-safety-surface.test.ts
  - scripts/trace-instructions.test.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 3
  info: 4
  total: 8
status: issues_found
---

# Phase 43: Code Review Report

**Reviewed:** 2026-11-18T15:10:00Z
**Depth:** standard
**Files Reviewed:** 103
**Status:** issues_found

## Summary

I reviewed the phase diff (`git diff 0cf65b6d..HEAD`) for the installer's new kit-home docs entries (`install/install.ts` copyKit, `install/install-marker.ts`, `install/kit-source.ts`), the new and changed gates (`check-story-docs`, `generate-catalog`, `catalog-freshness`, `check-claim-anchors` retired rows, `check-public-docs-vocabulary` docs part, `check-uat-oracles` dispatch tables), and the rewritten public docs and examples.

What I verified mechanically:

- A scratch `tsc --outDir` build matches every committed `.js` twin in scope byte for byte. The `scripts/audit-model.js` hash in `hooks/hook-entry.ts` `DECIDER_MANIFEST` matches the file.
- These gates pass on the current tree: `check-story-docs`, `check-public-docs-vocabulary`, `check-banned-claims`, `check-claim-anchors`, `check-audit-register`, `check-uat-oracles` and `catalog-freshness`.
- `scripts/check-story-docs.test.ts` and `install/installer-kit-home.test.ts` pass: 102 tests.
- The capture commit `ab0cda98` that examples 01 and 03 cite exists and is on `origin/main`.
- The tool commands in the examples and in `docs/how-it-works.md` match the CLIs in `scripts/runnable-ref/claim.ts` and `note.ts`.

The main defect is CR-01. Copying `docs/` and `examples/` into the kit home gave the installer two generic folder names it now treats as its own. With a kit home the install guide itself uses as an example (`GRUGOPS_HOME=$HOME`), install renames the user's `~/docs` aside, exits 0, and `--prune-old-kit` then deletes it. I reproduced this in a scratch directory.

The warnings are doc and code mismatches the move created:
- The overlap paragraph in the install guide is now stale.
- A snapshot of the checkout's `docs/GUARANTEES.md` ships into every user's kit home, under wording that says it describes "this repository".
- `CLAUDE.md` still names a retired agent, and the new `/grug` gate cannot see it.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Install renames a user's own `docs/` or `examples/` folder in the kit home, and `--prune-old-kit` then deletes it

**File:** `install/install.ts:4932-4964`, `install/install.ts:5027-5033`, `install/kit-source.ts:456`, `install/install-marker.ts:924`
**Issue:** Plan 43-06 made `docs` and `examples` kit entries (`KIT_ENTRY_PATHS = ["agent-factory", "docs", "examples"]`). copyKit applies the kit root's "anything else" arm to them. Any folder at `$GRUGOPS_HOME/docs` or `$GRUGOPS_HOME/examples` that the kit-home record does not name is renamed to `<name>.bak.<ISO>` and recorded as a `kit-home` backup. The prunable set for the kit-home scope is `["kit-home"]` (install.ts:4192), so `--prune-old-kit` removes that backup while it is unchanged.

`agent-factory` is a grugops-specific name. `docs` and `examples` are among the most common folder names in a home directory. `install/README.md:319-320` presents `GRUGOPS_HOME=$HOME` as a supported layout ("is not an overlap"), and the comment at `install/install.ts:3676` does too.

I reproduced the scenario in a scratch directory:
1. A kit home holds `docs/notes.md`, and the target is `<home>/code/repo`.
2. `GRUGOPS_HOME=<home> node install/install.js --target <home>/code/repo --claude` exits **0**. It moves `docs/` to `docs.bak.2026-11-18T15-05-11.232Z` and writes the grugops docs in its place. It reports only a `backed-up` line, with no verify and no INCOMPLETE.
3. `GRUGOPS_HOME=<home> node install/install.js --prune-old-kit --target …` prints `removed …/docs.bak.2026-11-18T15-05-11.232Z`, and the user's `notes.md` is gone.

The same rename happens on `--update`, which does not run the overlap refusal at all. This breaks the "never overwrite or delete user content" constraint in CLAUDE.md for a configuration the docs endorse. The README prune warning ("Move anything you want to keep out of such a backup before you prune") does not help a user who never knew install moved their `~/docs`.
**Fix:** Do not take ownership of an unrecorded folder at a docs entry. The docs entries are reading material, not the kit. For a docs entry (`pages !== null`), when nothing in the record owns the path, skip that entry with a `note` instead of renaming it:

```ts
// in copyKit's planning loop, before computing `arm`
if (!isKit && atEntry !== null && !owned) {
  report(
    "note",
    `${at}: something is already there that install did not write, so ${noun} were not copied; ` +
      `links from the kit to ../${entry}/ will not resolve in this kit home. Use a dedicated GRUGOPS_HOME to get them.`,
  );
  untouched.push(entry);
  continue;
}
```

Another option is to nest every kit entry under one grugops-specific folder, for example `$GRUGOPS_HOME/kit/{agent-factory,docs,examples}`. That keeps the relative links and never claims a generic name. Either way, add a test that pins it: a kit home with a user `docs/` must keep that folder in place after install, `--update` and `--prune-old-kit`. Then correct `install/README.md:158-182` and the CHANGELOG line ("A folder already at either path that the record does not name is kept as a recorded `<name>.bak.<ISO>` backup").

## Warnings

### WR-01: The install guide's overlap paragraph contradicts the new overlap refusal

**File:** `install/README.md:311-320` (code: `install/install.ts:3692-3720`)
**Issue:** The paragraph still says the kit is written only to `${GRUGOPS_HOME}/agent-factory`. It says the refusal covers only the kit root and the kit home, and that "a target inside the kit home but outside its `agent-factory/` (for example `GRUGOPS_HOME=$HOME` with the repository at `$HOME/code/repo`) is not an overlap." Since plan 43-06 the refusal also fires for every docs entry (`kitEntries.find(... within(realTarget, k.realAt) ...)`).

A user with `GRUGOPS_HOME=$HOME` and a repository at `$HOME/docs/site` or `$HOME/examples/demo` now gets exit 1 with "the kit home $HOME/docs overlaps the target". The guide says that layout is fine. The phase changed this paragraph's subject (the hunk at 158-182) but not this paragraph.
**Fix:** Change the paragraph to name all three kit entries, `agent-factory/`, `docs/` and `examples/`. Say that a target at, inside, or holding any of them is refused. Keep the `$HOME/code/repo` example, and add that `$HOME/docs/...` and `$HOME/examples/...` are refused.

### WR-02: The checkout's GUARANTEES.md now ships into every user's kit home, labelled as describing "this repository"

**File:** `install/kit-source.ts:455-483` (shippedDocs ships `docs/GUARANTEES.md`), `agent-factory/README.md:18`, `agent-factory/README.md:68`, `docs/how-it-works.md:68`, `docs/how-it-works.md:73`
**Issue:** `docs/GUARANTEES.md` is generated from the grugops checkout's own claim registry and live checkpoint matrix. It currently reads "**all checkpoints at default** … no floor below is lowered", and its job is "Which public sentences stop being true on THIS repository". Before this phase the `../docs/GUARANTEES.md` link from the kit README was dead in a kit home. Now copyKit copies the page into `$GRUGOPS_HOME/docs/`, so the link resolves.

From a user's project, the kit README says "See docs/GUARANTEES.md for which safety claims hold on this repository." The page it opens describes the grugops checkout at install time, not the user's `.grugops/factory.config.json`. A user who lowered `protected_branch_merge` or `production_requires_human_confirmation` reads every safety row as `held`. That is a safety statement that is false in the user's context, on the one page that exists to stop that from happening.
**Fix:** Pick one:
- Add `docs/GUARANTEES.md` to `CHECKOUT_ONLY_DOCS`, with its reason, and link it by repository URL from shipped pages. The story gate's link check already requires that for checkout-only targets.
- Keep shipping it, but have the generator state at the top that the table reflects the grugops source checkout, and that a user's own floors are reported by `node install/install.js --check` (or whatever reports them; `UNKNOWN - verify` if nothing does). Also reword the "on this repository" sentences in the shipped pages.

### WR-03: CLAUDE.md still instructs `{ "agent": "grug-orchestrator" }`, a retired agent name, and the new gate cannot see it

**File:** `CLAUDE.md:134`, `scripts/check-story-docs.ts:85`
**Issue:** D-23 exists because Claude Code reads CLAUDE.md as an instruction, so a stale command name there is a wrong instruction. The phase rewrote this section (lines 129-137) and left "Orchestrator = main thread via plugin `settings.json` `{ "agent": "grug-orchestrator" }`".

No `grug-orchestrator` agent exists. It was removed in phase 27, and the shipped adapter is `.claude/agents/grugops-orchestrator.md`. `docs/usage.md` also says "The Claude Code plugin form ships no agents", so a plugin `settings.json` `agent` key has nothing to point at. `GRUG_COMMAND_WORD` only matches a slash-prefixed `/grug`, so the story gate passes over this line.
**Fix:** Change the line to describe what ships, for example "Orchestrator = main thread via `claude --agent grugops-orchestrator` (standalone install), or `"agent": "grugops-orchestrator"` in the user's own `.claude/settings.json`; the plugin form ships no agents". Make the change in the GSD stack source this section is generated from (`<!-- GSD:stack-start source:research/STACK.md -->`), or it will come back. Also consider widening check 1 to catch the retired `grug-` agent and skill names, for example `/(?<![\w./-])grug-(?:orchestrator|map|plan|ticket|gate|uat|release)\b/`.

## Info

### IN-01: CHANGELOG says the story-docs gate has three checks; it has four

**File:** `CHANGELOG.md:23-27`
**Issue:** "`npm run check:story-docs`, … with three checks" lists the `/grug` word, GAP-D1 and dead links. `scripts/check-story-docs.ts` also runs check 4, the README tagline and the retired `simple software factory` phrase (`runReadmeStoryCheck`, plan 43-11).
**Fix:** Say "four checks" and add "README.md opens with the tagline and never says `simple software factory`".

### IN-02: Stale cardinality in the comment beside `PUBLIC_DOCS_SCAN_COUNT`

**File:** `scripts/check-public-docs-vocabulary.ts:648-650`
**Issue:** "The pinned cardinality OF THE SCAN. 14 today: … + 2 shipped docs pages" sits beside `PUBLIC_DOCS_SCAN_COUNT = 44`. This module's own convention calls a number typed beside a mechanism, which then goes stale, a defect.
**Fix:** Delete the number and its breakdown from that sentence. The dated "MOVED x -> y" paragraphs below already record the history.

### IN-03: Reference pages miss role participation that a workflow states in a different bullet shape

**File:** `scripts/generate-catalog.ts:745`, `scripts/generate-catalog.ts:799`; `agent-factory/workflows/17-task-claim.md:15`
**Issue:** The generator links a workflow to a role only for a bullet of the form `- <Display Name> — `. Workflow 17 lists "- The Orchestrator: it schedules the queue, claims at dispatch …". That bullet is counted as unmatched, so `docs/reference/agents/orchestrator.md` leaves out the Task claim workflow, which the Orchestrator runs. Its Workflows cell lists only 04, 05, 08 and 09. The Compliance Officer and Installer pages read `UNKNOWN - verify` for Workflows, where the generator in fact knows that no workflow names them.
**Fix:** Either normalize workflow 17's bullet to `- Orchestrator — …`, or make the generator refuse a bullet that names a known role display name in a shape other than ` — `. For a role no workflow names, write "none named in `## Agents involved`" instead of `UNKNOWN - verify`.

### IN-04: The story-docs link check skips some link forms, so a dead link in them passes

**File:** `scripts/check-story-docs.ts:201-216`
**Issue:** These link forms are never checked:
- A CommonMark angle-bracket target with a space, such as `[x](<my page.md>)`. `INLINE_LINK` fails to match it at all.
- An HTML `<a href="…">` or `<img src="…">`.
- A link whose target holds a `)`.

None occurs in the current tree, which is why the gate passes. But the gate has no exemption list, so a dead link written in one of these forms would ship unseen.
**Fix:** Allow spaces inside the `<…>` form, for example `\]\(\s*(?:<([^>\n]+)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)`. Add an `href=`/`src=` attribute pass. Add one test case for each form.

---

_Reviewed: 2026-11-18T15:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

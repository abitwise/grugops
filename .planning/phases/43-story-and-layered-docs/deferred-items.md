# Phase 43 — deferred items

Out-of-scope findings logged by executors. Each names who found it, where, and why it was not fixed there.

## The hook-entry manifest no longer matches scripts/audit-model.js (found by plan 43-02, 2026-11-17)

- **What fails:** `npm run freshness:hook-manifest` exits 1 ("hooks/hook-entry.ts's manifest is not a derivation
  of the current emitted import graph"), and `scripts/context-io.test.ts` case "31-37 WR-36 — one shared candidate
  corpus, the wrapper's accept set INSIDE the reader's route 0 …" fails with "Blocked (fail-closed): the grugops
  hook module "scripts/audit-model.js" does not match the frozen manifest". Re-run alone, it fails the same way.
- **Cause:** `scripts/audit-model.js` is in the admission-guard import closure that `hooks/hook-entry.ts`
  `DECIDER_MANIFEST` freezes by hash. Plan 43-01 changed it (commits 5c281053 and 680b2958) and the manifest
  was not regenerated. Neither gate is in 43-BASELINE.md (`freshness:hook-manifest` was not run there; the WR-36
  case passed at base).
- **Not plan 43-02's:** the manifest names none of the files plan 43-02 changes (`install/kit-source.js`,
  `scripts/check-public-docs-vocabulary.js`, `scripts/check-banned-claims.js`), and plan 43-02 does not own
  `scripts/audit-model.ts`.
- **Remedy (from the gate's own message):** `npm run generate:hook-manifest`, then commit `hooks/hook-entry.ts`,
  `hooks/hook-entry.js` and the D-24 freeze together.

## The checkout-only dogfood runbook still points at example 03 as real proof (found by plan 43-07, 2026-11-18)

- **What:** `docs/dogfood-human-runbook.md` (checkout-only, not shipped) says the sequential path was
  "captured as REAL proof in `examples/03-ticket-to-pr.md` and `examples/01-greenfield-bootstrap.md`" (lines 6-8),
  compares against example 03 (line 157), and its Step 4 sends the reader to the "Dual-path parity (DOG-02)" table
  in example 03 (lines 165-170). Plan 43-07 relabeled examples 01 and 03 as illustrative v3 walkthroughs and dropped
  that table, which had no v3 equivalent. The original capture and table stay in commit
  ab0cda98416c24310c02c180cb2a917889d413e6.
- **Not fixed here:** the runbook is in no 43-07 `files_modified`, and its other text is pre-v3 too (`autonomy=pr`,
  handoff filenames), so the fix is a runbook rewrite or retirement, not a one-line edit. No gate reads it.
- **Remedy:** point the runbook at the commit for the captured run, or retire its parity step, for human triage.

## A host's `node --test` runs the installed `tools/grugops/test-skip-integrity.js` (found by plan 43-13, 2026-11-18)

- **Status:** resolved
- **Resolved by:** phase 43.1, plan 43.1-02 (commits `563518a6`, `16fed9a8`, `d865a456`, `65495441`): the checker
  installs as `tools/grugops/skip-integrity.js`, and install and `--migrate` remove the old file while the ledger
  holds it.
- **What:** In a repository whose test script is plain `node --test`, Node's default test glob matches the
  installed `tools/grugops/test-skip-integrity.js` (its name starts with `test-`). Run with no arguments it exits
  with `Error: no registry file path was provided`, so the host's suite fails on a fresh install before any change.
  Reproduced on a pristine scratch install (Node v26.12.1): 2 tests, 1 pass, 1 fail, the failing one
  `tools/grugops/test-skip-integrity.js`. In the 43-13 UAT it blocked run 6's engineer (a `failed-attempt` note on
  `npm test exits 0`) and run 2's final test step.
- **Not fixed here:** plan 43-13 is a UAT and changes no installer file; the install name comes from
  `install/uninstall.ts` (`scripts/runnable-ref/test-skip-integrity.js` → `tools/grugops/test-skip-integrity.js`).
- **Remedy (for human triage):** install the tool under a name Node's default glob does not match, or document the
  collision in install/README.md.

## Reader-review follow-ups decided in the 43-13 UAT (source: 43-13 UAT decision, 2026-11-18, 43-UAT.md § Human decision)

- **F-07:** reword the two anchored `always` safety sentences, C-28-001 (docs/concepts.md) and C-28-023 (agent-factory/README.md), and re-measure both registry rows in the same commit. **Done 2026-11-18 in commit `86e6c366`:** both sentences reworded to the git-host floor (no `always`), both rows re-measured `true`, F-28-201 and F-28-208 closed, `docs/GUARANTEES.md` regenerated. Not reworded (outside the F-07 decision): the `always` copies in `.claude-plugin/plugin.json` (C-28-038), the generated adapter and skill text, `agent-factory/packaging/subagent.frontmatter.md` and `docs/dogfood-human-runbook.md`.
- **F-09:** reword the first clause of C-28-033 in docs/how-it-works.md ("every shipped change is accountable end to end", for example toward "leaves a trail from requirement to release"); keep "exactly what it needs" (human decision 2026-11-04).
- **F-10:** bring docs/skills.md and install/README.md into the claim registry's anchored set.
- **F-12:** fix in the reference-page generator: the Orchestrator's own page row `Loaded by the Orchestrator in turn`, and named workflows for the Compliance Officer and Installer pages (both now `UNKNOWN - verify`).

## Code review follow-ups (source: 43-REVIEW.md, human decision option A on 2026-11-18; CR-01, WR-01, IN-01, IN-02 fixed, see 43-REVIEW-FIX.md)

- **WR-02:** the kit home gets the checkout's generated `docs/GUARANTEES.md` (all checkpoints at default), while agent-factory/README.md and docs/how-it-works.md present it as showing which safety claims hold "on this repository". A user who lowered a floor still reads every safety row as held. Needs a wording decision (or a per-repo regeneration path).
- **WR-03:** `CLAUDE.md:134` names the removed `grug-orchestrator` agent (`{ "agent": "grug-orchestrator" }`). The section is generated from GSD `research/STACK.md`; fix it there (joins the known CLAUDE.md/STACK.md stack-block mismatch). check-story-docs' `/grug` check matches only a slash-prefixed `/grug`, so it misses this form.
- **IN-03:** the reference-page generator links only workflow bullets shaped `- <Name> — `, so the Orchestrator page omits Workflow 17; Compliance Officer and Installer read `UNKNOWN - verify` for Workflows (overlaps F-12).
- **IN-04:** the story-docs link check skips `<…>` targets with spaces, HTML `href`/`src`, and targets containing `)`, so a dead link in those forms passes.
- **Test environment note (from the CR-01 fix):** `install/install.test.ts` "readUserFile: a unix socket is `not-regular` (socket)" times out when TMPDIR is a long path (the socket path exceeds the 108-byte limit); it passes under a short TMPDIR. Not a code defect; the full suite runs with the default TMPDIR.

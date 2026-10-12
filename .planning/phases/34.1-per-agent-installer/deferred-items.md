# Phase 34.1 — Deferred items (for human triage)

Items found during execution that are outside the executing plan's scope. Each names where it was
found, what was measured, and the remedy proposed. None was fixed in the plan that found it.

## From plan 34.1-01 (2026-10-11)

### DI-01: the three generated host entries are excluded from the banned-claims gate by name, not admitted

- **Found during:** plan 34.1-01, task 3 (full regression).
- **What:** `scripts/check-banned-claims.ts` asks that every tracked text path be scanned or excluded
  by name. The committed entries `.agents/skills/grugops/SKILL.md`, `.opencode/commands/grugops.md`
  and `.pi/prompts/grugops.md` are shipped markdown. Plan 34.1-01 added them to
  `BANNED_CLAIM_EXCLUDED_LOCATIONS` as exact paths, with the cost written beside the entry: the
  pointer sentence is read through `agent-factory/packaging/host-entry.pointer.md` (a `kit` member),
  but the frontmatter and arguments line typed in `scripts/generate-host-entries.ts` are read by no
  gate. The module's own `.claude/` paragraph refutes that transitive-coverage argument for generated
  output.
- **Measured:** 0 banned-claim occurrences in each of the three files with the gate's own matcher
  (`countBannedClaimOccurrences`), 2026-10-11, with a control line reading 3.
- **Proposed remedy:** admit them as a derived part (`hostEntries`) with its own disk walk, vacuity
  floor and a moved `BANNED_CLAIM_SCAN_COUNT`, as `.claude/` and `.claude-plugin/` were admitted. That
  touches the gate's test harness (mirror plants, part overrides, PASS-line arithmetic), which is why
  it was not done inside plan 34.1-01.
- Decided (D-28, human, 2026-10-12): the three generated host entries keep their by-name exclusion from the
  banned-claims gate; 0 occurrences measured 2026-10-11; no plan admits them as a derived part.

### DI-02: plan 34.1-02 names the template path `host-entry.template.md`; the file is `host-entry.pointer.md`

- **Found during:** plan 34.1-01, task 3 (full regression).
- **What:** `scripts/kit-model.ts` `listPackagingTemplates` admits every `*.template.md` and
  `*.frontmatter.md` under `agent-factory/packaging/` into the one spawn-grant scan composition, whose
  members must carry a frontmatter block. A frontmatter-less pointer file named
  `host-entry.template.md` turned about 40 tests red (canonical-frontmatter, frontmatter, kit-model,
  check-foundation-guards). Plan 34.1-01 renamed it `agent-factory/packaging/host-entry.pointer.md`.
- **Action for plan 34.1-02:** read the path from `TEMPLATE_REL`, exported by
  `scripts/generate-host-entries.ts`, instead of typing `host-entry.template.md` in
  `scripts/host-entries-freshness.ts`.

### DI-03: five suite reds that predate plan 34.1-01 (Node 26 on this machine)

- **Found during:** the baseline run before plan 34.1-01 changed anything (2026-10-11, 5 failed of
  7717 on HEAD e17b1ba5, Node v26.11.0; the project targets Node 22+).
- **What:** `install/installer-fs-census.test.ts` (node:fs export `openAsBlobSync` unclassified),
  `scripts/check-foundation-guards.test.ts` (2 cases: a `MODULE_TYPELESS_PACKAGE_JSON` warning on
  stderr of a mirror without a package.json), `scripts/generate-catalog.test.ts` (2 cases: the same
  warning). Both causes come from Node 26, not from repository code.
- **Not fixed:** out of scope for plan 34.1-01. Whether CI on Node 22 shows them is
  `UNKNOWN - verify`.

## From plan 34.1-09 (2026-10-12)

### DI-04: CLAUDE.md's per-tool table names only `.opencode/commands/grugops.md` as OpenCode's adapter

- **Found during:** plan 34.1-09, task 3 (sibling search for the README's OpenCode bullet, DOC-1).
- **What:** `CLAUDE.md` ("AGENTS.md + per-tool entry files" table, the OpenCode row) says the installer lays down
  `.opencode/commands/grugops.md`. Since plan 34.1-09 an install that chooses OpenCode also merges the kit-read rule into
  the project `opencode.json` (D-14). The row is not false about the command file, but it omits the second write.
- **Not fixed:** `CLAUDE.md` is a project instruction file outside this plan's files; plan 34.1-13 owns the sweep of
  shipped docs. Proposed remedy: add "plus the `opencode.json` kit-read permission (D-14)" to that row's adapter cell.

## Status after plan 34.1-13 (2026-10-12)

- **DI-01:** still open. It awaits a human decision (admit the generated entries as a derived banned-claims part, or
  keep the by-name exclusion). Plan 34.1-13 did not decide it.
- **DI-02:** resolved in plan 34.1-02 (the gate reads `TEMPLATE_REL`); nothing left.
- **DI-03:** still open. The five Node 26 reds are reported by plan 34.1-13's final regression; whether CI on Node 22
  shows them is `UNKNOWN - verify`.
- **DI-04:** closed by plan 34.1-13 (commit ac790deb): CLAUDE.md's OpenCode row names the `opencode.json` kit-read rule.

## From plan 34.1-14 (2026-10-12)

### DI-07: a partial uninstall kept only for a verify on a directory entry has no per-agent finishing command

- **Found during:** plan 34.1-14, task 1 (writing finishCommand).
- **What:** a partial run (`uninstall.js --claude`) whose only unfinished record is a verify on a recorded `dir`
  entry (an `rmdir` that failed) keeps the marker on the `kept` arm with nothing held. Directory entries never hold the
  marker and never keep an agent recorded (agentsToRecord, entryHolds), so the agents the run set out to remove leave
  `agents`, and UNFINISHED is empty. finishCommand then prints the command with the flags this run named (it never
  prints the flag-less command on a partial run, which would remove every agent), and that command finds none of them
  installed and changes nothing. The directory stays recorded in the ledger while it exists; a later flag-less
  uninstall, or removing it by hand, finishes it.
- **Not fixed:** out of scope for plan 34.1-14 (the plan's rows have no recorded `dir` verify on a partial run, and
  changing what keeps an agent recorded is D-29's rule). Not reproduced by a run; read from the code. Options for
  triage: count a recorded verify on any entry an agent owns as keeping that agent, or word the `left` line for this
  case without a per-agent command.

## From plan 34.1-15 (2026-10-12)

### DI-08: the doctor's stale-adapter remedy hand-builds an install command with an unquoted target

- **Found during:** plan 34.1-15, task 4 (the install.js and uninstall.js command census, table (c)).
- **What:** install/install.ts doctor, the stale-adapter docWarn, ends with `run from the checkout: node
  install/install.js --target ${TARGET}`. It names no agent flag, so the census classes it "names no agent flag" (the
  doctor speaks for the recorded agents, and install with no agent flag chooses that set). But the target is not
  shell-quoted, so a target path holding a space or a quote prints a command that does not run as printed. agentCommand
  quotes such a target.
- **Not fixed:** outside this plan's sites (the plan's agentCommand list is five sites and the banner). Proposed
  remedy: `agentCommand("install.js", TARGET, [])` in backticks. Read from the code, not reproduced.

### DI-09: kit-plan verifies printed by the --migrate pre-check end in the migrate banner, which prints no same-run command

- **Found during:** plan 34.1-15, task 4 (the re-run census, table (f)).
- **What:** the "same-run command" rows of message-references.test.ts (buildKitPlan refusals, kitDestDecision,
  kitWriteDecision, adapterDestHazard) are finished by the command the install INCOMPLETE banner prints. The same
  reasons are also printed by the --migrate pre-check (`for (const why of refusals) verify(why)`), which exits through
  the migrate INCOMPLETE banner. That banner says "re-run --migrate" and names no agent; a flag-less `--migrate` over an
  old layout with no marker chooses by detection, which may not be the agents the first run named.
- **Not fixed:** the plan classes the migrate banners as agent-independent and leaves them unchanged. Options for
  triage: print agentCommand with `--migrate` in the migrate banner, or class the pre-check's verifies separately.
  Read from the code, not reproduced.

## From plan 34.1-16 (gap round 1)

### DI-05: the legacy Gemini entry-gone arm leaves the `context` object or the file install created

- **Found during:** plan 34.1-16, task 1 (the CLEAN-1 sibling search over every teardown of an install-created
  container: `grep -n "createdFile\|createdPermission\|createdExternalDirectory\|createdPermissions\|createdAsk\|createdContext" install/uninstall.ts`,
  then each reversal's "already gone" arm).
- **What:** install/uninstall.ts unmergeGemini, the arm at about line 1105 ("context.fileName no longer lists AGENTS.md
  — the entry install added was already removed"), returns `gone` and edits nothing. When the `gemini` entry records
  that install created `context` (createdContext) or the whole `.gemini/settings.json` (createdFile), that container or
  file stays with no line naming it. It is the same class as IN-20 (fixed for OpenCode in this plan). It reaches only
  legacy installs from before phase 34.1 (D-12 and D-23: install writes no Gemini entry any more).
- **Why it is not a one-line copy of the IN-20 fix:** a created Gemini file lists two names (`AGENTS.md` and
  `GEMINI.md`, install-marker.ts GEMINI_CREATED_FILE_NAME), so "install's content is gone" is not a one-member question:
  the user may have kept `GEMINI.md` on purpose.
- **Proposed remedy:** when the record says install created `context` or the file, and `context.fileName` holds none of
  the names install wrote, take out `context` (and the file, when what is left is byte for byte install's own emptied
  file with the recorded mode) through the same oracle path as the main arm; otherwise name the file on a `left` line
  with a by-hand remedy. Read from the code, not reproduced.
- **Not fixed:** kept deferred by D-30; human triage.

## From plan 34.1-18 (gap round 1)

### DI-10: five test comments still say a whole-file host entry is written "on every install"

- **Found during:** plan 34.1-17, task 2 (the IN-19 search, which covers install/install.ts only); recorded here by
  plan 34.1-18.
- **What:** install/installer-cross-version.test.ts ~36, install/installer-never-installed.test.ts ~96,
  install/installer-special-files.test.ts ~91, install/installer-user-edit.test.ts ~135 and
  install/ledger-provenance.test.ts ~101 say install writes every whole-file host entry "on every install". Since the
  per-agent selection, install writes only the entries of the chosen agents (writeWholeFileEntry's header, IN-19). Each
  comment is a dated count re-pin note from plan 34.1-01 that records what was true when the count moved; no test
  asserts the sentence.
- **Not fixed:** outside plan 34.1-18's files (it writes closing records only). Options for triage: reword each note to
  "every whole-file host entry of the chosen agents", or leave them as dated history.

## Status after gap round 1 (plans 34.1-14 to 34.1-18)

- **DI-01:** decided (D-28): the by-name exclusion stays; scripts/check-banned-claims.ts is unchanged by this round.
- **DI-02:** resolved in plan 34.1-02 (the gate reads `TEMPLATE_REL`); nothing left.
- **DI-03:** still open. The five Node 26 reds are reported again by plan 34.1-18's full regression; whether CI on
  Node 22 shows them is `UNKNOWN - verify`.
- **DI-04:** closed by plan 34.1-13 (commit ac790deb).
- **DI-05:** open for human triage (kept deferred by D-30, recorded by plan 34.1-16).
- **DI-06:** fixed by plan 34.1-16 under D-30 (commit fc17b822). It was never a deferred-items entry.
- **DI-07:** open for human triage (recorded by plan 34.1-14).
- **DI-08:** open for human triage (recorded by plan 34.1-15).
- **DI-09:** open for human triage (recorded by plan 34.1-15).
- **DI-10:** open for human triage (recorded by plan 34.1-18, found by plan 34.1-17).

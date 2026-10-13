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
- **Closed by plan 34.1-31 (D-31, commit 8d730df2):** the five notes, plus two wrapped siblings the new scan found
  (install/install.test.ts, install/record-truth.test.ts), now name the entries of the chosen agents; the DI-10 scan in
  install/host-tools-prose.test.ts reads comments and holds the claim at zero.

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

## From plan 34.1-21 (gap round 2)

### DI-11: a partial uninstall's verify on an ask-rules entry that claims nothing leaves a finishing command that does nothing

- **Found during:** plan 34.1-21, task 1 (the DI-07 sibling search over every `return "verify"` and verify outcome in
  install/uninstall.ts). Reproduced by a scratch run (GRUGOPS_HOME and HOME set to scratch directories), not only read.
- **What:** install records an `ask-rules` entry that claims nothing (`added` empty, no `created*` flag) when
  `.claude/settings.json` already holds every ask rule. That entry is of a holding kind, but install-marker.ts
  entryHolds answers false for it (entryClaimsNothing). removeAskRules has the rule "a ledger that claims nothing is no
  record for the file" only in its `blocked` arm. Its JSON-shape arms (not a JSON object, a parse error, a duplicate
  `permissions` key, a `permissions` or `permissions.ask` of the wrong type) still count a verify ("the 0 ask rule(s)
  grugops added were NOT removed"). On `uninstall --claude` while Codex CLI stays, with the settings file set to `[]`:
  exit 3; the walk removes every Claude Code file; the kept arm rewrites the marker with `agents` [codex] (no held entry
  keeps Claude Code), and the ask-rules entry stays in the ledger. The kept `left` line and the INCOMPLETE banner print
  `uninstall.js --target <t> --claude` (finishCommand's NAMED fallback). Run after the file is fixed, that command
  reports "none of the named agents is installed here" and changes nothing, so the entry stays recorded until a
  flag-less uninstall. The printed command is never the flag-less one (D-05 holds), but it names an agent the rewritten
  marker no longer records. This is DI-07's arm (a partial kept arm with nothing held and a recorded verify), reached
  through an entry that does not hold instead of through a directory.
- **Not fixed:** outside plan 34.1-21's scope (the brief's §3: new findings go here for human triage), and either fix
  changes a removal or record rule. Options for triage: (a) apply the claims-nothing rule to every arm of removeAskRules
  (nothing of install's is in the file, so its shape is not this run's to judge: report it `left` or `skipped` and
  return `gone`), which also stops a FULL run from exiting 3 over it; (b) keep an agent recorded while it owns an entry
  whose reversal counted a verify (an agentsToRecord change, D-29's rule). The legacy `gemini` kind has the same shape
  (a claims-nothing entry can still verify in unmergeGemini), but it has no owner, so it is reversed only by a FULL run,
  whose finishing command is the flag-less one; it is listed here for completeness.

## From plan 34.1-27 (gap round 2)

### DI-12: two doctor lines ask for "re-run --check from a complete kit checkout" and print no command

- **Found during:** plan 34.1-27, task 2 (the sibling search over the doctor's re-run remedies, `\bre-?run\b` over
  install/install.ts string fragments).
- **What:** install/install.ts doctor, the two adapter-staleness WARNs where the adapter directory and the role corpus
  disagree (the fresh render produced members the kit's adapter set does not carry, or produced no file for a member),
  end "re-run --check from a complete kit checkout". The checkout is the
  one the run rendered from (GRUGOPS_SRC), so the fix is a different checkout, and doctorCheckCommand() would name this
  run's install.js, the incomplete one. The lines name no binary, so plan 34.1-27's D-list (fragments matching
  `install.js` or "re-run the installer") does not hold them; message-references (f) classes them "agent-independent:
  mode with no agent set".
- **Not fixed:** a command that runs another checkout's install.js is not something agentCommand builds. Options for
  triage: leave the text (the user names the checkout), or print the --check command with a placeholder for the
  checkout's install.js path. Read from the code, not reproduced.

## From plan 34.1-28 (gap round 2)

### DI-13: rewriteLedger's verify says "Re-run to finish it.", and a re-run does not finish it

- **Found during:** plan 34.1-28, task 2. The prune INCOMPLETE banner now prints `install.js --target <t>
  --prune-old-kit` (agentCommand). installer-prune.test.ts "a record that cannot be rewritten after the removals" ran
  that command as printed, from a scratch directory, after making the records writable again: it exited 0 with
  `== prune complete ==`, and the marker still listed the removed backup (`agent-factory.bak.<ISO>`). The same case
  showed the census hole below.
- **What:** install/install.ts rewriteLedger, the verify `<holder>: <why>, so it was not rewritten and this was not
  done: <what>. Re-run to finish it.` Two callers:
  - prune (rewriteLedgerWithout): the backups were already removed. A second prune finds each entry's backup gone,
    reports it `left` ("it is no longer there; its entry is kept in the record") and keeps the entry, by design (33.1-40:
    by record, never by presence). So the re-run never takes the entries out.
  - the already-migrated --migrate (recordBackupsInMarker): the handoffs were already moved to the backup. A second
    --migrate finds no plans/handoffs/ and records only the backups of its own run, so the first run's backup stays
    unrecorded. Read from the code, not reproduced.
- **Census hole, fixed in this plan:** message-references.test.ts RERUN was case-sensitive, so this capitalized
  `Re-run` (and the kit banner's `Re-run: node scripts/...`) was never in census (f). RERUN is case-insensitive now,
  and the row is classed "no command: a re-run does not finish it (DI-13)", named rather than hidden.
- **Not fixed:** either fix changes a prune or record rule (brief §3: new findings go here). Options for triage: (a)
  prune takes out an entry whose backup is gone when the entry is install's own and unchanged (a record rule change
  against 33.1-40's "kept in the record"); (b) the verify says plainly what a re-run does and does not do (for prune, a
  gone backup's entry stays and removes nothing on a later prune); (c) the migrate caller records
  the earlier run's backup when the backup path exists and matches.

## From plan 34.1-30 (gap round 2)

### DI-14: an agent install records again from the ledger is named by no closing note and asked about by no route note

- status: open
- **Found during:** plan 34.1-30, Task 1 (sibling search after the writeMarker change).
- **What:** plan 34.1-30 (D-31, IN-26) makes writeMarker record every owner of a holding entry of the ledger it
  writes. The rest of the run still reads AGENTS_AFTER (the agents recorded before the run plus the agents chosen in
  it): agentClosingLines splits only the agents recorded before the run, and the route notes ask hostsOf(AGENTS_AFTER).
  So in R30's second run (`agents` hand-edited to [codex], then `install --codex`), the marker ends up recording
  Claude Code, but no closing line names it ("Left installed" or "Recorded as chosen") and no route note asks about it.
  The doctor (`--check`) reads the record and names it on the next run. Read from the code, not reproduced as a
  printed-output assertion.
- **Not fixed:** it reaches only a marker whose `agents` already contradicts its ledger (a hand edit, or the
  unreleased round-0 uninstall), and the change would move the closing notes' and route notes' input (brief §3: new
  findings go here). Option for triage: derive the "recorded after this run" set once (the value writeMarker records)
  and have agentClosingLines and the route notes read it in place of AGENTS_AFTER.

## From the gap round 2 plan check (recorded by plan 34.1-32)

### DI-15: agent instruction text tells the reader to run `node install/install.js`, a path relative to the grugops checkout

- status: open
- **Id note:** the round-2 plan texts (34.1-28-PLAN.md, 34.1-32-PLAN.md) and the 34.1-28 SUMMARY call this finding
  "DI-11". Plan 34.1-21 had already recorded a different finding as DI-11 (above), so this one is recorded as DI-15.
  Read "DI-11" in those plan texts as this entry.
- **Found during:** the plan check of gap round 2 (2026-10-12).
- **What:** AGENTS.md line 40 ("Re-run the installer (`node install/install.js` or `node install/install.js --check`)")
  and the resolver comment that scripts/kit-model.ts RESOLVER (~line 301) writes into every generated Claude Code
  adapter (`.claude/agents/*.md` and `.claude/skills/grugops/SKILL.md`, 18 files at HEAD 543cca28; for example
  `.claude/agents/grugops-orchestrator.md` line 19) tell the reader to run `node install/install.js`. That path is
  relative to the grugops checkout; in a target repository it does not exist. These texts are outside the
  printed-command census of plan 34.1-28, whose scan set is the product modules' printed strings. Plan 34.1-28
  excluded the related install/install.ts TARGET_BANNER (the comment written into generated target adapters) from its
  zero rule as file text of this class; that banner already says the command is run "from the grugops checkout".
- **Why it is deferred, not fixed:** these are agent instruction texts, fixed text by D-09 and T-34-13 (no install-time
  value, so no absolute checkout path, may enter them), so agentCommand's absolute form cannot apply. A fix is a
  wording decision (for example "run install.js from your grugops checkout") plus a regeneration of the adapters
  through the freshness gate, which is for the human to choose.
- **Not fixed:** deferred for human triage.

## From plan 34.1-41 (gap round 3)

### DI-16: the doctor's FAIL over a marker that is not JSON (or has no usable ledger) prints an install command without naming its kit home

- status: open
- **Found during:** plan 34.1-41, Task 1 (sibling search for the MSG-1 shape "a printed install step over an unusable
  marker whose kit home the line does not name").
- **What:** plan 34.1-41 adds the kit-home clause (contextKitHome) to uninstall.ts's two unusable-marker verifies and
  to both arms of the doctor's unbound-marker WARN. The grep the plan named (`writes a marker for this directory`)
  found three of those four sites; the doctor's no-target or no-ledger WARN arm was found by reading and is covered
  (R27 now runs `--check` over the no-ledger marker). Two other doctor remedies also print doctorInstallCommand()
  without naming the kit home: install.ts markerUnreadable's `mayRemove` arm (a marker that is not JSON, not an
  object, or holds no usable ledger) and notInstalled (no marker). Their kit home is this `--check` run's, as it was
  before D-36, and the marker they cover records no kit home that can be read, so the printed step cannot move the
  install away from a kit home a usable record names. Read from the code, not reproduced as a printed-output
  assertion.
- **Not fixed:** outside the plan's file scope and not the WR-22 shape (no recorded kit home is dropped). Option for
  triage: add the same contextKitHome clause after doctorInstallCommand() in both lines, so every printed install step
  names where it puts the kit.

## From plan 34.1-38 (gap round 3)

### DI-17: no follow-as-printed row runs an `--update` or `--prune-old-kit` command printed under a non-default kit home

- status: open
- **Found during:** plan 34.1-38, Task 2 (the claim table for install/README.md's printed-command paragraph).
- **What:** the README sentence "An install, `--migrate`, `--update` or `--prune-old-kit` run prints commands with the
  kit home and mode it was run with" is true by the code (install.ts DOCTOR_MARKER_READ is null outside `--check`, and
  commandContextFromRecord's unit table gives the run's kit home and mode for a null record). Install is followed as
  printed under `--symlink` (R33) and `--migrate` after its fix (M8), but no row prints an `--update` or
  `--prune-old-kit` command with `GRUGOPS_HOME` set to a non-default kit home and runs it as printed outside the
  checkout. The sentence is backed by the derivation, not by a follow-as-printed row for those two modes.
- **Not fixed:** a test-coverage gap, not a wrong sentence; outside the plan's scope (prose, comments and one test
  file). Option for triage: a row per mode that runs the printed banner command with no inherited GRUGOPS_HOME and
  asserts it refreshes or prunes the kit home K, not `~/.grugops`.

## From plan 34.1-42 (gap round 4)

### DI-18: over a user's own JSON object at .grugops/install.json in a target grugops never installed into, the uninstaller's verify calls the file the record of the agents installed here

- status: open (for the human; no round 5)
- **Found during:** plan 34.1-42, Task 1 (the install/ regression run: installer-never-installed.test.ts FD and FM pin
  the marker's `left` line over a user's JSON object at the marker path).
- **What:** D-37 gives the uninstaller one reading for every `unreadable` marker read: markerUnusableText, then
  markerFixText ("Fix .grugops/install.json by hand (no grugopsHome; no kitRoot; no installMode); never delete the
  marker: it is the one record install keeps of the agents installed here, ..."), then this run's command. In a target
  grugops was never installed into, with a JSON object of the user's own at that path (the FD and FM rows), the file is
  not a record of anything grugops did, so the sentence that it is the one record of the installed agents, and the fix
  that names install's fields, are not true for that file. Uninstall still changes zero bytes there (FD, FM pass), so no
  file is lost; the defect is wording only (DOC-1/MSG-1). Read from the run output, reproduced by the FD row.
- **Not fixed:** D-37 is locked ("for any marker read") and no round 5 exists. Option for triage: a reader state for a
  JSON object that holds none of install's fields (no grugopsHome, kitRoot, installMode, target or ledger), worded as
  "not written by install; if it is yours, leave it" without offering removal, in the one owner (plan 34.1-46's
  matrix is the place that enumerates reader states).

## Status after gap round 2 (plans 34.1-19 to 34.1-32)

- **DI-01:** decided (D-28): the by-name exclusion stays.
- **DI-02:** resolved in plan 34.1-02; nothing left.
- **DI-03:** still open. Plan 34.1-32's full regression reports the five Node 26 reds again; whether CI on Node 22
  shows them is `UNKNOWN - verify`.
- **DI-04:** closed by plan 34.1-13 (commit ac790deb).
- **DI-05:** still deferred (D-31); open for human triage.
- **DI-06:** fixed by plan 34.1-16 under D-30 (commit fc17b822).
- **DI-07:** fixed by plan 34.1-21 under D-31 (commits c4e2c43d, 2e6e9b96, 03ed2a0c). The arm it described is shown
  unreachable through a directory: no recorded verify lands on a directory entry. A failed rmdir of a recorded
  directory that install created is now named on a `left` line with its error code and the by-hand remedy. A partial
  run's finishing command never names the flag-less command, and names only agents the marker on disk records (R32).
  The same arm is still reachable through an `ask-rules` entry that claims nothing; that is DI-11.
- **DI-08:** fixed by plan 34.1-27 under D-31 and D-33 (commits 5af55277, 0a72286c): the doctor's stale-adapter
  remedy prints doctorInstallCommand() (agentCommand) in backticks, and the DI-08 case (M7) runs it as printed.
- **DI-09:** fixed by plan 34.1-28 under D-31 and D-33 (commits f65cfa0b, 2a055d1a): both migrate INCOMPLETE banners,
  and the update and prune banners, print their command from the builder; M8 runs the migrate command as printed.
- **DI-10:** fixed by plan 34.1-31 under D-31 (commit 8d730df2): seven test comments reworded, and a derived scan in
  install/host-tools-prose.test.ts holds the retired claim at zero.
- **DI-11:** deferred for human triage (recorded by plan 34.1-21, commit c4e2c43d): a partial uninstall's verify on
  an `ask-rules` entry that claims nothing leaves a finishing command that does nothing.
- **DI-12:** recorded for human triage by plan 34.1-27 (commit 7980cc7f): two doctor lines ask for "re-run --check
  from a complete kit checkout" and print no command. Plan 34.1-28 names them as their own census class.
- **DI-13:** recorded for human triage by plan 34.1-28 (commit bcc0f32b): rewriteLedger's "Re-run to finish it."
  does not finish it.
- **DI-14:** recorded for human triage by plan 34.1-30 (commit 585ba921): an agent install records again from the
  ledger is named by no closing note and asked about by no route note in the same run.
- **DI-15:** deferred for human triage (recorded above by plan 34.1-32; the round-2 plan texts call it "DI-11").

## Status after gap round 3 (plans 34.1-33 to 34.1-41)

Scope of the round is D-34 (human, 2026-10-12): it fixed CR-04 (D-35) and WR-21, WR-22 and WR-23 (D-36), and deferred
IN-28 to IN-31, DI-05 and DI-11 to DI-15 to triage. "Not changed in round 3" below was checked against
`git diff e9693a3f..HEAD` (the round's code changes are in install/ only; scripts/ and AGENTS.md are unchanged).

- **DI-01:** decided (D-28): the by-name exclusion stays; scripts/check-banned-claims.ts is unchanged by this round.
- **DI-02:** resolved in plan 34.1-02 (the gate reads `TEMPLATE_REL`); nothing left.
- **DI-03:** a human item. Whether CI on Node 22 shows the Node 26 reds is `UNKNOWN - verify`. Plan 34.1-39's full
  regression reports them again (its SUMMARY lists each failing case against this baseline).
- **DI-04:** closed by plan 34.1-13 (commit ac790deb).
- **DI-05:** deferred to triage by D-34; not changed in round 3. install/uninstall.ts unmergeGemini is untouched (plans
  34.1-34, 34.1-36, 34.1-37 and 34.1-41 changed uninstall.ts elsewhere: the marker verify, removeMarker,
  keepWithoutRecord, COMMAND_CONTEXT and the unbound remedies).
- **DI-06:** fixed by plan 34.1-16 under D-30 (commit fc17b822).
- **DI-07:** fixed in round 2 by plan 34.1-21 under D-31 (commits c4e2c43d, 2e6e9b96, 03ed2a0c); its remaining arm is
  DI-11.
- **DI-08:** fixed in round 2 by plan 34.1-27 under D-31 and D-33 (commits 5af55277, 0a72286c).
- **DI-09:** fixed in round 2 by plan 34.1-28 under D-31 and D-33 (commits f65cfa0b, 2a055d1a).
- **DI-10:** fixed in round 2 by plan 34.1-31 under D-31 (commit 8d730df2).
- **DI-11:** deferred to triage by D-34; not changed in round 3. removeAskRules is untouched; plan 34.1-34 changed
  removeMarker and keepWithoutRecord in the same file (they read markerRemedy) and did not change which arm counts a
  verify or what the finishing command names.
- **DI-12:** deferred to triage by D-34; not changed in round 3. Plan 34.1-37 rewrote the doctor's stale-adapter WARN
  beside the two lines (one checkout, `GRUGOPS_SRC` in its remedy); the two "re-run --check from a complete kit
  checkout" lines still print no command.
- **DI-13:** deferred to triage by D-34; not changed in round 3. rewriteLedger's "Re-run to finish it." is unchanged;
  plan 34.1-33 only re-pinned the RERUN census count in install/message-references.test.ts beside it.
- **DI-14:** deferred to triage by D-34; not changed in round 3. Plan 34.1-33 changed writeMarker's skipped line (it
  reads markerRemedy); agentClosingLines and the route notes still read AGENTS_AFTER.
- **DI-15:** deferred to triage by D-34; not changed in round 3. AGENTS.md and scripts/kit-model.ts RESOLVER are
  unchanged, so the generated adapters still say `node install/install.js`.
- **DI-16:** open for human triage, recorded by plan 34.1-41 (commit aa44ef6e): the doctor's markerUnreadable
  `mayRemove` arm and notInstalled print an install command without naming its kit home.
- **DI-17:** open for human triage, recorded by plan 34.1-38 (commit 4ab7e9b8): no follow-as-printed row runs an
  `--update` or `--prune-old-kit` command printed under a non-default kit home.

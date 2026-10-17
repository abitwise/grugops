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

- status: resolved 2026-10-13, closed by D-38 in gap round 4 (plans 34.1-44, 34.1-47 and 34.1-49; commits 30003a2c,
  fadff0bb, c3d99e71). See "Status after gap round 4" below.
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

- status: resolved 2026-10-13, closed by D-38 in gap round 4 (plan 34.1-49; commits fc4e57a4, c3d99e71). See "Status
  after gap round 4" below.
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

- status: resolved 2026-10-14, closed by D-40 in gap round 5 (plan 34.1-54, commits cc2a57b5, dcfc7f9e, 9ff8142e; the
  field set confirmed by D-44). See "Status after gap round 5" below.
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

## From plan 34.1-45 (gap round 4)

### DI-19: the doctor's ask-rules WARN over an unreadable marker names the wrong cause and calls the install ledger unknown

- status: resolved 2026-10-14, closed by D-40 in gap round 5 (plan 34.1-53, commits 6aa1f4c9, b72058ca). See "Status
  after gap round 5" below.
- **Found during:** plan 34.1-45, Task 3 (the unusable-marker census, derived by search over every product module).
- **What:** install.ts doctor, the ask-rules check, re-reads the marker (`askMarker`) and, when it is `unreadable`,
  prints the WARN ".grugops/install.json could not be read as a JSON object — the install ledger is unknown, so the ask
  rules were not checked". For a read that IS a JSON object (a field install never writes, a retired record) the cause
  is wrong (the IN-33 class), and "the install ledger is unknown" is not what the run saw: the ledger was not used. The
  line is reached only if the marker changes between DOCTOR_MARKER_READ and this re-read, because the doctor's
  markerUnreadable FAIL returns first over an unreadable marker. It names no remedy and offers no removal, so it passes
  the D-37 class rule (the census classes it "cause only"). Wording only (MSG-1/DOC-1); read from the source, not
  reproduced by a run.
- **Not fixed:** outside D-37's rule (it offers nothing by hand) and round 4 is the last on the cap. Option for triage:
  word it from the same read as markerUnusableText, or read the ask-rules state from DOCTOR_MARKER_READ instead of a
  second read.

## From plan 34.1-49 (gap round 4)

### DI-20: three install.ts comments and one test comment still say a printed command carries GRUGOPS_HOME only for another kit home, and `--symlink` for a symlink install

- status: resolved 2026-10-13 by plan 34.1-51 Task 2 (the commit "docs(34.1-51): ... (D-38)"): the three install.ts
  comments (the --update header, the migrate same-run comment, the install same-run comment) and both closing-claims
  comments (U1, and the migrate row's at about line 493) state the D-38 rule; a fourth install.ts sibling found by
  search (the doctor's ONE CHECKOUT comment, "`GRUGOPS_SRC=<dir>` when it is not this script's own checkout") was
  reworded too. install.js rebuilt. host-tools-prose.test.ts holds every spelling at zero (`home-when-another`,
  `home-not-default-so`, `symlink-word`, `src-only-other`), with a planted proof.
- **Found during:** plan 34.1-49, Task 3 (reading the --update branch to class TARGET for the env-read census), then a
  search for the phrase over install/.
- **What:** since plans 34.1-47 and 34.1-48 (D-38) every printed command states GRUGOPS_HOME (the default kit home
  included), INSTALL_MODE and GRUGOPS_SRC, and none carries `--symlink`. Three comments in install/install.ts still
  describe the retired rule: the --update branch's header ("GRUGOPS_HOME when this run used another kit home", about
  line 2516), the migrate pre-check comment ("GRUGOPS_HOME when this run used another kit home, and `--symlink` when it
  was a symlink install", about lines 5929-5930) and a third at about line 7440 with the same two clauses. U1's comment
  in install/closing-claims.test.ts (about line 333) says "the kit home is not the default one, so GRUGOPS_HOME". The
  code is right (scriptCommand, held by the env-read census's property test and the DI-17 rows); the prose is DOC-1
  (brief §1). Found by `grep -n 'used another kit home' install/*.ts` and a read of U1; not reproduced as a run.
- **Not fixed:** comments only, outside this plan's file scope (test files). Option: plan 34.1-51 (the D-38 DOC-1
  sweep) rewords them to the D-38 rule, with the same grep as its check.

## From plan 34.1-50 (gap round 4)

### DI-21: two agents-record.test.ts rows spawn mkfifo directly, which the mkfifo census in scripts/uat-gate-exit-contract.test.ts refuses

- status: resolved 2026-10-13 by the commit "fix(34.1): stage the reader-state FIFO shapes through stageShapeOrSkip
  (DI-21)" (a commit cannot carry its own sha): both rows now stage the FIFO through stageShapeOrSkip, which returns a
  printed, counted skip on a host that cannot make one; the census stays unedited and green.
- **Found during:** plan 34.1-50, a full `npx vitest run --exclude '**/scripts/e2e/**'` started after Task 3 (it was
  stopped at its 25-minute timeout, so this is not a complete suite result; the complete run is plan 34.1-52's).
- **What:** `scripts/uat-gate-exit-contract.test.ts` "NO test module spawns mkfifo itself, and the ONE spawn in the
  tree is the corpus constructor" fails, naming `install/agents-record.test.ts:2610` (added by commit df92e96b, plan
  34.1-44) and `install/agents-record.test.ts:3313` (added by commit d800e971, plan 34.1-46). Each calls
  `execFileSync("mkfifo", ...)` instead of staging the FIFO through stageShapeOrSkip, so a host that cannot make a
  FIFO gets an error rather than a counted skip. Neither line was changed by plan 34.1-50; `git blame` names the two
  commits above. The other red seen in that partial run, install/installer-fs-census.test.ts (`openAsBlobSync`
  unclassified), is the DI-03 Node 26 baseline.
- **Not fixed:** outside this plan's scope (the rows belong to plans 34.1-44 and 34.1-46). Option: route both FIFOs
  through stageShapeOrSkip, or record them in the mkfifo census with a reason; plan 34.1-52's full regression will
  report the case either way.

## From plan 34.1-52 (gap round 4)

### DI-22: printed commands outside the installer's builder name no kit home or install mode, so D-38's rule does not reach them

- status: residual at phase close (D-39); open for the human; no round 5
- **Found during:** the gap round 4 plan check, recorded by plan 34.1-52, Task 1 (2026-10-13).
- **What:** D-38 makes every command the installer's builder prints (host-tools.ts scriptCommand) state
  `GRUGOPS_HOME`, `INSTALL_MODE` (install.js) and `GRUGOPS_SRC`. Three texts outside that builder still print an
  install command that names no kit home and no install mode:
  - agent-factory/packaging/subagent.frontmatter.md (about lines 57 and 106) and the resolver comment written by
    scripts/kit-model.ts RESOLVER (about line 301) into every generated Claude Code adapter print "grugops kit not
    found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit.";
  - install/install.ts TARGET_BANNER (about line 613 at HEAD 33201603) prints
    `node install/install.js --target <this repository>` with a placeholder target.
  A user who follows one of them in a shell that exports `GRUGOPS_HOME` or `INSTALL_MODE` gets whatever that shell
  holds, which is the WR-25 shape D-38 closed for the builder's commands.
- **Relation to DI-15:** the same texts' other half (the path `install/install.js` is relative to the grugops
  checkout and does not exist in a target repository) is DI-15. The reason for not fixing them here is the same:
  they are fixed agent instruction text (D-09, T-34-13), so no install-time value (no kit home, mode or absolute
  checkout path) may enter them, and a fix is a wording decision plus a regeneration of the adapters through the
  freshness gate.
- **Not fixed:** residual at phase close by D-39; plan 34.1-52 changes none of the three files (it writes closing
  records only). Option for the human: one wording for every fixed instruction text, for example "run install.js
  from your grugops checkout, stating GRUGOPS_HOME and INSTALL_MODE as the install recorded them", decided with
  DI-15.

## From plan 34.1-54 (gap round 5)

### DI-23: over a foreign read, three uninstall lines still call the file "the install marker"

- status: open (for the human; no round 6)
- **Found during:** plan 34.1-54, Task 1 (a scratch uninstall over a user's own JSON object at the marker path, with
  GRUGOPS_HOME and HOME set to scratch directories, after the `foreign` state landed).
- **What:** the verify and the marker's `left` line now say the file was not written by install and, if it is yours,
  to leave it (DI-18). Three other lines of the same run still name the file "the install marker":
  - the closing's preserved section: ".grugops/ (seeded state) is kept; its install.json marker is reported on the next
    line." and ".grugops/install.json (the install marker): left in place, untouched (the `left` or `verify` line
    above says why).";
  - the ask-rules `left` line: ".claude/settings.json ask rules (the install marker could not be used — see the verify
    line above; nothing removed)" (uninstall.ts reportUnrecordedSettings), and its sibling pointer lines in
    noBlockRecordReason and reportUnrecordedSettings' Gemini line.
  None says to fix the file by hand, to never delete it, or that it is the record of the agents installed here, and
  none offers removal, so the plan's rules hold; the noun names the path's role, not the file's author. Uninstall
  still changes zero bytes (FD, FM).
- **Not fixed:** outside D-40's DI-18 item (the plan's sibling search listed the markerFixText, markerDefectText and
  markerUnusableText sites only) and no round 6 exists. Option for triage: word these pointer and closing lines
  through the owner (for example "the file at .grugops/install.json" when the read is `foreign`), or accept the noun
  as naming the path.

## From plan 34.1-57 (gap round 5)

### DI-24: a directory or a FIFO at the marker path gets a verify that calls it the one record install keeps

- status: residual at phase close (D-44); open for the human; no round 6
- **Found during:** review WR-38's last paragraph; recorded as residual by D-44 (ii) (human, 2026-10-14) and written
  here by plan 34.1-57, Task 1.
- **What:** plan 34.1-55 made removeMarker's `left` line the owner's for every blocked shape: a directory or a FIFO at
  `.grugops/install.json` now gets "(left in place — it could not be read as a JSON object; see the verify line
  above)". The uninstaller's module-top verify still words that read through markerFixText's non-foreign branch
  (install/install-marker.ts), which says "never delete the marker: it is the one record install keeps of the agents
  installed here". A directory or a FIFO is not a record install wrote, so that sentence is not true of it.
- **Wording only:** no removal is offered, and the directory or FIFO is left in place.
- **Not fixed:** D-44 (ii) keeps the current verify wording and records it as residual at phase close. Option for the
  human: a reader state (or a clause in markerFixText) for a blocked read whose path is not a regular file, worded
  without the record claim.

### DI-25: install's INCOMPLETE banner names a re-run after a foreign verify

- status: resolved 2026-10-17, closed by D-45 (plan 34.1-59, commits ab18b3aa, 78ba1aa8, 4f02696b)
- **Resolution:** D-45 item 3 (human, 2026-10-14, at UAT test 16, G-34.1-16) chose the second option below: install
  asks install-marker.ts installRefusal once, before any write, and over a foreign or unreadable marker exits 3 having
  written nothing in the target or the kit home; a foreign read's closing names no command. D-46 (human, 2026-10-17)
  extends the refusal to an `ok` marker whose install ledger is malformed. Plan 34.1-60 (R56b, R56c) follows the
  refusal's printed remedy to an install that a flag-less uninstall fully reverses, shows DRY_RUN reports the same
  refusal, and makes install/README.md and CHANGELOG.md say so. Before D-45 its status was "residual at phase close
  (D-44); open for the human; no round 6".
- **Found during:** round-5 planning (reproduced with `install --codex`), recorded as residual by D-44 (iii) (human,
  2026-10-14) and written here by plan 34.1-57, Task 1, which ran it again in a scratch target (HOME and GRUGOPS_HOME
  scratch, 2026-10-14).
- **What:** install over a JSON object at `.grugops/install.json` that holds none of install's fields prints the
  foreign verify (".grugops/install.json was not written by install (...)" with the skipped line's "if it is yours,
  leave it") and exits 3. The INCOMPLETE banner then prints "Once each is fixed, `<install command>` installs for the
  same agents again". There is nothing to fix in a file that is not install's, and following that command as printed
  repeats the same verify and exits 3 again. The run also writes the chosen agents' files (for `--codex`,
  `.agents/skills/grugops/`) and the seeds (AGENTS.md, memory-bank/, plans/, tools/) with no record, since the marker
  is left byte for byte.
- **Not fixed:** D-44 (iii) records it as residual at phase close. Options for the human: word the banner through the
  owner for a foreign read (no re-run named), or have install stop before its writes over a foreign read.

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

## Status after gap round 4 (plans 34.1-42 to 34.1-52)

Scope of the round is D-37 (CR-05, CR-06, WR-26, IN-33, IN-34), D-38 (WR-24, WR-25, IN-32, DI-16, DI-17) and D-39
(human, 2026-10-13): IN-28 to IN-31, DI-05 and DI-11 to DI-15 are deferred as residual at phase close, DI-03 stays a
human item, and new findings are recorded here because there is no round 5. "Not changed in round 4" below was checked
against `git diff a34bbb2e..HEAD`: the round's code changes are in install/ only (CHANGELOG.md and install/README.md
for prose); AGENTS.md, scripts/ and agent-factory/ are unchanged.

- **DI-01:** decided (D-28): the by-name exclusion stays; scripts/check-banned-claims.ts is unchanged by this round.
- **DI-02:** resolved in plan 34.1-02 (the gate reads `TEMPLATE_REL`); nothing left.
- **DI-03:** a human item; whether CI on Node 22 shows the Node 26 reds is `UNKNOWN - verify`. Plan 34.1-52's full
  regression reports them again (its SUMMARY lists each failing case against this baseline).
- **DI-04:** closed by plan 34.1-13 (commit ac790deb).
- **DI-05:** deferred as residual at phase close by D-39; not changed in round 4. install/uninstall.ts unmergeGemini is
  untouched; plans 34.1-42 to 34.1-45 and 34.1-47 to 34.1-48 changed uninstall.ts elsewhere (noBlockRecordReason,
  removeMarker, reportUnrecordedSettings, the module-top marker verifies, COMMAND_CONTEXT, finishCommand and
  keepWithoutRecord).
- **DI-06:** fixed by plan 34.1-16 under D-30 (commit fc17b822).
- **DI-07:** fixed in round 2 by plan 34.1-21 under D-31 (commits c4e2c43d, 2e6e9b96, 03ed2a0c); its remaining arm is
  DI-11.
- **DI-08:** fixed in round 2 by plan 34.1-27 under D-31 and D-33 (commits 5af55277, 0a72286c).
- **DI-09:** fixed in round 2 by plan 34.1-28 under D-31 and D-33 (commits f65cfa0b, 2a055d1a).
- **DI-10:** fixed in round 2 by plan 34.1-31 under D-31 (commit 8d730df2).
- **DI-11:** deferred as residual at phase close by D-39; not changed in round 4. removeAskRules is untouched; plan
  34.1-45 (commit 7f407082) changed reportUnrecordedSettings's ask-rules arm beside it (IN-34: over an unusable marker
  the report is a `left` line pointing at the marker's verify) and did not change which arm counts a verify or what
  the finishing command names.
- **DI-12:** deferred as residual at phase close by D-39; not changed in round 4. Plan 34.1-50 (commit 0c210f4d)
  changed the doctor's stale-adapter render and wording beside the two lines (DOCTOR_KIT_ROOT); the two "re-run
  --check from a complete kit checkout" lines still print no command.
- **DI-13:** deferred as residual at phase close by D-39; not changed in round 4. rewriteLedger's "Re-run to finish
  it." is unchanged; plan 34.1-49's `--prune-old-kit` row (commit c3d99e71) asserts which kit home the printed
  command acts on, not that entries leave the record.
- **DI-14:** deferred as residual at phase close by D-39; not changed in round 4. Plan 34.1-44 (commit 87eead65)
  changed writeMarker's skipped line (it now words the cause through markerDefectText); agentClosingLines
  and the route notes still read AGENTS_AFTER.
- **DI-15:** deferred as residual at phase close by D-39; not changed in round 4. AGENTS.md and scripts/kit-model.ts
  RESOLVER are unchanged, so the generated adapters still say `node install/install.js`; DI-22 names the kit-home
  half of the same texts.
- **DI-16:** closed by D-38: plan 34.1-44 removed the install command from the doctor's unreadable-marker FAIL (commit
  30003a2c; the FAIL now prints only the check command), plan 34.1-47 made every printed command state its kit home
  (commits fadff0bb, 335a98e3), and plan 34.1-49's R51 follows the doctor's not-installed FAIL, its install command
  and its check command as printed under conflicting values (commit c3d99e71).
- **DI-17:** closed by D-38: plan 34.1-49's `--update` row (commit fc4e57a4) and `--prune-old-kit` row (commit
  c3d99e71) run each INCOMPLETE banner's command as printed under a non-default kit home with a conflicting
  GRUGOPS_HOME in the child.
- **DI-18:** open for the human; no round 5 (recorded by plan 34.1-42, commit 8a40b76d): over a user's own JSON object
  at the marker path in a target grugops never installed into, the uninstaller's verify calls the file the record of
  the agents installed here. Wording only; uninstall changes zero bytes there.
- **DI-19:** open for the human; no round 5 (recorded by plan 34.1-45, commit 6bdda559): the doctor's ask-rules WARN
  over an unreadable marker names the wrong cause, reached only if the marker changes between two reads.
- **DI-20:** resolved by plan 34.1-51 Task 2 (commit 69523551; recorded by plan 34.1-49, commit c60277ce).
- **DI-21:** resolved by commit 4e0fa03a (recorded by plan 34.1-50, commit 73770fbf): both FIFO shapes are staged
  through stageShapeOrSkip; the mkfifo census is unedited.
- **DI-22:** residual at phase close by D-39; open for the human; no round 5 (recorded by plan 34.1-52, this
  commit): printed commands outside the installer's builder (subagent.frontmatter.md, scripts/kit-model.ts RESOLVER,
  install/install.ts TARGET_BANNER) name no kit home or install mode.

### Recorded for the human at round close (no round 5)

- **(a) The uninstall half of D-38, as read by plan 34.1-48.** D-38's wording says every printed install or uninstall
  command states its install mode. Plan 34.1-48 read it for uninstall as "a printed uninstall.js command states
  GRUGOPS_HOME and GRUGOPS_SRC and no INSTALL_MODE", because uninstall.js reads no INSTALL_MODE (plan 34.1-49's
  env-read census holds that, and its scriptCommand property test asserts the stated set exactly) and refuses
  `--symlink`. The follow-as-printed harness keeps a conflicting INSTALL_MODE in the child for every followed
  uninstall command (H4), so an exported INSTALL_MODE cannot change what a printed uninstall command does. The human
  confirms this reading or amends D-38's wording.
- **(b) DRY_RUN is the user's chosen preview.** Plan 34.1-49 classes DRY_RUN in the env-read census as "preview": no
  printed command states it, so a DRY_RUN exported in the user's shell turns a followed command into a preview that
  writes nothing. Residual at phase close (D-39), not fixed.

## Status after gap round 5 (plans 34.1-53 to 34.1-57)

Scope of the round is D-40 (human, 2026-10-14; past the four-round cap for this one round only), with D-42 (WR-37
narrowed), D-43 (WR-38 and its kitPreflight sibling) and D-44 (DI-18's defaults, and two residual rows). It closed
DI-19 (plan 34.1-53), DI-18 (plan 34.1-54), WR-38 (plan 34.1-55) and WR-37 as narrowed by D-42 (plan 34.1-56). IN-35
to IN-38 and everything D-39 lists are residual at phase close; there is no round 6. "Not changed in round 5" below was
checked against `git diff 39b3039f..HEAD`: the round's code changes are in install/ only (CHANGELOG.md and
install/README.md for prose); AGENTS.md, scripts/ and agent-factory/ are unchanged.

- **DI-01:** decided (D-28): the by-name exclusion stays; scripts/check-banned-claims.ts is unchanged by this round.
- **DI-02:** resolved in plan 34.1-02 (the gate reads `TEMPLATE_REL`); nothing left.
- **DI-03:** a human item; whether CI on Node 22 shows the Node 26 reds is `UNKNOWN - verify`. Plan 34.1-57's full
  regression reports them again (its SUMMARY lists each failing case against this baseline).
- **DI-04:** closed by plan 34.1-13 (commit ac790deb).
- **DI-05:** residual at phase close (D-39, D-40); not changed in round 5. install/uninstall.ts unmergeGemini is
  untouched; plans 34.1-54 and 34.1-55 changed uninstall.ts elsewhere (removeMarker and its header comment, the
  updateKeptMarker comment, the MARKER_READ module comment and the module-top unreadable verify).
- **DI-06:** fixed by plan 34.1-16 under D-30 (commit fc17b822).
- **DI-07:** fixed in round 2 by plan 34.1-21 under D-31 (commits c4e2c43d, 2e6e9b96, 03ed2a0c); its remaining arm is
  DI-11.
- **DI-08:** fixed in round 2 by plan 34.1-27 under D-31 and D-33 (commits 5af55277, 0a72286c).
- **DI-09:** fixed in round 2 by plan 34.1-28 under D-31 and D-33 (commits f65cfa0b, 2a055d1a).
- **DI-10:** fixed in round 2 by plan 34.1-31 under D-31 (commit 8d730df2).
- **DI-11:** residual at phase close (D-39, D-40); not changed in round 5. removeAskRules is untouched; plan 34.1-54
  (commit 9ff8142e) reworded removeMarker's header comment just below it and did not change which arm counts a verify
  or what the finishing command names.
- **DI-12:** residual at phase close (D-39, D-40); not changed in round 5. Plan 34.1-53 (commit 6aa1f4c9) changed the
  doctor's ask-rules check and plan 34.1-56 (commit 2a47f596) added the moved-kit FAIL to the kit-root cross-check,
  both in doctor() beside the two lines; the two "re-run --check from a complete kit checkout" lines still print no
  command.
- **DI-13:** residual at phase close (D-39, D-40); not changed in round 5. rewriteLedger's "Re-run to finish it." is
  unchanged; no round-5 hunk is in rewriteLedger or rewriteLedgerWithout.
- **DI-14:** residual at phase close (D-39, D-40); not changed in round 5. Plan 34.1-54 (commit cc2a57b5) changed
  writeMarker's step (it now passes its step to markerFixText); agentClosingLines and the route notes still read
  AGENTS_AFTER.
- **DI-15:** residual at phase close (D-39, D-40); D-41 decided its wording with DI-22 as one backlog item, not built
  in this phase. AGENTS.md, scripts/kit-model.ts RESOLVER and install/install.ts TARGET_BANNER are unchanged in round
  5, so the generated adapters still say `node install/install.js`.
- **DI-16:** closed by D-38 (as after round 4; plans 34.1-44, 34.1-47 and 34.1-49, commits 30003a2c, fadff0bb,
  c3d99e71).
- **DI-17:** closed by D-38 (as after round 4; plan 34.1-49, commits fc4e57a4, c3d99e71).
- **DI-18:** closed by plan 34.1-54 under D-40 and D-44 (commits cc2a57b5, dcfc7f9e, 9ff8142e): a JSON object holding
  none of install's five fields reads `foreign` and is worded "not written by install; if it is yours, leave it",
  with no next step and no removal offer (recorded by plan 34.1-42, commit 8a40b76d).
- **DI-19:** closed by plan 34.1-53 under D-40 (commits 6aa1f4c9, b72058ca): the doctor's ask-rules check reads
  DOCTOR_MARKER_READ, and the unreachable "install ledger is unknown" WARN is deleted (recorded by plan 34.1-45,
  commit 6bdda559).
- **DI-20:** resolved by plan 34.1-51 Task 2 (commit 69523551), as after round 4.
- **DI-21:** resolved by commit 4e0fa03a, as after round 4.
- **DI-22:** a backlog item. D-41 decided its wording (point at `--check` and name the checkout), with DI-15; it is
  not built in this phase (recorded by plan 34.1-52).
- **DI-23:** open for the human; no round 6 (recorded by plan 34.1-54, commit 5e0629d6): over a foreign read, three
  uninstall lines still call the file "the install marker". Wording only; none offers removal or claims the record.
- **DI-24:** residual at phase close (D-44 (ii)); open for the human; no round 6 (recorded by plan 34.1-57, this
  commit): a directory or a FIFO at the marker path gets a verify that calls it the one record install keeps.
- **DI-25:** residual at phase close (D-44 (iii)); open for the human; no round 6 (recorded by plan 34.1-57, this
  commit): install's INCOMPLETE banner names a re-run after a foreign verify, and the run writes the chosen agents'
  files and the seeds with no record.

### Recorded for the human at round close (no round 6)

- **(a) The uninstall reading of D-38 stays open for the human (D-40).** Plan 34.1-48 read D-38 for uninstall as "a
  printed uninstall.js command states GRUGOPS_HOME and GRUGOPS_SRC and no INSTALL_MODE", because uninstall.js reads no
  INSTALL_MODE and refuses `--symlink` (round-close item (a) after round 4). The human confirms this reading or amends
  D-38's wording.
- **(b) DRY_RUN, review IN-37, is residual at phase close (D-40).** No printed command states DRY_RUN, so a DRY_RUN
  exported in the user's shell turns a followed command into a preview that writes nothing.
- **(c) WR-37 closed as narrowed by D-42.** A kit home moved by hand is reported only when `--check` is given the new
  kit home through GRUGOPS_HOME; a plain `--check` FAILs on the absent kit, and the doctor's other install commands
  copy a kit to the recorded kit home. A first-class moved kit home (the kit-home record following a move) is outside
  this phase (plan 34.1-56, commits 2a47f596, 4ee3c6a2).
- **(d) DI-22 and DI-15 are the D-41 backlog item:** one wording for the fixed instruction texts that print a bare
  `node install/install.js` (point at `--check` and name the checkout), built later with an adapter regeneration
  through the freshness gate.
- **(e) New items for the human from this round:** DI-23 (open), DI-24 and DI-25 (residual by D-44).

## Found during the fix round after gap round 5 (D-45)

### DI-26: with `.grugops` a regular file or a link to nothing, the uninstaller's closing still calls `.grugops/` seeded state

- status: open for the human; not in D-45's scope (recorded by plan 34.1-58 Task 3, commit e1a5b165)
- **What:** with `.grugops` a regular file or a symbolic link to nothing, the uninstaller's closing still says
  `.grugops/ (seeded state) is kept; its install.json marker is reported on the next line.` Nothing at `.grugops` is a
  directory of seeded state then. The next line, which says .grugops/install.json was left in place and points at the
  left or verify line above, is true, and no line says the marker is not present (WR-39 holds). Reproduced in a
  scratch run with HOME and GRUGOPS_HOME under the session scratchpad: install --codex, `.grugops` replaced by a file
  holding one line, then a flag-less uninstall.

### DI-27: install over an unreadable kit-home record copies the kit and leaves that run's backup unrecorded

- status: open for the human; not in D-45's or D-46's scope (recorded by plan 34.1-59 Task 3, commit 4f02696b)
- **What:** found by the Task 1 executor's sibling search, read from the code, not reproduced in a run. The same
  class as DI-25 one file over: the kit home's own record, `<GRUGOPS_HOME>/.grugops-kit.json`. When readKitHomeRecord
  answers `unreadable`, install.ts writeKitHomeRecord prints a verify, leaves the record as it is and returns, but the
  run has already copied the kit into the kit home (writeKitHomeRecord runs after copyKit), so a backup made in the kit
  home that run stays unrecorded: prune never removes it, and the verify says to remove it by hand. installRefusal
  (plan 34.1-59) asks only the target's marker, so the kit-home record is not refused before the kit copy. Option for
  the human: a pre-write refusal over an unreadable kit-home record, decided by one owner the way installRefusal
  decides the marker's, or accept the unrecorded backup as named by the verify.

## Status after the D-45 fix round (plans 34.1-58 to 34.1-60)

Scope of the round is D-45 (human, 2026-10-14, at UAT tests 15 and 16; D-40's flexibility clause, one short fix round
of three items) and D-46 (human, 2026-10-17, option-a at plan 34.1-59 Task 2). It closed CR-08 and WR-39 (plan
34.1-58, commits e59106b8, 28db9a98, e1a5b165) and DI-25 (plan 34.1-59, commits ab18b3aa, 78ba1aa8, 4f02696b; plan
34.1-60 Task 1 for the user-side rows and the docs). D-45 sent the remaining open items to backlog phases 999.6 to
999.9 in ROADMAP.md; they are not planned in this phase. Every other id is as after round 5.

- **DI-01:** decided (D-28): the by-name exclusion stays, as after round 5.
- **DI-02:** resolved in plan 34.1-02; nothing left.
- **DI-03:** confirmed absent on Node 22 CI by UAT test 10 (2026-10-14, result pass); still the Node 26 local
  baseline (install/installer-fs-census.test.ts, openAsBlobSync), which plan 34.1-60's full regression reports again.
- **DI-04:** closed by plan 34.1-13 (commit ac790deb).
- **DI-05:** residual at phase close (D-39, D-40), as after round 5; not in D-45's scope.
- **DI-06:** fixed by plan 34.1-16 under D-30 (commit fc17b822).
- **DI-07:** fixed in round 2 by plan 34.1-21 (commits c4e2c43d, 2e6e9b96, 03ed2a0c); its remaining arm is DI-11.
- **DI-08:** fixed in round 2 by plan 34.1-27 (commits 5af55277, 0a72286c).
- **DI-09:** fixed in round 2 by plan 34.1-28 (commits f65cfa0b, 2a055d1a).
- **DI-10:** fixed in round 2 by plan 34.1-31 (commit 8d730df2).
- **DI-11:** to backlog 999.6 (option (a), D-45; UAT test 14); not built in this phase.
- **DI-12:** residual at phase close (D-39, D-40), as after round 5.
- **DI-13:** residual at phase close (D-39, D-40), as after round 5.
- **DI-14:** residual at phase close (D-39, D-40), as after round 5.
- **DI-15:** to backlog 999.8 with DI-22 as the D-41 wording item (D-45; UAT test 11), with the UAT note that root
  README.md line 18 and the install/README.md examples show a bare `node install/install.js`.
- **DI-16:** closed by D-38 (plans 34.1-44, 34.1-47 and 34.1-49, commits 30003a2c, fadff0bb, c3d99e71).
- **DI-17:** closed by D-38 (plan 34.1-49, commits fc4e57a4, c3d99e71).
- **DI-18:** closed by plan 34.1-54 under D-40 and D-44 (commits cc2a57b5, dcfc7f9e, 9ff8142e).
- **DI-19:** closed by plan 34.1-53 under D-40 (commits 6aa1f4c9, b72058ca).
- **DI-20:** resolved by plan 34.1-51 Task 2 (commit 69523551).
- **DI-21:** resolved by commit 4e0fa03a.
- **DI-22:** to backlog 999.8 with DI-15 as the D-41 wording item (D-45; UAT test 11), the README bare-install note
  included.
- **DI-23:** to backlog 999.9 (D-45; UAT test 16); not built in this phase.
- **DI-24:** to backlog 999.9 (D-45; UAT test 16); not built in this phase.
- **DI-25:** closed by plan 34.1-59 under D-45 and D-46 (commits ab18b3aa, 78ba1aa8, 4f02696b); proven from the
  user's side and documented by plan 34.1-60 Task 1.
- **DI-26:** open for the human (recorded by plan 34.1-58 Task 3, commit e1a5b165); not in D-45's scope.
- **DI-27:** open for the human (recorded by plan 34.1-59 Task 3, commit 4f02696b); not in D-45's or D-46's scope.

### Recorded for the human at phase close

- **(a) D-38's uninstall reading is confirmed by D-45.** A printed uninstall.js command states GRUGOPS_HOME and
  GRUGOPS_SRC and no INSTALL_MODE, because uninstall.js reads no INSTALL_MODE and refuses `--symlink` (plan 34.1-48's
  reading, round-close item (a) after rounds 4 and 5).
- **(b) IN-35 to IN-42 are residual at phase close (D-45).** IN-39's `given: ... not used` header is left as it is:
  it is not in the moved-kit predicate's lines that plan 34.1-58 changed, so D-45 item 1 does not reach it. DRY_RUN
  (review IN-37) stays residual as recorded after round 5.
- **(c) WR-40 goes to backlog 999.7 with the D-41 wording item (D-45; UAT test 15).**
- **(d) D-46's answer on the malformed install ledger: option-a (human, 2026-10-17).** Install refuses before any
  write over an `ok` marker whose install ledger is malformed, exactly as over a foreign or unreadable marker
  (installRefusal answers markerRemedy for every read; plan 34.1-59 Task 3, commit 4f02696b). No DI row: option-b
  would have recorded one.
- **(e) New items for the human from this round:** DI-26 and DI-27 (open).

## Status after the D-47 fix round (plans 34.1-61 and 34.1-62)

Scope of the round is D-47 (human, 2026-10-17, after the D-45 fix round's re-verification, gaps_found 10/12): one
last fix round for WR-41, WR-42 and WR-43, the pre-write refusal's printed text, then the phase closes whatever the
re-verification says. Plan 34.1-61 fixed the three (commits e24e40a9, 82941bc9, fc4eed54) and plan 34.1-62 Task 1
brought install/README.md and CHANGELOG.md in line (commit 048ccf08). Plan 34.1-61 recorded no new DI (no DI-28).
Every other id is as after the D-45 fix round.

- **DI-26:** open; not in the last fix round (D-47); accepted at phase close and carried to the backlog.
- **DI-27:** open; not in the last fix round (D-47); accepted at phase close and carried to the backlog.
- **DI-01 to DI-25:** as after the D-45 fix round (section above).

### Recorded for the human at phase close

- **(a) WR-41, WR-42 and WR-43 are fixed by plan 34.1-61 (D-47).** The pre-write refusal is decided before the agents
  are chosen, so a flag-less run over a marker install cannot use exits 3 with the marker's verify (WR-42, commit
  e24e40a9); its closing names agents only when an agent flag or the agent list named them, else the install command
  with no agent flag (WR-41, commit 82941bc9); a refused `--migrate` run prints the migrate banner and the --migrate
  command (WR-43, commit fc4eed54). The docs say the same (plan 34.1-62 Task 1, commit 048ccf08).
- **(b) IN-43 to IN-46 are deferred by D-47:** not in the last fix round; accepted at phase close and carried to the
  backlog. IN-45: the agent list still comes before the refusal.
- **(c) The live per-host runs stay human items (D-19).**
- **(d) The clean-repository `--migrate` fall-through** (a `--migrate` over a repository with no old layout and no
  install) was checked by plan 34.1-61's sibling search and left as it is: it is an ordinary install by D-11, and its
  handoffs backup already ran in that run, so a plain re-run finishes it.

## Phase close (D-48, human, 2026-10-17)

Phase 34.1 is closed as D-47 decided; no further round. DI-26 and DI-27 stay open and are carried to backlog Phase
999.10, together with the review's WR-44, IN-43..IN-49 (34.1-REVIEW-DISPOSITION.md, all `deferred`, open 0).

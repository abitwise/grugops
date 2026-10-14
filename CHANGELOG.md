# Changelog

All notable changes to grugops are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

> **A note on versions.** `2.1.0` (tag `v2.1`, 2026-09-18) is the first published SemVer release;
> the artifact version in `agent-factory/VERSION`, `.claude-plugin/plugin.json` and `package.json`
> agree on it, and the break-contract applies from here. Before it, the artifact version was the
> pre-release seed `0.1.0`, and the `v1.0`, `v1.1`, `v1.2` and `v2.0` entries below are the
> project's internal milestone tags (they match `git tag`), not published SemVer releases.

## [Unreleased]

Phase 33 (Live Capture & Windows Portability) was open when 2.1.0 was cut and lands in the next
release, together with Phase 33.1, which retires the Bash command guard, Phase 34, which adds a
per-role effort setting and Pi support, and Phase 34.1, which installs per agent and replaces Gemini
CLI with Antigravity CLI.

### Removed

- The Bash PreToolUse command guard, the command model it read, and its test corpus (33.1 D-17).
  grugops no longer decides from a shell string whether a command is a production deploy or a
  protected-branch merge. Thirty-three phases of fixes showed that no parser of shell text could be
  closed against every way of writing a command, so the guard is retired rather than patched again.
- The whole two-key floor-grant family, including the deploy-approval environment variable, the run
  banner, the two-key evaluator and the checkpoint-note writer whose only production caller was
  the guard (33.1 D-17, D-26).
- UAT oracle A2, which asserted the guard's deny, and the prod-deploy probe case in the live
  capture runner (33.1 D-22, D-28). The live capture now proves the spawn and dual-path criteria
  only.
- Gemini CLI support (Gemini CLI is discontinued; its registry row is now Antigravity CLI, 34.1
  D-12). Install no longer reads, creates or edits `.gemini/settings.json`: the `context.fileName`
  merge, the Gemini entry gate that `--check` asked, and the `gemini-settings` adapter kind are
  deleted, and no `.gemini/skills/` path is ever written. A Gemini settings change an earlier install
  recorded in the install ledger is carried unchanged by a re-install, and uninstall still reverses
  it from that record. This repository's own `.gemini/settings.json` is deleted too (34.1 D-25).
- `hostsReading`, an unused export of `install/host-tools.ts` that answered which hosts could read a
  file without asking the entry gate (34.1 D-17, review IN-14).

### Added

- The standalone installer translates the `checkpoints` config into Claude Code `permissions.ask`
  rules in `.claude/settings.json`: `git push` and `gh pr merge` for protected-branch merges, and
  the deploy and publish tools the retired guard named for production (33.1 D-18). The set covers
  only those tools; local ref writes are not added, because the git host is the hard floor
  (33.1 D-29). The installer records what it added in a ledger, so a re-run is idempotent,
  pre-existing user rules are preserved, and uninstall removes only what install added.
- A read-only git-host check, `tools/grugops/host-protection.js`, that the gate and release
  workflows run. It reports `protected`, `unprotected` or `UNKNOWN - verify` for each protected
  branch, and never changes host settings (33.1 D-19). It does not read the production
  environment: its environment line reads `UNKNOWN - verify` by design (33.1 D-31).
- A "Where each floor is enforced" section in `docs/GUARANTEES.md`, generated from the audit model,
  that names the hard-floor, speed-bump and prose tier of every safety floor.
- A per-role reasoning-effort setting, `models.effort`, inside the existing `models` block of
  `factory.config.json` (34 D-02). It has a preset, `none` or `tiered`, and a sparse `roles` map
  that overrides the preset for the roles it names. The legal levels are `inherit`, `low`,
  `medium`, `high`, `xhigh` and `max`. Any other key or value is refused by name, and the refusal
  writes no adapter (34 D-03). The `tiered` effort preset gives `high` to the roles the model
  `tiered` preset gives `opus`, and `medium` to the others (34 D-04). The model preset `tiered`
  does not change effort on its own (34 D-05). The level is written as an `effort:` line in the
  Claude Code sub-agent adapters only; no other host receives it. With no `models.effort` block,
  every role is `inherit`, which writes no `effort:` line, so a repository without the setting gets
  the same adapters as before (34 D-06). `agent-factory/config/factory.config.md` documents the
  setting and what Claude Code does with a level the model does not support.
- A foundation guard, `guard_effort_assignment`, that fails by name when a committed adapter's
  `effort:` line differs from the level the configuration resolves to (34 D-15).
- Pi (pi.dev) as a supported host. The installer reports `pi` when the target root has a `.pi`
  entry. An install for Pi (`--pi`, 34.1 D-06) writes a `/grugops` prompt template at
  `.pi/prompts/grugops.md`, which only points Pi at the Orchestrator and holds no role text (34 D-10,
  D-16, D-17). The template also
  names the kit route: after a scripted install, which puts the kit in the shared kit root and not
  in the repository, the kit root is the `kitRoot` field of `.grugops/install.json` (34 D-26).
  Whether Pi follows the route on a live run is `UNKNOWN - verify`; see `install/README.md`, "Using
  grugops on Pi". Install records the file in the install ledger in `.grugops/install.json` and never overwrites a file a user already
  has at that path. Uninstall removes the template only if install recorded it and it is unchanged
  (34 D-13). `install/README.md`, both READMEs, `docs/faq.md`, `CLAUDE.md` and the per-host tables
  in `agent-factory/packaging/adapters.md` document Pi.
  The model and effort settings do not reach Pi, because grugops writes no per-agent definition
  for it (34 D-12).
- A registry of supported host tools, `install/host-tools.ts`, as the one place the set of hosts is
  declared (34 D-11). The installer's tool detection and closing host line, the dispatch-table UAT
  oracle, the structure validator and the per-host documentation tables are checked against it. A
  scan of the tracked tree fails on a host count word, or on a host list that names every
  non-spawning host but one.
- Per-agent install (34.1 D-01, D-06). `install.js` takes one flag per supported agent, derived from
  the host registry: `--claude`, `--codex`, `--antigravity`, `--opencode`, `--copilot` and `--pi`.
  There is no all-agents flag. A run writes the shared files (`AGENTS.md`, `tools/grugops/`, the
  per-repo state and the install marker) and the entries of the agents it is for, and records the
  agents chosen for the repository and not yet removed in a new `agents` field of
  `.grugops/install.json`. Install only adds: naming fewer agents than are installed keeps the
  others' files and records, and the closing notes name the agents left installed and the uninstall command that removes one (34.1 D-04). The closing notes
  also give each chosen agent's invocation as its documentation states it, and say that grugops has
  not run it on a live host (`UNKNOWN - verify`, 34.1 D-19, D-21). An agent flag combined with
  `--check`, `--update` or `--prune-old-kit` is bad usage, exit `2` (34.1 D-25). The contract is in
  `install/README.md`, "Command-line contract — choosing agents".
- The agent list at a terminal (34.1 D-02). With a terminal on standard input and output, no agent
  flag and no `--yes`, install shows a checkbox list of every supported agent, with the installed and
  detected agents checked and labelled. Ctrl-C, or confirming with no agent checked, exits `1` and
  writes nothing. Any agent flag, `--yes`, or a standard input or output that is not a terminal skips
  the list. The list turns raw mode off and shows the cursor again however it ends.
- Entries for Codex CLI, Antigravity CLI and OpenCode (34.1 D-08, D-09, D-20). Codex CLI and
  Antigravity CLI share one agent skill, `.agents/skills/grugops/SKILL.md`, and OpenCode gets the
  command `.opencode/commands/grugops.md`. With the Pi template, these entries are rendered by
  `scripts/generate-host-entries.ts` from one pointer file,
  `agent-factory/packaging/host-entry.pointer.md`, committed, and held byte for byte by
  `npm run freshness:host-entries` (34.1 D-11). Each is a pointer that carries the start-here sentence
  and the kit route and no role text. Codex CLI does not turn skills into slash commands, so Codex users
  type `$grugops` or pick the skill from `/skills`; Antigravity CLI and OpenCode offer `/grugops`
  (34.1 D-21). `install/README.md` has a "Using grugops on <agent>" section for each agent other
  than Claude Code, with the sources. Whether any of these agents reaches the Orchestrator on a live
  run is `UNKNOWN - verify`.
- OpenCode's `external_directory` rule (34.1 D-14). An install for OpenCode adds one
  `permission.external_directory` allow rule for the kit root, written home-relative, as the last
  member, to the project `opencode.json` (creating the file when there is none). The rule allows
  every tool call OpenCode gates by `external_directory` on the kit path, edits included; whether
  OpenCode's separate `edit` permission still asks before an edit there is `UNKNOWN - verify`.
  Install prints that sentence whenever it writes, finds or proposes the rule. Every other byte of the file is
  kept; the rule is recorded in the install ledger, and uninstall takes out exactly that rule while
  `external_directory` is still what install left there. When the kit is not under your home
  directory, the kit path holds a glob or control character, or the file is JSONC, has a duplicate
  key, is a link or a special file, or only `opencode.jsonc` exists, install writes nothing there and
  prints the rule to add by hand as a `note`. How the project rule combines with a global OpenCode
  rule is `UNKNOWN - verify`.
- Per-agent uninstall (34.1 D-05, D-20). `uninstall.js` takes the same agent flags and removes only
  what the install ledger records for the agents named. A file two agents share (the agent skill of
  Codex CLI and Antigravity CLI) stays while either is installed. The shared files go only with a
  flag-less uninstall or with the removal of the last installed agent, and the closing line names the
  agents removed and the agents still installed.

### Changed

- **Breaking for repositories without the stale-approval settings.** The branch floor of the
  read-only git-host check now also requires stale approvals to be dismissed when new commits are
  pushed and the most recent push to be approved (33.1 D-33). Without them, an agent could push after
  a human approved and merge on the old approval. A branch whose host shows either setting off reads
  `unprotected`, and one whose host answer does not show the setting reads `UNKNOWN - verify`. The
  no-bypass line now states what the check reads: "does not let the account the agent works under
  bypass it" (33.1 D-31). On a ruleset the check reads only whether that account can bypass, so keep
  the administrator role off the ruleset's bypass list yourself. The settings to turn on are named in
  `install/README.md` §5.
- A file you edited, which uninstall leaves, now keeps the install marker `.grugops/install.json`.
  Uninstall exits `0` and ends with `== uninstall complete — N recorded item(s) left in place;
  .grugops/install.json kept to record them ==`, and the marker is rewritten to list only what is
  still there. Remove or restore the file and re-run uninstall to finish. To keep the file instead, take
  its entry out of the install ledger by hand and run the printed command, which finishes the uninstall
  and leaves the file. Never delete the marker: after a flag-less uninstall it still records what install
  made here, and after an uninstall with agent flags it still records the agents that stay. Directories
  and backups install recorded do not keep the marker: this narrows 33.1 D-33 (b), which keeps the
  marker while any recorded entry is left, to the entries that hold content install wrote, and the
  repository owner has yet to confirm it. The consequence:
  once uninstall removes the marker, a backup install recorded is on no record any more, so
  `--prune-old-kit` can no longer remove it. Run `--prune-old-kit` before uninstall if you want
  grugops to remove its backups.
- **Breaking for backups made by earlier versions.** Install now records each backup it makes: the in-repo
  kit, legacy config and `plans/handoffs` backups of `--migrate` and the backups of edited kit files in
  the install ledger in `.grugops/install.json`, and the kit backups in the kit home's `.grugops-kit.json`.
  `--prune-old-kit` removes only recorded backups, so a backup made before this release has no record:
  prune leaves it and names it (`not recorded by install`). Remove such a backup by hand when you no
  longer need it (33.1 D-33 (c)).
- The install marker `.grugops/install.json` keeps one install ledger, the field `ledger`, in place of
  the six records `createdDirs`, `createdFiles`, `geminiSettings`, `kitFiles`, `claudeAskRules` and
  `appendedBlocks`, behind one ownership check (33.1 D-33). A marker written by an earlier build of
  this release, before the ledger, is read as no record: uninstall changes nothing and exits `3` with
  the remedy (re-run the installer, then the uninstaller). No released version wrote that shape. A
  runnable install recorded is removed by its record, even when the checkout you uninstall from no
  longer ships it.
- The CLAUDE.md "Safety (hard)" constraint now defines mechanical enforcement as the git host
  (branch protection and deployment environments) plus host CLI permission prompts, not a grugops
  PreToolUse parser (33.1 D-21).
- The `open_pr` and `test_integrity` checkpoints are prose-tier rules. No hook enforces them, and
  every document says so (33.1 D-26).
- A re-install no longer overwrites a grugops skill or adapter file you edited without asking
  (33.1 D-32). At a terminal it lists the edited files and asks whether to back them up, as
  `<file>.grugops-edited-<UTC stamp>`, and refresh the whole kit (default no). Without a terminal,
  and with `--yes` (which answers only the target question), it writes no kit file and exits `3`;
  the new flag `--backup-edited-kit` gives the answer explicitly. Backups are written whole, keep the
  edited file's permission bits, are recorded in the install ledger, and are never removed by
  uninstall or `--prune-old-kit`; uninstall reports each one by its record. The first re-install over an install made before this release asks
  once, and an unattended `--migrate` over the old layout needs `--backup-edited-kit`.
- The kit write is all or nothing: install checks every kit file and renders every adapter before it
  writes the first one, and a refusal leaves every kit file as it was. `--migrate` is whole or not at
  all in the same way. A run that writes no kit file keeps the marker's kit record and kit version,
  so `--check` warns about the version skew until a refresh succeeds.
- The install marker is bound to its directory: install records `target`, the real path of the
  repository. A repository that is moved, renamed, copied or cloned with its marker reads as not
  installed there: uninstall changes nothing and names the remedy (set `target` by hand for the same
  repository, or re-run install), and `--check` warns. A re-install re-binds the marker and carries
  none of the old records, so files the earlier install made are then left and reported by uninstall.
- **Breaking change for installs made with 2.1.0 or earlier.** Their marker has no `target` and
  none of the new records, so uninstall changes nothing on such an install, exits `3`, and prints
  the remedy. To remove one, re-install with this release, then uninstall. The re-install binds the
  marker to the repository and records what it writes; the uninstall then removes the skills, the
  adapters, the ask rules and runnables that install recorded, and the marker. Measured on an
  install made by the 2.1.0 installer: an unattended re-install needs `--backup-edited-kit`,
  because the 2.1.0 orchestrator adapter differs from this release's and has no record, so it counts
  as possibly edited and is kept as a backup; and the uninstall leaves what the earlier install made
  and this one did not record (`AGENTS.md`, the `CLAUDE.md` and Copilot pointer blocks, the Gemini
  entry, the earlier runnables, the backup) and reports each for removal by hand. Setting `target`
  in the marker by hand instead removes only the skills byte-identical to the kit, and the marker.
  See `install/README.md`, "Undo".
- `.claude/settings.json`, and a `.gemini/settings.json` whose recorded change uninstall reverses, are
  edited in place: only the entries install adds or uninstall removes change, and every other byte (number spelling, key order, spacing, line ends) is
  kept, so install followed by uninstall gives the file back byte for byte. A settings file with a
  comment, a trailing comma, bytes that are not UTF-8 or a duplicate key on the edited path is
  refused (`verify`, exit `3`) and left untouched.
- A symbolic link at a path install writes, including the common `CLAUDE.md -> AGENTS.md` link, is
  no longer written through: install reports a `verify` line (exit `3`) and adds no pointer there.
- `INSTALL_MODE` other than `copy` or `symlink` is bad usage (exit `2`) before anything is written.
- The shared kit home keeps a record, `~/.grugops/.grugops-kit.json` (or under `$GRUGOPS_HOME`), of
  what install wrote there. Install replaces only a kit that record says it wrote; anything else at
  `agent-factory/` (a directory it did not record writing, a symbolic link, a file) is renamed to
  `agent-factory.bak.<ISO>` and recorded, never deleted (33.1 D-33, the sibling of review CR-01). Every
  kit home written before this release has no record, so the first re-install or `--update` over it
  leaves one such backup there; remove it by hand once you no longer need it. Install's temporary
  directories in the kit home are exclusive `mkdtemp` directories and are never removed by a fixed name.
- Known and accepted: a re-install replaces the kit the kit-home record names
  (`~/.grugops/agent-factory`) with a fresh copy, so an edit made inside it is overwritten with no
  backup (human decision, 2026-09-30; a backup of kit-home edits is deferred).

- The coordinator adapter's `tools:` grant carries the plugin's MCP admission tool under the
  platform's scoped name, `mcp__plugin_grugops_grugops__propose_note`, through a new `admit`
  capability token in the role generator's closed vocabulary (declared only by
  `agent-factory/roles/orchestrator.md`). On the `--agent` path the session's tool list is the
  adapter's grant, so until now the coordinator could not reach the sanctioned writer there. The
  canonical frontmatter alphabet admits `_` for this — one character, recorded as decision
  D-33-R3-02; every YAML-significant byte stays refused.
- Every note the sanctioned writer (`scripts/context-io.ts`) composes now carries a `seal` field —
  `sha256:` and 64 hex digits over the note's bytes without that line — as the last line inside the
  frontmatter fence. The contract (`agent-factory/contracts/context-note.md`) documents the field,
  what it distinguishes, and what it does not.
- The coordinator adapter's Degraded-tier line now reads "the non-Claude-Code host CLIs" instead of
  "the four non-Claude-Code CLIs", so it no longer states a host count (34 D-14). It is the only
  adapter line Phase 34 changes in a repository without an effort setting.
- Host lists in the documentation now include Pi, and sentences that stated a number of host tools
  no longer state one (34 D-11).
- **Breaking for unattended installs.** An install with no agent flag and no terminal (`--yes`, CI)
  is no longer for every host (34.1 D-03, D-23). It is for the agents recorded in the `agents` field
  of `.grugops/install.json`; else, for a marker with an install ledger and no `agents` field (an
  install by an earlier build of this release), Claude Code, Copilot and Pi, the agents those
  installs wrote files for; else the agents detected in the repository. With none of these it writes
  nothing, exits `1`, and names every agent flag. For existing installs this means: an install with a
  ledger re-installs Claude Code, Copilot and Pi, and its Gemini settings record does not choose
  Antigravity CLI; a 2.1.0 install, which kept no ledger, falls to detection; Gemini settings are no
  longer written; and the Pi template is written only for Pi.
- `install.js --check` reports only the agents installed in the target: the recorded agents, the
  legacy set for an older marker, or, with nothing recorded, the detected agents with a `note` that
  says so. Only those agents get a `reach` line or a counted finding, and the Claude Code checks run
  only when Claude Code is installed (34.1 D-07).
- GitHub Copilot CLI is detected only by `.github/copilot-instructions.md`. A bare `.github/`
  directory, which most GitHub repositories have, no longer selects or pre-checks Copilot (34.1 D-24).
- Antigravity CLI replaces Gemini CLI in the host registry (34.1 D-12, D-13, D-22): id
  `antigravity`, flag `--antigravity`. It reads `AGENTS.md` natively and the agent skill it shares
  with Codex CLI. Install detects it by a `.gemini` entry in the repository root, the old Gemini CLI
  signal, which is `UNKNOWN - verify` for Antigravity CLI. Every per-host table names it.

### Fixed

- The host check's `--json` output now arrives whole when piped to a reader that is slow to read.
  It was cut at 64 KiB, because the check exited before its output was flushed (33.1 gap round 2
  review, WR-04).
- The host check refuses a command line it cannot read. An unknown argument (such as
  `--brnach release`), or `--branch`, `--env` or `--gh-script` with no value, exits 2 before any
  request to the host; before, it was ignored or its value dropped (IN-04).
- `--prune-old-kit` removes only backups install recorded, and only while they are unchanged since
  install made them: every file's bytes and permission bits, every link and every name in the backup.
  It used to remove any file or directory whose name ended in `.bak.<ISO>`, at the target root and in
  the kit home, so a user's `thesis.bak.<ISO>/` or `budget.xlsx.bak.<ISO>` was deleted, with exit `0`
  (33.1 review CR-02). Anything else named like a backup is now left and named, and a `plans/handoffs`
  backup or a backup of an edited kit file is never pruned. After a removal, prune takes the backup's
  entry out of the record that listed it.
- A backup of an edited kit file (D-32) keeps the edited file's permission bits, so a `0600` file no
  longer gets a world-readable backup (33.1 review IN-03).
- An uninstall that could not finish keeps the install marker, so re-running it after fixing the cause
  finishes the reversal. With `.claude/agents` read-only, uninstall exited `3` with a `verify` line per
  adapter and still deleted the marker, so the re-run found no record and left every adapter in place
  as unrecorded (33.1 review WR-02). The marker is now removed only when no `verify` was counted for a
  recorded path and everything install recorded writing is removed, reversed or already gone;
  otherwise it is kept and rewritten to list only what is left.
- A Gemini settings file install created is reversed whole after a user edit. Install wrote
  `context.fileName: ["AGENTS.md", "GEMINI.md"]` into a file it created (before 34.1 D-12 removed
  the write); after you added a key,
  uninstall removed only the `AGENTS.md` element and left install's own `["GEMINI.md"]`, with no record
  left to reverse it (33.1 review WR-03). While the list is still the one install wrote, uninstall now
  removes `context.fileName`, and `context` when nothing else is in it, and keeps every key you added
  byte for byte; a list you changed is left as it is. After a whitespace or line-end edit, or a
  `chmod`, the file is kept once install's list is removed.
- A `DRY_RUN=1` install decides the Claude Code ask-rule edit, and its check that the edit changes
  nothing else, before it prints its preview, so the preview and the real run reach the same answer
  (33.1 review IN-02).
- An install whose kit home overlaps the target is refused before anything is written, under
  `DRY_RUN=1` too: the kit root is the target, either lies inside the other, or `GRUGOPS_HOME` is the
  target or lies inside it, compared after resolving symbolic links. Such an install used to move the
  repository's own `agent-factory/` aside and delete it, exit `0`, with no backup and no warning (33.1
  review CR-01). The refusal exits `1` with one sentence on stderr; set `GRUGOPS_HOME` outside the
  repository.
- Uninstall now walks the install ledger, so a file a different grugops version or another checkout
  installed is removed on its record and never left unnamed. Uninstall used to remove only the names the
  checkout running it ships: a recorded adapter that checkout did not ship was left in place and named
  nowhere, while the marker that recorded it was deleted, exit `0` (33.1 review WR-01). Every recorded
  file that still holds what install wrote is now removed and named, one you edited is left byte for byte
  and named, and a grugops-shaped file with no record is named and left. A `--symlink` install is
  reversed from another checkout by its link record. The kit source is read only to word the report of
  files without a record; when it cannot be read, a `note` line says so, and that is no longer a
  `verify` finding.
- An identical copy that install did not write is no longer recorded as install's, and uninstall no
  longer removes it. A grugops skill or adapter file already in the repository, byte for byte what
  install would write, used to be recorded as install's by the next install, and the uninstall after it
  deleted the file. Install now keeps a record for such a file only when an earlier install already
  recorded it and the file still holds that record; otherwise it reports the file `left` (33.1 gap
  round 3 red-team).
- A `DRY_RUN=1` uninstall no longer removes directories, and uninstall removes an empty directory
  only when install created it (recorded in the install ledger in `.grugops/install.json`) and the same
  run emptied it; a directory's name is not a record (33.1 gap round 2 dropped the round-1 rule that
  a name beginning with `grugops` was enough). An empty `.github/`, `.gemini/` or `.claude/`
  directory you made yourself is left and reported (33.1 gap round 1, CR-02).
- Uninstall no longer deletes or edits a Gemini settings file it has no install record for, and
  reverses exactly what install recorded in the install ledger in `.grugops/install.json`: it removes the entry install added,
  restores the shape install found, and deletes the file only when install created it and it is
  unchanged or holds nothing else. If `context.fileName` changed after install, the file is left
  byte for byte (33.1 gap round 2, CR-03).
- Uninstall deletes a blank Copilot instructions file or `CLAUDE.md` only when install created it
  (recorded in the install ledger in `.grugops/install.json`) and the file held exactly what install
  wrote; a blank file you made yourself is left (33.1 gap round 2, WR-05). The pointer blocks are
  removed only on install's record of them in the install ledger in `.grugops/install.json`, only while they are exactly what install appended, and without joining two of your lines.
- Uninstall removes a grugops skill or adapter file only while it is exactly what install wrote
  (its record in the install ledger in `.grugops/install.json`), so an edited one is left and reported;
  `AGENTS.md` and the runnables are removed only on their record in the install ledger. In a repository grugops was never installed into,
  uninstall changes nothing.
- Uninstall removes `.grugops/install.json` only when it is install's own marker for this directory
  with well-formed ledgers; install no longer overwrites a JSON object at that path that is not its
  marker.
- Install, uninstall and `--check` no longer read, write or hang on a FIFO or other special file at
  a path they use, including `.grugops/install.json` and the kit `VERSION`; the path is skipped and
  reported (33.1 gap round 2, IN-04).
- Install and uninstall no longer write through a symbolic link they did not make, or a hard link:
  such a path is left as it was, so nothing outside the repository is changed through it. Install
  reports it as a counted `verify` finding (exit `3`). Uninstall does so only for a path install has a
  record for; at a path with no record (a `CLAUDE.md -> AGENTS.md` link, in a repository you never
  installed into or after an install that refused that link) it reports the path `left` or `skipped`
  and the exit code is unaffected.
- A file uninstall removes on its record is now left when only its mode changed: the records keep the
  file mode install left (a record written before this has the bytes only, and the uninstaller says
  so). An install-created `.claude/settings.json` is deleted only when what is left once the grugops
  rules are removed is byte for byte what install's own file leaves, so a whitespace or line-end edit
  keeps it.
- `install.js --check` now fails (exit `1`) on a marker that holds a malformed ledger and names each
  one, as install and uninstall already refused it; it used to print `ALL CHECKS PASSED`.
- A first `DRY_RUN=1` install (no shared kit yet) now previews the per-repo state it would seed; it
  used to say there was no seed.
- Uninstall no longer says a file named like a `.grugops-edited-` backup was made by install, or tells
  you to remove an `.incomplete`-named one: for a name with no record, the line says only that the
  name matches (install records the backups it makes since 33.1 D-33 (c), and uninstall names those by
  their record). A runnable or `AGENTS.md` that differs from this kit version is reported as
  differing from it, not as edited by you.
- `--target` with no value (`--target` last, `--target=`, or followed by another option) is now bad
  usage (exit `2`) in both binaries; it used to fall back to the current directory.
- Install fails closed on a malformed or unreadable ask-rule ledger in `.grugops/install.json`: it
  reports a `verify` finding, adds no rule and leaves the ledger as it found it, instead of
  relabelling the grugops rules as your own and overwriting the ledger (WR-05). Install and
  uninstall now read the marker through one shared reader.
- Uninstall removes one copy of each ask rule install recorded, so a copy of a grugops rule you
  added yourself stays (IN-02).
- A host with no Claude Code adapter had no route to the kit after a scripted install: the pointers
  named `agent-factory/roles/orchestrator.md`, a path the scripted install never creates in the
  repository (34-UAT.md, G-34-2). The kit's `AGENTS.md`, the `CLAUDE.md` block, the Copilot pointer
  and the Pi template now carry one fixed sentence, the kit route (`KIT_ROUTE` in
  `install/host-tools.ts`), which names the kit root as the `kitRoot` field of
  `.grugops/install.json` and reads each `agent-factory/…` path under it (34 D-26). The sentence is
  the same on every machine. Whether each live host follows it is `UNKNOWN - verify`.
- A re-install replaces install's own unedited copy of the Pi template, of an `AGENTS.md` it
  created, and of the `CLAUDE.md` and Copilot blocks when its text is not the current text, and
  records the new bytes; before, a file already there was left as it was (IN-03). A file you wrote
  or edited is never written: when it has no kit route and leaves some host without any route,
  install prints a `note` that names it, only the hosts it leaves without a route, and the sentence
  to add (34 D-26, D-27).
- `install.js --check` follows the kit route. It fails when `<kitRoot>/roles/orchestrator.md` is
  not a readable file, or when a pointer install wrote in an earlier install has no route,
  re-running `install.js` would replace it, and some host is left without a route (the remedy is to
  re-run `install.js`); it warns about your own file without the route only when that file leaves a
  host without a route, quoting the sentence to add; and it prints one `reach` line per supported
  host, saying whether that host reaches the Orchestrator and through which files. It used to print
  `ALL CHECKS PASSED` while every host but Claude Code had no route to the Orchestrator (34 D-26,
  G-34-2).
- `install.js --check` and install's notes now agree with the same run's `reach` lines (34 D-27):
  - `--check --strict` failed when the optional Copilot pointer or the Pi template was deleted,
    although every host reached the Orchestrator through `AGENTS.md`. A file without the route that
    leaves no host without one is now an uncounted `note`, so `--check --strict` no longer fails on
    it.
  - Install's notes said Claude Code gets no route to the kit while the same run's `reach` line said
    Claude Code reaches the Orchestrator through `AGENTS.md` and its adapters. A note now names only
    the hosts the file leaves without any route.
  - `--check` told you to re-run `install.js` for a link that install never refreshes. It now names
    the re-run only when install would refresh, append to or create the file, and otherwise gives
    the reason and the remedy.
- `--check` said install leaves `CLAUDE.md` or the Copilot pointer as it is when their install block
  had been removed, and gave a sentence to add by hand, while a re-install appends the block, route
  included. It now names the re-run, which appends the block (34.1 D-15, WR-13).
- For the `AGENTS.md` link a `--symlink` install made, `--check` said install made the link while
  the re-install said it did not, and the remedy edited the file the link points to, outside the
  repository. Both now give one reason and one remedy: remove the link at `AGENTS.md` and re-run
  `install.js`, which links or copies the current kit `AGENTS.md` (34.1 D-16, WR-16).
- The install `-- notes --` block now says what the run did with the Claude Code ask rules: added
  them (with the count), added none, would add them under `DRY_RUN`, or refused (see the `verify`
  line). It used to say the installer wrote ask rules in a run that wrote none (WR-12, 34 D-25).
- `--update` with a counted `verify` finding now ends with `== update INCOMPLETE — N item(s) need
  verification ==` and exits `3`; it used to print `== update complete ==` and exit `0`. A
  `--migrate` on an already-migrated repository names the `plans/handoffs/` backup it made, and
  whether it was recorded, instead of saying nothing was changed, and ends INCOMPLETE with exit `3`
  after a counted `verify`. Uninstall's closing list of what it preserved now says what happened to
  the install marker (34 D-25).
- `uninstall.js` with an agent flag, over a recorded file you edited, keeps that agent recorded in
  `.grugops/install.json` and prints the command that finishes the reversal. It used to drop the
  agent from the record while its file stayed in place, so the per-agent uninstall could never be
  finished (34.1 review CR-02).
- Messages that ask you to fix something and run the installer or uninstaller again print the exact
  command, with the agent flags of the run, so a per-agent uninstall never points you at a command
  that removes every agent. A failed install's closing banner prints the command that installs for
  the same agents again.
- Install's note about an entry file of an agent not chosen in the run gives the command that writes
  it. It used to point at a line above that the run had not printed (34.1 review WR-17).
- `install.js --check` names a recorded agent with nothing installed in a note with the install
  command, instead of a line saying whether that agent reaches the kit (34.1 review IN-21).
- Uninstall removes the empty OpenCode `permission` and `external_directory` objects install created,
  and the `opencode.json` install created when only install's emptied file is left, even after you
  removed the rule yourself (34.1 review IN-20).
- Uninstall names a blank `CLAUDE.md` or `.github/copilot-instructions.md` that install created and
  whose grugops block you removed, and keeps it for you to delete, instead of leaving it unnamed.
- The agent list at a terminal restores the cursor and raw mode even when one restore step fails
  (34.1 review IN-18).
- Installer messages no longer cite planning decision IDs (34.1 review IN-22).
- After `uninstall.js` with agent flags keeps the marker for a file you edited, the printed
  alternative is to take that file's entry out of the install ledger, never to delete the marker,
  which still records the agents that stay (34.1 review CR-03).
- Every command the installer and uninstaller print names the script by its absolute path, so it
  runs from any directory, and states its kit home, its kit checkout and, for an install command, its
  install mode: an install command starts with `GRUGOPS_HOME=<dir> INSTALL_MODE=<copy or symlink>
  GRUGOPS_SRC=<dir>`, and an uninstall command with `GRUGOPS_HOME=<dir> GRUGOPS_SRC=<dir>`, the
  default kit home `~/.grugops`, a copy install and the checkout the script is in included. No
  printed command carries `--symlink`, so a `GRUGOPS_HOME`, `INSTALL_MODE` or `GRUGOPS_SRC`
  exported in your shell does not change what a printed command does. `install.js --check` takes the kit home and install mode from install's own
  marker for the repository it checks, so its printed commands put the kit where the install recorded
  it and leave the install where it was; with no marker it can use, it takes them from the `--check`
  run. When the kit home was moved by hand and `--check` is given the new one through `GRUGOPS_HOME`,
  it fails naming both kit homes. Its remedy is to move the kit home back and run the check again,
  which writes no kit, and it says that the install commands it prints on its other lines copy a kit
  to the recorded kit home. A plain `--check`, given no `GRUGOPS_HOME`, does not detect a moved kit home: it fails on the
  absent kit, and its install commands copy a kit to the recorded kit home.
  An install, `--migrate`, `--update` or `--prune-old-kit` run takes them from how it was run. An
  install command the uninstaller prints states the kit home the uninstaller was run with
  (`GRUGOPS_HOME`, else `~/.grugops`) and `INSTALL_MODE=copy`; it never takes a kit home or an
  install mode from a marker that belongs to another directory (34.1 review WR-19).
- When the install marker belongs to another directory or predates the install ledger, uninstall's
  remedy names the install command with the agent flags you gave it, and the uninstall that follows
  reports the earlier grugops skill, command and prompt template files (34.1 review WR-20).
- Uninstall says it does not know which agents are installed when the marker cannot be used,
  instead of "none" (34.1 review IN-27).
- Install's closing notes name an agent recorded with nothing installed apart from the agents left
  installed, with the commands that install it and that take it out of the record
  (34.1 review IN-23).
- `install.js --check` words its note by where the agent list came from, and keeps every recorded
  agent's checks when the install ledger is malformed (34.1 review IN-24).
- The OpenCode prose says the `external_directory` rule stops OpenCode's `external_directory`
  question on the kit path; whether its `edit` permission still asks stays `UNKNOWN - verify`
  (34.1 review IN-25).
- An install records again an agent whose files the install ledger still holds after its `agents`
  list was edited to leave it out (34.1 review IN-26).
- Uninstall names a directory install created that it could not remove, instead of leaving it
  silently.
- `install.js --check` remedies, and the `--migrate`, `--update` and `--prune-old-kit` closing
  banners, print the command to run.
- When `.grugops/install.json` is a JSON object with a well-formed install ledger and a field that
  holds a value install never writes (for example `agents` edited by hand), `install.js --check`, the
  installer and the uninstaller name the field to fix by hand and say never to delete the marker,
  which is still the record of every agent installed here; none of them offers to remove it. After
  the fix, run the command the `--check` or uninstall line prints, or run the installer again
  (34.1 review CR-04).
- When the install marker is install's own record for the repository it checks, `install.js --check`
  prints its remedy commands with the kit home and install mode the marker records. Run as printed,
  a remedy uses that kit and keeps the install where it is, even when `--check` was run without the
  `GRUGOPS_HOME` or `--symlink` the install used (34.1 review WR-21).
- Over a marker that belongs to another directory (a moved or cloned repository), the install command
  the uninstaller prints uses the kit home the uninstaller was run with (`GRUGOPS_HOME`, else
  `~/.grugops`), never a kit home the marker names, and states `INSTALL_MODE=copy`. The line names
  that kit home (34.1 review WR-22).
- A printed command always states `GRUGOPS_SRC=<dir>`, the kit checkout the run used (`GRUGOPS_SRC`,
  else the checkout the script is in), so the `install.js --check` stale-adapter remedy renders from
  the checkout it compared the adapters against (34.1 review WR-23).
- When `.grugops/install.json` is not valid JSON (for example a trailing comma left by a hand edit),
  cannot be read, or is not a JSON object, `install.js --check`, the installer and the uninstaller
  name the cause and what to fix by hand, and none of them offers removing the marker, which keeps
  the record of what install did here (34.1 review CR-05).
- The same holds when the install ledger in the marker has a malformed entry, on every kind of
  uninstall run, with agent flags or without (34.1 review CR-06).
- When the marker repeats a key, the line names each repeated key and how many times it appears
  (up to eight keys by name, then a count of the rest), and it no longer says the install ledger is
  intact when both `ledger` values are unusable (34.1 review WR-26).
- The lines about a marker that cannot be used name the cause the installer saw, instead of a cause
  that did not apply (34.1 review IN-33).
- Over a marker that cannot be used, the uninstaller reports the Claude Code ask rules and the
  grugops pointer blocks as left for the marker's remedy, and no longer tells you to remove them by
  hand (34.1 review IN-34).
- Every command the installer and uninstaller print states its kit home and its kit checkout and,
  for an install command, its install mode, the default kit home and a copy install included, so a
  `GRUGOPS_HOME`, `INSTALL_MODE` or `GRUGOPS_SRC` exported in your shell does not change what a
  printed command does (34.1 review WR-25).
- `install.js --check` checks the kit home the install recorded, the same one its printed commands
  use, so a plain `--check` on an install with another kit home no longer reports a stale or moved
  install, nor stale Claude Code adapters (34.1 review WR-24).

### Security

- Where each safety rule is enforced, stated plainly. The git host is the hard floor: branch
  protection or rulesets on protected branches and a production deployment environment with a
  required reviewer are what stop an unapproved merge or deploy, whatever the agent types. The
  Claude Code ask rules are a speed bump and not a security boundary: they make Claude Code ask
  before a matched command, they do not match every way of writing one, and the plugin form carries
  none. Configure host protection with the checklist in `install/README.md` §5, and confirm the
  branch items with the read-only host check. The check does not read the production environment,
  whose line reads `UNKNOWN - verify` by design (33.1 D-31), so confirm the environment's settings
  on the git host yourself. Prose rules remain prose.
- The read-only git-host check (`tools/grugops/host-protection.js`) now answers `protected` for a
  branch only when the host positively shows every branch item of the git-host setup checklist in
  `install/README.md` §5: a required pull request with at least one approving review, stale
  approvals dismissed on new commits and the most recent push approved (33.1 D-33), blocked force
  pushes, restricted deletions, and rules that the checked account cannot bypass. A missing or
  unreadable setting is reported as `UNKNOWN - verify`, never as protected. It does not read the
  production environment: its line reads `UNKNOWN - verify` by design, and the production list of
  the checklist is the human's to confirm (33.1 D-31). Earlier, unreleased builds of the check read
  the environment and could answer `protected` on weaker evidence. Re-run the check to confirm your
  host (33.1 gap round 1, CR-01).
- The read-only git-host check reads the host more strictly (33.1 gap round 2). It no longer reads a
  missing classic `bypass_pull_request_allowances` setting as "no one can bypass": the pull-request
  and approval lines read `UNKNOWN - verify` unless the setting is present and lists no one. A rule
  list with a further page (more than 100 rules) reads `UNKNOWN - verify`. The report names the
  repository it inspected on its first line, and `--json` carries it as `repository`; a run that
  cannot name the repository reports every branch `UNKNOWN - verify`. The repository `url` is read
  only in its plain form on `api.github.com` or under a GitHub Enterprise Server `/api/v3` prefix, and
  every other url that names a repository must name the same one. A ruleset counts only when its
  source names the inspected repository, or its owner for an organization ruleset; an enterprise
  ruleset reads `UNKNOWN - verify`. Host text is printed with bidirectional and other invisible
  characters escaped. A `factory.config.json` that is not a regular file is skipped without being
  opened. The production environment checks this round added went with the rest of the environment
  reading (33.1 D-31). Re-run the check to confirm your host.
- The admission-guard hook's matcher now matches the plugin-scoped tool name
  (`mcp__(plugin_grugops_)?grugops__.*`). Before this change the matcher was the bare server family
  `mcp__grugops__.*`, and the platform's plugin reference states that for a plugin's bundled MCP
  server "a matcher written against the bare server key never fires"
  (https://code.claude.com/docs/en/plugins-reference), so in plugin form the hook did not fire on
  `propose_note` calls and the `human:<name>` stamp was not mechanically gated on that path. The
  bare spelling stays in the alternation for a standalone `.mcp.json` server, which the kit does
  not ship.
- The shared-context reader refuses a note the sanctioned writer did not compose. A note written
  into `.grugops/context/` by any other route (a file-writing tool, a heredoc, an editor) has no
  seal, is not returned by `readContext`, `render`, `currentState`, the compactor's promoted-tier
  carve-out, or any consumer of `readContext`, and is counted under the reader's `unsealed` skip
  arm with its reason (`absent`, `malformed`, `mismatch`). The round-1 live capture of Phase 33 had
  shown nine such notes admitted as memory; the same nine notes are the test fixture that now reads
  as zero. There is no grandfather clause: notes composed by an earlier kit version are not read by
  this one until they are re-admitted through the writer. The seal is unkeyed by necessity — a
  file-based kit holds no secret the constrained process cannot read — so it distinguishes
  hand-composed from writer-composed notes and detects post-write edits; it does not stop a process
  that reimplements the algorithm. That un-forgeable tier is a human decision not taken here.

## [2.1.0] - 2026-09-18

**Autonomous Factory — Real Spawning, Controlled Language & Live Board** (phases 27–32.1, tag
`v2.1`). The first published SemVer release. The milestone made spawning real and derived,
gave every safety claim an id and a mechanical drop, put every human stop on a dial, and added a
read-only live board.

### Added

- Per-role model assignment: a `models` block on the config dial names a stronger model where
  judgment lives and a cheaper one for execution, emitted into every generated adapter; zero-config
  stays byte-identical to the previous behaviour. A second phase delivers the block to an installed
  repository's adapters, so it is no longer inert once installed.
- A per-checkpoint autonomy matrix: every human stop is enumerated and dialable, and the four safety
  floors can be lowered only behind two keys a single agent cannot both hold. Lowering a floor drops
  the public claim that depended on it, by id.
- A claim registry (`docs/audit/28-claim-registry.md`) that maps every public safety claim to the
  floor whose lowering would falsify it, with a gate that keeps each claim byte-identical to its
  anchor.
- A controlled-language writing profile for procedural and agent-written surfaces, a de-duplicated
  role skeleton, and a voice guard that measures voice rather than sentence shape.
- Browser-driven autonomous UAT where the committed Playwright spec is the evidence and the agent's
  narration never is.
- A board projector: one board-grammar authority emits a typed snapshot, rendered live by a
  read-only terminal dashboard (`npm run dashboard`, `--once --json` for scripts) that is proven
  unable to write.
- A `package.json` `version` field, kept in lockstep with `agent-factory/VERSION` and the plugin
  manifest.

### Changed

- Every guard and validator scan set is derived from the filesystem instead of a hand-maintained
  list, and all 17 role adapters are generated from that derived set; the coordinator's spawn
  allowlist is wired only where the runtime honors it.
- `CLAUDE.md` reconciled with the v2.0 architecture (it still described handoff packets and a
  routing Orchestrator).
- Claude Code floor raised to v2.1.219+ (clean nested spawning at depth 3).
- The artifact version moved from the pre-release seed `0.1.0` to `2.1.0`.

### Fixed

- The spawn defect that motivated the milestone: seven role names were granted on the coordinator's
  allowlist while zero matching adapter files existed, because the list was hand-typed. The set is
  now derived and its count asserted.
- Published dashboard text: every content-derived substitution now goes through one refusal-sentence
  builder, and both hand-drawn classification tables were deleted for a single two-sided
  published-equals-owned equality.

> **Known open at this release** (a note, not a change entry):
>
> - Phase 33 (the captured live spawning run that discharges GAP-D1, and a green `windows-latest` CI
>   leg) is not in this release.
> - Phases 29.1, 31 and 32.1 were closed by named human override with items accepted open; each is
>   recorded in `.planning/ROADMAP.md` and the WINDOWS register with a named owner.

## [2.0] - 2026-07-28

The **v2.0 Decentralized Factory — Shared Verified Context** milestone (phases 20–26). This is a
major architecture pivot: it replaces the centralized Orchestrator plus static handoff packets with
a shared, verified, auditable context substrate that parallel agents read and write directly.

### Added

- A typed, six-kind shared-context note schema with a provenance fence, written through a single
  sanctioned path (`context-io`) that is atomic, append-only, and byte-reproducible.
- A lock-free, file-based task queue: agents claim work atomically and build on one another's
  verified progress without routing through a central head.
- Verify-before-write admission: a finding is only admitted to the shared context after it carries a
  live GREEN verdict from the §14 quality gate — the gate is the un-cheatable verifier, and the
  `verified_by` stamp refuses self-set and hollow stamps.
- Dialable memory and trajectory compaction, with a load-bearing-field carve-out so verified
  findings and required failed attempts are never silently dropped.
- Governance-on-a-dial: enterprise human-admission and audit-retention tiers layered over the
  decentralized substrate, with the safety floor left un-dialable.

### Changed

- Parallel execution with the Orchestrator acting as decomposer and scheduler. Claude Code is the
  primary path (it can spawn agents); the four non-spawning host CLIs degrade gracefully to a
  sequential mode over the same shared context.
- All roles and workflows rewired onto the shared substrate; the static handoff templates are being
  removed and the traceability trail migrated onto the new context.
- Installing a repository now renders that repository's Claude Code sub-agent adapters from that
  repository's own `.grugops/factory.config.json`, so a `models` block finally reaches the adapters
  the repository's session loads; `--check` names every adapter a configuration edit has not been
  re-installed into yet, and a repository whose `models` block is refused keeps the adapters it had
  rather than silently receiving the default assignment. Two consequences are worth stating for
  existing users: every adapter installed before this change is reported stale by `--check` until
  the repository is re-installed, and `--strict` promotes that warning to a failure, so a job
  already running `--check --strict` goes red until the re-run; and a checkout that cannot run the
  render — a partial checkout missing the modules the render needs — now installs no sub-agent
  adapter at all, where before it installed the ones the kit shipped.

### Removed

- The `autonomy` configuration scalar (`diff` / `branch` / `pr`) is retired. It graded three steps
  in prose and no mechanism read it. It is replaced by the per-checkpoint `checkpoints` object,
  whose cells are enforced: each key is one declared human stop and each value is `block`,
  `notify` or `off`. There is no coexistence mode — the structure validator refuses a
  configuration that still carries the retired key, and the refusal names the replacement.

  **Migrating an existing repository.** The translation is mechanical, published as a table in
  `agent-factory/config/factory.config.md`: the old grade split into two independent stops, so
  `diff` becomes `commit_to_branch: block` + `open_pr: block`, `branch` becomes
  `commit_to_branch: off` + `open_pr: block`, and `pr` becomes `commit_to_branch: off` +
  `open_pr: off`. Delete the `autonomy` key and write the two cells its row names.

  **The installer reports; it does not rewrite.** Installing over a repository whose configuration
  still carries the key prints a line naming the key and pointing at the translation table, and
  leaves the file byte-identical. Editing a user's declared intent without asking is the opposite
  of this project's posture, so the edit stays with the human.

_Deferred at this tag: the A3/DOG-02 live dual-path parity retirement waits on a captured live
run (GAP-D1)._

## [1.2] - 2026-06-16

**SDLC Depth, Quality Discipline & Browsable Docs** (phases 10–19, 38 plans). Made the delivery
lifecycle senior-grade and trustworthy end-to-end.

### Added

- A 17th persona: a senior frontend/UI role plus a UI design-to-build workflow (WCAG 2.2 AA), with
  the Orchestrator routing UI work to it.
- Test-first by default: a declarative Given/When/Then acceptance contract (BDD, with Three
  Amigos / Example Mapping) and a red-green TDD double-loop, both config-dialed.
- An OWASP ASVS 5.0 security-audit workflow plus a generated, leveled L1/L2/L3 checklist (from a
  pinned source), with the ASVS level config-dialed and clear-voice findings.
- A browsable docs catalog that self-discovers the finished kit and emits a deterministic in-repo
  markdown catalog, guarded by a fail-closed freshness gate that fails red on drift.
- Automated UI/E2E testing (Playwright) plus visual regression and accessibility checks, wired into
  the quality gate.
- Install `--migrate` and `--update` modes (never-delete-first), plus a single opt-in deletion path.

### Changed

- All 16 roles deepened to senior judgment in place, sharper-per-token, with the terse caveman voice
  preserved unchanged across the rewrite.
- The §14 quality gate converged onto a single source and now runs lint, Playwright UI/E2E, visual
  regression, and a structured-justification test-integrity checker the agent cannot self-author.
- The entire tooling and script layer migrated to a TypeScript zero-build foundation: `tsc`-compiled
  committed `.js`, freshness-checked so the output cannot drift from its source, cross-platform, with
  Node 22+ as the install prerequisite and dev dependencies never shipped to host machines.

## [1.1] - 2026-06-08

**Install & Distribution** (phases 7–9, 14 plans). Redesigned the install experience.

### Added

- A two-root installer that resolves `$GRUGOPS_HOME`, copies the read-only kit there, and
  materializes the resolved absolute kit path into the standalone adapters while seeding per-repo
  state without clobbering user content.
- A `--check` doctor that resolves and stats every referenced path.
- A two-root-aware validator that refuses to false-green in the dev checkout or with `$GRUGOPS_HOME`
  unset.

### Changed

- Redesigned the install to a shared-location, two-root architecture: the read-only kit installs
  once to `${GRUGOPS_HOME:-$HOME/.grugops}` and each target repo keeps only per-repo state.
- Rewrote roughly 31 role, workflow, and adapter files so every reference resolves to the correct
  root (kit versus state), gated to zero stray references.

### Fixed

- The three v1.0 dogfood pains: the kit never arriving in the target, the wrong target being
  written, and fragile symlinks.

## [1.0] - 2026-06-04

**MVP — Full Agent Factory v2** (phases 1–6, 34 plans). The initial build of the complete Agent
Factory v2 spec, proved end-to-end by an idea-to-PR dogfood across both dispatch paths.

### Added

- 16 role prompts (Orchestrator plus the core and enterprise packs) and 14 lifecycle workflows with
  dual Kanban/Scrum cadence and a bounded backpressure quality gate.
- Shared I/O contracts: handoff templates, gate checklists, and a memory-bank seed.
- The config dial (`factory.config.json` with lean defaults), a visible Kanban/Sprint board, and a
  traceability trail.
- Thin per-tool adapters for the five host CLIs, plus both Claude Code distribution forms
  (standalone `.claude/` and the plugin with marketplace catalog).
- Idempotent, additive, reversible installers.
- A mechanical PreToolUse prod-deploy guard hook that denies deploys without named human approval and
  fails closed.
- A structure validator that never fabricates a pass, plus brand and legal collateral.

[Unreleased]: https://github.com/abitwise/grugops/compare/v2.1...HEAD
[2.1.0]: https://github.com/abitwise/grugops/compare/v2.0...v2.1
[2.0]: https://github.com/abitwise/grugops/compare/v1.2...v2.0
[1.2]: https://github.com/abitwise/grugops/compare/v1.1...v1.2
[1.1]: https://github.com/abitwise/grugops/compare/v1.0...v1.1
[1.0]: https://github.com/abitwise/grugops/releases/tag/v1.0

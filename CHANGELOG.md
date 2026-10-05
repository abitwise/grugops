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
release, together with Phase 33.1, which retires the Bash command guard.

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

### Added

- The standalone installer translates the `checkpoints` config into Claude Code `permissions.ask`
  rules in `.claude/settings.json`: `git push` and `gh pr merge` for protected-branch merges, and
  the deploy and publish tools the retired guard named for production (33.1 D-18). The set covers
  only those tools; local ref writes are not added, because the git host is the hard floor
  (33.1 D-29). The installer records what it added in a ledger, so a re-run is idempotent,
  pre-existing user rules are preserved, and uninstall removes only what install added.
- A read-only git-host check, `tools/grugops/host-protection.js`, that the gate and release
  workflows run. It reports `protected`, `unprotected` or `UNKNOWN - verify` for each protected
  branch and production environment, and never changes host settings (33.1 D-19).
- A "Where each floor is enforced" section in `docs/GUARANTEES.md`, generated from the audit model,
  that names the hard-floor, speed-bump and prose tier of every safety floor.

### Changed

- A file you edited, which uninstall leaves, now keeps the install marker `.grugops/install.json`.
  Uninstall exits `0` and ends with `== uninstall complete — N recorded item(s) left in place;
  .grugops/install.json kept to record them ==`, and the marker is rewritten to list only what is
  still there. Remove or restore the file and re-run uninstall to finish, or delete the marker by hand
  to keep the file without a record. Directories and backups install recorded do not keep the marker:
  this narrows 33.1 D-33 (b), which keeps the marker while any recorded entry is left, to the entries
  that hold content install wrote, and the repository owner has yet to confirm it. The consequence:
  once uninstall removes the marker, a backup install recorded is on no record any more, so
  `--prune-old-kit` can no longer remove it. Run `--prune-old-kit` before uninstall if you want
  grugops to remove its backups.
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
  the new flag `--backup-edited-kit` gives the answer explicitly. Backups are written whole and are
  never removed by uninstall. The first re-install over an install made before this release asks
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
- `.claude/settings.json` and `.gemini/settings.json` are edited in place: only the entries install
  adds or removes change, and every other byte (number spelling, key order, spacing, line ends) is
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

### Fixed

- An uninstall that could not finish keeps the install marker, so re-running it after fixing the cause
  finishes the reversal. With `.claude/agents` read-only, uninstall exited `3` with a `verify` line per
  adapter and still deleted the marker, so the re-run found no record and left every adapter in place
  as unrecorded (33.1 review WR-02). The marker is now removed only when no `verify` was counted for a
  recorded path and everything install recorded writing is removed, reversed or already gone;
  otherwise it is kept and rewritten to list only what is left.
- A Gemini settings file install created is reversed whole after a user edit. Install writes
  `context.fileName: ["AGENTS.md", "GEMINI.md"]` into the file it creates; after you added a key,
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
- Install reports an unreadable or oddly shaped Gemini settings file (not strict JSON, not UTF-8, a
  duplicate key on the edited path, a `context` that is not an object) as a counted `verify` finding
  (exit `3`) and leaves it untouched.
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
  you to remove an `.incomplete`-named one: install records no backups, so the line says only that
  the name matches. A runnable or `AGENTS.md` that differs from this kit version is reported as
  differing from it, not as edited by you.
- `--target` with no value (`--target` last, `--target=`, or followed by another option) is now bad
  usage (exit `2`) in both binaries; it used to fall back to the current directory.
- Install fails closed on a malformed or unreadable ask-rule ledger in `.grugops/install.json`: it
  reports a `verify` finding, adds no rule and leaves the ledger as it found it, instead of
  relabelling the grugops rules as your own and overwriting the ledger (WR-05). Install and
  uninstall now read the marker through one shared reader.
- Uninstall removes one copy of each ask rule install recorded, so a copy of a grugops rule you
  added yourself stays (IN-02).

### Security

- Where each safety rule is enforced, stated plainly. The git host is the hard floor: branch
  protection or rulesets on protected branches and a production deployment environment with a
  required reviewer are what stop an unapproved merge or deploy, whatever the agent types. The
  Claude Code ask rules are a speed bump and not a security boundary: they make Claude Code ask
  before a matched command, they do not match every way of writing one, and the plugin form carries
  none. Configure host protection with the checklist in `install/README.md` §5, and confirm it
  with the read-only host check. Prose rules remain prose.
- The read-only git-host check (`tools/grugops/host-protection.js`) now answers `protected` only
  when the host positively shows every item of the git-host setup checklist in `install/README.md`
  §5. For a branch that includes a required pull request with at least one approving review,
  blocked force pushes, restricted deletions, and rules that the checked account cannot bypass. For
  production it includes a deployment environment under the configured name that requires a
  reviewer, prevents self-review, does not let administrators bypass its protection rules, and
  allows deployments only from protected branches. A missing or unreadable setting is reported as
  `UNKNOWN - verify`, never as protected. Earlier builds could answer `protected` on weaker
  evidence, such as a single required reviewer on an environment that allowed self-review or
  administrator bypass. Re-run the check to confirm your host (33.1 gap round 1, CR-01).
- The read-only git-host check reads the host more strictly (33.1 gap round 2). It no longer reads a
  missing classic `bypass_pull_request_allowances` setting as "no one can bypass": the pull-request
  and approval lines read `UNKNOWN - verify` unless the setting is present and lists no one. The
  production line "allows deployments only from protected branches" needs classic branch protection
  shown in the same run, so a repository protected by rulesets alone reads `UNKNOWN - verify` for
  it. A reviewer counts only when the host names a user or a team with an id. A host list with a
  further page (more than 100 rules or environments), or an environment protection rule of a type
  the check does not know next to the reviewer rule, reads `UNKNOWN - verify`. The report names the
  repository it inspected on its first line, and `--json` carries it as `repository`; a run that
  cannot name the repository reports every target `UNKNOWN - verify`. The repository `url` is read
  only in its plain form on `api.github.com` or under a GitHub Enterprise Server `/api/v3` prefix, and
  every other url that names a repository must name the same one. A ruleset counts only when its
  source names the inspected repository, or its owner for an organization ruleset; an enterprise
  ruleset reads `UNKNOWN - verify`. Host text is printed with bidirectional and other invisible
  characters escaped. A `factory.config.json` that is not a regular file is skipped without being
  opened. Re-run the check to confirm your host.
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

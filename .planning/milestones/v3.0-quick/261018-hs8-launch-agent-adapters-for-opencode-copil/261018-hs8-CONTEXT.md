# Quick Task 261018-hs8: Launch-agent adapters for OpenCode, Copilot CLI, Antigravity CLI + Pi append-system-prompt file - Context

**Gathered:** 2026-10-18
**Status:** Ready for planning

<domain>
## Task Boundary

The installer gains one launch adapter per host so a session can start with the grugops Orchestrator as its main agent:

- OpenCode (`--opencode`): `.opencode/agents/grugops-orchestrator.md`, frontmatter `mode: primary` plus a description. Launch: `opencode --agent grugops-orchestrator`.
- GitHub Copilot CLI (`--copilot`): `.github/agents/grugops-orchestrator.agent.md`. Launch: `copilot --agent grugops-orchestrator`.
- Antigravity CLI (`--antigravity`): `.agents/agents/grugops-orchestrator.md`, frontmatter name, description and the main-agent field. It is picked in the `/agents` panel. An `agy --agent` launch flag appears only in third-party sources, so it is `UNKNOWN - verify`.
- Pi (`--pi`): `.pi/grugops-orchestrator.md`. Launch: `pi --append-system-prompt .pi/grugops-orchestrator.md`.
- Codex CLI: unchanged. It has no documented way to launch the main session as a custom agent.

Docs to update to match: README.md "Start a session" table, install/README.md "Using grugops on <host>" sections and §6 entry paths, and the install/host-tools.ts registry.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** One agent name, `grugops-orchestrator`, on every host.
- **D-02:** Pi launch file `.pi/grugops-orchestrator.md` passed with `--append-system-prompt`; never write `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`.
- **D-03:** A pre-existing user file at a launch path gets the `writeWholeFileEntry` rule and is never clobbered; the files are recorded per agent and removed by uninstall and by per-agent removal.
- **D-04:** Thin pointer body only (AGENTS.md, then the orchestrator role through kitRoot), with no role text.
- **D-05:** The launch wording follows the version notes below; ownership is per agent through a `launchAgent` registry field.
- **D-06:** Launch files are NOT route carriers for the reach and strand verdicts (this reverses planner decision PD-1, human 2026-10-18, after review CR-01). `--check` reports each launch file in a separate finding, worded "a session started with <launch form>".

### D-06 Launch files out of reach and strand (reverses PD-1)
- A launch file is read only by a session the user starts with it. A default session (plain `pi`, plain `copilot`, a typed `/grugops`) never reads it. Counting it as a route carrier made `--check --strict` pass, and install skip its route note, while a default session had no route. That is a faked passing gate (CLAUDE.md, No fabrication).
- `routeCarriers` (reach, strandedBy, install's route note) covers only what a default session reads. Launch files get their own carrier set and their own `--check` findings: ok, own-stale FAIL, user WARN, and an absent note.
- Restore the test premises that Tasks 1 and 2 rewrote to delete, block or strip the launch file. Add a case where the template is absent, the launch file is present and the user's AGENTS.md has no route. It expects a counted WARN and exit 1 under `--strict`.
- Decided together with D-06, in the same fix pass: review findings WR-01 (the stale "emits no agent definition" sentence and its pin), WR-02 (Pi launch trust note in the docs) and WR-03 (install's closing line names the launch form only when install wrote or owns the launch file).

### D-01 Agent name
- Every host uses the one name `grugops-orchestrator`, the same as the Claude Code adapter. The Copilot ID comes from the file name.

### D-02 Pi launch file
- Pi gets `.pi/grugops-orchestrator.md`, passed with `--append-system-prompt`. Append is used, not `--system-prompt`, so Pi's own tool instructions stay.
- The installer never writes `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`. Either one would make every Pi session the Orchestrator, the same reason the Claude Code settings `agent` key is not written (install/README.md §6).
- Pi does not auto-load the file. It takes effect only when the flag is passed.

### D-03 Pre-existing user file at the path
- The installer gives these files the same conflict treatment as the existing per-host adapter files (for example `.opencode/commands/grugops.md`). It never clobbers a user's file and emits a note.
- Correction after research: the existing per-host file rule is `writeWholeFileEntry` (install.ts ~3526-3604). It creates the file when absent, refreshes install's own unedited copy, and otherwise leaves the file untouched and unrecorded. The D-32 backup (`--backup-edited-kit`) covers `.claude/` kit files only and does NOT apply here; the earlier wording was the orchestrator's error. The user's intent was "the same treatment as today", which means `writeWholeFileEntry`.
- These files are recorded in the install marker or ledger (the owns(path) authority). They are removed by uninstall and by per-agent removal, and `--check` reports them.

### D-04 Pointer body
- The body is a thin pointer with no role text, like the existing skill and command pointers. It says to read AGENTS.md, then the orchestrator role through the `kitRoot` route, and to act as the Orchestrator. This follows the single-source rule.

### D-05 Launch wording where versions disagree
- OpenCode: document `opencode --agent grugops-orchestrator` per opencode.ai/docs/cli. Also give Tab-switching to the primary agent as the fallback, because v2.0.28 `--help` does not list `--agent` on the default command.
- Antigravity: lead with the `/agents` panel. `agy --agent grugops-orchestrator` exists in agy 1.3.5 help, but whether it resolves a repository agent file is `UNKNOWN - verify`.
- Pi: start at the repository root. A missing file is appended silently as literal text, and passing the flag skips the user's own APPEND_SYSTEM.md for that session; state both. The launch file has no frontmatter.
- Ownership is PER AGENT (a registry `launchAgent` field), never per adapter kind, because Antigravity shares the `agent-skill` kind with Codex.

### Claude's Discretion
- Exact frontmatter fields per host: follow what the research finds in current docs, and mark unverified fields `UNKNOWN - verify`.
- Derive the file sets from the host-tools registry; do not hand-type them ("derive the set, assert the count").

</decisions>

<specifics>
## Specific Ideas

- Live runs on OpenCode, Copilot CLI, Antigravity CLI and Pi are `UNKNOWN - verify`. Do not claim them.
- Gates: claim anchors, banned-claims, public-docs-vocabulary, kit-refs, foundation-guards, freshness (tsc-committed .js), and `npx vitest run --exclude '**/scripts/e2e/**'`. Never run `npm test`.
- 20 test failures already exist at base and are known: stale `.planning/phases` paths and node v26 `openAsBlobSync`.

</specifics>

<canonical_refs>
## Canonical References

- opencode.ai/docs/cli/, opencode.ai/docs/agents/ (retrieved 2026-10-18)
- docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli (retrieved 2026-10-18)
- antigravity.google/docs/subagents/, antigravity.google/docs/cli/using (retrieved 2026-10-18)
- github.com/earendil-works/pi packages/coding-agent/docs/cli.md (retrieved 2026-10-18)
- install/README.md §6 "Entry paths", "Using grugops on" sections, D-32 re-install rules
- .planning/phases archive: 33.1-GAP-PLANNING-BRIEF.md (recurring defect classes)

</canonical_refs>

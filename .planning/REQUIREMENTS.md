# Requirements: grugops v3.1 Upstream design, consultation and one-command install

**Defined:** 2026-11-24
**Core Value:** A user installs grugops on top of the coding-agent CLI they already run, types `/grugops`, and gets a disciplined delivery team — a visible board, a shared context where nothing is written until it is verified, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy.

**Sources:** backlog 999.14 and the consultant core of 999.13; research in `.planning/research/SUMMARY.md` (2026-11-24).

## Decisions recorded at scoping (human, 2026-11-24)

| ID | Decision |
|----|----------|
| S-01 | A ticket waiting on a build request stays in `Blocked` with a bullet naming the request; no new board column (research D2, position B). |
| S-02 | An upstream source is a checkout outside the product repository, named by a relative path in committed config (research D3). |
| S-03 | The v1.1 Out of Scope line "no global `$PATH` binary" is amended: no global binary is documented or required, and `npm i -g` is unsupported (research D5). |
| S-04 | The npm package is the unscoped `grugops`; a human publishes `3.1.0-rc.0` by hand early in the milestone to claim the name (research D8, D9). |
| S-05 | When upstream provides an architecture, upstream owns it; a deviation is a build request; grugops floors never move (research D4). |
| S-06 | Names (config keys, dial, build-request statuses) are settled in the first phase's discussion (research D1). |
| S-07 | Architecture as input merges into the build-requests phase if it stays small (research D10). |
| S-08 | No always-on skeptic lens; a panel may add a risk lens that maps critical and major risks when the question calls for it. |

## v1 Requirements (milestone v3.1)

### Upstream sources

- [ ] **UP-01**: A user can declare one or more upstream design sources in `.grugops/factory.config.json` (id, relative path to a checkout outside the product repository, pinned commit, entry file with its blob hash, owned scope); with no declaration grugops behaves as today.
- [ ] **UP-02**: Roles read upstream content only at the pinned commit, through one sanctioned reader that uses git object reads, never the working tree, and never copy it into `memory-bank/` state.
- [ ] **UP-03**: At session start the Orchestrator reports each source's pin state (match, drift or `UNKNOWN - verify`) and never moves a pin; only a named human edits it.
- [ ] **UP-04**: A missing or unreadable source makes the dependent work `BLOCKED` with a named reason; nothing is guessed.
- [ ] **UP-05**: Upstream text is untrusted data: it enters the shared context only as cited `claim` notes, and an adversarial fixture with embedded instructions shows they are not followed.
- [x] **UP-06**: The pin records the entry file's blob hash, and the check reports a mismatch between the declared blob and the blob at the pinned commit.

### Traceability

- [ ] **TRC-01**: A BA/PM ticket cites the upstream IDs it implements as `upstream:<source>:<id>@<commit>`, or states `none (build-internal)`.
- [x] **TRC-02**: The rendered trace shows upstream refs in the Requirement column and never as phantom ticket rows; the `BR` prefix is reserved.
- [ ] **TRC-03**: The validator confirms that every upstream ID a ticket cites exists at the pinned commit, using the ID grammar the source declares.

### Build requests

- [ ] **BR-01**: A role that needs something upstream owns (an answer, or a change to what the product is) writes a build-request file with a stable ID, the upstream IDs it touches, the raising pin, options with a recommended default, and the tickets it blocks.
- [ ] **BR-02**: A ticket waiting on a build request stays in `Blocked` with a bullet naming the request, and a board from before v3.1 validates unchanged (cross-version test).
- [ ] **BR-03**: Build requests follow a closed lifecycle, are deduplicated, and BA/PM is their single writer.
- [ ] **BR-04**: The human sees a carry list of open build requests to take upstream; grugops never writes into the upstream repository.
- [ ] **BR-05**: A build request is answered only by a new pin a human sets; the answer enters the shared context as a `claim` citing the upstream ID and pin.
- [ ] **BR-06**: Upstream waits use their own escalation threshold, separate from `blocked_escalation_days`.
- [ ] **BR-07**: The build-request folder has a byte budget, checked by the validator and `state-check`.

### Architecture as input

- [ ] **ARCH-01**: When upstream provides a stack or architecture decision, the Greenfield Mapper and the Architect take it as given input (ADR status `Accepted (upstream)`); a deviation is a build request.
- [ ] **ARCH-02**: grugops floors (the §14 gate, security and NFR gates, verify-before-write, the git-host floor) never move; a conflict with upstream architecture is a build request plus a human stop.

### Consultant

- [ ] **CON-01**: One parameterized consultant role (topic and lens) exists within the role-corpus byte budget, with its procedure in a new workflow.
- [ ] **CON-02**: Only the Orchestrator dispatches the consultant, on a `CONSULT` request from BA/PM, the System Analyst, the Architect or the Designer, or on a human's request; with no config it runs only on request.
- [ ] **CON-03**: The consultant answers from declared sources first, citing them; beyond them it answers only questions outside the upstream owner's scope, with sources or `UNKNOWN - verify`.
- [ ] **CON-04**: Consultant output is only `claim` or `observation`; a decision resting on it cites it, and compliance, privacy or money claims go to a named human.
- [ ] **CON-05**: A question in the upstream owner's scope becomes a build request, never a consultant answer.
- [ ] **CON-06**: In panel mode the lenses answer independently, and one synthesis ends with where they disagree and why, with no vote; a dial sets single (lean) or panel (enterprise).
- [ ] **CON-07**: A panel can include a risk lens that maps critical and major risks when the question calls for it.
- [ ] **CON-08**: Panel lenses can run on different model tiers through the `models` dial.

### One-command install

- [ ] **INST-01**: A user installs grugops into the current repository with one pinned command copied from the README, `npx grugops@<version> --<agent>`, without cloning.
- [ ] **INST-02**: The same command runs uninstall, update, `--check`, `--migrate` and `--dry-run`.
- [ ] **INST-03**: The command refuses Node below 22 with a clear message.
- [ ] **INST-04**: The default target is the git top level; the home directory and folders that are not repositories are refused.
- [ ] **INST-05**: Under npx, every printed follow-up command uses the versioned npx form, never a cache path, and uninstall from a freshly fetched package restores the tree.
- [ ] **INST-06**: The package ships every file the installer reads, with no runtime dependencies and no lifecycle scripts; a packed-tarball install test gates each release.
- [ ] **INST-07**: Releases publish from CI through trusted publishing and staging approved by a named human; a human publishes `3.1.0-rc.0` by hand early in the milestone to claim the name.
- [ ] **INST-08**: A recorded decision amends the Out of Scope line: no global binary is documented or required, and `npm i -g` is unsupported.
- [ ] **INST-09**: The README documents the Claude Code plugin one-liner as a second, Claude-Code-only path, and the `grug@grugops` versus `grugops@grugops` drift is fixed.
- [ ] **INST-10**: A Windows packed-tarball install job is green, and the README shows `npx.cmd` for PowerShell 5.1.

### Docs and release

- [ ] **DOC-01**: README.md, docs/usage.md and docs/how-it-works.md name `install --migrate` and link the pre-v3 page in a way that resolves from the kit home.
- [ ] **DOC-02**: The public docs explain upstream sources, build requests and the consultant, with claim anchors.
- [ ] **DOC-03**: The version is bumped to `3.1.0`, with a CHANGELOG `[3.1.0]` entry and tag `v3.1.0`.

## Future Requirements

Deferred. Tracked but not in the v3.1 roadmap.

- **UP-F1**: On a pin move, list the upstream IDs that changed and flag the tickets citing them as suspect.
- **BR-F1**: A machine-checkable link from an upstream answer to its build request (needs an upstream intake that echoes the request ID).
- **TRC-F1**: Reverse coverage: which upstream IDs no ticket cites.
- **INST-F1**: The packed tarball attached to each GitHub release for offline installs.
- **INST-F2**: Installer auto-detection of the agents to install for.
- **UP-F2**: A live link or MCP server to the upstream system.
- **CON-F1**: Ratified domain packs and dynamic consultants (backlog 999.13).

## Out of Scope

| Feature | Reason |
|---------|--------|
| Copying the upstream package into the repository | Two sources of truth; state byte budgets; private content could leak into a public repository |
| Moving a pin automatically | Only a named human moves a pin; humans decide |
| Requiring git submodules | The source sits outside the repository by relative path (S-02) |
| grugops writing into the upstream repository | Upstream owns what the product is; a human carries requests across |
| `curl \| sh` and `irm \| iex` installers | Revives the two shell installers retired by D-07/D-08 |
| `@latest` in documented commands | Unpinned; upgrades the shared kit home for every repository at once |
| Multi-round debate, or an LLM judge picking a winner | Research: majority voting explains most debate gains and same-model judges are correlated; the disagreement section is the deliverable |
| One consultant role per domain | One parameterized role keeps role text single-source and within budget |
| An always-on skeptic lens | Arguing against everything adds noise; a risk lens is added when needed (S-08) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UP-01 | Phase 44 | Pending |
| UP-02 | Phase 44 | Pending |
| UP-03 | Phase 44 | Pending |
| UP-04 | Phase 44 | Pending |
| UP-05 | Phase 44 | Pending |
| UP-06 | Phase 44 | Complete |
| TRC-01 | Phase 45 | Pending |
| TRC-02 | Phase 44 | Complete |
| TRC-03 | Phase 45 | Pending |
| BR-01 | Phase 45 | Pending |
| BR-02 | Phase 45 | Pending |
| BR-03 | Phase 45 | Pending |
| BR-04 | Phase 45 | Pending |
| BR-05 | Phase 45 | Pending |
| BR-06 | Phase 45 | Pending |
| BR-07 | Phase 45 | Pending |
| ARCH-01 | Phase 45 | Pending |
| ARCH-02 | Phase 45 | Pending |
| CON-01 | Phase 47 | Pending |
| CON-02 | Phase 47 | Pending |
| CON-03 | Phase 47 | Pending |
| CON-04 | Phase 47 | Pending |
| CON-05 | Phase 47 | Pending |
| CON-06 | Phase 47 | Pending |
| CON-07 | Phase 47 | Pending |
| CON-08 | Phase 47 | Pending |
| INST-01 | Phase 46 | Pending |
| INST-02 | Phase 46 | Pending |
| INST-03 | Phase 46 | Pending |
| INST-04 | Phase 46 | Pending |
| INST-05 | Phase 46 | Pending |
| INST-06 | Phase 46 | Pending |
| INST-07 | Phase 46 | Pending |
| INST-08 | Phase 46 | Pending |
| INST-09 | Phase 46 | Pending |
| INST-10 | Phase 46 | Pending |
| DOC-01 | Phase 46 | Pending |
| DOC-02 | Phase 48 | Pending |
| DOC-03 | Phase 48 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓
- By phase: 44 (7), 45 (11), 46 (11), 47 (8), 48 (2)

---
*Requirements defined: 2026-11-24*
*Last updated: 2026-11-24 after roadmap creation (Phases 44–48)*

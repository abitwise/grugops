# Feature Research

**Domain:** grugops v3.1 — building from an approved upstream design package, build requests back upstream, one parameterized consultant role, and a one-command install
**Researched:** 2026-11-24
**Confidence:** MEDIUM overall. Comparable tools and research findings are cross-checked across at least two sources or read from official docs (MEDIUM under the `classify-confidence` seam). Single-source or secondary-only claims are tagged LOW. Claims about the upstream system's export format are `UNKNOWN - verify`, because that format is not settled.

**Scope note.** This file covers only the six v3.1 target features. Everything grugops already ships (roles, shared verified context, board, queue, byte budgets, the per-agent installer, `install --migrate`) is treated as an existing dependency, not as a feature to research. The upstream system is described generically: a separate design system whose first case is a set of agents acting as a game studio. It produces per-idea packages (design, UX, technical, art and audio documents) plus append-only ledgers of decisions, questions and sources with stable IDs. A named human decides there, and a locked decision changes only by supersession.

---

## How comparable systems handle each feature (summary)

| v3.1 feature | What comparable systems do | What that means for grugops |
|---|---|---|
| Upstream design sources | Spec Kit, Kiro, BMAD and Tessl all keep the spec **inside the same repository** as the code (`specs/<feature>/`, `.kiro/specs/`, PRD and architecture docs, `.tessl/tiles/`). None of them pins a spec held in a **separate** repository. The pin pattern comes from elsewhere: git submodules record one exact commit; Figma Dev Mode marks a "Ready for dev" design as "Changed" and lets developers compare versions. | Pinning a separate design repository by commit, reading it in place and reporting drift is a **differentiator**. No spec-driven tool surveyed does it, and it matches grugops's "nothing enters unverified" stance. |
| Traceability upstream | Requirements tools (Jama, DOORS) link items and flag links as **suspect** when the parent changes. Spec Kit claims that when acceptance criteria change, "implementation plans automatically flag affected technical decisions". Kiro's "Sync Files" adds tasks for changed requirements. | Citing upstream IDs is **table stakes** once a source is declared. Flagging tickets whose cited ID was superseded at a new pin is the differentiator. |
| Build requests | Spec Kit marks gaps inline as `[NEEDS CLARIFICATION: question]` and runs `/speckit.clarify` to ask the human. BMAD's "correct course" writes a Sprint Change Proposal (issue summary, impact analysis, recommended approach, detailed edits, handoff) and needs explicit user approval. RFC processes close with a disposition (merge, close, postpone). ADRs never edit an accepted record: a new record supersedes it and links back. | A file-per-request with stable ID, options and a recommended default, a status lifecycle and a "blocked until a new pin answers" rule is **table stakes** for a cross-system flow. Every comparable tool keeps the question and its answer in the **same** repository. A human carrying requests between two repositories is new ground. |
| Universal consultant | BMAD "party mode" puts several agent personas in one session. BMAD ships domain expansion packs (for example a 2D game-dev pack) as separate agents. Anthropic's skills guidance argues for one general agent plus curated skills rather than many specialist agents. Research on multi-agent debate finds same-model personas give **correlated** answers, that majority voting explains most of debate's gains, and that sycophancy collapses debates into early consensus. | One parameterized role is consistent with Anthropic's guidance. A panel is worth building only if members answer **independently** and the deliverable is the **disagreement**, not an averaged or voted verdict. |
| One-command install | `npx bmad-method install` (interactive, with a non-interactive form `--modules … --tools … --yes`); `npx skills add owner/repo -a <agent> -y` (detects installed agents, project scope by default); `npx @opengsd/gsd-core@latest` (prompts for runtime and global/local); `uvx --from git+https://github.com/github/spec-kit.git@vX.Y.Z specify init` (pinned tag); `npx @tessl/cli install …`; `claude plugin marketplace add` then `claude plugin install --scope project` (Claude Code only). | An `npx` command is the established shape for AI dev kits and runs natively on Windows. A `curl \| sh` line does not. Pinning the version in the README command is less common (most tools use `@latest`) but grugops's constraints require it. |
| `install --migrate` docs | Not a comparable-systems question. | Docs-only. It belongs with the install work because the README rewrite touches the same lines. |

---

## Feature Landscape

### A. Declared upstream design sources

#### Table Stakes (users expect these)

| Feature | Why Expected | Complexity | Notes / dependency on existing grugops parts |
|---|---|---|---|
| **Declare one or more sources in config**: an id, a location, a pinned commit, the entry file (manifest) and its blob hash, and the **scope each source owns** (for example product, UX, art, audio, architecture) | Every pinned-dependency mechanism records an exact revision (git submodules store one commit, `mode 160000`). Without a declared scope, no role can tell "upstream decides this" from "grugops decides this", and features C and D depend on that test. | MEDIUM | New key in `agent-factory/config/factory.config.json` plus its doc in `factory.config.md`. **Zero-config first**: no key means no upstream and today's behaviour. The validator's config checks need the new shape. Key name is an open decision. |
| **Read in place at the pin, never copy** | A package runs to hundreds of KB, far over the state byte budgets. Copying makes a second source of truth that drifts. | MEDIUM | Read the pinned content from git objects (`git -C <source> show <sha>:<path>`), not from whatever the working tree holds, so a moved checkout cannot change what roles read. Needs a local clone that contains the pinned commit. Whether `git show` across repositories works without a fetch is `UNKNOWN - verify`; the practical route is a local clone. Works the same on all six hosts (file reads plus `git`). |
| **Pin-state report**: the Orchestrator reports when the source's HEAD or the entry file's blob no longer matches the pin | Figma Dev Mode marks a "Ready for dev" design as "Changed" and offers a compare. Requirements tools flag suspect links. Silent drift is the failure users fear most. | LOW–MEDIUM | Orchestrator start-of-session check; also a line in `install --check` and in `tools/grugops/state-check.js`. The report names the drift. It never moves the pin. |
| **Respect the upstream decision lifecycle**: use only approved or locked items; follow a supersession chain to the live record | ADR practice: accepted records are not edited; a new record supersedes and links the old one. The upstream ledgers work the same way. | MEDIUM | Depends on the upstream export format (statuses, ID grammar, supersession field), which is `UNKNOWN - verify` until the upstream side settles it. Keep the grugops side format-agnostic: a small adapter description in the source declaration rather than a hard-coded parser. |
| **Missing or unreadable source is reported, never guessed** | grugops's no-fabrication rule. | LOW | Role reports `BLOCKED` and names the source; answers depending on it are `UNKNOWN - verify`. Uses the existing BLOCKED route-back. |
| **Upstream content enters the shared context only as cited `claim` notes** (upstream ID, source id, pin), never as a `finding` | grugops never gate-verified the upstream decision; a `finding` needs a `§14-gate` or `human:<name>` stamp. | LOW | Existing `note.js` and the context-note contract already admit `claim` with `--ref`. Needs a ref grammar for `<source>:<ID>@<sha>`. |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Entry-file blob hash in the pin** | Makes a hand-edited or swapped package evident, not just a moved HEAD. Fits grugops's "verified means a real stamp" stance. | LOW | `git hash-object` or `git rev-parse <sha>:<path>`; no new dependency. |
| **Pin bump as a recorded human decision, with a changed-ID list** | Between the old and new pin, list the upstream IDs that were added, changed or superseded. This is the impact analysis that requirements tools sell as "suspect links". | MEDIUM–HIGH | Needs the upstream ledger format. The bump itself is a `decision` note under a named human. Grugops never bumps a pin on its own. |
| **Architecture as given input** | When upstream decides the stack or architecture, the Greenfield Mapper and the Architect take it as input, and a deviation becomes a build request. This stops grugops from quietly re-deciding upstream's architecture. | MEDIUM | Touches `greenfield-mapper.md`, `architect-design.md` and the `default_stack` config default (upstream wins over the default when declared). Who owns architecture is still an open human decision; the proposed default is upstream. |
| **Gate-scoped build**: build only on decisions locked at a named upstream gate | Lets a prototype start before upstream's final go/no-go, on locked decisions only. | MEDIUM | Open human decision. Depends on upstream exposing a gate marker (`UNKNOWN - verify`). Defer unless the human picks it. |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Copy or vendor the package into the grugops repository (or into `memory-bank/`) | "Agents can just read it locally" | Breaks the byte budgets, creates a second source of truth, and drifts silently | Read in place at the pin; cite by ID |
| Auto-follow upstream HEAD or auto-bump the pin | "Always build the latest design" | A surprise mutation of the build's input. It is the same class as the v1.1 out-of-scope "background auto-update". Unapproved upstream work would leak into the build. | Report drift; a named human bumps the pin |
| Require git submodules | Submodules pin a commit natively | Detached-HEAD and forgot-to-update pitfalls (git book), the user's repository layout is forced, and upstream history lands in the build repository | A config-declared pin over any local clone. A submodule can be one supported location but is not required. |
| Live link (MCP server, API, URL fetch) to the upstream system | "No human courier needed" | Out of scope for v3.1 (files first). Adds network, auth and host-specific behaviour; the Phase-25 MCP server is Claude-Code-only | Files and a local clone; revisit when carrying files becomes a burden |
| Re-key upstream IDs into grugops IDs | "One ID scheme" | Breaks the trail back to the upstream decision | Cite upstream IDs verbatim |
| Writing anything into the upstream repository | "Close the loop automatically" | Violates the ownership split: a human decides on both sides | Build requests carried by a human (feature C) |

---

### B. Traceability to upstream IDs

#### Table Stakes

| Feature | Why Expected | Complexity | Notes / dependency |
|---|---|---|---|
| **Tickets cite upstream IDs with the pin** (`<source>:<ID>@<sha>`) | Once a source exists, a requirement with no link back to its decision is unauditable. Regulated teams expect parent-to-child traceability. | LOW–MEDIUM | BA/PM role and the ticket contract gain an `upstream` field. Per-ticket traceability files under `memory-bank/plans/` (v3.0 layout) carry it; the trace render shows it. |
| **Explicit `none` for build-internal tickets** | Infrastructure or tooling tickets have no upstream decision; a forced citation invites a fabricated one | LOW | `upstream: none (build-internal)` is a legal value; the validator refuses an empty field when a source is declared. |
| **Validator checks that a cited ID exists at the cited pin** | No fabrication: an invented or mistyped upstream ID must fail red | MEDIUM | Needs the upstream ID grammar and ledger location (`UNKNOWN - verify`). Structure check only, in the existing validator style. |
| **The trace render runs upstream ID → requirement → code → test → release** | That is the stated core value of the trail | LOW–MEDIUM | Extends the existing render; must stay within the trace byte budgets. |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Suspect flag on pin bump**: tickets citing an ID that changed or was superseded between pins are marked for review | The core feature requirements tools charge for. Spec Kit promises the same in spirit. | MEDIUM–HIGH | Depends on the changed-ID list (feature A). A flag in the ticket body plus a board-visible marker. |
| **Reverse coverage**: locked upstream decisions that no ticket cites | Shows what the build has not yet addressed | MEDIUM | Enterprise-dialed; lean skips it. |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Automatic trace links by text similarity | "Saves BA/PM time" | Information-retrieval trace recovery is unreliable, and researchers name link maintenance as a main reason traceability efforts fail. A guessed link is a fabricated link. | BA/PM cites IDs it read; the validator checks they exist |
| Mandatory upstream citation in lean mode with no source declared | "Consistency" | Taxes solo users who have no upstream | Field required only when a source is declared |
| Writing grugops ticket IDs back into the upstream ledgers | "Bidirectional trace" | grugops never writes upstream | Upstream may cite a build-request ID in its own answer (see C) |

---

### C. Build requests (questions and changes sent upstream)

#### Table Stakes

| Feature | Why Expected | Complexity | Notes / dependency |
|---|---|---|---|
| **One file per request with a stable ID**: the question or change, the upstream IDs it touches, the pin it was raised against, options with a recommended default, what is blocked, who raised it and when | Spec Kit's `[NEEDS CLARIFICATION: specific question]` and BMAD's Sprint Change Proposal (issue, impact, recommended approach, edits, handoff) carry the same parts. A request without options and a default is slow to answer. | LOW–MEDIUM | New contract template; one file per record so it fits the v3.0 per-record layout and byte budgets; validator support. Location under `memory-bank/plans/` is the natural fit (`UNKNOWN - verify` against the path authority). |
| **Status lifecycle**: open → carried → answered / declined / withdrawn | RFC processes close with a disposition (merge, close, postpone); ADRs supersede. A request with no terminal state rots. | LOW | Statuses live in the request file. |
| **A new board status** for tickets waiting on upstream, visible and time-tracked like Blocked | The 999.14 idea names it; users need to see what is waiting on another system, separately from internal blockers | MEDIUM | Board contract grammar (`agent-factory/contracts/board.md`), validator, `state-check`, the board projector and dashboard, and WIP config (the status carries no limit, like Blocked). Additive: old repositories stay valid. Name is an open decision. |
| **Blocked until a new pin answers** | The answer must be pinned upstream; a chat reply is not an approved design | MEDIUM | The answer enters as a `claim` note citing the upstream ID and the new pin. Workflow 17's queue keeps the ticket's tasks unclaimable while the status holds. |
| **A carry list for the human courier** | The human needs one place that says what to take upstream and what came back | LOW | A generated index of open requests (read-only, like the board projector). |
| **Scope routing**: what the product is → build request; how it is built → grugops decides | The ownership split. Without it every question either goes upstream (slow) or is answered locally (fabrication). | LOW (text) | Uses the source scope declared in feature A. Roles report the new status and route back; only the Orchestrator talks to the human. |
| **Deduplication**: two roles asking the same thing produce one request listing every blocked ticket | Users dislike being asked the same question twice | LOW–MEDIUM | Orchestrator checks open requests before filing a new one. |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Machine-checkable answer link**: a request closes when the new pin holds an upstream record citing the request ID | Closes the loop with proof, not assertion | MEDIUM | Depends on upstream's intake format echoing the request ID (`UNKNOWN - verify`). Without it, a named human marks the request answered. |
| **Impact section**: tickets, code paths and tests affected | BMAD's correct-course includes impact analysis; it lets the upstream decider weigh the cost | LOW–MEDIUM | Filled by the raising role from the trace. |
| **Only dependent tickets block** | Other work keeps flowing | LOW | Matches Workflow 17's refill-from-disk flow. |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| grugops opens issues or PRs in the upstream repository | "Saves the courier step" | Writes upstream; bypasses the human who decides there | Human carries the file |
| Proceed on the recommended default while waiting, by default | "Don't stall the team" | Builds on an undecided product question, which is the drift this feature exists to stop | A named human may choose to proceed; record it as a `decision` note and keep the request open |
| An agent answers its own build request, or a consultant answers it | "It knows the domain" | Fabrication of an upstream decision | Upstream-scope questions only become build requests (feature D enforces this) |
| Questions asked only in chat | Fast | Not auditable; lost at compaction | Every upstream question is a file |
| Blocking the whole board on one request | "Safe" | Stops unrelated work | Block only the citing tickets |

---

### D. Universal consultant (single and panel)

#### Table Stakes

| Feature | Why Expected | Complexity | Notes / dependency |
|---|---|---|---|
| **One parameterized role**: topic, lens, question, sources to read, output shape, boundaries | Anthropic's multi-agent research writeup: "Each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries." Anthropic's skills guidance favours one general agent plus curated knowledge over a fleet of specialist agents. | MEDIUM | Role near 2 KB (role corpus is about 61 KB against a 64,000 B warning and 67,383 B fail); procedure in a new workflow (Phase 40 D-05 pattern). Adapter generator, `models`/`effort` dials, catalog page, controlled-language guards and role-rule guards all apply. |
| **Sources first, with citations**; beyond them, only questions outside upstream's scope; otherwise `UNKNOWN - verify` | Anthropic added source-quality heuristics and a citation step because agents favoured low-quality sources. grugops's no-fabrication rule. | MEDIUM | Depends on feature A (sources and scope). Output written as `claim` or `observation` notes through `note.js`. |
| **Upstream-scope questions become build requests, never opinions** | Otherwise the consultant decides what the product is | LOW (text) | Depends on feature C. |
| **Advisory only**: no code, no tickets, no gate, no `finding` | Keeps the hard limits; 999.13's advisory-only rule | LOW | The admission path already refuses an unstamped `finding`. |
| **Orchestrator-only dispatch on a `CONSULT` request** from BA/PM, System Analyst, Architect, Designer, or a human | Cost control and one dispatcher | LOW–MEDIUM | New request word in the role-switch protocol and the Orchestrator; engineers, QE and Release do not request it. |
| **Structured answer**: answer, confidence, sources, assumptions, what would change the answer | Makes the advice checkable by the requester | LOW | Workflow template. |
| **Runs on request only when no config** | Zero-config first; multi-agent use costs about 15 times the tokens of a chat (Anthropic) | LOW | Dial default. |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Panel mode whose deliverable is the disagreement** | Research shows same-model personas give correlated answers and that majority voting explains most of debate's gains. A panel that ends in a vote adds cost and little signal. A panel that ends with where and why the lenses disagree gives the human the decision points. | MEDIUM–HIGH | New workflow section; enterprise default via a dial (name open). |
| **Independent first answers**: each lens writes its position before seeing the others; one synthesis step lists agreements and disagreements | Sycophancy and conformity collapse debates into early consensus; one study reports agents adopting the majority answer up to 85.5% of the time | MEDIUM | On Claude Code each lens can run in its own spawned context. On the five sequential hosts the lenses share one context, so they are **not** independent: label that output honestly as a single-context panel. |
| **A skeptic lens is always on the panel** | Devil's-advocate interventions target conformity (Janis-inspired); a study found the skeptic adds the most diversity while advocate and domain-expert agents stay redundant (LOW: preprint) | LOW | Lens list in the workflow. |
| **Mixed tiers through the `models` dial** | Some decorrelation | LOW | Honest limit: errors correlate more for models from the same developer (Kim et al., ICML 2025), so mixed tiers of one vendor decorrelate only weakly. Banned-claims gate applies to any "more accurate" claim. |
| **A small lens catalogue** with one-line charters (customer, operator, finance, regulator, skeptic, security, accessibility, platform rules) | 999.13's finding: quality comes mostly from curated content, not the persona name | LOW–MEDIUM | Kept in the workflow, not in role text, to protect the role byte budget. |
| **Reuse earlier consult notes unless the pin changed** | Saves repeat consults | LOW–MEDIUM | Read-before-write is already Workflow 16. |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| One consultant role per domain (game designer, artist, sound artist, …) | "Specialists answer better" | Role sprawl against a near-full byte budget; Anthropic's guidance is one general agent plus curated knowledge; packs need the Out of Scope marketplace line amended (999.13) | One role, lens as a parameter; packs stay in 999.13 |
| Multi-round debate where lenses read and answer each other | "Debate finds truth" | Choi et al. (NeurIPS 2025): voting alone matches debate in most cases; conformity and sycophancy erode correct minority answers; extra rounds multiply cost | Independent answers, one synthesis |
| Averaged consensus or a vote count as the output | "Give me one answer" | Hides the minority view; reads as false certainty | Disagreement section; the human decides |
| Persona theatre (named characters with backstories) | Engaging | A "persona tax" on accuracy is reported for small models (LOW: preprint); breaks voice discipline | Plain lens charters |
| Panel on every consult | "More rigour" | About 15× tokens per multi-agent run; Anthropic advises adding complexity only when it demonstrably improves outcomes | Lean = single, enterprise = panel, on-request without config |
| Engineers, QE or Release call the consultant directly | Convenience | Bypasses the dispatcher and its cost control | `CONSULT` request via the Orchestrator |
| Runtime-generated consultant roles (999.13's dynamic draft) | Flexibility | Unratified role text inside the factory | Defer to 999.13 |
| Same-model LLM-as-judge picking the panel's winner | Automates the decision | Liang et al. (EMNLP 2024) find an LLM judge favours the side its own model produced | The human decides from the disagreement section |

---

### E. One-command install

#### Table Stakes

| Feature | Why Expected | Complexity | Notes / dependency |
|---|---|---|---|
| **One copy-paste command in the README that works on macOS, Linux and Windows** | Peer kits all ship a one-liner (`npx bmad-method install`, `npx skills add …`, `npx @opengsd/gsd-core@latest`, `uvx … specify init`) | MEDIUM | `npx` runs natively in PowerShell and cmd; `curl \| sh` does not. Node 22+ is already a prerequisite, so `npx` adds no new prerequisite. |
| **No clone**: the package carries the kit | The stated v3.1 goal | MEDIUM | `install/kit-source.ts` derives the kit from a source root; a published package must contain exactly that set (`files` whitelist) and resolve its root relative to the installed entry point. `package.json` today is `"private": true`, named `grugops-tooling`, so a publish manifest is new work. npm name availability: `UNKNOWN - verify`. |
| **Version pinned in the command** (`…@3.1.0` or `#v3.1.0`) | grugops's constraints; reproducible installs. Spec Kit documents a pinned tag form. | LOW | The README line joins the version-bump set (`VERSION`, `plugin.json`, `package.json`) with a test that they match. Most peers default to `@latest`; grugops should not. |
| **Default target is the current repository**, shown and confirmed; `--yes` for CI | "No hand-named target"; the installer already prompts when the target defaults to the working directory | LOW | Name the git root, not just cwd, when run from a subfolder (`UNKNOWN - verify` against the installer's current rule). Watch flag collision: `npx` has its own `--yes`. |
| **Agent selection** (`--claude`, `--codex`, …) or a prompt | `npx skills add` detects agents or prompts; BMAD takes `--tools` | LOW | Existing `agent-picker.ts` and per-agent flags. |
| **Dry run as a flag, not only an env var** | `DRY_RUN=1 npx …` does not work in PowerShell or cmd | LOW | `--dry-run` already exists in `install.ts`; the README must show the flag form. |
| **Same channel for uninstall, update, check and migrate** | Users expect `npx <pkg>@<ver> uninstall` beside install | MEDIUM | Today `uninstall.js` is a second entry point; a package with one `bin` needs a subcommand or a second named bin (npx picks the single bin, or the bin matching the package name). |
| **Zero runtime dependencies, no postinstall** | grugops constraint; supply-chain hygiene | LOW | Empty `dependencies`; dev tooling never published. |
| **Clear Node-version refusal** | `npx` can start on an older Node; the bin must check `>=22` itself and say so | LOW | First lines of the entry point. |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Agent auto-detection** from what the repository already has (`.claude/`, `.agents/`, `.opencode/`, …) | Fewer flags to read about | LOW–MEDIUM | Suggest, then confirm; never write an agent's files without a flag or a yes. |
| **npm provenance on publish** | Lets users tie the package to a CI build | LOW–MEDIUM | Needs the human's npm account and CI setup; `UNKNOWN - verify` as to which publish path the human wants. |
| **Claude Code plugin marketplace as a second one-liner** | Native Claude Code path, versioned updates | LOW | Already shipped as a form; gives namespaced `/grugops:<cmd>` only, so it cannot be the universal one-liner. PLUGIN-01 is the existing candidate. |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| `curl … \| sh` as the primary command | Common for CLIs | No Windows parity; a dropped connection can run a truncated script; the script is usually unsigned | `npx` with a pinned version |
| `@latest` in the README | Always current | Non-reproducible; a compromised release reaches every new user; BMAD's docs tell users to pin when they get a stale beta | Pinned version, bumped per release |
| `npm install -g grugops` (global `$PATH` binary) | Shorter repeat commands | Out of scope since v1.1 | `npx` runs from the npm cache and installs nothing on `$PATH`. The human should still record whether that satisfies the v1.1 rule. |
| Installer that runs `git clone` | Reuses the current flow | Needs git and network, downloads the whole repository (about 3,700 tracked files including planning records) | Ship the kit in the package |
| Background or on-run auto-update | Convenience | Out of scope since v1.1 (surprise mutation) | Explicit `--update` |
| A TUI wizard | Friendlier | Out of scope since v1.1 | The existing single confirm prompt |
| Run from the GitHub repository (`npx github:<owner>/<repo>#<tag>`) as the main path | No npm publish needed | Behaviour of npm's git fetcher for this repository (tarball vs clone, whether the `files` whitelist applies, whether `prepare` runs) is `UNKNOWN - verify`; it may fetch the full repository | Use it only as a fallback if publishing to npm is refused |

---

### F. `install --migrate` in the public docs

| Kind | Item | Complexity | Notes |
|---|---|---|---|
| Table stakes | README.md, docs/usage.md and docs/how-it-works.md name `install --migrate`, and a public page links docs/pre-v3-state-layout.md | LOW | Carried from v3.0. The docs freshness and public-vocabulary gates apply. If the README install line changes to an `npx` form (feature E), write the migrate line in the same form. |
| Anti-feature | Copying the pre-v3 page into the README | — | Link it; keep the README short. |

---

## Feature Dependencies

```
[A] Declared upstream sources (pin, scope, read-in-place)
    ├──required by──> [B] Traceability to upstream IDs
    │                     └──enhanced by──> [A] changed-ID list ──> [B] suspect flags
    ├──required by──> [C] Build requests (scope routing, pin-answers-request)
    │                     └──requires──> new board status (board contract, validator, state-check, projector)
    ├──required by──> [D] Consultant "sources first" + scope check
    │                     └──requires──> [C] (upstream-scope questions become build requests)
    └──required by──> Architecture as input (Greenfield Mapper, Architect)

[D] Consultant (single) ──required by──> [D] Panel mode
[D] Panel mode ──enhanced by──> models dial (mixed tiers)
[D] Panel independence ──conflicts on sequential hosts──> single shared context (label honestly)

[E] One-command install ──requires──> publish manifest + kit-in-package + pinned README line
[E] ──enhances──> [F] (README install and migrate lines share one form)
[F] has no dependency on A–D
```

### Dependency Notes

- **B, C and D require A.** Citations, scope routing and "answer from sources first" all need a declared source with an owned scope. A must land first.
- **D requires C.** The consultant's refusal to answer upstream-scope questions is only safe if a build-request route exists for them.
- **The upstream export format gates parts of A, B and C.** ID grammar, status and supersession fields, and whether upstream echoes a build-request ID are all `UNKNOWN - verify`. The 999.14 idea says the upstream format should settle before grugops fixes the shape of the source declaration. Design the grugops side so these are declared, not hard-coded.
- **E and F are independent of A–D** and can run in parallel or first. F should land after or with E's README change.
- **Panel independence conflicts with sequential hosts.** On Codex CLI, Antigravity CLI, OpenCode, Copilot CLI and Pi the Orchestrator loads roles into one context in turn, so lenses see each other. The panel still runs but cannot claim independence there.

---

## MVP Definition

### Launch with (v3.1)

- [ ] **A: source declaration with pin, entry-file hash and owned scope; read at the pin; drift report** — everything else depends on it
- [ ] **B: `upstream` field on tickets with explicit `none`; validator checks cited IDs exist at the pin; trace render shows the upstream link** — the core-value trail
- [ ] **C: build-request file, lifecycle, new board status, blocked-until-new-pin, carry list, scope routing** — prevents fabrication of upstream decisions
- [ ] **D: single consultant (role near 2 KB plus a workflow), Orchestrator-only `CONSULT`, sources first, upstream-scope questions to C, `claim`/`observation` only** — the consultation core
- [ ] **D: panel mode with independent first answers, a skeptic lens and a disagreement section; lean single, enterprise panel** — the differentiator the milestone names
- [ ] **Architecture as input** for the Greenfield Mapper and Architect
- [ ] **E: pinned `npx` one-liner, kit in the package, current-repo default, `--dry-run` flag form, Node check, uninstall/update/migrate on the same channel**
- [ ] **F: `install --migrate` in the three public docs plus a link to the pre-v3 page**

### Add after validation (v3.1.x)

- [ ] Changed-ID list on a pin bump and suspect flags on tickets — once the upstream ledger format is stable
- [ ] Machine-checkable answer link (upstream echoes the build-request ID) — once upstream's intake exists
- [ ] Reverse coverage report (enterprise)
- [ ] Agent auto-detection in the installer; npm provenance

### Future consideration

- [ ] Gate-scoped build (only decisions locked at a named upstream gate) — waits on a human decision
- [ ] Live link to the upstream system (MCP or CLI) — out of scope until carrying files is a burden
- [ ] Ratified domain packs and dynamic consultants — backlog 999.13; needs the Out of Scope line amended

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| A: source declaration, pin, read-in-place, drift report | HIGH | MEDIUM | P1 |
| B: upstream ID citations + validator existence check | HIGH | MEDIUM | P1 |
| C: build requests + new board status | HIGH | MEDIUM | P1 |
| D: single consultant | HIGH | MEDIUM | P1 |
| D: panel with disagreement section | MEDIUM | MEDIUM–HIGH | P1 (milestone names it) |
| Architecture as input | MEDIUM | LOW–MEDIUM | P1 |
| E: pinned one-command install | HIGH | MEDIUM | P1 |
| F: `--migrate` in public docs | MEDIUM | LOW | P1 |
| Changed-ID list + suspect flags | HIGH | MEDIUM–HIGH | P2 |
| Machine-checkable answer link | MEDIUM | MEDIUM | P2 |
| Reverse coverage | MEDIUM | MEDIUM | P2 |
| Installer agent auto-detection | LOW | LOW–MEDIUM | P3 |
| npm provenance | MEDIUM | LOW–MEDIUM | P2 |
| Gate-scoped build | MEDIUM | MEDIUM | P3 |

**Priority key:** P1 must have for v3.1; P2 should have, add when possible; P3 future.

---

## Competitor Feature Analysis

| Feature | GitHub Spec Kit | Kiro | BMAD Method | Tessl | grugops v3.1 approach |
|---|---|---|---|---|---|
| Where the spec lives | `specs/<feature>/` in the same repository; `.specify/` templates; a constitution of project principles | `.kiro/specs/<feature>/requirements.md`, `design.md`, `tasks.md`; steering in `.kiro/steering/` | PRD, architecture and UX docs in the project | Specs installed as tiles in `.tessl/tiles/` from a registry | A **separate** upstream repository, pinned by commit and read in place |
| Spec changes | Spec is the source of truth; changes are said to flag affected plan decisions | Edit requirements, then "Sync Files" adds tasks | Correct-course writes a Sprint Change Proposal for approval | Not researched (`UNKNOWN - verify`) | Drift report; human bumps the pin; suspect flags later |
| Open questions | `[NEEDS CLARIFICATION: …]` markers; `/speckit.clarify` asks the human | Revise requirements in conversation | Correct-course; human approval | Not researched | Build-request file carried upstream by a human; ticket blocked until a new pin answers |
| Multi-perspective advice | Not a feature | Not a feature | "Party mode": several personas in one session | Not a feature | One parameterized consultant; panel ends with a disagreement section, not consensus |
| Install | `uvx --from git+…spec-kit.git@vX.Y.Z specify init`, pinned tag supported | IDE download | `npx bmad-method install` (interactive; `--modules … --tools … --yes`); Node 20+ | `npx @tessl/cli install <workspace>/<spec>` | Pinned `npx` one-liner; zero runtime deps; idempotent, additive, dry-run, reversible |

Related comparables: `npx skills add owner/repo -a <agent> -y` (agent detection, project scope default); `npx @opengsd/gsd-core@latest` (prompts for runtime and scope; the `--claude --local` flags appear in GSD's own tooling but were not confirmed in public docs: `UNKNOWN - verify`); `claude plugin marketplace add` + `claude plugin install --scope project` (Claude Code only, scripted with `--yes`).

---

## Sources

All retrieved 2026-11-24. Confidence per the `classify-confidence` seam: official or cross-checked = MEDIUM; single secondary source = LOW.

**Spec-driven tools**
- GitHub Spec Kit docs and quickstart — https://github.github.com/spec-kit/ , https://github.github.com/spec-kit/quickstart.html (MEDIUM)
- Spec Kit `spec-driven.md` (`[NEEDS CLARIFICATION]`, constitution, change propagation) — https://github.com/github/spec-kit/blob/main/spec-driven.md (MEDIUM)
- Spec Kit pinned install and upgrade — https://github.github.com/spec-kit/install/one-time.html , https://github.github.com/spec-kit/upgrade.html (MEDIUM)
- Microsoft Learn, Spec Kit module — https://learn.microsoft.com/en-us/training/modules/spec-driven-development-github-spec-kit-enterprise-developers/3-examine-github-spec-kit (MEDIUM)
- Kiro specs and best practices — https://kiro.dev/docs/specs/ , https://kiro.dev/docs/specs/best-practices/ (MEDIUM)
- BMAD install and getting started — https://docs.bmad-method.org/how-to/install-bmad/ , https://docs.bmad-method.org/tutorials/getting-started/ (MEDIUM)
- BMAD correct-course (Sprint Change Proposal) — https://skills.sh/bmad-code-org/bmad-method/bmad-correct-course ; mirror of the 4.x task https://cdn.jsdelivr.net/npm/@ptnglobal/bmad-method@4.43.1/bmad-core/tasks/correct-course.md (LOW: mirrors, not the official repository)
- Tessl launch and registry — https://tessl.io/blog/tessl-launches-spec-driven-framework-and-registry/ , https://tessl.io/registry/tessl-labs/spec-driven-development (LOW)

**Decision and change practice**
- Martin Fowler, Architecture Decision Record — https://www.martinfowler.com/bliki/ArchitectureDecisionRecord.html (MEDIUM)
- Microsoft Azure Well-Architected, ADR — https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record (MEDIUM)
- UK GDS Way, architecture decisions — https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html (MEDIUM)
- Rust RFC process (FCP, merge/close/postpone) — https://rust-lang.github.io/rfcs/ (MEDIUM)
- Figma Dev Mode statuses and compare changes — https://help.figma.com/hc/en-us/articles/26781702258583-Dev-Mode-statuses-and-notifications (MEDIUM)
- Suspect links in requirements tooling — https://arxiv.org/pdf/2609.28600 (JPL, Jama suspect links); trace-link maintenance burden https://arxiv.org/pdf/1602.07633 (LOW)
- Git submodules (one pinned commit, detached HEAD and update pitfalls) — https://git-scm.com/book/en/v2/Git-Tools-Submodules (MEDIUM)

**Multi-agent and consultant research**
- Anthropic, How we built our multi-agent research system — https://www.anthropic.com/engineering/multi-agent-research-system (MEDIUM)
- Anthropic, Building effective agents — https://www.anthropic.com/engineering/building-effective-agents (MEDIUM)
- Anthropic, Equipping agents for the real world with Agent Skills — https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills ; Building agents with Skills — https://claude.com/blog/building-agents-with-skills-equipping-agents-for-specialized-work (MEDIUM)
- Kim et al., Correlated Errors in Large Language Models, ICML 2025 — https://proceedings.mlr.press/v267/kim25e.html (MEDIUM)
- Choi, Zhu, Li, Debate or Vote, NeurIPS 2025 — https://arxiv.org/abs/2508.17536 (MEDIUM)
- Liang et al., Encouraging Divergent Thinking through Multi-Agent Debate (Degeneration-of-Thought; judge bias), EMNLP 2024 — https://aclanthology.org/2024.emnlp-main.992 (MEDIUM)
- Yao et al., Peacemaker or Troublemaker: How Sycophancy Shapes Multi-Agent Debate — https://arxiv.org/abs/2509.23055 (LOW: preprint)
- Conformity in LLMs, Devil's Advocate intervention — https://arxiv.org/abs/2410.12428 (LOW)
- The Cost of Consensus (conformity up to 85.5%) — https://arxiv.org/pdf/2605.00914 (LOW: preprint)
- Talk Isn't Always Cheap: failure modes in multi-agent debate — https://arxiv.org/abs/2509.05396 (LOW: preprint)
- More Debate, Same Evidence (skeptic adds diversity; structural ceiling) — https://arxiv.org/pdf/2608.00243 (LOW: preprint)
- Beyond Symmetric Agents (persona tax in small models) — https://arxiv.org/pdf/2609.35875 (LOW: preprint)

**Installers**
- npm `npx` (bin selection, install prompt, `--yes`) — https://docs.npmjs.com/cli/v11/commands/npx (MEDIUM)
- npm package spec (git URLs, `github:` shorthand, `#ref`) — https://docs.npmjs.com/cli/v11/using-npm/package-spec (MEDIUM)
- npm `init <initializer>` → `create-<initializer>` — https://docs.npmjs.com/cli/v11/commands/npm-init (MEDIUM)
- Vercel skills CLI (`npx skills add`, `-a`, `-g`, `-y`) — https://vercel.com/docs/agent-resources/skills , https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem (MEDIUM)
- GSD core package — https://github.com/open-gsd/gsd-core (LOW for flag details)
- Claude Code plugin install and CLI reference — https://code.claude.com/docs/en/plugins/install , https://code.claude.com/docs/en/plugins/cli-reference (MEDIUM)
- `curl | sh` risks — https://www.kicksecure.com/wiki/Dev/curl_bash_pipe , https://sysdig.com/blog/friends-dont-let-friends-curl-bash , https://arp242.net/curl-to-sh.html (MEDIUM, with the counterpoint noted)

**grugops internal inputs (read 2026-11-24)**
- `.planning/PROJECT.md` (Current Milestone, Active, Out of Scope)
- `.planning/phases/999.14-upstream-design-sources-and-universal-consultant/999.14-IDEA.md`
- `.planning/phases/999.13-consultant-and-business-domain-packs/999.13-IDEA.md`
- `agent-factory/config/factory.config.json`, `agent-factory/contracts/board.md`, `agent-factory/workflows/16-context-read-write.md`, `install/README.md`, `install/install.ts`, `install/kit-source.ts`, `package.json`

---
*Feature research for: grugops v3.1 (upstream design, consultation and one-command install)*
*Researched: 2026-11-24*

# Phase 5: Packaging, Adapters, Install & Distribution - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 **bridges the finished, frozen single-source core to all five host tools** and ships every distribution + install + safety surface — the last build phase before validation/dogfood. The core it wraps is complete and immutable: 16 role prompts (`agent-factory/roles/`), 14 workflow files (`agent-factory/workflows/`), root `AGENTS.md`, the config dial, and the state plane. **This phase writes only the dispatch, distribution, install, and mechanical-safety layers — never new role/workflow/config content.** "Only the dispatch differs, never the content." Concretely it delivers:

- **`agent-factory/packaging/adapters.md` + templates** — maps each of the 5 tools (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI) to its entry file + dispatch mode + adapter; enforces the single rule "all work starts at `orchestrator.md`"; states "only the dispatch differs, never the content"; flags every tool row "verify against current tool docs." Templates (`subagent.frontmatter.md`, `slash-command.template.md`) use the current `Agent` tool (not legacy `Task`), `model: inherit`, and the recorded `skills/` choice. **(PKG-01, PKG-02)**
- **Standalone `.claude/` form** — GSD-style thin pointer skills named `grugops`, `grugops-map`, `grugops-plan`, `grugops-ticket`, `grugops-gate`, `grugops-uat`, `grugops-release` (invoked `/grugops-plan` etc., dash shape), a one-line `CLAUDE.md` pointer, and per-tool entry files (Gemini `settings.json` `context.fileName`, optional Copilot pointer). **(CLAUDE-01)**
- **Plugin form** — `.claude-plugin/plugin.json` (name `grugops`, `version` 0.1.0) + `marketplace.json` (catalog `grugops`), `skills/` (commands → `/grugops:plan` etc.), `hooks/hooks.json` (the SAFE-02 guard), components at plugin **root**. Both forms coexist. **(CLAUDE-02, CLAUDE-03)**
- **Mechanical prod-deploy guard** — a plugin-level `hooks/hooks.json` `PreToolUse` Bash matcher that denies config-matched deploy commands unless a human-set session env var is present, fails closed, and cannot be self-approved by the agent. **(SAFE-02)**
- **Installers** — `install/install.sh` (POSIX) + `install/install.mjs` (Node), functionally identical, idempotent/additive/`DRY_RUN=1`/reversible; detect host tool, lay down the right adapter (symlink with copy fallback), print an install report, never overwrite user content; `install/uninstall.sh` removes only what was added; `install/README.md` documents the "just install the markdown" minimal path. **(INSTALL-01, INSTALL-02)**

**This phase resolves the two open decisions parked since Phase 1** (version string; `commands/` vs `skills/`) and **activates the dispatch-neutrality** Phases 3–4 deliberately deferred (D-20/D-27): Phase 5 is the *only* place tool-specific dispatch lives.

**Out of scope (other phases):** the validator, examples, brand/legal collateral, and the idea→PR dogfood → Phase 6 (VAL/EX/BRAND/DOG). No role/workflow/config/handoff/checklist content is edited — all frozen by Phases 1–4 and cited by name.

**Requirements:** PKG-01, PKG-02, CLAUDE-01, CLAUDE-02, CLAUDE-03, INSTALL-01, INSTALL-02, SAFE-02.

</domain>

<decisions>
## Implementation Decisions

### Baseline carried forward (apply without re-asking)
- **D-20 / D-27 (Dispatch-neutrality — now ACTIVATED):** Phases 3–4 kept all role/workflow text tool-agnostic precisely so Phase 5 could be the single home for dispatch. The spawn-vs-sequential difference (Claude subagents can't nest → Orchestrator runs as main thread via plugin `settings.json` `agent:`; portable tools load roles in sequence) is **packaging content**, authored here and **nowhere else**. Do not edit role/workflow files to add tool-specific dispatch.
- **D-04 (Shipped-kit identity):** Everything authored here is the **generic, project-agnostic kit** that drops onto any repo. grugops's OWN build state stays in `.planning/`; the two must not be conflated. Installers/adapters describe any repo running the factory.
- **Constraints in force:** single-source ("adapters are thin pointers, **never copies**"); installers idempotent/additive/dry-run/reversible/never-overwrite; safety enforced **mechanically**, not by prompt; `UNKNOWN - verify` never faked; always-lowercase `grugops`; clear voice for safety/install-report/guard content, light grug wink only in framing (D-21/D-27).
- **Standing posture (Phases 1–4):** maximum fidelity to spec + already-gathered research (`.planning/research/STACK.md`, surfaced verbatim in `CLAUDE.md`'s Technology Stack), minimum invention. Phase 5 is research-flagged — **verify plugin/marketplace/hook/per-tool conventions against current tool docs at build time.**

### Version string (Area A — resolves Open Decision #1)
- **D-28 (Ship 0.x / 0.1.0; VERSION + plugin.json synced; omit from marketplace):** grugops ships under **SemVer 0.y.z**, keeping the already-seeded `agent-factory/VERSION` = **0.1.0** (Phase-1 D-02 deferred the final string to here). It is a brand-new public tool; 0.y.z gives "anything-may-change" latitude through dogfooding with no MAJOR-break contract. `agent-factory/VERSION` is the **canonical** value; mirror it into `.claude-plugin/plugin.json` `version` and **bump both together per release**. **Do NOT also set `version` in the marketplace entry** (plugin.json wins silently and divergence is a footgun). Pinning `version` means installed users get updates only on bump — predictable. (User rejected 2.0.0 spec-continuity and the git-SHA-as-version option.)

### Command form & naming (Area B — resolves Open Decision #2)
- **D-29 (grugops everywhere; dash-standalone / colon-plugin; `skills/` form):** Two verified facts from inspecting the live install drive this (see `<code_context>`):
  - **Brand string is always `grugops`, never bare `grug`** — a deliberate **legal-surface reduction** (avoids shipping the bare "Grug" children's-book word as a command). This **supersedes the literal-`/grug` assumption** in `CLAUDE.md`/the brand manual.
  - **Standalone form = the on-brand primary surface (GSD-style):** ship thin pointer **skills** named literally `grugops`, `grugops-map`, `grugops-plan`, `grugops-ticket`, `grugops-gate`, `grugops-uat`, `grugops-release`, invoked with the **dash** (`/grugops-plan`). This is the exact mechanism GSD uses (`~/.claude/skills/gsd-*` user-scoped skills) — verified working on this machine.
  - **Plugin form = the versioned/marketplace surface:** plugin **name `grugops`** → commands read **`/grugops:plan`** (colon). The dash is genuinely **not selectable** in plugin form — Claude Code hard-codes `/<plugin>:<command>` namespacing (confirmed against the installed `superpowers` plugin). Accepted.
  - **Implementation = `skills/`** (not `commands/`): the forward path, supports supporting files, and — critically — `disable-model-invocation: true` on the destructive **`grugops-release`** so the agent can never auto-fire a release (ties into SAFE-02). Applies to both the plugin `skills/` and the standalone `.claude/skills/` surface for consistency. (User rejected `commands/`-flat and the `grug`-named plugin.)

### Single-source preservation under the plugin-cache landmine (Area C)
- **D-30 (Standalone wrappers: symlink with copy fallback):** Standalone `.claude/` wrappers **symlink** to `agent-factory/roles|workflows/*.md` for true single-source / zero drift. The installer **auto-detects** no-symlink environments (e.g. Windows without symlink privilege) and **falls back to copy**, marking those entries `verify` in the install report. Honors "never copies" wherever the OS allows; degrades safely where it can't. (User rejected always-symlink and pointer-text-only.)
- **D-31 (Plugin wrappers: repo-relative pointer-text — zero copies):** Because a marketplace-installed plugin is **copied to a cache** and `../agent-factory/roles/*.md` is **not** copied, the plugin's wrappers are **thin pointer-text** whose body says "read `agent-factory/roles/orchestrator.md`" — **resolved against the user's repo** where the kit lives (grugops "drops on top of" the repo). **No second copy exists anywhere** → single-source fully preserved. Consequence: **the plugin is a dispatch layer, not a standalone bundle** — it requires `agent-factory/` present in the repo (installed by the installer or the minimal-markdown path). **MUST be verified at the Phase-6 dogfood** (CLAUDE.md flags this as the open plugin-cache question). (User rejected build-time-generated bundle and skip-plugin-role-text.)

### SAFE-02 mechanical deploy guard (Area D)
- **D-32 (Config-driven match set + sane defaults):** The `PreToolUse` Bash matcher gates a **configurable** set of "production deploy" commands, shipping defaults for common prod-deploy verbs — `kubectl apply|rollout`, `helm upgrade|install`, `terraform apply`, `*deploy` (gcloud/aws/serverless/flyctl/`vercel --prod`), `npm publish`. The list is read from config (a deploy-guard field / derived from `environments`); per-project patterns are extended at build/bootstrap, never hardcoded to one stack. (User rejected fixed-curated-list and broad-deny-plus-allowlist.)
- **D-33 (Human-set session env var; fails closed; agent cannot self-approve):** The human-confirm signal is a **session environment variable** (e.g. `GRUGOPS_PROD_DEPLOY_APPROVED`) the human exports in the shell that launches Claude (or via settings env). The hook **denies** any matched deploy unless that var is present **in the hook's own process env**, **AND refuses any command that tries to set/`export` it inline** — so the agent cannot self-approve. **Fails closed.** Pairs with config `production_requires_human_confirmation: true`. This is "named human confirmation" rendered mechanically. (User rejected token-in-command and config-flag-only as agent-forgeable.)
- **D-34 (Pure-Node guard, JSON deny):** The guard is a **Node script** (reads stdin, `JSON.parse`) — **no `jq` dependency**, matching `install.mjs`'s existing Node and the boring-stack ethos; portable wherever Node runs. It blocks via **exit 0 + JSON `{permissionDecision: "deny", reason}`**, giving the agent a clear message ("prod deploy needs human approval; set `GRUGOPS_PROD_DEPLOY_APPROVED`"). Uses `${CLAUDE_PLUGIN_ROOT}` for its script path. (User rejected shell+jq variants.)
- **SAFE-02 documentation (required by the requirement itself):** the guard is **Claude-Code-only** (plugin hooks); the other four tools get the **`autonomy=pr` prompt-level fallback** — both facts MUST be documented (in `adapters.md` / `install/README.md` / a guard README). The guard lives in **plugin-level `hooks/hooks.json`** — **never** subagent frontmatter `hooks`/`mcpServers`/`permissionMode`, which plugin subagents silently ignore (STATE.md safety reminder).

### Locked to recommendation (not separately discussed — authorized by the user; reopen on request)
- **D-35 (PKG-01 adapters.md shape):** map the 5 tools → entry file + dispatch mode + adapter; Codex & OpenCode read root `AGENTS.md` natively (no adapter); Gemini via `settings.json` `context.fileName: ["AGENTS.md","GEMINI.md"]` (cleaner than a `GEMINI.md` pointer); Copilot reads `AGENTS.md` + optional `.github/copilot-instructions.md` pointer; Claude Code gets both the standalone `.claude/` form and the plugin form. Every row flagged "verify against current tool docs." Use `code.claude.com/docs/en/*` links (not the redirecting `docs.claude.com/...`).
- **D-36 (INSTALL behavior):** `install.sh`/`install.mjs` functionally identical; idempotent, additive, `DRY_RUN=1`, reversible; detect host tool, lay down the right adapter/entry file (symlink-with-copy-fallback per D-30), print an install report (created / linked / skipped / verify), never overwrite. `uninstall.sh` removes only the symlinks/pointer-lines the installer added (never `agent-factory/`, `plans/`, or user files). `install/README.md` documents the "just install the markdown" minimal path + the `/grugops install` self-bootstrap.
- **D-37 (Plugin structure hygiene):** components (`skills/`, `hooks/`) live at plugin **root**, never inside `.claude-plugin/` (the documented #1 plugin mistake). `.claude-plugin/` holds only `plugin.json` + `marketplace.json`. Run `claude plugin validate --strict` in/before CI.

### Claude's Discretion
- Exact `adapters.md` table columns/wording, and the exact text of the two packaging templates, as long as they use `Agent` (not `Task`), `model: inherit`, and cite frozen paths.
- The precise default deploy-command pattern list within D-32 (regex/glob form) and the exact config field name/location for the configurable set.
- The exact env-var name (`GRUGOPS_PROD_DEPLOY_APPROVED` is a placeholder) and the inline-set-refusal detection wording in the Node guard.
- Installer host-tool detection heuristics and install-report formatting; whether the standalone surface uses `.claude/skills/` or `.claude/commands/` for any given op (default `skills/` per D-29; the literal `/grugops` dispatcher may be either).
- The one-line `CLAUDE.md` pointer wording and whether to also drop a minimal `GEMINI.md` vs only the `settings.json` `context.fileName` route.
- Build/wave order of the deliverables (a planner concern); natural grouping: decisions/templates first (PKG) → standalone + plugin forms (CLAUDE) → guard (SAFE-02) → installers (INSTALL) → docs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The build contract + already-gathered research (authoritative for Phase-5 content)
- `docs/initial/agent_factory_builder_spec_v2.md` — THE specification. Phase-5-relevant: **§16 (packaging/adapters/distribution forms)**, the install-script requirements, the plugin/marketplace shape, and **§14 / safety** (the prod-deploy guard intent SAFE-02 makes mechanical). Reproduce what it fixes; verify tool-specifics against current docs.
- `CLAUDE.md` (repo root) **— the verified Technology Stack section is the primary Phase-5 reference.** It contains copy-paste-correct, HIGH-confidence schemas for `plugin.json`, `marketplace.json`, subagent frontmatter, slash-command/skill forms, the `PreToolUse` hook (matcher + `if:` + exit-2-vs-JSON-deny), per-tool AGENTS.md entry files, "Alternatives Considered," "What NOT to Use" (plugin-root rule, `Task`→`Agent`, plugin-cache `../` landmine, `docs.claude.com` redirect), "Stack Patterns by Variant," and "Open Questions / Flags." Treat as the de-facto research summary.
- `.planning/research/STACK.md` — the full stack research `CLAUDE.md` is distilled from (plugin/marketplace/hook/subagent/adapter details, sources).
- `.planning/research/SUMMARY.md` — research synthesis + the `[research]`-flagged spec corrections.
- `.planning/research/PITFALLS.md` — packaging/distribution failure modes to avoid.
- `docs/initial/grugops_brand_manual.md` — voice rules (always-lowercase `grugops`, clear voice for safety/install, light wink only in framing); §10.6 naming/version guidance; non-affiliation. **Note: this phase's D-29 supersedes its literal-`/grug` command assumption with `grugops`/`grugops-*`.**

### Frozen Phases 1–4 outputs the packaging wraps (do NOT redefine — pointer targets)
- `agent-factory/roles/orchestrator.md` + the other 15 `agent-factory/roles/*.md` — the canonical role text every standalone/plugin wrapper points at; the Orchestrator is the spawner where dispatch needs nesting (`settings.json` `agent:`).
- `agent-factory/workflows/*.md` (00–13) — the 14 workflow files wrappers/adapters reference; the entry rule "all work starts at `orchestrator.md`."
- `agent-factory/README.md` — "start here → `orchestrator.md`" + copy-paste Orchestrator prompts the adapters stay consistent with.
- `agent-factory/config/factory.config.json` (+ `.md` twin) — `autonomy` (the `=pr` fallback), `production_requires_human_confirmation` (the SAFE-02 config gate), `environments`, `mode` — read by the guard + documented in adapters.
- `agent-factory/VERSION` — canonical `0.1.0` (D-28).
- Root `AGENTS.md` — the portable substrate every tool reads; the entry point the per-tool adapters wire to (Gemini `context.fileName`, Copilot pointer, Codex/OpenCode native).

### Project planning context
- `.planning/ROADMAP.md` — Phase 5 goal + the 5 success criteria; the Phase-5 research flag.
- `.planning/REQUIREMENTS.md` — PKG-01/02, CLAUDE-01/02/03, INSTALL-01/02, SAFE-02 (the 8 Phase-5 requirements) + the **Open Decisions table** (version, command form) this phase resolves.
- `.planning/PROJECT.md` — Constraints (single-source/never-copies, safety-hard-mechanical, installers-idempotent, no-fabrication, brand, minimal) + Key Decisions table.
- `.planning/phases/03-roles-agents-md-substrate/03-CONTEXT.md` — D-20 (dispatch-neutrality, now activated), D-04 (shipped-kit identity), D-18 (`UNKNOWN - verify` command slots).
- `.planning/phases/04-workflows-cadence-backpressure/04-CONTEXT.md` — D-27 (SAFE-01 prose now → SAFE-02 mechanism here), D-26 (the gate the guard complements), the deferred-to-Phase-5 list.

### Live-install evidence (verified this session — use as the dispatch ground truth)
- `~/.claude/skills/gsd-*` — proof the **standalone/user-scoped dash mechanism** works: each skill dir is named literally `gsd-<op>` → `/gsd-<op>` with no colon. This is the model for `grugops-*` (D-29).
- `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/` (`plugin.json` name `superpowers`, `skills/` only) — proof the **plugin form forces `/<plugin>:<command>`** colon namespacing (D-29). Confirms the dash is unavailable in plugin form.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`CLAUDE.md` Technology Stack + `.planning/research/STACK.md`:** the plugin/marketplace/hook/adapter schemas are pre-verified and copy-paste-correct — assemble from these, don't re-research from scratch (still verify volatile tool facts at build time per the research flag).
- **Frozen Phases 1–4 files** (`agent-factory/roles/*` ×16, `agent-factory/workflows/*` ×14, `agent-factory/config/*`, `agent-factory/README.md`, root `AGENTS.md`, `agent-factory/VERSION`): every pointer target already exists and is frozen — Phase 5 only wires to them.
- **GSD's own install layout** (`~/.claude/skills/gsd-*`) and **superpowers' plugin** (`~/.claude/plugins/.../superpowers/`): live, working reference implementations of the two command-surface mechanisms grugops needs (dash-standalone, colon-plugin).
- **`install.mjs` Node baseline:** Node is already the install runtime → the SAFE-02 guard reuses it (pure-Node, no `jq`, D-34).

### Established Patterns
- **Single-source / never-copies (constraint → D-30/D-31):** symlink-with-fallback for standalone; repo-relative pointer-text for the plugin; zero physical duplicates of role/workflow text anywhere.
- **Dispatch-neutral core, dispatch-only-here (D-20 → activated):** all tool-specifics land in Phase 5; the frozen core stays portable.
- **Two-voice discipline (D-21/D-27):** clear voice for the guard, install report, safety docs; light grug wink only in framing prose.
- **Mechanical safety, fail-closed (D-33):** the guard denies by default and cannot be self-approved — "humans decide, agents execute" as code, not prose.
- **`UNKNOWN - verify`, never faked (D-18):** adapters flag every tool row "verify against current tool docs"; no fabricated commands or schemas.

### Integration Points
- `.claude-plugin/`, `.claude/` (agents/skills + commands), `install/`, `agent-factory/packaging/` currently hold only `.gitkeep`/`settings.local.json`; root `AGENTS.md` exists; no `GEMINI.md`/Copilot pointer yet. Phase 5 populates all of these **additively** — never touching `docs/`, `.planning/`, the frozen `agent-factory/` core, or user files.
- **Consumed by Phase 6:** the validator (VAL-01) checks packaging presence + `plugin.json` has a `name`; the dogfood (DOG-01/02) installs via `/grugops` on a throwaway repo and exercises **both** the portable AGENTS.md sequential path and the Claude Code sub-agent spawn path — **the decisive test of D-31's repo-relative plugin pointers** and "only the dispatch differs, never the content."

</code_context>

<specifics>
## Specific Ideas

- **The user changed a brand assumption deliberately and with reasoning:** use `grugops` (never bare `grug`) as the command/brand string to **reduce the children's-book "Grug" IP surface**, and prefer the **dash** shape `/grugops-plan`. When I flagged that Claude Code forces the colon in plugin form, the user verified from their own GSD/superpowers installs — which confirmed the mechanism (GSD = standalone dash; superpowers = plugin colon) and **unlocked delivering the dash shape via the standalone path**. Net: standalone is the on-brand dash surface; the plugin accepts `/grugops:*`. The user was "happy even if plugins still need `:`."
- **Posture continuity with a real exception:** the user again leaned on recommendations for version, single-source, and the guard — but the naming decision was a genuine user-driven override (legal-safety motivated), not a default-accept. Capture both: the recommendations are locked, and the `grugops`/dash naming is a firm user directive that supersedes the brand manual.
- **Safety was treated as first-class:** the user picked the **strongest, agent-unforgeable** confirm signal (human-set env var, fail-closed) over the simpler agent-bypassable options — consistent with "safety must be mechanical."

</specifics>

<deferred>
## Deferred Ideas

These belong to other phases — preserved, not actioned here. None are scope-creep from this discussion.

- **Brand-docs reconciliation of the naming change** — `README`/brand collateral must reflect the `grugops`/`grugops-*` command surface (dash standalone, colon plugin), NOT the literal `/grug` the brand manual assumed → Phase 6 (BRAND-01/02). The non-affiliation + grugbrain.dev attribution still ship.
- **Validator coverage of packaging** — `scripts/validate-agent-factory.mjs` checks packaging presence + any `plugin.json` has a `name` → Phase 6 (VAL-01).
- **The decisive dogfood verification of D-31** (plugin repo-relative pointer resolution against the user's repo) + dual-dispatch parity → Phase 6 (DOG-01/02). CLAUDE.md flags this as the open plugin-cache question.
- **Five example runs** narrating the finished flows → Phase 6 (EX-01).
- **Filling real gate/deploy commands** into a project's `AGENTS.md` `UNKNOWN - verify` slots and the guard's per-project pattern list → done per-project at bootstrap/runtime, never fabricated in the kit (D-18/D-32).

</deferred>

---

*Phase: 5-packaging-adapters-install-distribution*
*Context gathered: 2026-06-03*

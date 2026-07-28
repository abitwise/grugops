# Phase 5: Packaging, Adapters, Install & Distribution - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-03
**Phase:** 5-packaging-adapters-install-distribution
**Areas discussed:** Version string, Command form & /grugops, Single-source vs cache, SAFE-02 deploy guard

---

## Version string

### Q1 — Which version scheme should grugops ship under?

| Option | Description | Selected |
|--------|-------------|----------|
| 0.x (ship 0.1.0) | Keep seeded VERSION=0.1.0; SemVer 0.y.z latitude; brand-new public tool; lean rec | ✓ |
| 0.x, bump to 0.2.0 | Move off seeded value to mark the distribution milestone | |
| Adopt 2.0.0 | Spec continuity, but accepts MAJOR-break contract from day one | |

### Q2 — Where should the version live and how are plugin updates gated?

| Option | Description | Selected |
|--------|-------------|----------|
| VERSION + plugin.json, bump together | Canonical in VERSION, mirrored to plugin.json; omit from marketplace entry; predictable updates | ✓ |
| plugin.json only | Pin solely in plugin.json; splits "kit version" from "plugin version" | |
| Omit plugin version (git SHA) | Every commit = a new version; noisy | |

**User's choice:** 0.x (0.1.0); VERSION + plugin.json synced, omit from marketplace.
**Notes:** Resolves Open Decision #1. Consistent with Phase-1 D-02 ("final string is a Phase-5 decision").

---

## Command form & /grugops

### Q1 — How should the plugin /grug commands be implemented?

| Option | Description | Selected |
|--------|-------------|----------|
| skills/ (SKILL.md per op) | Forward path; supporting files; disable-model-invocation on release | ✓ |
| commands/ (flat .md) | Legacy-but-supported; simpler; no skill features | |
| Both skills/ + commands/ | More surface; usually unnecessary | |

### Q2 — Plugin name / command shape

| Option | Description | Selected |
|--------|-------------|----------|
| grug → /grug:plan | Closest plugin shape to literal /grug | |
| grugops → /grugops:plan | Explicit, longer | |
| **(Other — user free text)** | "Use grugops … to reduce legal issues from using only grug. Instead of ':' use '-' so /grugops-plan, /grugops-ticket" | ✓ |

**User's choice (free text):** Use `grugops` everywhere (never bare `grug`) for legal-surface reduction; prefer the dash shape `/grugops-plan`.
**Notes:** I flagged that Claude Code forces the colon (`/<plugin>:<command>`) in plugin form. The user pushed back citing their GSD/superpowers installs. I **verified against the live install**: GSD = standalone user-scoped skills named `gsd-*` → dash, no colon; superpowers = plugin → `superpowers:*` colon. This **confirmed** the mechanism and **unlocked** delivering the dash via the standalone path. Resolution: standalone = GSD-style `grugops-*` dash skills (`/grugops-plan`); plugin name `grugops` → `/grugops:plan` (colon accepted). User: "happy even if plugins still need ':'." `disable-model-invocation:true` on `grugops-release`. Supersedes the brand manual's literal-`/grug` assumption.

---

## Single-source vs cache

### Q1 — How should standalone .claude/ wrappers reference canonical role/workflow text?

| Option | Description | Selected |
|--------|-------------|----------|
| Symlink, copy fallback | Symlink for single-source; installer auto-detects no-symlink env and copies with a verify note | ✓ |
| Always symlink | Pure single-source; breaks on Windows-no-privilege | |
| Pointer text, no symlink | Wrapper body references the path; host agent opens the real file | |

### Q2 — How should the PLUGIN's wrappers reach canonical role text under the plugin-cache landmine?

| Option | Description | Selected |
|--------|-------------|----------|
| Repo-relative pointers | Pointer-text resolved against the user's repo; zero copies; plugin is a dispatch layer; verify at dogfood | ✓ |
| Build-time generated bundle | Self-contained plugin; role text ships twice; needs generator + CI drift check | |
| Skip plugin role-text | Plugin = commands + hooks only; assumes kit already installed | |

**User's choice:** Standalone = symlink with copy fallback; Plugin = repo-relative pointer-text (no copies).
**Notes:** Honors "adapters are thin pointers, never copies" in both forms. Plugin requires `agent-factory/` present in the repo — MUST be verified at the Phase-6 dogfood (CLAUDE.md open question).

---

## SAFE-02 deploy guard

### Q1 — What command set should the PreToolUse hook gate as "production deploy"?

| Option | Description | Selected |
|--------|-------------|----------|
| Config-driven + sane defaults | Configurable list + defaults (kubectl/helm/terraform/*deploy/publish); per-project extend | ✓ |
| Fixed curated list | Hardcoded; simpler; can't adapt to a project's real deploy command | |
| Broad deny + allowlist | Fails closed but noisy; human maintains allowlist | |

### Q2 — What is the human-confirm signal (must be agent-unforgeable)?

| Option | Description | Selected |
|--------|-------------|----------|
| Human-set session env var | Exported by the human; hook denies unless present in its own env AND refuses inline set; fails closed | ✓ |
| Approval token in command | Human appends a token; only safe if it's a secret the agent can't derive | |
| Config flag only | Static project setting; agent can edit config; doesn't prove per-deploy consent | |

### Q3 — Guard implementation (parsing + block method)?

| Option | Description | Selected |
|--------|-------------|----------|
| Pure-Node, JSON deny | No jq dependency (matches install.mjs); JSON deny + reason message | ✓ |
| Shell + jq, JSON deny | Adds jq dependency; same structured deny | |
| Shell + jq, exit 2 | Simplest; bare stderr; still needs jq | |

**User's choice:** Config-driven match set + sane defaults; human-set session env var (fail-closed, agent can't self-approve); pure-Node guard with JSON deny.
**Notes:** Strongest, agent-unforgeable confirm signal chosen over simpler bypassable options. Guard is Claude-Code-only (plugin hooks); the other four tools get the `autonomy=pr` prompt-level fallback — both must be documented. Guard lives in plugin-level `hooks/hooks.json`, never subagent frontmatter.

---

## Claude's Discretion

- adapters.md table columns/wording; the two packaging templates' exact text (must use `Agent` not `Task`, `model: inherit`).
- Default deploy-command pattern list form + config field name/location; exact env-var name + inline-set-refusal wording.
- Installer host-tool detection heuristics + install-report formatting; `.claude/skills/` vs `.claude/commands/` for the literal `/grugops` dispatcher.
- One-line CLAUDE.md pointer wording; GEMINI.md vs `settings.json context.fileName` route.
- Build/wave order of deliverables.

## Deferred Ideas

- Brand-docs reconciliation of the `grugops`/`grugops-*` naming change → Phase 6 (BRAND).
- Validator packaging coverage → Phase 6 (VAL-01).
- Dogfood verification of D-31 plugin repo-relative pointers + dual-dispatch parity → Phase 6 (DOG-01/02).
- Five example runs → Phase 6 (EX-01).
- Filling real gate/deploy commands per-project at bootstrap → runtime, never fabricated in the kit.

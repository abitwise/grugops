# Phase 05: Packaging, Adapters, Install & Distribution - Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 21 (new/modified)
**Analogs found:** 7 with an in-repo analog / 21 total (14 are net-new artifact types with no in-repo analog — use 05-RESEARCH.md examples)

> **Grounding (read first).** This phase WRAPS a frozen markdown core. The richest in-repo
> analogs are the frozen Phase 1–4 outputs (`agent-factory/roles/*.md`,
> `agent-factory/workflows/*.md`, `agent-factory/config/factory.config.json`, root `AGENTS.md`,
> `agent-factory/README.md`, `agent-factory/VERSION`) — these are the **pointer targets** the
> wrappers/adapters point AT, and the **voice/shape** the new markdown stays consistent with.
> The Phase-3/4 `check-structure.sh` is the analog for any Phase-5 structural-test extension.
> The NEW Claude-Code artifact types (`plugin.json`, `marketplace.json`, skill `SKILL.md`,
> `hooks.json`, the Node guard, the installers) have **NO in-repo analog** — the `.claude-plugin/`,
> `.claude/`, `install/`, and `agent-factory/packaging/` dirs hold only `.gitkeep`. For those, the
> authoritative templates are the copy-paste-correct examples in `05-RESEARCH.md` §Architecture
> Patterns (Patterns 1–6) plus the **live external references** verified this session:
> `~/.claude/skills/gsd-*` (dash-standalone) and
> `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/` (colon-plugin). Per the
> project's no-fabrication constraint, files marked **`no in-repo analog — use RESEARCH.md`** must
> NOT have a weak in-repo analog invented for them.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `agent-factory/packaging/adapters.md` | config (doc map) | transform (5 tools → entry/dispatch) | `agent-factory/README.md` §"Usage across the five tools" | role-match (in-repo) |
| `agent-factory/packaging/subagent.frontmatter.md` | template | transform (role → wrapper) | `agent-factory/roles/orchestrator.md` (frontmatter + body it points at) | role-match (in-repo) |
| `agent-factory/packaging/slash-command.template.md` | template | transform (op → skill) | `~/.claude/skills/gsd-plan-phase/SKILL.md` (live) | exact (external) |
| `.claude/skills/grugops/SKILL.md` (+ `-map/-plan/-ticket/-gate/-uat`) | route (skill) | request-response | `~/.claude/skills/gsd-*/SKILL.md` (live) | exact (external) |
| `.claude/skills/grugops-release/SKILL.md` | route (skill, destructive) | request-response | `~/.claude/skills/gsd-*` + `disable-model-invocation` (RESEARCH Pattern 3) | exact (external) |
| `.claude/agents/grugops-orchestrator.md` (optional, per discretion) | route (subagent wrapper) | request-response | `agent-factory/roles/orchestrator.md` (pointer target) | role-match (in-repo) |
| `CLAUDE.md` one-line pointer (user-repo root) | config | request-response | `AGENTS.md` "All work starts with the Orchestrator" line | role-match (in-repo) |
| `.gemini/settings.json` | config | request-response | `agent-factory/config/factory.config.json` (JSON additive-merge shape) | partial (in-repo) |
| `.claude-plugin/plugin.json` | config (manifest) | n/a | superpowers `plugin.json` (live) | exact (external) |
| `.claude-plugin/marketplace.json` | config (catalog) | n/a | superpowers `marketplace.json` (live) | exact (external) |
| `skills/<op>/SKILL.md` ×7 (plugin root) | route (skill) | request-response | superpowers `skills/*/` + RESEARCH Pattern 3 | exact (external) |
| `hooks/hooks.json` | middleware (hook) | event-driven (PreToolUse) | superpowers `hooks/hooks.json` (live) | role-match (external) |
| `hooks/guard.mjs` | middleware (guard) | event-driven / transform (stdin→deny JSON) | RESEARCH Pattern 5 (no in-repo analog) | no in-repo analog |
| `install/install.sh` | utility (installer) | file-I/O / batch | RESEARCH §Code Examples (ensure_line, link_or_copy) | no in-repo analog |
| `install/install.mjs` | utility (installer) | file-I/O / batch | `install.sh` (sibling) + RESEARCH | no in-repo analog |
| `install/uninstall.sh` | utility | file-I/O / batch | `install.sh` (inverse) | no in-repo analog |
| `install/README.md` | config (doc) | — | `agent-factory/README.md` §Install | role-match (in-repo) |
| Phase-5 `check-structure.sh` extension (test harness) | test | batch (assert) | `.planning/phases/04-.../check-structure.sh` | exact (in-repo) |

## Pattern Assignments

### `agent-factory/packaging/adapters.md` (config doc, transform) — PKG-01

**Analog:** `agent-factory/README.md` (in-repo, role-match). The README already carries a 5-tool
table and the exact slogan the adapter must restate. **Copy the table shape and the slogan; do
NOT copy role text.** Note the README's CC row says "native sub-agents" / "CLAUDE.md" and predates
D-29 — `adapters.md` is the authoritative, current version (dash standalone + colon plugin, every
row flagged "verify").

**The slogan to restate verbatim** (`agent-factory/README.md` lines 34–36 & 48–49):
```
only the dispatch differs, never the content.
```
```
Same roles, same handoffs, same gates — only the dispatch differs.
```

**The 5-tool table shape to mirror** (`agent-factory/README.md` lines 38–44):
```markdown
| Tool                  | Entry file it reads                              | Role dispatch                                            |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Claude Code**       | `CLAUDE.md` (+ portable `AGENTS.md`, Phase 3)    | Native sub-agents — the Orchestrator spawns role agents  |
| **Codex CLI**         | `AGENTS.md` (root + nested, global)              | Sequential role-load — no spawn                          |
```
**For the current per-tool wiring** (Gemini `context.fileName`, Codex/OpenCode native, Copilot
optional pointer, Claude both forms) and the `code.claude.com/docs/en/*` links + "verify against
current tool docs" flags, use `05-RESEARCH.md` §Architecture Patterns → **Pattern 6** and the
§Architectural Responsibility Map. The entry-rule "all work starts at `orchestrator.md`" is stated
in both `AGENTS.md` line 9 and `agent-factory/README.md` line 15 — restate it.

**Entry-rule sentence to restate** (`AGENTS.md` line 9):
```
All work starts with the Orchestrator: `agent-factory/roles/orchestrator.md`.
```

---

### `agent-factory/packaging/subagent.frontmatter.md` (template, transform) — PKG-02

**Analog:** `agent-factory/roles/orchestrator.md` (in-repo — the pointer TARGET) for the body, and
`05-RESEARCH.md` Pattern 4 for the exact frontmatter (no in-repo subagent file exists yet).

**Frontmatter pattern of the frozen role it wraps** (`agent-factory/roles/orchestrator.md` lines 1–5):
```yaml
---
kind: role
tier: core
---
# Role: Orchestrator
```
The wrapper does NOT copy the role body — it points at it. The hard-limits line the wrapper must
echo in clear voice is `orchestrator.md` line 119:
```
Never merge to a protected branch. Never deploy to prod. Never exceed WIP without a written reason.
```

**Template frontmatter to author** (from `05-RESEARCH.md` Pattern 4 — use `Agent` not `Task`,
`model: inherit`, pointer body citing the frozen path):
```yaml
---
name: grugops-orchestrator
description: Single entry point for the software factory. Use for any SDLC delivery request...
tools: Read, Grep, Glob, Bash, Edit, Write, Agent
model: inherit
---
You follow `agent-factory/roles/orchestrator.md` exactly. Read it now, then ...
```
**`Agent` vs `Task` is load-bearing** (`Task` renamed v2.1.63; CLAUDE.md §"What NOT to Use" forbids
`Task`). PKG-02 test greps for `Agent` present AND `Task` absent.

---

### `agent-factory/packaging/slash-command.template.md` (template, transform) — PKG-02

**Analog:** `~/.claude/skills/gsd-plan-phase/SKILL.md` (live, exact). This is the working dash-skill
shape grugops mirrors. Verified frontmatter (read this session):
```yaml
---
name: gsd-plan-phase
description: "Create detailed phase plan (PLAN.md) with verification loop"
argument-hint: "[phase] [--auto] ..."
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
---
```
**Copy this frontmatter shape** (`name`, `description`, `argument-hint`, `allowed-tools` list,
`Agent` in the tool list). For the grugops body (pointer-text → `orchestrator.md`, repo-relative)
and the dash-vs-colon naming asymmetry, use `05-RESEARCH.md` **Pattern 3** + Pitfall 5.

---

### `.claude/skills/grugops*/SKILL.md` ×7 (route/skill, request-response) — CLAUDE-01

**Analog:** `~/.claude/skills/gsd-*/SKILL.md` (live, **exact**). Verified this session: each skill
dir is named literally `gsd-<op>` → invoked `/gsd-<op>` (DASH, no colon). **This is the exact
mechanism grugops mirrors** — standalone dirs carry the full `grugops-` prefix:
`grugops`, `grugops-map`, `grugops-plan`, `grugops-ticket`, `grugops-gate`, `grugops-uat`,
`grugops-release`.

- **Frontmatter:** copy the GSD `name`/`description`/`argument-hint`/`allowed-tools` shape above.
- **Body:** thin pointer-text per `05-RESEARCH.md` Pattern 3 — "read `agent-factory/roles/orchestrator.md`,
  then config, AGENTS.md, board; run workflow `<NN-...md>`. Request: $ARGUMENTS". **Never copy role
  body** (CLAUDE-01 dup-check greps a distinctive role sentence → expect 0 hits in skills).
- **`grugops-release` adds one line** — `disable-model-invocation: true` (RESEARCH Pattern 3) — so
  the agent can never auto-fire a release (ties to SAFE-02). It maps to
  `agent-factory/roles/release-manager.md` whose hard limit (line 49) is "Deploy only after a
  named human approves" — the destructive op the disable protects.
- **Bodies symlink to the frozen role/workflow files where the OS allows, copy-fallback otherwise**
  (D-30) — see Shared Pattern "Symlink-with-copy-fallback".

---

### `.claude-plugin/plugin.json` (config manifest) — CLAUDE-02 / CLAUDE-03

**Analog:** superpowers `plugin.json` (live, **exact**). Verified this session — it carries
**NO component-path keys** (`skills`/`hooks`/`agents`), relying on root auto-discovery, exactly as
RESEARCH predicts:
```json
{
  "name": "superpowers",
  "description": "Core skills library for Claude Code: ...",
  "version": "5.1.0",
  "author": { "name": "Jesse Vincent", "email": "jesse@fsck.com" },
  "homepage": "...", "repository": "...", "license": "MIT",
  "keywords": ["skills","tdd","debugging","collaboration","best-practices","workflows"]
}
```
**Author the grugops manifest from `05-RESEARCH.md` Pattern 1**: `name: grugops` (the namespace →
`/grugops:<cmd>`), `version: "0.1.0"` mirroring `agent-factory/VERSION` (confirmed `0.1.0` —
D-28), NO component keys. The `version` string MUST equal `agent-factory/VERSION`:
```
agent-factory/VERSION → 0.1.0
agent-factory/config/factory.config.json line 2 → "version": "0.1.0"
```
Both already carry `0.1.0`; the plugin must match and the three bump together per release.

---

### `.claude-plugin/marketplace.json` (config catalog) — CLAUDE-02

**Analog:** superpowers `marketplace.json` (live, exact — present in its `.claude-plugin/`).
**Author from `05-RESEARCH.md` Pattern 2**: required `name`+`owner.name`+`plugins[]`; entry
`name: grugops`, `source: "./"`; **NO `version` key** in the entry (D-28 — plugin.json wins;
validator flags a mismatch). Heed the top-level `description` strict-mode caveat (RESEARCH Open
Question 2): omit it or place under `metadata`; let `claude plugin validate --strict` be
authoritative.

---

### `skills/<op>/SKILL.md` ×7 (plugin root, route/skill) — CLAUDE-02 / D-37

**Analog:** superpowers `skills/` (live — confirms skills live at **plugin root**, not inside
`.claude-plugin/`). **Naming asymmetry is load-bearing** (RESEARCH Pattern 3 + Pitfall 5): plugin
dirs are named `plan`, `map`, `ticket`, `gate`, `uat`, `release`, `grugops` (the plugin name
supplies the `grugops:` prefix → `/grugops:plan`). Same pointer-text body and
`disable-model-invocation` on `release` as the standalone set. Body is **repo-relative pointer-text**
(D-31 — never `../agent-factory/...`, broken in cache).

---

### `hooks/hooks.json` (middleware/hook, event-driven) — SAFE-02 / CLAUDE-03

**Analog:** superpowers `hooks/hooks.json` (live, role-match). Verified shape — `${CLAUDE_PLUGIN_ROOT}`
script path, `type: command`:
```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "startup|clear|compact",
        "hooks": [ { "type": "command",
          "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start", "async": false } ] }
    ]
  }
}
```
**Copy the structure** (the `${CLAUDE_PLUGIN_ROOT}`-relative command — CLAUDE-03 greps for it and
forbids hardcoded `/Users/`/`/home/` paths), but **change the event to `PreToolUse`, matcher to
`Bash`, and the command to `node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs"`** per `05-RESEARCH.md`
**Pattern 5**. Lives at plugin **root** `hooks/` (D-37). MUST NOT be placed in subagent frontmatter
(silently ignored — RESEARCH Pitfall 3).

---

### `hooks/guard.mjs` (middleware/guard, event-driven) — SAFE-02 / D-32/33/34

**`no in-repo analog — use RESEARCH.md example`** (the `hooks/`, `.claude-plugin/` dirs hold only
`.gitkeep`). The authoritative template is `05-RESEARCH.md` **Pattern 5** (pure-Node, reads stdin,
`JSON.parse`, deny-JSON, env-var check, inline-self-set refusal — copy-paste-correct).

**Config the guard reads** (`agent-factory/config/factory.config.json` lines 44–45 — in-repo):
```json
"environments": ["dev", "staging", "prod"],
"production_requires_human_confirmation": true,
```
The guard pairs with `production_requires_human_confirmation: true` and derives/extends its
deploy-pattern set from config per D-32. Default pattern set + `GRUGOPS_PROD_DEPLOY_APPROVED`
env-var name + inline-set-refusal wording are Claude's discretion (RESEARCH Assumptions A2/A4).
Voice: **clear professional English** in the deny `reason` string (RESEARCH Pitfall 6).

---

### `install/install.sh` (utility/installer, file-I/O batch) — INSTALL-01

**`no in-repo analog — use RESEARCH.md example`** (`install/` holds only `.gitkeep`). The
authoritative snippets are `05-RESEARCH.md` §Code Examples:
```sh
ensure_line() {  # idempotent append-if-missing
  [ -f "$1" ] || : > "$1"
  grep -qF -- "$2" "$1" || printf '%s\n' "$2" >> "$1"
}
link_or_copy() {  # D-30 symlink-with-copy-fallback → "linked" | "copied(verify)"
  if ln -sf -- "$1" "$2" 2>/dev/null && [ -L "$2" ]; then echo linked
  else cp -f -- "$1" "$2"; echo "copied(verify)"; fi
}
```
**Secondary in-repo style analog for POSIX-sh discipline:** the Phase-3/4 `check-structure.sh`
already establishes the house POSIX style this repo uses — `#!/usr/bin/env sh`, `set -eu`, small
named helpers, `printf` (never `echo -e`), `grep -qF` for fixed-string idempotency. **Match that
style** (see Shared Pattern "POSIX-sh house style"). The Installer ROLE's contract
(`agent-factory/roles/installer.md` lines 29–32, 43–44) names the behavior the script implements:
detect host tool, lay down adapter additively, support dry-run + uninstall, never overwrite,
`UNKNOWN - verify`. Honor `DRY_RUN=1`, idempotent re-run (zero diff), install report
(created/linked/skipped/verify).

---

### `install/install.mjs` (utility/installer, file-I/O batch) — INSTALL-01

**`no in-repo analog — use RESEARCH.md example`**. **Functionally identical** to `install.sh`
(D-36) — same detection, same additive ensure-line + symlink-with-copy-fallback, same DRY_RUN,
same report. Node `node:fs`/`node:path` ESM stdlib only, **no deps, no `package.json` with runtime
deps** (RESEARCH §Package Legitimacy Audit; CLAUDE.md "Reject any dependency beyond Node's stdlib").
The `install.sh` sibling is its behavioral spec.

---

### `install/uninstall.sh` (utility, file-I/O batch) — INSTALL-02

**`no in-repo analog — use RESEARCH.md example`**. The **inverse** of `install.sh`: removes ONLY
the symlinks/pointer-lines/JSON keys the installer added; **never** touches `agent-factory/`,
`plans/`, or user files (RESEARCH §Runtime State Inventory; Installer role hard limit
`installer.md` line 44 "Never overwrite or delete user content"). INSTALL-02 test: `install` then
`uninstall` → `git status` clean, `agent-factory/` present.

---

### `install/README.md` (config doc) — INSTALL-02

**Analog:** `agent-factory/README.md` §Install (in-repo, lines 114–128, role-match). It already
states the "just install the markdown" minimal path in the exact voice to mirror:
```
The minimal "just install the markdown" path works for any tool: copy the portable
`AGENTS.md` ... and the `agent-factory/` folder into your repo, then tell the
agent "start at `agent-factory/roles/orchestrator.md`."
```
**Restate and extend** with the scripted path + `/grugops install` self-bootstrap + the
SAFE-02 doc (guard is Claude-only; the other 4 tools get the `autonomy=pr` fallback — RESEARCH
§user_constraints "SAFE-02 docs"). Install commands flagged `UNKNOWN - verify` where tool-specific.

---

### Phase-5 `check-structure.sh` extension (test harness, batch) — all reqs

**Analog:** `.planning/phases/04-workflows-cadence-backpressure/check-structure.sh` (in-repo,
**exact**). This is THE structural-test pattern to extend (V-01..V-13). Copy its skeleton verbatim:
```sh
#!/usr/bin/env sh
set -eu
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
# ... per-check grep/wc/test asserts ...
if [ "$FAILS" -eq 0 ]; then printf 'ALL CHECKS PASSED\n'; exit 0
else printf '%s CHECK(S) FAILED\n' "$FAILS"; exit 1; fi
```
Header convention (Phase-4 lines 1–20): document that the real Node validator is Phase-6/VAL-01 and
intentionally `UNKNOWN - verify` — **do NOT fabricate `node scripts/validate-agent-factory.mjs`**.
The Phase-5 checks to add are the `05-RESEARCH.md` §Validation Architecture → Phase Requirements →
Test Map rows (PKG-01/02, CLAUDE-01/02/03, INSTALL-01/02, SAFE-02), plus the guard behavioral triad
(deny / allow / refuse-self-set) and `claude plugin validate --strict`.

## Shared Patterns

### POSIX-sh house style
**Source:** `.planning/phases/04-workflows-cadence-backpressure/check-structure.sh` lines 1–29
**Apply to:** `install/install.sh`, `install/uninstall.sh`, the Phase-5 test harness
```sh
#!/usr/bin/env sh
set -eu
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
# fixed-string idempotency: grep -qF -- "$line" "$file" || printf '%s\n' "$line" >> "$file"
```
`#!/usr/bin/env sh`, `set -eu`, small named helpers, `printf` not `echo -e`, `grep -qF` for
fixed-string matching. This is the established repo convention for every shell script.

### Symlink-with-copy-fallback (D-30)
**Source:** `05-RESEARCH.md` §Code Examples (no in-repo analog)
**Apply to:** the standalone `.claude/skills/` bodies and any installer that lays down a wrapper
```sh
link_or_copy() {   # returns "linked" | "copied(verify)"
  if ln -sf -- "$1" "$2" 2>/dev/null && [ -L "$2" ]; then echo linked
  else cp -f -- "$1" "$2"; echo "copied(verify)"; fi
}
```
Honors single-source where the OS allows; degrades safely (marks `verify` in the report) where it
can't.

### `${CLAUDE_PLUGIN_ROOT}`-relative paths (CLAUDE-03)
**Source:** superpowers `hooks/hooks.json` (live)
**Apply to:** `hooks/hooks.json`, any bundled plugin script
```json
"command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs\""
```
Never hardcode `/Users/`/`/home/` paths (CLAUDE-03 greps to forbid them); the plugin dir path
changes on update — treat as ephemeral.

### Repo-relative pointer-text, never copies (D-31, single-source)
**Source:** `AGENTS.md` line 9 + `agent-factory/README.md` line 15 (the in-repo entry-rule), `05-RESEARCH.md` Pitfall 2
**Apply to:** every plugin skill body, every standalone skill/subagent body
```
read `agent-factory/roles/orchestrator.md`   ← resolved against the USER's repo cwd
```
Never a filesystem `../agent-factory/...` path (broken in the plugin cache) and never a copy of the
role body (greps for a distinctive role sentence must return exactly one file — the frozen role).

### Config-driven, fail-closed safety (D-32/33)
**Source:** `agent-factory/config/factory.config.json` lines 44–45 (in-repo) + `05-RESEARCH.md` Pattern 5
**Apply to:** `hooks/guard.mjs`
```json
"environments": ["dev", "staging", "prod"],
"production_requires_human_confirmation": true
```
The guard reads config, denies matched deploys unless the human-set env var is present in its own
`process.env`, and refuses any command that inline-sets the var. Fails closed.

### Two-voice discipline (D-21/D-27)
**Source:** `agent-factory/roles/orchestrator.md` (caveman prompt + clear-voice hard limits) — the in-repo model
**Apply to:** all Phase-5 markdown
Clear professional English for the guard deny string, the install report, and all safety/install/guard
docs. Light grug wink only in framing prose. The frozen roles model both voices: a fenced `## Caveman
prompt` block + a clear-voice `## Hard limits` section (`orchestrator.md` lines 10–23 vs 118–121).

### No-fabrication (`UNKNOWN - verify`)
**Source:** `AGENTS.md` lines 26–28; Phase-3/4 harness headers
**Apply to:** `adapters.md` (every tool row flagged "verify against current tool docs"),
`install/README.md` (tool-specific commands), the test harness (never invent
`node scripts/validate-agent-factory.mjs`). Always lowercase `grugops`; cite
`code.claude.com/docs/en/*`, never `docs.claude.com`.

## No Analog Found

Net-new artifact types with NO in-repo analog (the `.claude-plugin/`, `.claude/`, `install/`,
`hooks/` dirs hold only `.gitkeep`). Planner uses the cited `05-RESEARCH.md` example as the
authoritative template — do NOT invent a weak in-repo analog (no-fabrication constraint).

| File | Role | Data Flow | Authoritative Template (use instead) |
|------|------|-----------|--------------------------------------|
| `hooks/guard.mjs` | middleware (guard) | event-driven | `05-RESEARCH.md` Pattern 5 (pure-Node deny-JSON guard) |
| `install/install.sh` | utility (installer) | file-I/O batch | `05-RESEARCH.md` §Code Examples (`ensure_line`, `link_or_copy`) + POSIX house style |
| `install/install.mjs` | utility (installer) | file-I/O batch | `05-RESEARCH.md` (functionally identical to `install.sh`; Node stdlib only) |
| `install/uninstall.sh` | utility | file-I/O batch | `05-RESEARCH.md` §Runtime State Inventory (inverse of `install.sh`) |
| `hooks/hooks.json` | middleware (hook) | event-driven | `05-RESEARCH.md` Pattern 5 (structure cloned from superpowers, event = PreToolUse) |
| `.claude-plugin/plugin.json` | config manifest | n/a | `05-RESEARCH.md` Pattern 1 (live superpowers confirms no-component-keys) |
| `.claude-plugin/marketplace.json` | config catalog | n/a | `05-RESEARCH.md` Pattern 2 (live superpowers confirms shape) |
| `skills/<op>/SKILL.md` (plugin) | route (skill) | request-response | `05-RESEARCH.md` Pattern 3 (live gsd-* + superpowers confirm) |
| `.gemini/settings.json` | config | request-response | `05-RESEARCH.md` Pattern 6 (`context.fileName` array) |

> External live references (verified this session, used as templates above): GSD dash skills at
> `~/.claude/skills/gsd-*/SKILL.md`; the superpowers colon-plugin at
> `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/`
> (`.claude-plugin/{plugin.json,marketplace.json}`, root `skills/` + `hooks/hooks.json` with
> `${CLAUDE_PLUGIN_ROOT}`, and an `AGENTS.md`/`CLAUDE.md`/`GEMINI.md` adapter set).

## Metadata

**Analog search scope:** `agent-factory/roles/`, `agent-factory/workflows/`, `agent-factory/config/`,
`agent-factory/README.md`, root `AGENTS.md`, `agent-factory/VERSION`, `.planning/phases/03-*` &
`04-*` `check-structure.sh`; live `~/.claude/skills/gsd-*` and the superpowers plugin cache.
**Files scanned:** 16 role files (listed), 14 workflow files (listed), config JSON+MD, 2 harness
scripts (read), root AGENTS.md, README, VERSION; live GSD skill frontmatter + superpowers
`plugin.json`/`hooks.json`/layout.
**Pattern extraction date:** 2026-06-03
**Note:** `.claude-plugin/`, `.claude/` (skills/agents), `install/`, `agent-factory/packaging/`,
`hooks/` are currently empty (`.gitkeep` only) — Phase 5 populates them additively.

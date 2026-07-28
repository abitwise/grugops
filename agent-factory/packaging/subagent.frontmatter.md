---
kind: packaging
tier: core
---
# Template: Claude Code sub-agent adapter

grug keep adapter thin. adapter point at role file, role file do the thinking. one copy,
no drift.

This is the single upstream source for every Claude Code sub-agent adapter
(`.claude/agents/grugops-<role>.md`). The adapter generator is built from **this file** — it
reads the kit's role set, the `capabilities:` key on each role, and the two body shapes
below, then emits one adapter per role. Nothing here is copied by hand, and no adapter body
is authored anywhere else. Fix one shape, fix every adapter.

Adapters are **pointer-text only**: each tells the agent to read the frozen role file and act
as that role. None copies the role body. The adapter sets `model: inherit` so it keeps the
user's session model choice.

There are exactly two shapes: a **specialist** adapter (16 of them) and the **coordinator**
adapter (one — the orchestrator). Only the coordinator carries the `coordinator: true` marker
and the enumerated spawn grant; a specialist never spawns, so `Agent` is omitted from its
`tools` entirely, which is the vendor-documented way to keep a sub-agent from spawning on
every path.

## The specialist adapter

Frontmatter (`<role>` is the role filename stem; `description` derives from the role's
`## One job` first sentence plus its `## Activates when` line; `tools` derives from the
role's `capabilities:` key through the mapping table below):

```markdown
---
name: grugops-<role>
description: <One job first sentence> Use when: <Activates when>.
tools: Read, Grep, Glob, Edit, Write, Bash
model: inherit
---
```

Body — this is the whole of it, and it is identical for all sixteen specialists apart from
the one role path:

```markdown
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Resolve the kit root (this adapter is the sole resolver):

```sh
# 1. (installed) the absolute kit path the installer wrote above this line.
# 2. if absent, self-heal:
KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
# 3. if "$KIT" still does not exist: STOP. Print:
#    "grugops kit not found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit."
#    Do NOT hunt the repo for agent-factory/… .
```

Read `agent-factory/roles/<role>.md` now and act as that role. The role file does the
thinking; this adapter only points at it.

Publish your typed notes per `agent-factory/workflows/16-context-read-write.md`. The shared verified context is the only memory — read what earlier roles published, publish your own, and expect nothing to have been passed to you by whoever activated you.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and
deploy.
```

That is the complete list: the invariant blockquote, the resolver block, "read one named role
file and act as that role", the memory sentence, and the echoed hard limit. **Nothing
role-specific** — no read order, no routing, no responsibilities. The factory read order
(`.grugops/factory.config.json`, `AGENTS.md`, `plans/board.md`) belongs to the coordinator
alone and is deliberately not duplicated into sixteen adapters.

## The coordinator adapter

Exactly one adapter — the orchestrator's — is the coordinator. It carries the
`coordinator: true` marker plus an enumerated, least-privilege spawn grant naming only the
specialist adapters it may schedule (never a broad unparenthesized grant). Its frontmatter:

```markdown
---
name: grugops-orchestrator
description: Single entry point for the grugops software factory. Use for any SDLC delivery request — bootstrap a repo, turn ideas into tickets, implement a ticket, run a quality gate, plan UAT, cut a release. Routes to the specialist factory roles.
coordinator: true
tools: Agent(grugops-software-engineer, grugops-qe-e2e, …the other 14 specialist adapters…), Read, Grep, Glob, Edit, Write, Bash
model: inherit
---
```

Body — everything the specialist body carries, plus the factory read order, plus the tier
announcement:

```markdown
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Resolve the kit root (this adapter is the sole resolver):

```sh
# 1. (installed) the absolute kit path the installer wrote above this line.
# 2. if absent, self-heal:
KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
# 3. if "$KIT" still does not exist: STOP. Print:
#    "grugops kit not found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit."
#    Do NOT hunt the repo for agent-factory/… .
```

Read `agent-factory/roles/orchestrator.md` now, then `.grugops/factory.config.json`, the root
`AGENTS.md` and `plans/board.md` (respect every WIP limit), and act as that role.

Require typed notes per Workflow 16. The shared verified context is the only memory — never relay data between agents.

**Announce your tier before scheduling.** Pick it by whether the `Agent` tool is available to
you — capability-sensing, never a host name or version. Never spawn under an allowlist the
runtime ignores, and never claim an enforcement you lack.

- **Full** — started with `claude --agent grugops-orchestrator`: this agent is the main
  thread. Schedule in parallel to `queue.wip_limit`; the enumerated grant above **is**
  runtime-enforced, on this path only.
- **Reduced** — `Agent` is available but the session is a default main thread, what `/grug`
  gets. Schedule in parallel to the same cap. The grant is **not** runtime-enforced here —
  this session's agent declares no allowlist. Say so, and stay inside it by instruction.
- **Degraded** — `Agent` is absent (the four non-Claude-Code CLIs, or a sub-agent at the
  nesting limit). Drain the same queue at concurrency one via
  `agent-factory/roles/_role-switch-protocol.md` — one window, prior context dropped between
  roles — and announce it.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.
```

The three tiers are stated in clear professional voice because they are a capability and
safety surface: a user reading the announcement must be able to tell what is enforced and
what is only promised. The `/grug` skill entry runs in a default main-thread session, which
already has the `Agent` tool — so it spawns, and the honest thing to report there is
"parallel, grant not enforced", never "parallel, grant enforced".

**Size budget (measured on the generator's real output, plan 27-07).** The coordinator is the
largest adapter the generator emits, because only it carries the tier announcement and the
enumerated grant. With the grant expanded to the real 16 specialist names, the emitted
coordinator adapter measures **3055 bytes** against the 3072-byte pointer-size warn tier and
the 4096-byte fail tier — **17 bytes of warn-tier headroom**. Specialists measure 1632 bytes
(`grugops-qe-e2e`) to 1987 bytes (`grugops-security-nfr`); a specialist's size is driven by its
derived description, so a longer `## One job` sentence is what moves it.

Two things the earlier estimate of 2951 / 1431 did not carry, both now in the measurement: the
one-line generated-file provenance header, and the `description` emitted as a double-quoted YAML
scalar (see below). The coordinator's margin is genuinely thin — adding roughly two more lines
to the coordinator body, or an eighteenth role, crosses the warn tier. The ceilings are never
raised to make a body fit; the body is shortened instead.

**`description` is emitted as a double-quoted YAML scalar.** The value is derived from authored
role prose that legitimately contains a colon-space (`routing matrix: "Need AGENTS.md"`, `the
triggers: authentication`), and the composed value always contains the literal `Use when: `. A
plain YAML scalar may not contain a colon-space, so the unquoted form shown in the frontmatter
sketches above would not parse and the platform would refuse to load the adapter. The generator
therefore always quotes it and escapes `\` and `"` — unconditionally, because a rule that fires
only on some inputs rots on the next role edit.

## Capability → tool mapping

Each role declares a `capabilities:` key in its frontmatter — a space-separated inline scalar
drawn from this closed vocabulary. The generator expands it into the adapter's `tools` line,
taking the tokens in the vocabulary order below and emitting each tool once. The vocabulary
lives here and in role frontmatter; it never lives inside the generator as a per-role map.

| Token | Claude Code tools | For |
| --- | --- | --- |
| `read` | `Read`, `Grep`, `Glob` | reading the kit, the repo and the shared context |
| `edit` | `Edit`, `Write` | publishing typed notes and changing repo files |
| `shell` | `Bash` | running the repo's own checks |
| `web` | `WebFetch`, `WebSearch` | fetching external material (advisories, upstream docs) |
| `plan` | `TodoWrite` | tracking a multi-step task list |

Two facts govern this table:

1. **Every tool named above survives the background sub-agent tool filter.** Sub-agents run in
   the background by default and keep only a narrowed set of built-in tools. A token mapping to
   a tool outside that set would produce a role that silently loses the tool at runtime, so the
   vocabulary maps only into tools that survive.
2. **The interactive question tool is unconditionally removed from every sub-agent**, so it
   appears in no mapping and is reachable from no token. `AskUserQuestion` is named here once,
   as the thing that is excluded, precisely so nobody adds a token for it later.

A role must declare at least one token. An empty or list-shaped value parses as empty, which
would emit an adapter whose `tools` resolve to nothing — and a sub-agent whose tool entries all
resolve to nothing refuses to launch. The value is therefore always a single-line inline
scalar, and the generator validates every token against this table at build time so that
failure lands in CI rather than on a user's machine.

## Why each field is shaped this way

- **`name`, `description`** — the only required frontmatter. `description` drives auto-routing,
  so it is written as a clear "use for / use when" sentence. It derives from the role's
  `## One job` and `## Activates when` sections, which are already phrased as routing triggers:
  editing the role updates the adapter, and there is nothing to keep in sync by hand.
- **`tools`** — derived from `capabilities:` through the table above. A specialist adapter's
  `tools` omits `Agent` entirely, which is the documented way to stop a sub-agent from spawning
  and holds identically on the main-thread and sub-agent paths. The spawn grant belongs to the
  coordinator adapter alone.
- **`model: inherit`** — the documented default; keeps the user's session model rather than
  pinning cost or capability.
- **Body** — repo-relative pointer text. It cites one frozen role file and acts as that role.
  It echoes the hard limit in clear professional English, not caveman voice — safety lines are
  always plain. It contains **no copied role instructions**.
- **The memory sentence** — both body shapes state that the shared verified context is the only
  memory. Phase 24 deleted the seventeen static handoff templates and the shared context replaced
  the relay, so a body that loses this sentence has gone stale by omission. `guard_adapter_body`
  therefore asserts it is present in every adapter body and in this template, and bans the retired
  relay vocabulary in both. Note what is **not** banned: the execution-topology phrasing about one
  window with prior context dropped between roles is deliberately kept — it is the degraded tier's
  own wording above and describes how roles activate on the four non-spawning CLIs.
- **`coordinator: true`** — grugops's own greppable marker, which the foundation guard keys on
  to decide which adapter MUST hold the spawn grant and which MUST NOT. It is not a documented
  platform field; the Claude Code loader ignores unknown frontmatter keys, so the marker is
  inert except as grugops's own signal. Do not describe it as platform configuration.
- **The enumerated grant** — lists only the specialist adapters the coordinator schedules. The
  parenthesized allowlist is honored **only because the orchestrator is the main-thread agent**,
  which happens when the session is started with `claude --agent grugops-orchestrator`. Inside
  a *spawned* subagent the parenthesized list is ignored — a subagent merely gains the ability
  to spawn nested agents up to the depth cap — so do not rely on a nested allowlist to scope a
  spawned role's further spawns. grugops writes no `.claude/settings.json` agent entry into a
  user's repository, so the flag is the full-capability path this kit documents.
- **The other four CLIs** — Codex, Gemini, OpenCode and Copilot have no host spawn mechanism,
  so the coordinator there is always in the degraded tier: it drains the same queue at
  concurrency one via `agent-factory/roles/_role-switch-protocol.md`. The grant is a
  Claude-Code-only capability, and the on-disk result is the same either way.

Reference: `code.claude.com/docs/en/sub-agents`.

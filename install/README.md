# Installing grugops

grug build factory once. grug not install it five different hard ways. so installing is
plain: there is a floor that needs no scripts at all, and a paved path of idempotent,
reversible installers on top. everything below is additive — grugops never overwrites or
deletes a file you own.

**Version: `0.1.0`.** This is the canonical value in `agent-factory/VERSION`; the Claude Code
plugin mirrors it in `.claude-plugin/plugin.json`. The two bump together, once per release.
grugops is pre-1.0 (SemVer `0.y.z`) on purpose — it is young, and `0.y.z` reserves the right
to change things while it settles.

---

## 1. The minimal path — just install the markdown (any tool)

The floor works for every supported tool and needs no script:

1. Copy the portable `AGENTS.md` and the `agent-factory/` folder into your repo.
2. Tell your agent: **"start at `agent-factory/roles/orchestrator.md`."**

That is it. The intelligence lives in the host coding agent; grugops only supplies the role,
the guardrail, the memory, the board, the proof, and the gates — all readable markdown. No
runtime, no service, no database.

---

## 2. The scripted path — per-tool conveniences

For thin per-tool adapters (the standalone Claude skills, the Orchestrator subagent wrapper,
the `CLAUDE.md` start-here pointer, and the Gemini `context.fileName` wiring), grugops ships
two functionally identical installers. They are **idempotent** (run them twice, nothing
changes), **additive** (they only ever append behind unique sentinels), and **reversible**.

```sh
# POSIX shells (macOS, Linux, WSL, Git Bash):
sh install/install.sh

# Preview first — prints the plan, changes NOTHING on disk:
DRY_RUN=1 sh install/install.sh

# Cross-platform (Windows / anywhere Node runs) — same behavior, Node stdlib only, zero deps:
node install/install.mjs

# Force copy instead of symlink (e.g. Windows without symlink privilege):
INSTALL_MODE=copy sh install/install.sh
```

Each installer detects the host tool(s), lays down the right adapter, and prints an install
**report** marking every item `created` / `linked` / `copied(verify)` / `skipped`. Where it
falls back from a symlink to a copy, that row is flagged `verify` so you know a copy may drift
from the source over time. The two installers produce a byte-identical result; `install.sh` is
the behavioral spec and `install.mjs` mirrors it.

What the installer touches, and only this:

- `.claude/skills/grugops*/SKILL.md` — the seven standalone skills (symlink, copy fallback)
- `.claude/agents/grugops-orchestrator.md` — the Orchestrator subagent wrapper
- a one-line **start-here** pointer block in `CLAUDE.md` (appended behind a sentinel; your
  existing content is preserved)
- `.gemini/settings.json` — `context.fileName` gains `"AGENTS.md"` (read-modify-write; other
  keys are preserved, never clobbered)
- an optional `.github/copilot-instructions.md` pointer

It never touches `agent-factory/`, `plans/`, `.planning/`, `docs/`, or any file you own beyond
those additive edits.

### Undo

```sh
sh install/uninstall.sh
# preview the reversal first:
DRY_RUN=1 sh install/uninstall.sh
```

`uninstall.sh` removes **only** what `install.sh` added — the skills, the wrapper, the
sentinel-delimited pointer block (the rest of your `CLAUDE.md` stays exactly as it was), and
the `AGENTS.md` entry it added to the Gemini settings. It explicitly refuses to delete
`agent-factory/`, `plans/`, `.planning/`, `docs/`, `src/`, or any user file.

### Prove it yourself

```sh
sh install/install.test.sh
```

The test harness runs against throwaway temporary fixtures (it never mutates your repo) and
asserts the contract: a double install produces zero diff, `DRY_RUN=1` changes nothing, and
install-then-uninstall restores the fixture while `agent-factory/` survives untouched.

---

## 3. The Claude Code plugin path (versioned, shareable)

Claude Code can also install grugops as a plugin, which gives you the colon-namespaced
commands (`/grugops:plan`, `/grugops:ticket`, …) and ships the mechanical deploy guard. In
Claude Code:

```
/plugin marketplace add <owner>/grugops    # UNKNOWN - verify against current tool docs
/plugin install grugops@grugops            # UNKNOWN - verify against current tool docs
```

The standalone skills installed by the scripted path use the dash form (`/grugops-plan`); the
plugin form uses the colon form (`/grugops:plan`). Both coexist. Plugin and marketplace schema
move quickly — confirm the exact commands against the current docs
(`code.claude.com/docs/en/plugins`, `code.claude.com/docs/en/plugin-marketplaces`) before you
rely on them. Where a command cannot be confirmed it is marked `UNKNOWN - verify` rather than
guessed.

---

## 4. Self-bootstrap

Once any form is installed, you do not need to remember these steps again. Ask the factory to
install or re-check itself:

```
/grugops install
```

The Orchestrator runs the Installer role, which performs the same additive, idempotent,
never-overwrite install (and can dry-run and uninstall) from inside the agent. It is the same
contract as the scripts above, driven by the agent instead of your shell.

---

## 5. Safety: the production-deploy guard (please read this in plain English)

The hard rule never changes: **grugops never merges a protected branch and never deploys to
production without named human confirmation. Humans decide; agents execute.** How that rule is
*enforced* differs by tool, and it is important to be honest about the difference.

- **Claude Code — mechanical.** The plugin ships a `PreToolUse` hook (`hooks/hooks.json` →
  `hooks/guard.mjs`) that **denies** any command matching a production-deploy pattern unless a
  human has exported the approval environment variable in the shell that launched Claude. The
  guard also **refuses** any command that tries to set that variable inline, so the agent
  cannot approve itself, and it **fails closed**. This pairs with the config flag
  `production_requires_human_confirmation: true`. A prompt cannot talk its way past a
  `PreToolUse` deny — that is the point.

- **Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI — procedural fallback.** These four
  tools have no equivalent pre-tool hook, so there is **no mechanical guard** on them. They
  rely on the **`autonomy=pr`** posture plus `production_requires_human_confirmation: true`:
  the Orchestrator and Release Manager stop at a pull request, and a named human performs the
  merge and the production deploy. This is the same rule, enforced by procedure and by the
  prompt-level safety rule rather than by code.

Be clear with yourself about this asymmetry: **the mechanical guard protects Claude Code only.**
On the other four tools, production safety rests on the `autonomy=pr` fallback and your own
discipline. Do not assume the guard is watching where it is not.

**Known limitation — the guard only sees Bash commands.** The hook's matcher is `"Bash"`, so the
guard inspects the command of a `Bash` tool call and nothing else. A deploy command that does not
transit the Bash tool is not seen by it. Two concrete gaps to be honest about:

- An agent that writes a deploy command into a script with the `Write`/`Edit` tool and then runs
  it through some non-Bash mechanism is outside the matcher's view.
- Trivial shell indirection such as `K=kubectl; $K apply -f x` defeats the literal tool-name
  patterns — the guard does not expand variables. This is documented as out of scope, not fixed.

So the mechanical guard is a strong, prompt-proof backstop **for deploys that run through the Bash
tool**, not a complete sandbox. The real, tool-independent backstop is the **`autonomy=pr`** posture:
the agent stops at a pull request and a named human performs the merge and the production deploy.
Treat the Bash guard as defense-in-depth on top of `autonomy=pr`, never as the only thing standing
between an agent and production.

The installer **never** sets the approval environment variable — only a human may. And the
`grugops-release` skill ships with `disable-model-invocation: true`, so the agent can never
auto-fire a release on any tool.

Verify the hook schema and the per-tool autonomy behavior against current tool docs
(`code.claude.com/docs/en/hooks`) before you depend on them.

---

## Attribution

grugops borrows its voice in homage to [grugbrain.dev](https://grugbrain.dev). grugops is **not
affiliated with, endorsed by, or sponsored by** grugbrain.dev or its author. The joke earns
trust; it never replaces the explanation, and it stays out of the safety, money, and
compliance text — which is always plain.

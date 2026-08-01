# Installing grugops

grug build factory once. grug not install it five different hard ways. so installing is
plain: there is a floor that needs no scripts at all, and a paved path of idempotent,
reversible installers on top. everything below is additive — grugops never overwrites or
deletes a file you own.

**Version: `0.1.0`.** This is the canonical value in `agent-factory/VERSION`; the Claude Code
plugin mirrors it in `.claude-plugin/plugin.json`. The two bump together, once per release.
grugops is pre-1.0 (SemVer `0.y.z`) on purpose — it is young, and `0.y.z` reserves the right
to change things while it settles.

Once grugops is installed, **how you start the session decides what the Orchestrator can
actually do.** The three entry tiers, and what each one really enforces, are §6.

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

grugops ships a single installer, `install/install.js` — a Node program (the compiled output of
`install/install.ts`). **Node 22+ is a prerequisite for the scripted path** (the minimal path in
§1 still needs nothing at all). The installer is **idempotent** (run it twice, nothing changes),
**additive** (it only ever appends behind unique sentinels), and **reversible**. It runs the same
way on every platform Node runs on, including Windows.

The installer uses a **two-root** layout, so the kit and your per-repo state stay cleanly
separated:

- **Shared, read-only kit** → copied once to `${GRUGOPS_HOME:-$HOME/.grugops}` (default
  `~/.grugops`). One kit, shared across every repo you install into.
- **Per-repo, writable state** → seeded into the target repo (`.grugops/factory.config.json`,
  the install marker, `plans/`, and `memory-bank/`).

```sh
# Install into a chosen repo (run from anywhere):
node install/install.js --target /path/to/repo

# Install into the current repo (prompts to confirm the target first):
node install/install.js

# Unattended / CI (take the default target, no prompt):
node install/install.js --yes

# Preview first — prints the plan, changes NOTHING on disk (in either root):
DRY_RUN=1 node install/install.js

# Put the shared kit somewhere other than ~/.grugops:
GRUGOPS_HOME=/opt/grugops node install/install.js --target /path/to/repo
```

### Exit codes — what the installer tells a script

If you chain anything after the installer (`node install/install.js --yes && next-step`, a CI
step, a Makefile), read the exit code. Both `install.js` and `uninstall.js` use the same list:

| Code | Meaning |
|------|---------|
| `0` | **complete** — every class installed (or removed); the run printed `== install complete ==` (or `== uninstall complete ==`). The **non-install modes** exit `0` too, and each prints its **own** closing line rather than the install banner — `--check` on a clean doctor prints `ALL CHECKS PASSED`, `--update` prints `== update complete ==`, `--prune-old-kit` prints `== prune complete ==`, and a `--migrate` on an already-migrated repo reports *nothing was changed*. All four are **`install.js` only**. So do not test for the install banner to decide a run succeeded; test the exit code. |
| `1` | **refused or aborted** — the run changed nothing. The self-checkout guard (the target looks like the grugops source checkout) is the usual cause, and **both binaries implement it**: each writes a refusal to stderr naming `--allow-self`, and neither writes nor removes anything. `--check` also reports `1` on a doctor FAIL — that half is **`install.js` only**, because `uninstall.js` has no doctor mode. |
| `2` | **bad usage** — an unknown argument. Nothing was read or written. |
| `3` | **incomplete** — the run went ahead but could not finish a whole class, and printed `== install INCOMPLETE — N item(s) need verification ==` (`uninstall.js` prints the same line with `uninstall` in place of `install`). Every `verify` line in the output names what was left undone and the remedy for it. |

Code `3` is the important one: grug not lie about finish. A run that could not read a source
directory, or that refused an adapter, installed **nothing for that class** — so it does not
claim completion, and it does not return the success code either. **A chained command stops
here.** That is deliberate: proceeding over a partial install is how a broken install reaches
production looking fine. Read the `verify` lines, fix the source, re-run (the installer is
idempotent, so re-running is safe).

Code `1` from `uninstall.js` means the **self-checkout refusal**: the target you named is the
grugops source checkout itself (or a second checkout of it — it carries `install/install.ts` and
`agent-factory/VERSION`). Uninstalling there would delete the kit's own committed adapters and
skills under `.claude/`, which are not wiring the installer added but files the repository ships,
so the run stops before removing anything and writes the reason to stderr. Nothing is printed on
stdout and nothing on disk changes. Almost always the fix is to name the repo you meant
(`--target /path/to/your-repo`); if you genuinely do mean the checkout, pass **`--allow-self`**
(or `--force`) — the same override, spelled the same way, that `install.js` uses.

### Choosing the target (`--target`, the prompt, `--yes`)

Where the install lands is resolved in this precedence: **`--target <repo>`** wins, then the
**`TARGET=` env var**, then a **prompt** (defaulting to the current directory). The `--target`
flag means you can install into any repo from any working directory — you no longer have to
`cd` into the repo first.

When run interactively without `--target`, the installer asks *"Install grugops into which
repo? [<default>]"* and waits for confirmation. For unattended runs (CI, scripts), pass
**`--yes`** (or `-y`) to take the default target without prompting; a non-TTY stdin is treated
the same way, so a piped or redirected invocation never hangs on the prompt.

### Copy by default (symlink is opt-in)

The kit and adapters are **copied** by default. Copy is the only mode that behaves identically
on every platform; the previous symlink default was fragile (links broke when the source clone
moved). Symlinks are still available as an opt-in:

```sh
node install/install.js --symlink --target /path/to/repo
# or:
INSTALL_MODE=symlink node install/install.js --target /path/to/repo
```

### The self-checkout guard (`--allow-self`)

By default the installer **refuses** to install into the grugops source checkout itself — if
the target is the grugops repo (or carries its source markers), it stops and tells you that you
probably meant `--target <your-repo>`. This guard always runs, even under `--yes` or a non-TTY,
because it is a mechanical safety check, not a prompt. If you really do mean to install into the
source checkout, pass **`--allow-self`** (or `--force`) to override it.

### What the installer touches (per-repo), and only this

In the **target repo**:

- `.claude/skills/grugops*/SKILL.md` — the seven standalone skills
- `.claude/agents/grugops-orchestrator.md` — the Orchestrator subagent wrapper
- the two **resolver adapters** (`.claude/skills/grugops/SKILL.md` and the orchestrator
  wrapper) have the resolved absolute kit path **materialized** into them, so `/grugops`
  resolves the shared kit on first run with no path error
- a one-line **start-here** pointer block in `CLAUDE.md` (appended behind a sentinel; your
  existing content is preserved)
- `.gemini/settings.json` — `context.fileName` gains `"AGENTS.md"` (read-modify-write; other
  keys are preserved, never clobbered)
- an optional `.github/copilot-instructions.md` pointer
- **seeded per-repo state** (skip-if-exists, never clobbered): `.grugops/factory.config.json`,
  the `.grugops/install.json` marker, `plans/`, and `memory-bank/`

In the **shared kit root** (`${GRUGOPS_HOME:-$HOME/.grugops}`):

- `agent-factory/` — the read-only kit, copied once and shared across repos

It never overwrites or deletes any file you own. Existing seeded state is left byte-untouched on
re-install (skip-if-exists), and `agent-factory/`, `plans/`, `.planning/`, `docs/`, and `src/`
in your target are never modified beyond the additive edits above.

### Undo

```sh
node install/uninstall.js --target /path/to/repo
# preview the reversal first (read the note below before previewing inside a grugops checkout):
DRY_RUN=1 node install/uninstall.js --target /path/to/repo
```

**The self-checkout guard is always on, and `DRY_RUN=1` does not exempt it.** It is a mechanical
safety check rather than a prompt, so pointing either binary at a target that is a grugops source
checkout — *including the preview above* — **exits `1` and prints nothing at all**. An empty preview
there is the refusal, not a reversal with nothing to undo. To preview a reversal inside a grugops
checkout, add **`--allow-self`** (or `--force`), the same override the installer takes.

`uninstall.js` removes **only** the grugops-owned wiring it added to the target: the skills, the
Orchestrator wrapper, the materialized resolver adapters, the sentinel-delimited `CLAUDE.md` and
Copilot pointer blocks (the rest of those files stays exactly as it was), the `AGENTS.md` entry
it added to the Gemini settings, and the `.grugops/install.json` marker.

It deliberately does **not** touch:

- the **shared kit** at `${GRUGOPS_HOME:-$HOME/.grugops}` — other repos depend on it, so
  removing it is a manual `rm -rf ~/.grugops` you run yourself when you want it gone everywhere
- your **seeded per-repo state** — `.grugops/factory.config.json`, `plans/`, and `memory-bank/`
  become your content once seeded (they may hold real work), so they survive uninstall
- `agent-factory/`, `.planning/`, `docs/`, `src/`, or any file you own

### Migrating an existing install (`--migrate`)

If you installed an **older, single-root grugops** (the v1.0 layout, where the kit was vendored
in-repo under `agent-factory/` and your config lived inside it), `--migrate` moves you to the
current two-root layout safely and reversibly:

```sh
node install/install.js --migrate --target /path/to/repo
# preview the migrate plan first (changes NOTHING on disk):
DRY_RUN=1 node install/install.js --migrate --target /path/to/repo
```

`--migrate` is additive-then-relocate and **never deletes** your content. It:

- backs up the displaced in-repo `agent-factory/` to a timestamped
  `agent-factory.bak.<ISO>` directory (it is renamed aside, never deleted);
- backs up any runtime-accumulated **`plans/handoffs/`** directory — the old delivery relay's
  per-stage handoff files — to a timestamped `plans/handoffs.bak.<ISO>` directory (renamed aside,
  **never deleted and never converted**: the originals are preserved verbatim for you, since the
  current grugops trace is note-native and does not parse the legacy handoff format). If a backup
  of that exact name already exists, `--migrate` **aborts that step and leaves your originals
  untouched** rather than overwrite the existing backup;
- carries your **edited config forward** to `.grugops/factory.config.json` and leaves the
  original in place renamed to `<original>.bak.<ISO>`. Both legacy config locations are handled —
  the in-repo `agent-factory/config/factory.config.json` and a repo-root `factory.config.json`;
- copies the fresh shared kit to `${GRUGOPS_HOME:-$HOME/.grugops}` and materializes the resolver
  adapters, exactly like a normal install (it is orchestration around the same install run).

The `plans/handoffs/` backup runs on **every** `--migrate` (whether your repo is on the old layout
or already on the current two-root layout), because the handoffs dir can accumulate regardless of
layout state. When `plans/handoffs/` is absent it is a clean no-op (`--migrate` reports *nothing to
migrate* and changes nothing).

It is **idempotent and re-run-safe**: running `--migrate` a second time on an already-migrated
repo does nothing. If a stray **live** in-repo `agent-factory/` is left behind after migration,
`--migrate` tells you — and tells you to remove it **by hand** once you have confirmed the shared
kit at `${GRUGOPS_HOME:-$HOME/.grugops}` is in use. `--prune-old-kit` does **not** clear it: prune
only removes timestamped `.bak.<ISO>` backups, never a live kit (it refuses to delete user content
by design).

A `--migrate` on a clean repo (no old layout) simply falls through to a normal fresh install.

#### Rolling a migrate back (the manual restore)

A migrate is reversible by hand. To return a repo to its pre-migrate state:

1. **Remove the grugops wiring.** Run the uninstall, which removes only the grugops-owned
   adapters, the sentinel blocks, and the `.grugops/install.json` marker (it preserves the
   migrate backups and the seeded config):

   ```sh
   node install/uninstall.js --target /path/to/repo
   ```

2. **Restore the in-repo kit.** Rename the timestamped backup back over `agent-factory/`. Inside
   that backup, your original config is preserved as a `.bak`; rename it back first:

   ```sh
   cd /path/to/repo
   mv agent-factory.bak.<ISO>/config/factory.config.json.bak.<ISO> \
      agent-factory.bak.<ISO>/config/factory.config.json
   mv agent-factory.bak.<ISO> agent-factory
   ```

   (If your old config lived at the **repo root** instead, rename that `.bak` back too:
   `mv factory.config.json.bak.<ISO> factory.config.json`.)

3. **Remove the migrate-seeded config.** Migrate carried your edited config forward into
   `.grugops/`; remove that copy to return to the single-root shape:

   ```sh
   rm .grugops/factory.config.json
   ```

After these steps your `agent-factory/` kit and your edited config are exactly as they were before
the migrate. All commands are local `mv`/`rm`/`node` — nothing fetches anything.

##### Restoring `plans/handoffs/` and the `git revert` lossless rollback

The migration is **lossless and reversible** because nothing is ever deleted — every relocated
thing lives on as a timestamped `.bak.<ISO>` directory beside the original. To restore your old
delivery-relay handoffs, simply rename the backup back:

```sh
cd /path/to/repo
mv plans/handoffs.bak.<ISO> plans/handoffs
```

If the migration itself was committed to git, you can roll the whole change back with a single
`git revert` of the migration commit, then restore the out-of-band `.bak.<ISO>` directory by hand:

```sh
git revert <migration-commit-sha>     # undoes the committed migration edits
mv plans/handoffs.bak.<ISO> plans/handoffs   # restore the preserved handoffs (kept out-of-band)
```

`git revert` reverses the tracked changes, and because the handoffs were renamed aside (never
deleted) the `.bak.<ISO>` directory survives the revert and carries your original files verbatim —
so the `git revert` + restore is a **lossless** round-trip with no data left orphaned.

### Updating the shared kit (`--update`)

When you pull a newer grugops checkout and want every repo to pick up the new kit, refresh the
**shared kit** in place with `--update`:

```sh
node install/install.js --update
# preview the refresh first (changes NOTHING on disk):
DRY_RUN=1 node install/install.js --update
```

`--update` is **kit-home-only**: it refreshes the read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`
from the running checkout and **does not touch any repo's per-repo state** — it never writes adapters,
seeded `.grugops/` state, or a marker into a target. There is no `--target` to pass; one update
refreshes the one shared kit that every installed repo resolves against.

It is **reversible**: the displaced kit is retained as a timestamped `agent-factory.bak.<ISO>`
backup under the kit home (renamed aside, never deleted) whenever the new kit differs from it. If the
kit is already identical, the update is a true no-op and leaves no backup behind.

If the checkout you run `--update` from is **older** than the kit already installed (a downgrade),
`--update` prints a clear warning naming both versions and then **proceeds** — it refreshes the kit
to the older version (retaining the newer one as the timestamped backup) rather than refusing. If
that was not what you intended, the backup is right there to restore.

### Pruning old backups (`--prune-old-kit`)

Both `--migrate` and `--update` leave **timestamped backups** behind on purpose (so a refresh or a
migration is always reversible). When you are confident you no longer need them, `--prune-old-kit`
removes them — and **only** them:

```sh
node install/install.js --prune-old-kit
# preview which backups would be removed (deletes NOTHING):
DRY_RUN=1 node install/install.js --prune-old-kit
```

This is the **single, opt-in deletion path** in grugops, and it is deliberately narrow:

- it removes **only** grugops-created backups — the `agent-factory.bak.<ISO>` directories (in both
  the target repo and the shared kit home) and the `factory.config.json.bak.<ISO>` files migrate
  leaves. The match is anchored to the exact `<name>.bak.<ISO-timestamp>` shape grugops creates, so a
  file of your own such as `mine.bak` or `notes.bak` is **never** matched;
- it **never** runs on the default install path — deletion happens only when you pass this flag
  (grugops never deletes first);
- it never touches the **live** `agent-factory/` kit, your seeded `.grugops/` state, `plans/`,
  `.planning/`, `docs/`, `src/`, or any other content you own (the same protected-path guard the
  uninstaller uses).

### Prove it yourself

```sh
npx vitest run install   # the install/uninstall behavioral gate (single-root + two-root)
```

The harness runs against throwaway temporary fixtures (it never mutates your repo, `$HOME`,
or a real `$GRUGOPS_HOME`) and asserts the contract: a double install produces zero diff,
`DRY_RUN=1` changes nothing in either root, and install-then-uninstall removes the
grugops-owned wiring + the install marker while the shared kit, the seeded state, and
`agent-factory/` all survive untouched.

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
  `hooks/guard.js`) that **denies** any command matching a production-deploy pattern unless a
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

## 6. Entry paths — the three tiers, and what each one enforces

Installing grugops puts the roles on disk. How you *start* the session decides what the
Orchestrator can actually do with them. There are three tiers, and the Orchestrator announces
which one it is in before it schedules anything. It picks the tier by sensing whether the
`Agent` tool is available to it — never by reading a host name or a version string.

The three names below are the same three the coordinator uses in that runtime announcement
(they live once, in `agent-factory/packaging/subagent.frontmatter.md`), so what you read here
and what you see in a session are one vocabulary, not two.

### Full — `claude --agent grugops-orchestrator`

```sh
claude --agent grugops-orchestrator
```

This is the **full-capability path**. The main thread itself takes on the coordinator's system
prompt and tool restrictions, role agents are scheduled in parallel up to `queue.wip_limit`, and
the enumerated `Agent(...)` grant in the coordinator adapter's frontmatter **is enforced by the
runtime** — on this path only. Claude Code prints the agent name in the session startup header
(`@grugops-orchestrator`); that header is how you confirm the tier is live.

### Reduced — a default session (what the `/grugops` skill entry gets)

The headline entry — `/grugops` in an ordinary Claude Code session — runs in a default main
thread. That session already has the `Agent` tool, so parallel scheduling is available and is
used, up to the same `queue.wip_limit`. But the enumerated grant is **not runtime-enforced
here**: a default session declares no allowlist, so nothing mechanical holds a spawn inside the
16 specialist names. The coordinator says exactly that when it announces the tier, and stays
inside the grant by instruction rather than by enforcement. That is a weaker guarantee than the
full tier, and it is stated plainly rather than softened — you should know which one you have.

### Degraded — no `Agent` tool at all

Codex CLI, Gemini CLI, OpenCode and GitHub Copilot CLI have no host spawn mechanism, and a
Claude Code sub-agent already at the nesting limit has `Agent` withheld from it rather than
erroring. In either case the coordinator drains the same queue at concurrency one, activating
each role in a single window through `agent-factory/roles/_role-switch-protocol.md` — and says
so out loud.

### What the installer deliberately does not write

The installer writes **no main-thread wiring into your repository** — no `.claude/settings.json`
`agent` entry, in any form, not even behind a sentinel. Two reasons, both deliberate:

- Such an entry would make **every** session in that repository run as the grugops coordinator,
  including a session you opened only to fix a typo in a readme.
- Settings files are **your** content, and grugops is additive: it never overwrites what you own.

So the flag is the full-capability path this kit documents, and you type it in the sessions where
you want it. What is deliberately **not** claimed here: the platform documents the
enumerated-allowlist rule for the `--agent` flag specifically. Whether the corresponding settings
key enforces that same allowlist is `UNKNOWN - verify` — grugops does not write that key, so
nothing here depends on the answer, and no equivalence is asserted.

### How the adapter is found

Project-scope adapters live in `.claude/agents/`, and Claude Code discovers them by walking up
from your working directory, so every `.claude/agents/` between there and the repository root is
scanned. Identity comes only from the frontmatter `name` field — the filename does not decide it.
All 17 grugops adapters carry the `grugops-` prefix, which keeps their names unique across a tree.
Verify this resolution behavior against current tool docs
(`code.claude.com/docs/en/sub-agents`) before you depend on the details.

---

## Attribution

grugops borrows its voice in homage to [grugbrain.dev](https://grugbrain.dev). grugops is **not
affiliated with, endorsed by, or sponsored by** grugbrain.dev or its author. The joke earns
trust; it never replaces the explanation, and it stays out of the safety, money, and
compliance text — which is always plain.

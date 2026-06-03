---
phase: 05-packaging-adapters-install-distribution
reviewed: 2026-06-03T00:00:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/packaging/slash-command.template.md
  - hooks/guard.mjs
  - hooks/hooks.json
  - hooks/guard.test.sh
  - .claude/skills/grugops/SKILL.md
  - .claude/skills/grugops-map/SKILL.md
  - .claude/skills/grugops-plan/SKILL.md
  - .claude/skills/grugops-ticket/SKILL.md
  - .claude/skills/grugops-gate/SKILL.md
  - .claude/skills/grugops-uat/SKILL.md
  - .claude/skills/grugops-release/SKILL.md
  - .claude/agents/grugops-orchestrator.md
  - .gemini/settings.json
  - .claude-plugin/plugin.json
  - .claude-plugin/marketplace.json
  - skills/grugops/SKILL.md
  - skills/plan/SKILL.md
  - skills/map/SKILL.md
  - skills/ticket/SKILL.md
  - skills/gate/SKILL.md
  - skills/uat/SKILL.md
  - skills/release/SKILL.md
  - install/install.sh
  - install/install.mjs
  - install/uninstall.sh
  - install/install.test.sh
  - install/README.md
findings:
  critical: 1
  warning: 6
  info: 4
  total: 11
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-06-03
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

Reviewed the grugops packaging/install phase: the mechanical prod-deploy guard
(`hooks/guard.mjs` + `hooks.json`), the two installers (`install.sh` / `install.mjs`),
the reversal (`uninstall.sh`), test harnesses, the standalone + plugin skill adapters,
the orchestrator wrapper, the plugin/marketplace manifests, and the packaging pointer docs.

**Verified-good:** All skill/adapter markdown is genuinely pointer-text only (no copied role
bodies) and every referenced role/workflow file exists on disk. All in-scope files cite
`code.claude.com`, never `docs.claude.com`. No hardcoded secrets, no TODO/FIXME/debug
artifacts. `plugin.json` version (`0.1.0`) matches `agent-factory/VERSION` and the marketplace
entry correctly omits `version` so `plugin.json` wins. The guard fails closed on malformed
JSON (empty command → no match → allow non-deploys), correctly refuses inline self-approval
including the assignment-prefix and `export`/`env` forms (tested with valid escaped JSON), and
`disable-model-invocation: true` is correctly scoped to the two `release` skills only. The
install→uninstall round-trip cleanly preserves a user's own `CLAUDE.md` content, their own
`.claude/skills/*`, and the `agent-factory/` frozen core.

**Key concerns:** One BLOCKER — `uninstall.sh` deletes a user's own `AGENTS.md` when it happens
to be a symlink, regardless of where that symlink points (proven by reproduction; data loss,
directly contradicts the script's stated contract). The guard's deploy-pattern set has several
real coverage gaps (`kubectl delete`, `aws s3 sync`, `yarn`/`pnpm publish`, `git push --force`
to a protected branch, env-var-indirected commands) and two false-positive over-blocks; the
two installers are NOT functionally identical for a pre-existing `.gemini/settings.json` despite
the docs/headers claiming byte-identical parity, and the parity test never exercises that path.

## Critical Issues

### CR-01: `uninstall.sh` deletes a user-owned `AGENTS.md` symlink (data loss, contract violation)

**File:** `install/uninstall.sh:225-234`
**Issue:** The AGENTS.md reversal removes *any* symlink at `$TARGET/AGENTS.md`
unconditionally — it never checks where the symlink points. A user whose own `AGENTS.md`
is a symlink into their own content (e.g. `AGENTS.md -> docs/agents.md`, a common monorepo
pattern) loses it on `uninstall`. This directly contradicts the file's own header
("a user's own AGENTS.md is never removed", lines 7-8) and the README ("It explicitly refuses
to delete ... any user file", README lines 78-79). Install only *lays down* AGENTS.md via
`link_or_copy`, which symlinks to `$GRUGOPS_SRC/AGENTS.md`; uninstall should remove only a
symlink whose resolved target is that source file.

Reproduced: a fixture with `AGENTS.md -> my-real-agents.md` (user's own file) was **deleted**
by `uninstall.sh` with the report line `removed AGENTS.md (grugops symlink)`.

```sh
# install/uninstall.sh — gate the symlink branch on the link target, mirroring the
# byte-identical-copy branch that follows it.
elif [ -L "$_agents" ]; then
  # Only remove a symlink grugops created — i.e. one that resolves to the source AGENTS.md.
  _resolved=$(CDPATH= cd -- "$(dirname -- "$_agents")" 2>/dev/null && \
              readlink "$_agents" 2>/dev/null || true)
  if [ -f "$GRUGOPS_SRC/AGENTS.md" ] && \
     cmp -s -- "$_agents" "$GRUGOPS_SRC/AGENTS.md" 2>/dev/null; then
    remove_file "$_agents" "AGENTS.md (grugops symlink into source)"
  else
    report skipped "AGENTS.md (user-owned symlink — left untouched)"
  fi
```

(`cmp -s` follows the symlink and compares resolved content against the source, so it covers
both "symlink into the grugops source" and "user symlink to something else" safely. Reject any
symlink that does not resolve to the source AGENTS.md.)

## Warnings

### WR-01: Deploy-guard pattern set misses several real production-mutating commands

**File:** `hooks/guard.mjs:33-45`
**Issue:** The `DEPLOY` regex set only catches a narrow slice of deploy verbs. Reproduced
commands that the guard **ALLOWS** today (rc=0, no deny):
- `kubectl delete namespace prod` — destructive prod mutation; only `apply|rollout` are matched.
- `aws s3 sync ./build s3://prod-bucket` — a real static-site/asset deploy with no literal
  `deploy` token (the `aws...deploy` pattern needs the word "deploy").
- `yarn publish` and `pnpm publish` — only `npm publish` is matched.
- `git push origin main --force` — pushing/force-pushing a protected branch is the *other half*
  of the hard rule ("never merge a protected branch"), and the guard does not consider it at all.
- `K=kubectl; $K apply -f x` — trivial env-var indirection defeats the literal `\bkubectl\b`.

The doc framing (`adapters.md`, README §5) sells this as the *mechanical* enforcement of
"humans decide, agents execute," so each uncovered verb is a silent hole in the only mechanical
control in the project. The comment at lines 29-32 acknowledges per-project extension, but the
shipped default set should at least cover the common destructive/publish/force-push verbs.
**Fix:** Extend the default `DEPLOY` set, e.g. add `/\bkubectl\s+delete\b/`,
`/\baws\s+s3\s+sync\b/`, `/\b(yarn|pnpm)\s+publish\b/`, and a protected-branch push guard
`/\bgit\s+push\b[\s\S]*\b(--force|-f)\b/` (or match push to `main`/`master`/`release/*`).
Document that env-var indirection is out of scope, or normalize obvious `VAR=cmd; $VAR` forms.

### WR-02: `gcloud`/`aws` deploy patterns over-match, denying read-only commands (false positives)

**File:** `hooks/guard.mjs:37-38`
**Issue:** `/\bgcloud\b[\s\S]*\bdeploy\b/` and `/\baws\b[\s\S]*\bdeploy\b/` use `[\s\S]*` to
span the *entire* command, so any command that merely contains the substring "deploy" anywhere
after the tool name is denied. Reproduced false-positive denies:
- `aws s3 ls && cat ./deploy/notes.txt` → DENIED (a path component named `deploy`).
- `gcloud config list # see deploy docs` → DENIED (the word "deploy" in a comment).

This trains users to treat the guard as noisy and to disable or work around it, eroding the
safety control. **Fix:** Tighten to the actual subcommand position, e.g.
`/\bgcloud\s+(app|run|functions|builds)\s+deploy\b/` and
`/\baws\s+deploy\s+(create-deployment|push)\b/` (or `/\baws\s+\w+\s+deploy\b/`), rather than
"tool name … deploy anywhere."

### WR-03: `install.sh` and `install.mjs` are NOT functionally identical for a pre-existing `.gemini/settings.json`

**File:** `install/install.sh:141-170`, `install/install.mjs:145-186`
**Issue:** When `.gemini/settings.json` already exists *without* the AGENTS.md entry, the two
installers diverge:
- `install.sh` refuses to touch it (prints `verify`, leaves the file unchanged).
- `install.mjs` JSON-parses and *merges* `"AGENTS.md"` into `context.fileName`.

Reproduced: against an identical `{ "theme": "dark" }` fixture, sh left the file untouched while
mjs produced a merged `context.fileName: ["AGENTS.md"]`. The README (lines 52-53) and both file
headers ("functionally identical", "byte-identical result") assert parity without qualifying
this case. The parity check in `install.test.sh` (Check 4) only uses a fixture with *no*
pre-existing settings file, so the divergent path is never tested — the parity claim is asserted
but unverified for the case where it actually fails. **Fix:** Either (a) qualify the parity
claim in the README/headers to "identical except where pure-sh cannot safely merge JSON, which
it defers to the user / install.mjs," or (b) add a `install.test.sh` fixture with a pre-existing
`.gemini/settings.json` and assert the documented (divergent) behavior so the gap is explicit.

### WR-04: `detect_tools` reports `claude`/`codex` from global state, not the target repo

**File:** `install/install.sh:177-185`
**Issue:** Line 179 `[ -d "$TARGET/.claude" ] || command -v claude >/dev/null 2>&1 && _found=...`
parses (POSIX, left-associative, equal precedence) as
`( [ -d "$TARGET/.claude" ] || command -v claude ) && _found=...`. So when the target has no
`.claude` directory but the `claude` binary is anywhere on `PATH`, the target is still reported
as a claude repo. Reproduced: `TARGET=/nonexistent-xyz` (no `.claude`) reports `_found=' claude'`
because `claude` is on PATH. The `codex` line (180) has the same shape with global
`~/.codex/AGENTS.md`, so every target reports `codex` if that one global file exists. The Node
sibling (`install.mjs:188-196`) checks only target-local paths and does **not** consult `$PATH`
or `$HOME`, so the two installers report different "tools detected" lines on the same machine —
another small parity break. This is informational output only (adapters are laid down
regardless, per the comment), so it cannot cause a wrong install, but it misreports state.
**Fix:** Make detection target-local to match `install.mjs`, e.g.
`[ -d "$TARGET/.claude" ] && _found="$_found claude"` (drop the `command -v`/`$HOME` fallbacks),
or fold the binary/global checks into a clearly-separate "host CLIs available" line.

### WR-05: Copilot pointer block uses a sentinel identical to the CLAUDE.md block, defeating per-file removal intent

**File:** `install/install.sh:48-56`, `install/uninstall.sh:35-36,244`
**Issue:** `COPILOT_OPEN`/`COPILOT_CLOSE` are defined as their own variables in `install.sh`
but hold the *same* literal value as `CLAUDE_OPEN`/`CLAUDE_CLOSE`
(`<!-- GSD:grugops-start-here -->`). `uninstall.sh` then strips the Copilot block by passing
`$CLAUDE_OPEN`/`$CLAUDE_CLOSE` (line 244) rather than dedicated Copilot sentinels. It works today
only because the strings coincide. If anyone ever changes the Copilot sentinel in `install.sh`
(the separate variables invite exactly that), uninstall silently stops removing the Copilot
block — leaving residue and breaking the reversibility contract — with no test catching it
(`install.test.sh` fixtures contain no `.github/copilot-instructions.md`). **Fix:** Give the
Copilot block a distinct sentinel (e.g. `<!-- GSD:grugops-copilot-start-here -->`) and have
`uninstall.sh` reference the matching `COPILOT_OPEN`/`COPILOT_CLOSE`, then add a fixture that
seeds/asserts the Copilot pointer round-trip.

### WR-06: Guard relies on a `Bash`-only matcher; non-Bash file-then-exec paths are unguarded

**File:** `hooks/hooks.json:5`, `hooks/guard.mjs` (whole)
**Issue:** The hook's `matcher` is `"Bash"`, so the guard inspects only `tool_input.command`
of Bash invocations. An agent that writes a deploy command into a script via the `Write`/`Edit`
tool and then triggers it through a non-Bash mechanism (e.g. a task runner the host invokes
without going through the Bash tool), or a tool whose deploy command arrives under a different
input field, is not seen by the guard. This is partly inherent to PreToolUse hooks, but the
README/`adapters.md` present the guard as *the* mechanical backstop, so the residual surface
should be documented as a known limitation rather than implied away. **Fix:** Document the
Bash-only scope as an explicit limitation in `adapters.md` / README §5 (a deploy must transit
the Bash tool to be caught), and consider adding `Write|Edit` awareness or at least a note that
the `autonomy=pr` posture is the real backstop. No code change required if the limitation is
documented.

## Info

### IN-01: `npm publish` matched but the broader publish-to-registry family is uneven

**File:** `hooks/guard.mjs:44`
**Issue:** `npm publish` is gated but `yarn`/`pnpm`/`bun publish`, `cargo publish`,
`gem push`, `twine upload`, and `docker push` are not (see WR-01 for the JS ones). Listing only
`npm publish` may give a false sense that "publishing is covered." **Fix:** Either broaden the
publish family or add a comment noting these are intentionally out of the default set and
expected to be added per-project.

### IN-02: `guard.mjs` `APPROVAL` constant is a hardcoded var name the docs say is "renameable"

**File:** `hooks/guard.mjs:24-27`
**Issue:** The comment says "projects may rename it; the guard reads whatever name is set here,"
but the name is a hardcoded `const` with no config wiring, and `factory.config.json` is
referenced only in the deny *message*, not actually read. A project that renames the approval
var in config would have a guard that still checks the old name. **Fix:** Either read the var
name (and the `DEPLOY` patterns) from `factory.config.json` to match the D-32 "config-driven"
claim, or soften the comment to state the name is fixed in this build.

### IN-03: `do_run` wrapping is inconsistent across the install scripts

**File:** `install/install.sh:90-96`, `install/uninstall.sh:114-123`
**Issue:** Some filesystem mutations go through `do_run` (the stated DRY_RUN discipline,
install.sh comment lines 64) and others are guarded by an explicit early `DRY_RUN` return
instead (`ensure_block` does the append directly; `remove_sentinel_block` runs `awk > _tmp`
directly then `do_run mv`). Both are currently correct because the early returns fire before any
mutation, but the mixed convention makes it easy to introduce a DRY_RUN leak in a future edit.
**Fix:** Pick one discipline — prefer routing every mutation through `do_run` — for consistency
and lower future-edit risk.

### IN-04: README states "byte-identical result" without the JSON-merge caveat

**File:** `install/README.md:52-53`
**Issue:** "The two installers produce a byte-identical result; install.sh is the behavioral
spec and install.mjs mirrors it." This is true for the fresh-install path but false for the
pre-existing-`.gemini/settings.json` path (see WR-03). **Fix:** Add the one-clause caveat noting
the pure-sh installer defers JSON merging to the user / `install.mjs`.

---

_Reviewed: 2026-06-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

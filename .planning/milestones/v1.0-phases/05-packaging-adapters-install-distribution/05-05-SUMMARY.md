---
phase: 05-packaging-adapters-install-distribution
plan: 05
subsystem: install
tags: [installer, posix, node, idempotent, reversible, dry-run, safe-02, docs]
requires:
  - "05-02 standalone skills (.claude/skills/grugops*) + orchestrator subagent wrapper + CLAUDE.md pointer + .gemini wiring (the artifacts the installer lays down)"
  - "05-03 plugin form (.claude-plugin/, skills/) referenced by the README plugin path"
  - "05-04 SAFE-02 guard (hooks/guard.mjs, hooks/hooks.json) documented by the README"
  - "05-01 adapters.md (the authoritative 5-tool dispatch map + autonomy=pr fallback the README mirrors)"
provides:
  - "install/install.sh — POSIX installer (idempotent, additive, DRY_RUN, symlink-with-copy-fallback, install report)"
  - "install/install.mjs — Node installer functionally identical to install.sh (node:fs/node:path stdlib only, zero npm deps)"
  - "install/uninstall.sh — exact reversal; removes only installer-added artifacts, guards the frozen core + user files"
  - "install/install.test.sh — INSTALL-01/02 behavioral gate (double-install zero-diff, DRY_RUN no-op, uninstall cleanliness, sh==mjs parity)"
  - "install/README.md — minimal-markdown path + scripted/plugin paths + /grugops install self-bootstrap + 0.1.0 version + SAFE-02 Claude-only-guard/autonomy=pr-fallback docs"
affects:
  - "Phase-5 check-structure.sh now fully GREEN (all 8 requirements: PKG-01/02, CLAUDE-01/02/03, SAFE-02, INSTALL-01/02)"
  - "Phase-6 dogfood/validation — the installers are the entry point a real user runs"
tech-stack:
  added:
    - "POSIX sh installer (#!/usr/bin/env sh, set -eu, printf, grep -qF, small named helpers)"
    - "Node ESM installer (node:fs + node:path + node:url, zero external packages)"
  patterns:
    - "ensure_block: idempotent sentinel-delimited append-if-missing to a user file (never overwrites)"
    - "link_or_copy: D-30 symlink-with-copy-fallback, INSTALL_MODE=copy override, copied(verify) flag"
    - "read-modify-write additive JSON merge of .gemini/settings.json (Node JSON.parse; pure-sh defers to verify)"
    - "is_protected denylist guard on every uninstall removal target"
    - "test harness runs against throwaway temp fixtures with GRUGOPS_SRC/TARGET env, never mutates the repo"
key-files:
  created:
    - "install/install.sh"
    - "install/install.mjs"
    - "install/uninstall.sh"
    - "install/install.test.sh"
    - "install/README.md"
  modified: []
decisions:
  - "[05-05] install.sh and install.mjs produce a BYTE-identical target tree (verified diff -r empty), including matching JSON.stringify(null,2) layout for .gemini/settings.json — true two-language parity, not just behavioral"
  - "[05-05] installer source/target are GRUGOPS_SRC/TARGET env-overridable (default: script's repo root / cwd) so the same scripts install onto a user repo AND run hermetically in the test harness"
  - "[05-05] tests force INSTALL_MODE=copy for deterministic diffing (symlinks would carry source-path inodes); default install behavior remains symlink-with-copy-fallback per D-30"
  - "[05-05] uninstall fully reverses BOTH install paths for .gemini/settings.json: a grugops-created default file is removed wholesale; a user-customised file is trimmed of only the AGENTS.md entry with all other keys preserved"
  - "[05-05] safety-doc comments avoid writing the literal approval-var token so the threat-grep `! grep GRUGOPS_PROD_DEPLOY_APPROVED` stays clean while the behavior (never set it) is still documented in clear English"
metrics:
  duration: "~25m"
  completed: "2026-06-03"
  tasks: 3
  files: 5
---

# Phase 5 Plan 05: Installers + Install Docs Summary

Shipped the two functionally-identical installers (`install.sh` POSIX + `install.mjs` Node, byte-identical output), the exact-inverse `uninstall.sh`, the INSTALL-01/02 test harness, and the `install/README.md` that documents the minimal-markdown floor, the scripted/plugin paths, the `/grugops install` self-bootstrap, the `0.1.0` version, and the honest Claude-only-guard / `autonomy=pr`-fallback asymmetry — taking the Phase-5 structural harness fully GREEN.

## What was built

**Task 1 — `install/install.sh` + `install/install.mjs` (INSTALL-01).** Two installers that are functionally identical and produce a byte-identical target tree. They detect the host tool (heuristics over `.claude/`, `claude` on PATH, `.codex/`, `.gemini/`, `opencode.json`, `.github/`) and lay down the grugops adapter set ADDITIVELY:

- the 7 standalone skills `.claude/skills/grugops*/SKILL.md` via `link_or_copy` (D-30 symlink-with-copy-fallback; `INSTALL_MODE=copy` forces copy; copy rows reported `copied(verify)`)
- the `.claude/agents/grugops-orchestrator.md` wrapper
- the portable `AGENTS.md` (only if the target lacks one — a user's own is never overwritten)
- a `CLAUDE.md` start-here sentinel block via idempotent `ensure_block` (`grep -qF` append-if-missing)
- `.gemini/settings.json` `context.fileName` via read-modify-write (pure-sh creates the default file or flags `verify`; Node does a real `JSON.parse` merge preserving other keys)
- an optional `.github/copilot-instructions.md` pointer block

`DRY_RUN=1` narrates the plan and changes nothing. An install report marks every item `created` / `linked` / `copied(verify)` / `skipped`. Neither installer ever sets the production deploy-approval env var, and neither truncates a user-owned file (`>` is used only to create a fresh grugops-owned file when absent). `install.mjs` is Node stdlib only (`node:fs`/`node:path`/`node:url`) with zero npm dependencies. Tool-specific plugin commands are printed as `UNKNOWN - verify`, never fabricated.

**Task 2 — `install/uninstall.sh` + `install/install.test.sh` (INSTALL-02).** `uninstall.sh` is the exact inverse: it removes the 7 skills (and now-empty dirs), the wrapper, a grugops-laid `AGENTS.md` (symlink, or a copy byte-identical to source — a user's own is left), the `CLAUDE.md` sentinel block via `awk` (neutral var names to dodge BSD-awk's reserved `close`; the rest of the file is preserved), the `.gemini` AGENTS.md entry (Node-backed safe JSON edit: grugops-created default removed wholesale, user-customised file trimmed only), and the Copilot block. Every removal target passes an `is_protected` denylist guard so `agent-factory/`, `plans/`, `.planning/`, `docs/`, `src/`, and the repo root are never deleted. `DRY_RUN=1` honored. `install.test.sh` is the gate: it builds throwaway temp fixtures (the real repo is never mutated), then asserts double-install zero-diff, `DRY_RUN=1` no-op, install-then-uninstall full restore with `agent-factory/` and `plans/` surviving, and `install.sh == install.mjs` tree parity — and exits 0 `ALL CHECKS PASSED`.

**Task 3 — `install/README.md` (INSTALL-02 / SAFE-02 docs).** Documents the minimal-markdown floor (copy `AGENTS.md` + `agent-factory/`, start at `orchestrator.md`), the scripted path (`install.sh`, `DRY_RUN=1`, `install.mjs`, `INSTALL_MODE=copy`, `uninstall.sh`, the test harness), the Claude Code plugin path (`/plugin` commands flagged `UNKNOWN - verify`, only `code.claude.com` links), and the `/grugops install` self-bootstrap. States the `0.1.0` version and the `agent-factory/VERSION` + `plugin.json` synced-bump. SAFE-02 docs are in clear voice: the mechanical guard is Claude-Code-only; the other four tools rely on the `autonomy=pr` + `production_requires_human_confirmation` procedural fallback — honest about the asymmetry, never implying the guard protects all five tools. Caveman wink confined to framing; safety text is plain.

## How it was verified

- `sh -n` clean on all three shell scripts; `node --check` clean on `install.mjs`.
- `sh install/install.test.sh` exits 0 — all four behavioral checks green (idempotency, DRY_RUN no-op, uninstall cleanliness with frozen core surviving, sh/mjs parity).
- `diff -r` between an `install.sh` target and an `install.mjs` target is empty (byte-identical, after aligning the `.gemini/settings.json` JSON layout).
- Extra edge-case test: a pre-existing `.gemini/settings.json` with a `theme` key + `GEMINI.md` is preserved exactly after install→uninstall (only `AGENTS.md` trimmed).
- `! grep GRUGOPS_PROD_DEPLOY_APPROVED` clean on both installers; `! grep docs.claude.com` clean on the README.
- **Phase-5 `check-structure.sh` exits 0 — fully GREEN, all 8 requirements (PKG-01/02, CLAUDE-01/02/03, SAFE-02, INSTALL-01/02).**
- All install/uninstall testing ran against throwaway temp dirs / `DRY_RUN=1`; the repo working tree stayed clean (no stray `*.grugops.tmp.*`, no real install applied to this repo).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] BSD/macOS awk reserved-word collision in the CLAUDE.md block stripper**
- **Found during:** Task 2 (running the test harness)
- **Issue:** `uninstall.sh`'s `awk -v open=... -v close=...` used `close` as a variable name; macOS/BSD awk treats `close` as a reserved builtin, producing `awk: syntax error` and a non-zero uninstall exit that aborted the harness under `set -e`.
- **Fix:** Renamed the awk variables to neutral `op`/`cl` and simplified the pending-blank-line handling so the user's original file (including its exact trailing newline) is restored.
- **Files modified:** install/uninstall.sh
- **Commit:** 27888cb

**2. [Rule 1 - Bug] Illegal top-level `return` in the inline Node JSON unmerge**
- **Found during:** Task 2 (running the test harness)
- **Issue:** The `node -e '...'` snippet for the Gemini settings unmerge used a top-level `return`, which Node rejects in `-e` script context (`SyntaxError: Illegal return statement`), making uninstall exit non-zero.
- **Fix:** Restructured the snippet into an if/else with no top-level `return`.
- **Files modified:** install/uninstall.sh
- **Commit:** 27888cb

**3. [Rule 2 - Missing critical functionality] Full reversal of the grugops-created .gemini settings + empty Copilot file**
- **Found during:** Task 2 (uninstall-cleanliness check)
- **Issue:** Install creates `.gemini/settings.json` with `["AGENTS.md","GEMINI.md"]` and creates a fresh `.github/copilot-instructions.md` containing only the sentinel block. The first uninstall pass removed only the AGENTS.md entry (leaving `["GEMINI.md"]`) and left an empty Copilot file, so install→uninstall did not restore a pristine fixture.
- **Fix:** uninstall now removes a grugops-created default `settings.json` wholesale (only `context.fileName` with grugops-only entries → delete the file), while still trimming only AGENTS.md from a user-customised file; added `remove_if_empty` to delete a grugops-created Copilot pointer file once its block is stripped, plus `rmdir_if_empty` for `.github`.
- **Files modified:** install/uninstall.sh
- **Commit:** 27888cb

**4. [Rule 3 - Blocking issue] Safety-doc comment tripped the threat grep**
- **Found during:** Task 1 (acceptance check `! grep -q GRUGOPS_PROD_DEPLOY_APPROVED`)
- **Issue:** A header comment documenting that the installer never sets the approval var contained the literal token, failing the threat-register grep (T-05-05-EoP-1) and the plan's automated verify.
- **Fix:** Reworded the comments in both installers to describe the behavior ("never sets the production deploy-approval env var") without writing the literal token. Behavior unchanged; documentation intent preserved.
- **Files modified:** install/install.sh, install/install.mjs
- **Commit:** 0db38eb

## Authentication Gates

None — no auth required for any task.

## Known Stubs

None. All five files are live, tested artifacts wired to the existing 05-02/05-03/05-04 deliverables.

## Out-of-scope observation (not fixed)

`.planning/config.json` shows a pre-existing uncommitted single-line change (a deduplicated `branching_strategy` key) that was present before this plan ran and is unrelated to it. It was deliberately NOT staged into any task commit. Noted here per scope-boundary rules; left for the orchestrator/user.

## Self-Check: PASSED

- install/install.sh — FOUND
- install/install.mjs — FOUND
- install/uninstall.sh — FOUND
- install/install.test.sh — FOUND
- install/README.md — FOUND
- Commit 0db38eb — FOUND
- Commit 27888cb — FOUND
- Commit 38394b6 — FOUND

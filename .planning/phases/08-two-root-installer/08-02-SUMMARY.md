---
phase: 08-two-root-installer
plan: 02
subsystem: install
tags: [test-harness, posix-sh, two-root, install-03, install-04, regression-gate]
requires:
  - install/install.sh (behavioral target — drives via GRUGOPS_HOME/GRUGOPS_SRC/TARGET/INSTALL_MODE)
  - install/uninstall.sh (two-root reversal target for the D-06 assertion)
  - install/install.test.sh (the FROZEN analog copied in spirit; left byte-unedited)
provides:
  - install/install.two-root.test.sh (Phase-8-local POSIX harness — the GREEN target Plans 03/04 turn)
affects:
  - 08-03 (installer rewrite verifies against this harness)
  - 08-04 (uninstall/docs verifies against the D-06 assertion here)
tech-stack:
  added: []
  patterns:
    - "pass/fail/FAILS + content-addressed snapshot diff (mirrors install.test.sh idioms)"
    - "two-root snapshot: one manifest per ROOT ($TARGET and $GRUGOPS_HOME); absent dir → empty manifest"
    - "hermetic run_install helper: GRUGOPS_HOME/GRUGOPS_SRC/TARGET/INSTALL_MODE=copy under mktemp -d + trap cleanup"
    - "throwaway clone-shaped guard fixture (never points at $REPO_ROOT)"
    - "sh/Node parity skip-not-fail when node absent"
key-files:
  created:
    - install/install.two-root.test.sh
  modified: []
decisions:
  - "Harness ships RED-by-design: 14 assertions FAIL this wave (behaviors land in Plans 03/04), proving the harness is wired before the implementation exists. Gate is parse + run-to-completion, not pass."
  - "snapshot() extended so an ABSENT dir produces an empty manifest — makes 'never created' a legitimate diffable state for the DRY_RUN two-root assertion."
  - "Self-checkout guard exercised against $WORK/fakeclone (carries install/install.sh + agent-factory/VERSION) with TARGET=$FAKE, NEVER $REPO_ROOT (threat T-08-02-02)."
  - "sh/Node parity asserted on the HOME tree manifest + TARGET tree manifest + install.json marker bytes (the materialized KIT= line legitimately differs by absolute home path, so it is not byte-compared cross-installer)."
metrics:
  duration: 8m
  completed: 2026-06-07
  tasks: 2
  files: 1
---

# Phase 08 Plan 02: Two-Root Test Harness Summary

Phase-8-local POSIX regression harness `install/install.two-root.test.sh` that encodes the full INSTALL-03 + INSTALL-04 two-root contract (plus D-03/D-06/D-07) as 14 automated assertions across both roots, written FIRST and shipping RED so the installer rewrite (Plan 03) and uninstall/docs plan (Plan 04) have a fast (<30s) hermetic GREEN target — without ever editing the frozen `install/install.test.sh`.

## What Was Built

A single self-contained harness (344 lines) mirroring `install.test.sh`'s proven primitives (`set -eu`, `pass`/`fail`/`FAILS`, portable `DIFF`, `mktemp -d` + `trap cleanup EXIT INT TERM`, content-addressed `snapshot`) and extending them for two roots:

**Task 1 — INSTALL-04 core (assertions [1]–[7]):**
- `[1]` kit copy → `$GRUGOPS_HOME/agent-factory/roles/orchestrator.md` exists.
- `[2]` materialization → both resolver adapters (`grugops-orchestrator.md`, `grugops/SKILL.md`) carry a `grugops:materialized-kit` block resolving to `$GRUGOPS_HOME/agent-factory`.
- `[3]` seed → `.grugops/factory.config.json`, `.grugops/install.json` (marker), `plans/board.md`, `plans/handoffs/` (runtime dir absent from the repo skeleton), `memory-bank/00-index.md`.
- `[4]` never-clobber → a pre-written `.grugops/factory.config.json` sentinel survives install (D-04).
- `[5]` two-root idempotency → double-install zero diff in BOTH `$TARGET` and `$GRUGOPS_HOME` (catches a timestamped marker — Pitfall 1).
- `[6]` DRY_RUN → `DRY_RUN=1` mutates neither root.
- `[7]` copy-default → a default install (no `INSTALL_MODE` override) leaves NO symlinks in either root (D-05).

**Task 2 — INSTALL-03 + guard + uninstall + parity (assertions [8]–[12]):**
- `[8]` `--target` from an arbitrary CWD (runs the installer from `$WORK/elsewhere`).
- `[9]` `--yes` / non-TTY (stdin `</dev/null`) installs unattended, exit 0, no hang.
- `[10]` D-07 self-checkout guard → refuse-by-default (nonzero, message names `--allow-self`); `--allow-self` overrides — via a throwaway `$WORK/fakeclone` fixture, never `$REPO_ROOT`.
- `[11]` D-06 two-root uninstall → shared kit + seeded config survive; marker + adapters removed.
- `[12]` sh/Node byte-parity (target tree + home tree + marker bytes; skip-with-note when `node` absent).

Result block: `exit 1` on any fail, mirroring `install.test.sh`.

## How It Was Verified

- `sh -n install/install.two-root.test.sh` parses cleanly (valid POSIX) after both tasks.
- All Task 1 + Task 2 source-grep acceptance assertions pass (`mktemp -d`, `GRUGOPS_HOME=`, `snapshot`, `grugops:materialized-kit`, `plans/handoffs`, `install.json`, `--allow-self`, `fakeclone`, `uninstall.sh`, `command -v node`, `--target`).
- `git diff --quiet -- install/install.test.sh` succeeds — the frozen harness is byte-unedited.
- `sh install/install.two-root.test.sh` runs to completion: 14 FAILs (RED this wave for kit-copy / materialization / seed / copy-default / `--target` / guard-refuse / uninstall-survival / parity — all land in Plans 03/04) and the vacuously-satisfied checks pass. Exit 1.
- `sh install/install.test.sh` → exit 0, ALL CHECKS PASSED (the frozen 7-check gate stays green).
- `git status --short` confirms only the harness changed — every install/guard run was hermetic under `mktemp -d`; the real repo, `$HOME`, and any real `$GRUGOPS_HOME` were never written (threats T-08-02-01/02/03 mitigated).

## Deviations from Plan

None — plan executed exactly as written. The 14 RED assertions are the intended Wave-1 state per the plan's "(RED expected this wave)" acceptance criteria; the gate is parse + run-to-completion, which both passed.

## Threat Surface Scan

No new security-relevant surface introduced. The harness reads/writes only `mktemp -d` temp dirs, sets no deploy-approval env var (T-08-02-04 accept holds), and runs no package-manager installs (T-08-02-SC accept holds). The D-07 guard fixture is a throwaway clone under `$WORK`, never the real checkout (T-08-02-02 mitigate verified by grep: the guard uses `TARGET="$FAKE"` only).

## Self-Check: PASSED

- FOUND: install/install.two-root.test.sh
- FOUND commit: 64917e0 (Task 1)
- FOUND commit: 6e0a506 (Task 2)
- FROZEN-UNEDITED: install/install.test.sh (git diff --quiet succeeds)

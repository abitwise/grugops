---
kind: checklist
tier: enterprise
---
# Linter Recommendations

Apply this reference when configuring the lint step at the quality gate. grugops ships no
linter and installs nothing; the host owns its linter. This file records the recommended tool
per stack and the exact strict and safe-autofix invocations to wire into the gate.

The gate's lint step points to this file by name; it does not restate the table. The lint step
reads `quality.lint` from `.grugops/factory.config.json` to decide how strictly to run.

## Per-stack linters

| Stack | Recommended tool | Lint | Strict (`strict: true`) | Safe autofix (`autofix: true`) |
|-------|------------------|------|-------------------------|--------------------------------|
| JS / TS / Vue | **ESLint flat config** (`eslint.config.js`) — the **default** | `eslint .` | `eslint . --max-warnings 0` | `eslint . --fix` (optionally `--fix-type problem,suggestion,layout`) |
| JS / TS (non-Vue) | `@biomejs/biome` `2.5.0` — **qualified alternative**, not the Vue default | `biome lint .` | `biome lint --error-on-warnings .` | `biome lint --write .` |
| Python | **Ruff** | `ruff check .` | `ruff check --exit-non-zero-on-fix .` | `ruff check --fix .` |
| Go | **golangci-lint v2** | `golangci-lint run` | `golangci-lint run` (any issue → exit 1) | `golangci-lint run --fix` |
| Unknown / other | — | — | — | — → record `UNKNOWN - verify` |

### Notes per tool

- **ESLint** is the default for JS/TS/Vue and matches grugops's own stack. Flat config
  (`eslint.config.js`) is the default in both the v9 maintenance line (`9.39.4`) and v10
  (`10.5.0`). The default `--max-warnings` is `-1` (unlimited); `--max-warnings 0` makes any
  warning fail the build. `--fix` applies safe fixes in place; `--fix-type problem,suggestion,layout`
  scopes the autofix and omits `directive` fixes.
- **Biome** (`@biomejs/biome` `2.5.0`) is a qualified alternative, **not** the Vue default — it
  has narrower rule coverage, a younger ecosystem, and experimental Vue SFC support. Offer it
  as the non-Vue fast option only. `biome lint --write` applies safe fixes only (the unsafe
  fixes behind `--unsafe` are not used for safe autofix).
- **Ruff** applies safe fixes by default with `--fix` (unsafe fixes require `--unsafe-fixes`).
  Ruff has no warning/error tier like ESLint; strict maps to `--exit-non-zero-on-fix` so a
  fixed violation still exits non-zero, recording that an issue existed rather than hiding it.
- **golangci-lint v2** exits 1 when issues are found (`--issues-exit-code` defaults to 1) and
  applies fixer-supported fixes with `--fix`. Strictness is governed by which linters are
  enabled in the config, not a `--max-warnings` analog; treat "any issue → exit 1" as the gate
  signal. Its config filename is recorded `UNKNOWN - verify` (not confirmed in research).

## Config-dial wiring (`quality.lint`)

- `strict: true` → fail the gate on any warning (use the strict column above).
- `strict: false` → report warnings; only errors fail the gate.
- `autofix: true` → run the safe autofix, then re-lint; remaining findings are reported.
- `autofix: false` → report findings only; apply no fixes.

## No linter configured

If a stack has no configured linter, record `UNKNOWN - verify` for the lint step — non-blocking.
Never fake a passing lint result: a fabricated "lint passed" breaks the trace, which is the
whole value of the gate. An unknown stack records `UNKNOWN - verify` rather than guessing a tool.

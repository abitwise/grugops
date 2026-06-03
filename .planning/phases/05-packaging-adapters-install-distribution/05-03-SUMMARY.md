---
phase: 05-packaging-adapters-install-distribution
plan: 03
subsystem: packaging-plugin-form
tags: [claude-code-plugin, marketplace, skills, manifest, single-source, pointer-text]
requires:
  - "agent-factory/VERSION (0.1.0 — the version string plugin.json mirrors)"
  - "agent-factory/roles/orchestrator.md + release-manager.md (pointer targets)"
  - "agent-factory/workflows/*.md (00,01,02,03,04,05,06,12 — pointer targets)"
  - "hooks/ at plugin root (plan 05-04; completes the plugin tree for validate --strict)"
  - "agent-factory/packaging/slash-command.template.md (PKG-02 skill shape, plan 05-01)"
  - ".claude/skills/grugops*/SKILL.md (plan 05-02 standalone bodies — reused verbatim)"
provides:
  - ".claude-plugin/plugin.json (manifest: name grugops, version 0.1.0, no component keys)"
  - ".claude-plugin/marketplace.json (single-plugin catalog grugops; entry source ./, no entry version)"
  - "skills/<op>/SKILL.md x7 at plugin root → /grugops:<op> colon command surface"
affects:
  - "Phase 6 dogfood (DOG-01/02): the plugin install/cache path is the decisive proof of the repo-relative pointer-text resolution"
  - "Release process (D-28): plugin.json version bumps in lockstep with agent-factory/VERSION + factory.config.json"
tech-stack:
  added: []
  patterns:
    - "Claude Code plugin form: .claude-plugin/ holds ONLY plugin.json + marketplace.json; skills/ + hooks/ at plugin ROOT (D-37)"
    - "Plugin namespace asymmetry: plugin dirs OMIT the grugops- prefix; /<plugin>:<dir> colon namespacing supplies it → /grugops:plan (D-29 / Pitfall 5)"
    - "Repo-relative pointer-text bodies (D-31): skills point at agent-factory/* resolved against the user's repo — never ../ filesystem paths (the plugin-cache landmine), never copied role bodies"
    - "Version single-source (D-28): plugin.json version == agent-factory/VERSION; marketplace entry omits version (plugin.json wins)"
    - "disable-model-invocation: true on the destructive release skill (T-05-03-EoP-1)"
key-files:
  created:
    - ".claude-plugin/plugin.json"
    - ".claude-plugin/marketplace.json"
    - "skills/grugops/SKILL.md"
    - "skills/plan/SKILL.md"
    - "skills/map/SKILL.md"
    - "skills/ticket/SKILL.md"
    - "skills/gate/SKILL.md"
    - "skills/uat/SKILL.md"
    - "skills/release/SKILL.md"
  modified: []
  deleted:
    - ".claude-plugin/.gitkeep (placeholder removed — dir now holds real manifests)"
decisions:
  - "Added a top-level marketplace `description` because `claude plugin validate ./ --strict` (the authoritative gate) flagged its absence as a strict-mode error (Open Question 2 / #38480). The plan permitted omitting it 'unless the validator objects' — it did, so the manifest was adjusted per its output rather than fabricating a pass."
metrics:
  duration: 6m
  completed: 2026-06-03
---

# Phase 05 Plan 03: Claude Code Plugin Form Summary

Shipped the versioned, marketplace-distributable Claude Code plugin surface (CLAUDE-02, CLAUDE-03): a `.claude-plugin/plugin.json` (name `grugops`, version `0.1.0` mirroring `agent-factory/VERSION` per D-28, no component-path keys) + a single-plugin `.claude-plugin/marketplace.json` catalog (entry `source: "./"`, no entry version), and seven plugin-root `skills/<op>/SKILL.md` whose dirs omit the `grugops-` prefix so Claude Code's `/<plugin>:<dir>` colon namespacing renders `/grugops:plan` … `/grugops:release`. Every skill body is repo-relative pointer-text into the frozen `agent-factory/` core (single-source, cache-safe), and `claude plugin validate ./ --strict` passes (exit 0).

## What Was Built

### Task 1 — `.claude-plugin/{plugin.json, marketplace.json}` (commits `86bcd17`, `0235b2c`)
- **plugin.json**: `name: "grugops"` (the namespace → `/grugops:<command>`), `version: "0.1.0"` (asserted equal to `agent-factory/VERSION` in the verify step, D-28), `description`, `author` (Olger Oeselg / abitwise@gmail.com), `homepage`/`repository`, `license: "MIT"`, `keywords`. **No** `skills`/`hooks`/`agents` component-path keys — default root auto-discovery finds `skills/` and `hooks/hooks.json`.
- **marketplace.json**: catalog `name: "grugops"`, `owner.{name,email}`, `plugins: [{ name: "grugops", source: "./", description }]`. The entry carries **no** `version` key (D-28 — plugin.json wins; the validator flags a mismatch).
- Removed the obsolete `.claude-plugin/.gitkeep`; the directory now holds **only** the two manifests (D-37), confirmed by the phase harness.

### Task 2 — 7 plugin-root colon-form skills + `validate --strict` (commit `0d9de63`)
- `skills/grugops/SKILL.md` (bare dispatcher), `skills/plan`, `skills/map`, `skills/ticket`, `skills/gate`, `skills/uat`, `skills/release` — 7 total at plugin ROOT. Dirs **omit** the `grugops-` prefix (the plugin name supplies it) → `/grugops:plan` … avoiding the doubled `/grugops:grugops-plan`.
- Bodies reuse the plan-05-02 standalone pointer-text verbatim (only the `name:` frontmatter changed to the bare op name): each points at `agent-factory/roles/orchestrator.md` → config / root `AGENTS.md` / `plans/board.md`, then the op's workflow under `agent-factory/workflows/`. **No** `../agent-factory` filesystem paths (the plugin-cache landmine, D-31), **no** copied role/workflow bodies (dup-check: 0 hits under `skills/`).
- `skills/release/SKILL.md` carries `disable-model-invocation: true` (T-05-03-EoP-1) so the model can never auto-fire a release — it pairs with the SAFE-02 mechanical deploy guard from plan 05-04.

## Verification Results

| Check | Result |
|-------|--------|
| plugin.json name=grugops, version==VERSION (0.1.0), no component keys | PASS |
| marketplace.json valid: name+owner.name+plugins[], entry `source: "./"`, no entry version | PASS |
| `ls skills/*/SKILL.md \| wc -l` == 7 | PASS (7) |
| skills/release has `disable-model-invocation: true` | PASS |
| no `../agent-factory` under skills/ (cache-landmine grep) | PASS |
| role-body dup-check ("You enforce WIP limits." sentence) under skills/ | PASS (0 hits) |
| skill dirs omit `grugops-` prefix (dispatcher dir `grugops` only) | PASS |
| **`claude plugin validate ./ --strict`** | **PASS (exit 0)** — authoritative gate, NOT fabricated |
| Phase-05 harness CLAUDE-02 + CLAUDE-03 blocks | PASS (all green) |

The phase harness still reports 4 FAILs under INSTALL-01/INSTALL-02 (`install/install.sh`, `install.mjs`, `uninstall.sh`, `README.md`) — these are the install wave, **out of scope** for this plan; the harness explicitly documents "RED is EXPECTED until Waves 2-3 land." All checks in this plan's CLAUDE-02/03 scope are green.

## Deviations from Plan

### Validator-driven manifest adjustment (planned contingency, not a Rule deviation)

**marketplace.json top-level `description` added**
- **Found during:** Task 2, on the first `claude plugin validate ./ --strict` run.
- **Issue:** strict mode treats the warning "No marketplace description provided" as an error (Open Question 2 / claude-code #38480). The first run exited 1.
- **Fix:** added a top-level `description` to `marketplace.json` and re-ran; the validator then exited 0. The plan explicitly authorized this — "Per Open Question 2, OMIT a top-level marketplace `description`; if `claude plugin validate --strict` later objects, treat its output as authoritative and adjust." This is the planned contingency path, executed exactly. No pass was fabricated; the gate genuinely passes.

### Process note (no functional impact)
- Task 1's first commit (`86bcd17`) captured only the `.gitkeep` deletion because a stray `git add` pathspec aborted before the manifests were staged. Caught immediately via `git status`; a follow-up commit (`0235b2c`) added the two manifest bodies. Net result is correct and both files are tracked. No content was lost.

## Threat Model Outcomes

| Threat ID | Disposition | Outcome |
|-----------|-------------|---------|
| T-05-03-Tamper-1 (`../agent-factory` cache landmine) | mitigate | Repo-relative pointer-text only; grep confirms 0 `../agent-factory` paths under `skills/`. Decisive proof deferred to the Phase-6 dogfood (DOG-01/02). |
| T-05-03-Tamper-2 (components inside `.claude-plugin/`) | mitigate | skills/ + hooks/ at plugin root (D-37); `.claude-plugin/` holds only the two manifests (harness PASS); `validate --strict` is the authoritative structural gate (PASS). |
| T-05-03-Info-1 (version drift) | mitigate | plugin.json version asserted == VERSION (0.1.0); marketplace entry omits version (D-28). |
| T-05-03-EoP-1 (agent auto-fires release) | mitigate | `disable-model-invocation: true` on `skills/release/SKILL.md`. |
| T-05-03-SC (package installs) | accept | This plan installs ZERO external packages — markdown + JSON only. |

No new threat surface beyond the threat model — no Threat Flags.

## Self-Check: PASSED

All created files exist on disk; all three commit hashes are present in git history (`86bcd17`, `0235b2c`, `0d9de63`).

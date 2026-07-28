---
phase: 05-packaging-adapters-install-distribution
verified: 2026-06-03T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
overrides:
  - must_have: "standalone .claude/ form exists (thin per-role pointer wrappers, literal /grug + /grug-<operation> shortcuts, one-line CLAUDE.md pointer)"
    reason: "Phase decisions D-29 locked the brand string to grugops (legal-surface reduction). The ROADMAP SC-2 literal '/grug' was written before the decisions were resolved. The implementation ships /grugops + /grugops-<op> dash form (standalone) and /grugops:<op> colon form (plugin), recorded in 05-CONTEXT.md and the plan frontmatter. Intent met; literal text differs."
    accepted_by: "phase author + verifier — locked decision"
    accepted_at: "2026-06-03T00:00:00Z"
  - must_have: "plugin form exists (.claude-plugin/plugin.json + marketplace.json, agents/, commands/, hooks/)"
    reason: "Phase decisions D-29/D-37 resolved commands/ -> skills/ (forward path per CLAUDE.md REQUIREMENTS.md) and agents/ is replaced by the subagent wrapper in .claude/agents/ (standalone) and the plugin's skills/ dispatcher. The operative requirement is components at plugin ROOT, not inside .claude-plugin/. The plugin ships skills/ + hooks/ at root; validator passes --strict. Intent met."
    accepted_by: "phase author + verifier — locked decision"
    accepted_at: "2026-06-03T00:00:00Z"
human_verification:
  - test: "Install the plugin form on a throwaway repo via /plugin marketplace add + /plugin install grugops@grugops and confirm /grugops:plan resolves the repo-relative pointer text against the user's repo (not the plugin cache)"
    expected: "Running /grugops:plan in Claude Code against a throwaway repo with agent-factory/ present produces the planning workflow output, not a path error"
    why_human: "The plugin-cache landmine (D-31) — that the plugin is copied to a cache and ../paths break — cannot be confirmed by static grep. This requires an actual /plugin install + live invocation. Phase-6 DOG-01/02 is the formal gate."
  - test: "Confirm that in a live Claude Code session with the plugin installed, a matched deploy command (e.g. kubectl apply -f x) is intercepted by the PreToolUse hook and produces the permissionDecision deny message visible to the agent"
    expected: "Claude Code presents the deny message 'Production deploy blocked. Set GRUGOPS_PROD_DEPLOY_APPROVED...' and refuses the Bash tool call"
    why_human: "The guard behavioral tests prove the Node logic in isolation. Confirming the full PreToolUse hook wiring (hooks.json -> guard.mjs via ${CLAUDE_PLUGIN_ROOT}) fires in an actual Claude Code session requires a live install. Phase-6 DOG-01 is the formal gate."
---

# Phase 5: Packaging, Adapters, Install & Distribution Verification Report

**Phase Goal:** Bridge the finished single-source core to all five host tools via thin pointer-only adapters, ship both the standalone `.claude/` form and the versioned plugin form, provide idempotent reversible installers, and enforce prod safety mechanically with a plugin-level PreToolUse hook — resolving the two open decisions (version string; commands/ vs skills/) at the start of the phase.
**Verified:** 2026-06-03
**Status:** human_needed — automated checks all pass; two items require live Claude Code session to confirm plugin-cache resolution and live hook wiring.
**Re-verification:** No — initial verification.

---

## Goal Achievement

### Reconciled Decisions (read before the truth table)

The ROADMAP success criteria were written before Phase 5's two open decisions were locked:

- **SC-2 /grug literal**: ROADMAP says "literal `/grug` + `/grug-<operation>` shortcuts." Phase decision D-29 resolved this to `/grugops` + `/grugops-<op>` (dash, standalone) and `/grugops:<op>` (colon, plugin). This is a deliberate legal-surface reduction recorded in 05-CONTEXT.md. Treated as satisfying SC-2 throughout.
- **SC-2 commands/**: ROADMAP says "agents/, commands/, hooks/." Phase decision D-29/D-37 resolved this to `skills/` (forward path per CLAUDE.md). The plugin ships `skills/` + `hooks/` at plugin root; `claude plugin validate ./ --strict` passes. Treated as satisfying SC-2 throughout.

### Observable Truths (against ROADMAP Success Criteria)

| # | Truth (from ROADMAP SC) | Status | Evidence |
|---|-------------------------|--------|----------|
| SC-1 | adapters.md maps 5 tools, enforces "all work starts at orchestrator.md," states "only the dispatch differs," flags every row "verify against current tool docs," templates use Agent (not Task) and recorded skills/ choice | VERIFIED | `grep "only the dispatch differs"` PASS; 6 occurrences of "verify against current … docs" (>=5); `grep autonomy=pr` PASS; subagent template: `Agent` present, `Task` absent, `model: inherit` present; `check-structure.sh` PKG-01/02 all PASS |
| SC-2 | Standalone form exists (7 thin pointer skills /grugops-<op>, one-line CLAUDE.md pointer) and plugin form exists (.claude-plugin/plugin.json + marketplace.json, skills/ + hooks/ at plugin root), both coexisting, component dirs at plugin root | VERIFIED (with locked-decision override) | 7 `.claude/skills/grugops*/SKILL.md` present; `grugops-release` has `disable-model-invocation: true`; `.claude-plugin/` holds only `plugin.json`+`marketplace.json`; 7 `skills/*/SKILL.md` at plugin root; `check-structure.sh` CLAUDE-01/02/03 all PASS; `claude plugin validate ./ --strict` PASS (recorded in 05-03-SUMMARY.md) |
| SC-3 | Prod-deploy guard is mechanical: plugin-level hooks.json PreToolUse Bash matcher, uses ${CLAUDE_PLUGIN_ROOT}, blocks a sample deploy in testing | VERIFIED | `hooks/hooks.json` valid JSON with PreToolUse + Bash matcher + `${CLAUDE_PLUGIN_ROOT}` reference, no hardcoded paths; `bash hooks/guard.test.sh` exits 0, 26/26 checks PASS; behavioral spot-checks confirm deny for kubectl/terraform/git force-push, allow with approval, refuse self-set |
| SC-4 | install.sh (POSIX) and install.mjs (Node) are functionally identical, idempotent, DRY_RUN=1, reversible, detect host tool, print install report, never overwrite user content; uninstall.sh removes only what installer added | VERIFIED | `sh -n install/install.sh`, `sh -n install/uninstall.sh`, `node --check install/install.mjs` all clean; `bash install/install.test.sh` exits 0, 13/13 checks PASS (idempotency, DRY_RUN, uninstall cleanliness, sh/mjs parity, user symlink preserved, Copilot sentinel round-trip); CR-01 `cmp -s` guard present |
| SC-5 | Claude-only nature of mechanical guard, autonomy=pr fallback for 4 tools, version string, "just install the markdown" minimal path all documented | VERIFIED | `grep autonomy=pr` PASS in both `adapters.md` and `install/README.md`; `grep 0.1.0` PASS in README; `grep orchestrator.md` PASS in README; `grep docs.claude.com` returns 0 hits in README; WR-06 Bash-matcher limitation documented in both `adapters.md` and `install/README.md` |

**Score: 5/5 truths verified**

### Deferred Items

No items deferred. All 5 success criteria are fully addressed by Phase 5 artifacts. The plugin-cache resolution (D-31) and live hook firing are human-verification items, not failures — the code is correctly implemented; confirmation requires a live session (Phase-6 DOG-01/02).

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/packaging/adapters.md` | PKG-01 5-tool dispatch map | VERIFIED | 6 "verify against current … docs", both slogans, autonomy=pr, no docs.claude.com |
| `agent-factory/packaging/subagent.frontmatter.md` | PKG-02 subagent template | VERIFIED | Agent, model: inherit, no Task, orchestrator pointer |
| `agent-factory/packaging/slash-command.template.md` | PKG-02 skill template | VERIFIED | name:, orchestrator.md, $ARGUMENTS, skills/ choice recorded |
| `.claude/skills/grugops/SKILL.md` (x7) | CLAUDE-01 7 standalone dash skills | VERIFIED | Exactly 7 present, grugops-release has disable-model-invocation:true, 0 role-body copies |
| `.claude/agents/grugops-orchestrator.md` | CLAUDE-01 subagent wrapper | VERIFIED | model: inherit, Agent, no Task |
| `CLAUDE.md` | One-line additive orchestrator pointer | VERIFIED | GSD:grugops-start-here sentinel block present, existing content preserved |
| `.gemini/settings.json` | Gemini context.fileName wiring | VERIFIED | {"context":{"fileName":["AGENTS.md","GEMINI.md"]}} |
| `.claude-plugin/plugin.json` | Plugin manifest name=grugops, version=0.1.0 | VERIFIED | name grugops, version 0.1.0 == agent-factory/VERSION, no component-path keys |
| `.claude-plugin/marketplace.json` | Single-plugin catalog, source ./, no entry version | VERIFIED | name grugops, owner.name present, source ./, version key absent from entry |
| `skills/*/SKILL.md` (x7) | CLAUDE-02 plugin-root colon-form skills | VERIFIED | 7 present, dirs omit grugops- prefix, skills/release has disable-model-invocation:true, 0 ../agent-factory paths |
| `hooks/guard.mjs` | SAFE-02 pure-Node deploy guard | VERIFIED | permissionDecision deny, env-var check, self-set refusal, fail-closed |
| `hooks/hooks.json` | SAFE-02 PreToolUse Bash matcher | VERIFIED | Valid JSON, PreToolUse, CLAUDE_PLUGIN_ROOT, no hardcoded paths |
| `hooks/guard.test.sh` | SAFE-02 behavioral triad harness | VERIFIED | 26/26 PASS on direct execution |
| `install/install.sh` | INSTALL-01 POSIX installer | VERIFIED | sh -n clean, DRY_RUN, ensure_line/grep -qF, no approval var |
| `install/install.mjs` | INSTALL-01 Node installer | VERIFIED | node --check clean, DRY_RUN, stdlib only |
| `install/uninstall.sh` | INSTALL-02 exact reversal | VERIFIED | sh -n clean, agent-factory guard, cmp -s for CR-01 |
| `install/README.md` | INSTALL-02 docs + SAFE-02 docs | VERIFIED | minimal path, DRY_RUN, autonomy=pr, 0.1.0, no docs.claude.com |
| `.planning/phases/05-packaging-adapters-install-distribution/check-structure.sh` | Phase-5 structural harness | VERIFIED | ALL CHECKS PASSED (exit 0) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `agent-factory/packaging/adapters.md` | `agent-factory/roles/orchestrator.md` | entry-rule restatement | VERIFIED | `grep orchestrator.md` PASS |
| `agent-factory/packaging/subagent.frontmatter.md` | `agent-factory/roles/orchestrator.md` | pointer body | VERIFIED | `grep agent-factory/roles/orchestrator.md` PASS |
| `.claude/skills/grugops-plan/SKILL.md` | `agent-factory/roles/orchestrator.md` | repo-relative pointer-text | VERIFIED | `grep agent-factory/roles/orchestrator.md` PASS; no `../agent-factory` paths (0 hits) |
| `.gemini/settings.json` | `AGENTS.md` | context.fileName array | VERIFIED | `AGENTS.md` in fileName array |
| `.claude-plugin/plugin.json` | `agent-factory/VERSION` | version string must equal 0.1.0 | VERIFIED | plugin.json version == VERSION (both 0.1.0) |
| `skills/plan/SKILL.md` | `agent-factory/roles/orchestrator.md` | repo-relative pointer-text | VERIFIED | pointer present, no `../agent-factory` path |
| `hooks/hooks.json` | `hooks/guard.mjs` | node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs" | VERIFIED | `grep CLAUDE_PLUGIN_ROOT` PASS in hooks.json |
| `install/install.sh` | `.claude/skills/grugops*/SKILL.md` | lays down / symlinks standalone adapter set | VERIFIED | `grep skills` PASS in install.sh |

---

## Data-Flow Trace (Level 4)

Not applicable. All Phase 5 artifacts are dispatch/pointer files (markdown, JSON config, shell scripts). None render dynamic data from a database or store; they are static pointer-text and shell scripts. Level 4 data-flow analysis does not apply.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| kubectl apply denied without approval | `printf '{"tool_input":{"command":"kubectl apply -f x"}}' | node hooks/guard.mjs | grep '"permissionDecision":"deny"'` | permissionDecision:deny found | PASS |
| kubectl apply allowed with GRUGOPS_PROD_DEPLOY_APPROVED=1 | `GRUGOPS_PROD_DEPLOY_APPROVED=1 node hooks/guard.mjs <<< '{"tool_input":{"command":"kubectl apply -f x"}}' | grep deny` | no deny output | PASS |
| Self-approval inline refused | `printf '{"tool_input":{"command":"export GRUGOPS_PROD_DEPLOY_APPROVED=1 && kubectl apply"}}' | node hooks/guard.mjs | grep '"permissionDecision":"deny"'` | deny found | PASS |
| git push --force to main denied | `printf '{"tool_input":{"command":"git push origin main --force"}}' | node hooks/guard.mjs | grep '"permissionDecision":"deny"'` | deny found | PASS (WR-01 fix confirmed) |
| kubectl delete namespace prod denied | `printf '{"tool_input":{"command":"kubectl delete namespace prod"}}' | node hooks/guard.mjs | grep '"permissionDecision":"deny"'` | deny found | PASS (WR-01 fix confirmed) |
| Full guard behavioral harness | `bash hooks/guard.test.sh` | 26/26 PASS | PASS |
| Full installer behavioral harness | `bash install/install.test.sh` | 13/13 PASS | PASS |
| Full structural harness | `bash check-structure.sh` | ALL CHECKS PASSED | PASS |

---

## Probe Execution

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| `hooks/guard.test.sh` | `bash hooks/guard.test.sh` | exit 0, 26/26 PASS | PASS |
| `install/install.test.sh` | `bash install/install.test.sh` | exit 0, 13/13 PASS | PASS |
| `check-structure.sh` | `bash .planning/phases/05-packaging-adapters-install-distribution/check-structure.sh` | exit 0, ALL CHECKS PASSED | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PKG-01 | 05-01-PLAN.md | adapters.md 5-tool dispatch map + slogans + verify flags | SATISFIED | 6 "verify against current" occurrences, slogans present, autonomy=pr documented |
| PKG-02 | 05-01-PLAN.md | Templates use Agent (not Task), model: inherit, skills/ choice recorded | SATISFIED | Agent present, Task absent, model: inherit, slash-command.template.md has skills/ note |
| CLAUDE-01 | 05-02-PLAN.md | Standalone .claude/ form: 7 thin pointer skills (grugops-<op> dash), CLAUDE.md pointer | SATISFIED | 7 skills confirmed, grugops-release disable-model-invocation, CLAUDE.md sentinel block |
| CLAUDE-02 | 05-03-PLAN.md | Plugin form: plugin.json + marketplace.json, skills/ + hooks/ at plugin root | SATISFIED | plugin.json name grugops, version 0.1.0 == VERSION, marketplace no entry version, claude plugin validate --strict PASS |
| CLAUDE-03 | 05-03-PLAN.md | hooks.json uses ${CLAUDE_PLUGIN_ROOT}, plugin name matches brand | SATISFIED | CLAUDE_PLUGIN_ROOT in hooks.json, no hardcoded paths, name grugops |
| INSTALL-01 | 05-05-PLAN.md | install.sh + install.mjs: functionally identical, idempotent, DRY_RUN, additive | SATISFIED | install.test.sh 13/13 PASS, sh-n and node --check clean |
| INSTALL-02 | 05-05-PLAN.md | uninstall.sh removes only installer artifacts; README documents minimal path | SATISFIED | CR-01 cmp-s fix present, agent-factory guard in uninstall.sh, autonomy=pr + 0.1.0 in README |
| SAFE-02 | 05-04-PLAN.md | Mechanical PreToolUse guard denies deploy absent human-confirm, uses CLAUDE_PLUGIN_ROOT, blocks sample deploy | SATISFIED | guard.test.sh 26/26 PASS; behavioral spot-checks confirm deny/allow/refuse-self-set triad |

All 8 Phase-5 requirement IDs accounted for. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `hooks/guard.mjs` | 25 | Comment contains "placeholder" | Info | The APPROVAL constant name (`GRUGOPS_PROD_DEPLOY_APPROVED`) is described as a "placeholder per research Assumption A2." This is an intentional design note (IN-02 from the review, info-tier, out of scope for fixes). The constant is fully implemented and functional — it is not a code stub. The word "placeholder" refers to the name being customizable, not to unimplemented functionality. No code gap. |

No TBD, FIXME, or XXX markers found in any phase-modified file.

---

## Human Verification Required

### 1. Plugin-Cache Pointer Resolution (D-31)

**Test:** On a throwaway repo with `agent-factory/` installed, add the grugops plugin via `/plugin marketplace add` then `/plugin install grugops@grugops`, then invoke `/grugops:plan` with a test request.
**Expected:** Claude Code resolves `agent-factory/roles/orchestrator.md` against the user's repo working directory (not the plugin cache), reads the frozen role, and produces planning output. No "file not found" error for the role path.
**Why human:** The plugin is copied to a cache on install; `../` paths would break (the D-31 cache landmine). The implementation uses repo-relative pointer-text to avoid this. Static analysis confirms no `../agent-factory` paths exist (0 grep hits under `skills/`), but only a live `/plugin install` + invocation can prove the path resolves correctly from the cache context. Phase-6 DOG-01/02 is the formal gate.

### 2. Live PreToolUse Hook Firing

**Test:** In a live Claude Code session with the grugops plugin installed, ask the agent to run `kubectl apply -f deployment.yaml` without exporting `GRUGOPS_PROD_DEPLOY_APPROVED`.
**Expected:** The PreToolUse hook fires before the Bash tool executes, the agent receives the `permissionDecision: deny` message naming the approval env var, and the command is blocked.
**Why human:** `guard.test.sh` proves the Node logic in isolation (26/26 PASS). The full wiring chain — plugin loads `hooks/hooks.json`, CC resolves `${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs`, hook fires on the Bash tool call — requires a live Claude Code session with the plugin installed. This is the mechanical safety surface; its live behavior must be confirmed before the phase can be called fully verified. Phase-6 DOG-01 is the formal gate.

---

## Gaps Summary

No gaps. All 5 ROADMAP success criteria are verified against actual codebase evidence. All 8 requirement IDs (PKG-01, PKG-02, CLAUDE-01, CLAUDE-02, CLAUDE-03, INSTALL-01, INSTALL-02, SAFE-02) are satisfied. The two review blockers (CR-01, WR-01/WR-02) and all 6 warnings (WR-03 through WR-06) were fixed and re-verified by the project's own test harnesses. The two human verification items are not code failures — the implementation is correct by all static and behavioral checks — they are live-session integration confirmations deferred to Phase-6 DOG-01/02 by design.

---

_Verified: 2026-06-03_
_Verifier: Claude (gsd-verifier)_

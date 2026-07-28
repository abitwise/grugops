---
phase: 05
slug: packaging-adapters-install-distribution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-03
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 5 deliverables are structural/markdown + two installer scripts + a Node guard.
> Validate by **structure presence**, **schema validity** (`claude plugin validate --strict`),
> and **behavioral spot-checks** (guard deny/allow/refuse-self-set; install idempotency).
> Per-task rows are populated during planning/execution; the requirement→test map below is
> the verified contract from `05-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Project structural harness (`check-structure.sh` style — shell asserts, the V-01..V-13 pattern from Phases 3–4) + `claude plugin validate --strict` for plugin/marketplace schema + pure shell+node fixtures for the guard |
| **Config file** | none — shell harness; Wave 0 extends it with Phase-5 asserts |
| **Quick run command** | `sh agent-factory/<harness>/check-structure.sh` (per-task presence/section asserts) — exact path `UNKNOWN - verify` against the Phase 3–4 harness location |
| **Full suite command** | `claude plugin validate ./ --strict` + the full structural harness + the guard behavioral triad |
| **Estimated runtime** | ~10–30 seconds (no compilation; greps + one node invocation + a temp-repo copy) |

---

## Sampling Rate

- **After every task commit:** the relevant structural grep / single guard invocation for that task
- **After every plan wave:** `claude plugin validate ./ --strict` + full structural harness
- **Before `/gsd-verify-work`:** guard behavioral triad green (deny / allow / refuse-self-set) **+** validate clean **+** run-twice-no-diff
- **Max feedback latency:** ~30 seconds

---

## Requirement → Test Map (verified contract)

| Req ID | Behavior | Test Type | Automated Command (illustrative) | File Exists |
|--------|----------|-----------|----------------------------------|-------------|
| PKG-01 | `adapters.md` exists, maps 5 tools, has "only the dispatch differs" + per-row "verify against current tool docs" | structural | `grep -q "only the dispatch differs" agent-factory/packaging/adapters.md && grep -c "verify against current tool docs" agent-factory/packaging/adapters.md` | ❌ Wave 0 |
| PKG-02 | templates use `Agent` (not legacy `Task`), `model: inherit` | structural | `grep -q "Agent" agent-factory/packaging/subagent.frontmatter.md && ! grep -qw "Task" agent-factory/packaging/subagent.frontmatter.md` | ❌ Wave 0 |
| CLAUDE-01 | 7 standalone dash skills exist; role body pointer-only (no copied role text) | structural + dup-check | `ls .claude/skills/grugops*/SKILL.md \| wc -l` (=7); grep a distinctive role sentence → expect 0 hits in skills | ❌ Wave 0 |
| CLAUDE-02 | `plugin.json` valid + name=grugops; `skills/`+`hooks/` at plugin root; components NOT in `.claude-plugin/` | schema | `claude plugin validate ./ --strict` | ❌ Wave 0 |
| CLAUDE-03 | hook + scripts use `${CLAUDE_PLUGIN_ROOT}`; no hardcoded absolute paths | structural | `grep -q 'CLAUDE_PLUGIN_ROOT' hooks/hooks.json && ! grep -qE '/Users/\|/home/' hooks/*` | ❌ Wave 0 |
| INSTALL-01 | run-twice → zero diff; `DRY_RUN=1` prints only | behavioral | `cp -r repo a; (cd a; sh install/install.sh; sh install/install.sh); diff -r` (expect none); `DRY_RUN=1 sh install/install.sh` (no fs change) | ❌ Wave 0 |
| INSTALL-02 | uninstall removes only added artifacts; `agent-factory/` untouched | behavioral | `sh install/install.sh; sh install/uninstall.sh; git status` (no residue); assert `agent-factory/` still present | ❌ Wave 0 |
| SAFE-02 | guard DENIES a sample deploy with no env var; ALLOWS with env var; REFUSES inline self-set | behavioral | `echo '{"tool_input":{"command":"kubectl apply -f x"}}' \| node hooks/<guard>.mjs` → `permissionDecision":"deny"`; repeat with `GRUGOPS_PROD_DEPLOY_APPROVED=1` → exit 0, no deny JSON; `…"command":"export GRUGOPS_PROD_DEPLOY_APPROVED=1 && kubectl apply…"` → deny | ❌ Wave 0 |

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _(populated during planning — map each task to a row from the Requirement → Test Map above)_ | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `check-structure.sh` (or a Phase-5 sibling) with PKG-01/02 + CLAUDE-01/02/03 presence + dup-check asserts
- [ ] Guard test harness: three stdin fixtures (deploy-no-approval → deny; deploy-with-approval → allow; inline-self-set → deny) — pure shell + node, no framework
- [ ] Install idempotency test: temp-repo copy, double-install diff, `DRY_RUN=1` no-op check, uninstall-cleanliness check
- [ ] Confirm `claude plugin validate --strict` is wired as a CI/phase-gate step (D-37)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plugin repo-relative pointer (D-31) resolves against the user's repo from the plugin cache | CLAUDE-02 / CLAUDE-03 | Requires a real `/plugin install` into a throwaway repo with `agent-factory/` present — the decisive test is the Phase-6 dogfood (DOG-01/02), not buildable in-phase | Phase 6: install plugin into throwaway repo, run `/grugops:plan`, confirm it reads `agent-factory/roles/orchestrator.md` from the repo, not the cache |
| Dash-standalone vs colon-plugin coexistence has no user-facing collision | CLAUDE-01 / CLAUDE-02 | UX observation across both surfaces installed at once | Phase 6 dogfood: install both, confirm `/grugops-plan` and `/grugops:plan` both resolve without confusion |
| `claude plugin validate --strict` on a top-level marketplace `description` (#38480) | CLAUDE-02 | Known validator strict-mode inconsistency — must observe local validator output | Run `claude plugin validate ./ --strict` locally; treat its output as authoritative; omit top-level marketplace `description` if it errors |

---

## Validation Sign-Off

- [ ] All tasks have an automated verify command or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

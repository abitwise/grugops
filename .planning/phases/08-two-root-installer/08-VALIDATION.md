---
phase: 8
slug: two-root-installer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-07
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 08-RESEARCH.md § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | POSIX shell harness (no external test framework) — `pass()`/`fail()` + content-addressed `snapshot()` diff, mirroring `install/install.test.sh` |
| **Config file** | none — harness is self-contained |
| **Quick run command** | `sh install/install.test.sh` (existing 7-check harness — **must stay green and unedited**) |
| **Full suite command** | `sh install/install.test.sh && sh scripts/check-kit-refs.sh && sh install/install.two-root.test.sh` |
| **Estimated runtime** | ~10–30 seconds |

**Hard constraint:** `install/install.test.sh`'s split-aware rewrite is a **Phase 9** deliverable (VAL-02). Phase 8 must NOT edit it and must leave all 7 current checks green. New Phase-8 assertions live in a separate `install/install.two-root.test.sh`. All new tests use hermetic `GRUGOPS_HOME` / `GRUGOPS_SRC` / `TARGET` / `INSTALL_MODE=copy` / `DRY_RUN` overrides and clean up via `trap … EXIT` (`mktemp -d` discipline).

---

## Sampling Rate

- **After every task commit:** Run `sh install/install.test.sh` (must stay green) + the relevant new Phase-8 assertion.
- **After every plan wave:** Run `sh install/install.test.sh && sh scripts/check-kit-refs.sh && sh install/install.two-root.test.sh`.
- **Before `/gsd-verify-work`:** Full suite green + `git status` clean in the grugops checkout (proves the self-checkout guard kept source adapters un-materialized).
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | INSTALL-04 | — | Kit copied to `$GRUGOPS_HOME/agent-factory/` | integration | `GRUGOPS_HOME=$tmp/home GRUGOPS_SRC=$REPO TARGET=$tmp/app sh install/install.sh --yes` then `[ -f $tmp/home/agent-factory/roles/orchestrator.md ]` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 | — | Adapters materialized with resolved absolute kit path | integration | grep materialized `KIT=` in `$tmp/app/.claude/agents/grugops-orchestrator.md` == `$tmp/home/agent-factory` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 | — | State seeded (`.grugops/factory.config.json`, marker, `plans/**` incl. `handoffs/`, `memory-bank/**`) | integration | assert each seeded path exists in `$tmp/app` after install | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 | SAFE/never-clobber | Pre-existing seeded file untouched | integration | pre-write `$tmp/app/.grugops/factory.config.json` sentinel, install, assert sentinel survives | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 | — | Idempotent: double-install (adapters + kit + marker) → zero diff | integration | `snapshot` `$tmp/app`+`$tmp/home`, install twice, diff both = empty | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 | — | `DRY_RUN=1` mutates neither root | integration | `snapshot` both roots pre/post `DRY_RUN=1 … install.sh`, diff empty | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 | — | Default mode copy (no symlinks) | integration | `find $tmp/app $tmp/home -type l` is empty | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 | — | sh/Node byte-parity (kit root + seeded tree + marker) | integration | install sh→$A, node→$B identical env; `snapshot` + diff both roots = empty | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-03 | — | `--target ../app` from arbitrary CWD lands right | integration | `cd /tmp && sh $REPO/install/install.sh --target $tmp/app --yes`; assert adapters in `$tmp/app` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-03 | — | `--yes`/non-TTY installs unattended (no prompt block) | integration | run with stdin `/dev/null` + `--yes`; assert exit 0, no hang | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-03 | SAFE/self-guard | Self-checkout guard refuses by default; `--allow-self` overrides | integration | `TARGET=$REPO sh install/install.sh --yes` exits nonzero w/ refuse msg; `--allow-self` proceeds (throwaway clone) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 (D-06) | SAFE | Two-root uninstall removes marker + adapters, NOT kit or seeded config | integration | install, uninstall, assert `$tmp/home/agent-factory` + `.grugops/factory.config.json` survive, `.grugops/install.json` gone | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 (D-03) | — | Seed subtree excluded from `check-kit-refs.sh` | smoke | `sh scripts/check-kit-refs.sh` exits 0 after seeds bundled | ✅ | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 (D-08) | — | Packaging templates no longer grant `Agent` | smoke | `! grep -q 'Agent' agent-factory/packaging/subagent.frontmatter.md agent-factory/packaging/slash-command.template.md` | ✅ | ⬜ pending |
| TBD | TBD | TBD | INSTALL-04 (D-09) | — | No stale `agent-factory/config/` config-path prose in the two docs | smoke | `! grep -q 'agent-factory/config/factory' agent-factory/README.md agent-factory/config/factory.config.md` (allow legit file-location mention) | ✅ | ⬜ pending |
| TBD | TBD | TBD | regression | — | Existing 7-check harness stays green | integration | `sh install/install.test.sh` exits 0 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Task IDs / Plan / Wave to be assigned by the planner.*

---

## Wave 0 Requirements

- [ ] `install/install.two-root.test.sh` — new Phase-8-local harness: kit-copy + materialization + seeding + never-clobber + idempotency (two roots) + copy-default + self-checkout guard + `--target`/`--yes` + two-root uninstall + sh/Node parity. Hermetic env overrides; `trap … EXIT` cleanup.
- [ ] Extend the `snapshot()` helper to cover BOTH roots (`$TARGET` and `$GRUGOPS_HOME`).
- [ ] Self-checkout-guard fixture: a throwaway clone-shaped dir (carries `install/install.sh` + `agent-factory/VERSION`) so the guard runs without pointing at the real repo.
- [ ] No framework install needed (POSIX sh).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Windows sh/Node byte-parity of the materialized absolute path | INSTALL-04 | No Windows runner available; `os.homedir()` vs `$HOME` + path normalization is `UNKNOWN - verify` | On a Windows machine, run `install.mjs` against a target and confirm the injected `KIT=` line matches the POSIX-normalized form the sh installer would write |
| Source checkout stays un-dirtied after a real-world install | INSTALL-03 (D-07) | Guard's real value is observed via `git status` in the live clone | After a normal `--target <repo>` install, `git status` in the grugops checkout is clean (no materialized adapters) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

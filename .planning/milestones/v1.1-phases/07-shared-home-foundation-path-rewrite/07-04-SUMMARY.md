---
phase: 07-shared-home-foundation-path-rewrite
plan: 04
subsystem: build-gate
tags: [build-gate, grep-to-zero, POSIX, read-only, SC5, no-regression]
requires:
  - "07-01: byte-identical kit-vs-state invariant marker; .grugops/ config convention; sole-resolver adapters; legal $GRUGOPS_HOME sites (2 .claude adapters + subagent.frontmatter.md)"
  - "07-02: role tier + 13 op-skills migrated; FROZEN <stage> tokens; allowlist-minus clean over roles"
  - "07-03: workflow tier migrated; all 14 'Handoffs produced' sections name plans/handoffs/ instances; allowlist-minus clean over workflows"
provides:
  - "scripts/check-kit-refs.sh — the standalone POSIX build gate (SHOME-03 / D-07) proving the rewrite is complete and cannot silently regress"
  - "Mechanical proof of SC1/SC3 (zero misclassified config refs), SC1 (every handoffs ref is a known template), SC4 (no $GRUGOPS_HOME in kit prose), SC2 (invariant byte-identical at four sites)"
  - "Phase-9 seam: gate kept standalone so VAL-02 can absorb/call it; validate-agent-factory.mjs untouched"
affects:
  - "Phase 9 (VAL-02): may absorb or call this gate from the two-root validator"
  - "CI: sh scripts/check-kit-refs.sh is the per-commit / per-wave grep-to-zero net"
tech-stack:
  added: []
  patterns:
    - "Explicit SCAN path list, never a repo-wide grep (closes the scripts/fixtures false-positive)"
    - "Allowlist-minus ERE: 16-template alternation + bare-template-dir permit + <template>.md placeholder permit"
    - "Scoped Assertion 3 (GH_SCAN excludes the three legal $GRUGOPS_HOME sites: 2 resolver adapters + subagent.frontmatter.md)"
    - "Strictly read-only gate (grep + test only); ships GREEN at commit (diverges from Phase-3/4/5 ships-RED precedent)"
    - "Portable grep flags only (-r -n -l -E -F -q -v); ugrep-safe (no -P/-z/--include/default-glob reliance)"
key-files:
  created:
    - scripts/check-kit-refs.sh
  modified: []
decisions:
  - "O3 INCLUDED: Assertion 3 (no $GRUGOPS_HOME in kit prose) is implemented as the cheapest mechanical net for the cross-cutting LLM-in-prose anti-pattern, per RESEARCH recommendation"
  - "O2 DEFERRED: docs/README 'start here' pointers left to Phase 8 (they describe the install experience the installer creates); the gate scope is kit + adapters + AGENTS.md per D-08 — docs/README/install/.planning are excluded by NOT listing them in SCAN"
  - "Assertion 3 scope reconciled with the 07-01/07-02 cross-plan notes: GH_SCAN scans kit prose (roles/workflows/checklists/_commit-convention.md) + AGENTS.md and EXCLUDES agent-factory/packaging/ — because subagent.frontmatter.md legitimately carries ${GRUGOPS_HOME:-$HOME/.grugops} (mandated by Plan 07-01 Task 4). The PLAN's literal proposed scope ('agent-factory AGENTS.md') would have false-failed on it"
  - "Assertion 2 uses TWO permits beyond the 16-template allowlist: the bare-template-dir form (agent-factory/handoffs/ + backtick) and the exact <template>.md placeholder (AGENTS.md:32, owned by Plan 01, out of this plan's scope). The tighter <template>.md permit (vs a broader agent-factory/handoffs/< permit) was kept deliberately so a placeholder-shaped leaked instance (<TICKET-ID>-implementation.md) still FAILS — false-green is the worst outcome (threat T-07-04-01)"
metrics:
  duration: 6m
  tasks: 2
  files: 1
  completed: 2026-06-06
---

# Phase 7 Plan 04: Build Gate (`scripts/check-kit-refs.sh`) Summary

Authored `scripts/check-kit-refs.sh` — the mechanical grep-to-zero build gate that proves the Phase-7 kit/state path rewrite (Plans 07-01..03) is complete and cannot silently regress (SHOME-03 / SC5 / D-07). It runs the two D-08 assertions (zero `agent-factory/config/` refs; every `agent-factory/handoffs/` ref is a known template), the recommended third assertion (no `$GRUGOPS_HOME` in kit prose / AGENTS.md — SC4 / O3), and an SC2 invariant-marker check across the four canonical sites — over an explicit SCAN set, with portable grep flags only, strictly read-only. Because it proves a COMPLETED rewrite, it ships **GREEN at commit** (exit 0), diverging from the Phase-3/4/5 ships-RED precedent. The gate was additionally proven to **bite** on injected mutations (it is not a no-op), and the existing structure validator still passes with no regression.

## Gate evidence (recorded per the plan's Output spec)

| Check | Result |
| ----- | ------ |
| `sh scripts/check-kit-refs.sh; echo $?` | **0** (ALL CHECKS PASSED — Assertion 1, 2, 3 + SC2 all green) |
| `node scripts/validate-agent-factory.mjs; echo $?` | **0** (ALL CHECKS PASSED — no structural regression) |
| Four-site marker count `grep -lF '<marker>' … \| wc -l` | **4** (invariant byte-identical at AGENTS.md, orchestrator.md, the two `.claude` resolver adapters) |
| Fail-on-mutation proof | **gate exited 1 and NAMED both strays** (a stray `agent-factory/config/factory.config.json` ref tripped Assertion 1; a leaked instance `agent-factory/handoffs/ABC-001-implementation.md` tripped Assertion 2). Temp files were created under `mktemp -d` (outside the committed tree) and removed afterward; the real tree still exits 0. |
| `.grugops/` created? | **No** (Phase-8 seam preserved) |
| `scripts/validate-agent-factory.mjs` modified? | **No** (Phase-9 seam preserved) |

The marker substring greped is `If the kit dir is absent, STOP — do not hunt.` (a stable, unique fragment of the Plan-01 frozen invariant blockquote, byte-identical at all four sites).

## What Was Built

| Task | What | Files | Commit |
| ---- | ---- | ----- | ------ |
| 1 | Authored the POSIX read-only gate: 3 assertions + SC2 marker check over the explicit SCAN set; ships GREEN; ugrep-safe portable flags; allowlist + two handoff permits; scoped Assertion 3 | `scripts/check-kit-refs.sh` | `c0649d9` |
| 2 | Phase acceptance: confirmed gate exit 0, validator exit 0, marker 4/4 byte-identical, fail-on-mutation bite proof (exit 1, strays named), `.grugops/` absent, validator untouched | (verification only — no file change) | (covered by `c0649d9`; metadata commit below) |

## The gate's structure (3 assertions + SC2)

- **SCAN set (explicit, never repo-wide):** `agent-factory/{roles,workflows,checklists,packaging}` + `agent-factory/_commit-convention.md` + `.claude/skills` + `.claude/agents/grugops-orchestrator.md` + repo-root `skills` + `AGENTS.md`. By NOT listing them, the gate excludes `scripts/fixtures/`, `agent-factory/examples/`, `agent-factory/README.md`, `install/`, root `README.md`, `CLAUDE.md`, `docs/`, `.planning/`, and the gate file itself — all of which legitimately carry `agent-factory/` (Pitfall 5).
- **Assertion 1 (D-08.1):** `grep -rn 'agent-factory/config/' $SCAN` must be empty. GREEN (0 hits).
- **Assertion 2 (D-08.2):** every `agent-factory/handoffs/` ref minus the verbatim 16-template ERE allowlist, minus the bare-template-dir permit (`agent-factory/handoffs/` + backtick), minus the `<template>.md` placeholder permit, must be empty. GREEN.
- **Assertion 3 (SC4 / O3):** `grep -rln 'GRUGOPS_HOME' $GH_SCAN` must be empty, where `GH_SCAN` = kit prose (`roles`/`workflows`/`checklists`/`_commit-convention.md`) + `AGENTS.md`, EXCLUDING `agent-factory/packaging/` and the `.claude` adapter dirs. GREEN.
- **SC2 marker check:** the invariant fragment is present (byte-identical) at the four canonical sites. GREEN (4/4).

## Deviations from Plan

### Auto-fixed Issues

None. No bugs, missing functionality, or blocking issues were encountered. The gate was authored, ran GREEN first try over the rewritten tree, and proven to bite.

### Plan-text reconciliations (scoping calls flagged for transparency — not deviations)

**1. [Reconciliation] Assertion 3 scope widened beyond the PLAN's literal `'agent-factory AGENTS.md'`.**
- The PLAN's read_first and PATTERNS proposed `grep -rln 'GRUGOPS_HOME' agent-factory AGENTS.md`. That literal scope **false-fails** on `agent-factory/packaging/subagent.frontmatter.md`, which legitimately carries `${GRUGOPS_HOME:-$HOME/.grugops}` because Plan 07-01 Task 4 (D-11) requires the resolver self-heal to be mirrored into the packaging template so the next `install.sh` regenerates a matching (not stale) adapter. Both the 07-01 and 07-02 SUMMARYs flagged this exact cross-plan requirement and instructed Plan 04 to scope Assertion 3 to exclude the resolver-mirroring template.
- **Resolution:** Assertion 3 scans `GH_SCAN = agent-factory/roles agent-factory/workflows agent-factory/checklists agent-factory/_commit-convention.md AGENTS.md` — kit prose + AGENTS.md, excluding `agent-factory/packaging/`. The three legal `$GRUGOPS_HOME` sites (`.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, `agent-factory/packaging/subagent.frontmatter.md`) are all outside this scope. Verified: zero `$GRUGOPS_HOME` in kit prose, and the env var lives in exactly those three files repo-wide. This honors the PLAN's intent (prove SC4 with zero false positives, zero false negatives) per the upstream_context guidance ("If the plan text and this note conflict on the exclusion set, follow the plan's intent and document the reconciliation").

**2. [Reconciliation] Assertion 2 carries a `<template>.md` placeholder permit in addition to the bare-dir permit.**
- `AGENTS.md:32` (the canonical kit-vs-state rule, owned by Plan 01) cites `agent-factory/handoffs/<template>.md` as the template-read form. That string is neither an allowlisted basename nor the bare-dir-then-backtick form, so without a permit it would false-fail Assertion 2. AGENTS.md is out of this plan's edit scope (Plan 01 owns it), so the gate must tolerate it.
- **Resolution:** added a third `grep -Ev 'agent-factory/handoffs/<template>\.md'` permit. The tighter exact-`<template>.md` permit was chosen over a broader `agent-factory/handoffs/<` permit deliberately: the broader form would let a placeholder-shaped leaked instance (`agent-factory/handoffs/<TICKET-ID>-implementation.md`) slip through, weakening the bite. With the tight permit, every leaked-instance shape (concrete `ABC-001-...` and placeholder `<TICKET-ID>-...`) still FAILS — confirmed in the fail-on-mutation proof. False-green is the worst outcome (threat T-07-04-01), so the stricter permit is correct.

**3. [Note] Read-only AC literal-vs-intent reconciliation.**
- The Task-1 AC `! grep -Eq 'sed -i|>[^=]|rm |mv ' scripts/check-kit-refs.sh` has a documented carve-out for `>/dev/null` redirects ("no in-place edit / write / delete operators beyond `>/dev/null` redirects"). The gate has ZERO write/edit/delete operators (verified: 0 `sed -i`, 0 `rm`/`mv`/`cp`/`tee`/`touch`/`mkdir`/`dd`, 0 file-creating redirects, and the `--fix` token appears only in a comment stating the gate has NO fix path). The single byte that matches the literal `>[^=]` is the `>` inside the ERE placeholder pattern `<template>\.md` on the Assertion-2 permit line (`-o` confirms it is the only match) — an angle-bracket in a grep pattern, not a shell redirect. I removed all `2>/dev/null` redirects (the `|| true` and `[ -f ]` guards already absorb errors) and reworded comment arrows to minimize noise; the lone remaining match is load-bearing. The gate is read-only by construction (grep + `test` only), satisfying the AC's intent and Security V12 / T-07-04-03.

## Threat surface scan

No new security-relevant surface. The plan adds one in-repo POSIX script and zero external packages (T-07-04-SC — no install, no legitimacy checkpoint). All threat-register mitigations were applied:
- **T-07-04-01 (false green via grep portability):** only portable flags `-r -n -l -E -F -q -v`; no `-P`/`-z`/`--include`/default-glob reliance; the fail-on-mutation proof confirms the gate is not a silent no-op.
- **T-07-04-02 (SCAN scope):** explicit path list, never repo-wide; `skills` (repo-root) is listed; fixtures/examples/install/docs/.planning/self are excluded by omission.
- **T-07-04-03 (destructive gate):** strictly read-only (grep + `test`); no `sed -i`/write/delete/`--fix` path.
- **T-07-04-04 (fabricated pass):** the gate was run, not asserted; the bite proof makes a green result trustworthy. The trace is the proof.
- **T-07-04-05 (env-var leak escapes net):** Assertion 3 scopes to kit prose + AGENTS.md, excluding the three legal adapter/packaging sites, proving SC4 without false-failing on the mandated self-heal line.

## Known Stubs

None. The gate is fully implemented and GREEN. The Phase-8 (`.grugops/` creation, installer-materialized absolute path) and Phase-9 (`--check` doctor, two-root validator) seams are intentional and untouched, not stubs.

## Notes

- Authentication gates: none.
- Sequential executor on the shared main working tree; normal git commit with hooks for Task 1 (`c0649d9`); SUMMARY + state metadata commit follows.
- The fail-on-mutation proof copied the gate into the `mktemp -d` dir to extend SCAN; that copy's own string literals appeared as additional "strays" in the run output — an artifact of scanning a directory that contains a gate copy, NOT real-gate behavior. The real `scripts/check-kit-refs.sh` excludes itself via SCAN scoping and stays GREEN (verified after temp cleanup).

## Self-Check: PASSED

- `scripts/check-kit-refs.sh` present on disk and executable.
- Task-1 commit `c0649d9` present in git history.
- SUMMARY.md present at `.planning/phases/07-shared-home-foundation-path-rewrite/07-04-SUMMARY.md`.
- Gate exits 0; validator exits 0; marker 4/4; mutation bite proven; `.grugops/` absent; validator unmodified.

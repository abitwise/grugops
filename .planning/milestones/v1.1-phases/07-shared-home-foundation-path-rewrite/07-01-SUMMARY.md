---
phase: 07-shared-home-foundation-path-rewrite
plan: 01
subsystem: kit-state-convention
tags: [convention, path-rewrite, resolver, adapters, AGENTS.md]
requires: []
provides:
  - "Canonical kit-vs-state rule (AGENTS.md § Kit vs state)"
  - "Byte-identical kit-vs-state invariant marker phrase (reused by Plans 02/03, grepped by Plan 04 SC2)"
  - "Sole-resolver self-heal ${GRUGOPS_HOME:-$HOME/.grugops} + STOP-on-absence in the two .claude resolver adapters"
  - "Config refs resolved to .grugops/factory.config.json across the 7 owned files"
  - "Phase-8 absolute-path resolver slot [1] left empty (clean seam)"
affects:
  - "Plan 02/03 bulk rewrite (reuse the invariant marker byte-identically)"
  - "Plan 04 build gate (greps the marker for SC2; asserts zero config refs / scoped GRUGOPS_HOME)"
  - "Phase 8 installer (prepends resolver step [1] absolute path; regenerates adapters from the packaging templates)"
tech-stack:
  added: []
  patterns:
    - "Compressed invariant blockquote, byte-identical across canonical + entry-point sites (D-09/D-10)"
    - "Adapter-only kit-root resolution: self-heal then STOP, never hunt the repo (D-11/D-12)"
    - "Single-sourced resolver: full self-heal lives only in the dispatcher adapters; op-skills carry invariant only"
key-files:
  created: []
  modified:
    - AGENTS.md
    - agent-factory/roles/orchestrator.md
    - .claude/agents/grugops-orchestrator.md
    - .claude/skills/grugops/SKILL.md
    - agent-factory/packaging/subagent.frontmatter.md
    - agent-factory/packaging/slash-command.template.md
decisions:
  - "Invariant marker phrase frozen (see Invariant Marker section); canonical site (AGENTS.md) carries it bare, entry-point sites append the '(Full rule: AGENTS.md § Kit vs state.)' cross-link"
  - "adapters.md left untouched: it carries no agent-factory/config/ ref and only bare kit-to-kit roles refs (D-01)"
  - "Trimmed the literal ${GRUGOPS_HOME:-$HOME/.grugops} token out of slash-command.template.md prose so the env var lives in exactly 3 files (2 .claude adapters + subagent.frontmatter.md)"
metrics:
  duration: 4m
  tasks: 4
  files: 6
  completed: 2026-06-06
---

# Phase 7 Plan 01: Kit/State Split Convention & Adapter Resolver Summary

Froze the kit-vs-state convention: stated the canonical rule once in `AGENTS.md`, restated a byte-identical compressed invariant in the orchestrator preamble and the two resolver adapters, landed the adapter-only `${GRUGOPS_HOME:-$HOME/.grugops}` self-heal + STOP-on-absence, and migrated every config ref in the seven owned files to `.grugops/factory.config.json` — the convention every downstream rewrite (Plans 02/03) and the build gate (Plan 04) cross-link.

## Invariant Marker (FROZEN — reuse byte-identically)

Plans 02/03 MUST reuse this exact phrase; Plan 04 SC2 greps for it. The canonical site (`AGENTS.md`) carries it without the trailing cross-link; the three entry-point sites append `(Full rule: AGENTS.md § Kit vs state.)`.

```
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Read handoff templates from `agent-factory/handoffs/`, write instances to `plans/handoffs/<ID>-<stage>.md`. If the kit dir is absent, STOP — do not hunt.
```

The canonical `## Kit vs state` section text in AGENTS.md is the expanded rule (bulleted), with the blockquote above embedded inside that section as the stable, greppable marker.

## What Was Built

| Task | What | Files | Commit |
| ---- | ---- | ----- | ------ |
| 1 | Canonical `## Kit vs state` rule + stable invariant marker; config refs → `.grugops/`; handoff line clarified (templates here, instances → `plans/handoffs/`) | `AGENTS.md` | `1d3b581` |
| 2 | Compressed invariant preamble blockquote; config refs → `.grugops/` (`#wip_limits` anchor preserved); open-handoffs input → `plans/handoffs/` | `agent-factory/roles/orchestrator.md` | `89b18f8` |
| 3 | Sole-resolver self-heal (step [2]) + STOP-on-absence (step [3]) + invariant; config refs → `.grugops/`; safety line preserved verbatim; slot [1] left empty | `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md` | `4ea0b3a` |
| 4 | Config refs → `.grugops/` in both templates; full resolver block into `subagent.frontmatter.md` (mirrors the dispatcher); invariant into both; documented single-sourcing; `adapters.md` untouched | `agent-factory/packaging/subagent.frontmatter.md`, `agent-factory/packaging/slash-command.template.md` | `4f2830b` |

## Success Criteria

- **SC2 (invariant present + byte-identical):** marker substring confirmed present via `grep -qF` in `AGENTS.md`, `orchestrator.md`, and both resolver adapters. PASS.
- **SC3 (config refs migrated):** `grep -c 'agent-factory/config/'` = 0 in all 7 owned files; `#wip_limits` anchor preserved in `orchestrator.md`. PASS.
- **SC4 (sole-resolver / scoped env var):** `${GRUGOPS_HOME:-$HOME/.grugops}` colon-form present in both resolver adapters; `$GRUGOPS_HOME` absent from `AGENTS.md` and `orchestrator.md`; it appears in exactly 3 files (the 2 `.claude` adapters + the resolver-mirroring `subagent.frontmatter.md`). PASS.
- **Phase-8 seam:** resolver slot [1] left empty (no absolute kit path token written). PASS.
- **No structural regression:** `node scripts/validate-agent-factory.mjs` exits 0 (ALL CHECKS PASSED) after each task. PASS.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Trimmed an extra `$GRUGOPS_HOME` token out of `slash-command.template.md` prose**
- **Found during:** Task 4
- **Issue:** My first draft of the Task-4 documentation Note in `slash-command.template.md` named the literal `${GRUGOPS_HOME:-$HOME/.grugops}` token while explaining single-sourcing. That put the env var in a fourth file under `agent-factory/`, widening the SC4/D-12 surface and the surface Plan 04's proposed Assertion 3 (`grep -rln 'GRUGOPS_HOME' agent-factory AGENTS.md`) would scan.
- **Fix:** Reworded the Note to refer to "the kit-home env var" without spelling the literal token, so `$GRUGOPS_HOME` now lives in exactly three files: the two `.claude` resolver adapters (legal per D-12) and the one resolver-mirroring template `subagent.frontmatter.md` (mandated by Task 4 AC2). `slash-command.template.md` carries the compressed invariant only (correct for an op-skill template per PATTERNS Bucket E3 single-sourcing).
- **Files modified:** `agent-factory/packaging/slash-command.template.md`
- **Commit:** `4f2830b`

## Cross-Plan Note for Plan 04 (build-gate author)

PATTERNS proposes Assertion 3 as `grep -rln 'GRUGOPS_HOME' agent-factory AGENTS.md`. That scope **will flag `agent-factory/packaging/subagent.frontmatter.md`**, which legitimately carries `${GRUGOPS_HOME:-$HOME/.grugops}` because Task 4 (D-11) requires the resolver self-heal to be propagated into the packaging template that mirrors the dispatcher adapter (so the next `install.sh` regenerates a matching adapter rather than a stale one). Plan 04 MUST scope Assertion 3 to exclude `agent-factory/packaging/` (the resolver-mirroring template) the same way PATTERNS already excludes the `.claude/` adapter dirs — otherwise the gate false-fails on intended, plan-mandated content. The legal `$GRUGOPS_HOME` sites are exactly: `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, and `agent-factory/packaging/subagent.frontmatter.md`.

## Known Stubs

None. The Phase-8 resolver slot [1] is an intentional seam (documented in PATTERNS § "Seams left for later phases"), not a stub — the adapters fail closed (STOP) without it, and Phase 8 (INSTALL-03..05) prepends the materialized absolute path.

## Notes

- Authentication gates: none.
- The marker phrase has two on-disk shapes that differ ONLY by the trailing `(Full rule: AGENTS.md § Kit vs state.)` cross-link (canonical site omits the self-cross-link). The greppable substring Plan 04 SC2 keys on is identical at all four sites.

## Self-Check: PASSED

- All 6 modified files present on disk.
- All 4 task commits present in git history (`1d3b581`, `89b18f8`, `4ea0b3a`, `4f2830b`).
- SUMMARY.md present at `.planning/phases/07-shared-home-foundation-path-rewrite/07-01-SUMMARY.md`.

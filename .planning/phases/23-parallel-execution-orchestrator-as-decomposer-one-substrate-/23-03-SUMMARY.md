---
phase: 23-parallel-execution-orchestrator-as-decomposer-one-substrate
plan: 03
subsystem: foundation-guards / packaging / coordinator-adapter
tags: [WR-05, guard-inversion, coordinator, asymmetric-flip, PAR-04, safety-guard]
status: complete
requires:
  - "23-02 (orchestrator-decomposer spine + WF17 in the regenerated catalog)"
provides:
  - "both-direction marker-keyed guard_wr05 (coordinator MUST grant / non-coordinator MUST NOT)"
  - "coordinator: true + enumerated Agent(<allowlist>) on .claude/agents/grugops-orchestrator.md"
  - "B3 oracle four-CLI asymmetry assertion over the 5-tool tables"
  - "RED-baseline / GREEN-proof adversarial evidence pair for the WR-05 flip"
affects:
  - "scripts/check-foundation-guards.ts (+.js+.test.ts)"
  - "scripts/check-uat-oracles.ts (+.js+.test.ts)"
  - "agent-factory/roles/_role-switch-protocol.md"
  - "agent-factory/packaging/{subagent.frontmatter.md, slash-command.template.md, adapters.md}"
  - "agent-factory/README.md"
  - ".claude/agents/grugops-orchestrator.md"
tech-stack:
  added: []
  patterns:
    - "both-direction marker-keyed guard (isCoordinator XOR-against-hasGrant per file)"
    - "asymmetric doc flip with an oracle drift-catcher (CC row spawns; four CLI rows stay no-spawn)"
    - "adversarial RED-baseline → GREEN-proof evidence for a safety-guard inversion"
key-files:
  created:
    - ".planning/phases/23-.../23-03-RED-baseline.txt"
    - ".planning/phases/23-.../23-03-GREEN-proof.txt"
  modified:
    - "scripts/check-foundation-guards.ts / .js / .test.ts"
    - "scripts/check-uat-oracles.ts / .js / .test.ts"
    - "agent-factory/roles/_role-switch-protocol.md"
    - "agent-factory/packaging/subagent.frontmatter.md"
    - "agent-factory/packaging/slash-command.template.md"
    - "agent-factory/packaging/adapters.md"
    - "agent-factory/README.md"
    - ".claude/agents/grugops-orchestrator.md"
decisions:
  - "Detection is the coordinator: true marker only (D-15) — the WR05_SCAN entry for the orchestrator is the explicit scan-set membership, NOT a detection key"
  - "Allowlist enumerates the delivery specialists the coordinator schedules (software-engineer, qe-e2e, security-nfr, architect-design, system-analyst, uat-planner, release-manager) as least-privilege Agent(<allowlist>) (D-17/A3)"
  - "Catalog already carried WF17 from Wave 2 and no flip-driven catalog wording exists, so the atomic regen produced no diff — catalog-freshness exit 0 confirms it is fresh"
metrics:
  duration: "~25 min"
  completed: "2026-06-21"
  tasks: 3
  files_changed: 11
---

# Phase 23 Plan 03: Atomic WR-05 Inversion (Coordinator-Only Spawn) Summary

The WR-05 safety guard is inverted to both-direction, marker-keyed enforcement across all seven
surfaces in one coordinated change-set: `guard_wr05` now asserts the `coordinator: true` orchestrator
adapter MUST carry the enumerated `Agent(<allowlist>)` spawn grant and every non-coordinator SCAN file
MUST NOT; the B3 wording oracle flips in lockstep and gains a four-CLI asymmetry drift-catcher; the
protocol/packaging/tables and the orchestrator adapter are flipped asymmetrically (Claude Code only).
PAR-04 is closed on a RED-baseline → GREEN-proof evidence pair plus an independent probe — not a green
suite alone, per the project's CMP-02 lesson.

## What Was Built

- **Task 1 — `guard_wr05` inverted (8b17a91).** Replaced the negative "no SCAN file may grant Agent"
  with a per-file both-direction check: `isCoordinator` from the marker ERE `/^coordinator:\s*true\b/`
  (D-15, never a filename), `hasGrant` from the two retained grant EREs (both `Agent|Task` aliases
  kept). FAIL on coordinator-without-grant (dropped grant kills CC parallelism) or
  non-coordinator-with-grant (rogue spawner). Explicit 4-file SCAN set kept. Three both-direction RED
  fixtures added.
- **Task 2 — wording surface flipped atomically (4e391c3).** `.claude/agents/grugops-orchestrator.md`
  gained `coordinator: true` + the enumerated grant (1948 B, under the 4096 B cap). `_role-switch-protocol.md`
  dropped the "No Agent tool" absolute → coordinator-only on Claude Code (sequential preserved for the
  four CLIs); step-4 rewired to claim per WF17 → context per WF16. Packaging templates reframed and a
  coordinator example added. The 5-tool tables in adapters.md + README.md flipped ASYMMETRICALLY — only
  the Claude Code row changed; all four non-CC rows keep "Sequential role-load — no spawn" verbatim.
- **Task 3 — B3 oracle flipped + asymmetry assertion + evidence (3caef7a).** `oracleWr05Wording` keeps
  the historical closure beats and adds an asymmetry beat scanning both 5-tool tables: a non-CC row that
  grows spawn/coordinator wording, or a CC row that loses it, fails RED. Asymmetry-drift RED fixture
  added. Catalog confirmed fresh. Adversarial gate completed.

## Adversarial Gate (PAR-04 — closed on proof, not a green suite)

- `23-03-RED-baseline.txt`: each of the three guard half-flips (planted non-coordinator grant; dropped
  coordinator grant; removed coordinator marker) AND the asymmetry-drift fixture exits **NON-ZERO**
  against the COMMITTED `.js`, each naming the offending file.
- `23-03-GREEN-proof.txt`: the real flipped tree passes both guard and oracle (exit 0); catalog-freshness
  and build-freshness exit 0.
- Independent probe recorded: branch enumeration confirms no code path PASSes a half-flip on the existing
  coordinator; the only "orchestrator" string in the guard region is the explicit SCAN-set entry, not a
  detection key.

## Verification Results

- `npx vitest run scripts/check-foundation-guards.test.ts` — 27/27 green (incl. 3 RED fixtures).
- `npx vitest run scripts/check-uat-oracles.test.ts` — 9/9 green (incl. asymmetry-drift + CC-loses fixtures).
- `node scripts/check-foundation-guards.js` exit 0; `node scripts/check-uat-oracles.js` exit 0.
- `node scripts/catalog-freshness.js` exit 0; `npm run freshness` exit 0 (18 committed .js fresh).
- `npx vitest run --exclude '**/scripts/e2e/**'` — 448 passed, 1 skipped, 0 failed.

## Deviations from Plan

None — plan executed exactly as written. The catalog regen produced no diff because Wave 2 (23-02)
already added WF17 and there is no flip-driven catalog wording; this is the expected atomic-and-fresh
outcome (catalog-freshness exit 0 confirms it), not a skipped step.

## Constraint Adherence

- `hooks/guard.ts` UNCHANGED (the humans-hold-merge/deploy floor survives parallelism).
- Both grant EREs retained verbatim (`Agent|Task` alias kept); WR05_SCAN stays an explicit 4-file list,
  never a repo-wide grep.
- Detection is the `coordinator: true` marker only — no hard-coded coordinator filename in the logic.
- The 5-tool table edit is asymmetric: only the Claude Code row changed in adapters.md + README.md.
- Clear (non-caveman) voice on all guard/oracle findings.

## Self-Check: PASSED

- FOUND: scripts/check-foundation-guards.ts, scripts/check-uat-oracles.ts, .claude/agents/grugops-orchestrator.md
- FOUND: 23-03-RED-baseline.txt, 23-03-GREEN-proof.txt
- Commits 8b17a91, 4e391c3, 3caef7a all present in git log.

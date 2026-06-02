# Phase 1: Substrate, Config & State Skeleton - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 1-substrate-config-state-skeleton
**Areas discussed:** Config delivery shape, Version seed value, Skeleton seed depth, plans/ identity & prefix, AGENTS.md scope, README completeness, config.md twin depth

---

## Config delivery shape

| Option | Description | Selected |
|--------|-------------|----------|
| Ship populated config | Commit factory.config.json with lean defaults + .md twin; zero-config holds via role fallback to identical defaults | ✓ |
| Docs-only, no JSON | Ship only factory.config.md; user creates JSON to override | |
| Example template | Ship factory.config.example.json + .md; copy-to-activate | |

**User's choice:** Ship populated config
**Notes:** Resolves the §3 ("create factory.config.json") vs CONFIG-03 ("runs with ZERO config") tension — both hold because roles fall back to the same defaults when the file is absent.

---

## Version seed value

| Option | Description | Selected |
|--------|-------------|----------|
| 0.1.0 | New public pre-1.0 tool; matches REQUIREMENTS lean recommendation | ✓ |
| 0.0.0-dev placeholder | Explicit 'not yet versioned'; forces the real decision at Phase 5 | |
| 2.0.0 (spec continuity) | Matches spec VERSION/config example; SemVer break-contract from day one | |

**User's choice:** 0.1.0
**Notes:** Final string (0.x vs 2.0.0) remains a Phase-5 Open Decision; 0.1.0 is the working seed. Deliberate divergence from the spec's `2.0.0` example.

---

## Skeleton seed depth

| Option | Description | Selected |
|--------|-------------|----------|
| Headers + format comment | Real headers/columns + format comment, zero live data rows | ✓ |
| One marked example row | Single clearly-labeled EXAMPLE row, deleted on first real use | |
| Full spec example rows | Ship the spec's complete illustrative tables | |

**User's choice:** Headers + format comment
**Notes:** Keeps the seed clean — no fake tickets — so the Phase-6 validator needs no example-row exceptions and a fresh install starts from a true empty plane.

---

## plans/ identity & prefix

| Option | Description | Selected |
|--------|-------------|----------|
| Template, ABC prefix | plans/ is the user-facing kit template, generic 'ABC' prefix, no grugops tickets; distinct from .planning/ | ✓ |
| Template, grugops prefix | Same separation, but seed id_prefix as grugops's own (GRUG/OPS) | |
| plans/ = grugops's board | Make plans/ track grugops's own delivery alongside .planning/ | |

**User's choice:** Template, ABC prefix
**Notes:** `plans/` ships to installers; `.planning/` is grugops's GSD build state — the two must not be conflated. Real prefix/data is exercised only at Phase 6 dogfood on a throwaway repo.

---

## AGENTS.md scope

| Option | Description | Selected |
|--------|-------------|----------|
| Section skeleton + TODOs | Create AGENTS.md with §17.1 headers + frozen pointers, Phase-3 content marked TODO | |
| Bare pointer stub | A few lines pointing at orchestrator.md | |
| Defer entirely to Phase 3 | Don't create AGENTS.md in Phase 1; Phase 3 owns it fully | ✓ |

**User's choice:** Defer entirely to Phase 3
**Notes:** ⚠️ Intentionally moves the "root AGENTS.md" item out of Phase-1 SC#1 into Phase 3 (the "Roles & AGENTS.md Substrate" phase, AGENTS-01/02). The Phase-1 verifier must not flag a missing AGENTS.md.

---

## README completeness

| Option | Description | Selected |
|--------|-------------|----------|
| Full now, frozen paths | Complete README: 5-tool table + all copy-paste Orchestrator prompts referencing frozen paths | ✓ |
| Skeleton, TODO prompts | Structure + 5-tool table now; per-operation prompts marked TODO | |

**User's choice:** Full now, frozen paths
**Notes:** Fully meets STRUCT-02 — the prompts are usage instructions that only need the frozen paths this phase locks. "Start here" points at `agent-factory/roles/orchestrator.md`; the README notes the AGENTS.md substrate lands in Phase 3 (per the AGENTS.md decision above).

---

## config.md twin depth

| Option | Description | Selected |
|--------|-------------|----------|
| Concise field table | field / values / default / one-line-meaning table mirroring spec §15 | ✓ |
| Richer with examples | Per-field 'when to change' note + example | |

**User's choice:** Concise field table
**Notes:** Matches the 'minimal substrate / boring on purpose' constraint and stays easy to keep in sync with the JSON.

---

## Claude's Discretion

- Empty-directory markers (`.gitkeep` per spec §3).
- `plans/initial-plan.md` seed — thin stub vs leave to the bootstrap workflow (not in Phase-1 success criteria).
- `board.md` cadence presentation (Kanban columns by default; scrum overlay lives in `plans/sprints/`).
- Exact format-comment wording in skeleton state files; the `factory.config.md` table column layout.
- Voice of config docs/seed headers (clear voice, per the two-voice rule).

## Deferred Ideas

- Final version string (0.x vs 2.0.0) → Phase 5.
- `commands/` vs `skills/` command form → Phase 5.
- Root AGENTS.md content (§17.1 shape, Karpathy's 12 rules, Commands-with-flags) → Phase 3.
- Real `plans/` data + project `id_prefix` → exercised only at Phase 6 dogfood, never seeded into grugops's own repo.

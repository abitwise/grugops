# Phase 36: State-layout authority, path move and protection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-20
**Phase:** 36-state-layout-authority-path-move-and-protection
**Areas discussed:** Layout detection, Old-layout install refusal, Gate allow-list scope, Dogfood move mechanics

---

## Layout detection

| Option | Description | Selected |
|--------|-------------|----------|
| Board file presence | `memory-bank/plans/board.md` → new, else `plans/board.md` → old | ✓ |
| Marker in .grugops/install.json | `stateLayout` field now | |
| Both: marker wins, presence fallback | Two signals | |

| Option (both exist) | Description | Selected |
|--------|-------------|----------|
| Refuse and name both | Never guess, never merge | |
| New layout wins, warn | Use `memory-bank/plans/`, warn `plans/` is stale | ✓ |

| Option (rule home) | Description | Selected |
|--------|-------------|----------|
| AGENTS.md + generated invariant | Single-source | ✓ |
| Also in WF16 | Second place to sync | |

| Option (sunset) | Description | Selected |
|--------|-------------|----------|
| v4.0, recorded now | Named end of the dual-root reader | ✓ |
| Keep indefinitely | | |
| Decide later | | |

**User's choice:** presence, new-wins-with-warning, AGENTS.md + invariant, removal in v4.0.

---

## Old-layout install refusal

| Option | Description | Selected |
|--------|-------------|----------|
| Install all but state, exit 0 | Update adapters, skip seeding, print notice | |
| Refuse whole install, exit non-zero | Writes nothing, names the command | ✓ |

| Option (gap notice) | Description | Selected |
|--------|-------------|----------|
| Final wording now | 36–38 ship together | ✓ |
| Interim wording, swap in 38 | Truthful at every commit | |

| Option (doctor) | Description | Selected |
|--------|-------------|----------|
| Yes, WARN on old layout | Never FAIL | ✓ |
| Info line only | | |

**Notes:** Refusal scoped to the per-repo install; `--update`, `--check`, `--migrate`, uninstall unaffected (derived, stated in CONTEXT D-05).

---

## Gate allow-list scope

| Option (fixtures) | Description | Selected |
|--------|-------------|----------|
| Rewrite all + one old-layout fixture | Validator tested on the real layout | ✓ |
| Allow-list fixtures wholesale | Less churn | |

| Option (history) | Description | Selected |
|--------|-------------|----------|
| Allow-list, never rewrite | docs/audit, pre-v3 CHANGELOG | ✓ |
| Rewrite to new paths | | |

| Option (granularity) | Description | Selected |
|--------|-------------|----------|
| Per file, counted by the gate | | ✓ |
| Per line / marker comment | | |

| Option (.planning) | Description | Selected |
|--------|-------------|----------|
| Excluded from the scan | Named exclusion | ✓ |
| Scanned, allow-listed | | |

---

## Dogfood move mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| git mv, by hand in a plan | Keeps history | ✓ |
| Wait and use --migrate in Phase 38 | LAYOUT-05 can't close here | |

| Option (order) | Description | Selected |
|--------|-------------|----------|
| Authority first, move, gate last | Suite green across waves | ✓ |
| Gate first (red), drive to zero | | |

---

## Claude's Discretion

- `state-layout.ts` export names and placement; budget placeholders until Phase 37.
- Notice and warning wording.
- Gate wiring (validator check vs scripts guard).
- `board-read.ts` `FIXED_SUBPATHS` import vs literal + equality test.

## Deferred Ideas

- Layout marker + four-state detection — Phase 38.
- Byte budgets — Phase 37.
- Fallback removal — v4.0.

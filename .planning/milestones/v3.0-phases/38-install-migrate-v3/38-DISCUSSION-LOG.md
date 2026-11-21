# Phase 38: install --migrate v3 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-27
**Phase:** 38-install-migrate-v3
**Areas discussed:** Board split, Trace + NFR split, Budgets & marker, Failure & state machine, plus fixture, finished-context rule, neither-layout

---

## Board split

| Option | Description | Selected |
|--------|-------------|----------|
| Keep meta, cut trailer | `- [ID] title  (meta verbatim)`; only trailer moves | ✓ |
| ID + title only | meta and trailer both to `## Board notes` | |
| Rebuild (owner, since) | parse meta; interprets, not recommended | |

| Option | Description | Selected |
|--------|-------------|----------|
| Orphan notes file | `archive/pre-v3/board-orphan-notes.md`, one section per row | ✓ |
| Create a ticket file | invents frontmatter | |

| Option | Description | Selected |
|--------|-------------|----------|
| All `_Updated:` to archive file | `archive/pre-v3/board-updates.md`; board has none | ✓ |
| Keep newest on board | newest stays, rest archived | |

| Option | Description | Selected |
|--------|-------------|----------|
| Append at end, new section | fresh `## Board notes` + provenance; original archived | ✓ |
| Merge into existing heading | edits existing ticket text | |
| You decide | | |

## Trace + NFR split

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate runs trace-render | fresh index + per-ticket files from note refs | ✓ |
| Leave to WF05/WF09 | empty index until next gate/sweep | |
| Also keep a legacy per-ticket split | extra split in archive | |

| Option | Description | Selected |
|--------|-------------|----------|
| Row + its own sections | other commentary to `archive/pre-v3/nfr-notes.md`; index from cells | ✓ |
| Row only | all commentary to notes file | |
| Whole NFR verbatim, no index text | link-only index lines | |

## Budgets & marker

| Option | Description | Selected |
|--------|-------------|----------|
| Always write marker | closing lists over-budget files | ✓ |
| Only when all budgets pass | | |
| Opt-out flag | `--no-marker` | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, via state-roll logic | Done rows + dated progress entries roll | ✓ |
| Done rows only | | |
| No, leave to WF09 | | |

## Failure & state machine

| Option | Description | Selected |
|--------|-------------|----------|
| Split outputs only (proof) | pre-v3 copies byte-compared separately | ✓ |
| Split outputs + archive | literal reading; vacuous | |

| Option | Description | Selected |
|--------|-------------|----------|
| Everything, via staging (rollback) | repo exactly as before on failure | ✓ |
| Keep the move, undo the split | half-migrated state | |

| Option | Description | Selected |
|--------|-------------|----------|
| One run, both arms (v1→v3) | one pre-check covers both | ✓ |
| Two runs | | |

| Option | Description | Selected |
|--------|-------------|----------|
| I'll copy it here (dogfood) | user places chess copy on this machine | ✓ |
| Human runs on the Mac | | |
| Frozen fixture only | | |

## Further gray areas

| Option | Description | Selected |
|--------|-------------|----------|
| Fixture trimmed from chess copy | real shapes | ✓ |
| Hand-built synthetic | | |
| Both | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Finished = Done or Done archive | unmatched folders stay, listed | ✓ |
| Done column only | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Neither layout: no-op, say so | no marker | ✓ |
| Seed v3 state | | |

**Notes:** Claude raised two conflicts found while scouting: the research §2.4 trace split conflicts with Phase 37 D-01 (render refuses hand-written trace files), and a proof that counts the pre-v3 copies is vacuous. Both resolved above.

## Claude's Discretion

Opt-in flag name, staging directory name/location, dry-run format and wording, no-op proof mechanics, the named generated-line set for the proof, how migrate invokes the trace render.

## Deferred Ideas

- Standing directives out of `60-progress.md` into `50-decisions/`.
- Archiving `queue/done/` and `50-decisions/` through migrate.
- Legacy per-ticket trace split in the archive.

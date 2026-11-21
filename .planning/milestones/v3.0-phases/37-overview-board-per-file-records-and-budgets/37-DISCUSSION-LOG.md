# Phase 37: Overview board, per-file records and budgets - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-21
**Phase:** 37-overview-board-per-file-records-and-budgets
**Areas discussed:** Trace render on hosts, Migrated signal, Done growth + rollover, Budgets + ticket tension

Format: a prose proposal (six numbered items) was presented first; the user selected all four areas to discuss.

---

## Trace render on hosts

| Option | Description | Selected |
|--------|-------------|----------|
| Separate runnable | tools/grugops/trace-render.js; state-check stays read-only | ✓ |
| state-check --render | One runnable with a writing mode | |
| Agent writes, checker verifies | Roles write fixed-shape files; no render code on hosts | |

| Option | Description | Selected |
|--------|-------------|----------|
| WF05 gate + WF09 sweep | Render before state-check in both | ✓ |
| After every note publish | WF16 publish step runs it | |
| WF09 sweep only | Gate only checks | |

| Option | Description | Selected |
|--------|-------------|----------|
| Read both roots now | Archive path constant in state-layout now | ✓ |
| Leave to Phase 38 | Phase 38 adds the second root | |

---

## Migrated signal

| Option | Description | Selected |
|--------|-------------|----------|
| Marker file, defined now | LAYOUT_MARKER_REL; seed ships it; Phase 38 writes it last | ✓ |
| New-layout board present | Reuse Phase 36 D-01 detection | |
| Marker + layout both | FAIL only when both hold | |

| Option | Description | Selected |
|--------|-------------|----------|
| Version line only | `layout: v3`; other content is treated as absent and reported | ✓ |
| Empty file | Presence alone | |
| Version + migrate date | Adds provenance | |

| Option | Description | Selected |
|--------|-------------|----------|
| In this phase | By hand once budgets pass | ✓ |
| After Phase 38 | Written by the real migrate | |

---

## Done growth + rollover

Finding raised: the dogfood `60-progress.md` is mostly `## Standing directive` sections, so oldest-first rollover would hide live rules.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep last N, roll older | N in state-layout; older rows to archive/board-done.md | ✓ |
| Roll by age | Needs a date per row | |
| Done leaves the board | Count + link only | |

| Option | Description | Selected |
|--------|-------------|----------|
| Separate runnable | tools/grugops/state-roll.js with line conservation + rollback | ✓ |
| Agent step in WF09 | Agent moves entries by hand | |

| Option | Description | Selected |
|--------|-------------|----------|
| Status only; directives to 50-decisions | Status entries roll; directives become decision records | ✓ |
| Roll all but pinned | Pin marker exempts | |
| Roll oldest, no exception | Simplest | |

---

## Budgets + ticket tension

Finding raised: a 32 KB ticket budget fails about 25–30% of dogfood tickets before Phase 38 copies board trailers in.

| Option | Description | Selected |
|--------|-------------|----------|
| Frozen pre-v3 list | 32 KB + migrate-written exemption list | |
| Higher budget, no exemption | e.g. 64 KB; outliers fail until split | ✓ |
| Fail honestly | 32 KB, no exemption | |

| Option | Description | Selected |
|--------|-------------|----------|
| Finding, blocks the gate | Exit 1 is a gate finding | |
| Observation only | Reported, never blocks | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Use them; research may tune | board 24 KB with rows of at most 160 chars, index entry 200 B, NFR 8 KB, trace 8 KB, progress 16 KB, Done N=20 | ✓ |
| Tighter | | |
| Looser | | |

---

## Claude's Discretion

- Blocked-reason section layout in the ticket body
- Archive folder names for queue/done and 50-decisions; how the move-only rule is stated and checked
- Index line formats
- Shared budget logic between validator and state-check
- CLI flags and output wording for state-check and state-roll
- Build shape of trace-render.js

## Deferred Ideas

- Moving existing standing directives out of host progress files (Phase 38 or manual)
- Tightening budgets after migrated-repo data

# Phase 32: Board Projector & CLI Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-13
**Phase:** 32-board-projector-cli-dashboard
**Areas discussed:** Row grammar canonical form, Column heading authority, Conflicts & stale semantics, Dashboard surface & JSON shape

**Pre-discussion evidence:** two real agent-written boards were found and sampled at
`~/Projects/hacks/grugops-examples/{cli-chess-example,dogfood-example}/plans/board.md`, discharging the
roadmap's "sample real rows before freezing the grammar" research flag. A codebase scout mapped the
validator's board parser, the atomic-write ENOENT window, existing readers, and the import-graph walker.

---

## Row grammar canonical form

| Option | Description | Selected |
|--------|-------------|----------|
| ID + title only | Parenthetical is one opaque `meta` string | ✓ |
| ID + title + best-effort hints | Non-authoritative key:value map from the parenthetical | |
| Full parenthetical grammar | Strict shape, refuse rows outside it | |

| Option | Description | Selected |
|--------|-------------|----------|
| Config id_prefix + digits | `^[A-Z][A-Z0-9]*-\d+$`, prefix must equal config; EPIC-/FEAT- rows a named class | ✓ |
| Any PREFIX-number | No config read; epics and tickets one class | |
| Exactly `[A-Z]{3}-\d{3}` | Shipped example shape only | |

| Option | Description | Selected |
|--------|-------------|----------|
| Strip comments first; `_Updated:` as its own class | Comment pre-pass; `updates[]`; fuzz asserts doc block yields nothing | ✓ |
| Strip comments; ignore `_Updated:` | Drop header lines as noise | |
| Indent rule only | Keep implicit indentation behaviour, no stripper | |

| Option | Description | Selected |
|--------|-------------|----------|
| Board comment + contract doc | Rewrite the 48-line comment; add `agent-factory/contracts/board.md` | ✓ |
| Contract doc only | Comment trimmed to a pointer | |
| Module docblock only | Spec lives in `board-model.ts` header | |

**User's choice:** all four recommended options.
**Notes:** User declined follow-ups on nested sub-bullets and duplicate rows; duplicates were later folded into the `ticket-duplicated` conflict kind, nesting deferred.

---

## Column heading authority

| Option | Description | Selected |
|--------|-------------|----------|
| Semantics preserved, defects fixed | Keep exact-equality, widen suffix strip to three canonical forms, name deviations | ✓ |
| Byte-for-byte port | Carry the Blocked and phantom-column defects into conflicts | |

| Option | Description | Selected |
|--------|-------------|----------|
| `(visible, time-tracked)` only | Old spec's `## Blocked (2)` documented non-grammar | ✓ |
| Accept both shapes | Wider parser | |

| Option | Description | Selected |
|--------|-------------|----------|
| Board headings cross-checked against config | Headings define set; config supplies limits; disagreements are conflicts | ✓ |
| Config is the authority | Fixed 13 names; others unparsed | |
| Board only, no config read | Zero coupling | |

| Option | Description | Selected |
|--------|-------------|----------|
| Parsed, compared to row count, conflict on mismatch | `claimedLive` vs `rows.length` | ✓ |
| Parsed and trusted | Heading number is truth | |
| Ignored; rows are counted | Only limit read from heading | |

**User's choice:** all four recommended options.
**Notes:** Declined follow-up on how the validator consumes board-model; resolved in CONTEXT D-06 (first `scripts/` import into the validator).

---

## Conflicts & stale semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Board column vs ticket `column:`/`status:` | Core DASH-03 case | ✓ |
| Ticket in 0 or 2+ columns | Unplaced or duplicated | ✓ |
| Row without a ticket file | Reported, row still renders | ✓ |
| Config vs heading | wip-limit, wip-count, column-missing | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Per-source staleness, one badge | Each source carries readAt + stale reason | ✓ |
| Whole-snapshot staleness | Any failure marks all stale | |

| Option | Description | Selected |
|--------|-------------|----------|
| Absent legitimate, unreadable stale | `.grugops/` missing renders "no queue" | ✓ |
| Any missing source is stale | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Poll 2s, debounce 150ms, `--interval` | | |
| Poll 5s, debounce 500ms | | |
| Poll 1s, debounce 50ms | | |
| Other: poll every 10s | "usually tasks don't move that fast" | ✓ |

**User's choice:** all conflict kinds; per-source staleness; absent vs unreadable; **10-second poll floor (free-text)**.
**Notes:** Claude proposed keeping event-driven debounced (250 ms) re-reads on `fs.watch` with the 10s poll as safety net and a 1s floor on `--interval`; user moved on without objection.

---

## Dashboard surface & JSON shape

| Option | Description | Selected |
|--------|-------------|----------|
| `node scripts/board-dashboard.js` + npm script | No skill, no shim | ✓ |
| Also add a `/grug board` skill | Eighth byte-gated skill twin | |
| Installer lays a shim | New installer class | |

| Option | Description | Selected |
|--------|-------------|----------|
| Header, columns, now-running, conflicts | | ✓ |
| Above plus recent context notes | | |
| Columns only | | |

| Option | Description | Selected |
|--------|-------------|----------|
| `schemaVersion: 1` + exported type + golden test | | ✓ |
| Also emit a JSON Schema file | | |
| Type only, no version field | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Size ceiling with visible degrade | Parse, warn, truncate text fields, never drop rows | ✓ |
| Hard refuse over the ceiling | | |
| No bound | | |

**User's choice:** all four recommended options.
**Notes:** none.

---

## Claude's Discretion

- Exact regexes and fuzz axes (derived from the contract).
- Whether the two real boards are copied (trimmed) into `scripts/fixtures/` or only sampled.
- Internal shape of `unparsed[]` / `updates[]` beyond named fields; debounce and retry internals; the `--json --watch` flag name.

## Deferred Ideas

- Board bloat rule for agents (per-hop detail belongs under tickets, not on the board) — from `human-notes.txt`.
- `/grug board` skill; recent-notes block; JSON Schema file; web renderer; Phase 30 banner site; per-ticket traceability cell join; nested sub-bullet grammar.

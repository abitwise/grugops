---
kind: contract
contract: board-grammar
requirement: DASH-01
---

# Contract: the board grammar (DASH-01)

This document is the authoritative schema for `plans/board.md` — the single source of WIP truth
in a grugops repository. The schema is written in clear professional voice because it is a trace
and safety surface: the board is what a human reads to learn where work stands, and a parser that
quietly reinterprets it reports a state nobody wrote.

The only sanctioned reader of this grammar is `scripts/board-model.ts` (compiled to
`scripts/board-model.js`). No other module parses board headings or board rows. A second reader
would be free to disagree with this one, and a disagreement between two parsers is invisible until
it has already misreported the board.

The posture here is admission, not interpretation. A small canonical form is stated below, a
document written in exactly that form is admitted, and every other byte is refused by name. The
parser is never widened once per counter-example. Refusal is loud: a refused line is reported with
its line number, so a human sees what the projector declined to read.

## Headings

A **column heading** is a level-two ATX heading whose suffix is one of exactly three forms. The
suffix count is pinned two-sided in `scripts/board-model.ts` as `HEADING_SUFFIX_COUNT`. A fourth
form is a decision recorded here first, never a bumped constant.

| Form | Shape | Column kind | Numbers carried |
|------|-------|-------------|-----------------|
| Limited | `## <Name> (WIP <live>/<limit>)` | `limited` | `claimedLive`, `limit` |
| Unlimited | `## <Name> (WIP unlimited)` | `unlimited` | none |
| Blocked | `## Blocked (visible, time-tracked)` | `blocked` | none |

```markdown
## In Development (WIP 1/3)
## Backlog (WIP unlimited)
## Blocked (visible, time-tracked)
```

Rules that bound the three forms:

- `<Name>` is whatever precedes the suffix, trimmed. Two headings whose names match remain two
  separate columns, in the order they appear on disk.
- The Blocked form admits the single name `Blocked`. A heading such as `## Stuck (visible,
  time-tracked)` opens no column.
- A level-two heading whose suffix matches none of the three forms is a **non-column heading**. It
  opens no column, it closes any column already open, and its own lines belong to a non-column
  section. `## Columns (spec §6.1)`, `## Conventions` and `## Notes (bootstrap, 2026-06-05)` are
  all non-column headings.
- A heading at level three or deeper never opens a column, and never closes one.
- The heading scan is anchored at the start of the line. An indented heading opens no column,
  because indented example boards appear inside documentation blocks in this very file's sibling,
  `plans/board.md`.
- A comment-blanking pre-pass runs before the heading scan, so a heading inside an HTML comment is
  invisible to this grammar. See the Comments section below.

`## Blocked (2)` is **documented non-grammar**. The pre-Phase-32 builder specification showed that
shape, so it appears in real trees. It fails every form above, so it opens no column and its rows
are reported as unparsed lines. The projector shows the refusal rather than guessing at intent.

### Column names and ticket status

A ticket file names its column in frontmatter as `column:` and its status as `status:`. The status
is the kebab-case form of the column name, computed by `kebab()` in `scripts/board-model.ts`.
Membership is decided by exact equality of the column name after the suffix strip. A bare prefix
match is refused: the column `In` does not match the heading `## In Development (WIP 0/3)`.

## Rows

A **ticket row** is a top-level bullet carrying a bracketed identifier, one space, and a title.

```markdown
- [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)
- [ABC-016] Empty-state UI
- [DOG-001] Project scaffold  (epic: EPIC-006, size: M, P0)  — merged 2026-06-06
```

The grammar is `- [<ID>] <title>` and nothing more. Everything after the title is opaque:

- The **parenthetical** opens at the first occurrence of two spaces followed by `(`, and runs to
  its balanced closing parenthesis. Its contents become one opaque string named `meta`. Nothing
  inside `meta` is interpreted, so nested parentheses are preserved verbatim.
- Everything after the balanced close becomes a second opaque string named `trailer`. Nothing
  inside `trailer` is interpreted either.
- A row with no parenthetical is legal. Its `meta` is null and its `trailer` is empty.
- A parenthetical that never closes leaves the whole remainder as the title, with a null `meta`.
  The row stays legal, because an unclosed parenthesis is a typing slip rather than a new shape.
- The row scan is anchored at the start of the line. An indented bullet is not a ticket row.

The two-space gap is what discriminates a real parenthetical from a title that happens to contain
parentheses. A title such as `Login 500 (runtime .env not loaded)` uses one space, so the split
lands on the later two-space group. The rule was measured against 141 rows drawn from two
agent-written boards, the builder specification, and the worked examples in this repository. All
141 rows are admitted under it.

### Identifiers

An identifier matches `^[A-Z][A-Z0-9]*-\d+$`. Where `factory.config.json` carries `id_prefix`, a
ticket identifier's prefix equals that value. Any other bracket content makes the line unparsed.

Identifiers prefixed `EPIC` or `FEAT` are a **second class**. They record epics and features rather
than tickets, they are collected separately, and they are never joined against `plans/tickets/`.
Epic rows do not count toward a column's WIP number.

## Comments

Every `<!-- … -->` span is blanked before any heading scan or row scan runs. Blanking replaces each
character of the span with a space, so every line number survives into the reported model. A
comment that opens without closing blanks the remainder of the file, which is the fail-closed
direction: a board renders visibly empty rather than partially and confidently.

The rule exists because `plans/board.md` ships a documentation block carrying a structurally valid
example board, indented by four spaces. Indentation alone is not the defence. One stray left-trim
in a parser would promote that example into live state.

## Update lines

A line matching `_Updated: <YYYY-MM-DD> by <actor>` is an update entry carrying a date, an actor,
and the remaining text. An `_Updated:` line in any other shape is an unparsed line. Update entries
are their own class, so they never become rows.

## Conflicts

Filled by plan 32-02.

## Staleness

Filled by plan 32-02.

## Bounds

Filled by plan 32-02.

## Reconciliation

Filled by plan 32-02.

## Relationship to the builder specification

`docs/initial/agent_factory_builder_spec_v2.md` lists "web UI, dashboards" among its non-goals. The
projector this contract serves is a read-only terminal renderer plus a JSON document. It opens no
socket, it serves no page, and it writes no file. The non-goal stands unchanged.

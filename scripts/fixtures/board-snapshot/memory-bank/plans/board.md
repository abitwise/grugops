# Board (board-snapshot fixture)

_Updated: <ISO date> by <role>_

This paragraph is preamble prose. It sits before the first level-two heading, so it lands in
`preamble[]` rather than in `unparsed[]` (D-24). The placeholder update line above it is preamble
too: it is not in the canonical `_Updated: YYYY-MM-DD by <actor>` shape, so it is not an update
entry, and a fresh install must not meet it as a finding.

_Updated: 2026-09-14 by Orchestrator — the canonical shape, so this one IS an update entry

<!--
  FORMAT — this block is documentation, and the comment pre-pass blanks it before any heading or
  row scan runs (D-03). The mini-board below is four-space indented as well, so the fixture
  exercises BOTH defences at once — but the indentation is not what makes it safe, the blanking is.

    ## In Development (WIP 1/3)
    - [ABC-777] a documented example, never live state
    _Updated: 2026-01-01 by Nobody

  Nothing above contributes a column, a row or an update. The golden proves it: no entry in the
  committed snapshot carries a line number from inside this span.
-->

## Notes (fixture)

This is a non-column section. Its heading matches none of the three D-05 suffixes, so it opens no
column, and these prose lines belong to the section rather than to `unparsed[]`.

## Backlog (WIP unlimited)

- [ABC-101] Something in the backlog  (owner: BA/PM, since: 2026-09-01)

## Ready (WIP 1/5)

- [ABC-102] A ticket whose file disagrees about its column  (owner: Software Engineer)
- [XYZ-001] A foreign identifier prefix, refused by the configured id_prefix

## In Development (WIP 2/3)

- [ABC-103] A ticket whose status is not the kebab form of its column
- [ABC-104] A ticket that agrees with its file in every respect
- [ABC-999] A row naming an identifier with no ticket file
- [EPIC-006] The epic row, a second class that never counts toward WIP

A prose paragraph inside a column section. It is neither heading, row, epic row nor update, so it
is an unparsed line carrying the column it sat under.

## In Review (WIP 1/3)

- [ABC-105] A ticket that also appears under a second heading

## Done (WIP unlimited)

- [ABC-105] The same identifier again, under a second heading

## Blocked (visible, time-tracked)

- [ABC-106] Waiting on a decision  (since: 2026-09-02)

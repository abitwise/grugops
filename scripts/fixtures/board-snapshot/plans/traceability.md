# Traceability Matrix (board-snapshot fixture)

<!--
  FORMAT — read before you append.

  Example row shape (this is a comment, NOT a live table row — the generic `ABC-` prefix
  illustrates the format only):

    | ABC-012 | FX conversion | EPIC-003 | FEAT-007 | NFR-002 | #41 / src/fx/* | fx.spec.ts | UAT-12 pass | REL-0007 | Done |

  The row above is the hazard this fixture exercises: the traceability reader runs the board's own
  comment pre-pass first, so this line contributes no entry. A reader that scanned for pipes
  without blanking comments would report it as live state.
-->

| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |
|--------|-------|------|---------|------|-----------------|-------|-----|---------|--------|
| ABC-101 | Something in the backlog | EPIC-006 | FEAT-007 | NFR-001 | | | | | Backlog |
| ABC-104 | A ticket that agrees with its file | EPIC-006 | FEAT-007 | NFR-001 | #12 | board.spec.ts | | | In Development |

# Traceability Matrix
_Updated: <date>_

<!--
  FORMAT — read before you append. (clear voice; this is a technical file, not a role prompt.)

  This file is the single requirement -> ticket -> code -> test -> UAT -> release matrix for grugops.
  It ships EMPTY: header + separator only, zero data rows. Roles append rows as work is done.

  One row per ticket. The header columns below are fixed — do not rename or reorder them.

  Example row shape (this is a comment, NOT a live table row — the generic `ABC-` prefix
  illustrates the format only):

    | ABC-012 | FX conversion | EPIC-003 | FEAT-007 | NFR-002 | #41 / src/fx/* | fx.spec.ts, e2e/fx | UAT-12 pass | REL-0007 | Done |

  Stable ID scheme (set the ticket prefix in config `id_prefix`, default `ABC`):

    EPIC-xxx     epic
    FEAT-xxx     feature
    <prefix>-xxx ticket (project prefix + number; prefix from config `id_prefix`, default `ABC`)
    ADR-000x     architecture decision
    NFR-xxx      non-functional requirement
    RISK-xxx     risk
    REL-xxxx     release
    INC-xxxx     incident

  Append rules:
    - BA/PM creates the row when a ticket is born.
    - Each role appends its link as it completes work (Architect adds ADR/NFR; Engineer adds
      PR/files; QE adds tests; UAT adds result; Release adds REL id).
    - Definition of Done (enterprise) is not met until the row is complete through the relevant stage.
    - The validator can check for tickets missing rows or rows missing tests.
-->

| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |
|--------|-------|------|---------|------|-----------------|-------|-----|---------|--------|

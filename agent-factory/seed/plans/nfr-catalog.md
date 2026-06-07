# NFR Catalog
_Updated: <date>_

<!--
  FORMAT — read before you append. (clear voice; this is a technical file, not a role prompt.)

  This is the single list of non-functional targets (SLOs and quality bars) for grugops.
  It ships EMPTY: header + separator only, zero data rows.

  Ownership: Architect/Design seeds it; Security/NFR checks against it; Release Manager
  attaches evidence. Tickets reference NFR IDs in their traceability row; Security/NFR fails
  a gate if a touched flow violates a referenced target. Keep targets few and real.

  NFR IDs follow the stable scheme: NFR-xxx (see plans/traceability.md for the full ID scheme).

  Example row shape (this is a comment, NOT a live table row — illustrates the format only):

    | NFR-001 | Performance | p95 API < 300ms | all read endpoints | load test / QE |

  Categories to consider: performance, scalability, availability, reliability/DR, security,
  privacy/compliance, accessibility, observability, maintainability, portability, i18n/l10n, cost.
-->

| ID | Category | Target | Applies to | Verified by |
|----|----------|--------|------------|-------------|

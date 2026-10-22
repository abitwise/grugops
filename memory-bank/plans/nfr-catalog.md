# NFR Catalog
_Updated: <date>_

<!--
  FORMAT — read before you add an NFR. (clear voice; this is a technical file, not a role prompt.)

  This catalog is the index of the non-functional targets (SLOs and quality bars) for this
  repository. Each NFR is its own file, memory-bank/plans/nfr/NFR-xxx.md, and this index has one
  line per file, in this form:

    - [NFR-xxx](nfr/NFR-xxx.md) <category>: <target>

  The index is kept by hand: add the line when you add the file, and remove it when you remove the
  file. Each index line is at most 200 bytes (BUDGETS.indexEntryBytes). The index ships with no
  line, and there is no table.

  `node tools/grugops/state-check.js <repo-root>` checks the index against the files in both
  directions: every line names an existing file, and every file has exactly one line.

  An NFR file holds the category, the target, what it applies to, how it is verified, and the
  evidence that it is met. Categories to consider: performance, scalability, availability,
  reliability/DR, security, privacy/compliance, accessibility, observability, maintainability,
  portability, i18n/l10n, cost.

  Ownership: Architect/Design adds NFRs; Security/NFR checks work against them; Release Manager
  attaches evidence. Tickets name the NFR IDs they touch, and Security/NFR fails a gate if a
  touched flow breaks a named target. Keep targets few and real.
-->

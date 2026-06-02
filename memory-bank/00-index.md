---
kind: index
---
# Memory Bank — Index
_Updated: <date>_

<!--
  FORMAT — read before you fill this bank. (clear voice; this is a technical file, not a role prompt.)

  This is the project's persistent working memory. It ships EMPTY: each file below is named
  with its one-line purpose, but carries no project content — fill it per-project during
  bootstrap. Keep every file small and single-purpose; this is a memory bank, not a document dump.
-->

## Working-memory contract

- Roles **read this bank on start** to orient in one read.
- `60-progress.md` is the **running plan-of-record**, kept current by the **daily sweep**.
- `50-decisions/` captures **ADRs as they are made** (copy `50-decisions/ADR-template.md`).
- This index **maps the bank** so an agent or human can orient quickly.

## The bank

| File | Purpose |
|------|---------|
| `00-index.md` | this map + the working-memory contract |
| `10-project-brief.md` | the project's foundation: what, why, for whom |
| `20-product.md` | product context: users, value, scope |
| `30-architecture.md` | architecture, system patterns, tech context |
| `40-contributing.md` | how to contribute and the project conventions |
| `50-decisions/` | architecture decision records (ADRs); see `ADR-template.md` |
| `60-progress.md` | running plan-of-record: what works, what's left, known issues |
| `70-runbook.md` | how to operate, deploy, and roll back in production |
| `80-glossary.md` | shorthand, acronyms, domain terms |

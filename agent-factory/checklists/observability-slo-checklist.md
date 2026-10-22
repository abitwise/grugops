---
kind: checklist
tier: enterprise
---
# Observability / SLO Checklist

Apply this checklist when a ticket touches a user-facing or critical path. The SLO/target is
referenced from its NFR file under `memory-bank/plans/nfr/`, found through the index
`memory-bank/plans/nfr-catalog.md` (cite it, do not redefine it); the dashboard/runbook link lives in
`memory-bank/70-runbook.md`.

- structured logs (no sensitive data)
- key metrics emitted
- traces on critical path
- alert defined for user-facing failure
- SLO/target referenced from its NFR file, found through the nfr-catalog index
- dashboard/runbook link in memory-bank/70-runbook.md

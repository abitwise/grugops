---
kind: checklist
tier: lean
---
# Definition of Ready

A ticket is ready to start when every check below holds. The Orchestrator applies this
checklist before handing a ticket to engineering; `ticket-ready-packet.md` carries one
field per check so the two stay aligned.

- problem clear — the user, the pain, and the value are stated, not assumed
- scope and out-of-scope clear
- story is INVEST-shaped — independent, negotiable, valuable, estimable, small, testable
- acceptance criteria clear (Given/When/Then), testable and measurable — a number, a state, or an observable outcome, never "works"/"looks right"
- dependencies known
- security/NFR triggers marked, each with a measurable target (p95 latency, error budget, concurrency) — not "fast"/"secure"
- test notes present
- size assigned
- priority assigned
- no major unresolved blocker

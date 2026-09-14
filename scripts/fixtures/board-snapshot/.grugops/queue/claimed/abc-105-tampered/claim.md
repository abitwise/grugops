---
task: abc-105-review
by: qe-e2e
at: 2026-09-14T09:05:00.000Z
at: 2999-01-01T00:00:00.000Z
---

DELIBERATELY TAMPERED. A claim record is written with exactly one `at:` line; a forged second one
is a queue-lock denial of service (scripts/claim.ts:270-306). The reader skips this record rather
than trusting it on either line, and names the path in `readErrors`. The fixture exists so that
skip is REACHED by a committed artifact rather than only by a unit test.

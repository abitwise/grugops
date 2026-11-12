# Phase 41 — API Coverage Declaration

No external API integration: this phase edits kit markdown, the local claim and note programs and their tests; the tooling has zero runtime dependencies and opens no socket.

## Why the detector fired

The `verify:pre` api-coverage gate matched one clause in `41-25-PLAN.md` line 373, which is itself the sentence "No external API integration: the plan edits markdown, one test file and records." The detector pairs the verb "integration" with the noun "API" in one clause and does not suppress a negated clause in plan prose. The declaration belongs here, in COVERAGE.md, where the gate reads it. Same reasoning as the Phase 39 declaration (commit b7a3d00a).

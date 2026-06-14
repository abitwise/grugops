# Test Skip Registry (RED fixture — the SC3 keystone)

This registry is identical in shape to the GREEN fixture except the single row carries a
placeholder owner (`agent`) instead of a real, accountable human. A placeholder owner is the
canonical HOLLOW justification — the shape an agent would produce if it tried to self-author a
skip to clear its own gate. The checker must reject it and exit 1.

| Test ID | Reason | Owner | Ticket/REQ | Expiry (YYYY-MM-DD) | Category |
|---------|--------|-------|------------|---------------------|----------|
| auth.login.rate-limit | upstream rate-limiter unavailable in CI | agent | ABC-101 | 2099-12-31 | external-dependency |

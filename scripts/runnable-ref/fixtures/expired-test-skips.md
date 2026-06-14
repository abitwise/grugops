# Test Skip Registry (expired fixture)

This row is well-formed in every field — real owner, cited Ticket/REQ, on-list category — but its
Expiry is far in the past. An expired justification no longer counts and must block, even when the
host skip count balances against it. The checker must exit 1.

| Test ID | Reason | Owner | Ticket/REQ | Expiry (YYYY-MM-DD) | Category |
|---------|--------|-------|------------|---------------------|----------|
| auth.login.rate-limit | upstream rate-limiter unavailable in CI | Dana Lopez | ABC-101 | 2000-01-01 | external-dependency |

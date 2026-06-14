# Test Skip Registry (GREEN fixture)

This is a clean, well-formed skip registry: every row has a real owner, a cited Ticket/REQ, an
on-list category, and a far-future expiry, so test-skip-integrity.js exits 0 (pass) as long as
the host skip count does not exceed the valid-justification count.

| Test ID | Reason | Owner | Ticket/REQ | Expiry (YYYY-MM-DD) | Category |
|---------|--------|-------|------------|---------------------|----------|
| auth.login.rate-limit | upstream rate-limiter unavailable in CI | Dana Lopez | ABC-101 | 2099-12-31 | external-dependency |
| ui.dashboard.chart-render | known intermittent canvas timing flake | Sam Okoro | ABC-102 | 2099-12-31 | flaky-quarantine |
| billing.export.pdf | feature behind the pdf-export flag, not yet enabled | Priya Nair | ABC-103 | 2099-12-31 | wip-behind-flag |

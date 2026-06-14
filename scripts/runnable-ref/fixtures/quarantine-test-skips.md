# Test Skip Registry (flaky-quarantine fixture — the non-blocking lane)

A single valid, unexpired `flaky-quarantine` row. The quarantine lane is non-blocking (D-04): a
well-formed, unexpired quarantine entry counts as a justification, so with a matching skip count
the checker exits 0 (pass).

| Test ID | Reason | Owner | Ticket/REQ | Expiry (YYYY-MM-DD) | Category |
|---------|--------|-------|------------|---------------------|----------|
| ui.dashboard.chart-render | known intermittent canvas timing flake | Sam Okoro | ABC-102 | 2099-12-31 | flaky-quarantine |

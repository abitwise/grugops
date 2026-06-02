---
kind: checklist
tier: lean
---
# Security / NFR Checklist

Apply this checklist whenever a ticket touches authentication, data handling, or a
non-functional concern. This is a safety gate: reproduce each control exactly, never skip
one. The "performance impact vs NFR catalog" check references `plans/nfr-catalog.md` —
cite the catalog's targets; do not redefine them here.

- auth + permissions checked
- input validation checked
- secrets handling checked
- personal/financial data handling checked
- logs do not leak sensitive data
- rate-limit / abuse considered
- performance impact vs NFR catalog
- reliability / fallback considered
- monitoring / audit considered
- GDPR/compliance notes when relevant

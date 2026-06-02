---
kind: checklist
tier: enterprise
---
# Compliance Checklist

Apply this checklist when a ticket touches regulated or sensitive data. This is a safety and
compliance gate: reproduce each control exactly and record the control-to-evidence mapping
for the frameworks in scope (SOC2 / ISO 27001 / PCI as set). Never fabricate a control or an
evidence reference.

- data classified (public / internal / confidential / regulated)
- lawful basis / consent noted (GDPR) where applicable
- PII data-flow mapped (collected -> stored -> shared -> deleted)
- retention + deletion policy noted
- access controls documented
- audit logging present for sensitive actions
- DPIA-lite done for high-risk processing
- control -> evidence mapping recorded (SOC2/ISO 27001/PCI as set)

---
kind: index
---
# Checklists — Index
_Updated: <date>_

These checklists are the gate contracts for grugops. Each checklist is a small markdown file with a
`kind: checklist` + `tier:` frontmatter and a verbatim list of checks. Roles read the
relevant checklist before passing a gate; the Phase-6 validator checks each file is present.

**Mode-gating rule:** the Orchestrator applies the lean Definition of Done in `mode: lean`
and the enterprise superset (`definition-of-done-enterprise.md`, plus the enterprise gates)
in `mode: enterprise`. The active mode is read from `factory.config.json` (`mode` field). The
enterprise tier is a strict superset of lean, never a divergent rewrite.

## Lean tier

Always active.

| Checklist | Applies at |
|-----------|------------|
| `definition-of-ready.md` | before a ticket starts (Definition of Ready) |
| `definition-of-done.md` | before a ticket closes (lean Definition of Done) |
| `pr-review-checklist.md` | when reviewing a pull request |
| `security-nfr-checklist.md` | when auth, data handling, or an NFR is touched |
| `uat-checklist.md` | when preparing and running UAT |

## Enterprise tier

Active only in `mode: enterprise` (in addition to the lean tier).

| Checklist | Applies at |
|-----------|------------|
| `definition-of-done-enterprise.md` | before a ticket closes (superset of lean DoD) |
| `compliance-checklist.md` | when regulated or sensitive data is touched |
| `accessibility-checklist.md` | when the user interface changes |
| `observability-slo-checklist.md` | when a user-facing or critical path is touched |
| `release-readiness-checklist.md` | before a release |
| `linter-recommendations.md` | when configuring the lint step at the gate |
| `playwright-visual-regression-recipe.md` | when verifying UI visual baselines at the gate |

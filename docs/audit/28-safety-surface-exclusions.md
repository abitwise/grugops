# Phase 28 safety-surface exclusion list (D-18)

> **GENERATED — do not hand-edit.** Regenerate with:
>
> ```
> npm run generate:safety-surface
> ```

- **Entries:** 41
- **Derived from:** `docs/audit/28-disposition-register.md` (rows flagged `safety_surface: yes`) ∪ `docs/audit/28-claim-registry.md` (rows with `kind: safety`)

## What honouring this list means (Phase 29 / LANG-02 and LANG-03)

**No text in a listed file is reworded by a style pass.** LANG-03 requires a named
safety-surface exclusion list to be honoured; this is that list. A file appears here because at
least one sentence in it is load-bearing — it grants or withholds a permission, states a
no-fabrication floor, or is the text a public safety claim was measured against — and the flag
is per FILE, so the list cannot tell you WHICH sentence. Treat the whole file as out of scope
for rewording, or read it and make the sentence-level judgement deliberately; do not infer from
a file's absence from a diff that its text was safe to touch.

## What this list does not settle

**It is not selective, and saying so is part of the measurement.** Every one of the 37 audited
kit files carries permission-bearing or no-fabrication text — every role's `## Hard limits` and
every workflow's `## Commit` section at minimum — so the register arm flags all of them. The
list therefore covers the entire audited corpus plus the public documents that host safety
claims. That is the honest output of a per-file flag, not a defect in the derivation: the
question LANG-02 actually faces is which SENTENCES are load-bearing, a granularity this column
cannot express and was not built to. Manufacturing variance to make the list look discriminating
would be an unearned verdict; recording the true extent and naming the limit is the smaller
error.

## Excluded files

| file | why it is listed |
|---|---|
| `.claude-plugin/plugin.json` | home of safety claim C-28-038 |
| `AGENTS.md` | home of safety claim C-28-010; home of safety claim C-28-018 |
| `README.md` | home of safety claim C-28-001 |
| `agent-factory/README.md` | home of safety claim C-28-023; home of safety claim C-28-032 |
| `agent-factory/roles/_role-switch-protocol.md` | register row flagged `safety_surface: yes` (`kind: protocol`) |
| `agent-factory/roles/agents-md-scribe.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/architect-design.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/ba-pm.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/brownfield-mapper.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/compliance-officer.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/factory-coach.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/frontend-ui.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/greenfield-mapper.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/incident-responder.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/installer.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/orchestrator.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/qe-e2e.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/release-manager.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/security-nfr.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/software-engineer.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/system-analyst.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/roles/uat-planner.md` | register row flagged `safety_surface: yes` (`kind: role`) |
| `agent-factory/workflows/00-bootstrap-greenfield.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/01-bootstrap-brownfield.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/02-idea-to-epics.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/03-epic-to-tickets.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/04-ticket-to-pr.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/05-pr-quality-gate.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/06-uat-pack.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/07-backlog-refinement.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/08-sprint-planning.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/09-daily-sweep.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/10-sprint-review.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/11-retro.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/12-release.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/13-incident.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/14-ui-design-to-build.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/15-security-audit.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/16-context-read-write.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/17-task-claim.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |
| `agent-factory/workflows/18-context-compaction.md` | register row flagged `safety_surface: yes` (`kind: workflow`) |

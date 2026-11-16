# Phase 42: Skills per role and evaluation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-16
**Phase:** 42-skills-per-role-and-evaluation
**Areas discussed:** Role skill declarations, Evaluation bar and record, ui-ux-pro-max and design-system/, Doctor skill warning

---

## Role skill declarations

| Question | Options | Selected |
|----------|---------|----------|
| What may a role's `skills:` line name? | Third-party only / Both own and third-party / You decide | Third-party only |
| Section for roles with no skill? | No section, no key / Every role gets a section | No section, no key |
| Plugin-namespaced names? | Bare kebab name / Widen grammar to plugin:skill | Bare kebab name |
| Fallback shape? | Inline per role / Shared fallback checklist / You decide | Inline per role |
| Run-time discovery? | Host's skill list only / Check the known paths | Host's skill list only |
| Role-switch protocol step? | One step, path table elsewhere / Full per-host table in protocol | One step, path table elsewhere |
| Note record? | Only when declared skill applies / Always a skills line | Only when declared skill applies |
| Capability fit? | No: grant or don't list / List it anyway | No: grant or don't list |

**Notes:** All recommended options chosen.

---

## Evaluation bar and record

| Question | Options | Selected |
|----------|---------|----------|
| Granularity? | Per sub-skill / Whole plugin only | Per sub-skill |
| Record location? | Phase decision record + public doc / Public doc only / .planning only | Phase decision record + public doc |
| Pinning? | Tag + commit SHA / Commit SHA only / Tag only | Tag + commit SHA |
| `allowed-tools: Bash` skill? | Block until verified / Recommend with a warning | Block until verified |
| Precedence rule location? | AGENTS.md, one line / Role-switch protocol / WF16 | AGENTS.md, one line |
| Who ratifies? | Named human ratifies / Evaluation decides | Named human ratifies |
| Re-evaluation? | Only by explicit trigger / Every grugops release | Only by explicit trigger |
| Candidate list? | Closed: the six only / Add ponytail-review | Closed: the six only |

**Notes:** All recommended options chosen.

---

## ui-ux-pro-max and design-system/

| Question | Options | Selected |
|----------|---------|----------|
| Which role declares it? | Designer + Frontend/UI / Frontend/UI only / Designer only | Designer + Frontend/UI |
| Who may run `--persist`? | Only the user / Role may persist if absent | Only the user |
| design-system/ vs Designer notes conflict? | design-system/ wins, Designer records it / Designer notes win / Stop and ask a human | design-system/ wins, Designer records it |
| Frontend/UI fallback? | Today's behavior / Fallback checklist | Today's behavior |
| frontend-design relation? | Either/both, ordered / Only one UI skill / You decide | Either/both, ordered |
| Read design-system/ without the skill? | Yes, always read it / Only when the skill is present | **Only when the skill is present** (not the recommended option) |
| Rule home? | Designer role + WF14 / Also in protocol or AGENTS.md | Designer role + WF14 |

**Notes:** The user chose to gate reading `design-system/` on the skill's presence. CONTEXT.md D-20 records this and keeps the never-write rule unconditional.

---

## Doctor skill warning

| Question | Options | Selected |
|----------|---------|----------|
| Search scope? | Per installed host, one derived table / Project dirs only / Claude Code only | Per installed host, one derived table |
| Under `--strict`? | Exempt from --strict / --strict promotes it too | Exempt from --strict |
| Warning line content? | Role, skill, host, pointer / Include install command | Role, skill, host, pointer |
| Phase 39 leftovers (version probe, IN-04)? | Fold version probe, defer IN-04 / Fold both / Neither | Fold version probe, defer IN-04 |

---

## Claude's Discretion

- `## Skills` row layout and wording within the byte budget
- How the doctor finds installed Claude Code plugin skills
- How the doctor runs and parses `claude --version`
- Where the per-host skill-path table lives
- The shape of `42-EVALUATION.md`

## Deferred Ideas

- IN-04 (Phase 39 review, W1 phrase checks) to the backlog
- Evaluating ponytail-review or other skills
- Widening the `skills:` grammar to `plugin:skill`
- A general read-only rule for user design artifacts
- Calendar or per-release pin re-checks

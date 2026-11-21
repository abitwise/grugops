# Phase 39: Role machinery: engineer levels, Tech Lead and Designer roles, skills key - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-29
**Phase:** 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
**Areas discussed:** Tech Lead in the flow, Rubric and level adapters, Escalation path, Designer scope, extra (skills key, orchestrator size, exclusions)

---

## Tech Lead in the flow

| Question | Options | Selected |
|---|---|---|
| When does it run | Every ticket both modes / Enterprise + lean M+ / Enterprise only | Every ticket, both modes. The user asked to check overlap with the Architect |
| Placement | WF04 / WF03 / Both | WF04 |
| TL model | inherit / pin opus | inherit |
| TL output | decision note + ticket section / separate dev-plan file | decision note + ticket section |
| F2=2 approach undesigned | Send back to Architect / TL designs small gaps | Send back to Architect |
| DoR and split | Orchestrator DoR then TL / TL owns both | Orchestrator DoR then TL |
| Test plan | Architect strategy, TL per-ticket / TL reads QE only | Architect strategy, TL per-ticket |
| Board column | No new column / In Planning | No new column |
| Batching | No / same-shape XS | No |
| Plan wrong | Stop BLOCKED back to TL / Engineer adapts | Engineer adapts within ticket |
| Tier | core / enterprise | core |

**Notes:** The overlap check was done in-session (architect-design.md and WF04 step 1 read).

## Rubric and level adapters

| Question | Options | Selected |
|---|---|---|
| Rubric | F1–F6 starting values / 3-factor / size map | F1–F6 starting values |
| Names | -junior/-mid/-senior no base / keep base (22) | no base, 21 adapters |
| Effort | mid medium + senior high / mid high + senior xhigh / you decide | mid medium, senior high |
| Overrides | per-level stems too / role-level only | per-level stems too |
| Rubric home | new checklist / inside tech-lead.md | new checklist |
| preset none | pins stay / none unpins | pins stay |
| Other hosts | level scope only / scope + model tip | level scope only |
| Mapping | TL names adapter / Orchestrator maps | TL names adapter |

## Escalation path

| Question | Options | Selected |
|---|---|---|
| Trigger | BLOCKED or 2nd gate failure / 2nd failure only | BLOCKED or 2nd gate failure |
| Junior stop | back to TL / counts as escalation | Free text: "Plan can deviate somewhat, it should go back when the ticket is blocked." |
| After that | TL re-split then human / straight to human | Free text: "Tech Lead can decide to split or send back to architect, human is after that." |
| Who writes | Engineer writes + Orchestrator re-enqueues / Orchestrator writes both | Free text: "Engineer writes, but ticket should have new status which is the status Tech lead also works with. Orchestrator should not relay the data, it should only ask a role to work on X or Y." |
| Decider (follow-up) | TL decides every time / auto level-up once | TL decides every time |
| Status (follow-up) | reuse Blocked / back to Ready for Dev / new Needs Replan | reuse Blocked |
| CC floor | document only / warn if readable | document only |

## Designer scope

| Question | Options | Selected |
|---|---|---|
| 39 vs 42 | full role + WF14 in 39 / shell in 39 | full role + WF14 in 39 |
| Location | notes only / memory-bank master file / both | notes only |
| Cadence | once per product + per UI epic / every UI ticket | once per product, refresh per UI epic |
| Split | Designer system, FE/UI per-ticket / Designer strategy only | Designer system, FE/UI per-ticket |
| Tier | core on UI work / enterprise | core |

## Extra gray areas

| Question | Options | Selected |
|---|---|---|
| skills emit | role-side only / emit to adapter | role-side only |
| skills values | grammar only / seed obvious ones | grammar only |
| Orchestrator size | fit compactly / raise ceiling | fit compactly |
| Exclusions | rubric + junior text / also validator check | rubric + junior text |

## Claude's Discretion

- The generator's 1:N mechanism, the `LEVELS` table shape, the `skills:` list grammar and which grammar governs role frontmatter, whether `effort` applies to haiku, the derived count moves, and the layout of the Tech Lead section.

## Deferred Ideas

- The `claude --version` doctor probe (Phase 42), batching (after calibration), rubric calibration (a future milestone), and a validator junior/F3 cross-check (not planned).

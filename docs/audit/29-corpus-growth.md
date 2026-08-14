# What the writing profile cost, in bytes

Phase 29 put 47 governed documents and 17 role documents onto
`agent-factory/writing-profile.md`. This is the measurement of what that cost.

**It exists instead of a set of byte ceilings.** D-28 declines to invent per-file ceilings for the
workflows, checklists, seed templates and contracts: nothing external forces one, and nineteen-plus
new hand-measured baselines would be exactly the set-literal surface this milestone exists to delete.
The growth is measured and recorded here instead, per part and per file, so a later phase decides on
evidence rather than on a guess.

## Method

Every byte figure is `Buffer.byteLength` of the working tree at `9dfb8af` against
`Buffer.byteLength(git show 4d2b8f0:<path>)`, walked over the gate's own `GOVERNED_CORPUS_PARTS`
membership read through `import()` — never a directory listing and never a path retyped. `4d2b8f0` is
the phase base commit recorded by plan 29-04. The walk covers **47 of 47** members, matching
`GOVERNED_CORPUS_COUNT`.

The role corpus is walked separately, through `listRoles()` from `scripts/kit-model.js`. Roles are
**not** members of the governed corpus — the two guards over role prose are `guard_caveman_voice` and
`guard_role_clause_uniqueness`, and the role corpus is the one part of the kit that carries per-file
byte ceilings already.

## The four governed parts

| part | files | pre-phase | post-phase | Δ | % |
|---|---:|---:|---:|---:|---:|
| `agent-factory/workflows/` | 19 | 104,048 | 105,615 | **+1,567** | **+1.51%** |
| `agent-factory/checklists/` (hand-authored) | 13 | 19,368 | 19,495 | **+127** | **+0.66%** |
| `agent-factory/seed/**` | 13 | 14,205 | 14,285 | **+80** | **+0.56%** |
| `agent-factory/contracts/` | 2 | 15,185 | 15,256 | **+71** | **+0.47%** |
| **governed corpus** | **47** | **152,806** | **154,651** | **+1,845** | **+1.21%** |

### One of the four research baselines does not reproduce, and it is named rather than adopted

`29-RESEARCH.md` §A-2 states the pre-phase totals as **104,094 / 19,368 / 14,205 / 15,185**.

**Three reproduce exactly. The workflow figure does not: it measures 104,048 at `4d2b8f0`, 46 bytes
lower.** Reproduced through the research's own command shape —
`git archive 4d2b8f0 agent-factory/workflows | tar -xO | wc -c` → `104048` — as well as through the
gate's membership, so the discrepancy is not an artifact of walking a different file set. The research
figure was read off a tree that was not the phase base.

This confirms plan 29-10's independent finding rather than re-litigating it. **The measured 104,048 is
used throughout this document.** Adopting 104,094 would understate the workflow growth by 46 B and
would report a delta no command produces.

## The role corpus went the other way

| | files | pre-phase | post-phase | Δ | % |
|---|---:|---:|---:|---:|---:|
| `agent-factory/roles/` | 17 | 66,216 | 63,793 | **−2,423** | **−3.66%** |

**All seventeen shrank. None grew, and none is unchanged.**

| role | pre | post | Δ | % |
|---|---:|---:|---:|---:|
| `agents-md-scribe.md` | 4094 | 3764 | **−330** | −8.06% |
| `architect-design.md` | 3790 | 3574 | **−216** | −5.70% |
| `ba-pm.md` | 3672 | 3605 | **−67** | −1.82% |
| `brownfield-mapper.md` | 2738 | 2580 | **−158** | −5.77% |
| `compliance-officer.md` | 4433 | 4292 | **−141** | −3.18% |
| `factory-coach.md` | 3464 | 3448 | **−16** | −0.46% |
| `frontend-ui.md` | 3872 | 3724 | **−148** | −3.82% |
| `greenfield-mapper.md` | 2916 | 2873 | **−43** | −1.47% |
| `incident-responder.md` | 3540 | 3481 | **−59** | −1.67% |
| `installer.md` | 3546 | 3325 | **−221** | −6.23% |
| `orchestrator.md` | 7090 | 6802 | **−288** | −4.06% |
| `qe-e2e.md` | 3695 | 3608 | **−87** | −2.35% |
| `release-manager.md` | 4230 | 4001 | **−229** | −5.41% |
| `security-nfr.md` | 5027 | 4931 | **−96** | −1.91% |
| `software-engineer.md` | 3722 | 3507 | **−215** | −5.78% |
| `system-analyst.md` | 3020 | 2962 | **−58** | −1.92% |
| `uat-planner.md` | 3367 | 3316 | **−51** | −1.51% |
| **total** | **66,216** | **63,793** | **−2,423** | **−3.66%** |

### The headline number is a net shrink

| | pre-phase | post-phase | Δ |
|---|---:|---:|---:|
| governed corpus (47) | 152,806 | 154,651 | +1,845 |
| role corpus (17) | 66,216 | 63,793 | −2,423 |
| **both (64 files)** | **219,022** | **218,444** | **−578** |

**Putting the whole kit on the writing profile made it 578 bytes smaller.** The de-duplication the
D-19 role skeleton bought outweighs everything the profile cost the governed corpus.

## Per file

### Workflows — 19 files, 104,048 → 105,615 (+1,567, +1.51%)

| file | pre | post | Δ | % |
|---|---:|---:|---:|---:|
| `00-bootstrap-greenfield.md` | 4547 | 4622 | +75 | +1.65% |
| `01-bootstrap-brownfield.md` | 4217 | 4247 | +30 | +0.71% |
| `02-idea-to-epics.md` | 2716 | 2691 | **−25** | −0.92% |
| `03-epic-to-tickets.md` | 3274 | 3308 | +34 | +1.04% |
| `04-ticket-to-pr.md` | 4809 | 4929 | +120 | +2.50% |
| `05-pr-quality-gate.md` | 13831 | 14154 | +323 | +2.34% |
| `06-uat-pack.md` | 3192 | 3294 | +102 | +3.20% |
| `07-backlog-refinement.md` | 5423 | 5623 | +200 | +3.69% |
| `08-sprint-planning.md` | 4395 | 4492 | +97 | +2.21% |
| `09-daily-sweep.md` | 5482 | 5602 | +120 | +2.19% |
| `10-sprint-review.md` | 3789 | 3825 | +36 | +0.95% |
| `11-retro.md` | 3735 | 3802 | +67 | +1.79% |
| `12-release.md` | 4932 | 5035 | +103 | +2.09% |
| `13-incident.md` | 3730 | 3781 | +51 | +1.37% |
| `14-ui-design-to-build.md` | 5489 | 5628 | +139 | +2.53% |
| `15-security-audit.md` | 4732 | 4795 | +63 | +1.33% |
| `16-context-read-write.md` | 9255 | 9321 | +66 | +0.71% |
| `17-task-claim.md` | 6717 | 6675 | **−42** | −0.63% |
| `18-context-compaction.md` | 9783 | 9791 | +8 | +0.08% |

### Checklists — 13 files, 19,368 → 19,495 (+127, +0.66%)

| file | pre | post | Δ | % |
|---|---:|---:|---:|---:|
| `00-index.md` | 1804 | 1815 | +11 | +0.61% |
| `accessibility-checklist.md` | 1917 | 1917 | 0 | 0.00% |
| `compliance-checklist.md` | 769 | 778 | +9 | +1.17% |
| `definition-of-done-enterprise.md` | 998 | 1008 | +10 | +1.00% |
| `definition-of-done.md` | 503 | 557 | +54 | +10.74% |
| `definition-of-ready.md` | 857 | 857 | 0 | 0.00% |
| `example-mapping.md` | 2450 | 2484 | +34 | +1.39% |
| `linter-recommendations.md` | 3500 | 3500 | 0 | 0.00% |
| `observability-slo-checklist.md` | 524 | 524 | 0 | 0.00% |
| `playwright-visual-regression-recipe.md` | 4687 | 4696 | +9 | +0.19% |
| `pr-review-checklist.md` | 472 | 472 | 0 | 0.00% |
| `release-readiness-checklist.md` | 558 | 558 | 0 | 0.00% |
| `uat-checklist.md` | 329 | 329 | 0 | 0.00% |

The generated ASVS checklist `security-nfr-checklist.md` is excluded from the corpus by the derived
`GENERATED` marker, not by name, and is untouched.

### Seed templates — 13 files, 14,205 → 14,285 (+80, +0.56%)

| file | pre | post | Δ | % |
|---|---:|---:|---:|---:|
| `00-index.md` | 1489 | 1494 | +5 | +0.34% |
| `10-project-brief.md` | 400 | 400 | 0 | 0.00% |
| `20-product.md` | 364 | 364 | 0 | 0.00% |
| `30-architecture.md` | 484 | 484 | 0 | 0.00% |
| `40-contributing.md` | 412 | 412 | 0 | 0.00% |
| `ADR-template.md` | 713 | 722 | +9 | +1.26% |
| `60-progress.md` | 429 | 422 | **−7** | −1.63% |
| `70-runbook.md` | 464 | 464 | 0 | 0.00% |
| `80-glossary.md` | 356 | 356 | 0 | 0.00% |
| `board.md` | 5169 | 5224 | +55 | +1.06% |
| `metrics.md` | 1115 | 1120 | +5 | +0.45% |
| `nfr-catalog.md` | 1135 | 1143 | +8 | +0.70% |
| `traceability.md` | 1675 | 1680 | +5 | +0.30% |

### Contracts — 2 files, 15,185 → 15,256 (+71, +0.47%)

| file | pre | post | Δ | % |
|---|---:|---:|---:|---:|
| `context-note.md` | 10937 | 10984 | +47 | +0.43% |
| `task-notes.template.md` | 4248 | 4272 | +24 | +0.56% |

### The distribution, which is the part a ceiling would have had to describe

**Thirteen of the 47 governed files are byte-unchanged. Three SHRANK** — `02-idea-to-epics.md` (−25),
`17-task-claim.md` (−42) and `60-progress.md` (−7). The largest single increase anywhere is
`05-pr-quality-gate.md` at **+323 B**, which is **+2.34%** on the largest file in the kit. The largest
*proportional* increase is `definition-of-done.md` at **+10.74%**, which is **+54 bytes** on a 503-byte
file — the arithmetic of a small denominator, not a bloating document.

**No governed file grew by as much as 3% except three workflows** (`06-uat-pack.md` +3.20%,
`07-backlog-refinement.md` +3.69%, and nothing else above 2.6%).

## The mechanism, tested rather than asserted

The hypothesis worth ruling out is that the profile's cost is **article restoration** — that governed
prose was telegraphic and the profile made it into English. If that were the mechanism, article
density would rise.

Measured over the governed corpus at both commits, counting `a` / `an` / `the` against total words:

| surface | side | words | articles | article % | copulas | copula % |
|---|---|---:|---:|---:|---:|---:|
| workflows | pre | 16,243 | 1,828 | 11.25% | 401 | 2.47% |
| workflows | post | 16,592 | 1,931 | **11.64%** | 426 | 2.57% |
| checklists | pre | 2,691 | 219 | 8.14% | 64 | 2.38% |
| checklists | post | 2,710 | 222 | **8.19%** | 64 | 2.36% |
| seed templates | pre | 2,051 | 156 | 7.61% | 64 | 3.12% |
| seed templates | post | 2,062 | 155 | **7.52%** | 63 | 3.06% |
| contracts | pre | 2,332 | 296 | 12.69% | 107 | 4.59% |
| contracts | post | 2,341 | 299 | **12.77%** | 106 | 4.53% |
| **governed corpus** | **pre** | **23,317** | **2,499** | **10.72%** | 636 | 2.73% |
| **governed corpus** | **post** | **23,705** | **2,607** | **11.00%** | 659 | 2.78% |

**Article density moved 0.28 percentage points.** The governed corpus was already normal English
before this phase began, at 10.72% articles, and it is normal English now. This reproduces
`29-RESEARCH.md` §C-5's finding on its own terms: the research measured 11.4% over the workflows and
8.0% over the checklists, against 11.25% and 8.14% here — the small differences are word-tokenizer
differences, and the conclusion is identical.

**The mechanism is sentence splitting.** The decisive number is that the corpus gained **350
sentences** — the gate's own visited denominator moved 1,816 → 2,166 across the phase, monotonically,
never falling — while gaining only **388 words**. Roughly one added word per added sentence is what a
split costs: a full stop, a capital, and often a three-to-six-byte subject noun. That is **5.27 bytes
per new sentence** over the phase.

Even the extreme reading bounds it: all 108 added articles together, charged at four bytes each, are
**432 B — 23% of the 1,845.** The other 77% is not articles.

### The two voices moved apart, and that is worth recording

The fenced caveman blocks the profile deliberately does **not** govern were measured through the same
`readCavemanFence()` authority the voice guards use, **17 of 17 fences read on the current tree**:

| | words | articles | article % | copulas | copula % |
|---|---:|---:|---:|---:|---:|
| caveman blocks, pre-phase | 608 | 33 | **5.43%** | 19 | 3.13% |
| caveman blocks, post-phase | 426 | **0** | **0.00%** | **0** | 0.00% |

`29-RESEARCH.md` §C-5 measured 5.5% articles over 597 words pre-phase; this measurement finds 5.43%
over 608 words, the same figure under a slightly different tokenizer.

**The caveman blocks now contain no article and no copula at all, and they shrank 30% by word count.**
Pre-phase they read `You are QE/E2E. You break the feature.` — clear-voice English wearing the label.
`guard_caveman_voice`, rebuilt in 29-01 and satisfied across 29-05…29-07, is what moved them.

So the phase did the opposite thing to each voice, and both are the intended direction: **governed
prose stayed normal English and gained 1,845 bytes of sentence boundaries; the fenced caveman blocks
became genuinely telegraphic and lost bytes.** A single corpus-wide article figure would have averaged
these two into a number describing neither.

## What was NOT done, and why

### No byte ceiling was added for any workflow, checklist, seed template or contract

D-28. Nothing external forces one. The governed corpus has no per-file ceiling today, grew 1.21% under
the largest prose rewrite this project has performed, and **thirteen of its 47 files did not move at
all.** Adding nineteen-plus hand-measured baselines would create precisely the hand-maintained
set-literal surface this milestone exists to delete — and every one of them would need an author to
re-measure and re-record it on every future edit.

The role ceilings are the counter-example that justifies the asymmetry rather than undermining it:
they exist, they are hand-maintained for a stated reason (D-25 — a per-file *measurement baseline*, not
a discovery set, which already fails closed on an unknown role), and after fourteen phases **twelve of
the seventeen now encode a baseline the file has since outgrown.** See `docs/audit/29-ceiling-rebaseline.md`.
That is the maintenance cost of a per-file ceiling table, measured on the one this project already has.

### No single aggregate corpus budget was adopted

Rejected for the reason per-file ceilings exist at all: **an aggregate lets one file balloon while
others shrink.** This phase supplies its own illustration. A budget over the 64 governed-plus-role
files would report **−578 B** and pass comfortably, while concealing that
`05-pr-quality-gate.md` grew 323 B and `agents-md-scribe.md` lost 330. Those are two different facts
about two different documents, and an aggregate reports neither.

## What a later phase should do with this

1. **Decide on this evidence, not on an impression.** The question D-28 defers is whether the governed
   corpus needs per-file ceilings at all. The measured answer this document supplies is 1.21% growth
   under the largest rewrite the corpus has had, with 13 files unmoved and 3 shrinking.
2. **Re-measure before acting.** These are readings of `4d2b8f0` versus `9dfb8af`. If the corpus has
   moved since, these numbers describe a tree that no longer exists — which is exactly the failure
   `docs/audit/29-ceiling-rebaseline.md` records against the role ceilings themselves.
3. **Reuse the walk, do not retype the members.** Every figure here came from `GOVERNED_CORPUS_PARTS`
   and `listRoles()` read through `import()`. A growth record built from a pasted file list would rot
   the same way a ceiling table does.

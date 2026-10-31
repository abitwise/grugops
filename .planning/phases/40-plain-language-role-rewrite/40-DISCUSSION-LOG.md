# Phase 40: Plain-language role rewrite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-31
**Phase:** 40-plain-language-role-rewrite
**Areas discussed:** Budget squeeze, Role skeleton, Do-less rules, Rule inventory, plus a second round (checkpoint, orchestrator, new roles, moved text)

---

## Budget squeeze

| Question | Options | Selected |
|---|---|---|
| Where repeated boilerplate goes | Short pointer per role / One shared file / Keep inline, trim words | Short pointer per role |
| Per-file ceilings | Allocate first, measure after / Measure after only / Equal share | Allocate first, measure after |
| Overflow detail | Into workflow or checklist / Raise corpus total / You decide per case | Into workflow or checklist |
| Headroom for Phases 41-42 | Reserve headroom (~64 KB) / Use full budget now / Reserve for orchestrator only | Reserve headroom |
| Corpus-total guard | FAIL at 67,383, WARN at target / FAIL only | FAIL at 67,383, WARN at target |
| Workflow byte budget | No new budget, report growth / Cap workflow growth | No new budget, report growth |
| ROLE_CEILINGS recording | Re-baseline all 19 / Keep history comments | Re-baseline all 19 |

**Notes:** Corpus measured at 78,011 B; boilerplate shares (caveman 3,171 B, WF16/18 lines 6,606 B, trace sections 5,465 B, config lines 5,084 B) were shown before the questions.

---

## Role skeleton

| Question | Options | Selected |
|---|---|---|
| Section list | Keep names, drop caveman, add Stop / Rename to requirement words / Keep names, fold Trace into Output | Keep names, drop caveman, add Stop |
| Stop conditions | Own section, each with a result / Stay inside Hard limits | Own section |
| Authoring | Template first, then batches / All at once / You decide | Template first, then batches |
| Role-switch protocol | Same skeleton rules / Plain-English pass only | Same rules |
| When Stop when becomes required | Last plan / In the atomic flip | Last plan |
| Voice | Second person imperative / Third person | Second person imperative |
| Brand in role files | None / One-line tagline | None |
| Heading suffixes | Drop / Keep | Drop |
| 12 coding rules line | Only code or config roles / Keep in all | Only code or config roles |
| Responsibilities size | No fixed cap / At most 5 items | No fixed cap |

---

## Do-less rules

| Question | Options | Selected |
|---|---|---|
| Split | TL trims the ask, engineer builds lean / Both carry full set / Engineer only, TL points | TL trims, engineer builds lean |
| Placement | Own `## Do less` section / Spread across sections | Own section |
| Skipped line | `Not checked:` in observation note / PR description only | `Not checked:` in observation note |
| Lean lens | Advisory, evidence-required / Blocking in enterprise | Advisory, evidence-required |
| Shortcut marker checks | Text rule only / Add ledger now | Text rule only |
| Levels | Same rules for every level / Junior stricter | Same rules |
| NOTICE | Adaptation credit + MIT text / Credit line only | Credit + MIT text |

---

## Rule inventory

| Question | Options | Selected |
|---|---|---|
| Inventory build | Derived by script, committed / Hand-curated | Derived by script |
| "Still holds" | Anchor token + meaning / Exact sentences / Meaning only | Anchor token + meaning |
| Partition check | Guard derives from Board moves / Snapshot only | Guard derives it |
| Diff-disposition gate | Re-base, inventory replaces per-clause rows / Re-base and disposition every clause / Keep frozen Hard-limit sentences verbatim | Re-base, inventory replaces rows |
| "More detail" | Inventory facts ≥ before + reader review / Section presence only | Facts ≥ before + reader review |
| Lexicon conflicts | Reword first, add term only if load-bearing / Extend freely | Reword first |

---

## Second round

| Question | Options | Selected |
|---|---|---|
| Human checkpoint on reference role | Yes / No, review at UAT | Yes |
| Orchestrator in Phase 40 | Full plain rewrite, flow left for 41 / Caveman removal only | Full plain rewrite |
| Tech Lead and Designer | Conform to skeleton + budget / Full rewrite | Conform |
| Moved text in workflows | Only the moved text / Whole touched section | Only the moved text |

---

## Claude's Discretion

- Batch split, per-role byte targets, exact WARN number, pointer-line wording, D-30 mechanism, final D-13 role set.

## Deferred Ideas

- `shortcut:` ledger tooling.
- Plain-English pass over whole workflows and checklists.
- Three-disputed-rounds rule for other checkpoints (already deferred in 39-UAT.md).

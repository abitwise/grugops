# Phase 29 style dispositions (LANG-03, D-01 through D-05)

Every clause a Phase 29 content plan changes in the watched corpus is recorded here, in one file per
plan. `scripts/check-diff-disposition.js` reads this directory on every CI run and refuses any
changed clause that has no row.

## The collision these files resolve

`docs/audit/28-safety-surface-exclusions.md` lists 41 files and states that no text in a listed file
is reworded by a style pass. Those 41 files are the 18 role documents, the 19 workflows, and the 4
public documents that host safety claims — which is the whole corpus LANG-02 tells the writing
profile to govern. Read literally, this phase may reword nothing.

Phase 28 named that limit rather than manufacturing variance around it. **The flag is per FILE**, so
the list cannot say WHICH sentence in a file is load-bearing, and the question LANG-02 actually
faces is exactly that: which SENTENCES carry the permission. A per-file column cannot express a
per-sentence rule.

These files are the per-sentence rule. The exclusion list stays honoured — its 41 files are the
corpus the gate watches, unchanged and underived-from-nothing-else — and the granularity it could
not express is supplied by a recorded disposition per changed clause.

## The contract every content plan follows

**One disposition file per plan, named for the plan.** `29-05.md`, `29-08.md`, `29-12.md`. Plans
that run in the same wave write to different files and never contend on a single register.

**Membership is walked, never listed.** The gate reads every `*.md` in this directory except
`00-base.md` and this README. A new disposition file enters the set by existing. Nothing anywhere
names the members, because a hand-maintained membership list is the set-literal drift class this
milestone exists to eliminate.

**Rows live under a `## Dispositions` heading**, in a markdown table with these seven columns, in
this order:

| column | what it records |
|---|---|
| `file` | the repo-relative path of the changed file |
| `line` | the line the change lands on, in the tree the diff compares |
| `before` | the clause as it read before the change |
| `after` | the clause as it reads after the change |
| `rule` | the profile rule id (`WP-01` … `WP-10`) or the decision id (`D-19`, `D-09`) that drove it |
| `disposition` | what was decided, in a sentence — not a single word |
| `companion` | the same-commit companion edit, when the clause intersects the frozen set; otherwise `—` |

The first six are the row. `companion` is the seventh, and it is the one the gate refuses a frozen
change without.

`before` and `after` are compared after normalization, through the same `normalizeSentence()` the
intra-file uniqueness guard uses. A row matches a changed clause when it names the same file and
either its `before` or its `after` normalizes to that clause, so a row written from either side of
the edit is found.

## The frozen set, and what a companion edit is

The gate derives what is frozen from three gates that already exist. Nothing is hand-authored, and a
"sentences you may not touch" file is refused outright.

| source | what it freezes | the companion edit a change owes |
|---|---|---|
| the claim registry's verbatim anchors | the exact text `docs/audit/28-claim-registry.md` records for each registered public claim | `docs/audit/28-claim-registry.md` changes in the **same commit** |
| structural sections located by heading | every role `## Hard limits`, every workflow `## Stop conditions`, every workflow `## Commit` | a row here whose `companion` cell names the section and the reason |
| positive guard literals | wording a guard requires to be **present** — the tier-announcement beats and the shared-context memory sentences | the guard's own source changes in the **same commit** |

A changed clause intersecting the frozen set without its companion edit is **hard RED, with no
override**. There is no record-it-later, no blanket exemption, and no per-file hatch. The bytes may
change — that is the point of D-04 — but no kit text changes alone.

Adding an override tier later would mean auditing every change already admitted under the strict
rule, to find which ones would have taken the hatch. That cost is why the rule is stated here rather
than discovered when someone reaches for the escape.

## Safety sections receive the profile, deliberately

Safety sections are **not** exempt. They are rewritten one file at a time, each change carrying its
row, in the same commit.

Freezing them outright was considered and rejected. It would leave the kit's most safety-critical
prose as its least controlled text — which inverts LANG-02 at exactly the point where two agents
most need to read one instruction and reach the same act. A `## Hard limits` paragraph that two
agents read differently is a worse outcome than one that was reworded under a recorded disposition.

Deliberately means: one file at a time, not a bulk style pass; the row written in the commit that
changes the text, not afterwards.

## What this directory does not settle

**It records that a change was considered. It does not record that the consideration was correct.**

Whether a reworded `## Hard limits` sentence still withholds the same permission is a human
judgement. No gate reaches it, and no additional check would: the question is what the sentence
means to an agent reading it, and structure is checkable where meaning is not.

So the manual verification for LANG-03 is a named human reading these rows against the diff they
describe — not a green build. The gate proves that every changed clause was either dispositioned or
refused. It proves nothing about any disposition's substance.

## What a red means, and which fix is not available

| red | the fix |
|---|---|
| a changed clause with no row | write the row |
| a frozen intersection with no companion edit | make the companion edit in the same commit |
| a non-empty diff and an empty directory | write the plan's disposition file |
| kit files differ from the base but zero clauses derived | investigate the derivation; this is a check that did not run |
| the base commit does not resolve | fetch the history; on CI, confirm `fetch-depth: 0` |

Not available, in any of those rows: adding an override tier, narrowing the watched corpus, moving
the recorded base commit forward, or loosening the clause comparison. Each of those clears the
finding by deleting the evidence for it.

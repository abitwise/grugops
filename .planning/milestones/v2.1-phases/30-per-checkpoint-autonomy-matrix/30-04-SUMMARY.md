---
phase: 30-per-checkpoint-autonomy-matrix
plan: 04
subsystem: infra
tags: [checkpoints, derived-set, section-locator, allow-list, frozen-regions, typescript]

requires:
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "plan 30-01's checkpoints.ts roster, ternary vocabulary and fail-closed canonicalizer; plan 30-02's settled four-id SAFETY_FLOORS, commit_to_branch as a non-floor member and STRICTEST_MATRIX"
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "the unified section-extent authority (unfencedHeadingIndex / sectionEndIndex / unfencedMatchIndices) with its parser oracle, locateSection over it, and the D-04 same-commit companion rule for frozen structural regions"
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "the D-64 canonical-form allow-list posture — refuse everything outside the canonical form rather than widen the parser"
provides:
  - "deriveCheckpoints() — the workflow `## Stop conditions` corpus walked through the tree's one section locator and one workflow lister, returning ids, an id→sites map and two independently produced bullet counts"
  - "CHECKPOINT_TAG_RE and CHECKPOINT_KEYWORD_RE, both built from a single TAG_KEYWORD declaration, with the selector provably wider than the pattern"
  - "a thirteen-member Checkpoint union derived from three arms — the tag corpus, SAFETY_FLOORS, and the D-06 legacy grade table — each arm with exactly one authority"
  - "compareRosterToDerivation / assertRosterMatchesDerivation — the two-sided comparison with a distinct message per direction, both naming the offending ids"
  - "CHECKPOINT_SITE_COUNTS + RECORDED_TOTAL_SITES + assertSiteCounts — D-03's recorded site count, asserted in both directions"
  - "WORKFLOW_STOP_BULLET_COUNT + assertLiveCorpusCardinality — the two-sided corpus anchor (19 sections, 38 bullets)"
  - "14 tagged bullets carrying 9 global ids across 11 workflow files, with 31 companion disposition rows in the same commit"
  - "LEGACY_AUTONOMY_GRADES — D-06's diff/branch/pr mapping stated mechanically, compile-checked complete in both directions"
affects: [30-05, 30-06, 30-07, 30-08, 30-09, validate-agent-factory, generate-guarantees, hooks/guard]

actuals:
  tokens: 25277
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "One KEYWORD declaration, two patterns built from it — the allow-list and its scope selector cannot come to disagree about which word they govern, and the selector is asserted to be a superset of the pattern so a canonical tag can never be collected without first being offered to the refusal"
    - "Keep the DERIVATION out of the hot path: hooks/guard.js imports this module on every PreToolUse call, so the roster is a total table and the corpus walk is a function the tests and the validator call — a module-scope derivation would turn a documentation typo into a hook that denies every tool call"
    - "Full-cardinality anchors live in their OWN function, not inside the derivation, so the derivation can still be driven by a two-file probe fixture"
    - "Every probe fixture carries a CONTROL member, because a probe whose expected answer is `nothing` is indistinguishable from the vacuity floor firing for the wrong reason"
    - "When the expected outcome of an adversarial probe is `accepted`, assert the harness's own premise: prove the plant landed, is canonical, and WOULD have been collected by a deliberately wrongly-scoped reader"

key-files:
  created:
    - docs/audit/29-style-dispositions/30-04.md
  modified:
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - scripts/checkpoints.test.ts
    - scripts/check-foundation-guards.test.ts
    - agent-factory/workflows/01-bootstrap-brownfield.md
    - agent-factory/workflows/06-uat-pack.md
    - agent-factory/workflows/09-daily-sweep.md
    - agent-factory/workflows/10-sprint-review.md
    - agent-factory/workflows/12-release.md
    - agent-factory/workflows/13-incident.md
    - agent-factory/workflows/14-ui-design-to-build.md
    - agent-factory/workflows/15-security-audit.md
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/18-context-compaction.md

key-decisions:
  - "D-01 AMENDED (user decision `workflow-plus-floors`): the tag-derivation corpus is the 19 workflow `## Stop conditions` sections alone; the role-tier stops come from SAFETY_FLOORS, which D-04 already makes canonical. The 17 role `## Hard limits` sections carry zero bullets, so D-02's bullet grammar has no referent there"
  - "C1-a: the derived set is a union of THREE arms, not two — the tag corpus, SAFETY_FLOORS, and the keys of D-06's legacy grade table. Without arm three, `commit_to_branch` is roster-only and the two-sided comparison is red on its first run"
  - "A bullet is tagged iff it withholds a PERMISSION a human must grant; a bullet is untagged when its substance is a NON_DIALABLE_INVARIANT, an internal routing move, or a capability failure. Dialing a no-fabrication bullet to `off` would authorize fabrication, which a checkpoint may never do"
  - "The `sign_off_acceptance` merge: workflow 06's UAT signoff and workflow 10's sprint-review acceptance are ONE id with two sites, on the D-03 reading that they are the same human stop in two workflows"
  - "The tag keyword is declared ONCE and both the tag pattern and the refusal's scope selector are built from it, rather than declaring two independent regex literals"
  - "Disposition rows are per (file, clause) because that is the gate's own matching rule; the plan's per-file obligation is preserved as a SET equality between the files carrying tags and the files the rows name"

patterns-established:
  - "Derive the set, assert TWO counts: the element count against an independently-computed denominator AND the recorded per-member site count against the derived map — an empty result and a silently short one are different failures and need different guards"
  - "A two-sided set comparison emits a distinct message per direction; a roster-only id and a corpus-only id are different faults with different repairs, and one `sets differ` line withholds which repair to make"
  - "Move a pinned consumer set deliberately and say why in the pin itself — the pin going red the moment a module adopts the authority is the pin working"

requirements-completed: [AUTO-01]

coverage:
  - id: D1
    description: "The checkpoint roster is DERIVED from the kit and compared against the exported union in both directions, with a distinct failure message per direction naming the offending ids"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#the derived set and the exported roster prove each other in BOTH directions"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#that comparison is NON-VACUOUS — both sets are populated and it discriminates live"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#a roster-only id and a corpus-only id produce DIFFERENT messages, both naming the id"
        status: pass
    human_judgment: false
  - id: D2
    description: "The tag pattern is a section-anchored allow-list: a tag past the section boundary or inside a fence is not collected, and any other keyword-bearing line inside the section is refused naming file and line"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#a tag ONE LINE PAST the section's closing boundary is NOT collected"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#a tag inside a FENCED block within the section is neither collected nor refused"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#refuses no space after the colon, naming the file and the line (7 non-canonical probes)"
        status: pass
      - kind: other
        ref: "adversarial probes P1/P2/P3/P4 on the live tree, with the harness premise asserted (file-wide count 14 → 15 while the section-anchored reader stayed at 14)"
        status: pass
    human_judgment: false
  - id: D3
    description: "One id tagged at several sites is one roster member with a recorded site count, and the derived id→sites map is asserted against that record so a tag added or removed anywhere is red"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#the derived id→sites map matches the recorded site counts, both directions (D-03)"
        status: pass
      - kind: other
        ref: "adversarial probes P5 (tag removed → 4 vs 3) and P6 (invented id → corpus-only, named)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A silently short or empty derivation is refused: examined bullets are compared against a denominator counted by a second independent pass, and the live corpus carries a two-sided 19-section / 38-bullet anchor"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#the count assertion DISCRIMINATES — a planted disagreement is refused"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#a corpus with bullets but no tags throws a NAMED error rather than returning an empty set"
        status: pass
      - kind: other
        ref: "adversarial probe P7 (stop bullet deleted → 37 vs 38, refused)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Adding a member to the Checkpoint union with no entry in the defaults table is a tsc diagnostic, demonstrated rather than asserted"
    requirement: "AUTO-01"
    verification:
      - kind: other
        ref: "tsc --noEmit against a temporarily added defaultless union member — TS1360 at scripts/checkpoints.ts:166, quoted verbatim below"
        status: pass
    human_judgment: false
  - id: D6
    description: "14 workflow stop bullets carry their tags with a companion disposition row for every edited frozen section, in the same commit"
    verification:
      - kind: integration
        ref: "npm run check:diff-disposition (post-commit) — 0 findings over 37/37 elements"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#every file this plan tagged is named by a row in its disposition file (Pitfall 7)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The judgement of WHICH bullets are genuine human stops and which stay untagged prose"
    verification: []
    human_judgment: true
    rationale: "The tag/untag call is a policy reading of prose, not a mechanical property. The user approved the per-file list at the Task 1 checkpoint before any file was edited, and CONTEXT.md's Deferred Ideas already holds matcher-completeness over stop-condition prose as content rather than as a gate (the Phase 29 D-59 posture). A named human re-reading the 21 untagged reasons against the diff is the only check available."

duration: 45 min
completed: 2026-09-05
status: complete
---

# Phase 30 Plan 04: The Derived Checkpoint Roster Summary

**The checkpoint roster stopped being a list and became a derivation: 14 tagged workflow stop bullets, walked through the tree's one section locator, now prove the thirteen-member `Checkpoint` union in both directions — and a tag one line past a section boundary provably does not reach it.**

## Performance

- **Duration:** 45 min (including the Task 1 checkpoint round-trip)
- **Tasks:** 3 (1 decision checkpoint, 2 implementation)
- **Files modified:** 15 modified, 1 created

## Accomplishments

- `deriveCheckpoints()` walks the 19 workflow `## Stop conditions` sections through `locateSection` and `listWorkflows`, declaring no second heading scanner, no second directory walk and no private fence state — `scripts/checkpoints.ts` is now recorded as the eighth section-locator consumer and the eleventh canonical-parser consumer.
- The tag keyword is declared **once**; the canonical tag pattern and the refusal's scope selector are both built from it, and the selector is asserted to be a superset of the pattern — so a canonical tag can never be collected without first being offered to the refusal.
- The `Checkpoint` union widened from 5 to 13, and every member is now produced by one of three arms, each with exactly one authority.
- The two-sided comparison emits a **different** message for a roster-only id than for a corpus-only id, reports both directions at once, and names the ids in both.
- 14 bullets across 11 workflow files carry their tags, with all 31 companion disposition rows created in the same commit.
- Seven adversarial bypass attempts were run against the committed `.js` on the live tree; three of them additionally proved the harness's own premise.

## Task Commits

1. **Task 1: DECISION — the derivation corpus, and which bullets are checkpoints** — no commit (checkpoint; the decision is recorded below and in `scripts/checkpoints.ts`'s header)
2. **Task 2: the derivation, section-anchored and two-sided** — `83ecd1e` (feat)
3. **Task 3: tag the workflow stop bullets with their companion disposition rows** — `2227b24` (feat)

---

## Task 1 — the decision, recorded as its acceptance criteria require

### The D-01 amendment, verbatim

> **D-01 as locked:** "A parser (reusing `locateSection`) walks the 17 role `## Hard limits` and 19 workflow `## Stop conditions` sections and collects **tagged** stop bullets."
>
> **The amendment (user decision `workflow-plus-floors`, taken at this plan's Task 1 checkpoint):** the tag-derivation corpus is **the 19 workflow `## Stop conditions` sections alone**. The role-tier stops are taken from `SAFETY_FLOORS`, which D-04 already makes the canonical floor list. The 17 role `## Hard limits` sections stay documentary prose and are not edited by this plan.

**The reason, measured rather than asserted.** The 17 role sections contain **zero** markdown bullets — verified this session by counting `/^\s*[-*]\s+/` inside each located section: `17 role files … 0 bullets each`. They are prose paragraphs, and `agent-factory/roles/orchestrator.md`'s carries **four distinct prohibitions in one sentence run**:

> `Never merge to a protected branch. Never deploy to prod. Never exceed WIP without a written reason. Never route around a stop condition because the request is urgent — urgency is when the gate matters most.`

D-02's rule — "the trailing backticked token is the **last token of the bullet**" — has no referent there. There is no bullet, and "last token of the paragraph" would attach **one id to four prohibitions**.

**No coverage is lost by the amendment.** Three of that paragraph's four prohibitions reach the roster anyway: `protected_branch_merge` and `production_requires_human_confirmation` through the floor arm, and "never exceed WIP without a written reason" through `exceed_wip_limit`, tagged at `09-daily-sweep.md`. What the role prose loses is a **second declaration** of a prohibition the floor list already owns — which is the defect class this milestone exists to close.

The two rejected alternatives, with the reason each was rejected: `append-role-bullets` would have made every tagged bullet restate the paragraph above it (two declarations of one prohibition, plus 17 more frozen-region edits); `reformat-role-prose` would have rewritten prose the Phase 29 controlled-language pass had just finished authoring, reopening the voice guards this phase was deliberately scheduled after.

### The C1 consequence, and its resolution

Under a two-arm union, `commit_to_branch` is a roster member, is **not** in `SAFETY_FLOORS`, and **no workflow stop bullet is about committing to a branch** — so it would have been roster-only and the two-sided comparison would have been red on its first run.

**User decision `C1-a`:** the derived set is a union of **three** arms, each with exactly one authority:

| arm | authority | contributes |
|---|---|---|
| 1 — tag | the workflow corpus, read by `deriveCheckpoints` | the 9 tagged ids |
| 2 — floor | `SAFETY_FLOORS` in `scripts/audit-model.ts` (D-04) | `open_pr`, `test_integrity`, `production_requires_human_confirmation`, `protected_branch_merge` |
| 3 — legacy | the keys of `LEGACY_AUTONOMY_GRADES`, D-06's `diff`/`branch`/`pr` mapping | `commit_to_branch`, `open_pr` |

Arm three reads a table D-06 required to exist and be mechanical anyway; it is not a hand-list with a new name. `legacyGradeCheckpoints()` derives its ids from the table's rows rather than listing them beside it, and the table's `satisfies` makes both a missing grade and a half-specified row a compile error.

### The per-file tagging list, as approved

**Rule applied.** A bullet is **tagged** iff it withholds a *permission*: it stops the agent from proceeding with work a human or a named owner must authorize, resolve or accept. A bullet is **untagged** when its substance is (a) a `NON_DIALABLE_INVARIANT` — `no-fabrication`, `refuse-self`, the sanctioned-writer refusal, all of which D-04 records as permanently outside the matrix and none of which may become a dialable cell that could be set to `off`; (b) internal routing between board columns or to another agent role; or (c) a capability failure (an unmappable repo, an unreadable config), which is an error and not a policy dial.

#### Tagged — 14 bullets, 11 files, 9 distinct ids

| file | bullet (abbrev.) | id |
|---|---|---|
| `01-bootstrap-brownfield.md` | Security/NFR returns `BLOCKED` on a high-risk finding | `proceed_past_blocked_risk` |
| `06-uat-pack.md` | Acceptance criteria missing/ambiguous — a named human signoff is required | `sign_off_acceptance` |
| `09-daily-sweep.md` | Blocked longer than `blocked_escalation_days` — raise it for a human to clear | `escalate_stale_blocker` |
| `09-daily-sweep.md` | A WIP limit is breached — only exceed with a written reason | `exceed_wip_limit` |
| `10-sprint-review.md` | Acceptance ambiguous/unmet — leave acceptance to a named human | `sign_off_acceptance` |
| `12-release.md` | Checklist fails or no named human approval — do not deploy | `production_requires_human_confirmation` |
| `13-incident.md` | Blast radius unclear — production action is always human-confirmed | `production_requires_human_confirmation` |
| `14-ui-design-to-build.md` | Cannot meet WCAG 2.2 AA without a product decision | `decide_accessibility_exception` |
| `14-ui-design-to-build.md` | The gate exhausts its self-fix budget — hand to a human | `exhaust_self_fix_budget` |
| `15-security-audit.md` | Severity overridden without a stated reason and a named owner | `override_finding_severity` |
| `16-context-read-write.md` | Admission refused, self-fix budget exhausted — hand to a human | `exhaust_self_fix_budget` |
| `16-context-read-write.md` | High-stakes / agents disagree — escalate to a named human | `escalate_unadjudicable_result` |
| `17-task-claim.md` | Result cannot be honestly admitted by WF16 — hand to a human | `exhaust_self_fix_budget` |
| `18-context-compaction.md` | Re-verify refused, budget exhausted — hand to a human | `exhaust_self_fix_budget` |

**Per-file counts:** 01 → 1 · 06 → 1 · 09 → 2 · 10 → 1 · 12 → 1 · 13 → 1 · 14 → 2 · 15 → 1 · 16 → 2 · 17 → 1 · 18 → 1. **Total 14 across 11 files.**

**Site map (D-03):** `exhaust_self_fix_budget` → 4 · `sign_off_acceptance` → 2 (06, 10) · `production_requires_human_confirmation` → 2 (12, 13) · the other six → 1 each. **Total 14 sites, 9 ids.**

`sign_off_acceptance` is the one deliberate merge: workflow 06's UAT signoff and workflow 10's sprint-review acceptance are read as **one** human stop — a named human accepts delivered work — in two workflows, which is exactly what D-03's "ids are GLOBAL" rule is for. The alternative (splitting into `sign_off_uat` and `accept_sprint_item`) was presented at the checkpoint and not taken.

#### Untagged — 21 bullets, each with its reason

Recorded so the omission reads as a decision rather than an oversight.

| file | bullet (abbrev.) | reason |
|---|---|---|
| `00-bootstrap-greenfield.md` | Idea too vague to map — "Do not invent the user, the pain, or the value" | (a) no-fabrication invariant |
| `01-bootstrap-brownfield.md` | Repo cannot be mapped — request access or context | (c) capability failure, not a permission |
| `02-idea-to-epics.md` | Idea too vague to scope — same sentence | (a) no-fabrication invariant |
| `03-epic-to-tickets.md` | Behavior ambiguous — "do not fabricate the flow" | (a) no-fabrication invariant |
| `03-epic-to-tickets.md` | Ticket sized `XL` → `SPLIT_REQUIRED`, back to BA/PM | (b) routing between agent roles |
| `04-ticket-to-pr.md` | Fails Definition of Ready — name the missing input | (b) readiness routing, no human |
| `04-ticket-to-pr.md` | Ticket is XL → `SPLIT_REQUIRED` | (b) routing between agent roles |
| `06-uat-pack.md` | — | (no untagged bullet; the file has one bullet and it is tagged) |
| `07-backlog-refinement.md` | Cannot be made Ready — leave in `Backlog`, "never fake readiness" | (b) routing plus (a) no-fabrication |
| `08-sprint-planning.md` | `Ready` too thin — run workflow 07 first | (b) routing |
| `08-sprint-planning.md` | Item fails DoR — leave in `Ready`, "never fake readiness" | (b) routing plus (a) no-fabrication |
| `11-retro.md` | Not enough metric history — record a note, defer | (b) routing plus (a) "do not invent waste" |
| `14-ui-design-to-build.md` | No readable acceptance scenarios — send back "rather than inventing the intent" | (a) no-fabrication invariant |
| `14-ui-design-to-build.md` | Built UI diverges and the contract is judged wrong — re-author it | (b) change-control procedure the design role performs; the "never silently redefine" clause is no-fabrication-class |
| `15-security-audit.md` | Requirement cannot be evidenced — record `UNKNOWN - verify` and **continue** | (a) no-fabrication; and it does not stop |
| `15-security-audit.md` | The audit would have to block the change itself — stop | (b) single-authority routing; enforcement lives at workflow 05 |
| `15-security-audit.md` | `security.asvs_level` unreadable or outside `L1\|L2\|L3` | (c) config capability failure |
| `16-context-read-write.md` | Would have to hand-write the `.grugops/context/` path | (a) sanctioned-writer invariant |
| `17-task-claim.md` | Claim lost — move to the next pending task | (b) queue routing, no human |
| `17-task-claim.md` | `claimTask` throws non-`EEXIST` — surface it | (c) error honesty, not a dial |
| `18-context-compaction.md` | Carve-out checker refuses — fix the distilled set and re-run | (b) the agent fixes it itself |
| `18-context-compaction.md` | Would have to hand-write the `.grugops/context/` path | (a) sanctioned-writer invariant |

That is 21 rows against 21 untagged bullets (the `06-uat-pack.md` line is a placeholder marking that the file has no untagged bullet, not a 22nd bullet).

### The workflow-05 split, reconciled

`agent-factory/workflows/05-pr-quality-gate.md` holds **3** of the 38 bullets and is **deliberately untagged by this plan** — plan 30-05 edits that file in the same wave-adjacent window, and two plans must not own one file.

| quantity | value |
|---|---|
| bullets in all 19 sections | 38 |
| bullets in workflow 05 (plan 30-05's share) | 3 |
| bullets in this plan's scope | **35** |
| tagged by this plan | **14** |
| untagged by this plan | **21** |
| distinct ids from the tag arm today | **9** |
| roster today | **13** |

**What plan 30-05 must move, stated so it is not discovered late.** Its self-fix-budget bullet takes `exhaust_self_fix_budget` — an id this plan already derives — so tagging it adds a **site**, not an id, and `CHECKPOINT_SITE_COUNTS.exhaust_self_fix_budget` moves **4 → 5**. Its human-only-failure bullet (visual-baseline acceptance / test-integrity exit 1) takes a **new** id; 30-05 must add that id to the `Checkpoint` union, to `CHECKPOINT_DEFAULTS`, to `CHECKPOINT_SITE_COUNTS` and to `RECORDED_TOTAL_SITES` **in the same commit as the tag**, or its own two-sided run is red. Its third bullet (`SPLIT_REQUIRED` on an oversized ticket) is routing and stays untagged.

This is recorded as an **assertion**, not a sentence: `scripts/checkpoints.test.ts` pins that no site lives in `05-pr-quality-gate.md` and that exactly 11 files carry tags, so the moment 30-05 tags that file the site counts are re-walked with it.

---

## Task 2 — the `tsc` diagnostic, quoted

The compile-error property was **demonstrated, not asserted**: a union member with no defaults entry was added temporarily, `tsc --noEmit` was run, and the member removed. The diagnostic, verbatim (truncated at the type literal):

```
scripts/checkpoints.ts(166,12): error TS1360: Type '{ readonly protected_branch_merge: "block"; readonly production_requires_human_confirmation: "block"; readonly test_integrity: "block"; readonly open_pr: "block"; readonly commit_to_branch: "off"; ... 7 more ...; readonly escalate_unadjudicable_result: "block"; }' does not satisfy the expected type 'Record<Checkpoint, Disposition>'.
  Property 'defaultless_member_experiment' is missing in type '{ readonly protected_branch_merge: "block"; ... }' but required in type 'Record<Checkpoint, Disposition>'.
```

It fired at **five** sites, not one — `scripts/checkpoints.ts:166` (`CHECKPOINT_DEFAULTS`), `scripts/checkpoints.ts:821` (`CHECKPOINT_SITE_COUNTS`, `TS1360`), `scripts/checkpoints.ts:427` (`TS7053`, the resolver's indexed read), `hooks/guard.ts:203` and `:208`, and `scripts/context-io.ts:1545` (all `TS2741`). A defaultless member cannot reach the guard, the reader or the site record either. The tree returned to a clean `tsc --noEmit` after removal.

## Task 3 — the adversarial round

A green suite is not proof for a safety invariant ([[grugops-safety-invariant-green-suite-insufficient]]), so seven bypasses were attempted against the **committed** `scripts/checkpoints.js` on the **live tree**, each restoring the file afterwards (`git status --porcelain agent-factory/workflows` was empty at the end).

| # | attempt | outcome |
|---|---|---|
| P1 | a canonical tag one line **past** a real section's closing boundary | **not collected** — 9 ids / 14 sites, unchanged |
| P2 | a canonical tag inside a **fence** inside a real stop section | **not collected and not refused** |
| P3 | a non-canonical tag (`<!-- checkpoint: … -->`) inside a real stop section | **refused**: `02-idea-to-epics.md line 39 mentions the tag keyword but is not the canonical form` |
| P4 | a canonical tag in the same file's **`## Commit`** section | **not collected** — the scan never leaves the stop section |
| P5 | a real tag silently **removed** | **refused**: `exhaust_self_fix_budget: recorded 4 site(s), derived 3` |
| P6 | a real tag **retagged** with an id the roster never admitted | **refused**, naming both the shortfall and `invented_out_of_thin_air` |
| P7 | a stop **bullet deleted** | **refused**: `the live stop corpus holds 37 bullet(s) against the recorded 38` |

**P1, P2 and P4 expected `accepted`, which is indistinguishable from a mutation that never landed** — the failure mode project memory records as producing a false result in six instances across four rounds. So each was re-run with its own premise asserted: the plant was read back out of the file, `CHECKPOINT_TAG_RE` was shown to match it, and a deliberately **file-wide, fence-blind** control reader was shown to count **14 → 15** while the section-anchored derivation stayed at **14**. All three returned `PLANT LANDED AND WAS REACHABLE; the section-anchored reader excluded it BY SCOPE`.

**What this round does NOT establish.** It exercises the derivation, not the enforcement: no hook consults these nine new checkpoints yet, and the tag/untag judgement itself (deliverable D7) is prose policy no probe can falsify. Surface B's red-team rounds (D-21) are where the derivation is attacked by an independent reader.

---

## Verification Results

| command | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts` | 78 passed |
| `npx vitest run … scripts/section-locator-oracle.test.ts scripts/check-diff-disposition.test.ts` | 169 passed |
| `npm run build && npm run typecheck && npm run check:build-parity` | pass — `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | pass — 52 committed `.js` match a rebuild of their sources |
| `npm run check:diff-disposition` (**after** the tagging commit) | `PASS diff disposition — 0 findings over 37/37 elements` |
| `npm run check:imperative-lexicon && npm run check:public-docs && npm run check:banned-claims` | all pass, zero findings under `agent-factory/workflows/` |
| `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED |
| `npx vitest run --exclude '**/scripts/e2e/**'` (full) | 2578 passed, 2 skipped, **1 failed — the documented pre-existing `frontmatter.test.ts` D-49 control on a Phase 29.1 planning document** (baseline before this plan: identical 1 failure) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The real-corpus two-sided test had to land in Task 3, not Task 2**
- **Found during:** Task 2
- **Issue:** Task 2's `<verify>` requires `scripts/checkpoints.test.ts` to be green at Task 2's commit, but the two-sided comparison against the **real** corpus cannot be green until Task 3 tags the bullets — at Task 2 time the corpus derives nothing and the derivation refuses by name. Task 3's `<files>` does not list the test file.
- **Fix:** Task 2 ships the machinery and the fixture-driven cases, including the two-sided comparison driven with **injected** sets (which is what its acceptance criterion actually asks for — distinct messages per direction). The six real-corpus cases were added in Task 3's commit, which is the first commit at which they can be true.
- **Files modified:** `scripts/checkpoints.test.ts` (added to Task 3's effective file set)
- **Verification:** both commits are green on their own `<verify>` commands
- **Committed in:** `83ecd1e`, `2227b24`

**2. [Rule 3 - Blocking] Disposition rows are per (file, clause), not per file**
- **Found during:** Task 3
- **Issue:** Task 3's acceptance criterion says the row count equals the number of workflow files edited (11). The gate's own `rowMatches` is per **clause**: it segments a changed line and names every clause on it, so appending a tag surfaces both the new tag clause and the bullet's untouched neighbouring sentences. The live gate named **48 findings / 31 distinct (file, clause) pairs**. Eleven rows would have left 20 clauses undispositioned and the gate red.
- **Fix:** 31 rows written — 14 tag rows (**exactly one per tagged bullet**, an independent reconciliation of the tagging list) and 17 rows recording byte-unchanged neighbours as byte-unchanged. The criterion's *intent* — a file tagged without a companion row is caught here — is preserved as a **set** equality, derived on both sides and asserted in `scripts/checkpoints.test.ts`: the files the tags live in equal the files the rows name.
- **Files modified:** `docs/audit/29-style-dispositions/30-04.md`, `scripts/checkpoints.test.ts`
- **Verification:** `npm run check:diff-disposition` post-commit — 0 findings
- **Committed in:** `2227b24`

**3. [Rule 1 - Bug] Two pinned consumer sets in `check-foundation-guards.test.ts` went red**
- **Found during:** Task 2
- **Issue:** `checkpoints.ts` adopting `fencedLineFlags` / `unfencedMatchIndices` / `locateSection` made it a new member of both the canonical-parser consumer set (10 → 11) and the section-locator consumer set (7 → 8). Both pins are two-sided by design and both went red.
- **Fix:** Both lists and `LOCATOR_CONSUMER_COUNT` moved, each with a comment stating why the module joined and that the direction is **adoption** (a consumer taking the authority) rather than a private grammar smuggled in behind an import. Both pins document that "the pin moving is the pin working"; the numbers were raised only after checking the direction.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** 265 passed
- **Committed in:** `83ecd1e`

**4. [Rule 1 - Bug] A 30-02 case asserted a premise the widened roster falsifies**
- **Found during:** Task 2
- **Issue:** `every FLOOR defaults to 'block', and the one non-'block' default is NOT a floor` collected the non-floor ids and asserted the set equals `["commit_to_branch"]`. Widening the roster from 5 to 13 makes nine members non-floor, so the case failed on a premise ("there is exactly one non-floor member") that was never the invariant it was protecting.
- **Fix:** The case now separates the two questions: the non-floor arm is asserted **non-empty** (non-vacuity), and the set of ids whose default is not `block` is asserted to be exactly `["commit_to_branch"]` — which is the AUTO-07 property it was always guarding, and which is now strictly stronger over 13 members than it was over 5.
- **Files modified:** `scripts/checkpoints.test.ts`
- **Verification:** 78 passed
- **Committed in:** `83ecd1e`

**5. [Rule 4 → resolved at the Task 1 checkpoint] The three-arm union**
- **Found during:** Task 1 preparation
- **Issue:** `workflow-plus-floors` as written is a two-arm union, under which `commit_to_branch` is roster-only and the two-sided comparison is red on its first run.
- **Fix:** Surfaced at the checkpoint as consequence C1 with three candidate resolutions; the user selected `C1-a` (a third arm derived from D-06's legacy grade table). Not auto-fixed — it changes the shape of the derived set and was a user decision.
- **Committed in:** `83ecd1e`

### Clarification, not a deviation

Task 2's criterion "exactly one tag pattern is declared in the file" is implemented as **one `TAG_KEYWORD` declaration** from which both `CHECKPOINT_TAG_RE` (the allow-list) and `CHECKPOINT_KEYWORD_RE` (the refusal's scope selector) are built. Two independent regex literals would have been two authorities for one word, and a selector narrower than the pattern would let a canonical tag be collected without ever being offered to the refusal. A test asserts the single declaration and the superset relation.

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 bug) + 1 escalated to the user and resolved at the checkpoint.
**Impact on plan:** No scope creep. Deviations 3 and 4 are pinned sets and a premise doing exactly what they were built to do when a module adopts an authority and a roster widens; deviations 1 and 2 are ordering and granularity corrections forced by the gates' own rules, and both preserve the acceptance criteria's intent as a derived assertion rather than a weakened one.

## Issues Encountered

- **Import-graph cost was checked before importing the audit stack into the hook's hot path.** `hooks/guard.js` imports `scripts/checkpoints.js` on every PreToolUse call, and adding `check-diff-disposition.js` grows that module closure from 3 files to ~11 (including `frontmatter.js`). Measured before committing to the design: both modules import in ~0.03 s wall, indistinguishable from bare node startup, with no import-time file I/O that could throw. No cycle exists (`context-io → checkpoints → check-diff-disposition` never returns to `context-io`). The derivation is nonetheless kept **out of module scope** — a corpus walk at import time would read 19 files per tool call and, worse, would throw on any kit edit that momentarily left a tag non-canonical, turning a documentation typo into a hook that denies every tool call.

## Known Stubs

None. Every export added by this plan has a caller in the test suite, and the two assertions that cannot yet run against a hook (`assertRosterMatchesDerivation`, `assertSiteCounts`) are driven against the live tree.

## Threat Flags

None. The plan's `<threat_model>` covers every surface this plan touched: T-30-14 (tag scope) is mitigated by the section anchoring proven at P1/P2/P4, T-30-15 (silently short derivation) by the independent denominator proven at P7, T-30-16 (non-canonical tag tolerated) by the allow-list proven at P3, and T-30-17 (frozen section without companion row) by the disposition rows created in the same commit and the gate run after it. No new network endpoint, auth path, file-access pattern or trust-boundary schema was introduced.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready for plan 30-05**, which owns `agent-factory/workflows/05-pr-quality-gate.md`. Its obligations are enumerated above under "The workflow-05 split, reconciled" and pinned as assertions in `scripts/checkpoints.test.ts`.
- **Ready for the surfaces that consume the roster:** `validate-agent-factory.ts` (the `checkpoints.<id>` key validation and the `autonomy` refusal, D-05/D-08), `generate-guarantees.ts` (D-17), and the guard's matrix lookup (D-19). All thirteen ids now exist with defaults, floor membership and env var names derived rather than listed.
- **Note for D-21 surface B:** its red-team rounds start against this derivation. The seven probes above are the executor's own self-repro, not an independent read, and project memory is explicit that a green suite plus a self-repro is a floor rather than a closure.

---
*Phase: 30-per-checkpoint-autonomy-matrix*
*Completed: 2026-09-05*

## Self-Check: PASSED

- `docs/audit/29-style-dispositions/30-04.md` — present on disk
- `.planning/phases/30-per-checkpoint-autonomy-matrix/30-04-SUMMARY.md` — present on disk
- `scripts/checkpoints.ts` / `scripts/checkpoints.js` — present, and the committed `.js` is a fresh build of its `.ts` (`npm run freshness`)
- task commits `83ecd1e` and `2227b24` — both resolve in `git log` (this plan's metadata commit is the one carrying this file, so it cannot name its own hash)
- 14 `checkpoint:` tags counted on the tree by an independent `grep`, matching `RECORDED_TOTAL_SITES`

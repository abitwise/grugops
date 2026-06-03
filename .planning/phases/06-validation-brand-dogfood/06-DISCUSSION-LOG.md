# Phase 6: Validation, Brand & Dogfood - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-03
**Phase:** 6-validation-brand-dogfood
**Areas discussed:** Dogfood execution & proof, Validator scope & strictness, Example runs: real vs illustrative, Brand collateral & naming reconciliation

---

## Dogfood execution & proof (DOG-01, DOG-02)

### Execution model

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: agent live + human runbook | Executor drives no-live-session parts live (portable AGENTS.md sequential path, validator) as real proof; authors a human runbook for live-CC-session parts (plugin install + cache-pointer D-31, live hook firing, sub-agent spawn) | ✓ |
| Agent-driven live, end to end | Executor attempts the full idea→PR incl. CC-native path + hook firing within the session | |
| Human-gated acceptance only | Ship a runbook; all live verification is a post-build human step | |

**User's choice:** Hybrid: agent live + human runbook
**Notes:** Avoids the fabrication risk of an executor sub-agent simulating a marketplace install or real hook interception; honest agent-proven vs human-pending split.

### Sample repo

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal real app, recommended stack | Small TS/Node+Fastify or Vue app, fresh temp/sibling dir outside grugops; bootstrap + one small real ticket idea→PR | ✓ |
| Ultra-minimal placeholder repo | Bare repo (README + one file), trivial ticket | |
| Committed examples/dogfood-sample/ fixture | Sample app committed inside grugops | |

**User's choice:** Minimal real app, recommended stack
**Notes:** Exercises the factory on the kind of project it's designed for.

### Proof artifact

| Option | Description | Selected |
|--------|-------------|----------|
| DOGFOOD report = EX-01 example #3 | One real captured artifact (examples/03-ticket-to-pr.md), labeled REAL RUN with live-session checks marked "pending human"; doubles as the ticket→PR example | ✓ |
| Separate DOGFOOD report + illustrative EX-01 | Two artifacts covering the same flow | |
| Dogfood proof only, no narrative | Minimal pass/fail record; EX-01 authored separately | |

**User's choice:** DOGFOOD report = EX-01 example #3
**Notes:** No duplication; real where possible.

### Dual-path parity (DOG-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Sequential agent-live, CC-spawn human runbook | Sequential path agent-run + captured; CC-native path in runbook; parity via side-by-side checklist | ✓ |
| Both paths in the human runbook | All of DOG-02 deferred to human | |
| Agent attempts both paths live | Executor attempts CC sub-agent spawn live (fabrication risk) | |

**User's choice:** Sequential agent-live, CC-spawn human runbook
**Notes:** Same ticket, same handoffs, same gate verdict — agent-proven for sequential, human-confirmed for CC-native.

---

## Validator scope & strictness (VAL-01)

### Scope vs existing harnesses

| Option | Description | Selected |
|--------|-------------|----------|
| Shipped + dual-purpose self-validation | Shippable kit check that also runs green on grugops's own tree; .planning check-structure.sh harnesses stay as build gates, not replaced | ✓ |
| Shipped artifact only | Verified against dogfood sample + fixtures only | |
| Validator supersedes the bash harnesses | Retire per-phase check-structure.sh gates | |

**User's choice:** Shipped + dual-purpose self-validation
**Notes:** Running the shipped validator on grugops itself is free proof before the dogfood.

### Empty seeded state

| Option | Description | Selected |
|--------|-------------|----------|
| Pass on empty (structural, vacuous) | Ticket/board/traceability checks conditional on ticket files; zero tickets → zero violations | ✓ |
| Require minimal sample rows | Expect ≥1 ticket before ticket-level checks are meaningful | |

**User's choice:** Pass on empty (structural, vacuous)
**Notes:** Matches "checks structure, not behavior"; a clean install validates green.

### Strictness / exit codes

| Option | Description | Selected |
|--------|-------------|----------|
| Two-tier: errors fail (exit 1), warnings report (exit 0) | Structural breakage → nonzero; traceability gaps → warn; --strict promotes warnings | ✓ |
| Single pass/fail | Any deviation fails | |
| Report-only (never nonzero) | Always exit 0 | |

**User's choice:** Two-tier: errors fail (exit 1), warnings report (exit 0)
**Notes:** Matches spec "flags rows missing tests/UAT" (flag, not fail).

### Self-test

| Option | Description | Selected |
|--------|-------------|----------|
| Known-good + known-bad fixtures, self-test script | GOOD tree → exit 0; BAD trees → nonzero + correct finding; kit's guard.test.sh/install.test.sh style | ✓ |
| Self-validation on grugops only | Pass path only; never exercises FAIL | |
| Manual verification, no committed self-test | Verify by hand, ship nothing | |

**User's choice:** Known-good + known-bad fixtures, self-test script
**Notes:** Proves both pass AND fail paths; invocation plain `node` (no package.json created).

---

## Example runs: real vs illustrative (EX-01)

### Real vs illustrative split

| Option | Description | Selected |
|--------|-------------|----------|
| Capture what the dogfood gives; illustrate the rest | Real: #3 ticket→PR + #1 greenfield bootstrap (from the dogfood); illustrative: #2 brownfield, #4 sprint, #5 release | ✓ |
| All five hand-authored illustrative | Uniform illustrative; dogfood report kept separate | |
| Attempt all five live | Drive sprint + release live too | |

**User's choice:** Capture what the dogfood gives; illustrate the rest
**Notes:** Maximizes real proof; illustrates only the impractical-to-run.

### Labeling (no-fabrication)

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit per-file banner + placeholder IDs | "Illustrative run — expected output…" banner + ABC-001/REL-0007/<PR-link>; real = "Real run — captured <date>" | ✓ |
| Section note only | One note in the index; files carry no banner | |

**User's choice:** Explicit per-file banner + placeholder IDs
**Notes:** Reader can never mistake expected for real.

### Location & format

| Option | Description | Selected |
|--------|-------------|----------|
| examples/ at repo root, structured medium-depth | One md per run; input → Orchestrator decision → board moves → expected files/handoffs w/ representative snippets; sprint board snapshots + velocity; release completed trace rows | ✓ |
| docs/examples/, same depth | Same content under docs/ | |
| Full-fidelity (complete handoff bodies inline) | Reproduce complete handoffs/board/trace verbatim | |

**User's choice:** examples/ at repo root, structured medium-depth
**Notes:** 03 = the real dogfood ticket→PR report.

---

## Brand collateral & naming reconciliation (BRAND-01, BRAND-02, BRAND-03)

### Command naming in collateral

| Option | Description | Selected |
|--------|-------------|----------|
| Render shipped surface; never literal /grug | /grugops "<request>" + /grugops-* dash standalone primary, /grugops:* colon plugin; grugbrain.dev + non-affiliation verbatim | ✓ |
| Keep manual's /grug, add a note | Reproduce /grug blocks + a footnote | |

**User's choice:** Render shipped surface; never literal /grug
**Notes:** Executes the D-29 legal-surface reduction the manual predates.

### Brand SVGs / design work

| Option | Description | Selected |
|--------|-------------|----------|
| Ship manual's SVGs as-given; derive variants | Manual's color wordmark + icon as-given; derive mono-dark, mono-light/reverse, icon lockup; no concept change | ✓ |
| Full design pass via gsd-ui-phase | Explore a fresh concept first | |
| As-given + light cleanup | Allow alignment/viewBox/a11y/path fixes, no concept change | (folded in) |

**User's choice:** Ship manual's SVGs as-given; derive the variants
**Notes:** Honors "minimal is on-brand — don't over-design"; light cleanup (alignment/viewBox/a11y/paths) allowed where drop-ins are rough, no concept change.

### Root README relationship

| Option | Description | Selected |
|--------|-------------|----------|
| Root = public hero+quickstart; points to agent-factory/ | Root README is the public face; links to internal agent-factory/README.md; internal README untouched | ✓ |
| Single merged README at root | Fold internal start-here into one root README | |

**User's choice:** Root = public hero+quickstart; points to agent-factory/
**Notes:** Two distinct purposes, no duplication, no overwrite.

---

## Claude's Discretion

- Exact validator finding messages + findings-report structure; precise GOOD/BAD fixture-tree contents.
- Specific sample-app shape and the one dogfood ticket's scope (real idea→PR on the chosen stack).
- Exact human-runbook wording + the side-by-side dual-path parity table.
- Illustrative-example narrative depth and snippet selection within the medium-depth bound; the velocity/metrics line + board-snapshot rendering.
- SVG derivation details (mono recolors, lockup spacing, a11y) within "no concept change."
- README section ordering and FAQ/CONTRIBUTING/NOTICE wording, reproducing the manual's blocks with the D-49 command surface.

## Deferred Ideas

- Live-session human acceptance items (plugin-cache pointer resolution D-31, live PreToolUse hook firing SAFE-02) → carried into the DOG human runbook, not a new phase.
- Filling real gate/deploy commands into a project's `UNKNOWN - verify` slots + the guard's per-project pattern list → per-project at bootstrap/runtime (the dogfood may fill them for its sample repo only, as that repo's real values).
- Milestone close / requirement promotion (Active → Validated) → `/gsd-complete-milestone`, a milestone-boundary activity.

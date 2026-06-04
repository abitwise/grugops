---
phase: 06-validation-brand-dogfood
verified: 2026-06-04T06:32:50Z
status: human_needed
score: 6/7 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Run the human runbook in docs/dogfood-human-runbook.md against the dogfood sample repo in a live Claude Code session"
    expected: "All three checks PASS: (1) /grugops:plan resolves after plugin marketplace install (no path error — D-31); (2) a matched kubectl apply is DENIED by the PreToolUse hook absent GRUGOPS_PROD_DEPLOY_APPROVED (SAFE-02); (3) the same ABC-001 ticket driven via CC sub-agent spawn produces the same handoff filenames + READY_FOR_HUMAN_REVIEW verdict"
    why_human: "Plugin marketplace install, plugin-cache pointer resolution, live PreToolUse hook firing, and CC sub-agent spawn all require an interactive Claude Code session that an executor agent cannot honestly self-perform (D-38, T-06-FAB2). The runbook's parity table in examples/03-ticket-to-pr.md has 9 CC-native cells still marked 'pending human' pending this run."
---

# Phase 6: Validation, Brand & Dogfood — Verification Report

**Phase Goal:** Ship the validator, examples, brand/legal collateral, and prove the kit end-to-end via a real idea-to-PR dogfood run.
**Verified:** 2026-06-04T06:32:50Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `scripts/validate-agent-factory.mjs` exits 0 on grugops's own tree (bare and --strict), fails on each broken fixture with the correct finding, supports --strict warning-promotion, runs stdlib-only, no package.json | VERIFIED | `node scripts/validate-agent-factory.mjs` → `ALL CHECKS PASSED` exit 0; `--strict` → exit 0; `sh scripts/validate.test.sh` → ALL CHECKS PASSED (10/10 PASS); imports only `node:fs`, `node:path`, `node:url`; no package.json found anywhere in repo |
| 2 | Five brand SVGs exist using only the locked Charcoal/Bone/Granite/Ochre palette, lowercase grugops, aria-labels on wordmark + icon | VERIFIED | All 5 files present; off-palette hex grep returns empty; `aria-label` on wordmark.svg and icon.svg; `#2C2A28` appears 4× in mono-dark, `#F3ECE0` 4× in mono-light; grugops lowercase confirmed |
| 3 | README.md opens in clear voice, includes hero, Acknowledgements (grugbrain.dev/Carson Gross), non-affiliation footer, links to agent-factory/README.md, states 0.1.0 | VERIFIED | All 6 checks passed: ACK-OK, GRUGBRAIN-OK, CARSON-OK, LINK-OK, NONAFF-OK, VERSION-OK; README is 53 lines |
| 4 | NOTICE (non-affiliation), CONTRIBUTING.md (original-art rules), docs/faq.md exist; no literal /grug in any collateral | VERIFIED | All 3 files present with expected content; /grug leak grep returns empty across README + NOTICE + CONTRIBUTING + faq |
| 5 | Five example runs exist — #1/#3 as REAL captures (Real run banner + gate verdict + pending human CC cells), #2/#4/#5 as ILLUSTRATIVE (Illustrative run banner); no literal /grug | VERIFIED | All 5 examples present with correct banners; example 03 has READY_FOR_HUMAN_REVIEW + pending human parity cells; /grugops confirmed; /grug leak grep returns empty across all examples |
| 6 | DOG-01: grugops installed on out-of-repo sample, bootstrapped, ABC-001 driven idea→PR, validator passed on resulting tree | VERIFIED | Captured in examples/03-ticket-to-pr.md: sample at /tmp/grugops-dogfood-20260604-084625, gate verdict READY_FOR_HUMAN_REVIEW, validator ALL CHECKS PASSED (exit 0 bare + strict) on sample tree; validator still exits 0 on own tree (re-confirmed) |
| 7 | DOG-02: same roles/handoffs/gates exercised over both the sequential AGENTS.md path AND the Claude Code sub-agent spawn path, confirming "only the dispatch differs, never the content" | HUMAN NEEDED | Agent-proven sequential half is complete and captured. CC-native half (plugin marketplace install D-31, live PreToolUse hook firing SAFE-02, sub-agent spawn parity) deferred to milestone-close UAT at the user's explicit checkpoint decision ("deferred"). The parity table in examples/03-ticket-to-pr.md has 9 cells marked `pending human`. See docs/dogfood-human-runbook.md for the precise 3-check live-session checklist. |

**Score:** 6/7 truths verified (1 pending human by design)

### Deferred Items

No items are deferred to later phases — this is the final phase of the milestone. DOG-02's live-CC half is routed to human verification, not a later phase.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/validate-agent-factory.mjs` | Structure-only Node ESM validator, stdlib-only, min 120 lines | VERIFIED | 354 lines; imports only node:fs/path/url; exits 0 on own tree bare + strict |
| `scripts/validate.test.sh` | GOOD/BAD fixture harness, prints ALL CHECKS PASSED | VERIFIED | 10/10 PASS; includes bad-ticket-bad-column fixture (WR-02 fix) |
| `scripts/fixtures/good/` | Minimal valid tree → exit 0 | VERIFIED | Present; GOOD fixture passes |
| `scripts/fixtures/bad-plugin-noname/` | One-mutation BAD tree → nonzero | VERIFIED | Confirmed via harness PASS |
| `scripts/fixtures/bad-ticket-bad-column/` | Column-membership check fixture (WR-02 fix) | VERIFIED | Present; harness asserts "not a board column" |
| `brand/wordmark.svg` | Color wordmark with aria-label | VERIFIED | Present; aria-label confirmed; Ochre/Charcoal/Granite palette |
| `brand/wordmark-mono-dark.svg` | All-Charcoal mono wordmark | VERIFIED | Present; 4× `#2C2A28` |
| `brand/wordmark-mono-light.svg` | All-Bone reverse wordmark | VERIFIED | Present; 4× `#F3ECE0` |
| `brand/wordmark-lockup.svg` | Horizontal icon + wordmark lockup | VERIFIED | Present; palette-clean |
| `brand/icon.svg` | Club-on-stone icon with aria-label | VERIFIED | Present; aria-label confirmed |
| `README.md` | Public face with Acknowledgements + non-affiliation + version + internal link | VERIFIED | 53 lines; all required content present |
| `NOTICE` | Non-affiliation legal block | VERIFIED | "not affiliated" confirmed |
| `CONTRIBUTING.md` | Original-art + no-affiliation contributor rules | VERIFIED | "original" confirmed |
| `docs/faq.md` | §8.8 FAQ | VERIFIED | Present |
| `examples/01-greenfield-bootstrap.md` | REAL run capture with banner | VERIFIED | "Real run" banner present; /grugops only |
| `examples/02-brownfield-bootstrap.md` | ILLUSTRATIVE with banner | VERIFIED | "Illustrative run" banner present |
| `examples/03-ticket-to-pr.md` | REAL capture with gate verdict + pending human parity cells | VERIFIED | READY_FOR_HUMAN_REVIEW + "pending human" confirmed |
| `examples/04-sprint-cycle.md` | ILLUSTRATIVE with WIP board + velocity line | VERIFIED | WIP heading + velocity/throughput/cycle time confirmed |
| `examples/05-release-run.md` | ILLUSTRATIVE with REL-0007 + completed traceability + placeholder approver | VERIFIED | REL-0007 + Done row + placeholder `<release-lead name>` (WR-04 fix) confirmed |
| `docs/dogfood-human-runbook.md` | Human checklist for D-31 + SAFE-02 + sub-agent spawn + V14 safety | VERIFIED | All 5 content checks pass: plugin install, PreToolUse/hook/kubectl, sub-agent/spawn, GRUGOPS_PROD_DEPLOY_APPROVED, pending human |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/validate-agent-factory.mjs` | `agent-factory/roles/*.md + workflows/*.md + factory.config.json + plans/board.md + .claude-plugin/plugin.json` | read + prefix-match sections + JSON.parse + frontmatter regex | WIRED | Validator reads all required paths using `join(ROOT, literal)` pattern; startsWith confirmed (3 occurrences) |
| `scripts/validate.test.sh` | `scripts/validate-agent-factory.mjs` | VALIDATE_ROOT-prefixed node invocations against fixtures | WIRED | PASS on all 10 harness cases including own-tree self-validate |
| `examples/03-ticket-to-pr.md` (sequential column) | `docs/dogfood-human-runbook.md` (CC-native column) | side-by-side parity table with `pending human` cells | WIRED | Parity table present in example 03; runbook step 4 explicitly points to the table |
| `README.md` | `agent-factory/README.md` | markdown link (D-51) | WIRED | `grep -q 'agent-factory/README.md' README.md` passes |
| dogfood sample repo | `scripts/validate-agent-factory.mjs` | VALIDATE_ROOT pointed at sample tree (DOG-01) | WIRED | Captured: ALL CHECKS PASSED exit 0 on sample tree at /tmp/grugops-dogfood-20260604-084625 |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces markdown documentation, SVG assets, a Node CLI validator, and a shell test harness. None of these render dynamic data from a state variable; they have no fetch/store/state pattern requiring Level 4 trace.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Validator exits 0 on own tree | `node scripts/validate-agent-factory.mjs` | `ALL CHECKS PASSED` exit 0 | PASS |
| Validator exits 0 on own tree with --strict | `node scripts/validate-agent-factory.mjs --strict` | `ALL CHECKS PASSED` exit 0 | PASS |
| Self-test harness all green | `sh scripts/validate.test.sh` | `ALL CHECKS PASSED` (10/10 PASS) | PASS |
| No package.json created | `find . -name package.json -not -path './node_modules/*'` | empty output | PASS |
| Validator is stdlib-only | `grep -E "^import"` | only `node:fs`, `node:path`, `node:url` | PASS |
| Off-palette hex check | `grep -RoiE '#[0-9a-f]{6}' brand/*.svg \| grep -viE '#2C2A28\|#F3ECE0\|#6B6B6B\|#C8642D'` | empty (palette-clean) | PASS |
| No /grug leak in collateral | `grep -rE '/grug([^o]\|$)'` across README+NOTICE+CONTRIBUTING+faq+examples+runbook | empty | PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes found for this phase. Self-test coverage is provided by `scripts/validate.test.sh` (run above).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VAL-01 | 06-01 | Structure-only Node validator: required files, sections, config, board-ticket match, traceability completeness, packaging, no package.json | SATISFIED | Validator exits 0 own tree bare + strict; self-test 10/10 PASS; no package.json |
| EX-01 | 06-04 + 06-05 | Five example runs (greenfield, brownfield, ticket→PR, sprint, release) | SATISFIED | All 5 exist with correct banners; real captures have gate verdicts; illustrative have honesty banners |
| BRAND-01 | 06-03 | README: clear voice, hero, Acknowledgements (grugbrain.dev/Carson Gross), non-affiliation footer | SATISFIED | All 6 README content checks pass |
| BRAND-02 | 06-03 | NOTICE, CONTRIBUTING.md, docs/faq.md from brand manual blocks | SATISFIED | All 3 files present with required content |
| BRAND-03 | 06-02 | 5 brand SVGs: color/mono-dark/mono-light/lockup wordmarks + icon, locked palette, lowercase grugops | SATISFIED | All 5 present, palette-clean, aria-labels confirmed |
| DOG-01 | 06-05 | Validator passes on throwaway sample repo after idea→PR run | SATISFIED | Captured in example 03: ALL CHECKS PASSED exit 0 on sample tree; re-confirmed on own tree |
| DOG-02 | 06-05 | Same roles/handoffs/gates over sequential AGENTS.md path AND CC sub-agent spawn path | PARTIALLY SATISFIED | Sequential path: agent-proven, captured in examples 01+03. CC-native path: human runbook authored with precise 3-check checklist + parity table; live run deferred to milestone-close UAT (user's explicit checkpoint choice) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No TBD/FIXME/XXX debt markers found in any phase 6 created file | — | — |

Code review findings CR-01, WR-01, WR-02, WR-03, WR-04 were all fixed before verification (commits 015787a, a8507c5, e3256d9, 6c7dfee, 5b2843f per 06-REVIEW.md). Verified:

- **CR-01** (null guard in checkPackaging): `raw === null` early return present at line 315–321 of validate-agent-factory.mjs
- **WR-01** (lint/build honesty contradiction): example 03 lines 113–118 now contain the honest note; example 01 lines 83–88 consistent with it
- **WR-02** (boardHasColumn false-positive): `bad-ticket-bad-column` fixture present; harness asserts "not a board column" at line 83 of validate.test.sh
- **WR-03** (prefix-match word-prefix flaw): `boardColumnName` normalization + equality check present at lines 278–284 of validate-agent-factory.mjs
- **WR-04** (real name in illustrative release): lines 116–117 of example 05 now use `<release-lead name>` and `<named human>` placeholders

Info findings IN-01 through IN-04 are intentionally deferred (non-blocking per 06-REVIEW.md resolution).

### Human Verification Required

#### 1. DOG-02 Live Claude Code Session — CC-Native Path Parity

**Test:** Run the three-check human runbook in `docs/dogfood-human-runbook.md` against the dogfood sample repo in a live Claude Code session:

1. **D-31 plugin-cache pointer resolution:** Run `/plugin marketplace add <owner>/grugops` then `/plugin install grugops@grugops`, then `/grugops:plan` — confirm it produces planning output and NOT a path error (proves `agent-factory/roles/*.md` pointers resolve from the user's repo, not the broken plugin cache)
2. **SAFE-02 live PreToolUse hook firing:** Attempt a matched guarded prod-deploy (e.g. `kubectl apply -f x`) WITHOUT setting `GRUGOPS_PROD_DEPLOY_APPROVED` — confirm the PreToolUse hook DENIES with the clear-voice deny message (NOT a silent pass)
3. **CC sub-agent spawn path parity:** Drive the same `ABC-001 — GET /version endpoint` ticket via the CC sub-agent path (`settings.json` `agent:` → `Agent` tool spawn) — confirm the SAME handoff filenames (`implementation-handoff.md`, `qe-handoff.md`) and SAME gate verdict (`READY_FOR_HUMAN_REVIEW`) as the captured sequential run

After all three checks, fill the CC-native column in the dual-path parity table in `examples/03-ticket-to-pr.md` (9 cells currently `pending human`).

**Expected:** All three checks PASS; the parity table is filled and matching — "only the dispatch differs, never the content"

**Why human:** Plugin marketplace install, plugin-cache pointer resolution, live hook firing, and sub-agent spawn require an interactive Claude Code session. An executor agent cannot honestly self-perform these (D-38, T-06-FAB2). Fabricating them would undermine the entire no-fabrication value prop of the project.

**Safety note (V14, clear voice):** Do NOT set `GRUGOPS_PROD_DEPLOY_APPROVED`. Do NOT run a real deploy. The SAFE-02 check only confirms the hook DENIES — the denial is the expected and correct outcome.

### Gaps Summary

No gaps. All 6 automatically-verifiable must-haves are VERIFIED. The one human_needed item (DOG-02 CC-native path) is an intentional, explicitly-deferred design decision — the honest agent-proven/human-pending split is the intended architecture ("humans decide, agents execute"). It is tracked in `docs/dogfood-human-runbook.md` and the `examples/03-ticket-to-pr.md` parity table.

---

_Verified: 2026-06-04T06:32:50Z_
_Verifier: Claude (gsd-verifier)_

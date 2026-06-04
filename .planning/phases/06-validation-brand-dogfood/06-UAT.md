---
status: partial
phase: 06-validation-brand-dogfood
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, 06-04-SUMMARY.md, 06-05-SUMMARY.md]
started: 2026-06-04T07:27:25Z
updated: 2026-06-04T07:35:30Z
---

## Current Test

[testing paused — 1 item outstanding: Test 8 (DOG-02 CC-native) deferred to 06-HUMAN-UAT.md]

## Tests

### 1. Structure Validator Runs Green
expected: From the repo root, `node scripts/validate-agent-factory.mjs` prints a passing summary (ALL CHECKS PASSED) and exits 0 — both bare and with `--strict`. Zero npm deps, no package.json. (VAL-01)
result: pass
evidence: "bare → ALL CHECKS PASSED, exit 0; --strict → ALL CHECKS PASSED, exit 0 (run live from repo root)"

### 2. Validator Self-Test (GOOD/BAD Fixtures)
expected: `sh scripts/validate.test.sh` prints ALL CHECKS PASSED. The GOOD fixture exits 0; each BAD fixture (missing role section, config-no-mode, plugin-noname, ticket-mismatch) exits nonzero naming its finding; and the warn-only fixture flips from exit 0 bare to nonzero under `--strict`. Proves the validator both passes AND fails correctly — no fabricated green. (VAL-01 / D-45)
result: pass
evidence: "10/10 self-test checks PASS incl. own-tree green (bare+strict), all 5 BAD fixtures nonzero naming finding, warn-only flips green→nonzero under --strict (promotion proven). ALL CHECKS PASSED, exit 0"

### 3. Brand SVGs Present and On-Palette
expected: brand/ holds 5 well-formed SVGs (wordmark, icon, mono-dark, mono-light reverse, lockup). Each reads lowercase `grugops`, uses only the 4 locked palette hex (Charcoal #2C2A28 / Bone #F3ECE0 / Granite #6B6B6B / Ochre #C8642D), and carries an aria-label. Previewing shows the `/grugops` wordmark and club-on-stone icon — original art, no children's-book resemblance. (BRAND-03)
result: pass
evidence: "5 SVGs present (icon, wordmark, wordmark-lockup, wordmark-mono-dark, wordmark-mono-light). Every file: aria-label YES, lowercase grugops YES, no uppercase variant. All hex on-palette — zero off-palette colors flagged across all 5 files."

### 4. Public README Is the Front Door
expected: Root README.md opens with a clear-voice description plus one grug wink, shows the `/grugops` hero (never literal `/grug`), an install quickstart pointing at install/install.sh stating version 0.1.0, an Acknowledgements section crediting grugbrain.dev / Carson Gross, the non-affiliation footer, and a link to the internal agent-factory/README.md. (BRAND-01)
result: pass
evidence: "No literal /grug (no-colon) leakage; /grugops present x3; install/install.sh + version 0.1.0 (L22); Acknowledgements crediting grugbrain.dev / Carson Gross (L42-44); non-affiliation footer (L46,L51); link to agent-factory/README.md (L40)."

### 5. Legal & FAQ Collateral
expected: NOTICE (non-affiliation, © 2026 Olger Oeselg), CONTRIBUTING.md (original-art + no-affiliation contributor rules), and docs/faq.md are present and reproduced verbatim from the brand manual in clear voice — no re-authored disclaimer prose. (BRAND-02)
result: pass
evidence: "NOTICE present — 'Copyright (c) 2026 Olger Oeselg' + 'not affiliated with' (L2,L5,L8). CONTRIBUTING.md present — original-work mascot rule + no children's-book-tie rule + dev-philosophy 'grug' usage. docs/faq.md present (26 lines, clear voice)."

### 6. Illustrative Example Runs
expected: examples/02-brownfield-bootstrap.md, examples/04-sprint-cycle.md, examples/05-release-run.md each open with the banner "Illustrative run — expected output, not a captured session", narrate the real flow spines with real column/handoff/metric names, use obvious placeholder IDs, render `/grugops` only, and show the deploy gate in clear voice. (EX-01 illustrative half)
result: pass
evidence: "All 3 open with 'Illustrative run — expected output, not a captured session' (L3 each). No literal /grug leak in any. /grugops rendered (02:x1, 04:x1, 05:x3)."

### 7. REAL Dogfood Capture
expected: examples/01-greenfield-bootstrap.md and examples/03-ticket-to-pr.md capture a REAL idea→PR run on an out-of-repo TS/Node+Fastify sample (ticket ABC-001 GET /version) with a "Real run" banner, gate verdict READY_FOR_HUMAN_REVIEW, and an honest `<none>` PR link (throwaway sample had no remote). The validator (DOG-01) passed on both the sample tree and grugops's own tree. (EX-01 real half / DOG-01)
result: pass
evidence: "Both open 'Real run — captured 2026-06-03' (L3). ABC-001 GET /version present in both. 03 shows gate: READY_FOR_HUMAN_REVIEW (L74) and honest PR disclosure '[local branch, no remote]' (the honest <none> equivalent). DOG-01 own-tree validator green confirmed live (Tests 1-2); sample-tree pass documented in 06-03-SUMMARY.md (out-of-repo throwaway, not re-runnable here)."

### 8. CC-Native Dual-Path Parity (DOG-02)
expected: The live-Claude-Code half of DOG-02 — plugin marketplace install + plugin-cache pointer resolution (D-31), live PreToolUse deploy-guard hook firing (SAFE-02), and the CC sub-agent spawn path yielding the same handoffs/verdict — fills the 9 `pending human` cells in the parity table in examples/03-ticket-to-pr.md. Requires a live CC session per docs/dogfood-human-runbook.md; tracked in 06-HUMAN-UAT.md. (DOG-02)
result: blocked
blocked_by: other
reason: "Requires a live Claude Code session (cannot be honestly self-performed by an executor). Deferred to milestone-close UAT at checkpoint:human-verify (06-05). Tracked in 06-HUMAN-UAT.md; runbook at docs/dogfood-human-runbook.md. Confirmed live now: the parity table in examples/03-ticket-to-pr.md holds exactly 9 'pending human' cells awaiting this run. The mechanical guard half is already green (hooks/guard.test.sh)."

## Summary

total: 8
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 1

## Gaps

[none — 7 automated checks green; the 1 blocked item is a prerequisite-gated manual test (live CC session), not a code defect]

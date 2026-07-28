# Phase 9: Doctor & Two-Root Validator - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-07
**Phase:** 9-Doctor & Two-Root Validator
**Areas discussed:** Doctor check scope, Kit-root resolution, FAIL/WARN tiers, Validator structure & check-kit-refs relationship, Cross-check mismatch severity, Parse breadth, Test-harness plan

---

## Doctor check scope (INSTALL-05 / SC1)

| Option | Description | Selected |
|--------|-------------|----------|
| Curated load-bearing set | Fixed, hand-maintained list of the start-up reads (KIT_ROOT, orchestrator.md, 2 adapters, config, board.md, plans/handoffs/, marker) | |
| Parse-and-resolve refs | Dynamically read adapters/marker (and optionally grep kit refs) and stat whatever they reference, reusing kit-vs-state classification | ✓ |
| Hybrid (curated + adapter-derived) | Curated set PLUS whatever the marker/adapter KIT line points at | |

**User's choice:** Parse-and-resolve refs
**Notes:** Must reuse the Phase-7 kit-vs-state classification so state refs resolve in-repo and don't false-fail. Exact breadth delegated to planner (see Claude's Discretion).

---

## Kit-root resolution — the "can never disagree" mechanism (SC4)

| Option | Description | Selected |
|--------|-------------|----------|
| Cross-check all three | Re-resolve the rule + read marker.kitRoot + read adapter KIT line; disagreement is a finding | ✓ |
| Marker is source of truth | Read .grugops/install.json kitRoot as authoritative; validator reads the same marker | |
| Re-resolve the rule | Both independently apply ${GRUGOPS_HOME:-$HOME/.grugops}; shared test asserts agreement | |

**User's choice:** Cross-check all three
**Notes:** This is the stale-install / moved-clone detector — the reason the doctor exists. Validator resolves the kit home by the same rule (re-implemented, not shared across the sh boundary), proven by a shared agreement test.

---

## FAIL conditions (hard, nonzero) — multiSelect

| Option | Description | Selected |
|--------|-------------|----------|
| Missing kit / orchestrator / adapter = FAIL | Unresolvable KIT_ROOT, missing orchestrator.md, unresolvable materialized adapter path, unset-$GRUGOPS_HOME (C3) | ✓ |
| Dangling symlink = FAIL | Broken symlink in the resolved set is a hard FAIL (SC1 names "no dangling symlinks") | ✓ |
| Kit-version skew = WARN | Marker kitVersion != installed VERSION → WARN | (moved to WARN tier — see below) |
| Missing optional seed = WARN | Seed file that should exist but doesn't → WARN | (moved to WARN tier — see below) |

**User's choice:** Missing kit/orchestrator/adapter = FAIL; Dangling symlink = FAIL
**Notes:** Only the two FAIL items were selected here; the WARN items were resolved in the follow-up round below.

---

## WARN tier (SC2 requires WARN + --strict plumbing)

| Option | Description | Selected |
|--------|-------------|----------|
| Empty for now, plumbing wired | No live WARN conditions; machinery built + tested with a synthetic warn | |
| Add skew + missing-seed as WARN | Both kit-version skew and missing-optional-seed are real WARN conditions now | ✓ |
| Only kit-version skew as WARN | Just the skew warning; leave seed-completeness out | |

**User's choice:** Add skew + missing-seed as WARN
**Notes:** Non-empty WARN tier so --strict gates real warnings, not empty plumbing. Skew is detected/warned only — no negotiation (SKEW-01 → v1.2).

---

## Cross-check mismatch severity

| Option | Description | Selected |
|--------|-------------|----------|
| Mismatch = FAIL | Disagreement among the three kit-root sources → hard FAIL with all three values + remediation | |
| Mismatch = WARN | Disagreement → warning (0 unless --strict) | |
| You decide | Planner chooses based on whether divergent paths still resolve to a real kit | ✓ |

**User's choice:** You decide
**Notes:** Captured as Claude's Discretion; leaning FAIL on true divergence, WARN on cosmetic-equivalent path difference.

---

## Parse breadth (within parse-and-resolve)

| Option | Description | Selected |
|--------|-------------|----------|
| Adapters + marker + load-bearing reads | Parse the 2 adapters + marker, stat orchestrator.md/config/board.md/plans/handoffs/ | |
| Also grep+stat kit role/workflow refs | Additionally grep the kit's role/workflow agent-factory/ refs and stat at KIT_ROOT | |
| You decide | Planner sets breadth within the parse-and-resolve approach | ✓ |

**User's choice:** You decide
**Notes:** Captured as Claude's Discretion; keep bounded and deterministic.

---

## Test-harness plan (SC5)

| Option | Description | Selected |
|--------|-------------|----------|
| Extend install.test.sh; keep both | Add SC5 doctor checks to install.test.sh; keep install.two-root.test.sh as the deep harness | ✓ |
| Merge into one harness | Consolidate both into a single split-aware harness | |
| Doctor-only in a new harness | Add doctor/validator coverage (incl. C3 BAD fixture) in a dedicated new file | |

**User's choice:** Extend install.test.sh; keep both
**Notes:** Two harnesses, some overlap accepted. Phase-8's "don't rewrite install.test.sh" boundary is lifted for these doctor additions.

---

## Validator structure & check-kit-refs relationship

| Option | Description | Selected |
|--------|-------------|----------|
| Two roots, independent; keep check-kit-refs separate | Explicit KIT_ROOT + STATE_ROOT (no default → unset errors); validate kit + state independently; leave check-kit-refs.sh separate | ✓ |
| Two roots; validator CALLS check-kit-refs | Same inputs, but validator invokes check-kit-refs.sh as one check | |
| Absorb check-kit-refs into the validator | Reimplement grep-to-zero inside .mjs, retire the script | |

**User's choice:** Two roots, independent; keep check-kit-refs separate
**Notes:** Least coupling; preserves POSIX-only CI option; honors Phase-7 D-07 "kept separate." The no-default explicit-roots design is what kills the `.`-fallback and forces the C3 BAD fixture to fail.

---

## Claude's Discretion

- Cross-check mismatch severity (FAIL vs WARN, by whether divergent paths still resolve to a real kit).
- Parse-and-resolve breadth (adapters+marker+load-bearing reads vs also grep+stat kit role/workflow refs).
- C3 BAD-fixture mechanism (unset env var vs nonexistent dir vs both).
- Validator env-var / input naming (reuse VALIDATE_ROOT for state + add KIT_ROOT, vs two fresh names); stdlib-only, read-only, no package.json.
- `--check` in an uninstalled / dev checkout → clear "not installed — run install.sh" with nonzero exit, never a crash.
- Doctor output format (human-readable lines naming failing path + referencing file).

## Deferred Ideas

- Doctor `--fix` / auto-repair (FIX-01, v2+) — report-only, never edits user content.
- `install.sh --migrate` (MIGR-01, v1.2) — never delete-first.
- `install.sh --update` central-kit refresh (UPD-01, v1.2).
- Version-skew negotiation/handling (SKEW-01, v1.2) — this phase only detects + WARNs.
- Plugin-form kit resolution via `${CLAUDE_PLUGIN_ROOT}` (PLUGIN-01, v2+).
- `uninstall.sh --purge-kit` (carried from Phase 8 deferred).

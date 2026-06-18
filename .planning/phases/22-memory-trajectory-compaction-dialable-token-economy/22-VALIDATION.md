---
phase: 22
slug: memory-trajectory-compaction-dialable-token-economy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-18
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: 22-RESEARCH.md `## Validation Architecture` (HIGH confidence). Per-task IDs are
> finalized by the planner; this draft carries the test infrastructure, sampling cadence,
> and Wave 0 gaps that are already known.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `vitest ~4.1.8` (dev-only; `globals: false` → import `{describe,it,expect}` explicitly) |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npx vitest run scripts/compactor.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (regression lane — excludes the live claude-CLI e2e lane that spends tokens) |
| **Build/freshness gate** | `npm run build && npm run freshness` (proves `compactor.js` is byte-fresh vs `compactor.ts`) |
| **Estimated runtime** | ~seconds (unit/integration); freshness adds a `tsc` rebuild-to-temp |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run scripts/compactor.test.ts` (carve-out + dial unit cases — seconds)
- **After every plan wave:** Run `npm run build && npm run freshness && npx vitest run --exclude '**/scripts/e2e/**'` (full regression + drift gate)
- **Before `/gsd-verify-work`:** Full suite + `freshness:catalog` + `freshness:context` green
- **Max feedback latency:** ~30 seconds (unit lane); minutes for the full build+freshness gate

---

## Per-Task Verification Map

> Task IDs (`22-NN-NN`) are assigned by the planner. The requirement→behavior→command rows
> below are lifted verbatim from 22-RESEARCH.md and MUST each map onto at least one plan task's
> `<acceptance_criteria>` / `<verify>`. The executor fills the Task ID / Plan / Wave / Status
> columns as plans are written and run.

| Req | Behavior | Test Type | Automated Command | File Exists | Status |
|-----|----------|-----------|-------------------|-------------|--------|
| CMP-02 | Dropping `verified_by` from a promoted note → refuse (exit 1, names `verified_by`) | unit | `npx vitest run scripts/compactor.test.ts -t "drops verified_by"` | ❌ W0 | ⬜ pending |
| CMP-02 | Dropping `supersedes` → refuse (names `supersedes`) | unit | `... -t "drops supersedes"` | ❌ W0 | ⬜ pending |
| CMP-02 | Dropping `by` / `at` provenance → refuse (names the field) | unit | `... -t "drops by"` / `... -t "drops at"` | ❌ W0 | ⬜ pending |
| CMP-02 | Dropping ANY raw `failed-attempt` note id → refuse (names the dropped id) | unit | `... -t "drops a failed-attempt"` | ❌ W0 | ⬜ pending |
| CMP-02 | GOOD: faithful compaction preserving all carve-out elements → accepted (exit 0) | unit | `... -t "carve-out intact accepts"` | ❌ W0 | ⬜ pending |
| CMP-02 | Carve-out is dial-invariant: each drop still refuses at all 3 dial values (D-05) | unit | `... -t "carve-out un-dialable"` | ❌ W0 | ⬜ pending |
| CMP-01 | Verbose trajectory stays in `threads/<agent>.md`; only the compact distillation reaches `notes/` | integration | `... -t "two-tier separation"` | ❌ W0 | ⬜ pending |
| CMP-01 | Promotion routes ONLY through `context-io.appendNote` (no forked writer, D-02.3) | unit + guard | `... -t "promotes via appendNote only"` + `guard_context_writes` | ❌ W0 | ⬜ pending |
| CMP-01 | `threads/` is gitignored (entry exists, scoped to `*/threads/`, not the whole context dir) | unit | `... -t "threads gitignored"` | ❌ W0 | ⬜ pending |
| CMP-03 | `aggressive\|balanced\|retain-raw` change body verbosity / raw-reaching-shared; promoted note set + carve-out stay dial-invariant | unit | `... -t "dial is body-only, note-set invariant"` | ❌ W0 | ⬜ pending |
| CMP-03 | Lean default: `context.compaction` absent ⇒ `aggressive` | unit | `... -t "absent dial defaults aggressive"` | ❌ W0 | ⬜ pending |
| CMP-03 | Re-verify: faithful body compaction re-admits via `admit()`; materially-changed finding refused → degrades to `claim` + `UNKNOWN - verify` (D-12) | integration | `... -t "re-verify faithful admits"` / `... -t "materially-changed degrades to claim"` | ❌ W0 | ⬜ pending |
| CMP-03 / D-13 | `compactor.js` is byte-fresh vs `compactor.ts` (auto-discovered by freshness set) | build gate | `npm run build && npm run freshness` | ✅ auto | ⬜ pending |
| CMP-03 / catalog | New WF18 row appears; catalog stays fresh; count test bumped 17→18 | content gate | `npm run generate:catalog && npm run freshness:catalog && npx vitest run scripts/generate-catalog.test.ts` | ⚠️ test edit | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/compactor.test.ts` — covers CMP-01 / CMP-02 / CMP-03 (the carve-out RED cases first)
- [ ] `scripts/compactor.ts` + committed `scripts/compactor.js` — the helper under test
- [ ] `scripts/generate-catalog.test.ts` edit — bump `toBe(17)` → `toBe(18)` and add `18-context-compaction` to `WORKFLOW_NAMES` (else RED on WF18 add)
- [ ] No framework install needed — `vitest` / `tsc` already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `18-context-compaction.md` is the single-source protocol; every role references it via a one-line pointer and no role restates it | CMP-03 / SC-4 | Validator section-check for WF18 is deferred to Phase 24; "follows the protocol / doesn't restate it" is reviewer-judged, not yet a foundation guard (`guard_context_protocol_single_source` is Phase 24) | Confirm WF18 exists, is clear-voice, references WF16 admission rules (not restated); grep role files for the WF18 pointer line; confirm no role body restates the compaction steps |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (unit lane)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

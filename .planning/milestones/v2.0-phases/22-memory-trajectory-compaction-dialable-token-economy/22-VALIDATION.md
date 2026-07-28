---
phase: 22
slug: memory-trajectory-compaction-dialable-token-economy
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-18
validated: 2026-07-21
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: 22-RESEARCH.md `## Validation Architecture` (HIGH confidence). Per-task IDs are
> finalized by the planner; this draft carries the test infrastructure, sampling cadence,
> and Wave 0 gaps that are already known.
>
> **Audited 2026-07-21** against the executed phase (9 plans, VERIFICATION.md round 8
> `passed` 8/8). All automated rows verified green on this box; see audit trail below.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `vitest ~4.1.8` (dev-only; `globals: false` → import `{describe,it,expect}` explicitly) |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npx vitest run scripts/compactor.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (regression lane — excludes the live claude-CLI e2e lane that spends tokens) |
| **Build/freshness gate** | `npm run build && npm run freshness` (proves `compactor.js` is byte-fresh vs `compactor.ts`) |
| **Estimated runtime** | ~6s (compactor unit lane); ~31s full non-e2e suite; freshness adds a `tsc` rebuild-to-temp |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run scripts/compactor.test.ts` (carve-out + dial unit cases — seconds)
- **After every plan wave:** Run `npm run build && npm run freshness && npx vitest run --exclude '**/scripts/e2e/**'` (full regression + drift gate)
- **Before `/gsd-verify-work`:** Full suite + `freshness:catalog` + `freshness:context` green
- **Max feedback latency:** ~30 seconds (unit lane); minutes for the full build+freshness gate

---

## Per-Task Verification Map

> Requirement→behavior→command rows lifted from 22-RESEARCH.md. All rows re-run green on
> 2026-07-21. `scripts/compactor.test.ts` now carries **185 tests** — the 14 draft rows plus
> the round-3→8 adversarial gap-closure corpora (id-keyed carve-out, oracle unification,
> line-shape matrix, multi-note thread files, boundary-miss fail-closure, fence-open
> fail-closure, writer-order guard) added by plans 22-03 … 22-09.

| Req | Behavior | Test Type | Automated Command | File Exists | Status |
|-----|----------|-----------|-------------------|-------------|--------|
| CMP-02 | Dropping `verified_by` from a promoted note → refuse (exit 1, names `verified_by`) | unit | `npx vitest run scripts/compactor.test.ts -t "drops verified_by"` | ✅ | ✅ green |
| CMP-02 | Dropping `supersedes` → refuse (names `supersedes`) | unit | `... -t "drops supersedes"` | ✅ | ✅ green |
| CMP-02 | Dropping `by` / `at` provenance → refuse (names the field) | unit | `... -t "drops by"` / `... -t "drops at"` | ✅ | ✅ green |
| CMP-02 | Dropping ANY raw `failed-attempt` note id → refuse (names the dropped id) | unit | `... -t "drops a failed-attempt"` | ✅ | ✅ green |
| CMP-02 | GOOD: faithful compaction preserving all carve-out elements → accepted (exit 0) | unit | `... -t "carve-out intact accepts"` | ✅ | ✅ green |
| CMP-02 | Carve-out is dial-invariant: each drop still refuses at all 3 dial values (D-05) | unit | `... -t "carve-out un-dialable"` | ✅ | ✅ green |
| CMP-01 | Verbose trajectory stays in `threads/<agent>.md`; only the compact distillation reaches `notes/` | integration | `... -t "two-tier separation"` | ✅ | ✅ green |
| CMP-01 | Promotion routes ONLY through `context-io.appendNote` (no forked writer, D-02.3) | unit + guard | `... -t "promotes via appendNote only"` + `guard_context_writes` (check-foundation-guards) | ✅ | ✅ green |
| CMP-01 | `threads/` is gitignored (entry exists, scoped to `*/threads/`, not the whole context dir) | unit | `... -t "threads gitignored"` | ✅ | ✅ green |
| CMP-03 | `aggressive\|balanced\|retain-raw` change body verbosity / raw-reaching-shared; promoted note set + carve-out stay dial-invariant | unit | `... -t "dial is body-only, note-set invariant"` | ✅ | ✅ green |
| CMP-03 | Lean default: `context.compaction` absent ⇒ `aggressive` | unit | `... -t "absent dial defaults aggressive"` | ✅ | ✅ green |
| CMP-03 | Re-verify: faithful body compaction re-admits via `admit()`; materially-changed finding refused → degrades to `claim` + `UNKNOWN - verify` (D-12) | integration | `... -t "re-verify faithful admits"` / `... -t "materially-changed degrades to claim"` | ✅ | ✅ green |
| CMP-03 / D-13 | `compactor.js` is byte-fresh vs `compactor.ts` (auto-discovered by freshness set) | build gate | `npm run build && npm run freshness` | ✅ auto | ✅ green (25 committed `.js` fresh) |
| CMP-03 / catalog | WF18 row appears; catalog stays fresh; count test carries WF18 (now 19 workflows after later phases added WF19) | content gate | `npm run generate:catalog && npm run freshness:catalog && npx vitest run scripts/generate-catalog.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Beyond the draft rows** (added by gap-closure plans 22-03 … 22-09, all green in the same
suite): id-keyed asymmetric required-survival matching, raw/promoted id-collision guards,
`NOTE_KINDS` validation, unparseable-file fail-closure, the line-shape × field × kind refusal
matrix (IN-02 parser/validator unification), multi-note `splitNotes` with `<file>#<n>` keying,
boundary-miss and fence-open fail-closure corpora, and the unified writer-order guard
(`composeThreadNote` ↔ `splitNotes`). VERIFICATION.md round 8 additionally records a
35,000-case randomized parseNote-conditioned fuzz with zero silent-absorbs.

---

## Wave 0 Requirements

- [x] `scripts/compactor.test.ts` — covers CMP-01 / CMP-02 / CMP-03 (the carve-out RED cases first) — 185 tests green
- [x] `scripts/compactor.ts` + committed `scripts/compactor.js` — the helper under test (byte-fresh)
- [x] `scripts/generate-catalog.test.ts` edit — workflow count carries `18-context-compaction` (count later moved 18→19 when WF19 landed; test green)
- [x] No framework install needed — `vitest` / `tsc` already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `18-context-compaction.md` is the single-source protocol; every role references it via a one-line pointer and no role restates it | CMP-03 / SC-4 | The anticipated `guard_context_protocol_single_source` / WF18 section-check never shipped (Phase 24's delivered scope was handoff removal; the validator's frozen `WORKFLOWS` list stops at 13). Pointer **presence** is mechanically confirmed (grep: 17/17 roles, 2026-07-21) and WF18's catalog row is pinned by `generate-catalog.test.ts`; only "no role **restates** the protocol" remains reviewer-judged | Confirm WF18 exists, is clear-voice, references WF16 admission rules (not restated); `grep -l "18-context-compaction" agent-factory/roles/*.md \| wc -l` → 17; confirm no role body restates the compaction steps |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s (unit lane: ~6s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-21 (retroactive audit; phase VERIFICATION.md `passed` 8/8, round 8)

---

## Validation Audit 2026-07-21

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 14 draft rows verified green by live runs on this box: `npx vitest run scripts/compactor.test.ts`
(185/185), `npx vitest run scripts/generate-catalog.test.ts` (5/5), `npm run build && npm run freshness`
(exit 0, 25 committed `.js` fresh), full non-e2e regression `npx vitest run --exclude '**/scripts/e2e/**'`
(794 passed, 1 skipped, 30 files). No new tests were needed — the round-3→8 gap-closure plans already
hardened coverage far past the draft contract. The single manual-only row (WF18 single-source discipline)
stays manual by design; its mechanical half (pointer presence, catalog row) is automated.

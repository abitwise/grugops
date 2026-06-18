---
phase: 22-memory-trajectory-compaction-dialable-token-economy
plan: 04
subsystem: compaction-carve-out-oracle
tags: [CMP-02, security-oracle, stable-id, gap-closure, TDD, asymmetric-required-survival]
status: complete
requires:
  - context-io.ts currentState() raw-side supersedes fold (D-03)
  - context-io.ts noteId() <at-compact>-<by>-<kind>-<nonce> scheme
provides:
  - id-keyed exact 1:1 carve-out (frozen id ALONE; no content tuple)
  - frozen id: provenance field on every context note (write + read paths)
  - asymmetric required-survival set (soft-fold + unconditional verified/FA survival)
  - readNoteFields read-path duplicate-key fail-closed reject
affects:
  - scripts/compactor.ts
  - scripts/context-io.ts
  - agent-factory/contracts/context-note.md
tech-stack:
  added: []
  patterns:
    - id-keyed exact-match correspondence (replaces forgeable content-tuple matching)
    - asymmetric required-survival union (currentState fold for soft notes; unconditional add-back for verified findings + failed-attempts)
    - read-path duplicate-key structural reject mirroring write-path parseNote
key-files:
  created: []
  modified:
    - scripts/compactor.ts
    - scripts/compactor.js
    - scripts/compactor.test.ts
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - agent-factory/contracts/context-note.md
decisions:
  - "Identity is the frozen `id` field ALONE — the verifiedKey Set and findCounterpart tuple fallback were DELETED, not patched (the defect was content-tuple matching)."
  - "The required-survival set is ASYMMETRIC: currentState(rawThread) folds out ONLY soft non-verified notes; §14-gate-verified findings (non-empty verified_by) survive the raw-side fold UNCONDITIONALLY; failed-attempts survive via rule 1 (unfolded)."
  - "A promoted-side `supersedes` line NEVER authorizes a drop (required set = raw-side graph only); a weaker raw-side `supersedes` NEVER folds a verified finding out."
  - "readNoteFields enforces its own duplicate-key fail-closed reject on the path the oracle parses, not only context-io's write path."
  - "Strict drop policy: the reversed compactor.ts:190-192 'non-verified MAY be dropped' comment+branch removed; the only sanctioned removal is the raw-side supersedes fold of a soft note (D-03)."
  - "Thread-representation (D-08-consistent): the thread tier stays a single threads/<agent>.md file; writeThread appends an id-bearing structured note fence per recorded note so the compaction step parses it into the per-note raw set."
metrics:
  duration: 18m
  tasks: 4
  files: 7
  completed: 2026-06-18
---

# Phase 22 Plan 04: CMP-02 carve-out stable-id rewrite (gap-closure round 3) Summary

The CMP-02 compaction carve-out is now genuinely un-cheatable: it matches raw→promoted on a frozen per-note `id` ALONE (affirmative existence, fail-closed on missing/duplicate/absent id, byte-equal load-bearing fields), keyed on an ASYMMETRIC required-survival set that folds out only soft non-verified notes while keeping §14-gate-verified findings and failed-attempts unconditionally — closing the CR-01 identity-key collision, the CR-02 fail-open null counterpart, the IN-01 unchecked supersedes, and both round-3 BLOCKERs (forged promoted-side fold; raw-side fold of a verified finding).

## What shipped

- **`scripts/compactor.ts`** — `readNoteFields` gained an `id` scalar AND a read-path duplicate-key fail-closed reject (mirrors parseNote's seen/dupes). `checkCarveOut` rewritten to an id-keyed exact 1:1 match over the asymmetric required-survival set. `findCounterpart` + the `verifiedKey` Set DELETED. `writeThread` emits id-bearing structured note fences. Rule 1 (failed-attempt FA-token) left EXACTLY as is, iterating the full UNFOLDED raw set.
- **`scripts/context-io.ts`** — `composeNote` emits `id:` as the first frontmatter line; `appendNote`/`emitVerdict` compute `noteId()` once, single-line-guard it, and use the SAME id for the field AND the `<id>.md` filename; `readContext` prefers the explicit `id:`. The duplicate-key defense already generalizes to `id`.
- **`agent-factory/contracts/context-note.md`** — `id` row added to the provenance fence (load-bearing, creation-time-frozen) + the worked example shows the `id:` line. Clear professional voice.
- **`scripts/compactor.test.ts` / `scripts/context-io.test.ts`** — 7 held-out RED-first adversarial cases + an id-equals-filename + duplicate-`id:` cases; existing fixtures updated for the new id schema.
- **Both committed `.js`** rebuilt byte-fresh; `npm run freshness` exits 0.

## RED-first evidence (the round-3 discipline: a green suite is necessary but NOT sufficient)

All 7 held-out cases failed against the committed PRE-fix `scripts/compactor.js` (exit 0 / carve-out intact, the bypass reproduced) and now REFUSE (exit 1) against the committed POST-fix `scripts/compactor.js`, naming the right element:

| Case | Pre-fix | Post-fix | Named element (post-fix) |
|------|---------|----------|--------------------------|
| CR-01 (shared §14-gate#RUN-9 stamp, drop one of two distinct-id verified findings) | exit 0 (bypass) | exit 1 | dropped id `id-xss1` |
| CR-02 P7 (non-verified observation, by+at mutated under one id) | exit 0 | exit 1 | `by` altered |
| CR-02 P8 (two observations sharing (kind, at), distinct ids, one by dropped) | exit 0 | exit 1 | `by` dropped |
| IN-01 (non-verified decision with supersedes wholly dropped) | exit 0 | exit 1 | dropped id `id-dec1` |
| FORGED-FOLD (forged promoted-side supersedes against a raw-live note) | exit 0 | exit 1 | dropped id `id-x001` |
| RAW-FOLD-VERIFIED (weaker raw-side supersedes folding a §14-gate-verified finding) | exit 0 | exit 1 | dropped id `id-vx01` + verified_by |
| read-path duplicate `id:` | exit 0 | exit 1 | duplicate key `id` |

RAW-FOLD-VERIFIED is additionally RED-first against a naive `currentState`-folded required-survival set (the kind-blind fold would fold the verified finding out and pass at exit 0) — the test pins the convergent verified-finding-UNCONDITIONAL-survival invariant, not just the pre-fix defect. The strict-id RED baseline was captured at Task 1 (e.g. CR-01 directly exits 0 against the committed pre-fix `compactor.js`); the 22 pre-existing cases stayed GREEN throughout.

## The asymmetric required-survival set (the convergent invariant)

A raw durable note X is REQUIRED in promoted unless ALL hold: (i) X is a SOFT kind with EMPTY `verified_by` (not a failed-attempt), AND (ii) X is folded out raw-side by `currentState(rawThread)` (a raw note S carries `supersedes: X`), AND (iii) S itself survives byte-equal into promoted. Implementation: `required = isVerified || currentState(rawThread).has(X.id)`. Because a superseding survivor S is itself a survivor (hence required), condition (iii) is enforced automatically — a dropped S fails its own existence check.

- **Promoted-side BLOCKER closed (FORGED-FOLD):** the required set is derived SOLELY from the raw-side supersedes graph. A promoted note carrying `supersedes: X` is never consulted, so a forged promoted-side fold cannot authorize dropping a raw-live X.
- **Raw-side BLOCKER closed (RAW-FOLD-VERIFIED / probe (b)):** `currentState` is kind-blind / verified_by-blind, so a weaker raw note S could fold a verified finding X out of the survivor set — but verified findings (non-empty `verified_by`) are added back UNCONDITIONALLY over the unfolded raw set, so X stays required.
- **Rule 1 stays unfolded:** the failed-attempt FA-token check iterates the full `rawThread` (compactor.ts loop at the rule-1 site) — never converted to `currentState`, which would re-open a live FA-erasure hole.

## Read-path guard (the round-3 WARNING closed)

`readNoteFields` now tracks a `seen` set over the frontmatter scalar lines and records a duplicate of any GUARDED provenance key (`id/kind/by/at/verified_by/supersedes`); `checkCarveOut` refuses (exit 1) on any duplicate in a raw OR promoted note. The duplicate-key / id-collision defense therefore runs on the path the oracle actually parses, not only on context-io's write path. A promoted note with two `id:` lines fails closed naming `id`.

## Thread-representation choice (D-08 consistency)

The thread tier stays a SINGLE file `threads/<agent>.md` (D-08); `writeThread` appends an id-bearing structured note fence per recorded note (the `id:` first slot mirrors `composeNote`) when the caller supplies the note's provenance, so the compaction step (Workflow 18 step 3) parses the file into the per-note raw set the carve-out reads, every raw note carrying the same frozen `id:` its promoted counterpart preserves. A free-scratch `writeThread` call (no provenance) still appends the raw body unchanged (the existing two-tier behavior).

## Strict-policy reversal (reconciled with D-03)

The contradictory `compactor.ts:190-192` comment+branch ("a durable note WITHOUT a verified_by stamp MAY be dropped") was removed. Under the strict policy EVERY durable raw note in the required set survives into promoted with intact provenance; the ONLY sanctioned removal is the raw-side `supersedes` fold of a SOFT note (the D-03 `currentState` collapse). Body compression (D-01) is the sole latitude. There was no pre-existing test case encoding the now-reversed "non-verified may be dropped" latitude, so no green test had to be reversed — the suite never asserted that drop was acceptable; the legitimate-soft-fold path is proven exit 0 by the adversarial sweep.

## Adversarial shape-sweep result

- Legitimate soft supersede fold (raw soft A + soft B supersedes A; promoted keeps only B) → exit 0 (the one sanctioned removal).
- Absent `id` on a durable raw note → exit 1 (fail closed).
- Absent `id` on a durable promoted note → exit 1 (fail closed).
- Two promoted notes sharing one explicit `id` → exit 1 (fail closed).
- Read-path duplicate `id:` line → exit 1 (fail closed).
- Forged promoted-side `supersedes` against a raw-live note → exit 1 (FORGED-FOLD).
- Weaker raw-side `supersedes` over a §14-gate-verified finding → exit 1 (RAW-FOLD-VERIFIED).
- Faithful id-bearing set → exit 0.

## Gates

- `npm run freshness` exits 0 — both committed `scripts/compactor.js` and `scripts/context-io.js` are byte-fresh tsc rebuilds (17 committed .js match a fresh rebuild).
- `npx vitest run --exclude '**/scripts/e2e/**'` — 244 passed, 1 skipped (no CMP-01/CMP-03 regression; context-io JSONL key order + index byte-reproducibility intact).
- `npm run freshness:context` + `npm run freshness:catalog` both pass.
- `grep -v '^[[:space:]]*//' scripts/compactor.ts | grep -cE 'findCounterpart|verifiedKey'` is 0.

## Deviations from Plan

None — the plan executed as written (test-first: 7 held-out cases RED-first, then the context-io `id:` field, then the carve-out rewrite, then the byte-fresh rebuild + gates). One in-scope schema adjustment to pre-existing tests was required and is NOT a weakening: existing compactor/context-io fixtures gained `id:` lines (the new schema) and the `promote==appendNote` byte-equality check + the concurrent-writers frontmatter assertion were normalized for the new `id:` slot. The multi-same-kind fixture was given distinct ids per finding so it cleanly tests "by dropped on one of two DISTINCT-id findings" rather than relying on an id collision.

## TDD Gate Compliance

RED → GREEN honored: Task 1 landed the 7 held-out cases proven RED against the committed pre-fix `compactor.js` (`test(22-04)` commit); Tasks 2–3 implemented the fix turning them GREEN (`feat(22-04)` commits); Task 4 is the byte-fresh rebuild + adversarial re-verification gate. No held-out adversarial case was weakened or deleted to make the suite go green.

## Self-Check: PASSED

- SUMMARY.md present at the plan directory.
- Per-task commits present: `e9f2c18` (test), `ec0fb18` (context-io id field), `e92a809` (carve-out rewrite).
- Modified files on disk: scripts/compactor.ts, scripts/compactor.js, scripts/context-io.ts, scripts/context-io.js, scripts/compactor.test.ts, scripts/context-io.test.ts, agent-factory/contracts/context-note.md.

---
phase: 22-memory-trajectory-compaction-dialable-token-economy
verified: 2026-06-18T17:40:00Z
status: gaps_found
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "CR-01 (distinct-id shared-gate-run stamp, drop one of two verified findings) — refuses exit 1 naming the dropped id (reproduced empirically against committed compactor.js)"
    - "CR-02 P7 (non-verified observation, by+at mutated under one matched id) — refuses exit 1 (by/at byte-compared under the id)"
    - "CR-02 P8 (two observations sharing (kind,at), distinct ids, one by dropped) — refuses exit 1 naming by"
    - "IN-01 (non-verified decision with supersedes wholly dropped) — refuses exit 1 naming the dropped id"
    - "FORGED-FOLD (forged promoted-side supersedes against a raw-live note) — refuses exit 1; required set derived from raw-side graph only"
    - "RAW-FOLD-VERIFIED (weaker raw-side supersedes folding a §14-gate-verified finding) — refuses exit 1; verified findings survive the fold unconditionally (probe (b))"
    - "read-path duplicate provenance key (two id: lines in one file) — readNoteFields fails closed exit 1 naming id"
    - "verifiedKey Set + findCounterpart tuple fallback DELETED (grep count 0); strict-policy 'may be dropped' comment removed; context-note.md documents the id field; both committed .js byte-fresh (npm run freshness exit 0)"
  gaps_remaining:
    - "CR-03 (raw-side id collision): two durable RAW notes sharing one forged id are NOT detected — the promoted-side collision guard (promotedById.has, compactor.ts:255) has NO raw-side counterpart. A second distinct §14-gate-verified finding sharing the id is silently dropped at exit 0. This is an explicit 22-04 must-have ('two durable raw notes ... sharing one id -> exit 1 naming the collision') that is unimplemented, and it breaches the CMP-02 safety invariant (a verified finding dropped undetected)."
    - "CR-01-r4 (failed-attempt provenance exemption): the entire kind:failed-attempt path SKIPS the byte-equal provenance check (promotedById `continue` @247, rawDurable `continue` @270 → the field loop @328-346 never runs for FAs). by/at/verified_by/supersedes can be laundered on a failed-attempt at exit 0 as long as the FA-token survives — authorship laundering (author a load-bearing result as kind:failed-attempt carrying a real §14-gate stamp, promote with provenance erased). Found by the parallel deep code review (22-REVIEW.md CR-01) AND independently reproduced by the orchestrator against the committed compactor.js (raw FA by:engineer/verified_by:§14-gate#RUN-1 → promoted FA by:attacker/verified_by:empty, FA-token kept → exit 0). Compounding warnings (see 22-REVIEW.md): WR-01 (FA survival keyed on a forgeable body token, not the frozen id — collision masks a drop), WR-02 (unparseable raw note silently dropped — fail-open within the thread), WR-03 (kind never validated → durable→FA relabel routes a load-bearing note onto the unchecked FA path), WR-04 (suite blind: no FA fixture mutates a provenance field)."
  regressions: []
gaps:
  - truth: "CMP-02 / SC2 — the carve-out fails closed on a duplicate identity: two durable raw notes (or two promoted notes) sharing one `id` → exit 1 naming the collision. The carve-out must be un-cheatable: no §14-gate-verified finding may be silently dropped."
    status: failed
    reason: >-
      The id-keyed rewrite guards the PROMOTED side against an id collision (compactor.ts:255,
      `if (promotedById.has(fields.id))`) but adds NO raw-side collision guard. Two durable RAW
      notes carrying the same forged `id` both look up the single promoted note, both pass the
      byte-equal check (id/kind/by/at/verified_by/supersedes are identical; only the body — which is
      NOT load-bearing-checked — differs), and the drop of the second note is invisible. Reproduced
      empirically THIS verification against the COMMITTED scripts/compactor.js: two distinct
      §14-gate-verified findings (an SQL finding and an XSS finding) share one forged
      `id: 20260617T142305Z-engineer-finding-dup`; promoted keeps only the SQL finding; the verified
      XSS finding is dropped → `carve-out intact` / exit 0. The IDENTICAL collision on the PROMOTED
      side correctly refuses (exit 1) — the defect is the missing raw-side mirror. This is an explicit
      22-04 must-have (frontmatter truth: "two durable raw notes (or two promoted notes) sharing one
      `id` → exit 1 naming the collision") that is unimplemented. The 22-test held-out suite is fully
      GREEN but every CR-01 case uses DISTINCT ids ("two distinct-id verified findings") — it never
      feeds two raw notes sharing one id, so green is necessary but NOT sufficient (the round-3 lesson
      recurs in a new shape).
    artifacts:
      - path: "scripts/compactor.ts:244-263"
        issue: >-
          `promotedById` is built with a `promotedById.has(fields.id)` collision guard (line 255)
          that fails closed on a duplicate PROMOTED id. The raw durable set (`rawDurable`, lines
          268-272) and `rawRecords` (273-283) are built with NO equivalent collision detection.
      - path: "scripts/compactor.ts:292-347"
        issue: >-
          The required-survival loop iterates `rawDurable`; two raw notes sharing one id each call
          `promotedById.get(fields.id)`, both resolve to the same promoted note, both pass byte-equal
          (the only differing field is `body`, which is not in the byte-equal list at line 328). The
          second raw note's drop is never surfaced.
      - path: "scripts/compactor.test.ts:425-461"
        issue: >-
          The CR-01 held-out case (and every other id-keyed case) uses DISTINCT ids per finding
          ("two distinct-id verified findings", lines 434/442). No test feeds two raw notes sharing
          one id. The suite pins exactly the shapes the oracle already handles; the raw-collision
          shape that drops a verified finding is absent — 22/22 (id-keyed) GREEN over a still-reachable
          drop of a verified finding.
    missing:
      - >-
        Mirror the promoted-side collision guard on the raw side. While building `rawDurable` /
        `rawRecords`, track a `seen` set of raw durable ids and, on a repeat, push a fail-closed
        finding ("two durable raw notes share the id <id> — a colliding identity cannot be matched
        1:1; fail closed") exactly as compactor.ts:255-261 does for the promoted side. This satisfies
        the existing 22-04 must-have verbatim.
      - >-
        Add a held-out RED-first test: TWO distinct §14-gate-verified raw findings (different bodies,
        e.g. SQL + XSS) sharing one forged `id`; promoted keeps only the first → must refuse (exit 1)
        naming the colliding id. Repro that exits 0 today: raw {sql.md,xss.md} both
        `id: 20260617T142305Z-engineer-finding-dup`, `verified_by: §14-gate#RUN-7`, `by: engineer`;
        promoted {sql.md} only.
  - truth: "CMP-02 — load-bearing provenance (by / at / verified_by / supersedes) is INTACT on EVERY promoted note, INCLUDING kind:failed-attempt. A dropped/altered field → exit 1 naming the field (compactor.ts docstring lines 17-19; 22-04 prohibition: 'MUST NOT pass (exit 0) when a load-bearing field ... or a durable note is dropped or altered')."
    status: failed
    reason: >-
      [Found by the parallel DEEP code review — 22-REVIEW.md CR-01 — and INDEPENDENTLY reproduced by
      the orchestrator against the COMMITTED scripts/compactor.js, alongside the CR-03 finding above.]
      The entire kind:failed-attempt path SKIPS the byte-equal provenance check. Both `promotedById`
      (compactor.ts:247) and `rawDurable` (compactor.ts:270) `continue` on `kind === "failed-attempt"`,
      so the field-equality loop (328-346) NEVER runs for a failed-attempt — the ONLY thing checked is
      rule-1 FA-token survival. by / at / verified_by / supersedes can therefore be dropped or laundered
      to anything on a failed-attempt and the oracle reports "carve-out intact" / exit 0. Because the
      raw thread is the agent's own un-validated scratch (appendNote's validator never runs on it), a
      load-bearing result can be authored as kind:failed-attempt carrying a real `verified_by:
      §14-gate#<id>` stamp + a supersedes link, then promoted with all provenance erased — authorship
      laundering. Reproduced THIS verification: raw FA {by: engineer, verified_by: §14-gate#RUN-1} →
      promoted FA {by: attacker, verified_by: empty}, FA-token kept → exit 0. Directly contradicts
      compactor.ts's own docstring (17-19, "INTACT on every promoted note") and the 22-04 prohibition.
      The held-out suite is blind to it (WR-04): every FA fixture holds verified_by:"" and identical
      by/at across raw→promoted — the round-3 'green ≠ proof' trap recurring on the FA path.
    artifacts:
      - path: "scripts/compactor.ts:247,270,328-346"
        issue: >-
          `promotedById` (247) and `rawDurable` (270) both `continue` on kind === "failed-attempt"; the
          byte-equal field loop (328-346) never compares a failed-attempt's by / at / verified_by /
          supersedes. FA notes are exempted from the exact check that protects every durable note —
          yet FAs are MORE load-bearing (unconditionally required to survive).
      - path: "scripts/compactor.ts:162-211 (WR-01 — compounds CR-01)"
        issue: >-
          FA survival is keyed on a forgeable FA-<token> read from the compressible (NOT
          byte-equal-checked) body, deduped into a Set — not on the frozen id. Two distinct dead-ends
          sharing one FA-token collapse to one Set entry; promoting one drops the other at exit 0.
      - path: "scripts/compactor.ts:111-151 (WR-02 / WR-03 — adjacent fail-open seams)"
        issue: >-
          WR-02: an unparseable raw .md (readNoteFields → null) is silently dropped by readNoteDir —
          fail-open WITHIN the thread, inconsistent with the missing-thread fail-closed at 499-505.
          WR-03: kind is never validated against the six contract kinds, so a durable→failed-attempt
          relabel on the raw side routes a load-bearing note onto the unchecked FA path.
      - path: "scripts/compactor.test.ts (WR-04)"
        issue: >-
          No held-out case mutates by / at / verified_by / supersedes on a failed-attempt; every FA
          fixture keeps verified_by:"" and identical by/at. The green suite cannot observe CR-01.
    missing:
      - >-
        Do NOT exempt failed-attempts from the byte-equal provenance check. Index promoted
        failed-attempts by their frozen id and run the SAME field-equality loop used for durable notes
        (id/kind/by/at/verified_by/supersedes byte-equal); fail closed on a missing/empty/colliding FA
        id. Key FA survival on the frozen id, NOT the body FA-token (WR-01) — keep the token for the
        message only. Validate kind ∈ the six contract kinds, fail closed on unknown/empty kind (WR-03).
        Fail closed on an unparseable raw/promoted .md in readNoteDir (WR-02).
      - >-
        Add held-out RED-first cases mutating EACH load-bearing field on a failed-attempt (drops by →
        refuse naming by; drops verified_by on a verified FA → refuse; full by/at/verified_by/supersedes
        laundering with FA-token kept → refuse), plus two-distinct-ids-sharing-one-FA-token drop. RED
        against the committed pre-fix .js, GREEN only after the fix. Repro that exits 0 today: raw FA
        {id idFA, by engineer, verified_by §14-gate#RUN-1} → promoted FA {id idFA, by attacker,
        verified_by empty}, FA-token preserved.
---

# Phase 22: Memory & Trajectory Compaction Verification Report

**Phase Goal:** Bound the multi-agent token tax with two-tier memory — verbose local trajectory stays in the agent's thread; only compact, re-verified distillations promote to the shared context — landed before parallel fan-out makes the cost real. The load-bearing-field carve-out (CMP-02) is the safety invariant of this phase.
**Verified:** 2026-06-18T17:40:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap-closure plan 22-04 (the stable-id rewrite, CMP-02 / SC2)

## Goal Achievement

### Observable Truths

| #   | Truth (Success Criterion)                                                                                                                              | Status     | Evidence                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | (CMP-01) Verbose trajectory stays in `threads/<agent>.md`; only a compact, re-verified distillation reaches shared context.                            | ✓ VERIFIED | `.gitignore:12` scopes `**/.grugops/context/*/threads/` (no blanket ignore). `writeThread`/`promote`/`reVerify` two tiers; promote routes only through `appendNote`. Untouched by 22-04 logic; regression clean. Suite green.                              |
| 2   | (CMP-02) The carve-out never drops a load-bearing field and fails closed on a duplicate/missing identity; un-cheatable — no verified finding lost.     | ✗ FAILED   | The id-keyed rewrite closes CR-01/CR-02/IN-01 + both round-3 BLOCKERs (all reproduced refusing exit 1). BUT a **raw-side id collision (CR-03)** is unguarded: two raw notes sharing one forged id drop a distinct verified finding at **exit 0**. See gaps. |
| 3   | (CMP-03) The `context.compaction` dial works, defaults to `aggressive`, documented across all 3 surfaces.                                              | ✓ VERIFIED | `readCompactionDial('/tmp/does-not-exist')` → `aggressive` (live check). Dial-invariance + default-on-absent tests green. Untouched by 22-04.                                                                                                              |
| 4   | (CMP-03) A role following Workflow 18 compacts by the single-source protocol; other roles reference it.                                                | ✓ VERIFIED | Workflow 18 is the declared single source; 10+ roles reference it; it hands the proposed set to the compactor and honors refusal. Untouched by 22-04.                                                                                                       |

**Score:** 3/4 truths verified (0 present, behavior-unverified). CMP-02 FAILED — a residual raw-side id-collision bypass drops a §14-gate-verified finding at exit 0.

### Required Artifacts

| Artifact                    | Expected                                                  | Status            | Details                                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/compactor.ts`      | id-keyed exact-match carve-out, fail-closed on collision  | ⚠️ STUB-OF-INTENT | id-keyed match + asymmetric required-survival set + byte-equal fields all implemented and substantive. `findCounterpart`/`verifiedKey` deleted (grep 0). BUT raw-side id-collision guard MISSING — the promoted-side guard (line 255) has no raw mirror. Bypassable. |
| `scripts/compactor.js`      | byte-fresh tsc rebuild                                     | ✓ VERIFIED        | `npm run freshness` exits 0 (17 committed .js match a fresh rebuild). The audited .ts is what runs.                                                                                  |
| `scripts/context-io.ts`     | explicit frozen `id:` field (compose/parse/guard)         | ✓ VERIFIED        | `composeNote` emits `id:` first (line 360); `appendNote` computes `noteId()` once, single-line-guards it (404), uses it for field + filename. Duplicate-key defense generalizes.    |
| `scripts/context-io.js`     | byte-fresh tsc rebuild                                     | ✓ VERIFIED        | Covered by `npm run freshness` exit 0.                                                                                                                                              |
| `scripts/compactor.test.ts` | 7 held-out RED-first adversarial cases, genuine           | ⚠️ INSUFFICIENT   | The 7 cases assert the correct named element (exact dropped id / `verified_by` / `by` / `supersedes` / duplicate `id`) — genuine, not tautological. BUT every CR-01 case uses DISTINCT ids; the raw-collision shape (CR-03) is unexercised. Green-but-insufficient. |
| `agent-factory/contracts/context-note.md` | `id` row in provenance fence                | ✓ VERIFIED        | Row present at line 76 (clear professional voice, load-bearing, frozen at write).                                                                                                  |

### Key Link Verification

| From                    | To                      | Via                                                          | Status  | Details                                                                                       |
| ----------------------- | ----------------------- | ------------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------- |
| `scripts/compactor.ts`  | `scripts/context-io.ts` | imports `currentState`/`appendNote`/`NoteRecord`; reuses the raw-side supersedes fold | ✓ WIRED | compactor.ts:54-60 imports; `currentState(rawRecords)` (line 284) reuses the D-03 fold byte-for-byte. |
| frozen note `id`        | carve-out match         | the `id:` field is the SOLE raw→promoted match key            | ✓ WIRED | `promotedById` keyed on `id` (245-262); required loop matches on `id` ALONE (307). No content tuple used. |
| `scripts/compactor.js`  | `scripts/freshness.ts`  | rebuilt .js rejoins the drift gate                           | ✓ WIRED | freshness exit 0; both .js byte-fresh.                                                         |

### Behavioral Spot-Checks (my own adversarial fixtures against the COMMITTED compactor.js)

| Behavior                                                                              | Result                                | Status        |
| ------------------------------------------------------------------------------------- | ------------------------------------- | ------------- |
| Faithful body-only compaction (verified finding kept, body shortened)                 | exit 0 — accepted                     | ✓ PASS        |
| Verified finding wholly dropped (provenance drop)                                     | exit 1 — refused                      | ✓ PASS        |
| Self-supersede on a VERIFIED finding → drop                                            | exit 1 — refused (unconditional add-back) | ✓ PASS    |
| Self-supersede on a FAILED-ATTEMPT → drop                                              | exit 1 — refused (rule 1 unfolded)    | ✓ PASS        |
| Launder: weaker raw note supersedes a verified finding; drop it                        | exit 1 — refused                      | ✓ PASS        |
| FORGED-FOLD: forged promoted-side supersedes against a raw-live note                   | exit 1 — refused                      | ✓ PASS        |
| Legitimate soft fold (S supersedes A; promote keeps S only)                            | exit 0 — accepted                     | ✓ PASS        |
| Drop a soft note with NO superseder                                                    | exit 1 — refused (strict policy)      | ✓ PASS        |
| Alter a genuine supersedes link on a matched note (blank it)                           | exit 1 — refused                      | ✓ PASS        |
| Rename a verified finding's id on promotion                                            | exit 1 — refused                      | ✓ PASS        |
| Raw note duplicate `verified_by` line (same file)                                      | exit 1 — refused (readNoteFields)     | ✓ PASS        |
| **Raw-side id collision: two distinct verified findings share one forged id; drop one** | **exit 0 — "carve-out intact"**       | **✗ FAIL (BYPASS — CR-03)** |
| Same collision on the PROMOTED side                                                    | exit 1 — refused (asymmetry proof)    | ✓ PASS (guarded) |

### Probe Execution

| Probe                         | Command                                                          | Result               | Status |
| ----------------------------- | --------------------------------------------------------------- | -------------------- | ------ |
| freshness drift gate          | `npm run freshness`                                             | exit 0 (17 .js fresh) | ✓ PASS |
| compactor + context-io unit   | `npx vitest run scripts/compactor.test.ts scripts/context-io.test.ts` | 60 passed       | ✓ PASS |
| full non-e2e regression       | `npx vitest run --exclude '**/scripts/e2e/**'`                  | 244 passed, 1 skipped | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan                | Description                                                  | Status      | Evidence                                                                                          |
| ----------- | -------------------------- | ----------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| CMP-01      | 22-01                      | Two-tier compaction (thread tier / shared context)           | ✓ SATISFIED | Truth 1; gitignore + writeThread/promote + sole-writer. Untouched by 22-04, regression clean.     |
| CMP-02      | 22-01, 22-03, 22-04 (gaps) | Load-bearing-field carve-out; un-cheatable                   | ✗ BLOCKED   | Truth 2 FAILED; CR-03 raw-side id collision drops a verified finding at exit 0. REQUIREMENTS.md:119 already marks CMP-02 "In Progress". |
| CMP-03      | 22-02                      | Dial (default aggressive), re-verify, Workflow 18 single-source | ✓ SATISFIED | Truths 3 & 4; dial default live-checked; Workflow 18 single-source. Untouched by 22-04.            |

All three phase requirement IDs (CMP-01, CMP-02, CMP-03) are accounted for across every 22-*-PLAN.md frontmatter. No orphaned requirements.

### Anti-Patterns Found

| File                   | Line     | Pattern                                                                | Severity   | Impact                                                                                                                          |
| ---------------------- | -------- | --------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `scripts/compactor.ts` | 244-263  | Asymmetric collision guard: promoted side `.has()`-guarded; raw side has no equivalent | 🛑 BLOCKER | A raw-side id collision (two raw notes, one forged id) drops a distinct §14-gate-verified finding at exit 0 — the CMP-02 safety invariant breached. |
| `scripts/compactor.ts` | 328      | Byte-equal field list omits `body`                                    | ℹ️ INFO    | Intended (D-01 body compression is the sanctioned latitude). Noted because it is what makes two same-id raw notes byte-equal despite different findings — the mechanism CR-03 rides. |
| `scripts/compactor.test.ts` | 425-672 | All id-keyed held-out cases use DISTINCT ids                       | ⚠️ WARNING | False-confidence: the suite never feeds two raw notes sharing one id, so 22/22 green over a still-reachable verified-finding drop (the round-3 lesson recurs). |

No unreferenced debt markers (TBD/FIXME/XXX) found in the modified files.

### Human Verification Required

None. The CR-03 gap is mechanically reproduced (exit 0 on the committed `scripts/compactor.js` via the `check` verb) — no human judgment needed to confirm the failure. The closure of CR-01/CR-02/IN-01/FORGED-FOLD/RAW-FOLD-VERIFIED was likewise confirmed mechanically (exit 1 on independent fixtures).

### Gaps Summary

Gap-closure 22-04 (the stable-id rewrite) is a **large, genuine, and substantially correct** advance over 22-03. The forgeable content-tuple matching (`verifiedKey` Set + `findCounterpart`) is deleted, not patched (grep count 0). The carve-out now matches raw→promoted on a frozen per-note `id` ALONE, with an asymmetric required-survival set, byte-equal load-bearing fields, and a read-path duplicate-key reject. I independently reproduced — against the COMMITTED `scripts/compactor.js`, not by trusting the SUMMARY — that **all** of the round-1/2/3 bypasses now refuse (exit 1):

- CR-01 (distinct-id shared-stamp drop), CR-02 P7/P8 (mutated by/at under a matched id), IN-01 (dropped supersedes), FORGED-FOLD (forged promoted-side supersedes), and RAW-FOLD-VERIFIED (weaker raw-side supersedes folding a verified finding) — all exit 1.
- §14-gate-verified findings and failed-attempts survive a self-supersede / laundering fold UNCONDITIONALLY.
- A legitimate body-only compaction and a legitimate soft supersedes fold still pass (exit 0).
- Both committed `.js` are byte-fresh (`npm run freshness` exit 0); the full non-e2e suite is GREEN (244 passed).

**But the carve-out is STILL bypassable by ONE residual shape (CR-03):** the rewrite guards the
PROMOTED set against an id collision (`promotedById.has`, compactor.ts:255) but adds **no raw-side
collision guard**. Two durable RAW notes carrying the same forged `id` both resolve to the single
promoted counterpart, both pass byte-equal (only `body` differs, and body is the sanctioned
compression latitude — not checked), and the drop of the second is invisible. Empirically, two
distinct §14-gate-verified findings (an SQL finding + an XSS finding) sharing one forged
`id: 20260617T142305Z-engineer-finding-dup`, promoted keeping only the SQL finding, returns
`carve-out intact` / exit 0 — the verified XSS finding is silently dropped. The identical collision
on the promoted side correctly refuses, so the fix is small (mirror the existing guard on the raw
side) — but it is unimplemented.

This breaches the CMP-02 safety invariant (a §14-gate-verified finding dropped undetected) and an
**explicit 22-04 must-have** (frontmatter truth + prohibition: "two durable raw notes (or two
promoted notes) sharing one `id` → exit 1 naming the collision"). It is the round-3 lesson recurring
in a new shape: the held-out suite pins DISTINCT-id shapes and is 22/22 green, yet a raw-id-collision
drop of a verified finding remains reachable — a green suite is necessary but NOT sufficient for this
safety invariant.

CMP-01 and CMP-03 are untouched by 22-04 and confirmed to still hold (regression clean).

Status: **gaps_found**. Route to `/gsd-plan-phase 22 --gaps` — the raw-side collision guard (mirror
compactor.ts:255-261) plus a held-out RED-first test (two distinct verified findings sharing one
forged id, drop one → exit 1) are specified with file:line and a one-line repro in the frontmatter.

---

## Orchestrator Reconciliation — a SECOND independent BLOCKER (CR-01)

This verifier ran in parallel with a deep security code review (`22-REVIEW.md`). The two were blind to
each other; each surfaced a *different* residual CMP-02 bypass. The orchestrator independently
reproduced **both** against the committed `scripts/compactor.js` (`check` verb, exit 0) before recording
them. Both fail the SAME Truth 2 (CMP-02), so the truth score stays 3/4 — but **round 4 must close BOTH**,
or the cycle simply moves to whichever was left open:

- **CR-03** (this report): no raw-side id-collision guard → two raw notes sharing a forged id, one
  (verified) dropped, invisible at exit 0. Reproduced: SQL+XSS findings sharing one id, promote SQL only.
- **CR-01** (`22-REVIEW.md`, merged into the `gaps:` block above): the `kind:failed-attempt` path skips
  the byte-equal provenance check entirely (`continue` @247 and @270) → `by`/`at`/`verified_by`/
  `supersedes` launderable on a failed-attempt at exit 0. Reproduced: raw FA `by:engineer,
  verified_by:§14-gate#RUN-1` → promoted FA `by:attacker, verified_by:empty`, FA-token kept → exit 0.
  Supporting warnings WR-01/02/03 (forgeable FA token; fail-open on an unparseable raw note; unvalidated
  `kind` enabling a durable→FA relabel) compound it and should be closed in the same round.

Both are the round-3 lesson recurring in new shapes: the held-out suite is fully green yet two distinct
verified-finding-drop paths remain reachable. Both gaps are reproduced mechanically — no human judgment
needed to confirm the failures. **Do not mark CMP-02 or Phase 22 complete.** The full residual surface
lives in the `gaps:` frontmatter above (CR-03 + CR-01) and in `22-REVIEW.md` (CR-01 + WR-01..WR-04).

---

_Verified: 2026-06-18T17:40:00Z · reconciled with 22-REVIEW.md by the execute-phase orchestrator_
_Verifier: Claude (gsd-verifier)_

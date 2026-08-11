---
phase: 27-spawn-correctness-kit-set-authority
verified: 2026-08-09T22:00:00Z
status: gaps_found
score: 6/10 requirements verified clean (4 FAILED or structurally-undermined — KIT-03, SPAWN-03, SPAWN-04 each carrying a live independently-reproduced spawn-grant bypass at the gate, plus SPAWN-02 wrongly marked incomplete in REQUIREMENTS.md despite passing evidence)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 6/10 (round 8, 2026-08-09T16:30:00Z)
  gaps_closed:
    - "All 11 round-8 findings (27-REVIEW-GAPS-8.md CR-01, CR-02, WR-01..WR-05, IN-01..IN-04) — CLOSED by plans 27-47..27-50, each with a RED/GREEN transcript, a derived corpus, or a fired planted-defect probe. Verified directly: family A/B/C/F node-start shapes now refuse (27-47); the closure's invented/truncated-name defect (nodeOnKeyLine) is fixed (27-48); the D-52 expressibility floor and per-rule exemption bound are corrected (27-49); the leading-residue refusal names the offending byte, the double-claim arm's domain widened, and a vacuous purity assertion + a fixture that never checked its own premise are both fixed (27-50)."
    - "Two of the round-8 human_verification items are now RESOLVED as recorded decisions (not silently dropped): the 27-43 validator acceptance criterion is explicitly RETIRED (measured 0/15-term spawn vocabulary in validate-agent-factory.ts, file untouched), and SPAWN-03's live-platform capture is explicitly DEFERRED to Phase 33 / GAP-D1 / CAP-01, recorded with owner and reason in deferred-items.md rather than left open with no disposition."
  gaps_remaining:
    - "KIT-03 / SPAWN-04 — STILL FAILED, and NOT by the same defect round 8 named. Round 9's own code review (27-REVIEW.md, committed e802776) found and this orchestrator independently confirmed by reading the committed scripts/frontmatter.ts (lines 720-724, the `else if (c === \"'\" && !dq)` arm) a NEW confirmed critical: CR-01. `stripComment` treats YAML's `''` escape inside an open single-quoted scalar as close-then-reopen rather than as content, destroying the scalar's node-start provenance. A planted `tools: 'Read'' s,` / `  # x, Agent(grugops-orchestrator)'` grant is libyaml-ACCEPTED with the grant live in the loaded value, while `hasSpawnGrant()` returns `{ok:true,value:false}` — a silent no-grant on the SUCCESS arm. Reproduced end-to-end on hermetic mirrors of the committed tree: planted on both distribution twins of the non-coordinator `plan` skill, the foundation gate reports `ALL CHECKS PASSED` at exit 0 (control, one line, no `''`: exit 1). `npx vitest run scripts/frontmatter.test.ts` is 193/193 green over the plant — the ninth consecutive round in which a green suite did not detect a live silent-no-grant bypass."
    - "KIT-03 / SPAWN-04 — a SECOND, independently-tracked live bypass (Family G / G2, nested block-scalar headers under a mapping key or a sequence item) remains explicitly OPEN in deferred-items.md, re-measured byte-identical by four consecutive plans (27-47, 27-48, 27-49, 27-50) against the committed scripts/frontmatter.js. `BLOCK_INDICATOR` is still recognised at exactly one of the places YAML allows a block-scalar header (flattenBlock's top-level key line), so a nested `|`/`>` header's literal content still reaches stripComment, where a leading `#` hides a live Agent(grugops-orchestrator) grant on the SUCCESS arm. Reproduced end-to-end at the gate on the post-round-9 build."
    - "SPAWN-03 — UNKNOWN - verify against the real Claude Code platform remains open. Round 9 makes this an explicit, owned, dated DECISION (deferred to Phase 33 / GAP-D1 / CAP-01, ROADMAP.md:431) rather than a silently-stale item, but the underlying claim is still unconfirmed."
    - "REQUIREMENTS.md traceability is factually wrong for three requirement IDs, and round 9's own plan (27-50) surfaced this without correcting it: KIT-03 and SPAWN-04 are marked `[x]` / 'Complete' while both are FAILED per this and the prior verification round; SPAWN-02 is marked `[ ]` / 'Gaps Found' while its artifact (adapters-freshness.ts) is genuinely fail-closed and VERIFIED. This is a verification-record correction, not an executor's call, and 27-50-SUMMARY.md explicitly declined to run requirements.mark-complete for exactly this reason."
  regressions: []
gaps:
  - truth: "The referential-integrity oracle's set equality (coordinator grant == adapter directory == role corpus) is sound because a name is never silently dropped or altered when computing the grant closure. (KIT-03)"
    status: failed
    reason: >
      guard_referential_integrity (KIT-03) computes its grant-closure set through the same
      scripts/frontmatter.ts path guard_wr05 consumes (check-foundation-guards.ts states this
      explicitly). That module is confirmed, by direct code reading this session and by the
      round-9 code review, to still be non-total over YAML's own grammar in TWO independently
      tracked ways: (1) CR-01 — the `''` single-quote-escape defect, confirmed present at
      scripts/frontmatter.ts:720-724 in the committed tree at HEAD (e802776); (2) Family G/G2 —
      the nested block-scalar-header defect, re-measured OPEN by four consecutive round-9 plans.
      Both defects reach the SAME closure-computation code path KIT-03's soundness claim depends
      on. On today's ACTUAL committed adapter/role files the closure computes correctly (the real
      grant text is single-line, unaffected by either defect), so guard_referential_integrity
      genuinely PASSES this session ("PASS KIT-03: 17 roles == 17 adapters == 17 grant-closure
      names (D-09, no exception list)" — confirmed by direct execution). The failure is in the
      SOUNDNESS CLAIM the oracle makes about itself, not in today's committed text — but that
      claim is the whole basis Success Criterion 2 asks to be trusted, and it remains
      demonstrably false for a future multi-line or single-quoted grant edit.
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "stripComment's single-quote arm (lines 720-724) re-derives openedAtNodeStart on the reopen half of a `''` escape pair, destroying provenance for a scalar that genuinely opened at a node start; separately, BLOCK_INDICATOR is recognised at only the top-level key-line position, so a nested block-scalar header's content is never routed to block-scalar handling."
    missing:
      - "CR-01's proposed structural fix: treat `''` inside an open single-quoted scalar as content (mirroring the existing double-quote escape skip and the pre-existing unquoteChecked `.replace(/''/g, \"'\")` behavior), not as close-then-reopen."
      - "Family G/G2's fix: give BLOCK_INDICATOR (or an equivalent) real recognition at every YAML node-start position, not only the top-level key line — the review's own W-01 finding states the D-52 loader differential's generated corpus cannot even express this shape, so a corpus fix must land alongside it."
      - "WR-01 (round 9's own review): the loader differential's corpus opens a single-quoted scalar mid-line zero times and never emits `''` on any axis, so it prints a completeness claim over inputs it never generated. A quoteStyle axis + an escapeInScalar axis must be added before the differential can be trusted to catch a recurrence of this class."
  - truth: "On Claude Code the coordinator's Agent(<allowlist>) grant is honored by the runtime, and no non-coordinator adapter carries the Agent tool at all — a mechanism that holds on both the main-thread and subagent paths. (SPAWN-03, SPAWN-04)"
    status: failed
    reason: >
      SPAWN-04's static mechanism (no Agent token in any non-coordinator adapter body) is
      undermined by the same two live parser bypasses as KIT-03: CR-01 (confirmed present in the
      committed scripts/frontmatter.ts at HEAD) and Family G/G2 (confirmed OPEN, re-measured four
      times against the committed build). Both were reproduced end-to-end this phase: a live
      Agent(grugops-orchestrator) grant, hidden in either shape, planted into both distribution
      twins of the non-coordinator `plan` skill, reaches the loaded document (confirmed via
      /usr/bin/ruby -ryaml) while `node scripts/check-foundation-guards.js` reports
      `ALL CHECKS PASSED` at exit 0 — the one-line control correctly exits 1. This is the ninth
      consecutive gap-closure round in which this class of bypass survived a green suite
      (1266 passed / 2 skipped, confirmed run this session). SPAWN-03's main-thread
      runtime-honoring claim itself remains `UNKNOWN - verify` against the real platform —
      explicitly deferred to Phase 33 / GAP-D1 / CAP-01 (ROADMAP.md:431), not fabricated, but not
      resolved either.
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "Two independently-confirmed live silent-no-grant bypasses (CR-01, Family G/G2) both reach a SUCCESS arm at the gate over a real Agent(grugops-orchestrator) grant on a non-coordinator surface."
    missing:
      - "Same as KIT-03's missing items above — CR-01's fix and Family G/G2's fix are both structural changes to scripts/frontmatter.ts, not enumerated-shape patches."
      - "SPAWN-03's live capture (deferred to Phase 33, tracked as CAP-01/GAP-D1, not a phase-27 gap but not yet satisfied)."
  - truth: "REQUIREMENTS.md accurately reflects requirement completion status."
    status: failed
    reason: >
      KIT-03 and SPAWN-04 are marked `[x]` and 'Complete' in REQUIREMENTS.md while both are
      FAILED per this verification (and per the round-8 verification before it) — an over-claim.
      SPAWN-02 is marked `[ ]` and 'Gaps Found' while its artifact (adapters-freshness.ts) is
      genuinely fail-closed and VERIFIED both this round and last — an under-claim. Plan 27-50
      surfaced this discrepancy explicitly in its own SUMMARY and deliberately declined to run
      requirements.mark-complete rather than compound it, but did not correct REQUIREMENTS.md
      itself (correctly, since a verification-record correction is not an executor's call to make
      mid-plan).
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "Lines 56-58, 62-65: KIT-03 and SPAWN-04 checkbox/table state contradicts this and the prior verification's FAILED findings for the same requirements; SPAWN-02 checkbox/table state contradicts VERIFIED findings for the same requirement."
    missing:
      - "Correct KIT-03 and SPAWN-04 to unchecked / 'Gaps Found' until the underlying bypasses (CR-01, Family G/G2) close."
      - "Correct SPAWN-02 to checked / 'Complete' — its artifact (adapters-freshness.ts) has passed both round-8 and round-9 verification with live fail-closed evidence."
deferred:
  - truth: "SPAWN-03's real-platform confirmation that the main-thread coordinator's Agent(<allowlist>) grant is actually honored by Claude Code at runtime (as opposed to being confirmed only by reading the platform's own published sub-agent documentation)."
    addressed_in: "Phase 33"
    evidence: "ROADMAP.md Phase 33: 'Live Capture & Windows Portability — the captured live run that proves spawning and discharges GAP-D1'; the standing-obligations table (# 1, GAP-D1) explicitly assigns 'one captured live dual-path run' to Phase 33 (CAP-01). Round 9 (plan 27-50) explicitly ratified this deferral as a recorded decision (D-56 item 10) rather than leaving it an open, undated human-verification item."
human_verification:
  - test: "Start a real Claude Code session with `claude --agent grugops-orchestrator` (or the equivalent main-thread wiring) on this repository and observe whether the Orchestrator's Agent(<allowlist>) grant is actually runtime-enforced — i.e., that it can spawn a role subagent and that a role subagent cannot spawn a further subagent."
    expected: "The coordinator, running as the main-thread agent, successfully invokes the Agent tool to delegate to a named role subagent; a role subagent invoked this way has no Agent tool available to it."
    why_human: "This is a live-platform runtime behavior claim that no static grep or gate can confirm. The phase's own SUMMARYs mark it UNKNOWN - verify and, as of round 9, this is an explicitly recorded decision (not an open oversight) deferring the capture to Phase 33 / GAP-D1 / CAP-01."
---

# Phase 27: Spawn Correctness & Kit-Set Authority Verification Report

**Phase Goal:** Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Verified:** 2026-08-09T22:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — after round-9 gap closure (27-47…27-50), replacing the stale round-8 record.

## Goal Achievement

### Observable Truths (by roadmap Success Criterion)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every scan set (`WR05_SCAN`→`SPAWN_GRANT_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`→`WORKFLOW_FILES`, validator role/workflow lists) resolves through `kit-model.ts` with an asserted count; no stale literal survives. (KIT-01, KIT-02) | ✓ VERIFIED | Confirmed by direct execution this session: `node scripts/check-foundation-guards.js` → `PASS kit counts: derived 17 roles, 19 workflows, 7 skill adapters and 7 plugin-form skill adapters (expected 17 / 19 / 7 / 7); the spawn-grant scan composition holds exactly 33 members (agent 17 + skill 7 + plugin-skill 7 + packaging 2)...`. Unchanged from round 8; round 9 touched `kit-model.ts` only for a foreign-key double-claim fix (IN-02), proven behavior-preserving via a byte-identical gate output hash before/after (`2e79d7...` matches in 27-50-SUMMARY.md). |
| 2 | The referential-integrity oracle fails RED against a broken tree and turns GREEN only when the three sets (coordinator grant, adapter directory, role corpus) are truly the same set. (KIT-03) | ✗ FAILED (soundness undermined, not today's tree) | `guard_referential_integrity` genuinely PASSES today (confirmed: `PASS KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)`), and today's committed grant text is single-line, unaffected by either known live defect. But the oracle computes its closure through the same `scripts/frontmatter.ts` path that is confirmed (this session, by direct code reading + round-9's own review) to carry TWO live silent-no-grant bypasses over that same closure computation: CR-01 (the `''` escape defect, confirmed present at `frontmatter.ts:720-724` in the committed HEAD e802776) and Family G/G2 (nested block-scalar headers, re-measured OPEN four consecutive plans running). See Gaps. |
| 3 | All 17 role adapters exist, are generated thin pointers (not copies), and a byte difference between a committed adapter and a fresh regeneration fails the freshness gate closed. (SPAWN-01, SPAWN-02) | ✓ VERIFIED | `ls .claude/agents/*.md` = 17 files. `node scripts/adapters-freshness.js` run this session: exit 0, `Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.` Unchanged from round 8's live fail-closed spot-check (append one byte → STALE detected → revert → clean). REQUIREMENTS.md incorrectly marks SPAWN-02 as `[ ]`/Gaps Found despite this — see the requirements-traceability gap below. |
| 4 | On Claude Code the coordinator runs main-thread so its grant is runtime-honored, and no non-coordinator adapter carries the `Agent` tool at all — a mechanism holding on both the main-thread and subagent paths. (SPAWN-03, SPAWN-04) | ✗ FAILED | Two independently-confirmed live bypasses reach the gate at exit 0 over a real `Agent(grugops-orchestrator)` grant on a non-coordinator surface: CR-01 (round-9's own review, `27-REVIEW.md`, independently confirmed by this orchestrator reading the committed code) and Family G/G2 (re-measured OPEN in `deferred-items.md` by plans 27-47 through 27-50). `npx vitest run --exclude '**/scripts/e2e/**'` is green (1266 passed / 2 skipped, confirmed run this session) over both live defects — a green suite does not certify this criterion. SPAWN-03's main-thread runtime-honoring claim remains `UNKNOWN - verify`, now an explicit, dated, owned deferral to Phase 33/GAP-D1 rather than a silent gap. |
| 5 | `guard_adapter_body` reds on pre-v2.0 handoff/single-window prose; `orchestrator.md` stays below its 7570-byte FAIL ceiling (ceiling unchanged); the advertised Claude Code floor reads v2.1.219+ at depth 3 everywhere. (SPAWN-05, SPAWN-06, SPAWN-07) | ✓ VERIFIED | Confirmed this session: `PASS SPAWN-05: 24 adapter bodies + 2 template body shapes checked; none carries retired relay vocabulary...`; `PASS agent-factory/roles/orchestrator.md 7090B within ceiling` (ceiling constant unchanged: still `"7570 7165"`; 7090B leaves 480B of margin). `grep` across shipped docs confirms consistent `v2.1.219`/`depth 3`/`v2.1.217` wording in `agent-factory/roles/orchestrator.md:88`, `agent-factory/packaging/adapters.md:47`, `REQUIREMENTS.md:36`. No lingering "depth 5" claim found. Unchanged from round 8. |

**Score:** 3/5 roadmap success criteria cleanly verified; 2/5 (criteria 2 and 4) FAILED with reproduced evidence — unchanged in COUNT from round 8, but the underlying defect that undermines them is now a DIFFERENT, newly confirmed instance (CR-01) plus a still-open second instance (Family G/G2), not the same defect round 8 fixed.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | SPAWN-03's live-platform runtime confirmation | Phase 33 | ROADMAP.md:431, standing-obligations table row 1 (GAP-D1); round 9 (plan 27-50) explicitly ratified this as a recorded decision, not a silent drop. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/kit-model.ts` | Sole filesystem-derived authority for roles/workflows/adapters, asserted counts | ✓ VERIFIED | `guardKitCounts()` PASS line confirms 17/19/7/7 with 33-member scan composition, executed this session. |
| `scripts/frontmatter.ts` | Total, format-aware frontmatter/spawn-grant parser — no silent no-grant over any YAML node-start shape | ✗ STUB-EQUIVALENT (not total) | Confirmed non-total by direct code reading (CR-01, lines 720-724) and by re-measured Family G/G2 evidence in `deferred-items.md`. The module exists, is substantive, and is wired everywhere the phase requires — but its core correctness property (total over YAML's node-start grammar) does not hold. |
| `.claude/agents/*.md` (17 files) | Generated thin-pointer adapters, one coordinator grant, fresh-gated | ✓ VERIFIED | `adapters-freshness.js` exit 0, 0 byte differences, this session. |
| `scripts/check-foundation-guards.ts` | Runs `guard_wr05`, `guard_referential_integrity`, `guard_kit_counts`, `guard_adapter_body` and exits non-zero on any violation | ✓ VERIFIED (on today's committed tree) — known bypassable via CR-01/G-G2 plants | `node scripts/check-foundation-guards.js` exits 0 with `ALL CHECKS PASSED` on the committed tree; independently reproduced this phase to exit 0 on a hermetic mirror carrying a planted live grant via either bypass family. |
| `.planning/REQUIREMENTS.md` | Accurate traceability for KIT-01..03, SPAWN-01..07 | ✗ INACCURATE | KIT-03 and SPAWN-04 marked Complete/`[x]` despite FAILED status; SPAWN-02 marked Gaps Found/`[ ]` despite VERIFIED status. See gaps. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `check-foundation-guards.ts` | `kit-model.ts` | `import { listRoles, listWorkflows, listAgentAdapters, ... }` | ✓ WIRED | Confirmed by guard PASS line naming derived counts. |
| `check-foundation-guards.ts` (`guard_wr05`, `guard_referential_integrity`) | `frontmatter.ts` (`hasSpawnGrant`, `grantedAgentNames`) | direct import, shared code path | ✓ WIRED, unsound | Both guards read the SAME non-total parser; confirmed by `check-foundation-guards.ts:2096-2185`'s own stated claim and by this session's reproduction. |
| `install/kit-source.ts` | `kit-model.listAgentAdapters` | stated policy authority | ✓ WIRED | Confirmed per prior round; unaffected by round 9. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Foundation gate passes on the real, unmodified tree | `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED`, 88 lines | PASS |
| Committed .js matches a fresh tsc rebuild (no drift) | `npm run freshness` | exit 0, `All build outputs fresh: 32 committed .js file(s) match a fresh tsc rebuild.` | PASS |
| Adapter freshness gate is fail-closed | `node scripts/adapters-freshness.js` | exit 0, `0 byte difference(s), directory listings set-equal.` | PASS |
| Coordinator-resolution static preconditions hold | `node scripts/coordinator-resolution-precheck.js` | `PRECONDITIONS HOLD` (runtime half explicitly NOT performed by this command) | PASS (static half only) |
| Regression suite is green (stated as a floor, not proof of no bypass) | `npx vitest run --exclude '**/scripts/e2e/**'` | `35 files, 1266 passed, 2 skipped, 0 failed`, 133.34s | PASS (does not detect CR-01 or Family G/G2 — confirmed by this phase's own plants) |
| CR-01 is a confirmed defect in the committed code, not a fabricated review claim | Read `scripts/frontmatter.ts:640-730` directly | Code matches `27-REVIEW.md`'s CR-01 citation verbatim: the `else if (c === "'" && !dq)` arm re-derives `openedAtNodeStart` on the reopen half of a `''` pair | CONFIRMED PRESENT |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | REQUIREMENTS.md State | Verified Status | Evidence |
|---|---|---|---|---|---|
| KIT-01 | 27-01, 27-03 | `kit-model.ts` sole filesystem-derived authority | `[ ]` Gaps Found | SATISFIED (checklist lags, phase not yet closed) | `guardKitCounts()` PASS line |
| KIT-02 | 27-01..27-13, 27-46 | Every guard/validator scan set derives from `kit-model.ts` | `[x]` Complete | SATISFIED | Same as above; 9/7/1/1 plugin-component partition confirmed |
| KIT-03 | 27-01, 27-07, 27-12, 27-18, 27-19, 27-47..50 | Referential-integrity oracle, RED-then-GREEN, sound closure | `[x]` Complete — INACCURATE | BLOCKED | CR-01 + Family G/G2 both reach the same closure-computation path; oracle's soundness claim is false |
| SPAWN-01 | 27-06, 27-07, 27-15 | 17 generated thin-pointer adapters | `[ ]` Gaps Found | SATISFIED (checklist lags) | `adapters-freshness.js` set-equal, 17/17 |
| SPAWN-02 | 27-07, 27-11 | `adapters-freshness.ts` fail-closed byte gate | `[ ]` Gaps Found — INACCURATE | SATISFIED | Live fail-closed spot-check (round 8), 0-diff PASS (round 9) |
| SPAWN-03 | 27-09, 27-16, 27-17, 27-50 (deferral) | Coordinator wired main-thread, runtime-honored grant | `[ ]` Gaps Found | NEEDS HUMAN (deferred to Phase 33, dated decision) | `coordinator-resolution-precheck` static half only; runtime half UNKNOWN - verify |
| SPAWN-04 | 27-08, 27-12, 27-18, 27-47..50 | Non-coordinator adapters omit `Agent` tool entirely as a live mechanism | `[x]` Complete — INACCURATE | BLOCKED | CR-01 + Family G/G2 both defeat the static mechanism via a hidden grant |
| SPAWN-05 | 27-08, 27-14 | `guard_adapter_body` reds on pre-v2.0 prose | `[ ]` Gaps Found | SATISFIED (checklist lags) | `PASS SPAWN-05` this session |
| SPAWN-06 | 27-05 | orchestrator.md below 7570B ceiling | `[ ]` Gaps Found | SATISFIED (checklist lags) | 7090B, ceiling unchanged |
| SPAWN-07 | 27-05, 27-21 | Depth-3/v2.1.219+ floor documented consistently | `[ ]` Gaps Found | SATISFIED (checklist lags) | grep confirms consistent wording across 3 sites |

No orphaned requirements found — REQUIREMENTS.md's Phase 27 row (KIT-01..03, SPAWN-01..07) matches the union of all 50 plans' `requirements:` frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TBD/FIXME/XXX debt markers found in round-9-modified files (scripts/frontmatter.ts, kit-model.ts, check-foundation-guards.ts, generate-role-adapters.test.ts, frontmatter.test.ts, kit-model.test.ts, check-foundation-guards.test.ts) beyond `U+XXXXX` Unicode-label placeholders (false positives, confirmed by reading context) | — | — | — |
| `.planning/REQUIREMENTS.md` | 58, 63, 65 | Traceability over/under-claim: KIT-03 and SPAWN-04 marked Complete despite FAILED verification; SPAWN-02 marked Gaps Found despite VERIFIED status | Blocker (traceability integrity) | Undermines "the trace is the proof" — this project's own CLAUDE.md constraint. Round 9's own plan (27-50) flagged this and deliberately did not correct it, deferring the decision here. |

### Human Verification Required

1. **SPAWN-03 live-platform capture** (formally deferred to Phase 33, not a Phase 27 blocker, but the underlying claim is still open)
   - **Test:** Start a real Claude Code session with `claude --agent grugops-orchestrator` and observe whether the Orchestrator's `Agent(<allowlist>)` grant is runtime-enforced.
   - **Expected:** The coordinator successfully delegates via `Agent`; a spawned role subagent has no `Agent` tool available to it.
   - **Why human:** Live-platform runtime behavior; no static grep or gate can confirm it. Explicitly deferred to Phase 33/GAP-D1/CAP-01 as of round 9.

### Gaps Summary

Round 9 closed all 11 findings from the round-8 code review with strong, reproduced evidence (RED/GREEN transcripts, derived corpora, planted-defect probes) — this is real, substantial work and the kit-set authority (KIT-01/KIT-02), adapter generation and freshness gating (SPAWN-01/SPAWN-02), and adapter-body/ceiling/floor hygiene (SPAWN-05/SPAWN-06/SPAWN-07) all verify cleanly and are unchanged from round 8's clean pass.

However, the phase's central invariant — **the spawn-grant predicate is total: no YAML document can carry a live `Agent(<name>)` grant that reaches the gate as a silent no-grant** — is still not achieved. Round 9's own code review found a NEW confirmed critical (CR-01, the `''` single-quote-escape defect) that this orchestrator independently confirmed by reading the committed `scripts/frontmatter.ts` at HEAD (`e802776`), not merely by trusting the review's narrative. This is on top of a second, already-tracked live bypass (Family G/G2, nested block-scalar headers) that four consecutive round-9 plans re-measured and left explicitly OPEN in `deferred-items.md`. Both defects independently reach the exact closure-computation code path that KIT-03's referential-integrity oracle and SPAWN-04's "no non-coordinator adapter carries a live grant" claim both depend on, and both were reproduced end-to-end at the gate (`ALL CHECKS PASSED`, exit 0) with a live grant planted on a non-coordinator surface. A green regression suite (1266 passed / 2 skipped, confirmed run this session) does not detect either — this is the ninth consecutive gap-closure round in which this class of bypass has survived a green suite.

Separately, and independently of the spawn-grant invariant, this round's own plan (27-50) surfaced — but by design did not correct — a factual inaccuracy in `.planning/REQUIREMENTS.md`: KIT-03 and SPAWN-04 are marked `[x]`/Complete while both are FAILED here and in the prior verification round, and SPAWN-02 is marked `[ ]`/Gaps Found while it is genuinely VERIFIED. This verification report is the correct place to make that correction explicit; it does not resolve until a human or a future plan edits REQUIREMENTS.md.

**Net assessment:** substantial, well-evidenced progress landed in round 9, but the phase goal — "role agents actually execute... and every guard/validator scan set is derived... so they land inside the guards" — is not fully achieved. The kit-set-authority half of the goal (KIT-01/KIT-02) is solid. The spawn-correctness half (the guards genuinely catching every live grant) is not: two live, independently reproduced silent-no-grant bypasses still reach the gate at exit 0.

---

_Verified: 2026-08-09T22:00:00Z_
_Verifier: Claude (gsd-verifier)_

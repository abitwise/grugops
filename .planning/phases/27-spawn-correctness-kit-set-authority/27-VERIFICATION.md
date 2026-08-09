---
phase: 27-spawn-correctness-kit-set-authority
verified: 2026-08-10T02:10:00Z
status: gaps_found
score: 8/10 requirements verified clean (2 FAILED — KIT-03, SPAWN-04 — each independently reproduced this round to still carry a live silent-no-grant bypass, on top of the SPAWN-03 deferral which is not counted as a phase-27 blocker)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 6/10 (round 9, 2026-08-09T22:00:00Z)
  gaps_closed:
    - "CR-01 (round-9's '' single-quote-escape defect) and Family G/G2 (nested block-scalar header at exactly one node-start position) — both CLOSED. Independently confirmed at the module level (frontmatter.js) that the round-9 escape defect and the round-9 block-scalar-header defect are fixed; the round-10 deferred-items.md re-measurement table matches what I reproduced."
    - "REQUIREMENTS.md traceability — CLOSED. KIT-03 and SPAWN-04 correctly held at [ ]/Gaps Found pending this verification round (D-58's convention); SPAWN-02 correctly [x]/Complete; SPAWN-03 correctly [ ]/Gaps Found with the Phase-33 deferral cited. Re-read on disk this session — the table and the requirement checkboxes agree for all ten rows and match the true state."
  gaps_remaining:
    - "KIT-03 / SPAWN-04 — STILL FAILED, by a NEW defect this round did not close. Round 10's own code review found, and I independently reproduced at the module level AND end-to-end through the full gate, THREE live silent-no-grant bypasses in the current scripts/frontmatter.ts / frontmatter.js: (1) CR-01-new — a NEW regression introduced by round 10's own D-57 fix (the sawBlock exemption is sticky across an entire key's value, so one nested block scalar anywhere in a key disables the escape refusal for every other part of that same key); (2) CR-02 — a YAML node property (anchor/tag, e.g. `&a`, `!!str`) between a mapping indicator and a block-scalar indicator defeats blockHeaderAt, and I reproduced this END-TO-END: planted on a hermetic git-archive mirror's non-coordinator .claude/skills/grugops-map/SKILL.md + its distribution twin skills/map/SKILL.md, node scripts/check-foundation-guards.js reported ALL CHECKS PASSED at exit 0 with a live Agent(grugops-orchestrator) grant plainly in the ruby/psych-loaded value; (3) CR-03 — blockHeaderAt reuses KEY_LINE, the TOP-LEVEL frontmatter key grammar, for NESTED mapping keys, so a quoted/dotted/digit-leading/space-containing nested key is never recognised as a header introduction. This is the tenth consecutive gap-closure round in which this class of bypass has survived a green suite (35 files / 1284 passed / 2 skipped, confirmed run this session) and a green check-foundation-guards run on the unmodified tree."
  regressions:
    - "CR-01-new: round 10's D-57 fix for Family G/G2 (moving the flush's quoting exemption from cur.block to the sticky cur.sawBlock) introduced a new silent-no-grant path that did not exist in the round-9 build. This is a regression, not a residual of a prior defect."
gaps:
  - truth: "The referential-integrity oracle's set equality (coordinator grant == adapter directory == role corpus) is sound because a name is never silently dropped or altered when computing the grant closure. (KIT-03)"
    status: failed
    reason: >
      guard_referential_integrity (KIT-03) and guard_wr05 (SPAWN-04) both compute their grant
      closures through the same scripts/frontmatter.ts path. That module is confirmed, by this
      session's own independent reproduction (not merely by trusting 27-REVIEW.md's narrative), to
      still be non-total over YAML's own grammar in three ways, one of them a brand-new regression:
      (1) CR-01-new (scripts/frontmatter.ts ~1215-1225, ~1397-1405) — the flush's quoting exemption
      now keys off the sticky `cur.sawBlock` instead of the per-value `cur.block`, so a nested block
      scalar anywhere in a key disables the D-30 escape refusal for the WHOLE key, including
      unrelated double-quoted sibling parts. Reproduced at the module level this session:
      `hasSpawnGrant` on `{ a: "\x41gent(grugops-orchestrator)", b: >- x }` returns
      `{"ok":true,"value":false}` while /usr/bin/ruby -ryaml loads `a => "Agent(grugops-orchestrator)"`
      plainly — a silent no-grant produced by adding an unrelated sibling key.
      (2) CR-02 (scripts/frontmatter.ts ~440-473, blockHeaderAt) — a node property (anchor `&a` or
      tag `!!str`) between the mapping `key:` indicator and the block-scalar indicator (`nested: &a >-`)
      is not recognised as a header introduction, so the scalar's literal content is routed through
      stripComment instead, where a `#` deletes the rest of the line. Reproduced at the module level
      AND end-to-end through the full gate this session: planted on a hermetic git-archive mirror's
      .claude/skills/grugops-map/SKILL.md and its distribution twin skills/map/SKILL.md,
      `node scripts/check-foundation-guards.js` printed `ALL CHECKS PASSED`, exit 0, while
      /usr/bin/ruby -ryaml loaded `{"nested"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}`
      — a live grant on a non-coordinator surface reaching the gate as a pass.
      (3) CR-03 (scripts/frontmatter.ts ~446-457, KEY_LINE reuse) — blockHeaderAt reuses the
      top-level frontmatter key grammar for nested mapping keys, so a space-containing nested key
      (`a b: >-`) is not recognised as a header. Reproduced at the module level this session:
      `hasSpawnGrant` on `{ a b: >- Read, # x, Agent(grugops-orchestrator) }` returns
      `{"ok":true,"value":false}` while the loader carries the grant plainly under key `"a b"`.
      On today's ACTUAL committed adapter/role files the closure computes correctly (grant text is
      single-line, unaffected by any of the three defects), so guard_referential_integrity and
      guard_wr05 genuinely PASS this session on the real tree — but that is the same shape of claim
      round 9's own gap named: the SOUNDNESS claim the oracle (KIT-03) and the mechanism (SPAWN-04)
      both depend on is demonstrably false for a realistic YAML edit one round after the previous
      pair of bypasses was closed.
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "Three independently-confirmed live silent-no-grant paths: the D-57 sawBlock exemption is sticky across an entire key (CR-01-new); blockHeaderAt does not strip a node property before testing for a block indicator (CR-02, reproduced end-to-end through the gate); blockHeaderAt's nested-key introduction reuses the narrow top-level KEY_LINE grammar instead of YAML's general nested mapping-key grammar (CR-03)."
    missing:
      - "CR-01-new's fix: track which parts of a key's value a block scalar actually owns (a region property) rather than exempting the whole key once any block scalar appears anywhere in it (a key property) — 27-REVIEW.md gives a concrete blockParts-set shape."
      - "CR-02's fix: strip a node property at every header-introduction position blockHeaderAt checks (using the module's existing property-stripping authority, not a new pattern), and ask startsWithReference about the node start that follows a recognised mapping separator, not only about offset 0 of the line."
      - "CR-03's fix: give blockHeaderAt a nested-key production derived from YAML's own rule (mapping-value indicator position), instead of reusing KEY_LINE, and pin it with a derived axis over key spellings (quoted / dotted / digit-leading / space-containing / bare) rather than four enumerated rows."
      - "A widened D-52 loader-differential corpus that can express all three families before they are called closed — this phase's own recorded lesson (WR-01, closed once already this round for a different family) is that a corpus which cannot generate an input cannot prove the fix that input needed."
deferred:
  - truth: "SPAWN-03's real-platform confirmation that the main-thread coordinator's Agent(<allowlist>) grant is actually honored by Claude Code at runtime."
    addressed_in: "Phase 33"
    evidence: "ROADMAP.md standing-obligations table (GAP-D1); 27-CONTEXT.md D-56 item 10 and D-58 item 5 both re-affirm this as a dated, owned deferral to Phase 33 / GAP-D1 / CAP-01, not a silently-stale item. REQUIREMENTS.md SPAWN-03 row cites the same deferral. Unchanged since round 9's verification, which already deferred it identically."
---

# Phase 27: Spawn Correctness & Kit-Set Authority Verification Report (Round 10)

**Phase Goal:** Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Verified:** 2026-08-10T02:10:00Z
**Status:** gaps_found
**Re-verification:** Yes — round 10, after gap-closure plans 27-51..27-54, replacing round 9's record (preserved at `27-VERIFICATION-round9.md`).

## Independent Verification Method

Per the round-10 instructions, I did not take `27-REVIEW.md`'s claims on trust. For each of its three critical
findings I independently reproduced the defect against the current, committed `scripts/frontmatter.js` (HEAD
`5a3fadb`), using `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) as the ground-truth loader —
the same loader column the review used. For CR-02 (the one claimed reproduced at the full gate) I additionally
built a hermetic `git archive HEAD` mirror, planted the exact YAML shape on a non-coordinator skill adapter and
its distribution twin, and ran the real `node scripts/check-foundation-guards.js` against that mirror myself.

## Goal Achievement

### Observable Truths (by roadmap Success Criterion)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every scan set (`kit-model.ts` derived, asserted count; `WR05_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`, validator lists) resolves through the filesystem, no stale literal survives. (KIT-01, KIT-02) | ✓ VERIFIED | `node scripts/check-foundation-guards.js` → `PASS kit counts: derived 17 roles, 19 workflows, 7 skill adapters and 7 plugin-form skill adapters (expected 17 / 19 / 7 / 7); the spawn-grant scan composition holds exactly 33 members...` — run directly this session on the unmodified tree. |
| 2 | The referential-integrity oracle fails RED against a broken tree and turns GREEN only when the three sets (coordinator grant, adapter directory, role corpus) are truly the same set — soundly, over any grant text the guard reads. (KIT-03) | ✗ FAILED | `guard_referential_integrity` PASSES on today's committed text (`PASS KIT-03: 17 roles == 17 adapters == 17 grant-closure names`), but its soundness claim rests on `scripts/frontmatter.ts` being total over YAML's node-start grammar, which I independently reproduced to be false in three ways this round (CR-01-new, CR-02, CR-03 — see Gaps). CR-02 reproduced end-to-end at the gate with a live grant on a non-coordinator adapter and `ALL CHECKS PASSED` exit 0. |
| 3 | All 17 role adapters exist, are generated thin pointers (not copies), and a byte difference between a committed adapter and a fresh regeneration fails the freshness gate closed. (SPAWN-01, SPAWN-02) | ✓ VERIFIED | `ls .claude/agents/*.md` = 17. `node scripts/adapters-freshness.js` → exit 0, `0 byte difference(s), directory listings set-equal.` Live fail-closed spot-check this session: appended one byte to `grugops-orchestrator.md` → `STALE: 1 of 17...` exit 1; reverted → clean, exit 0. |
| 4 | On Claude Code the coordinator runs main-thread so its grant is runtime-honored, and no non-coordinator adapter carries the `Agent` tool at all — a mechanism holding on both the main-thread and subagent paths. (SPAWN-03, SPAWN-04) | ✗ FAILED (SPAWN-04); NEEDS HUMAN/DEFERRED (SPAWN-03) | SPAWN-04's static mechanism (no `Agent` token in any non-coordinator adapter body — `guard_wr05` PASSES on today's committed text) is undermined by the same three live bypasses as KIT-03; a real `Agent(grugops-orchestrator)` grant hidden via CR-02's shape reaches the gate at exit 0 on a non-coordinator surface, reproduced this session end-to-end. SPAWN-03's runtime-honoring claim remains `UNKNOWN - verify`, explicitly and validly deferred to Phase 33 / GAP-D1 / CAP-01 (D-56 item 10, D-58 item 5) — not a phase-27 blocker per the round-context instructions and the project's own convention. |
| 5 | `guard_adapter_body` reds on pre-v2.0 prose; `orchestrator.md` stays below its 7570-byte FAIL ceiling; the v2.1.219+/depth-3 floor reads consistently everywhere. (SPAWN-05, SPAWN-06, SPAWN-07) | ✓ VERIFIED | `PASS SPAWN-05: 24 adapter bodies + 2 template body shapes checked; none carries retired relay vocabulary...`. `PASS agent-factory/roles/orchestrator.md 7090B within ceiling` (ceiling constant unchanged, `7570`). `grep` confirms consistent `v2.1.219`/`depth 3`/`v2.1.217-218` wording in `agent-factory/roles/orchestrator.md:88`, `agent-factory/packaging/adapters.md:47`, `.planning/REQUIREMENTS.md:36`. `.claude/agents/grugops-orchestrator.md` body carries no pre-v2.0 handoff/single-window prose (read directly). |

**Score:** 3/5 roadmap success criteria cleanly verified; 2/5 (criteria 2 and 4) FAILED with independently reproduced evidence — unchanged in COUNT from round 9, and the underlying defect is again a NEW instance (CR-01-new, plus CR-02 and CR-03) that round 10's own fix did not fully close, not a repeat of round 9's already-closed pair.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | SPAWN-03's live-platform runtime confirmation | Phase 33 | ROADMAP.md standing-obligations table (GAP-D1); D-56 item 10 / D-58 item 5 in `27-CONTEXT.md`; `.planning/REQUIREMENTS.md` SPAWN-03 row. Unchanged since round 9. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/kit-model.ts` | Sole filesystem-derived authority for roles/workflows/adapters, asserted counts | ✓ VERIFIED | `guardKitCounts()` PASS confirms 17/19/7/7, executed this session. |
| `scripts/frontmatter.ts` | Total, format-aware frontmatter/spawn-grant parser — no silent no-grant over any YAML node-start shape | ✗ NOT TOTAL | Independently reproduced non-total this session: CR-01-new (sticky `sawBlock` region), CR-02 (node property before block indicator, reproduced end-to-end at the gate), CR-03 (`KEY_LINE` grammar reused for nested keys). |
| `.claude/agents/*.md` (17 files) | Generated thin-pointer adapters, one coordinator grant, fresh-gated | ✓ VERIFIED | `adapters-freshness.js` exit 0, live fail-closed spot-check confirmed this session. |
| `scripts/check-foundation-guards.ts` | Runs `guard_wr05`, `guard_referential_integrity`, `guard_kit_counts`, `guard_adapter_body` and exits non-zero on any violation | ✓ VERIFIED on today's committed tree — bypassable via CR-01-new/CR-02/CR-03 | `node scripts/check-foundation-guards.js` exits 0 with `ALL CHECKS PASSED` on the unmodified tree; independently reproduced this session to exit 0 on a hermetic mirror carrying a planted live grant via CR-02's shape. |
| `.planning/REQUIREMENTS.md` | Accurate traceability for KIT-01..03, SPAWN-01..07 | ✓ VERIFIED (accurate as of this reading) | KIT-03, SPAWN-04 correctly `[ ]`/Gaps Found held pending this verification (D-58); SPAWN-03 correctly `[ ]`/Gaps Found with Phase-33 deferral cited; the other 7 rows correctly `[x]`/Complete. Table and checkboxes agree for all ten rows, re-read on disk this session. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `check-foundation-guards.ts` | `kit-model.ts` | direct import, derived counts | ✓ WIRED | Confirmed by guard PASS line naming derived counts this session. |
| `check-foundation-guards.ts` (`guard_wr05`, `guard_referential_integrity`) | `frontmatter.ts` (`hasSpawnGrant`, `grantedAgentNames`) | direct import, shared code path | ✓ WIRED, still unsound | Both guards read the same non-total parser; confirmed by this session's own module-level and gate-level reproductions. |
| `install/kit-source.ts` | `kit-model.listAgentAdapters` | stated policy authority | ✓ WIRED | Unaffected by round 10; consistent with round 9's confirmation. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Foundation gate passes on the real, unmodified tree | `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED` | PASS |
| Committed `.js` matches a fresh `tsc` rebuild (no drift) | `npm run freshness` | exit 0, `All build outputs fresh: 32 committed .js file(s) match a fresh tsc rebuild.` | PASS |
| Adapter freshness gate is fail-closed | append 1 byte → `node scripts/adapters-freshness.js` → revert | STALE detected exit 1, then clean exit 0 | PASS |
| Regression suite is green (does not detect the live bypasses) | `npx vitest run --exclude '**/scripts/e2e/**'` | `35 files, 1284 passed, 2 skipped, 0 failed`, 132.79s | PASS on its own terms — confirmed this session NOT to catch CR-01-new/CR-02/CR-03 |
| CR-02 reproduced at the module level | `hasSpawnGrant` on `nested: &a >- ...Agent(grugops-orchestrator)` | module `{"ok":true,"value":false}`; ruby `{"nested"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}` | CONFIRMED live silent no-grant |
| CR-02 reproduced end-to-end at the gate | plant on hermetic mirror's `.claude/skills/grugops-map/SKILL.md` + `skills/map/SKILL.md`, run `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, exit 0 (control unplanted tree also exits 0, confirming the plant — not a baseline artifact — is what should have failed) | CONFIRMED live bypass through the full gate |
| CR-01-new reproduced at the module level | `hasSpawnGrant` on a document with a valid `\x` escape refusal sibling plus one unrelated `>-` block scalar sibling | module `{"ok":true,"value":false}`; ruby `{"a"=>"Agent(grugops-orchestrator)","b"=>"x"}` | CONFIRMED live silent no-grant |
| CR-03 reproduced at the module level | `hasSpawnGrant` on a nested key `a b: >-` carrying a grant | module `{"ok":true,"value":false}`; ruby `{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}` | CONFIRMED live silent no-grant |
| No debt markers in phase-modified scripts | `grep -nE "TBD|FIXME|XXX"` over frontmatter/guards/kit-model/generator/freshness/validator + their tests | Only `U+XXXXX` Unicode-label placeholders (false positives, confirmed by reading context) | PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | REQUIREMENTS.md State | Verified Status | Evidence |
|---|---|---|---|---|---|
| KIT-01 | 27-01, 27-03, 27-54 | `kit-model.ts` sole filesystem-derived authority | `[x]` Complete | SATISFIED | `guardKitCounts()` PASS |
| KIT-02 | 27-01..27-13, 27-46, 27-53, 27-54 | Every guard/validator scan set derives from `kit-model.ts` | `[x]` Complete | SATISFIED | Same as above |
| KIT-03 | 27-01, 27-07, 27-12, 27-18, 27-19, 27-47..54 | Referential-integrity oracle, RED-then-GREEN, sound closure | `[ ]` Gaps Found | BLOCKED | CR-01-new + CR-02 + CR-03 all reach the same closure-computation path; CR-02 reproduced end-to-end |
| SPAWN-01 | 27-06, 27-07, 27-15, 27-53 | 17 generated thin-pointer adapters | `[x]` Complete | SATISFIED | `adapters-freshness.js` set-equal, 17/17 |
| SPAWN-02 | 27-07, 27-11, 27-50 | `adapters-freshness.ts` fail-closed byte gate | `[x]` Complete | SATISFIED | Live fail-closed spot-check this session |
| SPAWN-03 | 27-09, 27-16, 27-17, 27-50, 27-54 | Coordinator wired main-thread, runtime-honored grant | `[ ]` Gaps Found | NEEDS HUMAN (deferred to Phase 33, dated decision) | `coordinator-resolution-precheck` static half only; runtime half `UNKNOWN - verify` |
| SPAWN-04 | 27-08, 27-12, 27-18, 27-47..52, 27-54 | Non-coordinator adapters omit `Agent` tool entirely as a live mechanism | `[ ]` Gaps Found | BLOCKED | CR-01-new + CR-02 + CR-03 all defeat the static mechanism via a hidden grant, CR-02 end-to-end |
| SPAWN-05 | 27-08, 27-14 | `guard_adapter_body` reds on pre-v2.0 prose | `[x]` Complete | SATISFIED | `PASS SPAWN-05` this session |
| SPAWN-06 | 27-05 | `orchestrator.md` below 7570B ceiling | `[x]` Complete | SATISFIED | 7090B, ceiling unchanged |
| SPAWN-07 | 27-05, 27-21 | Depth-3/v2.1.219+ floor documented consistently | `[x]` Complete | SATISFIED | grep confirms consistent wording across 3 sites |

No orphaned requirements found — `.planning/REQUIREMENTS.md`'s Phase 27 row (KIT-01..03, SPAWN-01..07) matches the union of all plans' `requirements:` frontmatter, and matches `27-54-PLAN.md`'s explicit full-set declaration.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/frontmatter.ts` | ~1215-1225, ~1397-1405 | Sticky `sawBlock` exemption disables the D-30 escape refusal for an entire key when any part of that key contains a block scalar (CR-01-new) | 🛑 Blocker | Regression introduced this round; a security-mechanism refusal silently turns into a no-grant success on an unrelated sibling. |
| `scripts/frontmatter.ts` | ~440-473 | `blockHeaderAt` does not strip a YAML node property (anchor/tag) before testing for a block-scalar indicator (CR-02) | 🛑 Blocker | Reproduced end-to-end at the gate; a live grant on a non-coordinator adapter passes `ALL CHECKS PASSED`. |
| `scripts/frontmatter.ts` | ~446-457, ~343 | `blockHeaderAt`'s nested-key introduction reuses `KEY_LINE`, the top-level frontmatter grammar, not YAML's general nested-key grammar (CR-03) | 🛑 Blocker | Quoted/dotted/digit-leading/space-containing nested keys carrying a header are never recognised; content routes through `stripComment` instead. |
| — | — | No unreferenced `TBD`/`FIXME`/`XXX` debt markers found in any file this round modified | — | — |

None of the three findings above have a `#issue` / `PR#` / `DEF-*` reference attached — they are live, unresolved defects in the phase's central invariant, not deferred work items, so they are BLOCKERs per the debt-marker gate's own logic (this is not a marker at all, it is an unmitigated defect).

### Human Verification Required

1. **SPAWN-03 live-platform capture** (formally deferred to Phase 33 / GAP-D1 / CAP-01, not a Phase 27 blocker, but the underlying claim is still open)
   - **Test:** Start a real Claude Code session with `claude --agent grugops-orchestrator` (or equivalent main-thread wiring) and observe whether the Orchestrator's `Agent(<allowlist>)` grant is runtime-enforced.
   - **Expected:** The coordinator successfully delegates via `Agent`; a spawned role subagent has no `Agent` tool available to it.
   - **Why human:** Live-platform runtime behavior; no static grep or gate can confirm it. Explicitly deferred, dated, and owned (D-56 item 10, D-58 item 5).

### Gaps Summary

Round 10 closed real defects with strong, independently-reproducible evidence: the round-9 `''`-escape defect (CR-01) and the nested block-scalar-header defect (Family G/G2) are both genuinely fixed — I confirmed both closures directly against the current module. The kit-set-authority half of the goal (KIT-01/KIT-02), adapter generation and freshness gating (SPAWN-01/SPAWN-02), adapter-body/ceiling/floor hygiene (SPAWN-05/SPAWN-06/SPAWN-07), and this round's own traceability fix (REQUIREMENTS.md now correctly matches the verification record under a single written convention, D-58) all verify cleanly.

However, the phase's central invariant — **the spawn-grant predicate is total: no YAML document can carry a live `Agent(<name>)` grant that reaches the gate as a silent no-grant** — is *still* not achieved, for the tenth consecutive gap-closure round. This round's own fix for the previous pair of bypasses (D-57's `sawBlock` exemption) introduced a brand-new regression (CR-01-new) in the same code path it repaired, and two further, previously-uncatalogued node-start shapes (CR-02, CR-03) reach the same non-total parser. I did not take the code review's word for any of this: I independently reproduced all three at the module level against the committed `frontmatter.js`, and reproduced CR-02 — the one claimed reproduced at the gate — end-to-end myself, on a hermetic mirror, planting the exact shape on a non-coordinator skill adapter and its distribution twin, and watching `node scripts/check-foundation-guards.js` print `ALL CHECKS PASSED` at exit 0 over a live `Agent(grugops-orchestrator)` grant. A green regression suite (1284 passed / 2 skipped, confirmed run this session) and a green `check-foundation-guards` run on the unmodified tree do not detect any of the three — consistent with the project's own recorded lesson across all nine prior rounds.

KIT-03 and SPAWN-04 correctly remain `[ ]`/Gaps Found in REQUIREMENTS.md per the round's own D-58 convention, and this verification confirms that disposition was correct to hold. SPAWN-03 remains a validly deferred, dated, owned item (Phase 33 / GAP-D1 / CAP-01) and is not counted as a phase-27 blocker.

**Net assessment:** the phase goal — "role agents actually execute... and every guard/validator scan set is derived... so they land inside the guards" — is not fully achieved. The kit-set-authority half (KIT-01/KIT-02) is solid and has been solid across rounds. The spawn-correctness half (the guards genuinely catching every live grant, with no silent no-grant) is not: this round closed two live bypasses and, in doing so, opened or left uncaught three more that reach the same gate.

---

_Verified: 2026-08-10T02:10:00Z_
_Verifier: Claude (gsd-verifier)_

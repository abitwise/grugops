---
phase: 27-spawn-correctness-kit-set-authority
verified: 2026-08-10T20:30:00Z
status: gaps_found
score: 8/10 requirements verified clean (2 FAILED — KIT-03, SPAWN-04 — each independently reproduced this round, at module level AND end-to-end through the full gate, to still carry a live silent-no-grant bypass; SPAWN-03's deferral is not counted as a phase-27 blocker)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 8/10 (round 10, 2026-08-10T02:10:00Z)
  gaps_closed:
    - "Round-10 CR-01-new (sticky sawBlock exemption across a whole key), CR-02 (node property before a block indicator, one of two positions), and CR-03 (KEY_LINE reused for nested keys) — all three CLOSED. Independently confirmed this session: CR-03's nested-key shape, the round-10 CR-02 shape (node property immediately after `key:`), and the sticky-sawBlock shape are no longer reproducible against the committed frontmatter.js at HEAD."
    - "REQUIREMENTS.md traceability — CLOSED. KIT-03 and SPAWN-04 correctly held at [ ]/Gaps Found pending this verification round (D-58's convention, and 27-61's own traceability-hold task explicitly declined to promote them). All ten checkbox/table-cell pairs read from disk this session and agree with each other and with round 10's recorded verdict."
  gaps_remaining:
    - "KIT-03 / SPAWN-04 — STILL FAILED, by two NEW-this-round defects the round-11 code review found and this session independently reproduced, both at the module level and end-to-end through the full gate: (1) CR-01 — 27-58's own fix for the round-10 defect family took the block-scalar indentation landmark (both the auto-detection floor and the explicit-indicator base) from the physical header LINE's indent instead of the parent node's indentation (YAML 1.2 §8.1.1.1). The two coincide at every position the round-11 corpus can spell and diverge at three sequence-related shapes, one of which — a bare block header on its own line under a dash, explicit-indent spelling `>-2` — is a REGRESSION against pre-round `3c7930b` (which read the grant correctly; HEAD reads a silent no-grant). (2) CR-02 — D-61's fourth reference-refusal application point (`mappingSeparatorNodeStarts`) is wired into only one of the two `blockHeaderAt` call sites (the continuation path), leaving the sequence-item path's compact-mapping node starts unasked; a resolvable YAML alias through a sequence item's compact mapping reaches the gate as a silent no-grant on a document the loader accepts."
    - "CR-01's regression reproduced end-to-end at the gate, independently, this session: planted the exact review-documented shape (`>-2` header on its own line under a bare dash, comment-truncated grant on the following line) into both distribution twins of the non-coordinator `map` skill on a hermetic `git archive HEAD` mirror. `node scripts/check-foundation-guards.js` printed `ALL CHECKS PASSED`, exit 0, while `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) loaded the `allowed-tools` value as `[\"  Read, Write, Bash, Glob, Grep,\\n # x, Agent(grugops-orchestrator)\"]` — the grant plainly present in the loaded value the gate is supposed to gate on."
    - "CR-01 also independently reproduced at the module level, both as a bug and as a regression: `hasSpawnGrant` on the review's minimal repro returns `{\"ok\":true,\"value\":false}` at HEAD; the identical document against a `git archive 3c7930b` mirror (pre-round-11) returns `{\"ok\":true,\"value\":true}` with `grantedAgentNames: [\"grugops-orchestrator\"]` — confirming the defect is a regression introduced by this round's own fix, not a residual of a prior one."
    - "CR-02 independently reproduced at the module level: `hasSpawnGrant` on the review's minimal repro (`_x: [{k: &a Agent(grugops-orchestrator)}]`, `allowed-tools: [{j: *a}]`) returns `{\"ok\":true,\"value\":false}` at HEAD; `/usr/bin/ruby -ryaml` loads `allowed-tools` as `[{\"j\"=>\"Agent(grugops-orchestrator)\"}]` — the grant is in the loaded value and the guard reads it as a no-grant. This is the tenth consecutive gap-closure round in which this class of bypass has survived a green suite (1346 passed / 2 skipped, confirmed run this session) and a green `check-foundation-guards` run on the unmodified tree."
  regressions:
    - "CR-01: 27-58's fix for the round-10 defect family (correctly moving the block-scalar end condition off the header line's indent onto detected content indentation) introduced a new silent-no-grant path in the same code path it repaired, at the three sequence-related positions where the header line's indent and the parent node's indentation diverge. One of the three shapes is a confirmed regression against `3c7930b` — the pre-round-11 build read that exact document's grant correctly."
gaps:
  - truth: "The referential-integrity oracle's set equality (coordinator grant == adapter directory == role corpus) is sound because a name is never silently dropped or altered when computing the grant closure. (KIT-03)"
    status: failed
    reason: >
      guard_referential_integrity (KIT-03) and guard_wr05 (SPAWN-04) both compute their grant
      closures through the same scripts/frontmatter.ts path, which is confirmed this session — not
      merely by trusting 27-REVIEW.md's narrative, but by independent reproduction at both the
      module level and the full-gate level — to still be non-total over YAML's block-scalar and
      alias grammar, in two ways:
      (1) CR-01 (scripts/frontmatter.ts:2061-2092 openBlock, specifically :2067 and :2074-2075; the
      call sites at :2350 and :2426) — the block-scalar indentation landmark (both the
      auto-detection floor and the base the explicit indentation indicator is added to) is taken
      from the physical header LINE's indent (`indentOf(raw)`) instead of the parent node's
      indentation, which is what YAML 1.2 §8.1.1.1 defines. The two coincide at every position the
      round-11 corpus can spell (WR-02) and diverge at three sequence-related shapes. Reproduced at
      the module level this session (HEAD: silent no-grant; pre-round `3c7930b` mirror: correct
      grant — confirming the REGRESSION) and end-to-end through the full gate on a hermetic
      git-archive mirror with the shape planted on both distribution twins of the non-coordinator
      `map` skill: `node scripts/check-foundation-guards.js` → `ALL CHECKS PASSED`, exit 0, while
      /usr/bin/ruby -ryaml loaded the grant plainly in the `allowed-tools` value.
      (2) CR-02 (scripts/frontmatter.ts:751-765 mappingSeparatorNodeStarts, its single call site at
      :2447-2450; the item path's own reference test at :2317 which asks only offset 0) — the
      fourth reference-refusal application point D-61 requires is wired into only one of the two
      `blockHeaderAt` call sites, so a resolvable alias reaching a grant through a sequence item's
      compact mapping is unasked and silently no-grants. Reproduced at the module level this
      session: `hasSpawnGrant` on the minimal repro returns `{"ok":true,"value":false}` while
      /usr/bin/ruby -ryaml loads the alias-resolved grant plainly in the `allowed-tools` value —
      confirmed by a same-alias, dash-less control that IS loudly refused, proving the gap is the
      call-site set and not the sigil test.
      On today's ACTUAL committed adapter/role files the closure computes correctly (all grant text
      is single-line, unaffected by either defect), so guard_referential_integrity and guard_wr05
      genuinely PASS this session on the real tree — but that is the same shape of claim every one
      of the ten prior rounds made before its own bypass was found: the SOUNDNESS claim the oracle
      (KIT-03) and the mechanism (SPAWN-04) both depend on is demonstrably false for realistic YAML
      shapes, one of them a regression introduced by this very round's fix for the previous pair.
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "openBlock (:2061-2092) takes both block-scalar indentation quantities from the physical header line's indent instead of the parent node's indentation (CR-01, regression at one of three affected shapes); blockHeaderAt's fourth reference-refusal application point (mappingSeparatorNodeStarts, :751-765) is wired into only one of its two call sites, leaving the sequence-item path's compact-mapping node starts unasked (CR-02)."
    missing:
      - "CR-01's fix: carry the parent node's indentation into openBlock instead of the header line's — name the quantity per YAML's own terms (`parentIndent`) — and derive it at each of the two call sites (:2350 item path, :2426 continuation path) from what that site already knows about how many columns a compact mapping/sequence consumed on the header line, rather than from `indentOf(raw)`."
      - "CR-02's fix: ask `mappingSeparatorNodeStarts` (or an equivalent reference test) at the item path's node-start position (immediately after the dashes are consumed, alongside the existing offset-0 `startsWithReference` check at :2317), not only at the continuation path's :2447-2450 — and pin the fix by reading the `blockHeaderAt` call-site list out of the source at test run time and asserting every member also performs the reference check, so a third recogniser site fails by name rather than by memory (as 27-59 already does for stripComment's call sites)."
      - "A widened D-52/corpus axis (WR-02, already named by the round-11 review) that can spell a position where the header line's indent differs from the parent node's indentation — the round-11 corpus (2,544 → 16,704 cells) still varies only key/property/indicator/sibling and never indent or intro, so it cannot generate the input either of the two live defects needs, which is exactly why both shipped green."
deferred:
  - truth: "SPAWN-03's real-platform confirmation that the main-thread coordinator's Agent(<allowlist>) grant is actually honored by Claude Code at runtime."
    addressed_in: "Phase 33"
    evidence: "ROADMAP.md standing-obligations table (GAP-D1); 27-CONTEXT.md D-56 item 10 and D-58 item 5 both re-affirm this as a dated, owned deferral to Phase 33 / GAP-D1 / CAP-01, not a silently-stale item. REQUIREMENTS.md SPAWN-03 row cites the same deferral, byte-unchanged this round per 27-61's own traceability-hold task. Unchanged since round 9's verification, which already deferred it identically."
---

# Phase 27: Spawn Correctness & Kit-Set Authority Verification Report (Round 11)

**Phase Goal:** Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Verified:** 2026-08-10T20:30:00Z
**Status:** gaps_found
**Re-verification:** Yes — round 11, after gap-closure plans 27-55..27-61, replacing round 10's record (preserved at `27-VERIFICATION-round10.md`).

## Independent Verification Method

Per the round-11 instructions, `27-REVIEW.md`'s two Critical findings were not taken on trust. Both
were independently reproduced this session against the current, committed `scripts/frontmatter.js`
(built fresh via `npm run build`, exit 0; `npm run freshness` confirms the committed `.js` matches a
fresh `tsc` rebuild with 0 drift across all 32 emitted files), using `/usr/bin/ruby -ryaml` (ruby
2.6.10 / psych 3.1.0 / libyaml 0.2.1) as the ground-truth loader — the same loader column the review
used. For CR-01, the regression claim was independently checked by running the identical document
against a `git archive 3c7930b` (pre-round-11) mirror. For CR-01's gate-level claim, a hermetic
`git archive HEAD` mirror was built, the exact review-documented shape was planted on the
non-coordinator `.claude/skills/grugops-map/SKILL.md` and its distribution twin `skills/map/SKILL.md`,
and the real `node scripts/check-foundation-guards.js` was run against that mirror directly by this
verification, not narrated from the review.

## Goal Achievement

### Observable Truths (by roadmap Success Criterion)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every scan set (`kit-model.ts` derived, asserted count; `WR05_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`, validator lists) resolves through the filesystem, no stale literal survives. (KIT-01, KIT-02) | ✓ VERIFIED | `node scripts/check-foundation-guards.js` on the unmodified tree → `PASS kit counts: derived 17 roles, 19 workflows, 7 skill adapters and 7 plugin-form skill adapters (expected 17 / 19 / 7 / 7)...` — run directly this session. Round 11 made no edits to `kit-model.ts` or any scan-set consumer. |
| 2 | The referential-integrity oracle fails RED against a broken tree and turns GREEN only when the three sets (coordinator grant, adapter directory, role corpus) are truly the same set — soundly, over any grant text the guard reads. (KIT-03) | ✗ FAILED | `guard_referential_integrity` PASSES on today's committed text (`PASS KIT-03: 17 roles == 17 adapters == 17 grant-closure names`), but its soundness claim rests on `scripts/frontmatter.ts` being total over YAML's block-scalar and alias grammar, which this session independently reproduced to be false in two ways (CR-01, a regression, reproduced end-to-end through the gate; CR-02, reproduced at the module level with a control ruling out the alternate explanation). See Gaps. |
| 3 | All 17 role adapters exist, are generated thin pointers (not copies), and a byte difference between a committed adapter and a fresh regeneration fails the freshness gate closed. (SPAWN-01, SPAWN-02) | ✓ VERIFIED | `ls .claude/agents/*.md` = 17. `node scripts/adapters-freshness.js` → exit 0, `0 byte difference(s), directory listings set-equal.` Unaffected by round 11 (round 10's live fail-closed spot-check stands; no plan in 27-55..27-61 touches the generator or freshness gate's logic — 27-60 touches only `tsconfig.tests.json`). |
| 4 | On Claude Code the coordinator runs main-thread so its grant is runtime-honored, and no non-coordinator adapter carries the `Agent` tool at all — a mechanism holding on both the main-thread and subagent paths. (SPAWN-03, SPAWN-04) | ✗ FAILED (SPAWN-04); NEEDS HUMAN/DEFERRED (SPAWN-03) | SPAWN-04's static mechanism (no `Agent` token in any non-coordinator adapter body — `guard_wr05` PASSES on today's committed text) is undermined by the same two live bypasses as KIT-03; CR-01's regression reaches the gate at exit 0 on a non-coordinator surface, independently reproduced end-to-end this session. SPAWN-03's runtime-honoring claim remains `UNKNOWN - verify`, explicitly and validly deferred to Phase 33 / GAP-D1 / CAP-01 (D-56 item 10, D-58 item 5) — not a phase-27 blocker per the round-context instructions and the project's own convention. |
| 5 | `guard_adapter_body` reds on pre-v2.0 prose; `orchestrator.md` stays below its 7570-byte FAIL ceiling; the v2.1.219+/depth-3 floor reads consistently everywhere. (SPAWN-05, SPAWN-06, SPAWN-07) | ✓ VERIFIED | `PASS SPAWN-05: 24 adapter bodies + 2 template body shapes checked; none carries retired relay vocabulary...`. `PASS agent-factory/roles/orchestrator.md 7090B within ceiling` (ceiling constant unchanged, `7570`, orchestrator.md itself unchanged by round 11). `grep` confirms consistent `v2.1.219`/`depth 3`/`v2.1.217-218` wording in `agent-factory/roles/orchestrator.md:88` and `.planning/REQUIREMENTS.md:36`, re-checked this session. |

**Score:** 3/5 roadmap success criteria cleanly verified; 2/5 (criteria 2 and 4) FAILED with independently reproduced evidence — same COUNT as round 10, but the underlying defects are two NEW instances (CR-01, CR-02) that round 11's own fix for round 10's three defects did not close, one of them a regression introduced by round 11's own fix.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | SPAWN-03's live-platform runtime confirmation | Phase 33 | ROADMAP.md standing-obligations table (GAP-D1); D-56 item 10 / D-58 item 5 in `27-CONTEXT.md`; `.planning/REQUIREMENTS.md` SPAWN-03 row. Byte-unchanged since round 10 (27-61 task 3 confirms this explicitly). |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/kit-model.ts` | Sole filesystem-derived authority for roles/workflows/adapters, asserted counts | ✓ VERIFIED | `guardKitCounts()` PASS confirms 17/19/7/7, executed this session; unedited by round 11. |
| `scripts/frontmatter.ts` | Total, format-aware frontmatter/spawn-grant parser — no silent no-grant over any YAML node-start shape | ✗ NOT TOTAL | Independently reproduced non-total this session: CR-01 (block-scalar indentation landmark taken from the header line instead of the parent node, one shape a confirmed regression against `3c7930b`, reproduced end-to-end through the gate) and CR-02 (fourth reference-refusal application point unwired at the sequence-item path, reproduced at the module level with a ruling-out control). Round 10's three defects (CR-01-new, CR-02, CR-03 in that round's numbering) are confirmed CLOSED this session — reproduction of the round-10 minimal repros against HEAD no longer triggers a silent no-grant. |
| `.claude/agents/*.md` (17 files) | Generated thin-pointer adapters, one coordinator grant, fresh-gated | ✓ VERIFIED | `adapters-freshness.js` exit 0; unaffected by round 11. |
| `scripts/check-foundation-guards.ts` | Runs `guard_wr05`, `guard_referential_integrity`, `guard_kit_counts`, `guard_adapter_body` and exits non-zero on any violation | ✓ VERIFIED on today's committed tree — bypassable via CR-01/CR-02 | `node scripts/check-foundation-guards.js` exits 0 with `ALL CHECKS PASSED` on the unmodified tree; independently reproduced this session to exit 0 on a hermetic mirror carrying a planted live grant via CR-01's regression shape, with a matched control run on the unplanted mirror confirming exit 0 there is the expected baseline (i.e. the planted document, not the harness, is what should have failed). |
| `.planning/REQUIREMENTS.md` | Accurate traceability for KIT-01..03, SPAWN-01..07 | ✓ VERIFIED (accurate as of this reading) | KIT-03, SPAWN-04 correctly `[ ]`/Gaps Found held pending this verification (D-58, and 27-61's traceability-hold task explicitly declined promotion); SPAWN-03 correctly `[ ]`/Gaps Found with Phase-33 deferral cited, byte-unchanged; the other 7 rows correctly `[x]`/Complete. Table and checkboxes read from disk this session and agree for all ten rows. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `check-foundation-guards.ts` | `kit-model.ts` | direct import, derived counts | ✓ WIRED | Confirmed by guard PASS line naming derived counts this session. |
| `check-foundation-guards.ts` (`guard_wr05`, `guard_referential_integrity`) | `frontmatter.ts` (`hasSpawnGrant`, `grantedAgentNames`) | direct import, shared code path | ✓ WIRED, still unsound | Both guards read the same non-total parser; confirmed by this session's own module-level and gate-level reproductions of CR-01 and CR-02. |
| `install/kit-source.ts` | `kit-model.listAgentAdapters` | stated policy authority | ✓ WIRED | Unaffected by round 11. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Committed `.js` matches a fresh `tsc` rebuild (no drift) | `npm run freshness` | exit 0, `All build outputs fresh: 32 committed .js file(s) match a fresh tsc rebuild.` | PASS |
| `tsc` build and typecheck both exit clean | `npm run build`; `npm run typecheck` | both exit 0 | PASS |
| Foundation gate passes on the real, unmodified tree | `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED` | PASS |
| Regression suite is green (does not detect the live bypasses) | `npx vitest run --exclude '**/scripts/e2e/**'` | `35 files, 1346 passed, 2 skipped, 0 failed`, 136.39s | PASS on its own terms — confirmed this session NOT to catch CR-01/CR-02 |
| CR-01 reproduced at the module level, HEAD vs pre-round | `hasSpawnGrant` on the review's minimal repro (`>-2` header under a bare dash, comment-truncated grant line) | HEAD: `{"ok":true,"value":false}` (silent no-grant). `git archive 3c7930b` mirror: `{"ok":true,"value":true}`, `grantedAgentNames: ["grugops-orchestrator"]` | CONFIRMED live silent no-grant AND confirmed regression |
| CR-01 reproduced end-to-end at the gate | plant the same shape on hermetic `git archive HEAD` mirror's `.claude/skills/grugops-map/SKILL.md` + `skills/map/SKILL.md`, run `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, exit 0; ruby loads `allowed-tools` as `["  Read, Write, Bash, Glob, Grep,\n # x, Agent(grugops-orchestrator)"]` | CONFIRMED live bypass through the full gate |
| CR-02 reproduced at the module level | `hasSpawnGrant` on `_x: [{k: &a Agent(grugops-orchestrator)}]`, `allowed-tools: [{j: *a}]` | module `{"ok":true,"value":false}`; ruby loads `allowed-tools` as `[{"j"=>"Agent(grugops-orchestrator)"}]` | CONFIRMED live silent no-grant |
| Round-10's three defects (this round's own CR-01/CR-02/CR-03 numbering) confirmed CLOSED | re-ran round-10 VERIFICATION.md's three module-level minimal repros against HEAD | all three now match the loader (no silent no-grant, no false grant) | CONFIRMED closed |
| No unreferenced debt markers in phase-modified scripts | `grep -nE "TBD|FIXME|XXX"` over `scripts/frontmatter.ts`, `tsconfig.tests.json`, `package.json`, `.github/workflows/ci.yml` | Only `U+XXXXX` Unicode-label placeholders (false positives, confirmed by reading context — same false-positive class round 10 also ruled out) | PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | REQUIREMENTS.md State | Verified Status | Evidence |
|---|---|---|---|---|---|
| KIT-01 | 27-01, 27-03, 27-54, 27-61 | `kit-model.ts` sole filesystem-derived authority | `[x]` Complete | SATISFIED | `guardKitCounts()` PASS |
| KIT-02 | 27-01..27-13, 27-46, 27-53, 27-54, 27-61 | Every guard/validator scan set derives from `kit-model.ts` | `[x]` Complete | SATISFIED | Same as above |
| KIT-03 | 27-01, 27-07, 27-12, 27-18, 27-19, 27-47..27-61 | Referential-integrity oracle, RED-then-GREEN, sound closure | `[ ]` Gaps Found | BLOCKED | CR-01 (regression, gate-reproduced) and CR-02 (module-level, control-confirmed) both reach the same closure-computation path |
| SPAWN-01 | 27-06, 27-07, 27-15, 27-53, 27-60 | 17 generated thin-pointer adapters | `[x]` Complete | SATISFIED | `adapters-freshness.js` set-equal, 17/17 |
| SPAWN-02 | 27-07, 27-11, 27-50, 27-61 | `adapters-freshness.ts` fail-closed byte gate | `[x]` Complete | SATISFIED | Unaffected by round 11 |
| SPAWN-03 | 27-09, 27-16, 27-17, 27-50, 27-54, 27-61 | Coordinator wired main-thread, runtime-honored grant | `[ ]` Gaps Found | NEEDS HUMAN (deferred to Phase 33, dated decision) | Runtime half `UNKNOWN - verify`, byte-unchanged this round |
| SPAWN-04 | 27-08, 27-12, 27-18, 27-47..27-61 | Non-coordinator adapters omit `Agent` tool entirely as a live mechanism | `[ ]` Gaps Found | BLOCKED | CR-01's regression reaches the gate end-to-end on a non-coordinator surface |
| SPAWN-05 | 27-08, 27-14, 27-61 | `guard_adapter_body` reds on pre-v2.0 prose | `[x]` Complete | SATISFIED | `PASS SPAWN-05` this session |
| SPAWN-06 | 27-05, 27-61 | `orchestrator.md` below 7570B ceiling | `[x]` Complete | SATISFIED | 7090B, ceiling and file unchanged |
| SPAWN-07 | 27-05, 27-21, 27-61 | Depth-3/v2.1.219+ floor documented consistently | `[x]` Complete | SATISFIED | grep confirms consistent wording |

No orphaned requirements found — `.planning/REQUIREMENTS.md`'s Phase 27 row (KIT-01..03, SPAWN-01..07)
matches the union of all seven round-11 plans' `requirements:` frontmatter (27-55..27-59: KIT-03,
SPAWN-04; 27-60: KIT-03, SPAWN-01; 27-61: all ten IDs explicitly).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/frontmatter.ts` | `openBlock` :2061-2092, specifically :2067 and :2074-2075; call sites :2350, :2426 | Block-scalar indentation landmark taken from the physical header line's indent instead of the parent node's indentation (CR-01) | 🛑 Blocker | Regression against `3c7930b` at one of three affected shapes; reproduced end-to-end through the gate with a live grant on a non-coordinator adapter reaching `ALL CHECKS PASSED`, exit 0. |
| `scripts/frontmatter.ts` | `mappingSeparatorNodeStarts` :751-765, single call site :2447-2450; item-path reference test :2317 | D-61's fourth reference-refusal application point wired into only one of `blockHeaderAt`'s two call sites (CR-02) | 🛑 Blocker | A resolvable alias through a sequence item's compact mapping reaches a silent no-grant; module-level reproduction confirmed with a ruling-out control. |
| `scripts/frontmatter.ts` | `deferred-items.md:3024` register row | WR-01: the "module GRANT the loader does not have" direction is still live at 48 loader-accepted cells; register records it FIXED | ⚠️ Warning | Same root cause as CR-01; a false RED (spurious grant) rather than a hole, so not independently gate-blocking, but the register overstates closure. |
| `scripts/frontmatter.test.ts` | `AXIS_HEADER_INDICATOR_FORM` :8614-8621; eight declaring shapes :8191-8507 | WR-02: corpus grew but gained no indentation axis and no explicit-digit axis — the two dimensions CR-01 lives in | ⚠️ Warning | Corpus cannot spell either live defect's input; explains why both shipped green. |
| `scripts/frontmatter.ts` | :2133 (`raw.trim()`), consumed :2214-2216 | WR-03: a more-indented content line loses its own leading whitespace inside a block scalar | ⚠️ Warning | Value divergence from the loader with no constructible name/verdict consequence measured this round. |
| `tsconfig.tests.json` | :22 | WR-04: hand-copies `tsconfig.json`'s exclude list instead of deriving/asserting it | ⚠️ Warning | Latent set-literal-drift risk; live today (36/36 files reached, typecheck exits 0) but no fail-closed assertion pins the relationship. |
| — | — | No unreferenced `TBD`/`FIXME`/`XXX` debt markers found in any file this round modified | — | — |

CR-01 and CR-02 have no `#issue` / `PR#` / `DEF-*` reference attached — they are live, unresolved
defects in the phase's central invariant, not deferred work items, so they are BLOCKERs per the
debt-marker gate's own logic (this is not a marker at all, it is an unmitigated defect, independently
reproduced by this verification rather than taken from the review's narrative).

### Human Verification Required

1. **SPAWN-03 live-platform capture** (formally deferred to Phase 33 / GAP-D1 / CAP-01, not a Phase 27 blocker, but the underlying claim is still open)
   - **Test:** Start a real Claude Code session with `claude --agent grugops-orchestrator` (or equivalent main-thread wiring) and observe whether the Orchestrator's `Agent(<allowlist>)` grant is runtime-enforced.
   - **Expected:** The coordinator successfully delegates via `Agent`; a spawned role subagent has no `Agent` tool available to it.
   - **Why human:** Live-platform runtime behavior; no static grep or gate can confirm it. Explicitly deferred, dated, and owned (D-56 item 10, D-58 item 5).

### Gaps Summary

Round 11 closed real defects with strong, independently-reproducible evidence: this session confirmed
all three of round 10's defects (this round's own CR-01/CR-02/CR-03 numbering: the sticky `sawBlock`
exemption, the node-property-before-block-indicator gap at the continuation path, and the `KEY_LINE`
reuse for nested keys) are genuinely fixed by re-running round 10's own minimal repros against HEAD and
confirming the loader and the module now agree. The kit-set-authority half of the goal (KIT-01/KIT-02),
adapter generation and freshness gating (SPAWN-01/SPAWN-02), adapter-body/ceiling/floor hygiene
(SPAWN-05/SPAWN-06/SPAWN-07), and the round's own traceability hold (REQUIREMENTS.md's ten
checkbox/table-cell pairs read from disk and agree with each other) all verify cleanly.

However, the phase's central invariant — **the spawn-grant predicate is total: no YAML document can
carry a live `Agent(<name>)` grant that reaches the gate as a silent no-grant** — is *still* not
achieved, for the eleventh consecutive gap-closure round. This round's own fix for the previous three
bypasses (`27-58`'s block-scalar indentation rework) introduced a brand-new regression (CR-01) in the
same code path it repaired, and one further, previously-uncatalogued node-start shape (CR-02) reaches
the same non-total parser. This verification did not take the code review's word for either: both were
independently reproduced at the module level, CR-01's regression claim was independently checked
against a pre-round-11 mirror, and CR-01's gate-level claim was independently reproduced end-to-end by
this verification, planting the exact shape on a hermetic mirror's non-coordinator adapter and its
distribution twin and watching `node scripts/check-foundation-guards.js` print `ALL CHECKS PASSED` at
exit 0 over a live `Agent(grugops-orchestrator)` grant plainly present in the ruby/psych-loaded value.
A green regression suite (1346 passed / 2 skipped, confirmed run this session), clean `tsc` build and
typecheck, and a clean freshness check do not detect either defect — consistent with the project's own
recorded lesson across all ten prior rounds.

KIT-03 and SPAWN-04 correctly remain `[ ]`/Gaps Found in REQUIREMENTS.md per the round's own D-58
convention — 27-61's own traceability-hold task explicitly declined to promote them, and this
verification confirms that hold was correct. SPAWN-03 remains a validly deferred, dated, owned item
(Phase 33 / GAP-D1 / CAP-01) and is not counted as a phase-27 blocker.

**Net assessment:** the phase goal — "role agents actually execute... and every guard/validator scan
set is derived... so they land inside the guards" — is not fully achieved. The kit-set-authority half
(KIT-01/KIT-02) is solid and has been solid across rounds. The spawn-correctness half (the guards
genuinely catching every live grant, with no silent no-grant) is not: this round closed three live
bypasses and, in the course of fixing one of them, introduced a fourth, while a fifth (CR-02) that
should have been closed alongside its sibling site was not.

---

_Verified: 2026-08-10T20:30:00Z_
_Verifier: Claude (gsd-verifier)_

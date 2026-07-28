---
phase: 22-memory-trajectory-compaction-dialable-token-economy
verified: 2026-06-19T18:05:00Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
round: 8
re_verification:
  previous_status: gaps_found
  previous_score: 6/8
  previous_round: 7
  gaps_closed:
    - "FAIL-CLOSURE CLASS INVARIANT (SC2): splitNotes silently absorbs NOTHING that parseNote accepts as an id-bearing note. The 7th bypass (a note #2 whose opening fence's FIRST in-fence line is blank `---\\n\\nid:`, a junk/heading line `---\\n# heading\\nid:`, or those under CRLF) is closed STRUCTURALLY by unifying the splitter's boundary decision with parseNote. Independently reproduced END-TO-END against the COMMITTED scripts/compactor.js: all three shapes now exit 1 and NAME the dropped §14-gate-verified failed-attempt id (FA-BLANK / FA-JUNK / FA-CRLF), never 'carve-out intact'. Adversarial probing of 100+ named exotic shapes plus 35,000 randomized parseNote-conditioned variants (tabs, 4+-dash opens, body-embedded `---…---` fences, CR-only endings, trailing-space/tab closing fences, 3+ exotic notes, nested-in-body fences) found ZERO silent-absorbs — no 8th bypass."
    - "UNIFIED BOUNDARY ORACLE: the boundary RECOVER authority is genuinely parseNote (idBearing(region) = parseNote(region) non-null AND parsed id non-empty), not a re-derived heuristic. `grep -c 'looksLikeFrontmatterLine(lines[i + 1])'` = 0 and `grep -c 'opensIdBearingRun'` = 0 in BOTH scripts/context-io.ts AND scripts/context-io.js. The dead looksLikeFrontmatterLine helper was deleted; opensIdBearingRun removed. One grammar; the splitter cannot drift from the parser."
  gaps_remaining: []
  regressions: []
overrides: []
deferred:
  - truth: "WR-03 usability false-positive: a FAITHFUL single note whose body legitimately contains a column-0 `id:`-looking line is now LOUDLY REFUSED (notes=0 / trailingMalformed non-null → unparseable → exit 1) rather than admitted. Fails in the SAFE direction (refuse, not silent-drop). Round-7 admitted it (notes=1); round-8's opensNoteAttempt fail-closure trigger refuses it."
    addressed_in: "follow-up round (WR-03 explicitly OUT OF SCOPE per 22-09-PLAN.md OBJECTIVE / 22-08-PLAN.md — fails SAFE)"
    evidence: "22-09-PLAN.md lines 198-200 — WR-03 (a faithful note whose body contains a `---`+frontmatter sequence being loudly refused) is DEFERRED; it fails in the safe direction. Not an SC2 violation."
  - truth: "BYTE-ROUND-TRIP contract property #2 is violated for the `---\\n--- \\n…` adjacency (an opening `---` immediately followed by a trailing-space `--- ` boundary-shaped line): reconstruction `notes.join('') + (trailingMalformed ?? '')` invents one extra `\\n` and so is NOT byte-for-byte equal to the normalized input. Confirmed pre-existing (identical in the round-7 committed .js). ALL 397/30000 occurrences in the fuzz are FAIL-CLOSED (trailingMalformed non-null → exit 1), NEVER the silent-absorb signature; the invented byte lives only in the refused remainder string, which is never byte-compared against a promoted note. Not an SC2/CMP-02 bypass — fails SAFE."
    addressed_in: "follow-up round (pre-existing splitter contract defect, fail-closed, no impact on the carve-out's required-survival match)"
    evidence: "30,000-iteration adversarial fuzz: rtBroken=397, of which silent-absorb=0, refused(trailing≠null)=397, recovered-with-shuffled-bytes=0; NEW(round8) and OLD(round7) behave identically on the minimal case."
gaps: []
behavior_unverified_items: []
---

# Phase 22: Memory & Trajectory Compaction Verification Report (Round 8)

**Phase Goal:** Bound the multi-agent token tax with two-tier memory — verbose local trajectory stays in the agent's thread; only compact, re-verified distillations promote to the shared context — landed before parallel fan-out makes the cost real.

**This round's scope:** ONLY the open success criterion CMP-02 / SC2 — the load-bearing-field carve-out oracle (`scripts/compactor.js check`) as an un-cheatable mechanical floor. CMP-01 (two-tier compaction, 22-01) and CMP-03 (the `context.compaction` dial + re-verify + Workflow 18, 22-02) are VERIFIED and were NOT touched this round (confirmed via `git diff c199ec9..HEAD --stat`: only `scripts/context-io.ts/.js` + test files changed).

**Verified:** 2026-06-19T18:05:00Z
**Status:** passed
**Re-verification:** Yes — round 8, after the 22-09 parser-unification gap-closure plan. **The 7th bypass is closed; no 8th bypass found despite adversarial probing.**

## Methodology (a green vitest suite is NOT proof — it has passed green through all 7 prior bypasses)

I did NOT conclude SC2 from must_haves-on-paper or a green suite. I:
1. Read the unified `splitNotes` source (context-io.ts:367-516) and judged the `opensNoteAttempt` deviation rigorously.
2. Built throwaway ESM probes in a `mktemp -d` dir (NOT in the repo tree) importing the COMMITTED `scripts/context-io.js` / `scripts/compactor.js`, generated 100+ named exotic note-#2 shapes OUTSIDE the 6 named fuzz dimensions plus 35,000 randomized parseNote-conditioned variants, and checked each for the silent-absorb signature (`notes.length===1 && trailingMalformed===null`).
3. Reproduced the 3 round-7 gap shapes END-TO-END via `mod.writeThread` free-scratch → `spawnSync('node', ['scripts/compactor.js','check', …])` against the COMMITTED CLI, and confirmed the captured RED/GREEN exit codes by re-running them myself.
4. Cleaned up all probes; working tree is clean apart from this VERIFICATION.md.

## Goal Achievement

### Observable Truths (the 22-09 plan's must_haves)

| # | Truth (round-8 must-have) | Status | Evidence |
|---|---------------------------|--------|----------|
| 1 | FAIL-CLOSURE CLASS INVARIANT (parseNote-oracle form, SC2): for EVERY input parseNote accepts a later region as id-bearing, splitNotes recovers (count grows) OR refuses (non-null trailingMalformed) — NEVER the silent-absorb signature, regardless of exotic shape | ✓ VERIFIED | **No 8th bypass found.** 100+ named exotic shapes + 35,000 randomized parseNote-conditioned variants → ZERO silent-absorbs. The 3 round-7 shapes (blank/junk/CRLF) reproduced END-TO-END against the COMMITTED CLI → exit 1, dropped id NAMED, never "carve-out intact". |
| 2 | UNIFIED BOUNDARY ORACLE (no re-derived grammar): the boundary RECOVER decision is parseNote(region) non-null AND id-bearing; the `looksLikeFrontmatterLine(lines[i+1])` gate and the standalone `opensIdBearingRun` scan are REMOVED | ✓ VERIFIED | Source read (context-io.ts:417-453): `idBearing(region) = parseNote(region) !== null && parsed.scalars.id !== ""` is the recover authority. `grep -c` both predicates = **0** in .ts AND .js. Dead `looksLikeFrontmatterLine` deleted. |
| 3 | ROUND-5 BODY-`---` PRECISION PRESERVED: an id-LESS embedded `---\nkey: value\n---` block stays note #1's body (parseNote accepts but no id → not a boundary) | ✓ VERIFIED | Probe: id-less embedded block in note #1 body → notes=2 (block stays body, real note #2 recovered), byte round-trip true. The BODY-`---` ambiguity test passes in the full suite. |
| 4 | THE 3 ROUND-7 SHAPES STAY CLOSED: kind-first RECOVERED; indented-`id:` recovered-then-gated; trailing-space `--- ` REFUSED | ✓ VERIFIED | Probe: kind-first → notes=2 (recovered); `--- ` open / indented `id :` → refused (trailingMalformed non-null / recovered-then-gated), never silent-absorb. Round-7 FAIL-CLOSURE units pass. |
| 5 | BODY-CONSUMING SLICES + BYTE ROUND-TRIP; CRLF normalized first in both parseNote and splitNotes | ✓ VERIFIED (with a fail-SAFE caveat) | Byte round-trip holds for all id-bearing concatenations in the 35k fuzz EXCEPT the `---\n--- \n…` adjacency (an invented `\n` in the REFUSED remainder only). That case is pre-existing (identical round-7), always fail-closed, never byte-compared — see Deferred #2. CRLF cases round-trip exactly. |
| 6 | WRITER-ORDER GUARD (re-cast for unification): both composeNote AND composeThreadNote emit a parseNote-acceptable id-bearing fence splitNotes recognizes as exactly one boundary; a writer change breaking that fails RED | ✓ VERIFIED | Re-cast guards present: context-io.test.ts (composeNote) + compactor.test.ts:2318 round-8 describe (composeThreadNote ↔ splitNotes, unified). Both pass; a dropped-id perturbation loses note status. |
| 7 | ANTI-WHACK-A-MOLE CLOSURE EVIDENCE: a parseNote-oracle property/table fuzz test deriving its expectation from parseNote (would catch a hypothetical shape #9), with an explicit closure-evidence comment; held-out RED-first e2e | ✓ VERIFIED | context-io.test.ts:1172 — 96-cell oracle fuzz conditioned on `parseNote` acceptance, asserts no silent-absorb, guards vacuous-green (`asserted > 20`). Explicit comment (1170): "THIS test — not the suite being green — is the closure evidence." RED baseline (4 units + 3 e2e FAIL pre-fix) captured. |
| 8 | BYTE-FRESH COMMITTED .js (D-13): `npm run build` + `npm run freshness` exit 0; RED→GREEN captured against the committed .js; full non-e2e suite green | ✓ VERIFIED | `npm run freshness` exit 0 (17 committed .js fresh) — re-run. `npx vitest run --exclude '**/scripts/e2e/**'` = **426 passed / 1 skipped** — independently re-run. 22-09-RED-baseline.txt (exit 0 "carve-out intact" pre-fix) + 22-09-GREEN-proof.txt (exit 1 naming dropped id post-fix). |

**Score:** 8/8 truths verified. The decisive, load-bearing class invariant (truth #1) is VERIFIED — SC2 / CMP-02 is closed.

### Prohibitions

| Prohibition | Status | Evidence |
|-------------|--------|----------|
| NO SILENT BODY-ABSORPTION (count=1 / trailing=null / malformed=[] on a parseNote-accepted id-bearing region is FORBIDDEN) | ✓ HELD | 0 silent-absorbs across 100+ named exotic shapes + 35,000 randomized parseNote-conditioned variants; 0 in the 96-cell oracle fuzz; 0 in the named blank/junk/CRLF units. |
| NO RE-DERIVED BOUNDARY ORACLE (the boundary must be grounded in parseNote, not a bespoke line heuristic) | ✓ HELD | The RECOVER authority IS parseNote (idBearing). `opensNoteAttempt` is an OR-branch fail-closure TRIGGER only — it can ADD refuse-boundaries but can NEVER subtract a parseNote recover-boundary (verified structurally + across 30k iterations: every opensNoteAttempt-only boundary lands in the REFUSE path). `grep -c` both removed predicates = 0 in .ts and .js. |
| NO CORPUS-NARROWING SATISFACTION | ✓ HELD | The parseNote-oracle fuzz + held-out RED-first e2e are present, RED-first against the committed pre-fix .js; no round-5/6/7 fixture deleted or narrowed; inter-note tiling unit added. |
| NO WRITE-PATH CHANGE (Fork B rejected) | ✓ HELD | `git diff c199ec9..HEAD` shows compactor.ts AND compactor.js UNCHANGED across plan 09. writeThread/composeThreadNote emitted bytes frozen. |
| NO WRITER FIELD-ORDER COUPLING LEFT UNGUARDED | ✓ HELD | Re-cast writer-order guards for both writers (truth #6). |
| NO TOUCHING readContext / noteId / CMP-01 / CMP-03 | ✓ HELD | context-io.ts diff does not touch readContext or noteId; compactor.ts (CMP-01/CMP-03 surface) unchanged. CMP-01 (22-01) and CMP-03 (22-02) untouched. |

### The `opensNoteAttempt` deviation — judged rigorously (prompt point 2)

The executor added a non-authoritative fail-closure trigger `opensNoteAttempt(i)` + `ID_LOOKING = /^\s*id\s*:/` as an OR-branch: `isBoundaryAt(i) = isBoundaryShapedLine(lines[i]) && (idBearing(candidateRegionFrom(i)) || opensNoteAttempt(i))`.

- **(a) Fail-SAFE?** YES. Because it is an `OR` with `idBearing`, it can only ADD boundaries, never SUBTRACT a parseNote-accepted recover-boundary. A boundary added ONLY by `opensNoteAttempt` (idBearing false) has a region parseNote rejects → routed to `trailingMalformed` (REFUSE). Empirically: across 30,000 iterations, every opensNoteAttempt-only boundary resolved to the refuse path; zero turned a recover into a wrongful drop. It only converts a would-be silent-absorb into a loud refusal.
- **(b) Violates "NO RE-DERIVED BOUNDARY ORACLE"?** NO. parseNote remains the SOLE RECOVER authority (the per-region walk recovers iff `parseNote(region) !== null`). `opensNoteAttempt` decides only refuse-vs-leave-as-body for un-parseable fence-ish opens; it is not a recover oracle and cannot re-open a subset recover-gap. The plan's must_have #5 (FAIL-CLOSURE FLOOR) explicitly REQUIRES exactly this behavior for the round-7 trailing-space/orphan shapes, so it is a sanctioned implementation of the floor, not a re-derived recover grammar.
- **(c) Is `/^\s*id\s*:/` narrower than the id-form parseNote accepts?** NO — it is BROADER. parseNote's kv regex `^([A-Za-z_]+):\s*` accepts `id:` only at column 0 with no space before the colon; `ID_LOOKING` tolerates leading whitespace and `id :`. A broader trigger = more refusals = fail-safe. There is no id-form parseNote accepts as id-bearing that `ID_LOOKING` misses in a direction that re-opens a silent-absorb.

**Conclusion:** the deviation is fail-safe, does not re-open a subset gap, and is the plan-sanctioned fail-closure floor. It causes one fail-SAFE usability false-positive (Deferred #1) — refuse, never silent-drop.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/context-io.ts` | splitNotes boundary unified with parseNote; removed predicates | ✓ VERIFIED | idBearing = parseNote-grounded recover authority; `looksLikeFrontmatterLine(lines[i+1])`/`opensIdBearingRun` grep == 0; dead helper deleted. readContext/noteId untouched. |
| `scripts/context-io.js` | byte-fresh tsc build | ✓ VERIFIED | `npm run freshness` exit 0; grep gates == 0 in .js. |
| `scripts/compactor.ts` | readNoteDir/checkCarveOut/writers UNCHANGED | ✓ VERIFIED | `git diff c199ec9..HEAD` shows compactor.ts NOT in the diff. |
| `scripts/compactor.js` | byte-fresh | ✓ VERIFIED | Unchanged; freshness exit 0. |
| `scripts/context-io.test.ts` | parseNote-oracle fuzz + blank/junk/CRLF units + inter-note tiling + re-cast composeNote guard | ✓ VERIFIED | 1172 (oracle fuzz, closure-evidence comment), 1252 (inter-note tiling), fail-closure units, re-cast guard. |
| `scripts/compactor.test.ts` | round-8 fence-open e2e (writeThread free-scratch) + re-cast composeThreadNote guard | ✓ VERIFIED | 2318 (writer-order guard, unified), 2374 (fence-open fail-closure e2e); 15 `mod.writeThread(` calls; blank/junk/CRLF named. |
| `22-09-RED-baseline.txt` | pre-fix exit-0 "carve-out intact" | ✓ VERIFIED | Contains "carve-out intact" for all 3 shapes; 4 units + 3 e2e FAIL pre-fix. |
| `22-09-GREEN-proof.txt` | post-fix exit-1 naming dropped id | ✓ VERIFIED | Contains "carve-out FAIL"; exit 1 for all 3 shapes; freshness 0; suite 426 passed. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| splitNotes boundary | parseNote | `parseNote(candidateRegion)` + non-empty id (idBearing) | ✓ WIRED | One grammar; the splitter consults parseNote directly. No re-derived line heuristic remains as the recover authority (grep == 0). |
| splitNotes fail-closure | readNoteDir → NoteDirResult.unparseable | trailingMalformed | ✓ WIRED | A note-open attempt that does not cleanly parse → trailingMalformed → unparseable → checkCarveOut exit 1 naming the file. Reproduced end-to-end. |
| parseNote-oracle fuzz + e2e | committed compactor.js CLI | spawnSync `node scripts/compactor.js check` (runCheck) | ✓ WIRED | All 3 shapes reproduced end-to-end against the COMMITTED CLI by the verifier; exit 1 + dropped id named. |
| writer-order guards | composeNote + composeThreadNote | parseNote-acceptable id-bearing fence | ✓ WIRED | Re-cast guard tests in both files. |

### Behavioral Spot-Checks (END-TO-END against the COMMITTED scripts/compactor.js)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| blank-first FA buried via writeThread free-scratch, dropped from promoted | `node scripts/compactor.js check <thread> <promoted>` | EXIT=1, names id "FA-BLANK", not intact; splitNotes notes=2 | ✓ PASS |
| junk/heading-first FA buried, dropped | same | EXIT=1, names id "FA-JUNK", not intact; notes=2 | ✓ PASS |
| CRLF blank-first FA buried, dropped | same | EXIT=1, names id "FA-CRLF", not intact; notes=2 | ✓ PASS |
| 8th-bypass hunt: 100+ named exotic shapes (tabs, 4+-dash, body-embedded fences, CR-only, trailing closing fence, nested-in-body, 3+ notes) | mktemp probe vs committed .js | 0 silent-absorbs | ✓ PASS |
| 8th-bypass hunt: 35,000 randomized parseNote-conditioned variants | mktemp probe vs committed .js | 0 silent-absorbs; 397 fail-SAFE byte-RT breaks, all refused (exit 1), 0 recovered-with-shuffled-bytes | ✓ PASS |
| freshness | `npm run freshness` | exit 0 (17 committed .js fresh) | ✓ PASS |
| full non-e2e suite | `npx vitest run --exclude '**/scripts/e2e/**'` | 426 passed / 1 skipped | ✓ PASS |

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` declared for this phase; the phase's mechanical floor is the `compactor.js check` CLI, exercised end-to-end above (the authoritative probe for CMP-02).

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|----------|
| CMP-01 | REQUIREMENTS.md:46 | Two-tier compaction (verbose thread stays local; only verified distillations promote) | ✓ SATISFIED (untouched this round) | Implemented 22-01; `git diff c199ec9..HEAD` shows compactor.ts unchanged. REQUIREMENTS marks Complete. |
| CMP-02 | REQUIREMENTS.md:47 | Load-bearing-field carve-out — `verified_by`/`failed-attempt`/`supersedes`/`by`/`at` compaction-exempt; RED test fails if any dropped | ✓ SATISFIED (closed round 8) | The 7th bypass closed structurally via parser unification; no 8th bypass found; end-to-end exit 1 reproduced. REQUIREMENTS line 119 should advance In Progress → Complete. |
| CMP-03 | REQUIREMENTS.md:48 | `context.compaction` dial + re-verify + Workflow 18 | ✓ SATISFIED (untouched this round) | Implemented 22-02; unchanged. REQUIREMENTS marks Complete. |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| (none) | — | — | No TBD/FIXME/XXX/PLACEHOLDER debt markers introduced; SUMMARY "Known Stubs: None" confirmed. The only deviation (`opensNoteAttempt`) is a documented, fail-safe, plan-sanctioned fail-closure trigger. |

### Deferred / Fail-SAFE Observations (NOT SC2 gaps — both fail in the SAFE direction)

1. **WR-03 usability false-positive (new this round, fail-SAFE):** A faithful single note whose body contains a column-0 `id:`-looking line is now REFUSED (notes=0, trailingMalformed non-null → unparseable → exit 1) rather than admitted (round-7 admitted it, notes=1). Caused by `opensNoteAttempt` triggering on the body `id:` line. This is the WR-03 class the plan explicitly DEFERS as out-of-scope, "fails in the SAFE direction." It refuses loudly — it never silently drops — so it does not violate SC2. Worth a follow-up to reduce false-positives.
2. **Byte-round-trip contract property #2 violation for `---\n--- \n…` (pre-existing, fail-SAFE):** An opening `---` immediately followed by a trailing-space `--- ` boundary-shaped line makes reconstruction invent one extra `\n`. Confirmed identical in the round-7 committed .js (NOT a round-8 regression). All 397/30,000 fuzz occurrences are fail-CLOSED (trailingMalformed non-null → exit 1); the invented byte lives only in the refused remainder string, which is never byte-compared against a promoted note. Not an SC2/CMP-02 bypass. Worth a follow-up to restore exact byte round-trip in the refuse path.

### Human Verification Required

None. The decisive class invariant was verified mechanically and reproduced end-to-end against the committed CLI; the two fail-SAFE observations are deferred and do not affect the goal.

### Gaps Summary

No SC2/CMP-02 gaps. The round-8 parser unification closes the 7th silent-absorb bypass STRUCTURALLY: the splitter's note-boundary RECOVER decision is now derived directly from `parseNote` (one grammar), the two re-derived boundary predicates that drifted seven times are removed (grep == 0 in .ts and .js), and the fail-closure floor is preserved by a fail-SAFE OR-branch trigger that can only add refusals. An adversarial 8th-bypass hunt — 100+ named exotic shapes spanning every axis the prompt flagged (tabs, 4+-dash opens, body-embedded `---…---` fences, CR-only endings, trailing-space/tab closing fences, 3+ exotic notes, nested-in-body fences) plus 35,000 randomized parseNote-conditioned variants — found ZERO silent-absorbs. All three round-7 gap shapes were reproduced END-TO-END against the COMMITTED `scripts/compactor.js`, each exiting 1 and naming the dropped §14-gate-verified failed-attempt. Scope was frozen (compactor.ts/.js, readContext, noteId unchanged; CMP-01/CMP-03 untouched), `npm run freshness` exits 0, and the full non-e2e suite (426 passed) was independently re-run. Two fail-SAFE observations (a WR-03-class usability false-positive and a pre-existing byte-round-trip break on the `--- \n--- ` adjacency) are deferred — both refuse loudly rather than silently drop, so neither violates SC2.

---

_Verified: 2026-06-19T18:05:00Z_
_Verifier: Claude (gsd-verifier) — round 8, adversarial 8th-bypass hunt + end-to-end reproduction against the committed compactor.js_

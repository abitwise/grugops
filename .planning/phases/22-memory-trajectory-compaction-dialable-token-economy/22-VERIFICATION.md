---
phase: 22-memory-trajectory-compaction-dialable-token-economy
verified: 2026-06-19T16:40:00Z
status: gaps_found
score: 6/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
round: 7
re_verification:
  previous_status: gaps_found
  previous_score: 6/8
  previous_round: 6
  gaps_closed:
    - "splitNotes/parseNote DRIFT (the 6th bypass) is closed for the THREE plan-named shapes: a kind-first note #2 is RECOVERED (count=2), an indented-`id:` note #2 is RECOVERED then refused downstream by checkCarveOut gate (a), and a trailing-space `--- ` boundary note #2 is REFUSED (count=1 + non-null trailingMalformed → unparseable). Independently re-confirmed against the committed scripts/context-io.js — none of the three silently absorbs. The `/^id:/`-only boundary key is gone; a shared exported `isRecognizedFrontmatterLine` predicate now backs the parser's malformed decision and the splitter's frontmatter-looking test."
    - "Writer-order guard: a structural test now pins BOTH composeNote and composeThreadNote field order to the splitter (a future reorder fails RED), closing the unguarded coupling the round-6 verifier refused to certify."
    - "Test #3 replaced with a discriminating RED-first non-boundary-remainder-after-note-#2 case (refused naming <agent>.md), with the safe-non-goal comment for trailing free scratch present."
    - "Byte-fresh committed .js (D-13): npm run freshness exits 0 (17 committed .js fresh); full non-e2e suite 418 passed / 1 skipped / 0 failed — independently re-confirmed."
  gaps_remaining:
    - "A 7th DISTINCT CMP-02 silent-absorb bypass (SAME class as the 6th): a note #2 whose fence OPENS with a leading blank line (`---\\n\\nid: …`) or a leading junk line (`---\\n# heading\\nid: …`) is parsed CLEAN by parseNote (non-null, no malformedLines) yet is NOT recognized as a boundary by splitNotes, so it folds silently into note #1's body (count=1, trailingMalformed=null, malformedLines=[]). A §14-gate-verified failed-attempt buried this way is dropped from the promoted set and `node scripts/compactor.js check` exits 0 'carve-out intact'. Root cause: isBoundaryAt requires looksLikeFrontmatterLine(lines[i+1]) — the line IMMEDIATELY after `---` — but opensIdBearingRun and parseNote BOTH tolerate a leading blank/junk line before `id:`. The boundary heuristic is again NARROWER than parseNote's actual fence grammar. Reproduced at the splitNotes unit level AND end-to-end through the committed CLI (transcripts below). Also reproduces with CRLF line endings."
  regressions: []
gaps:
  - truth: "FAIL-CLOSURE CLASS INVARIANT: splitNotes silently absorbs NOTHING fence-ish — a fence-ish region is EITHER recovered as a parsed note OR loudly refused, NEVER silently swallowed into a prior note's body, regardless of which exotic shape an adversary picks (must_have truth #1; prohibition 'NO SILENT BODY-ABSORPTION')."
    status: failed
    reason: >
      The class invariant does NOT hold. A 7th distinct silent-absorb bypass — the same class as the
      6th — is reproducible against the COMMITTED scripts/compactor.js. A note #2 whose opening fence's
      FIRST in-fence line is a blank line (`---\n\nid: …`) or a junk/heading line (`---\n# heading\nid: …`)
      is parsed as a CLEAN note by parseNote (non-null, malformedLines=[], id/kind/verified_by all
      populated) but is NOT seen as a boundary by splitNotes. splitNotes(note1 + note2_blank) returns
      EXACTLY the forbidden signature the prohibition names: notes.length=1, trailingMalformed=null,
      malformedLines=[] — note #2 is silently folded into note #1's body. The §14-gate-verified
      failed-attempt buried this way (verified_by: §14-gate#RUN7) never becomes a parsed fence, never
      enters the id-keyed required-survival set, and the CLI exits 0 "carve-out intact" while the
      verified finding is dropped from the promoted set. This violates SC2 ("Compaction never drops a
      load-bearing field — verified_by / failed-attempt / supersedes / by / at survive compaction") and
      must_have truth #1's class-level promise ("regardless of which exotic shape an adversary picks").

      ROOT CAUSE (precise): in scripts/context-io.ts, `isBoundaryAt(i)` (lines 416-420) hard-requires
      `looksLikeFrontmatterLine(lines[i + 1])` — the line IMMEDIATELY after the `---`. But
      `opensIdBearingRun(i)` (lines 406-415) AND `parseNote` (lines 253-310) BOTH tolerate a leading
      blank line (`if (l.trim() === "") continue;` / the parse loop skips blanks) and a junk line (it is
      recorded as malformed but parseNote still returns non-null). So a fence opening with a blank/junk
      first line passes parseNote cleanly-enough but fails isBoundaryAt's `lines[i+1]` gate → the region
      is never a boundary → silent body-absorb. The round-7 fix broadened the boundary KEY (shared
      `isRecognizedFrontmatterLine`, trailing-whitespace-tolerant `isBoundaryShapedLine`, id-bearing-run
      detection) but left the candidate-boundary trigger as a single-line `lines[i+1]` heuristic — once
      again NARROWER than parseNote's real fence grammar. This is whack-a-mole on the same class the
      plan's objective explicitly set out to kill ("Broadening recognition alone is whack-a-mole … the
      PRIMARY safety mechanism is FAIL-CLOSURE, not recognition").

      WRITER-REACHABLE (not hand-authored): note #2's blank-first bytes are glued onto the same
      threads/<agent>.md via the SANCTIONED writeThread no-`note` free-scratch path (compactor.ts:571-573),
      exactly the adversarial boundary the plan's own threat model declares ("a single file holds MANY
      adversary-authored note fences; the oracle must recover EVERY note"). Two sanctioned writeThread
      calls reproduce the exact file (transcript below).
    artifacts:
      - path: "scripts/context-io.ts"
        issue: >
          isBoundaryAt (lines 416-420) gates the candidate boundary on
          `looksLikeFrontmatterLine(lines[i + 1])` (the immediate next line). opensIdBearingRun
          (lines 406-415) and parseNote (lines 253-310) tolerate a leading blank/junk line before the
          first recognized frontmatter line, so the splitter's i+1 trigger is a STRICT SUBSET of the
          regions parseNote will parse as a note. A `---\n\nid:…` or `---\n# heading\nid:…` fence is
          parsed clean by parseNote yet yields count=1 / trailingMalformed=null in splitNotes (silent
          absorb). The candidate-boundary / fail-closure decision must be complete with respect to
          parseNote's fence grammar, not a single lines[i+1] line-shape test.
      - path: "scripts/compactor.ts"
        issue: >
          readNoteDir (lines 183-211) trusts splitNotes' boundary recognition; when splitNotes returns
          count=1 for a real two-note file, the buried §14-gate-verified note never reaches the id-keyed
          required-survival set, so checkCarveOut (lines 237+) cannot refuse its drop — the CLI exits 0.
    missing:
      - "Make the candidate-boundary / fail-closure decision parseNote-grammar-COMPLETE: it must NOT hinge on `lines[i+1]` looking like frontmatter. EITHER (a) when scanning for the frontmatter run that opens after a `---`-shaped line, tolerate the SAME leading blank/junk lines parseNote tolerates (so a `---\\n\\nid:…` / `---\\n# heading\\nid:…` region is recognized as opening an id-bearing run), OR (b) fail closed on ANY column-0 `---`…`---` region that parseNote would parse as a note (or that contains an id-looking line) but splitNotes did not surface — route it to trailingMalformed/unparseable rather than into a prior body."
      - "A held-out RED-first test (against the committed pre-fix .js) for the leading-blank-fence and leading-junk-fence buried-verified-finding shapes, constructed via the sanctioned writeThread free-scratch path and driven end-to-end through `node scripts/compactor.js check`, asserting exit 1 naming the dropped id. Include a CRLF variant (it reproduces under CRLF too)."
      - "A splitNotes unit assertion that a `---\\n\\nid:…` and a `---\\n# heading\\nid:…` two-note input NEVER returns count=1 / trailingMalformed=null (the silent-absorb signature) — it must recover (count grows) or refuse (non-null trailingMalformed)."
deferred:
  - truth: "WR-03: a faithful note whose body legitimately contains a `---`+frontmatter sequence is loudly refused (usability false-positive; fails SAFE — refuse, not admit)"
    addressed_in: "follow-up round (out of scope per 22-08-PLAN.md OUT OF SCOPE block; fails in the SAFE direction)"
    evidence: "22-08-PLAN.md lines 170-173 — WR-03 explicitly deferred, fail-SAFE"
  - truth: "WR-02-broader (readContext fail-OPEN `if (!parsed) continue;`) and IN-02-broader (unknown-key allowlist / typo-laundering in validate())"
    addressed_in: "follow-up round (out of scope per 22-08-PLAN.md OUT OF SCOPE block)"
    evidence: "22-08-PLAN.md lines 170-174 — both broader classes explicitly out of scope for round 7"
---

# Phase 22: Memory & Trajectory Compaction Verification Report (Round 7)

**Phase Goal:** Bound the multi-agent token tax with two-tier memory. CMP-01 (two-tier compaction) and CMP-03 (the `context.compaction` dial + Workflow 18) are VERIFIED and untouched. The open requirement is **CMP-02 / SC2**: the load-bearing-field carve-out oracle (`scripts/compactor.js check`) must be an un-cheatable mechanical floor — no §14-gate-verified finding / required failed-attempt may be silently dropped on the way from the raw multi-note thread to the promoted notes.

**Verified:** 2026-06-19T16:40:00Z
**Status:** gaps_found
**Re-verification:** Yes — round 7, after the 22-08 round-7 gap-closure plan.

## Goal Achievement

### Observable Truths

| #   | Truth (round-7 must-have)                                      | Status     | Evidence |
| --- | -------------------------------------------------------------- | ---------- | -------- |
| 1   | FAIL-CLOSURE CLASS INVARIANT — splitNotes silently absorbs NOTHING fence-ish, regardless of exotic shape | ✗ FAILED | 7th distinct silent-absorb bypass reproduced (leading-blank / leading-junk fence open) at the splitNotes unit level AND end-to-end through the committed CLI. count=1 / trailingMalformed=null / malformedLines=[] — the exact forbidden signature. |
| 2   | BROADENED RECOGNITION (shared `isRecognizedFrontmatterLine`, kind-first + indented recovered, no drift) | ✓ VERIFIED | `isRecognizedFrontmatterLine` exported (context-io.ts:208) and consulted by parseNote (line 303) and splitNotes (via looksLikeFrontmatterLine + opensIdBearingRun). kind-first → count=2 (recovered); indented-`id:` → count=2 (recovered, gated downstream). `/^id:/`-only key gone. |
| 3   | BODY-`---` PRECISION PRESERVED (no round-5 regression) | ✓ VERIFIED | The BODY-`---` ambiguity test passes in the full suite (418 passed); an id-less embedded `---\nkey: value\n---` block stays note #1's body (boundary keyed on an id-bearing run). |
| 4   | SELF-CHECKING WRITER-ORDER GUARD for composeNote AND composeThreadNote | ✓ VERIFIED | Guard tests present in both context-io.test.ts (composeNote) and compactor.test.ts (composeThreadNote via writeThread); both pass; a reorder breaking the id-bearing run would fail RED. |
| 5   | HELD-OUT RED-FIRST END-TO-END for the THREE named boundary-miss shapes (kind-first / indented / trailing-space) | ✓ VERIFIED | 22-08-RED-baseline.txt (exit 0 "carve-out intact" pre-fix) → 22-08-GREEN-proof.txt (exit 1 naming the dropped id / refused file post-fix), end-to-end through the committed CLI, each via the writeThread free-scratch path. Re-confirmed: all three are closed (no silent absorb). |
| 6   | TEST #3 REPLACED / discriminating (non-boundary remainder after note #2; safe-non-goal comment) | ✓ VERIFIED | Round-6 non-discriminating scratch-then-fence test replaced; safe-non-goal comment present; suite green. |
| 7   | BYTE-FRESH COMMITTED .js (D-13), freshness 0, suite green | ✓ VERIFIED | `npm run freshness` exit 0 (17 committed .js fresh); `npx vitest run --exclude '**/scripts/e2e/**'` = 418 passed / 1 skipped / 0 failed. Independently re-run. |

**Score:** 6/8 truths verified (the two failing items are truth #1 and its sibling prohibition "NO SILENT BODY-ABSORPTION").

> Truth #1 is the decisive, load-bearing class invariant. It is FAILED. SC2 / CMP-02 is therefore NOT closed. SC1 / SC3 / SC4 (CMP-01, CMP-03 dial, CMP-03 Workflow 18) remain VERIFIED and untouched.

### Prohibitions

| Prohibition | Status | Evidence |
| ----------- | ------ | -------- |
| NO SILENT BODY-ABSORPTION (count=1 / trailingMalformed=null / malformedLines=[] on a region with a frontmatter-looking line after a `---`-ish line is FORBIDDEN) | ✗ VIOLATED | Reproduced exactly: blank-first and junk-first note #2 → count=1, trailingMalformed=null, malformedLines=[]. This is the verbatim forbidden signature. |
| NO WRITER FIELD-ORDER COUPLING LEFT UNGUARDED | ✓ HELD | Writer-order guard tests present for both writers (truth #4). |
| NO WRITE-PATH CHANGE (Fork B rejected) | ✓ HELD | writeThread / composeThreadNote emitted bytes unchanged; threads/<agent>.md representation frozen. |
| NO CORPUS-NARROWING SATISFACTION | ✓ HELD | The three named boundary-miss tests are present, RED-first, and exercise the writeThread free-scratch path; no fixture narrowed. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `scripts/context-io.ts` | fail-closed splitNotes + shared recognized-line predicate | ⚠️ PARTIAL | `isRecognizedFrontmatterLine` shared predicate present and reused; trailing-whitespace-tolerant boundary; id-bearing-run detection. BUT the candidate-boundary trigger (`isBoundaryAt`'s `looksLikeFrontmatterLine(lines[i+1])`) is narrower than parseNote's grammar → the 7th silent-absorb bypass. |
| `scripts/context-io.js` | byte-fresh tsc build | ✓ VERIFIED | freshness exit 0. |
| `scripts/compactor.ts` | readNoteDir consumes the fail-closed channel; composeThreadNote + guard | ✓ VERIFIED | readNoteDir routes trailingMalformed → unparseable (lines 206-208); checkCarveOut fails closed naming the file. Unchanged-except-guard as planned. |
| `scripts/compactor.js` | byte-fresh tsc build | ✓ VERIFIED | freshness exit 0. |
| `scripts/compactor.test.ts` | held-out RED-first boundary-miss + guard + replaced test #3 | ⚠️ PARTIAL | Present for the three named shapes; no test for the leading-blank / leading-junk class (the 7th bypass). |
| `scripts/context-io.test.ts` | fail-closure units + broadened no-drift + composeNote guard | ⚠️ PARTIAL | Present for the three named shapes; no fail-closure unit for the leading-blank / leading-junk class. |
| `22-08-RED-baseline.txt` | pre-fix exit-0 "carve-out intact" | ✓ VERIFIED | Contains "carve-out intact" for all three named shapes. |
| `22-08-GREEN-proof.txt` | post-fix exit-1 naming the dropped id | ✓ VERIFIED | Contains "carve-out FAIL"; exit 1 for all three named shapes. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| splitNotes boundary recognition | parseNote recognized-line set | shared `isRecognizedFrontmatterLine` predicate | ⚠️ PARTIAL | The shared predicate exists and removes the `/^id:/` drift, but the splitter's candidate-boundary TRIGGER (`lines[i+1]`) is still not complete w.r.t. parseNote's fence grammar (leading blank/junk) — residual drift = the 7th bypass. |
| splitNotes fail-closure | readNoteDir → NoteDirResult.unparseable | trailingMalformed | ⚠️ PARTIAL | The channel works when splitNotes surfaces a refusal; it never fires for the blank/junk-first fence because splitNotes silently absorbs it (no trailingMalformed produced). |
| writer-order guard tests | composeNote + composeThreadNote | structural reorder-fails-RED test | ✓ WIRED | Both writers guarded. |
| held-out boundary-miss tests | committed compactor.js CLI | runCheck / spawnSync end-to-end | ✓ WIRED | For the three named shapes only. |

### Behavioral Spot-Checks / Probe Execution

Independently reproduced against the COMMITTED `scripts/context-io.js` and `scripts/compactor.js` (working tree clean == HEAD 126d75d; committed .js byte-fresh per `npm run freshness` exit 0). Throwaway ESM harnesses were used and then deleted; the working tree is clean apart from this VERIFICATION.md.

**(1) Unit level — splitNotes silently absorbs a leading-blank / leading-junk fence (the 7th bypass):**

```
--- parseNote of the lone blank-first note #2 in isolation ---
  parseNote(note2_blank) = NON-NULL  id="DROP-ME-FA-7" kind="failed-attempt" verified_by="§14-gate#RUN7" malformedLines=[]
=== two-note: note1 + note2 (blank-first fence) ===
  splitNotes -> notes.length = 1 | trailingMalformed = null
=== two-note: note1 + note2 (# heading-first fence) ===
  splitNotes -> notes.length = 1 | trailingMalformed = null
=== two-note CRLF: note1 + note2 (blank-first) ===
  splitNotes -> notes.length = 1 | trailingMalformed = null

=== VERDICT ===
blank-first   : notes=1 trailing=null  SILENT-ABSORB=true
heading-first : notes=1 trailing=null  SILENT-ABSORB=true
crlf blank    : notes=1 trailing=null  SILENT-ABSORB=true
```

note #2 (blank-first) parses CLEAN in isolation (non-null, no malformedLines, id/kind/verified_by populated) yet `splitNotes` folds it into note #1's body with the forbidden `count=1 / trailingMalformed=null / malformedLines=[]` signature. Reproduces for blank-first, `# heading`-first, and CRLF.

**(2) End-to-end — committed `node scripts/compactor.js check` exits 0 dropping a §14-gate-verified failed-attempt:**

Raw thread `threads/engineer.md` built via two SANCTIONED writeThread calls (note #1 structured via the `note` arg; note #2 a §14-gate-verified `failed-attempt` whose fence opens with a blank line, via the no-`note` free-scratch path). Promoted set keeps ONLY note #1.

```
splitNotes on the raw thread: notes.length=1 trailingMalformed=null

=== node scripts/compactor.js check <threadDir> <promotedDir> ===
EXIT = 0
STDOUT: carve-out intact: every failed-attempt id survived and all load-bearing provenance fields are present.
STDERR:

=== VERDICT ===
promoted dir kept only note #1; note #2 (verified FA id=20260617T150000Z-engineer-finding-r7blankfirst) was DROPPED.
CLI exit=0 (0 == "carve-out intact" == SILENT DROP == BYPASS REPRODUCED)
mentions dropped id = false
```

The verified failed-attempt `20260617T150000Z-engineer-finding-r7blankfirst` (verified_by `§14-gate#RUN7`) is dropped from the promoted set and the oracle reports "carve-out intact" at exit 0. This is the 7th distinct CMP-02 bypass.

**(3) Root-cause confirmation — the `lines[i+1]` heuristic is the gate:**

```
""               looksLikeFrontmatterLine = false
"# heading"      looksLikeFrontmatterLine = false
"   "            looksLikeFrontmatterLine = false
"id: X"          looksLikeFrontmatterLine = true
"kind: finding"  looksLikeFrontmatterLine = true
```

When `lines[i+1]` is blank or a junk/heading line, `looksLikeFrontmatterLine` returns false, so `isBoundaryAt(i)` returns false and the fence is never a boundary — even though `opensIdBearingRun` (which skips blanks) and `parseNote` (which skips blanks / records junk but still returns non-null) would have accepted it.

**(4) The three round-7 named shapes ARE closed (so round 8 does not redo them):**

```
kind-first       -> notes=2 trailing=null | SILENT-ABSORB=false
indented-id      -> notes=2 trailing=null | SILENT-ABSORB=false
trailing-space   -> notes=1 trailing=NON-NULL | SILENT-ABSORB=false
```

kind-first → RECOVERED (count=2); indented-`id:` → RECOVERED (count=2, gated downstream); trailing-space `--- ` → REFUSED (count=1 + non-null trailingMalformed). None silently absorbs. Round 7 genuinely closed these three.

**(5) Baseline re-confirmation:**

```
$ npm run freshness
  All build outputs fresh: 17 committed .js file(s) match a fresh tsc rebuild.
  FRESHNESS_EXIT=0

$ npx vitest run --exclude '**/scripts/e2e/**'
  Test Files  16 passed (16)
       Tests  418 passed | 1 skipped (419)
```

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| CMP-01 | (22-01/22-02) | Two-tier compaction | ✓ SATISFIED | Verified in prior rounds; untouched this round (out of scope per plan). |
| CMP-02 | 22-08 | Load-bearing-field carve-out oracle | ✗ BLOCKED | SC2 not closed — 7th distinct silent-absorb bypass reproduced end-to-end. |
| CMP-03 | (22-01/22-02) | `context.compaction` dial + Workflow 18 | ✓ SATISFIED | Verified in prior rounds; untouched this round. |

### Success Criteria Coverage (ROADMAP)

| SC | Statement | Status |
| -- | --------- | ------ |
| SC1 | Verbose trajectory stays local; only re-verified distillation promotes | ✓ VERIFIED (CMP-01, untouched) |
| SC2 | Compaction never drops a load-bearing field; a RED test fails if any is dropped | ✗ FAILED — verified failed-attempt dropped at exit 0 via the leading-blank/junk fence |
| SC3 | `context.compaction` dial defaults aggressive, documented across three surfaces | ✓ VERIFIED (CMP-03, untouched) |
| SC4 | Workflow 18 single-source protocol | ✓ VERIFIED (CMP-03, untouched) |

### Anti-Patterns Found

No debt markers (TBD / FIXME / XXX) introduced in the touched source. The defect is a logic incompleteness (a single-line candidate-boundary heuristic narrower than the parser's grammar), not a stub or marker.

### Human Verification Required

None — the gap is mechanically reproducible and conclusively demonstrated above. No human-only (visual / real-time / external-service) verification is needed.

### Gaps Summary

Round 7 made real, durable progress and **genuinely closed the three plan-named round-6 boundary-miss shapes** (kind-first recovered, indented-`id:` recovered-then-gated, trailing-space `--- ` refused), introduced the single-source `isRecognizedFrontmatterLine` grammar (removing the `/^id:/` drift), added the self-checking writer-order guard for both writers, replaced the non-discriminating test #3, and kept the committed `.js` byte-fresh with a green suite. Six of eight must-haves are verified.

However, the **decisive load-bearing must-have (truth #1, the FAIL-CLOSURE CLASS INVARIANT) is FAILED**, and its sibling prohibition "NO SILENT BODY-ABSORPTION" is VIOLATED. A **7th distinct CMP-02 bypass — the same silent-absorb class as the 6th** — survives: a note whose opening fence's first in-fence line is a blank line (`---\n\nid: …`) or a junk/heading line (`---\n# heading\nid: …`) is parsed clean by `parseNote` but is not recognized as a boundary by `splitNotes`, so it folds silently into the prior note's body (`count=1 / trailingMalformed=null / malformedLines=[]`). A §14-gate-verified `failed-attempt` buried this way is dropped from the promoted set and the committed `node scripts/compactor.js check` exits 0 "carve-out intact". Reproduced both at the `splitNotes` unit level and end-to-end through the committed CLI (and under CRLF), writer-reachable via the sanctioned `writeThread` free-scratch path.

The round-7 fix again broadened *recognition* but left the candidate-boundary *trigger* (`isBoundaryAt`'s `looksLikeFrontmatterLine(lines[i+1])`) narrower than `parseNote`'s actual fence grammar — the exact whack-a-mole the plan's objective set out to end. Per the standing lesson (a green vitest suite is not proof for this safety invariant), the suite stayed fully green through this bypass.

**Round-8 fix direction (precise):** the candidate-boundary / fail-closure decision must NOT hinge on `lines[i+1]` looking like frontmatter. It must be complete with respect to `parseNote`'s actual fence grammar — i.e. tolerate the SAME leading blank/junk lines `parseNote` tolerates when scanning for the id-bearing run, OR fail closed on ANY column-0 `---`…`---` region that `parseNote` would parse as a note (or that contains an id-looking line) but `splitNotes` did not surface, routing it to `trailingMalformed`/`unparseable` rather than into a prior body. The floor must be parseNote-grammar-complete, not a line-i+1 heuristic. Add held-out RED-first tests for the leading-blank-fence and leading-junk-fence shapes (including a CRLF variant), constructed via the writeThread free-scratch path and driven end-to-end through the committed CLI.

CMP-01 and CMP-03 (SC1 / SC3 / SC4) remain VERIFIED and untouched. Fork B (write-path change) remains rejected; WR-03 / WR-02-broader / IN-02-broader remain correctly deferred.

---

_Verified: 2026-06-19T16:40:00Z_
_Verifier: Claude (gsd-verifier), round 7_

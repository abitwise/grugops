---
phase: 22-memory-trajectory-compaction-dialable-token-economy
verified: 2026-06-18T14:05:00Z
status: gaps_found
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "CMP-02 single-instance mutation: a forged/swapped verified_by on a promoted finding is refused (exit 1, names verified_by)"
    - "CMP-02 single-instance mutation: a by mutated engineer->attacker on a verified finding is refused"
    - "CMP-02 wholly-dropped verified finding (unique stamp, 2+ promoted) is refused via the affirmative existence check"
    - "CMP-02 ambiguous-sibling borrow (same-kind, different verified_by) no longer borrows an intact sibling"
    - "WR-01 CLI fails closed on a missing/typo'd threadDir (exit 1, never carve-out intact)"
    - "WR-02 unrecoverable FA-id surfaced as an explicit finding; WR-03 degradeToClaim throws on a non-template note"
  gaps_remaining:
    - "CMP-02 carve-out is STILL bypassable: a load-bearing provenance field can be dropped/altered and survive at exit 0 via CR-01 (identity-key collision) and CR-02 (fail-open null counterpart for non-verified notes)"
  regressions: []
gaps:
  - truth: "CMP-02 / SC2 — compaction never drops a load-bearing field; a RED test fails if any (verified_by / failed-attempt / supersedes / by / at) is dropped or altered. The carve-out must be un-cheatable."
    status: failed
    reason: >-
      Three independent bypasses survive at exit 0 against the COMMITTED scripts/compactor.js,
      all reproduced empirically this verification (not inferred). The shipped 22-test suite is
      fully GREEN, but it pins only single-instance shapes (unique verified_by per finding,
      mutations applied only to verified findings) — it does not exercise the shapes that break
      the oracle, so green is necessary but NOT sufficient. SC2 promised an un-cheatable carve-out;
      a forged/dropped/altered provenance field still passes the gate.
    artifacts:
      - path: "scripts/compactor.ts:225-241"
        issue: >-
          CR-01 (identity-key collision, Critical). The affirmative existence check keys raw
          verified notes into a Set on verifiedKey = [kind, verified_by, by, at].join(" ") (line 225)
          and tests .has() — set MEMBERSHIP, not COUNT. One gate run stamps multiple findings with
          the SAME verified_by/by/at, so two raw verified findings collapse to one key; a single
          surviving promoted note satisfies both, and the second verified finding can be wholly
          dropped at exit 0. findCounterpart also returns null on byStamp.length > 1 (line 257), so
          the per-field loop is skipped (line 197 if (!counterpart) continue), and nothing detects
          the drop.
      - path: "scripts/compactor.ts:194-219, 251-263"
        issue: >-
          CR-02 (fail-open null counterpart, Critical). The alter/drop loop runs only on a 1:1
          counterpart; line 197 if (!counterpart) continue is fail-OPEN. For a non-verified durable
          note (empty verified_by — observation/decision/claim/artifact-ref), matching falls to the
          (kind, at) tuple (line 260). Mutate BOTH by and at (no tuple match -> null -> skipped), or
          have two notes share (kind, at) (ambiguous, byTuple.length>1 -> null -> skipped). The
          existence check also ignores empty-verified_by notes (line 233 continue). Net: a by swapped
          engineer->attacker on an observation/decision — or dropped entirely — survives at exit 0.
          The header comment (lines 187-193) claims by/at are protected "on every promoted note";
          they are not.
      - path: "scripts/compactor.ts:198, 225-241"
        issue: >-
          IN-01 (supersedes never affirmatively checked, completeness gap). supersedes is in the
          alter list (line 198) but absent from the existence-key/affirmative check (lines 225-241).
          A non-verified durable note whose supersedes link is load-bearing but which is wholly
          dropped (or whose counterpart does not resolve) loses the link with no detection. supersedes
          is named explicitly in SC2 as a load-bearing field.
      - path: "scripts/compactor.test.ts:135-376"
        issue: >-
          WR-03 (false-confidence suite). Every negative case uses a UNIQUE verified_by per finding
          (SEED-001, SEED-002) and applies field mutations only to VERIFIED findings. grep over the
          test file for RUN-9 / observation / two-same-(kind,at) returns nothing. The suite pins
          exactly the paths that already work; the shared-gate-run and non-verified-note shapes are
          absent. 22/22 green over a still-bypassable oracle — the identical failure mode that shipped
          the prior version.
    missing:
      - >-
        CR-01 fix — make the affirmative existence check MULTIPLICITY-AWARE, not set-membership.
        Count raw verified notes per identity key and require >= that many promoted notes carrying
        the same key (or key on a per-note content/body hash or stable id rather than the shared
        provenance tuple). Add a held-out RED test: two raw findings sharing one gate-run stamp +
        by + at, promoted drops one -> must refuse.
        Repro (exit 0 today): raw {sql.md,xss.md} both verified_by §14-gate#RUN-9 / by eng /
        at 2026-06-17T14:23:05Z, promoted {sql.md} only.
      - >-
        CR-02 fix — fail CLOSED on a null counterpart for a NON-VERIFIED durable note. When a raw
        durable note has no resolvable 1:1 counterpart, that is itself a carve-out finding (its
        provenance cannot be confirmed intact), not a silent continue at line 197. This forces a
        deterministic per-note identity so by/at can be honestly verified across compaction. Add
        held-out RED tests P7 and P8.
        Repro (exit 0 today): P7 observation, by engineer->attacker AND at re-timestamped;
        P8 two observations sharing (kind, at), one's by line dropped.
      - >-
        IN-01 fix — fold supersedes integrity into the same identity-based affirmative comparison
        once notes carry stable identities, so a wholly-dropped note's load-bearing supersedes link
        is detected.
        Repro (exit 0 today): non-verified decision with supersedes: <id> wholly dropped from the
        promoted set; one unrelated note promoted.
      - >-
        WR-03 fix — add the three held-out adversarial cases (P2b shared gate-run drop-one,
        P7 non-verified both-fields-mutated, P8 two-same-(kind,at) one-by-dropped) as RED-first
        tests that fail against today's compactor.js and pass only after the CR-01/CR-02/IN-01 fixes.
---

# Phase 22: Memory & Trajectory Compaction Verification Report

**Phase Goal:** Bound the multi-agent token tax with two-tier memory — verbose local trajectory stays in the agent's thread; only compact, re-verified distillations promote to the shared context.
**Verified:** 2026-06-18T14:05:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap-closure plan 22-03 (focus CMP-02 / SC2)

## Goal Achievement

### Observable Truths

| #   | Truth (Success Criterion)                                                                                                       | Status     | Evidence                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | (CMP-01) Verbose trajectory stays in `.grugops/context/threads/<agent>.md`; only a compact distillation reaches shared context, re-verified before write. | ✓ VERIFIED | `.gitignore:12` scopes `**/.grugops/context/*/threads/`; no blanket `.grugops/context/` ignore. `writeThread`/`promote`/`reVerify` in compactor.ts:284-321 implement the two tiers; promote routes only through `appendNote` (D-02.3). Test suite proves two-tier separation + sole-writer byte-identity. |
| 2   | (CMP-02) Compaction never drops a load-bearing field — `verified_by`/`failed-attempt`/`supersedes`/`by`/`at` survive; a RED test fails if any is dropped. Un-cheatable. | ✗ FAILED   | THREE bypasses reproduced at exit 0 against committed `scripts/compactor.js`: CR-01 (compactor.ts:225-241), CR-02 (compactor.ts:194-219 + 251-263), IN-01 (supersedes). Suite is 22/22 green but pins only single-instance shapes. See gaps. |
| 3   | (CMP-03) The `context.compaction: aggressive\|balanced\|retain-raw` dial works, defaults to `aggressive`, documented across all 3 config surfaces.    | ✓ VERIFIED | `readCompactionDial` (compactor.ts:268-279) defaults to `aggressive` on missing file/key/parse-error (D-06). `factory.config.md:91,107` + both `factory.config.json` defaults = `aggressive`. Dial documented in config doc, JSON, and Workflow 18. Tests: default-on-absent + dial-invariance + byte-identical-across-dials. |
| 4   | (CMP-03) A role following Workflow 18 compacts by the single-source protocol; other roles reference it.                          | ✓ VERIFIED | `agent-factory/workflows/18-context-compaction.md:9` declares it the single source of the two-tier protocol; 10+ roles reference `18-context-compaction`/`Workflow 18` rather than restating it. Workflow 18 hands the proposed set to the compactor and honors its refusal (line 38). |

**Score:** 3/4 truths verified (0 present, behavior-unverified). CMP-02 FAILED.

### Required Artifacts

| Artifact                  | Expected                                              | Status     | Details                                                                                                                                  |
| ------------------------- | ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/compactor.ts`    | Hardened carve-out oracle (un-cheatable)              | ⚠️ STUB-OF-INTENT | Exists, substantive, wired to context-io (`appendNote`/`admit`), freshness-gated. BUT does NOT achieve its stated invariant — bypassable 3 ways. |
| `scripts/compactor.js`    | Byte-fresh tsc output of compactor.ts                 | ✓ VERIFIED | Present (mtime 2026-06-18T10:49Z ≥ .ts 10:43Z); is the artifact the tests + repros run against.                                          |
| `scripts/compactor.test.ts` | Adversarial RED-first oracle for every drop/alter shape | ⚠️ INSUFFICIENT | 22/22 green, but covers only single-instance verified-note shapes. Missing shared-gate-run, non-verified-note, both-fields-mutated cases (WR-03). |

### Key Link Verification

| From               | To                  | Via                                  | Status   | Details                                                                                  |
| ------------------ | ------------------- | ------------------------------------ | -------- | ---------------------------------------------------------------------------------------- |
| `scripts/compactor.ts` | `scripts/context-io.ts` | imports `appendNote`/`admit`; promote routes only through appendNote | ✓ WIRED  | compactor.ts:53-57 imports; promote() (303-310) + reVerify() (315-321) are pass-throughs. Sole-writer test asserts byte-identity vs direct appendNote. |
| `scripts/compactor.ts` | `scripts/freshness.ts`  | freshness globs scripts/*.js; rebuilt compactor.js rejoins drift gate | ✓ WIRED  | compactor.js present and consumed; covered by the existing freshness gate (D-13).        |
| Workflow 18        | `scripts/compactor.ts`  | hands proposed promoted set to the carve-out check, honors refusal    | ✓ WIRED  | 18-context-compaction.md:38 instructs running the checker and honoring its non-zero exit. |

### Behavioral Spot-Checks

| Behavior                                                  | Command                                                                 | Result                                              | Status |
| --------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- | ------ |
| CR-01: drop one of two findings sharing one gate-run stamp | `node scripts/compactor.js check <thread> <promoted>` (raw {sql,xss} §14-gate#RUN-9; promoted {sql}) | `carve-out intact` / exit 0 — verified XSS finding silently dropped | ✗ FAIL (BYPASS) |
| CR-02 (P7): non-verified observation, `by` engineer->attacker + `at` re-timestamped | same CLI, empty verified_by, both fields mutated                       | `carve-out intact` / exit 0 — tampered provenance survived | ✗ FAIL (BYPASS) |
| CR-02 (P8): two same-`(kind,at)` observations, one's `by` dropped | same CLI, ambiguous counterpart                                         | `carve-out intact` / exit 0 — dropped `by` survived | ✗ FAIL (BYPASS) |
| IN-01: non-verified decision with `supersedes` wholly dropped | same CLI, decision absent from promoted                                | `carve-out intact` / exit 0 — supersedes link lost  | ✗ FAIL (BYPASS) |
| Full compactor test suite (necessary-but-insufficient)    | `npx vitest run scripts/compactor.test.ts`                              | 22 passed (22)                                      | ✓ PASS (but insufficient — pins only working shapes) |
| CMP-01 gitignore scoping                                  | `grep -nE "context/\*/threads/" .gitignore`                            | `**/.grugops/context/*/threads/`; no blanket ignore | ✓ PASS |
| CMP-03 dial default                                       | `readCompactionDial` on absent file/key                                | `aggressive`                                        | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan         | Description                                                | Status        | Evidence                                                                                          |
| ----------- | ------------------- | ---------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| CMP-01      | 22-01               | Two-tier compaction (thread tier / shared context)         | ✓ SATISFIED   | Truth 1; gitignore + writeThread/promote + sole-writer test.                                      |
| CMP-02      | 22-01, 22-03 (gaps) | Load-bearing-field carve-out; RED test fails on any drop   | ✗ BLOCKED     | Truth 2 FAILED; 3 bypasses at exit 0. REQUIREMENTS.md:119 already marks CMP-02 "In Progress".      |
| CMP-03      | 22-02               | Dial (default aggressive), re-verify, Workflow 18 single-source | ✓ SATISFIED   | Truths 3 & 4; config surfaces + Workflow 18 + dial tests.                                          |

All three phase requirement IDs (CMP-01, CMP-02, CMP-03) are accounted for. No orphaned requirements.

### Anti-Patterns Found

| File                  | Line     | Pattern                                          | Severity   | Impact                                                                                       |
| --------------------- | -------- | ------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| `scripts/compactor.ts` | 197      | `if (!counterpart) continue;` — fail-OPEN for a fail-CLOSED safety oracle | 🛑 BLOCKER | A non-verified durable note with no resolvable 1:1 counterpart skips the alter/drop check; tampered/dropped `by`/`at` survives. |
| `scripts/compactor.ts` | 225-234  | Set-membership (`.has`) instead of multiplicity count for verified existence | 🛑 BLOCKER | Two findings sharing one gate-run stamp collapse to one key; one surviving note covers both — a verified finding can be dropped. |
| `scripts/compactor.ts` | 187-193  | Header comment claims `by`/`at` protected "on every promoted note" — contradicted by code | ⚠️ WARNING | A safety-surface comment overstates the guarantee; CLAUDE.md treats clarity on safety topics as a hard rule. |
| `scripts/compactor.test.ts` | 135-376 | Negative cases all use unique `verified_by` + verified findings only | ⚠️ WARNING | False-confidence suite; 22/22 green over a bypassable oracle. |

No unreferenced debt markers (TBD/FIXME/XXX) found in the modified files.

### Human Verification Required

None. All gaps are mechanically reproduced (exit 0 on the committed `.js`) — no human judgment needed to confirm the failure.

### Gaps Summary

The phase goal's mechanical floor — the CMP-02 carve-out, the *un-cheatable* guarantee that no
load-bearing provenance field is silently dropped on the path from raw thread to promoted notes —
is **not achieved**. Gap-closure 22-03 genuinely closed the three ORIGINAL single-instance bypasses
(forged/mutated `verified_by`, mutated `by` on a stamped finding, wholly-dropped verified finding
with a unique stamp, the ambiguous same-kind borrow) and added real fail-closed input/degrade
hardening (WR-01/WR-02/WR-03) — those are confirmed closed.

But the hardening INTRODUCED a new collision bypass (CR-01) and LEFT the original sin reachable for
non-verified notes (CR-02), and `supersedes` is never affirmatively checked (IN-01). All three were
reproduced THIS verification, returning `carve-out intact` / exit 0 against the committed
`scripts/compactor.js`:

- **CR-01** (compactor.ts:225-241): keying on a shared `(kind, verified_by, by, at)` tuple in a Set
  lets two findings from one gate run collapse to one key — drop one, exit 0.
- **CR-02** (compactor.ts:194-219, 251-263): `if (!counterpart) continue` is fail-open; a
  non-verified note with both `by` and `at` mutated (or an ambiguous `(kind,at)`) skips the check —
  a `by` swapped engineer->attacker survives, exit 0.
- **IN-01** (compactor.ts:198, 225-241): `supersedes` (a SC2-named load-bearing field) is policed
  only via the 1:1 counterpart; a wholly-dropped note loses its supersedes link undetected.

This is the exact failure mode flagged in MEMORY (a green suite is not proof for a safety
invariant): the 22-test suite is fully GREEN yet pins only the shapes that already work. SC2's bar
is that the oracle REFUSES every drop/alteration, not that the shipped tests pass.

CMP-01 and CMP-03 are UNTOUCHED by 22-03 and confirmed to still hold (regression clean).

Status: **gaps_found**. Route to `/gsd-plan-phase 22 --gaps` — the CR-01 multiplicity fix, the
CR-02 fail-closed-on-null-counterpart fix, the IN-01 affirmative `supersedes` check, and held-out
RED-first tests (P2b/P7/P8) are specified with file:line and a one-line repro each in the frontmatter.

---

_Verified: 2026-06-18T14:05:00Z_
_Verifier: Claude (gsd-verifier)_

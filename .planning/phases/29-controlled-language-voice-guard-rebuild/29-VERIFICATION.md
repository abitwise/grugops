---
phase: 29-controlled-language-voice-guard-rebuild
round: 8
verified: 2026-08-18T22:40:00Z
status: gaps_found
score: 6/8 LANG must-haves verified (LANG-01, LANG-02, LANG-03, LANG-05, LANG-06, LANG-07 independently re-confirmed live; LANG-08 PASSED via standing override; LANG-04 FAILED — reproduced live, on TWO axes, neither of which is the axis this round debated)
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <= previous, delta recorded, never raised mid-phase"
    reason: "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline), accepted 2026-08-15 and carried unchanged through rounds 1-8. Re-checked this round: `guard_role_size` runs live at HEAD (8510db6): 16 roles PASS within ceiling, 1 WARN approaching ceiling (security-nfr.md, 4931B >= 4830B), 0 FAIL. No round-8 plan touched `agent-factory/roles/` (0 of 19 changed paths per the round's own §8.4 accounting)."
    accepted_by: "Olger Oeselg"
    accepted_at: "2026-08-15T09:57:04Z"
re_verification: true
re_verification_scope:
  round: 8 (FINAL gap-closure round per D-58; plans 29-56 through 29-60)
  previous_status: gaps_found (29-VERIFICATION.md round 7, 2026-08-18, 7/8) -> LANG-04 failed on a hard-wrap bypass (round 7's own review CR-02) on a pinned, listed multi-word literal -> round-8 plans 29-56..29-60 executed -> this verification
  gaps_closed:
    - "Round-7 gap 1's G1-a/G1-b sub-items — CLOSED as designed. `V-29-57-01` is opened with a derived reach (11 of 22, not the review's 16 — a corrected figure), a live count (0 over 4126 adjacent line pairs / 117 documents), a direction (FAIL-OPEN), and the false 'mid-token' in-source framing is corrected. Independently re-derived by me (see Behavioral Spot-Checks) — the reachability math and the live-0 count both reproduce."
    - "Round-7 gap 1's G1 truth ('holds mechanically, with no fail-open route') — the PUBLISHED SENTENCE is genuinely narrowed by D-55 (task 1/2 of plan 29-56), and the narrowed header sentence is demonstrably TRUE on a tree carrying the round-7 hard-wrap plant (I independently reproduced this: planting the hard-wrapped claim and re-reading the header confirms it states only 'no single physical line ... carries any of the pinned literals', which remains literally true of a wrap-split occurrence)."
    - "Round-7 gap 2 (CI build-parity gate) — the SUBJECT genuinely moved. `scripts/freshness.ts` now reads the committed side via `git show HEAD:<path>` and derives its compared set from `git ls-tree -r HEAD`, not the working tree. I independently reproduced the discrimination pair (stale committed .js on a fresh clone reds by name; a clean clone is green) — this part of the repair is real."
  gaps_remaining:
    - "LANG-04's core truth is STILL FAILED, on two mechanisms I independently reproduced live on the current tree (HEAD 8510db6), neither of which is the round-7 hard-wrap axis the round's own residual register spent most of its argument on: (1) `check-banned-claims.ts`'s own D-55-narrowed header sentence is printed UNCONDITIONALLY at line 2190, before any finding is rendered and before the vacuity floor runs — so on a RED run (a planted, unwrapped, single-line banned claim) the gate's first line of output asserts 'no single physical line ... carries any of the 22 pinned claim literal(s)' immediately above two findings that name the exact line and literal that contradicts it. This is the review's CR-02, and it lands inside round 8's own remedy for LANG-04 — a prohibition whose own guard's narrated PASS-line is false on the run where it matters most. (2) `scripts/freshness.ts` (D-57's own repair, the truth round 7 added and round 8 closed under G2) still exits 0 and prints 'All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources' on a tree whose committed `hooks/guard.js` I planted stale and committed, once its source file is subsequently touched (uncommitted) and rebuilt — the review's CR-01. Both are reproduced below with commands and verbatim output, not asserted from the review's prose."
    - "The round's own honest disposition register (`docs/audit/29-round8-residuals.md`) already discloses the second finding (V-29-60-05, its own §5.4) as an unresolved defect in the D-55 remedy and explicitly declines to close it under the D-58 scope fence, deferring it to a follow-up. So this is not a new discovery contradicting the register — it is the register's own self-reported open item, reproduced live, and it is squarely inside what LANG-04 asks for (a mechanical, not a discipline-held, prohibition)."
  regressions: []
gaps:
  - truth: "LANG-04 — `guard_banned_claims`'s own PASS-line claim holds mechanically, with no fail-open route, on the tree that ships"
    status: failed
    reason: "Reproduced live on HEAD (8510db6) on two independent axes, both material to LANG-04's own text ('the conformance prohibition itself is mechanical, held by guard_banned_claims'). AXIS A (CR-02, scripts/check-banned-claims.ts:2190): the D-55-narrowed header sentence is written via process.stdout.write() before DERIVATION_REFUSALS, before the vacuity floor, and before any finding is rendered — so it prints unconditionally on every run, including a run that then fails. Reproduced on a `git archive HEAD` mirror: appended 'The caveman voice is a token economy and it saves tokens.' (one physical line, unwrapped) to agent-factory/workflows/13-incident.md; ran `node scripts/check-banned-claims.js`; got header line 'no single physical line of the 117 derived document(s) this gate scans carries any of the 22 pinned claim literal(s), outside the registry-anchored blocks of one named exemption region' immediately followed by 'FAIL banned claims: 2 finding(s) over 117 elements' naming that exact line and both literals; exit 1. The gate's own narrated claim about itself is false on the run that most needs it to be true — a failing run. This is the exact 'prohibition wider than mechanism' shape LANG-04 exists to prevent, now inside the guard's own printed narration rather than in its matcher. The round's own review (29-REVIEW.md CR-02) found this independently in the same round that shipped it; this verification reproduces it from scratch. AXIS B (CR-01, scripts/freshness.ts): the build-parity gate D-57 shipped as the closure of round 7's second gap ('the CI build-parity gate mechanically prevents a stale committed .js from shipping on main') still fail-opens. Reproduced on a fresh `git clone --local`: planted a stale line in the committed hooks/guard.js and committed it (freshness.js correctly reds: 'STALE WORKING OUTPUT... BUILD-OUTPUT CHECK FAILED', matching its committed-vs-source arm logic at that point); then, as an ordinary developer action, edited hooks/guard.ts (uncommitted) and ran `npx tsc` to rebuild; re-ran `node scripts/freshness.js`: 'Compared 48 path(s) ... 47 on the HEAD arm, 1 on the working-tree arm', 'All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources.', exit 0. HEAD's hooks/guard.js is still the planted-stale commit — its HEAD blob was never read because the modified .ts source routed that path to the working-tree arm instead — and the gate reports it fresh. This axis is not hypothetical: it is the round's own review CR-01, and `docs/audit/29-round8-residuals.md` discloses only the adjacent, narrower V-29-59-01 (uncommitted, undirtied .js) window, not this one (committed-stale + subsequently-dirtied source)."
    artifacts:
      - path: "scripts/check-banned-claims.ts"
        issue: "runAll()'s header write at line ~2190 executes before DERIVATION_REFUSALS, the per-part vacuity floor, and the finding loop — the narrowed D-55 sentence is unconditional, not gated to the success path, so it is printed (and false) on red runs"
      - path: "scripts/check-banned-claims.ts"
        issue: "the second PASS-line sentence (around line 2607, quoted in docs/audit/29-round8-residuals.md V-29-60-05) still states a per-DOCUMENT quantifier ('117 document(s) carry zero banned claim literal outside the one named exemption region') over what is mechanically a per-LINE decision — confirmed present on the live green run"
      - path: "scripts/check-banned-claims.ts"
        issue: "the residual-comment addresses at :62-63 and :351-352 ('THIS GATE PROVES that no pinned literal appears outside the one named exemption region') are unqualified by unit-of-decision, unlike the corrected header — confirmed present at those line numbers on HEAD"
      - path: "scripts/freshness.ts"
        issue: "the working-tree arm (`useWorking = modified.has(source) && walkSet.has(rel)`) never reads the HEAD blob for a path whose source is dirty, yet the verdict line and the docblock's 'exit 0 = every .js committed at HEAD matches a rebuild' both quantify over the WHOLE compared set including working-arm paths"
    missing:
      - "Fix CR-02: move the header write in check-banned-claims.ts to after the refusals/floor/pin, printed only on the success path (as the sibling freshness.ts gate already does for its own verdict line) — or make the sentence's grammar interrogative rather than declarative so it cannot be read as an assertion on a red run. Add a case (the sibling of freshness.test.ts's FRESH_LINE discipline) that plants a finding and asserts the narrowed sentence is ABSENT from that run's output."
      - "Fix CR-01: state what freshness.ts's verdict line actually compared — split the count into the HEAD-arm and working-arm cardinalities, and either (a) name the working-arm residue explicitly in the printed verdict ('N path(s) took the working-tree arm and their HEAD blobs were NOT read') or (b) red under a --strict/CI flag when the working arm is non-empty, since a clean CI checkout can never take it. Open a `V-` id for this specific window (committed-stale + subsequently-dirtied-and-rebuilt source) — the register currently only names the narrower V-29-59-01 (uncommitted, non-dirtied) window."
      - "Re-run both reproductions above against the fixes and confirm exit-1 with the false sentence absent (CR-02) and exit-1 naming the stale path (CR-01) before recommending LANG-04 -> Complete."
deferred: []
behavior_unverified_items: []
human_verification: []
---

> **PHASE CLOSED BY USER DECISION, 2026-08-18 — this report's `gaps_found` verdict is left standing, not rewritten.**
>
> This verification was run against `LANG-04`'s **previous** text, which asserted *"the conformance
> prohibition itself is mechanical, held by `guard_banned_claims`."* That sentence was rewritten
> under **`D-59`** (reversing `D-29`): the prohibition is now held as **content** — the claim
> registry and the honesty floor — with `guard_banned_claims` as a disclosed **drift backstop**.
> Eight rounds established that a totality over an open set of phrasings is not a decidable
> predicate; the requirement was the last address still claiming a mechanism decided one.
>
> Of this report's two blocking defects: **CR-02 was FIXED** (commit `4c6a76a`, watched failing
> against the pre-fix build, asserted in both directions), and **CR-01 was reclassified out of
> `LANG-04`'s scope** and carried as `V-29-59-03` — plan 29-59 itself recorded that gate as
> "pre-existing since Phase 20 and named by no LANG requirement." Full disposition:
> `docs/audit/29-round8-residuals.md` §10.
>
> This verifier's own §62 states that closing a requirement on a narrowed, honestly-disclosed claim
> is legitimate and that `D-55`'s narrowing "would, on its own, be enough for me to accept the
> narrowing and mark LANG-04 closed on that specific axis."

# Phase 29: Controlled Language & Voice Guard Rebuild — Verification Report (Round 8, FINAL per D-58)

**Phase Goal:** Procedural and agent-written prose follows one enumerated writing profile so two agents reading the same instruction reach the same act; the caveman voice lives in exactly one fenced block per role and is measured as voice, not as sentence shape.

**Verified:** 2026-08-18T22:40:00Z
**Status:** gaps_found
**Re-verification:** Yes — round 8, following round 7 (`29-VERIFICATION.md`, `gaps_found`, 7/8, LANG-04 failed on the hard-wrap axis).

## What this round asked me to rule on, and how I ruled

Round 8's own register (`docs/audit/29-round8-residuals.md` §3.2, `G1-c`) explicitly hands the verifier one question: round 7's gap-1 third `missing:` bullet made *"re-run this verification's reproduction against the fix and confirm it now reds by name before recommending LANG-04 → Complete"* a precondition for closing LANG-04. `D-56` declines to build that fix (the hard-wrap matcher completion). The register asks whether the unsatisfiable bullet keeps LANG-04 open, or whether closing the published *claim* down to what the mechanism decides (`D-55`) legitimately closes LANG-04 on its own terms.

**I did not have to resolve that question in the abstract, because it turned out not to be dispositive.** I ran round 8's own code review's two reproduced Critical findings (CR-01, CR-02) myself, from scratch, on the live tree — not by reading `29-REVIEW.md`'s prose. Both reproduce exactly as the review states. CR-02 in particular falsifies the round's own remedy for LANG-04, independent of the hard-wrap debate entirely: the D-55-narrowed header sentence — the sentence this whole round exists to make true — is printed unconditionally, so it is a **false statement on a failing run**, which is precisely the "prohibition wider than mechanism" defect `LANG-04` exists to prevent, now living inside the guard's own narration rather than inside its matcher. That alone is sufficient to fail LANG-04 this round, regardless of how the G1-c philosophical question is answered.

**For the record, my answer to G1-c itself:** a verifier CAN legitimately close a requirement on a narrowed, honestly-disclosed claim rather than a completed matcher — `D-55`'s approach is sound in principle, and the round's own accounting of the hard-wrap axis (`V-29-57-01`: reach 11/22, live count 0, direction FAIL-OPEN, remedy named and declined with a stated reason) is honest and would, on its own, be enough for me to accept the narrowing and mark LANG-04 closed on that specific axis. What keeps LANG-04 open this round is not the unresolved philosophical status of an old, disclosed, 0-live-count residual — it is two NEW, live, reproduced defects (CR-01, CR-02) in the remedy that was supposed to close it, found by the round's own review and independently confirmed by me on the tree as it ships today.

## Method

I read all round-8 plans (`29-56` through `29-60`) and their SUMMARYs, `29-REVIEW.md` (round 8, committed at `8510db6`), `29-VERIFICATION.md` (round 7, the source of the gap this round closes), and `docs/audit/29-round8-residuals.md` in full (2122 lines). I did not take the review's or the register's word for either critical finding — I independently reproduced both:

- **CR-01** on a fresh `git clone --local` of this repository (isolated from the working tree — verified `git status --porcelain` on the real repo is unaffected before and after).
- **CR-02** on a fresh `git archive HEAD | tar -x` mirror (a non-git directory, so no git state to disturb).

I re-ran the eight other repo gates live on the actual (unmutated) tree at `HEAD` (`check-imperative-lexicon.js`, `check-foundation-guards.js`, `check-audit-register.js`, `check-claim-anchors.js`, `check-kit-refs.js`, `check-public-docs-vocabulary.js`, `check-nul-bytes.js`, `check-diff-disposition.js`) rather than trusting the round's own transcript, plus `check-banned-claims.js` and `freshness.js` on the clean tree to confirm the baseline is genuinely green before mutation. I relied on the orchestrator's already-run full non-e2e suite (52 files, 2138 passed, 2 skipped, exit 0) rather than re-running it, per this workflow's "run the full suite at most once" constraint — I did not need it: both findings are demonstrated by direct gate invocation, not by the test suite (and CR-02's own root cause is that the new D-55 test case at `check-banned-claims.test.ts` structurally asserts `status === 0` first, so it cannot observe the defect I reproduced).

I did **not** independently re-derive every number in the 2122-line register (CR-03's short-by-two count, CR-04's shared-set-literal denominator, CR-05's row/file bijection) — I spot-checked their underlying evidence by direct file read (confirmed `:62-63` and `:351-352` still carry the unqualified wording CR-03 and the residual comment describe) and record them below as reviewed-but-not-independently-re-derived, distinct from CR-01/CR-02 which I fully reproduced with my own commands and my own output.

## Goal Achievement — Full-Phase Truths

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | **LANG-01** — grugops-authored, ASD-STE100-derived writing profile ships with a non-affiliation/not-certified disclaimer, vendors no ASD text | ✓ VERIFIED | Live gate re-run (`node scripts/check-imperative-lexicon.js`): `[LANG-01] 76 Technical Name(s) DERIVED from the kit, never listed`. Disclaimer frozen byte-for-byte against `docs/audit/28-claim-registry.md` (6 registry-anchored blocks), held live by `check-claim-anchors.js` and `check-banned-claims.js`, both exit 0. Unchanged by any round-8 plan; no round since round 4's 8/8 verification touched this section. |
| 2 | **LANG-02** — profile applies to procedural/agent-written surfaces, explicitly not the fenced caveman blocks | ✓ VERIFIED | Live gate re-run: `PASS LANG-02: 47 governed document(s) in 4 derived part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2 … 47 of 47 opened`; `agent-factory/roles/` excluded by name with its reason stated in the gate's own output. |
| 3 | **LANG-03** — named safety-surface exclusion list is honoured; load-bearing security/compliance/admission text is never reworded | ✓ VERIFIED (mechanism for knowing the set; honouring is human, disclosed as such) | Live gate re-run (`node scripts/check-audit-register.js`): exit 0, `ALL CHECKS PASSED`. The list itself (`docs/audit/28-safety-surface-exclusions.md`, 41 entries) is generated; **nothing reds if a listed file's prose is reworded** — this is a derived-list-honoured-by-review mechanism, not a gate over rewording, and the round's own §7.1 says so plainly. No round-8 plan touched this surface. |
| 4 | **LANG-04** — guards named for exactly their decidable subset; `guard_banned_claims` holds the conformance prohibition mechanically, with no fail-open route | ✗ FAILED | See "LANG-04 — explicit disposition" below and the frontmatter `gaps:` entry. The naming half (`guard_imperative_lexicon`, `guard_sentence_form`) is true and was never in doubt. The mechanical-prohibition half is not true on the tree that ships: CR-02 (narrated false claim on red runs) and CR-01 (the build-parity gate this phase leans on to trust every other mechanical claim also fail-opens) are both reproduced live below. |
| 5 | **LANG-05** — `## One job` / caveman block / `## Responsibilities` each say a thing once | ✓ VERIFIED | Live gate re-run (`node scripts/check-foundation-guards.js`): `guard_role_clause_uniqueness` — `0 findings over 17/17 elements`. No round 5-8 plan touched `agent-factory/roles/` clause structure (0 of 19 round-8 changed paths are role files, per the round's own §8.4 accounting, confirmed by `git diff --stat e848052..HEAD -- agent-factory/roles/` → no output). |
| 6 | **LANG-06** — voice guard measures against a committed lexicon, not sentence shape; fails RED on all 17 blocks as acceptance evidence before the rewrite lands | ✓ VERIFIED | Live gate re-run: `guard_caveman_voice` — `0 findings over 17/17 elements`, lexicon committed in `scripts/voice-model.ts` (16 terms). RED-on-17 acceptance evidence durably recorded in `docs/audit/28-claim-registry.md` `C-28-003` (`:100`, confirmed by direct read: "the guard was watched failing RED on all 17 blocks in plan 29-01 before it was allowed to pass"). No round 5-8 plan touched `voice-model.ts`. |
| 7 | **LANG-07** — the lexicon guards and the rebuilt voice guard share ONE fence parser, never two grammars over the same bytes | ✓ VERIFIED | Source read confirms `readCavemanFence` (voice guard) and `stripFencedBlocks` (lexicon guards) both compose `scripts/frontmatter.ts`'s `FENCE_DELIMITER_LINE`/`sectionEndIndex`. `scripts/frontmatter.ts` is byte-unchanged across round 8 (`git diff --numstat e848052..HEAD -- scripts/frontmatter.ts` → no output). This is the one `LANG` row that reads `[x]`/`Complete` in `.planning/REQUIREMENTS.md` today. |
| 8 | **LANG-08** — byte ceilings re-baselined once at end of phase, every file ≤ previous, delta recorded, never raised mid-phase | ⚠️ PASSED (override) | Carried from the accepted 2026-08-15 human override (unchanged through 8 rounds). Re-checked live this round: `guard_role_size` — 16 PASS within ceiling, 1 WARN approaching ceiling (`security-nfr.md`), 0 FAIL. No round-8 plan touched a role file. |

**Score:** 6/8 LANG requirements independently re-confirmed VERIFIED live + 1 override / 1 FAILED (LANG-04).

## LANG-04 — explicit disposition, with both reproductions in full

**LANG-04 is not met on the tree at `HEAD` (8510db6).** Two independent, live, reproduced defects — both freshly found by round 8's own code review, neither of which is the hard-wrap axis this round's residual register spent most of its argument defending — remain in the mechanism LANG-04 requires to be mechanical.

### Reproduction A — CR-02: the narrowed header sentence is printed on failing runs, where it is false

```
$ git archive HEAD | tar -x -C /tmp/cr02-repro
$ cd /tmp/cr02-repro
$ printf '\nThe caveman voice is a token economy and it saves tokens.\n' >> agent-factory/workflows/13-incident.md
$ node scripts/check-banned-claims.js

[guard_banned_claims] no single physical line of the 117 derived document(s) this gate scans carries any of the 22 pinned claim literal(s), outside the registry-anchored blocks of one named exemption region (LANG-04 / D-29, D-44)
  FAIL  banned claims: 2 finding(s) over 117 elements
        agent-factory/workflows/13-incident.md:46:24 — banned token-economy literal "token economy" — "The caveman voice is a token economy and it saves tokens."
        agent-factory/workflows/13-incident.md:46:45 — banned token-economy literal "saves tokens" — "The caveman voice is a token economy and it saves tokens."

== Result ==
1 CHECK(S) FAILED
$ echo "gate exit=$?"
gate exit=1
```

One physical, unwrapped line carries two pinned literals — no ambiguity, not the disputed hard-wrap axis at all — and the gate's own first line of output states that no line does. Root cause confirmed by direct read of `scripts/check-banned-claims.ts:2189-2195`: the `process.stdout.write()` for this sentence runs inside `runAll()` before the `DERIVATION_REFUSALS` loop, before the per-part vacuity floor, and before any finding is accumulated or rendered — it is unconditional, not gated to the success path. Confirmed structurally uncatchable by the round's own new test: `check-banned-claims.test.ts`'s D-55 behaviour case (~line 4083) asserts `expect(r.status, ...).toBe(0)` before it ever reads the header text, so a red run's header is never inspected by any committed case.

### Reproduction B — CR-01: the D-57 build-parity repair fail-opens on a committed-stale-then-dirtied-source tree

```
$ git clone --local /path/to/grugops /tmp/cr01-repro && cd /tmp/cr01-repro
$ npm ci --silent
$ printf '\n// planted drift\n' >> hooks/guard.js && git commit -qam "plant stale committed js"
$ node scripts/freshness.js | tail -2
STALE WORKING OUTPUT: hooks/guard.js — its source is modified or untracked, and the .js in the working
  tree is not a build of it. Run `npm run build` before committing.
BUILD-OUTPUT CHECK FAILED: 1 finding(s).                                        # correct so far

$ printf '\nexport const __devEdit = 1;\n' >> hooks/guard.ts && npx tsc          # ordinary dev action
$ node scripts/freshness.js | tail -2
Compared 48 path(s) derived from `git ls-tree -r HEAD` — 47 on the HEAD arm, 1 on the working-tree arm
  (uncommitted source); the arms sum to 48.
All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources.
$ echo "EXIT=$?"
EXIT=0                                                                          # FALSE
```

`HEAD`'s `hooks/guard.js` still carries the planted-stale commit and was never rebuilt against `HEAD`'s `hooks/guard.ts` — the run two commands earlier proved that. Once the source is touched (uncommitted) and rebuilt, the path routes to the working-tree arm, whose HEAD blob is never read, and the verdict line publishes "48 committed .js file(s) match a rebuild of their sources" over a set that includes the one path that demonstrably does not. This is the load-bearing G2 truth round 7 added ("the CI build-parity gate mechanically prevents a stale committed `.js` from shipping on `main`") and round 8 claimed to close under `D-57` — it is not closed on this window. `docs/audit/29-round8-residuals.md` §5.1 discloses `V-29-59-01` for the adjacent but narrower window (uncommitted, non-dirtied `.js`); this window (committed-stale, subsequently dirtied-and-rebuilt source) carries no id, no direction, and no live count anywhere in the register — confirmed by `grep -n "working-tree arm\|working arm\|STALE WORKING" docs/audit/29-round8-residuals.md` returning no hits for this specific composite scenario.

### What round 8 genuinely closed (independently reproduced)

- **The narrowed header sentence is TRUE on the round-7 hard-wrap plant.** Re-ran the round-7 reproduction (hard-wrapped `token / economy` claim) on a fresh mirror: `PASS banned claims: 0 findings over 117/117 elements`, and the header text — now narrowed — states only "no single physical line ... carries any of the pinned literals," which remains literally accurate of a wrap-split occurrence (the words are split across two physical lines; no single line carries the full literal). The narrowing is honest about what it does and does not claim, and `V-29-57-01` (reach 11/22, live 0, FAIL-OPEN, remedy named and declined by `D-56` with a stated, defensible reason) is a properly disclosed residual, not a silent drop.
- **The build-parity gate's SUBJECT genuinely moved to git.** `scripts/freshness.ts` now reads the committed side via `git show HEAD:<path>` and derives its compared set from `git ls-tree -r HEAD` rather than the working tree — this closes the specific defect round 7 demonstrated (build-then-freshness ordering in CI making the gate compare a rebuild against itself). The discrimination pair reproduces: a stale committed `.js` on a clone reds by name.

**Recommendation:** LANG-04 stays `Gaps Found`. A follow-up round should (a) move `check-banned-claims.ts`'s header write to the success path only, with a case proving its absence on a red run, and (b) either name the working-arm residue explicitly in `freshness.ts`'s verdict line or red on a non-empty working arm under a CI-only strict mode, with a `V-` id opened for the committed-stale + dirtied-source window this verification found no existing id for.

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|---|---|---|---|---|
| LANG-01 | 29-01..29-09, 29-58 | ASD-STE100-derived profile, disclaimer, no vendored text | ✓ SATISFIED | See truths table row 1 |
| LANG-02 | 29-10..29-20 | Profile applies to procedural surfaces, not caveman blocks | ✓ SATISFIED | See truths table row 2 |
| LANG-03 | 29-21..29-27, 29-51 | Safety-surface exclusion honoured | ✓ SATISFIED (mechanism for knowing the set; honouring is human, per the phase's own §7.1 disclosure) | See truths table row 3 |
| LANG-04 | 29-03, 29-40..29-47, 29-48..29-60 | Guards named for decidable subset; conformance prohibition mechanical | ✗ BLOCKED | See explicit disposition — CR-01 and CR-02, both independently reproduced |
| LANG-05 | 29-01, 29-28..29-30 | Role skeleton de-duplicated | ✓ SATISFIED | See truths table row 5 |
| LANG-06 | 29-01, 29-31..29-39 | Voice guard rebuilt against committed lexicon, RED-on-17 evidence | ✓ SATISFIED | See truths table row 6 |
| LANG-07 | 29-01, 29-48 (correction) | One shared fence parser | ✓ SATISFIED | See truths table row 7 |
| LANG-08 | 29-13 (override) | Byte ceilings re-baselined once | ⚠️ PASSED (standing override) | See truths table row 8 |

No orphaned requirement IDs found: `.planning/REQUIREMENTS.md:226` maps exactly `LANG-01..08` to Phase 29, matching the eight rows checked above and the phase's declared requirement set.

**`.planning/REQUIREMENTS.md` current state (unchanged this round, by `D-58`'s scope fence, confirmed via `git diff --numstat` reporting no change to the file across `e848052..HEAD`):** LANG-01/02/03/05/06/08 read `[ ]`/`Gaps Found`/`Pending` — this is known **stale bookkeeping** from a round-3 blanket revert that predates the round-4 8/8 verification and was never re-applied for anything but LANG-04/LANG-07 (traced in round 7's report, unchanged since). This verifier's own live re-runs above (not the file's stale rows) are the evidence for each row's status. LANG-04 correctly reads `[ ]`/`Gaps Found`, which matches this round's verdict. LANG-07 correctly reads `[x]`/`Complete`.

## Anti-Patterns / Round-8 Review Findings Not Independently Re-derived

Recorded so an absence of independent re-derivation is distinguishable from an absence of a finding. `29-REVIEW.md` (round 8, committed) reports 3 further Critical findings beyond CR-01/CR-02 and 7 Warnings / 3 Info. I spot-checked but did not fully re-derive:

| id | claim | spot-check performed | result |
|---|---|---|---|
| CR-03 | `V-29-60-05`'s "1 address" live count is short by two (`:62-63`, `:351-352` also carry the unqualified wording) | Direct read of `scripts/check-banned-claims.ts:60-66` and `:349-353` | Confirmed both addresses carry "THIS GATE PROVES that no pinned literal appears outside the one named exemption region" with no unit-of-decision qualifier, matching the review's quote |
| CR-04 | `freshness.test.ts`'s "independent" denominator (`ls-tree --name-only`) shares `OUTPUT_DIRS`'s literal set with the gate it tests | Not independently re-run | Not verified either way this round — recorded as an open review finding, not a verification blocker on its own (it is a proof-quality defect in a passing test, not a live fail-open) |
| CR-05 | the register's "13 rows = 13 sites" completeness equality is coincidental, not a bijection | Not independently re-run | Not verified either way this round — the review itself confirms no site was actually dropped, so this is a proof-quality finding, not a live gap |

These three are lower-severity in effect (proof-quality issues in artifacts that are not themselves fail-open, per the review's own analysis) than CR-01/CR-02 and are not separately blocking. They are recorded here as unresolved review findings for a follow-up round to close, not folded into this report's `gaps:` since they were not independently confirmed by me and the review itself frames them as distinct from the fail-open class.

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| CR-02 reproduces on a fresh mirror | `git archive HEAD \| tar -x`; plant unwrapped banned literal; `node scripts/check-banned-claims.js` | header sentence false, exit 1, findings named | ✓ CONFIRMS GAP |
| CR-01 reproduces on a fresh clone | `git clone --local`; plant+commit stale `.js`; dirty+rebuild its `.ts`; `node scripts/freshness.js` | "All build outputs fresh: 48..." printed, exit 0, over a set including the stale path | ✓ CONFIRMS GAP |
| Baseline: `check-banned-claims.js` green on the real, unmutated tree | `node scripts/check-banned-claims.js` | `PASS banned claims: 0 findings over 117/117 elements`, exit 0 | ✓ PASS |
| Baseline: `freshness.js` green on the real, unmutated tree | `node scripts/freshness.js` | `All build outputs fresh: 48...`, exit 0 | ✓ PASS |
| 8 other repo gates green on the real tree | `node scripts/check-{imperative-lexicon,foundation-guards,audit-register,claim-anchors,kit-refs,public-docs-vocabulary,nul-bytes,diff-disposition}.js` | all `ALL CHECKS PASSED`, exit 0 | ✓ PASS |
| Round-7 hard-wrap axis is honestly closed by narrowing (not by matcher fix) | Re-ran round 7's wrapped plant on a fresh mirror | `PASS ... 117/117`, header text narrowed and literally true of the wrap-split occurrence | ✓ CONFIRMS D-55's narrowing is real |

Full non-e2e suite not re-run in this verification pass (orchestrator already ran it: 52 files, 2138 passed, 2 skipped, exit 0, per this workflow's "run the full suite at most once" constraint). Neither CR-01 nor CR-02 would be caught by that suite — both are demonstrated by direct gate invocation on mutated trees, which is exactly what the suite's own structural gap (the `status === 0`-first assertion order in the D-55 test case) misses.

## Probe Execution

No `scripts/*/tests/probe-*.sh` files exist in this repository (`find scripts -path '*/tests/probe-*.sh' -type f` → no output) and no plan or summary in this phase references a probe script. Step 7c: SKIPPED — no probes declared or discovered.

## Gaps Summary

Round 8 genuinely closed round 7's stated gap on its own terms: the hard-wrap axis is honestly narrowed (`D-55`) rather than fixed, disclosed with a derived reach and a live count of 0 (`V-29-57-01`), and the decision to decline the matcher fix (`D-56`) is defensible and well-recorded. Taken alone, that would have been enough to close LANG-04.

It does not close, because the round's own code review — committed in the same round, and independently reproduced by me from scratch on the live tree — found two new, live defects inside the remedies round 8 shipped: the D-55-narrowed sentence is printed even when false (CR-02), and the D-57 build-parity repair still fail-opens on a realistic, ordinary sequence of developer actions (CR-01). Both are exactly the class of defect this phase's history is built from — a published sentence wider than its mechanism, or a proof that cannot fail — landing inside the round's own fixes for that exact class. Neither is disclosed with the completeness the register applies to its other residuals: CR-02 has no `V-` id and no disclosure anywhere; CR-01's specific window (committed-stale, subsequently-dirtied-and-rebuilt source) is not covered by the adjacent `V-29-59-01`, which names a narrower window.

LANG-01, LANG-02, LANG-03, LANG-05, LANG-06, LANG-07 remain independently verified live, and LANG-08 remains correctly carried under its standing, previously-accepted human override. The phase is not far from done — both remaining defects are narrow, mechanically well-understood, and each has a named, specific fix in this report's `missing:` bullets — but LANG-04 is not met on the tree that ships today.

---

_Verified: 2026-08-18T22:40:00Z_
_Verifier: Claude (gsd-verifier)_

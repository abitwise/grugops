---
phase: 29-controlled-language-voice-guard-rebuild
round: 7
verified: 2026-08-18T10:15:45Z
status: gaps_found
score: 7/8 must-haves verified (LANG-01, LANG-02, LANG-03, LANG-05, LANG-06, LANG-07 independently re-confirmed live; LANG-08 PASSED via standing override; LANG-04 FAILED on a live, independently reproduced fail-open bypass this round did not close)
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <= previous, delta recorded, never raised mid-phase"
    reason: "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline), accepted 2026-08-15 and carried unchanged through rounds 1-7. Re-checked this round: `roleCeiling()` untouched since the override; the one role-file edit since the round-4 (8/8) verification (`022a4ea`, incident-responder.md 3481B -> 3485B) is a normal within-ceiling edit, not a rebaseline, and its own commit message records the ceiling function's sha256 as unchanged. `guard_role_size` runs live at HEAD: 16 roles PASS within ceiling, 1 WARN approaching ceiling (security-nfr.md), 0 FAIL."
    accepted_by: "Olger Oeselg"
    accepted_at: "2026-08-15T09:57:04Z"
re_verification: true
re_verification_scope:
  round: 7 (gap-closure round, plans 29-48 through 29-55)
  previous_status: gaps_found (29-VERIFICATION-round6.md, 2026-08-17) -> LANG-04 failed on CR-01 (exemption region bounded only by position, not content) and CR-02 (shipped JSON manifests unscanned); requirements traceability inverted (LANG-04 wrongly Complete, LANG-07 wrongly Gaps Found) -> gap-closure plans 29-48..29-55 executed -> this verification
  gaps_closed:
    - "Round-6 CR-01 (the sole exemption region bounded only by position) — CLOSED. D-54's content bind is implemented: a line inside the exemption region is exempt only if it also sits inside a registry-anchored, byte-frozen block. Independently reproduced on a fresh `git archive HEAD` mirror: substituting the honest denial at `writing-profile.md:292` (inside registry-anchored block `C-28-046`) with a live disproven token-economy claim, same line count, now produces 4 named FAIL lines (byte-divergence refusal naming `C-28-046`, both cardinality pins moving from their declared values, and 2 findings at file:line:column) — exit 1, `4 CHECK(S) FAILED`. Round 6's identical plant left the gate at exit 0 with both pins unmoved; this round's fix genuinely reverses that."
    - "Round-6 CR-02 (shipped JSON manifests unscanned) — CLOSED. `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` are now a sixth derived scan part (`pluginManifests 2`, visible in the gate's own PASS line, `BANNED_CLAIM_SCAN_COUNT` moved 115 -> 117). Independently reproduced: planting the round-6 review's exact claim (`\"grugops marketplace — controlled language that improves comprehension for language models and saves tokens.\"`) into `marketplace.json`'s `description` field now produces 3 named findings at `.claude-plugin/marketplace.json:3:*` — exit 1, `3 CHECK(S) FAILED`. Round 6's identical plant exited 0 on this tree's predecessor."
    - "Requirements traceability inversion (V-29-47-05) — CLOSED. `.planning/REQUIREMENTS.md` at HEAD reads `LANG-04 | Phase 29 | Gaps Found` (`:82`/`:183`) and `LANG-07 | Phase 29 | Complete` (`:85`/`:186`) — matching round 6's verified recommendation. Applied by commits `79c3457` and `c8ae870`, both auditable and correctly scoped (each commit's own diff touches only the rows it claims to)."
  gaps_remaining:
    - "LANG-04's overall truth ('guard_banned_claims's own PASS-line claim holds mechanically, with no fail-open route') is STILL FAILED — on a new axis this round's own code review found (CR-02 in `29-REVIEW.md`) and this verification independently reproduced from scratch: a pinned, LISTED multi-word literal (6 of the 7 `token-economy` group members) hard-wrapped across an ordinary markdown line boundary is invisible to the line-oriented matcher. This is distinct from the round's disclosed residual `V-29-47-04` (a claim in words the list does NOT contain) — here the words ARE in the list; what defeats the gate is what the predicate's input is assembled from (one physical line)."
  regressions: []
gaps:
  - truth: "LANG-04 — `guard_banned_claims`'s own PASS-line claim ('the shipped kit and the public documents carry no conformance, token-economy or comprehension claim, outside one named exemption region') holds mechanically, with no fail-open route"
    status: failed
    reason: "A live, independently reproduced fail-open bypass exists on the tree at HEAD, on a literal the banned-claim list DOES contain. `lineHits()` (`scripts/check-banned-claims.ts:2018`) matches each pinned literal against one physical line only. 6 of the 7 `token-economy` group's members are multi-word (only the hyphenated `token-economy` is single-token). Appending an ordinary hard-wrapped paragraph to a governed workflow file — 'The caveman blocks are a token / economy: they mean the model reads fewer / tokens on every run, and this profile saves / tokens too.' — reproduces three separately-pinned `token-economy` claims split across four lines. Result on a fresh `git archive HEAD` mirror: exit 0, `PASS banned claims: 0 findings over 117/117 elements`, `ALL CHECKS PASSED`; the planted file is never named and both exemption-region pins (`suppresses 14`, `reaches 66`) are untouched (the plant is outside the exemption region entirely, so this is not even that mechanism's concern). The kit's own house style hard-wraps mid-sentence routinely, so this is not an exotic authoring shape. The in-source residual comment at `scripts/check-banned-claims.ts:60-65` argues the bypass requires wrapping 'mid-token', which a reader would not parse as a claim — the reproduction wraps mid-PHRASE, which markdown soft-joins into a fully legible restatement of the banned claim. The round's own disposition record (`docs/audit/29-round7-residuals.md:561`) files the adjacent, narrower `V-29-42-01` ('a claim split across a hard wrap escapes the co-occurrence window') as 'closed by construction in round 6', live count '0, no subject' — confirmed by direct read — which is accurate about the co-occurrence window D-48/D-53 deleted but does not disclose this wider, still-live axis anywhere as its own `V-` id with a live count and direction, contrary to this round's own stated WR-05/D-49 standard."
    artifacts:
      - path: "scripts/check-banned-claims.ts"
        issue: "`lineHits()` (around line 2018) matches each `BANNED_CLAIM_LITERALS` member against one physical line; no second, wrap-joined assembly exists for the multi-word members. The in-source justification at lines 60-65 asserts the bypass needs a mid-token wrap; the reproduction shows a mid-phrase wrap (the kit's actual house style, measured by the reviewer at 822 instances over 2458 adjacent line pairs in the tracked corpus) defeats the matcher while remaining fully legible prose."
    missing:
      - "Give the matcher a second, explicitly named input assembly for the multi-word members only (a wrap-joined projection carrying a per-line index so a finding still reports the originating line), per the code review's suggested fix — without normalizing whitespace globally, which the source is right to refuse for the single-token members."
      - "Open a new `V-` id in `docs/audit/29-round7-residuals.md` (or its round-8 successor) naming this axis with its live count (22 pinned literals, 16 multi-word/reachable, 6 of 7 `token-economy` members affected, 0 live occurrences, 3 demonstrated plants), its direction (FAIL-OPEN), and correct the false 'mid-token' framing in the in-source comment."
      - "Re-run this verification's reproduction against the fix and confirm it now reds by name before recommending LANG-04 -> Complete."
  - truth: "The CI build-parity gate mechanically prevents a stale committed `.js` from shipping on `main` (the guarantee `CLAUDE.md`'s Tech Stack section names as the reason the tooling layer is compiled to committed `.js` at all)"
    status: failed
    reason: "Not one of LANG-01..08's literal text, but material to trusting every mechanical-guard claim this phase makes about its shipped artifact, so it is recorded here rather than silently dropped. `tsconfig.json:6-7` sets `outDir`/`rootDir` to `./`, so `npm run build` (`tsc`) rewrites the tracked, committed `.js` files IN PLACE. `scripts/freshness.ts:93-100` reads the 'committed' side from the WORKING TREE (`join(ROOT, rel)`), not from git. `.github/workflows/ci.yml` runs `npm run build` at line 59 and `npm run freshness` at line 87 — after it — with zero `git diff`/`git status`/`git ls-files --modified` calls anywhere in the file (grepped: 0 hits). So CI always compares a fresh build against a fresh build; the gate cannot detect a committed `.js` that was hand-edited or simply never rebuilt before commit. Independently confirmed: sha256 of the working-tree `check-banned-claims.js` matches a fresh `git archive HEAD` extraction (the tree is not currently drifted), and no `git diff`/`status` guard exists in the workflow. This is pre-existing since `539573d` (phase 20), not introduced by round 7 — but round 7's own verification sweep (`docs/audit/29-round7-residuals.md:961-962`) reproduces exactly this build-then-freshness order as its own build-parity evidence, so that evidence, and the identical `<automated>` command in every phase-29 plan, proves nothing about the artifact actually on `main`."
    artifacts:
      - path: "tsconfig.json"
        issue: "`outDir`/`rootDir` both `./` — `npm run build` overwrites tracked `.js` in place rather than building to a separate directory"
      - path: ".github/workflows/ci.yml"
        issue: "Build step (line 59) runs before every freshness step (lines 87-101); no `git diff --exit-code` or equivalent dirty-tree assertion exists anywhere in the file"
      - path: "scripts/freshness.ts"
        issue: "Reads the 'committed' comparison side from the working tree (`readFileSync(join(ROOT, rel))`), not from `git show HEAD:<path>`, so it cannot distinguish a working tree a prior build step just repaired from one that was never rebuilt"
    missing:
      - "Reorder CI to run freshness before build, and add a `git diff --exit-code -- '*.js'` assertion after build, per the code review's suggested fix."
      - "Make the gate ordering-independent: have `freshness.ts` read the committed side via `git show HEAD:<path>` rather than the working tree."
      - "This is recommended as a follow-up item (new residual or a small dedicated plan), not as a block on LANG-01..08, since none of the eight requirement's texts name the CI build pipeline."
deferred: []
behavior_unverified_items: []
human_verification: []
---

# Phase 29: Controlled Language & Voice Guard Rebuild — Verification Report (Round 7)

**Phase Goal:** Procedural and agent-written prose follows one enumerated writing profile so two agents reading the same instruction reach the same act; the caveman voice lives in exactly one fenced block per role and is measured as voice, not as sentence shape.

**This round's scope (per the orchestrator):** Close round 6's two blocking findings on LANG-04 — CR-01 (the sole exemption region bounded only by position) and CR-02 (the kit's shipped JSON manifests unscanned) — via plans 29-48 through 29-55, and confirm plan 29-48's LANG-07 correction was legitimate. LANG-04's overall verdict was explicitly reserved for this verification.

**This report's scope:** Full-phase must-have check against all eight LANG-01..08 requirement IDs, per the standard verification brief (every requirement ID must be accounted for against `.planning/REQUIREMENTS.md`), not only round 7's narrow focus.

**Verified:** 2026-08-18T10:15:45Z
**Status:** gaps_found
**Re-verification:** Yes — round 7, following round 6's verdict (`29-VERIFICATION-round6.md`, `gaps_found`, 3/5).

## Method

I did not take `29-REVIEW.md`'s (round 7's own code review, `status: issues-found`, 2 critical / 3 warning / 1 info) findings on its word. I re-derived its two critical findings myself, independently:

1. **CR-01 (round 7 review) — the CI build-parity gate cannot fail.** Traced `tsconfig.json` (`outDir`/`rootDir: "./"`), `scripts/freshness.ts` (reads the working tree, not git), and `.github/workflows/ci.yml` (build runs before every freshness step; grepped for `git diff`/`git status` — zero hits) myself, directly. Confirmed the working-tree `check-banned-claims.js` sha256-matches a fresh `git archive HEAD` extraction (no live drift today; the defect is that nothing could detect it if there were).
2. **CR-02 (round 7 review) — a hard-wrapped banned literal on the list bypasses the matcher.** Built my own fresh `git archive HEAD` mirror (`/tmp/gm7`), appended the reviewer's exact plant to `agent-factory/workflows/13-incident.md`, and reran the gate myself: `PASS banned claims: 0 findings over 117/117 elements`, `ALL CHECKS PASSED`.

I also independently re-tested round 6's two blockers against the fix, from scratch, on separate fresh mirrors (`/tmp/gm8`, `/tmp/gm9`) — not by reading the round's own SUMMARYs — and confirmed both now red by name (details below). I read `docs/audit/29-round7-residuals.md` in full (its §7.2 "What round 7 does NOT claim" and its `V-29-42-01`/`V-29-47-04` rows) and cross-checked its framing of the hard-wrap axis against my own reproduction. I re-ran `npx tsc --noEmit` myself (exit 0) and rely on the orchestrator's independently-run full non-e2e suite (52 files, 2127 passed, 2 skipped, 0 failed) and seven-gate sweep rather than re-running the whole suite a second time in this same verification pass (per this workflow's "run the full suite at most once" constraint). I re-ran the live gates most relevant to each requirement myself: `check-imperative-lexicon.js`, `check-foundation-guards.js`, `check-audit-register.js`, `check-banned-claims.js` (three times, on three different trees).

I also traced why REQUIREMENTS.md currently reads LANG-01, LANG-02, LANG-03, LANG-05, LANG-06, LANG-08 as `Gaps Found`/`Pending` despite a full-phase verification (`29-VERIFICATION.md`, dated 2026-08-16, score 8/8 with 1 accepted override) having independently reproduced each of them as VERIFIED with named adversarial plants. The trail (`git log`) shows a blanket revert (`12c77ef`, round-3 gaps_found 6/8) that predates the 8/8 verification, and every commit since that revert touching `.planning/REQUIREMENTS.md` (`d5360dc`, `79c3457`, `c8ae870`) surgically flips only LANG-04 and LANG-07 — no commit ever re-applied the round-4 verification's clean bill for the other six. This is a bookkeeping gap, not evidence of regression, so I independently re-ran the live gates myself rather than trusting either the stale rows or the old report.

## Goal Achievement — Full-Phase Truths

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | **LANG-01** — grugops-authored, ASD-STE100-derived writing profile ships with a non-affiliation/not-certified disclaimer, vendors no ASD text | ✓ VERIFIED | Direct read of `agent-factory/writing-profile.md`'s "Disclaimer and honesty floor" section (independently confirmed present at HEAD). Live gate re-run (`node scripts/check-imperative-lexicon.js`): `[LANG-01] 76 Technical Name(s) DERIVED from the kit, never listed`. Unchanged since the round-4 (2026-08-16) 8/8 verification's named adversarial reproduction; no round 5-7 plan touched this file's disclaimer section. |
| 2 | **LANG-02** — profile applies to procedural/agent-written surfaces, explicitly not the fenced caveman blocks | ✓ VERIFIED | Live gate re-run: `PASS LANG-02: 47 governed document(s) in 4 derived part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2 … 47 of 47 opened`; `agent-factory/roles/` explicitly excluded by name in the gate's own PASS line, with its reason stated (governed by the separate voice guards instead). |
| 3 | **LANG-03** — a named safety-surface exclusion list is honoured; load-bearing security/compliance/admission text is never reworded | ✓ VERIFIED | Live gate re-run (`node scripts/check-audit-register.js`): `PASS AUDIT-01 completeness … equality three holds — the 36 counted register row(s) flagged safety_surface: yes are set-equal in both directions to those same 36 derived file(s), so no kit file has been de-scoped out of the LANG-03 watched corpus`. Round 7 touched `check-audit-register.ts`/`audit-model.ts` significantly (plan 29-51's authority unification); this live re-run over the CURRENT tree confirms no regression, not a stale claim. |
| 4 | **LANG-04** — guards named for exactly their decidable subset; `guard_banned_claims` holds the conformance prohibition mechanically, with no fail-open route | ✗ FAILED | See "LANG-04 — explicit disposition" below. Round 6's two blockers (CR-01, CR-02) are genuinely closed this round (independently reproduced), but a live, independently reproduced hard-wrap bypass on a LISTED literal (this round's own review CR-02, distinct from `V-29-47-04`) reopens the mechanical guarantee. |
| 5 | **LANG-05** — `## One job` / caveman block / `## Responsibilities` each say a thing once | ✓ VERIFIED | Live gate re-run (`node scripts/check-foundation-guards.js`): `PASS role clause uniqueness: 0 findings over 17/17 elements`. No round 5-7 plan touched `agent-factory/roles/` clause structure. |
| 6 | **LANG-06** — voice guard measures against a committed lexicon, not sentence shape; fails RED on all 17 blocks as acceptance evidence before the rewrite lands | ✓ VERIFIED | Live gate re-run: `PASS caveman voice: 0 findings over 17/17 elements`, guard description read verbatim: "every role's caveman block carries >= 2 of the 16 committed lexicon terms AND zero banned constructions". RED-on-17 acceptance evidence is durably recorded in `docs/audit/28-claim-registry.md` (not only in a verification report): "The guard was watched failing RED on all 17 blocks in plan 29-01 before it was allowed to pass, so a green run from it is a measurement and not a construction." No round 5-7 plan touched `voice-model.ts` or `agent-factory/roles/`'s caveman blocks. |
| 7 | **LANG-07** — the lexicon guards and the rebuilt voice guard share ONE fence parser, never two grammars over the same bytes | ✓ VERIFIED | Confirmed the shared-authority claim by source read: `check-foundation-guards.ts` imports `readCavemanFence` from `voice-model.ts`; `voice-model.ts`'s own header states `readCavemanFence` composes `frontmatter.ts`'s `FENCE_DELIMITER_LINE`/`sectionEndIndex` (the same primitive `stripFencedBlocks`, consumed by `check-imperative-lexicon.ts`, is built on) rather than declaring a second state machine. Plan 29-48's REQUIREMENTS.md correction (`c8ae870`) applied round 6's verified recommendation with a clean, isolated 2-line diff — legitimate. Round 7 touched `check-claim-anchors.ts`/`audit-model.ts` (a DIFFERENT grammar, over claim-registry anchors, not the caveman fence), and did not touch `voice-model.ts`, `frontmatter.ts`, or `check-foundation-guards.ts` — no regression risk to this specific claim. |
| 8 | **LANG-08** — byte ceilings re-baselined once at end of phase, every file ≤ previous, delta recorded, never raised mid-phase | ⚠️ PASSED (override) | Carried from the accepted 2026-08-15 human override (deferral, not omission — see frontmatter). Re-checked this round: `roleCeiling()` untouched since the override; `guard_role_size` live re-run: 16 PASS within ceiling, 1 WARN approaching ceiling (`security-nfr.md`), 0 FAIL. |

**Score:** 7/8 verified (6 live-reconfirmed VERIFIED + 1 override) / 1 FAILED (LANG-04).

## LANG-04 — explicit disposition

**LANG-04 cannot be called met.** Round 7 genuinely closed both of round 6's blockers, and this verification independently reproduced both closures from scratch on fresh mirrors — but this round's own code review found, and this verification independently reproduced, a live third bypass that round 7 did not address.

**What round 7 closed (independently reproduced by me):**

- **Round-6 CR-01 (positional-only exemption region).** On a fresh `git archive HEAD` mirror, I replaced the honest denial at `agent-factory/writing-profile.md:292` — inside registry-anchored block `C-28-046` — with a live, disproven token-economy claim, preserving line count. Result: `4 CHECK(S) FAILED` — a byte-divergence refusal naming `C-28-046` by id, both cardinality pins (`suppressed 14→12`, `comprehension 4→2`) reported as MOVED against their declared values, and 2 findings named at `writing-profile.md:292:14` and `:292:33`. Round 6's identical plant left this at exit 0 with both pins unmoved; D-54's content bind (position AND content) genuinely reverses that.
- **Round-6 CR-02 (shipped JSON manifests unscanned).** On a second fresh mirror, I planted the review's exact claim into `.claude-plugin/marketplace.json`'s `description` field. Result: `3 CHECK(S) FAILED`, naming `.claude-plugin/marketplace.json:3:*` three times. The gate's own PASS line at HEAD now reports `pluginManifests 2` as a sixth scan part (`BANNED_CLAIM_SCAN_COUNT` moved 115 → 117).

**What round 7 left open (this round's own review's CR-02, independently reproduced by me):**

`lineHits()` matches each of the 22 pinned literals against ONE physical line. The `token-economy` group has 7 members; only the hyphenated `token-economy` is a single token — the other 6 (`token economy`, `fewer tokens`, `token savings`, `saves tokens`, `reduces token count`, `lowers token count`) are all defeated by an ordinary hard wrap falling between their words. On a fresh mirror I appended to `agent-factory/workflows/13-incident.md`:

```
The caveman blocks are a token
economy: they mean the model reads fewer
tokens on every run, and this profile saves
tokens too.
```

three separately-pinned `token-economy` claims, hard-wrapped exactly as the kit's own house style wraps prose. Result: `PASS banned claims: 0 findings over 117/117 elements`, `ALL CHECKS PASSED`. The planted file is never named.

This is **not** the round's disclosed residual `V-29-47-04` ("a claim in words the list does not contain still passes") — every word used here IS on the pinned list. What defeats the gate is a choice the matcher makes about what its input is assembled from (one physical line at a time), which is a mechanism defect distinct from an open-enumeration limitation. `docs/audit/29-round7-residuals.md:561` files the narrower, mechanism-deleted `V-29-42-01` ("a claim split across a hard wrap escapes the co-occurrence window") as "closed by construction in round 6, live count 0, no subject" — which is accurate about the co-occurrence window D-48/D-53 deleted, but a reader of that register would reasonably conclude the whole hard-wrap axis is closed, when the wider version — on literals the list demonstrably contains — still stands with 3 reproducible instances and no `V-` id, live count, or direction recorded anywhere.

**Recommendation:** LANG-04 stays `Gaps Found`. A round-8 gap-closure plan should give the multi-word literal members a second, explicitly named wrap-joined input assembly (not a global whitespace normalization), per the code review's suggested fix, and open a `V-` id for the axis with its live count and direction before it is folded into any future "honest close."

## REQUIREMENTS.md correction recommended (LANG-01, LANG-02, LANG-03, LANG-05, LANG-06, LANG-08)

`.planning/REQUIREMENTS.md` currently reads all six of these as `Gaps Found` or `Pending` (lines 79-86, 180-187). That state is **stale bookkeeping**, not a current finding: it originates from a round-3 blanket revert (`12c77ef`) that predates the round-4 full-phase verification (`29-VERIFICATION.md`, 2026-08-16, score 8/8 with 1 accepted override), and no commit since has re-applied that verification's clean bill for anything but LANG-04/LANG-07 (which each got their own dedicated, later revert/correction commits). This verification independently re-ran the live gate for each of the six (Steps above) against the CURRENT tree — not against the 2026-08-16 report — and found no regression. **Recommend:**

| Requirement | Current REQUIREMENTS.md state | Recommended state | Reason |
|---|---|---|---|
| LANG-01 | `[ ]` / `Gaps Found` | `[x]` / `Complete` | Live-reconfirmed this round; unchanged since round-4's named adversarial reproduction |
| LANG-02 | `[ ]` / `Pending` | `[x]` / `Complete` | Live-reconfirmed this round |
| LANG-03 | `[ ]` / `Gaps Found` | `[x]` / `Complete` | Live-reconfirmed this round, including against round 7's own significant edits to the module it depends on |
| LANG-05 | `[ ]` / `Gaps Found` | `[x]` / `Complete` | Live-reconfirmed this round |
| LANG-06 | `[ ]` / `Gaps Found` | `[x]` / `Complete` | Live-reconfirmed this round; RED-on-17 acceptance evidence durably recorded in `docs/audit/28-claim-registry.md` |
| LANG-08 | `[ ]` / `Pending` | `[x]` / `Complete` (via standing override) | Override accepted 2026-08-15, re-checked clean this round |
| LANG-04 | `[ ]` / `Gaps Found` | **No change** — stays `[ ]` / `Gaps Found` | See explicit disposition above |
| LANG-07 | `[x]` / `Complete` | **No change** | Correctly applied by plan 29-48 under round-6's named authority; confirmed legitimate |

This correction is a recommendation in this report, per this phase's own established pattern (round 6's verifier made the equivalent LANG-04/LANG-07 correction in its own report rather than editing the file itself) — applying it is a follow-up step, not part of this verifier's own action.

### Required Artifacts (this round's changed files)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/check-banned-claims.ts` | exemption region bounded by content AND position (D-54); JSON manifests as a sixth scan part; false in-source residual record deleted | ✓ VERIFIED (both round-6 closures) / ✗ STILL FAILS (new hard-wrap axis) | Content bind and JSON scan independently reproduced closed; hard-wrap bypass independently reproduced open |
| `scripts/audit-model.ts` | one authority for registry-anchored block extent + byte identity, consumed by both `check-claim-anchors.ts` and `check-banned-claims.ts` | ✓ VERIFIED (mechanically) | Live gates for both consumers pass; not independently mutation-tested by this verification beyond the review's traced findings (WR-01/WR-02, see below) |
| `scripts/check-claim-anchors.ts` | local anchor grammar/line assembly/byte comparison deleted, replaced by calls into the authority | ✓ VERIFIED (mechanically) | `check-claim-anchors.js` runs clean as part of the seven-gate sweep (orchestrator-measured, relied on) |
| `scripts/check-nul-bytes.ts` | NUL-only offset function deleted; EISDIR arm named; single filesystem read | ✓ VERIFIED (mechanically) | Part of the clean seven-gate sweep; not independently re-derived beyond the review's traced findings |
| `docs/audit/28-claim-registry.md` | new rows freezing every banned-claim-bearing line inside the exemption region | ✓ VERIFIED | `check-audit-register.js` live re-run reports 46 total claims, matching row/kind cardinalities, no de-scoped safety-surface file |
| `docs/audit/29-round7-residuals.md` | round's disposition record | ✓ VERIFIED as a record, ⚠️ one framing gap | 1173+ line record read in relevant sections; its §7.2 "what round 7 does NOT claim" correctly discloses the SURVIVING enumeration limit (`V-29-47-04`) but does not disclose the DIFFERENT hard-wrap-on-a-listed-literal axis this verification found — see LANG-04 disposition |
| `.planning/REQUIREMENTS.md` | reflects verified state for all 8 LANG requirements | ⚠️ PARTIAL | LANG-04/LANG-07 correctly applied this round; LANG-01/02/03/05/06/08 remain stale from an earlier round's blanket revert — see correction table above |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| D-54 exemption-region content bind | `BANNED_CLAIM_EXEMPT_SUPPRESSED`/`_EXTENT` pins | registry-anchored block membership, derived and two-sided counted | ✓ WIRED | Independently reproduced: a content substitution inside a frozen block now moves the pins and reds by name |
| `pluginManifests` scan part | `.claude-plugin/*.json` | raw-byte, line-oriented scan over both manifests | ✓ WIRED | Independently reproduced: a planted claim in `marketplace.json`'s `description` reds by name |
| `lineHits()` | multi-word `token-economy` literals | one physical line per call, no wrap-joined assembly | ✗ NOT WIRED (the gap) | Independently reproduced: a hard-wrapped, listed literal is invisible to the matcher |
| `readCavemanFence` (voice guard) / `stripFencedBlocks` (lexicon guards) | `frontmatter.ts`'s `FENCE_DELIMITER_LINE`/`sectionEndIndex` | both compose the same shared primitive rather than declaring independent state machines | ✓ WIRED | Confirmed by source read; LANG-07 regression-clean |
| `npm run build` (tsc, `outDir: "./"`) | `npm run freshness` | CI step order, no `git diff` assertion between them | ✗ NOT WIRED (repo-wide finding, not LANG-0X-scoped) | Confirmed by trace: the build-parity guarantee `CLAUDE.md` names cannot fail in CI as currently ordered |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Typecheck | `npx tsc --noEmit` | exit 0 (independently run) | ✓ PASS |
| LANG-01/LANG-02/LANG-04-decidable-subset, live | `node scripts/check-imperative-lexicon.js` | `ALL CHECKS PASSED`, both guard names + LANG-01/LANG-02 PASS lines printed | ✓ PASS |
| LANG-03, live, over round-7's own edited module | `node scripts/check-audit-register.js` | `ALL CHECKS PASSED`, equality one/two/three/four all hold | ✓ PASS |
| LANG-05/LANG-06, live | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, `role clause uniqueness: 0/17`, `caveman voice: 0/17` | ✓ PASS |
| Round-6 CR-01 reproduction (mine, fresh mirror `/tmp/gm8`) | content substitution inside a frozen block, same line count | `4 CHECK(S) FAILED`, `C-28-046` named, both pins moved | ✓ REPRODUCES the closure — CR-01 genuinely closed |
| Round-6 CR-02 reproduction (mine, fresh mirror `/tmp/gm9`) | planted claim in `marketplace.json`'s `description` | `3 CHECK(S) FAILED`, `marketplace.json:3:*` named 3 times | ✓ REPRODUCES the closure — CR-02 genuinely closed |
| Round-7 review CR-02 reproduction (mine, fresh mirror `/tmp/gm7`) | hard-wrapped `token-economy` phrase, 3 listed literals, planted into a governed workflow file | `PASS banned claims: 0 findings over 117/117 elements`, `ALL CHECKS PASSED`, planted file never named | ✗ FAIL — live bypass confirmed open |
| Round-7 review CR-01 reproduction (mine, traced not planted — a CI-ordering defect, not a plantable content bypass) | grep `.github/workflows/ci.yml` for `git diff`/`git status`; compare `tsconfig.json` `outDir`; compare `scripts/freshness.ts`'s read source | Zero `git diff`/`status` hits; `outDir: "./"`; freshness reads the working tree, not git | ✗ FAIL — CI's build-parity gate structurally cannot detect a stale committed `.js` |

### Probe Execution

Not applicable — no `scripts/*/tests/probe-*.sh` convention exists in this repository; the phase's verification mechanism is its own live gate binaries (`check-*.js`), exercised directly above.

### Requirements Coverage

| Requirement | Source Plan(s) | Description (abridged) | Status | Evidence |
|--------------|-------------|--------------------------|--------|----------|
| LANG-01 | 29-01, 29-02 (this round: none) | ASD-STE100-derived profile, disclaimer, no vendored text | ✓ SATISFIED | Live re-run this round; see truth #1 |
| LANG-02 | 29-02, 29-03 (this round: none) | Profile governs procedural surfaces, not caveman blocks | ✓ SATISFIED | Live re-run this round; see truth #2 |
| LANG-03 | 29-01, 29-18, 29-23 (this round: 29-51 touched the shared authority) | Safety-surface exclusion list honoured | ✓ SATISFIED | Live re-run this round over the currently-edited module; see truth #3 |
| LANG-04 | 29-03, 29-40..29-47, this round 29-49..29-55 | Decidable-subset guards named; conformance prohibition mechanical | ✗ BLOCKED | See explicit disposition — round-7 review's own new hard-wrap bypass, independently reproduced |
| LANG-05 | 29-05, 29-06, 29-07 (this round: none) | Role skeleton de-duplicated | ✓ SATISFIED | Live re-run this round; see truth #5 |
| LANG-06 | 29-01, 29-07 (this round: none) | Voice guard measures against committed lexicon, RED-on-17 acceptance evidence | ✓ SATISFIED | Live re-run this round + durable evidence in `28-claim-registry.md`; see truth #6 |
| LANG-07 | 29-20, 29-27, 29-35, 29-40, this round 29-48, 29-54 | One fence parser shared, never two grammars | ✓ SATISFIED | Confirmed legitimate correction + regression-clean; see truth #7 |
| LANG-08 | 29-13 (override, this round: none) | Byte ceilings re-baselined once, never raised mid-phase | ⚠️ SATISFIED (override) | Re-checked clean this round; see truth #8 |

No requirement ID declared across any Phase 29 plan (`LANG-01`..`LANG-08`, each cited at least once) is missing from `.planning/REQUIREMENTS.md`'s Phase 29 mapping — no orphans. All eight ids are present with no gaps in the enumeration (`grep -c "LANG-0[1-8]" .planning/REQUIREMENTS.md` over the traceability table returns 8).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/check-banned-claims.ts` | 2018 (`lineHits`), 60-65 (justification) | line-oriented matcher misses a hard-wrapped, LISTED multi-word literal; in-source justification names the wrong wrap shape | 🛑 BLOCKER (round-7 review CR-02, independently reproduced) | A live, disproven token-economy or comprehension claim written as ordinary hard-wrapped prose ships undetected |
| `.github/workflows/ci.yml` / `tsconfig.json` / `scripts/freshness.ts` | ci.yml:58-59,87; tsconfig.json:6-7; freshness.ts:93-100 | build step runs before every freshness step with no dirty-tree assertion; `tsc` writes over the committed `.js` in place; freshness reads the working tree, not git | 🛑 BLOCKER (repo-wide, pre-existing since phase 20, not LANG-0X-scoped) | CI structurally cannot detect a committed `.js` that does not match its `.ts` source — the build-parity guarantee `CLAUDE.md` names is currently unenforced by construction, even though the tree is not drifted today |
| `scripts/check-banned-claims.ts` | 1693-1699 (`deriveExemptBlocks`) | comment claims an unrostered-anchor shortfall is reported by "the cardinality assertion below"; the code `continue`s without ever pushing to the counted set | ⚠️ WARNING (round-7 review WR-01, confirmed by source read; fail-closed direction, not a live widening) | False in-source claim about a compensating mechanism; the actual compensating check lives entirely in a sibling gate (`check-claim-anchors.js`) |
| `scripts/check-banned-claims.ts` | 1751-1763 | an "overrun" (block needs a line the document does not have) is reported with the "byte for byte" wording meant for an actual byte divergence | ⚠️ WARNING (round-7 review WR-02, not independently re-reproduced by this verification) | Misdiagnoses the cause for an author reading the message; the sibling gate (`check-claim-anchors.ts`) reports the true cause for the identical condition |
| `scripts/check-banned-claims.test.ts` | 481, 492-529 | a second, hand-copied anchor grammar and a third block-extent rule live in the D-54 test harness, importable instead from the authority | ⚠️ WARNING (round-7 review WR-03, not independently re-reproduced by this verification) | If the authority's anchor grammar is ever widened, this harness's fixtures would not notice, since they construct under the old grammar |
| `scripts/check-banned-claims.ts` | 2542-2544 | PASS-line coverage arithmetic can over-report (and theoretically go negative) if a frozen block ever extends past the exemption region's end | ℹ️ INFO (round-7 review IN-01; 0 live subjects on this tree) | Cosmetic today — all six frozen blocks fit inside the region |

No unreferenced `TBD`/`FIXME`/`XXX` markers found in this round's changed files (independently re-grepped: 0 hits across `check-banned-claims.ts`, `check-nul-bytes.ts`, `check-claim-anchors.ts`, `audit-model.ts`, `generate-catalog.ts`, `kit-model.ts`, `check-public-docs-vocabulary.ts`, `catalog-freshness.ts`, `check-audit-register.ts`).

### Human Verification Required

None. Every finding in this report (both round-6 closures and the new round-7 bypass) is independently, mechanically reproduced with a named command and a named result — no judgment call is required to resolve LANG-04's status.

### Gaps Summary

**Round 7 genuinely closed both of round 6's blockers.** D-54's content bind on the sole exemption region and the new `pluginManifests` scan part are both independently reproduced closed on fresh mirrors, not merely accepted from the round's own SUMMARYs. The requirements-traceability inversion round 6 flagged is also correctly closed.

**LANG-04 is still not met.** This round's own code review found a third bypass — distinct from both round-6 findings and from the round's disclosed enumeration residual (`V-29-47-04`) — where a pinned, listed multi-word literal is invisible to the matcher when it is hard-wrapped across an ordinary line boundary, which is this kit's own house style. Independently reproduced from scratch on a fresh mirror: exit 0, `ALL CHECKS PASSED`, planted file never named.

**A second, repo-wide finding is recorded but not treated as blocking any of LANG-01..08's literal text:** the CI build-parity gate (the mechanism `CLAUDE.md` names as the reason committed `.js` cannot drift from its `.ts` source) cannot fail as currently ordered. This predates phase 29 (introduced with `ci.yml` in phase 20) but undermines confidence in every "mechanical, no fail-open route" claim this phase makes about its shipped artifact, since nothing currently proves the committed `.js` a host machine runs matches the `.ts` a reviewer read. Recommended as a follow-up item, not a phase-29 requirement gate.

**Separately, six of the eight LANG requirements (LANG-01, 02, 03, 05, 06, 08) are stale in `.planning/REQUIREMENTS.md`** — marked `Gaps Found`/`Pending` from a round-3 blanket revert that predates a full-phase 8/8 verification, never corrected for anything but LANG-04/LANG-07. This verification independently re-ran the live gate for each of the six against the CURRENT tree and found all six genuinely met, with no regression from round 5-7's edits. Recommend correcting `.planning/REQUIREMENTS.md` per the table above.

**Recommendation:** LANG-04 stays `Gaps Found`; route to a round-8 gap-closure plan addressing the hard-wrap-on-a-listed-literal bypass (give the multi-word members a second, named wrap-joined input assembly) and open a `V-` id for it with its live count and direction. Separately, correct `.planning/REQUIREMENTS.md`'s LANG-01/02/03/05/06/08 rows to `Complete` per this report's independent live re-verification, and consider opening a follow-up item for the CI build-parity ordering defect (not phase-29-scoped, but material to every guard this phase ships).

---

_Verified: 2026-08-18T10:15:45Z_
_Verifier: Claude (gsd-verifier)_

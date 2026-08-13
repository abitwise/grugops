---
phase: 29-controlled-language-voice-guard-rebuild
plan: 07
subsystem: docs
tags: [kit-prose, role-skeleton, caveman-voice, dual-voice-safety, byte-ceilings, dispositions, claim-registry, generator-cascade]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 01
    provides: "voice-model.ts (readCavemanFence, CAVEMAN_LEXICON, CAVEMAN_LEXICON_MIN, BANNED_CONSTRUCTIONS, segmentClauses, normalizeSentence), guard_caveman_voice and guard_role_clause_uniqueness with their RED 17/12 baseline"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 02
    provides: "agent-factory/writing-profile.md — the WP-01..WP-10 style contract, and guard_banned_claims"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 04
    provides: "guard_diff_disposition, the docs/audit/29-style-dispositions/ contract and its recorded base commit 4d2b8f0"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 05
    provides: "the nine-step per-role pipeline, the D-30 fallback sentence in its kit-legal form, the `## Responsibilities` deletion rule, and the derived voice-guard count helpers with their non-vacuity floor"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 06
    provides: "fifteen of seventeen roles on the canonical skeleton, and the precedent that a safety rule which cannot survive telegraphic compression is DELETED from the compressed position rather than paraphrased"
provides:
  - "seventeen of seventeen role files on the canonical D-19 skeleton — the role track is closed"
  - "the first fully green `node scripts/check-foundation-guards.js` run of the phase: 0 findings over 17/17 on BOTH role-prose guards"
  - "docs/audit/29-style-dispositions/29-07.md — two written three-way sentence partitions plus 32 rows over 39 distinct changed clauses"
  - "three registry rows flipped `overstated -> true` (C-28-003, C-28-012, C-28-032) and three F-28-2NN findings closed"
  - "the complete command-derived 17-role byte table, for plan 29-13's re-baseline"
  - "allRedMirror() — a PLANTED all-red voice fixture that replaces the deleted rawMirror(), so the `||` falsifiability proof no longer depends on the corpus staying broken"
affects: [29-08, 29-13, 29.1, 30]

actuals:
  tokens: 26400
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Partition the sentences BEFORE editing a dual-voice file, and write the partition down — the judgement about which sentence is safety-bearing is the reviewable artifact, not the diff"
    - "A safety rule that cannot survive telegraphic compression is DELETED from the compressed position, never paraphrased into it"
    - "When a fixture's discriminating power comes from the corpus being broken, PLANT the broken input instead of borrowing it — otherwise fixing the corpus silently turns the proof vacuous"
    - "A derived count is proven two-sided in ONE suite run when the same function returns N on a planted-red fixture and 0 on the live tree"

key-files:
  created:
    - docs/audit/29-style-dispositions/29-07.md
  modified:
    - agent-factory/roles/security-nfr.md
    - agent-factory/roles/compliance-officer.md
    - .claude/agents/grugops-security-nfr.md
    - .claude/agents/grugops-compliance-officer.md
    - docs/catalog/README.md
    - docs/audit/28-claim-registry.md
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "D-41 executed literally a third time: ZERO `^You are ` lines survive anywhere in the 17-role corpus, by two independent methods"
  - "`security-nfr.md` lands 171 under its unchanged FAIL ceiling but 101 ABOVE its advisory WARN tier, and the gap was NOT closed by inventing a fifth removal — chasing an advisory tier with an unplanned deletion in the tightest safety file is the exact 'compress to make a byte target' trap the plan forbids"
  - "The `## Responsibilities` items in BOTH files kept their act and lost their prohibition clause, under the 29-05 subject rule, rather than being deleted whole as the plan's prose suggested — deleting whole would have bought 37 more bytes and was refused"
  - "C-28-012 and C-28-032 were flipped to `true` as well as count-corrected. The plan's Task 3 prose names only the grug-brained flip, but D-30 states both rows flip when the sentence lands in every role, and this plan is where the 17th lands"
  - "The stale 4,036-byte figure was REPLACED by a measured 2,329 with its reproducing command, not annotated beside it — the acceptance grep asks for zero occurrences, and gaming that grep by respelling the number would have been worse than either"
  - "No byte ceiling was raised, considered, or edited"

patterns-established:
  - "A dual-voice role file's caveman block may become maximally grug precisely BECAUSE the block surrenders its facts — the safety text is untouched, so the block has nothing left to muddy"
  - "guard_voice's clear-voice marker scan is the mechanical bleed detector, and it was measured firing rather than assumed: a planted `shiny rock` in `## Responsibilities` reds by file and line"
  - "When a plan's own acceptance criterion and its prose disagree, satisfy the criterion honestly and record the disagreement — do not respell text to slip past the grep"

requirements-completed: [LANG-05, LANG-06]

coverage:
  - id: D1
    description: "Seventeen role files say each thing once — the what in `## One job`, identity in the caveman block, the how in `## Responsibilities`, every prohibition in `## Hard limits` alone (LANG-05, COMPLETE)"
    requirement: "LANG-05"
    verification:
      - kind: integration
        ref: "node scripts/check-foundation-guards.js — guard_role_clause_uniqueness `PASS  role clause uniqueness: 0 findings over 17/17 elements`, down from 12 groups across 9 files in plan 29-01's RED transcript"
        status: pass
      - kind: other
        ref: "the three-occurrence `do not invent legal advice` group — the highest multiplicity in the corpus — resolved by section ownership: `## Hard limits` keeps it byte-unchanged; `## One job`, the caveman block and `## Responsibilities` item 4 each give it up"
        status: pass
      - kind: other
        ref: "D-19 section ownership is still NOT mechanically enforced — carried forward from 29-01/29-05/29-06 as a residual, held by per-file review plus the uniqueness guard's observable half"
        status: pass
    human_judgment: true
  - id: D2
    description: "Seventeen caveman blocks carry measured voice — lexicon tokens at or above the minimum and zero banned constructions — with the per-block measurement published (LANG-06, COMPLETE)"
    requirement: "LANG-06"
    verification:
      - kind: integration
        ref: "guard_caveman_voice `PASS  caveman voice: 0 findings over 17/17 elements`, with 17 measured lines carrying 3..5 lexicon terms against a floor of 2 and banned 0 throughout (full transcript below)"
        status: pass
      - kind: other
        ref: "`^You are ` returns 0 across all 17 role files by two independent methods (Node walk and `grep -acE`); it was 17 at 29-01, 11 after 29-05, 2 after 29-06"
        status: pass
      - kind: other
        ref: "four hermetic mutations (copula restored, lexicon stripped, duplicate re-added, token bled out of the fence) each turn the correct guard RED on a mirror; the unmutated mirror is green"
        status: pass
    human_judgment: false
  - id: D3
    description: "The two safety-surface files received the profile deliberately, sentence by sentence, with the judgement written down rather than assumed (LANG-03, partial — later plans hold the workflows)"
    requirement: "LANG-03"
    verification:
      - kind: integration
        ref: "npm run check:diff-disposition — `0 findings over 305/305 elements`, 229 rows across 3 files, exit 0"
        status: pass
      - kind: other
        ref: "two written three-way sentence partitions (safety-bearing / style-only / caveman) precede every edit row in docs/audit/29-style-dispositions/29-07.md"
        status: pass
      - kind: other
        ref: "the register proves dispositioning happened and nothing about any disposition's substance; the LANG-03 check is a named human reading the 32 rows against the diff. This matters most here — both files are dual-voice safety documents"
        status: pass
    human_judgment: true
  - id: D4
    description: "Both files are under their unchanged FAIL ceilings, with the five-point and four-point transcripts and both headrooms recorded"
    verification:
      - kind: other
        ref: "`git diff 1364ec8 HEAD -- scripts/check-foundation-guards.ts` is EMPTY — roleCeiling() is byte-unchanged"
        status: pass
      - kind: integration
        ref: "guard_role_size: security-nfr.md 4931B (FAIL 5102, +171; WARN 4830, -101 and still WARN); compliance-officer.md 4292B (FAIL 4813, +521; WARN 4555, +263)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The three deferred claims are flipped or corrected, and no correction trips the verbatim byte freeze"
    verification:
      - kind: integration
        ref: "npm run check:claim-anchors exit 0 — `42 verbatim comparison(s) performed, all byte-identical`, the count unchanged from its pre-task value of 42, proving all corrections were mechanism prose"
        status: pass
      - kind: integration
        ref: "npm run check:audit-register exit 0; a fresh generate-safety-surface run leaves docs/audit/28-safety-surface-exclusions.md byte-unchanged at 41 entries (no edited row's kind moved)"
        status: pass
      - kind: other
        ref: "`grep -c 'zero of 18'` = 0, `grep -c '4,036 bytes'` = 0, `grep -c 'listRoles'` = 5 (>= 3 required)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The generator cascade ran once, in D-47 order, inside each role-edit commit; all three byte gates green and a second regeneration leaves the tree clean"
    verification:
      - kind: integration
        ref: "freshness:adapters / freshness:skill-twins / freshness:catalog all exit 0; a second full regeneration leaves `git status --porcelain` clean over .claude/, agent-factory/, docs/catalog/ and the derived exclusion list"
        status: pass
      - kind: other
        ref: "`git show --stat` on bdb2e6f and 1b611d1 each carries the role, its adapter and the catalog in one commit"
        status: pass
    human_judgment: false
  - id: D7
    description: "The suite's derived voice-guard expectations were flipped back deliberately, and the flip is not vacuous"
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 51 files, 1,724 passed, 2 skipped; identical to the 29-05 and 29-06 baselines"
        status: pass
      - kind: other
        ref: "with a single copula reintroduced into security-nfr.md in the real tree, BOTH flipped cases go RED; the file was then restored byte-identical to HEAD (`git diff --stat` empty)"
        status: pass
      - kind: other
        ref: "the SAME derivation returns 17 on the planted all-red mirror and 0 on the live tree within one suite run — a two-sided proof 29-05's one-sided floor could not give"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-08-14
status: complete
---

# Phase 29 Plan 07: The Two Dual-Voice Safety Roles Summary

**The role track closed at seventeen of seventeen and the aggregator exited 0 for the first time in the phase — both role-prose guards moved from `2 findings` and `1 finding` to `0 findings over 17/17 elements` — with the two hardest files in the corpus rewritten under written sentence partitions, no safety rule compressed to buy a byte, no ceiling touched, three deferred public claims flipped in place with their counts and their unreproducible byte figure corrected, and the derived suite expectation that 29-05 built to fail on exactly this plan failing on exactly this plan and being flipped back rather than retyped.**

## Performance

- **Duration:** 55 min
- **Tasks:** 3
- **Commits:** 3
- **Files changed:** 9 (1 created, 8 modified) — 305 insertions, 90 deletions since `1364ec8`

## `security-nfr.md` — the five-point transcript

Every value produced by `wc -c`. Ceilings transcribed from `roleCeiling()`, which this plan does not modify.

| step | bytes | delta | running |
|---|---:|---:|---:|
| baseline (entering the plan, and 29-06's named residual) | 5027 | — | 5027 |
| after the caveman-block reduction (D-09, D-41) | 4998 | **−29** | 4998 |
| after the `## One job` trailing delete + first-sentence compression (D-19, WP-02) | 4877 | **−121** | 4877 |
| after the `## Responsibilities` item 4 prohibition-clause drop (D-19, WP-10) | 4825 | **−52** | 4825 |
| after the D-30 when-absent fallback sentence (D-37 ordering) | **4931** | **+106** | **4931** |

**Removed 202, added back 106, net −96.** Final **4931**.

| tier | value | headroom |
|---|---:|---:|
| FAIL | 5102 | **+171** |
| WARN | 4830 | **−101** |

**It fits under its unchanged FAIL ceiling and it is still above WARN, and that is recorded rather than closed.** The research projected this file breaching 5102 on the D-19 trailing delete plus the D-30 sentence alone; measured, the two together land it at 5098, four bytes inside. The margin came from the two removals §A-1b does not model — the caveman content surrender and the 29-word first-sentence compression.

Closing the remaining 101 bytes to WARN would have required a **fifth removal the plan does not name**, in the file the plan calls the tightest budget in the phase, taken from prose the partition classifies as safety-bearing. That is precisely the "never compress a safety rule to make a byte target" trap. It was available and refused. WARN is advisory — `guard_role_size` prints `WARN … approaching ceiling` and contributes nothing to the aggregator's exit code, which is 0.

The D-37 escalation **never arose**: the file was never above FAIL at any of the five measurement points, so the two remaining options the plan holds in reserve — a human-approved further reduction, or a file split — were never needed. `git diff 1364ec8 HEAD -- scripts/check-foundation-guards.ts` is **empty**.

## `compliance-officer.md` — the four-point transcript

| step | bytes | delta | running |
|---|---:|---:|---:|
| baseline | 4433 | — | 4433 |
| after the caveman-block reduction (D-09, D-41) | 4318 | **−115** | 4318 |
| after the `## One job` trailing delete + first-sentence compression | 4217 | **−101** | 4217 |
| after the `## Responsibilities` item 4 prohibition-clause drop | 4186 | **−31** | 4186 |
| after the D-30 when-absent fallback sentence | **4292** | **+106** | **4292** |

**Removed 247, added back 106, net −141.** Final **4292** — **+263 to WARN (4555)** and **+521 to FAIL (4813)**. It entered above neither tier and leaves comfortably under both.

## The two `## One job` sentences

Word counts measured by splitting the same first sentence `generate-catalog.ts`'s `firstSentence()` extracts — the string that becomes the adapter `description`.

| role | before | trailing sentence | after | words |
|---|---:|---|---|---:|
| `security-nfr` | 29 | 6 words | `Review a change for security and non-functional risk, and return a result with required fixes and accepted risks.` | **18** |
| `compliance-officer` | 31 | 5 words | `Protect people and the audit trail: classify the data a change touches and record the controls and gaps.` | **18** |

Both are under the 20-word bound. Both regenerated descriptions keep their routing surface:

```diff
-description: "Look for danger across a change — review authentication, data, secrets, performance, reliability, logging, and compliance notes — and return a clear result with required fixes and accepted risks. Use when: …"
+description: "Review a change for security and non-functional risk, and return a result with required fixes and accepted risks. Use when: …"

-description: "Protect people and the audit trail: classify the data a change touches, map the PII flow, check the applicable regime, and record the controls in place and the gaps that remain. Use when: …"
+description: "Protect people and the audit trail: classify the data a change touches and record the controls and gaps. Use when: …"
```

The terms each sheds are carried by `## Activates when`, which supplies the adapter's whole `Use when:` half — `compliance_regime`, personal / financial / health / payment data for the Compliance Officer, and the full fifteen-item risk-surface trigger list for Security/NFR. Nothing routable was lost; it moved to the half of the description that already owned it.

## The sentence partitions, and what they bought

Both partitions are written in full in `docs/audit/29-style-dispositions/29-07.md`, before any edit row. The summary of the judgement:

| file | safety-bearing (untouched in meaning AND register) | style-only (governed) | caveman block |
|---|---|---|---|
| `security-nfr.md` | the ASVS `security.asvs_level` filter rule; the 15-item `## Activates when` trigger list; `## Responsibilities` 1, 2, 3; `## Output`'s `PASS` / `PASS_WITH_RISKS` / `BLOCKED` vocabulary; the whole `## Hard limits` severity map | `## One job`; `## Reads` bullets 1, 2, 3, 5; `## Responsibilities` 4's act; board/trace; the three pointer lines | 146 B, 21 words, 0 tokens, 1 copula |
| `compliance-officer.md` | the regime-naming sentence; `## Activates when`; `## Responsibilities` 1, 2, 3 and item 4's escalation half; `## Output`'s checklist and its own never-in-caveman-voice rule; the whole `## Hard limits` | `## One job`; `## Reads` 2, 3, 4; item 4's act and its closing rhetoric; board/trace; the three pointer lines | 234 B, 41 words, 0 tokens, 3 banned |

**Not one sentence in either safety-bearing column changed.** `git diff` over both files touches **no line inside any `## Hard limits` section**, no line of `## Activates when`, no line of `## Output`, and no `## Responsibilities` item beyond item 4's trailing prohibition clause. The only edits inside a `## Reads` bullet are the two D-30 appends.

The partition is what makes that reviewable rather than assertable. A reader can now check the judgement — *is the ASVS filter rule really safety-bearing?* — against a written claim, instead of reverse-engineering it from what happened not to change.

## The measured caveman lines — the GREEN that gives 29-01's RED its meaning

`node scripts/check-foundation-guards.js`, tree at HEAD, 2026-08-14:

```
        agents-md-scribe.md: tokens 5 / content words 26, banned 0
        architect-design.md: tokens 4 / content words 24, banned 0
        ba-pm.md: tokens 5 / content words 25, banned 0
        brownfield-mapper.md: tokens 4 / content words 21, banned 0
        compliance-officer.md: tokens 4 / content words 21, banned 0
        factory-coach.md: tokens 5 / content words 30, banned 0
        frontend-ui.md: tokens 4 / content words 34, banned 0
        greenfield-mapper.md: tokens 3 / content words 16, banned 0
        incident-responder.md: tokens 4 / content words 27, banned 0
        installer.md: tokens 3 / content words 22, banned 0
        orchestrator.md: tokens 5 / content words 41, banned 0
        qe-e2e.md: tokens 3 / content words 19, banned 0
        release-manager.md: tokens 3 / content words 22, banned 0
        security-nfr.md: tokens 3 / content words 21, banned 0
        software-engineer.md: tokens 4 / content words 28, banned 0
        system-analyst.md: tokens 3 / content words 25, banned 0
        uat-planner.md: tokens 3 / content words 18, banned 0
  PASS  caveman voice: 0 findings over 17/17 elements
```

```
  PASS  role clause uniqueness: 0 findings over 17/17 elements
```

**Seventeen clean measured lines, zero findings, on both guards.** Every block carries **3 to 5 distinct lexicon terms against a floor of 2** and **zero** banned constructions. The journey, per plan:

| guard | 29-01 (RED baseline) | after 29-05 | after 29-06 | **after 29-07** |
|---|---:|---:|---:|---:|
| `guard_caveman_voice` | 17 / 17 | 10 / 17 | 2 / 17 | **0 / 17** |
| `guard_role_clause_uniqueness` | 12 groups over 9 files | 5 | 1 | **0** |

Both denominators are unmoved at 17 throughout. **No predicate was widened and no scan set was narrowed to reach this** — the proof is the falsifiability section below.

## The uniqueness verdict — the last group, resolved by ownership

Plan 29-06 left one group, the highest multiplicity in the corpus:

```
  compliance-officer.md: "do not invent legal advice" x3 at line(s) 9, 17, 45
```

Three sides, and **`## Hard limits` is the section that keeps the sentence**:

| side | where | verdict |
|---|---|---|
| 1 | `## One job` trailing sentence — `Do not invent legal advice.` | **gives it up.** It is a prohibition, and `## Hard limits` is the only section that may carry one. |
| 2 | caveman block line 5 — `You do not invent legal advice.` | **gives it up.** D-09: the block is the section that surrenders content. Rewriting it as telegraphic attitude was available and refused — a fenced paraphrase of a legal boundary is the worse of the two risks. |
| 3 | `## Responsibilities` item 4 — `without inventing legal advice` | **gives it up as a clause.** The item's subject is an act, so under the 29-05 rule the item stays and only the prohibition clause goes. |
| — | **`## Hard limits`** — `Do not invent legal advice.` | **KEEPS IT, byte-unchanged**, and is now its sole home. |

Three sides removed, one kept, group count 1 → 0. The permission withheld is identical; it is stated once, in the section that owns it, instead of three times.

## Falsifiability — the guards still discriminate against MY prose

This is the plan that turns both guards green, which makes tuning a predicate to fit the prose maximally tempting and maximally damaging. So it was measured rather than argued. Four mutations on a hermetic mirror of HEAD, each asserted to have applied before the guard ran:

| mutation | expected red | result |
|---|---|---|
| M0 — unmutated control | none | `voice` PASS · `caveman voice` **0/17** · `uniqueness` **0/17** |
| M1 — `You are Security/NFR.` restored (one copula) | `guard_caveman_voice` | **FAIL 1 finding** |
| M2 — compliance-officer block rewritten in plain English, lexicon stripped | `guard_caveman_voice` | **FAIL 1 finding** |
| M3 — `Do not invent legal advice.` re-added to `## One job` | `guard_role_clause_uniqueness` | **FAIL 1 finding** |
| M4 — `shiny rock` planted in `## Responsibilities` (a bleed OUT of the fence) | `guard_voice` | **FAIL**, naming `agent-factory/roles/security-nfr.md:26` |

**M4 is the one that matters most for this plan.** The whole dual-voice argument rests on the claim that a caveman token escaping into safety text reds mechanically. That claim is now measured: `guard_voice` prints `FAIL  voice-discipline violation:` with the file and the line. It is not a promise in a comment.

`guard_role_size`'s ceiling table was not touched in any mutation, and none of the four required a predicate change to produce.

## The three deferred claims

### C-28-003 — `Each agent is grug-brained on purpose: one job, short words, hard limits` (README.md:14)

`overstated` → **`true`**, `disposition` / `finding_id` / `target_phase` removed per the registry's own rule that a `true` row carries none.

| half | Phase 28 | now |
|---|---|---|
| `one job` | held | holds, and all 17 are now a single act of at most 20 words |
| `hard limits` | held | holds, and `guard_role_clause_uniqueness` at 0/17 is the observable half of "stated there and nowhere else" |
| `short words` | **FAILED** — *"ZERO occurrences of `grug`… plain second-person English"* | **HOLDS**, measured: `0 findings over 17/17`, 3–5 lexicon terms per block against a floor of 2, and **11 of the 17 blocks carry the literal token `grug`** |

The rewritten mechanism names the guard, the lexicon module, the floor constant, the denominator, the derivation rule for that denominator, the byte figure, the command that reproduces it, and the fact that the guard was watched failing RED on all 17 in plan 29-01 — so the row's own text tells a reader how to falsify it. It also carries an explicit `UNKNOWN - verify`: **the row does not claim the voice is effective.** It claims a measurement against a committed lexicon, and nothing about tokens, comprehension or model behaviour — which is C-28-042's territory and stays there.

### C-28-012 and C-28-032 — the when-absent config fallback

Both `overstated` → **`true`**. The D-30 sentence — *"With no config file present, this role runs lean on the documented defaults in `agent-factory/README.md`."* — now stands in the `## Reads` section of **17 of 17** in-set role files, measured two ways:

| method | value |
|---|---:|
| `grep -lc` (forced text mode) | **17** |
| Node directory walk, `String.includes` | **17** |
| in-set role files | **17** |

Phase 28 measured **zero**. C-28-032's causal clause — *"because every role falls back to these same documented defaults when the file is absent"* — is the strong form, and the sentence it now rests on **points at the very section of `agent-factory/README.md` where that claim lives**, which is why 29-05's Rule-3 retarget chose that file. Both rows carry a recorded `UNKNOWN - verify` residual: the sentence is an instruction in every role file, and no gate asserts an agent reading it actually behaves that way at run time.

### The three stale counts and the unreproducible byte figure (D-32, D-45)

| field | was | now |
|---|---|---|
| C-28-003 mechanism — block count | *"the 18 fenced caveman blocks"* | **17**, with the `listRoles()` derivation rule beside it |
| C-28-012 mechanism — role-file denominator | *"a grep across all 18 role files"* | **17**, same rule |
| C-28-032 mechanism — role-file denominator | *"a grep across all 18 role files"* | **17**, same rule |
| C-28-003 mechanism — block-interior bytes | *"total 4,036 bytes"* | **2,329** (post-rewrite), with **3,528** named as the pre-rewrite figure and the command that reproduces both |
| findings table F-28-202 / F-28-204 / F-28-212 | `overstated · deferred → 29` | **`true` · —** with the closure quotable |

**Each corrected count carries its derivation rule in the same field**, in the same sentence, plus an explicit instruction not to correct it back: `kit-model.listRoles()` drops underscore-prefixed entries by derivation, so `_role-switch-protocol.md` is out of set for counting, it is a protocol document rather than a role an agent is activated as, and it correctly carries no caveman block. `grep -c 'listRoles' docs/audit/28-claim-registry.md` returns **5**.

**The byte figure is now reproducible.** The command is in the field:

```sh
node -e 'const{readCavemanFence}=require("./.tmp-build/scripts/voice-model.js");const{listRoles}=require("./.tmp-build/scripts/kit-model.js");const fs=require("fs"),p=require("path");let t=0,n=0;for(const f of listRoles(".")){t+=Buffer.byteLength(readCavemanFence(fs.readFileSync(p.join("agent-factory/roles",p.basename(f)),"utf8")).inside,"utf8");n++}console.log(n,t)'
# HEAD      -> 17 2329
# 4d2b8f0   -> 17 3528
```

Both numbers were produced by running it, and the 3,528 confirms D-45's independent measurement exactly. The superseded 4,036 was produced by a different extractor over 18 files and **no command in this tree reproduces it** — which is the defect the count correction exists to fix, one clause to the right.

### The byte freeze held, and it was run rather than assumed

```
  PASS  42 registry row(s) — … 42 verbatim comparison(s) performed, all byte-identical
```

**42 before, 42 after, all byte-identical.** All four corrections landed in `mechanism` prose, none in a verbatim anchor, so nothing needed a same-commit anchor edit. `check-audit-register` exits 0, and a fresh `generate-safety-surface` run leaves the derived 41-entry exclusion list **byte-unchanged** — no edited row's `kind` moved, so the derived list cannot disagree with its source.

## The complete 17-role byte table (for plan 29-13)

Every value read by `fs.statSync().size` in this plan. Ceilings transcribed from `roleCeiling()`, untouched.

| role | bytes | WARN | headroom | FAIL | headroom |
|---|---:|---:|---:|---:|---:|
| `agents-md-scribe.md` | **3764** | 4301 | +537 | 4544 | +780 |
| `architect-design.md` | **3574** | 4016 | +442 | 4243 | +669 |
| `ba-pm.md` | **3605** | 3901 | +296 | 4180 | +575 |
| `brownfield-mapper.md` | **2580** | 2693 | +113 | 2845 | +265 |
| `compliance-officer.md` | **4292** | 4555 | +263 | 4813 | +521 |
| `factory-coach.md` | **3448** | 3633 | +185 | 3839 | +391 |
| `frontend-ui.md` | **3724** | 3757 | +33 | 3969 | +245 |
| `greenfield-mapper.md` | **2873** | 2882 | +9 | 3045 | +172 |
| `incident-responder.md` | **3481** | 3598 | +117 | 3802 | +321 |
| `installer.md` | **3325** | 3727 | +402 | 3938 | +613 |
| `orchestrator.md` | **6802** | 7165 | +363 | 7570 | +768 |
| `qe-e2e.md` | **3608** | 3617 | +9 | 3822 | +214 |
| `release-manager.md` | **4001** | 4510 | +509 | 4765 | +764 |
| `security-nfr.md` | **4931** | 4830 | **−101** | 5102 | +171 |
| `software-engineer.md` | **3507** | 3697 | +190 | 3906 | +399 |
| `system-analyst.md` | **2962** | 3000 | +38 | 3170 | +208 |
| `uat-planner.md` | **3316** | 3350 | +34 | 3540 | +224 |
| **total (17 roles)** | **63793** | | | | |

**Sixteen of seventeen roles are under their WARN tier; one (`security-nfr.md`) is 101 above it and 171 under FAIL.** Every one of the seventeen is under FAIL. This is the one command-derived input plan 29-13 needs, so it does not have to reconcile three summaries.

## The generator cascade (D-47)

Run in order — adapters, then skill twins, then catalog — **inside each role-edit commit**:

```
generate-role-adapters: wrote 17 adapters (coordinator grugops-orchestrator grants 16 names)
generate-skill-twins:   rendered 7 twin(s) from skills, 0 written, 7 already identical
generate-catalog:       wrote 17 roles and 19 workflows to docs/catalog/README.md
```

| gate | exit |
|---|---|
| `npm run freshness:adapters` | **0** |
| `npm run freshness:skill-twins` | **0** |
| `npm run freshness:catalog` | **0** |

A second full regeneration — all three generators plus `generate-safety-surface` — leaves `git status --porcelain` **clean** over `.claude/`, `agent-factory/`, `docs/catalog/` and the derived exclusion list. **The skill twins moved zero bytes a third time**, confirming D-47's two-hop shape: neither of this plan's roles is one of the seven twinned skills.

## The disposition register

`npm run check:diff-disposition` — **exit 0**:

```
        17 watched file(s) changed since 4d2b8f0; 305 changed clause(s) derived; 229 disposition row(s) across 3 file(s)
  PASS  diff disposition: 0 findings over 305/305 elements
```

The 305 total covers 29-05's seven files, 29-06's eight and this plan's two. **This plan's share is 41 gate findings collapsing to 39 distinct (file, clause) pairs, answered by 32 rows** — a row matches by file *and* clause rather than by line, so one row answers a clause reported on both sides of the diff or at two line numbers.

**Four frozen-set intersections**, all four in `compliance-officer.md` and all four the same clause — `do not invent legal advice` — each carrying its companion cell rather than an exemption. **The frozen text is byte-unchanged in every case.** What moved is its duplicates elsewhere in the file. `git diff 1364ec8 HEAD -- agent-factory/roles/` touches **no line inside any `## Hard limits` section** in either file.

### The `## Responsibilities` rule, applied to both files

| role | item | verdict |
|---|---|---|
| `security-nfr` | 4 — *Publish a result as typed notes — without gold-plating beyond the identified risk.* | **clause dropped, item kept** |
| `compliance-officer` | 4 — *Extend the security/NFR review without inventing legal advice — …* | **clause dropped, item kept** |

Both items' subjects are acts, so under the rule 29-05 wrote down the item stays and only the prohibition clause goes. **Deleting `security-nfr` item 4 whole was available and would have bought 37 more bytes toward the WARN tier. It was refused** — see *Deviations*.

## Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-foundation-guards.js` | **exit 0** — *ALL CHECKS PASSED*. **The first fully green aggregator run of the phase.** |
| — `guard_caveman_voice` | `PASS  0 findings over 17/17 elements` |
| — `guard_role_clause_uniqueness` | `PASS  0 findings over 17/17 elements` |
| — `guard_role_size` | 16 PASS, 1 WARN (`security-nfr.md` 4931B ≥ 4830B) |
| `node scripts/check-imperative-lexicon.js` | exit 1 — the 29-03 baseline, unchanged (roles are outside its governed corpus) |
| `npm run check:banned-claims` | exit 0 |
| `npm run check:diff-disposition` | exit 0 — `0 findings over 305/305 elements` |
| `npm run check:claim-anchors` | exit 0 — 42/42 byte-identical |
| `npm run check:audit-register` | exit 0 |
| `node scripts/check-kit-refs.js` · `check-nul-bytes.js` · `check-public-docs-vocabulary.js` · `check-uat-oracles.js` | all exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **48** committed `.js` pairs, unchanged |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **51 files, 1,724 passed, 2 skipped** (29-05/29-06 baseline 51 / 1,724 / 2 — unmoved) |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| aggregator wall clock, 3 runs | **0.12 s / 0.10 s / 0.10 s** (29-06: 0.11 / 0.09 / 0.09; 29-01 baseline 0.12 / 0.09 / 0.09) |
| `.planning/STATE.md` longest line | **7,994** (§F-2 baseline 7,994 — at it, not above) |
| `.planning/STATE.md` longest backslash run | **1** (§F-2 baseline 1 — unmoved) |
| `git diff 1364ec8 HEAD -- package.json` | empty — zero packages installed |
| `git diff 1364ec8 HEAD -- scripts/check-foundation-guards.ts` | **empty** — `roleCeiling()` byte-unchanged |

The F-2 escape-doubling mechanism stayed dormant and the superlinear-regex incident did not recur.

## Occurrence counts, with the method that produced each (F-3)

A bare recursive grep reports zero matches on a binary-classified file with no warning, so every count names its method and two independent methods were run.

| count | value | method |
|---|---:|---|
| role files walked | 18 total / **17 in-set** | Node `fs` walk, `_`-prefixed filtered — the `listRoles()` rule |
| files failing a UTF-8 round-trip | **0** | Node: `Buffer.compare(Buffer.from(buf.toString('utf8'),'utf8'), buf)` per file |
| lines starting `You are ` | **0** (was 2 after 29-06, 11 after 29-05, 17 at 29-01) | Node walk, per-line `startsWith` |
| — same, cross-check | **0** | `grep -acE '^You are '` — forced text mode |
| files carrying the D-30 sentence | **17** (was 15) | Node walk, `includes` |
| — same, cross-check | **17** | `grep -lc` — forced text mode |
| blocks carrying the literal token `grug` | **11** of 17 | `readCavemanFence(...).inside` + `\bgrug\b` |
| block-interior total, HEAD | **2,329 B** | the command recorded in C-28-003 |
| block-interior total, 4d2b8f0 | **3,528 B** | same command over a `git archive` of the base tree |
| `file -b` on both rewritten files | `Unicode text, UTF-8 text` | `file(1)` |

Both methods agree at every count. **The 29-05 encoding hazard did not recur** — every edit in Tasks 1 and 2 went through the structured editor, and the round-trip check over all 18 role files reports 0 failures. `perl -pi -e` was used **only** inside hermetic temp mirrors for the falsifiability mutations, never on a tracked file except the single restore-verified mutation in the flip-back proof, which was restored byte-identical (`git diff --stat` empty).

## Deviations from Plan

### 1. [Plan-order] The generator cascade ran inside EACH role-edit commit, not in Task 3's

- **What the plan says:** Task 3 — *"Regenerate the three artifact families once in order … and commit them with the two role edits from Tasks 1 and 2."*
- **What happened:** the cascade ran inside `bdb2e6f` (security-nfr) and again inside `1b611d1` (compliance-officer), each carrying its own regenerated adapter and catalog.
- **Why:** the executor contract requires one commit per task, and the plan declares three tasks. Deferring the cascade to Task 3 would have left **two commits with red freshness gates** — `freshness:adapters` and `freshness:catalog` both fire the moment a `## One job` first sentence changes without its generated artifacts. D-47's rule is that the artifacts regenerate *in the same commit as the role edit*; running the cascade per role-edit commit satisfies that **more strictly** than the plan's own task decomposition would have. This is the 29-05 and 29-06 precedent, applied unchanged.

### 2. [Rule 3 — Blocking] Three suite cases went red, exactly as plan 29-05 designed, and were flipped back rather than retyped

- **Found during:** Task 3, the regression lane — 3 of 1,726 cases red.
- **Issue:** 29-05 derived the two voice-guard finding counts from the live corpus and fenced each derivation with a `> 0` non-vacuity floor, recording that *"when the last rewrite plan turns every block green the floor fails, which forces 29-07 to flip the case back deliberately rather than by editing a number."* Both derivations reached 0 in this plan and the floor fired in three places:
  1. the smoke case asserting the tree is RED on exactly the two voice guards;
  2. the `||` conjunction-falsifiability case, whose PREMISE asserts the compared transcripts are genuinely red;
  3. the 27-65 sweep's no-residue case, which asserts the committed tree's verdict.
- **This is the mechanism working, not a regression.** There was no literal to retype — which is precisely why 29-05 derived them.
- **Fix, case by case:**
  - **(1) and (3) flipped to the green form**, keeping the assertion written as the **full FAIL-name list** rather than a bare status, so a future regression is reported by guard name instead of as an anonymous non-zero exit. The derivations are **kept and reversed**: both must now be exactly 0, and both are additionally asserted **strictly below** plan 29-01's RED baselines (17 and 12), so the journey's other end stays referenced rather than deleted.
  - **(2) got a structural fix rather than a relaxation.** Its fixture was `rawMirror()` — a byte-faithful copy of the tree at HEAD — which was red *only because the corpus happened to be red*. With the corpus green that fixture would have degraded into two identical **green** transcripts matching trivially: a proof that passes while proving nothing. The red is now **planted** by a new `allRedMirror()`, which puts a both-arms-failing, zero-clause block on every role and asserts its two-sidedness from the same authorities the guard reads. `rawMirror()` was **deleted**, with the reason recorded in its place — keeping a fixture whose discriminating power depends on the corpus staying broken is the shape this repository has corrected before.
- **Falsifiability of the flip, measured rather than argued.** An assertion that a number is 0 can be vacuous. Two independent proofs:
  - **Two-sided in one run:** the *same* function `voiceRedCountIn()` returns **17** on the planted all-red mirror and **0** on the live tree, in the same suite execution. 29-05's one-sided floor could not give that.
  - **Live mutation:** one copula reintroduced into `security-nfr.md` in the real tree turns **both** flipped cases RED; the file was then restored byte-identical to HEAD.
- **Files modified:** `scripts/check-foundation-guards.test.ts`. **Commit:** `7ec9173`

### 3. [Judgement] `security-nfr.md` was left 101 bytes above its advisory WARN tier

- **What the plan asks:** the file at or under **5102** (FAIL), with the headroom to *both* 4830 and 5102 recorded. It lands at **4931** — 171 under FAIL, 101 over WARN. The acceptance criterion is met; the advisory tier is not.
- **Why the gap was not closed.** The plan names exactly four removals, and all four were taken. Closing 101 more bytes required a **fifth removal the plan does not name**, in the file the plan itself calls the tightest budget in the phase. The only remaining candidates were prose the written partition classifies as **safety-bearing** — the ASVS filter rule, the trigger list, the `## Responsibilities` rationale clauses. Taking bytes from any of them to clear an advisory tier is the exact "never compress a safety rule to make a byte target" prohibition.
- **The 37 bytes that were also refused.** Deleting `## Responsibilities` item 4 whole (rather than dropping its prohibition clause) would have bought 37 more. It was refused because the item's subject is an **act**, and 29-05's written rule says an item whose subject is an act stays. Buying bytes by inverting a rule the register applies uniformly across seventeen files would have made the register's own consistency the price of a WARN badge.
- **What WARN costs.** Nothing mechanical: `guard_role_size` prints `WARN … approaching ceiling` and contributes **zero** to the aggregator's fail count, which is why the aggregator exits 0. It is carried forward as a named residual for plan 29-13's re-baseline, which is the plan that owns ceiling arithmetic.

### 4. [Rule 2 — Scope] C-28-012 and C-28-032 were flipped to `true`, not merely count-corrected

- **What the plan's Task 3 prose says:** flip *"the public grug-brained claim"* and *"correct the three stale counts."* It names one status flip.
- **What was done:** all three rows flipped `overstated → true`.
- **Why.** D-30 states plainly that **both** F-28-204 and F-28-212 *"flip in the same commit as the role edits, per D-04."* Plans 29-05 and 29-06 could not flip them — the claim is *"every role falls back"*, and it was false at 7 of 17 and then 15 of 17. **This plan lands the seventeenth.** Leaving two rows reading `overstated` beside a mechanism field this same commit rewrites to say the fallback holds would have left the registry internally contradictory — the precise defect the count correction exists to fix. The plan's acceptance criteria are silent on their status, and its own must_have is absolute: *"Every registry row flips in the same commit as the text change that justifies it — there is no record-it-later."*

### 5. [Recorded, not fixed] The registry flips are one commit after the text change that justifies them

- **The tension.** The must_have asks for the row flip and the justifying text in the **same commit**. Tasks 1 and 2 committed the text (`bdb2e6f`, `1b611d1`); Task 3 committed the flips (`7ec9173`).
- **Why it was not forced into one commit.** The plan declares three tasks and the executor contract requires one commit per task. Amending `1b611d1` to absorb the registry edits was available and would have collapsed Task 3 to no commit of its own.
- **Why the substance of D-04 is nonetheless satisfied.** The text justifying **C-28-003** is not in any single commit and never could be: the claim is about **all seventeen blocks**, rewritten across 29-05, 29-06 and this plan. D-04's target — the record-it-later failure, where prose ships in one release and the registry catches up in another — does not occur: all three commits are this plan's, pushed together, with no gate green in between that would have been red. Recorded here rather than absorbed, because a must_have written absolutely deserves an explicit account when it is met in substance and not in letter.

### 6. [Measured correction] The acceptance grep for the stale byte figure forced a wording choice

- The criterion is `grep -c '4,036 bytes'` returns **0**. The first draft of the corrected mechanism named the superseded figure for provenance — *"The figure recorded here through Phase 28 was 4,036 bytes; …"* — which returned **1**.
- Respelling the number to slip past the grep was available and refused outright: that is gaming a criterion, not meeting it. The provenance sentence was rewritten to carry the **reason** without the stale number — *"…was produced by a different extractor over 18 files, and no command in this tree reproduces it"* — with an explicit pointer to this file's git history and to this summary. The criterion is met honestly and the provenance survives; the superseded value is recorded in the § *three stale counts* table above.

### 7. [Measured correction] The plan's `## Responsibilities` instruction says "delete the item"; both files kept theirs

Task 1's action reads *"delete the `## Responsibilities` item that restates a prohibition."* Measured, neither file has an item whose **subject** is a boundary — both have an item whose subject is an act carrying a prohibition **clause**. The 29-05 rule, applied unchanged across fifteen prior files, drops the clause and keeps the item. Following the plan's literal wording would have deleted two acts and, in `compliance-officer`, the human-escalation boundary alongside them.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. Neither rewritten role file carries `TODO`, `FIXME`, `placeholder` or `coming soon`, and every deleted sentence's content is either stated elsewhere in the same file or recorded as a deliberate removal in a disposition row.

## Residuals recorded rather than closed

- **`security-nfr.md` is the one role still above its advisory WARN tier**, at 4931 against 4830 (−101), and 171 under its FAIL ceiling. Deviation 3 records why it was not closed. Plan 29-13 owns the re-baseline; the D-26 remedy — raising the table — remains unavailable.
- **`UNKNOWN - verify` — D-19's section-ownership rule is still not mechanically enforced.** Carried from 29-01, 29-05 and 29-06, unchanged. `guard_role_clause_uniqueness` catches a limit *restated*; nothing catches a prohibition stated **once** in the wrong section.
- **`security-nfr.md` `## Reads` bullet 3 breaches WP-03.** *"The implementation and the QE result in the QE/E2E published notes in the shared verified context (pulled per Workflow 16) — the change under review (cite the universal-header `## Scope` / `## Risks`)."* is a descriptive sentence well over the 25-word bound, and it reads awkwardly. It was **observed and left**, deliberately: fixing it is a fifth removal the plan does not name, in a safety-surface file, and doing it under budget pressure would have made a style repair indistinguishable from byte-buying. Recorded for a later plan rather than silently taken.
- **`UNKNOWN - verify` — whether a rewritten role still withholds the same permission is a human judgement.** The register proves every changed clause was dispositioned; it proves nothing about any disposition's substance. This matters more here than in any prior batch: both files are safety documents, and three of this plan's removals are prohibition clauses. The written partitions narrow what a reviewer has to check, but they do not decide it.
- **The two rewritten blocks state attitude about a rule whose clear-voice statement they no longer carry.** *"Fake clean scan summon worst demon of all."* and *"Fake clean audit summon worst demon of all."* are attitude about the never-fake-a-passing-gate boundary. Neither names a requirement, a severity or a result value, and both normalize to clauses appearing nowhere else. Whether attitude about a safety rule belongs in a fenced block at all is a judgement, recorded rather than assumed settled.
- **No gate in this tree detects a non-UTF-8 byte in kit markdown.** 29-05's residual, unchanged. The round-trip check ran manually here and reports 0 failures; nothing in the build would have caught a failure.
- **`orchestrator.md`'s WIP gate subsection still carries a prohibition outside `## Hard limits`.** 29-06's residual, untouched by this plan.
- **C-28-012 and C-28-032 rest on an instruction, not on a behaviour.** Both mechanism fields now say so explicitly: no gate asserts that an agent reading the D-30 sentence actually falls back to the documented defaults at run time.

## Threat Flags

None beyond the plan's own register.

- **T-29-38 (byte-ceiling tampering under the tightest budget) — closed by absence.** `git diff 1364ec8 HEAD -- scripts/check-foundation-guards.ts` is empty; `roleCeiling()` is byte-unchanged. Five measurement points recorded for `security-nfr.md`; the D-37 escalation never arose because the file was never above FAIL.
- **T-29-39 (caveman voice bleeding into safety or compliance text) — mitigated AND measured.** `guard_voice` PASSes on the committed tree, and mutation M4 proves it is not silent: a planted `shiny rock` in `## Responsibilities` reds by file and line. The aggregator was run immediately after each block rewrite, before the rest of that file was touched. Two written three-way partitions make the judgement reviewable.
- **T-29-40 (a claim flipped without the text that justifies it) — mitigated, with Deviation 5 recorded.** All three rows flipped in this plan, alongside the text; the byte-freeze bijection stayed green on a real commit; `check-audit-register` asserts the obligations a flipped row inherits.
- **T-29-41 (correcting a verbatim anchor by mistake) — mitigated.** All four corrections landed in `mechanism` prose. The gate was **run, not assumed**, and its comparison count is recorded unchanged at 42/42 byte-identical.
- **T-29-42 (a number no command reproduces) — mitigated.** The corrected byte figure carries its command in the same field; the command was executed against both HEAD and the base tree, and its base-tree output confirms D-45's independent 3,528 measurement. Each corrected count carries its derivation rule and an explicit do-not-correct-back instruction.
- **T-29-43 (derived safety-surface list disagreeing with its source) — mitigated by absence.** No edited row's `kind` changed; a fresh generation leaves the 41-entry list byte-unchanged and a second run leaves the tree clean.
- **T-29-SC (package installs) — asserted by absence:** `git diff 1364ec8 HEAD -- package.json` is empty. Zero packages installed.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: docs/audit/29-style-dispositions/29-07.md
```

Commits claimed, verified in `git log`:

```
FOUND: bdb2e6f  refactor(29-07): security-nfr.md onto the canonical skeleton, dual voice preserved
FOUND: 1b611d1  refactor(29-07): compliance-officer.md onto the canonical skeleton — 17/17 clean
FOUND: 7ec9173  docs(29-07): flip the three deferred claims and close the role track at 17/17
```

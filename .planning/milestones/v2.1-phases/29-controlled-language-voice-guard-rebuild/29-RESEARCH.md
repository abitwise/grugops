# Phase 29: Controlled Language & Voice Guard Rebuild - Research

**Researched:** 2026-08-13
**Domain:** Controlled natural language (ASD-STE100-derived), markdown corpus rewrite, Node-stdlib guard design
**Confidence:** HIGH on measurement (every number below carries the command that produced it) · MEDIUM on ASD-STE100 IP boundary (official spec forbids text extraction; see §C) · LOW on token-count direction (`UNKNOWN - verify`, see Contradictions)

## Summary

CONTEXT.md locks the design across D-01..D-33. This research does not re-litigate it. It does two
things: it **measures the real tree** so the planner sizes 10–14 plans against actual numbers, and it
**resolves the four Claude's-Discretion items** with evidence rather than proposal.

Every measured claim CONTEXT.md makes about the caveman blocks is **confirmed exactly** — 17 blocks
across 18 role files, zero `grug`, zero `VOICE_MARKERS` matches, 4–15 `^You` lines. The D-22/D-23
fence divergence is **confirmed verbatim in source**. The 43/43 freshness pair count is **confirmed**.

Three findings materially change the phase's shape and are the reason to read this document before
planning:

1. **The byte budget is already spent.** Eight of seventeen roles sit **above their WARN tier today**,
   and `security-nfr.md` has **75 bytes** to its hard FAIL ceiling. D-30 adds one sentence to all 17
   roles; D-19 frees only 27–106 bytes per role. `security-nfr.md` **FAILS its hard ceiling** on
   D-19-delete-plus-D-30-add alone, before the controlled-language rewrite adds a byte. D-26 forbids
   raising the table. This is a sequencing constraint, not a late surprise.
2. **The D-20 uniqueness guard, as literally specified, lands GREEN.** Exact normalized-sentence
   equality finds duplicates in **2 of 17** role files and **zero** in `software-engineer.md` — the
   file CONTEXT.md cites as the worked four-times example. A **clause-level** split finds 9/17 files
   and reproduces the four-times claim exactly. The normalization function choice decides whether this
   guard catches the defect it exists for.
3. **`guard_ste` exists in zero source files.** It appears only in `.planning/` prose. D-11's "rename"
   is three planning-document edits and a naming decision at authoring time — not a code refactor.

**Primary recommendation:** Sequence the phase around the byte budget (remove before add, per role,
tracked), pick the clause-level normalization for D-05/D-20, name the guard
`guard_imperative_lexicon`, and treat the four new guards' RED-before-GREEN evidence as the phase's
hardest deliverable — two of the four are near-vacuous against today's tree and need planted-fixture
discrimination, not just a RED transcript.

## Project Constraints (from CLAUDE.md)

| Directive | Consequence for this phase |
|---|---|
| Markdown kit; TypeScript tooling compiled by `tsc` to **committed `.js`**, freshness-checked | Each new `.ts` adds a `.js` twin. `voice-model.ts` + up to 4 guard files ⇒ pairs go 43 → 45–48. Every plan that edits a `.ts` must commit the rebuilt `.js`. |
| **Zero runtime npm dependencies** on host machines; Node stdlib only in guards | No prose linter, no NLP library, no tokenizer. The lexicon, the normalizer and the sentence splitter are all hand-written `node:fs` + regex. Confirmed by prior research (`STACK.md:155`). |
| **No fabrication** — `UNKNOWN - verify`, never a faked gate/test/citation | Directly governs the token-count claim (see Contradictions) and every PASS line the four new guards print (AP-1). |
| **Voice discipline** — caveman in role prompts; **clear voice** in security, compliance, money, disclaimers | The profile document's disclaimer section and all four guards' output are clear-voice surfaces. `agent-factory/roles/security-nfr.md` and `compliance-officer.md` carry both a caveman fence and clear-voice safety text in one file. |
| **Single-source** role text; adapters are thin pointers | `## One job` feeds three generators (see Runtime State Inventory). |
| **Brand** — lowercase `grugops`, grugbrain.dev attribution stays visible | If the caveman lexicon adopts grugbrain.dev coinages, `NOTICE:4-7` and `README.md:57-59` attribution must stay. Both verified present. |
| **Minimal AGENTS.md** — Codex 32 KiB `project_doc_max_bytes` | The only external cap in the kit. D-28 correctly declines to invent ceilings for workflows/checklists. |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Thirty-three decisions, D-01 through D-33, are locked in
`.planning/phases/29-controlled-language-voice-guard-rebuild/29-CONTEXT.md` and are **not restated
here**. The planner must read that file in full. This research is scoped to measuring against them,
never to re-opening them.

Load-bearing summary of what is locked, for orientation only:

- **Safety surface (D-01..D-05):** frozen set **derived** from three existing gates (38 claim-registry
  anchors; structural sections by heading; positive guard literals). Safety sections are **not exempt**
  from the profile — they receive it deliberately, one file at a time. Enforcement **inverts**: the
  gate enumerates what *changed* from the diff and requires each change dispositioned. A hand-written
  protected-sentence list is refused (set-literal drift). A "permission-bearing sentence" heuristic is
  explicitly rejected (D-03).
- **Voice guard (D-06..D-10):** the `^You` arm is **deleted, not supplemented**. Rebuilt guard is
  **two-sided, both sides must hold** — ≥N committed-lexicon tokens AND zero banned constructions. The
  PASS line carries the **measurement**, not an assertion. Caveman block carries **identity and
  attitude only**, never a fact stated nowhere else. A tokens-per-content-word ratio is rejected.
- **Controlled language (D-11..D-18):** guard **renamed off `guard_ste`**; lexicon means a **closed
  approved-VERB list at imperative position only**; the project Technical Names/Verbs set is
  **derived**, not listed; banned constructions ship as modals-of-obligation, bare demonstrative
  subject, `and/or`, one-instruction-per-sentence, 20-word procedural limit; **passive voice is
  deliberately NOT banned** (D-15); the guard is a **build-time gate over kit files** with runtime
  surfaces carrying the profile as instruction (D-16); **full corpus this phase** (D-18).
- **Role skeleton (D-19..D-21):** section ownership fixed (`## One job` = what; caveman = identity;
  `## Responsibilities` = how; `## Hard limits` = the **only** place a prohibition appears).
  De-duplication is **enforced by a guard**, not a one-time pass. Uniqueness is **intra-file only**.
- **One fence authority (D-22..D-24):** new `scripts/voice-model.ts` is the single authority, returning
  **both sides plus a verdict** — `{ok:true, inside, outside}` or `{ok:false, reason:
  "missing"|"unterminated"|"multiple"}`. It **composes** `frontmatter.ts`'s `stripFencedBlocks`.
- **Byte ceilings (D-25..D-28):** `roleCeiling()` stays a hand-maintained switch table. Re-baseline
  happens **once, in a dedicated final plan**; mid-phase a RED ceiling means **trim or split, never
  edit the table**. Proof is a one-shot before/after transcript. **No ceilings added** for workflows or
  checklists — measure and record the growth instead.
- **Claims (D-29..D-33):** banned-claim check on the `dead-vocabulary.ts` pattern; F-28-204 and
  F-28-212 **fixed here, not deferred**; F-28-202/C-28-003 flips `overstated → true`; three stale
  counts corrected; the profile's own claims **registered**.
- **AP-1 (blocking):** one shared element-level vacuity mechanism, not four one-off `=== 0` checks;
  every PASS line carries its measured numbers; every guard **watched failing RED against the real
  tree** before the rewrite lands.

### Claude's Discretion

Verbatim from CONTEXT.md:

- The exact caveman lexicon membership and the value of N in D-07, subject to it failing RED on all
  17 current blocks (LANG-06) — that RED transcript is the acceptance evidence, not a design choice.
- The approved-verb list contents in D-12, and the normalization function used for sentence
  identity in D-05 and D-20.
- The final guard name in D-11 among the candidates given.
- Whether `voice-model.ts` splits into two modules if it grows past the repo's module-size norms.
- Plan decomposition and wave ordering, subject to the Sizing note below.

**All four are resolved with evidence in §B below. The planner decides; this research supplies the
measurement each decision needs.**

### Deferred Ideas (OUT OF SCOPE)

Verbatim from CONTEXT.md:

- **Passive-voice enforcement** — deliberately excluded (D-15) with its reason recorded, so a later
  phase does not add it as an obvious omission. Revisit only with evidence that the kit's own
  correct prose can survive it.
- **A full approved-word dictionary** beyond imperative-position verbs (D-12) — revisit if the
  verb-only lexicon proves insufficient for determinism in practice.
- **Byte ceilings for workflows and checklists** (D-28) — this phase measures and records the
  growth; a later phase decides on that evidence.
- **A runtime profile check inside `context-io.ts`** (D-17) — genuinely covers the three runtime
  surfaces, but belongs nowhere near the verify-before-write seam without its own phase.
- **Retiring `validate-agent-factory.ts`** — carried forward from Phase 27 (27-44's recommendation,
  still owned by nobody). Not a language concern; noted so it is not lost again.

Also out of scope per CONTEXT.md `<domain>`: the autonomy matrix (Phase 30), the board projector, any
change to the shared-context substrate, the queue, or the §14 gate. No new runtime dependency. No
claim of ASD-STE100 conformance, no token-economy claim, no LLM-comprehension claim.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LANG-01 | grugops-authored ASD-STE100-**derived** writing profile — enumerated rules plus a project Technical Names/Verbs set — with non-affiliation and not-certified disclaimer, vendoring no part of the ASD dictionary | §C establishes the IP line with citations, supplies a verified disclaimer wording pattern, and confirms STE's own specification **sanctions** company-defined Technical Names/Verbs — so D-13's derived set is the standard's documented extension point, not a deviation. §A-4 supplies the measured verb distribution the rules must be authored against. |
| LANG-02 | Profile applied to procedural/agent-written surfaces, explicitly **not** to the fenced caveman blocks | §A-2 sizes the true corpus (19 workflows + 13 hand-authored checklists + 13 seed templates + 2 contracts = 47 files, 421 procedural bullets). §A-2 also identifies **one generated 89,840-byte checklist that must be excluded by a derived rule**, and six kit files carrying retired v1.x vocabulary that Phase 28 did not audit. |
| LANG-03 | Named safety-surface exclusion list honoured so load-bearing text is never reworded by a style pass | §A-8 confirms all three D-01(b) structural-section derivations resolve at full cardinality (`## Hard limits` 17/17, `## Stop conditions` 19/19, `## Commit` 19/19). The 41-entry list and its own per-file granularity statement are confirmed present. |
| LANG-04 | Guard enforces exactly the decidable subset and is named for it — never presented as enforcing ASD-STE100 conformance | §B-4 recommends `guard_imperative_lexicon` against LANG-04's own test and supplies the **complete grep-derived** rename call-site list (3 planning files; **zero source files**). §C-3 confirms ASD/STEMG's own published position that no tool may claim approval. |
| LANG-05 | Role skeleton de-duplicated — `## One job`, caveman block, `## Responsibilities` stop being three passes | §B-3 measures the duplication three ways and shows only the clause-level variant reproduces CONTEXT.md's measured four-times claim. §A-9 measures the D-19 prohibition-placement violation at 15/17 files in `## Responsibilities` and 12/17 in `## One job`. |
| LANG-06 | Voice guard rebuilt to measure voice against a committed lexicon, **fails RED on all 17 current blocks** before the rewrite lands | §B-1 supplies a concrete lexicon and N, **tested**: RED on 17/17. It also warns that **both arms fail 17/17 independently**, so the RED transcript alone does not prove the conjunction is wired — a discriminating fixture is required. |
| LANG-07 | `guard_ste` and the rebuilt voice guard share **one** fence parser | §A-6 confirms the live divergence verbatim in source, quotes both functions, and identifies a **third** divergence (`multiple`) beyond the one CONTEXT.md describes. |
| LANG-08 | Byte ceilings re-baselined **once** at end of phase, every file ≤ previous, delta recorded, never raised mid-phase | §A-1 supplies the per-role current/WARN/FAIL/headroom table and §A-1b the D-19-vs-D-30 budget showing **`security-nfr.md` FAILS** and 8 more land in WARN before the rewrite adds a byte. |
</phase_requirements>

---

# §A — Measurement of the real tree

Every number in this section carries the command that produced it. Nothing is hand-tallied. Helper
scripts were written to a scratchpad outside the repo; the repository was not modified.

## A-1. Role corpus, byte ceilings, headroom

```bash
for f in agent-factory/roles/*.md; do printf "%s\t%s\n" "$(wc -c < "$f"|tr -d ' ')" "$(basename $f)"; done | sort -rn
for f in agent-factory/roles/*.md; do grep -q "^## Caveman prompt" "$f" || echo "NO-BLOCK: $f"; done
```

- **18** role `.md` files. **17** carry `## Caveman prompt`. The one that does not is
  `_role-switch-protocol.md` — `_`-prefixed, therefore dropped by `kit-model.listRoles()` derivation.
  **[VERIFIED: command output above]** CONTEXT.md's claim is exact.
- Total role corpus **69,721 B** across 18 files; **66,216 B** across the 17 in-set roles.

Ceiling values read from `scripts/check-foundation-guards.ts:2080-2119` (`roleCeiling()`), current
bytes from `fs.statSync`. **[VERIFIED: scripts/check-foundation-guards.ts:2080-2119]** — the switch
table's 17 cases are quoted verbatim in the source; values below are transcribed from it.

| role | bytes | WARN | FAIL | headroom to WARN | headroom to FAIL | status today |
|---|---:|---:|---:|---:|---:|---|
| `orchestrator.md` | 7090 | 7165 | 7570 | 75 | 480 | pass |
| `security-nfr.md` | 5027 | 4830 | 5102 | **-197** | **75** | **WARN** |
| `compliance-officer.md` | 4433 | 4555 | 4813 | 122 | 380 | pass |
| `release-manager.md` | 4230 | 4510 | 4765 | 280 | 535 | pass |
| `agents-md-scribe.md` | 4094 | 4301 | 4544 | 207 | 450 | pass |
| `architect-design.md` | 3790 | 4016 | 4243 | 226 | 453 | pass |
| `ba-pm.md` | 3672 | 3901 | 4180 | 229 | 508 | pass |
| `frontend-ui.md` | 3872 | 3757 | 3969 | **-115** | 97 | **WARN** |
| `software-engineer.md` | 3722 | 3697 | 3906 | **-25** | 184 | **WARN** |
| `qe-e2e.md` | 3695 | 3617 | 3822 | **-78** | 127 | **WARN** |
| `installer.md` | 3546 | 3727 | 3938 | 181 | 392 | pass |
| `incident-responder.md` | 3540 | 3598 | 3802 | 58 | 262 | pass |
| `factory-coach.md` | 3464 | 3633 | 3839 | 169 | 375 | pass |
| `uat-planner.md` | 3367 | 3350 | 3540 | **-17** | 173 | **WARN** |
| `system-analyst.md` | 3020 | 3000 | 3170 | **-20** | 150 | **WARN** |
| `greenfield-mapper.md` | 2916 | 2882 | 3045 | **-34** | 129 | **WARN** |
| `brownfield-mapper.md` | 2738 | 2693 | 2845 | **-45** | 107 | **WARN** |

**Eight of seventeen roles are already above their WARN tier.** The gate exits 0 because `warn()`
deliberately does not increment `FAILS` (`scripts/check-foundation-guards.ts:321` — *"warn() is
advisory only — it does NOT increment FAILS"*). **[VERIFIED: scripts/check-foundation-guards.ts:321]**

## A-1b. The D-19 / D-30 byte budget — a hard collision

D-19 deletes `## One job`'s trailing sentence. D-30 adds one when-absent-fallback sentence to every
role's `## Reads`. Measured, assuming a 110-byte added sentence and a byte-neutral rewrite:

| role | bytes | FAIL | trailing sentence freed by D-19 | after D-19 delete | + D-30 (~110 B) | verdict |
|---|---:|---:|---:|---:|---:|---|
| `orchestrator.md` | 7090 | 7570 | 39 | 7051 | 7161 | pass |
| **`security-nfr.md`** | 5027 | 5102 | 35 | 4992 | **5102** | **FAIL** |
| `compliance-officer.md` | 4433 | 4813 | 28 | 4405 | 4515 | pass |
| `release-manager.md` | 4230 | 4765 | 27 | 4203 | 4313 | pass |
| `agents-md-scribe.md` | 4094 | 4544 | 106 | 3988 | 4098 | pass |
| `architect-design.md` | 3790 | 4243 | 50 | 3740 | 3850 | pass |
| `ba-pm.md` | 3672 | 4180 | 41 | 3631 | 3741 | pass |
| `frontend-ui.md` | 3872 | 3969 | 98 | 3774 | 3884 | WARN |
| `incident-responder.md` | 3540 | 3802 | **0** | 3540 | 3650 | WARN |
| `installer.md` | 3546 | 3938 | 61 | 3485 | 3595 | pass |
| `software-engineer.md` | 3722 | 3906 | 57 | 3665 | 3775 | WARN |
| `qe-e2e.md` | 3695 | 3822 | 47 | 3648 | 3758 | WARN |
| `uat-planner.md` | 3367 | 3540 | 38 | 3329 | 3439 | WARN |
| `system-analyst.md` | 3020 | 3170 | 53 | 2967 | 3077 | WARN |
| `greenfield-mapper.md` | 2916 | 3045 | 22 | 2894 | 3004 | WARN |
| `brownfield-mapper.md` | 2738 | 2845 | 54 | 2684 | 2794 | WARN |
| `factory-coach.md` | 3464 | 3839 | 33 | 3431 | 3541 | pass |

**Consequences the planner must design around:**

1. `security-nfr.md` **breaks its hard FAIL ceiling** on D-19 + D-30 alone. D-26 forbids raising the
   table. The only routes are: take more bytes out (D-09's caveman-block content removal, D-19's
   `## Responsibilities` #4 removal), or split the file.
2. `incident-responder.md` frees **zero** bytes from D-19 — its `## One job` is a single sentence
   (measured; 16 of 17 roles have exactly two sentences there). It is the one role where D-19's
   delete does not apply.
3. **The budget above assumes the rewrite is byte-neutral. It is not.** 15 of 17 `## One job` first
   sentences already exceed the 20-word procedural limit (measured: 19–31 words, median 24). Splitting
   a 27-word sentence into two conforming sentences adds a subject and a verb. Growth is the expected
   direction on the roles.
4. **Remove before add, per role, tracked per plan.** A plan that lands D-30's sentence before D-09's
   content removal turns `security-nfr.md` red with no legal remedy.

## A-2. The governed corpus (D-18 scope)

```bash
ls agent-factory/workflows/*.md | wc -l           # 19
ls agent-factory/checklists/*.md | wc -l          # 14
find agent-factory/seed agent-factory/contracts -type f
cat agent-factory/workflows/*.md | wc -c          # 104094
cat agent-factory/checklists/*.md | wc -c         # 109208
ls agent-factory/checklists/*.md | grep -v security-nfr | xargs cat | wc -c   # 19368
```

| group | files | bytes | note |
|---|---:|---:|---|
| `agent-factory/workflows/` | 19 | 104,094 | largest: `05-pr-quality-gate.md` 13,831 B |
| `agent-factory/checklists/` (hand-authored) | 13 | 19,368 | largest: `playwright-visual-regression-recipe.md` 4,687 B |
| `agent-factory/checklists/security-nfr-checklist.md` | 1 | **89,840** | **GENERATED — see below** |
| `agent-factory/seed/**/*.md` (templates: board, traceability, metrics, memory-bank, ADR) | 13 | 14,205 | the D-16 shipped templates |
| `agent-factory/contracts/` (`context-note.md`, `task-notes.template.md`) | 2 | 15,185 | the note-kind contract |
| `agent-factory/packaging/` | 3 | 30,076 | `adapters.md`, `subagent.frontmatter.md`, `slash-command.template.md` |
| `agent-factory/config/factory.config.md` | 1 | 18,020 | the dial documentation |

**BLOCKING: `security-nfr-checklist.md` must be excluded by a derived rule, not by a hand-listed
name.** Its header reads:

```
<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-asvs-checklist.js
     Source: OWASP ASVS 5.0.0 · OWASP/ASVS @ v5.0.0_release
     Commit: 5cf9b032440be53ce345ab3c130fda46ba1ce7a2 -->
```

and its body states *"every row's text is copied verbatim from the standard."*
**[VERIFIED: agent-factory/checklists/security-nfr-checklist.md:1-14]** Style-rewriting it would (a)
be reverted on the next `generate:asvs` run, (b) falsify its own verbatim-copy claim, and (c) touch
345 rows of a third-party standard. It is also **82% of the checklists directory by bytes** and
**345 of the 766 total bullets in `agent-factory/`**, so including it would triple the apparent
corpus size and produce a meaningless denominator.

```bash
grep -rln "GENERATED" agent-factory/     # → exactly one file
```

**Recommendation:** derive the exclusion from the `GENERATED` marker (currently a one-member set, but
derived rather than named, per the milestone's founding rule). Assert its cardinality two-sided so a
second generated kit file cannot arrive silently unexcluded.

**Also blocking, and not in CONTEXT.md:** six kit files still carry retired v1.x handoff vocabulary.
Phase 28 audited roles and workflows only, and both are clean; these six are outside that audit.

```bash
grep -rn "handoff" agent-factory/ --include=*.md | grep -v "^agent-factory/roles/\|^agent-factory/workflows/"
```

| file:line | text | why it matters |
|---|---|---|
| `agent-factory/checklists/definition-of-done.md:16` | `- handoff written` | a **DoD checklist item** requiring an artifact deleted in Phase 24 |
| `agent-factory/seed/plans/board.md:64` | `\| Ready for Dev \| handoffs complete, ticket sized \|` | a **board column entry criterion** on a shipped template |
| `agent-factory/checklists/example-mapping.md:10` | `block in the product and QE handoffs.` | |
| `agent-factory/_commit-convention.md:9` | `tickets, board, traceability, metrics, and handoffs` | |
| `agent-factory/README.md:111` | `handoffs, epics, first tickets, and seed the board.` | |
| `agent-factory/packaging/subagent.frontmatter.md:204` | historical narration — **correct, leave alone** | |

These survive because `dead-vocabulary.ts`'s `RETIRED_PATH_FORMS` is the **path** `agent-factory/handoffs/`, and
`check-kit-refs`'s `SCAN` deliberately excludes `agent-factory/seed/` (`scripts/check-kit-refs.ts:57-58`:
*"D-03 exclusion: agent-factory/seed/ is INTENTIONALLY NOT listed — its bundled files are STATE
TEMPLATES"*). **[VERIFIED: scripts/check-kit-refs.ts:54-68]** The controlled-language rewrite is the
natural place to fix the first two; the sixth must be left alone (it is accurate history).

## A-3. Procedural steps and bullets

```bash
node scratchpad/verbs.mjs    # ordered-list + bullet extraction, code fences stripped
```

| group | files | steps/bullets |
|---|---:|---:|
| workflows | 19 | 280 |
| checklists (hand-authored) | 13 | 106 |
| seed templates | 13 | 13 |
| contracts | 2 | 22 |
| **governed total** | **47** | **421** |
| *(roles, for reference — not this guard's surface)* | 18 | 165 |
| *(security-nfr-checklist, excluded)* | 1 | 345 |

**Per-section breakdown** (the surface D-12's imperative-position check actually runs over):

| section | bullets | ordered | files | head is determiner/pronoun | head is other |
|---|---:|---:|---:|---:|---:|
| `## Steps` | **125** | 100 | 19 | 17 | 108 |
| *(preamble / prose bullets)* | 84 | 0 | 10 | 0 | 84 |
| `## Inputs required` | 67 | 0 | 19 | 37 | 30 |
| `## Agents involved` | 46 | 0 | 19 | 6 | 40 |
| `## Stop conditions` | 38 | 0 | 19 | 35 | 3 |
| *(11 minor sections)* | 61 | 0 | — | 5 | 56 |

**Finding: D-12's check must be section-scoped, not bullet-scoped.** `## Inputs required` bullets are
noun phrases by design (*"A ticket with acceptance criteria, size, and priority."*) and
`## Stop conditions` bullets are conditionals (*"The ticket fails the Definition of Ready -> stop…"*).
An imperative-verb rule applied to those two sections would fail 72 correct bullets and the only route
back to green would be to weaken the rule — the exact heuristic-strict-subset shape D-03 and D-15 both
refuse. `## Steps` (125 bullets, 19 files, 100 of them ordered) is the honest surface.

## A-4. The imperative-position first-word distribution (the D-12 raw material)

Governed corpus, all 421 bullets:

- **222 distinct first words**
- **176 hapax** (occurring exactly once) — **41.8% of all bullets**
- top-10 words cover 38.2%; top-20 cover 45.8%; top-50 cover 59.1%

Head of the distribution — note that **none of the top nine are verbs**:

| rank | count | cum% | word |
|---:|---:|---:|---|
| 1 | 69 | 16.4% | `The` |
| 2 | 25 | 22.3% | `A` |
| 3 | 16 | 26.1% | `BA` |
| 4 | 10 | 28.5% | `agent-factory` |
| 5 | 10 | 30.9% | `grugops` |
| 6 | 8 | 32.8% | `QE` |
| 7 | 7 | 34.4% | `Security` |
| 8 | 6 | 35.9% | `Architect` |
| 9 | 5 | 37.1% | `An` |
| 10 | **5** | 38.2% | **`Read`** ← first verb |

Restricted to the 125 `## Steps` bullets: **84 distinct first words**, of which the most frequent is
still `The` (12). Only `Read` (5) and `Record` (3) exceed two occurrences. **Fifty-nine of the 84
occur exactly once.**

**This distribution has no head to adopt.** D-12's framing — "adopt the head of a measured
distribution and justify the tail" — is not available, because four different step grammars coexist:

```bash
node scratchpad/grammar.mjs
```

| grammar | count | % | example |
|---|---:|---:|---|
| **bold label** | 41 | 32.8% | `**Deterministic prefetch.** Before the model writes code, the Orchestrator gathers…` |
| **bare imperative** | ≤51 | ≤40.8% | `Run the quality gate per agent-factory/workflows/05-pr-quality-gate.md.` |
| **actor subject** | 15 | 12.0% | `BA/PM defines the product — recording the product decisions…` |
| **determiner subject** | 15 | 12.0% | `The Orchestrator pulls the ticket into development, respecting WIP limits.` |
| other | 3 | 2.4% | `` `aggressive` (lean default): only the compact gist reaches… `` |

*(The 51 "bare imperative" figure is an **upper bound** — the classifier's fallback bucket also caught
`With the risks understood, BA/PM cuts…`, `When the behavior is unclear…` and `Tickets are written
to…`, which are not imperatives. True imperative count is lower. `[ASSUMED]` — an exact count needs a
verb list, which is what D-12 is authoring.)*

**The implication for D-12 is structural, and it is the D-64 move:** rather than derive an approved
verb list from a distribution that has none, **declare the canonical step form and refuse everything
outside it**. That converts the problem from "enumerate 84 words and justify a cutoff" into "one legal
shape, measured conformance". §B-2 develops this.

## A-5. The 17 caveman blocks — CONTEXT.md's claims, verified

```bash
node scratchpad/measure-caveman.mjs .   # mirrors extractCavemanBlock() exactly
```

| role | block bytes | non-blank lines | `^You` lines | words | any `VOICE_MARKERS` hit |
|---|---:|---:|---:|---:|---|
| `orchestrator.md` | 473 | 15 | 15 | 86 | false |
| `agents-md-scribe.md` | 267 | 7 | 7 | 45 | false |
| `frontend-ui.md` | 238 | 6 | 6 | 40 | false |
| `installer.md` | 236 | 5 | 5 | 40 | false |
| `compliance-officer.md` | 234 | 5 | 5 | 41 | false |
| `release-manager.md` | 217 | 5 | 5 | 37 | false |
| `software-engineer.md` | 211 | 5 | 5 | 37 | false |
| `factory-coach.md` | 185 | 5 | 5 | 31 | false |
| `ba-pm.md` | 184 | 5 | 4 | 32 | false |
| `incident-responder.md` | 181 | 5 | 5 | 28 | false |
| `greenfield-mapper.md` | 176 | 5 | 5 | 30 | false |
| `architect-design.md` | 171 | 4 | 4 | 27 | false |
| `brownfield-mapper.md` | 166 | 4 | 4 | 27 | false |
| `qe-e2e.md` | 165 | 5 | 5 | 29 | false |
| `system-analyst.md` | 155 | 4 | 4 | 26 | false |
| `security-nfr.md` | 146 | 4 | 4 | 21 | false |
| `uat-planner.md` | 123 | 4 | 4 | 20 | false |
| **total (17)** | **3,528** | **93** | **92** | **597** | **0 / 17** |

Per-marker occurrence totals across all 17 blocks: `grug` **0**, `club` **0**, `rock` **0**, `cave`
**0**, `smash` **0**, `shiny` **0**, `brain hurt` **0**, `me think` **0**, `no think` **0**,
`big think` **0**.

**Every CONTEXT.md claim is confirmed exactly.** 17 blocks; zero `grug`; zero `VOICE_MARKERS` matches;
`^You` range 4–15. `guard_caveman_preserved` is therefore passing **entirely on the `^You` arm in all
17 cases**, with the idiom arm dead — as D-06 states.

**One correction the planner should carry, beyond D-32's.** D-32 corrects the *counts* in C-28-003,
C-28-012 and C-28-032 from 18 to 17. C-28-003's mechanism field also carries a **byte figure**:
*"the 18 fenced caveman blocks … total 4,036 bytes"* **[VERIFIED: docs/audit/28-claim-registry.md:94]**.
The block-interior total measured here is **3,528 B**. The 4,036 figure was evidently measured with a
different extractor (it is consistent with including the heading and both fence lines: 3,528 + 17 × 27
≈ 3,987). D-32 does not mention the byte figure. **Correct it in the same pass or the row keeps a
number no command reproduces.** These are mechanism fields, not verbatim anchors, so correcting them
does not trip `check-claim-anchors` — D-32's reasoning holds for the byte figure too.

## A-6. The D-22/D-23 fence divergence — confirmed, and worse than described

Both functions read, this session, from `scripts/check-foundation-guards.ts`.

**`stripCavemanBlock`** — `scripts/check-foundation-guards.ts:1910-1939`, verbatim tail:

```ts
  // END: an unterminated block (skip still set at EOF) emits the sentinel so the malformed-fence
  // case fails RED instead of silently dropping the whole file tail.
  if (skip) out.push("__UNCLOSED_CAVEMAN_FENCE__");
  return out.join("\n");
```

**`extractCavemanBlock`** — `scripts/check-foundation-guards.ts:2009-2032`, verbatim:

```ts
function extractCavemanBlock(text: string): string {
  const out: string[] = [];
  let seen = false;
  let fence = 0;
  let infence = false;
  for (const line of text.split("\n")) {
    if (/^## Caveman prompt/.test(line)) {
      seen = true;
      continue; // `next`
    }
    if (seen && /^```/.test(line)) {
      fence++;
      if (fence === 1) {
        infence = true;
        continue; // `next`
      }
      if (fence === 2) {
        break; // `exit`
      }
    }
    if (infence) out.push(line);
  }
  return out.join("\n");
}
```

**Confirmed exactly as D-23 describes.** There is no sentinel and no EOF check. On an unterminated
fence, `infence` stays `true`, the loop ends, and the function returns **the entire file tail as the
caveman block**. `guard_voice` then fails RED naming the file
(`check-foundation-guards.ts:1973-1976`) while `guard_caveman_preserved` passes over a block that is
actually the rest of the document — and passes easily, because the file tail contains many `^You`
lines. Same bytes, two grammars, opposite verdicts.

**A third divergence, beyond the two CONTEXT.md names.** D-23 names `missing`, `unterminated` and
`multiple`. All three are real, and `multiple` is asymmetric in the *opposite* direction to
`unterminated`:

| malformed input | `stripCavemanBlock` (guard_voice) | `extractCavemanBlock` (guard_caveman_preserved) |
|---|---|---|
| **unterminated fence** | emits sentinel → **FAIL RED, names file** | returns whole file tail → **PASSES** |
| **second `## Caveman prompt` heading** | `skip = true` again → **strips both blocks** | `break` already fired at `fence === 2` → **second block never read, silently ignored** |
| **heading present, no fence at all** | `skip` never cleared → sentinel → **FAIL RED** | `infence` never set → returns `""` → **"block missing or empty" FAIL** (agree, by accident) |

So the two readers disagree on **two of three** malformed forms and agree on the third only
incidentally. D-23's canonical-form verdict closes all three with one refusal. `multiple` is
load-bearing exactly as D-23 states.

## A-7. Freshness pairs, npm scripts, CI wiring

```bash
node -e "…git ls-files … count .ts with a committed .js twin…"
```

- **43 `.ts` / `.js` pairs**, distributed `scripts/` 36, `install/` 3, `hooks/` 2,
  `scripts/runnable-ref/` 2. **[VERIFIED: `git ls-files` derivation]** CONTEXT.md's 43/43 is confirmed.
- 44 tracked non-test `.ts`; the one without a twin is `vitest.config.ts` (dev-only, correctly
  excluded).

**Per-new-guard wiring cost.** The house pattern is *wired at both ends, deliberately* — the CI file
says so at four separate gates (`.github/workflows/ci.yml:94-99`, `121-125`, `150-152`, `186-188`):
*"A gate that runs only because some other step happens to run it is not wired; it is borrowed."*
**[VERIFIED: .github/workflows/ci.yml:94-99]**

Each new standalone gate costs:

1. `scripts/<name>.ts` + committed `scripts/<name>.js` (freshness pair)
2. `scripts/<name>.test.ts` that spawns the gate (end 1)
3. one `package.json` script: `"check:<name>": "tsc --outDir .tmp-build && node scripts/<name>.js"`
4. one line in the ubuntu-only CI block (end 2)
5. an `isEntry` guard using `pathToFileURL` — the Windows-correctness idiom, quoted at
   `scripts/check-public-docs-vocabulary.ts:425-431`: *"a hand-built `file://${argv[1]}` URL does NOT
   match on Windows, which would make a direct … run ZERO checks and exit 0, a fabricated green."*

Note: `check-foundation-guards.js` is invoked **bare** in CI (`ci.yml:93`) and has **no** `package.json`
script. A guard added inside it inherits that wiring for free.

Current aggregator state:

```bash
time node scripts/check-foundation-guards.js   # real 0m0.127s, exit 0
grep -o "^\[guard_[a-z0-9_]*\]" … | sort -u    # 11 guards
```

11 guards, 55 PASS/FAIL/WARN lines, **0.127 s**, exit 0. Performance is not a constraint for four more.

## A-8. Structural-section derivations (D-01(b)) — all resolve at full cardinality

```bash
grep -l "^## Hard limits" agent-factory/roles/*.md | wc -l        # 17
grep -l "^## Stop conditions" agent-factory/workflows/*.md | wc -l # 19
grep -l "^## Commit" agent-factory/workflows/*.md | wc -l          # 19
grep -l "^## Reads" agent-factory/roles/*.md | wc -l               # 17
```

All four derivations D-01(b) and D-30 depend on resolve at full cardinality with no gaps. The
`docs/audit/28-safety-surface-exclusions.md` list is present, marked `GENERATED`, declares **41
entries**, and carries its own per-file-granularity statement verbatim — confirming the collision
D-01..D-05 resolve is stated in the artifact, not invented.

## A-9. D-19's section-ownership rule, measured against today's tree

```bash
node scratchpad/normalize2.mjs   # prohibition-token lines per section, 17 roles
```

`## Hard limits` is supposed to be the **only** place a prohibition appears (D-19). Measured:

| section | files with ≥1 prohibition-bearing line | total such lines |
|---|---:|---:|
| `## Responsibilities` | **15 / 17** | 22 |
| `## Hard limits` | 17 / 17 | 20 |
| `## Caveman prompt` | **13 / 17** | 17 |
| `## One job` | **12 / 17** | 12 |
| `## Output (file + format)` | 6 / 17 | 7 |

*(Token set: `never`, `must not`, `do not`, `don't`, `stop`, `refuse`, `no big`, `without` —
deliberately broad, so treat the absolute counts as an upper bound. The **shape** is unambiguous:
prohibitions are today spread across four sections in a majority of role files.)*

This is the strongest available evidence that a D-19 conformance guard would land genuinely RED. It is
also a **caution**: this predicate is a token list of exactly the shape **D-03 rejected** for the
safety-surface problem. It is a different predicate for a different purpose (section ownership, not
the frozen set), but the planner should say so explicitly in the plan so a later reader does not read
it as D-03 re-proposed.

## A-10. D-14's shipped rules, measured against the corpus

```bash
node scratchpad/grammar.mjs   # sentence-length + banned-construction probe, 32 governed files
```

**Sentence length (D-14 ships 20 words for procedural sentences):** 982 sentences measured.

| threshold | over | % |
|---|---:|---:|
| > 20 words | **273** | **27.8%** |
| > 25 words | 190 | 19.3% |
| > 30 words | 120 | 12.2% |

median 14 · p90 **32** · max **65**.

The 20-word figure is not arbitrary: it is **STE's own published rule**. *"STE keeps sentences short,
with a recommended maximum of 20 words in procedural sentences and 25 in descriptive sentences."*
[CITED: instrktiv.com/en/simplified-technical-english/]. D-14 adopting 20 for procedural is therefore
faithfully derived. **The planner should consider adopting 25 for descriptive sentences as well** —
D-14 currently ships only the procedural number, and 27.8% of the corpus breaching a single
undifferentiated limit is a large rewrite whose size is partly an artifact of not distinguishing the
two sentence kinds.

**Banned constructions (D-14's modal ban) — nearly free, and that is a problem:**

| pattern | occurrences | files (of 32) |
|---|---:|---:|
| `should` | 1 | 1 |
| `may` | 5 | 4 |
| `might` | 0 | 0 |
| `could` | 1 | 1 |
| `and/or` | **0** | **0** |

**Seven occurrences total across the entire governed corpus.** A guard shipping only D-14's modal and
`and/or` rules would land essentially GREEN — it has never been watched fail. Under Phase 28's D-24
and AP-1 this is a defect, not a convenience. See §D.

---

# §B — The four discretion items, resolved with evidence

## B-1. Caveman lexicon and N (D-07)

### Proposal

```ts
// scripts/voice-model.ts — POSITIVE arm
export const CAVEMAN_LEXICON: readonly string[] = [
  // the 10 existing VOICE_MARKERS terms — retained so guard_voice and the rebuilt
  // voice guard read ONE list, never two (LANG-07's spirit applied to the lexicon)
  "grug", "club", "rock", "cave", "smash", "shiny",
  "brain hurt", "me think", "no think", "big think",
  // grugbrain.dev coinages — NOTICE:4-7 and README.md:57-59 attribution stays visible
  "big brain", "spirit", "demon", "swamp", "shiny rock", "sharp stick",
];
export const CAVEMAN_LEXICON_MIN = 2;   // N
```

**N = 2, not 1.** One token per block is exactly the sprinkle-to-green defect D-07 names one level up.
Two forces a token in the opener *and* in the body.

### Negative arm

```ts
export const BANNED_CONSTRUCTIONS = {
  article:      /\b(the|a|an)\b/gi,
  copula:       /\b(is|are|was|were|be|been|being|am)\b/gi,
  modal:        /\b(should|may|might|could|would|must|shall|can)\b/gi,
  subordinator: /\b(which|that|because|although|while|whereas|unless|whether)\b/gi,
};
```

All four are closed token sets over word boundaries. Decidable, no tuning, no threshold.

### Tested against LANG-06

```bash
node scratchpad/lexicon.mjs
```

| role | lexicon tokens | content words | banned (art/cop/mod/sub) | verdict @ N=2 |
|---|---:|---:|---|---|
| `agents-md-scribe.md` | 0 | 45 | 2/1/0/0 | **RED** |
| `architect-design.md` | 0 | 27 | 0/1/0/0 | **RED** |
| `ba-pm.md` | 0 | 32 | 0/2/0/0 | **RED** |
| `brownfield-mapper.md` | 0 | 27 | 1/1/0/0 | **RED** |
| `compliance-officer.md` | 0 | 41 | 2/1/0/0 | **RED** |
| `factory-coach.md` | 0 | 31 | 4/1/0/0 | **RED** |
| `frontend-ui.md` | 0 | 40 | 4/1/0/0 | **RED** |
| `greenfield-mapper.md` | 0 | 30 | 2/1/0/1 | **RED** |
| `incident-responder.md` | 0 | 28 | 2/1/0/0 | **RED** |
| `installer.md` | 0 | 40 | 3/2/0/0 | **RED** |
| `orchestrator.md` | 0 | 86 | 6/1/0/0 | **RED** |
| `qe-e2e.md` | 0 | 29 | 1/1/0/0 | **RED** |
| `release-manager.md` | 0 | 37 | 4/1/0/0 | **RED** |
| `security-nfr.md` | 0 | 21 | 0/1/0/0 | **RED** |
| `software-engineer.md` | 0 | 37 | 2/1/1/0 | **RED** |
| `system-analyst.md` | 0 | 26 | 0/1/0/0 | **RED** |
| `uat-planner.md` | 0 | 20 | 0/1/0/0 | **RED** |

**RED on 17/17. LANG-06 satisfied.**

### The warning that matters more than the result

**Both arms fail 17/17 independently.**

| arm | RED count |
|---|---|
| positive alone, N = 1 | 17/17 |
| positive alone, N = 2 | 17/17 |
| positive alone, N = 3 | 17/17 |
| positive alone, N = 4 | 17/17 |
| negative alone (zero banned) | 17/17 |

The RED transcript LANG-06 demands is therefore **satisfied by either arm alone, at any N**. It proves
the guard runs; it proves **nothing** about the conjunction being correctly wired. A guard that
accidentally shipped `positive || negative` instead of `positive && negative`, or that dropped one arm
entirely, produces a byte-identical 17/17 RED transcript.

**This is AP-1 one level up and the planner must close it structurally:** the RED-before evidence needs
**two discriminating fixtures**, not one transcript —

- a fixture block that **passes the positive arm and fails the negative** (≥2 lexicon tokens plus an
  article) → must be RED;
- a fixture block that **passes the negative arm and fails the positive** (zero articles/copulas/
  modals/subordinators, zero lexicon tokens) → must be RED;
- a fixture that passes both → must be GREEN (the false-red control).

Without all three, LANG-06's acceptance evidence is the strongest-looking and weakest-actual evidence
in the phase.

### One design consequence the planner must decide

The copula count is **1 in sixteen of seventeen blocks** — it is the opener, `You are <Role>.`
A zero-copula rule makes **the opener line itself illegal**. Every rewritten block must either drop
`are` (`You <Role>.` / `You grug. You <Role>.`) or the rule needs a named, justified exemption for the
first line. D-07 says "zero banned constructions" with no exemption, so the default reading is: the
opener is rewritten. Flagging it because it affects all 17 blocks and is easy to discover late.

## B-2. The approved-verb list (D-12)

**The measured distribution does not support a cutoff.** §A-4: 222 distinct first words over 421
bullets, 176 hapax (41.8%), and the nine most frequent are all non-verbs. Restricted to `## Steps`,
59 of 84 first words occur exactly once. There is no head to adopt; any cutoff either admits almost
nothing or admits almost everything.

**Recommendation: apply D-64's canonical-form move instead of a frequency cutoff.**

Declare the legal shape of a `## Steps` bullet and refuse everything outside it. Concretely:

> A `## Steps` bullet begins with a **verb from `APPROVED_STEP_VERBS`**, in bare imperative form, at
> position 0 — after stripping a leading ordered/unordered marker. No leading bold label, no subject
> noun phrase, no conditional clause.

`APPROVED_STEP_VERBS` is authored, small, and **seeded from the verbs the corpus already uses in bare
imperative position** — which the measurement supplies:

```
Append · Apply · Assemble · Assess · Attach · Capture · Claim · Clarify · Compile · Confirm ·
Create · Degrade · Distill · Draft · Emit · Escalate · Establish · Hand · Identify · Implement ·
List · Mark · Meet · Obtain · Produce · Promote · Propose · Pull · Read · Recommend · Reconcile ·
Record · Run · Seed · Set · Size · Split · Transition · Update · Validate · Verify · Walk · Write
```

**43 verbs, all attested in the corpus, all one-meaning-one-part-of-speech.** This is STE's actual
determinism mechanism (one verb / one meaning), and unlike a frequency cutoff it is defensible: every
member is a verb that a grugops procedural step already uses.

**Conformance today, measured:** of 125 `## Steps` bullets, ≤51 are bare imperatives (§A-4, upper
bound), so **at least 74 of 125 (59%) require re-shaping**. The 41 bold-label bullets (32.8%,
concentrated in `05-pr-quality-gate.md`) are the largest single group and the cheapest to convert —
`**Run the gate** in order: …` → `Run the gate in order: …`.

**Scope the check to `## Steps` only** (§A-3). Extending it to `## Inputs required` or
`## Stop conditions` would red 72 correct noun-phrase and conditional bullets.

**Derived half (D-13).** `kit-model.listRoles()` returns **filenames** (`ba-pm.md`, `qe-e2e.md`), but
the prose uses **display names** (`BA/PM`, `QE/E2E`). D-13's derivation as written yields the wrong
strings. The display names are derivable — one line per role file:

```bash
grep -h "^# Role: " agent-factory/roles/*.md | sed 's/^# Role: //'
# AGENTS.md Scribe · Architect/Design · BA/PM · Brownfield Mapper · Compliance Officer ·
# Factory Coach · Frontend/UI · Greenfield Mapper · Incident Responder · Installer ·
# Orchestrator · QE/E2E · Release Manager · Security/NFR · Software Engineer ·
# System Analyst · UAT Planner            (17/17, no gaps)
```

**Add a `listRoleDisplayNames()` to `kit-model.ts`** deriving from the `# Role: ` heading, and assert
it returns exactly `ROLE_COUNT` entries. The same applies to workflows (`# Workflow: `, 19/19) — and
that derivation immediately surfaces a real one-term-per-concept defect the profile should fix:

```
Backlog refinement · Bootstrap brownfield · Bootstrap greenfield · context compaction ←
context read/write ← Daily sweep · Epic to tickets · Idea to epics · Incident · PR quality gate ·
Release · Retro · Security audit (OWASP ASVS) · Sprint planning · Sprint review ·
task claim + schedule ← Ticket to PR · UAT pack · UI design to build
```

Three of nineteen (`context compaction`, `context read/write`, `task claim + schedule`) are lowercase
while sixteen are sentence-case. **[VERIFIED: `grep -h "^# Workflow: " agent-factory/workflows/*.md`]**

Other derived Technical Names, all confirmed available: config keys — 21 top-level keys from
`agent-factory/config/factory.config.json` (`version, mode, cadence, autonomy, bdd, id_prefix,
repo_strategy, default_stack, wip_limits, sprint_length_days, sizing, priority_scheme, quality, nfr,
security, context, queue, compliance_regime, environments, production_requires_human_confirmation,
blocked_escalation_days`); board columns — 13 rows from `agent-factory/seed/plans/board.md:60-72`
(`Backlog, Ready, In Analysis, In Design, Ready for Dev, In Development, In Review, In Security/NFR,
Ready for UAT, In UAT, Ready to Release, Done, Blocked`). **[VERIFIED: both commands run]**

## B-3. The sentence normalization function (D-05, D-20)

This function is used by **both** the diff-disposition gate (D-05) and the intra-file uniqueness guard
(D-20), so it must be one exported function. Three variants were built and run over all 17 roles.

### Specification

```ts
// scripts/voice-model.ts — the ONE sentence-identity function (D-05 + D-20)
export function normalizeSentence(s: string): string {
  let t = s;
  t = t.replace(/`([^`]*)`/g, "$1");              // code span → contents
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");   // [text](url) → text; link TARGET dropped
  t = t.replace(/\*\*([^*]*)\*\*/g, "$1");         // bold → contents
  t = t.replace(/\*([^*]*)\*/g, "$1");             // italic → contents
  t = t.toLowerCase();                             // case-insensitive
  t = t.replace(/[^a-z0-9 ]+/g, " ");              // ALL other punctuation → space (incl. — – / )
  t = t.replace(/\s+/g, " ").trim();               // collapse whitespace
  let w = t.split(" ").filter(Boolean);
  w = w.filter((x) => x !== "the" && x !== "a" && x !== "an");  // articles dropped
  if (w[0] === "you") w = w.slice(1);              // leading second-person subject dropped
  return w.join(" ");
}
```

Dropping articles and the leading `you` is what makes the caveman block's telegraphic
`You stop if scope grows or architecture must change.` identical to `## One job`'s
`You stop if scope grows or the architecture must change.` — which is the whole point of D-20.

### Segmentation — the decision that actually matters

| variant | segmentation | article/`you` handling | files with ≥1 dup | dup groups | catches `software-engineer.md`? |
|---|---|---|---:|---:|---|
| **A** | sentence (`.!?` + space) | kept | **2 / 17** | 2 | **NO — zero** |
| **B** | sentence | dropped | 6 / 17 | 6 | partially — 2 of 4 |
| **C** | sentence, **then clause** (split on ` — `, ` – `, ` ; `, ` : `) | dropped | **9 / 17** | **12** | **YES — all 4, as 2 groups** |

*(fragments under 4 normalized words ignored in all three)*

**Variant A — D-20 as literally written — would land the uniqueness guard essentially GREEN.** It finds
two duplicates in the whole role corpus (`compliance-officer.md`: *"do not invent legal advice"*;
`greenfield-mapper.md`: *"you do not overbuild"*) and **zero** in `software-engineer.md`, the file
CONTEXT.md names as the worked example. That violates Phase 28's D-24 and AP-1: a guard that passes the
moment it appears has never been watched fail.

**Variant C reproduces CONTEXT.md's measurement exactly.** On `software-engineer.md` it finds:

```
x2  "stop if scope grows or architecture must change"
      → line 9  (## One job, trailing sentence)   "You stop if scope grows or the architecture must change."
      → line 17 (caveman block)                    "You stop if scope grows or architecture must change."
x2  "stop and hand back if scope grows or architecture must change"
      → line 33 (## Responsibilities #4)  "Stop and hand back if scope grows or the architecture must change — quietly absorbing it hides…"
      → line 45 (## Hard limits)          "…Stop and hand back if scope grows or the architecture must change."
```

**Four occurrences, in exactly the four sections CONTEXT.md names.** Variant C is the only variant that
sees the defect D-19 exists to fix.

### Recommendation

**Adopt Variant C.** Export one `normalizeSentence()` plus one `segmentClauses()` from
`voice-model.ts`; both D-05 and D-20 consume both. The full Variant C finding set — the guard's
RED-before evidence, 12 groups across 9 of 17 files:

| file | duplicate normalized clause | × |
|---|---|---:|
| `agents-md-scribe.md` | do not invent fake commands | 2 |
| `architect-design.md` | make structure and boundaries | 2 |
| `architect-design.md` | keep design just enough | 2 |
| `ba-pm.md` | say no to bloat | 2 |
| `compliance-officer.md` | do not invent legal advice | 3 |
| `factory-coach.md` | read metrics not vibes | 3 |
| `installer.md` | make this factory usable in current tool | 2 |
| `installer.md` | detect host coding agent | 2 |
| `release-manager.md` | cut releases not corners | 2 |
| `software-engineer.md` | stop if scope grows or architecture must change | 2 |
| `software-engineer.md` | stop and hand back if scope grows or architecture must change | 2 |
| `system-analyst.md` | do not choose framework | 2 |

**Caveat the planner should price in:** every one of these 12 groups involves the caveman block on one
side. D-09 already removes factual content from the caveman blocks, so the D-19/D-09 rewrite will clear
most of them as a side effect — and the uniqueness guard then goes green. That is the correct outcome
(it is a **regression** guard), but it means the planner should capture the RED transcript **before**
the caveman rewrite lands, not after. Sequence: guard RED → rewrite → guard GREEN, in that order, per
D-24.

## B-4. The guard name (D-11)

### Recommendation: `guard_imperative_lexicon`

LANG-04's test is *"named for the decidable subset it checks."* Against the two candidates:

| candidate | what it names | verdict against LANG-04 |
|---|---|---|
| `guard_procedural_prose` | the **surface** (procedural prose) | Fails the test in the same shape `guard_caveman_preserved` failed: it names what is scanned, not what is decided, and "prose" implies a general prose-quality judgement the guard does not make. `PITFALLS.md:325` records this exact failure mode: *"A guard named for a predicate it does not decide is the `guard_caveman_preserved` mistake with new vocabulary."* |
| **`guard_imperative_lexicon`** | the **predicate** — lexicon membership at imperative position | Names precisely D-12's decidable subset. Carries no standard name, no conformance implication, and no promise of prose quality. |

If the planner also wants the sentence-length and banned-construction rules named, the honest
extension is `guard_imperative_lexicon` for D-12 and a sibling `guard_sentence_form` for D-14 — two
predicates, two names. Naming one guard for three unrelated predicates re-creates the problem at the
output line. **This is a plan-time call; both fit LANG-04.**

### The complete rename call-site list

```bash
git grep -n "guard_ste" -- .
```

**`guard_ste` appears in ZERO source files.** It exists only in planning prose. The complete list of
non-archival sites that must change:

| file:line | current text | required action |
|---|---|---|
| `.planning/REQUIREMENTS.md:85` | *"**LANG-07**: `guard_ste` and the rebuilt voice guard share **one** fence parser…"* | **edit — D-11 explicitly requires this** |
| `.planning/ROADMAP.md:481` | *"…`guard_ste` and the rebuilt voice guard read the fence through **one** parser…"* | **edit — D-11 explicitly requires this** |
| `.planning/PROJECT.md:40` | *"…New `guard_ste`. Includes de-duplicating the role skeleton…"* | **edit — not named in D-11, but it is a live project document and would otherwise disagree** |
| `.planning/REQUIREMENTS.md:82` | LANG-04 — does **not** contain the token `guard_ste`; it says *"is named for that subset"* | **no rename needed**; D-11 says "editing LANG-04" — the actual edit LANG-04 needs is to *state the chosen name*, not to remove `guard_ste` |
| `.planning/research/{FEATURES,PITFALLS,STACK,SUMMARY}.md` (14 occurrences) | pre-phase research | **leave** — historical research artifacts, not live specification |
| `.planning/phases/29-*/29-{CONTEXT,DISCUSSION-LOG}.md` | this phase's own record | **leave** — the record of the decision must keep the old name to be readable |

**D-11's scope is three planning-document edits and a naming decision at authoring time.** There is no
code rename, no call site, no gate output line to change. This is materially smaller than D-11's
wording implies and the planner should not budget a plan for it — it is one task inside another plan.

**Related, and larger:** `ASD-STE100` appears in **zero shipped kit files** — only in `.planning/`.

```bash
git grep -ln "ASD-STE100" -- .     # .planning/* only
```

D-29's banned-claim check therefore has **nothing to catch on today's tree** and would land GREEN. See
§D.

---

# §C — ASD-STE100 without vendoring (LANG-01)

## C-1. The rule/dictionary split

ASD-STE100 has exactly two parts, and the split is the basis of LANG-01's "derived, not vendored":

- **Part 1 — the writing rules.** *"53 writing rules in 9 sections that focus on word choice, grammar,
  sentence structure, and style"* in **Issue 9, published January 2025**.
  [CITED: asd-ste100.org/about_STE.html]
- **Part 2 — the controlled dictionary.** *"approximately 900 approved words"*, plus roughly 1,200
  unapproved words with alternatives. *"In general, each word has only one meaning and is approved with
  only one part of speech."* [CITED: asd-ste100.org/STE_faq.html; en.wikipedia.org/wiki/Simplified_Technical_English]

**Correction to a figure in this project's own planning documents:** the count is **53** rules in
Issue 9, not "~65". The phase description in the research brief says "~65 writing rules"; the roadmap
and requirements do not commit to a number. Use **53**, and cite Issue 9 (2025-01-15).
`.planning/research/.cache/ec31b631…json` already records 53 correctly.

## C-2. The IP line — what a derived profile may and may not do

**Direct, first-hand evidence gathered this session.** An attempt to extract text from the official
Issue 9 PDF returned:

```
$ pdftotext -f 1 -l 14 ASD-STE100_ISSUE9.pdf out.txt
Permission Error: Copying of text from this document is not allowed.
```

**[VERIFIED: command output, 2026-08-13]** The official distribution sets the PDF copy-text permission
bit to *disallowed*. That is the publisher's own machine-readable statement of intent, and it is the
single strongest available signal on the IP question. **No attempt was made to bypass it**, and the
planner should record that: a project whose value proposition is the trace does not circumvent a
rights holder's technical measure to author a document about honest claims.

Published terms, from the spec's own notice as reported in secondary sources:

> *"transmittal, receipt, or possession of the information does not express license or imply any
> rights to use, sell, or manufacture from this information and no reproduction or publication of it,
> in whole or in part, shall be made without the written authority of an officer of ASD."*
> [CITED: search result quoting the ASD-STE100 specification notice page — **`UNKNOWN - verify`** on
> exact current wording, because the primary PDF forbids extraction and this is second-hand]

**The operative line for LANG-01:**

| may | must not |
|---|---|
| State that the profile is **derived from** the ideas of ASD-STE100 Issue 9 | Reproduce the specification text, in whole **or in part** — this covers the **rules**, not only the dictionary |
| Author grugops's **own** rules, in grugops's own words, addressing the same concerns (sentence length, one meaning per word, one instruction per sentence) | Copy or paraphrase-to-the-point-of-substitution any rule's published wording |
| Ship a grugops-authored **approved-verb list** derived from grugops's own corpus (§B-2) | Vendor, redistribute, or reproduce any part of the ~900-word approved dictionary or the ~1,200-word unapproved list |
| Define project-specific **Technical Names and Technical Verbs** — see C-4 | Use the ASD logo, or the `ASD-STE100` trademark, as a mark of the profile |
| Cite the number 53, the two-part structure, the 20/25-word guidance — these are widely-published facts about the standard | Claim conformance, compliance, certification, or endorsement |

**Reported as a fact to verify, not relied upon:** a third-party project states *"ASD-STE100 is a
registered EU trademark (No. 017966390)."* [CITED: github.com/nuelcyoung/asd-ste100 README] —
`UNKNOWN - verify` against the EUIPO register before the profile document asserts it.

## C-3. The disclaimer — ASD/STEMG's own published position

This is not inference. ASD/STEMG publish the constraint directly:

> *"ASD and STEMG do not endorse, certify, or authorize any software tools, including AI-based ones.
> Providers of such tools cannot claim ASD approval or use the ASD logo, copyright, or trademark of
> ASD-STE100."* [CITED: asd-ste100.org/STEsoftware.html]

> *"ASD and the STEMG DO NOT endorse or certify any company, organization, or individual that sells
> tools claimed to be 'fully compliant' with ASD-STE100."* [CITED: asd-ste100.org/STE_faq.html]

**A verified third-party wording pattern** that satisfies both statements:

> *"This is an unofficial study and writing aid. It has no affiliation with ASD (Aerospace, Security
> and Defence Industries Association of Europe) or the Simplified Technical English Maintenance Group
> (STEMG), and it is not certified by either."* … *"This skill paraphrases the standard's rules for
> teaching purposes. It does not reproduce the specification text or the controlled dictionary in
> full."* [CITED: github.com/nuelcyoung/asd-ste100 README]

**Recommended shape for the grugops profile's disclaimer**, in clear voice per CLAUDE.md, and modelled
on the project's **own existing house pattern** at `NOTICE:4-7` (*"It is an independent work and is not
affiliated with, sponsored by, or endorsed by that author"*) **[VERIFIED: NOTICE:4-7]**:

> The grugops writing profile is an independent work, authored by grugops. It is **derived from** the
> ideas of ASD-STE100 Simplified Technical English Issue 9, and it is **not** ASD-STE100. grugops is
> not affiliated with, sponsored by, endorsed by, or certified by ASD (Aerospace, Security and Defence
> Industries Association of Europe) or the Simplified Technical English Maintenance Group (STEMG).
> Neither body endorses or certifies any tool. No part of the ASD-STE100 specification text is
> reproduced here, and no part of its controlled dictionary is included or redistributed. The rules
> below are grugops's own, written for this kit. `guard_imperative_lexicon` checks the subset of them
> that is mechanically decidable; conformance to ASD-STE100 is **not** claimed, checked, or implied.

Note the last clause does double duty — it is also the honest statement of what the guard does and does
not decide, which LANG-04 requires and which `PITFALLS.md:318` warns is otherwise the exact
no-fabrication violation the project forbids.

## C-4. Technical Names and Technical Verbs — sanctioned, not a deviation

This is the most useful finding in §C for LANG-01, and it removes a worry the planning documents carry:

> *"STE permits the use of company or project-related terms that are not listed in the dictionary.
> These are subject-specific nouns and verbs."* Writers may use *"noun terms and verb terms that are
> applicable to their companies, industries, or subject fields."*
> [CITED: asd-ste100.org/about_STE.html]

`.planning/research/FEATURES.md:241` frames this as an escape hatch that dissolves the dictionary
constraint. That framing is too pessimistic for the design D-12 and D-13 actually chose. Because the
grugops profile **does not adopt the dictionary at all** (D-12: verbs at imperative position only), the
Technical Names/Verbs mechanism is not an escape hatch being abused — it is the standard's own
documented extension point being used as designed. **The profile document should say so**, because it
turns LANG-01's "project Technical Names/Verbs set" from an apologetic deviation into a faithful
application of Part 1.

## C-5. Controlled language and token count — no supporting evidence found in either direction

Searched. Findings, with confidence stated honestly:

- **No peer-reviewed study locating an effect of controlled language on LLM token count was found.**
  `[VERIFIED: absence — two targeted searches returned only vendor and blog material]`
- The only quantitative claim located runs **opposite** to the project's honesty floor: *"Studies have
  shown up to 40% reduced word count, mainly as a result from learning how to write the 'need-to-know'
  and omit the 'nice-to-know'."* [CITED: instrktiv.com/en/simplified-technical-english/] — this is a
  **commercial STE consultancy's marketing page**, the "studies" are not identified, and the mechanism
  described (dropping content) is a different operation from re-expressing the same content. **Do not
  cite it as support for anything.** `[ASSUMED — vendor claim, unverified]`
- **No published evidence that controlled language improves LLM comprehension was found**, confirming
  `.planning/research/FEATURES.md:258` and `REQUIREMENTS.md:41`. This stays `UNKNOWN - verify` and the
  kit must not ship the claim. `[VERIFIED: absence]`

**The measured, in-repo evidence — which is the only evidence this project should rely on:**

```bash
node -e "…article + copula density per surface…"
```

| surface | words | articles | article % | copulas | copula % |
|---|---:|---:|---:|---:|---:|
| caveman blocks (17) | 597 | 33 | **5.5%** | 19 | 3.2% |
| workflows (19) | 15,584 | 1,771 | **11.4%** | 400 | 2.6% |
| checklists (13) | 2,502 | 199 | **8.0%** | 57 | 2.3% |

This measurement **refines the honesty floor and partly undercuts its stated reasoning** — see
Contradictions below.

---

# §D — The AP-1 exposure and the shared vacuity mechanism

## D-1. Status of the canonical instance

The canonical AP-1 instance — `if (rows.length === 0) continue;` in `scripts/check-uat-oracles.ts`
while still printing a PASS line — **has been fixed.** The current source at
`scripts/check-uat-oracles.ts:336-358` reads:

```
// PRESENCE IS TWO-SIDED (28-REVIEW CR-01). This was `if (rows.length === 0) continue;` with the
// …every direction of this assertion is satisfied vacuously by an absent row. So zero rows FAILS
// by name, exactly as the beat scan's own two-sided presence…
```

**[VERIFIED: scripts/check-uat-oracles.ts:336-358]** The *pattern* remains open — the fix is one
inline two-sided check in one gate, not a shared mechanism. `.continue-here.md` says so explicitly:
*"Three of the four are one shape: a vacuity floor that exists at the collection level but not at the
element level. Fixing them one at a time, four times, would repeat the mistake — consider whether one
element-level vacuity rule belongs in `audit-model.ts` as the shared authority."*
**[VERIFIED: .planning/phases/28-kit-consistency-audit/.continue-here.md]**

## D-2. Proposed shared mechanism

The aggregator's current API is three free functions and a module-scope counter
(`scripts/check-foundation-guards.ts:313-321`):

```ts
let FAILS = 0;
const pass = (m: string): void => { process.stdout.write(`  PASS  ${m}\n`); };
const fail = (m: string): void => { process.stdout.write(`  FAIL  ${m}\n`); FAILS += 1; };
// warn() is advisory only — it does NOT increment FAILS
```

**[VERIFIED: scripts/check-foundation-guards.ts:313-321]** The defect is structural: `pass(msg)`
accepts an arbitrary string and prints it unconditionally. Nothing in the type system or the call
convention relates a PASS line to the number of elements the check actually visited. Four new guards
means four new opportunities to print an unearned PASS.

**Recommendation: make the measurement a required argument, and make a zero measurement fail.**

```ts
// scripts/vacuity.ts (or exported from voice-model.ts) — ONE element-level vacuity rule.
//
// A gate may not print a PASS line without stating how many ELEMENTS it visited, and a check
// that visited zero elements is a check that was not performed. This is AP-1, closed at the
// call convention rather than by four one-off `=== 0` checks.
export interface Measured<T> {
  readonly label: string;      // what was checked
  readonly visited: number;    // elements actually examined — NEVER a constant
  readonly expected: number;   // the derived denominator (e.g. ROLE_COUNT)
  readonly findings: readonly T[];
}

/** Fold a Measured into the aggregator. Returns the FAIL delta. */
export function reportMeasured<T>(
  m: Measured<T>,
  emit: { pass(s: string): void; fail(s: string): void },
  render: (f: T) => string,
): number {
  // (1) VACUITY FLOOR — element level. A zero-element run can never print PASS.
  if (m.visited === 0) {
    emit.fail(
      `${m.label}: ZERO elements visited (expected ${m.expected}) — this check was NOT performed. ` +
      `A PASS line here would state a check that did not run.`,
    );
    return 1;
  }
  // (2) DENOMINATOR FLOOR — collection level. Short scan set = a silently narrowed check.
  if (m.visited !== m.expected) {
    emit.fail(
      `${m.label}: visited ${m.visited} of ${m.expected} elements — the scan set is short, ` +
      `so the result covers less than it claims`,
    );
    return 1;
  }
  // (3) FINDINGS
  if (m.findings.length > 0) {
    emit.fail(`${m.label}: ${m.findings.length} finding(s) over ${m.visited} elements\n` +
      m.findings.map(render).join("\n"));
    return 1;
  }
  // (4) The PASS line CARRIES THE MEASUREMENT (D-08) — never an assertion.
  emit.pass(`${m.label}: 0 findings over ${m.visited}/${m.expected} elements`);
  return 0;
}
```

**Why this shape:**

- `visited` **cannot be a constant** — it is incremented by the loop that does the work. A guard that
  skips its loop reports `visited: 0` and fails its own floor. This is D-08's *"a vacuous run then
  prints zero rows and fails its own count assertion, so the collection-level floor and the
  element-level floor are the same floor"*, made mechanical rather than per-guard.
- `expected` is the **derived denominator** (`ROLE_COUNT`, `WORKFLOW_COUNT`, a derived checklist
  count) — never hand-typed. This composes with the milestone's founding rule.
- The PASS line format `0 findings over 17/17 elements` **is** LANG-06's *"publishes a number with a
  denominator"*, at every guard rather than only the voice guard.
- It is a **fold**, not an inheritance hierarchy — it fits the existing free-function aggregator with
  no restructuring, and `check-foundation-guards.ts` keeps `let FAILS` by doing
  `FAILS += reportMeasured(...)`.

**Applied to the four new guards, and to `guard_caveman_preserved`'s replacement:**

| guard | label | visited | expected |
|---|---|---|---|
| rebuilt voice | `caveman voice` | blocks read | `ROLE_COUNT` (17) |
| `guard_imperative_lexicon` | `imperative lexicon` | `## Steps` bullets examined | derived bullet count |
| intra-file uniqueness | `role sentence uniqueness` | role files scanned | `ROLE_COUNT` (17) |
| banned-claim | `banned claims` | scanned files | derived scan-set size |

D-08's per-block detail line (`qe-e2e.md: tokens 4 / content words 23, banned 0`) is emitted **inside**
the loop, before `reportMeasured` folds the result — so a vacuous run prints zero detail lines **and**
fails the count assertion, which is exactly D-08's design.

## D-3. Two of the four guards are near-vacuous against today's tree

The RED-before-GREEN discipline (Phase 28 D-24) has different strength per guard. Measured:

| guard | RED evidence available today | strength |
|---|---|---|
| rebuilt voice guard | 17/17 blocks RED | strong count, **weak discrimination** — both arms fail 17/17 independently (§B-1) |
| intra-file uniqueness | 12 groups / 9 of 17 files under Variant C; **2 groups / 2 files under Variant A** | **entirely dependent on the normalization choice** (§B-3) |
| `guard_imperative_lexicon` | ≥74 of 125 `## Steps` bullets non-conforming; 273/982 sentences over 20 words | **strong** |
| **banned-claim check (D-29)** | **`ASD-STE100` appears in ZERO kit files. `guard_ste` appears in ZERO source files.** Nothing to catch. | **vacuous — lands GREEN** |
| *(D-14 modal rule, if shipped alone)* | 7 occurrences in 32 files | **near-vacuous** |

**The banned-claim check is the sharpest AP-1 exposure in the phase.** It exists to prevent a claim that
does not yet exist, in a document this phase is about to author. Its RED-before evidence cannot come
from today's tree.

**Recommended sequencing for D-29:**

1. Author the profile document **first**, deliberately containing a draft conformance sentence.
2. Land the banned-claim check → **RED**, naming the profile document and the offending line. Capture
   the transcript.
3. Remove the sentence → **GREEN**.
4. Keep a **planted-fixture** test in `scripts/<name>.test.ts` (a hermetic mirror with the sentence
   restored) so the guard is provably non-vacuous forever after, not just at the moment it landed.

Step 4 is the durable half. The tree will never again contain the claim, so without a fixture the
guard's only evidence is one historical commit.

---

# §E — Guard placement

## E-1. The two wiring shapes, measured

| property | inside `check-foundation-guards.ts` | standalone (`check-public-docs-vocabulary.ts` pattern) |
|---|---|---|
| host file size today | **2,637 lines** (largest in `scripts/`) | 433 / 436 / 440 / 511 lines for the four existing standalone gates |
| `package.json` script | **none needed** (invoked bare at `ci.yml:93`) | one line: `"check:x": "tsc --outDir .tmp-build && node scripts/x.js"` |
| CI wiring | **none needed** — inherits `ci.yml:93` | one line in the ubuntu-only block |
| "wired at both ends" | inherited | must add the `.test.ts` spawn **and** the CI line |
| `isEntry` / `pathToFileURL` guard | not needed | required (Windows correctness) |
| exit-code aggregation | shared `let FAILS` + `ALL CHECKS PASSED` | own `FAILS` + own `ALL CHECKS PASSED` |
| output grouping | one `[guard_x]` header among 11 | own gate, own header block |
| freshness pair cost | **0 new pairs** | 1 new pair per gate |
| blast radius of a bug | shares a 2,637-line module with 11 live guards | isolated |

Precedent: `freshness:catalog` was kept deliberately standalone (Phase 18 D-07), and Phase 28's three
audit gates all shipped standalone at ~430–510 lines each.

## E-2. Recommendation — split by input, not by convenience

| new guard | placement | reason |
|---|---|---|
| **rebuilt voice guard** (replaces `guard_caveman_preserved`) | **inside** `check-foundation-guards.ts` | It *replaces* an existing guard in that file, over `ROLE_FILES`, which the aggregator already derives. Moving it out would leave `guard_voice` and its inverse in two places — the exact two-authorities shape LANG-07 forbids. |
| **intra-file uniqueness guard** (D-20) | **inside** `check-foundation-guards.ts` | Same scan set (`ROLE_FILES`), same `voice-model.ts` import, same fence authority. A reader should meet the three role-prose guards together. |
| **`guard_imperative_lexicon`** (D-12/D-14) | **standalone** `scripts/check-imperative-lexicon.ts` | Different corpus (47 governed files: workflows + checklists + seed templates + contracts — not `ROLE_FILES`), different derivation, and it needs its own derived-exclusion logic for the generated ASVS checklist (§A-2). Folding a 47-file corpus walk into a 2,637-line role-oriented aggregator buys nothing and costs isolation. |
| **banned-claim check** (D-29) | **standalone** `scripts/check-banned-claims.ts` | Its scan set is *public-facing documents plus the new profile document* — the same surface `check-public-docs-vocabulary.ts` already owns, following the same `dead-vocabulary.ts` one-list/N-consumers pattern D-29 names. Sitting beside its sibling is the readable placement, and it keeps the negative-literal authority out of the aggregator (which `dead-vocabulary.ts`'s own header warns must never enter a scan set). |

**Net wiring cost of this recommendation:** 2 new `package.json` scripts, 2 new CI lines, 2 new
`.test.ts` files, **2 new freshness pairs** (43 → 45), plus `voice-model.ts` itself (**+1 pair → 46**).
If `voice-model.ts` splits (a Claude's-discretion item), 47.

---

# §F — Risks and landmines for the planner

## F-1. Regression command — `npm test` spends tokens

```bash
grep -n '"test":' package.json     # "test": "vitest run"
ls scripts/e2e/                    # uat-live.test.ts
```

`npm test` runs `vitest run` with **no exclusion**, which includes `scripts/e2e/uat-live.test.ts` — the
live `claude --print` lane. On an authenticated box this spends tokens and can hang. **[VERIFIED:
package.json:11 + directory listing]**

**Use the CI command, which is correct and cheap:**

```bash
npx vitest run --exclude '**/scripts/e2e/**'
```

**[VERIFIED: .github/workflows/ci.yml:71]** — CI itself excludes the e2e lane on every leg.

## F-2. The `STATE.md` escape-doubling × superlinear-regex incident — dormant, not fixed

```bash
awk '{print length, NR}' .planning/STATE.md | sort -rn | head -3   # 7994, 2524, 2237
grep -o '\\\\*' .planning/STATE.md | awk '{print length}' | sort -rn | head -1   # 1
```

**Longest backslash run today: 1.** The pathological 262,143-char runs are **not present**. Longest line
is 7,994 chars — large but not pathological. **[VERIFIED: command output]**

**The mechanism is still live**, though: the state writer re-escapes on every write, and this phase
writes `STATE.md` many times across 10–14 plans. **After any run of plans, re-check both numbers** with
the two commands above before blaming a guard for being slow. Current guard baseline is **0.127 s** for
11 guards, so a multi-second guard run is a signal, not noise.

**Applies directly to this phase:** three of the four new guards run regexes over prose. Two patterns to
refuse at authoring time:

- **Nested quantifiers over the same class** — `(\w+\s*)+`, `(.*)*`. The sentence splitter and the
  clause splitter are the natural place for this to creep in. Prefer `split()` over a match-all regex.
- **Unbounded lookaround combined with alternation** across a 90 KB file. The governed corpus contains
  an 89,840-byte file (excluded, §A-2) and a 13,831-byte workflow. Test the guard against
  `05-pr-quality-gate.md` specifically and record the timing.

## F-3. BSD grep silently skipping binary-classified files

```bash
git ls-files | while read f; do file -b "$f" | grep -qi "text\|json\|empty" || echo "NON-TEXT: $f"; done
```

Five tracked files classify as non-text: `brand/icon.svg`, `brand/wordmark-lockup.svg`,
`brand/wordmark-mono-dark.svg`, `brand/wordmark-mono-light.svg`, `brand/wordmark.svg`.
**[VERIFIED: command output]** None is in any governed corpus, so the exposure for this phase is
**low**. `scripts/check-nul-bytes.js` already gates the real cause (NUL bytes) repo-wide with no
exemption list.

**Still applies to the planner's own verification commands.** When counting occurrences during the
rewrite, prefer `grep -a` or a Node walk over a bare `grep -rn`, and never accept a zero from a spot
grep as proof of absence without checking `file -b`.

## F-4. The `## One job` → generated-artifact cascade (build state)

**This is the phase's most expensive hidden dependency and it is not in CONTEXT.md.**

```bash
grep -n "One job" scripts/generate-role-adapters.ts scripts/generate-catalog.ts scripts/validate-agent-factory.ts
```

`## One job`'s **first sentence** is consumed by three places:

| consumer | line | what it derives | gate that catches drift |
|---|---|---|---|
| `scripts/generate-role-adapters.ts:270-286` | `const description = \`${firstSentence(job!)} Use when: ${firstSentence(act!)}\`` | all **17** adapter `description:` fields | `npm run freshness:adapters` (byte gate) |
| `scripts/generate-catalog.ts:133-138` | the catalog's `One job` column | `docs/` catalog | `npm run freshness:catalog` (byte gate) |
| `scripts/validate-agent-factory.ts:203-210` | pins the required headings `## One job`, `## Caveman prompt`, `## Responsibilities`, `## Hard limits` | structure | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` |

**[VERIFIED: scripts/generate-role-adapters.ts:270-286; scripts/generate-catalog.ts:133-138;
scripts/validate-agent-factory.ts:203-210]**

**The subtlety that decides how expensive this is.** `firstSentence()` splits on the first `". "`. D-19
as literally written only **deletes the trailing sentence**, which leaves the first sentence — and
therefore all three generated artifacts — **byte-identical**. Measured: 16 of 17 roles have exactly two
sentences in `## One job`; `incident-responder.md` has one.

**But the controlled-language rewrite will not leave the first sentence alone.** Measured `## One job`
first-sentence word counts:

| role | words | role | words |
|---|---:|---|---:|
| `compliance-officer` | 31 | `agents-md-scribe` | 24 |
| `release-manager` | 31 | `qe-e2e` | 24 |
| `ba-pm` | 30 | `factory-coach` | 24 |
| `orchestrator` | 29 | `frontend-ui` | 23 |
| `security-nfr` | 29 | `greenfield-mapper` | 23 |
| `architect-design` | 27 | `incident-responder` | 23 |
| `installer` | 25 | `system-analyst` | 22 |
| | | `uat-planner` | 22 |
| | | `software-engineer` | 20 |
| | | `brownfield-mapper` | 19 |

**15 of 17 exceed the 20-word procedural limit.** Once the profile rewrites them, **all 17 adapters,
the 7 skill twins, and the catalog regenerate**, and three freshness gates go red unless the
regeneration lands in the **same commit**.

**Planner action:** every plan that touches `## One job` must, in the same commit, run

```bash
npm run generate:adapters && npm run generate:skill-twins && npm run generate:catalog
npm run freshness:adapters && npm run freshness:skill-twins && npm run freshness:catalog
```

and commit the regenerated `.md`. Note also that **Phase 29.1 depends on this exact seam**
(`ROADMAP.md:491`) — doing it once, cleanly, here is what keeps 29.1 from regenerating twice.

## F-5. `guard_voice` will fail on the new caveman blocks — by design, and it needs handling

`guard_voice` scans the **clear-voice remainder** of each role file for `VOICE_MARKERS`
(`check-foundation-guards.ts:1959-1994`). The rewritten blocks become **maximally grug** (D-09 makes
that safe). Two consequences:

1. If `voice-model.ts`'s reader and `stripCavemanBlock` ever disagree on a fence, a grug token leaks
   into the "remainder" and `guard_voice` fails on correct text. **This is precisely why D-22/D-24
   require one authority** — but it means `guard_voice` **must be migrated to `voice-model.ts` in the
   same plan** as the rebuilt voice guard. Leaving `stripCavemanBlock` in place "for now" reproduces
   the two-grammar defect the phase exists to close.
2. `neutralizePhrases()` (`check-foundation-guards.ts:1947-1957`) rewrites `/grug`, `grug voice`,
   `grug wink` so clear-voice brand prose stays green. If the lexicon adds terms that also appear in
   clear-voice prose (`rock`, `club`, `good`, `bad` are risky), `guard_voice` reds on correct text.
   **Recommendation: keep the lexicon to terms that do not occur in the kit's clear-voice prose**, and
   verify with a grep over the stripped remainder before committing the lexicon. The candidate list in
   §B-1 was chosen with this in mind; `good`/`bad`/`ugly` were **excluded** from the final proposal for
   exactly this reason.

## F-6. `security-nfr.md` and `compliance-officer.md` are dual-voice files

Both carry a caveman fence **and** clear-voice safety text, and both are in the 41-file safety-surface
exclusion list. `security-nfr.md` is also the role with **75 bytes** to its FAIL ceiling (§A-1) and is
the file most likely to need a split under D-26. Plan these two roles as their own plan, not as part of
a batch of 17.

## F-7. Sequencing constraints, consolidated

```
voice-model.ts (D-22/D-23/D-24)                    ← must land first; everything imports it
  └─ guard_voice MIGRATED to it in the same plan   ← F-5.1; do NOT leave stripCavemanBlock live
  └─ rebuilt voice guard RED on 17/17              ← capture transcript + 3 discriminating fixtures
  └─ intra-file uniqueness guard RED (Variant C)   ← capture BEFORE the caveman rewrite (§B-3)
       └─ D-09 caveman content removal
       └─ D-19 skeleton de-duplication              ← frees bytes
            └─ D-30 when-absent sentence            ← spends bytes; MUST follow, per-role budget (§A-1b)
                 └─ regenerate adapters + twins + catalog, same commit (F-4)
                      └─ D-26 re-baseline, dedicated FINAL plan, once
profile document authored (LANG-01)
  └─ banned-claim guard RED against the draft claim, then GREEN + planted fixture (§D-3)
  └─ D-33 profile claims registered
guard_imperative_lexicon (standalone)              ← independent of the role track; parallelizable
  └─ derived exclusion of the GENERATED ASVS checklist (§A-2)
  └─ workflows + checklists conforming rewrite
D-11 rename: 3 planning-doc edits                  ← one task, not a plan (§B-4)
D-32 count corrections + the 4,036 B figure (§A-5) ← same commit as the block rewrite, per D-04
```

---

## Contradictions with locked decisions

Four items where measurement diverges from a document. **None is a request to re-open a locked
decision** — each is reported so the planner and the human can decide.

### 1. The honesty floor's token-count claim is stated at three different confidence levels, and its reasoning targets a surface the profile does not govern

| document | wording | implied confidence |
|---|---|---|
| `.planning/REQUIREMENTS.md:42` | *"STE **increases** token count"* | **asserted as fact** |
| `.planning/ROADMAP.md:485` | *"STE **likely** increases token count"* | hedged |
| `.planning/research/FEATURES.md:259` | *"**`UNKNOWN - verify`**: that STE reduces token count"* | unknown |

**[VERIFIED: all three lines read this session]**

Two problems, both measured:

- **The stated reasoning targets an ungoverned surface.** The floor's parenthetical is *"its rules
  forbid the telegraphic omission caveman relies on."* Caveman lives in the fenced block, and
  **LANG-02 explicitly excludes the fenced caveman blocks from the profile**. The profile never applies
  a no-telegraphic-omission rule to them. Measured (§C-5): caveman blocks run **5.5%** articles;
  the governed workflows run **11.4%** — already normal English. Restoring articles on the governed
  corpus produces approximately **zero** growth, because there are no dropped articles there to
  restore.
- **The real growth mechanism is different, and it is measurable.** Growth on the governed corpus comes
  from **sentence splitting** (273 of 982 sentences exceed 20 words) and on the roles from rewriting
  15 of 17 over-length `## One job` first sentences — not from article restoration.

**No evidence was found in either direction** (§C-5). The only quantitative source located is a vendor
page claiming a **40% reduction** — opposite to the floor, and unusable.

**Recommendation, for the human to decide:** state the floor as what is actually known —

> The profile is justified on determinism and one-term-per-concept grounds. Its effect on token count
> is **`UNKNOWN - verify`** in both directions; no study was located. Caveman-as-token-economy is
> **disproven on this artifact by measurement** and must not be restated. The profile does not govern
> the fenced caveman blocks, so no article-restoration cost applies to them. **D-28 already requires
> measuring and recording the growth this phase produces** — that measurement, not an assumption, is
> what a later phase should reason from.

This keeps every part of the floor that is measured, drops the one part that is not, and is strictly
more consistent with `REQUIREMENTS.md:41`'s own treatment of the adjacent comprehension claim.
`REQUIREMENTS.md:42` should be softened in the same D-11 edit pass that touches LANG-04/LANG-07.

### 2. D-20's uniqueness guard, as literally specified, would land GREEN

D-20 says *"no normalized sentence repeats **within** a role file."* Measured (§B-3): under exact
normalized-**sentence** equality that is **2 of 17 files** and **zero** in `software-engineer.md` — the
file CONTEXT.md itself cites as the worked four-times example. The guard would pass the moment it
appears, violating Phase 28's D-24 and AP-1.

**Not a contradiction of the decision — a specification of the discretion CONTEXT.md already grants.**
CONTEXT.md hands "the normalization function used for sentence identity in D-05 and D-20" to Claude's
discretion. Choosing clause-level segmentation (Variant C) is that choice, and it is what makes D-20
enforce D-19. Reported here because the difference between the two readings is the difference between
a guard that works and one that does not, and a planner reading D-20 literally would build the wrong
one.

### 3. D-13's derivation returns filenames, but the prose uses display names

D-13 specifies *"role names from `kit-model.listRoles()`, workflow names from `listWorkflows()`"*.
Those return **filenames** (`ba-pm.md`, `qe-e2e.md`). The Technical Names actually used in the governed
prose are display names (`BA/PM`, `QE/E2E`, `Architect/Design`). Using the filenames would produce a
Technical Names set that matches nothing in the corpus.

**Resolution is additive and stays inside D-13's spirit** (derived, never listed): add
`listRoleDisplayNames()` / `listWorkflowDisplayNames()` to `kit-model.ts`, deriving from the
`# Role: ` / `# Workflow: ` headings, each asserting its count two-sided against `ROLE_COUNT` /
`WORKFLOW_COUNT`. Verified available at 17/17 and 19/19 (§B-2).

### 4. D-32 corrects the counts but not the byte figure in the same field

D-32 corrects "18" → "17" in C-28-003, C-28-012 and C-28-032. C-28-003's *same mechanism field* also
carries *"total 4,036 bytes"* **[VERIFIED: docs/audit/28-claim-registry.md:94]**; the measured
block-interior total is **3,528 B** (§A-5). Leaving the byte figure uncorrected leaves the row carrying
a number no command reproduces — the same defect D-32 exists to fix, one clause to the right. It is a
mechanism field, not a verbatim anchor, so D-32's own reasoning covers it.

---

## Runtime State Inventory

This is a prose-rewrite phase, not a rename or migration, so most categories are empty. Two are not.

| Category | Items found | Action required |
|---|---|---|
| **Stored data** | **None.** No database, no datastore, no runtime records embed role prose. The kit is files. Verified: `grep -rn "\.grugops/context"` reaches only prose references and `context-io.ts`; no committed runtime state exists in this repo. | none |
| **Live service config** | **None.** grugops ships no external service. No n8n, Datadog, Tailscale or Cloudflare surface exists. Verified by absence across `git ls-files`. | none |
| **OS-registered state** | **None.** No scheduler task, no pm2 process, no launchd plist, no systemd unit. The only OS-adjacent artifact is `hooks/guard.ts` (a Claude Code `PreToolUse` hook), which contains no role prose. | none |
| **Secrets / env vars** | **None renamed.** `CHECK_ROOT`, `VALIDATE_KIT_ROOT`, `VALIDATE_ROOT`, `GRUGOPS_HOME`, `GRUGOPS_SRC`, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` are all untouched by a prose rewrite. | none |
| **Build artifacts / generated files** | **THREE, and this is the phase's live cascade.** (a) **17 generated adapters** at `.claude/agents/grugops-*.md` — `description` derives from `## One job`'s first sentence; (b) **7 generated skill twins**; (c) the **docs catalog**. All three are byte-gated (`freshness:adapters`, `freshness:skill-twins`, `freshness:catalog`). Plus **43 committed `.js` twins** under `npm run freshness`, going to 45–47. | **Regenerate + re-gate in the SAME commit as any `## One job` edit** (see §F-4). New `.ts` files require `npm run build` and a committed `.js`. |

---

## Standard Stack

**Net change to `package.json`: none.** No new dependency, runtime or dev.

### Core

| Component | Version | Purpose | Why standard here |
|---|---|---|---|
| Node.js stdlib (`node:fs`, `node:path`, `node:url`) | Node 22+ LTS | all four guards, `voice-model.ts` | The zero-runtime-dependency contract (CLAUDE.md). Every one of the 11 existing guards is built this way. **[VERIFIED: scripts/check-public-docs-vocabulary.ts:12 — *"Node stdlib ONLY — node:fs + node:path. Zero npm dependencies."*]** |
| TypeScript | `~6.0.3` (dev only) | source of truth, compiled by `tsc` to committed `.js` | D-13 of the project's stack decision; already in `devDependencies`. |
| Vitest | `~4.1.8` (dev only) | guard tests, planted fixtures, hermetic mirrors | The established test harness; 46 test files today. |

### Supporting — existing in-repo modules the phase composes

| Module | Lines | Role in this phase |
|---|---:|---|
| `scripts/kit-model.ts` | 1,076 | derivation authority for D-01(b), D-13, D-18; gains `listRoleDisplayNames()` (§B-2) |
| `scripts/frontmatter.ts` | 4,208 | `stripFencedBlocks` — **composed** by `voice-model.ts`, never re-implemented (D-24) |
| `scripts/dead-vocabulary.ts` | 77 | the one-list / N-consumers shape both `voice-model.ts` (D-22) and the banned-claim check (D-29) follow |
| `scripts/check-claim-anchors.ts` | 440 | live 38-comparison byte freeze = D-01(a), free |
| `scripts/check-public-docs-vocabulary.ts` | 433 | the standalone-gate template to copy (§E) |
| `scripts/check-foundation-guards.ts` | 2,637 | host for 2 of the 4 new guards (§E-2) |

### Alternatives considered — and rejected before this phase

| Instead of | Could use | Why rejected |
|---|---|---|
| Hand-written stdlib guard | Vale 3.15.2 | Native per-platform binary; no ASD-STE100 style package exists; would create a **second controlled-language authority** — the shape this project paid 8 rounds three times to learn. `[CITED: .planning/research/STACK.md:198]` |
| Hand-written | `retext-simplify` / `write-good` / `textlint` | All MIT but pull large dependency trees; violate the zero-runtime-dependency rule if shipped to hosts. `[CITED: .planning/research/STACK.md:190]` |
| Hand-written | `proselint` (Python) / LanguageTool (Java) | Second language runtime, or an outbound network call from a tool with no telemetry. `[CITED: .planning/research/STACK.md:363]` |
| Own approved-verb list | Vendoring the ASD ~900-word dictionary | Prohibited (§C-2), and software prose needs `commit`, `branch`, `frontmatter`, `idempotent` — none approved. `[CITED: .planning/research/FEATURES.md:241]` |

**Installation:** none. `npm ci` installs the existing dev set unchanged.

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.**

```bash
node -e "const p=require('./package.json'); console.log(p.dependencies, p.devDependencies)"
```

No `dependencies`. `devDependencies` are `typescript`, `vitest`, `@types/node` — all pre-existing,
unchanged by this phase, and never shipped to host machines. No package name is introduced, so no
registry lookup, slopsquat check, or `postinstall` inspection applies.

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|---|---|---|---|
| Caveman-fence reading (one authority) | `scripts/voice-model.ts` | composes `scripts/frontmatter.ts` | D-22/D-24. One format-aware authority per predicate; the section-anchored fence is a genuinely different grammar from the generic strip. |
| Caveman lexicon + banned constructions | `scripts/voice-model.ts` | — | D-22: both guards import; neither holds a literal inline. |
| Sentence normalization + clause segmentation | `scripts/voice-model.ts` | — | Used by **both** D-05 and D-20 ⇒ one function (§B-3). |
| Approved verbs + Technical Names | `scripts/voice-model.ts` (verbs) + `scripts/kit-model.ts` (derived names) | — | D-12 authored, D-13 derived; the split follows what can and cannot go stale. |
| Element-level vacuity floor | one shared module (§D-2) | consumed by all 4 new guards + the aggregator | AP-1 blocking; four one-off `=== 0` checks is the recorded mistake. |
| Voice + uniqueness enforcement (role corpus) | `scripts/check-foundation-guards.ts` | — | Same scan set as `guard_voice`; keeping them together is what LANG-07 is about. |
| Imperative-lexicon enforcement (governed corpus) | standalone `scripts/check-imperative-lexicon.ts` | `kit-model.ts` for derivation | Different corpus, different derivation, needs its own generated-file exclusion (§E-2). |
| Banned-claim enforcement | standalone `scripts/check-banned-claims.ts` | `dead-vocabulary.ts` pattern | Public-document surface; sits beside `check-public-docs-vocabulary.ts` (§E-2). |
| Diff-disposition gate (D-05) | standalone, git-reading | `voice-model.ts` normalizer | Only gate in the phase whose input is `git diff`, not the filesystem. |

## Architecture Patterns

### System architecture

```
                    ┌─────────────────────────────────────────────┐
   filesystem ─────►│ scripts/kit-model.ts                        │
   (roles/,         │  listRoles() 17 · listWorkflows() 19        │
    workflows/,     │  + listRoleDisplayNames() [NEW, §B-2]       │
    checklists/)    │  + derived checklist/template set [NEW]     │
                    └───────────────┬─────────────────────────────┘
                                    │ derived sets + asserted counts
                    ┌───────────────▼─────────────────────────────┐
   role .md    ────►│ scripts/voice-model.ts            [NEW]     │
   bytes            │  readCavemanFence(text)                     │
                    │    → {ok:true, inside, outside}             │
                    │    → {ok:false, reason:                     │
                    │        "missing"|"unterminated"|"multiple"} │◄── composes
                    │  CAVEMAN_LEXICON · CAVEMAN_LEXICON_MIN      │    frontmatter.ts
                    │  BANNED_CONSTRUCTIONS                       │    stripFencedBlocks
                    │  APPROVED_STEP_VERBS                        │    (D-24)
                    │  normalizeSentence() · segmentClauses()     │
                    └───┬──────────┬──────────┬───────────┬───────┘
                        │          │          │           │
        ┌───────────────▼──┐  ┌────▼───────┐  │           │
        │ guard_voice      │  │ rebuilt    │  │           │
        │ (MIGRATED off    │  │ voice      │  │           │
        │  stripCavemanBlk)│  │ guard      │  │           │
        │  scans .outside  │  │ scans      │  │           │
        └────────┬─────────┘  │ .inside    │  │           │
                 │            └────┬───────┘  │           │
        ┌────────▼─────────────────▼──────┐   │           │
        │ intra-file uniqueness guard     │   │           │
        │  (normalizeSentence ∘ segment)  │   │           │
        └────────────────┬────────────────┘   │           │
                         │                    │           │
   ┌─────────────────────▼────────────────┐   │           │
   │ scripts/check-foundation-guards.ts   │   │           │
   │  11 existing + 2 new                 │   │           │
   │  FAILS += reportMeasured(...)  ◄─────┼───┼───────────┼──┐
   └──────────────────┬───────────────────┘   │           │  │
                      │                       │           │  │  ┌──────────────────┐
   ┌──────────────────┼───────────────────────▼──┐        │  └──┤ shared vacuity   │
   │ check-imperative-lexicon.ts  [NEW,standalone]│        │     │ floor  (§D-2)    │
   │  corpus: 19 wf + 13 chk + 13 seed + 2 ctr    │        │     │ visited/expected │
   │  EXCLUDES files carrying `GENERATED` (derived)│        │     └──────────────────┘
   │  scope: `## Steps` bullets only              │        │
   └──────────────────────────────────────────────┘        │
                                                           │
   ┌───────────────────────────────────────────────────────▼──┐
   │ check-banned-claims.ts  [NEW, standalone]                │
   │  negative literals (dead-vocabulary.ts pattern):         │
   │   ASD-STE100 conformance/certification · token-economy   │
   │   win · LLM-comprehension benefit                        │
   │  scan: public docs + the NEW profile document            │
   └──────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────┐
   │ diff-disposition gate (D-05)  [NEW, standalone]          │
   │  input: git diff (NOT the filesystem)                    │
   │  changed normalized sentences ∩ {claim anchors (a),      │
   │    structural sections (b), guard literals (c)}          │
   │  → RED absent a same-commit companion edit               │
   └──────────────────────────────────────────────────────────┘

   ┌──────────── same-commit cascade on any `## One job` edit ─┐
   │ generate:adapters → 17 .claude/agents/*.md               │
   │ generate:skill-twins → 7 skills                          │
   │ generate:catalog → docs catalog                          │
   │ freshness:{adapters,skill-twins,catalog} byte-gate all 3 │
   └──────────────────────────────────────────────────────────┘
```

### Pattern 1: canonical form, not a widened parser (D-64 / D-23)

**What:** Enumerate the one legal shape; refuse everything outside it by name. Do not add an arm to
handle each newly discovered malformed input.
**When:** Every predicate in this phase — the fence reader, the step-bullet grammar, the sentence form.
**Example** (the shape D-23 asks for, matching the project's established discriminated-result idiom):

```ts
// Source: pattern established by scripts/frontmatter.ts (D-64, Phase 27, plan 27-62)
export type FenceRead =
  | { readonly ok: true; readonly inside: string; readonly outside: string }
  | { readonly ok: false; readonly reason: "missing" | "unterminated" | "multiple" };

export function readCavemanFence(text: string): FenceRead {
  // ONE pass. Count `## Caveman prompt` headings FIRST — two is `multiple`, and today
  // stripCavemanBlock strips both while extractCavemanBlock silently ignores the second
  // (measured this session; see 29-RESEARCH §A-6).
  // Then locate exactly two fence lines after the heading. Anything else refuses BY NAME.
  // Every consumer switches exhaustively over `reason` under a compiler-checked never-branch,
  // so a fourth reason cannot be added without every consumer failing to typecheck.
}
```

**Why the never-branch matters:** Phase 27 D-44 established that a total classifier whose verdict
every call site consumes exhaustively is what closed an 8-round bypass. Applying it here means adding
a fifth `reason` later is a compile error at every consumer, not a silent fall-through.

### Pattern 2: PASS lines carry measurements (D-08)

**What:** No PASS line asserts; every one publishes `n / d`.
**Example** — the shape CONTEXT.md's `<specifics>` asks for:

```
[voice] caveman blocks measured against the committed lexicon
  qe-e2e.md: tokens 4 / content words 23, banned 0
  uat-planner.md: tokens 3 / content words 18, banned 0
  … 15 more …
  PASS  caveman voice: 0 findings over 17/17 elements
```

A vacuous run prints **zero detail lines**, `visited` is 0, and `reportMeasured` fails its own floor —
so the collection-level and element-level floors are the same floor (D-08).

### Pattern 3: derive the set, assert the count

Applied to every new set this phase introduces: the checklist corpus, the governed-template set, the
generated-file exclusion, the role display names. Each gets a two-sided cardinality assertion. The two
sets that stay **hand-maintained** — `roleCeiling()` (D-25) and `APPROVED_STEP_VERBS` /
`CAVEMAN_LEXICON` (measurement baselines and authored vocabulary) — must each carry a written
justification in their header, matching the existing `roleCeiling()` D-17 note at
`check-foundation-guards.ts:2074-2079`.

### Anti-patterns to avoid

- **Adding a third arm to a predicate whose weakest arm dominates.** D-06 states it; the `^You` arm is
  deleted, not supplemented.
- **A heuristic detector that is a strict subset of the real predicate.** 13 documented bypasses across
  v2.0 came from this. D-03 and D-15 both refuse it explicitly.
- **A one-time pass instead of a guard.** D-20's reason: *"this project's record is that one-time acts
  drift back while the suite stays green — the voice itself drifted out over a full milestone under a
  passing guard."*
- **A guard authored but never wired.** `freshness:adapters` ran for a whole phase as a side effect of
  a test. Wire at both ends (§A-7).
- **Widening a scan set to reach green.** `PUBLIC_DOCS_SCAN_COUNT` is two-sided pinned precisely so
  removing a member is not available (`ci.yml:132-133`).
- **Raising a byte ceiling mid-phase.** D-26. `security-nfr.md` will make this tempting (§A-1b).

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Reading the caveman fence | a third fence state machine | `voice-model.ts`'s one reader (D-22/D-23) | Two already exist and disagree on 2 of 3 malformed forms (§A-6). A third makes it three. |
| Generic fenced-block stripping | a new fence scanner inside `voice-model.ts` | compose `frontmatter.ts` `stripFencedBlocks` (D-24) | It is already the D-64 authority, already shared by `guard_wr05` and `guard_adapter_body`. |
| "What roles/workflows exist" | a `readdirSync` in the new guard | `kit-model.ts` listers + asserted counts | KIT-01/KIT-02 exist because five hand-maintained lists rotted while green. |
| Retired/banned vocabulary literals | an inline array in the new guard | the `dead-vocabulary.ts` one-list/N-consumers pattern (D-29) | Its header states the boundary rule: *"if going green would require deleting correct text, the literal does not belong in this file."* |
| Element-level vacuity | four `if (n === 0) continue;` checks | one shared floor (§D-2) | `.continue-here.md`: *"Fixing them one at a time, four times, would repeat the mistake."* |
| Sentence tokenization | an NLP library or a tokenizer package | `split()` + a small regex, stdlib only | Zero-runtime-dependency contract. Also avoids the catastrophic-backtracking risk (§F-2). |
| An STE conformance checker | anything claiming conformance | the named decidable subset only | Conformance is not mechanically decidable; ASD/STEMG publish that no tool is endorsed or certified (§C-3). |
| The ASD dictionary | vendoring ~900 approved words | grugops's own 43-verb list, derived from its own corpus (§B-2) | §C-2. The official PDF forbids text extraction outright. |

**Key insight:** every "don't hand-roll" here is a *second authority over bytes a first authority
already owns*. That is the single defect class this milestone exists to eliminate, and this phase ships
four guards over corpora that three existing modules already derive.

## Common Pitfalls

### Pitfall 1: the RED transcript that proves nothing

**What goes wrong:** LANG-06's *"fails RED on all 17 blocks"* is captured, the guard turns green after
the rewrite, and everyone believes the conjunction is wired.
**Why:** both arms fail 17/17 **independently** at every N from 1 to 4 (§B-1). A guard shipping `||`
instead of `&&`, or missing an arm entirely, produces a byte-identical transcript.
**Avoid:** three discriminating fixtures — positive-pass/negative-fail, negative-pass/positive-fail,
and a both-pass false-red control (§B-1).
**Warning sign:** the RED evidence is a single 17-line transcript with no fixture file beside it.

### Pitfall 2: the uniqueness guard that lands green

**What goes wrong:** D-20 is implemented on exact sentence equality; it finds 2 duplicates in 17 files
and passes on `software-engineer.md`.
**Why:** the four restatements differ by an article and a clause boundary (§B-3).
**Avoid:** clause-level segmentation, articles and leading `you` dropped (Variant C) — verified to
reproduce CONTEXT.md's four-times measurement exactly.
**Warning sign:** the guard's first run finds fewer than 9 files with duplicates.

### Pitfall 3: the byte ceiling that cannot be met

**What goes wrong:** D-30's sentence is added across all 17 roles in one plan; `security-nfr.md` goes
red; the table looks like the obvious fix.
**Why:** 8 roles are already above WARN and `security-nfr.md` has 75 bytes to FAIL (§A-1, §A-1b).
**Avoid:** remove before add, per role, with the budget tracked in each plan's own verification. D-26
allows only trim or split.
**Warning sign:** a plan that adds text to roles without a per-role before/after byte table.

### Pitfall 4: the generated ASVS checklist gets style-rewritten

**What goes wrong:** D-18's "full corpus" is read as `agent-factory/checklists/*.md`; 345 verbatim
OWASP rows get reworded.
**Why:** the file is 82% of the directory by bytes and carries no obvious signal beyond an HTML comment.
**Avoid:** derive the exclusion from the `GENERATED` marker with a two-sided cardinality assertion (§A-2).
**Warning sign:** the guard's denominator for checklists is 14 rather than 13, or its bullet count is
451 rather than 106.

### Pitfall 5: the freshness cascade fires three gates at once

**What goes wrong:** `## One job` is rewritten; `freshness:adapters`, `freshness:skill-twins` and
`freshness:catalog` all go red in CI after the commit lands.
**Why:** all three derive from that sentence (§F-4), and 15 of 17 exceed the 20-word limit so all three
**will** change.
**Avoid:** regenerate and commit in the same commit; verify locally with the six-command block in §F-4.
**Warning sign:** a role-prose commit whose diff touches no file under `.claude/agents/`.

### Pitfall 6: `guard_voice` reds on correct clear-voice text

**What goes wrong:** the lexicon adds a word that also appears in the kit's clear-voice prose.
**Why:** `guard_voice` scans the fence remainder for `VOICE_MARKERS`; `neutralizePhrases()` only
exempts three brand phrasings (§F-5).
**Avoid:** before committing the lexicon, grep the stripped remainder of all 17 roles plus the two
`SEC_VOICE_FILES` for every candidate token. `good`, `bad`, `rock`, `club` are the risky ones — the
§B-1 proposal excludes `good`/`bad`/`ugly` for this reason.
**Warning sign:** `guard_voice` fails on a file whose caveman block was not touched.

### Pitfall 7: the banned-claim guard is born green and stays unproven

**What goes wrong:** D-29's check lands after the profile document is already clean; it has never
caught anything.
**Why:** `ASD-STE100` appears in zero kit files today (§B-4).
**Avoid:** the four-step sequence in §D-3 — author the claim, land the guard RED, remove the claim,
**keep a planted fixture**.
**Warning sign:** the guard has no hermetic-mirror test with the claim restored.

## Code Examples

### Reading the caveman fence — the single authority (D-22/D-23)

```ts
// scripts/voice-model.ts
// Source: shape established by scripts/frontmatter.ts's D-64 canonical-form reader (Phase 27).
// Strictly declarative + node:fs only. Zero npm dependencies.

const HEADING = /^## Caveman prompt/;
const FENCE = /^```/;

export function readCavemanFence(text: string): FenceRead {
  const lines = text.split("\n");

  // (1) CARDINALITY FIRST. Two headings is `multiple` — today stripCavemanBlock strips BOTH
  //     blocks while extractCavemanBlock `break`s at the first close and never sees the second.
  //     Measured divergence, 29-RESEARCH §A-6. One refusal, both consumers.
  const headings = lines.reduce<number[]>((a, l, i) => (HEADING.test(l) ? [...a, i] : a), []);
  if (headings.length === 0) return { ok: false, reason: "missing" };
  if (headings.length > 1) return { ok: false, reason: "multiple" };

  // (2) EXACTLY TWO fence lines after the heading. Fewer is `unterminated` — the arm where the
  //     two current readers give OPPOSITE verdicts on identical bytes.
  const start = headings[0];
  const fences: number[] = [];
  for (let i = start + 1; i < lines.length; i++) if (FENCE.test(lines[i])) fences.push(i);
  if (fences.length < 2) return { ok: false, reason: "unterminated" };

  const [open, close] = fences;
  return {
    ok: true,
    inside: lines.slice(open + 1, close).join("\n"),
    outside: [...lines.slice(0, start), ...lines.slice(close + 1)].join("\n"),
  };
}
```

### Consuming it exhaustively (both guards, identically)

```ts
// Source: the compiler-checked never-branch established by Phase 27 D-44.
const read = readCavemanFence(readText(f));
if (!read.ok) {
  switch (read.reason) {
    case "missing":      findings.push(`${f}: no \`## Caveman prompt\` section`); break;
    case "unterminated": findings.push(`${f}: unterminated caveman fence — block not readable`); break;
    case "multiple":     findings.push(`${f}: more than one \`## Caveman prompt\` heading`); break;
    default: { const _never: never = read.reason; void _never; }  // a 4th reason = compile error
  }
  continue;   // `visited` is still incremented above; see the vacuity floor
}
```

### The imperative-position check, section-scoped (D-12)

```ts
// scripts/check-imperative-lexicon.ts
// Scope: `## Steps` bullets ONLY. 29-RESEARCH §A-3 measured that `## Inputs required` (67
// bullets) and `## Stop conditions` (38) are noun phrases and conditionals BY DESIGN — 72
// correct bullets an unscoped check would red, whose only route back to green is weakening
// the rule. That is the heuristic-strict-subset shape D-03 and D-15 both refuse.
const STEP_SECTION = "Steps";
const BULLET = /^\s*(?:\d+[.)]|[-*+])\s+(.*)$/;

function firstWordOf(bullet: string): string {
  // Leading markup is stripped, NOT tolerated: a leading `**` bold label is itself a
  // violation (41 of 125 bullets today), reported separately from an unapproved verb.
  return bullet.replace(/^[^A-Za-z]+/, "").split(/[\s.,;:—–(/]/)[0] ?? "";
}
```

## State of the Art

| Old approach | Current approach | When changed | Impact here |
|---|---|---|---|
| ASD-STE100 Issue 8 | **Issue 9, 53 writing rules in 9 sections, ~900 approved words** | **2025-01-15** | Cite Issue 9 and the number **53** in the profile. Not "~65". |
| `guard_caveman_preserved`: `>=2 ^You OR >=1 idiom` | two-sided lexicon + banned-construction predicate | this phase (D-06/D-07) | The `^You` arm is deleted; measured, it is carrying all 17 passes alone. |
| Two fence state machines | one `voice-model.ts` authority with a verdict | this phase (D-22/D-23) | Closes a live divergence on 2 of 3 malformed forms. |
| Hand-maintained scan sets | derive the set, assert the count | Phase 27 (KIT-01/KIT-02) | Every new set in this phase follows suit or carries a written justification. |
| Static handoff packets | shared verified context | Phase 24 | **Six kit files still carry the retired vocabulary** (§A-2) — outside Phase 28's audited surface. |

**Deprecated / outdated in this repo:**

- `stripCavemanBlock` and `extractCavemanBlock` — both superseded by `voice-model.ts`. **Delete both**;
  leaving either is the two-grammar defect (§F-5.1).
- `VOICE_MARKERS` as the caveman predicate — measured dead (0/17 matches). It survives only as
  `guard_voice`'s negative scan over the clear-voice remainder, where it is still correct.
- `- handoff written` (`definition-of-done.md:16`) and `handoffs complete`
  (`seed/plans/board.md:64`) — v1.x artifacts required by a shipped checklist and a shipped board
  template.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | everything | ✓ | v22+ (CI pins Node 22; `.github/workflows/ci.yml:40`) | — |
| `npm ci` dev deps (`typescript`, `vitest`, `@types/node`) | build + test | ✓ | already in `package.json` | — |
| `git` | D-05 diff-disposition gate | ✓ | repo is a git checkout | **none — the D-05 gate is unimplementable without it.** It is the only new gate whose input is `git diff` rather than the filesystem. |
| `pdftotext` | reading the ASD spec | ✓ installed | poppler | **blocked by the document itself** — `Permission Error: Copying of text from this document is not allowed.` Do not circumvent (§C-2). |
| `tokei` | `npm run count:lines` | not checked | — | cosmetic; not used by any gate |

**Missing dependencies with no fallback:** none blocking.
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test framework

| Property | Value |
|---|---|
| Framework | Vitest `~4.1.8` |
| Config file | `vitest.config.ts` (dev-only, no committed `.js` twin — correct) |
| Quick run command | `npx vitest run scripts/<name>.test.ts` |
| Full suite command | **`npx vitest run --exclude '**/scripts/e2e/**'`** — never bare `npm test` (§F-1) |
| Current baseline | 46 test files · 1,561 passed · 2 skipped (from `.continue-here.md`) |

### Phase requirements → test map

| Req | Behavior | Test type | Automated command | Exists? |
|---|---|---|---|---|
| LANG-01 | profile document exists, carries the disclaimer, vendors no dictionary | unit | `npx vitest run scripts/check-banned-claims.test.ts` | ❌ Wave 0 |
| LANG-02 | governed corpus derived at 47 files; generated file excluded; caveman fence untouched | unit | `npx vitest run scripts/check-imperative-lexicon.test.ts` | ❌ Wave 0 |
| LANG-03 | frozen sources derived from all three D-01 sources; RED absent companion edit | unit + fixture | `npx vitest run scripts/check-diff-disposition.test.ts` | ❌ Wave 0 |
| LANG-04 | guard named for its subset; zero conformance claims in the kit | unit + **planted fixture** | `npx vitest run scripts/check-banned-claims.test.ts` | ❌ Wave 0 |
| LANG-05 | no duplicate normalized clause within a role file | unit | `npx vitest run scripts/check-foundation-guards.test.ts -t uniqueness` | ⚠️ extend existing |
| LANG-06 | RED on 17/17 + **3 discriminating fixtures** (§B-1) | unit + fixture | `npx vitest run scripts/voice-model.test.ts` | ❌ Wave 0 |
| LANG-07 | one fence reader; all three malformed forms refuse identically in both consumers | unit + **parser-oracle sweep** | `npx vitest run scripts/voice-model.test.ts -t fence` | ❌ Wave 0 |
| LANG-08 | every role ≤ its previous ceiling; delta recorded | one-shot transcript (D-27) | `node scripts/check-foundation-guards.js` + the SUMMARY transcript | ✓ guard exists |

### Sampling rate

- **Per task commit:** `npx vitest run scripts/<file-touched>.test.ts` + `node scripts/check-foundation-guards.js`
- **Per wave merge:** `npm run build && npm run typecheck && npm run freshness && npx vitest run --exclude '**/scripts/e2e/**'` + all six freshness gates
- **Phase gate:** the full ubuntu CI block (`ci.yml:78-228`) green before `/gsd-verify-work`

### Wave 0 gaps

- [ ] `scripts/voice-model.ts` + `scripts/voice-model.test.ts` — LANG-06, LANG-07
- [ ] `scripts/check-imperative-lexicon.ts` + `.test.ts` — LANG-02, LANG-04
- [ ] `scripts/check-banned-claims.ts` + `.test.ts` — LANG-04
- [ ] `scripts/check-diff-disposition.ts` + `.test.ts` — LANG-03
- [ ] shared element-level vacuity module + tests — AP-1 (blocking)
- [ ] extend `scripts/check-foundation-guards.test.ts` for the two new in-aggregator guards
- [ ] `kit-model.ts`: `listRoleDisplayNames()` / `listWorkflowDisplayNames()` + count assertions
- [ ] fixture corpus: 3 voice-discrimination blocks, 3 malformed-fence forms, 1 planted banned claim

*(Framework install: none needed.)*

## Security Domain

`security_enforcement` is on for this project. This phase writes **no code that handles input, auth,
crypto, or network** — four read-only guards and a prose rewrite. The ASVS mapping is therefore short,
but two rows are real and one is unusual.

### Applicable ASVS categories

| Category | Applies | Standard control |
|---|---|---|
| V2 Authentication | no | no auth surface |
| V3 Session Management | no | no sessions |
| V4 Access Control | no | no access-control surface |
| **V5 Input Validation** | **yes** | The four guards parse untrusted-shaped markdown. Controls: **canonical form + refuse** (D-23) rather than lenient parsing; **no `eval`, no dynamic `RegExp` built from file content**; bounded regex with no nested quantifiers (§F-2 — a catastrophic-backtracking regex over a 90 KB file is a denial-of-service on this project's own CI, which has happened here before at 0.47 s → 383 s). |
| V6 Cryptography | no | none introduced |
| **V14 Configuration** | **yes** | Every new `.ts` ships a committed `.js` under the freshness gate; a drifted twin is the supply-chain shape the gate exists for. New gates must be **wired at both ends** or they are configuration that does not run (§A-7). |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| Catastrophic regex backtracking on a large corpus file | Denial of Service | `split()` over match-all; no nested quantifiers; time the guard against `05-pr-quality-gate.md` (13,831 B) and record it |
| A gate printing PASS for an unperformed check | **Repudiation** (the trail asserts something false) | the shared element-level vacuity floor (§D-2) — AP-1, severity `blocking` |
| A guard authored but never invoked | Repudiation | wire at both ends; `freshness:adapters` precedent (`ci.yml:81-84`) |
| Committed `.js` drifting from its `.ts` | Tampering | `npm run freshness` — 43 pairs, going to 46 |
| A hand-edited generated adapter | Tampering | `freshness:adapters` byte gate; unchanged by this phase but exercised by it (§F-4) |
| Widening a scan set to reach green | Tampering with the evidence | two-sided cardinality pins on every derived set |

**Not a vulnerability, but a compliance obligation this phase creates:** the profile document makes
public claims about a third-party standard. D-33 registers them; §C supplies the wording that keeps
them true. An overstated conformance claim is the `no fabrication` violation this project treats as its
most serious defect class.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | The exact ASD-STE100 reproduction notice ("no reproduction or publication of it, in whole or in part…") is quoted from a secondary source; the primary PDF forbids text extraction | §C-2 | Low. Every recommendation is *more* conservative than the quoted terms require — the profile vendors nothing and claims nothing. If the terms are looser, nothing needs changing. |
| A2 | `ASD-STE100` is EU trademark No. 017966390 | §C-2 | Low. Sourced from a third-party README. **Verify against EUIPO before the profile document states a registration number**, or omit the number and say "a registered trademark of ASD". |
| A3 | The ≤51 "bare imperative" count in `## Steps` is an upper bound; the true count is lower | §A-4 | Low. Stated as a bound, not a figure. The rewrite estimate (≥74 of 125) is correspondingly a lower bound — the work is at least this large, possibly larger. |
| A4 | A D-30 when-absent sentence costs ~110 bytes | §A-1b | **Medium.** The whole budget table scales with it. `security-nfr.md` fails at ≥75 B, so it fails for any plausible sentence. **The planner must re-run the budget with the actual authored sentence.** |
| A5 | The prohibition-token set used in §A-9 (`never`, `must not`, `do not`, `stop`, `refuse`, `without`) approximates D-19's "prohibition" | §A-9 | Low for the *shape* (prohibitions are spread across four sections — unambiguous), medium for the absolute counts. Do not quote the counts as the guard's expected finding count. |
| A6 | `guard_voice` must migrate to `voice-model.ts` in the same plan as the rebuilt voice guard | §F-5 | Low — this is a reading of D-22/LANG-07, not a new decision. But if split across plans, the intermediate commit ships two grammars, which is the state the phase exists to end. |
| A7 | The 4,036-byte figure in C-28-003 was measured including heading and fence lines | §A-5 | Low. Either way the figure does not match any current measurement and needs correcting; the explanation is offered, not relied on. |

## Open Questions

1. **Does D-14 ship a 25-word descriptive limit alongside the 20-word procedural one?**
   - Known: STE's published guidance is 20 procedural / 25 descriptive; D-14 ships only 20.
   - Unclear: whether one undifferentiated 20-word limit over 27.8% of the corpus is intended, or an
     artifact of not distinguishing sentence kinds.
   - Recommendation: raise at plan time. Distinguishing them is more faithful to the derivation and
     materially smaller to conform.

2. **Is the caveman block's `You are <Role>.` opener rewritten, or exempted?**
   - Known: the copula ban makes it illegal in 16 of 17 blocks; D-07 states "zero banned
     constructions" with no exemption.
   - Recommendation: rewrite it (`You <Role>.`). An exemption is a named carve-out in a predicate whose
     weakest arm already dominates — the D-06 shape.

3. **Does the D-18 corpus include `agent-factory/README.md`, `_commit-convention.md`, `packaging/*` and `config/factory.config.md`?**
   - Known: D-18 names "19 workflows plus the checklists directory plus the shipped templates". Those
     four are 48+ KB of procedural prose that fit none of the three names cleanly.
   - Recommendation: decide explicitly at plan time and derive the answer, rather than let the
     guard's scan set answer it by omission.

4. **Are `guard_imperative_lexicon` (D-12) and the sentence-form rules (D-14) one guard or two?**
   - Known: LANG-04 requires naming for the decidable subset; three unrelated predicates under one
     name recreates the problem at the output line.
   - Recommendation: two names, one module. Cheap now, expensive later.

## Sources

### Primary (HIGH confidence)

- **The repository itself**, read this session: `scripts/check-foundation-guards.ts` (:313-321,
  :1856-2148), `scripts/kit-model.ts`, `scripts/check-kit-refs.ts` (:54-68),
  `scripts/dead-vocabulary.ts`, `scripts/check-public-docs-vocabulary.ts`,
  `scripts/check-uat-oracles.ts` (:336-358), `scripts/generate-role-adapters.ts` (:270-286),
  `scripts/generate-catalog.ts` (:133-138), `scripts/validate-agent-factory.ts` (:203-210),
  `.github/workflows/ci.yml` (:70-228), `package.json`, `NOTICE`, `README.md`,
  `docs/audit/28-claim-registry.md`, `docs/audit/28-safety-surface-exclusions.md`,
  `.planning/phases/28-kit-consistency-audit/.continue-here.md`
- **Measurements run this session** — five scratchpad Node scripts + ~20 shell commands, each recorded
  beside its result. Repository not modified.
- `asd-ste100.org/about_STE.html` — 53 writing rules in 9 sections; ASD ownership; company-defined
  Technical Names/Verbs are permitted
- `asd-ste100.org/STE_faq.html` — ~900 approved words; free PDF distribution; *"ASD and the STEMG DO
  NOT endorse or certify any company, organization, or individual…"*
- `asd-ste100.org/STEsoftware.html` — *"ASD and STEMG do not endorse, certify, or authorize any
  software tools, including AI-based ones. Providers of such tools cannot claim ASD approval or use
  the ASD logo, copyright, or trademark…"*
- **Direct observation:** `pdftotext` on the official Issue 9 PDF returns
  `Permission Error: Copying of text from this document is not allowed.`

### Secondary (MEDIUM confidence)

- `en.wikipedia.org/wiki/Simplified_Technical_English` — two-part structure; Issue 9 dated 2025-01
- `techscribe.co.uk/techw/asd-simplified-technical-english.htm` — rules/dictionary split
- `github.com/nuelcyoung/asd-ste100` — a working third-party disclaimer wording pattern; the EU
  trademark number (unverified)
- Secondary quotation of the ASD-STE100 reproduction notice — **`UNKNOWN - verify`** on exact current
  wording (primary source forbids extraction)

### Tertiary (LOW confidence — recorded, not relied upon)

- `instrktiv.com/en/simplified-technical-english/` — the "up to 40% reduced word count" claim.
  Commercial STE consultancy; studies unidentified; mechanism described is content omission, not
  re-expression. **Cited only to record that it exists and runs opposite to the project's honesty
  floor. Do not use as support for anything.**

### In-repo prior research (context, not authority)

`.planning/research/{FEATURES,PITFALLS,STACK,SUMMARY}.md` — the pre-milestone research. Its `guard_ste`
naming warning (`PITFALLS.md:325`) and its no-vendoring conclusion (`SUMMARY.md:31`) are both
independently confirmed above.

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Tree measurement (§A) | **HIGH** | Every number produced by a recorded command. Every CONTEXT.md measured claim independently reproduced and confirmed. |
| Discretion resolutions (§B) | **HIGH** | All four tested against the real tree, not proposed. B-1 and B-3 include the negative result that changes the design. |
| ASD-STE100 rule structure (§C-1, C-4) | **HIGH** | Direct from the standard's own site, twice, consistently. |
| ASD-STE100 IP boundary (§C-2) | **MEDIUM** | Publisher's technical measure observed first-hand; exact notice wording is second-hand and marked `UNKNOWN - verify`. Every recommendation is conservative relative to it. |
| Disclaimer wording (§C-3) | **HIGH** | ASD/STEMG publish the constraint directly; the project's own `NOTICE` supplies a matching house pattern. |
| Token-count direction (§C-5) | **LOW / `UNKNOWN - verify`** | No evidence located in either direction. In-repo article-density measurement is HIGH; the inference from it is stated as measurement, not as a claim. |
| AP-1 mechanism (§D) | **HIGH** for the diagnosis (source read, `.continue-here.md` read); **MEDIUM** for the proposed API, which is a design recommendation the planner should review. |
| Guard placement (§E) | **HIGH** — both wiring shapes measured line-by-line against existing gates. |
| Risks (§F) | **HIGH** — each landmine re-checked against the current tree; two (STATE.md escaping, BSD grep) found **dormant** and said so. |

**Research date:** 2026-08-13
**Valid until:** 2026-09-12 (30 days). The in-repo measurements go stale the moment Phase 29's first
plan lands — **re-measure the byte table (§A-1b) before the D-26 re-baseline plan**, which is exactly
what D-27's one-shot transcript requires.

# Phase 29: Controlled Language & Voice Guard Rebuild - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Procedural and agent-written prose follows one enumerated writing profile, so two agents reading
the same instruction reach the same act. The caveman voice lives in exactly one fenced block per
role and is measured as **voice**, not as sentence shape.

**In scope:** the grugops-authored ASD-STE100-*derived* writing profile and its lexicon; the
profile applied to the kit's procedural surfaces; a controlled-language guard named for its
decidable subset; the rebuilt voice guard; role-skeleton de-duplication; one caveman-fence
authority; a single end-of-phase byte-ceiling re-baseline; and the three claim-registry findings
Phase 28 deferred to this phase.

**Out of scope:** the autonomy matrix (Phase 30), the board projector (later), any change to the
shared-context substrate, the queue, or the §14 gate. No new runtime dependency. No claim of
ASD-STE100 conformance, no token-economy claim, no LLM-comprehension claim.

**Honesty floor carried from ROADMAP.md:** STE likely *increases* token count — its rules forbid
the telegraphic omission caveman relies on. The profile is justified on determinism and
one-term-per-concept grounds only. Caveman-as-token-economy is disproven on this artifact and
must not be restated.

</domain>

<decisions>
## Implementation Decisions

### Safety-surface exclusion — how a per-FILE list becomes a per-SENTENCE rule (LANG-02, LANG-03)

**The collision this phase opens with.** `docs/audit/28-safety-surface-exclusions.md` lists 41
files and states that no text in a listed file is reworded by a style pass. Those 41 files are
all 17 roles, all 19 workflows, and the 4 public documents — exactly the corpus LANG-02 tells the
profile to govern. Read literally, this phase may reword nothing. Phase 28 named the limit itself
rather than manufacturing variance: the flag is per FILE, and the question LANG-02 actually faces
is which SENTENCES are load-bearing, a granularity that column cannot express.

- **D-01:** The frozen set is **derived from gates that already exist**, never authored as a list
  of protected sentences. Three sources: (a) the 38 claim-registry verbatim anchors, already
  byte-compared live by `scripts/check-claim-anchors.ts`; (b) structural sections located by
  heading — role `## Hard limits`, workflow `## Stop conditions` and `## Commit` — derived through
  `scripts/kit-model.ts`; (c) positive guard literals, meaning wording a guard requires to be
  present (`oracleWr05Wording`'s tier announcement, `guard_adapter_body`'s shared-context memory
  sentence, the `UNKNOWN - verify` token). A hand-written "sentences you may not touch" file is
  the set-literal drift class this milestone exists to eliminate, and is refused.
  — **Reversibility:** costly — undoing means re-deriving the frozen set from a different source
  after the rewrite has already landed against it, with no record of which sentences were frozen
  at the time each edit was judged.

- **D-02:** Safety sections are **not** exempt from the profile. They receive it **deliberately**
  — one file at a time, each change dispositioned — rather than by a bulk style pass. Freezing
  them outright was rejected because it would leave the kit's most safety-critical prose as its
  least controlled text, which inverts LANG-02 at exactly the point where two agents most need to
  reach the same act.

- **D-03:** Rejected: splitting by a derived "permission-bearing sentence" heuristic (a sentence
  containing `never`, `must not`, `stop`, `refuse`, `do not`). It is decidable and list-free, but
  it is a heuristic detector that is a strict subset of the real predicate — the shape that cost
  this project three separate 8-round closures. Recorded so a later phase does not re-propose it
  as an optimisation.

- **D-04:** The frozen sources are **hard RED with no override**. This does NOT mean the bytes
  never change; it means **no kit text changes alone**. A changed sentence intersecting source (a)
  requires its registry row updated in the same commit — Phase 28's D-25 precedent, whose
  bijection gate already catches a missed flip. Source (c) requires the guard's literal updated in
  the same commit. Source (b) requires its disposition row in the same commit. There is no
  "record it later" and no blanket exemption.
  — **Reversibility:** costly — adding an override tier after the fact means auditing every change
  already admitted under the strict rule to see which would have taken the hatch.

- **D-05:** The enforcement inverts the problem: rather than enumerate what is protected, the gate
  **enumerates what changed and requires each change to be dispositioned**. It computes changed
  normalized sentences from the diff, fails RED on any intersection with D-01's three sources
  absent the same-commit companion edit, and requires a disposition row for every other changed
  sentence. Neither side can go stale — one is derived from the filesystem, the other from git.

### Voice measurement — the rebuilt guard (LANG-06)

**Measured this session, against the tree at HEAD.** 18 role files exist; **17** carry a
`## Caveman prompt` block (`_role-switch-protocol.md` has none, correctly). Every one of the 17
blocks contains **zero** occurrences of `grug`. Each has 4–15 `^You` lines. `VOICE_MARKERS` match
count across all 17 blocks: **0**. So `guard_caveman_preserved`'s `>=2 ^You OR >=1 idiom`
predicate is passing **entirely on the `^You` arm**, in all 17 cases, with the idiom arm dead.

- **D-06:** The `^You` arm is **deleted, not supplemented.** It is a strict superset of anything
  that could fail — any second-person imperative English satisfies it, which is what plain English
  is. Adding a third arm to a predicate whose weakest arm already dominates is the failure this
  milestone is correcting, not a fix for it.
  — **Reversibility:** reversible.

- **D-07:** The rebuilt guard is **two-sided and both sides must hold**: (positive) at least N
  tokens from a committed caveman lexicon, and (negative) zero banned constructions — articles,
  copulas, modals, subordinators. The positive side alone is gameable by sprinkling one token per
  block, which is the current defect one level up. The negative side is what actually forces
  voice, because caveman voice *is* telegraphic, article-dropping, short-clause English: it makes
  "plain second-person English carrying a `grug`" fail.

- **D-08:** The PASS line carries the **measurement**, not an assertion. Today it prints
  `all 17 roles keep a non-empty markered caveman prompt block` — a claim unfalsifiable from the
  output, and the AP-1 shape Phase 28 recorded as blocking. It must print, per block,
  `tokens N / content words M, banned K`, plus the 17/17 count. A vacuous run then prints zero rows
  and fails its own count assertion, so the collection-level floor and the element-level floor are
  the same floor. This also satisfies the roadmap's "publishes a number with a denominator"
  directly, rather than as a separate reporting feature.

- **D-09:** The caveman block carries **identity and attitude only**. It never states a fact that
  is not stated once, in clear voice, elsewhere in the same file. This makes it safe for the blocks
  to become maximally grug while honouring `CLAUDE.md`'s rule that the joke never replaces the
  explanation, and it settles the de-duplication question: the caveman block is the section that
  **gives up** its content, not the one that keeps it.
  — **Reversibility:** costly — reversing it means re-deciding, per role, which facts moved out and
  putting them back, after the byte ceilings have been re-baselined against the smaller files.

- **D-10:** Rejected: a tokens-per-content-word **ratio** with a threshold. It produces a
  denominator naturally but hides two independent properties behind one tunable number, and a
  threshold on a ratio can be tuned to green.

### Controlled-language guard — the decidable subset (LANG-01, LANG-04)

- **D-11:** The guard is **renamed off `guard_ste`**. LANG-04 requires it be named for its
  decidable subset and never presented as enforcing ASD-STE100 conformance — and `STE` *is*
  Simplified Technical English, so the placeholder name is itself the claim the requirement
  forbids, at every call site and in every gate output line. `guard_procedural_prose` or
  `guard_imperative_lexicon` are the candidates. **This requires editing LANG-04 and LANG-07 in
  `.planning/REQUIREMENTS.md` and the Phase 29 entry in `.planning/ROADMAP.md`**, which name
  `guard_ste`. Do that edit explicitly rather than letting the name and the requirement disagree.

- **D-12:** Lexicon membership means a **closed approved-VERB list checked only at imperative
  position** — the first word of a procedural step or bullet — not a general approved-word
  dictionary. STE's determinism win comes overwhelmingly from one verb / one meaning, and
  procedural steps are imperatives. A full approved-word dictionary over the governed corpus is
  hundreds of hand-authored words and is set-literal drift by construction.
  — **Reversibility:** costly — widening to a full dictionary later means re-checking every
  already-conformed sentence against the wider set.

- **D-13:** The project **Technical Names and Verbs set required by LANG-01 is DERIVED, not
  listed**: role names from `kit-model.listRoles()`, workflow names from `listWorkflows()`, config
  keys from `factory.config.json`, note kinds from the context-note contract, board columns from
  the seed board. This makes the project-specific half of the lexicon unable to go stale, exactly
  as KIT-01 and KIT-02 did for the scan sets.

- **D-14:** Banned constructions that ship: modals of obligation in a procedural step
  (`should`, `may`, `might`, `could`); bare demonstrative as subject (`it`, `this`, `that` with no
  in-sentence antecedent); `and/or`; and more than one instruction per sentence (no `and`-chained
  imperatives). Sentence length ships at 20 words for procedural sentences. All are decidable with
  no tuning.

- **D-15:** **Passive voice is deliberately NOT banned.** It reads like the obvious STE rule, but
  the kit's own correct prose is saturated with it — "is derived", "is enforced", "is pinned" — so
  a passive check reds large volumes of accurate text and the only route back to green is tuning
  the detector. That is the heuristic-strict-subset shape this project has closed three times at
  8 rounds each. Recorded with its reason so a later phase does not add it as an obvious omission.

- **D-16:** **Surface split, stated in the claim rather than implied.** LANG-02 names six surfaces;
  three of them — shared-context notes, board, traceability — are runtime artifacts agents write,
  which do not exist at build time in this repo. The guard is therefore a **build-time gate over
  kit files**: workflow steps, checklists, and the note / board / trace **templates** the kit
  ships. Runtime-written instances carry the profile as **instruction** via Workflow 16. The
  profile's own claim must state this split explicitly; claiming the guard governs notes an agent
  writes at runtime would be the overstated-claim class Phase 28 registered 38 of.

- **D-17:** Rejected: extending `scripts/context-io.ts` to check the profile when a note is
  written. It genuinely covers the runtime surfaces, but it puts a style predicate inside the
  sanctioned write path — a safety surface on the verify-before-write seam that Phase 21 built.

- **D-18:** **Full corpus this phase.** The guard lands blocking over the whole derived corpus —
  19 workflows plus the checklists directory (count derived, never hand-tallied) plus the shipped
  templates — and the conforming rewrite makes it green within this phase. A narrower initial scan
  set widened later is how scan sets go stale. This makes Phase 29 large; see Sizing below.

### Role skeleton de-duplication (LANG-05)

**Measured on `agent-factory/roles/software-engineer.md`:** "stop if scope grows or the
architecture must change" appears **four times** — `## One job`, the caveman block,
`## Responsibilities` #4, and `## Hard limits`. The implement / small-diff / tests / checks / docs
content appears three times.

- **D-19:** Section ownership is fixed as the canonical role skeleton:

  | section | owns | must not contain |
  |---|---|---|
  | `## One job` | **what** — one sentence, the canonical statement | how, when, limits |
  | `## Caveman prompt` | identity and attitude | anything factual (D-09) |
  | `## Responsibilities` | **how** — numbered steps and rationale | the what, the limits |
  | `## Hard limits` | boundaries and refusals — the **only** place a prohibition appears | the what, the how |

  `## One job` loses its trailing "You stop if…" clause and `## Responsibilities` #4 disappears.
  `## Activates when` is unchanged: it is verbatim the Orchestrator's routing-matrix row and the
  adapter `description`, so that repetition is single-sourcing across files, not redundancy within
  one.
  — **Reversibility:** costly — the split propagates into 17 rewritten files, the byte-ceiling
  re-baseline measured against them, and area-1's structural-section freeze, which only becomes
  meaningful once `## Hard limits` is genuinely the sole permission surface.

- **D-20:** De-duplication is **enforced by a guard**, not applied as a one-time pass: no
  normalized sentence repeats **within** a role file. A one-time pass is a one-time act, and this
  project's record is that one-time acts drift back while the suite stays green — the voice itself
  drifted out over a full milestone under a passing guard.

- **D-21:** The uniqueness check is **intra-file only**. The Workflow 16, compaction, and
  `AGENTS.md` pointer sentences are byte-identical **across** files on purpose; a cross-file check
  would fail on correct single-sourcing. Recorded because "surely it should be repo-wide" is the
  natural next edit.

### One fence authority (LANG-07)

**A live divergence, read this session, not hypothesised.** `stripCavemanBlock` emits
`__UNCLOSED_CAVEMAN_FENCE__` on an unterminated fence, so `guard_voice` fails RED naming the file.
`extractCavemanBlock` has **no such sentinel** — on the same malformed input its loop simply ends
and it returns the entire file tail *as the caveman block*, which `guard_caveman_preserved` then
passes. Same bytes, two grammars, opposite verdicts on malformed input. This is the Phase 22
CMP-02 lesson verbatim, sitting unfixed in the file this phase rewrites.

- **D-22:** A new module `scripts/voice-model.ts` is the single authority. It owns one caveman-fence
  reader and the lexicon sets (caveman lexicon, banned constructions, approved verbs, plus the
  D-13 derived Technical Names). Both guards import from it and neither holds a literal inline —
  the `scripts/dead-vocabulary.ts` pattern, which is this project's established and working shape.
  — **Reversibility:** reversible.

- **D-23:** The reader returns **both sides plus a verdict** — `{ok: true, inside, outside}` or
  `{ok: false, reason: "missing" | "unterminated" | "multiple"}` — so a malformed fence is ONE
  refusal both guards see identically. This is D-64's canonical-form move that finally closed
  Phase 27: enumerate the legal form and refuse everything outside it, rather than let each
  consumer improvise. `multiple` is load-bearing: today a second `## Caveman prompt` heading
  re-triggers one reader and is ignored by the other.

- **D-24:** `voice-model.ts` **composes** `scripts/frontmatter.ts`'s `stripFencedBlocks` where a
  generic strip is what is wanted, and does not re-implement it. The caveman fence is
  *section-anchored* (`## Caveman prompt`, then the first two fence lines), a genuinely different
  grammar — so this is one new authority for one predicate, not a fourth duplicate. Extending
  `stripFencedBlocks` itself was rejected: it would make one authority serve two predicates.

### Byte ceilings (LANG-08)

- **D-25:** `roleCeiling()` in `scripts/check-foundation-guards.ts` stays a **hand-maintained
  switch table**. D-17 of Phase 27 explicitly forbids deriving it, with a reason that still holds:
  it is a per-file measurement baseline, not a discovery set, and it already fails closed on an
  unknown role, so deriving it would convert a fail-closed table into a silently-widening one.

- **D-26:** The re-baseline happens **once, in a dedicated final plan**: measure every role, assert
  new ≤ old for all 17, edit the table once, record the delta. Mid-phase the ceilings are
  untouched, and a RED ceiling means **trim or split, never edit the table**. This must be a
  plan-level rule the executor cannot rationalize around, because "the rewrite legitimately needed
  the bytes" is a persuasive-sounding reason to raise one.
  — **Reversibility:** one-way — once the table is edited and the phase closes, the previous
  baseline exists only in git history and the SUMMARY transcript; a later phase cannot re-derive
  what the pre-rewrite measurement was.

- **D-27:** "No ceiling rose" is proven by a **one-shot measured before/after transcript in the
  re-baseline plan's SUMMARY**, compared against the git-previous table — not by a permanent test
  fixture pinning old values, which would be a second place to edit. This follows the precedent
  Phase 27's plan-check set (W2): when the "before" build stops existing once the edit lands, a
  one-shot transcript is the honest control.

- **D-28:** **No byte ceilings are added for workflows or checklists.** Unlike `AGENTS.md`, which
  has a real external cap (Codex's 32 KiB `project_doc_max_bytes`), nothing forces one here, and
  19+ new hand-measured baselines is new set-literal surface LANG-08 does not ask for. The profile
  is expected to grow these files (STE forbids telegraphic omission); **measure that growth and
  record it** so a later phase decides on evidence rather than on a guess. Rejected: a single
  aggregate corpus budget, which lets one file balloon while others shrink — the failure per-file
  ceilings exist to prevent.

### Claims and the three Phase 28 deferrals

- **D-29:** LANG-04's "nowhere in the kit is conformance claimed" is made **mechanical** by a
  banned-claim check: a negative literal set on the `dead-vocabulary.ts` pattern covering
  ASD-STE100 conformance or certification, any token-economy win, and any LLM-comprehension
  benefit. As written the requirement is enforced by discipline alone, and the voice guard is the
  proof of what discipline-without-mechanism does over a full milestone.

- **D-30:** **F-28-204 and F-28-212 are fixed here, not deferred.** Both record the same defect —
  zero role files state a when-absent config fallback, so `Runs lean with documented defaults when
  absent` (C-28-012, `AGENTS.md:16`) and `because every role falls back to these same documented
  defaults` (C-28-032, `agent-factory/README.md:77-80`) rest on an agent inferring it. The fix is
  one sentence added to each role's `## Reads`, inside the rewrite pass that is already open across
  all 17 files. Deferring to Phase 30 would mean reopening every role file this phase just rewrote.
  Both registry rows flip in the same commit as the role edits, per D-04.

- **D-31:** **F-28-202 / C-28-003** (`README.md:14`, *"Each agent is grug-brained on purpose: one
  job, short words, hard limits"*) flips `overstated → true` once the 17 blocks carry real voice.
  `one job` and `hard limits` already hold; `short words` is the half that failed.

- **D-32:** Three stale counts are corrected: C-28-003's mechanism field says *"the 18 fenced
  caveman blocks"*, and C-28-012 and C-28-032 both say *"zero of 18"*. Measured: **17** blocks
  across **18** role files. These are mechanism prose, not verbatim anchors, so correcting them
  does not trip `check-claim-anchors`. This is the same derivation error Phase 28 already corrected
  once for the role count — `kit-model.listRoles()` drops `_`-prefixed entries, so
  `_role-switch-protocol.md` is out of set, and it has no caveman block, which is why its exclusion
  is correct rather than incidental.

- **D-33:** The writing profile's own public claims are **registered**. The profile document will
  assert falsifiable things about what it achieves; those are exactly the class
  `docs/audit/28-claim-registry.md` exists to hold, and Phase 30's claim-dropping mechanism needs
  them to have ids.

### Anti-pattern carried forward from Phase 28 (AP-1, severity `blocking`)

`.planning/phases/28-kit-consistency-audit/.continue-here.md` records: **a gate prints a PASS line
for a check it did not perform** — element-level vacuity under a collection-level floor. It
manifested four times in one phase; the canonical instance was `rows.length === 0; continue` in
`scripts/check-uat-oracles.ts` while still printing `PASS  WR-05 wording: … the 5-tool-table flip
is asymmetric`.

This phase ships **four guards**, so it is the phase most exposed to it. The structural mechanism —
not acknowledgement — is: one shared element-level vacuity rule rather than four one-off `=== 0`
checks; every PASS line carries its measured numbers rather than an assertion (D-08); and every
guard is **watched failing RED against the real tree before the rewrite lands** (Phase 28's D-24,
which LANG-06 already writes into the requirement for the voice guard specifically, and which
applies equally to the other three).

### Plan-time resolutions (added 2026-08-13 from `29-RESEARCH.md`; D-34 to D-37 are human decisions)

Research measured the tree and found six things CONTEXT.md could not have known. These resolve them.
Each is a locked decision with the same standing as D-01 to D-33.

- **D-34 (human):** The honesty floor's token claim is **softened to `UNKNOWN - verify` in both
  directions**. `.planning/REQUIREMENTS.md:42` asserts *"STE increases token count"* as fact, ROADMAP
  hedges to *"likely"*, `FEATURES.md:259` says `UNKNOWN - verify` — three confidence levels for one
  claim, and research located **no evidence in either direction**. Worse, the stated reasoning
  ("forbids the telegraphic omission caveman relies on") targets the fenced caveman blocks, which
  **LANG-02 explicitly excludes from the profile**. Measured: caveman blocks 5.5% articles vs governed
  workflows 11.4% — the governed corpus is already normal English, so there are no dropped articles to
  restore and article-restoration growth is approximately zero. The measured halves **stay**:
  caveman-as-token-economy is disproven on this artifact, and the profile is justified on determinism
  and one-term-per-concept grounds. Real growth comes from **sentence splitting**, which D-28 already
  requires this phase to measure and record. Edit `REQUIREMENTS.md:42` and the ROADMAP Phase 29
  honesty floor in the same pass as D-11's rename edits.
  — **Reversibility:** reversible.

- **D-35 (human):** D-14 ships **20 words procedural / 25 words descriptive**, not one undifferentiated
  20. STE's own published rule is the two-number split; D-14 adopted only the first. Measured over 982
  sentences: 273 (27.8%) exceed 20, 190 (19.3%) exceed 25. Procedural-vs-descriptive is decided by
  **section anchor** — `## Steps` bullets and numbered procedural lines are procedural, prose is
  descriptive — which is decidable with no tuning and no per-sentence heuristic.

- **D-36 (human):** The D-18 corpus is **workflows + hand-authored checklists + seed templates +
  contracts**: `agent-factory/workflows/` (19 files, 104,094 B), the hand-authored half of
  `agent-factory/checklists/` (13 files, 19,368 B), `agent-factory/seed/**` templates (13 files,
  14,205 B) and `agent-factory/contracts/` (2 files, 15,185 B). **Excluded:**
  `agent-factory/packaging/` (30,076 B), `config/factory.config.md` (18,020 B),
  `agent-factory/README.md`, `_commit-convention.md` — these are documentation *about* the kit, not
  instructions an agent executes, so LANG-02's "two agents reach the same act" test does not bite on
  them. The exclusion is **stated in the profile's own claim** per D-16, never left implied by the
  scan set's omission.

- **D-37 (human):** **Remove-before-add, per role, tracked.** Measured: `security-nfr.md` breaks its
  hard FAIL ceiling on D-19 + D-30 alone (4,992 + ~110 = 5,102 = the ceiling exactly), before the
  rewrite adds a byte; 8 of 17 roles are above WARN today; `incident-responder.md` frees **zero** bytes
  from D-19 (its `## One job` is one sentence, not two). D-26 forbids raising the table. Therefore, per
  role: D-09's caveman-content removal and D-19's `## Responsibilities` #4 delete land **before**
  D-30's fallback sentence, with a measured byte transcript at each step. A plan that adds before it
  removes turns `security-nfr.md` RED with no legal remedy. If a role still reds after every removal,
  **escalate to the human — never raise the table, never silently proceed**.

- **D-38:** Sentence identity for D-05 and D-20 uses **clause-level segmentation (Variant C)**, not
  exact whole-sentence equality. Measured: exact sentence equality finds duplicates in 2 of 17 role
  files and **zero** in `software-engineer.md` — the file CONTEXT.md cites as the four-times worked
  example — so D-20 read literally ships a guard that is GREEN the moment it appears, violating
  Phase 28's D-24 and AP-1. Clause-level finds 12 groups across 9 of 17 files and reproduces the
  four-times claim exactly. One function serves both the diff-disposition gate and the uniqueness
  guard. This is the discretion CONTEXT.md already granted, exercised.

- **D-39:** The guard is named **`guard_imperative_lexicon`**. D-12's imperative-position verb check
  and D-14/D-35's sentence-form rules ship as **two names inside one module** — three unrelated
  predicates under one name recreates at the output line exactly the problem LANG-04 exists to fix.
  Note: `guard_ste` appears in **zero source files** — it exists only in `.planning/` prose, so D-11 is
  three planning-document edits, not a code refactor.

- **D-40:** D-13's derivation is corrected additively: `listRoles()` / `listWorkflows()` return
  **filenames** (`ba-pm.md`), but the Technical Names used in governed prose are **display names**
  (`BA/PM`, `QE/E2E`). Add `listRoleDisplayNames()` / `listWorkflowDisplayNames()` to
  `scripts/kit-model.ts`, derived from the `# Role: ` / `# Workflow: ` headings, each asserting its
  count two-sided against `ROLE_COUNT` / `WORKFLOW_COUNT`. Verified available at 17/17 and 19/19.
  Stays inside D-13's spirit: derived, never listed.

- **D-41:** The caveman opener **`You are <Role>.` is rewritten, not exempted**. D-07's zero-copula
  rule makes it illegal in 16 of 17 blocks (the copula count is 1 in each, and it is the opener). A
  named carve-out in a predicate whose weakest arm already dominates is the D-06 shape this milestone
  is correcting.

- **D-42:** `agent-factory/checklists/security-nfr-checklist.md` (**89,840 B — 82% of the checklists
  directory, 345 verbatim OWASP ASVS rows**) is excluded from the governed corpus **by a derived
  `GENERATED` marker rule**, never by a hand-listed filename. Style-rewriting it would be reverted on
  the next `generate:asvs` run, would falsify its own verbatim-copy claim, and would triple the
  denominator. Assert the marker set's cardinality **two-sided** so a second generated kit file cannot
  arrive silently unexcluded.

- **D-43:** LANG-06's RED-on-17/17 transcript is **necessary but not sufficient acceptance evidence**.
  Measured: both arms of the voice predicate fail 17/17 **independently**, at every N from 1 to 4 — so
  a guard that shipped `positive || negative`, or dropped an arm entirely, produces a byte-identical
  transcript. The voice guard therefore also ships **three discriminating fixtures**: one passing the
  positive arm and failing the negative (must be RED), one passing the negative and failing the
  positive (must be RED), and one passing both (must be GREEN — the false-red control).

- **D-44:** The D-29 banned-claim check is **vacuous against today's tree** — `ASD-STE100` appears in
  zero kit files, so it lands GREEN having never been watched fail. It ships in this order: author the
  profile document containing a **deliberate draft conformance sentence**; land the guard RED naming
  that line and capture the transcript; remove the sentence to GREEN; and keep a **planted hermetic
  fixture** in the guard's test so it is provably non-vacuous forever, not just at the moment it
  landed. Step four is the durable half — the tree will never again contain the claim.

- **D-45:** D-32's count corrections extend to the **byte figure in the same field**. C-28-003's
  mechanism field carries *"total 4,036 bytes"*; measured block-interior total is **3,528 B**. Leaving
  it uncorrected leaves the row carrying a number no command reproduces — the defect D-32 exists to
  fix, one clause to the right. Mechanism field, not a verbatim anchor, so `check-claim-anchors` does
  not trip.

- **D-46:** Six kit files still carry **retired v1.x `handoff` vocabulary** outside Phase 28's audited
  surface (that audit covered roles and workflows only, and both are clean). Two are load-bearing and
  are fixed here: `agent-factory/checklists/definition-of-done.md:16` (`- handoff written`, a DoD item
  requiring an artifact deleted in Phase 24) and `agent-factory/seed/plans/board.md:64` (a board-column
  entry criterion on a shipped template). `example-mapping.md:10`, `_commit-convention.md:9` and
  `README.md:111` are corrected as prose. `packaging/subagent.frontmatter.md:204` is **left alone** —
  it is accurate history. They survived because `dead-vocabulary.ts`'s `RETIRED_PATH_FORMS` is the
  *path* form and `check-kit-refs`'s `SCAN` deliberately excludes `agent-factory/seed/`.

- **D-47:** `## One job` feeds three byte-gated generated artifacts — 17 role adapters, 7 skill twins,
  and the catalog — but the cascade is **two hops, not three parallel readers**
  **[corrected by `29-PATTERNS.md`]**: `scripts/generate-skill-twins.ts` does not read `## One job` at
  all; it generates from the **adapters**, which are generated from `## One job`. Therefore
  `generate:adapters` must run **before** `generate:skill-twins`, and all three artifacts regenerate
  **in the same commit as the role edit** or the freshness gates fire. One further measured
  consequence: `firstSentence()` (`scripts/generate-catalog.ts:65-69`) splits on the first `". "`, so
  D-19's deletion of `## One job`'s **trailing** sentence leaves generated bytes unchanged, while
  rewriting its **first** sentence regenerates all three. Sequence the two edits accordingly. This is
  the same seam Phase 29.1 depends on.

### Claude's Discretion

- The exact caveman lexicon membership and the value of N in D-07, subject to it failing RED on all
  17 current blocks (LANG-06) — that RED transcript is the acceptance evidence, not a design choice.
- The approved-verb list contents in D-12, and the normalization function used for sentence
  identity in D-05 and D-20.
- The final guard name in D-11 among the candidates given.
- Whether `voice-model.ts` splits into two modules if it grows past the repo's module-size norms.
- Plan decomposition and wave ordering, subject to the Sizing note below.

## Sizing — stated so the planner does not under-plan it

Roughly fourteen deliverables: the profile document, `voice-model.ts`, four guards (rebuilt voice,
renamed controlled-language, intra-file uniqueness, banned-claim), the D-05 diff-disposition gate,
17 caveman blocks rewritten, 17 roles de-duplicated, 19 workflows plus the checklists rewritten to
conform, the when-absent fallback added to 17 roles, three registry flips plus three count
corrections plus new profile rows, requirement- and roadmap-text edits for the D-11 rename, and the
D-26 re-baseline as the final plan. Expect **10–14 plans**, not the usual handful. The full-corpus
scope in D-18 was chosen deliberately with this cost visible.

**Sizing update (2026-08-13, post-research).** D-36 bounded the corpus (excluding 48 KB of packaging
and config documentation) and D-42 removed 89,840 B of generated ASVS checklist from it, so the
governed corpus is **47 files / 152,852 B**, not the larger figure a naive read of D-18 implies. Against
that, D-37's remove-before-add ordering, D-43's three fixtures, D-44's author-claim-first sequence,
D-46's six-file vocabulary fix and D-47's three-generator regeneration all add work CONTEXT.md had not
priced. Net: **still 10–14 plans**, with the byte-budget sequencing (D-37) as the binding constraint on
wave ordering rather than the corpus size.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` § *Phase 29: Controlled Language & Voice Guard Rebuild* — goal, the five
  success criteria, the dependency on Phase 28, and the honesty floor on token count
- `.planning/REQUIREMENTS.md` § *LANG — Controlled Language & Voice Guard Rebuild* — LANG-01
  through LANG-08 in full
- `.planning/REQUIREMENTS.md` § *Out of scope* — the vendoring and conformance-claim prohibitions
- `.planning/PROJECT.md` § *Current Milestone: v2.1* and § *Kickoff findings that shaped the scope*
  — the three measured findings that produced this phase

### Phase 28 output this phase must honour
- `docs/audit/28-safety-surface-exclusions.md` — the 41-file exclusion list, and its own statement
  of the per-file granularity limit that D-01 through D-05 resolve
- `docs/audit/28-claim-registry.md` — 38 claims; specifically C-28-003 (F-28-202), C-28-012
  (F-28-204) and C-28-032 (F-28-212), all three `target_phase: 29`
- `.planning/phases/28-kit-consistency-audit/.continue-here.md` — AP-1, severity `blocking`
- `.planning/phases/28-kit-consistency-audit/28-CONTEXT.md` — D-24 (guard watched RED first) and
  D-25 (registry row flipped in the same commit as the fix), both of which D-04 depends on

### Code this phase rewrites or extends
- `scripts/check-foundation-guards.ts` — `guard_voice`, `guard_caveman_preserved`,
  `stripCavemanBlock`, `extractCavemanBlock`, `VOICE_MARKERS`, `neutralizePhrases`, `roleCeiling()`
  and the D-17 note forbidding its derivation
- `scripts/kit-model.ts` — `listRoles()` / `listWorkflows()`, the derivation authority for D-01(b),
  D-13 and D-18
- `scripts/dead-vocabulary.ts` — the one-list / N-consumers pattern D-22 and D-29 follow, including
  its two documented boundary warnings about what must never be added
- `scripts/check-claim-anchors.ts` — the live 38-comparison byte freeze that is D-01(a)
- `scripts/check-public-docs-vocabulary.ts` — the third-consumer precedent, and its explicit
  "this module declares NO literal of its own, and must never start"
- `scripts/frontmatter.ts` — `stripFencedBlocks`, the existing D-64 fence authority D-24 composes

### The corpus under rewrite
- `agent-factory/roles/` — 18 files, 17 with a `## Caveman prompt` block
- `agent-factory/workflows/` — 19 files
- `agent-factory/checklists/` — count derived at plan time, never hand-tallied
- `agent-factory/roles/software-engineer.md` — the worked example of the four-times restatement

### Downstream consumer
- `.planning/ROADMAP.md` § *Phase 30: Per-Checkpoint Autonomy Matrix* — AUTO-01 sources its
  checkpoint set from role `## Hard limits` and workflow `## Stop conditions`, the same derivation
  as D-01(b); AUTO-04's claim-dropping needs the registry ids D-33 adds

### Project constraints
- `CLAUDE.md` § *Constraints* — voice discipline (the joke never replaces the explanation),
  no fabrication, brand rules, the zero-runtime-dependency tooling contract
- `NOTICE:4` and `README.md:57` — the grugbrain.dev attribution, which must stay visible if the
  caveman lexicon adopts its coinages

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/dead-vocabulary.ts`: the one-list / N-consumers module shape, with its boundary warnings
  written into the header. `voice-model.ts` (D-22) and the banned-claim check (D-29) both follow it.
- `scripts/kit-model.ts`: `listRoles()` drops `_`-prefixed entries by derivation, giving 17 of 18
  role files. Already the scan-set authority for four role consumers; D-13 and D-18 add more.
- `scripts/check-claim-anchors.ts`: performs 38 byte-identical comparisons live and green. D-01(a)
  gets its freeze for free — no new machinery.
- `scripts/frontmatter.ts` `stripFencedBlocks`: the D-64 single fence authority, already shared by
  `guard_wr05`'s tier-beat check and `guard_adapter_body`.
- The two-tier WARN/FAIL ceiling pattern in `guard_adapter_size` / `guard_role_size`, and the
  aggregator's rule that a WARN never increments FAILS.

### Established Patterns
- **Derive the set, assert the count.** KIT-01 and KIT-02 replaced five stale hard-coded lists;
  every new set in this phase follows suit or is justified in writing as a measurement baseline.
- **Land the guard RED against the real tree first.** Phase 28 D-24. A guard that passes the moment
  it appears has never been watched fail. LANG-06 already requires it for the voice guard.
- **One format-aware authority per predicate.** The structural fix that closed Phase 22, Phase 25
  and Phase 27 after 8 rounds each — never another heuristic arm.
- **Registry row flips in the same commit as the text change.** Phase 28 D-25; D-04 generalises it.
- Guards are strictly read-only, Node stdlib only, zero npm dependencies, findings in clear
  professional voice — never caveman voice, because a guard is a quality surface.

### Integration Points
- `scripts/check-foundation-guards.ts` is the aggregator the rebuilt voice guard and the intra-file
  uniqueness guard join. The renamed controlled-language guard and the banned-claim check need a
  placement decision at plan time: inside the aggregator, or standalone like
  `check-public-docs-vocabulary` and `freshness:catalog` (D-07 of Phase 18 kept the catalog
  freshness gate deliberately standalone).
- Every new `.ts` compiles to committed `.js` under the freshness contract — currently 43/43. Each
  new script adds a twin that must byte-match a fresh rebuild.
- `package.json` scripts and `.github/workflows/ci.yml` need the new gates wired, or they are
  authored and never run.

</code_context>

<specifics>
## Specific Ideas

- The rewritten caveman blocks should get **more** grug, not less — D-09 makes that safe by
  removing load-bearing content from them first. `grug`, `club`, `rock`, `cave`, `smash`, `shiny`,
  `brain hurt`, `big brain` are the existing `VOICE_MARKERS` vocabulary and the natural seed for
  the committed lexicon.
- The guard output should read like `qe-e2e.md: tokens 4 / content words 23, banned 0` — a line a
  human can check by hand against the file, which is what makes a fabricated PASS visible.
- Phase 28's own framing is the model for the profile document's honesty section: record the true
  extent and name the limit, rather than manufacture variance to look discriminating.

</specifics>

<deferred>
## Deferred Ideas

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

</deferred>

---

*Phase: 29-controlled-language-voice-guard-rebuild*
*Context gathered: 2026-08-13*

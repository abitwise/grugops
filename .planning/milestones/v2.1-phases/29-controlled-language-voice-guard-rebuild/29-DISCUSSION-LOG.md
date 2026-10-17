# Phase 29: Controlled Language & Voice Guard Rebuild - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-13
**Phase:** 29-controlled-language-voice-guard-rebuild
**Areas discussed:** Sentence-level exclusion, Voice measurement, Controlled-language guard subset, Skeleton de-duplication, Fence authority, Byte-ceiling re-baseline, Deferred claim scope

---

## Area selection

Seven gray areas were presented across two multi-select questions. The user selected **all seven**
(all four core areas, and all three mechanics areas; the "core only" opt-out was also marked
alongside the three specific mechanics selections, and the specific selections were treated as
authoritative).

---

## Sentence-level exclusion (LANG-02, LANG-03)

Presented after measuring that `docs/audit/28-safety-surface-exclusions.md` lists 41 files — all 17
roles, all 19 workflows, and the 4 public docs — i.e. exactly the corpus LANG-02 governs, so read
literally the phase may reword nothing.

| Option | Description | Selected |
|--------|-------------|----------|
| A — Frozen | Safety sections out of scope for the profile entirely. Cheapest and provably safe, but the kit's most safety-critical prose becomes its least controlled text. | |
| B — Deliberate | Safety sections get the profile, one file at a time, each change dispositioned; a diff gate refuses undispositioned changes. | ✓ |
| C — Split by modal | Freeze only sentences containing `never` / `must not` / `stop` / `refuse` / `do not`; the profile governs the rest. | |

**User's choice:** B — Deliberate
**Notes:** C was argued against as a heuristic strict-subset of the real predicate — the shape that
cost this project three separate 8-round closures. A was argued against as shipping LANG-02 with a
hole at its centre: "the style pass never touched it" is not the same claim as "the text is
unambiguous."

| Option | Description | Selected |
|--------|-------------|----------|
| Hard RED, no override | A changed sentence intersecting a frozen source fails the build outright. | ✓ |
| Named-human override | Change may proceed with a recorded named-human reason. | |
| Hard RED on (a) and (c), reason-gated on (b) | Claim anchors and guard literals absolute; structural sections take a recorded reason. | |

**User's choice:** Hard RED, no override
**Notes:** The two answers read as conflicting (B applies the profile to safety sections; hard RED
freezes them), and were reconciled explicitly: the frozen sources do not mean the bytes never
change, they mean **no kit text changes alone** — a changed sentence requires its registry row,
guard literal, or disposition row updated in the same commit. This reconciliation is recorded as
D-04 in CONTEXT.md.

---

## Voice measurement (LANG-06)

Presented after measuring: 17 of 18 role files carry a `## Caveman prompt` block; **zero** contain
`grug`; **0 of 17** pass on the idiom arm; all 17 pass on `^You` alone.

| Option | Description | Selected |
|--------|-------------|----------|
| Two-sided, `^You` deleted | ≥N committed caveman-lexicon tokens AND 0 banned constructions. The `^You` arm deleted, not supplemented. | ✓ |
| Positive lexicon only | ≥N caveman tokens, no negative side. Gameable by sprinkling one token per block. | |
| Ratio with threshold | tokens / content words ≥ threshold. Hides two properties behind one tunable number. | |

**User's choice:** Two-sided, `^You` deleted

| Option | Description | Selected |
|--------|-------------|----------|
| Identity only | The caveman block never states a fact not stated once in clear voice elsewhere. | ✓ |
| Block becomes the canonical one-liner | Delete `## One job`, let the block be the single identity statement. | |
| Keep as-is, decide during de-dup | Defer the coupling to the skeleton decision. | |

**User's choice:** Identity only
**Notes:** This settles the areas 2/4 coupling in one move — the block is the section that gives up
its content, which makes it safe to be maximally grug while honouring CLAUDE.md's rule that the joke
never replaces the explanation.

---

## Controlled-language guard subset (LANG-01, LANG-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Verbs-at-imperative + derived names | Closed approved-VERB list at imperative position, plus a Technical Names set derived from kit-model / config / contracts. | ✓ |
| Full approved-word dictionary | Closest to real STE; hundreds of hand-authored words and the canonical set-literal-drift shape. | |
| No lexicon — length + banned only | Smallest, fully decidable, but gives up the one-verb-one-meaning determinism that justifies the phase. | |

**User's choice:** Verbs-at-imperative + derived names

| Option | Description | Selected |
|--------|-------------|----------|
| Rename it | e.g. `guard_procedural_prose` — named for what it decides; requires editing LANG-04/LANG-07 text. | ✓ |
| Keep `guard_ste` | Zero requirement churn, but the identifier carries the claim the requirement forbids. | |
| `guard_ste` with expanded docstring | Name still reads as the standard at every call site and gate output line. | |

**User's choice:** Rename it
**Notes:** Raised as a contradiction inside the requirement's own text — LANG-04 forbids presenting
the guard as enforcing ASD-STE100 conformance, while LANG-04 and LANG-07 both name it `guard_ste`.

| Option | Description | Selected |
|--------|-------------|----------|
| Guard kit files, instruct runtime | Build-time gate over workflow steps, checklists and shipped templates; runtime instances carry the profile as instruction, and the claim says so. | ✓ |
| Guard the templates only, no runtime claim | Most defensible claim; leaves three of LANG-02's six surfaces unaddressed. | |
| Add a runtime linter for written notes | Covers runtime surfaces, but puts a style predicate on the verify-before-write seam. | |

**User's choice:** Guard kit files, instruct runtime

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — full corpus this phase | Guard blocking over everything; the rewrite makes it green within the phase. | ✓ |
| Guard full corpus, rewrite roles first | Roles + templates green here; workflows/checklists get a counted remediation backlog. | |
| Split into a follow-on phase | Cleanest sizing; adds a phase and delays the guard going blocking. | |

**User's choice:** Yes — full corpus this phase
**Notes:** Chosen with the sizing cost stated explicitly (~14 deliverables, 10–14 plans). Recorded
in CONTEXT.md under Sizing so the planner does not under-plan it.

---

## Skeleton de-duplication (LANG-05)

Presented after measuring that `software-engineer.md` states "stop if scope grows or the
architecture must change" **four times**.

| Option | Description | Selected |
|--------|-------------|----------|
| Guard: intra-file uniqueness | No normalized sentence repeats within a role file. Structural, decidable, no tuning. | ✓ |
| One-time pass, recorded | De-duplicate by hand against the ownership table and record the result. | |
| Guard on prohibitions only | Enforce only that a prohibition appears once, in `## Hard limits`. | |

**User's choice:** Guard: intra-file uniqueness
**Notes:** Intra-file only — the WF16 / compaction / AGENTS.md pointer sentences are byte-identical
across files on purpose, so a cross-file check would fail on correct single-sourcing.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, as written | One job = what; caveman = identity; Responsibilities = how; Hard limits = sole prohibition surface. | ✓ |
| Yes, but drop `## One job` | Saves bytes; loses the canonical sentence adapters and the catalog quote. | |
| Let me adjust it | | |

**User's choice:** Yes, as written

---

## Fence authority (LANG-07)

Presented after reading both readers and finding a live divergence: `extractCavemanBlock` has no
unterminated-fence sentinel, so on malformed input `guard_voice` fails RED while
`guard_caveman_preserved` passes the entire file tail as "the block."

| Option | Description | Selected |
|--------|-------------|----------|
| New `voice-model.ts` | Owns the fence reader plus the lexicon sets; both guards import from it. | ✓ |
| Extend `frontmatter.ts` `stripFencedBlocks` | Fewest modules, but makes one authority serve two predicates. | |
| Keep both in `check-foundation-guards.ts`, unified | Smallest diff; leaves the authority inside a 2,637-line aggregator. | |

**User's choice:** New `voice-model.ts`

---

## Byte-ceiling re-baseline (LANG-08)

| Option | Description | Selected |
|--------|-------------|----------|
| No ceilings — measure and record | 19+ new hand-measured baselines is new set-literal surface LANG-08 doesn't ask for; no external cap forces it. | ✓ |
| Add ceilings for workflows too | Catches profile-driven growth mechanically, at the cost of 19 more baselines. | |
| One aggregate corpus budget | One number, but lets one file balloon while others shrink. | |

**User's choice:** No ceilings — measure and record
**Notes:** `roleCeiling()` stays hand-maintained per Phase 27's D-17, re-baselined once in a
dedicated final plan, proven by a one-shot before/after transcript rather than a permanent fixture.

---

## Deferred claim scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fix here — make the claim true | Add the when-absent fallback to all 17 roles in the pass already open; flip both registry rows. | ✓ |
| Drop the claims instead | Weaken AGENTS.md and agent-factory/README.md so neither asserts a per-role fallback. | |
| Defer both to Phase 30 | Keeps scope purely LANG-01..08, but Phase 30 must reopen all 17 role files. | |

**User's choice:** Fix here — make the claim true
**Notes:** F-28-204 and F-28-212 record the same defect. Also settled in this area: a banned-claim
check makes LANG-04's "nowhere in the kit" mechanical rather than disciplinary; C-28-003 flips
`overstated → true` once voice is real; and three stale `18`→`17` count corrections land in the
registry's mechanism fields.

---

## Claude's Discretion

- The exact caveman lexicon membership and the value of N, subject to failing RED on all 17 current
  blocks (that RED transcript is acceptance evidence, not a design choice)
- The approved-verb list contents, and the normalization function for sentence identity
- The final guard name among the candidates given
- Whether `voice-model.ts` splits if it outgrows the repo's module-size norms
- Plan decomposition and wave ordering

## Deferred Ideas

- Passive-voice enforcement — deliberately excluded with its reason recorded, so a later phase does
  not add it as an obvious omission
- A full approved-word dictionary beyond imperative-position verbs
- Byte ceilings for workflows and checklists — measured this phase, decided later on evidence
- A runtime profile check inside `context-io.ts`
- Retiring `validate-agent-factory.ts` — carried from Phase 27, still owned by nobody

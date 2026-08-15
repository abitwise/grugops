# grugops writing profile

The controlled-language profile the grugops kit is written to. It is a grugops-authored document.
It is derived from the ideas of a published controlled-language standard, and it reproduces no part
of that standard — see § *Disclaimer and honesty floor* for the exact statement and its limits.

This is a rules-and-claims surface, so it is written in clear professional voice throughout. The
caveman voice belongs in the fenced `## Caveman prompt` block of a role file and nowhere near a
rule, a claim, or a disclaimer.

## What this profile is

- A small, enumerated set of rules with stable ids, each marked **decidable** (a gate checks it) or
  **advisory** (a human applies it at review).
- A derived set of project Technical Names and Technical Verbs — derived by command, never listed.
- A statement of which surfaces the rules are *enforced* on and which surfaces carry them as
  *instruction*.
- A record of what was deliberately left out, and why.

## What this profile is not

- It is not a copy, a paraphrase, or a substitute for any published standard.
- It is not a claim of conformance with, certification against, or endorsement by anyone.
- It is not a prose-quality judgement. The gates decide the decidable subset and nothing wider.

## The rules

Every rule carries a stable id in the form `WP-NN`. The ids are listed in ascending order, so a diff
of this document is a diff of its rules and not of their arrangement.

<!-- claim: C-28-041 -->
Each rule is marked **decidable** or **advisory** in the table below, and the mark is the whole of
the promise. A decidable rule is one a gate can decide; an advisory rule is checked by a human at
review and by nothing else. The gates that decide the decidable subset are `guard_imperative_lexicon`
and `guard_sentence_form`, and they land with the corpus rewrite in this same phase — until they do,
the decidable mark states which rules are gateable and not which rules are gated. `UNKNOWN - verify`
against the build rather than against this sentence.

The split is stated rather than implied, because a profile that lets a reader assume the whole of it
is enforced is making the overstated claim this project spent a milestone removing.

| id | rule | status |
|---|---|---|
| `WP-01` | A step bullet begins with a verb from the approved step-verb set, in bare imperative form, at position zero once any ordered or unordered list marker is stripped. No leading bold label, no subject noun phrase, no leading conditional clause. | decidable |
| `WP-02` | A procedural sentence is at most 20 words. | decidable |
| `WP-03` | A descriptive sentence is at most 25 words. | decidable |
| `WP-04` | The section anchor decides which length limit applies to a sentence. A bullet under a steps heading is procedural. | decidable |
| `WP-05` | A procedural step carries no modal verb. The step is the obligation. | decidable |
| `WP-06` | A sentence carries no bare demonstrative as its subject unless the antecedent is in the same sentence. | decidable |
| `WP-07` | A sentence carries no `and`-slash-`or` construction. Write the one meaning intended. | decidable |
| `WP-08` | One instruction per sentence. Two imperatives joined by a conjunction are two sentences. | decidable |
| `WP-09` | One term per concept. A concept that has a name keeps that name everywhere. | advisory |
| `WP-10` | A prohibition is stated once, in the section that owns it. | advisory |
| `WP-11` | A steps section carries at least one list item. Write the procedure as list items, or move the explanatory paragraphs under a heading that is not a steps heading. | decidable |

### The adjacency rule, stated rather than left to be assumed

Two rules bound the same construct, and a later reader is most likely to assume they merge. They do
not merge, and neither silently overrides the other. `WP-02` bounds a procedural sentence at 20 words
and `WP-03` bounds a descriptive sentence at 25. The **section anchor decides which one applies**,
and a bullet under a steps heading is procedural — so the 20-word bound wins there, every time. A
sentence is never measured against both bounds, and it is never measured against neither.

### The approved step-verb set

`WP-01` names a set rather than a dictionary. The set is small, grugops-authored, and seeded from the
verbs this repository's own procedural steps already use in bare imperative position. It is declared
once in source, and the rule is a **canonical form with a refusal outside it** rather than a
frequency cutoff over a distribution that has no head to adopt.

### Why a steps section carries at least one list item

`WP-11` is published here because a gate was already deciding it while this document said nothing,
and a rule an author meets first as a red is a rule the kit failed to state.

`WP-01` is scoped to list items. A steps section written as paragraphs is therefore measured by the
imperative predicate not at all — so a heading that claims to hold procedure and holds no list item
is a section no rule in this profile reaches. The gate reports that as a short denominator, which is
correct and was previously unexplained.

The rule is narrow on purpose. It asks for one list item and says nothing about how many, how long,
or what a paragraph beside them may say. Explanatory prose is welcome inside a steps section; it is
the *absence of any list item at all* that the rule refuses, because that is the case where the
section's procedure is invisible to every decidable rule above.

The cost is stated rather than left to be discovered. This is a constraint on every workflow written
from here on, and a steps section written purely as explanation is now out of conformance instead of
merely unmeasured. Every one of the 19 governed workflows carrying a steps heading already satisfies
it, so publishing the rule moved no verdict on the day it was adopted.

## Deliberate omissions, with their reasons

Recorded so a later phase does not add them back as obvious oversights.

**Passive voice is deliberately not banned.** The kit's own correct prose is saturated with it. A
passive check would go red across large volumes of accurate text, and the only route back to green
would be tuning the detector until it stopped noticing — which is a gate that measures its own
tolerance rather than the corpus.

**A full approved-word dictionary is deliberately not adopted.** Beyond the step-verb set at
imperative position, no general word list is maintained here. A hand-authored list of hundreds of
words is set-literal drift by construction: it rots while the build stays green, which is one of the
two systemic failure classes this repository has diagnosed in itself.

**A runtime style check inside the sanctioned note-write path was considered and rejected.** The
shared verified context has exactly one writer, and that writer's job is to verify a note before it
is admitted. Putting a style predicate on that seam would place a matter of taste on a
verify-before-write safety path, where a false red blocks a correct write and a loosened predicate
weakens the admission rule for everything else. The runtime surfaces carry this profile as
instruction instead — see § *Governed surfaces*.

## Technical Names and Technical Verbs

<!-- claim: C-28-040 -->
The project set is **derived, never listed**. Pasting the members into this document would create the
stale copy this milestone exists to eliminate: the document would keep reading as authoritative while
the kit moved underneath it.

Permitting company and project terms outside a general dictionary is the standard's own documented
extension point for subject-specific nouns and verbs. grugops uses it as designed, not as an escape
hatch — because this profile adopts no general dictionary in the first place, there is nothing here
for a project term to be an exception to.

Reproduce the set with these commands:

```sh
# Role display names (17 today)
grep -h '^# Role: ' agent-factory/roles/*.md | sed 's/^# Role: //'

# Workflow display names (19 today)
grep -h '^# Workflow: ' agent-factory/workflows/*.md | sed 's/^# Workflow: //'

# Config keys (21 top-level keys today)
node -e "console.log(Object.keys(require('./agent-factory/config/factory.config.json')).join('\n'))"

# Note kinds — from the context-note contract
agent-factory/contracts/context-note.md

# Board columns (13 today) — from the seed board
agent-factory/seed/plans/board.md
```

`WP-09` applies to this set first. A role, a workflow, a config key, a note kind and a board column
each have exactly one name, and that name is used everywhere it is meant.

## Governed surfaces

**The profile is enforced as a build-time gate over the kit files this repository ships**, and it is
carried as instruction on the artifacts an agent writes at run time. Both halves are stated here,
because claiming a build-time gate governs a note that does not exist until run time would be
precisely the overstated-claim class this project has already registered and measured.

| surface | how the profile reaches it |
|---|---|
| workflow bodies | build-time gate |
| hand-authored checklists | build-time gate |
| seed templates | build-time gate |
| contracts | build-time gate |
| typed notes written into the shared verified context | instruction, via `agent-factory/workflows/16-context-read-write.md` |
| board and traceability rows written at run time | instruction, via the same workflow |

### Named exclusions, with their reasons

Recorded here so a reader meets them as decisions rather than inferring them from a scan set's
silence.

- **The generated OWASP ASVS checklist** is excluded. Its rows are copied verbatim from a
  third-party standard, so rewriting them for style would falsify the checklist's own claim about
  where its text came from — and the next generation would revert the rewrite anyway.
- **The packaging documents and the config-dial documentation** are excluded. They are documentation
  *about* the kit rather than instructions an agent executes, so the procedural rules have no
  subject in them.
- **The fenced caveman blocks** are excluded. They are a voice surface with their own guard; this
  profile never applies a sentence-form rule to them.

## Disclaimer and honesty floor

<!-- claim: C-28-039 -->
The grugops writing profile is an independent work, authored by grugops. It is **derived from** the
ideas of ASD-STE100 Simplified Technical English Issue 9, and it is **not** ASD-STE100. grugops is
not affiliated with, sponsored by, endorsed by, or certified by ASD (Aerospace, Security and Defence
Industries Association of Europe) or the Simplified Technical English Maintenance Group (STEMG), and
neither body endorses or certifies any software tool. **No part of the ASD-STE100 specification text
is reproduced here, in whole or in part, and no part of its controlled dictionary is included,
vendored or redistributed.** The rules above are grugops's own, written for this kit.

ASD-STE100 Issue 9 comprises 53 writing rules in nine sections and was published in January 2025.
That is a widely published fact about the standard, cited as such; it is not an extract from it. No
technical protection measure on any distribution of the specification was bypassed to write this
document.

A third party reports that ASD-STE100 is a registered EU trademark. That report is `UNKNOWN - verify`
against the register, and nothing here asserts it.

<!-- claim: C-28-042 -->
**Conformance with ASD-STE100 is not claimed, not checked, and not implied. No token-economy win is
claimed. No comprehension benefit is claimed.** `guard_banned_claims` holds all three prohibitions
mechanically over the shipped kit and the public documents, and it was watched failing on a real
claim in a real file before it was allowed to pass. A green run from it says what it measured, and
says nothing about the standard.

**What a green `guard_banned_claims` run does not prove — `UNKNOWN - verify`.** The gate matches
pinned literals. A brand-new conformance claim written without any of them is not mechanically
detectable, because no grep recognizes an assertive sentence written in new words. The gate proves
that no pinned literal appears outside this section; it does not prove that no such claim exists.
That residual is recorded in the gate's own source as well, so neither a green build nor this
paragraph can quietly stand in for the other.

### The honesty floor

This profile is justified on determinism and one-term-per-concept grounds. Those are the benefits it
is adopted for, and they are the only benefits it is adopted for.

Its effect on token count is `UNKNOWN - verify` in both directions. No study was located in either
direction, and the one quantitative source found is a vendor page whose figure runs opposite to this
project's own earlier assumption and whose studies are unidentified. It is not cited as support for
anything.

Caveman-as-token-economy is **disproven on this artifact by measurement** and must not be restated.
The measured finding stands: the fenced blocks restate rather than compress.

This profile does not govern the fenced caveman blocks, so no article-restoration cost applies to
them. Their measured article density is already below the governed corpus's, so there are no dropped
articles there to restore.

The growth this phase produces is measured and recorded rather than assumed. A later phase reasons
from that measurement, not from an estimate written before it.

There is no evidence that controlled language improves comprehension for a language model. The kit
does not ship that claim, and this profile does not make it.

### Attribution

grugops is inspired by *The Grug Brained Developer* (https://grugbrain.dev) by Carson Gross. The
caveman lexicon's coinages come from that lineage. grugops is an independent project and is not
affiliated with or endorsed by the author.

# Gap-closure round 8 — LANG-04 closes by narrowing the published claim, and every claim site is dispositioned

**Round:** 8 — FINAL for Phase 29 (plans `29-56`, `29-57`, `29-58`, `29-59`, `29-60`; code range
`e848052..HEAD`)
**Written:** 2026-08-18, opened by plan `29-56`
**Gap source:** `29-VERIFICATION.md` (round 7) — gap 1, `LANG-04`'s PASS-line claim does not hold
mechanically, failed on a third bypass axis (hard-wrap) after two earlier axes were each closed and
each exposed the next; and `29-REVIEW.md` (round 7) — two critical findings
**Governing decisions:** `D-55` (narrow the published claim rather than complete the matcher),
`D-56` (the hard-wrap matcher fix is deliberately NOT done and is disclosed), `D-57` (the CI
build-parity gate is repaired), `D-58` (this is the final round; the scope fence is explicit)
**Predecessor records:** `docs/audit/29-round7-residuals.md`, `29-round6-residuals.md`,
`29-round5-residuals.md`, `29-round4-residuals.md`. This file follows their section shape
deliberately rather than inventing a fifth one for a fifth instance. **It follows them; it does not
replace them.** A prior round's record is history and is never rewritten — where this round
disagrees with one, both values are printed and the disagreement is a finding.

## What this artifact is for

A verification round reads source and committed artifacts. It does not read a planning conversation.
So a decision that lives only in a conversation — "this residual is accepted", "this site was looked
at and left", "this alternative was measured and refused" — is indistinguishable from a silent drop
when the next round comes to read the tree. This file is where round 8's decisions live so they can
be read.

**What is different in round 8, and it is the whole shape of the round.** Every previous round tried
to make the mechanism reach the sentence. Each one succeeded on its named axis and each one exposed
the next, because the distance between "no pinned literal occurs on any line of a derived document
set" and "this project makes no conformance, token-economy or comprehension claim" is not a defect
with a fix — it is an unbounded class, and no matcher over free prose closes it. Round 8 moves the
SENTENCE to the mechanism instead (`D-55`). A prohibition that publishes a wider scope than its
mechanism is the exact defect `LANG-04` exists to prevent, and until this round `LANG-04`'s own guard
was committing it. **Fixing that is closing `LANG-04`, not conceding it.**

The residual axes are not claimed away by the narrowing. They are named, counted and directed —
§4 (`D-56`, plan `29-57`) carries the hard-wrap axis with its live count and its direction, and §7
(plan `29-60`) states what Phase 29 does and does not claim at the granularity of a mechanism.

---

## 1. The claim-site disposition table — every place in the tracked tree that states this prohibition's scope

This section answers one question: **where does this repository state the scope of the
banned-claim prohibition, and what happened to each of those statements this round?**

### 1.1 How the set was derived, and why it was derived rather than listed

The plan that opened this section supplied a list of four sites known to exist at authoring time.
**That list was not accepted.** A hand-maintained set of places is this repository's second
diagnosed systemic failure class (set-literal drift), and accepting one inside the fix for a
claim-scope defect would be that class landing in the remedy. The set below is **derived**, and the
four known sites were then used only as a floor: if the derivation had failed to return any one of
them, the derivation was wrong and would have been widened before anything was dispositioned. It
returned all four, plus nine more.

**The command, verbatim:**

```sh
git ls-files -z \
  | grep -zZv '^\.planning/' \
  | grep -zZv '^docs/audit/29-round' \
  | grep -zZv -- '-SUMMARY\.md$' \
  | xargs -0 grep -a -l -i -E 'standard-name|token[- ]economy|comprehension' \
  | sort
```

**The search vocabulary is the prohibition's own group names**, taken from
`BANNED_CLAIM_LITERALS`: `standard-name`, `token-economy`, `comprehension`. A statement about this
prohibition's scope has to name what is prohibited, and the three group names are what this module
calls the three things. `token[- ]economy` admits both the spaced and the hyphenated spelling
because both are pinned members; the match is case-insensitive.

**`grep -a` is not decoration.** BSD grep reports ZERO matches, silently and with no warning, on any
file it classifies as binary — one NUL byte is enough. A derivation over a tracked tree that omits
`-a` can under-report and looks identical to one that found nothing. This repository has been bitten
by exactly that.

**The denominator, stated as a number at each stage** (measured at `e848052`):

| stage | files |
|---|---|
| `git ls-files` — every tracked file | **1626** |
| after excluding `^.planning/` | 784 |
| after also excluding `^docs/audit/29-round` | 780 |
| after also excluding `-SUMMARY.md` | **780** |
| **matched by the vocabulary — the derived site set** | **13** |

**The excluded locations, by name, each with its reason:**

| exclusion | files removed | reason |
|---|---|---|
| `.planning/` | 842 | Planning history. It is not shipped, it is archived at milestone close, and it is invisible to CI. A sentence there states what a plan intended, not what the tree claims. |
| `docs/audit/29-round*` | 4 | Prior rounds' records. They are history and are **never rewritten** — a round-5 register that stated round 5's scope is a correct record of round 5. Narrowing one would destroy the trail this round exists to extend. |
| `-SUMMARY.md` | **0** | Execution records, same argument as the round registers. **This exclusion is VACUOUS once `.planning/` is excluded** — every tracked `-SUMMARY.md` lives under `.planning/`. It is recorded as vacuous rather than quietly counted as doing work, because a filter that removes nothing and is reported as if it did is how a derivation starts describing itself instead of the tree. |

**The unit of the derived set is a tracked FILE** (`grep -l` reports files, not lines), so the
derived site count is **13** and the table below carries **13 rows — one per derived file**, with
the line addresses inside each file named in its own row. Derived site count **13** = table row
count **13**.

### 1.2 The disposition table

Dispositions: **narrowed here** = narrowed by this plan (`29-56`). **narrowed by plan 29-5N** = a
later plan of this same round owns the edit, named by plan id. **left, with reason** = looked at,
deliberately not changed, reason stated. A site with no row would be indistinguishable from a site
nobody looked at; that is why every derived file has one.

| # | file | addresses | the scope it states | disposition | reason where left |
|---|---|---|---|---|---|
| 1 | `scripts/check-banned-claims.ts` | `:2130` (the `runAll()` header write, formerly `:2103`) | Was: a quantifier over the shipped artifact and the user-facing document set, asserting the absence of a CLASS of claim. | **narrowed here** (task 1) | — Replaced by the decided predicate: one physical line, a derived document set whose size is interpolated from `bannedClaimScan()`, a pinned literal list whose size is interpolated from `BANNED_CLAIM_LITERALS`, outside the registry-anchored blocks of one named region. |
| 2 | `scripts/check-banned-claims.ts` | `:3..:9` (the module docblock's scope claim and its exit-code gloss) | Was: the same totality claim as the header, plus `Exit 0 = every scanned document is free of the pinned claim literals` — a per-DOCUMENT statement the per-LINE matcher does not decide. | **narrowed here** (task 2) | — Both sentences moved to the mechanism. The docblock's "why this gate exists" section and its `D-44` red transcript are history and are accurate; they are untouched. |
| 3 | `scripts/check-banned-claims.ts` | `:50..:68` (the recorded-residual section), `:58` (`THIS GATE PROVES … IT DOES NOT PROVE …`), `:322` (`DIRECTION: FAIL-OPEN`) | Already at the mechanism, and correct: `:58` is the narrow statement the other two addresses were narrowed TO, and `:322` states the fail-open direction of the literal list. | **narrowed by plan `29-57`** (the hard-wrap paragraph at `:60..:68` only) | The hard-wrap paragraph argues the bypass needs a wrap "mid-token" that "no reader would parse as a claim"; the round-7 reproduction wraps mid-PHRASE. `D-56` assigns that correction, with its `V-` id, to plan `29-57`. `:58` and `:322` are **left** unchanged: they already state exactly what the gate decides. |
| 4 | `scripts/check-banned-claims.js` | the committed twin, whole file (69 vocabulary hits, all mirrors of the `.ts`) | Whatever its source states. | **narrowed here** — rebuilt from the `.ts` in the SAME commit as each edit | A derived artifact. It carries no independent statement, and it is not edited by hand; `npm run freshness` is what holds that. |
| 5 | `scripts/check-banned-claims.test.ts` | `:136..:139`, `:147..:186`, `:250..:252` (95 vocabulary hits) | **States no scope.** Every hit is either a selector predicate over `l.group` or a comment explaining why a selector is written the way it is. | **left, with reason** (and extended here) | The harness asserts the gate's behaviour; it does not publish a claim about the kit. This plan ADDS to it — the two superseded noun phrases are declared once as named constants, sourced from the pre-edit file rather than retyped, so a source-shape case can red if either returns. |
| 6 | `agent-factory/writing-profile.md` | `:257..:261` (the `C-28-042` block: *"holds all three prohibitions mechanically over the shipped kit and the public documents"*), `:263..:269` (the "what a green run does not prove" paragraph), `:281`, `:292` (the `C-28-045` / `C-28-046` denials) | `:257..:261` is the kit's own prose statement of this prohibition's scope, and it carries the same totality wording the gate's header carried. `:263..:269` is already narrow (*"proves that no pinned literal appears outside this section"*). `:281` and `:292` are the DENIALS themselves, not statements of the gate's scope. | **narrowed by plan `29-58`** (`:257..:261`); `:263..:269` **left** and extended by `29-58` with the hard-wrap axis; `:281`, `:292` **left, with reason** | This file is outside plan `29-56`'s `files_modified` by design: `:257..:261` is a registry-anchored block frozen byte-for-byte against `docs/audit/28-claim-registry.md`, so the prose and its registry row must move in the SAME commit, and `29-58` is the plan that owns both files. `:281` and `:292` are the denials the exemption region exists to permit; narrowing them would delete correct text. |
| 7 | `docs/audit/28-claim-registry.md` | `:695..:700` (the frozen `C-28-042` row body, a byte copy of the profile block), `:692` (`C-28-042`'s `mechanism:` field), `:100`, `:709`, `:725`, `:739`, `:742`, `:753`, `:756` | `:695..:700` states the same scope as profile `:257..:261`, by construction. `:692` is a dated past-tense mechanism record (*"exit 0 over 82 derived documents … 20 pinned literals"*). The rest are the frozen denial bodies and their mechanism fields. | **narrowed by plan `29-58`** (`:695..:700`, in the same commit as the profile); all other addresses **left, with reason** | `:692` is a **past-tense record of what one named commit measured**, which is this registry's convention and the reason its numbers are allowed to be historical: rewriting it would falsify a dated measurement rather than fix a stale claim. Its live counterparts are pinned two-sided in the gate. The remaining addresses are frozen denial bodies; they are the text the carve-out exists for. |
| 8 | `.github/workflows/ci.yml` | `:210..:256` (the banned-claim step's comment block, ending at the `node scripts/check-banned-claims.js` invocation on `:257`); the scope sentence is `:221..:224`; `:250..:256` is the dated `D-44` record | `:221..:224` — *"carries ZERO controlled-language conformance claim, ZERO token-economy win claim and ZERO comprehension-benefit claim"*. Its SUBJECT is already narrow (*"the kit's scanned text surface … derived in six named parts, deduped, and pinned two-sided"*); its OBJECT is still a class of claim rather than a pinned literal, and it states no per-line unit. | **left, with reason** — **and recorded as a residual, not as clean** | Honestly: this is the one derived site whose object-side wording still overshoots its mechanism after round 8. It is left because (a) `D-58`'s scope fence assigns this round's `ci.yml` edits to plan `29-59`'s build-parity repair and to nothing else, (b) it is a CI comment, not a published gate output and not shipped kit text a user ever reads, and (c) its subject side was already corrected in round 7 and its `NO DOCUMENT COUNT IS STATED HERE, DELIBERATELY` paragraph shows the address is under active discipline. **Recommended to the follow-up named in §8.** `:250..:256` is a dated, commit-attributed past-tense record and stays for the same reason as registry `:692`. |
| 9 | `docs/audit/29-style-dispositions/29-44.md` | `:14`, `:25`, `:34` | A round-5/6 style-disposition record: what a plant measured, per group, at a named commit. | **left, with reason** | A prior round's record. It survived the `docs/audit/29-round*` exclusion only because its path does not carry the `29-round` prefix — a **finding of the derivation**, recorded here rather than smoothed over: the exclusion pattern is narrower than the class it means to name. It is history and is never rewritten, so the disposition is unchanged either way. |
| 10 | `scripts/check-public-docs-vocabulary.ts` | `:111..:112`, `:120..:121`, `:326`, `:343` | Sibling gate. `:111..:112` states which FILE this gate's corpus contains (*"DOES scan this file for conformance, token-economy and comprehension-benefit claims"*); `:343` states why a corpus consumer must not inherit another predicate's exemption. | **left, with reason** | These are statements of corpus MEMBERSHIP — which document the banned-claim gate reads — and every one of them is exactly true. They are not totality claims about detection. `:120..:121` is the kept record of the paragraph that asserted the opposite until round 6, which is deliberately preserved (a corrected paragraph with no record of its correction teaches nothing). |
| 11 | `scripts/check-public-docs-vocabulary.js` | `:101`, `:102`, `:110`, `:111`, `:301`, `:314` | Committed twin of row 10. | **left, with reason** | Derived artifact; carries no independent statement. |
| 12 | `scripts/check-kit-refs.ts` (+ `:263` in its committed twin `scripts/check-kit-refs.js`) | `:290` | *"never a repo-wide grep (D-13 token economy)"* — a design note about **the gate's own grep cost**, using the phrase for a different subject entirely. | **left, with reason** | Not a statement of this prohibition's scope, and not a claim about the kit. It is a false positive of a deliberately over-broad vocabulary search, which is the correct direction for a derivation whose purpose is to miss nothing. |
| 13 | `scripts/compactor.ts` (+ `:7` in its committed twin `scripts/compactor.js`) | `:7` — *"writes the terse gist (caveman token-economy applied to memory)"* | Not a scope statement. It is an **instance of the prohibited claim**: the caveman-as-token-economy rationale, which project measurement on 2026-07-28 **disproved on this artifact** (the fenced blocks restate rather than compress — measured 58 bytes longer than the line each duplicates). | **left, with reason** — **and recorded as a FINDING** | This site is not in the plan's floor list; the derivation found it. It is left because `scripts/` is outside the gate's derived corpus **by construction** (the corpus walks `agent-factory/`, the public documents, `install/README.md`, `skills/`, `.claude/` and the two shipped manifests — never `scripts/`), it is an internal source comment and not shipped kit text, and `D-58` fences round 8 to `LANG-01..08`'s text. **It is a live restatement of a claim this project has disproven, and it is recommended to the follow-up named in §8** rather than fixed under a scope fence that does not cover it. |

**Row count: 13. Derived site count: 13. Equal.**

### 1.3 Two findings the derivation produced that the plan's floor list did not contain

Recorded separately so they are not lost inside a table cell.

1. **`scripts/compactor.ts:7` restates a disproven claim** (row 13). Direction: it is text, not a
   mechanism, and it is not shipped to a host — but it is the exact claim `C-28-045` freezes a
   denial of, sitting live in the tree, invisible to the gate because `scripts/` is structurally
   outside the corpus. Live count: **1** occurrence (plus its committed twin). Remedy: rewrite the
   parenthetical to describe the distillation without the disproven rationale. Not applied this
   round — out of `D-58`'s scope fence. See §8.
2. **The `docs/audit/29-round*` exclusion is narrower than the class it names** (row 9).
   `docs/audit/29-style-dispositions/29-44.md` is a prior round's record and is excluded in spirit
   but not by the pattern. It made no difference to any disposition here — the file's disposition is
   `left, with reason` under either treatment — but a later derivation that assumes the pattern
   covers "prior rounds' records" would be wrong. Recorded rather than patched, because changing the
   pattern after seeing its result is how a derivation gets tuned to its answer.

---

## 2. What an edit to `agent-factory/writing-profile.md` owes — derived from each watching gate

Written by plan `29-58`. **Every row below was produced by RUNNING the gate's own derivation, not by
reading the gate's name and not by inferring from the file's directory.** House rule 10: establish
what a kit document owes rather than assuming it. The failure this guards against is the quiet one —
a gate that turns out not to watch this path and a gate nobody asked look identical afterwards, so an
absence is recorded here WITH the derivation that produced it.

The subject is one edit: narrowing the `C-28-042` mechanism sentence inside
`## Disclaimer and honesty floor` (plan `29-58` task 2) and extending the residual paragraph beneath
it (task 3).

### 2.1 The obligations table

| # | watching gate | derivation run | derived answer | what the edit therefore owes | satisfied by |
|---|---|---|---|---|---|
| 1 | `check-diff-disposition.js` — the D-04 same-commit disposition rule | `node --input-type=module -e 'import {listRoles,listWorkflows,ROLE_COUNT,WORKFLOW_COUNT} from "./scripts/kit-model.js"; const d=[...listRoles(".").map(f=>"agent-factory/roles/"+f),...listWorkflows(".").map(f=>"agent-factory/workflows/"+f)]; console.log(d.length, ROLE_COUNT+WORKFLOW_COUNT, d.includes("agent-factory/writing-profile.md"))'` → prints `36 36 false` | watched corpus cardinality **36** (`WATCHED_CORPUS_MIN` = `ROLE_COUNT` 17 + `WORKFLOW_COUNT` 19); membership of this path **false** | **NOTHING.** No D-04 disposition row is owed. Recorded as an absence BY DERIVATION: `listRoles()`/`listWorkflows()` walk `agent-factory/roles/` and `agent-factory/workflows/`, and this file sits at `agent-factory/` root, so it is out of set structurally rather than by omission | — (nothing owed) |
| 2 | `check-foundation-guards.js` / `guard_role_size` — the per-file byte ceiling (D-07) | `node --input-type=module -e 'import {listRoles} from "./scripts/kit-model.js"; const R=listRoles(".").map(f=>"agent-factory/roles/"+f); console.log(R.length, R.includes("agent-factory/writing-profile.md"))'` → prints `17 false` | ceiling-set cardinality **17**; membership of this path **false** | **NOTHING.** No byte ceiling applies, so adding lines to the residual paragraph cannot trip one. `roleCeiling()` is only ever asked about members of `ROLE_FILES`, and this path is not one | — (nothing owed) |
| 3 | `check-audit-register.js` — the four equalities over `docs/audit/28-claim-registry.md` | `grep -c '^### C-28-' docs/audit/28-claim-registry.md` → `46`; `grep -o '^- kind: .*' docs/audit/28-claim-registry.md \| sort \| uniq -c` → `32 architecture / 8 install / 6 safety` | **46** rows; kind distribution **architecture 32, install 8, safety 6** (sums to 46); the 36 COUNTED rows (equalities one and three) are the derived kit files, and this path is not among them | **DO NOT ADD OR REMOVE A REGISTRY ROW.** Editing a row's `mechanism:` field and its fenced verbatim moves no cardinality: the row count, the per-kind counts and both set equalities are untouched by a within-row edit | task 2 — row count and kind distribution re-derived after the edit and shown equal |
| 4 | `check-claim-anchors.js` — the anchor/row bijection and the byte-identical verbatim comparison | `grep -c '<!-- claim: ' agent-factory/writing-profile.md` → `8`; `grep -c '^- file: agent-factory/writing-profile.md' docs/audit/28-claim-registry.md` → `8` | **8** anchors in the profile, **8** registry rows naming it — a bijection; 46 verbatim comparisons performed repo-wide, all byte-identical | **THE COMPANION IS MANDATORY AND MUST LAND IN THE SAME COMMIT.** `C-28-042`'s block in the profile and its fenced verbatim in the registry are byte-compared live. Editing one without the other is a red. This is the freeze's standing cost (D-53/D-54), and it is the single companion obligation this edit carries | task 2 — one commit touching both paths |
| 5 | `check-banned-claims.js` — the pinned-literal scan and its exemption arithmetic | `node --input-type=module -e 'const m=await import("./scripts/check-banned-claims.js"); const s=m.bannedClaimScan(); console.log(s.length, s.includes("agent-factory/writing-profile.md"))'` → prints `117 true` | scan-set cardinality **117**; membership of this path **true** | **THE FULL EXEMPTION ARITHMETIC APPLIES** — see §2.2 for the complete enumeration of numbers this edit can move, each with its baseline read off the gate's own second PASS line | tasks 2 and 3 — every movable number re-checked, every movement re-derived from the refusal text |
| 6 | `check-kit-refs.js` — the retired-path / resolver-slot scan | a walk of the gate's explicit `SCAN` list — `node --input-type=module -e 'import {readdirSync,statSync,existsSync} from "node:fs"; import {join} from "node:path"; const S=["agent-factory/roles","agent-factory/workflows","agent-factory/checklists","agent-factory/packaging","agent-factory/_commit-convention.md",".claude/skills",".claude/agents","skills","AGENTS.md"]; const w=p=>!existsSync(p)?[]:statSync(p).isFile()?[p]:readdirSync(p).flatMap(e=>w(join(p,e))); const f=S.flatMap(w); console.log(f.length, f.includes("agent-factory/writing-profile.md"))'` → prints `91 false` | walked cardinality **91**; membership of this path **false** | **NOTHING.** The `SCAN` list is explicit and names no `agent-factory/` root file other than `_commit-convention.md` | — (nothing owed) |
| 7 | `check-public-docs-vocabulary.js` — the public-document vocabulary gate | `node --input-type=module -e 'const m=await import("./scripts/check-public-docs-vocabulary.js"); const s=m.publicDocsScan(); console.log(s.length, s.includes("agent-factory/writing-profile.md"))'` → prints `10 false` | `publicDocsScan()` cardinality **10**; membership of this path **false** | **NOTHING.** This file is kit prose, not a public document | — (nothing owed) |
| 8 | `check-imperative-lexicon.js` — `guard_sentence_form` and the governed corpus | `node --input-type=module -e 'const m=await import("./scripts/check-imperative-lexicon.js"); const g=m.governedCorpus(); console.log(g.length, m.GOVERNED_CORPUS_COUNT, g.includes("agent-factory/writing-profile.md"))'` → prints `47 47 false` | `governedCorpus()` cardinality **47**, `GOVERNED_CORPUS_COUNT` **47**, membership of this path **false** | **NOTHING** — and this absence is the load-bearing one. The profile is the CONTRACT the gate implements, not a document the gate governs; its own `## Governed surfaces` section states that exclusion in prose, and the derivation confirms the mechanism agrees. So the new prose is under no sentence-length or step-verb obligation | — (nothing owed) |
| 9 | `check-nul-bytes.js` — the control-byte gate | `node --input-type=module -e 'const m=await import("./scripts/check-nul-bytes.js"); const t=m.trackedPaths(); console.log(t.length, t.includes("agent-factory/writing-profile.md"))'` → prints `1629 true` | tracked-path cardinality **1629**; membership of this path **true** | **THE EDIT INTRODUCES NO FORBIDDEN CONTROL BYTE.** Plain ASCII prose satisfies it; it is recorded because a membership that holds must be reported as loudly as one that does not | task 3 — the gate is re-run on the final tree |

**Companion artifacts created because a gate requires one: 1** (`C-28-042`'s registry row, row 4).
**Companion artifacts created because they seemed likely: 0.** No disposition row, no ceiling
re-check and no regenerated list is created, because rows 1, 2 and 6 derived that none is owed.

### 2.2 Every number an in-region edit can move, with its baseline

Read off `node scripts/check-banned-claims.js`'s second PASS line before any edit of this plan. This
is the enumeration that turns a red into a re-derivation rather than a discovery.

| pin / value | baseline | may it move? | if it moves |
|---|---|---|---|
| `BANNED_CLAIM_EXEMPT_ANCHORS` | **6** — `[C-28-039, C-28-043, C-28-044, C-28-042, C-28-045, C-28-046]` | **NO.** This edit adds and removes no anchored block | a block was added or deleted — halt |
| `BANNED_CLAIM_EXEMPT_SUPPRESSED` | **14** | yes, if the replacement prose adds or drops a pinned-literal occurrence inside a frozen block | re-derive from the refusal text; name the entrant or leaver |
| `BANNED_CLAIM_EXEMPT_COMPOSITION` | **standard-name 8, token-economy 2, comprehension 4** (sums to 14, asserted against the total) | yes, same condition, per group | re-derive; the sum equality is asserted separately, so both move together |
| `BANNED_CLAIM_EXEMPT_EXTENT` | **66** lines (`endBefore - headingAt`) | yes, if the edit changes the region's line count — task 3 adds lines to a paragraph INSIDE the region | re-derive from `reaches N line(s)` in the refusal text |
| frozen-line coverage | **22** of the region's 66 lines; the other **44** are scanned | yes, if a frozen block's line count changes | DERIVED and PRINTED, not pinned — no red, so it is reported explicitly or it moves silently |
| `BANNED_CLAIM_SCAN_COUNT` | **117** (kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2, overlap 1) | **NO.** No document is added or removed | halt |
| `BANNED_CLAIM_LITERALS` length | **22** across 3 groups | **NO.** D-56 forbids a matcher change | halt |
| registry row count / kind distribution | **46**; architecture 32, install 8, safety 6 | **NO.** A within-row edit moves neither | halt |
| the advisory `line:` field of `C-28-042` | **175-179** | yes — it is advisory and unasserted, but a knowingly wrong value is a silent drop | correct it to the block's live position |

### 2.3 Baseline: every watching gate green before any edit

`node scripts/check-banned-claims.js`, `check-claim-anchors.js`, `check-audit-register.js`,
`check-diff-disposition.js`, `check-foundation-guards.js`, `check-kit-refs.js`,
`check-public-docs-vocabulary.js`, `check-imperative-lexicon.js` and `check-nul-bytes.js` each
**exit 0** on the tree at `6a83b31` before this plan's first edit. Tasks 2 and 3 compare against
these transcripts rather than against a remembered value; the transcripts are quoted in full in
`29-58-SUMMARY.md`.

`git diff --numstat .planning/REQUIREMENTS.md` and
`git diff --numstat docs/audit/29-round7-residuals.md` both report **no change** — asserted at the
close of every task in this plan, because a prior round's record is history and this plan flips no
requirement row.

---

### 2.4 A premise this plan was handed, asserted, and found FALSE — `V-29-58-01` is opened here

Plan `29-58` instructed the honesty-floor paragraph to name each surviving axis "with its direction
and its `V-` id — the enumeration axis by **the id round 7 gave it**, the hard-wrap axis by
`V-29-57-01`." **Round 7 gave the enumeration axis no id. Neither did rounds 4, 5 or 6.** The
premise was asserted before it was used, which is the discipline this phase arrived at the hard way:
six times across four rounds a verification harness produced a false result because a premise
failed silently before the assertion under test ever ran.

The derivation, over every register in the tree — for each `V-` id, read a 600-character window
around it and ask whether that window is about a claim written in words the pinned list does not
contain:

```
$ python3 -c "…" over docs/audit/*.md   (full form in 29-58-SUMMARY.md)
V- ids whose context mentions the enumeration axis:
  docs/audit/29-round5-residuals.md  V-29-42-01
  docs/audit/28-claim-registry.md    V-29-57-01
```

Both are **proximity, not assignment**, and each was read to confirm it:

- `V-29-42-01` is *"a claim split across a hard wrap escapes the co-occurrence window"*
  (`29-round5-residuals.md` §3.1), **closed by construction in round 6** when D-48/D-53 deleted the
  window. Round 5 states the enumeration residual in the paragraph BELOW that id, in prose, with no
  id of its own: *"A brand-new claim in words this list does not contain still passes, and that
  residual is recorded in the gate's own source as well as here."*
- `V-29-57-01` is the hard-wrap axis, opened by plan `29-57` in §4 of this file. The window hit is
  this round's own `C-28-042` `mechanism:` field, where the two residuals sit adjacent.

So the enumeration axis has been **disclosed since plan `29-02`** — in the gate's source, in the
profile's prose and in round 5's close — and has **never carried an id**. A prose disclosure with no
id is exactly the shape this register exists to refuse: it cannot be rolled up, it cannot be counted
in either direction, and a later reader cannot tell a decision from a drop.

**`V-29-58-01` is therefore OPENED here rather than invented in prose.** The axis is not new; the id
is. Inventing an id inside `agent-factory/writing-profile.md` with no register entry behind it would
have produced a dangling reference in the one document whose job is to be checkable.

| field | value |
|---|---|
| **id** | `V-29-58-01` |
| **statement** | A conformance claim written without any member of `BANNED_CLAIM_LITERALS` is not matched. No grep recognizes an assertive sentence written in new words. |
| **direction** | **FAIL-OPEN.** The claim passes green. |
| **reach** | The complement of a 22-member enumeration — **not a finite set**, so no reach figure is derivable and none is published. This is the axis's whole content and it is why the axis cannot be closed by extending the list. |
| **live count** | **`UNKNOWN - verify` BY CONSTRUCTION.** Deliberately NOT `0`. `V-29-57-01` has a derived live count of 0 because its shape is mechanically searchable; this one is not, and writing `0` here would publish an unmeasured number as a measurement. |
| **remedy** | **None mechanical**, and none is proposed. The compensating control is human and it is exercised: §1 of this round derived all 13 claim sites in the tracked tree over a 780-file denominator and dispositioned every one by hand. That is a review, not a gate, and it is recorded as a review. |
| **disclosed since** | plan `29-02` — `scripts/check-banned-claims.ts` leading docblock, `agent-factory/writing-profile.md` § *Disclaimer and honesty floor*, `docs/audit/29-round5-residuals.md` close |
| **id assigned** | plan `29-58` (this round). Collision checked: `git grep -c 'V-29-58-01' -- '*.md' '*.ts' '*.js'` returned **0 files** before assignment. |

**This opens no new residual.** It gives a name to one that has been carried, in three places, for
the whole phase. §6's roll-up derives the marker set by command, so this id is picked up there
without a hand edit.

### 2.5 The obligation rows, closed

| row | gate | obligation | satisfied by |
|---|---|---|---|
| 1 | `check-diff-disposition.js` | nothing owed (derived) | — nothing to satisfy; re-run green in both task commits |
| 2 | `guard_role_size` | nothing owed (derived) | — nothing to satisfy; re-run green in both task commits |
| 3 | `check-audit-register.js` | add/remove no registry row | `638ff39` — row count re-derived at **46**, kinds **32/8/6**, both unmoved |
| 4 | `check-claim-anchors.js` | the registry row moves in the SAME commit as the prose | `638ff39` — one commit, both paths; commits touching exactly one of them across `e848052..HEAD`: **0** |
| 5 | `check-banned-claims.js` | the full exemption arithmetic | `638ff39` (extent 66 → 67) and this commit (extent 67 → 75); every value re-derived off the gate's refusal text |
| 6 | `check-kit-refs.js` | nothing owed (derived) | — nothing to satisfy; re-run green in both task commits |
| 7 | `check-public-docs-vocabulary.js` | nothing owed (derived) | — nothing to satisfy; re-run green in both task commits |
| 8 | `check-imperative-lexicon.js` | nothing owed (derived) | — nothing to satisfy; the new prose is under no sentence-form obligation |
| 9 | `check-nul-bytes.js` | introduce no forbidden control byte | this commit — gate re-run on the final tree, exit 0 |

**Unsatisfied rows: 0.**

Every pin this plan moved, with the sentence that produced its value:

| pin | before | after | the gate's own refusal | cause |
|---|---|---|---|---|
| `BANNED_CLAIM_EXEMPT_EXTENT` | 66 | 67 | *"reaches 67 line(s), and `BANNED_CLAIM_EXEMPT_EXTENT` in scripts/check-banned-claims.ts declares 66"* | the narrowed `C-28-042` sentence wraps to 6 lines where it wrapped to 5 (task 2) |
| `BANNED_CLAIM_EXEMPT_EXTENT` | 67 | 75 | *"reaches 75 line(s), and `BANNED_CLAIM_EXEMPT_EXTENT` in scripts/check-banned-claims.ts declares 67"* | the residual paragraph grew from 6 lines to 14 to carry both axes with their ids (task 3) |

Pins that did **not** move, shown unmoved rather than assumed: `BANNED_CLAIM_EXEMPT_SUPPRESSED`
**14**, `BANNED_CLAIM_EXEMPT_COMPOSITION` **standard-name 8 / token-economy 2 / comprehension 4**,
`BANNED_CLAIM_EXEMPT_ANCHORS` **6**, `BANNED_CLAIM_SCAN_COUNT` **117**, `BANNED_CLAIM_LITERALS`
**22** — each quoted from the gate's second PASS line on the final tree and equal to its §2.2
baseline. Neither the total nor the per-group breakdown fired in either run, which is the
independent confirmation that **twelve** lines of new prose entered the carve-out carrying no
occurrence for it to suppress. The derived-and-printed frozen-line coverage moved 22/66 → 23/75; it
is not pinned, so it is reported here rather than left to move in silence.

---

## 3. The round-7 findings, disposed — every review finding and every verification bullet

Written by plan `29-60` under `D-58`. **This table is built from the review and the verification, not
from the plans of this round.** Each row's id and statement are taken from
`.planning/phases/29-controlled-language-voice-guard-rebuild/29-REVIEW.md` and from
`29-VERIFICATION.md`; the artifact that discharges each one was then located in the tree and cited by
file and by commit. A table assembled from the plans would establish that the plans were followed. A
table assembled from the findings establishes that the findings were answered.

**Every live count below was re-measured on the tree at `0b6e1f673e9b024bc48748a36840fb0c8eedc178`
(*"docs(29-59): complete the build-parity gate repair plan"*) by the command written in its own cell.**
Statuses carried from a plan SUMMARY: **0**, asserted at §6.4 rather than asserted about.

### 3.0 The two denominators, taken from the source documents before any row was written

A disposition table whose row count is decided by the person writing it can drop a finding without
anybody being able to see the drop. Both denominators are therefore read out of the source documents
mechanically, and printed here, before the rows exist.

```
$ python3 - <<'EOF'   (frontmatter and gap structure of the two round-7 source documents)
review findings frontmatter:   critical: 2 · warning: 3 · info: 1 · total: 6
failed-truth entries under `gaps:`                        2
`missing:` bullets across those two entries               6   (gap 1: 3, gap 2: 3)
EOF
```

**Review findings: 6. Verification failed truths: 2. Verification `missing:` bullets: 6.**
Rows in §3.1: **6**. Rows in §3.2: **2 + 6 = 8**. Total rows: **14**. Each count equals the count in
the source document, which is the property §3.3 states as an equality with both sides shown.

### 3.1 The six findings of `29-REVIEW.md` (round 7 — 2 critical, 3 warnings, 1 info)

| id | statement as recorded | disposition | mechanism or reason | live count, re-measured on the final tree | decision | where the measurement lives |
|---|---|---|---|---|---|---|
| **CR-01** | The CI job's own step ordering makes the build-parity gate unable to fail: `tsconfig.json` sets `outDir`/`rootDir` to `./` so `npm run build` rewrites the tracked `.js` in place, `freshness.ts` read its committed side from the WORKING TREE, and `.github/workflows/ci.yml` built at `:59` before every freshness step at `:87+` with zero dirty-tree assertions. Round 7's own sweep reproduced that ordering as its build-parity evidence. | **CLOSED by mechanism, and the repair is proven not vacuous.** | The gate's SUBJECT moved rather than the step order alone: `scripts/freshness.ts` reads its committed side with `git show HEAD:<path>` and derives its compared set from `git ls-tree -r -l HEAD`, so no build step that ran earlier can repair it. The CI reorder (freshness at `:78`, **before** any build) plus `npm run check:build-parity` is the belt-and-braces half. The repair is held by a **discrimination pair**: the same planted drift is green on a clone of the pre-fix tree and red by name on a clone of the post-fix tree, with `tsc` run on both. | **0** stale committed outputs: `npm run freshness` → *"All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources"*, plus *"Set equality with the filesystem walk: 0 committed at HEAD and absent on disk, 0 on disk and absent from HEAD."* CI ordering re-derived from the file: freshness `:78` < build-parity `:102` < build `:106`. **A caveat a later reader needs: `grep -c 'git diff\|git status\|git ls-files --modified' .github/workflows/ci.yml` still returns `0`** — the assertion lives one indirection away, inside `package.json`'s `check:build-parity`, so the round-7 verifier's own grep is still literally true and no longer means what it meant. | **`D-57`** | §5, `29-59-SUMMARY.md`; re-verified at §9.3 |
| **CR-02** | A banned literal hard-wrapped across a line boundary passes at exit 0 — on literals the list DOES contain — while `docs/audit/29-round7-residuals.md:561` records that axis as *closed by construction, 0, no subject*. The in-source justification argues the bypass needs a wrap falling inside a word; the reproduction wraps between words into legible prose. | **SPLIT, and both halves answered: the FRAMING is CLOSED, the MATCHER FIX is DECLINED with a written reason.** Not partially closed — two different things, disposed differently. | **Framing:** `V-29-57-01` is opened with a derived reach, a live count, a direction, a reproduction and a named remedy (§4), and the false in-source premise at the residual paragraph was rewritten to describe the bypass that exists (`59b0ed5`). **Matcher:** the second, wrap-joined input assembly is **not built**. `D-56` declines it — new matcher surface, on a phase whose recorded history is that each round's fix produced the next round's finding, to close an axis with **no live instance**, against a threat model that is drift rather than an adversary. | **0** live wrap-only occurrences over the gate's own derived corpus — **117 documents, 4126 adjacent non-blank line pairs, 11 reachable members asked** (§4.3). **11 of 22** members are wrap-reachable, not the review's 16, which is the multi-word count under another name (§4.2a); the review's *"6 of the 7 token-economy members"* is independently re-derived and confirmed. The bypass **still passes**, demonstrated rather than argued at §9.3.3 on a fresh archive mirror with sha256 provenance: exit 0, planted file never named. | **`D-56`** | §4; §9.3.3; `29-57-SUMMARY.md` |
| **WR-01** | In `deriveExemptBlocks`, an anchor found inside the region whose id has no registry row is silently skipped; `ids` is not pushed to, so `BANNED_CLAIM_EXEMPT_ANCHORS` does not move. The in-source comment says *"the cardinality assertion below reports the shortfall"*, which is false for that branch — the assertion detects a **row** removed, never an **anchor** added. The compensating check lives entirely in a different gate. | **OUT OF SCOPE (`D-58`), NOT DROPPED — carried as `V-29-60-01`** with a direction, a live count and an inheriting owner. | Not fail-open: an unregistered anchor freezes nothing, so no line becomes newly exempt and the direction is fail-CLOSED. What survives is a **false in-source claim about a mechanism** plus a half-derived cardinality. `D-58` fences round 8 to `D-55`'s narrowing, `D-56`'s disclosure, `D-57`'s repair and this record; this is none of them, and it is not in `LANG-04`'s text. | **1** false in-source statement at **1** address (`scripts/check-banned-claims.ts:1723-1726`), **byte-unchanged this round** (`git diff e848052..HEAD -- scripts/check-banned-claims.ts \| grep -c 'cardinality assertion below reports the shortfall'` → **0**). **0** unregistered anchors on this tree: 6 anchors inside the region, 6 rows, `BANNED_CLAIM_EXEMPT_ANCHORS` pinned at 6, `deriveExemptBlocks` returns 6 ids and **0** refusals. | **`D-58`** | §5.4 (`V-29-60-01`) |
| **WR-02** | `anchoredBlockAt` returns `overruns: true` when a block needs a line the document does not have; `deriveExemptBlocks` reads only `block.matches`, so an overrun lands in `diverged` and is reported as *"no longer matches its registry row … byte for byte"* — a cause that is not there, sending an editor to compare bytes when the document is short. | **OUT OF SCOPE (`D-58`), NOT DROPPED — carried as `V-29-60-02`.** | A **misattributed cause on a red**, not a wrong verdict: the gate still reds, and it still reds for a real defect. It is a message-quality finding on a fail-CLOSED path, outside the fence for the same three reasons as `WR-01`. | **0** live overruns: `deriveExemptBlocks(".", …)` on the final tree returns `diverged 0`, `refusals 0` over all **6** blocks, whose derived line indices run **238..302** (1-based) inside a region of **235..309**. | **`D-58`** | §5.4 (`V-29-60-02`) |
| **WR-03** | A second anchor grammar lives in the `D-54` harness — `const MIRROR_ANCHOR_RE = /^<!-- claim: (C-28-\d{3}) -->$/;` at `scripts/check-banned-claims.test.ts:481`, a byte-copy of the exported `CLAIM_ANCHOR_RE` — in the round whose own stated principle is one grammar per concept, and a third block-extent rule beside it. | **OUT OF SCOPE (`D-58`), NOT DROPPED — carried as `V-29-60-03`.** | The duplicate is in a **test harness**, not in a shipped predicate, so a divergence between the two produces a wrong test rather than a wrong verdict. It is nonetheless the exact `LANG-07` defect class this milestone has closed three times, one level down inside its own remedy, which is why it carries an id rather than a shrug. | **2** declarations of the anchor grammar in the tracked tree: **1** authority (`scripts/audit-model.ts:1579`, exported) and **1** hand-copied mirror (`scripts/check-banned-claims.test.ts:481`, **3** references). Both re-derived by `grep -na 'CLAIM_ANCHOR_RE *=' scripts/*.ts` and `grep -na 'MIRROR_ANCHOR_RE' scripts/check-banned-claims.test.ts`. | **`D-58`** | §5.4 (`V-29-60-03`) |
| **IN-01** | `exemptLineSet` holds `[block.start, block.end)` for every block whose ANCHOR sits inside the region, so a block whose verbatim runs past `endBefore` contributes indices outside it. The PASS line then reports `exemptLineSet.size` as *"covering N of the region's M line(s)"* and renders `M - N` as the free remainder, which can over-state coverage and can go negative. | **OUT OF SCOPE (`D-58`), NOT DROPPED — carried as `V-29-60-04`.** | The review's own status line reads *"CONFIRMED by trace; **0 live subjects** on this tree"*, and the `inRegion` conjunct rejects those lines from suppression, so there is no fail-open. The defect is that a **published number is computed from a set that is not the quantity its sentence names** — which is this phase's own subject, at one address, in a clause nothing pins. | **0** derived block indices outside `[headingAt, endBefore)` = `[234, 309)` 0-based, measured through the module's own `deriveExemptBlocks`: min 237, max 301. The PASS line's arithmetic is consistent today — `covering 23 of the region's 75 line(s) — the other 52` — and **23 + 52 = 75** by hand. | **`D-58`** | §5.4 (`V-29-60-04`) |

### 3.2 The two failed truths of `29-VERIFICATION.md` and their six `missing:` bullets

The bullets are the verifier's own remedies. **Three of the six are answered by an artifact; two are
answered by a written REJECTION; one is left to the verifier by construction.** A bullet answered by a
rejection is still answered — what would not be an answer is silence.

| # | source | statement as recorded | disposition | mechanism or reason | live count, re-measured | decision |
|---|---|---|---|---|---|---|
| **G1** | gap 1, truth | *"`guard_banned_claims`'s own PASS-line claim … holds mechanically, with no fail-open route"* — **failed**, on a listed multi-word literal split by an ordinary hard wrap. | **CLOSED BY NARROWING THE CLAIM, not by completing the matcher.** The **verdict is the verifier's** and is not taken here. | The truth as written is stronger than `LANG-04`'s own text, and the input-assembly axis it quantifies over is unbounded — a hard wrap, then inline emphasis, then a table cell. `D-55` moves the published sentence to the predicate the gate decides. The gate's header now reads: *"no single physical line of the 117 derived document(s) this gate scans carries any of the 22 pinned claim literal(s), outside the registry-anchored blocks of one named exemption region"* — every number interpolated from the run. | The narrowed header is **TRUE on a tree carrying the round-7 bypass**, demonstrated at §9.3.3 rather than argued: the plant lands, the gate exits 0, and no single physical line carries a pinned literal. **The narrowing holds at the header. It does NOT hold at one further address** — see `V-29-60-05`, §5.4, which this plan's own sweep found and reproduced. | **`D-55`** |
| **G1-a** | gap 1, `missing:` 1 | *"Give the matcher a second, explicitly named input assembly for the multi-word members only …"* | **REJECTED, with the reason written down and the id that carries the remainder.** | `D-56`, quoted at §4.1. The remedy is named in full — a wrap-joined projection carrying a per-line index, asked only of the multi-word members, never a global whitespace normalization — so the next reader inherits a specification rather than a gap. | **0** identifiers named `wrapJoined` in either twin; **1** prose mention of `wrap-joined`, at `scripts/check-banned-claims.ts:89`, which is the disclosure of the declined remedy. The function set of `check-banned-claims.ts` is **byte-identical** across `e848052..HEAD` (0 added, 0 removed). | **`D-56`** |
| **G1-b** | gap 1, `missing:` 2 | *"Open a new `V-` id … naming this axis with its live count …, its direction (FAIL-OPEN), and correct the false 'mid-token' framing in the in-source comment."* | **CLOSED — both halves.** | `V-29-57-01` opened at §4 with three independent measurements; the in-source premise rewritten at `59b0ed5`. | The id exists in **14** tracked files (§6.1). The false premise: `grep -ac 'mid-token' scripts/check-banned-claims.ts` → **0**. **The verifier's own figure is corrected rather than transcribed:** it asks for *"16 multi-word/reachable"*; **16 and reachable are different quantities** and the derived reach is **11** (§4.2a). | **`D-56`** |
| **G1-c** | gap 1, `missing:` 3 | *"Re-run this verification's reproduction against the fix and confirm it now reds by name before recommending LANG-04 → Complete."* | **NOT SATISFIABLE BY THIS ROUND, and that is stated rather than finessed.** | There is no fix to re-run the reproduction against: `D-56` declines it. The reproduction is instead re-run **unchanged**, and it still passes — which is the honest evidence for a round that narrowed a claim rather than widening a mechanism. **The precondition this bullet attaches to `LANG-04 → Complete` therefore is not met on its own terms**, and the verdict is left to the verifier with that said plainly. | The round-7 plant re-run on a fresh archive mirror of the final tree: `PLANT_LANDED=1`, gate **exit 0**, planted file named **0** times in the output (§9.3.3). | **`D-56`** |
| **G2** | gap 2, truth | *"The CI build-parity gate mechanically prevents a stale committed `.js` from shipping on `main`"* — **failed**. | **CLOSED by mechanism (see CR-01), with two pieces of coverage that MOVED recorded as ids rather than absorbed.** | The gate's subject moved to `HEAD`. What the old comparison covered and the new one does not is `V-29-59-01`; the platform scope of the working-tree assertion is `V-29-59-02`. Both are in §5. | `npm run freshness` exit **0**, 48 outputs; discrimination pair green-then-red on hermetic clones; `V-29-59-01` live **0** on this tree, `V-29-59-02` live **1 of 2** matrix legs unasserted. | **`D-57`** |
| **G2-a** | gap 2, `missing:` 1 | *"Reorder CI to run freshness before build, and add a `git diff --exit-code -- '*.js'` assertion after build."* | **CLOSED, both halves.** | Freshness moved to `:78`, ahead of every build step; the assertion ships as `npm run check:build-parity` in `package.json` and is invoked at `:102`. | Re-derived from the file: `npm run freshness` `:78` → `npm run check:build-parity` `:102` (ubuntu) → `npm run build` `:106` (every other leg). `package.json` moved by exactly **1 line**; `package-lock.json` **byte-unchanged** across the round. | **`D-57`** |
| **G2-b** | gap 2, `missing:` 2 | *"Make the gate ordering-independent: have `freshness.ts` read the committed side via `git show HEAD:<path>` rather than the working tree."* | **CLOSED, and EXCEEDED.** | Both the committed BYTES and the compared SET moved to git — `git show HEAD:<path>` and `git ls-tree -r -l HEAD` — so a file committed at `HEAD` and absent from disk is a finding too, which the bullet did not ask for. | The gate's own output carries the second direction as a printed line: *"Set equality with the filesystem walk: 0 committed at HEAD and absent on disk, 0 on disk and absent from HEAD."* | **`D-57`** |
| **G2-c** | gap 2, `missing:` 3 | *"This is recommended as a follow-up item …, not as a block on LANG-01..08, since none of the eight requirement's texts name the CI build pipeline."* | **OVERTAKEN — the round did MORE than the bullet asked.** | The verifier offered to defer it; `D-57` took it inside the round instead, on the ground that it is load-bearing for every other mechanical claim this phase makes. Recorded so a later reader does not read the closure as scope creep: it is a decision, by id. | Not a countable bullet. Its subject is discharged by `G2`, `G2-a` and `G2-b` above. | **`D-57`** |

### 3.3 The finding equality, stated as an equality with both sides shown

```
six review findings   ==  closed by mechanism + split + out of scope with an id + rejected + dropped

LEFT  = 6   (CR-01, CR-02, WR-01, WR-02, WR-03, IN-01)
RIGHT = 1 + 1 + 4 + 0 + 0 = 6
  closed by mechanism        (1): CR-01
  split, both halves answered(1): CR-02  (framing CLOSED, matcher DECLINED — one finding, two dispositions)
  out of scope, carried by id(4): WR-01 -> V-29-60-01, WR-02 -> V-29-60-02,
                                  WR-03 -> V-29-60-03, IN-01 -> V-29-60-04
  rejected outright          (0): —
  DROPPED                    (0): —

two failed truths + six `missing:` bullets  ==  closed + rejected-with-reason + not-satisfiable + overtaken

LEFT  = 8   (G1, G1-a, G1-b, G1-c, G2, G2-a, G2-b, G2-c)
RIGHT = 5 + 1 + 1 + 1 = 8
  closed                 (5): G1 (by narrowing), G1-b, G2, G2-a, G2-b
  rejected, reason given (1): G1-a  (the wrap-joined assembly, declined by D-56)
  not satisfiable        (1): G1-c  (no fix exists to re-run the reproduction against)
  overtaken by more work (1): G2-c  (the verifier offered a deferral; D-57 declined it)
```

**The first draft of this second block put `G1-b` in two buckets at once** — counted as CLOSED and again
under a "rejected" bucket that was really about the review's 16-of-22 reach figure, which is a
*correction* inside `G1-b` and not a disposition of its own. It needed a clause to explain itself, and a
bucket that needs a clause is a bucket that is wrong. Corrected before publication and recorded here
rather than silently, because a disposition table that quietly repairs its own arithmetic is asking to be
trusted about everything else it counted. **This is one of this plan's own false results; the full list is
at §6.5.**

**No partials.** Two rows record work beyond the finding — `G2-b` (the set direction the bullet did not
ask for) and `G2-c` (a deferral the round declined to take) — and one row records the round doing
**less** than a bullet asked, `G1-c`, with the consequence for `LANG-04`'s verdict stated in the row
rather than left for a reader to infer.

### 3.4 What building this table found that neither source document contained

Recorded separately so they are not lost inside a cell. Both are findings **of the derivation**, which is
the reason the table was built from the source documents rather than from the round's own plans.

1. **`V-29-60-05` — the narrowing is complete at the gate's header and incomplete at its second PASS
   line.** `D-55` moved the published claim to the predicate the gate decides, and §1's disposition table
   named the addresses it moved: the `runAll()` header write and the module docblock. **The gate's second
   PASS line was not among them**, and it still opens with a per-DOCUMENT quantifier —
   *"117 document(s) carry zero banned claim literal outside the one named exemption region"* — over a
   per-LINE decision. Reproduced, not argued: §9.3.3. Full entry at §5.4.
2. **`V-29-60-06` — three gates run in continuous integration only as a side effect of their own test
   files.** Deriving §9's sweep command list from `.github/workflows/ci.yml` and `package.json`, rather
   than typing one, showed that `check-uat-oracles.js`, `now-running-freshness.js` (`freshness:queue`) and
   `trace-freshness.js` (`freshness:traceability`) are invoked by no workflow step — they run because
   their `.test.ts` files spawn them inside the vitest step. **That is the "borrowed, not wired" pattern
   this same workflow's own comments name as a defect and fix by hand for two other gates**, surviving for
   three more. Full entry at §5.4.

**Neither was in `29-REVIEW.md` and neither was in `29-VERIFICATION.md`.** §1 of this register found two
sites its plan's floor list did not contain; §4.2a corrected a published reach figure; this section adds
two more. The count of round-8 findings produced by **deriving a set that a plan supplied as a list** is
now **five**, and every one of them was invisible to the document that would otherwise have been copied.

---

## 4. `V-29-57-01` — the hard-wrap axis: measured three ways, directed, and LEFT OPEN

Written by plan `29-57` under `D-56`. **Nothing in this section is fixed by this plan.** That is the
point of it: the difference between a decision and a silent drop is a written id carrying a live
count, a direction, a reproduction and a named remedy, and this round is where the one axis Phase 29
does not close gets that record instead of an implication.

**Every number below is DERIVED by the command printed beside it, re-taken on the tree at
`b90712b3ba65af70dc5aafa13789de687a3e0c62` (`HEAD` at the time of writing).** Numbers carried from a
review's prose or from a prior register: **0**. Where a derived value disagrees with a published one,
both are printed and the disagreement is named as a disagreement — never reconciled.

### 4.1 `V-29-57-01` — a pinned multi-word literal hard-wrapped across a line boundary is not matched

- **OPENED THIS ROUND** (plan `29-57`, `D-56`). **Direction: FAIL-OPEN.**
- **Statement.** `lineHits()` (`scripts/check-banned-claims.ts:2023`) asks each pinned literal of ONE
  physical line. The input the predicate is assembled from is therefore a single line, and a member
  whose spelling contains a space is invisible whenever an ordinary hard wrap falls between its
  words. The words ARE on the pinned list; what defeats the gate is the assembly of its input, which
  is a choice the gate makes and could change.
- **This is NOT `V-29-47-04`.** That residual is the open-enumeration limit — *a claim in words the
  list does not contain* — which no matcher over free prose can close. This is the opposite case: the
  words are pinned, the document is in the corpus, and the gate still says nothing.
- **LIVE COUNT: 0** (§4.3, measured over the gate's own derived corpus, not asserted).
- **REACH: 11 of the 22 pinned members are wrap-reachable** (§4.2, derived from the literal list) —
  **not** the 16 multi-word members, which is a different quantity (§4.2a).
- **REMEDY, named rather than gestured at:** a SECOND, explicitly named wrap-joined input assembly —
  consecutive non-blank prose lines joined with a single space, carrying a per-line index so a
  finding still reports the ORIGINATING line — asked ONLY of the multi-word members, since the
  single-token members already see every line. **Never a global whitespace normalization**: that
  would make the comparison inexact for every literal in order to reach one wrapping, and an inexact
  comparison is how a gate starts admitting shapes nobody measured. The source is right to refuse it
  and that refusal is kept.
- **WHY THE REMEDY IS NOT APPLIED THIS ROUND — a decision, quoted by id.** `D-56`: *"It is not fixed
  here because the fix adds a second input assembly — new surface, on a phase where round 6's fix
  produced round 7's finding — to close an axis with no live instance, against a threat model that is
  DRIFT, not an adversary: every finding that ever caught a LIVE claim was a corpus-SCOPE defect
  (`CHANGELOG.md`, the shipped JSON manifests, both closed), and every matcher-completeness finding
  has been at 0 live."* `D-58` fences round 8 and states that a new matcher-completeness axis at 0
  live is disclosed by this id and belongs to a later phase if ever. **The axis stays open and
  visible. It is not closed by a fourth heuristic.**

### 4.2 Measurement one — wrap-REACHABILITY, derived from the literal list itself

**Definition, stated before the command rather than inferred from its output.** A multi-word member
is WRAP-REACHABLE only if SOME inter-word split of it leaves neither of the two resulting fragments
containing any OTHER pinned member as a case-insensitive substring. A member whose every split leaves
another pinned member intact on one of the two lines is NOT reachable, because the line-oriented
matcher still hits that surviving member and the finding is still reported.

```sh
node --input-type=module <<'EOF'
const { BANNED_CLAIM_LITERALS } = await import("./scripts/check-banned-claims.js");
const all = BANNED_CLAIM_LITERALS.map((m) => m.literal.toLowerCase());
const multi = BANNED_CLAIM_LITERALS.filter((m) => m.literal.trim().split(/\s+/).length > 1);
const reachable = [];
for (const m of BANNED_CLAIM_LITERALS) {
  const t = m.literal.trim().split(/\s+/);
  if (t.length < 2) continue;
  let ok = false;
  const splits = [];
  for (let i = 1; i < t.length; i++) {
    const L = t.slice(0, i).join(" ").toLowerCase();
    const R = t.slice(i).join(" ").toLowerCase();
    const survivor = all.find((o) => o !== m.literal.toLowerCase() && (L.includes(o) || R.includes(o)));
    splits.push({ at: i, L, R, survivor: survivor ?? null });
    if (!survivor) ok = true;
  }
  if (ok) reachable.push({ group: m.group, literal: m.literal });
  else console.log(`NOT reachable: ${JSON.stringify(m.literal)} — every split leaves a pinned member intact:`, JSON.stringify(splits));
}
console.log("total members            =", BANNED_CLAIM_LITERALS.length);
console.log("multi-word members       =", multi.length);
console.log("wrap-reachable members   =", reachable.length);
console.log("--- reachable, by group and spelling ---");
for (const g of [...new Set(BANNED_CLAIM_LITERALS.map((m) => m.group))]) {
  const inG = BANNED_CLAIM_LITERALS.filter((m) => m.group === g);
  const rG = reachable.filter((r) => r.group === g);
  console.log(`${g}: ${rG.length} reachable of ${inG.length} member(s) — ${JSON.stringify(rG.map((r) => r.literal))}`);
}
EOF
```

Output, verbatim:

```
NOT reachable: "improves comprehension" — every split leaves a pinned member intact: [{"at":1,"L":"improves","R":"comprehension","survivor":"comprehension"}]
NOT reachable: "improve comprehension" — every split leaves a pinned member intact: [{"at":1,"L":"improve","R":"comprehension","survivor":"comprehension"}]
NOT reachable: "comprehension benefit" — every split leaves a pinned member intact: [{"at":1,"L":"comprehension","R":"benefit","survivor":"comprehension"}]
NOT reachable: "easier for the model to understand" — every split leaves a pinned member intact: [{"at":1,"L":"easier","R":"for the model to understand","survivor":"understand"},{"at":2,"L":"easier for","R":"the model to understand","survivor":"understand"},{"at":3,"L":"easier for the","R":"model to understand","survivor":"understand"},{"at":4,"L":"easier for the model","R":"to understand","survivor":"understand"},{"at":5,"L":"easier for the model to","R":"understand","survivor":"understand"}]
NOT reachable: "easier for a language model to understand" — every split leaves a pinned member intact: [{"at":1,"L":"easier","R":"for a language model to understand","survivor":"understand"},{"at":2,"L":"easier for","R":"a language model to understand","survivor":"understand"},{"at":3,"L":"easier for a","R":"language model to understand","survivor":"understand"},{"at":4,"L":"easier for a language","R":"model to understand","survivor":"understand"},{"at":5,"L":"easier for a language model","R":"to understand","survivor":"understand"},{"at":6,"L":"easier for a language model to","R":"understand","survivor":"understand"}]
total members            = 22
multi-word members       = 16
wrap-reachable members   = 11
--- reachable, by group and spelling ---
standard-name: 4 reachable of 7 member(s) — ["ASD-STE 100","ASD STE100","ASD STE 100","Simplified Technical English"]
token-economy: 6 reachable of 7 member(s) — ["token economy","fewer tokens","token savings","saves tokens","reduces token count","lowers token count"]
comprehension: 1 reachable of 8 member(s) — ["better understood by the model"]
```

| quantity | derived value | how |
|---|---|---|
| total pinned members | **22** | `BANNED_CLAIM_LITERALS.length` — equal to the count the gate's own PASS line publishes |
| multi-word members | **16** | members whose spelling contains whitespace |
| **wrap-reachable members** | **11** | the definition above, applied to every inter-word split |
| of the `token-economy` group | **6 reachable of 7 members** | the hyphenated `token-economy` is a single token and sees every line |

#### 4.2a `multi-word` and `wrap-reachable` are DIFFERENT quantities, and the round-7 review takes the first for the second

**One sentence, because this is the correction and not a footnote: a member being multi-word does not
make it wrap-reachable, because a split that leaves another pinned member intact on one of the two
lines is still matched — so 16 multi-word members yield 11 reachable ones, and the five-member
difference is exactly the `comprehension` group, which pins the bare terms `comprehension` and
`understand` and therefore survives every split of its own longer phrasings.**

| source | figure for the reach | derived here |
|---|---|---|
| `.planning/phases/29-controlled-language-voice-guard-rebuild/29-REVIEW.md:225-226` — *"its live count (**16 of 22 literals reachable**; 6 of the 7 `token-economy` members; 0 live occurrences; 3 demonstrated plants)"* | **16 of 22** | **11 of 22** |

**This register carries 11**, because 11 is what the definition above returns when it is run against
`BANNED_CLAIM_LITERALS` on the tree at `HEAD`, and because the review's 16 is the multi-word count
under a different name. The review's `6 of the 7 token-economy members` is independently
**re-derived and CONFIRMED** by the same command. This correction is filed here rather than by
editing the review: a prior round's record is history and is never rewritten.

**This is this phase's own `WR-01` defect — a published number with no recorded derivation — caught
in the round that could have carried it.** It is the second such catch in round 8: `29-56` derived
the claim-site set rather than accepting the plan's four-site floor list and found thirteen.

### 4.3 Measurement two — the LIVE count, over the gate's own derived corpus

**Not a hand-picked set.** The measurement imports `bannedClaimScan()` — the same derivation the gate
runs — walks every adjacent non-blank line pair of every scanned document, joins each pair with a
single space, and counts occurrences of the **11 reachable** members that appear in the joined
projection and in **NEITHER** of the two source lines. That difference is exactly what the shipped
matcher cannot see. The scanned-document denominator is printed beside the hit count so the
denominator is visible rather than assumed.

**This measurement is a one-off recorded command. It is NOT added to any shipped script**, because
adding it IS the remedy `D-56` declines.

```sh
node --input-type=module <<'EOF'
import { readFileSync } from "node:fs";
const { BANNED_CLAIM_LITERALS, bannedClaimScan } = await import("./scripts/check-banned-claims.js");
const all = BANNED_CLAIM_LITERALS.map((m) => m.literal.toLowerCase());
const reachable = BANNED_CLAIM_LITERALS.filter((m) => {
  const t = m.literal.trim().split(/\s+/);
  if (t.length < 2) return false;
  for (let i = 1; i < t.length; i++) {
    const L = t.slice(0, i).join(" ").toLowerCase();
    const R = t.slice(i).join(" ").toLowerCase();
    if (!all.some((o) => o !== m.literal.toLowerCase() && (L.includes(o) || R.includes(o)))) return true;
  }
  return false;
});
const docs = bannedClaimScan();
let hits = 0, pairs = 0;
for (const rel of docs) {
  const lines = readFileSync(rel, "utf8").split("\n");
  for (let i = 0; i + 1 < lines.length; i++) {
    const a = lines[i], b = lines[i + 1];
    if (a.trim() === "" || b.trim() === "") continue;
    pairs++;
    const joined = `${a} ${b}`.toLowerCase();
    const la = a.toLowerCase(), lb = b.toLowerCase();
    for (const m of reachable) {
      const lit = m.literal.toLowerCase();
      if (joined.includes(lit) && !la.includes(lit) && !lb.includes(lit)) {
        hits++;
        console.log(`WRAP-ONLY HIT ${rel}:${i + 1} — ${JSON.stringify(m.literal)}`);
      }
    }
  }
}
console.log("scanned documents (denominator) =", docs.length);
console.log("adjacent non-blank line pairs   =", pairs);
console.log("reachable members asked         =", reachable.length);
console.log("WRAP-ONLY LIVE HITS             =", hits);
EOF
```

Output, verbatim:

```
scanned documents (denominator) = 117
adjacent non-blank line pairs   = 4126
reachable members asked         = 11
WRAP-ONLY LIVE HITS             = 0
```

**LIVE COUNT: 0**, over a denominator of **117 documents** and **4126 adjacent non-blank line pairs**,
asking **11** reachable members. Zero lines were printed, which is why the hit list above is empty
rather than omitted. Had this returned non-zero, plan `29-57` was required to HALT and report rather
than record an accepted bound over live instances; it returned zero, so the bound is accepted with
its number shown.

### 4.4 Measurement three — the house-style wrap figure, with its definition STATED

The round-7 review reports **822 mid-sentence hard wraps over 2458 adjacent non-blank line pairs in
60 tracked `agent-factory/**/*.md` files** (`29-REVIEW.md:197-199`). **It does not state the predicate
that produced those numbers**, so they cannot be reproduced, and this register does not carry them.
A definition is stated here instead, and the figure is re-derived under it at `HEAD`.

**DEFINITION.** A *house-style mid-sentence hard wrap* is an adjacent pair of non-blank lines where
(a) the first line's last non-whitespace character is not one of `.` `!` `?`, and (b) the second
line's first non-whitespace character is a lower-case ASCII letter.

```sh
node --input-type=module <<'EOF'
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
// DEFINITION, stated rather than assumed: a HOUSE-STYLE MID-SENTENCE WRAP is an adjacent pair of
// non-blank lines where (a) the first line's last non-whitespace character is not one of . ! ?
// and (b) the second line's first non-whitespace character is a lower-case ASCII letter.
const files = execSync("git ls-files -- 'agent-factory/**/*.md' 'agent-factory/*.md'", { encoding: "utf8" })
  .split("\n").filter(Boolean);
let pairs = 0, wraps = 0;
for (const rel of files) {
  const lines = readFileSync(rel, "utf8").split("\n");
  for (let i = 0; i + 1 < lines.length; i++) {
    const a = lines[i].trimEnd(), b = lines[i + 1];
    if (a.trim() === "" || b.trim() === "") continue;
    pairs++;
    const last = a.slice(-1);
    const first = b.trimStart().slice(0, 1);
    if (!".!?".includes(last) && first >= "a" && first <= "z") wraps++;
  }
}
console.log("agent-factory markdown files (tracked) =", files.length);
console.log("adjacent non-blank line pairs          =", pairs);
console.log("mid-sentence hard wraps                =", wraps);
console.log("wrap rate                              =", ((wraps / pairs) * 100).toFixed(1) + "%");
EOF
```

Output, verbatim:

```
agent-factory markdown files (tracked) = 73
adjacent non-blank line pairs          = 2612
mid-sentence hard wraps                = 757
wrap rate                              = 29.0%
```

| source | files | adjacent pairs | mid-sentence wraps | definition recorded? |
|---|---|---|---|---|
| `29-REVIEW.md:197-199` (round 7) | 60 | 2458 | **822** | **no** — the predicate is unstated |
| derived here, at `HEAD` | **73** | **2612** | **757** | yes, printed above the command |

**The two are NOT reconciled, and that is deliberate.** Three of the four numbers disagree, and
without the review's predicate there is no way to attribute the disagreement to the file set, to the
wrap test, or to both — inventing an attribution would be exactly the fabricated reconciliation this
phase forbids. **This register carries 757 over 2612 pairs across 73 files, because that is the
figure whose definition is written down.** Neither figure is load-bearing beyond one fact, and both
establish it: **roughly three in ten adjacent non-blank line pairs in the kit's own prose are
mid-sentence wraps.** Mid-phrase wrapping is this kit's house style, not an exotic authoring act — so
a bound accepted on the argument that the wrap shape is unusual is accepted on a false premise.

### 4.5 The reproduction — round 7's, quoted; and this round's, re-run independently at `HEAD`

**Round 7's, quoted from `29-VERIFICATION.md:104-113`:** appended to
`agent-factory/workflows/13-incident.md` on a fresh mirror —

```
The caveman blocks are a token
economy: they mean the model reads fewer
tokens on every run, and this profile saves
tokens too.
```

— *"three separately-pinned `token-economy` claims, hard-wrapped exactly as the kit's own house style
wraps prose. Result: `PASS banned claims: 0 findings over 117/117 elements`, `ALL CHECKS PASSED`. The
planted file is never named."*

**Re-run independently by plan `29-57` at `HEAD`.** Three mirrors were extracted with
`git archive HEAD | tar -x -C <dir>`, **one plant per mirror, none reused and none reset** — an
archive extract is not a git repository and `git checkout --` silently does nothing there.

```
repo gate sha256: 9e6253aa4e15326a5258b1ed885e20d59ce0971f20c71f91137b9fb9eb0324ac
M1   gate sha256: 9e6253aa4e15326a5258b1ed885e20d59ce0971f20c71f91137b9fb9eb0324ac   IDENTICAL
M2   gate sha256: 9e6253aa4e15326a5258b1ed885e20d59ce0971f20c71f91137b9fb9eb0324ac   IDENTICAL
M3   gate sha256: 9e6253aa4e15326a5258b1ed885e20d59ce0971f20c71f91137b9fb9eb0324ac   IDENTICAL
```

**M1 — the WRAPPED plant** (the four lines above, appended verbatim):

```
M1 exit=0
  PASS  banned claims: 0 findings over 117/117 elements
== Result ==
ALL CHECKS PASSED

grep -c "13-incident" <M1 output>  →  0
```

**M2 — the clean control, a SEPARATELY re-extracted mirror:**

```
M2 exit=0
  PASS  banned claims: 0 findings over 117/117 elements
== Result ==
ALL CHECKS PASSED
```

Same element count, `117/117`, as M1 — so M1's green is not the green of a scan that shrank.

**M3 — the DISCRIMINATION control, a third separately re-extracted mirror.** The same claim, the same
three pinned members, the same file, on ONE line instead of four:

```
M3 exit=1
  FAIL  banned claims: 3 finding(s) over 117 elements
        agent-factory/workflows/13-incident.md:46:26 — banned token-economy literal "token economy" — …
        agent-factory/workflows/13-incident.md:46:67 — banned token-economy literal "fewer tokens" — …
        agent-factory/workflows/13-incident.md:46:111 — banned token-economy literal "saves tokens" — …
1 CHECK(S) FAILED
```

**M3 is what makes M1 a finding rather than a coincidence.** Identical mirror provenance, identical
gate binary, identical file, identical members, identical words — the ONLY difference is where the
newlines fall. Unwrapped: exit 1, three findings named at `file:line:column`. Wrapped: exit 0, the
planted file never named anywhere in the output. **The wrap is the whole mechanism.**

### 4.6 What this entry supersedes, and what it does not

`docs/audit/29-round7-residuals.md:561` files:

> `V-29-42-01` | a claim split across a hard wrap escapes the co-occurrence window | **closed by
> construction in round 6** | 0, no subject | `29-round6-residuals.md` §3.7

**That row is ACCURATE about its own subject and is not corrected here.** The co-occurrence window it
names was deleted by `D-48`/`D-53`; a mechanism that no longer exists genuinely has no live subject,
and recording it as closed by construction is right.

**What this entry supersedes is a READING of that row, not the row.** A reader of the round-7 register
would reasonably conclude that the hard-wrap AXIS is closed with no subject. It is not. The wider
axis — a pinned literal the list demonstrably contains, split by an ordinary wrap, in a document the
corpus demonstrably reads — stands, with the reproduction in §4.5 and the reach in §4.2. Round 7's
§7.2 enumeration of what that round does not claim omits it. `V-29-57-01` is where it is counted and
directed.

**`docs/audit/29-round7-residuals.md` is NOT edited by this plan** (`git diff --numstat` over it
reports no change). A prior round's record is history and is never rewritten — this phase's own trail
rule, restated in this file's header. Where this round disagrees with a predecessor, both values are
printed here and the disagreement is a finding here.

### 4.7 What `V-29-57-01` does NOT claim

- It does **not** claim the axis is closed. It is open, and `D-58` states it may stay open past this
  phase.
- It does **not** claim the reach is bounded at 11 forever. **11 is a property of the current
  22-member list**: admitting one more single-token member can make a currently-unreachable member
  reachable, and admitting a multi-word member can raise it. The derivation in §4.2 is the authority,
  not the number it returned today.
- It does **not** claim `0 live` is stable. It is a measurement over the corpus at `HEAD`. Any prose
  edit can move it, and nothing in the shipped tree would report the move — which is precisely the
  direction, FAIL-OPEN, and precisely why the id exists.
- It does **not** claim the remedy is free. A second input assembly is new matcher surface, and this
  phase's own history is that each round's fix produced the next round's finding.

## 5. The build-parity repair — the coverage the subject change MOVED, recorded with owners

Written by plan `29-59` under `D-57`. **The repair itself is not a residual and is not recorded here
as one**: `scripts/freshness.ts` now reads its committed side with `git show HEAD:<path>` and derives
its compared set from `git ls-tree -r -l HEAD`, and the discrimination pair in
`scripts/freshness.test.ts` shows the same planted drift green on the pre-fix tree and red on the
post-fix tree. What this section records is the two pieces of coverage that MOVED when the gate's
subject moved, each with a question, an owner, a direction, a live count and a wiring — because the
difference between a decision and a silent drop is exactly those five fields.

**Every number below is DERIVED by the command printed beside it, taken on the tree this plan
produced.** Numbers carried from a review's prose or from a prior register: **0**.

### 5.1 `V-29-59-01` — a hand-edited but UNCOMMITTED working `.js` is no longer this gate's finding

- **OPENED THIS ROUND** (plan `29-59`, `D-57`). **Direction: FAIL-OPEN, and only inside the
  uncommitted window.**
- **The question that moved.** Before this plan the gate compared, for every build output, the file in
  the WORKING TREE against a rebuild. So it answered: *is the `.js` sitting on this disk right now a
  build of the `.ts` sitting beside it?* After this plan the gate answers a different question: *is
  the `.js` committed at `HEAD` a build of the `.ts` committed beside it?* A `.js` that a person edited
  by hand and has NOT committed, whose `.ts` is unchanged, takes the HEAD arm — so its working bytes
  are not read at all, and the gate is silent about them.
- **Its new owner is a BOUNDARY, not another gate, and saying otherwise would be the silent drop.**
  Two mechanisms stand where the old comparison stood, and neither is a gate over the working file:
  1. `git status` reports the modified `.js` to the person who edited it, before anything else runs.
  2. The freshness gate reds the moment that edit is **committed**, because `HEAD` then carries a
     `.js` that is not a build of its `.ts`. That is the case the discrimination pair proves.
  `npm run check:build-parity` does **NOT** cover this case and is not claimed to: it runs the build
  first, and the build overwrites the hand edit with a faithful output, after which `git diff` is
  clean. Naming it as the owner would be a claim this plan can disprove in one command, so it is
  named here as a NON-owner instead. **MEASURED, not reasoned** — a byte appended to
  `hooks/guard.js` in the working tree with `hooks/guard.ts` untouched and nothing committed:

  ```
  $ git status --porcelain -- hooks scripts install
   M hooks/guard.js                       <- the only mechanism that saw it

  $ node scripts/freshness.js | tail -1
  All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources.
  gate exit=0                             <- silent, correctly: HEAD is intact

  $ npm run check:build-parity | tail -1
  Build parity: no tracked build output moved when tsc ran.
  parity exit=0                           <- silent, because its own build overwrote the edit

  $ git status --porcelain -- hooks scripts install
  (empty)                                 <- the build restored the faithful output
  ```
- **LIVE COUNT ON THIS TREE: 0.** Derived, not asserted:
  ```
  for f in $(git status --porcelain -- install scripts hooks | awk '{print $2}' | grep '\.js$'); do
    ts="${f%.js}.ts"
    git diff --quiet -- "$ts" && [ -z "$(git status --porcelain -- "$ts")" ] && echo "$f"
  done | wc -l        # → 0
  ```
- **CONTINUOUS INTEGRATION HAS NO SUBJECT FOR THIS ID, AND THAT IS THE POINT.** A fresh checkout's
  working tree equals `HEAD` by construction, so the uncommitted window cannot exist on a runner. This
  is a local-development concern only, and its remedy is the one every developer already has: read
  `git status` before committing, or run `npm run check:build-parity`, which rebuilds and shows what
  moved.
- **WHY THE MOVE IS ACCEPTED RATHER THAN COMPENSATED.** The contract `CLAUDE.md` states is about the
  artifact host machines run with bare Node, and that artifact is what is COMMITTED. The old question
  was strictly weaker where it mattered — it could not see `HEAD` at all, which is how a stale
  committed `.js` cleared every gate in this repository for nine phases. Restoring the old comparison
  as a third arm would re-introduce a working-tree read into a gate whose whole repair is that it has
  none.

### 5.2 `V-29-59-02` — the working-tree parity assertion has no Windows leg

- **OPENED THIS ROUND** (plan `29-59`, `D-57`). **Direction: FAIL-OPEN on the unscoped legs.**
- **Statement.** `npm run check:build-parity` is invoked by `.github/workflows/ci.yml` under
  `if: matrix.os == 'ubuntu-latest'`. The `windows-latest` leg compiles and does not assert that the
  tracked outputs stayed put.
- **LIVE COUNT: 1 of 2 matrix legs unasserted.** Derived from `.github/workflows/ci.yml:34`
  (`os: [ubuntu-latest, windows-latest]`) against the one `if:` on the parity step.
- **WHY IT IS SCOPED, STATED RATHER THAN LEFT TO DEFAULT.** Two reasons, both about the ORACLE rather
  than about the code. A raw diff over emitted files on a Windows checkout is an unreliable oracle for
  line-ending reasons — the same family the later freshness block was already scoped for. And the
  script's `'*.js'` pathspec is a POSIX-shell construct that `cmd.exe` passes through with its quotes
  intact, which would make the pathspec match nothing and the assertion pass vacuously. **A vacuous
  green is worse than an absent check**, which is the whole finding this plan exists to repair; adding
  one on a second platform to make a matrix look symmetric would repeat it.
- **REMEDY, named rather than gestured at.** Move the assertion into a Node module with no shell
  surface, so the pathspec is an argument vector rather than a quoted word, and scope the line-ending
  question with `core.autocrlf=false` on the runner. Not done here: `D-58` fences round 8, and this
  is new tooling surface on a phase whose recorded history is that each round's fix produced the next
  round's finding.
- **WHAT REMAINS ASSERTED ON EVERY LEG.** The vitest step runs on both, and
  `scripts/freshness.test.ts` — the discrimination pair, the arm cases, the set-equality cases and the
  refusal cases — runs inside it. The gate's own behaviour is therefore exercised on Windows; it is
  the WORKING-TREE assertion, and only that, which is ubuntu-scoped.

### 5.3 What §5 does NOT claim

- It does **not** claim either id is closed. Both are open and both carry a direction and a live
  count.
- It does **not** claim `0 live` is stable for `V-29-59-01`. It is a measurement of one working tree
  at one moment, and a working tree changes by definition.
- It does **not** claim the repair needs these two ids to be closed to be sound. The repair's evidence
  is the discrimination pair, and it stands on its own.
- It does **not** re-open, re-word or re-count anything in §1, §2 or §4. `git diff --numstat` over
  this file across this plan's commits shows additions in §5 only.

### 5.4 The six ids plan `29-60` opens — four for the findings `D-58`'s fence leaves open, two the sweep found

§5.1 and §5.2 are the build-parity repair's own pair. This subsection extends §5 to the rest of the
round's newly opened ids, so there is **one place in this file where a round-8 id is defined** and §6's
roll-up has one target to point at.

**Why an out-of-scope finding gets an id rather than a sentence.** A fence decides who does the work
next; it does not decide whether the work exists. A finding disposed as *out of scope* with no id cannot
be rolled up, cannot be counted in either direction, and is indistinguishable from a finding nobody
looked at when the next reader arrives. Each of the four below therefore carries a statement, a
direction, a live count re-measured on the final tree, a named remedy and **an owner that inherits it**.

| field | `V-29-60-01` | `V-29-60-02` | `V-29-60-03` | `V-29-60-04` |
|---|---|---|---|---|
| **source** | `29-REVIEW.md` WR-01 | WR-02 | WR-03 | IN-01 |
| **statement** | An anchor inside the exemption region whose id names no registry row is skipped without a refusal, and the in-source comment claims a cardinality assertion reports the shortfall when that assertion detects only a removed ROW | An overrun — a block needing a line the document does not have — is reported as a byte divergence, sending an editor to compare bytes that are not the cause | A second declaration of the anchor grammar lives in the `D-54` test harness beside the exported authority, plus a third block-extent rule | The PASS line reports `exemptLineSet.size` as coverage *of the region*, though the set can hold indices outside it; the rendered remainder can go negative |
| **direction** | **fail-CLOSED**; the defect is a false in-source claim | **fail-CLOSED**; the defect is a misattributed cause on a red | **not a verdict path**; a divergence yields a wrong test | **not a fail-open**; the `inRegion` conjunct still rejects those lines |
| **live count** | **1** false statement at 1 address, `scripts/check-banned-claims.ts:1723-1726`; **0** unregistered anchors (6 anchors, 6 rows, pin 6) | **0** live overruns (`deriveExemptBlocks` → `diverged 0`, `refusals 0` over 6 blocks) | **2** declarations of the anchor grammar in the tracked tree (1 authority + 1 mirror at `check-banned-claims.test.ts:481`, 3 references) | **0** derived indices outside `[234, 309)`; min 237, max 301; `23 + 52 = 75` checked by hand |
| **remedy, named** | Count anchors inside the region as the denominator and rows-with-anchors as the numerator, so both directions have an owner **in this gate**; and correct the comment | Read `block.overruns` and give it its own refusal wording naming the short document | Consume the exported `CLAIM_ANCHOR_RE` in the harness, as `check-claim-anchors.ts:64-73` argues for the shipped side | Project `exemptLineSet` through the region before publishing it, and report the projection in both clauses |
| **why not here** | `D-58` — none of the fence's four in-scope items, and not in `LANG-04`'s text | same | same | same |
| **owner that inherits it** | a follow-up phase or backlog item, per `D-58` — recommended in §8.4 | same | same | same |

---

**`V-29-60-05` — the narrowed claim holds at the gate's header and NOT at its second PASS line.**

- **OPENED THIS ROUND** by plan `29-60`'s own closing sweep. **Direction: the published claim is WIDER
  THAN THE MECHANISM — the exact class `D-55` exists to remove, surviving at one address inside the gate
  `D-55` narrowed.**
- **Statement.** `D-55` moved `guard_banned_claims`'s published sentence to the predicate it decides, and
  §1 of this register dispositioned the addresses that state the prohibition's scope. The gate's header
  now reads *"no single physical line of the 117 derived document(s) … carries any of the 22 pinned claim
  literal(s) …"* — a per-LINE sentence over a per-LINE mechanism. **The gate's second PASS line
  (`scripts/check-banned-claims.ts:2607`) was not among the addresses §1 named**, and it still opens
  *"117 document(s) carry zero banned claim literal outside the one named exemption region"* — a
  per-DOCUMENT quantifier the per-LINE matcher does not decide.
- **REPRODUCED, NOT ARGUED.** On a fresh `git archive HEAD` mirror with the gate binary's sha256 shown
  equal to the repository's, the round-7 bypass paragraph was appended to
  `agent-factory/workflows/13-incident.md`. Full transcript at §9.3.3. In one run, on one tree:
  - the **header** is TRUE — no single physical line of that document carries a pinned literal;
  - the **second PASS line** is FALSE — the document demonstrably carries three separately pinned
    members of the `token-economy` group, and the line says 117 documents carry zero.
- **LIVE COUNT: 1 address** (`scripts/check-banned-claims.ts:2607`, and its committed twin), **1
  demonstrated falsifying tree**. `grep -ac 'carry zero banned claim literal' scripts/check-banned-claims.ts`
  → **1**.
- **WHY THE ROOT CAUSE IS WORTH MORE THAN THE FIX.** §1 derived its site set over FILES — 13 of them,
  from a 780-file denominator, by command. **Inside each file the addresses were then enumerated by
  hand**, and `:2607` is what a hand enumeration misses. That is this repository's second diagnosed
  systemic failure class (set-literal drift) reappearing one level *inside* the remedy for the first
  one, which is the same shape `IN-01` had in round 6 and `WR-03` has in round 7. **A derivation that is
  derived at the file level and hand-written at the address level is a hand-written set wearing a
  derivation's name.**
- **REMEDY, named.** Rewrite `:2607`'s leading clause to the unit the mechanism decides — the header's
  own sentence is the specification — and derive the claim-site enumeration at the ADDRESS level, e.g. by
  asking the gate's own output rather than the source: every line the gate PRINTS is a published claim
  site, and there are few enough of them to enumerate mechanically.
- **NOT FIXED HERE, and the reason is a decision rather than a shrug.** `D-58` fences round 8 and states
  that a finding after this round becomes a backlog item or a follow-up phase, never a round 9. This plan
  writes records and moves no source file; a one-line edit to a shipped gate's published output at the
  close of a round, with its committed twin, its two permanent PASS-line cases and its extent pins, is a
  source change under a fence that this plan's own contract forbids. **Recommended as the FIRST item of
  the follow-up named in §8.4**, ahead of the four fence items above, because it is the only one of the
  six that is inside `LANG-04`'s own subject.
- **WHAT THIS DOES NOT CLAIM.** It does **not** claim `D-55` failed. The narrowing is real, it is
  demonstrated true at the header on a tree that carries the bypass, and it moved the module docblock,
  the profile's prose and the registry row with it. It claims the narrowing reached three of four
  addresses and that the fourth is named rather than left for round 9 to find.

---

**`V-29-60-06` — three gates run in continuous integration only as a side effect of their own test files.**

- **OPENED THIS ROUND** by plan `29-60`, from deriving §9's sweep command list rather than typing one.
  **Direction: FAIL-OPEN under one edit** — a `--exclude` pattern on the vitest step un-gates all three
  at once, silently.
- **Statement.** `.github/workflows/ci.yml` invokes **19 distinct commands, 18 of them once `npm ci` is
  set aside** (§9.1). Three gates that exist, ship and pass are in none of them:
  `scripts/check-uat-oracles.js`, and the two package scripts
  `freshness:queue` (`scripts/now-running-freshness.js`) and `freshness:traceability`
  (`scripts/trace-freshness.js`). Each runs in CI **only** because its own `.test.ts` spawns the
  committed `.js` inside the vitest step.
- **This is the workflow's own named defect, surviving three files past its own fix.** `ci.yml:154-158`
  states it in the first person about `check-kit-refs` and `check-public-docs-vocabulary`: *"A gate that
  runs only because some other step happens to run it is not wired; it is borrowed."* Those two were
  wired by hand, in plan 27-23. **The set of gates needing that treatment was never derived**, so three
  were left — which is the set-literal drift class again, at the wiring layer.
- **LIVE COUNT: 3 gates borrowed, of 17 that exist — and the denominator is derived, not counted by
  eye.** `ls scripts/check-*.js` → **10**; the freshness scripts → **7**; total **17**. Continuous
  integration names **14** of them (9 of the 10 `check-*`, and 5 of the 7 freshness gates).
  **14 + 3 = 17.** The three: `grep -ac 'check-uat-oracles' .github/workflows/ci.yml` → **0** and the
  same in `package.json` → **0**;
  `grep -ac 'freshness:queue\|freshness:traceability' .github/workflows/ci.yml` → **0**.
  Each gate's `.test.ts` spawns its committed `.js` (`scripts/check-uat-oracles.test.ts:10`,
  `now-running-freshness.test.ts:38`, `trace-freshness.test.ts:31`).
- **AND THE TWO FRESHNESS GATES ARE WORSE THAN BORROWED, WHICH IS THE PART A COUNT HIDES.** Their tests
  spawn the gate against `mkdtemp` fixture roots. **Nothing in continuous integration runs either gate
  against this repository's own tree at all.** Round 7's sweep ran them by hand and correctly recorded
  both as *vacuous passes* — no `.grugops/context/` tree exists yet — so the standing state is: a gate
  whose subject does not exist, exercised only against fixtures, invoked by no pipeline step.
- **REMEDY, named.** Wire all three into the ubuntu gate block beside the other eleven, and **derive the
  wired set** rather than extending the list again: enumerate `scripts/check-*.js` plus the freshness
  scripts, assert every member is named by a workflow step, and pin the count two-sided. A hand-added
  three would leave the fourth for the next reader.
- **NOT FIXED HERE.** `D-58`'s fence, and this plan changes no workflow file. **Recommended in §8.4.**

---

## 6. The `V-` roll-up, in BOTH directions — every marker in the tree, reconciled against round 7

Written by plan `29-60` under `D-58`. A roll-up that lists only what survived cannot be reconciled
against the previous round's list, so **every `V-` marker present in this tree** appears below with its
status after round 8 — closures, subsumptions, narrowings and untouched items included.

### 6.1 The set was DERIVED with round 7's own command, and BOTH counts were re-taken

Round 7 published **35**. That number is not carried: it is re-derived here **at round 7's own final
tree**, so that a disagreement between the two rounds would be attributable to the tree rather than to
the command.

```
$ grep -rhoaE 'V-29-[0-9]{2}-[0-9]{2}' --include='*.md' --include='*.ts' --include='*.js' \
       --include='*.json' --include='*.yml' . | sort -u | wc -l

  on a fresh `git archive d460a87` extract (round 7's final tree)   35
  on this tree (HEAD = 0b6e1f6)                                     40
```

**Round 7's published 35 is CONFIRMED, at its own tree, by its own command.** The entrants and the
departures are then a `diff` of the two sorted sets rather than a subtraction:

```
$ diff <(round-7 set) <(round-8 set)
> V-29-55-01
> V-29-57-01
> V-29-58-01
> V-29-59-01
> V-29-59-02

entrants: 5     departures: 0
```

**The three-way arithmetic, as an equality with both sides shown:**

```
40 markers in this tree  ==  35 confirmed present at round 7's final tree  +  5 entrants  -  0 departures

LEFT  = 40
RIGHT = 35 + 5 - 0 = 40   ✓
```

**Every entrant is named individually, with what it is and where it lives**, because "five new" is a
subtraction wearing a sentence:

| entrant | what it is | tracked files carrying it | opened by |
|---|---|---|---|
| `V-29-55-01` | **NOT A RESIDUAL — an id that was never opened.** `29-REVIEW.md`'s CR-02 fix proposes *"open `V-29-55-01` in `docs/audit/29-round7-residuals.md` §4"*. Round 8 opened the axis as `V-29-57-01` instead, in this file, because round 7's register is history and is never rewritten. The citation is carried here so a later reader does not mistake it for a live residual — **the same treatment `V-29-42-05` received in round 7** | **1** (`29-REVIEW.md` only) | nobody — a proposal |
| `V-29-57-01` | the hard-wrap axis, §4 | **14** | plan `29-57`, `D-56` |
| `V-29-58-01` | the enumeration axis, given an id for the first time in the phase, §2.4 | **7** | plan `29-58`, `D-55` |
| `V-29-59-01` | the uncommitted-working-`.js` window the build-parity repair moved, §5.1 | **4** | plan `29-59`, `D-57` |
| `V-29-59-02` | the working-tree parity assertion's missing Windows leg, §5.2 | **3** | plan `29-59`, `D-57` |

**Departures: 0, and that is a property of this trail rather than an accident.** A marker leaves this set
only if every citation of it leaves the tree, and prior rounds' registers are never rewritten — so a
closed residual keeps its id and changes its status, which is why §6.2 lists closures rather than
omitting them.

### 6.2 Every marker in the tree, with its status after round 8

**Live counts in this table were re-measured on the final tree by the command in the cell.** Where a
marker's subject was not touched by round 8, the re-measurement recorded is the one that establishes
exactly that: `git diff --numstat e848052..HEAD -- <subject>` reporting no change. *"Untouched"* is a
measurement here, not an assumption.

#### 6.2a The 19 markers round 7 listed at its §4.7a — status after round 8

| id | residual | status after round 8 | live count, re-measured | command |
|---|---|---|---|---|
| `V-29-26-01` | setext headings invisible to the section-extent authority | **carried, unchanged** — fail-open | 0 | `scripts/frontmatter.ts` byte-unchanged this round |
| `V-29-26-02` | non-recursive directory reads narrow the derived scans | **carried, unchanged** | live, unquantified — no command exists, and none was invented | subject untouched |
| `V-29-26-03` | `FENCE_DELIMITER_LINE` is a prefix test, not an equality | **carried, unchanged** — fail-open | 0 | `scripts/frontmatter.ts` byte-unchanged this round |
| `V-29-26-04` | indented fence delimiters classified as governed prose | **carried, unchanged** | **4** | `grep -a -c -E '^[[:space:]]+```' README.md` → 4; `README.md` byte-unchanged this round |
| `V-29-29-01` | the duplicated `sectionBody` — a third section-extent grammar | **closed in round 4** (plan 29-35) | — | — |
| `V-29-32-01` | a closed-fence, count-preserving swallow of the exemption region | **carried as SUBSUMED by `D-54`**, unchanged by round 8; its narrowed remainder survives | 0 live | `check-banned-claims.js` exit 0, `0 findings over 117/117` |
| `V-29-35-01` | a private `parseFrontmatter` beside the exported authority | **closed in round 5** (plan 29-40) | 0 | `scripts/generate-catalog.ts` byte-unchanged this round |
| `V-29-42-01` | a claim split across a hard wrap escapes the co-occurrence window | **closed by construction in round 6 — and its READING is superseded by `V-29-57-01`** (§4.6). The row itself is accurate and is not corrected | 0, no subject | §4.6 |
| `V-29-42-02` | a markdown table row puts two cells on one physical line | **closed by construction in round 6** | 0 | — |
| `V-29-42-03` | the exempt document's description of this gate is behind the source's | **closed in round 6**; in-source record deleted in round 7 | 0 | `grep -a -c 'V-29-42-03' scripts/check-banned-claims.ts` → 0 |
| `V-29-42-04` | a marker inside an HTML comment or link target satisfies co-occurrence | **closed by construction in round 6** | 0 | — |
| `V-29-42-05` | an id that was never opened; a citation only | **not a residual**, unchanged | n/a | — |
| `V-29-44-01` | the widened bare terms are a false-red surface over ordinary English | **carried, unchanged** — fail-CLOSED. The matcher is byte-identical across round 8 | **0** live over the corpus | `0 findings over 117/117 elements`; `lineHits` sha256 identical at `e848052` and HEAD |
| `V-29-47-01` | the in-source record of `V-29-42-03`, false on six counts | **closed by deletion in round 7** | 0 | `grep -a -c 'pinned pair' scripts/check-banned-claims.ts` → 0 |
| `V-29-47-02` | the region unbounded at the bottom | **carried as SUBSUMED**, remainder intact; **the region's EXTENT moved 66 → 75 this round** and the pin moved with it, twice, each value read off the gate's own refusal | 0 live; extent **75**, pinned at 75 | gate PASS line |
| `V-29-47-03` | the region's position pinned by nothing | **carried as SUBSUMED**, remainder intact | 0 live | gate PASS line |
| `V-29-47-04` | the surviving enumeration: a claim in words the list does not contain PASSES | **CARRIED, and it now has an id of its own — `V-29-58-01`, opened by plan `29-58` (§2.4) after asserting and falsifying the premise that round 7 had given it one.** The axis is unchanged; what changed is that it can be rolled up | **22** pinned literals, **0** live occurrences in the corpus; reach **not a finite set**, so no reach figure is published | `BANNED_CLAIM_LITERALS.length` = 22 via the PASS line; §2.4 |
| `V-29-47-05` | `LANG-04` marked Complete against a verifier's explicit verdict | **closed in round 7; re-measured here rather than carried** | **0** — `LANG-04` reads `[ ]` at `:82` and `Gaps Found` at `:183`; `LANG-07` reads `[x]` at `:85` and `Complete` at `:186` | `grep -na 'LANG-0' .planning/REQUIREMENTS.md` |
| `V-29-47-06` | the CI workflow describes both widened gates at their pre-widening scope | **closed in round 7** | 0 | — |

#### 6.2b The nine markers round 7 named as never rolled up — still not adopted, and now named twice

`V-29-29-02`, `V-29-29-03`, `V-29-29-04`, `V-29-29-05`, `V-29-30-01`, `V-29-30-02`, `V-29-30-03`,
`V-29-30-04`, and `V-29-42-05` (a citation, listed at §6.2a).

**Round 8 does not adopt, close or re-measure them either.** Round 7 named them and recorded that
adopting them would be a plan widening its own scope on the strength of its own finding; `D-58` puts them
outside this round's fence for the same reason plus one more — this is the final round, so adopting eight
residuals here would be opening work with nobody left to do it. **Their status is therefore unchanged and
their count is 8 residuals plus 1 citation, exactly as round 7 recorded, re-derived here from the same
`grep`.** They are carried into §8.4's recommendation with the other inherited items, so the next reader
meets them in a list of work rather than in a footnote.

#### 6.2c The eight markers round 7 opened — status after round 8

| id | status after round 8 | live count, re-measured | note |
|---|---|---|---|
| `V-29-49-01` | **carried, unchanged** | 2 filesystem reads per run, source-shape-pinned; behavioural witnesses **0** | **and it is NOT in `.planning/WINDOWS.md`** — see §6.3 |
| `V-29-50-01` | **carried, class OPEN** | 0 instances; class unbounded | — |
| `V-29-50-02` | **carried, unchanged** | EISDIR arm witnessed by an ordinary directory, not a submodule | `scripts/check-nul-bytes.ts` byte-unchanged this round |
| `V-29-51-01` | **carried — worked around, not fixed** | classifier unchanged | `scripts/audit-model.ts` byte-unchanged this round |
| `V-29-51-02` | **CARRIED, AND IT MOVED — 19 → 20 of 45**, and a round-8 plan moved it | **20 of 45** disagreeing `line:` fields | §6.3 — the numerator, the denominator AND the membership are all published |
| `V-29-53-01` | **carried** | declared remainder, unchanged | — |
| `V-29-53-02` | **carried** | **1** budget object per module; effective bound still 2 × | `grep -a -c '{ examined: 0 }' scripts/check-banned-claims.ts` → 1 |
| `V-29-53-03` | **carried** | declared remainder, unchanged | — |

#### 6.2d Markers opened by round 8 — eight

`V-29-57-01` (§4), `V-29-58-01` (§2.4), `V-29-59-01` and `V-29-59-02` (§5.1, §5.2), and
`V-29-60-01`, `V-29-60-02`, `V-29-60-03`, `V-29-60-04`, `V-29-60-05`, `V-29-60-06` (§5.4).

**That is ten ids and the heading says eight, and the difference is the point.** `V-29-57-01`,
`V-29-58-01`, `V-29-59-01` and `V-29-59-02` are in the derived marker set of §6.1 because they were
committed before this plan ran. **The six `V-29-60-*` ids are opened by this plan and are therefore NOT
in the 40** — they enter the tree in the same commit as this sentence. Stated rather than left to the
next round to discover:

```
markers in the tree BEFORE this plan's commit : 40
opened by this plan                           :  6   (V-29-60-01 .. V-29-60-06)
markers in the tree AFTER this plan's commit  : 46   (predicted; re-derived and confirmed at §9.5)
```

A roll-up that counted its own additions inside its own derivation would be measuring itself. The
prediction is written down here and the derivation is re-run in the sweep, so the two can disagree.

#### 6.2e Residuals carried from SUMMARYs, not `V-`-numbered

| id | residual | status after round 8 | live count, re-measured |
|---|---|---|---|
| 29-44 **R1** | 30 disposition rows can never match, because their `file` cell is a code span | **carried, open** — fail-CLOSED | **30** code-span `file` cells over **1534** rows read under `## Dispositions` across `docs/audit/29-style-dispositions/`, all in `29-12.md` — re-derived, identical to round 7 |
| 29-43 **R2** | `CHANGELOG.md:67` still reads a retired token-cost phrase outside `BANNED_CLAIM_LITERALS` | **carried, unmoved** — fail-open. **This is `V-29-58-01` with a live instance**, and it is the one place in this tree where the enumeration axis is occupied rather than merely reachable | **1**, at `CHANGELOG.md:67`; the file is byte-unchanged this round |
| 29-45 **R4** | unmeasured assertions about an external tool's behaviour | **carried** — numbered `V-29-50-01` | 0 instances; class unbounded |
| 29-46 **R1** | the acceptance grep `0*15` is a substring pattern, not a cardinality predicate | **carried** — fail-CLOSED | **0** |
| 29-46 **R2** | nothing reds if two workflows declare the same `order` | **closed in round 7** | **19** workflow files, re-derived: `git ls-files 'agent-factory/workflows/*.md'` → 19 |
| 29-53 R1–R3 | see `V-29-53-01`/`-02`/`-03` | numbered and carried | §6.2c |

### 6.3 The net movement, stated plainly rather than as progress

**Closed this round: 0.** No `V-` marker moved from open to closed. Round 8 was not a closing round: it
narrowed a published claim, disclosed an axis, repaired a gate and wrote this record.

**Opened this round: 10** — four in the round's code plans (`V-29-57-01`, `V-29-58-01`, `V-29-59-01`,
`V-29-59-02`) and six in this one (`V-29-60-01` .. `-06`).

**Net on the `V-` register: +10, the largest of any round in this phase.** Three readings, and the second
and third are the ones that matter:

- **`V-29-58-01` is not a new residual and counting it as one over-states the movement.** It names an
  axis this repository has disclosed since plan `29-02`, in the gate's source, in the profile's prose and
  in round 5's close, which never carried an id. Plan `29-58` was handed the premise that round 7 had
  given it one, **asserted the premise, and found it false** (§2.4). The axis did not grow; the register
  finally caught up with it.
- **Of the ten, ZERO are fail-open on a verdict path.** `V-29-58-01` and `V-29-57-01` are fail-open and
  both are matcher-completeness axes at **0 live** occurrences. `V-29-59-01` is fail-open only inside an
  uncommitted local window that cannot exist on a runner. `V-29-59-02` is a platform scope. `V-29-60-01`
  through `-04` are fail-closed or not verdict paths. `V-29-60-05` is a **claim**, not a matcher — the
  gate's verdict is correct and its published sentence is wider than the verdict. `V-29-60-06` is
  fail-open under an edit nobody has made. **A round that opens ten residuals and none of them changes a
  verdict has spent its looking on accuracy, which is a different thing from having found nothing.**
- **Six of the ten were found by DERIVING a set that a plan or a review supplied as a list.** §1's
  13-file claim-site derivation over a 780-file denominator (2 findings), §4.2a's reach derivation
  (1 correction), §2.4's premise assertion (1 finding), and §9.1's command-list derivation plus §3's
  address-level reading (2 findings). **That ratio is the round's actual result** — not the ten, and not
  the zero closures.

**One carried marker MOVED without any plan intending it, and it is published rather than absorbed.**
`V-29-51-02` — the registry's advisory `line` fields — was **19 of 45** at round 7 and is **20 of 45**
here. The harness's own premise was asserted first, because a re-derivation that disagrees with a
published number is worthless until it can reproduce that number:

```
predicate (reconstructed from round 7's own detail: START disagreement OR LENGTH disagreement)

  on a fresh extract of round 7's final tree   : 18 START + 2 LENGTH -> 19 of 45   <- round 7 published 19
  on this tree (HEAD)                          : 19 START + 2 LENGTH -> 20 of 45

  membership diff: C-28-042 LEFT the set;  C-28-045 and C-28-046 ENTERED it
```

**Round 7's 19 is reproduced exactly before the new value is believed.** The cause is identified and it
is inside this round: plan `29-58` inserted twelve lines into the exemption region, moved `C-28-042`'s own
`line:` field correctly with its block, and left the two rows *below* it — `C-28-045` and `C-28-046` —
declaring positions eight lines above where their anchors now sit. **The field is advisory and no gate
consults it, so nothing failed; it is recorded because a number that stays still while its membership
turns over is a number a later reader would mis-read as untouched.**

**A second discrepancy with round 7, on a different subject.** Round 7's §4.7c states that its eight
opened ids are *"each in `.planning/WINDOWS.md`"*. Re-measured: `V-29-49-01` is **not** there
(`grep -ac 'V-29-49-01' .planning/WINDOWS.md` → 0), and neither are round 8's `V-29-59-01` or
`V-29-59-02`. The ledger carries **23** of the 40 markers in the tree. Recorded, not corrected —
appending to the ledger from inside the register that measures it destroys the measurement, and `D-58`
fences this plan to one file. **Recommended in §8.4.**

### 6.4 The carried-count assertion

**Statuses in this register re-measured on the final tree: every one. Statuses carried from a plan
SUMMARY without re-measurement: 0.**

That is asserted by construction rather than by claim. §9.4 compares **every** number this round
published — in a plan SUMMARY or in this file — against a measurement taken in §9, and where the two
disagree the published value is the **re-taken** one, with both printed. The two comparisons whose
subject is a historical tree (round 7's marker count, and round 7's `line:`-drift ratio) were re-measured
**at that tree**, on a fresh `git archive d460a87` extract, not accepted from the document that wrote
them — which is what turned the second one from an agreement into a reproduction of a predicate.

### 6.5 The false results this round's own harnesses produced — six, and five are this plan's

Every round of this phase has produced at least one. **"None" and "nobody looked" are the same sentence
unless the count of premises asserted is given**, so both numbers are here.

**Premises asserted before use in this plan: 5.** (1) that plans `29-56`..`29-59` are committed with
their SUMMARYs present, before any disposition was written; (2) that round 7's published marker count is
reproducible by its own command at its own tree, before the entrant/departure diff was believed; (3) that
round 7's `line:`-drift predicate is reconstructable, before the 20 was published; (4) that each mirror's
gate binary hashes equal to the repository's, before any reproduction verdict was read; (5) that each
clean mirror is green, before any planted mirror's red or green was read.

| # | the false result | how it was caught | recorded where |
|---|---|---|---|
| 1 | **`29-58`'s handed premise** — *"the enumeration axis carries the id round 7 gave it"*. Round 7 gave it none, and neither did rounds 4, 5 or 6. | The premise was asserted before use, by deriving every `V-` id's context window across every register | §2.4, by plan `29-58` |
| 2 | **This plan's first attempt at the matcher-unchanged assertion.** `grep -c 'literal:' scripts/check-banned-claims.ts` moved **23 → 24** across the round, which reads as a literal added to `BANNED_CLAIM_LITERALS`. **It is a prose comment line containing the word `literal:`.** The list itself is byte-identical: 22 members, unchanged. | The count was not believed; the two lists were `diff`ed member by member instead | here |
| 3 | **This plan's first attempt at the wrap-joined-assembly assertion.** An alternation grep returned **1** hit in each twin, which reads as the declined remedy having been built. The hit is `wrap-joined`, the **prose** naming the remedy at `:89`; the identifier `wrapJoined` is **0** in both. | Re-run per pattern instead of as an alternation, then confirmed by `diff`ing the two files' function sets (0 added, 0 removed) | here, and §3.2 `G1-a` |
| 4 | **This plan's first draft of §3.3's second equality**, which put `G1-b` in two buckets and needed a clause to reconcile itself. | The buckets were re-derived from the eight rows rather than from the narrative | §3.3 |
| 5 | **This plan's first attempt at the build-parity discrimination.** The PRE-FIX gate was run by copying it over `scripts/freshness.js` **inside the post-fix clone**. It exited **1**, which reads as *"the pre-fix gate catches the plant too"* and would have destroyed `D-57`'s whole evidence. It does not: the output named `scripts/freshness.js` — the file the harness had just made stale — and named the planted `hooks/guard.js` **zero** times. **The exit code was right for the wrong file.** | The OUTPUT was read instead of the status, then the discrimination was re-run on a genuine clone of the pre-fix tree | §9.3.4 |
| 6 | **This plan's first draft of §9.4's reconciliation summary**, which said *"30 compared, 23 agreeing, 7 disagreeing"* — three numbers, and two of them wrong, from enumerating the disagreements in prose instead of by row id. **Round 7's reconciliation section made the identical mistake in the identical place.** | The disagreeing row ids were listed INSIDE the count so the count could be checked against them | §9.4 |

**Findings 2 and 3 are the same defect and it is worth naming: a grep whose PATTERN is broader than the
thing it is asserting about.** Both would have published a false "the matcher is unchanged" or a false
"the remedy was built" with a command printed beside them, which is the shape this register treats as
evidence. **The correction in both cases was to derive the ELEMENT SET and compare it, rather than to
compare a count over a pattern** — the same lesson §1 records about site lists and §3.4 records about
addresses, arriving for the third time in one round through a different door.

**Finding 5 is the phase's own terminal lesson arriving one last time: a green or a red is not a verdict
until you have read WHICH SUBJECT it is about.** An exit code is a one-bit summary of a run whose subject
the harness itself had changed. **Findings 4 and 6 are one shape too** — a summary line composed from the
narrative rather than derived from the rows it summarises — and its recurrence across two consecutive
rounds, at the same address in the document, is recorded so the next reader treats a reconciliation's own
totals as the least-checked numbers in it.

**Five premises asserted, six false results caught, zero shipped.** That ratio is the honest measure of
this round's harness discipline, and it is the reason both numbers are printed rather than one.

---

## 7. The phase close — what Phase 29 claims, and what it does not

Written by plan `29-60` under `D-58`. **This is the last thing written about Phase 29 inside Phase 29,
and it is the load-bearing half of this record.** The phase ships a set of guards. The honest question at
the end is not which requirement ids are ticked, but **which sentences about this kit are true** — so
this section is written at the granularity of a mechanism: which gate decides which predicate over which
derived set, with every number read off that gate's own output on the final tree.

Two rules bind it. **It is written against the roadmap's five success criteria, not against the plan
list** — sixty plans executed is a measurement of effort, and the criteria are the measurement of the
thing. And **it may not exceed the kit's own honesty floor**; §7.4 puts the profile's statement and this
section's beside each other and shows which is narrower.

### 7.1 The five success criteria of `.planning/ROADMAP.md` § *Phase 29*, each against its mechanism

Every number below is quoted from a live run on the final tree, not from a plan.

---

**Criterion 1 (LANG-01) — *"The kit ships a grugops-authored, ASD-STE100-derived writing profile —
enumerated rules plus a project Technical Names/Verbs set — with a non-affiliation and not-certified
disclaimer, vendoring no part of the ASD dictionary."***

**Mechanically true, by three separate gates, and one clause of it is a human fact no gate can hold.**

- The Technical Names set is **derived, never listed**: `guard_imperative_lexicon` publishes
  *"`LANG-01`: 76 Technical Name(s) DERIVED from the kit, never listed — roleDisplayNames 17,
  workflowDisplayNames 19, configKeys 21, noteKinds 6, boardColumns 13"*. **17 + 19 + 21 + 6 + 13 = 76**,
  checked by hand here. The approved-verb set is a closed list of **43** members, published on the same
  run. That the set is derived rather than typed is what makes *"never listed"* a mechanism rather than
  an intention.
- The disclaimer is **frozen byte-for-byte**. `check-claim-anchors.js` and `check-banned-claims.js` both
  hold `agent-factory/writing-profile.md` § *Disclaimer and honesty floor* against
  `docs/audit/28-claim-registry.md`: **6 registry-anchored blocks** — `C-28-039`, `C-28-043`, `C-28-044`,
  `C-28-042`, `C-28-045`, `C-28-046` — *"frozen byte-for-byte … pinned at 6"*, on the gate's own PASS
  line. An edit to the non-affiliation sentence that does not move its registry row in the same commit
  reds by name.
- **What no gate holds: that no part of the ASD dictionary is vendored.** That is a negative about bytes
  nobody put in the repository, and the evidence for it is a first-hand negative record in `C-28-043`'s
  `mechanism:` field — `pdftotext` against the official distribution returning
  *"Permission Error: Copying of text from this document is not allowed"*, with no attempt made to defeat
  it. **It is true and it is not mechanical, and this close says which.**

---

**Criterion 2 (LANG-02, LANG-03) — *"The profile governs workflow steps, checklists, memory-bank,
shared-context notes, board, and traceability; it leaves the fenced caveman identity blocks alone; and a
named safety-surface exclusion list keeps load-bearing security, compliance, and admission text from
being reworded by a style pass."***

**The first two halves are mechanical. The third is a derived LIST honoured by review, and the difference
is worth the sentence.**

- `guard_sentence_form` publishes the corpus as **derived in four parts**: *"`LANG-02`: 47 governed
  document(s) in 4 derived part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2; 1
  excluded by the derived `GENERATED` marker; 3 location(s) excluded by name … 47 of 47 opened."*
  **19 + 13 + 13 + 2 = 47**, checked by hand. Each excluded location carries its reason in the gate's own
  output, so an exclusion is a sentence somebody wrote rather than an absence.
- The caveman blocks are left alone **by construction, in both directions**: `agent-factory/roles/` is one
  of the three named exclusions from the sentence-form corpus, on the stated ground that a second
  predicate over the same bytes from a second module is how two gates come to disagree; and the blocks
  have their own guard, `guard_caveman_voice`, reporting *"0 findings over 17/17 elements"*.
- **The safety-surface list is generated and honoured by REVIEW, not by a gate.**
  `docs/audit/28-safety-surface-exclusions.md` is machine-generated (**41 entries**, derived from the
  disposition register's `safety_surface: yes` rows ∪ the claim registry's `kind: safety` rows) and its
  own text says what honouring it means. **Nothing in this repository reds if a listed file's prose is
  reworded.** The list is a mechanism for KNOWING which files those are; the honouring is human.

---

**Criterion 3 (LANG-04) — *"The guards are named for the decidable subsets they check …, and nowhere in
the kit is ASD-STE100 conformance claimed, nor a token-economy win, nor an LLM-comprehension benefit
(that one stays `UNKNOWN - verify`); `guard_banned_claims` holds that prohibition mechanically rather
than by discipline."***

**The naming half is true and was never in doubt. The prohibition half is where seven rounds went, and
what is true of it is now narrower than this criterion's own wording — deliberately, by `D-55`.**

- **Naming:** the two guards are `guard_imperative_lexicon` (*"every `## Steps` bullet begins with a verb
  from the closed approved set, in bare imperative form, at position zero"*) and `guard_sentence_form`
  (*"sentence length by section anchor — 20 words procedural, 25 descriptive — plus four banned
  constructions over closed token sets"*). Each header states its own predicate. **Neither claims
  conformance**, and `guard_sentence_form` publishes the predicate it deliberately does NOT check:
  *"passive voice is deliberately NOT checked (D-15)"*.
- **The prohibition, stated at the mechanism.** `guard_banned_claims`'s header on the final tree:

  > *"no single physical line of the 117 derived document(s) this gate scans carries any of the 22 pinned
  > claim literal(s), outside the registry-anchored blocks of one named exemption region"*

  **That sentence is what the phase claims**, and every number in it is interpolated from the run:
  **117** documents in six derived parts (kit 73, publicDocs 11, installReadme 1, skillSources 7,
  claudeAdapters 24, pluginManifests 2, minus 1 overlap), **22** pinned literals across **3** groups
  matched unconditionally, **1** exemption region suppressing **14** occurrences (standard-name 8,
  token-economy 2, comprehension 4) over **75** lines, of which **23** sit in **6** registry-anchored
  frozen blocks and **52** are freely editable and **scanned**.
- **Read the criterion's own wording beside it.** The criterion says *"nowhere in the kit is … claimed"*.
  **The gate does not decide that and this close does not claim it.** What is mechanical is the sentence
  quoted above. The distance between the two is named, counted and directed at §7.3 items 1 and 2, and
  the criterion's wider wording is exactly the defect `D-55` was taken to remove — *"a prohibition that
  publishes a wider scope than its mechanism is the exact defect `LANG-04` exists to prevent"*.

---

**Criterion 4 (LANG-06) — *"The rebuilt voice guard fails RED on all 17 current caveman blocks as
acceptance evidence before the rewrite lands, measures against a committed lexicon rather than sentence
shape, and publishes a number with a denominator."***

**All three halves are mechanically true, and the first is a historical measurement rather than a live
one — which is what acceptance evidence is.**

- `guard_caveman_voice` publishes *"every role's caveman block carries >= 2 of the 16 committed lexicon
  terms AND zero banned constructions — both arms required (D-06, D-07, D-08)"* and reports
  **"0 findings over 17/17 elements"** — a number with its denominator, in the gate's own line.
- The lexicon is **committed** (`scripts/voice-model.ts`, 16 terms) rather than inferred from shape,
  which is the half `LANG-06` exists to fix.
- **The RED-on-17 acceptance evidence is durable**: recorded in `docs/audit/28-claim-registry.md`'s
  **`C-28-003`** `mechanism:` field (`:100`) — *"The guard was watched failing RED on all 17 blocks in
  plan 29-01 before it was allowed to pass, so a green run from it is a measurement and not a
  construction"* — and the same row carries the derived-set caveat that the set is **17, not the 18
  markdown files on disk**, because `kit-model.listRoles()` drops underscore-prefixed entries. **A green
  run today is credible because that transition is on the record**, not because the run is green. *(The
  row id was checked rather than remembered: `grep -na '^### C-28-0' docs/audit/28-claim-registry.md`
  puts `:100` inside `C-28-003`, which begins at `:93`.)*
- The companion guard, `guard_voice`, holds the reverse direction — clear-voice surfaces free of caveman
  markers — at **"0 findings over 19/19 elements"**.

---

**Criterion 5 (LANG-05, LANG-07, LANG-08) — *"`## One job`, the caveman block, and `## Responsibilities`
each say a thing once; `guard_imperative_lexicon` … and the rebuilt voice guard read the fence through
ONE parser, never two grammars over the same bytes; and byte ceilings are re-baselined exactly once at
end of phase with every file ≤ its previous value and the delta recorded — never raised mid-phase."***

**Two of the three are mechanical. The third is met under a standing human override, and that is stated
rather than folded in.**

- **Say each thing once:** `guard_role_clause_uniqueness` — *"no normalized clause repeats within a single
  role file — intra-file only"* — reports **"0 findings over 17/17 elements"**.
- **One fence parser:** `readCavemanFence` (voice guard) and `stripFencedBlocks` (lexicon guards) both
  compose `scripts/frontmatter.ts`'s `FENCE_DELIMITER_LINE` / `sectionEndIndex`. `LANG-07` is the one
  `LANG` row that reads `[x]` / `Complete` on the final tree, applied in round 7 under the round-6
  verifier's named authority. **`scripts/frontmatter.ts` is byte-unchanged across round 8**
  (`git diff --numstat e848052..HEAD -- scripts/frontmatter.ts` → no output), so the round introduced no
  second grammar and removed none.
- **Byte ceilings: NOT re-baselined. Met by a human override, quoted verbatim at §7.2.**
  `guard_role_size` on the final tree: **16 roles PASS within ceiling, 1 WARN approaching ceiling
  (`agent-factory/roles/security-nfr.md` 4931B ≥ 4830B), 0 FAIL.** The ceiling function was never raised.

### 7.2 The `LANG-08` override, repeated verbatim with its acceptor and its date

`29-VERIFICATION.md` frontmatter `overrides:`, quoted rather than paraphrased:

> **must_have:** "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <=
> previous, delta recorded, never raised mid-phase"
>
> **reason:** "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline), accepted
> 2026-08-15 and carried unchanged through rounds 1-7. Re-checked this round: `roleCeiling()` untouched
> since the override; the one role-file edit since the round-4 (8/8) verification (`022a4ea`,
> incident-responder.md 3481B -> 3485B) is a normal within-ceiling edit, not a rebaseline, and its own
> commit message records the ceiling function's sha256 as unchanged. `guard_role_size` runs live at HEAD:
> 16 roles PASS within ceiling, 1 WARN approaching ceiling (security-nfr.md), 0 FAIL."
>
> **accepted_by:** "Olger Oeselg"
> **accepted_at:** "2026-08-15T09:57:04Z"

**Re-checked live on round 8's final tree, and the override's own numbers are re-taken rather than
carried:** `node scripts/check-foundation-guards.js` → `guard_role_size` reports **16** *"within
ceiling"* lines, **1** `WARN` (*"agent-factory/roles/security-nfr.md 4931B >= 4830B — approaching
ceiling"*), **0** `FAIL`. **16 + 1 = 17**, the derived role set. Identical to the override's recorded
state. **No role file was edited by any round-8 plan** (`agent-factory/roles/` appears in **0** of the 19
changed paths, §8.4), so the override is carried by measurement rather than by assumption.

### 7.3 What Phase 29 does NOT claim — every open axis, with its direction and its live count

**This list is longer than §7.1's and that is the honest shape of it.** A green run from any gate named
above is a measurement of what that gate measured; each item below says what that leaves.

1. **The enumeration limit is `BANNED_CLAIM_LITERALS` itself, and a conformance, token-cost or
   comprehension claim written in words the list does not contain PASSES.**
   **Id: `V-29-58-01`. Direction: FAIL-OPEN. Live count: `UNKNOWN - verify` BY CONSTRUCTION, deliberately
   not `0`** — the unlisted phrasings are not an enumerable set, so no command counts them and none is
   invented (§2.4). The list has **22** members across **3** groups; the reach is the complement of a
   22-member enumeration, which is not a finite set, so **no reach figure is published**. The axis has
   been disclosed since plan `29-02` and carried an id only from plan `29-58`.
2. **A pinned multi-word literal split across an ordinary hard wrap is not matched.**
   **Id: `V-29-57-01`. Direction: FAIL-OPEN. Live count: 0**, over the gate's own derived corpus —
   **117 documents, 4126 adjacent non-blank line pairs, 11 wrap-reachable members** (§4.3). **Reach: 11
   of 22**, derived, not the 16 the round-7 review published (§4.2a). Its remedy is named in full and
   **declined by `D-56`**, with the reason on the record. Mid-phrase wrapping is this kit's own house
   style — **757 mid-sentence wraps over 2612 adjacent pairs in 73 files, roughly three in ten** — so the
   bypass shape is ordinary rather than exotic.
3. **The gate's SECOND published line still states a per-DOCUMENT quantifier over a per-LINE mechanism.**
   **Id: `V-29-60-05`. Direction: the published claim is wider than the mechanism. Live count: 1 address**
   (`scripts/check-banned-claims.ts:2607` and its twin), **1 demonstrated falsifying tree** (§9.3.3).
   `D-55`'s narrowing reached the header, the module docblock, the profile's prose and the registry row;
   it did not reach this one, because §1's site set was derived at the FILE level and enumerated by hand
   at the ADDRESS level.
4. **The safety-surface exclusion list is honoured by review, not by a gate.** **Direction:
   informational. Live count: 41 entries**, generated. Nothing reds if a listed file's prose is reworded.
5. **Four round-7 findings are open under `D-58`'s fence, each with an owner.** `V-29-60-01` (a false
   in-source claim about a cardinality; **1** statement, **0** live subjects), `V-29-60-02` (an overrun
   reported as a byte divergence; **0** live), `V-29-60-03` (a second anchor grammar in a test harness;
   **2** declarations in the tree), `V-29-60-04` (a coverage arithmetic that can over-report; **0** live).
   **None is fail-open.** §5.4.
6. **Three gates run in continuous integration only because their own tests spawn them.**
   **Id: `V-29-60-06`. Direction: FAIL-OPEN under one `--exclude` edit. Live count: 3 of 17**, and two of
   the three have never run against this repository's own tree at all. §5.4.
7. **The three subsumed carve-out residuals were SUBSUMED, not pinned, and each keeps its remainder.**
   `V-29-47-02`, `V-29-47-03`, `V-29-32-01`: an append, a translation or a swallow carrying **no** banned
   claim is still invisible, and **the region's start index is still pinned by nothing**. **Live count: 0
   live each; the region's extent is 75, pinned two-sided.**
8. **The build-parity repair moved two pieces of coverage rather than adding them.** `V-29-59-01` — a
   hand-edited, **uncommitted** working `.js` is no longer this gate's finding; **direction fail-open
   inside that window only, live count 0** on this tree, and the window cannot exist on a runner.
   `V-29-59-02` — the working-tree parity assertion has no Windows leg; **live count 1 of 2 matrix legs**.
9. **Eight `V-` markers in this tree have never been rolled up by any round.** `V-29-29-02` .. `-05`,
   `V-29-30-01` .. `-04`. Round 7 named them and did not adopt them; round 8 does not either, by `D-58`.
   **Live count: 8 residuals, statuses unknown to every register including this one.** §6.2b.
10. **Six of the eight `LANG` requirement rows do not reflect their verified state**, by a bookkeeping
    trail the round-7 verifier traced to a round-3 blanket revert. **No round-8 plan moves one** (§8.3),
    and the recommendation at §8.2 applies nothing.
11. **A green run from every gate in §7.1 is a measurement of the corpus each derives, at the moment it
    ran.** The banned-claim corpus is **117** documents; `scripts/` is outside it **by construction**, and
    §1 row 13 records a live restatement of a disproven claim sitting there, invisible to the gate.
    **Live count: 1 occurrence plus its committed twin.**
12. **This phase's record is that a green suite is not proof for a safety invariant in this repository.**
    Eight rounds, and **every one produced at least one false harness result**; round 8 produced **6**
    (§6.5) against **5** premises asserted, and **shipped none of them**. That is a property of the
    measurement discipline, not a mood.

### 7.4 The close does not exceed the kit's own honesty floor — the two sentences, side by side

`agent-factory/writing-profile.md` § *Disclaimer and honesty floor*, as plan `29-58` leaves it:

> "The gate proves that no pinned literal appears on any single scanned line outside this section; it
> does not prove that no such claim exists."

This section's claim sentence, §7.1 criterion 3:

> "No single physical line of the 117 derived documents this gate scans carries any of the 22 pinned
> claim literals, outside the registry-anchored blocks of one named exemption region."

**The two assert the same thing, and this one asserts less in one respect and no more in any.** Both
quantify over **single lines**, both over **pinned literals**, both **outside the one region**. This
section adds two derived numbers — 117 and 22 — which narrow the sentence by naming the sets rather than
widening it, and it adds *"the registry-anchored blocks of"*, which is **narrower** than the profile's
*"this section"*: 23 of the region's 75 lines are frozen and the other 52 are scanned. **Neither sentence
claims that no such claim exists.** The profile says so in those words; §7.3 items 1, 2 and 3 say it with
three ids, three directions and three live counts.

---

## 8. The requirement rows this round RECOMMENDS and does not move, and the scope fence, shown to have held

Written by plan `29-60` under `D-58`. **This section applies nothing.** It reads
`.planning/REQUIREMENTS.md`, prints what is there, records what this round's evidence supports moving and
under whose authority, and then proves by command that no plan of this round touched the file.

**Why the assertion is worth its space.** This is the phase whose requirement rows were once **inverted by
an automated marker acting on a plan's own `requirements-completed:` field before any verification
existed** (`V-29-47-05`). The assertion is cheap and the history is not.

### 8.1 Every `LANG` row's current value, read from the file

**Checkbox rows, `.planning/REQUIREMENTS.md:79-86`:**

| line | row | current value |
|---|---|---|
| `:79` | LANG-01 | `[ ]` |
| `:80` | LANG-02 | `[ ]` |
| `:81` | LANG-03 | `[ ]` |
| `:82` | LANG-04 | `[ ]` |
| `:83` | LANG-05 | `[ ]` |
| `:84` | LANG-06 | `[ ]` |
| `:85` | LANG-07 | **`[x]`** |
| `:86` | LANG-08 | `[ ]` |

**Traceability rows, `.planning/REQUIREMENTS.md:180-187`:**

| line | row | current value |
|---|---|---|
| `:180` | LANG-01 \| Phase 29 | `Gaps Found` |
| `:181` | LANG-02 \| Phase 29 | `Pending` |
| `:182` | LANG-03 \| Phase 29 | `Gaps Found` |
| `:183` | LANG-04 \| Phase 29 | `Gaps Found` |
| `:184` | LANG-05 \| Phase 29 | `Gaps Found` |
| `:185` | LANG-06 \| Phase 29 | `Gaps Found` |
| `:186` | LANG-07 \| Phase 29 | **`Complete`** |
| `:187` | LANG-08 \| Phase 29 | `Pending` |

**8 checkbox rows and 8 traceability rows, both read from the file at HEAD. One row of each pair reads
complete, and it is the same requirement: `LANG-07`.**

### 8.2 What this round's evidence supports moving, and the authority for each

**Applied by nothing here. Every row below still reads exactly as §8.1 prints it.**

| rows | recommended movement | authority that may apply it | why it is not applied here |
|---|---|---|---|
| LANG-01, LANG-02, LANG-03, LANG-05, LANG-06 | `[ ]` / `Gaps Found` or `Pending` → `[x]` / `Complete` | **`29-VERIFICATION.md` § *REQUIREMENTS.md correction recommended*, `:119-134`** — the round-7 verifier's own table, which states the reason the rows are stale (a round-3 blanket revert at `12c77ef` that predates the round-4 8/8 verification) and re-ran the live gate for each of the six against the current tree | House rule 9: no requirement is marked by a plan. The verifier's own report says applying it *"is a follow-up step, not part of this verifier's own action"* |
| LANG-08 | `[ ]` / `Pending` → `[x]` / `Complete` **via the standing override** | the same table, plus the standing human override quoted verbatim at §7.2 (`accepted_by: Olger Oeselg`, `accepted_at: 2026-08-15T09:57:04Z`) | same, and the override is a human's to carry |
| LANG-07 | **no change** — already `[x]` / `Complete` | applied in round 7 by plan `29-48` under `29-VERIFICATION-round6.md`'s named authority; confirmed legitimate by the round-7 verifier | nothing to do |
| **LANG-04** | **no change here.** Its movement is **conditional on the narrowed claim verifying, and on nothing else** | **a future verifier**, reading `D-55`'s narrowing, §3.2 rows `G1` and `G1-c`, and `V-29-60-05` | **`29-VERIFICATION.md` gap 1's third `missing:` bullet makes re-running the reproduction against a fix a precondition of recommending `LANG-04 → Complete`. `D-56` declines the fix, so that precondition is NOT met on its own terms** (§3.2 `G1-c`). This register records the evidence — the narrowing, the two open axes, and the one address the narrowing did not reach — and makes no determination |

**The `LANG-04` row is the one this round is about, and this is the plainest statement of it:** round 8
narrowed the published claim to the predicate the gate decides, demonstrated that narrowed claim TRUE on
a tree carrying the round-7 bypass, and found one further address where the wider wording survives.
**Whether that closes `LANG-04` is the verifier's call and it is not taken here.**

### 8.3 No requirement row moved — five checks, run individually, all five quoted

```
$ git diff --numstat <each commit>^ <each commit> -- .planning/REQUIREMENTS.md

  plan 29-56  (3 commits: c119115, a1c7938, b90712b)   -> no output   byte-unchanged
  plan 29-57  (3 commits: cc758fd, 59b0ed5, 6a83b31)   -> no output   byte-unchanged
  plan 29-58  (4 commits: bf1b94e, 638ff39, 2c40344, 020905f) -> no output   byte-unchanged
  plan 29-59  (4 commits: 7cebe32, 7e42b3d, 0ad875a, 0b6e1f6) -> no output   byte-unchanged
  plan 29-60  (this plan, task commits + working tree)  -> no output   byte-unchanged

$ git diff --numstat e848052..HEAD -- .planning/REQUIREMENTS.md
  (no output — byte-unchanged across the round's entire commit range)
```

**Five individual results, five reporting no change, plus the range check.** `29-VERIFICATION.md`'s six
stale rows are therefore exactly as stale as the round-7 verifier found them, which is the state a
follow-up authority needs in order to act on its own report.

### 8.4 The scope fence — every changed path matched to the decision that authorised it

`D-58` states the fence: **in scope** are `D-55`'s narrowing, `D-56`'s disclosure and comment correction,
`D-57`'s parity repair, and the round-8 disposition record. **Out of scope** are (a) a wrap-joined matcher
input assembly, (b) any new matcher-completeness axis at 0 live, and (c) anything outside
`LANG-01..08`'s text.

**All 19 paths changed in `e848052..HEAD`, each matched to the decision id that authorised it.** The
authoring plan of each is derived from `git log --format='%s' -- <path>`, not assigned by hand:

| # | path | authoring plan(s) | decision |
|---|---|---|---|
| 1 | `scripts/check-banned-claims.ts` | 29-56, 29-57, 29-58 | `D-55` (the narrowing) + `D-56` (the residual-comment correction) |
| 2 | `scripts/check-banned-claims.js` | same, rebuilt in the same commits | `D-55`, `D-56` — a derived artifact; `npm run freshness` holds it |
| 3 | `scripts/check-banned-claims.test.ts` | 29-56, 29-57 | `D-55`, `D-56` — the permanent cases holding both |
| 4 | `agent-factory/writing-profile.md` | 29-58 | `D-55` — the honesty floor stating the predicate the gate decides |
| 5 | `docs/audit/28-claim-registry.md` | 29-58 | `D-55` — `C-28-042`'s row, moved in the SAME commit as its verbatim |
| 6 | `scripts/freshness.ts` | 29-59 | `D-57` |
| 7 | `scripts/freshness.js` | 29-59 | `D-57` — derived artifact |
| 8 | `scripts/freshness.test.ts` | 29-59 | `D-57` — the discrimination pair |
| 9 | `.github/workflows/ci.yml` | 29-59 | `D-57` — the reorder and the parity step |
| 10 | `package.json` | 29-59 | `D-57` — **one line**, the `check:build-parity` script |
| 11 | `.gitignore` | 29-59 | `D-57` — `.temp/`, the hermetic clone root the repaired gate's own tests build |
| 12 | `docs/audit/29-round8-residuals.md` | 29-56, 29-57, 29-59, 29-60 | `D-58` — the round-8 disposition record |
| 13 | `.planning/WINDOWS.md` | 29-56, 29-57, 29-58 | `D-58` — the ledger entries for the ids the round opened |
| 14 | `.planning/STATE.md` | 29-56 .. 29-59 | `D-58` — the round's own execution state |
| 15 | `.planning/ROADMAP.md` | 29-56 .. 29-59 | `D-58` — per-plan progress |
| 16 | `.planning/…/29-56-SUMMARY.md` | 29-56 | `D-58` |
| 17 | `.planning/…/29-57-SUMMARY.md` | 29-57 | `D-58` |
| 18 | `.planning/…/29-58-SUMMARY.md` | 29-58 | `D-58` |
| 19 | `.planning/…/29-59-SUMMARY.md` | 29-59 | `D-58` |

**Changed paths matched to no decision: 0.**

**One row needs its authority stated rather than assumed, because reading it carelessly makes the fence
look broken.** Rows 6–11 are outside `LANG-01..08`'s text, which fence clause (c) forbids. They are in
scope because **`D-58`'s in-scope list names `D-57`'s parity repair explicitly**, and `D-57` states its
own reason: the CI build-parity gate is *"load-bearing for every other mechanical claim"* and is
*"named by no LANG requirement"*. Clause (c) governs everything the in-scope list does not name.

**The three out-of-scope items, each confirmed absent from the diff:**

| out-of-scope item | check | result |
|---|---|---|
| (a) a wrap-joined matcher input assembly | `grep -ac 'wrapJoined' scripts/check-banned-claims.{ts,js}`; and `diff` of the two files' function sets across `e848052..HEAD` | **0** identifiers in both twins; **0** functions added, **0** removed. The one `wrap-joined` hit is prose at `:89` disclosing the declined remedy |
| (b) a new matcher-completeness axis opened as a MECHANISM | `lineHits` sha256 at `e848052` vs HEAD; `BANNED_CLAIM_LITERALS` member list `diff`ed member by member | **identical** (`a85820d3…0fe453` both sides); **22 members, byte-identical**. Two axes were **disclosed** as ids (`V-29-57-01`, `V-29-58-01`); neither is a mechanism and neither widens the matcher |
| (c) anything outside `LANG-01..08`'s text, other than what `D-57` names | the 19-row table above | **0** unmatched paths; rows 6–11 authorised by `D-57` by name, rows 12–19 by `D-58`'s own record clause |
| supply chain (`T-29-60-SC`) | `git diff --exit-code e848052..HEAD -- package-lock.json` | **exit 0 — byte-unchanged.** No package installed by any plan of round 8; `package.json` moved by exactly one script line |

### 8.5 What the follow-up inherits — the recommendation, in one place

`D-58` says a finding after this round becomes a **backlog item or a follow-up phase**, never a round 9.
This is that list, ordered by how close each item sits to `LANG-04`'s own subject, so whoever picks it up
starts where the phase's own claim is.

| # | item | id | live count | why it is here |
|---|---|---|---|---|
| 1 | the gate's second PASS line still states a per-DOCUMENT quantifier | `V-29-60-05` | 1 address, 1 demonstrated falsifying tree | **the only item inside `LANG-04`'s own text**; `D-55`'s narrowing reached three of four addresses |
| 2 | three gates borrowed rather than wired in continuous integration | `V-29-60-06` | 3 of 17 | fail-open under one edit; two have never run against this tree |
| 3 | a false in-source claim about a cardinality, and a half-derived anchor count | `V-29-60-01` | 1 statement, 0 live | round-7 WR-01 |
| 4 | an overrun reported as a byte divergence | `V-29-60-02` | 0 live | round-7 WR-02 |
| 5 | a second anchor grammar in the `D-54` harness | `V-29-60-03` | 2 declarations | round-7 WR-03 |
| 6 | a coverage arithmetic that can over-report | `V-29-60-04` | 0 live | round-7 IN-01 |
| 7 | the `ci.yml` banned-claim comment's object-side wording still overshoots | — (§1 row 8) | 1 address | recorded by `29-56`; a CI comment, not shipped text |
| 8 | `scripts/compactor.ts:7` restates a claim this project disproved by measurement | — (§1 row 13, finding 1) | 1 occurrence + its twin | `scripts/` is outside the gate's corpus by construction |
| 9 | eight `V-` markers no register has ever rolled up | `V-29-29-02`..`-05`, `V-29-30-01`..`-04` | 8 | named by round 7, adopted by nobody (§6.2b) |
| 10 | `.planning/WINDOWS.md` carries 23 of the 40 markers | — (§6.3) | 17 absent, incl. `V-29-49-01`, `V-29-59-01`, `V-29-59-02` | the ledger and the register disagree about the set |
| 11 | the six stale `LANG` rows | — | 6 rows | authority named at §8.2; **applied by nothing here** |
| 12 | `actuals.commits` is unmeasurable at the moment it is written | — (§9.4) | 4 short-by-one values this round, 6 in round 7 | a self-reference, not a clerical error; the remedy is to name the range |

---

## 9. The sweep on the final tree, the reconciliation, and the prohibitions asserted

Written by plan `29-60` under `D-58`. **These are not a second derivation that agrees with §1–§8. They
are the same measurements.** Every live count printed above was taken by a command recorded below, on the
tree recorded below, and written into the section that needed it.

### 9.0 The tree the sweep was taken on, and how it moved

```
SWEEP_TREE = 8a7d0e3f3eff73ff75add7b4b84e70c29ffe62b6
             "docs(29-60): the phase close, and the requirement rows recommended but not moved"

working tree at the moment of the sweep:
  M human-notes.txt                                  <- modified before this round began, never staged
  ?? .gsd/                                           <- untracked, unrelated to this work
  ?? .planning/phases/29.1-per-role-model-assignment/ <- untracked, a LATER phase's directory

  tracked paths modified by this plan and not yet committed: 0
```

**The tree moved twice inside this plan and both moves are named rather than assumed away.** Plan `29-60`
committed `41b116e` (§3, §5.4, §6) and `8a7d0e3` (§7, §8) before this sweep ran; the sweep is taken on
`8a7d0e3`, the true state of every section it reconciles. **This section's own commit, and the closing
metadata commit that carries this plan's SUMMARY, `STATE.md` and `ROADMAP.md`, land after it** — so two
counts in this file are of a tree that does not include them, and both say so where they are printed:
the `check-nul-bytes` denominator (§9.2) and the `V-` marker count (§9.5).

**Numbers taken before `41b116e` and re-taken after `8a7d0e3`:** the marker set (§9.5, where the
prediction written at §6.2d is checked against the derivation), and every reproduction in §9.3, all of
which were re-run on mirrors and clones of `8a7d0e3`.

### 9.1 The sweep's command list was DERIVED from the pipeline, not typed

A hand-typed sweep list proves that the person typing it remembered the gates. The list below is derived
from the two authorities that decide what continuous integration runs, and the derived count is compared
against the executed count.

```sh
# authority 1 — every command the workflow invokes
$ grep -n "^          node scripts/\|^          npm run\|^        run: npm\|^        run: npx" \
       .github/workflows/ci.yml | sed 's/^[0-9]*: *//; s/^run: //' | sort -u | wc -l
19          # 18 once `npm ci` (an install, not a gate) is set aside

# authority 2 — every gate package.json can run
$ node -e "…Object.keys(require('./package.json').scripts)…"
    freshness, freshness:catalog, freshness:context, freshness:adapters, freshness:skill-twins,
    freshness:queue, freshness:traceability, typecheck, build, check:build-parity, …

# the DIFFERENCE between the two authorities is itself a finding, not a merge artefact
    in package.json, NOT in ci.yml : freshness:queue, freshness:traceability      -> V-29-60-06
    in neither                     : node scripts/check-uat-oracles.js            -> V-29-60-06
```

**The derivation, stated as an arithmetic rather than as a list:**

```
18  distinct workflow commands, `npm ci` set aside
+ 2  package.json freshness gates the workflow does not name  (freshness:queue, freshness:traceability)
+ 1  gate neither authority names                             (node scripts/check-uat-oracles.js)
+ 1  the bare compiler the plan's own <automated> block names  (npx tsc --noEmit)
- 1  `npm run build` — subsumed: `check:build-parity` runs the build as its first half
= 21 commands in the sweep

executed: 21.   derived: 21.   equal.
```

**`npm test` was NOT run, and it is named here so its absence is a decision.** It spawns the live
claude-CLI e2e lane, which spends tokens and can hang. The suite is run as
`npx vitest run --exclude '**/scripts/e2e/**'`, per `D-13` and this repository's own standing note.

### 9.2 The sweep, command by command

| # | command | exit | output recorded |
|---|---|---|---|
| 1 | `npm run freshness` | **0** | `All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources.` plus `Set equality with the filesystem walk: 0 committed at HEAD and absent on disk, 0 on disk and absent from HEAD.` |
| 2 | `npm run freshness:catalog` | **0** | `Catalog fresh: docs/catalog/README.md matches a fresh regeneration.` |
| 3 | `npm run freshness:context` | **0** | `Context fresh: no .grugops/context/ tree exists yet — nothing committed to drift (vacuous pass).` |
| 4 | `npm run freshness:adapters` | **0** | `Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.` |
| 5 | `npm run freshness:skill-twins` | **0** | `Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal.` |
| 6 | `npm run freshness:queue` | **0** | `Now-running fresh: no .grugops/queue/claimed/ tree exists yet — nothing committed to drift (vacuous pass).` |
| 7 | `npm run freshness:traceability` | **0** | `Traceability fresh: no .grugops/context/ notes tree exists yet — nothing committed to drift (vacuous pass).` |
| 8 | `npm run typecheck` | **0** | `tsc --noEmit && tsc -p tsconfig.tests.json` |
| 9 | `npx tsc --noEmit` | **0** | no output |
| 10 | `npm run check:build-parity` | **0** | `Build parity: no tracked build output moved when tsc ran.` |
| 11 | `node scripts/check-foundation-guards.js` | **0** | `ALL CHECKS PASSED` — incl. `guard_role_size` 16 within ceiling / 1 WARN / 0 FAIL, `guard_caveman_voice` `0 findings over 17/17`, `guard_voice` `0 findings over 19/19`, `guard_role_clause_uniqueness` `0 findings over 17/17` |
| 12 | `node scripts/check-kit-refs.js` | **0** | `ALL CHECKS PASSED` — `invariant marker present at all 26 marker sites (2 named + 24 derived adapters)` |
| 13 | `node scripts/check-public-docs-vocabulary.js` | **0** | `ALL CHECKS PASSED` — `AUDIT-02: 10 public document(s) carry zero retired vocabulary — root 4, examples 5, kitReadme 1; 1 exempted by name` |
| 14 | `node scripts/check-audit-register.js` | **0** | `ALL CHECKS PASSED` — four equalities, `36` counted rows set-equal to `36` derived files, kind distribution `safety 6, architecture 32, install 8` summing to `46` |
| 15 | `node scripts/check-claim-anchors.js` | **0** | `ALL CHECKS PASSED` — `46 registry row(s)`, `45 markdown, 1 unanchorable`, `46 verbatim comparison(s) performed, all byte-identical`, `all 4 safety floor(s) mapped` |
| 16 | `node scripts/check-banned-claims.js` | **0** | `0 findings over 117/117 elements`; the full `LANG-04` line is quoted below |
| 17 | `node scripts/check-imperative-lexicon.js` | **0** | `ALL CHECKS PASSED` — `imperative lexicon 0 findings over 19/19`, `sentence form 0 findings over 47/47`, `LANG-01: 76 Technical Name(s) DERIVED` |
| 18 | `node scripts/check-diff-disposition.js` | **0** | `ALL CHECKS PASSED` — `0 findings over 37/37 elements` |
| 19 | `node scripts/check-nul-bytes.js` | **0** | `1631 tracked file(s) scanned as raw bytes, ZERO carrying a forbidden control byte`; git's `--eol` classifier agrees at `0 -text` against `0` NUL-bearing, `1631 parsed row(s), 0 unparsed` |
| 20 | `node scripts/check-uat-oracles.js` | **0** | `ALL CHECKS PASSED` — **run by hand; no workflow step names it** (`V-29-60-06`) |
| 21 | `npx vitest run --exclude '**/scripts/e2e/**'` | **0** | **52 files, 2138 passed, 2 skipped (2140), 150.87s** |

**Three of the seven freshness gates are recorded as VACUOUS, not as green** (rows 3, 6, 7). They pass
because the trees they compare do not exist. A sweep that prints seven zeroes without saying which three
are vacuous has published a stronger result than it took — and two of those three are also
`V-29-60-06`'s worst case: a gate with no subject, invoked by no pipeline step, exercised only against
fixtures.

**The `check-nul-bytes` denominator is 1631 and it is a count of the tree BEFORE this section's commit.**
It was 1626 at `e848052` and 1620 at round 7's final tree. The `+5` from `e848052` is exactly the four
plan SUMMARYs and this register (`git diff --name-status e848052..HEAD | grep -c '^A'` → **5**).

**The banned-claim `LANG-04` line in full, because the numbers §3, §7 and §8 cite are read off it:**

```
PASS  LANG-04: 117 document(s) carry zero banned claim literal outside the one named exemption region
      — kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2,
      overlap 1; 22 pinned literal(s) across 3 group(s), matched UNCONDITIONALLY — the gate enumerates
      what is banned and nothing about how it is said; 1 exemption region (agent-factory/writing-profile.md
      § ## Disclaimer and honesty floor …), which suppresses 14 banned-claim occurrence(s)
      (standard-name 8, token-economy 2, comprehension 4), pinned at 14, and reaches 75 line(s), pinned
      at 75 …; every suppressed occurrence sits inside one of 6 registry-anchored block(s)
      [C-28-039, C-28-043, C-28-044, C-28-042, C-28-045, C-28-046] frozen byte-for-byte against
      docs/audit/28-claim-registry.md, pinned at 6, covering 23 of the region's 75 line(s) — the other
      52 stay freely editable and are SCANNED …; 8 candidate literal(s) refused at admission
```

**And the header line above it, which is the sentence `D-55` narrowed and the sentence §7 claims:**

```
[guard_banned_claims] no single physical line of the 117 derived document(s) this gate scans carries
any of the 22 pinned claim literal(s), outside the registry-anchored blocks of one named exemption
region (LANG-04 / D-29, D-44)
```

### 9.3 The four reproductions, each with its premise asserted first

#### 9.3.0 Which harness each reproduction needs, and why — recorded so the next reader does not repeat the mistake

**A `git archive` extract is NOT a git repository.** It has no `HEAD`, no `.git`, no history. That is
fine for a gate whose input is bytes on disk, and fatal for a gate whose input is git.

| reproduction | harness | why |
|---|---|---|
| §9.3.1 single-line plant of a listed literal | **archive mirror** | `check-banned-claims` reads bytes on disk and derives its corpus by walking directories. An extract is a faithful, isolated copy |
| §9.3.2 unpaired frozen-block edit | **archive mirrors, one per direction** | `check-claim-anchors` and `check-banned-claims` both compare two files' bytes. No git access |
| §9.3.3 the hard-wrap bypass, re-run unchanged | **archive mirror** | same |
| §9.3.4 planted stale committed output | **CLONES, and only clones** | the repaired `freshness.ts` reads its committed side with `git show HEAD:<path>` and derives its set from `git ls-tree -r -l HEAD`. **On an archive extract those calls have no `HEAD` to read**, so the run would be a false transcript rather than a green |

**No mirror or clone is reused.** Each reproduction below extracts or clones its own, and every one is
deleted after the transcript is taken (§9.6).

#### 9.3.1 The single-line, count-preserving plant of a listed literal — still reds by name

**Premise, asserted before any verdict was read:**

```
repo  gate sha256 : 1f86cc606307285cc4745f70f50772a18df1cf53fdf2362a446dbb0225f48c11
rep1  gate sha256 : 1f86cc606307285cc4745f70f50772a18df1cf53fdf2362a446dbb0225f48c11   (equal)
rep1c gate sha256 : 1f86cc606307285cc4745f70f50772a18df1cf53fdf2362a446dbb0225f48c11   (equal)
rep1 files = 1631   rep1c files = 1631   tracked = 1631

CLEAN CONTROL, on a SEPARATELY re-extracted mirror never planted:
  rep1c  exit=0   PASS  banned claims: 0 findings over 117/117 elements
```

**The plant.** One line replaced inside `C-28-046`'s registry-anchored frozen block — the honest
comprehension denial at `agent-factory/writing-profile.md:301` — with an assertive sentence carrying
three pinned literals. **Line count preserved: 308 before, 308 after.**

```
$ node scripts/check-banned-claims.js        exit=1     4 CHECK(S) FAILED

FAIL  C-28-046's anchored block inside the one named exemption region no longer matches its registry
      row in `docs/audit/28-claim-registry.md` byte for byte, so its lines are NOT exempt …
FAIL  … suppressed 12 banned-claim occurrence(s), and BANNED_CLAIM_EXEMPT_SUPPRESSED … declares 14
FAIL  … suppressed 2 `comprehension` occurrence(s), and BANNED_CLAIM_EXEMPT_COMPOSITION … declares 4
FAIL  banned claims: 3 finding(s) over 117 elements
      agent-factory/writing-profile.md:301:14 — banned standard-name literal "Simplified Technical English"
      agent-factory/writing-profile.md:301:47 — banned comprehension literal "improves comprehension"
      agent-factory/writing-profile.md:301:56 — banned comprehension literal "comprehension"
```

**Four independent mechanisms fire on one plant** — the content freeze names the block, both cardinality
pins move from their declared values, and three findings are reported at `file:line:column`. `D-54`'s
content bound is intact on round 8's final tree.

#### 9.3.2 The unpaired frozen-block edit, in BOTH directions, each on its own mirror

**Premise, asserted before any verdict was read** — three separately re-extracted mirrors, both gate
binaries hashed, and each mirror green before its edit:

```
rep2a / rep2b / rep2c   anchors-gate=64aaeddfb1b7b8c0   banned-gate=1f86cc606307285c   files=1631
repo                    anchors-gate=64aaeddfb1b7b8c0   banned-gate=1f86cc606307285c
BEFORE any edit:  rep2a anchors=0 banned=0 · rep2b anchors=0 banned=0 · rep2c anchors=0 banned=0
```

**Direction A — the PROSE moves and the registry row does not** (rep2a). The denial at
`writing-profile.md:301` rewritten to a sentence carrying no pinned literal, registry untouched:

```
$ node scripts/check-claim-anchors.js    exit=1   1 CHECK(S) FAILED
  FAIL  agent-factory/writing-profile.md: the text at C-28-046's anchor (line 301) is not
        byte-identical to the registry's verbatim block.
$ node scripts/check-banned-claims.js    exit=1   3 CHECK(S) FAILED
  FAIL  C-28-046's anchored block … no longer matches its registry row … byte for byte
```

**Direction B — the REGISTRY ROW moves and the prose does not** (rep2b). The premise was asserted
mechanically rather than by eye: the script refuses unless the target string occurs **exactly once**.

```
PREMISE OK: exactly 1 occurrence replaced in the registry verbatim
$ node scripts/check-claim-anchors.js    exit=1   1 CHECK(S) FAILED
  FAIL  agent-factory/writing-profile.md: the text at C-28-046's anchor (line 301) is not
        byte-identical to the registry's verbatim block.
$ node scripts/check-banned-claims.js    exit=1   4 CHECK(S) FAILED
  FAIL  C-28-046's anchored block … no longer matches its registry row … byte for byte
  FAIL  banned claims: 2 finding(s) over 117 elements
```

**Both directions red, both naming `C-28-046`.** Direction B additionally produces two findings, because
the profile's own honest denial stops being exempt the moment its block diverges — the fail-closed
direction, visible rather than argued.

**The PAIRED control** (rep2c) — the same byte change applied to **both** files, with the
exactly-once premise asserted in each:

```
PREMISE OK: exactly 1 occurrence replaced in agent-factory/writing-profile.md
PREMISE OK: exactly 1 occurrence replaced in docs/audit/28-claim-registry.md
$ node scripts/check-claim-anchors.js    exit=0   ALL CHECKS PASSED
$ node scripts/check-banned-claims.js    exit=0   PASS  banned claims: 0 findings over 117/117 elements
```

**A paired edit is green and an unpaired edit is red in either direction.** That is the whole of the
"move both in the same commit" rule, held mechanically.

#### 9.3.3 The hard-wrap bypass, re-run UNCHANGED — and what it falsifies, which is not what round 7 said

**This reproduction is not run to show a fix. `D-56` declines the fix.** It is re-run to establish two
things on the final tree: that the axis `V-29-57-01` records is still exactly where it was, and that the
sentence `D-55` narrowed is TRUE on a tree that carries it.

**Premise:** a fresh archive mirror of `8a7d0e3`, `1631` files against `1631` tracked, gate sha256
`1f86cc60…f48c11` equal to the repository's, **green before the plant** (`exit=0`, header printed).

**The plant** — the round-7 verifier's own paragraph, appended verbatim to
`agent-factory/workflows/13-incident.md`, three separately pinned `token-economy` members split across
four ordinary hard-wrapped lines. `PLANT_LANDED=1`.

```
$ node scripts/check-banned-claims.js        exit=0

[guard_banned_claims] no single physical line of the 117 derived document(s) this gate scans carries
any of the 22 pinned claim literal(s), outside the registry-anchored blocks of one named exemption region
  PASS  banned claims: 0 findings over 117/117 elements
  PASS  LANG-04: 117 document(s) carry zero banned claim literal outside the one named exemption region …

$ grep -c '13-incident' <the gate's entire output>        0      <- the planted file is never named
```

**Read the two published lines against the tree that produced them.** In one run, on one tree:

| the gate's published line | on this planted tree |
|---|---|
| the header — *"no single physical line … carries any of the 22 pinned claim literals …"* | **TRUE.** No single physical line of the planted paragraph carries a pinned literal; the words are split across line boundaries |
| the second PASS line — *"117 document(s) **carry zero banned claim literal** outside the one named exemption region"* | **FALSE.** `agent-factory/workflows/13-incident.md` demonstrably carries three separately pinned members of the `token-economy` group |

**This is the demonstration behind `V-29-60-05` (§5.4) and §7.3 item 3.** `D-55`'s narrowing is real and
it is verified here at the header; the same run shows the wider wording surviving one address away, in a
line §1's hand-enumerated address list did not reach. **`V-29-57-01` is unchanged: reach 11 of 22, live
count 0 over 117 documents and 4135 adjacent non-blank line pairs** (§9.4 row 9 — the pair count moved
and both values are published).

#### 9.3.4 The planted stale committed output — on CLONES, after the in-place build, with a real discrimination pair

**Premise, asserted before any verdict was read:**

```
rep3  / rep3c   git clone of the repository, HEAD=8a7d0e3, `git rev-parse --is-inside-work-tree` = true
rep3p           git clone, checked out at e848052 (the PRE-FIX tree), freshness gate sha256 bc67fd68d98eddc8
                                                    post-fix gate sha256 56cc3f811c65502b   (different)
BEFORE any plant:  rep3 exit=0 · rep3c exit=0 · rep3p exit=0, each `48 committed .js file(s)` fresh

harness artefact, recorded rather than hidden: each clone shows ONE untracked path, `node_modules`,
which is the symlink the harness makes to the repository's installed dev dependencies. `.gitignore`
carries `node_modules/` in directory form, so a symlink of that name is reported. It is the harness,
not the tree.
```

**The plant.** A byte appended to `hooks/guard.js` and **COMMITTED**, with `hooks/guard.ts` untouched —
so `HEAD` carries a `.js` that is not a build of its `.ts`, which is exactly the artefact `CLAUDE.md`
says host machines run.

```
PLANT_LANDED_AT_HEAD = 1        hooks/guard.ts changed by the plant = 0
```

**Then the in-place build runs FIRST**, exactly as the pre-`D-57` pipeline ordered it:

```
$ npm run build                                          exit=0
$ git status --porcelain -- hooks scripts install        1 changed path
      <- the build wrote the FAITHFUL output over the plant in the WORKING TREE, which is why the
         working file now differs from the planted HEAD. The old comparison read this file and saw
         a faithful build.
$ git show HEAD:hooks/guard.js | grep -c 'planted drift' 1     <- HEAD still carries the plant
```

**The gate, after the build that would have repaired the old comparison:**

```
$ npm run freshness                                      exit=1
STALE COMMITTED OUTPUT: hooks/guard.js — the .js committed at HEAD is not a build of the .ts committed
beside it. Run `npm run build` and commit the result.
BUILD-OUTPUT CHECK FAILED: 1 finding(s).
```

**The discrimination pair, taken independently of plan `29-59`'s** — the SAME plant, the SAME build, on
a clone of the PRE-FIX tree:

```
rep3p (e848052, pre-fix gate)   after the same plant and the same build:
  $ npm run freshness            exit=0
  All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
  $ grep -c 'hooks/guard.js' <output>     0        <- never named

rep3  (8a7d0e3, post-fix gate)   same plant, same build:
  $ npm run freshness            exit=1   STALE COMMITTED OUTPUT: hooks/guard.js
```

**Green before, red by name after, on the same planted artefact.** The repair is not vacuous.

**The CLEAN CONTROL** (rep3c, a separately cloned tree, never planted): `npm run build` then
`npm run freshness` → **exit 0**, `48 committed .js file(s)` fresh, **0** dirty paths under
`hooks/ scripts/ install/`.

**A false harness result this reproduction produced, and it is instructive.** The first attempt at the
discrimination ran the PRE-FIX gate by **copying it over `scripts/freshness.js` inside the post-fix
clone**. It exited 1, which reads as *"the pre-fix gate catches the plant too"*. It does not: the output
named `scripts/freshness.js` — **the file the harness itself had just made stale** — and named
`hooks/guard.js` **zero** times. **The exit code was right for the wrong file.** Caught by reading the
output rather than the status, and repaired by cloning a genuine pre-fix tree instead of splicing one
gate into another tree. Recorded at §6.5 row 5.

### 9.4 The reconciliation — every number this round published, re-taken

**30 rows compared. 7 disagreeing. 0 reconciled away.** Every disagreement prints both values and is
recorded as a finding.

| # | number as published | published by | re-measured on the final tree | verdict |
|---|---|---|---|---|
| 1 | scan count `117`, parts `73/11/1/7/24/2` overlap `1` | 29-56, 29-58 | identical | ✓ |
| 2 | pinned literals `22` across `3` groups | 29-56 | identical; the member list is byte-identical to `e848052` | ✓ |
| 3 | suppressed `14` (standard-name 8, token-economy 2, comprehension 4) | 29-58 | identical | ✓ |
| 4 | exempt extent `75`, pinned at 75 | 29-58 | identical | ✓ |
| 5 | exempt anchors `6`, ids listed | 29-58 | identical | ✓ |
| 6 | frozen-line coverage `23 of 75`, remainder `52` | 29-58 | identical; `23 + 52 = 75` by hand | ✓ |
| 7 | candidate literals refused at admission `8` | 29-58 | identical | ✓ |
| 8 | wrap-reachable members `11 of 22`; multi-word `16` | 29-57 | identical — `11` reachable, `16` multi-word | ✓ |
| 9 | wrap-only live hits `0` over `117` documents and **`4126`** adjacent non-blank pairs | 29-57 | hits `0`; pairs **`4135`** | ✗ **DISAGREES — the pair count.** Cause identified: plan `29-58` added 12 lines to `agent-factory/writing-profile.md`, a scanned document, **after** `29-57` measured. The live-hit count, which is the load-bearing half, is unchanged at 0. Both values published |
| 10 | house-style wraps `757` over **`2612`** pairs in `73` files (`29.0%`) | 29-57 | **`765`** over **`2621`** pairs in `73` files (`29.2%`) | ✗ **DISAGREES — two of four.** Same cause and the same direction as row 9. The conclusion the figure supports — roughly three in ten adjacent pairs are mid-sentence wraps — is unmoved. Both values published |
| 11 | registry rows `46`; kinds `architecture 32 / install 8 / safety 6` | 29-58 | identical; `32 + 8 + 6 = 46` by hand | ✓ |
| 12 | freshness `48` committed `.js` | 29-59 | identical | ✓ |
| 13 | suite `52` files, `2138` passed, `2` skipped | 29-59 | identical, re-run on `8a7d0e3` | ✓ |
| 14 | `V-29-59-02`: `1 of 2` matrix legs unasserted | 29-59 | identical (`os: [ubuntu-latest, windows-latest]` against one `if:`) | ✓ |
| 15 | `V-29-59-01`: live `0` | 29-59 | identical | ✓ |
| 16 | tracked files `1626` at `e848052` | 29-56 | `git ls-tree -r --name-only e848052 \| wc -l` → `1626` **at that commit**, not accepted from the SUMMARY | ✓ |
| 17 | derivation denominator `784` → `780`; derived sites `13` | 29-56 | at HEAD: `785` → `780`, sites `13`. The `784 → 785` move is **+1**, this register entering the tracked set, and `780` is unchanged because the `29-round*` exclusion absorbs it | ✓ (movement explained, not a disagreement) |
| 18 | §1 table rows `13` = derived sites `13` | 29-56 | re-counted: 13 rows | ✓ |
| 19 | `V-29-51-02`: `19 of 45` disagreeing `line:` fields | round 7, re-measured | **`20 of 45`** at HEAD; **`19 of 45` reproduced exactly at round 7's own tree first** | ✗ **DISAGREES — and the predicate was reconstructed and validated before the new value was believed.** Cause: plan `29-58` moved two rows' anchors without their advisory `line:` fields. Membership diff published at §6.3 |
| 20 | `V-29-47-04`/`V-29-58-01`: `22` pinned literals, `0` live | round 7, re-measured | identical | ✓ |
| 21 | 29-44 R1: `30` code-span cells over `1534` rows | round 7, re-measured | `30` / `1534`, all in `29-12.md` | ✓ |
| 22 | 29-43 R2: the retired token-cost phrase live `1` in `CHANGELOG.md` | round 7, re-measured | `1`, at `CHANGELOG.md:67`; the file is byte-unchanged this round | ✓ |
| 23 | `V-29-26-04`: `4` indented fence delimiters in `README.md` | round 7, re-measured | `4` | ✓ |
| 24 | `V-29-53-02`: `1` budget object per module | round 7, re-measured | `1` | ✓ |
| 25 | 29-46 R2: `19` workflows | round 7, re-measured | `19` | ✓ |
| 26 | round 7's marker count `35` | round 7 | `35`, **re-derived on a fresh extract of round 7's own final tree** with round 7's own command | ✓ |
| 27 | round 7 §4.7c: its eight opened ids are *"each in `.planning/WINDOWS.md`"* | round 7 | `grep -ac 'V-29-49-01' .planning/WINDOWS.md` → **0**; the ledger carries **23** of the tree's 40 markers | ✗ **DISAGREES.** One of round 7's eight is absent, and so are both of round 8's `29-59` ids. Recorded at §6.3, recommended at §8.5 row 10 |
| 28 | `LANG-08` override: `16` roles PASS / `1` WARN / `0` FAIL | `29-VERIFICATION.md` | identical, re-run live; `16 + 1 = 17` | ✓ |
| 29 | `29-REVIEW.md`: reach *"16 of 22 literals reachable"* | round 7's review | **`11 of 22`**; `16` is the multi-word count | ✗ **DISAGREES**, published at §4.2a by plan `29-57` and carried here. The review's *"6 of the 7 token-economy members"* is independently confirmed |
| 30 | `actuals.commits` — 29-56 `2`, 29-57 `2`, 29-58 `3`, 29-59 `3` | the four plan SUMMARYs | `3`, `3`, `4`, `4` from `git log --grep` | ✗ **FOUR DISAGREEMENTS, every one SHORT BY EXACTLY ONE.** The same structural self-reference round 7 recorded across six values |

**Row 30 is not a clerical error and it is not corrected, for the reason round 7 gave and this round
confirms.** A plan's `actuals.commits` is written **into its SUMMARY**, and that SUMMARY is then
committed. **A count of commits carried by a commit cannot include the commit that carries it.** Every
one of round 7's six disagreements was short; every one of round 8's four is short; **ten of ten in one
direction is a mechanism, not a habit.** Correcting four committed SUMMARYs would rewrite the trail, and
a trail is not a tidy state. **The remedy is at §8.5 row 12: name the commit RANGE instead of the
count** — the same remedy this phase already applied to a workflow comment in round 7.

**Rows 9 and 10 are one cause and it is worth naming.** Both are derived quantities over a corpus that a
LATER plan of the same round legitimately grew. **Neither plan did anything wrong, and neither number
was wrong when it was taken.** What would have been wrong is carrying them forward as if a corpus
measurement were a constant. That is the entire reason this register re-takes rather than transcribes.

**Every number in this round was re-takeable.** Numbers published with no recorded command: **0** — every
figure in the four SUMMARYs and in §1–§8 of this file carries the command that produced it, which is the
one property round 7 flagged as missing in its own predecessor and which held this round.

**Reconciliation summary, counted by enumerating the rows rather than by reading the table:**

```
rows compared                                        : 30
rows AGREEING                                        : 23
rows DISAGREEING                                     :  7   (rows 9, 10, 19, 27, 29, 30 = 6 rows …)
```

**That block is wrong and it is left visible.** Enumerating the disagreeing rows gives **six** row ids —
9, 10, 19, 27, 29, 30 — not seven. The correct statement, with the individual number disagreements
counted separately from the rows that carry them:

```
rows compared                                          : 30
rows AGREEING                                          : 24
rows DISAGREEING                                       :  6   (9, 10, 19, 27, 29, 30)
individual number disagreements inside those rows      : 10   (row 9: 1 · row 10: 2 · row 19: 1 ·
                                                               row 27: 1 · row 29: 1 · row 30: 4)
disagreements reconciled away                          :  0
numbers carried from a SUMMARY without re-measurement  :  0

  24 agreeing + 6 disagreeing = 30 compared.   ✓
```

**This is the sixth false result this round produced and it is filed as §6.5 row 6.** **Round 7's
reconciliation section made the identical mistake, in the identical place, at the identical moment** —
its first draft said *"23 rows compared, 8 disagreements"* and both halves were wrong. **A reconciliation
section that miscounts its own reconciliation, twice, in two consecutive rounds, is not a coincidence;
it is a summary line written from the narrative instead of from the rows.** The remedy, applied here: the
row ids are listed inside the count so the count can be checked against them.

### 9.5 The marker set, re-derived after this round's ids landed

§6.2d predicted **46** markers in the tree after this plan's `V-29-60-*` ids were committed, and wrote
the prediction down so it could disagree.

```
$ grep -rhoaE 'V-29-[0-9]{2}-[0-9]{2}' --include='*.md' --include='*.ts' --include='*.js' \
       --include='*.json' --include='*.yml' . | sort -u | wc -l
46          # measured on 8a7d0e3, after 41b116e carried V-29-60-01 .. V-29-60-06 into the tree

predicted 46   derived 46   equal
```

**This section's own commit will add no new id** — it cites `V-29-60-01` .. `-06` and nothing else — so
the count is stable at 46 across the remainder of this plan. A later derivation that returns more has
found something this round did not write down, which is exactly what this number exists to make visible.

### 9.6 The round's six prohibitions, asserted with a command rather than with intent

| # | assertion | command | result |
|---|---|---|---|
| 1 | **No wrap-joined matcher input assembly was built** | `grep -ac 'wrapJoined' scripts/check-banned-claims.{ts,js}`; `diff` of both files' `^(export )?function` sets across `e848052..HEAD` | **0** identifiers in each twin; **0** functions added, **0** removed. The single `wrap-joined` hit is prose at `:89` disclosing the declined remedy |
| 2 | **The published claim was narrowed, never widened** | the gate's own header, quoted at §9.2, compared against `e848052`'s | the header states a per-LINE predicate over derived, interpolated counts where it previously quantified over a class of claim. **One address survives at the wider wording and it is published as `V-29-60-05`, not omitted** |
| 3 | **The matcher was not weakened** | `lineHits` sha256 at `e848052` vs HEAD; `BANNED_CLAIM_LITERALS` member list `diff`ed member by member | `a85820d3968b91e8147ee0b4b5c22f736bb4be1b037476945419bf9d190fe453` **both sides**; **22** members, byte-identical. No literal added, none removed, no conditional member reintroduced |
| 4 | **No correct text was deleted to reach green** | `git diff --numstat e848052..HEAD` over the round's 19 paths, deletions read | `agent-factory/writing-profile.md` +27/-… is the honesty-floor narrowing, whose replaced sentences are quoted in §1 and §2; the registry row moved in the **same commit** (`638ff39`), with commits touching exactly one of the pair across the round: **0** |
| 5 | **No requirement row was flipped** | `git diff --numstat .planning/REQUIREMENTS.md` for each of the five plans individually, plus the range | **five results, all no output**; range `e848052..HEAD` **no output**. §8.3 |
| 6 | **No prior round's record was rewritten** | `git diff --numstat e848052..HEAD -- docs/audit/29-round{4,5,6,7}-residuals.md` | **no output — all four byte-unchanged.** §4.2a and §4.6 record disagreements with round 7 *here* rather than by editing it |

**Prohibitions asserted without a command: 0.**

**Three further assertions, of the same kind, because a fence is only held by what was checked:**

| assertion | command | result |
|---|---|---|
| **Supply chain (`T-29-60-SC`)** | `git diff --exit-code e848052..HEAD -- package-lock.json` | **exit 0 — byte-unchanged.** No package installed by any plan of round 8. `package.json` moved by exactly **one** line, the `check:build-parity` script (`D-57`) |
| **No plant, mirror, clone or fixture left on the tree** | `git status --porcelain` | only `human-notes.txt` (modified before this round began, never staged) and two untracked directories unrelated to this work. Every mirror and clone in §9.3 was built under `/private/tmp` and deleted; the `.temp/` directory `scripts/freshness.test.ts` creates was found **empty**, confirmed gitignored by `git check-ignore -v`, and removed |
| **This plan changed exactly one tracked file** | `git diff --name-only` across `29-60`'s task commits | `docs/audit/29-round8-residuals.md`. **No source file, no test file, no kit document, no workflow, no requirement.** The separate closing metadata commit carries this plan's SUMMARY, `STATE.md` and `ROADMAP.md`, and is named here so "one file" is not read as covering the whole plan |

---

*§1 was written by `29-56`, §2 by `29-58` (`D-55`), §4 by `29-57` (`D-56`), §5.1–§5.3 by `29-59`
(`D-57`), and §3, §5.4, §6, §7, §8 and §9 by `29-60` (`D-58`). An earlier version of this line assigned
§2 and §5 to `29-60`; each was corrected by the plan that turned out to own the section, and the
corrections are left visible rather than made silently.*

*Round 8 closes here, and with it Phase 29's gap-closure rounds. `D-58`: a finding after this becomes a
backlog item or a follow-up phase, never a round 9 — §8.5 is that list. **The verdict on `LANG-04`
belongs to the verifier**, and §8.2 states the one precondition this round did not meet on its own terms.*


---

## §10 — Phase close (2026-08-18, USER DECISION `D-59`)

The round-8 code review returned 5 Critical and the round-8 verifier returned `gaps_found` on
`LANG-04`, on two defects inside round 8's own remedies. Both are dispositioned here, and the phase
closes. `D-59` reverses `D-29`: `LANG-04`'s conformance prohibition is held as **content** — the
claim registry and the honesty floor — with `guard_banned_claims` as a disclosed **drift backstop**
underneath it, rather than as the mechanism that makes a totality true. The requirement text was the
last address in the tree still asserting a mechanism decided more than it decides.

| id | finding | disposition | direction | evidence |
|----|---------|-------------|-----------|----------|
| **CR-02** | `guard_banned_claims` published its narrowed no-claim sentence on RED runs, above the findings that contradicted it | **FIXED**, commit `4c6a76a` | was FAIL-OPEN in *output honesty*; now withheld unless `FAILS === 0` | watched failing first against the pre-fix committed `.js` — the sentence printed above two findings naming `agent-factory/README.md:6:21` — and green against the rebuilt `.js`. New case asserts BOTH directions; an absence-only case would pass against a gate that stopped printing the sentence entirely |
| **CR-01** | `scripts/freshness.ts`'s working-tree arm never reads `HEAD`'s blob yet counts those paths in the verdict line, so a committed-stale `.js` whose `.ts` was edited and rebuilt reads green | **OPEN — carried as `V-29-59-03`**, owner: the tooling/build-parity surface, not this phase | **FAIL-OPEN**, live count 0 on this tree | reproduced by the round-8 review and independently by the round-8 verifier on a fresh `git clone --local`: plant + commit a stale `hooks/guard.js`, edit `hooks/guard.ts`, run `npx tsc` → `All build outputs fresh: 48…`, exit 0, `HEAD`'s `guard.js` never read |
| **CR-03** | `V-29-60-05`'s address count is short by two (`:62-63`, `:351-352` carry the same unqualified phrasing that §1 row 3 cleared) | **OPEN — folded into `V-29-60-05`**, count corrected to **3 addresses** | not fail-open: an understated residual count, in a residual that is itself disclosed | the review's derivation; §1's site set was derived over FILES by command and its addresses then enumerated BY HAND — this phase's set-literal class, one address to the left |
| **CR-04** | `freshness.test.ts:176`'s "independent" denominator hardcodes `"install", "scripts", "hooks"`, a byte copy of `OUTPUT_DIRS` | **OPEN — carried as `V-29-59-04`** | cannot detect the silently-short denominator its own docblock says it exists to detect | the review's reading; same surface and owner as `V-29-59-03` |
| **CR-05** | §1's `13 rows = 13 derived sites` is arithmetic coincidence (rows 1–3 are one file, `+2`; rows 12–13 each cover a twin pair, `−2`) | **RECORDED** — no site was dropped; what fails is the *proof*, not the count | neutral | the review's derivation, accepted |

**Why `CR-01` does not hold `LANG-04` open.** Plan 29-59 stated it when it opened the work: this
gate "is pre-existing since Phase 20 and is named by no LANG requirement." It was repaired inside
this phase only because round 7's own sweep had leaned on it for build-parity evidence. It is a real
fail-open on the tooling surface and it is carried with its direction and its reproduction — it is
not a controlled-language defect, and a controlled-language phase is the wrong place to hold open
for it. `V-29-59-03` and `V-29-59-04` inherit to whoever next owns build parity.

*`D-58` said a finding after round 8 becomes a backlog item or a follow-up phase, never a round 9.
This section is that list, and the phase closes on it.*

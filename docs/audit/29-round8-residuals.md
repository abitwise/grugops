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

*Sections 2 through 8 are written by the remaining plans of this round: §4 by `29-57` (the hard-wrap
axis, `D-56`), the profile and registry evidence by `29-58` (`D-55`), the build-parity repair by
`29-59` (`D-57`), and §3, §6, §7 and §8 by `29-60` (`D-58`).*

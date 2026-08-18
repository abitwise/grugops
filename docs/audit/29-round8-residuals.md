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

---

*§1 was written by `29-56` and §4 by `29-57`. The remaining sections are written by the remaining
plans of this round: the profile and registry evidence by `29-58` (`D-55`), the build-parity repair
by `29-59` (`D-57`), and §2, §3, §5, §6, §7 and §8 by `29-60` (`D-58`).*

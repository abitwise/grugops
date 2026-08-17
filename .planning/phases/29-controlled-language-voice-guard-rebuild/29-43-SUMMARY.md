---
phase: 29-controlled-language-voice-guard-rebuild
plan: 43
subsystem: testing
tags: [guards, scan-set, banned-claims, typescript, vitest, changelog]

requires:
  - phase: 29-42
    provides: the co-occurrence-window residual register and the `V-` id convention this plan extends
provides:
  - "`publicDocsCorpus()` exported beside `publicDocsScan()` — one derivation, two separately named questions, the exemption subtraction visible at exactly one place"
  - "`check-banned-claims.ts` consuming the pre-exemption corpus, so CHANGELOG.md is no longer excluded by INHERITANCE from another gate's predicate"
  - "`BANNED_CLAIM_SCAN_COUNT` 82 -> 83 -> 115, every entrant named, each value read off the gate's own refusal text"
  - "`CHANGELOG.md:30` and `:68` rewritten — mechanism kept, disproven token-economy claim removed, no entry falsified"
  - "five new permanent cases: the CHANGELOG plant (RED-proven), the corpus/scan relationship (mutation-proven), live membership, and the exclusion enumeration in both directions (mutation-proven)"
  - "`BANNED_CLAIM_EXCLUDED_LOCATIONS` carrying a disposition for every remaining markdown class, held by an assertion rather than by a paragraph"
affects: [29-44, 29-45, 29-46, 29-47, banned-claim corpus measurements]

actuals:
  tokens: 15541
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "One hand-authored parts array per corpus; every other view is DERIVED from it. A second parts array is how two questions drift back into disagreeing."
    - "A shared derivation exports one function per QUESTION, named for the question. A consumer must name which one it wants."
    - "An exclusion list is held by an assertion in both directions — uncovered remainder AND stale prefix — never by the paragraph above it."

key-files:
  created: []
  modified:
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-public-docs-vocabulary.test.ts
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - CHANGELOG.md

key-decisions:
  - "The subtraction lives in the SCAN-PARTS view, not in `publicDocsScan()`'s body as the review sketched — because this gate's PASS line and its two-sided pin both print a per-part breakdown, and a subtraction applied only to the concatenation would print a breakdown whose sum disagreed with the total beside it."
  - "No second pin was added for the corpus. Corpus and scan differ by a frozen one-member array, so a corpus that grew by a non-exempt document trips PUBLIC_DOCS_SCAN_COUNT and one that grew by an exempt document is impossible without editing an array its own freeze case refuses. The corpus is additionally pinned from the other side by BANNED_CLAIM_SCAN_COUNT."
  - "`.claude/` was ADMITTED, not excluded as transitively covered. The transitive argument was tested against scripts/generate-role-adapters.ts and REFUTED: adapter body prose is authored as string literals in specialistBody()/coordinatorBody(), and scripts/ is excluded from this gate."
  - "`skills/` was ADMITTED. It appears in no round-5 finding; deriving the remainder rather than adopting the review's enumeration found it."
  - "`memory-bank/` (9) and `plans/` (4) were EXCLUDED under D-16's build-time/runtime split, with derived counts and a written remedy for the day that argument stops holding."
  - "`bannedClaimScanOverlap()` was generalised off a `[0]`-vs-`[1]` index pair — a latent set-literal defect that would have silently stopped adding up the day a third part landed."

patterns-established:
  - "Assert the harness's own premise: a plant run whose gate produced ZERO bytes of output is a fabricated green, not a pass."
  - "Read a moved pin off the gate's own refusal text, never off arithmetic done in your head."

requirements-completed: [LANG-04]

coverage:
  - id: D1
    description: "The banned-claim gate scans CHANGELOG.md — the document its PASS line has always claimed to scan"
    requirement: LANG-04
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#names a banned literal planted in CHANGELOG.md at file:line:column"
        status: pass
      - kind: integration
        ref: "git-archive mirror, sha256-verified gate, D-44 plant into CHANGELOG.md -> exit 1 naming CHANGELOG.md:124:29 and :124:40"
        status: pass
    human_judgment: false
  - id: D2
    description: "publicDocsCorpus() and publicDocsScan() are separately named questions whose difference is exactly PUBLIC_DOCS_EXEMPT"
    requirement: LANG-04
    verification:
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#the scan is the corpus minus EXACTLY the named exemptions, asserted three ways"
        status: pass
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#the two parts arrays are the SAME parts, and only the scan's are subtracted from"
        status: pass
    human_judgment: false
  - id: D3
    description: "The two live token-economy occurrences are gone from CHANGELOG.md without the changelog being falsified"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "grep -a -c -i -E 'token economy|token-economy' CHANGELOG.md -> 0; git diff --stat CHANGELOG.md -> 3 insertions, 3 deletions, net 0 lines; headings byte-unchanged"
        status: pass
    human_judgment: true
    rationale: "Whether each rewritten sentence still records the mechanism its Keep a Changelog entry describes is an editorial judgement no assertion can make. Both sentences are quoted before and after below."
  - id: D4
    description: "No tracked markdown class sits outside the gate without a written decision"
    requirement: LANG-04
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the remainder of tracked markdown minus the scan is covered by an excluded prefix"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#every excluded prefix still covers something, so a stale prefix cannot hide a live class"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-08-17
status: complete
---

# Phase 29 Plan 43: The Corpus The Gate Scans Is The Corpus Its PASS Line Claims — Summary

**CR-01 closed by separating one derivation into two separately named questions rather than by weakening anything: `guard_banned_claims` moved from 82 to 115 scanned documents, the two live `token-economy` occurrences it was hiding in `CHANGELOG.md` are rewritten without falsifying the record, and every remaining markdown class is admitted or named — held by mutation-proven assertions instead of by prose.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-08-17T19:17Z
- **Completed:** 2026-08-17T19:39Z
- **Tasks:** 3 of 3
- **Files modified:** 7

## Accomplishments

- **The defect is closed at its cause, not at its symptom.** `publicDocsScan()` answered "which public documents does the retired-vocabulary check apply to" while its name read as "which documents are public"; `check-banned-claims.ts` wanted the second question and inherited a subtraction argued for a different predicate. There are now two exported functions, each named for its question, with the subtraction at exactly one place and one hand-authored parts array.
- **Both directions of the discrimination are on a transcript taken from sha256-verified mirrors**, and the PRE-change mirror reproduces the original asymmetry, so the change is shown to have MOVED the verdict rather than merely to have left it green.
- **The remainder was derived rather than adopted, and it disagreed with the published review twice** — `plans/` is 4 files not 1, and `skills/` (7 files) appears in no round-5 finding at all.
- **The `.claude/` transitive-coverage argument was tested and REFUTED**, which turned an intended exclusion into an admission and closed a live fail-open across 17 shipped adapters.

## Task Commits

1. **Task 1 (tracer): the corpus the gate scans is the corpus its PASS line claims** — `1834f4d` (fix)
2. **Task 2: the case that would have caught this, and the bound paragraph that denied it** — `9d6a146` (test)
3. **Task 3: every remaining unscanned class dispositioned by name** — `56ee625` (fix)

## Files Created/Modified

- `scripts/check-public-docs-vocabulary.ts` / `.js` — `PUBLIC_DOCS_CORPUS_PARTS` is now the one hand-authored parts array; `publicDocsCorpus()` and `publicDocsScan()` answer the two questions; `PUBLIC_DOCS_SCAN_PARTS` is a derived view; the `PUBLIC_DOCS_EXEMPT` bound paragraph corrected with a record of what it asserted until round 6.
- `scripts/check-banned-claims.ts` / `.js` — consumes `publicDocsCorpus()`; three new derived parts (`installReadme`, `skillSources`, `claudeAdapters`); `BANNED_CLAIM_SCAN_COUNT` 82→115; `bannedClaimScanOverlap()` generalised; `BANNED_CLAIM_EXCLUDED_LOCATIONS` rewritten with two new members and derived counts.
- `scripts/check-banned-claims.test.ts` — three new cases plus a live-membership case; `PUBLIC_DOCS` and the three new part counts derived from what `makeMirror()` writes; mirror extended with the three admitted classes.
- `scripts/check-public-docs-vocabulary.test.ts` — two new cases pinning the corpus/scan relationship.
- `CHANGELOG.md` — lines 30 and 68 rewritten.

---

## Prohibition verifications — each command run, with its real output

### P1. No matcher is weakened. The three named weakenings stay forbidden.

```
$ git show HEAD~3:scripts/check-banned-claims.ts | grep -E 'no fenced-block skip|whole-word-only match|below-a-marker skip' | shasum -a 256
0ddc80532f92bf7b51557ad6f1aec5ddcf73cd64626b25b36314e8081d6bcd8a  -
$ grep -E 'no fenced-block skip|whole-word-only match|below-a-marker skip' scripts/check-banned-claims.ts | shasum -a 256
0ddc80532f92bf7b51557ad6f1aec5ddcf73cd64626b25b36314e8081d6bcd8a  -

$ git diff scripts/check-banned-claims.ts | grep -E '^[+-].*(FORBIDDEN ALTERNATIVE|fenced-block skip|whole-word-only|below-a-marker)'
(no output — zero +/- lines touch the paragraph)
```

Byte-identical. Every deletion in `check-banned-claims.ts` across the whole plan is a rewiring line or a pin line:

```
$ git diff HEAD~3..HEAD scripts/check-banned-claims.ts | grep '^-' | grep -v '^---'
-// corpus, which is how two scan sets come to disagree about what a public document is.
-import { publicDocsScan } from "./check-public-docs-vocabulary.js";
-// Part `publicDocs`: the set check-public-docs-vocabulary.ts derives and pins. Taken WHOLE — never
-// filtered, sliced or re-derived.
-  return publicDocsScan().slice().sort();
- * The pinned cardinality of the deduped union. 82 today: 73 kit markdown files + 10 public
-export const BANNED_CLAIM_SCAN_COUNT = 82;
   … plus the five-part generalisations of the overlap function, the per-part floor wording
     ("either part" -> "any one part") and the pin wording ("both parts'" -> "every part's")
```

**Status: enforced.** No matcher, marker list or literal was touched. `BANNED_CLAIM_LITERALS` is byte-unchanged; the run still reports `22 pinned literal(s) across 3 group(s)`.

### P2. `CHANGELOG.md`'s exemption from the RETIRED-VOCABULARY check is NOT removed.

```
$ node -e 'import("./scripts/check-public-docs-vocabulary.js").then(m => …)'
publicDocsCorpus exported: true
publicDocsScan   exported: true
corpus.length = 11
scan.length   = 10
difference    = 1 ; PUBLIC_DOCS_EXEMPT.length = 1
PUBLIC_DOCS_SCAN_COUNT = 10
PUBLIC_DOCS_EXEMPT = ["CHANGELOG.md"]
setdiff = ["CHANGELOG.md"]

$ node scripts/check-public-docs-vocabulary.js ; echo $?
  PASS  AUDIT-02: 10 public document(s) carry zero retired vocabulary — root 4, examples 5, kitReadme 1; 1 exempted by name (CHANGELOG.md — Keep a Changelog historical record; its retired vocabulary describes what the project used to ship, which is what a changelog is for); 1 retired path form(s) and 2 retired prose form(s) checked, both read whole from scripts/dead-vocabulary.ts
ALL CHECKS PASSED
0
```

**Status: enforced.** `PUBLIC_DOCS_SCAN_COUNT` is still 10, `PUBLIC_DOCS_EXEMPT` still has exactly 1 member, and the PASS line still reports 10 documents and 1 named exemption with its reason. Corpus 11 minus scan 10 equals the exemption array's length, and the set difference is the exemption itself.

### P3. Green is not reached by deleting correct text.

**`CHANGELOG.md:30` — BEFORE:**
```
- Dialable memory and trajectory compaction for token economy, with a load-bearing-field carve-out
  so verified findings and required failed attempts are never silently dropped.
```
**AFTER:**
```
- Dialable memory and trajectory compaction, with a load-bearing-field carve-out so verified
  findings and required failed attempts are never silently dropped.
```
The entry still names the mechanism it records: *dialable memory*, *trajectory compaction*, and the *load-bearing-field carve-out* with what that carve-out protects. Only the win claim ("for token economy") is gone.

**`CHANGELOG.md:68` — BEFORE:**
```
- All 16 roles deepened to senior judgment in place, sharper-per-token, with the terse caveman voice
  preserved as the token-economy mechanism.
```
**AFTER:**
```
- All 16 roles deepened to senior judgment in place, sharper-per-token, with the terse caveman voice
  preserved unchanged across the rewrite.
```
The entry still records the fact the v1.2 milestone actually delivered — 16 roles deepened, the terse voice preserved across that rewrite. Only the assertion of WHY the voice was preserved is gone; project measurement on 2026-07-28 disproved that claim on this artifact.

```
$ grep -a -c -i -E 'token economy|token-economy' CHANGELOG.md
0
$ git diff HEAD~3..HEAD --stat CHANGELOG.md
 CHANGELOG.md | 6 +++---
 1 file changed, 3 insertions(+), 3 deletions(-)
$ git diff HEAD~3..HEAD CHANGELOG.md | grep -E '^[+-]## '
(no output — the ## [Unreleased] and ## [1.2] headings are byte-unchanged)
```

**Status: enforced.** Net line count change 0 (within ±2). No entry deleted, no heading touched, no version re-narrated.

### P4. No new hand-authored marker, spelling or phrase list is introduced on any axis.

```
$ git diff HEAD~3..HEAD -- scripts/ | grep -E '^\+.*readonly string\[\]'
+export const BANNED_CLAIM_EXCLUDED_LOCATIONS: readonly string[] = [
+export const PUBLIC_DOCS_CORPUS_PARTS: readonly {
```

`BANNED_CLAIM_EXCLUDED_LOCATIONS` is the one array that grew, and its members are **paths with reasons** (`memory-bank/`, `plans/`), not spellings of a claim. `PUBLIC_DOCS_CORPUS_PARTS` is the RENAMED existing parts array (`PUBLIC_DOCS_SCAN_PARTS` became a derived view of it) — one hand-authored parts array before, one after. Three new path constants were added beside `KIT_DIR` (`INSTALL_README`, `SKILLS_DIR`, `CLAUDE_DIR`); each is a directory or filename, and each backs a part that is walked against disk rather than enumerated.

**Status: enforced.** No prose form, marker stem or claim spelling was added anywhere.

---

## The RED and mutation evidence

### Harness-premise failure caught before it produced a false result

The first plant run against the `git archive HEAD` mirror reported `exit=0` for **both** `CHANGELOG.md` and `README.md` — which would have contradicted the round-5 review and, taken at face value, would have been a sixth false harness result for this phase. The output file was **zero bytes**:

```
$ cat /tmp/out.txt ; wc -c /tmp/out.txt
0 /tmp/out.txt
```

Cause: `/tmp` is a symlink to `/private/tmp` on macOS, so `import.meta.url` (`file:///private/tmp/…`) never matched `pathToFileURL(process.argv[1])` (`file:///tmp/…`), the module's `isEntry` guard was false, and `runAll()` never ran. That is precisely the fabricated green the gate's own entry-check comment warns about. Every mirror run afterwards was re-issued against `/private/tmp` and gated on an explicit premise assertion (non-empty output containing the gate's header banner) before its verdict was read.

### PRE-change mirror — the round-5 asymmetry reproduced

Base commit `f718069`; mirror gate sha256 `b405a886257ed38d587fb50f40b2610e643c5298f21027994db871c79da13fe9` — byte-identical to the repository's and to the sha the round-5 review recorded. Clean-mirror control: exit 0, 1222 bytes of verdict. One plant per mirror, mirror reset between.

```
### PRE-CHANGE MIRROR (base f718069) — plant into CHANGELOG.md
exit=0
ALL CHECKS PASSED
lines naming CHANGELOG.md: 0
lines naming README.md:    0

### PRE-CHANGE MIRROR (base f718069) — plant into README.md
exit=1
        README.md:68:29 — banned standard-name literal "ASD-STE100" — "The grugops kit conforms to ASD-STE100 Simplified Technical English."
        README.md:68:40 — banned standard-name literal "Simplified Technical English" — "The grugops kit conforms to ASD-STE100 Simplified Technical English."
1 CHECK(S) FAILED
lines naming CHANGELOG.md: 0
lines naming README.md:    2
```

### POST-change mirror — the verdict MOVED

Mirror built from the tracked working tree; gate sha256 `26faf9938f2cfe35446e7d3ba19e0d60bc80eefaf969255ff8a0183f32c194c9`, verified byte-identical to the repository's. Mirror file count 1595 vs 1595 tracked. Clean-mirror control: exit 0, 1222 bytes.

```
### POST-CHANGE MIRROR — plant into CHANGELOG.md
exit=1
        CHANGELOG.md:124:29 — banned standard-name literal "ASD-STE100" — "The grugops kit conforms to ASD-STE100 Simplified Technical English."
        CHANGELOG.md:124:40 — banned standard-name literal "Simplified Technical English" — "The grugops kit conforms to ASD-STE100 Simplified Technical English."
1 CHECK(S) FAILED
lines naming CHANGELOG.md: 2
lines naming README.md:    0

### POST-CHANGE MIRROR — plant into README.md
exit=1
        README.md:68:29 — banned standard-name literal "ASD-STE100" — …
        README.md:68:40 — banned standard-name literal "Simplified Technical English" — …
1 CHECK(S) FAILED
lines naming CHANGELOG.md: 0
lines naming README.md:    2
```

The `CHANGELOG.md` verdict moved from exit 0 / unnamed to exit 1 / named at file:line:column; the `README.md` control is unchanged in both trees.

### The pin was READ OFF the gate's own refusal, twice

Task 1's intermediate run, verbatim — this is the derivation of `82 -> 83`:

```
  FAIL  the banned-claim scan set derived 83 document(s), expected exactly 82 (kit 73, publicDocs 11, overlap 1) — walk both parts' derivations and the BANNED_CLAIM_EXCLUDED_LOCATIONS reasons BEFORE updating BANNED_CLAIM_SCAN_COUNT in scripts/check-banned-claims.ts. …
        CHANGELOG.md:30:49 — banned token-economy literal "token economy" — "- Dialable memory and trajectory compaction for token economy, with a load-bearing-field carve-out"
        CHANGELOG.md:68:20 — banned token-economy literal "token-economy" — "preserved as the token-economy mechanism."
2 CHECK(S) FAILED
```

That run also confirms there was **no third occurrence** in the file: the changelog entered the scan whole and produced exactly the two findings the review reported.

Task 3's intermediate run, verbatim — the derivation of `83 -> 115`:

```
  FAIL  the banned-claim scan set derived 115 document(s), expected exactly 83 (kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, overlap 1) — walk every part's derivation and the BANNED_CLAIM_EXCLUDED_LOCATIONS reasons BEFORE updating BANNED_CLAIM_SCAN_COUNT …
1 CHECK(S) FAILED
```

One finding, and it is the pin. **Zero banned-claim findings across all 32 newly admitted documents** — the admission test, measured by the gate rather than by a grep.

### The new cases, RED-proven

The pre-change gate binaries (sha `b405a886…` and `47208dc5…`) were temporarily swapped in and the new cases run against them:

```
     × names a banned literal planted in CHANGELOG.md at file:line:column
AssertionError: expected '\n[guard_banned_claims] the shipped k…' to contain 'CHANGELOG.md:3:27 — banned token-econ…'

     × the changelog is a MEMBER of the derived scan set, and the pin counts it
AssertionError: expected [ 'AGENTS.md', 'CLAUDE.md', …(80) ] to include 'CHANGELOG.md'

     × the scan is the corpus minus EXACTLY the named exemptions, asserted three ways
TypeError: publicDocsCorpus is not a function

     × the two parts arrays are the SAME parts, and only the scan's are subtracted from
TypeError: Cannot read properties of undefined (reading 'map')
```

The first failure is the evidence: against the pre-change gate the planted finding line is **absent**, and `bannedClaimScan()` returns 81 members without `CHANGELOG.md` among them. Binaries were restored by `npm run build` and verified byte-identical to the post-change build before proceeding.

The plant sentence is **composed, not retyped**:

```ts
const CHANGELOG_PLANT_PREFIX = "- Compaction shipped as a ";
const CHANGELOG_PLANT_LINE = `${CHANGELOG_PLANT_PREFIX}${TOKEN_CLAIM.literal} win.`;
const CHANGELOG_PLANT_AT = { line: 3, column: CHANGELOG_PLANT_PREFIX.length + 1 };
```

`TOKEN_CLAIM` is selected from `BANNED_CLAIM_LITERALS` and pinned by the existing selection case, and the asserted column is derived from the prefix rather than written as a magic number.

### The new cases, mutation-proven

**Mutation A** — `publicDocsScan()` returns `PUBLIC_DOCS_CORPUS_PARTS` unfiltered:

```
     × the scan is the corpus minus EXACTLY the named exemptions, asserted three ways
     × the live tree derives exactly PUBLIC_DOCS_SCAN_COUNT documents, both directions
     × exits 0 when the ONLY planted hit is in the exempt CHANGELOG.md
     × PAIRED PLANT: names the non-exempt file and does NOT name CHANGELOG.md
     × fails the two-sided pin when a SIXTH public document appears, naming both numbers
     × exits 0 with a PASS line on a mirror carrying zero retired vocabulary
```

**Mutation B** — the `"memory-bank/"` prefix removed from `BANNED_CLAIM_EXCLUDED_LOCATIONS`:

```
     × the remainder of tracked markdown minus the scan is covered by an excluded prefix
AssertionError: expected [ 'memory-bank/00-index.md', …(8) ] to deeply equal []
+   "memory-bank/00-index.md", … all 9 named
```

**Mutation C** — a stale `"obsolete-dir/"` prefix added:

```
     × every excluded prefix still covers something, so a stale prefix cannot hide a live class
AssertionError: expected [ 'obsolete-dir/' ] to deeply equal []
```

All three mutations reverted; `git status --porcelain` carries no plant, mirror or fixture.

---

## The derived remainder, and where it disagrees with the round-5 review

Derived with `git ls-files '*.md'` minus the members `bannedClaimScan()` returns, grouped by leading path segment, **before** any admission:

```
tracked markdown        : 1340
bannedClaimScan members : 83
remainder               : 1257

class                    files
.claude/                 24
.planning/               779
docs/                    26
install/                 1
memory-bank/             9
plans/                   4
scripts/                 407
skills/                  7
```

Live banned-claim occurrences per class, measured with **the gate's own matcher** (`countBannedClaimOccurrences`), not a grep:

| class | files | live occurrences |
|---|---|---|
| `install/` | 1 | 0 |
| `.claude/` | 24 | 0 |
| `memory-bank/` | 9 | 0 |
| `plans/` | 4 | 0 |
| `skills/` | 7 | 0 |

**Disagreements with the round-5 review, named as findings rather than typos:**

1. **`plans/` is 4 files, not 1.** The review's WR-02 table names `plans/board.md` alone. `plans/metrics.md`, `plans/nfr-catalog.md` and `plans/traceability.md` are also tracked, also unscanned, and also unnamed anywhere.
2. **`skills/` (7 files) appears in no round-5 finding at all.** It was found only by deriving the remainder. It is hand-authored, it ships, and `scripts/generate-skill-twins.ts` reads it with `readFileSync` to render the `.claude/skills/*/SKILL.md` twins — so it is the very upstream the twins' transitive-coverage argument would have to rest on.
3. **`memory-bank/` is 9, matching the review.** The plan's `<measured_baseline>` recorded a session measurement of 8 and instructed the executor to derive rather than adopt either. Derived: **9**. The review's number is the correct one; the plan's session measurement was wrong.

## The `.claude/` transitive-coverage argument: TESTED and REFUTED

The round-5 review offered `.claude/agents/*.md` and `.claude/skills/*/SKILL.md` as "the generated adapters and skill twins (derived from role text, so covered transitively — but that transitivity is nowhere stated)". Reading the two generators rather than asserting it:

**`scripts/generate-role-adapters.ts` — REFUTED.** The adapter body is composed in `specialistBody()` and `coordinatorBody()` from **string literals in the generator's own TypeScript source**:

```ts
function specialistBody(a: Adapter): string[] {
  return [
    PROVENANCE, "", INVARIANT, "", ...RESOLVER, "",
    `Read \`agent-factory/roles/${a.file}\` now and act as that role. The role file does the`,
    "thinking; this adapter only points at it.",
    "",
    "Publish your typed notes per `agent-factory/workflows/16-context-read-write.md`. …",
    "",
    "Never merge to a protected branch. Never deploy to prod. Humans always hold merge and",
    "deploy.",
  ];
}
```

The generator's own header says the body is "single-sourced from `agent-factory/packaging/subagent.frontmatter.md`". That is a documentation convention, not a data flow: the only runtime `readFileSync` in that generator reads `agent-factory/roles/*.md` for the description and the capability line. `scripts/` is excluded from this gate by name, so a conformance, token-economy or comprehension claim typed into a body composer would have shipped into **all 17 adapters** with nothing in this repository reading it.

**`scripts/generate-skill-twins.ts` — REFUTED, more weakly.** It does `readFileSync` its bodies, from `skills/<dir>/SKILL.md` — which was itself unscanned until this commit admitted it — and then inserts a kit-root resolver block of its own. So even the honest half of the argument pointed at a document outside the gate.

**Verdict: the class was ADMITTED, not excluded.** An exclusion entry would have had to concede a live fail-open with no reason that survives, which `must_haves.truths` #3 forbids. The two freshness gates named in the source — `npm run freshness:adapters` and `npm run freshness:skill-twins` — are why admitting the OUTPUT is sufficient rather than second-best: a claim typed into a generator cannot reach a host machine without appearing in `.claude/` first, and it now reds there when it does.

`.claude/settings.local.json` carries `asd-ste100.org` inside a WebFetch tool permission. It is **not markdown** and is outside every markdown scan by construction; this is recorded in the source so a later reader who greps for the standard's name does not mistake it for drift the gate missed.

## Final disposition of every markdown class

| class | files | disposition |
|---|---|---|
| `agent-factory/` | 73 | scanned — part `kit` |
| root markdown + `examples/` + kit README | 11 | scanned — part `publicDocs` (**the corpus**, including `CHANGELOG.md`) |
| `install/README.md` | 1 | **ADMITTED** — part `installReadme` |
| `skills/` | 7 | **ADMITTED** — part `skillSources` |
| `.claude/` | 24 | **ADMITTED** — part `claudeAdapters` |
| `docs/` | 26 | excluded by name — records of what was decided; the claim registry quotes public sentences verbatim by design |
| `.planning/` | 779 | excluded by name — the planning record, archived at milestone close |
| `scripts/` | 407 | excluded by name — this module declares every literal and would fail its own check |
| `memory-bank/` | 9 | **excluded by name** — runtime dogfood state, D-16 build-time/runtime split, remedy written |
| `plans/` | 4 | **excluded by name** — same argument; the board and the trail a factory run emits |

```
$ node -e '… tracked minus bannedClaimScan(), grouped, checked against the exclusion prefixes'
FINAL: tracked 1340 | scanned 115 | remainder 1225
   .planning/       779 <- covered by an excluded prefix
   docs/            26  <- covered by an excluded prefix
   memory-bank/     9   <- covered by an excluded prefix
   plans/           4   <- covered by an excluded prefix
   scripts/         407 <- covered by an excluded prefix
EXCLUDED_LOCATIONS: ["docs/",".planning/","scripts/","memory-bank/","plans/"]
overlap: 1
```

**Zero classes uncovered.**

## The corpus plan 29-44 measures over

```
  PASS  banned claims: 0 findings over 115/115 elements
  PASS  LANG-04: 115 document(s) carry zero banned claim literal outside the one named exemption region — kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, overlap 1; 22 pinned literal(s) across 3 group(s), of which 3 are conditional on a co-occurring marker from their OWN pinned list ("Simplified Technical English" on 6 marker(s), "comprehension" on 7 marker(s), "understand" on 7 marker(s)); 1 exemption region (agent-factory/writing-profile.md § ## Disclaimer and honesty floor — …), which suppresses 12 banned-claim occurrence(s), pinned at 12, and reaches 62 line(s), pinned at 62 …; 8 candidate literal(s) refused at admission and recorded with their hit counts
ALL CHECKS PASSED
```

**The final scan-set cardinality is 115.** Plan 29-44's admission cost must be measured over this corpus, not over 82 or 83. `BANNED_CLAIM_EXEMPT_SUPPRESSED` (12) and `BANNED_CLAIM_EXEMPT_EXTENT` (62) are **unmoved**, as `<artifacts_this_plan_produces>` required — the exemption region is in a different file and nothing in this plan reached it.

## The corrected bound paragraph, in full

```
$ grep -c "does not exempt" scripts/check-public-docs-vocabulary.ts
2
```

Both occurrences are correct: one in the corrected bound, one inside the quoted record of what the paragraph used to claim.

```
// THE BOUND: the exemption forgoes THE RETIRED-VOCABULARY CHECK for this ONE named file, and that
// is the whole of what it does. It does not exempt any other root document. It does not exempt
// CHANGELOG.md from `check-banned-claims.ts`, which consumes `publicDocsCorpus()` — the
// PRE-exemption derivation below — and therefore DOES scan this file for conformance, token-economy
// and comprehension-benefit claims. Any future consumer must call the function whose NAME matches
// the question it is asking: `publicDocsCorpus()` for "which documents are public",
// `publicDocsScan()` for "which public documents does the retired-vocabulary check apply to".
//
// THIS PARAGRAPH ASSERTED THE OPPOSITE UNTIL ROUND 6, AND THE RECORD IS KEPT BECAUSE A CORRECTED
// PARAGRAPH WITH NO RECORD OF ITS CORRECTION TEACHES NOTHING. It read "it does not exempt
// CHANGELOG.md from any other gate" while `check-banned-claims.ts` imported `publicDocsScan()` and
// inherited this very subtraction — so the sentence was falsified by the import graph the day it
// was written. It was live-false with two occurrences: `CHANGELOG.md:30` carried `token economy`
// and `:68` carried `token-economy`, both members of that gate's `token-economy` group, both
// unscanned. A planted conformance claim in CHANGELOG.md exited 0 with the file never named, while
// the identical bytes in README.md exited 1 and were named twice.
//
// AND THE DISCRIMINATION IS HELD BY ASSERTIONS RATHER THAN BY THIS PARAGRAPH, which is the lesson
// the correction cost. A case in scripts/check-public-docs-vocabulary.test.ts plants the SAME string
// in CHANGELOG.md and in a second root document inside one mirror and asserts the vocabulary gate
// names the second and not the first; a second case there pins the corpus/scan relationship
// two-sided, so neither derivation can silently collapse into the other; and a case in
// scripts/check-banned-claims.test.ts plants a banned literal in CHANGELOG.md and asserts THAT gate
// names it at file:line:column. Prose cannot be false in a way a build notices. These can.
```

The forbidden-alternative paragraph immediately below it is byte-unchanged.

## Verification commands, recorded by name

| command | exit |
|---|---|
| `npm run build` | 0 |
| `npm run typecheck` | 0 |
| `npm run freshness` | 0 — "All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild." |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `npm run check:public-docs` | 0 |
| `npm run check:audit-register` | 0 |
| `npm run check:claim-anchors` | 0 |
| `npm run check:banned-claims` | 0 |
| `npm run check:imperative-lexicon` | 0 |
| `npm run check:diff-disposition` | 0 |
| `npm run check:nul-bytes` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **52 files, 2060 passed, 2 skipped** |

`npm test` was **not** run (it spawns the live claude CLI lane). The suite is **2060 passing against the round-5 baseline of 2054** (+6: five new cases plus one existing case split by rename). The 2 skips are pre-existing and in files this plan did not touch — `install.test.ts` ("D-08: sh-vs-Node byte-parity check is intentionally retired") and `generate-role-adapters.test.ts` ("refuses two roles whose adapter names differ only by case"); both are present at `HEAD~3`.

`git status --porcelain` shows no plant, mirror or fixture on the working tree. `package.json` and `package-lock.json` are byte-unchanged since `f718069` (T-29-43-SC).

## Decisions Made

1. **The subtraction lives in the scan-PARTS view, not in `publicDocsScan()`'s body.** The review's fix sketch put it in the function body. This gate's PASS line and its two-sided pin both print a per-part breakdown, so a subtraction applied only to the concatenation would print `root 5, examples 5, kitReadme 1` beside a total of 10. One hand-authored parts array (`PUBLIC_DOCS_CORPUS_PARTS`), one derived view (`PUBLIC_DOCS_SCAN_PARTS`), subtraction at one place, and `publicDocsScan()` is the view's concatenation. A new case asserts the view is exactly the corpus parts filtered.
2. **No second pin for the corpus.** The corpus and the scan differ by a frozen one-member array. A corpus that grew by a non-exempt document grows the scan and trips `PUBLIC_DOCS_SCAN_COUNT`; a corpus that grew by an exempt one is impossible without editing an array whose own freeze case refuses it. The corpus is additionally pinned from the other side by `BANNED_CLAIM_SCAN_COUNT`, which is two-sided over a union the corpus is half of. A third pin would be a number to maintain, not a question anyone is asking — and the reasoning is written at the constant.
3. **`.claude/` and `skills/` were admitted rather than excluded** — see the refutation section. `must_haves.truths` #3 requires an exclusion reason that "survives the objection raised against it", and neither class has one.
4. **`bannedClaimScanOverlap()` was generalised.** It read `BANNED_CLAIM_SCAN_PARTS[0]` against `[1]` by index. Adding a third part would have left `sum(parts) − overlap = total` silently wrong in the PASS line while every pin stayed green — the hand-maintained-index form of the set-literal drift this repository has already been bitten by.

## Deviations from Plan

### Auto-fixed / scope-extended items

**1. [Rule 2 — missing critical functionality] `.claude/` and `skills/` admitted rather than excluded**
- **Found during:** Task 3
- **Issue:** The plan directed one admission (`install/README.md`) and a prove-or-refuse verdict on `.claude/`. Reading `scripts/generate-role-adapters.ts` refuted the transitive-coverage argument outright, and deriving the remainder surfaced `skills/`, a fifth class the round-5 review never enumerated. An exclusion entry for either would have had to concede a live fail-open with no surviving reason, which `must_haves.truths` #3 forbids.
- **Fix:** Both admitted as derived parts with per-part vacuity floors and named refusals; `BANNED_CLAIM_SCAN_COUNT` moved to 115 in the same commit, read off the gate's own refusal text. Measured admission cost: 0 reds.
- **Impact:** The corpus this plan leaves for 29-44 is **115**, not the 84 a plan-literal reading would have produced. This is stated prominently above because Task 1's `<reversibility rating="costly">` note warns that every later measurement in this round is taken over whatever corpus this plan leaves.
- **Committed in:** `56ee625`

**2. [Rule 1 — bug] `bannedClaimScanOverlap()` hard-coded two part indices**
- **Found during:** Task 3
- **Issue:** `BANNED_CLAIM_SCAN_PARTS[0]` vs `[1]`. With five parts the reported arithmetic would have stopped adding up while every pin stayed green.
- **Fix:** Generalised to count duplicate memberships across all parts.
- **Verification:** `bannedClaimScanOverlap()` returns 1; the existing case asserting `sum(parts) − overlap === BANNED_CLAIM_SCAN_COUNT` passes at five parts.
- **Committed in:** `56ee625`

**3. [Rule 3 — blocking] the mirror's `PUBLIC_DOCS = 10` was a typed constant**
- **Found during:** Task 1
- **Issue:** `check-banned-claims.test.ts` derived `FILLER_COUNT` from a hand-typed `PUBLIC_DOCS = 10`, which silently omitted the `CHANGELOG.md` the mirror had always written — the same omission the gate itself was making.
- **Fix:** Derived from what `makeMirror()` actually writes.
- **Committed in:** `1834f4d`

**Total deviations:** 3 (1 × Rule 2, 1 × Rule 1, 1 × Rule 3). **Impact:** no scope creep on the matcher, the literals or the exemption region; all three are corpus-side and all cost zero reds.

## Issues Encountered

**The `/tmp` symlink fabricated a green.** Documented in full above. It is worth restating as the phase's twenty-sixth harness catch: the run produced `exit=0` with **zero bytes of output**, and only the premise assertion distinguished "the gate passed" from "the gate never ran". Every subsequent mirror invocation in this plan gates its verdict on `[ -s out ] && grep -q guard_banned_claims out`.

## Known Stubs

None. No hardcoded empty value, placeholder or unwired data source was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary was introduced. The three new derivations are read-only `existsSync`/`readdirSync`/`statSync` walks over fixed literal paths joined to the repo root, matching `kitMarkdown()`'s existing posture, and each is bounded by the shared `MAX_WALK_ENTRIES` budget with a named refusal on overflow.

## Residual observed but NOT closed by this plan

**`CHANGELOG.md:67` still reads "sharper-per-token".** It is not a member of `BANNED_CLAIM_LITERALS` and the gate does not flag it, so it is green by the current prohibition. It is recorded here rather than silently left because it sits on the same line as the sentence this plan rewrote and is arguably a token-economy win claim of the same family the `token-economy` group exists to hold. The plan scoped the rewrite to "remove the assertion of WHY", and removing this phrase as well would have been re-narrating a v1.2 entry beyond that instruction. **Direction: fail-open. Live count: 1. Remedy: either admit a literal for the `sharper-per-token` shape with its own measurement, or rewrite the phrase — never weaken anything.** Escalated to the next round rather than absorbed.

## Self-Check: PASSED

Created/modified files verified present:

```
FOUND: scripts/check-public-docs-vocabulary.ts
FOUND: scripts/check-public-docs-vocabulary.js
FOUND: scripts/check-public-docs-vocabulary.test.ts
FOUND: scripts/check-banned-claims.ts
FOUND: scripts/check-banned-claims.js
FOUND: scripts/check-banned-claims.test.ts
FOUND: CHANGELOG.md
```

Commits verified present in `git log`:

```
FOUND: 1834f4d  fix(29-43): the banned-claim gate scans the corpus its PASS line claims (CR-01)
FOUND: 9d6a146  test(29-43): the case that would have caught CR-01, and the paragraph that denied it
FOUND: 56ee625  fix(29-43): every unscanned markdown class dispositioned by name (WR-02)
```

Each `.ts` was rebuilt and its committed `.js` twin staged in the SAME commit as its source; `npm run freshness` exits 0 at HEAD.

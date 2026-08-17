---
phase: 29-controlled-language-voice-guard-rebuild
reviewed: 2026-08-17T20:05:00Z
depth: standard
round: 6
diff_base: f718069
head: 2f66124
files_reviewed: 8
files_reviewed_list:
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.test.ts
  - scripts/check-nul-bytes.ts
  - scripts/check-nul-bytes.test.ts
  - scripts/check-public-docs-vocabulary.ts
  - scripts/check-public-docs-vocabulary.test.ts
  - scripts/generate-catalog.ts
  - scripts/generate-catalog.test.ts
findings:
  critical: 2
  warning: 6
  info: 4
  total: 12
status: issues_found
---

# Phase 29 (gap-closure round 6): Code Review Report

**Reviewed:** 2026-08-17T20:05:00Z
**Depth:** standard
**Diff range:** `f718069..HEAD` (`2f66124`; plans 29-43, 29-44, 29-45, 29-46, 29-47)
**Status:** issues_found

## Summary

**The round's arithmetic is honest and its two headline residuals reproduce exactly as recorded.** I
re-derived every published number independently: the corpus is 115 documents (kit 73, publicDocs 11,
installReadme 1, skillSources 7, claudeAdapters 24, overlap 1), the exemption suppresses 14
occurrences across `standard-name 8, token-economy 2, comprehension 4`, its extent is 62,
`agent-factory/writing-profile.md` is 295 lines so `endBefore (296) === lines.length (296)` and
`V-29-47-02` is **confirmed** — the sole carve-out genuinely has no bottom boundary.
`V-29-47-03` is **confirmed by inspection**: `locateExemptRegion` returns `headingAt` and nothing
anywhere pins it; only `endBefore − headingAt` and the suppressed total are pinned, both of which a
rigid translation preserves. `V-29-47-01` is **confirmed and understated** — see IN-04. The nul gate's
corrected characterisation of git's classifier is **confirmed by measurement**: on git 2.55.0 a file
carrying one VTAB in 3 printable bytes is `w/-text` while the same byte in 2000 printable bytes is
`w/lf`, so it is a ratio heuristic exactly as 29-45 says, and a NUL at byte 20 000 still forces
`-text`, so arm 1's soundness claim holds.

**Two things this round shipped are FAIL-OPEN, and I reproduced both end to end on `git archive HEAD`
mirrors whose gates are byte-identical to the repository's.**

1. **D-53 made the exemption region the sole carve-out, and nothing constrains what is written inside
   it.** One line replaced inside the region — the honest denial *"There is no evidence that controlled
   language improves comprehension for a language model."* swapped for *"grugops is a token economy: the
   token economy is the whole product."* — holds `extent` at 62 and `suppressed` at 14 exactly, and
   `check-banned-claims`, `check-claim-anchors`, `check-audit-register`, `check-imperative-lexicon`,
   `check-public-docs-vocabulary`, `check-uat-oracles` and `check-foundation-guards` **all exit 0**. The
   only quantity that moves is the per-group breakdown the PASS line publishes, and 29-45 deliberately
   moved that number out of the source and pinned it nowhere. This is NOT `V-29-32-01` (no fence, no
   swallow), NOT `V-29-47-02` (no append, no re-pin protocol) and NOT `V-29-47-03` (the boundary does
   not move). It is a single-line edit inside the declared region.
2. **The kit's two shipped JSON manifests are user-visible claim surfaces that no gate reads.**
   `.claude-plugin/marketplace.json`'s `description` — the string a user meets in
   `/plugin marketplace add` — accepted *"controlled language that improves comprehension for language
   models and saves tokens"* with every gate green. Round 6's WR-02 closure dispositioned every unscanned
   **markdown** class by name, but its denominator is `git ls-files '*.md'`, so the markdown class
   boundary itself is never declared. The audit register already names `.claude-plugin/plugin.json` as a
   safety-claim home.

**One thing is fail-CLOSED but breaks a stated structural invariant and the project's own tooling.**
29-43 admitted `.claude/` as a **disk walk**. `.claude/worktrees/` exists on this tree today and is the
directory `~/.claude/gsd-core/workflows/execute-phase` creates isolated worktrees in
(`WT_PATH="${ORCH_ROOT}/.claude/worktrees/${AGENT_ID}"`). I planted a nested `docs/audit/` and
`.planning/` under it and the gate reported findings **on the claim registry and on a planning
document** — the exact classes `BANNED_CLAIM_EXCLUDED_LOCATIONS` exists to keep out, and the exact harm
the module's header says the exclusion prevents — while **both** assertions that hold that list stayed
green.

Build state at review time: `node scripts/check-banned-claims.js` exit 0, `node scripts/check-nul-bytes.js`
exit 0 (1602 tracked files, 0 `-text`). No file in this diff is binary-classified. Every plant in this
review was written to a `/private/tmp` mirror and deleted; `git status --porcelain` is unchanged from the
state I found it in.

---

## Critical Issues

### CR-01: the sole carve-out is bounded positionally and not at all by content — one line inside it turns a denial into a live banned claim with every pin green

**File:** `scripts/check-banned-claims.ts:1241` (`BANNED_CLAIM_EXEMPT_SUPPRESSED = 14`),
`scripts/check-banned-claims.ts:1301` (`BANNED_CLAIM_EXEMPT_EXTENT = 62`),
`scripts/check-banned-claims.ts:1528-1537` (the suppression branch),
`scripts/check-banned-claims.ts:1686-1688` (the published breakdown),
`scripts/check-banned-claims.test.ts:2573-2638` (the case that is supposed to hold it)

**Issue.** D-53's argument is stated at `BannedClaimLiteral`'s doc comment (`:234-241`): *"The only
bounded thing in this design is the one named exemption region, and a region is POSITIONAL."* That is
true and it is the hole. The region is bounded in POSITION; nothing bounds its CONTENT. The two pins are
cardinalities — how far it reaches and how many occurrences it lifts — and both are preserved by any
edit that swaps one banned occurrence for another at equal line count. The empty-region refusal
(`:1149-1157`) is the only content check, and it fires only when every body line is blank.

29-45 (WR-01) then removed the last static description of the region's composition. The per-group
breakdown used to be typed in the source; it is now computed in the run and printed, on the argument
that *"a number restated in a comment is a second declaration of a measurement, and a second declaration
can only rot"*. The argument is right about restatement and wrong about consequence: the breakdown moved
from a rotting comment to **no assertion at all**. The case at `check-banned-claims.test.ts:2573`
looks like the pin and is not — it parses the components out of the run and compares them to
`bannedClaimGroupTally` over the **same live document**, so both sides move together. Its own comment
says so: *"the mirror's exemption region is padded with a single repeated filler, so its group
distribution is degenerate by construction"*. It is a self-consistency check, not a pin.

**Reproduction (hermetic mirror, `git archive HEAD`, gate byte-identical to the repository's).**

Premise asserted first — fresh mirror green at 115 / 14 / 62. Then exactly one line changed:

```
BEFORE line 288: "There is no evidence that controlled language improves comprehension for a language model. The kit"
AFTER  line 288: "grugops is a token economy: the token economy is the whole product."
```

The line is not inside any registry-anchored block (`C-28-039` is at `:237`, `C-28-042` at `:255`), so
the byte-freeze that `check-claim-anchors` applies to those two paragraphs does not reach it. Result:

```
check-banned-claims          -> ALL CHECKS PASSED
check-claim-anchors          -> ALL CHECKS PASSED
check-audit-register         -> ALL CHECKS PASSED
check-imperative-lexicon     -> ALL CHECKS PASSED
check-public-docs-vocabulary -> ALL CHECKS PASSED
check-uat-oracles            -> ALL CHECKS PASSED
check-foundation-guards      -> ALL CHECKS PASSED

suppresses 14 banned-claim occurrence(s) (standard-name 8, token-economy 4, comprehension 2)
```

`suppressed` is still 14 and `extent` is still 62. The kit now ships a disproven token-economy claim
inside the section whose stated purpose is to deny claims, and the only visible difference between a
correct tree and this one is `token-economy 2, comprehension 4` becoming `token-economy 4,
comprehension 2` in a PASS line nothing asserts against.

The wholesale form is worse and I measured it too: replacing the entire 61-line body with 14
token-economy claims plus filler also holds both pins and `check-banned-claims` exits 0 — there, the
`check-claim-anchors` verbatim freeze on `C-28-039`/`C-28-042` is what reds, which means the ONLY thing
standing between this gate and a fully rewritten "disclaimer" is two anchored paragraphs owned by a
different gate.

**Direction: FAIL-OPEN, and reachable with no protocol violation.** `V-29-47-02`'s route needs an author
to re-pin after a refusal. This route produces no refusal to ignore.

**Fix.** Two changes, both in this repository's own idiom:

1. Pin the composition, not just the total — the run already computes it:

```ts
// beside BANNED_CLAIM_EXEMPT_SUPPRESSED, two-sided like every other pin in this module
export const BANNED_CLAIM_EXEMPT_SUPPRESSED_BY_GROUP: Readonly<Record<BannedClaimGroup, number>> = {
  "standard-name": 8,
  "token-economy": 2,
  comprehension: 4,
};
// in runAll(), after the total pin:
for (const [g, n] of suppressedByGroup) {
  if (n !== BANNED_CLAIM_EXEMPT_SUPPRESSED_BY_GROUP[g]) fail(/* names group, derived, declared */);
}
```

   This raises the cost of the substitution from one line to a same-group substitution, which is a
   strictly smaller class. It does not close it.

2. Close it structurally: require every suppressed occurrence to sit on a line inside a
   registry-anchored verbatim block. The mechanism already exists and already works —
   `check-claim-anchors` byte-freezes `C-28-039` and `C-28-042` against the registry. Extending anchor
   coverage over the region and asserting `suppressed occurrences ⊆ anchored lines` makes the carve-out
   positional AND content-bound, which is what "the region is the only bounded thing" has to mean if it
   is to carry D-53's weight. Do NOT weaken the matcher, and do NOT put a digest over the whole file —
   the module has already reasoned correctly against that.

### CR-02: the kit's two shipped JSON manifests are user-visible claim surfaces outside every gate, and the round's markdown-only class boundary is never declared

**File:** `scripts/check-banned-claims.ts:676-735` (the exclusion block and
`BANNED_CLAIM_EXCLUDED_LOCATIONS`), `scripts/check-banned-claims.ts:864-867` (the one non-markdown file
that IS dispositioned), `scripts/check-banned-claims.test.ts:2300-2340` (the coverage case)

**Issue.** Round 6's WR-02 closure derives the unscanned remainder as `git ls-files '*.md'` minus
`bannedClaimScan()`, and dispositions every remaining **markdown** class by name. The denominator is the
finding. The module dispositions exactly one non-markdown path — `.claude/settings.local.json`, at
`:864-867` — and says nothing about the class boundary itself, so the two files that carry grugops's
public marketing prose to every plugin-manager user are outside the gate and outside the exclusion list:

```json
// .claude-plugin/marketplace.json
"description": "grugops marketplace — the file-based agent factory for disciplined, auditable software delivery ..."
// .claude-plugin/plugin.json
"description": "grugops — a file-based agent factory for disciplined software delivery. ..."
```

`docs/audit`'s register already names `.claude-plugin/plugin.json` as a safety-claim home (it appears in
`check-audit-register`'s equality-four output as one of four claim-bearing files), so the repository
already knows this file makes claims. The banned-claim gate has never read it.

**Reproduction (same mirror protocol).** Planting into `marketplace.json`:

```
description: "grugops marketplace — controlled language that improves comprehension for language models and saves tokens."

check-banned-claims          -> ALL CHECKS PASSED
check-claim-anchors          -> ALL CHECKS PASSED
check-audit-register         -> ALL CHECKS PASSED
check-public-docs-vocabulary -> ALL CHECKS PASSED
```

That string contains `improves comprehension`, `comprehension` and `understand`-free token language and
would be a three-finding red in any `.md` file in the corpus. `plugin.json` is *accidentally* partly
covered: mutating its `description` reds `check-claim-anchors` with *"C-28-038's verbatim text is not
present in the file"* — presence, not content, and only because a registry row happens to quote it.
`marketplace.json` has no such row and is completely open.

**Direction: FAIL-OPEN, live-reachable, and the artifact ships.** This generalises `V-29-47-06` (the CI
workflow being outside every markdown scan), which the round recorded as a one-off; the general
statement — *this gate's class is markdown, and the shipped non-markdown claim surfaces are
undispositioned* — is not recorded anywhere.

**Fix.** Add a sixth derived part rather than an ad hoc filename, exactly as `installReadme` was added:

```ts
const PLUGIN_MANIFESTS = [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json"];
// members derived against the disk (the installReadmeMembers precedent: [] + a named refusal when absent),
// scanned line-oriented like every other member, and BANNED_CLAIM_SCAN_COUNT moved in the same commit.
```

and extend the coverage case at `check-banned-claims.test.ts:2300` so its denominator is the shipped
**text** surface rather than `*.md` — at minimum `git ls-files '*.md' '*.json'` minus a declared
data-only exclusion list, so the next non-markdown claim surface reds on the day it lands instead of
four rounds later.

---

## Warnings

### WR-01: `.claude/` was admitted as a DISK walk, so the prefix exclusions are defeated by nesting — and this repository's own execution tooling creates a full checkout inside it

**File:** `scripts/check-banned-claims.ts:832-873` (`claudeAdapterMarkdown`),
`scripts/check-banned-claims.ts:729-735` (`BANNED_CLAIM_EXCLUDED_LOCATIONS`),
`scripts/check-banned-claims.ts:686-688` (*"the exclusion is structural"*),
`scripts/check-banned-claims.test.ts:2464-2472` (the assertion that is supposed to hold it)

**Issue.** The header argues the exclusions hold structurally: *"the parts below simply never reach
docs/"*. That was true of the two-part corpus. It stopped being true the moment `.claude/` became a
recursive disk walk, because the exclusions are **prefix tests on the derived relative path** and a
nested copy of an excluded directory does not carry its prefix. `.claude/worktrees/` exists on this tree
right now (empty, untracked, not gitignored) and is where the isolation dispatch used to execute this
project's own phases puts worktrees:

```
~/.claude/gsd-core/workflows/execute-phase/steps/executor-isolation-dispatch.md:150
WT_PATH="${ORCH_ROOT}/.claude/worktrees/${AGENT_ID}"
```

**Reproduction.** Fresh mirror green at 115; then two files planted under
`.claude/worktrees/phase-30/`:

```
FAIL  the banned-claim scan set derived 117 document(s), expected exactly 115
      (kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 26, overlap 1)
FAIL  banned claims: 3 finding(s) over 117 elements
      .claude/worktrees/phase-30/.planning/29-99-PLAN.md:1:35 — banned token-economy literal "token economy"
      .claude/worktrees/phase-30/docs/audit/claim-registry.md:1:51 — banned standard-name literal "ASD-STE100"
      .claude/worktrees/phase-30/docs/audit/claim-registry.md:1:62 — banned standard-name literal "Simplified Technical English"
```

The gate reported the claim registry for holding the text it exists to hold — which is verbatim the
harm `:679-683` says the `docs/` exclusion prevents — and it reported a `.planning/` document. **Both
guarding assertions stayed green while it did:** `check-banned-claims.test.ts:2464` asserts
`member.startsWith(excluded) === false`, which is TRUE for `.claude/worktrees/x/docs/…`; and the
remainder case at `:2300` only checks `tracked ⊆ scan ∪ excluded`, never `scan ⊆ tracked`.

A real worktree is ~1347 markdown files, so the practical outcome is a gate that reds with a refusal
whose designed remedy is *"moving the pin is how you acknowledge that it did"* — i.e. the message walks
the author toward baking an ephemeral local checkout into a committed constant. Direction is fail-closed
at the verdict; the defect is that a derivation documented as structurally unable to reach excluded
locations reaches them.

**Fix.** Anchor the exclusion at the walk instead of at the path prefix, and derive membership from the
tracked set rather than from the disk:

```ts
// in walkFiles: refuse to descend into an excluded segment at ANY depth
const EXCLUDED_SEGMENTS = new Set(["docs", ".planning", "scripts", "memory-bank", "plans", "worktrees", "node_modules"]);
if (st.isDirectory() && EXCLUDED_SEGMENTS.has(basename(rel))) return null;
```

and add the missing direction to the coverage case — `expect(bannedClaimScan().filter(p => !tracked.includes(p))).toEqual([])` — so a scan member that this repository does not version reds by name. (`scripts/check-nul-bytes.ts` already gets this right: its set is `git ls-files`, and it has a case asserting an untracked NUL-bearing file does not fire.)

### WR-02: the exemption region is measured on one read of the document and applied to a second read — the module's own "ONE READ" invariant is false

**File:** `scripts/check-banned-claims.ts:1464-1467`, `:1478-1479`, `:1507`, `:1520`, `:1600`

**Issue.** The comment at `:1464` states the invariant: *"ONE READ OF THE EXEMPTION DOCUMENT, AND EVERY
QUESTION BELOW IS ASKED OF IT. This plan's whole subject is two expressions assembling one document twice
and drifting apart; re-reading the file for the boundary check further down would have been that shape
again, at the same address."*

The boundary check does honour it (`:1600` uses `exemptText`). The **scan loop does not.** `:1507`
re-reads every scan member including the exempt file, `:1520` splits that second read into `lines`, and
`:1528` spends `region.headingAt` / `region.endBefore` — indices measured over the *first* read — against
that second array. Two reads of one document, two arrays, indices crossing between them. That is the
same coordinate-shear shape `locateExemptRegion`'s `scanLines.length !== lines.length` refusal
(`:1070-1081`) was written to make unreachable, and that refusal cannot see this one because both arrays
are internally consistent; they are just not the same document.

**Failure scenario.** The exempt document is rewritten between `:1478` and its turn in the scan loop (a
concurrent editor save, a generator or formatter running in the same CI job, an `npm run check` racing a
watch task). If two lines are inserted above the heading in that window, `[headingAt, endBefore)` now
covers two lines that were never inside the region and stops two lines short of its real end; occurrences
in the last two disclaimer lines are reported as findings and occurrences in the two lines above the
heading are silently suppressed. The extent pin compares a number derived entirely from read #1 and does
not notice; the suppressed pin can be satisfied by a compensating pair.

**Fix.** Read the exempt document once and reuse it, which is what the comment already promises:

```ts
const text = file === BANNED_CLAIM_EXEMPT_REGION.file ? exemptText : readFileSync(abs(file), "utf8");
```

Low likelihood, one line to fix, and it makes a stated invariant true.

### WR-03: `check-nul-bytes.ts` still asserts, at the declaration that justifies its new field, the exact claim the same module measured FALSE — and its worked example is contradicted by the module's own table

**File:** `scripts/check-nul-bytes.ts:361-364`; corroborating sites `:390-393`,
`scripts/check-nul-bytes.test.ts:317-320`; contradicted by `:124-133` and `:554-566`

**Issue.** 29-45's headline correction is that git's `-text` verdict is not NUL-based. The header says so
at `:124-133`, the cross-check says so at `:554-566` with the measured table, `WINDOWS.md` row 43 records
it as *"Corrected in place"*, and the round-6 residual register lists it as `29-45 R4`. The correction
missed the site that argues for the field's existence:

```ts
   * git's `-text` verdict is itself NUL-based, so a file carrying a stray 0x0d and no NUL is a
   * legitimate finding here and correctly NOT `-text` to git.
```

Both halves are false, and the second is falsified by the table 190 lines below in the same file
(`0x0d -> w/-text`). I re-measured on git 2.55.0 in a throwaway repository:

```
i/-text w/-text attr/   cr.txt      # "hello\rworld\n" — one CR, no NUL
i/-text w/-text attr/   deep.txt    # NUL at byte 20000 — still forced
i/lf    w/lf    attr/   esc.txt     # one ESC
i/lf    w/lf    attr/   ratio.txt   # 2000 printable + one VTAB  <- ratio, not a byte test
i/-text w/-text attr/   vtab.txt    # 3 printable + one VTAB
```

The **code** is right — arm 2 excludes any file with a forbidden byte, so the CR case never reaches the
disagreement refusal. Only the prose is wrong, and it is the prose a future editor will reason from when
deciding whether `bytes` is still needed. This is the round's own recurring pattern: a three-site
correction that missed a fourth site.

**Fix.** Rewrite `:361-364` to state what the field is actually for, and delete the false example:

```ts
   * Carried because the class this gate decides is wider than the one byte it is named for, and the
   * git cross-check is anchored on the NUL SUB-CLASS only: a NUL forces git's verdict unconditionally,
   * while the rest of the class does not (git's `-text` is a ratio heuristic — see :554). Without the
   * byte values, arm 1 could not tell a NUL-bearing file from a CR-bearing one.
```

Then re-audit the same claim at `:390-393` and `check-nul-bytes.test.ts:317-320`.

### WR-04: `nulOffsets()` is production-dead and its doc comment names it as the load-bearing half of the cross-check

**File:** `scripts/check-nul-bytes.ts:370-385` (the function), `:386-397` (the claim), `:570-572` (what
the cross-check actually calls)

**Issue.** The doc comment at `:390-393` says: *"`nulOffsets` above is kept and is NOT a duplicate of
this: it is the NUL-only predicate, and it is what the git `--eol` cross-check is asked… The two answer
different questions on purpose and the difference is stated at both call sites."*

There is no such call site. `runAll()` derives its NUL set from `controlByteOffsets`' output:

```ts
const nulBearingPaths = new Set(hits.filter((h) => h.bytes.includes(NUL)).map((h) => h.path));
```

A repo-wide grep finds `nulOffsets` referenced only in `check-nul-bytes.test.ts` (5 call sites) and in
comments. So the module now carries **two implementations of the NUL predicate** — `buf.indexOf(0)` and
`bytes.includes(NUL)` filtered out of the wide scan — and the one the prose declares authoritative is
exercised only by tests. That is the duplicate-authority shape this repository closes by deletion or by
a declared boundary, landing inside the plan whose stated subject was *"where the narrower duplicate
was"*.

**Fix.** Either use it — `const nulBearing = hits.filter(h => nulOffsets(readFileSync(join(ROOT,h.path))).length > 0)` is wasteful; better is to make `controlByteOffsets` the sole scanner and have the cross-check ask `hit.bytes.includes(NUL)` **with the comment corrected to say so** — or delete `nulOffsets` and move its three test cases onto `controlByteOffsets`. What must not survive is a comment naming a call site that does not exist.

### WR-05: `check-banned-claims.ts` consumes `publicDocsCorpus()` but drops that module's derivation-refusal channel on the floor

**File:** `scripts/check-banned-claims.ts:140` (the import), `:788-790` (`publicDocsMembers`), `:739`
(this module's own `DERIVATION_REFUSALS`), `scripts/check-public-docs-vocabulary.ts:152`, `:329-336`

**Issue.** Both modules follow the throw-versus-report split by collecting derivation refusals in a
module-private array and printing them in their own `runAll()`. `PUBLIC_DOCS_CORPUS_PARTS` is evaluated
at **import** time, so when `check-banned-claims` imports `publicDocsCorpus`, any refusal raised while
deriving the corpus — an unreadable repository root (`check-public-docs-vocabulary.ts:256`), a walk that
blew `MAX_WALK_ENTRIES` in `examples/` (`:175-182`), a missing `agent-factory/README.md` (`:301-305`) —
lands in the *other* module's array and is never printed by the gate that is running.

**Failure scenario.** `examples/` gains enough entries (or a symlink loop) to blow the walk budget.
`examplesMarkdown()` returns a **partially collected** list plus a refusal nobody reads.
`check-banned-claims` sees a `publicDocs` part that is non-empty, so the per-part vacuity floor is
silent, and reports:

```
FAIL  the banned-claim scan set derived 113 document(s), expected exactly 115 (… publicDocs 9 …)
```

— a cardinality complaint whose remedy text tells the author to *"walk every part's derivation"*, with
no mention that a derivation refused. The named refusal, which is the diagnostic, is lost. The verdict
is still fail-closed; the diagnosis is wrong.

**Fix.** Export the channel with the data, e.g. `export function publicDocsDerivationRefusals(): readonly string[]` in `check-public-docs-vocabulary.ts`, and fold it into the consumer's refusal loop at `check-banned-claims.ts:1423`. A refusal that is only reported by the module that raised it is not a refusal for any importer.

### WR-06: the reporting loop re-reads a file it already read, unguarded, and an initialised submodule is misreported as an I/O error

**File:** `scripts/check-nul-bytes.ts:509`, `:439`

**Issue.** Two small holes in a module whose stated floor is *"a stack trace is not a verdict"*.

1. `:509` — `scanTracked()` carefully separates ENOENT (`missing`) from other read failures
   (`unreadable`) and never lets an unreadable file kill the run. The reporting loop then re-reads the
   same path with a bare `readFileSync(join(ROOT, hit.path))` to compute the line/column. A file removed
   between the scan and the report (a concurrent `git checkout`, a build step in the same CI job) throws
   an unhandled ENOENT out of `runAll()`, and the gate dies with a `node:internal` frame instead of
   reporting — which is precisely what `check-audit-register.test.ts:371` asserts a sibling gate never
   does.
2. `:439` — a tracked gitlink for an **initialised** submodule is a directory on disk;
   `readFileSync` raises EISDIR, not ENOENT, so it is reported as *"PRESENT BUT UNREADABLE … permissions,
   or an I/O error"*. The header at `:419-424` claims the `missing`/`unreadable` split names the situation
   correctly and explicitly cites *"an uninitialised submodule gitlink"* — the initialised case is named
   nowhere and reds with the wrong cause. This repository has no submodules today, which is why nothing
   has noticed.

**Fix.** Keep the buffer instead of re-reading it (`NulHit` can carry it, or `locate()` can be called
inside `scanTracked` where the buffer is already in hand), and add an `EISDIR` arm that names the gitlink
case:

```ts
if (code === "ENOENT") missing.push(rel);
else if (code === "EISDIR") gitlinks.push(rel);   // a submodule checkout, not a file
else unreadable.push(rel);
```

---

## Info

### IN-01: the case added to end cardinality drift restates the contract it holds

**File:** `scripts/generate-catalog.test.ts:212-214`, against `scripts/generate-catalog.ts:281-282`

29-46 deleted the stale `00..15` prose from the generator on the correct ground that *"the regex IS the
contract and it is RANGE-FREE"*, and added a case deriving the on-disk corpus. The case derives it with a
**hand-copied duplicate** of that regex (`/^\d{2}-.+\.md$/` typed in both files) rather than importing
it, because `generate-catalog.ts` is a top-level script that executes on import and exports nothing.
The two can now disagree: widen the generator's regex to `\d{2,3}` and the test keeps the old contract
and stays green as long as the file set happens not to change. This is the named failure mode
(hand-maintained literal that rots while green) reappearing one level down, inside its own remedy.
Extract the pattern into `scripts/kit-model.ts` beside `WORKFLOW_COUNT` and have both sides import it.

### IN-02: an unenforced uniqueness claim survives, with a point-in-time measurement typed in beside it

**File:** `scripts/generate-catalog.ts:365-366`

The same plan that says *"The remedy for a stale number is to delete it, never to type a fresher one in
the same place"* (`:19-27`) leaves this one screen below:

```ts
// Workflows: numeric `order` ascending (unique — no tie-break needed; the uniqueness claim was
// re-verified in round 5, the range that used to be typed here had not been and was stale).
```

Nothing in the repository enforces uniqueness of workflow `order` — I grepped `kit-model.ts`,
`validate-agent-factory.ts` and `check-foundation-guards.ts` for a duplicate/`Set` check on it and found
none. So a standing property is asserted from a one-off measurement, which is the same shape as the
count that was just deleted. Impact is small (V8's sort is stable, so the catalog stays deterministic),
but either assert it — `expect(new Set(orders).size).toBe(orders.length)` in `generate-catalog.test.ts` —
or drop the parenthetical.

### IN-03: the walk bound is applied five times independently, so the effective budget is 5 × MAX_WALK_ENTRIES

**File:** `scripts/check-banned-claims.ts:118-120`, `:778`, `:827`, `:870`;
`scripts/check-public-docs-vocabulary.ts:279`

The comment says *"The walk's WORK bound is taken from the ONE place this repository declares it rather
than restated as a second literal"*, which is true of the constant. The **budget** is a fresh
`{ examined: 0 }` per part — three in this module plus one in the imported corpus derivation — so a
single run of this gate can examine 40 000+ entries before any refusal fires, and no single part's
refusal reflects the work the gate actually did. Thread one budget object through all parts if the bound
is meant to limit the gate's work, or say in the comment that it is per-part on purpose.

### IN-04: addition to `V-29-47-01` — the false block carries a sixth false statement, and its position is the finding

**File:** `scripts/check-banned-claims.ts:643-667`

`V-29-47-01` (§3.5 of `29-round6-residuals.md`) records five false statements at this address; I verified
all five and add two observations rather than re-reporting it.

1. **A sixth false statement.** The block's own status line reads *"MEASURED, RECORDED, AND DELIBERATELY
   NOT FIXED HERE (plan 29-42 task 2)"* and *"Carried in docs/audit/29-round5-residuals.md"*. §3.8 of the
   same round's artifact records `V-29-42-03` as **CLOSED, and TRUE rather than vacuously true**. So the
   block asserts a live, deliberately-carried residual for something the round closed — which is the one
   statement most likely to stop a later reader from touching it.
2. **The position is the harm.** This is not a stray paragraph: it is the doc comment attached to
   `BANNED_CLAIM_EXEMPT_REGION` at `:668`, so it is the text an editor reads immediately before deciding
   whether to change the sole carve-out. Given CR-01 above, that is the worst place in the file for a
   paragraph whose subject no longer exists. Deleting the block (not correcting it — its construct is
   gone) should be sequenced ahead of any further exemption work.

---

## Verification notes

Every number in this review was re-derived; nothing was taken from a SUMMARY. Commands run:
`node scripts/check-banned-claims.js` and `node scripts/check-nul-bytes.js` on the live tree (both exit
0); four `git archive HEAD` mirrors driven through the committed `.js` via `CHECK_ROOT`, each asserting
its own premise (fresh mirror green at 115 / 14 / 62) before any plant, and each plant confirmed to have
landed on disk before the gate was run; five sibling gates run against the tampered mirrors; two
throwaway `git init` repositories for the `git ls-files --eol` measurements (git 2.55.0). All temporary
directories were deleted; `git status --porcelain` on the repository is byte-for-byte what it was before
this review began.

---

_Reviewed: 2026-08-17T20:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

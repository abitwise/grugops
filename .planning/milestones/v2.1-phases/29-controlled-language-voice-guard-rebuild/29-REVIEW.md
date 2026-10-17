---
phase: 29-controlled-language-voice-guard-rebuild
reviewed: 2026-08-18T21:15:00Z
depth: standard
round: 8
diff_base: 0702e51
files_reviewed: 10
files_reviewed_list:
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.test.ts
  - scripts/freshness.ts
  - scripts/freshness.test.ts
  - .github/workflows/ci.yml
  - package.json
  - .gitignore
  - agent-factory/writing-profile.md
  - docs/audit/28-claim-registry.md
  - docs/audit/29-round8-residuals.md
findings:
  critical: 5
  warning: 7
  info: 3
  total: 15
status: issues-found
---

# Phase 29 round 8: Code Review Report

**Reviewed:** 2026-08-18T21:15:00Z
**Depth:** standard (per-file, with live adversarial reproduction on `git clone --local` and `git archive HEAD` mirrors)
**Diff range:** `0702e51..HEAD` (21 commits, plans 29-56 .. 29-60)
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Round 8's work is, on the whole, real. I re-derived a large sample of what it published and it
reproduces: the claim-site derivation returns the same **13** files at `HEAD`; `V-29-57-01`'s
reachability figure of **11 of 22** (4 standard-name / 6 token-economy / 1 comprehension) is exactly
what falls out of the literal list when you ask which multi-word member has a split point leaving no
bare pinned member on either side; its live count is **0** over **4135** adjacent non-blank pairs of
the gate's own 117-document corpus (the register's `4126` at `b90712b` differs by exactly the 9 lines
plan `29-58` later added to a scanned document, which the register itself already prints as a
disagreement); registry rows are **46**, profile anchors **8**, governed-corpus membership `false`,
scan membership `true`, `grep -c 'git diff…' ci.yml` → **0**, `mid-token` → **0**, marker set **46**,
and `git ls-tree -r --name-only e848052 | wc -l` → **1626**. All nine repo gates and both test files
are green (`check-banned-claims.test.ts` 118 passed, `freshness.test.ts` 11 passed in 20.8s). The
`D-57` repair is genuine: I planted a stale committed `hooks/guard.js` on a clone and the gate reds by
name, and `npm run check:build-parity` reds independently. Phase 29 is still `[ ]` in the roadmap and
`.planning/REQUIREMENTS.md` is byte-unchanged, as claimed.

That said, this review is adversarial and the round does not come out clean. **Five findings are
Critical, and every one of them is the phase's own signature defect — a published sentence wider than
the mechanism, or a proof that cannot fail — landing inside round 8's own remedies.** Two are
reproduced on real trees:

1. `scripts/freshness.ts` exits **0** and prints *"All build outputs fresh: 48 committed .js file(s)
   match a rebuild of their sources"* on a tree whose `HEAD` carries a stale committed `.js`
   (CR-01). Reproduced.
2. `scripts/check-banned-claims.ts` prints its narrowed sentence — *"no single physical line … carries
   any of the 22 pinned claim literal(s)"* — **on a failing run in which that sentence is
   demonstrably false** (CR-02). Reproduced: exit 1, two findings on one line, header still on stdout.

The other three are proof defects: `V-29-60-05`'s live count of "1 address" is short by two (CR-03);
the "independent" denominator in `freshness.test.ts` shares the gate's own hand-maintained directory
literal and therefore cannot detect the silently-short denominator it exists to detect (CR-04); and
§1's headline completeness equality `13 rows = 13 sites` is a coincidence, not a bijection (CR-05).

The register `docs/audit/29-round8-residuals.md` is the most honest artifact in this phase — it
self-reports `V-29-60-05`, its own miscounted reconciliation block, and four separate false premises
of its own. None of the findings below are things it already says.

---

## Critical Issues

### CR-01: `freshness.ts`'s working-tree arm is a fail-open on the gate's headline claim — reproduced

**File:** `scripts/freshness.ts:7`, `:41-44`, `:255-283`, `:342-344`

**Issue:** The gate publishes, in its own docblock at `:7`, *"exit 0 = every .js committed at HEAD
matches a rebuild"*, and on success prints *"All build outputs fresh: `${headSet.size}` committed .js
file(s) match a rebuild of their sources"* at `:342-344`. Both sentences quantify over the **whole**
of `headSet`. The mechanism does not. At `:260`:

```ts
const useWorking = modified.has(source) && walkSet.has(rel);
```

Any path on the working arm has its `HEAD` blob **never read** — the `git show HEAD:<rel>` call at
`:277` is inside the `else` branch. `headSet.size` is nonetheless the number the verdict line
publishes, and it counts working-arm paths as *"committed .js file(s) [that] match a rebuild of their
sources"*.

**Reproduced** on a local clone of this repository:

```
# 1. plant a stale committed output and commit it
$ printf '\n// planted drift\n' >> hooks/guard.js && git commit -qam "plant"
$ node scripts/freshness.js | tail -2
STALE COMMITTED OUTPUT: hooks/guard.js — the .js committed at HEAD is not a build of the .ts …
BUILD-OUTPUT CHECK FAILED: 1 finding(s).                                  # correct

# 2. now do an ordinary thing: edit that source and build
$ printf '\nexport const __devEdit = 1;\n' >> hooks/guard.ts && npx tsc
$ node scripts/freshness.js ; echo "EXIT=$?"
Compared 48 path(s) … 47 on the HEAD arm, 1 on the working-tree arm …; the arms sum to 48.
All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources.
EXIT=0                                                                    # FALSE
```

`HEAD`'s `hooks/guard.js` is still not a build of `HEAD`'s `hooks/guard.ts` — the run two commands
earlier proved it — and the gate now says all 48 committed outputs match. This is the exact shape of
the defect `D-57` repaired (a green verdict over a subject the gate did not read), surviving on the
second arm of the repaired predicate.

`docs/audit/29-round8-residuals.md` §5 opens `V-29-59-01` for the *opposite* window (a hand-edited but
**uncommitted** working `.js`). This window — a **committed** stale `.js` whose source is dirty — is
described as a design choice in the case table at `:41-44` but carries **no id, no direction and no
live count**, and the published verdict line contradicts it directly. `grep -n "working-tree arm\|
working arm\|STALE WORKING"` over the register returns nothing.

**Fix:** make the verdict line and the docblock state what was actually compared, and open the id.

```ts
// :342 — count what the HEAD arm actually read, and name the residue.
console.log(
  `${FRESH_LINE_PREFIX} ${armHead} committed .js file(s) match a rebuild of their sources` +
    (armWorking > 0
      ? `; ${armWorking} path(s) took the working-tree arm and their HEAD blobs were NOT read ` +
        `(their sources are modified or untracked — commit or stash to have HEAD judged)`
      : `.`),
);
```

and correct `:7` to `exit 0 = every .js committed at HEAD whose source is clean matches a rebuild`.
Optionally red on `armWorking > 0` under a `--strict`/CI flag, since a runner's tree can never take
that arm.

---

### CR-02: the narrowed `guard_banned_claims` sentence is printed on FAILING runs, where it is false — reproduced

**File:** `scripts/check-banned-claims.ts:2190-2195`

**Issue:** `runAll()` writes the `D-55` sentence unconditionally, before `DERIVATION_REFUSALS`, before
the per-part vacuity floor, before the scan-count pin and before any finding is rendered:

```ts
process.stdout.write(
  `\n[guard_banned_claims] no single physical line of the ${bannedClaimScan().length} derived ` +
    `document(s) this gate scans carries any of the ${BANNED_CLAIM_LITERALS.length} pinned claim ` +
    …
);
```

The grammar is declarative — it asserts the result, not the question. So on a red run the gate
publishes a sentence its own findings refute. Reproduced on a `git archive HEAD` mirror:

```
$ printf '\nThe caveman voice is a token economy and it saves tokens.\n' \
    >> agent-factory/workflows/13-incident.md
$ node scripts/check-banned-claims.js ; echo "gate exit=$?"
[guard_banned_claims] no single physical line of the 117 derived document(s) this gate scans
  carries any of the 22 pinned claim literal(s), outside the registry-anchored blocks of one
  named exemption region (LANG-04 / D-29, D-44)
  FAIL  banned claims: 2 finding(s) over 117 elements
        agent-factory/workflows/13-incident.md:46:24 — banned token-economy literal "token economy"
        agent-factory/workflows/13-incident.md:46:45 — banned token-economy literal "saves tokens"
gate exit=1
```

One physical line carries two pinned literals, and the first line of output says none does.

This is the precise proposition the *same round* went to lengths to protect in the sibling gate.
`scripts/freshness.ts:59-69` states it as a rule — *"the GREEN VERDICT LINE below is printed on the
success path and on no other … A fail-closed gate that still prints a green verdict is the fabricated
green this repository has already paid for once"* — and `freshness.test.ts` asserts the absence on
every failing case. `check-banned-claims.ts` got the opposite treatment in the same round, and the new
`D-55` behaviour case at `scripts/check-banned-claims.test.ts:4089` asserts `r.status === 0` first, so
it structurally **cannot** observe a red run's header.

**Fix:** make the banner interrogative (it describes the question), and move the assertion to the
success path where the second PASS line already lives.

```ts
process.stdout.write(
  `\n[guard_banned_claims] asks whether any of the ${BANNED_CLAIM_LITERALS.length} pinned claim ` +
    `literal(s) occurs on any single physical line of the ${bannedClaimScan().length} derived ` +
    `document(s), outside the registry-anchored blocks of one named exemption region ` +
    `(LANG-04 / D-29, D-44)\n`,
);
```

and add a case that runs the gate on a mirror carrying a planted literal and asserts the *assertive*
wording is absent from a non-zero run — the mirror of `freshness.test.ts`'s `FRESH_LINE` discipline.

---

### CR-03: `V-29-60-05`'s live count of "1 address" is short by two; §1 row 3 dispositioned the other two as correct

**File:** `scripts/check-banned-claims.ts:62-63`, `:351-352`; `docs/audit/29-round8-residuals.md`
§1.2 row 3 and §5.4

**Issue:** `V-29-60-05` publishes *"LIVE COUNT: 1 address (`scripts/check-banned-claims.ts:2607`, and
its committed twin)"*. Two further addresses state the prohibition's scope in wording that fails the
round's own criteria:

```
:62  //   THIS GATE PROVES that no pinned literal appears outside the one named exemption region.
:63  //   IT DOES NOT PROVE that no conformance, token-economy or comprehension claim exists.

:351 //  * comprehension claim written in words this list does not contain PASSES THIS GATE. The gate proves
:352 //  * that no pinned literal appears outside the one named exemption region. It does NOT prove that no
```

Both fail on two axes the round itself defined:

1. **No unit of decision.** *"no pinned literal appears"* is unqualified. On the very tree §9.3.3 uses
   to falsify `:2607` — the round-7 hard-wrap plant — a pinned literal *does* appear to a reader
   outside the region, and these two sentences claim the gate has PROVEN it does not. That is the same
   falsification `V-29-60-05` applies to `:2607`.
2. **The pre-D-54 bound.** Both say *"outside the one named exemption region"*. The round's own new
   test case forbids exactly this in the header — `check-banned-claims.test.ts` assertion (5):
   *"THE EXEMPTION IS DESCRIBED AS THE ANCHORED BLOCKS, NOT AS THE REGION … a sentence that names only
   the region publishes the pre-D-54 bound."*

§1.2 row 3 dispositioned `:58` (now `:62`) and `:322` (now `:350-352`) as **left**, with the reason
*"they already state exactly what the gate decides"*. They do not. So `V-29-60-05` is not only a
missed address — its stated root cause (*"derived at the file level and hand-written at the address
level"*) produced a **wrong published number** as well as a missed site, and two of the three misses
were looked at and cleared.

**Fix:** correct the count to **3 addresses (+2 committed twins)** and bring `:62` and `:351-352` to
the header's own wording:

```
//   THIS GATE PROVES that no pinned literal occurs on any single physical line of the derived
//   document set, outside the registry-anchored blocks of the one named exemption region.
//   IT DOES NOT PROVE that no conformance, token-economy or comprehension claim exists, and it
//   does not see a pinned literal split across a hard wrap (V-29-57-01, FAIL-OPEN).
```

Then implement `V-29-60-05`'s own named remedy — derive the claim-site set at the **address** level —
and re-run it; the derivation would have returned all three.

---

### CR-04: the "independent" denominator in `freshness.test.ts` shares the gate's own set literal, so it cannot detect a silently short denominator

**File:** `scripts/freshness.test.ts:170-180`; `scripts/freshness.ts:87`

**Issue:** `headJsCount()` carries this docblock:

> *"The compared-set cardinality, derived by a **DIFFERENT command shape** from the one the gate uses
> (`--name-only` here, `-l` there). **Deriving the element count independently of the loop that
> consumes it** is what keeps a silently short denominator from passing as a full one."*

The body is:

```ts
const out = gitIn(dir, [
  "ls-tree", "-r", "HEAD", "--name-only", "--full-name", "-z", "--", "install", "scripts", "hooks",
]);
```

`"install", "scripts", "hooks"` is a **byte copy of `OUTPUT_DIRS`** at `scripts/freshness.ts:87`. The
flag differs; the thing that actually **bounds the denominator** does not. If `OUTPUT_DIRS` were short
by a directory, both sides would be short by the same directory and
`expect(c.compared).toBe(headJsCount(ROOT))` would still pass. The case therefore proves the two
commands agree about a set they were both handed — not that the set is the right one.

This is verbatim the failure mode this phase named (*"a vacuity floor catches an EMPTY denominator but
never a SILENTLY SHORT one — derive the ELEMENT count independently of the loop that consumes it"*),
re-shipped inside the case written to prevent it. It is compounded by the gate having **no floor and
no two-sided pin on `headSet.size` at all** — unlike every sibling gate in this repo
(`BANNED_CLAIM_SCAN_COUNT`, `GOVERNED_CORPUS_COUNT`, `PUBLIC_DOCS_SCAN_COUNT`). With
`OUTPUT_DIRS = []` the gate prints `All build outputs fresh: 0 …` and exits 0.

**Fix:** derive the directory set from the authority that decides it (`tsconfig.json`'s `include`),
export it, and pin the cardinality two-sided.

```ts
// freshness.ts
export const OUTPUT_DIRS = readIncludeRoots("tsconfig.json"); // ["install","scripts","hooks"]
export const COMMITTED_JS_COUNT = 48;                          // two-sided, moved deliberately
…
if (headSet.size === 0) refuse("the compared set derived ZERO committed .js — refusing a verdict over an empty set.");
if (headSet.size !== COMMITTED_JS_COUNT) refuse(`derived ${headSet.size} committed .js, expected ${COMMITTED_JS_COUNT}.`);
```

and in the test, derive the denominator from `tsconfig.json` (or from `git ls-files '*.js'` with **no**
directory pathspec at all) so the two sides do not share the bound.

---

### CR-05: §1's completeness equality `13 rows = 13 derived sites` is a coincidence, not a bijection

**File:** `docs/audit/29-round8-residuals.md:96-99`, `:124`, table `:108-122`

**Issue:** §1.1 publishes:

> *"The unit of the derived set is a tracked FILE … so the derived site count is **13** and the table
> below carries **13 rows — one per derived file** … Derived site count **13** = table row count
> **13**."*

and §1.2 closes with *"Row count: 13. Derived site count: 13. Equal."* §9.4 row 18 re-validates it as
*"re-counted: 13 rows ✓"*.

The mapping is not one-per-file. Reading the table:

| rows | file(s) |
|---|---|
| 1, 2, 3 | **all three** are `scripts/check-banned-claims.ts` |
| 12 | `scripts/check-kit-refs.ts` **and** `scripts/check-kit-refs.js` |
| 13 | `scripts/compactor.ts` **and** `scripts/compactor.js` |

Three rows for one file (**+2**) cancels two rows covering two files each (**−2**). The equality holds
by arithmetic accident. It is satisfiable while a derived file has **no row at all** — add one more
`check-banned-claims.ts` address row and drop `scripts/compactor.js` from row 13, and the register
still publishes `13 = 13`.

I re-ran the §1.1 derivation at `HEAD`; it returns the same 13 files and all 13 *are* covered
somewhere in the table, so **no site was in fact dropped**. The defect is in the proof, not the
result — which in this phase is the finding, and it is the same class as `V-29-60-05`'s root cause,
one level up.

**Fix:** state the relation the table actually holds, and check it as a set rather than as a count.

```
Derived files: 13. Table rows: 13. **The rows are not a bijection with the files** —
`scripts/check-banned-claims.ts` carries three rows (one per address class) and rows 12 and 13
each cover a .ts/.js twin pair. The property asserted is COVERAGE, checked as a set:

  $ comm -3 <(derivation | sort) <(awk -F'|' '/^\| [0-9]/ {print $3}' table | tr -d ' `' \
              | tr ',' '\n' | sort -u)
  (no output — every derived file has at least one row, and every row names a derived file)
```

---

## Warnings

### WR-01: `check:build-parity` prints a green verdict on Windows where its pathspec matches nothing

**File:** `package.json:14`; `.github/workflows/ci.yml:88-102`

**Issue:** `V-29-59-02` is titled *"the working-tree parity assertion has no Windows leg"* and is
framed as a **CI scoping** gap. The sharper fact is that the shipped npm script itself carries **no
platform guard and no self-check**, so anyone (a developer, a future workflow, a `pre-push` hook) who
runs `npm run check:build-parity` on Windows gets:

```
Build parity: no tracked build output moved when tsc ran.
```

exit 0, always. Confirmed by simulating cmd.exe's quote-retention on a tree with a real drift:

```
$ git diff --exit-code --name-only -- "'*.js'" ; echo "quoted exit=$?"
quoted exit=0                       # matched nothing — VACUOUS GREEN
$ git diff --exit-code --name-only -- '*.js'  ; echo "posix  exit=$?"
hooks/guard.js
posix  exit=1                       # the real answer
```

The round's own reasoning (*"A vacuous green is worse than an absent check"*) applies to the script,
not just to the matrix leg. The disclosure lives in a CI comment and an audit register; the artifact
that lies lives in `package.json`.

**Fix:** either fail closed on the platform, or take `V-29-59-02`'s own named remedy now.

```json
"check:build-parity": "node scripts/check-build-parity.js"
```

with the pathspec passed as an argument vector (no shell), and — minimally, if the script stays a
shell one-liner — a leading `node -e \"if (process.platform === 'win32') { console.error('check:build-parity is POSIX-only; its pathspec is not quoted by cmd.exe and would match nothing. Refusing rather than reporting a vacuous pass.'); process.exit(1); }\" &&`.

---

### WR-02: `FRESHNESS_POSTFIX_REF` does not replay "every case in this file"

**File:** `scripts/freshness.test.ts:25-31`, `:65`, `:336`, `:371`, `:519`

**Issue:** The header publishes:

> *"`FRESHNESS_POSTFIX_REF` overrides the commit the post-fix clones are built from. **Setting it to
> the pre-fix SHA replays every case in this file** against the pre-fix artifact, which is how each new
> case was watched failing before it was accepted."*

Four of the eleven cases do not read that variable at all:

- **Test 1** (`:371`) runs `spawnSync("node", [FRESHNESS_JS], { cwd: ROOT })` — the **parent
  repository's own committed gate**, unaffected by `POST_FIX_REF`.
- **Test 3** (`:519`) — same, on ROOT.
- **REFUSAL / outside** — `copyFileSync(FRESHNESS_JS, …)` at `:336` copies the **parent's** gate into
  the temp dir; the pre-fix artifact is never exercised.
- **PROVENANCE** runs no gate.

So the replay claim is a published scope wider than the mechanism, in a harness whose whole subject is
that class. The load-bearing cases (DISCRIMINATION PAIR, ORDERING INDEPENDENCE, ARM SEPARATION, UNION,
SET EQUALITY) *do* replay, so the evidence stands; the sentence does not.

**Fix:** narrow the sentence, or make it true.

```ts
//   FRESHNESS_POSTFIX_REF=<pre-fix sha> npx vitest run …   # the RED replay
// Replays every CLONE-BASED case. Test 1, Test 3 and the not-a-repository refusal deliberately
// exercise this checkout's own committed gate and are unaffected by the override — they are
// controls over the tree in front of you, not over the pair.
```

(or run those three against `join(postPlantCloneDir, "scripts", "freshness.js")` so the override
reaches them).

---

### WR-03: the PROVENANCE case name claims two properties it does not assert

**File:** `scripts/freshness.test.ts:511-518`

**Issue:**

```ts
it("PROVENANCE: one clone per plant, none reused, none reset with `git checkout --` and none extracted from an archive", () => {
  expect(F.cloneCount).toBe(7);
  expect(new Set(clonesCreated).size).toBe(clonesCreated.length);
  for (const dir of clonesCreated) expect(dir.startsWith(CLONE_ROOT)).toBe(true);
});
```

The assertions cover *count*, *uniqueness* and *location*. They say nothing about `git checkout --`
and nothing about archive extraction — those two clauses are unheld prose in a test title, i.e. a
green run reporting a property nothing decided. It is the WR-05-class defect (a published claim wider
than its mechanism) at the smallest possible scale, in the round that opened `V-29-60-03` for the same
class one level down.

**Fix:** hold them or drop them.

```ts
// Hold them: the harness's own source is the subject.
const self = readFileSync(new URL(import.meta.url), "utf8");
expect(self, "a clone is reset rather than discarded").not.toMatch(/checkout",\s*"--/);
expect(self, "a fixture is extracted from an archive").not.toContain("git archive");
```

---

### WR-04: the docblock assertion uses a hand-typed line window in the file that argues against hand-typed line ranges

**File:** `scripts/check-banned-claims.test.ts:4193-4204`

**Issue:**

```ts
const docblock = src.split("\n").slice(0, 14).map((l) => l.replace(/^\/\/ ?/, "")).join(" ")…
expect(docblock).toContain("single physical line");
expect(docblock).toContain("derived document set");
```

`14` is typed. The sibling case added in the **same commit** derives its section from the file and
explains why at length: *"THE SECTION IS DERIVED, NOT SLICED AT A LINE NUMBER … A hand-typed line
range would drift silently the first time the paragraph above it grew — this repository's own
set-literal drift class, landing inside a case written to hold a residual in place."* Two disagreeing
implementations of "find the block I mean" shipped side by side is the `LANG-07` shape this milestone
has closed three times.

There is also a fail-open direction: `toContain` over a **14-line window** is satisfied by any line in
the window, not by the scope sentence specifically. Today the sentence at `:3-8` is what holds it, but
delete `:3-8` and add "single physical line" to the exit-code gloss at `:13` and the case still
passes.

**Fix:** derive the docblock the way the sibling case derives its section — from the start of file to
the first `//   node scripts/` usage line, or to the first blank-comment separator — and assert the
phrases inside the derived extent.

---

### WR-05: `bannedClaimScan()` is published in the header before the floors and the pin that validate it

**File:** `scripts/check-banned-claims.ts:2190-2246`

**Issue:** The header interpolates `bannedClaimScan().length` at `:2191`. The per-part vacuity floor
runs at `:2228-2238` and the two-sided `BANNED_CLAIM_SCAN_COUNT` pin at `:2244`. So the corpus size is
**published before anything has checked it**: a derivation that emptied a part, or a set that silently
grew or shrank, is printed as an authoritative denominator and only afterwards refused. Combined with
CR-02 (the sentence prints on red), a run with a half-derived corpus publishes
`no single physical line of the 61 derived document(s) … carries any …` and exits 1 — a false claim
over a corpus the gate has just declared unusable.

**Fix:** compute `scan` once, run the refusals/floors/pin, and print the header from the validated
value:

```ts
function runAll(): void {
  const scan = bannedClaimScan();
  const overlap = bannedClaimScanOverlap();
  for (const refusal of DERIVATION_REFUSALS) fail(…);
  …vacuity floor, then the two-sided pin…
  if (FAILS === 0) process.stdout.write(`\n[guard_banned_claims] asks whether … ${scan.length} …`);
}
```

---

### WR-06: `check:build-parity` is declared "the ONE authority" and has zero test coverage

**File:** `package.json:14`; `.github/workflows/ci.yml:81-102`

**Issue:** `ci.yml:85-89` declares it load-bearing —

> *"`npm run check:build-parity` in package.json is the **ONE authority** for that assertion; this
> workflow CALLS it and never restates it"*

— and it is the only mechanism holding working-tree parity on the ubuntu leg. Nothing in the repo
tests it. `grep -rn "check:build-parity"` over `*.ts`/`*.js` returns only `package.json` and
`ci.yml`; there is no discrimination case, no green/red pair, and no assertion that it can fail. In
the round whose two Critical findings were *"a gate that could not fail"* and *"a gate that ran only
as a side effect"*, a brand-new gate authority shipped untested is the same bet being placed again.

I verified by hand that it *does* discriminate (red on a stale committed `.js`, red again on re-run
because `git diff` reads the index, green on a clean tree). That evidence lives in this review, which
is not a mechanism.

**Fix:** add `scripts/check-build-parity.test.ts` reusing `freshness.test.ts`'s clone harness — plant
a stale committed `.js` on a clone, assert `npm run check:build-parity` exits 1 and names the path;
assert exit 0 and the success sentence on an unmutated clone; and assert the success sentence is
absent from the failing run.

---

### WR-07: `OUTPUT_DIRS` is a hand-maintained mirror of `tsconfig.json`'s `include` with nothing asserting they agree

**File:** `scripts/freshness.ts:85-87`; `tsconfig.json`

**Issue:**

```ts
// The directories whose committed .js outputs are build artifacts of committed .ts sources. Mirrors
// the tsconfig "include" set (install/scripts/hooks).
const OUTPUT_DIRS = ["install", "scripts", "hooks"];
```

The comment names the authority and then copies it. `tsconfig.json` currently has
`"include": ["install/**/*.ts", "scripts/**/*.ts", "hooks/**/*.ts"]`, so they agree today (I confirmed
all 48 tracked `.js` live under those three). The day a fourth root enters `include`, `tsc` emits its
`.js`, the `ls-tree` pathspec at `:154` excludes it, the walk at `:222` excludes it, and the gate
prints *"All build outputs fresh: 48 …"* over a set that no longer covers the build outputs — silently
short, with the published sentence unchanged. `npm run check:build-parity` would catch it, but only on
the ubuntu leg (WR-01) and only for tracked files.

This is the same "hand-maintained set mirroring another authority" pattern this repository has already
diagnosed as its second systemic failure class.

**Fix:** derive it. `tsconfig.json` is JSON-with-comments-free here, so a five-line read suffices:

```ts
const OUTPUT_DIRS = [
  ...new Set(
    (JSON.parse(readFileSync(join(ROOT, "tsconfig.json"), "utf8")).include as string[])
      .map((g) => g.split("/")[0]!),
  ),
];
if (OUTPUT_DIRS.length === 0) refuse("tsconfig.json declares no include roots.");
```

then pin the count two-sided per CR-04.

---

## Info

### IN-01: `BANNED_CLAIM_SCAN_COUNT`'s docblock still opens with the superseded arithmetic

**File:** `scripts/check-banned-claims.ts:1293-1296`

**Issue:** *"The pinned cardinality of the deduped union. **115 today**: 73 kit markdown files + 11
public documents + 1 install README + 7 skill sources + 24 Claude Code adapters − 1 overlap"* — the
constant is `117` and there are seven parts, not five. Four paragraphs below the same block correctly
records the `115 → 117` move. Not touched this round, so strictly pre-existing — but it is a **typed
count that has gone stale in the file whose round-8 subject is typed counts going stale**, and `D-55`'s
header comment cites *"a count typed into published prose has gone stale at three addresses in this
phase already"* while this fourth one sits 900 lines below it.

**Fix:** change the opening clause to *"The pinned cardinality of the deduped union; its current value
and per-part breakdown are published on every run and recorded, with each move, below."* — i.e. stop
restating the value at the top of a docblock whose body is the movement log.

---

### IN-02: the `git status --porcelain=v1 -z` walk can desynchronise silently on a `Y`-column rename

**File:** `scripts/freshness.ts:186-204`

**Issue:**

```ts
const xy = entry.slice(0, 2);
modified.add(entry.slice(3));
if (xy[0] === "R" || xy[0] === "C") { const origin = fields[i]; i += 1; if (origin) modified.add(origin); }
```

Only `X` is inspected. `git status` does not currently detect worktree renames, so `Y === "R"` does
not arise today — but if it ever does (or if a future `--find-renames`/config change makes it so), the
extra origin field is consumed as the next **entry**, `entry.slice(0, 2)` reads two bytes of a path as
a status code, and every subsequent path in the walk is offset by three characters. `modified` is then
silently wrong, which silently flips arm selection at `:260`. There is no refusal for a malformed
record, unlike the `ls-tree` parse at `:161` which refuses on a missing tab.

**Fix:** check both columns and refuse on an unrecognised status pair, or move to `--porcelain=v2`,
whose records are self-describing:

```ts
if (xy[0] === "R" || xy[0] === "C" || xy[1] === "R" || xy[1] === "C") { … }
if (!/^[ MADRCU?!][ MADRCU?!]$/.test(xy)) refuse(`\`git status\` produced a record this gate cannot parse: ${entry}`);
```

---

### IN-03: the "separate import" cross-check in the D-55 behaviour case is weaker than its comment claims

**File:** `scripts/check-banned-claims.test.ts:4109-4123`

**Issue:** The comment reads *"THE TWO NUMBERS, COMPARED AGAINST A SEPARATE IMPORT OF THE MODULE'S OWN
DERIVATIONS. The expectation is produced by a different statement than the actual … A pin whose
expected value is produced by the same statement as its actual value pins nothing."* The expectation is
produced by the **same function** (`bannedClaimScan()`), just in a different process over the same
tree. It catches a number typed into the header — which the digit assertion twelve lines later already
catches outright — and nothing else. A wrong `bannedClaimScan()` moves both sides together.

**Fix:** either narrow the comment to what it does (*"a cross-process consistency check: the header's
number is the derivation's, not a literal"*), or compare against a derivation this test owns —
e.g. sum `BANNED_CLAIM_SCAN_PARTS` member counts minus `bannedClaimScanOverlap()`, which is the
arithmetic the PASS line invites a reader to check.

---

## What I checked and found sound

Recorded so the absence of a finding is distinguishable from an absence of looking.

- **`V-29-57-01`'s reach and live count.** Independently derived from `BANNED_CLAIM_LITERALS`:
  16 multi-word, **11 wrap-reachable** (`ASD-STE 100`, `ASD STE100`, `ASD STE 100`,
  `Simplified Technical English`, `token economy`, `fewer tokens`, `token savings`, `saves tokens`,
  `reduces token count`, `lowers token count`, `better understood by the model`) — 4/6/1 per group,
  matching the published split. Live wrap-only hits over the gate's own 117-document corpus: **0**,
  across **4135** adjacent non-blank pairs. The register's `4126` at `b90712b` differs by the 9 lines
  plan `29-58` later added to a scanned document, which §9.4 row 9 already prints as a disagreement
  with its cause. Direction FAIL-OPEN is stated honestly at `scripts/check-banned-claims.ts:65`,
  `agent-factory/writing-profile.md:264-277` and in the `C-28-042` registry row.
- **The `D-57` repair discriminates.** Planted a stale committed `hooks/guard.js` on a `--local` clone:
  `STALE COMMITTED OUTPUT: hooks/guard.js`, exit 1. `npm run check:build-parity` reds independently
  and stays red on re-run (it diffs against the index, so its own rebuild does not erase the finding).
  Ordering independence holds: the gate reds identically before and after an in-place build.
- **CI ordering.** `npm run freshness` at `:78` < `npm run check:build-parity` at `:102` <
  `npm run build` at `:106`; `grep -c 'git diff\|git status\|git ls-files --modified' ci.yml` → **0**,
  as §3.1 CR-01 warns. `V-29-59-02`'s "1 of 2 legs" is exactly right (`os: [ubuntu-latest,
  windows-latest]` against one `if:`).
- **`.gitignore` `.temp/`.** No tracked path matches `.temp/`; vitest's default `exclude` carries
  `**/.{idea,git,cache,output,temp}/**` and `vitest.config.ts` overrides only `fileParallelism`, so
  the "already in vitest's default exclude list" claim holds and the serialized file execution removes
  the real-tree race Test 3 would otherwise create.
- **The `C-28-042` freeze moved as a pair.** Profile `:257-262` and the registry verbatim changed in
  one commit (`638ff39`); `check-claim-anchors.js` and `check-audit-register.js` are green; the
  advisory `line: 257-262` matches the block's live position; registry rows **46**, profile anchors
  **8**.
- **All nine repo gates green**, `check-banned-claims.test.ts` 118 passed,
  `freshness.test.ts` 11 passed (20.8s), tree left clean.
- **The scope fence held.** `.planning/REQUIREMENTS.md` byte-unchanged across `0702e51..HEAD`;
  Phase 29 still `[ ]` in `ROADMAP.md` with *"Phase 29 is **not** complete"* stated in the body;
  `package-lock.json` byte-unchanged; `package.json` moved by exactly one line; marker set **46**,
  matching §9.5's prediction.
- **`docs/audit/29-round8-residuals.md`'s honesty.** Every sampled derivation reproduces
  (1626 tracked at `e848052`, 13 derived sites, governed-corpus `false`, scan membership `true`,
  `mid-token` → 0). It self-reports `V-29-60-05`, its own miscounted reconciliation summary, and four
  false premises of its own. CR-03 and CR-05 are *extensions* of defects it named, not contradictions
  of it.

---

_Reviewed: 2026-08-18T21:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Round: 8 — diff base `0702e51`_

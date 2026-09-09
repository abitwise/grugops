# Gap-closure round 5 — the round-4 evidence re-measured against the finished tree

**Round:** 5 — the closing measurement for gap-closure round 4 of Phase 31 (fix plans `31-16`,
`31-17`, `31-18`, `31-19`; this measurement plan `31-20`)
**Written:** 2026-09-09, by plan `31-20`
**Measured at:** commit `263d1a3` (`263d1a316175e040fa343de0311eb3a534babac2`), the round's final
commit, against the **committed `.js`** artifacts, with `git status --porcelain -- scripts hooks
agent-factory install` **empty**
**Evidence source:** `.planning/phases/31-autonomous-manual-testing/31-VERIFICATION.md` (round 4,
`gaps_found`, 4/6) and `.planning/phases/31-autonomous-manual-testing/31-REVIEW.md` (round-3
gap-closure code review, `issues_found`, 3 critical / 5 warning / 2 info)
**Governing decisions:** `D-20` (`31-16`), `D-21` (`31-17`), `D-22` (`31-18`), `D-23` (`31-19`) —
all recorded in `31-CONTEXT.md`
**Predecessor records:** `docs/audit/29-round4-residuals.md` through `29-round8-residuals.md`. This
file follows their section shape rather than inventing a new one. It follows them; it does not
replace them. A prior round's record is history and is never rewritten — where this round disagrees
with one, **both values are printed and the disagreement is a finding.**

## What this artifact is for

A verification round reads source and committed artifacts. It does not read a planning conversation,
and it should not have to re-derive a probe from a fix plan's own fixture. This file exists so the
fifth verification round can start from three things it would otherwise have to rediscover:

1. a table pairing **every** reproduction the round-4 documents recorded with its post-round result,
   re-run with **the original document's own spelling**;
2. a ledger row for **every** finding, anti-pattern row and `missing:` bullet those documents raised;
3. a written register of the boundaries this round **decided to leave open**, with the reason and
   what would force each closed.

**The order of this document is deliberate.** The adversarial reproductions come FIRST (§2–§5) and
the suite comes afterwards (§6) as a floor. For four consecutive verification rounds on this phase
the green suite exercised **none** of the defects that round found — the round-4 report says so
explicitly, for the fourth time. A closure round that led with its suite figures would be leading
with the one instrument this phase's own record shows is not sufficient.

**A closure round that re-measures only its own fixtures has measured its fix and not the finding.**
So every probe below is built from the SOURCE DOCUMENT's spelling. Where a fix legitimately changed
the shape a probe must take, **both** spellings are run and both results are recorded, with the
reason for the adjustment stated.

---

## 1. The probe set, DERIVED from the source documents rather than from the fix plans

### 1.1 The derivation rule

A **reproduction block** is a place in `31-VERIFICATION.md` or `31-REVIEW.md` that records a probe
AND its measured outcome. Three shapes qualify, and the count of each was measured with a command
rather than typed:

| # | Shape | Where | Count | Command that measured it |
|---|---|---|---|---|
| (a) | a row of the round-4 **Behavioral Spot-Checks** table | `31-VERIFICATION.md` | **15** | `awk '/^\| # \| Behavior/{f=1} f&&/^\| [0-9]+ \|/{c++} END{print c}'` |
| (b) | a fenced **measurement** block | `31-REVIEW.md` | **9** | 14 fenced blocks total (`grep -c '^\`\`\`'` → 28 markers); 5 are `ts`-tagged and are fix proposals or probe INPUTS, not measurements |
| (c) | a row of the **Prior findings status** table carrying a measured Evidence cell | `31-REVIEW.md` | **7** | 10 rows total; 3 (`IN-04`, `IN-06`, `IN-09`) carry no measurement and are excluded, by name |

**Denominator: 15 + 9 + 7 = 31 reproduction blocks.** §2's pairing table carries **31 rows**, one
per block, and §2.4 states the equality.

### 1.2 What is excluded, by name, so the exclusion is not silent

**The 5 `ts`-tagged blocks of `31-REVIEW.md` that are not measurements** — lines 173 (CR-09's `Fix:`
proposal), 207 (CR-10's illustration of the spelling, which is the INPUT to the block at 213), 248
(CR-10's `Fix:` proposal), 312 (CR-11's `Fix:` proposal), 454 (WR-20's quoted legitimate spec, which
is the INPUT to the block at 463). The two INPUT blocks are re-run as part of the measurement blocks
they feed; the three `Fix:` proposals are not probes and are dispositioned in §7 instead.

**The 3 unmeasured `Prior findings status` rows** — `IN-04` (ledger event ordering, "open by choice,
still an assertion", unchanged this round), `IN-06` (`tsconfig.fixtures.json` disposition category,
"not in this range"), `IN-09` (residuals `R-43`/`R-44`/`R-46`/`R-47`, `Q9`, "carried"). Each still
gets a ledger row in §7 — the exclusion is from the MEASUREMENT denominator, never from the
disposition denominator.

**The baseline figures** of the review's Summary paragraph and of `IN-11` (freshness count, the
frozen guard blob, the two decider digests, the suite counts) are Task 2's business and are recorded
in §6 with the one-commit gate record.

### 1.3 A discrepancy with this plan's own read-first instruction, recorded rather than absorbed

`31-20-PLAN.md`'s Task 1 `read_first` describes the round-4 spot-check table as "all eleven rows plus
the **three** gate rows" — 14. The table as committed carries **15** rows: 11 behavioral (1–11) and
**4** gate rows (12 full suite, 13 freshness, 14 foundation guards / UAT oracles, 15 byte-frozen
deploy guard). Task 2's own `read_first` names "rows 12 through 15", which is four and agrees with
the measurement. The measured value (15) is used. The plan's Task-1 sentence is the stale half of
the record.

### 1.4 The probe environment

Every AST probe ran against the committed `scripts/runnable-ref/uat-spec-integrity.js` from a probe
repository of the shape prior rounds established: a root under `.temp/<name>/` **inside this
repository** (so `createRequire(join(repoRoot, "package.json"))` resolves `typescript` from the
repository's own `node_modules`), a `package.json`, and a single spec at `uat/p.uat.spec.ts`. Every
probe directory was **deleted immediately after its measurement** — see §5.

Every context probe ran against the committed `scripts/context-io.js` and `scripts/compactor.js`,
with the governance root supplied through `CLAUDE_PROJECT_DIR` (candidate 1 of
`TRUSTED_ROOT_ENV_ORDER`) or, for the trusted-root probes, in a child process with **both**
project-directory variables genuinely **removed** from the environment (`delete env.X`, not blanked).

---

## 2. The reproduction pairing table — 31 rows, every one re-run with its own document's spelling

Legend: **MOVED** = the round-4 result changed in the direction the owning plan committed to.
**UNMOVED** = the round-4 result is reproduced unchanged, which for a previously-PASSING row is the
evidence that nothing broke. **PARTIAL** = one spelling moved and another did not; both are printed.

### 2.1 (a) The fifteen rows of `31-VERIFICATION.md`'s Behavioral Spot-Checks table

| # | Probe (the round-4 document's own spelling) | Round-4 result | Round-5 result at `263d1a3` | Verdict |
|---|---|---|---|---|
| 1 | `test.info().skip()` (bare call link, no fixture parameter) | `1 finding(s) over 1/1`, EXIT=1 | `1 finding(s) over 1/1 uat specs checked`, EXIT=1, naming `` `test.info().skip` `` | **UNMOVED** (round-3 closure intact) |
| 2 | `expect.configure({ soft: true })(locator).toBeVisible()` (un-chained) | `1 finding(s) over 1/1`, EXIT=1 | `1 finding(s) over 1/1`, EXIT=1, naming `` `expect.configure` `` | **UNMOVED** (round-3 closure intact) |
| 3 | `import { test as it }; it.skip(...); it.describe.only(...)` | `1 finding(s) over 1/1`, EXIT=1 *(bare `it.skip`)* | bare `it.skip` **alone**: `1 finding(s) over 1/1`, EXIT=1, naming `` `test.skip` ``. The **full** spelling (`it.skip` **and** `it.describe.only`): `2 finding(s) over 1/1`, EXIT=1, naming `` `test.skip` `` and `` `test.describe.only` `` | **UNMOVED** — see §4.1 for the two spellings |
| 4 | `expect.configure({ retries: 2 }).soft(locator).toBeVisible()` (chained) — **CR-09** | `0 findings over 1/1`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, naming `` `expect.configure().soft` `` | **MOVED** |
| 5 | `expect.configure({ retries: 2 }).configure({ soft: true })(locator)` (chained) — **CR-09 second variant** | `0 findings over 1/1`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, naming `` `expect.configure().configure` `` | **MOVED** |
| 6 | `test("a", async ({ page }, testInfo) => { testInfo.skip(); … })` — **CR-10** | `0 findings over 1/1`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, naming `` `test.info().skip` `` | **MOVED** |
| 7 | the legitimate spec with a local `it` shadowing a renamed import — **WR-20 control** | `1 finding(s) over 1/1`, EXIT=1, naming `test.skip`, **a construct absent from the file** | `UAT spec integrity: 0 findings over 1/1 uat specs checked`, EXIT=0 | **MOVED** (the false refusal is gone) |
| 8 | a 4000-link call chain ending `.skip` — **WR-19** | `RangeError: Maximum call stack size exceeded` at `calleeDottedPath`; stack trace on stderr, EXIT=1, **no** measurement line printed | `UAT spec integrity: 0 findings over 1/1 uat specs checked` on **stdout**, EXIT=0, stderr **empty** | **MOVED** (the floor is reachable again) |
| 9 | `promoteAdmitted` promoting a forged note onto an already-admitted destination id — **CR-11** | `promotedId` = the SAME id; `threw` = `null`; destination's only file now `kind: finding` / `by: security-nfr` / `verified_by: human:mallory`, the original observation **gone** | **ORIGINAL spelling** (forged origin a caller-named directory): returns `null`, **THREW** `DECLINED (origin-outside-trusted-store)`. **ADJUSTED spelling** (origin a recognised `.grugops/context` store, so the destination clause is what is being asked): returns `null`, **THREW** `DECLINED (destination-id-occupied)`. In **both**, the destination still holds exactly one file, `kind: observation` / `by: qe`, body `The login lane FAILED on 3 of 5 scenarios.` | **MOVED** — see §4.2 for why both spellings were run |
| 10 | `promoteAdmitted`'s governance read never examines the dial's VALUE — **WR-18**, source-verified | only `govResult === null \|\| govResult.source === "unreadable"` examined; `govResult.config.human_admission` **zero** occurrences in the function body | the function body now calls `isGatedNote(note.by, note.kind, govResult)` (**3** occurrences of `isGatedNote`, **1** of `human_admission`), and declines through the named clause `human-stamp-not-gated-at-destination`. Driven per dial, the two routes **agree on all six dial values** (§2.2, PROBE 3) | **MOVED** |
| 11 | a planted `.grugops/factory.config.json` in a "home"-shaped ancestor, cwd 3 levels below, no `.git` on the path, both project-directory variables unset — **WR-21** | `trustedRepoRoot()` returned the fake home directory itself | **ORIGINAL spelling** (an ancestor merely NAMED `home`, the process's real `homedir()` untouched at `/Users/olgeroeselg`): `trustedRepoRoot()` **still returns the planted ancestor**, dial `"all"`. **ADJUSTED spelling** (`HOME` set so the planted ancestor IS `os.homedir()`): returns the **kit** (`/Users/olgeroeselg/Projects/public/grugops`), dial `"off"`. **ABOVE** (configuration one level above the home directory): returns the **kit** | **PARTIAL** — see §4.3. This is the round's single most important pairing |
| 12 | full excluded-e2e regression suite | `Test Files 62 passed (62)`, `Tests 3566 passed \| 2 skipped (3568)`, exit 0 | recorded in **§6.1** | see §6 |
| 13 | committed `.js` freshness | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` | recorded in **§6.1** | see §6 |
| 14 | foundation guards / UAT oracles | both `ALL CHECKS PASSED` | recorded in **§6.1** | see §6 |
| 15 | byte-frozen deploy guard | `git hash-object hooks/guard.ts` → `669725bc1c616ab57123e22090d93d57eff1b001`, equal to `FROZEN_GUARD_BLOB` | recorded in **§6.2** | see §6 |

**Rows 1–3, 7 and the row-4/5/6 controls are the "nothing broke" half of this table.** Rows 12–15 are
paired in §6 rather than restated here, because their post-round figures are the one-commit gate
record and belong beside the rest of the gate results.

### 2.2 (b) The nine fenced measurement blocks of `31-REVIEW.md`

| # | Review block (line) | Round-4 measurement | Round-5 measurement at `263d1a3` | Verdict |
|---|---|---|---|---|
| 16 | **CR-09**, `:135` — the three-line end-to-end table | `expect.configure({soft:true})(locator)` → 1 finding, exit 1 · `.configure({retries:2}).soft(...)` → 0 findings, exit 0 · `.configure({retries:2}).configure({soft:true})(...)` → 0 findings, exit 0 | 1 finding exit 1 · **1 finding exit 1** · **1 finding exit 1** — the control unmoved, both escapes refused | **MOVED** |
| 17 | **CR-09**, `:143` — the instrumented three-line table, through the committed module | `"expect.configure().soft"` opts=null → banned: **false** · `"expect.configure().configure"` opts=`['soft']` → banned: **false** · `"expect.configure"` opts=`['soft']` → banned: **true** | `"expect.configure().soft"` opts=`[]` → banned: **true** · `"expect.configure().configure"` opts=`["soft"]` → banned: **true** · `"expect.configure"` opts=`["soft"]` → banned: **true** | **MOVED** — the same instrument, two verdicts flipped |
| 18 | **CR-10**, `:207`+`:213` — the two fixture-parameter spellings | `testInfo.skip()` → 0 findings, exit 0 · `testInfo.fail()` → 0 findings, exit 0 | `testInfo.skip()` → **1 finding, exit 1**, naming `` `test.info().skip` `` · `testInfo.fail()` → **1 finding, exit 1**, naming `` `test.info().fail` `` | **MOVED** |
| 19 | **CR-10**, the "Instrumented:" paragraph — `testInfo.skip` resolves cleanly and its head is not in `BANNED_MODIFIER_HEADS` | raw path `"testInfo.skip"`; `BANNED_MODIFIER_HEADS` has no `testInfo` member | raw path is **still** `"testInfo.skip"` and `BANNED_MODIFIER_HEADS` **still** has no `testInfo` member (`["test","describe"]`) — but `deriveTestInfoParameterNames` returns `["testInfo"]`, `canonicaliseHeadSegment("testInfo.skip", …)` returns `"test.info().skip"`, and `isBannedModifierPath("test.info().skip")` is `true` | **MOVED — by rule, not by member**, which is the shape D-20 committed to |
| 20 | **CR-11**, `:281` — the four-step transcript | steps 1–3 as row 9 above: same id returned, nothing thrown, destination note replaced | as row 9 above, both spellings: declined, nothing written, destination byte-unchanged | **MOVED** |
| 21 | **WR-17**, `:346` — the four-row per-dial table, forged origin outside `.grugops/` entirely | `high-severity`/`all`/`off`/`absent` → `promoteAdmitted` **WROTE** on all four rows | `high-severity` → REFUSED (`origin-outside-trusted-store`) · `all` → REFUSED (`origin-outside-trusted-store`) · `off` → REFUSED (`human-stamp-not-gated-at-destination`) · `absent` → REFUSED (`human-stamp-not-gated-at-destination`) | **MOVED** — all four now refuse; see §4.4 for a clause-name disagreement with `31-18-SUMMARY.md` |
| 22 | **WR-19**, `:412` — the two module-level measurements | 600 pure property links → `null` · the SAME 600 links with 6 call links interleaved → **resolved, 1209 chars, head `test`** | 600 pure property links → `null` · the SAME 600 links with 6 call links interleaved → **`null`** | **MOVED** — interleaving a call link no longer buys extra steps |
| 23 | **WR-19**, `:419` — the end-to-end 4000-link transcript | `RangeError`, EXIT=1, stdout empty | EXIT=0, `UAT spec integrity: 0 findings over 1/1 uat specs checked`, stderr empty | **MOVED** (same measurement as row 8) |
| 24 | **WR-20**, `:454`+`:463` — the quoted legitimate spec and its measured refusal | `1 finding(s) over 1/1`, EXIT=1, naming `test.skip` | `0 findings over 1/1`, EXIT=0 | **MOVED** (same measurement as row 7) |

### 2.3 (c) The seven measured rows of `31-REVIEW.md`'s Prior findings status table

These are the round-3 closures. **A closure round that reports only the moved rows cannot show it
broke nothing**, so each is re-driven rather than carried from the review's word.

| # | Prior finding | Round-4 (review) measurement | Round-5 measurement at `263d1a3` | Verdict |
|---|---|---|---|---|
| 25 | **CR-07** — the three `test.info()` spellings | `3 finding(s) over 1/1`, exit 1 | `3 finding(s) over 1/1`, EXIT=1, naming `test.info().skip`, `test.info().fail`, `test.info().fixme` | **UNMOVED** |
| 26 | **CR-07 control** — `test.describe.serial.only` | exit 1 | `1 finding(s) over 1/1`, EXIT=1, naming `test.describe.serial.only` | **UNMOVED** |
| 27 | **CR-07 control** — `expect(locator).toBeVisible()` + `expect.configure({retries:2})(locator)` (no false positive) | exit 0 | `0 findings over 1/1`, EXIT=0 | **UNMOVED** |
| 28 | **CR-07 control** — `test.info().slow()` correctly NOT refused | not refused | `0 findings over 1/1`, EXIT=0 | **UNMOVED** |
| 29 | **WR-14** — `import { test as it, expect }` + `it.skip(...)` + `it.describe.only(...)` | `2 finding(s)`, exit 1, reported as `test.skip` / `test.describe.only` | `2 finding(s) over 1/1`, EXIT=1, reported as `test.skip` / `test.describe.only` | **UNMOVED** |
| 30 | **WR-14** — `import * as pw` + `pw.test.skip(...)` | exit 1 | `1 finding(s) over 1/1`, EXIT=1, naming `test.skip` | **UNMOVED** |
| 31 | **CR-08** — a legitimately human-disposed high-severity `finding` must still promote; `compactor.promote` must still refuse; the GOV-02 ledger must stay at 1 line | origin `admitAndAppend` → WROTE · `compactor.promote` → still THROWS the D-04 refusal · `compactor.promoteAdmitted` → WROTE, destination holds the note, ledger 1 line | origin `admitAndAppend` → WROTE `20260908T020000Z-security-nfr-finding-f01de2a2` · `compactor.promote` → **THREW** `context-io.appendNote: refusing to write a note the admission authority did not accept…` · `compactor.promoteAdmitted` → **WROTE** the same id; destination holds `["20260908T020000Z-security-nfr-finding-f01de2a2.md"]`; GOV-02 ledger lines at the destination root = **1** | **UNMOVED** — the CR-08 closure survived `31-18`'s three new clauses |

**Row 31 is the load-bearing "nothing broke" row of this round.** `31-18` added three decline clauses
to the very function CR-08's closure depends on. A round that added clauses and never re-drove the
LEGITIMATE case would be repeating CR-08 itself — a fix that refuses the thing it was built to admit.
It does not: the legitimate promotion still writes, and its ledger still holds exactly one line.

### 2.4 The equality, stated rather than implied

| Side | Value | How it was obtained |
|---|---|---|
| reproduction blocks in the two source documents | **31** | 15 (a) + 9 (b) + 7 (c), each measured by the command in §1.1 |
| rows in §2.1 + §2.2 + §2.3 | **31** | 15 + 9 + 7 |
| **agree?** | **yes** | — |

The 31 rows partition, and the partition sums:

| Verdict | Rows | Count |
|---|---|---|
| **MOVED** | 4, 5, 6, 7, 8, 9, 10 (from (a)) and 16–24 (all of (b)) | **16** |
| **UNMOVED** — and expected to be | 1, 2, 3 (from (a)) and 25–31 (all of (c)) | **10** |
| **PARTIAL** | 11 | **1** |
| deferred to §6 (the gate rows) | 12, 13, 14, 15 | **4** |
| **total** | | **31** |

The 16 MOVED rows are re-measurements of **7 distinct review findings** — CR-09 (both variants),
CR-10, CR-11, WR-17, WR-18, WR-19, WR-20 — several of which the two documents recorded more than
once (end-to-end and instrumented, or in both documents). Row 21 alone carries WR-17 and WR-18
together, because one table measures both.

---

## 3. The eleven behavioral spot-checks, both directions, in one place

The plan's own truth is that the four FAILING rows must be shown moving **and** the seven PASSING
rows shown unmoved. §2.1 carries the pairing; this is the both-directions summary a reader can check
in one glance.

| # | Round-4 status | Round-5 status | Shown moving / shown unmoved |
|---|---|---|---|
| 1 | ✓ PASS | ✓ PASS (`1 finding`, EXIT=1) | **shown UNMOVED** |
| 2 | ✓ PASS | ✓ PASS (`1 finding`, EXIT=1) | **shown UNMOVED** |
| 3 | ✓ PASS | ✓ PASS (`1 finding` bare / `2 findings` full, EXIT=1) | **shown UNMOVED** |
| 4 | ✗ FAIL (CR-09) | ✓ refused, EXIT=1 | **shown MOVING** |
| 5 | ✗ FAIL (CR-09 second variant) | ✓ refused, EXIT=1 | **shown MOVING** |
| 6 | ✗ FAIL (CR-10) | ✓ refused, EXIT=1 | **shown MOVING** |
| 7 | ⚠️ WR-20 false positive | ✓ accepted, EXIT=0 | **shown MOVING** |
| 8 | ⚠️ WR-19 uncaught crash | ✓ EXIT=0 with the measurement line | **shown MOVING** |
| 9 | ✗ FAIL (CR-11) | ✓ declined, destination byte-unchanged | **shown MOVING** |
| 10 | ⚠️ WR-18 dial value never read | ✓ dial value decides through `isGatedNote` | **shown MOVING** |
| 11 | ✗ FAIL (WR-21) | **PARTIAL** — the adjusted spelling is closed, the original spelling reproduces | **shown PARTIALLY MOVING — §4.3** |

**The plan's "four failing / seven passing" split does not match the committed table, and the
MEASURED split is used.** Read off `31-VERIFICATION.md`'s own status column:

| Round-4 status | Rows | Count |
|---|---|---|
| `✓ PASS` | 1, 2, 3 | **3** |
| `✗ FAIL` | 4, 5, 6, 9, 11 | **5** |
| `⚠️` (confirms a Warning) | 7, 8, 10 | **3** |
| **total** | | **11** |

`31-20-PLAN.md`'s truth 2 says "the four that FAILED are shown moving and the seven that PASSED are
shown unmoved". Neither number is in the table: five rows failed, three passed, three are warnings.
Every one of the eleven is paired above in both directions regardless, so nothing is lost — but the
split is stated as measured rather than as the plan asserted it, because a closure round that
adopted the plan's number would be carrying an unmeasured figure forward, which is the class this
phase keeps paying for.

---

## 4. The disagreements and the adjusted spellings, recorded rather than absorbed

A closure round that silently prefers one measurement over another has removed the evidence a later
reader would need. Each entry below prints **both** figures.

### 4.1 Row 3 — the round-4 figure (1 finding) and this round's (2 findings) measure different specs

`31-VERIFICATION.md` row 3 records `1 finding(s) over 1/1`, EXIT=1, with the parenthetical
"(bare `it.skip`)". `31-REVIEW.md`'s WR-14 row records `2 finding(s)` for what reads as the same
construct. Both were re-run:

```
bare `it.skip` only                                  -> 1 finding(s) over 1/1, EXIT=1, naming `test.skip`
`it.skip` AND `it.describe.only` (the WR-14 spelling) -> 2 finding(s) over 1/1, EXIT=1, naming
                                                        `test.skip` and `test.describe.only`
```

**Not a disagreement about behaviour — a difference in what each probe file contained.** The
round-4 verifier's own parenthetical says so. Both figures reproduce exactly. **Resolved; no
`UNKNOWN - verify` needed.**

### 4.2 Row 9 — why CR-11 needed two spellings, and what each one measures

`31-18` added three clauses to `promoteAdmitted`, and their evaluation order (measured from the
committed `.js`) is:

```
empty-source-id → unreadable-governance-config → human-stamp-not-gated-at-destination (WR-18)
→ origin-outside-trusted-store (WR-17) → no-such-origin-note → origin-note-not-live
→ field-differs-from-origin → body-differs-from-origin → destination-id-occupied (CR-11)
```

The round-4 CR-11 probe authored its forged origin in a **caller-named ordinary directory** — which
is now refused **earlier**, by WR-17's clause. Re-running only that spelling would prove the write is
refused but would say nothing about whether the **destination** is read, which is what CR-11 is
about. So the ADJUSTED spelling makes the origin a **recognised `.grugops/context` store**, which
satisfies WR-17's clause and lets CR-11's own clause be the one asked. **Both were run and both are
recorded** (row 9). The reason for the adjustment is that the fix moved a clause in FRONT of the one
under test — not that the original probe stopped being valid.

### 4.3 Row 11 — the WR-21 original spelling still reproduces, and that is `R-31-19-01`

This is the round's most consequential pairing and it is stated plainly.

```
### ORIGINAL spelling — a planted ancestor merely NAMED `home`; the process's real HOME untouched
  cwd:               …/T/r5-root-BFADlp/home/work/scratch/deep
  homedir():         /Users/olgeroeselg
  trustedRepoRoot(): …/T/r5-root-BFADlp/home          ← the planted ancestor, ADOPTED
  dial:              "all"   (source: ok)
  vars present:      CLAUDE=false GRUGOPS=false

### ADJUSTED spelling — HOME set so the planted ancestor IS os.homedir()
  homedir():         …/T/r5-root-BFADlp/home2
  trustedRepoRoot(): /Users/olgeroeselg/Projects/public/grugops   ← the KIT
  dial:              "off"

### ABOVE — the configuration sits one level ABOVE the home directory
  trustedRepoRoot(): /Users/olgeroeselg/Projects/public/grugops   ← the KIT
  dial:              "off"
```

**What this means.** `31-19`'s `D-23` bounds the walk at `os.homedir()` and at every ancestor of it.
An ancestor **below** the home directory is still adopted — deliberately, because asserting the kit
there would revert `WR-15`'s own closure (`31-15`), whose green control asserts that `project/a/b/c`
resolves to `project` with no marker anywhere on the path. `31-19` recorded the disagreement at the
time as residual **`R-31-19-01`** and did not take it quietly. That residual is live, and this
measurement is its evidence.

**`UNKNOWN - verify`: which spelling the round-4 verifier actually ran.** Neither
`31-VERIFICATION.md` row 11 nor `31-REVIEW.md`'s WR-21 transcript states whether `HOME` was
overridden in the probe. The review's transcript shows a path under a Claude scratchpad
(`…/scratchpad/home`), which on this box is **not** under the real home directory — so read
literally, the round-4 probe is the ORIGINAL spelling, and the ORIGINAL spelling **is not closed by
this round**. Read as intending a genuine home directory, it is the ADJUSTED spelling, and it **is**
closed. **Both readings are recorded; neither is chosen.** The fifth verification round should
re-drive whichever it meant, and §8 carries this as an open boundary rather than a closure.

For completeness, the other half of WR-21's `Fix:` sentence is measured and closed:
`REPO_BOUNDARY_MARKERS` is now **9** members (`.git`, `.hg`, `.svn`, `.bzr`, `_darcs`, `.jj`,
`.pijul`, `.fslckout`, `_FOSSIL_`), `TRUSTED_ROOT_STOP_CONDITIONS` publishes **6** stop conditions,
and `TRUSTED_ROOT_RESIDUALS` carries **8** members (`R-31-15-01..04`, `R-31-19-01..04`).

### 4.4 Row 21 — a clause-name disagreement with `31-18-SUMMARY.md`'s recorded post-fix table

| Source | `off` row | `absent` row |
|---|---|---|
| `31-18-SUMMARY.md`, "WR-17 — the post-fix per-dial table" | `promoteAdmitted REFUSED (origin-outside-trusted-store)` | `promoteAdmitted REFUSED (origin-outside-trusted-store)` |
| **this round, re-measured at `263d1a3`** | `promoteAdmitted REFUSED (human-stamp-not-gated-at-destination)` | `promoteAdmitted REFUSED (human-stamp-not-gated-at-destination)` |

**Both figures are printed and neither is chosen: `UNKNOWN - verify`.** The measured clause order in
the committed `.js` puts `human-stamp-not-gated-at-destination` **before**
`origin-outside-trusted-store`, so for a non-gating dial the WR-18 clause fires first — which is what
this round measures. The most likely explanation is that `31-18` took its WR-17 table at an
intermediate commit, before its own Task-3 WR-18 clause landed; `31-18-SUMMARY.md` itself records
exactly that hazard one paragraph later, for the WR-18 table ("The first post-fix run of the original
probe read `REFUSED (origin-outside-trusted-store)` on the four gating rows — WR-17's clause fires one
step earlier, so that run was measuring the operand, not the dial"). **The consequence of the
disagreement is nil for safety** — all four rows refuse in both records, and the capability WR-17
named is closed either way. What differs is which clause the caller is told about. Recorded so a
later reader is not surprised by it.

### 4.5 No other disagreement was found

Every other figure in §2 agrees with the owning plan summary's recorded post-fix measurement:
`31-16`'s rows 1–6 and C1–C4, `31-17`'s WR-19 and WR-20 transcripts and its `null`/`null` module
pair, `31-18`'s CR-11 post-fix transcript and its six-row WR-18 table, `31-19`'s PROBE A / CONTROL /
INNER answers. Two figures deserve a note rather than a disagreement row:

- `31-17` recorded the pre-fix interleaved chain at **1216** characters where the review recorded
  **1209**; `31-17-SUMMARY.md` states the 7-character difference is its own interleaving construction
  and that the FACT measured is identical. This round re-ran the post-fix form only, where both
  answers are `null`, so neither figure is contested.
- `31-19`'s INNER case (`D-23` (5)) is re-measured here and agrees: cwd inside a vendored kit beneath
  a host repository root resolves to the **host** (dial `high-severity`), not the kit.

---

## 5. The measurement environment, proven clean

The round-4 verification lost a full-suite run to its own leftover probe files and had to reconcile
it. That reconciliation is part of this round's METHOD, not a footnote.

| Check | Command | Result |
|---|---|---|
| no probe spec anywhere under `.temp` | `find .temp -name '*.uat.spec.ts' \| wc -l` | **0** |
| no round-5 probe directory left behind | `ls .temp \| grep -c '^r5-'` | **0** |
| the tracked tree is unaffected | `git status --short .temp` | **empty** |
| source trees untouched by this plan | `git status --porcelain -- scripts hooks agent-factory install` | **empty** |
| the canary case, re-run **in isolation after cleanup** | `npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts -t "derives zero specs from grugops"` | `Test Files 1 passed (1)`, `Tests 1 passed \| 193 skipped (194)` |
| the D-12 contract on this repository's own root | `node scripts/runnable-ref/uat-spec-integrity.js .` | `UAT spec integrity: ZERO uat specs were visited (0 derived) — this check was NOT performed. A pass line here would state a check that did not run.`, **EXIT=2** |

**A note on the last row, so it is not misread as a failure.** `31-20-PLAN.md`'s `fails_when` for
that command says "stdout carrying no `uat specs checked` measurement line". On **this repository's
own root** the correct answer is the **vacuity floor**: zero specs are derived, so a pass line would
state a check that did not run, and the runnable exits **2** with the ZERO-specs diagnostic on
stderr. That is precisely what the suite case `derives zero specs from grugops's own repository root`
asserts (expected status 2), and it passed in isolation on the row above. The exit code is inside the
D-12 contract's `{0, 1, 2}`. **Recorded as the expected outcome, with the plan's imprecise
`fails_when` wording noted rather than silently satisfied.**

Pre-existing non-spec scratch files from earlier rounds remain under `.temp` (`a1-probe.mjs`,
`dd.txt`, and similar). They are not probe specs, `deriveSpecPaths` matches only `.uat.spec.ts`, and
`.temp` is untracked — so they cannot contaminate either the runnable or the suite. They are named
here so their presence is a recorded fact rather than an unexplained one.

---

## 6. The one-commit gate record — measured, and recorded as a FLOOR

### 6.1 The whole repository, at one commit, with a clean tree

Every figure below was taken at commit **`27f613a`** (`27f613a31fa24bf775c3a3335e8711a51b1ae8e5`) —
this plan's own Task-1 commit, which changes one file under `docs/audit/` and no source file. The
source trees were verified untouched (`git status --porcelain -- scripts hooks agent-factory install`
→ empty) and no probe artifact was on disk (§5).

| # | Gate | Command | Terminal output line | Result |
|---|---|---|---|---|
| G1 | excluded-e2e regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 62 passed (62)` · `Tests 3702 passed \| 2 skipped (3704)` | ✓ exit 0 |
| G2 | build | `npm run build` | `> tsc` (clean) | ✓ exit 0 |
| G3 | typecheck (3 projects) | `npm run typecheck` | `tsc --noEmit && tsc -p tsconfig.tests.json && tsc -p tsconfig.fixtures.json` (clean) | ✓ exit 0 |
| G4 | build parity | `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` | ✓ exit 0 |
| G5 | committed-`.js` freshness | `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` | ✓ exit 0 |
| G6 | foundation guards | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G7 | UAT oracles | `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G8 | frozen floors + both hook suites | `npx vitest run --exclude '**/scripts/e2e/**' scripts/floor-invariance.test.ts hooks/guard.test.ts hooks/admission-guard.test.ts` | `Test Files 3 passed (3)` · `Tests 439 passed (439)` | ✓ exit 0 |
| G9 | structure validator | `VALIDATE_KIT_ROOT=$PWD node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G10 | diff disposition | `npm run check:diff-disposition` | `75 finding(s) over 39 elements` | ✗ exit 1 — **pre-existing debt, reconciled in §6.3** |

**Freshness's committed-output count, stated as a number: 60.** Unchanged from the round-4
verification's row 13 and from the review's baseline paragraph, and freshness additionally reports
set equality with the filesystem walk (`0 committed at HEAD and absent on disk, 0 on disk and absent
from HEAD`).

**The suite moved as follows across the round**, each figure taken from the owning plan's own
measurement and re-measured here at the end:

| Point | Test files | Tests passed | Skipped |
|---|---|---|---|
| round-4 verification (`a16786b`) | 62 | 3566 | 2 |
| after `31-16` (`bd38a2e`) | 62 | 3601 | 2 |
| after `31-17` (`2f7c1c5`) | 62 | 3632 | 2 |
| after `31-18` (`52d73ad`) | 62 | 3682 | 2 |
| after `31-19` (`d8cd26c`) | 62 | 3702 | 2 |
| **this round, re-measured at `27f613a`** | **62** | **3702** | **2** |

The file count never moved off the 62 the round-4 verification measured; the test count rose by
**136** across the round's four fix plans. The 2 skips are the pre-existing ones.

### 6.2 The frozen floors, RE-MEASURED rather than assumed

| Floor | Frozen value | Measured now | Equal? |
|---|---|---|---|
| the byte-frozen deploy guard | `FROZEN_GUARD_BLOB` = `669725bc1c616ab57123e22090d93d57eff1b001` (`scripts/floor-invariance.test.ts:245`) | `git hash-object hooks/guard.ts` → `669725bc1c616ab57123e22090d93d57eff1b001` | **yes** |

`hooks/guard.ts` was not touched by this round and `FROZEN_GUARD_BLOB` was not re-based. The constant
is at line **245** on this tree; the round-4 review quoted line **243** — the two-line drift is the
paragraph `31-15` added beside it, and the VALUE is identical, so the freeze is intact and only the
citation moved.

**The WHOLE decider manifest was walked, not only the two entries this round moved.** A stale entry
elsewhere is the same drift class, so the check is over the manifest as a whole:

```
premise: region found; 26 parsed entries == 26 64-hex literals in the region
deciders in DECIDER_MANIFEST:                  2  (hooks/admission-guard.js: 13, hooks/guard.js: 13)
ENTRIES CHECKED (the WHOLE manifest):          26
distinct module files named:                   14
MISMATCHES:                                    0
```

**26 entries checked. 0 mismatches.** The two entries this round moved, re-measured with `shasum
-a 256` as a second independent instrument:

```
2ccb662815e1346c57ba1cb1f9f713d9b92fec3a241e3ce35b054a188671cfd6  scripts/context-io.js
2107434e318ad4ead0279206361f7e7b05dddb1817e3fddd17f2f337c97d73a6  scripts/checkpoints.js
```

Both differ from the digests `31-REVIEW.md`'s `IN-11` recorded (`edd0d731…` and `19ac8f2e…`) and from
the intermediate value `31-18-SUMMARY.md` recorded for `context-io.js` (`cc1ad162…`). That is the
manifest being **moved with its artifact** across `31-18` and `31-19`, three times, never relaxed —
no entry was removed and none widened to a wildcard.

**This measurement's own harness produced a FALSE PASS on its first attempt, and it is recorded.**
The first parse used a two-space closing-brace pattern taken from the `.ts` source; the emitted `.js`
indents with four spaces, so the walk matched **zero** deciders and reported **`0 mismatches`** — a
green result from an empty denominator. It was caught by a vacuity floor and a count equality added
to the harness itself (`entries > 0`, and `parsed entries == 64-hex literals in the region`), not by
noticing the number looked wrong. **This is the eighth logged instance in this phase of a
verification harness producing a false result about its own premise**, and the seventh, in `31-16`,
`31-17` and `31-18`, was the same shape: a mutation harness measuring a stale artifact. Asserting the
harness's own premise is not optional bookkeeping on this phase; it is the difference between a
measurement and a decoration.

### 6.3 The pre-existing debt, reconciled against its real baseline

`npm run check:diff-disposition` is **red**, and it was red before this round began. The reconciliation
is against the counts `deferred-items.md` records, not against zero.

**Measured now at `27f613a`:** `39 watched file(s) changed since 4d2b8f0; 2178 changed clause(s)
derived; 1790 disposition row(s) across 20 file(s)` → **`75 finding(s) over 39 elements`**.

**Every finding, by the file it names:**

| File | Findings | Owner |
|---|---|---|
| `agent-factory/workflows/05-pr-quality-gate.md` | **38** | plan `31-05` / `31-06` / `31-08` (pre-existing) |
| `agent-factory/workflows/06-uat-pack.md` | **25** | plan `31-05` / `31-06` / `31-08` (pre-existing) |
| `agent-factory/workflows/16-context-read-write.md` | **10** | plan `31-15` |
| `agent-factory/workflows/17-task-claim.md` | **2** | plan `31-05` / `31-06` / `31-08` (pre-existing) |
| **total** | **75** | — |

**The movement across the round, with every figure taken from the record that measured it:**

| Point | Count | What moved it |
|---|---|---|
| `deferred-items.md`, `31-09` entry | 75 | after `31-09.md`'s 18 rows landed |
| `deferred-items.md`, `31-14` entry | 65 over 39 elements | `31-14.md`'s 46 rows took `18-context-compaction.md` to 0 owed |
| `deferred-items.md`, `31-18` entry | 77 | `31-15`'s workflow-16 edits entered the diff; identical before and after `31-18`'s own prose change |
| `31-16` and `31-17` summaries | 77 before, 77 after (each) | neither touches a watched file; `browser-uat-recipe.md` is **outside** `safetySurfaceUnion()` |
| `deferred-items.md`, `31-19` entry | 65 → 85 → **75** | `31-19.md`'s 16 rows cleared the 16 clauses `31-19` changed and cleared **none** of the 10 it did not |
| **this round, re-measured** | **75** | **nothing** — plan `31-20` changes no watched file |

**The reason for the change since the `31-18` entry (77 → 75) is stated rather than left implied.**
Two of the 12 findings that named `16-context-read-write.md` in the `31-18` entry are now covered:
`31-19` rewrote those clauses and wrote rows for them, taking that file from 12 to **10**. The
remaining 10 belong to `31-15` and are unchanged. The four disposition files this round's plans
added — `31-16.md` (15 rows), `31-17.md` (14), `31-18.md` (30), `31-19.md` (16) — carry **0 owed**
for the clauses their own plans changed.

**Two things this round deliberately did NOT do**, because the gate's own message names both as
clearing a finding by deleting its evidence: `00-base.md`'s recorded `base_commit` (`4d2b8f0`) was
**not moved**, and the watched corpus was **not narrowed**. The remedy remains what
`deferred-items.md` has recorded since `31-09`: one disposition file per owning plan (`31-05.md`,
`31-06.md`, `31-08.md`, `31-15.md`).

**The structure validator's invocation contract**, exactly as `deferred-items.md` documents it:

```
node scripts/validate-agent-factory.js                     -> exit 1
   ERROR  VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)
VALIDATE_KIT_ROOT=$PWD node scripts/validate-agent-factory.js -> exit 0, ALL CHECKS PASSED
```

Unchanged, and still an invocation contract rather than a structural failure. Its own `SCOPE` line
additionally discloses that a repository-level `.grugops/factory.config.json` outside the kit tree
was not examined unless `VALIDATE_ROOT` is supplied — recorded here so the scope of the green is
visible with the green.

### 6.4 The suite is a FLOOR, not proof — and this phase's own record is why

**Everything in §6.1 is a floor. None of it is the closure argument.** The argument is §2 through §5.

This is not a generic disclaimer. It is this phase's measured record, four rounds long:

| Round | Suite result | Defects that round found | Defects the suite exercised |
|---|---|---|---|
| 1 | green | 3 planted constructs | **0** |
| 2 | green | CR-05, CR-06 | **0** |
| 3 | green | CR-07, WR-14, CR-08, WR-15 | **0** |
| 4 | green (62 files / 3566 tests) | CR-09 ×2, CR-10, CR-11, WR-19, WR-20, WR-21 | **0** |

`31-VERIFICATION.md` states it in its own words: *"The full excluded-e2e suite is green … and
exercises NONE of the six new defects found this round — this project's standing doctrine that a
green suite is not proof for a safety predicate holds for the FOURTH consecutive verification
round on this phase."*

The two predicate families this applies to are named, so the claim is bounded rather than universal:
**(a)** the UAT-spec modifier ban in `scripts/runnable-ref/uat-spec-integrity.ts`, and **(b)** the
admission / re-binding / governance-root mechanism in `scripts/context-io.ts` and
`scripts/compactor.ts`. For those two families a green suite establishes that no PREVIOUSLY DERIVED
case regressed. It establishes nothing about a case no derivation reaches — and every defect of all
four rounds was exactly that case. `31-VERIFICATION.md`'s own artifact table says so of this round's
two Criticals: *"both new Critical classes this round (CR-09, CR-11) sit outside what any of this
phase's derivations currently enumerate."*

**A reader who takes §6.1 as this round's closure argument has made the error this section exists to
prevent.**

---

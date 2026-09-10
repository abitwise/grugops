# Gap-closure round 6 — the round-5 evidence re-measured against the finished tree

**Round:** 6 — the closing measurement for gap-closure **round 5** of Phase 31 (fix plans `31-21`,
`31-22`, `31-23`, `31-24`, `31-25`; this measurement plan `31-26`)
**Written:** 2026-09-10, by plan `31-26`
**Measured at:** commit `78bdb27` (`78bdb27e4a67b61ca2ab2673606b784429872957`), the round's final
commit before this plan's own, against the **committed `.js`** artifacts, with
`git status --porcelain -- scripts hooks agent-factory install docs` **empty**
**Round base:** `49dfa26` (`49dfa2651795c850ae20a4633cf7a7b34dd6990a`) — the commit before
`31-21`'s first, recorded as `plan_head_before` in `31-21-SUMMARY.md`. Every "over the round" range
below is pinned to it.
**Platform:** darwin 25.5.0 arm64 · Node **v24.12.0**
**Evidence source:** `.planning/phases/31-autonomous-manual-testing/31-VERIFICATION.md` (round 5,
`gaps_found`, 4/6) and `.planning/phases/31-autonomous-manual-testing/31-REVIEW.md` (round-4
gap-closure code review, `issues_found`, 5 critical / 4 warning / 2 info)
**Governing decisions:** `D-24` (`31-21`), `D-25` (`31-22`), `D-26` (`31-23`), `D-27` (`31-24`),
`D-28` (`31-25`) — all recorded in `31-CONTEXT.md`
**Predecessor record:** `docs/audit/31-round4-residuals.md`. This file follows its section shape
rather than inventing a new one. It follows it; it does not replace it. **A prior round's record is
history and is never rewritten** — where this round disagrees with one, **both values are printed
and the disagreement is a row.**

## What this artifact is for

A verification round reads source and committed artifacts. It does not read a planning conversation,
and it should not have to re-derive a probe from a fix plan's own fixture. This file exists so the
**sixth** verification round can start from four things it would otherwise have to rediscover:

1. a table pairing **every** reproduction the round-5 documents recorded with its post-round result,
   re-run with **the original document's own spelling**;
2. a ledger row for **every** finding of `31-REVIEW.md`, every anti-pattern row and every `missing:`
   bullet of `31-VERIFICATION.md`;
3. the answers to the two `UNKNOWN - verify` items `IN-13` names, resolved **by name**;
4. a written register of the boundaries this round **decided to leave open**, with the reason and
   what would force each closed, plus an index of every self-red-team probe the five fix plans ran.

**The order of this document is deliberate.** The adversarial reproductions come FIRST (§2–§5) and
the suite comes afterwards (§6) as a floor. For **five** consecutive verification rounds on this
phase the green suite exercised **none** of the defects that round found — the round-5 report says
so explicitly, for the fifth time. A closure round that led with its suite figures would be leading
with the one instrument this phase's own record shows is not sufficient.

**A closure round that re-measures only its own fixtures has measured its fix and not the finding.**
So every probe below is built from the SOURCE DOCUMENT's spelling. Where a fix legitimately changed
the shape a probe must take, **both** spellings are run and both results are recorded, with the
reason for the adjustment stated.

---

## 1. The probe set, DERIVED from the source documents rather than from the fix plans

### 1.1 The derivation rule

A **reproduction block** is a place in `31-VERIFICATION.md` or `31-REVIEW.md` that records a probe
AND its measured outcome. The counts below were measured with a command rather than typed.

| # | Shape | Where | Count | Command that measured it |
|---|---|---|---|---|
| (a) | a row of the round-5 **Behavioral Spot-Checks** table | `31-VERIFICATION.md` | **16** | `awk '/^\| # \| Behavior/{f=1} f&&/^\| [0-9]+ \|/{c++} END{print c}'` |
| (b) | a numbered **finding heading** | `31-REVIEW.md` | **11** | `grep -cE '^### (CR\|WR\|IN)-[0-9]+:'` |
| (c) | an **anti-pattern** row | `31-VERIFICATION.md` | **7** | `awk '/^\| File \| Line \| Pattern/{f=1} f&&/^\| `/{c++} END{print c+0}'` |
| (d) | a `missing:` bullet across both gap entries | `31-VERIFICATION.md` | **6** | `awk` over the two `missing:` lists |

The **(b)** count of 11 equals `31-REVIEW.md`'s own frontmatter (`critical: 5, warning: 4, info: 2,
total: 11`), derived and quoted rather than only quoted. §7 carries one disposition row per member
of (b), (c) and (d); §8 states the equality.

### 1.2 What is excluded, by name, so the exclusion is not silent

- **`IN-13` carries no probe of its own.** It is a finding *about two `UNKNOWN - verify` items in
  another document*. It is excluded from the reproduction denominator and answered in full in §9.
- **`WR-22`, `WR-24` and `IN-12` carry no fenced measurement block in `31-REVIEW.md`.** WR-22's
  measured half is CR-12's ledger-FIFO transcript, which IS driven below; WR-24 and IN-12 are
  structural observations about a fixture and a call count, and are dispositioned in §7 against a
  measurement rather than a re-run probe.
- **The baseline figures** of the review's Summary paragraph (freshness, the guards, the suite
  counts, the frozen blob, the two decider digests) are §6's business, not §2's.

### 1.3 The probe environment, and one constraint re-measured rather than assumed

Every AST probe ran against the committed `scripts/runnable-ref/uat-spec-integrity.js` from a probe
repository of the shape prior rounds established: a root under `.temp/31-26-probe/<name>/` **inside
this repository** (so `createRequire` resolves `typescript` from the repository's own
`node_modules`), a `package.json`, and a single spec at `uat/p.uat.spec.ts`.

**That constraint is re-measured here rather than inherited.** The identical depth-1000 spec planted
in an `mktemp -d` tree under `/tmp` does **not** reach the parser at all:

```
node scripts/runnable-ref/uat-spec-integrity.js /tmp/r5-bytes-XXXXXX
EXIT=2  stdout: (empty)
stderr: SKIPPED: the target repository does not provide typescript — UAT specs NOT checked; the UAT status stays pending
```

A probe planted outside this repository measures `PARSER_ABSENT_MARKER`, not the ban. Recorded so a
later reader who re-runs a transcript from a different working directory is not surprised by it.
(It doubles as UATX-05's own direct measurement — see §3.4.)

Every context probe ran against the committed `scripts/context-io.js` and `scripts/compactor.js`,
with the governance root supplied through `CLAUDE_PROJECT_DIR`, or — for the trusted-root probes —
in a **child process** with `HOME` overridden and **both** project-directory variables genuinely
**removed** (`env -u CLAUDE_PROJECT_DIR -u GRUGOPS_PROJECT_DIR`, not blanked; the child prints
`claudeVarPresent:false grugopsVarPresent:false` as its own premise assertion).

**One correction to a probe premise, recorded rather than absorbed.** The governance dial is read
from `.grugops/factory.config.json` under a `context` key — `{"context":{"human_admission":…}}`.
This plan's first context probe wrote the dial at the top level, and every destination consequently
read `human_admission: off`. Two rows (5 and 6) came back naming
`human-stamp-not-gated-at-destination`, which would have been recorded as a *disagreement with the
fixers* had the premise not been checked. The premise was checked by asking
`readGovernanceConfig` directly and printing what it answered. **This is the tenth logged instance
in this phase of a verification harness producing a false result about its own premise, and the
first one in this document.**

---

## 2. The reproduction pairing table — every reproduction re-run with its own document's spelling

Legend: **MOVED** = the round-5 result changed in the direction the owning plan committed to.
**UNMOVED** = the round-5 result is reproduced unchanged, which for a previously-PASSING row is the
evidence that nothing broke. **AGREES / DISAGREES** compares this session's figure with the owning
fix plan's own recorded post-fix figure.

### 2.1 The UATX-01 family — CR-12, CR-13, CR-16, WR-22, WR-25

| Probe spelling | From | Round-5 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| an ordinary in-repository directory (`<proj>/tmp/forged`, `endsWith('.grugops/context') === false`) promoted into a FRESH destination id | `31-VERIFICATION.md` row 4 / `31-REVIEW.md` CR-16 | `promotedId` = the note's id, `threw` = `null`, destination holds the file | `promotedId: null`, `DECLINED (origin-outside-trusted-store)`, `destNotes: []`, `ledgerDelta: 0` | **MOVED — CR-16 CLOSED** | AGREES with `31-22` GREEN |
| the same attack against an **OCCUPIED** destination id | `31-VERIFICATION.md` row 5 | `DECLINED (destination-id-occupied)`, destination byte-unchanged | `DECLINED (origin-outside-trusted-store)`, occupant **byte-unchanged** | **UNMOVED as a verdict; the CLAUSE NAMED moved** — see §4.1 | AGREES with `31-22` (WR-25's own intent) |
| the same OCCUPIED destination reached from a **legitimate anchored** origin | `31-22-SUMMARY.md` CONTROL 3 | — | `DECLINED (destination-id-occupied)`, occupant byte-unchanged | CR-11's own closure re-measured at its own clause | AGREES |
| the legitimate human-disposed promotion (CR-08's own case), anchored origin, `high-severity` destination | `31-VERIFICATION.md` row 6 | `promotedId` returned, `threw: null`, destination holds the note | `promotedId` returned, `threw: null`, destination note **byte-identical to the origin**, `ledgerDelta: 1` | **UNMOVED** | AGREES with `31-22` CONTROL 2 |
| `compactor.promote` on the same human-stamped note | `31-VERIFICATION.md` row 6 (the D-04 control) | throws its D-04 refusal | throws `admission REFUSED (human_admission: high-severity)` | **UNMOVED** | AGREES |
| `mkfifo <ctx>/T-9/notes/<id>.md; timeout 10 node <probe invoking appendNote>` | `31-VERIFICATION.md` row 7 / `31-REVIEW.md` CR-12 | **EXIT=124**, 0 bytes stdout, 0 bytes stderr | **EXIT=0 in 43 ms**, `REFUSED … (note-path-not-a-regular-file)`, position **still a FIFO**, stderr 0 bytes | **MOVED — CR-12 CLOSED** | AGREES with `31-21` (0.06 s) |
| the control for the same route — an ABSENT note path | `31-21-SUMMARY.md` control | `WROTE`, EXIT=0 | `WROTE …-deadbeef`, EXIT=0 in 54 ms | **UNMOVED** | AGREES |
| `mkfifo <repoRoot>/.grugops/audit/admissions.jsonl; timeout 15 node <probe invoking promoteAdmitted>` | `31-REVIEW.md` CR-12, second probe (the verifier did NOT run it) | **EXIT=124**; the note was **already written**, the ledger empty | **EXIT=0 in 59 ms**, `DECLINED (unreadable-audit-ledger)`, `DEST-BEFORE []` → `DEST-AFTER []`, ledger position still a FIFO | **MOVED — CR-12's second position and WR-22's measured half CLOSED** | AGREES with `31-21` (0.05 s, `DEST=[]`) |
| `trustedRepoRoot()` with `HOME` at a planted repository root carrying `.git` + `human_admission: high-severity`, both project-directory variables removed, cwd inside it | `31-VERIFICATION.md` row 8 / `31-REVIEW.md` CR-13 | `trustedRepoRoot()` → the KIT; dial `off`; the self-stamped high-severity finding **WROTE** | `trustedRepoRoot()` → **the planted home repository**; `source: ok`, dial **`high-severity`**; the identical note **REFUSED** naming `admission REFUSED (human_admission: high-severity)` | **MOVED — CR-13 CLOSED** | AGREES with `31-23` ROW 8 post-fix |
| the CONTROL — the identical tree one level BELOW the REAL home, real `HOME` untouched | `31-VERIFICATION.md` row 9 | `trustedRepoRoot()` → the project; dial `high-severity` | `trustedRepoRoot()` → the project; `source: ok`, dial `high-severity`; the note REFUSED | **UNMOVED** (`R-31-19-01`, a documented residual, not a finding) | AGREES with `31-23` CONTROL 1 |

### 2.2 The UATX-06 family — CR-14, CR-15, WR-23, WR-24, IN-12

| Probe spelling | From | Round-5 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| `expect.configure({retries:2}).soft(locator).toBeVisible()` | `31-VERIFICATION.md` row 1 (CR-09) | `1 finding(s) over 1/1`, EXIT=1, naming `expect.configure().soft` | `1 finding(s) over 1/1`, EXIT=1, `uat/p.uat.spec.ts:3: … expect.configure().soft`, stderr 0 bytes | **UNMOVED** | AGREES with `31-24` CONTROL 2 |
| `test("a", async ({page}, testInfo) => { testInfo.skip(); … })` | `31-VERIFICATION.md` row 2 (CR-10) | `1 finding(s)`, EXIT=1, naming `test.info().skip` | `1 finding(s) over 1/1`, EXIT=1, `:3: … test.info().skip` | **UNMOVED** | AGREES with `31-24` CONTROL 4 |
| `expect.configure({retries:2}).configure({soft:true})(locator).toBeVisible()` | `31-VERIFICATION.md` row 3 (CR-09, second variant) | row 3 was recorded as *implied* by row 1's mechanism, with a pointer to the review — **not directly driven by the verifier** | **DIRECTLY DRIVEN here:** `1 finding(s) over 1/1`, EXIT=1, `:3: … expect.configure().configure` | **UNMOVED, and now driven rather than implied** | AGREES with `31-24` CONTROL 3 |
| `import { test as it }; it.skip("scenario", async ({page}) => { const it = 1; void it; … })` | `31-VERIFICATION.md` row 10 / `31-REVIEW.md` CR-14 | `0 findings over 1/1`, **EXIT=0** | `1 finding(s) over 1/1`, **EXIT=1**, `:2: … test.skip` | **MOVED — CR-14 CLOSED** | AGREES with `31-24` RED 1 |
| the CONTROL — the identical file with the dead `const it = 1;` removed | `31-VERIFICATION.md` row 11 | `1 finding(s)`, EXIT=1, naming `test.skip` | `1 finding(s) over 1/1`, EXIT=1, `:2: … test.skip` | **UNMOVED** | AGREES with `31-24` CONTROL 1 |
| `import * as pw; pw.test.skip("scenario", async ({page}) => { const pw = 1; void pw; … })` | `31-REVIEW.md` CR-14, NAMESPACE variant (the verifier did NOT run it) | `0 findings over 1/1`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, `:2: … test.skip` | **MOVED — CR-14's namespace spelling CLOSED** | AGREES with `31-24` RED 2 |
| `function helper(testInfo: number){…}` + `test("scenario", async ({page}, testInfo) => { testInfo.skip(); … })` | `31-REVIEW.md` CR-14, INDEX-0-helper variant (the verifier did NOT run it) | `0 findings over 1/1`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, `:4: … test.info().skip` | **MOVED — CR-14's index-0 spelling CLOSED** | AGREES on construct + exit; **DISAGREES on the line number** — see §4.2 |
| the CONTROL — the same file without `helper` | `31-REVIEW.md` CR-14 | `1 finding(s)`, EXIT=1, naming `test.info().skip` | `1 finding(s) over 1/1`, EXIT=1, `:3: … test.info().skip` | **UNMOVED** | AGREES |
| `function inner(n: number, it: {skip:…}): number { return it.skip(n); }` + a legitimate renamed scenario | `31-REVIEW.md` WR-23, the review's own helper spec | `1 finding(s) over 1/1`, EXIT=1, naming `test.skip` — a construct absent from the file | `0 findings over 1/1`, **EXIT=0**, stderr 0 bytes | **MOVED — WR-23's false refusal CLOSED** | AGREES with `31-24` RED 4 |
| a spec containing `const x: any = ((((…1 nested 1000 times…))));` | `31-VERIFICATION.md` row 12 / `31-REVIEW.md` CR-15 | uncaught `RangeError` at the parser's `token()`, **EXIT=1**, stdout empty, **no measurement on either stream** | **EXIT=2**, stdout **0 bytes**, stderr 327 bytes carrying the named could-not-run reason **and** the vacuity floor; **0 stack frames** escaped (`grep -cE '^\s+at .*:[0-9]+:[0-9]+'` → 0) | **MOVED — CR-15 CLOSED** | AGREES on every fact; a 3-unit difference in the stderr size — see §4.3 |
| the same construct at depths **500 / 630 / 631 / 2000 / 5000** | `31-REVIEW.md` CR-15's depth table, extended by `31-25`'s adjacency pair | 500 → EXIT=0; 1000/2000/5000 → EXIT=1 uncaught | 500 → EXIT=0 pass line on **stdout**; **630** → EXIT=0 pass line on stdout; **631** → EXIT=2 floor on **stderr**; 2000 / 5000 → EXIT=2, byte-identical to 1000 | **MOVED; the 630/631 adjacency reproduced exactly** | AGREES with `31-25`'s bisected pair (630 / 631) |
| WR-19's own closure — a **4,000-link** call chain `test.a()…skip()` | `31-REVIEW.md`'s prior-findings row / `31-25` CONTROL 1 | `0 findings over 1/1`, EXIT=0, stderr empty | `0 findings over 1/1`, EXIT=0, stderr **0 bytes** | **UNMOVED** | AGREES with `31-17` and `31-25` CONTROL 1 |

### 2.3 The four gate rows

| Probe | From | Round-5 result | This round | Verdict |
|---|---|---|---|---|
| the full excluded-e2e regression suite | row 13 | `Test Files 62 passed (62)`, `Tests 3702 passed \| 2 skipped (3704)`, exit 0 | `Test Files 62 passed (62)`, `Tests 3908 passed \| 2 skipped (3910)`, exit 0 | **UNMOVED as a verdict; +206 tests** — §6.1 |
| committed-`.js` freshness | row 14 | `All build outputs fresh: 60 committed .js file(s) …` | identical, **60** | **UNMOVED** |
| foundation guards / UAT oracles | row 15 | both `ALL CHECKS PASSED` | both `ALL CHECKS PASSED`; guards in **0.20 s** | **UNMOVED** |
| the byte-frozen deploy guard | row 16 | `git hash-object hooks/guard.ts` → `669725bc1c616ab57123e22090d93d57eff1b001` = `FROZEN_GUARD_BLOB` | identical, still at `scripts/floor-invariance.test.ts:245` | **UNMOVED** |

### 2.4 The equality, stated rather than implied

**16 behavioral spot-check rows. 16 driven. 0 not-driven.**

- **5 rows were FAILING in round 5 — 4, 7, 8, 10, 12 — and all 5 MOVED.**
- **11 rows were PASSING in round 5 — 1, 2, 3, 5, 6, 9, 11, 13, 14, 15, 16 — and all 11 are UNMOVED.**
  Row 5's *verdict* is unmoved (decline, occupant byte-unchanged) while the clause it names moved;
  that is stated as its own row rather than folded into "unmoved" (§4.1). Row 3 was recorded by the
  verifier as *implied* rather than driven, and is driven directly here.
- **5 further probes that only `31-REVIEW.md` carries were driven** and none had been re-run by the
  verifier: CR-12's ledger FIFO, CR-14's namespace spelling, CR-14's index-0-helper spelling (and
  its control), and WR-23's helper spec. **All 5 moved in the direction their owning plan committed
  to.**
- **No row in this ledger claims a closure without a quoted measurement taken in this session.**

---

## 3. The requirements round 5 recorded SATISFIED, re-measured by their own mechanisms

A requirement recorded SATISFIED and not re-driven is `UNKNOWN - verify`, not "still satisfied".
Each of the four is re-measured by the mechanism that owns it rather than inherited.

### 3.1 UATX-02 — the browser-MCP pin authority

`node scripts/check-foundation-guards.js` → `ALL CHECKS PASSED` (exit 0, **0.20 s**). The guard that
owns this requirement, quoted from its own output:

```
[guard_playwright_mcp_pin] every pinned mention of the browser MCP server across the kit and the
docs equals the ONE literal in the recipe (D-08 / UATX-02)
  PASS  playwright MCP pin `0.0.78` — pinned mention(s) over 122 markdown file(s): 0 findings over 7/7 elements
```

**Named result: `guard_playwright_mcp_pin` PASS**, 7/7 elements, 0 findings, over 122 markdown files.

### 3.2 UATX-03 — the attended Chrome lane's structural bar

`npx vitest run --exclude '**/scripts/e2e/**' scripts/chrome-lane-bar.test.ts` →
`Test Files 1 passed (1)`, `Tests 15 passed (15)`. Driven as its **own** file rather than inferred
from the 62-file total. The lane's *real interactive* behaviour is **not** inferred from the bar —
it stays `R-01`, open (§12).

### 3.3 UATX-04 — the provenance routes, proven untouched by a diff over the whole round

| Instrument | Round base `49dfa26` | HEAD `78bdb27` | Equal? |
|---|---|---|---|
| `ADMIT_FROZEN_SHA256` (the frozen span over `admit()`'s own body) | `08df9e5c15754f8b3f3bde417475652d3d3861c50fd5458704b29651b83709e9` | identical | **yes — not re-based** |
| occurrences of `artifact-ref` in `scripts/context-io.ts` | 24 | 24 | yes |
| occurrences of `SHA_HEX_RE` | 7 | 7 | yes |
| occurrences of `gate_run` | 19 | 19 | yes |
| occurrences of `content_hash` | 20 | 20 | yes |

And the stronger statement, derived rather than inferred:

```
git diff 49dfa26..HEAD -- scripts/context-io.ts \
  | grep -cE '^[-+].*(artifact-ref|content_hash|gate_run|SHA_HEX_RE)'
0
```

**Not one hunk of the round's own diff adds or removes a line naming any provenance token.**

### 3.4 UATX-05 — the two loud-skip markers, and where CR-15 sits relative to this requirement

| Case | Command | Result |
|---|---|---|
| `PARSER_ABSENT_MARKER`, driven directly | `node scripts/runnable-ref/uat-spec-integrity.js <mktemp root>` | **EXIT=2**, stdout empty, stderr exactly `SKIPPED: the target repository does not provide typescript — UAT specs NOT checked; the UAT status stays pending`, **1** emission |
| `BROWSER_ABSENT_MARKER`, stages 1 and 2 | `… -t "unavailable emits the marker"` | `Test Files 1 passed`, **2 passed** \| 276 skipped |
| `BROWSER_ABSENT_MARKER`, the CLI stage-1 exit | `… -t "check-browser exits 2 with the stage-1 clause"` | `Test Files 1 passed`, **1 passed** \| 277 skipped |
| the vacuity floor on this repository's own root | `node scripts/runnable-ref/uat-spec-integrity.js .` | **EXIT=2**, stdout empty, stderr `UAT spec integrity: ZERO uat specs were visited (0 derived) — this check was NOT performed. A pass line here would state a check that did not run.` |
| the zero-spec derivation case, **in isolation after cleanup** | `… -t "derives zero specs from grugops"` | `Test Files 1 passed`, `Tests 1 passed \| 277 skipped (278)` |

**Where CR-15 sits relative to UATX-05, stated so the boundary is not blurred.** CR-15 breached the
D-12 `{0,1,2}` exit contract, which is shared infrastructure for both requirements — but the
specific claim it falsified was `browser-uat-recipe.md`'s own paragraph about the *checker's*
behaviour on a pathological *spec*, which is UATX-06's claim. Round 5 tracked it under UATX-06 for
that reason, and this round does not move it. What UATX-05 owns is the *loud skip on an absent or
unusable browser*, and both of its markers are re-measured above, each emitting exactly once at
exit 2.

---

## 4. The disagreements and the adjusted spellings, recorded rather than absorbed

### 4.1 Row 5 — the verdict is unmoved and the CLAUSE NAMED moved, deliberately

`31-VERIFICATION.md` row 5 drives a **forged** origin at an **occupied** destination id and records
`DECLINED (destination-id-occupied)`. This session measures the identical spelling as
`DECLINED (origin-outside-trusted-store)`.

**This is `WR-25`'s own fix, working.** `31-22` moved exactly one guard so a caller is told about its
own INPUT before it is told about its ENVIRONMENT; `origin-outside-trusted-store` now precedes both
the dial clause and `destination-id-occupied`. The verifier's row-5 input fails **two** clauses at
once, and the round's decided answer is the one about the caller's input.

**Both halves are driven, so neither closure is asserted from the other:**

| input | clause named | occupant |
|---|---|---|
| forged in-repository origin + occupied destination id | `origin-outside-trusted-store` | **byte-unchanged** |
| legitimate **anchored** origin + occupied destination id | `destination-id-occupied` | **byte-unchanged** |

CR-11's closure is therefore measured **at its own clause**, not inferred from a decline that a
different clause produced. Recorded as a movement in the message rather than in the verdict.

### 4.2 The index-0-helper variant — the line number differs, and the reason is the probe file

`31-24-SUMMARY.md` records RED 3's post-fix finding at `uat/a.uat.spec.ts:5`. This session measures
`uat/p.uat.spec.ts:4`.

**Both figures are printed. Neither is chosen, because neither is wrong.** The finding's line is a
property of the probe file's own layout — this session's spec places `void helper(1);` *after* the
`testInfo.skip()` call, `31-24`'s places it elsewhere. The two agree on everything the mechanism
decides: the **construct named** (`test.info().skip`), the **finding count** (1 over 1/1) and the
**exit code** (1). Recorded so a later reader re-running the transcript verbatim is not surprised.

### 4.3 Row 12 — a three-unit difference in the stderr size, resolved arithmetically

`31-25-SUMMARY.md` records the post-fix depth-1000 stderr as **324 B**. This session measures
**327 bytes / 325 characters**, over two lines whose content is identical to the record's.

The difference is the counting unit, and it is checkable: the message carries one em-dash, which is
3 bytes and 1 character in UTF-8, so 327 bytes = 325 characters; 325 characters minus the trailing
newline = **324**. The two records agree on content and differ in what was counted. **Both figures
are printed; the arithmetic is stated rather than the conclusion asserted.**

### 4.4 The `DECIDER_MANIFEST` digest chain — three moves, none relaxed, and the intermediate values reconciled

`31-21-SUMMARY.md` records the `scripts/context-io.js` entry's "before" as `2ccb6628…`;
`31-22-SUMMARY.md` records a move `58ed2236… → 791f854d…`. Read side by side those look like a
disagreement. Measured, they are one chain:

| commit | `scripts/context-io.js` entry |
|---|---|
| round base `49dfa26` | `2ccb662815e1346c…` |
| after `31-21` (`784c165`) | `58ed22362989ed99…` |
| after `31-22` (`b3719d7`) | `791f854d32416366…` |
| after `31-23` (`0f90a5b`) | `64ceee727021d903…` |
| **HEAD `78bdb27`** | `64ceee727021d903…` |

**Three moves across three plans, each with its artifact, none relaxed, no entry removed and none
widened to a wildcard.** `31-21`'s "before" is the round base; `31-22`'s "before" is `31-21`'s
"after". No disagreement survives.

### 4.5 No other disagreement was found

Every other figure in §2 agrees with the owning plan summary's recorded post-fix measurement:
`31-21`'s FIFO timings and its `DEST=[]` ledger row, `31-22`'s CR-16 decline and its byte-identical
legitimate promotion, `31-23`'s ROW 8 and CONTROL 1 cells, `31-24`'s RED 1 / RED 2 / RED 4 and its
four controls, `31-25`'s depth table and its 630/631 adjacency pair.

---

## 5. The measurement environment, proven clean — and a finding about the round's own harness

### 5.1 The `git status`-based `.temp/` residue gate could never have failed, and did not

`docs/audit/31-round4-residuals.md` §5 uses `git status --short .temp` as its "the tracked tree is
unaffected" row, and rounds 3, 4 and 5 each carried a residue gate of that shape. **Measured here:**

```
$ git check-ignore -v .temp/g.txt
.gitignore:19:.temp/	.temp/g.txt

$ git status --short .temp
(prints nothing — with 58 entries in that directory)
```

`.temp/` is gitignored at `.gitignore:19`, so `git status --short .temp` prints nothing **however
full that directory is**. It cannot fail. **A gate that cannot fail is a gate that was never run**,
and this document records that as a finding about the round's own harness rather than as a footnote.
`31-21`, `31-22`, `31-23`, `31-24` and `31-25` each already say so in their own residue sections;
this is the first time it is stated as a finding against the *earlier* rounds' method, which is
where it originated.

**The predicates that replaced it can observe their target:**

| Check | Command | Result |
|---|---|---|
| this round's own probe root | `test ! -e .temp/31-26-probe` | **PASS (absent)** |
| the five fix plans' probe roots | `test ! -e .temp/31-2{1,2,3,4,5}-probe` | **PASS (all five absent)** |
| the FIFO sweep — the only gate that could catch the hazard `31-21`'s precondition names | `find . -path ./node_modules -prune -o -type p -print` | **prints nothing** |
| the real home directory | `echo "$HOME"` | `/Users/olgeroeselg` — restored, never left overridden in this shell |
| the tracked tree | `git status --short` | only the four PRE-EXISTING non-plan entries (`.planning/milestone.lock`, `human-notes.txt`, untracked `.gsd/`, `.planning/state.json`) |

### 5.2 The `.temp/` listing, with this round's own additions distinguished

`.temp/` holds **58** entries. **57** pre-date this round's first fix commit (`0b64074`,
2026-09-09T21:18:33+03:00) and are the rounds-3-to-5 artifacts `31-21-SUMMARY.md` counted. Exactly
**one** was created during round 5's fix waves:

```
$ find .temp -maxdepth 1 -mindepth 1 -newermt "2026-09-09 21:18:33" -print
.temp/31-21-derive-probe.mjs          (mtime 2026-09-09T22:02:38Z, 1593 bytes)
```

**That file was created by plan `31-21` OUTSIDE its own declared single probe root.** `31-21`'s
residue check asserts `test ! -e .temp/31-21-probe`, which passes, and the file therefore survived a
predicate that could observe a directory but was never asked about a sibling. It is a `.mjs`, not a
`*.uat.spec.ts`, so it cannot contaminate a spec derivation — recorded as a named fact with its
owner rather than left as an unexplained entry. **This round created nothing that survives:**
everything it wrote lived under `.temp/31-26-probe/` (plus one short-lived `.temp/31-26-bytes`), and
both are gone.

### 5.3 The `.temp/` contamination hazard, REPRODUCED IN THIS SESSION rather than cited

This is the row this document most wants read. Round 4's §5 names probe-artifact contamination as a
hazard and reconciles a lost suite run against it. **This session reproduced it, by accident, and
measured what it costs.**

The full excluded-e2e suite was run once while this plan's own probe root was still on disk:

```
$ npx vitest run --exclude '**/scripts/e2e/**'
... ❯ .temp/31-26-probe/wr19chain/uat/p.uat.spec.ts (0 test)
❯ scripts/runnable-ref/uat-spec-integrity.test.ts (278 tests | 1 failed)
❯ hooks/guard.test.ts                             (230 tests | 5 failed)
Segmentation fault: 11
EXIT=139   wall 265.1 s   (no `Test Files` summary line was ever printed)
```

Three facts, each measured:

1. **vitest COLLECTED a probe spec as a test file.** `.temp/` is excluded from git, not from the
   test runner's glob.
2. **Two unrelated suite files reported failures** — `uat-spec-integrity.test.ts` (1) and
   `hooks/guard.test.ts` (5) — and the process then died on **SIGSEGV**, so no summary line exists
   to read.
3. **`git status --short .temp` printed nothing at that exact moment.** The gate the previous rounds
   relied on was silent while the contamination was destroying the run.

After `rm -rf .temp/31-26-probe`, the identical command at the identical commit:

```
$ npx vitest run --exclude '**/scripts/e2e/**'
 Test Files  62 passed (62)
      Tests  3908 passed | 2 skipped (3910)
EXIT=0   wall 277.7 s
$ grep -c '.temp/' <transcript>   ->  0
```

**A contaminated run and a clean run at the same commit, both quoted.** Every gate figure in §6 is
from the clean run. The contaminated transcript is not discarded — it is the evidence that the
hazard is live and that the retired gate could not see it.

### 5.4 The zero-spec derivation case, re-confirmed IN ISOLATION after cleanup

The exact false alarm rounds 4 and 5 both had to reconcile:

```
$ npx vitest run --exclude '**/scripts/e2e/**' \
    scripts/runnable-ref/uat-spec-integrity.test.ts -t "derives zero specs from grugops"
 Test Files  1 passed (1)
      Tests  1 passed | 277 skipped (278)
```

Green in isolation, after cleanup, at `78bdb27`.

---

## 6. The one-commit gate record — measured, and recorded as a FLOOR

### 6.1 The whole repository, at one commit, with a clean tree

Every figure below was taken at commit **`78bdb27`**
(`78bdb27e4a67b61ca2ab2673606b784429872957`) — the round's final source commit. The source trees
were verified untouched (`git status --porcelain -- scripts hooks agent-factory install docs` →
**empty**) and no probe artifact was on disk (§5). Node **v24.12.0**, darwin 25.5.0 arm64.

| # | Gate | Command | Terminal output line | Result |
|---|---|---|---|---|
| G1 | excluded-e2e regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 62 passed (62)` · `Tests 3908 passed \| 2 skipped (3910)` | ✓ exit 0, 277.7 s |
| G2 | build | `npm run build` | `> tsc` (clean) | ✓ exit 0 |
| G3 | typecheck (3 projects) | `npm run typecheck` | `tsc --noEmit && tsc -p tsconfig.tests.json && tsc -p tsconfig.fixtures.json` (clean) | ✓ exit 0 |
| G4 | build parity | `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` | ✓ exit 0 |
| G5 | committed-`.js` freshness | `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` | ✓ exit 0 |
| G6 | foundation guards | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` | ✓ exit 0, **0.20 s** |
| G7 | UAT oracles | `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G8 | frozen floors + both hook suites | `npx vitest run … scripts/floor-invariance.test.ts hooks/guard.test.ts hooks/admission-guard.test.ts` | `Test Files 3 passed (3)` · `Tests 439 passed (439)` | ✓ exit 0 |
| G9 | structure validator | `VALIDATE_KIT_ROOT=$PWD node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G11 | fixtures + tests typecheck | `npx tsc -p tsconfig.fixtures.json --noEmit && npx tsc -p tsconfig.tests.json --noEmit` | both clean; **no diagnostic names a file under `scripts/runnable-ref/fixtures/`** | ✓ exit 0 |
| G12 | writing profile | `node scripts/check-imperative-lexicon.js .` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G13 | residual citations | `npm run check:residual-citations` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G14 | audit register | `npm run check:audit-register` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G15 | claim anchors | `npm run check:claim-anchors` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G10 | diff disposition | `npm run check:diff-disposition` | `110 finding(s) over 39 elements` | ✗ exit 1 — **pre-existing debt that the round ADDED to; reconciled in §6.3** |

**Freshness's committed-output count, stated as a number: 60.** Unchanged from the round-5
verification's row 14 and from the round-4 record. `git diff --name-status 49dfa26..HEAD -- '*.js'`
adds **0** files, so no new committed `.js` was introduced by the round.

**The suite moved as follows across the round**, each figure taken from the owning plan's own
measurement and re-measured here at the end:

| Point | Test files | Tests passed | Skipped |
|---|---|---|---|
| round-5 verification (`89228c8`) | 62 | 3702 | 2 |
| after `31-21` | 62 | 3747 | 2 |
| after `31-22` | 62 | 3778 | 2 |
| after `31-23` | 62 | 3826 | 2 |
| after `31-24` | 62 | 3878 | 2 |
| after `31-25` | 62 | 3908 | 2 |
| **this round, re-measured at `78bdb27`** | **62** | **3908** | **2** |

The file count never moved off the 62 the round-4 verification measured; the test count rose by
**206** across the round's five fix plans. The 2 skips are the pre-existing ones. **`31-23`'s
summary records 3826 while its own verification table says "3826 tests" and its PROBE 5 paragraph
says "3826 tests, 62 files" — both agree; the figure re-measured here for the END of the round is
3908, which agrees with `31-25`.**

**`package.json` is byte-unchanged across the round.** Two ranges are recorded, because the plan's
own `<verify>` command and the round's real base do not resolve to the same commit:

```
$ git rev-list -n1 --before=2026-09-09T19:00:00Z HEAD
34f698933d605407d229d0a094e2e05a1781590c   ← fix(31-21) GREEN — INSIDE the round, not its base
$ git diff --stat 34f6989..HEAD -- package.json      (empty)
$ git diff --stat 49dfa26..HEAD -- package.json      (empty)   ← the ROUND BASE
```

The plan's `--before` expression is a *stale-half-of-the-record* item: it names a timestamp that
falls after `31-21`'s first two commits, so it pins a range strictly inside the round. **The
measured value is unaffected — `package.json` is byte-unchanged under both ranges — but the
imprecision is recorded rather than silently satisfied**, exactly as `docs/audit/31-round4-residuals.md`
§5 recorded its own plan's imprecise `fails_when`.

### 6.2 The doctrine, stated beside the green rather than instead of it

**How many of round 5's five Critical defects did the green suite exercise before this round's
fixes? ZERO — for the fifth consecutive round on this phase.** `31-VERIFICATION.md` row 13 says so
in its own words ("for the FIFTH consecutive verification round on this phase, exercises none of the
newly-found defects (CR-12 through CR-16)"), and `31-REVIEW.md`'s Summary says it again ("every one
of this round's four fixes created or preserved a defect one register over, **and the green suite
exercises none of them**"). G1 above is a **floor**. It is not the argument. The argument is §2.

### 6.3 The pre-existing `check:diff-disposition` debt — RE-MEASURED, and the round ADDED to it

`npm run check:diff-disposition` is **red**, and it was red before this round began. The
reconciliation is against the counts `deferred-items.md` records, not against zero.

```
39 watched file(s) changed since 4d2b8f0; 2206 changed clause(s) derived; 1790 disposition row(s)
across 20 file(s)
FAIL  diff disposition — changed watched file(s): 110 finding(s) over 39 elements
```

Every finding, by the file it names, measured rather than quoted:

| File | round-4 record (`27f613a`) | **this round (`78bdb27`)** | Δ | Owner |
|---|---|---|---|---|
| `agent-factory/workflows/05-pr-quality-gate.md` | 38 | **38** | 0 | plans `31-05`/`31-06`/`31-08` (pre-existing) |
| `agent-factory/workflows/06-uat-pack.md` | 25 | **25** | 0 | plans `31-05`/`31-06`/`31-08` (pre-existing) |
| `agent-factory/workflows/17-task-claim.md` | 2 | **2** | 0 | plans `31-05`/`31-06`/`31-08` (pre-existing) |
| `agent-factory/workflows/16-context-read-write.md` | 10 | **16** | **+6** | 10 to plan `31-15`; **6 to plan `31-23`** |
| `agent-factory/workflows/18-context-compaction.md` | 0 | **29** | **+29** | **plans `31-21` and `31-22`** |
| **total** | **75** | **110** | **+35** | |

**The attribution is DERIVED, not assumed.** The three unchanged files are untouched by the round
(`git log --oneline 49dfa26..HEAD -- <file>` returns nothing for each). The two that moved were each
changed by a named plan:

```
agent-factory/workflows/18-context-compaction.md
   12c7733 feat(31-22): one canonical origin form — shape CONJOINED with root anchoring (CR-16, D-25)
   b3f666f docs(31-21): bring the corrected trace paragraph inside the Phase 29 writing profile
   8cde300 feat(31-21): two DERIVED axes with two-sided counts, a route-bound workflow sentence, and D-24
agent-factory/workflows/16-context-read-write.md
   a38be64 fix(31-23): the bound bounds ASCENT, not inspection — home answers only as a repository (CR-13, D-26)
```

And `git diff --name-status 49dfa26..HEAD -- docs/audit/29-style-dispositions/` is **empty**: the
round wrote **no** disposition file, where round 4 wrote four (`31-16.md` … `31-19.md`).

**This is a finding this closing measurement raises, and it is NOT fixed here.** Writing rows for
another plan's clauses would put a `before`/`after` and a reason in the register that this plan did
not make and cannot vouch for — the standing argument the `31-09`, `31-14`, `31-19` and `31-20`
entries in `deferred-items.md` all give. The gate was red before the round and is red after it; what
moved is the count and the ownership. **Remedy, unchanged: one disposition file per owning plan
(`31-21.md`, `31-22.md`, `31-23.md`, plus the standing `31-05.md`, `31-06.md`, `31-08.md`,
`31-15.md`). Do NOT move `00-base.md`'s recorded base commit forward and do NOT narrow the watched
corpus** — the gate's own message names both as clearing a finding by deleting its evidence. The
entry is carried into `deferred-items.md` with those owners and that criterion.

### 6.4 The frozen floors, RE-MEASURED rather than assumed

| Floor | Frozen value | Measured now | Equal? |
|---|---|---|---|
| the byte-frozen deploy guard | `FROZEN_GUARD_BLOB` = `669725bc1c616ab57123e22090d93d57eff1b001` (`scripts/floor-invariance.test.ts:245`) | `git hash-object hooks/guard.ts` → `669725bc1c616ab57123e22090d93d57eff1b001` | **yes** |
| `admit()`'s frozen span | `ADMIT_FROZEN_SHA256` = `08df9e5c15754f8b3f3bde417475652d3d3861c50fd5458704b29651b83709e9` | byte-identical at the round base and at HEAD | **yes — not re-based** |

`hooks/guard.ts` was not touched by this round and `FROZEN_GUARD_BLOB` was not re-based. The
constant is at line **245**, the same line the round-4 record measured.

**The WHOLE decider manifest was walked, not only the entries this round moved.** A stale entry
elsewhere is the same drift class, so the check is over the manifest as a whole — and the harness
asserts **its own premise first**, because a walk that matches zero entries also reports
`0 mismatches`:

```
premise: region found; 26 parsed entries == 26 64-hex literals in the region -> true
deciders in DECIDER_MANIFEST:                  2  (hooks/admission-guard.js, hooks/guard.js)
ENTRIES CHECKED (the WHOLE manifest):          26
distinct module files named:                   14
MISMATCHES:                                    0
```

Every one of the 26 entries was compared against the current `sha256` of the file it names:

| # | file | manifest digest | digest now | match |
|---|---|---|---|---|
| 1 | `hooks/admission-guard.js` | `461ea83556564d30…` | `461ea83556564d30…` | yes |
| 2 | `scripts/audit-model.js` | `c8998eb024bcb43c…` | `c8998eb024bcb43c…` | yes |
| 3 | `scripts/audit-prepass.js` | `4a6906e19cfdc885…` | `4a6906e19cfdc885…` | yes |
| 4 | `scripts/check-diff-disposition.js` | `ca642d36df6aef18…` | `ca642d36df6aef18…` | yes |
| 5 | `scripts/checkpoints.js` | `2107434e318ad4ea…` | `2107434e318ad4ea…` | yes |
| 6 | `scripts/context-io.js` | `64ceee727021d903…` | `64ceee727021d903…` | yes |
| 7 | `scripts/dead-vocabulary.js` | `f815b1d656248848…` | `f815b1d656248848…` | yes |
| 8 | `scripts/frontmatter.js` | `6d49e535272b4574…` | `6d49e535272b4574…` | yes |
| 9 | `scripts/generate-safety-surface.js` | `ba7bdf982d67dc30…` | `ba7bdf982d67dc30…` | yes |
| 10 | `scripts/is-entry.js` | `4bea950408906acf…` | `4bea950408906acf…` | yes |
| 11 | `scripts/kit-model.js` | `ce2a012ffe2dda2f…` | `ce2a012ffe2dda2f…` | yes |
| 12 | `scripts/vacuity.js` | `eba304f76da86867…` | `eba304f76da86867…` | yes |
| 13 | `scripts/voice-model.js` | `3a16c8761245eee5…` | `3a16c8761245eee5…` | yes |
| 14 | `hooks/guard.js` | `13028ffa0ea821ad…` | `13028ffa0ea821ad…` | yes |
| 15–26 | the same twelve shared modules under the `hooks/guard.js` decider | — | — | **all yes** |

**26 entries checked. 0 mismatches.** Exactly **one** distinct entry moved across the whole round —
`scripts/context-io.js`, in three steps, each with its artifact (§4.4). Every other entry is
byte-identical to its round-base value, measured by set-difference over the two manifest regions
(`base_unique = 14`, `head_unique = 14`, one differing line).

### 6.5 The exported register cardinalities, measured on this tree

| Register | Cardinality | Members / moved this round |
|---|---|---|
| `TRUSTED_ROOT_RESIDUALS` | **11** (8 → 11) | `R-31-15-01..04`, `R-31-19-01..07`; `R-31-19-05/06/07` added by `31-23` |
| `TRUSTED_ROOT_STOP_CONDITIONS` | **7** (6 → 7) | `S-HOME-ABOVE`, `S-HOME-SELF`, `S-HOME-UNKNOWN`, `S-BOUNDARY`, `S-BOUNDARY-WINS`, `S-ROOT`, `S-STEPS`; `S-HOME` is **gone**, split by `31-23` |
| `PROMOTE_ADMITTED_RESIDUALS` | **6** (3 → 6) | `T-31-14-03`, `T-31-18-01` (rewritten), `R-37`, plus `R-31-22-01/02/03` |
| `PROMOTE_ADMITTED_DECLINES` | **10** (9 → 10) | `unreadable-audit-ledger` added by `31-21` |
| `REPO_BOUNDARY_MARKERS` | **9** | unmoved |
| `GOVERNANCE_CONFIG_CANDIDATE_KINDS` | **2** | new this round (`31-23`) |
| `MODULE_OWN_CONFIG_POSITIONS` | **2** | new this round (`31-23`) |
| `UNRESOLVABLE_CALLEE_RESIDUALS` | **9** (9 → 9) | one member REWRITTEN by `31-24`; none added, none removed |
| `PATHOLOGICAL_INPUT_SHAPES` | **6** | new this round (`31-25`) |
| `MEASUREMENT_BRANCH_STREAMS` | **4** | new this round (`31-25`) |

Every cardinality above was read from the **committed `.js`** by importing it from a non-entry
module, not counted by eye.

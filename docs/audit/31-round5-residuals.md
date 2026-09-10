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

---

## 7. The disposition ledger — one row per finding, per anti-pattern row, per `missing:` bullet

**A row whose disposition is `closed` MUST cite a measurement taken in this session.** A row with no
measurement says `UNKNOWN - verify` in its own disposition cell.

### 7.1 Block A — the eleven numbered findings of `31-REVIEW.md`

| # | Finding | Owner | Disposition | The measurement that proves it |
|---|---|---|---|---|
| A1 | **CR-12** — an unguarded `readFileSync` at the module's single note-write chokepoint hangs every writer on a FIFO | `31-21` | **closed** | §2.1 rows 6–8: the note-path FIFO refuses by name in **43 ms** at exit 0 (was exit 124 / 0 bytes); the ledger-path FIFO declines `unreadable-audit-ledger` in **59 ms** with the destination **empty** (was exit 124 with the note already written). Plus §6.5: `readFileSync(` occurs **0** times outside comments in `scripts/context-io.ts`. |
| A2 | **CR-13** — the home stop is asked before `dir` is inspected, so a repository rooted at `$HOME` never reads its own dial | `31-23` | **closed** | §2.1 row 9: `trustedRepoRoot()` answers the planted home repository, `source: ok`, dial `high-severity`, and the self-stamped finding is REFUSED (was the KIT / `off` / WROTE). CONTROL unmoved. Plus §6.5: `isAtOrAboveHome` occurs **0** times outside comments; `TRUSTED_ROOT_STOP_CONDITIONS` is 7 with `S-HOME` gone. |
| A3 | **CR-14** — the declared-names census is file-scoped, so one dead declaration disables the whole rename/namespace/fixture ban family | `31-24` | **closed** | §2.2 rows 4, 6, 7: all three spellings the review measured at `0 findings`/EXIT=0 — the renamed import with a dead inner `const it`, the namespace import with a dead inner `const pw`, and the index-0 helper parameter — now report `1 finding(s)`/EXIT=1, and all three controls are unmoved. |
| A4 | **CR-15** — `ts.createSourceFile` sits outside the could-not-run boundary; 1,000 nested parens crash uncaught with empty stdout | `31-25` | **closed** | §2.2 rows 10–11: depth 1000 moves EXIT=1/stdout-empty/no-measurement → **EXIT=2** with the named could-not-run reason AND the vacuity floor on stderr, **0** escaping stack frames; the 630/631 adjacency and depths 500/2000/5000 all reproduce the decided answers. |
| A5 | **CR-16** — `originIsTrusted`'s second arm trusts any directory under the repository root | `31-22` | **closed** | §2.1 row 1: the ordinary in-repository directory (`endsWith('.grugops/context') === false`) now declines `origin-outside-trusted-store` with `destNotes: []` and `ledgerDelta: 0` (was `promotedId` returned, `threw: null`, the file written). §9.2's per-dial table shows the same clause at **all four** dial values. |
| A6 | **WR-22** — note write and ledger append are non-atomic, in the wrong order, with a fail-open ledger read | `31-21` | **closed** | §2.1 row 8: with a FIFO at the ledger path the promotion writes **nothing** (`DEST-BEFORE []` → `DEST-AFTER []`) and declines by name; the pre-fix behaviour left the note written and the ledger empty. §6.5: `PROMOTE_ADMITTED_DECLINES` 9 → **10** with `unreadable-audit-ledger`. The corrected trace paragraph is quoted in `18-context-compaction.md` and names both routes. |
| A7 | **WR-23** — WR-20's false refusal survives when the shadowing binding is a function's second parameter | `31-24` | **closed** | §2.2 row 9: the review's own helper spec, verbatim, now reports `0 findings over 1/1`, **EXIT=0**, stderr 0 bytes — where it reported `1 finding(s)` naming `test.skip`, a construct absent from the file. |
| A8 | **WR-24** — `shadowed-rename.uat.spec.ts` can only fail for the false-positive half | `31-24` | **closed** | Measured on disk this session: the fixture carries a `MUTATE-REMOVE-START` / `MUTATE-REMOVE-END` region (lines 46 and 52), so the union is asserted in both directions; the three cases that drive it are green inside G1. |
| A9 | **WR-25** — the dial clause is evaluated before the operand clause, so an origin fault is reported as a dial problem | `31-22` | **closed** | §9.2's per-dial table, driven in this session: a forged origin names `origin-outside-trusted-store` at **every** dial value including `off` and `absent`, and a legitimate anchored origin still names `human-stamp-not-gated-at-destination` at `off`/`absent` — so the operand clause moved ahead without weakening the dial clause. §4.1 records the consequence for verification row 5. |
| A10 | **IN-12** — `stripRoutingLinks` computed three times on one input | `31-24` | **closed** | Measured per function this session: `isBannedModifierPath` computes it **once** into `normalised` (`:398`); `isBannedModifierCall` computes it **once** into `normalised` (`:439`); the only other call is `findBannedConstructs`'s per-chain dedup key (`:1920`), a different consumer that decides no membership. Four occurrences in the file, **one per arm**. |
| A11 | **IN-13** — two load-bearing `UNKNOWN - verify` items in `docs/audit/31-round4-residuals.md` | `31-26` (this plan) | **closed — both items resolved BY NAME** | §9. §4.3 is answered from `31-23` PROBE 6's three-spelling measurement plus verification rows 8 and 9; §4.4 is answered from a per-dial clause table **driven in this session**. `31-18-SUMMARY.md` is byte-unchanged (`git diff --stat 49dfa26..HEAD` empty; **0** commits touch it). IN-13's own `UNKNOWN - verify` about `WORKFLOW_STOP_BULLET_COUNT` and `NON_TEST_MODULE_COUNT` is **carried, not closed** — see §9.3. |

**11 findings. 11 rows. 10 closed by measurement, 1 (A11) closed by resolving two items with one
carried sub-item named in §9.3.** No row asserts a closure this round did not measure.

### 7.2 Block B — the seven anti-pattern rows of `31-VERIFICATION.md`

| # | File / site | Disposition | Measurement |
|---|---|---|---|
| B1 | `scripts/context-io.ts` `originIsTrusted` — second arm accepts any directory under `trustedRepoRoot()` | **closed** | A5. The arm is DELETED; the surviving rule is a conjunction and `originIsTrusted`'s body is one `return`, asserted by a parse. |
| B2 | `scripts/context-io.ts` `writeNoteFile` — unguarded `readFileSync` at the chokepoint | **closed** | A1. `readFileSync(` is absent from the module (0 occurrences outside comments) and from its `node:fs` import list. |
| B3 | `scripts/context-io.ts` `projectRootFromWorkingDirectory` — `isAtOrAboveHome` asked before inspection | **closed** | A2. `isAtOrAboveHome` is deleted (0 occurrences outside comments); the split pair `isAboveHome`/`isHomeItself` and the 7-member stop set are on the tree. |
| B4 | `scripts/runnable-ref/uat-spec-integrity.ts` `deriveDeclaredNames` + the canonicaliser guard — file-scoped suppression | **closed** | A3. |
| B5 | `scripts/runnable-ref/uat-spec-integrity.ts` `ts.createSourceFile` outside the `try` | **closed** | A4. |
| B6 | `agent-factory/workflows/18-context-compaction.md:75` — asserts the copy-in workaround is "mechanically refused" | **closed, with the claim KEPT and its bar disclosed** | Read from disk this session: `:75` still says "Never copy the origin notes into a directory to make the promotion pass … the constraint refuses it", and now adds "Know what the constraint does not refuse, and at what cost … The cost is three filesystem operations inside this repository, and two outside every repository." §2.1 row 1 measures the claim TRUE for the ordinary-directory case. The residual `T-31-18-01` names the constructed-governance-root case (§10). |
| B7 | `agent-factory/checklists/browser-uat-recipe.md:~309-315` — asserts the checker "does not exit through an uncaught exception, including a pathological one" | **closed** | Measured this session: `grep -c 'including a pathological one'` → **0**, and no line matches `does not exit through an uncaught exception`. The replacement paragraph names the two boundaries and discloses the non-unwinding fault as the residual. |

### 7.3 Block C — the six `missing:` bullets of `31-VERIFICATION.md`

| # | Bullet (abridged) | Disposition | Measurement |
|---|---|---|---|
| C1 | Narrow `originIsTrusted`'s second arm to the shape arm 1 recognises, **or** rewrite the decline sentence and give the workaround its own residual | **closed — BOTH halves done, not one** | The arm is deleted AND a conjunct added (A5); the two agent-facing sentences at `:56` and `:75` are rewritten (B6); and `T-31-18-01` is rewritten with the cost priced per position (§10). |
| C2 | Read `writeNoteFile`'s destination through the same non-blocking primitive `readGovernanceConfigCandidate` implements | **closed** | A1 — one authority (`readRegularFileOrNull`) with five derived call sites, plus a second authority for the append. |
| C3 | Make the home stop asymmetric, and record the choice as a decision beside D-23 with a new residual member | **closed** | A2 plus: `D-26` is present in `31-CONTEXT.md` (12 gap-closure decisions, `D-17`…`D-28`, measured by `grep -c`), and `TRUSTED_ROOT_RESIDUALS` gained `R-31-19-05`, `R-31-19-06` and `R-31-19-07` (8 → 11). |
| C4 | Narrow the declared-names suppression to a containment test | **closed** | A3 — and `31-24` measured that plain containment alone was **not** sufficient (the module-scope `const testInfo` spelling), so the fixture position is recorded as a non-suppressing binding. |
| C5 | Move the could-not-run boundary to wrap the parse, and wrap `main`'s body in one outer `try` returning 2 | **closed** | A4 plus `PROCESS_BOUNDARY_MARKER` present in the committed `.js` (`"UAT spec integrity: the runnable could not complete"`). |
| C6 | Record both fixes as dated decisions beside D-20/D-21, add a `MUTATE-REMOVE` corpus case for each, and correct the recipe paragraph's absolute claim | **closed** | `D-27` and `D-28` present (§C3's `grep -c` → 12); the union fixture's `MUTATE-REMOVE` region (A8); `PATHOLOGICAL_INPUT_SHAPES` is a published 6-member set with the depth-1000 shape in it; the recipe's absolute is gone (B7). |

---

## 8. The ledger's own totals, stated as an equality

**A ledger whose totals do not match the source documents' is SHORT, and being short silently is the
class this phase keeps paying for.** So the totals are derived and stated rather than implied.

| Source denominator | Declared / derived by | Value | Ledger block | Rows | Agree? |
|---|---|---|---|---|---|
| `31-REVIEW.md` numbered findings | its frontmatter (`critical: 5, warning: 4, info: 2, total: 11`) **and** `grep -cE '^### (CR\|WR\|IN)-[0-9]+:'` | **11** and **11** | §7.1 | **11** | **yes — the declared and the derived counts agree, and the ledger equals both** |
| `31-VERIFICATION.md` "Anti-Patterns Found" rows | measured: `awk` over the table | **7** | §7.2 | **7** | **yes** |
| `31-VERIFICATION.md` `missing:` bullets across both gap entries | measured: `awk` over the two `missing:` lists | **6** | §7.3 | **6** | **yes** |
| `31-VERIFICATION.md` "Behavioral Spot-Checks" rows | measured: `awk` over the table | **16** | §2 | **16 driven, 0 not-driven** | **yes** |
| **total dispositioned items** | | **24** source items | | **24** rows | **yes — no item without a row** |

**Disposition mix, counted:** **23 closed** · **1 closed with one named sub-item carried**
(A11 / IN-13's own `UNKNOWN - verify`, §9.3) · **0 partially closed** · **0 carried without a row**.

**Every `closed` row cites a measurement taken in this session.** The one row that carries something
says `UNKNOWN - verify` in the item it carries, by name.

---

## 9. IN-13's two items, RESOLVED BY NAME

`31-REVIEW.md` IN-13 names three sections of `docs/audit/31-round4-residuals.md` and states that two
of its `UNKNOWN - verify` items are **load-bearing for the review**. Both are answered here. Neither
is absorbed, and `31-18-SUMMARY.md` is **not** rewritten.

### 9.1 §4.3 — which spelling the round-4 verifier ran for WR-21

**The round-4 record printed both readings and chose neither.** ORIGINAL = a planted ancestor merely
*named* `home`, the real `HOME` untouched. ADJUSTED = `HOME` overridden so the planted ancestor **is**
`os.homedir()`.

`31-23` PROBE 6 drove **three** cells, not two, and that third cell is what settles it:

| reading | driven input | post-fix answer |
|---|---|---|
| **ADJUSTED** | planted ancestor carrying ONLY a configuration; `HOME` overridden so it IS `os.homedir()` | root `<kit>`, dial `ok/off` — **WR-21 is not reopened** |
| **ORIGINAL, driven INSIDE this checkout** | planted ancestor merely NAMED `home`, real `HOME` untouched, tree under `.temp/` | **the enclosing repository** — `S-BOUNDARY-WINS` fires first, so this reading **cannot reproduce WR-21 from inside a repository at all** |
| **ORIGINAL, driven OUTSIDE every repository** | the same shape in an `mkdtemp` tree | the planted ancestor, dial `high-severity` — `R-31-19-01`'s documented below-home behaviour |

**The settled reading: round 4 measured the ADJUSTED spelling.** `31-REVIEW.md`'s WR-21 transcript
shows a path under a Claude scratchpad, and the round-4 document reasoned that such a path "is not
under the real home directory" and therefore read literally as the ORIGINAL. The measurement
disproves that inference: the ORIGINAL spelling, driven from inside a repository — which is where
every round-4 probe ran — resolves to the *enclosing checkout*, not to the planted ancestor, so it
could not have produced the transcript round 4 recorded. Only the ADJUSTED spelling produces it.

**What remains, by name: `R-31-19-01`** — "a configuration at an ancestor BELOW the user's home
directory, with no repository marker between it and the working directory, governs any process whose
working directory is under it." It is a **live, documented residual with an owner** (`D-23`,
extended by `D-26`), it is re-measured UNMOVED in §2.1's control row, and closing it would revert
`WR-15`'s own green control. **The `UNKNOWN - verify` on WHICH SPELLING is closed. The residual it
sat beside is not, and is not claimed to be.**

### 9.2 §4.4 — the clause-name disagreement with `31-18-SUMMARY.md`'s recorded post-fix table

The round-4 document printed both figures and chose neither:

| Source | `off` row | `absent` row |
|---|---|---|
| `31-18-SUMMARY.md`, "WR-17 — the post-fix per-dial table" | `origin-outside-trusted-store` | `origin-outside-trusted-store` |
| `docs/audit/31-round4-residuals.md`, re-measured at `263d1a3` | `human-stamp-not-gated-at-destination` | `human-stamp-not-gated-at-destination` |

**The per-dial table, DRIVEN IN THIS SESSION against the committed `.js` at `78bdb27`**, with both
operands varied so the two clauses are separable rather than confounded:

| dial | FORGED in-repository origin | LEGITIMATE anchored origin |
|---|---|---|
| `off` | `origin-outside-trusted-store` | `human-stamp-not-gated-at-destination` |
| absent | `origin-outside-trusted-store` | `human-stamp-not-gated-at-destination` |
| `high-severity` | `origin-outside-trusted-store` | **PROMOTED** |
| `all` | `origin-outside-trusted-store` | **PROMOTED** |

**The answer, stated.** The two records were both true, of two different trees, and the round-4
document's re-measurement is **vindicated**:

- **Pre-fix**, at `263d1a3`, the dial clause ran first, so a forged origin under a non-gating dial
  was told the *destination's dial* was the problem. That is exactly what the round-4 document
  measured, and it is `WR-25` — the finding `31-REVIEW.md` filed against precisely those two rows,
  **citing §4.4 by name as its own corroboration**.
- **Post-fix**, at `78bdb27`, `31-22` moved one guard: the operand clause now precedes the dial
  clause. The forged-origin column reads `origin-outside-trusted-store` at every dial — which is what
  `31-18-SUMMARY.md`'s table said, arriving one round later by a different route.
- The `high-severity` and `all` rows additionally show `CR-16`'s own closure in the same run: those
  two cells were **PROMOTED** pre-fix (that IS CR-16) and are refused now.
- **The dial clause is not weakened.** The right-hand column proves it: with a legitimate anchored
  origin, `off` and `absent` still name `human-stamp-not-gated-at-destination`.

**`31-18-SUMMARY.md` is byte-unchanged and is not rewritten.** Proof, recorded:

```
$ git diff --stat 49dfa26..HEAD -- .../31-18-SUMMARY.md    (empty)
$ git log --oneline 49dfa26..HEAD -- .../31-18-SUMMARY.md | wc -l
0
```

`31-22-SUMMARY.md` states the same posture in its own words ("`31-18-SUMMARY.md` was NOT modified. A
prior round's record is history and is never rewritten"). **The reconciliation lives here, in this
round's own record, and it is a temporal disagreement rather than a factual one.**

### 9.3 IN-13's own `UNKNOWN - verify` — CARRIED BY NAME, not closed

IN-13 records one `UNKNOWN - verify` of its own: the reviewer did not independently re-derive
`WORKFLOW_STOP_BULLET_COUNT` 39→42 or `NON_TEST_MODULE_COUNT` 72→74.

**This round did not re-derive them either, and says so rather than inheriting the green.** Both are
asserted two-sidedly inside the green suite (G1), and `31-21` re-derived the stop-bullet count as
**42, unmoved**, while `31-22` records **74** tracked non-test sources for its PROBE 1 derivation.
Those are the *fix plans'* figures, taken by the same instrument the reviewer declined to re-run.

**Disposition: `UNKNOWN - verify`, carried by name into §10's register.** What would close it: an
independent re-derivation of both counts by a walk this document builds, rather than by the walk the
assertion itself uses.

### 9.4 §6.2 — the eighth-instance count, which IN-13 also names, is itself unreconciled

`docs/audit/31-round4-residuals.md` §6.2 calls its false-pass "the eighth logged instance in this
phase of a verification harness producing a false result about its own premise." IN-13 names §6.2 as
the correct instinct applied to the right target.

**Measured across this round's own summaries, the running count has collided.**
`31-22-SUMMARY.md` calls its ORDER-mirror correction "the **ninth** logged instance";
`31-25-SUMMARY.md` calls its PROBE 2(b) correction "the **ninth** logged instance". Two plans of the
same round both claimed number nine, and `31-21`, `31-23` and `31-24` each recorded further
instances without numbering them.

**Recorded as a finding about the phase's own bookkeeping rather than repaired by assigning
numbers this document cannot justify.** This document's own instance (§1.3, the top-level dial key)
is therefore stated as **"at least the tenth"**, and the sixth round should treat the running count
as an unreconciled tally, not as an index. What would close it: one derived list of the instances,
in one place, with the numbering read off that list rather than typed into each summary.

---

## 10. The round's residual register — every boundary round 5's five plans decided to leave open

**What this section is.** A residual is a boundary a plan looked at, decided about, and left open on
purpose. The enforceable copies live in the code's own exported registers, where the suite binds them
in both directions. **They are collected here so a reader has the whole set in one place.**

### 10.1 The governance root — `TRUSTED_ROOT_RESIDUALS`, 11 members (8 pre-existing, 3 added by `31-23`)

| Id | Shape | Why it is left open | Owner | What would force it closed |
|---|---|---|---|---|
| `R-31-15-01` … `R-31-15-04` | the four pre-existing members (cwd-controlling process; unconfigured host resolves to the kit; ambient project-directory variables; a configuration above a nested repository) | unchanged this round; each is re-stated in `docs/audit/31-round4-residuals.md` §9.2 | `D-15`, refined by `D-23` (5) | unchanged |
| `R-31-19-01` | A configuration at an ancestor **below** the user's home directory, with no repository marker between it and the working directory, governs any process whose working directory is under it. | Refusing it would revert `WR-15`'s own green control. §9.1's `UNKNOWN - verify` about which spelling round 4 probed is now **closed**; the residual itself is **live** and re-measured UNMOVED in §2.1. | `D-23`, extended by `D-26` | a decision about which of `WR-15` and the review's `Fix:` sentence the project wants — **the sixth verification round's call, not a plan's** |
| `R-31-19-02` / `R-31-19-03` / `R-31-19-04` | ambient `HOME`; degenerate directory identities; an unrecognised VCS marker | unchanged this round | `D-23` (1)(2)(3) | unchanged |
| **`R-31-19-05`** | A repository whose root IS the home directory and which carries its own governance configuration but **no** version-control boundary marker is not adopted, and its dial is replaced by the kit's shipped lean default. | The marker conjunct is what keeps `WR-21`'s `~/.grugops`-alone hole closed. Dropping it re-opens `WR-21`; keeping it costs this shape. | `D-26` | a boundary signal for a home-rooted repository that a caller cannot create in one operation |
| **`R-31-19-06`** | Home's adoption rests on two ordinary filesystem artifacts, so a process that can write under `$HOME` can MAKE home adoptable in **three** operations against a bare home, or **one** against a home already carrying a dotfiles checkout. The converse is a one-operation gate LOWERING that predates this plan. | Priced by CONSTRUCTION rather than described: both counts are performed and asserted as numbers by driven cases. A refusal at home lands on the kit's LEAN default, so refusing more is not automatically safer. | `D-26` (4) | a signal a process writing under `$HOME` cannot forge |
| **`R-31-19-07`** | The module-own-position exclusion compares lexically resolved path SPELLINGS, so one directory addressed by two strings defeats it. | **OCCUPIED on the CASE axis** and **HOLDING on the SYMLINK axis**, both measured by `31-23` PROBE 2(f). Price: **one** operation — address the decider through a case-differing path. A `dev:ino` comparison is refused (a `statSync` under `$HOME` one symlink can make agree); case-folding is refused for the converse reason (it would exclude MORE, and an added refusal at home lands on the lean fallback). | `D-26` (3) | a directory-identity source a caller under `$HOME` cannot influence |

### 10.2 The admission / re-binding route — `PROMOTE_ADMITTED_RESIDUALS`, 6 members (3 pre-existing, 3 added by `31-22`)

| Id | Shape | Why it is left open | Owner | What would force it closed |
|---|---|---|---|---|
| `T-31-14-03` | A note HAND-WRITTEN into the origin `notes/` directory and then promoted is not detected. | unchanged; the origin store is trusted exactly as far as every other reader trusts it | `D-19` | a signed note format |
| **`T-31-18-01`** (REWRITTEN by `31-22`) | The origin store is recognised by SHAPE **conjoined with** ROOT ANCHORING, never by a registry — so a caller that constructs a whole GOVERNANCE ROOT around notes it authored still presents a store this route accepts. | The price is stated **PER POSITION** because it was measured rather than assumed: **three** filesystem operations inside a repository (all three proven load-bearing by subtraction) and **two** outside every repository. The second number is a correction of this round's own plan text (`31-22` deviation 1). | `D-25` | a store marker the sanctioned writer emits and this route verifies, or a registry a caller cannot author |
| **`R-31-22-01`** | The anchoring conjunct asks this module's own root walk, which answers `nearest` at a repository boundary carrying NO governance configuration — so a checkout with a `.grugops/context` store and no `factory.config.json` is refused as an ORIGIN, where the deleted arm accepted it by shape. | A capability the narrowing REMOVES, named because `31-22`'s own prohibition required it. Bounded by measurement: `install.js` seeds `.grugops/factory.config.json` into every target it touches, so this reaches only a store created by the minimal markdown-copy path. | `D-25` | anchoring on a boundary marker alone — **refused**, because it would drop the forged-origin price to two operations |
| **`R-31-22-02`** | The DESTINATION argument `to` is caller-supplied and is NOT constrained by the canonical form. | Decided rather than left silent: `to` is not a proof OPERAND — nothing read at the destination is evidence FOR the promotion. Driven as `31-22` PROBE 2 across five destination shapes. | `D-25` | a decision that the destination is also an operand |
| **`R-31-22-03`** | The recognition rule is LEXICAL and CASE-SENSITIVE. `resolve()` normalises `.`/`..`/trailing separators but does not follow symlinks, so a symlink at a correctly-shaped, anchored location whose realpath is an ordinary directory is ACCEPTED. | Not a new capability: planting that link needs write access to a real governance root's own `.grugops/`, which is `T-31-14-03` one indirection over. The case-differing spelling is refused by name, which is the safe direction. | `D-25` | comparing `realpathSync` rather than `resolve` — a module-wide decision about every context root |
| `R-37` | The compared field set is the store's own read-back projection plus the body. | unchanged | `D-19` | widening the projection |

### 10.3 The UAT-spec modifier ban — `UNRESOLVABLE_CALLEE_RESIDUALS`, 9 members (one REWRITTEN by `31-24`)

The nine members are unchanged in count from round 4 (`RR-01` … `RR-09` in
`docs/audit/31-round4-residuals.md` §9.1) with **one rewritten**: the former file-scope member
(`RR-02`) now states the **NEAREST-BINDING** rule, and `31-24` asserts by test that it "no longer
claims file scope". The residual's remaining clause — a **module-scope** declaration with no inner
binding nearer still reaches the whole file — is measured with a bound `31-24` recorded rather than
registered: a module-scope declaration of a name the file also IMPORTS is illegal TypeScript
(`error TS2440`), so the rename and namespace families cannot be evaded that way in a spec that
type-checks. **The fixture-parameter family has no such collision**, which is why the module-scope
`const testInfo` spelling was the one that survived a plain containment rule.

### 10.4 The exit-code contract — `31-25`'s residuals, published as prose and as two frozen sets

| Shape | Why it is left open | Owner | What would force it closed |
|---|---|---|---|
| **A fault that terminates the process without unwinding** — an out-of-memory kill, or a signal. | No `try` catches those, and the checker claims nothing about them. Disclosed in the recipe paragraph verbatim rather than left as an absolute. | `D-28` | a supervisor outside the process |
| **The Windows leg of the two-boundary behaviour** | `UNKNOWN - verify` per the standing `WINDOWS.md` posture; not testable on darwin. Every probe in this document ran on darwin only. | `D-28` | `R-03` (§12) |
| **The de-recursed directory walk covers the CLASS without closing a reachable input on this platform** | Measured, not assumed: `mkdir` stops at **476** levels (`ENAMETOOLONG` at a 1015-byte path) while a like-for-like self-recursive frame overflows at **~8,075**. `31-25` records GREEN 4 as a control with its residual stated, not as a closure. | `D-28` | a platform whose path limit exceeds its stack limit |
| **`reportMeasured`'s branch/stream design was deliberately NOT changed** | An earlier draft of `31-25` required a `visited/expected` line on STDOUT for every could-not-run shape. That is unsatisfiable without moving a floor's output, so **the requirement was rewritten, not the mechanism**; `reportMeasured` is byte-unchanged (1535 bytes, `sha256 e44820eb8e15fcc4` at both revisions). | `D-28` (3) | a decision to move a floor's stream |

### 10.5 The `31-21` residuals — named in a DECISION, not in an exported register

`31-21` names four residuals — `R-31-21-01` (`atomicWrite`'s unaimable temp write), `R-31-21-02` (a
non-regular file inside `notes/` is skipped rather than refused loudly), `R-31-21-03` (the plan's own
`appendFileSync` premise, **measured false and closed**), `R-31-21-04` (both derivations are
syntactic).

**Measured this session, and recorded as an asymmetry rather than as a defect.** Unlike
`R-31-19-*` and `R-31-22-*`, these four are **not members of an exported register the suite binds
two-sidedly.** They live in `31-CONTEXT.md`'s D-24 block (lines 813, 819, 826, 841). In the source
tree `R-31-21-01` appears once, inside a test's message string
(`scripts/context-io-writer-set.test.ts:3440`), and `R-31-21-03` once, inside a source comment
(`scripts/context-io.ts:981`). `R-31-21-02` and `R-31-21-04` appear in neither.

**Why this matters to the sixth round.** The register's own contract, quoted from
`scripts/context-io.ts`, is that "adding a member without dispositioning it turns a test red rather
than shipping quietly." Four residuals held only in a planning document have no such test.
**Recorded, not fixed** — adding an exported register is a source change, and a closing measurement
plan that writes source has found a new defect, which belongs in a new plan with its own RED-first
reproduction.

### 10.6 Two further residuals this round leaves, measured in §5 and §6

| Shape | Owner | What would force it closed |
|---|---|---|
| **`.temp/` probe artifacts are invisible to the test runner's exclusion and can crash the suite.** Reproduced in-session (§5.3): a leftover `uat/*.uat.spec.ts` under `.temp/` was collected by vitest, two unrelated suite files reported failures, and the run died on SIGSEGV — while `git status --short .temp` stayed silent. | this round | excluding `.temp/` from the vitest include glob, or asserting the FIFO/probe-root sweep **before** every suite run |
| **`31-21-derive-probe.mjs` survived under `.temp/` outside its plan's declared probe root** (§5.2), because the plan's residue predicate asked about a directory and never about a sibling. | `31-21` | a residue predicate derived from what the plan WROTE rather than from where it intended to write |

---

## 11. The aggregated self-red-team probe index — what round 5 already probed

Each of the five fix plans ran the **six standing probes**. **5 × 6 = 30 probes, all run; "none" was
never the answer to a probe that was not run.** This index exists so the sixth round can see what has
already been asked before asking it again.

| Plan | P1 — how is the gate REACHED | P2 — derive BOTH axes | P3 — what is the input ASSEMBLED from | P4 — at which POSITIONS is it asked | P5 — every declined shape with a LEGITIMATE input | P6 — pre-existing destination / re-derived mutants |
|---|---|---|---|---|---|---|
| `31-21` | PASS — 14 call sites derived, driven pre and post, 14/14 OK both | PASS — 3 positions × 5 shapes, 15/15 cells, slowest 14 ms | PASS — 4 symlink shapes, each asserted to RESOLVE to what the row claims | **FAIL → FIXED** (`R-31-21-03`: `appendFileSync` blocks; the plan's own premise was false) | PASS — 10 clauses, 10 legitimate inputs, 0 false refusals | PASS — 4 write sites × 3 pre-existing shapes, no hang |
| `31-22` | PASS — caller cardinality 1, matching PART SIX-D | PASS — 5 destination shapes, all decided | **FAIL → FIXED** (`R-31-22-03`: the lexical/symlink row) | PASS — 9 positions enumerated, one asks the rule | PASS — 10 clauses, 10 legitimate inputs | PASS — CR-11's closure intact through the changed order |
| `31-23` | PASS — 6 consumers driven pre and post, 0 moved | PASS — six axes incl. a **48-cell** cross-product, exactly 2 verdicts partitioned by candidate POSITION | **FAIL → FIXED** (`namedHomeDirectory`'s claim outran its mechanism) | PASS — 3 positions reach a config without the walk; each an existing residual or the documented test seam | PASS — 5 cases, 1 MOVED (`31-22` CONTROL 5a, the declared cross-plan member) | PASS — both §4.3 readings driven |
| `31-24` | PASS — 8 legitimate specs pre and post, 0 false refusals introduced | PASS — 5 sub-axes (KINDS, exemption scope, ORDER, UNION, NESTING) | PASS — 6 shapes, the compared position is the call's own `getStart` in every one | **FAIL → FIXED** (arms (a)/(b) compared a RAW head; three spellings at exit 0) | PASS — 9 register members + a 9b clause, each matching its own sentence | PASS — 4 pre-existing mutants re-derived, none breaks fewer cases |
| `31-25` | **FAIL → FIXED** (the browser loud skip wrote around `main`'s output seam); 13 exit sites derived, 13 driven | PASS after a harness fix (a child-derived depth consumed in-process) | PASS after a harness fix (two hand-typed marker literals) | PASS — 1 self-recursion left, with a disposition | PASS — 6 of 6 corpus cases carry a premise assertion | PASS — 7 mutants re-derived, none breaks fewer cases |

**Probes run: 30. Probes that found a defect: 7** — `31-21` P4, `31-22` P3, `31-23` P3, `31-24` P4,
`31-25` P1, plus `31-21`'s Task-1 discoveries (`readRawNotes`' walk and the two CLI argv reads).
**Every one was fixed inside its own plan and re-probed.** Two of the seven — `31-24` P4's assertion
arms and `31-25` P1's output seam — are **production** fixes for defects **no review named**.

**The probe idiom that pays.** Across five plans the recurring winner is *drive the pre-fix tree as a
control*: `31-21` P1's first run recorded 3 refusals on BOTH trees and would otherwise have read as
"my fix broke a caller"; `31-24`'s mutation harness read a **stale artifact** as a passing mutant
until the rebuilt `.js` was grepped for the mutant's own marker; `31-25` re-derived every anchor
because `31-24` had moved the line numbers the plan cited.

---

## 12. What this round did NOT do

Stated plainly, because a closure round's silences are what the next round pays for.

1. **The four human-verification items remain OPEN.** `R-01` (the attended Chrome lane under real
   interactive auth), `R-02` (the `claude auth status --json` predicate under API-key and
   long-lived-token configurations), `R-03` (the Windows leg of every browser probe and of the whole
   spec-integrity runnable), `R-04` (the installer round-trip on a pre-existing host install). Each
   is carried forward with its `UNKNOWN - verify` marker intact and its carry-forward count updated
   in `31-VALIDATION.md`. **None is closed by inference, and none is dropped.** Every probe in this
   document ran on **darwin only**.
2. **The `check:diff-disposition` debt is MEASURED, UNCLOSED, and LARGER than it was** — 110
   findings over 39 elements, up from 75, with **35 of them owed by this round's own plans** and
   named owners for each (§6.3). Not fixed here, for the standing reason: writing rows for another
   plan's clauses puts a reason in the register this plan cannot vouch for.
3. **`WR-21`'s below-home shape is not closed** and is not claimed as closed — `R-31-19-01` (§10.1).
   The `UNKNOWN - verify` about which spelling round 4 probed **is** closed (§9.1); the residual it
   sat beside is not.
4. **IN-13's own `UNKNOWN - verify`** about `WORKFLOW_STOP_BULLET_COUNT` and `NON_TEST_MODULE_COUNT`
   is **carried by name**, not closed (§9.3).
5. **`R-31-19-07` is OCCUPIED on the CASE axis, not closed** — the running kit's own configuration
   can be adopted over a project nested inside it for the price of one case-differing path (§10.1).
6. **No source file was modified.** A closure plan that fixes something has found a new defect, and a
   new defect belongs in a new plan with its own RED-first reproduction. Asserted:
   `git status --porcelain -- scripts hooks agent-factory install` is empty at every commit of this
   plan. **The two findings this round DID raise — §6.3's grown debt and §10.5's unregistered
   `R-31-21-*` residuals — are therefore recorded with owners rather than repaired.**
7. **No requirement was flipped** — §13.

---

## 13. The requirement rows, confirmed UNCHANGED

**Only a verification round may flip a requirement. A gap-closure plan that flips one is certifying
itself.** `.planning/ROADMAP.md` says so in its own words, quoted verbatim from the gap-closure
blocks that govern this phase:

> UATX-01, UATX-05 and UATX-06 stay `[ ]` / Gaps Found throughout: only a verification round may
> flip them.

> **The phase stays `In Progress`: executing a gap-closure round is not verifying it, and a fifth
> verification round has not run.**

Confirmed by reading the files rather than by intent, and by a diff pinned to the round base:

```
$ git diff --stat 49dfa26..HEAD -- .planning/REQUIREMENTS.md      (empty)
$ git diff --stat 34f6989..HEAD -- .planning/REQUIREMENTS.md      (empty)   ← the plan's own range
$ git diff 49dfa26..HEAD -- .planning/ROADMAP.md | grep '^[-+].*Phase 31: Autonomous Manual Testing'
(no hunk touches the Phase 31 checkbox line)
```

`.planning/REQUIREMENTS.md`, lines 120–125 — all six still **unchecked**; lines 212–217 — all six
still **`Gaps Found`**; `.planning/ROADMAP.md` line 100 — Phase 31 still **unchecked**.

**`requirements.ready-ids` reports 6/6 ready**, because `31-26` is the last plan of this phase
declaring them and no sibling now blocks the flip. **The flip is withheld anyway**, on the governing
sentence above. `31-24-SUMMARY.md` records the same decision after its own tooling flipped two rows
and they were reverted by hand; this plan does not run `requirements.mark-complete` at all.

### 13.1 The `.planning/STATE.md` write, VERIFIED rather than assumed

This repository's state writer re-escapes backslashes on every write, and a pathological line there
has previously combined with a superlinear guard predicate to turn a sub-second gate into a
multi-minute one. So the write is measured afterwards rather than trusted:

| Check | Command | Result |
|---|---|---|
| longest line in `.planning/STATE.md` | `awk '{ if (length($0) > m) { m = length($0); n = NR } } END { print m, n }'` | **7995 characters, at line 18** — `prior_activity_desc`, a pre-existing field this plan did not touch. The `status:` field this plan rewrote is **3756** characters. Bound: 20000. **PASS.** |
| backslash runs | `grep -c '\\\\\\\\'` | **0** — no quadruple-backslash run anywhere in the file. The replacement text was asserted to contain no `"` and no `\` before it was written. |
| foundation guards AFTER the write | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, exit 0, **0.21 s** wall clock. Bound: 5 s. **PASS.** |
| UAT oracles AFTER the write | `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED`, exit 0, **0.10 s** wall clock. |

`.planning/STATE.md` names the next action as **a SIXTH verification round**, in both `status:` and
`stopped_at:`.

---

## 14. What the sixth verification round inherits

- **§2** — every round-5 reproduction paired, none re-derived from a fix plan's fixture: **16** of
  **16** spot-checks driven (5 moved, 11 unmoved), plus **5** review-only variants the verifier never
  ran, all 5 moved.
- **§3** — the four SATISFIED requirements re-measured by their own mechanisms rather than inherited.
- **§4** — four disagreements, both figures printed: the row-5 clause name, the index-0 line number,
  the row-12 byte/char count, and the manifest digest chain.
- **§5** — the measurement environment proven clean **by predicates that can observe it**, and the
  `git status`-based `.temp/` gate recorded as having been **inert in every previous round** — with
  the hazard **reproduced in-session**, a SIGSEGV run and a clean run at the same commit.
- **§6** — the one-commit gate record with the doctrine sentence beside it, the WHOLE 26-entry
  manifest re-measured, and the `check:diff-disposition` debt re-measured at **110** with the round's
  own **+35** attributed by name.
- **§7/§8** — **24** disposition rows against **24** source items, with the equality stated.
- **§9** — **IN-13's two items resolved by name**, its own sub-item carried by name, and the
  phase's collided harness-instance count recorded.
- **§10** — the residual register: **11** governance-root members, **6** admission-route members,
  **9** modifier-ban members, **4** exit-contract residuals, **4** `31-21` residuals that no exported
  register holds, and **2** this round's own measurements added. Each with a reason and a closing
  criterion.
- **§11** — **30** self-red-team probes indexed, **7** of which found a defect.
- **§12** — what was not done. **§13** — the requirement rows, left for the verifier.

**The one thing this round most wants read first: §5.3.** The `.temp/` contamination hazard is not a
theoretical risk carried forward from round 4 — it is reproduced here, with a contaminated run and a
clean run at the same commit, and the gate three rounds relied on to catch it was **silent the whole
time**. Any sixth-round figure taken without the FIFO sweep and the per-plan probe-root existence
tests is a figure taken with an instrument this document has now shown to be blind.

---

_Written: 2026-09-10 · Plan `31-26` · Measured at `78bdb27` (reproductions and gates), with every
"over the round" range pinned to the round base `49dfa26`_

# Gap-closure round 8 — the round-7 evidence re-measured against the finished tree

**Round:** 8 — the closing measurement for gap-closure **round 7** of Phase 31 (fix plans `31-32`,
`31-33`, `31-34`, `31-35`, `31-36`, `31-37`; this measurement plan `31-38`)
**Written:** 2026-09-11, by plan `31-38`
**Measured at:** commit `3baab0d` (`3baab0d3378bd09fb8302505e013e19af9fe53ec`), the round's final
commit before this plan's own, against the **committed `.js`** artifacts, with
`git status --porcelain -- scripts hooks agent-factory install docs .github vitest.config.ts package.json`
**empty** before the first probe and after the last.
**Round base:** `d484b9e` (`docs(31): mark gap-closure round 7 planned (31-32..31-38), unblock the
D-25 decision bullet`) — the commit before `31-32`'s first. Every "over the round" range below is
pinned to it. `git rev-list --count d484b9e..HEAD` = **38**.
**Platform:** darwin 25.5.0 arm64 · Node **v24.12.0**
**Evidence source:** `.planning/phases/31-autonomous-manual-testing/31-REVIEW.md` (the round-6
gap-closure code review, `issues_found`, 4 critical / 6 warning / 3 info, total 13) and
`.planning/phases/31-autonomous-manual-testing/31-VERIFICATION.md` (the SEVENTH verification pass,
`gaps_found`, 4/6, with one regression)
**Governing decisions:** `D-33` (`31-32`), `D-34` (`31-33`), `D-35` (`31-34`), `D-36` (`31-35`),
`D-37` (`31-36`), `D-38` (`31-37`) — all recorded in `31-CONTEXT.md`
**Predecessor record:** `docs/audit/31-round6-residuals.md`. This file follows its section shape
rather than inventing a new one. **A prior round's record is history and is never rewritten** —
where this round disagrees with one, **both values are printed and the disagreement is a row.**

## What this artifact is for

A verification round reads source and committed artifacts. It does not read a planning conversation,
and it should not have to re-derive a probe from a fix plan's own fixture. This file exists so the
**eighth** verification round can start from five things it would otherwise have to rediscover:

1. a table pairing **every** reproduction the round-7 documents recorded with its post-round result,
   re-run with **the original document's own spelling**;
2. a CONTROL table re-driving every round-6 closure at the same commit — including the **four of
   five** the round-7 verifier accepted from `31-REVIEW.md`'s measurement rather than driving;
3. a ledger row for **every** finding of `31-REVIEW.md`, every anti-pattern row and every `missing:`
   bullet of `31-VERIFICATION.md`, and the regression;
4. the review-to-corpus coverage equality `D-33` handed to this plan as a **one-shot**, asserted with
   both sides derived and its disagreement named;
5. a written register of the boundaries this round **decided to leave open**, with the reason and
   what would force each closed.

**The order of this document is deliberate.** The adversarial reproductions come FIRST (§2–§7) and
the suite comes afterwards (§8) as a floor. For **seven** consecutive verification rounds on this
phase the green suite exercised **none** of the defects that round found — and at the commit round 7
measured, the suite was not even green. A closure round that led with its suite figures would be
leading with the one number seven rounds have shown to be uninformative here.

---

## 1. The probe set, DERIVED from the source documents rather than from the fix plans

### 1.1 The derivation rule

A **reproduction block** is a place in `31-VERIFICATION.md` or `31-REVIEW.md` that records a probe
AND its measured outcome. Each count below was measured with a command rather than typed, and each
was asserted non-zero before anything was compared against it.

| # | Shape | Where | Count | Command that measured it |
|---|---|---|---|---|
| (a) | a row of the round-7 **Behavioral Spot-Checks** table | `31-VERIFICATION.md` | **12** | `awk '/^\| # \| Behavior/{f=1} f&&/^\| [0-9]+ \|/{c++} END{print c+0}'` |
| (b) | a numbered **finding heading** | `31-REVIEW.md` | **13** | `grep -acE '^### (CR\|WR\|IN)-[0-9]+:'` |
| (c) | an **anti-pattern** row | `31-VERIFICATION.md` | **7** | `awk '/^\| File \| Line \| Pattern/{f=1} f&&/^\| `/{c++} END{print c+0}'` |
| (d) | a `missing:` bullet across both gap entries | `31-VERIFICATION.md` | **6** | `awk` over the two `missing:` lists |
| (e) | a finding carrying its own fenced measurement | `31-REVIEW.md` | **6** | `grep -ac` over the round-6 phrase set |

The **(b)** count of 13 equals `31-REVIEW.md`'s own frontmatter (`critical: 4, warning: 6, info: 3,
total: 13`), derived and quoted rather than only quoted. §10 carries one disposition row per member
of (b), (c) and (d), plus the regression.

**The distinct probe denominator this session drove is 44**, composed as:

- **30** round-7 rows — the source-identity premise, `CR-22` at four positions plus its control,
  `CR-23` at four positions, `CR-24`, `CR-25` at seven positions, the suite, `WR-31` at two
  positions, `WR-32`, `WR-33`, `WR-34`, `WR-35` at two positions, `WR-36`, `IN-16`, `IN-17`, `IN-18`;
- **14** round-6 CONTROL rows — `CR-17` at four positions, `CR-18` at five, `CR-19` at two, `CR-20`,
  `CR-21` at two.

**44 derived. 44 driven. 5 named as NOT driven** — §4.1 states the two counts separately and
enumerates the second list.

### 1.2 What is excluded, by name, so the exclusion is not silent

- **`31-REVIEW.md`'s `## Skipped entries` block (line 433) is NOT a fourteenth finding.** The
  orchestrating brief for this round enumerated it as one. It is not: it is a `##` heading **inside a
  fenced code block** (fence opened at `:430`, closed at `:442`) — the verbatim `render()` transcript
  quoted inside `CR-24`'s own reproduction. Measured: stripping fenced regions before scanning for
  `^### (CR|WR|IN)-NN:` yields **13** headings, equal to the review's own frontmatter total, and the
  Skipped-entries block is not among them. It is dispositioned in §10 as **CR-24's own evidence**,
  not as a separate item, and the parse artifact is recorded here rather than carried forward. This
  is the same class as the decision-coverage gate's fence-stripping requirement.
- **`WR-32`'s untracked-candidate probe and its third-implementation spelling probe are NOT
  re-driven.** Both require writing a `.ts` file under `scripts/` — an untracked one for the first,
  a tracked-or-untracked third implementation for the second. **This plan writes no source**, so
  driving them here would break its own prohibition. The axis is measured structurally (§2.4) and
  through its own file (24 cases, `Test Files 1 passed`), and the posture is named rather than
  presented as an independent external reproduction — exactly the posture `docs/audit/31-round6-residuals.md`
  §1.2 took for `WR-27`.
- **`WR-36`'s shared candidate corpus is NOT re-driven end-to-end independently.** Driving it needs a
  mirrored kit and the corpus itself lives in `scripts/context-io.test.ts:11243`. The wrapper's five
  conditions and the reader's are read off the committed source and compared (§2.4); the end-to-end
  binding is the suite's.
- **`CR-22` position 4's live split is NOT reproducible from outside the module.** `DEFAULT_CONTEXT_ROOT`
  is not exported (measured: `Object.keys(context-io.js).includes("DEFAULT_CONTEXT_ROOT")` → `false`),
  and observing the split needs a shared-install layout (`~/.grugops` kit + a separate host repo).
  The position is `R-31-33-02`, published by `31-33` as a residual rather than claimed closed; what
  is measured here is `trustedRepoRoot()`'s answer on this tree. Recorded in §2.2 as not-driven with
  its reason.
- **The round-base RED suite reading is NOT re-run at `d484b9e`.** It is quoted from
  `31-VERIFICATION.md` row 7 as the **pre-round** result, which is this table's convention for every
  row: the pre-round figure is the source document's, the post-round figure is this session's. The
  regression's **mechanism** is separately measured gone at `MEASURED_AT` (§2.3).
- **The baseline figures** of the review's Summary paragraph (freshness, the guards, the suite counts,
  the frozen blob, the decider digests) are §8's business, not §2's.

### 1.3 The probe environment, and the one constraint this round moved

Every AST probe ran against the committed `scripts/runnable-ref/uat-spec-integrity.js` from a probe
repository under `.temp/31-38-probe/<name>/` **inside this repository** (so `createRequire` resolves
`typescript` from the repository's own `node_modules`), equipped exactly as `31-28`'s own
`equipTarget` equips one and as `docs/audit/31-round6-residuals.md` §1.3 records — a `tsconfig.json`
(`ES2022`/`ESNext`/`Bundler`/`strict`/`skipLibCheck`, `noEmit`, `include: ["**/*.ts"]`), a
`node_modules` symlink to this repository's, and `scripts/runnable-ref/fixtures/playwright-test.d.ts`
copied to `types/`.

**One thing in the equipment moved this round, and it is stated rather than assumed.** `31-34`
(D-35) added a SECOND ambient surface to `equipTarget`: `scripts/runnable-ref/fixtures/foreign-framework.d.ts`,
declaring `other-framework` and `other-assert`. Every probe root below carries it, because that is
what `equipTarget` now plants. **A reader who re-runs `31-REVIEW.md`'s CR-23 transcript against a
root equipped the round-6 way will not have the foreign modules declared and will measure a different
thing** — the review supplied its own ambient declaration for exactly this reason.

**Every AST probe row records its own `tsc --noEmit` exit code**, so no row rests on a construct the
language refuses to compile. Two rows below carry `tsc` exit 2 deliberately, and both say so.

Every `context-io` probe ran against the committed `scripts/context-io.js`, from roots created with
`mkdtemp` under the OS temp directory, each carrying `.git`, `.grugops/factory.config.json`
(`{ context: { human_admission: …, audit_retention: "retained" } }` — the module's own config shape)
and `.grugops/context`. **Each root was asserted `governanceRootOf(store) === root` before any result
was read**, and each assertion is printed in the row it belongs to.

**One harness premise failed on this session's first attempt and is logged rather than absorbed.**
The first `admitAndAppend` probe wrote its governance dial as `{ human_admission: "high-severity" }`
at the config root instead of `{ context: { human_admission: … } }`. Every dial value — `all`,
`high-severity`, `none` — then produced the identical `admission REFUSED (W3)` and **zero** files on
disk, which reads exactly like a closure and is not one. Caught by driving all three dial values and
noticing they could not be told apart. The probe was rebuilt against the config shape the module's
own test helper writes, and only then was any result read. Logged in §7.4.

The `hooks/hook-entry.js` probes ran against a scratch kit copied **outside the repository tree**
(session scratchpad, `mkdtemp`), invoked through the argv **derived from `hooks/hooks.json`** rather
than typed:

```
Bash             -> node "${CLAUDE_PLUGIN_ROOT}/hooks/hook-entry.js" guard.js
mcp__grugops__.* -> node "${CLAUDE_PLUGIN_ROOT}/hooks/hook-entry.js" admission-guard.js
```

---

## 2. The reproduction pairing table — every round-7 reproduction re-run with its own document's spelling

Legend: **MOVED** = the round-7 result changed in the direction the owning plan committed to.
**UNMOVED** = the round-7 result is reproduced unchanged, which for a previously-PASSING row is the
evidence that nothing broke. **AGREES / DISAGREES** compares this session's figure with the owning
plan's own SUMMARY claim.

### 2.0 The source-identity premise, re-checked

| Probe spelling | From | Round-7 result | This round | Verdict |
|---|---|---|---|---|
| `git diff --stat f2404aa..c830eb4`, unscoped and scoped to source | `31-VERIFICATION.md` row 1 | unscoped: only `31-REVIEW.md` (605 insertions / 552 deletions); scoped: **empty** | identical — unscoped `1 file changed, 605 insertions(+), 552 deletions(-)`; scoped to `scripts hooks agent-factory install .github vitest.config.ts package.json .planning/REQUIREMENTS.md .planning/ROADMAP.md`: **empty** | **UNMOVED** — the premise holds: no fix commit existed for CR-22..CR-25 at the commit round 7 measured |
| the round's own source diff, `d484b9e..HEAD` | this session | — | `24 files changed, 5521 insertions(+), 441 deletions(-)` over `scripts hooks agent-factory install .github vitest.config.ts package.json` | the round's whole source movement, pinned |
| `git diff --stat d484b9e..HEAD -- package.json package-lock.json` | this session (the supply-chain measurement `T-31-38-SC` asks for) | — | **empty** — no dependency moved over the round | **no package-manager install ran** |

### 2.1 CR-22 — the write path's one-root rule, at the function's entry

Three real governance roots (`ORIGIN`, `THIRD`, `DEST`), each asserted
`governanceRootOf(store) === root` → `true` before any result was read.

| Probe spelling | From | Round-7 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| **position 1** — `promoteAdmitted("T-1", id, <no human stamp>, from=ORIGIN, to=THIRD, repoRoot=DEST)` | `31-REVIEW.md` CR-22 / `31-VERIFICATION.md` row 3 | note into **THIRD**, GOV-02 event into **DEST** — two repositories | `-> 20260911T000000Z-qe-observation-74230409`; **THIRD notes 1, THIRD ledger 1; DEST notes 0, DEST ledger ABSENT** | **MOVED — CR-22 position 1 CLOSED.** The fall-through now reaches a write only through the entry-derived root | AGREES with `31-33` (D-34 (1)) |
| **position 2** — `promoteAdmitted` into an UNGOVERNED destination (`governanceRootOf(UNGOV)` → `null`, printed first) | `31-REVIEW.md` CR-22 position 2 | note written into the ungoverned store; `DEST ledger: 1` | **`DECLINED (destination-outside-governed-store)`**, message names the destination path; **UNGOV notes 0, DEST ledger ABSENT** | **MOVED — the clause exists, fires, and now precedes every other clause** | AGREES with `31-33` |
| **position 3** — `admitAndAppend("T-1", {by:"security-nfr", verified_by:"human:alice"}, contextRoot=DEST3 store, repoRoot=LEDGERROOT)` | `31-REVIEW.md` CR-22 position 3 / `31-VERIFICATION.md` row 4 | note into DEST, ledger line into the OTHER root — the route Workflow 18 names by hand | `-> {"id":"20260911T000000Z-security-nfr-finding-ae97a822","findings":[]}`; **DEST3 notes 1, DEST3 ledger 1; LEDGERROOT notes 0, LEDGERROOT ledger ABSENT** | **MOVED — CR-22 position 3 CLOSED** | AGREES with `31-33` |
| **position 4** — the DEFAULT arguments (`DEFAULT_CONTEXT_ROOT` = the kit vs `trustedRepoRoot()` = the host) | `31-REVIEW.md` CR-22 position 4 | the split is the module's default under the shared-install model | **NOT DRIVEN.** `DEFAULT_CONTEXT_ROOT` is not exported (measured `false`), so it cannot be read from outside the module, and observing the split needs a `~/.grugops` kit beside a separate host repo. `trustedRepoRoot()` on this tree answers `/Users/olgeroeselg/Projects/public/grugops` | **NOT CLOSED — published as `R-31-33-02`**, with the reason `31-33` measured for refusing to close it | AGREES with `31-33`'s own record (it publishes rather than claims) |
| **the CONTROL** — the legitimate promotion, `to` and `repoRoot` under the SAME root | this session ("re-run every caller with a LEGITIMATE input") | — | `-> 20260911T000000Z-qe-observation-7ec337eb`; **D4 notes 1, D4 ledger 1** | **UNMOVED** — the entry-derived rule refuses nothing legitimate | AGREES |

### 2.2 CR-23 — the identity cutover's terminal `foreign` arm

Every row below ran in a probe root equipped by the round-7 `equipTarget` (§1.3), which plants
`foreign-framework.d.ts`.

| Probe spelling | From | Round-7 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| `import { describe } from "other-framework"; describe.skip("a whole group of scenarios", …)` — the review's own spec, verbatim | `31-REVIEW.md` CR-23 / `31-VERIFICATION.md` row 5 | `0 findings over 1/1 uat specs checked`, **EXIT=0**, `tsc` exit 0 | `tsc` **EXIT=0**; `1 finding(s) over 1/1 uat specs checked`, `uat/p.uat.spec.ts:3: banned modifier call — `describe.skip` …`, **EXIT=1**, 0 bytes stderr | **MOVED — CR-23 instance 1 CLOSED** | AGREES with `31-34` (D-35) |
| `import { expect } from "other-assert"; expect.soft(total).toBe(…)` — the review's second instance | `31-REVIEW.md` CR-23 instance 2 | `0 findings`, **EXIT=0**, `tsc` exit 0 | `tsc` **EXIT=0**; `1 finding(s) over 1/1`, `:5: … `expect.soft` …`, **EXIT=1**, 0 bytes stderr | **MOVED — CR-23 instance 2 CLOSED.** This is the instance the refused `union-head-declared-exemption` option would have left open, because `@playwright/test` DOES declare `expect` | AGREES with `31-34` |
| the **declaration-FILE** half of D-35's discriminant — a real `.d.ts` file with **no** `declare module` block (`grep -c 'declare module'` → **0**, printed first), imported relatively | derived from `D-35`'s own discriminant, which has two halves; the review drove only the `declare module` half | — | `tsc` **EXIT=0**; `1 finding(s) over 1/1`, `:3: … `describe.skip` …`, **EXIT=1** | **MOVED — both halves of the discriminant refuse**, not only the one the review's spelling exercised | AGREES with `31-34` |
| the **undeclared** `describe.skip` — the spelling the corpus already drove | `31-REVIEW.md` CR-23, "Why the suite is green" | `1 finding(s)`, EXIT=1 — the only spelling of this head the corpus exercised | `1 finding(s) over 1/1`, **EXIT=1** — **and `tsc` EXIT=2** (`TS2593: Cannot find name 'describe'`) | **UNMOVED as a verdict, and the review's own diagnosis is CONFIRMED with a number it did not print**: the pre-D-35 corpus's only `describe` row was a construct the language refuses to compile | AGREES with `31-34`'s reason for adding declared-foreign fixtures |

### 2.3 CR-24, and the regression

| Probe spelling | From | Round-7 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| one live note + one 9 MiB REGULAR note file + one `chmod 000` REGULAR note file, then `render()` | `31-REVIEW.md` CR-24 | `NOTE_SKIP_ARMS = [unparseable, not-a-regular-file, vanished]`; **both** skipped rows reported arm `not-a-regular-file`, the over-ceiling row's own `detail` contradicting its `arm` | `NOTE_SKIP_ARMS = [unparseable, **unopenable**, not-a-regular-file, **above-ceiling**, vanished]` (5, spreading `READ_POSITION_CONDITIONS` = 3); the EACCES row reports arm **`unopenable`**, the 9 437 184-byte row reports arm **`above-ceiling`**. Both files asserted `isFile() === true` before the render was read | **MOVED — CR-24 CLOSED.** The arm is read from `ReadPositionRefusal.condition`; no row's `detail` contradicts its `arm` | AGREES with `31-33` (D-34 (3)) |
| the full excluded-e2e suite | `31-VERIFICATION.md` row 7 / `regressions:` | **RED**: `Test Files 1 failed \| 63 passed (64)`, `Tests 1 failed \| 4127 passed \| 2 skipped (4130)`, 354.65 s — `uat-spec-integrity.test.ts`'s self-referential coverage case | see §8.1 for the post-round reading, taken at `MEASURED_AT` | see §8.1 | see §8.1 |
| the regression's **MECHANISM**, measured gone | `31-VERIFICATION.md` `regressions:` names `CORPUS_COVERAGE` (`:7838-7845`) and the run-time walk of `31-REVIEW.md` | a hand-typed literal keyed to one round's review content, compared against a run-time walk | `grep -ac REVIEW_MD` → **0**; `reviewFindingsNamingThisRunnable` → **1** (a comment); `CORPUS_COVERAGE` → **2** (both comments); the six `31-REVIEW.md` occurrences are five comments and one `it(` title. **No run-time read of the file remains** | **MOVED — the regression's mechanism is DELETED**, per `D-33` `remove-axis` | AGREES with `31-32` |

### 2.4 CR-25 — the bounded framework-surface walk

Construction: the per-file layout with an alias head, which is `31-VERIFICATION.md` row 6's own
construction (one property hop declared per FILE, so BFS depth and not module-merging is the
variable). Every row's `tsc --noEmit` over the probe target exited 0.

| Probe spelling | From | Round-7 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| `t.deep.p.p.p.skip` — 4 hops, under every bound | derived as the refusing half of the boundary pair | — | `1 finding(s) over 1/1`, naming `test.deep.p.p.p.skip`, **EXIT=1**, 0 bytes stderr | **UNMOVED — identity still refuses a reachable member** | AGREES with `31-35` |
| `t.deep.p…p.skip` — **7 hops** (`j=6`) | `31-VERIFICATION.md` row 6 | `1 finding(s)`, **EXIT=1** — the refusing half | **EXIT=2**, 516 bytes on stderr naming `the @playwright/test declared surface was not fully walked (node bound 4096, depth bound 6) … what stopped the walk was the DEPTH bound` | **MOVED — and DOWN, which is the price `31-35` recorded in advance.** A chain long enough to leave anything unexpanded is now a could-not-run, not a refusal. EXIT=2 is never a pass under D-12/D-28 | AGREES with `31-35` (D-36), which states this exact movement |
| `t.deep.p…p.skip` — **8 hops** (`j=7`), the accepting half | `31-VERIFICATION.md` row 6 / `31-REVIEW.md` CR-25 | **`0 findings over 1/1`, EXIT=0, ZERO bytes on stderr** — the silent fail-open | **EXIT=2**, 516 bytes on stderr, the same named cause | **MOVED — CR-25 CLOSED.** The silent accept is gone | AGREES with `31-35` |
| the same 8-hop chain with every interface in ONE file (the CONFOUND) | `31-VERIFICATION.md` row 6's own confound note; `31-35`'s base measurement | `1 finding(s)`, EXIT=1 at every length — the bound was never reached, which is why the bisection is a statement about a LAYOUT | **EXIT=2**, the same named cause | **MOVED — and the report is now about the WALK rather than about the file layout** | AGREES with `31-35` |
| a framework member behind a **library CONTAINER** (`t.many[0].skip`, `many: GrugHeld[]`) | `31-35`'s own adversarial probe of its own fix — a regression that fix CREATED and then closed | at `31-35`'s base: REFUSED (exit 1); with the standard-library narrowing alone: ACCEPTED at exit 0 | `1 finding(s) over 1/1`, naming `test.many.skip`, **EXIT=1**, `tsc` exit 0 | **UNMOVED from the base — the narrowing's regression is closed** | AGREES with `31-35` |
| a framework member behind an **INDEX SIGNATURE**, alias head (`t.bag.anything.skip`) | `31-35`'s disclosed remainder | pre-existing accept at the plan's base | **`0 findings over 1/1`, EXIT=0, 0 bytes stderr**, `tsc` exit 0 | **OPEN — and DISCLOSED**: a member of `UNRESOLVABLE_CALLEE_RESIDUALS` (index 9) and driven by corpus row `CR25-INDEX-SIGNATURE-open`. Carried in §12 with an owner | AGREES with `31-35`'s own record |
| the same construction with a **plain `test` head** | `31-35`'s bounding half of that disclosure | — | `1 finding(s) over 1/1`, naming `test.bag.anything.skip`, **EXIT=1** | **UNMOVED** — the spelling rule bounds the disclosure | AGREES |

### 2.5 The six Warnings

| Probe spelling | From | Round-7 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| **WR-31** — `node scripts/check-platform-shapes.js`, both CONTROL rows at both positions | `31-REVIEW.md` WR-31 | both controls at both positions were **refusals**, scored `not refused (correct)`; gate printed `ALL CHECKS PASSED` | all four control rows print **`ordinary outcome (correct)`**; `DRIVEN (13)`, `SKIPPED SHAPES (0)`, `ALL CHECKS PASSED`, EXIT=0 | **MOVED — WR-31 CLOSED** | AGREES with `31-36` (D-37 (1)) |
| **WR-31's RED path**, through the documented seam `GRUGOPS_PLATFORM_SHAPES_STALE_CONTROL=1` — the pre-fix staging restored | `31-36`'s own seam, driven here as an independent check that the control can fail | — | **EXIT=1**, `5 CHECK(S) FAILED`: four control rows report `the CONTROL did not produce its position's ordinary outcome (verdict=refuse, expected write)` / `(verdict=fail-closed, expected answered)`, **plus** a fifth premise failure — `every driven row carried the same verdict (fail-closed). The verdict classifier did not DISCRIMINATE on this run` | **the control's red path is DRIVEN, not argued** — and the discrimination premise is asserted before the control's equality | AGREES with `31-36` (D-37 (3)) |
| **WR-32** — the refusal predicate recognising one syntactic spelling; a third implementation spelled `st.isFile() === false` | `31-REVIEW.md` WR-32 | `{"nb":true,"ds":true,"rf":false,"th":true,"all":false}` — `rf` false, so the file never joins `IMPLEMENTING` | **NOT re-driven with a new source file** (§1.2). Measured structurally: `REFUSAL_SPELLINGS` enumerates `negated-call`, **`equals-false`** (`if (st.isFile() === false) throw`), **`not-equals-true`**, `else-branch`; the mirrors are generated by iterating that set and the driven ids compared back to it (`:438`, `:470-472`); `candidateSources` returns `[...new Set([...trackedSources(root), ...walkedSources(root)])]` (`:335`) — `git ls-files` **unioned** with a real filesystem walk. Axis re-driven through its own file: `Test Files 1 passed (1)`, `Tests 24 passed (24)` | **MOVED structurally — WR-32 CLOSED at both halves it names**; the external re-drive is named as not-performed with its reason | AGREES with `31-36` (D-37 (2), D-37 (4)) |
| **WR-33** — the six greps over `scripts/runnable-ref/uat-spec-integrity.ts` | `31-REVIEW.md` WR-33 | `resolveBinding` 2, `bindingRangeFor` 2, `listHoists` 2 — all three LIVE, contradicting §6.1's claimed deletion | identical: **2, 2, 2** — all three still live. The three symbols D-30 (5) actually deleted measure `deriveTestInfoParameterNames` **4**, `isFixtureBindingPosition` **1**, `CALLEE_CHAIN_STEP_BOUND` **2** — every occurrence a comment (line numbers printed: `:229`, `:432`, `:584`, `:2615` / `:433` / `:281`, `:433`) | **UNMOVED as a mechanism (correctly — the arm is live and narrowed, not gone); MOVED as a RECORD.** `docs/audit/31-round6-residuals.md` §6.1 now opens with a dated correction quoting the false sentence and re-taking the disposition | **WR-33 CLOSED** — AGREES with `31-37` |
| **WR-34** — `grep -c factory.config.json scripts/check-platform-shapes.ts`, against row 13's claim | `31-REVIEW.md` WR-34 | **1** — the string occurs only inside the explanatory comment; row 13 claimed a fixture that writes the dial | **1**, unchanged. Row 13 now carries `**CORRECTED 2026-09-11 by plan 31-37, forced by WR-34:**` quoting the removed sentence and recording that the remedy was REVERTED, with the restore criterion carried | **MOVED as a RECORD — WR-34 CLOSED** | AGREES with `31-37` |
| **WR-35** — `.temp` in `SKIPPED_DIRECTORIES`, the two denominator runs | `31-REVIEW.md` WR-35 | a host spec under a `.temp` segment is dropped from `derived.relPaths` before `expected` is computed, and **neither floor can fire** — a clean pass over a silently short set | `SKIPPED_DIRECTORIES` is still **5** (`node_modules`, `.git`, `dist`, `tools`, `.temp`) — the narrowing is NOT reverted. But a target carrying a `.temp/uat/hidden.uat.spec.ts` now emits on **stderr**: `UAT spec integrity: the walk SKIPPED directory entries by name: .temp=1 — these directory names are the walk's input boundary, so nothing under them is in the derived total this run reports.` The CONTROL (no skipped-directory hit) emits **0 bytes** | **PARTIALLY MOVED — the SILENCE is closed, the NARROWING is retained by decision** (`D-33 (5)`: reverting would reverse a named human's `D-30` sub-decision inside an agent-authored fix plan). Carried in §12 with its closing criterion | AGREES with `31-32`'s own record |
| **WR-36** — the wrapper's delivered-root validation strictly weaker than the reader's | `31-REVIEW.md` WR-36 | the wrapper applied three conditions; the reader applied five; the stated reason (`a file limited to node: builtins`) was false | `hostBuiltProjectRoot` now applies **five**, read off the committed source: non-empty after trim (`:441`), absolute (`:441`), an existing directory (`:445`, `:449`), **a version-control marker under the candidate** (`:452`, over `REPO_BOUNDARY_MARKERS`), and **not the kit's own root** (`:456`). `TRUSTED_ROOT_TIERS[0]` now states `that path is derived from CLAUDE_PROJECT_DIR — the tier-1 ambient name — read inside the frozen …`. A shared-corpus subset case exists at `scripts/context-io.test.ts:11243` with an explicit vacuity guard (`:11437`) | **MOVED — WR-36 CLOSED at both halves.** End-to-end re-drive named as not-performed (§1.2) | AGREES with `31-37` (D-38 (1)) |

### 2.6 The three Info items

| Item | Probe spelling | Round-7 result | This round | Verdict |
|---|---|---|---|---|
| **IN-16** | `grep -rn TEST_INFO_CANONICAL_HEAD --include=*.ts --include=*.js --include=*.md .` (node_modules excluded) | three hits under `scripts/`: the `.ts` export, the `.js` export, and one test asserting its literal value | **zero hits under `scripts/` or `hooks/`.** Every remaining hit in the repository is a planning document quoting the finding | **MOVED — IN-16 CLOSED** by deletion |
| **IN-17** | the doc block at `deriveDeclaredBindings` | the superseded paragraph cut mid-clause (`is recorded with`) with the `D-30 (5)` heading spliced onto its tail | `:2612-2620` reads as one whole paragraph: `* D-30 (5): THE ONE NON-SUPPRESSING RECORD IS GONE, WITH THE MAP IT CONSTRAINED. It existed to keep …`. No orphaned clause precedes it | **MOVED — IN-17 CLOSED** |
| **IN-18** | `drivePosition`'s forced-absent seam constructing a shape it has already decided to skip | `const staged = forced.has(shape.name) ? { ...plant(shape), made: false } : plant(shape);` — `plant` ran and the result was discarded | `:447-454` is `if (forced.has(shape.name)) { skip(position, shape); continue; }` — **no construction**. DRIVEN: `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT="FIFO" node scripts/check-platform-shapes.js` → `SKIPPED SHAPES (2)`, both FIFO positions, `ALL CHECKS PASSED`, EXIT=0 | **MOVED — IN-18 CLOSED** |

---

## 3. The round-6 control ledger — every round-6 closure re-driven at this commit

`31-33` and `31-37` both edited `scripts/context-io.ts`, the module `CR-19`'s and `CR-20`'s closures
live in. `31-34` and `31-35` both edited `scripts/runnable-ref/uat-spec-integrity.ts`, the module
`CR-18`'s and `CR-21`'s closures live in. `31-37` edited `hooks/hook-entry.ts`, `CR-17`'s module.
**Every round-6 closure sits inside a module round 7 changed**, which is why these are regression
evidence and not a courtesy.

**Round 7's verifier independently re-drove exactly ONE of the five (`CR-20`) and accepted the other
four — `CR-17`, `CR-18`, `CR-19`, `CR-21` — from `31-REVIEW.md`'s own measurement, naming its
reproduction budget as the reason.** So before this session, four of the five closures rested on one
reading taken in round 6 and never re-taken. **All five are driven below.**

| Round-6 closure | Independently measured since round 6? | Probe spelling | This round | Verdict |
|---|---|---|---|---|
| **CR-17** | **NO** — accepted twice (`31-REVIEW.md`, then `31-VERIFICATION.md`) | CONTROL: ordinary Bash payload, unmodified manifest, `node <kit>/hooks/hook-entry.js admission-guard.js` | **EXIT=0 in 80 ms**, 0 bytes stdout, 0 bytes stderr | **UNMOVED — intact** |
| **CR-17** | **NO** | `mkfifo <kit>/scripts/checkpoints.js` (asserted `isFIFO() === true`), then the same call | **EXIT=0 in 32 ms**, **733 bytes** of `permissionDecision:"deny"` naming `"scripts/checkpoints.js" … is not a regular file (manifest-path…)`, 0 bytes stderr | **UNMOVED — CR-17's closure holds across `31-37`'s edits to this exact file** |
| **CR-17** | **NO** | the OTHER decider the manifest publishes — `… hook-entry.js guard.js`, same FIFO | **EXIT=0 in 32 ms**, the same 733-byte named deny | **UNMOVED — the rule is the wrapper's, not one decider's** |
| **CR-17** | **NO** | a **DIRECTORY** at the same manifest position (asserted `isDirectory() === true`) | **EXIT=0 in 32 ms**, the same named deny | **UNMOVED** |
| **CR-18** | **NO** | `import { test as it }; if (false) { function it(): void {} void it; } it.skip("scenario", …)` | `tsc` EXIT=0; `1 finding(s) over 1/1`, `:5: … test.skip`, **EXIT=1** | **UNMOVED — intact across the D-35 split and the D-36 narrowing** |
| **CR-18** | **NO** | the CONTROL — the identical file with the `if (false)` block removed | `tsc` EXIT=0; `1 finding(s)`, `:3: … test.skip`, **EXIT=1** | **UNMOVED** |
| **CR-18** | **NO** | the NAMESPACE family — `import * as pw; if (false) { function pw(): void {} } pw.test.skip(…)` | `tsc` EXIT=0; `1 finding(s)`, `:5: … test.skip`, **EXIT=1** | **UNMOVED** |
| **CR-18** | **NO** | the AMBIENT spelling — `declare const it: unknown;` beside `import { test as it }` | `0 findings over 1/1`, **EXIT=0** — **and `tsc` EXIT=2** (`TS2440: Import declaration conflicts with local declaration of 'it'`) | **UNMOVED — and still a construct the language refuses.** This is `R-31-31-01`, carried to round 7 with an owner; `31-34` recorded the neighbouring shape as `RR-13`. Still open — §12 |
| **CR-18** | **NO** | the CONTROL — a block-scoped CLASS (`{ class it {} void it; }`) | `tsc` EXIT=0; `1 finding(s)`, `:5: … test.skip`, **EXIT=1** | **UNMOVED** |
| **CR-19** | **NO** | `appendNote("T-1", {security-nfr/observation}, "x".repeat(9*1024*1024), <ctx>, undefined, <root>)` | **REFUSED**: `refusing to write (note-above-size-ceiling) — the composed note under id "…" is 9437359 bytes, above the 8388608-byte ceiling …`; `readContext` → **0**, notes on disk **0** | **UNMOVED — intact across `31-33`'s rewrite of the skip arms in this module** |
| **CR-19** | **NO** | the CONTROL — a small note through the same call | `WROTE 20260911T000000Z-qe-observation-d51ff04e`; `readContext` → **1** | **UNMOVED** — legitimate input untouched |
| **CR-20** | **YES** (round 7 re-drove this one) | three governance roots, gated arm: origin `admitAndAppend` under `human:alice`, then `promoteAdmitted(…, to=THIRD, repoRoot=DEST)` | ORIGIN notes 1 / ledger 1; promotion returns the origin id **unchanged** (`…-25cc2c68`); **THIRD notes 1, THIRD ledger 1; DEST notes 0, DEST ledger ABSENT** | **UNMOVED — intact, and now on the entry-derived path rather than the arm-local one** |
| **CR-21** | **NO** | `test("scenario", { tag: "@smoke" }, async ({ page }, testInfo) => { testInfo.skip(); … })` | `tsc` EXIT=0; `1 finding(s)`, `:4: … test.info().skip`, **EXIT=1** | **UNMOVED — intact** |
| **CR-21** | **NO** | the CONTROL — the identical scenario in the two-argument form | `tsc` EXIT=0; `1 finding(s)`, `:4: … test.info().skip`, **EXIT=1** | **UNMOVED** |

**14 control rows. 14 driven. 14 UNMOVED. Zero round-6 closures were lost by round 7's fixes.**
**Four of the five closures — `CR-17`, `CR-18`, `CR-19`, `CR-21` — had NOT been independently
measured since round 6 and are measured here for the first time since.** The one row that reads like
a residual (`CR-18`'s ambient spelling) is unmoved in both directions and was already recorded as
`R-31-31-01`; it is not a regression this round introduced.

---

## 4. The two counts, stated separately

**A closure that reports only the rows it moved cannot show it broke nothing.**

### 4.1 Driven and not driven

**44 probe rows derived. 44 driven.**

- **20 rows carried a defect in round 7 and MOVED**: `CR-22` positions 1, 2 and 3; `CR-23` all four
  positions (three MOVED, one confirmed-as-diagnosed); `CR-24`; `CR-25`'s over-bound, confound and
  the 7-hop half; the regression's mechanism; `WR-31` at both positions; `WR-32` structurally;
  `WR-33`; `WR-34`; `WR-36`; `IN-16`; `IN-17`; `IN-18`.
- **1 row carried a defect and PARTIALLY moved**: `WR-35` — the silence is closed, the narrowing is
  retained by `D-33 (5)`.
- **2 rows carried a defect and did NOT move**: `CR-22` position 4 (not drivable from outside the
  module; published as `R-31-33-02`) and `CR-25`'s index-signature shape (pre-existing, disclosed as
  a register member with a corpus row).
- **21 rows are CONTROLS and are UNMOVED**: the source-identity premise (2 readings), the package
  diff, `CR-22`'s legitimate-input control, `CR-23`'s undeclared row, `CR-25`'s under-bound, container
  and plain-head rows, and all 14 round-6 control rows.

**5 probes are named as NOT driven, each with its reason** (§1.2): `WR-32`'s untracked-candidate
probe; `WR-32`'s third-implementation spelling probe; `WR-36`'s end-to-end shared-corpus drive;
`CR-22` position 4's live split; and the round-base RED suite re-run at `d484b9e`.

**No row in this ledger claims a closure without a quoted measurement taken in this session.**

---

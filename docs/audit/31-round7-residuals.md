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

## 5. The four requirements round 7 recorded SATISFIED, re-measured

A closure round that re-measures only the failing requirements cannot show that fixing them cost the
passing ones nothing. `31-VERIFICATION.md` records `UATX-02`, `UATX-03`, `UATX-04` and `UATX-05` as
`✓ SATISFIED`. Each mechanism is re-measured here rather than carried.

| Requirement | Its mechanism | This round | Verdict |
|---|---|---|---|
| `UATX-02` — the browser-MCP pin authority | `guardPlaywrightMcpPin` inside `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, EXIT=0 | **UNMOVED** |
| `UATX-03` — the attended Chrome lane's structural bar | `scripts/chrome-lane-bar.test.ts` | byte-untouched over the whole round (`git diff --name-only d484b9e..HEAD` does not name it), green inside the 66-file suite (§8.1) | **UNMOVED** |
| `UATX-04` — the provenance routes | `admit()`'s frozen span | `ADMIT_FROZEN_SHA256` re-derived: span found at offset 214 814, **12 151 bytes** (asserted non-zero before the digest was read), sha256 `08df9e5c…09e9` = the pinned baseline | **UNMOVED — the frozen span did not move under `31-33`'s edits to the module around it** |
| `UATX-05` — the two loud-skip markers | `PARSER_ABSENT_MARKER` / `BROWSER_ABSENT_MARKER`, and the exit partition | `node scripts/check-uat-oracles.js` → `ALL CHECKS PASSED`; the `{0,1,2}` partition asserted at `scripts/uat-gate-exit-contract.test.ts:290` and `:295`; `D-36` added a CAUSE at an existing boundary, never a third exit code — measured: every CR-25 chain length answers 1 or 2, never 0 (§2.4) | **UNMOVED as a partition; the exit-2 arm gained one cause** |

---

## 6. The disagreements, recorded rather than absorbed

### 6.1 The "Skipped entries finding" is a markdown-parse artifact, not a fourteenth item

The brief convening this measurement enumerated fifteen items: the four Criticals, "the
Skipped-entries finding", six Warnings, three Info items and the regression. **Measured: there is no
Skipped-entries finding.** `31-REVIEW.md:433` carries `## Skipped entries` **inside** a fenced code
block opened at `:430` and closed at `:442` — it is the verbatim `render()` output quoted inside
`CR-24`'s own reproduction, and its two table rows are `CR-24`'s evidence.

Fence parity around `CR-24` (`:398`–`:484`), measured: fences at `:415` (`ts`), `:421`, `:430`,
`:442`, `:461` (`ts`), `:474`. A scanner that strips fenced regions before matching
`^### (CR|WR|IN)-NN:` yields **13** headings, equal to the review's own frontmatter `total: 13`. A
scanner that does not strip them, and that matches `^#{1,4} `, yields a fourteenth heading that no
document ever filed.

This is the same class as this repository's decision-coverage gate, which must strip fences before
scanning. It is recorded here so round 8 does not carry a phantom item forward, and **CR-24 keeps
one row in §10 rather than two**.

### 6.2 `CR-25`'s refusing half moved DOWN, on purpose

`31-VERIFICATION.md` row 6 recorded 7 hops refused / 8 hops accepted. This round measures **7 hops →
EXIT=2** and **8 hops → EXIT=2**. That is not a regression of the refusal: `D-36`'s own record states
the trade in advance — *"a chain long enough to leave anything unexpanded at the bound is now a
could-not-run rather than a refusal"* — and EXIT=2 is never a pass under `D-12`/`D-28`. The prior
number is not edited; both are printed. A reader citing "7 hops refuses" from
`31-VERIFICATION.md` is citing a pre-`D-36` tree.

### 6.3 `CR-23`'s "why the suite is green" control does not compile

`31-REVIEW.md` explains the suite's silence by noting that `directRuleSpellings` drove
`describe.skip` where `describe` is **undeclared**, and that the undeclared spelling refuses anyway.
Re-driven here, that is true — `1 finding(s)`, EXIT=1 — **and `tsc --noEmit` exits 2**
(`TS2593: Cannot find name 'describe'`). The review's diagnosis is therefore stronger than it stated:
the corpus's only `describe` row was a construct the language refuses to compile, which is precisely
why `31-34` had to add declared-foreign fixtures rather than reuse it. Recorded as an agreement with
a number the source document did not print.

### 6.4 The review's `(e)` count is 6 under the round-6 phrase set, and the count is not load-bearing

`docs/audit/31-round6-residuals.md` measured `(e)` with `grep -c 'Reproduced on this tree|Measured on
this tree'`. The same command on this round's review answers **6**, because this review also spells
its measurement headers `Reproduced and bisected on this tree`, `Measured at HEAD` and `Measured —`.
The `(e)` count is not used as a denominator anywhere in this document; the driven set is enumerated
in §1.1 and §4.1 instead. The difference is printed rather than absorbed.

---

## 7. The measurement environment, proven clean by predicates that can OBSERVE it

### 7.1 The tree, at the pinned commit

```
$ git rev-parse HEAD
3baab0d3378bd09fb8302505e013e19af9fe53ec
$ git status --porcelain -- scripts hooks agent-factory install docs .github vitest.config.ts package.json
(empty, before the first probe)
$ git status --porcelain -- scripts hooks agent-factory install .github vitest.config.ts package.json
(empty, after the last probe and after the full suite)
$ git diff --name-only HEAD -- scripts hooks agent-factory install
(empty — this plan wrote no source and no test)
```

Platform: darwin 25.5.0 arm64, Node v24.12.0.

### 7.2 `.temp/`, the named-pipe sweep, and the residue predicate demonstrated INERT

```
$ find .temp -mindepth 1
(empty)
$ find . -path ./node_modules -prune -o -type p -print
(empty)
```

**Both readings were taken AFTER the full suite finished, and that timing is load-bearing.** Taken
*during* the run, the same two commands report `.temp/31-27-parity-zwUXSg` and a **live FIFO** at
`.temp/31-27-parity-M7TqHw/scripts/checkpoints.js` — the suite's own probe roots, mid-flight. A
cleanliness predicate run concurrently with the thing it is measuring answers about the measurement,
not about the tree.

**The `git status`-based residue predicate, demonstrated inert rather than asserted so:**

```
$ mkdir -p .temp/inert-demo && printf 'x' > .temp/inert-demo/probe-residue.txt
$ git check-ignore -v .temp/inert-demo/probe-residue.txt
.gitignore:19:.temp/	.temp/inert-demo/probe-residue.txt
$ git status --porcelain | grep inert-demo
(NOTHING — the predicate is blind to this path)
$ find .temp -mindepth 1
.temp/inert-demo  .temp/inert-demo/probe-residue.txt
```

A real listing sees what `git status` cannot. This is the predicate `vitest.config.ts:17-20` records
as having stayed silent through rounds 3, 4 and 5 while a probe spec under `.temp/` was collected by
the runner and killed a run on SIGSEGV.

### 7.3 Every harness's premise, and the assertion that established it

| Harness | The premise it could have got wrong | How it was asserted, before any result was read |
|---|---|---|
| the AST probes | an unequipped root answers `PROGRAM_UNAVAILABLE_REASON`, not the ban | equipped exactly as `equipTarget` does (§1.3), **and every row prints its own `tsc --noEmit` exit code** |
| the `context-io` probes | a directory that is not a governance root silently changes which branch runs | `governanceRootOf(store) === root` printed per root, per probe |
| the `hook-entry` probes | the argv could be typed wrong and probe nothing | the two routes **derived from `hooks/hooks.json`** and printed before the kit was driven |
| the `DECIDER_MANIFEST` check | a manifest parse that silently went short reads as "no mismatches" | the decider keys and the `(path, hash)` pairs derived by two independent scans, both counts printed (2 and 26), and `files missing on disk` printed as its own number |
| the `FROZEN_HOOK_ENTRY_LOGIC_SHA` check | a normalisation that removed nothing would be hashing the whole file | total / normalised / **REMOVED** byte counts printed BEFORE the digest (§8.3) |
| the `ADMIT_FROZEN_SHA256` check | a brace-scan that found nothing would hash an empty string | the span offset and its **12 151** bytes printed before the digest |
| the coverage equality | either side going to zero would satisfy it vacuously | both derivations `throw` on a zero count; both counts printed (§9) |
| the `.temp` / FIFO sweep | a sweep run during the suite measures the suite | taken after `SUITE EXIT=0`, and the mid-flight readings are recorded above |

### 7.4 One false result about a harness's own premise, logged as instance 15

The ordinal is READ OFF `docs/audit/harness-false-result-instances.md`, whose last row is 14.

**The first `admitAndAppend` probe wrote its governance dial at the wrong key.** It planted
`{ "human_admission": "high-severity" }` at the root of `.grugops/factory.config.json`; the module
reads `{ "context": { "human_admission": … } }`. Every dial value then produced the identical
`admission REFUSED (W3): this note is not gated…` and **zero** files on disk — which, read straight,
looks exactly like a closure of `CR-22` position 3, and is not one. **Caught by driving all three
dial values (`all`, `high-severity`, `none`) and observing that they could not be told apart** — a
dial that changes nothing is a dial that was not read. The probe was rebuilt against the config shape
`scripts/context-io.test.ts:2409-2414` writes, and only then was any result read.

This is the same class as instances 4 and 14 — a derivation whose input never reached the code under
test, producing a pass-shaped output. It is logged rather than absorbed, and it is the reason every
`context-io` row in §2.1 prints a non-zero BEFORE count as well as its AFTER count.

---

## 8. The one-commit gate record — measured, and recorded as a FLOOR

### 8.1 The whole repository, at one commit, with a clean tree

| # | Gate | Command | Result | Exit |
|---|---|---|---|---|
| G1 | build | `npm run build` | `> tsc` | ✓ 0 |
| G2 | typecheck (three projects) | `npm run typecheck` | `tsc --noEmit && tsc -p tsconfig.tests.json && tsc -p tsconfig.fixtures.json` | ✓ 0 |
| G3 | build parity | `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` | ✓ 0 |
| G4 | committed-`.js` freshness | `npm run freshness` | `All build outputs fresh: 61 committed .js file(s) match a rebuild of their sources.` · `Set equality with the filesystem walk: 0 committed at HEAD and absent on disk, 0 on disk and absent from HEAD.` | ✓ 0 |
| G5 | hook-manifest freshness | `npm run freshness:hook-manifest` | `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.` | ✓ 0 |
| G6 | traceability freshness | `npm run freshness:traceability` | `Traceability fresh: no .grugops/context/ notes tree exists yet — nothing committed to drift (vacuous pass).` | ✓ 0 |
| G7 | foundation guards | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` | ✓ 0 |
| G8 | UAT oracles | `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` | ✓ 0 |
| G9 | platform shapes | `node scripts/check-platform-shapes.js` | `DRIVEN (13)`, **all four CONTROL rows `ordinary outcome (correct)`**, `SKIPPED SHAPES (0)`, `ALL CHECKS PASSED` | ✓ 0 |
| G10 | tests typecheck project | `npx tsc -p tsconfig.tests.json` | (no output) | ✓ 0 |
| G11 | fixtures typecheck project | `npx tsc -p tsconfig.fixtures.json` | (no output) | ✓ 0 |
| G12 | claim anchors | `npm run check:claim-anchors` | `ALL CHECKS PASSED` | ✓ 0 |
| G13 | audit register | `npm run check:audit-register` | `ALL CHECKS PASSED` | ✓ 0 |
| G14 | residual citations | `npm run check:residual-citations` | `ALL CHECKS PASSED` | ✓ 0 |
| G15 | banned claims | `npm run check:banned-claims` | `ALL CHECKS PASSED` | ✓ 0 |
| G16 | NUL bytes | `npm run check:nul-bytes` | `ALL CHECKS PASSED` | ✓ 0 |
| G17 | diff disposition | `npm run check:diff-disposition` | `FAIL diff disposition — changed watched file(s): 78 finding(s) over 39 elements` | ✗ **1 — pre-existing debt, §8.4** |
| G18 | **the full excluded-e2e suite** | `npx vitest run --exclude '**/scripts/e2e/**'` | **`Test Files  66 passed (66)`** · **`Tests  4208 passed \| 2 skipped (4210)`** · `Duration  426.55s` | ✓ **0** |

**The suite line, verbatim and quoted rather than summarised:**

```
 Test Files  66 passed (66)
      Tests  4208 passed | 2 skipped (4210)
   Duration  426.55s (transform 3.25s, setup 0ms, import 6.59s, tests 415.64s, environment 3ms)
SUITE EXIT=0
```

**The round base was RED, and that reading is recorded beside the green rather than replaced by it.**
`31-VERIFICATION.md` row 7 measured, at the commit round 7 verified:

```
 Test Files  1 failed | 63 passed (64)
      Tests  1 failed | 4127 passed | 2 skipped (4130)     354.65 s
```

The failing case was `scripts/runnable-ref/uat-spec-integrity.test.ts`'s
*"covers every 31-REVIEW.md finding that names this runnable, in BOTH directions"*, whose
`CORPUS_COVERAGE` literal was keyed to round 6's finding set while its companion derivation walked
`31-REVIEW.md` at run time — a file this project fully REPLACES every round. **`31-32` fixed it**, by
`D-33` `remove-axis`: the axis was deleted rather than re-synchronised, and the coverage obligation
it carried was handed to THIS plan as a once-per-round one-shot (§9). Measured at `MEASURED_AT`:
`REVIEW_MD` **0 occurrences**, `reviewFindingsNamingThisRunnable` **1** (a comment),
`CORPUS_COVERAGE` **2** (both comments) — no run-time read of the planning artifact remains.

**Movement over the round: +2 test files (64 → 66), +81 passing tests (4127 → 4208), skips unchanged
at 2.** The two new files are `scripts/check-platform-shapes.test.ts` (`31-36`) and
`scripts/harness-instance-ledger.test.ts` (`31-37`).

### 8.2 The doctrine, stated BESIDE the green rather than instead of it, and DERIVED

**For seven consecutive verification rounds on this phase the green suite exercised none of the
defects that round found.** The derivation below is a measurement, not a restatement: it counts, in
TEST files at the round base `d484b9e`, the constants and code paths each round-7 Critical is decided
by.

| Critical | The constant / path it is decided by | Occurrences in `*.test.ts` at `d484b9e` | Occurrences now |
|---|---|---|---|
| `CR-25` | `SURFACE_DEPTH_BOUND` | **0**, across **0** files | 4, across 1 file |
| `CR-25` | `SURFACE_NODE_BOUND` | **0**, across **0** files | 4, across 1 file |
| `CR-23` | `IDENTITY_BAN_OPERAND` (the arm→operand authority) | **0** — the authority did not exist | 0 in tests; bound through `MODIFIER_IDENTITY_ARMS` and the corpus rows |
| `CR-24` | `ReadPositionRefusal` (the discriminant the caller must read) | **0**, across **0** files | 2, across 1 file |
| `CR-24` | `READ_POSITION_CONDITIONS` | **0** — not yet a runtime constant | 6, across 1 file |
| `CR-24` | `NOTE_SKIP_ARMS` | 2, across 1 file — **and that case expected TWO of three conditions to share one arm** | 8, across 1 file |
| `CR-22` | `destinationRoot` (the entry-derived root) | 2, across 1 file — at the GATED arm only | 2, across 1 file — now at the entry |
| `CR-22` | `governanceRootOf` | 10, across 2 files — **none at the fall-through position** | 19, across 3 files |

**Two of the four Criticals were decided by constants that appeared ZERO times in any test file at the
round base**, and a third's published arm set was asserted by a case that *encoded* the collapse. A
suite cannot fail on a coordinate it never names. That is the reason §2 precedes §8 in this document
and the reason the green above is a floor.

### 8.3 The frozen floors, RE-MEASURED rather than assumed

| Floor | Fresh measurement | Baseline | Verdict |
|---|---|---|---|
| `hooks/guard.ts` | `git hash-object hooks/guard.ts` → `669725bc1c616ab57123e22090d93d57eff1b001` | `FROZEN_GUARD_BLOB` = `669725bc1c616ab57123e22090d93d57eff1b001` | **EQUAL — the byte-frozen deploy guard is untouched by this round** |
| `hooks/hook-entry.ts` logic | markers located (`open@13155`, `close@15978`); **total 32 182 bytes, normalised 29 357, REMOVED 2 825** (floor: > 100, printed before the digest); sha256 `006cdb0f45d017f050f78c1424f636f700fc72b378723799cee4e1820904330d` | `FROZEN_HOOK_ENTRY_LOGIC_SHA` = `006cdb0f…330d`, **re-taken by `31-37` Task 1** (prior baselines `5bfd5ba8…`, `b0629f09…`, `e1ed0dc0…`, all four listed in the file) | **EQUAL — the baseline MOVED WITH the artifact and was not relaxed** |
| `admit()`'s span | brace-scanned from offset 214 814, **12 151 bytes**, sha256 `08df9e5c15754f8b3f3bde417475652d3d3861c50fd5458704b29651b83709e9` | `ADMIT_FROZEN_SHA256` = `08df9e5c…09e9` | **EQUAL — unmoved under `31-33`'s edits to the surrounding module** |
| `DECIDER_MANIFEST`, **whole** | deciders derived: **2** (`hooks/admission-guard.js`, `hooks/guard.js`); `(path, hash)` entries derived: **26** over **14** distinct paths; files missing on disk: **0**; digest mismatches: **0** | `npm run freshness:hook-manifest` independently reports `2 decider(s), 26 module hash(es) match a fresh derivation` | **EVERY ENTRY CHECKED, not only the ones this round moved** |
| the test-module tripwire | `ls scripts/*.test.ts \| wc -l` → **60** | `TRIPWIRE_MODULES = 60`, moved 59 → 60 by `31-37` for `scripts/harness-instance-ledger.test.ts` | **EQUAL — re-derived by the documented method rather than incremented** |
| the `{0,1,2}` exit partition | `scripts/uat-gate-exit-contract.test.ts:290` `expect(r.codes).toEqual([0, 1, 2])`; `:295` the handled set sorts to `[0, 1, 2]` | `D-28` | **UNMOVED — `D-36` added a CAUSE at the existing exit-2 boundary, never a third code** |

**Manifest baselines moved this round, and by whom:** `31-33` (`scripts/context-io.js`), `31-37`
(`hooks/hook-entry.js`'s own logic hash and the modules its closure names). Each moved with its
artifact in the same commit, which is what `freshness:hook-manifest` re-derives above.

### 8.4 The `check:diff-disposition` debt — RE-MEASURED, still OPEN

```
$ npm run check:diff-disposition
  FAIL  diff disposition — changed watched file(s): 78 finding(s) over 39 elements
1 CHECK(S) FAILED
```

| Reading | Count | Source |
|---|---|---|
| round-6 close | **80 finding(s) over 39 elements** | `docs/audit/31-round6-residuals.md` §8.4 / G25 |
| round-7 base (`78a9d16`) | **80** | `31-33`'s own measurement |
| after `31-33` | **78** | `31-33-SUMMARY.md` |
| **this session, at `MEASURED_AT`** | **78 finding(s) over 39 elements** | measured above |

**Down 2 over the round; still open.** The findings quoted by the gate name clauses in
`agent-factory/workflows/18-context-compaction.md`'s frozen `## Stop conditions` region — the region
`31-29` wrote — plus `05-pr-quality-gate.md` and `17-task-claim.md`. The gate's own remedy text
forbids the two shortcuts (narrowing the watched corpus, moving the recorded base), and clearing the
rest is a documentation pass of its own. **Owner: unassigned; carried in `deferred-items.md` with
`status: open`.**

### 8.5 The exported register cardinalities, measured on this tree

Each number was read from the **committed `.js`** by importing it from a non-entry module, not
counted by eye, and compared to the number `31-31` recorded.

| Register | `31-31` | Now | Moved by | Verdict |
|---|---|---|---|---|
| `TRUSTED_ROOT_RESIDUALS` | 11 | **11** | — | unmoved (`R-31-15-01..04`, `R-31-19-01..07`) |
| — its `hosts` breakdown | 4 `non-cc-hook-path` / 7 `all` | **4 / 7** — the four are `R-31-15-01`, `R-31-15-03`, `R-31-19-02`, `R-31-19-06` | — | unmoved |
| `TRUSTED_ROOT_TIERS` | 5 | **5** | `31-37` rewrote tier 0's PROVENANCE sentence without changing the count | count unmoved, text moved (D-38 (2)) |
| `TRUSTED_ROOT_STOP_CONDITIONS` | 7 | **7** (`S-HOME-ABOVE`, `S-HOME-SELF`, `S-HOME-UNKNOWN`, `S-BOUNDARY`, `S-BOUNDARY-WINS`, `S-ROOT`, `S-STEPS`) | — | unmoved |
| `TRUSTED_ROOT_ENV_ORDER` | 2 | **2** | — | unmoved |
| `PROMOTE_ADMITTED_RESIDUALS` | 6 | **6** | — | unmoved |
| `PROMOTE_ADMITTED_DECLINES` | 11 | **11** | `31-33` re-ordered the clauses (`destination-outside-governed-store` now first) without adding one | count unmoved, order moved (D-34 (1)) |
| `WRITE_PATH_RESIDUALS` | 5 | **7** | **`31-33`** — `R-31-33-01` and `R-31-33-02`, each driven by its own case | **+2, and both are this round's own published refusals-to-close** |
| `NOTE_SKIP_ARMS` | 3 | **5** (`unparseable`, `unopenable`, `not-a-regular-file`, `above-ceiling`, `vanished`) | **`31-33`** — it now SPREADS `READ_POSITION_CONDITIONS` | **+2, and the set is derived rather than restated** |
| `READ_POSITION_CONDITIONS` | (not a runtime constant) | **3** (`unopenable`, `not-a-regular-file`, `above-ceiling`) | **`31-33`** — promoted from a type to a runtime constant | **NEW** |
| `REPO_BOUNDARY_MARKERS` | 9 | **9** | — | unmoved; now read by the wrapper too (`31-37`) |
| `UNRESOLVABLE_CALLEE_RESIDUALS` | 6 | **10** | **`31-34`** (RR-13, the hand-`declare`d head) and **`31-35`** (the depth bound, the node bound, the index signature) | **+4, every one a disclosed boundary with a closing criterion** |
| `BANNED_MODIFIER_HEADS` | 2 (`test`, `describe`) | **2** | — | unmoved — and `describe` is now REACHABLE (§2.2) |
| `BANNED_EXACT_PATHS` | 1 (`expect.soft`) | **1** | — | unmoved — and now reachable |
| `SKIPPED_DIRECTORIES` | 5 | **5** (`node_modules`, `.git`, `dist`, `tools`, `.temp`) | — | **unmoved by decision** (`D-33 (5)`); the narrowing is disclosed, not reverted |
| `MODIFIER_IDENTITY_ARMS` | (did not exist) | **4** (`framework`, `foreign-declared`, `foreign-local`, `unresolved`) | **`31-34`** | **NEW — derived from `IDENTITY_BAN_OPERAND`** |
| `IDENTITY_BAN_OPERAND` | (did not exist) | **4** keys, matching the arm set exactly | **`31-34`** | **NEW** |
| `PATHOLOGICAL_INPUT_SHAPES` | 6 | **6** | — | unmoved |
| `MEASUREMENT_BRANCH_STREAMS` | 4 | **4** | — | unmoved |
| `SURFACE_DEPTH_BOUND` | (not exported) | **6** | **`31-35`** | **NEWLY EXPORTED**, published as a register member and a recipe bullet |
| `SURFACE_NODE_BOUND` | (not exported) | **4096** | **`31-35`** | **NEWLY EXPORTED**, same |
| `SURFACE_TRUNCATED_CAUSE` | (did not exist) | present | **`31-35`** | **NEW** — the could-not-run cause a truncated walk routes through |
| `NOTE_FILE_MAX_BYTES` | 8388608 | **8388608** | — | unmoved |
| `AUDIT_LEDGER_MAX_BYTES` | 67108864 | **67108864** | — | unmoved |

**Every difference is attributed to the plan that made it. No register moved without a plan naming
it, and no cardinality this round recorded disagrees with its owning SUMMARY.**

---

## 9. The review-to-corpus coverage equality — `D-33`'s one-shot, both sides DERIVED

### 9.1 What this section is, and what `D-33` gave up to get it

`31-28` bound the UAT-spec corpus to `31-REVIEW.md` with a run-time axis: `reviewFindingsNamingThisRunnable()`
walked the review's own `###` headings and the equality compared them against `CORPUS_COVERAGE`, a
hand-typed literal. **That axis was DELETED by `D-33` (`remove-axis`, answered by a named human on
2026-09-11)**, because this project REPLACES `31-REVIEW.md` at every gap-closure round, so the
oracle moved under the corpus and turned the suite RED on a commit that changed zero source bytes.

`D-33 (2)` recorded the price and handed the obligation here: **the coverage is asserted ONCE per
round, in the round's closing measurement, as a recorded one-shot.** The weakness is stated rather
than hidden: **a one-shot is not a continuous gate.** Between this assertion and round 8's, a corpus
row can be deleted and nothing reds. `CORPUS_ROW_FLOOR` bounds deletion by cardinality; it cannot
bound it by identity.

**There is no `docs/audit/31-review-corpus-manifest.md`.** The plan text convening this measurement
assumed one, and assumed a `row(id, ...covers)` marker signature. Both predate `D-33`. Measured:
`row` is `function row(id: string): string` — one argument — and no manifest file exists. The
assertion below is the equivalent under what actually landed, and the substitution is recorded as a
deviation.

### 9.2 Both sides, derived at run time

**SIDE A — from `31-REVIEW.md`'s own headings, with fenced regions stripped first** (§6.1):

```
SIDE A headings (fences stripped): 13
  CR-22, CR-23, CR-25, CR-24, WR-31, WR-32, WR-33, WR-34, WR-35, WR-36, IN-16, IN-17, IN-18
SIDE A — findings whose section body NAMES this runnable: 5
  CR-23, CR-25, WR-35, IN-16, IN-17
```

The derivation throws on a zero count rather than comparing against an empty set.

**SIDE B — from `scripts/runnable-ref/uat-spec-integrity.test.ts`'s own `row("…")` markers**, each
attributed to the `it(`/`test(` case that encloses it, with the comment block immediately above the
case included (that comment block is where this file records which finding a row exists for):

```
PREMISE — it()/test() cases derived: 352 (non-zero required)
SIDE B — row() markers: 57 calls, 56 distinct
SIDE B — finding ids the enclosing cases cite:
  CR-18, CR-21, CR-23, CR-25, IN-15, RR-01..RR-09, WR-20, WR-23, WR-24, WR-26, WR-29, WR-30
CORPUS_ROW_FLOOR literal: 55   distinct row() markers measured here: 56
```

The floor is a monotone bound and it holds: **56 ≥ 55**.

### 9.3 The two asserted numbers, and the disagreement named

**Predicate 1 — STRICT: a review finding naming this runnable must be cited by a `row()`-marked corpus case.**

```
  covered by >= 1 corpus row : 2 of 5   -> FALSE (expected 5)
  covered by NONE            : 3        -> FALSE (expected 0)   -> WR-35, IN-16, IN-17
  CR-23: RED-1-CR23-foreign-describe-group, RED-2-CR23-foreign-soft-assert,
         CTRL-CR23-local-helper-head (+6 more)
  CR-25: CR25-UNDER-BOUND-refused, CR25-OVER-BOUND-could-not-run (+18 more)
```

**Predicate 2 — WEAKER: a review finding naming this runnable must be cited by SOME `it()`/`test()` case in the corpus file.**

```
  CR-23: 4 case(s)   CR-25: 5 case(s)   WR-35: 3 case(s)   IN-16: 5 case(s)   IN-17: 4 case(s)
  covered by >= 1 case : 5 of 5   -> TRUE
  covered by NONE      : 0        -> TRUE
```

**The disagreement, named rather than resolved by preference.** `WR-35`, `IN-16` and `IN-17` are not
defects a **spec-corpus row** can carry: `WR-35`'s closure is a stderr disclosure line (asserted at
`:9238` and `:9347`), `IN-16`'s is the ABSENCE of an export (measured: zero occurrences under
`scripts/` or `hooks/`), and `IN-17`'s is a doc-block edit. A `row()` marker names a **UAT spec
driven through the runnable**; none of those three has one to drive.

**So the honest reading is 5/5 under predicate 2 and 2/5 under predicate 1, and the gap between the
two predicates is exactly the set of findings whose closure is not spec-corpus-row-shaped.** The
deleted axis had the same property, and `31-28` handled it by hand-maintaining which findings
`CORPUS_COVERAGE` considered coverable — which is the set-literal drift that produced the regression.

**This is a residual, and it is carried in §12 with an owner:** neither predicate is derived from a
rule that separates row-shaped findings from the rest. Round 8 gets both numbers and the reason,
rather than one number and a claim.

**Nothing in the corpus cites a finding id outside the review's heading set as a `row()` marker
prefix**, measured — so no marker claims coverage of a finding this round's review did not raise.
Eighteen ids cited in case comments (`CR-18`, `CR-21`, `IN-15`, `RR-01..09`, `WR-20`, `WR-23`,
`WR-24`, `WR-26`, `WR-29`, `WR-30`) come from EARLIER rounds' reviews. **A corpus carrying more than
the current round asked for is not a defect and is not counted as one** — it is the accumulated
corpus the phase built, and deleting those rows is what `CORPUS_ROW_FLOOR` exists to catch.

---

## 10. The disposition ledger — one row per item, over a DERIVED denominator

**Denominator, derived rather than typed:** `grep -acE '^### (CR|WR|IN)-[0-9]+:'` over
`31-REVIEW.md` with fenced regions stripped → **13**, equal to the review's own frontmatter
(`critical: 4, warning: 6, info: 3, total: 13`). Plus **1** regression recorded in
`31-VERIFICATION.md`'s `regressions:` block. **14 items. 14 rows. No item without a row.**

### 10.1 Block A — the thirteen findings of `31-REVIEW.md`

| # | Item | Dispositioned by | Measured now | Outcome |
|---|---|---|---|---|
| 1 | `CR-22` — the one-root rule stops at the branch the reproduction walked | `31-33` — FIX (D-34 (1)) | positions 1, 2, 3 all MOVED (§2.1); position 4 not drivable from outside the module | **CLOSED at three of four positions; position 4 ACCEPTED-AS-RESIDUAL as `R-31-33-02`** |
| 2 | `CR-23` — the identity cutover deleted two live bans | `31-34` — FIX (D-35) | all four positions MOVED or confirmed (§2.2), both halves of the discriminant refuse | **CLOSED** |
| 3 | `CR-25` — `SURFACE_DEPTH_BOUND` is a silent fail-OPEN | `31-35` — FIX (D-36) | over-bound now EXIT=2 with a named cause; confound MOVED; container control holds (§2.4) | **CLOSED** — with the index-signature remainder disclosed and carried |
| 4 | `CR-24` — the `ReadPositionRefusal` discriminant ignored by its own caller | `31-33` — FIX (D-34 (3)) | EACCES → `unopenable`, over-ceiling → `above-ceiling`; arms 3 → 5, spread from the authority (§2.3) | **CLOSED** |
| 5 | `WR-31` — every CONTROL row is actually a refusal | `31-36` — FIX (D-37 (1), D-37 (3)) | all four controls print `ordinary outcome (correct)`; the RED path DRIVEN through the seam, 5 failures including a discrimination premise (§2.5) | **CLOSED** |
| 6 | `WR-32` — one hand-typed spelling of the refusal, over `git ls-files` only | `31-36` — FIX (D-37 (2), D-37 (4)) | `REFUSAL_SPELLINGS` enumerates four spellings incl. `equals-false` and `not-equals-true`; mirrors generated from that set; `candidateSources` unions tracked + walked (§2.5) | **CLOSED structurally**; the external re-drive named as not-performed (§1.2) |
| 7 | `WR-33` — §6.1 states three functions were deleted; all three are live | `31-37` — FIX | greps unchanged (2/2/2 — the three ARE live); §6.1 now opens with a dated correction quoting the false sentence and re-taking the disposition (§2.5) | **CLOSED** |
| 8 | `WR-34` — `harness-false-result-instances.md` row 13 describes a fix not in the tree | `31-37` — FIX | `grep -c factory.config.json` still **1** (comment only); row 13 corrected against the tree, with the restore criterion carried (§2.5) | **CLOSED** |
| 9 | `WR-35` — `.temp` in `SKIPPED_DIRECTORIES` narrows every host's denominator | `31-32` — DISCLOSE, not revert (D-33 (5)) | the set is still 5; the narrowing now emits a named stderr disclosure with per-directory hit counts, and the unaffected run stays byte-identical (§2.5) | **ACCEPTED-AS-RESIDUAL** — the silence is closed, the narrowing is retained by a named human's prior sub-decision. §12 |
| 10 | `WR-36` — the wrapper's delivered-root validation strictly weaker than the reader's | `31-37` — FIX (D-38) | the wrapper applies all five conditions (`:441`–`:456`); `TRUSTED_ROOT_TIERS[0]` states its provenance; a shared-corpus subset case with a vacuity guard exists (§2.5) | **CLOSED** |
| 11 | `IN-16` — `TEST_INFO_CANONICAL_HEAD` outlived its mechanism | `31-32` — DELETE | zero occurrences under `scripts/` or `hooks/` (§2.6) | **CLOSED** |
| 12 | `IN-17` — a doc block spliced mid-sentence | `31-32` — FIX | `:2612-2620` reads as one whole paragraph; no orphaned clause (§2.6) | **CLOSED** |
| 13 | `IN-18` — `drivePosition` constructs a shape it has decided to skip | `31-36` — FIX | `:447-454` skips without constructing; DRIVEN through `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT` (§2.6) | **CLOSED** |

### 10.2 Block B — the regression, and the parse artifact

| # | Item | Dispositioned by | Measured now | Outcome |
|---|---|---|---|---|
| 14 | the **REGRESSION** — the full excluded-e2e suite RED at the round base, on a self-referential coverage oracle | `31-32` — REMOVE THE AXIS (D-33) | suite **GREEN**: 66 files, 4208 passed, 2 skipped, EXIT=0 (§8.1). The mechanism is measured gone: `REVIEW_MD` 0, `CORPUS_COVERAGE` comment-only, no run-time read of `31-REVIEW.md` | **CLOSED — and the obligation it carried is discharged as a one-shot in §9, with its weakness stated** |
| — | the "**Skipped entries** finding" the convening brief enumerated as a fifteenth item | — | **Not a finding.** A `##` heading inside `CR-24`'s fenced `render()` transcript (§6.1) | **NOT AN ITEM — folded into CR-24's row, and the parse artifact recorded so it is not carried forward** |

### 10.3 Block C — the seven anti-pattern rows of `31-VERIFICATION.md`

| Anti-pattern row | Belongs to | Measured now | Outcome |
|---|---|---|---|
| `context-io.ts` — the fall-through precedes the derivation; `admitAndAppend` keys on two parameters | `CR-22` | derivation at the function's ENTRY, above every branch; `admitAndAppend` derives at its entry too | **CLOSED** (row 1) |
| `uat-spec-integrity.ts` — `resolveBannedModifier`'s `foreign` short-circuit | `CR-23` | `foreign` split by provenance; `IDENTITY_BAN_OPERAND` is the one consumption authority | **CLOSED** (row 2) |
| `uat-spec-integrity.ts` — the bounds degrade silently | `CR-25` | a reached bound routes to exit 2 with `SURFACE_TRUNCATED_CAUSE` | **CLOSED** (row 3) |
| `context-io.ts` — `readRawNotesWithSkips`'s catch discards the discriminant | `CR-24` | the arm is read from `ReadPositionRefusal.condition` | **CLOSED** (row 4) |
| `uat-spec-integrity.test.ts` — `CORPUS_COVERAGE` is a set literal mirroring a moving document | the regression | the axis is deleted; the floor is AST-measured | **CLOSED** (row 5) |
| `check-platform-shapes.ts` — a control asserts absence-of-a-string | `WR-31` | the control asserts its ordinary outcome positively, with a driven red path | **CLOSED** (row 6) |
| `browser-uat-recipe.md` — claim/mechanism divergence on `describe` and the missing bounds | `CR-23` + `CR-25` (documentation) | the recipe was rewritten by `31-34` (the ban set's reachability) and `31-35` (both bounds published as verbatim bullets, asserted in both directions). **Not independently re-read line-by-line here**; the both-directions register assertions that bind it are green inside the suite | **CLOSED by the bindings; the line-by-line re-read is named as not-performed** (row 7) |

### 10.4 Block D — the six `missing:` bullets of `31-VERIFICATION.md`

| `missing:` bullet | Gap | Measured now | Outcome |
|---|---|---|---|
| move the one-root derivation to the FIRST line of `promoteAdmitted`, above the fall-through | UATX-01 | done; the fall-through receives the derived root (§2.1) | **CLOSED** |
| give `admitAndAppend` the identical treatment, declining `destination-outside-governed-store` | UATX-01 | done; its gated branch appends at the derived root (§2.1) | **CLOSED** |
| add a DERIVED test enumerating every `appendAuditLedger` call site, asserting each root argument | UATX-01 | `D-34 (2)` — the axis is asserted over a set derived from the module's own AST | **CLOSED** |
| make `foreign` non-terminal for a head the framework does not declare, **or** delete the members and record it | UATX-06 | the first branch taken, via `split-foreign-by-provenance`; the alternative was measured and refused (`union-head-declared-exemption` leaves `expect.soft` open) | **CLOSED** |
| make a truncated walk report `truncated: true` and route to could-not-run; register both bounds; add a boundary-pair corpus row | UATX-06 | all three done (`SURFACE_TRUNCATED_CAUSE`, both bounds exported and registered, rows `CR25-UNDER-BOUND-refused` / `CR25-OVER-BOUND-could-not-run` / `CR25-BAND-no-accept`) | **CLOSED** |
| re-derive and re-bisect the exact depth at which the fail-open occurs; reconcile the two documents' numbers to one | UATX-06 | `D-36` reconciled to ONE written-down construction — **7 hops refused / 8 accepted at the base**, which is `31-VERIFICATION.md`'s number and not `31-REVIEW.md`'s; neither prior document edited | **CLOSED** |

### 10.5 The ledger's totals, as an equality

```
  13 review findings + 1 regression                    = 14 items
  CLOSED                                               = 12   (CR-22 at 3 of 4 positions, CR-23,
                                                               CR-25, CR-24, WR-31, WR-32, WR-33,
                                                               WR-34, WR-36, IN-16, IN-17, IN-18,
                                                               the regression — CR-22 counted once)
  ACCEPTED-AS-RESIDUAL                                 =  1   (WR-35)
  CARRIED-WITH-OWNER, inside an otherwise-closed row   =  2   (R-31-33-02, the index-signature shape)
  items with no row                                    =  0
```

**No row asserts a closure this session did not measure.** `CR-22` is the one item whose row is split:
three positions closed by measurement, the fourth published as a residual by the plan that owned it
rather than claimed. That split is stated in the row rather than rounded to "closed".

---

## 11. The round's residual register — every boundary round 7 decided to leave open

Each row carries the reason it is open and **what would force it closed**, so round 8 starts from a
lookup rather than a rediscovery.

### 11.1 The write path

| Id | Boundary | Why it is open | What would force it closed | Owner |
|---|---|---|---|---|
| `R-31-33-01` | `admit()` cannot take a ledger root distinct from its dial root | `admit()` is byte-frozen (`ADMIT_FROZEN_SHA256`, re-measured equal in §8.3) and takes ONE root for both questions. `31-33` measured the alternative: routing the RECORD through a derived root routes the DIAL through it too — **63 existing cases went RED on the dial** | unfreezing `admit()` and splitting its two roots, which is a decision about the governance dial and not about the write path | `31-33`, published |
| `R-31-33-02` | `promoteAdmitted`/`appendNote`'s DEFAULT arguments split kit and host (`DEFAULT_CONTEXT_ROOT` vs `trustedRepoRoot()`) | closing it decides where the shared verified context lives by default, which reverses either `WR-10` or `DEFAULT_CONTEXT_ROOT` itself. **Not drivable from outside the module**: `DEFAULT_CONTEXT_ROOT` is not exported (measured), and observing the split needs a `~/.grugops` kit beside a separate host repo | a named decision about the default store location under the shipped shared-install model, then a probe in that layout | `31-33`, published |
| `R-31-21-01..04`, `R-31-29-01` | the four pre-existing write-path residuals plus `31-29`'s | carried from earlier rounds, all members of `WRITE_PATH_RESIDUALS` (7 total, §8.5) | their own criteria, recorded in the register | their own plans |
| refusing an ungoverned `contextRoot` at `appendNote`/`admitAndAppend` | **REJECTED with the number that rejected it** | 121 and 26 existing call sites; and it reverses `D-31`'s deliberate decision that the destination constraint is the re-binding route's property | a decision to make the constraint universal rather than route-scoped | `31-33`, recorded |

### 11.2 The UAT-spec modifier ban — `UNRESOLVABLE_CALLEE_RESIDUALS`, now 10 members

| Member | Why it is open | What would force it closed | Owner |
|---|---|---|---|
| the installed-package magnitude behind `SURFACE_DEPTH_BOUND` (6) and `SURFACE_NODE_BOUND` (4096) | **`UNKNOWN - verify`.** Whether the real `@playwright/test` declared surface exceeds either bound cannot be measured here: `CLAUDE.md` fixes the dependency set at `{typescript, vitest}`, so the package cannot be installed. `D-36` closed the bound's DIRECTION (a reached bound is now exit 2, measured); its MAGNITUDE on the installed-package route is not established | a measurement on a host with `@playwright/test` actually installed | unassigned; carried as an `UNKNOWN - verify` |
| `RR-13` — a head the spec file hand-`declare`s for itself stays accepted | the shape is **structurally identical to `WR-26`'s own control**, which the phase pays a false refusal for every time it widens this rule. `31-34` disclosed and DROVE it rather than closing it | a rule that distinguishes a spec-local `declare const describe` from `WR-26`'s legitimate local binding, without re-opening the false refusal | `31-34`, published |
| the INDEX-SIGNATURE shape (`t.bag.anything.skip` accepted at exit 0) | **pre-existing** — measured identically at `31-35`'s base. The walk reads declared PROPERTIES; an index signature is not one, so no bound is reached and nothing is truncated. Disclosed as a register member and DRIVEN by corpus row `CR25-INDEX-SIGNATURE-open`, which asserts the ACCEPT so the disclosure cannot quietly stop being true | reading a type's INDEX INFOS beside its properties — which widens the walked set and therefore moves the denominator of every coverage assertion, a separate decision | `31-35`, published |
| `frameworkSurface`'s two inner `catch` blocks | found by `31-35`'s own probe of its own fix, **by reading rather than by reproduction**. `D-36` made every arm that STOPS the walk report itself, but `catch { continue; }` around `getPropertiesOfType`/`getSignaturesOfType` and the per-property one around `getTypeOfSymbolAtLocation` still swallow a subtree with no signal. **NOT reproduced**: making a real checker throw there needs a compiler fault this repository cannot synthesise, and a fix asserted against an unreproducible premise is the shape this phase keeps logging | a synthesisable checker fault, or routing both catches through the same truncation record the bounds now use | `31-35`, `status: open` in `deferred-items.md` |
| `R-31-31-01` — the ambient `declare const it: unknown;` spelling | re-driven here: `0 findings`, EXIT=0, **`tsc` EXIT=2** (`TS2440`). By `31-28`'s own recorded standard a construct the language refuses is a curiosity rather than a bypass — and that standard is this phase's, which is why it is carried rather than dismissed | a corpus row driving it with the compile error asserted as the reason it cannot run, or a register member naming it | carried from `31-31`; not taken by any round-7 plan |
| the two options `D-35` REFUSED | `union-head-declared-exemption` — **measured shortfall**: leaves `expect.soft` open, because `@playwright/test` DOES declare `expect`. `delete-retained-members` — a **disclosed gate lowering** | a named human re-taking the choice against a new measurement | `31-34`, recorded with the measurement that rejected each |
| `RR-02`, `RR-04'`, `RR-06`, `RR-11`, `RR-12` and the rest of the 10 | carried from earlier rounds | their own criteria, in the register | their own plans |

### 11.3 The walk's input boundary, and the harness

| Item | Why it is open | What would force it closed | Owner |
|---|---|---|---|
| **`.temp` in `SKIPPED_DIRECTORIES`** (`WR-35`) | `D-33 (5)`: reverting it would reverse a named human's `D-30` sub-decision inside an agent-authored fix plan. The narrowing is therefore **DISCLOSED** rather than removed — measured: a target carrying a `.temp/uat/*.uat.spec.ts` now emits the named marker with per-directory hit counts on stderr, and the unaffected run stays byte-identical | a named human re-taking `D-30`'s sub-decision 3, or making the skip set configurable per host | `31-32`, published |
| **the review-to-corpus coverage is a ONE-SHOT, not a gate** (`D-33 (2)`) | a per-round recorded assertion cannot red between rounds. `CORPUS_ROW_FLOOR` (55, AST-measured, 56 live) bounds deletion by CARDINALITY but not by IDENTITY | an oracle that is not a per-round-rewritten planning artifact — e.g. a committed manifest under `docs/audit/` that the corpus and the review both point at | `31-32`, handed to each round's closing measurement |
| **the coverage predicate over-includes** (raised by THIS plan, §9.3) | neither predicate is derived from a rule separating row-shaped findings from the rest: predicate 1 says 2/5, predicate 2 says 5/5, and the gap is exactly `WR-35`/`IN-16`/`IN-17` — findings whose closure is a stderr line, an absence and a doc edit | a derived rule for "this finding is drivable as a UAT spec", so the denominator is the coverable set rather than the naming set | **raised here, unrepaired, owner: round 8's planner** |
| **the GOV-02 audit-ledger position dropped from `check-platform-shapes`** | a derived guard (AUTO-06, "exactly ONE governance-dial reader") fired **correctly**: the module writes a fixture, does not read a dial, and the predicate cannot tell those apart. The position was dropped rather than smuggled past the scan; driven-row count fell 17 → 13 | publish the two governance dial KEY NAMES from the one authority, the way `30-10` published `GOVERNANCE_CONFIG_RELPATHS` — then a probe composes the fixture without spelling either literal and the position is restored | unassigned; `status: open` |
| **four `TRUSTED_ROOT_RESIDUALS` are closed only on the Claude Code hook path** | `hosts: non-cc-hook-path` — `R-31-15-01`, `R-31-15-03`, `R-31-19-02`, `R-31-19-06` (§8.5). Tier 0 is a narrowing on ONE host, not a closure | a delivered-root channel on the other four host CLIs | the register |
| **`check:diff-disposition` — 78 findings over 39 elements** | pre-existing; clearing it means walking several earlier plans' clauses and writing their rows, and the gate's own remedy forbids the two shortcuts | a documentation pass over `05-pr-quality-gate.md`, `17-task-claim.md` and `18-context-compaction.md`'s frozen region | unassigned; `status: open` |
| **the multi-sentence disposition-row CLASS** | a row whose `before`/`after` is not exactly one clause covers nothing, silently, while reading as work done. No derived check catches it | a derived check over disposition-row shape | `31-29` |
| **fourteen of fifteen `mkfifo` call sites carry no platform guard** | measured as a SOURCE property on darwin; what a Windows run then does is explicitly not claimed | a `windows-latest` reading | their own plan |

### 11.4 The Windows remainder

Every probe in this document ran on **darwin 25.5.0 arm64, Node v24.12.0, and nowhere else.** The
Windows leg of each is `UNKNOWN - verify` and belongs to `R-03` (§13). This round adds four new
shapes to that remainder: the `CR-23` foreign-import positions, the `CR-25` truncation route, the
`CR-24` skip-arm rendering, and the `CR-22` entry-derived write path.

---

## 12. What this round did NOT do

1. **It did not re-run the round-base suite at `d484b9e`.** The RED reading is quoted from
   `31-VERIFICATION.md` row 7 as the pre-round figure, which is this table's convention; the
   regression's mechanism is separately measured gone at `MEASURED_AT`.
2. **It did not drive `WR-32`'s untracked-candidate or third-implementation probes**, because both
   require writing a `.ts` under `scripts/` and this plan writes no source.
3. **It did not re-read `browser-uat-recipe.md` line by line.** The both-directions register
   bindings that bind the recipe to the exported constants are green inside the suite; the manual
   re-read is named as not-performed.
4. **It did not repair anything it found.** §9.3's over-inclusive coverage predicate is recorded with
   an owner and left unrepaired, per the standing rule `docs/audit/31-round5-residuals.md` §12 item 6
   established and every closing plan since has inherited.
5. **It did not flip a requirement checkbox, a traceability row or the phase checkbox** (§13).
6. **It did not record a new decision id.** A closing measurement decides nothing.
7. **It did not rewrite any prior round's SUMMARY, PLAN, REVIEW or VERIFICATION.** Where this round
   disagrees with one — `CR-25`'s boundary, the `(e)` count, the "Skipped entries finding" — both
   values are printed and the disagreement is a row in §6.

---

## 13. The requirement rows, confirmed UNCHANGED

```
$ git diff --stat d484b9e..HEAD -- .planning/REQUIREMENTS.md
(empty — byte-unchanged over the whole round)
```

- `UATX-01` … `UATX-06` are all `- [ ]` at `.planning/REQUIREMENTS.md:120-125` — **unchecked.**
- All six traceability rows at `:212-217` read `| UATX-0N | Phase 31 | Gaps Found |` — **unchanged.**
- `.planning/ROADMAP.md:100` reads `- [ ] **Phase 31: Autonomous Manual Testing**` — **unchecked**,
  status `In Progress`.
- The ROADMAP's only movement over the round is its plan-progress LIST ENTRY (`31/31` → `37/38` and
  the matching prose line), measured by `git diff d484b9e..HEAD -- .planning/ROADMAP.md`:
  **2 changed lines, both counters, neither a checkbox.**

**Only a verification round may flip a requirement**, and this phase has now had seven rounds in
which the executing round believed it had closed the requirement. `npm run freshness:traceability`
passes at `MEASURED_AT`.

---

## 14. What the eighth verification round inherits

1. **Four Criticals closed by measurement at their filed coordinates** — `CR-22` (three of four
   positions), `CR-23` (four positions, both halves of the discriminant), `CR-24`, `CR-25` — each
   paired with its pre-round figure from the document that raised it.
2. **Fourteen round-6 control rows, all UNMOVED** — including the four closures (`CR-17`, `CR-18`,
   `CR-19`, `CR-21`) that had **not** been independently measured since round 6 and are measured
   here for the first time since.
3. **A green suite recorded as a floor, with the round-base RED beside it** — and a DERIVED doctrine
   paragraph showing that two of the four Criticals were decided by constants appearing **zero**
   times in any test file at that base.
4. **Every frozen floor re-measured whole**, including all 26 `DECIDER_MANIFEST` entries and not only
   the two this round moved.
5. **A coverage equality with both sides derived and its disagreement named** — 5/5 under one
   predicate, 2/5 under a stricter one, with the gap explained rather than rounded.
6. **A residual register with an owner and a closing criterion per row** (§11), including two items
   this round's own measurement raised and did not repair.

**Seven rounds, seven times the pattern held: a fix created or preserved its successor's defect.**
This round's fixes are the first in this phase to be measured against controls covering **every**
prior closure in **every** module they touched. That is evidence about this round; it is not a
prediction about the next one.

---

_Written 2026-09-11 by plan `31-38`, the closing measurement for gap-closure round 7._
_Measured at `3baab0d3378bd09fb8302505e013e19af9fe53ec` on darwin 25.5.0 arm64, Node v24.12.0._

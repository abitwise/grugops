# Gap-closure round 7 — the round-6 evidence re-measured against the finished tree

**Round:** 7 — the closing measurement for gap-closure **round 6** of Phase 31 (fix plans `31-27`,
`31-28`, `31-29`, `31-30`; this measurement plan `31-31`)
**Written:** 2026-09-10, by plan `31-31`
**Measured at:** commit `a6539e7` (`a6539e7471373de26fcd5478359a8cf47d29b579`), the round's final
commit before this plan's own, against the **committed `.js`** artifacts, with
`git status --porcelain -- scripts hooks agent-factory install docs .github vitest.config.ts package.json`
**empty**
**Round base:** `77123aa` (`77123aa8c66592f5bb85131d9fcb8bd3b18a3ea8`) — the commit before `31-27`'s
first, recorded as `plan_head_before` in `31-27-SUMMARY.md`. Every "over the round" range below is
pinned to it.
**Platform:** darwin 25.5.0 arm64 · Node **v24.12.0**
**Evidence source:** `.planning/phases/31-autonomous-manual-testing/31-VERIFICATION.md` (round 6,
`gaps_found`, 4/6) and `.planning/phases/31-autonomous-manual-testing/31-REVIEW.md` (round-5
gap-closure code review, `issues_found`, 5 critical / 5 warning / 2 info)
**Governing decisions:** `D-29` (`31-27`), `D-30` (`31-28`), `D-31` (`31-29`), `D-32` (`31-30`) — all
recorded in `31-CONTEXT.md`
**Predecessor record:** `docs/audit/31-round5-residuals.md`. This file follows its section shape
rather than inventing a new one. It follows it; it does not replace it. **A prior round's record is
history and is never rewritten** — where this round disagrees with one, **both values are printed
and the disagreement is a row.**

## What this artifact is for

A verification round reads source and committed artifacts. It does not read a planning conversation,
and it should not have to re-derive a probe from a fix plan's own fixture. This file exists so the
**seventh** verification round can start from five things it would otherwise have to rediscover:

1. a table pairing **every** reproduction the round-6 documents recorded with its post-round result,
   re-run with **the original document's own spelling**;
2. a CONTROL table re-driving every round-5 closure at the same commit, because round 6's fixes
   edited the very modules those closures live in;
3. a ledger row for **every** finding of `31-REVIEW.md`, every anti-pattern row and every `missing:`
   bullet of `31-VERIFICATION.md`, and every item of the round-6 dispositions file;
4. the no-silent-drop equality, asserted as COVERAGE rather than as cardinality;
5. a written register of the boundaries this round **decided to leave open**, with the reason and
   what would force each closed.

**The order of this document is deliberate.** The adversarial reproductions come FIRST (§2–§7) and
the suite comes afterwards (§8) as a floor. For **six** consecutive verification rounds on this phase
the green suite exercised **none** of the defects that round found. A closure round that led with its
suite figures would be leading with the one number six rounds have shown to be uninformative here.

---

## 1. The probe set, DERIVED from the source documents rather than from the fix plans

### 1.1 The derivation rule

A **reproduction block** is a place in `31-VERIFICATION.md` or `31-REVIEW.md` that records a probe
AND its measured outcome. The counts below were measured with a command rather than typed.

| # | Shape | Where | Count | Command that measured it |
|---|---|---|---|---|
| (a) | a row of the round-6 **Behavioral Spot-Checks** table | `31-VERIFICATION.md` | **18** | `awk '/^\| # \| Behavior/{f=1} f&&/^\| [0-9]+ \|/{c++} END{print c}'` |
| (b) | a numbered **finding heading** | `31-REVIEW.md` | **12** | `grep -cE '^### (CR\|WR\|IN)-[0-9]+:'` |
| (c) | an **anti-pattern** row | `31-VERIFICATION.md` | **9** | `awk '/^\| File \| Line \| Pattern/{f=1} f&&/^\| `/{c++} END{print c+0}'` |
| (d) | a `missing:` bullet across both gap entries | `31-VERIFICATION.md` | **6** | `awk` over the two `missing:` lists |
| (e) | a finding carrying its own fenced measurement | `31-REVIEW.md` | **9** | `grep -c 'Reproduced on this tree\|Measured on this tree'` |

The **(b)** count of 12 equals `31-REVIEW.md`'s own frontmatter (`critical: 5, warning: 5, info: 2,
total: 12`), derived and quoted rather than only quoted. §10 carries one disposition row per member of
(b), (c) and (d); §11 states the equality.

**The distinct probe denominator this session drove is 18 + 5 + 3 = 26**, composed as:

- **18** — every row of (a), each driven below;
- **5** — the review-only findings of (e) that no spot-check row carries: `WR-26`, `WR-27`, `WR-28`,
  `WR-29`, `WR-30`. (`WR-29` is counted here although its measurement block carries no
  "Reproduced on this tree" phrase — it quotes a measured stderr line at depth 631, which is a
  reproduction. Its inclusion is what makes 9 + 1 the honest reading of (e) rather than 9, and the
  difference is stated rather than absorbed.)
- **3** — the review-only VARIANTS inside `CR-18` that no spot-check row carries: the namespace
  spelling, the ambient `declare const` spelling, and the block-scoped CLASS control.

**26 derived. 26 driven. 0 not driven.** §4 states the two spot-check counts separately.

### 1.2 What is excluded, by name, so the exclusion is not silent

- **`IN-14` and `IN-15` carry no fenced reproduction.** `IN-14` is an observation about one `catch`
  clause and two unregistered residuals; `IN-15` is a one-line tidy-up plus a paragraph praising the
  round-5 record. Both are dispositioned in §10 against a measurement taken here, not against a
  re-run probe.
- **`WR-27`'s measurement is a HARNESS derivation, not a runnable probe.** The review measured
  `deriveFsBlockingSites` over three seeded mirrors. That function is private to
  `scripts/context-io-writer-set.test.ts`, so its re-drive is the suite's own — recorded as such in
  §3 rather than presented as an independent external reproduction.
- **The baseline figures** of the review's Summary paragraph (freshness, the guards, the suite
  counts, the frozen blob, the decider digests) are §8's business, not §2's.

### 1.3 The probe environment, and one constraint RE-MEASURED because this round moved it

Every AST probe ran against the committed `scripts/runnable-ref/uat-spec-integrity.js` from a probe
repository under `.temp/31-31-probe/<name>/` **inside this repository** (so `createRequire` resolves
`typescript` from the repository's own `node_modules`), with a `package.json`, a `tsconfig.json` and
a single spec at `uat/p.uat.spec.ts`.

**The round-5 probe SHAPE no longer decides anything, and that is a measured change this round
introduced.** `31-28`'s S2 cutover decides the ban by symbol identity against the framework's own
declaration files, so a probe root carrying only a `package.json` and a spec now answers:

```
node scripts/runnable-ref/uat-spec-integrity.js .temp/31-31-probe/cr18
COULD NOT RUN: the target repository's TypeScript could not create a program over the derived UAT
specs, so the modifier ban could not be decided by symbol identity and NOTHING is claimed about the
specs (the declarations of @playwright/test did not resolve, so no call could be decided by identity)
EXIT=2
```

That is the refusing direction and never a pass, but it means **every AST reproduction below was run
against a target equipped exactly as `31-28`'s own `equipTarget` equips one** — a `tsconfig.json`
(`ES2022`/`ESNext`/`Bundler`/`strict`/`skipLibCheck`, `include: ["**/*.ts"]`), a `node_modules`
symlink to this repository's, and `scripts/runnable-ref/fixtures/playwright-test.d.ts` copied to
`types/`. The equipment is a PREMISE of every AST row and is stated here once rather than assumed
eighteen times. **A reader who re-runs a round-5 transcript verbatim against an unequipped root will
measure `PROGRAM_UNAVAILABLE_REASON` and not the ban.**

Every context probe ran against the committed `scripts/context-io.js`, from roots created with
`mkdtemp` under the OS temp directory, each carrying `.git`, `.grugops/factory.config.json` and
`.grugops/context` — a **real governance root** by the module's own `governanceRootOf`, asserted per
root before any result was read. The trusted-root probes ran in a **child process** with `HOME`
overridden and **all three** root variables genuinely **removed**
(`env -u CLAUDE_PROJECT_DIR -u GRUGOPS_PROJECT_DIR -u GRUGOPS_HOST_DELIVERED_ROOT`, not blanked; the
child prints `claudeVarPresent:false grugopsVarPresent:false hostDeliveredPresent:false` as its own
premise assertion).

The `hooks/hook-entry.js` probes ran against a scratch kit copied **outside the repository tree**
(session scratchpad), invoked through the argv **derived from `hooks/hooks.json`** rather than typed
— `node "<kit>/hooks/hook-entry.js" admission-guard.js` for the `mcp__grugops__.*` matcher and
`… guard.js` for the `Bash` matcher, both read off the file:

```
$ node -e 'const h=require("./hooks/hooks.json"); for (const g of h.hooks.PreToolUse) for (const k of g.hooks) console.log(g.matcher, "->", k.command)'
Bash             -> node "${CLAUDE_PLUGIN_ROOT}/hooks/hook-entry.js" guard.js
mcp__grugops__.* -> node "${CLAUDE_PLUGIN_ROOT}/hooks/hook-entry.js" admission-guard.js
```

---

## 2. The reproduction pairing table — every round-6 reproduction re-run with its own document's spelling

Legend: **MOVED** = the round-6 result changed in the direction the owning plan committed to.
**UNMOVED** = the round-6 result is reproduced unchanged, which for a previously-PASSING row is the
evidence that nothing broke. **AGREES / DISAGREES** compares this session's figure with the owning
fix plan's own recorded post-fix figure.

### 2.1 CR-17 — the PreToolUse wrapper, driven at the entry `hooks.json` names

| Probe spelling | From | Round-6 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| an ordinary Bash payload against the unmodified manifest, `node hook-entry.js admission-guard.js < payload.json` | `31-VERIFICATION.md` row 1 | EXIT=0, 0 bytes stdout, 0 bytes stderr | **EXIT=0 in 66 ms**, 0 bytes stdout, 0 bytes stderr | **UNMOVED** (the control) | AGREES with `31-27` |
| `mkfifo scripts/checkpoints.js; timeout 12 node hook-entry.js admission-guard.js < payload.json` | `31-VERIFICATION.md` row 2 / `31-REVIEW.md` CR-17 | **EXIT=124**, 0 bytes stdout, 0 bytes stderr | **EXIT=0 in 47 ms**, 788 bytes of `permissionDecision:"deny"` on stdout naming `manifest-path-not-a-regular-file`, 0 bytes stderr | **MOVED — CR-17 CLOSED** | AGREES with `31-27` D1 |
| the same, at **all thirteen** `DECIDER_MANIFEST` positions, the position list DERIVED from the committed `hook-entry.js` | `31-REVIEW.md` CR-17 (`:143-175`, "the thirteen manifest paths") | not driven position-by-position by either document | **13 of 13**: EXIT=0 in **46–50 ms**, 780–812 bytes of named deny on stdout, **0 bytes on stderr at every position** | **MOVED — the whole position set, not one call** | AGREES with `31-27` D1 (13 cases) |
| `mkfifo hooks/guard.js; … hook-entry.js guard.js` — the OTHER decider, the `Bash` matcher's own | derived from `hooks/hooks.json`; neither document drove it | — | **EXIT=0 in 47 ms**, named deny quoting `hooks/guard.js` | **MOVED — the rule is the wrapper's, not one decider's** | AGREES |
| a **DIRECTORY** at a manifest position (the rule is `fstat`, not a FIFO case) | `31-REVIEW.md` CR-17's fix sketch (`if (!st.isFile())`) | — | EXIT=0, the **same** `manifest-path-not-a-regular-file` deny | **MOVED** | AGREES with `31-27` D1 |
| `readFileSync(0, "utf8")` — a stdin whose writer never closes | `31-REVIEW.md` CR-17, `:237` ("named here so the fix covers the class") | the wrapper waits on the host, forever | **EXIT=0 in 10,100 ms**, deny naming *"terminated by SIGTERM before it reached a decision"* — the wrapper's own fd-0 read is DELETED and fd 0 is inherited by the child `DECIDER_TIMEOUT_MS` (10,000 ms) bounds | **MOVED — the class, not the one call** | AGREES with `31-27` D2 |

**The three facts the review said made CR-17 a blocker are each measured false of the tree now.**
It no longer disarms the tier (every position denies), it is no longer silent on both streams (stdout
carries a named deny at every position), and the fix that "already existed twelve hundred lines away"
is now restated inline in a file whose import list is still `node:` builtins only.

### 2.2 CR-18 and CR-21 — the UAT-spec modifier ban

| Probe spelling | From | Round-6 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| `import { test as it }; if (false) { function it(): void {} void it; } it.skip("scenario", …)` | `31-VERIFICATION.md` row 3 / `31-REVIEW.md` CR-18 | `0 findings over 1/1`, **EXIT=0** | `1 finding(s) over 1/1`, **EXIT=1**, `uat/p.uat.spec.ts:6: … test.skip` | **MOVED — CR-18 CLOSED** | AGREES with `31-28` RED 1a |
| the CONTROL — the identical file with the `if (false) { … }` block removed | `31-VERIFICATION.md` row 4 | `1 finding(s)`, EXIT=1, naming `test.skip` | `1 finding(s) over 1/1`, EXIT=1, `:2: … test.skip` | **UNMOVED** | AGREES |
| the NAMESPACE family — `import * as pw; if (false) { function pw(): void {} } pw.test.skip(…)` | `31-REVIEW.md` CR-18 (the verifier did NOT run it) | `0 findings over 1/1`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, `:6: … test.skip` | **MOVED — CR-18's namespace spelling CLOSED** | AGREES with `31-28` |
| the ambient spelling — `declare const it: unknown;` beside `import { test as it }` | `31-REVIEW.md` CR-18 point 3 ("a second spelling of the same hole") | `0 findings`/EXIT=0 for both families | **`0 findings over 1/1`, EXIT=0 — UNMOVED.** The file does **not** compile: `tsc --noEmit --strict` reports `TS2440: Import declaration conflicts with local declaration of 'it'` | **UNMOVED as an outcome; RECLASSIFIED by measurement** — a construct the language refuses to compile is a curiosity, not a live bypass, and it is recorded as a residual in §12 with an owner rather than as a closure | **DISAGREES with the `missing:` bullet's ask** — see §6.1 |
| the CONTROL — a block-scoped CLASS (`{ class it {} void it; }`) | `31-REVIEW.md` CR-18's own control | `1 finding(s)`, EXIT=1 | `1 finding(s) over 1/1`, EXIT=1, `:6: … test.skip` | **UNMOVED** | AGREES |
| `test("scenario", { tag: "@smoke" }, async ({ page }, testInfo) => { testInfo.skip(); … })` | `31-VERIFICATION.md` row 7 / `31-REVIEW.md` CR-21 | `0 findings over 1/1`, **EXIT=0** | `1 finding(s) over 1/1`, **EXIT=1**, `:3: … test.info().skip` | **MOVED — CR-21 CLOSED** | AGREES with `31-28` RED 3 |
| the CONTROL — the identical scenario in the two-argument form | `31-VERIFICATION.md` row 8 | `1 finding(s)`, EXIT=1, naming `test.info().skip` | `1 finding(s) over 1/1`, EXIT=1, `:3: … test.info().skip` | **UNMOVED** | AGREES |

### 2.3 CR-19 and CR-20 — the write path

| Probe spelling | From | Round-6 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| `appendNote("T-1", {security-nfr/observation}, "x".repeat(9*1024*1024), <ctx>, undefined, <root>)` | `31-VERIFICATION.md` row 9 / `31-REVIEW.md` CR-19 | **`WROTE <id>`**, EXIT path clean, no diagnostic | **REFUSED at the write side**: `context-io.writeNoteFile: refusing to write (note-above-size-ceiling) — the composed note under id "…" is 9437339 bytes, above the 8388608-byte ceiling every reader of this store enforces. … No file was written and no directory was created.` | **MOVED — CR-19 CLOSED** | AGREES with `31-29` |
| the immediately following `readContext("T-1", <ctx>)` | `31-VERIFICATION.md` row 9 | array length **0** — the note is invisible to every reader | array length **0** — because **nothing was written**. The two zeros mean opposite things and the difference is the closure | **MOVED in cause, not in number** — see §6.2 | AGREES |
| the CONTROL — a small note through the same call | this session (the premise assertion that caught a harness fault, §7.3) | — | `WROTE 20260910T033000Z-qe-observation-1238eb59`; `readContext` → **1** | **UNMOVED** — legitimate input is untouched by the refusal | AGREES |
| the idempotent re-write of identical bytes at the same precomputed id | `31-VERIFICATION.md` row 10 | `THREW: refusing to write (note-path-not-a-regular-file) — … is not absent, or a regular file` — **false of the file** | `refusing to write (note-above-size-ceiling) — the note destination "…" **IS a regular file**, and it is …` | **MOVED — the clause names the true condition** | AGREES with `31-29` |
| an over-ceiling REGULAR file already on disk, then `readContext` | `31-REVIEW.md` CR-19 point 2 | the reader's `catch { continue; }` swallows it silently | `readContext` → 0; `render()` emits a **`## Skipped entries`** section naming the entry and its arm | **MOVED — the silence is gone** | AGREES with `31-29` IN-14 |
| three REAL governance roots, `promoteAdmitted(T-1, id, …, from = ORIGIN, to = THIRD, repoRoot = DEST)` | `31-VERIFICATION.md` row 11 / `31-REVIEW.md` CR-20 | `PROMOTED`; **THIRD notes: [the finding], THIRD ledger: 0 lines / ABSENT; DEST ledger: 1 line; DEST notes: []** | `PROMOTED`; **THIRD notes: [the finding], THIRD ledger: 1 line; DEST notes: [], DEST ledger: ABSENT** | **MOVED — CR-20 CLOSED.** The note and its GOV-02 event are in ONE repository, and it is the destination's | AGREES with `31-29` |
| the CONTROL — the legitimate promotion, `to` and `repoRoot` under the SAME root | this session (the "re-run every caller with a LEGITIMATE input" rule) | — | `PROMOTED`; DEST2 notes: [the finding]; DEST2 ledger: **1** | **UNMOVED** — the constraint refuses nothing legitimate | AGREES with `31-29` |
| a `to` that is not a governed store at all | `31-REVIEW.md` CR-20's fix sketch (`destination-outside-governed-store`) | — | `DECLINED (destination-outside-governed-store)`, nothing written | **MOVED — the new clause exists and fires** | AGREES with `31-29` |

### 2.4 The five Warnings

| Probe spelling | From | Round-6 result | This round | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| `helper(1, function (a, it) { return it.skip(a); });` beside a legitimate renamed scenario | `31-REVIEW.md` WR-26's own spec | `1 finding(s) over 1/1`, EXIT=1, naming `test.skip` — a construct absent from the file | **`0 findings over 1/1`, EXIT=0** | **MOVED — WR-26's false refusal CLOSED** | AGREES with `31-28` |
| `deriveFsBlockingSites` over three seeded mirrors (an arrow, a class method, the `if (isMain)` block) | `31-REVIEW.md` WR-27 | all three → **5 sites, unchanged** — invisible to the axis | the derivation now walks from the SourceFile with `ts.forEachChild` and attributes each site to its nearest named enclosing scope (`scripts/context-io-writer-set.test.ts:3468`); the three seeded mirrors are watched-fail controls inside the green suite | **MOVED — WR-27 CLOSED**, re-driven through the harness's own mirrors (§1.2) | AGREES with `31-29` |
| a two-operation forgery inside a repository with `.git` and **no** `factory.config.json` | `31-REVIEW.md` WR-28 | `PROMOTED` — so the stated price of three is off by one at a position the register itself names | **`PROMOTED 20260910T033000Z-security-nfr-finding-029151c5`**, dest notes hold it, dest ledger 1 | **UNMOVED as a capability — which is the point.** The CAPABILITY is `T-31-18-01`, accepted by design; what moved is the stated PRICE, now per position in all three artifacts | AGREES with `31-29` |
| the four could-not-run reasons, at nesting depth 631 | `31-REVIEW.md` WR-29 | stderr byte-identical to a walk fault — the two are indistinguishable | stderr reads **`could not be PARSED (…); the parser itself faulted on this file`**, distinct from the walk arm's **`could not be analysed (…); the check was NOT performed for that file`**. Four arms at `uat-spec-integrity.ts:2614`, `:2622`, `:2628`, `:2648`, pairwise distinct | **MOVED — WR-29 CLOSED** | AGREES with `31-28` |
| `function wrapper() { it.skip(…); using it = …; }` | `31-REVIEW.md` WR-30's own spec | `0 findings over 1/1`, **EXIT=0** | `1 finding(s) over 1/1`, **EXIT=1**, `:3: … test.skip` | **MOVED — WR-30 CLOSED** | AGREES with `31-28` |
| the `await using` variant | `31-REVIEW.md` WR-30's fix sketch (`(nodeFlags.AwaitUsing ?? 0)`) | asserted misclassified | `1 finding(s)`, EXIT=1 — and `31-28` measured that it was **never** misclassified on typescript 6.0.3, because `AwaitUsing` (6) carries the `Const` bit (2) | **UNMOVED — and the Warning's own fix sketch is a no-op for this half**, recorded as a disagreement in §6.3 | AGREES with `31-28`'s recorded correction |

### 2.5 The two Info items

| Item | From | Round-6 result | This round | Verdict |
|---|---|---|---|---|
| `readRawNotes`' single `catch { continue; }` covering three facts with one silence | `31-REVIEW.md` IN-14 | one behaviour, no diagnostic | `NOTE_SKIP_ARMS = ["unparseable","not-a-regular-file","vanished"]`, exported; `render()` emits a conditional `## Skipped entries` table naming each entry's **arm** and **detail**. Driven with one unparseable file and one FIFO beside one live note: **2 entries, 2 distinct arms, 1 live note read** | **MOVED — IN-14 CLOSED** for its first half; the register half is `WRITE_PATH_RESIDUALS`, 5 members (§8.5) |
| `canonicalAssertionHead` splitting the same string twice | `31-REVIEW.md` IN-15 | two splits in one expression | `uat-spec-integrity.ts:2382`: `const head = dottedPath.split(".")[0];` then `ASSERTION_HEADS.includes(head) ? head : null` — **one split, into a local both positions read** | **MOVED — IN-15 CLOSED** |

---

## 3. The round-5 control ledger — every round-5 closure re-driven in the modules round 6 edited

`31-28` deleted the mechanism `CR-14`'s closure lived in; `31-27` and `31-29` both edited the module
`CR-12`'s, `CR-13`'s and `CR-16`'s closures live in. **These controls are the round's own regression
evidence, not a courtesy.** Each was re-driven at `a6539e7` with its round-5 spelling.

| Round-5 closure | Probe spelling | Round-5 result (`31-round5-residuals.md` §2) | This round | Verdict |
|---|---|---|---|---|
| **CR-12** | `mkfifo <ctx>/T-9/notes/<id>.md`, then `appendNote` at that precomputed id | EXIT=0 in 43 ms, `REFUSED (note-path-not-a-regular-file)`, position still a FIFO | **`REFUSED note-path-not-a-regular-file` in 1 ms**, position still a FIFO (`isFIFO() === true`) | **UNMOVED — intact** |
| **CR-12** control | the ABSENT note path through the same route | `WROTE …`, EXIT=0 in 54 ms | `WROTE 20260910T033000Z-qe-observation-86330d42` in **1 ms** | **UNMOVED** |
| **WR-22 / CR-12's second position** | `mkfifo <dest>/.grugops/audit/admissions.jsonl`, then `promoteAdmitted` | EXIT=0 in 59 ms, `DECLINED (unreadable-audit-ledger)`, `DEST-BEFORE []` → `DEST-AFTER []` | **`DECLINED unreadable-audit-ledger` in 1 ms**, `DEST-BEFORE []` → `DEST-AFTER []`, ledger still a FIFO | **UNMOVED — and now planted at the DESTINATION's ledger**, which is the root `31-29` re-aimed the route at. `31-29` recorded re-aiming this driver rather than re-baselining it |
| **CR-13** | `HOME` at a planted repository root carrying `.git` + `human_admission: high-severity`, all root variables removed, cwd inside it | `trustedRepoRoot()` → the planted home repository; dial `high-severity`; the self-stamped finding REFUSED | `claudeVarPresent:false grugopsVarPresent:false hostDeliveredPresent:false`; `trustedRepoRoot()` → **the planted home repository** (its realpath); dial `high-severity`; `admission REFUSED (human_admission: high-severity)` | **UNMOVED — intact.** The answer is the **canonicalised** path (`/private/tmp/…` for a `$HOME` of `/tmp/…`) — `31-27`'s D-29 (4) ladder, recorded in §6.4 |
| **CR-13** control | the identical tree one level BELOW the real home, real `HOME` untouched | `trustedRepoRoot()` → the project; dial `high-severity`; REFUSED | identical | **UNMOVED** (`R-31-19-01`, a documented residual, not a finding) |
| **CR-14** | `import { test as it }; it.skip("scenario", async ({page}) => { const it = 1; void it; … })` | `1 finding(s)`, EXIT=1, `:2: … test.skip` | `1 finding(s) over 1/1`, EXIT=1, `:2: … test.skip` | **UNMOVED — the census is GONE and the spelling is still refused** |
| **CR-14** namespace | `import * as pw; pw.test.skip(…) { const pw = 1; }` | `1 finding(s)`, EXIT=1 | `1 finding(s) over 1/1`, EXIT=1, `:2: … test.skip` | **UNMOVED** |
| **CR-15** | a spec containing 1,000 nested parentheses | **EXIT=2**, stdout 0 bytes, stderr carrying the named could-not-run reason AND the vacuity floor | **EXIT=2**, stdout **0 bytes**, stderr **310 bytes** carrying `could not be PARSED (Maximum call stack size exceeded)` AND `ZERO uat specs were visited (1 derived) — this check was NOT performed` | **UNMOVED as a verdict; the SENTENCE moved** (WR-29's closure) |
| **CR-15** depth family | depths 500 / 630 / 631 / 2000 / 5000 | 500 → EXIT=0; **630 → EXIT=0**; **631 → EXIT=2**; 2000 / 5000 → EXIT=2 | 500 → EXIT=0; **629 → EXIT=0**; **630 → EXIT=2**; 1000 / 2000 / 5000 → EXIT=2, byte-identical | **MOVED BY EXACTLY ONE LEVEL** — the adjacency is now 629/630, bisected here. Recorded as a disagreement in §6.5 |
| **CR-16** | an ordinary in-repository directory (`<root>/tmp/forged`) promoted into a FRESH destination id | `DECLINED (origin-outside-trusted-store)`, `destNotes: []`, `ledgerDelta: 0` | `DECLINED origin-outside-trusted-store`, dest notes `[]`, dest ledger `ABSENT` | **UNMOVED — intact** |
| **WR-23** | `function inner(n, it) { return it.skip(n); }` beside a legitimate renamed scenario | `0 findings over 1/1`, EXIT=0, stderr 0 bytes | `0 findings over 1/1`, **EXIT=0** | **UNMOVED — the false refusal stays closed** across the whole S2 cutover |
| **WR-24** | `shadowed-rename.uat.spec.ts`'s `MUTATE-REMOVE` region | region at lines 46 and 52 | `grep -n 'MUTATE-REMOVE'` → **46** (`START`), **52** (`END`) | **UNMOVED** |
| **WR-25** | a LEAN destination + a FORGED origin | `DECLINED (origin-outside-trusted-store)` | `DECLINED origin-outside-trusted-store` | **UNMOVED — the operand clause is still ahead of the dial clause** |
| **WR-25** | a LEAN destination + a GOOD origin | `DECLINED (human-stamp-not-gated-at-destination)` | `DECLINED human-stamp-not-gated-at-destination` | **UNMOVED — and the dial clause is not weakened** |
| **IN-12** | `stripRoutingLinks` computed once per predicate | one call per predicate at `:398`, `:439`; `:1920` a different consumer | `uat-spec-integrity.ts:491` and `:532` (one per predicate), `:2476` the per-chain dedup key — **four occurrences, one per arm** | **UNMOVED** across the cutover that rewrote the file around it |

**14 round-5 control rows. 14 driven. 13 UNMOVED. 1 MOVED (CR-15's depth adjacency, by one level,
in the safe direction).** No round-5 closure was lost by round 6's fixes, and the one that moved
moved its BOUNDARY, not its VERDICT: every depth past the boundary still answers EXIT=2 with the
named reason and the vacuity floor, and EXIT=2 is never a pass under D-12.

**One further control, this round's own new mechanism.** `31-27`'s tier 0 was driven with
`GRUGOPS_HOST_DELIVERED_ROOT` set to a planted governance root while both project-directory variables
were removed: `trustedRepoRoot()` answered the host-delivered root, its `off` dial was read, and the
note WROTE. `TRUSTED_ROOT_TIERS` is a published 5-member list read off the tree, whose tier 0 states
in its own words that it is *"available on the Claude Code hook path only"*.

---

## 4. The behavioral spot-check re-run table — the two counts, stated separately

**A closure that reports only the moved rows cannot show it broke nothing.** So the rows that FAILED
in round 6 and the rows that PASSED in round 6 are counted apart.

| Round-6 row | What it drives | Round-6 status | This round | Moved? |
|---|---|---|---|---|
| 1 | CR-17 control — ordinary payload, unmodified manifest | ✓ PASS | EXIT=0, 0/0 bytes, 66 ms | unmoved |
| 2 | CR-17 — FIFO at `scripts/checkpoints.js` | ✗ FAIL | EXIT=0, 47 ms, named deny | **MOVED** |
| 3 | CR-18 — block-scoped function declaration | ✗ FAIL | `1 finding(s)`, EXIT=1 | **MOVED** |
| 4 | control for row 3 — block removed | ✓ PASS | `1 finding(s)`, EXIT=1 | unmoved |
| 5 | CR-14's own spelling (round-5 closure) | ✓ PASS | `1 finding(s)`, EXIT=1 | unmoved |
| 6 | CR-15's own probe depth, 1,000 nested parens | ✓ PASS, recorded as `0 findings`/EXIT=0 | **EXIT=2** with the named could-not-run reason and the vacuity floor | **DISAGREES with the round-6 row** — see §6.5 |
| 7 | CR-21 — three-argument tag form | ✗ FAIL | `1 finding(s)`, EXIT=1 | **MOVED** |
| 8 | control for row 7 — two-argument form | ✓ PASS | `1 finding(s)`, EXIT=1 | unmoved |
| 9 | CR-19 — 9 MiB `appendNote` then `readContext` | ✗ FAIL | write REFUSED by name; `readContext` 0 because nothing was written | **MOVED** |
| 10 | follow-up for row 9 — the idempotent re-write's clause | confirms the false clause | clause is `note-above-size-ceiling` and the sentence says the file **IS** a regular file | **MOVED** |
| 11 | CR-20 — three governance roots | ✗ FAIL | note and ledger both in THIRD; DEST holds neither | **MOVED** |
| 12 | CR-16 (round-5 closure), reported not re-driven | ✓ PASS (reported) | `DECLINED origin-outside-trusted-store`, nothing written | unmoved — **and now DRIVEN rather than reported** |
| 13 | CR-12 (round-5 closure), reported not re-driven | ✓ PASS (reported) | `REFUSED note-path-not-a-regular-file` in 1 ms, FIFO untouched | unmoved — **and now DRIVEN** |
| 14 | CR-13 (round-5 closure), reported not re-driven | ✓ PASS (reported) | `trustedRepoRoot()` → the home-rooted repo; dial `high-severity`; REFUSED | unmoved — **and now DRIVEN** |
| 15 | full excluded-e2e regression suite | ✓ PASS, 62 files / 3908 tests | **64 files / 4128 passed / 2 skipped**, exit 0, 355 s | unmoved as a verdict; **+220 tests, +2 files** |
| 16 | committed-`.js` freshness | ✓ PASS, 60 files | `All build outputs fresh: **61** committed .js file(s) match a rebuild of their sources.` | unmoved as a verdict; **+1 file** (`scripts/check-platform-shapes.js`, `31-30`) |
| 17 | foundation guards / UAT oracles | ✓ PASS, both `ALL CHECKS PASSED` | both `ALL CHECKS PASSED`, guards in **<1 s** | unmoved |
| 18 | byte-frozen deploy guard | ✓ PASS | `git hash-object hooks/guard.ts` → `669725bc1c616ab57123e22090d93d57eff1b001` = `FROZEN_GUARD_BLOB` | unmoved |

### 4.1 The two counts

**18 rows. 18 driven. 0 not driven.**

- **6 rows carried a defect in round 6 — 2, 3, 7, 9, 10, 11 — and all 6 MOVED.** (Row 10 carries no
  ✓/✗ glyph in the source table; it is counted with the failing rows because what it records is a
  refusal clause that was false, and that is a defect.)
- **12 rows PASSED in round 6 — 1, 4, 5, 6, 8, 12, 13, 14, 15, 16, 17, 18 — and 11 are UNMOVED.**
  **Row 6 is the exception and is recorded as a disagreement rather than as an unmoved row** (§6.5).
- **3 of the passing rows — 12, 13, 14 — were REPORTED by the round-6 verifier and not driven by it.**
  All three are driven here, and all three hold.
- **No row in this ledger claims a closure without a quoted measurement taken in this session.**

---

## 5. The four requirements round 6 recorded SATISFIED, re-measured by their own mechanisms

A closure round that re-measures only the failing requirements cannot show that fixing them cost the
passing ones nothing.

### 5.1 UATX-02 — the browser-MCP pin authority

`node scripts/check-foundation-guards.js` reports, in its own words:

```
[guard_playwright_mcp_pin] every pinned mention of the browser MCP server across the kit and the docs
equals the ONE literal in the recipe (D-08 / UATX-02)
        pin `0.0.78` read from agent-factory/checklists/browser-uat-recipe.md (line 40);
        130 markdown file(s) walked across 5 of 5 configured root(s)
```

**The `package.json` claim, measured on both sides of the round rather than asserted:**

```
$ git show 77123aa:package.json  ->  dependencies {}  devDependencies {"@types/node":"~22","typescript":"~6.0.3","vitest":"~4.1.8"}
$ HEAD                           ->  dependencies {}  devDependencies {"@types/node":"~22","typescript":"~6.0.3","vitest":"~4.1.8"}
$ git diff --stat 77123aa..HEAD -- package-lock.json     (empty)
```

**`package.json` is NOT byte-unchanged over the round, and the one change is named rather than
glossed:** `31-30` added one SCRIPT, `"check:platform-shapes"`. It is a script, not a dependency; the
dependency sets are byte-identical and the lockfile is unchanged. `31-27`'s and `31-29`'s summaries
each record an empty `package.json` diff over their own narrower ranges, which is consistent — the
insertion belongs to `31-30`. **✓ SATISFIED, unmoved.**

### 5.2 UATX-03 — the attended Chrome lane's structural bar

```
$ npx vitest run --exclude '**/scripts/e2e/**' scripts/chrome-lane-bar.test.ts
Test Files  1 passed (1)      Tests  15 passed (15)
$ git diff --name-only 77123aa..HEAD -- scripts/chrome-lane-bar.test.ts     (empty)
```

The file is **untouched across the whole round** and green as its own file. This is the **structural**
bar; `R-01`'s real interactive behaviour is not inferred from it (§12.6). **✓ SATISFIED, unmoved.**

### 5.3 UATX-04 — the provenance routes (this plan's own flagged assumption #1)

This plan's `## Edge probe assumptions` row 1 assumed that none of round 6's twelve findings names the
provenance-carrying surface. **Flagged and MEASURED rather than assumed:**

```
$ git diff --name-only 77123aa..HEAD -- scripts/checkpoints.ts scripts/checkpoints.js scripts/chrome-lane-bar.test.ts
(empty)
$ npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "SHA"
Tests  42 passed | 525 skipped (567)
```

Driven directly against the committed `.js`, an `artifact-ref` naming a `gate_run` with no live green
verdict is refused:

```
admit(artifact-ref, gate_run "run-abc123") ->
  ["admission FAIL: no live green §14-gate verdict found for \"§14-gate#run-abc123\" under task
    \"T-1\". An artifact-ref naming gate_run \"run-abc123\" is evidence only when a real green gate
    verdict with that per-run id exists in the task context."]
```

**One limit of this probe, stated rather than absorbed.** The stale-SHA arm itself
(`sha` ≠ the verdict's `sha`) could **not** be driven from a hand-composed note, because a verdict
carrying `by: §14-gate` is refused first:

```
admit(gate verdict) ->
  ["structural FAIL: \"§14-gate\" is a reserved author identity (a grugops machine writer). A note
    may not be authored by it — this is an impersonation flag."]
```

Staging a live green verdict requires the sanctioned emitter, which this probe is not. **The
stale-SHA arm is therefore driven by the module's own 42 SHA-named cases, and that is recorded as the
instrument rather than claimed as an independent reproduction.** Both refusals run in the refusing
direction. **✓ SATISFIED, unmoved.**

### 5.4 UATX-05 — the two loud-skip markers

Read from the committed `.js` through a non-entry module, and driven:

```
PARSER_ABSENT_MARKER  = "SKIPPED: the target repository does not provide typescript — UAT specs NOT checked; the UAT status stays pending"
BROWSER_ABSENT_MARKER = "SKIPPED: no usable browser lane — UAT specs NOT exercised; the UAT status stays pending"

$ node scripts/runnable-ref/uat-spec-integrity.js <a target with no typescript>
SKIPPED: the target repository does not provide typescript — UAT specs NOT checked; the UAT status stays pending
EXIT=2      emission count of the marker: 1
```

**Single emission, EXIT=2, never a pass.** `31-28`'s cutover adds a THIRD refusing route beside these
two — `PROGRAM_UNAVAILABLE_REASON`, also at EXIT=2 (§1.3) — which widens the loud-skip family rather
than narrowing it. **✓ SATISFIED, unmoved.**

---

## 6. The disagreements and the reclassifications, recorded rather than absorbed

### 6.1 The ambient `declare` spelling — the mechanism the `missing:` bullet named is GONE, and the outcome it was about is UNMOVED

`31-VERIFICATION.md` gap 2's first `missing:` bullet asks for two things: narrow the `hoisted` arm to
the enclosing block, **and** *"treat an ambient (`declare`) binding as binding nothing at all"*.

The first half is closed by deletion: `31-28` removed `resolveBinding`, `bindingRangeFor` and
`listHoists` outright and decides the ban by symbol identity, so there is no `hoisted` arm to narrow.
The second half has **no corresponding mechanism in the new design** — an ambient `declare const it`
is a real declaration the checker resolves, and identity answers `foreign` for it.

**Measured:** `declare const it: unknown;` beside `import { test as it }` reports `0 findings`,
EXIT=0 — the same answer the review recorded. **Measured further, which the review did not:** the
file does not compile.

```
$ npx tsc --noEmit -p <probe>/tsconfig.json
uat/p.uat.spec.ts(1,10): error TS2440: Import declaration conflicts with local declaration of 'it'.
TSC EXIT=2
```

**This is the standard `31-28` itself applied** to three corpus rows whose expectations the language
reversed: *"A construct the language refuses to compile is a curiosity, not a bypass."* By that
standard this is a curiosity. **It is nonetheless recorded as an OPEN residual with an owner in
§12.4, not as a closure**, because (a) the outcome is unmoved from what the review measured, (b) no
member of `UNRESOLVABLE_CALLEE_RESIDUALS` names it, and (c) the standard being applied is this
round's own, which is exactly the kind of self-certification this document exists to refuse.

### 6.2 CR-19's two zeros mean opposite things

Round 6 and this round both measure `readContext` returning **0**. In round 6 that zero was
**silent data loss**: `appendNote` returned an id, the bytes were on disk (9,437,353 of them), and no
reader could see them. This round the zero is **nothing was written**: the write refuses by name
before `atomicWrite`, and the message says so — *"No file was written and no directory was created."*
The number is identical and the event is opposite. Recorded as its own row rather than folded into
"unmoved", exactly as `31-round5-residuals.md` §4.1 recorded the row-5 clause-name move.

### 6.3 WR-30's own fix sketch is a no-op for half the Warning

The review proposes `(nodeFlags.Using ?? 0) | (nodeFlags.AwaitUsing ?? 0)`. `31-28` measured on
typescript 6.0.3: `Let`=1, `Const`=2, `Using`=4, `AwaitUsing`=6 — so `AwaitUsing` **carries the
`Const` bit** and was never misclassified. Re-driven here: both spellings refuse
(`1 finding(s)`/EXIT=1). **The Warning's diagnosis was right for `using` and wrong for
`await using`, and the defect was half the size the Warning states.** Both readings printed; the
fixer's measurement is the one the tree agrees with.

### 6.4 CR-13's answer is the CANONICALISED path, not the literal `$HOME`

The round-5 record prints `trustedRepoRoot()` answering "the planted home repository". On darwin a
`$HOME` of `/tmp/r6-cr13-home-wVeT4k` canonicalises to `/private/tmp/r6-cr13-home-wVeT4k`, and that
is what the function answers — `31-27`'s D-29 (4) ladder, which canonicalises both sides of the
module-own comparison through `realpathSync.native`. A naive string equality against `process.env.HOME`
therefore reads `false` while the closure is intact. **Recorded so a later reader re-running the
round-5 transcript is not surprised by it**, and because a probe asserting the naive equality would
have reported CR-13 as reopened.

### 6.5 Spot-check row 6 disagrees with round 5's record AND with this round's measurement

`31-VERIFICATION.md` round 6, row 6, records a 1,000-deep nested-parentheses spec answering
`UAT spec integrity: 0 findings over 1/1 uat specs checked`, **EXIT=0**, and reads that as CR-15's
boundary fix holding.

`docs/audit/31-round5-residuals.md` §2.2 records the same construct at depth 1,000 answering
**EXIT=2** with the named could-not-run reason and the vacuity floor. This session measures **EXIT=2**
as well, at depths 630 / 1,000 / 2,000 / 5,000, with byte-identical 310-byte stderr.

**Three values, two of which agree.** The round-6 verifier's row 6 is the outlier. This document does
not rewrite it and does not resolve it by preference: the most likely reading is that the verifier's
"1,000-deep" spelling nested differently from the round-5 spelling this session reproduced, but
**that is a hypothesis and it is labelled as one.** What matters for the requirement is that EXIT=2
with the vacuity floor is inside the D-12 contract and is never a pass — so the disagreement is about
which side of the boundary a given spelling lands on, not about whether the boundary holds.

**The boundary itself MOVED by exactly one level and was bisected here:**

```
depth 500 … 629  -> EXIT=0, "0 findings over 1/1 uat specs checked"
depth 630        -> EXIT=2, stdout 0 bytes, stderr 310 bytes (could not be PARSED + the vacuity floor)
```

Round 5 and round 6 both bisected the pair at **630/631**. It is now **629/630**. One frame, consistent
with `31-28`'s cutover adding a Program creation to the path. Recorded because a later reader
re-running the round-5 adjacency pair verbatim will measure a disagreement at depth 630 and should
find the explanation here rather than file it as a regression.

---

## 7. The measurement environment, proven clean by predicates that can OBSERVE it

### 7.1 The tree, at the pinned commit

```
$ git rev-parse HEAD
a6539e7471373de26fcd5478359a8cf47d29b579
$ git status --porcelain -- scripts hooks agent-factory install docs .github vitest.config.ts package.json
(empty)
$ git diff --name-only a6539e7..HEAD -- scripts hooks agent-factory install .github vitest.config.ts package.json
(empty)
```

The repository's whole working tree is **not** empty — `.planning/milestone.lock`, `human-notes.txt`,
an untracked `.gsd/` and an untracked `.planning/state.json` were present before this plan began and
are unrelated to it. **They are named rather than elided**, and the assertion this plan makes is the
range-pinned one over the source paths, which is empty.

### 7.2 `.temp/`, the named-pipe sweep, and the residue predicate demonstrated INERT

```
$ find .temp -mindepth 1 -print | wc -l
0
$ find . -path ./node_modules -prune -o -type p -print
(nothing)
```

The `git status`-based residue predicate three rounds relied on is demonstrated blind once more, with
a planted file beside it:

```
$ printf 'planted\n' > .temp/31-31-inertness-probe
$ git status --short .temp
(EMPTY — the git-status predicate cannot see it)
$ git check-ignore -v .temp/31-31-inertness-probe
.gitignore:19:.temp/	.temp/31-31-inertness-probe
$ find .temp -mindepth 1 -print
.temp/31-31-inertness-probe          (the real-listing predicate CAN see it)
```

**268 entries under `.temp/` were created by this session's AST probes and all 268 were removed before
the gate battery ran.** The scratch kit used for the `hook-entry.js` probes lives outside the
repository tree entirely, and its own FIFO sweep is clean after every position was restored.

### 7.3 Every harness's premise, and the assertion that established it

| Harness | The premise it depends on | The assertion that established it |
|---|---|---|
| the 13-position CR-17 driver | the manifest position list is the committed `.js`'s, not a typed copy | the derivation exits non-zero on a zero-length result; it reported **13**, and the count is quoted beside the list |
| the `hook-entry.js` control | the scratch kit's modules hash EQUAL to the manifest, so a deny would be the FIFO's doing and not a stale copy's | the control run returned **EXIT=0 with zero bytes** — the ordinary allow, which a mismatched kit cannot produce |
| every `context-io` probe | the three roots are governance roots this module recognises | `governanceRootOf(<store>) === <root>` printed per root before any result was read |
| the trusted-root child process | all three root variables are genuinely REMOVED, not blanked | the child prints `claudeVarPresent:false grugopsVarPresent:false hostDeliveredPresent:false` as its first line |
| the CR-19 probe | a note UNDER the ceiling still writes through the same call | the CONTROL wrote and read back **1**, which is what caught the harness fault below |
| the frozen-hook-entry re-measurement | normalising the manifest region actually REMOVES something | `normalised.length < src.length - 100` asserted; **26,223 of 29,048 bytes**, 2,825 removed |
| the `DECIDER_MANIFEST` walk | the block is located and the entry count is non-zero | the walk exits non-zero on zero deciders; it reported **2 deciders, 26 entries** |
| the coverage-equality derivation | the assumption count is read from the plan files, not from the plan's own prose | derived **18** across five files, printed row by row in §9 |

### 7.4 One false result about a harness's own premise, logged as instance 14

**The ordinal is READ OFF `docs/audit/harness-false-result-instances.md`, which carries 13 rows.**

The first CR-17 position derivation took its manifest-block pattern from `hooks/hook-entry.ts`
(two-space indent) and ran it against the committed `hooks/hook-entry.js` (four-space indent). It
matched nothing; `wc -l` over the resulting empty variable answered **1**, the loop drove **0**
positions, and the summary line printed **"bounded, named, DENY at 0 of 0 positions"** — a green from
an empty denominator.

**How it was caught:** the printed denominator and the printed position list disagreed with each
other. The derivation was then rebuilt with an explicit non-zero premise assertion (`exit 1` on a
zero-length result) and re-run, giving 13.

**This is the THIRD occurrence in this phase of instance 4's exact shape** — a walk whose pattern was
taken from the `.ts` while the artifact it walked was the `.js`, reporting a vacuous pass. It is
logged as row 14.

---

## 8. The one-commit gate record — measured, and recorded as a FLOOR

### 8.1 The whole repository, at one commit, with a clean tree

Every figure below was taken at commit **`a6539e7`**
(`a6539e7471373de26fcd5478359a8cf47d29b579`) — the round's final source commit. The source trees were
verified untouched (§7.1) and no probe artifact was on disk (§7.2). Node **v24.12.0**, darwin 25.5.0
arm64.

**The gate list is DERIVED from `package.json`'s scripts block, not typed.** `node -e` over
`require("./package.json").scripts` reports **31** scripts. Three are excluded by name so the
exclusion is not silent: `test` (it resolves to the bare `vitest run` that pulls in the live
`claude --print` e2e lane — the project's standing convention forbids it), `test:e2e` (the same lane,
named directly), and `count:lines` (`tokei`, a metric rather than a gate). Every `generate:*` script
is a producer whose output its paired `freshness:*` gate checks, so the gate is run and the producer
is not. **That leaves the 20 gate commands below plus the four non-`package.json` runnables the
phase's own record has always included, for 24 rows.**

| # | Gate | Command | Terminal output line | Result |
|---|---|---|---|---|
| G1 | excluded-e2e regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 64 passed (64)` · `Tests 4128 passed \| 2 skipped (4130)` | ✓ exit 0, **354.9 s** |
| G2 | build | `npm run build` | `> tsc` (clean) | ✓ exit 0, 1 s |
| G3 | typecheck (3 projects) | `npm run typecheck` | `tsc --noEmit && tsc -p tsconfig.tests.json && tsc -p tsconfig.fixtures.json` (clean) | ✓ exit 0, 4 s |
| G4 | build parity | `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` | ✓ exit 0 |
| G5 | committed-`.js` freshness | `npm run freshness` | `All build outputs fresh: 61 committed .js file(s) match a rebuild of their sources.` | ✓ exit 0 |
| G6 | hook-manifest freshness | `npm run freshness:hook-manifest` | `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.` | ✓ exit 0 |
| G7 | catalog freshness | `npm run freshness:catalog` | `Catalog fresh: docs/catalog/README.md matches a fresh regeneration.` | ✓ exit 0 |
| G8 | context freshness | `npm run freshness:context` | `Context fresh: no .grugops/context/ tree exists yet — nothing committed to drift (vacuous pass).` | ✓ exit 0 — **and the vacuity is stated by the gate itself** |
| G9 | adapters freshness | `npm run freshness:adapters` | `Mirrored generator resolved model preset: none` | ✓ exit 0 |
| G10 | skill-twins freshness | `npm run freshness:skill-twins` | `Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal.` | ✓ exit 0 |
| G11 | guarantees freshness | `npm run freshness:guarantees` | `Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration.` | ✓ exit 0 |
| G12 | queue freshness | `npm run freshness:queue` | `Now-running fresh: no .grugops/queue/claimed/ tree exists yet — nothing committed to drift (vacuous pass).` | ✓ exit 0 — vacuity stated |
| G13 | traceability freshness | `npm run freshness:traceability` | `Traceability fresh: no .grugops/context/ notes tree exists yet — nothing committed to drift (vacuous pass).` | ✓ exit 0 — vacuity stated |
| G14 | audit register | `npm run check:audit-register` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G15 | residual citations | `npm run check:residual-citations` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G16 | claim anchors | `npm run check:claim-anchors` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G17 | banned claims | `npm run check:banned-claims` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G18 | writing profile | `npm run check:imperative-lexicon` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G19 | NUL bytes | `npm run check:nul-bytes` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G20 | platform shapes (NEW this round, `31-30`) | `npm run check:platform-shapes` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G21 | public-docs vocabulary | `npm run check:public-docs` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G22 | foundation guards | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` | ✓ exit 0, **<1 s** |
| G23 | UAT oracles | `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` | ✓ exit 0, **<1 s** |
| G24 | structure validator | `VALIDATE_KIT_ROOT=$PWD node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED` | ✓ exit 0 |
| G25 | diff disposition | `npm run check:diff-disposition` | `80 finding(s) over 39 elements` | ✗ exit 1 — **pre-existing debt that the round PAID DOWN; reconciled in §8.4** |

**Freshness's committed-output count, stated as a number: 61.** Round 5 measured 60.
`git diff --name-status 77123aa..HEAD -- '*.js'` adds exactly **one** file,
`scripts/check-platform-shapes.js` (`31-30`), and the count moved with it.

**A note on the suite log's own `FAIL` strings.** `grep -E '^\s*(FAIL|×)'` over the run log returns
four lines. All four are the MESSAGES the derived guards emit for their own seeded mutants, asserted
by passing watched-fail cases — the strings are the expected output, not a result. The summary line
is unambiguous and is the row above: `Test Files 64 passed (64)`, exit 0. Recorded because a reader
grepping the log for `FAIL` will find them.

**The suite moved as follows across the round**, each figure taken from the owning plan's own
measurement and re-measured here at the end:

| Point | Test files | Tests passed | Skipped |
|---|---|---|---|
| round-6 verification (`3a82d6f`) | 62 | 3908 | 2 |
| after `31-27` | 63 | 3992 | 2 |
| after `31-28` | 63 | 4039 | 2 |
| after `31-29` | 63 | 4091 | 2 |
| after `31-30` | 64 | 4128 | 2 |
| **this round, re-measured at `a6539e7`** | **64** | **4128** | **2** |

The file count rose by **2** (`scripts/nonblocking-reader-parity.test.ts` from `31-27`,
`scripts/uat-gate-exit-contract.test.ts` from `31-30`) and the test count by **220** across the
round's four fix plans. The 2 skips are the pre-existing ones. **The end-of-round figure AGREES with
`31-30`'s own.**

### 8.2 The doctrine, stated BESIDE the green rather than instead of it

**How many of round 6's five Critical defects did the green suite exercise before this round's
fixes? ZERO — for the sixth consecutive round on this phase.** That is not quoted from the two
documents that assert it; it is DERIVED, by asking whether the cases that catch each Critical today
existed in the suite at the round base:

```
                                                                 at 77123aa   at HEAD
CR-19   NOTE_ABOVE_CEILING_CLAUSE          in context-io.test.ts        0          2
CR-20   destination-outside-governed-store in context-io.test.ts        0          3
CR-20   governanceRootOf                   in context-io.test.ts        0          8
CR-21   tag: "@smoke"       in runnable-ref/uat-spec-integrity.test.ts  0          2
CR-17   mkfifo                             in hooks/guard.test.ts       2          4
```

**The constants and the spellings that decide four of the five did not appear anywhere in the suite
at the round base.** A suite that never names a clause cannot assert it. Today the five Criticals are
cited by name in the suite **7 / 4 / 10 / 12 / 6** times respectively. Round 5's own five Criticals
were established as unexercised by the same argument in `docs/audit/31-round5-residuals.md` §6.2, and
the round-6 verifier restates it in its own words for row 15:

> for the SIXTH consecutive verification round on this phase, exercises none of the newly-found
> defects (CR-17 through CR-21)

**G1 above is a FLOOR. It is not the argument. The argument is §2, §3 and §4.**

### 8.3 The frozen floors, RE-MEASURED rather than assumed

| Floor | Expected | Measured | Verdict |
|---|---|---|---|
| `FROZEN_GUARD_BLOB` (`scripts/floor-invariance.test.ts:245`) | `669725bc1c616ab57123e22090d93d57eff1b001` | `git hash-object hooks/guard.ts` → `669725bc1c616ab57123e22090d93d57eff1b001` | **EQUAL.** `hooks/guard.ts` was not touched and the blob was not re-based |
| `FROZEN_HOOK_ENTRY_LOGIC_SHA` (`:858`) | `e1ed0dc053f321dc54fa6a657cac6fdddf0816e839766f3e0c68ec5e3375cabc` | a fresh normalisation of `hooks/hook-entry.ts` with the manifest region replaced by `<MANIFEST REGION>` — **26,223 of 29,048 bytes, 2,825 removed** (the non-vacuity floor asserted first) → `e1ed0dc0…5cabc` | **EQUAL.** The baseline MOVED TWICE inside `31-27` (CR-17, then S1) and both re-takes are recorded in the constant's own history block with their intermediate values |

**The `DECIDER_MANIFEST` was re-measured as a WHOLE — every entry of both deciders' closures, not
only the entries this round moved**, because a stale entry elsewhere is the same class of drift:

```
decider hooks/admission-guard.js — 13 entr(ies)     13 yes, 0 no
decider hooks/guard.js           — 13 entr(ies)     13 yes, 0 no
TOTAL manifest entries: 26   matching current digest: 26   mismatched: 0
```

The walk asserts its own premise first (`exit 1` on zero deciders or zero entries) — the guard added
after instance 4 of the harness-false-result list, and the guard this round's own instance 14 (§7.4)
shows was still needed one level up. **26 entries, 26 matching, AGREES with `freshness:hook-manifest`'s
independently derived `2 decider(s), 26 module hash(es)`.** `scripts/context-io.js`'s digest moved
four times across the round (`31-29` records the chain `8625d976…` → `4035f1ab…` → `656688a3…` →
`60f62a48…`); the value on the tree is `60f62a48…`, the end of that chain. **A digest moved with its
artifact; none was relaxed.**

### 8.4 The `check:diff-disposition` debt — RE-MEASURED, and the round PAID IT DOWN

```
$ npm run check:diff-disposition
FAIL  diff disposition — changed watched file(s): 80 finding(s) over 39 elements
      watched corpus: 40 markdown file(s) of the 41-entry LANG-03 safety-surface union …
      frozen set: … 470 frozen clause(s), 55 frozen region(s); base 4d2b8f0
```

| Point | Findings | Elements | Source |
|---|---|---|---|
| round 5's closing measurement | **110** | 39 | `docs/audit/31-round5-residuals.md` §6.3 |
| after `31-27` | 110 | 39 | `31-27-SUMMARY.md` — not greater |
| after `31-28` | 103 | — | `31-28-SUMMARY.md` |
| after `31-29` | 103 | — | `31-29-SUMMARY.md` |
| after `31-30` | **80** | — | `31-30-SUMMARY.md` (`112 → 80`) |
| **this round, re-measured** | **80** | **39** | here |

**The debt FELL by 30 across the round and did not grow. The acceptance criterion is met: 80 ≤ 80.**

**The measuring stick did not move.** Base commit `4d2b8f0` — the value `31-30` recorded. Watched
corpus **40** markdown files — the value `31-30` recorded. Neither was narrowed and neither was moved
forward, which the gate's own remedy text names as the two ways to clear a finding by deleting its
evidence.

**The per-file table, derived rather than described:**

| File | Findings |
|---|---|
| `agent-factory/workflows/05-pr-quality-gate.md` | 38 |
| `agent-factory/workflows/06-uat-pack.md` | 25 |
| `agent-factory/workflows/16-context-read-write.md` | 10 |
| `agent-factory/workflows/18-context-compaction.md` | **5** |
| `agent-factory/workflows/17-task-claim.md` | 2 |
| **total** | **80** |

**The five rows on `18-context-compaction.md` are exactly the finding `31-30` raised and did not
fix, independently confirmed here.** `31-30-SUMMARY.md` reports that two of `31-29`'s six disposition
rows pack MULTIPLE SENTENCES into one `after` cell, so `rowMatches()` — which compares a normalised
`after` against a SINGLE derived clause — matches nothing. The gate names five clauses on that file:
three at `:75` (the per-position price, split into three sentences) and two at `:83` (the ledger
paragraph, likewise). **The count matches the prediction exactly.** Owner `31-29`; the criterion is
recorded in `deferred-items.md`. It is not repaired here, for the standing reason: writing rows for
another plan's clauses puts a reason in the register this plan cannot vouch for.

### 8.5 The exported register cardinalities, measured on this tree

Each number was read from the **committed `.js`** by importing it from a non-entry module, not
counted by eye, and compared to what the owning plan's SUMMARY recorded.

| Register | Cardinality | Members / moved this round | vs. the owning SUMMARY |
|---|---|---|---|
| `TRUSTED_ROOT_RESIDUALS` | **11** | `R-31-15-01..04`, `R-31-19-01..07`; unchanged in COUNT, **re-scoped by host** by `31-27` | AGREES |
| — its `hosts` breakdown | **4** `non-cc-hook-path`, **7** `all` | `R-31-15-01`, `R-31-15-03`, `R-31-19-02`, `R-31-19-06` are the four | AGREES with `31-27` ("4 non-cc-hook-path, 7 all") |
| `TRUSTED_ROOT_TIERS` | **5** | tier 0 (host-delivered) NEW by `31-27`, then the four pre-existing tiers | AGREES |
| `TRUSTED_ROOT_STOP_CONDITIONS` | **7** | unmoved from round 5 | AGREES |
| `TRUSTED_ROOT_ENV_ORDER` | **2** | unmoved | — |
| `HOST_DELIVERED_ROOT_ENV` | `GRUGOPS_HOST_DELIVERED_ROOT` | NEW by `31-27` | AGREES |
| `PROMOTE_ADMITTED_RESIDUALS` | **6** | `T-31-14-03`, `T-31-18-01` (price corrected), `R-31-22-01`, `R-31-22-02` (**REWRITTEN** by `31-29`, id KEPT), `R-31-22-03`, `R-37` | AGREES |
| `PROMOTE_ADMITTED_DECLINES` | **11** (10 → 11) | `destination-outside-governed-store` added by `31-29` | AGREES |
| `WRITE_PATH_RESIDUALS` | **5** | `R-31-21-01..04` plus `R-31-29-01` (NEW) — the register IN-14 asked for, now exported and two-sidedly bound | AGREES with `31-29` |
| `NOTE_SKIP_ARMS` | **3** | `unparseable`, `not-a-regular-file`, `vanished` — NEW by `31-29` (IN-14) | AGREES |
| `NOTE_FILE_MAX_BYTES` | **8388608** | now enforced on BOTH sides; `31-29` records KEEPING this spelling rather than renaming it to the brief's `NOTE_MAX_BYTES` | AGREES |
| `AUDIT_LEDGER_MAX_BYTES` | **67108864** | reconciled with `LEDGER_ABOVE_CEILING_CLAUSE` | AGREES |
| the three note/ledger clauses | `note-path-not-a-regular-file`, `note-above-size-ceiling`, `audit-ledger-above-size-ceiling` | the middle one NEW by `31-29`, and it is the clause the CR-19 re-write now names | AGREES |
| `REPO_BOUNDARY_MARKERS` | **9** | unmoved | — |
| `GOVERNANCE_CONFIG_CANDIDATE_KINDS` | **2** | unmoved | — |
| `MODULE_OWN_CONFIG_POSITIONS` | **2** | unmoved; both sides now canonicalised (`31-27`, R-31-19-07) | AGREES |
| `UNRESOLVABLE_CALLEE_RESIDUALS` | **6** (9 → 6) | `RR-02`, `RR-06` unchanged; `RR-04'` rewritten; `RR-10`, `RR-11`, `RR-12` new; `RR-01`/`RR-03`/`RR-05`/`RR-07`/`RR-08`/`RR-09` **removed with the mechanism** | AGREES with `31-28` ("After (6)") |
| `PATHOLOGICAL_INPUT_SHAPES` | **6** | unmoved from round 5 | AGREES |
| `MEASUREMENT_BRANCH_STREAMS` | **4** | unmoved from round 5 | AGREES |
| the non-blocking-reader implementation set | **2** | `scripts/context-io.ts` and `hooks/hook-entry.ts`, derived with two seeded mirrors moving it by one in each direction | AGREES with `31-27` D4 |

**Every cardinality on this tree agrees with the number its owning SUMMARY recorded. Zero
disagreements.**

---

## 9. The no-silent-drop equality, asserted as COVERAGE

**A cardinality equality here would be false and self-invalidating**, so it is not the one asserted.
The phase's edge-coverage report surfaced **eight** unresolved probe rows keyed by requirement id AND
category. The round authored **eighteen** flagged assumptions across `31-27` through `31-31`. Several
refine one report row; several cover categories the report did not raise. Asserting `18 == 8` would be
asserting a claim that measures false.

**The assertion is therefore: every report row is covered by at least one authored assumption, and no
report row is covered by none.**

### 9.1 The authored assumptions, DERIVED from the five plan files

Read out of each plan's `## Edge probe assumptions` table by an `awk`/parser over the files
themselves, not copied from any prose:

| Plan | Count | Rows (requirement :: category) |
|---|---|---|
| `31-27` | **3** | UATX-01 :: unclassified ×3 |
| `31-28` | **3** | UATX-06 :: unclassified ×3 |
| `31-29` | **4** | UATX-01 :: adjacency, empty, ordering, unclassified |
| `31-30` | **5** | UATX-02 :: adjacency, empty, ordering · UATX-03 :: unclassified · UATX-05 :: unclassified |
| `31-31` | **3** | UATX-04 :: unclassified · UATX-01 :: unclassified · UATX-06 :: unclassified |
| **DERIVED TOTAL** | **18** | 3 + 3 + 4 + 5 + 3 |

The derived total **equals** the total the plan predicted (3 + 3 + 4 + 5 + 3 = 18), and the equality
is between a measurement and a prediction rather than between a sentence and itself.

### 9.2 The MAPPING, row by row

The report's category spelling is `unclassified`; four plans spell it `unclassified — review
manually`, which is the report's own suffix. The two are one category and are matched as one.

| # | Report row (requirement :: category) | Covered by | Count |
|---|---|---|---|
| 1 | UATX-01 :: unclassified | `31-27` #1, #2, #3 · `31-29` #4 · `31-31` #2 | **5** |
| 2 | UATX-02 :: adjacency | `31-30` #1 | **1** |
| 3 | UATX-02 :: empty | `31-30` #2 | **1** |
| 4 | UATX-02 :: ordering | `31-30` #3 | **1** |
| 5 | UATX-03 :: unclassified | `31-30` #4 | **1** |
| 6 | UATX-04 :: unclassified | `31-31` #1 | **1** |
| 7 | UATX-05 :: unclassified | `31-30` #5 | **1** |
| 8 | UATX-06 :: unclassified | `31-28` #1, #2, #3 · `31-31` #3 | **4** |

### 9.3 The two asserted numbers

- **Report rows covered by at least one authored flagged assumption: 8.** Required: 8. **✓**
- **Report rows covered by NO authored flagged assumption: 0.** Required: 0. **✓**

**No row is a silent drop. No row appears in no plan.**

### 9.4 The three assumptions authored BEYOND what the report raised, named rather than counted as drift

15 of the 18 map onto one of the eight rows (5 + 1 + 1 + 1 + 1 + 1 + 1 + 4 = 15). The remaining
**three** are `31-29` #1, #2 and #3 — UATX-01 :: adjacency, empty and ordering — three categories the
report did not raise for UATX-01 and which `31-29` authored anyway, because the write path it was
fixing has an adjacency (the ceiling), an empty case (a zero-note store) and an ordering (ledger
before note). **15 + 3 = 18, which balances against the derived total exactly.**

**An authored total exceeding the raised total is EXPECTED and is not a defect.** It is a plan
covering more than it was asked to. The defect this equality exists to catch is the converse — a
raised row nobody covered — and that count is zero.

---

## 10. The disposition ledger — one row per finding, per anti-pattern row, per `missing:` bullet, per dispositioned item

**A row whose disposition is `closed` MUST cite a measurement taken in this session.** A row with no
measurement says so in its own disposition cell.

### 10.1 Block A — the twelve numbered findings of `31-REVIEW.md`

Denominator DERIVED: `grep -cE '^### (CR|WR|IN)-[0-9]+:'` → **12**, equal to the frontmatter's
declared `total: 12`. **12 rows.**

| # | Finding | Owner | Disposition | The measurement that proves it |
|---|---|---|---|---|
| A1 | **CR-17** — the wrapper hashes thirteen agent-writable paths with a blocking read before the spawn its timeout bounds | `31-27` | **closed** | §2.1: all **13** derived manifest positions answer EXIT=0 in 46–50 ms with a named `manifest-path-not-a-regular-file` deny and **0 bytes on stderr** (was EXIT=124, 0 bytes both streams). The other decider's own position, the DIRECTORY shape and the fd-0 class all answer the same way; the never-closing stdin denies at 10,100 ms naming SIGTERM. Driven through the argv derived from `hooks/hooks.json` |
| A2 | **CR-18** — a block-scoped function declaration is handed the whole module's range | `31-28` | **closed, with one named sub-item carried** | §2.2: the review's own three-line spelling moves `0 findings`/EXIT=0 → `1 finding(s)`/EXIT=1; the namespace spelling likewise; the block-scoped CLASS control is unmoved. **The ambient `declare const` spelling is UNMOVED at `0 findings`/EXIT=0 and is carried as `R-31-31-01` (§12.4)** — measured a curiosity the language refuses (`TS2440`), not a live bypass, and recorded rather than absorbed (§6.1) |
| A3 | **CR-19** — the note ceiling is read-side only, so a 9 MiB note writes and reads back as zero | `31-29` | **closed** | §2.3: `appendNote` with a 9,437,184-byte body now REFUSES at the write side naming `note-above-size-ceiling` and stating *"No file was written and no directory was created"*; the idempotent re-write's clause names the true condition and says the destination **IS** a regular file; the small-note CONTROL writes and reads back 1 |
| A4 | **CR-20** — the note is keyed on `to` and the ledger on `repoRoot`, two repositories for one action | `31-29` | **closed** | §2.3: the three-real-root promotion leaves the finding AND its GOV-02 event both in THIRD (notes 1, ledger 1) with DEST holding neither (notes `[]`, ledger ABSENT) — the exact inverse of the round-6 measurement. The legitimate same-root CONTROL still promotes with one ledger line, and an ungoverned `to` declines `destination-outside-governed-store` |
| A5 | **CR-21** — the three-argument scenario overload hides a TestInfo modifier call | `31-28` | **closed** | §2.2: `test("scenario", { tag: "@smoke" }, async ({ page }, testInfo) => …)` moves `0 findings`/EXIT=0 → `1 finding(s)`/EXIT=1 naming `test.info().skip`, identical to the two-argument control's finding |
| A6 | **WR-26** — the fixture exemption is wider than the map it exempts for | `31-28` | **closed** | §2.4: the review's own helper spec moves `1 finding(s)`/EXIT=1 (a false refusal naming a construct absent from the file) → **`0 findings`/EXIT=0** |
| A7 | **WR-27** — the derived read-site axis walks only top-level functions | `31-29` | **closed** | §2.4: `deriveFsBlockingSites` now walks from the SourceFile with `ts.forEachChild` and attributes each site to its nearest named enclosing scope; the three mirrors the review seeded are watched-fail controls inside the green suite. Re-driven through the harness's own mirrors, which is stated in §1.2 rather than presented as an external probe |
| A8 | **WR-28** — the forged-origin price says three and measures two | `31-29` | **closed** | §2.4: the two-operation forgery inside a `.git`-carrying repository with no `factory.config.json` still PROMOTES — the CAPABILITY is `T-31-18-01`, accepted by design — and the PRICE is now stated per position in `originStoreIsRootAnchored`'s docstring, in `T-31-18-01` and in `18-context-compaction.md:75`: *"Inside a repository that carries a governance configuration it is three filesystem operations. Inside a repository that carries a version-control marker and no configuration it is two. Outside every repository it is two."* |
| A9 | **WR-29** — four could-not-run reasons claimed, three implemented | `31-28` | **closed** | §2.4: depth 630 answers `could not be PARSED (…); the parser itself faulted on this file`, distinct from the walk arm's `could not be analysed (…); the check was NOT performed for that file`. Four arms at `uat-spec-integrity.ts:2614`, `:2622`, `:2628`, `:2648`, pairwise distinct, plus a fifth for a parse whose diagnostics could not be INSPECTED |
| A10 | **WR-30** — `using` classified as hoisting | `31-28` | **closed, and the Warning's own sketch measured a no-op for half of it** | §2.4: `using it = …` after a reference moves `0 findings`/EXIT=0 → `1 finding(s)`/EXIT=1. The `await using` half was **never** misclassified on typescript 6.0.3 (`AwaitUsing` = 6 carries the `Const` bit), so the review's proposed `?? 0` addition changes nothing there — §6.3 |
| A11 | **IN-14** — one catch covers three facts; two residuals bound nowhere | `31-29` | **closed** | §2.5: `NOTE_SKIP_ARMS` is a published 3-member set and `render()` emits a conditional `## Skipped entries` table naming each entry's arm and detail — driven with one unparseable file and one FIFO beside one live note, yielding **2 entries, 2 distinct arms, 1 live note**. The register half is `WRITE_PATH_RESIDUALS`, exported with 5 members (§8.5) |
| A12 | **IN-15** — one string split twice | `31-28` | **closed** | §2.5: `uat-spec-integrity.ts:2382` computes `const head = dottedPath.split(".")[0]` once and both positions read the local |

**12 findings. 12 rows. 12 closed by measurement, of which 1 (A2) carries one named sub-item.** No
row asserts a closure this round did not measure.

### 10.2 Block B — the nine anti-pattern rows of `31-VERIFICATION.md`

Denominator DERIVED: `awk` over the "Anti-Patterns Found" table → **9**. **9 rows.**

| # | File / site | Disposition | Measurement |
|---|---|---|---|
| B1 | `hooks/hook-entry.ts` ~190 / ~237 — bare `readFileSync` ahead of the one bound that covers only `spawnSync` | **closed** | A1. Every manifest read goes through an inline non-blocking regular-file reader and the wrapper's own fd-0 read is **deleted** — fd 0 is inherited by the child `DECIDER_TIMEOUT_MS` bounds, measured at 10,100 ms |
| B2 | `scripts/context-io.ts` — `NOTE_FILE_MAX_BYTES` gates the read side only | **closed** | A3. The write side owns the ceiling; both sides read the one exported constant (8,388,608) |
| B3 | `scripts/context-io.ts` — `promoteAdmitted`'s ledger keys the GOV-02 event on `repoRoot` | **closed** | A4. `governanceRootOf(to)` binds both halves; `PROMOTE_ADMITTED_DECLINES` 10 → 11 with `destination-outside-governed-store` |
| B4 | `scripts/runnable-ref/uat-spec-integrity.ts` — `resolveBinding`'s `hoisted` arm | **closed by DELETION** | A2. `resolveBinding`, `bindingRangeFor` and `listHoists` are gone; the ban is decided by symbol identity (D-30) |
| B5 | `scripts/runnable-ref/uat-spec-integrity.ts` — `deriveTestInfoParameterNames` reads `arguments[1]` only | **closed** | A5. The fixture parameter is decided by its DECLARED TYPE at whatever position the overload set puts the body in; the recipe says so at `:185`, and *"No argument INDEX is read anywhere in this decision"* |
| B6 | `scripts/context-io-writer-set.test.ts` — `deriveFsBlockingSites` walks only top-level function declarations | **closed** | A7 |
| B7 | `scripts/context-io.ts` — `originStoreIsRootAnchored`'s docstring / `T-31-18-01`'s stated price | **closed, with the CAPABILITY kept and its bar re-priced** | A8 |
| B8 | `agent-factory/workflows/18-context-compaction.md` line 83 | **closed** | Read from disk this session: the paragraph now says *"A re-binding derives the destination repository from the destination context store itself, and both halves of the action key on that one answer. The ledger it looks in and the ledger it appends to are that repository's, never a third one named separately. A destination that does not resolve to a governed store is refused by name before anything is written."* — every clause measured TRUE of the mechanism in A4 |
| B9 | `agent-factory/checklists/browser-uat-recipe.md` lines ~204/277 and ~250-256 | **closed** | Read from disk this session: `:211` now states *"a `var` binding hoists to its enclosing function, while a function declaration, a `let`, a `const`, a class, a `using` and an `await using` are block-scoped and begin at their own declaration"* — the language's actual rule, covering CR-18 and WR-30; and `:185` states the TestInfo derivation by declared type at any position, covering CR-21 |

**9 rows. 9 closed.**

### 10.3 Block C — the six `missing:` bullets of `31-VERIFICATION.md`

Denominator DERIVED: `awk` over the two `missing:` lists → **6**. **6 rows.**

| # | Bullet (abridged) | Disposition | Measurement |
|---|---|---|---|
| C1 | Route `verifyDeciderClosure` and the fd-0 read through the same non-blocking discipline (restated inline, since this file may import only `node:` builtins), and add a case that plants a FIFO at a manifest path and asserts a bounded deny | **closed — BOTH halves, and the second half went further than asked** | A1. The reader is restated inline; the fd-0 read is **deleted** rather than guarded. `hooks/guard.test.ts` carries FIFO, DIRECTORY and UNIX-SOCKET cases at **every** manifest position plus the never-closing-stdin case, and `mkfifo` appears in that file 4 times against 2 at the round base |
| C2 | Make the write side own `NOTE_FILE_MAX_BYTES`, give an over-ceiling REGULAR file its own decline clause, and apply the same reconciliation to the ledger's write/read asymmetry | **closed — all three** | A3 plus §8.5: `NOTE_ABOVE_CEILING_CLAUSE` and `LEDGER_ABOVE_CEILING_CLAUSE` are both exported and `AUDIT_LEDGER_MAX_BYTES` is reconciled with its own clause |
| C3 | Derive the GOV-02 ledger's repository from `to` — **or**, if `to` is deliberately unconstrained, rewrite `R-31-22-02` and `18-context-compaction.md:83` — and add a case whose `to` and `repoRoot` are different roots | **closed — the FIRST branch taken, and the register rewritten anyway** | A4, B8. `governanceRootOf` derives the destination root; `R-31-22-02` is REWRITTEN with its id kept so existing citations resolve; `destination-outside-governed-store` cases number 3 in the suite against 0 at the round base |
| C4 | Narrow the `hoisted` arm to the nearest enclosing BLOCK for a function declaration, keep the function-wide range for `var`, and treat an ambient (`declare`) binding as binding nothing at all | **closed for the first two; the third is MOOT BY DELETION with one named residual carried** | A2. There is no `hoisted` arm to narrow — the census is deleted and the checker owns scope, which is the stronger form of the ask. **The ambient half has no counterpart in the new design**: `declare const it` resolves to a real symbol the checker answers `foreign` for, so the outcome is unmoved at `0 findings`/EXIT=0. Carried as `R-31-31-01` (§12.4), with §6.1 stating why this document declines to call it closed |
| C5 | Take the scenario body positionally rather than from `arguments[1]`, mirror the same rule in `isFixtureBindingPosition`, and add both Playwright overload forms to the corpus | **closed — all three** | A5, A6. Both overload forms report the identical finding; `31-28` additionally added the three-argument overload to `fixtures/playwright-test.d.ts`, without which the corpus row could not have measured anything |
| C6 | Record both fixes as dated decisions beside D-27, add MUTATE-REMOVE corpus cases for each, and correct `browser-uat-recipe.md`'s two affected passages | **closed** | `D-30` is recorded in `31-CONTEXT.md`, in the module's own header block and in `31-28-SUMMARY.md`; the corpus carries `"CR-18": ["block-scoped function declaration (rename)", "block-scoped function declaration (namespace)", "ambient declare (rename)", "ambient declare (namespace)"]` as named rows plus the block-scoped-CLASS control; B9 records the two corrected passages |

**6 rows. 6 closed, of which 1 (C4) carries one named sub-item.**

### 10.4 Block D — every item of `31-round6-residual-dispositions.md`

**The denominator is DERIVED from the document's tables, and it DISAGREES with the document's own
prose. Both numbers are printed; neither is adjusted.**

```
$ awk over the six '### A.'..'### F.' tables, counting data rows
  A. Governance root                11
  B. Admission / promotion           6
  C. UAT-spec modifier ban           9
  D. Exit-code contract              5
  E. 31-21 residuals                 5
  F. Process / harness / human       7
  DERIVED TOTAL ROWS: 43

$ the same awk, classifying each row's bolded Disposition cell
  Fix=22  Close=18  Open=3  unclassified=0  SUM=43

$ the document's own summary line (line 20)
  "34 items analysed. **19 fix, 13 close (accepted by design), 2 stay open**"
```

**43 ≠ 34, 22 ≠ 19, 18 ≠ 13 and 3 ≠ 2.** The gap is not explained by de-duplication: the only item
carrying three rows is the Windows leg (`R-31-19-03` in §A, "Windows leg of the two-boundary
behaviour" in §D, `R-03` in §F), and collapsing those three to one gives **41**, not 34. **This is
recorded as a finding of this round with an owner (§13.8), not as a typo.** The ledger below is built
on the DERIVED 43, because the tables are what a reader dispositions against.

| # | Item | Dispositioned | Measured outcome |
|---|---|---|---|
| D-A1 | `R-31-15-01` cwd-controlling process picks the root | Fix (S1) | **NOT fully closed.** Tier 0 exists and wins where the host delivers it — driven (§3). `hosts: non-cc-hook-path` on the member, so the capability stands on four of five CLIs and on any direct `node scripts/context-io.js` invocation. Owner: the register |
| D-A2 | `R-31-15-02` unconfigured repo resolves to kit lean default | Close | Member present, `hosts: all`. Accepted by design |
| D-A3 | `R-31-15-03` ambient project-dir env vars | Fix (S1) | **NOT fully closed**, as D-A1. `hosts: non-cc-hook-path` |
| D-A4 | `R-31-15-04` config above a nested repo is not found | Close | Member present, `hosts: all`. Deliberate mitigation of the home-walk threat |
| D-A5 | `R-31-19-01` ancestor config below home governs | Close | Member present, `hosts: all`; re-driven as CR-13's CONTROL (§3) and unmoved |
| D-A6 | `R-31-19-02` `HOME` is ambient | Fix (S1) | **NOT fully closed**, as D-A1. `hosts: non-cc-hook-path` |
| D-A7 | `R-31-19-03` degenerate directory identity platforms | Open → `R-03` | **OPEN.** `31-30` encoded the Windows assertion on the pre-existing leg; the reading was not taken. `hosts: all` |
| D-A8 | `R-31-19-04` unknown VCS marker set | Close | Member present, `hosts: all`. Open set is content, not mechanism (D-59) |
| D-A9 | `R-31-19-05` home-rooted repo without VCS marker not adopted | Close | Member present, `hosts: all` |
| D-A10 | `R-31-19-06` home made adoptable in 1–3 ops | Fix (S1) | **NOT fully closed**, as D-A1. `hosts: non-cc-hook-path` |
| D-A11 | `R-31-19-07` case-differing spelling defeats the module-own exclusion | Fix now | **CLOSED.** Both sides canonicalise through one ladder (`canonicalDirectoryPath`, D-29 (4)); the canonicalisation is visible in CR-13's own answer (§6.4). Member kept with `hosts: all` because the comparison still exists off the hook path |
| D-B1 | `T-31-14-03` hand-written origin note promoted undetected | Close, roadmap | Member of `PROMOTE_ADMITTED_RESIDUALS`. Accepted by design; needs a keyed note stamp. Owner: **next milestone** |
| D-B2 | `T-31-18-01` constructed governance root around own notes | Close + docs fix | **Docs fix CLOSED and MEASURED** (A8): the two-operation forgery in a config-less repository is driven and the price is stated per position in all three artifacts. The CAPABILITY stays accepted |
| D-B3 | `R-31-22-01` store without `factory.config.json` refused as origin | Close + docs | Member present; `18-context-compaction.md` states the cost per position, which is the same paragraph |
| D-B4 | `R-31-22-02` destination `to` unconstrained | Fix with CR-20 | **CLOSED.** REWRITTEN by `31-29` with the id kept; CR-20 measured closed (A4); the new decline fires |
| D-B5 | `R-31-22-03` symlink at a shaped, anchored location accepted | Close | Member present; `31-29` re-measured it against `31-27`'s canonicaliser and recorded it **unchanged** |
| D-B6 | `R-37` compared field set = projection + body | Close | Member present, unchanged since round 1 |
| D-C1 | `RR-01` aliased binding `const t = test` | Fix (S2) | **CLOSED.** Removed from the register with the mechanism; identity resolves the symbol |
| D-C2 | `RR-02` computed member `test[name]` | Close | Member 1 of 6, unchanged. Named refusal |
| D-C3 | `RR-03` rename/namespace through a non-framework module | Fix (S2) | **CLOSED.** Removed with the mechanism |
| D-C4 | `RR-04` non-identifier head | Close | **REWRITTEN as `RR-04'`, not merely kept**: `31-28` measured that the checker resolves `({ test }).test.skip(...)` to the framework's own declaration, so identity now REFUSES it. The undecided half — a call on `this` — is the surviving member |
| D-C5 | `RR-05` chain-step bound | Close (delete) | **DELETED with the recursion it bounded.** The module carries no `512` literal and no self-recursion |
| D-C6 | `RR-06` option enabled only by literal `true` | Close | Member 2 of 6, unchanged. Parse-never-evaluate |
| D-C7 | `RR-07` parser lacking predicates degrades to a weaker rule | Fix | **CLOSED**, replaced by `RR-11`. Measured (§1.3): a target the compiler cannot build a Program over answers `PROGRAM_UNAVAILABLE_REASON` at **EXIT=2**, never a silent pass |
| D-C8 | `RR-08` destructured TestInfo in the 2nd param | Fix (S2) | **CLOSED.** Removed with the mechanism; the recipe states the destructured form resolves to the framework's own property |
| D-C9 | `RR-09` nearest-binding scope rule | Fix (S2) | **CLOSED.** The census is deleted; CR-18 measured closed (A2) |
| D-D1 | Non-unwinding fault (OOM kill, signal) at the §14 caller | Fix at the caller | **CLOSED.** `scripts/uat-gate-exit-contract.test.ts` — a new file this round — derives four arms from the prose and maps a signal death (`exitCode === null`) to could-not-run. Re-driven here: **32 passed** |
| D-D2 | Windows leg of the two-boundary behaviour | Fix via CI | **OPEN.** Encoded, not observed — the same item as D-A7 and D-F3 |
| D-D3 | De-recursed walk unreachable on darwin | Close | Accepted; a control correctly recorded as one |
| D-D4 | `reportMeasured` deliberately unchanged | Close | Accepted, decided in D-28 (3); `MEASUREMENT_BRANCH_STREAMS` still **4** |
| D-D5 | `WR-29` four reasons claimed, three implemented | Fix | **CLOSED.** Four pairwise-distinct sentences, measured (A9) |
| D-E1 | `R-31-21-01` `atomicWrite` temp write unaimable | Close | Member 1 of `WRITE_PATH_RESIDUALS`. Accepted by design |
| D-E2 | `R-31-21-02` non-regular file inside `notes/` skipped silently | Fix with IN-14 | **CLOSED.** Three named arms, counted, and REPORTED in `render` output — driven (A11) |
| D-E3 | `R-31-21-03` plan premise (`appendFileSync` exits 0) | Close | Member 3. Measured false and closed in-plan in round 5; the id resolves to its measurement |
| D-E4 | `R-31-21-04` derivations are syntactic | Fix with WR-27 | **CLOSED for the SCOPE half** (A7): the walk is recursive and scope-attributing. **The alias/computed-member half is accepted by design** and remains member 4 |
| D-E5 | (register gap) four residuals live only in CONTEXT.md prose | Fix | **CLOSED.** `WRITE_PATH_RESIDUALS` is exported from `context-io.ts` with **5** members and the same two-sided binding test the other registers have (§8.5) |
| D-F1 | `R-01` attended Chrome lane under real interactive auth | Open (human) | **OPEN.** No agent owner. `UNKNOWN - verify` intact |
| D-F2 | `R-02` `claude auth status --json` under alternative credential configurations | Open (human) | **OPEN.** No agent owner. `UNKNOWN - verify` intact |
| D-F3 | `R-03` Windows leg of every probe and of the runnable | Fix via CI | **NOT closed; SHRUNK to a stated remainder.** `31-30` added Windows-scoped steps to the **pre-existing** `windows-latest` leg with an asserted skip list, and recorded six rows as `UNKNOWN - verify` because the reading was never taken. Owner: a real `windows-latest` run |
| D-F4 | `R-04` installer round-trip on a pre-existing host install | Fix | **CLOSED by harness.** `31-30` automated it with five measured outcomes (136 passed, 1 skipped). Its own remainder — that the round-trip runs on darwin — is `R-03`'s, not this item's |
| D-F5 | `check:diff-disposition` debt | Fix | **NOT closed; REDUCED by 30**, 110 → 80 over 39 elements, base and corpus unmoved (§8.4). Owner: the five remaining `18-context-compaction.md` rows are `31-29`'s; the other 75 are pre-existing with named owners |
| D-F6 | the inert `.temp/` residue predicate | Fix FIRST | **CLOSED.** `.temp/**` is in vitest's `exclude` and in the runnable's `SKIPPED_DIRECTORIES`; the predicate is a real listing, demonstrated observing a planted file the `git status` predicate cannot see (§7.2) |
| D-F7 | the collided harness-instance ordinal | Fix (docs) | **CLOSED.** One tracked list at `docs/audit/harness-false-result-instances.md` with the numbering read off it and a suite gate asserting contiguity; **this round read ordinal 14 off it rather than typing one** (§7.4). No SUMMARY was rewritten |

**43 derived rows. 43 ledger rows.** Of the 22 dispositioned **Fix**: **15 measured CLOSED**, **7
recorded still open with an owner** (D-A1, D-A3, D-A6, D-A10 host-scoped; D-D2, D-F3 Windows;
D-F5 the debt). Of the 18 dispositioned **Close**: **18 accepted by design**, each present in an
exported register or deleted with the mechanism that needed it. Of the 3 dispositioned **Open**:
**3 still open** (D-A7, D-F1, D-F2). **No FIX item whose measurement did not close it is recorded as
closed because a plan ran.**

---

## 11. The ledger's own totals, stated as an equality

**A ledger whose totals do not match the source documents' is SHORT, and being short silently is the
class this phase keeps paying for.** So the totals are derived and stated rather than implied.

| Source denominator | Declared / derived by | Value | Ledger block | Rows | Agree? |
|---|---|---|---|---|---|
| `31-REVIEW.md` numbered findings | its frontmatter (`critical: 5, warning: 5, info: 2, total: 12`) **and** `grep -cE '^### (CR\|WR\|IN)-[0-9]+:'` | **12** and **12** | §10.1 | **12** | **yes — declared and derived agree, and the ledger equals both** |
| `31-VERIFICATION.md` "Anti-Patterns Found" rows | measured: `awk` over the table | **9** | §10.2 | **9** | **yes** |
| `31-VERIFICATION.md` `missing:` bullets across both gap entries | measured: `awk` over the two lists | **6** | §10.3 | **6** | **yes** |
| `31-VERIFICATION.md` "Behavioral Spot-Checks" rows | measured: `awk` over the table | **18** | §2–§4 | **18 driven, 0 not-driven** | **yes** |
| `31-round6-residual-dispositions.md` items | **DERIVED**: `awk` over its six tables → **43** (Fix 22 / Close 18 / Open 3) | **43** | §10.4 | **43** | **yes against the DERIVED count** |
| the same, as the document's own prose DECLARES it | its line 20 | **34** (19 / 13 / 2) | — | — | **NO — and the discrepancy is a finding, §13.8** |
| **total dispositioned items** | | **70** source items | | **70** rows | **yes — no item without a row** |

**Disposition mix across all four blocks, counted:**

| Outcome | Count | Where |
|---|---|---|
| closed by a measurement taken in this session | **42** | 12 (Block A) + 9 (Block B) + 6 (Block C) + 15 (Block D's closed Fixes) |
| accepted by design, kept as a named residual | **18** | Block D's Close dispositions |
| carried OPEN with an owner and a criterion | **10** | Block D's 7 unclosed Fixes + 3 Opens |
| **total** | **70** | equals the source denominator |

**42 + 18 + 10 = 70. The equality balances.** Two of the closed rows (A2, C4) carry one named
sub-item each — `R-31-31-01`, the ambient `declare` spelling — which is the same residual counted
once in §12.4, not twice here.

**Every `closed` row cites a measurement taken in this session.** No row says `UNKNOWN - verify` in
its disposition cell, because no row in these four blocks was left unmeasured; the `UNKNOWN - verify`
markers this round carries all belong to §12.6's human and platform items.

---

## 12. The round's residual register — every boundary round 6's four plans decided to leave open

### 12.1 The governance root — `TRUSTED_ROOT_RESIDUALS`, 11 members, now scoped BY HOST

The count did not move; the **scoping** did. Four members are now `hosts: non-cc-hook-path` — closed
on the Claude Code hook path by tier 0 and open everywhere else — and seven are `hosts: all`.

| Id | `hosts` | Why it is left open | What would force it closed |
|---|---|---|---|
| `R-31-15-01` | `non-cc-hook-path` | a process that controls the working directory picks the root; tier 0 removes the walk only where the host delivers the root | an un-forgeable root channel on the other four CLIs — none exists today |
| `R-31-15-03` | `non-cc-hook-path` | the project-directory environment variables are ambient off the hook path | as above |
| `R-31-19-02` | `non-cc-hook-path` | `HOME` is ambient | as above |
| `R-31-19-06` | `non-cc-hook-path` | home can be made adoptable in 1–3 operations | as above; its closure criterion IS `R-31-15-01`'s |
| `R-31-15-02` | `all` | an unconfigured repository resolves to the kit's lean default | nothing — accepted as correct behaviour |
| `R-31-15-04` | `all` | a configuration above a nested repository is not found | nothing — the deliberate mitigation of the home-walk threat |
| `R-31-19-01` | `all` | an ancestor configuration below home governs | nothing — refusing it reverts WR-15, and a `$HOME` writer is already a same-uid actor |
| `R-31-19-03` | `all` | degenerate directory identity on platforms this box is not | **a reading taken off a real `windows-latest` run.** The instrument is wired (`31-30`); the reading is not taken |
| `R-31-19-04` | `all` | the VCS marker set is an open set | nothing — an open-set totality is content, not mechanism (D-59) |
| `R-31-19-05` | `all` | a home-rooted repository with no VCS marker is not adopted | nothing — the narrower of the two errors, and moot on the hook path after tier 0 |
| `R-31-19-07` | `all` | **CLOSED as a bypass** by canonicalising both sides through one ladder; the member is kept because the comparison still exists off the hook path | nothing further |

**Tier 0's own limits, from `31-27`'s record and stated here so they are not rediscovered:** it does
not exist on four of five host CLIs; it closes nothing about an agent invoking
`scripts/context-io.js` directly from its own Bash tool; and the trust in the delivered channel is
exactly the wrapper's freeze plus the decider's hash verification.

### 12.2 The admission / re-binding route — `PROMOTE_ADMITTED_RESIDUALS`, 6 members

| Id | Why it is left open | What would force it closed |
|---|---|---|
| `T-31-14-03` | a note HAND-WRITTEN into an origin `notes/` directory and then promoted is not distinguishable from one the sanctioned writer produced | a keyed note stamp the sanctioned writer emits and this route verifies. **Owner: the next milestone.** No owner in this phase |
| `T-31-18-01` | a constructed governance root around one's own notes presents a store the route accepts | as above. The PRICE is now stated per position and MEASURED (A8); the capability is unchanged |
| `R-31-22-01` | a checkout with a store and no `factory.config.json` is refused as an origin | nothing — the cost of pricing the residual honestly; the manual-copy install path is documented in workflow 18 |
| `R-31-22-02` | **REWRITTEN** by `31-29` with its id kept, so existing citations resolve; what remains open is stated in the member itself | — |
| `R-31-22-03` | a symlink AT a shaped, anchored location resolves to its root and is accepted for where it SITS | planting it needs write access inside a real root, which is `T-31-14-03` one indirection over. Re-measured against `31-27`'s canonicaliser and **unchanged** |
| `R-37` | the compared field set is the store's own read-back projection | nothing — a key the projection drops is read by no consumer |

### 12.3 The write path — `WRITE_PATH_RESIDUALS`, 5 members (the register IN-14 asked for)

| Id | Why it is left open | What would force it closed |
|---|---|---|
| `R-31-21-01` | `atomicWrite`'s `writeFileSync` is a blocking-capable call this module still makes | its destination carries a random UUID no caller can predict, so it is not aimable; the race is bounded by same-uid filesystem access (`T-31-25`) |
| `R-31-21-02` | a non-regular file inside `notes/` is skipped | **the silence is closed** — the skip is now one of three named arms, counted and reported by `render` (A11). The SKIP itself is accepted |
| `R-31-21-03` | plan 31-21's own premise about `appendFileSync` | measured false and closed in-plan in round 5; the id resolves to its measurement rather than to a gap |
| `R-31-21-04` | the write-path derivations are SYNTACTIC | the SCOPE half is closed (A7). **The alias and computed-member half stays open**; its closure shape is the S2 type-checker cutover `31-28` landed for the modifier ban. **Owner: the next milestone**, named rather than assumed |
| `R-31-29-01` | a note already on disk above the ceiling is refused everywhere and neither deleted nor rotated | nothing — the context is append-only and removing it would destroy evidence to tidy a listing |

### 12.4 The UAT-spec modifier ban — `UNRESOLVABLE_CALLEE_RESIDUALS`, 6 members, plus one this document raises

The register went **9 → 6**. Four members were removed with the mechanism that needed them
(`RR-01`, `RR-03`, `RR-08`, `RR-09`), one was deleted with the recursion it bounded (`RR-05`), one
was rewritten (`RR-04` → `RR-04'`), one was replaced (`RR-07` → `RR-11`), and two are new
(`RR-10`, `RR-12`).

| Id | Why it is left open | What would force it closed |
|---|---|---|
| `RR-02` | a member computed from a non-literal expression resolves to no symbol and the source carries no member name | a literal-typed `name`, which the checker could resolve — optional, and not attempted |
| `RR-06` | an option enabled by anything other than the `true` keyword | nothing — this runnable parses and never evaluates, which is the right rule |
| `RR-04'` | the undecided half of a non-identifier head: a call on `this`, or on an object whose member the checker cannot resolve | a resolution the compiler does not offer at that position |
| `RR-10` | identity and spelling are TWO rules for one question, paired deliberately | one rule that loses no refusal the other makes. The pairing is bounded: the spelling rule is asked ONLY where identity produced no answer |
| `RR-11` | a target whose TypeScript cannot create a Program makes NO claim, at exit 2 — and the granularity is WHOLE-RUN rather than per-file | a way to bind one file at a time, which the compiler's public API does not offer today. **Owner: the register** |
| `RR-12` | the installed-package identity route is reasoned, not measured; only the ambient-declaration route is driven | `@playwright/test` installed here, which this repository's fixed dependency set forbids. `UNKNOWN - verify`, bound to `R-07`. **Owner: a human** |

**`R-31-31-01` — RAISED BY THIS DOCUMENT, not by a fix plan, and NOT added to any exported register
by this plan.** An ambient `declare const it: unknown;` beside `import { test as it }` reports
`0 findings`/EXIT=0, unmoved from what `31-REVIEW.md` CR-18 point 3 measured. **Why it is not called
closed:** the outcome is unchanged and no register member names it. **Why it is not called a
blocker:** the file does not compile (`TS2440: Import declaration conflicts with local declaration of
'it'`), so by `31-28`'s own recorded standard it is a curiosity rather than a bypass — and that
standard is this round's, which is why the item is carried rather than dismissed. **What would force
it closed:** either a corpus row driving it with the compile error asserted as the reason it cannot
run, or a register member naming it. **Owner: round 7's fix plan.** This plan writes no source, so it
is recorded here and repaired nowhere.

**Two further open items `31-28` recorded, restated so they are looked up rather than rediscovered:**
`R-07`, the declared surface's drift from the released `@playwright/test` — still `UNKNOWN - verify`,
**owner a human**, and its cost went UP this round because `31-28` added a member to the
transcription.

### 12.5 The exit-code contract — `PATHOLOGICAL_INPUT_SHAPES` (6) and `MEASUREMENT_BRANCH_STREAMS` (4)

| Shape | Why it is left open | What would force it closed |
|---|---|---|
| a fault that terminates the process WITHOUT unwinding (an OOM kill, a signal) | the runnable structurally cannot answer for it — a killed process runs no `catch` clause | **CLOSED AT THE CALLER** by `31-30`'s fourth arm: the §14 runner maps `exitCode === null` to could-not-run, never to pass. The runnable's own half stays open by construction |
| the de-recursed walk's own depth, unreachable on darwin at 476 levels against ~8,075 frames | a control, correctly recorded as one | nothing |
| `reportMeasured` deliberately unchanged | decided in D-28 (3) | nothing |
| the parse-depth boundary's exact level | it is a property of the host's stack, not of the rule | nothing — but it MOVED this round from 630/631 to 629/630 (§6.5), so a record pinning the number rather than the property will read as a regression |
| the Windows leg of the two-boundary behaviour | not measurable from darwin | a reading off a real `windows-latest` run |

### 12.6 The process, harness and human items

| Id | State | Owner | What would force it closed |
|---|---|---|---|
| `R-01` | **OPEN — `UNKNOWN - verify` intact.** The attended Claude-in-Chrome lane under real interactive auth | **a named human** | an attended Claude Code session with the browser extension installed and a real interactive login. `scripts/chrome-lane-bar.test.ts`'s **structural** bar is green as its own file (§5.2) and the lane's real behaviour is **not** inferred from it |
| `R-02` | **OPEN — `UNKNOWN - verify` intact.** The `claude auth status --json` predicate under API-key and long-lived-token configurations | **a named human** | credential configurations this box does not have and cannot construct without destroying its real ones |
| `R-03` | **OPEN, SHRUNK to a stated remainder.** `31-30` added Windows-scoped steps to the pre-existing `windows-latest` leg with an asserted skip list | **a real `windows-latest` run** | `31-30` records SIX rows as `UNKNOWN - verify`, including whether the FIFO and symlink shapes are skipped there, whether both browser-absence stages behave identically, and whether the leg can reach green at all. **The instrument is wired; the reading is not taken, and `31-30` says so in its own words** |
| `R-04` | **CLOSED by harness**, with five measured outcomes (136 passed, 1 skipped) | — | — |
| the `check:diff-disposition` debt | **OPEN at 80**, down 30 from 110 | five rows on `18-context-compaction.md` are **`31-29`'s**; the other 75 are pre-existing | a disposition row per clause. **Not repaired here**: writing rows for another plan's clauses puts a reason in the register this plan cannot vouch for |
| the multi-sentence disposition-row CLASS | **OPEN.** A row whose `before`/`after` is not exactly one clause covers nothing, silently, while reading as work done, and no derived check catches it | **`31-29`**, criterion in `deferred-items.md` | a derived check that refuses a multi-sentence cell. Independently confirmed here: the gate names exactly 5 clauses on that file (§8.4) |
| the **14 of 15** `mkfifo` call sites carrying no platform guard | **OPEN.** They call `execFileSync("mkfifo", …)` bare or assert `spawnSync(...).status === 0` as a PREMISE; on a Windows runner each is a failure rather than a skip | **their own plan** — `31-30` raised it and deliberately did not fix it | a platform guard at each site. `31-30` records that the SOURCE property is measured on darwin and what a Windows run then does is **not** measurable from here and is not claimed |
| the harness-false-result tally | **CLOSED as a tally, OPEN as a phenomenon.** One tracked list, contiguous ordinals, a suite gate over it | — | nothing for the tally. **The phenomenon produced instance 14 in this very plan** (§7.4), so the discipline is still earning its place |
| `R-07` / `RR-12` | **OPEN — `UNKNOWN - verify`.** The transcribed `@playwright/test` surface's drift from the released package | **a human** | the package installed here, which the fixed dependency set forbids |
| the signed-note-stamp work | **OPEN, no owner in this phase** | **the next milestone** | it is `T-31-14-03`'s and `T-31-18-01`'s shared closure criterion |
| a type-checker-backed resolution for `R-31-21-04`'s alias half | **OPEN** | **the next milestone** | the S2 cutover shape, applied to the write path |

---

## 13. What this round did NOT do

Stated plainly, because a closure round's silences are what the next round pays for.

1. **Two of the four human-verification items remain OPEN, and a third is open at a stated
   remainder.** `R-01` (the attended Chrome lane under real interactive auth) and `R-02` (the auth
   predicate under alternative credential configurations) are carried with their `UNKNOWN - verify`
   markers intact and **named human owners**. `R-03` is SHRUNK by `31-30`'s harness work but is not
   closed: six of its rows are `UNKNOWN - verify` because the reading was never taken. `R-04` **is**
   closed, by a harness, with its five measured outcomes quoted. **Every probe in this document ran
   on darwin 25.5.0 arm64 with Node v24.12.0 only.** No Windows measurement is claimed anywhere.
2. **The `check:diff-disposition` debt is MEASURED, REDUCED and UNCLOSED** — 80 findings over 39
   elements, down 30 from round 5's 110, with the base commit `4d2b8f0` and the 40-file watched
   corpus both unmoved (§8.4). Five of the remaining findings are `31-29`'s own; the other 75 are
   pre-existing with named owners. Not repaired here, for the standing reason.
3. **Four `TRUSTED_ROOT_RESIDUALS` members are closed only on the Claude Code hook path.**
   `R-31-15-01`, `R-31-15-03`, `R-31-19-02` and `R-31-19-06` carry `hosts: non-cc-hook-path`. On the
   other four CLIs, and for any agent invoking `scripts/context-io.js` directly from its own Bash
   tool, the capability is unchanged. **Tier 0 is a narrowing on one host, not a closure.**
4. **`R-31-19-03` is not closed and is not closeable from this platform.**
5. **The ambient `declare` spelling is UNMOVED**, and this document declines to call it closed on
   this round's own standard (§6.1, §12.4). It is `R-31-31-01`, owner round 7.
6. **The 14 unguarded `mkfifo` sites and the multi-sentence disposition-row class are raised and not
   fixed** — both are `31-30`'s findings, carried with owners and criteria.
7. **No source file, test file or configuration file was modified by this plan.** Asserted, range-pinned:
   ```
   $ git status --porcelain -- scripts hooks agent-factory install .github vitest.config.ts package.json    (empty)
   $ git diff --name-only a6539e7..HEAD -- scripts hooks agent-factory install .github vitest.config.ts package.json    (empty)
   ```
   **The findings this round DID raise — §8.4's remaining debt, §6.5's moved boundary, §13.8's
   unbalanced tally and §12.4's `R-31-31-01` — are therefore recorded with owners rather than
   repaired.**
8. **The round-6 dispositions file's own tally does not balance, and this round did not adjust it.**
   Its prose declares 34 items (19 fix / 13 close / 2 open); its tables carry 43 (22 / 18 / 3), and
   de-duplicating the one item that appears three times gives 41, not 34 (§10.4). **The ledger is
   built on the derived 43.** Owner: whoever writes round 7's dispositions file, whose denominator
   should be derived by command rather than typed. `31-round6-residual-dispositions.md` is history
   and is not rewritten here.
9. **No requirement was flipped** — §14.

---

## 14. The requirement rows, confirmed UNCHANGED

**Only a verification round may flip a requirement. A gap-closure plan that flips one is certifying
itself.** `.planning/ROADMAP.md` says so in its own words, quoted verbatim from the block that
governs this round:

> **The phase stays `In Progress` and UATX-01…UATX-06 stay `[ ]` / Gaps Found: only a verification
> round may flip a requirement.**

Confirmed by reading the files rather than by intent, and by a diff pinned to the ROUND base:

```
$ git diff --stat 77123aa..HEAD -- .planning/REQUIREMENTS.md
(empty — byte-unchanged across the WHOLE round)

$ grep -c '^- \[ \] \*\*UATX-0' .planning/REQUIREMENTS.md
6

$ .planning/REQUIREMENTS.md lines 120-125     all six still `- [ ]`
$ .planning/REQUIREMENTS.md lines 212-217     all six still `Gaps Found`
$ .planning/ROADMAP.md                        Phase 31 checkbox still unchecked; status row still `In Progress`
```

**`.planning/REQUIREMENTS.md` is byte-unchanged over the entire round even though one plan flipped a
row mid-round.** `31-29`'s executor marked `UATX-01` complete and the flip was reverted in the same
plan (`9edbe8e fix(31-29): revert UATX-01 to Gaps Found — only a verification round may flip it`).
The net range diff is empty, which is the outcome the rule requires, and the fact that a revert was
needed is recorded here rather than smoothed over — **this repository has now had two rounds in which
the post-plan tooling flipped a requirement a gap-closure round may not flip.**

`.planning/ROADMAP.md` DID change over the round, and the change is named so it is not mistaken for a
requirement flip: the plan-progress row moved `26/26` → `30/31`, the round-6 plan block was updated
from "NOT YET EXECUTED" to name which four executed, and five plan checkboxes were added under
"Gap waves 15-19" (`31-27`…`31-30` checked, `31-31` unchecked). **No hunk touches the Phase 31
checkbox line, the phase status cell, or any UATX row.** This plan runs
`roadmap update-plan-progress` for the plan-count row and does **not** run
`requirements.mark-complete` at all.

### 14.1 The `.planning/STATE.md` write, VERIFIED rather than assumed

This repository's state writer re-escapes backslashes on every write, and a pathological line there
has previously combined with a superlinear guard predicate to turn a sub-second gate into a
multi-minute one. So the write is measured afterwards rather than trusted:

| Check | Command | Result |
|---|---|---|
| longest line in `.planning/STATE.md` | `awk '{ if (length($0) > m) { m = length($0); n = NR } } END { print m, n }'` | **7995 characters, at line 18** — `prior_activity_desc`, a pre-existing field this plan did not touch, unchanged from before the write. Bound: 20000. **PASS** |
| the `status:` field this plan rewrote | the same `awk`, restricted to that line | **1838 characters**, DOWN from the 3756 it replaced. **PASS** |
| backslash runs | `grep -c '\\\\'` | **0** — no quadruple-backslash run anywhere in the file. The replacement text was asserted to contain no `"` and no `\` **before** it was written, by the writer itself |
| foundation guards AFTER the write | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, exit 0, **0.211 s** wall clock. Bound: 5 s; the pathological signature this repository measured before is 60 s. **PASS** |
| UAT oracles AFTER the write | `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED`, exit 0, **0.093 s** wall clock |
| both guard suites AFTER the write | `npx vitest run … check-foundation-guards.test.ts floor-invariance.test.ts` | `Test Files 2 passed (2)` · `Tests 422 passed (422)`, 71.8 s |

`.planning/STATE.md` names the next action as **a SEVENTH verification round**, in both `status:` and
`stopped_at:`.

---

## 15. What the seventh verification round inherits

- **§1** — the probe denominator DERIVED (18 spot-check rows + 5 review-only findings + 3 review-only
  CR-18 variants = **26**), with the exclusions named, and **the probe-environment change this round
  introduced**: an unequipped target now answers `PROGRAM_UNAVAILABLE_REASON` at exit 2, so a round-5
  transcript re-run verbatim measures the parser's absence rather than the ban.
- **§2** — every round-6 reproduction paired, none re-derived from a fix plan's fixture. All five
  Criticals and all five Warnings **CLOSED by measurement**; both Info items closed.
- **§3** — **14 round-5 controls re-driven in the modules round 6 edited: 13 UNMOVED, 1 boundary
  moved by one level in the safe direction.** No round-5 closure was lost.
- **§4** — the two spot-check counts stated apart: **6 rows carried a defect and all 6 moved; 12
  passed and 11 are unmoved**, with the twelfth recorded as a three-way disagreement rather than as
  an unmoved row. Three rows the round-6 verifier only REPORTED are DRIVEN here.
- **§5** — the four SATISFIED requirements re-measured by their own mechanisms, including this plan's
  own flagged assumption about UATX-04 and the one limit of that probe stated rather than absorbed.
- **§6** — five disagreements and reclassifications, both values printed each time.
- **§7** — the environment proven clean **by predicates that can observe it**, every harness's own
  premise stated with the assertion that established it, and **one false result about a harness's own
  premise logged as instance 14** — instance 4's exact shape, for the third time in this phase.
- **§8** — the one-commit gate record: **25 rows from a list derived from `package.json`**, the suite
  green at **64 files / 4128 passed / 2 skipped / 355 s**, the doctrine DERIVED rather than quoted,
  the **whole 26-entry manifest** re-measured, **20 register cardinalities** read off the tree with
  zero disagreements, and the debt at **80** (down 30) with the measuring stick unmoved.
- **§9** — the no-silent-drop equality asserted as **COVERAGE**: 8 report rows, 8 covered, 0
  uncovered, from 18 derived assumptions, with the 3 authored beyond the report named rather than
  counted as drift.
- **§10/§11** — **70** disposition rows against **70** source items, with the equality stated and
  balancing (42 closed + 18 accepted + 10 carried).
- **§12** — the residual register: **11** governance-root members with a `hosts` breakdown, **6**
  admission-route members, **5** write-path members, **6** modifier-ban members plus one this
  document raises, the exit-contract shapes, and **11** process/harness/human rows. Each with a
  reason and a closing criterion.
- **§13** — what was not done, nine items. **§14** — the requirement rows, left for the verifier.

**The one thing this round most wants read first: §8.2.** For six consecutive rounds the phase has
recorded "the green suite exercised none of the defects" as a quotation. This round DERIVES it: four
of the five round-6 Criticals are decided today by constants and spellings that appeared **zero**
times in the suite at the round base. A suite that never names a clause cannot assert it — and that,
not the 4,128, is the number a seventh round should carry forward.

**The second thing: §6.5.** A round-5 closure's own adjacency pair moved by one level because a later
plan added a frame to the parse path. Nothing broke; a number that was pinned stopped matching. Any
seventh-round row that re-runs a pinned depth, a pinned line number or a pinned byte count from an
earlier record should expect this class and check the PROPERTY rather than the NUMBER.

---

_Written: 2026-09-10 · Plan `31-31` · Measured at `a6539e7` (reproductions, controls and gates), with
every "over the round" range pinned to the round base `77123aa`_

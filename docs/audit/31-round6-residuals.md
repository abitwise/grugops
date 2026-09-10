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
total: 12`), derived and quoted rather than only quoted. §9 carries one disposition row per member of
(b), (c) and (d); §10 states the equality.

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
  round-5 record. Both are dispositioned in §9 against a measurement taken here, not against a
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
| the coverage-equality derivation | the assumption count is read from the plan files, not from the plan's own prose | derived **18** across five files, printed row by row in §11 |

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

# Gap-closure round 9 — the round-8 evidence re-measured against the finished tree

**Round:** 9 — the closing measurement for gap-closure **round 8** of Phase 31 (fix plans `31-39`,
`31-40`, `31-41`, `31-42`, `31-43`; this measurement plan `31-44`)
**Written:** 2026-09-13, by plan `31-44`
**Measured at:** commit `6e95edc` (`6e95edcce3da04cd19c8d0b6b9253cf45ed986e0`, `2026-09-13 04:42:11
+0300`), the round's final commit before this plan's own, against the **committed `.js`** artifacts,
with
`git status --porcelain -- scripts hooks agent-factory install docs .github vitest.config.ts package.json .planning/REQUIREMENTS.md .planning/ROADMAP.md`
**empty** before the first probe and after the last.
**Round base:** `54ea410` (`54ea4104204654c51e38a8478bc5ac0101092637`, `docs(31): record round-9
planning complete (44 plans)`, `2026-09-11 23:52:27 +0300`) — the commit before `31-39`'s first,
recorded as `plan_head_before` in `31-39-SUMMARY.md`. Every "over the round" range below is pinned to
it. `git rev-list --count 54ea410..HEAD` = **35**.
**Platform:** darwin 25.5.0 arm64 · Node **v24.12.0**
**Evidence source:** `.planning/phases/31-autonomous-manual-testing/31-REVIEW.md` (the round-7
gap-closure code review, `issues_found`, 2 critical / 6 warning / 3 info, total 11) and
`.planning/phases/31-autonomous-manual-testing/31-VERIFICATION.md` (the **EIGHTH** verification pass,
`gaps_found`, 5/6, three `missing:` bullets)
**Governing decisions:** `D-39` (`31-39`), `D-40` (`31-40`), `D-41` (`31-41`), `D-42` (`31-42`),
`D-43` (`31-43`) — all recorded in `31-CONTEXT.md`
**Predecessor record:** `docs/audit/31-round7-residuals.md`. This file follows its section shape
rather than inventing a new one. **A prior round's record is history and is never rewritten** —
where this round disagrees with one, **both values are printed and the disagreement is a row.**

**THE FILENAME'S CONVENTION, CONFIRMED AGAINST THE PREDECESSOR RATHER THAN GUESSED.** The four prior
records read, in their own first lines:

| File | Title | "Round: N" | Fix plans it measures |
|---|---|---|---|
| `31-round4-residuals.md` | "Gap-closure round 5 — the **round-4** evidence" | 5 | `31-16`…`31-19` |
| `31-round5-residuals.md` | "Gap-closure round 6 — the **round-5** evidence" | 6 | `31-21`…`31-25` |
| `31-round6-residuals.md` | "Gap-closure round 7 — the **round-6** evidence" | 7 | `31-27`…`31-30` |
| `31-round7-residuals.md` | "Gap-closure round 8 — the **round-7** evidence" | 8 | `31-32`…`31-37` |

**The reading taken:** the FILENAME carries the number of the gap-closure **fix round whose evidence
is re-measured** — one less than the writing round the `Round:` line states. This round's fix plans
are `31-39`…`31-43`, which the ROADMAP and every one of those five plans call gap-closure **round
9** under the writing-round numbering; under the filename's numbering the evidence measured is round
**8**'s (the EIGHTH verification pass). Both numberings are live in this phase, they differ by one,
and neither is wrong — so the file is `31-round8-residuals.md` and the title says round 9. The
predecessor's own header carries the same two-numbering split in the same two lines. This paragraph
exists so the tenth reader does not have to re-derive it.

## What this artifact is for

A verification round reads source and committed artifacts. It does not read a planning conversation,
and it should not have to re-derive a probe from a fix plan's own fixture. This file exists so the
**ninth** verification round can start from five things it would otherwise have to rediscover:

1. a table pairing **every** reproduction the round-8 documents recorded with its post-round result,
   re-run with **the original document's own spelling** (§2);
2. a CONTROL table re-driving **every** round-6 and round-7 closure — `CR-17` through `CR-25` — at
   the same commit, including the **four** the round-8 verifier confirmed from a source read rather
   than by driving (§3);
3. a disposition row for **every** finding of `31-REVIEW.md`, every anti-pattern row, every
   `missing:` bullet, every non-verified Required Artifact row, every `NOT_WIRED` key link and every
   owner-bearing deferred item, over a **derived** denominator (§9);
4. every frozen floor re-measured **whole**, with the re-baselined admission freeze's prior value
   printed beside the new one (§8);
5. a written register of the boundaries this round **decided to leave open**, with the reason and
   what would force each closed (§10).

**The order of this document is deliberate.** The adversarial reproductions come FIRST (§2–§6) and
the suite comes afterwards (§7–§8) as a floor. For **eight** consecutive verification rounds on this
phase the green suite exercised **none** of the defects that round found. A closure round that led
with its suite figures would be leading with the one number eight rounds have shown to be
uninformative here.

**This round is FENCED.** The developer decided on 2026-09-12 that Phase 31 ends at gap-closure round
9 regardless of the next verification's score. Every item this document leaves open is therefore an
**accepted-open residual** rather than a queue entry, and §10 is written to be read that way. No open
item below is presented as closed.

---

## 1. The probe set, DERIVED from the source documents rather than from the fix plans

### 1.1 The derivation rule

A **reproduction block** is a place in `31-VERIFICATION.md` or `31-REVIEW.md` that records a probe
AND its measured outcome. Each count below was measured with a command rather than typed, and each
was asserted non-zero before anything was compared against it.

| # | Shape | Where | Count | How it was measured |
|---|---|---|---|---|
| (a) | a numbered **finding heading** | `31-REVIEW.md` | **11** | `### (CR\|WR\|IN)-NN:` headings, **fences stripped first** |
| (b) | an **Anti-Patterns** row | `31-VERIFICATION.md` | **5** | rows of the `### Anti-Patterns Found` table beginning `` | ` `` |
| (c) | a `missing:` bullet | `31-VERIFICATION.md` | **3** | `      - "` bullets inside the `missing:` block |
| (d) | a **Required Artifacts** row not marked VERIFIED | `31-VERIFICATION.md` | **3** of 7 | rows matching `PARTIAL` or `✗ FAILED` |
| (e) | a **Key Link** row marked `NOT_WIRED` | `31-VERIFICATION.md` | **2** | rows matching `NOT_WIRED` |
| (f) | a `gaps_remaining:` entry | `31-VERIFICATION.md` | **1** | `    - "` entries under `gaps_remaining:` |
| (g) | an owner-bearing **deferred item** naming round 8's fix plan, round 8's planner or round 9 | `deferred-items.md` | **5** of 52 | bullets whose text or heading names one of those owners |

**THE HEADING SCAN STRIPS FENCED BLOCKS FIRST, AND THE STRIPPING IS STATED BECAUSE IT MATTERS.** A
`##` heading inside a fenced transcript is a markdown-parse artifact, not a finding; round 7's review
carried one (`## Skipped entries`, inside `CR-24`'s `render()` transcript) and this phase's convening
brief carried it forward as a fourteenth finding. `render()` still emits that heading — this session
re-drove it in §3 and the string is in the output — so the rule stands whether or not it bites.
Measured on `31-REVIEW.md` at this commit:

```
REVIEW headings, fences NOT stripped : 15
REVIEW headings, fences STRIPPED     : 15  (delta 0)
headings the fence strip removed     : (none)
```

**Delta zero this round**, and that is the honest reading: the rule was applied and found nothing to
remove. It is recorded as applied-and-empty rather than dropped, because the round it would have
caught is one round back.

### 1.2 What is excluded, by name, so the exclusion is not silent

1. **`WR-37`'s throwing-stub seam was NOT re-driven outside the suite.** `31-42` exported
   `frameworkSurface` as a test seam and drives each swallow position through `runStubWalk`, a
   substitute-checker harness that lives in `scripts/runnable-ref/uat-spec-integrity.test.ts`.
   Re-driving it here means re-authoring that harness, and **this plan writes no source and no test.**
   What IS measured independently, from the committed `.js`, is the derived site census and every
   site's arm (§2.3); the seam's own drive rests on the `WR37-SITE-*` corpus rows inside this
   session's green suite (§7).
2. **`CR-22` position 4 was NOT driven**, for the same reason round 7 recorded: `DEFAULT_CONTEXT_ROOT`
   is not exported (re-measured `false` at this commit), and observing the split needs a `~/.grugops`
   kit beside a separate host repository. It is published as `R-31-33-02` (§10).
3. **No prior round's SUMMARY, PLAN, REVIEW or VERIFICATION was re-read line by line for prose
   accuracy.** Where a claim of one is contradicted by a reading here, both values are printed (§6).
4. **Nothing was repaired.** §5 raises one new finding and records it with an owner.

### 1.3 The probe environment

**Every probe in this document ran OUTSIDE the repository tree**, under the session scratchpad, and
this differs from round 7 on purpose: round 7 ran its AST probes from `.temp/31-38-probe/` *inside*
the repository and its own first full-suite run went RED on `POINT 7: no probe root is left under
'.temp'`, because the suite was measuring the measurement. The AST probe roots here are scratch
directories carrying a `node_modules` **symlink** to this repository's, which is what makes
`createRequire` resolve `typescript` from the target exactly as `mkTargetRepo` arranges it.

Each AST probe root is equipped exactly as `equipTarget` equips one: a `tsconfig.json`
(`ES2022`/`ESNext`/`Bundler`/`strict`/`skipLibCheck`, `noEmit`, `include: ["**/*.ts"]`), the
`node_modules` symlink, and BOTH ambient surfaces — `scripts/runnable-ref/fixtures/playwright-test.d.ts`
and `scripts/runnable-ref/fixtures/foreign-framework.d.ts` — copied to `types/`. **Every AST probe row
records its own `tsc --noEmit` exit code**, so no row rests on a construct the language refuses to
compile. Three rows below carry a non-zero `tsc` exit deliberately, and each says so.

Every `context-io` probe ran against the committed `scripts/context-io.js`, from roots created with
`mkdtemp` under the OS temp directory, each carrying `.git`, `.grugops/factory.config.json`
(`{ context: { human_admission: "all", audit_retention: "retained" } }` — the module's own config
shape) and `.grugops/context`. **Each root was asserted `governanceRootOf(store) === root` before any
result was read**, and each assertion is printed in the row it belongs to.

The `hooks/hook-entry.js` probes ran against a scratch kit copied outside the repository tree,
invoked through the argv **derived from `hooks/hooks.json`** rather than typed:

```
$ node -e '<walk hooks.json for every command>'
node "${CLAUDE_PLUGIN_ROOT}/hooks/hook-entry.js" guard.js
node "${CLAUDE_PLUGIN_ROOT}/hooks/hook-entry.js" admission-guard.js
```

**One harness premise failed on this session's first attempt and is logged rather than absorbed**
(§6.3, and `deferred-items.md`): the first `context-io` probe built its note object without `refs`,
and the module's own `composeNote` threw `TypeError: Cannot read properties of undefined (reading
'length')`. The probe's catch-all classifier then PRINTED that as `REFUSED: note.refs is not
iterable` — a harness defect wearing a refusal's clothes, which is exactly the shape that reads like
a closure. Caught because the CONTROL rows, which must WRITE, "refused" too. The classifier was
narrowed to re-throw `TypeError` and the note object given its `refs` field, and only then was any
result read. **Every `context-io` row below therefore prints a CONTROL that writes, so a refusal in a
probe row is known to be the module's and not the harness's.**

---

## 2. The reproduction pairing table — every round-8 reproduction re-run with its own document's spelling

Legend: **MOVED** = the round-8 result changed in the direction the owning plan committed to.
**UNMOVED** = the round-8 result is reproduced unchanged, which for a previously-PASSING row is the
evidence that nothing broke. **AGREES / DISAGREES** compares this session's figure with the owning
plan's own SUMMARY claim.

### 2.0 The source-identity premise, re-checked

| Probe spelling | From | Round-8 value | This round | Verdict |
|---|---|---|---|---|
| `git log -1 --format='%H %ci'` | `31-VERIFICATION.md` row 1 | `f698becf0ed0f38d36596737da2d4ed79f3f4c3e 2026-09-11 22:24:19 +0300` — the commit the review was written against | `6e95edcce3da04cd19c8d0b6b9253cf45ed986e0 2026-09-13 04:42:11 +0300` | the round's whole movement sits between the two |
| the round's own source diff, `54ea410..HEAD` | this session | — | `19 files changed, 7849 insertions(+), 419 deletions(-)` over `scripts hooks agent-factory install .github vitest.config.ts package.json` | the round's whole source movement, pinned |
| `git diff --stat 54ea410..HEAD -- package.json package-lock.json` | this session (the supply-chain measurement `T-31-44-SC` asks for) | — | **empty** — no dependency moved over the round | **no package-manager install ran** |
| `git diff --stat 54ea410..HEAD -- .planning/REQUIREMENTS.md` | this session | — | **empty** — byte-unchanged over the whole round | §11 |

### 2.1 CR-26 — `admitAndAppend`'s gated branch and its sibling's disposition

Two real roots, `governanceRootOf` asserted on each **before any result was read**. The spelling is
`31-REVIEW.md` CR-26's own, character for character in its arguments.

```
PREMISE governanceRootOf(THIRD.store) = <TMP>/cr22-third-SErsXr   (= THIRD.root)
PREMISE governanceRootOf(UNGOV.store) = null
admitAndAppend("T-REPRO1", {kind:finding, verified_by:"human:alice"}, "a body", UNGOV.store, THIRD.root)
```

| Probe spelling | From | Round-8 result (pre-fix) | This round (post-fix) | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| the call above | `31-REVIEW.md` CR-26 / `31-VERIFICATION.md` row 2 | `-> {"id":"20260911T000000Z-qe-finding-d5db5afc","findings":[]}`; **`UNGOV notes= 1 ledger= null`**, **`THIRD notes= 0 ledger= 1`** — a human-disposed finding in one repository and its GOV-02 record in another | `-> {"id":null,"findings":["admission REFUSED (destination-outside-governed-store): the context store \"…/cr22-ungov-…/.grugops/context\" does not resolve to a governed store, so the repository whose audit trail would record this admission cannot be named. No note was written. …"]}`; **`UNGOV notes= 0 ledger= null`**, **`THIRD notes= 0 ledger= null`** | **MOVED — CR-26 CLOSED.** The fail-open `?? repoRoot` is gone; the route refuses by the SAME clause name the sibling raises | AGREES with `31-39` (D-39) |
| the CONTROL — a GOVERNED `contextRoot` through the identical call shape | this session ("re-run every caller with a LEGITIMATE input") | — | `PREMISE governanceRootOf(G.store) = true`; `-> {"id":"20260617T142305Z-engineer-finding-7070035b","findings":[]}`; **`G notes= 1 ledger= 1`** | **UNMOVED** — the refusal refuses nothing legitimate, and the harness is proven able to observe a write | AGREES |
| the SIBLING's disposition for the identical shape (`missing:` bullet 1) | `31-VERIFICATION.md` `missing:` [1] | the two routes answered the identical input differently: `promoteAdmitted` declined `destination-outside-governed-store`, `admitAndAppend` fell open | `promoteAdmitted` into an UNGOVERNED destination: **`DECLINED (context-io.promoteAdmitted)`**, `UNGOV notes 0`. `admitAndAppend` with an ungoverned store: **refused, same clause string**, both reading it from the ONE exported constant `UNNAMEABLE_OWNER_CLAUSE = "destination-outside-governed-store"` | **MOVED — the two dispositions AGREE, and they agree through one constant rather than two spellings** | AGREES with `31-39` |

### 2.2 CR-27 — the governance DIAL versus the ledger RECORD at the fall-through

`31-REVIEW.md` CR-27's own construction: a `TRUSTED` root whose `.grugops/factory.config.json` is the
literal `{ this is not json` (the shape `D-14` must fail-closed on) and a `DEST` root with a
readable, permissive configuration.

| Probe spelling | From | Round-8 result (pre-fix) | This round (post-fix) | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| `promoteAdmitted("T-DIAL", "src-id", {kind:observation, verified_by:""}, "a body", "irrelevant-from", DEST.store, TRUSTED.root)` | `31-REVIEW.md` CR-27 / `31-VERIFICATION.md` row 3 | **`WROTE 20260911T000000Z-qe-observation-ca9a3594`**, `notes in DEST: 1` — the caller-supplied destination decided whose configuration adjudicated the admission | `PREMISE governanceRootOf(DEST.store) === DEST.root : true`; **`REFUSED: context-io.appendNote: refusing to write a note the admission authority did not accept. Nothing was written: admission REFUSED (UNKNOWN - verify): a governance …`**; `notes in DEST: 0` | **MOVED — CR-27 CLOSED.** The dial now answers from the caller's own trusted root on this path | AGREES with `31-39` (D-39) |
| the CONTROL — the identical call with `to = TRUSTED.store` | `31-REVIEW.md` CR-27's own control | **`REFUSED: "admission REFUSED (UNKNOWN - verify): a governance …"`** — correct, and the asymmetry with the row above WAS the finding | **`REFUSED`**, the identical D-14 message; `notes in TRUSTED: 0` | **UNMOVED, and the ASYMMETRY IS GONE** — same note, same caller, same unreadable trusted configuration, same answer whichever destination is named | AGREES |
| the DIAL/RECORD separation (`missing:` bullet 2) | `31-VERIFICATION.md` `missing:` [2] | `appendNote`'s sixth parameter answered BOTH questions, and `admit()` was byte-frozen so it could not be given two roots | read from the committed `.ts`: `appendNote(task, note, body, contextRoot, precomputedId, repoRoot = trustedRepoRoot(), ledgerOwner: ActionOwner = actionOwnerRoot(contextRoot))` and `admit(task, text, contextRoot, repoRoot = ROOT, ledgerOwner: ActionOwner = answeredOwner(repoRoot))` — **two parameters, two questions**. The fall-through reads `return appendNote(task, note, body, to, undefined, repoRoot, destinationOwner);` — dial from the caller, record from the destination | **MOVED — the collapse is undone by a signature change, not by an argument swap.** `admit()` was unfrozen under the dated decision `D-39` and re-baselined (§8.3) | AGREES with `31-39` |
| the derived call-site census (`missing:` bullet 3) | `31-VERIFICATION.md` `missing:` [3] | no such enumeration existed | `ROOT_DIVERGENCE_DISPOSITIONS` read from the committed `.js`: **3** entries — `RD-31-40-01` and `RD-31-40-02` (`scripts/check-uat-oracles.ts::equivDoWork#appendNote@1` and `@2`, kind `one-half-action`, `visible_to_census: true`) and `RD-31-40-03` (`scripts/check-platform-shapes.ts::contextDriverBody#appendNote@text`, kind `published-residual`, **`visible_to_census: false`**). `ROOT_DIVERGENCE_KINDS` = **3**, closed | **MOVED — the enumeration exists, is derived, and NAMES the one site a syntax-tree census cannot see** rather than omitting it | AGREES with `31-40` (D-40) |

### 2.3 The six Warnings

| Probe spelling | From | Round-8 result (pre-fix) | This round (post-fix) | Verdict | vs. the fixer |
|---|---|---|---|---|---|
| **WR-37** — the swallow positions inside `frameworkSurface`'s walk | `31-REVIEW.md` WR-37 (`:1353-1355`, `:1426-1428`, `:1437-1439`, `:1459-1461`) — **four** routes swallowing a subtree with no signal | four routes, none setting `truncated`; `SURFACE_TRUNCATION_ARMS` claimed to be every early stop | read from the committed `.js`: `SURFACE_SWALLOW_SITES` = **9** entries, each naming the arm it takes — `addDeclarations#1` → `surface-unreadable`, `frameworkSurface#1` → `surface-unreadable`, `frameworkSurface#2` → `exports-unreadable`, `frameworkSurface#3` → `surface-unreadable`, `frameworkSurface#4` → `surface-unreadable`, `containerTypeArguments#1` → `container-unreadable`, `hasExpandableMembers#1/#2` → `depth-bound`, `isDefaultLibraryDeclaration#1` → `depth-bound`. `SURFACE_TRUNCATION_ARMS` = **5** (`node-bound`, `depth-bound`, `exports-unreadable`, `container-unreadable`, **`surface-unreadable`**) | **MOVED — WR-37 CLOSED, and the DERIVATION found NINE positions where the review named four.** No site is silent | AGREES with `31-42` (D-42 (1)); the throwing-stub seam is named as not re-driven here (§1.2) |
| **WR-38** — the reachability binding's denominator | `31-REVIEW.md` WR-38 (`:9678-9707`) | the expected side derived from `BANNED_MODIFIER_HEADS`/`BANNED_EXACT_PATHS` only — **2 of 4** published ban sets; only `skip` driven by a REACH row | `row("REACH-…")` string-literal ids derived from the test file: **12** rows, of which **8** are member rows keyed by the publishing CONSTANT's own name — `REACH-BANNED_MODIFIER_HEADS-test`, `-describe`, `REACH-BANNED_EXACT_PATHS-expect.soft`, `REACH-BANNED_CONFIGURED_PATHS-expect.configure`, `REACH-BANNED_MODIFIER_TAILS-skip`, `-only`, `-fixme`, `-fail`. The four published sets measured from the committed `.js` hold **2 + 4 + 1 + 1 = 8** members | **MOVED — WR-38 CLOSED. 8 of 8 published members over 4 of 4 sets, and the row id follows the constant so a fifth set joins by existing** | AGREES with `31-42` (D-42 (4)) |
| **WR-39** — `R-31-33-02`'s published text | `31-REVIEW.md` WR-39 | "With NO arguments, the note lands in `DEFAULT_CONTEXT_ROOT` … while the GOV-02 event lands under `trustedRepoRoot()`, the HOST repository" — false for the branch the round changed | read from the committed `.js`: `R-31-33-02`'s `shape` now opens "With NO arguments, the note and its GOV-02 record both land in `DEFAULT_CONTEXT_ROOT`'s own repository — the KIT's (`join(ROOT, \".g…`" | **MOVED — WR-39 CLOSED.** The residual describes the post-fix mechanism | AGREES with `31-41` (D-41) |
| **WR-40** — `18-context-compaction.md`'s entry-derivation claim | `31-REVIEW.md` WR-40 (`:83`) | one universal sentence — "Each route derives the owning repository from the context store it writes the note into … above every branch" — false on `admitAndAppend`'s ungoverned case and on its non-gated branch | the paragraph at `:84` now reads per route AND per branch: "The re-binding route resolves the destination store's owning repository at its entry. Its gated arm … Its fall-through carries the same answer … The admit-then-persist route resolves its own store's owning repository at its entry. Its gated branch … Its non-gated branch hands the same answer to the admission authority …" with **`R-31-33-01`, `R-31-33-02`, `R-31-41-01` and `R-31-41-02` named INLINE**. The universal sentence is gone (`grep` for it: 0 hits) | **MOVED — WR-40 CLOSED.** The claim is stated where the mechanism can carry it | AGREES with `31-41` (D-41 (1)) |
| **WR-41** — the note-position CONTROL's "ordinary outcome" | `31-REVIEW.md` WR-41 (`:307-327`, `:478-489`) | the driver set `verdict = "write"` on any non-throwing call, the ordinary staging planted bytes IDENTICAL to the writer's so the call took the no-op branch, and the row printed `ordinary outcome (correct)` over a disk nobody inspected | `node scripts/check-platform-shapes.js` → **EXIT 0**, `DRIVEN (13)`, `SKIPPED SHAPES (0)`, `ALL CHECKS PASSED`; all four CONTROL rows print `ordinary outcome (correct)`. Read from the committed `.ts`: the in-child driver computes `out.verdict = before.sha === after.sha ? "identical-no-op" : "write"` (`:622`), the note position's `controlOutcome` is **`identical-no-op`** (`:948`), and the harness reads the planted position itself through `verifyAfter` (`:837`, `:949`, `:1024`) | **MOVED — WR-41 CLOSED.** The ordinary outcome is the one that actually happens, and the control observes its own effect at the target | AGREES with `31-43` (D-43 (1), D-43 (2)) |
| **WR-42** — the widened refusal and its shared-install cost | `31-REVIEW.md` WR-42 (`:2553-2560`) | no `WRITE_PATH_RESIDUALS` member for the widened refusal; the shared-install shape `UNKNOWN - verify`, with the review REASONING that a kit-side store "has no governance configuration … so `governanceRootOf` would answer `null` there and every promotion into it would throw" | `WRITE_PATH_RESIDUALS` = **9** members, including **`R-31-41-01`** ("Moving the destination decline above `promoteAdmitted`'s human-stamp fall-through WIDENED the refused input set…"). The shared-install answer **RE-DRIVEN INDEPENDENTLY HERE** against a kit home the committed `install/install.js` created — see the transcript below | **MOVED — WR-42 CLOSED, and the review's own reasoning is measured WRONG.** §6.1 | AGREES with `31-41`'s own record, which recorded the same disagreement |

**WR-42's shared-install reading, re-driven in this session** (`HOME` = scratch, `GRUGOPS_SRC` = this
repository, `GRUGOPS_HOME` = `<scratch>/.grugops`, `TARGET` = `<scratch>/hostrepo`):

```
installer EXIT=0
kit home contents: agent-factory
agent-factory/config/factory.config.json present: yes
.grugops/factory.config.json under kit home present: no
READING 1  governanceRootOf(<kit>/.grugops/context) = <scratch>/.grugops      ← NOT null
CONTROL    (the same, with the in-kit configuration removed) = null
```

The CONTROL is what makes the positive reading attributable to `agent-factory/config/factory.config.json`
— the `in-kit` published candidate `copyKit` copies — rather than to the walk. **So the widened
refusal does not fire on the shipped shared-install shape.**

### 2.4 The three Info items

| Item | Probe spelling | Round-8 result (pre-fix) | This round (post-fix) | Verdict |
|---|---|---|---|---|
| **IN-19** | `node scripts/runnable-ref/uat-spec-integrity.js .` on THIS repository | exit 2; stderr `the walk SKIPPED directory entries by name: .git=1, .temp=1, node_modules=1 — …` — fires on essentially every host run, and the count's meaning unstated | **EXIT=2**; stderr **529 bytes**, `the walk SKIPPED directory entries by name: **.temp=1** — these directory names are the walk's input boundary … **Each number is a count of DIRECTORY ENTRIES the walk refused to descend into, never a count of uat specs hidden under them; the walk did not look inside, so it does not know that number.**` `.git` and `node_modules` are NO LONGER named. (The second stderr line is the pre-existing `ZERO uat specs were visited` could-not-run reason, which is why the exit is 2 on this repository.) | **MOVED — IN-19 CLOSED.** The watched set is partitioned by whether a skip there could hide THIS repository's own evidence, and the counted thing is named in the emitted line |
| **IN-20** | `record(position, shape, ordinary && !namedRefusal ? ORDINARY_OUTCOME : "REFUSED (wrong)", …)` at `:488` | every non-ordinary outcome printed `REFUSED (wrong)` — a crash, a `no-answer` and a `status=N` all mis-diagnosed in the table earlier rounds compare against | read from the committed `.js`: `PLATFORM_SHAPE_OUTCOMES` = **11** (`write`, `identical-no-op`, `no-write`, `refuse`, `answered`, `fail-closed`, `no-answer`, `nonzero-exit`, `signalled`, `crashed`, `unclassifiable`); `CONTROL_OUTCOME_LABELS` = **13**; `ROW_LABELS` = **16**; `controlOutcomeLabel(o)` returns `NOT ORDINARY (<o>)` for every one of the 11 | **MOVED — IN-20 CLOSED.** A label names the outcome that happened |
| **IN-21** | `expect(exemptNoClaim + exemptNoFile + rows.filter(…).length).toBe(rows.length)` at `:188-189` | a three-term partition of `rows` by construction — an equality that cannot fail for any input | the expression is **GONE** (`grep` for `toBe(rows.length)`: 0 hits). `:188-189` now carries the ordinal-contiguity assertion, and `:225` carries the removal's own record ("WHAT WAS THERE. `exemptNoClaim + exemptNoFile + (rows with both files and mechanisms) === …`"). The two floors that CAN fail replaced it; `docs/audit/harness-false-result-instances.md` has grown 14 → **16** rows | **MOVED — IN-21 CLOSED by REMOVAL, with the removal recorded rather than silent** |

---

## 3. The control ledger — every round-6 and round-7 closure re-driven at this commit

`31-39`, `31-40`, `31-41` and `31-43` all edited `scripts/context-io.ts`, the module `CR-19`'s,
`CR-20`'s and `CR-22`'s closures live in. `31-42` edited `scripts/runnable-ref/uat-spec-integrity.ts`,
the module `CR-18`'s, `CR-21`'s, `CR-23`'s and `CR-25`'s closures live in. `31-39`, `31-40`, `31-41`
and `31-43` each edited `hooks/hook-entry.ts`, `CR-17`'s module. **Every prior closure sits inside a
module this round changed**, which is why these are regression evidence and not a courtesy.

**Round 8's verifier re-drove NONE of `CR-22`, `CR-23`, `CR-24` or `CR-25` — all four were confirmed
by reading source plus one suite run, with the reproduction budget spent on the two NEW Criticals**
(`31-VERIFICATION.md`'s own "Reproduction budget note"). So before this session those four closures
rested on round 7's readings and had never been re-taken. **All four are driven below, beside the five
round-6 closures.**

| Closure | Independently DRIVEN since it closed? | Probe spelling | This round | Verdict |
|---|---|---|---|---|
| **CR-17** | **NO** — accepted by source-read in rounds 7 and 8 | CONTROL: ordinary Bash payload, unmodified manifest, `node <kit>/hooks/hook-entry.js admission-guard.js` | **EXIT=0**, 0 bytes stdout, 0 bytes stderr | **UNMOVED — intact** |
| **CR-17** | **NO** | the same through the OTHER decider, `… hook-entry.js guard.js` | **EXIT=0**, 0 bytes stdout, **27 bytes** stderr (`all checkpoints at default` — the guard's ordinary line) | **UNMOVED** |
| **CR-17** | **NO** | `mkfifo <kit>/scripts/checkpoints.js` (asserted `isFIFO() === true`), then `… admission-guard.js` | **EXIT=0**, **782 bytes** of `permissionDecision:"deny"`; reason **665 characters**, naming `"scripts/checkpoints.js" … is not a regular file (manifest-path-not-a-regular-file)` | **UNMOVED — CR-17's closure holds across four plans' edits to this exact file** |
| **CR-17** | **NO** | the same FIFO through `… guard.js` | **EXIT=0**, the same 782-byte named deny | **UNMOVED — the rule is the wrapper's, not one decider's** |
| **CR-17** | **NO** | a **DIRECTORY** at the same manifest position (asserted `isDirectory() === true`) | **EXIT=0**, the same named deny | **UNMOVED** |
| **CR-18** | **NO** | `import { test as it }; if (false) { function it(): void {} void it; } it.skip("scenario", …)` | `tsc` EXIT=0; `1 finding(s) over 1/1`, `:3: … test.skip`, **EXIT=1** | **UNMOVED — intact across `31-42`'s edits to this module** |
| **CR-18** | **NO** | the CONTROL — the identical file with the `if (false)` block removed | `tsc` EXIT=0; `1 finding(s)`, `:2: … test.skip`, **EXIT=1** | **UNMOVED** |
| **CR-18** | **NO** | the NAMESPACE family — `import * as pw; if (false) { function pw(): void {} } pw.test.skip(…)` | `tsc` EXIT=0; `1 finding(s)`, `:3: … test.skip`, **EXIT=1** | **UNMOVED** |
| **CR-18** | **NO** | the AMBIENT spelling — `declare const it: unknown;` beside `import { test as it }` | `0 findings over 1/1`, **EXIT=0** — **and `tsc` EXIT=2** | **UNMOVED — and still a construct the language refuses.** This is `R-31-31-01`, carried; §10 |
| **CR-18** | **NO** | the CONTROL — a block-scoped CLASS (`{ class it {} void it; }`) | `tsc` EXIT=0; `1 finding(s)`, `:3: … test.skip`, **EXIT=1** | **UNMOVED** |
| **CR-19** | **NO** | `appendNote("T-1", {security-nfr/observation}, "x".repeat(9*1024*1024), <ctx>, undefined, <root>)` | **REFUSED**: `refusing to write (note-above-size-ceiling) — the composed note under id "…" is 9437359 bytes, above the 8388608-byte ceiling`; notes on disk **0** | **UNMOVED — intact across four plans' edits to this module** |
| **CR-19** | **NO** | the CONTROL — a small note through the same call | `WROTE 20260617T142305Z-security-nfr-observation-614360ac`; notes on disk **1** | **UNMOVED** — legitimate input untouched |
| **CR-20** | **NO** since round 7 | origin `admitAndAppend` under `human:alice`, then `promoteAdmitted(…, to=THIRD, repoRoot=DEST)` | ORIGIN notes 1 / ledger 1; promotion returns the origin id **unchanged** (`…-1c6d4de5`, asserted `true`); **THIRD notes 1, THIRD ledger 1; DEST notes 0, DEST ledger ABSENT** | **UNMOVED — intact** |
| **CR-21** | **NO** | `test("scenario", { tag: "@smoke" }, async ({ page }, testInfo) => { testInfo.skip(); … })` | `tsc` EXIT=0; `1 finding(s)`, `:3: … test.info().skip`, **EXIT=1** | **UNMOVED — intact** |
| **CR-21** | **NO** | the CONTROL — the identical scenario in the two-argument form | `tsc` EXIT=0; `1 finding(s)`, `:3: … test.info().skip`, **EXIT=1** | **UNMOVED** |
| **CR-22** pos 1 | **NO** — source-read in round 8 | `promoteAdmitted("T-1", id, <no human stamp>, from=ORIGIN, to=THIRD, repoRoot=DEST)` | `-> 20260617T142305Z-engineer-observation-b8a6e519`; **THIRD notes 1, THIRD ledger 1; DEST notes 0, DEST ledger ABSENT** | **UNMOVED — the closure holds** |
| **CR-22** pos 2 | **NO** | `promoteAdmitted` into an UNGOVERNED destination (`governanceRootOf(UNGOV.store)` printed `null` first) | **`DECLINED (context-io.promoteAdmitted)`**; **UNGOV notes 0**, DEST ledger ABSENT | **UNMOVED** |
| **CR-22** pos 3 | **NO** | `admitAndAppend("T-1", {by:"security-nfr", verified_by:"human:alice"}, contextRoot=DEST3 store, repoRoot=LEDGERROOT)` | `-> {"id":"20260617T142305Z-security-nfr-finding-09eddf93","findings":[]}`; **DEST3 notes 1, DEST3 ledger 1; LEDGERROOT notes 0, ledger ABSENT** | **UNMOVED** |
| **CR-22** pos 4 | **NO** | the DEFAULT arguments | **NOT DRIVEN.** `DEFAULT_CONTEXT_ROOT` exported? **`false`** (re-measured). `trustedRepoRoot()` on this tree = `/Users/olgeroeselg/Projects/public/grugops` | **NOT CLOSED — published as `R-31-33-02`** (§10) |
| **CR-22** CONTROL | **NO** | the legitimate promotion, `to` and `repoRoot` under the SAME root | `-> 20260617T142305Z-engineer-observation-5c3d7f0a`; **D4 notes 1, D4 ledger 1** | **UNMOVED** |
| **CR-23** inst 1 | **NO** — source-read in round 8 | `import { describe } from "other-framework"; describe.skip("a whole group of scenarios", …)` — the review's own spec, verbatim | `tsc` **EXIT=0**; `1 finding(s) over 1/1`, `uat/p.uat.spec.ts:3: banned modifier call — \`describe.skip\``, **EXIT=1**, 0 bytes stderr | **UNMOVED — intact across `31-42`'s identity work** |
| **CR-23** inst 2 | **NO** | `import { expect } from "other-assert"; expect.soft(…)` — driven both as the corpus fixture and as the review's bare five-line form | corpus fixture: `1 finding(s)`, `:28: … \`expect.soft\``, **EXIT=1**; bare form: `1 finding(s)`, `:5: … \`expect.soft\``, **EXIT=1**; `tsc` EXIT=0 both | **UNMOVED** |
| **CR-23** decl-FILE half | **NO** | a real `.d.ts` with **no** `declare module` block (`grep -c 'declare module'` → **0**, printed first), imported relatively | `tsc` **EXIT=0**; `1 finding(s)`, `:3: … \`describe.skip\``, **EXIT=1** | **UNMOVED — both halves of D-35's discriminant still refuse** |
| **CR-24** | **NO** — source-read in round 8 | one live note + one 9 MiB REGULAR note file + one `chmod 000` REGULAR note file, then `render()` | both planted files asserted `isFile() === true` and the big one measured **9 437 184 bytes** first. `NOTE_SKIP_ARMS` = 5, `READ_POSITION_CONDITIONS` = 3. Rendered table: the EACCES row reports arm **`unopenable`**, the over-ceiling row reports arm **`above-ceiling`**, the live note renders | **UNMOVED — no row's `detail` contradicts its `arm`** |
| **CR-25** 4-hop | **NO** | `t.deep.p.p.p.skip` — under every bound | `tsc` EXIT=0; `1 finding(s)`, naming `test.deep.p.p.p.skip`, **EXIT=1**, 0 bytes stderr | **UNMOVED — identity still refuses a reachable member** |
| **CR-25** 7-hop | **NO** | `t.deep.p…p.skip`, `j=6` | **EXIT=2**, **516 bytes** on stderr naming the depth bound | **UNMOVED — the refusing half is still a could-not-run, as `31-35` priced in advance** |
| **CR-25** 8-hop | **NO** | `t.deep.p…p.skip`, `j=7` — the formerly silent accept | **EXIT=2**, 516 bytes, the same named cause | **UNMOVED — CR-25's closure holds** |
| **CR-25** container | **NO** | `t.many[0].skip` behind `many: GrugHeld[]`, the corpus row's own spelling (`const t = test;`) | `tsc` EXIT=0; `1 finding(s)`, naming `test.many.skip`, **EXIT=1** | **UNMOVED** |
| **CR-25** index sig | **NO** | `t.bag.anything.skip` behind `[key: string]: GrugMod`, the corpus row's own spelling | **`0 findings over 1/1`, EXIT=0**, `tsc` EXIT=0 | **OPEN — and DISCLOSED**: `UNRESOLVABLE_CALLEE_RESIDUALS` member 9, driven by corpus row `CR25-INDEX-SIGNATURE-open`. §10 |
| **CR-25** index sig, bounding half | **NO** | the same construction with a **plain `test` head** | `1 finding(s)`, naming `test.bag.anything.skip`, **EXIT=1** | **UNMOVED — the spelling rule bounds the disclosure** |

**30 control rows. 29 driven, 1 named as not-driven with its reason (`CR-22` position 4). 29 UNMOVED
— zero prior closures were lost by this round's fixes.** The one row that reads like a residual
(`CR-18`'s ambient spelling) is unmoved in both directions and was already recorded as `R-31-31-01`.
**Nine of the closures — `CR-17`, `CR-18`, `CR-19`, `CR-21`, `CR-22`, `CR-23`, `CR-24`, `CR-25` and
`CR-20` — had not been independently DRIVEN since the round that closed them; they are driven here.**

---

## 4. The two counts, stated separately

| Count | Value | What it is |
|---|---|---|
| reproductions the source documents recorded that were RE-DRIVEN here | **29** | a reading taken at this commit at the original spelling |
| reproductions NAMED as not re-driven, with the reason | **2** | `CR-22` position 4 (§1.2 item 2) and `WR-37`'s throwing-stub seam (§1.2 item 1) |
| findings this round's own probing raised | **1** | `CR-28`, §5 — raised, NOT repaired |
| prior-record disagreements printed rather than absorbed | **3** | §6 |

---

## 5. One NEW finding, raised by this round's own probing and DELIBERATELY NOT REPAIRED

### CR-28 — a RENAMED import from a declared-foreign module is accepted at exit 0

**Severity: Critical, by the same standard `CR-23` was filed under** — a published ban member
becomes unreachable on a construct that type-checks clean, and the whole corpus stays green over it.

**Found while re-driving `CR-23` instance 2.** The first attempt at that row was written as a
paraphrase (`import { expect as soften } from "other-assert"`) rather than the review's own spelling.
The paraphrase read `0 findings`, which is the signal this document exists to notice. The row was
then re-driven at the ORIGINAL spelling (§3, `CR-23` inst 2, which refuses) and the paraphrase was
pursued separately, as a probe in its own right.

**REPRODUCED at this commit, against the committed `scripts/runnable-ref/uat-spec-integrity.js`, in
an equipped probe root outside the tree:**

```
[import { expect as soften } from "other-assert"; soften.soft(1).toBe(1)]
    tsc EXIT=0 | checker EXIT=0 | stderr 0 bytes
    UAT spec integrity: 0 findings over 1/1 uat specs checked

[import { describe as grouping } from "other-framework"; grouping.skip("…", () => {})]
    tsc EXIT=0 | checker EXIT=0 | stderr 0 bytes
    UAT spec integrity: 0 findings over 1/1 uat specs checked
```

**The two CONTROLS that bound it**, both driven in the same session:

```
[import { describe } from "other-framework";  describe.skip(…)]  -> 1 finding(s), EXIT=1
[import { test as it } from "@playwright/test"; it.skip(…)]      -> 1 finding(s), EXIT=1  (reported as `test.skip`)
```

So the ban refuses the un-renamed foreign spelling, and it refuses a renamed FRAMEWORK spelling; it
is the renamed **declared-foreign** spelling that passes.

**The mechanism, read from the source rather than inferred.** `IDENTITY_BAN_OPERAND` gives the
`foreign-declared` arm the operand `"spelled"` (`scripts/runnable-ref/uat-spec-integrity.ts:1709`), so
the membership authority is asked about the path the SPELLING rule derived — which is
`canonicaliseHeadSegment(calleeDottedPath(…), renames, scope)`. `deriveImportRenames` (`:2533`)
collects a rename only from one module:

```ts
if (node.moduleSpecifier.text !== PLAYWRIGHT_TEST_MODULE) return;
```

A rename of any other module is therefore absent from the map, `canonicaliseHeadSegment` returns the
path unchanged, and the authority is asked about `soften.soft` / `grouping.skip` — neither of which
is a published ban member. **The module filter was correct while `foreign` was TERMINAL and became
load-bearing the moment `D-35` made `foreign-declared` ask the spelling rule.** This is the ninth
occurrence of this phase's recorded pattern: the fix that closed the prior round's Critical created
its successor one register over.

**Why the suite is green over it.** Measured: `grep -n 'as .* } from "other-' scripts/runnable-ref/fixtures/*.ts`
returns **nothing** — no corpus row drives a renamed declared-foreign import. The `WR-38` reachability
rows added by `31-42` drive each published member through a declared-foreign module by its OWN name
(`import { test } from "reach-other-framework"`), which is the spelling the rename evades.

**It is NOT a published residual.** `UNRESOLVABLE_CALLEE_RESIDUALS` was read from the committed `.js`
and searched: **1** of its 10 members mentions an alias, and that is the index-signature member, about
a different shape.

**NOT REPAIRED HERE.** This plan writes no source and no test; a new defect belongs in a new plan with
its own RED-first reproduction. Recorded in `deferred-items.md` with an owner and a closing criterion,
and in §10 as an accepted-open residual of the fenced phase.

---

## 6. The disagreements, recorded rather than absorbed

### 6.1 `WR-42`'s stated reasoning is measurably WRONG, and the finding is still right

`31-REVIEW.md` WR-42 reasons that a kit-side store at `~/.grugops/.grugops/context` "has no
governance configuration and no VCS marker written by `install/install.ts` … so `governanceRootOf`
would answer `null` there and every promotion into it would throw."

**Measured here, independently of `31-41` and against a kit home the committed `install/install.js`
created: `governanceRootOf(<kit>/.grugops/context)` answers the KIT HOME, not `null`** (§2.3), because
`copyKit` copies `agent-factory/config/factory.config.json` — the `in-kit` published candidate — and
the upward walk remembers it as `nearest`. **The CONTROL with that one file removed answers `null`.**

Both values are printed. The finding's ASK (publish the widened refusal as a register member) was
right and is closed; its stated CONSEQUENCE was wrong and is corrected by measurement. `31-41`
recorded the same disagreement independently; this session's reading agrees with `31-41`'s and
disagrees with the review's.

### 6.2 `CR-17`'s deny payload is 782 bytes here and 733 bytes in round 7's record

`docs/audit/31-round7-residuals.md` §3 records **733 bytes** of `permissionDecision:"deny"` for the
FIFO case; this session measures **782**. **Both values are printed and neither record is edited.**
The reason is measured rather than argued: the deny reason embeds the absolute path of the offending
module, this session's scratch kit lives under a longer path than round 7's, and the reason string
itself is **665 characters** of which the path is the only variable part. The MECHANISM — the named
`manifest-path-not-a-regular-file` clause, at exit 0, through both deciders — is identical.

### 6.3 One harness false result about this session's own premise

Logged in `deferred-items.md` and described in §1.3. The first `context-io` probe omitted `refs` from
its note object; the module threw a `TypeError` from `composeNote`, and the probe's catch-all
classifier printed it as `REFUSED: note.refs is not iterable`. Read straight, that is a page of
refusals — including on the rows that are supposed to WRITE. **Caught because the CONTROL rows refused
too**, which is the same discrimination test round 7's instance 15 was caught by. It is logged rather
than absorbed, and it is why every `context-io` row in §2 and §3 prints a CONTROL that writes.

### 6.4 One of the round's five SUMMARIES claims two requirements complete; the tree says otherwise

Measured across the round's five summaries:

```
31-39: requirements-completed: []
31-40: requirements-completed: []
31-41: requirements-completed: []
31-42: requirements-completed: []
31-43: requirements-completed: [UATX-01, UATX-04]
```

`31-43-SUMMARY.md` is the one whose frontmatter asserts two requirements COMPLETE. Every other
summary of the round wrote `[]`, and each of the five says in its own prose that it flips no
requirement. **The tree agrees with the four and not with the one**: `.planning/REQUIREMENTS.md` is
byte-unchanged over the whole round, all six `UATX-0N` are `- [ ]`, and all six traceability rows
read `Gaps Found` (§11). So no box moved — what moved is a machine-readable claim in a committed
artifact, asserting a completion the eighth verification round explicitly withheld (`UATX-01` is the
requirement it blocked on).

**Both values are printed and `31-43-SUMMARY.md` is NOT edited** — a prior round's record is history.
The disagreement is a row here and an entry in §10, because a `requirements-completed` field is read
by tooling, and a field that outruns its mechanism is the exact shape this phase exists to close, one
artifact over.

---

## 7. The measurement environment, proven clean by predicates that can OBSERVE it

### 7.1 The tree, at the pinned commit

```
$ git rev-parse HEAD
6e95edcce3da04cd19c8d0b6b9253cf45ed986e0
$ git status --porcelain -- scripts hooks agent-factory install docs .github vitest.config.ts package.json .planning/REQUIREMENTS.md .planning/ROADMAP.md
(empty, before the first probe)
$ git status --porcelain -- scripts hooks agent-factory install docs .github vitest.config.ts package.json .planning/REQUIREMENTS.md .planning/ROADMAP.md
(empty, after the last probe and after the full suite)
```

Platform: darwin 25.5.0 arm64, Node v24.12.0.

### 7.2 The residue predicate, DEMONSTRATED able to observe a change

An empty `git status` is evidence only if the command can report a non-empty one. Demonstrated in a
scratch git repository outside the tree, holding copies of two of this repository's tracked build
outputs:

```
READING A (clean scratch copy):
$ git status --porcelain -- scripts hooks agent-factory install
(empty)

READING B (one line appended to a tracked file):
$ git status --porcelain -- scripts hooks agent-factory install
 M scripts/check-platform-shapes.js
```

**The predicate reports a change when one is present.** The empty readings in §7.1 are therefore
evidence rather than a default.

### 7.3 `.temp/`, the named-pipe sweep, and why the ORDER is load-bearing

```
$ find .temp -mindepth 1                                   (AFTER the suite)
(empty — count 0)
$ find . -path ./node_modules -prune -o -type p -print     (AFTER the suite)
(empty — count 0)
```

**Both readings were taken AFTER `SUITE EXIT=0`, and that timing is the whole point.** Taken *during*
the run, the same two commands answer differently — measured in this session, twice:

```
MID-FLIGHT reading 3:  .temp entries = 624   (e.g. .temp/freshness-clones/prefix-plant/.git/config)
MID-FLIGHT reading 4:  named pipes  = 1      ./.temp/31-27-parity-ov1gLp/scripts/checkpoints.js  (a LIVE FIFO)
                       .temp entries = 140
```

A cleanliness predicate run concurrently with the thing it is measuring answers about the
measurement, not about the tree. The mid-flight readings are printed here so the post-suite zeros are
read as the end of a process rather than as a constant.

### 7.4 Every harness's premise, and the assertion that established it

| Harness | The premise it could have got wrong | How it was asserted, before any result was read |
|---|---|---|
| the AST probes | an unequipped root answers `PROGRAM_UNAVAILABLE_REASON`, not the ban | equipped exactly as `equipTarget` does (§1.3), **and every row prints its own `tsc --noEmit` exit code** |
| the AST probes' resolution | a scratch root outside the repo cannot resolve `typescript` | a `node_modules` **symlink** to this repository's, and a control row that REFUSES proves resolution happened |
| the `context-io` probes | a directory that is not a governance root silently changes which branch runs | `governanceRootOf(store) === root` printed per root, per probe |
| the `context-io` probes | a malformed note object produces a refusal-shaped harness error | the classifier re-throws `TypeError`; every probe prints a CONTROL that WRITES (§1.3, §6.3) |
| the note/ledger counters | counting the wrong directory reads every write as zero | the counters were corrected until a CONTROL read `notes= 1 ledger= 1`; a counter that can never be non-zero cannot observe a split |
| the `hook-entry` probes | the argv could be typed wrong and probe nothing | the two routes **derived from `hooks/hooks.json`** and printed before the kit was driven |
| the FIFO/DIRECTORY probes | a position that is an ordinary file would deny for another reason | `isFIFO()` / `isDirectory()` printed `true` before the drive, and the CONTROL at the same position exits 0 silently |
| the `DECIDER_MANIFEST` check | a manifest parse that silently went short reads as "no mismatches" | decider keys and `(path, hash)` pairs derived and both counts printed (2 and 26 over 14 paths), with `files missing on disk` printed as its own number |
| the `FROZEN_HOOK_ENTRY_LOGIC_SHA` check | a normalisation that removed nothing would hash the whole file | total / normalised / **REMOVED** byte counts printed BEFORE the digest (§8.3) |
| the `ADMIT_FROZEN_SHA256` check | a brace-scan that found nothing would hash an empty string | the span offset and its **15 012** bytes printed before the digest, and `endsWith("}")` asserted |
| the item derivation | a heading inside a fenced transcript counts as a finding | fences stripped before the heading scan, both counts printed (§1.1) |
| the `.temp` / FIFO sweep | a sweep run during the suite measures the suite | taken after `SUITE EXIT=0`, with the mid-flight readings recorded (§7.3) |

---

## 8. The one-commit gate record — measured, and recorded as a FLOOR

### 8.1 The whole repository, at one commit, with a clean tree

| # | Gate | Command | Final line | Exit |
|---|---|---|---|---|
| 1 | the excluded-e2e suite | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 66 passed (66)` · `Tests 4349 passed \| 2 skipped (4351)` · `Duration 470.42s` | **0** |
| 2 | build | `npm run build` | `> tsc` | **0** |
| 3 | typecheck | `npm run typecheck` | `> tsc --noEmit && tsc -p tsconfig.tests.json && tsc -p tsconfig.fixtures.json` | **0** |
| 4 | build parity | `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` | **0** |
| 5 | output freshness | `npm run freshness` | `All build outputs fresh: 61 committed .js file(s) match a rebuild of their sources.` | **0** |
| 6 | hook-manifest freshness | `npm run freshness:hook-manifest` | `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.` | **0** |
| 7 | foundation guards | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` | **0** |
| 8 | UAT oracles | `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` | **0** |
| 9 | platform shapes | `node scripts/check-platform-shapes.js` | `ALL CHECKS PASSED` (`DRIVEN (13)`, `SKIPPED SHAPES (0)`, four CONTROL rows `ordinary outcome (correct)`) | **0** |
| 10 | claim anchors | `npm run check:claim-anchors` | `ALL CHECKS PASSED` | **0** |
| 11 | audit register | `npm run check:audit-register` | `ALL CHECKS PASSED` | **0** |
| 12 | residual citations | `npm run check:residual-citations` | `ALL CHECKS PASSED` | **0** |
| 13 | banned claims | `npm run check:banned-claims` | `ALL CHECKS PASSED` | **0** |
| 14 | NUL bytes | `npm run check:nul-bytes` | `ALL CHECKS PASSED` | **0** |
| 15 | public docs | `npm run check:public-docs` | `ALL CHECKS PASSED` | **0** |
| 16 | diff disposition | `npm run check:diff-disposition` | `FAIL diff disposition — changed watched file(s): 78 finding(s) over 39 elements` · `1 CHECK(S) FAILED` | **1** — the standing debt, §8.4 |

### 8.2 The doctrine, stated BESIDE the green rather than instead of it

The suite is a **floor**, not the proof. `CR-26` and `CR-27` — the two Criticals the eighth
verification round blocked on — were both live at a commit whose suite was green at
`66 passed / 4208 passed / 2 skipped / exit 0`. This round's suite is green at
`66 passed / 4349 passed / 2 skipped / exit 0`, **+141 tests over the round**, and `CR-28` (§5) is
live inside it. **Nine rounds, nine times the green suite failed to exercise the defect that round
found.** The suite figures are recorded because a RED suite would disqualify the round; they are not
recorded as evidence that the round closed anything.

### 8.3 The frozen floors, RE-MEASURED rather than assumed

| Floor | Fresh measurement | Baseline | Verdict |
|---|---|---|---|
| `hooks/guard.ts` | `git hash-object hooks/guard.ts` → `669725bc1c616ab57123e22090d93d57eff1b001` | `FROZEN_GUARD_BLOB` = `669725bc1c616ab57123e22090d93d57eff1b001` (`scripts/floor-invariance.test.ts:245`) | **EQUAL — the byte-frozen deploy guard is untouched by this round** |
| `hooks/hook-entry.ts` logic | markers located (`open@13155`, `close@15978`); **total 32 182 bytes, normalised 29 357, REMOVED 2 825** (floor: > 100, printed before the digest); sha256 `006cdb0f45d017f050f78c1424f636f700fc72b378723799cee4e1820904330d` | `FROZEN_HOOK_ENTRY_LOGIC_SHA` = `006cdb0f…330d` (`:873`), taken by `31-37`; three prior baselines listed in the file | **EQUAL — four plans of this round edited `hook-entry.ts` and NONE of them moved its LOGIC.** The normalisation's own non-vacuity is measured, so this is not a hash of the whole file |
| **`admit()`'s span — the re-baselined freeze** | brace-scanned with the HARDENED extraction (parameter list skipped) from offset **245 861**, **15 012 bytes**, `endsWith("}")` asserted `true`; sha256 **`bb920698c1e4e321805209f7be0ccfee663ca851733c4ae369fd0781faef81cd`** | `ADMIT_FROZEN_SHA256` = `bb920698…81cd` (`scripts/context-io.test.ts:2344`). **PRIOR VALUE: `08df9e5c15754f8b3f3bde417475652d3d3861c50fd5458704b29651b83709e9`** (`31-01`), which is what §8.3 of `docs/audit/31-round7-residuals.md` measured | **EQUAL to the NEW baseline — and the baseline MOVED, deliberately, under the dated human decision `D-39`.** This is the **SIXTH** value and the fifth transition; `31-39` recorded the plan text's "seventh" as measured wrong rather than adopting it. The span grew 12 151 → 15 012 bytes with the `ledgerOwner` parameter and its reasoning |
| `DECIDER_MANIFEST`, **whole** | deciders derived: **2** (`hooks/admission-guard.js`, `hooks/guard.js`); `(path, hash)` entries derived: **26** over **14** distinct paths; files missing on disk: **0**; digest mismatches: **0** | `npm run freshness:hook-manifest` independently reports `2 decider(s), 26 module hash(es) match a fresh derivation` | **EVERY ENTRY CHECKED, not only the ones this round moved** |
| the test-module tripwire | `ls scripts/*.test.ts \| wc -l` → **60** | `TRIPWIRE_MODULES = 60` (`scripts/check-foundation-guards.test.ts:9237`) | **EQUAL — re-derived by the documented method rather than incremented** |
| the `{0,1,2}` exit partition | `scripts/uat-gate-exit-contract.test.ts` green inside the suite; `D-42` added a CAUSE (`surface-unreadable`) at the existing exit-2 boundary | `D-28` | **UNMOVED — no third code** |

### 8.4 The `check:diff-disposition` debt — RE-MEASURED, still OPEN

```
$ npm run check:diff-disposition
  FAIL  diff disposition — changed watched file(s): 78 finding(s) over 39 elements
1 CHECK(S) FAILED
```

| Reading | Count | Source |
|---|---|---|
| round-7 close | **78 finding(s) over 39 elements** | `docs/audit/31-round7-residuals.md` §8.4 |
| after `31-39` | **78** | `31-39-SUMMARY.md` |
| after `31-41` (measured 78 → 102 → 78 within the plan) | **78** | `31-41-SUMMARY.md` |
| **this session, at `6e95edc`** | **78 finding(s) over 39 elements** | measured above |

**Unmoved across the whole round — five plans added zero.** The findings quoted by the gate name
clauses in `05-pr-quality-gate.md`, `17-task-claim.md` and `18-context-compaction.md`'s frozen
region. The gate's own remedy text forbids the two shortcuts (narrowing the watched corpus, moving
the recorded base). **Owner: unassigned; accepted-open at the fence (§10).**

### 8.5 The exported register cardinalities, measured on this tree

Each number was read from the **committed `.js`** by importing it from a non-entry module, not
counted by eye, and compared to the number `docs/audit/31-round7-residuals.md` §8.5 recorded.

| Register | round-7 close | Now | Moved by | Verdict |
|---|---|---|---|---|
| `WRITE_PATH_RESIDUALS` | 7 | **9** | `31-41` | **+2** — `R-31-41-01` (the widened refusal, `WR-42`) and `R-31-41-02` (the lean-retention scope, `D-39 (3)`) |
| `ROOT_DIVERGENCE_DISPOSITIONS` | (did not exist) | **3** | `31-40` | **NEW** — 2 census-visible, 1 `visible_to_census: false` |
| `ROOT_DIVERGENCE_KINDS` | (did not exist) | **3** (`derived-and-refusing`, `one-half-action`, `published-residual`) | `31-40` | **NEW** — closed at three by a runtime constant the type is derived from |
| `UNNAMEABLE_OWNER_CLAUSE` | (did not exist) | `"destination-outside-governed-store"` | `31-39` | **NEW** — the ONE clause both write-both routes raise |
| `PROMOTE_ADMITTED_DECLINES` | 11 | **11** | — | unmoved; now keyed off the constant above |
| `PROMOTE_ADMITTED_RESIDUALS` | 6 | **6** | — | unmoved |
| `TRUSTED_ROOT_RESIDUALS` | 11 | **11** | — | unmoved |
| `TRUSTED_ROOT_TIERS` | 5 | **5** | — | unmoved |
| `TRUSTED_ROOT_STOP_CONDITIONS` | 7 | **7** | — | unmoved |
| `TRUSTED_ROOT_ENV_ORDER` | 2 | **2** | — | unmoved |
| `NOTE_SKIP_ARMS` | 5 | **5** | — | unmoved |
| `READ_POSITION_CONDITIONS` | 3 | **3** | — | unmoved |
| `REPO_BOUNDARY_MARKERS` | 9 | **9** | — | unmoved |
| `NOTE_FILE_MAX_BYTES` / `AUDIT_LEDGER_MAX_BYTES` | 8388608 / 67108864 | **8388608 / 67108864** | — | unmoved |
| `SURFACE_TRUNCATION_ARMS` | 4 | **5** | `31-42` | **+1** — `surface-unreadable` (`WR-37`) |
| `SURFACE_SWALLOW_SITES` | (did not exist) | **9** | `31-42` | **NEW** — derived from the walk's own call closure, every site naming its arm |
| `SKIPPED_DIRECTORY_DISCLOSURE_CLASS` | (did not exist) | **5** keys | `31-42` | **NEW** — the watched set partitioned by whether a skip could hide this repository's evidence (`IN-19`) |
| `SKIPPED_DIRECTORY_COUNT_MEANING` | (did not exist) | present | `31-42` | **NEW** — the counted thing named in the emitted line |
| `UNRESOLVABLE_CALLEE_RESIDUALS` | 10 | **10** | — | unmoved — and `D-42 (2)` measured **zero** throws at all nine swallow positions over 26 genuine walks, so no fail-open was kept |
| `BANNED_MODIFIER_HEADS` / `TAILS` / `EXACT_PATHS` / `CONFIGURED_PATHS` | 2 / 4 / 1 / 1 | **2 / 4 / 1 / 1** | — | unmoved — and all **8** members now carry a REACH row (`WR-38`) |
| `SKIPPED_DIRECTORIES` | 5 | **5** | — | unmoved by decision (`D-33 (5)`); the disclosure is now partitioned rather than the set narrowed |
| `MODIFIER_IDENTITY_ARMS` / `IDENTITY_BAN_OPERAND` | 4 / 4 | **4 / 4** | — | unmoved |
| `SURFACE_DEPTH_BOUND` / `SURFACE_NODE_BOUND` | 6 / 4096 | **6 / 4096** | — | unmoved |
| `PATHOLOGICAL_INPUT_SHAPES` / `MEASUREMENT_BRANCH_STREAMS` | 6 / 4 | **6 / 4** | — | unmoved |
| `PLATFORM_SHAPE_OUTCOMES` | (did not exist) | **11** | `31-43` | **NEW** — the closed outcome vocabulary (`IN-20`) |
| `CONTROL_OUTCOME_LABELS` / `ROW_LABELS` | (did not exist) | **13 / 16** | `31-43` | **NEW** — the printed label DERIVED from the outcome, cardinality asserted both directions |
| `WORKFLOW_STOP_BULLET_COUNT` | 42 | **43** | `31-41` | **+1** — the destination decline added as a stop condition |
| `NON_TEST_MODULE_COUNT` | 78 | **79** | `31-42` | **+1** |
| `CORPUS_ROW_FLOOR` | 55 | **77** | `31-42` | **+22** |
| `EXPECTED_APPEND_NOTE_CALL_SITES` | 6 | **6** | — | unmoved — `31-41` measured it move 6 → 8 → 6 and recorded that its INPUT is text, not calls (§10) |
| `harness-false-result-instances.md` rows | 14 | **16** | `31-40` | **+2** — instances 15 and 16, both ordinals read off the table |

**Every difference is attributed to the plan that made it. No register moved without a plan naming
it, and no cardinality this round recorded disagrees with its owning SUMMARY.**

---
## 9. The disposition ledger — one row per item, over a DERIVED denominator

### 9.1 The derivation rule, and the fence-stripping it depends on

The denominator is **not** a list somebody kept. It is scanned out of the two source documents and
the deferred record at run time, by the script printed in §9.4, under seven shapes:

| Key | Shape | Where |
|---|---|---|
| `CR-NN` / `WR-NN` / `IN-NN` | a numbered finding heading | `31-REVIEW.md`, **fenced blocks stripped first** |
| `AP-N` | an Anti-Patterns row | `31-VERIFICATION.md` |
| `MB-N` | a `missing:` bullet | `31-VERIFICATION.md` |
| `RA-N` | a Required Artifacts row NOT marked VERIFIED | `31-VERIFICATION.md` |
| `KL-N` | a Key Link row marked `NOT_WIRED` | `31-VERIFICATION.md` |
| `GR-N` | a `gaps_remaining:` entry | `31-VERIFICATION.md` |
| `DF-N` | a deferred item whose owner names round 8's fix plan, round 8's planner or round 9 | `deferred-items.md` |

**The fenced blocks are stripped before the heading scan, and the reason is a defect this phase has
already paid for.** A `##` heading inside a fenced transcript is a markdown-parse artifact, not a
finding; round 7's review carried `## Skipped entries` inside `CR-24`'s `render()` transcript and the
convening brief of the round after it counted a fourteenth finding that no document filed. The
stripping is applied here and its effect is printed (§1.1): **delta 0 on this review.** Applied and
empty is the honest reading, and it is recorded as such rather than dropped.

**Dispositions.** `CLOSED` — the item is closed and the row cites the reproduction row in §2/§3 that
measures it. `DECIDED-AND-NAMED` — the item is not a defect to close; the decision and its reason are
named. `CARRIED` — the item is open, with an owner and a criterion, and (this phase being fenced at
this round) it is an **accepted-open residual** rather than a queue entry.

### 9.2 The rows

| Item | What it is | Disposition | The measurement, or the reason |
|---|---|---|---|
| **CR-26** | `admitAndAppend`'s gated branch falls OPEN to `repoRoot` | **CLOSED** | §2.1 row 1 — the call refuses by name, `id: null`, zero notes in both roots; §2.1 row 2's CONTROL still writes. The `?? repoRoot` fallback is unspellable: `actionOwnerRoot` answers a discriminated `ActionOwner` with no null member (`D-39`) |
| **CR-27** | the fall-through's governance dial moved to the caller-supplied destination | **CLOSED** | §2.2 rows 1–2 — the probe and its CONTROL now answer identically under the same unreadable trusted configuration; the asymmetry that WAS the finding is gone |
| **WR-37** | `SURFACE_TRUNCATION_ARMS` claimed to be every early stop; four routes stopped silently | **CLOSED** | §2.3 — `SURFACE_SWALLOW_SITES` derived at **9** positions (the review named 4), every one naming its arm, `surface-unreadable` added to a 5-arm truncation set. The throwing-stub seam is named as not re-driven outside the suite (§1.2), and the `WR37-SITE-*` corpus rows are green in §8.1 |
| **WR-38** | the reachability binding covered 2 of 4 published ban sets | **CLOSED** | §2.3 — **8** member rows over **4** sets, each id derived from the publishing CONSTANT's own name, matching the 2+4+1+1 members read from the committed `.js` |
| **WR-39** | `R-31-33-02`'s published text was false for the branch the round changed | **CLOSED** | §2.3 — the member's `shape`, read from the committed `.js`, now states the post-fix behaviour |
| **WR-40** | `18-context-compaction.md` stated a universal entry-derivation property | **CLOSED** | §2.3 — the paragraph is per route and per branch, with four residual ids inline; the universal sentence greps to 0 |
| **WR-41** | the note-position CONTROL's "ordinary outcome" was only "did not throw" | **CLOSED** | §2.3 — the driver reports `identical-no-op` vs `write` from the target's own before/after digests, the harness reads the planted position through `verifyAfter`, and the gate exits 0 with four `ordinary outcome (correct)` rows |
| **WR-42** | the widened refusal's cost unrecorded; the shared-install shape unmeasured | **CLOSED**, with a disagreement | §2.3 and §6.1 — `R-31-41-01` published; the shared-install answer re-driven here (`governanceRootOf(<kit>/.grugops/context)` = the kit home, CONTROL = `null`). The finding's ask was right; its stated consequence was measurably wrong |
| **IN-19** | the skipped-directory disclosure fired on essentially every host run | **CLOSED** | §2.4 — the host run at this commit names `.temp=1` only, and the emitted line names what the count counts |
| **IN-20** | a CONTROL that is neither ordinary nor a refusal printed `REFUSED (wrong)` | **CLOSED** | §2.4 — 11-member outcome vocabulary, 13 CONTROL labels, `controlOutcomeLabel` returns `NOT ORDINARY (<outcome>)` for every non-ordinary outcome |
| **IN-21** | the ledger test's partition assertion was true by construction | **CLOSED** | §2.4 — the expression is gone (`toBe(rows.length)` greps to 0), its removal recorded in place, and two floors that CAN fail stand in its place |
| **AP-1** | anti-pattern: `admitAndAppend`'s gated branch derives `?? repoRoot` | **CLOSED** | the same measurement as **CR-26** (§2.1) |
| **AP-2** | anti-pattern: the fall-through passes `destinationRoot` into the one dial-and-ledger parameter | **CLOSED** | the same measurement as **CR-27** (§2.2); the parameter is now two parameters (§2.2 row 3) |
| **AP-3** | anti-pattern: four exception-throw sites swallow a subtree without setting `truncated` | **CLOSED** | the same measurement as **WR-37** (§2.3) — and the derivation found nine sites, not four |
| **AP-4** | anti-pattern: the reachability binding derives from 2 of 4 published ban constants | **CLOSED** | the same measurement as **WR-38** (§2.3) |
| **AP-5** | anti-pattern: the two-route ledger paragraph states a universal property | **CLOSED** | the same measurement as **WR-39**/**WR-40** (§2.3) |
| **MB-1** | make `admitAndAppend`'s gated-branch derivation agree with `promoteAdmitted`'s | **CLOSED** | §2.1 row 3 — both routes decline, and they decline through ONE exported clause constant rather than two spellings |
| **MB-2** | separate the governance-DIAL question from the ledger-RECORD question at the fall-through | **CLOSED** | §2.2 row 3 — `admit()` and `appendNote()` each take a `ledgerOwner` distinct from `repoRoot`; the unfreeze is the dated decision `D-39` and the freeze is re-baselined (§8.3) |
| **MB-3** | a derived test enumerating every call site supplying the root from a non-trusted value | **CLOSED** | §2.2 row 4 — `ROOT_DIVERGENCE_DISPOSITIONS` (3) bound to a derived census in both directions, with the one site a syntax-tree census cannot see given a COORDINATE rather than an omission |
| **RA-1** | Required Artifact ⚠️ PARTIAL — `promoteAdmitted`'s return paths | **CLOSED** | §3 (`CR-22` positions 1, 2 and the CONTROL, re-driven) and §2.2 — every return path reaches a write only through the entry-derived owner, and the dial no longer rides the destination |
| **RA-2** | Required Artifact ✗ FAILED — `admitAndAppend`'s note/ledger keying | **CLOSED** | §2.1 and §3 (`CR-22` position 3) — the ungoverned case refuses, the governed case writes both halves into one repository |
| **RA-3** | Required Artifact ⚠️ PARTIAL — `18-context-compaction.md`'s agent-facing prose | **CLOSED** | §2.3 (`WR-40`) — read line by line in this session, per route and per branch, with the residuals named inline |
| **KL-1** | Key Link ✗ NOT_WIRED — the fall-through to the trusted governance dial | **CLOSED** | §2.2 rows 1–2 — wired, and demonstrated by the pair of drives rather than by a source read |
| **KL-2** | Key Link ✗ NOT_WIRED — `admitAndAppend`'s gated branch to the sibling's disposition | **CLOSED** | §2.1 row 3 — wired through `UNNAMEABLE_OWNER_CLAUSE`, one constant both routes consume |
| **GR-1** | `gaps_remaining` — UATX-01, blocked by CR-26 and CR-27 | **DECIDED-AND-NAMED** | Both named defects are CLOSED by measurement above. **The requirement row is NOT flipped by this document**: only a verification round may do that, and this phase is fenced at this round, so `UATX-01` stays `- [ ]` and its traceability row stays `Gaps Found` (§11). What this round establishes about `UATX-01` is that `CR-26` and `CR-27` are gone and that `CR-28` (§5) is live in the adjacent requirement family |
| **DF-1** | the review-to-corpus coverage one-shot (`D-33 (2)`), and its over-inclusive predicate. Owner: round 8's planner | **CARRIED** | **NOT re-taken this round, and that is disclosed rather than quietly dropped.** `31-44` was convened for a disposition-coverage equality (§9.3), which is a different equality over a different denominator; no plan of this round took the review-to-corpus one-shot, and no derived "this finding is drivable as a UAT spec" rule exists. Owner: unassigned at the fence. Criterion unchanged — a derived drivability rule, so the denominator is the coverable set rather than the naming set. §10 |
| **DF-2** | the fenced-heading scanning rule. Owner: any future derivation over `31-REVIEW.md` headings | **DECIDED-AND-NAMED** | Applied here, with its effect printed: 15 headings before stripping, 15 after, **delta 0** (§1.1, §9.1). It is a standing scanning RULE rather than a defect in the tree, and it stays one |
| **DF-3** | harness false-result instance 15, to be appended to the ledger. Owner: round 8's fix plan | **CLOSED** | `docs/audit/harness-false-result-instances.md` measured at **16** rows (was 14 at the round-7 close); `31-40` appended instances 15 and 16, both ordinals read off the table, with the derived-premise case green in §8.1 |
| **DF-4** | `EXPECTED_APPEND_NOTE_CALL_SITES` counts source TEXT, not call expressions. Owner: whichever plan next touches PART FIVE of `scripts/context-io-writer-set.test.ts` | **CARRIED** | Re-measured at **6**, unmoved. No plan of this round touched that axis. Criterion unchanged: parse the corpus with `ts.createSourceFile` and count call expressions, with the seeded mirror re-pointed at a real call. §10 |
| **DF-5** | `05-pr-quality-gate.md` step 3 publishes a narrower exit-2 claim than the checker carries. Owner: the next plan that edits that workflow | **CARRIED** | Unmoved, and **wider than when it was filed**: `D-42` added `surface-unreadable` to `SURFACE_TRUNCATION_REACHED`, so the arms behind `SURFACE_TRUNCATED_CAUSE` went 4 → 5 while the workflow still reads "Two conditions produce exit `2`". Criterion unchanged: state the condition as a RULE, or derive the count from the checker's own published cause set. §10 |

**No row asserts a closure this round did not measure.** Every `CLOSED` row above names a §2 or §3
row, a register read from the committed `.js`, or a command whose output is quoted in this document.
`WR-37`'s row says in its own text which half was derived and which half was not re-driven here.

### 9.3 The coverage equality, with BOTH sides measured at run time

Neither side of the equality below is typed into this document as an expected value. The LEFT side is
scanned out of the source documents by the script in §9.4; the RIGHT side is parsed out of §9.2's own
rows in this file. **Both derivations throw on a zero count**, so the equality cannot close over an
empty set — which is the vacuity this phase has logged twice as a harness false result.

```
$ node coverage.mjs
DERIVED item count                          : 30
DERIVED member list                         : CR-26 CR-27 WR-37 WR-38 WR-39 WR-40 WR-41 WR-42
                                              IN-19 IN-20 IN-21 AP-1 AP-2 AP-3 AP-4 AP-5
                                              MB-1 MB-2 MB-3 RA-1 RA-2 RA-3 KL-1 KL-2 GR-1
                                              DF-1 DF-2 DF-3 DF-4 DF-5
rows parsed from the written ledger         : 30
items covered by at least one written row   : 30
items covered by NO written row             : 0 (none)
rows naming an item the scan did not derive : 0 (none)
EQUALITY CLOSES
```

(The member list is one line in the real output; it is wrapped above for page width and nothing else
in the transcript is altered.)

| Number | Value | How it was taken |
|---|---|---|
| the DERIVED item count | **30** | seven scans over `31-REVIEW.md` (fences stripped), `31-VERIFICATION.md` and `deferred-items.md`, §9.1 |
| items covered by at least one authored disposition | **30** | the first-cell key of every `\| **XX-N** \|` row inside §9.2, intersected with the derived set |
| items covered by NO authored disposition | **0** | the derived set minus the row-key set |

The third number is the one that matters and it is **zero**. A fourth number is printed beside them —
**rows naming an item the scan did not derive: 0** — because a coverage equality that only checks one
direction closes just as happily over a row for an item nobody filed.

### 9.4 The script, so the equality is re-runnable rather than asserted

The derivation ran from the session scratchpad, outside the tracked tree. It reads three planning
documents and this record, strips fenced blocks before any heading scan, throws on either side being
empty, and prints all four numbers plus the member list. Its seven shapes are the table in §9.1; its
row parser is the regular expression `^\| \*\*([A-Z]{2}-\d+)\*\* \|` over §9.2 only. **No count in it
is typed**: the item ordinals `AP-N`, `MB-N`, `RA-N`, `KL-N`, `GR-N` and `DF-N` are assigned by
enumeration order over what the scan finds, so a source document gaining or losing an item moves the
LEFT side and reds the equality rather than passing quietly.

---

## 10. The round's residual register — every boundary this round leaves open

**This phase is FENCED at this round.** Each entry below is therefore an **accepted-open residual**:
the developer's decision of 2026-09-12 is that Phase 31 closes at gap-closure round 9 whatever the
next verification says, so "what would force it closed" describes the condition rather than a
scheduled plan. **No entry here is closed, and none is presented as closed.**

### 10.1 The write path

| Id | Boundary | Why it is open | What would force it closed | Owner |
|---|---|---|---|---|
| `R-31-33-01` (remaining half) | the repository whose audit trail records an admission is a PARAMETER of every write-path entry point, and an explicit one can still differ from the caller's trusted root | The half `D-39`'s unfreeze closed is the COLLAPSE — dial and record are now two parameters. What the unfreeze cost is a second aimable argument. It is bounded by `31-40`'s derived census, which reads that argument position and makes a new diverging site owe a written disposition | removing the parameter from `appendNote`, whose one in-module caller passes a value identical to the default — expressible there and NOT at `admit()`, where `admitAndAppend`'s non-gated branch genuinely needs an owner its dial root does not answer. A signature change to a re-frozen authority is a dated decision | `31-41`, published |
| `R-31-33-02` | the DEFAULT arguments' owner is undecided: with no arguments the note and its GOV-02 record both land in the KIT's repository while the dial reads the host | Re-worded by `31-41`, not closed. **NOT DRIVEN here** for the reason re-measured in §3: `DEFAULT_CONTEXT_ROOT` is not exported (`false`), and observing the split needs a `~/.grugops` kit beside a separate host repository | a dated decision naming ONE repository as the default owner of the shared verified context, applied to readers' and writers' defaults in the same change, with `WR-10` restated against it | `31-33` / `31-41`, published |
| `R-31-41-01` | the widened refusal: moving the destination decline above the human-stamp fall-through grew the refused input set | The refusing direction is the safe one and the member now names it. **The shared-install shape is MEASURED, not assumed** (§2.3, §6.1): the kit-side store DOES resolve, because `copyKit` copies the in-kit configuration, so the widened refusal does not fire on the shipped shape. What stays open is that a kit-side destination is *expressible* by a host workflow | a shipped flow that promotes into a store the resolver declines — which would arrive as a new caller rather than as a changed constraint | `31-41`, published |
| `R-31-41-02` | the unnameable-owner refusal is scoped to the RETENTION GUARD, so under any `audit_retention` other than `retained` a note whose store cannot be attributed is written | `D-39 (3)`'s deliberate scope: under the lean value no record is written at all, so nothing lands in the wrong repository. What is open is that a note can sit in a store this module cannot attribute, with no surface saying so at write time | a decision that attribution is a precondition of writing at all — the unscoped refusal `D-34` priced at 121 + 26 call sites and rejected. A cheaper partial: `render` reporting an unattributable store the way it reports a skipped entry | `31-41`, published |
| `RD-31-40-03` | the write-path call `check-platform-shapes` assembles as module TEXT is invisible to any syntax-tree census | A census sees calls that are CODE. This one is a string at rest. It is given a COORDINATE (`visible_to_census: false`) rather than a category, so the register names the blind spot instead of omitting it | the driver becoming a committed fixture module the gate imports, or a second census that parses the assembled text as TypeScript before it is written | `31-40`, published |
| `T-31-18-01` / `T-31-39-04` | a destination's CONTENTS are not authenticated — the constraint names a REPOSITORY, not a trustworthy one | Pre-existing and priced per position (`D-31`). An agent that can `mkdir` a version-control marker and a readable configuration can construct one. Now named INLINE in the stop condition's remedy so a reader meets the price at the sentence that could read as permission | a trust decision about destination provenance that does not rest on filesystem shape | the register |
| the census's ONE-HOP binding resolution | a value assembled through two bindings reads as a divergence and must earn a register entry | The safe direction for a default. `const repoRoot = trustedRepoRoot();` above a call is the production shape | a real site whose agreement is only expressible through two hops — which arrives as a red DIRECTION 1 | `31-40` |
| `derived-and-refusing` is an unoccupied kind | no site on this tree derives its own root AND refuses while diverging from its caller's trusted root | Naming it now is cheaper than inventing a name under the pressure of a round that has already found the site | a site of that shape landing | `31-40` |

### 10.2 The UAT-spec modifier ban

| Item | Why it is open | What would force it closed | Owner |
|---|---|---|---|
| **`CR-28` — a RENAMED import from a declared-foreign module is accepted at exit 0** | **RAISED BY THIS DOCUMENT (§5) AND DELIBERATELY NOT REPAIRED.** `deriveImportRenames` collects a rename only from `@playwright/test`; the `foreign-declared` arm's operand is the SPELLED path; so `import { describe as grouping } from "other-framework"; grouping.skip(…)` is asked about `grouping.skip`, which is not a published ban member. REPRODUCED at this commit on files that `tsc --noEmit` accepts at exit 0, with both bounding CONTROLS driven. No corpus row drives the shape (measured: zero renamed declared-foreign imports in the fixtures), so the suite is green over it | a rename map that is not scoped to one module — i.e. resolving the head through the DECLARATION the checker already found rather than through an import-specifier table keyed on the framework's module specifier. Every widening of this rule has cost this family a false refusal before, so it is a decision and not a patch | **raised here, unrepaired; owner unassigned at the fence** |
| the nine swallow positions' **kept fail-opens** | **None was kept, and the number is the disposition.** `D-42 (2)` measured **ZERO** throws at all nine positions over 26 genuine walks, and every position is routed to a named arm (§2.3). What stays `UNKNOWN - verify` is whether a REAL checker ever throws at one | a reproduced throw from a host's own checker at a named position | `31-42`, published |
| the INSTALLED-PACKAGE surface's magnitude behind `SURFACE_DEPTH_BOUND` (6) and `SURFACE_NODE_BOUND` (4096) | Standing `UNKNOWN - verify`. `CLAUDE.md` fixes the dependency set at `{typescript, vitest}`, so `@playwright/test` cannot be installed to measure what its real declared surface costs the two bounds. `D-36` closed the bounds' DIRECTION (a reached bound is exit 2, re-measured in §3); the MAGNITUDE on the installed-package route is not established | a measurement on a host with `@playwright/test` actually installed, or a walk whose cost does not grow with the surface | unassigned; `UNKNOWN - verify` |
| the hand-transcribed declaration corpus's drift from upstream (`R-07`) | `fixtures/playwright-test.d.ts` and `fixtures/foreign-framework.d.ts` are hand transcriptions; `31-42`'s new fixture compiles against the same transcription and inherits its standing exactly | an installed package to derive the surface from | `31-42`, published |
| `RR-13` — a head the spec file hand-`declare`s for itself stays accepted | the shape is structurally IDENTICAL to `WR-26`'s own control, which the phase pays a false refusal for every time it widens this rule | a discriminant separating a spec-local `declare const describe` from a helper's own parameter type, without re-opening the false refusal | `31-34`, published |
| the INDEX-SIGNATURE shape (`t.bag.anything.skip` accepted at exit 0) | pre-existing; the walk reads declared PROPERTIES and an index signature is not one. **RE-DRIVEN here at the corpus row's own spelling: `0 findings`, EXIT=0, `tsc` exit 0** — and the plain-`test`-headed bounding half still refuses (§3) | reading a type's INDEX INFOS beside its properties, which widens the walked set and moves the denominator of every coverage assertion | `31-35`, published |
| `R-31-31-01` — the ambient `declare const it: unknown;` spelling | re-driven here: `0 findings`, EXIT=0, **`tsc` EXIT=2**. By `31-28`'s own recorded standard a construct the language refuses is a curiosity rather than a bypass — and that standard is this phase's, which is why it is carried rather than dismissed | a corpus row driving it with the compile error asserted as the reason it cannot run, or a register member naming it | carried from `31-31`; taken by no plan of this round |
| **per-tail coverage through a declared-foreign binding** | `31-42`'s shared-resolution case drives ONE member of each of the four sets that way; per-tail foreign coverage is not claimed. `CR-28` (§5) is what that uncovered axis looks like one register over | a per-tail drive through a declared-foreign binding, renamed and un-renamed | `31-42`, published |

### 10.3 The harness, the gates and the records

| Item | Why it is open | What would force it closed | Owner |
|---|---|---|---|
| **the changed platform-shapes LABEL SEMANTICS** (`D-43`) | The CONTROL rows' printed labels no longer mean what they meant in rounds 6 and 7. `ordinary outcome (correct)` at the note position now means the IDENTICAL-BYTES NO-OP was observed at the target, not that the call did not throw, and a non-ordinary non-refusal now prints `NOT ORDINARY (<outcome>)` where it printed `REFUSED (wrong)`. **A transcript in `docs/audit/31-round6-residuals.md` or `31-round7-residuals.md` is therefore NOT comparable line-for-line with one taken here** | nothing — this is a deliberate semantic change with a disclosed comparison warning, and the warning is the closure | `31-43` (`D-43`), published |
| **2 of the 13 CONTROL labels are not watched live** — `NOT ORDINARY (answered)` and `NOT ORDINARY (no-answer)` | `answered` is the manifest position's own ordinary outcome and the mirror seam replaces the note position's driver only; `no-answer` needs a child producing neither an exit code nor a signal. Both are driven through the exported derivation, and a live-coverage case asserts these two are the ONLY unwatched labels, so a fourteenth undrivable label reds rather than joining them quietly | a mirror seam at the manifest position, and a child the harness can suspend without killing. Recorded in `.planning/WINDOWS.md` (`unrun-verify`) | `31-43`, published |
| the GOV-02 audit-ledger position dropped from `check-platform-shapes` | a derived guard (AUTO-06, "exactly ONE governance-dial reader") fires correctly: the module writes a fixture, does not read a dial, and the predicate cannot tell those apart. The position was dropped rather than smuggled past the scan | publish the two governance dial KEY NAMES from the one authority, the way `30-10` published `GOVERNANCE_CONFIG_RELPATHS` | unassigned; carried since `31-30` |
| the `reports-the-positions-own-refusal-clause` mirror FABRICATES the clause | the only way a CONTROL shape draws this position's not-a-regular-file refusal; a regular file and a symlink resolving to one never do. It exercises the harness's classification path, not the writer's refusal | a staging mirror planting a dangling symlink at a CONTROL position | `31-43`, published |
| **`check:diff-disposition` — 78 findings over 39 elements** | Pre-existing; **unmoved across this whole round** (§8.4: round-7 close 78, after `31-39` 78, after `31-41` 78, here 78). Clearing it means walking several earlier plans' clauses and writing their rows, and the gate's own remedy text forbids the two shortcuts — narrowing the watched corpus and moving the recorded base, each of which clears a finding by deleting its evidence | a documentation pass over `05-pr-quality-gate.md`, `17-task-claim.md` and `18-context-compaction.md`'s frozen region | unassigned |
| **`DF-1` — the review-to-corpus coverage one-shot was NOT re-taken this round** | `D-33` deleted the self-referential axis and handed the obligation to each round's closing measurement as a one-shot. `31-44` asserts a DISPOSITION-coverage equality (§9.3), which is a different equality over a different denominator, and no plan of this round took the review-to-corpus one. Its predicate also over-includes: 2/5 under the strict reading, 5/5 under the weak one | a derived "this finding is drivable as a UAT spec" rule, so the denominator is the coverable set — then the one-shot can be asserted without choosing between two predicates | unassigned; raised by `31-38`, unmoved |
| **`DF-4` — `EXPECTED_APPEND_NOTE_CALL_SITES` counts TEXT, not calls** | Re-measured at 6, unmoved. Its INPUT is source text, so a false positive is expressible by writing a sentence — `31-41` measured the count move 6 → 8 → 6 on two prose strings alone. Its sibling axes since `31-40` parse the source into a syntax tree | the axis parsing its corpus with `ts.createSourceFile` and counting call expressions whose callee is `appendNote`, with the seeded mirror re-pointed at a real call | whichever plan next touches PART FIVE of `scripts/context-io-writer-set.test.ts` |
| **`DF-5` — `05-pr-quality-gate.md`'s narrower exit-2 claim** | Unmoved, and WIDER than when filed: `D-42` took the truncation arms 4 → 5, so the workflow's "Two conditions produce exit `2`" is further from the mechanism than it was. Not fixed in `31-42` or `31-43` because that workflow is in the `LANG-03` watched corpus with a frozen neighbouring section, so the edit owes disposition rows and a companion edit | the workflow stating the condition as a RULE — "any condition the checker names on stderr with its own marker" — or the count derived from the checker's own published cause set and bound in both directions | the next plan that edits that workflow |
| **`31-43-SUMMARY.md`'s `requirements-completed: [UATX-01, UATX-04]`** | **Raised by this document (§6.4).** It is the one summary of the round asserting a completion the eighth verification round withheld; the other four wrote `[]` and the tree agrees with the four. **The prior record is not rewritten** — the disagreement is recorded here instead | a verification round granting those requirements, or the field being corrected by a plan that owns that artifact. Neither is this document's to do | raised here; unassigned at the fence |
| the multi-sentence disposition-row CLASS | a row whose `before`/`after` is not exactly one clause covers nothing, silently, while reading as work done. No derived check catches it | a derived check over disposition-row shape | `31-29` |
| fourteen of fifteen `mkfifo` call sites carry no platform guard | measured as a SOURCE property on darwin; what a Windows run then does is explicitly not claimed | a `windows-latest` reading | their own plan |
| four `TRUSTED_ROOT_RESIDUALS` are closed only on the Claude Code hook path | `hosts: non-cc-hook-path` — tier 0 is a narrowing on ONE host, not a closure | a delivered-root channel on the other four host CLIs | the register |

### 10.4 The Windows remainder

Every probe in this document ran on **darwin 25.5.0 arm64, Node v24.12.0, and nowhere else.** The
Windows leg of each is `UNKNOWN - verify` and belongs to `R-03` (§11). **This round adds five shapes
to that remainder**: the entry-level owner refusal on both write-both routes, the split dial/ledger
parameter, the nine-position swallow census, the partitioned skipped-directory disclosure, and
`CR-28`'s renamed declared-foreign import. The `mkfifo`-based probes in §3 are the ones most obviously
unportable, and they are the ones `R-03` has named since round 5.

---

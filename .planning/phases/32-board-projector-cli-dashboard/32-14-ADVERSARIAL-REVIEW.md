# Phase 32 — Gap-Closure Round 1: Adversarial Re-Verification

**Round:** 1 of a hard cap of 4 (the project rule recorded after Phase 31).
**Subject:** the tree at `2a55b0b0` (`main`), after gap-closure plans `32-09`, `32-10`, `32-12`,
`32-13`, `32-11` (executed in that order).
**Oracle:** `.planning/phases/32-board-projector-cli-dashboard/32-VERIFICATION.md` — the verifier's
own recorded reproductions, re-run here against the rebuilt committed `.js`. The executors' summaries
are **not** the oracle; they are cited only where they already record a residual.
**Date measured:** 2026-09-14 (UTC), on macOS 25.5.0 / Node v24.12.0.

Throughout this document `$T` stands for the disposable scratch root
`/private/tmp/claude-501/-Users-olgeroeselg-Projects-public-grugops/ba8bab02-.../scratchpad`.
Every tree under it is a fresh `cp -R scripts/fixtures/board-snapshot`. Terminal escapes are spelled
as text (`ESC`, `0x1b`) and never as literal bytes, because `npm run check:nul-bytes` scans every
tracked file and a literal ESC in this repository's last review document is still an open item in
`deferred-items.md`.

---

## 0. The harness asserts its own premise first

Every transcript below was run against the **committed `.js`**, never against a `.ts` through a
loader, because that is the artifact a host machine runs and the artifact the verifier measured.
A harness measuring a stale build produces a false green as easily as the code under it
(T-32-14-02; this repository has six recorded instances of a verification harness returning a false
result because its own premise was never checked).

| Premise command | Exit | Output |
|---|---|---|
| `npm run build` | **0** | `tsc` completed, no diagnostics |
| `npm run check:build-parity` | **0** | `Build parity: no tracked build output moved when tsc ran.` |

`git status --short` after the build named only the four pre-existing user files this executor was
told not to touch (`.planning/milestone.lock`, `human-notes.txt`, `.gsd/`, `.planning/state.json`).
No tracked `.js` moved, so every `.js` measured below **is** a build of its `.ts`.

---

## 1. The verifier's transcripts, before and after, in one table

The "pre-fix" column is quoted from `32-VERIFICATION.md` (lines 73–107 and 130–139). The "post-fix"
column is measured here. The command column is what produced the post-fix cell.

| # | Finding | Verifier's recorded pre-fix result | Measured post-fix result | Command | Verdict |
|---|---------|------------------------------------|--------------------------|---------|---------|
| CR-01 | DASH-06 guard blind to a namespace destructure | `fsSymbols: []`, `opaqueFsAcquisitions: []`, `bareSpecifiers: ["node:fs"]` — writer invisible, gate green (exit 0) | `opaqueFsAcquisitions: ["scripts/board-read.js: { writeFileSync, rmSync } = fsns"]` (**non-empty**, 4 cases red); `fsSymbols` unmoved; `bareSpecifiers` unmoved | probe appended verbatim to the committed `scripts/board-read.js`, then `npm run check:dashboard-readonly` → **exit 1**, `4 failed \| 53 passed (57)`; file restored and `git diff --exit-code -- scripts/board-read.js` clean, sha256 `8e757ab7…` before and after | **closed** |
| CR-02 | EACCES on `plans/tickets/` renders a clean `[ok]` board with fabricated conflicts | header `[ok]`, no badge; `readErrors: []`; `sources.tickets {"source":"unavailable","present":false}`; 11 conflicts of which **8** `row-without-file` against files that exist | header `[stale]  STALE: tickets (never read, EACCES)`; `readErrors` for tickets = **1**, `code: "EACCES"`; overall `stale`; **`row-without-file` = 0**, `ticket-unplaced` = 0; remaining kinds `["ticket-duplicated","wip-limit","wip-count","column-missing"]` | `chmod 000 $T/t1/plans/tickets`; `node scripts/board-dashboard.js $T/t1 --once` and `--once --json`; mode restored to 755, 7 entries listable again | **closed** |
| CR-03 | one non-UTF-8 byte makes the board `torn` forever, 3 reads + 6 stats per poll | `overall: unavailable`, `code: "TORN"`, message asserting the file "changed under every one of 3 read attempts" | `code: "ENCODING"`, message states the file "is not being modified — it is bytes this module cannot use … and it is not re-read"; `sources.board` `unavailable`; **read attempts = 1** | board rewritten with one Latin-1 `0xE9` (`caf<E9> latin1 title`, verified at byte offset 0x56 with `xxd`); `--once --json`. Read count measured **differentially** under `node --trace-event-categories node.fs.sync`: the undecodable tree (`t3`) and a byte-identical-length valid-UTF-8 tree (`t4`) both report `open=36 read=36 stat=56` — a decode failure costs exactly what one successful read costs, so no retry happened | **closed** (this one the verifier did **not** execute; executing it here is an **addition** to the oracle, recorded as such) |
| CR-04 | symlink under `plans/tickets/` leaks outside content to stderr and to the `--json` document | marker `SECRET-TOKEN` present **1× on stderr and 1× on stdout** | marker count **0 on stdout and 0 on stderr**; one surviving `readErrors` entry, `code: "OUTSIDE-ROOT"`, naming the entry path and the resolved destination and quoting no byte of the target; `sources.tickets` = `stale`, overall `stale`, exit 0 | `printf 'SECRET-TOKEN-abc123…' > $T/outside-secret.txt`; `ln -sf` it to `$T/t5/plans/tickets/ZZZ-999.md`; `node scripts/board-dashboard.js $T/t5 --once --json > out 2> err`; `grep -c SECRET-TOKEN` on each channel | **closed** |
| CR-05 | terminal escapes from a ticket's first line and from argv reach stderr unsanitized | content form: 3 control code points on stderr (OSC title + screen-clear CSI); argv form: 4 | content form: **0**; argv form: **0**. Both diagnostics survive and still name what went wrong (`ABC-900.md` … `no-opening-delimiter`, and the refused root); argv form still exits **2** | OSC + CSI planted in `$T/t6/plans/tickets/ABC-900.md` line 1 and in the `repoRoot` argument; stderr captured to a file and counted by **code point** (C0 minus newline, DEL, C1) so the diagnostic's own em dash cannot inflate the count | **closed** |
| CR-06 | a second ticket-frontmatter authority survives and a docblock claims it was deleted | `frontMatter()` live at `validate-agent-factory.ts:716-723`, used at `:742`; `board-model.ts:816-819` falsely asserts plan 32-08 deleted it | `grep -c 'frontMatter\|FrontMatter'` = **0** in `scripts/validate-agent-factory.ts` **and 0 in the committed `.js`**; `checkTickets()` calls `parseTicketDocument` at `:736` (imported at `:78`); the `board-model.ts` docblock now states the deletion in the **present tense**, names plan 32-12 as the plan that performed it, names CR-06 as what caught the false claim, and delegates the claim to the census | direct file read of both files, plus the same grep over the committed `.js` | **closed** |

### Honest departures in that table

- **CR-02's `readErrors` length is 2, not the 1 this plan's acceptance criterion names.** One entry
  is the tickets EACCES (the substantive claim, measured with `select(.source == "tickets")` → 1).
  The second is the fixture's own deliberately tampered claim record
  (`.grugops/queue/claimed/abc-105-tampered/claim.md`, code `tampered`), which is present before and
  after and unrelated to this defect. `32-09-SUMMARY.md` recorded the same departure for the same
  reason. The criterion is met on the claim it was written to check and **not** met on its literal
  wording; both are stated here rather than smoothed over.
- **CR-01's `fsSymbols` and `bareSpecifiers` did not move under the probe**, exactly as the verifier
  recorded pre-fix. That is not a regression — it is the point. The guard no longer decides on those
  two sets alone: the destructure now lands in `opaqueFsAcquisitions`, which PART ONE already
  asserts empty, and that is what turns the gate red. The `MEMBERS` and `COUNT` pins staying still
  under a planted full writer is the measured proof that the old derivation could never have caught
  this shape.
- **CR-01's three other red cases are collateral, not three independent detections.** With the probe
  planted in `scripts/board-read.js`, the mirror-based discrimination cases (`POSITIVE CONTROL`,
  the string-literal element access, and the non-fs string-literal `CONTROL`) build their mirrors
  from the live closure and therefore inherit the probe. Only `PREMISE: no closure module acquires a
  filesystem module by a route this pass cannot name` is the detection. Counting 4 reds as 4
  detections would overstate the evidence.

---

## 2. The five behavioral spot-checks, re-run verbatim — including the two that passed

A review that re-checks only the failures cannot find a regression, and a regression in a row that
previously passed is the most valuable thing this section can surface.

| # | Behavior | Verifier's result | Measured now | Command | Verdict |
|---|----------|-------------------|--------------|---------|---------|
| S1 | `--once --json` prints one parseable JSON document | PASS (valid single document) | PASS — **1** non-empty line, parses, `schemaVersion: 1`, 9 conflicts, overall `ok` | `node scripts/board-dashboard.js $T/t1 --once --json` on a pristine copy (`/usr/bin/diff -rq` against `scripts/fixtures/board-snapshot` exits 0) | **no regression** |
| S2 | `--once` exits 0 with conflicts present | PASS (`0`) | PASS — exit **0**, header reports **9 conflicts** | `node scripts/board-dashboard.js $T/t1 --once; echo $?` | **no regression** |
| S3 | DASH-06 guard bypassed by a namespace destructure | FAIL (both sets empty, gate green) | **now refused** — gate exit 1, the escape named | see CR-01 row above | **closed** |
| S4 | EACCES on `plans/tickets/` yields a stale badge / readError | FAIL (`[ok]`, no badge, no readError, 8 fabricated conflicts) | **badge + readError present**, 0 fabricated conflicts | see CR-02 row above | **closed** |
| S5 | Symlink under `plans/tickets/` stays contained | FAIL (outside content on stderr and stdout) | **0 / 0**, one `OUTSIDE-ROOT` readError | see CR-04 row above | **closed** |
| S6 | Full `board-*` + `validate.test.ts` suite is green | PASS — 8 files, 352 tests | PASS — **9 files, 548 tests**, all pass | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-*.test.ts scripts/validate.test.ts` | **no regression** (file count and case count both grew; nothing went missing) |

**S2's conflict count moved from the verifier's quoted 11 to 9, and that is correct rather than a
regression.** The verifier's 11 was measured on a tree with `chmod 000` still applied — 8 of those
11 were the fabricated `row-without-file` entries CR-02 is about. On a pristine fixture the count is
9, which is exactly the conflict set pinned in the committed golden
(`scripts/fixtures/board-snapshot/expected-snapshot.json`: 3 `board-vs-ticket`, 1 `column-missing`,
1 `row-without-file`, 1 `ticket-duplicated`, 1 `ticket-unplaced`, 1 `wip-count`, 1 `wip-limit`).
Under EACCES the post-fix count is 4, and the difference between 4 and 11 is precisely the 8
fabrications plus the 1 legitimate `row-without-file` that the presence gate now correctly withholds
while the tickets source is not `ok`.

---

## 3. How each gate is REACHED — four questions per closure, answered with evidence

Four questions, each one derived from a round in this repository where a fix was green and bypassed:

- **Q1 — which command runs this gate, and is that command wired into CI?** A gate nobody runs is prose.
- **Q2 — what is the predicate's input assembled from?** Name the set it iterates and where that set
  comes from. A hand-typed part is named, with what would rot it.
- **Q3 — at which positions is the predicate even ASKED?** Not which values it refuses. A predicate
  that is correct and asked in three of four places is a bypass in the fourth.
- **Q4 — which arms consume the changed value, and does each still behave on a LEGITIMATE input?**

### 3.1 — CR-01 / DASH-06: the read-only import-graph guard (plan 32-11)

- **Q1.** `scripts/board-readonly.test.ts`, run by `npm run check:dashboard-readonly`
  (`npx vitest run scripts/board-readonly.test.ts`) and, in CI, by the full-suite step at
  `.github/workflows/ci.yml:174` (`npx vitest run --exclude '**/scripts/e2e/**'`). `vitest list`
  confirms the file is in that default suite (57 case entries before this round's two additions).
  **But the named script is NOT what CI runs, and the derivation that is supposed to prove `check:*`
  reachability cannot see it — see finding F-01.** The gate is reached; the proof that it is
  reached is weaker than it reads.
- **Q2.** Four inputs. (a) The **closure module set**, derived by `jsImportClosure` walking the
  committed `.js` from `scripts/board-dashboard.js` — derived, and its non-emptiness plus required
  members are asserted as premises. (b) `MUTATING_FS_SYMBOLS`, derived from the **runtime's** own
  `node:fs` export list filtered by `WRITE_CLASS_STEMS` — the 16 stems are **hand-named** because
  D-21 defines write-class by stem, and three `STEM_FALSE_POSITIVES` are hand-named with a case
  asserting each still matches something. What would rot them: Node adding a writer whose name
  carries none of the 16 stems. (c) `NAMESPACE_REENTRY_MEMBERS`, **derived from the runtime** by
  asking which object-valued members of `node:fs` carry a mutating symbol as a function. (d)
  `NAMESPACE_ESCAPE_SHAPES` (14 rows) and `ACQUISITION_SHAPES` (8 rows after this round) — **entirely
  hand-authored data**, two-sided cardinality pins plus a uniqueness assertion. What would rot them:
  an ESM spelling nobody wrote a row for. That is the class F-02 below came from.
- **Q3.** The canonical form is asked at every non-binding READ of an fs-namespace identifier, with
  exactly two exemptions, both binding sites. **The re-entry rule, however, was asked at only two of
  the four positions where a member NAME enters `fsSymbols`** — property access and string-literal
  element access, but not a named import and not a named re-export. That is finding **F-02**, closed
  in this round.
- **Q4.** The changed value is `fsSymbols` / `opaqueFsAcquisitions`. Consuming arms: the MEMBERS pin,
  the COUNT pin, the mutating intersection, the `PREMISE: no closure module acquires…` case, the
  banned-module ban, and the mirror-based discrimination cases. Legitimate inputs probed: the **live
  unplanted closure** (`npm run check:dashboard-readonly` → 59 passed, exit 0, `EXPECTED_CLOSURE_FS_
  SYMBOLS` unmoved at 6 members) and the `CONTROL: an UNPLANTED mirror of the live closure is still
  green` case. The live closure's own named imports (`readFileSync`, `readdirSync`, `realpathSync`,
  `statSync`, `existsSync`, `watch`) pass through the new `noteFsMember` unchanged.
- **What this fix CREATED.** `noteFsMember` is a new single chokepoint through which every fs member
  name now passes, so a defect in it is a defect at all four positions at once — covered by MUTANT E
  (delete its re-entry arm → exactly 4 rows red) and MUTANT F (revert only positions 3 and 4 →
  exactly the 2 new rows red), which together show the chokepoint is load-bearing at each position
  separately rather than only in aggregate.

### 3.2 — CR-02 / DASH-04, DASH-05: the three-armed directory listing (plan 32-09)

- **Q1.** `scripts/board-read.test.ts` and `scripts/board-model.test.ts`, run only by the full-suite
  step at `ci.yml:174`. **There is no named `check:*` script for the read seam** — it is reached
  through the suite, which is the same route as every other `*.test.ts` in this repository, and the
  suite step is unconditional in the CI job.
- **Q2.** `listDirectoryBounded` iterates nothing; it branches on `err.code` with **ENOENT as the
  only named arm and every other errno falling to the DEFAULT** (`staleReasonForCode(code)`), so the
  set of "failures that reach a badge" is the complement of one literal rather than an allowlist
  that can rot. `unreadableSources` and `deriveOverallSource` both iterate `SOURCE_NAMES` — a pinned
  six-member tuple (`SOURCE_COUNT = 6`), not `Object.keys`. `PRESENCE_DEPENDENT_CONFLICT_KINDS` **is
  hand-named** (two kinds: `row-without-file`, `ticket-unplaced`); what keeps it honest is that its
  complement is derived from the full kind set in a test with a two-sided pin, so a new eighth
  conflict kind cannot join silently on either side.
- **Q3.** `listDirectoryBounded` is called at **3 sites** (tickets `:1105`, queue `:1231`, context
  `:1356`) and `listingFailure` routes the `failed` arm at all **3** (`:1116`, `:1240`, `:1363`).
  The per-ENTRY arm (`kind: "partial"`) is settled at **3** sites (`:1172`, `:1317`, `:1478`) —
  one per directory source. The presence gate is asked once, at `joinSnapshot`, against
  `ticketsListingComplete`.
- **Q4.** Consuming arms: `settleSource` (badge + `readErrors`), `deriveOverallSource` (the top-level
  discriminant), the header badge in `scripts/board-dashboard.ts` — **both of the last two read the
  same `unreadableSources` function**, so the terminal and the `--json` document cannot disagree.
  Legitimate inputs probed here: a pristine fixture (S1/S2, overall `ok`, 9 conflicts = the committed
  golden's set); an EACCES on tickets leaving queue, context, traceability and config all `ok`
  (measured above); and `N1` below, an `ENOTDIR`, likewise leaving the other five untouched.
- **What this fix CREATED.** A third listing arm and a fourth `SourceOutcome` arm mean a **new way to
  refuse something legitimate**: an errno that is in fact benign now degrades a source to `stale`.
  It is covered on the benign side by the D-13 cases (`a tree with no .grugops/` produces NO badge
  and NO readErrors entry, because `unreadableSources` requires BOTH `unavailable` and a matching
  `readErrors` entry) and re-measured here by N3a, where a legitimate in-root symlink chain reads
  `ok` with zero readErrors.

### 3.3 — CR-03 / DASH-05: the byte-first tear detector (plan 32-09)

- **Q1.** Same as 3.2 — `scripts/board-read.test.ts` via the full-suite CI step.
- **Q2.** The predicate's input is now **raw bytes**: `readFileSync(path)` with no encoding, three
  byte counts compared, and the UTF-8 validity decision delegated wholesale to the **runtime's**
  `TextDecoder("utf-8", { fatal: true, ignoreBOM: true })`. Nothing about the UTF-8 grammar is
  hand-written here, which is the strongest possible answer to Q2: there is no set to rot.
  `ignoreBOM: true` is load-bearing and pinned by its own case.
- **Q3.** `readVerifyReread` is defined once (`:226`) and asked at **4 read positions** — the fixed
  file sources through `gatherFile` (`:997`), each ticket entry (`:1143`), each `claim.md` (`:1283`)
  and each `index.jsonl` (`:1424`). Every file byte the projector reads passes through it; there is
  no second read path.
- **Q4.** Consuming arms: the `unreadable`/`ENCODING` arm, the `torn` arm after the retry bound, and
  the success arm that returns decoded text. Legitimate inputs probed: a **valid-UTF-8 board of
  identical length** (`t4`) reads `ok` and costs exactly the same `open`/`read`/`stat` counts as the
  undecodable one, which is simultaneously the legitimate-input probe and the read-count measurement.
- **What this fix CREATED.** A new `ENCODING` code on a published `readErrors` entry, i.e. a new
  string a consumer can branch on without a `SCHEMA_VERSION` bump. 32-09 decided deliberately not to
  bump, on the grounds that `unreadable` was already published and only the code is new; the golden
  fixture is byte-identical, so no consumer's pinned document changed.

### 3.4 — CR-04 / DASH-03, DASH-05: real-path containment (plan 32-10)

- **Q1.** Same suite file and same CI route as 3.2/3.3. The routing census prints its own evidence on
  every run — this round's full-suite output carried
  `board-read routing census: 17 read-primitive call sites, producers [anchorAbsentTarget, childPath,
  insideRoot, repoSubpath, resolveRepoRoot], path helpers [gatherFile, listDirectoryBounded,
  readVerifyReread]`, so the claim is visible in the log rather than only inside an assertion.
- **Q2.** The containment decision's input is `realpathSync`'s answer — again the runtime's, not a
  spelling comparison. The **authority set is DERIVED by AST** ("every function that calls
  `realpathSync` or `insideRoot`") and pinned two-sided at exactly five names; the path-HELPER
  exemption set is derived by closure and pinned; the 17 read-primitive call sites are enumerated
  from the module rather than listed. Hand-typed part: the `OUTSIDE_ROOT` code literal and the
  errno→`StaleReason` mapping in `staleReasonForCode`, which is now the **one** spelling (three
  hand-written copies were collapsed into it during 32-10).
- **Q3.** `insideRoot` is asked at **3 call sites** (`repoSubpath` `:752`, `childPath` `:977`, and
  its own ENOENT arm through `anchorAbsentTarget` `:708`), and those two producers are the only
  things that build a read target — asserted, not assumed, by the routing census. `guarded()` is
  asked at **6 sites**, one per source (`:1597`–`:1613`), and the guard count is pinned two-sided
  against `SOURCE_NAMES`, so a seventh source cannot be added unguarded.
- **Q4.** Consuming arms: `ChildPath`'s `ok`/refused arms at four per-entry sites, `repoSubpath`'s
  throw, `guarded`'s `BoardReadError` catch and its **rethrow of everything else** (both arms driven
  by cases). Legitimate inputs probed this round: the pristine fixture (golden byte-identical, 9
  conflicts), and **N3a** — a symlink chain that leaves the tree and comes back inside the root — is
  ADMITTED with zero readErrors, which is the false-red this fix could most plausibly have produced.
- **What this fix CREATED.** A refusal that can decline a legitimate file, and one measured behaviour
  change (a `--symlink`-installed `agent-factory/` puts the dial outside the root and settles the
  config source `stale` on the LEAN fallback). Both are recorded in `insideRoot`'s docblock and in
  the contract. It also created a **new single point of failure**: every read target now depends on
  one `realpathSync`-based decision, so a defect there is a defect everywhere — which is why the
  authority set is derived and pinned rather than trusted.

### 3.5 — CR-05 / DASH-07: the sanitizing stderr chokepoint (plan 32-13)

- **Q1.** `scripts/board-dashboard.test.ts` via the full-suite CI step. No named `check:*` script.
- **Q2.** The write-site census's input is an AST collection over `scripts/board-dashboard.ts` that
  tracks the member, global-`process`, aliased and destructured spellings of the channel, and
  collects anything it cannot name into an `opaque` list **asserted empty** — so a spelling the
  collector does not know fails the guard rather than shortening its answer. The sanitizer's own
  class (`CONTROL_CODE_POINTS`) is in the module; the test's measure is spelled **independently on
  purpose**, so a regression that widened the module's class cannot widen the measurement in the
  same commit. That is the one place in this phase where a second spelling is the point.
- **Q3.** Asked at exactly **one** position — `STDERR_WRITE_SITE_COUNT = 1`, pinned two-sided, **and**
  the surviving site's enclosing function asserted by name to be `warn`. A count of one in the wrong
  function would still be a bypass, and the assertion says so.
- **Q4.** Consuming arms: the six former call sites (`emit`'s read-error loop, `refresh`'s catch,
  `run`'s usage path, `run`'s root-refusal catch, `main`'s catch, the entry tail). Legitimate inputs
  probed: the existing `POSITIVE CONTROL: ordinary non-ASCII text survives to stderr unchanged`, and
  in this round's own CR-05 transcript the diagnostic's em dash survives while the control count is
  0 — which is why the instrument counts **code points**, not bytes.
- **What this fix CREATED.** A single chokepoint every diagnostic depends on: if `warn` itself ever
  stopped sanitizing, all six sites would regress at once. It also created a variadic line contract
  (`USAGE_LINES`) so that a caller, not the content, owns where a line break falls — the alternative
  would have let an argv token forge a diagnostic line.

### 3.6 — CR-06 / DASH-01, DASH-02: one ticket-frontmatter reader (plan 32-12)

- **Q1.** Two commands. `scripts/validate.test.ts` via the full-suite CI step carries the census; and
  `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` is **explicitly wired in `ci.yml`**
  (the last line of the gate block quoted at `ci.yml:517`), so the validator itself runs on the real
  kit in CI, not only in a test.
- **Q2.** The census's input is a **recursive** `readdirSync(scripts, { recursive: true })` taken at
  test time (150 `.ts` files on this tree), **floored against `git ls-files scripts/*.ts`** so a
  tracked file the census never opened is an explicit failure naming the file. Two AST arms decide
  what a "ticket-frontmatter reader" is. Hand-typed part, recorded by 32-12 itself: arm B recognises
  a key-set constant only when its array literal is DECLARED in the same file, so a future module
  that imported `TICKET_KEYS` and re-derived a reader from it is caught only if it spells both keys.
  That boundary is stated in 32-12's own summary and is unchanged here.
- **Q3.** `parseTicketDocument` is asked at the one place a ticket's column/status is read in the
  validator (`checkTickets()`, `:736`), and the refusal arm short-circuits before either the column
  membership rule or the kebab rule runs — so no rule is ever evaluated against a guess.
- **Q4.** Consuming arms: the admitted arm (`column`, `status`) and the refused arm (the new
  published message `<path>: refused by the ticket grammar (<code>): <reason>`). Legitimate inputs
  probed this round: `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` → **ALL CHECKS
  PASSED** on the real kit, and **N4** below, a ticket whose frontmatter region closes and re-opens,
  which is admitted on the FIRST region only and contributes no conflict and no readError.
- **What this fix CREATED.** A new failure mode for installed repositories: a ticket with no
  frontmatter region is now an error where it was previously ignored. 32-12 accepted that
  deliberately (T-32-12-04) and recorded it in `agent-factory/contracts/board.md`; it is a newly-red
  gate on first upgrade, not a silent change.

---

## 4. Every new refusal branch, and the input that actually takes it

A branch nobody has watched execute is recorded as UNPROVEN, and UNPROVEN is a finding rather than a
formatting choice. Every row below was executed in this round unless its cell says otherwise.

| # | New refusal branch | Owner | Input that takes it | Proven |
|---|---|---|---|---|
| B1 | listing `failed` arm (`BoundedListing.kind === "failed"`) | 32-09 | `chmod 000 plans/tickets` → `code: "EACCES"` (§1 CR-02); `plans/tickets` as a regular file → `code: "ENOTDIR"` (N1) | **yes**, twice, two errnos |
| B2 | listing `absent` arm (ENOENT only) | 32-09 | a tree with no `.grugops/` — queue/context `unavailable` with **no** readErrors entry and no badge; re-measured here as the zero-badge half of the D-13 discrimination | **yes** |
| B3 | decode-failure arm (`unreadable` / `ENCODING`) | 32-09 | one `0xE9` byte (§1 CR-03); a two-byte `C3 28` sequence (N2) | **yes**, twice |
| B4 | `partial` arm — a per-ENTRY read failure degrades its whole source | 32-09 | the CR-04 symlink run: `sources.tickets` settles **`stale`**, not `unavailable`, while the other five stay `ok` | **yes** |
| B5 | containment refusal in the fixed-literal path (`repoSubpath` → throw → `guarded`) | 32-10 | not re-executed **this round**; proven by `scripts/board-read.test.ts#refuses an out-of-root symlinked ANCESTOR (\`plans\` itself) without throwing` and the ancestor transcript in `32-10-GREEN-proof.txt`. Cited, not re-run — **recorded as cited rather than claimed as measured here** | cited |
| B6 | containment refusal in the directory-entry path (`childPath` → `OUTSIDE-ROOT`) | 32-10 | the CR-04 symlink (§1) and the two-hop chain N3b — both produce `code: "OUTSIDE-ROOT"`, 0 marker bytes on both channels | **yes**, twice |
| B7 | the non-`BoardReadError` rethrow inside `guarded` | 32-10 | not re-executed this round; driven by `scripts/board-read.test.ts#PROPAGATES a plain Error raised inside a guarded source read`, which is green in this round's full-suite run | cited |
| B8 | ticket-grammar refusal in the validator (`refused by the ticket grammar (<code>)`) | 32-12 | the three committed disagreement fixtures (`bad-ticket-no-region` → `no-opening-delimiter`, `bad-ticket-duplicate-key` → `duplicate-key`), green in this round's full-suite run; **not** re-run by hand here | cited |
| B9 | namespace-escape refusal (the canonical form) | 32-11 | the verifier's exact destructure probe planted into the committed `scripts/board-read.js` → gate exit 1, `opaqueFsAcquisitions` names the escape (§1 CR-01) | **yes** |
| B10 | namespace RE-ENTRY refusal at a member access | 32-11 | `fsns.promises.…` / `fsns.default.…`, the two cases MUTANT E reds | **yes** (via mutation) |
| B11 | namespace RE-ENTRY refusal at a **named import / named re-export** | **32-14 (this round)** | `import { promises as fsp } from "node:fs"` planted into the committed `scripts/board-read.js` → `opaqueFsAcquisitions: ["scripts/board-read.js: promises as fsp"]`, gate exit 1; MUTANT F reds exactly these two rows and nothing else | **yes** |
| B12 | the generalised acquisition arm (an fs identity as a string-literal argument to any call) | 32-11 | `ACQUISITION_SHAPES` rows 4–6 (`createRequire(url)("node:fs")`, `process.getBuiltinModule("node:fs")`, `process.binding("fs")`), green in this round's gate run | cited |
| B13 | the stderr chokepoint (`warn` sanitizing every diagnostic) | 32-13 | OSC + CSI in a ticket's first line and in argv → 0 control code points on stderr, diagnostics intact (§1 CR-05) | **yes**, twice |

**Nothing in this table is UNPROVEN.** Four rows (B5, B7, B8, B12) are marked **cited** rather than
measured-here: each is driven by a named case that passed in this round's full-suite run
(74 files, 4811 passed, 2 skipped), but this review did not re-execute it by hand. That distinction
is recorded rather than flattened into a single "proven" column, because "a case exists and is
green" and "I watched this branch take an input" are different pieces of evidence and this
repository has been burned by treating the first as the second.

---

## 5. The neighbour-variation set — the fix that is one register too narrow

Each attempt takes the nearest variation of a closed finding. An attempt that succeeds in bypassing
is a FINDING and is listed in §6 with its reproduction.

| # | Neighbour of | Attempt | Result | Bypass? |
|---|---|---|---|---|
| N1 | CR-02 (EACCES) | `ENOTDIR`: `plans/tickets` replaced by a regular FILE | `readErrors` for tickets = 1, `code: "ENOTDIR"`; overall `stale`; `row-without-file` = 0, `ticket-unplaced` = 0; the other five sources unaffected | **no** |
| N2 | CR-03 (one bad byte) | a **two-byte** invalid sequence `C3 28` in the board | `code: "ENCODING"`, board `unavailable`, overall `unavailable` — identical handling to the one-byte case | **no** |
| N3a | CR-04 (symlink) | a symlink whose target is **itself a symlink back inside the root** | ADMITTED: overall `ok`, tickets `ok`, **0** readErrors naming the entry — no false red | **no** (the correct answer) |
| N3b | CR-04 (symlink) | a **two-hop chain** whose final target is outside the root | refused, `code: "OUTSIDE-ROOT"`, marker count **0 on stdout and 0 on stderr** | **no** |
| N4 | CR-06 (ticket grammar) | a ticket whose frontmatter region **closes and then re-opens** with a different `column:` | only the FIRST region is read (`column: "Backlog"`, not `"Done"`); the re-opened block is body text; no readError, no conflict; the validator exits 0 on a kit carrying it | **no** |
| N5a | CR-01 (namespace escape) | an fs namespace reached through a shape the enumeration does **not** list: `import { promises as fsp } from "node:fs"; fsp.writeFile(…)` | **BYPASS OF THE MECHANISM** — pre-fix the guard went red only on the MEMBERS/COUNT cardinality pin (`opaqueFsAcquisitions` was EMPTY and `promises` matches no write-class stem, so the mutating intersection never saw the writer). See finding **F-02**; **closed in this round** | **yes → closed** |
| N5b | CR-01 (namespace escape) | a module identity **assembled at runtime**: `process.getBuiltinModule("node:" + "fs")` then `.writeFileSync(p, "x")` | **`npm run check:dashboard-readonly` → exit 0, 57/57 green, over a module that writes files.** This is the residual 32-11 named in its own docblock and logged to `.planning/WINDOWS.md`; it was asserted there by reasoning, and is **measured here for the first time**. See finding **F-03**; **left OPEN** | **yes → open, named residual** |

---

## 6. Findings

### F-02 — CLOSED IN THIS ROUND: the re-entry rule was asked at two of four positions

**Severity:** high — the phase's load-bearing safety control, one maintainer edit from green over a
full writer.
**File:** `scripts/board-readonly.test.ts` (a file this round already owns, via plan 32-11).

**Reproduction (pre-fix).** Append to the committed `scripts/board-read.js`:

```
import { promises as fsp } from "node:fs";
export const w5a = (p) => fsp.writeFile(p, "x");
```

Then `npm run check:dashboard-readonly`. Measured result: exit 1 with **8** failures, of which the
detections are `the derived closure fs symbol set has the expected MEMBERS` and `… the expected
COUNT` — the **cardinality pin**. `opaqueFsAcquisitions` was **empty**, and `promises` matches none
of the 16 `WRITE_CLASS_STEMS`, so the mutating intersection never saw the writer either.

**Why a red on the cardinality pin is not good enough.** That pin's own failure message instructs the
reader to "weigh the new symbol against the read-only property and name it above — it is a decision".
A maintainer who weighs `promises`, finds it absent from `MUTATING_FS_SYMBOLS`, and adds it to
`EXPECTED_CLOSURE_FS_SYMBOLS` re-greens the guard **in one edit** over a module holding every writer
in `node:fs`. 32-11 wrote exactly this sentence about the namespace-member route ("a pin catching a
writer by accident is not the intersection deciding it") and closed that route; the named-import and
named-re-export routes were left un-asked.

**The four positions a member NAME enters `fsSymbols`:**

| # | Position | Asked before this round |
|---|---|---|
| 1 | property access on an fs namespace — `fsns.promises` | yes (32-11) |
| 2 | string-literal element access — `fsns["promises"]` | yes (32-11) |
| 3 | **named import** — `import { promises } from "node:fs"` | **no** |
| 4 | **named re-export** — `export { promises } from "node:fs"` | **no** |

**Fix.** One helper, `noteFsMember(name, sourceText)`, asks the same **runtime-derived**
`NAMESPACE_REENTRY_MEMBERS` set at all four positions. No new rule, no new set, no denylist — the
existing predicate asked where it was not being asked. The computed-key arm keeps its own refusal
because it carries no name to ask about, which is a different reason.

**Evidence the fix is real and discriminating:**

| Measurement | Result |
|---|---|
| `npm run check:dashboard-readonly` on the unplanted tree | 59 passed, exit 0 (was 57; +2 table rows) |
| the same plant re-run post-fix | exit 1, `opaqueFsAcquisitions: ["scripts/board-read.js: promises as fsp"]`, the `PREMISE: no closure module acquires…` case red — the mechanism, not the pin |
| **MUTANT E** — delete the re-entry arm inside `noteFsMember` | exactly **4** red: the two pre-existing member-access re-entry cases **and** the two new rows |
| **MUTANT F** — keep the arm, revert only positions 3 and 4 | exactly **2** red: the two new rows and nothing else |
| `EXPECTED_CLOSURE_FS_SYMBOLS` / `_COUNT` | unmoved — 6 members, the live closure's own named imports pass through unchanged |
| `npm run typecheck`, `npm run check:build-parity` | exit 0; no `.js` moved (`board-readonly.test.ts` is a test file and produces no build output) |
| full suite | 74 files, **4811** passed, 2 skipped (was 4809) |

`ACQUISITION_SHAPE_COUNT` moved 6 → 8 deliberately, as two named rows with the source that spells
each — never a bumped constant.

### F-03 — OPEN: the guard is green over a writer acquired through a runtime-assembled identity

**Severity:** medium — a **named**, previously-recorded residual, now measured rather than reasoned.
**File:** `scripts/board-readonly.test.ts`. **Not closed this round.**

**Reproduction.** Append to the committed `scripts/board-read.js`:

```
const m5b = process.getBuiltinModule("node:" + "fs");
export const w5b = (p) => m5b.writeFileSync(p, "x");
```

Then `npm run check:dashboard-readonly`. Measured: **exit 0, 57 passed / 57** — a fully green safety
gate over a module that writes any path handed to it.

**Status.** This is not new. 32-11 named it in `scripts/board-readonly.test.ts`'s docblock and logged
it to `.planning/WINDOWS.md`, having declined both available closures (constant folding, or a
denylist of callee names). What is new is that it had never been **executed**: 32-11 asserted the
boundary from the shape of the rule. It is executed here, and the assertion holds.

**Why it is left open.** Closing it needs either constant folding of the argument expression or a
denylist of callee names. The first is a real change in what this syntactic pass is; the second is
the heuristic-per-counter-example shape this file's own docblock refuses. Neither is a small closure
inside a file this round owns, and the round budget (1 of 4) exists so that recording it is safe.
Its bound is honest and worth stating: reaching it requires an attacker who can already add a module
to the dashboard's own import closure and rebuild the committed `.js` past `check:build-parity`.

### F-01 — OPEN (low): the `check:*` CI-reachability derivation cannot see `check:dashboard-readonly`

**Severity:** low — no live bypass; the claim is narrower than its message reads.
**File:** `scripts/check-foundation-guards.test.ts` — **not** a file this round owns.

**Reproduction.** The case `every \`check:*\` npm script names a gate that CI runs`
(`scripts/check-foundation-guards.test.ts:12009`) extracts `/node (scripts\/[\w.-]+\.js)/` from each
`check:*` command and **skips the script entirely when that regex does not match** (`if (m === null)
continue;`). Running that same derivation over the current `package.json` shows exactly two skips:

```
SKIPPED by the derivation: check:build-parity      => npm run build && git diff --exit-code …
SKIPPED by the derivation: check:dashboard-readonly => npx vitest run scripts/board-readonly.test.ts
```

The comment beside the `continue` explains the skip as "build-parity and friends run tsc/git rather
than a gate module". That describes the first skip and **not** the second: `check:dashboard-readonly`
runs a genuine gate module, and it is the DASH-06 safety control.

**Why it is not a live bypass.** `scripts/board-readonly.test.ts` is in the default vitest suite
(`npx vitest list --exclude '**/scripts/e2e/**'` reports its cases), and CI runs that suite
unconditionally at `.github/workflows/ci.yml:174`. The gate **is** reached. What is missing is the
mechanical proof that it is reached — and the shape that is missing is precisely the one this
repository added `check-foundation-guards` to prevent ("Round 3 created this gate … and invoked it
from NOTHING. It passed for a whole round by never running.").

**Why it is left open.** The fix belongs in `scripts/check-foundation-guards.test.ts`, which no plan
in this round touched. Closing it here would be a fifth fix in a sixth file, which the round budget
explicitly forbids. Recorded for round 2 with the reproduction above.

---

## 7. The gate sweep — row set derived from `package.json`, not from memory

The row set below is every `check:*` and every `freshness:*` entry read out of `package.json`'s
`scripts` object at sweep time, plus the umbrella `freshness` script. It is derived rather than
recalled, so a gate this round never touched that is now red is a regression this sweep finds rather
than one it happens to look for. **`npm test` was not run**: it triggers the live claude-CLI e2e lane,
which spends tokens and can hang. The suite is run as `npx vitest run --exclude '**/scripts/e2e/**'`.

| Gate | Exit | Last line |
|---|---|---|
| `freshness` | 0 | All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources. |
| `check:build-parity` | 0 | Build parity: no tracked build output moved when tsc ran. |
| `check:public-docs` | 0 | ALL CHECKS PASSED |
| `check:audit-register` | 0 | ALL CHECKS PASSED |
| `check:residual-citations` | 0 | ALL CHECKS PASSED |
| `check:claim-anchors` | 0 | ALL CHECKS PASSED |
| `check:banned-claims` | 0 | ALL CHECKS PASSED |
| `check:imperative-lexicon` | 0 | ALL CHECKS PASSED |
| `check:diff-disposition` | **1** | 1 CHECK(S) FAILED — **PRE-EXISTING, see below** |
| `check:nul-bytes` | 0 | ALL CHECKS PASSED |
| `check:platform-shapes` | 0 | ALL CHECKS PASSED |
| `check:dashboard-readonly` | 0 | 59 passed (59) |
| `freshness:catalog` | 0 | Catalog fresh: docs/catalog/README.md matches a fresh regeneration. |
| `freshness:adapters` | 0 | Mirrored generator resolved model preset: none |
| `freshness:skill-twins` | 0 | Skill twins fresh: 7 twin(s) compared, 0 byte difference(s). |
| `freshness:guarantees` | 0 | Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration. |
| `freshness:hook-manifest` | 0 | Hook manifest fresh: 2 decider(s), 26 module hash(es) match. |
| `freshness:context` | 0 | no `.grugops/context/` tree exists yet — **vacuous pass**, and it says so |
| `freshness:queue` | 0 | no `.grugops/queue/claimed/` tree exists yet — **vacuous pass**, and it says so |
| `freshness:traceability` | 0 | no `.grugops/context/` notes tree exists yet — **vacuous pass**, and it says so |

Plus the suite and the two named gates this round's verification steps require:

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **74 files, 4811 passed, 2 skipped**, exit 0 (the 74-file floor from `32-07-SUMMARY.md` holds; case count rose from 4809 by the two rows F-02 added) |
| `npm run build && npm run typecheck && npm run check:build-parity` | exit 0, no `BUILD PARITY FAILED` |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED |
| `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED |

### `check:diff-disposition` is PRE-EXISTING, cited rather than absorbed

It is red, and it was red before this round's first plan. The evidence is recorded in
`.planning/phases/32-board-projector-cli-dashboard/deferred-items.md`, which states that the gate was
re-run on a **detached worktree at `6d59ed1e`** — the commit before plan 32-08 began — and produced
an identical finding set. Re-derived here: the 78 findings name exactly five files, all of them
Phase-31 workflow documents:

```
agent-factory/workflows/05-pr-quality-gate.md
agent-factory/workflows/06-uat-pack.md
agent-factory/workflows/16-context-read-write.md
agent-factory/workflows/17-task-claim.md
agent-factory/workflows/18-context-compaction.md
```

A grep of the full finding text for any file this round touched (`board-read`, `board-model`,
`board-dashboard`, `board-readonly`, `validate-agent-factory`) returns **0**. It is therefore neither
counted as a regression of this round nor quietly absorbed into this round's scope. The remedy is the
one the gate itself prints: disposition rows under `docs/audit/29-style-dispositions/`.

### The other `deferred-items.md` entry is now GREEN, and this round did not fix it

`check:nul-bytes` was recorded RED on `32-REVIEW.md` (a literal `0x1b` at line 404) with
`status: open`. It now exits **0** over 2043 files. The cause is commit `888a1302`
(`fix(phase-32): replace literal ESC byte in 32-REVIEW.md with printable \x1b`), a user-authored
commit made during this round, not the work of any gap-closure plan. `deferred-items.md` still reads
`status: open` for it. **That entry is stale.** This plan owns neither that file nor that fix, so it
is recorded here rather than edited; round 2 should close the entry.

### The zero-dependency invariant, recorded as a line a future reader can check

`package.json` **has no `dependencies` key at all** (`require("./package.json").dependencies` is
`undefined`). `devDependencies` carries exactly three entries and no more:

```
@types/node  ~22
typescript   ~6.0.3
vitest       ~4.1.8
```

All three are dev-and-CI-only and are never shipped to a host machine, which is CLAUDE.md's
tooling-layer constraint verbatim. **This round added no package and ran no package-manager install.**
`scripts/board-readonly.test.ts` PART SIX asserts the same thing mechanically on every suite run.

---

## 8. Round budget, and the verdict on what was measured

**This was round 1 of a hard cap of 4** (the project rule recorded after Phase 31, where seven
consecutive rounds each closed a finding and created the next one).

What the round measured, counted honestly:

| | Count |
|---|---|
| Verifier findings re-measured against the rebuilt `.js` | **6 of 6** (CR-01..CR-06) |
| …measured **closed** | **6** |
| Behavioral spot-checks re-run, including the two that passed | **5 of 5**, plus the suite row — **no regression in any** |
| New refusal branches enumerated | **13** — 9 executed here, 4 cited to a green named case, **0 UNPROVEN** |
| Neighbour variations attempted | **7** (the plan's five minimums plus two extra symlink shapes) |
| …that bypassed | **2** — F-02 (closed this round) and F-03 (open, a previously-named residual now measured) |
| New findings raised | **3** — F-02 closed, F-03 open, F-01 open |
| Production code modified | **none.** One test file, `scripts/board-readonly.test.ts` (owned by 32-11), for F-02 |

**Verdict line — what was measured, not what it concludes about the phase.** All six of the
verifier's findings reproduce as closed against the rebuilt committed `.js`. **The round nonetheless
ends with two OPEN findings**, F-03 and F-01, both recorded above with reproductions, and one of them
(F-03) is a case in which `npm run check:dashboard-readonly` exits 0 over a module that writes files.
The per-round pattern this repository has measured seven times held again: **the round's own probe
found a bypass created by the previous fix's narrowness** (F-02 — the same rule 32-11 added, asked at
two of four positions), and it was found by asking *where the predicate is asked*, not by running the
suite, which was green throughout at 4809 and is green now at 4811.

**This document does not state that DASH-01, DASH-04, DASH-05 or DASH-06 are satisfied, and it does
not change `.planning/REQUIREMENTS.md` or the Phase 32 status line.** The verifier decides that, from
this evidence, in a separate pass. This repository has a recorded incident of an executor's roadmap
update flipping a phase to Complete before verification ran, which then had to be reverted by hand.

---

## 9. What a re-verification should check first

In order, because each step's premise is the one before it:

1. **`npm run build && npm run check:build-parity`.** If this is not clean, everything below measures
   an artifact that is not a build of its sources. Six recorded instances in this repository of a
   harness returning a false result because its own premise was never checked.
2. **F-03's reproduction (§6).** Append `const m = process.getBuiltinModule("node:" + "fs");` plus a
   `writeFileSync` call to the committed `scripts/board-read.js` and run
   `npm run check:dashboard-readonly`. It exits **0**. This is the one place a shipped gate is green
   over a writer, and it is the first thing worth disagreeing with this document about.
3. **F-02's mutants (§6).** MUTANT E should red exactly 4 rows and MUTANT F exactly 2. If either
   count has drifted, the discrimination behind this round's only code change has stopped
   discriminating.
4. **The CR-02 and CR-04 transcripts (§1).** They are the two that were reproduced live by the
   verifier, so they are the two whose pre-fix numbers are least disputable. `row-without-file` must
   be 0 under EACCES; the marker count must be 0 on both channels under the symlink.
5. **The two spot-checks that PASSED (§2, S1 and S2).** A review that only re-checks failures cannot
   find a regression. `--once --json` must be exactly one parseable line; `--once` must exit 0 with
   the golden's 9 conflicts.
6. **F-01 (§6)** and the stale `deferred-items.md` entry for `check:nul-bytes` (§7). Both are
   bookkeeping-shaped and both are the shape that rots silently.

---

*Plan: 32-14 · Phase: 32-board-projector-cli-dashboard · Measured: 2026-09-14*

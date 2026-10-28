---
id: ABC-042
title: The entry point — argv, the resolved colour, and the first frame a human can actually see
status: done
column: Done
size: M
priority: P0
epic: EPIC-006
feature: —
---

# ABC-042 — `npm run` prints a board: the composition root, flat in `src/`, exporting nothing

> **Cut 2026-08-13 by BA/PM** (Workflow 03), criteria **REPAIRED THREE TIMES** by BA/PM — ten changes and
> then four at the `Ready for Dev` exit (2026-08-14, `RF-1`…`RF-10`), and six after the quality gate
> (2026-08-15: `E1`, `Q4`, `G2`, `G5`, `G7`, `G8`) — **zero code, all three times.** Rulings, measurements
> and rejected alternatives live under `.grugops/context/` in this ticket's task folders and are **not**
> restated here (rule 2). **THIS IS THE THIN SLICE** — read `## What this ticket does NOT make runnable`
> before assuming it delivers a game.

## Problem

*User*: the project owner, and every human who will ever try this product — none of whom can run it today.

*Pain*: **there is no entry point.** `AGENTS.md` records `Dev / run: UNKNOWN - verify`; `package.json` has
no `bin` and no `main`; `plans/board.md` shows **28 tickets `Done`** with both UAT columns at **0/4**,
every one recorded *UAT deferred → `EPIC-006`, explicitly NOT passed*; and one of the nine frozen metrics
(`Escaped defects`) is unmeasurable as a direct result. **18 production modules, 827 passing tests, and
nothing a person can start** (HEAD `eefc217`, 2026-08-14).

*Value*: **after this ticket a human types one command and sees a chess board** — `Dev / run` gets a real
value, UAT gets a destination, and a quality signal can come from outside this repo for the first time.

## Scope

**Two modules, both flat in `src/`, and one line of `package.json`.**

1. **The entry point.** Exports **nothing** (`ADR-0011` clause 4). It is the only place that reads
   `process.argv` and the only place that supplies `process.stdout` as a `FrameSink`. It resolves the
   options, begins the glyph session, builds the game, builds `ABC-041`'s seam, writes **one** frame
   through `beginFrameSession`, and exits **0**.
2. **The argv resolver.** A pure function `(argv: readonly string[]) => resolved options | a usage error`;
   reads no ambient signal, writes nothing, and **exports its accepted set as data** (`A6`(i)).
   **Separate and exported for TESTABILITY, not design:** an entry point exports nothing, so everything in
   it is provable only by spawning, and `A4`'s 1000 resolutions plus `A6`'s corpus are unaffordable at one
   spawn each. The pure resolver makes them unit tests at **zero spawn cost**; **layout is the engineer's.**
3. **`package.json` gains exactly one `scripts` entry**, and **nothing else** — `A10` is the fence keeping
   the reserved distribution decision unmade.

**The argv surface, complete:**

| argument | effect |
|---|---|
| `--colour white` / `--colour black` | the human's colour, and the board orientation that follows it (`ABC-041`) |
| `--colour random` | **resolved to `white` or `black` before anything else sees it** (`ABC-019` `[D24]`) |
| `--ascii` / `--unicode` | `GlyphFlags` into `beginGlyphModeSession` (`src/glyph-mode.ts:113`) |
| no arguments | `--colour white`, no glyph flags — the mode is then `selectGlyphMode`'s answer for the real signals |
| `--ascii --unicode` together | **rejected with a message naming both flags, non-zero exit, no frame** — the obligation `src/glyph-mode.ts:76-80` assigns to this epic by name |
| anything else, including `--difficulty` | **rejected with a usage message naming the offending argument, non-zero exit, no frame** |

> *(Annotated 2026-10-12 by BA/PM, subtask `bapm-amend-ABC-101`. Pointer only, and this ticket's criteria
> are unchanged.)* When **`ABC-101`** merges, it supersedes three things on this page. The first is the row
> above for `--difficulty`: `--difficulty 1|2|3|4|5` becomes accepted. The second is the `--difficulty`
> bullet under `## Out of scope`. The third is `A6`(iii)'s `--difficulty 3` child, which becomes `--level 3`,
> a token that is still unrecognised. **The set stays closed.** Every other token is still rejected. The
> authority is `ABC-101` § Scope and its `A3`.

**THE ACCEPTED SET, CLOSED — this table is the allowlist and `A6` verifies its complement.** The resolver
accepts exactly: `--colour` followed by exactly one of `white` | `black` | `random`; `--ascii`;
`--unicode`; and the empty argv. **Every other token is in the complement and is rejected** (ASVS
**V2.1.1**/**V2.2.1 [L1]**, verified by `A6`(ii), not by prose).

## What this ticket does NOT make runnable, said before anyone reads the title and assumes otherwise

**It prints a board. It does not play a game.** No move can be typed: the production `InputSeam` is
`ABC-037` (`EPIC-003`, cut, `P0`, two open ordering dependencies) and no `EngineSeam` implementation
exists (`EPIC-004` undecomposed). `ABC-043` drives `runTurnLoop` and is blocked on both. **This is the
honest version of "it runs", and compressing it into "it works" is the failure this section prevents.**

## Out of scope

- **`runTurnLoop`, stdin, any `InputSeam`, any `EngineSeam`** — `ABC-043`. **The result screen** —
  `ABC-044`. **`undo` / `resign` / `new` / `quit`** — `ABC-045` / `ABC-046`; `undo` is not cut at all.
- **`--difficulty`** — it needs `EPIC-004`. Today it is an unrecognised argument (`A6`), and **`EPIC-006`
  acceptance criterion #4 is therefore NOT met by this ticket.** Named, not smoothed.
- **PACKAGING AND DISTRIBUTION, ENTIRELY.** No `bin`, no `main`, no `files`, no `publishConfig`, no change
  to `private: true`, no `npx` path, no install step. `ADR-0007` and `AGENTS.md` § Deployment posture
  reserve that decision to this epic **and it is not made here** (`A10` is the measurable fence), so
  **`EPIC-006` acceptance criterion #1 (`npx <package>`) is NOT met and cannot be met by any ticket until
  a human decides.**
- **Anything with a second output channel** — no logging, no verbosity flag, no `--help` beyond the usage
  message the error paths print (coding rules 5 and 7).

## Acceptance (Given/When/Then)

`A1`, `A4`/`A5`/`A6`'s end-to-end halves and `A7`–`A9` run the delivered entry point **as a child with
stdout AND stderr piped** — the mode `EPIC-002` `4c` names and the only one in which "a human can run it"
is proved. `A2`, `A3`, `A10`, `A12` are read off the diff; `A11` is a recorded reading. **The resolver's
own — `A4`'s 1000 resolutions, `A5`'s spy, `A6`(i)/(ii) — are unit tests with ZERO spawns.**

- **`A1` (a human can run it — the criterion this whole ticket exists for).** **Given** a checkout with
  `npm install` done and **no other setup**, **when** `npm run <name>` is executed with stdout as a pipe,
  **then** the process's stdout **ENDS WITH** a frame of exactly
  `frameHeight({ board: renderBoard(<start position>, mode, orientation).length, status: STATUS_ROWS, history: HISTORY_ROWS })`
  rows containing the eight ranks of the start position and **no frame row precedes it** — `npm` writes a
  banner first, so it is a byte-exact TAIL — and it exits with code **0**. **`AGENTS.md`'s
  `Dev / run: UNKNOWN - verify` is replaced with this exact command in the same diff, having been run.**
- **`A2` (it is an entry point by `ADR-0011` clause 4).** The delivered entry-point module contains
  **zero** `export` statements — asserted textually over the diff — so nothing can import a binding from
  it, it is never on the frame path, and it is never a probe root.
- **`A3` (flat in `src/`).** The delivered entry point is **directly in `src/`**, not in a subdirectory.
  *(`ADR-0011` clause 1's amendment names a **file-placement** trigger — the first `.ts` under a
  subdirectory of `src/` — and names this ticket as where it is **CHECKED**, not as the trigger. Checked at
  HEAD: **zero** such files, so it does not fire and the deferred fix is not owed here; `R3` stays open.
  **A build at `src/cli/main.ts` is invisible to the licence guard on two counts, so it goes GREEN while the
  correct flat build goes RED (`A12`): `A3` is all that stands between chasing green and that build.**)*
- **`A4` (`--colour`, including `random`, resolved before anything sees it).** **Given** the resolver and
  the argv `["--colour","random"]`, **when** it is evaluated **1000 times**, **then** every result is
  exactly `"white"` or `"black"` and **both occur** — **zero child spawns**. **And given** the running
  entry point with `--colour white` and again `--colour black`, **then** the frame's board region is
  byte-identical to `renderBoard(startPosition, mode, "white-bottom")` and `"black-bottom"` respectively,
  and with `--colour random` it is byte-identical to exactly one of the two. **The string `random`
  reaches no renderer and no seam.** *(`Math.random()` suffices — CSPRNG is **V11.5.1 [L2]**, outside the
  active set; ruled, with a named revisit trigger.)*
- **`A5` (`--ascii --unicode` is rejected here, and the mode rule stays in one place).** **Given** both
  flags, **when** the entry point runs, **then** a message naming **both** flags is written, the exit code
  is **non-zero**, **zero frame rows are written ON STDOUT AND STDERR, UNIONED**, **and `selectGlyphMode`
  is called 0 times** (spied at the resolver, zero spawns). *(`src/glyph-mode.ts:76-80` states the
  obligation and why — *"the same rule in two places is how two places come to disagree"*; its merged
  `(true, true)` fail-safe row and tests are untouched.)*
- **`A6` (an unrecognised argument never starts a game — the allowlist's COMPLEMENT, not four literals).**
  Three parts, and **(i)** is the one that closes the set:
  1. **The accepted set is DATA and the test asserts the DATA — structural, not sampled.** The resolver
     holds it as **one exported closed enumeration** (the flags, plus `--colour`'s three value words); the
     test asserts it **equals `## Scope`'s table element for element, both ways, no extras**, against its own
     transcription. **Rejection is the DEFAULT branch:** membership is **exact string equality**, that
     enumeration is the **only** argv literal in the delivered resolver (asserted textually), and — **derived
     from the table, so they cannot go stale** — each spelling's **near-miss family, complete over POSITION**,
     is rejected **in its legal argv position**: its upper-case form, and one character from `{"x", " "}`
     **inserted at every index** or **deleted at every index**; the row **pins the derived count**. **A fifth
     flag (`--debug`) must be enumerated or written as a literal: both RED deterministically**, where (ii)
     is blind to it.
  2. **The complement, as a property, zero spawns.** **Given 1000 generated tokens** — printable ASCII,
     lengths 1–24, **250 from each** shape `--<word>`, `-<char>`, `<word>`, `--colour <word>`, **filtered
     by WHOLE ACCEPTED FORM only** (dropped only when the whole argv is `--colour white|black|random`,
     `--ascii`, `--unicode` or empty — **never because it CONTAINS an accepted token**) — **then** each
     shape reaches its **250 within a budget of 500 DRAWS**, the **draws counted and asserted first** (a
     count of items KEPT cannot fail under rejection sampling), and **then** every token returns a usage
     error **naming the offending token**, **zero** accepted. This kills classes literals cannot:
     any unknown `--flag` ignored, rejection without naming, `--colour <anything>`, short flags eaten.
  3. **End-to-end, spawned:** **given** each of `--difficulty 3`, `-x`, `--colour purple` and `foo`,
     **then** a usage message **naming the offending argument** is written, the exit code is **non-zero**,
     and **zero frame rows are written ON STDOUT AND STDERR, UNIONED**.
  *(The channel — stdout or stderr — stays the **engineer's**. **RULED and adopted here:** if stderr is
  used, the entry point is also the only module that may acquire `process.stderr` as a writable handle,
  which `A9` already carries. **The union assertion exists because the channel is free:** a build that
  prints the board to the other channel and *then* complains passes a one-channel assertion.)*
- **`A7` (the glyph mode reaches the frame through the merged rule).** **Given** stdout is a pipe and no
  flags, **then** the entire emitted stream carries **zero** code points above `U+007F` (`selectGlyphMode`
  row 3 — a sink that cannot be seen gets the portable form). **Given** `--unicode` on the same pipe,
  **then** the board region carries at least one code point in `U+2654`–`U+265F`. *(**RULED:** "the
  emitted stream" in `A7`/`A8` is the child's **STDOUT** — `A8` forces it, two pipes having no defined
  interleaving, and on `A7`'s Given stderr is empty so all readings coincide.)*
- **`A8` (append strategy on a pipe, chosen once).** **Given** stdout is a pipe, **then** the emitted
  stream contains **zero** `\x1b[` sequences and ends with exactly one `\n` after the last row —
  `beginFrameSession`'s append branch (`EPIC-002` `4c`). `beginFrameSession` is called **exactly once**,
  with the first frame's own `.length` (`ADR-0009` clause 9a): the delivered modules contain **no numeric
  row-count literal**.
- **`A9` (`process.stdout` is acquired here and nowhere new; `process.argv` is read here EXACTLY ONCE).**
  **Given** the delivered diff, **then**, over the **new PRODUCTION modules** (`ADR-0011` clause 1: a
  `.ts` under `src/` that is not a `.test.ts`):
  1. the entry point is the only one containing `process.stdout`, and it passes it **only** as the
     injected `FrameSink`;
  2. **`process.argv` occurs exactly once — in the entry point — and its only use is as the argument to
     the resolver.** No second read and no branch on argv after the resolver returns: **the resolver is
     the exclusive validator** (ASVS **V2.2.2 [L1]**);
  3. no other new production module contains `process.` at all — which is what stops the resolver naming
     `process.stderr` and lets the entry point do it.
  *(**Scope is PRODUCTION modules, RULED:** the merged precedent this ticket cites spawns via
  `process.execPath`, so a whole-diff reading would break `A9` on every build satisfying `A1`. **The rule
  `A9` tests, corrected and adopted:** only the entry point may acquire `process.stdout` — **or
  `process.stderr`** — as a **WRITABLE HANDLE**, and may pass only `process.stdout` as the `FrameSink`;
  **`beginGlyphModeSession` is the one merged exception and it READS ambient signals once**
  (`src/glyph-mode.ts:117-118`); nothing below the entry point acquires a handle or writes, either channel.)*
- **`A10` (the reserved distribution decision is measurably unmade).** **Given** the delivered diff,
  **then `package.json` gains exactly one key under `scripts` and gains no `bin`, `main`, `files`,
  `publishConfig` or `dependencies` key, and `private` is still `true`** — asserted **key by key against
  `HEAD`**, not by reading the diff. *(The file-list and `src/`-byte-identity clauses that used to sit here
  are **DELETED, not re-worded** — false on the delivered build; their surviving property is now `A12`.)*
- **`A11` (startup cost, recorded, without touching the catalog).** **Given** the entry point run as a
  child ≥ 5 times, **then** the median wall time from process start to the last byte of the first frame is
  **≤ 1 s**, recorded **with its machine** in this task's context notes (rule 2, and `A12` bars this page)
  — or `A11` is unrecorded rather than met.
  *(**Not** `NFR-007` (`npx`-to-first-board **< 2 s**; no package and no `npx` path here) and deliberately
  **not** a suite assertion — a wall clock in a shared lane is a flake generator. **`plans/nfr-catalog.md`
  is not edited.**)*
- **`A12` (the merged tree, honestly scoped — and the ONE merged file this ticket must touch).**
  **Given** the delivered diff, **then** `git diff --name-only` shows exactly: the entry point, the
  resolver, their test file(s), `package.json`, `AGENTS.md` and **`src/history-pane.nfr.test.ts`** — and
  nothing else. **All 18 merged PRODUCTION modules under `src/` are byte-identical.** The only change to a
  merged file under `src/` is in `src/history-pane.nfr.test.ts`: **`LICENSED_DRIVERS` (`:213`) gains
  exactly one element — the delivered entry point's filename — plus **its citation as Architect/Design
  supplied it, however many lines that is** (five, and the numstat is +7/−1), and nothing else in that file.** **Suite green, skip 0.** *(**The licence edit is EXPECTED and the red is anticipated, not
  diagnosed under pressure:** the entry point unavoidably imports `newGame` from `src/history.ts` while
  `src/render-seam.ts` is guarded against importing it, so the correct build reds the merged licence guard
  until the entry lands — measured out of tree. **The citation text to paste is in the
  `design-ABC-042-stderr` notes; do not invent one, and do not move the file to a subdirectory to make the
  red disappear** — that build is the one `A3` forbids.)*

## Dependencies

- **`ABC-041` — MERGED to `main` and `Done` 2026-08-13.** It was this ticket's only ordering dependency and
  **it is closed.** **The seam it delivered, cited here for the first time:** `makeRenderSeam(mode,
  orientation)`, `src/render-seam.ts:51`, that module's **only** export, returning `RenderSeam = (history,
  status, thinking, messages) => readonly string[]` (`src/turn-loop.ts:97-102`).
- **Everything else is MERGED and named, re-measured at HEAD `eefc217` 2026-08-14:** `selectGlyphMode`
  (`src/glyph-mode.ts:81`), `beginGlyphModeSession` (`:113`), `newGame` (`src/history.ts:73`),
  `gameStatusOf` (`:152`), `frameHeight` (`src/frame.ts:106`), `beginFrameSession` (`:233`), `STATUS_ROWS`
  (`src/status-panel.ts:71`), `HISTORY_ROWS` (`src/history-pane.ts:70`). **The seam's `status` comes from
  `gameStatusOf(history)`** — never a bare `gameStatus`, never a status literal: a literal typechecks and
  puts the status rule in a second place, which `ADR-0002` clause 4 exists to prevent.
- **`ABC-037` and `EPIC-004` are NOT dependencies** — this ticket writes one frame and exits, so it needs
  neither seam. They are `ABC-043`'s. **There is no exported start-position constant under `src/`** either
  (measured: each test file defines its own `START_FEN`), so the entry point holds the literal it passes
  to `newGame`; promoting it is a change to a merged module and is **not** this ticket's.
- **Not a blocker, recorded so it is not re-discovered:** `ADR-0011` clause 3's licence wording says
  *"game-owning driver"* while the second entry is a **composition root**. The property it guards is
  satisfied and `A12` is checkable as written. **Owner: Architect/Design via an `ADR-0011` amendment hop.**

## Security / NFR triggers

- **`N8-LANE`, inherited by name** — ≤ **650 ms CPU**, same instrument and protocol as every ticket since
  `ABC-026`, and **this ticket is the most likely in either epic to test it: ONE new test file, the
  heaviest either epic adds** (both modules share it; no `vi.mock`, so no `*.nfr.test.ts`). **Plan for it
  at several times the 94.2 ms per-file median, and expect TEN spawns — not "single digits":** ten is
  forced by `A1`(1), `A4`(3), `A5`(1), `A6`(iii)(4) and bar 3(1), no two mergeable without changing what a
  criterion says, and it is pinned at ten in the test file — an eleventh child is a defect. Everything the
  repairs add (`A6`(i)'s near-miss family, (ii)'s sweep and draw budget, `A5`'s spy) is **zero-spawn**, and
  the both-channel captures reuse existing spawns. Anchor: the merged spawning file runs 11 tests in **92 ms**.
- **`NFR-002` — not triggered.** This module composes no frame row; `ABC-041`'s seam does, and `A8`'s "no
  row-count literal" is the structural guard. The `ADR-0011` census moves as clause 4 predicts: production
  **18 → 20**, entry points **1 → 2**, frame producers **6 → 6 unchanged**, licence entries **1 → 2**
  (`A12`) — no probe cost, no lane pressure. **`NFR-007` (cold start) does NOT fire** — an `npx` clause
  with no package; `A11` records a stricter reading and the catalog is untouched.
- **Security: triggered, and NOT waived — the first production module in the repository that reads
  `process.argv`** (verified: **zero** occurrences in all 18 production files at HEAD). Reviewed against
  **ASVS L1 as specified**, 2026-08-14: **BLOCKED on `RF-1`** (**V2.2.1 [L1]**, `block_on: high`), repaired
  by `A6`(i)/(ii) and `A9`(2) above and **DISCHARGED by Security/NFR the same day, on measurement** — the
  half stays **triggered and NOT waived**, and `RF-7`…`RF-10` (medium/low) are repaired above.
- **SCOPE OF THE BARS, RULED and written here so no hop re-derives it:** **bars 1 and 3, and the review
  obligation's builtin clause, are scoped to the delivered PRODUCTION modules** — the entry point and the
  resolver (`ADR-0011` clause 1). **They do not reach the delivered test file, which BAR 1b governs.**
  Under any wider reading every build satisfying `A1` violates bar 1, and merged green code this ticket
  cites by name becomes retroactively illegal.
  1. **Arguments are data, never code.** In the delivered **production** modules: zero occurrences of
     `eval`, `Function`, `child_process`, dynamic `import(` of anything derived from argv, and no shell.
  2. **BAR 1b — the delivered TEST file.** It may reach `node:child_process` **only** in argument-array
     form — `spawnSync` / `spawn` / `execFileSync` with an argv **array**. **Zero CALL SITES of `exec(` and
     `execSync(`** — `/\bexec\s*\(/` and `/\bexecSync\s*\(/`, **call sites, NEVER occurrences: the file MUST
     contain `process.execPath`, and that and `execFileSync` both contain the substring `exec`** — **zero**
     `shell:`, and no spawn argument built by string concatenation. Asserted textually over the delivered
     diff. *(**V1.2.5 [L1]** on the one file that may spawn; the cited precedent measures **3** substring
     hits and **0** call sites, so an occurrence test reds the correct build.)*
  3. **No argument reaches the terminal unsanitised.** **Spawn once** with an argv token containing a
     literal `\x1b[2J`, **capture BOTH stdout and stderr**, and assert **in this order**: **(i)
     non-vacuity FIRST** — the token's printable characters **are present** in the captured output;
     **(ii)** the **echoed token's** bytes contain **zero** C0 control characters, **zero** `U+007F` and
     **zero** `\x1b`; **(iii)** zero frame rows. *(Scoped to the **echoed token**, not the whole message —
     `\n` is a C0 and a newline-terminated usage message is legal. The `assembleFrame` sanitizer disjunct
     that used to head this bar is **DELETED, not re-worded**: `sanitize` is module-private
     (`src/frame.ts:123`), its only public route composes a whole frame `A5`/`A6` forbid, and it was the
     weaker control. C1/CSI is deliberately outside this class — `ABC-019`'s `R-A`, **L2, outside the
     active L1 set**, where `ABC-042` is recorded as a new source.)*
  4. **No filesystem and no network — in the production modules.** Zero import specifiers, **static or
     dynamic**, matching `/^(node:)?(fs|net|http|http2|https|tls|dns|dgram)(\/|$)/`, **and** zero occurrences of
     the no-import network globals **`fetch`, `WebSocket`, `XMLHttpRequest`** (bare globals on Node 22 — a
     build can reach the network with no import at all). *(A **grammar**, not a word list: this repo never
     writes a bare builtin specifier, and a `node:fs/promises` mutant has **already** shipped a false pass
     here once (`src/glyph-mode.nfr.test.ts:52-55`). The test file is **exempt** — BAR 1b governs it.)*
- **Review obligation (falsifiable) — and it is NOT a firing condition**, since the security half is
  declared fired above unconditionally: **the added lines get read before the ticket leaves review** if the
  diff adds a runtime dependency, imports any Node builtin in a **production** module (permitted set:
  **empty**), or touches any file under `src/` other than the two new modules, their test file(s) and
  `src/history-pane.nfr.test.ts` (`A12`).

## Test notes

1. **The proof is a child process, not an import.** `A1` must actually run the delivered command; an
   assertion against an imported function proves the composition, not that a human can start it.
   `src/history-pane.nfr.test.ts:566-590` is the merged precedent for spawning (its `spawnSync` **import**
   is at `:23`, outside that range — BAR 1b governs it, not bar 1).
2. **Keep the spawn count small and STATE it in the ticket at build time**; every spawn-provable criterion
   that can share one child's output should. **Spawn with stdout AND stderr piped** — `A5`, `A6` and bar 2
   assert over the union, and a child cannot be re-run to add a pipe afterwards.
3. **`A4`'s 1000 evaluations and all of `A6`(i)/(ii) must not spawn.** If the delivered shape makes that
   impossible, the shape is wrong for this ticket, not the criterion.
4. **Assert zero frame rows on the error paths** (`A5`, `A6`) **over both channels**, not just the exit
   code — the two builds that beat a weaker assertion are named in `A6`.
5. **Assert `package.json` key by key against `HEAD`** (`A10`), not by eyeballing the diff. **`A11` is a
   recorded reading with its machine, never a suite assertion** (`src/gameend.nfr.test.ts:16-17`).
6. **Expect the licence guard to go red before you fix it** (`A12`) — it is the *correct* build that reds it.

## Size and priority rationale

**Size `M` (3), UNCHANGED by all three repairs** — their twenty changes add assertions to the one new test file
and one array element to a merged one: **zero production lines, zero new spawns.** Calibrated against
`ABC-018`/`ABC-037` (both `M`); below `L` (`ABC-019`) — no state machine, no open design decision; above the
Coach's `S`, which I recorded not taking. **Not `XL`. The split line if it moves:** **(a)** the
resolver and its rejections — `A4`(unit), `A5`, `A6`; **(b)** the entry point, composition and frame —
`A1`–`A3`, `A7`–`A12`. (a) is `S` and ships alone; (b) cannot ship without it. **Priority `P0`** — it is
the thin slice, every other ticket in this epic is behind it, and `Escaped defects` is unmeasurable until
a human can run something.

## Definition of Ready

**Re-scored 2026-08-15 by BA/PM** against `agent-factory/checklists/definition-of-ready.md` — the third
scoring. **Result: 10 of 10 — MET, moved UP from 9/10**, because the gate measured item 4's *"RED
deterministically"* false for two mutant classes (`E1`): it was **⚠️ from 2026-08-15 11:24 until this
repair**, and the page's recorded 10/10 across that interval was stale. Scoring history: the notes.

| # | item | verdict |
|---|---|---|
| 1 | problem clear | **✅** the owner and every future user; `Dev / run: UNKNOWN - verify`, no `bin`/`main`, 28 `Done` tickets with both UAT columns at 0/4 and no destination, one unmeasurable metric — measured, not argued |
| 2 | scope and out-of-scope clear | **✅** two modules and one `package.json` line; a **closed** argv allowlist; six fences, two naming the epic criteria they leave unmet |
| 3 | INVEST-shaped | **✅ was ⚠️ — `ABC-041` MERGED and `Done` 2026-08-13, so the one ordering dependency is closed.** Independent, negotiable, valuable, estimable, small (`M`, unchanged), testable |
| 4 | acceptance testable and measurable | **✅ was ⚠️ TWICE, and both ⚠️ were earned by measurement rather than argument.** (`RF-7`) `A6`(i)'s *"no other token does"* carried **no instrument**. (`E1`) its replacement enumerated **three** near-miss derivations and all three touch the END of the spelling, so `endsWith` / `trim` weakenings shipped **856/856 green**. The family is now **complete over POSITION** — upper-case, plus one character inserted or deleted at **every** index — and was measured before it was ruled: **138 cases, ZERO accepted by the delivered build (no false RED), and both surviving mutants RED**. `A6`(ii)'s "250 per shape" control was a **tautology** (`Q4`) and is now a **500-draw budget** that reds where it used to hang. The rest: exit **0** on a real `npm run`; **zero** `export`s; a flat path; **1000** spawn-free `random` resolutions with both outcomes; **1000** complement tokens, **250 per shape**, all rejected; **zero** frame rows on three rejection paths **over stdout ∪ stderr**; `process.argv` **exactly once**; **zero** code points above `U+007F`; **zero** `\x1b[`; `beginFrameSession` **exactly once**; `package.json` key by key; `LICENSED_DRIVERS` **+1**; **18** modules byte-identical; a **≤ 1 s** recorded median |
| 5 | dependencies known | **✅** the ordering dependency is **closed**; eight merged contracts with **re-measured** line numbers (two inverted pairs corrected); `makeRenderSeam` cited for the first time; `ABC-037`/`EPIC-004` named as **not** dependencies; the `ADR-0011` clause-3 wording flagged with its owner and named **not a blocker** |
| 6 | security/NFR triggers with a measurable target | **✅ was ⚠️ for one hop (`RF-9`):** `BAR 1b` permitted `execFileSync` and forbade *"occurrences of `exec`"* one sentence later — a **guaranteed false RED** on the correct build, which must contain `process.execPath`. It now asserts **call sites**, and bar 4's grammar covers `node:http2` (`RF-10`). `N8-LANE` ≤ **650 ms CPU**, with the spawn count stated as the **ten** its own criteria force rather than the *"single digits"* they contradict (`G2`) — the **breach** of that bar is `G1`, the project owner's, and is not a DoR defect; `NFR-002` not triggered with the structural reason; `NFR-007` ruled not-firing, catalog untouched; **four** bars, each decidable by `grep` or a byte assertion over a captured stream, **each with its file scope stated**; the review obligation relabelled to what it is. ASVS L1 row by row: **V2.2.1's fail repaired and the BLOCK discharged**, four accepted risks with named owners |
| 7 | test notes present | **✅** six, including the two the repair added (both-channel capture; the licence red is expected) |
| 8 | size assigned | **✅** `M` (3), unchanged by any of the three repairs, calibrated, split line named, the Coach's `S` addressed rather than quietly overridden |
| 9 | priority assigned | **✅** `P0` |
| 10 | no major unresolved blocker | **✅ was ⚠️ — `ABC-041` is `Done`.** Every question this page held open is ruled **on the page**: the bars' file scope, the `process.stderr` rule, `A7`/`A8`'s "emitted stream", the licence edit, the `ADR-0011` clause-1 trigger check. **The ticket is HELD at the merge on `G1`** (`N8-LANE` at 2.00×, with the project owner) — a delivery hold, not a DoR defect: this item asks whether the criteria are well formed |

> **This score is not a gate and not a board move.** `plans/board.md` is the Orchestrator's and was not
> edited on any of the three repair hops.

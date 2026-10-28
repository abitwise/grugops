---
id: ABC-115
title: A piped session dies on `write EPIPE` with a raw Node stack and exits `1` — the code the product reserves for a refused command line
status: done
column: Done
size: S
priority: P1
epic: EPIC-006
feature: —
---

# ABC-115 — a reader that closes early kills the session, prints a stack trace at the player, and reports the wrong failure to the shell

> **Cut 2026-08-20 by BA/PM** (task `cut-epipe-regression-2026-08-20`, subtask `cut-epipe-regression`,
> Workflow 03). **RE-MEASURED AT THE CUT ON `main` @ `414ef75`, NOT QUOTED** — a QE/E2E hop found and
> bisected this at `qe-ABC-043-review-exit-2026-08-20`, but that note is an **unstamped `observation`**
> (`human_admission` is `off`, no `finding` is admissible on this install), so every number below was
> re-derived here and the two places where **my measurement disagrees with that note are written down
> rather than smoothed** (`## Provenance`).
>
> **`ABC-043` IS NOT RE-OPENED, NOT RE-SCORED AND NOT MOVED.** It is `Done` on the project owner's word
> ("ABC-043 passes, sign it off", Olger Oeselg, 2026-08-20). **That signature closed the ticket; it did
> not close this** — no criterion on that page reaches this path, which is exactly why this is a
> separate ticket and not a re-opening. `ABC-042`, `ABC-044`, `ABC-113` and `ABC-114` are untouched.
>
> **NOTHING IN `ABC-043`'s DIFF IS WRONG.** The hazard is a *consequence* of the feature it delivered:
> the entry point stopped writing one frame and started holding a session open across many writes, so
> for the first time a write can land after the reader has gone away.

## Problem

**The user:** anyone who runs the product with its stdout piped into a reader that stops reading — the
three ordinary shapes are `| head`, `| less` followed by `q`, and any pager or filter the human closes.
On this project that is also **every agent and every script that samples the product's output**, which
is how the defect was found in the first place (a mistyped `cat -A`).

**The pain, measured at this cut on `main` @ `414ef75`, Node v24.12.0, macOS:**

```
node src/cli.ts --ascii </dev/null | head -2    →  child exits 1
```

and stderr carries a raw Node crash:

```
node:events:486
      throw er; // Unhandled 'error' event
      ^
Error: write EPIPE
    at afterWriteDispatched (node:internal/stream_base_commons:159:15)
    ...
    at runTurnLoop (file:///…/src/turn-loop.ts:313:14)
    at async main (file:///…/src/cli.ts:156:21)
```

Three separate things are wrong with that, and they are three different defects wearing one symptom:

1. **The player is shown a Node stack trace** — internal file paths, internal line numbers, and the
   absolute path of the checkout. `src/cli.ts:100-105` states the product's own position on this in
   writing: *"the stack belongs to whoever debugs the bug"*, and the delivered crash path prints an
   `internal error:` line and no stack precisely so this cannot happen. This path bypasses that.
2. **The exit code lies to the shell.** `1` is `USAGE_EXIT_CODE` (`src/cli.ts:90`), reserved for **a
   refused command line**, and `AGENTS.md` `## Development` states the whole contract: *"0 when the
   session ran, 1 for a refused command line, 70 for an internal error"*. **Both were measured at this
   cut and they collide:** `node src/cli.ts --nonsense` exits **1**, and the piped session also exits
   **1**. `src/cli.ts:109-115`'s own docblock says `70` was chosen over a bare `2` *"so that a shell can
   tell a refused command line from a crashed session at all"* — on this path it cannot.
3. **It reports a bug where there is none.** Nothing crashed and no chess code failed; a downstream
   consumer stopped consuming. The product says otherwise, in the loudest way it has.

**Why it fails no criterion anywhere, stated so nobody reads this ticket as softer than it is.** The
`'error'` event on `process.stdout` is emitted **asynchronously, outside the promise chain**, so the one
`try`/`catch` in `main()` (`src/cli.ts:167-183`) cannot see it and no `await` ever returns. `ABC-043`
`A3`'s Given is *"an `InputSeam` that throws"* — this build is not that Given, and `A3` passes as
written. The exit-code ruling on that page is scoped to *"an exception that never became a
`LoopOutcome`"*. **Its letter does not reach this path. Its spirit is breached observably:** *non-zero
is reserved for exactly two things* now has a third, wearing the first one's number.

Full measurement tables, the threshold sweep, the two harness shapes I proved reproduce it, and the
disagreements with the QE note are in `.grugops/context/cut-epipe-regression-2026-08-20/notes/`, not on
this page (`AGENTS.md` `## Process rules` 2).

## Provenance — it is a REGRESSION, and I re-ran the bisect rather than citing it

The QE/E2E `observation` **claims** three isolated trees pin the introducing commit. **I re-ran all
three at this cut, in throwaway worktrees, same Node, same command line, and the claim reproduces:**

| tree | total stdout lines | `\| head -2` |
|---|---|---|
| `54cbb23` — `ABC-042`'s tip, the board-printer | 23 | **exit 0**, no stack |
| `46457b8` — `ABC-043`'s delivery | 24 | **exit 1**, unhandled `write EPIPE` |
| `d127ae3` — `main` when QE measured | 24 | **exit 1**, unhandled `write EPIPE` |
| `414ef75` — `main` today | 24 | **exit 1**, unhandled `write EPIPE` |

`ABC-042` was **safe by accident**: it wrote one frame and returned, so the write had completed before
the reader could go away. The regression range is `54cbb23…46457b8` — **this is a re-measurement of the
note's claim by an independent hop, not a citation of it.**

**Where my measurement DISAGREES with the QE note, and it narrows the trigger:**

- The note lists `| grep -q` as a trigger. **It is not, here: 5 consecutive runs of
  `node src/cli.ts --ascii </dev/null | grep -q 8` exited 0 with zero `write EPIPE` lines.** The
  session's whole output is 24 lines and it ends at end-of-input before `grep -q`'s exit is observed.
- The note gives `| head -30 → exit 0` as the boundary. **The real boundary is the total output:** swept
  `head -N` at `N ∈ {1,2,5,10,15,20,21,22,23,24,25,28,30,40}` — **`N ≤ 23` reproduces (exit 1),
  `N ≥ 24` does not (exit 0)**. 24 is the full output, so the rule is *any reader that closes before the
  session's last write*, and a criterion must be written against that rule, not against `head -30`.
- **Not format-specific and not stdin-specific**, both measured here and neither in the note: the
  default glyph mode (`node src/cli.ts | head -2`) reproduces identically, and so does a session that
  actually plays a move (`printf 'e4\nquit\n' | node src/cli.ts --ascii | head -2`).

## Ruling — WHICH EXIT CODE THIS PATH OWES (BA/PM's own pen, and it is reversible)

**Ruled: `0`, with stderr silent on this path.** The brief asked for a decision or an honest open
question; this is decidable from the contract that already exists, so it is decided.

1. **`1` is out on measurement, not on taste.** It is `USAGE_EXIT_CODE`, and a refused command line was
   measured exiting 1 at this same cut. Two unrelated failures sharing one code is the defect.
2. **`70` is out because it would be a false statement.** `INTERNAL_ERROR` reads *"a bug ended this
   session"*. No bug ended it. Printing that line here is the same species of defect `ABC-114` exists to
   repair — a true-sounding sentence that is not true — and it would make every closed pager look like a
   crash in whatever reads exit codes next.
3. **`0` is what the contract's own words give.** *"0 when the session ran."* It ran; the consumer
   stopped consuming, which is the consumer's choice and not the session's failure. The nearest
   delivered precedent is end-of-input: `input ended`, exit **0** (`AGENTS.md` `## Development`, run
   2026-08-19). **And it keeps the contract at exactly three codes** — this ticket invents no new signal.
4. **`141` (`128 + SIGPIPE`), the shell-idiomatic answer, is CONSIDERED AND REJECTED AT THIS HOP —
   because it is not mine to take.** It requires a **fourth** exit code, which amends a contract written
   in `AGENTS.md` and in `src/cli.ts`'s own docblock. That is Architect/Design's ruling and the owner's
   file. **Pre-registered so nobody re-argues it: if Architect/Design amends the contract to give this
   path a SIGPIPE-shaped code, `A2`'s expected value becomes that code, the rest of this page is
   unchanged, and the ticket is NOT re-cut.** `A2`(ii) is written to hold either way.

**The cost of ruling it here rather than escalating, stated: an Architect/Design hop may overrule me at
`In Design`.** That is the ⚠️ in the DoR score below, and `A2` is shaped so an overrule changes one
literal rather than the ticket.

## Design ruling — `ADR-0016`, 2026-08-20 (Architect/Design, task `design-ABC-115-2026-08-20`)

**DoR item 10's ⚠️ is CLOSED and `## Ruling` above is CONFIRMED, not overruled.** `A2`(i)'s literal
`0` stands, `A2`(ii) is unaffected, **the ticket is not re-cut, not re-scored (`S`/`P1` is BA/PM's)
and no criterion is edited.** The authority is
`memory-bank/50-decisions/ADR-0016-closed-stdout-reader-ends-the-session-at-exit-zero.md`; this is a
pointer to it and the reasoning is in `.grugops/context/design-ABC-115-2026-08-20/notes/`, not here.

Four things the repair hop is handed, so it chooses no architecture at the bench:

1. **Exit `0`, three codes, no fourth.** `141` is rejected on four grounds, three of them new at the
   design hop — chiefly that Node ignores `SIGPIPE`, so a truthful `141` needs a signal death, which
   `A2` forbids, and the untruthful one is a hand-set status claiming a signal that never fired.
2. **`A8` IS SATISFIED BY ITS FIRST BRANCH: no edit is owed to `AGENTS.md` and none to
   `src/cli.ts`'s exit-code docblock** — both stay true verbatim under this ruling. Say so in the
   delivery note; do not open `AGENTS.md` (`ABC-109` is live against it under a byte cap).
3. **The seam: the entry point owns the stdout error arm** — one `sink.on("error")` at
   `src/cli.ts:148`, `EPIPE`-only, re-throwing every other code; `frame.ts`, `turn-loop.ts` and
   `line-input.ts` stay byte-unchanged. **Ending the session: PRIMARY `process.stdin.destroy()`
   (the delivered end-of-input transition then carries `exitCode 0` through the one existing
   assignment); FALLBACK `process.exit(0)` only if the primary is measured to fail.** Both measured
   green at the design hop; ≤ 5 production lines.
4. **A FIFTH FORBIDDEN SHAPE, MEASURED, that `A4` does not catch:** a bare swallow — a listener that
   silences `EPIPE` and does nothing else — **passes `A1` and `A2` and lets the session run on
   invisibly into a dead pipe** (8.02 s vs 3.07 s with a live stdin). `A3` asserts the trigger and
   `A2` the status; **nothing on this page asserts that the session ENDS.** A row for it is
   recommended to BA/PM (it would take `N8-SPAWN` to +6, above the derived ceiling, so it is BA/PM's
   word and not the engineer's) and is **not added here**.

**`XS` re-size trigger NOT fired** — the guard does not collapse to one child. **`A1`'s "1196 bytes"
is a base for a red watch, not a constant: it is path-length dependent (1282 measured at this hop in
a longer path) and must be re-measured, never asserted.**

## Amendment — 2026-08-20 (BA/PM, task `amend-ABC-115-2026-08-20`)

**Architect/Design was RIGHT, and I re-measured their claim before writing a line of it rather than
inheriting it.** Their note is an unstamped `observation` (`human_admission` is `off`), so a fresh
worktree, a fresh copy of `src/` **outside the repository**, and my own runs decided this — not their
numbers. **The bare swallow reproduces exactly as they measured it: `real 8.02 s` against `3.08 s`,
twice each, on the instrument that times the CHILD.** It passes `A1` and `A2` completely (exit `0`,
0 bytes of stderr) on this page's own Givens. **The gap was real, so a criterion was written.**

Four things settled, all four decided rather than deferred:

1. **`A9` added** — the session must END, expressed as a bound a test asserts (`exited within
   T_bound < T_open`), never as prose about intent. It is the only row that kills the bare swallow.
2. **`N8-SPAWN` raised +5 → +6 with the reason on the page**, and the ceiling re-expressed with time
   clauses beside the count, because the count under-priced `A9`'s child by ~15× in wall. The
   under-ceiling alternative was priced (drop one `A3` row, save ~70 ms) and **rejected**.
3. **`A1`'s byte figure corrected to a formula** — `982 + 2 × (checkout path length)`, fitted on four
   paths. **1196 and 1282 were never a disagreement**; they are the same measurement at two path
   lengths, and the page said "path-length dependent" without saying by how much.
4. **DoR item 10's ⚠️ closed on the page**, so the table stops contradicting the `## Design ruling`
   section three inches above it. **9/10 ⚠️x1 → 10/10.**

**Size stays `S` and priority stays `P1`, and this is a deliberate statement rather than silence.**
`A9` adds **zero production lines** — the ruled fix already ends the session; `A9` only asserts that
it does — one test row in a file this ticket already opens, and one child. `SPLIT_REQUIRED` is **not**
raised. **What DID grow is the lane's wall cost, and that is reported, not absorbed** (see
`## NFR / security`).

**Not done here, so no silence reads as a pass:** `src/` untouched; the exit code NOT re-opened
(`ADR-0016` settled it); `ADR-0016`, `AGENTS.md` and every other ticket untouched; `ABC-115` not moved
off `Ready for Dev`; nothing merged. The four builds, the rejected instruments and the byte fit are in
`.grugops/context/amend-ABC-115-2026-08-20/notes/`, not on this page.

## Budget ruling — 2026-08-21 (BA/PM, task `budget-ABC-115-2026-08-21`)

**THE `<= 0.5 s CPU` CLAUSE WAS MINE AND IT WAS IMPOSSIBLE. IT IS RE-DERIVED, NOT RELAXED, AND THE
DELIVERY IS NOT AT FAULT.** The engineer reported a breach rather than shipping or quietly restating
my sentence, exactly as the clause above demands. **They were right to stop, and they were right on
the arithmetic** — re-measured at my own hand, not inherited from their unstamped note.

**`N8-SPAWN` IN FORCE, in full:** **`<= 6 added children` AND `<= 2.0 s added wall` AND `<= 0.30 s
added CPU (user + sys) PER ADDED CHILD`** on `npx vitest run --dir src`, measured as the **median of
>= 5 interleaved paired runs** against the immediate base commit, with the sign agreeing on **>= 4 of
5**. The count and wall clauses are **UNCHANGED**; only the CPU clause moves, and it changes shape.

**WHY THE FIRST DERIVATION WAS WRONG — so it is not repeated.** `ABC-043`'s **64-72 ms per child is
WALL**. I carried it into a CPU clause (`0.07 x 6 = 0.42`, written `<= 0.5 s`) without ever measuring
a child's CPU. **Measured here: a child costs ~0.07 s of wall and ~0.15 s of CPU**, and in the
8-worker lane the gap is ~11x, not 2x — six children add **+0.08 s wall** and **+0.91 s CPU**,
because idle cores absorb child CPU without moving the clock. **There is no safe wall→CPU constant;
the clause must measure the quantity it names.** Two further faults: **"CPU" was left unqualified**
(`user` and `user+sys` differ by 0.27 s here — over half the old budget), and **the sentence
contradicted itself** — 0.5 s admitted 3.3 children while `<= 6 children` sat beside it.

**RE-DERIVED, NOT EXCUSED, and the measurements say so rather than I do:** six of the CHEAPEST
children that exist on this product, with this harness removed entirely, cost **+0.91 s CPU** — **no
build could ever have met 0.5 s**; the delivery lands at **1.3x that floor**, so there is no overrun
to excuse; and **0.30 was derived from a probe on `badf6c3` that contains none of this ticket's
code**, before the delivered figure was consulted. **It has teeth: 0.30 is 1.97x the measured floor**,
so a child twice as expensive as a bare `node src/cli.ts` fails it, and an engine-running child fails
it tenfold. **The old clause could not fail anything, because it failed everything.**

**DELIVERY AGAINST THE CLAUSE IN FORCE — MET ON ALL THREE:** children **+6** (at the ceiling, pin
17 → 23, asserted by the suite), wall **+1.12 s**, CPU **0.198 s per child** (+1.19 s over six).

**NO ROW IS DROPPED.** Dropping `A3`'s default-glyph pair saves ~0.30 s and still misses 0.5 s by
1.8x — it was pointless as well as wrong, and reaching 0.5 s needed **three** of the six criterion
children deleted. Rejected for the second time. **A row may only go by a RE-CUT argued on the
criterion's own value, never to make a number fit.**

**NOT DONE HERE:** `src/` untouched; the exit code NOT re-opened (`ADR-0016`); `ADR-0016`, `AGENTS.md`
and `plans/nfr-catalog.md` not opened for writing; `ABC-108`/`ABC-110`/`ABC-111` untouched and
**`NFR-008` NOT graded**; size and priority NOT re-scored (`S`/`P1` stand); **`ABC-115` NOT moved** —
the `In Review` exit follows QE's owed `qe-e2e` hop and the move is the Orchestrator's. Nothing
merged, nothing deployed, nothing self-signed. Numbers, the ten paired runs and the instrument that
nearly misled me are in `.grugops/context/budget-ABC-115-2026-08-21/notes/` — **hand-authored and
UNSTAMPED** (`human_admission` is `off`), not on this page.

## Residual ruling — 2026-08-21 (BA/PM, task `rule-ABC-115-residuals-2026-08-21`)

**QE's `G-QE115-1` IS UPHELD, THE GUARD IS OWED, AND I RAISED MY OWN CEILING TO PAY FOR IT.**
`A10` below is added, `N8-SPAWN`'s count clause goes **+6 → +7** and the pin **23 → 24**, with the
reason on this page rather than in a note. **Size stays `S` and priority stays `P1`** — `A10` adds
**zero production lines** (the delivered arm already discriminates; `A10` only asserts that it does),
one row in a file this ticket already opens, and one child through the existing `childOf` shape.
`SPLIT_REQUIRED` is **not** raised.

**RE-MEASURED, NOT INHERITED.** QE's note is an unstamped `claim` (`human_admission` is `off`), so a
fresh copy of `src/` **outside the repository**, my own one-token mutant and my own runs decided
this. **Their claim reproduces exactly:** delete the `code !== "EPIPE"` test and `src/cli.test.ts` is
**60/60**, the whole lane is **40 files / 1212 tests / 0 skipped green**, and `npx tsc --noEmit` and
`npx biome check src/cli.ts` are both clean. **The central design clause of a 13-line production diff
is asserted by nothing, across the entire suite** — not by one file, by all forty.

**IT IS NOT A DISTINCTION WITHOUT A DIFFERENCE, and the difference is this ticket's own species of
defect.** Handed a read-only fd as stdout, the first frame write fails `EBADF` and the two builds
part: delivered **exits 1 with 1507 bytes of stderr whose caret sits on the delivered `throw error`
itself** (`src/cli.ts:159` — the re-throw is genuinely reached, not dead code); the mutant **exits 0
with empty stderr, having written nothing at all**. 3/3 and then 5/5 on two instruments. **A build
that writes no board and tells the shell `0` is the false-success end of exactly the contract
`ABC-115` was cut to make honest** — worse than the defect being fixed, because `0` is the strongest
claim of success the product can make.

**Why the guard is owed rather than nice-to-have.** `## Risks` on this page already pre-registered
it: *"a hop that widens the arm to every stdout error should say so and price it"* — with no row,
that widening ships **green and silent**, and the next hop to touch the arm gets no signal. This is
`A9`'s case one level down: `A9` exists because a bare-swallow mutant passed every row then, and the
narrowing clause is unasserted now exactly as the ending clause was then.

**THE CEILING: RAISED TO 7 WITH THE REASON, NOT QUIETLY EXCEEDED — and the under-ceiling routes were
priced first.** **`N8-SPAWN` IN FORCE: `<= 7 added children` AND `<= 2.0 s added wall` AND
`<= 0.30 s added CPU (user+sys) PER ADDED CHILD`.** Only the count moves; **the two time clauses are
untouched and are re-measured at the repair hop on the paired-run lane instrument.**

1. **Folding `A10` into an existing child is impossible by construction, and that is measured rather
   than asserted.** The row's whole Given is a stdout that cannot be written to, so the child
   produces **zero capturable stdout** — every existing `CHILDREN` entry asserts on its stdout, so
   none can carry this Given without losing its own row.
2. **Dropping a row to make room is rejected for the third time**, on the rule this page already
   wrote: *a row may only go by a RE-CUT argued on the criterion's own value, never to make a number
   fit.*
3. **The count was again the wrong instrument, and in the opposite direction to last time.** `A9`'s
   child was ~15x an ordinary child in wall; **`A10`'s child is CHEAPER than an ordinary one** — it
   dies at the first write, rendering and capturing nothing: **0.06-0.07 s wall and 0.11-0.12 s CPU
   (user+sys), against 0.07 s / 0.16-0.17 s for a plain child on the same standalone instrument**,
   and against the clause's `<= 0.30 s per added child`. **A seventh child that costs less than the
   first six cannot be the child that breaks a budget the first six met** — the count clause was the
   only thing in the way, and a count that blocks the cheapest child on the page is measuring the
   wrong quantity. The delivered wall was +1.12 s against `<= 2.0 s`; this adds ~0.07 s.

**RESIDUAL, KNOWINGLY ACCEPTED AND NAMED — the non-`EPIPE` path still exits `1`.** On the `EBADF`
probe the delivered build exits **`1`**, which is `USAGE_EXIT_CODE`, so the collision this ticket was
cut for **still exists off the `EPIPE` path**, together with a raw stack that discloses the checkout
path. **This is accepted, not overlooked, and it is NOT a criterion failure:** `## Out of scope` and
`ADR-0016` clause 3 chose *"exactly as today"* for every other errno deliberately, and `A1`/`A2` are
scoped to the `EPIPE`-shaped Given. **`ADR-0016` is NOT re-opened here and no wider arm is proposed.**
**`A10` is written so the residual can be closed later without touching it:** it asserts *non-zero
and non-empty*, never `1`, so a future ticket routing non-`EPIPE` to `70` leaves it green.
**What would make it a cut, pre-registered:** a real non-`EPIPE` stdout failure observed outside a
probe, or any hop or script measured taking a wrong routing decision off this path's `1` — the same
trigger shape as `## Priority`'s `P0` promotion trigger, and it is nobody's silent inheritance.

> **CORRECTION OF RECORD, appended 2026-10-12 by the Software Engineer (`ABC-117`, S7). Not one word
> above is deleted.** The clause it corrects is *"the delivered build exits **`1`**, which is
> `USAGE_EXIT_CODE`"*, in the paragraph directly above. The `1` is real; the mechanism that clause implies is not:
> nothing assigns `USAGE_EXIT_CODE` on this path. The `1` is **Node's default status for an
> unhandled exception**, and only collides with `USAGE_EXIT_CODE`'s value. Re-measured at this hop
> (Node v26.11.0, `main` @ `3537fe48`): `node src/cli.ts 1</dev/null </dev/null` exits `1` with
> Node's banner on the re-throw at `src/cli.ts:160`, **0** `usage:` lines (a refused command line,
> `--nonsense`, prints **1** on the same instrument) and **0** `internal error` lines — so neither the
> `USAGE_EXIT_CODE` arm nor `main`'s `catch` ran. The re-throw fires on a later tick than `main`'s
> `try`, which therefore cannot reach it. Everything else in the paragraph above stands as written:
> the residual stays knowingly accepted, its trigger is unchanged, `A10` is untouched, and this
> correction re-opens nothing. Readings and the out-of-product reproduction:
> `.grugops/context/ticket-to-pr-ABC-117/notes/`.

**NOT MINE AND NOT DONE HERE: `G-QE115-2`** — the superseded `<= 0.5 s CPU` clause and the false
"THE CPU CLAUSE IS BREACHED" sentence left in `src/cli.test.ts` by my own budget ruling. It is a real
defect of mine, it is routed to its own repair hop, and **nothing on this page repairs it**.

**NOT DONE HERE:** `src/` untouched — **not `src/cli.ts`, not `src/cli.test.ts`**, and the mutant
above lived in a throwaway copy outside the repository; the exit code NOT re-opened (`ADR-0016`);
`ADR-0016`, `AGENTS.md` and `plans/nfr-catalog.md` not opened for writing; `NFR-008` NOT graded and
`ABC-108` untouched; **`ABC-115` NOT moved** — it stays in `In Development` until both defects are
repaired, and the move is the Orchestrator's. Nothing merged, nothing deployed, nothing self-signed.
The mutant, the two instruments, the timings and the two probes I rejected are in
`.grugops/context/rule-ABC-115-residuals-2026-08-21/notes/` — **hand-authored and UNSTAMPED**.

## Scope

- **One production file: `src/cli.ts`.** The sink is acquired exactly once in the entry point
  (`src/cli.ts:148`, and `ABC-043` `A9` pins that acquisition), so the entry point is the one place that
  can install a stdout error arm covering **all five** write sites reachable in a session:
  `src/frame.ts:238`, `src/frame.ts:244`, `src/turn-loop.ts:313`, `src/cli.ts:172`,
  `src/line-input.ts:239`. **Nothing under `src/` except `src/cli.ts` changes.**
- **One test file, already spawning the real product: `src/cli.test.ts`.** Zero new test files.
- The pinned spawn budget in that file moves by the children this ticket's criteria force, **and only
  those** (see `## NFR / security`).

## Out of scope

- **Any change to what `0`, `1` or `70` mean, and any FOURTH exit code.** The ruling above chooses among
  codes that already exist; amending the contract is Architect/Design's and the owner's.
- **`ABC-050`'s type-valid `exclude` residual and `G-06`.** Both are real, both are open, neither is
  this ticket's. A hop that believes a site belongs to one of them stops and says so.
- **Re-opening, re-scoring, moving or amending `ABC-043`** (or `ABC-042`/`ABC-044`). Its `A3` and its
  exit-code ruling stay exactly as written; `A4`'s guard on this page (`A4` below) proves they still
  hold rather than editing them.
- **stdin-side and stderr-side pipe failures.** Only the **stdout** consumer is in scope; a closed
  stderr is a different Given and nobody has measured it. Named here so a later hop cuts it rather than
  folding it in.
- **Making the game survive a closed reader and keep playing.** The session ENDS — quietly and with the
  right code. Continuing to play into a dead pipe is a different product decision nobody has asked for.

## Acceptance criteria

- **`A1` (no stack trace, and nothing that claims a bug).** **Given** the delivered entry point run as
  `node src/cli.ts --ascii` with stdout piped to a reader that closes after 2 lines, **when** the child
  exits, **then** its stderr contains **zero** occurrences of `write EPIPE`, **zero** occurrences of
  `Unhandled 'error' event`, **zero** lines matching `/^\s+at /` (no stack frames), **zero** occurrences
  of the repository path, and **zero** occurrences of the `internal error:` line — and its stderr is
  **either empty or ≤ 1 line that names no file path**. *Base for the RED watch — a SHAPE, NEVER A
  CONSTANT, corrected at the 2026-08-20 amendment.* The byte count of that stack is a function of **where the tree is checked out**: re-measured on the
  delivered build at four path lengths, `bytes = 982 + 2 × (characters in the absolute checkout
  path)` — 68 → **1118**, 142 → **1266**, 152 → **1286**, 156 → **1294**; the stack names the path
  exactly twice, so each extra character costs two bytes. **The model also dissolves what looked
  like two disagreements: 1196 (the cut) and 1282 (the design hop) are this same measurement at
  107- and 150-character paths.** **NO TEST MAY ASSERT A BYTE COUNT, and no hop may quote one from
  this page.** The RED watch is the path-independent shape: stderr non-empty and carrying
  `Unhandled 'error' event`, `Error: write EPIPE` and `/^\s+at /` frames. Re-measure the count in
  your own tree for the delivery note; never pin it.
- **`A2` (the exit code, and it survives the ruling being overruled).** **Then** (i) the child's exit
  status is **`0`**; **and** (ii) **independently of (i), and this half binds even if `## Ruling` 4 is
  taken**: the status is **not `1`** (`USAGE_EXIT_CODE`) and **not `70`** (`INTERNAL_ERROR_EXIT_CODE`).
  **Both halves are asserted; (ii) is the half that makes a shell able to tell this from a refused
  command line at all.** The child is **not** killed by a signal (`signal === null`).
- **`A3` (the trigger is the RULE, not one command).** **Then** the guard covers, at minimum, **two
  reader-close points measured on either side of the boundary**: a reader closing at **2 lines**
  (reproduces today) and a reader closing at **23 lines** (the last line before the full 24 — reproduces
  today), plus the **24-line full read** as the control that must stay exit `0` with empty stderr, **on
  both glyph modes** (`--ascii` and the default). *Boundary re-measured at this cut: `head -N` reds for
  `N ≤ 23`, greens for `N ≥ 24`; total output 24 lines.* **The boundary is re-derived at the repair hop
  rather than copied from this page** — the frame height has moved twice this month, and a criterion
  pinned to the literal `23` goes stale silently. **`grep -q` is NOT admissible as the trigger**: it was
  measured 5/5 exit 0 here and would ship a guard that cannot go red.
- **`A4` (the fix does not swallow a real failure — the regression guard on `ABC-043` `A3`).** **Then**
  the delivered build still writes the `internal error:` line and exits **70** for an `InputSeam` that
  throws, and still writes the usage line and exits **1** for a refused command line — **both re-run at
  the repair hop, both from the delivered entry point, and `ABC-043` `A3`'s existing rows stay green
  with zero edits.** A build that reaches `A1`/`A2` by muting stderr or by forcing `process.exitCode = 0`
  globally **fails this criterion**, and that is the cheap wrong fix this row exists to catch.
- **`A5` (watched RED before it ships).** **Then** the new rows are watched failing against the
  **delivered `main` build** (which reds `A1`, `A2`(i) and `A2`(ii) today, measured), and the delivery
  note records the RED output verbatim. A row that has never been seen red is not a guard.
- **`A6` (the fence, checkable from git).** **Then** `git diff --name-only main...HEAD -- src/` lists
  **exactly** `src/cli.ts` and `src/cli.test.ts`; `git diff --numstat main...HEAD -- 'src/' ':!src/cli.ts'
  ':!src/*.test.ts'` is **empty**; and the production diff is **≤ 15 added lines in `src/cli.ts`**. If a
  correct fix cannot fit that, the hop **stops and re-sizes** rather than spreading across modules.
- **`A7` (the lane does not move sideways).** **Then** `npx vitest run --dir src` is green with **40
  test files and 1207 + (new rows) tests, 0 skipped**, and the spawn pin in `src/cli.test.ts:1473` is
  **updated to the exact new count with the derivation written beside it**, exactly as `ABC-043` moved it
  from 10 to 17. *Base measured at this cut on `main` @ `414ef75`: **40 files / 1207 tests / 0 skipped,
  green**, 2.95 s wall / 13.74 s user. **Re-measure at pull time rather than quoting this.***
- **`A8` (the two documents that state the contract are made true again).** **Then** `AGENTS.md`
  `## Development`'s exit-code sentence and `src/cli.ts`'s exit-code docblock **either** still describe
  the delivered behaviour verbatim **or** are amended in the same commit with the change named — and the
  delivery note states which. **Silently leaving a false sentence on `AGENTS.md` is the `ABC-114` defect
  and is a FAIL of this criterion.**
- **`A9` (THE SESSION ENDS — the row that kills the bare swallow, added 2026-08-20 by BA/PM).**
  **Given** the delivered entry point run as `node src/cli.ts --ascii` with **stdin held OPEN** by a
  source that stays open at least `T_open` and supplies, after a settle delay, one line the session
  answers **without an engine search** (measured: `zz`, an unparsable move — it forces a write and no
  search, so the row costs no part of `DEFAULT_BUDGET_MS`), **and** stdout piped to a reader that
  closes after 2 lines **before** that line is supplied, **when** the child is allowed `T_bound`,
  **then** the child **HAS EXITED** within `T_bound` — and it exited with status **`0`**,
  `signal === null`, and **empty stderr**. **`T_bound` must be strictly less than `T_open`**: a row
  whose input source closes first proves only that end-of-input still works, which `A3` already
  covers. The settle delay is **required and re-measured, not copied**: at `T_open = 10 s`,
  `T_bound = 5 s`, a settle of **0.2 s ran 8/8 deterministic on both builds** and **0 s was measured
  FLAKY** (1 of 3 delivered-build runs hung), so use >= 0.5 s and prove 5 consecutive identical runs
  before shipping the row. *Measured at this amendment, one child, `--ascii`: the delivered `main`
  build exits **1** at **1.05 s**; the ruled `process.stdin.destroy()` shape exits **0** at
  **1.05 s**; the `process.exit(0)` fallback exits **0** at **1.05 s**; **the bare swallow NEVER
  EXITS and is killed at the bound, 5/5**.*
  **`A9` DOES NOT GO RED THE WAY THE OTHER ROWS DO, and a hop that reports it as if it did is
  wrong.** Against `main` it reds on its **status** clause only — `main` crashes fast, so it *does*
  end. **The ENDING clause reds against a bare-swallow mutant and against nothing else.** So `A5`'s
  watched-RED round is run **twice** for this row: once against the delivered `main` build, once
  against a one-line mutant (`sink.on("error", e => { if (e.code !== "EPIPE") throw e; })` and
  nothing else), with **both** RED outputs verbatim in the delivery note. **Watching only `main` is
  not watching `A9` red.**
- **`A10` (A REAL WRITE FAILURE IS NOT ABSORBED — the row that kills the widened arm, added
  2026-08-21 by BA/PM).** **Given** the delivered entry point run as `node src/cli.ts --ascii` with a
  **read-only file descriptor handed to it as its stdout**, so that its first frame write fails with
  a genuine errno that is **not** `EPIPE`, **when** the child exits, **then** its exit status is
  **NON-ZERO** **and** its stderr is **NON-EMPTY**. **NOTHING ELSE IS ASSERTED — no status literal,
  no errno name, no byte count, no stack shape — and that is deliberate**: the delivered status here
  is `1`, a collision this ticket neither fixes nor endorses (`## Residual ruling`), so a later
  ticket that routes non-`EPIPE` to `70` must find this row **still green**. The row asserts one
  thing only: the discrimination `ADR-0016` clause 4 states in the imperative — **silence is for the
  reader going away, never for a write that failed.**
  **Instrument, measured at this ruling and NOT a suggestion to re-derive from scratch: a per-command
  fd-1 INPUT redirection inside the single `/bin/sh -c` string `childOf` already spawns — ZERO new
  `spawnSync` call sites**, so `:1480-1485`'s pin stays green:
  `node src/cli.ts --ascii 1</dev/null; echo NODE_EXIT=$?`
  **TRAP, and a row that falls in it is green on every build: read the status from `NODE_EXIT=` on
  stdout, NEVER from the wrapper's own status.** The redirection binds `node` alone, so the
  wrapper's stdout stays capturable and the wrapper exits `0` (`echo`'s status) on the fixed, the
  unfixed and the swallowing build alike. *Measured 5/5 each, plus 3/3 on an independent `spawnSync`
  read-only-fd probe: delivered `NODE_EXIT=1` with 1507 bytes of stderr whose caret is on
  `src/cli.ts:159`; the mutant `sink.on("error", () => { process.stdin.destroy(); })` gives
  `NODE_EXIT=0` with 0 bytes.* **The byte count is a reading, never an assertion** — same rule as
  `A1`.
  **`A10` DOES NOT RED AGAINST `main`, and a hop that reports it as if it did is wrong** — `main`
  installs no arm at all, so it dies loudly on this path and passes `A10` by accident. **It reds
  against the one-token mutant above and against nothing else**, so `A5`'s watched-RED round is run
  against that mutant, with the RED output verbatim in the delivery note — exactly the shape `A9`
  already set.

## Dependencies

- **None blocking. Pullable today.** No open ruling gates the work: `## Ruling` decides the code, and
  `A2`(ii) holds if that ruling is later replaced.
- **Ordering, not a block:** `ABC-114` edits comments in `src/cli.test.ts`; this ticket adds rows to the
  same file and moves its spawn pin. **Whichever runs second re-measures** — neither blocks the other.
- **`ABC-108` is open** (`NFR-008` BREACHED on the CPU clause / UNRULED on wall). That does not block
  this ticket; it blocks any honest `N8-LANE` claim on it (see below).

## Risks

- **The cheap wrong fix is available and green.** A global `process.on('uncaughtException')`, a blanket
  `process.exitCode = 0`, or muting stderr all satisfy `A1`+`A2` and destroy the crash path the whole of
  `ABC-043` `A3` and `[D31]` exist to guarantee. **`A4` is the only thing standing between this ticket
  and that build**, and it is why `A4` is a criterion rather than a test note.
- **A `process.stdout.on("error")` arm can swallow a REAL write failure** (a full disk, a closed
  terminal) as well as `EPIPE`. Mitigation is a criterion-shaped one: `A1` demands silence only on the
  `EPIPE`-shaped path; a hop that widens the arm to every stdout error should say so and price it.
- **The harness is the hard part, and it is measured rather than assumed.** `src/cli.test.ts` captures
  children with `spawnSync` and full output capture, which **cannot** close a reader early — so no
  existing child can reproduce this. **Two shapes were proved to reproduce it at this cut**, both
  recorded in the notes: (a) a `/bin/sh -c 'set -o pipefail; … | head -2'` child routed through the
  file's existing `childOf` helper — **it reproduces (exit 1, `write EPIPE` on stderr) and adds ZERO new
  `spawnSync` call sites**, which matters because `src/cli.test.ts:1480-1485` pins the file to exactly
  one call site and to `spawnSync` as its only `node:child_process` import; and (b) an async `spawn` with
  `child.stdout.destroy()` — also reproduces, but it **reds that pin** and needs the pin's derivation
  rewritten. **Shape (a) is the recommendation and is not mandated**; `pipefail` is a bash/zsh feature
  and `/bin/sh` on this host honours it, so a hop that changes platforms re-measures.
- **The symptom is timing-adjacent near the boundary.** `A3` deliberately samples 2 lines (far from the
  boundary) as well as 23; a guard that only samples the boundary is the flaky one.

## Test notes

- Lane is `npx vitest run --dir src` and **never** the repo root (`AGENTS.md` `## Test notes` 5).
- Mandatory gates: `npm run lint`, `npm run typecheck`, `npm run build`, unit.
- **Extend `src/cli.test.ts`'s existing `childOf` helper; do not add a second `spawnSync` call site** —
  `src/cli.test.ts:1480-1485` asserts that textually and must stay green (`ABC-043` `## Test notes` 5-6,
  inherited).
- **`A9`'s instrument, measured at the amendment — and the second half is the trap.** A child whose
  stdin stays open cannot be built with `spawnSync`'s `input:` (that closes stdin), so stdin comes
  from a FIFO held open by a **detached** writer, inside the **same single `/bin/sh -c` string**
  `childOf` already spawns — **zero new `spawnSync` call sites**:
  `mkfifo $F; ( { sleep 0.5; echo zz; sleep 10; } > $F & ); set -o pipefail; node src/cli.ts --ascii < $F | head -2 >/dev/null; echo NODE_EXIT=$?`
  **NEVER TIME THE PIPELINE — time the child.** A `time` around the whole pipeline reads the
  left-hand side's sleep for every build and makes the fixed, the unfixed and the bare-swallow builds
  look identical (the design hop's notes record that dead end). The shape above avoids the trap by
  construction: `sh` waits only for `node | head`, because the writer is detached — so **the
  wrapper's own exit IS the child's ending**, and the assertion is "did it exit inside `timeout:`",
  not a stopwatch reading. Two consequences to accept out loud: the detached `sleep` **outlives the
  row** as a harmless orphan (bound it, <= 10 s), and the FIFO is the row's to remove. `/bin/sh` on
  this host honours `set -o pipefail`; a hop that changes platform re-measures.
- Every child keeps a `timeout:` bound. A hung child must be a red row, not a stalled lane.
- **Test integrity:** `.grugops/test-skips.md` is human-owned; `quality.test_integrity` is `warn`. Its
  absence is `UNKNOWN - verify` and must not be read as a pass.

## NFR / security

- **NO `N8-LANE` LINE IS CLAIMED, deliberately** — `ABC-108` is open and `NFR-008` is **BREACHED on the
  CPU clause / UNRULED on wall** (re-measured at this cut: **13.74 s user against the 13 s clause**), so
  a 5% slice of a spent total is not a slice. Same posture as `ABC-110`, `ABC-113` and `ABC-114`.
- **`N8-SPAWN`: this ticket's criteria force children, and they are derived rather than estimated** —
  `A3` names **five** (2-line and 23-line close on `--ascii`, the same two on the default glyph mode, and
  the 24-line control), `A4` names **two** (the throwing `InputSeam` and the refused command line) **only
  if `ABC-043`'s existing children cannot be reused — they can, so `A4` should add ZERO**. `A1`, `A2`,
  `A5`–`A8` add none, and **`A9` names ONE** (the open-stdin child) — **six**.
  **CEILING RAISED +5 → +6 BY BA/PM AT THE 2026-08-20 AMENDMENT, WITH THE REASON WRITTEN, NOT
  QUIETLY EXCEEDED. The pin moves 17 → 23**, and a child no criterion names is still a finding
  against the ticket, not a charge on the account.
  **Raised, not absorbed — and the under-ceiling alternative was PRICED (drop `A3`'s default-glyph
  23-line close, saving ~70 ms) and REJECTED**; reasoning in the notes. **The count was the wrong
  instrument**: `A9`'s child measured **real 1.04 s, user 0.14 s, sys 0.02 s** against 64-72 ms for a
  normal child — ~15x in wall, ~2x in CPU, because most of its second is a `sleep`. **So the cap is
  now three clauses, all re-measured at the repair hop: <= 6 added children AND <= 2.0 s added wall
  AND <= 0.5 s added CPU** on `npx vitest run --dir src`. A hop that meets the count and blows a time
  clause has breached this ticket and says so rather than shipping.
  **⚠️ THE `<= 0.5 s added CPU` CLAUSE ON THE LINE ABOVE IS SUPERSEDED — IT WAS ARITHMETICALLY
  IMPOSSIBLE AND IS RE-DERIVED AT THE 2026-08-21 BUDGET RULING BELOW.** It is left standing rather
  than edited away because the `~2x in CPU` phrase three lines up is the evidence of how it broke.
  **THE CLAUSE IN FORCE IS: `<= 6 added children` AND `<= 2.0 s added wall` AND `<= 0.30 s added CPU
  (user+sys) PER ADDED CHILD`** — see `## Budget ruling` below.
  **The wall is routed, not buried:** `A9` adds ~+1.2% of `NFR-008`'s 13 s CPU clause (0.16 s) and
  ~+1 s of wall, **reported to `ABC-108` at the repair hop as a measured contribution** — that lane
  budget is `ABC-108`'s to rule, and this ticket neither rules it nor hides in it.
  **`N8-SPAWN`'s balance is NOT claimed met here** — see the line above.
  **⚠️ THE `<= 6 added children` COUNT ON THIS BULLET IS SUPERSEDED — RAISED TO `<= 7` AT THE
  2026-08-21 RESIDUAL RULING, AND THE PIN MOVES 23 → 24.** It is left standing rather than edited
  away because the `+5 → +6` history above it is the record of how a count clause gets re-derived.
  **THE CLAUSE IN FORCE IS: `<= 7 added children` AND `<= 2.0 s added wall` AND `<= 0.30 s added CPU
  (user+sys) PER ADDED CHILD`** — the two time clauses are UNCHANGED and unaffected; `A10`'s child
  was measured at **0.11-0.12 s CPU and 0.06-0.07 s wall**, cheaper than an ordinary child. The
  seventh child is `A10`'s (the read-only-fd stdout), and the reason it was paid for rather than
  refused is in `## Residual ruling` above.
- **`NFR-002` NOT triggered** — no frame is composed and `src/frame.ts` is untouched. This is an exit
  path, not a latency one.
- **Security: one real, small surface.** The delivered stack trace discloses the **absolute filesystem
  path of the checkout** to whatever captures stderr; `A1` closes that as a side effect and asserts it
  explicitly (*zero occurrences of the repository path*). No input path, no network, no filesystem write,
  no new dependency. ASVS L1: nothing above informational.
- **Falsifiable zeroes:** 0 new test files, 0 new production modules, 0 new dependencies, 0 changes to
  any file under `src/` other than `src/cli.ts` and `src/cli.test.ts`, ≤ 15 added production lines.

## Definition of Ready — 10/10 (was 9/10 ⚠️x1; item 10 closed by `ADR-0016`, 2026-08-20)

| # | check | verdict |
|---|---|---|
| 1 | problem clear (user, pain, value) | ✅ user = anyone piping stdout, incl. every agent that samples this product; pain re-measured today |
| 2 | scope / out-of-scope clear | ✅ one production file named, five write sites named, four exclusions named |
| 3 | INVEST | ✅ independent of every open ticket, one file, one hop, testable at `A1`–`A9` |
| 4 | acceptance testable and measurable | ✅ every criterion is a count, a status, a file list or a **time bound** — `A1` counts stderr occurrences (and **asserts no byte count**, corrected 2026-08-20), `A2` asserts a status twice, `A6` is a `git diff`, `A9` is "exited within `T_bound`" |
| 5 | dependencies known | ✅ none blocking; the `ABC-114` file overlap is named as ordering |
| 6 | security/NFR triggers with measurable targets | ✅ **`N8-SPAWN` ceiling is `+7` since the 2026-08-21 residual ruling (pin 23 → 24, reason on the page); the CPU clause is `<= 0.30 s PER ADDED CHILD` since the 2026-08-21 budget ruling. The cell below is the ORIGINAL wording, kept as the record and superseded by both.** `N8-SPAWN` derived to a **+6 ceiling (raised from +5 at the 2026-08-20 amendment, reason on the page) with TIME clauses beside the count — ≤ 2.0 s wall, ≤ 0.5 s CPU**, `NFR-002` explicitly not triggered, `N8-LANE` explicitly NOT claimed with the reason, path-disclosure closed by `A1` |
| 7 | test notes present | ✅ lane, gates, helper constraint, timeout rule, integrity posture |
| 8 | size assigned | ✅ `S` — argued below |
| 9 | priority assigned | ✅ `P1` — argued below |
| 10 | no major unresolved blocker | ✅ **CLOSED 2026-08-20 by `ADR-0016`, which CONFIRMED the ruling; the ⚠️ below is kept as the record of what it was and is no longer live.** ~~the exit-code ruling is BA/PM's and Architect/Design may overrule it at `In Design`.~~ It is not an *open question* — it is decided, on this page, from the product's own contract — but it is reversible, and `A2` is deliberately shaped in two halves so an overrule changes **one literal** and re-argues nothing. **This does not stop the ticket being pulled today.** |

## Sizing — `S`, and the comparables are named

**Not `XS`.** `ABC-112` is the `XS` on this board: one message, one existing test file, no new harness
shape. This ticket needs a **harness shape the file does not have** (a child whose reader closes early —
proved necessary here, because `spawnSync` with full capture cannot reproduce it), a **pinned spawn count
re-derived**, a **watched-RED round**, and **production lines in the entry point**.

**Not `M`.** One production file, one test file, ≤ 15 added production lines, no design ruling owed (the
ruling is on this page), no owner escalation, no coverage re-homing, no new module. `ABC-107` is the `M`
comparable and it is unruled by construction; this one is not.

**`S`, against `ABC-114` (`S`) as the nearest neighbour**: comparable measurement burden, smaller edit
surface, but it carries production lines where `ABC-114` carries none.

**Re-size trigger:** `XS` if Architect/Design rules the arm's shape at `In Design` and the guard collapses
to one child. **`SPLIT_REQUIRED` is NOT raised** — nothing here is `XL`.

## Priority — `P1`, and QE recommended `P2`

**The QE/E2E note recommends `P2`. I am moving it to `P1` and the argument is here rather than in a
note**, so a later hop can overturn it on the same terms:

1. **It is a REGRESSION on `main` today, not a never-worked gap.** `54cbb23` exits 0 on the same command
   line; `414ef75` exits 1 with a stack. Re-measured at this cut, not cited.
2. **It breaks a contract this project WROTE DOWN in two places** — `AGENTS.md` `## Development` and
   `src/cli.ts:109-115` — and the collision it creates was measured today: a refused command line and a
   crashed pipe both exit `1`, which is precisely what `70` exists to prevent.
3. **The board's own `P1` precedent is `ABC-112`: *the product tells the player something false*.** This
   path tells the player two false things at once — a stack trace claiming a crash where no bug occurred,
   and an exit code claiming a refused command line where nothing was refused.

**NOT `P0`:** nothing is blocked, no gate is wrong, no test is lying, and the ordinary terminal path is
unaffected — the player who never pipes never sees it.
**NOT `P2`:** it is on `main`, it is a regression, and the wrong exit code is the kind of defect that gets
built on (any script or agent branching on this product's exit status is already reading a false answer).

**`P0` promotion trigger, pre-registered:** any hop, gate or script measured taking a wrong routing
decision off this exit code, or the same unhandled-`error` shape found on a second stream.
**`P2` demotion trigger:** Architect/Design ruling the closed-reader path an **accepted risk** with a named
owner and a dated word — never on an agent deciding it is moot.

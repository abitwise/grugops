# Progress
_Updated: 2026-08-06 by the Orchestrator (task `refinement-deploy-posture-2026-08-06`, Workflow 07) — **THE DEPLOYMENT POSTURE IS WRITTEN DOWN: THIS PROJECT DEPLOYS NOWHERE AND RUNS LOCALLY.** The owner: *"this project currently does not deploy anywhere, mark that as well, it will be used locally for now."* **"Currently" and "for now" are load-bearing and are honoured — present posture, explicitly revisitable, revisit trigger `EPIC-006`.** A standing-fact section below carries the quote, the reading, and the limits that did NOT move. **Unlike the branching model, the config COULD carry this and now does** — `default_stack.deploy` `kubernetes-ready` → `none-local-only`, `environments` `["dev","staging","prod"]` → `["local"]`, `nfr.availability` `99.9%` → not-applicable — three key contracts each verified in the kit's config reference BEFORE editing. **`production_requires_human_confirmation` stays `true`, every never-deploy limit stands, and no release machinery was deleted.** The absence was **measured, not assumed**: no Dockerfile, no YAML of any kind, no CI, no git remote, no `bin`/`main`/`exports`, no entry module, `plans/releases/` empty. **`ADR-0007` is new and `accepted`** (six clauses, five rejected alternatives, seven falsifiers) and **`memory-bank/70-runbook.md` is filled for the first time** — deliberately carrying NO command, because there is still no way to run the game. Security/NFR ruled the availability bar **retired rather than unmeasured** — it was never in `plans/nfr-catalog.md` at all, only an unadopted bootstrap default — parked with an owner and a named trigger, `PASS_WITH_RISKS`, no required fix. **Six untrue-default and two-documents-disagree items were FLAGGED, NOT FIXED, each with an owner** (see "Open questions nobody has ruled on"); the loudest is `EPIC-006` naming `npx` in four places while `ADR-0007` records distribution UNDECIDED. No ticket cut, no board column moved, no production code changed, nothing deployed. Previously the same day by the Orchestrator (task `ticket-to-pr-ABC-012`, Workflow 04) — **THE BRANCHING MODEL CHANGED AND `ABC-012` IS MERGED AND `Done`.** The owner made merge approval **standing** (*"everything merges to main in this project, set it as branching model and i approve your merges"*), retiring the per-merge-instruction rule recorded on every previous merge in this project. A new standing-directive section below carries the quote, its reading, and **three limits that did NOT move: deploy is not included, the gate still binds, and the authority remains the owner's and is revocable.** **The config was deliberately NOT edited and that is a finding: `autonomy` allows only `diff`/`branch`/`pr` and there is no value meaning "agents may merge"** — inventing one would be a dial nothing reads. `ABC-012` merged by fast-forward `39e260d` → `7355b51`, 8 commits, no merge commit; gates run on the tip and **again on `main`** — 226/226, skip 0, lint + typecheck + build exit 0. It is the **first merge under the new model**. Three gates PASS: QE killed 21 mutants of which **three survived the delivered suite** (all `resetTo` field-copy holes, all hidden because every acceptance test anchored at startpos and took back at **even** ply counts), and Security/NFR **re-measured all six NFR bars independently**, meeting every one at 0.09x–0.67x. Five accepted risks, each owned; no required fix. UAT deferred → `EPIC-006` — **now the only human checkpoint left before code lands, which is flagged for revisit when a runnable game exists.** **Nothing deployed; a human still holds deploy. No branch was deleted — that call is put back to the owner.** Previously 2026-08-04 by BA/PM (task `refinement-2026-08-04`, subtask `ba-pm-generator-defect-and-abc014-knot`, Workflow 07) — **both unowned items are closed and the pull order is fixed: `ABC-012` → `ABC-014` → `ABC-009` → `ABC-022` → `ABC-013`.** **`ABC-022` CUT** (`S`, `P1`, `EPIC-001`, straight to `Ready`) for the `generateMoves` en-passant precondition defect — **reproduced by this role before cutting**, not accepted from the three roles that described it and cut none, and the reproduction found three things none of them said: the shape is **piece-agnostic** (a rook reproduces it, not only the two knight FENs on record); the branch carries **two** defects, and the unrouted one makes **`legalMoves` permanently corrupt its argument**; and **the legality filter does NOT reject the over-offered move** — perft is silent because the trigger population is empty (**0 of 518,474 reachable nodes**), not because the filter absorbs it, which means **no perft depth or added position can ever reach this defect**. **`ABC-011`'s guard (a) is confirmed NOT deletable, and more strongly than QE put it:** deleting it makes the predicate answer `true` on **both** classes, because `hasLegalEnPassant` synthesises its probe and never consults the generator. **`ABC-022` is `P1`, not `P0`, so it does NOT precede `ABC-012`** — the open conditional, answered on this board's own P0 test. **The `ABC-015`/`ABC-014`/`RISK-005` knot is UNTIED and `ABC-014` is pullable:** `ABC-015`'s wording was the wrong one and the constraint binds at **`ABC-018`**, corrected in place in four files. `Ready` 4/8 → 5/8; no limit approached, no override taken. **Nothing merged, nothing deployed, no production code changed.** Previously 2026-08-04 by the Orchestrator (task `ticket-to-pr-ABC-011`, Workflow 04) — **ABC-011 is MERGED to `main` and `Done`.** Fast-forward `4a73cf3` → `d3efba6`, 16 commits, no merge commit; gates run before the merge on the tip and again **after it on `main`** — 214/214, skip count 0, lint + typecheck + build exit 0. Merge performed by an agent on **explicit human instruction**, which is **not standing authorization**; the branch was not deleted. UAT deferred → EPIC-006. The **"Next action"** section is rewritten: two unowned items go to BA/PM **before** the next pull, because one of them is a move-generation legality defect that may outrank `ABC-012` under the owner's standing directive. Previously 2026-08-03 by Architect/Design (task `ticket-to-pr-ABC-011`, subtask `architect-abc011-defect-definition-and-ratify`, Workflow 04) — **ABC-011's SECOND design hop is closed and the ticket is back in `Ready for Dev`.** Three things were owed and all three are ruled. **(1) The MEDIUM defect's definition question: purity is UNCONDITIONAL and is bought with a PRECONDITION on the probe move, not with a change to what the predicate means; the answer stays domain-restricted and is SPECIFIED (`false`, touching nothing) where the board contradicts the ep square, because the ruled oracle is demonstrably unsound there — `generateMoves` corrupts on two of QE's three FENs and offers a pawn capturing onto the mover's own knight on a third.** Two guards, not one: the captured-pawn guard buys purity and closes a **fourth** reproduction no prior role had; the empty-target guard buys oracle agreement and is needed only for two **pure** divergences constructed at this hop. Re-derived on a fourth independent script: 518,474 nodes / 81,397 ep-set, **0** answers changed, **0** keys changed, **0** guard firings on the reachable population; 193/193 green in a sandbox with no existing test edited. **(2) Castling is NOT the en-passant case** — `zobristKey` keeps hashing castling **rights**, ruled in **`ADR-0006`** from the retained FIDE text whose sha256 **and currency** were both re-verified that day. **(3) `ADR-0005` is `accepted` WITH AN AMENDMENT** (one of its statements was false as written) and **`ADR-0006` is new and `accepted`** — the first ADRs ratified under the owner's standing directive of 2026-08-03, both carrying per-clause falsifier tables. Board: `Ready for UAT` 1/4 → 0/4, `In Design` 0/2 → 1/2 → 0/2, `Ready for Dev` 0/6 → 1/6; no limit approached, no override taken. **No production code changed**, size stays `M`, and one item (`generateMoves` offering a capture onto the mover's own piece) is **routed to BA/PM rather than cut here**. Previously 2026-08-02 by Architect/Design (task `ticket-to-pr-ABC-011`, Workflow 04) — **ABC-011's first design hop is closed: "an en-passant capture is available" is ruled to mean a LEGAL one (strict FIDE 9.2.3), the predicate is homed in `src/legal.ts` with `src/zobrist.ts` importing it, the ticket is re-sized `S` → `M` and not split, and it sits in `Ready for Dev`.** `ADR-0002` is extended around and NOT amended (no human ruling owed, none taken); **`ADR-0005` is written and is `proposed` — no agent may accept it, and ABC-011 is not blocked on it.** Board: `Ready` 5/8 → 4/8, `In Design` 0/2 → 1/2 → 0/2, `Ready for Dev` 0/6 → 1/6; no limit approached, no override taken. No production code changed. Previously the same day by BA/PM (task `refinement-fide-9-6-1`, Workflow 07) — **open question 1 CLOSED: FIDE 9.6.1 does NOT say "consecutive" and `src/gameend.ts` conforms**, ruled against the Laws text retrieved by this role from `handbook.fide.com` and retained verbatim under the task's context folder. No ticket cut, no board move (`Ready` stays 5/8), no code change owed on `main`. The "Next action" section is re-pointed accordingly. Previously the same day by the Orchestrator (ABC-020 merged to `main` on explicit owner instruction; branch stack resolved, board closed). Earlier the same day: first fill of this file, which had been the shipped empty template while the project ran to 27 unmerged commits._

<!--
  The running plan-of-record. Read this FIRST on start, then `plans/board.md`. Keep it short and
  current; it is an orientation file, not a document dump. The detail lives in the files it points
  at — `plans/board.md` (WIP truth), `plans/traceability.md` (the trail), `.grugops/context/<task>/notes/`
  (verified context), `memory-bank/50-decisions/` (ADRs).
-->

## Standing rulings — six owner decisions taken in session, 2026-09-19. **Verbatim in the note; this is the pointer.**

**Project owner Olger Oeselg, 2026-09-19**, answering six numbered questions, quoted verbatim:

> *"1. git clone + npm start works for now ; 2. i don't have preferred source, we can research that ; 3. raise to 15s for now ; relax to "ep swuare set" ; 5. b, resign should be separate ; 6. implement best guess for now"*

The reading of each clause, its bound, and what it does NOT decide is in
`.grugops/context/owner-rulings-2026-09-19/notes/20260919T100000Z-orchestrator-decision-six-owner-rulings-verbatim-3c9e1f42.md`.
In one line each: **(1)** `ABC-100` channel = `git clone` + `npm start`, supersedes `ADR-0007` clause 5 only;
**(2)** `ABC-092` research authorised, ratification still owed; **(3)** `NFR-008` CPU level 13 s → 15 s, wall clause untouched, no file changes lane;
**(4)** `ABC-075` ep hash component = "ep square set", supersedes `ADR-0005`'s legal-capture clause, threading still Architect/Design's;
**(5)** `ABC-046` shape (b) — a real `quit` arm; `resign` (`ABC-045`) stays separate; **(6)** `ABC-107` Architect/Design picks and implements the best option.
**Same day, after the six hops landed, two more sentences from the owner, verbatim:** *"1. you can merge ; 2. I ratify ADR-0023: the opening-book source is lichess-org/chess-openings under CC0 1.0. ; 3. i approve that you move board"* — the merge of the six ruling branches, `ADR-0023`'s `accepted` status and `RISK-004`'s resolution, and the six board moves in `plans/board.md`'s 2026-09-19 header all rest on that sentence.

**Later the same day, three more words in one sentence, verbatim:** *"I accept ADR-0024 ; ABC-034 accepted ; merge cut-050"* (Olger Oeselg, 2026-09-19) — `ADR-0024` (quiescence cost measured; captures ordered inside quiescence; `A5` re-levelled) is ACCEPTED; `ABC-034` is `Done` on the owner's signature (no agent-run UAT pack); `grugops/cut-050-exclude-and-g06` (`ABC-118`, `ABC-119`) is merged.

Carried by six subtasks under `.grugops/queue/` (`ruling-abc100-…`, `research-abc092-…`, `ruling-abc110-…`, `ruling-abc075-…`, `ruling-abc046-…`, `ruling-abc107-…`), ADR ids pre-assigned `ADR-0018`…`ADR-0023` to avoid a parallel-numbering collision.

## Standing directive — the branching model, and who turns the merge key. **This supersedes "a merge needs its own explicit instruction".**

**Project owner Olger Oeselg, 2026-08-06**, quoted verbatim:

> *"everything merges to main in this project, set it as branching model and i approve your merges"*

**This is standing and it is a governance change, not a one-off.** Until this date, every merge in
this project's history was recorded with the same sentence — *performed by an agent on explicit human
instruction and NOT standing authorization* — on `ABC-001/002/003/008`, the `ABC-004..007` stack,
`ABC-020`, `ABC-011` and `grugops/refinement-2026-08-04`. **That rule is retired by the owner.** The
first merge under the new one is `ABC-012` (`39e260d` → `7355b51`, 2026-08-06).

**How this is read, stated explicitly so a later reader can check the reading rather than inherit
it.** Two separate things were granted in one sentence and they are recorded separately:

- **The branching model is trunk-based.** `main` is the single long-lived branch. Work happens on a
  short-lived `grugops/<task>` branch — *not* as a formality, but because the branch is the only
  place a gate can run **red** without `main` ever being red — and it merges to `main` as soon as it
  is green. **No `develop`, no release branches, no long-lived feature branches.** The full rule
  belongs in `AGENTS.md` and is the AGENTS.md Scribe's to write; this entry is the authority it
  cites, not the specification.
- **The merge keystroke is delegated, standing and revocable.** An agent may merge gated work to
  `main` without asking each time.

**THREE LIMITS ARE UNCHANGED. They are named here because a grant that is not bounded in writing
gets read wider than it was given.**

1. **DEPLOY IS NOT INCLUDED.** The owner wrote *merges*. `production_requires_human_confirmation`
   stays `true`, and merge approval is **not** rounded up to deploy approval. A human holds deploy.
2. **THE GATE STILL BINDS.** This is approval to merge work that has **passed**, never approval to
   skip, soften or self-certify a gate. `quality.gate_enforcement` is `blocking`, and the standing
   practice holds: **run the gates on the branch tip before the merge and again on `main` after it**,
   and record both. A red gate is still a stop, and the owner did not authorize otherwise.
3. **THE AUTHORITY IS STILL THE OWNER'S.** What was delegated is the keystroke, not the right. One
   sentence revokes it. An agent that merges is exercising the owner's standing decision, not its own.

**THE CONFIG WAS DELIBERATELY NOT EDITED, and that is a finding rather than an omission.** The
`autonomy` dial allows only `diff` / `branch` / `pr`, and the kit defines `pr` as *"branch + open a
PR (agents never merge)"*. **There is no value that expresses "agents may merge", and there is no
`branching_model` key.** Inventing either would place a control in the one file every role reads
first that **nothing reads and nothing enforces** — a fake dial, and exactly the
two-documents-disagree failure this project spent 2026-08-04 untying out of `ABC-015`. `autonomy`
stays `pr` because it still describes accurately how work is **produced** (branch, then gate); what
the owner changed is what happens **after** the gate is green, which `autonomy` does not describe.
**So this file is the authority, and any reader who finds `autonomy: "pr"` and concludes agents may
not merge should read this section — it is newer and it is the owner's.**

**ONE CONSEQUENCE THE OWNER SHOULD SEE, recorded rather than buried.** UAT has been deferred to
`EPIC-006` on every ticket this project has shipped, because no runnable game exists. With the merge
checkpoint delegated, **there is now no human checkpoint between an agent's work and `main`** — the
gates are agents too. That is a reasonable trade while the product has no user-facing surface, and it
is the owner's to make. **It should be revisited when `EPIC-006` produces something a human can
actually exercise**, which is the first moment a human look before merge would buy anything.

**ONE QUESTION WAS PUT BACK TO THE OWNER RATHER THAN DECIDED: are merged branches now deleted?**
Deleting them is ordinarily part of a trunk-based model, but *"everything merges to main"* is a
statement about **destination, not cleanup**, and the owner has twice held that call personally
(2026-08-02, when eight branches were deleted after per-branch validation, and on every merge since).
**Nothing has been deleted.** Three branches are fully contained in `main`:
`grugops/ticket-to-pr-ABC-011`, `grugops/refinement-2026-08-04`, `grugops/ticket-to-pr-ABC-012`.

---
phase: 32-board-projector-cli-dashboard
plan: 09
subsystem: infra
tags: [typescript, node-fs, error-handling, utf-8, textdecoder, board-projector]

# Dependency graph
requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "the read seam (32-03), the join and conflict set (32-05), the CLI renderer (32-07)"
provides:
  - "A three-armed `BoundedListing`: only ENOENT is `absent`; every other errno reaches a badge and a `readErrors` entry."
  - "`PRESENCE_DEPENDENT_CONFLICT_KINDS` — the two conflict kinds whose derivation needs a complete `plans/tickets/` listing, gated on an `ok` tickets source."
  - "`unreadableSources` — the one authority that tells an `unavailable`-because-the-read-failed source from a legitimately absent one, read by both the header badge and the top-level discriminant."
  - "A `partial` `SourceOutcome` arm: a per-entry read failure degrades its whole source while still carrying what was read."
  - "A tear detector that compares bytes and decodes afterwards; a non-decodable file is `unreadable`/`ENCODING` on one read."
  - "A catch-clause census derived from `scripts/board-read.ts` by AST, pinned two-sided at zero value-discarding clauses."
affects: [32-10, board-projector, verification]

actuals:
  tokens: 29778
  tasks: 3
  commits: 7
plan_head_before: 7fa737e7f9ef3cf1a65b666bd103e1deaaa74b81

tech-stack:
  added: []
  patterns:
    - "Three-armed discriminated listing result, mirroring `SourceOutcome`, so a failure cannot be reported as an absence"
    - "Derive-the-set-and-assert-the-count applied to catch clauses: a swallow added to the read seam is a decision somebody records"
    - "Read raw bytes, compare bytes, decode after agreement — a size comparison never sees a decoded length"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-09-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-09-GREEN-proof.txt
    - .planning/phases/32-board-projector-cli-dashboard/deferred-items.md
  modified:
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-read.test.ts
    - scripts/board-model.test.ts
    - scripts/board-tracer.test.ts
    - agent-factory/contracts/board.md

key-decisions:
  - "Only ENOENT means absent. EACCES/EPERM yield reason `eacces`; every other errno yields `unreadable` carrying the errno as its code — the DEFAULT arm, not a three-member allowlist."
  - "`row-without-file` and `ticket-unplaced` are gated on an `ok` tickets source; the other five conflict kinds are not, and the complement is derived from the two sets in a test rather than typed out."
  - "No `SCHEMA_VERSION` bump and no sixth stale reason: a decode failure is the already-published `unreadable` with a new CODE (`ENCODING`), and an unavailable-because-unreadable source is told apart from an absent one through `readErrors`, which D-13 already names as the place that difference survives."
  - "`ignoreBOM: true` on the decoder, because `TextDecoder` strips a leading BOM by default and Node's utf8 file read does not — without it the fix would have silently rewritten the first line of every BOM-carrying board."
  - "A per-ENTRY read failure degrades its whole source (`partial`), in all three directory sources — found by adversarially re-running the verifier's reproduction against the first fix."
  - "A REFUSED document (ticket grammar, tampered claim record) does NOT degrade its source: those bytes were read and declined by name, which is the contract's stated behaviour."

patterns-established:
  - "Adversarial re-run as a task step: re-run the verifier's own reproduction against the fix with one variable moved, before claiming closure"
  - "Record the RED transcript as a committed artifact beside the GREEN one, so the defect and its closure are both readable without a checkout"

requirements-completed: [DASH-03, DASH-04, DASH-05]

coverage:
  - id: D1
    description: "An EACCES on `plans/tickets/` makes the tickets source visibly not-`ok`: a stale badge naming `tickets` in the plain-text header, and a `readErrors` entry whose `code` is the errno."
    requirement: "DASH-04"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#reports the tickets source as anything but `ok`"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#carries exactly one `readErrors` entry for tickets, and it names the errno"
        status: pass
      - kind: e2e
        ref: "node scripts/board-dashboard.js <tree> --once (transcript in 32-09-GREEN-proof.txt)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No `row-without-file` and no `ticket-unplaced` conflict is derived while `sources.tickets` is anything other than `ok`; the fabricated-conflict count for the EACCES reproduction is zero."
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#derives ZERO presence-dependent conflicts about files it could not list"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#derives NEITHER gated kind when the tickets source is stale with reason `eacces`"
        status: pass
      - kind: e2e
        ref: "node scripts/board-dashboard.js <tree> --once --json | jq '[.conflicts[] | select(.kind == \"row-without-file\")] | length' => 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "A legitimately absent `.grugops/` still renders as absent with NO badge and NO readErrors entry (D-13 is not regressed)."
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#reports NO error and NO stale source for a tree with no `.grugops/` at all"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#keeps today's answer for an ABSENT claimed stage under a PRESENT queue (D-13)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A board file carrying one non-UTF-8 byte is reported as `unreadable` with code `ENCODING`, on one read, never as `torn`."
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#reports reason `unreadable` with code `ENCODING`, not a torn read"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#reads the file EXACTLY ONCE — a decode failure is not retried"
        status: pass
    human_judgment: false
  - id: D5
    description: "A real concurrent modification, driven through the `betweenReadAndStat` seam, still reports `torn` after the retry bound; ASCII, multi-byte, CRLF and BOM boards round-trip byte for byte."
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#STILL reports `torn` for a file that is genuinely modified under every read"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#KEEPS a leading UTF-8 BOM in the returned text (`ignoreBOM: true` is load-bearing)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The swallow census is derived from the read seam by AST and pinned two-sided at zero value-discarding catch clauses, with a planted-probe discrimination."
    requirement: "DASH-04"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#pins the value-discarding catch count two-sided"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#PREMISE: the census detects a planted swallow of BOTH shapes"
        status: pass
    human_judgment: false
  - id: D7
    description: "`agent-factory/contracts/board.md` states the torn-vs-undecodable distinction and the presence-dependence rule before the behaviour is relied upon."
    verification: []
    human_judgment: true
    rationale: "Contract prose is a normative statement whose adequacy — does it say the rule in the contract's own register, and does it say it clearly enough for the next reader — is a human judgment no test asserts."

# Metrics
duration: 38 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 09: Unreadable-directory and tear-detector gap closure Summary

**A directory the projector cannot list now reaches the stale badge instead of producing a clean `[ok]` header with seven fabricated `row-without-file` findings, and a file carrying one non-UTF-8 byte is `unreadable`/`ENCODING` on one read instead of `torn` forever.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-09-14T19:59:00Z
- **Completed:** 2026-09-14T20:37:14Z
- **Tasks:** 3
- **Files modified:** 13 (10 modified, 3 created)

## Accomplishments

- **CR-02 closed.** `listDirectoryBounded` no longer discards the errno. `BoundedListing` is a three-armed discriminated union; only ENOENT is `absent`. All three directory sources (tickets, queue, context) route all three arms, so a denied `plans/tickets/`, a denied `.grugops/queue/claimed` and a denied `.grugops/context` each produce a badge and a `readErrors` entry naming the errno.
- **The fabrication is gated at the join.** `PRESENCE_DEPENDENT_CONFLICT_KINDS` names the two conflict kinds that assert something about a complete `plans/tickets/` listing; `joinSnapshot` refuses to derive either while the tickets source is not `ok`. The other five are untouched, and the complement is derived from the two sets in a test with a two-sided pin.
- **CR-03 closed.** `readVerifyReread` reads raw bytes, compares three byte counts, and decodes afterwards through `TextDecoder("utf-8", { fatal: true, ignoreBOM: true })`. A decode failure is `unreadable`/`ENCODING` on the first read — no retry, so the per-refresh cost of 3 reads and 6 stats per source is gone. A driven tear still reports `torn` after the retry bound.
- **The same defect one register down was found and closed.** Re-running the verifier's own reproduction against the first fix, with the directory readable and ONE ticket file at mode 000, reproduced it intact. `SourceOutcome` gained a `partial` arm and all three directory sources settle it on a per-entry read failure.
- **The swallow class is now measured, not remembered.** A test parses `scripts/board-read.ts` with the `typescript` package, counts catch clauses that discard the caught value (no binding, or a binding never read), and pins the count at zero — with a planted three-clause probe proving the predicate can say yes.
- **The contract was amended first.** `agent-factory/contracts/board.md` states the torn-vs-undecodable distinction under § Staleness and the presence-dependence rule under § Conflicts.

## Task Commits

1. **Task 1 (tracer): end-to-end EACCES slice** — `9a8cac6d` (fix)
2. **Task 2 RED: swallow census + remaining listing consumers** — `9f143cec` (test)
3. **Task 2 GREEN: queue, context and the named-errno stat** — `6eaecfcb` (feat)
4. **Task 3 RED: the non-UTF-8 byte reported as torn** — `c5285f36` (test)
5. **Task 3 GREEN: byte comparison, decode after agreement, contract** — `b174467d` (fix)
6. **Adversarial re-run: per-entry read failure degrades its source** — `a060a8a4` (fix)
7. **GREEN proof and deferred item** — `4157f107` (docs)

**Plan metadata:** this SUMMARY's own commit.

## Files Created/Modified

- `scripts/board-read.ts` / `.js` — three-armed `BoundedListing`, `listingFailure`, `partial` outcome arm, `unreadableSources`, byte-first `readVerifyReread`, named-errno context stat
- `scripts/board-model.ts` / `.js` — `PRESENCE_DEPENDENT_CONFLICT_KINDS` and the `ticketsListingComplete` gate in `joinSnapshot`
- `scripts/board-dashboard.ts` / `.js` — the header badge also names sources that are unavailable *because a read failed*, through the read seam's own authority
- `scripts/board-read.test.ts` — +19 cases: the EACCES slice, the AST census, the queue/context arms, the legitimate-input probes, the encoding/tear discrimination, the per-entry probe
- `scripts/board-model.test.ts` — the presence-dependent split, the gating behaviour, and the golden-invariance premise
- `scripts/board-tracer.test.ts` — the two `listDirectoryBounded` cases moved to the discriminated shape, both assertions preserved in meaning
- `agent-factory/contracts/board.md` — § Staleness and § Conflicts amendments
- `.planning/phases/32-board-projector-cli-dashboard/32-09-RED-baseline.txt` / `32-09-GREEN-proof.txt` — the recorded reproductions

## Decisions Made

See `key-decisions` in the frontmatter. The two that were not in the plan:

- **The header badge had to learn a second arm.** The plan assumed a failed tickets read would settle `stale`. It settles `stale` only when there is a previous good value to carry; on a FIRST read it settles `unavailable`, which at the published shape is indistinguishable from a legitimately absent source — so the header still printed `[ok]` with no badge. Fixing that inside `SourceState` would mean a new arm, a `SCHEMA_VERSION` bump and a regenerated golden. It did not need one: `unreadableSources` reads the `readErrors` entry, which D-13 already names as the only place that difference survives, and both the badge and the top-level discriminant read that one function.
- **A per-entry read failure degrades its whole source.** Not in the plan; found by the adversarial re-run (below).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] The plan's own truth #1 was unmet after the planned fix**
- **Found during:** Task 1, running the acceptance criterion `--once` transcript
- **Issue:** A failed tickets read with no previous value settles `unavailable`, the same arm a legitimately absent source uses. The header therefore printed `[ok]` with no stale badge — the plan's must-have truth #1 requires a badge naming `tickets`.
- **Fix:** Added `unreadableSources` to `scripts/board-read.ts` (the sources that are `unavailable` AND produced a `readErrors` entry), read by both `deriveOverallSource` and the header badge in `scripts/board-dashboard.ts`.
- **Files modified:** `scripts/board-read.ts`, `scripts/board-dashboard.ts` (+ `.js`) — `board-dashboard.ts` was not in the plan's `files_modified`
- **Verification:** `node scripts/board-dashboard.js <tree> --once` prints `[stale]  STALE: tickets (never read, EACCES)`; the golden is byte-identical because every fixture source reads `ok`.
- **Committed in:** `9a8cac6d`

**2. [Rule 1 — Bug] The same defect survived one register down**
- **Found during:** the adversarial re-run after Task 3, per this repository's recorded lesson that the fix creates the next bypass
- **Issue:** With `plans/tickets/` readable and ONE ticket file at mode 000, the source read `ok`, the presence gate never fired, and the projector again reported `row-without-file` for a file that exists.
- **Fix:** A `partial` arm on `SourceOutcome`; the tickets, queue and context readers settle it on a per-entry read failure, carrying what they read. A refused document explicitly does not trigger it, and both discriminations are pinned by cases.
- **Files modified:** `scripts/board-read.ts` (+ `.js`), `scripts/board-read.test.ts`
- **Verification:** the probe transcript in `32-09-GREEN-proof.txt`, before and after; four new cases.
- **Committed in:** `a060a8a4`

**3. [Rule 3 — Blocking] `scripts/board-tracer.test.ts` had to move in Task 1, not Task 2**
- **Found during:** Task 1, `npm run typecheck`
- **Issue:** The plan assigned the two `listDirectoryBounded` call sites to Task 2, but Task 1's own verify runs `npm run typecheck`, which fails on them the moment the type changes.
- **Fix:** Updated both cases in Task 1, preserving what each measures and asserting the arm by name.
- **Committed in:** `9a8cac6d`

**4. [Rule 3 — Blocking] An existing structural case pinned the old comparison**
- **Found during:** Task 3
- **Issue:** `keeps BOTH halves of the agreement test` asserted `Buffer.byteLength` appears in `readVerifyReread` — the exact spelling the fix removes.
- **Fix:** Re-pinned to `bytes.byteLength` AND asserted `byteLength(text` absent, so restoring CR-03 cannot satisfy it. The case is stronger than before, not weaker.
- **Committed in:** `b174467d`

### Documented departures from the plan's literal wording

- **The RED baseline's `readErrors` is not empty.** Task 1's acceptance criterion says it should be. On a faithful copy of `scripts/fixtures/board-snapshot/` it carries one pre-existing entry: the fixture's own deliberately tampered claim record, unrelated to this defect and present before and after. The substantive claim — no entry for the tickets permission failure — is measured with `select(.source == "tickets")` and is 0 before, 1 after. Recorded in the baseline itself rather than smoothed over.
- **The census pin is 0, not the plan's "measured starting point is two".** One of the two clauses (the listing's) was fixed in Task 1, so Task 2 met one and removed it.
- **`gsd-tools check tdd-red-evidence` returns `INVALID_RED (zero_tests_discovered)`** for both RED phases. The verb parses node:test's summary footer and this repository runs vitest, so the format never matches; `workflow.tdd_mode` is `false` here and the gate is not mandated. The RED is evidenced by the named target cases failing on behaviour assertions (4 in Task 2, 2 in Task 3, with all sibling cases passing) and by the committed RED transcripts.

---

**Total deviations:** 4 auto-fixed (2 Rule 1, 2 Rule 3), 3 wording departures recorded.
**Impact on plan:** Both Rule 1 fixes were necessary for the plan's own stated truths — one for truth #1, one for truth #2 at a narrower radius. No scope creep: nothing outside the read seam, the join's two gated arms, the header badge and their tests changed.

## Issues Encountered

- **`npx vitest run --exclude '**/scripts/e2e/**'` (the plan's verification step 5) reports 2 failures, both PRE-EXISTING and unrelated.** `scripts/check-nul-bytes.test.ts` fails because `.planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md` carries a literal ESC (0x1b) at line 404. Verified pre-existing rather than assumed: introduced by commit `730ff88f`, present at `7fa737e7` (this plan's base). Recorded in `deferred-items.md` and in `.planning/WINDOWS.md` rather than fixed — a pre-existing failure in an unrelated file is out of scope, and rewriting a verification artifact's bytes from an unrelated fix is a worse outcome than reporting it. **4,720 tests pass, 2 skipped.** Every board suite is green (362 tests across 8 files).

## Known Residuals

Stated here rather than left for the next verifier to find:

- **A REFUSED ticket document still contributes a `row-without-file` conflict** for a row naming it, because the source stays `ok` and the record is not joined. That is the contract's documented behaviour for an inadmissible document (§ Tickets), not a read failure; changing it is a contract decision rather than a bug fix. Deliberately out of this plan's scope and pinned by a discrimination case so it cannot drift silently.
- **CR-01, CR-04, CR-05 and CR-06** from `32-REVIEW.md` are other plans' work (32-10 onward). Nothing here touches them; in particular the symlink containment gap (CR-04) is untouched, and this plan is a stated dependency of 32-10.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 32-10 can proceed: this plan's threat register records CR-04 (symlink content disclosure through `readErrors[].message`) as `accept (this plan)` and names 32-10 as its mitigation, and nothing here narrowed the surface 32-10 must fix.
- `REQUIREMENTS.md` and the ROADMAP phase status are NOT flipped to Complete by this plan — the verifier decides that, per the plan's own success criteria. Requirements DASH-03/04/05 are marked complete at the plan level only.
- The pre-existing `check:nul-bytes` failure on `32-REVIEW.md` is open in `deferred-items.md` and will block a clean full-suite run until someone removes that ESC byte.

## Self-Check: PASSED

- `.planning/phases/32-board-projector-cli-dashboard/32-09-RED-baseline.txt` — FOUND
- `.planning/phases/32-board-projector-cli-dashboard/32-09-GREEN-proof.txt` — FOUND
- `.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` — FOUND
- Commits `9a8cac6d`, `9f143cec`, `6eaecfcb`, `c5285f36`, `b174467d`, `a060a8a4`, `4157f107` — all present in `git log`
- `git rev-list --count 7fa737e7..HEAD` = 7, matching `actuals.commits`
- Plan verification steps 1–4 re-run at close: 240 tests pass, build parity green, golden byte-identical, validator `ALL CHECKS PASSED`

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*

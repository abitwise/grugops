---
phase: 22-memory-trajectory-compaction-dialable-token-economy
verified: 2026-06-18T19:20:00Z
status: gaps_found
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
round: 4
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  previous_round: 3
  gaps_closed:
    - "CR-03 (raw-side id collision) — round-3 gap CLOSED in 22-05: a raw-side collision guard (compactor.ts:298-304) now mirrors the promoted-side guard; two distinct §14-gate-verified raw notes sharing one forged id → exit 1 naming the collision. Reproduced RED→GREEN by the orchestrator against the COMMITTED compactor.js: pre-fix (commit ec252b0) exit 0 → post-fix exit 1 naming `20260617T142305Z-engineer-finding-dup`."
    - "CR-01-r4 (failed-attempt provenance exemption) — round-3 gap CLOSED in 22-05: the `kind === \"failed-attempt\"` continue/exemption is GONE; FAs now flow through the SAME id-keyed exact-match + byte-equal field loop (compactor.ts:381-402) as durable notes. Reproduced RED→GREEN against the committed .js: raw FA {by: engineer, verified_by: §14-gate#RUN-1} → promoted FA {by: attacker, verified_by: empty} → pre-fix exit 0 → post-fix exit 1 naming `by` + `verified_by`."
    - "WR-01 (FA survival keyed on the frozen id, not the body FA-token), WR-03 (every raw+promoted note's kind validated against NOTE_KINDS up front), WR-02 (unparseable .md with no frontmatter fence fails closed), IN-02-partial (the shared exported context-io.parseNote is now adopted on the compactor read path — the hand-rolled readNoteFields near-copy is gone). All committed .js byte-fresh (npm run freshness exit 0); 280 non-e2e unit tests green (64/64 in the carve-out block)."
  gaps_remaining:
    - "WHITESPACE / PARSER-PROJECTION DRIFT (the 4th distinct CMP-02 bypass class) — NEW this round. 22-05 adopted the shared PARSER (parseNote, IN-02) but NOT the shared VALIDATOR: checkCarveOut() never calls validate() (grep-confirmed: zero `validate(` calls in compactor.ts). parseNote's kv regex `/^([A-Za-z_]+):\\s*(.*)$/` (context-io.ts:218) recognizes a key ONLY at column 0, so a provenance line indented by one space/tab — or written `verified_by : value` (a space before the colon) — is silently skipped: the field projects to \"\" with NO parse failure and NO duplicate-key signal. The byte-equal loop (compactor.ts:384-402) then compares parseNote's PROJECTION, not the file bytes, so a load-bearing field that differs in bytes can compare equal, and `isVerified = verified_by !== \"\"` (compactor.ts:338) can be flipped to false by an adversary while a human/git still reads the stamp. Found by the deep adversarial code review (22-REVIEW.md CR-01/CR-02/CR-03) AND independently reproduced by the orchestrator against the COMMITTED compactor.js with a discriminating control (see body)."
  regressions: []
gaps:
  - truth: "CMP-02 / SC2 — compaction never silently drops a load-bearing field (verified_by / failed-attempt / supersedes / by / at) on the way from the raw thread to the promoted notes; a §14-gate-verified finding survives compaction UNCONDITIONALLY; the carve-out oracle is the un-cheatable mechanical floor (a green unit suite is necessary but not sufficient — proof is RED→GREEN reproduction against the committed .js)."
    status: failed
    reason: >-
      Reproduced THIS verification against the COMMITTED scripts/compactor.js with a control. A
      §14-gate-verified SQL-injection finding present in the raw thread is DROPPED from the promoted
      set (folded out by a soft observation's raw-side `supersedes` link), yet `checkCarveOut` reports
      "carve-out intact" / exit 0 — SOLELY because the raw finding's `verified_by` line is indented by
      one space. `parseNote` does not match the indented key → `fields.verified_by === ""` →
      `isVerified === false` (compactor.ts:338) → `required = isVerified || isFailedAttempt ||
      survivingIds.has(id)` (compactor.ts:340) is false → the finding's drop is never checked. The
      BYTE-IDENTICAL fixture with `verified_by` at column 0 correctly REFUSES (exit 1, "a §14-gate-
      verified finding ... was dropped"). One leading space is the entire difference between refuse and
      accept. The same parser-projection drift launders `by`/`at` on any kind (indent the line on both
      raw and promoted sides → byte-equal compares ""==="" while the bytes differ, e.g. by: engineer →
      by: attacker — 22-REVIEW.md CR-02). Root cause: the oracle shares the lenient parser but not the
      strict validator — the IN-02 "read path cannot drift from the write path" guarantee is only half
      implemented (shared parser, unshared validation). This is the round-1/2/3 "green ≠ proof" lesson
      recurring in a new shape; the held-out suite is structurally blind (WR-02): every fixture writes
      column-0 `key: value` and the generalized sweep perturbs field VALUES, never line SHAPE.
    artifacts:
      - path: "scripts/compactor.ts:333-341,384-402"
        issue: >-
          checkCarveOut keys the required-survival decision on parseNote's projection (isVerified,
          survivingIds) and byte-compares that projection — it never calls validate() on raw or promoted
          notes, so a note the write-path validator would reject flows straight through. An indented /
          space-before-colon load-bearing line projects to "" and is invisible to both the
          required-survival gate and the byte-equal loop.
      - path: "scripts/context-io.ts:218"
        issue: >-
          The kv regex `/^([A-Za-z_]+):\\s*(.*)$/` matches a key ONLY at column 0. Indented or
          `key : value` lines are silently dropped with no parse error and no duplicateKeys signal —
          parseNote is lenient by contract (it must tolerate pre-id notes, last-value-wins); only
          validate() tightens it, and the oracle skips validate().
      - path: "scripts/compactor.test.ts (whole carve-out suite)"
        issue: >-
          64/64 GREEN yet bypassable. Every fixture writes column-0 `key: value`; the GENERALIZED
          (field × kind) sweep at line 1217 perturbs the VALUE of each load-bearing field, never the
          LINE SHAPE (indent, space-before-colon, trailing whitespace, CRLF). The suite pins exactly the
          shapes the oracle already handles — the round-3 "green is necessary but not sufficient" trap.
    missing:
      - >-
        Share the VALIDATOR, not only the parser (complete IN-02): run context-io.validate() over EVERY
        raw AND promoted note inside checkCarveOut and fail closed (exit 1, naming the file) on any
        structural finding. The write path (appendNote) already refuses exactly the notes the oracle
        accepts — the oracle must refuse them too.
      - >-
        AND/OR add a strict pre-pass: fail closed on ANY non-blank line inside the `--- ... ---`
        frontmatter fence that is not a recognized column-0 `key: value` or a `refs:` `  - item`. An
        indented or space-before-colon provenance line must never silently project to "".
      - >-
        Compare load-bearing fields on the raw bytes (or a presence-preserving canonical form), not
        solely on parseNote's lenient projection, so a byte-level alteration of by/at/verified_by/
        supersedes can never compare equal.
      - >-
        Add RED-first held-out tests that perturb LINE SHAPE (indent by one space and by a tab,
        `key : value` space-before-colon, trailing whitespace, CRLF) for EACH load-bearing field ×
        EACH kind — each proven exit 0 (bypass) against the current committed compactor.js and exit 1
        only after the fix, mirroring the control reproduction in this report.
must_haves_summary:
  - "CMP-01 (two-tier memory) — verified (plans 22-01/22-02; unchanged this round)"
  - "CMP-02 / SC2 (load-bearing carve-out) — FAILED (4th bypass: whitespace/parser-projection drift; reproduced against committed .js with control)"
  - "CMP-03 (compaction dial + re-verify + Workflow 18) — verified (plans 22-01/22-02; unchanged this round)"
  - "Round-4 progress: 22-05 CLOSED the two round-3 gaps (CR-03 raw-collision, CR-01-r4 FA-exemption) with RED→GREEN proof, but introduced no defense against line-shape drift."
---

# Phase 22 Verification — Round 4 (gaps_found)

**Verdict:** `gaps_found` — **3/4 must-haves verified**. CMP-02 / SC2 (the load-bearing-field
carve-out — the un-cheatable mechanical floor) is **still bypassable**. This is the 4th distinct
bypass of `checkCarveOut()`; rounds 1, 2, 3, and now 4 each shipped a fully GREEN held-out suite
and each remained bypassable. CMP-01 and CMP-03 remain verified (unchanged since plans 22-01/22-02).

## What round 4 (plan 22-05) DID close

22-05's oracle unification is real progress and the two **round-3** gaps are closed, each
reproduced RED→GREEN by the orchestrator against the **committed** `scripts/compactor.js`:

| Round-3 gap | Round-4 status | Proof (committed .js) |
|---|---|---|
| **CR-03** raw-side id collision (no raw mirror of the promoted guard) | **Closed** — raw-collision guard added | pre-fix exit 0 → post-fix exit 1 naming `…finding-dup` |
| **CR-01-r4** failed-attempt provenance exemption (FA path skipped the byte-equal loop) | **Closed** — FA folded into the one id-keyed byte-equal pass | pre-fix exit 0 → post-fix exit 1 naming `by` + `verified_by` |

Also landed: WR-01 (FA survival keyed on the frozen `id`, not the body token), WR-03 (`kind ∈
NOTE_KINDS` validated up front), WR-02 (unparseable `.md` fails closed), and IN-02 *in part* (the
shared exported `parseNote` is adopted on the read path; the hand-rolled near-copy is gone).
`npm run freshness` exits 0; 280 non-e2e unit tests pass (64/64 in the carve-out block).

## The 4th bypass — reproduced against the committed `compactor.js` (with a control)

A green suite is necessary but **not** sufficient — so the verdict is grounded in a reproduced
bypass, not a passing suite. The discriminating control isolates the defect to a single space:

| Run | Only difference vs. the other | `checkCarveOut` verdict | Exit |
|-----|-------------------------------|-------------------------|------|
| **Bypass** | raw `verified_by` indented **one space** | "carve-out intact: … all load-bearing provenance fields are present." | **0** (drop ACCEPTED) |
| **Control** | same line at **column 0** | "carve-out FAIL: a §14-gate-verified finding … was dropped …" | **1** (drop REFUSED) |

Fixture (both runs): the raw thread holds a §14-gate-verified `finding` (an SQL-injection finding)
plus a soft `observation` whose `supersedes:` points at the finding's id; the promoted set keeps
**only** the observation — the verified finding is entirely dropped. With `verified_by` at column 0
the finding is `isVerified` → unconditionally required → its drop is caught. Indented one space,
`parseNote` reads `verified_by === ""` → `isVerified === false`; the observation's `supersedes`
folds the finding out of `survivingIds`; `required` is false; the drop is never checked → exit 0.

## Root cause

`checkCarveOut()` adopted the shared **parser** (`parseNote`) but not the shared **validator**
(`validate()`), and never calls `validate()` on any note. `parseNote`'s kv regex
(`/^([A-Za-z_]+):\s*(.*)$/`, context-io.ts:218) recognizes a key **only at column 0**, so an
indented or `key : value` provenance line silently projects to `""`. The oracle then (a) keys
`isVerified` / the required-survival set on that projection and (b) byte-compares the projection
rather than the file bytes — so a load-bearing field that differs in **bytes** can compare equal,
and a truly-verified finding can be made to read as unverified. The IN-02 guarantee — "the path the
carve-out parses provably cannot drift from the path the writer validates" — is only half met: they
share the lenient parser, not the strict validator.

## Fix direction for round 5 (`/gsd-plan-phase 22 --gaps`)

Treat the **class**, not the two named shapes (the round-1→4 lesson): the read path must enforce as
strictly as the write path. Concretely — run `validate()` over every raw and promoted note and fail
closed; **and/or** fail closed on any non-blank line inside the frontmatter fence that is not a
recognized column-0 `key: value` or `refs:` list item; **and** compare load-bearing fields on a
presence-preserving canonical form, not solely on the lenient projection. Pin it with RED-first
tests that perturb **line shape** (indent, space-before-colon, trailing whitespace, CRLF) across
every load-bearing field × every kind — each proven exit 0 against the current committed `.js` and
exit 1 only after the fix. See `22-REVIEW.md` (CR-01/CR-02/CR-03 + WR-02) for the full analysis.

## Methodology note

Per the project's safety-invariant discipline (CLAUDE.md no-fabrication; the "green suite ≠ proof"
rule for guards/oracles): this verdict was reached by (1) an independent deep adversarial code
review of the oracle + parser surface, and (2) the orchestrator independently reproducing the
bypass against the committed `compactor.js` with a column-0 control. The goal-backward verifier was
**not** spawned to flip CMP-02: it would analyze the same green suite that already slipped three
bypasses, and authoring a "passed" verdict over a reproduced bypass would be fabrication.

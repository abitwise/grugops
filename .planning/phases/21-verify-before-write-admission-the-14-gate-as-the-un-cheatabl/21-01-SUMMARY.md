---
phase: 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl
plan: 01
subsystem: shared-context-write-path
tags: [verifier, admission, refuse-self, context-io, vfy]
requires:
  - "scripts/context-io.ts validate()/readContext()/currentState() (Phase 20 substrate)"
  - "agent-factory/contracts/context-note.md provenance schema"
provides:
  - "validate(text, trustedGateEmission?) extended with the D-09 refuse-self FAIL set + D-02 reserved-identity rule"
  - "emitVerdict(task, id, contextRoot?, at?) — the §14-gate verdict-emission carve-out (D-03/D-04) Plan 02 calls"
  - "admit(task, text, contextRoot?) — the isolated context-aware admission cross-check (D-01/D-10)"
  - "CLI verb: node scripts/context-io.js admit <task> <noteFile> [contextRoot]"
  - "the GREEN-verdict recognition contract Plan 02's emission must match byte-for-byte"
affects:
  - "agent-factory/workflows/05-pr-quality-gate.md (Plan 02 — calls emitVerdict on a green verdict)"
  - "agent-factory/workflows/16-context-read-write.md (Plan 03 — references the admission rules)"
tech-stack:
  added: []
  patterns:
    - "non-substring phrase matcher (==/startsWith + non-alpha boundary) for the DeLM invalid-evidence list"
    - "anchored allowlist grammars (GATE_STAMP_RE/HUMAN_STAMP_RE) modeled on TASK_NAME_RE"
    - "root-of-trust self-attestation carve-out via an internal trusted-emission flag (mirrors hooks/guard.ts env-var root)"
key-files:
  created: []
  modified:
    - "scripts/context-io.ts"
    - "scripts/context-io.js"
    - "scripts/context-io.test.ts"
decisions:
  - "Admission surface = TWO functions (validate stays pure text→findings; admit() is the only context-reading path) — D-10 separation"
  - "GREEN-verdict recognition contract: kind: finding + by: §14-gate + refs includes §14-gate#<id> + body contains READY_FOR_HUMAN_REVIEW + LIVE (not superseded)"
  - "CLI verb name = admit (mirrors the validate/render verb shape)"
  - "Per-run-id stamp grammar = §14-gate#<id> where <id> matches [A-Za-z0-9._-]+ (so the composed refs ref is a valid GATE_STAMP_RE)"
metrics:
  duration: 5m
  completed: 2026-06-17
---

# Phase 21 Plan 01: Verify-Before-Write Admission Summary

Gave `verified_by` mechanical teeth in `scripts/context-io.ts`: a `finding` is now admitted to the
shared verified context only with a real `§14-gate#<id>` stamp that cross-checks against a live GREEN
gate verdict (Posture B), and every cheap/accidental self-stamp is a named structural FAIL — proven
RED-then-GREEN.

## What was built

- **Structural layer (D-09/D-02), grafted into the existing pure `validate(text)`** — text-only, no
  context read (D-10 keeps it pure):
  - Refuse-self FAIL set, gated on `kind: finding` (D-08): empty `verified_by`; the literals
    `self`/`me`/`agent`; `verified_by == by` (self-stamp); a DeLM invalid-evidence phrase; or anything
    matching neither accepted grammar. Each push names the specific fault.
  - The DeLM invalid-evidence phrase list is present verbatim as a code `const`
    (`tbd`/`pending`/`not verified`/`unverified`/`should work`/`should pass`/`looks right`/
    `looks correct`/`seems to work`/`to be verified`/`will verify`/`n/a`).
  - **Non-substring matcher** (`isInvalidEvidencePhrase`): lowercase+trim, then `==` OR `startsWith`
    with a **non-alpha boundary** — never `.includes()`. A legit stamp whose id embeds a phrase's
    letters (e.g. `§14-gate#R-ftbdui-001`, embedding `tbd`) passes, proven by a no-false-positive test.
  - Two accepted `verified_by` grammars only (D-05/D-06/D-07): `GATE_STAMP_RE = /^§14-gate#[A-Za-z0-9._-]+$/`
    (the workhorse) and `HUMAN_STAMP_RE = /^human:[A-Za-z0-9._-]+$/` (escalation-only). No separate
    test-ref grammar — a passing test is a green gate run.
  - D-02 reserved-identity rule (applies to ANY note): `by: §14-gate` is a structural FAIL
    (impersonation flag), with the single D-04 carve-out for the gate's own emission.

- **`emitVerdict(task, id, contextRoot?, at?)` — the D-03/D-04 carve-out** and the ONLY path allowed to
  author a `by: §14-gate` note. It composes a verdict note (`kind: finding`, `by: §14-gate`,
  `refs: [§14-gate#<id>]`, body `READY_FOR_HUMAN_REVIEW: …`), validates it with the trusted-gate-emission
  flag set (so the reserved-identity AND refuse-self rules are suppressed for the root of trust only),
  and atomically appends it. Plan 02's §14 gate step calls this on a green terminal result.

- **`admit(task, text, contextRoot?)` — the D-01/D-10 admission cross-check** and the ONLY
  context-reading path. Runs `validate()` first (structural strict-reject, D-11), then — only for a
  `finding` carrying a `§14-gate#<id>` stamp — extracts `<id>`, reads the LIVE notes via
  `readContext` → `currentState`, and admits only if a live GREEN verdict with that exact per-run id
  exists. A `human:<name>`-stamped finding passes structurally and is not gate-cross-checked (its
  un-forgeability is Phase 25). No matching live green verdict → admission FAIL naming the unmatched id.

- **CLI verb** `node scripts/context-io.js admit <task> <noteFile> [contextRoot]` (exit 0 admitted /
  exit 1 refused, fault on stderr), mirroring the existing `validate`/`render` shape.

- **D-15 build model honored:** rebuilt `scripts/context-io.js` via `tsc`; `npm run freshness` exits 0
  (16 committed `.js` files byte-match a fresh rebuild). Zero new imports (`node:fs`/`node:crypto`/
  `node:path` only). Clear professional voice throughout.

## The GREEN-verdict recognition contract (for Plan 02 — match byte-for-byte)

A note is a LIVE GREEN verdict for per-run id `<id>` exactly when ALL hold:

| Field | Value |
|-------|-------|
| `kind` | `finding` |
| `by` | `§14-gate` |
| `refs` | includes the literal `§14-gate#<id>` |
| body | contains `READY_FOR_HUMAN_REVIEW` |
| liveness | not folded out by `currentState` (a superseded/withdrawn verdict does NOT admit) |

`emitVerdict()` in this plan is the canonical emitter; Plan 02's edit to `05-pr-quality-gate.md` must
call `context-io.ts emitVerdict` (not inline a raw write) so the emitted verdict matches this recognizer.

## TDD Gate Compliance

- RED gate: `test(21-01)` commit `9cd5051` — VFY fixtures fail before the validator/admission code lands.
- GREEN gate: `feat(21-01)` commit `1228383` — every VFY case green, all Phase-20 cases preserved.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Pre-existing-fixture interaction] Two Phase-20 `finding` GOOD fixtures became FAILs under the new D-09 rule**
- **Found during:** Task 2 (GREEN), when the full suite ran.
- **Issue:** `goodNoteText()` defaulted to a `finding` with `verified_by: ""` (a valid Phase-20 note —
  "Empty in Phase 20"). Under the Phase-21 D-09 rule a `finding` with an empty stamp is now correctly a
  structural FAIL, so `SC-1a GOOD` and the refs-list test (which assert exit 0) started failing —
  not a regression in their intent (a complete note validates / the refs block doesn't false-dupe), but
  a direct consequence of the new admission rule the plan introduces.
- **Fix:** Gave `goodNoteText()`'s default `verified_by` a valid gate stamp (`§14-gate#SEED-001`) and
  carried the same stamp in the hand-built refs-list fixture. Both fixtures preserve their original
  intent and the explicit RED override cases (`{ verified_by: "" }`, etc.) are unaffected.
- **Files modified:** `scripts/context-io.test.ts`
- **Commit:** `1228383`

**2. [Rule 3 - Blocking] emitVerdict's own verdict note tripped the refuse-self rule**
- **Found during:** Task 2 (GREEN), first build.
- **Issue:** The verdict note is itself a `kind: finding` with `verified_by: ""` (the gate is the root
  of trust — nothing verifies it). The new D-09 refuse-self check rejected it as a hollow stamp, so
  `emitVerdict` could not write its own verdict.
- **Fix:** Extended the D-04 `trustedGateEmission` carve-out to suppress the finding refuse-self block
  (not only the reserved-identity rule) for the gate's own emission path. Every other structural rule
  still applies to the verdict note. The plain `validate <file>` CLI verb never sets the flag.
- **Files modified:** `scripts/context-io.ts`, `scripts/context-io.js`
- **Commit:** `1228383`

## Verification

- `npm run build && npm run freshness` → exit 0 (committed `.js` is a faithful build, D-15).
- `npx vitest run scripts/context-io.test.ts` → 26 passed (12 new VFY cases + all Phase-20 cases).
- `npx vitest run --exclude '**/scripts/e2e/**'` → 185 passed, 1 skipped (no regression).
- `npm run typecheck` → clean. `node scripts/check-foundation-guards.js` → ALL CHECKS PASSED (one
  pre-existing A3 Tier-2 WARN, unrelated to this plan).
- CLI `admit` exercised manually: no-verdict → exit 1 naming the unmatched stamp; planted green verdict
  → exit 0 admitted.
- Source inspection confirms D-10 separation (`validate()` contains no `readContext`/`readdirSync`) and
  D-09 match semantics (`startsWith` + non-alpha boundary, not `.includes()`).

## Self-Check: PASSED

- FOUND: `.planning/phases/21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl/21-01-SUMMARY.md`
- FOUND: commit `9cd5051` (RED test)
- FOUND: commit `1228383` (GREEN implementation + committed .js)

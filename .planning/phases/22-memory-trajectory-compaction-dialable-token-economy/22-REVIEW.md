---
phase: 22-memory-trajectory-compaction-dialable-token-economy
reviewed: 2026-06-18T14:05:00Z
depth: deep
files_reviewed: 2
files_reviewed_list:
  - scripts/compactor.ts
  - scripts/compactor.test.ts
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-06-18T14:05:00Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

This is the safety-oracle re-review of `checkCarveOut()` after gap-closure 22-03. The three prior
bypasses the gap-closure targeted are genuinely closed for the *single-instance* shapes the new
tests pin: a forged/swapped `verified_by` (P5), a mutated `by` on a stamped finding (P5/P12), a
wholly-dropped verified finding when promoted has ≥2 notes (P4/P9), the ambiguous-sibling borrow
(the CR-03 same-kind case), the WR-01 missing-thread fail-closed, the WR-02 unrecoverable-FA-id,
and the WR-03 degrade throw. The 22-test suite is green and I reproduced each of those as actually
refusing against the committed `scripts/compactor.js`. `_dial` is declared and **never read** inside
`checkCarveOut` (D-05 holds at source), the file is `node:fs`-only with no network / `exec` / `eval`
/ LLM call, and the voice is clear-professional throughout.

**But the hardening introduced a NEW class of bypass and left a residual one — the original sin
(a load-bearing provenance field altered/dropped and surviving at `exit 0`) is STILL reachable two
ways, both reproduced against the committed `.js`, neither exercised by any test:**

1. **CR-01 (NEW — identity-key collision):** the CR-02 affirmative-existence check dedups raw
   verified findings into a `Set` keyed on `(kind, verified_by, by, at)`. When one gate run verifies
   *two* findings — same `verified_by: §14-gate#RUN-9`, same author, same timestamp — both raw notes
   collapse to **one** key, so a **single** surviving promoted note satisfies the existence check for
   *both*. Dropping one of the two verified findings passes `exit 0`. This is exactly the
   wholly-dropped-verified-finding failure CR-02 was created to kill, resurrected via key collision.

2. **CR-02 (RESIDUAL — the original CR-01 sin, for non-verified durable notes):** the
   alter/drop detection on `by`/`at`/`supersedes` only runs when `findCounterpart` resolves a 1:1
   match. For a durable note with an **empty `verified_by`** (observation / decision / claim /
   artifact-ref), matching falls back to the `(kind, at)` tuple. Mutate **both** `by` and `at`
   (no tuple match → `null` → mutation check skipped), or have **two** notes share `(kind, at)`
   (ambiguous → `null` → skipped), and a `by` swapped engineer→attacker — or dropped entirely —
   **survives at `exit 0`.** The header (lines 187-193) claims `by`/`at` are protected "on every
   promoted note"; they are not.

Both findings let a forged/dropped/altered provenance field survive the gate, so both are Critical.
The test file remains the weak link: every negative case still uses a *unique* `verified_by` per
finding and a *verified* finding for the field-mutation cases — the shared-gate-run shape and the
non-verified-note shape are not present anywhere (grep for `RUN-9`/`observation`/two-same-tuple
returns nothing). A green suite is not proof here.

All Critical and the timing-related Warning were reproduced empirically against the committed
`scripts/compactor.js`, not inferred.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Identity-key collision lets a wholly-dropped verified finding pass when one gate run verifies two findings

**File:** `scripts/compactor.ts:221-241` (the CR-02 existence check; `verifiedKey` at line 225)
**Issue:** The existence check builds `promotedVerifiedKeys` as a `Set` of
`verifiedKey(f) = [kind, verified_by, by, at].join(" ")`, then asserts each raw verified note's key
is present. A single gate run stamps every finding it verifies with the **same** `verified_by`
(`§14-gate#<run-id>`), and a batch of findings authored by the same role at the same emit time share
`by` and `at` as well. Two such raw findings therefore produce the **identical** key. A `Set` holds
it once, so **one** surviving promoted note marks the key present and the **second** verified finding
can be deleted entirely — its gate-verified provenance silently repudiated — and the check returns
`exit 0`. This is the precise defect CR-02 (prior review) was written to prevent.

Reproduced against the committed `scripts/compactor.js`:
```
P2b: raw = {sql.md, xss.md} both verified_by §14-gate#RUN-9, by eng, at 2026-06-17T14:23:05Z
     promoted = {sql.md} only            -> exit 0  <<< ACCEPTED >>>  (xss finding silently dropped)
```
The `findCounterpart` path does not save this either: with two notes sharing the stamp, `byStamp.length > 1`
returns `null` (line 257), so the per-field mutation loop is skipped for both. Nothing detects the drop.

**Fix:** The existence check must be **multiplicity-aware**, not set-membership. Count raw verified
notes per identity key and require at least that many promoted notes carrying the same key — or,
better, key on a value that is actually unique per note (the note body/content hash, or a per-note
id) rather than the shared provenance tuple. Concrete multiplicity approach:
```ts
const countByKey = (notes: Iterable<NoteFields>) => {
  const m = new Map<string, number>();
  for (const f of notes) {
    if (f.kind === "failed-attempt" || f.verified_by === "") continue;
    const k = verifiedKey(f);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
};
const rawCounts = countByKey(rawThread.values());
const promCounts = countByKey(promoted.values());
for (const [key, need] of rawCounts) {
  if ((promCounts.get(key) ?? 0) < need) {
    findings.push(
      `carve-out FAIL: ${need} §14-gate-verified note(s) with identity "${key}" were present in the ` +
        `raw thread but only ${promCounts.get(key) ?? 0} survived into the promoted set — a verified ` +
        `finding cannot be silently dropped (CMP-02, D-02.2).`,
    );
  }
}
```
Add a held-out test: two raw findings sharing one gate-run stamp+by+at, promoted drops one → must refuse.

#### CR-02: A non-verified durable note's `by` (or `at`) can be altered or dropped and survive — the original CR-01 sin, still reachable

**File:** `scripts/compactor.ts:194-219` (field-mutation loop) + `findCounterpart` 251-263
**Issue:** The alter/drop guard for `by` / `at` / `supersedes` only fires when `findCounterpart`
returns a non-null 1:1 match (line 197 `if (!counterpart) continue;`). For a durable note with an
**empty `verified_by`** — observation, decision, claim, artifact-ref — matching falls through to the
`(kind, at)` tuple (line 260). Two independent ways to force `findCounterpart` to return `null` and
thereby **skip** the mutation check entirely, while the note is in fact present-but-tampered:

- Mutate **both** `by` and `at`: no candidate matches `(kind, at)` → `null` → skipped.
- Two raw notes share `(kind, at)`: `byTuple.length > 1` is not handled, so a single match is
  required; with the counterpart altered, the count is not exactly 1 → `null` → skipped.

Because these notes have no `verified_by`, the CR-02 existence check (lines 232-233 `continue` on
empty `verified_by`) also ignores them. Net result: a `by` swapped `engineer` → `attacker` on an
observation/decision survives at `exit 0` — the exact "the original sin" the framing asks to hunt.

Reproduced against the committed `scripts/compactor.js`:
```
P7: observation, by engineer->attacker AND at re-timestamped  -> exit 0  <<< ACCEPTED >>>
P8: two observations same (kind,at), one's `by` line dropped   -> exit 0  <<< ACCEPTED >>>
```
The header comment (lines 187-193) and the field list `["verified_by","supersedes","by","at"]`
assert these fields are protected on *every* promoted durable note. They are protected only on notes
that happen to resolve a 1:1 counterpart — a coverage gap, not the stated invariant.

**Fix:** Skipping the mutation check on a null counterpart is fail-OPEN for an oracle that must
fail-CLOSED. When a raw durable note (verified or not) has no resolvable 1:1 counterpart, that is
itself a carve-out finding (cannot confirm its provenance survived), not a silent `continue`:
```ts
const counterpart = findCounterpart(rawFields, promoted);
if (!counterpart) {
  // No deterministic 1:1 match. A verified note is covered by the (fixed CR-01) existence check;
  // a non-verified durable note with no counterpart cannot be confirmed intact — fail closed.
  if (rawFields.verified_by === "") {
    findings.push(
      `carve-out FAIL: durable ${rawFields.kind} note (by "${rawFields.by}", at "${rawFields.at}") ` +
        `has no deterministic 1:1 counterpart in the promoted set — its provenance cannot be ` +
        `confirmed intact (CMP-02, D-02.2). Promote a uniquely-identifiable counterpart, or drop ` +
        `the whole note (allowed for an unverified note) rather than altering its provenance.`,
    );
  }
  continue;
}
```
This forces a deterministic identity for non-verified notes too (e.g. give every promotable note a
stable id and match on it), which is the only way `by`/`at` can be honestly verified across compaction.
Add held-out tests for P7 and P8.

### Warnings

#### WR-01: A legitimately re-timestamped verified finding emits a spurious second "wholly dropped" finding

**File:** `scripts/compactor.ts:194-219` (alter check) + `221-241` (existence check)
**Issue:** The two checks are not coordinated. When a verified finding's `at` legitimately changes
between raw and promoted (a compaction that re-timestamps), the alter check correctly reports
`at altered`, **and** the existence check — keyed on the now-changed `at` — additionally reports the
note as `wholly dropped from the promoted set`. The note was not dropped; only its `at` changed. The
operator sees a contradictory, misleading pair of messages for one cause.

Reproduced:
```
P3: single verified finding, at re-timestamped ->
  "load-bearing provenance field at was altered ..."
  "a §14-gate-verified finding note ... was wholly dropped ..."   <-- false; it is present
```
This is a correctness defect in the *reporting* (and a hint that the existence key over-relies on
mutable fields). Not a bypass, but it muddies a safety-surface message, which CLAUDE.md treats as a
clarity hard-rule. The CR-01 multiplicity fix that keys on content/id rather than the mutable
`(by, at)` tuple would also resolve this.

**Fix:** Key the existence check on a stable identity that does not include the fields the alter
check already polices (e.g. the `verified_by` stamp plus a content/body hash), so an *altered* field
is reported once by the alter check and never re-reported as a phantom drop.

#### WR-02: `findCounterpart` (kind, at) fallback is content-blind — a swapped-but-same-(kind,at) note matches

**File:** `scripts/compactor.ts:259-262`
**Issue:** When `verified_by` is empty, the counterpart is chosen purely on `(kind, at)` with no
regard for body or other fields. If a promoted note shares `kind` and `at` with a raw note but is in
fact a *different* note (content replaced) — common when an agent re-timestamps or reuses a template
`at` — the matcher binds them as counterparts, then checks only the four provenance fields. A
wholesale body/content substitution that keeps `(kind, at)` is invisible to the carve-out. The tool's
charter is structure, not body, so this is a Warning rather than Critical, but combined with CR-02 it
widens the non-verified attack surface.

**Fix:** Give promotable notes a stable per-note id and match on it; fall back to `(kind, at)` only
as a tie-break, and treat a non-unique fallback as a finding (per the CR-02 fix) rather than a bind.

#### WR-03: Test suite does not exercise the shared-gate-run, non-verified-note, or both-fields-mutated shapes — false confidence

**File:** `scripts/compactor.test.ts:135-376` (the CMP-02 describe block)
**Issue:** Every negative case uses a **unique** `verified_by` per finding (`SEED-001`, `SEED-002`)
and applies field mutations only to **verified** findings. The realistic shapes that break the
oracle are absent:
- no test where two findings share one gate-run stamp + `by` + `at` (CR-01);
- no test that mutates/drops `by` on a **non-verified** note (observation/decision) (CR-02);
- no test that mutates **both** `by` and `at`, or uses two same-`(kind, at)` non-verified notes.

A grep for `RUN-9` / `observation` / a shared tuple over the test file returns nothing. The suite
therefore pins exactly the paths that already work and certifies the invariant as held while two
bypasses sit open — the same false-confidence failure mode that shipped the prior 14-green-test
version. The byte-identity dial test (lines 549-566) is genuinely non-vacuous (it compares actual
finding text across dials, not just status) — good — but it only covers the one mutation that the
code already catches.

**Fix:** Add held-out RED cases for P2b (shared gate-run, drop one), P7 (non-verified note, both
`by` and `at` mutated), and P8 (two same-`(kind, at)` non-verified notes, one `by` dropped). Each
must currently fail (today's code accepts them) and pass only after the CR-01/CR-02 fixes.

### Info

#### IN-01: `supersedes` is policed only via the 1:1 counterpart, never affirmatively

**File:** `scripts/compactor.ts:198, 221-241`
**Issue:** `supersedes` is in the alter list but absent from the existence-key/affirmative check.
A note whose `supersedes` link is load-bearing but which is wholly dropped (or whose counterpart
does not resolve) loses the link with no affirmative detection. Lower severity because supersedes is
a fold-order hint rather than a verification stamp, but for completeness the same multiplicity logic
should consider it.
**Fix:** When the CR-01/CR-02 fixes give notes stable identities, fold `supersedes` integrity into
that same identity-based comparison.

#### IN-02: Failed-attempt id matching is unordered/multiplicity-blind

**File:** `scripts/compactor.ts:171-184`
**Issue:** `promotedFailedIds` is a `Set`; if the raw thread carries two distinct dead-ends that
happen to extract the same `FA-<token>` (e.g. `FA-1` reused for two notes), one surviving promoted
`FA-1` satisfies both. Same multiplicity blind spot as CR-01, lower stakes (dead-ends are reusable
hints, not verdicts), and an `FA-` token collision is unlikely by convention — recorded for symmetry.
**Fix:** If FA ids are ever non-unique in practice, count rather than set-test, mirroring the CR-01 fix.

---

_Reviewed: 2026-06-18T14:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_

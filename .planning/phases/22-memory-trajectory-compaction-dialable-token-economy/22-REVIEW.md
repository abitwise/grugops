---
phase: 22-memory-trajectory-compaction-dialable-token-economy
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scripts/compactor.ts
  - scripts/compactor.test.ts
  - scripts/generate-catalog.test.ts
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-06-18
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

`compactor.ts` is positioned as the *un-cheatable mechanical floor* of memory/trajectory
compaction — the safety oracle that guarantees no load-bearing field is ever silently dropped.
I reviewed it adversarially against that exact contract, and the carve-out check does **not hold
its stated invariant**. Three distinct ways a load-bearing element survives the check at `exit 0`
were confirmed by running the committed `scripts/compactor.js` against constructed inputs:

1. A load-bearing field that is **mutated to a different value** (rather than emptied) is never
   detected — including a `verified_by` stamp swapped to a **forged `§14-gate#FORGED-999`**. The
   check only fires on `rawVal !== "" && promVal === ""` (drop-to-empty), so any non-empty
   substitution passes.
2. A **wholly-dropped durable verified finding** passes whenever the promoted set has ≥2 notes —
   the realistic case. The provenance check iterates raw notes and *skips* any with no counterpart,
   so deleting the finding entirely (with its `verified_by`) is invisible.
3. The **counterpart matcher is ambiguous with ≥2 same-kind notes**: a dropped `by` on one note is
   masked by matching the other, intact note.

Separately, a **missing/typo'd thread directory silently reports "carve-out intact"** instead of
failing closed — an operator error turns the safety oracle into a rubber stamp.

The test file (`compactor.test.ts`) is the RED-first oracle that is supposed to catch these
regressions. It does not: every negative case drops a field to *empty* in a *single-note* set, so
the oracle pins only the one code path that happens to work and leaves the three real bypasses
above completely unexercised. This is the most important finding — the oracle gives false
confidence in a safety-critical invariant.

`generate-catalog.test.ts` (the 17→18 count bump) is sound; one minor robustness note below.

All Critical findings were reproduced empirically against the committed `.js`, not inferred.

## Critical Issues

### CR-01: Mutated load-bearing field (incl. forged `verified_by` stamp) is not detected

**File:** `scripts/compactor.ts:178-188`
**Issue:** The provenance check only fires on a drop-to-empty:
```ts
if (rawVal !== "" && promVal === "") { findings.push(...) }
```
A field changed to a *different non-empty value* is silently accepted. This defeats the stated
invariant that load-bearing fields must be "INTACT on every promoted note" (header lines 18-19,
CMP-02.2). The most dangerous instance: the promoted `verified_by` can be swapped from the real
`§14-gate#SEED-001` to a fabricated `§14-gate#FORGED-999` and the carve-out reports `exit 0`.

Reproduced:
```
PROBE A (by mutated engineer->attacker):          exit 0  (none)
PROBE B (verified_by mutated to forged stamp):    exit 0  (none)
```
Compaction is explicitly supposed to refuse a stamp that "no longer cross-checks." `checkCarveOut`
never catches the substitution; only the separate `reVerify`/`admit` path would — and `checkCarveOut`
is the gate the CLI `check` verb runs.

**Fix:** Compare for inequality, not just emptiness, on every load-bearing field:
```ts
for (const field of ["verified_by", "supersedes", "by", "at"] as const) {
  const rawVal = rawFields[field];
  const promVal = counterpart[field];
  if (rawVal !== "" && rawVal !== promVal) {
    findings.push(
      `carve-out FAIL: load-bearing provenance field "${field}" was altered from "${rawVal}" ` +
        `to "${promVal === "" ? "<empty>" : promVal}" on a promoted ${rawFields.kind} note ` +
        `— provenance must survive compaction unchanged (CMP-02, D-02.2).`,
    );
  }
}
```
(If a *legitimately* re-stamped `verified_by` is ever expected, that must route through `reVerify`
and be whitelisted explicitly — silent acceptance of any value is not acceptable for a safety floor.)

### CR-02: A wholly-dropped durable verified finding passes the carve-out (≥2 promoted notes)

**File:** `scripts/compactor.ts:174-189` (with `findCounterpart`, 197-211)
**Issue:** For each raw durable note the loop calls `findCounterpart`; when none is found it
`continue`s (line 177) with the comment "a wholly-dropped durable note is the agent's call." That
comment is load-bearing and wrong for the safety story: a verified `finding` carrying
`verified_by: §14-gate#SEED-001` can be deleted entirely from the promoted set — dropping its
`verified_by`/`by`/`at` provenance — and the check passes. The header (lines 18-19) and the test
banner (lines 10-13) both claim dropping `verified_by` is refused; that only holds when the finding
*survives but empties the field*, not when it is removed.

The `findCounterpart` `promoted.size === 1` fallback (line 203) accidentally catches this in the
trivial single-note case, which is exactly the case the test exercises — masking the bug. With ≥2
promoted notes (the realistic case) the fallback cannot fire.

Reproduced:
```
PROBE E (durable finding dropped, promoted.size==1):  exit 1   (accidental catch)
PROBE H (durable finding dropped, promoted has 2 FA): exit 0   (BYPASS)
```

**Fix:** Decide and enforce the real contract. If a verified finding's provenance must survive,
detect the wholly-dropped durable finding instead of silently `continue`-ing. One concrete approach:
build a set of raw "provenance-bearing" notes (any note with a non-empty `verified_by`) keyed by
`verified_by` (or `(kind, verified_by, by)`), and require each such key to appear in the promoted
set:
```ts
const rawVerified = [...rawThread.values()]
  .filter((f) => f.kind !== "failed-attempt" && f.verified_by !== "");
const promotedStamps = new Set(
  [...promoted.values()].map((f) => `${f.kind}|${f.verified_by}|${f.by}|${f.at}`),
);
for (const raw of rawVerified) {
  if (!promotedStamps.has(`${raw.kind}|${raw.verified_by}|${raw.by}|${raw.at}`)) {
    findings.push(
      `carve-out FAIL: verified ${raw.kind} (verified_by "${raw.verified_by}", by "${raw.by}") ` +
        `present in the raw thread was dropped from the promoted set — a gate-verified finding ` +
        `and its provenance must survive compaction (CMP-02, D-02.2).`,
    );
  }
}
```
Whatever the intended policy, the code comment at line 177 must match it; "the agent's call" is
incompatible with "the carve-out is the un-dialable floor."

### CR-03: `findCounterpart` mis-matches with multiple same-kind notes, masking a dropped field

**File:** `scripts/compactor.ts:197-211`
**Issue:** When a raw note's `by` is dropped (promoted `by === ""`), `byMatch` fails and the
function returns `sameKind[0]` (lines 209-210) regardless of which raw note is being checked. With
two same-kind notes — e.g. an `engineer` finding and a `reviewer` finding — the reviewer finding's
dropped `by` is compared against the engineer finding's intact counterpart, so the drop is never
flagged. The fallback "return the single same-kind note" reasoning silently degrades to "return an
arbitrary same-kind note" when `sameKind.length > 1`.

Reproduced:
```
PROBE C (2 findings, reviewer's `by` dropped):  exit 0  (BYPASS)
```

**Fix:** Match counterparts deterministically and 1:1 on stable identity. Prefer matching on
`verified_by` (the load-bearing stamp, which CR-01's fix forbids mutating) or on note `at`+`kind`,
and treat an unmatched raw durable note per CR-02 rather than silently borrowing another note's
fields. Do not fall back to `sameKind[0]` when more than one candidate exists.

## Warnings

### WR-01: Missing/typo'd thread directory silently reports "carve-out intact"

**File:** `scripts/compactor.ts:116-118` (`readNoteDir`) → CLI `check`, 312-322
**Issue:** `readNoteDir` returns an empty map for a non-existent directory (`if (!existsSync(dir)) return out`).
A typo in the `<threadDir>` argument therefore yields an empty raw thread, no failed-attempt ids,
no durable notes — and the check prints "carve-out intact" with `exit 0`. For a fail-closed safety
oracle, a missing *input* should be an error, not a pass.

Reproduced:
```
PROBE F (thread dir missing/typo): exit 0  "carve-out intact..."
```

**Fix:** In the CLI `check` path, fail closed when the threadDir does not exist (the promotedDir
may legitimately be empty pre-promotion, but the raw thread being checked must exist):
```ts
if (!existsSync(threadDir)) {
  console.error(`compactor: thread directory not found: ${threadDir}`);
  process.exit(1);
}
```

### WR-02: `failedAttemptId` filename fallback can manufacture a spurious id mismatch

**File:** `scripts/compactor.ts:130-138`
**Issue:** When a failed-attempt note carries no `FA-…` token in body or filename, the function
returns `filename.replace(/\.md$/, "")` as the id. The raw thread and the promoted set frequently
use *different* filenames for the same dead-end (the test itself does: thread `FA-1.md` body
`"FA-1: tried…"` vs promoted `FA-1.md` body `"FA-1: shared token cache broke…"` — same `FA-1`
token, different prose). If either side ever loses the `FA-` token, the id silently becomes the raw
filename and will not match the promoted filename, producing either a false PASS (different ids both
fall through) or a confusing false FAIL. The id derivation should be one stable source, not a
body-or-filename-or-raw-filename cascade.

**Fix:** Require an `FA-…` token for a `failed-attempt` and treat its absence as an explicit
carve-out finding (the comment at line 136 already says it "is itself a carve-out violation" — but
the code returns a best-effort id instead of recording a finding). Return `null`-plus-finding, or a
sentinel that `checkCarveOut` reports as "failed-attempt note has no recoverable FA-id."

### WR-03: `degradeToClaim` silently no-ops on a note that does not match the expected templates

**File:** `scripts/compactor.ts:275-284`
**Issue:** The three `.replace()` calls are anchored to exact line shapes (`^kind:\s*finding\s*$`,
`^verified_by:\s*.*$`, `^confidence:\s*.*$`). If the finding lacks a `confidence:` line, or `kind`
is e.g. `finding ` with a trailing-space variation the regex misses, the function returns text that
is *not* degraded — still `kind: finding`, possibly still carrying the stamp — with no error. For
the "honest degrade" escape hatch this is a silent integrity failure: the caller believes it
degraded to a claim when it did not. The trailing comment (lines 281-283) acknowledges the
append-confidence case is "out of scope" and relies on the template "always" carrying the fields,
which is an unverified assumption at a safety boundary.

**Fix:** After the replacements, assert the post-conditions and throw on failure:
```ts
if (!/^kind:\s*claim\s*$/m.test(out) || !/^confidence:\s*UNKNOWN - verify\s*$/m.test(out)) {
  throw new Error("compactor.degradeToClaim: input did not match the finding template; refusing to return an un-degraded note");
}
if (/verified_by:\s*§14-gate#/.test(out)) {
  throw new Error("compactor.degradeToClaim: degraded claim still carries a §14-gate stamp");
}
```

### WR-04: Test oracle does not pin any of CR-01/CR-02/CR-03 — false confidence in the invariant

**File:** `scripts/compactor.test.ts:135-269`
**Issue:** Every negative case drops a field to **empty** in a **single durable-note** set, which is
precisely the one path that works. There is no case for: (a) a field mutated to a *different*
non-empty value (CR-01), (b) a verified finding *wholly dropped* with ≥2 promoted notes (CR-02),
(c) two same-kind notes where one drops a field (CR-03), or (d) a forged `verified_by` substitution.
A RED-first oracle for an "un-cheatable" safety floor must include the adversarial substitution and
deletion cases, not only the cooperative drop-to-empty case. As written, the suite will stay green
through all three confirmed bypasses.

**Fix:** Add the missing negative cases (each currently passes at `exit 0`, demonstrating the gap):
```ts
it("mutates verified_by to a forged stamp — refuse, naming verified_by", () => {
  // raw verified_by §14-gate#SEED-001; promoted §14-gate#FORGED-999 → must exit 1
});
it("wholly drops a verified finding with 2+ promoted notes — refuse, naming the dropped finding", () => {
  // promoted = {FA-1, FA-2}, raw = {finding(verified), FA-1} → must exit 1
});
it("drops `by` on one of two same-kind findings — refuse, naming by", () => {
  // raw {engineer-finding, reviewer-finding}; promoted strips reviewer's by → must exit 1
});
```
These should be written RED against the current `.js`, then CR-01/02/03 fixed to turn them green.

### WR-05: `_dial` parameter is dead — the un-dialable guarantee is structural-by-omission, not asserted

**File:** `scripts/compactor.ts:146` (param `_dial`), 246-268 (test)
**Issue:** `checkCarveOut` takes `_dial` and never reads it — which is the *correct* behavior for an
un-dialable check, but it is undocumented in code as a deliberate intentional-ignore and the test's
"un-dialable" case only varies the *passed* dial through the CLI, which equally never reads it. The
guarantee "the carve-out holds identically at every dial" is currently true only because the dial is
inert; if a future edit ever wires `_dial` into the comparison, no test would catch the regression
(the un-dial test drops a field that fails for *unrelated* reasons at every dial). The property is
asserted by accident, not by construction.

**Fix:** Keep `_dial` inert but add an explicit assertion of dial-independence: run the *same*
faithful-but-for-one-mutation input across all three dials and assert byte-identical findings output
(not just `status !== 0`), so a future dial-sensitive branch is caught.

## Info

### IN-01: Comment at line 177 contradicts the safety contract

**File:** `scripts/compactor.ts:177`
**Issue:** `// a wholly-dropped durable note is the agent's call; fields are the floor` directly
conflicts with CR-02 and with the header's "load-bearing fields are INTACT on every promoted note."
Whatever policy is chosen, align the comment so the next reader does not trust a guarantee the code
does not provide.
**Fix:** Reword to state the actual enforced policy once CR-02 is resolved.

### IN-02: `findCounterpart` lines 209-210 are an unreachable-style redundancy

**File:** `scripts/compactor.ts:206-210`
**Issue:** `if (sameKind.length === 1) return sameKind[0];` followed unconditionally by
`return sameKind[0];` makes the length check dead — both branches return `sameKind[0]`. This is the
mechanical symptom of CR-03 (arbitrary same-kind borrow). Once CR-03 is fixed the redundancy
disappears; flagging it here so it is not "cleaned up" into the broken single return.
**Fix:** Resolve via CR-03 (deterministic 1:1 matching); do not collapse to a single `sameKind[0]`.

### IN-03: `generate-catalog.test.ts` count bump is sound; one robustness note

**File:** `scripts/generate-catalog.test.ts:72-91, 138-159`
**Issue:** The 17→18 workflow bump and new `"context compaction"` entry meaningfully pin the catalog
(exact row counts via `countRowsLinkingInto`, plus name-presence). This is good. Minor: the row
count regex `agent-factory/${dir}/[^)\\s|]+\\.md` counts *link targets*, so a duplicate link to the
same workflow file would inflate the count and a name typo in the table cell would not be caught by
the count (only by the separate `toContain(name)` loop). Not a defect in this change — noting that
the count assertion and the name assertion are independent and neither alone proves row↔name
correspondence.
**Fix:** Optional: assert each `WORKFLOW_NAMES[i]` co-occurs on the same table row as its source link
(stronger row-integrity pin). Not required for this phase.

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

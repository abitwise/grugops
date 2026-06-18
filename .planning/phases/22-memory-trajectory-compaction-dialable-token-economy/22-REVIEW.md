---
phase: 22-memory-trajectory-compaction-dialable-token-economy
reviewed: 2026-06-18T17:35:00Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - scripts/compactor.ts
  - scripts/context-io.ts
  - scripts/compactor.test.ts
  - agent-factory/contracts/context-note.md
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-06-18T17:35:00Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

This diff (7f11646..HEAD) is round 3 of hardening the CMP-02 carve-out oracle in
`scripts/compactor.ts` — a deterministic equivalence check that must REFUSE (exit 1) whenever a
memory compaction drops or alters load-bearing provenance, after two prior fixes passed full green
suites and were still bypassable.

The stable-id rewrite is a genuine improvement: the **durable** note path (claim / finding /
decision / observation / artifact-ref) is now keyed on the frozen `id` alone, the required-survival
set correctly starts from `currentState(rawThread)` (raw-side fold only) and re-adds verified
findings unconditionally, the byte-equal field check is symmetric (catches both drops and forged
additions), the forged-promoted-side-supersedes (FORGED-FOLD) and weaker-raw-side-supersedes
(RAW-FOLD-VERIFIED) classes are closed, and the duplicate-`id` read-path guard fails closed. I
reproduced all of those defenses against the committed `compactor.js` and they hold. Legitimate body
compaction (provenance intact, body shortened) is correctly accepted — no false-refusal on the
durable path.

**However, the carve-out is still bypassable.** The entire `kind: failed-attempt` path skips the
byte-equal provenance field check. A failed-attempt note's `by` / `at` / `verified_by` / `supersedes`
can be dropped or laundered to anything on the promoted side and the oracle returns **exit 0 /
"carve-out intact"** — directly contradicting this file's own docstring (lines 17-19), which promises
those four fields are "INTACT on every promoted note." The held-out tests do not catch it because
every failed-attempt fixture keeps `verified_by: ""` and identical `by` / `at` across raw→promoted,
so the gap is invisible to the green suite. This is the same "green is necessary but not sufficient"
pattern that defeated rounds 1 and 2. Details and reproductions below.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: failed-attempt provenance (`by`/`at`/`verified_by`/`supersedes`) is never byte-equal-checked — provenance laundering returns exit 0

**File:** `scripts/compactor.ts:247` (rule-2 skip), `scripts/compactor.ts:270` (rawDurable skip), `scripts/compactor.ts:328` (the byte-equal loop never runs for FA)

**Issue:**
The id-keyed byte-equal field check (the loop at lines 328-346 over `["id","kind","by","at","verified_by","supersedes"]`) only runs for notes that reached `rawDurable` / `promotedById`. Both maps explicitly **exclude** `kind === "failed-attempt"`:

- line 247: `if (fields.kind === "failed-attempt") continue;` (promoted side never indexed by id)
- line 270: `if (fields.kind === "failed-attempt") continue;` (raw side never added to `rawDurable`)

So for any failed-attempt note, the ONLY thing checked is rule 1: that its FA-`<token>` survives into the promoted set (lines 181-211). Its provenance fields are never compared. An attacker (or a compromised agent compacting its own thread) can therefore freely drop or alter `by`, `at`, `verified_by`, and `supersedes` on any failed-attempt note as long as the FA-token is preserved.

This directly contradicts the file's own contract docstring, lines 17-19:
> "2. The load-bearing provenance fields verified_by / supersedes / by / at are INTACT on every promoted note. A dropped field → refuse, name the field."

It is also an authorship-laundering vector (mandate item 7): a load-bearing result can be authored on the raw thread as `kind: failed-attempt` (the thread is the agent's own un-validated scratch — `appendNote`'s validator never runs on it), carry a real `verified_by: §14-gate#<id>` stamp and a `supersedes` link, and then be promoted with all of that erased while the oracle reports "carve-out intact."

**Reproductions (all return exit 0 against the committed `compactor.js`):**

1. Plain `by:` drop on a failed-attempt — raw `by: engineer`, promoted strips the `by:` line entirely. The identical mutation on a *finding* is asserted to refuse (test "drops by — refuse"); on a failed-attempt it passes:
   ```
   exit 0 — "carve-out intact: every failed-attempt id survived and all load-bearing
   provenance fields are present."
   ```
2. `verified_by` drop on a "verified failed-attempt" — raw `verified_by: §14-gate#RUN-1`, promoted `verified_by:` empty → exit 0.
3. Full laundering — raw `by: engineer / at: 2026-... / verified_by: §14-gate#RUN-42 / supersedes: <prior>`, promoted `by: ghost / at: 1970-... / verified_by: (empty) / supersedes: (empty)`, FA-token preserved → exit 0.

**Fix:**
Do not exempt failed-attempt notes from the byte-equal provenance check. Index promoted failed-attempts by their frozen `id` too, and run the same field-equality loop. Failed-attempts are *more* load-bearing than soft durable notes (they are unconditionally required to survive), so they must be at least as strictly checked. Concretely, fold FA survival into the same id-keyed match used for durable notes rather than a separate FA-token-only Set:

```ts
// Index promoted FAs by frozen id and, for each raw FA, assert the counterpart exists
// AND every load-bearing field is byte-equal — identical discipline to the durable path.
const promotedFaById = new Map<string, NoteFields>();
for (const [file, fields] of promoted) {
  if (fields.kind !== "failed-attempt") continue;
  if (fields.id === "") { findings.push(/* FA missing frozen id — fail closed */); continue; }
  if (promotedFaById.has(fields.id)) { findings.push(/* colliding FA id — fail closed */); continue; }
  promotedFaById.set(fields.id, fields);
}
for (const [, fields] of rawThread) {
  if (fields.kind !== "failed-attempt") continue;
  if (fields.id === "") { findings.push(/* raw FA missing frozen id */); continue; }
  const cp = promotedFaById.get(fields.id);
  if (!cp) { findings.push(`carve-out FAIL: failed-attempt id "${fields.id}" dropped ...`); continue; }
  for (const field of ["id","kind","by","at","verified_by","supersedes"] as const) {
    if (fields[field] !== cp[field]) findings.push(`carve-out FAIL: field "${field}" altered on FA "${fields.id}" ...`);
  }
}
```

Keep the FA-`<token>` body check as an *additional* naming signal if desired, but survival + provenance equality must key on the frozen `id`, identical to the durable path. (See WR-01 for why token-only matching is independently weak.)

## Warnings

### WR-01: failed-attempt survival is keyed on a forgeable body token, not the frozen `id`

**File:** `scripts/compactor.ts:162-169` (`failedAttemptId`), `scripts/compactor.ts:185-211` (rule 1)

**Issue:**
Rule 1 tracks failed-attempt survival via the `FA-<token>` substring extracted from the note **body** (`fields.body.match(/\bFA-[A-Za-z0-9_-]+\b/)`) or filename, then dedupes into a `Set<string>`. The whole point of the round-3 "stable-id rewrite" was to stop keying identity on forgeable/collidable content and key on the frozen `id` instead — but rule 1 was left on the old content-token scheme. Consequences:

- **Collision masks a real drop.** Two genuinely distinct dead-ends whose bodies both mention `FA-1` (distinct frozen ids) collapse to one Set entry. Promoting only one drops the other; `promotedFailedIds.has("FA-1")` is still true → exit 0. Reproduced: two raw FA notes (distinct ids `...-a` and `...-b`, both body `FA-1: ...`), promoted keeps only the first → "carve-out intact."
- **Token is body-channel data**, which the design explicitly treats as NOT byte-equal (compressible). Keying a load-bearing survival check on a compressible channel is the laundering surface the rewrite was meant to remove.

**Fix:** Key failed-attempt survival on the frozen `id` (as in the CR-01 fix). If the human-legible `FA-<token>` is still wanted for the *message*, derive it for naming only — never for identity/dedup.

### WR-02: malformed / unparseable raw note is silently dropped from the required-survival set (fail-open within the thread)

**File:** `scripts/compactor.ts:143-151` (`readNoteDir`), `scripts/compactor.ts:111-114` (`readNoteFields` returns null)

**Issue:**
`readNoteDir` does `if (fields) out.set(file, fields);` — when `readNoteFields` returns `null` (no `---\n...\n---` fence, e.g. an unterminated frontmatter fence), the note is silently omitted from the raw map. It therefore never enters `rawDurable` / `rawFailedIds`, so its required survival is never asserted. A required (even §14-gate-verified) raw note can thus be made to "not count" by corrupting its fence, and the oracle reports intact.

This is the same fail-open posture the CLI explicitly rejects for a *missing thread directory* (lines 499-505: "refusing to report carve-out status for a missing raw thread"), applied inconsistently *within* the thread. An oracle that fails closed on a missing directory but fails open on a malformed note inside it has an exploitable seam. Reproduced: a raw thread with one good verified finding and one verified finding with an unterminated fence; promoted keeps only the good one → exit 0.

**Fix:** Fail closed on an unparseable `.md` file in either directory. In `readNoteDir`, when `readNoteFields` returns null, surface a structural finding (or return a sentinel the caller turns into one) naming the file, rather than dropping it:

```ts
for (const file of readdirSync(dir)) {
  if (!file.endsWith(".md")) continue;
  const fields = readNoteFields(readFileSync(join(dir, file), "utf8"));
  if (!fields) { /* record a fail-closed structural finding naming `file` */ }
  else out.set(file, fields);
}
```

### WR-03: a `kind` value outside the six allowed kinds is read but never rejected by the oracle

**File:** `scripts/compactor.ts:111-140` (`readNoteFields`), `scripts/compactor.ts:174-350` (`checkCarveOut`)

**Issue:**
`readNoteFields` accepts any string for `kind`. `checkCarveOut` branches only on the literal `"failed-attempt"`; every other value (including a bogus kind, or an empty kind) is treated as "durable" and id-matched. Combined with CR-01, the kind relabel is itself a laundering primitive: a durable→failed-attempt relabel on the *raw* side moves the note onto the unchecked FA path before any byte-equal comparison happens. The oracle never validates that a note's `kind` is one of the six contract values (unlike `context-io.validate`, which does at lines 261-267).

**Fix:** Validate `kind ∈ NOTE_KINDS` for every raw and promoted note up front; fail closed on an unknown/empty kind. This also removes the durable/FA routing ambiguity the CR-01 fix depends on.

### WR-04: held-out adversarial tests omit the failed-attempt-provenance class entirely (suite is green but blind to CR-01)

**File:** `scripts/compactor.test.ts:88-129, 229-272, 498-549`

**Issue:**
The tests are genuine (they assert `status !== 0` and match the named element — not tautological), and they pin the durable-path bypasses well. But **every** failed-attempt fixture in the suite (`goodRawThread`, `goodPromotedSet`, the CR-02 P8 observations, etc.) holds `verified_by: ""` and identical `by` / `at` across raw and promoted. No test drops or alters `by` / `at` / `verified_by` / `supersedes` on a failed-attempt. So the suite cannot observe CR-01: the current broken oracle passes all 29 tests. This is precisely the round-1/round-2 failure mode — a green suite that does not exercise the live bypass.

**Fix:** Add RED-first cases that mutate each load-bearing field on a *failed-attempt* (mirroring the existing finding/observation drop cases), e.g. "drops by on a failed-attempt — refuse, naming by", "drops verified_by on a verified failed-attempt — refuse", "two distinct-id dead-ends sharing one FA-token, one dropped — refuse naming the dropped id". These should be RED against the committed `.js` and GREEN only after the CR-01 fix.

## Info

### IN-01: docstring over-claims the guarantee the code provides

**File:** `scripts/compactor.ts:17-19`

**Issue:** The header states the load-bearing provenance fields are "INTACT on every promoted note." Given CR-01 this is currently false for failed-attempt notes. Once CR-01 is fixed the docstring becomes accurate; until then it is an inaccurate safety claim on a safety surface. (Info, not Warning, because the fix is CR-01 — do NOT "fix" this by weakening the docstring.)

### IN-02: `readNoteFields` duplicates `parseNote` instead of reusing it (drift risk)

**File:** `scripts/compactor.ts:111-140` vs `scripts/context-io.ts:183-231`

**Issue:** `readNoteFields` is a hand-rolled near-copy of `context-io.parseNote` (same fence regex, same CRLF normalization, same `seen`/`dupes` duplicate-key machinery, same `^([A-Za-z_]+):` kv regex). The two are meant to stay in lockstep (the comment at lines 100-102 says so) but are independent code. A future change to the canonical parser (tightening the kv regex, handling a new injection trick) must be mirrored by hand here or the oracle silently diverges from the write path it polices. Consider exporting one shared frontmatter parser from `context-io.ts` so the read path the oracle parses and the write path `appendNote` validates cannot drift. (A refactor, slightly out of strict scope, but it is the structural root that makes WR-02/WR-03 and the indentation/CRLF edge cases two places to get right instead of one.)

---

_Reviewed: 2026-06-18T17:35:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_

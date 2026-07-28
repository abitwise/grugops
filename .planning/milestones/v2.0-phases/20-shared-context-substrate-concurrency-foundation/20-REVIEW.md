---
phase: 20-shared-context-substrate-concurrency-foundation
reviewed: 2026-06-17T10:30:55Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - scripts/context-io.ts
  - scripts/claim.ts
  - scripts/context-freshness.ts
  - scripts/check-foundation-guards.ts
  - scripts/context-io.test.ts
  - scripts/claim.test.ts
  - scripts/context-freshness.test.ts
  - scripts/check-foundation-guards.test.ts
  - agent-factory/contracts/context-note.md
  - agent-factory/contracts/task-notes.template.md
  - .github/workflows/ci.yml
findings:
  critical: 0
  critical_resolved: 2
  warning: 5
  info: 3
  total: 8
status: warnings_outstanding
---

# Phase 20: Code Review Report

**Reviewed:** 2026-06-17T10:30:55Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 20 ships the shared-context substrate (`context-io.ts`), the file-based work-claim queue (`claim.ts`), the context-index drift gate (`context-freshness.ts`), and a new `guard_context_writes` foundation guard. The code is well-documented, the test suites genuinely exercise both pass and fail sides (no fabricated-green gates), and the path-traversal allowlist for task names is sound (no separators ⇒ no `join()` escape). The zero-dep constraint holds (only `node:*` imports). The atomic-write and atomic-mkdir-claim primitives are correctly built for the single-writer partition they assume.

However, two genuine integrity defects exist in the provenance/ownership surfaces, and the new `guard_context_writes` regex is mis-calibrated in a way that will fail the build red the moment roles/workflows reference the context path in the natural `<task>` placeholder form.

The core problem in both BLOCKERs is the same: **fields that are interpolated raw into a frontmatter record are never validated to be single-line.** `appendNote` interpolates `NoteInput` fields into note frontmatter; `claimTask` interpolates `by` into `claim.md` frontmatter. A newline in any of those fields injects additional `key: value` lines that downstream parsers honor — defeating provenance validation in one case and the stale-claim sweep in the other.

## Critical Issues

### CR-01: `appendNote` allows frontmatter field injection — a soft `claim` can forge itself into a verified `finding`

**File:** `scripts/context-io.ts:198-242` (`composeNote` + `appendNote`)
**Issue:** `composeNote` builds the provenance fence by raw string interpolation of `NoteInput` fields (`kind`, `by`, `at`, `verified_by`, `confidence`, `supersedes`, and each `refs` entry). None of these is validated to be single-line. A field value containing a newline injects arbitrary additional frontmatter lines. Because `parseNote` lets a later `key: value` line overwrite an earlier one (`scalars[key] = val`), an attacker- or bug-supplied `by` like `"eng\nkind: finding\nverified_by: §14-gate#X"` produces frontmatter where the injected `kind: finding` overrides the real `kind: claim`, and a forged `verified_by` stamp appears. The composed text still passes `validate()` (all required fields present, `kind` is one of six), so the malformed note is written to disk.

This directly defeats the contract's stated no-fabrication floor ("an unstamped note cannot enter the verified context", `context-note.md:84-101`) and the explicit Phase-21 forward-reference invariant that "a `claim`-kind note can never, on its own, satisfy a `finding`'s admission requirement" (`context-note.md:136-139`). Provenance integrity is the entire value of this substrate; raw interpolation breaks it.

Verified by composing `{ by: "eng\nconfidence: high\nkind: finding", kind: "claim", ... }` — the re-parsed scalars show `kind` flipped to `finding`.

**Fix:** Validate every interpolated field is single-line before composing, and reject (or strip) embedded newlines. Add to `appendNote` (or a new `assertSafeField`):
```typescript
function assertSingleLine(name: string, v: string): void {
  if (/[\r\n]/.test(v)) {
    throw new Error(`context-io: field "${name}" must be single-line (no embedded newline): ${JSON.stringify(v)}`);
  }
}
// in appendNote, before composeNote:
assertSafeTask(task);
assertSingleLine("kind", note.kind);
assertSingleLine("by", note.by);
assertSingleLine("at", note.at);
assertSingleLine("verified_by", note.verified_by);
assertSingleLine("confidence", note.confidence);
if (note.supersedes !== null) assertSingleLine("supersedes", note.supersedes);
for (const r of note.refs) assertSingleLine("refs[]", r);
```
(Equivalently, harden `validate()` to fail when the parsed frontmatter contains a duplicate key, so the structural validator itself rejects an injected note regardless of the write path.)

### CR-02: `claimTask` writes an unvalidated `by` into `claim.md`, letting a newline injection make a stale claim un-sweepable forever (queue lock DoS)

**File:** `scripts/claim.ts:104-126` (`claimTask`) and `scripts/claim.ts:167-196` (`sweepStale`)
**Issue:** `claimTask` validates `task` via `assertSafeTask` but writes `by` raw into the claim record: `` `---\nby: ${by}\nat: ${at}\ntask: ${task}\n---\n` ``. A `by` containing a newline plus a forged `at:` line injects a second `at:` field. `sweepStale` reads staleness with `readFileSync(claimMd).match(/^at:\s*(.+)$/m)` — a multiline match that returns the **first** `at:` line. An injected `at: 2999-01-01T00:00:00.000Z` placed before the real `at` makes `sweepStale` always see a far-future timestamp, so `now - at > ttlMs` is never true and the claim is **never reclaimed** — the task is locked forever (a denial-of-service on the work queue, the exact failure the TTL sweep exists to prevent).

Verified by writing `claim.md` from `by = "attacker\nat: 2999-01-01T00:00:00.000Z"` with a real stale `at: 2000-...`: the sweep regex returns `2999-...`, so the stale claim survives.

**Fix:** Validate `by` is single-line in `claimTask` (and defensively in `sweepStale`):
```typescript
export function claimTask(queueRoot: string, task: string, by: string): boolean {
  assertSafeTask(task);
  if (/[\r\n]/.test(by)) {
    throw new Error(`claim: invalid "by" — must be single-line (no embedded newline)`);
  }
  ...
}
```
Defense-in-depth in `sweepStale`: after the `at:` match, also guard against a malformed multi-`at` record (e.g. count `at:` lines and treat >1 as a tampered claim to be reclaimed, or reject the claim and log). At minimum, validate the `by` on write.

## Warnings

### WR-01: `guard_context_writes` regex fires on a single `>`, producing false BLOCKERs on ordinary prose (including the natural `<task>` placeholder)

**File:** `scripts/check-foundation-guards.ts:499-507` (`CTX_TOKEN` / `CTX_WRITE_RE`)
**Issue:** `CTX_TOKEN` includes `>>?`, which matches a single `>`. A single `>` is pervasive in markdown/prose: arrows (`->`, `=>`), comparison (`1 > 0`), markdown blockquotes, and — most damagingly — the placeholder syntax `<task>`. The regex fires whenever the context path co-occurs on a line with any `>`, so the line `.grugops/context/<task>/` (the natural, documented way to refer to the path — it appears verbatim in `context-note.md:27`, `context-note.md:123`, and `task-notes.template.md:9`) trips the guard. `\bWrite\b` adds a second false-positive driver: the contract's own phrasing "the `Write` tool must never touch it" on a line with the path would fail red.

The guard is GREEN today only because no role/workflow in the current `CTX_SCAN` set mentions `.grugops/context/` at all (`grep` confirms zero hits in `agent-factory/roles/` and `agent-factory/workflows/`). The whole point of this guard (per its own header, `check-foundation-guards.ts:493-496`) is to let legitimate prose mention the path while catching real raw writes. As soon as Phase 24 wires any role/workflow to reference `.grugops/context/<task>/`, the guard fails the build red on a false positive. This contradicts the stated calibration goal and will block legitimate later phases.

Verified against 11 prose/code cases: every prose case containing the path + a stray `>` or capitalized `Write` fired incorrectly; only the two true raw-write cases should have fired.

**Fix:** Require a real shell-redirect shape, not a bare `>`. Constrain the redirect token to a redirect-into-path context and drop the over-broad single `>` and `\bWrite\b`-anywhere:
```typescript
// Require ">>" OR ">" immediately followed by whitespace then the context path (a real redirect),
// not any stray ">". Keep writeFileSync/appendFileSync. Tighten the Write-tool token to an
// actual tool-call shape rather than the bare word.
const CTX_WRITE_RE = new RegExp(
  `(writeFileSync|appendFileSync)\\s*\\([^)]*${CTX_PATH}` +      // fn-call into the path
  `|>>?\\s*['"\`]?${CTX_PATH}` +                                  // shell redirect INTO the path
  `|\\becho\\b.*>>?\\s*['"\`]?${CTX_PATH}`,                       // echo redirect INTO the path
);
```
Then add a regression test asserting `.grugops/context/<task>/` in prose stays GREEN, alongside the existing planted-raw-write tests.

### WR-02: `validate()` does not check that `at` is a parseable timestamp — an unparseable `at` silently mis-orders the entire trace

**File:** `scripts/context-io.ts:140-163` (`validate`)
**Issue:** `validate()` checks presence of `kind/by/at/confidence` and that `kind` is one of six, but never checks that `at` is a parseable ISO-8601 value. The contract states `at` is "the authoritative replay sort key" (`context-note.md:78`, `task-notes.template.md:33`). A note with `at: yesterday` passes validation, then `currentState`/`render` sort it lexicographically against real ISO strings — silently placing it in the wrong position in the replay order, and `noteId` compaction produces a junk id. The supersede fold and the human-facing `index.md` ordering both depend on a sane `at`. An unparseable sort key is a correctness hazard for the entire derived trace, admitted with no warning.

**Fix:** In `validate()`, when `at` is present, reject an unparseable value:
```typescript
if (scalars.at !== undefined && scalars.at !== "") {
  if (Number.isNaN(Date.parse(scalars.at))) {
    findings.push(`structural FAIL: "at" is not a parseable timestamp ("${scalars.at}")`);
  }
}
```

### WR-03: `sweepStale` reclaim renames the subtask onto `pending/<task>.md` and can silently clobber a re-queued pending file

**File:** `scripts/claim.ts:184-193` (`sweepStale` reclaim branch)
**Issue:** When reclaiming a stale claim, `sweepStale` does `atomicRename(subtask, join(queueRoot, "pending", `${task}.md`))`. On POSIX `renameSync` silently replaces an existing destination; the Windows branch of `atomicRename` explicitly `unlinkSync(dst)` then renames. Either way, if a fresh `pending/<task>.md` for the same task name already exists (e.g. a new subtask with a reused name was queued while the old claim was stale), the reclaimed stale subtask **silently overwrites** the newly-queued one — data loss with no error and no log. The queue treats task names as unique so the likelihood is low, but there is no guard against the collision on a silent-overwrite path.

**Fix:** Before reclaiming, check the destination does not already exist and surface a clear error (or skip + log) rather than clobber:
```typescript
const dest = join(queueRoot, "pending", `${task}.md`);
if (existsSync(subtask)) {
  if (existsSync(dest)) {
    // Do not clobber a re-queued pending subtask; report and leave the stale claim for a human.
    console.error(`claim.sweepStale: refusing to reclaim "${task}" — pending/${task}.md already exists`);
    continue;
  }
  atomicRename(subtask, dest);
}
```

### WR-04: `transition(claimed → done)` and `transition(pending → claimed)` silently clobber an existing destination

**File:** `scripts/claim.ts:81-98` (`atomicRename`) and `scripts/claim.ts:132-142` (`transition`)
**Issue:** `atomicRename` is `renameSync` (POSIX: replaces existing dst) plus a Windows `unlinkSync(dst)`-then-rename branch — both overwrite an existing destination by design. `transition` performs no check that the destination is absent before moving. If a `done/<task>.md` already exists (a re-run, a name reuse, or a double transition) the prior completed-subtask record is silently destroyed. The "directory IS the state" model has no other record of that completion, so this is a silent loss of the completion trace. The single-claim-owner partition argues two agents won't race the same task, but it does not prevent a re-run or a logic error from clobbering.

**Fix:** Make `transition` refuse to overwrite an existing destination (the queue should never legitimately need to replace one), e.g. probe `existsSync(dst)` and throw a clear error before the rename, or use a non-clobbering rename. If overwrite is ever intended it should be an explicit, named parameter, not the silent default.

### WR-05: CI rebuilds the committed `.js` in place before tests, and the build-output freshness gate runs ubuntu-only — a Windows-only emit difference would not be caught

**File:** `.github/workflows/ci.yml:49-66`
**Issue:** Every leg runs `npm run build` (`tsc` with the default outDir), which **overwrites the committed `.js` in the checkout** before `vitest` runs. So the tests never exercise the actual committed `.js` — they exercise a fresh local rebuild. The build-output drift gate (`npm run freshness`, which proves the committed `.js` matches a fresh `tsc` rebuild) runs **ubuntu-only** (`if: matrix.os == 'ubuntu-latest'`). A Windows-specific emit difference (e.g. CRLF line endings) in the committed `.js` would therefore never be caught: Windows rebuilds over it before testing, and the freshness gate that would compare committed-vs-rebuilt never runs on Windows. `tsconfig` `newLine: lf` mitigates the specific CRLF risk, but the structural gap (committed artifact never validated on the OS whose branch this phase exists to prove) remains. The whole point of the windows-latest leg is to run the committed-artifact Windows branch; rebuilding first weakens that claim.

**Fix:** Either drop the `npm run build` step and run the committed `.js` directly (the production contract is "run committed `.js` with bare Node"), or run the build into a temp dir for the freshness comparison and run the committed `.js` in the test step. At minimum, document explicitly that the Windows leg tests a rebuild, not the committed artifact, so the proof is not over-claimed.

## Info

### IN-01: `noteId` at-compaction strips only the first fractional-seconds group

**File:** `scripts/context-io.ts:216-220` (`noteId`)
**Issue:** `note.at.replace(/[-:]/g, "").replace(/\.\d+/, "")` strips one `.\d+` group (no `g` flag). For a standard ISO timestamp with at most one fractional-seconds group this is correct, but an `at` with an unusual shape (or a timezone offset like `+03:00`, where the `:` is already stripped) yields a less clean id. The id is explicitly documented as storage-convenience and not the replay key (`context-io.ts:215`, `context-note.md:64-68`), so this is cosmetic, but the regex is narrower than the comment implies. Consider `replace(/\.\d+/g, "")` for consistency.

### IN-02: `bodyExcerpt` only escapes via `cell()` at render time, but takes the raw first body line including a leading `#` or `|`

**File:** `scripts/context-io.ts:291-293` (`bodyExcerpt`) and `:342-346`/`:362-364` (render rows)
**Issue:** The excerpt is the trimmed first body line, escaped through `cell()` before entering the table. `cell()` correctly escapes `\`, `|`, and newlines (per `task-notes.template.md:45-55`), so pipe-injection is handled. This is informational confirmation, not a defect — the escaping is correct. One minor note: a body whose first line is empty (body starts with a blank line) yields an empty excerpt cell; acceptable but worth a comment.

### IN-03: `freshness:context` is vacuously green in CI on any repo without a committed `.grugops/context/` tree

**File:** `scripts/context-freshness.ts:90-112` and `.github/workflows/ci.yml:60-66`
**Issue:** The gate honestly reports a vacuous pass when no context root or no per-task dirs exist (documented, Phase-24 seeding). That is correct and non-fabricated. The informational consequence is that in CI today this gate proves nothing about render correctness beyond the unit test (`context-io.test.ts` covers determinism; `context-freshness.test.ts` covers the gate via a hermetic fixture). No action needed now; flagging so the team knows the CI signal for this specific gate is currently vacuous until Phase 24 commits a real context tree.

---

## Remediation (2026-06-17, post-review)

Both BLOCKERs were fixed under strict TDD (RED test proving the vulnerability first, then GREEN) during execute-phase, before phase verification. The 5 warnings and 3 info items remain outstanding and are carried forward (candidates for a follow-up `/gsd-code-review 20 --fix` or the next phase's hardening).

- **CR-01 — RESOLVED.** `appendNote` now rejects any note field containing CR/LF via `assertSingleLine` (kind, by, at, verified_by, confidence, supersedes, each refs[]); `validate()` additionally fails on a duplicate frontmatter key (`structural FAIL: duplicate frontmatter key "<key>"`), closing the CLI `validate <file>` path for out-of-band notes. Commits `a246edd` (RED) → `09963b7` (fix).
- **CR-02 — RESOLVED.** `claimTask` rejects a `by` containing CR/LF before writing `claim.md`; `sweepStale` treats a claim record with more than one `at:` line as tampered and reclaims it rather than trusting the first match. Commits `fff628a` (RED) → `08960a7` (fix).

Gate after remediation: `npm run build` exit 0 · `npx vitest run` (excl. live e2e) 170 passed/1 skipped · `npm run freshness` 16/16 `.js` fresh · `node scripts/check-foundation-guards.js` ALL CHECKS PASSED.

Outstanding (non-blocking): WR-01 (guard_context_writes regex false-positives on the `<task>` placeholder — will bite when Phase 24 wires roles), WR-02 (validate `at` parseability), WR-03/WR-04 (silent-clobber renames), WR-05 (CI rebuilds committed `.js` before tests; ubuntu-only freshness), IN-01/02/03.

---

_Reviewed: 2026-06-17T10:30:55Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Remediation: 2026-06-17 (CR-01, CR-02 resolved during execute-phase)_

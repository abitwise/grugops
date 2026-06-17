---
phase: 20-shared-context-substrate-concurrency-foundation
verified: 2026-06-17T13:47:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Run the CI workflow on a real windows-latest GitHub Actions runner (push or PR to the main branch)"
    expected: "The vitest suite passes on windows-latest — specifically the SC-2 `8 concurrent appendNote writers` test and the atomicWrite EPERM/EEXIST/EACCES branch execute on the real Windows MoveFileEx code path; the job exits 0"
    why_human: "The Windows unlink-then-rename branch of atomicWrite/atomicRename can only be proven on a real Windows runner. CI YAML is correctly wired and all unit tests pass locally (ubuntu), but the cross-platform CI has not been observed to actually pass on windows-latest — that runner only runs when the code is pushed/PR'd to GitHub Actions."
---

# Phase 20: Shared Context Substrate & Concurrency Foundation — Verification Report

**Phase Goal:** Establish the shared verified-context substrate and atomic concurrency primitives — the file locations, the typed-note schema with provenance, the only-sanctioned write path, and the file-based task queue — so that drift is caught as it is written, before any role uses them.
**Verified:** 2026-06-17T13:47:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Six-kind note schema carries the full provenance fence; a note missing a required provenance field is a validator structural FAIL naming the missing field (SC-1, SCTX-01). | VERIFIED | `validate()` in `scripts/context-io.ts:168-198` rejects missing `kind/by/at/confidence` by name; also rejects unknown `kind` values. CR-01 defense adds duplicate-key detection. `scripts/context-io.test.ts` proves SC-1a GOOD and SC-1b planted-FAIL (both confidence and kind). All 170 tests pass. |
| 2 | Two concurrent writes via `appendNote`/`atomicWrite` produce two distinct un-clobbered notes (SC-2, SCTX-02). | VERIFIED | `context-io.ts:206-231` implements `atomicWrite` with temp-then-rename, including Windows `unlinkSync(finalPath)` then retry path. `appendNote` computes a UUID nonce per write. `context-io.test.ts:127-164` runs 8 concurrent `appendNote` calls and asserts exactly 8 distinct, well-formed files. Unit test passes. Windows CI runner path has UNCERTAIN local execution — see Human Verification. |
| 3 | A subtask moves pending→claimed→done by atomic rename; `claimTask` `mkdirSync` claim is exclusive (second claimant fails); no central lock manager (SC-3, CLAIM-01, CLAIM-02). | VERIFIED | `scripts/claim.ts:104-134` uses `mkdirSync` atomic create-or-fail; `EEXIST` returns false; other codes rethrow. `transition()` uses `atomicRename()` with Windows unlink-then-rename branch. `claim.test.ts` proves: first claimant true, second false; missing parent throws; pending→claimed→done file moves; `sweepStale` reclaims expired TTL but not fresh. All tests pass. |
| 4 | The committed per-task JSONL index regenerates byte-identically from markdown; editing the committed index without regenerating trips `freshness:context` (fail-closed); markdown wins on conflict (SC-4, SCTX-03). | VERIFIED | `scripts/context-freshness.ts` clones `catalog-freshness.ts`; uses `mkdtempSync` mirror-spawn of `context-io.js render`, then `Buffer.equals` byte-compare. Fail-closed: non-zero regen exits 1 without reporting fresh. `context-freshness.test.ts` proves: fresh→PASS, planted-drift→STALE, broken-regen→fail-closed. `npm run freshness:context` exits 0 on the clean tree (vacuously honest — no `.grugops/context/` yet). |
| 5 | `guard_context_writes` fails RED if any shipped role/workflow text writes the shared context by a path other than the sanctioned `context-io.ts` helpers; a planted raw-write fixture proves it fires; the real shipped tree stays GREEN (SC-5, SCTX-05). | VERIFIED | `scripts/check-foundation-guards.ts:481-542` registers `guardContextWrites()` as a clone of `guardWr05()` with explicit `CTX_SCAN` (17 roles + 16 workflows). `CTX_WRITE_RE` matches `writeFileSync`/`appendFileSync`/`\bWrite\b`/shell redirect/`echo` co-occurring with `.grugops/context/` on one line. `check-foundation-guards.test.ts` planted-fire tests (two shapes) assert nonzero + `SCTX-05`; prose-stays-GREEN calibration case passes. `node scripts/check-foundation-guards.js` exits 0 over real tree (ALL CHECKS PASSED). |

**Score:** 5/5 truths verified

### Deferred Items

None — no must-have truths are deferred to later phases.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/contracts/context-note.md` | SCTX-01 note schema doc — six kinds + provenance fence + claim-KIND/queue-CLAIM distinction + clear voice | VERIFIED | 163 lines. Contains all six kinds, all provenance fence keys, the "CRITICAL DISTINCTION" section naming "queue CLAIM". Grep confirms `queue CLAIM` matches. No caveman voice matches. |
| `agent-factory/contracts/task-notes.template.md` | Deterministic index.md render template — zero-token, byte-reproducible, freshness-gated | VERIFIED | 73 lines. Documents the generated derived artifact shape, referencing `freshness:context` and `cell()` escaping. |
| `scripts/context-io.ts` | `readContext / appendNote / atomicWrite` + deterministic render + schema validate | VERIFIED | 458 lines. Exports `appendNote`, `atomicWrite`, `readContext`, `currentState`, `validate`, `render`. Contains `crypto.randomUUID`, `renameSync`, `unlinkSync`. Task name validated against `^[A-Za-z0-9._-]+$`. `assertSingleLine` guards all interpolated fields (CR-01 fix). |
| `scripts/context-io.js` | Committed compiled output | VERIFIED | File exists. `npm run freshness` confirms 16/16 `.js` files fresh (includes `context-io.js`). |
| `scripts/context-io.test.ts` | SC-1 GOOD+planted-FAIL; SC-2 concurrent un-clobbered; render determinism; replay/supersede | VERIFIED | 340 lines. Contains concurrent-write test (8 writers), planted schema-FAIL tests (missing field, bad kind, duplicate key). All 170 suite tests pass. |
| `scripts/claim.ts` | `mkdirSync` atomic claim + pending→claimed→done rename + `claim.md` record + TTL stale sweep | VERIFIED | 215 lines. Contains `mkdirSync`, `EEXIST` branch returns false, `renameSync`/`unlinkSync` Windows branch. `sweepStale` uses wall-clock TTL only, no `process.pid`/hostname. CR-02 fix: `by` validated single-line; multi-`at` tamper detection. |
| `scripts/claim.js` | Committed compiled output | VERIFIED | File exists. Confirmed fresh by freshness gate. |
| `scripts/claim.test.ts` | SC-3a exclusivity (EEXIST=false); SC-3b real-error throws; SC-3c rename transitions; TTL sweep; CR-02 injection defense | VERIFIED | 184 lines. Contains EEXIST test, TTL sweep reclaim + fresh no-op, CR-02 by-injection rejection and multi-at tamper reclaim. |
| `scripts/context-freshness.ts` | `freshness:context` drift gate — mirror-spawn regen, byte-compare, fail-closed | VERIFIED | 199 lines. Contains `mkdtempSync`, `spawnSync`, `Buffer.equals`. Fail-closed on non-zero regen. `CHECK_ROOT` override wired. macOS symlink issue resolved via `realpathSync`. |
| `scripts/context-freshness.js` | Committed compiled output | VERIFIED | File exists. Freshness gate confirms it is current. |
| `scripts/context-freshness.test.ts` | fresh PASS / planted-drift STALE / fail-closed-on-broken-regen | VERIFIED | 166 lines. Spawns compiled `.js`. Three tests: Test 1 exits 0 + "fresh"; Test 2 planted drift → nonzero + "STALE:" + "source of truth"; Test 3 broken regen → nonzero + no "matches a fresh regeneration". |
| `scripts/check-foundation-guards.ts` | `guardContextWrites()` registered alongside `guardWr05()` | VERIFIED | `guardContextWrites()` defined at line 532; called in run-all block at line 554. Explicit `CTX_SCAN` (not repo-wide grep). Finding text references `context-io.ts` and `SCTX-05`. |
| `scripts/check-foundation-guards.js` | Committed compiled output, fresh | VERIFIED | File exists. `npm run freshness` exits 0. |
| `scripts/check-foundation-guards.test.ts` | SC-5 planted raw-write fires (nonzero + SCTX-05); real-tree smoke stays GREEN | VERIFIED | Contains three SC-5 tests (writeFileSync plant, echo redirect plant, prose-stays-green). All fire correctly. Real-tree smoke (`node scripts/check-foundation-guards.js`) passes. |
| `.github/workflows/ci.yml` | os matrix [ubuntu-latest, windows-latest] on Node 22; vitest suite (e2e excluded); freshness + guards on ubuntu | VERIFIED | 67 lines. Contains both OS entries; Node 22 via `actions/setup-node@v4`; `--exclude '**/scripts/e2e/**'`; freshness + guards scoped to ubuntu; honest NFS `UNKNOWN - verify` comment at lines 14-15. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `context-io.ts appendNote` | `notes/<at>-<by>-<kind>-<nonce>.md` | `atomicWrite` temp-then-rename to a fresh unique path | WIRED | `appendNote` calls `atomicWrite(join(notesDir, id+'.md'), text)` where `id = noteId(note)` uses `randomUUID()` nonce. Path is always unique → Windows branch never fires for note publication. |
| `context-io.ts render` | `index.jsonl` | frontmatter → JSON fixed-key-order projection via `JSON.stringify` | WIRED | `toJsonl()` at line 341 uses `JSON.stringify({id,kind,by,at,verified_by,confidence,refs,supersedes})` in fixed key order. Called in `render()` for all ordered notes. |
| `context-freshness.ts` | `scripts/context-io.js render` | mirror-spawn regenerate via `spawnSync` | WIRED | Line 142-146: `spawnSync("node", [mirroredRender, "render", task, mirroredContextRoot])`. |
| `context-freshness.ts` | committed `index.{md,jsonl}` | `Buffer.equals` byte-compare committed vs rebuilt (fail-closed) | WIRED | Line 181: `committed.equals(rebuilt)`. If false → `process.exit(1)` with STALE message. |
| `check-foundation-guards.ts guardContextWrites` | shipped role/workflow `.md` SCAN set | `grepFiles(CTX_SCAN, CTX_WRITE_RE)` | WIRED | `CTX_SCAN = [...ROLE_FILES, ...CTX_WORKFLOWS]` at line 530. `grepFiles(CTX_SCAN, CTX_WRITE_RE)` at line 536. |
| `.github/workflows/ci.yml` | `scripts/context-io.test.ts` Windows branch | os matrix `[ubuntu-latest, windows-latest]` running the vitest suite | WIRED | CI YAML wires both OS legs. Windows leg runs `npx vitest run --exclude '**/scripts/e2e/**'` which includes `context-io.test.ts` and the concurrent/atomicWrite tests. |
| `claim.ts claimTask` | `claimed/<task>/` | `mkdirSync` atomic create-or-fail; EEXIST = claim lost | WIRED | Line 121: `mkdirSync(claimDir)` (not recursive). `catch (e)`: `if EEXIST return false; throw e`. |
| `claim.ts sweepStale` | `claim.md at` field | wall-clock TTL comparison (no pid/host liveness) | WIRED | Lines 189-201: reads `claimMd`, regex matches `^at:\s*(.+)$`, checks `now - at > ttlMs`. No `process.pid` or hostname anywhere in sweep path. |

### Data-Flow Trace (Level 4)

Not applicable — no components render dynamic data from a live data source. All artifacts are build-time tools (TypeScript helpers, gates, contract docs). Data flows are from the filesystem (`notes/` markdown files) and are verified through unit tests rather than live rendering.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Schema validate rejects missing field (SC-1b) | `npx vitest run scripts/context-io.test.ts` | 170 passed, 0 failed | PASS |
| 8 concurrent appendNote writers produce 8 distinct files (SC-2) | `npx vitest run scripts/context-io.test.ts` | "8 concurrent appendNote writers" test passes | PASS |
| `claimTask` EEXIST exclusivity (SC-3a) | `npx vitest run scripts/claim.test.ts` | "first claimant wins; second loses" passes | PASS |
| TTL sweep reclaims expired claim (SC-3/DOGF-02 seed) | `npx vitest run scripts/claim.test.ts` | "reclaims a TTL-expired claim" passes | PASS |
| `freshness:context` exits 0 on clean tree (SC-4) | `npm run freshness:context` | exit 0, "vacuous pass" message | PASS |
| `guard_context_writes` stays GREEN on real tree (SC-5) | `node scripts/check-foundation-guards.js` | exit 0, "ALL CHECKS PASSED" | PASS |
| Full suite no regressions | `npx vitest run --exclude '**/scripts/e2e/**'` | 170 passed, 1 skipped, 0 failed | PASS |
| Freshness gate: all 16 committed .js files fresh | `npm run freshness` | "All build outputs fresh: 16 committed .js file(s)" | PASS |
| CR-01 fix: appendNote rejects newline-injected fields | `npx vitest run scripts/context-io.test.ts` | "rejects a `by` carrying an injected kind/verified_by" passes | PASS |
| CR-02 fix: claimTask rejects newline-injected `by`; sweepStale reclaims multi-at tampered claim | `npx vitest run scripts/claim.test.ts` | Both CR-02 tests pass | PASS |

### Probe Execution

No explicit probes declared in PLAN files. The phase uses a `scripts/check-foundation-guards.js` aggregator and `npm run freshness`/`freshness:context` as structural probes.

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| Foundation guards | `node scripts/check-foundation-guards.js` | exit 0, ALL CHECKS PASSED | PASS |
| Build freshness (16 files) | `npm run freshness` | exit 0, 16/16 fresh | PASS |
| Context freshness | `npm run freshness:context` | exit 0, vacuous pass (no context tree yet) | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SCTX-01 | 20-01 | Six-kind typed-note schema with provenance fence; markdown source of truth | SATISFIED | `context-note.md` + `validate()` in `context-io.ts` |
| SCTX-02 | 20-01 | `context-io.ts` `node:fs`-only helpers, Windows-safe, freshness-checked | SATISFIED | `atomicWrite` with unlink-then-rename; 16/16 `.js` fresh |
| SCTX-03 | 20-03 | Committed per-task JSONL index + `freshness:context` drift gate, fail-closed | SATISFIED | `context-freshness.ts` + `context-freshness.test.ts` three-test oracle |
| SCTX-04 | 20-01 | Append-only, git-tracked audit trail; `at`+`supersedes` replay; `git log` tamper-evident | SATISFIED | `appendNote` writes unique fresh files only; `currentState` sorts by `at`+id, folds superseded |
| SCTX-05 | 20-04 | `guard_context_writes` — foundation guard for sanctioned-only context writes | SATISFIED | `guardContextWrites()` in aggregator; planted-fire + real-tree-green proofs |
| CLAIM-01 | 20-02 | File-based task queue `.grugops/queue/{pending,claimed,done}/` atomic rename transitions | SATISFIED | `transition()` using `atomicRename()` in `claim.ts` |
| CLAIM-02 | 20-02 | `claim.ts` `mkdirSync` atomic claim + stale sweep; `node:fs`-only, committed `.js` | SATISFIED | `claimTask()` EEXIST exclusivity; `sweepStale()` TTL-only reclaim |

All 7 requirements marked `[x]` complete in `REQUIREMENTS.md`. Traceability table shows `Phase 20 | Complete` for all 7.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/check-foundation-guards.ts` | 502 | `CTX_TOKEN` includes `>>?` (matches bare `>`) | WARNING (WR-01, outstanding from code review) | The guard is GREEN today because no shipped role/workflow currently references `.grugops/context/` at all. A false positive will occur the first time Phase 24 wires any role/workflow to mention the context path in prose on the same line as a `>` character (e.g., `<task>` placeholders). Not a current blocker; becomes one in Phase 24. |
| `scripts/context-io.ts` | 253 | `note.at.replace(/\.\d+/, "")` — no `g` flag on `.` group strip | INFO (IN-01, outstanding) | Cosmetic: noteId compaction may leave extra fragments for unusual ISO formats. The id is explicitly documented as storage-convenience, not the replay key. No functional impact. |
| `scripts/claim.ts` | 208 | `sweepStale` renames stale subtask onto `pending/<task>.md` without checking for existing pending file | WARNING (WR-03, outstanding) | Silent overwrite if a re-queued pending file has the same task name. Low probability given the single-claim-owner partition but not guarded. Not a current blocker; documented in review. |
| `scripts/claim.ts` | 141-151 | `transition()` calls `atomicRename` without checking for existing destination | WARNING (WR-04, outstanding) | Silent clobber if `done/<task>.md` exists from a re-run or logic error. Not a current blocker; the single-claim-owner model makes this unlikely. Documented in review. |
| `.github/workflows/ci.yml` | 49-66 | `npm run build` runs before vitest on ALL legs, overwriting committed `.js` before tests run | WARNING (WR-05, outstanding) | Tests never exercise the actual committed `.js` — they exercise a fresh local rebuild. Freshness gate is ubuntu-only. The "Windows executes the committed Windows branch" claim is weakened. Not a current blocker; documented in review. |

**TBD/FIXME/XXX scan:** CLEAN — no unreferenced debt markers found in any phase-20 modified file.

**Outstanding warnings from code review (5 warnings + 3 info, non-blocking):** WR-01, WR-02 (validate `at` parseability — not scanned above), WR-03, WR-04, WR-05, IN-01, IN-02, IN-03. These are acknowledged in `20-REVIEW.md` as non-blocking candidates for follow-up work. None carry a TBD/FIXME/XXX marker pointing to a formal issue, but they do not trigger the BLOCKER gate because neither the gates.md debt-marker rule (which requires a TBD/FIXME/XXX token, not a code pattern warning) nor a must-have truth failure applies.

### Human Verification Required

#### 1. Windows CI Runner — SC-2 Cross-Platform Proof

**Test:** Push the current main branch (or open a PR against it) so GitHub Actions runs the newly created `.github/workflows/ci.yml`. Observe the `windows-latest` leg of the `test` job.
**Expected:** The `windows-latest` leg completes with exit 0. The `npx vitest run --exclude '**/scripts/e2e/**'` step on Windows executes the SC-2 `8 concurrent appendNote writers` test and the `atomicWrite` EPERM/EEXIST/EACCES Windows-branch code path in `scripts/context-io.test.ts`. The job's vitest summary shows no failures.
**Why human:** The Windows unlink-then-rename branch of `atomicWrite`/`atomicRename` is the SC-2 cross-platform proof. The CI YAML is correctly structured and all tests pass locally (macOS/ubuntu); however, the workflow has never been triggered on a real `windows-latest` GitHub-hosted runner. The proof only exists when the runner actually executes. A GREEN windows-latest CI run is the observable, irreplaceable evidence.

### Gaps Summary

No gaps. All 5 Success Criteria are verified against the codebase with passing tests, committed compiled artifacts, and live gate results. The 2 BLOCKERs from the code review (CR-01 provenance forgery, CR-02 queue-lock DoS) were both fixed under TDD before this verification and are confirmed present in the committed code. The 5 outstanding warnings and 3 info items from the review are non-blocking by the review's own classification and are documented above.

The single human verification item (the `windows-latest` CI runner) is a cross-platform runtime proof that cannot be substituted by code inspection or local test runs — it requires an actual GitHub Actions execution.

---

_Verified: 2026-06-17T13:47:00Z_
_Verifier: Claude (gsd-verifier)_

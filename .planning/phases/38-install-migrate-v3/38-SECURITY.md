---
phase: "38"
slug: "install-migrate-v3"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-28"
---

# Phase 38 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| User's local copy → fixture tools | a real repository's files are read; a trimmed part becomes tracked content (38-01) | user-written planning text; may hold secret-shaped lines |
| Fixture → public repository | every committed fixture byte is published with grugops (38-01) | trimmed real-shaped state |
| Host board, ticket and catalog bytes → planner | every byte is user-written and untrusted (38-02) | untrusted text |
| Planner reasons → terminal | user text (IDs, trailers) appears in refusals and proof reasons (38-02) | untrusted text, possible control sequences |
| Host repository tree → installer | every entry under the pre-v3 root, the memory-bank root and the progress file is untrusted (38-03) | file tree, links, special files |
| Staged bytes → committed tree | what is renamed into place must be what was proven (38-03) | user state |
| Host NFR catalog and traceability → planner | hand-written, untrusted text (38-04) | untrusted text |
| Host board and progress file → in-memory roll | the roll moves whole lines between files (38-05) | untrusted text |
| Installer → trace renderer process | a child process reads the migrated state (38-06) | process execution |
| Repository-controlled `tools/grugops/` → installer | files the repository can edit (38-06) | executable code |
| Concurrent writers → state tree | the tree can change between read and commit (38-06) | user state |
| Layout and queue state → migrate decision | board presence, the claimed queue and the staging directory decide what runs (38-07) | repository state |
| Install ledger → closing notes | recorded backup paths are read and printed (38-07) | paths |
| Host filesystem entries → input walk | links, special files and sizes chosen by whoever controls the repository (38-08) | file tree |
| User state → terminal | paths, IDs and headings printed by the dry run (38-09) | untrusted text |
| Dry-run promise → user | a preview that writes breaks the trust the flag asks for (38-09) | none written |
| Context folder names and queue entries → selection | names come from agents and humans; the queue is live state (38-10) | names, queue state |
| User's local copy → dogfood | a real repository the user keeps (38-11) | user repository |
| Dogfood record → public repository | 38-DOGFOOD.md is committed (38-11) | counts, digests, commands |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-38-01 | Information disclosure | secret in the chess copy committed into install/fixtures/pre-v3-chess/ | medium | mitigate | 38-fixture-tools.mjs SECRET_SHAPES/isSecretLine, cleanBytes on every kept file; census names lines by file:line only; grep of the 32 fixture files finds no shape | closed |
| T-38-02 | Tampering | user's local copy edited by the census or trim | medium | mitigate | fixture tools write only under outDir and refuse an outDir inside the copy; 38-01-SUMMARY records empty porcelain and an unchanged sha256 manifest | closed |
| T-38-03 | Tampering | trailer text lost or altered | high | mitigate | state-migrate.ts cutRow (byte-exact splitRow) + rejoin check in proveStateMigrate; state-migrate.test.ts (S2), "longest trailer shortened" | closed |
| T-38-04 | Repudiation | plan hiding an original line by declaring it generated | medium | mitigate | generated lines removed by position, must equal template, no double declaration; state-migrate.test.ts "declared generated fails" | closed |
| T-38-05 | Spoofing | control sequences in refusals and proof reasons | medium | mitigate | embedded stripControlChars via shown(); state-migrate.test.ts ESC cases | closed |
| T-38-06 | Tampering | partial commit losing or mixing user state | high | mitigate | install.ts runStateMigrate: `wx` staging, read-back re-proof, reverse journal undo, post-commit proof, marker last; migrate-v3-rollback R1-R6, migrate-v3 (M1) | closed |
| T-38-07 | Tampering | rename silently replacing an existing file | high | mitigate | migrateRename lstat-ENOENT before renameSync; existing STATE_ROOT_REL refused; migrate-v3 (M3) | closed |
| T-38-08 | Tampering | removal reaching user content | high | mitigate | removal sites limited to this run's staging, commit plan, rmdir-only cleanup and render-added trace files; every site a CLASSIFIED_SITES row in installer-fs-census.test.ts | closed |
| T-38-09 | Tampering | NFR catalog text misattributed or lost | high | mitigate | own "nfr" multiset in proveStateMigrate, line 3 anchored to its row; state-migrate.test.ts NFR proof cases | closed |
| T-38-10 | Denial of service | catalog the rule cannot read blocking every migrate | low | accept | refusal names file, line and fix; nothing written (see Accepted Risks) | closed |
| T-38-11 | Tampering | Done row or progress entry lost or doubled by the roll | high | mitigate | checkConservation in executeRoll; stage A/B proof; state-migrate.test.ts parity with state-roll.js | closed |
| T-38-12 | Repudiation | progress file rewritten in place | medium | mitigate | moved to PRE_V3_PROGRESS_REL with `match:"identical"` home check after commit; migrate-v3 (M7) | closed |
| T-38-13 | Elevation of privilege | running a repository-edited trace-render.js | high | mitigate | kit-source renderer from GRUGOPS_SRC, spawnSync(process.execPath) with no shell; install.test.ts shell pin | closed |
| T-38-14 | Tampering | TOCTOU between read and commit | high | mitigate | treeRecord and progress bytes re-taken before first rename; migrate-v3-rollback (R7) | closed |
| T-38-15 | Denial of service | failed undo leaving a mixed tree | medium | mitigate | one sentence per failed undo step naming both paths; staging and commit plan kept; stagingRefusal on every layout and plain install (H7) | closed |
| T-38-16 | Tampering | EXDEV rename answered with copy and delete | high | mitigate | no copy fallback; failure undoes the journal; migrate-v3-rollback (R2) | closed |
| T-38-17 | Tampering | migrating while a claim is held or another migrate runs | high | mitigate | claimedQueueRefusal, stagingRefusal, non-recursive staging mkdir; migrate-v3-states (S2)(S3b)(S5)(S5b) | closed |
| T-38-18 | Repudiation | marker written on unchecked state | medium | mitigate | marker only after both proofs and the render; currentLayoutNote and context archive write none; migrate-v3-states (S8)(S10)(S11) | closed |
| T-38-19 | Spoofing | control sequences in ledger path or marker notes | low | mitigate | oneLine = stripControlChars in noteMovedBackups and currentLayoutNote; (S11)(S13) | closed |
| T-38-20 | Tampering | link under or on the way to pre-v3 state | high | mitigate | lstat walk refuses non-regular entries; wayTo + leaf lstat on every root; migrate-v3-hazards (H1)(H2)(H2b)(H2c) | closed |
| T-38-21 | Denial of service | FIFO, huge file or huge tree hanging the installer | medium | mitigate | special files refused by kind, USER_FILE_MAX_BYTES before open, TREE_MAX_ENTRIES; (H3)(H4)(H5) | closed |
| T-38-22 | Tampering | rename across filesystems answered with copy and delete | high | mitigate | device comparison in the pre-check; no copy fallback (R2). Pre-check device case has no automated test (needs a mount) | closed |
| T-38-23 | Tampering | dry run that writes | high | mitigate | DRY_RUN returns before any mutation in runStateMigrate and runContextArchive; migrate-v3-dryrun (D1)(D2)(D3) | closed |
| T-38-24 | Spoofing | control sequences rewriting the listing | medium | mitigate | listingLine wraps stripControlChars for every listing line; state-migrate.test.ts ESC cases | closed |
| T-38-25 | Tampering | context folder content changed by the move | medium | mitigate | treeRecord in pre-check compared at the new path; difference undoes the journal | closed |
| T-38-26 | Tampering | moving context of a task still being worked | high | mitigate | claimed-queue refusal on both arms; pending/claimed entries keep the folder (D-22); state-migrate.test.ts, migrate-v3-context (C2) | closed |
| T-38-27 | Tampering | crafted folder name escaping the archive | medium | mitigate | names outside TASK_NAME_RE, `.`/`..`, links and non-directories are kept, never joined | closed |
| T-38-28 | Tampering | dogfood writing into the user's copy or real kit home | high | mitigate | `cp -a` scratch copies, scratch GRUGOPS_HOME/HOME; porcelain empty and tree digest equal before and after (38-DOGFOOD.md) | closed |
| T-38-29 | Information disclosure | repository content copied into the committed dogfood record | low | mitigate | record holds commands, exit codes, counts and digests with shortened paths | closed |
| T-38-SC | Tampering | npm/pip/cargo installs | low | accept | no package manifest changed during phase 38 (see Accepted Risks) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Audit notes (non-blocking)

- **F1 (T-38-08, warning):** discardRenderedTrace removes files that appeared under the trace directory during the render; a file another writer drops there at that moment would also be removed if the commit fails. The directory holds generated output only.
- **F2 (T-38-13, T-38-08, T-38-23):** fix 2f8f8b65 makes the v3-layout `--archive-done-context` arm run the same kit renderer and discard path, after the dry-run return, with no marker.
- **F3 (T-38-17, T-38-26):** fix 6cbaa209 lets a dot-named regular file (e.g. `.gitkeep`) in the claimed queue pass; dot-named directories, links and unreadable entries still refuse.
- **F4:** `install/fixtures/pre-v3-chess/` is excluded from the banned-claims gate (human-accepted in 38-01).
- The fixture trim writes the board without `cleanBytes`; the census found no secret-shaped line in the board and the committed fixture holds none.
- No automated test covers a failed undo step (T-38-15) or the pre-check device comparison (T-38-22); both were reviewed by reading.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-38-01 | T-38-10 | a refusal names the file and line and the fix; the user's catalog is the user's to correct, and nothing is written | plan 38-04 threat model (plan time) | 2026-10-28 |
| AR-38-02 | T-38-SC | this phase installs no package; `npm ci` installs only the pinned dev dependencies from the committed lockfile | plans 38-01 to 38-11 threat models (plan time) | 2026-10-28 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-28 | 30 | 30 | 0 | gsd-security-auditor (ASVS L1, block_on high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-28

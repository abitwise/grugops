---
phase: 20-shared-context-substrate-concurrency-foundation
plan: 01
subsystem: infra
tags: [shared-context, node-fs, atomic-write, typed-notes, freshness, typescript, committed-js]

# Dependency graph
requires:
  - phase: 15-typescript-tooling-migration
    provides: the D-13 TS→committed-.js→freshness build model + node:fs-only zero-host-dep tooling layer
  - phase: 18-browsable-docs-catalog
    provides: generate-catalog.ts (parseFrontmatter + cell() escape) and catalog-freshness.ts mirror-spawn idiom cloned here
provides:
  - SCTX-01 typed-note schema contract (six kinds + the full provenance fence) in clear voice
  - scripts/context-io.ts — the ONLY sanctioned shared-context write path (readContext/appendNote/atomicWrite)
  - deterministic zero-token byte-reproducible index.md + index.jsonl render
  - the structural validator that FAILs on a missing provenance field or a bad kind (no-fabrication floor)
  - at+supersedes replay (currentState) — authoritative order is the fields, never filename/ls/mtime
  - the agent-factory/contracts/ directory (newly created) housing the two Phase-20 contract artifacts
affects: [phase-20-02 claim queue, phase-20-03 freshness:context gate + guard_context_writes, phase-21 verify-before-write admission, phase-24 role rewiring + render-on-done]

# Tech tracking
tech-stack:
  added: []  # zero new dependencies (host or dev) — node:fs/node:crypto/node:path/node:url stdlib only
  patterns:
    - "per-note-file + atomic temp-then-rename to a FRESH unique path (lock-free cross-process serialization)"
    - "Windows unlink-then-rename branch on EPERM/EEXIST/EACCES (confined to single-writer freshness-gated index.* regen)"
    - "deterministic render: sort by at (ISO lexicographic) + note-id tiebreak; fixed JSONL key order; single trailing newline"
    - "markdown notes/ is source of truth; index.md/index.jsonl are derived freshness-gatable mirrors (DeLM authority inverted)"

key-files:
  created:
    - agent-factory/contracts/context-note.md
    - agent-factory/contracts/task-notes.template.md
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
  modified: []

key-decisions:
  - "refs YAML-list parsing: extend the existing flat key:value parser minimally for a `refs:` list block (single-line comma form also accepted) — zero new dependency (resolves RESEARCH Open Question 1)"
  - "derived filenames index.md + index.jsonl (folder-relative); JSONL line is event-only (provenance fields, body excluded)"
  - "context root is a fixed literal (.grugops/context) in production; functions accept an explicit root so tests drive temp dirs"

patterns-established:
  - "Pattern: appendNote publishes to a fresh unique notes/<at-compact>-<by>-<kind>-<nonce>.md so the Windows rename-onto-existing hazard never fires for note writes"
  - "Pattern: every gate/validator proves BOTH a GOOD path AND a planted FAIL (no-fabrication contract)"
  - "Pattern: the note-KIND `claim` and the queue CLAIM are documented as strictly separate concepts, never sharing a sentence/field/code path"

requirements-completed: [SCTX-01, SCTX-02, SCTX-04]

# Metrics
duration: 9min
completed: 2026-06-17
---

# Phase 20 Plan 01: Shared-Context Substrate Foundation Summary

**The SCTX-01 typed-note schema (six kinds + full provenance fence) plus `context-io.ts` — the only sanctioned shared-context write path, with a crash-safe atomic per-note-file publish, a deterministic byte-reproducible index.md+index.jsonl render, at+supersedes replay, and a validator that fails on a missing field — all zero-host-dep `node:fs` on the committed-`.js` D-13 layer.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-06-17T~12:50Z
- **Completed:** 2026-06-17T~12:56Z
- **Tasks:** 2
- **Files modified:** 5 created (2 contract docs, .ts, committed .js, test)

## Accomplishments

- Created the new `agent-factory/contracts/` directory and authored the SCTX-01 note-schema contract (`context-note.md`): the six note kinds, the complete provenance fence (`kind`/`by`/`at`/`verified_by`/`confidence`/`refs`/`supersedes`), the required-field rule, the `crypto.randomUUID` collision-nonce documentation, and the `at`+`supersedes`-is-authoritative-replay-order rule — all in clear professional voice.
- Authored the deterministic `task-notes.template.md` render contract (zero-token, byte-reproducible, freshness-gated, `cell()`-escaped) and the critical `claim` note-KIND vs queue CLAIM distinction.
- Implemented `scripts/context-io.ts` — `atomicWrite` (with the Windows unlink-then-rename branch), `appendNote` (fresh-unique-path, append-only, task-name-validated against `^[A-Za-z0-9._-]+$`), `readContext` + `currentState` (at+supersedes replay), the byte-reproducible `index.md`+`index.jsonl` render, and the structural `validate` — `node:fs`/`node:crypto`/`node:path`/`node:url` only, zero host runtime deps.
- Proved the oracle GREEN (6/6): SC-1 GOOD + planted FAIL (missing field named, bad kind named), SC-2 eight concurrent un-clobbered writers, render byte-determinism + fixed JSONL key order, and supersede replay folding by `at`+note-id (not file position).
- Committed the compiled `scripts/context-io.js`; the `freshness.ts` build-output gate (14 committed `.js`) stays green.

## Task Commits

1. **Task 1: SCTX-01 note-schema contract + task-notes render template** - `0433785` (docs)
2. **Task 2 (RED): failing context-io oracle** - `4d5c214` (test)
3. **Task 2 (GREEN): implement context-io.ts + committed .js** - `e2fded6` (feat)

**Plan metadata:** committed with this SUMMARY + STATE + ROADMAP (docs).

_Task 2 is a TDD task: the RED test commit precedes the GREEN implementation commit._

## Files Created/Modified

- `agent-factory/contracts/context-note.md` - The SCTX-01 note schema: six kinds, the provenance fence, required-field rule, collision-nonce doc, claim-KIND vs queue-CLAIM distinction (clear voice).
- `agent-factory/contracts/task-notes.template.md` - The deterministic zero-token `index.md` render contract: determinism rules, `cell()` escaping, section shape.
- `scripts/context-io.ts` - `readContext`/`appendNote`/`atomicWrite` + deterministic render + `validate`; the only sanctioned write path.
- `scripts/context-io.js` - Committed compiled output of the above (freshness-gated).
- `scripts/context-io.test.ts` - Spawn-compiled-`.js` + import-compiled-`.js` oracle: SC-1 GOOD/planted-FAIL, SC-2 concurrent, render determinism, supersede replay.

## Decisions Made

- **`refs` YAML-list parsing (RESEARCH Open Question 1):** extended the existing flat `key:value` frontmatter idiom minimally to read a `refs:` list block (`refs:\n  - x\n  - y`), with a single-line `refs: a, b` comma form also accepted. Stays within the zero-dependency constraint — no js-yaml/gray-matter. Documented inline in `context-io.ts`.
- **Derived-artifact filenames (RESEARCH Open Question 2):** `index.md` + `index.jsonl` (folder-relative, no task-name duplication); the JSONL line is event-only (the eight provenance fields in fixed key order), the body stays in `notes/` (the source of truth) — keeps the JSONL compact and the freshness diff stable.
- **Context root:** a fixed literal `.grugops/context` in production (path-traversal-safe by construction); the exported functions accept an explicit `contextRoot` so the oracle drives `mkdtempSync` temp dirs and never writes into the committed tree.

## Deviations from Plan

None - plan executed exactly as written. (One test-assertion bug in the freshly-authored RED test — a frontmatter regex that wrongly required a newline before the first `kind:` line — was corrected during the GREEN step; this was a fault in the new test code being written this plan, not pre-existing code, so it is normal TDD iteration rather than a deviation rule firing. The note files were always well-formed; only the assertion regex was wrong.)

## Issues Encountered

- The initial RED-test concurrent-write assertion used `/^---\n[\s\S]*?\nkind: observation\n/`, which requires a `\n` before `kind:` — but `kind:` is the first frontmatter line, so the regex never matched a (correctly) well-formed note. Fixed to `/^---\nkind: observation\n/`. Resolved within the GREEN iteration; final suite 6/6.

## Threat surface

The threat-register mitigations for this plan are all implemented and proven:
- **T-20-01 (path traversal):** `appendNote`/`readContext`/`render` validate the task name against `^[A-Za-z0-9._-]+$` (rejecting `.`/`..`/separators/absolute paths) before joining under the fixed context root.
- **T-20-02 (markdown injection):** the `cell()` escape (`\`→`\\`, `|`→`\|`, newline→space), cloned from `generate-catalog.ts`, wraps every free-text `index.md` table cell.
- **T-20-03 (fabricated green):** the SC-1 oracle proves a planted missing-field note FAILs and the validator names the missing field / bad kind.
- **T-20-06 (nonce):** `crypto.randomUUID()` is documented as a collision nonce, not a security token.

No NEW threat surface beyond the plan's `<threat_model>` was introduced (filesystem tooling; no network, auth, or external input surface).

## Known Stubs

None. The render, validator, and write path are fully implemented. `verified_by`/`supersedes`/`refs` may legitimately be empty per the Phase-20 schema (admission enforcement on `verified_by` is Phase 21, documented as a forward reference in `context-note.md`, not a stub). True-NFS atomicity is honestly carried as `UNKNOWN - verify` per the plan (DOGF-02/Phase 26 is the eventual gate) — not claimed here.

## Next Phase Readiness

- The sanctioned write path (`context-io.ts`), the note schema, and the derived render now exist and are proven concurrent-safe (SC-1, SC-2 made TRUE) — ready for plan 20-02 (`claim.ts` atomic `mkdirSync` queue claim) and plan 20-03 (the `freshness:context` drift gate that mirror-spawns this render, and `guard_context_writes`).
- The CLI exposes `render <task> [contextRoot]` exactly so the plan-03 freshness gate can mirror-spawn the compiled `context-io.js`.
- No blockers. The Windows unlink-then-rename branch is implemented and logic-tested; the real `windows-latest` CI leg (SC-2 runtime proof) is plan 20-04's scope per RESEARCH.

## Self-Check: PASSED

Files (all FOUND): `agent-factory/contracts/context-note.md`, `agent-factory/contracts/task-notes.template.md`, `scripts/context-io.ts`, `scripts/context-io.js`, `scripts/context-io.test.ts`.
Commits (all FOUND): `0433785` (docs), `4d5c214` (test/RED), `e2fded6` (feat/GREEN).
Gates: `npm run build` exit 0; `npx vitest run scripts/context-io.test.ts` 6/6; `npm run freshness` exit 0 (14 committed .js fresh).

---
*Phase: 20-shared-context-substrate-concurrency-foundation*
*Completed: 2026-06-17*

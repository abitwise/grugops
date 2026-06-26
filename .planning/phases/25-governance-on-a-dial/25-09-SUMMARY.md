---
phase: 25-governance-on-a-dial
plan: 09
subsystem: governance
tags: [mcp, stdio, json-rpc, admission, context-io, single-writer, gov-01, gov-02, zero-dep, node22]

# Dependency graph
requires:
  - phase: 25-governance-on-a-dial (plans 25-01..25-08)
    provides: context-io appendNote/admit/validate/emitVerdict, readGovernanceConfig*/canonicalizeHumanAdmission (SC3 dial), HIGH_SEVERITY_ROLES, appendAuditLedger (GOV-02), the §14-gate Posture-B verdict cross-check, the freshness build-output gate, the byte-frozen prod-deploy guard
provides:
  - "A zero-dependency stdio MCP server (mcp__grugops__propose_note) — the structured admission CHANNEL that moves the GOV-01 gate to the point of effect (D-01): the agent admits a note by structured JSON args, no shell command string to obfuscate"
  - "context-io.admitAndAppend — the additive admit-decides-then-persist combiner that routes ALL persistence through the single sanctioned writer (appendNote)"
  - "context-io.isGatedNote — the SINGLE-SOURCE full gated-decision predicate (W-A) both the combiner and the 25-10 hook will import"
  - "context-io.isHighSeverityRole — the SINGLE-SOURCE Unicode-robust severity classifier isGatedNote depends on"
  - "plugin.json mcpServers wiring + the structured-channel write-path proof (admission-server.test.ts)"
affects: [25-10 (the per-call un-forgeable PreToolUse hook that imports isGatedNote), 25-11 (independent red-team + SC1 restatement)]

# Tech tracking
tech-stack:
  added: [node:readline-based zero-dep JSON-RPC stdio MCP server]
  patterns:
    - "Move-the-gate-to-point-of-effect (D-01): a structured tool channel replaces a parsed-shell-string proxy, eliminating the shell-obfuscation bypass family by construction"
    - "Single-source safety predicate (W-A): the FULL gated composition + the severity classifier each live in EXACTLY ONE exported function imported by every consumer — no duplicated grammar to drift"
    - "Mechanical per-function byte-freeze (W-B): a span-hash test pins admit() to a baseline so a future edit goes RED — the freeze is proven structurally, not green-suite-inferred"
    - "Single sanctioned writer preserved: a new write path REUSES appendNote (+ admit() for non-gated) and forks no second writer"

key-files:
  created:
    - scripts/admission-server.ts (+ committed scripts/admission-server.js)
    - scripts/admission-server.test.ts
  modified:
    - scripts/context-io.ts (+ rebuilt scripts/context-io.js) — 3 additive exports; appendNote gained an additive optional precomputedId
    - scripts/context-io.test.ts — W-B admit() freeze + isHighSeverityRole/isGatedNote/admitAndAppend behavioral suite
    - .claude-plugin/plugin.json — mcpServers entry

key-decisions:
  - "Mechanism (a) chosen and implemented: a zero-dep stdio MCP server wrapping appendNote (over (b) gating Write/Edit, which would break the single-writer invariant since notes are not written via the Write tool today)"
  - "The server is NOT the gate: it reads no approval env (a server env is frozen-at-launch / per-session and would mis-attribute the GOV-02 disposed_by). The un-forgeable per-NOTE gate is the per-call 25-10 PreToolUse hook"
  - "appendNote gained an additive optional precomputedId so the GOV-02 ledger id and the on-disk <id>.md share one identity; behavior is byte-identical when omitted (all existing callers + the compiled .js unchanged on that axis)"
  - "AdmitAndAppendResult is intentionally NOT exported (W-A anti-bloat): exactly three new exports (admitAndAppend, isGatedNote, isHighSeverityRole)"

patterns-established:
  - "Pattern: a structured-args admission tool whose persistence is solely the in-module single writer"
  - "Pattern: single-source predicate export imported by all governance consumers (no second grammar)"
  - "Pattern: pinned span-hash freeze for a safety-critical frozen function"

requirements-completed: [GOV-01, GOV-02]

coverage:
  - id: D1
    description: "isHighSeverityRole — single-source severity classifier folds NFKC / whitespace / U+00A0 / U+200B / case variants of the 3 role literals to high-severity"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#isHighSeverityRole (single-source severity classifier, W-A)"
        status: pass
    human_judgment: false
  - id: D2
    description: "isGatedNote — single-source FULL gated decision (off/high-severity/all/garbage/unreadable; non-finding never gated; unreadable fails closed)"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#isGatedNote (single-source full gated decision, W-A)"
        status: pass
    human_judgment: false
  - id: D3
    description: "admitAndAppend combiner — clean routine persist; gated+human:NAME persist+ledger disposed_by; gated no-stamp refuse (incl routine-under-all W5); W3 reject of a non-gated human:NAME; Posture-B preserved; unreadable fail-closed; ledger id == note id"
    requirement: "GOV-02"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#admitAndAppend (structured-channel persist arbiter, D-01)"
        status: pass
    human_judgment: false
  - id: D4
    description: "W-B mechanical admit() byte-freeze — span-hash equals pinned pre-25-09 baseline"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#W-B admit() mechanical byte-freeze (Plan 25-09)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Zero-dep stdio MCP server (mcp__grugops__propose_note): structured-channel write path routes solely to appendNote; reads no approval env (proven end-to-end over stdio with GRUGOPS_ADMISSION_APPROVED_BY set in the server env — a gated no-stamp note is still refused)"
    requirement: "GOV-01"
    verification:
      - kind: integration
        ref: "scripts/admission-server.test.ts#admission-server — end-to-end stdio JSON-RPC (the server is NOT the gate)"
        status: pass
      - kind: unit
        ref: "scripts/admission-server.test.ts#admission-server — structured-channel write path via the call handler (D-01)"
        status: pass
    human_judgment: false
  - id: D6
    description: "plugin.json mcpServers wires the committed server via ${CLAUDE_PLUGIN_ROOT}; manifest still parses, keeps name/version/author/keywords"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "scripts/admission-server.test.ts#admission-server — plugin.json mcpServers wiring"
        status: pass
    human_judgment: false
  - id: D7
    description: "The per-call MCP approval (one-time human approval of the grugops MCP server in Claude Code) — operational user-setup"
    verification: []
    human_judgment: true
    rationale: "A plugin-shipped MCP server requires a one-time per-server user approval in Claude Code that the agent cannot self-approve; verifiable only by a human in a live CC session (RESEARCH Q2)."

# Metrics
duration: 13min
completed: 2026-06-26
status: complete
---

# Phase 25 Plan 09: Structured Admission Channel (move the gate to point-of-effect) Summary

**A zero-dependency stdio MCP server (mcp__grugops__propose_note) wrapping a new additive context-io combiner (admitAndAppend) that routes every admitted note through the single sanctioned writer — eliminating the shell-obfuscation bypass family by construction, with the full gated predicate and severity classifier single-sourced (W-A) and admit() mechanically byte-frozen (W-B).**

## Performance

- **Duration:** ~13 min (execution; excludes context read)
- **Started:** 2026-06-26T21:09:48Z
- **Completed:** 2026-06-26T21:22:00Z
- **Tasks:** 3 (one TDD)
- **Files modified/created:** 7 (4 source/test .ts, 2 committed .js, 1 manifest) + phase deferred-items.md

## Accomplishments
- Built the structured admission CHANNEL (D-01): a role agent admits a note by ONE structured tool call whose args the harness delivers as final JSON — there is no agent-authored shell command string to obfuscate, so the entire shell-expansion bypass family (glob/brace/param-and-command-substitution/word-split/extglob-fragmentation/line-continuation/launcher-rename) is gone by construction.
- Added THREE additive context-io exports: `isHighSeverityRole` (single-source Unicode-robust classifier), `isGatedNote` (single-source FULL gated decision — both the combiner and the 25-10 hook will import it, closing the 10-round allow-forge drift surface), and `admitAndAppend` (the persist arbiter routing ALL persistence through `appendNote`).
- The combiner admits a human-APPROVED high-severity note PER NOTE (D-07): a gated note carrying a valid `human:NAME` stamp persists exactly one note and ledgers `disposed_by: human:NAME` (GOV-02, retained); a gated note lacking it is refused naming the fault (W5 backstop); a non-gated note's agent-supplied `human:NAME` is rejected (W3) so no forged `disposed_by` can enter the ledger.
- The server is provably NOT the gate: an end-to-end stdio test sets `GRUGOPS_ADMISSION_APPROVED_BY` in the server's own env and confirms a gated no-stamp note is STILL refused — the un-forgeable per-note gate is the per-call 25-10 hook, not the server's frozen env.
- `admit()` is mechanically byte-frozen (W-B span-hash test) and `hooks/guard.ts` is untouched; the single-sanctioned-writer invariant Phase 22 depends on is preserved.

## Task Commits

1. **Task 25-09-01: admitAndAppend + isGatedNote + isHighSeverityRole + W-B freeze (TDD)** — `60f03f8` (test, RED) → `fe8eb3c` (feat, GREEN) → `fadaec0` (refactor: un-export the result type, exactly 3 new exports)
2. **Task 25-09-02: zero-dep stdio MCP server** — `f660e10` (feat)
3. **Task 25-09-03: wire plugin.json mcpServers + write-path proof** — `9f870e7` (feat)

**Plan metadata:** docs commit (this SUMMARY + STATE + ROADMAP + REQUIREMENTS).

## Files Created/Modified
- `scripts/admission-server.ts` (+ `scripts/admission-server.js`) — the zero-dep Node 22 stdio JSON-RPC MCP server exposing `propose_note`; forwards structured args to `admitAndAppend`; reads no approval env; resolves `context-io.js` relative to itself.
- `scripts/context-io.ts` (+ `scripts/context-io.js`) — 3 additive exports (`isHighSeverityRole`, `isGatedNote`, `admitAndAppend`); `appendNote` gained an additive optional `precomputedId` (behavior-identical when omitted) so the ledger id and the on-disk `<id>.md` share one identity. `admit()` byte-frozen.
- `scripts/admission-server.test.ts` — 10 tests proving the combiner's persist-arbiter behavior through the server call path + end-to-end stdio + plugin.json wiring.
- `scripts/context-io.test.ts` — W-B admit() span-hash freeze + isHighSeverityRole / isGatedNote / admitAndAppend behavioral suite.
- `.claude-plugin/plugin.json` — `mcpServers.grugops` launches the committed server via `node ${CLAUDE_PLUGIN_ROOT}/scripts/admission-server.js` (stdio).

## Decisions Made
- Implemented mechanism (a), a zero-dep stdio MCP server wrapping `appendNote`, over (b) gating the Write/Edit tool — (b) would break the single-sanctioned-writer invariant because notes are not written via the Write tool today.
- The server reads no approval env; the un-forgeable per-NOTE gate is the per-call 25-10 hook (a server env is frozen-at-launch / per-session and would mis-attribute the GOV-02 `disposed_by`).
- `AdmitAndAppendResult` is intentionally NOT exported (W-A anti-bloat): exactly three new exports.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `appendNote` gained an additive optional `precomputedId` parameter**
- **Found during:** Task 25-09-01 (admitAndAppend)
- **Issue:** The non-gated branch routes the GOV-02 ledger through `admit()` (which reads `scalars.id` from the composed text) and then persists via `appendNote` (which generates its own id) — the ledger id and the persisted `<id>.md` would diverge, an audit-integrity defect for a governance feature.
- **Fix:** Added an additive optional 5th parameter `precomputedId?` to `appendNote`; when omitted, the id is generated exactly as before (behavior-identical for all existing callers; the compiled `.js` change is confined to the new parameter path). The combiner computes the id once, composes/validates/ledgers with it, then persists that same id.
- **Files modified:** `scripts/context-io.ts`
- **Verification:** The `GATED + valid human:alice` test asserts `event.id === res.id`; full non-e2e suite green; `admit()` byte-frozen; freshness 0.
- **Committed in:** `fe8eb3c`

---

**Total deviations:** 1 auto-fixed (1 blocking — necessary for ledger↔note id integrity). No scope creep; `admit()` and `guard.ts` untouched.

## Issues Encountered
- **Pre-existing environmental test flake (out of scope, logged):** two spawn-heavy fuzz cases in `scripts/floor-invariance.test.ts` (the 25-07 hook suite, 144 subprocess spawns each) time out at vitest's default 5s on this hardware. They pass 176/176 with `--testTimeout=30000`, are not caused by the 25-09 additive `context-io` changes (the failing ALLOW path never invokes `context-io.js`), and `floor-invariance.test.ts` is untouched. Logged to `.planning/phases/25-governance-on-a-dial/deferred-items.md`. The 25-09 verify lane is green with an adequate timeout.

## User Setup Required
**One external manual step.** A plugin-shipped MCP server requires a one-time per-server user approval in Claude Code (the human approves the grugops admission server when prompted on first use; the agent cannot self-approve it). No environment variables are required for this plan (the per-note `GRUGOPS_ADMISSION_APPROVED_BY` disposition is enforced by the 25-10 hook).

## Next Phase Readiness
- Ready for **25-10**: the per-call un-forgeable PreToolUse hook on `mcp__grugops__.*` that imports the single-source `isGatedNote` and validates `tool_input.verified_by === human:${fresh-env-name}` per call.
- Ready for **25-11**: the independent opus-grade red-team + SC1 restatement (the irreducible same-uid direct-FS-write residual is documented in the plan objective; this plan converts an actively-exploited shell-obfuscation surface into that bounded, documented limit).
- **Scope honesty:** this plan proves the COMBINER's persist-arbiter behavior and the structured channel; the un-forgeable per-note enforcement (denying an un-approved high-severity admission on this channel) is built and proven in 25-10.

## Self-Check: PASSED
- All created/modified files exist on disk (admission-server.ts/.js/.test.ts, context-io.ts/.js, plugin.json, this SUMMARY).
- All task commits exist in git history: `60f03f8` (RED), `fe8eb3c` (GREEN), `f660e10`, `9f870e7`, `fadaec0`.
- `admit()` span-hash equals the pinned baseline (FROZEN_OK); `git diff --quiet hooks/guard.ts` exit 0; `node scripts/freshness.js` exit 0; full non-e2e suite 956 passed | 1 skipped (with adequate timeout).

---
*Phase: 25-governance-on-a-dial*
*Completed: 2026-06-26*

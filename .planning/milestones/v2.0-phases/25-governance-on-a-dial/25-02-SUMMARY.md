---
phase: 25-governance-on-a-dial
plan: 02
subsystem: governance / safety-hooks
tags: [admission-guard, preToolUse-hook, GOV-01, fail-closed, un-forgeable, input-surface]
requires:
  - "scripts/context-io.ts readGovernanceConfig + parseNote (Plan 25-01)"
  - "hooks/guard.ts posture (byte-frozen clone source)"
provides:
  - "hooks/admission-guard.ts / .js — GOV-01 mechanically un-forgeable human-admission gate (CC primary tier)"
  - "second PreToolUse Bash matcher in hooks.json"
  - "four closed Phase-25 deferral markers"
affects:
  - "hooks/hooks.json"
  - "scripts/context-io.ts (comments) + .js"
  - "agent-factory/contracts/context-note.md"
  - "agent-factory/workflows/16-context-read-write.md"
tech-stack:
  added: []
  patterns:
    - "separate-process PreToolUse hook reads the HUMAN-SET session env (un-forgeable; agent child env never reaches it)"
    - "verb-anchored input-surface discipline: fire only on a real Bash admit verb, never on quoted/commented/file content (inverse of P23 CR-01)"
    - "one-grammar parse: severity classified from note `by` via the canonical parseNote, no second YAML grammar"
    - "fail-closed asymmetry: empty/malformed stdin = nothing to gate = allow; matched gated admit + any later failure = deny"
key-files:
  created:
    - "hooks/admission-guard.ts"
    - "hooks/admission-guard.js"
    - "hooks/admission-guard.test.ts"
  modified:
    - "hooks/hooks.json"
    - "scripts/context-io.ts"
    - "scripts/context-io.js"
    - "agent-factory/contracts/context-note.md"
    - "agent-factory/workflows/16-context-read-write.md"
decisions:
  - "D-01/D-10: admission is a SEPARATE new hook process (not an in-script env check, not an edit to guard.ts) — the only mechanically un-forgeable tier"
  - "D-06: high-severity = note authoring role `by` in {security-nfr, architect-design, release-manager}; no self-declared severity field"
  - "OQ-3: the hook imports the ONE shared readGovernanceConfig so hook and admit() cannot diverge"
  - "T-25-04: the verb match excludes quote/comment chars in the matched span so a doc-example / echo / comment never reads as a live admit"
metrics:
  duration: "~8m"
  completed: "2026-06-24"
  tasks: 2
  files: 8
status: complete
---

# Phase 25 Plan 02: Admission-Guard Hook (GOV-01) Summary

A new `hooks/admission-guard.ts` → committed `admission-guard.js` implements the GOV-01 mechanically un-forgeable human-admission gate as a second PreToolUse Bash hook beside the byte-frozen prod-deploy guard, denying an un-approved high-severity admission, refusing any agent self-set of the approval var, failing closed on a matched admit, and staying inert to file content / doc examples.

## What was built

**Task 25-02-01 (commit `e447c9e`)** — `hooks/admission-guard.ts` (244 lines) cloning the deploy guard's safety scaffolding (fail-closed stdin parse, `SELF_APPROVE` refuse-self-set regex, exit-0+JSON `deny()`), diverging on the input surface. Plus `hooks/admission-guard.test.ts` — a 31-case child-spawn oracle vs the committed `.js` (>= guard.test.ts's 27).

**Task 25-02-02 (commit `bbf0ebc`)** — the second `hooks.json` PreToolUse Bash matcher → `admission-guard.js`, and the four closed Phase-25 deferral markers.

## Mechanism (recorded per `<output>`)

**Admit-verb match (input-surface critical).** A real invocation matches the anchored segment regex:

```
/(^|[;&|\n])(\s|&|\|)*(?:(?:env\s+)?[A-Za-z_][A-Za-z0-9_]*=[^\s'"#;&|\n]*\s+)*(?:env\s+)?node\b[^'"#;&|\n]*?\bcontext-io(?:\.js)?\b[^'"#;&|\n]*?\badmit\b/
```

Within ONE unquoted command segment: an optional shell prefix of `VAR=val` / `env VAR=val` assignments, then `node`, then a `context-io(.js)` script token, then the `admit` verb — with NO quote (`'`/`"`) and NO `#` comment char in the matched span. This is why an `echo`/`cat` of admit text, a `#`-comment mention, or a path component named `admit` is inert. The guard's only input is `tool_input.command`, never file content.

**Note-path extraction.** Tokenize the command (single quote-layer stripped), find the `admit` token, take the 2nd positional after it (`admit <task> <noteFile>` → `rest[1]`). Null result on a matched gated admit → `deny()` (fail closed).

**Severity role set (D-06).** `HIGH_SEVERITY_ROLES = {security-nfr, architect-design, release-manager}`, classified from the note's `by` scalar parsed via the canonical `parseNote` (one grammar; no bespoke YAML parse).

**`human_admission` dial → gate mapping** (read via the shared `readGovernanceConfig`, resolved from `${CLAUDE_PROJECT_DIR}`):

| dial value | gate behavior |
|---|---|
| `off` (lean default) | never gates — `process.exit(0)` allow |
| `high-severity` | gate only the three high-severity `by` roles |
| `all` | gate EVERY matched admission |

A gated admission denies unless `process.env.GRUGOPS_ADMISSION_APPROVED_BY` is present; an inline self-set of that var denies even when the var is already in env (refuse-self-set precedes the dial check).

## Both-direction proof vs the committed `.js` (D-12)

Reproduced manually against `hooks/admission-guard.js` (not just the suite):

- **A. PLANTED** high-sev note, `high-severity`, no approval → **DENY** (reason names the note path).
- **B. CLEAN** same note WITH `GRUGOPS_ADMISSION_APPROVED_BY=alice` in env → **ALLOW** (empty stdout).
- **C.** routine `by: software-engineer` under `high-severity` → **ALLOW**.
- **D. ATTACK** `export GRUGOPS_ADMISSION_APPROVED_BY=eve && node …admit …` with the var ALSO in env → **DENY** (refuse-self-set).
- **E. INPUT-SURFACE ATTACK** `echo "node …admit …"` → **ALLOW** (inert).
- **F. INPUT-SURFACE ATTACK** `true # node …admit …` → **ALLOW** (inert).

The 31-case suite covers all nine plan behaviors: deny (high-sev no approval), allow (high-sev + var), allow (routine under high-severity), deny (under `all`), allow (under `off`), refuse-self-set (×4 forms, denied with var in env), fail-closed (missing/no-fence/no-by note + no-path, under gated dials), allow (empty/malformed stdin + non-admit verbs), and input-surface inertness (echo/cat/comment/path).

## Closed-marker wording (the three SCAN/comment files)

All four markers replace "layered in Phase 25" with the now-true mechanism in CLEAR VOICE: *the `human:<name>` stamp's un-forgeable signal is delivered by the separate PreToolUse `admission-guard` hook — a distinct process that reads the human-set session variable the agent's own child env cannot reach — gated by the `human_admission` dial; CC is the primary tier and the four non-CC CLIs degrade to the in-script `admit()` refusal plus a prompt-level "stop, ask a named human," documented honestly as not mechanically un-forgeable (D-04/D-05).*

- `scripts/context-io.ts:108` and `:850` (comments) — closed.
- `agent-factory/contracts/context-note.md` — closed.
- `agent-factory/workflows/16-context-read-write.md` — closed.

**WR-01 discipline (D-13):** the SCAN-set files reference the `admission-guard` hook / Workflow 16 / `human_admission` BY NAME and restate NO raw `.grugops/` write path beside a write token. `npx vitest run scripts/check-foundation-guards.test.ts` = 28 passed (WR-01 + config-dial green).

## Safety invariants confirmed

- `git diff --quiet hooks/guard.ts` exits 0 — byte-frozen, blob `3501810e21308e4b7e219679a6ca30dace9b5d66` unchanged (D-02).
- `npm run freshness` exits 0 — 21 committed `.js` fresh (both `admission-guard.js` and the rebuilt `context-io.js`).
- admission-guard.test.ts = **31 cases** >= guard.test.ts = **27**.
- Full non-e2e suite: **512 passed, 1 skipped** (`npx vitest run --exclude '**/scripts/e2e/**'`). Bare `npm test` deliberately NOT run (live e2e lane).
- The guard imports ONLY `node:fs` + the shared `parseNote`/`readGovernanceConfig` — zero new host runtime deps.

## Deviations from Plan

None affecting scope. One in-task design tightening worth recording:

**[Rule 1 - Bug] Input-surface false-positive on the first verb regex.** The initial `ADMIT_VERB = /\bnode\b[\s\S]*\bcontext-io(?:\.js)?\b\s+admit\b/` false-positived on `echo 'node …admit …'` and `ls # …admit …` (the exact P23 CR-01 / T-25-04 class). Replaced with the segment-anchored `ADMIT_SEGMENT` regex (excludes quote/comment/separator chars in the matched span, allows the `env`/`VAR=val` command prefix so the refuse-self-set forms still match). Caught by the input-surface test cases RED before commit; both directions then green. Files: `hooks/admission-guard.ts`. Commit: `e447c9e`.

## REQUIRED before this floor is considered proven (flag for the verifier)

Per D-12 and [[grugops-safety-invariant-green-suite-insufficient]], a green suite is NECESSARY BUT NOT SUFFICIENT for this guard class (long bypass history across phases 22/23/24). The **independent opus-grade red-team is still PENDING** — it is the blocking checkpoint at **Task 25-03-04** in the next plan and covers BOTH this admission-guard AND the 25-03 SC3 floor. The red-team must, vs the COMMITTED `.js`:
- reproduce the both-direction deny independently (clean=allow / planted=deny), AND
- attack the INPUT SURFACE (doc-example / kit write token / inline-content / argv quirk reading as a live signal) AND the LOGIC (severity edge / dial value / stamp grammar opening a hole) — these are different blind spots (P23 lesson: input-surface vs logic).

I do NOT claim the safety floor is "proven" here. This plan built the guard correctly, made the oracle spawn the committed `.js` with >= guard.test.ts's case count, and reproduced the both-direction deny as evidence — the independent red-team at the 25-03 checkpoint remains the gate.

## Self-Check: PASSED

- hooks/admission-guard.ts — FOUND
- hooks/admission-guard.js — FOUND
- hooks/admission-guard.test.ts — FOUND
- hooks/hooks.json contains admission-guard.js — FOUND
- commit e447c9e — FOUND
- commit bbf0ebc — FOUND

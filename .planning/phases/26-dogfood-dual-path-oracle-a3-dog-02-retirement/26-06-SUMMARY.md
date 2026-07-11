---
phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
plan: 06
subsystem: uat-live-harness
tags: [safety-invariant, prod-deploy-guard, e2e-harness, tdd, no-fabrication]
requires:
  - hooks/guard.ts (the frozen structured deny envelope — anchor source of truth)
  - scripts/e2e/uat-live.test.ts (the Tier-2 live lane under repair)
  - agent-factory/config/factory.config.json (queue.wip_limit → WIP_LIMIT)
provides:
  - scripts/prod-deploy-deny-match.ts (single-source structured prod-deploy-deny matcher)
  - scripts/prod-deploy-deny-match.js (committed freshness-checked twin)
  - scripts/prod-deploy-deny-match.test.ts (offline non-vacuity RED test)
  - prodDeployDenyFired(output) matcher + liveTimeoutMs() + WIP_LIMIT (uat-live.test.ts)
affects:
  - scripts/e2e/uat-live.test.ts (A1/A2/A3/A3-N live cases repaired)
tech-stack:
  added: []
  patterns: [structural-anchor-over-prose, offline-non-vacuity-RED, derived-timeout, scoped-tool-grant]
key-files:
  created:
    - scripts/prod-deploy-deny-match.ts
    - scripts/prod-deploy-deny-match.js
    - scripts/prod-deploy-deny-match.test.ts
  modified:
    - scripts/e2e/uat-live.test.ts
decisions:
  - "A2 matcher is STRUCTURAL — but the first structural form (a regex on \"permissionDecision\":\"deny\") was itself defeated in review; see the Post-Execution Red-Team Hardening section. The shipped matcher PARSES the deny envelope and attributes it to THIS guard (PreToolUse + deny + the GRUGOPS_PROD_DEPLOY_APPROVED reason signature, in one object)."
  - "The live A2 lane is CONFIRMATION-ONLY (D-09), NOT a safety proof: it reads agent-authored `claude -p` bytes. The SOUND proof is the Tier-1 point-of-effect oracle (executes the real guard.js, matches its stdout). Two red-teams confirmed this is irreducible."
  - "claude -p --output-format json hook-decision reachability left UNKNOWN - verify; a live green is a confirmation signal only, never sufficient for the D-01/D-02 captured-live-run retirement gate."
  - "A3-N node-runner Bash grant is --allowedTools \"Bash(node *)\", verified against claude --help v2.1.206 (narrowest scoped form, not the blanket bypass)."
  - "A3 seeded task shrunk to stop at the §14 gate verdict; CALL_TIMEOUT_MS NOT raised as the primary fix."
metrics:
  duration: ~9 min
  completed: 2026-07-10
  tasks: 3
  files: 4
status: complete
---

# Phase 26 Plan 06: Live-Harness A1/A2/A3/A3-N Gap Closure Summary

Repaired the four live-harness defects that made the Tier-2 dual-path lane fail on its first live run — deriving per-test timeouts from `CALL_TIMEOUT_MS`, anchoring the prod-deploy-deny assertion structurally on the guard's machine-readable `"permissionDecision":"deny"` marker (proven non-vacuous offline, incl. the decisive doc-quote case), shrinking the A3 ticket to the §14 gate verdict, and granting the A3-N node runner the narrowest CLI-verified `Bash(node *)` tool — all without running the live lane and without touching the DEFERRED A3/DOG-02 retirement.

## What Was Built

### Task 1 — A1: derived per-test vitest timeouts (commit d18c206)
- Added module-scope `liveTimeoutMs(nClaudeCalls, extraMs = 0)` returning `nClaudeCalls * CALL_TIMEOUT_MS + extraMs`, so the vitest bound is DERIVED from `CALL_TIMEOUT_MS` and can never desync again.
- Hoisted the `queue.wip_limit` read to module-scope `const WIP_LIMIT` (one source for both the A3-N timeout arg and the A3-N body).
- Added the computed 4th-arg per-test timeout to all four live cases: A1 `liveTimeoutMs(2, 4*60_000)`, A2 `liveTimeoutMs(1, 60_000)`, A3 `liveTimeoutMs(2, 60_000)`, A3-N `liveTimeoutMs(WIP_LIMIT, 60_000)`.
- Loud-skip keystone, LIVE gate, `claudePrint` arg-array/no-shell shape, and never-set-approval `env` untouched.

### Task 2 — A2: structured deny matcher + offline non-vacuity RED test (RED f798e60, GREEN 2933d0a)
- New single-source `scripts/prod-deploy-deny-match.ts` exporting `prodDeployDenyFired(output): boolean`, anchored on the guard's machine-readable marker `"permissionDecision":"deny"` (whitespace/quote-tolerant regex `/"?permissionDecision"?\s*:\s*"deny"/`), plus exported consts `PROD_DEPLOY_DENY_KEY` / `PROD_DEPLOY_DENY_VALUE`. Clear voice; Node-stdlib-free; mirrors `dual-path-equivalence.ts`.
- Committed `.js` twin built via `npm run build`; `npm run freshness` reports all 25 committed `.js` fresh.
- New offline `scripts/prod-deploy-deny-match.test.ts` (in `scripts/`, runs under the excluded regression suite — token-free). Proves non-vacuity in BOTH directions: FALSE on empty / deploy-mention / tagline-quote / comma-form-quote / the DECISIVE `docs/dogfood-human-runbook.md:129` verbatim deny block-quote; TRUE on a real deny envelope and its markdown-narrated form; plus anchor-integrity (`prodDeployDenyFired(guard.ts source)` is TRUE and the marker consts are verbatim substrings of `hooks/guard.ts`).
- Rewired the A2 live case: imports `prodDeployDenyFired` from `../prod-deploy-deny-match.js`, replaced the exact-substring assertion with `prodDeployDenyFired(r.out)`, and PRESERVED the `GRUGOPS_PROD_DEPLOY_APPROVED` self-guard (early-return) unchanged.

**TDD sequence honored:** RED commit (`test(26-06):`) shipped a deliberately prose-anchored matcher and the test failed on exactly and only the decisive runbook:129 quote (`expected true to be false` at the DECISIVE case). GREEN commit (`feat(26-06):`) switched to the structural anchor; all 4 test cases pass.

### Task 3 — A3 lighter ticket + A3-N verified Bash grant (commit 1faf61b)
- A3: replaced the heavy take-it-to-a-PR ticket with a lighter ABC-001 task that stops at the §14 gate verdict (no branch/PR/build session). `ABC-001` and `FROZEN_VERDICT = "READY_FOR_HUMAN_REVIEW"` preserved; `CALL_TIMEOUT_MS` NOT raised; both dispatch paths still traverse the gate to the frozen on-disk verdict; the honest-failure surface preserved.
- A3-N: granted the injected node runner `--allowedTools "Bash(node *)"` at the runner dispatch ONLY, keeping the live agent as the driver (the harness never calls the runner directly). 0 notes still fails honestly.

## A3-N flag verification — verbatim `claude --help` (v2.1.206, captured this session, token-free)

```
$ claude --version
2.1.206 (Claude Code)

$ claude --help   (relevant excerpt)
  --allowedTools, --allowed-tools <tools...>
      Comma or space-separated list of tool names to allow (e.g. "Bash(git *)
      Edit")
  --disallowedTools, --disallowed-tools <tools...>
      Comma or space-separated list of tool names to deny (e.g. "Bash(git *)
      Edit")
  --permission-mode <mode>              Permission mode to use for the session
                                        (choices: "acceptEdits", "auto",
                                        "bypassPermissions", "manual",
                                        "dontAsk", "plan")
  --output-format <format>              Output format (only works with --print):
                                        "text" (default), "json" (single
                                        result), or "stream-json" (realtime
                                        streaming) (choices: "text", "json",
                                        "stream-json")
```

**Decision:** `--allowedTools "Bash(node *)"` is the VERIFIED narrowest scoped grant — it mirrors the help's documented `Bash(git *)` example form, scopes the grant to node invocations (the runner is `node runner.mjs …`), and is strictly narrower than a blanket `Bash` grant or any permission-mode bypass. The blanket skip-all-permissions bypass was NOT used (prohibited in committed test code and never named in comments).

## A2 envelope reachability — `UNKNOWN - verify` (honest, not fabricated)

Whether `claude -p --output-format json` surfaces the PreToolUse hook's `permissionDecision` in its output envelope is **UNKNOWN - verify**. The installed CLI's `--help` (v2.1.206) documents `--output-format json` only as a "single result" and does NOT document a hook-decision field; a captured authed run is out of scope for this plan (GAP-D1, the human's job on an authed box). The structured anchor is nonetheless PREFERRED (REACHABLE branch chosen): the offline RED test proves the matcher structurally regardless of live reachability, and if the marker turns out not to be surfaced, the live A2 case fails CLOSED (FALSE on a real deny → honest pending) — strictly better than a vacuous prose TRUE. No field path beyond the frozen `"permissionDecision":"deny"` marker (hooks/guard.ts:90-100) was invented. T-26-A2 mitigated structurally; no residual prose-fallback was needed.

## Deviations from Plan

None — plan executed exactly as written. Rules 1-4 not triggered. No auth gates (the live lane was deliberately never run). No packages installed.

## Scope Boundary (GAP-D1)

`examples/03-ticket-to-pr.md`, the `.planning/REQUIREMENTS.md` retirement note, and DOG-02/A3 status are UNTOUCHED (verified: `git diff` over my four commits names only the four planned files). SC4 retirement stays DEFERRED. The unrelated dirty `package.json` (`count:lines`) and `.planning/config.json` orchestrator change were NOT staged.

## Verification Evidence

- `npx tsc --noEmit` — clean.
- `npm run build && npm run freshness` — exit 0 ("All build outputs fresh: 25 committed .js files match a fresh tsc rebuild").
- `node scripts/check-foundation-guards.js` — "ALL CHECKS PASSED".
- `npx vitest run scripts/prod-deploy-deny-match.test.ts` — 4 passed (RED cases all FALSE incl. decisive runbook:129; both GREEN TRUE; anchor-integrity).
- `npx vitest run --exclude '**/scripts/e2e/**'` — 30 files, 788 passed | 1 skipped. The live e2e lane was NEVER executed.
- Static greps: `liveTimeoutMs(` = 5; `WIP_LIMIT` = 6; `prodDeployDenyFired` = 2; `READY_FOR_HUMAN_REVIEW` = 2; `ABC-001` = 3; `take it to a pr` = 0; `dangerously-skip-permissions` = 0; `LOUD_SKIP_MARKER` = 8; `shell: true` = 0; `GRUGOPS_PROD_DEPLOY_APPROVED` = 3.

## Known Stubs

None. The live cases remain `it.skipIf(!LIVE)` by design (Tier-2 gated lane); this is the intended honest-skip posture, not a stub. The captured live dual-path run to satisfy D-01/D-02 stays the human's job on an authed box (out of scope, GAP-D1).

## Post-Execution Red-Team Hardening (2026-07-11)

The orchestrator spot-check did NOT trust the green suite (project law: a green suite is never proof for a
safety assertion). It reproduced a live bypass, and two independent opus red-teams + a parser-oracle fuzz
then found the originally-shipped matcher materially unsound. This section records the whole trail; the
matcher was rebuilt structurally in three RED→GREEN steps on top of the original four commits.

**Bypass 1 — doc-quotation via CLAUDE.md (found by orchestrator self-repro).** The original regex
`/"?permissionDecision"?\s*:\s*"deny"/` made the key-quotes optional so it could double as an anti-drift
check against `hooks/guard.ts` SOURCE. That admitted the TypeScript object-literal grammar. `CLAUDE.md:96`
documents the hook contract in exactly that grammar, and `claude -p` auto-loads `CLAUDE.md` at `cwd=ROOT`,
so a live agent that merely CITED why it was blocked scored a deny with no hook firing — a fabricated green.
- Fix (RED-2 `e10ba28` → GREEN-2 `0da668d`): require the JSON grammar's QUOTED key; delete the second
  grammar; move anti-drift to the POINT OF EFFECT (execute the real `guard.js`, match its stdout); add a
  drift-proof invariant that the matcher is FALSE over the entire contents of every auto-loaded doc.

**Bypass 2 — scope confusion (found by 2 red-teams + fuzz).** GREEN-2 was necessary but not sufficient.
`hooks/hooks.json` wires TWO PreToolUse hooks — `guard.js` (Bash) and `admission-guard.js` (mcp) — that
emit BYTE-IDENTICAL deny envelopes. A substring/quoted-key match scored an admission-guard deny (which
fails closed readily) as a prod-deploy deny. It also scored allow-envelopes-with-marker-in-reason,
PostToolUse denies, foreign-event denies, and the quoted marker echoed from ~30 committed repo files.
- Fix (RED-3 `f4f5baa` → GREEN-3 `e189bd5`): PARSE the transcript into JSON objects; require, within ONE
  object, `hookEventName==="PreToolUse"` + `permissionDecision==="deny"` + `permissionDecisionReason`
  containing `GRUGOPS_PROD_DEPLOY_APPROVED` (the prod-deploy guard's unique in-envelope signature, absent
  from admission-guard.ts). Same-object matching also defeats "admission deny + runbook quote in one
  transcript."

**Verification of the fix (bash-grounded, on the trustworthy corpus):**
- Parser-oracle fuzz, 30 rows, ground truth = did the REAL prod-deploy guard fire: **0 false-TRUE, 0
  false-FALSE** (was 5 false-TRUE against the regex).
- Replay of every red-team-confirmed bypass: all now FALSE; the real guard deny (compact / pretty /
  markdown-narrated) still TRUE.
- Point-of-effect regression tests added: the real `guard.js` deny scores TRUE; the real `admission-guard.js`
  deny scores FALSE.
- Offline suite 794 passed | 1 skipped; freshness 25/25; typecheck clean; live lane never executed.

**IRREDUCIBLE RESIDUAL (documented, NOT claimed closed).** A live agent that deliberately forges the
complete valid envelope still scores TRUE (confirmed). No matcher over agent-authored `claude -p` bytes can
attribute a deny to the hook — the input channel, not the pattern, is the limit. Consequences, all now
explicit in code + comments: (a) the matcher is SOUND only at the point of effect (real guard stdout), which
is what the Tier-1 oracle (`scripts/check-uat-oracles.ts`) and the matcher's own tests use; (b) the live
Tier-2 A2 case is CONFIRMATION-ONLY (D-09) and is annotated as such; (c) a live green is NOT sufficient for
the D-01/D-02 captured-live-run retirement gate. Red-team B additionally noted the guard is a plugin-only
hook not installed on this box, so an A2 run in `cwd=ROOT` could not fire the hook at all — reinforcing (b).

**Open follow-up for the human (not fixed here, arguably beyond 26-06's harness-fix scope):** if a live
end-to-end deny must ever be ASSERTED (not just confirmed), it needs an unforgeable observation channel
(the guard's own captured stdout/exit, or a hook-audit log the agent cannot author), not the agent's
narrated transcript. Flagged in 26-UAT.md gaps.

## Self-Check: PASSED
- FOUND: scripts/prod-deploy-deny-match.ts, scripts/prod-deploy-deny-match.js, scripts/prod-deploy-deny-match.test.ts, scripts/e2e/uat-live.test.ts
- FOUND commits: d18c206, f798e60, 2933d0a, 1faf61b (original) + e10ba28, 0da668d, f4f5baa, e189bd5 (red-team hardening)

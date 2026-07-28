---
phase: 15-typescript-tooling-migration
plan: 02
subsystem: safety-guard
tags: [typescript, safety-guard, prod-deploy, fail-closed, vitest, parity-oracle, SAFE-02, D-10]
requires:
  - "15-01 toolchain (package.json type:module, tsconfig nodenext/strict/newLine:lf/noEmitOnError, vitest.config.ts, .gitattributes LF pin, freshness gate)"
provides:
  - "hooks/guard.ts (prod-deploy safety guard — byte-for-behavior TS port of guard.mjs, fails closed, D-10)"
  - "hooks/guard.js (committed compiled guard — the artifact the host PreToolUse hook runs; freshness-gate green)"
  - "hooks/guard.test.ts (Vitest safety oracle — 27 cases: all 26 guard.test.sh assertions + the new D-10 missing-artifact case)"
  - "hooks/hooks.json repointed guard.mjs -> guard.js (D-10 fail-closed default)"
affects:
  - "Plan 06 (deletes the kept parity oracle hooks/guard.mjs + hooks/guard.test.sh once cross-suite parity is confirmed)"
  - "Phase 17 --migrate (auto-migration of an already-installed host's PreToolUse hook wiring from guard.mjs to guard.js — explicitly NOT this phase)"
tech-stack:
  added: []
  patterns:
    - "byte-for-behavior port: TS types added, NOTHING semantic changed (DEPLOY array verbatim, APPROVAL literal preserved)"
    - "fail-closed safety guard: fd-0 stdin parse in try/catch -> empty command -> only non-deploys pass"
    - "Vitest parity oracle: spawnSync(node,[committed .js]) reproducing the sh harness deny/allow shapes 1:1"
    - "exit-0 + JSON permissionDecision:deny block mechanism (preserved verbatim)"
key-files:
  created:
    - "hooks/guard.ts"
    - "hooks/guard.js"
    - "hooks/guard.test.ts"
  modified:
    - "hooks/hooks.json"
decisions:
  - "DEPLOY array ported byte-identically (15 RegExp entries, the same as guard.mjs); the must-have '17 patterns' counts conceptual deploy-command families covered (alternation expands several entries) — mechanical parity is byte-equality with guard.mjs, which is proven (diff-clean modulo the TS RegExp[] annotation)"
  - "deny() typed as `never` (it always process.exit(0)) — a TS-only annotation, zero runtime effect"
  - "guard.test.ts excluded from tsc emit by the Plan-01 tsconfig `**/*.test.ts` exclude — no stray guard.test.js, Vitest runs the .test.ts directly via its own transform; the suite spawns the committed guard.js"
metrics:
  duration: ~3m
  completed: 2026-06-13
  tasks: 2
  files: 4
---

# Phase 15 Plan 02: Prod-Deploy Safety Guard TypeScript Port Summary

Ported the highest-severity surface in the phase — the SAFE-02 mechanical prod-deploy guard — to TypeScript at exact behavior parity, with no semantic change to a single deny path. `hooks/guard.ts` is a byte-for-behavior translation of `hooks/guard.mjs`: the literal `GRUGOPS_PROD_DEPLOY_APPROVED` env-var string is preserved verbatim (a rename would silently disable the guard), the full 15-entry `DEPLOY` RegExp array is diff-identical to the source (modulo the `: RegExp[]` annotation), the `SELF_APPROVE` detection is unchanged, the fail-closed fd-0 stdin parse (`readFileSync(0,"utf8")` → `JSON.parse` in try/catch → empty command on any failure) is preserved, and the exit-0 + JSON `permissionDecision:"deny"` block mechanism with self-approve-checked-before-the-deploy-gate is intact. The committed `hooks/guard.js` is the faithful `tsc` build the host PreToolUse hook now runs (`hooks.json` repointed `guard.mjs` → `guard.js`, D-10), and it passes the Plan-01 freshness gate. `hooks/guard.test.ts` is a Vitest safety oracle reproducing all 26 `guard.test.sh` assertions plus a new D-10 missing-artifact case — 27 tests green, the old sh oracle still green against `guard.mjs`, and the new `guard.js` agrees with both.

## What Was Built

### Task 1 — Byte-for-behavior guard port + hook repoint (commit `a38d275`)
- **hooks/guard.ts**: single-file port (no relative imports — avoids the nodenext extension surprise). Preserved verbatim from `guard.mjs`:
  - `const APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED"` — exact literal, NOT renamed (4 occurrences in both `.ts` and `.js`).
  - The `DEPLOY` array — all 15 RegExp entries copied verbatim (kubectl apply/rollout/delete, helm upgrade/install, terraform apply, gcloud `\w+ deploy`, aws deploy, aws s3 sync, serverless/sls/flyctl/fly deploy, vercel `--prod`, npm/yarn/pnpm publish, git push `--force|-f|--force-with-lease`, git push main/master, git push release/). `diff` of the extracted array against `guard.mjs` is clean modulo the `: RegExp[]` annotation.
  - The `SELF_APPROVE` RegExp; the fail-closed stdin parse; the `deny(reason)` function (typed `: never`); self-approve denial BEFORE the deploy gate; `isDeploy && !process.env[APPROVAL]` → deny; final `process.exit(0)` allow.
  - Every deny reason string kept in CLEAR PROFESSIONAL VOICE (never caveman — CLAUDE.md hard rule for a safety surface).
  - TS-only additions: a narrow type on the parsed stdin (`{ tool_input?: { command?: unknown } } | null`), `DEPLOY: RegExp[]`, and `deny(): never`. Zero runtime/semantic change.
- **hooks/guard.js**: committed compiled output (`tsc`, LF-only, 0 CRLF). Freshness gate green (`All build outputs fresh: 2 committed .js file(s)`).
- **hooks/hooks.json**: the single PreToolUse command edit — `node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs"` → `…/guard.js` (D-10: the host hook now runs the committed `.js`).
- `hooks/guard.mjs` KEPT in-tree as the parity-oracle source (deleted in Plan 06).

### Task 2 — Vitest safety oracle (commit `4f17088`)
- **hooks/guard.test.ts**: 27 cases against the COMMITTED `guard.js` via `runGuard(json, env)` = `spawnSync("node",[join(import.meta.dirname,"guard.js")], {input, encoding:"utf8", env:{...process.env,...env}})`. Reproduces every `guard.test.sh` assertion (26):
  - **Triad (3)**: deny matched deploy w/ no approval; allow same deploy with `GRUGOPS_PROD_DEPLOY_APPROVED=1` in env; deny inline `export …=1 && kubectl apply` *even with* the env var set.
  - **Reinforcing (2)**: assignment-prefix self-set denied; non-deploy `ls` allowed.
  - **Default-set denies (3)**: terraform apply, npm publish, vercel `--prod`.
  - **WR-01 denies (12)**: kubectl delete, aws s3 sync, aws deploy, yarn/pnpm publish, gcloud run deploy, gcloud app deploy, git push `--force`, git push `-f`, push main, push master, push release/*.
  - **WR-02 allows (4)**: `aws s3 ls && cat ./deploy/notes.txt`, `gcloud config list # see deploy docs`, push `feature/my-branch`, `kubectl get pods`.
  - **Fail-closed (2)**: `not json at all` → exit 0, no "error"; empty stdin → exit 0, no "error".
  - Match shapes byte-identical to the sh harness: deny ⇒ stdout contains `"permissionDecision":"deny"`; allow ⇒ stdout does NOT contain `"deny"`.
- **NEW D-10 missing-artifact case (1)**: spawns a non-existent `guard.MISSING.js` with a matched deploy payload and asserts the process fails to run (`status !== 0` / `error` set) and emits no allow — proving D-10's "guard.js missing/unrunnable → blocked, never allowed through" under the fail-closed hook contract.
- `hooks/guard.test.sh` KEPT in-tree as the oracle until Plan 06; it still exits `ALL CHECKS PASSED` against `guard.mjs`.

## Deviations from Plan

None — plan executed exactly as written. Both tasks ported byte-for-behavior with no auto-fixes, no architectural changes, no auth gates.

Two clarifications recorded (not deviations):
- The must-have "All 17 DEPLOY patterns" refers to the conceptual count of deploy-command families covered; the `guard.mjs` source array has 15 RegExp entries (several use alternation, e.g. `(apply|rollout|delete)`, `(npm|yarn|pnpm)`). The mechanical parity contract is byte-equality of the `DEPLOY` set with `guard.mjs`, which is proven (diff-clean modulo the TS annotation) — no pattern was dropped or simplified.
- Already-installed-host auto-migration of the PreToolUse hook wiring (guard.mjs → guard.js on a host that installed an earlier kit) is **Phase 17's `--migrate` concern, not this phase** (RESEARCH Runtime State Inventory). This plan only changes the in-repo kit wiring.

## Verification Results

Plan-level `<verification>` block — all PASS:
- `npx tsc --noEmit` exits 0.
- `npx vitest run hooks` exits 0 (27/27 green).
- Pattern-count parity: `guard.ts` `/\b` lines (15) ≥ `guard.mjs` (15); full `DEPLOY` array diff-clean.
- Literal `GRUGOPS_PROD_DEPLOY_APPROVED` present in both `guard.ts` and `guard.js`.
- `hooks/hooks.json` references `guard.js`, not `guard.mjs`.
- `node hooks/guard.js`: denies unapproved deploy; allows human-approved deploy (empty output); refuses inline self-set; fails closed on malformed/empty stdin (exit 0, no error); the missing-artifact path exits non-zero (D-10).
- Freshness gate green (committed `guard.js` == fresh `tsc` rebuild).
- Old oracle kept: `hooks/guard.mjs` + `hooks/guard.test.sh` present; the sh harness still exits ALL CHECKS PASSED, and `guard.js` agrees with `guard.mjs` on a representative deny + allow.

Task acceptance criteria (Task 1 + Task 2): all PASS — env-var literal preserved, DEPLOY count not decreased, deny/allow/fail-closed behaviors correct, hooks.json repointed; distinctive command strings (`git push -f`, `release/`, `feature/my-branch`, `not json`) each present in the suite, `spawnSync` count 3 resolving to `guard.js` (not `.ts`), D-10 case present and green, no stray `guard.test.js` emitted.

## Threat Surface

No new security-relevant surface beyond the plan's `<threat_model>`. All four registered threats remain mitigated and are now mechanically re-proven by the Vitest oracle:
- **T-15-02-guard-EoP** (agent self-approving a deploy): `SELF_APPROVE` ported verbatim, checked before the deploy gate; literal approval var preserved; triad case 3 + assignment-prefix case green.
- **T-15-02-guard-DoS** (malformed stdin crash-allowing a deploy): fail-closed fd-0 parse ported verbatim; the two fail-closed cases green.
- **T-15-02-guard-Tamper** (stale/missing materialized guard.js): D-02 freshness gate green on the committed `guard.js`; D-10 hook-wiring defaults to block; the NEW missing-artifact Vitest case asserts a deploy is NOT allowed when `guard.js` is absent/unrunnable.
- **T-15-02-guard-Tamper2** (regex set silently narrowed during the port): all DEPLOY patterns ported verbatim (byte-parity asserted); the oracle reproduces every WR-01 deny and WR-02 allow — a dropped pattern would fail a case.

## Known Stubs

None. This is a behavior-preserving port of a fully-functional guard; every branch is live and exercised by the 27-case oracle. The kept `guard.mjs` + `guard.test.sh` are the intentional parity oracle (removed in Plan 06), not stubs.

## TDD Gate Compliance

Task 1 was marked `tdd="true"`. The guard port is a behavior-preserving translation whose oracle is the existing `guard.test.sh` (and, from Task 2, `guard.test.ts`) — the "tests" pre-exist as the parity oracle rather than being authored fresh-RED for new behavior. The git log shows the conventional sequence for this plan: `feat(15-02)` (the port, `a38d275`) followed by `test(15-02)` (the Vitest oracle reproducing the parity suite, `4f17088`). The behavior was verified green at every step (the four `<behavior>` tests in Task 1, the 27-case suite in Task 2) and the old sh oracle remained green throughout — parity is mechanically proven, not asserted.

## Self-Check: PASSED

All created/modified files verified on disk: `hooks/guard.ts`, `hooks/guard.js`, `hooks/guard.test.ts`, `hooks/hooks.json`. Both per-task commits verified in git history: `a38d275` (feat), `4f17088` (test).

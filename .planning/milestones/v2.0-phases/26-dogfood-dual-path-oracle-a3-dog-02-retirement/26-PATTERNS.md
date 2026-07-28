# Phase 26: dogfood-dual-path-oracle-a3-dog-02-retirement — Pattern Map (gap-closure)

**Mapped:** 2026-07-10
**Mode:** gap_closure (narrow scope — repairs to one existing harness)
**Files to modify:** 1 (`scripts/e2e/uat-live.test.ts`, 511 lines)
**Analogs found:** 6 / 6 (one flag marked `UNKNOWN - verify`)

## File Classification

| File | New/Mod | Role | Data Flow | Closest Analog | Match Quality |
|------|---------|------|-----------|----------------|---------------|
| `scripts/e2e/uat-live.test.ts` | MODIFIED | test (Tier-2 live E2E) | request-response (spawnSync child CLI) | itself + `worktree-dogfood.test.ts` (deterministic twin) | self / exact |
| non-vacuity RED tests (added into above) | ADDED | test | assertion-only | `check-uat-oracles.test.ts:227-249`, `worktree-dogfood.test.ts:213-256` | exact |

The four defects map to four edit sites already located in `26-UAT.md`:

| Defect | Site (current lines) | Fix category |
|--------|----------------------|--------------|
| A1 | `it.skipIf(!LIVE)(...)` at 226 (no 4th-arg timeout) | vitest per-test timeout |
| A2 | DENY substring assert 320-324 | assertion widening / machine-readable anchor |
| A3 | 341 (no timeout) + 348 `FROZEN_VERDICT` reachability | timeout + scope/budget |
| A3-N | 392 (no timeout) + 473-478 live dispatch relies on agent running bash | deterministic drive + tool-grant flag |

---

## Pattern Assignments

### 1. Live-vs-deterministic E2E structure (the file's own spine — PRESERVE)

**Source:** `scripts/e2e/uat-live.test.ts`

The honesty scaffolding is load-bearing and MUST survive every edit:
- `claudePresentAndAuthed()` probe (83-97), `emitLoudSkipIfUnavailable()` single decision point (103-111), `const LIVE = emitLoudSkipIfUnavailable()` (164).
- `it.skipIf(!LIVE)(name, fn)` gating (226, 297, 341, 392).
- `claudePrint(args, cwd)` arg-array `spawnSync` — no shell, `input: ""`, `timeout: CALL_TIMEOUT_MS`, `env: { ...process.env }` never injecting `APPROVAL` (177-193).
- `CALL_TIMEOUT_MS = Number(process.env.UAT_E2E_CALL_TIMEOUT_MS) || 300_000` (173).

**Replicate:** keep all of the above untouched. **Diverge:** only add the missing per-test timeout arg and repair the two brittle assertions; do NOT restructure the gate or the loud-skip.

### 2. Per-test vitest timeout idiom (A1/A3/A3-N fix)

**Analog:** `scripts/worktree-dogfood.test.ts` — the ONLY 4th-arg `it()` timeout in the repo.

`it()` 4th-arg (line 210) and `beforeAll` 2nd-arg (line 140):
```typescript
  it(
    "claims a task exactly once and accretes N un-clobbered notes with no worktree shadowing",
    async () => { /* ... */ },
    120_000,          // ← per-test timeout, 4th positional arg
  );
```
```typescript
beforeAll(() => { /* ... */ }, 120_000);   // ← 2nd-arg timeout form
```

**`vitest.config.ts` has NO `testTimeout`** (verified — file is 15 lines, only sets `fileParallelism: false`), so every `it()` inherits vitest's built-in **5000ms** default. That is exactly A1: each `claudePrint` is bounded at 300_000ms but the `it()` wrapper times out at 5000ms while `spawnSync` blocks synchronously.

**Replicate:** add an explicit 4th-arg timeout to each live `it.skipIf(!LIVE)(...)`. It must exceed the sum of the `claudePrint` calls in that case:
- A1: 2 calls (primary + fallback) → `>= 2 * CALL_TIMEOUT_MS` plus install spawns (three 60_000ms) → budget generously.
- A2: 1 call → `>= CALL_TIMEOUT_MS`.
- A3: 2 calls → `>= 2 * CALL_TIMEOUT_MS`.
- A3-N: N (=3) calls → `>= N * CALL_TIMEOUT_MS`.

Prefer computing from `CALL_TIMEOUT_MS` (not a hard-coded literal) so raising `UAT_E2E_CALL_TIMEOUT_MS` also raises the vitest bound and they never desync again. `it()`/`beforeAll` accept a numeric 4th/2nd arg — confirmed in-repo, no config change needed.

### 3. Non-vacuity / RED-test patterns (the keystone law — MOST IMPORTANT)

Repo law (MEMORY): a green suite is never proof for a guard/oracle. Two verbatim analogs.

**Analog A — `check-uat-oracles.test.ts:227-249`** (comparator returns NON-empty diff on divergence):
```typescript
  it("equivalence non-vacuity: assertEquivalent returns a NON-empty diff when the two note-sets diverge", () => {
    const noteFor = (body: string): ProjectedNote => ({
      kind: "finding", at: "2026-06-21T10:01:30.000Z",
      verified_by: "§14-gate#R26-DOGF01-0001", confidence: "high",
      refs: ["§14-gate#R26-DOGF01-0001"], body,
    });
    const pathA = [noteFor("READY_FOR_HUMAN_REVIEW: seeded admitted finding for t1")];
    const pathBVerdictDropped = [noteFor("REDACTED: the frozen verdict is gone")];
    const diffField = assertEquivalent(pathA, pathBVerdictDropped);
    expect(diffField.length).toBeGreaterThan(0);
    const diffMissing = assertEquivalent(pathA, []);
    expect(diffMissing.length).toBeGreaterThan(0);
    // Sanity: identical note-sets → empty diff (not always-red either).
    expect(assertEquivalent(pathA, [noteFor("READY_FOR_HUMAN_REVIEW: seeded admitted finding for t1")])).toEqual([]);
  });
```
The shape to copy: (1) prove the check goes RED on a planted defect, (2) prove it goes GREEN on a match — both directions, so the assertion is proven not-vacuous.

**Analog B — `worktree-dogfood.test.ts:213-256`** (`sweepStale` non-vacuous vs injected clock): reclaim proven by asserting the returned array CONTAINS the stale task AND the file actually moved to `pending/` (a conservative no-op cannot read as pass), while the fresh claim is asserted UNTOUCHED. Injected clock (`injectedNow`, 3rd arg) removes wall-clock flakiness.

**Apply to A2:** the new RED test must prove the repaired prod-deploy-guard assertion FAILS when the deny does NOT fire. The A2 assertion currently only ever runs live; add a deterministic, token-free unit-style RED companion that feeds the guard's own JSON envelope shape (see §4) and asserts the anchor matches a real deny AND does NOT match an allow (empty output). This is the single most important addition — an over-strict live-only assertion that no one can run offline is itself un-provable.

### 4. Prod-deploy guard deny contract (A2 machine-readable anchor)

**Source:** `hooks/guard.ts:90-101, 119-137`

The `deny()` envelope (90-101):
```typescript
function deny(reason: string): never {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0); // exit 0 + JSON deny = blocked
}
```

The two FROZEN reason strings:
- Self-approve deny (120): `` `Refused: an agent may not set or export ${APPROVAL}. …` `` where `APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED"`.
- Prod-deploy deny (131) — the one A2 exercises: begins `Production deploy blocked: humans decide, agents execute. ` then continues `This command matches a production-deploy pattern and ${APPROVAL} is not set. …`.

**A2 root cause:** the harness asserts `r.out.includes("Production deploy blocked: humans decide, agents execute.")` (320-324) — an exact-substring match against the *model's markdown-narrated* transcript, which rendered `**Production deploy blocked:**` (bold). The guard fired; the assertion mis-scored.

**Replicate / anchor guidance:** anchor on the machine-readable deny, not on LLM prose. Options for the planner (do NOT invent a new field — these two are verified in `guard.ts`):
- Assert on the stable token pair present regardless of markdown: match `permissionDecision` = `"deny"` in structured output, or a markdown-insensitive regex over the reason (`/Production deploy blocked/i` — tolerating `**…**`), rather than the full verbatim sentence with its trailing period.
- The frozen string `humans decide, agents execute` is a durable substring; a regex that ignores markdown emphasis/punctuation between tokens is the safe widening.
- **Diverge from the current line:** do not assert the whole sentence verbatim. **Preserve:** the safety intent — a matched deploy with `APPROVAL` unset MUST be observed as denied, never allowed.

### 5. Deterministic shared-context analog (what A3-N must NOT collapse into)

**Source:** `scripts/worktree-dogfood.test.ts` (whole file; core at 159-211)

This deterministic, token-free test already PROVES the gating property: N=`wip_limit`(=3) real `git worktree` checkouts + N node children on ONE shared absolute queue+context root → claim-exactly-once (winners length 1, 193), N distinct un-clobbered notes (196-199), negative shadow-check that no worktree grew its own context (204-208), plus `sweepStale`.

The A3-N live case (`uat-live.test.ts:380-510`) is deliberately the **Tier-2 CONFIRMATION** that the SAME on-disk convergence holds when the N processes are REAL `claude` dispatches (D-09) — its own comment (380-391) says the deterministic gating proof is `worktree-dogfood.test.ts`. Note the live case already reuses the identical `runner.mjs` source and the identical claim/context assertions.

**Diverge / keep distinct:** the A3-N fix must NOT delete the live case and lean on the deterministic twin — that would lose the D-09 live confirmation. Keep them distinct: `worktree-dogfood.test.ts` = gating proof (bare node children); A3-N = live confirmation (real `claude` dispatches). The fix is to make the live dispatch reliably RUN the runner (see §6), not to remove it.

### 6. `claude -p` with tool permissions — the A3-N (and A3) dependency

**A3-N root cause (26-UAT):** the live `claude` dispatch (473-478) instructs the agent to *run* `node runner.mjs …` as a bash command, but a headless `claude -p` with default permissions will not execute an arbitrary Bash command → 0 notes on the shared root. It depends on the agent *choosing* to run a bash command it is not permitted/prompted to run.

**Search result — NO tool-grant flag is used anywhere in executable repo code.** `grep` for `--allowedTools`, `--permission-mode`, `--dangerously-skip-permissions` across `*.ts`/`*.js`/`*.json` returns hits ONLY in documentation/research prose (`CLAUDE.md`, `.planning/research/*`, `19-RESEARCH.md`), never in any `claudePrint(...)` call site. Every current `claudePrint` call passes only `["-p", <prompt>, "--output-format", "json"]`.

**Verified-available flags (source: `19-RESEARCH.md:354,483`, confirmed v2.1.178 in that phase's research — NOT re-verified against the CLI in this session):**
`-p/--print`, `--output-format {text,json,stream-json}`, `--permission-mode {default,acceptEdits,plan,auto,dontAsk,bypassPermissions}`, `--allowedTools`, `--dangerously-skip-permissions`, `--plugin-dir`, `--max-turns`, `--max-budget-usd`.

**`UNKNOWN - verify`:** the exact flag/spelling that grants headless Bash so the injected `node runner.mjs` actually runs is NOT demonstrated anywhere in this repo. The planner must NOT hard-code a flag as proven. Candidate approaches to VERIFY live before committing:
- Pass `--allowedTools "Bash"` (or `Bash(node *)`) and/or `--permission-mode bypassPermissions` / `--dangerously-skip-permissions` to the A3-N `claudePrint`. Confirm the runner executes and writes N notes before trusting the assertion.
- Preferred per the gap's "missing" note: **drive the runner deterministically** — the runner is plain node already invoked via bash string; the more robust fix is to reduce reliance on the agent's tool-execution and confirm via a flag that is verified to grant Bash. Mark the chosen flag `UNKNOWN - verify` in the plan until a live run confirms it.

**A3 (601s ≈ 2×300s) note:** both dispatches hit the 300s cap before emitting `READY_FOR_HUMAN_REVIEW` on a heavy "take it to a PR" session. Fix per gap: reduce session scope (a lighter ticket / fewer turns via `--max-turns`) or raise `CALL_TIMEOUT_MS` (`UAT_E2E_CALL_TIMEOUT_MS`), and **fail honestly** if the verdict is still unreached — never fabricate the green. The existing failure message already surfaces `seq`/`sub` captured output (375) — preserve that honest-failure surface.

---

## Shared Patterns

### Honesty keystone (Constraint #6 — CLAUDE.md no-fabrication)
**Source:** `uat-live.test.ts:25-46, 76-111`; MEMORY "green suite insufficient".
**Apply to:** every edit. A skip is not a pass; a timed-out/absent verdict fails the UAT as pending, never fabricated. Any repaired assertion must be provable in BOTH directions (RED on absence, GREEN on presence).

### Arg-array spawnSync, no shell (ASVS V5)
**Source:** `claudePrint` (177-193); `worktree-dogfood.test.ts:101-115`.
**Apply to:** any new spawn. Never route the data path through a shell; keep `input: ""`, per-call `timeout`, and `env` that never sets `GRUGOPS_PROD_DEPLOY_APPROVED`.

### Never set the approval env
**Source:** `uat-live.test.ts:63-65, 182-183, 303-308`; `guard.ts:34`.
**Apply to:** A2 and all cases. The A2 case already loud-skips if `APPROVAL` is set (303-308) — preserve.

## No Analog Found

| Concern | Reason |
|---------|--------|
| headless `claude -p` Bash-grant flag | No executable call site in the repo grants tools; only doc/research prose names the flags. Flag choice is `UNKNOWN - verify` — confirm live, do not assume. |
| global `testTimeout` config | `vitest.config.ts` sets none; the ONLY timeout idiom in-repo is the per-test 4th-arg (`worktree-dogfood.test.ts:210`). Use that, not a config change. |

## Metadata

**Files read:** `26-UAT.md`, `scripts/e2e/uat-live.test.ts`, `scripts/check-uat-oracles.test.ts`, `scripts/worktree-dogfood.test.ts`, `hooks/guard.ts`, `vitest.config.ts`, `CLAUDE.md` (context).
**Greps:** `testTimeout`/per-test timeout across `scripts/**/*.test.ts`; `--allowedTools`/`--permission-mode`/`--dangerously-skip-permissions`/`permissionMode` repo-wide.

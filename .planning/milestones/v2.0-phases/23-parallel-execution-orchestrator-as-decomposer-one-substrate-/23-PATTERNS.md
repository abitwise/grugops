# Phase 23: Parallel Execution & Orchestrator-as-Decomposer (One Substrate, Two Modes) - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 17 (new + modified)
**Analogs found:** 16 / 17 (1 greenfield-with-strong-template)

> Read alongside `23-CONTEXT.md` (19 locked decisions) and `23-RESEARCH.md` (§ Validation Architecture
> names the Wave-0 test files). This file maps each work-item file to a concrete in-repo analog with
> line refs. **Concrete, not abstract:** copy from the named lines, do not invent a new shape.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/now-running.ts` (render) — **NEW**, recommend folding into `claim.ts` | utility (render) | transform / file-I/O | `scripts/context-io.ts` `render()` (l.913–969) + `scripts/claim.ts` `claimTask`/`sweepStale` | role-match (render pattern exact; data source in claim.ts) |
| `scripts/now-running-freshness.ts` (+`.js`+`.test.ts`) — **NEW** | config (drift gate) | batch / file-I/O | `scripts/context-freshness.ts` (whole file) | exact (clone + re-root) |
| `scripts/check-foundation-guards.ts` `guard_wr05` — **MODIFY** | guard | transform (text scan) | the guard's own `guardWr05()` (l.107–140) + `.test.ts` | exact (invert in place) |
| `scripts/check-uat-oracles.ts` `oracleWr05Wording` — **MODIFY** | guard (oracle) | transform (text scan) | the oracle's own body (l.86–153) | exact (flip + extend) |
| `scripts/<convergence>.test.ts` — **NEW** (SC3 dual-path) | test | event-driven (substrate replay) | `scripts/claim.test.ts` (l.1–60) + `context-io.test.ts` | role-match (hermetic temp-dir substrate test) |
| `scripts/<spine>.test.ts` — **NEW** (SC1/SC2 decompose+width) | test | event-driven | `scripts/claim.test.ts` (l.1–60) | role-match |
| `agent-factory/config/factory.config.json` `queue` — **MODIFY** | config | n/a | `wip_limits` / `context` objects (in-file) | exact (sibling object) |
| `agent-factory/config/factory.config.md` `queue` twin — **MODIFY** | config (doc twin) | n/a | `wip_limits` (l.18,44) / `context` (l.26,87,107) doc rows | exact |
| `agent-factory/seed/.grugops/factory.config.json` `queue` — **MODIFY** | config (seed) | n/a | seed `context` (l.52) / `wip_limits` (l.18) | exact |
| `agent-factory/workflows/17-task-claim.md` — **NEW** | workflow | n/a | `18-context-compaction.md` (whole file) | exact (sibling shape) |
| `agent-factory/roles/orchestrator.md` — **MODIFY** (augment) | role | n/a | the file's own §Caveman/§Responsibilities (l.13–40) | exact (in-place augment) |
| `agent-factory/roles/_role-switch-protocol.md` — **MODIFY** (step-4 + drop absolute) | protocol | n/a | the file's own step-4 (l.27–31) + l.43 absolute | exact (in-place) |
| `agent-factory/packaging/subagent.frontmatter.md` — **MODIFY** | config (template) | n/a | the file's own l.15–18,27,58–63 | exact (asymmetric edit) |
| `agent-factory/packaging/slash-command.template.md` — **MODIFY** | config (template) | n/a | sibling subagent.frontmatter.md | role-match |
| `agent-factory/packaging/adapters.md` + `README.md` 5-tool tables — **MODIFY** | config (doc) | n/a | adapters.md l.35–44 / README.md l.40–46 | exact (ASYMMETRIC — CC row only) |
| `.claude/agents/grugops-orchestrator.md` — **MODIFY** | config (adapter) | n/a | the file's own frontmatter (l.1–6) | exact (add grant + marker) |
| `scripts/generate-catalog.ts` (+ regenerated catalog) — **MODIFY** | utility (generator) | transform | its own generator + catalog-freshness check | exact (regenerate) |

---

## Pattern Assignments

### `scripts/now-running.ts` render (D-14) — recommend home: `scripts/claim.ts`

**Analogs:** `scripts/context-io.ts` `render()` (render shape) + `scripts/claim.ts` (data source + safety).

RESEARCH A2 / Alternatives table recommend the render extend **`claim.ts`** — it already owns
`claimed/<task>/claim.md` (the now-running registry source, claim.ts l.119–134). `context-io.ts`
owns a different root (`.grugops/context/`).

**Render pattern to copy** — `context-io.ts` `render()` l.913–969. Reuse verbatim: the GENERATED
header, deterministic sort, `atomicWrite`, single trailing newline, `cell()` escaping (l.884–888):
```typescript
// context-io.ts l.935 — the GENERATED header form (clone, re-point the Re-run command):
md.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/claim.js now-running -->");
// ...deterministic order (l.919-921), then atomicWrite (l.968):
atomicWrite(join(queueRoot, "now-running.md"), md.join("\n"));
```

**Data source + the load-bearing security carve-out** — `claim.ts` claim.md is `---\nby:…\nat:…\ntask:…\n---\n`
(l.131). **CRITICAL (V5 / RESEARCH Security):** the render MUST reuse `claim.ts`'s first-`at`-trusted /
single-line discipline (l.110–118 write-side guard + l.190–202 read-side multi-`at` tamper rule). Do
**NOT** add a permissive multi-match frontmatter parser — a forged second `at:` line is a queue-lock DoS.
Mirror the `sweepStale` parse (`/^at:\s*(.+)$/m` with a multi-`at` count, l.194–195).

**`atomicWrite`** — clone from `context-io.ts` l.622–647 (unlink-then-rename Windows branch) if put in claim.ts.

---

### `scripts/now-running-freshness.ts` (+`.js`+`.test.ts`) (D-14, Pitfall 5)

**Analog:** `scripts/context-freshness.ts` — **clone the whole file**, re-root from `.grugops/context/`
to `.grugops/queue/`.

The mismatch is the whole point (RESEARCH Pitfall 5): `context-freshness.ts` walks `.grugops/context/`
ONLY (l.70–72) and will never see `now-running.md`. Copy and change:

```typescript
// context-freshness.ts l.69-72 — the root the clone must re-point at .grugops/queue/:
const CHECK_ROOT = process.env.CHECK_ROOT;
const CONTEXT_ROOT = CHECK_ROOT ? join(CHECK_ROOT, ".grugops", "context") : join(ROOT, ".grugops", "context");
```
Copy verbatim: the `realpathSync(mkdtempSync(...))` macOS /var-symlink fix (l.82 + comment l.74–81 — load-bearing
or the mirrored render silently no-ops exit 0), the mirror-spawn (l.142–146), the fail-closed non-zero-status
branch (l.148–158), the byte-compare + fail-closed unreadable branch (l.160–190), and the greenfield vacuous
pass (l.90–99). Standalone gate (NOT folded into check-foundation-guards), own `package.json` script — exactly
as context-freshness is wired (l.21–23 comment).

The new `.ts` itself is build-freshness-covered automatically: `scripts/` is in `freshness.ts` `OUTPUT_DIRS`
(freshness.ts l.43). Only the render OUTPUT (`now-running.md`) needs this new content gate.

---

### `scripts/check-foundation-guards.ts` `guard_wr05` (PAR-04, D-16)

**Analog:** the guard's own current body, l.107–140. Invert IN PLACE; keep the explicit SCAN set.

Current (negative form): `guardWr05()` greps `WR05_SCAN` for `WR05_COMMA` / `WR05_ARRAY` (l.115–125,
131–134) and FAILS on any hit. The EREs already match both `Agent|Task` and the comma/array/scoped
(`Agent(worker)`) forms (l.115–119) — **keep both EREs verbatim** (State-of-the-Art: `Task` still aliases).

Invert to **both-direction** (D-16) — copy the `grepFiles(files, re)` helper (l.95–105) and the
`pass`/`fail` spine (l.80–86). New per-file logic:
```typescript
// for each f in WR05_SCAN:
//   isCoordinator = grepFiles([f], /^coordinator:\s*true\b/).length > 0
//   hasGrant      = grepFiles([f], WR05_COMMA).length || grepFiles([f], WR05_ARRAY).length
//   if (isCoordinator && !hasGrant) fail(`${f}: coordinator MUST grant Agent(<allowlist>) — dropped grant kills CC parallelism`);
//   if (!isCoordinator && hasGrant) fail(`${f}: non-coordinator MUST NOT grant Agent — rogue spawn`);
```
Detection = the `coordinator: true` marker (D-15), NEVER a hard-coded filename. SCAN set stays the
explicit 4 files (l.120–125), NEVER a repo-wide grep (the established token-vs-prose care). Clear voice
on findings (CLAUDE.md hard rule — already followed throughout this file).

**Then rebuild the committed `.js`** and prove the THREE RED fixtures against the COMMITTED `.js`
(RESEARCH Adversarial Reproduction — green suite ≠ proof; see project memory CMP-02 7× bypass).

---

### `scripts/check-uat-oracles.ts` `oracleWr05Wording` B3 (PAR-04, D-19)

**Analog:** the oracle's own body, l.86–153. Flip the closure-beat regexes in lockstep, ADD the
asymmetry assertion.

Copy the structure verbatim: the `WR05_SCAN` file list (l.94–99), the per-beat tolerant lookahead
regexes (l.105–118 — keep the `(?=.*X)(?=.*Y)` same-line-lookahead form, NOT exact-string greps),
the CR-01 missing-file fail-red FIRST (l.125–134), the "every file carries every beat" set-size check
(l.140–145). New work (RESEARCH Pitfall 3): add an **asymmetry beat** — the four non-CC rows in
`adapters.md` + `README.md` MUST still say "no spawn / sequential role-load"; FAIL if any non-CC row
gains spawn/coordinator wording (the wording-drift catcher D-19 needs).

---

### `scripts/<convergence>.test.ts` (SC3) and `scripts/<spine>.test.ts` (SC1/SC2) — NEW

**Analog:** `scripts/claim.test.ts` (l.1–60) — the hermetic temp-dir substrate-test template.

Copy verbatim: the COMMITTED-`.js`-import discipline (l.1–5, 37–38 — drive `claim.js`/`context-io.js`,
never the `.ts`), the `freshTmp`/`afterAll` cleanup harness (l.40–48), the `makeQueueRoot` builder
seeding `pending/`, `claimed/`, `done/` + thin pending subtask files with a context `ref:` (l.51–59 —
note the ref shape `ref: .grugops/context/${t}/`). For convergence (D-04): run a seeded 2–3-subtask
decomposition through (a) a parallel-spawn simulation and (b) a sequential drain; assert order-independent
equality of claim/done records + `.grugops/context/<task>/notes/`. Use `context-io.ts` `currentState()`
(l.756–764) deterministic replay for the order-independent note compare. **Must be hermetic — NOT in the
e2e lane** (project memory: `npm test` triggers the live claude-CLI lane; use `npx vitest run --exclude '**/scripts/e2e/**'`).

---

### `queue` config object — 3 surfaces (D-06)

**Analog:** the existing `wip_limits` and `context` objects — the established 3-surface atomic dial.

1. **`agent-factory/config/factory.config.json`** — add a top-level `queue` sibling next to `wip_limits`
   and `context` (both present in the read file): `"queue": { "wip_limit": 3, "claim_cap": 2, "stale_ttl_minutes": 30 }`.
2. **`agent-factory/config/factory.config.md`** (twin) — add a `queue` summary row (mirror the `context`
   row at l.26) + a `### queue sub-fields` section (mirror `### context sub-fields` l.87–91) + the
   read-at-use default-on-absent paragraph (mirror l.117 — every key degrades to its lean default when absent).
   **Crisply document `queue.wip_limit` (width) vs `wip_limits` (per-column flow)** (D-07).
3. **`agent-factory/seed/.grugops/factory.config.json`** — add the same `queue` object next to seed
   `context` (l.52) / `wip_limits` (l.18).

Edit all three atomically (the same blast radius `context`/`wip_limits` occupy). Defaults `3/2/30`
are lean + dogfood-tunable (D-10).

---

### `agent-factory/workflows/17-task-claim.md` — NEW

**Analog:** `agent-factory/workflows/18-context-compaction.md` (whole file) + `16-context-read-write.md`.

Mirror WF18's section shape verbatim: frontmatter `kind: workflow` + `order: 17` + `cadence: both`
(WF18 l.1–5); `## When to use` (l.8–11, with "Every role references this file rather than restating
— there is one protocol, named here, not forked into each role"); `## Steps` numbered, run-in-order
(l.26–45); `## Stop conditions` (l.46–49); `## Done condition` (l.51); `## Commit` (l.54–55, branch
guard first, never a protected branch, never merge/deploy). Single-source the **claim mechanics**
(`claim.ts` `claimTask`/`transition`/`sweepStale`) here; reference `claim.js` like WF18 references
`context-io.js`/`compactor.ts`. Planner decides whether WF17 also single-sources the stale-sweep
(Claude's discretion). Do NOT inline note I/O — chain to WF16 (D-05/Pitfall 6).

---

### `agent-factory/roles/orchestrator.md` — MODIFY (augment, D-11/D-12)

**Analog:** the file's own structure. Augment in place, do NOT rewrite (D-11).

- **§Caveman prompt** (l.13–24): the guard `guard_caveman_preserved` strips and checks THIS fenced block
  — keep cadence (`^You …` lines). Add ~4 tight caveman lines (decompose / queue / width / no-relay /
  spawn-only-on-CC) INSIDE the fence, preserving voice/token economy (project memory: caveman = token economy).
- **§Reads** (l.27–32): add `queue` to the config-keys line (currently lists `wip_limits`/`quality`/… at l.28).
- **§Responsibilities** (l.36+): add the new spine — classify → decompose → enqueue → schedule
  (spawn-on-CC ≤ `wip_limit` / drain-on-4-CLIs) → gate → stale-sweep (D-12). Keep the 17-type
  classification + routing matrix, repurposed "subtask → which role *claims* it" (D-11).
- Add the explicit hard limit (CLEAR voice, not caveman — D-13): holds `Agent(<allowlist>)`, sets
  `queue.wip_limit`, never exceeds width, does NOT relay data (shared context is the only channel).
  Document the two modes (parallel depth ≤5 / sequential concurrency-1).
- **Width cap is PROSE/scheduling**, not a code lock (RESEARCH Pitfall 4 / Responsibility Map).
- **`guard_voice` byte-ceiling note:** `guard_role_size` enforces a per-role byte cap (check-foundation-guards
  l.31) — keep the augment tight or the size guard fails RED.

---

### `agent-factory/roles/_role-switch-protocol.md` — MODIFY (D-18 #3)

**Analog:** the file's own text. Two surgical edits:

- **Drop the absolute** at l.43: `"No `Agent` tool. No sub-agent spawn."` → "coordinator only" wording
  (keep the sequential-role-load description for the four CLIs — RESEARCH State-of-the-Art Deprecated note).
  Also soften l.9 `"grugops does **NOT** spawn sub-agents"`.
- **Step-4 rewire** (l.27–31): currently "produce the handoff." Add the thin claim+schedule wrapper —
  "claim per WF17 → read/write context per WF16 → mark done" (D-05). Keep it THIN; reference WF17/WF16,
  never inline (Pitfall 6). NOTE D-02: role Output sections untouched, handoffs keep being written in 23 —
  add NO new handoff coupling; this is additive.

---

### Packaging templates + 5-tool tables — MODIFY (D-18 #4/#5, ASYMMETRIC D-19)

**Analogs:** the files' own current text.

- **`agent-factory/packaging/subagent.frontmatter.md`** — current l.15–18 + l.58–63 say "grants **no
  spawn tool** … never a spawn tool … whether or not the host can spawn." Current example l.27 is
  `tools: Read, Grep, Glob, Bash, Edit, Write`. Add a **coordinator example** carrying `coordinator: true`
  + `tools: Agent(grugops-software-engineer, grugops-qe-e2e, grugops-security-nfr, …), Read, …` per
  RESEARCH Pattern 1 (l.234–244). Note the main-thread-only allowlist nuance (Pitfall 1).
- **`slash-command.template.md`** — sibling prose edit.
- **`adapters.md`** (l.35–44) + **`README.md`** (l.40–46) 5-tool tables — **ASYMMETRIC: only the Claude
  Code row changes** to "coordinator spawns role agents." The four other rows KEEP "Sequential role-load —
  no spawn" verbatim (adapters.md l.36–39, README.md l.41–44). README.md l.40 already says "Native
  sub-agents — the Orchestrator spawns role agents" — reconcile to the coordinator framing. Do a single-line
  diff review: if the same line changed in >1 CLI row, that is the Pitfall-3 drift bug.

---

### `.claude/agents/grugops-orchestrator.md` — MODIFY (D-18 #6)

**Analog:** the file's own frontmatter (l.1–6). Currently `tools: Read, Grep, Glob, Bash, Edit, Write`
(l.4), no `coordinator` key. Add `coordinator: true` (D-15 marker — loader ignores unknown keys, RESEARCH
verified) and the enumerated `Agent(<allowlist>)` grant (D-17, exact roster from the actual
`.claude/agents/grugops-*` set — RESEARCH A3). This is the file the inverted `guard_wr05` asserts MUST
carry the grant (both-direction D-16). It is in `WR05_SCAN` (check-foundation-guards l.124).
**Adapter byte ceiling:** `guard_adapter_size` caps this file at 4096 B (l.176–177) — keep the addition tight.

---

### `scripts/generate-catalog.ts` (+ regenerated catalog) — MODIFY (PAR-04, D-18 #7)

**Analog:** its own generator + the existing `catalog-freshness` gate. Regenerate the committed catalog
in the SAME flip commit (RESEARCH Runtime State: regenerate atomically with the source flip). Verify via
`node scripts/catalog-freshness.js` (RESEARCH Test Map — existing gate). No structural change to the
generator unless the catalog surfaces the WR-05 wording.

---

## Shared Patterns

### Deterministic zero-token freshness-gated render
**Source:** `scripts/context-io.ts` `render()` (l.913–969) + `atomicWrite` (l.622–647) + `cell()` (l.884–888).
**Apply to:** the `now-running.md` render (D-14). GENERATED header, deterministic sort, single trailing
newline, byte-reproducible. **Always paired with** a clone of `context-freshness.ts`.

### Explicit SCAN set, token-vs-prose care (never repo-wide grep)
**Source:** `check-foundation-guards.ts` `WR05_SCAN` (l.120–125) + the two anchored EREs (l.115–119);
`context-io.ts` non-substring matcher comment (l.114–153).
**Apply to:** the inverted `guard_wr05` and the extended B3 oracle. A repo-wide grep produces prose
false-positives — keep the explicit file list.

### Hermetic temp-dir substrate test driving the COMMITTED `.js`
**Source:** `scripts/claim.test.ts` (l.1–60) — `freshTmp`/`afterAll`, `makeQueueRoot`, import `claim.js`/`context-io.js`.
**Apply to:** both new spine/convergence tests. Never import the `.ts`; never live in the e2e lane.

### Adversarial RED-fixture proof for a safety-guard flip
**Source:** project memory (CMP-02 carve-out bypassed 7× through green suites; closed by structural fix +
fuzz oracle + independent red-team) + RESEARCH § Adversarial Reproduction (l.467–471).
**Apply to:** PAR-04. THREE RED fixtures (planted non-coordinator grant; dropped coordinator grant; removed
`coordinator: true` marker) proven RED against the COMMITTED `guard.js`, plus the asymmetry-drift oracle
RED, plus an independent probe. **A green suite is NOT proof.**

### 3-surface atomic config dial (json + .md twin + seed)
**Source:** the existing `wip_limits` (config.json + factory.config.md l.18,44 + seed l.18) and `context`
(config.json + factory.config.md l.26,87,107 + seed l.52) objects.
**Apply to:** the `queue` object (D-06). Edit all three atomically.

### Single-source workflow referenced, never restated
**Source:** `18-context-compaction.md` l.9,11,40,42 (references WF16, `context-io.js`, `compactor.ts`,
`05-pr-quality-gate.md`; never restates them).
**Apply to:** WF17 (single-sources claim mechanics) and the step-4 rewire (chains WF17→WF16, never inlines).

### UNCHANGED safety floor — `hooks/guard.ts` PreToolUse
**Source:** `hooks/guard.ts` (do NOT modify).
**Apply to:** cite as the "humans hold merge/deploy survives parallelism" proof. Every spawned agent still
hits the mechanical merge/deploy gate (D-13 — merge/deploy limits unchanged).

---

## No Analog Found (greenfield — but a strong template exists)

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `agent-factory/workflows/17-task-claim.md` | workflow | n/a | No claim/schedule workflow exists yet. **But** `18-context-compaction.md` is a near-exact sibling template (frontmatter, When-to-use single-source note, Steps/Stop/Done/Commit sections). Treat as pattern-follow, not from-scratch design. |

> Every other file in CONTEXT's list has a concrete in-repo analog above. The genuine *new logic* is small
> (RESEARCH Summary l.69): the `now-running` render + its queue-rooted freshness gate, the inverted
> both-direction `guard_wr05`, and the SC3 convergence spine fixture. Everything else clones an existing
> shape or edits existing text.

---

## Metadata

**Analog search scope:** `scripts/`, `agent-factory/{roles,workflows,config,seed,packaging}/`, `.claude/agents/`, `agent-factory/README.md`.
**Files scanned:** ~18 (5 read in full: claim.ts, context-io.ts, context-freshness.ts, 18-context-compaction.md, _role-switch-protocol.md; targeted reads of check-foundation-guards.ts, check-uat-oracles.ts, freshness.ts, claim.test.ts, grugops-orchestrator.md, orchestrator.md, config surfaces, packaging tables).
**Pattern extraction date:** 2026-06-21

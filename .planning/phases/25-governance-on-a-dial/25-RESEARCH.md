# Phase 25: Governance-on-a-Dial - Research

**Researched:** 2026-06-23
**Domain:** Mechanical human-in-the-loop admission gate (CC PreToolUse hook) + a 3-surface config dial + a durable audit ledger, layered on the Phase 20–24 decentralized substrate.
**Confidence:** HIGH (the entire build surface is in-repo and read directly; the one external surface — the CC PreToolUse multi-matcher contract — was live-verified against `code.claude.com/docs/en/hooks`).

## Summary

Phase 25 builds **no new substrate**. It layers two governance dials onto the now-stable Phase 20–24 machinery: (GOV-01) a mechanically un-forgeable human-admission gate, and (GOV-02) a durable audit-retention ledger. CONTEXT.md decisions D-01..D-13 are LOCKED and treated as hard constraints below; this research resolves only the genuine unknowns the planner needs: (a) the exact CC second-matcher contract, (b) the admission-guard's input surface (how it learns a note's authoring role without a fence/doc-example false-positive), (c) the bounded audit-ledger field set (D-10 is an explicit research item), and (d) the Nyquist validation architecture for proving SC3 the hard way.

The pivotal finding: a **second PreToolUse matcher group coexists with the existing prod-deploy `guard.js` matcher**; all matching hooks run **in parallel** and **the most-restrictive decision wins (deny > defer > ask > allow)**; a `deny` blocks even under `--dangerously-skip-permissions`; and **one hook's deny does NOT suppress a sibling hook's side effects** — so `admission-guard.js` must be fully self-sufficient and must never rely on `guard.js`. This is exactly the deploy-guard's un-forgeability mechanism extended to memory: the hook is a separate process reading the human-set **session** env var, which an agent's self-set in its own child env never reaches.

The second pivotal finding (the input-surface trap): the guarded command is `node scripts/context-io.js admit <task> <noteFile> [contextRoot]` — the **note path is argv[idx], and the note's authoring role `by` lives inside that file**. The guard must (1) recognize the admit/append command by verb-anchored regex on `tool_input.command`, (2) parse the note-file path out of argv, (3) **re-read that file from disk** and parse its `by` field, (4) classify high-severity = `by ∈ {security-nfr, architect-design, release-manager}` (D-06), and (5) deny unless the human-set `GRUGOPS_ADMISSION_APPROVED_BY=<name>` is present — refusing any inline self-set. This re-read-the-file design is the only one that is fence/comment/doc-example-agnostic: a governance DOC EXAMPLE in a markdown file is never a live `node context-io.js admit …` Bash command, and a kit-content write token (WR-01 watch) is in a different file entirely.

**Primary recommendation:** Clone `hooks/guard.ts` into `hooks/admission-guard.ts` (mirror the stdin-parse / fail-closed / SELF_APPROVE-refuse / exit-0+JSON-deny posture byte-for-pattern), wire it as a **second** Bash matcher group in `hooks/hooks.json`, add `context.human_admission` (default `off`) and `context.audit_retention` (default `git`) under the existing `context` object across all 3 surfaces in lockstep, add a D-04 in-script high-severity refusal in `context-io.ts admit()`, and write a bounded append-only JSONL ledger under `.grugops/audit/` only when `audit_retention: retained`. Prove SC3 with an adversarial both-direction RED-vs-committed-`.js` test plus a dial-value-sweep floor test, independently red-teamed (green suite ≠ proof).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Un-forgeable high-severity admission gate (GOV-01) | CC PreToolUse hook (`hooks/admission-guard.ts`→`.js`) | In-script refusal in `context-io.ts admit()` (D-04, the 4 non-CC CLIs) | A separate hook process reading the human-set **session** env is the only un-forgeable tier (D-01/D-05). An in-script env check is self-settable in admit's own child env. |
| Severity classification | `hooks/admission-guard.ts` (re-reads the note file `by`) AND `context-io.ts admit()` | — | Both tiers classify identically: `by ∈ {security-nfr, architect-design, release-manager}` (D-06). No self-declared severity field. |
| Config dial read (`human_admission`, `audit_retention`) | `context-io.ts` (new: it reads `factory.config.json` for the first time) + `admission-guard.ts` | — | Read-at-use, default-on-absent (D-11). Both surfaces must read the SAME key the SAME way. |
| Audit ledger write (GOV-02 `retained`) | `context-io.ts admit()` write seam (the sole sanctioned writer) | — | Reuses `toJsonl`'s fixed-key order (D-10); writes under `.grugops/audit/` only when `retained`; `git` mode writes nothing new. |
| The un-dialable safety floor (SC3) | unchanged existing surfaces: `guard.ts` (deploy), `validate()` refuse-self, `quality.test_integrity` (no `off`), no-fabrication | — | Governance dials may only ADD strictness, never subtract a floor. Proven structurally + adversarially (D-12). |
| Config 3-surface lockstep | `factory.config.json` + seed JSON + `factory.config.md` twin + a new consistency test | — | Every config key follows the 3-surface atomic-dial pattern (D-11). |

## Standard Stack

This is an in-repo TypeScript-tooling phase. No new external packages. No `npm install`. (CLAUDE.md: markdown-everything except a TypeScript tooling layer compiled by `tsc` to committed `.js`; Node 22+; zero runtime deps on host machines.)

### Core (existing files, all verified by direct read)
| File | Purpose | Why Standard |
|------|---------|--------------|
| `hooks/guard.ts` (→`guard.js`) | The byte-frozen prod-deploy PreToolUse guard to MIRROR (D-02 — do NOT edit). | [VERIFIED: read] The proven un-forgeability template: human-set session env, `SELF_APPROVE` refuse, fail-closed stdin parse, exit-0+JSON deny. |
| `scripts/context-io.ts` (→`context-io.js`) | The sole sanctioned context writer; `admit()` is the only context-reading admission path. | [VERIFIED: read] `admit()` at L852; CLI `admit <task> <noteFile> [contextRoot]` at L992; `toJsonl()` at L896; `HUMAN_STAMP_RE`/`GATE_STAMP_RE` at L111-112; the Phase-25 deferral markers at L108 and L849-850. |
| `hooks/hooks.json` | Where the second PreToolUse matcher is wired. | [VERIFIED: read] Currently one Bash matcher group → `guard.js`. |
| `agent-factory/config/factory.config.json` + `agent-factory/seed/.grugops/factory.config.json` | The two JSON surfaces (verified byte-identical by `diff`). | [VERIFIED: diff IDENTICAL] `context` object at L52-54 holds only `compaction: aggressive`. |
| `agent-factory/config/factory.config.md` | The human-readable twin. | [VERIFIED: read] `context` sub-fields block L88-92; the config-dial contract matrix L115-125; the read-at-use/default-on-absent doctrine L135-137. |
| `scripts/config-queue-consistency.test.ts` | The template for the governance 3-surface consistency test. | [VERIFIED: read] Deep-equal across JSONs, lean-default assertions, twin-documents-each-key, naming-collision distinction. |
| `hooks/guard.test.ts` | The template for the admission-guard test harness. | [VERIFIED: read] Spawns the COMMITTED `.js` as a child, pipes PreToolUse stdin JSON, asserts on `"permissionDecision":"deny"` — proves the mechanism blocks, not the prose. |
| `scripts/freshness.ts` (→`freshness.js`) | The build-output drift gate. | [VERIFIED: read] `OUTPUT_DIRS = ["install","scripts","hooks"]` (L43) recursively collects every committed `.js`; `admission-guard.js` is covered AUTOMATICALLY once it lives in `hooks/`. No edit to freshness needed. |
| `scripts/check-foundation-guards.ts` | `guard_context_writes` (WR-01) — the D-13 false-positive watch. | [VERIFIED: read] `CTX_WRITE_RE` requires a `.grugops/context/` path AND a write token on the SAME line (L567-580); `CTX_SCAN = ROLE_FILES + CTX_WORKFLOWS` (L606); `stripFencedBlocks` exists (L154) for the WR05 guard. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Re-read the note file from disk in the hook | Parse note content inline from `tool_input.command` | REJECTED — the admit CLI takes a file PATH, not inline content; the body is never on the command line. Re-reading the file is both necessary and the fence/doc-example-agnostic choice. |
| New `hooks/admission-guard.ts` | Extend `hooks/guard.ts` | REJECTED by D-02 — `guard.ts` is byte-frozen with a long bypass history; memory-admission and prod-deploy are distinct concerns (D-10 separation). |
| In-script env check in `admit()` as the primary gate | — | REJECTED by D-01 — self-settable in admit's own child env. In-script refusal is the D-04 *defense-in-depth* weaker tier only. |
| JSONL ledger reusing `toJsonl` key order | A new bespoke schema | REJECTED by D-10 — reuse the fixed-key order for byte-reproducibility and consistency; a ledger, not a subsystem. |

**Installation:** none — no external packages. Build with the existing `npm run build` (`tsc`); verify with `npm run freshness`.

## Package Legitimacy Audit

Not applicable — this phase installs no external packages. The only dev/build deps (`typescript`, `vitest`, type-only `@types/node`) already exist and are dev/CI-only, never shipped to hosts (CLAUDE.md constraint). No new dependency is introduced.

## Architecture Patterns

### System Architecture Diagram

```
                          GOV-01: human-admission gate (CC primary)
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  agent runs:  node scripts/context-io.js admit <task> <noteFile> [root]       │
  │                              │ (Bash tool call)                                │
  │                              ▼                                                  │
  │             ┌──────────── CC PreToolUse (Bash) ────────────┐                   │
  │             │  matcher group 1            matcher group 2  │  ← run IN PARALLEL│
  │             │  guard.js (deploy)          admission-guard.js│    independently  │
  │             │   (UNCHANGED)                    (NEW)         │                   │
  │             └──────┬───────────────────────────┬───────────┘                   │
  │                    │ allow                       │                              │
  │                    │              parse cmd verb (admit|append)? ──no──► allow  │
  │                    │                             │ yes                          │
  │                    │              parse <noteFile> from argv                    │
  │                    │              re-READ file → parse `by` (severity D-06)     │
  │                    │              high-severity AND human_admission≠off ?       │
  │                    │                  │ yes                    │ no             │
  │                    │       GRUGOPS_ADMISSION_APPROVED_BY set?   └──► allow       │
  │                    │          │ no            │ yes (+ refuse self-set)         │
  │                    │       DENY (exit0+JSON)  allow                             │
  │  most-restrictive (deny>defer>ask>allow) across BOTH groups wins; deny blocks   │
  │  even under --dangerously-skip-permissions                                      │
  └─────────────────────────────────────────────────────────────────────────────┘
                              │ (allowed)
                              ▼
  ┌──────────────────── context-io.ts admit(task, text, root) ──────────────────────┐
  │  1. validate(text)  ← structural floor (UNCHANGED: refuse-self FAIL set)          │
  │  2. NEW D-04: if finding is high-severity (by∈3 roles) AND human_admission         │
  │       requires a stop AND no human:<name> stamp → REFUSE, name the fault           │
  │       (never silently rewrite — same shape as the existing stampless refusal)      │
  │  3. §14-gate#<id> cross-check vs live green verdict (UNCHANGED, Posture B)          │
  │  4. GOV-02: if audit_retention==retained → append one JSONL event to                │
  │       .grugops/audit/<ledger>.jsonl (toJsonl fixed-key order); git mode → nothing   │
  └──────────────────────────────────────────────────────────────────────────────────┘
                              │
   reads ◄── factory.config.json  context.human_admission (default off) / audit_retention (default git)
            (read-at-use, default-on-absent — context-io.ts reads config for the FIRST time)
```

### Recommended Project Structure (files touched/added)
```
hooks/
├── guard.ts / guard.js          # UNCHANGED (D-02 byte-frozen)
├── guard.test.ts                # UNCHANGED
├── admission-guard.ts           # NEW — clone of guard.ts posture (GOV-01 un-forgeable tier)
├── admission-guard.js           # NEW — committed compiled output (freshness auto-covers hooks/)
├── admission-guard.test.ts      # NEW — child-spawn deny/allow oracle (clone of guard.test.ts)
└── hooks.json                   # EDIT — add a SECOND Bash matcher group → admission-guard.js
scripts/
├── context-io.ts / .js          # EDIT — admit(): D-04 refusal + GOV-02 ledger write + read config
└── config-governance-consistency.test.ts  # NEW — 3-surface lockstep (clone of config-queue-consistency.test.ts)
agent-factory/config/
├── factory.config.json          # EDIT — add context.human_admission + context.audit_retention
└── factory.config.md            # EDIT — twin: context sub-fields + dial-contract matrix + default-on-absent
agent-factory/seed/.grugops/
└── factory.config.json          # EDIT — kept byte-identical to kit JSON
agent-factory/contracts/context-note.md          # EDIT — close the "un-forgeable signal layered in Phase 25" line (D-03)
agent-factory/workflows/16-context-read-write.md  # EDIT — close the same deferral line; reference only (D-13/WR-01)
```

### Pattern 1: Mirror the deploy guard's un-forgeability posture (D-01/D-02)
**What:** A separate PreToolUse hook process that reads a HUMAN-SET session env var, refuses any inline self-set/export, and fails closed.
**When to use:** The GOV-01 un-forgeable tier (CC primary).
**Example:**
```typescript
// Source: hooks/guard.ts L29-141 (the pattern to clone into admission-guard.ts)
import { readFileSync } from "node:fs";

const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY"; // human-set session var (D-01); placeholder name, per-project renamable (Deferred Ideas)

// fail-closed stdin parse (guard.ts L107-115): malformed/empty → cmd="" → matches nothing → allow only non-admits
let cmd = "";
try {
  const input = JSON.parse(readFileSync(0, "utf8")) as { tool_input?: { command?: unknown } } | null;
  cmd = (input?.tool_input?.command ?? "") as string;
  if (typeof cmd !== "string") cmd = "";
} catch { cmd = ""; }

// refuse self-set (guard.ts L85-88, L119-125): an agent may never grant its own approval — deny EVEN IF the var is in env
const SELF_APPROVE = new RegExp(`(^|[\\s;&|(])(export\\s+|env\\s+)?${APPROVAL}\\s*=`);

// deny() = exit 0 + JSON permissionDecision:"deny" with a reason (guard.ts L90-101)
```

### Pattern 2: The admission-guard's input surface — recognize the command, re-read the note file (THE critical design)
**What:** Verb-anchored match on `tool_input.command` for the admit/append CLI, extract the note-file PATH from argv, re-read the file, parse `by`, classify severity.
**When to use:** Every matched admission attempt.
**Why this is the fence/doc-example-agnostic choice (D-13 / P23 CR-01 / P22 lessons):**
- The guard fires only on a real `node …context-io.js admit …` (or `append`) **Bash command** — a governance DOC EXAMPLE inside a markdown file is never a Bash tool call, so it cannot read as a live signal (the inverse false-positive P23 CR-01 hit when a fenced doc example read as a live coordinator).
- The note's `by` (→ severity) is **not on the command line**; it is inside the file at `<noteFile>`. The guard must re-read that file from disk and parse `by` with the SAME recognized-line grammar `context-io.ts` uses (`isRecognizedFrontmatterLine`, L208; column-0 `key: value` only). This is a strict, narrow read — not a substring scan — so it cannot be a "heuristic narrower than the format" (the P22 failure class).
- A kit-content write token (WR-01 watch) lives in role/workflow markdown, a different file the guard never opens; adding governance prose there must reference Workflow 16 / config keys and never restate a raw `.grugops/` write path beside a write token (D-13).
**Example:**
```typescript
// VERB-ANCHORED match (mirror guard.ts DEPLOY L50-77 style — match the subcommand verb, not a substring):
// node <...>/context-io.js  admit|append   ...args...
const ADMIT = /\bnode\b[\s\S]*\bcontext-io(?:\.[cm]?js)?\b[\s\S]*\b(admit|append)\b/;
// then split the command into argv, find the noteFile positional after the verb, readFileSync it,
// parse `by:` via a column-0 key:value read identical to isRecognizedFrontmatterLine (context-io.ts L208-213),
// HIGH = by ∈ {"security-nfr","architect-design","release-manager"}  (D-06; NO self-declared severity field).
// FAIL CLOSED (D-01): unreadable config / unreadable-or-unparsable note / empty stdin on a MATCHED admit → DENY.
```
> NOTE for the planner: confirm the exact admit/append argv shape against `context-io.ts` L992-1007 (`admit <task> <noteFile> [contextRoot]`). The note path is the 2nd positional after `admit`. If `append` takes inline NoteInput flags rather than a file path, the guard must classify from the inline `--kind`/`--by` flags instead — VERIFY the `append` CLI signature during planning (the read above showed `validate`/`admit`/`render` verbs only; `appendNote` is the library fn at L687 — confirm whether a CLI `append` verb exists or whether admission only ever goes through `admit`). This is an Open Question (OQ-1).

### Pattern 3: 3-surface atomic config dial with a consistency oracle (D-11)
**What:** Add both keys under the existing `context` object on both JSON surfaces (kept byte-identical) + document each in the twin; assert with a deep-equal/lean-default/twin-documents test.
**Example:**
```typescript
// Source: scripts/config-queue-consistency.test.ts L32-80 (the exact template)
expect(kit.context).toEqual(seed.context);                       // deep-equal across surfaces
expect(kit.context.human_admission).toBe("off");                 // lean default (GOV-01)
expect(kit.context.audit_retention).toBe("git");                 // lean default (GOV-02)
expect(twin).toMatch(/`human_admission`/);                       // twin documents each key by name
expect(twin).toMatch(/`audit_retention`/);
// D-09 disambiguation: twin must crisply distinguish audit_retention (governance-record durability)
// from compaction (body-verbosity) — mirror the queue.wip_limit vs wip_limits distinction assertion (L71-79).
expect(twin).toMatch(/distinct|independent|not.*compaction|never.*retain-raw/i);
```

### Anti-Patterns to Avoid
- **An in-script env check as the PRIMARY gate** — self-settable; D-01 forbids it as primary (it is D-04 defense-in-depth only).
- **Editing `hooks/guard.ts`** — D-02 byte-frozen; clone, never touch.
- **A self-declared `severity` field on the note** — D-06 forbids it (gameable downward); severity = authoring role `by`, period.
- **Silently rewriting a note that lacks the human stamp** — D-04: refuse and name the fault, never rewrite (no-fabrication smell).
- **A guard that scans note CONTENT inline from the command line or that matches "admit" as a substring** — fence/doc-example false-positive (P23 CR-01) and substring over-match. Re-read the file; verb-anchor the match.
- **Relying on `guard.js`'s deny to suppress `admission-guard.js`'s side effects (or vice-versa)** — VERIFIED: CC runs sibling hooks in parallel; one deny does NOT stop a sibling. Each guard must be fully self-sufficient.
- **Restating a raw `.grugops/audit/` write path beside a write token in shipped role/workflow markdown** — would trip `guard_context_writes` (WR-01); reference Workflow 16 / config keys (D-13).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parse a note's `by`/`verified_by` | A new YAML parser in the hook | The exact column-0 `key: value` recognized-line read from `context-io.ts isRecognizedFrontmatterLine` (L208-213) | Drift between the guard's parse and the writer's parse is the P22/CMP-02 failure class — keep one grammar. |
| Refuse self-set of the approval var | A bespoke regex | Clone `guard.ts SELF_APPROVE` (L88) — `(^|[\s;&|(])(export\s+|env\s+)?${APPROVAL}\s*=` | Proven against the deploy-guard's adversarial suite. |
| Emit a deny | A custom stderr/exit scheme | Clone `guard.ts deny()` (L90-101): exit 0 + JSON `permissionDecision:"deny"` + reason | The agent gets a clear message; matches the proven block mechanism. |
| Ledger line format | A bespoke serializer | Reuse `toJsonl`'s fixed-key order (L896-907) | Byte-reproducibility + consistency (D-10). |
| 3-surface consistency assertions | A new test shape | Clone `config-queue-consistency.test.ts` | The proven, complete dial oracle. |
| Freshness coverage of `admission-guard.js` | A new freshness rule | Nothing — `freshness.ts OUTPUT_DIRS` already includes `hooks/` (L43) | Auto-covered; do not touch freshness. |

**Key insight:** Every piece of this phase has a proven in-repo template. The risk is NOT missing functionality; it is a subtle divergence (a parse that drifts, a fence read as a signal, a self-set that slips through). Clone the posture exactly; prove it adversarially.

## Runtime State Inventory

Not a rename/refactor/migration phase — this is additive (two config keys, one new hook, one in-script refusal, one optional ledger). No stored data, live-service config, OS-registered state, secrets/env-var renames, or build artifacts carry an old string that needs migrating. **None — verified by reading the phase boundary (CONTEXT.md L32-36: "builds NO new substrate") and confirming no existing key/path is renamed.**

One forward-looking note (not a migration): the `.grugops/audit/` ledger directory is NEW and only ever created when `audit_retention: retained`; the lean default `git` writes nothing, so a zero-config repo gains no new artifact.

## Common Pitfalls

### Pitfall 1: A green admission-guard suite is NOT proof (D-12; the terminal lesson)
**What goes wrong:** The guard "passes its tests" but a real bypass exists — exactly P22 (7 bypasses through green suites) and P23 (the fenced-doc-example false-positive caught only by an independent code-review).
**Why it happens:** The test author and the guard author share a blind spot; the suite tests the cases they thought of.
**How to avoid:** Reproduce the deny RED vs the **committed `.js`** in BOTH directions (clean = allow; planted high-severity-without-approval = deny naming the note), then run BOTH (a) an orchestrator logic-probe AND (b) an INDEPENDENT opus-grade red-team on the guard's **input surface** AND its **logic** — they have different blind spots (P23: guard logic vs guard input surface).
**Warning signs:** Fewer test cases than `guard.test.ts` (Pitfall-2 in guard.ts: a silently weakened deny path).

### Pitfall 2: The inverse false-positive — a DOC EXAMPLE or kit write token reads as a live signal (P23 CR-01 / WR-01)
**What goes wrong:** Governance prose added to roles/workflows/twin (a fenced `node context-io.js admit …` example, or a `.grugops/audit/` path beside a write verb) trips `guard_context_writes` (WR-01) or — if the admission-guard ever scanned files — reads a doc example as a live admission.
**Why it happens:** A fence/comment-agnostic scan over kit content.
**How to avoid:** The admission-guard fires ONLY on a real Bash `tool_input.command` (never on file content), so doc examples are inert. For the WR-01 watch: reference Workflow 16 / config keys in prose; never restate a raw `.grugops/` write path beside a write token (D-13 — held empirically in Phase 24).
**Warning signs:** `check-foundation-guards` goes RED after adding governance prose; an admission-guard test that reads a markdown file.

### Pitfall 3: Self-settable approval reaches the guard (the un-forgeability hole)
**What goes wrong:** The agent runs `GRUGOPS_ADMISSION_APPROVED_BY=eve node context-io.js admit …` and the var is in admit's own child env.
**Why it happens:** Treating the env var as the gate without a separate-process check + a self-set refusal.
**How to avoid:** The HOOK (a separate process) reads the **session** env the human set; the agent's inline self-set never reaches the hook's process env. Plus the `SELF_APPROVE` regex denies any inline set/export EVEN IF the var is already present (clone guard.ts L119-125). This is exactly why D-01 mandates a hook, not an in-script check.
**Warning signs:** The approval check lives inside `context-io.ts` as the primary gate.

### Pitfall 4: Fail-OPEN on a malformed note or unreadable config (crash-allow)
**What goes wrong:** A high-severity admission slips through because the note was unparsable or the config read threw.
**Why it happens:** A `try/catch` that defaults to allow.
**How to avoid:** D-01 fail-closed: unreadable config / unparsable note / empty stdin on a MATCHED admit → DENY, never crash-allow. Note the asymmetry from guard.ts (L103-115): an EMPTY/malformed STDIN yields `cmd=""` which matches no admit pattern and is allowed — that is correct (nothing to gate). But once the command IS recognized as a high-severity admit, any subsequent failure (config/note read) must deny.
**Warning signs:** A catch block that returns/exits without denying on a matched admit.

### Pitfall 5: `audit_retention` duplicates `compaction: retain-raw` (D-09)
**What goes wrong:** The plan builds a second body-verbosity knob instead of a governance-record ledger.
**Why it happens:** Both say "retain"; the names collide like `queue` vs `wip_limits` did.
**How to avoid:** `compaction` governs body-verbosity of promoted notes; `audit_retention: retained` governs durability of the admission/disposition RECORD (a JSONL ledger under `.grugops/audit/`). The twin must state the distinction crisply (mirror the queue/wip_limits distinction at factory.config.md L104-109).
**Warning signs:** The ledger writes note bodies; the twin conflates the two keys.

### Pitfall 6: `context-io.ts` reads config for the first time — get the read-at-use/default-on-absent semantics right
**What goes wrong:** A missing `human_admission` key throws, or a missing file is treated as an error, breaking zero-config lean.
**Why it happens:** `context-io.ts` does NOT currently read `factory.config.json` at all (VERIFIED: grep for `factory.config`/`readConfig`/`process.env` in context-io.ts returned nothing). This is a NEW read path.
**How to avoid:** Read-at-use, default-on-absent (D-11; factory.config.md L135): a missing key — or the whole file — reads as the lean default (`human_admission`→`off`, `audit_retention`→`git`), never an error. Both the hook AND `admit()` must read the SAME key the SAME way.
**Warning signs:** A test with no config file fails; zero-config no longer runs lean.

## Code Examples

### The admission-guard deny path (clone of guard.ts deny + fail-closed)
```typescript
// Source: hooks/guard.ts L90-101, L119-137 (pattern to clone)
function deny(reason: string): never {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
  }));
  process.exit(0); // exit 0 + JSON deny = blocked, with a message for the agent.
}
// matched high-severity admit + no human approval → deny (fail-closed); else allow (process.exit(0))
```

### Wiring the second matcher (hooks.json)
```json
// Source: hooks/hooks.json (current) + VERIFIED CC multi-matcher contract (code.claude.com/docs/en/hooks)
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/guard.js\"" }] },
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/admission-guard.js\"" }] }
    ]
  }
}
```
Both groups run in parallel; either denying blocks the call (most-restrictive wins). `${CLAUDE_PLUGIN_ROOT}` quoted = shell form (guard.js uses this exact form).

### The D-10 audit-ledger event (reuse toJsonl's fixed-key order)
```typescript
// Source: context-io.ts toJsonl L896-907 (the fixed-key order to reuse)
// PROPOSED bounded admission/disposition event (D-10 — a ledger, not a subsystem):
JSON.stringify({
  id: note.id,                       // the note id
  kind: note.kind,                   // typed-note kind (finding/decision/...)
  by: note.by,                       // authoring role (drives severity)
  severity: highSeverity ? "high" : "routine",  // classification (by ∈ 3 roles), NOT a note field
  verified_by: note.verified_by,     // the admitting stamp: §14-gate#<id> | human:<name>
  disposed_by: humanName ?? null,    // the disposing human (the session-var name), or null for routine
  at: note.at,                       // ISO timestamp (lexicographic-sortable, like render's order)
});
// Append one line to .grugops/audit/<task-or-global>.jsonl ONLY when audit_retention==retained.
// git mode: write nothing (today's behavior; the audit stays implicit in git history).
```
> Key-set is a RECOMMENDATION (D-10 is an explicit research item). Keep it bounded. The planner should confirm whether the ledger is per-task (under the task dir) or a single global ledger; CONTEXT.md D-08 says "committed append-only ledger under `.grugops/audit/`" — recommend a single global `.grugops/audit/admissions.jsonl` (one durable trail an auditor reads end-to-end) but flag it as a planning decision (OQ-2).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `human:<name>` accepted STRUCTURALLY only (Phase 21) | `human:<name>` becomes un-forgeable — bound to a hook-verified disposition (D-03) | Phase 25 (this phase) | Closes the explicit "un-forgeable signal layered in Phase 25" markers at context-io.ts L108/L849-850, Workflow 16, context-note.md. |
| One PreToolUse matcher (deploy guard) | A SECOND independent matcher (admission guard) | Phase 25 | VERIFIED CC contract: coexist, parallel, most-restrictive-wins. |
| `context` object holds only `compaction` | `context` holds `compaction` + `human_admission` + `audit_retention` | Phase 25 | 3-surface lockstep; lean defaults `off`/`git`. |

**Deprecated/outdated:** Nothing deprecated. The async `proposed/` staging flow is DEFERRED to v2.x (D-07) — this phase ships synchronous-refuse; do not build staging.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The approval session var name `GRUGOPS_ADMISSION_APPROVED_BY` is a placeholder (per-project renamable), mirroring `GRUGOPS_PROD_DEPLOY_APPROVED`. | Pattern 1 | [LOW] Cosmetic — CONTEXT.md D-01 + Deferred Ideas confirm a placeholder name; the planner picks the literal string. |
| A2 | A single global `.grugops/audit/admissions.jsonl` ledger (vs per-task) best serves an auditor. | Code Examples / OQ-2 | [MEDIUM] If regulated teams want per-task ledgers, the path/granularity changes; D-08 only fixes the `.grugops/audit/` root. Planner decides. |
| A3 | Admission to the shared context only ever goes through the CLI `admit` verb (the guard's primary match target); an `append` CLI verb may or may not exist. | Pattern 2 / OQ-1 | [MEDIUM] If a CLI `append` writes findings bypassing `admit`, the guard must also match `append` AND classify from its inline flags. VERIFY the CLI verb set + `appendNote` invocation path during planning. |
| A4 | The note's `by` field is reliably present and column-0 in any note reaching `admit` (so the guard can classify severity by re-reading the file). | Pattern 2 | [LOW] `validate()` already requires `by` (L554) and rejects non-column-0 lines (L546-552); a note without a parseable `by` fails validate() and never admits — the guard can fail-closed (deny) on an unparsable `by`. |

## Open Questions

1. **OQ-1: Does a CLI `append` verb exist alongside `admit`, and if so what is its argv shape?**
   - What we know: `context-io.ts` CLI dispatch (L976-1023) exposes `validate`, `admit`, `render` — NO `append` verb was seen; `appendNote` is a library function (L687). CONTEXT.md D-01 says the hook "matches the `context-io.js admit`/`append` Bash command."
   - What's unclear: Whether admission ever flows through a different command than `admit <task> <noteFile>`.
   - Recommendation: During planning, grep the workflows/roles for how a note is actually written (the sanctioned write path per Workflow 16) and confirm the guard's match set covers EVERY command that admits a finding. If only `admit` admits, match only `admit`; if `append` is also a write path, match both and classify the append's inline `by`. Fail-closed on any matched write whose severity can't be determined.

2. **OQ-2: Per-task ledger vs single global ledger under `.grugops/audit/`?**
   - What we know: D-08 fixes the root (`.grugops/audit/`) and the append-only JSONL shape; D-10 leaves the field set + granularity as a planning item.
   - What's unclear: Granularity (one global trail vs one per task).
   - Recommendation: Recommend a single global `.grugops/audit/admissions.jsonl` (end-to-end auditor trail) with the bounded event set above; confirm with the user if they have a SOC2/regulated layout preference. Keep it a ledger, not a subsystem (D-10).

3. **OQ-3: Does `admit()` need the config root passed in, or does it discover `factory.config.json` from the repo root?**
   - What we know: `admit(task, text, contextRoot)` takes a contextRoot (the `.grugops/context` root); it does NOT currently read config. `factory.config.json` lives at the repo root, not under the context root.
   - What's unclear: How `admit()` and the hook locate `factory.config.json` (repo-root discovery vs an env/arg).
   - Recommendation: Mirror how other tooling resolves the root (`import.meta.dirname/..` in freshness.ts L39, config-queue-consistency.test.ts L23). For the hook, `${CLAUDE_PROJECT_DIR}` is the documented project root passed to hooks (CLAUDE.md). Plan a small, shared, well-tested config-read helper used by BOTH the hook and `admit()` so they cannot diverge.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tooling (committed `.js`) | ✓ (project floor) | 22+ LTS | — (hard prerequisite) |
| TypeScript (`tsc`) | dev build + freshness | ✓ (dev dep) | per package.json | — (dev/CI only) |
| Vitest | the new test files | ✓ (dev dep) | per package.json | — (dev/CI only) |
| Claude Code (PreToolUse hooks) | the GOV-01 un-forgeable tier | ✓ (CC primary) | v2.1.x | The 4 non-CC CLIs degrade to prompt + the D-04 in-script refusal (D-05, documented honestly) |

No new external dependencies. No missing dependencies block this phase.

## Validation Architecture

> Nyquist validation is ENABLED for this phase (no `workflow.nyquist_validation: false` in config). This section is required and is the most load-bearing part of the research per D-12.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (globals:false → import `describe/it/expect` explicitly) |
| Config file | the repo's existing vitest setup (the `npm test` lane includes a live CC e2e lane — see MEMORY: prefer `npx vitest run --exclude '**/scripts/e2e/**'` for regression) |
| Quick run command | `npx vitest run hooks/admission-guard.test.ts scripts/config-governance-consistency.test.ts` |
| Full suite command (regression, no live-e2e) | `npx vitest run --exclude '**/scripts/e2e/**'` |
| Freshness gate | `npm run freshness` (auto-covers `hooks/admission-guard.js`) |
| Foundation guards | `npx vitest run scripts/check-foundation-guards.test.ts` (the WR-01 watch) |

### Phase Requirements → Test Map
| Req / SC | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|-------------|
| GOV-01 / SC1 (deny direction) | Planted high-severity note (`by: security-nfr`) + no `GRUGOPS_ADMISSION_APPROVED_BY` → guard DENIES, naming the note, RED vs the COMMITTED `.js` (D-12) | child-spawn deny oracle (clone guard.test.ts) | `npx vitest run hooks/admission-guard.test.ts` | ❌ Wave 0 |
| GOV-01 / SC1 (allow direction) | Same note + human-set `GRUGOPS_ADMISSION_APPROVED_BY=alice` → guard ALLOWS | child-spawn allow oracle | same | ❌ Wave 0 |
| GOV-01 / SC1 (routine) | Routine note (`by: software-engineer`) under `high-severity` → ALLOWS (no human stop) | child-spawn allow oracle | same | ❌ Wave 0 |
| GOV-01 / SC1 (`all` setting) | ANY verified note under `human_admission: all` → requires the stamp / denies absent it | child-spawn oracle (config-parameterized) | same | ❌ Wave 0 |
| GOV-01 (refuse self-set) | `GRUGOPS_ADMISSION_APPROVED_BY=eve node context-io.js admit …` → DENY even with the var in env | child-spawn deny oracle (clone guard.test.ts L69-78) | same | ❌ Wave 0 |
| GOV-01 (fail-closed) | unreadable note / malformed stdin / unreadable config on a MATCHED high-severity admit → DENY, never crash-allow | child-spawn deny oracle (clone guard.test.ts L165-198 + D-01) | same | ❌ Wave 0 |
| GOV-01 (D-04 in-script) | `admit()` refuses a high-severity finding lacking `human:<name>` under `human_admission`, names the fault, never rewrites | deterministic unit assertion on `admit()` return findings | `npx vitest run scripts/context-io.test.ts` (or the admit test file) | ❌ Wave 0 (or extend existing context-io tests) |
| GOV-02 / SC2 (lockstep) | both keys deep-equal across the 2 JSONs; lean defaults `off`/`git`; twin documents each + the D-09 distinction | deterministic config oracle (clone config-queue-consistency.test.ts) | `npx vitest run scripts/config-governance-consistency.test.ts` | ❌ Wave 0 |
| GOV-02 (ledger) | `retained` → one JSONL event appended (toJsonl key order); `git` → nothing written | deterministic unit on the write seam (temp dir) | `npx vitest run scripts/context-io.test.ts` | ❌ Wave 0 |
| SC3 (floor sweep) | EVERY governance dial value incl. bogus/garbage strings → all four floor invariants still REFUSE (self-stamp refused, no-fabrication holds, `test_integrity` has no `off`, deploy guard unchanged) | **property-based / value-sweep** test | `npx vitest run scripts/floor-invariance.test.ts` | ❌ Wave 0 |
| SC3 (structural) | No code path where setting a governance dial opens a bypass (dials only ADD strictness) | structural assertion + the deny-vs-committed-`.js` proof + INDEPENDENT red-team | manual + `npm run freshness` + independent opus probe | ❌ Wave 0 |
| Freshness | `admission-guard.js` matches a fresh `tsc` rebuild | deterministic (existing gate) | `npm run freshness` | ✓ (auto-covers hooks/) |
| WR-01 | governance prose doesn't trip `guard_context_writes` | deterministic (existing guard) | `npx vitest run scripts/check-foundation-guards.test.ts` | ✓ |

### Which checks demand an INDEPENDENT / opus-grade probe (the green-suite-insufficient lesson)
- **The admission-guard deny path (SC1) AND the SC3 floor — BOTH require it.** Per [[grugops-safety-invariant-green-suite-insufficient]] and P22/P23/P24: a green suite is NOT proof for a safety guard. Run BOTH (a) the orchestrator's own logic-probe AND (b) an INDEPENDENT opus-grade red-team, on BOTH the guard's **input surface** (does a doc example / kit write token / inline-content / argv-quirk read as a live signal? — the P23 CR-01 class) AND its **logic** (does any dial value, severity edge, or stamp grammar open a hole? — the P22 class). The deny must be reproduced RED vs the **committed `.js`** in both directions (clean=allow, planted=deny-naming-the-note), independently — never self-reported green (the P24 closure shape).
- **The config lockstep (SC2)** is a deterministic assertion — no red-team needed; it is byte-comparison + presence.
- **Freshness + WR-01** are deterministic existing gates — no red-team needed.

### Sampling Rate
- **Per task commit:** `npx vitest run hooks/admission-guard.test.ts scripts/config-governance-consistency.test.ts scripts/floor-invariance.test.ts` + `npm run freshness`.
- **Per wave merge:** `npx vitest run --exclude '**/scripts/e2e/**'` (full non-e2e suite) + `npm run freshness` + `npx vitest run scripts/check-foundation-guards.test.ts`.
- **Phase gate (before `/gsd-verify-work`):** full non-e2e suite green + freshness 0-drift + the independent red-team on the admission guard + the both-direction RED-vs-committed-`.js` proof reproduced by an independent verifier.

### Wave 0 Gaps
- [ ] `hooks/admission-guard.test.ts` — the child-spawn deny/allow oracle (clone of `hooks/guard.test.ts`); covers GOV-01 SC1 + refuse-self + fail-closed. MUST have ≥ as many cases as `guard.test.ts` (the Pitfall-2 count watch).
- [ ] `scripts/config-governance-consistency.test.ts` — 3-surface lockstep (clone of `config-queue-consistency.test.ts`); covers GOV-02 SC2 + the D-09 distinction.
- [ ] `scripts/floor-invariance.test.ts` — the SC3 dial-value sweep (incl. bogus/garbage strings) asserting all four floor invariants still refuse. (Property-based / value-sweep; could extend an existing test file if one owns the floor invariants.)
- [ ] Extend `scripts/context-io.test.ts` (or a new `admit` test) — the D-04 in-script high-severity refusal + the GOV-02 ledger write/no-write behavior (temp dir).
- [ ] Framework install: none — Vitest + tsc already present.

## Security Domain

> `security_enforcement` is enabled (absent = enabled). This phase IS a security control (the admission gate) plus an audit ledger.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | The PreToolUse hook is a mechanical access-control gate: a named human must dispose high-severity admissions; an agent cannot self-approve (separate-process session-env check + refuse-self-set). |
| V5 Input Validation | yes | The guard parses the note `by` with the SAME column-0 grammar as the writer (`isRecognizedFrontmatterLine`); fail-closed on any unparsable input on a matched admit. No substring matching (verb-anchored). |
| V7 Error Handling / Logging | yes | The `audit_retention: retained` ledger is the durable, append-only, git-tracked record of every admission/disposition (V7 logging for a regulated/SOC2 team). Clear-voice (CLAUDE.md: no caveman voice in safety/compliance/audit output). |
| V8 Data Protection | n/a | No secrets handled; the approval var is a session env name, never logged with a value. |
| V6 Cryptography | no | No crypto — the un-forgeability is process-isolation (the human-set session env the agent's child env cannot reach), exactly like the deploy guard. Never hand-roll crypto here. |

### Known Threat Patterns for this control
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Agent self-approves by inline-setting the var | Elevation of Privilege | Separate hook process reads the SESSION env (not the agent's child env) + `SELF_APPROVE` regex denies any inline set/export even if the var is present (D-01, clone guard.ts L119-125). |
| Agent relabels `by` to dodge the high-severity gate | Spoofing | Already an impersonation/fabrication FAIL in `validate()` (the running agent IS that role); D-06 — severity = `by`, un-gameable; the `all` setting is the paranoid escape valve. |
| A governance DOC EXAMPLE / kit write token reads as a live admission | Tampering (false-positive) | The guard fires only on a real Bash `tool_input.command`, never on file content; WR-01 prose references Workflow 16 / config keys, never a raw `.grugops/` write path beside a write token (D-13). |
| Malformed note / unreadable config crash-allows a high-severity admission | Elevation of Privilege | Fail-closed: any failure on a MATCHED high-severity admit → DENY (D-01). |
| A dial value (incl. garbage) opens a floor bypass | Elevation of Privilege | SC3 structural guarantee — dials only ADD strictness; proven by the value-sweep floor test + independent red-team (D-12). |
| Sibling-hook side effects assumed suppressed by a deny | (design error) | VERIFIED CC contract: a deny does NOT stop a sibling hook; `admission-guard.js` must be fully self-sufficient. |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GOV-01 | `context.human_admission: off\|high-severity\|all` — agent proposes a verified note; a named human disposes high-severity (security/architecture/release) entries; mirrors the prod-deploy hook extended to memory. | Pattern 1+2 (the hook + input surface), the CC multi-matcher contract (VERIFIED), the D-04 in-script tier, the severity-by-role classification (D-06), the `human:<name>` un-forgeability closure (D-03). Tests: admission-guard.test.ts + the admit() unit. |
| GOV-02 | `context.audit_retention: git\|retained` — all three config files in lockstep; lean defaults preserved; the un-dialable floor unchanged. | Pattern 3 (3-surface dial), the D-10 ledger (reuse toJsonl), the D-09 disambiguation from compaction, the SC3 floor architecture. Tests: config-governance-consistency.test.ts + the ledger unit + floor-invariance.test.ts. |

## Sources

### Primary (HIGH confidence — in-repo, read directly)
- `hooks/guard.ts` (L29-141) — the un-forgeability pattern to mirror.
- `hooks/hooks.json` — the current single matcher group.
- `hooks/guard.test.ts` — the child-spawn deny/allow oracle template.
- `scripts/context-io.ts` — `admit()` L852-882; CLI `admit <task> <noteFile> [contextRoot]` L992-1007; `toJsonl()` L896-907; `validate()` refuse-self set L584-612; `isRecognizedFrontmatterLine` L208-213; the Phase-25 deferral markers L108, L849-850; NO config read today (grep-confirmed).
- `scripts/freshness.ts` (L43) — `OUTPUT_DIRS` includes `hooks/` (auto-covers `admission-guard.js`).
- `scripts/check-foundation-guards.ts` — `guard_context_writes`/WR-01 SCAN set + `CTX_WRITE_RE` token logic L558-616, `stripFencedBlocks` L154.
- `agent-factory/config/factory.config.json` + seed (verified byte-identical via `diff`) — `context` object L52-54.
- `agent-factory/config/factory.config.md` — context sub-fields L88-92, dial-contract matrix L115-125, default-on-absent doctrine L135-137.
- `scripts/config-queue-consistency.test.ts` — the 3-surface consistency-test template.
- `.planning/phases/25-governance-on-a-dial/25-CONTEXT.md` — D-01..D-13 (LOCKED).
- `.planning/REQUIREMENTS.md` §GOV — GOV-01, GOV-02; GOV-03 deferred.

### Secondary (HIGH confidence — live-verified external surface)
- `code.claude.com/docs/en/hooks` (WebFetch + WebSearch, 2026) — multiple PreToolUse matcher groups coexist; all matching hooks run IN PARALLEL (non-deterministic order), identical commands deduped; **most-restrictive decision wins: deny > defer > ask > allow**; a deny blocks even under `--dangerously-skip-permissions`; **one hook's deny does NOT suppress a sibling hook's side effects**; deny = exit 2 OR exit 0 + JSON `permissionDecision:"deny"` (choose one per hook, not both).

### Project memory (HIGH confidence — load-bearing lessons)
- [[grugops-safety-invariant-green-suite-insufficient]] — a green suite is NOT proof for a safety guard (P22 7 bypasses; P23 CR-01 fenced-doc false-positive; P24 both-direction-vs-committed-`.js` closure). Drives D-12 / the Validation Architecture.

## Metadata

**Confidence breakdown:**
- Standard stack (all in-repo templates): HIGH — every file read directly; line anchors confirmed.
- Architecture (hook + dial + ledger): HIGH — CC multi-matcher contract live-verified; templates exist for every piece.
- The input surface (the critical design): HIGH — the admit CLI signature read directly (L992-1007); the re-read-the-file design is the only fence/doc-example-agnostic option.
- Pitfalls / validation: HIGH — grounded in the three documented prior-phase failure classes.
- Open questions (OQ-1 append verb, OQ-2 ledger granularity, OQ-3 config discovery): MEDIUM — bounded planning decisions, recommendations given.

**Research date:** 2026-06-23
**Valid until:** 2026-07-23 (stable in-repo surface; the one external surface — CC hooks contract — is on a fast-moving product, re-verify if CC ships a new hooks model).

## Sources (external links)
- [Claude Code Hooks — code.claude.com](https://code.claude.com/docs/en/hooks)
- [Automate actions with hooks — code.claude.com](https://code.claude.com/docs/en/hooks-guide)

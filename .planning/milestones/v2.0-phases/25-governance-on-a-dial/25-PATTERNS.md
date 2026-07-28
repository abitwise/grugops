# Phase 25: Governance-on-a-Dial - Pattern Map

**Mapped:** 2026-06-23
**Files analyzed:** 12 (4 new, 8 modified)
**Analogs found:** 12 / 12 (every piece has a proven in-repo template — RESEARCH.md "Don't Hand-Roll")

This phase builds NO new substrate; it MIRRORS existing patterns. Each new/modified file below clones a concrete analog. Excerpts are tight (signature, deny/refuse shape, fixed-key order, matcher entry) with `file:line` anchors so the planner's `read_first` lists and `<action>` blocks are precise.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| NEW `hooks/admission-guard.ts` (+ committed `.js`) | hook (PreToolUse guard) | event-driven (stdin JSON → deny/allow) | `hooks/guard.ts` | exact |
| NEW `hooks/admission-guard.test.ts` | test | child-spawn oracle | `hooks/guard.test.ts` | exact |
| NEW `scripts/config-governance-consistency.test.ts` | test | config-read/assert | `scripts/config-queue-consistency.test.ts` | exact |
| NEW `scripts/floor-invariance.test.ts` (SC3 sweep) | test | property/value-sweep | `hooks/guard.test.ts` + `config-queue-consistency.test.ts` | role-match |
| MODIFY `scripts/context-io.ts` `admit()` (D-04 refusal) | service (sole writer) | request-response (validate→refuse) | existing `validate()` refuse-self set (L584-612) + `admit()` (L852-882) | exact (same file) |
| MODIFY `scripts/context-io.ts` (D-10 ledger writer) | service | file-I/O append (JSONL) | `toJsonl()` (L896-907) | exact (same file) |
| MODIFY `hooks/hooks.json` | config | — | existing PreToolUse matcher entry | exact |
| MODIFY `agent-factory/config/factory.config.json` | config | — | existing `context.compaction` key (L52-54) | exact |
| MODIFY `agent-factory/seed/.grugops/factory.config.json` | config | — | kept byte-identical to kit JSON | exact |
| MODIFY `agent-factory/config/factory.config.md` (twin) | config (doc) | — | `context` sub-fields (L88-92) + dial matrix (L115-125) + default-on-absent (L135) | exact |
| MODIFY `agent-factory/contracts/context-note.md` | doc | — | the "layered in Phase 25" line (L107-108) | exact |
| MODIFY `agent-factory/workflows/16-context-read-write.md` | doc | — | the "layered in Phase 25" line (L21) | exact |

---

## Pattern Assignments

### NEW `hooks/admission-guard.ts` (hook, event-driven)

**Analog:** `hooks/guard.ts` (byte-frozen — D-02; clone the posture, never edit it).

**Imports + approval-var declaration** (`hooks/guard.ts:29-34`):
```typescript
import { readFileSync } from "node:fs";
// human-set session var (D-01); placeholder name, per-project renamable (Deferred Ideas)
const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY";
```

**Fail-closed stdin parse** (`hooks/guard.ts:107-115` — clone verbatim, malformed/empty → `cmd=""` → matches nothing → allow only non-admits):
```typescript
let cmd = "";
try {
  const raw = readFileSync(0, "utf8");
  const input = JSON.parse(raw) as { tool_input?: { command?: unknown } } | null;
  cmd = (input?.tool_input?.command ?? "") as string;
  if (typeof cmd !== "string") cmd = "";
} catch {
  cmd = "";
}
```

**Refuse-self-set regex** (`hooks/guard.ts:88` — swap only the var name; deny EVEN IF the var is already present, L119-125):
```typescript
const SELF_APPROVE = new RegExp(`(^|[\\s;&|(])(export\\s+|env\\s+)?${APPROVAL}\\s*=`);
```

**deny() helper — exit 0 + JSON** (`hooks/guard.ts:90-101` — clone verbatim):
```typescript
function deny(reason: string): never {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0); // exit 0 + JSON deny = blocked, with a message for the agent.
}
```

**Verb-anchored command match** — DIVERGENCE from guard's `DEPLOY[]` set. Mirror the verb-anchoring discipline (`hooks/guard.ts:50` comment "Match the SUBCOMMAND VERB, not a substring") but match the admit CLI. Per RESEARCH Pattern 2, the admit CLI signature is `context-io.js admit <task> <noteFile> [contextRoot]` (confirmed `scripts/context-io.ts:992-1001`); the note path is the **2nd positional after `admit`** (`rest[1]`). The guard must then `readFileSync(noteFile)` and parse `by`.

**Parse `by` from the re-read note** — DO NOT hand-roll YAML. Reuse the exact column-0 grammar `context-io.ts` uses so the guard's parse cannot drift from the writer's (the P22/CMP-02 failure class). `isRecognizedFrontmatterLine` (`scripts/context-io.ts:208-213`):
```typescript
export function isRecognizedFrontmatterLine(line: string): boolean {
  if (line.trim() === "") return true; // blank
  if (/^refs:\s*$/.test(line)) return true; // refs: block header
  if (/^\s*-\s+/.test(line)) return true; // refs: list item shape
  if (/^([A-Za-z_]+):\s*(.*)$/.test(line)) return true; // column-0 key: value scalar
  return false;
}
```
High-severity classification (D-06, no self-declared severity field): `by ∈ {"security-nfr","architect-design","release-manager"}`.

**Fail-closed posture** (D-01 / RESEARCH Pitfall 4): the asymmetry from `hooks/guard.ts:103-115` — empty/malformed STDIN yields `cmd=""` which matches no admit and is allowed (correct, nothing to gate); but once the command IS a high-severity admit, any subsequent failure (unreadable config / unreadable-or-unparsable note) must `deny()`, never crash-allow.

**OQ-1 flag for planner:** confirm whether a CLI `append` verb also admits findings (`scripts/context-io.ts:976-1023` dispatch shows only `validate`/`admit`/`render`; `appendNote` is a library fn at L687). If only `admit` admits, match only `admit`.

---

### NEW `hooks/admission-guard.test.ts` (test, child-spawn oracle)

**Analog:** `hooks/guard.test.ts` (clone the harness exactly). MUST have ≥ as many cases as guard.test.ts (the Pitfall-2 count watch — fewer cases = silently weakened deny path).

**Child-spawn runner targeting the COMMITTED `.js`** (`hooks/guard.test.ts:22-57`):
```typescript
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY";
const GUARD_JS = join(import.meta.dirname, "admission-guard.js"); // the COMMITTED artifact, never .ts

function runGuard(json: string, env: Record<string, string> = {}) {
  return spawnSync("node", [GUARD_JS], { input: json, encoding: "utf8", env: { ...process.env, ...env } });
}
function expectDeny(json: string, env = {}): void {
  expect(runGuard(json, env).stdout ?? "").toContain('"permissionDecision":"deny"');
}
function expectAllow(json: string, env = {}): void {
  expect(runGuard(json, env).stdout ?? "").not.toContain('"deny"');
}
const payload = (command: string) => JSON.stringify({ tool_input: { command } });
```

**Refuse-self-set case shape** (`hooks/guard.test.ts:69-74` — denied even with the var in env):
```typescript
it("refuse-self-set: inline export denied even with the var in env", () => {
  expectDeny(payload(`export ${APPROVAL}=eve && node scripts/context-io.js admit T note.md`), { [APPROVAL]: "eve" });
});
```

**Fail-closed cases** (`hooks/guard.test.ts:165-198` — malformed/empty stdin exit 0 no error; the D-10 missing-artifact case). DIVERGENCE: the deny/allow cases must write a real high-severity note file to a temp dir (`by: security-nfr`) so the guard's re-read-from-disk path is exercised (clean = allow with approval / deny without; routine `by: software-engineer` = allow). Both directions RED vs the committed `.js` (D-12).

---

### NEW `scripts/config-governance-consistency.test.ts` (test, config-read/assert)

**Analog:** `scripts/config-queue-consistency.test.ts` (direct template).

**3-surface load + deep-equal + lean-default** (`scripts/config-queue-consistency.test.ts:23-47`):
```typescript
const ROOT = join(import.meta.dirname, "..");
const KIT_JSON = join(ROOT, "agent-factory/config/factory.config.json");
const SEED_JSON = join(ROOT, "agent-factory/seed/.grugops/factory.config.json");
const TWIN_MD = join(ROOT, "agent-factory/config/factory.config.md");
const kit = loadJson(KIT_JSON), seed = loadJson(SEED_JSON);

expect(kit.context).toEqual(seed.context);                 // deep-equal across surfaces
expect((kit.context as any).human_admission).toBe("off");  // lean default (GOV-01)
expect((kit.context as any).audit_retention).toBe("git");  // lean default (GOV-02)
```

**Twin-documents-each-key + the D-09 distinction** (modeled on `scripts/config-queue-consistency.test.ts:60-79`, the wip_limit/wip_limits distinction):
```typescript
const twin = readFileSync(TWIN_MD, "utf8");
expect(twin).toMatch(/`human_admission`/);
expect(twin).toMatch(/`audit_retention`/);
// D-09: audit_retention (governance-record durability) is DISTINCT from compaction (body-verbosity).
expect(twin).toMatch(/distinct|independent|not.*compaction|never.*retain-raw/i);
```

---

### NEW `scripts/floor-invariance.test.ts` (test, SC3 dial-value sweep)

**Analog:** the child-spawn pattern from `hooks/guard.test.ts` + the config-load from `config-queue-consistency.test.ts`. No single exact analog — it is a NEW shape (a value sweep). See "No Analog Found".

Sweep every `human_admission`/`audit_retention` value including bogus/garbage strings; assert the four floor invariants still REFUSE: (1) self-stamp refused (the `admit()`/`validate()` refuse-self set, `scripts/context-io.ts:584-612`), (2) no-fabrication holds, (3) `quality.test_integrity` has no `off` (`agent-factory/config/factory.config.md:121`), (4) the deploy guard `hooks/guard.ts` is byte-unchanged. Structural guarantee: governance dials only ADD admission strictness, never subtract a gate.

---

### MODIFY `scripts/context-io.ts` — `admit()` D-04 refusal (service, request-response)

**Analog (same file):** the existing refuse-self FAIL set in `validate()` — it already names the fault and refuses, NEVER silently rewrites. The D-04 high-severity refusal mirrors this exact shape.

**`admit()` signature + the seam to extend** (`scripts/context-io.ts:852-882`):
```typescript
export function admit(task: string, text: string, contextRoot: string = DEFAULT_CONTEXT_ROOT): string[] {
  assertSafeTask(task);
  const findings = validate(text);          // structural gate first
  if (findings.length > 0) return findings;
  const parsed = parseNote(text);
  // ... existing §14-gate verdict cross-check ...
  return [];                                 // empty = admitted
}
```

**The refuse-and-name shape to clone** (`scripts/context-io.ts:596-600` — the self-stamp refusal; D-04 adds an analogous high-severity-lacking-`human:<name>` refusal that reads `context.human_admission`):
```typescript
findings.push(
  `structural FAIL: verified_by "${vb}" equals the author (by) — an author may not ` +
    `self-stamp its own finding (refuse-self).`,
);
```
D-04 high-severity = `by ∈ {security-nfr, architect-design, release-manager}` AND `human_admission ≠ off` AND no `human:<name>` stamp → push a finding naming the fault; NEVER rewrite the note. This tier is weaker (self-settable) — covers the 4 non-CC CLIs at script level (D-05).

**Accepted stamp grammars** (`scripts/context-io.ts:111-112`) — D-03 completes `human:<name>` un-forgeability:
```typescript
const GATE_STAMP_RE = /^§14-gate#[A-Za-z0-9._-]+$/;
const HUMAN_STAMP_RE = /^human:[A-Za-z0-9._-]+$/;
```

---

### MODIFY `scripts/context-io.ts` — D-10 audit-ledger writer (service, file-I/O append)

**Analog (same file):** `toJsonl()` — the fixed-key-order JSONL emitter. Reuse the fixed-order pattern for byte-reproducibility (D-10).

**`toJsonl()` fixed-key order** (`scripts/context-io.ts:896-907`):
```typescript
function toJsonl(n: NoteRecord): string {
  return JSON.stringify({
    id: n.id, kind: n.kind, by: n.by, at: n.at,
    verified_by: n.verified_by, confidence: n.confidence,
    refs: n.refs, supersedes: n.supersedes,
  });
}
```

**Proposed ledger event** (RESEARCH Code Examples; D-10 is an explicit research/planning item — keep it bounded, a ledger not a subsystem): one append-only JSONL line to `.grugops/audit/admissions.jsonl` ONLY when `audit_retention === "retained"`; `git` mode writes nothing new. Fixed keys: `{ id, kind, by, severity, verified_by, disposed_by, at }`. OQ-2 flag: per-task vs single global ledger — RESEARCH recommends a single global `.grugops/audit/admissions.jsonl`; confirm with user.

---

### MODIFY `hooks/hooks.json` (config)

**Analog:** the existing single PreToolUse Bash matcher entry. Add a SECOND matcher group beside it (CC runs both in parallel; most-restrictive wins; one deny does NOT suppress a sibling's side effects — so admission-guard must be self-sufficient).

**Current** (`hooks/hooks.json:1-15`) — add the second group:
```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/guard.js\"" }] },
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/admission-guard.js\"" }] }
    ]
  }
}
```
Shell form with quoted `${CLAUDE_PLUGIN_ROOT}` matches the existing guard.js entry exactly.

---

### MODIFY the 3 config surfaces (config)

**Analog:** the existing `context.compaction` key placement.

**Both JSON surfaces** — add beside `compaction` (`agent-factory/config/factory.config.json:52-54`, kept byte-identical in `agent-factory/seed/.grugops/factory.config.json`):
```json
"context": {
  "compaction": "aggressive",
  "human_admission": "off",
  "audit_retention": "git"
}
```

**Twin** (`agent-factory/config/factory.config.md`) — three edits mirroring how `compaction` is documented:
- Add two rows to the `context` sub-fields table (analog: L92 `compaction` row).
- Add two rows to the config-dial contract matrix (analog: L125 `context.compaction` row, with the un-dialable-floor language: GOV dials only tighten).
- Extend the default-on-absent doctrine (analog: L135 "a missing `context.compaction` reads as `aggressive`") — add `human_admission` absent → `off`, `audit_retention` absent → `git`.
- D-09 distinction language modeled on the wip_limit/wip_limits distinction block (L104-109): state crisply that `audit_retention` (governance-record durability) is distinct from `compaction` (body-verbosity) and never duplicates `retain-raw`.

---

### MODIFY the two deferral-marker docs (doc)

Close the "layered in Phase 25" lines (D-03). **D-13 / WR-01 watch:** reference Workflow 16 / config keys; NEVER restate a raw `.grugops/` write path beside a write token.
- `agent-factory/contracts/context-note.md:107-108` — "A `human:<name>` stamp is accepted structurally (its un-forgeable human-set signal is layered in Phase 25)."
- `agent-factory/workflows/16-context-read-write.md:21` — "...its un-forgeable human-set signal is layered in Phase 25..."

---

## Shared Patterns

### Un-forgeability posture (separate-process hook reading human-set SESSION env)
**Source:** `hooks/guard.ts:88, 90-101, 107-137`
**Apply to:** `hooks/admission-guard.ts`
The only mechanically un-forgeable tier (CC-only, D-05). An in-script env check is self-settable in admit's own child env — D-01 forbids it as primary. The hook reads the session var the human set; the agent's inline self-set never reaches the hook's process env. `SELF_APPROVE` regex + fail-closed stdin parse + exit-0+JSON `deny()`.

### Refuse-and-name, never silently rewrite (no-fabrication)
**Source:** `scripts/context-io.ts:584-612` (validate refuse-self set)
**Apply to:** `admit()` D-04 in-script tier
Every refusal pushes a finding that NAMES the fault; the note is never rewritten. Same shape across the existing stampless-finding refusal and the new high-severity refusal.

### Single-grammar note parse (no drift)
**Source:** `scripts/context-io.ts:208-213` (`isRecognizedFrontmatterLine`)
**Apply to:** the admission-guard's `by` parse AND `admit()`
One column-0 `key: value` grammar. The guard re-reading the note file MUST use this exact predicate, not a substring scan — the P22/CMP-02 "heuristic narrower than the format" failure class.

### 3-surface atomic config dial + consistency oracle
**Source:** `scripts/config-queue-consistency.test.ts`; `agent-factory/config/factory.config.{json,md}` + seed
**Apply to:** both GOV keys
Deep-equal across the two JSONs, lean-default assertions, twin documents each key by name, naming-collision distinction (here: audit_retention vs compaction).

### Read-at-use, default-on-absent
**Source:** `agent-factory/config/factory.config.md:135` (compaction default-on-absent precedent)
**Apply to:** the hook AND `admit()` config reads (`context-io.ts` reads `factory.config.json` for the FIRST time — RESEARCH Pitfall 6, grep-confirmed no current config read). A missing key — or the whole file — reads as its lean default, never an error. RESEARCH OQ-3 recommends a small shared config-read helper used by BOTH the hook and `admit()` so they cannot diverge.

### Freshness auto-coverage
**Source:** `scripts/freshness.ts:43` (`OUTPUT_DIRS` includes `hooks/`)
`admission-guard.js` is covered automatically once it lives in `hooks/`. No edit to freshness.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/floor-invariance.test.ts` | test | property/value-sweep | No existing dial-value-sweep test owns the floor invariants. It composes two analogs (child-spawn from `guard.test.ts` + config-load from `config-queue-consistency.test.ts`) into a NEW value-sweep shape. May extend an existing test file if one owns the four floor invariants. |

(Every other piece has an exact in-repo template — RESEARCH "Don't Hand-Roll" / "the risk is NOT missing functionality; it is a subtle divergence.")

## Metadata

**Analog search scope:** `hooks/`, `scripts/`, `agent-factory/config/`, `agent-factory/seed/`, `agent-factory/contracts/`, `agent-factory/workflows/`
**Files scanned:** 8 (all read directly; line anchors verified against RESEARCH.md)
**Pattern extraction date:** 2026-06-23

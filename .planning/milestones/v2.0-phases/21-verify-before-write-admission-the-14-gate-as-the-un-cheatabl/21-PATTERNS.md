# Phase 21: Verify-Before-Write Admission (the §14 Gate as the Un-Cheatable Verifier) - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 6 (3 code/test, 3 markdown) + a flag-only no-touch
**Analogs found:** 6 / 6 (every file has a strong in-repo analog; no RESEARCH.md fallback needed)

> Source of truth for this map is `21-CONTEXT.md` (15 LOCKED decisions, D-01..D-15). RESEARCH was
> intentionally skipped. Every excerpt below is a real, current line reference an implementer can
> pattern-match against — copy the *shape*, not the literal text.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/context-io.ts` (EXTEND) | utility (validator + write path) | transform (text→findings) + file-I/O read (admission cross-check) | itself — extend `validate()` (L168-199) + reuse `readContext`/`currentState` (L289-327) | self / exact |
| `scripts/context-io.test.ts` (EXTEND) | test | transform / request-response (spawn CLI) | itself + `catalog-freshness.test.ts` | self / exact |
| `agent-factory/workflows/05-pr-quality-gate.md` (EDIT ONLY) | workflow | event-driven (terminal-result → emit verdict) | itself — Step 4 bounded loop (L42-44) + Step 5 terminal results (L45) | self / exact |
| `agent-factory/workflows/16-context-read-write.md` (NEW) | workflow / protocol doc | request-response (protocol narrative) | `05-pr-quality-gate.md` frontmatter+structure; "referenced-not-restated" model (05 L9, 04 L28) | role-match |
| `agent-factory/roles/*.md` (ADD 1-line pointer) | role | n/a (doc pointer) | `orchestrator.md` L45 role-switch-protocol pointer; `04-ticket-to-pr.md` L28 reference idiom | exact (idiom) |
| `agent-factory/contracts/context-note.md` (EDIT doc) | contract / schema doc | n/a (schema) | itself — §"provenance fence" (L70-101), §"CRITICAL DISTINCTION" forward-ref (L136-139) | self / exact |

**Flag-only, do NOT touch this phase:** `scripts/check-foundation-guards.ts` — a future
`guard_context_protocol_single_source` registers here in **Phase 24**, not now (D-14, CONTEXT L25-26,
L255-256). Mapped below only so the planner knows the registration *shape* and explicitly defers it.

---

## Pattern Assignments

### `scripts/context-io.ts` (utility — EXTEND in place, D-09/D-10/D-11/D-15)

**Analog:** itself (Phase-20 code). The structural validator already exists and is exactly the
"text-only structural check" D-10 keeps pure. Phase 21 adds (a) the refuse-self FAIL set to that pure
function and (b) a NEW context-aware admission layer that reuses the existing read path.

**Build-model header to mirror** (L14-29) — every new helper restates the D-15 contract + voice rule:
```typescript
// Build model (D-13): node:fs + node:crypto + node:path ONLY — ZERO host runtime deps. Authored in
// TypeScript, compiled with `tsc` to a committed scripts/context-io.js that host machines and CI run
// ...
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — trace + safety surface ...).
```
Note the import surface is already exactly the three sanctioned modules (L31-42): `node:crypto`
(`randomUUID` — reuse for the D-03 per-run verdict id), `node:fs`, `node:path`. Add nothing else.

**STRUCTURAL layer to EXTEND** — `validate(text: string): string[]` (L168-199). This is the locked
"pure text→findings" function (D-10). It already returns a findings array, names each fault, and has
the required-field loop + kind-in-set check. Append the D-09 refuse-self checks *inside this same
function* (still text-only — it only inspects `scalars.kind`, `scalars.by`, `scalars.verified_by`):
```typescript
// L184-197 — the existing required-field + kind-in-set shape the refuse-self block mirrors:
for (const field of ["kind", "by", "at", "confidence"] as const) {
  if (scalars[field] === undefined || scalars[field] === "") {
    findings.push(`structural FAIL: missing required provenance field "${field}"`);
  }
}
if (scalars.kind !== undefined && scalars.kind !== "") {
  if (!(NOTE_KINDS as readonly string[]).includes(scalars.kind)) {
    findings.push(`structural FAIL: kind "${scalars.kind}" is not one of the six values ...`);
  }
}
```
The D-09 additions to graft on (all push to the SAME `findings` array, naming the fault):
- only when `scalars.kind === "finding"` (D-08 — only `finding` requires a stamp);
- FAIL if `verified_by` is empty / `self` / `me` / `agent` / `== by` / a DeLM invalid-evidence phrase
  / not matching an accepted grammar (D-05). The reserved-identity rule (D-02): FAIL if
  `scalars.by === "§14-gate"` for ANY note — except the one carve-out (D-04) the gate's own emission
  path takes.

**Phrase-match semantics (CONTEXT Specifics, L221-229) — copy the existing `assertSingleLine`
discipline of "explicit, non-naive matching", NOT a substring `.includes()`:**
```typescript
// L100-106 — the precedent for a precise, false-positive-averse field check:
function assertSingleLine(name: string, value: string): void {
  if (/[\r\n]/.test(value)) { throw new Error(`...must be single-line...`); }
}
```
The DeLM phrase list is: `tbd`, `pending`, `not verified`, `unverified`, `should work`, `should pass`,
`looks right`, `looks correct`, `seems to work`, `to be verified`, `will verify`, `n/a`. Match by
lowercase+trim then `==` OR `startsWith` + non-alpha boundary — NEVER naive substring (a substring
match false-positives on a legit stamp containing a phrase). This is the same "calibrate to a TOKEN,
not the prose word" care `guard_context_writes` and `guard_wr05` take in `check-foundation-guards.ts`.

**Accepted-grammar regexes (D-05) — model after the existing anchored allowlist `TASK_NAME_RE`:**
```typescript
// L84-93 — the existing strict anchored-allowlist pattern the verified_by grammars mirror:
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeTask(task: string): void {
  if (!TASK_NAME_RE.test(task) || task === "." || task === "..") { throw new Error(...); }
}
```
The two grammars (D-05): `^§14-gate#[A-Za-z0-9._-]+$` (gate, workhorse) and `^human:<name>$`
(escalation-only, D-07).

**ADMISSION layer (NEW, context-aware — D-01/D-10) — reuse the existing read path, do not re-glob:**
```typescript
// L289-314 readContext — parse every notes/<id>.md into NoteRecord[]; the admission check reuses
// this to find the verdict record under the task. NoteRecord carries by/kind/verified_by/refs.
export function readContext(task, contextRoot = DEFAULT_CONTEXT_ROOT): NoteRecord[] { ... }
// L319-327 currentState — deterministic replay (sort by at, fold supersedes). Use to resolve the
// LIVE verdict set (a superseded/withdrawn verdict must not admit a finding).
export function currentState(notes: NoteRecord[]): NoteRecord[] { ... }
```
Admission cross-check (D-01/D-03): given a `finding` stamped `§14-gate#<id>`, `readContext(task)` →
keep notes where `by === "§14-gate"` and the verdict's per-run id (carried in the verdict note —
placement is planner-discretion per CONTEXT L135-136) equals `<id>`, AND the verdict represents a
**green** terminal result. No matching live verdict → admission FAIL. D-10 LOCKS the separation of
concerns (structural pure vs admission context-aware); the surface (two functions vs one mode flag) is
explicitly **open** (CONTEXT L138-139).

**Strict-reject, never silent-degrade (D-11) — mirror the existing `appendNote` hard-throw:**
```typescript
// L278-281 — the existing refuse-to-write-an-invalid-note pattern the admission path mirrors:
const findings = validate(text);
if (findings.length > 0) {
  throw new Error(`context-io.appendNote: refusing to write an invalid note:\n${findings.join("\n")}`);
}
```
And the CLI exit-1-naming-the-fault path (L424-435, L453-456) is the existing
"exit 0 valid / exit 1 structural FAIL, message on stderr" contract a new `admit` (or extended
`validate`) CLI verb follows. D-11: hard-reject (exit 1, name the fault); do NOT silently rewrite a
refused `finding` into a `claim` — silent mutation is a fabrication smell. The agent re-records as a
`claim` with `confidence: UNKNOWN - verify` only by its own honest action (WF16 instructs this).

**The §14-gate self-attestation carve-out (D-04) — the prod-deploy root-of-trust precedent:**
The gate verdict is the ONE allowed self-attestation (`by: §14-gate` notes are exempt from refuse-self
because the gate is the root of the verification chain). This mirrors how `hooks/guard.ts` trusts the
human-set env var as ITS root (guard.ts L130-137). The verifier-is-trusted-root model is why the
verdict-is-a-finding design does not create an infinite "every finding needs a stamp" regress.

---

### `scripts/context-io.test.ts` (test — EXTEND, D-09/D-02, RED-fixture-first)

**Analog:** itself (the existing SC-1 / CR-01 describe blocks) + `catalog-freshness.test.ts`.

**Idiom to extend** (L19, L94-124) — drive the COMMITTED `.js` (never the `.ts`), RED until the build
lands, `mkdtempSync` temp dirs only, assert on `status` + combined `stdout`/`stderr`:
```typescript
// L78-84 — the spawn-the-compiled-CLI helper the new RED fixtures reuse verbatim:
function runValidate(noteFile: string) {
  return spawnSync("node", [CONTEXT_IO_JS, "validate", noteFile], { cwd: ROOT, encoding: "utf8" });
}
// L116-123 — the BAD-fixture shape: mutate goodNoteText(), expect nonzero, expect the fault NAMED:
it("SC-1b BAD: a kind outside the six values is a FAIL naming the bad kind", () => {
  writeFileSync(f, goodNoteText({ kind: "rumour" }));
  const r = runValidate(f);
  expect(r.status).not.toBe(0);
  expect(`${r.stdout}${r.stderr}`).toContain("rumour");
});
```

**`goodNoteText()` fixture factory to mutate from** (L56-76) — the BAD cases override one field:
```typescript
function goodNoteText(over: Partial<Record<string, string>> = {}): string { ... }
// default is a `finding` with verified_by:"" — exactly the hollow-stamp RED case D-09 needs.
```

**The CR-01 forgery-defense block is the closest precedent for the new RED fixtures** (L217-309) — note
it already constructs hand-built on-disk notes (duplicate `kind:` / injected `verified_by: §14-gate#X`)
and asserts the structural FAIL. The Phase-21 RED fixtures to ADD, each mirroring this shape:
- a `finding` with empty `verified_by` → admission/structural FAIL (D-09 hollow stamp);
- a `finding` with `verified_by: self` (and `verified_by == by`) → FAIL (D-09 refuse-self);
- a `finding` with `verified_by: pending` / `n/a` → FAIL (D-09 DeLM phrase-list);
- a note authored `by: §14-gate` from a non-gate path → structural FAIL (D-02 impersonation flag);
- a `finding` stamped `§14-gate#<id>` with NO matching green verdict record → admission FAIL (D-01);
- (GREEN) a `finding` stamped `§14-gate#<id>` WITH a matching green verdict note in the temp task dir →
  admitted (the workhorse happy path). Use `mod.appendNote(...)` (L126-165 idiom) to plant the verdict.

`catalog-freshness.test.ts` (L31-59) is the secondary analog for the **plant-and-restore under a guard**
idiom if any fixture touches a committed file — but prefer the `context-io.test.ts` temp-dir idiom (no
committed file is touched).

---

### `agent-factory/workflows/05-pr-quality-gate.md` (workflow — EDIT ONLY, D-03/D-12)

**Analog:** itself. This file is the SINGLE SOURCE of the gate (L9: "Every other workflow that needs
the gate references this file rather than restating the loop"). The verdict-emission step lands HERE,
never forked (D-15, CONTEXT L130, L211).

**Step 4 bounded self-fix loop** (L42-44) — the referenced analog WF16 points at (D-12, NOT a new dial,
NOT a forked loop):
```markdown
4. **Bounded self-fix.** If the gate fails, the agent gets a small, fixed number of self-fix
   attempts — `self_fix_attempts` from config (default `2`, "two rounds then human"). After that,
   STOP and hand to a human. Do not loop forever. ...
```

**Step 5 terminal results** (L45) — the green result that triggers verdict emission (D-03):
```markdown
5. **Result.** The gate produces exactly one terminal result: `READY_FOR_HUMAN_REVIEW`,
   `BLOCKED_NEEDS_FIX`, or `SPLIT_REQUIRED`. All checks pass → `READY_FOR_HUMAN_REVIEW`. ...
```
**EDIT to add (D-03):** on a **green** `READY_FOR_HUMAN_REVIEW` only, the gate emits a verdict via
`context-io.ts`, authored `by: §14-gate`, carrying a **unique per-run id** (not the ticket id — id
format/length is planner-discretion against `node:crypto`, CONTEXT L134). The verdict **dogfoods the
note schema** (it is a context note, not a separate ledger) so the cross-check is `readContext` + match.
Reference `context-io.ts` by name — do NOT inline write logic (the `guard_context_writes` scan set
already includes this file, L518; raw-write tokens here would FAIL the build).

**"Advise loudly, never hide" floor** (L47) and the `UNKNOWN - verify` over a faked pass (L33, L39,
L41) — the posture D-11 mirrors (a refused finding degrades to a claim, never fakes a pass).

---

### `agent-factory/workflows/16-context-read-write.md` (workflow — NEW, D-13, clear voice)

**Analog:** `05-pr-quality-gate.md` for structure + the "single-source, referenced-not-restated" model.
WF16 continues the frozen 00-15 ordinal sequence at **16** (CONTEXT L213-214).

**Frontmatter to mirror** (`05-pr-quality-gate.md` L1-6):
```markdown
---
kind: workflow
order: 5
cadence: both
---
# Workflow: PR quality gate
```
WF16 → `order: 16`, a `# Workflow: context read/write` H1, then the standard section spine seen across
all workflows (`## When to use`, `## Steps`, `## Stop conditions`, `## Done condition`, `## Commit`).
Internal section ordering is planner-discretion (CONTEXT L137).

**The "single source, every consumer references it" charter** (`05` L9) — the exact sentence shape WF16
should carry so it is itself the un-restated protocol:
```markdown
This workflow is the single source of the backpressure loop ... Every other workflow that needs the
gate references this file rather than restating the loop.
```

**The "reference, don't restate" consumer idiom** (`04-ticket-to-pr.md` L28) — how WF16 should point at
05's bounded loop (D-12) instead of copying it:
```markdown
4. Run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop, the
   bounded self-fix, and the terminal result live there — this workflow references that gate and does
   not restate it.
```

**WF16 narrative content** (CONTEXT L114-117, L239-245): read-before-act → do the work →
write-after-verify (notes via `context-io.ts`; `finding` ONLY with a real stamp; soft results as
`claim`/`observation`) → admission rules + the escape hatch (obtain a real stamp within the bounded
`05` budget, OR honestly re-record as a `claim` with `confidence: UNKNOWN - verify`). Clear professional
voice throughout (it is a trace surface — guard_voice scans workflows; see Shared Patterns).

---

### `agent-factory/roles/*.md` (role — ADD a cheap one-line pointer, D-14)

**Analog:** the existing single-source-protocol pointer idiom. Two concrete precedents:

**1. The role-switch-protocol pointer** (`orchestrator.md` L45) — a role naming a shared protocol file
inline, one line, not restating it:
```markdown
... each through the role-switch protocol in `agent-factory/roles/_role-switch-protocol.md` — one
window, drop prior context, the handoff is the only memory.
```

**2. The orchestrator workflow table** (`orchestrator.md` L91-101) — workflows are NAMED, never inlined
("NAME the workflow file that serves the request — do not inline its steps"). The `05-pr-quality-gate.md`
row (L100) is the precedent for adding a `16-context-read-write.md` reference.

**D-14 "literal-SC-3-light":** add the cheap one-line "context I/O: see Workflow 16" pointer to the role
files (additive, low-risk) so SC-3 is honestly TRUE at phase close. The DEEP read/write rewiring + the
17 handoff template removals + the `guard_context_protocol_single_source` guard are all **Phase 24** —
do NOT pull them in (CONTEXT L21-24, L118-123, L257-258).

**WATCH (byte ceilings):** `check-foundation-guards.ts` `guard_role_size` (L411-450) enforces a per-role
byte ceiling. A one-line pointer is small, but `software-engineer.md` ceiling is `3307 3130` (WARN at
3130 B) and several roles sit near WARN. Keep the pointer to ONE terse line per role and re-check the
size gate. (The 17-role scan set is `ROLE_FILES`, L210-228 — the same set the pointer is added to.)

---

### `agent-factory/contracts/context-note.md` (contract/schema doc — EDIT, keep doc↔code in sync)

**Analog:** itself. This is the authoritative schema; Phase 21 turns its forward-references into live
enforcement and updates the "Phase 20 does not enforce" hedges.

**The provenance fence** (L70-101) — `verified_by` is documented "may be empty ... Empty in Phase 20"
(L79, L97-101). Phase 21 updates this to state the admission rule (a `finding`'s `verified_by` must
carry a real `§14-gate#<id>` or `human:<name>` stamp; refuse-self FAIL set):
```markdown
| `verified_by` | string (may be empty) | What verified this note's claim (e.g. a `§14-gate#<id>`
                  stamp or a named human). Empty in Phase 20. |
```
And L97-101 explicitly defers the admission rules to "Phase 21 (VFY), out of scope here" — that hedge
is what Phase 21 flips to the enforced rule (keep the wording change minimal and clear-voice).

**The `claim`-KIND ≠ verified forward reference** (L136-139) — the exact forward-ref Phase 21 enforces:
```markdown
**Forward reference (Phase 21, VFY-04 — not implemented here):** a `claim`-kind note can never, on its
own, satisfy a `finding`'s admission requirement. ... Phase 20 records the `claim` kind faithfully;
Phase 21 enforces that a claim does not masquerade as a verified finding.
```

**The worked-example valid note** (L141-162) — already shows `verified_by: §14-gate#ABC-001`; this is
the grammar the validator's regex (D-05) must accept. Keep the example and the regex in lockstep.

Doc-and-code-in-sync is a hard requirement: the schema doc, the `validate()` rules, and the
`task-notes.template.md` render must agree. The planner should treat any drift between them as a defect.

---

## Shared Patterns

### D-15 build model (committed-`.js` contract)
**Source:** `scripts/context-io.ts` L14-29 (header), L31-42 (imports), `tsconfig`/freshness gate.
**Apply to:** every code/test change (`context-io.ts`, `context-io.test.ts`).
TypeScript authored → `tsc` to committed `.js` → freshness-checked (rebuild-to-temp, byte-diff,
fail-red) → vitest-covered. `node:fs` / `node:crypto` / `node:path` ONLY — zero host runtime deps.
```typescript
import { randomUUID } from "node:crypto";
import { writeFileSync, readFileSync, readdirSync, ... } from "node:fs";
import { join } from "node:path";
```

### Refuse-self / documented-honest-residual posture (D-02/D-04/D-07)
**Source:** `hooks/guard.ts` — `SELF_APPROVE` detection L85-125, the root-of-trust env var L130-137,
and the explicit residual note L79-83.
**Apply to:** the `verified_by` validator (refuse-self), the `by: §14-gate` reserved-identity rule, and
the WF16 / context-note.md residual documentation.
```typescript
// L79-83 — the model for documenting a residual HONESTLY rather than papering over it:
// NOTE (residual surface, documented honestly): env-var indirection such as `K=kubectl; $K apply ...`
// defeats the literal tool-name patterns above and is OUT OF SCOPE for this default set ...
// L119-125 — refuse-self: the agent can never grant its own approval, denied even if already present:
if (SELF_APPROVE.test(cmd)) { deny(`Refused: an agent may not set or export ${APPROVAL}. ...`); }
```
Phase 21 mirrors this exactly (CONTEXT L48-52, L231-237): make cheap/accidental cheats impossible
(refuse-self + grammar + phrase-list + gate cross-check), raise the deliberate cheat to an obvious,
git-auditable forgery (impersonating `by: §14-gate` in a committed verdict note), and DOCUMENT the
ceiling honestly. The human-set-signal half routes to **Phase 25** (`context.human_admission`), D-07.

### Clear professional voice on safety/trace surfaces (CLAUDE.md hard rule)
**Source:** `context-io.ts` L19-20, `check-foundation-guards.ts` L46-47, `05-pr-quality-gate.md` L47.
**Apply to:** ALL six files (validator, test, both workflows, the role pointers, the contract). Never
caveman voice on a schema / validator / guard / verdict / admission surface.
**Mechanically enforced:** `check-foundation-guards.ts` `guard_voice` (L299-334) scans the 17 role files
+ security surfaces for caveman markers; the role-pointer text and any clear-voice role section must
stay caveman-free.

### `UNKNOWN - verify` over a faked pass (no-fabrication floor)
**Source:** `05-pr-quality-gate.md` L33, L39, L41, L47; `software-engineer.md` L48.
**Apply to:** the D-11 escape hatch (a refused `finding` degrades to a `claim` with
`confidence: UNKNOWN - verify`, NEVER a faked green) and the gate verdict (a green verdict is emitted
only from a real green result, never hand-set).

### Token-vs-prose precise matching (avoid false-positives on legit text)
**Source:** `check-foundation-guards.ts` `guard_context_writes` L498-507 + L482-496 calibration note;
`guard.ts` DEPLOY-pattern "match the SUBCOMMAND VERB, not a substring" rule L41-49.
**Apply to:** the D-09 phrase-list matcher (`==` / `startsWith` + non-alpha boundary, NEVER naive
substring) and the D-05 grammar regexes (anchored `^...$`, like `TASK_NAME_RE` L84).

---

## No Analog Found

None. Every file has a strong in-repo analog (most are self-extensions of Phase-20 code/docs).

---

## Flag-Only / Deferred (do NOT implement this phase)

| Item | Where it WILL register | Analog (shape only) | Why deferred |
|------|------------------------|---------------------|--------------|
| `guard_context_protocol_single_source` | `scripts/check-foundation-guards.ts` (Phase 24) | the `guard_context_writes` function L532-542 + its run-all wiring L554 | D-14 — build it when the deep rewiring + handoff removal actually land (CONTEXT L25-26, L255-256). Phase 21 only adds the one-line WF16 pointer. |
| `install.ts` context-dir seeding | `install.ts` (Phase 24) | n/a | CONTEXT L215-216 — Phase 21's admission check reads the Phase-20 layout; install seeding is touched later. |
| `human:<name>` un-forgeable signal | `context.human_admission` (Phase 25) | `hooks/guard.ts` env-var root-of-trust (L130-137) | D-07 — Phase 21 recognizes the grammar + refuses self + documents the residual; Phase 25 mechanizes the human-set signal. |

---

## Metadata

**Analog search scope:** `scripts/` (context-io + tests + foundation-guards + catalog-freshness),
`hooks/guard.ts`, `agent-factory/workflows/` (05, 04, frontmatter survey of 00-15),
`agent-factory/roles/` (orchestrator, software-engineer + the 17-role scan set),
`agent-factory/contracts/context-note.md`.
**Files scanned:** 9 read in full + 3 targeted greps.
**Pattern extraction date:** 2026-06-17

## PATTERN MAPPING COMPLETE

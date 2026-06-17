# Phase 21: Verify-Before-Write Admission (the §14 Gate as the Un-Cheatable Verifier) - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Give `verified_by` teeth. Phase 20 built the substrate and **recorded** the provenance
field but explicitly did not enforce its contents. Phase 21 wires the differentiator
mechanically: a `finding` is admitted to the shared verified context **only** with a real,
non-self verification stamp — so the replacement memory is trustworthy **before** Phase 24
makes it the sole inter-role memory.

**Requirements:** VFY-01, VFY-02, VFY-03, VFY-04.

**Voice:** Clear professional voice throughout (the schema / validator / guard / workflow are
trace + safety surfaces — CLAUDE.md hard rule, same posture as `hooks/guard.ts` and
`context-io.ts`).

**OUT (later phases — do NOT pull in):**
- Deep rewiring of all 18 roles + 16 workflows onto the substrate, and **deletion** of the 17
  static handoff templates → **Phase 24** (the clean cutover). Phase 21 only adds a cheap
  one-line WF16 pointer to roles (see D-12) and leaves handoffs in place.
- A `guard_context_protocol_single_source` foundation guard → **Phase 24** (build it when the
  rewiring actually lands; flag only now).
- Mechanical enforcement that a `human:<name>` stamp is genuinely human-set (not agent-forged)
  → **Phase 25** (`context.human_admission`). Phase 21 recognizes the grammar + refuses self
  + documents the residual honestly.
- Semantic / LLM compaction of trajectories → **Phase 22 (CMP)**.
- `queue.wip_limit`, parallel fan-out, nested spawning, the inverted WR-05 guard → **Phase 23**.
- Posture C ("only the verifier authors findings; agents only author claims") → possible
  **Phase 23/24 refinement**, explicitly not this phase (see Deferred).
</domain>

<decisions>
## Implementation Decisions (LOCKED — do not revisit)

### Un-cheatability posture (VFY-01, VFY-02) — USER-DECIDED
- **D-01 — Posture B (validator + gate-verdict cross-check on the gate path).** A `finding`
  carrying `§14-gate#<id>` is admitted **only if** that `<id>` cross-checks against a real,
  **green** verdict record. Posture A (validator-only / format-trust) was rejected because it
  leaves the headline stamp forgeable, quietly undercutting a phase titled "Un-Cheatable
  Verifier." Posture C (gate promotes claims to findings) was deferred as too invasive for now.
- **D-02 — The reserved `by: §14-gate` identity is the mechanism that earns "un-cheatable."**
  `§14-gate` is a **reserved author identity**: any role/agent note authored `by: §14-gate` is
  itself a **structural FAIL** (an auditable impersonation flag). This raises forgery from
  "write one fake string in my own note" to "fabricate a whole verdict record impersonating the
  gate, in a committed file" — blatant and git-auditable. The residual ("a determined agent can
  still commit an obvious forgery") is **documented honestly**, exactly as `hooks/guard.ts`
  documents its env-var-indirection residual. No perfection is claimed; cheap/accidental cheats
  are made impossible and the deliberate cheat is made loud.
- **D-03 — The verdict record.** On a **green** terminal result (`READY_FOR_HUMAN_REVIEW`), the
  §14 gate step emits a verdict via `context-io.ts`, authored `by: §14-gate`, carrying a
  **unique per-run id** (not the ticket id) — that id is the `<id>` downstream findings
  reference in `verified_by: §14-gate#<id>`. The verdict **dogfoods the note schema** (it is a
  context note, not a separate ledger format), so the cross-check is `readContext` + match.
- **D-04 — Root-of-trust self-attestation carve-out (no regress).** The gate verdict is the
  **one allowed self-attestation**: `by: §14-gate` notes are **exempt** from the refuse-self
  rule, because the gate is the root of the verification chain (mirroring how the prod-deploy
  hook trusts the human-set var as its root). This is why the verdict-is-a-finding model does
  not create an infinite "every finding needs a stamp" regress.

### Admission grammar & scope (VFY-01, VFY-02)
- **D-05 — Routine admission is gate-only.** USER-DECIDED: human attention is the bottleneck;
  the gate is the workhorse, the human is reserved for unsolvable disagreements. Two recognized
  `verified_by` grammars:
  - `§14-gate#<id>` — `^§14-gate#[A-Za-z0-9._-]+$` (the workhorse; admission cross-checks the
    verdict record per D-01/D-03).
  - `human:<name>` — escalation-only (see D-07).
- **D-06 — "Passing test reference" folds INTO the gate.** A passing test *is* a green gate (the
  gate runs `unit`/`e2e`); a standalone test-ref the validator cannot execute is as soft as a
  claim. So there is **no separate test-ref grammar** — this is more honest (no pretending the
  validator ran a test) and narrows VFY-01's literal "three sources" to **two** (gate +
  escalation-human). Logged as an intentional, user-confirmed narrowing of VFY-01's wording.
- **D-07 — `human:<name>` is the escalation valve, not a self-serve stamp.** It stays a valid
  grammar (VFY-01 names a named human) but is **documented as the path for non-gate-adjudicable
  judgment / unsolvable disagreements only**. Its mechanical un-cheatability (a genuine
  human-set signal mirroring the prod-deploy hook's refuse-self) is **layered in Phase 25**
  (`context.human_admission`). In Phase 21 it is grammar + refuse-self + honest residual.
- **D-08 — Only `finding` requires a stamp.** `claim` / `decision` / `failed-attempt` /
  `observation` / `artifact-ref` are soft / neutral / pointer by nature and need no
  `verified_by`. Matches VFY-01 ("a `finding` is admitted only with…").
- **D-09 — Refuse-self FAIL set for a `finding`.** Structural FAIL when `verified_by` is: empty;
  a literal `self` / `me` / `agent`; equal to `by` (the author stamping its own work); a DeLM
  invalid-evidence phrase (see Specifics — lowercase+trim, match by `==` or `startswith` +
  non-alpha boundary, **never** naive substring, to avoid false-positives on legit stamps); or
  anything not matching an accepted grammar (D-05). A RED fixture proves each (mirrors the
  prod-deploy hook + the v1.2 test-integrity carve-out).

### Two validation layers (planner separation)
- **D-10 — Split structural vs admission validation.**
  - *Structural* (text-only — what Phase 20's `validate()` already is): required fields,
    `kind`-in-set, refuse-self grammar (D-09), phrase-list. Stays a pure text→findings function.
  - *Admission* (context-aware — NEW): a gate-stamped `finding` cross-checks the verdict ledger
    under its task (D-01/D-03). **Only this layer reads context.** Keep the two layers distinct
    so the cheap structural check stays pure and the context-aware check is isolated.

### Escape hatch & bounded loop (VFY-04)
- **D-11 — Strict reject, no silent auto-degrade.** `context-io.ts` **hard-rejects** a
  stampless/invalid-stamp `finding` (exit 1, naming the fault); it does **not** silently rewrite
  the note into a `claim` (silent mutation is a fabrication smell). Workflow 16 then instructs
  the agent: obtain a real stamp within budget, **or** honestly re-record as a `claim` with
  `confidence: UNKNOWN - verify`. Phase 20's `claim`-KIND ≠ verified guarantee means a refused
  finding **degrades to a claim, never fakes a pass** — mirrors the gate's `UNKNOWN - verify`
  (never a faked green) and the test-integrity "advise loudly, never hide" floor.
- **D-12 — The bounded verify→regenerate loop is a referenced analog of `05`'s
  `self_fix_attempts`, not a forked loop and not a new dial.** WF16 points at the existing
  bounded loop in `05-pr-quality-gate.md` (default 2, "two rounds then human"); the cycle is
  record `finding` → admission refused → bounded attempts to actually get the real stamp
  (run/fix the gate) → then stop. Single-source preserved; no new config key.

### Workflow 16 & the 21↔24 seam (VFY-03)
- **D-13 — Phase 21 authors `16-context-read-write.md`** (clear voice) as the single-source
  protocol: read-before-act → do the work → write-after-verify (notes via `context-io.ts`;
  `finding` only with a real stamp; soft results as `claim`/`observation`) → the admission rules
  + escape hatch. Every role references it; nobody restates it.
- **D-14 — Seam = "literal-SC-3-light."** Phase 21 makes SC-3 ("every other role references the
  single-source protocol") honestly TRUE at phase close by adding the **cheap one-line**
  "context I/O: see Workflow 16" pointer to the role files (additive, low-risk). The **deep**
  read/write rewiring, the handoff **removal**, and the `guard_context_protocol_single_source`
  guard are all **Phase 24** — keeping Phase 24 as the pure cutover. WF16 coexists with handoffs
  until then.

### Build model (carried forward — D-13 of v1.2, LOCKED)
- **D-15 — All new/extended code follows the committed-`.js` contract.** TypeScript authored →
  `tsc` to committed `.js` → freshness-checked (rebuild-to-temp, byte-diff, fail-red) →
  vitest-covered. `node:fs`/`node:crypto`/`node:path` only; **zero host runtime deps**. Extend
  `scripts/context-io.ts` (+ `context-io.test.ts`) in place; the §14-gate verdict-emission step
  edits **only** `05-pr-quality-gate.md` (gate logic stays single-source — do NOT fork).

### Claude's Discretion
- Exact per-run verdict-id format/length against `node:crypto` (subject to D-03: unique,
  per-run, legible).
- Exact filename/location of the verdict note under `.grugops/context/<task>/` (it is a context
  note; precise placement is planner-final).
- Internal section ordering of `16-context-read-write.md`.
- Whether the structural-vs-admission split (D-10) is two exported functions or one function
  with a context-aware mode flag — the *separation of concerns* is locked; the surface is open.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked design + requirements (read first)
- `.planning/REQUIREMENTS.md` — VFY-01..04 (this phase) + the v2.0 milestone decisions.
- `.planning/ROADMAP.md` §"Phase 21" — the 4 success criteria this phase must make TRUE, and
  the upstream/downstream dependency framing (depends on Phase 20; feeds Phase 24).
- `.planning/phases/20-shared-context-substrate-concurrency-foundation/20-CONTEXT.md` — the
  locked substrate decisions Phase 21 builds on (per-note files, markdown-wins, the
  `claim`-KIND ≠ queue-CLAIM distinction, the deferred DeLM phrase list, the verifier forward-ref).

### The schema + write path (extend these)
- `agent-factory/contracts/context-note.md` — the authoritative note schema. Note §"The
  provenance fence" (`verified_by` "Empty in Phase 20"), §"Required-field rule", and §"CRITICAL
  DISTINCTION: the `claim` note-KIND is NOT the queue CLAIM" incl. its **Forward reference
  (Phase 21, VFY-04)** — Phase 21 turns that forward-ref into enforcement.
- `agent-factory/contracts/task-notes.template.md` — the consolidated task-notes render template.
- `scripts/context-io.ts` — the ONLY sanctioned write path. `validate()` (text-only structural
  check, lines ~168–205), `appendNote`, `NOTE_KINDS`, the `render`/JSONL path. Phase 21 extends
  `validate()` (D-09) and adds the admission cross-check (D-01/D-10).
- `scripts/context-io.test.ts` — the vitest pattern to extend with the RED fixtures (D-09, D-02).

### The verifier + safety precedents
- `agent-factory/workflows/05-pr-quality-gate.md` — the §14 gate, **single-source**. The
  bounded `self_fix_attempts` loop (Step 4) and the three terminal results; the verdict-emission
  step (D-03) lands HERE, never forked. Also the model for "advise loudly, never hide."
- `hooks/guard.ts` — the refuse-self-set / human-set-signal precedent and the **documented
  residual surface** posture (D-02 mirrors it; D-07 routes the human-set-signal to Phase 25).
- `scripts/check-foundation-guards.ts` — the guard aggregator (where a future
  `guard_context_protocol_single_source` would register — **Phase 24**, not now).

### Project constraints + build model
- `CLAUDE.md` — Constraints: no-fabrication (#6), voice discipline (clear voice on
  safety/trace), single-source, zero host runtime deps, and the D-13 TypeScript/committed-`.js`/
  freshness contract.
- `.planning/phases/15-typescript-tooling-migration/` — the D-13 build model in detail.
- `.planning/research/SUMMARY.md` — the locked v2.0 decentralization design + DeLM grounding.

### External prior art
- DeLM — arXiv 2606.10662 + `github.com/yuzhenmao/DeLM` (`verifier.py` — the
  `_INVALID_EVIDENCE_PHRASES` list is the concrete input for D-09; see Specifics).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/context-io.ts` `validate()` — already a clean text→findings structural validator
  (required fields, kind-in-set, duplicate-key defense). Extend it for refuse-self (D-09); keep
  it text-only and add the admission cross-check as a distinct, context-aware path (D-10).
- `scripts/context-io.ts` `readContext` / `currentState` — the read path the admission
  cross-check reuses to look up the verdict record under a task (D-01/D-03).
- `hooks/guard.ts` — the deny/refuse-self mechanism + honest-residual documentation style to
  mirror for the stamp validator (D-02) and to point at for the Phase-25 human signal (D-07).
- `scripts/*.test.ts` (esp. `context-io.test.ts`, `catalog-freshness.test.ts`) — the
  RED-fixture-first vitest idiom for proving a hollow/self stamp and a gate-impersonation fail.

### Established Patterns
- D-15 build model: `node:fs`-only TS → committed `.js` → freshness-checked → vitest. The hard
  pattern for every new/extended helper.
- §14 gate is single-source in `05-pr-quality-gate.md`; the bounded `self_fix_attempts` loop and
  three terminal results are reused by reference, never restated (D-12).
- Clear-voice findings on safety/trace surfaces; `UNKNOWN - verify` over a faked pass.
- Single-source protocol files referenced (not restated) by every consumer — the model WF16
  follows (D-13).

### Integration Points
- The §14-gate verdict-emission step edits **only** `05-pr-quality-gate.md` and calls
  `context-io.ts` (D-03) — no new gate logic outside `05`.
- `16-context-read-write.md` is a NEW workflow file (ordinal 16, continuing the frozen 00–15
  sequence); the one-line pointer is added to role files (D-14).
- The admission cross-check reads `.grugops/context/<task>/` verdict notes — built on Phase 20's
  layout; `install.ts` seeding of context dirs is touched LATER (Phase 24).
- The reserved `by: §14-gate` identity rule (D-02) lives in the validator and is honored by the
  gate's own verdict-emission (the one carve-out, D-04).
</code_context>

<specifics>
## Specific Ideas

**DeLM `_INVALID_EVIDENCE_PHRASES` (from `verifier.py`, banked in 20-CONTEXT) — the concrete
input for D-09's refuse-self phrase-list:** `"tbd"`, `"pending"`, `"not verified"`,
`"unverified"`, `"should work"`, `"should pass"`, `"looks right"`, `"looks correct"`,
`"seems to work"`, `"to be verified"`, `"will verify"`, `"n/a"`. Match semantics: lowercase +
trim, then `==` or `startswith` with a non-alpha boundary — **not** naive substring (a
substring match would false-positive on a legitimate stamp that happens to contain a phrase).

**The "un-cheatable" framing, stated honestly (D-01/D-02):** in grugops every surface is a file
an agent can write — there is no truly unwritable surface except a human-set env var or a human
action. So "un-cheatable" has a ceiling. The honest goal: make cheap/accidental cheats
impossible (refuse-self + grammar + phrase-list + the gate cross-check) and make a deliberate
cheat require an **obvious, auditable forgery** (impersonating `by: §14-gate` in a committed
verdict note). The residual is documented, never papered over — the same posture
`hooks/guard.ts` already takes with its env-var-indirection note.

**The admission flow, end to end (the WF16 narrative):**
- gate-verifiable result → run the §14 gate → green verdict (per-run id) → `finding` with
  `§14-gate#<id>` → admission cross-checks the verdict → admitted. (workhorse — no human)
- not gate-verifiable + low-stakes → honest `claim` with `confidence: UNKNOWN - verify`,
  non-load-bearing. (escape hatch — no human bothered)
- not gate-verifiable + high-stakes / agents disagree → escalate to a named human →
  `human:<name>` disposition (Phase 25 mechanizes the un-cheatable human-set signal). (rare)

</specifics>

<deferred>
## Deferred Ideas

- **Mechanical human-set-signal enforcement for `human:<name>` → Phase 25** (`context.human_admission`).
  Phase 21 recognizes the grammar + refuses self + documents the residual; Phase 25 makes the
  human signal genuinely un-forgeable (mirroring the prod-deploy hook).
- **`guard_context_protocol_single_source` foundation guard → Phase 24** — assert no role
  restates the read/write protocol; build it when the deep rewiring lands.
- **Deep per-role read/write rewiring + deletion of the 17 handoff templates → Phase 24** (the
  clean cutover). Phase 21 only adds the one-line WF16 pointer.
- **Posture C ("only the verifier authors findings; agents author only claims") → possible
  Phase 23/24 refinement.** The strongest self-stamp-proof model, but it reshapes the write flow
  and overlaps the parallel-execution / cutover wiring — out of scope for Phase 21.
- **Per-delegation claim cap / `queue.wip_limit` / parallel fan-out → Phase 23.**

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl*
*Context gathered: 2026-06-17*

# Phase 21: Verify-Before-Write Admission (the §14 Gate as the Un-Cheatable Verifier) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl
**Areas discussed:** Stamp un-cheatability, Admission grammar & scope, WF16 & the 21↔24 seam, Verify→regenerate loop & escape hatch

---

## Stamp un-cheatability

| Option | Description | Selected |
|--------|-------------|----------|
| A — validator-only | Refuse-self + recognized-grammar + phrase-list; residual: a syntactically-valid fake gate stamp still passes | |
| B — A + gate-verdict cross-check (gate path) | Gate emits a verdict record on green; validator admits `§14-gate#<id>` only if that record exists and is green; forging requires impersonating the gate | ✓ |
| C — gate promotes claims to findings | Agent may only author claims; gate is sole author of stamped findings; structurally self-stamp-proof but reshapes the write flow | |

**User's choice:** B
**Notes:** Drove the derived "reserved `by: §14-gate` identity" mechanism — an agent writing `by: §14-gate` is itself a structural FAIL, so forging a stamp means committing an obvious, auditable gate impersonation, not a one-string self-stamp. Verdict record dogfoods the note schema, uses a unique per-run id, and is the one allowed self-attestation (root of trust, no regress). Residual documented honestly, mirroring `hooks/guard.ts`. Posture C deferred as a possible Phase 23/24 refinement.

---

## Admission grammar & scope

| Option | Description | Selected |
|--------|-------------|----------|
| Keep three sources | gate stamp + standalone passing-test ref + named human, as VFY-01 literally lists | |
| Collapse to gate-or-human | Fold passing-test into the gate (a passing test is a green gate); two grammars | (partial) |
| Gate-primary, human = escalation | Gate is the workhorse; human only for unsolvable disagreements, not a routine self-serve stamp | ✓ |

**User's choice:** Gate. "Human attention is bottleneck usually, only bother human on unsolvable disagreements."
**Notes:** Routine admission is gate-only. Two recognized grammars: `§14-gate#<id>` (workhorse, cross-checked) and `human:<name>` (escalation-only; un-cheatable human-set signal deferred to Phase 25's `context.human_admission`). Passing-test ref folded into the gate (D-06) — intentional, user-confirmed narrowing of VFY-01's literal "three sources" to two. Only `finding` requires a stamp; the other five kinds are exempt. Refuse-self FAIL set + DeLM invalid-evidence phrase-list locked.

---

## WF16 & the 21↔24 seam

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal seam | Wire only WF16 + the §14 gate as verifier; defer all role references to Phase 24 | |
| Literal-SC-3-light | Author WF16 + add the cheap one-line "see WF16" pointer to every role now (SC-3 honestly true at close); defer deep rewiring + handoff removal + the single-source guard to Phase 24 | ✓ |

**User's choice:** Literal-SC-3-light (accepted as the lean default)
**Notes:** Phase 21 authors `16-context-read-write.md` and adds the additive one-line pointer so SC-3 is honestly TRUE at phase close; Phase 24 stays the pure cutover (deep rewiring, handoff deletion, `guard_context_protocol_single_source`). WF16 coexists with handoffs until Phase 24.

---

## Verify→regenerate loop & escape hatch

| Option | Description | Selected |
|--------|-------------|----------|
| Literal reuse / forked loop / new dial | A second bounded loop or a new config key for the verify→regenerate cycle | |
| Referenced analog + strict-reject | Reuse `05`'s `self_fix_attempts` by reference (no new dial); `context-io.ts` hard-rejects a stampless finding (no silent auto-degrade); WF16 instructs degrade-to-claim or escalate | ✓ |

**User's choice:** Referenced analog + strict-reject (accepted as the lean default)
**Notes:** Single-source preserved — WF16 points at `05`'s bounded loop (default 2, "two rounds then human"). The tool stays strict (exit 1, names the fault); degrading a refused finding to an honest `claim`(`UNKNOWN - verify`) is a documented protocol step, never a silent tool mutation. A refused finding degrades, never fakes a pass.

## Claude's Discretion

- Exact per-run verdict-id format/length against `node:crypto`.
- Exact filename/location of the verdict note under `.grugops/context/<task>/`.
- Internal section ordering of `16-context-read-write.md`.
- Whether the structural-vs-admission split is two functions or one with a context-aware mode flag (separation of concerns is locked; surface is open).

## Deferred Ideas

- Mechanical human-set-signal enforcement for `human:<name>` → Phase 25 (`context.human_admission`).
- `guard_context_protocol_single_source` foundation guard → Phase 24.
- Deep per-role read/write rewiring + deletion of the 17 handoff templates → Phase 24.
- Posture C (only the verifier authors findings) → possible Phase 23/24 refinement.
- Per-delegation claim cap / `queue.wip_limit` / parallel fan-out → Phase 23.

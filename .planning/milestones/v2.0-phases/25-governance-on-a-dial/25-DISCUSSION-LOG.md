# Phase 25: Governance-on-a-Dial - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 25-governance-on-a-dial
**Areas discussed:** Human-disposition mechanism, audit_retention semantics, Held-note flow (block vs queue), Severity signal + cross-cutting notes

---

## A. Human-disposition mechanism (GOV-01 core)

| Option | Description | Selected |
|--------|-------------|----------|
| Env-var mirror (in-script) | A human-set env var checked inside `context-io.ts admit()` | |
| PreToolUse hook (deploy-guard mirror) | A separate hook reads the session env + refuses self-set; un-forgeable | ✓ |
| Human-written disposition file | Agent writes proposed note; human writes a disposition artifact | |

**User's choice:** Hook-primary + in-script defense-in-depth; un-forgeable tier Claude-Code-only.
**Notes:** Sharp constraint surfaced — an in-script env check is self-settable by the agent (the var lands in admit's own child process env). Only a separate PreToolUse hook reading the human-set session env is un-forgeable, exactly how `hooks/guard.ts` works. Decided: new `hooks/admission-guard.ts` (keep `guard.ts` byte-frozen), in-script `admit()` refusal as the weaker non-CLI-degrade tier, honest CC-only residual documented.

---

## B. Severity signal + cross-cutting notes

| Option | Description | Selected |
|--------|-------------|----------|
| By authoring role | high-severity = `by` ∈ {security-nfr, architect-design, release-manager}; un-gameable | ✓ |
| Self-declared severity field | Agent tags note severity | |
| refs/path widening | Any note touching a security/release ref is high-severity | |

**User's choice:** Severity-by-role + `all` for the cross-cutting case.
**Notes:** By-role is un-gameable (the running agent IS the role; relabeling `by` is already an impersonation FAIL). The cross-cutting hole (engineer records a security finding) is resolved by the dial itself — `human_admission: all` gates every note. Rejected the refs-widening (over-blocks).

---

## C. Held-note flow — block vs queue

| Option | Description | Selected |
|--------|-------------|----------|
| Synchronous refuse | Admission denies (exit 1), agent stops + hands to human — gate-refusal shape | ✓ |
| Async proposed/ staging | Note staged invisibly; agent continues; human disposes later; promote | |

**User's choice:** Synchronous refuse; async staging deferred to v2.x.
**Notes:** A security/architecture/release finding is exactly what you want to block on. Async preserves parallel-fan-out throughput but adds a promote-on-dispose + TTL protocol — deferred.

---

## D. `audit_retention: git | retained` semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Pin against future cleanup | `retained` forbids pruning superseded notes | |
| Durable governance audit ledger | `retained` writes admission/disposition events to a committed `.grugops/audit/` ledger | ✓ |
| Commit raw threads/ trajectory | `retained` un-gitignores the local trajectory | |

**User's choice:** Durable governance audit ledger.
**Notes:** Notes are already git-tracked/append-only/superseded-not-deleted, so `retained` can't mean "keep the notes". It means a durable, committed audit ledger of who-admitted/approved-what — making GOV-01 + GOV-02 a coherent pair. Must be disambiguated from `compaction: retain-raw` (body-verbosity, a different dial).

---

## Claude's Discretion

- Separate `hooks/admission-guard.ts` rather than editing `guard.ts` (D-02).
- SC3 proven structurally + adversarially (RED vs committed `.js`, logic-probe AND independent code-review), not by a green suite (D-12) — per the safety-invariant lesson.
- Config placement under the existing `context` object; 3-surface lockstep test modeled on `config-queue-consistency.test.ts` (D-11).
- Audit-ledger format starts as fixed-key JSONL reusing `toJsonl` shape; exact fields a research item (D-10).

## Deferred Ideas

- Async `proposed/` staging of held high-severity notes → v2.x.
- GOV-03 (human-gated high-severity admission default-on) → named future requirement.
- Cross-CLI un-forgeable admission mechanism (e.g. human-run `grug admit` via `!`) → out of scope.
- Per-project rename/extension of the admission approval var → config concern, not this build.

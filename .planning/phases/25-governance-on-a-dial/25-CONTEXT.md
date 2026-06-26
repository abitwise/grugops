# Phase 25: Governance-on-a-Dial - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Expose **two enterprise governance dials** over the now-stable decentralized substrate
(Phases 20–24) — **without touching the lean defaults or the un-dialable safety floor**:

- **GOV-01 — `context.human_admission: off | high-severity | all`**: a *mechanical*
  human-in-the-loop gate before a verified note is admitted to the shared context. An agent
  proposes a verified `finding`; a **NAMED human disposes** high-severity entries
  (security / architecture / release) before admission. With `off` (lean default) routine
  verified notes admit without a human stop. This **mirrors the prod-deploy hook
  (`hooks/guard.ts`) extended to memory** — and closes the explicit "the un-forgeable
  human-set signal is layered in Phase 25" placeholders already written into
  `scripts/context-io.ts`, `agent-factory/workflows/16-context-read-write.md`, and
  `agent-factory/contracts/context-note.md`.
- **GOV-02 — `context.audit_retention: git | retained`**: controls audit-trail retention;
  all three config surfaces updated in lockstep; lean defaults preserved (zero-config still
  runs lean).

**Requirements:** GOV-01, GOV-02.

**The un-dialable safety floor (SC3) is unchanged and not bypassable by ANY dial value** —
verify-before-write, no-fabrication, test-integrity (`quality.test_integrity` has no `off`),
and humans-hold-merge/deploy all hold regardless of governance configuration. The governance
dials may only make admission **stricter** (add a gate); no setting may subtract a floor.

**This phase builds NO new substrate.** The substrate, queue, atomic-claim,
verify-before-write admission (`context-io.ts admit()`), and compaction already exist
(Phases 20–22) and handoffs are already removed (Phase 24). Phase 25 *layers governance on*;
it adds two config keys, one PreToolUse hook, an in-script defense-in-depth refusal, and an
optional durable audit ledger.

**OUT (do NOT pull in):**
- The real-role **dual-path equivalence oracle** + aggregate token-cost measurement →
  **Phase 26** (DOGF). Governance config alone never retires A3/DOG-02.
- **Async `proposed/` staging** of held high-severity notes → deferred to **v2.x** (this
  phase ships the synchronous-refuse flow — see D-07).
- **GOV-03** (human-gated high-severity admission promoted to default-on) → explicitly a
  later requirement; `off` stays the lean default here.
- Any change to `context.compaction` semantics — `audit_retention` is a DISTINCT dial and
  must not duplicate `retain-raw` (see D-09).
</domain>

<decisions>
## Implementation Decisions

### A. Human-disposition mechanism (GOV-01 core) — un-forgeable boundary

- **D-01 (mechanism = PreToolUse hook, NOT an in-script env check):** The un-forgeable
  gate is a **PreToolUse hook** that mirrors `hooks/guard.ts`, because an in-script env check
  inside `context-io.ts admit()` is **self-settable by the agent** (the agent runs
  `GRUGOPS_ADMISSION_APPROVED_BY=eve node context-io.js admit …` and the var is in admit's
  *own* child env). The deploy guard is un-forgeable *only* because it is a separate hook
  process reading the **session env the human set** — the agent's self-set never reaches it.
  The hook matches the `context-io.js admit`/`append` Bash command, reads the target note,
  classifies severity, and **denies** admission of a high-severity `finding` unless the
  human-set session var `GRUGOPS_ADMISSION_APPROVED_BY=<name>` is present; **refuses any
  self-set/export** of that var; **fails closed** (unreadable config / unparsable note / empty
  stdin → deny a matched high-severity admission, never crash-allow). Byte-for-pattern the
  deploy guard's posture (D-32/D-33 lineage).
- **D-02 (separate hook file — keep `guard.ts` byte-frozen):** Implement as a **new
  `hooks/admission-guard.ts` → committed `admission-guard.js`**, wired as a *second*
  PreToolUse matcher in `hooks/hooks.json`. Do **not** edit `hooks/guard.ts` — it is a
  safety-critical file with a long bypass history; memory-admission and prod-deploy are
  distinct concerns (D-10 separation). The freshness check must cover the new `.js`.
- **D-03 (on approval → the un-forgeable `human:<name>` stamp):** An admitted high-severity
  note carries `verified_by: human:<name>`, where `<name>` is bound to the hook-verified
  disposition (the session-var name), not merely the structurally-accepted grammar Phase 21
  recognized. This completes the `human:<name>` un-forgeability that
  `context-io.ts` (≈L108/L850), Workflow 16, and `context-note.md` all defer to "Phase 25".
- **D-04 (defense-in-depth in `admit()`):** `context-io.ts admit()` *also* refuses a
  high-severity human-required `finding` lacking the human stamp. This tier is **weaker**
  (self-settable) but covers the 4 non-Claude CLIs at the script level. It NEVER silently
  rewrites the note (no fabrication smell) — it refuses and names the fault, exactly like the
  existing stampless-finding refusal.
- **D-05 (honest residual — un-forgeable tier is Claude-Code-only):** The *mechanically
  un-forgeable* gate is CC-only — exactly like the deploy hook (also a CC PreToolUse hook).
  The other 4 CLIs degrade to prompt-level "stop, ask a named human" + the D-04 in-script
  refusal, **documented plainly as not mechanically un-forgeable** (no-fabrication; same
  primary/degrade architecture as the whole v2.0 pivot). User accepted the CC-only un-forgeable
  tier rather than chasing a cross-CLI mechanism.

### A′. SC1 restatement (round 6) — the achievable invariant + the documented residual

After 10 rounds of patching the pre-expansion command-string tokenizer, the human chose to MOVE
THE GATE TO THE POINT OF EFFECT (a structured admission channel + a per-call hook reading the final
structured arguments) rather than keep chasing bash-completeness. SC1 is restated to the achievable
invariant below. **This exact wording is mirrored verbatim in `.planning/ROADMAP.md` Phase 25
Success Criteria item 1 — one wording, two places.**

**SC1 (restated, round 6 — the achievable invariant):** The SANCTIONED admission channel is
mechanically un-forgeable on Claude Code: a verified note is admitted only through the structured
`mcp__grugops__propose_note` tool, gated by a PER-CALL PreToolUse `admission-guard` hook that reads
the FRESH session disposition per call (`GRUGOPS_ADMISSION_APPROVED_BY=<name>`, the variable the
agent's own child env cannot reach) and validates the agent-supplied `human:<name>` stamp against it
PER NOTE — the hook reads the FINAL structured tool arguments, not a shell command string, so there
is no shell-obfuscation surface. A gated (high-severity) note cannot be admitted through this channel
without a named human; AND a human-APPROVED note IS admitted through it stamped
`verified_by: human:<name>`, with the disposition attributed PER NOTE in the GOV-02 ledger
(`disposed_by: human:<name>`, per-entry — no session blanket; the positive D-07 capability). UX
(mirrors the deploy guard): the human exports `GRUGOPS_ADMISSION_APPROVED_BY=<name>` for the SPECIFIC
disposition, the per-call hook validates it, and the human may unset it after. This un-forgeable tier
is claimed CONSERVATIVELY for Claude Code only — un-forgeability is NOT claimed for the four non-CC
CLIs, which degrade to the in-script `admit()` refusal plus a prompt-level "stop, ask a named human"
(D-04/D-05).

**Documented residual (NOT closed — stated plainly, no-fabrication):** direct same-uid filesystem
forgery that BYPASSES the channel is an IRREDUCIBLE, PRE-EXISTING in-box limit (the prior
command-string hook never closed it either). On a single-user box the shared context is a directory
of note files the agent's uid owns and `readContext` admits any parseable file; no out-of-process
mechanism can stop a same-uid process from writing one outside the channel — a `Write`-tool drop, a
Bash `echo`/`cp`/`tee`/redirection, a hand-modified `context-io` copy, OR a programmatic
`node -e appendNote(...)` (forges a note), `node -e admitAndAppend(...)` (forges a note AND, under
`audit_retention: retained`, a GOV-02 `disposed_by` ledger line), or `node -e emitVerdict(...)`
(forges a LIVE green §14-gate verdict — the most powerful same-uid form, since a forged green verdict
then lets Posture-B admit forged findings). An agent self-setting the approval env on its OWN process
is part of this same direct-node residual, not a channel bypass. The backstop is `autonomy=pr` — a
named human holds merge/deploy — plus the in-script D-04 refusal and the no-fabrication floor. SC1 is
CLOSED for the sanctioned channel on CC; the same-uid direct-FS residual is documented, NOT
eliminated.

### B. Severity signal — un-gameable, narrow; `all` covers cross-cutting

- **D-06 (severity = authoring role):** high-severity = the note's `by` ∈
  **{`security-nfr`, `architect-design`, `release-manager`}** — the clean 3:3 map to
  security / architecture / release. This is **un-gameable**: the running agent *is* that
  role, and relabeling `by` to dodge the gate is already an impersonation / fabrication-floor
  FAIL in the validator. **No self-declared `severity` field** (it would be gameable
  downward). The cross-cutting hole (a `software-engineer` recording a security finding is not
  `by: security-nfr`) is resolved **by the dial itself**: a team that needs every note gated
  sets `human_admission: all`. Accepted residual at the `high-severity` setting; `all` is the
  paranoid escape valve. (Rejected: a `refs`-touches-a-security/release-path widening — it
  over-blocks.)

### C. Held-note flow — synchronous refuse (async deferred)

- **D-07 (synchronous refuse):** When a high-severity note is proposed under
  `human_admission`, admission **denies (exit 1, "needs human disposition")** and the agent
  **stops and hands to a human** — the same shape as a §14-gate refusal and the deploy-hook
  deny. No new staging protocol; fail-closed. The note is not lost — after the human disposes
  (exports the approval var for that disposition), admission is re-run and admits with the
  `human:<name>` stamp; or the agent honestly re-records as a soft `claim`
  (`confidence: UNKNOWN - verify`) — never a faked pass. **Async `proposed/` staging
  (write-but-invisible-to-`readContext`-live-state + promote-on-dispose + TTL) is DEFERRED to
  v2.x** (see Deferred Ideas). The safety argument won: a security/architecture/release finding
  is exactly what you want to block on.

### D. `audit_retention: git | retained` — durable governance audit ledger

- **D-08 (`retained` = a durable governance/admission audit ledger):** Because notes are
  *already* git-tracked, append-only, and superseded-not-deleted, `retained` does **not** mean
  "keep the notes" (already kept). It means: write the **admission / disposition record**
  (note id, kind, `by`, severity classification, the admitting stamp `§14-gate#<id>` /
  `human:<name>`, the disposing human, `at`) to a **committed append-only ledger under
  `.grugops/audit/`**, separate from the prunable per-task context. `git` (lean default) = the
  audit is left implicit in git history (today's behavior, zero new artifacts); `retained` =
  an explicit durable ledger a regulated team (SOC2 / audited delivery) can hand to an auditor.
  This makes GOV-01 + GOV-02 a **coherent pair**: GOV-01 adds the human gates; GOV-02 decides
  how durably the **record of those gates (and all admissions)** is retained.
- **D-09 (disambiguate from `context.compaction: retain-raw`):** `audit_retention` is a
  DISTINCT dial. `compaction: retain-raw` governs **body-verbosity of promoted notes**;
  `audit_retention: retained` governs **durability of the admission/governance record**. The
  plan MUST NOT build a duplicate of the compaction knob, and the `factory.config.md` twin must
  state the distinction crisply (the same care the `queue` vs `wip_limits` D-07 naming-collision
  got).
- **D-10 (ledger format — reuse the note/JSONL shape):** Start the ledger as an append-only
  JSONL (one event per admission/disposition), reusing the existing `toJsonl`-style fixed-key
  order for consistency and byte-reproducibility. Exact field set is a research/planning item —
  do not over-specify here; keep it bounded (a ledger, not a new subsystem).

### Technical decisions (Claude's discretion — locked unless flagged)

- **D-11 (config placement + 3-surface lockstep):** Both keys live under the existing
  `context` object beside `compaction`: `context.human_admission` (default `off`),
  `context.audit_retention` (default `git`). Updated in lockstep across all three surfaces
  — `agent-factory/config/factory.config.json`, `agent-factory/seed/.grugops/factory.config.json`
  (kept byte-identical), and the `agent-factory/config/factory.config.md` twin — with a
  cross-surface consistency **test modeled on `scripts/config-queue-consistency.test.ts`**.
  Read-at-use, default-on-absent (D-06 doctrine): a missing key reads as its lean default,
  never an error.
- **D-12 (SC3 proven STRUCTURALLY, not by a green suite):** Per the hard-won lesson
  ([[grugops-safety-invariant-green-suite-insufficient]]), SC3 ("the floor is not bypassable
  by any dial value") requires an **adversarial proof**, not a passing suite:
  (1) a test that **sweeps every governance dial value including bogus/garbage ones** and
  asserts the four floor invariants still REFUSE (self-stamp refused, no-fabrication holds,
  `test_integrity` has no `off`, humans-hold-merge/deploy via the deploy guard unchanged); and
  (2) the **structural guarantee that the governance dials only ADD admission strictness, never
  subtract a gate** — there is no code path where setting a governance dial opens a bypass.
  The admission-guard's deny path must be reproduced RED vs the **committed `.js`** (both
  directions: clean = allow; planted high-severity-without-approval = deny naming the note),
  and independently verified — not self-reported green. Watch the inverse failure modes from
  history: a fence/comment-agnostic guard reading a DOC EXAMPLE as a live signal (P23 CR-01),
  and a heuristic narrower than the format (P22). Verify with an independent red-team /
  opus-grade probe on the guard's **input surface** AND its **logic**.
- **D-13 (no kit-content false-positives — the WR-01 watch):** Adding governance prose to
  roles/workflows/twin must not trip `guard_context_writes` (WR-01) or any foundation guard —
  reference Workflow 16 / the config keys, never restate a raw `.grugops/` write path beside a
  write token (D-10 from Phase 24 held empirically; keep it held).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The requirements + phase definition
- `.planning/ROADMAP.md` §"Phase 25: Governance-on-a-Dial" — goal, depends-on (Phase 24),
  the 3 success criteria (human_admission flow, audit_retention lockstep, un-dialable floor).
- `.planning/REQUIREMENTS.md` §GOV (GOV-01, GOV-02; and GOV-03 as the explicitly-deferred
  default-on follow-up).

### The admission gate + note schema (GOV-01 surface)
- `scripts/context-io.ts` — the sole sanctioned writer + `admit()` (the only context-reading
  admission path). Carries the explicit "un-forgeability is layered in Phase 25" markers
  (≈L108, ≈L850) this phase closes. `GATE_STAMP_RE` / `HUMAN_STAMP_RE`, the refuse-self FAIL
  set, Posture-B live-green cross-check. Compiled twin `scripts/context-io.js` must stay fresh.
- `agent-factory/contracts/context-note.md` (SCTX-01) — the note schema; `verified_by`
  grammar; the "`human:<name>` accepted structurally — un-forgeable signal layered in Phase 25"
  line to update.
- `agent-factory/workflows/16-context-read-write.md` — the single-source read/write/admission
  protocol; the "its un-forgeable human-set signal is layered in Phase 25" line; the three
  admission outcomes (gate-verifiable / soft-claim / escalate-to-human). Roles reference this;
  never restate.

### The mirror — prod-deploy hook (GOV-01 pattern)
- `hooks/guard.ts` — the SAFE-02 mechanical prod-deploy PreToolUse guard to MIRROR (human-set
  env var, refuse-self-set, fail-closed, exit-0+JSON-deny). **Do not edit** (D-02); read as
  the pattern for the new `hooks/admission-guard.ts`.
- `hooks/hooks.json` — where the new PreToolUse matcher is wired (second matcher).

### The config-dial pattern (GOV-02 + both keys)
- `agent-factory/config/factory.config.json` and `agent-factory/seed/.grugops/factory.config.json`
  — the two JSON surfaces (kept byte-identical); the existing `context` object holds `compaction`.
- `agent-factory/config/factory.config.md` — the human-readable twin; the `context` sub-fields
  block, the mode-override matrix (~L125), and the read-at-use/default-on-absent doctrine
  (~L135) to extend.
- `scripts/config-queue-consistency.test.ts` — the 3-surface lockstep consistency oracle to
  MODEL the new `context.*` governance consistency test on.

### The floor (SC3) + verification rigor
- `agent-factory/workflows/05-pr-quality-gate.md` — the §14 gate that emits green verdicts +
  owns the bounded `self_fix_attempts` loop (referenced, never restated).
- `scripts/check-foundation-guards.ts` (+ `.test.ts`) — the foundation guards incl. the
  config-dial contract and `guard_context_writes` (WR-01); the freshness check.
- The hard-won safety lesson — see Specific Ideas below ([[grugops-safety-invariant-green-suite-insufficient]]).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`hooks/guard.ts`** — near-complete template for `hooks/admission-guard.ts`: stdin parse
  (fail-closed), `SELF_APPROVE` refuse-self-set regex, `deny()` exit-0+JSON helper, config-driven
  pattern set. Clone its posture; swap deploy-command matching for admit-command + note-severity
  classification.
- **`scripts/config-queue-consistency.test.ts`** — direct template for the governance 3-surface
  consistency test (deep-equal across JSONs, lean-default assertions, twin documents each key).
- **`scripts/context-io.ts admit()` / `validate()`** — the admission seam; D-04 defense-in-depth
  hooks into the existing finding-refusal path (it already names faults and refuses, never
  silently rewrites).
- **`toJsonl()` in `context-io.ts`** — fixed-key-order JSONL emitter to reuse for the D-10 audit
  ledger shape.

### Established Patterns
- **3-surface atomic config dial** (json kit + json seed + md twin) with a consistency test —
  every config key follows it; the two GOV keys are no exception.
- **Read-at-use, default-on-absent** — a missing key = lean default, never an error
  (`human_admission` absent → `off`; `audit_retention` absent → `git`).
- **Un-dialable carve-out precedent** — `quality.test_integrity` has no `off`;
  `context.compaction`'s carve-out is un-dialable (D-05). The governance floor follows the same
  "the dial can only tighten, never open a hole" shape.
- **Primary/degrade architecture** — Claude Code primary (hook = un-forgeable); the other 4
  CLIs degrade (prompt + in-script refusal), documented honestly.

### Integration Points
- New PreToolUse matcher in `hooks/hooks.json` → `hooks/admission-guard.js`.
- `context-io.ts admit()` ← D-04 in-script high-severity refusal (reads `context.human_admission`).
- The new `.grugops/audit/` ledger (GOV-02 `retained`) ← written from the admission path; the
  default `git` mode writes nothing new.
- The freshness gate ← must cover `admission-guard.js` (and `context-io.js` if touched).

</code_context>

<specifics>
## Specific Ideas

- **The safety-invariant lesson governs SC3 (D-12).** From prior phases:
  ([[grugops-safety-invariant-green-suite-insufficient]]) — for a safety invariant/guard, a
  green test suite is NOT proof. P22's compaction carve-out was bypassed 7× through green
  suites and only closed by a STRUCTURAL fix + a fuzz oracle + an independent opus red-team.
  P23's WR-05 flip was caught by the independent code-review (guard read a fenced DOC EXAMPLE
  as a live coordinator — guard INPUT-SURFACE blind spot, distinct from guard LOGIC). P24's
  check-kit-refs flip was closed only by reproducing the both-direction proof vs the COMMITTED
  `.js`, by both the orchestrator and an independent opus verifier. **Apply all three here:**
  reproduce the admission-guard deny RED vs the committed `.js`, run BOTH a logic-probe AND an
  independent code-review on the guard, and watch the inverse false-positive (a governance DOC
  EXAMPLE or a kit-content write token must not read as a live signal).
- **GOV-01 maps "security/architecture/release" to three concrete roles** — not an abstract
  severity taxonomy. This is the user's intended interpretation, confirmed this session.
- **`audit_retention` is about the GOVERNANCE RECORD's durability**, not note retention and not
  compaction verbosity — confirmed this session (D-08/D-09).

</specifics>

<deferred>
## Deferred Ideas

- **Async `proposed/` staging of held high-severity notes** (write-but-invisible-to-live-state
  + promote-on-dispose + TTL/expiry) — preserves parallel-fan-out throughput; deferred to v2.x.
  Phase 25 ships synchronous refuse (D-07).
- **GOV-03 — human-gated high-severity admission promoted to default-on** — already a named
  future requirement (validate routine verify-then-write first). `off` stays the lean default
  in Phase 25.
- **A cross-CLI un-forgeable admission mechanism** (e.g. a human-run `grug admit` command via
  the `!` prefix for the 4 non-Claude CLIs) — out of scope; the CC-only un-forgeable tier +
  documented degrade is accepted (D-05).
- **Extending the deploy-pattern / approval-var set per project** — the admission var name is a
  placeholder like `GRUGOPS_PROD_DEPLOY_APPROVED`; per-project rename is a config concern, not
  this phase's build.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 25-Governance-on-a-Dial*
*Context gathered: 2026-06-23*

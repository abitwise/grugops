---
phase: 25-governance-on-a-dial
plan: 05
type: execute
gap_closure: true
status: gaps_found
checkpoint_25-05-04: did_not_pass
requirements: [GOV-01, GOV-02]
result: "Tasks 01-03 executed + committed; blocking checkpoint 25-05-04 FAILED — the independent both-angle opus red-team reproduced THREE live exploitable bypass classes (+ one masked defect) vs the committed .js that the 743-green author suite missed. Round 3 / the 7th green-suite-insufficient catch of v2.0."
commits: [ffb0d75, 4100ce4, 4e69496, d1aaabd]
guard_ts_frozen: "3501810e21308e4b7e219679a6ca30dace9b5d66"
freshness: 0
next: "/gsd-plan-phase 25 --gaps"
---

# Plan 25-05 Summary — Round-2 GOV-01 gap closure (command-resolution + non-string dial + case-variant severity)

> **Outcome: `gaps_found`. The blocking checkpoint 25-05-04 did NOT pass.** Tasks 01-03 were
> executed correctly and are committed, the author suite is fully green (743 non-e2e), and the
> round-2 LOGIC closures held — but an INDEPENDENT both-angle opus red-team (D-12), corroborated
> by the orchestrator's own child-spawn probes against the committed `.js`, reproduced **three
> live exploitable bypass classes plus one masked defense-in-depth defect** that the suite missed.
> This is round 3 of Phase 25 gap closure and the **7th green-suite-insufficient catch of v2.0**
> ([[grugops-safety-invariant-green-suite-insufficient]]).

## What was built (tasks 01-03 — committed, verified)

| Task | Commit | What landed |
| ---- | ------ | ----------- |
| 25-05-01 (GAP-A/GAP-B) | `ffb0d75` | `effectiveCommandWord` (basename) + `stripQuotedRuns` (full de-quote) + `COMMAND_MODIFIERS` skip + brace-group recognition + `nodejs` launcher, layered on the preserved 25-04 `liveTokens` tokenizer; a fail-closed `DYNAMIC_EVAL_WORDS`/`isEnvIndirectedWord` unresolvable-tail GATE; the `SELF_APPROVE` refuse-self-set check moved in FRONT of the matcher early-exit (admit-shape-scoped). 25-05-RED-baseline.txt captured. |
| 25-05-02 (GAP-C/GAP-D) | `4100ce4` | `canonicalizeHumanAdmission` → present non-string `human_admission` (and non-object `context`/whole-file config) canonicalizes to gate-or-stricter `"all"` in both `readGovernanceConfig` + `readGovernanceConfigResult`; only exact JSON `"off"` is off-equivalent; absent + present-object-no-key stay lean. Case-insensitive `HIGH_SEVERITY_ROLES` (`.toLowerCase()`) at BOTH the hook (:656) and `admit()` (:934) tiers. |
| 25-05-03 (proof) | `4e69496` | HOOK-tier non-string-dial + case-variant-`by` sweeps + an anti-whack-a-mole command-resolution class fuzz in `floor-invariance.test.ts`; 25-05-GREEN-proof.txt completed. |
| STATE checkpoint | `d1aaabd` | STATE updated to "stopped at blocking checkpoint 25-05-04"; ROADMAP not flipped. |

**Author-suite + integrity state (independently re-verified by the orchestrator):** `npm run freshness` exit 0 (21 committed `.js` fresh); `npx vitest run --exclude '**/scripts/e2e/**'` → **743 passed / 1 skipped, exit 0**; `git diff --quiet hooks/guard.ts` exit 0 (byte-frozen `3501810e…`); `admission-guard.test.ts` 74 cases (≥ guard.test.ts 27). The executor correctly hard-stopped at the blocking checkpoint and did NOT self-approve on its green suite (the right behavior, per D-12).

## Independent Both-Angle Red-Team (Task 25-05-04) — VERDICT: GAPS_FOUND

Per the plan's blocking checkpoint and [[grugops-safety-invariant-green-suite-insufficient]], the orchestrator did NOT approve on the green author suite. It ran an independent both-angle probe (the P23 logic + input-surface split): two parallel opus `general-purpose` agents attacking ONLY the **committed** `hooks/admission-guard.js` + `scripts/context-io.js` (never the `.ts`, never the author's `*.test.ts`), plus the orchestrator's own child-spawn probes. All findings below are reproduced vs the committed `.js` at HEAD `d1aaabd`; baselines (bare `node … admit` → DENY; routine-alone → ALLOW; inert quoted → ALLOW) confirm the harness is faithful.

### LIVE exploitable bypass classes (each: a real gated admit the shell WOULD run, that the hook ALLOWs with no human approval)

**Class A — path-form command modifier is never basenamed before the prefix test (INPUT-SURFACE).**
Round-2 added `effectiveCommandWord` (basename) but applied it only to the *final launcher word*; `isCommandPrefix` (admission-guard.ts:367-373) still tests the **raw** token against `COMMAND_MODIFIERS`/`env`. A path-spelled modifier never matches the prefix set, becomes the resolved word, basenames to `env`/`nice`/`xargs` (not a launcher) → not gated; the trailing `node` is read as an argument.

| command (dial=all, no approval) | result | required |
| --- | --- | --- |
| `/usr/bin/env node <ctxio> admit T <note>` | ALLOW | DENY |
| `/usr/bin/nice node <ctxio> admit T <note>` | ALLOW | DENY |
| `/usr/bin/env -S node <ctxio> admit T <note>` (invented) | ALLOW | DENY |
| `/usr/bin/xargs node <ctxio> admit T <note>` | ALLOW | DENY |
| `./nice node …` / doubled `/usr/bin/env /usr/bin/nice node …` | ALLOW | DENY |

`/usr/bin/env node` is the canonical shebang-style way to launch node — high-severity, not exotic.

**Class B — command-substitution / backtick producing the command word fails OPEN (INPUT-SURFACE).**
`$(` (admission-guard.ts:313) and `(` (:314) are treated as *segment openers*, so the substitution's INNER first word (`echo`/`printf`/`basename`) is resolved; the OUTER command word the shell actually forms is never reconstructed and there is no fail-closed branch for it. Backticks are not handled by the tokenizer at all. Glaring asymmetry: an env-indirected word `$X …` correctly fails CLOSED (via `isEnvIndirectedWord`), but `$(…)`/backtick producing the identical word fails OPEN.

| command (dial=all, no approval) | result | required |
| --- | --- | --- |
| `$(echo node) <ctxio> admit T <note>` | ALLOW | DENY |
| `` `echo node` <ctxio> admit T <note> `` | ALLOW | DENY |
| `$(printf node) …` / `$(basename /usr/bin/node) …` | ALLOW | DENY |
| `$(echo $(echo node)) …` (nested) / `nice $(echo node) …` | ALLOW | DENY |

The code comments at :122-130/:393-404 CLAIM to gate "backtick / `$( … )` command substitution in command position" — but the implementation does not (only `$X`/`eval`/`sh -c` are covered).

**Class E — multi-admit "shield": the matcher is segment-aware but the severity CLASSIFIER reads only the FIRST admit (LOGIC/CLASSIFIER — NEW, CRITICAL).**
`noteFileFromCommand` (admission-guard.ts:509-517) does `tokens.findIndex((t) => t === "admit")` — it locates only the **first** `admit` and classifies only **that** note's `by` (:612-656). Under the `high-severity` dial, prefixing the target high-severity admit with any non-gated routine admit steals the classifier:

| command (dial=high-severity, no approval) | result | required |
| --- | --- | --- |
| `node <ctxio> admit T <high-sev>` (alone) | DENY | DENY ✓ |
| `node <ctxio> admit T <routine> ; node <ctxio> admit T <high-sev>` | ALLOW | DENY |
| same with `&&`, `\|`, or `( … ) ;` separators | ALLOW | DENY |
| `node … admit T <high-sev> ; node … admit T <routine>` (high first) | DENY | DENY ✓ |

The shielded high-severity note is structurally **valid** (`validate()` passes, so `admit()` would admit it) and can even carry a forged `verified_by: human:eve` stamp — so on Claude Code, where the hook is the un-forgeable PRIMARY tier, a forged-human high-severity entry is admitted with zero real human. (The in-script `admit()` tier classifies per-note and is immune, so this is specifically a CC-hook hole — it punches through exactly the un-forgeable tier the design rests on.) **Neither the orchestrator's own input-surface probe nor the input-surface red-team found this — only the logic red-team did, then the orchestrator reproduced it independently. The both-angle dispatch earned its keep; a single thorough probe again proved insufficient (the P23 lesson, both directions).**

### Masked defect (defense-in-depth, not independently exploitable today)

**Class F — hook mis-classifies severity on duplicate/indented `by`.** The hook reads `by` via `parseNote` (last-wins, malformed-tolerant) WITHOUT calling `validate()`, so a note with `by: security-nfr` then `by: software-engineer` (last-wins → routine) or an indented ` by: security-nfr` mis-classifies → the hook ALLOWs under `high-severity`. Masked today because `admit()` itself calls `validate()` and rejects the duplicate/malformed note structurally, so it never actually admits. A real defense-in-depth gap (the two parsing tiers disagree); fix for tier consistency.

### What HELD (round-2 closures confirmed solid by the independent red-team — round-4 need NOT re-touch)

- **GAP-C** (present non-string / non-object / corrupt config canonicalization): every `true`/`1`/`null`/`["all"]`/`{}`/`0`/`false`, non-object `context`, non-object whole-file → `"all"`/source `ok` → DENY a matched admit; corrupt/empty/whitespace config → `unreadable` → DENY; absent / `{}` / `{context:{}}` / exact `"off"` → ALLOW routine. **Solid at both tiers.**
- **off-case/whitespace**: `"OFF"`, `"Off"`, `" off "`, `"off "`, `"\toff"`, `"off\n"` → all DENY (only exact `"off"` is off-equivalent). **Correct.**
- **GAP-D** (case/whitespace-variant `by`): all casings of all 3 roles + leading/trailing space/tab → HOOK DENIES under `high-severity` (15/15); `admit()` REFUSES a self-authored `human:eve` stamp on every casing (15/15). **Solid at both tiers.**
- **GAP-B / D-01 floor** (self-set behind a wrapper, var pre-set in env): `VAR=eve node …admit`, `export …; node …admit`, `env VAR=eve node …admit`, `( VAR=eve node …admit )`, `nice VAR=eve node …admit` → all DENY (7/7). **Held through the new bypass classes.**
- **Over-block direction (CR-01 inverse)**: all inert mentions (single/double-quoted, `#`-comment, `<<EOF`/`<<-EOF` heredoc bodies, `render`/`validate` verbs, `grep admit`, path-named-`admit`-without-verb) ALLOW. **No false positives.**
- **Integrity**: `git diff --quiet hooks/guard.ts` exit 0 (byte-frozen `3501810e…`); `npm run freshness` exit 0 (21 fresh); `.ts` untouched; all probes in mkdtemp temp dirs; HEAD unchanged.

### Documented residual (NOT new, consistent with the honest residual)

`admit()`'s D-04 backstop fires only for `kind === "finding"`, so a high-severity-role `decision` note is admitted by the in-script tier on the 4 non-CC CLIs (covered on CC by the kind-independent hook). Consistent with the documented honest residual; not a new gap.

## Structural root fix for round 3 of gap-closure (the anti-whack-a-mole discipline, applied completely)

The recurring failure mode is "the checker is narrower than the format / the resolution is by enumeration at one more point." Round-4 must make resolution genuinely ONE authority:

1. **Resolve the effective command word over EVERY token in the leading run** — apply the same `effectiveCommandWord` (basename) + full de-quote normalization to **modifier tokens** before the `isCommandPrefix` test, so a path-form `/usr/bin/env`/`/usr/bin/nice` resolves to `env`/`nice` and is skipped exactly like the bare form (closes Class A).
2. **Fail CLOSED on EVERY dynamic production of the command word**, not just `$X`/`eval`/`sh -c`: a command word that is, or contains, a command substitution `$(…)` or backtick in command position is statically unresolvable → if the segment carries the admit shape, GATE (closes Class B; closes the `$X`-vs-`$(…)` asymmetry; needs tokenizer awareness of `$(`/backtick in command-word position).
3. **Classify EVERY live admit segment's note, not just the first `admit` token** — `noteFileFromCommand` must enumerate all admit segments and gate if ANY resolves to a gated severity (closes Class E, the critical one). "The boundary IS the parser" applied to note-file resolution.
4. **Make the hook's note parsing consistent with `validate()`** (reject duplicate/malformed `by` rather than last-wins mis-classify) to close the masked Class F defense-in-depth gap.
5. **Re-prove BOTH directions vs the newly committed `.js`** + an independent both-angle opus red-team that invents un-enumerated shapes (D-12). The green author suite is necessary-not-sufficient — it was green here and missed all four classes.

## Checkpoint outcome

**Task 25-05-04 (blocking human-verify): FAILED.** The independent both-angle red-team reproduced live exploitable bypasses vs the committed `.js`, so SC1 (and the SC1 multi-admit classifier facet) is NOT closed. SC2 + the GOV-02 audit ledger + the round-2 LOGIC closures (GAP-C/GAP-D/GAP-B) are PRESERVED and confirmed solid. The phase stays `gaps_found`; the plan is NOT complete and the ROADMAP phase is NOT flipped.

**Next:** `/gsd-plan-phase 25 --gaps` — round 3 gap-closure, fixing the structural root above (command-word resolution over modifiers + dynamic-production fail-closed + per-segment note classification), re-proven by an independent both-angle red-team.

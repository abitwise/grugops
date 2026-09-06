---
phase: 30-per-checkpoint-autonomy-matrix
plan: 11
subsystem: security
tags: [red-team, hooks, prod-deploy-guard, admission-guard, command-model, settings-env, fence, d-22]

requires:
  - phase: 30-10
    provides: red-team surface B, fenced at the same four-round cap, and the three inherited dispositions (V-30-10-01, V-30-10-03, V-30-08-01) surface A owns
  - phase: 30-08
    provides: the residual register rows and the GUARANTEES render that publish surface A's residuals
provides:
  - Red-team surface A run to D-22's four-round cap against the committed hook artifacts, with 42 findings closed under the six-clause closure standard
  - An empirical OBSERVATION of the settings-file environment vector (round 2, under the human's explicit one-write grant), replacing the composed inference AUTO-03 was written to remove
  - A written FENCE, confirmed by the user, stating that surface A is fenced and NOT closed
  - Thirty-one recorded residuals V-30-11-01..31, six of them zero-key bypasses with working reproductions against the final artifact
  - The wrapper (hooks/hook-entry.ts) with its per-decider code manifest, and the command model rewritten twice by deletion
affects: [any phase that words a guarantee about the two-key hook path, the prod-deploy guard, protected-branch refusal, or the §14 test-integrity gate]

actuals:
  tokens: 290302
  tasks: 3
  commits: 24

tech-stack:
  added: []
  patterns:
    - "A hook wrapper that verifies the decider's CODE (a generated per-decider closure manifest) rather than trusting the decider's own report"
    - "Fail-closed by DELETION: rounds 3 and 4 each closed their findings by removing grammar (a parser, a cap, a wrapper set, an alias reader, an allow token) rather than by widening it"
    - "Every bypass reproduced on the committed .js spawned as a process, never on the TypeScript source (D-23)"

key-files:
  created:
    - hooks/hook-entry.ts
    - scripts/generate-hook-manifest.ts
    - scripts/hook-manifest-freshness.ts
    - scripts/is-entry.ts
    - scripts/check-residual-citations.ts
    - docs/audit/30-redteam-surface-a.md
  modified:
    - scripts/checkpoints.ts
    - hooks/guard.ts
    - hooks/admission-guard.ts
    - hooks/hooks.json
    - scripts/context-io.ts
    - scripts/floor-invariance.test.ts
    - scripts/check-foundation-guards.test.ts
    - docs/GUARANTEES.md
    - docs/audit/28-residual-sizing.md
    - .planning/phases/30-per-checkpoint-autonomy-matrix/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "Surface A is FENCED, NOT CLOSED at D-22's four-round cap — the user's decision at the Task 3 checkpoint, 2026-09-06, option id `fence`"
  - "A post-cap finding becomes a recorded backlog item with its reproduction, never a fifth round (D-22 applied as written)"
  - "AUTO-03's 'agent-unwritable' premise is held as CONTENT with a disclosed backstop, not as a closed mechanism — the settings-file vector is OBSERVED and the wrapper's own integrity is repository-time only"
  - "Rounds 3 and 4 closed their findings by deleting grammar rather than repairing it (D-64 posture applied to the safety path)"
  - "No fix was made after the cap: fourteen post-cap findings are backlog V-30-11-16..29, plus V-30-11-30 and V-30-11-31 promoted from the round-4 observations"

patterns-established:
  - "The closure criterion is written down BEFORE the reviews run, so the judgement has a criterion rather than a mood"
  - "A count is asserted, not adopted — this plan re-measured a reviewer's own correction and found it one low"
  - "Annotate, never rewrite: a false sentence in the round log is marked FALSE in place, because the log records what was believed at each round"

requirements-completed: [AUTO-03, AUTO-04]

coverage:
  - id: D1
    description: "The two-key hook path was attacked on the artifact a host actually runs, across four gap-closure rounds; 42 findings were closed, each with a RED-first test, a mirror reproduction on the committed .js spawned as a process, a structural fix, and a mutation proof read out of the emitted artifact"
    requirement: "AUTO-03"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts, hooks/guard.test.ts, hooks/admission-guard.test.ts, scripts/floor-invariance.test.ts (136/136 re-run AFTER the final hook commit per D-24)"
        status: pass
      - kind: integration
        ref: "docs/audit/30-redteam-surface-a.md — mirror reproductions, 105/105 corpus through the wrapper and 105/105 through the bare decider"
        status: pass
    human_judgment: false
  - id: D2
    description: "The settings-file grant vector was reproduced empirically and its result recorded — a .claude/settings.local.json `env` entry reached a hook subprocess on the very next tool call (round 2, under the human's explicit one-write grant)"
    requirement: "AUTO-03"
    verification:
      - kind: manual_procedural
        ref: "docs/audit/30-redteam-surface-a.md — round 2 observer log; docs/audit/28-residual-sizing.md rows 9-10; docs/GUARANTEES.md §9-§10, re-verified byte-identical by reviewer 8"
        status: pass
    human_judgment: false
  - id: D3
    description: "The point-of-effect test-integrity refusal has no unguarded path and leaves no partial artifact: emitVerdict refuses GREEN rather than being given a false-equivalent env-var mechanism"
    requirement: "AUTO-04"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts — emitCheckpointNote totality (135 drives: 102 refused, 33 wrote, every write exactly one note and exactly two fences); emitVerdict integrity slot, 18 values, only the exact \"clean\" writes"
        status: pass
    human_judgment: false
  - id: D4
    description: "The closure judgement itself — surface A is fenced at the round cap with 31 residuals recorded, six of them zero-key bypasses with working reproductions"
    requirement: "AUTO-03"
    verification: []
    human_judgment: true
    rationale: "Closure on an open-ended adversarial search is not a property any test can establish. The stated criterion (two independent reviews each returning no reproduced bypass) FAILED, by nine reproduced bypasses across the two round-4 reviews; D-22 forbids a fifth round; so the disposition is a human judgement made against a written rule. The user chose `fence` on 2026-09-06 and confirmed the fence text and V-30-11-16..31 as written."

duration: 7h 9m
completed: 2026-09-06
status: complete
---

# Phase 30 Plan 11: Red-Team Surface A Summary

**Four adversarial rounds against the committed two-key hook artifacts closed 42 findings and ended in a written FENCE rather than a closure: the post-cap reviews returned fourteen more, six of them zero-key bypasses that executed real forced updates of a real remote through the final artifact.**

## Performance

- **Duration:** 7h 9m
- **Started:** 2026-09-06T11:32:42+03:00
- **Completed:** 2026-09-06T18:41:27+03:00
- **Tasks:** 3 of 3
- **Files modified:** 74 (this plan's commits only)

## The decision, recorded verbatim

> **The user chose `fence` at the Task 3 checkpoint and confirmed the fence text and the backlog entries `V-30-11-16` … `V-30-11-31` as written.**

Date: **2026-09-06**. Option id: **`fence`**. Recorded in `docs/audit/30-redteam-surface-a.md` § *Decision — 2026-09-06* and in `.planning/phases/30-per-checkpoint-autonomy-matrix/deferred-items.md` § *Decision — 2026-09-06*. `closed` was not available on the evidence; `another-round` is forbidden by D-22.

**This closure judgement is a human judgement.** It is marked `human_judgment: true` on coverage item `D4` above, with the rationale attached. No automated result was offered in support of it, and none exists.

## What the verifier must see

Three statements, stated here because every guarantee wording in this phase has to be read against them.

**1. Six zero-key bypasses executed against the FINAL artifact (HEAD `446ea2b`), not against a draft.** Four of the five zero-key command-model findings were executed under `bash -c` against **real `git 2.55.0` on a real bare remote**. Reviewer 7 records *"five separate remote mutations of `main` observed in `git --git-dir=…/remote.git rev-parse main`, three of them `(forced update)`"*. Per finding: `git -C sub push origin +main` → `+ 30c1a74...18db97f main -> main (forced update)` (`V-30-11-16`); three consecutive forced updates delivered through `GIT_CONFIG_COUNT` / `GIT_CONFIG_PARAMETERS` / `--config-env` (`V-30-11-17`); a **bare `git push`** — the ambiguous form `RA1-3` exists to deny — executing through a chained alias (`V-30-11-18`); a governed command inside a flag-shaped word reaching neither authority, executed against stub `kubectl`/`gh` and against real git (`V-30-11-19`); and `git push -fu` defeating **both** authorities → `+ 3202f43...9a0d4c3 feature -> feature (forced update)` (`V-30-11-20`). A sixth, `V-30-11-25`, produced a real **host-level ALLOW** (exit 0, zero bytes) on `git push --force origin main` through the wrapper, **with no D-20 banner in the transcript at all**. **All six required zero keys** — no grant, no env var, no human name, no approval of any kind. `V-30-11-25` additionally requires a repository-time `hooks.json` edit; the other five require nothing but the command text.

**2. The wrapper's integrity is a REPOSITORY-TIME control, not a runtime one.** The D-24 freeze, the per-decider code manifest and the build-parity gates are checks a repository runs on itself. None of them binds an agent at the moment of the tool call. **The wrapper cannot defend its own preload:** `NODE_OPTIONS=--require` grants arbitrary code inside the hook process before the wrapper's first line executes, with the manifest still verifying (`V-30-11-22`), and the verification it does perform is **not atomic** with the spawn it protects — a background writer in that window measured **87/352 = 24.7 % ALLOW** against a 0/124 control (`V-30-11-21`). A runtime answer needs a signed or read-only kit, which is a host-tier question this repository cannot settle.

**3. AUTO-03's "agent-unwritable" premise is held as CONTENT with a disclosed backstop, not as a closed mechanism.** The requirement's empirical half is satisfied and is the strongest evidence in the phase: the settings-file grant vector was **OBSERVED**, not inferred. What the six bypasses bound is the wording around it. The per-floor session env var is not *mechanically* unwritable by an agent — it is unwritable **through the channels this plan attacked and refused**, with two disclosed channels that remain open (`NODE_OPTIONS`, and any host settings file a human or an agent with settings access can write). This is the same disposition D-59 established for an open-set totality claim: state it as content, attach the backstop, and never publish it as a decided mechanism. **No AUTO-03 wording may generalise the observation into a claim that the safety floor refuses an unapproved forced update of a protected branch** — six reproductions say otherwise.

## The four rounds, with tallies

| round | findings closed | created by the PREVIOUS round's fixes | worst severity |
|---|---|---|---|
| 1 | 8 | — | HIGH: a crashed hook is an ALLOW at the host |
| 2 | 11 | **1 of 11** | HIGH: one global flag defeated every deploy pattern |
| 3 | 13 | **12 of 13** | HIGH: word-splicing defeated the literals AND the tokenizer |
| 4 | 10 | **10 of 10** | HIGH: a real force push to `main` executed |
| **post-cap** | **14 (NOT fixed — backlog)** | **11 of 14** | HIGH: real forced updates of `main`, zero keys |

**8 + 11 + 13 + 10 = 42 findings closed.** Each closure carries a failing test written before the fix existed, a mirror reproduction against the committed `.js` spawned as a process (D-23), a structural fix rather than a heuristic, a mutation proof read out of the emitted artifact, and a self-reproduction by the fixing agent against the fixed build.

Rounds 3 and 4 each closed their findings by **deleting** what the previous round had added — a parser, a segment cap, a wrapper set, a shell set, a suppression position, an alias reader, an allow token. The defect rate per round did not fall. What changed is the KIND of defect: rounds 1–2 found holes in code that had stood for phases; rounds 3, 4 and the post-cap review found holes in code written the week before, by this plan, **including in the mechanisms built specifically to answer the previous reviewer's question**.

## The eight independent reviews

All eight ran as fresh agents at **claude-opus (strongest available)** against the committed artifacts, with no access to each other's findings. Each report is reproduced verbatim in `docs/audit/30-redteam-surface-a.md`, with its scope statement, and the two round-4 reports additionally with the sha256 of the returned file. **Not one returned "nothing new."**

| # | round | scope as given | verdict |
|---|---|---|---|
| 1 | 1 | surface A, two-key hook path | FINDINGS: 5 |
| 2 | 1 | surface A, point-of-effect refusal + published residual | FINDINGS: 6 |
| 3 | 2 | surface A, command model + process invariant | FINDINGS: 7 |
| 4 | 2 | surface A, emitters + admission path + published residual | FINDINGS: 6 |
| 5 | 3 | surface A, rewritten command model + wrapper | FINDINGS: 6 |
| 6 | 3 | surface A, emitters + admission + residual + gate homes | FINDINGS: 4 |
| 7 | 4 | surface A, command model + wrapper (sha256 `95710a7d…fceb`) | FINDINGS: 7 — five zero-key, **every one executed** |
| 8 | 4 | surface A, reachability + emitters + admission + published residual (sha256 `cb1d8907…358b`) | FINDINGS: 7 — four reproduced |

Reviewers 1+2 produced round 2's eleven; 3+4 produced round 3's thirteen; 5+6 produced round 4's ten; **7+8 produced the fourteen post-cap findings that are now backlog.** Round 1's eight came from the executing agent's own first-pass attack.

**The additivity checks are part of the record.** Reviewer 7 re-ran **86/86 prior-denial rows (all still DENY)** and **41/41 legitimate commands (all still ALLOW)** on the committed `.js`, with wrapper and bare decider agreeing on **every one of ~200 command probes**. No prior-denied input is now allowed; no prior-allowed input now denies.

## The fence

> **Surface A is FENCED, NOT CLOSED.**
>
> Four adversarial gap-closure rounds ran against the two-key hook path — the prod-deploy guard, the admission guard, the command model, the hook entry point, the fresh environment read, the self-set refusal — and against the point-of-effect test-integrity refusal. They closed **8 + 11 + 13 + 10 = 42 findings**. Each closure carries a failing test written before the fix existed, a mirror reproduction against the **committed `.js` spawned as a process**, a structural fix rather than a heuristic, and a mutation proof read out of the emitted artifact.
>
> **No round returned "nothing new."** Eight independent reviews at the strongest available model ran across the four rounds, and every one of them found something.
>
> **The rate at which each round's own repairs manufactured the next round's findings did not fall:** round 2's 1 of 11, round 3's 12 of 13, round 4's 10 of 10, and post-cap 11 of 14. Rounds 3 and 4 each closed their findings by DELETING what the previous round had added. What changed across the four rounds is not the defect rate but the KIND of defect: rounds 1–2 found holes in code that had stood for phases; rounds 3, 4 and the post-cap review found holes in code written the week before, by this plan, including in the mechanisms built specifically to answer the previous reviewer's question.
>
> **The post-cap findings are executable, not theoretical.** Four of the five zero-key command-model findings were EXECUTED against real `git 2.55.0` on a real bare remote, producing real forced updates of `main` with **zero keys** — no grant, no env var, no human name, no approval of any kind. A sixth produced a real host-level ALLOW on a force push to `main` with **no D-20 banner in the transcript at all**.
>
> **The settings-file environment vector was OBSERVED, not inferred.** In round 2, under the human's explicit one-write grant, a `.claude/settings.local.json` `env` entry reached a hook subprocess on the very next tool call. The residual register and `docs/GUARANTEES.md` §9–§10 tier that measurement honestly and separately from what remains inferred.
>
> **What is established, and is the floor the whole design rests on:** the hook is a separate process whose environment an agent's own tool call cannot reach **[observed]**; a settings-file `env` entry DOES reach that process **[observed, round 2]**; and the wrapper verifies the decider's CODE rather than trusting anything the decider says about itself.
>
> **What is NOT established, stated plainly:** the wrapper's own integrity is a **repository-time control, not a runtime one.** The freeze, the manifest and the build-parity gates are checks a repository runs on itself; none binds an agent at the moment of the tool call. **The wrapper cannot defend its own preload** — `NODE_OPTIONS=--require` grants arbitrary code inside the hook process before the wrapper's first line executes, with the manifest still verifying, and the verification it does perform is not atomic with the spawn it protects. A runtime answer needs a signed or read-only kit, which is a host-tier question this repository cannot settle.
>
> **The gates named in this log are evidence, not proof.** Each refuses a specific, named, reproduced bypass; none establishes that no further bypass exists, and the measured trend says another round would find more. Closing would assert exactly what the evidence denies. D-22 caps the surface at four rounds precisely so this judgement is made by a written rule rather than by whoever is tired — and the honest word at the cap is **fenced**.

The full fence text, with the per-finding execution transcripts and the round-by-round table, is in `docs/audit/30-redteam-surface-a.md` § *THE FENCE — final* and is reproduced in the phase's `deferred-items.md`.

**The criterion that was NOT met**, written down in advance so the judgement had a criterion: *two independent reviews at the strongest available model, over the surfaces named in the round-4 scope statement, each returning no reproduced bypass.* Reviewer 7 returned five executed bypasses; reviewer 8 returned four reproduced ones.

## The settings-env observation, and exactly what remains unobserved

**OBSERVED (round 2, under the human's explicit one-write grant, one write, backup taken and byte-verified restore afterwards):** a `.claude/settings.local.json` `env` entry **reached a hook subprocess on the very next tool call**. This is what AUTO-03 asked for: the render's wording about the vector no longer rests on a composed inference.

**Also observed, and re-verified by reviewer 8 at HEAD:** `hooks/hooks.json` carries exactly two PreToolUse matchers (`Bash` and `mcp__grugops__.*`), neither matching `Write` or `Edit`; there are zero `permissions.deny` recommendations anywhere in `install/`, `agent-factory/`, `.claude-plugin/` or `hooks/`; and the `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` binary contains **zero** `GRUGOPS` strings, with the membership of that scrub list explicitly **not** extracted.

**UNOBSERVED, and published as `[inferred]` with that marking, not softened:**

1. **That an agent's own inline `export` never reaches the hook process.** This is the *protective* half — the half the guarantee leans on — and it is published as `[inferred]`, with the register row stating **in capitals** that it has never been exercised. It was never tested by a live agent export into a live hook read.
2. **That a human's session export does reach the hook.** Published as `[inferred]`; row 10 independently marks it unobserved.
3. **The membership of Claude Code's subprocess env-scrub list.** Bounded in both directions (off by default outside CI; zero `GRUGOPS` strings in the binary) and deliberately not extracted.
4. **The former clause "and the existing grants work on this host" is WITHDRAWN** — rows 9 and 10 do not disagree about the one measurement.

Reviewer 8's residual-wording audit tiered every clause in rows 9–10 and found **no clause inferred-but-published-flat**, with the register↔page byte identity holding (row 9 body 6300 bytes, row 10 body 2221 bytes) and versions reconciling 1:1.

## Every residual, by id and direction

`V-30-11-01` … `V-30-11-15` were drafted in round 4; four were corrected in place after the round-4 fence audit, with the correction marked. `V-30-11-16` … `V-30-11-29` are the fourteen post-cap findings, **none of which was fixed** — D-22's rule is that a post-cap finding is backlog behind a written fence. `V-30-11-30` and `V-30-11-31` were promoted from the round-4 observations so they are not lost.

### Command-model residuals (drafted round 4)

| id | severity | direction | one line |
|---|---|---|---|
| `V-30-11-01` | MEDIUM | permissive | `git merge` is undecidable from the command text; refusing the ambiguous form would leave no legal spelling |
| `V-30-11-02` | MEDIUM | permissive | a `.git/config`-persisted alias: the `git config` write DENIES, a plain file write does not |
| `V-30-11-03` | — | **WITHDRAWN AS DRAFTED** | all four of its own examples DENY; the real residual in that family is `V-30-11-19` |
| `V-30-11-04` | LOW | over-refusal | three measured false denials from the position and opacity rules, all fail-closed |
| `V-30-11-05` | LOW | over-refusal | the literal patterns match whole-line (`rg 'kubectl apply' --type ts` denies) |
| `V-30-11-06` | LOW | permissive | `setenv NAME me` (csh) escapes the self-set detector; per D-64 the answer is not to widen |

### Process and gate residuals (drafted round 4)

| id | severity | direction | one line |
|---|---|---|---|
| `V-30-11-07` | MEDIUM | invisible | the deny is lost when stdout is unwritable; not agent-reachable, so the invariant holds **under a writable stdout** |
| `V-30-11-08` | MEDIUM | permissive | **CORRECTED, was too narrow**: the manifest verifies the decider's closure, not the wrapper's own integrity — and two further defeats (`V-30-11-21`, `V-30-11-22`) need no write to `hook-entry.js` at all |
| `V-30-11-09` | LOW | process | **CORRECTED**: not "3 of 8 in CI" — 9 freshness scripts, **6** in `ci.yml`, and `:queue`/`:traceability`/`:hook-manifest` at **zero** |
| `V-30-11-10` | MEDIUM | invisible | `readCheckpointMatrix` does not hold TINT-03: `test_integrity: "off"` round-trips with zero refusals. Latent |
| `V-30-11-11` | LOW | invisible | any agent can withdraw a live green verdict via `supersedes`; fail-safe in direction, recorded nowhere |
| `V-30-11-12` | LOW | permissive | `emit-verdict … clean ""` lands the note under the process CWD (`?? ` defaults only on `undefined`) |
| `V-30-11-13` | LOW | invisible | `render()` re-implements `currentState`'s supersede fold inline — two implementations of one predicate |
| `V-30-11-14` | MEDIUM | publishes an unmarked clause | the per-clause marker gate is DECLINED, now with **two** measured costs attached (`RA6-2`, and `V-30-11-28`) |
| `V-30-11-15` | LOW | invisible | `EXTERNAL:` renders literally on the public page — an internal gate token leaked into published prose |

### The fourteen post-cap findings (backlog under D-22, NOT fixed)

| id | finding | severity | direction | one line |
|---|---|---|---|---|
| `V-30-11-16` | `RA7-1` | **HIGH** | permissive, zero keys | `PROTECTED_REF_RE` reads only a whole-word ref, so every `+`/`:` refspec escapes it — **executed a forced update of `main`** |
| `V-30-11-17` | `RA7-2` | **HIGH** | permissive, zero keys | git config is deliverable through the ENVIRONMENT in the same command text — **three consecutive forced updates** |
| `V-30-11-18` | `RA7-3` | **HIGH** | permissive, zero keys | a chained alias feeds the push rule a candidate tail that is an alias NAME — **executed a bare `git push`** |
| `V-30-11-19` | `RA7-4` | **HIGH** | permissive, zero keys | the re-tokenization skips flag-shaped words, so a governed command inside one reaches neither authority |
| `V-30-11-20` | `RA7-5` | **HIGH** | permissive, zero keys | a combined short flag (`-fu`) defeats the force rule in **both** authorities — **executed a forced update** |
| `V-30-11-21` | `RA7-6` | **HIGH** | permissive | the manifest verification is not atomic with the spawn — **24.7 % ALLOW** measured against a 0/124 control |
| `V-30-11-22` | `RA7-7` | MEDIUM | permissive + invisible | `NODE_OPTIONS` is a stronger grant than the three `GRUGOPS_` names the self-set vocabulary enumerates |
| `V-30-11-23` | `RA8-1` | **HIGH** | permissive to the reader + invisible | the derived runner set accepts a **commented-out** `ci.yml` line as proof a gate is reached |
| `V-30-11-24` | `RA8-2` | **HIGH** | invisible | `freshness:hook-manifest` is invoked by nothing, and the suite substitute cannot see a per-decider short manifest |
| `V-30-11-25` | `RA8-3` | **HIGH** dir. / MEDIUM reach. | permissive + invisible | an `Object.prototype` decider name skips the manifest check entirely; the fd-3 token then ALLOWs a force push, banner-free |
| `V-30-11-26` | `RA8-4` | MEDIUM, latent | permissive + invisible | `emitVerdict`'s `id` has no type check — a missing caller field mints the live green stamp `§14-gate#undefined` |
| `V-30-11-27` | `RA8-5` | MEDIUM | invisible | the entrypoint guard scans `scripts/*.ts` only (not `hooks/`) and matches one operand order |
| `V-30-11-28` | `RA8-6` | MEDIUM | invisible | a set the shipped source calls **DERIVED** is a hand-written literal, and nothing asserts it |
| `V-30-11-29` | `RA8-7` | LOW/MED | invisible | `V-30-11-09` as drafted hid the problem; three freshness gates run in NO CI step |

### Promoted from the round-4 observations

| id | severity | direction | one line |
|---|---|---|---|
| `V-30-11-30` | LOW | over-refusal | five NEW false denials created by round 4's re-tokenization, all fail-closed (`gh pr create --body '… npm publish …'` and four more) |
| `V-30-11-31` | LOW | false published claim | the 10 s wrapper-timeout justification is FALSE: the model is quadratic in tool-name occurrences per segment, so the timeout is input-reachable (10 047 ms → SIGTERM → fail-closed DENY) |

### Inherited from surface B, still owned here

`V-30-10-01` **CLOSED** and re-verified (the config reader's refusals reach the transcript on every invocation). `V-30-10-03` **DECIDED** and re-verified across seven `trustedRepoRoot` shapes. `V-30-10-04` item 2 **CLOSED** (`A-4`). `V-30-08-01` **open and widened twice** — a self-set attempt leaves nothing in the trace, round 2 found a `+=` spelling that left nothing in the transcript, and `V-30-11-22` now shows the strongest grant on that channel is refused by nothing and recorded nowhere.

Nine rows are recorded in `.planning/WINDOWS.md` (ids 119–127) so the ship gate sees them.

## Task Commits

1. **Task 1 — attack the two-key hook path on the committed artifacts** — rounds 1–4, 21 commits from `b02550d` (round 1, six findings) through `446ea2b` (round-4 final state), including `ac4b2c6` (round 3), `d117f7b` (round-3 artifact) and `5e394af` (the citation gate's missing test module).
2. **Task 2 — attack the point-of-effect refusal; settle the settings-file vector empirically** — interleaved with Task 1's rounds by design (the emitters and the published residual were in every reviewer's scope), landing in the same commit series; the settings-file observation is recorded in the round-2 section of the round log and in `docs/audit/28-residual-sizing.md` rows 9–10.
3. **Task 3 — the closure checkpoint** — `376d2f0` (finalize the fence: both round-4 reviews verbatim, `V-30-11-16..31`, the four corrections) and `5f37363` (record the user's `fence` decision).

**Plan metadata:** see the final `docs(30-11)` commit.

## Files Created/Modified

- `hooks/hook-entry.ts` / `.js` — the wrapper created in round 3; verifies each decider's code closure against a generated manifest, rejects `allow` and `ask`, bounds the spawn, and converts every abnormal termination into a fail-closed deny
- `scripts/checkpoints.ts` / `.js` — the command model, rewritten by deletion in round 3 and deleted from again in round 4 (the segment cap, the wrapper set, the shell set, the alias reader)
- `hooks/guard.ts` — byte-frozen under D-24 (`FROZEN_GUARD_BLOB` unchanged through round 4); carries the `exitCode = 0` fix that turned a crashed hook from an ALLOW into a deny
- `scripts/generate-hook-manifest.ts`, `scripts/hook-manifest-freshness.ts` — the per-decider closure manifest and its drift gate (which `V-30-11-24` shows CI never runs)
- `scripts/is-entry.ts` — the single entrypoint authority created for `RA6-1` (whose guard `V-30-11-27` shows is narrower than the sentence publishing it)
- `scripts/check-residual-citations.ts` — the citation gate, wired into CI in round 4
- `scripts/context-io.ts` — the emitters; `emitCheckpointNote`'s one-loop body-field guard, `trustedRepoRoot`, the config reader's refusal publication
- `docs/audit/30-redteam-surface-a.md` — the round log: 4 rounds, all eight reviewer reports verbatim, the fence, the backlog, the decision
- `docs/GUARANTEES.md`, `docs/audit/28-residual-sizing.md` — the published residual rows, every clause tiered
- `.planning/phases/30-per-checkpoint-autonomy-matrix/deferred-items.md`, `.planning/WINDOWS.md` — the capture surfaces

## Decisions Made

1. **`fence`, not `closed`** (the user, 2026-09-06). The written criterion failed by nine reproduced bypasses; D-22 forbids a fifth round.
2. **Delete grammar, do not widen it.** Rounds 3 and 4 each closed their findings by removing a parser, a cap, a set or a token. This is D-64's posture applied to the safety path, and it is why round 4's fixes are smaller than round 3's.
3. **Annotate, never rewrite.** The false timing sentence and the stale gate counts in the round log are marked FALSE **in place**, because the log's job is to record what was believed at each round.
4. **A count is asserted, not adopted.** Reviewer 8's own correction of `V-30-11-09` said "5 of 9 freshness gates in CI"; re-measured here, it is **6** (bare `npm run freshness` appears on two lines and its `uniq -c` collapsed them). The load-bearing half — three gates at zero — is confirmed exactly.
5. **No fix after the cap.** Fourteen post-cap findings, including five HIGH zero-key executable bypasses, were **not fixed**. That is D-22 working, not D-22 being ignored.

## Deviations from Plan

The plan's Task 1 and Task 2 were executed as **interleaved rounds** rather than as two sequential blocks. Every reviewer's scope statement spanned both (the command model and the emitters are attacked by the same reviewer pair each round), so separating the commit series would have produced a false chronology. Both tasks' acceptance criteria are met in full and are traceable in the round log by round rather than by task.

Two artifacts not in the plan's `files_modified` were created because a round's structural fix required them: `hooks/hook-entry.ts` (round 3, `RA3-7` — the invariant had to leave the decider process) and `scripts/is-entry.ts` + `scripts/generate-hook-manifest.ts` + `scripts/hook-manifest-freshness.ts` + `scripts/check-residual-citations.ts` (round 4, `RA5-5` and `RA6-1` — reachability). Each is Rule 2 (missing critical functionality identified by an adversarial review) and each is recorded with its finding.

**Total deviations:** 2 structural (both Rule 2, both required by a named finding). **Impact:** no scope creep — every added file exists to close a reproduced bypass, and each one's own defects are now recorded as backlog rather than assumed away.

## Issues Encountered

- **A fix whose own premise was false.** The round-1 exit handler emitted deny JSON on exit 13, which is **non-blocking at the host** — an ALLOW. Fixed with `process.exitCode = 0` and verified empirically, exit code by exit code.
- **Four mutations SURVIVED across rounds 2–4**, each exposing a fix with no test. Adding the tests then exposed **three false controls in this plan's own suite** (`P6`, `Q6`, `Q8`), where the case under test never reached the branch it named. Each was re-isolated by hash-sealing the fixture.
- **A hang stopped the suite instead of reddening it** (round 2, `N4c`, >20 min). Every spawn is now bounded at 20 s.
- **Targeted runs were green while 44 cases across 6 files were red.** Recorded as a standing lesson: run the whole suite, not the files you touched.
- **The settings experiment was initially BLOCKED** by the host's auto-mode permission classifier. That was recorded verbatim as "could not be run" with **no workaround attempted**, and the experiment ran later only under the human's explicit one-write grant.
- **One transient**: `scripts/freshness.test.ts` failed once under load and passed on the next full run and in isolation. Both bracketing runs are quoted in the round log; it is recorded as a timing flake, not a result.

## Follow-Up Work

Owners are proposed in `deferred-items.md`. In dependency order of value:

1. **The command model** — `V-30-11-16`, `-17`, `-18`, `-19`, `-20` are one task, and the cheapest form is `V-30-11-17`'s deletion (which subsumes `V-30-11-18`) plus a refspec-destination rule and letter-membership for clustered short flags applied to **both** authorities.
2. **The wrapper** — `V-30-11-21`, `-22`, `-25`. This is the task that decides whether the wrapper is a runtime control at all.
3. **Gate reachability** — `V-30-11-23`, `-24`, `-27`, `-29`: derive the runner set from the CI grammar the repository already owns, over a set derived from the tree.
4. **The emitters** — `V-30-11-26`, `-28`.

## Known Stubs

None. No stub, placeholder or TODO was introduced by this plan. The fourteen post-cap findings are **recorded open defects with reproductions**, not stubs — they are tracked as `V-30-11-16` … `V-30-11-31` in `deferred-items.md` and as rows 119–127 in `.planning/WINDOWS.md`.

## Threat Flags

None new. The plan's register (`T-30-45` … `T-30-49`) is discharged as follows: `T-30-45` **mitigated** (one self-set detector derived from the roster, attacked across eight spellings) **and widened** — `V-30-11-22` shows the vocabulary is narrower than the channel. `T-30-46` **accepted and now OBSERVED** rather than inferred. `T-30-47` **mitigated** (every path into the emitter reaches the refusal; no file survives a refusal, measured over 135 drives). `T-30-48` **answered with evidence** — the freeze is commit-scoped and was verified after each of the hook commits this plan made. `T-30-49` **mitigated by construction**: suite greenness is offered as a closure argument nowhere in this record, and all four rounds plus both post-cap reviews ran against a fully green suite and found HIGH-severity executable bypasses anyway.

## Self-Check: PASSED

Every file this summary claims was created exists on disk (`hooks/hook-entry.ts`,
`scripts/generate-hook-manifest.ts`, `scripts/hook-manifest-freshness.ts`, `scripts/is-entry.ts`,
`scripts/check-residual-citations.ts`, `docs/audit/30-redteam-surface-a.md`). Every commit hash cited
resolves in `git log` (`b02550d`, `ac4b2c6`, `d117f7b`, `5e394af`, `446ea2b`, `376d2f0`, `5f37363`).
The Task-1 commit count was re-derived from `git log` rather than estimated (21, not the 20 first
written) and corrected in place.

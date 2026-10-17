---
phase: 27-spawn-correctness-kit-set-authority
plan: 15
subsystem: packaging
tags: [typescript, guards, adapters, capability-announcement, command-name, byte-ceiling, generator]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "the byte-gated .claude/agents adapter set + directory set-equality (27-10/27-11), the tier-announcement beats and their per-beat cases (27-08), the generated coordinator adapter (27-07), guardAdapterBody's anchored-sentence rewrite (27-14)"
provides:
  - "a reduced-tier capability announcement naming a command that exists in a shipped install form"
  - "one command vocabulary across four surfaces: packaging template, coordinator role file, install readme entry-tier section, packaging adapters document"
  - "a sixth tier-announcement beat comparing the command name mechanically, with an optional per-beat consequence clause"
  - "two RED cases pinning the beat TO the shipped command rather than AGAINST one stale typo"
  - "a recorded deferral for the same stale token in CLAUDE.md and the historical brand manual"
affects: [27-16, 27-17, 28, check-foundation-guards, generate-role-adapters, subagent.frontmatter.md]

tech-stack:
  added: []
  patterns:
    - "A capability announcement's actionable nouns (a command a reader types) need the same mechanical pin its labels have — prose agreement is not checked agreement"
    - "Pin a value TO the correct string, never merely AGAINST the known-wrong one: add an arbitrary-wrong RED case beside the stale-value case"
    - "State the byte budget before the edit and re-measure after; tighten prose if it misses, never raise a ceiling"
    - "When a correction must reach a generated artifact, find which source actually emits it — a template that documents a body shape is not necessarily the source of that body"
    - "Reproduce the live defect against the PRE-FIX binary on the same tree, so the transcript shows the identical input passing and then failing"

key-files:
  created: []
  modified:
    - agent-factory/packaging/subagent.frontmatter.md
    - agent-factory/roles/orchestrator.md
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - .claude/agents/grugops-orchestrator.md
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The correct command is `/grugops`, CONFIRMED FROM THE TREE, not adopted from the finding: the seven standalone skill directories are `.claude/skills/grugops*` and each SKILL.md's `name` key matches its directory (`grugops`, `grugops-gate`, `grugops-map`, `grugops-plan`, `grugops-release`, `grugops-ticket`, `grugops-uat`), so the headline entry is `/grugops` and the dash forms are `/grugops-plan` etc.; install/README.md §3 records the plugin form as colon-namespaced (`/grugops:plan`). Formatting matched to the two already-correct documents exactly: inline code, `` `/grugops` ``."
  - "FOUR sources, not the three the plan named. The plan's byte budget was right and its file list was one short: the coordinator adapter BODY is emitted from an inline string array in `scripts/generate-role-adapters.ts`, not from the packaging template. 27-14's own residual recorded that link as convention-plus-comment. Editing only the template would have left the shipped adapter body stale while every gate stayed green."
  - "The new beat carries its OWN consequence clause via an optional `why` field defaulting to the existing drops-a-tier wording, so the five original beats' findings stay byte-identical while the command-name finding says what actually went wrong in a reader's terms."
  - "TWO RED directions, and the arbitrary-command one is the load-bearing half: a beat that only excludes `/grug` would go green on the NEXT wrong name. `/factory` and `/grugops-orchestrator` were both confirmed red."
  - "CLAUDE.md and docs/initial/grugops_brand_manual.md are DEFERRED, named not silent — document drift owned by the audit phase (28 / AUDIT-01..04), and the plan's prohibitions forbid editing them here."

patterns-established:
  - "Confirm the correct value from the filesystem before editing, and record the observed evidence — the plan explicitly allowed stopping if the tree contradicted the finding"
  - "Run the PRE-FIX committed binary against the planted tree first; 'ALL CHECKS PASSED' on the defect is the proof the new beat is what turns it red"

requirements-completed: [SPAWN-01]

coverage:
  - id: D1
    description: "The reduced-tier capability announcement in the packaging template, the coordinator role file and the generated coordinator adapter all name `/grugops`, formatted identically to the two already-correct user-facing documents"
    requirement: "SPAWN-01"
    verification:
      - kind: manual
        ref: "grep -rc '`/grug`' over the packaging template, the coordinator role file and .claude/agents/*.md → total 0"
        status: pass
      - kind: manual
        ref: "grep -c '`/grugops`' → subagent.frontmatter.md 2, orchestrator.md 1, install/README.md 3, packaging/adapters.md 2"
        status: pass
    human_judgment: false
  - id: D2
    description: "The correction reached the shipped artifact through the generator, and changed only the coordinator adapter"
    requirement: "SPAWN-01"
    verification:
      - kind: integration
        ref: "npm run generate:adapters → 17 written; node scripts/adapters-freshness.js → 0 byte differences, directory listings set-equal; git diff --name-only listed grugops-orchestrator.md as the only generated file changed"
        status: pass
      - kind: manual
        ref: "git diff .claude/agents/grugops-orchestrator.md → exactly two hunks, each the command token (description line + reduced-tier body line)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both byte ceilings hold with their values unchanged; the budget was stated in advance and re-measured"
    requirement: "SPAWN-01"
    verification:
      - kind: unit
        ref: "wc -c → agent-factory/roles/orchestrator.md 7087→7090 (warn 7165 / fail 7570); .claude/agents/grugops-orchestrator.md 3055→3061 (warn 3072 / fail 4096)"
        status: pass
      - kind: manual
        ref: "git diff HEAD~2 HEAD -- scripts/check-foundation-guards.ts | grep -E '^[-+].*(7570|7165|3072|4096)' → no matches; no ceiling line was touched"
        status: pass
      - kind: integration
        ref: "node scripts/check-foundation-guards.js → exit 0, zero FAIL lines, zero WARN lines (baseline was also zero/zero)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The command name is compared by the guard that already compares the tier labels, and a divergence fails red in both directions"
    requirement: "SPAWN-01"
    verification:
      - kind: integration
        ref: "npx vitest run scripts/check-foundation-guards.test.ts -t 'command name' → 2 passed (stale `/grug` plant; arbitrary `/factory` plant), each asserting the beat label and the file name"
        status: pass
      - kind: manual
        ref: "hermetic CHECK_ROOT mirror, three plants (`/grug`, `/factory`, `/grugops-orchestrator`) → each exit 1 with exactly 1 CHECK(S) FAILED naming the beat; unplanted mirror exit 0 before and after"
        status: pass
      - kind: integration
        ref: "guard PASS line reports 'all 6 tier-announcement beats' (was 5); the five original per-beat removal cases pass unchanged"
        status: pass
    human_judgment: false
  - id: D5
    description: "The pre-fix binary is shown to be green on the exact defect, so the beat is demonstrably what closes it"
    requirement: "SPAWN-01"
    verification:
      - kind: manual
        ref: "same hermetic mirror with `/grug` planted: `git show HEAD:scripts/check-foundation-guards.js` (5 beats) → 'ALL CHECKS PASSED', exit 0; post-fix build on the identical tree → exit 1 naming the beat"
        status: pass
    human_judgment: false
  - id: D6
    description: "No adjacent gate regressed"
    requirement: "SPAWN-01"
    verification:
      - kind: integration
        ref: "npm run build exit 0; npm run freshness → 30 committed .js fresh; node scripts/check-kit-refs.js exit 0; node scripts/check-uat-oracles.js exit 0; npx vitest run --exclude '**/scripts/e2e/**' → 34 files, 940 passed (was 938), 2 skipped"
        status: pass
    human_judgment: false

metrics:
  duration: 40m
  completed: 2026-07-29
  tasks: 2
  files: 8

status: complete
---

# Phase 27 Plan 15: Make the Shipped Kit Name a Command That Exists Summary

The reduced-tier capability announcement told a reader that the tier is "what `/grug` gets". No
install form ships `/grug`. It now says `/grugops` in all four surfaces, and the command name is
compared on every run by the same guard that compares the tier labels — with the pre-fix binary shown
green on the exact defect and the post-fix binary red on the identical tree.

## What Was Built

### Task 1 — `fix(27-15)`, commit `67aad01`

**The evidence was confirmed from the tree first, as the plan required, rather than adopted from the
finding.** The seven standalone skill directories are `.claude/skills/grugops`, `grugops-gate`,
`grugops-map`, `grugops-plan`, `grugops-release`, `grugops-ticket`, `grugops-uat`, and each
`SKILL.md`'s `name` key matches its directory byte-for-byte. So the headline standalone entry is
`/grugops` and the others are the dash forms. `install/README.md` §3 records the plugin path as
colon-namespaced (`/grugops:plan`). Neither form yields `/grug`. The two already-correct surfaces
write it as inline code — `` `/grugops` `` — and every edit below matched that formatting exactly, so
the four surfaces are literally comparable rather than merely consistent in spirit.

Four occurrences were corrected:

| Source | Occurrence | Reaches |
|---|---|---|
| `agent-factory/packaging/subagent.frontmatter.md` | the fenced body shape's reduced-tier line | the documented contract |
| `agent-factory/packaging/subagent.frontmatter.md` | the tier prose paragraph below the fence | the kit's own explanation |
| `agent-factory/roles/orchestrator.md` | the `## Activates when` line | the adapter's `description` |
| `scripts/generate-role-adapters.ts` | the inline coordinator body string | the adapter's **body** |

Nothing else in those sentences moved. The three tier labels, the enforcement-disclosure sentence and
the capability-sensing sentence are byte-unchanged.

**The byte budget was stated before the edit and re-measured after**, exactly as the plan demanded and
with the plan's predicted values hit on the nose. `/grug` → `/grugops` is +3 bytes per occurrence.

| File | Before | After | Warn | Fail | Margin after |
|---|---|---|---|---|---|
| `agent-factory/roles/orchestrator.md` | 7087 | **7090** | 7165 | 7570 | 75 B to warn |
| `.claude/agents/grugops-orchestrator.md` | 3055 | **3061** | 3072 | 4096 | 11 B to warn |

Neither ceiling was touched. `git diff HEAD~2 HEAD -- scripts/check-foundation-guards.ts` matched
nothing on `7570|7165|3072|4096`. No prose tightening was needed, so the plan's fallback remedy went
unused.

`npm run generate:adapters` wrote all 17 adapters; `adapters-freshness.js` reported 0 byte
differences with directory listings set-equal; and `git diff --name-only` listed
`.claude/agents/grugops-orchestrator.md` as the only generated file changed. Its diff is exactly two
hunks, each one the command token — the `description` line and the reduced-tier body line.

### Task 2 — `fix(27-15)`, commit `cc6ba17`

A sixth beat joined `TIER_BEATS`:

```
{ label: "reduced-tier command name",
  needle: "a default main thread, what `/grugops` gets",
  why:    "the coordinator body names a command the kit does not ship, so a reader told what this
           tier gets cannot map it onto anything they can type — the announcement becomes
           unactionable in the one place it must not be" }
```

`why` is a new **optional** per-beat field with `BEAT_DEFAULT_WHY` holding the drops-a-tier wording
the five original beats have always carried, so their findings are byte-identical and their five
existing removal cases pass unchanged. Only a beat whose consequence is genuinely different states its
own — and a wrong command name is not an overstated enforcement, it is an unactionable instruction.

The beats stayed local to the guard, for the reason already recorded there: one consumer, and a shared
module with one consumer is a second authority with nothing to justify it.

The comment beside the beat records both things the plan asked for. **Why this pin was needed:** plan
27-09 claimed "one vocabulary across two surfaces" and the labels did agree, so the claim looked
checked; the command name inside the same sentence was never compared, and this beat closes the gap
between what was pinned and what was claimed. **Why no other guard can see it:** `guardVoice()` runs
`neutralizePhrases()`, whose first substitution rewrites `/grug` to the marker-free filler `BRANDCMD`
before any inspection happens, so the token is invisible to the voice guard by construction;
`guard_adapter_body`'s negative half only knows retired memory-relay vocabulary, and a wrong command
name is not in it.

Two RED cases were added, both titled with `command name`. The stale-value case plants `` `/grug` ``.
The arbitrary case plants `` `/factory` `` — and it is the load-bearing one, because a beat that
merely excludes the known typo would go green on the next wrong name. Both assert the beat label, the
file name, and the new consequence text. Each also asserts the fixture still contains `` `/grugops` ``
before planting, so a future drift cannot turn the case into a silent no-op plant.

## Verification Evidence

Every command below was run and its real output observed.

| Command | Result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | `All build outputs fresh: 30 committed .js file(s) match a fresh tsc rebuild.` |
| `npm run generate:adapters` | `wrote 17 adapters … (coordinator grugops-orchestrator grants 16 names)` |
| `node scripts/adapters-freshness.js` | `17 adapter(s) compared … 0 byte difference(s), directory listings set-equal` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, **0** FAIL lines, **0** WARN lines, exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `node scripts/check-uat-oracles.js` | exit 0 |
| `npx vitest run … -t "command name"` | 2 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 34 files, **940 passed** (was 938), 2 skipped |

The bare package test script was never run — it triggers the live model-CLI end-to-end lane.

Baseline was captured before any edit: guards exit 0 with zero FAIL and zero WARN lines, adapters
fresh, kit-refs and UAT oracles both exit 0. So no result below is a pre-existing failure.

The live guard line, quoted verbatim:

```
PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23
non-coordinator adapter bodies + 2 packaging template(s) checked), and the coordinator body carries
all 6 tier-announcement beats
```

Token accounting, scoped to the paths the acceptance criteria name:

- `` `/grug` `` across `subagent.frontmatter.md` + `orchestrator.md` + every file in `.claude/agents/`
  → **0**.
- `` `/grugops` `` → `subagent.frontmatter.md` **2**, `agent-factory/roles/orchestrator.md` **1**,
  `install/README.md` **3**, `agent-factory/packaging/adapters.md` **2** — identical inline-code
  formatting on all four.

### Adversarial reproduction (a green suite is not proof for a safety invariant)

Green tests were not accepted as evidence. A hermetic mirror of the whole live tree was built in a
scratch directory and driven through `CHECK_ROOT`, outside the vitest harness. The unplanted mirror
was confirmed exit 0 before and after every plant, so no plant passed or failed for an unrelated
reason.

1. **Three wrong values, not one.** `` `/grug` ``, `` `/factory` `` and `` `/grugops-orchestrator` ``
   were each planted over the coordinator body. Each produced exit 1 with **exactly** `1 CHECK(S)
   FAILED` naming `reduced-tier command name` and the adapter path — one failure, so nothing else was
   collaterally tripped. Restoring the token returned the mirror to exit 0.
2. **The live defect, reproduced on the pre-fix binary.** With `` `/grug` `` planted, the guard
   committed at `67aad01` (five beats) was run against that same mirror and printed:

   ```
   PASS  WR-05: … the coordinator body carries all 5 tier-announcement beats
   ALL CHECKS PASSED
   ```

   exit 0. That is the shipped defect demonstrated in this working tree rather than quoted — the whole
   aggregator, `guardVoice()` included, was green on a coordinator announcing a command that does not
   exist. Swapping in the post-fix build and re-running the **identical** tree produced exit 1 naming
   the beat. Same input, same harness, different binary.

Confirmation 2 also settles the voice-guard claim empirically rather than by reading code: the pre-fix
run included `guardVoice()` over every clear-voice surface and did not notice.

## Deviations from Plan

### 1. [Rule 3 — blocking] FOUR sources, not three: the generator emits the adapter body

- **Found during:** Task 1, reading `scripts/generate-role-adapters.ts` as the plan's `read_first`
  instructed, specifically to work out which source reaches the description and which reaches the
  body.
- **Issue:** The plan says "three source edits and a regeneration" and lists the packaging template
  (×2) and the coordinator role file (×1) in `files_modified`. But the coordinator adapter's **body**
  is not generated from the packaging template — it is an inline string array inside
  `generate-role-adapters.ts` (line 309). Plan 27-14's own recorded residual says exactly this:
  "Nothing mechanically ties the generator's inline body strings to the template's fenced body
  shapes — that link is still a convention plus a comment." Editing only the three named sources and
  regenerating would have produced an adapter whose **description** was corrected and whose **body
  was still stale**, while `adapters-freshness.js` stayed green (it compares against that same stale
  generator) — failing the plan's own acceptance criterion that the stale token appear zero times in
  every generated adapter.
- **Fix:** The generator's inline string was corrected alongside the template's fenced body shape, and
  `scripts/generate-role-adapters.js` was rebuilt and committed with it. The plan's byte budget was
  unaffected — it had correctly predicted **two** occurrences reaching the adapter (description +
  body) and 3061 bytes, which is precisely what landed; only its source attribution was one file
  short.
- **Files:** `scripts/generate-role-adapters.ts`, `scripts/generate-role-adapters.js`.
  **Commit:** `67aad01`.

### 2. [Rule 2 — missing critical correctness] The beat needed its own consequence clause

- **Found during:** Task 2.
- **Issue:** The plan requires the new beat's failure message to say "the coordinator body names a
  command that does not match the one the kit ships, which makes a capability announcement
  unactionable." The existing per-beat message hard-codes a single tail clause — "a coordinator that
  drops a tier overstates its enforcement" — which is both wrong for this beat and, if simply
  replaced, would change the five existing beats' findings that the plan's prohibitions protect.
- **Fix:** An optional `why` field on the beat record, with `BEAT_DEFAULT_WHY` preserving the original
  clause verbatim. The five original messages are byte-identical; only the new beat states its own.
- **Files:** `scripts/check-foundation-guards.ts`. **Commit:** `cc6ba17`.

### 3. [Rule 2] A third adversarial plant beyond the two the plan requires

- **Issue:** The plan requires the stale value and one arbitrary value. `` `/grugops-orchestrator` ``
  was planted as a third — a *plausible* wrong answer sharing the `/grugops` prefix, which a
  prefix-matching needle would have accepted.
- **Fix:** None needed; the beat rejected it. Recorded because the near-miss is the case a
  substring-style needle would have let through, and it was checked rather than assumed.
- **Commit:** `cc6ba17` (evidence only, no code change).

## Deferred, Recorded, Not Silent

`` `/grug` `` still appears in two live-tree documents. Both are **deliberately not edited here**; the
plan's prohibitions assign them to the audit phase that already owns document drift (Phase 28,
AUDIT-01..04), and editing them in this plan would have been a violation.

| File | Occurrences | Nature |
|---|---|---|
| `CLAUDE.md` | 7 | The repository's own instruction file. Its Core Value line and its Brand constraint both state the command shape as `/grug`, and its Format Schemas section discusses `/grug` vs `/grug:<command>` namespacing at length. This is the drift that seeded the defect: the shipped kit was written from an instruction file that names a command the kit does not install. |
| `docs/initial/grugops_brand_manual.md` | multiple | The historical brand document, an input artifact rather than a shipped surface. |

Two further `/grug` occurrences are **correct and must not be "fixed"**:
`scripts/check-foundation-guards.ts` (the `neutralizePhrases()` comment and its `/\/grug/g`
substitution) and `scripts/check-foundation-guards.test.ts` (its voice-guard fixture) are about
neutralizing the brand token in voice prose. That substitution now rewrites `/grugops` to
`BRANDCMDops`, which is still marker-free, so the voice guard's behaviour is unchanged — confirmed by
the full guard run staying green.

The `.planning/` tree carries many historical `/grug` mentions in archived milestone artifacts. Those
are a written record of what was decided at the time and are correctly immutable.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema at a trust boundary was
introduced. Register items T-27-69 through T-27-72 are each mitigated and each pinned:

| Threat | Disposition | Pinned by |
|---|---|---|
| T-27-69 spoofing — an announcement naming a nonexistent command | mitigated | four surfaces corrected + the `reduced-tier command name` beat on every run |
| T-27-70 repudiation — a one-vocabulary claim pinned on part of the vocabulary | mitigated | two RED cases, the arbitrary-value one pinning TO the shipped command |
| T-27-71 tampering — a correction landing in the template but not the shipped adapter | mitigated | regeneration through the generator + `adapters-freshness.js` in CI; this is the threat deviation 1 actually caught in flight |
| T-27-72 DoS — a ceiling breached and then raised | mitigated | budget stated in advance, both files re-measured, ceiling lines proven untouched by diff |

T-27-SC (package-manager installs) remains `accept` — no dependency was added or changed.

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired data path was introduced.

## Residual Recorded, Not Closed

The template-to-generator link that deviation 1 exposed is **not** closed by this plan. The packaging
template's fenced body shape and `generate-role-adapters.ts`'s inline string array still state the
same reduced-tier sentence twice, tied together only by convention and a comment.
`adapters-freshness.js` catches the generator-to-adapter half; nothing catches the
template-to-generator half. This plan corrected both copies by hand and verified the result, which is
exactly the manual discipline a mechanical link would replace. 27-14 recorded this residual for the
memory sentence; it is now confirmed to apply to the tier announcement too, and it is the same single
missing link in both cases.

The new beat is anchored on one sentence in one file. A future rename of the command means re-cutting
the beat, the template, the role file, the generator, both user-facing documents and every regenerated
adapter together — which is the `costly` reversibility the plan declared, accepted knowingly.

## Self-Check: PASSED

- `agent-factory/packaging/subagent.frontmatter.md`, `agent-factory/roles/orchestrator.md`,
  `scripts/generate-role-adapters.ts`, `scripts/generate-role-adapters.js`,
  `.claude/agents/grugops-orchestrator.md`, `scripts/check-foundation-guards.ts`,
  `scripts/check-foundation-guards.js`, `scripts/check-foundation-guards.test.ts` — all present on
  disk.
- Commits `67aad01` and `cc6ba17` — both present in `git log`.
- `git diff --diff-filter=D` across both commits — no file deletions.
- Every committed `.js` twin verified fresh against its `.ts` source by `npm run freshness` (exit 0,
  30 files).

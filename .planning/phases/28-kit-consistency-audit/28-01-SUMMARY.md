---
phase: 28-kit-consistency-audit
plan: 01
subsystem: tooling-gates
status: complete
tags: [audit-02, drift-guard, dead-vocabulary, d-09, d-10, d-24, red-first]

requires:
  - scripts/dead-vocabulary.ts (the single retired-vocabulary authority, Phase 27 / D-24)
  - scripts/kit-model.ts (MAX_WALK_ENTRIES, the walk work bound)
  - scripts/check-kit-refs.ts (the walk/grep primitives and the D-08 scan contract, read only)
provides:
  - scripts/check-public-docs-vocabulary.js (the AUDIT-02 enforcement gate, wired at both ends)
  - "publicDocsScan() / PUBLIC_DOCS_SCAN_PARTS / PUBLIC_DOCS_SCAN_COUNT / PUBLIC_DOCS_EXEMPT"
  - "publicDocsVocabularyFails() — the accessor a later aggregator folds without a shared global"
  - the D-24 RED transcript that plan 28-05 must turn green
affects:
  - 28-04 (the claim registry holds the linear-pipeline claim this gate deliberately cannot)
  - 28-05 (lands the drift fixes that flip this gate to green)
  - .github/workflows/ci.yml (RED until 28-05, by design)

tech-stack:
  added: []
  patterns:
    - "third consumer of one list, never a fourth list"
    - "derive the set, assert the count, two-sided"
    - "named exemption with its reason, its bound, and its forbidden alternative inline"
    - "per-part vacuity floor written over the DERIVED quantity"
    - "oracle-fails-RED-first against the real tree before any fix lands"

key-files:
  created:
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-public-docs-vocabulary.test.ts
  modified:
    - scripts/dead-vocabulary.ts
    - scripts/dead-vocabulary.js
    - package.json
    - .github/workflows/ci.yml

decisions:
  - "D-09 landed as a THIRD consumer of scripts/dead-vocabulary.ts: the gate imports both arrays whole and declares no retired-vocabulary literal of its own."
  - "D-10 is held structurally, not by a comment: an array-equality case in the test file makes adding any token to either retired-vocabulary array a red test."
  - "MAX_WALK_ENTRIES is IMPORTED from scripts/kit-model.ts rather than restated as a second 10000 — one authority for the walk work bound."
  - "The walk refusal REPORTS through fail() instead of throwing, because this is a gate and not a library (the kit-model throw-versus-report split)."
  - "The gate carries an isEntry guard so its own test file can import the exported pins without the import running the check and calling process.exit."
  - "The mirrors in the test are SYNTHESIZED, not copied — the real public documents are the drift being measured, so a copied mirror would be the RED case rather than the baseline."

metrics:
  duration: ~55m
  tasks: 3
  commits: 3
  files-changed: 7
  completed: 2026-08-11

actuals:
  tokens: 15983
  tasks: 3
  commits: 3
---

# Phase 28 Plan 01: Land the AUDIT-02 Drift Guard and Watch It Fail Summary

A derived, two-sided-pinned drift guard over the ten user-visible public documents, landed as the third consumer of the one retired-vocabulary authority and watched failing red against the real tree with 18 measured hits before a single word of drift was fixed.

## What Was Built

`scripts/check-public-docs-vocabulary.ts` (+ its committed `.js`) enforces AUDIT-02 under D-09. It imports `RETIRED_PATH_FORMS` and `RETIRED_PROSE_FORMS` whole from `scripts/dead-vocabulary.ts` and declares no retired-vocabulary literal of its own — three genuinely different predicates over three different inputs, one list.

Its scan set is **derived in three parts**, never hand-listed:

| Part | Derivation | Members at HEAD |
|---|---|---|
| `root` | `readdirSync(ROOT)` filtered to markdown files, sorted, minus `PUBLIC_DOCS_EXEMPT` | 4 (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`) |
| `examples` | `examples/` as a **directory entry** that self-derives through a bounded `walkFiles()` | 5 |
| `kitReadme` | one named literal — the start-here guide the installer copies into every host repo | 1 (`agent-factory/README.md`) |

`PUBLIC_DOCS_SCAN_COUNT = 10`, asserted against the concatenation with a message naming the derived number, the pinned number, and what the author must walk before moving the pin. A new public document carrying retired vocabulary enters this scan **by existing**, not by someone remembering.

`scripts/dead-vocabulary.ts` gained a **second boundary warning** beside the existing single-window one (D-10): the Orchestrator's `routes` verb is still-correct v2.0 English and must never enter `RETIRED_PROSE_FORMS`. The three live sites a token guard would red are named — the orchestrator adapter's own `description:`, `orchestrator.md`'s `### Routing matrix` heading, and `CLAUDE.md`'s "drives auto-routing" statement, which is a Claude Code **platform fact** and not a grugops claim at all. Both exported arrays keep exactly their prior members; the diff is comment-only.

## The D-24 RED Transcript — Verbatim

Captured from a real run of the committed `.js` against the tree at `da5f52a`, and **spliced into this document from the captured bytes rather than retyped** (T-28-03: a transcript pasted from the plan rather than captured would make the acceptance evidence fiction).

```
$ node scripts/check-public-docs-vocabulary.js ; echo "exit=$?"
[check_public_docs_vocabulary] public documents carry no retired grugops vocabulary (AUDIT-02 / D-09)
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/01-greenfield-bootstrap.md:89:- `agent-factory/handoffs/product-handoff.md` (BA/PM) — user value, acceptance criteria, size XS,
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/01-greenfield-bootstrap.md:91:- `agent-factory/handoffs/system-handoff.md` (System Analyst) — the `GET /version` request/response
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/01-greenfield-bootstrap.md:93:- `agent-factory/handoffs/architecture-handoff.md` (Architect/Design) — inline route, no new
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/02-brownfield-bootstrap.md:47:agent-factory/handoffs/security-nfr-handoff.md
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/02-brownfield-bootstrap.md:109:**`agent-factory/handoffs/security-nfr-handoff.md`** (Security/NFR) — the high-risk scan
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/03-ticket-to-pr.md:55:agent-factory/handoffs/implementation-handoff.md; agent-factory/handoffs/qe-handoff.md
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/03-ticket-to-pr.md:79:Under `agent-factory/handoffs/` on the sample tree:
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/04-sprint-cycle.md:46:agent-factory/handoffs/refinement-notes.md; plans/sprints/SPRINT-12.md
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/04-sprint-cycle.md:57:the pass in `agent-factory/handoffs/refinement-notes.md`. Planning then commits to a goal and
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/04-sprint-cycle.md:106:writes `agent-factory/handoffs/implementation-handoff.md`, QE/E2E writes
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/04-sprint-cycle.md:107:`agent-factory/handoffs/qe-handoff.md`, and the gate (per `05-pr-quality-gate.md`) returns
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/04-sprint-cycle.md:133:`agent-factory/handoffs/retro-notes.md` with the metrics snapshot and Keep / Stop / Start,
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/05-release-run.md:51:agent-factory/handoffs/release-handoff.md; plans/releases/REL-0007.md
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/05-release-run.md:97:and the handoff `agent-factory/handoffs/release-handoff.md` carrying the version, scope,
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired prose form "handoff packet" survives in a public document — CLAUDE.md:6:grugops is a file-based **agent factory** for software delivery: a small kit of markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI). One Orchestrator (the "head grug") routes work through the full software-delivery lifecycle — business analysis → product → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release — while a few single-job "grug" agents execute within hard limits.
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired prose form "handoff packet" survives in a public document — CLAUDE.md:10:**Core Value:** A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, strict handoff packets, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy. **The role is the intelligence. The workflow is the guardrail. The handoff is the memory. The board is the state. The gate is the backpressure. Humans decide; agents execute.**
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired prose form "handoff packet" survives in a public document — README.md:3:grugops is a file-based agent factory for software delivery. It is a small kit of readable markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI). One Orchestrator routes work through the full software-delivery lifecycle — business analysis → product → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release — while a few single-job "grug" agents execute within hard limits. It is lean by default and scales to enterprise governance on a single config flag. Humans always hold merge and deploy.
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  retired prose form "handoff packet" survives in a public document — agent-factory/README.md:4:markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible
        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay. This text describes an architecture that does not ship. Re-narrate the passage onto the shared-verified-context flow; do not swap the path
  FAIL  AUDIT-02 drift total: 18 hit(s) across 8 of the 10 public document(s) scanned, from 1 retired path form(s) and 2 retired prose form(s) read from scripts/dead-vocabulary.ts

== Result ==
19 CHECK(S) FAILED
exit=1
```

## Re-measured Hit Counts — and the Divergence (there is none)

The plan's measured table was **re-measured at execution time rather than trusted**. Every number reproduced exactly; the measured value and the planned value agree, so nothing here overrides the plan.

| Retired literal | Plan said | **Measured** | Per file (measured) |
|---|---|---|---|
| `agent-factory/handoffs/` (path) | 14 | **14** | `examples/01-greenfield-bootstrap.md` 3, `02-brownfield-bootstrap.md` 2, `03-ticket-to-pr.md` 2, `04-sprint-cycle.md` 5, `05-release-run.md` 2 |
| `handoff packet` (prose, case-insensitive) | 4 | **4** | `CLAUDE.md` 2, `README.md` 1, `agent-factory/README.md` 1 |
| `the handoff is the only memory` (prose) | 0 | **0** | — |
| **Total** | **18 across 8 files** | **18 across 8 of 10 scanned** | — |
| Derived scan set | 10 | **10** | root 4, examples 5, kitReadme 1 |

Exit code **1**, `19 CHECK(S) FAILED` — 18 per-hit findings plus one summary finding. The total the gate prints is arithmetic over what it actually read at run time, not a constant.

**The distinction that was not blurred.** `agent-factory/README.md` carries four occurrences of the bare word, at lines 4, 35, 36 and 49. Only line 4 matches a `RETIRED_PROSE_FORMS` literal, and the gate reported only line 4. The other three are **claims** — line 35's "the roles, the handoffs, and the gates are identical everywhere" is registry material for 28-04 and rewrite material for 28-05. The matcher was **not** widened to chase them; per D-10 a grep cannot hold a claim, because a grep cannot tell the true sentence from the false one when both contain the same word. The coordinator explicitly endorsed this at the tracer checkpoint.

## Proving the RED Is a Measurement, Not a Property of the Gate

`scripts/check-public-docs-vocabulary.test.ts` — 11 cases, all spawning the **committed `.js`** against hermetic `CHECK_ROOT` mirrors under the OS temp dir. The clean-mirror case was written and confirmed green **first**, which is what makes the transcript above a measurement rather than a tautology.

| Case | Asserts |
|---|---|
| clean mirror | exit **0** explicitly (not merely absence of a throw) + a PASS line naming its counts |
| brand-new example file | exit 1, names a file appearing in no list anywhere — `examples/` membership self-derives |
| brand-new root document | exit 1, names it — root membership self-derives |
| re-capitalised prose form | exit 1 — the case-insensitive half is reached |
| sixth public document | exit 1 naming both numbers — the two-sided pin is reached at run time |
| `CHANGELOG.md`-only plant | exit **0** — the exemption is real |
| **paired plant** | same string in `CHANGELOG.md` **and** `CONTRIBUTING.md`: names the second, does **not** name the first — the exemption **discriminates** rather than merely existing |
| empty `examples/` | refused **by name**, not passed vacuously |
| two-sided pin | derived `=== PUBLIC_DOCS_SCAN_COUNT`, `!== pin-1`, `!== pin+1` |
| part partition | all three parts named, none empty, sum equals the pin, and no member starts with `scripts/` (the authority's self-exclusion note, asserted rather than remembered) |
| **D-10 control** | both retired-vocabulary arrays equal to their exact members by array equality |

**Adversarial self-reproduction of the D-10 control** (plan acceptance criterion). Adding `"routes work through the full"` to `RETIRED_PROSE_FORMS` in a scratch working copy and rebuilding:

| Tree state | D-10 control exit status |
|---|---|
| unmutated (HEAD) | **0** — passed |
| one token added to `RETIRED_PROSE_FORMS` | **1** — failed |

The mutation was reverted with `git checkout --` and the tree rebuilt; `grep -c` confirms zero occurrences remain in both the `.ts` and the `.js`, and `git status --short scripts/` showed no modification to either file afterwards. Banning a still-correct word is therefore a red test, not a judgement call.

## Wiring — Both Ends

- `package.json` gained `check:public-docs`, beside the other gate entries, in the established `tsc --outDir .tmp-build && node scripts/<gate>.js` form.
- `.github/workflows/ci.yml` runs the gate in the ubuntu-only repo-gates block, immediately after `check-kit-refs.js`, so the two consumers of the one authority sit together.

`npm run check:public-docs` reaches exit 1 with gate output **byte-identical** to the direct `node` invocation (verified with `diff`).

The CI comment states plainly, in the workflow file itself, that **this gate is expected to fail red until the AUDIT-02 drift fixes land in 28-05**, that the red is the D-24 acceptance evidence rather than a regression, and the measured counts at the introducing commit — so a maintainer meeting a red build finds the reason in the file rather than in a planning document. It also records why the gate is wired here **and** in its `.test.ts`: this repository shipped `freshness:adapters` for an entire phase while it ran solely as a side effect of a test.

## Verification Results

| Check | Result |
|---|---|
| `node scripts/check-public-docs-vocabulary.js` | **exit 1**, 18 hits named with file and line number |
| same gate on a clean hermetic mirror | **exit 0**, `ALL CHECKS PASSED` |
| `npm run check:public-docs` | exit 1, gate output byte-identical to the direct run |
| `grep -c 'check-public-docs-vocabulary.js' .github/workflows/ci.yml` | `1` |
| `node -e "…!p.scripts['check:public-docs']…"` | exit 0 |
| `npm run freshness` | exit 0 — "All build outputs fresh: 37 committed .js file(s) match a fresh tsc rebuild" |
| `npx tsc --noEmit` / `npm run typecheck` | exit 0 (both targets, tests included) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **40 files, 1420 passed, 2 skipped** |
| `git diff --stat scripts/check-kit-refs.ts` | **empty** — the Phase 27 D-08 SCAN/GH_SCAN contract untouched |
| `git diff -U0 scripts/dead-vocabulary.ts \| grep -c '^[+-]  "'` | `0` — comment lines only |
| `git diff package.json` | one line, under `scripts` only — dependency blocks byte-unchanged (T-28-06) |

The `2 skipped` tests are pre-existing and untouched by this plan.

## Prohibitions — Each Confirmed

| Prohibition | Evidence |
|---|---|
| No literal copied from `dead-vocabulary.ts` into the new gate | the gate declares no retired-vocabulary string; even the test's plant strings are built from `RETIRED_*_FORMS[0]` rather than retyped |
| No token added to either retired-vocabulary array | `git diff -U0 … \| grep -c '^[+-]  "'` returns `0`; the D-10 control case enforces it permanently |
| No entry added to or removed from `check-kit-refs.ts`'s SCAN or GH_SCAN | `git diff --stat scripts/check-kit-refs.ts` empty |
| No prose in any public document edited | the only markdown touched is `.github/workflows/ci.yml` (a comment) — no public document is in the diff |
| No hand-listed file array stands in for derived membership | all three parts derive or are a single named literal; the pin is asserted two-sided at run time and in the suite |
| No exemption expressed as absence from a list | `PUBLIC_DOCS_EXEMPT` is a named array with its reason, its bound, and its forbidden alternative inline; `docs/initial/` and `docs/design/` are recorded as structural exemptions with their reason |

## Threat Model — Dispositions Discharged

| Threat | Disposition | How |
|---|---|---|
| T-28-01 (vacuous/shrunk scan set) | mitigated | per-part empty refusal + two-sided pin reached at run time + clean-vs-planted mirror pair |
| T-28-02 (unbounded walk) | mitigated | `MAX_WALK_ENTRIES` **imported** from `kit-model.ts`, reported through `fail()` naming the directory rather than thrown |
| T-28-03 (fabricated transcript) | mitigated | captured from a real run, spliced byte-exact, re-measured against the plan with the comparison shown above |
| T-28-04 (exemption by silent absence) | mitigated | named array with reason/bound/forbidden-alternative + the paired-plant discrimination case |
| T-28-05 (gate output disclosure) | accepted | prints repo-relative paths and lines from files already public on GitHub |
| T-28-06 (package installs) | accepted, verified | no install occurred; `git diff package.json` touches `scripts` only |

## Deviations from Plan

None — the plan executed exactly as written. No auto-fix rule was invoked; the measured drift matched the plan's table with no divergence to record.

Two implementation choices worth naming, both inside the plan's latitude rather than deviations:

1. **`MAX_WALK_ENTRIES` is imported from `scripts/kit-model.ts`** rather than re-declared. The plan said "the same loud named refusal `MAX_WALK_ENTRIES` uses"; importing the constant satisfies that without adding a second `10000` literal to a repository whose diagnosed failure class is duplicated set literals.
2. **An `isEntry` guard wraps the run block.** The plan describes the module as a script, but it also requires an exported `publicDocsVocabularyFails` accessor for a later aggregator — and the test file must import the exported pins. Without the guard (the `check-uat-oracles.ts` precedent) either import would run the check and call `process.exit` inside the vitest worker.

## Checkpoints

One tracer feedback gate was raised after task 1 and resolved by the coordinator, who independently re-ran every claim against `da5f52a` and reproduced all of them, and explicitly endorsed not widening the matcher to chase the three bare-word claim occurrences in `agent-factory/README.md`.

## Known Stubs

None. No placeholder, hardcoded empty value, or TODO was introduced.

## For the Next Plan

- **28-05** must turn this gate green. The 18 hits above are its exact worklist. Per D-11 the five `examples/*.md` are **re-narrated onto the shared-verified-context flow**, not path-swapped — the gate's own remedy message says so at every hit.
- **28-04** must hold what this gate deliberately cannot: the linear-pipeline claim ("One Orchestrator routes work through the full software-delivery lifecycle — BA → … → release") at `README.md:3` and `CLAUDE.md:6`, plus `agent-factory/README.md` lines 35/36/49. `docs/audit/28-claim-registry.md` is named in `dead-vocabulary.ts`'s new header as the place those live.
- CI is **red on this gate** until 28-05 lands. That is the recorded, intended state.

## Self-Check: PASSED

All four created/modified source artifacts exist on disk (`scripts/check-public-docs-vocabulary.ts`, `.js`, `.test.ts`, `scripts/dead-vocabulary.ts`), and all three commits (`da5f52a`, `19077b5`, `ae109db`) are present in `git log`.

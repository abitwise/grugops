---
phase: 27-spawn-correctness-kit-set-authority
plan: 06
subsystem: kit-content
tags: [spawn, adapters, frontmatter, packaging, capability-vocabulary, tier-announcement]
status: complete

requires:
  - "27-05: orchestrator.md trimmed to 7057B, leaving headroom under the 7165B warn tier"
  - "27-01: scripts/kit-model.ts derives the 17-role corpus every consumer reads"
  - "27-04: check-kit-refs MARKER_SITES + Assertion 3 re-pointed to derived adapter sets"
provides:
  - "capabilities: frontmatter key on all 17 role files — the generator's tool-grant source (D-11)"
  - "agent-factory/packaging/subagent.frontmatter.md as the single upstream source the adapter generator is built from"
  - "the specialist body shape (D-08) and the coordinator body shape with the three-tier announcement (D-02 revised)"
  - "the closed five-token capability -> Claude Code tool mapping table"
affects:
  - "27-07: generates the 17 adapters from these two inputs"
  - "27-08: asserts the three tier labels are present in the coordinator body"

tech-stack:
  added: []
  patterns:
    - "kit content as generator input — the tool grant lives in portable role frontmatter, never as a per-role map inside the generator"
    - "closed vocabulary validated at build time so a bad grant fails in CI rather than on a user's machine"
    - "honest capability announcement — the coordinator states what the runtime enforces, never what the file merely declares"

key-files:
  created: []
  modified:
    - agent-factory/roles/agents-md-scribe.md
    - agent-factory/roles/architect-design.md
    - agent-factory/roles/ba-pm.md
    - agent-factory/roles/brownfield-mapper.md
    - agent-factory/roles/compliance-officer.md
    - agent-factory/roles/factory-coach.md
    - agent-factory/roles/frontend-ui.md
    - agent-factory/roles/greenfield-mapper.md
    - agent-factory/roles/incident-responder.md
    - agent-factory/roles/installer.md
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/qe-e2e.md
    - agent-factory/roles/release-manager.md
    - agent-factory/roles/security-nfr.md
    - agent-factory/roles/software-engineer.md
    - agent-factory/roles/system-analyst.md
    - agent-factory/roles/uat-planner.md
    - agent-factory/packaging/subagent.frontmatter.md
    - scripts/check-foundation-guards.test.ts

decisions:
  - "Baseline capability is `read edit shell` for all 17 roles; `web` added only to architect-design and security-nfr. `plan` is defined in the vocabulary but claimed by no role today — the vocabulary is closed, not obliged to be exhausted."
  - "The guard_voice grug-meta plant moved from security-nfr.md to agents-md-scribe.md: a voice test was being charged against the size budget of the second-most-bloated role and sat 16 bytes from red."
  - "The coordinator body does not restate the Orchestrator's classify/decompose/schedule/gate/sweep spine — the role file owns it. Cutting it is both the byte win and the more correct single-source reading of D-08."
  - "The template records the measured generated-adapter sizes (coordinator 2951B, specialist 1431B) so plan 27-07 inherits a budget rather than rediscovering one."

metrics:
  duration: ~20 min
  completed: 2026-07-28
  tasks: 2
  files: 19
  commits: 2
---

# Phase 27 Plan 06: Capability Declarations & the Adapter Body Template — Summary

The two inputs the adapter generator consumes now exist: every role declares what tools its
adapter gets, and the packaging template defines what a generated adapter body looks like —
including a coordinator body that announces which of three capability tiers it is actually in
rather than claiming an enforcement the runtime does not provide.

## What was built

**Task 1 — `capabilities:` on all 17 role files** (`cb399e8`)

A third frontmatter key joins `kind:` and `tier:` on every role, written as a space-separated
inline scalar on one line. The scalar shape is not stylistic: the zero-dependency frontmatter
parser at `scripts/generate-catalog.ts:55` matches `^([A-Za-z_]+):\s*(.*)$`, so a YAML list
would capture an empty string, the generator would emit an empty `tools` line, and the platform
refuses to launch a sub-agent whose tool entries all resolve to nothing. The failure would be
loud, but loud at runtime on a user's machine.

| Role | tier | capabilities |
|---|---|---|
| agents-md-scribe | core | `read edit shell` |
| architect-design | core | `read edit shell web` |
| ba-pm | core | `read edit shell` |
| brownfield-mapper | core | `read edit shell` |
| compliance-officer | enterprise | `read edit shell` |
| factory-coach | enterprise | `read edit shell` |
| frontend-ui | core | `read edit shell` |
| greenfield-mapper | core | `read edit shell` |
| incident-responder | enterprise | `read edit shell` |
| installer | enterprise | `read edit shell` |
| orchestrator | core | `read edit shell` |
| qe-e2e | core | `read edit shell` |
| release-manager | enterprise | `read edit shell` |
| security-nfr | core | `read edit shell web` |
| software-engineer | core | `read edit shell` |
| system-analyst | core | `read edit shell` |
| uat-planner | core | `read edit shell` |

No deviation from the plan's documented baseline. `web` went to exactly the two roles the plan
named — the architecture role and the security/NFR role are the two whose job genuinely requires
fetching external material (upstream docs, advisories). The five `tier: enterprise` roles carry
the same grant as the core ones, per D-10: grant is capability and `factory.config.json` is
policy, so filtering here would mean a config change could not reach a role the runtime had
already refused.

`_role-switch-protocol.md` is untouched — it is `kind: protocol`, not a role, and is excluded
from the derived corpus by the `_` prefix rule.

**Task 2 — the packaging template** (`8151006`)

`agent-factory/packaging/subagent.frontmatter.md` is now the complete upstream source the
generator in plan 27-07 will be built from. It defines three things:

*The specialist body shape (D-08).* Exactly the invariant blockquote, the resolver block with
its installed-path slot line, "read one named role file and act as that role", the
shared-verified-context memory sentence, and the echoed hard limit in clear voice. Nothing
role-specific. The factory read order is deliberately absent — it belongs to the coordinator
alone and is not duplicated into sixteen adapters.

*The coordinator body shape.* Everything above, plus the read order, plus the tier announcement
— the phase's honesty deliverable. The tier is selected by capability-sensing (D-04): the
coordinator checks whether the `Agent` tool is available to it and never detects a host name or
a runtime version. D-03 is stated as the governing rule in one sentence.

| Tier | Path | Parallel scheduling | Enumerated grant runtime-enforced |
|---|---|---|---|
| Full | `claude --agent grugops-orchestrator` | yes, to `queue.wip_limit` | **yes**, on this path only |
| Reduced | `/grug` in a default main-thread session | **yes**, to the same cap | **no** — the session's agent declares no allowlist; the coordinator says so and stays inside the grant by instruction |
| Degraded | `Agent` absent — the four non-Claude-Code CLIs, or a sub-agent at the nesting limit | no — concurrency one via the role-switch protocol | n/a; announced |

*The capability → tool mapping table.* `read` → `Read`/`Grep`/`Glob`; `edit` → `Edit`/`Write`;
`shell` → `Bash`; `web` → `WebFetch`/`WebSearch`; `plan` → `TodoWrite`. Every one of those
survives the background sub-agent tool filter. `AskUserQuestion` is named exactly once, as the
thing that is excluded — it is unconditionally stripped from every sub-agent, so a token for it
would produce a role that loses the tool at runtime.

Two prose corrections landed alongside. The enumerated grant's enforcement is no longer
attributed to a settings key — grugops writes no `.claude/settings.json` agent entry into a
user's repository (D-01), so the flag is the documented full-capability path. The sentence about
a spawned sub-agent gaining nested-spawn ability up to the depth cap is preserved verbatim
(verified by comparing the whitespace-flattened text against the pre-edit sentence); it names no
number and was correct as written.

## Verification — every command run, with its real output

| Check | Result |
|---|---|
| `npm run freshness:catalog` | exit 0, "Catalog fresh" |
| `git diff --name-only docs/catalog/README.md` | empty — the catalog is byte-unchanged |
| `wc -c < agent-factory/roles/orchestrator.md` | `7087` (< 7165 warn tier) |
| `guard_role_size` on orchestrator.md | `PASS  agent-factory/roles/orchestrator.md 7087B within ceiling` |
| `grep -c '7570' scripts/check-foundation-guards.ts` | `1` — unchanged; no ceiling was touched |
| `node scripts/check-foundation-guards.js \| grep -c '^  FAIL'` | `1` — still only KIT-03, the deliberate RED |
| `guard_wr05` | `PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does` |
| `node scripts/check-kit-refs.js` | exit 0, ALL CHECKS PASSED (Assertion 3: "exactly the 3 derived legal site(s)") |
| `node scripts/check-uat-oracles.js` | exit 0 |
| `npm run build && npm run freshness` | "All build outputs fresh: 26 committed .js file(s)" |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **830 passed, 1 skipped** — the 27-05 baseline, restored |

Grep assertions on the template: `handoff` = 0; `shared verified context is the only memory` on
2 lines; `claude --agent grugops-orchestrator` on 2 lines; the invariant marker on 2 lines; the
resolver slot on 2 lines; all five vocabulary tokens present in the mapping table; the
execution-topology phrase "one window, prior context dropped between roles" preserved.

Generated-adapter size, measured with the grant expanded to the real 16 specialist names rather
than the template's placeholder: **coordinator 2951 B**, specialist 1431 B, against the 3072 B
pointer warn tier and 4096 B fail tier. The measurement is recorded in the template itself so
27-07 inherits the budget.

The one FAIL is `guard_referential_integrity` (KIT-03), which 27-03 wired to fail red on the
live tree until 27-07 lands the other sixteen adapters. It was not suppressed and no other
guard failed.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — Blocking] The guard_voice grug-meta test broke on a size ceiling it never intended to consume**

- **Found during:** Task 1, on the first full test run.
- **Issue:** `check-foundation-guards.test.ts`'s "guard_voice refinement accepts clear-voice
  grug-meta + /grug" case appends a 93-byte probe into a hermetic mirror and asserts the whole
  aggregator exits 0. Its host file was `security-nfr.md`, the second-most bloated role, which at
  4993 B left the case **16 bytes** from red against the 5102 B fail ceiling. Adding
  `capabilities: read edit shell web` (34 B) spent those 16 bytes, so a test about voice
  discipline failed for reasons that had nothing to do with voice.
- **Why this was not fixed by trimming or by raising a ceiling:** raising a byte ceiling to make
  a file fit is prohibited by this plan, and trimming `security-nfr.md` prose would restore the
  margin only until the next addition — it patches the symptom and leaves the coupling. It would
  also risk front-running Phase 29's LANG-05 de-dup targets.
- **Fix:** re-host the plant to `agents-md-scribe.md` — still a `ROLE_FILES` member so the
  caveman-fence-strip path is exercised identically, the role the probe text is literally about,
  and carrying ~450 B of headroom (roughly five times the plant) instead of 16 B.
  `neutralizePhrases()` is file-agnostic — it rewrites `/grug`, `grug voice` and `grug wink` on
  every line of every voice file — so no coverage changed. A comment above the case records why
  the host choice is load-bearing and forbids moving it back onto a role near its ceiling.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `cb399e8`

**2. [Rule 3 — Blocking] The first draft of the coordinator body exceeded the adapter size budget**

- **Found during:** Task 2, on measuring rather than assuming.
- **Issue:** the template's coordinator example carries a *placeholder* grant
  (`…the other 14 specialist adapters…`, 80 B) where the generator will emit 16 real names
  (374 B). Measured naively the draft looked like 3138 B; measured as 27-07 will actually emit it,
  it was **3430 B** — over both the 3000 B plan budget and the 3072 B warn tier.
- **Fix:** tightened the coordinator body from 2684 B to 2205 B, landing the generated adapter at
  2951 B. The largest single cut was removing the restatement of the Orchestrator's
  classify/decompose/schedule/gate/sweep spine, which the role file already owns — the byte win
  and the more correct single-source reading of D-08 are the same edit. Every mandated assertion
  survives: all three tier labels, the parallel/enforced status of each, the capability-sensing
  selection rule, D-03's governing sentence, and the topology phrasing the degraded tier depends
  on.
- **Files modified:** `agent-factory/packaging/subagent.frontmatter.md`
- **Commit:** `8151006`

## Observations carried forward (not defects)

**Three role files entered the `guard_role_size` WARN band** as a direct consequence of the
30-byte key: `software-engineer.md` (3722 B ≥ 3697 B), `system-analyst.md` (3020 B ≥ 3000 B) and
`uat-planner.md` (3367 B ≥ 3350 B). No ceiling was raised and no file approaches its FAIL tier.
WARN is advisory and increments no fail counter; this is the two-tier guard doing exactly its job
— reporting that eight of seventeen roles are now in the approach band. Phase 29's LANG-05 de-dup
work is the natural place for that to come back down.

**`security-nfr.md` is now 5027 B against a 5102 B fail ceiling** — 75 bytes of room, the tightest
in the corpus after the orchestrator's deliberate trim. The next addition to that file will need a
trim in the same commit.

**No stubs, no skipped tests, no unrun verifies.** Every command in the verification table above
was executed and its real output observed.

## Threat surface

No new network endpoints, auth paths, file-access patterns or schema changes. The plan's register
entries land as designed: T-27-22 (a token mapping to a tool a role should not have) is mitigated
by the closed vocabulary in one documented place mapping only into the background-filter survivor
set; T-27-23 (an empty or list-shaped value) is mitigated by the inline-scalar mandate and the
asserted non-empty check, with build-time validation to follow in 27-07; T-27-24 (claiming an
enforced allowlist where none is enforced) is mitigated by the reduced tier stating its
non-enforcement explicitly; T-27-25 (an unfenced example read as a second live coordinator) is
mitigated and verified — `guard_wr05` reports exactly one live coordinator; T-27-26 is mitigated by
both body shapes carrying the resolver block and the stop-do-not-hunt sentence.

## Self-Check: PASSED

All 19 modified files exist on disk. Both commits are present in `git log`: `cb399e8`
(`feat(27-06): declare capabilities: on all 17 role files (D-11)`) and `8151006`
(`feat(27-06): packaging template defines both adapter bodies + tier announcement`).

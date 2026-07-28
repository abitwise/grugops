---
phase: 27-spawn-correctness-kit-set-authority
verified: 2026-07-28T23:59:00Z
status: gaps_found
score: 4/10 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "KIT-02 — Every guard and validator scan set (WR05_SCAN, ADAPTERS, CTX_WORKFLOWS, the validator's role and workflow lists) is derived from kit-model.ts, never hand-listed."
    status: failed
    reason: "kit-model.ts exports only listRoles/listWorkflows (confirmed by grep — no listAdapters/listSkillAdapters export exists). The adapter half of the scan-set class (ADAPTERS, the WR05 spawn-grant scan, install/uninstall's removal set, check-kit-refs' SCAN) is independently reimplemented in five separate files that disagree on recursion: four use a non-recursive readdirSync (check-foundation-guards.ts:218,1090; adapters-freshness.ts:125; install.ts:206/uninstall.ts:132) and one walks recursively (check-kit-refs.ts:133-145). CTX_WORKFLOWS and the validator's role/workflow lists ARE correctly derived through kit-model.ts — only the adapter-set half of KIT-02 fails."
    artifacts:
      - path: "scripts/kit-model.ts"
        issue: "No listAdapters()/listSkillAdapters() authority function exists; only listRoles/listWorkflows do"
      - path: "scripts/check-foundation-guards.ts:216-235,1090-1092"
        issue: "readAdapterDir uses non-recursive readdirSync(rel)"
      - path: "scripts/adapters-freshness.ts:123-133"
        issue: "listAdapters uses non-recursive readdirSync(dir)"
      - path: "install/install.ts:206-216"
        issue: "srcAdapterFiles uses non-recursive readdirSync + isFile()"
      - path: "install/uninstall.ts:132-142"
        issue: "same non-recursive derivation, disagrees with check-kit-refs.ts's recursive walk"
    missing:
      - "One `listAgentAdapters()`/`listSkillAdapters()` authority in kit-model.ts, consumed by all five sites, with a documented recursion policy matching the platform's actual (recursive) .claude/agents/ discovery"
  - truth: "KIT-03 — The referential-integrity oracle asserts set equality between the coordinator's spawn grant, the adapter directory, and the role corpus, and turns green only when they are the same set."
    status: failed
    reason: "Reproduced independently by the code reviewer and confirmed by reading source: because the adapter directory is read non-recursively (see KIT-02 gap), planting a second live adapter with `coordinator: true` and its own spawn grant at .claude/agents/extra/rogue.md is invisible to the oracle. guardReferentialIntegrity (check-foundation-guards.ts:1090) still reports \"17 roles == 17 adapters == 17 grant-closure names\" and PASS even though 18 adapters and 2 coordinators actually exist on disk. The oracle's own stated guarantee — green ONLY when the sets are actually equal — is false; it is green even when they are provably not equal, for a file the platform's own recursive .claude/agents/ discovery would load and honor."
    artifacts:
      - path: "scripts/check-foundation-guards.ts:1090"
        issue: "guardReferentialIntegrity() computes adapterFiles via the same non-recursive readdirSync as KIT-02's gap; a nested adapter is never counted"
    missing:
      - "guardReferentialIntegrity must consume the same recursive adapter-set authority proposed for KIT-02, or the oracle's soundness claim does not hold"
  - truth: "SPAWN-02 — adapters-freshness.ts byte-gates the generated adapters against a fresh regeneration, fail-closed on drift."
    status: failed
    reason: "The script itself works correctly when invoked by hand (confirmed: exit 0, '17 adapter(s) compared ... 0 byte difference(s)'). But it is wired to nothing: `grep -rn \"freshness:adapters|adapters-freshness\" .github/workflows/ci.yml` returns no match, and `scripts/adapters-freshness.test.ts` does not exist (confirmed — every sibling freshness gate, catalog/context/queue/traceability, has a .test.ts; this is the only one without one). package.json:17 defines the npm script but nothing calls it. A committed hand-edit to an adapter — including the exact CR-01/CR-02 bypasses — currently passes every CI gate. A gate that exists and passes by hand but is invoked by neither CI nor the test suite does not fail anything closed in practice."
    artifacts:
      - path: ".github/workflows/ci.yml"
        issue: "freshness:adapters is absent from the ubuntu-only gate block that runs freshness, freshness:catalog, freshness:context, and check-foundation-guards.js"
      - path: "scripts/adapters-freshness.test.ts"
        issue: "does not exist"
    missing:
      - "npm run freshness:adapters added to .github/workflows/ci.yml's gate block"
      - "scripts/adapters-freshness.test.ts with a green case, a byte-drift RED case, and a set-drift (orphan adapter) RED case"
  - truth: "SPAWN-04 — Non-coordinator role adapters omit the Agent tool entirely, a mechanism that holds on both the main-thread and subagent paths rather than relying on a frontmatter token the runtime ignores."
    status: failed
    reason: "The 17 generated adapters are currently clean (confirmed: generator's capability-to-tool mapping grants Agent to none of the 16 non-coordinator roles). But the enforcement mechanism meant to keep this true — guard_wr05's WR05_COMMA/WR05_ARRAY regex pair — is reproducibly bypassable. Read directly from source: both regexes are applied per physical line (`matchesOutsideFences` at check-foundation-guards.ts:337-340 does `body.split(\"\\n\").some(l => re.test(l))`), and WR05_COMMA requires the key (`tools:`/`allowed-tools:`) and the Agent/Task token on the SAME line. A valid YAML folded scalar (`tools: >-` followed by an indented continuation line carrying `Agent(...)`) puts the grant on a line that starts with neither `tools:` nor `-`, so neither regex fires. The reviewer reproduced this on hermetic mirrors twice (a non-coordinator adapter, and a skill file) with `ALL CHECKS PASSED` both times. The mechanism does not hold on the documented \"both paths\" claim against a form the guard was never taught to reconstruct."
    artifacts:
      - path: "scripts/check-foundation-guards.ts:275-279,337-340"
        issue: "WR05_COMMA/WR05_ARRAY are line-anchored; matchesOutsideFences tests line-by-line with no frontmatter-value reconstruction across a folded/block scalar"
    missing:
      - "A tools-value reconstruction that flattens a frontmatter key's value across continuation lines before testing for Agent/Task, applied identically at guard_wr05 and at KIT-03's grant-closure parser"
  - truth: "SPAWN-05 — guard_adapter_body fails red on pre-v2.0 handoff/single-window prose in any adapter body, closing the surviving grugops-orchestrator.md:25 reference."
    status: failed
    reason: "guard_adapter_body's scan set is built from the same non-recursive adapter derivation implicated in the KIT-02/KIT-03 gap (check-foundation-guards.ts ADAPTER_BODY_SCAN over ADAPTERS + template). A hand-edited or planted adapter in a subdirectory of .claude/agents/ is invisible to this guard exactly as it is to guard_wr05 and the referential-integrity oracle — confirmed by the reviewer's single reproduction covering all four guards at once. Separately (Warning-level, not the basis for this FAIL by itself): the guard's positive half (WR-01/WR-05 in 27-REVIEW.md) is order- and context-free and its vacuity floor never fires independently, both weakening the same invariant."
    artifacts:
      - path: "scripts/check-foundation-guards.ts:480,486,514-524"
        issue: "ADAPTER_BODY_SCAN is built over the same non-recursive ADAPTERS set; positive-half match is a bare substring test with no exactly-once assertion"
    missing:
      - "Same adapter-set-authority fix as KIT-02/KIT-03; separately, anchor the positive half to the full generated sentence and assert it appears exactly once (27-REVIEW.md WR-05)"
human_verification:
  - test: "Run `claude --agent grugops-orchestrator` from an installed target repository and observe whether the session startup header names @grugops-orchestrator, then ask for work that routes to a specialist and observe whether a role agent actually resolves and runs (rather than the coordinator working the task inline)."
    expected: "Startup header names the coordinator agent; a routed subtask causes a distinct role agent to resolve and execute."
    why_human: "The Claude Code runtime is the system under test. The startup header is an interactive TUI element and agent resolution cannot be observed from any in-repo command; a print-mode invocation would spend tokens without emitting the header. Plan 27-09 explicitly performed steps 1-2 (scratch install, materialized kit line) and explicitly left steps 3-4 as UNKNOWN - verify — this is the honest, undischarged remainder of SPAWN-03's runtime half, not a new finding."
---

# Phase 27: Spawn Correctness & Kit-Set Authority Verification Report

**Phase Goal:** Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Verified:** 2026-07-28T23:59:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Requirement | Status | Evidence |
|---|---|---|---|---|
| 1 | `scripts/kit-model.ts` is the sole authority for "what roles and workflows exist," derived from the filesystem with an asserted count | KIT-01 | ✓ VERIFIED | `listRoles`/`listWorkflows` exported (kit-model.ts:81,90), each calls `refuseEmpty` (throws on vacuity), both `.sort()`, `ROLE_COUNT`/`WORKFLOW_COUNT` asserted via strict integer equality. `guardKitCounts` prints "17 roles, 19 workflows" line, confirmed in live gate output. |
| 2 | Every guard/validator scan set (`WR05_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`, validator role/workflow lists) is derived from `kit-model.ts`, never hand-listed | KIT-02 | ✗ FAILED | `CTX_WORKFLOWS` and the validator's role/workflow lists ARE derived via `listRoles`/`listWorkflows`. But `kit-model.ts` has **no** `listAdapters` export (confirmed by grep). The adapter set is independently re-derived in 5 places (`check-foundation-guards.ts` ×2, `adapters-freshness.ts`, `install.ts`, `uninstall.ts`) — 4 non-recursive, 1 (`check-kit-refs.ts`) recursive. They disagree. See gap #1. |
| 3 | The referential-integrity oracle turns green only when the coordinator's spawn grant, the adapter directory, and the role corpus are the same set (and failed RED before adapters existed, per 27-01) | KIT-03 | ✗ FAILED | Oracle currently reports "17 roles == 17 adapters == 17 grant-closure names — PASS" on the live tree (confirmed). But because the adapter directory read is non-recursive, a planted 18th adapter (a second coordinator, in a subdirectory) is invisible to it — the oracle stays green while the sets are provably not equal. Reproduced by the code reviewer; root-caused to the same non-recursive read as gap #1. |
| 4 | All 17 role adapters exist at `.claude/agents/grugops-<role>.md`, generated by a templated generator, thin pointers never copies | SPAWN-01 | ✓ VERIFIED | `ls .claude/agents/` → 17 files, all named `grugops-<role>.md`. `scripts/generate-role-adapters.ts` + `.test.ts` exist. All 17 role files carry `capabilities:` (confirmed: `grep -c "capabilities:" agent-factory/roles/*.md` → 17 non-zero). |
| 5 | `adapters-freshness.ts` byte-gates generated adapters against fresh regeneration, fail-closed on drift | SPAWN-02 | ✗ FAILED | Script works when run by hand (confirmed: exit 0, "17 adapter(s) compared ... 0 byte difference(s)"). But `npm run freshness:adapters` (package.json:17) is absent from `.github/workflows/ci.yml` (confirmed by grep — no match) and `scripts/adapters-freshness.test.ts` does not exist (confirmed — every sibling freshness gate has one, this doesn't). The gate is authored but not wired; nothing currently re-runs it. |
| 6 | Coordinator wired as Claude Code main-thread agent so its grant is runtime-honored; role agent actually resolves in its own session | SPAWN-03 | ? UNCERTAIN (human_needed) | Documented half (install/README.md §6) and in-repo half (adapter exists, `coordinator: true`, 16-name grant, freshness gate green) both confirmed. Runtime half (session header naming the agent; a role agent actually resolving) explicitly **not performed** by plan 27-09 and recorded `UNKNOWN - verify`. REQUIREMENTS.md correctly marks SPAWN-03 `Pending`, not `Complete` — this is honest, not a defect. |
| 7 | Non-coordinator adapters omit the `Agent` tool entirely, a mechanism that holds on both main-thread and subagent paths | SPAWN-04 | ✗ FAILED | The 17 generated adapters are currently clean (verified). But `guard_wr05`'s grant-detection regexes are line-anchored (`check-foundation-guards.ts:275-279,337-340`) and do not reconstruct a YAML folded/block scalar spanning lines — confirmed by reading source. A valid `tools: >-` continuation carrying `Agent(...)` is invisible to the guard. Reproduced twice by the code reviewer (a role adapter and a skill file), both "ALL CHECKS PASSED." |
| 8 | `guard_adapter_body` fails red on pre-v2.0 handoff/single-window prose in any adapter body | SPAWN-05 | ✗ FAILED | Functionally correct over the *scanned* set for the live, well-formed tree (confirmed green). But its scan set is built from the same non-recursive adapter derivation as gaps #1-2 — a hand-edited or planted adapter in a subdirectory is invisible to this guard exactly as it is to guard_wr05 and the referential-integrity oracle (reviewer's single reproduction covers all three). Separately, the positive-half match is a bare, order-independent substring test (27-REVIEW.md WR-05) — lower-severity but the same weakening. |
| 9 | `orchestrator.md` trimmed below its 7570-byte FAIL ceiling before spawn-allowlist text is added, ceiling never raised | SPAWN-06 | ✓ VERIFIED | `wc -c agent-factory/roles/orchestrator.md` → 7087 bytes (below both the 7570 FAIL and 7165 WARN tiers). `check-foundation-guards.ts:888` still reads `"7570 7165"` — ceiling unchanged. `node scripts/check-foundation-guards.js` shows no FAIL/WARN line for orchestrator.md. |
| 10 | Advertised nesting depth corrected to 3 (v2.1.219+), tuning env var named, v2.1.217-218 depth-1 window documented as known-bad | SPAWN-07 | ✓ VERIFIED | `agent-factory/roles/orchestrator.md:88` and `agent-factory/packaging/adapters.md:35,47` both state "nests 3 layers... tuned by `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`; that default arrived in v2.1.219, and v2.1.217-v2.1.218 defaulted to 1 — a known-bad window." `oracleWr05Wording` reports PASS across all four tracking docs. |

**Score:** 4/10 truths verified (5 failed, 1 human-needed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/kit-model.ts` | sole role/workflow authority | ✓ VERIFIED | `listRoles`/`listWorkflows` exist, throw on vacuity, sorted; no `listAdapters` |
| `scripts/kit-model.test.ts` | RED/GREEN fixture coverage | ✓ VERIFIED (exists) | not independently re-run beyond the already-established green suite |
| `scripts/check-foundation-guards.ts` | derived scan sets + KIT-03 oracle + guard_wr05 + guard_adapter_body | ⚠️ PARTIAL | roles/workflows derived correctly; adapter-side derivation and grant-detection both have reproduced bypasses (see gaps) |
| `scripts/generate-role-adapters.ts` + `.test.ts` | deterministic templated generator | ✓ VERIFIED | 17 adapters exist, capabilities-driven, sorted, no debt markers |
| `scripts/adapters-freshness.ts` | byte + set freshness gate | ⚠️ ORPHANED | script correct and passes by hand; not invoked by CI or by any test — no automatic enforcement |
| `install/install.ts`, `install/uninstall.ts` | self-deriving adapter/skill install/removal | ✓ VERIFIED (for KIT-02's install scope) | derives from `$GRUGOPS_SRC` readdir per plan 27-02; shares the same non-recursive-vs-recursive disagreement noted under KIT-02 but no reproduced installer-specific defect beyond that |
| `scripts/validate-agent-factory.ts`, `scripts/check-kit-refs.ts` | derived 17/19 role-workflow lists, derived `MARKER_SITES` | ✓ VERIFIED | confirmed green; `check-kit-refs.ts` is the one derivation that IS recursive |
| `.claude/agents/grugops-<role>.md` × 17 | generated thin-pointer adapters | ✓ VERIFIED | 17 files present, one coordinator (`grugops-orchestrator.md`) with 16-name grant |
| `agent-factory/roles/orchestrator.md` | ≤7100B, depth-3 wording | ✓ VERIFIED | 7087 bytes |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `kit-model.ts` `listRoles`/`listWorkflows` | `check-foundation-guards.ts`, `validate-agent-factory.ts`, `check-kit-refs.ts` | import + call | ✓ WIRED | confirmed by source read |
| adapter directory on disk | `guard_wr05`, `guard_adapter_body`, KIT-03 oracle, `adapters-freshness.ts` | independent `readdirSync` per site | ✗ NOT UNIFIED | 5 independent derivations, 4 non-recursive + 1 recursive; this is the KIT-02/KIT-03 gap |
| `scripts/adapters-freshness.ts` | CI pipeline | `npm run freshness:adapters` in `.github/workflows/ci.yml` | ✗ NOT_WIRED | script exists and works standalone; no CI step, no test file calls it |
| role `capabilities:` frontmatter | generated adapter's tool grant | `generate-role-adapters.ts` mapping table | ✓ WIRED | confirmed — all 17 adapters carry capability-derived tools, no Agent grant on non-coordinators |

### Requirements Coverage

| Requirement | Source Plan(s) | Status | Evidence |
|---|---|---|---|
| KIT-01 | 27-01 | ✓ SATISFIED | see truth #1 |
| KIT-02 | 27-02, 27-03, 27-04 | ✗ BLOCKED | role/workflow half satisfied; adapter half not — see gap #1 |
| KIT-03 | 27-01, 27-07 | ✗ BLOCKED | oracle green on live tree but soundness broken by non-recursive read — see gap #2 |
| SPAWN-01 | 27-06, 27-07 | ✓ SATISFIED | see truth #4 |
| SPAWN-02 | 27-07 | ✗ BLOCKED | gate authored, not wired — see gap #3 |
| SPAWN-03 | 27-09 | ? NEEDS HUMAN | correctly recorded Pending in REQUIREMENTS.md; runtime half open |
| SPAWN-04 | 27-08 | ✗ BLOCKED | current adapters clean; enforcement mechanism bypassable — see gap #4 |
| SPAWN-05 | 27-08 | ✗ BLOCKED | scan-set blind spot shared with KIT-02/KIT-03 — see gap #5 |
| SPAWN-06 | 27-05 | ✓ SATISFIED | see truth #9 |
| SPAWN-07 | 27-05 | ✓ SATISFIED | see truth #10 |

No orphaned requirements: all 10 IDs in ROADMAP.md's Phase 27 row (`KIT-01..03, SPAWN-01..07`) are claimed by at least one of the 9 plans, and REQUIREMENTS.md's Phase-27 rows list exactly these 10 IDs.

**Note on REQUIREMENTS.md:** the tracking table currently marks KIT-02, KIT-03, SPAWN-02, SPAWN-04, and SPAWN-05 `Complete`. This verification finds all five `BLOCKED` per the reproduced evidence above — the tracking table reflects "gate exits 0" rather than "gate cannot be bypassed," which is exactly the distinction this verification was asked to draw.

### Anti-Patterns Found

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers found in any Phase 27 source file (`kit-model.ts`, `check-foundation-guards.ts`, `validate-agent-factory.ts`, `check-kit-refs.ts`, `generate-role-adapters.ts`, `adapters-freshness.ts`, `dead-vocabulary.ts`, `install.ts`, `uninstall.ts`). The gaps in this report are not code-debt markers — they are demonstrated logic/enforcement defects (reproduced bypasses), independently confirmed by reading the implicated source lines, not merely quoted from 27-REVIEW.md.

🛑 **Blocker-class (functional, not comment-marker):**
- Adapter scan-set has no single authority (5 independent, disagreeing derivations) — undermines KIT-02, KIT-03, SPAWN-04, SPAWN-05 simultaneously.
- `guard_wr05`'s grant detection is line-anchored and misses a valid YAML folded/block scalar — undermines SPAWN-04.
- `adapters-freshness.ts` is authored but never invoked by CI or tests — undermines SPAWN-02.

⚠️ **Warning-class (from 27-REVIEW.md, confirmed present, not independently re-derived here beyond spot-checks):**
- `guard_adapter_body`'s vacuity floor (`scanned === 0`) is structurally unreachable.
- `install.ts` silently installs zero adapters (exit 0, "install complete") when the source `.claude/` directory is unreadable, while `uninstall.ts` reports a `verify`-status skip for the same condition — an asymmetric fail-loud contract for the same derivation.
- The generated coordinator adapter and the packaging template name `/grug`, which does not exist as a command; the actual skill/plugin commands are `/grugops` and `/grugops:<command>`. 27-09-SUMMARY's "one vocabulary, two surfaces" claim pinned only the tier labels, not the command name, so the contradiction shipped.
- The 14-entry "every enumerating literal" inventory in `check-foundation-guards.ts` omits `install.ts`'s `RUNNABLES` mapping, which also has no `uninstall.ts` removal counterpart (a real reversibility gap, pre-existing).
- `guard_adapter_body`'s positive half (the memory sentence) is a bare, order-independent substring match satisfiable by a comment or unrelated line.

ℹ️ **Info:**
- `install/install.ts` carries a literal NUL byte inside a fail-safe sentinel, making `grep` treat the file as binary (pre-existing, tracked in `deferred-items.md` D1).
- `scripts/check-foundation-guards.ts` is 1245 lines carrying ten guards; not urgent, folds naturally into the CR-01 fix.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| kit-count line prints derived numbers | `node scripts/check-foundation-guards.js \| grep "17 roles"` | printed | ✓ PASS |
| 17 adapters exist, one coordinator | `ls .claude/agents/ \| wc -l` → 17; `grep -c '^coordinator: true' .claude/agents/grugops-orchestrator.md` → 1 | confirmed | ✓ PASS |
| `freshness:adapters` absent from CI | `grep -rn "freshness:adapters\|adapters-freshness" .github/workflows/ci.yml scripts/*.test.ts` | no matches | ✓ PASS (confirms gap) |
| `kit-model.ts` has no adapter authority | `grep -n "export function list" scripts/kit-model.ts` | only `listRoles`, `listWorkflows` | ✓ PASS (confirms gap) |
| `guard_wr05` grant regex is line-anchored | read `check-foundation-guards.ts:275-279,337-340` | confirmed per-line `.split("\n").some(...)`, no continuation reconstruction | ✓ PASS (confirms gap) |
| orchestrator.md size and ceiling | `wc -c agent-factory/roles/orchestrator.md`; `grep "7570 7165"` | 7087B; ceiling unchanged | ✓ PASS |
| no debt markers in Phase 27 files | `grep -E "TBD|FIXME|XXX"` over 9 source files | no matches | ✓ PASS |

Full test suite was not re-run beyond the already-established baseline (`npx vitest run --exclude '**/scripts/e2e/**'` → 32 files, 864 passed, 2 skipped, per the already-established facts) — re-running it would not produce new evidence for the reproduced gaps above, which are demonstrated by reading source and by the review's own hermetic-mirror reproductions, not by the ordinary green-path suite.

### Probe Execution

Not applicable — this phase is not a migration/tooling phase with `scripts/*/tests/probe-*.sh` conventions; no probes declared in any plan or the roadmap success criteria.

### Human Verification Required

### 1. SPAWN-03 runtime half: coordinator resolution and role-agent spawning in a real session

**Test:** From an installed target repository, run `claude --agent grugops-orchestrator`; observe the session startup header, then ask for work that routes to a specialist (e.g., "map this repo") and observe whether a distinct role agent resolves and runs.
**Expected:** Startup header names `@grugops-orchestrator`; a role agent (not the coordinator itself) executes the routed subtask.
**Why human:** The Claude Code runtime is the system under test; the startup header is an interactive TUI element with no in-repo command able to observe it. Plan 27-09 honestly performed and recorded steps 1-2 (scratch install, materialized kit line) and explicitly left steps 3-4 open as `UNKNOWN - verify` rather than fabricating a pass. REQUIREMENTS.md correctly reflects this as `Pending`.

### Gaps Summary

The phase's own goal statement is: *"every guard and validator scan set is derived from the filesystem before the 17 new adapter files exist, so they land inside the guards rather than outside them."* The role/workflow half of that goal (KIT-01, and the role/workflow portions of KIT-02) is genuinely and solidly done — `kit-model.ts` is a real single authority, throws on vacuity, sorts deterministically, and every role/workflow-consuming guard is repointed at it with a passing regression suite.

The adapter half of the same goal is not done, and a single root cause explains three of the five failed truths: **the adapter set itself was never given the authority treatment the role/workflow set received.** Five files (`check-foundation-guards.ts` twice, `adapters-freshness.ts`, `install.ts`, `uninstall.ts`) each answer "what is an adapter" by their own `readdirSync`, four of them non-recursively, while Claude Code's actual, documented discovery of `.claude/agents/` is recursive and the fifth file in the tree (`check-kit-refs.ts`) already reflects that. This is not a hypothetical: I independently confirmed (by reading the regex/derivation source directly, not merely citing 27-REVIEW.md) that `kit-model.ts` exports no adapter-listing function, that the four non-recursive derivations exist as described, and that `guard_wr05`'s grant-detection regexes are genuinely line-anchored with no reconstruction of a wrapped YAML value across lines. A planted adapter in a subdirectory, or a spawn grant expressed as a YAML folded scalar, is invisible to KIT-03's oracle, to `guard_wr05` (SPAWN-04), and to `guard_adapter_body` (SPAWN-05) simultaneously — exactly the failure mode the phase exists to prevent, now moved from a hand-listed name into a hand-written derivation rule.

A second, independent gap affects SPAWN-02: `adapters-freshness.ts` is a correct, working gate when run by hand, but it is invoked by neither CI nor any test file, so nothing currently re-runs it — the one gate that would catch either of the two bypasses above does not run.

SPAWN-03's runtime half is honestly open (not a defect) and SPAWN-06/SPAWN-07 are solidly verified. No debt markers, fabricated results, or invented commands were found anywhere in the phase's changed files.

Per the project's own standing lesson (a green suite is not proof for a safety invariant), these three items require the structural fix the reviewer already specified — a single format-aware adapter authority in `kit-model.ts`, a frontmatter-value-reconstruction fix to the grant detector, and wiring the freshness gate into CI plus a test file — not an additional heuristic layered on top of the current derivations.

---

_Verified: 2026-07-28T23:59:00Z_
_Verifier: Claude (gsd-verifier)_

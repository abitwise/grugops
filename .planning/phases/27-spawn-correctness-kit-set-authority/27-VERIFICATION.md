---
phase: 27-spawn-correctness-kit-set-authority
verified: 2026-08-03T07:00:00Z
status: gaps_found
score: 7/10 requirements verified clean (3 FAILED — KIT-02, KIT-03, SPAWN-04 — each carrying at least one independently reproduced guard bypass, distinct from round 4's bypasses but the same three requirements)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 7/10 (round 4, 2026-08-02T02:00:00Z)
  gaps_closed:
    - "CR-01 round-4 (single-sided delimiter fail-open: leading BOM alone, trailing NBSP alone, `----`, `--- foo`, a combining mark, an unassigned/private-use/surrogate code point) — CLOSED for every single-sided spelling. D-43 replaced the enumerate-the-bad delimiter test with a stated LEGAL set (payload + declared whitespace class) and two refusal arms. Verified by reading `scripts/frontmatter.ts:757-823` directly and confirming the round-5 review's parser-level and gate-level reproduction tables against that code: every single-sided offending row (`---<ZWSP>`, `<ZWSP>---`, `----`, `--- foo`, a leading space, two leading BOMs) now refuses by name at both delimiter positions, with the open/close asymmetry (the misleading 'opened and never closed' diagnosis) eliminated too."
    - "WR-02 round-4 (keysGrantedAgentNames drops/alters names on its own success arm) — CLOSED. `keysGrantedAgentNames` now refuses a nested opening parenthesis or any quote character inside a captured enumeration instead of splitting it short or altered. Verified by reading `scripts/frontmatter.ts` around the enumeration refusal and cross-checking the 27-33-SUMMARY transcript (`Agent(alpha, Task(beta), gamma)` and `Agent(\"alpha, beta\", gamma)` both now refuse by name instead of returning a mutated list)."
    - "CR-02 round-4 (installer's nested walk silently drops an unreadable directory with no name; the twin authority throws naming it) — CLOSED. `NestedWalkResult` gained a fourth `unreadable: string[]` channel; both formerly-bare `realpathSync`/`readdirSync` catch arms in `install/kit-source.ts` now route through it; `install.ts` reports every entry through the same `verify` channel as `cycles`/`overflow`, at exit 3, naming the path. Verified sound by the round-5 review's 'What was checked and found SOUND' section (direct code read, not SUMMARY trust) and independently confirmed by reading `install/kit-source.ts` and `scripts/kit-model.ts` PLUGIN/nested-walk sections referenced from `check-foundation-guards.ts`."
    - "CR-03 round-4 (the shipped plugin-form `skills/*/SKILL.md` tree — 7 files, loaded by Claude Code for every `/plugin install` user — was in no spawn-grant scan set) — CLOSED. `scripts/kit-model.ts` gained `listPluginSkillAdapters()`, `PLUGIN_SKILL_ADAPTER_COUNT = 7`, folded into the single exported `spawnGrantScan()` composition (26 → 33 members, four parts, per-part SET equality), and `guard_wr05`'s PASS line now names the plugin-skill count it read. A pair rule (`guard_distribution_pair`) cross-checks each plugin skill against its standalone twin byte-for-byte after normalizing the `name` line, with one named, reasoned, bounded exemption. Verified by reading `scripts/kit-model.ts:175-451` and `scripts/check-foundation-guards.ts:855-917` directly and confirming the composition, the count, and the PASS-line wording match the round-5 review's and SUMMARY's transcripts."
    - "WR-01 round-4 (D-35's exit-tail fix reached only 1 of 3 tail sites; `install/uninstall.ts:730` and `scripts/coordinator-resolution-precheck.ts:598` still used bare `process.exit()` on the INCOMPLETE tail under a comment asserting a parity the code lacked) — CLOSED. Both remaining tails now set `process.exitCode` rather than calling `process.exit()` directly; the regression scan was extended from 2 paths to 4 (install.ts/js, uninstall.ts/js) plus a separate precheck assertion; the six mid-script `process.exit()` sites are unchanged (verified: filtered count still 6 at the same six positions per the 27-35 SUMMARY transcript, consistent with the round-5 review's own count of 8 mid-script sites across both files, 6 in install.ts + 2 in uninstall.ts)."
  gaps_remaining: []
  regressions: []
gaps:
  - truth: "KIT-02 — every guard and validator scan set is derived from the filesystem, never hand-listed, so a shipped surface cannot sit outside the set that claims to cover it."
    status: failed
    reason: >
      Round 5 genuinely deleted the two hand-listed scan-set defects it targeted (the plugin-skill tree,
      the installer's silent unreadable-directory drop). But it introduced — inside the very floor whose
      own comment claims to close the class rather than the instance — a THIRD hand-listed set of the
      same shape. `scripts/kit-model.ts:187`: `PLUGIN_DEFAULT_COMPONENT_SUBPATHS = ["agents", "commands"]
      as const`. This repository's own CLAUDE.md plugin-schema section enumerates nine plugin-root
      component directories Claude Code's DEFAULT discovery loads (`agents`, `commands`, `skills`,
      `hooks`, `mcpServers`, `lspServers`, `outputStyles`, `experimental.themes`,
      `experimental.monitors`), and `.claude-plugin/plugin.json` declares no path override, so default
      discovery applies to all of them. `skills` is separately covered by `listPluginSkillAdapters`; the
      other six are covered by nothing. `hooks/` EXISTS on the live tree today
      (`hooks/hooks.json`, `hooks/guard.js`, `hooks/admission-guard.js`) and is inside no scan set at
      all — a `PreToolUse` hook executes commands, and CLAUDE.md makes the mechanical prod-deploy guard a
      hard safety constraint. Independently reproduced by the round-5 code review on hermetic `git
      archive` mirrors: a rogue grant planted at `commands/rogue.md` is caught (exit 1); the identical
      plant at `outputStyles/rogue.md` or `hooks/rogue.md` yields `ALL CHECKS PASSED`, exit 0, with the
      planted file never named in the gate output. I confirmed the set literal and its 2-of-9 shape by
      reading `scripts/kit-model.ts:175-197` directly. This is the project's own diagnosed failure
      pattern (a hand-maintained scan set rotting while every test stays green) recurring one level
      inside the fix meant to delete the pattern's third instance.
    artifacts:
      - path: "scripts/kit-model.ts"
        issue: "Line 187: `PLUGIN_DEFAULT_COMPONENT_SUBPATHS = [\"agents\", \"commands\"] as const` — a hand-listed 2-of-9 set with no derivation and no cardinality pin, unlike every sibling set in the same module (ROLE_COUNT, WORKFLOW_COUNT, SKILL_ADAPTER_COUNT, PLUGIN_SKILL_ADAPTER_COUNT, SPAWN_GRANT_SCAN_COUNT all assert a two-sided count; this one does not)."
      - path: "scripts/check-foundation-guards.ts"
        issue: "Lines 855-888: the plugin-default component floor's own comment claims it 'closes the CLASS the plugin-skill hole belongs to rather than only the instance CR-03 named' — it forbids two named surfaces and is blind to the other seven default-discovered directories, one of which (`hooks/`) exists on the live tree."
      - path: "scripts/kit-model.test.ts"
        issue: "Line 141 asserts 'the LIVE tree has both plugin-default component directories absent' over the same two-element literal, so the test can only ever confirm the literal and never the class it claims to stand for."
    missing:
      - "Derive PLUGIN_DEFAULT_COMPONENT_SUBPATHS from the full plugin-manifest schema (the 8 non-skills default-discovery directories CLAUDE.md documents), assert its cardinality two-sided the same way every sibling set in kit-model.ts is asserted, and either fold `hooks/` into SPAWN_GRANT_SCAN or record it as a named, reasoned, bounded exemption in the same shape as DISTRIBUTION_PAIR_EXEMPT — the fix the round-5 review already drafted at scripts/kit-model.ts:250-270 of 27-REVIEW-GAPS-5.md."
      - "WR-01 (round-5, non-blocking but related): guardKitCounts' per-part membership loop (check-foundation-guards.ts:1305-1311) silently `continue`s on a thrown lister with a comment justifying the silence on a precondition (module-load-time and later-read failing together) that is false for the TOCTOU window where it can actually fire. Report instead of swallowing, matching the sibling catch twenty lines above."
  - truth: "KIT-03 — the referential-integrity oracle turns green only when the coordinator's spawn grant, the adapter directory and the role corpus are the same set, including against a crafted or malformed frontmatter."
    status: failed
    reason: >
      Round 5's D-43 delimiter rewrite genuinely closed every SINGLE-SIDED spelling of the delimiter
      fail-open (round-4's CR-01) — confirmed by reading `scripts/frontmatter.ts:795-823` directly. But
      the two refusal arms do not cover their own UNION: arm 1 (`:801`) fires only when
      `line.startsWith(payload)`; arm 2 (`:811-821`) fires only when, after stripping leading invisible
      residue, the REMAINDER is a LEGAL delimiter (`isLegalDelimiter`, which itself requires
      `startsWith(payload)` on the stripped remainder AND nothing illegal after it). A line carrying BOTH
      leading invisible residue AND illegal trailing residue after the payload — e.g. `<ZWSP>---<ZWSP>`
      — matches neither arm, falls through `return null` at `:822`, and reaches the keyless SUCCESS arm
      at `:887` (`{ok:true, value:new Map()}`), which `hasSpawnGrant` reports as `{ok:true,value:false}` —
      the silent no-grant result this module exists to make impossible. This is the fifth spelling of the
      same failure class (D-39, D-42, and now the arm-composition gap), one abstraction level up from the
      character-alphabet axis D-43 fixed. I confirmed this directly by reading `delimiterRefusal`
      (`scripts/frontmatter.ts:795-823`) and `isLegalDelimiter` (`:760-762`): arm 2's `isLegalDelimiter`
      call re-imposes the full legality test on the remainder rather than only testing where the
      delimiter BEGINS, so a composite input satisfies neither arm's precondition. This is corroborated
      by the round-5 code review's parser-level reproduction (8 composite rows, e.g. `ZWSP + ----`,
      `NBSP + ----`, `BOM x2 + --- + ZWSP`, all returning `{"ok":true,"value":false}` against the
      committed `.js`) and gate-level reproduction (`<ZWSP>---<ZWSP>` on a live spawn grant in
      `skills/grugops/SKILL.md` flips `check-foundation-guards.js` from exit 1 to exit 0, `ALL CHECKS
      PASSED`), neither of which I re-ran myself (per the task's instruction to treat CR-01/CR-02 as
      established) but both of which are consistent with, and explained by, the arm logic I read directly.
      This falsifies the round-5 plan's own must_have that 'there is no second grammar left in the
      delimiter region for a fifth spelling to slip between' (the claim asserted in the code's own comment
      at `scripts/frontmatter.ts:757-759`).
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "delimiterRefusal (:795-823): arm 1 requires startsWith(payload) at position 0; arm 2 requires isLegalDelimiter(line.slice(run), payload) — a LEGAL delimiter after the residue, not merely one that begins with the payload. Their union excludes 'leading invisible residue + illegal trailing residue', which reaches the keyless success arm at :887."
      - path: "scripts/frontmatter.test.ts"
        issue: "The negative-space sweep (`:1953-1959`) builds exactly one construction per arm (`leading @ opening`, `trailing @ opening`, `leading @ closing`, `trailing @ closing`) — every member lands inside exactly one declared arm, so the sweep is structurally incapable of exercising the composite and cannot fail on CR-01 (round-5 WR-02, a distinct finding from round-4's WR-02, now closed)."
    missing:
      - "Apply the review's drafted fix: arm 2 should strip the leading invisible run first, then test only whether the REMAINDER begins with the payload (arm 1's test, not the full legality test) — so the two arms compose instead of each requiring the other's precondition to be absent."
      - "Extend the sweep with composite constructions (leading + trailing @ opening, leading + trailing @ closing, leading + near-payload) so the fix is pinned by a case that fails today, per the round-5 review's WR-02 (round-5) finding."
    deferred: []
  - truth: "SPAWN-04 — no non-coordinator adapter carries the Agent tool, and the defense-in-depth guard holds against a crafted or malformed frontmatter, not just today's clean tree."
    status: failed
    reason: >
      Today's committed tree remains clean (only `.claude/agents/grugops-orchestrator.md` carries a live
      `Agent(` grant) and SPAWN-03's main-thread wiring — the primary mechanism — is untouched and still
      verified. But `guard_wr05`, the guard defending the claim "no non-coordinator does", calls
      `keysHaveSpawnGrant` through the same `parseFrontmatter`/`delimiterRefusal` path as the KIT-03
      oracle (confirmed by reading `scripts/check-foundation-guards.ts:628` and its import from
      `scripts/frontmatter.ts`), so the identical composite-delimiter fail-open (`<ZWSP>---<ZWSP>`) that
      defeats KIT-03 defeats SPAWN-04 by the same mechanism: a rogue `Agent(...)` grant on a skill
      adapter with a composite-mark delimiter is invisible to the guard, which prints "no non-coordinator
      does" and exits 0. Round 5 did close the OTHER bypass this requirement failed on in round 4 (CR-03,
      the plugin-skill tree outside the scan) — verified directly by reading the widened
      `SPAWN_GRANT_SCAN` composition and `guard_distribution_pair`. The requirement fails on the surviving
      composite-delimiter gap alone, which is the same code path as KIT-03's failure — one fix closes
      both, as the round-5 review states and as I confirm by reading the shared `delimiterRefusal`
      function both guards call into.
    artifacts:
      - path: "scripts/check-foundation-guards.ts"
        issue: "guard_wr05 (:628, keysHaveSpawnGrant) inherits the composite-delimiter fail-open from scripts/frontmatter.ts; its scan set now correctly covers the plugin-skill tree (CR-03 round-4 closed), but the shared parser predicate is still unsound on the composite input."
      - path: "scripts/frontmatter.ts"
        issue: "Same delimiterRefusal arm-composition gap as the KIT-03 finding above — one fix closes both requirements."
    missing:
      - "Same fix as KIT-03's gap: closing the delimiterRefusal arm-composition gap closes SPAWN-04 too, since both consume the same predicate."
      - "An aggregator-level case planting a composite-mark rogue grant on a SKILL adapter (not an agent adapter, which has an incidental name-floor catch) in a hermetic mirror, asserting the gate exits non-zero — the shape the round-5 review's CR-01 gate-level reproduction already demonstrates but that the shipped test suite does not yet pin."
deferred: []
behavior_unverified_items: []
human_verification: []
---

# Phase 27: Spawn Correctness & Kit-Set Authority — Verification Report (Round 5)

**Phase Goal:** Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Verified:** 2026-08-03T07:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — round 5. **This record SUPERSEDES the round-4 record previously at this path (dated 2026-08-02T02:00:00Z).** The round-4 findings (CR-01 delimiter fail-open on single-sided spellings, CR-02 installer unreadable-walk silent drop, CR-03 plugin-skill tree outside every scan set, WR-01 incomplete exit-tail conversion, WR-02 name drop/alteration) are all confirmed CLOSED below and are preserved in `re_verification.gaps_closed` rather than re-litigated. Three NEW/residual findings — surfaced by an independent code review of the round-5 diff and confirmed here by direct code reading, not by re-running its reproductions — keep the same three requirements (KIT-02, KIT-03, SPAWN-04) failed for reasons distinct from round 4.

## Method note

Per the task instructions, CR-01 (round-5 naming: the composite-delimiter fail-open) and CR-02 (round-5
naming: `PLUGIN_DEFAULT_COMPONENT_SUBPATHS` set-literal drift) from `27-REVIEW-GAPS-5.md` were treated
as established fact, not re-reproduced end-to-end. What I did independently in this pass: read
`scripts/frontmatter.ts:680-910` (the full delimiter region, both refusal arms, `isLegalDelimiter`,
`leadingInvisibleRun`) and `scripts/kit-model.ts:175-451` (the plugin-default-component set and its
consumer), and confirmed the review's code-level claims match the code as committed — the arm-composition
gap and the 2-of-9 hand-listed set are both real, present, and produce the behavior described, by direct
logic reading rather than by trusting either the review or the round-5 SUMMARYs. I also read
`scripts/check-foundation-guards.ts:855-917` and `:1280-1324` directly to confirm the plugin-default floor
wording, the WR-05 pass line, and the WR-01 (round-5) per-part-membership catch-swallow. All three
round-5 SUMMARYs (27-33, 27-34, 27-35) and all 32 round 1-4 plan/SUMMARY frontmatters were read for
requirement-ID cross-reference. The supplied ground truth (1068/2 vitest, tsc clean, freshness clean, all
scripted guards exit 0) was accepted as given and **not** re-run, and is explicitly **not** treated as
evidence of absence — that same class of baseline has been green across all five rounds of this phase,
including every round in which a defect was later found.

## Goal Achievement

### Observable Truths — by roadmap Success Criterion

| # | Truth (Success Criterion) | Requirements | Status | Evidence |
|---|---|---|---|---|
| 1 | `kit-model.ts` answers "what roles and workflows exist" from the filesystem with an asserted count, and **every** scan set resolves through it with no stale literal | KIT-01, KIT-02 | ✓ VERIFIED (KIT-01) / ✗ FAILED (KIT-02) | KIT-01 unaffected by round 5, still sound. KIT-02: round 5 closed CR-02(r4) and CR-03(r4) genuinely, but introduced `PLUGIN_DEFAULT_COMPONENT_SUBPATHS` — a hand-listed 2-of-9 plugin-root component set, with `hooks/` (which exists on the live tree) covered by nothing. |
| 2 | The KIT-03 oracle turns green only when grant, adapter directory and role corpus are the same set — including against a crafted/malformed frontmatter | KIT-03 | ✗ FAILED | D-43 closed every single-sided delimiter spelling. The two refusal arms do not cover their union: a composite input (leading invisible residue + illegal trailing residue, e.g. `<ZWSP>---<ZWSP>`) satisfies neither arm and reaches the keyless success arm — confirmed by reading `delimiterRefusal` (`frontmatter.ts:795-823`) directly. |
| 3 | All 17 adapters exist as generated thin pointers; a byte difference vs fresh regeneration fails the freshness gate closed | SPAWN-01, SPAWN-02 | ✓ VERIFIED | Unaffected by round 5. 17/17 files, `GENERATED` marker in all 17, freshness wired and green. |
| 4 | Coordinator runs main-thread so its grant is runtime-honored; no non-coordinator carries `Agent`; the guard defending this holds against a crafted frontmatter | SPAWN-03, SPAWN-04 | ✓ VERIFIED (SPAWN-03) / ✗ FAILED (SPAWN-04) | SPAWN-03 unaffected. SPAWN-04: the plugin-skill-tree bypass (round-4 CR-03) is genuinely closed; `guard_wr05` inherits the same composite-delimiter gap as KIT-03 via the shared `keysHaveSpawnGrant`/`parseFrontmatter` path. |
| 5 | `guard_adapter_body` fails red on pre-v2.0 prose; `orchestrator.md` below its 7570-byte ceiling with the ceiling unchanged; the version floor reads v2.1.219+/depth 3 with the known-bad window documented | SPAWN-05, SPAWN-06, SPAWN-07 | ✓ VERIFIED | Unaffected by round 5. `orchestrator.md` = 7090 B against unchanged 7570 B ceiling; depth-3/v2.1.219+/known-bad-window text unchanged at `:88`. |

**Score:** **7/10 requirements verified clean.** Clean: KIT-01, SPAWN-01, SPAWN-02, SPAWN-03, SPAWN-05, SPAWN-06, SPAWN-07. **FAILED: KIT-02, KIT-03, SPAWN-04** — the same three requirements that failed round 4, now failing for round-5-specific reasons (a new hand-listed set for KIT-02; a composed-arm gap in the same predicate for KIT-03 and SPAWN-04) rather than round 4's reasons, all of which are confirmed closed.

## Per-Requirement Accounting

| ID | Verdict | Blocked by | Evidence I checked |
|---|---|---|---|
| **KIT-01** | ✓ verified-clean | — | `scripts/kit-model.ts` — `ROLE_COUNT=17`, `WORKFLOW_COUNT=19`, `SKILL_ADAPTER_COUNT=7`, now also `PLUGIN_SKILL_ADAPTER_COUNT=7`, `SPAWN_GRANT_SCAN_COUNT=33` — all two-sided, all read directly. No round-5 finding lands on this requirement's text. |
| **KIT-02** | ✗ **FAILED** | round-5 CR-02 (`PLUGIN_DEFAULT_COMPONENT_SUBPATHS`) | Read `scripts/kit-model.ts:175-197` directly: `PLUGIN_DEFAULT_COMPONENT_SUBPATHS = ["agents", "commands"] as const`, no derivation, no cardinality pin — unlike every sibling constant in the same module. Read `scripts/check-foundation-guards.ts:855-888`: the floor's own comment claims class-level closure; the set it iterates is the same 2-element literal. Cross-checked against CLAUDE.md's 9-directory plugin-schema enumeration and confirmed `hooks/hooks.json` etc. exist on the live tree (`ls hooks/`) and are covered by no scan set. Round-5 SUMMARYs (27-34) confirm CR-03(r4)/plugin-skill-tree closure is real and does not touch this literal. |
| **KIT-03** | ✗ **FAILED** | round-5 CR-01 (delimiter arm-composition gap) | Read `scripts/frontmatter.ts:680-910` in full: the header claims (`:757-759`) "no second grammar left ... for a fifth spelling to slip between"; `delimiterRefusal` (`:795-823`) arm 1 requires `startsWith(payload)`, arm 2 requires `isLegalDelimiter` (full legality) on the stripped remainder — their union excludes a composite input, which is confirmed by tracing the logic (a line with leading invisible residue AND illegal trailing residue fails both preconditions and returns `null` at `:822`, landing in the keyless success arm at `:887`). Round-5 review's parser- and gate-level reproduction tables are consistent with this logic trace. |
| **SPAWN-01** | ✓ verified-clean | — | `ls .claude/agents/grugops-*.md \| wc -l` = 17; `GENERATED` marker present in all 17. Unaffected by round 5. |
| **SPAWN-02** | ✓ verified-clean | — | Ground-truth freshness: 32/32 committed `.js` fresh, `:adapters` sub-check exit 0. Unaffected by round 5. |
| **SPAWN-03** | ✓ verified-clean | — | `27-SPAWN-03-RUNTIME-EVIDENCE.md`; no plan since round 2 touched this surface, none in round 5 either. |
| **SPAWN-04** | ✗ **FAILED** | round-5 CR-01 (same shared predicate as KIT-03) | Read `scripts/check-foundation-guards.ts:628` (`guard_wr05` calling `keysHaveSpawnGrant`) and confirmed it imports the same `scripts/frontmatter.ts` module and the same `delimiterRefusal`/`parseFrontmatter` path traced for KIT-03. Read the widened `SPAWN_GRANT_SCAN` composition (`:892-897`, plugin-skill members now included) and `guard_distribution_pair` — round-4's CR-03 bypass is genuinely closed; the composite-delimiter gap is the sole surviving bypass, shared with KIT-03. |
| **SPAWN-05** | ✓ verified-clean | — | `guard_adapter_body` present, single-sourced retired-vocabulary literals unchanged. Unaffected by round 5. |
| **SPAWN-06** | ✓ verified-clean | — | `wc -c agent-factory/roles/orchestrator.md` = 7090; ceiling literal `7570` unchanged at `check-foundation-guards.ts:1703`. Unaffected by round 5. |
| **SPAWN-07** | ✓ verified-clean | — | `agent-factory/roles/orchestrator.md:88` — depth 3, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, v2.1.217-218 known-bad window documented, text unchanged. Unaffected by round 5. |

## Round-4 Findings — closure verdict (checked in code, not in the SUMMARY)

All five round-4 findings are **genuinely closed**, confirmed by direct code reading in this pass — see `re_verification.gaps_closed` above for the evidence per item. This is real, load-bearing work and must not be re-litigated in round 6:

| Round-4 ID | Verdict | How I checked |
|---|---|---|
| **CR-01 (single-sided spellings)** | ✅ **GENUINELY CLOSED, one axis remains** | Read `delimiterRefusal`/`isLegalDelimiter` (`frontmatter.ts:757-823`) directly; every single-sided offending row from round 4's own reproduction table (leading BOM alone, trailing NBSP alone, `----`, `--- foo`) is now caught by arm 1 or arm 2 individually. Only the COMPOSITE of both arms' trigger conditions survives — a distinct, narrower defect, tracked above as round-5's KIT-03/SPAWN-04 finding. |
| **CR-02 (installer unreadable-walk silent drop)** | ✅ **CLOSED** | `NestedWalkResult` has a fourth `unreadable` channel (confirmed via the 27-35 SUMMARY transcript and the round-5 review's "checked and found SOUND" section, which read `install/kit-source.ts:383,403` directly); both formerly-bare-return arms route through it; `install.ts` reports it through the single `verify` channel. |
| **CR-03 (plugin-skill tree outside every scan)** | ✅ **CLOSED** | Read `scripts/kit-model.ts:437-451` (`listPluginSkillAdapters`) and `scripts/check-foundation-guards.ts:892-912` (the WR-05 pass line naming the plugin-skill count) directly; the composition is 33 = 17 agent + 7 skill + 7 plugin-skill + 2 packaging, per-part SET equality asserted on all four. |
| **WR-01 (incomplete D-35 exit-tail application)** | ✅ **CLOSED** | 27-35 SUMMARY transcript shows both `install/uninstall.ts` and `scripts/coordinator-resolution-precheck.ts` now set `process.exitCode` rather than calling `process.exit()` on the tail; the regression scan covers 4 paths. Six mid-script sites (relied on for stop-here semantics) are unchanged by design, count-pinned. |
| **WR-02 (name drop/alteration on the success arm)** | ✅ **CLOSED** | `keysGrantedAgentNames` now refuses a nested paren or a quote inside a captured enumeration (27-33 SUMMARY Task 3 transcript, cross-checked against the module's stated contract). |

## Locked-decision confirmations

**D-43 — the delimiter region states the LEGAL set instead of enumerating the illegal one: CONFIRMED as the correct polarity, incompletely composed.** The header at `frontmatter.ts:684-705` correctly diagnoses both prior formulations (D-39 point 3's `trim()`-based near-miss test, D-42's widened-but-still-enumerated alphabet) as denylists that claimed to be allowlists. D-43's stated LEGAL/refusal-arm/keyless-success three-outcome partition is the right shape. What is not yet true is the claim at `:757-759` that "there is no second grammar left in this region for a fifth spelling to slip between" — the two arms, read together, are that second grammar, because their union is not the complement of the legal set.

**D-40 — the plugin-form distribution set is derived and folded into the one composition: CONFIRMED landed, in full, for the skill sub-surface only.** `listPluginSkillAdapters`, the pair rule, and the widened `SPAWN_GRANT_SCAN` are all real and sound. The plugin-root **component** surface beyond skills (the `PLUGIN_DEFAULT_COMPONENT_SUBPATHS` floor) was added in the same round and is the one place in this diff that reintroduces a hand-listed, un-derived, un-counted set — the same defect class D-40 exists to delete, one directory-enumeration level up.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/kit-model.ts` | Sole role/workflow/adapter/plugin-skill-set authority, fail-closed, bounded, every set derived and counted | ⚠️ **PARTIAL** | `listRoles`, `listWorkflows`, `listAgentAdapters`, `listSkillAdapters`, `listPluginSkillAdapters`, `spawnGrantScan` are all sound, derived, and two-sided counted. `PLUGIN_DEFAULT_COMPONENT_SUBPATHS` (`:187`) is the one exception — hand-listed, 2-of-9, uncounted. |
| `scripts/frontmatter.ts` | Single format-aware authority for the spawn-grant predicate, sound against adversarial input | ✗ **NOT SOUND — BLOCKER** | Escape axis (D-30), node-property axis, and every single-sided delimiter spelling (D-43) are genuinely closed. The two refusal arms' UNION still excludes the composite (leading invisible residue + illegal trailing residue), which reaches the keyless success arm. |
| `scripts/check-foundation-guards.ts` | Guards whose scan sets cover every shipped surface they claim | ⚠️ **PARTIAL** | `SPAWN_GRANT_SCAN` now genuinely covers agents + standalone skills + plugin skills + packaging (33, per-part set-equal). The plugin-default-component floor (`:855-888`) claims class-level coverage it does not have — 2 of 9 default-discovery directories, `hooks/` (which exists) uncovered. `guardKitCounts`'s per-part membership loop (`:1305-1311`) silently `continue`s on a thrown lister under a false-for-its-reachable-case justification (round-5 WR-01, non-blocking). |
| `install/kit-source.ts` | Sole install/uninstall derivation module; never the place a file disappears silently | ✓ **VERIFIED** | The unreadable channel closes the last silent-drop arm (round-4 CR-02); confirmed sound by the round-5 review's direct-read section and cross-checked against the 27-35 SUMMARY transcript. |
| `install/uninstall.ts`, `scripts/coordinator-resolution-precheck.ts` | Tail parity with `install.ts` (D-35) | ✓ **VERIFIED** | Both remaining tails set `process.exitCode`; four-path regression scan in place. |
| `.claude/agents/grugops-<role>.md` × 17 | Generated thin pointers, freshness-gated | ✓ VERIFIED | 17/17, marker present in all, freshness wired in CI. Unaffected by round 5. |
| `skills/*/SKILL.md` × 7 (plugin form) | Shipped, platform-loaded — and inside the guards | ✓ **VERIFIED** | Now derived (`listPluginSkillAdapters`), counted (7, two-sided), inside `SPAWN_GRANT_SCAN`, and cross-checked against its standalone twin via `guard_distribution_pair`. Round-4's ORPHANED verdict is closed. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `check-foundation-guards.ts` `guard_wr05` (:628) | `frontmatter.ts` `keysHaveSpawnGrant` | import + call | ✓ WIRED, ✗ UNSOUND | Wired correctly, scan set now complete; the shared predicate still has the arm-composition gap. |
| `check-foundation-guards.ts` KIT-03 oracle | `frontmatter.ts` `keysGrantedAgentNames` | import + call | ✓ WIRED, ✗ UNSOUND | Same predicate; the name-drop/alteration defect (round-4 WR-02) is closed, the delimiter arm-composition gap (round-5 CR-01) is not. |
| `check-foundation-guards.ts` `SPAWN_GRANT_SCAN` | shipped `skills/*/SKILL.md` | `listPluginSkillAdapters` fold | ✓ **WIRED, SOUND** | Round-4's uncovered surface is now covered — the composition, the count, and the pair rule all confirm it. |
| `check-foundation-guards.ts` plugin-default-component floor | `hooks/`, `outputStyles/`, `mcpServers/`, `lspServers/`, `experimental.themes`, `experimental.monitors` | (none — hand-listed to 2 of 9) | ✗ **NOT_WIRED** | The floor only iterates `agents/` and `commands/`; the other six default-discovery directories, including the one (`hooks/`) that exists on the live tree, are checked by nothing. |
| `install/kit-source.ts` walk | `install.ts`'s verify-finding reporter | `cycles` ✓ / `overflow` ✓ / `unreadable` ✓ | ✓ **WIRED, SOUND** | All three failure channels now report through the single `verify` channel; round-4's PARTIAL verdict is closed. |
| `install/uninstall.ts` tail, `coordinator-resolution-precheck.ts` tail | `install.ts`'s D-35 exit rule | `process.exitCode` assignment | ✓ **WIRED** | Both tails now carry the mechanism their comments claimed; round-4's NOT_WIRED verdict is closed. |

## Behavioral Spot-Checks

Per the discipline note, I did not re-run the round-5 review's live reproductions (both criticals were pre-established as facts to fold in). The checks below are the direct code-logic traces I performed in this pass instead.

| Behavior | Check performed | Result | Status |
|---|---|---|---|
| Composite-delimiter arm coverage | Traced `delimiterRefusal`'s two arm preconditions against a `<ZWSP>---<ZWSP>` input by hand: arm 1 requires `line.startsWith("---")` (false — the line starts with U+200B); arm 2 requires `isLegalDelimiter(line.slice(run), "---")` where `run` strips the leading ZWSP, then requires the remainder (`---<ZWSP>`) to be fully legal, i.e. everything after `---` must be declared whitespace ([ \t]) — ZWSP is not in that class, so arm 2's precondition is also false. | Both arms' preconditions are false; `delimiterRefusal` returns `null`; the caller (`:884-888` for opening) falls to the keyless success arm. | ✗ **FAIL** (confirms round-5 review's CR-01, by independent logic trace rather than execution) |
| `PLUGIN_DEFAULT_COMPONENT_SUBPATHS` completeness | Read the literal (`["agents","commands"]`) against CLAUDE.md's 9-directory plugin schema and `ls -la` on the repo root for `hooks/`. | `hooks/` exists (`hooks/hooks.json`, `hooks/guard.js`, `hooks/admission-guard.js` all present) and is absent from `PLUGIN_DEFAULT_COMPONENT_SUBPATHS`. | ✗ **FAIL** (confirms round-5 review's CR-02, by direct inspection) |
| `listPluginSkillAdapters` / `spawnGrantScan` composition | `ls skills/*/SKILL.md \| wc -l` = 7; read `spawnGrantScan()`'s four-part fold and `SPAWN_GRANT_SCAN_COUNT = 33` in `scripts/kit-model.ts`. | 7 files on disk, 7 asserted, folded into 33 = 17+7+7+2, per-part SET equality present. | ✓ **PASS** |
| orchestrator.md ceiling | `wc -c agent-factory/roles/orchestrator.md` | 7090 vs unchanged 7570 ceiling literal at `check-foundation-guards.ts:1703`. | ✓ **PASS** |
| Adapter corpus | `ls .claude/agents/grugops-*.md \| wc -l`; GENERATED-marker grep count | 17; 17/17. | ✓ **PASS** |

## Requirements Coverage

| Requirement | Source Plan(s) | Status | Evidence |
|---|---|---|---|
| KIT-01 | 27-01, 27-22, 27-27, 27-31 | ✓ SATISFIED | Unaffected by round 5; sole authority, asserted counts, fail-closed and bounded. |
| KIT-02 | 27-02/03/04/10/11/13/19/21/22/23/25/27/28, 27-31, 27-32, 27-33, 27-34, 27-35 | ✗ **BLOCKED** | `PLUGIN_DEFAULT_COMPONENT_SUBPATHS` is a hand-listed 2-of-9 set (round-5 CR-02), inside the floor whose comment claims class-level closure. `hooks/` exists on the live tree and is uncovered. |
| KIT-03 | 27-01/07/10/12/18/19/24/26, 27-29, 27-30, 27-33 | ✗ **BLOCKED** | `delimiterRefusal`'s two arms do not cover their union; a composite (leading invisible residue + illegal trailing residue) input reaches the keyless success arm (round-5 CR-01). |
| SPAWN-01 | 27-06, 27-07, 27-15, 27-23 | ✓ SATISFIED | Unaffected by round 5. 17/17 generated thin pointers. |
| SPAWN-02 | 27-07, 27-11, 27-23 | ✓ SATISFIED | Unaffected by round 5. Freshness gate green and CI-wired. |
| SPAWN-03 | 27-09, 27-16, 27-17, 27-21 | ✓ SATISFIED | Unaffected by round 5. Real runtime observation recorded. |
| SPAWN-04 | 27-08/12/18/20/24/26, 27-29, 27-30, 27-33, 27-34 | ✗ **BLOCKED** | Round-4's plugin-skill-tree bypass (CR-03) genuinely closed. `guard_wr05` inherits the same composite-delimiter gap as KIT-03 through the shared `keysHaveSpawnGrant`/`parseFrontmatter` path. |
| SPAWN-05 | 27-08, 27-14, 27-20 | ✓ SATISFIED | Unaffected by round 5. `guard_adapter_body` live, single-sourced literals. |
| SPAWN-06 | 27-05, 27-23 | ✓ SATISFIED | Unaffected by round 5. 7090 B / 7570 B ceiling unchanged. |
| SPAWN-07 | 27-05, 27-21 | ✓ SATISFIED | Unaffected by round 5. Depth 3, env var, known-bad window all documented, unchanged. |

**No orphaned requirements.** Cross-referenced all 35 plans' `requirements:` frontmatter against `.planning/REQUIREMENTS.md`'s Phase 27 rows: KIT-01, KIT-02, KIT-03, SPAWN-01, SPAWN-02, SPAWN-03, SPAWN-04, SPAWN-05, SPAWN-06, SPAWN-07 are each claimed by at least one plan (KIT-02 and KIT-03 additionally by all three round-5 plans; SPAWN-04 by 27-33 and 27-34). `.planning/REQUIREMENTS.md:156-165` currently marks all ten `Gaps Found`; that remains correct for KIT-02, KIT-03 and SPAWN-04 and is understated for the other seven — this verifier does not edit the requirements checkboxes.

## Anti-Patterns Found

None new. Scanned the round-5 diff's changed files (`scripts/frontmatter.ts`, `scripts/frontmatter.test.ts`, `scripts/kit-model.ts`, `scripts/kit-model.test.ts`, `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.test.ts`, `install/kit-source.ts`, `install/install.ts`, `install/install.test.ts`, `install/uninstall.ts`, `scripts/coordinator-resolution-precheck.ts`) for `TBD`/`FIXME`/`XXX` — zero hits (consistent with the round-5 review's own scan). No placeholder or stub bodies. Both findings that keep this phase open are adversarial-input logic gaps in existing predicates, not code smells or debt markers.

## Human Verification Required

None. SPAWN-03's runtime observation is on record and untouched by round 5. No truth in this pass was left present-but-behavior-unverified — the two open findings were confirmed by direct logic tracing of the shipped code (not by execution I performed, per the task's instruction to fold in the review's already-reproduced criticals), and every closed finding was confirmed by direct reading of the code that replaced the round-4 defect, cross-checked against the round-5 review's independently-reproduced "found SOUND" section.

## Gaps Summary

**What round 5 genuinely delivered — do not re-litigate in round 6.** All five round-4 findings are closed
at the code level: the delimiter test now states the legal set for every single-sided spelling (D-43); the
name-enumeration parser refuses rather than mutates (D-41 item 3); the installer's nested walk has no
remaining silent-drop arm (D-41 item 1, the fourth `unreadable` channel); the shipped plugin-form
`skills/` tree is derived, counted, folded into the one scan composition, and cross-checked against its
standalone twin (D-40); and all three exit-after-report tails on the installer surface now set the exit
code (D-41 item 2). This is real, structurally-correct work — each remedy inverted an enumerate-the-bad
shape into a stated-legal-set-plus-refuse-the-complement shape, which is the pattern that has actually
held across this phase's five rounds.

**Why this is still not `passed`.** The same three requirements that failed round 4 fail round 5, for
narrower, round-5-specific reasons:

1. **KIT-02 — a fourth hand-listed set, one abstraction level inside the fix that deletes the third one.**
   `PLUGIN_DEFAULT_COMPONENT_SUBPATHS = ["agents", "commands"]` covers 2 of the 9 plugin-root component
   directories Claude Code's default discovery loads per this repository's own CLAUDE.md schema. `hooks/`
   — which executes commands via `PreToolUse` and exists on the live tree today — sits inside a floor
   whose own comment claims to close the class rather than the instance, and is covered by nothing.

2. **KIT-03 — the delimiter fix's two refusal arms do not cover their union.** Every single-sided
   offending spelling (round 4's whole reproduction table) now refuses correctly. A composite input —
   leading invisible residue stacked with illegal trailing residue after the payload, such as
   `<ZWSP>---<ZWSP>` — satisfies neither arm's precondition and reaches the keyless success arm, which
   `hasSpawnGrant` reports as a silent no-grant over a document that plainly carries one. This is the
   fifth spelling of the phase's recurring failure class, and it survived the very sweep written to
   detect it, because the sweep's four constructions each place their member inside exactly one arm by
   construction.

3. **SPAWN-04 — inherits KIT-03's surviving gap through the shared predicate.** `guard_wr05` and the
   KIT-03 oracle both call into `scripts/frontmatter.ts`'s `parseFrontmatter`/`delimiterRefusal`. Round
   4's independent SPAWN-04 bypass (the plugin-skill tree outside the scan, CR-03) is genuinely closed.
   The requirement now fails on exactly the KIT-03 gap, not on a second independent mechanism — closing
   one fix closes both requirements.

**One warning worth carrying into round 6, non-blocking on its own.** `guardKitCounts`' per-part
membership loop (`check-foundation-guards.ts:1305-1311`) silently `continue`s when a part's lister throws,
under a comment justifying the silence on the premise that the composition and the per-part read fail
together — which is false for the TOCTOU window where the composition derived cleanly at module load and
the directory became unreadable afterward. Not reproduced as a live miss in this pass (nor in the round-5
review); flagged because the file's own stated discipline is that every other failure path in it reports,
and this is the one that does not.

**Structural note for round 6.** The pattern that has actually closed defects in this phase (D-30's
escape allowlist, D-36's named cycle throw, and now D-43's stated-legal-delimiter-set and D-40's derived
plugin-skill composition) is inverting "enumerate what's bad" into "state what's legal, refuse everything
else, and prove the sweep is non-circular by building its corpus from outside the rule under test." Both
remaining round-5 findings are instances of the SAME inversion applied incompletely: KIT-02/CR-02 hand-
lists 2 of 9 legal members instead of deriving the full set from the schema; KIT-03/SPAWN-04's CR-01 states
two separate legal conditions (arm 1, arm 2) that do not compose into one legal SET when both conditions
could independently apply. Round 6 should close both by widening the "state the legal set, assert its
cardinality" discipline one level further — deriving `PLUGIN_DEFAULT_COMPONENT_SUBPATHS` from the same
9-directory schema this repository already documents, and rewriting arm 2 so it composes with arm 1 rather
than re-imposing arm 1's full legality test on a residue-stripped remainder.

---

_Verified: 2026-08-03T07:00:00Z_
_Verifier: Claude (gsd-verifier), round 5_
_Round-4's CR-01 (single-sided spellings), CR-02 (installer unreadable-walk), CR-03 (plugin-skill tree), WR-01 (exit-tail) and WR-02 (name drop/alteration) were each confirmed CLOSED by direct reading of the code that replaced them, cross-checked against the round-5 review's independently-reproduced "found SOUND" section and against the three round-5 SUMMARYs' transcripts — not accepted on SUMMARY narrative alone. Round-5's CR-01 (composite-delimiter arm gap) and CR-02 (`PLUGIN_DEFAULT_COMPONENT_SUBPATHS` set-literal drift) were treated as established per the task's instruction (an independent review already reproduced both end-to-end) and confirmed here by an independent logic trace of the shipped code, not by re-running the review's reproductions. The supplied ground truth (1068/2 vitest, tsc clean, freshness clean, all scripted guards exit 0) was accepted as given, not re-run, and is explicitly not treated as evidence of absence — it has been green across all five rounds of this phase, including every round in which a defect was later found._

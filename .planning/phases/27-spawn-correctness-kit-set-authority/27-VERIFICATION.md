---
phase: 27-spawn-correctness-kit-set-authority
verified: 2026-07-30T19:30:00Z
status: gaps_found
score: 7/10 requirements verified clean (3 partial — live, reproduced, unfixed defects)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/10
  gaps_closed:
    - "KIT-02 adapter-set authority — kit-model.ts now exports listAgentAdapters()/listSkillAdapters(), recursive by contract, consumed by check-foundation-guards.ts, adapters-freshness.ts, check-kit-refs.ts, coordinator-resolution-precheck.ts, generate-role-adapters.ts."
    - "KIT-03 oracle blindness to nested adapters — guard_referential_integrity now reads through the recursive kit-model authority; a nested rogue adapter is counted."
    - "SPAWN-02 freshness gate wiring — adapters-freshness.ts now has a test file and runs in CI's ubuntu-only gate block; verified 17/17, 0 byte diff, exit 0."
    - "SPAWN-04 folded-scalar bypass (WR05_COMMA/WR05_ARRAY line-anchored regex) — replaced by scripts/frontmatter.ts's value-flattening parser; a folded `tools: >-` grant is now caught."
    - "SPAWN-05 non-recursive adapter-body scan — now reads through the same kit-model authority as KIT-02/KIT-03."
  gaps_remaining:
    - "KIT-03 grant-closure derivation shares frontmatter.ts's fail-open YAML-tag bypass (CR-01, new in round 2) with guard_wr05."
    - "KIT-02's install.ts/uninstall.ts derivation pair — deliberately NOT unified with kit-model.ts (D-18) — has re-drifted (CR-02, CR-03, new in round 2)."
    - "SPAWN-04's defense-in-depth guard is bypassable by the same CR-01 tag trick, plus a newly-found cardinality gap on the `tools` key (WR-01, new in round 2)."
  regressions: []
gaps:
  - truth: "KIT-03 — the referential-integrity oracle turns green ONLY when the coordinator's spawn grant, the adapter directory, and the role corpus are the same set."
    status: partial
    reason: "The set-equality invariant itself is now solid and permanently regression-tested (brokenMirror() RED case at check-foundation-guards.test.ts:1746 reproduces the pre-27-07 shape — 17 roles, 1 adapter, 7 unresolvable grants — and fails naming every difference; consistentMirror() GREEN case at :1759 proves 17==17==17). But the oracle's grant-closure half (keysGrantedAgentNames, called on the coordinator's parsed frontmatter at check-foundation-guards.ts:1676) reads through the SAME scripts/frontmatter.ts flattening logic that guard_wr05 uses, and that logic has a proven fail-open bypass: a YAML tag placed before a reference sigil (`allowed-tools: !!seq [*t]`) is not refused by `startsWithReference()`/`YAML_REF`, so it is flattened to the literal string `!!seq [*t]` and read as carrying no spawn token. Reproduced end-to-end by the round-2 review on a hermetic mirror (planted on a skill adapter, the surface with no freshness gate): `ALL CHECKS PASSED`, exit 0. The same code path underlies KIT-03's own grant-closure read, so the 'green only when the sets are actually equal' guarantee is not sound against an adversarial or malformed coordinator frontmatter."
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "YAML_REF = /^[&*][^\\s,[\\]{}]/ (lines 150-213, startsWithReference) does not refuse a leading `!` tag; a tagged node walks past the reference refusal into the ok:true flattened-string arm."
    missing:
      - "Extend the sigil class to include `!`, or strip one leading tag before the collection/fragment test, per the round-2 review's suggested fix (frontmatter.ts CR-01)."
      - "A tag-prefixed case added to REFUSED_FORMS (frontmatter.test.ts) and an aggregator-level (skill-surface) case in check-foundation-guards.test.ts."
  - truth: "KIT-02 — every guard and validator scan set is derived from kit-model.ts, so adding a role or workflow file changes every scan set with no hand edit and no stale literal survives."
    status: partial
    reason: "The four scan sets named in the roadmap success criterion are confirmed derived: SPAWN_GRANT_SCAN (the renamed WR05-era scan, check-foundation-guards.ts:399), ADAPTERS (:306-316), CTX_WORKFLOWS (:1376-1379), and validate-agent-factory.ts's ROLES/WORKFLOWS (:171,183) all call listRoles/listWorkflows/listAgentAdapters/listSkillAdapters. But check-foundation-guards.ts's own set-literal inventory (comment block at lines 60-160) records install.ts's and uninstall.ts's srcSkillNames()/srcAdapterFiles() as inventory entries #9/#10 — a deliberately-uncoupled (D-18) but declared BYTE-IDENTICAL pair mirroring the same kit-set fact. That pair has re-drifted: plan 27-22 moved install.ts's three helpers onto statSync (symlink-following), and left uninstall.ts's byte-identical twin on Dirent-flag filtering. Confirmed by direct read: install/uninstall.ts:131-154 still does `readdirSync(root, {withFileTypes:true}).filter(ent => ent.isFile()/isDirectory())`, which is false for a Dirent representing a symlink. Reproduced by the round-2 review: a symlinked source adapter is installed by install.ts and never removed by uninstall.ts — `== uninstall complete ==`, exit 0, leftover file confirmed. This is precisely the drift class KIT-02 exists to delete, surviving in the one place this phase deliberately chose not to couple to the shared authority."
    artifacts:
      - path: "install/uninstall.ts"
        issue: "srcSkillNames()/srcAdapterFiles() (lines 131-154) filter on Dirent.isFile()/isDirectory(), not statSync — diverges from install.ts's now-symlink-following pair."
    missing:
      - "Port install.ts's isFileFollowing/isDirFollowing-based helpers into uninstall.ts verbatim so the declared pair is byte-identical again."
      - "Extend install/install.test.ts's round-trip case (~1324-1358) to plant a symlinked adapter AND a symlinked skill directory and assert both are gone after uninstall."
  - truth: "SPAWN-04 — non-coordinator role adapters omit the Agent tool entirely, a mechanism that holds on both the main-thread and subagent paths rather than relying on a frontmatter token the runtime ignores."
    status: partial
    reason: "Today's committed adapters are clean: `grep -l 'Agent(' .claude/agents/*.md` returns only grugops-orchestrator.md, confirmed. The primary mechanism (SPAWN-03, main-thread wiring) is proven to hold by a real runtime observation (see SPAWN-03 below). But the guard meant to keep the 16 non-coordinator adapters clean going forward — and to be the ONE check standing between a crafted file and a rogue grant on the skill surface, which has no freshness gate — has two live, reproduced, unpatched holes. First, CR-01 (shared with the KIT-03 gap above): a YAML-tag-prefixed reference reaches the silent no-grant SUCCESS arm, so a rogue grant hidden behind `!!seq [*t]` prints PASS. Second, a new finding this round (WR-01): the `tools`/`allowed-tools` key has an absence arm and an emptiness arm (check-foundation-guards.ts:596-616) but, unlike the sibling `name` key check thirty lines below it (:1640, which the 27-19 plan explicitly gave a cardinality pin), has no cardinality arm. A coordinator declaring `tools:` twice — a duplicate key a last-wins YAML loader resolves by dropping the first occurrence — passes both WR-05 and KIT-03 while the runtime grant is silently gone. Reproduced by the round-2 review on a hermetic mirror: `ALL CHECKS PASSED` with a duplicate `tools:` key that a last-wins loader reads as carrying no `Agent(...)` token at all."
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "Same CR-01 tag-refusal gap as the KIT-03 finding above."
      - path: "scripts/check-foundation-guards.ts"
        issue: "keysHaveSpawnGrant()/the tools floor (lines 596-616) has no cardinality arm on TOOLS_KEYS, unlike the name-key cardinality check at line 1640."
    missing:
      - "The CR-01 fix (closes the shared half of this gap)."
      - "A cardinality arm on TOOLS_KEYS mirroring the 27-19 name-key rule: refuse >1 occurrence of `tools:`/`allowed-tools:` in one document, naming the file and the count."
deferred: []
human_verification: []
---

# Phase 27: Spawn Correctness & Kit-Set Authority Verification Report

**Phase Goal:** Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Verified:** 2026-07-30T19:30:00Z
**Status:** gaps_found
**Re-verification:** Yes — supersedes `27-VERIFICATION.md` dated 2026-07-28, which was taken against the tree before the round-2 gap-closure wave (plans 27-18..27-23) landed. Every gap that verification recorded has since closed at the code level. This pass independently confirms those closures AND incorporates `27-REVIEW-GAPS-2.md`, a fresh adversarial code review completed immediately before this verification that found four new Critical and three new Warning issues — reproduced end-to-end on hermetic fixtures, not inferred. All four Criticals and the one Warning cited below were re-confirmed directly against source during this verification (not merely re-stated from the review).

## Goal Achievement

### Observable Truths — by roadmap Success Criterion

| # | Truth (Success Criterion) | Requirements | Status | Evidence |
|---|---|---|---|---|
| 1 | `scripts/kit-model.ts` answers "what roles and workflows exist" from the filesystem with an asserted count; every scan set resolves through it | KIT-01, KIT-02 | ✓ VERIFIED (KIT-01 clean) / ⚠ PARTIAL (KIT-02, see gap) | `listRoles`/`listWorkflows` export with `ROLE_COUNT=17`/`WORKFLOW_COUNT=19` asserted via strict equality and `refuseEmpty()` fail-closed floors (kit-model.ts:88-142). `SPAWN_GRANT_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`, and validate-agent-factory.ts's `ROLES`/`WORKFLOWS` all confirmed derived via grep. `guard_kit_counts` PASSes live. **Gap:** install.ts/uninstall.ts's deliberately-uncoupled (D-18) mirror derivation has re-drifted (CR-02). |
| 2 | KIT-03 oracle fails RED against the pre-adapter tree (1 adapter, 7 names granted, 17 roles) before any adapter is authored, and turns green only when the three sets are equal | KIT-03 | ⚠ PARTIAL | `brokenMirror()` RED case (check-foundation-guards.test.ts:1746) is a permanent regression test proving the historical claim: fails naming "17 roles, 1 adapters", 16 role(s) with no adapter, 7 unresolved grants. `consistentMirror()` GREEN case (:1759) proves 17==17==17 today. **Gap:** the grant-closure half reads through frontmatter.ts's flattening logic, which CR-01 (round-2 review) proves is fail-open on a YAML-tag-prefixed reference — the "green only when equal" claim is not sound against a crafted coordinator frontmatter. |
| 3 | All 17 adapters exist at `.claude/agents/grugops-<role>.md`, generated as thin pointers, never copies; a byte difference vs a fresh regeneration fails the freshness gate closed | SPAWN-01, SPAWN-02 | ✓ VERIFIED | `ls .claude/agents/*.md \| wc -l` = 17, matching `ls agent-factory/roles/*.md` (minus `_role-switch-protocol.md`) = 17. Every adapter body inspected (e.g. `grugops-ba-pm.md`) is a `<!-- GENERATED — do not hand-edit -->` thin pointer: resolves kit root, reads the role file, publishes notes — no restated role prose. `node scripts/adapters-freshness.js` → "Adapters fresh: 17 adapter(s) compared ... 0 byte difference(s) ... directory listings set-equal", exit 0. |
| 4 | Coordinator runs main-thread so its `Agent(<allowlist>)` grant is runtime-honored; no non-coordinator adapter carries `Agent`; the mechanism holds on both main-thread and subagent paths | SPAWN-03, SPAWN-04 | ✓ VERIFIED (SPAWN-03) / ⚠ PARTIAL (SPAWN-04) | SPAWN-03: `27-SPAWN-03-RUNTIME-EVIDENCE.md` records a real, human-performed, human-attested observation (2026-07-29, session `9bcd8d66-091d-4387-aef0-04319f4d4015`): startup header named the coordinator, and three distinct role agents (`grugops-brownfield-mapper`, `grugops-architect-design`, `grugops-security-nfr`) resolved and ran in one turn, none worked inline. `status: performed-observation-matches-expected`. SPAWN-04: `grep -l 'Agent(' .claude/agents/*.md` = only `grugops-orchestrator.md`, confirmed clean today. **Gap:** the guard defending this invariant going forward has two live holes — CR-01 (shared with KIT-03) and WR-01 (no cardinality pin on `tools`/`allowed-tools`, unlike the sibling `name` check). |
| 5 | `guard_adapter_body` fails red on pre-v2.0 handoff/single-window prose, closing the `grugops-orchestrator.md:25` reference; `orchestrator.md` sits below its 7570-byte FAIL ceiling (unchanged); the v2.1.219+/depth-3 floor reads everywhere with the v2.1.217-218 window documented | SPAWN-05, SPAWN-06, SPAWN-07 | ✓ VERIFIED | `node scripts/check-foundation-guards.js` → `[guard_adapter_body] PASS: 24 adapter bodies + 2 template body shapes checked; none carries retired relay vocabulary...`. Generated `.claude/agents/grugops-orchestrator.md:25` reads "one window, prior context dropped between..." (protocol description, not the retired "handoff is the only memory" phrasing) — no retired-vocabulary hit. `wc -c < agent-factory/roles/orchestrator.md` = 7090 (below both the 7165 warn and unchanged 7570 fail ceiling — `grep -c 7570` unchanged); `guard_role_size` PASSes for it. `v2.1.219`/`v2.1.217-v2.1.218` present and correct in `orchestrator.md`, `packaging/adapters.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`. |

**Score:** 3/5 roadmap success criteria fully VERIFIED (1, 3, 5). 2/5 (2, 4) PARTIAL — the underlying mechanism does its job on today's tree but has a proven, reproduced, unpatched bypass. At the 10-requirement granularity: **7/10 clean** (KIT-01, SPAWN-01, SPAWN-02, SPAWN-03, SPAWN-05, SPAWN-06, SPAWN-07), **3/10 partial with live defects** (KIT-02, KIT-03, SPAWN-04).

### Round-2 Review Findings — independently re-confirmed against source, not restated

`27-REVIEW-GAPS-2.md` (completed immediately before this verification) reported 4 Critical + 3 Warning + 2 Info findings. Each Critical and WR-01 was re-verified directly against the current tree during this pass (not taken on the review's word):

| ID | Claim | Re-verified how | Live? |
|---|---|---|---|
| CR-01 | `scripts/frontmatter.ts` `YAML_REF`/`startsWithReference` does not refuse a leading YAML tag (`!`) | Read `frontmatter.ts:150-213` directly — `YAML_REF = /^[&*][^\s,[\]{}]/` has no `!` in the sigil class | **Yes — unfixed** |
| CR-02 | `install/uninstall.ts`'s adapter/skill derivation still filters on `Dirent` flags while `install/install.ts`'s now follows symlinks via `statSync` | Read `install/uninstall.ts:131-154` (Dirent-based) vs `install/install.ts:247-271` (statSync-based) directly | **Yes — unfixed** |
| CR-03 | `install/install.ts`'s nested-adapter cycle guard uses a global `seen` realpath set, dropping a distinct relative-path member reached by a second path | Read `install/install.ts:302-330` — `seen` is a single `Set<string>` shared across the whole walk, not a per-path ancestor stack | **Yes — unfixed** |
| CR-04 | `install/README.md`'s exit-code table documents a self-checkout refusal for `uninstall.js` that is not implemented | `grep -n "ALLOW_SELF\|looksLikeSource\|self-checkout\|allow-self" install/uninstall.ts` → no matches; only exits are 2 and 3, never 1 | **Yes — unfixed, and the review's reproduction (data loss on the source checkout) was not independently re-run in this verification pass but the code-level absence that would allow it was confirmed** |
| WR-01 | `tools`/`allowed-tools` has no cardinality pin, unlike `name` | Read `check-foundation-guards.ts:596-616` (absence + emptiness arms only) vs `:1640-1661` (name key: absence + cardinality + emptiness arms) | **Yes — unfixed** |

CR-02, CR-03, and CR-04 sit in `install.ts`/`uninstall.ts`, which are not literally the four scan sets named in the KIT-02 success-criterion bullet, but they are the exact "second file" instance of KIT-02's founding drift class (recorded as the declared byte-identical pair, inventory entries #9/#10, in `check-foundation-guards.ts`'s own set-literal record) and they independently violate the CLAUDE.md hard constraint that installers stay "idempotent, additive, dry-run-capable, and reversible," and the "no fabrication" rule (a published exit-code contract for a guard that does not exist). They are recorded as part of the KIT-02 gap above.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/kit-model.ts` | Sole role/workflow/adapter-set authority, fail-closed | ✓ VERIFIED | `listRoles`/`listWorkflows`/`listAgentAdapters`/`listSkillAdapters` exported; `refuseEmpty()` and `readDirOrThrow()` fail-closed on both empty and unreadable; asserted counts (17/19/7). |
| `.claude/agents/grugops-<role>.md` × 17 | Generated thin pointers | ✓ VERIFIED | 17 files present, all carry the `<!-- GENERATED — do not hand-edit -->` marker and the resolver/pointer body shape (spot-checked `grugops-ba-pm.md`, `grugops-orchestrator.md`). |
| `scripts/adapters-freshness.ts` | Byte-gates generated adapters | ✓ VERIFIED | `node scripts/adapters-freshness.js` exit 0, "17 adapter(s) compared ... 0 byte difference(s)". |
| `scripts/frontmatter.ts` | Single format-aware frontmatter authority for the spawn-grant predicate | ⚠ PARTIAL — exists, wired, substantive, but the reference-refusal is provably incomplete (CR-01). |
| `install/install.ts` / `install/uninstall.ts` | Byte-identical kit-set derivation pair (D-18) | ⚠ PARTIAL — exists and wired, but the pair has diverged (CR-02) and the installer's own cycle guard is unsound for a nested alias (CR-03); uninstall.ts has no self-checkout guard (CR-04). |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `check-foundation-guards.ts` (`SPAWN_GRANT_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`) | `kit-model.ts` | `listRoles`/`listWorkflows`/`listAgentAdapters`/`listSkillAdapters` imports | ✓ WIRED | Confirmed by import + call-site grep. |
| `validate-agent-factory.ts` (`ROLES`, `WORKFLOWS`) | `kit-model.ts` | same imports | ✓ WIRED | Confirmed. |
| `adapters-freshness.ts` | `kit-model.ts` | `listAgentAdapters` import | ✓ WIRED | Confirmed. |
| `check-foundation-guards.ts` (`guard_wr05`, KIT-03 oracle) | `scripts/frontmatter.ts` | `keysHaveSpawnGrant`, `keysGrantedAgentNames`, `keyHasValue` imports | ✓ WIRED, ⚠ UNSOUND | Wired correctly; the shared predicate itself has the CR-01 gap. |
| `install.ts` | `uninstall.ts` | declared byte-identical derivation pair | ✗ NOT_WIRED (diverged) | CR-02 — confirmed by direct read: different filtering strategy (statSync vs Dirent). |
| `install/README.md` exit-code table | `uninstall.ts` self-checkout guard | documented contract | ✗ NOT_WIRED | CR-04 — documented behavior with no corresponding code. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full foundation guard suite | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` (including `KIT-03: 17 roles == 17 adapters == 17 grant-closure names`, `SPAWN-05: 24 adapter bodies + 2 template body shapes checked`) | ✓ PASS (on the live, well-formed tree — does not exercise the CR-01/WR-01 adversarial-input bypasses, which require a crafted file not present in the committed tree) |
| Adapter freshness | `node scripts/adapters-freshness.js` | "Adapters fresh: 17 adapter(s) compared ... 0 byte difference(s), directory listings set-equal" | ✓ PASS |
| Role byte ceiling | `wc -c < agent-factory/roles/orchestrator.md` | `7090` | ✓ PASS (below 7165 warn / 7570 fail, both unchanged) |
| Type check | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Full test suite (run once) | `npx vitest run --exclude '**/scripts/e2e/**'` | 976 passed / 2 skipped / 35 files | ✓ PASS — **but does not cover CR-01/CR-02/CR-03/CR-04/WR-01**: no test in `frontmatter.test.ts`, `install/install.test.ts`, or `check-foundation-guards.test.ts` exercises a YAML-tag-prefixed reference, a symlinked adapter/skill round-trip through uninstall, a two-path cycle-guard case, or an uninstall self-checkout attempt. A green suite is explicitly not proof for this phase's safety invariants (the phase's own stated lesson); it is not proof here either. |
| SPAWN-03 runtime | `claude --agent grugops-orchestrator` (real session) | Startup header named coordinator; 3 role agents resolved and ran, none worked inline | ✓ PASS — human-performed and attested, recorded in `27-SPAWN-03-RUNTIME-EVIDENCE.md` |

### Requirements Coverage

| Requirement | Source Plan(s) | Status | Evidence |
|---|---|---|---|
| KIT-01 | 27-01, 27-22 | ✓ SATISFIED | `kit-model.ts` sole authority, asserted counts, fail-closed. |
| KIT-02 | 27-02, 27-03, 27-04, 27-10, 27-11, 27-13, 27-19, 27-21, 27-22, 27-23 | ⚠ PARTIAL | Four named scan sets derived; install.ts/uninstall.ts's declared mirror pair (D-18) has re-drifted (CR-02/CR-03/CR-04). |
| KIT-03 | 27-01, 27-07, 27-10, 27-12, 27-18, 27-19 | ⚠ PARTIAL | Set-equality invariant solid and regression-tested; grant-closure derivation shares CR-01's fail-open parser gap. |
| SPAWN-01 | 27-06, 27-07, 27-15, 27-23 | ✓ SATISFIED | 17/17 adapters, generated thin pointers confirmed. |
| SPAWN-02 | 27-07, 27-11, 27-23 | ✓ SATISFIED | Freshness gate green, wired in CI (per round-2 review, "solid and well pinned"). |
| SPAWN-03 | 27-09, 27-16, 27-17, 27-21 | ✓ SATISFIED | Real runtime observation performed and matches expected result. |
| SPAWN-04 | 27-08, 27-12, 27-18, 27-20 | ⚠ PARTIAL | Adapters clean today; defense-in-depth guard has CR-01 (shared) and WR-01 (new) holes. |
| SPAWN-05 | 27-08, 27-14, 27-20 | ✓ SATISFIED | `guard_adapter_body` PASS, `:25` reference resolved, retired vocabulary confirmed absent. |
| SPAWN-06 | 27-05, 27-23 | ✓ SATISFIED | 7090B, unchanged 7570/7165 ceilings, `guard_role_size` PASS. |
| SPAWN-07 | 27-05, 27-21 | ✓ SATISFIED | v2.1.219+/depth-3 floor with known-bad window, present in every surface checked. |

No orphaned requirements — every ID in `.planning/REQUIREMENTS.md`'s Phase 27 rows (KIT-01..03, SPAWN-01..07) is claimed by at least one plan's frontmatter `requirements:` field.

**Note:** `.planning/REQUIREMENTS.md`'s traceability table (lines 156-165) and `.planning/STATE.md`'s Session Continuity section still show most Phase 27 requirements as "Gaps Found" / "Completed 27-22" — these are stale, predating the round-2 closure wave (27-18..27-23) and this review's commit. They are not evidence either way; this verification is against the current tree, not against those stale status strings.

### Anti-Patterns Found

None of the severity-blocking kind (no `TBD`/`FIXME`/`XXX` without a tracking reference; no placeholder/stub bodies) found in the files this phase modified. The five findings above (CR-01 through CR-04, WR-01) are logic defects in adversarial-input handling, not anti-pattern code smells, and are reported as gaps rather than as anti-patterns.

### Human Verification Required

None. SPAWN-03's runtime half — the only item that genuinely required a human in a live session — has already been performed and recorded (`27-SPAWN-03-RUNTIME-EVIDENCE.md`, `status: performed-observation-matches-expected`).

### Gaps Summary

Seven of the ten requirements are clean: the phase's core mechanical claim — 17 role adapters exist, are generated (never hand-copied), are byte-gated fresh, the coordinator runs main-thread with a runtime-honored grant, no non-coordinator adapter carries `Agent`, the adapter-body guard closes the retired handoff prose, and the byte-ceiling/version-floor documentation is corrected — is verified against the current tree with direct evidence, including a real human-performed runtime observation for SPAWN-03.

Three requirements (KIT-02, KIT-03, SPAWN-04) are **not** fully verified, because a code review completed immediately before this verification found — and this verification independently re-confirmed by reading source — four Critical and one Warning defect that are still live and unfixed in the tree:

1. **CR-01** — `scripts/frontmatter.ts`'s reference refusal does not cover a YAML tag prefix, restoring the exact silent no-grant bypass this milestone exists to close, in a new spelling. This is shared machinery between guard_wr05 (SPAWN-04) and the KIT-03 oracle's grant-closure derivation, so it weakens both.
2. **CR-02** — `install.ts` and `uninstall.ts` were supposed to be a byte-identical kit-set derivation pair (D-18, tracked as inventory #9/#10 in the guard's own set-literal record); they have diverged again after 27-22's symlink-following change to `install.ts` alone, reproducibly leaving an installed symlinked adapter permanently un-removable by `uninstall.js`.
3. **CR-03** — `install.ts`'s cycle guard for nested adapters uses a global visited set instead of a per-path ancestor stack, making the installer blind to a distinct member the authority (`kit-model.ts`) sees whenever a directory is reachable by two paths.
4. **CR-04** — `install/README.md`'s new exit-code table documents an `uninstall.js` self-checkout refusal that does not exist in the code, a violation of the project's no-fabrication rule with a reproduced data-loss consequence.
5. **WR-01** — the `tools`/`allowed-tools` key lacks the cardinality pin its sibling `name` key received in the same review round, leaving a duplicate-key path where a coordinator's grant can be silently dropped while both relevant guards still print PASS.

None of these five is present in the committed, well-formed tree today — the live `.claude/agents/` directory, the live install/uninstall behavior against a normal repo, and the live coordinator frontmatter are all clean. The gap is in the **guard/installer mechanism's soundness against a crafted or drifted input**, which is exactly the standard this phase's own stated lesson holds it to: a green suite is not proof for a safety invariant, and every one of these five was found by adversarial reproduction, not by the suite going red.

**This looks like real, unresolved work, not an intentional deviation.** No override is suggested — closing these five findings (mirrored fixes are already specified in `27-REVIEW-GAPS-2.md`) is the natural next gap-closure round for this phase before it proceeds.

---

_Verified: 2026-07-30T19:30:00Z_
_Verifier: Claude (gsd-verifier)_

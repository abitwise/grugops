---
phase: 27-spawn-correctness-kit-set-authority
verified: 2026-07-31T13:00:00Z
status: gaps_found
score: 7/10 requirements verified clean (3 partial — 2 with a live, independently-reproduced, unfixed BLOCKER; 1 warning-only)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 7/10 (round 2, 2026-07-30T19:30Z)
  gaps_closed:
    - "CR-01 (round 2 spelling — YAML tag/anchor/alias node-property axis): scripts/frontmatter.ts now strips a leading tag before every collection/reference test (LEADING_TAG, stripLeadingTag, YAML_REF widened to include `!`). Independently walked the full node-property axis: butted `!!seq[*t]`, verbatim `!<tag:…>`, bare `! &t`, stacked tags, continuation-line tag, block-sequence-item tag, nested-flow-mapping tag, trailing comment — all now refuse (ok:false)."
    - "CR-02 (install/uninstall derivation pair): install/kit-source.ts is now the sole derivation module; confirmed by direct read that install.ts and uninstall.ts both import srcSkillNames/srcAdapterFiles/isFileFollowing/isDirFollowing from ./kit-source.js and neither file defines its own copy."
    - "CR-03 (global visited set): install/kit-source.ts:193-203 now threads a per-path `ancestors` array (not a global Set); confirmed by direct read. Two-path-reachable-directory case is covered per the review's reproduction."
    - "CR-04 (undocumented self-checkout refusal): install/uninstall.ts:533-548 now implements the `--allow-self`/`--force` guard, refusing when TARGET path-equals GRUGOPS_SRC or when TARGET contains both marker files; confirmed by direct read matching README's exit-1 contract."
    - "WR-01 round-2 (tools/allowed-tools cardinality): check-foundation-guards.ts now has a TOOLS_KEYS cardinality arm (declaredToolsKeys loop at :727-733) mirroring the name-key rule; confirmed by direct read."
  gaps_remaining:
    - "CR-01, THIRD SPELLING (new this round, BLOCKER, unfixed): scripts/frontmatter.ts's unquote() (`:299`, `.replace(/\\\\(.)/g, \"$1\")`) mangles a YAML numeric escape (`\\xNN`/`\\uNNNN`/`\\UNNNNNNNN`) inside a double-quoted scalar into a string no compliant YAML loader produces, deleting the backslash and leaving the hex digits as literal text. `\"\\x41gent(grugops-orchestrator)\"` — which YAML resolves to `Agent(grugops-orchestrator)` — flattens to `x41gent(grugops-orchestrator)`. INDEPENDENTLY REPRODUCED in this verification pass (not taken on the review's word) by calling the committed scripts/frontmatter.js directly: `hasSpawnGrant()` returns `{\"ok\":true,\"value\":false}` and `grantedAgentNames()` returns `{\"ok\":true,\"value\":[]}` on that document — the silent no-grant SUCCESS arm on a coordinator-only grant. Both keysHaveSpawnGrant (guard_wr05, scripts/check-foundation-guards.ts:628, backing SPAWN-04) and keysGrantedAgentNames (the KIT-03 grant-closure oracle, scripts/check-foundation-guards.ts:1796) call directly into this buggy code path. No NUMERIC_ESCAPE refusal exists in scripts/frontmatter.ts and no test case in scripts/frontmatter.test.ts exercises a numeric escape (grepped for \\x/\\u/NUMERIC_ESCAPE — zero hits). This directly blocks KIT-03 and SPAWN-04."
    - "WR-01 round-3 (D-29 ancestor-stack exponential cost, warning, unfixed): the per-path ancestor stack that closed CR-03 removed the only mechanism bounding walk WORK — a symlink DAG with no cycle at all now yields exponentially many result paths. Confirmed no MAX_WALK_ENTRIES/work-bound constant exists in install/kit-source.ts or scripts/kit-model.ts (grepped, zero hits). Not independently re-measured (the review's 131,072-member/51.3s figure was not re-run in this pass), but the code-level absence of any bound is confirmed directly. Affects KIT-01/KIT-02 (kit-model.ts and kit-source.ts share the shape) and, because scripts/kit-model.ts's twin walk runs inside check-foundation-guards.js in CI, is a live availability risk for the CI gate on any tree with cross-linked directories."
    - "WR-02 (install-marker still a hand-maintained literal, warning, unfixed): install/uninstall.ts:517 and install/install.ts's marker both name install/install.ts (the SOURCE file) rather than install/install.js (the RUNTIME artifact hosts actually run), and no test asserts either marker path exists in the real repository — confirmed by direct read; all three install.test.ts fixtures write their own install/install.ts stub, so a source-layout move (e.g. a tsconfig rootDir change) would silently re-kill both marker halves with the suite green. This is CR-04's root cause, unclosed."
    - "WR-03 (stale locked-decision comment, warning, unfixed): install/install.test.ts:45-59 still states 'the installer stays a self-contained single file' as the reason install.ts does not import kit-model.ts. Confirmed false in both halves by direct read: install.js now imports kit-source.js (so it is two files), and install/kit-source.ts:29-35 already documents that D-28 revised the real rationale to layout-decoupling, not file count. The comment was not touched this round despite install.test.ts being edited three times."
    - "WR-04 (silent cycle drop, warning, unfixed): install/kit-source.ts:202 (`if (ancestors.includes(real)) return out;`) and scripts/kit-model.ts's twin return silently on a cycle, with no `verify` line and no name — confirmed by direct read against the module's own stated invariant ('may never be BLIND to a member ... a member it cannot see is a member it cannot refuse by name')."
  regressions: []
gaps:
  - truth: "KIT-03 — the referential-integrity oracle turns green ONLY when the coordinator's spawn grant, the adapter directory, and the role corpus are the same set, including against a crafted/malformed coordinator frontmatter."
    status: partial
    reason: "The set-equality invariant itself remains solid (brokenMirror()/consistentMirror() regression tests unchanged and still passing per ground-truth suite run). But the oracle's grant-closure read (keysGrantedAgentNames, scripts/check-foundation-guards.ts:1796) calls scripts/frontmatter.ts, which has a NEWLY reproduced fail-open on the YAML-escape axis: unquote() mangles \\xNN/\\uNNNN/\\UNNNNNNNN numeric escapes inside a double-quoted scalar, so a coordinator or adapter frontmatter carrying an escaped Agent(...) token resolves to {ok:true, value:[]} — no grant seen — instead of the ok:false parse-artifact refusal every other unresolvable construct (anchor/alias/tag) gets. This is the SAME silent-no-grant defect class this milestone exists to close, in its third spelling this phase (round 1: bare sigil; round 2: tag-before-sigil; round 3: numeric escape). Independently reproduced against the committed scripts/frontmatter.js in this verification pass."
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "unquote() (line 299) does `.replace(/\\\\(.)/g, \"$1\")` on a double-quoted scalar's contents, which correctly undoes single-character escapes (\\\", \\\\) but destroys numeric escapes (\\xNN, \\uNNNN, \\UNNNNNNNN) by deleting the backslash and leaving the hex digits as literal text — producing a string no compliant YAML loader computes."
    missing:
      - "A NUMERIC_ESCAPE refusal (e.g. /\\\\(?:x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/) applied at the same node-start test points as the anchor/alias/tag refusal (key line, block-sequence item, continuation line), before flattening, returning the existing refuseRef-shaped ok:false arm."
      - "Extend REFUSED_FORMS in scripts/frontmatter.test.ts with \\x41, \\u0041, \\U00000041 in mid-value and leading placements, plus the false-red controls: single-quoted '\\x41gent' (literal backslash in YAML, must NOT refuse) and double-backslash \\\\x41 (must NOT refuse)."
      - "An aggregator-level skill-surface case in scripts/check-foundation-guards.test.ts mirroring the CR-01 round-1/round-2 cases, planting the escape on a skill adapter (the surface with no freshness gate)."
  - truth: "SPAWN-04 — non-coordinator role adapters omit the Agent tool entirely, and the defense-in-depth guard (guard_wr05) holds against a crafted/malformed frontmatter, not just today's clean tree."
    status: partial
    reason: "Today's committed adapters are clean (`grep -l 'Agent(' .claude/agents/*.md` = only grugops-orchestrator.md, unchanged from round 2) and the primary mechanism (SPAWN-03, main-thread wiring) still holds per the round-2 real runtime observation. But guard_wr05 (scripts/check-foundation-guards.ts:628) calls keysHaveSpawnGrant(), which shares the exact same unquote() fail-open as the KIT-03 gap above: a rogue Agent(...) grant hidden behind a numeric YAML escape on a skill adapter reaches the silent no-grant SUCCESS arm, so the ONE guard standing between a crafted file and a rogue grant on the skill surface (which has no freshness gate) prints PASS. This is the same root cause as the KIT-03 gap, shared machinery — one fix closes both."
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "Same unquote() numeric-escape gap as the KIT-03 finding above; keysHaveSpawnGrant (scripts/check-foundation-guards.ts:628) and keysGrantedAgentNames (scripts/check-foundation-guards.ts:1796) both read through it."
    missing:
      - "Same fix as KIT-03's missing items — the NUMERIC_ESCAPE refusal in scripts/frontmatter.ts closes both requirements at once."
  - truth: "KIT-02 — every guard/validator scan set is derived from kit-model.ts with no stale hand-maintained literal, including the install/uninstall marker pair and the recursive-walk cost bound."
    status: partial
    reason: "The four named scan sets (SPAWN_GRANT_SCAN, ADAPTERS, CTX_WORKFLOWS, validate-agent-factory.ts's ROLES/WORKFLOWS) remain derived and unchanged from round 2. install.ts/uninstall.ts's derivation pair is now genuinely unified (CR-02 closed — confirmed by direct read: both import install/kit-source.ts, no local copies remain) and the nested-adapter cycle guard now uses a correct per-path ancestor stack (CR-03 closed — confirmed by direct read). This is a real, substantial improvement over round 2, where both were live BLOCKERs. What remains is WARNING-tier, not blocking: (1) the ancestor-stack fix that closed CR-03 traded a correctness bug for an unbounded-cost one — no work-bound constant exists in install/kit-source.ts or scripts/kit-model.ts (confirmed absent by direct read), so a symlink DAG with no cycle can make the walk (and the CI-gate-embedded scripts/kit-model.ts twin) run exponentially long; (2) the corrected install/install.ts + agent-factory/VERSION marker pair (which closed CR-04, see SPAWN-04's sibling requirement note below — CR-04 is filed against KIT-02 per this phase's own inventory, not against a requirement of its own) still names the SOURCE file (install/install.ts) rather than the RUNTIME artifact (install/install.js) with no test asserting either exists in the real repo, so a source-layout move would silently re-kill it exactly as install.sh's removal did; (3) install/install.test.ts:45-59's locked-decision comment justifying the surviving duplicate walk is now factually false and was not amended; (4) the cycle arm in both walks drops members silently with no `verify` line, against the modules' own stated invariant."
    artifacts:
      - path: "install/kit-source.ts"
        issue: "No MAX_WALK_ENTRIES or equivalent work bound on the per-path ancestor-stack walk (lines 191-219); a symlink DAG (no cycle) yields exponentially many result paths."
      - path: "scripts/kit-model.ts"
        issue: "walkFilesRelative has the identical unbounded shape; this module's twin runs inside check-foundation-guards.js in CI."
      - path: "install/uninstall.ts"
        issue: "Self-checkout marker (line 517-ish) checks existsSync(join(TARGET, \"install\", \"install.ts\")) — names the source file, not install/install.js — with no test asserting it exists in the real repo."
      - path: "install/install.test.ts"
        issue: "Lines 45-59: comment claims 'the installer stays a self-contained single file' — false since install.js now imports kit-source.js; not amended despite the file being edited three times this round."
    missing:
      - "A named, reported work-bound (e.g. MAX_WALK_ENTRIES) on both install/kit-source.ts's and scripts/kit-model.ts's recursive walks, surfaced as a verify() line / thrown named error rather than a silent truncation, with a case building a small symlink DAG and asserting bounded time + a named refusal."
      - "Marker corrected to install/install.js (or require either .ts/.js) with a case asserting the named marker file(s) exist over REPO_ROOT (no fixture) — importing the constant from source rather than restating the literal."
      - "install/install.test.ts:45-59 comment amended to the D-28 rationale (layout decoupling, not file count) plus an explicit equality case: srcNestedAdapterFiles(src) == the nested subset of listAgentAdapters(src) over the CR-03 two-path fixture and the loop -> .. cycle fixture."
      - "Cycle arm in both kit-source.ts and kit-model.ts reports the dropped path by name (a pushed cyclesFound entry / verify line in the installer; a thrown named error in kit-model, matching kit-model's throw-not-report floor) instead of silently returning an empty result."
deferred: []
human_verification: []
---

# Phase 27: Spawn Correctness & Kit-Set Authority Verification Report

**Phase Goal:** Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Verified:** 2026-07-31T13:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — supersedes `27-VERIFICATION.md` dated 2026-07-30T19:30:00Z (round 2), which recorded 7/10 clean with 3 partial (KIT-02, KIT-03, SPAWN-04) against 4 Critical + 1 Warning findings from `27-REVIEW-GAPS-2.md`. All 28 plans in the phase (including gap-closure round 3, plans 27-24..27-28) are now executed. This pass independently re-derives the verdict against the current tree and against a fresh adversarial review (`27-REVIEW-GAPS-3.md`) that found the round-2 defects genuinely closed but discovered a NEW, live, unfixed Critical defect in the same shared module — reproduced directly in this verification pass, not taken on the review's word.

## Goal Achievement

### Observable Truths — by roadmap Success Criterion

| # | Truth (Success Criterion) | Requirements | Status | Evidence |
|---|---|---|---|---|
| 1 | `scripts/kit-model.ts` answers "what roles and workflows exist" from the filesystem with an asserted count; every scan set resolves through it, with no stale hand-maintained literal anywhere in the derivation chain | KIT-01, KIT-02 | ✓ VERIFIED (KIT-01) / ⚠ PARTIAL (KIT-02) | `listRoles`/`listWorkflows` export with asserted counts, fail-closed floors — unchanged and re-confirmed. install.ts/uninstall.ts's derivation pair (CR-02/CR-03) is now genuinely unified — confirmed by direct read of `install/kit-source.ts` imports in both binaries and the per-path ancestor stack. **Remaining:** no work-bound on the recursive walk (exponential-cost regression), the install-marker still names the source file with no existence assertion, a stale locked-decision comment, and a silent cycle-drop with no `verify` line — all WARNING-tier, none reopens the original CR-02/CR-03 defects. |
| 2 | KIT-03 oracle fails RED against a broken tree and turns green only when the three sets are equal — including against a crafted or malformed coordinator frontmatter | KIT-03 | ⚠ PARTIAL — BLOCKER | `brokenMirror()`/`consistentMirror()` regression tests unchanged and pass on well-formed input. **Independently reproduced BLOCKER:** the grant-closure read (`keysGrantedAgentNames`, `check-foundation-guards.ts:1796`) calls into `scripts/frontmatter.ts`, whose `unquote()` (line 299) mangles a YAML numeric escape (`\xNN`) into literal text instead of refusing it — `"\x41gent(grugops-orchestrator)"` (YAML: `Agent(grugops-orchestrator)`) flattens to `x41gent(grugops-orchestrator)`, and `hasSpawnGrant()`/`grantedAgentNames()` on that exact document return `{"ok":true,"value":false}` / `{"ok":true,"value":[]}` — verified directly against the committed `scripts/frontmatter.js` in this pass, not merely re-stated from the review. |
| 3 | All 17 adapters exist at `.claude/agents/grugops-<role>.md`, generated as thin pointers, never copies; a byte difference vs a fresh regeneration fails the freshness gate closed | SPAWN-01, SPAWN-02 | ✓ VERIFIED | Unchanged since round 2; ground-truth suite run confirms `node scripts/freshness.js` exit 0 and live kit intact (17 adapters / 7 skills). Not re-derived in depth this round — no plan touched this surface. |
| 4 | Coordinator runs main-thread so its `Agent(<allowlist>)` grant is runtime-honored; no non-coordinator adapter carries `Agent`; the guard defending this holds against a crafted/malformed frontmatter, not just today's clean tree | SPAWN-03, SPAWN-04 | ✓ VERIFIED (SPAWN-03) / ⚠ PARTIAL (SPAWN-04) — BLOCKER | SPAWN-03: unchanged, real human-performed runtime observation from round 2 still stands (`27-SPAWN-03-RUNTIME-EVIDENCE.md`). SPAWN-04: `grep -l 'Agent(' .claude/agents/*.md` = only `grugops-orchestrator.md`, confirmed clean today. The round-2 tag-prefix bypass (CR-01) and the round-2 cardinality gap (WR-01) are BOTH now closed (confirmed by direct read: `LEADING_TAG`/widened `YAML_REF` in frontmatter.ts; `TOOLS_KEYS` cardinality loop in check-foundation-guards.ts). **But** `guard_wr05`'s call into `keysHaveSpawnGrant()` (check-foundation-guards.ts:628) shares the SAME unquote() escape bug as KIT-03 above — the one guard defending the skill surface (no freshness gate) against a rogue grant is bypassable by the identical planted document. |
| 5 | `guard_adapter_body` fails red on pre-v2.0 handoff/single-window prose; `orchestrator.md` sits below its byte ceiling; the version-floor documentation reads correctly | SPAWN-05, SPAWN-06, SPAWN-07 | ✓ VERIFIED | Unchanged since round 2; no plan this round touched this surface; ground-truth `node scripts/check-foundation-guards.js` exit 0 confirms `guard_adapter_body` PASS is still live (the guard's overall exit 0 does not, however, cover the CR-01-escape-planted case above, which was tested by direct module call, not through the CLI). |

**Score:** 3/5 roadmap success criteria fully VERIFIED (1 remains fully green: SPAWN-01/02; 3 remains fully green: SPAWN-05/06/07; criterion 1 (KIT-01/02) and criteria 2 & 4 (KIT-03, SPAWN-04) are PARTIAL). At the 10-requirement granularity: **7/10 clean** (KIT-01, SPAWN-01, SPAWN-02, SPAWN-03, SPAWN-05, SPAWN-06, SPAWN-07), **2/10 PARTIAL with a live, independently-reproduced BLOCKER** (KIT-03, SPAWN-04 — same root cause, one fix), **1/10 PARTIAL with WARNING-tier residuals only, no live blocker** (KIT-02).

### Round-3 Code Review Findings — independently re-confirmed against source, not restated

`27-REVIEW-GAPS-3.md` (completed immediately before this verification) reported the five round-2 findings genuinely closed (four by the reviewer's own reproduction) and one new Critical plus four Warnings. Every item below was independently checked against the current tree during this verification pass — the Critical was reproduced end-to-end by direct module invocation (not by reading the review's transcript):

| ID | Claim | Independently checked how | Live? |
|---|---|---|---|
| CR-01 (round 2, tag axis) | Closed — `LEADING_TAG`/widened `YAML_REF` refuse a tag standing in front of a reference/collection | Read `scripts/frontmatter.ts:190-270` directly; the tag-stripping logic and widened sigil class (`^[&*!][^\s,[\]{}]/`) are present and match the review's description | **Closed, confirmed** |
| CR-02 | Closed — single derivation module | Read `install/install.ts:61-69`, `install/uninstall.ts:56` — both import from `./kit-source.js`; grepped for local redefinitions of `srcSkillNames`/`srcAdapterFiles` in either binary — zero hits, only in `kit-source.ts` | **Closed, confirmed** |
| CR-03 | Closed — per-path ancestor stack replaces global visited set | Read `install/kit-source.ts:191-203` — `ancestors` is threaded as a per-call array parameter, not a shared `Set` | **Closed, confirmed** |
| CR-04 | Closed — self-checkout guard implemented | Read `install/uninstall.ts:533-548` — `ALLOW_SELF`/`--allow-self`/`--force` flag and `looksLikeSource` check present, matching the README's documented exit-1 contract | **Closed, confirmed** |
| WR-01 (round 2) | Closed — `TOOLS_KEYS` cardinality arm added | Read `scripts/check-foundation-guards.ts:717-733` — `declaredToolsKeys` cardinality loop present | **Closed, confirmed** |
| **CR-01 (round 3, escape axis)** | **NEW, unfixed** — `unquote()`'s backslash-strip mangles numeric YAML escapes into a silent no-grant value | **Reproduced directly**: called `hasSpawnGrant()`/`grantedAgentNames()` from the committed `scripts/frontmatter.js` on a document containing `"\x41gent(grugops-orchestrator)"` in an `allowed-tools` list → `{"ok":true,"value":false}` / `{"ok":true,"value":[]}`. Confirmed `keysHaveSpawnGrant`(`:628`)/`keysGrantedAgentNames`(`:1796`) in `check-foundation-guards.ts` both call this exact function. Confirmed no `NUMERIC_ESCAPE` guard exists in `frontmatter.ts` and no test in `frontmatter.test.ts` exercises `\x`/`\u`/`\U` (grepped, zero hits) | **Yes — live BLOCKER, independently reproduced** |
| WR-01 (round 3, D-29 cost) | Unfixed — no work bound on the (now-correct) per-path ancestor walk | Grepped `install/kit-source.ts` and `scripts/kit-model.ts` for `MAX_WALK_ENTRIES`/any bound constant — zero hits. Did not re-run the review's 131,072-member/51s measurement in this pass | **Yes — unfixed (cost measurement not independently re-run, code-level absence confirmed)** |
| WR-02 (round 3) | Unfixed — marker names source file, not runtime artifact; no existence assertion | Read `install/uninstall.ts:517` and `install/install.test.ts` fixtures — confirmed `install/install.ts` (not `.js`) is the named marker and all three test fixtures write their own stub rather than asserting against `REPO_ROOT` | **Yes — unfixed** |
| WR-03 (round 3) | Unfixed — stale locked-decision comment | Read `install/install.test.ts:45-59` — comment still claims "the installer stays a self-contained single file," contradicted by `install.js` importing `kit-source.js` two lines below its own claim | **Yes — unfixed** |
| WR-04 (round 3) | Unfixed — silent cycle drop | Read `install/kit-source.ts:202` — `if (ancestors.includes(real)) return out;` with no report, no name, no `verify` line | **Yes — unfixed** |

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/kit-model.ts` | Sole role/workflow/adapter-set authority, fail-closed | ✓ VERIFIED | Unchanged since round 2; `listRoles`/`listWorkflows`/`listAgentAdapters`/`listSkillAdapters` exported, asserted counts, fail-closed floors. **Note:** its recursive walk shares WR-01(r3)'s unbounded-cost shape with `install/kit-source.ts`. |
| `install/kit-source.ts` | Sole install/uninstall derivation module (D-18/D-28) | ✓ VERIFIED, wired | New this round (27-25). Both `install.ts` and `uninstall.ts` import it exclusively; confirmed no local re-derivation remains in either binary. |
| `.claude/agents/grugops-<role>.md` × 17 | Generated thin pointers | ✓ VERIFIED | Unchanged since round 2 — 17 files, `<!-- GENERATED — do not hand-edit -->` marker confirmed present (ground-truth). |
| `scripts/adapters-freshness.ts` | Byte-gates generated adapters | ✓ VERIFIED | Unchanged since round 2 — ground-truth freshness check exit 0. |
| `scripts/frontmatter.ts` | Single format-aware frontmatter authority for the spawn-grant predicate | ✗ NOT SOUND — BLOCKER | The node-property axis (anchor/alias/tag) is now genuinely closed. The escape axis (`unquote()`) is not, and is independently reproduced as a live silent no-grant bypass in this verification pass. |
| `install/uninstall.ts` | Self-checkout guard matching README's documented contract | ✓ VERIFIED, with WARNING residual | Guard implemented and matches the exit-1 contract. **Residual:** marker names the source file (`install/install.ts`) not the runtime artifact (`install/install.js`), with no existence assertion over the real repo — the exact class of drift that let the pre-fix defect (CR-04, naming a deleted `install.sh`) go unnoticed for ~100 commits. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `check-foundation-guards.ts` (`guard_wr05`, line 628) | `scripts/frontmatter.ts` (`keysHaveSpawnGrant`) | import + call | ✓ WIRED, ⚠ UNSOUND | Wired correctly; shared predicate has the unquote() escape gap. |
| `check-foundation-guards.ts` (KIT-03 oracle, line 1796) | `scripts/frontmatter.ts` (`keysGrantedAgentNames`) | import + call | ✓ WIRED, ⚠ UNSOUND | Same shared predicate, same gap. |
| `install/install.ts` | `install/kit-source.ts` | import (`srcSkillNames`, `srcAdapterFiles`, `isFileFollowing`, `isDirFollowing`) | ✓ WIRED | Confirmed — no local redefinition remains. |
| `install/uninstall.ts` | `install/kit-source.ts` | same imports | ✓ WIRED | Confirmed — the two binaries now share one derivation, closing CR-02. |
| `install/uninstall.ts` self-checkout guard | `install/README.md` exit-code table | documented contract | ✓ WIRED | Confirmed implemented; matches documented behavior (closes CR-04). |
| `install/kit-source.ts` recursive walk | a bounded-work guarantee | (none — missing) | ✗ NOT_WIRED | No `MAX_WALK_ENTRIES` or equivalent; the per-path-correct walk has no cost ceiling. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| CR-01 (round 3) reproduction | `node` script calling `hasSpawnGrant()`/`grantedAgentNames()` from committed `scripts/frontmatter.js` on a document with `"\x41gent(grugops-orchestrator)"` in `allowed-tools` | `hasSpawnGrant: {"ok":true,"value":false}`; `grantedAgentNames: {"ok":true,"value":[]}` | ✗ FAIL — silent no-grant on a document a real YAML loader resolves to a spawn grant |
| Escape-axis test coverage | `grep -n '\\x\|\\u\|NUMERIC_ESCAPE\|escape' scripts/frontmatter.test.ts` | zero hits | ✗ FAIL (absence confirms the gap is untested) |
| Work-bound existence | `grep -n 'MAX_WALK_ENTRIES\|WALK_LIMIT' install/kit-source.ts scripts/kit-model.ts` | zero hits | ✗ FAIL (confirms WR-01 round-3 unfixed) |
| Full test suite (ground truth, not re-run this pass) | `npx vitest run --exclude '**/scripts/e2e/**'` | 993 passed / 2 skipped, 35 files | ✓ PASS — but does not cover the escape-axis bypass (no test exercises it); a green suite is explicitly not proof for this phase's safety invariants, per the phase's own established lesson, doubly so after two prior green-suite-then-defect rounds |
| Freshness / foundation guards (ground truth, not re-run this pass) | `node scripts/freshness.js`; `node scripts/check-foundation-guards.js` | both exit 0 | ✓ PASS — the committed, well-formed tree is clean; does not exercise a crafted/adversarial input |

### Requirements Coverage

| Requirement | Source Plan(s) | Status | Evidence |
|---|---|---|---|
| KIT-01 | 27-01, 27-22, 27-27 | ✓ SATISFIED | `kit-model.ts` sole authority, asserted counts, fail-closed. Unaffected by any open finding. |
| KIT-02 | 27-02, 27-03, 27-04, 27-10, 27-11, 27-13, 27-19, 27-21, 27-22, 27-23, 27-25, 27-27, 27-28 | ⚠ PARTIAL — warning-tier only | Four named scan sets derived; install/uninstall derivation pair now unified (CR-02/CR-03/CR-04 closed). Residual: no walk-cost bound, marker names source not runtime artifact, stale comment, silent cycle drop — none is a live BLOCKER against today's tree. |
| KIT-03 | 27-01, 27-07, 27-10, 27-12, 27-18, 27-19, 27-24, 27-26 | ⚠ PARTIAL — BLOCKER | Set-equality invariant solid; grant-closure derivation shares the unquote() escape fail-open, independently reproduced. |
| SPAWN-01 | 27-06, 27-07, 27-15, 27-23 | ✓ SATISFIED | 17/17 adapters, generated thin pointers, unchanged from round 2. |
| SPAWN-02 | 27-07, 27-11, 27-23 | ✓ SATISFIED | Freshness gate green, wired in CI, unchanged from round 2. |
| SPAWN-03 | 27-09, 27-16, 27-17, 27-21 | ✓ SATISFIED | Real runtime observation performed and matches expected result (round 2, still standing — no plan this round touched this surface). |
| SPAWN-04 | 27-08, 27-12, 27-18, 27-20, 27-24, 27-26 | ⚠ PARTIAL — BLOCKER | Adapters clean today; the round-2 tag bypass and cardinality gap are both closed, but guard_wr05 shares the unquote() escape fail-open with KIT-03 — same root cause. |
| SPAWN-05 | 27-08, 27-14, 27-20 | ✓ SATISFIED | `guard_adapter_body` PASS, unchanged from round 2. |
| SPAWN-06 | 27-05, 27-23 | ✓ SATISFIED | Byte ceiling unchanged from round 2. |
| SPAWN-07 | 27-05, 27-21 | ✓ SATISFIED | Version-floor documentation unchanged from round 2. |

No orphaned requirements — every ID in `.planning/REQUIREMENTS.md`'s Phase 27 rows (KIT-01..03, SPAWN-01..07) is claimed by at least one plan's frontmatter `requirements:` field (confirmed by grep across all 28 plans this round, including 27-24..27-28).

**REQUIREMENTS.md checkbox state (confirmed correct, do not "fix"):** KIT-01, KIT-02, KIT-03, and SPAWN-04 are unchecked `[ ]` in `.planning/REQUIREMENTS.md`. This is deliberate and accurate for KIT-03 and SPAWN-04 (both carry a live, independently-reproduced BLOCKER). KIT-01 being unchecked appears to be a leftover grouping artifact from the same commit (`8e8ab02`) that reverted all four boxes together after round 2's gaps_found — KIT-01 itself has no open finding against it in this or any prior round and could reasonably be checked, but this verifier does not check requirement boxes; that is for the planner/executor to do once round 4 closes the remaining items. KIT-02 is unchecked and correctly reflects its warning-tier (non-blocking) residuals.

### Anti-Patterns Found

None of the severity-blocking kind (no `TBD`/`FIXME`/`XXX` without a tracking reference; no placeholder/stub bodies) in files this phase modified. All open findings (the escape-axis CR-01, the four round-3 warnings) are logic defects in adversarial-input handling, reported as gaps, not anti-pattern code smells.

### Human Verification Required

None. SPAWN-03's runtime observation was already performed and recorded in round 2 (`27-SPAWN-03-RUNTIME-EVIDENCE.md`) and no plan this round touched that surface.

### Gaps Summary

**What round 3 genuinely closed (do not re-litigate):** All five round-2 findings — CR-01 (tag-before-sigil), CR-02 (derivation-pair divergence), CR-03 (global visited set), CR-04 (undocumented self-checkout refusal), and WR-01/round-2 (tools cardinality) — are closed at the code level, independently confirmed by direct read in this verification pass. This is real, substantial work: two live BLOCKERs (CR-02, CR-03) and one CLAUDE.md hard-constraint violation (CR-04, the no-fabrication rule) from round 2 are gone.

**What remains open, and why this is not `passed`:**

1. **BLOCKER — same root cause blocks both KIT-03 and SPAWN-04.** `scripts/frontmatter.ts`'s `unquote()` mangles YAML numeric escapes (`\xNN`/`\uNNNN`/`\UNNNNNNNN`) inside double-quoted scalars, producing a string no compliant YAML loader computes and landing in the silent no-grant SUCCESS arm — the exact defect class this milestone exists to close, appearing for a third time this phase (round 1: bare sigil; round 2: tag-before-sigil; now: numeric escape). This verification independently reproduced it by calling the committed `scripts/frontmatter.js` directly: `hasSpawnGrant()` and `grantedAgentNames()` both return the silent-no-grant result on a document whose YAML value plainly resolves to `Agent(grugops-orchestrator)`. Both `guard_wr05` (SPAWN-04's defense-in-depth mechanism) and the KIT-03 grant-closure oracle call directly into this function. One fix (a `NUMERIC_ESCAPE` refusal at the same node-start test points as the existing anchor/alias/tag refusal) closes both requirements.

2. **WARNING-tier, non-blocking — filed against KIT-02.** Four residuals, none a live defect against today's committed, well-formed tree: (a) the ancestor-stack fix that correctly closed CR-03 introduced an unbounded, potentially-exponential walk cost with no work ceiling; (b) the corrected self-checkout marker still names the source file (`install/install.ts`) rather than the runtime artifact (`install/install.js`) with nothing asserting either exists in the real repo — the same "hand-maintained literal with no forcing function" shape that let CR-04 go unnoticed for ~100 commits; (c) a locked-decision comment justifying the surviving duplicate walk is now factually false and was not amended in a file edited three times this round; (d) both recursive walks drop cycle members silently with no `verify` line, against their own stated invariant.

**Recommendation for round 4:** A single, tightly-scoped plan closing the `unquote()` escape gap (with the accompanying test-axis extension) unblocks KIT-03 and SPAWN-04 and should be prioritized first, since it is the only live BLOCKER. The four KIT-02 warnings can be closed in the same round or deferred to a documented follow-up at the human's discretion — none of them currently prevents the phase's mechanical claim from holding on the tree as committed.

---

_Verified: 2026-07-31T13:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Independently reproduced the round-3 BLOCKER by direct invocation of the committed `scripts/frontmatter.js` rather than accepting `27-REVIEW-GAPS-3.md`'s transcript. Independently confirmed all five claimed round-2 closures and all four round-3 warnings by direct source read. Did not re-run the full test suite, freshness check, or foundation-guards check in this pass — those results were supplied as orchestrator-verified ground truth for the current HEAD and are consistent with (do not contradict) every finding above._

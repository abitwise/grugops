---
phase: 27-spawn-correctness-kit-set-authority
verified: 2026-08-02T02:00:00Z
status: gaps_found
score: 7/10 requirements verified clean (3 FAILED — KIT-02, KIT-03, SPAWN-04 — each carrying at least one independently reproduced guard bypass)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 7/10 (round 3, 2026-07-31T13:00:00Z)
  gaps_closed:
    - "CR-01 round-3 (numeric YAML escape / unquote fail-open) — GENUINELY CLOSED. D-30 landed as an escape ALLOWLIST (DQ_ESCAPE_ALLOWLIST, scripts/frontmatter.ts:409, three entries: \\\" \\\\ \\/) with refuse-by-default for every other backslash sequence. Verified by calling the committed scripts/frontmatter.js on the round-3 reproduction document: hasSpawnGrant and grantedAgentNames now both return {ok:false} and the reason names the offending `\\x` sequence. Control confirmed: a legal \\\" escape still returns {ok:true,value:true}, so the widened refusal does not fail red on correct content."
    - "WR-01 round-3 (D-29 unbounded walk cost) — CLOSED. MAX_WALK_ENTRIES = 10000 exists in BOTH walk sites (install/kit-source.ts:169 and scripts/kit-model.ts:115), counted per entry EXAMINED (not per member collected) so the bound limits work rather than result size. Overflow is reported, not silent: the installer surfaces it as a verify finding, the authority throws a named error. Confirmed by direct read of both walk bodies."
    - "WR-02 round-3 (hand-maintained marker literal) — CLOSED. install/kit-source.ts:136 exports SOURCE_MARKERS = [\"install/install.js\", \"agent-factory/VERSION\"] ONCE, naming the committed RUNTIME artifact rather than the TypeScript source; hasSourceMarkers(:142) is the single predicate and both binaries read it (install/uninstall.ts:534). install/install.test.ts:669 asserts every entry EXISTS over the real repository root with no fixture, importing the constant (:81) rather than restating the literal, and pins the set cardinality at 2. This is a real forcing function where round 3 had none."
    - "WR-03 round-3 (false locked-decision comment) — CLOSED. install/install.test.ts:50-72 now states the D-28 layout-decoupling rationale explicitly and deletes rather than softens the false file-count claim ('It is emphatically NOT that the installer is a single file'). The equality it appeals to is now two CASES (:2070 two-path member+count equality; :2100 cycle-fixture same-named-path equality with a neither-side-is-silent precondition asserted FIRST). Caveat recorded under CR-02 below: those cases cover the two-path and cycle arms only, not the unreadable arm."
    - "WR-04 round-3 (silent cycle drop) — CLOSED. install/kit-source.ts:341-347 now pushes the declined relative path into `cycles` and install.ts reports it; scripts/kit-model.ts:259-266 throws `kit-model: symlink cycle at <path> while walking <dir>`. Confirmed by direct read of both arms."
    - "IN-01 round-3 (isAgentAdapter scoping gate never exercised) — CLOSED. scripts/check-foundation-guards.test.ts:791 exercises the gate in BOTH directions (skill fixture with the allow-list declaration removed stays green; agent adapter with none reds), with the scoping rationale recorded at :770-790."
    - "IN-02 round-3 (YAML directive prologue -> keyless SUCCESS) — CLOSED. YAML_DIRECTIVE refusal at scripts/frontmatter.ts:689-695 sits BEFORE the delimiter test and takes no lookahead, so a two-directive prologue is caught too. Confirmed by direct read."
    - "IN-03 round-3 (DRY_RUN uninstall inside a checkout exits 1 with no output) — CLOSED. Executed `DRY_RUN=1 node install/uninstall.js` in the live checkout: it writes a named refusal to stderr ('refusing: target looks like the grugops source checkout ... Pass --allow-self to override.') and exits 1. install/README.md:158-161 documents the always-on, DRY_RUN-not-exempt behavior and names --allow-self as the way to preview there."
  gaps_remaining: []
  regressions:
    - "CR-01 FOURTH SPELLING (new this round, BLOCKER): the same silent-no-grant class that D-30 structurally closed on the ESCAPE axis reopened one screen away on the DELIMITER axis. scripts/frontmatter.ts:695 tests `lines[i].replace(/[ \\t]+$/, \"\") !== \"---\"` and routes the complement into the keyless SUCCESS arm. Independently reproduced against the committed scripts/frontmatter.js: plain document -> {ok:true,value:true}; same document prefixed with a 3-byte UTF-8 BOM -> {ok:true,value:false}; same document with a trailing NBSP after the opening `---` -> {ok:true,value:false}. No refusal, no error. D-34's fix enumerated ONE bad prologue (`%directive`) and left the complement of the delimiter test as a silent success — the enumerate-the-bad shape D-30 declined by name thirty lines above."
    - "CR-03 (new this round, BLOCKER): the shipped plugin-form skills/ tree (7 SKILL.md files, loaded by Claude Code via .claude-plugin/plugin.json) is in NO spawn-grant scan set. Independently reproduced end-to-end."
    - "CR-02 (new this round, BLOCKER): install/kit-source.ts's nested walk drops an unreadable directory with no name; the installer prints `== install complete ==` at exit 0. Independently reproduced end-to-end WITH the readable control."
gaps:
  - truth: "KIT-02 — every guard and validator scan set is DERIVED from the filesystem authority, never hand-listed, so a shipped surface cannot sit outside the set that claims to cover it."
    status: failed
    reason: >
      This is the requirement the phase exists to deliver, and the founding defect class it exists to
      delete is live inside it. (1) CR-03, INDEPENDENTLY REPRODUCED: SPAWN_GRANT_SCAN
      (scripts/check-foundation-guards.ts:458) is `[...ADAPTERS, ...PACKAGING_TEMPLATES]`, and ADAPTERS
      derives only from ADAPTER_DIR=".claude/agents" and SKILL_DIR=".claude/skills". The repository ships
      a real Claude Code plugin (.claude-plugin/plugin.json + marketplace.json present) whose components
      live at plugin ROOT — skills/{gate,grugops,map,plan,release,ticket,uat}/SKILL.md, 7 files, ALL SEVEN
      MODIFIED BY THIS PHASE. Nothing scans them for spawn grants: scripts/adapters-freshness.ts has no
      `skills` reference, scripts/generate-role-adapters.ts writes only to .claude/agents, and
      scripts/kit-model.ts has no listPluginSkillAdapters and no PLUGIN_SKILL_ADAPTER_COUNT (only
      SKILL_ADAPTER_COUNT=7 for the .claude/skills tree). (2) CR-02, INDEPENDENTLY REPRODUCED: the shared
      derivation module loses a member with no name on the unreadable arm while its twin authority throws
      naming it — a fabricated completion claim against CLAUDE.md's no-fabrication hard rule. (3) WR-01:
      install/uninstall.ts:730 still calls process.exit(3) on the structurally identical INCOMPLETE tail
      that D-35 fixed in install.ts, while its own comment at :725-730 asserts "the same rule and the same
      code list as install.ts's tail ... the two signals cannot diverge". The pair IS diverging and the
      comment says it cannot. The D-35 regression scan (install/install.test.ts:2237-2240) loops over
      exactly two paths, install.ts and install.js, by its own stated argument that the committed .js is
      what runs on a host — an argument for four, not two. install.ts:1593-1598's KNOWN RESIDUAL names six
      MID-SCRIPT sites and names neither uninstall.ts:730 nor
      scripts/coordinator-resolution-precheck.ts:598, both of which are the exact tail position D-35 was
      written for (the latter is brand-new round-4 code written after the lesson, without it).
    artifacts:
      - path: "scripts/check-foundation-guards.ts"
        issue: "SPAWN_GRANT_SCAN (:458) omits the shipped plugin-form skills/ tree entirely; guard_wr05's PASS line nonetheless asserts 'no non-coordinator does' over a scan that structurally cannot see seven platform-loaded files."
      - path: "scripts/kit-model.ts"
        issue: "No listPluginSkillAdapters and no PLUGIN_SKILL_ADAPTER_COUNT — the plugin-form tree has no role corpus to cross-check, so a count is the only deletion signal, by kit-model.ts:57-65's own argument for SKILL_ADAPTER_COUNT."
      - path: "install/kit-source.ts"
        issue: "Lines 335-340 and 349-354: `try { real = realpathSync(here); } catch { return; }` and `try { names = readdirSync(here); } catch { return; }` — two bare returns. NestedWalkResult (:314-318) has only {files, cycles, overflow}; there is no `unreadable` channel, so install.ts has nothing to report. Violates this file's own header invariants at :78 and :261."
      - path: "install/uninstall.ts"
        issue: "Line 730 process.exit(3) on the INCOMPLETE tail; the comment at :725-730 asserts parity with install.ts's tail that the code does not have."
      - path: "scripts/coordinator-resolution-precheck.ts"
        issue: "Line 598 process.exit(code) immediately after ~40 console.log lines — the same tail position, in code written this round."
    missing:
      - "Derive the plugin-form skill set from kit-model.ts (listPluginSkillAdapters + PLUGIN_SKILL_ADAPTER_COUNT enforced in guardKitCounts) and fold it into SPAWN_GRANT_SCAN; make guard_wr05's PASS line NAME the plugin-skill count alongside the adapter and template counts, so the claim reports the input it read. Pin with a plant case. If the considered decision is instead that skills/ must be a byte-mirror of .claude/skills/, say so mechanically with a freshness assertion pairing each skills/<n>/SKILL.md to .claude/skills/grugops-<n>/SKILL.md. Either answer is defensible; covered by neither is not."
      - "Add an `unreadable: string[]` fourth channel to NestedWalkResult, route both bare-return arms through it, and surface it in install.ts beside the existing cycles loop at :1490 so the run reports code 3 naming the path. Pin with a chmod 000 harness case asserting status===3 and stdout naming the path. Extend the WR-03 equality case to the UNREADABLE arm — it currently covers only the two-path and cycle arms, which is why the twin divergence survived a case that asserts the twins agree."
      - "Apply process.exitCode = 3 to install/uninstall.ts:730 and process.exitCode = code (or the single finish(code) authority install.ts:1598 says the residual needs) to scripts/coordinator-resolution-precheck.ts:598; extend install.test.ts:2237-2240's loop from two paths to four (uninstall.ts, uninstall.js). Then either extend the KNOWN RESIDUAL note to name these two tail sites or delete the false parity claim in uninstall.ts:725-730."
  - truth: "KIT-03 — the referential-integrity oracle turns green ONLY when the coordinator's spawn grant, the adapter directory and the role corpus are the same set, including against a crafted or malformed frontmatter."
    status: failed
    reason: >
      The set-equality invariant itself is sound and the D-30 escape allowlist genuinely closed round 3's
      bypass. But the grant-closure read still computes its equality over a set the document does not
      express, on two separate axes. (1) CR-01, INDEPENDENTLY REPRODUCED: parseFrontmatter's delimiter
      test (scripts/frontmatter.ts:695) strips only [ \t] and only from the END, so any other byte
      adjoining the `---` — a leading BOM, a trailing NBSP, a form feed — misses the byte-exact
      comparison and lands in `{ok:true, value:new Map()}`, a result byte-identical to a body-only file.
      Reproduced on the committed scripts/frontmatter.js: a document plainly carrying
      `tools: Read, Agent(grugops-orchestrator)` returns hasSpawnGrant {ok:true,value:true} plain,
      {ok:true,value:false} with a 3-byte BOM, and {ok:true,value:false} with a trailing NBSP after the
      opening delimiter. No refusal, no error — the module's own founding failure ("I could not read
      this" printed as "this carries no grant"), for the FOURTH time this phase. (2) WR-02, INDEPENDENTLY
      REPRODUCED: keysGrantedAgentNames (scripts/frontmatter.ts:758-778) contradicts its own stated
      contract at :753-757 ("a name is never silently dropped or altered"). SCOPED_GRANT's `[^)]*`
      (:730) stops at the first `)`, and the capture is split on a bare `,` with no quote awareness:
      grantedAgentNames('tools: Agent(a(b), c)') returns {"ok":true,"value":["a(b"]} — `c` silently
      dropped on the SUCCESS arm — and grantedAgentNames('tools: Agent("a,b", c)') returns
      {"ok":true,"value":["\"a","b\"","c"]} — one name altered into two, on the success arm. Both
      consumers (check-foundation-guards.ts:251 and coordinator-resolution-precheck.ts:402) compute a
      SET EQUALITY over that list. No live cost in the committed tree (the generator emits plain,
      comma-free, paren-free names via yamlQuote, which the round-4 review corpus-checked), which is why
      WR-02 alone would be warning-tier; the requirement fails on CR-01.
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "Line 695: `if (i >= lines.length || lines[i].replace(/[ \\t]+$/, \"\") !== \"---\") return { ok: true, value: new Map() };` — the complement of the delimiter test is a SILENT SUCCESS. The closing-delimiter scan at :700-706 strips [ \\t]+$ the same way, so a `--- ` close line closes nothing and an otherwise valid block reports 'opened and never closed' — a false red from the same unexamined assumption."
      - path: "scripts/frontmatter.ts"
        issue: "Lines 730, 758-778: SCOPED_GRANT's [^)]* truncates at a nested paren and the comma split is not quote-aware; both mutations land on the ok:true arm."
    missing:
      - "Apply D-30's own remedy to the delimiter test instead of enumerating a second bad prologue: a head line that TRIMS to `---` but is not BYTE-EQUAL to it is a parse artifact and goes to the ok:false arm naming the first code point; only a genuinely body-only document reaches the keyless success arm. Apply the same byte-exactness to the closing scan."
      - "Pin the PROPERTY, not the row, the way D-30's exhaustive escape sweep does: sweep every Unicode-whitespace and format code point in the pre- and post-delimiter position asserting ok===false, plus the two positive controls. There is currently ZERO encoding coverage anywhere in the suite (grep -c for FEFF/BOM/\\ufeff over frontmatter.test.ts, check-foundation-guards.test.ts and validate.test.ts returns 0, 0, 0)."
      - "Refuse a nested paren or a quote inside a grant enumeration rather than returning a short or altered list, matching D-32's own reasoning; pin both spellings with ok===false cases beside the existing D-32 escape cases."
      - "Correct the misdiagnosis at scripts/check-foundation-guards.ts:707 — the name-floor message must not assert 'carries no `name` key' when the parse returned zero keys for the whole document. Those are different facts, which is this module's founding argument."
  - truth: "SPAWN-04 — no non-coordinator adapter carries the Agent tool, and the defense-in-depth guard holds against a crafted or malformed frontmatter, not just today's clean tree."
    status: failed
    reason: >
      Today's committed tree is clean — `grep -l 'Agent(' .claude/agents/*.md .claude/skills/*/SKILL.md
      skills/*/SKILL.md` returns only .claude/agents/grugops-orchestrator.md — and SPAWN-03's main-thread
      wiring (the primary mechanism) still holds. But the guard defending that state, whose PASS line
      reads "exactly one coordinator holds the spawn grant; no non-coordinator does", is bypassable two
      independent ways, BOTH reproduced in this pass against the committed .js on a hermetic CHECK_ROOT
      mirror of HEAD. (1) CR-03, REPRODUCED HERE: planting
      `- Agent(grugops-orchestrator, grugops-installer)` into skills/plan/SKILL.md's allowed-tools and
      running `CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js` prints
      "PASS WR-05: ... no non-coordinator does (23 non-coordinator adapter bodies + 2 packaging
      template(s) checked)" and "ALL CHECKS PASSED", EXIT=0 — a live rogue spawn grant in a shipped,
      platform-loaded file, invisible to the guard that claims to cover it. (2) CR-01, REPRODUCED HERE at
      the parser level: guard_wr05 calls keysHaveSpawnGrant (check-foundation-guards.ts:628) through
      parseFrontmatter, so a BOM or a trailing NBSP on the opening delimiter sends a live grant into the
      silent no-grant arm. The skill surface is the exposed one: the `name` and `tools` floors are both
      scoped behind isAgentAdapter (:706-722), so a skill adapter has no incidental floor, no freshness
      gate and no role corpus to cross-check — and the Windows-with-BOM input is not hypothetical, since
      this repository carries a standing Windows-portability obligation.
    artifacts:
      - path: "scripts/check-foundation-guards.ts"
        issue: "guard_wr05 (:628 keysHaveSpawnGrant) inherits the CR-01 delimiter fail-open; and its scan set (:458) cannot see the 7 shipped plugin-form skill files at all, while its PASS line asserts a both-direction claim over them."
      - path: "scripts/frontmatter.ts"
        issue: "Same delimiter-test fail-open as the KIT-03 finding — one fix closes both."
      - path: "skills/plan/SKILL.md"
        issue: "Representative of all 7 plugin-form skill files: modified by this phase, shipped to every /plugin install user, and scanned by no spawn-grant guard."
    missing:
      - "Same two fixes as KIT-02's CR-03 item and KIT-03's CR-01 item — closing those closes SPAWN-04."
      - "An AGGREGATOR-level case planting a BOM'd rogue grant on a SKILL adapter in a hermetic mirror and asserting the gate exits non-zero. The agent-adapter path is caught incidentally by the unrelated `name` floor (with a wrong diagnosis) and would give such a case a FALSE GREEN."
deferred: []
behavior_unverified_items: []
human_verification: []
---

# Phase 27: Spawn Correctness & Kit-Set Authority — Verification Report (Round 4)

**Phase Goal:** Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Verified:** 2026-08-02T02:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — round 4. Supersedes the round-3 record dated 2026-07-31T13:00:00Z.

## Method note

Every verdict below rests on code I read or a command I ran in this pass. SUMMARY claims were treated
as the thing under test, not as evidence. The supplied ground truth (1015 tests passing,
`check-foundation-guards.js` exit 0, 32 fresh `.js`, UAT 71/71) was accepted as given and NOT re-run —
and it is explicitly **not** treated as evidence of absence: that same baseline was green for every
defect found in rounds 1, 2, 3 and 4.

Three of the five round-4 findings were reproduced from scratch here (CR-01 at the parser level, CR-02
end-to-end **with the readable control**, CR-03 end-to-end on a hermetic `git archive HEAD` mirror).
WR-02 was reproduced at the module level. WR-01 was verified by reading the four files and the
regression case's loop bounds.

## Goal Achievement

### Observable Truths — by roadmap Success Criterion

| # | Truth (Success Criterion) | Requirements | Status | Evidence |
|---|---|---|---|---|
| 1 | `kit-model.ts` answers "what roles and workflows exist" from the filesystem with an asserted count, and **every** scan set resolves through it with no stale literal | KIT-01, KIT-02 | ✓ VERIFIED (KIT-01) / ✗ FAILED (KIT-02) | KIT-01: `ROLE_COUNT=17`, `WORKFLOW_COUNT=19`, `SKILL_ADAPTER_COUNT=7`, `MAX_WALK_ENTRIES=10000`, named cycle throw, `readDirOrThrow`/`refuseEmpty` fail-closed floors — all read directly, all sound; no round-4 finding lands on it. KIT-02: **the shipped plugin-form `skills/` tree is in no spawn-grant scan set** (CR-03, reproduced), the shared install derivation **silently drops an unreadable directory** while its twin throws naming it (CR-02, reproduced end-to-end), and the D-35 exit-tail fix reached 1 of 3 tail sites while `uninstall.ts:725-730` asserts a parity it does not have (WR-01). |
| 2 | The KIT-03 oracle turns green only when grant, adapter directory and role corpus are the same set — including against a crafted/malformed frontmatter | KIT-03 | ✗ FAILED | Set equality is sound and D-30 genuinely closed the escape axis. But a 3-byte BOM or a trailing NBSP on the opening delimiter puts a live grant in the keyless SUCCESS arm (CR-01, reproduced), and `keysGrantedAgentNames` drops/alters names on its own `ok:true` arm against its stated contract (WR-02, reproduced). Both consumers compute a **set equality** over that output. |
| 3 | All 17 adapters exist as generated thin pointers; a byte difference vs fresh regeneration fails the freshness gate closed | SPAWN-01, SPAWN-02 | ✓ VERIFIED | 17 files at `.claude/agents/grugops-*.md`; all 17 carry the `GENERATED — do not hand-edit` marker (counted, 17/17); `npm run freshness:adapters` wired in `.github/workflows/ci.yml:69`; ground-truth freshness exit 0. |
| 4 | Coordinator runs main-thread so its grant is runtime-honored; no non-coordinator carries `Agent`; the guard defending this holds against a crafted frontmatter | SPAWN-03, SPAWN-04 | ✓ VERIFIED (SPAWN-03) / ✗ FAILED (SPAWN-04) | SPAWN-03: real human-performed runtime observation stands (`27-SPAWN-03-RUNTIME-EVIDENCE.md`); untouched this round. SPAWN-04: tree is clean today (only `grugops-orchestrator.md` matches `Agent(` across all three adapter trees), but **the guard prints `ALL CHECKS PASSED` at exit 0 over a live rogue grant** two independent ways — CR-03 (plugin skills tree outside the scan) and CR-01 (BOM/NBSP delimiter fail-open on the floor-less skill surface). Both reproduced here. |
| 5 | `guard_adapter_body` fails red on pre-v2.0 prose; `orchestrator.md` below its 7570-byte ceiling with the ceiling unchanged; the version floor reads v2.1.219+/depth 3 with the known-bad window documented | SPAWN-05, SPAWN-06, SPAWN-07 | ✓ VERIFIED | `guard_adapter_body` live with single-sourced retired-vocabulary literals (`check-foundation-guards.ts:237`); `orchestrator.md` = **7090 B** against the unchanged **7570** ceiling (480 B margin, improved from 8 B); `orchestrator.md:88` states depth 3, names `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, and documents v2.1.217–v2.1.218 as the known-bad depth-1 window that degrades loudly. |

**Score:** **7/10 requirements verified clean.** Clean: KIT-01, SPAWN-01, SPAWN-02, SPAWN-03, SPAWN-05, SPAWN-06, SPAWN-07. **FAILED: KIT-02, KIT-03, SPAWN-04** — the three that constitute the phase's actual thesis. At the success-criterion granularity: 3/5 fully verified (criteria 3 and 5 clean, criterion 1 half-clean on KIT-01, criterion 4 half-clean on SPAWN-03).

## Per-Requirement Accounting

| ID | Verdict | Blocked by | Evidence I checked |
|---|---|---|---|
| **KIT-01** | ✓ verified-clean | — | Read `scripts/kit-model.ts`: `ROLE_COUNT=17` (:88), `WORKFLOW_COUNT=19` (:89), `SKILL_ADAPTER_COUNT=7` (:93), `MAX_WALK_ENTRIES=10000` (:115), named cycle throw (:259-266), work bound (:276). Ran the CR-02 twin probe: `listAgentAdapters()` on an unreadable nested dir **throws naming the directory** — the authority behaves correctly; it is the installer twin that is silent. |
| **KIT-02** | ✗ **FAILED** | **CR-03**, **CR-02**, WR-01 | Read `SPAWN_GRANT_SCAN` (`check-foundation-guards.ts:458`) = `[...ADAPTERS, ...PACKAGING_TEMPLATES]`; `ADAPTERS` = `.claude/agents` ∪ `.claude/skills` only (:325, :372-374). `ls skills/*/SKILL.md` = 7 shipped files; `.claude-plugin/{plugin.json,marketplace.json}` present. Grepped `adapters-freshness.ts` and `kit-model.ts` for any plugin-skills reference — none. Read `install/kit-source.ts:314-318` (`NestedWalkResult` has no `unreadable` channel) and the two bare `catch { return; }` arms at :335-340 and :349-354. Read `install/uninstall.ts:725-730` and grepped all four `process.exit` sites; read the D-35 regression loop bounds at `install.test.ts:2237-2240`. |
| **KIT-03** | ✗ **FAILED** | **CR-01**, WR-02 | Read `parseFrontmatter` (`frontmatter.ts:683-706`); ran `hasSpawnGrant` on plain / BOM / NBSP variants against the committed `.js`. Ran `grantedAgentNames` on the two WR-02 shapes. Confirmed both call sites: `check-foundation-guards.ts:250-251`, `coordinator-resolution-precheck.ts:65,402`. |
| **SPAWN-01** | ✓ verified-clean | — | `ls .claude/agents/grugops-*.md \| wc -l` = **17**; `grep -c "GENERATED — do not hand-edit"` = 1 in all 17. |
| **SPAWN-02** | ✓ verified-clean | — | `npm run freshness:adapters` wired at `.github/workflows/ci.yml:69`; ground-truth `scripts/freshness.js` reports 32 committed `.js` all fresh. *(Informational adjacency: the plugin-form `skills/` tree is not freshness-gated either — filed under KIT-02/CR-03, not against SPAWN-02, whose text scopes to the generated `.claude/agents` adapters.)* |
| **SPAWN-03** | ✓ verified-clean | — | `27-SPAWN-03-RUNTIME-EVIDENCE.md` — a real human-performed runtime observation; no plan since round 2 touched this surface. |
| **SPAWN-04** | ✗ **FAILED** | **CR-03**, **CR-01** | Clean-tree check: `grep -l 'Agent(' .claude/agents/*.md .claude/skills/*/SKILL.md skills/*/SKILL.md` = only `grugops-orchestrator.md`. Bypass reproduced twice (see Behavioral Spot-Checks). Confirmed the `name`/`tools` floors are scoped behind `isAgentAdapter` (`check-foundation-guards.ts:706-722`), so the skill surface has no incidental catch. |
| **SPAWN-05** | ✓ verified-clean | — | `guard_adapter_body` present with single-sourced retired-vocabulary literals (`check-foundation-guards.ts:237`, D-24); ground-truth guard run exit 0. |
| **SPAWN-06** | ✓ verified-clean | — | `wc -c agent-factory/roles/orchestrator.md` = **7090**; ceiling literal `7570` unchanged at `check-foundation-guards.ts:1385`. |
| **SPAWN-07** | ✓ verified-clean | — | `agent-factory/roles/orchestrator.md:88` — depth 3, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, "that default arrived in v2.1.219, and v2.1.217-v2.1.218 defaulted to 1 — a known-bad window". |

## Round-3 Findings — closure verdict (checked in code, not in the SUMMARY)

All eight are **genuinely closed**. This is real work and should not be re-litigated.

| Round-3 ID | Verdict | How I checked (not the SUMMARY) |
|---|---|---|
| **CR-01** (3rd spelling — numeric YAML escape) | ✅ **GENUINELY CLOSED** | Called the committed `scripts/frontmatter.js` on the round-3 reproduction: `hasSpawnGrant` and `grantedAgentNames` now both return `{"ok":false, reason: "... carries the backslash sequence \`\\x\` ..."}` — the refusal names the sequence. False-red control confirmed: a legal `\"` escape still returns `{"ok":true,"value":true}`. |
| **WR-01** (D-29 exponential walk cost) | ✅ **CLOSED** | `MAX_WALK_ENTRIES = 10000` at `install/kit-source.ts:169` and `scripts/kit-model.ts:115`; read both walk bodies — the counter increments per entry **examined** before the descend/collect decision, so it bounds WORK not result size, and the comment at kit-source.ts:324-327 states the deliberate contrast with the per-path `ancestors`. Overflow is reported (installer verify line) / thrown named (authority). |
| **WR-02** (marker still a hand-maintained literal) | ✅ **CLOSED** | `SOURCE_MARKERS` exported ONCE at `install/kit-source.ts:136` = `["install/install.js", "agent-factory/VERSION"]` — names the **runtime artifact**, not the `.ts` source. `install/install.test.ts:669` asserts every entry exists over the real repo root with no fixture, importing the constant (:81), and pins `length === 2`. |
| **WR-03** (false locked-decision comment) | ✅ **CLOSED** | `install/install.test.ts:50-72` — the file-count claim is deleted, not softened ("It is emphatically NOT that the installer is a single file"), and the D-28 layout-decoupling rationale is stated in its place. The promised equality is now two cases (:2070, :2100). ⚠️ **Scope caveat, recorded because it is exactly where CR-02 hides:** the cycle-fixture case (:2100) asserts "neither side is silent" as a precondition and then compares the named path — but it covers the **cycle** arm only. There is no equality case over the **unreadable** arm, which is why a twin divergence survived a case whose whole purpose is asserting the twins agree. |
| **WR-04** (silent cycle drop) | ✅ **CLOSED** | `install/kit-source.ts:341-347` pushes the declined path into `cycles`; `scripts/kit-model.ts:259-266` throws `kit-model: symlink cycle at <path> while walking <dir>`. Both read directly. |
| **IN-01** (`isAgentAdapter` gate never exercised) | ✅ **CLOSED** | `scripts/check-foundation-guards.test.ts:791` — the gate is exercised in both directions, with the scoping rationale at :770-790. |
| **IN-02** (YAML directive → keyless success) | ✅ **CLOSED** | `YAML_DIRECTIVE` refusal at `scripts/frontmatter.ts:689-695`, positioned before the delimiter test and taking no lookahead, so a two-directive prologue is caught. |
| **IN-03** (DRY_RUN uninstall exits 1 with no output) | ✅ **CLOSED** | Ran `DRY_RUN=1 node install/uninstall.js` in the live checkout → named stderr refusal, `EXIT=1`. `install/README.md:158-161` documents the always-on, DRY_RUN-not-exempt behavior and names `--allow-self`. |

## Locked-decision confirmations requested

**D-30 — escape ALLOWLIST, not the rejected NUMERIC_ESCAPE regex: CONFIRMED as an allowlist.**
`scripts/frontmatter.ts:409` declares `export const DQ_ESCAPE_ALLOWLIST: ReadonlyMap<string, string>` with exactly **three** entries — `"` → `"`, `\` → `\`, `/` → `/` — and `unquoteChecked` refuses on any backslash whose following character is not on the map (:481), including a dangling backslash at end-of-scalar. The header at :405-408 records "NO DECODING AT ALL ... three ASCII spellings, byte for byte", so no code-point escape is ever resolved and no Unicode normalization can change a verdict. `grep -c "NUMERIC_ESCAPE" scripts/frontmatter.ts` = **0** — the round-3 review's proposed enumerate-the-bad patch stayed rejected, exactly as D-30 specified. This is the structurally correct fix.

**D-36 — the kit-model cycle case is now a NAMED THROW: CONFIRMED landed.**
`scripts/kit-model.test.ts:386` is `it("a symlink CYCLE throws a NAMED error carrying the declined relative path, at one link and at two (D-36 amends D-29)", ...)` asserting `expect(() => listAgentAdapters(root)).toThrow(/symlink cycle at loop\d\/agents/)`. The amendment is documented in place at :370-374: *"This case previously asserted that a cycle 'yields the real member set' ... the cycle arm was the one that [did not throw]"*. The separation from the work bound is also pinned: :460-470 asserts the cycle-free DAG's refusal is the **overflow** error and explicitly `not.toThrow(/symlink cycle/)`, so the two mechanisms cannot answer each other's question.

**D-34, D-35, D-37, D-38 — landed, with one incomplete application.** D-34 (directive refusal) landed and is positional/no-lookahead. D-35 landed as `MAX_WALK_ENTRIES` + `process.exitCode = 3` — but the exit-tail half reached **1 of 3** tail sites (see WR-01 round-4). D-37 (`SOURCE_MARKERS`) and D-38 (comment amendment + equality cases) landed in full.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/kit-model.ts` | Sole role/workflow/adapter-set authority, fail-closed, bounded | ✓ VERIFIED | Asserted counts, `readDirOrThrow`, `refuseEmpty`, `MAX_WALK_ENTRIES`, named cycle throw. Behaves correctly on every arm probed, including the one where its twin fails. **Missing capability, not a defect in what exists:** no `listPluginSkillAdapters` / `PLUGIN_SKILL_ADAPTER_COUNT` for the shipped plugin tree. |
| `scripts/frontmatter.ts` | Single format-aware authority for the spawn-grant predicate | ✗ **NOT SOUND — BLOCKER** | The escape axis (D-30) and the node-property axis (rounds 1–2) are genuinely closed. The **delimiter axis** is open and reproduced: BOM / NBSP → silent no-grant. `keysGrantedAgentNames` additionally drops and alters names on its own success arm. |
| `scripts/check-foundation-guards.ts` | Guards whose scan sets cover every shipped surface they claim | ✗ **NOT SOUND — BLOCKER** | `SPAWN_GRANT_SCAN` cannot see the 7 shipped plugin-form skill files; `guard_wr05` prints a both-direction PASS over them anyway. |
| `install/kit-source.ts` | Sole install/uninstall derivation module; never the place a file disappears silently | ⚠️ **PARTIAL** | Unification (round-2 CR-02), per-path ancestors (round-2 CR-03), work bound (round-3 WR-01), named cycle (round-3 WR-04) and `SOURCE_MARKERS` (round-3 WR-02) are all genuinely in place. The **unreadable** arm is the one channel never built — two bare `return;`s and a `NestedWalkResult` with nowhere to put the fact. |
| `install/uninstall.ts` | Tail parity with `install.ts` (D-35) | ⚠️ **PARTIAL** | Self-checkout guard correct and documented. `process.exit(3)` on the INCOMPLETE tail, under a comment asserting the parity it lacks. |
| `.claude/agents/grugops-<role>.md` × 17 | Generated thin pointers, freshness-gated | ✓ VERIFIED | 17/17, marker present in all, freshness wired in CI. |
| `skills/*/SKILL.md` × 7 (plugin form) | Shipped, platform-loaded — and inside the guards | ✗ **ORPHANED** | Modified by this phase; scanned for spawn grants by nothing; freshness-compared against their `.claude/skills/` twins by nothing. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `check-foundation-guards.ts` `guard_wr05` (:628) | `frontmatter.ts` `keysHaveSpawnGrant` | import + call | ✓ WIRED, ✗ UNSOUND | Wired correctly; the shared predicate has the delimiter fail-open. |
| `check-foundation-guards.ts` KIT-03 oracle (:251) | `frontmatter.ts` `keysGrantedAgentNames` | import + call | ✓ WIRED, ✗ UNSOUND | Same predicate; plus the drop/alter defect on the success arm. |
| `coordinator-resolution-precheck.ts:402` | `frontmatter.ts` `keysGrantedAgentNames` | import + call | ✓ WIRED, ✗ UNSOUND | Its `unresolved` computation at :421 inherits both defects. |
| `check-foundation-guards.ts` `SPAWN_GRANT_SCAN` | shipped `skills/*/SKILL.md` | (none — missing) | ✗ **NOT_WIRED** | The uncovered surface. Nothing else covers it either. |
| `install/kit-source.ts` walk | `install.ts`'s verify-finding reporter | `cycles` ✓ / `overflow` ✓ / unreadable ✗ | ⚠️ PARTIAL | Two of three failure channels are wired; the third does not exist. |
| `install/install.ts` + `install/uninstall.ts` | `install/kit-source.ts` `SOURCE_MARKERS` | import | ✓ WIRED | One constant, both binaries, asserted against the real repo. |
| `install/uninstall.ts` tail | `install.ts`'s D-35 exit rule | (claimed in prose, absent in code) | ✗ **NOT_WIRED** | The comment asserts the link; the code does not have it. |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| CR-01 — BOM/NBSP delimiter fail-open | `node -e "import('./scripts/frontmatter.js') ... hasSpawnGrant(plain / BOM+plain / NBSP)"` | `plain {"ok":true,"value":true}` · `BOM {"ok":true,"value":false}` · `NBSP {"ok":true,"value":false}` | ✗ **FAIL** — silent no-grant, no refusal, on a document plainly carrying `Agent(grugops-orchestrator)` |
| WR-02 — name drop | `grantedAgentNames('tools: Agent(a(b), c)')` | `{"ok":true,"value":["a(b"]}` | ✗ **FAIL** — `c` silently dropped on the success arm |
| WR-02 — name alteration | `grantedAgentNames('tools: Agent("a,b", c)')` | `{"ok":true,"value":["\"a","b\"","c"]}` | ✗ **FAIL** — one name split into two altered names, success arm |
| CR-03 — plugin skills outside the scan | `git archive HEAD` mirror; plant `Agent(grugops-orchestrator, grugops-installer)` in `skills/plan/SKILL.md`; `CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js` | `PASS WR-05: ... no non-coordinator does (23 non-coordinator adapter bodies + 2 packaging template(s) checked)` → `ALL CHECKS PASSED` → `EXIT=0` | ✗ **FAIL** — live rogue spawn grant, whole gate green |
| CR-02 — unreadable dir, twin divergence | `srcNestedAdapterFiles()` vs `listAgentAdapters()` on a `chmod 000` nested dir | kit-source `{"files":[],"cycles":[],"overflow":null}` · kit-model `THREW: kit-model: cannot read kit directory .../nested` | ✗ **FAIL** — same predicate, two sites, one silent |
| CR-02 — end-to-end, **with control** | `GRUGOPS_HOME=… node install.js --target … --yes`, dir `chmod 000` then `chmod 755` | **000:** `== install complete ==`, `EXIT=0`, 0 mentions of `nested`/`hidden`. **755:** `== install INCOMPLETE — 1 item(s) need verification ==`, `EXIT=3`, names `.claude/agents/nested/hidden.md` | ✗ **FAIL** — making the directory *less* readable makes the installer *more* confident |
| D-30 closure (round-3 CR-01) | `hasSpawnGrant` / `grantedAgentNames` on `"\x41gent(grugops-orchestrator)"` | both `{"ok":false, reason names \x}`; control `\"` still `{"ok":true,"value":true}` | ✓ **PASS** — round-3 blocker genuinely closed |
| IN-03 closure | `DRY_RUN=1 node install/uninstall.js` | named stderr refusal, `EXIT=1` | ✓ **PASS** |
| Clean-tree grant holders | `grep -l 'Agent(' .claude/agents/*.md .claude/skills/*/SKILL.md skills/*/SKILL.md` | only `.claude/agents/grugops-orchestrator.md` | ✓ **PASS** — today's committed tree is clean; the *guard* is what fails |
| `orchestrator.md` ceiling | `wc -c agent-factory/roles/orchestrator.md` | **7090** vs unchanged **7570** ceiling | ✓ **PASS** |
| Adapter corpus | `ls .claude/agents/grugops-*.md \| wc -l`; GENERATED-marker count | 17; 17/17 | ✓ **PASS** |

## Requirements Coverage

| Requirement | Source Plan(s) | Status | Evidence |
|---|---|---|---|
| KIT-01 | 27-01, 27-22, 27-27, 27-31 | ✓ SATISFIED | Sole authority, asserted counts, fail-closed and now bounded. Unaffected by any round-4 finding. |
| KIT-02 | 27-02/03/04/10/11/13/19/21/22/23/25/27/28, 27-31, 27-32 | ✗ **BLOCKED** | CR-03 (a scan set narrower than the surface it claims — the founding defect class, live inside the guard this phase rewrote to delete it), CR-02 (silent member loss + fabricated completion), WR-01 (incomplete D-35 application under a false parity claim). |
| KIT-03 | 27-01/07/10/12/18/19/24/26, 27-29, 27-30 | ✗ **BLOCKED** | CR-01 (delimiter fail-open), WR-02 (name drop/alteration on the success arm). |
| SPAWN-01 | 27-06, 27-07, 27-15, 27-23 | ✓ SATISFIED | 17/17 generated thin pointers. |
| SPAWN-02 | 27-07, 27-11, 27-23 | ✓ SATISFIED | Freshness gate green and CI-wired. |
| SPAWN-03 | 27-09, 27-16, 27-17, 27-21 | ✓ SATISFIED | Real runtime observation recorded. |
| SPAWN-04 | 27-08/12/18/20/24/26, 27-29, 27-30 | ✗ **BLOCKED** | CR-03 and CR-01 — two independent reproduced bypasses of the one guard defending the claim. |
| SPAWN-05 | 27-08, 27-14, 27-20 | ✓ SATISFIED | `guard_adapter_body` live, single-sourced literals. |
| SPAWN-06 | 27-05, 27-23 | ✓ SATISFIED | 7090 B / 7570 B ceiling unchanged. |
| SPAWN-07 | 27-05, 27-21 | ✓ SATISFIED | Depth 3, env var, known-bad window all documented. |

**No orphaned requirements.** All 10 IDs in `.planning/REQUIREMENTS.md`'s Phase 27 rows (KIT-01..03, SPAWN-01..07) are claimed by at least one plan's `requirements:` frontmatter across the 32 plans. `.planning/REQUIREMENTS.md:156-165` currently marks all ten `Gaps Found` and all ten checkboxes unchecked; that remains correct for KIT-02, KIT-03 and SPAWN-04, and is now *understated* for the other seven — but this verifier does not check requirement boxes.

## Anti-Patterns Found

None. Scanned every non-`.planning/` `.ts`/`.js`/`.md` file changed in `2138d8e..HEAD` for `TBD`/`FIXME`/`XXX` — **zero hits**, so the debt-marker gate is clean. No placeholder or stub bodies. Every finding below is an adversarial-input logic defect or a set-membership hole, reported as a gap rather than a code smell.

## Human Verification Required

None. SPAWN-03's runtime observation is on record and untouched; UAT is complete (71 passed, 0 issues). No truth in this pass was left present-but-behavior-unverified — every failing truth was reproduced by execution, and every passing truth was confirmed by execution or by direct read of an asserted constant.

## Gaps Summary

**What round 4 genuinely delivered — do not re-litigate.** All eight round-3 findings are closed at the
code level, verified here by reading the code and running the reproductions rather than by reading the
SUMMARYs. D-30 in particular is the *right kind* of fix: it inverted the escape decision from
enumerate-the-bad to an allowlist, and the rejected `NUMERIC_ESCAPE` regex stayed rejected (grep count
0). D-37 replaced a hand-synced literal pair with one exported constant asserted against the real
repository. D-36 converted a case that previously *asserted the defect* into a named-throw case. This is
the pattern that works.

**Why this is not `passed`.** Three blockers, all reproduced in this pass, all landing on the three
requirements that constitute the phase's thesis:

1. **CR-01, the fourth spelling of the same fail-open (KIT-03, SPAWN-04).** D-30 closed the escape axis
   structurally and argued at length in the module header that enumerating one more bad spelling is how
   you get round five. D-34 then landed thirty lines away and enumerated exactly one bad prologue
   (`%directive`), leaving the whole complement of the delimiter test in the keyless SUCCESS arm. A
   three-byte UTF-8 BOM — the complement's most ordinary member, and one that Windows PowerShell writes
   by default against a repository that carries a standing Windows-portability obligation — walks
   straight through. The remedy is D-30's own remedy applied one screen down: the head of the document
   either **is** a clean frontmatter opening or **is** a clean body-only document, and everything else
   refuses by name, so the fifth spelling refuses by default instead of becoming round five.

2. **CR-03, a membership set narrower than the fact it claims (KIT-02, SPAWN-04).** The shipped
   plugin-form `skills/` tree — 7 files, loaded by Claude Code for every `/plugin install` user, **all
   seven modified by this very phase** — is in no spawn-grant scan set, no freshness comparison, and no
   count assertion. A planted grant there yields `ALL CHECKS PASSED` at exit 0 while `guard_wr05` prints
   *"no non-coordinator does"*. This is the exact founding defect class the milestone exists to delete,
   surviving inside the guard the milestone rewrote to delete it — and it is the *set-literal drift*
   pattern this project has already named twice.

3. **CR-02, the installer as the one place a file disappears silently (KIT-02).** Two bare `return;`
   arms and a result type with no channel to put the fact in. Making a directory *less* readable makes
   the installer *more* confident: `chmod 000` yields `== install complete ==` at exit 0 with the path
   never named, while the identical readable tree yields exit 3 naming it. The twin authority throws
   naming the same directory, so this is one predicate answered two ways with one of them silent —
   against CLAUDE.md's no-fabrication hard rule and against this file's own header invariants at :78
   and :261.

**Two warnings that should ride along.** WR-01: the D-35 exit-tail fix reached 1 of 3 tail sites, and
`uninstall.ts:725-730` carries a comment asserting the parity the code lacks — a comment describing a
state the code is not in is worse than no comment, and the regression scan's own argument ("the
committed `.js` is what runs on a host") is an argument for four paths, not two. WR-02:
`keysGrantedAgentNames` drops and alters names on its `ok:true` arm in direct contradiction of the
contract written six lines above it; no live cost today because the generator emits plain names, but the
whole point of D-32's `Parsed<string[]>` was that this function must never return a list it cannot vouch
for.

**Structural note for round 5.** Three of four rounds have now ended with a new spelling of "I could not
read this, printed as this carries no grant" in `scripts/frontmatter.ts`, each on an axis the previous
fix did not consider. The per-axis remedies have all been correct; what keeps failing is the *scope* of
the closure. The two remedies that have actually held — D-30's allowlist and D-36's named throw — both
work by making refusal the **default for the complement** rather than by naming the bad member. The
delimiter test is the last place in that module where the complement is a silent success, and the
proposed fix should be pinned by a **property sweep over the complement**, not by two more rows. Likewise
CR-03 should be closed by *deriving* the plugin-skill set from the same authority and asserting its
count — not by adding one path to a literal — since a hand-added path is the same set-literal drift one
iteration later.

---

_Verified: 2026-08-02T02:00:00Z_
_Verifier: Claude (gsd-verifier), round 4_
_CR-01, CR-02, CR-03 and WR-02 were each reproduced in this pass against the committed `.js` — CR-02 and CR-03 end-to-end on hermetic trees, CR-02 with its readable control. WR-01 was verified by reading the four files and the regression case's loop bounds; its truncation element remains unreproduced and is flagged as such, as the round-4 review flagged it. All eight round-3 closures were confirmed by reading the code and re-running the round-3 reproductions, not by accepting a SUMMARY claim. The supplied ground truth (1015 tests, guards exit 0, 32 fresh `.js`, UAT 71/71) was accepted as given, not re-run, and is explicitly not treated as evidence of absence — it was green for every defect above._

// check-foundation-guards.ts — Phase 10 build gate (SDLC-02 / SC2).
//
// TypeScript port of check-foundation-guards.sh (Phase 15, TOOL-01). This is a TRANSLATION,
// not a redesign: every guard is ported 1:1 (these are tuned, not arbitrary). The pass/fail/warn
// exit spine (WARN never increments FAILS), the WR05 EREs (their SCAN set is now derived — Phase 27
// / KIT-02 — but bounded exactly as before, and renamed SPAWN_GRANT_SCAN), the
// guard_voice fence-strip + __UNCLOSED_CAVEMAN_FENCE__ sentinel + the 3 phrase-neutralizations,
// guard_caveman_preserved's >=2 `^You` OR >=1 idiom threshold, the per-role role_ceiling() byte
// table, the SEC_VOICE_FILES list, and CR-01 missing-file-fails-red are reproduced verbatim.
// (Phase 27 / KIT-01: ROLE_FILES is no longer one of those verbatim lists — it is DERIVED from
// scripts/kit-model.ts. The 17 members are unchanged; only their provenance is.) The awk fence machinery is translated to an equivalent TS line-state loop
// — SAME semantics; the anchor is NOT re-engineered (D-10 forward-compat).
//
// The six cross-cutting v1.2 foundation guards in ONE aggregator. Each guard fails red on a
// violation and NEVER fabricates a pass — the mechanical form of grugops's no-fabrication
// contract. It stands the guards up BEFORE any v1.2 content lands (Phases 11–17) so every later
// phase writes into a guarded environment.
//
//   guard_wr05         — frontmatter spawn-grant grep over the DERIVED SPAWN_GRANT_SCAN set: every
//                        materialized adapter (.claude/agents + .claude/skills) plus the packaging
//                        adapter-frontmatter templates (D-08/D-09). Two verified EREs (comma-form +
//                        YAML-array-item, incl. scoped `Agent(worker)`). Matches the
//                        frontmatter TOKEN only — NEVER the prose word "spawn"/"sub-agent".
//                        `adapters.md` is deliberately OUT of this scan set (D-09).
//   guard_agents_bytes — AGENTS.md byte budget, two-tier WARN 20480 / FAIL 28672 (D-07). FAIL
//                        is BELOW the 32768-byte Codex `project_doc_max_bytes` cap.
//   guard_adapter_size — per-adapter byte ceiling, two-tier WARN 3072 / FAIL 4096 (D-07).
//   guard_kit_counts   — Phase 27 (KIT-01): the derived role/workflow cardinalities must match the
//                        exported ROLE_COUNT / WORKFLOW_COUNT EXACTLY, in both directions (D-20).
//                        Tier 2 of D-21 — kit-model.ts throws on a vacuous set, this guard fails red
//                        on a wrong one. Reports both derived numbers on success.
//   guard_voice        — voice-discipline lint over ALL 17 role files (D-05). SECTION-scoped:
//                        reads the caveman fence through voice-model.readCavemanFence(), then greps
//                        the clear-voice remainder for CAVEMAN_LEXICON terms. Word-boundary matching
//                        (bare `grug` false-positives on `.grugops/`, D-10).
//   guard_caveman_voice — the POSITIVE INVERSE of guard_voice (D-06/D-07/D-08), rebuilt TWO-SIDED in
//                        Phase 29: the block must carry >= CAVEMAN_LEXICON_MIN lexicon terms AND zero
//                        banned constructions, and the PASS line carries the measurement.
//   guard_role_clause_uniqueness — Phase 29 (LANG-05, D-20/D-21/D-38): no normalized clause repeats
//                        within a single role file. Intra-file only, deliberately.
//   guard_role_size    — per-role byte ceiling, locked from the 2026-06-10 baseline (D-07).
//   guard_context_writes — Phase 20 (SCTX-05): greps shipped role + workflow text for a raw
//                        context-write TOKEN (writeFileSync/appendFileSync/the `Write` tool/a
//                        shell `>`/`>>`/`echo` redirect) co-occurring with the `.grugops/context/`
//                        path on the SAME line — a bypass of the sanctioned context-io.ts helpers.
//                        Fails RED on any hit. Bounded SCAN set, DERIVED (the 17 roles + 19
//                        workflows) — NEVER a repo-wide grep. Calibrated to a TOKEN, not "write":
//                        text that merely NAMES `context-io.ts` or the path in prose stays GREEN
//                        (mirror guard_wr05's token-vs-prose care, D-09; RESEARCH Assumption A3).
//
// Strictly READ-ONLY: reads files, never writes. Node stdlib ONLY — node:fs + node:path. Zero
// npm dependencies; runs with bare Node. import.meta.dirname resolves the repo root from this
// script's location, then every guard is run from that root (the .sh assumed `cwd == repo root`;
// the TS port resolves all paths against the script-relative root so cwd does not matter).
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/safety surface, never caveman voice).
//
//   node scripts/check-foundation-guards.js
// Exit 0 = every guard GREEN; exit 1 = at least one FAIL (WARNs do NOT fail the build).
//
// ---------------------------------------------------------------------------------------------
// (Plan 29-01) THIS GATE EXITS 1 ON THE TREE AT HEAD, ON PURPOSE, AND HERE IS WHAT THAT COST.
//
// guard_caveman_voice is RED on all 17 caveman blocks and guard_role_clause_uniqueness on 12 clause
// groups across 9 of 17 role files. Both transcripts are recorded verbatim above the guards
// themselves. Plans 29-05, 29-06 and 29-07 land the rewrites that turn both green; a red build
// before those land is the ACCEPTANCE EVIDENCE for Phase 28's D-24, not a regression.
//
// THE BLAST RADIUS IS MEASURED RATHER THAN ASSERTED. The committed gate was run against the tree at
// the parent commit (afea791) and at HEAD, and the two outputs were compared BLOCK BY BLOCK:
//
//   compared                                                        blocks  differences
//   --------------------------------------------------------------  ------  -----------
//   the nine guards this plan did not touch                              9            0
//   the three Phase 19 Tier-1 oracles                                    3            0
//   guard_voice — MIGRATED to readCavemanFence in this same plan          1            0
//   --------------------------------------------------------------  ------  -----------
//   TOTAL                                                               13            0
//
// The guard_voice row is the one that had to be measured rather than argued: swapping its fence
// reader is a behaviour-preserving change only if the two readers agree on every real role file, and
// a byte-identical output block over all 19 voice surfaces is what shows they do.
//
// Wall clock, three consecutive runs: 0.12 s / 0.09 s / 0.09 s, against the 0.127 s pre-plan baseline
// for 11 guards. Two more guards, both scanning prose with regular expressions, cost nothing
// measurable — which is the number to re-check first if a later prose guard turns a fast gate slow.
// No package.json script and no ci.yml line were added: CI already invokes this file bare, and a
// script for a guard that lives inside it would create a second invocation path.
// ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE SET-LITERAL INVENTORY, DISPOSITIONED (Phase 27 / KIT-02, D-19).
//
// The founding defect of this milestone was a hand-maintained set that rotted while the suite stayed
// green. Deleting one instance is worthless if the others survive unrecorded, so this is the
// committed record of what the phase's sweep found and what was done about it. It is
// deliberately PROSE, not a machine-checked detector: a grep-based stale-literal guard would be a
// heuristic capable of being a strict SUBSET of the real predicate — green while a literal it cannot
// parse rots on — which is the exact failure shape this milestone exists to close. A record a human
// reads is honest about being a record; a detector that misses is not.
//
// WHAT THIS RECORD CLAIMS, AND WHAT IT DOES NOT (plan 27-14, review finding WR-04). It records every
// enumerating literal the phase's sweep found in scripts/ and install/ — the tooling that decides KIT
// MEMBERSHIP, which is where the founding defect lived. That is the claim the rows below can
// actually support. It does NOT claim the repository holds no other enumerating literal: the sweep
// did not cover hooks/ (whose DEPLOY pattern list is a detection vocabulary, not a membership set)
// nor the shipped kit markdown, and a literal there is OUTSIDE this record rather than certified
// absent. The narrowing is deliberate. This record already failed once by claiming more than it
// held — WR-04 found it saying "EVERY" while omitting install.ts's RUNNABLES — and a record that
// overclaims is worse than no record, because it stops the next author looking. Scoping the claim
// tells that author exactly where the sweep ended and where their own has to begin.
//
// Entries 1-14 are those of 27-RESEARCH.md § "The Set-Literal Inventory, Corrected". Entry 15 was
// added in plan 27-13, for the omission WR-04 named. Entry 10 was RETIRED in plan 27-25 when the
// pair it recorded was collapsed into the single module entry 9 now names — fourteen live rows
// under fifteen numbers, which is the honest shape and is stated at the retired row rather than
// hidden by a renumber.
//
//   #   literal                  file                            disposition
//   ──  ───────────────────────  ──────────────────────────────  ────────────────────────────────────
//    1  the WR05-named scan set  check-foundation-guards.ts      DERIVED + RENAMED SPAWN_GRANT_SCAN
//                                                                (adapters ∪ packaging templates).
//                                                                Plan 27-03.
//    2  ADAPTERS                 check-foundation-guards.ts      DERIVED from .claude/agents +
//                                                                .claude/skills. 2 -> 8 today, 24
//                                                                after plan 27-07. Plan 27-03.
//    3  CTX_WORKFLOWS            check-foundation-guards.ts      DERIVED via listWorkflows(ROOT).
//                                                                16 of 19 -> 19. Plan 27-03.
//    4  ROLE_FILES               check-foundation-guards.ts      DERIVED via listRoles(ROOT).
//                                                                Plan 27-01.
//    5  WORKFLOWS                validate-agent-factory.ts       DERIVED (was 14, stale by 5; the
//                                                                entries are basenames WITHOUT .md).
//                                                                Plan 27-04.
//    6  ROLES                    validate-agent-factory.ts       DERIVED (was 16, missing
//                                                                frontend-ui). Plan 27-04.
//    7  SCAN                     check-kit-refs.ts               PARTIALLY derived — the file entry
//                                                                becomes a directory entry; the
//                                                                deliberately-omitted directories
//                                                                stay omitted. Plan 27-04.
//    8  GH_SCAN                  check-kit-refs.ts               Negative scan; scoped, not derived.
//                                                                Plan 27-04.
//    9  SKILLS / AGENT_REL       install/kit-source.ts           DERIVED via readdirSync self-
//        (formerly entries 9 AND    (imported by install/install.ts   derivation (D-18), and now
//         10, when this predicate    and install/uninstall.ts)        derived exactly ONCE. Plan
//         was answered in the                                         27-02 replaced the literals;
//         two installer files                                         plan 27-25 collapsed the two
//         separately)                                                 answers into one. THE PAIR
//                                                                    THIS RECORD USED TO DECLARE IS
//                                                                    GONE. Deriving the set in
//                                                                    two hand-synced files did not
//                                                                    delete the drift class, it
//                                                                    moved it up one level: the
//                                                                    pair drifted TWICE inside
//                                                                    phase 27. Round 1 re-synced
//                                                                    it; plan 27-22 then moved
//                                                                    install.ts onto statSync for
//                                                                    WR-02 and left uninstall.ts on
//                                                                    Dirent flags. A Dirent for a
//                                                                    symlink is NEITHER isFile()
//                                                                    NOR isDirectory(), so a
//                                                                    symlinked source adapter
//                                                                    installed and never uninstalled
//                                                                    — `== uninstall complete ==`,
//                                                                    exit 0, file still in the
//                                                                    target (CR-02), against the
//                                                                    CLAUDE.md reversibility
//                                                                    constraint. D-28 amends D-18:
//                                                                    the derivation moved into ONE
//                                                                    shared module inside install/
//                                                                    and both installers import it,
//                                                                    so the removal set and the
//                                                                    install set are literally the
//                                                                    same derivation and the
//                                                                    reversal cannot be narrower
//                                                                    than the install. It still
//                                                                    does NOT import
//                                                                    scripts/kit-model.ts — D-18's
//                                                                    rationale is decoupling the
//                                                                    installer from the scripts/
//                                                                    layout, which a shared file
//                                                                    INSIDE install/ preserves in
//                                                                    full. Re-inlining a copy into
//                                                                    either installer, on the
//                                                                    argument that it is small,
//                                                                    restores the defect. Contrast
//                                                                    entry 15, which stays a PAIR
//                                                                    deliberately and for a
//                                                                    different reason. Plan 27-25.
//   10  — RETIRED —              (was install/uninstall.ts)      MERGED INTO ENTRY 9 by plan 27-25.
//                                                                This row existed only because the
//                                                                derivation existed twice; there is
//                                                                no second literal left to
//                                                                disposition. The NUMBER is retired
//                                                                rather than reused, and entries
//                                                                11-15 keep their numbers, because
//                                                                those numbers are cited by name
//                                                                elsewhere in the tree (entry 15 in
//                                                                install/install.test.ts, entry 14
//                                                                in the phase plans) and silently
//                                                                shifting them would make those
//                                                                citations point at the wrong row.
//   11  MARKER_SITES             check-kit-refs.ts               DERIVED — the literal the CONTEXT.md
//                                                                inventory MISSED; must grow 4 -> 19+
//                                                                under D-06/D-08. Plan 27-04.
//   12  ASYM_TABLE_FILES         check-uat-oracles.ts            NOT a kit set. Left alone; SPAWN-07
//                                                                edits both files it guards.
//   13  the WR05-named constant  check-uat-oracles.ts            LEFT ALONE DELIBERATELY. Same
//        (second, unrelated)                                     identifier as #1's FORMER name,
//                                                                entirely unrelated meaning: four
//                                                                .planning/ tracking documents for a
//                                                                green Tier-1 oracle. Nothing to
//                                                                derive it from; deriving it from
//                                                                kit-model would be nonsense. The
//                                                                collision was resolved by renaming
//                                                                #1, not by touching this.
//   14  roleCeiling()            check-foundation-guards.ts      LEFT ALONE DELIBERATELY (D-17). A
//                                                                per-file MEASUREMENT BASELINE, not a
//                                                                discovery set, and it already fails
//                                                                closed on an unknown role.
//   15  RUNNABLES /              install/install.ts +            LEFT ALONE DELIBERATELY, and now
//        RUNNABLES_MIRROR        install/uninstall.ts            PAIRED. A source->dest MAPPING, not
//                                                                a discovery set: there is nothing to
//                                                                derive it FROM, because the host
//                                                                path a runnable lands at is a
//                                                                grugops convention rather than a
//                                                                filesystem fact. The real defect
//                                                                (WR-04) was not that it is a
//                                                                literal — it is that it existed on
//                                                                the INSTALL side only, so the files
//                                                                were installed and never removable.
//                                                                Plan 27-13 added the mirroring
//                                                                removal pass; the two literals are
//                                                                byte-identical and each names the
//                                                                other in a comment. Adding an entry
//                                                                to one without the other is the
//                                                                failure mode to watch for.
//
// Proof that no stale literal survived is per-consumer, not global: each re-pointed set carries a
// case in check-foundation-guards.test.ts that plants a NEW file into a hermetic mirror and asserts
// the guard notices it. A re-listed array wearing a new name cannot pass those.
// ---------------------------------------------------------------------------
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
// Phase 19 (UAT-AUTO-05 / BLOCKER 1 / LOCKED CONTEXT.md decision / ROADMAP SC3): the run-all block
// invokes the three Tier-1 auto-UAT oracles so this aggregator fails closed when any one fails. The
// oracle BODIES live single-source in check-uat-oracles.ts — here we only INVOKE them and fold their
// accumulated fail count into FAILS. The oracle module honors the SAME CHECK_ROOT override, so the
// fail-proof harness's hermetic mirror plant exercises them through this aggregator too.
import { oracleWr05Wording, oracleHooksWiring, oracleDualPathEquivalence, uatOracleFails, } from "./check-uat-oracles.js";
// Phase 27 (KIT-01): the role and workflow sets are DERIVED, never hand-listed. kit-model.ts is the
// single authority; this file is one of its consumers. The kit root is passed EXPLICITLY (D-22) so
// kit-model never re-resolves a root of its own and CHECK_ROOT stays the only override this gate
// honors.
import { listRoles, listWorkflows, listRoleDisplayNames, listWorkflowDisplayNames, listAgentAdapters, listSkillAdapters, listPluginSkillAdapters, listPluginDefaultComponentFiles, listPluginExemptComponentFiles, pluginForbiddenComponentKeys, partitionPluginComponentClaims, spawnGrantScan, spawnGrantScanPrefix, SPAWN_GRANT_SCAN_PARTS, PLUGIN_MANIFEST_COMPONENT_SCHEMA, PLUGIN_MANIFEST_COMPONENT_COUNT, PLUGIN_COMPONENT_COVERED_ELSEWHERE, PLUGIN_COMPONENT_COVERED_ELSEWHERE_COUNT, PLUGIN_COMPONENT_EXEMPT_COUNT, PLUGIN_COMPONENT_EXEMPT, ROLE_COUNT, WORKFLOW_COUNT, SKILL_ADAPTER_COUNT, PLUGIN_SKILL_ADAPTER_COUNT, SPAWN_GRANT_SCAN_COUNT, } from "./kit-model.js";
// Phase 27 (SPAWN-05 / D-24): the retired-vocabulary literals are single-source. guard_adapter_body
// below takes the PROSE forms; check-kit-refs Assertion 2 takes the PATH form. Two genuinely
// different predicates over different inputs — one list, never two.
import { RETIRED_PROSE_FORMS } from "./dead-vocabulary.js";
// Phase 27 (D-64 Part A, plan 27-65): stripFencedBlocks is the ONE fence authority and travels with
// every consumer, so the tree keeps exactly one definition of where a frontmatter region begins.
//
// IT IS NOW THE ONLY THING THIS GUARD TAKES FROM THAT MODULE. The grant predicates, the coordinator
// marker read and the parse entry point moved to ./canonical-frontmatter.js below. A fence is not a
// verdict; the demotion is about who renders the verdict, not about who finds the region.
import { stripFencedBlocks } from "./frontmatter.js";
// Phase 29 (LANG-05/06/07, D-22/D-23/D-24/D-38, plan 29-01): THE VOICE AUTHORITY.
//
// This file declares NO voice literal and NO fence state machine of its own, and it must never start
// again. It used to carry BOTH — `stripCavemanBlock`, `extractCavemanBlock` and a `VOICE_MARKERS`
// regex — and the two fence machines disagreed on two of the three malformed forms over identical
// bytes (29-RESEARCH §A-6). One reader, one lexicon, two consumers.
import { readCavemanFence, CAVEMAN_LEXICON, CAVEMAN_LEXICON_MIN, countLexiconTokens, countBannedConstructions, countContentWords, segmentClauses, } from "./voice-model.js";
// Phase 29 (AP-1, D-08, plan 29-01): the ONE element-level vacuity rule. Every new guard below folds
// its result through `reportMeasured`, which emits through `fail` and refuses to print a PASS line
// for a check that visited zero elements or a scan set that came up short.
import { reportMeasured } from "./vacuity.js";
// Phase 27 (SPAWN-04 / KIT-03, D-64 Part A, plan 27-65): THE MODULE THAT RENDERS THE SPAWN VERDICT.
//
// WHAT CHANGED, AND WHY IT IS STRUCTURAL RATHER THAN A TWELFTH REPAIR. Plan 27-12 made
// scripts/frontmatter.ts the one authority for "what does this file's frontmatter say", replacing a
// pair of line-anchored regular expressions that could not see a folded scalar. That was correct and
// it closed the bypass in front of it — but eleven consecutive review rounds then found an twelfth
// spelling, a thirteenth, and rounds 10 and 11 each shipped a regression INSIDE their own fix. The
// defect was never any single spelling. It was that an open YAML-ish grammar has a THIRD outcome the
// type system does not show: "parsed fine, carries no grant", reachable by any construct the grammar
// does not model. A guard cannot enumerate the constructs it has not thought of.
//
// So the verdict is no longer computed by interpreting a document. `admit()` ADMITS a restricted
// canonical shape and REFUSES every other byte under one of 23 enumerated codes, with no catch-all
// and no default branch. There are exactly two outcomes and no third: "canonical, here are the
// values", or "not canonical, and here is the named reason". The silent-no-grant arm does not exist
// on this path — not because a predicate now looks for it, but because there is nowhere for it to be.
//
// A REFUSAL IS A NAMED GATE FAILURE AT EVERY CALL SITE BELOW, never "carries no grant". That is the
// founding failure mode of the thing this replaces, and the hand-written parse-failure branch
// guard_wr05 already carried is the precedent — its wording is kept and now covers the whole refusal
// vocabulary instead of one parse failure.
import { admit, admittedHasSpawnGrant, admittedGrantedNames, admittedValuesFor, admittedKeyHasValue, 
// (Plan 27-20 / 27-REVIEW § WR-05, re-pointed by 27-65) The two key names that grant a tool.
// IMPORTED, never restated: the tools-key floor in guardWr05() asks "is a tool allow-list DECLARED
// at all", and that question must be scoped by the same list the grant test reads, or the floor
// could pass a file whose grant the grant test never looks at. It now comes from the canonical
// module so the floor and the grant test are scoped by ONE list on ONE side of the cutover.
GRANT_KEYS, } from "./canonical-frontmatter.js";
// The .sh hard-coded repo-relative paths and assumed cwd == repo root. The TS port resolves
// every path against the script-relative repo root, but ALSO honors a CHECK_ROOT override so the
// Vitest harness can point the guard at a hermetic mirror dir (mirrors how the .test.sh harness
// runs the guard FROM inside the mirror so its relative paths resolve to the mutated copy).
const ROOT = process.env.CHECK_ROOT
    ? process.env.CHECK_ROOT
    : join(import.meta.dirname, "..");
const abs = (rel) => join(ROOT, rel);
const fileExists = (rel) => existsSync(abs(rel));
const byteLen = (rel) => statSync(abs(rel)).size;
const readText = (rel) => readFileSync(abs(rel), "utf8");
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
};
// warn() is advisory only — it does NOT increment FAILS (the two size guards are two-tier
// WARN→FAIL per D-07; a WARN is the "approaching the cap" early signal, not a build break).
const warn = (m) => {
    process.stdout.write(`  WARN  ${m}\n`);
};
// grep -rnE over an explicit file list: return the `path:lineno:line` hits (1-based line
// numbers, mirroring `grep -n`). Missing files are silently skipped (mirrors `2>/dev/null`).
function grepFiles(files, re) {
    const hits = [];
    for (const rel of files) {
        if (!fileExists(rel))
            continue;
        const lines = readText(rel).split("\n");
        for (let i = 0; i < lines.length; i++) {
            if (re.test(lines[i]))
                hits.push(`${rel}:${i + 1}:${lines[i]}`);
        }
    }
    return hits;
}
// ---------------------------------------------------------------------------
// The adapter corpus, DERIVED (Phase 27 / KIT-02, D-16).
//
// THREE guards read this: guard_adapter_size (byte ceilings), guard_wr05 via SPAWN_GRANT_SCAN
// (spawn-grant enforcement) and guard_referential_integrity (the KIT-03 set equality). It is
// declared ONCE here, ahead of all three, because the adapter directory is a single fact and three
// hand-listed answers to it is precisely the drift class this milestone deletes.
//
// Derivation is still a BOUNDED scan: two fixed literal directories, one shape rule each, never a
// repo-wide walk. Both parts are sorted, so guard output for a given tree is byte-identical across
// runs and platforms regardless of readdirSync order.
//
// (Plan 27-10, KIT-02) The AGENT half is no longer derived here at all. This file's own
// non-recursive read of `.claude/agents` was DELETED — not taught to recurse — and replaced by
// kit-model.listAgentAdapters(), which is now the single answer to "what is an agent adapter".
// The deleted read could not see a file at `.claude/agents/<subdir>/<x>.md`, which Claude Code
// LOADS (it discovers the directory recursively and takes identity only from frontmatter). A live
// coordinator planted there was reproduced passing this entire gate. One format-aware authority per
// predicate, and the duplicate grammar deleted rather than corrected in place.
// ---------------------------------------------------------------------------
// Fixed literal subpaths joined onto the already-resolved ROOT — never argv/env/content-derived
// (ASVS V12, mirrors kit-model.ts's path-traversal posture).
const ADAPTER_DIR = ".claude/agents";
const SKILL_DIR = ".claude/skills";
// The exact expected skill cardinality now lives beside the role and workflow cardinalities in
// kit-model.ts (plan 27-10) — the same fact had a second home here, which is the drift class this
// milestone deletes even when the fact is only a number. The reasoning travelled with it: a count is
// not that drift class (a count can only ever fail closed), and the skill half needs one because the
// KIT-03 oracle has no role corpus to compare a skill against. It is still enforced in exactly one
// place, guardKitCounts() below.
// (Plan 27-33) THE LOCAL PACKAGING READ IS DELETED, NOT KEPT AS A SECOND OPINION. It used to be a
// flat `readdirSync` here that returned [] on an unreadable directory, feeding a packaging-template
// shape rule declared locally and composed locally into this file's own spawn-grant scan. That
// composition is now the ONE exported `spawnGrantScan()` in kit-model.ts, which the false-red control
// in scripts/frontmatter.test.ts also consumes — one predicate, one place. A weaker duplicate that
// still votes is worse than none, which this file's own guard_wr05 header already argues at length.
//
// The empty-on-unreadable behavior travelled too, and it is load-bearing: the relocated lister goes
// through kit-model's `refuseEmpty` and THROWS (D-21 tier 1), so its call site below goes through
// `derive()` exactly as the agent and skill derivations do. The wrapper records the thrown message and
// the run continues with an EMPTY list that the count floor then NAMES. A call site NOT wrapped in
// `derive()` would convert a named red into an unhandled exception — fail-closed in direction, but it
// would print one line and silently skip six unrelated guards, which is the discipline argued below.
// The adapter corpus, from the ONE authority (kit-model.ts). It returns forward-slash paths relative
// to each adapter directory; the fixed subpath is prefixed back on here to restore the repo-relative
// shape the consuming guards expect. AGENT_ADAPTER_RELS keeps the un-prefixed form, because the
// flatness check below and the KIT-03 oracle both compare relative paths.
//
// The authority THROWS (D-21 tier 1) when a directory is unreadable, empty, or filtered to empty.
// This gate does NOT abort on that: it records the thrown message and continues with an EMPTY member
// list, so guard_adapter_size's non-empty floor, guardKitCounts' skill cardinality and the KIT-03
// oracle's zero-adapter branch all fire and NAME the condition. Aborting here would print one line
// and silently skip six unrelated guards.
function derive(list) {
    try {
        return { files: list(), error: "" };
    }
    catch (e) {
        return { files: [], error: e.message };
    }
}
const AGENT_DERIVATION = derive(() => listAgentAdapters(ROOT));
const SKILL_DERIVATION = derive(() => listSkillAdapters(ROOT));
const AGENT_ADAPTER_RELS = AGENT_DERIVATION.files;
const SKILL_ADAPTER_RELS = SKILL_DERIVATION.files;
const ADAPTER_DERIVATION_ERRORS = [
    AGENT_DERIVATION.error,
    SKILL_DERIVATION.error,
].filter((m) => m !== "");
const AGENT_ADAPTERS = AGENT_ADAPTER_RELS.map((rel) => `${ADAPTER_DIR}/${rel}`);
const SKILL_ADAPTERS = SKILL_ADAPTER_RELS.map((rel) => `${SKILL_DIR}/${rel}`);
const ADAPTERS = [...AGENT_ADAPTERS, ...SKILL_ADAPTERS];
// (Plan 27-34) THE PLUGIN-FORM SKILL LIST — A SECOND CALL SITE OF ONE AUTHORITY, NEVER A SECOND SCAN
// COMPOSITION. It is derived here for exactly two consumers: the CARDINALITY floor in
// guardKitCounts() and the PAIR RULE in guardDistributionPair(). The SCAN widened inside
// kit-model.spawnGrantScan() itself, so the guard and the false-red control in
// scripts/frontmatter.test.ts cannot answer "what is scanned" differently — splicing the plugin tree
// into a composition local to THIS file would have left that control vouching for a strict subset,
// which is the hole plan 27-33 closed by relocating the composition.
//
// It is DELIBERATELY NOT ADDED TO `ADAPTERS` above. That list feeds guard_adapter_size's byte ceilings
// and the KIT-03 role-corpus equality, and both ask a different question: `ADAPTERS` is an AGENT
// IDENTITY corpus (one adapter per role, one grant closure), while the plugin tree is a DISTRIBUTION
// MIRROR of the standalone skills with no role behind it. Folding it in would break a currently-clean
// requirement — KIT-03 would compare 17 roles against 31 members — and the byte ceilings would start
// reporting the same skill twice. The scoping is recorded here rather than left as an accident of
// where the constant was spliced.
//
// Goes through the SAME `derive()` wrapper as its siblings: kit-model throws (D-21 tier 1) on an
// absent, unreadable or filtered-empty plugin skills directory, and the wrapper records the message so
// the count floor NAMES the condition instead of the gate dying on an unhandled exception and silently
// skipping every guard after it.
const PLUGIN_SKILL_DERIVATION = derive(() => listPluginSkillAdapters(ROOT));
const PLUGIN_SKILL_RELS = PLUGIN_SKILL_DERIVATION.files;
// ---------------------------------------------------------------------------
// guard_wr05 — both-direction coordinator-spawn-grant enforcement (Phase 23, D-15/D-16).
//
// INVERTED (Phase 23 WR-05 flip): the guard no longer forbids the spawn grant outright. Claude
// Code parallelism is now enabled for ONE designated coordinator. The guard asserts BOTH directions
// over the explicit SCAN set:
//   • the coordinator (identified by its `coordinator: true` frontmatter MARKER, NEVER a hard-coded
//     filename — D-15) MUST carry the spawn grant; a dropped grant silently kills CC parallelism;
//   • every NON-coordinator SCAN file MUST NOT carry the grant; a planted grant is a rogue spawner.
// Detection is the marker only (D-15). A removed marker demotes the file to non-coordinator, so an
// orchestrator that loses its marker but keeps its grant fails the non-coordinator direction — a
// rename/marker-loss can never silently downgrade the coordinator.
//
// HOW THE GRANT AND THE MARKER ARE READ (Phase 27 / SPAWN-04, plan 27-12 — REWRITTEN, because what
// this paragraph used to claim was false).
//
// It used to say two line-anchored EREs "catch every form": a comma list requiring the key and the
// token on ONE physical line, and a YAML array item requiring a leading dash. They do not. A valid
// YAML folded scalar puts the fold indicator on the key line and the value on an indented
// continuation line that begins with neither:
//
//     tools: >-
//       Read, Grep, Glob, Edit, Write, Bash, Agent(grugops-installer, grugops-security-nfr)
//
// That shape was REPRODUCED passing this entire gate, twice, on hermetic mirrors — once on a
// non-coordinator role adapter and once on a skill file (27-REVIEW § CR-02). The same file already
// read a whitespace-collapsed body for its prose checks precisely so a hard wrap could not change a
// verdict; the grant half stayed line-anchored, and that asymmetry WAS the bypass.
//
// Both predicates now read a RECONSTRUCTED frontmatter value through scripts/frontmatter.ts, so
// wrapping, folding, literal blocks, chomping, quoting, flow sequences and block sequences cannot
// change the verdict — they do not change the VALUE, and the value is what the platform grants on.
// The two line-anchored grant expressions and the line-anchored marker expression are DELETED, not
// kept as a second opinion: two grammars for one predicate is the defect being closed, and a weaker
// duplicate that still votes is worse than none.
//
// A PARSE FAILURE IS ITS OWN FINDING. The parser returns a discriminated result, and the loop below
// branches on the failure arm EXPLICITLY rather than letting it fall through to "carries no grant".
// The fall-through is precisely the bug; writing the branch by hand is what keeps it from coming
// back.
//
// ONE DELIBERATE NARROWING, RECORDED. The old array expression matched a dashed line ANYWHERE in the
// file, so a body bullet merely naming the spawn tool would have failed the guard, and the old comma
// expression matched a `tools:` line anywhere in the body. Reading the grant from the FRONTMATTER
// BLOCK removes both false positives: a grant is a frontmatter fact about the `tools` /
// `allowed-tools` key, and prose that names the tool is documentation. Three harness cases pinned
// the old body-anywhere behavior by appending their plant to the END of a scan file; they now plant
// into the frontmatter block and say why in the case.
//
// (Phase 27 / KIT-02) The SCAN set is DERIVED and RENAMED. It was a four-file hand list carrying the
// same WR-05-derived identifier that ALSO exists, meaning something entirely different, in
// scripts/check-uat-oracles.ts (four `.planning/` tracking documents for a separate, currently-green
// Tier-1 oracle that this aggregator imports). Two unrelated constants sharing one identifier across
// two files that import each other is a rename accident waiting to compile, so the guards-side one is
// now `SPAWN_GRANT_SCAN` and that identifier now lives in exactly one file. The oracle module's
// constant is deliberately untouched: it is a curated document list with nothing to derive it from,
// and deriving it from kit-model would be nonsense.
//
// Membership derives from the adapter corpus above plus the packaging templates that carry adapter
// FRONTMATTER (`*.frontmatter.md` / `*.template.md`). The exclusion discipline survives verbatim:
// this stays a BOUNDED set of adapter and packaging surfaces and NEVER becomes a repo-wide grep, and
// `agent-factory/packaging/adapters.md` remains OUT of it (D-09) — now excluded BY THE SHAPE RULE
// rather than by omission from a list, so it cannot silently drift back in.
//
// Widening from four files to the ten present today is the point: the seven skill adapters were
// never checked for a rogue spawn grant. Once plan 27-07 lands the 17 agent adapters, all of them
// enter this scan on the same run, with no edit here.
//
// (PLAN 27-34) THE PLUGIN-FORM SKILL TREE IS AN INCLUSION, AND THE COMMENT MUST SAY SO RATHER THAN
// ONLY ARGUE THE EXCLUSIONS. `skills/<n>/SKILL.md` at the repository root is a REAL, PLATFORM-LOADED
// distribution surface: `.claude-plugin/plugin.json` declares no component-path override and the
// marketplace entry sources the repository root, so Claude Code's default discovery loads all seven of
// those files for every `/plugin install` user. Until this plan they were outside EVERY scan set in
// the repository — this guard's, adapters-freshness.ts's, and generate-role-adapters.ts's alike —
// while the pass line below asserted "no non-coordinator holds the spawn grant" over them. A grant
// planted on `skills/plan/SKILL.md` was reproduced printing ALL CHECKS PASSED at exit 0. They are now
// members of the one composition, so the claim and the input finally agree.
//
// AND THEY ARE DELIBERATELY NOT IN `ADAPTERS`. That list feeds the byte ceilings and the KIT-03
// role-corpus equality; those ask about AGENT IDENTITY, and a distribution mirror of the standalone
// skills has no role behind it. See the note at PLUGIN_SKILL_DERIVATION above.
// ---------------------------------------------------------------------------
// D-15 marker: the coordinator key set to true, read through the SAME parser as the grant so a
// marker in an unusual but valid scalar form can neither demote the real coordinator nor promote a
// rogue file out of the must-not-spawn set. This is still the ONLY way the guard identifies the
// coordinator — never a filename.
const COORDINATOR_KEY = "coordinator";
const COORDINATOR_VALUE = "true";
// (Plan 27-33) THE SCAN IS THE ONE EXPORTED COMPOSITION, read through `derive()` like its siblings.
// The packaging directory literal, its shape rule and the composition itself all moved to
// kit-model.ts; nothing here restates any of them. The false-red control in
// scripts/frontmatter.test.ts consumes THE SAME function, so the guard and the control cannot answer
// "what is scanned" differently — and because it is one object, set equality between them is a
// tautology rather than a check. What catches a part dropped in the move is SPAWN_GRANT_SCAN_COUNT
// plus the per-part membership assertion in guardKitCounts() below.
const SPAWN_SCAN_DERIVATION = derive(() => spawnGrantScan(ROOT));
const SPAWN_GRANT_SCAN = SPAWN_SCAN_DERIVATION.files;
// The packaging half of the scan, for the WR-05 pass line's reported count. Derived by PARTITIONING
// the one composition on the same prefix the composition was built from — never by a second read.
const PACKAGING_TEMPLATES = SPAWN_GRANT_SCAN.filter((f) => f.startsWith(spawnGrantScanPrefix("packaging")));
// (Plan 27-12) stripFencedBlocks MOVED to scripts/frontmatter.ts and is imported at the top of this
// file. It is the ONE implementation of the GENERAL question "which lines of a document are inside a
// ``` block", every prose check below reads its output, and this file adds no second answer to THAT
// question; it simply lives beside the frontmatter parser that also needs a fence-safe input, rather
// than being duplicated there. Behavior is unchanged, including its fail-safe treatment of an
// unterminated fence, so every prose check below reads the same body it read before.
//
// (Plan 27-53, D-53 — round 9 § WR-02) THE TREE-WIDE VERSION OF THAT SENTENCE WAS FALSE AND IS GONE.
// It used to claim a uniqueness across the whole repository, which this file itself contradicted: it
// carried two more fence state machines — `stripCavemanBlock` and the caveman-block extractor — each
// running its own delimiter recogniser and its own counter. They were kept out of the general claim
// by being GATED on a `## Caveman prompt` heading, asserted mechanically rather than argued. But the
// old sentence claimed a scope it never held, and a claim wider than its pin is the set-literal-drift
// class this phase exists to delete.
//
// (Plan 29-01, LANG-07 / D-22) AND THIS FILE NOW CARRIES NO FENCE STATE MACHINE AT ALL. Both caveman
// scopers were DELETED, not corrected in place: they disagreed with each other on two of the three
// malformed fence forms over identical bytes, and one authority per predicate means the duplicate
// goes rather than gains a third arm. The caveman-fence question is answered once, in
// scripts/voice-model.ts, which composes this module's `FENCE_DELIMITER_LINE` and declares no state
// machine of its own. The real scope stays DERIVED and COUNTED: the case "the set of tracked `.ts`
// files carrying a FENCE STATE MACHINE is derived, sorted and pinned at exactly the named members"
// in scripts/frontmatter.test.ts enumerates every tracked `.ts` by pattern and pins the cardinality,
// which fell from 4 to 3 with this file's departure. A new one fails it by name.
// Collapse every run of whitespace — including newlines — to a single space. Applied AFTER
// stripFencedBlocks() so the prose checks below read a body the way a human reads it, not the way
// an author happened to hard-wrap it. This is a normalization, NOT a second parser: the fence
// authority is still the single stripFencedBlocks(), and this never sees a fenced line.
//
// Why it is needed: the packaging template and the generated adapter bodies hard-wrap at ~95
// columns, so a required sentence routinely spans a line break. A line-anchored substring check
// would then fail red on correct text purely because of where the wrap landed, and would go green
// again if an author re-wrapped it — a guard whose verdict depends on line breaks is a guard that
// teaches people to reformat rather than to fix. Collapsing also closes the "retired phrase split
// across a line break" evasion on the negative half.
const collapseWhitespace = (s) => s.replace(/\s+/g, " ");
// (Plan 27-20 / 27-REVIEW § CR-03) stripHtmlComments and countOccurrences are declared HERE, beside
// the fence authority and the whitespace normalization, because they are SHARED: guard_wr05's
// tier-beat check and guard_adapter_body's positive half ask the SAME question of the SAME
// coordinator body — "does this live text state this sentence, and how many times" — and they now
// read it through one composition. They used to live 260 lines down, next to guard_adapter_body,
// with a comment saying the strip applied to that positive half only; that placement is what made it
// natural for the sibling check inside the same aggregator to be written as a bare `.includes()`
// over a body that was never comment-stripped and never counted. One predicate, one treatment: the
// helpers sit where the shared normalizations sit, not beside one of their two callers.
//
// Why a comment must be stripped before either predicate reads the body: a comment quoting an
// announcement is not an announcement. Commented-out bytes are invisible to the agent that loads the
// file, so text surviving only inside `<!-- -->` cannot satisfy a claim about what the body says —
// and a guard that counts it is asserting a capability-and-safety disclosure the reader will never
// see (T-27-34, the spoofing threat this guard names at its own tier-beat header).
//
// This is NOT a second fence implementation: it removes a different construct (`<!-- -->`) and it
// COMPOSES with the one stripFencedBlocks() authority instead of duplicating it. It is applied to
// the POSITIVE/presence direction of both callers only — a retired phrase quoted inside a comment
// must still fail guard_adapter_body's NEGATIVE half, because no adapter or template may carry a
// comment or parenthetical quoting dead vocabulary.
//
// FAIL-SAFE ON AN UNTERMINATED COMMENT (plan 27-20 self-review, probe E). An `<!--` with no closing
// `-->` used to strip NOTHING, so every beat and every memory sentence after it counted as live and
// the guard passed — while a reader of the rendered markdown sees an HTML block swallowing the rest
// of the document. That is the guard claiming an announcement nobody can read, which is the exact
// failure CR-03 named. The treatment is taken from this tree's own settled precedent rather than
// invented: stripFencedBlocks() states that an unterminated fence leaves the tail INSIDE and never
// emits it, "a malformed doc can never leak an unguarded live grant past the strip". One rule for
// both strippers — an unterminated construct extends to EOF — so a malformed comment fails CLOSED.
//
// ---------------------------------------------------------------------------------------------
// (Plan 28-04 / D-16) THE ONE CLASS OF HTML COMMENT IN THIS REPOSITORY THAT CARRIES MEANING.
//
// WHAT THIS HELPER IS FOR, restated in one line so the rest of this note has a reference point: a
// commented-out copy of a required or forbidden string must not stand in for LIVE text in
// guardAdapterBody or in guard_wr05's tier-beat check. Every HTML comment those predicates meet is
// text hiding from a reader, and removing it is the whole point.
//
// AS OF THIS PHASE THAT IS NO LONGER TRUE OF EVERY HTML COMMENT HERE. AUDIT-03 put
// `<!-- claim: C-28-NNN -->` anchors into README.md, AGENTS.md and agent-factory/README.md. Those
// anchors do not HIDE text; they NAME the line beneath them, and scripts/check-claim-anchors.js
// reads them as its entire input. They are the first HTML comments in this repository that must
// NOT be stripped.
//
// THE TWO ARE NOT IN CONFLICT TODAY, and the reason is MEMBERSHIP, not luck: none of those three
// documents is a member of any scan this helper feeds. guardAdapterBody reads spawnGrantScan()
// (.claude/agents, .claude/skills, skills, agent-factory/packaging) plus the packaging template;
// guard_wr05's tier-beat check reads the coordinator adapter body. A case in
// scripts/check-claim-anchors.test.ts asserts that absence directly, rather than leaving it to be
// re-derived by a reader who would have to know to look.
//
// WHAT A FUTURE EDITOR MUST CHECK BEFORE WIDENING ANY stripHtmlComments CONSUMER'S SCAN SET TO
// INCLUDE A PUBLIC DOCUMENT. Adding one of the three anchored documents to a scan that flows
// through this helper is HARMLESS to that consumer — the anchors simply become invisible to it,
// which is the correct treatment, because an anchor is not an announcement. What must NEVER happen
// is the reverse direction: this helper, or any other normalizing transform, being introduced into
// the ANCHOR gate's own read path. Stripping there would delete that gate's entire input, and it
// would then pass green over a document with no anchors left in it — a fail-open wearing the shape
// of a clean run. The anchor gate therefore reads RAW BYTES, and says so in its own header.
// ---------------------------------------------------------------------------------------------
const stripHtmlComments = (s) => {
    const closed = s.replace(/<!--[\s\S]*?-->/g, " ");
    const dangling = closed.indexOf("<!--");
    return dangling === -1 ? closed : `${closed.slice(0, dangling)} `;
};
// Non-overlapping occurrence count. Deliberately not a regex: the forms contain backticks, an em
// dash and punctuation, and escaping them into a pattern would be a second grammar over the same
// literal.
function countOccurrences(hay, needle) {
    let n = 0;
    let i = hay.indexOf(needle);
    while (i !== -1) {
        n += 1;
        i = hay.indexOf(needle, i + needle.length);
    }
    return n;
}
// (Plan 27-12) matchesOutsideFences() is DELETED. Its only two callers were the spawn-grant test and
// the coordinator-marker test, and both now read a reconstructed frontmatter VALUE rather than
// applying a line-anchored expression to a body. Keeping the helper around for a predicate nobody
// asks it any more is how a second grammar survives a fix.
// ---------------------------------------------------------------------------
// TIER-ANNOUNCEMENT BEATS (Phase 27 / SPAWN-04+SPAWN-05, the REVISED D-05).
//
// D-05 originally asserted DEGRADE-PATH presence. Under the revised D-02 that would guard for text
// which must no longer be the contract: Claude Code now has three tiers, and the degrade path is
// only the third of them. The assertion is therefore TIER-ANNOUNCEMENT PRESENCE — the coordinator
// body carries all three tier labels, the sentence disclosing that the enumerated grant is NOT
// runtime-enforced on the reduced path, and the sentence naming the availability of the spawn tool
// as the signal that selects between them.
//
// Why these beats and not fewer: a coordinator that drops a tier OVERSTATES its enforcement, which is
// the spoofing threat this phase names (T-27-34). Claiming an enforcement you lack is worse than
// having no announcement at all, because a user reading it cannot tell what is actually enforced.
//
// THE SIXTH BEAT — THE COMMAND NAME — AND WHY IT WAS ADDED LATE (plan 27-15, 27-REVIEW § WR-03).
// The five beats above pin the tier LABELS and the two sentences around them. Plan 27-09 shipped its
// announcement claiming "one vocabulary across two surfaces", and the labels did agree — so the claim
// looked checked. The COMMAND NAME inside the reduced-tier line was never compared, and it said
// `/grug`, which no install form ships: the standalone entry is `.claude/skills/grugops` (so
// `/grugops`) and the plugin form namespaces with a colon (`/grugops:plan`). A capability-and-safety
// announcement is the worst place for that, because a reader being told what a tier gets cannot map
// it onto anything they can type. This beat closes the gap between what was PINNED and what was
// CLAIMED, and it is deliberately a beat rather than prose: prose is what failed.
//
// NO OTHER GUARD IN THIS TREE CAN SEE THIS DIFFERENCE. guardVoice() runs neutralizePhrases() over
// every clear-voice surface, and its first substitution rewrites `/grug` to the marker-free filler
// `BRANDCMD` BEFORE any inspection happens — so the command token is invisible to the voice guard by
// construction. guard_adapter_body's negative half only knows retired memory-relay vocabulary, and a
// wrong command name is not in that vocabulary. Nothing else reads this sentence at all.
//
// These beats stay LOCAL to this guard rather than being exported. They have exactly one consumer,
// and a shared module with one consumer is a second authority with nothing to justify it. (Contrast
// scripts/dead-vocabulary.ts, which has two genuinely different consumers and so earns the module.)
//
// NO SETTINGS-FILE ASSERTION IS MADE, AND A LATER PHASE MUST NOT ADD ONE. Under D-01 the installer
// writes no main-thread wiring — no `.claude/settings.json` agent entry — into a user's repository,
// because doing so would make every Claude session in that repo the grugops coordinator. There is
// therefore nothing in a target repo for such an assertion to key on. Both mechanisms this guard
// DOES assert — the enumerated grant and the tier announcement — hold on the sub-agent path and the
// main-thread path alike, which is what makes the guard meaningful without a wiring artifact.
// `why` is the consequence clause appended to a missing beat's finding. It is OPTIONAL and defaults
// to the drops-a-tier wording the five original beats have always carried, so their messages stay
// byte-identical; only a beat whose consequence is genuinely different states its own.
const TIER_BEATS = [
    { label: "Full tier label", needle: "- **Full** —" },
    { label: "Reduced tier label", needle: "- **Reduced** —" },
    { label: "Degraded tier label", needle: "- **Degraded** —" },
    {
        label: "reduced-path enforcement disclosure",
        needle: "The grant is **not** runtime-enforced here",
    },
    {
        label: "capability-sensing selection signal",
        needle: "Pick it by whether the `Agent` tool is available to you — capability-sensing",
    },
    {
        label: "reduced-tier command name",
        needle: "a default main thread, what `/grugops` gets",
        why: "the coordinator body names a command the kit does not ship, so a reader told what this tier gets cannot map it onto anything they can type — the announcement becomes unactionable in the one place it must not be",
    },
];
const BEAT_DEFAULT_WHY = "a coordinator that drops a tier overstates its enforcement";
function guardWr05() {
    process.stdout.write("\n[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)\n");
    let wr05Fail = "";
    // Collect every SCAN file whose FENCE-STRIPPED FRONTMATTER carries the coordinator marker. The
    // substrate has exactly ONE coordinator (the orchestrator adapter); a second marker — live or from
    // a doc example mis-read as live — is a cardinality violation (CR-01).
    const coordinators = [];
    // Every scan file that was ADMITTED, so the name-key floor below reads the same admission this loop
    // did rather than re-reading and re-admitting the file (one admission per file, one grammar).
    const parsedScan = new Map();
    for (const f of SPAWN_GRANT_SCAN) {
        if (!fileExists(f))
            continue; // missing template/adapter is covered by guard_adapter_size (CR-01)
        const parsed = admit(readText(f));
        if (!parsed.ok) {
            // THE BRANCH THAT MUST BE WRITTEN BY HAND. Its WORDING IS KEPT VERBATIM from the parse-failure
            // branch it replaces (plan 27-12), because it was already the right sentence: a document this
            // guard cannot read is NOT then treated as carrying no grant, and it is NOT downgraded to a
            // warning. It becomes its own finding naming the file and the reason, and the guard goes red.
            //
            // WHAT THE CUTOVER CHANGED IS ITS REACH, NOT ITS SHAPE. It used to fire only when an open
            // grammar could not assemble a value — a narrow condition that eleven rounds of valid-YAML
            // constructs sailed straight past into the no-grant branch. It now fires on EVERY byte outside
            // the canonical form, under one of 23 enumerated codes. The code is printed alongside the
            // reason so a reader can tell a block scalar from an anchor from an unknown key without
            // re-deriving it from the prose.
            wr05Fail += `\n${f}: frontmatter is NOT in the canonical form [${parsed.code}] — ${parsed.reason}. An unreadable adapter cannot be reported on, so it is NEVER read as "carries no grant"`;
            continue;
        }
        parsedScan.set(f, parsed.value);
        const isCoordinator = admittedKeyHasValue(parsed.value, COORDINATOR_KEY, COORDINATOR_VALUE);
        const hasGrant = admittedHasSpawnGrant(parsed.value);
        if (isCoordinator)
            coordinators.push(f);
        if (isCoordinator && !hasGrant) {
            wr05Fail += `\n${f}: coordinator carries no spawn grant — a dropped grant kills Claude Code parallelism (the coordinator MUST hold the enumerated role-agent grant)`;
        }
        else if (!isCoordinator && hasGrant) {
            wr05Fail += `\n${f}: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)`;
        }
    }
    // THE FAIL-CLOSED FLOOR THE PARSER MAKES POSSIBLE (plan 27-12). Every derived agent adapter must
    // carry a parseable frontmatter block containing a `name` key. Claude Code takes agent identity
    // ONLY from frontmatter, so a file in the adapter directory without one is not a loadable agent —
    // and it is also not a file this guard can honestly report on, because "no frontmatter" and "no
    // grant" would otherwise print the same silence. It fails red naming the file.
    //
    // SCOPED TO THE AGENT ADAPTERS on purpose. The packaging templates carry frontmatter of a
    // different kind (`kind: packaging` / `tier: core`) and the skills carry their own; neither is an
    // agent identity and neither needs a name key asserted here. A file that failed to parse above
    // already produced its own finding and is deliberately not double-reported.
    //
    // (Plan 27-20 / 27-REVIEW § WR-05) THE SECOND FLOOR IS THE SAME ARGUMENT AS THE FIRST. An adapter
    // must also DECLARE a tool allow-list. Per this project's own stack notes (CLAUDE.md § "3.
    // Subagent"): `tools` is optional and omitting it inherits ALL main-conversation tools — the spawn
    // tool included. keysHaveSpawnGrant() returns false for an absent key, so the rogue-grant loop
    // above reads a MAXIMAL grant as compliant. An absent key is a grant BY INHERITANCE, never a
    // no-grant: an absent key and a declared no-spawn key print the same silence and mean opposite
    // things, which is precisely why the `name` floor above exists. The scoping argument carries over
    // unchanged — a packaging template and a skill are not sub-agent identities, and the skills that
    // do carry `allowed-tools` are covered by the grant test itself.
    //
    // (Plan 27-26 / 27-REVIEW-GAPS-2 § WR-01) THE THIRD ARM, ADDED BECAUSE ITS SIBLING ALREADY HAD IT.
    // Plan 27-19 refused a `name` key carrying anything other than EXACTLY ONE value, and stated the
    // reason: which of two duplicate keys the platform's YAML loader honours (first, last, or a
    // duplicate-key throw) is not this oracle's to guess. Plan 27-20 then gave the ALLOW-LIST answer an
    // ABSENCE arm and an EMPTINESS arm — thirty lines from that refusal, in this same function, over the
    // same parse — and no CARDINALITY arm. Same predicate shape, one rule short. The asymmetry was the
    // finding: a coordinator declaring `tools:` twice, where the later occurrence carries no spawn
    // token, printed `ALL CHECKS PASSED` at exit 0 while a last-wins loader saw no grant at all.
    //
    // keysHaveSpawnGrant() IS LEFT EXACTLY AS IT IS, deliberately. Its disjunction over every
    // occurrence is CORRECT and fail-safe in the rogue direction — a rogue spawner cannot hide a grant
    // behind a second clean declaration, because any occurrence carrying the token convicts the file.
    // It is fail-OPEN only in the other direction (the coordinator must HOLD the grant), and narrowing
    // the disjunction to close that direction would re-open the rogue one. The cardinality arm closes
    // the second direction without touching the first: it refuses the DOCUMENT for having two answers,
    // so no occurrence is ever preferred and no decoy occurrence can stand in for the honoured one.
    //
    // THE LOOP IS NOW THE SCAN SET, NOT THE AGENT ADAPTERS, AND THE OLD ARMS KEEP THEIR OLD SCOPE.
    // Absence and emptiness stay AGENT-ADAPTER-ONLY behind `isAgentAdapter` for the scoping reason
    // stated above (a skill with no `allowed-tools` is not a defective sub-agent identity; it is not a
    // sub-agent at all). Cardinality is different in kind: declaring one key twice is a defect on ANY
    // surface that declares it, and the SKILL surface is the one with no freshness gate, no role corpus
    // to cross-check and only cardinality checked elsewhere — so it is exactly the surface a duplicate
    // must not be able to hide on. One loop, one place, three arms with their scopes stated; not a
    // second check bolted on beside the first.
    //
    // THE KEY NAMES ARE COUNTED INDIVIDUALLY, not through the flattened list the arms above use. The
    // flattened list cannot tell ONE key declared twice from TWO different keys declared once, and
    // those are different findings with different reasons.
    //
    // SAFE AGAINST FALSE REDS, by the same parser argument plan 27-19 verified for the `name` key: the
    // parser JOINS a wrapped plain scalar, a wrapped quoted scalar, a `>`/`|` block scalar and a block
    // SEQUENCE into a SINGLE value per occurrence, and strips a trailing `# comment`. Every legitimate
    // spelling of one allow-list therefore arrives here as one value, so more than one value means the
    // key genuinely appears more than once.
    //
    // THE TWO-KEY-NAMES SHAPE IS DISPOSITIONED, NOT LEFT UNCONSIDERED — an unconsidered adjacency is
    // how the two arms above came to be written without this one. DISPOSITION: a document declaring
    // BOTH `tools` and `allowed-tools` is REFUSED, for the same reason and by a sibling arm. The
    // platform reads exactly ONE of the two per surface (`tools` on a sub-agent, `allowed-tools` on a
    // skill or command) while keysHaveSpawnGrant() reads BOTH as one answer, so such a document hands
    // two authorities to one predicate: the guard could convict on a list no loader reads, or clear a
    // file on a list the loader ignores. Which spelling is honoured is not this guard's to guess
    // either. The committed tree uses one spelling per surface and no file carries both, so the arm
    // has no live cost; a case pins the disposition in both directions.
    for (const f of SPAWN_GRANT_SCAN) {
        if (!fileExists(f))
            continue;
        const keys = parsedScan.get(f);
        if (keys === undefined)
            continue; // already reported as a refusal
        const isAgentAdapter = AGENT_ADAPTERS.includes(f);
        // THE NAME FLOOR, SPLIT INTO TWO ARMS (plan 27-34, D-41 item 4).
        //
        // It used to report "carries no `name` key in its frontmatter" for BOTH a document whose block
        // declares keys but not a name AND a document with NO FRONTMATTER BLOCK AT ALL, which the parser
        // returns as a successful parse with an EMPTY key set (the keyless success arm — a body-only, empty
        // or blank-lines-only document). Those are different facts with different remedies: the first
        // author must add a key to a block that exists, the second must add the block. Sending the second
        // author to add a `name:` line to a block that is not there is the wrong instruction, and telling
        // two different facts apart is this module's founding argument — the same argument the absence and
        // emptiness arms below already make about the allow-list, and the one guard_wr05's parse-failure
        // branch makes about a file it cannot read.
        //
        // WHAT CAN STILL REACH THE ZERO-KEY ARM, after plan 27-33. A near-delimiter document — an opening
        // line that begins with the delimiter payload but is not the one legal spelling — now REFUSES in
        // the parser and is reported by the parse-failure branch above; it never arrives here. So the
        // zero-key arm is reached by documents that genuinely carry no frontmatter block, which is exactly
        // what its message now says.
        //
        // (27-65) AND AFTER THE CUTOVER IT IS UNREACHABLE, WHICH IS WHY IT IS KEPT. The canonical form has
        // no keyless success: a document with no opening delimiter refuses as `no-opening-delimiter` and
        // an empty region refuses as `empty-region`, both above, both by name. This arm is therefore a
        // residual floor that costs nothing and fails closed. It is deliberately NOT deleted — this round
        // moves the reader and removes nothing, and an arm removed because "the new module handles it"
        // is exactly the reasoning that would have to be re-verified if the reader ever moved again.
        if (isAgentAdapter && keys.size === 0) {
            wr05Fail += `\n${f}: agent adapter carries NO FRONTMATTER BLOCK at all — the parse returned zero keys for the whole document, which is a different fact from a block that declares keys without a \`name\`; Claude Code takes agent identity only from frontmatter, so add the block rather than a key to a block that is not there`;
        }
        else if (isAgentAdapter && !keys.has("name")) {
            wr05Fail += `\n${f}: agent adapter carries no \`name\` key in its frontmatter — Claude Code takes agent identity only from frontmatter, so this is not a loadable agent and its spawn-grant verdict cannot be trusted`;
        }
        // TWO ARMS, ABSENCE AND EMPTINESS, for the reason plan 27-19 gave when it split the same pair on
        // the `name` key (self-review, probe F): `tools:` with no value parses to a PRESENT key carrying
        // `""`, so a key-presence test alone passes it while the value declares nothing. What the
        // platform does with a null allow-list is UNKNOWN — if it reads null as absent, the sub-agent
        // inherits every tool and this is the very bypass above, reachable by deleting a value instead of
        // a line. An empty declaration prints the same silence as no declaration, which is this floor's
        // own founding argument, so it is refused as its own finding rather than guessed at.
        //
        // (27-65) THE EMPTINESS ARM IS ALSO SUBSUMED BY ADMISSION AND ALSO KEPT. `tools:` written with no
        // value and no sequence item beneath it refuses as `dangling-empty-key` above — the canonical form
        // has no null value, so a key either carries a scalar or carries at least one item. The arm stays
        // for the same reason the zero-key arm stays.
        const declaredToolsValues = GRANT_KEYS.flatMap((k) => admittedValuesFor(keys, k));
        if (isAgentAdapter && declaredToolsValues.length === 0) {
            wr05Fail += `\n${f}: agent adapter declares no \`tools\` key — omitting it makes the platform grant every main-conversation tool INCLUDING the spawn tool, so an absent key is a grant by inheritance and this guard cannot report on it`;
        }
        else if (isAgentAdapter && declaredToolsValues.every((v) => v.trim() === "")) {
            wr05Fail += `\n${f}: agent adapter has a \`tools\` key present with an EMPTY value — an empty allow-list declares nothing, and whether the platform reads it as "no tools" or as an absent key (inherit everything, spawn tool included) is not this guard's to guess`;
        }
        // The cardinality arm sits AFTER the absence/emptiness chain rather than inside it, on purpose:
        // a document with TWO EMPTY declarations must produce BOTH findings. Folding it into the chain
        // as another `else if` would let the new arm mask the arm it was added to join, which is the
        // opposite of the point. A check reports what it checked.
        //
        // (27-65) THE CARDINALITY ARM IS THE ONE THE CUTOVER GENUINELY DISSOLVES, and the dissolution is
        // worth stating precisely because it is D-64's whole thesis in miniature. This arm existed because
        // the parser returned a LIST PER KEY — a key declared twice produced two entries, and the guard
        // had to notice. The canonical form REFUSES a duplicate key outright (`duplicate-key`), so the
        // admitted map cannot represent the defect this arm was written to detect. It is not that the
        // check was removed; it is that the state it checked for can no longer be admitted.
        //
        // ADMISSION IS STRICTLY WIDER HERE, IN THE REFUSING DIRECTION: it refuses a duplicate of ANY key,
        // where this arm only looked at the two grant keys. Wider-and-louder is the safe direction, and it
        // is measured harmless — all 33 live scanned files admit.
        //
        // THE LOOP IS GONE RATHER THAN LEFT AS A BRANCH THAT CANNOT FIRE, and that is a deliberate choice
        // against the easier one. The first draft of this cutover kept the loop written as
        // `v.kind === "scalar" && occurrences.length > 1` — which is dead, because a scalar yields exactly
        // one value, but which READS like a live floor to anyone scanning the function. A dead branch
        // wearing the costume of a live one is worse than no branch: it is a check a future reader will
        // count as covering something. The property is instead pinned where it can actually be observed —
        // `check-foundation-guards.test.ts` plants a duplicate `tools:` key into a live scan file and
        // asserts the GATE fails naming `duplicate-key`. An assertion that runs beats a branch that cannot.
        const declaredToolsKeys = GRANT_KEYS.filter((k) => keys.has(k));
        if (declaredToolsKeys.length > 1) {
            wr05Fail += `\n${f}: declares ${declaredToolsKeys.length} DIFFERENT allow-list keys (${declaredToolsKeys.map((k) => `\`${k}\``).join(", ")}) — the platform reads one spelling per surface (\`tools\` on a sub-agent, \`allowed-tools\` on a skill or command) while this guard reads both as one answer, so the document gives one predicate two authorities; which spelling is honoured is not this guard's to guess`;
        }
    }
    // Cardinality (CR-01): exactly one coordinator across the SCAN set. A fenced documentation example
    // is stripped before this count, so it cannot inflate it; a LIVE second marker fails red naming the
    // offending files. This keeps the both-direction invariant honest — no file is promoted out of the
    // must-not-spawn set by an illustrative marker.
    if (coordinators.length !== 1) {
        wr05Fail += `\nexpected exactly one coordinator: true file in the scan set, found ${coordinators.length}${coordinators.length > 0 ? `: ${coordinators.join(", ")}` : ""}`;
    }
    // Tier-announcement presence (revised D-05), checked on the file carrying the coordinator marker —
    // never on a filename. It only runs when the cardinality holds: with zero or two coordinators the
    // failure above is the finding, and reporting five absent beats against an ambiguous body would
    // bury it.
    if (coordinators.length === 1) {
        // ONE PREDICATE, ONE TREATMENT (plan 27-20 / 27-REVIEW § CR-03). This is byte-for-byte the
        // composition guard_adapter_body's positive half builds — the single stripFencedBlocks()
        // authority, then stripHtmlComments(), then collapseWhitespace() — followed by
        // countOccurrences(). It used to be a bare `.includes()` over a body that was fence-stripped but
        // NEITHER comment-stripped NOR counted, which is the WR-05 hole plan 27-14 closed in the sibling
        // check inside this same aggregator, left open here. Wrapping the whole tier announcement in
        // `<!-- -->` then printed `carries all 6 tier-announcement beats` with zero of the six live: a
        // false claim about a capability-and-safety announcement, the T-27-34 spoofing threat this guard
        // names in its own beat header. Two checks reading one body must read it the same way, or the
        // weaker one is the one guarding CI.
        const coordinatorBody = collapseWhitespace(stripHtmlComments(stripFencedBlocks(readText(coordinators[0]))));
        for (const beat of TIER_BEATS) {
            const found = countOccurrences(coordinatorBody, beat.needle);
            // THE SPLIT MIRRORS guard_adapter_body's OWN zero-versus-more-than-one split.
            //
            // The ZERO arm keeps its EXISTING wording byte-for-byte, `why` clause and BEAT_DEFAULT_WHY
            // fallback included. This is a deliberate deviation from the review's single-message patch:
            // five removal cases and three command-name cases in check-foundation-guards.test.ts assert
            // that wording, they are correct pins on a real failure, and rewriting them to accommodate a
            // cosmetically tidier message would be weakening working coverage for nothing. A finding's
            // wording is a contract with the cases that pin it.
            if (found === 0) {
                wr05Fail += `\n${coordinators[0]}: coordinator body is missing the tier-announcement beat "${beat.label}" (expected the wording \`${beat.needle}\`) — ${beat.why ?? BEAT_DEFAULT_WHY}`;
            }
            else if (found > 1) {
                wr05Fail += `\n${coordinators[0]}: coordinator body states the tier-announcement beat "${beat.label}" ${found} time(s) in live, non-fenced, non-commented text — exactly 1 occurrence is required; a body the generator does not produce is not a body this guard may pass, and a duplicated tier line means a reader is told the same tier twice and cannot tell which statement is current`;
            }
        }
    }
    // SPAWN-04 reporting. The rogue-grant loop above walks every SPAWN_GRANT_SCAN member, but the
    // number worth REPORTING is the adapter one: SPAWN-04 is a property of the shipped adapters, and
    // the two packaging templates are documentation surfaces that happen to share the scan. Both
    // numbers are printed so neither hides. With the scan set derived in plan 27-03 this now covers all
    // 17 agent adapters and all 7 skills rather than the four files it used to hand-list.
    // THE PLUGIN-ROOT COMPONENT FLOOR (plan 27-34, rewritten by plan 27-37 / D-46) — ABSENCE OR
    // COVERAGE, never assumption.
    //
    // WHAT THIS COMMENT CLAIMS IS EXACTLY WHAT THE CODE BENEATH IT ASSERTS. The round-5 wording claimed
    // to close "the CLASS the plugin-skill hole belongs to" while iterating a hand-written TWO-element
    // literal over a NINE-surface manifest schema — a class-level claim over a 2-of-9 set, which is a
    // claim without the assertion that would make it true. That is recorded here rather than quietly
    // rewritten, because a comment that overclaimed once is evidence about how comments here are read.
    //
    // WHAT IS ACTUALLY ASSERTED NOW:
    //   • the plugin-root component surface is DERIVED from the manifest component-path field
    //     enumeration CLAUDE.md documents (kit-model.ts's PLUGIN_MANIFEST_COMPONENT_SCHEMA, 9 entries);
    //   • its cardinality is pinned TWO-SIDED at 9 in guard_kit_counts, like every sibling count;
    //   • the schema partitions EXHAUSTIVELY and DISJOINTLY into three buckets, also asserted in
    //     guard_kit_counts — 7 forbidden, 1 covered elsewhere by a NAMED function
    //     (`skills` / listPluginSkillAdapters), 1 exempt BY NAME with two live bounds (`hooks`);
    //   • the 7 forbidden keys' directories are probed here, and a present one is legal only when every
    //     file in it is already inside SPAWN_GRANT_SCAN;
    //   • the exempt directory's two bounds are asserted below on MEASURED numbers this line prints.
    //
    // THE RESIDUAL, RECORDED RATHER THAN CLAIMED AWAY. The schema is derived from a document THIS
    // repository maintains, and a document can lag a platform. A tenth component directory added
    // platform-side is outside the schema, and the two-sided count cannot detect it — the count fires
    // only when THIS repository's own list changes. That is an honest limit of the shape, not a hole
    // this floor has closed.
    //
    // The floor stays deliberately weak in the right direction: a directory that EXISTS is fine,
    // provided every file in it is inside SPAWN_GRANT_SCAN, so a future phase may legitimately ship
    // plugin-root components by first putting them in the scan. What it forbids is a LOADABLE SURFACE
    // NOBODY SCANS.
    //
    // Reproduced before the rewrite on hermetic `git archive HEAD` mirrors: `commands/rogue.md` exited 1
    // and named the file; the IDENTICAL plant at `outputStyles/rogue.md` and at `hooks/rogue.md` each
    // exited 0 with `ALL CHECKS PASSED` and never named the file at all.
    const pluginDefaults = [];
    try {
        for (const probe of listPluginDefaultComponentFiles(ROOT)) {
            if (!probe.present) {
                pluginDefaults.push(`${probe.subpath}/ ABSENT`);
                continue;
            }
            const unscanned = probe.files.filter((f) => !SPAWN_GRANT_SCAN.includes(f));
            // MEASURED NUMBERS, NOT A COVERAGE CLAIM. This line used to read "all in the spawn-grant scan"
            // and it was BUILT BEFORE the filter that can falsify it — a completion claim printed ahead of
            // its own evidence. It now prints what was counted: how many files were found and how many of
            // those were inside the scan. An assertion passing vacuously over an empty directory is then
            // visible as `0 file(s), 0 inside the spawn-grant scan` rather than as a reassuring "all".
            pluginDefaults.push(`${probe.subpath}/ PRESENT with ${probe.files.length} file(s), ${probe.files.length - unscanned.length} inside the spawn-grant scan`);
            if (unscanned.length > 0) {
                wr05Fail += `\n${unscanned.length} file(s) under the plugin-root component directory \`${probe.subpath}/\` sit OUTSIDE the spawn-grant scan: ${unscanned.join(", ")}. The plugin manifest declares no component-path override and the marketplace entry sources the repository root, so Claude Code's default discovery LOADS this directory for every plugin-install user — a granted file here is live on a real machine while no guard can see it. Either the directory stays absent, or its contents enter the scan`;
            }
        }
    }
    catch (e) {
        // The probe walks a directory that exists, so a throw means it became unreadable mid-run. That is
        // a condition to NAME, never to treat as "absent, therefore fine" — absence is the one answer this
        // floor accepts, and an unreadable directory is not evidence of it.
        wr05Fail += `\nthe plugin-root component probe failed: ${e.message} — an unreadable plugin-root component directory is NEVER read as "absent, therefore fine"`;
    }
    // THE EXEMPT DIRECTORY'S TWO BOUNDS (plan 27-37, D-46 point 3). `hooks/` is a plugin-root component
    // surface the platform loads and it is NOT forbidden, because it exists on the live tree holding the
    // PreToolUse prod-deploy guard that CLAUDE.md makes a hard safety constraint. Relocating a mandated
    // safety surface to satisfy a guard rule would be the guard bending the product.
    //
    // SO IT IS BOUNDED INSTEAD, AND THE BOUNDS ARE THE EXEMPTION. Without them it is a hole with a
    // comment — which is precisely what it was until this plan, and what let `hooks/rogue.md` print
    // ALL CHECKS PASSED.
    //
    //   BOUND A (coverage): every markdown — i.e. frontmatter-bearing — member of the exempt directory
    //     is inside SPAWN_GRANT_SCAN. VACUOUS TODAY: the directory holds ZERO markdown files, so this
    //     assertion passes over an empty set. The disposition line therefore prints the MEASURED ZERO
    //     rather than a coverage claim; a vacuous assertion reported as if it proved something is the
    //     failure this whole plan exists to delete.
    //   BOUND B (shape): the directory carries ZERO markdown adapters, naming any that appear. This is
    //     the bound that FAILS CLOSED the moment a markdown adapter lands there.
    //
    // THE TWO OVERLAP ON PURPOSE and that overlap is not double-reporting one fact: an unscanned
    // markdown member is wrong in two distinct ways (it exists at all, and nothing scans it), and BOUND A
    // is the one that survives if BOUND B is ever legitimately relaxed — see the exemption's recorded
    // "what would force a later promote" note in kit-model.ts.
    //
    // A NON-markdown file in the exempt directory is deliberately NOT a finding: that is what the
    // exemption exempts, and a transcript on a fourth hermetic mirror shows the gate correctly staying
    // green for one. The exemption is bounded, not absent.
    try {
        for (const ex of listPluginExemptComponentFiles(ROOT)) {
            if (!ex.present) {
                pluginDefaults.push(`${ex.subpath}/ EXEMPT-BY-NAME but ABSENT`);
                continue;
            }
            const unscannedMarkdown = ex.markdownFiles.filter((f) => !SPAWN_GRANT_SCAN.includes(f));
            pluginDefaults.push(`${ex.subpath}/ EXEMPT-BY-NAME, PRESENT with ${ex.files.length} file(s) and ${ex.markdownFiles.length} markdown adapter(s), ${ex.markdownFiles.length - unscannedMarkdown.length} of those inside the spawn-grant scan`);
            if (unscannedMarkdown.length > 0) {
                wr05Fail += `\n${unscannedMarkdown.length} markdown (frontmatter-bearing) file(s) under the EXEMPT plugin-root component directory \`${ex.subpath}/\` sit OUTSIDE the spawn-grant scan: ${unscannedMarkdown.join(", ")}. The exemption forgoes ONLY the "must be absent" rule; it never admits a loadable adapter surface no guard reads. Exemption reason on record: ${ex.reason}`;
            }
            if (ex.markdownFiles.length > 0) {
                wr05Fail += `\nthe EXEMPT plugin-root component directory \`${ex.subpath}/\` carries ${ex.markdownFiles.length} markdown adapter(s): ${ex.markdownFiles.join(", ")}. Zero markdown adapters is the bound that makes this exemption fail closed — the directory is exempted because it holds the mechanical prod-deploy guard, NOT because it may hold adapters. Bound on record: ${ex.bound}`;
            }
        }
    }
    catch (e) {
        wr05Fail += `\nthe exempt plugin-root component probe failed: ${e.message} — an unreadable EXEMPT component directory is NEVER read as "absent, therefore fine"; the exemption is its bounds, and an unmeasurable bound is not a bound`;
    }
    const nonCoordinatorAdapters = ADAPTERS.filter((f) => !coordinators.includes(f)).length;
    // The plugin-form skill members of the scan, partitioned out of the ONE composition on the same
    // prefix the composition was built from — never a second read, and never the derivation above (which
    // exists for the count and the pair rule). What this number reports is what the scan actually held.
    const pluginSkillsScanned = SPAWN_GRANT_SCAN.filter((f) => f.startsWith(spawnGrantScanPrefix("plugin-skill"))).length;
    if (wr05Fail === "") {
        pass(
        // The claim NAMES THE INPUT IT READ (plan 27-20 / CR-03, T-27-101). The `all N
        // tier-announcement beats` phrase is kept verbatim — a case pins it — and the clause that makes
        // the claim true is APPENDED rather than replacing it: a PASS line must never state a check
        // that was not performed over the input it names.
        //
        // (Plan 27-34) The plugin-skill count and the plugin-default component dispositions are APPENDED
        // for the same reason, and it is the reason this plan exists: the line used to assert "no
        // non-coordinator does" while naming only the adapter and packaging counts, over a set that
        // structurally could not see the seven plugin-form skills. A both-direction claim printed over an
        // input the guard cannot read is a fabricated completion claim. The dispositions are printed even
        // when both directories are ABSENT so a reader sees which surfaces were CONSIDERED, rather than
        // only that something passed.
        `WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (${nonCoordinatorAdapters} non-coordinator adapter bodies + ${pluginSkillsScanned} plugin-form skill(s) + ${PACKAGING_TEMPLATES.length} packaging template(s) checked), and the coordinator body carries all ${TIER_BEATS.length} tier-announcement beats, each exactly once in live, non-fenced, non-commented text; plugin-default component directories: ${pluginDefaults.join(", ")}`);
    }
    else {
        fail(`WR-05 coordinator-spawn-grant violation:${wr05Fail}`);
    }
}
// ---------------------------------------------------------------------------
// guard_adapter_body — retired memory-relay vocabulary OUT, the shared-context memory sentence IN
// (Phase 27 / SPAWN-05, D-23/D-24/D-25/D-26).
//
// DEFENSE IN DEPTH, NEVER THE STRUCTURAL FIX. The one surviving retired line died STRUCTURALLY the
// moment plan 27-07 made the coordinator adapter generated from
// agent-factory/packaging/subagent.frontmatter.md, because the template already carries the correct
// memory wording. This guard exists to catch a hand-edit of a generated adapter and a regression in
// the template upstream of the generator — not to be the thing that made the tree correct.
//
// BOTH DIRECTIONS (D-23), because each catches a failure the other cannot:
//   • NEGATIVE — a scanned body must not carry any retired memory-relay phrase. This depends on
//     having enumerated the retired phrases, so it can only ever be as good as that list.
//   • POSITIVE — a scanned body must name the shared verified context as its memory. This is the
//     half that matters most: it catches an adapter gone stale by OMISSION (one that quietly loses
//     the sentence without gaining a banned phrase) and it does not depend on having guessed every
//     retired phrase.
//
// WHAT IS DELIBERATELY NOT BANNED. The pre-generation adapter line conflated two things. The
// memory-relay phrasing is retired. The execution-topology phrasing — one window with prior context
// dropped between roles — is STILL CORRECT: it describes how roles activate on the four
// non-spawning host CLIs, it is verbatim in the packaging template, and under the revised D-02 it is
// the degraded tier's own wording. Banning it would fail red on text this project keeps on purpose,
// and the only way back to green would be deleting correct text. The retired list in
// scripts/dead-vocabulary.ts carries that boundary in a comment; a passing test below pins it.
//
// SCAN SET (D-25): the DERIVED adapters — 17 agents + 7 skills — plus the packaging template. The
// template is the upstream source the generator is built from, so a regression there is caught
// BEFORE it propagates into seventeen generated files. Membership follows the filesystem for the
// adapters, so an eighteenth role is scanned the day its adapter lands.
//
// TWO HALVES, SAME PREDICATE, DIFFERENT INPUT (plan 27-14, review finding WR-05). The scan set used
// to be one flat list, and running the LIVE-PROSE rule over the packaging template is what let a
// comment stand in for the rule. The template's two adapter body shapes are deliberately FENCED —
// they are the text the generator copies — so fence-stripping the template deleted the only real
// instances of the sentence from its input, and the check was satisfied instead by a documentation
// bullet further down the same file that merely DESCRIBED the sentence. The guard was green because
// prose about the rule stood in for the rule. So the halves are split by input:
//   • LIVE-PROSE half — the derived adapters, read fence-stripped, as before. A fenced example in an
//     adapter is documentation and neither trips the ban nor satisfies the requirement.
//   • TEMPLATE half — the packaging template, read RAW (fences KEPT), because what must be checked
//     there is precisely the fenced body shapes. It additionally requires that each form appear
//     ZERO times OUTSIDE a fence, so a bullet restating the sentence can never substitute for a body
//     shape that lost it. The negative half runs over the template's raw text too, so a retired
//     phrase inside a body shape is caught BEFORE the generator copies it into seventeen files.
//
// ANCHORED AND COUNTED (plan 27-14, review finding WR-05). The positive half used to be a bare
// substring test for a FRAGMENT of the sentence — order-independent, context-free, satisfied by any
// occurrence anywhere. It is now the three FULL sentence forms the generator actually emits, and the
// test is on the NUMBER of occurrences, not their existence: exactly one per adapter body. Zero is an
// adapter gone stale by omission; more than one is a body edited into something the generator does
// not produce.
//
// ONE FENCE AUTHORITY. Both halves read through the SHARED stripFencedBlocks() — never a second
// parser over the same bytes. The template half computes "inside a fence" as raw-minus-stripped from
// that same authority rather than re-deciding it. stripHtmlComments() — declared at the top of this
// file beside collapseWhitespace(), and SHARED with guard_wr05's tier-beat check since plan 27-20 —
// is NOT a second fence implementation: it removes a different construct (`<!-- -->`), it composes
// with the one fence authority instead of duplicating it, and within THIS guard it is applied to the
// POSITIVE half only (the negative half must still see a retired phrase quoted inside a comment).
// ---------------------------------------------------------------------------
const ADAPTER_BODY_TEMPLATE = "agent-factory/packaging/subagent.frontmatter.md";
// THE ANCHORED MEMORY FORMS — the three full sentences the generated and authored adapter bodies
// actually carry, verbatim. The first two are the packaging template's two fenced body shapes and are
// emitted by scripts/generate-role-adapters.ts; the third is the skill adapters' own form. Anchoring
// to a full sentence rather than a fragment is what makes "a comment describing the rule" fail: a
// description does not restate the sentence, and a body that is not what the generator emits does not
// match any form. These are wording CONTRACTS between the template, the generator and this guard —
// changing one means re-cutting all three together and regenerating every adapter.
//
// They stay local here rather than becoming a shared export: they have exactly ONE consumer, and a
// shared module with a single consumer is a second authority with nothing to justify it.
// (dead-vocabulary.ts is the opposite case: two consumers, so it earns the module.)
const MEMORY_FORM_SPECIALIST = "The shared verified context is the only memory — read what earlier roles published, publish your own, and expect nothing to have been passed to you by whoever activated you.";
const MEMORY_FORM_COORDINATOR = "The shared verified context is the only memory — never relay data between agents.";
const MEMORY_FORM_SKILL = "The shared verified context is the only memory — require typed notes per `agent-factory/workflows/16-context-read-write.md`, and never relay data between agents.";
// Every form a LIVE adapter body may legitimately carry. No form is a substring of another, so
// summing their counts cannot double-count one sentence.
const MEMORY_FORMS = [
    MEMORY_FORM_SPECIALIST,
    MEMORY_FORM_COORDINATOR,
    MEMORY_FORM_SKILL,
];
// The two body shapes the packaging template carries and the generator copies. The skill form is
// deliberately absent: the skill adapters are authored, not emitted from this template.
const TEMPLATE_BODY_FORMS = [
    { label: "specialist", form: MEMORY_FORM_SPECIALIST },
    { label: "coordinator", form: MEMORY_FORM_COORDINATOR },
];
// (Plan 27-20 / CR-03) stripHtmlComments() and countOccurrences() were declared HERE and are now
// declared beside collapseWhitespace() at the top of this file, unchanged in behavior. They are
// SHARED with guard_wr05's tier-beat check, which asks the same question of the same coordinator
// body; keeping them next to one of their two callers is what made the sibling check easy to write
// without them. There is still exactly ONE of each — a relocation, never a copy.
function guardAdapterBody() {
    process.stdout.write("\n[guard_adapter_body] adapter bodies carry the shared-context memory, not the retired relay (SPAWN-05)\n");
    let bodyFail = "";
    let scanned = 0;
    let templateShapes = 0;
    // ── LIVE-PROSE HALF: the derived adapters. ────────────────────────────────────────────────────
    for (const f of ADAPTERS) {
        // CR-01 missing-file fail-red. For a derived adapter this is a TOCTOU race (it came from a
        // readdir), and the guard NAMES it rather than quietly scanning one body fewer.
        if (!fileExists(f)) {
            bodyFail += `\n${f}: missing — cannot check an adapter body that is not there`;
            continue;
        }
        scanned += 1;
        // One fence authority, then a whitespace normalization, so neither half's verdict depends on
        // where an author hard-wrapped the line.
        const body = collapseWhitespace(stripFencedBlocks(readText(f)));
        // Case-insensitive on the negative half: a re-capitalised retired phrase is the same retired
        // phrase. The list stores lowercase forms only (see scripts/dead-vocabulary.ts).
        const lowered = body.toLowerCase();
        for (const phrase of RETIRED_PROSE_FORMS) {
            if (lowered.includes(phrase)) {
                bodyFail += `\n${f}: carries retired memory-relay vocabulary "${phrase}" — the 17 static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay`;
            }
        }
        // Positive half: comment-stripped, so a commented-out copy of the sentence cannot stand in for
        // the live one. Counted, not tested for existence.
        const live = collapseWhitespace(stripHtmlComments(stripFencedBlocks(readText(f))));
        const found = MEMORY_FORMS.reduce((n, form) => n + countOccurrences(live, form), 0);
        if (found === 0) {
            bodyFail += `\n${f}: body never names the shared verified context as its memory — 0 occurrence(s) of a generated memory sentence in live, non-fenced, non-commented text; an adapter gone stale by omission`;
        }
        else if (found > 1) {
            bodyFail += `\n${f}: body states a generated memory sentence ${found} time(s) in live text — exactly 1 occurrence is required; a body edited into something the generator does not produce`;
        }
    }
    // ── TEMPLATE HALF: the packaging template, read RAW. ──────────────────────────────────────────
    if (!fileExists(ADAPTER_BODY_TEMPLATE)) {
        // Not a TOCTOU race — this member is a named literal, so its absence is a real deletion of the
        // upstream source every generated adapter is built from.
        bodyFail += `\n${ADAPTER_BODY_TEMPLATE}: missing — cannot check the adapter body shapes the generator copies`;
    }
    else {
        const templateSrc = readText(ADAPTER_BODY_TEMPLATE);
        const raw = collapseWhitespace(stripHtmlComments(templateSrc));
        const outsideFences = collapseWhitespace(stripHtmlComments(stripFencedBlocks(templateSrc)));
        // Negative half over the RAW text — fences included. A retired phrase inside a body shape is the
        // worst case there is: the generator would copy it into seventeen adapters on the next run.
        const loweredRaw = collapseWhitespace(templateSrc).toLowerCase();
        for (const phrase of RETIRED_PROSE_FORMS) {
            if (loweredRaw.includes(phrase)) {
                bodyFail += `\n${ADAPTER_BODY_TEMPLATE}: carries retired memory-relay vocabulary "${phrase}" in its raw text (fenced body shapes included) — the generator copies this file's body shapes into every adapter`;
            }
        }
        for (const { label, form } of TEMPLATE_BODY_FORMS) {
            templateShapes += 1;
            const rawCount = countOccurrences(raw, form);
            const proseCount = countOccurrences(outsideFences, form);
            if (rawCount !== 1) {
                bodyFail += `\n${ADAPTER_BODY_TEMPLATE}: the ${label} body shape's memory sentence appears ${rawCount} time(s) in this file's raw text — exactly 1 is required ("${form}")`;
            }
            else if (proseCount !== 0) {
                // The one occurrence is in live prose, which means the fenced body shape has lost it. Prose
                // describing the rule must never stand in for the body shape the generator copies.
                bodyFail += `\n${ADAPTER_BODY_TEMPLATE}: the ${label} body shape's memory sentence appears ${proseCount} time(s) OUTSIDE a fenced body shape — the sentence belongs to the shape the generator copies, and a documentation line restating it can never substitute for it ("${form}")`;
            }
        }
    }
    // Vacuity floor, over the DERIVED half. The adapter half of the scan set is DERIVED, and deriving
    // a set silently deletes the fail-red branch a literal had: a body that disappears stops being a
    // member instead of becoming a finding. A run that derived no adapters is the anomaly, never "no
    // bodies to check, therefore fine".
    //
    // (Plan 27-14, review finding WR-01) The floor used to test the TOTAL number of bodies scanned.
    // That quantity always included the packaging template, which is a named literal and always
    // present, so the branch could never be reached and a tree with BOTH adapter directories emptied
    // reported a PASS over the template alone. A floor written over the wrong quantity is worse than
    // no floor, because the phase counts it as restored while it never runs — so the condition is now
    // the derived MEMBER LIST being empty, which is exactly the thing whose disappearance the floor
    // exists to catch. The total is still reported in the pass line; reporting what was checked is a
    // separate and still-useful property, but it was never a fail-red condition.
    if (ADAPTERS.length === 0) {
        bodyFail += `\nthe adapter-body scan set derived NO adapters — refusing to report a verdict over the packaging template alone (${ADAPTER_DIR}: ${AGENT_ADAPTERS.length} adapter(s), ${SKILL_DIR}: ${SKILL_ADAPTERS.length} adapter(s))${ADAPTER_DERIVATION_ERRORS.length === 0 ? "" : `\n${ADAPTER_DERIVATION_ERRORS.join("\n")}`}`;
    }
    if (bodyFail === "") {
        // Report WHAT WAS CHECKED on BOTH halves, not a bare PASS: a line reading "1 adapter body" or
        // "0 template body shapes" is then visible as the anomaly it is instead of hiding behind PASS.
        pass(`SPAWN-05: ${scanned} adapter bodies + ${templateShapes} template body shapes checked; none carries retired relay vocabulary, every adapter body states a generated memory sentence exactly once, and each template body shape states its own exactly once inside its fence`);
    }
    else {
        fail(`SPAWN-05 adapter-body violation:${bodyFail}`);
    }
}
// ---------------------------------------------------------------------------
// guard_agents_bytes — AGENTS.md byte budget below the Codex cap (32768 B).
// FAIL fires at 28672 (28 KiB) — strictly below the cap, with headroom; WARN at 20480 (20 KiB).
// ---------------------------------------------------------------------------
const AGENTS_WARN = 20480; // 20 KiB
const AGENTS_FAIL = 28672; // 28 KiB — headroom below the 32768 B Codex cap
function guardAgentsBytes() {
    process.stdout.write("\n[guard_agents_bytes] AGENTS.md byte budget (Codex cap 32768B)\n");
    // Missing-file fail-red (CR-01): a deleted AGENTS.md must fail red, never vacuous-PASS.
    if (!fileExists("AGENTS.md")) {
        fail("AGENTS.md missing (required for Codex cap check)");
        return;
    }
    const b = byteLen("AGENTS.md");
    if (b >= AGENTS_FAIL) {
        fail(`AGENTS.md ${b}B >= ${AGENTS_FAIL}B (Codex cap 32768B)`);
    }
    else if (b >= AGENTS_WARN) {
        warn(`AGENTS.md ${b}B >= ${AGENTS_WARN}B — approaching cap`);
    }
    else {
        pass(`AGENTS.md ${b}B under budget`);
    }
}
// ---------------------------------------------------------------------------
// guard_adapter_size — per-adapter byte ceiling (single-source). Byte-based, NOT line-based.
// FAIL at 4096 (4 KiB); WARN at 3072 (3 KiB).
//
// (Phase 27 / KIT-02, D-16) The membership is DERIVED from the two adapter directories, no longer a
// two-entry hand list. It was a two-entry list while the tree held eight adapter files — the seven
// skill adapters were never size-checked at all, which is exactly the set-literal drift class this
// milestone deletes. Derivation is still a BOUNDED scan: two fixed literal directories, one shape
// rule each, never a repo-wide walk.
//
// Ordering is agents-then-skills, each part sorted, so the guard's output for a given tree is
// byte-identical across runs and platforms regardless of readdirSync order.
//
// A derived membership list silently REMOVES the CR-01 missing-file fail-red branch that the literal
// had: a deleted adapter simply stops being a member, so no branch can name it. That behaviour is
// restored in two places rather than pretended to still work — the non-empty floor below (which
// covers a directory emptied outright) and, for agent adapters specifically, the KIT-03
// referential-integrity oracle (which compares the adapter directory against the role corpus and so
// names any single deleted agent adapter). Skills have no corresponding role, so the
// SKILL_ADAPTER_COUNT assertion in guardKitCounts() closes the one gap the oracle cannot see.
//
// ADAPTERS / AGENT_ADAPTERS / SKILL_ADAPTERS are declared once, above guard_wr05, because three
// guards share them.
// ---------------------------------------------------------------------------
const AD_WARN = 3072; // 3 KiB
const AD_FAIL = 4096; // 4 KiB
function guardAdapterSize() {
    process.stdout.write("\n[guard_adapter_size] adapters stay pointer-sized (single-source, byte ceiling)\n");
    // Non-empty floor — the deletion detection the derived set would otherwise have dropped. A run
    // that compared zero adapters is the anomaly, never "nothing to check, therefore fine". Report
    // BOTH counts so the message says which directory came back empty and what the other held.
    let sizeFindings = 0;
    if (AGENT_ADAPTERS.length === 0 || SKILL_ADAPTERS.length === 0) {
        fail(`adapter derivation returned an empty set — ${ADAPTER_DIR}: ${AGENT_ADAPTERS.length} adapter(s), ${SKILL_DIR}: ${SKILL_ADAPTERS.length} adapter(s). An empty adapter directory is never "nothing to compare, therefore fine".${ADAPTER_DERIVATION_ERRORS.length === 0 ? "" : `\n${ADAPTER_DERIVATION_ERRORS.join("\n")}`}`);
        sizeFindings += 1;
    }
    // THE ADAPTER DIRECTORY IS CONTRACTUALLY FLAT, AND A NESTED ADAPTER IS REFUSED BY NAME.
    //
    // The generator emits a flat agents directory, the freshness gate's set equality is defined over
    // those flat names, and the installer materializes them flat — so a nested agent adapter is not a
    // supported grugops artifact. It is, however, a file the platform WILL LOAD. Those two facts
    // together are why the derivation recurses and this guard refuses: the authority SEES the file
    // (so it cannot sit outside every scan set, which is the CR-01 bypass), and this finding SAYS SO
    // (so it is not merely tolerated). Silence is not a policy, and this is the sentence that makes
    // the policy explicit.
    const nested = AGENT_ADAPTER_RELS.filter((rel) => rel.includes("/"));
    if (nested.length > 0) {
        fail(`${nested.length} nested agent adapter(s) under ${ADAPTER_DIR}: ${nested.map((rel) => `${ADAPTER_DIR}/${rel}`).join(", ")}. The adapter directory is contractually FLAT — the generator emits flat names, the freshness gate compares flat names and the installer materializes them flat. The listed files WOULD BE LOADED BY THE RUNTIME (Claude Code discovers this directory recursively and takes identity only from frontmatter) while sitting outside the generator, the freshness gate and the installer.`);
        sizeFindings += 1;
    }
    for (const f of ADAPTERS) {
        // TOCTOU defence: the member came from a readdir, so a vanished file here is a race, not a
        // deletion the derivation could have seen. Kept so the guard names it rather than throwing.
        if (!fileExists(f)) {
            fail(`${f} missing (adapter required)`);
            sizeFindings += 1;
            continue;
        }
        const b = byteLen(f);
        if (b >= AD_FAIL) {
            fail(`${f} ${b}B >= ${AD_FAIL}B — adapter too large (role body copied in?)`);
            sizeFindings += 1;
        }
        else if (b >= AD_WARN) {
            warn(`${f} ${b}B >= ${AD_WARN}B — approaching pointer ceiling`);
        }
        else {
            pass(`${f} ${b}B pointer-sized`);
        }
    }
    // Report WHAT WAS DERIVED, not just what was measured. The per-file lines say nothing about the
    // SHAPE of the set they came from, so a run over a shrunken directory would read as a shorter but
    // equally green list. This line makes both cardinalities visible on every clean run.
    if (sizeFindings === 0) {
        pass(`adapter derivation: ${AGENT_ADAPTERS.length} agent adapters in ${ADAPTER_DIR} (all flat) and ${SKILL_ADAPTERS.length} skill adapters in ${SKILL_DIR}, every one under the ${AD_FAIL}B ceiling`);
    }
}
// ---------------------------------------------------------------------------
// guard_kit_counts — tier 2 of D-21 and the two-sided exactness of D-20 (KIT-01, Phase 27).
//
// kit-model.ts THROWS on a vacuous set (tier 1, because continuing is unsafe). This guard covers the
// other failure mode: a set that is non-empty but WRONG. It compares the derived cardinalities
// against the exported ROLE_COUNT / WORKFLOW_COUNT with strict integer equality — no tolerance band,
// no `>=` floor, no rounding — so a kit root holding 16 roles and one holding 18 BOTH fail red. Only
// 17 passes. The 18-role direction is the load-bearing one: adding a role must force its author to
// walk every derived consumer before bumping the constant, which is exactly the walk that never
// happened while the sets were hand-listed.
//
// On success it REPORTS BOTH DERIVED NUMBERS rather than printing a bare PASS (the established
// "guards report what they checked" convention). A line reading `0 roles` would then be visible as
// the anomaly it is instead of hiding behind the word PASS.
// ---------------------------------------------------------------------------
function guardKitCounts() {
    process.stdout.write("\n[guard_kit_counts] derived kit sets match their exact expected counts (KIT-01, D-20/D-21)\n");
    let countFail = "";
    if (ROLE_FILES.length !== ROLE_COUNT) {
        countFail += `\nkit count: derived ${ROLE_FILES.length} role files, expected exactly ${ROLE_COUNT} — walk every derived consumer (guard_voice, guard_caveman_voice, guard_role_clause_uniqueness, guard_role_size, CTX_SCAN, roleCeiling) BEFORE updating ROLE_COUNT in scripts/kit-model.ts`;
    }
    if (WORKFLOW_FILES.length !== WORKFLOW_COUNT) {
        countFail += `\nkit count: derived ${WORKFLOW_FILES.length} workflow files, expected exactly ${WORKFLOW_COUNT} — walk every derived consumer BEFORE updating WORKFLOW_COUNT in scripts/kit-model.ts`;
    }
    // (Plan 29-03, D-40) THE TWO DISPLAY-NAME DERIVATIONS, PINNED HERE AND NOT IN THE LISTER.
    //
    // Same split every sibling count in this guard uses, and for the reason kit-model.ts records at
    // its own two-sided pins: continuing is SAFE in the library, so the library throws only on the
    // vacuous set (tier 1) and the exact cardinality is adjudicated HERE, where a wrong number stops
    // a release. The pins are two-sided — 16 display names is a failure and 18 is a failure — because
    // the consumer that reads this set (check-imperative-lexicon.ts's TECHNICAL_NAMES) exempts every
    // member from the imperative-position rule, so a SHORT set silently starts reporting findings on
    // correct text and a GROWN set silently starts exempting text nobody reviewed.
    //
    // The derivations can THROW (a file with no heading), which is a DIFFERENT fact from a wrong
    // count and is reported as such rather than collapsed into `0 display names`.
    let roleDisplayNames = null;
    let workflowDisplayNames = null;
    try {
        roleDisplayNames = listRoleDisplayNames(ROOT);
    }
    catch (e) {
        countFail += `\nkit count: the ROLE display-name derivation refused — ${e.message}. This is a different fact from a wrong count: the set could not be derived at all, so its cardinality was never compared against ROLE_COUNT`;
    }
    try {
        workflowDisplayNames = listWorkflowDisplayNames(ROOT);
    }
    catch (e) {
        countFail += `\nkit count: the WORKFLOW display-name derivation refused — ${e.message}. This is a different fact from a wrong count: the set could not be derived at all, so its cardinality was never compared against WORKFLOW_COUNT`;
    }
    if (roleDisplayNames !== null && roleDisplayNames.length !== ROLE_COUNT) {
        countFail += `\nkit count: derived ${roleDisplayNames.length} role DISPLAY names from \`# Role: \` headings, expected exactly ${ROLE_COUNT} (derived: ${roleDisplayNames.join(", ")}) — the display names are the Technical Names the governed prose actually uses, and check-imperative-lexicon.ts's TECHNICAL_NAMES exempts every one of them at imperative position; walk that consumer BEFORE updating ROLE_COUNT in scripts/kit-model.ts`;
    }
    if (workflowDisplayNames !== null &&
        workflowDisplayNames.length !== WORKFLOW_COUNT) {
        countFail += `\nkit count: derived ${workflowDisplayNames.length} workflow DISPLAY names from \`# Workflow: \` headings, expected exactly ${WORKFLOW_COUNT} (derived: ${workflowDisplayNames.join(", ")}) — walk check-imperative-lexicon.ts's TECHNICAL_NAMES BEFORE updating WORKFLOW_COUNT in scripts/kit-model.ts`;
    }
    // (Phase 27 / KIT-02) The skill-adapter count. This is the deletion detector for the ONE derived
    // set the KIT-03 referential-integrity oracle cannot cover: a skill adapter has no corresponding
    // role file, so removing a skill directory would otherwise just shrink the derived set in silence.
    if (SKILL_ADAPTERS.length !== SKILL_ADAPTER_COUNT) {
        countFail += `\nkit count: derived ${SKILL_ADAPTERS.length} skill adapters, expected exactly ${SKILL_ADAPTER_COUNT} — a skill adapter has no role to compare against, so this count is the only deletion signal; walk guard_adapter_size and the spawn-grant scan BEFORE updating SKILL_ADAPTER_COUNT in scripts/kit-model.ts`;
    }
    // (Plan 27-34) The PLUGIN-FORM skill count. Same argument as the standalone skill count directly
    // above, and if anything stronger: the plugin tree has no role corpus for the KIT-03 oracle to
    // compare against AND no freshness gate, so deleting `skills/<n>/` would otherwise shrink the
    // spawn-grant scan in complete silence while every guard stayed green.
    if (PLUGIN_SKILL_RELS.length !== PLUGIN_SKILL_ADAPTER_COUNT) {
        countFail += `\nkit count: derived ${PLUGIN_SKILL_RELS.length} plugin-form skill adapters, expected exactly ${PLUGIN_SKILL_ADAPTER_COUNT} — the plugin tree has no role corpus and no freshness gate, so this count is its only deletion signal; walk guard_wr05's scan, guard_distribution_pair and the false-red control in scripts/frontmatter.test.ts BEFORE updating PLUGIN_SKILL_ADAPTER_COUNT in scripts/kit-model.ts${PLUGIN_SKILL_DERIVATION.error === "" ? "" : `\n  derivation error: ${PLUGIN_SKILL_DERIVATION.error}`}`;
    }
    // (Plan 27-37, D-46) THE PLUGIN-MANIFEST COMPONENT SCHEMA: TWO-SIDED CARDINALITY, THEN AN
    // EXHAUSTIVE DISJOINT BUCKET PARTITION.
    //
    // The schema replaced a hand-written two-element literal that carried neither a derivation nor a
    // count while every sibling set in kit-model.ts carried both. The count gets the same treatment they
    // get — eight entries fails and ten entries fails — and it is enforced HERE rather than in the
    // library for the same reason every other count is: continuing is safe, and CI going red is the
    // right signal.
    //
    // THE PARTITION IS ASSERTED AS SET MEMBERSHIP, NEVER AS THREE COUNTS SUMMING TO NINE. A count
    // identity passes while one member is claimed by TWO buckets and another by NONE — the same
    // within-part substitution the per-part membership loop below exists to catch, one level up. So the
    // three claims are compared against the schema's key set directly: a key claimed twice is named, a
    // key claimed by nobody is named, and a bucket naming a key the schema does not carry is named.
    //
    // The forbidden set is COMPUTED (schema minus covered minus exempt), so "claimed by nobody" cannot
    // arise from today's code — this floor is what makes it impossible for a LATER hand-edit of that
    // computation to reintroduce it silently, which is exactly the drift this plan deletes.
    //
    // TWO LIVE ARMS PLUS ONE PINNED FUTURE-PROOFING ARM — READ THE PASS LINE AS THAT, NOT AS THREE
    // CHECKS (plan 27-42, D-50, closing IN-03). The `doubleClaimed` and `foreign` arms are falsifiable
    // from today's code and do fail closed: a key present in BOTH the covered-elsewhere and the exempt
    // bucket is excluded from the computed forbidden set, appears twice in `claimedKeys` and is named;
    // a bucket naming a key outside the schema is named. The `unclaimed` arm is NOT reachable from
    // today's code, for the reason the paragraph above gives, and it is kept for the LATER hand-edit
    // that would otherwise reintroduce the hole silently.
    //
    // That arm now has an assertion behind it rather than only a comment. The predicate lives in
    // kit-model.ts's `partitionPluginComponentClaims` — a pure function of four key-lists, reading no
    // filesystem and calling no derivation — so a case can hand it a claim set carrying a hole and
    // watch the arm fire without the state ever becoming reachable here. The cases are in
    // scripts/kit-model.test.ts: "the live schema and the live claims partition cleanly — three empty
    // arms", "a claim set with a HOLE fires the unclaimed arm by name", "a claim set naming one key
    // TWICE fires the double-claimed arm by name", "a claim set naming a key OUTSIDE the schema fires
    // the foreign arm by name" and "the verdict is invariant under permutation of each input list".
    //
    // The extraction changed WHERE the predicate lives and never WHAT it decides, and that is proven
    // rather than asserted: the `kit counts:` PASS line below is byte-identical before and after, and
    // the control "the extracted partition predicate is byte-faithful to an inline restatement of it"
    // in scripts/check-foundation-guards.test.ts keeps it so.
    const schemaKeys = PLUGIN_MANIFEST_COMPONENT_SCHEMA.map((e) => e.manifestKey);
    if (schemaKeys.length !== PLUGIN_MANIFEST_COMPONENT_COUNT) {
        countFail += `\nkit count: the plugin-manifest component schema carries ${schemaKeys.length} entries, expected exactly ${PLUGIN_MANIFEST_COMPONENT_COUNT} (derived: ${schemaKeys.join(", ")}) — this is the surface Claude Code's DEFAULT discovery loads for every plugin-install user; walk guard_wr05's plugin-root component floor, the bucket partition, the exemption bound and the disposition line BEFORE updating PLUGIN_MANIFEST_COMPONENT_COUNT in scripts/kit-model.ts`;
    }
    const coveredKeys = PLUGIN_COMPONENT_COVERED_ELSEWHERE.map((c) => c.manifestKey);
    const exemptKeys = PLUGIN_COMPONENT_EXEMPT.map((e) => e.manifestKey);
    // Destructured back to the names the failure message below interpolates, so that message's
    // template literal — which a reader depends on, and which names all three arms — is byte-unchanged
    // by the extraction.
    const { unclaimed: unclaimedKeys, doubleClaimed: doubleClaimedKeys, foreign: foreignKeys, } = partitionPluginComponentClaims(schemaKeys, pluginForbiddenComponentKeys(), coveredKeys, exemptKeys);
    if (unclaimedKeys.length > 0 ||
        doubleClaimedKeys.length > 0 ||
        foreignKeys.length > 0) {
        countFail += `\nkit count: the plugin-manifest component schema's three buckets do not PARTITION it — unclaimed by any bucket [${unclaimedKeys.join(", ")}], claimed by more than one [${doubleClaimedKeys.join(", ")}], claimed but outside the schema [${foreignKeys.join(", ")}]. Every schema member must land in exactly one of forbidden / covered-elsewhere / exempt: an unclaimed member is a plugin-root surface the platform loads and nothing probes, and a doubly-claimed one is exempted and forbidden at once. This is asserted as SET membership rather than as three counts summing to ${PLUGIN_MANIFEST_COMPONENT_COUNT}, because a count identity passes while one member is claimed twice and another not at all`;
    }
    // (Plan 27-33, D-19/D-20) THE RELOCATED SPAWN-GRANT SCAN COMPOSITION'S OWN PIN, two-sided.
    //
    // This is the ONLY thing that can catch a part dropped during the relocation. The guard and the
    // false-red control in scripts/frontmatter.test.ts now read THE SAME OBJECT, so set equality between
    // them compares an object with itself and can never fail — it is documentation of intent, not a
    // check. A one-line slip losing the standalone skills would otherwise leave the control passing over
    // a subset, the gate exiting 0, the packaging-template count unchanged and the whole suite green
    // while seven shipped skill adapters silently left the scan. That is CR-03's shape arriving through
    // the fix for CR-03. The message names the derived total, the expected total AND the per-part
    // breakdown, so a failure says which part moved rather than only that a number changed.
    //
    // The derivation error is appended when there is one: the packaging lister THROWS (D-21 tier 1) and
    // its call site is wrapped in derive(), so an unreadable packaging directory arrives here as an
    // EMPTY composition. This floor is what NAMES it — and the remaining guards still run, rather than
    // the gate terminating on an unhandled exception and silently skipping six unrelated checks.
    const partBreakdown = SPAWN_GRANT_SCAN_PARTS.map((p) => `${p.name} ${SPAWN_GRANT_SCAN.filter((f) => f.startsWith(p.prefix)).length}`).join(" + ");
    if (SPAWN_GRANT_SCAN.length !== SPAWN_GRANT_SCAN_COUNT) {
        countFail += `\nkit count: the spawn-grant scan composition derived ${SPAWN_GRANT_SCAN.length} members, expected exactly ${SPAWN_GRANT_SCAN_COUNT} (derived breakdown: ${partBreakdown}) — this count is the ONLY signal that can catch a part dropped from scripts/kit-model.ts's spawnGrantScan(), because its two consumers read one object and set equality between them can never fail; walk guard_wr05 and the false-red control in scripts/frontmatter.test.ts BEFORE updating SPAWN_GRANT_SCAN_COUNT${SPAWN_SCAN_DERIVATION.error === "" ? "" : `\n  derivation error: ${SPAWN_SCAN_DERIVATION.error}`}`;
    }
    // PER-PART MEMBERSHIP, AS SET EQUALITY AND NEVER AS A COUNT. Three integer comparisons all pass
    // while a decoy under `.claude/agents` DISPLACES a real adapter — a within-part substitution nets
    // out to the right total. Comparing the composition's members under each prefix against that part's
    // own lister is what catches it, and it also catches a swap BETWEEN parts that keeps the total at
    // SPAWN_GRANT_SCAN_COUNT.
    //
    // (Plan 27-42, D-50) WHICH PARTS' EQUALITY WAS ACTUALLY PERFORMED IS RECORDED, because the
    // covered-elsewhere resolution below rests on it. A part whose lister throws routes to the catch
    // and `continue`s, so its equality is NOT performed — and a coverage claim standing on a check that
    // did not happen is the same fact the D-47 item 1 catch exists to name, one consumer further on.
    const partsChecked = new Set();
    for (const part of SPAWN_GRANT_SCAN_PARTS) {
        const inComposition = SPAWN_GRANT_SCAN.filter((f) => f.startsWith(part.prefix)).sort();
        let expected;
        try {
            expected = part.list(ROOT).map((rel) => `${part.prefix}${rel}`).sort();
        }
        catch (e) {
            // (Plan 27-37, D-47 item 1) THE ONE FAILURE PATH IN THIS FILE THAT DID NOT REPORT. It now does.
            //
            // THE JUSTIFICATION THIS REPLACES, AND WHY IT WAS FALSE FOR ITS REACHABLE CASE. The old comment
            // read: "the composition is already empty for the same reason and the cardinality floor above
            // has named it; reporting the thrown message here too would double-report one fact." That holds
            // only when the two reads fail TOGETHER — and they are two INDEPENDENT filesystem reads
            // separated in time. SPAWN_SCAN_DERIVATION runs through derive() at MODULE LOAD, near the top of
            // this file; `part.list(ROOT)` runs later, inside this guard, after several other guards have
            // run. The window where the composition derived cleanly and the directory became unreadable
            // afterwards is precisely the window in which this catch can actually fire, and it is exactly
            // the window the justification denied.
            //
            // AND THE TWO FACTS ARE DIFFERENT FACTS, so this is not a second copy of the cardinality
            // finding. That one says "the composition is short". This one says "a check was NOT PERFORMED" —
            // which is the fact the PASS line twenty lines below would otherwise go on to claim.
            //
            // Reproduced against the committed build before the fix, with one part's lister replaced by a
            // throwing stub in a scratch copy of the compiled kit-model.js: the gate exited 0, printed
            // ALL CHECKS PASSED, produced NO finding for the skipped part, listed it in the breakdown as
            // `<part> 0`, and still asserted `each part set-equal to its own lister`.
            //
            // THE FILE'S OWN DISCIPLINE, restated because this was the one place it lapsed: a check that
            // could not be performed is NAMED, never silent. The plugin-root component probe's catch twenty
            // lines above reports. The adapter derivations report through derive(). Every other failure path
            // here reports. `continue` is kept so one unreadable directory cannot hide the other three
            // parts' results.
            countFail += `\nkit count: the spawn-grant scan composition's ${part.name} part could not be re-derived for the per-part membership check — ${e.message}. This part's SET EQUALITY WAS NOT PERFORMED, and it must not be reported as if it were: the composition derives at module load and this read happens later inside the guard, so the composition may have derived cleanly before this directory became unreadable. That is a DIFFERENT fact from the cardinality floor above, which reports a SHORT composition rather than a skipped check`;
            continue;
        }
        partsChecked.add(part.name);
        if (inComposition.join("\n") !== expected.join("\n")) {
            const missing = expected.filter((f) => !inComposition.includes(f));
            const extra = inComposition.filter((f) => !expected.includes(f));
            countFail += `\nkit count: the spawn-grant scan composition's ${part.name} members are not exactly what ${part.prefix} derives — missing [${missing.join(", ")}], unexpected [${extra.join(", ")}]. This is SET equality on purpose: a count would pass while a decoy displaced a real member inside one part`;
        }
    }
    // (Plan 27-42, D-50, closing IN-04) THE COVERER IS RESOLVED, BY OBJECT IDENTITY, BEFORE THE PASS
    // LINE IS ALLOWED TO PRINT A COVERAGE RELATIONSHIP.
    //
    // Every covered-elsewhere entry EXCLUDES a plugin-root component key from the forbidden set — the
    // set whose directories the plugin-root probe refuses to find on the tree — on the strength of
    // "something else already scans it". Until this plan the something-else was a free-text STRING and
    // this line printed it verbatim, so the gate asserted a coverage relationship whose named coverer it
    // never checked existed. A name and the thing it names drift the moment either is edited alone.
    //
    // THREE SEPARATE FACTS, CHECKED SEPARATELY, because `resolves` is not `covers`:
    //   (1) the coverer RESOLVES to one of the scan's parts, compared with `===` on the FUNCTION rather
    //       than on its name — two distinct functions can share a printed label, so name equality would
    //       recreate the finding under a new spelling;
    //   (2) that part's per-part SET EQUALITY was actually PERFORMED in this run, not skipped by the
    //       catch above — a coverage claim resting on a check that did not happen is exactly the shape
    //       D-47 item 1 closed one consumer earlier;
    //   (3) the resolved part's PREFIX is one of the probe directories the SCHEMA gives that manifest
    //       key — otherwise the entry resolves to a real lister that scans a DIFFERENT surface, and the
    //       gate would print `commands by the plugin-skill part's lister …` as a coverage claim while
    //       `commands/` sat outside every probe. Resolving is not covering, and covering something is
    //       not covering THIS key. (Found by red-teaming this change rather than named by the finding.)
    //   (4) the composition holds at least one member under that part's prefix — an empty set is
    //       trivially "all scanned", and that vacuous pass is what the bucket exists to make impossible.
    //
    // The printed label is then DERIVED from the resolved part (its name and its lister's own function
    // name), so the claim and the checked fact are one fact with one source.
    const coveredLabels = [];
    for (const covered of PLUGIN_COMPONENT_COVERED_ELSEWHERE) {
        const part = SPAWN_GRANT_SCAN_PARTS.find((p) => p.list === covered.coverer);
        if (part === undefined) {
            countFail += `\nkit count: the covered-elsewhere bucket claims \`${covered.manifestKey}\` is already covered, but its coverer is NOT one of the listers the spawn-grant scan is composed from (${SPAWN_GRANT_SCAN_PARTS.map((p) => p.name).join(", ")}). That claim is what excludes \`${covered.manifestKey}\` from the FORBIDDEN set, so an unresolved coverer leaves a plugin-root surface the platform loads outside every probe AND outside the scan. Resolution is by FUNCTION IDENTITY, never by name: two distinct functions can share a printed label, and a label that merely matches is still two independent facts`;
            continue;
        }
        if (!partsChecked.has(part.name)) {
            countFail += `\nkit count: the covered-elsewhere bucket claims \`${covered.manifestKey}\` is covered by the ${part.name} part, but that part's SET EQUALITY AGAINST ITS OWN LISTER WAS NOT PERFORMED in this run (its lister threw above). The coverage claim would rest on a check that did not happen, which is a DIFFERENT fact from a short composition and must not be printed as coverage`;
            continue;
        }
        const schemaEntry = PLUGIN_MANIFEST_COMPONENT_SCHEMA.find((e) => e.manifestKey === covered.manifestKey);
        // A key the schema does not carry is already named by the partition floor's foreign arm above;
        // guarding here keeps this loop from claiming coverage for a key nothing else knows about.
        if (schemaEntry === undefined ||
            !schemaEntry.probeDirs.some((d) => part.prefix === `${d}/`)) {
            countFail += `\nkit count: the covered-elsewhere bucket claims \`${covered.manifestKey}\` is covered by the ${part.name} part, whose prefix ${part.prefix} is NOT one of the probe directories the schema gives that key (${schemaEntry === undefined ? "the key is not in the schema at all" : schemaEntry.probeDirs.join(", ")}). The coverer resolves to a real lister of a DIFFERENT surface, so the key would be excluded from the forbidden set on coverage that scans somewhere else`;
            continue;
        }
        const inScan = SPAWN_GRANT_SCAN.filter((f) => f.startsWith(part.prefix));
        if (inScan.length === 0) {
            countFail += `\nkit count: the covered-elsewhere bucket claims \`${covered.manifestKey}\` is covered by the ${part.name} part, but the spawn-grant scan composition holds ZERO members under ${part.prefix}. "The set was empty, therefore everything in it is scanned" is the vacuous pass this bucket exists to make impossible`;
            continue;
        }
        coveredLabels.push(`${covered.manifestKey} by the ${part.name} part's lister ${part.list.name}, ${inScan.length} member(s) of it in the scan`);
    }
    // (Plan 27-42, D-50) BOTH BUCKET CARDINALITIES, TWO-SIDED, IN THE GATE — where they stop a release.
    //
    // Six sibling sets in scripts/kit-model.ts are pinned two-sided by the GUARD; these two were pinned
    // only by vitest, so the exemption's own recorded promote trigger ("a SECOND directory needing
    // exemption") fired in CI and not here. Measured on hermetic mirrors of the committed build before
    // this change: a second exemption and a second covered-elsewhere entry each left the gate at exit 0
    // printing ALL CHECKS PASSED, and an emptied exempt bucket left guard_kit_counts PASSING with
    // `0 exempt by name ()`.
    if (PLUGIN_COMPONENT_COVERED_ELSEWHERE.length !==
        PLUGIN_COMPONENT_COVERED_ELSEWHERE_COUNT) {
        countFail += `\nkit count: the covered-elsewhere bucket holds ${PLUGIN_COMPONENT_COVERED_ELSEWHERE.length} entr(ies), expected exactly ${PLUGIN_COMPONENT_COVERED_ELSEWHERE_COUNT} (derived: ${coveredKeys.join(", ")}) — every entry EXCLUDES a plugin-root component key from the forbidden set, and an emptied bucket is the vacuous direction while a second entry is the widening one; walk the bucket partition, pluginForbiddenComponentKeys(), the coverer resolution above and guard_wr05's plugin-root component probe BEFORE updating PLUGIN_COMPONENT_COVERED_ELSEWHERE_COUNT in scripts/kit-model.ts`;
    }
    if (PLUGIN_COMPONENT_EXEMPT.length !== PLUGIN_COMPONENT_EXEMPT_COUNT) {
        countFail += `\nkit count: the exempt-by-name bucket holds ${PLUGIN_COMPONENT_EXEMPT.length} entr(ies), expected exactly ${PLUGIN_COMPONENT_EXEMPT_COUNT} (derived: ${exemptKeys.join(", ")}) — the bucket's own recorded promote trigger is A SECOND DIRECTORY NEEDING EXEMPTION, because two hand-listed members is a list and this repository's record says a hand-maintained list rots; walk the bucket partition, pluginExemptComponentEntries()' schema-membership throw and guard_wr05's two exemption bounds, and decide whether a by-name bucket is still the right shape, BEFORE updating PLUGIN_COMPONENT_EXEMPT_COUNT in scripts/kit-model.ts`;
    }
    if (countFail === "") {
        // (Plan 27-37, D-47 item 1) WHY `each part set-equal to its own lister` IS NOW LITERALLY TRUE
        // WHENEVER THIS LINE IS PRINTED, and why no wording change was needed to make it so.
        //
        // The clause was NOT false as written; it was UNGROUNDED. The only state that could falsify it —
        // a part whose lister threw, so its equality was never performed — used to be swallowed by the
        // catch above and left `countFail` empty, so this line printed and claimed the skipped check.
        // That catch now appends to `countFail`, which makes this branch UNREACHABLE in exactly that
        // state. The claim is therefore true by construction rather than by hope, and the fix is
        // structural (the falsifying state routes to the failure channel) rather than a hedge in the
        // wording. A PASS line must never state a check that was not performed.
        pass(`kit counts: derived ${ROLE_FILES.length} roles, ${WORKFLOW_FILES.length} workflows, ${SKILL_ADAPTERS.length} skill adapters and ${PLUGIN_SKILL_RELS.length} plugin-form skill adapters (expected ${ROLE_COUNT} / ${WORKFLOW_COUNT} / ${SKILL_ADAPTER_COUNT} / ${PLUGIN_SKILL_ADAPTER_COUNT}); ${roleDisplayNames === null ? 0 : roleDisplayNames.length} role and ${workflowDisplayNames === null ? 0 : workflowDisplayNames.length} workflow DISPLAY names derived from their headings (expected ${ROLE_COUNT} / ${WORKFLOW_COUNT}); the spawn-grant scan composition holds exactly ${SPAWN_GRANT_SCAN.length} members (${partBreakdown}), each part set-equal to its own lister; the plugin-manifest component schema carries ${schemaKeys.length} entries partitioned into ${pluginForbiddenComponentKeys().length} forbidden + ${coveredKeys.length} covered-elsewhere (${coveredLabels.join(", ")}) + ${exemptKeys.length} exempt by name (${exemptKeys.join(", ")})`);
    }
    else {
        fail(`kit-count violation:${countFail}`);
    }
}
// ---------------------------------------------------------------------------
// guard_distribution_pair — the two distribution forms of one skill are byte-identical modulo the
// `name` value (Phase 27 / plan 27-34, D-40 point 3).
//
// grugops ships every command skill TWICE: the standalone `.claude/skills/grugops-<n>/SKILL.md` form
// that gives an un-namespaced `/grugops-<n>` command, and the plugin `skills/<n>/SKILL.md` form the
// platform namespaces as `/grugops:<n>`. The two are hand-maintained near-mirrors, which is exactly
// the shape that has now drifted TWICE inside this phase alone: the install/uninstall derivation pair
// (D-28, CR-02 — a symlinked adapter installed and never removed) and the RUNNABLES/RUNNABLES_MIRROR
// pair (WR-04 — files installed with no removal side at all). Two hand-synced copies of one artifact
// do not stay synced; the only question is which direction the drift goes and how long it stays green.
//
// So the relationship is asserted MECHANICALLY rather than left as a convention. Measured on the live
// tree today: all six command skills are byte-identical to their standalone twins after swapping the
// value of the `name` key, and one pair legitimately is not.
//
// THE NORMALIZATION IS A REWRITE, NEVER A DELETION, AND THAT IS THE WHOLE POINT. "Drop the `name` line
// from both sides before comparing" satisfies every same-name control in this guard identically while
// ACCEPTING a plugin form whose declared name is simply wrong — and a wrong `name` on a skill is not
// cosmetic, it is the command a user types. So each side's declared name is asserted against the name
// its own directory implies FIRST, and only then is the plugin form's name line rewritten to the
// twin's and the two documents compared byte for byte. A discriminating case plants a third, arbitrary
// name and requires a red; it is the case that makes this rule mean anything.
//
// THE NAMING RULE, and what it deliberately refuses. A plugin skill at `skills/<d>/SKILL.md` maps to
// `.claude/skills/grugops-<d>/SKILL.md`, except the root skill whose own name IS the namespace
// (`skills/grugops/` -> `.claude/skills/grugops/`). A NESTED plugin skill maps to a twin directory
// that does not exist and is reported as a MISSING TWIN rather than skipped — a pair the rule cannot
// express is a finding, never a silence, which is this module's standing posture.
//
// A missing twin, a divergent pair and a ZERO-PAIR RUN are three distinct named findings. The
// zero-pair arm exists because this guard's membership is derived: an empty plugin tree would
// otherwise make it report a clean pass over nothing, which is the vacuity every derived set in this
// file is guarded against.
// ---------------------------------------------------------------------------
// THE EXEMPTION, BY NAME, WITH ITS REASON AND ITS BOUND RECORDED.
//
// `skills/grugops/SKILL.md` and `.claude/skills/grugops/SKILL.md` differ by a measured 448 bytes, and
// the difference is legitimate: the STANDALONE form carries a fenced kit-root resolver block ("Resolve
// the kit root (this adapter is the sole resolver)" — the installer writes the absolute kit path above
// it, with a `GRUGOPS_HOME` self-heal fallback) that the plugin form does not need, because a plugin
// is installed to a known cache root. The pair rule therefore cannot hold for it, and exempting it BY
// NAME is a considered decision rather than an oversight.
//
// THE BOUND: the exemption forgoes ONLY the mirror assertion. The exempted file remains a member of
// SPAWN_GRANT_SCAN, so its spawn grant is still checked exactly like every other plugin skill's — a
// case asserts that membership rather than leaving it to be assumed.
//
// THE FORBIDDEN ALTERNATIVE, NAMED SO IT IS NOT REDISCOVERED AS A GOOD IDEA: loosening the comparison
// so this one file passes — comparing only a prefix, only a size, or only the frontmatter — would
// delete the check for ALL SEVEN pairs to accommodate one. That is the failure mode this exemption
// exists to avoid. If the divergence ever becomes structural rather than a single block, the answer is
// to widen the EXEMPTION LIST, never to weaken the assertion.
const DISTRIBUTION_PAIR_EXEMPT = ["skills/grugops/SKILL.md"];
// The standalone tree's namespace. `.claude/skills` holds `grugops` itself and `grugops-<n>` for each
// command skill; the plugin tree drops the namespace because the platform supplies it.
const STANDALONE_NAMESPACE = "grugops";
// Rewrite the ONE `name: <from>` line to `name: <to>`, returning null if that exact line is not
// present. A mechanical splice, deliberately not a second frontmatter grammar: the VERDICT-bearing
// facts (how many `name` values a document declares, and what they are) come from parseFrontmatter,
// the one authority. This only performs the edit those facts have already licensed, and fails closed
// if it cannot find the line to edit.
function rewriteNameLine(src, from, to) {
    const lines = src.split("\n");
    const at = lines.indexOf(`name: ${from}`);
    if (at === -1)
        return null;
    lines[at] = `name: ${to}`;
    return lines.join("\n");
}
function guardDistributionPair() {
    process.stdout.write("\n[guard_distribution_pair] plugin-form and standalone skills are byte-identical modulo the `name` value (D-40)\n");
    let pairFail = "";
    let compared = 0;
    let exempted = 0;
    const pluginPrefix = spawnGrantScanPrefix("plugin-skill");
    for (const rel of PLUGIN_SKILL_RELS) {
        const pluginRel = `${pluginPrefix}${rel}`;
        if (DISTRIBUTION_PAIR_EXEMPT.includes(pluginRel)) {
            exempted += 1;
            continue;
        }
        const dir = rel.slice(0, rel.lastIndexOf("/"));
        const twinDir = dir === STANDALONE_NAMESPACE ? dir : `${STANDALONE_NAMESPACE}-${dir}`;
        const twinRel = `${SKILL_DIR}/${twinDir}/SKILL.md`;
        if (!fileExists(twinRel)) {
            pairFail += `\n${pluginRel}: its standalone twin ${twinRel} does not exist — a pair with a missing side is a FINDING, never a skipped comparison; the two distribution forms of one skill must both ship or neither must`;
            continue;
        }
        const pluginSrc = readText(pluginRel);
        const twinSrc = readText(twinRel);
        // (27-65 / D-64 Part A) MOVED TO THE ADMISSION READER, AND THE REASON IS WRITTEN AT THE SITE.
        //
        // "How many `name` values does each side declare, and what are they" is a VERDICT — the value
        // decides whether the pair is compared at all, and which bytes the normalization rewrites. A
        // verdict read through the demoted parser is a verdict rendered by the module D-64 retires, so it
        // moves here with the other three.
        //
        // AND THIS GUARD IS DELIBERATELY KEPT RATHER THAN REMOVED. Plan 27-64 made the seven standalone
        // twins GENERATED and byte-gated by `freshness:skill-twins`, so the byte-gate now answers this
        // guard's question more strongly than this guard does: a hand-edited twin fails freshness before
        // it reaches here. That makes this check redundant, not wrong — and THIS ROUND REMOVES NOTHING.
        // Removing a redundant safety check in the same round that moves the verdict mechanism would mean
        // the round changed two things and could only prove one. If it is ever retired, that is its own
        // decision with its own evidence.
        const pluginParsed = admit(pluginSrc);
        const twinParsed = admit(twinSrc);
        if (!pluginParsed.ok) {
            pairFail += `\n${pluginRel}: frontmatter is NOT in the canonical form [${pluginParsed.code}] — ${pluginParsed.reason}. An unreadable side is NEVER read as "the pair matches"`;
            continue;
        }
        if (!twinParsed.ok) {
            pairFail += `\n${twinRel}: frontmatter is NOT in the canonical form on the standalone twin of ${pluginRel} [${twinParsed.code}] — ${twinParsed.reason}. An unreadable side is NEVER read as "the pair matches"`;
            continue;
        }
        const pluginNames = admittedValuesFor(pluginParsed.value, "name");
        const twinNames = admittedValuesFor(twinParsed.value, "name");
        if (pluginNames.length !== 1 || twinNames.length !== 1) {
            pairFail += `\n${pluginRel}: the pair declares ${pluginNames.length} and ${twinNames.length} \`name\` value(s) (plugin, standalone) — the normalization rewrites exactly one name line per side, so anything other than one answer per side is refused rather than guessed at`;
            continue;
        }
        // THE VALUE ASSERTION THAT MAKES THE NORMALIZATION MEAN SOMETHING. Each side must already declare
        // the name its own directory implies. Without this, rewriting the plugin form's name to the twin's
        // would launder a WRONG plugin name into a passing comparison — and the plugin name is the command
        // a user types.
        if (pluginNames[0] !== dir) {
            pairFail += `\n${pluginRel}: declares \`name: ${pluginNames[0]}\`, expected \`name: ${dir}\` — the plugin form's name is the command the platform namespaces, so a wrong value is a wrong command, and normalizing it away would hide exactly that`;
            continue;
        }
        if (twinNames[0] !== twinDir) {
            pairFail += `\n${twinRel}: declares \`name: ${twinNames[0]}\`, expected \`name: ${twinDir}\` — the standalone form's name is the command a user types directly`;
            continue;
        }
        const normalized = rewriteNameLine(pluginSrc, pluginNames[0], twinNames[0]);
        if (normalized === null) {
            pairFail += `\n${pluginRel}: the \`name: ${pluginNames[0]}\` line could not be located for normalization — the parser reports one value the text does not express as a plain line, so the comparison is refused rather than performed on an unnormalized document`;
            continue;
        }
        compared += 1;
        if (normalized !== twinSrc) {
            pairFail += `\n${pluginRel} and ${twinRel} DIVERGE beyond the \`name\` value (${pluginSrc.length}B vs ${twinSrc.length}B) — the two distribution forms of one skill are hand-maintained near-mirrors, and a hand-synced pair is the drift class that already produced CR-02 and WR-04 inside this phase. Re-sync the pair, or add it to DISTRIBUTION_PAIR_EXEMPT with its reason recorded; do NOT loosen this comparison`;
        }
    }
    if (compared === 0) {
        pairFail += `\nthe pair rule compared ZERO pairs (${exempted} exempted, ${PLUGIN_SKILL_RELS.length} plugin-form skill(s) derived) — a run that compared nothing is the anomaly, never "no pairs to check, therefore fine"${PLUGIN_SKILL_DERIVATION.error === "" ? "" : `\n  derivation error: ${PLUGIN_SKILL_DERIVATION.error}`}`;
    }
    if (pairFail === "") {
        // Report BOTH numbers — the established "a guard reports what it checked" convention. A line
        // reading `1 pair compared` is then visible as the anomaly it is instead of hiding behind PASS.
        pass(`D-40: ${compared} plugin/standalone skill pair(s) byte-identical after normalizing the \`name\` value, ${exempted} exempted by name (${DISTRIBUTION_PAIR_EXEMPT.join(", ")} — the standalone form carries a kit-root resolver block the plugin form does not need; the exempted file is still inside the spawn-grant scan)`);
    }
    else {
        fail(`D-40 distribution-pair violation:${pairFail}`);
    }
}
// ---------------------------------------------------------------------------
// guard_voice — voice-discipline lint over the curated clear-voice surfaces.
//
// Section-scoped, never whole-file: role bodies legitimately mix a fenced `## Caveman prompt`
// (intentionally caveman) with clear-voice sections. Strip the SINGLE fenced `## Caveman prompt`
// block, then grep the remainder for caveman markers.
// ---------------------------------------------------------------------------
// The role files, DERIVED (Phase 27, KIT-01) — no longer a hand-listed array. kit-model.listRoles()
// reads `<ROOT>/agent-factory/roles` and drops every `_`-prefixed entry, so
// `_role-switch-protocol.md` is excluded BY THE RULE rather than by omission from a list (it has no
// `## Caveman prompt` block, which is why the exclusion is correct). This same derived set is the
// scan set for all four role consumers: guard_voice, guard_caveman_preserved, guard_role_size, and
// guard_context_writes via CTX_SCAN. Add role #18 and all four see it in the same run.
//
// ROOT is passed EXPLICITLY (D-22): kit-model reads no environment variable, so CHECK_ROOT keeps
// working as this gate's single override and the hermetic mirror harness still resolves correctly.
//
// The derivation THROWS on an unreadable or empty roles directory (D-21 tier 1). Catch it here and
// exit non-zero naming the directory: without a role corpus no role guard can report anything but a
// vacuous PASS, so the gate must stop rather than continue over an empty set.
let ROLE_FILES;
let WORKFLOW_FILES;
try {
    ROLE_FILES = listRoles(ROOT).map((f) => `agent-factory/roles/${f}`);
    WORKFLOW_FILES = listWorkflows(ROOT);
}
catch (e) {
    process.stdout.write(`  FAIL  kit derivation failed: ${e.message}\n`);
    process.stdout.write("\n== Result ==\n1 CHECK(S) FAILED\n");
    process.exit(1);
}
// SEC_VOICE_FILES (D-10, Phase 14) — the NON-role security surfaces. They have NO
// `## Caveman prompt` fence, so the fence-strip is a harmless no-op and they are scanned WHOLE.
// `security-nfr.md` is ALREADY in ROLE_FILES — do NOT add it here.
// (Phase 24) The third entry, agent-factory/handoffs/security-nfr-handoff.md, was DROPPED: the 17
// static handoff templates were deleted (the shared verified-context notes replaced the relay), so
// the deleted security-nfr handoff is no longer a voice surface. The two surviving security
// surfaces (the workflow + the checklist) still carry the clear-voice security content the guard
// enforces.
const SEC_VOICE_FILES = [
    "agent-factory/workflows/15-security-audit.md",
    "agent-factory/checklists/security-nfr-checklist.md",
];
const VOICE_FILES = [...ROLE_FILES, ...SEC_VOICE_FILES];
// WHICH VOICE SURFACES CARRY A CAVEMAN FENCE, DECLARED RATHER THAN INFERRED (plan 29-01).
//
// SEC_VOICE_FILES's comment above has always asserted "they have NO `## Caveman prompt` fence", and
// nothing enforced it. Under the one reader that assertion has to become mechanical, because a
// `missing` verdict means two different things depending on which surface produced it: on a ROLE
// file it is a defect (the block is required, and guard_caveman_voice names it), and on a security
// surface it is the declared shape (the whole document IS the clear-voice remainder).
//
// This is a NAMED expectation pair, not a silent `continue`: the two-sided form means a security
// surface that GAINS a fence is a finding too, so the declaration cannot quietly go stale.
const EXPECTS_CAVEMAN_FENCE = new Set(ROLE_FILES);
// (Plan 29-01, D-22/D-23) `stripCavemanBlock` and its `__UNCLOSED_CAVEMAN_FENCE__` sentinel were
// DELETED here rather than kept as a second opinion, and `VOICE_MARKERS` went with them. Both are
// now `readCavemanFence` + `CAVEMAN_LEXICON` in scripts/voice-model.ts — see this file's import
// header for the measured divergence that made the duplicate untenable. A weaker duplicate that
// still votes is worse than none, which this file's own guard_wr05 header already argues at length.
// D-05 marker refinement: neutralize the three verified clear-voice grug phrasings (`/grug`
// brand command, "grug voice", "grug wink") per-phrase so a senior rewrite introducing NEW
// clear-voice grug prose stays green, while a bare `grug smash` on the SAME line STILL trips.
// `BRANDCMD`/`voice-meta`/`wink-meta` are marker-free fillers. Order matters: `/grug` first so
// "grug voice"/"grug wink" still match their own gsub AFTER the `/grug` rewrite (the `/` prefix
// rewrites only `/grug`, not a bare `grug voice`).
function neutralizePhrases(text) {
    return text
        .split("\n")
        .map((line) => line
        .replace(/\/grug/g, "BRANDCMD")
        .replace(/grug voice/g, "voice-meta")
        .replace(/grug wink/g, "wink-meta"))
        .join("\n");
}
function guardVoice() {
    process.stdout.write("\n[guard_voice] clear-voice surfaces free of caveman markers (section-scoped)\n");
    let voiceFail = "";
    for (const f of VOICE_FILES) {
        // Missing-file structured fail (CR-02): a missing voice file produces a nonzero-exit finding
        // that NAMES the file, not a raw abort.
        if (!fileExists(f)) {
            voiceFail += `\n${f}: required voice file missing`;
            continue;
        }
        // (Plan 29-01, D-22/F-5.1) THE ONE READER. This migration happens in the SAME plan that ships
        // the reader, deliberately: leaving the old stripper live while the new reader shipped is exactly
        // the two-grammar defect this closes, and the rewritten caveman blocks become maximally grug in
        // later plans — so a disagreement between two readers would leak a lexicon token into the
        // "remainder" and fail this guard RED on correct text.
        const text = readText(f);
        const verdict = readCavemanFence(text);
        const expectsFence = EXPECTS_CAVEMAN_FENCE.has(f);
        let body;
        if (verdict.ok) {
            if (!expectsFence) {
                voiceFail += `\n${f}: a ## Caveman prompt fence appeared on a surface declared to carry none (SEC_VOICE_FILES) — the declaration and the file disagree`;
            }
            body = verdict.outside;
        }
        else if (verdict.reason === "missing" && !expectsFence) {
            // The declared shape for a security surface: no caveman anchor at all, so the WHOLE document
            // is the clear-voice remainder and is scanned whole. This is the only branch that treats a
            // refusal as expected, it is scoped to a named set, and it states its reason.
            body = text;
        }
        else {
            // Every other refusal — on a role file, or any malformed fence anywhere — is a finding NAMING
            // THE REASON. guard_caveman_voice below names the same file with the same reason, from the
            // same verdict, which is LANG-07's actual acceptance evidence: not that one reader exists, but
            // that both consumers reach an identical verdict on identical bytes.
            voiceFail += `\n${f}: ## Caveman prompt fence refused — reason ${verdict.reason}; the clear-voice remainder was not determined, so this file was NOT scanned`;
            continue;
        }
        // D-05 marker refinement (a SEPARATE pass — does NOT touch the fence anchor above).
        body = neutralizePhrases(body);
        // grep -nE: collect `lineno:line` for every line carrying a CAVEMAN_LEXICON term. Membership is
        // tested through voice-model's own counter, so this guard cannot come to disagree with the
        // lexicon about what a hit is; it declares no voice literal of its own.
        const m = [];
        const bodyLines = body.split("\n");
        for (let i = 0; i < bodyLines.length; i++) {
            if (countLexiconTokens(bodyLines[i]) > 0)
                m.push(`${i + 1}:${bodyLines[i]}`);
        }
        if (m.length > 0) {
            voiceFail += `\n${f}:\n${m.join("\n")}`;
        }
    }
    if (voiceFail === "") {
        pass("voice: clear-voice surfaces free of caveman markers");
    }
    else {
        fail(`voice-discipline violation:${voiceFail}`);
    }
}
function guardCavemanVoice() {
    process.stdout.write("\n[guard_caveman_voice] every role's caveman block carries >= " +
        `${CAVEMAN_LEXICON_MIN} of the ${CAVEMAN_LEXICON.length} committed lexicon terms AND zero banned constructions — both arms required (D-06, D-07, D-08)\n`);
    const findings = [];
    let visited = 0;
    for (const f of ROLE_FILES) {
        // Every role file the loop looks at counts as VISITED, including one that has gone missing since
        // the corpus was derived: the denominator floor below measures whether the SCAN SET is short,
        // and an unreadable member is a finding rather than a silently smaller denominator.
        visited += 1;
        const name = basename(f);
        if (!fileExists(f)) {
            findings.push({
                file: f,
                detail: "required role file missing — no caveman block could be read",
            });
            continue;
        }
        const verdict = readCavemanFence(readText(f));
        if (!verdict.ok) {
            findings.push({
                file: f,
                detail: `## Caveman prompt fence refused — reason ${verdict.reason}`,
            });
            continue;
        }
        const tokens = countLexiconTokens(verdict.inside);
        const words = countContentWords(verdict.inside);
        const banned = countBannedConstructions(verdict.inside);
        const bannedTotal = banned.article + banned.copula + banned.modal + banned.subordinator;
        // The per-block measurement line, emitted INSIDE the loop and BEFORE the fold — so a vacuous run
        // prints zero detail lines AND fails its own count assertion (D-08).
        process.stdout.write(`        ${name}: tokens ${tokens} / content words ${words}, banned ${bannedTotal}\n`);
        // THE CONJUNCTION. Both must hold; a finding is recorded when EITHER fails.
        const positiveHolds = tokens >= CAVEMAN_LEXICON_MIN;
        const negativeHolds = bannedTotal === 0;
        if (!(positiveHolds && negativeHolds)) {
            const why = [];
            if (!positiveHolds) {
                why.push(`positive arm: ${tokens} lexicon term(s), needs >= ${CAVEMAN_LEXICON_MIN}`);
            }
            if (!negativeHolds) {
                why.push(`negative arm: ${bannedTotal} banned construction(s) (article ${banned.article}, copula ${banned.copula}, modal ${banned.modal}, subordinator ${banned.subordinator}), needs 0`);
            }
            findings.push({ file: f, detail: why.join("; ") });
        }
    }
    const measured = {
        label: "caveman voice",
        visited,
        // The denominator is the INDEPENDENTLY derived cardinality, never ROLE_FILES.length — comparing
        // the scan set against its own length is a comparison of one number with itself.
        expected: ROLE_COUNT,
        findings,
    };
    FAILS += reportMeasured(measured, { pass, fail }, (x) => `  ${x.file}: ${x.detail}`);
}
function guardRoleClauseUniqueness() {
    process.stdout.write("\n[guard_role_clause_uniqueness] no normalized clause repeats within a single role file — intra-file only (D-20, D-21, D-38)\n");
    const findings = [];
    let visited = 0;
    for (const f of ROLE_FILES) {
        visited += 1;
        if (!fileExists(f)) {
            findings.push({ file: f, clause: "(file missing)", count: 0, lines: [] });
            continue;
        }
        // Insertion order of a Map is first-occurrence order, so the groups below are reported in
        // first-occurrence line order within the file, and files arrive in listRoles() sorted order —
        // which makes the whole finding set byte-diffable across runs.
        const groups = new Map();
        for (const { clause, line } of segmentClauses(readText(f))) {
            const seen = groups.get(clause);
            if (seen)
                seen.push(line);
            else
                groups.set(clause, [line]);
        }
        for (const [clause, lines] of groups) {
            if (lines.length > 1) {
                findings.push({ file: f, clause, count: lines.length, lines });
            }
        }
    }
    const measured = {
        label: "role clause uniqueness",
        visited,
        expected: ROLE_COUNT,
        findings,
    };
    FAILS += reportMeasured(measured, { pass, fail }, (x) => `  ${basename(x.file)}: "${x.clause}" x${x.count} at line(s) ${x.lines.join(", ")}`);
}
// ---------------------------------------------------------------------------
// guard_role_size — per-role byte ceiling, byte-for-byte mirror of guard_adapter_size (D-07).
//
// PER-FILE documented constants (NOT a flat number, NOT computed live). Each role gets its OWN
// two-tier WARN->FAIL ceiling, hard-coded from the 2026-06-10 baseline: FAIL = baseline + 12%,
// WARN = baseline + 6% (ba-pm.md = +20% / +12% PERS-02 headroom). Looked up via a switch since the
// ceilings are locked, not derived. CR-01 missing-file fail-red.
// ---------------------------------------------------------------------------
// Per-role FAIL/WARN ceilings keyed by basename → "FAIL WARN" (verbatim from the .sh case table).
//
// D-17 (Phase 27): this table is DELIBERATELY NOT derived from kit-model.ts, and a later phase must
// not "fix" it. It is a per-file MEASUREMENT BASELINE, not a discovery set — each value is a measured
// byte count plus a documented margin, which no directory listing can produce. It also already fails
// CLOSED on an unknown role (the `default: return ""` branch makes guard_role_size fail red naming
// the file), so deriving it would convert a fail-closed table into a silently-widening one: role #18
// would arrive with an automatic ceiling instead of forcing an author to measure and record one.
function roleCeiling(base) {
    switch (base) {
        case "orchestrator.md":
            return "7570 7165"; // +Phase-13 routing; measured 6759 B
        case "security-nfr.md":
            return "5102 4830"; // +Phase-14 D-09 severity-map; measured 4556 B
        case "compliance-officer.md":
            return "4813 4555"; // +Phase-22 WF18 pointer (baseline 4297 B, +12% / +6%)
        case "release-manager.md":
            return "4765 4510"; // +Phase-22 WF18 pointer (baseline 4254 B, +12% / +6%)
        case "agents-md-scribe.md":
            return "4544 4301"; // +Phase-22 WF18 pointer (baseline 4057 B, +12% / +6%)
        case "architect-design.md":
            return "4243 4016"; // +Phase-22 WF18 pointer (baseline 3788 B, +12% / +6%)
        case "ba-pm.md":
            return "4180 3901"; // PERS-02 BA headroom (+20% / +12%); +Phase-21 WF16 pointer (baseline 3483 B)
        case "factory-coach.md":
            return "3839 3633"; // +Phase-21 WF16 pointer (baseline 3427 B, +12% / +6%)
        case "frontend-ui.md":
            return "3969 3757"; // Phase 13 — 17th role (UI-01)
        case "incident-responder.md":
            return "3802 3598"; // +Phase-21 WF16 pointer (baseline 3394 B, +12% / +6%)
        case "installer.md":
            return "3938 3727"; // +Phase-22 WF18 pointer (baseline 3516 B, +12% / +6%)
        case "software-engineer.md":
            return "3906 3697"; // +Phase-21 WF16 pointer (baseline 3487 B, +12% / +6%)
        case "qe-e2e.md":
            return "3822 3617"; // +Phase-21 WF16 pointer (baseline 3412 B, +12% / +6%)
        case "uat-planner.md":
            return "3540 3350"; // +Phase-21 WF16 pointer (baseline 3160 B, +12% / +6%)
        case "system-analyst.md":
            return "3170 3000"; // +Phase-21 WF16 pointer (baseline 2830 B, +12% / +6%)
        case "greenfield-mapper.md":
            return "3045 2882"; // +Phase-21 WF16 pointer (baseline 2718 B, +12% / +6%)
        case "brownfield-mapper.md":
            return "2845 2693"; // +Phase-21 WF16 pointer (baseline 2540 B, +12% / +6%)
        default:
            return "";
    }
}
function guardRoleSize() {
    process.stdout.write("\n[guard_role_size] roles stay terse — senior != verbose (per-file byte ceiling, D-07)\n");
    for (const f of ROLE_FILES) {
        // CR-01 missing-file fail-red: a deleted role must fail red naming the path.
        if (!fileExists(f)) {
            fail(`${f} missing (role required)`);
            continue;
        }
        const base = basename(f);
        const ceil = roleCeiling(base);
        if (ceil === "") {
            fail(`${f} has no documented ceiling (unknown role — update role_ceiling)`);
            continue;
        }
        const rfail = Number(ceil.split(" ")[0]);
        const rwarn = Number(ceil.split(" ")[1]);
        const b = byteLen(f);
        if (b >= rfail) {
            fail(`${f} ${b}B >= ${rfail}B — role bloated (senior != verbose)`);
        }
        else if (b >= rwarn) {
            warn(`${f} ${b}B >= ${rwarn}B — approaching ceiling`);
        }
        else {
            pass(`${f} ${b}B within ceiling`);
        }
    }
}
// ---------------------------------------------------------------------------
// guard_context_writes — shared context written ONLY via context-io.ts (SCTX-05, Phase 20).
//
// Clone of guardWr05()'s shape (D-09): an explicit SCAN set (NEVER a repo-wide grep), the shared
// grepFiles() helper, pass()/fail() folding into the shared FAILS counter, clear voice. It detects
// a raw context-write that bypasses the sanctioned context-io.ts helpers — a `.grugops/context/`
// path co-occurring on the SAME line with a real write TOKEN: writeFileSync / appendFileSync / the
// `Write` tool token (capital-W word boundary) / a shell `>`|`>>` redirect / an `echo` redirect.
//
// CALIBRATION (RESEARCH Assumption A3 — exactly the token-vs-prose care guard_wr05 needed): the
// regex requires BOTH the path AND a write token, in EITHER order, on one line. It therefore FIRES
// on a planted `writeFileSync('.grugops/context/...')` or `echo ... >> .grugops/context/...`, but
// does NOT fire on legitimate prose that merely NAMES the helper or the path — e.g. "roles never
// raw-write `.grugops/context/` — they call context-io.ts" (the prose word "write" is not a TOKEN;
// only `\bWrite\b`/`writeFileSync`/`appendFileSync`/a redirect/`echo` count). The real-tree smoke
// test (no shipped role/workflow does a raw write) is the forcing function keeping the regex tuned.
// ---------------------------------------------------------------------------
// The context path fragment, separator-agnostic (`/` or `\`). Used in both halves of the alternation.
const CTX_PATH = String.raw `\.grugops[\\/]context[\\/]`;
// A genuine write TOKEN — NOT the prose word "write". `\bWrite\b` is the (capital-W) Claude `Write`
// tool token; `>`/`>>` and `echo` are shell-redirect writes. Bare lowercase "write" is excluded.
// The `>>?` redirect is guarded by a negative lookbehind so it does NOT fire on an ASCII arrow
// (`-> .grugops/context/`, `=> …`, `<- …`) that merely NAMES the path in prose — those are a
// false-positive raw-write, never a real redirect (WR-03). A genuine `echo … >> path` still matches
// (its `>` is preceded by whitespace). A leading blockquote `> path` remains textually identical to a
// redirect, so the guard still errs on the safe side there (a false-POSITIVE, never a bypass).
const CTX_TOKEN = String.raw `writeFileSync|appendFileSync|\bWrite\b|(?<![-<=])>>?|\becho\b`;
// FIRE when the path and a write token co-occur on one line, in EITHER order (token-then-path for
// `writeFileSync('.grugops/context/...')`; path-then-token for `... .grugops/context/... >> file`).
const CTX_WRITE_RE = new RegExp(`(${CTX_PATH}.*(${CTX_TOKEN}))|((${CTX_TOKEN}).*${CTX_PATH})`);
// Bounded SCAN set: the 17 derived role files (reuse ROLE_FILES) + the 19 derived workflow files.
// These are the files that may legitimately MENTION the context path in prose; the guard ensures any
// such mention is never a raw-write bypass. NEVER a repo-wide grep (mirrors guard_wr05's bounded
// adapter/packaging scan set).
//
// (Phase 27 / KIT-02, D-16) DERIVED from listWorkflows(ROOT) — the same KIT-01 authority ROLE_FILES
// uses, with ROOT passed explicitly (D-22). This is a genuine COVERAGE INCREASE, not a refactor: the
// hand-listed array enumerated 16 of the 19 shipped workflows, so 16-context-read-write.md,
// 17-task-claim.md and 18-context-compaction.md had NEVER been scanned for a raw context write, and
// nothing reported that. Two of those three are the workflows that DEFINE the sanctioned context-io
// path, which is precisely where a bypass would matter most. Workflow #20 will be scanned the day it
// lands, with no edit here.
const CTX_WORKFLOWS = WORKFLOW_FILES.map((f) => `agent-factory/workflows/${f}`);
const CTX_SCAN = [...ROLE_FILES, ...CTX_WORKFLOWS];
function guardContextWrites() {
    process.stdout.write("\n[guard_context_writes] shared context written only via context-io.ts (SCTX-05)\n");
    const hits = grepFiles(CTX_SCAN, CTX_WRITE_RE).join("\n");
    if (hits === "") {
        pass("SCTX-05: no raw context write in shipped role/workflow text (use context-io.ts)");
    }
    else {
        fail(`SCTX-05 raw context write (bypasses context-io.ts):\n${hits}`);
    }
}
// ---------------------------------------------------------------------------
// guard_referential_integrity — KIT-03 / D-09 three-way set equality (Phase 27).
//
// The founding defect of this milestone was a fully green guard suite over a structurally broken
// tree: 17 roles in the kit, ONE adapter file on disk, and a coordinator grant naming SEVEN agents
// of which ZERO resolved to anything. Nothing was checking that those three sets agreed, because
// each guard measured its own set in isolation. This oracle checks the agreement itself:
//
//     grant ∪ {coordinator} == adapters == roles
//
// with NO exception list anywhere. An exception list is how a broken tree stays green — the moment
// one is added, the oracle only proves what someone already believed.
//
// It compares WHOLE SETS and names the DIFFERING MEMBERS, not just cardinalities: a guard that
// reports `17 != 16` tells an author nothing about which element to go find. Cardinalities are
// compared as strict integer equality — there is no tolerance band and no rounding. Set equality
// itself is order-independent, and every reported difference is sorted, so two runs over the same
// broken tree produce byte-identical output.
//
// Fails CLOSED in every degenerate direction, because each of these otherwise reads as a vacuous
// pass: an unreadable adapter directory, an EMPTY adapter directory ("nothing to compare, therefore
// fine" is exactly the bug), a coordinator count that is not exactly one, and a coordinator whose
// grant enumerates nothing (an unscoped `Agent` grant has no computable closure).
//
// The grant closure and the coordinator marker are both read through scripts/frontmatter.ts — the
// SAME module guard_wr05 reads, so the oracle and the guard can never disagree about whether a file
// grants spawn or about which file is the coordinator. (Plan 27-12: this used to filter lines with
// the same two line-anchored expressions guard_wr05 used, which made it the SECOND consumer of one
// broken grammar. A folded-scalar grant was invisible to both simultaneously.) That module runs the
// text through the SHARED stripFencedBlocks() first — never a second fence parser.
// agent-factory/packaging/subagent.frontmatter.md ships a coordinator example INSIDE a fenced block;
// a non-fence-aware parser would read that documentation as a live grant. The coordinator is located
// by the marker, matching how guard_wr05 identifies it — never by filename.
//
// A PARSE FAILURE FAILS THIS ORACLE RED, naming the file. It must NEVER reduce to a zero-length
// closure: the oracle already treats an empty closure as its own failure for a DIFFERENT reason (an
// unscoped grant has nothing to enumerate), and collapsing the two would report the wrong cause and
// hide the unreadable file behind a plausible-looking message.
// ---------------------------------------------------------------------------
// THE ORACLE'S SOUNDNESS DEPENDS ENTIRELY ON THE DERIVATION SEEING WHAT THE PLATFORM LOADS.
//
// This guard compares three sets, and every one of them is now derived from ONE authority
// (scripts/kit-model.ts). That is the whole basis of the claim: an equality over three sets is only
// as true as the sets are complete, and a set that cannot see a file the runtime loads makes the
// equality hold over the wrong members while printing a true-looking PASS.
//
// The specific way this oracle WAS unsound (plan 27-10, closed): it ran its own second, NON-RECURSIVE
// readdir of the adapter directory. Claude Code discovers that directory recursively and takes agent
// identity only from frontmatter, so a live second coordinator planted at `.claude/agents/<sub>/x.md`
// was loaded by the platform, absent from this comparison, and the oracle printed
// "17 roles == 17 adapters == 17 grant-closure names" over a tree carrying eighteen loaded agents.
// The second read is deleted; this guard consumes the same member list guard_adapter_size,
// guard_wr05 and guard_adapter_body consume. A nested entry now compares as its full relative stem
// and so appears in the "adapter with no role file" direction.
//
// ADAPTER_DIR is declared once, up at the adapter derivation — the adapter directory is a single
// fact and this oracle reads the SAME set every other adapter guard scans.
// ---------------------------------------------------------------------------
// IDENTITY HAS ONE AUTHORITY: THE FRONTMATTER `name` KEY. NOTHING ELSE. (CR-02, plan 27-19.)
//
// Claude Code takes agent identity ONLY from frontmatter — this file already says so twice (:537-538,
// :1350-1352) — and the coordinator's grant enumerates AGENT NAMES. But set 2 below is keyed on
// FILENAMES (`adapterFiles.map(stem)`), so the three-way equality mixes two namespaces. Until this
// round nothing asserted the two coincide; guard_wr05's floor at :533-540 checks only that a `name`
// key EXISTS, never what it says.
//
// Reproduced (27-REVIEW-GAPS.md § CR-02). Hermetic mirror of the live tree, one byte-level edit:
//
//     sed -i 's/^name: grugops-installer$/name: totally-different-name/' \
//         $MIRROR/.claude/agents/grugops-installer.md
//     CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
//       PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
//     ALL CHECKS PASSED        (exit 0)
//
// The coordinator's `Agent(…, grugops-installer, …)` there enumerates a name NO INSTALLED AGENT
// CARRIES — the milestone's founding defect, in the one namespace this oracle did not look at, with
// the oracle green.
//
// So: the name-mismatch refusal below runs BEFORE the coordinator lookup and before any set
// comparison. The filename-keyed comparison further down is LEGAL ONLY BECAUSE THAT ASSERTION RAN
// FIRST. If it is ever deleted, the equality silently reverts to a claim about two different sets.
//
// This also settles a surviving SECOND ANSWER to one predicate — this project's first named systemic
// failure class. scripts/coordinator-resolution-precheck.ts:393-403 resolves the same grant closure
// by frontmatter `name` (`installedNames`) and correctly failed on the mirror above, but it is a
// human-invoked precheck while THIS oracle is what CI runs: the weaker answer was the wired one.
// Both consumers now answer "what is an adapter's identity" the same way — the frontmatter `name` —
// so there is no second grammar left to delete, only one mapping asserted at the point where the two
// namespaces meet (D-19: a per-consumer assertion, never a global detector).
//
// Scoped to the BASENAME on purpose. Nested adapters are a separate, already-covered direction:
// `extra/grugops-rogue.md` declaring `name: grugops-rogue` matches its own basename and so is NOT
// caught here — it lands in the existing "adapter with no role file" difference, keyed on its full
// relative stem, exactly as before. Only a file whose declared identity disagrees with its own
// filename is refused here.
// ---------------------------------------------------------------------------
// Every role's agent name is its role filename stem under the `grugops-` namespace:
// `orchestrator.md` -> `grugops-orchestrator`. Comparison is exact JavaScript string equality over
// these names throughout — no case folding, no normalisation, no substring matching.
const AGENT_PREFIX = "grugops-";
const stem = (file) => file.replace(/\.md$/, "");
// Members of `a` absent from `b`, order-independent and sorted for byte-identical reporting.
const missingFrom = (a, b) => a.filter((x) => !b.includes(x)).sort();
function guardReferentialIntegrity() {
    process.stdout.write("\n[guard_referential_integrity] role corpus == adapter directory == coordinator grant closure (KIT-03, D-09)\n");
    // Set 1 — the role corpus, from the KIT-01 derivation.
    const roleNames = ROLE_FILES.map((p) => `${AGENT_PREFIX}${stem(basename(p))}`).sort();
    // Set 2 — the adapter set, from the SAME authority-derived member list the other three guards
    // consume. This guard used to run its own non-recursive readdir here, which is what made its
    // soundness claim false: a nested file was loaded by the platform and invisible to this comparison,
    // so the equality held over the wrong members and printed a true-looking PASS. The fixed adapter
    // subpath is stripped back off so the members are the relative paths, and a nested entry therefore
    // compares as its FULL relative stem — landing in the "adapter with no role file" direction rather
    // than vanishing.
    const adapterFiles = AGENT_ADAPTER_RELS;
    if (adapterFiles.length === 0) {
        // The unreadable and the empty case are now the SAME branch, because the authority distinguishes
        // them in its thrown message and that message NAMES THE DIRECTORY. Reporting it here is the
        // difference between the oracle stating the condition and swallowing it.
        fail(`KIT-03: ${ADAPTER_DIR} yielded no adapter files — an empty or unreadable adapter directory is NEVER "nothing to compare, therefore fine". All ${roleNames.length} role(s) are unbacked: ${roleNames.join(", ")}${AGENT_DERIVATION.error === "" ? "" : `\n  ${AGENT_DERIVATION.error}`}`);
        return;
    }
    const adapterNames = adapterFiles.map(stem).sort();
    // Encoding assertion: every name in the corpus is ASCII today. Asserting it removes any
    // byte-vs-codepoint-vs-normalisation ambiguity from the string comparisons below rather than
    // leaving it latent for a future non-ASCII filename to expose.
    const roleBasenames = ROLE_FILES.map((p) => basename(p));
    const nonAscii = [...roleBasenames, ...adapterFiles].filter((n) => 
    // eslint-disable-next-line no-control-regex
    /[^\x00-\x7F]/.test(n));
    if (nonAscii.length > 0) {
        fail(`KIT-03: non-ASCII byte in a role/adapter filename — set membership is exact string equality and must stay unambiguous: ${nonAscii.sort().join(", ")}`);
        return;
    }
    // The adjacent case the ASCII assertion does not cover: two FILENAMES in the same corpus that
    // differ ONLY by letter case. On a case-insensitive filesystem those two cannot both exist, so one
    // silently replaced the other; on a case-sensitive one they are two distinct agents whose names a
    // reader will confuse. Either way, folding them together would make the equality claim below
    // ambiguous, so the oracle refuses and NAMES BOTH.
    //
    // Compared per corpus (roles among roles, adapters among adapters) rather than across the two:
    // role filenames are bare stems and adapter filenames carry the `grugops-` namespace, so a
    // cross-corpus fold could only ever raise a false alarm. Compared on the FILENAME, not the relative
    // path — that is what makes a nested `extra/grugops-QE-E2E.md` a case variant of a top-level
    // `grugops-qe-e2e.md` rather than two unrelated strings. BYTE-IDENTICAL names are deliberately NOT
    // reported here: two adapters at different depths with the same filename are distinct members, and
    // the set comparison below is what names them.
    const caseVariants = (names) => {
        const folded = new Map();
        for (const n of names) {
            const k = n.toLowerCase();
            if (!folded.has(k))
                folded.set(k, new Set());
            folded.get(k).add(n);
        }
        return [...folded.values()]
            .filter((s) => s.size > 1)
            .map((s) => [...s].sort())
            .sort((a, b) => a[0].localeCompare(b[0]));
    };
    const variantGroups = [
        ...caseVariants(roleBasenames),
        ...caseVariants(adapterFiles.map((rel) => basename(rel))),
    ];
    if (variantGroups.length > 0) {
        fail(`KIT-03: ${variantGroups.length} role/adapter filename(s) differing only by letter case — a case-insensitive filesystem cannot hold both, and a case-sensitive one holds two names a reader will confuse; set membership must stay exact string equality: ${variantGroups.map((g) => g.join(" vs ")).join("; ")}`);
        return;
    }
    // Set 3 — the coordinator grant closure. Locate the coordinator by MARKER, never by filename, and
    // read that marker through the SAME parser guard_wr05 reads. Parse every adapter once, up front:
    // an unreadable frontmatter block is reported HERE, by name, and stops the oracle — it can never
    // silently become "this file is not the coordinator" or "the closure is empty".
    //
    // (27-65 / D-64 Part A) THE SAME PARSER GUARD_WR05 READS IS NOW THE CANONICAL ADMISSION READER, and
    // the sentence above still describes what happens: every refusal is reported HERE, by name, with its
    // enumerated code, and it stops the oracle. A name enumeration that could not read one of its inputs
    // must NEVER be compared for set equality — comparing it would compute the D-09 closure over a set
    // the document does not express, which is the silent-success shape one level down from the refusal.
    const parsedAdapters = new Map();
    const parseFailures = [];
    for (const f of adapterFiles) {
        const parsed = admit(readText(`${ADAPTER_DIR}/${f}`));
        if (!parsed.ok)
            parseFailures.push(`${ADAPTER_DIR}/${f}: [${parsed.code}] ${parsed.reason}`);
        else
            parsedAdapters.set(f, parsed.value);
    }
    if (parseFailures.length > 0) {
        fail(`KIT-03: ${parseFailures.length} adapter(s) whose frontmatter is NOT in the canonical form — an unreadable adapter is NEVER a zero-length grant closure and NEVER a non-coordinator; the set equality cannot be checked over a file that cannot be read:\n    ${parseFailures.sort().join("\n    ")}`);
        return;
    }
    // THE MAPPING ASSERTION THE COMPARISON BELOW SILENTLY ASSUMED (CR-02, plan 27-19). Reads
    // `parsedAdapters` — the map the loop directly above just built — so there is ONE parse per adapter
    // and ONE grammar; runs before the coordinator lookup so no set comparison can precede it.
    //
    // The expected name is the adapter's OWN FILENAME STEM. It is not `AGENT_PREFIX` joined to that
    // stem: an adapter filename ALREADY carries the namespace (`grugops-installer.md`, never
    // `installer.md`) — AGENT_PREFIX is joined once, up at `roleNames`, to the bare ROLE stem, and
    // `adapterNames` deliberately does not re-join it. (The review's suggested patch joined it a second
    // time; that compares against `grugops-grugops-installer` and would fail all seventeen shipped
    // adapters. Recorded here so the next reader does not "restore" it.)
    //
    // Absence and emptiness are reported as THEIR OWN facts, never folded into a plain mismatch. A
    // missing `name` key and a `name:` with nothing after it are two different defects, and printing the
    // same sentence for both is the "one silence for two facts" mistake guard_wr05's floor at :533-540
    // was written to avoid. That floor also reports absence — but this oracle must not depend on another
    // guard's finding to be sound, so it states the fact itself.
    //
    // AND THE CARDINALITY OF THE ANSWER IS PINNED, not just its value. Found by self red-team on this
    // plan's own first draft, which read `declaredValues[0]`: a DUPLICATE `name:` key whose FIRST value
    // matches the filename made the whole gate print ALL CHECKS PASSED over a document declaring two
    // identities —
    //
    //     name: grugops-installer
    //     name: totally-different-name
    //
    // The draft read the first answer and called the mapping proven. That is the same "two answers to
    // one predicate" class this whole round exists to delete, reproduced inside the fix for it: which of
    // the two the platform's YAML loader honours (first, last, or a duplicate-key throw that stops the
    // agent loading at all) is not this oracle's to guess. So a `name` key carrying anything other than
    // EXACTLY ONE value is refused by name.
    //
    // Safe against false reds: the parser JOINS a wrapped plain scalar into a single value
    // (`name: grugops-\n  installer` -> `["grugops- installer"]`), so more than one value means the key
    // genuinely appears more than once. It also already strips quotes, trims trailing whitespace, drops
    // a trailing `# comment` and flattens `>`/`|` scalars — every legitimate spelling of one name
    // arrives here as one value, and none of them is a false red. Verified by probe, plan 27-19.
    const nameMismatch = [];
    for (const f of adapterFiles) {
        const expectedName = stem(basename(f));
        const declaredValues = parsedAdapters.get(f).has("name")
            ? admittedValuesFor(parsedAdapters.get(f), "name")
            : undefined;
        if (declaredValues === undefined) {
            nameMismatch.push(`${ADAPTER_DIR}/${f}: carries NO \`name\` key at all — expected \`name: ${expectedName}\``);
            continue;
        }
        if (declaredValues.length !== 1) {
            nameMismatch.push(`${ADAPTER_DIR}/${f}: declares ${declaredValues.length} \`name\` values (${declaredValues.map((v) => `\`${v}\``).join(", ")}) — identity has ONE authority and must have ONE answer; reading the first would let a matching decoy hide the identity the platform actually loads`);
            continue;
        }
        const declared = declaredValues[0] ?? "";
        if (declared === "") {
            nameMismatch.push(`${ADAPTER_DIR}/${f}: \`name\` key present with an EMPTY value — an empty identity is never a matching one; expected \`name: ${expectedName}\``);
            continue;
        }
        if (declared !== expectedName) {
            nameMismatch.push(`${ADAPTER_DIR}/${f}: declares \`name: ${declared}\`, expected \`name: ${expectedName}\``);
        }
    }
    if (nameMismatch.length > 0) {
        fail(`KIT-03: ${nameMismatch.length} adapter(s) whose frontmatter \`name\` does not equal their own filename stem — the platform resolves the coordinator's grant by NAME while this oracle compares FILENAMES, so the equality below would hold over two different namespaces and a granted name could resolve to no loaded agent while this guard printed a pass:\n    ${nameMismatch.sort().join("\n    ")}`);
        return;
    }
    const coordinators = adapterFiles.filter((f) => admittedKeyHasValue(parsedAdapters.get(f), COORDINATOR_KEY, COORDINATOR_VALUE));
    if (coordinators.length !== 1) {
        fail(`KIT-03: expected exactly one \`coordinator: true\` adapter in ${ADAPTER_DIR}, found ${coordinators.length}${coordinators.length > 0 ? `: ${coordinators.join(", ")}` : " — a zero-coordinator tree is not \"no grant to check, therefore fine\""}`);
        return;
    }
    const coordinatorName = stem(coordinators[0]);
    // (Plan 27-29 / D-32, RE-SITED BY 27-65 / D-64) THE HAND-WRITTEN UNREADABLE-GRANT BRANCH HAS MOVED
    // UP, NOT AWAY. It existed because `keysGrantedAgentNames` returned a RESULT: a grant fragment
    // carrying a backslash sequence outside the escape allowlist was a parse artifact, never "the
    // coordinator granted fewer names", and folding it into the zero-length branch below would compute
    // the D-09 closure equality over a set the document does not express.
    //
    // `admittedGrantedNames` is TOTAL and cannot refuse — deliberately, and the reason is the whole
    // point of the cutover. It runs over a document that has ALREADY been admitted, and admission is
    // what establishes the invariants it relies on: the plain-scalar alphabet contains no backslash, no
    // quote and no flow delimiter, so the comma is reliably the separator the document wrote and an
    // enumeration can neither truncate nor split a name. A failure arm here would be a THIRD OUTCOME BY
    // ANOTHER NAME, which is exactly what D-64 retires.
    //
    // So the condition this branch guarded is not unchecked; it is checked EARLIER AND MORE WIDELY, at
    // the refusal loop above, where a document carrying such a fragment never becomes an admitted
    // document at all. That loop fails the oracle by name and returns before any set equality is
    // computed. `check-foundation-guards.test.ts` pins that path at the GATE rather than trusting this
    // comment.
    const granted = admittedGrantedNames(parsedAdapters.get(coordinators[0]));
    if (granted.length === 0) {
        fail(`KIT-03: the coordinator ${ADAPTER_DIR}/${coordinators[0]} carries no ENUMERATED Agent(...) grant — an unscoped grant has no computable closure, so the D-09 equality cannot be checked`);
        return;
    }
    const grantClosure = [...new Set([...granted, coordinatorName])].sort();
    // Three-way comparison, reported as two named directions so the message says WHICH set differs
    // and BY WHICH MEMBERS.
    let riFail = "";
    const rolesNoAdapter = missingFrom(roleNames, adapterNames);
    const adaptersNoRole = missingFrom(adapterNames, roleNames);
    if (roleNames.length !== adapterNames.length ||
        rolesNoAdapter.length > 0 ||
        adaptersNoRole.length > 0) {
        riFail += `\n  roles vs adapters: ${roleNames.length} roles, ${adapterNames.length} adapters`;
        if (rolesNoAdapter.length > 0) {
            riFail += `\n    ${rolesNoAdapter.length} role(s) with no adapter file: ${rolesNoAdapter.join(", ")}`;
        }
        if (adaptersNoRole.length > 0) {
            riFail += `\n    ${adaptersNoRole.length} adapter(s) with no role file: ${adaptersNoRole.join(", ")}`;
        }
    }
    const grantedNoAdapter = missingFrom(grantClosure, adapterNames);
    const adaptersNotGranted = missingFrom(adapterNames, grantClosure);
    if (grantClosure.length !== adapterNames.length ||
        grantedNoAdapter.length > 0 ||
        adaptersNotGranted.length > 0) {
        riFail += `\n  grant closure vs adapters: ${grantClosure.length} granted names (${granted.length} in the grant + the coordinator ${coordinatorName}), ${adapterNames.length} adapters`;
        if (grantedNoAdapter.length > 0) {
            riFail += `\n    ${grantedNoAdapter.length} granted name(s) resolving to no adapter file: ${grantedNoAdapter.join(", ")}`;
        }
        if (adaptersNotGranted.length > 0) {
            riFail += `\n    ${adaptersNotGranted.length} adapter(s) absent from the grant closure: ${adaptersNotGranted.join(", ")}`;
        }
    }
    if (riFail === "") {
        pass(`KIT-03: ${roleNames.length} roles == ${adapterNames.length} adapters == ${grantClosure.length} grant-closure names (D-09, no exception list)`);
    }
    else {
        fail(`KIT-03 referential-integrity violation — grant ∪ {coordinator} == adapters == roles does not hold:${riFail}`);
    }
}
// ---------------------------------------------------------------------------
// Run all guards.
// ---------------------------------------------------------------------------
process.stdout.write("== Phase 10 foundation-guards gate (SDLC-02 / SC2) ==\n");
guardWr05();
// SPAWN-05 — runs beside guard_wr05 because both read the derived adapter corpus: one checks the
// frontmatter grant, the other the body prose.
guardAdapterBody();
guardAgentsBytes();
guardAdapterSize();
// KIT-01: run the count guard AHEAD of the four role guards. A broken derivation is then named
// before four downstream guards report on a scan set they should never have received.
guardKitCounts();
// D-40 (plan 27-34): the two distribution forms of one skill. Runs after the count guard so a plugin
// tree that failed to derive is NAMED there before this guard reports zero pairs over it.
guardDistributionPair();
guardVoice();
// (Plan 29-01) guard_caveman_preserved's replacement, plus the LANG-05 uniqueness guard. Both read
// the SAME fence verdict guard_voice above just read, from the one reader in voice-model.ts.
guardCavemanVoice();
guardRoleClauseUniqueness();
guardRoleSize();
guardContextWrites();
// KIT-03 — the three-way set equality.
//
// (Plan 27-10) This comment used to say the guard FAILS RED on the live tree until plan 27-07
// generated the adapters. That is stale: the adapters exist, the equality holds, and the guard is
// green. The current contract is the one in its header — it compares three sets all derived from the
// single kit-model authority, and its soundness rests on that authority seeing everything the
// platform loads. Do NOT suppress it, skip it, or downgrade it to a warn() if it goes red: a
// suppressed oracle is how the tree got into the state this milestone exists to close.
guardReferentialIntegrity();
// ---------------------------------------------------------------------------
// Phase 19 auto-UAT Tier-1 oracles (UAT-AUTO-05 / BLOCKER 1).
//
// Invoke the three deterministic oracles defined single-source in check-uat-oracles.ts (B3 wording,
// A2 wiring, A3 dual-path equivalence), then fold their accumulated fail count into this aggregator's FAILS so the
// existing exit tail goes non-zero if any one Tier-1 oracle fails — the aggregator FAILS CLOSED.
// The oracle bodies are NOT restated here (single-source).
// ---------------------------------------------------------------------------
process.stdout.write("\n== Phase 19 auto-UAT Tier-1 oracles (UAT-AUTO-05) ==\n");
oracleWr05Wording();
oracleHooksWiring();
oracleDualPathEquivalence();
FAILS += uatOracleFails();
// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------
process.stdout.write("\n== Result ==\n");
if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
}
else {
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
}

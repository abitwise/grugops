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
//                        strips the single fenced `## Caveman prompt` block, then greps the
//                        clear-voice remainder for caveman markers. Uses `\bgrug\b` (word-
//                        boundary — bare `grug` false-positives on `.grugops/`, D-10).
//   guard_caveman_preserved — the POSITIVE INVERSE of guard_voice (D-06): keeps ONLY the
//                        block and asserts it carries caveman cadence (>=2 `^You` OR >=1 idiom).
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
// Exit 0 = all seven guards GREEN; exit 1 = at least one FAIL (WARNs do NOT fail the build).
// ---------------------------------------------------------------------------
// THE SET-LITERAL INVENTORY, DISPOSITIONED (Phase 27 / KIT-02, D-19).
//
// The founding defect of this milestone was a hand-maintained set that rotted while the suite stayed
// green. Deleting one instance is worthless if the others survive unrecorded, so this is the
// committed record of EVERY enumerating literal the phase found and what was done about it. It is
// deliberately PROSE, not a machine-checked detector: a grep-based stale-literal guard would be a
// heuristic capable of being a strict SUBSET of the real predicate — green while a literal it cannot
// parse rots on — which is the exact failure shape this milestone exists to close. A record a human
// reads is honest about being a record; a detector that misses is not.
//
// Entries 1-14 are those of 27-RESEARCH.md § "The Set-Literal Inventory, Corrected". Entry 15 was
// added in plan 27-13: 27-REVIEW.md § WR-04 found that this record claimed to be complete while
// omitting install.ts's RUNNABLES, and a record that says "EVERY" and is not is worse than no record
// because it stops the next author looking.
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
//    9  SKILLS / AGENT_REL       install/install.ts              DERIVED via readdirSync self-
//                                                                derivation (D-18). Plan 27-02.
//   10  SKILLS / AGENT_REL       install/uninstall.ts            DERIVED — a SECOND duplicated pair
//                                                                in a second file. Plan 27-02.
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
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
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
import { listRoles, listWorkflows, listAgentAdapters, listSkillAdapters, ROLE_COUNT, WORKFLOW_COUNT, SKILL_ADAPTER_COUNT, } from "./kit-model.js";
// Phase 27 (SPAWN-05 / D-24): the retired-vocabulary literals are single-source. guard_adapter_body
// below takes the PROSE forms; check-kit-refs Assertion 2 takes the PATH form. Two genuinely
// different predicates over different inputs — one list, never two.
import { RETIRED_PROSE_FORMS } from "./dead-vocabulary.js";
// Phase 27 (SPAWN-04 / KIT-03, plan 27-12): the ONE authority for "what does this file's frontmatter
// say". The spawn-grant guard below and the KIT-03 oracle at the foot of this file both read the
// grant, and the coordinator marker, from a RECONSTRUCTED frontmatter value rather than from a
// line-anchored regular expression — the two expressions they used to share could not see a folded
// scalar, and that bypass was reproduced on a role adapter and on a skill file (27-REVIEW § CR-02).
// stripFencedBlocks travels with it so the tree keeps exactly one fence implementation.
import { stripFencedBlocks, parseFrontmatter, keysHaveSpawnGrant, keysGrantedAgentNames, keyHasValue, } from "./frontmatter.js";
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
// Read a FLAT directory, returning [] when it cannot be read. The empty result is NOT a silent pass —
// the consuming guard's own floor fails red on it and names the directory.
// (Plan 27-10) The agent and skill callers are both gone; this now reads the PACKAGING TEMPLATE
// directory and nothing else, and its name says so. Packaging templates are deliberately NOT derived
// from the adapter authority: that directory is a flat literal one whose shape rule admits only
// adapter-FRONTMATTER templates, it is not an adapter directory, and deriving it from the adapter
// authority would be a category error.
function readPackagingDir(rel) {
    try {
        return readdirSync(abs(rel));
    }
    catch {
        return [];
    }
}
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
// ---------------------------------------------------------------------------
// D-15 marker: the coordinator key set to true, read through the SAME parser as the grant so a
// marker in an unusual but valid scalar form can neither demote the real coordinator nor promote a
// rogue file out of the must-not-spawn set. This is still the ONLY way the guard identifies the
// coordinator — never a filename.
const COORDINATOR_KEY = "coordinator";
const COORDINATOR_VALUE = "true";
// The packaging directory, and the shape rule that admits only the two adapter-frontmatter
// templates. `adapters.md` is prose about adapters, not an adapter surface, and is OUT (D-09).
const PACKAGING_DIR = "agent-factory/packaging";
const PACKAGING_TEMPLATES = readPackagingDir(PACKAGING_DIR)
    .filter((f) => f.endsWith(".frontmatter.md") || f.endsWith(".template.md"))
    .sort()
    .map((f) => `${PACKAGING_DIR}/${f}`);
const SPAWN_GRANT_SCAN = [...ADAPTERS, ...PACKAGING_TEMPLATES];
// (Plan 27-12) stripFencedBlocks MOVED to scripts/frontmatter.ts and is imported at the top of this
// file. The tree still has exactly ONE implementation of "which lines are inside a ``` block"; it
// simply lives beside the frontmatter parser that also needs a fence-safe input, rather than being
// duplicated there. Behavior is unchanged, including its fail-safe treatment of an unterminated
// fence, so every prose check below reads the same body it read before.
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
// Why these five and not fewer: a coordinator that drops a tier OVERSTATES its enforcement, which is
// the spoofing threat this phase names (T-27-34). Claiming an enforcement you lack is worse than
// having no announcement at all, because a user reading it cannot tell what is actually enforced.
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
];
function guardWr05() {
    process.stdout.write("\n[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)\n");
    let wr05Fail = "";
    // Collect every SCAN file whose FENCE-STRIPPED FRONTMATTER carries the coordinator marker. The
    // substrate has exactly ONE coordinator (the orchestrator adapter); a second marker — live or from
    // a doc example mis-read as live — is a cardinality violation (CR-01).
    const coordinators = [];
    // Every scan file that PARSED, so the name-key floor below reads the same parse this loop did
    // rather than re-reading and re-parsing the file (one parse per file, one grammar).
    const parsedScan = new Map();
    for (const f of SPAWN_GRANT_SCAN) {
        if (!fileExists(f))
            continue; // missing template/adapter is covered by guard_adapter_size (CR-01)
        const parsed = parseFrontmatter(readText(f));
        if (!parsed.ok) {
            // THE BRANCH THAT MUST BE WRITTEN BY HAND. An unreadable frontmatter block is a PARSE ARTIFACT,
            // never a verdict: this file is NOT then treated as carrying no grant, and it is NOT downgraded
            // to a warning. It becomes its own finding naming the file and the reason, and the guard goes
            // red. Letting it fall through to the no-grant branch is the exact class of silent bypass the
            // parser exists to close.
            wr05Fail += `\n${f}: frontmatter parse failure — ${parsed.reason}. An unreadable adapter cannot be reported on, so it is NEVER read as "carries no grant"`;
            continue;
        }
        parsedScan.set(f, parsed.value);
        const isCoordinator = keyHasValue(parsed.value, COORDINATOR_KEY, COORDINATOR_VALUE);
        const hasGrant = keysHaveSpawnGrant(parsed.value);
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
    for (const f of AGENT_ADAPTERS) {
        if (!fileExists(f))
            continue;
        const keys = parsedScan.get(f);
        if (keys === undefined)
            continue; // already reported as a parse failure
        if (!keys.has("name")) {
            wr05Fail += `\n${f}: agent adapter carries no \`name\` key in its frontmatter — Claude Code takes agent identity only from frontmatter, so this is not a loadable agent and its spawn-grant verdict cannot be trusted`;
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
        // Same single fence authority, then the same whitespace normalization guard_adapter_body uses,
        // so a beat that the template hard-wraps across two lines still reads as one sentence.
        const coordinatorBody = collapseWhitespace(stripFencedBlocks(readText(coordinators[0])));
        for (const beat of TIER_BEATS) {
            if (!coordinatorBody.includes(beat.needle)) {
                wr05Fail += `\n${coordinators[0]}: coordinator body is missing the tier-announcement beat "${beat.label}" (expected the wording \`${beat.needle}\`) — a coordinator that drops a tier overstates its enforcement`;
            }
        }
    }
    // SPAWN-04 reporting. The rogue-grant loop above walks every SPAWN_GRANT_SCAN member, but the
    // number worth REPORTING is the adapter one: SPAWN-04 is a property of the shipped adapters, and
    // the two packaging templates are documentation surfaces that happen to share the scan. Both
    // numbers are printed so neither hides. With the scan set derived in plan 27-03 this now covers all
    // 17 agent adapters and all 7 skills rather than the four files it used to hand-list.
    const nonCoordinatorAdapters = ADAPTERS.filter((f) => !coordinators.includes(f)).length;
    if (wr05Fail === "") {
        pass(`WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (${nonCoordinatorAdapters} non-coordinator adapter bodies + ${PACKAGING_TEMPLATES.length} packaging template(s) checked), and the coordinator body carries all ${TIER_BEATS.length} tier-announcement beats`);
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
// BEFORE it propagates into seventeen generated files. Today that is 25 bodies. Membership follows
// the filesystem for the adapters, so an eighteenth role is scanned the day its adapter lands.
//
// ONE FENCE AUTHORITY. Both halves read the body through the SHARED stripFencedBlocks() — never a
// second parser over the same bytes. A documentation example inside a ``` fence is documentation:
// it can neither trip the ban nor satisfy the requirement. That is why the packaging template
// states the memory sentence in LIVE prose as well as inside its two fenced body shapes — the
// fenced copies are examples, and the guard is right not to count them.
// ---------------------------------------------------------------------------
const ADAPTER_BODY_TEMPLATE = "agent-factory/packaging/subagent.frontmatter.md";
const ADAPTER_BODY_SCAN = [...ADAPTERS, ADAPTER_BODY_TEMPLATE];
// The live memory wording, stated without its leading article so both body shapes and the
// template's own prose sentence match the one needle. It has exactly ONE consumer, so it stays
// local here rather than becoming a shared export — a shared module with a single consumer is a
// second authority with nothing to justify it. (dead-vocabulary.ts is the opposite case: two
// consumers, so it earns the module.)
const MEMORY_SENTENCE = "shared verified context is the only memory";
function guardAdapterBody() {
    process.stdout.write("\n[guard_adapter_body] adapter bodies carry the shared-context memory, not the retired relay (SPAWN-05)\n");
    let bodyFail = "";
    let scanned = 0;
    for (const f of ADAPTER_BODY_SCAN) {
        // CR-01 missing-file fail-red. For a derived adapter this is a TOCTOU race (it came from a
        // readdir); for the named packaging template it is a real deletion of the upstream source.
        // Either way the guard NAMES it rather than quietly scanning one body fewer.
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
        if (!body.includes(MEMORY_SENTENCE)) {
            bodyFail += `\n${f}: body never names the shared verified context as its memory (expected the wording "${MEMORY_SENTENCE}" in live, non-fenced text) — an adapter gone stale by omission`;
        }
    }
    // Vacuity floor. The adapter half of the scan set is DERIVED, and deriving a set silently deletes
    // the fail-red branch a literal had: a body that disappears stops being a member instead of
    // becoming a finding. A run that scanned nothing is the anomaly, never "no bodies to check,
    // therefore fine".
    if (scanned === 0) {
        bodyFail += `\nthe adapter-body scan set derived nothing — refusing to report a verdict over zero bodies (${ADAPTER_DIR} + ${SKILL_DIR} + ${ADAPTER_BODY_TEMPLATE})`;
    }
    if (bodyFail === "") {
        // Report WHAT WAS CHECKED, not a bare PASS: a line reading "1 adapter body" would then be
        // visible as the anomaly it is instead of hiding behind the word PASS.
        pass(`SPAWN-05: ${scanned} adapter body/bodies scanned (${ADAPTERS.length} derived adapters + the packaging template); none carries retired relay vocabulary and every one names the shared verified context as its memory`);
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
        countFail += `\nkit count: derived ${ROLE_FILES.length} role files, expected exactly ${ROLE_COUNT} — walk every derived consumer (guard_voice, guard_caveman_preserved, guard_role_size, CTX_SCAN, roleCeiling) BEFORE updating ROLE_COUNT in scripts/kit-model.ts`;
    }
    if (WORKFLOW_FILES.length !== WORKFLOW_COUNT) {
        countFail += `\nkit count: derived ${WORKFLOW_FILES.length} workflow files, expected exactly ${WORKFLOW_COUNT} — walk every derived consumer BEFORE updating WORKFLOW_COUNT in scripts/kit-model.ts`;
    }
    // (Phase 27 / KIT-02) The skill-adapter count. This is the deletion detector for the ONE derived
    // set the KIT-03 referential-integrity oracle cannot cover: a skill adapter has no corresponding
    // role file, so removing a skill directory would otherwise just shrink the derived set in silence.
    if (SKILL_ADAPTERS.length !== SKILL_ADAPTER_COUNT) {
        countFail += `\nkit count: derived ${SKILL_ADAPTERS.length} skill adapters, expected exactly ${SKILL_ADAPTER_COUNT} — a skill adapter has no role to compare against, so this count is the only deletion signal; walk guard_adapter_size and the spawn-grant scan BEFORE updating SKILL_ADAPTER_COUNT in scripts/kit-model.ts`;
    }
    if (countFail === "") {
        pass(`kit counts: derived ${ROLE_FILES.length} roles, ${WORKFLOW_FILES.length} workflows and ${SKILL_ADAPTERS.length} skill adapters (expected ${ROLE_COUNT} / ${WORKFLOW_COUNT} / ${SKILL_ADAPTER_COUNT})`);
    }
    else {
        fail(`kit-count violation:${countFail}`);
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
// `\bgrug\b|\bclub\b|...` — word-boundary markers + idioms. `g`+`m` so grep-like line matching.
const VOICE_MARKERS = /\bgrug\b|\bclub\b|\brock\b|\bcave\b|\bsmash\b|\bshiny\b|brain hurt|me think|no think|big think/;
// Strip the single fenced `## Caveman prompt` block, returning the clear-voice remainder.
// This is the exact awk fence machinery translated to a TS line-state loop (D-10: the anchor is
// NOT re-engineered). The awk:
//   /^## Caveman prompt/ {skip=1}
//   skip && /^```/        {fence++; if(fence==2){skip=0;fence=0}; next}
//   skip                  {next}
//   {print}
//   END { if (skip) print "__UNCLOSED_CAVEMAN_FENCE__" }
function stripCavemanBlock(text) {
    const out = [];
    let skip = false;
    let fence = 0;
    for (const line of text.split("\n")) {
        if (/^## Caveman prompt/.test(line)) {
            skip = true;
            // fall through (the awk action sets skip then continues to the next rule for THIS line;
            // since skip is now true and the line does not start with ```, the `skip {next}` rule
            // drops it — so the heading itself is NOT printed). Replicate by continuing.
            continue;
        }
        if (skip && /^```/.test(line)) {
            fence++;
            if (fence === 2) {
                skip = false;
                fence = 0;
            }
            continue; // `next` — the fence line is never printed
        }
        if (skip) {
            continue; // `next` — lines inside the block are dropped
        }
        out.push(line);
    }
    // END: an unterminated block (skip still set at EOF) emits the sentinel so the malformed-fence
    // case fails RED instead of silently dropping the whole file tail.
    if (skip)
        out.push("__UNCLOSED_CAVEMAN_FENCE__");
    return out.join("\n");
}
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
        let body = stripCavemanBlock(readText(f));
        // WR-03: an unterminated caveman block fails red NAMING the file — the tail was never scanned.
        if (body.split("\n").some((l) => l.includes("__UNCLOSED_CAVEMAN_FENCE__"))) {
            voiceFail += `\n${f}: unterminated ## Caveman prompt fence — clear-voice tail not scanned (malformed fence)`;
            continue;
        }
        // D-05 marker refinement (a SEPARATE pass — does NOT touch the fence anchor above).
        body = neutralizePhrases(body);
        // grep -nE: collect `lineno:line` for every line matching a caveman marker.
        const m = [];
        const bodyLines = body.split("\n");
        for (let i = 0; i < bodyLines.length; i++) {
            if (VOICE_MARKERS.test(bodyLines[i]))
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
// ---------------------------------------------------------------------------
// guard_caveman_preserved — the POSITIVE INVERSE of guard_voice (D-06). Keep ONLY the lines
// INSIDE the fenced `## Caveman prompt` block and assert it is non-empty AND carries caveman
// cadence — so a senior-persona rewrite cannot SAND THE GRUG VOICE OFF.
//
// CAVEMAN_MARKERS = VOICE_MARKERS idioms PLUS `^You\b`. WR-01: require >=2 `^You`-cadence lines
// OR >=1 bare grug idiom — a single `You are <Role>.` opener is NOT enough evidence.
// ---------------------------------------------------------------------------
// Keep ONLY the lines INSIDE the fenced `## Caveman prompt` block (inverse of guard_voice).
// The awk:
//   /^## Caveman prompt/ {seen=1; next}
//   seen && /^```/        {fence++; if(fence==1){infence=1; next}; if(fence==2){exit}}
//   infence               {print}
function extractCavemanBlock(text) {
    const out = [];
    let seen = false;
    let fence = 0;
    let infence = false;
    for (const line of text.split("\n")) {
        if (/^## Caveman prompt/.test(line)) {
            seen = true;
            continue; // `next`
        }
        if (seen && /^```/.test(line)) {
            fence++;
            if (fence === 1) {
                infence = true;
                continue; // `next`
            }
            if (fence === 2) {
                break; // `exit`
            }
        }
        if (infence)
            out.push(line);
    }
    return out.join("\n");
}
function guardCavemanPreserved() {
    process.stdout.write("\n[guard_caveman_preserved] every role keeps a non-empty caveman prompt block (D-06)\n");
    let cavFail = "";
    for (const f of ROLE_FILES) {
        if (!fileExists(f)) {
            cavFail += `\n${f}: required role file missing (caveman prompt block missing or empty)`;
            continue;
        }
        const block = extractCavemanBlock(readText(f));
        if (block === "") {
            cavFail += `\n${f}: caveman prompt block missing or empty`;
        }
        else {
            // WR-01: require >=2 `^You`-cadence lines OR >=1 bare grug idiom — a single opener fails.
            const youcount = block.split("\n").filter((l) => /^You\b/.test(l)).length;
            if (youcount < 2 && !VOICE_MARKERS.test(block)) {
                cavFail += `\n${f}: caveman voice sanded to prose (only the opener survives — no caveman marker)`;
            }
        }
    }
    if (cavFail === "") {
        pass(`caveman: all ${ROLE_FILES.length} roles keep a non-empty markered caveman prompt block`);
    }
    else {
        fail(`caveman-preserved violation:${cavFail}`);
    }
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
    const parsedAdapters = new Map();
    const parseFailures = [];
    for (const f of adapterFiles) {
        const parsed = parseFrontmatter(readText(`${ADAPTER_DIR}/${f}`));
        if (!parsed.ok)
            parseFailures.push(`${ADAPTER_DIR}/${f}: ${parsed.reason}`);
        else
            parsedAdapters.set(f, parsed.value);
    }
    if (parseFailures.length > 0) {
        fail(`KIT-03: ${parseFailures.length} adapter(s) whose frontmatter could not be parsed — an unreadable adapter is NEVER a zero-length grant closure and NEVER a non-coordinator; the set equality cannot be checked over a file that cannot be read:\n    ${parseFailures.sort().join("\n    ")}`);
        return;
    }
    const coordinators = adapterFiles.filter((f) => keyHasValue(parsedAdapters.get(f), COORDINATOR_KEY, COORDINATOR_VALUE));
    if (coordinators.length !== 1) {
        fail(`KIT-03: expected exactly one \`coordinator: true\` adapter in ${ADAPTER_DIR}, found ${coordinators.length}${coordinators.length > 0 ? `: ${coordinators.join(", ")}` : " — a zero-coordinator tree is not \"no grant to check, therefore fine\""}`);
        return;
    }
    const coordinatorName = stem(coordinators[0]);
    const granted = keysGrantedAgentNames(parsedAdapters.get(coordinators[0]));
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
guardVoice();
guardCavemanPreserved();
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

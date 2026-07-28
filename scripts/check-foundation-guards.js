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
// The 14 entries are those of 27-RESEARCH.md § "The Set-Literal Inventory, Corrected".
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
import { listRoles, listWorkflows, ROLE_COUNT, WORKFLOW_COUNT, } from "./kit-model.js";
// Phase 27 (SPAWN-05 / D-24): the retired-vocabulary literals are single-source. guard_adapter_body
// below takes the PROSE forms; check-kit-refs Assertion 2 takes the PATH form. Two genuinely
// different predicates over different inputs — one list, never two.
import { RETIRED_PROSE_FORMS } from "./dead-vocabulary.js";
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
// ---------------------------------------------------------------------------
// Fixed literal subpaths joined onto the already-resolved ROOT — never argv/env/content-derived
// (ASVS V12, mirrors kit-model.ts's path-traversal posture).
const ADAPTER_DIR = ".claude/agents";
const SKILL_DIR = ".claude/skills";
// The exact expected number of skill adapters. A COUNT is not the drift class this phase deletes —
// the drift class is a LIST OF NAMES that consumers read as truth while it rots; a count is a number
// that can only ever fail closed. Deleting a skill directory must not be able to disappear from the
// guard's view, and the KIT-03 oracle cannot see it (a skill has no role to compare against).
const SKILL_COUNT = 7;
// Read a directory, returning [] when it cannot be read. The empty result is NOT a silent pass —
// guardAdapterSize()'s non-empty floor fails red on it, naming the directory and both counts.
function readAdapterDir(rel) {
    try {
        return readdirSync(abs(rel));
    }
    catch {
        return [];
    }
}
// Every `.md` file directly under .claude/agents, sorted, as repo-relative paths.
const AGENT_ADAPTERS = readAdapterDir(ADAPTER_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => `${ADAPTER_DIR}/${f}`);
// Every `<name>/SKILL.md` under .claude/skills, sorted, as repo-relative paths. The entry is kept
// only when the SKILL.md actually exists, so a stray non-skill directory cannot join the set.
const SKILL_ADAPTERS = readAdapterDir(SKILL_DIR)
    .filter((d) => existsSync(abs(`${SKILL_DIR}/${d}/SKILL.md`)))
    .sort()
    .map((d) => `${SKILL_DIR}/${d}/SKILL.md`);
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
// Two grant shapes catch every form (kept verbatim from the pre-flip guard, both alias tokens
// retained — State-of-the-Art: the legacy alias still resolves): the comma list
// (`tools: Read, Grep, ...`) and the YAML array (`allowed-tools:\n  - Read\n  ...`). A grant can
// also be scoped (the parenthesized allowlist form). The two EREs catch all of them; the word
// boundary keeps the pattern anchored to a token, not a substring.
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
const WR05_COMMA = /^(tools|allowed-tools):.*\b(Agent|Task)\b/;
// WR-02 fix: allow an optional quote (single or double) between the dash and the token so a
// QUOTED YAML array item (`- "Agent"`, `- 'Agent'`) — valid YAML, a real spawn-grant shape — is
// caught, not just the bare `- Agent`. Mirrors WR05_COMMA's permissiveness.
const WR05_ARRAY = /^[ \t]*-[ \t]*["']?(Agent|Task)\b/;
// D-15 marker: line-anchored match for the coordinator key set to true. This is the ONLY way the
// guard identifies the coordinator — never a filename.
const WR05_COORDINATOR = /^coordinator:\s*true\b/;
// The packaging directory, and the shape rule that admits only the two adapter-frontmatter
// templates. `adapters.md` is prose about adapters, not an adapter surface, and is OUT (D-09).
const PACKAGING_DIR = "agent-factory/packaging";
const PACKAGING_TEMPLATES = readAdapterDir(PACKAGING_DIR)
    .filter((f) => f.endsWith(".frontmatter.md") || f.endsWith(".template.md"))
    .sort()
    .map((f) => `${PACKAGING_DIR}/${f}`);
const SPAWN_GRANT_SCAN = [...ADAPTERS, ...PACKAGING_TEMPLATES];
// Strip every line that sits INSIDE a ```-delimited code fence, returning only the lines OUTSIDE
// any fence. This is a GENERAL fence operation (distinct from stripCavemanBlock, which is scoped to
// the single `## Caveman prompt` section); it shares the SAME line-state toggle pattern (D-10: the
// fence anchor is not re-engineered). Packaging templates legitimately SHOW frontmatter inside
// ``` fences (e.g. a coordinator example carrying `coordinator: true` + `Agent(...)`); the WR-05
// guard must read those illustrative lines as documentation, never as a live marker/grant.
//
// Toggle: every line matching /^```/ flips the inside/outside state, then is itself dropped. Lines
// while inside are dropped; lines while outside are kept. FAIL-SAFE on an unterminated fence (the
// state is still "inside" at EOF): the tail was opened but never closed, so it is treated as
// inside-fence and never exposed — a malformed doc can never leak an unguarded live grant past the
// strip. (CR-01: a fenced documentation example must not be mis-read as a second live coordinator.)
function stripFencedBlocks(text) {
    const out = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (/^```/.test(line)) {
            inside = !inside;
            continue; // the fence delimiter line is never emitted
        }
        if (inside)
            continue; // lines inside a fence are dropped (documentation, not live frontmatter)
        out.push(line);
    }
    // An unterminated fence leaves `inside` set at EOF. The tail was inside an opened-but-unclosed
    // fence and was already dropped above — fail-safe: we never emit it. Nothing more to do.
    return out.join("\n");
}
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
// Apply a line-anchored ERE to the fence-stripped body of a file, returning true if any surviving
// (non-fenced) line matches. The EREs are byte-identical to the pre-fix guard — only the INPUT
// changes (fenced lines removed), so the real adapter's REAL (non-fenced) frontmatter marker/grant
// remains detected while an illustrative fenced example is ignored.
function matchesOutsideFences(rel, re) {
    const body = stripFencedBlocks(readText(rel));
    return body.split("\n").some((l) => re.test(l));
}
function guardWr05() {
    process.stdout.write("\n[guard_wr05] coordinator-only spawn grant: marker-keyed both-direction enforcement (WR-05)\n");
    let wr05Fail = "";
    // Collect every SCAN file whose FENCE-STRIPPED body carries the coordinator marker. The substrate
    // has exactly ONE coordinator (the orchestrator adapter); a second marker — live or from a doc
    // example mis-read as live — is a cardinality violation (CR-01).
    const coordinators = [];
    for (const f of SPAWN_GRANT_SCAN) {
        if (!fileExists(f))
            continue; // missing template/adapter is covered by guard_adapter_size (CR-01)
        const isCoordinator = matchesOutsideFences(f, WR05_COORDINATOR);
        const hasGrant = matchesOutsideFences(f, WR05_COMMA) || matchesOutsideFences(f, WR05_ARRAY);
        if (isCoordinator)
            coordinators.push(f);
        if (isCoordinator && !hasGrant) {
            wr05Fail += `\n${f}: coordinator carries no spawn grant — a dropped grant kills Claude Code parallelism (the coordinator MUST hold the enumerated role-agent grant)`;
        }
        else if (!isCoordinator && hasGrant) {
            wr05Fail += `\n${f}: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)`;
        }
    }
    // Cardinality (CR-01): exactly one coordinator across the SCAN set. A fenced documentation example
    // is stripped before this count, so it cannot inflate it; a LIVE second marker fails red naming the
    // offending files. This keeps the both-direction invariant honest — no file is promoted out of the
    // must-not-spawn set by an illustrative marker.
    if (coordinators.length !== 1) {
        wr05Fail += `\nexpected exactly one coordinator: true file in the scan set, found ${coordinators.length}${coordinators.length > 0 ? `: ${coordinators.join(", ")}` : ""}`;
    }
    if (wr05Fail === "") {
        pass("WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does");
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
// names any single deleted agent adapter). Skills have no corresponding role, so the SKILL_COUNT
// assertion in guardKitCounts() closes the one gap the oracle cannot see.
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
    if (AGENT_ADAPTERS.length === 0 || SKILL_ADAPTERS.length === 0) {
        fail(`adapter derivation returned an empty set — ${ADAPTER_DIR}: ${AGENT_ADAPTERS.length} adapter(s), ${SKILL_DIR}: ${SKILL_ADAPTERS.length} adapter(s). An empty adapter directory is never "nothing to compare, therefore fine".`);
    }
    for (const f of ADAPTERS) {
        // TOCTOU defence: the member came from a readdir, so a vanished file here is a race, not a
        // deletion the derivation could have seen. Kept so the guard names it rather than throwing.
        if (!fileExists(f)) {
            fail(`${f} missing (adapter required)`);
            continue;
        }
        const b = byteLen(f);
        if (b >= AD_FAIL) {
            fail(`${f} ${b}B >= ${AD_FAIL}B — adapter too large (role body copied in?)`);
        }
        else if (b >= AD_WARN) {
            warn(`${f} ${b}B >= ${AD_WARN}B — approaching pointer ceiling`);
        }
        else {
            pass(`${f} ${b}B pointer-sized`);
        }
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
    if (SKILL_ADAPTERS.length !== SKILL_COUNT) {
        countFail += `\nkit count: derived ${SKILL_ADAPTERS.length} skill adapters, expected exactly ${SKILL_COUNT} — a skill adapter has no role to compare against, so this count is the only deletion signal; walk guard_adapter_size and the spawn-grant scan BEFORE updating SKILL_COUNT`;
    }
    if (countFail === "") {
        pass(`kit counts: derived ${ROLE_FILES.length} roles, ${WORKFLOW_FILES.length} workflows and ${SKILL_ADAPTERS.length} skill adapters (expected ${ROLE_COUNT} / ${WORKFLOW_COUNT} / ${SKILL_COUNT})`);
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
// The grant parser runs the text through the SHARED stripFencedBlocks() first — never a second fence
// parser. agent-factory/packaging/subagent.frontmatter.md ships a coordinator example INSIDE a
// fenced block; a non-fence-aware parser would read that documentation as a live grant. The
// coordinator is located by the WR05_COORDINATOR marker, matching how guard_wr05 already identifies
// it — never by filename.
// ---------------------------------------------------------------------------
// ADAPTER_DIR is declared once, up at the guard_adapter_size derivation — the adapter directory is
// a single fact and this oracle reads the SAME one guard_adapter_size scans.
// Every role's agent name is its role filename stem under the `grugops-` namespace:
// `orchestrator.md` -> `grugops-orchestrator`. Comparison is exact JavaScript string equality over
// these names throughout — no case folding, no normalisation, no substring matching.
const AGENT_PREFIX = "grugops-";
const stem = (file) => file.replace(/\.md$/, "");
// Extract the ENUMERATED names from a scoped spawn grant:
//   `tools: Agent(grugops-qe-e2e, grugops-installer), Read`  ->  [grugops-installer, grugops-qe-e2e]
// Only grant-shaped lines are read (the same two EREs guard_wr05 uses), so prose that merely names
// an agent cannot inflate the closure. Returns sorted, de-duplicated names.
function parseAgentGrant(text) {
    const body = stripFencedBlocks(text); // SHARED fence strip — fail-safe on an unterminated fence
    const names = new Set();
    for (const line of body.split("\n")) {
        if (!WR05_COMMA.test(line) && !WR05_ARRAY.test(line))
            continue;
        const re = /\b(?:Agent|Task)\(([^)]*)\)/g;
        let m;
        while ((m = re.exec(line)) !== null) {
            for (const raw of m[1].split(",")) {
                const n = raw.trim().replace(/^["']|["']$/g, "");
                if (n !== "")
                    names.add(n);
            }
        }
    }
    return [...names].sort();
}
// Members of `a` absent from `b`, order-independent and sorted for byte-identical reporting.
const missingFrom = (a, b) => a.filter((x) => !b.includes(x)).sort();
function guardReferentialIntegrity() {
    process.stdout.write("\n[guard_referential_integrity] role corpus == adapter directory == coordinator grant closure (KIT-03, D-09)\n");
    // Set 1 — the role corpus, from the KIT-01 derivation.
    const roleNames = ROLE_FILES.map((p) => `${AGENT_PREFIX}${stem(basename(p))}`).sort();
    // Set 2 — the adapter directory.
    let adapterFiles;
    try {
        adapterFiles = readdirSync(abs(ADAPTER_DIR))
            .filter((f) => f.endsWith(".md"))
            .sort();
    }
    catch {
        fail(`KIT-03: cannot read the adapter directory ${ADAPTER_DIR} — refusing to compare against an unreadable set (${roleNames.length} roles have no adapter to match)`);
        return;
    }
    if (adapterFiles.length === 0) {
        fail(`KIT-03: ${ADAPTER_DIR} holds no adapter files — an empty adapter directory is NEVER "nothing to compare, therefore fine". All ${roleNames.length} role(s) are unbacked: ${roleNames.join(", ")}`);
        return;
    }
    const adapterNames = adapterFiles.map(stem).sort();
    // Encoding assertion: every name in the corpus is ASCII today. Asserting it removes any
    // byte-vs-codepoint-vs-normalisation ambiguity from the string comparisons below rather than
    // leaving it latent for a future non-ASCII filename to expose.
    const nonAscii = [
        ...ROLE_FILES.map((p) => basename(p)),
        ...adapterFiles,
    ].filter((n) => 
    // eslint-disable-next-line no-control-regex
    /[^\x00-\x7F]/.test(n));
    if (nonAscii.length > 0) {
        fail(`KIT-03: non-ASCII byte in a role/adapter filename — set membership is exact string equality and must stay unambiguous: ${nonAscii.sort().join(", ")}`);
        return;
    }
    // Set 3 — the coordinator grant closure. Locate the coordinator by MARKER, never by filename.
    const coordinators = adapterFiles.filter((f) => matchesOutsideFences(`${ADAPTER_DIR}/${f}`, WR05_COORDINATOR));
    if (coordinators.length !== 1) {
        fail(`KIT-03: expected exactly one \`coordinator: true\` adapter in ${ADAPTER_DIR}, found ${coordinators.length}${coordinators.length > 0 ? `: ${coordinators.join(", ")}` : " — a zero-coordinator tree is not \"no grant to check, therefore fine\""}`);
        return;
    }
    const coordinatorName = stem(coordinators[0]);
    const granted = parseAgentGrant(readText(`${ADAPTER_DIR}/${coordinators[0]}`));
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
// KIT-03 — THIS GUARD FAILS RED ON THE LIVE TREE UNTIL PLAN 27-07.
//
// The tree today holds 17 roles, ONE adapter file, and a coordinator grant naming seven agents that
// resolve to nothing. That is the structural break this milestone exists to close, and the RED is
// the EVIDENCE for it (ROADMAP success criterion 2) — not a regression, not a bug in the guard.
// Plan 27-07 generates the 17 adapter files and the corrected 16-name grant; that is the commit that
// turns this guard green. (Plan 27-01 wrote "27-06" here — corrected: 27-06 prepares the role
// `capabilities:` frontmatter and the adapter body template, 27-07 is the plan that emits the
// adapters and carries KIT-03 in its requirements.) Do NOT suppress it, skip it, or downgrade it to a
// warn() in the meantime: a suppressed oracle is how the tree got here.
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

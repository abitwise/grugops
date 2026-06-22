// check-foundation-guards.ts — Phase 10 build gate (SDLC-02 / SC2).
//
// TypeScript port of check-foundation-guards.sh (Phase 15, TOOL-01). This is a TRANSLATION,
// not a redesign: every guard is ported 1:1 (these are tuned, not arbitrary). The pass/fail/warn
// exit spine (WARN never increments FAILS), the WR05 EREs + explicit 4-file SCAN set, the
// guard_voice fence-strip + __UNCLOSED_CAVEMAN_FENCE__ sentinel + the 3 phrase-neutralizations,
// guard_caveman_preserved's >=2 `^You` OR >=1 idiom threshold, the per-role role_ceiling() byte
// table, the 17-file ROLE_FILES + SEC_VOICE_FILES lists, and CR-01 missing-file-fails-red are
// reproduced verbatim. The awk fence machinery is translated to an equivalent TS line-state loop
// — SAME semantics; the anchor is NOT re-engineered (D-10 forward-compat).
//
// The six cross-cutting v1.2 foundation guards in ONE aggregator. Each guard fails red on a
// violation and NEVER fabricates a pass — the mechanical form of grugops's no-fabrication
// contract. It stands the guards up BEFORE any v1.2 content lands (Phases 11–17) so every later
// phase writes into a guarded environment.
//
//   guard_wr05         — frontmatter spawn-grant grep over the 2 packaging templates + 2
//                        materialized adapters (D-08/D-09). Two verified EREs (comma-form +
//                        YAML-array-item, incl. scoped `Agent(worker)`). Matches the
//                        frontmatter TOKEN only — NEVER the prose word "spawn"/"sub-agent".
//                        `adapters.md` is deliberately OUT of this scan set (D-09).
//   guard_agents_bytes — AGENTS.md byte budget, two-tier WARN 20480 / FAIL 28672 (D-07). FAIL
//                        is BELOW the 32768-byte Codex `project_doc_max_bytes` cap.
//   guard_adapter_size — per-adapter byte ceiling, two-tier WARN 3072 / FAIL 4096 (D-07).
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
//                        Fails RED on any hit. Explicit SCAN set (the 17 roles + 16 workflows) —
//                        NEVER a repo-wide grep. Calibrated to a TOKEN, not the prose word "write":
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
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
// Phase 19 (UAT-AUTO-05 / BLOCKER 1 / LOCKED CONTEXT.md decision / ROADMAP SC3): the run-all block
// invokes the three Tier-1 auto-UAT oracles so this aggregator fails closed when any one fails. The
// oracle BODIES live single-source in check-uat-oracles.ts — here we only INVOKE them and fold their
// accumulated fail count into FAILS. The oracle module honors the SAME CHECK_ROOT override, so the
// fail-proof harness's hermetic mirror plant exercises them through this aggregator too.
import { oracleWr05Wording, oracleHooksWiring, oracleParity, uatOracleFails, } from "./check-uat-oracles.js";
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
// boundary keeps the pattern anchored to a token, not a substring. Explicit 4-file SCAN set —
// NEVER a repo-wide grep (the established token-vs-prose care).
// ---------------------------------------------------------------------------
const WR05_COMMA = /^(tools|allowed-tools):.*\b(Agent|Task)\b/;
// WR-02 fix: allow an optional quote (single or double) between the dash and the token so a
// QUOTED YAML array item (`- "Agent"`, `- 'Agent'`) — valid YAML, a real spawn-grant shape — is
// caught, not just the bare `- Agent`. Mirrors WR05_COMMA's permissiveness.
const WR05_ARRAY = /^[ \t]*-[ \t]*["']?(Agent|Task)\b/;
// D-15 marker: line-anchored match for the coordinator key set to true. This is the ONLY way the
// guard identifies the coordinator — never a filename.
const WR05_COORDINATOR = /^coordinator:\s*true\b/;
const WR05_SCAN = [
    "agent-factory/packaging/subagent.frontmatter.md",
    "agent-factory/packaging/slash-command.template.md",
    ".claude/skills/grugops/SKILL.md",
    ".claude/agents/grugops-orchestrator.md",
];
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
    for (const f of WR05_SCAN) {
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
// ---------------------------------------------------------------------------
const ADAPTERS = [
    ".claude/skills/grugops/SKILL.md",
    ".claude/agents/grugops-orchestrator.md",
];
const AD_WARN = 3072; // 3 KiB
const AD_FAIL = 4096; // 4 KiB
function guardAdapterSize() {
    process.stdout.write("\n[guard_adapter_size] adapters stay pointer-sized (single-source, byte ceiling)\n");
    for (const f of ADAPTERS) {
        // Missing-file fail-red (CR-01): a deleted adapter must fail red naming the path.
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
// guard_voice — voice-discipline lint over the curated clear-voice surfaces.
//
// Section-scoped, never whole-file: role bodies legitimately mix a fenced `## Caveman prompt`
// (intentionally caveman) with clear-voice sections. Strip the SINGLE fenced `## Caveman prompt`
// block, then grep the remainder for caveman markers.
// ---------------------------------------------------------------------------
// The 17 role files (D-05 expansion + Phase 13 frontend-ui). `_role-switch-protocol.md` has no
// `## Caveman prompt` block, so it is correctly EXCLUDED. This same 17-file list is the scan set
// for all three role guards (guard_voice, guard_caveman_preserved, guard_role_size).
const ROLE_FILES = [
    "agent-factory/roles/agents-md-scribe.md",
    "agent-factory/roles/architect-design.md",
    "agent-factory/roles/ba-pm.md",
    "agent-factory/roles/brownfield-mapper.md",
    "agent-factory/roles/compliance-officer.md",
    "agent-factory/roles/factory-coach.md",
    "agent-factory/roles/frontend-ui.md",
    "agent-factory/roles/greenfield-mapper.md",
    "agent-factory/roles/incident-responder.md",
    "agent-factory/roles/installer.md",
    "agent-factory/roles/orchestrator.md",
    "agent-factory/roles/qe-e2e.md",
    "agent-factory/roles/release-manager.md",
    "agent-factory/roles/security-nfr.md",
    "agent-factory/roles/software-engineer.md",
    "agent-factory/roles/system-analyst.md",
    "agent-factory/roles/uat-planner.md",
];
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
        pass("caveman: all 17 roles keep a non-empty markered caveman prompt block");
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
const CTX_TOKEN = String.raw `writeFileSync|appendFileSync|\bWrite\b|>>?|\becho\b`;
// FIRE when the path and a write token co-occur on one line, in EITHER order (token-then-path for
// `writeFileSync('.grugops/context/...')`; path-then-token for `... .grugops/context/... >> file`).
const CTX_WRITE_RE = new RegExp(`(${CTX_PATH}.*(${CTX_TOKEN}))|((${CTX_TOKEN}).*${CTX_PATH})`);
// Explicit SCAN set: the 17 shipped role files (reuse ROLE_FILES) + the 16 shipped workflows. These
// are the files that may legitimately MENTION the context path in prose once roles are wired in
// later phases; the guard ensures any such mention is never a raw-write bypass. NEVER a repo-wide
// grep (mirrors guard_wr05's explicit 4-file scan set).
const CTX_WORKFLOWS = [
    "agent-factory/workflows/00-bootstrap-greenfield.md",
    "agent-factory/workflows/01-bootstrap-brownfield.md",
    "agent-factory/workflows/02-idea-to-epics.md",
    "agent-factory/workflows/03-epic-to-tickets.md",
    "agent-factory/workflows/04-ticket-to-pr.md",
    "agent-factory/workflows/05-pr-quality-gate.md",
    "agent-factory/workflows/06-uat-pack.md",
    "agent-factory/workflows/07-backlog-refinement.md",
    "agent-factory/workflows/08-sprint-planning.md",
    "agent-factory/workflows/09-daily-sweep.md",
    "agent-factory/workflows/10-sprint-review.md",
    "agent-factory/workflows/11-retro.md",
    "agent-factory/workflows/12-release.md",
    "agent-factory/workflows/13-incident.md",
    "agent-factory/workflows/14-ui-design-to-build.md",
    "agent-factory/workflows/15-security-audit.md",
];
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
// Run all guards.
// ---------------------------------------------------------------------------
process.stdout.write("== Phase 10 foundation-guards gate (SDLC-02 / SC2) ==\n");
guardWr05();
guardAgentsBytes();
guardAdapterSize();
guardVoice();
guardCavemanPreserved();
guardRoleSize();
guardContextWrites();
// ---------------------------------------------------------------------------
// Phase 19 auto-UAT Tier-1 oracles (UAT-AUTO-05 / BLOCKER 1).
//
// Invoke the three deterministic oracles defined single-source in check-uat-oracles.ts (B3 wording,
// A2 wiring, A3 parity), then fold their accumulated fail count into this aggregator's FAILS so the
// existing exit tail goes non-zero if any one Tier-1 oracle fails — the aggregator FAILS CLOSED.
// The oracle bodies are NOT restated here (single-source).
// ---------------------------------------------------------------------------
process.stdout.write("\n== Phase 19 auto-UAT Tier-1 oracles (UAT-AUTO-05) ==\n");
oracleWr05Wording();
oracleHooksWiring();
oracleParity();
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

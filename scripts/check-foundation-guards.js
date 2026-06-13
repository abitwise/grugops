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
// Exit 0 = all six guards GREEN; exit 1 = at least one FAIL (WARNs do NOT fail the build).
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
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
// guard_wr05 — no frontmatter spawn grant in the 2 templates + 2 materialized adapters.
//
// Two grant shapes: the comma list (`tools: Read, Grep, ...`) and the YAML array
// (`allowed-tools:\n  - Read\n  ...`). A grant can also be scoped (`Agent(worker)`). The two
// EREs catch all three; the word boundary makes `Agent(worker)` match while keeping the pattern
// anchored to a token, not a substring. Explicit 4-file SCAN set — NEVER a repo-wide grep.
// ---------------------------------------------------------------------------
const WR05_COMMA = /^(tools|allowed-tools):.*\b(Agent|Task)\b/;
// WR-02 fix: allow an optional quote (single or double) between the dash and the token so a
// QUOTED YAML array item (`- "Agent"`, `- 'Agent'`) — valid YAML, a real spawn-grant shape — is
// caught, not just the bare `- Agent`. Mirrors WR05_COMMA's permissiveness.
const WR05_ARRAY = /^[ \t]*-[ \t]*["']?(Agent|Task)\b/;
const WR05_SCAN = [
    "agent-factory/packaging/subagent.frontmatter.md",
    "agent-factory/packaging/slash-command.template.md",
    ".claude/skills/grugops/SKILL.md",
    ".claude/agents/grugops-orchestrator.md",
];
function guardWr05() {
    process.stdout.write("\n[guard_wr05] no spawn-tool grant in packaging-template / adapter frontmatter (WR-05)\n");
    const hits = [
        ...grepFiles(WR05_SCAN, WR05_COMMA),
        ...grepFiles(WR05_SCAN, WR05_ARRAY),
    ].join("\n");
    if (hits === "") {
        pass("WR-05: no spawn grant in frontmatter");
    }
    else {
        fail(`WR-05 spawn grant:\n${hits}`);
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
// SEC_VOICE_FILES (D-10, Phase 14) — the 3 NON-role security surfaces. They have NO
// `## Caveman prompt` fence, so the fence-strip is a harmless no-op and they are scanned WHOLE.
// `security-nfr.md` is ALREADY in ROLE_FILES — do NOT add it here.
const SEC_VOICE_FILES = [
    "agent-factory/workflows/15-security-audit.md",
    "agent-factory/checklists/security-nfr-checklist.md",
    "agent-factory/handoffs/security-nfr-handoff.md",
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
            return "4160 3937";
        case "release-manager.md":
            return "4144 3922";
        case "agents-md-scribe.md":
            return "3910 3701";
        case "architect-design.md":
            return "3617 3423";
        case "ba-pm.md":
            return "3294 3075"; // PERS-02 BA headroom (+20% / +12%)
        case "factory-coach.md":
            return "3420 3237";
        case "frontend-ui.md":
            return "3969 3757"; // Phase 13 — 17th role (UI-01)
        case "incident-responder.md":
            return "3387 3206";
        case "installer.md":
            return "3345 3166";
        case "software-engineer.md":
            return "3307 3130";
        case "qe-e2e.md":
            return "3224 3051";
        case "uat-planner.md":
            return "3149 2980";
        case "system-analyst.md":
            return "2809 2659";
        case "greenfield-mapper.md":
            return "2673 2530";
        case "brownfield-mapper.md":
            return "2487 2354";
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
// Run all guards.
// ---------------------------------------------------------------------------
process.stdout.write("== Phase 10 foundation-guards gate (SDLC-02 / SC2) ==\n");
guardWr05();
guardAgentsBytes();
guardAdapterSize();
guardVoice();
guardCavemanPreserved();
guardRoleSize();
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

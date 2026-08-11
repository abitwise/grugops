// check-uat-oracles.ts — Phase 19 Tier-1 deterministic auto-UAT oracles (UAT-AUTO-01/03/05).
//
// The honest, no-LLM half of the auto-UAT harness: three fail-red, never-fabricate oracles that
// resolve the DETERMINISTIC portions of the deferred live-runtime UATs with pure greps, a JSON
// parse, and a single child-process assertion — no agent grading its own homework (Constraint #6).
//
//   oracleWr05Wording (B3 / UAT-AUTO-01) — asserts the three WR-05 closure beats (Phase 8 dropped /
//                       Phase 10 guard_wr05 / Phase 11 re-verified GREEN) are present in ALL FOUR
//                       .planning tracking docs. Fails red if any beat is missing in any file, and
//                       fails red (CR-01) if any scan file is absent.
//   oracleHooksWiring (A2 / UAT-AUTO-02) — reads hooks/hooks.json, confirms the PreToolUse matcher
//                       is "Bash" and the command routes to the committed guard.js, then spawns
//                       guard.js with a matched kubectl-apply payload and asserts the deny-JSON.
//                       This is the WIRING contract only — guard.test.ts covers guard logic (26/26);
//                       re-testing it here would be scope creep.
//   oracleDualPathEquivalence (A3 / UAT-AUTO-03, DOGF-01) — replays ONE seeded decomposition two ways
//                       (parallel-spawn simulation vs sequential drain) in hermetic temp roots, driving
//                       the committed claim.js/context-io.js, then asserts the two paths converge on the
//                       SAME on-disk admitted-note set (via the single-source dual-path-equivalence
//                       comparator), the SAME done/ artifact, and the SAME frozen verdict string. This
//                       REPLACES the former structural-grep oracleParity: real substrate convergence,
//                       not a doc-shape grep. The finding carries a FROZEN synthetic §14-gate stamp
//                       (D-03) — no live gate/emitVerdict/admit call, kept deterministic and no-LLM.
//
// This module is STANDALONE — its own run-all block + exit tail (mirroring the catalog-freshness.ts
// standalone-not-folded precedent, D-07). It is wired as its own lane AND its three oracle functions
// are EXPORTED so the foundation-guards aggregator (Plan 03 / UAT-AUTO-05) can import and invoke them
// and inherit their fail signal. The run-all block is guarded by an `import.meta`-vs-argv entry check
// so a direct `node scripts/check-uat-oracles.js` runs all three and exits 0/1, while importing the
// module for its functions does NOT double-run the exit tail.
//
// Strictly READ-ONLY except the A2 child-process spawn (which runs the committed guard.js with a
// synthetic PreToolUse payload and reads its stdout — it never deploys anything and NEVER sets the
// approval env var). Node stdlib ONLY — node:fs + node:path + node:child_process. Zero npm deps.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/safety/trace surface, never caveman voice).
//
//   node scripts/check-uat-oracles.js
// Exit 0 = all three oracles GREEN (ALL CHECKS PASSED); exit 1 = at least one FAIL.
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync, } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
// Substrate primitives (committed .js twins) + the single-source equivalence comparator. The Tier-1
// oracleDualPathEquivalence drives these directly to replay one seed two ways on disk (DOGF-01).
import { appendNote } from "./context-io.js";
import { claimTask, transition } from "./claim.js";
import { projectTaskState, assertEquivalent } from "./dual-path-equivalence.js";
// CHECK_ROOT override is load-bearing: the Vitest harness plants violations into a hermetic mirror
// dir and points CHECK_ROOT at it, then spawns the committed .js against that mirror. When unset,
// resolve every path against the script-relative repo root (cwd does not matter).
const ROOT = process.env.CHECK_ROOT
    ? process.env.CHECK_ROOT
    : join(import.meta.dirname, "..");
const abs = (rel) => join(ROOT, rel);
const fileExists = (rel) => existsSync(abs(rel));
const readText = (rel) => readFileSync(abs(rel), "utf8");
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
};
// Exported accessor so an importing aggregator can read the accumulated fail count after invoking
// the oracles (Plan 03 / UAT-AUTO-05). Each oracle increments the shared FAILS on a defect, so an
// importer that calls all three then reads this value inherits the fail signal.
export const uatOracleFails = () => FAILS;
// grep -rnE over an explicit file list: return the `path:lineno:line` hits (1-based line numbers,
// mirroring `grep -n`). Missing files are silently skipped here — callers must do their own CR-01
// missing-file fail-red FIRST (see each oracle below).
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
// oracleWr05Wording (B3 / UAT-AUTO-01) — WR-05 closure-beat consistency across the four tracking docs.
//
// The four .planning docs each narrate the WR-05 spawn-grant retirement. The CONTEXT summary slug
// "dropped P8 → guarded P10 → re-verified P11" appears VERBATIM in NONE of them — a naive exact-string
// grep would false-fail correct docs. Instead assert the three SEMANTIC beats per file with tolerant
// per-beat regexes (each beat = the action token + its phase, present on the same line). Every file
// must carry every beat; a missing file fails red (CR-01).
// ---------------------------------------------------------------------------
// CANDIDATE STRANGENESS FINDING — RECORDED HERE, DELIBERATELY NOT SETTLED HERE (Phase 28 / D-07
// category 5, raised while fixing the D-20 hang at these same lines).
//
// This oracle asserts that four `.planning/` documents narrate a "dropped P8 -> guarded P10 ->
// re-verified P11" story from two milestones ago, in a repository that ARCHIVES `.planning/` at
// milestone close. Whether it is still load-bearing is an open question, and it is a real one.
//
// It is NOT answered by the D-20 bug fix. Retiring an oracle inside a bug fix is the silent
// retirement Phase 28 exists to prevent, so this is written down at its file and line and routed
// to the disposition register (plan 28-06) to be dispositioned in the open, with a reason, like
// every other finding. Do not act on this note without that disposition.
//
//   Finding site: scripts/check-uat-oracles.ts:110-134 (WR05_SCAN + WR05_BEATS) and the
//                 oracleWr05Wording entry point below.
//   Category:     5 (strangeness — text with no remaining reader).
//   Owner:        plan 28-06 (the disposition register).
const WR05_SCAN = [
    ".planning/PROJECT.md",
    ".planning/STATE.md",
    ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
    ".planning/RETROSPECTIVE.md",
];
// WR05_MAX_LINE_BYTES — the per-line WORK bound for this oracle's input (Phase 28 / D-20 item 3).
//
// WHY A BOUND IS NEEDED EVEN THOUGH THE REGEXES ARE NOW ANCHORED. `WR05_SCAN` above is a
// hand-listed set of `.planning/` documents, and one of them — `.planning/STATE.md` — is an
// agent-written narrative that the GSD workflow APPENDS TO ON EVERY STATE UPDATE. Its content is
// therefore unbounded and not authored by anyone who is thinking about this gate. Anchoring makes
// the per-line predicate LINEAR in line length; it does not stop the oracle from reading
// arbitrarily large prose. The two mechanisms answer different questions and are deliberately kept
// separate: the anchor answers "how expensive is one match attempt?", the bound answers "how much
// input will this gate agree to look at at all?".
//
// WHY IT REFUSES RATHER THAN TRUNCATES. This oracle runs inside scripts/check-foundation-guards.js
// in CI, and check-foundation-guards.test.ts spawns that aggregator 112 times. A gate that does not
// terminate promptly HANGS rather than FAILS, and a hung gate is not a red gate — it is a gate with
// no verdict at all, which in practice gets marked flaky and skipped. So the bound exists to convert
// an unbounded cost into a loud, NAMED refusal (the same rationale kit-model.ts:150-170 records for
// MAX_WALK_ENTRIES). Silently skipping the over-long line would be a truncated scan, and a truncated
// scan passes every downstream check exactly the way a vacuous one does.
//
// FLOOR: REPORT, NEVER THROW. kit-model.ts is a library and throws; this file is a GATE and must
// report through fail() — the same throw-versus-report split documented at kit-model.ts:744-753.
//
// EXACT INTEGER COMPARISON AT THE NAMED CONSTANT. A line of exactly WR05_MAX_LINE_BYTES is still
// under the bound and a line of WR05_MAX_LINE_BYTES+1 trips it, so the threshold cannot be crossed
// by an off-by-one. Measured in UTF-8 BYTES, which is always >= the UTF-16 code-unit count the regex
// engine actually walks, so bounding bytes is a valid ceiling on the match work.
//
// VALUE. Measured 2026-08-11 at HEAD: the longest line in any WR05_SCAN file is 7,994 bytes
// (.planning/STATE.md); PROJECT.md peaks at 6,651. 262,144 (256 KiB) leaves ~32x headroom over the
// real tree while still refusing the 527 KB line that produced the original non-termination. A
// single 256 KiB line in a planning markdown document is unambiguously pathological.
//
// THIS IS NOT A DERIVATION OF WR05_SCAN. Deriving WR05_SCAN's MEMBERSHIP is explicitly out of scope
// (Phase 28 deferred item). This constant bounds the oracle's INPUT SIZE and says nothing about
// which files are in the set — a later reader must not mistake the one for the other.
export const WR05_MAX_LINE_BYTES = 262144;
// Per-beat tolerant regexes. Each requires BOTH the action token AND its phase on the SAME line
// (line-anchored lookaheads), case-insensitive, accommodating the differing prose across the four
// files (e.g. STATE.md's `guard_wr05` is followed by `(scripts/check-foundation-guards.sh)` before
// `in Phase 10`, so the beat2 regex must not require token adjacency).
//
// ANCHORED — Phase 28 / D-20 item 1. Each regex was previously a bare sequence of zero-width
// lookaheads with NO consuming atom, so a failed match was retried at every start position and each
// retry re-scanned the rest of the line: cost quadratic in line length. Measured on this box
// (node v24.12.0, darwin) against the committed .js with one synthetic non-matching line in
// .planning/STATE.md: 32 KiB -> 1.97 s, 64 KiB -> 6.29 s, 128 KiB -> 23.62 s, 256 KiB -> 92.58 s,
// and the 527 KB line found in the wild never returned at all.
//
// The repair is `^` plus a consuming `[\s\S]`, matching the anchoring shape already used at the
// ASYM_ROWS regexes below (`/^\|\s*\*\*Codex CLI\*\*/`). `^` (no `m` flag; grepFiles has already
// split on newlines, so the subject IS one line) means exactly one start position is attempted.
// `[\s\S]` is the consuming atom, so the linearity does not depend on any engine start-anchor
// optimisation. `[\s\S]` rather than `.` deliberately: `.` excludes \r and the Unicode line
// separators, which would change the verdict on a CRLF-terminated line.
//
// THE VERDICT IS UNCHANGED, AND THAT WAS MEASURED NOT REASONED. Both lookaheads still start their
// `.*` at position 0, so "this line carries the action token AND its phase, anywhere, in any order,
// case-insensitively" means exactly what it meant before; `[\s\S]` can only fail on an empty line,
// which could never satisfy a lookahead anyway. Proof of preservation is a byte-comparison of this
// gate's FULL output over the real tree before and after the change (empty diff), not a reading of
// the regexes.
//
// THE CLASS IS CLOSED BY MEASUREMENT. Scanning every regex literal in every .ts file under scripts/
// for a body consisting of nothing but lookaround groups found FOUR, not the three assumed: these
// three, plus `/(?=^---\nid:)/m` at compactor.test.ts:1704. That fourth one is SANCTIONED and named
// in WR05_SOLE_SANCTIONED_PURE_LOOKAHEAD in this file's test: it is a String.split() separator,
// where zero-width is the whole point (a consuming atom would eat the delimiter), it carries `^`
// inside the lookahead so a non-line-start position fails in O(1), and its subject is a bounded
// test fixture. check-uat-oracles.test.ts asserts these three are no longer in the class and that
// the sanctioned split separator is the only member left.
export const WR05_BEATS = [
    {
        label: "beat1: spawn grant dropped in Phase 8",
        re: /^(?=.*\bdropped\b)(?=.*\bPhase[ -]?8\b)[\s\S]/i,
    },
    {
        label: "beat2: guarded by guard_wr05 in Phase 10",
        re: /^(?=.*guard_wr05)(?=.*\bPhase[ -]?10\b)[\s\S]/i,
    },
    {
        label: "beat3: re-verified GREEN after Phase 11",
        re: /^(?=.*re-verified GREEN)(?=.*\bPhase[ -]?11\b)[\s\S]/i,
    },
];
// The WR05_MAX_LINE_BYTES enforcement pass (D-20 item 3). Runs ONCE over the scan set, BEFORE any
// beat regex touches any line, and returns one refusal message per over-long line. Running it up
// front rather than inside grepFiles is deliberate on both counts: grepFiles is called once per
// beat, so enforcing there would report the same line three times, and — more importantly — the
// point of the bound is that the oversized line is never fed to a regex at all.
function wr05LineBoundRefusals(files) {
    const refusals = [];
    for (const rel of files) {
        if (!fileExists(rel))
            continue; // CR-01 already fail-reds a missing file, ahead of this pass
        const lines = readText(rel).split("\n");
        for (let i = 0; i < lines.length; i++) {
            const bytes = Buffer.byteLength(lines[i], "utf8");
            if (bytes > WR05_MAX_LINE_BYTES) {
                refusals.push(`${rel}:${i + 1} is ${bytes} bytes long, over WR05_MAX_LINE_BYTES=${WR05_MAX_LINE_BYTES} — ` +
                    `refusing to scan this file for the WR-05 closure beats. This oracle reads agent-written ` +
                    `.planning/ prose that grows without a ceiling, and an unbounded line makes the gate hang ` +
                    `instead of fail. Skipping just this line would be a silent truncation, and a truncated ` +
                    `scan passes every downstream check, so the whole beat scan is refused by name instead. ` +
                    `Shorten the offending line (it is almost certainly a writer defect, not real prose).`);
            }
        }
    }
    return refusals;
}
// Phase 23 asymmetry assertion (D-19 / Pitfall 3) — after the WR-05 flip the 5-tool tables in
// adapters.md + README.md are ASYMMETRIC: only the Claude Code row carries the coordinator-spawn
// language; the four other CLI rows (Codex/Gemini/OpenCode/Copilot) MUST still say no-spawn /
// sequential role-load. A bulk find-replace that lets a non-CC row grow spawn/coordinator wording
// is the drift bug this assertion catches. Explicit scan list (never a repo-wide grep).
const ASYM_TABLE_FILES = [
    "agent-factory/packaging/adapters.md",
    "agent-factory/README.md",
];
// A 5-tool-table row is a markdown table line whose first cell names the tool (bold). Match the row
// by its leading bold tool name so the scan is anchored to the table, not arbitrary prose.
const ASYM_ROWS = [
    { label: "Codex CLI", rowRe: /^\|\s*\*\*Codex CLI\*\*/ },
    { label: "Gemini CLI", rowRe: /^\|\s*\*\*Gemini CLI\*\*/ },
    { label: "OpenCode", rowRe: /^\|\s*\*\*OpenCode\*\*/ },
    { label: "GitHub Copilot CLI", rowRe: /^\|\s*\*\*GitHub Copilot CLI\*\*/ },
    { label: "Claude Code", rowRe: /^\|\s*\*\*Claude Code\*\*/ },
];
// Spawn/coordinator wording that MUST NOT appear in a non-CC row, and MUST appear in the CC row.
//
// WR-01 broadened: the prohibited set is the CONCEPT of parallel/coordinator dispatch, not three
// exact phrasings. A drifted non-CC row advertising "parallel role dispatch", "fan-out agents",
// "concurrent sub-agents", or "runs roles in parallel" previously passed both directions (it tripped
// neither the old three-phrase ASYM_SPAWN_WORDING nor lost its "Sequential role-load" no-spawn
// wording). The broadened alternation catches the concept tokens.
//
// The bare `spawn` token is handled carefully so it COEXISTS with the legitimate "no spawn" wording
// every non-CC row carries: `\bspawn` is matched only when NOT immediately preceded by "no " (a
// negative-lookbehind-free form via the `(?<!no )` lookbehind, supported on the Node 22+ floor). So
// "Sequential role-load — no spawn" does NOT trip, but "may spawn role agents" / "spawns role agents"
// / "parallel spawn" does. `coordinator`, `parallel`, `concurren(t)`, and `fan-out` are flat tokens.
const ASYM_SPAWN_WORDING = /coordinator|parallel|concurren|fan-?out|dispatch[^|]*agent|(?<!no )\bspawn/i;
// The no-spawn wording every non-CC row MUST still carry (sequential single-window load).
const ASYM_NOSPAWN_WORDING = /no spawn|Sequential role-load/i;
export function oracleWr05Wording() {
    process.stdout.write("\n[oracleWr05Wording] WR-05 closure beats + the asymmetric 5-tool-table flip (B3 / UAT-AUTO-01, D-19)\n");
    // CR-01 missing-file fail-red: a scan file that is absent must fail red NAMING the file, never
    // vacuous-PASS. Done FIRST so a missing input can never read as "every file carries every beat".
    let missing = false;
    for (const f of [...WR05_SCAN, ...ASYM_TABLE_FILES]) {
        if (!fileExists(f)) {
            fail(`${f} missing (required WR-05 tracking/table doc)`);
            missing = true;
        }
    }
    if (missing)
        return;
    // D-20 item 3 input bound. Runs AFTER the CR-01 missing-file fail-red (a missing file must be
    // named as missing, not as unbounded) and BEFORE any beat regex sees any line. A refusal here
    // returns early: continuing would mean running the beat scan over the very input the bound just
    // declined, and reporting a beat verdict derived from input the gate refused to read would be a
    // fabricated verdict.
    const boundRefusals = wr05LineBoundRefusals(WR05_SCAN);
    if (boundRefusals.length > 0) {
        for (const r of boundRefusals)
            fail(r);
        return;
    }
    let beatFail = "";
    for (const beat of WR05_BEATS) {
        // grepFiles returns a hit per file that carries the beat on some line. The beat passes only when
        // EVERY scan file carries it (hit count == file count). Name the files that are missing the beat.
        const hits = grepFiles(WR05_SCAN, beat.re);
        const filesWithBeat = new Set(hits.map((h) => h.split(":")[0]));
        if (filesWithBeat.size !== WR05_SCAN.length) {
            const absent = WR05_SCAN.filter((f) => !filesWithBeat.has(f));
            beatFail += `\n  ${beat.label} — missing in: ${absent.join(", ")}`;
        }
    }
    // Asymmetry assertion (D-19 / Pitfall 3): scan each 5-tool table row in adapters.md + README.md.
    // The four non-CC rows MUST carry no-spawn wording and MUST NOT carry spawn/coordinator wording;
    // the Claude Code row MUST carry the spawn/coordinator wording. Fail naming the row + file.
    let asymFail = "";
    for (const file of ASYM_TABLE_FILES) {
        const lines = readText(file).split("\n");
        for (const { label, rowRe } of ASYM_ROWS) {
            // WR-03: validate EVERY matching row for the tool, not just the first. The real tree carries
            // exactly one row per tool per file (verified 2026-06-21: adapters.md + README.md each have a
            // single bold-tool-name row per CLI). A SECOND matching row — a drifted legacy/overview table
            // that gained spawn wording on a duplicate row — would be invisible to a first-match `find`; a
            // `filter` over all matches makes it visible. We assert one-per-tool so a duplicate cannot hide,
            // then validate each matching row in its direction.
            const rows = lines.filter((l) => rowRe.test(l));
            if (rows.length === 0)
                continue; // README's table omits headers some rows carry; absence is not drift here
            if (rows.length > 1) {
                asymFail += `\n  ${file}: found ${rows.length} table rows for ${label} — a duplicate/legacy row could hide asymmetry drift (expected exactly one row per tool)`;
            }
            const isCC = label === "Claude Code";
            for (const row of rows) {
                if (isCC) {
                    if (!ASYM_SPAWN_WORDING.test(row)) {
                        asymFail += `\n  ${file}: the Claude Code row lost the coordinator-spawn wording (the flip must keep it)`;
                    }
                }
                else {
                    if (ASYM_SPAWN_WORDING.test(row)) {
                        asymFail += `\n  ${file}: the ${label} row gained spawn/coordinator wording — asymmetry drift (only the Claude Code row may spawn)`;
                    }
                    if (!ASYM_NOSPAWN_WORDING.test(row)) {
                        asymFail += `\n  ${file}: the ${label} row lost its no-spawn / sequential-role-load wording`;
                    }
                }
            }
        }
    }
    if (beatFail === "" && asymFail === "") {
        pass("WR-05 wording: closure beats present in all four tracking docs; the 5-tool-table flip is asymmetric (CC row spawns, four CLI rows stay no-spawn)");
    }
    else {
        fail(`WR-05 wording-consistency violation:${beatFail}${asymFail}`);
    }
}
// ---------------------------------------------------------------------------
// oracleHooksWiring (A2 / UAT-AUTO-02) — hooks.json → guard.js wiring contract.
//
// Asserts the PreToolUse hook is WIRED correctly (matcher "Bash"; command routes to guard.js) and
// that the committed guard.js actually DENIES a matched deploy via the deny-JSON. This is the wiring
// half of SAFE-02; guard.test.ts already covers guard LOGIC 26/26, so this oracle never adds
// deny/allow/refuse-self-set cases (that would be scope creep). It NEVER sets the approval env var.
// ---------------------------------------------------------------------------
export function oracleHooksWiring() {
    process.stdout.write("\n[oracleHooksWiring] hooks.json routes a Bash PreToolUse matcher to guard.js, which denies a matched deploy (A2 / UAT-AUTO-02)\n");
    // CR-01 missing-file fail-red for both fixed inputs the oracle reads.
    if (!fileExists("hooks/hooks.json")) {
        fail("hooks/hooks.json missing (required for the PreToolUse wiring check)");
        return;
    }
    if (!fileExists("hooks/guard.js")) {
        fail("hooks/guard.js missing (required to assert the deny contract)");
        return;
    }
    // Fail-closed JSON parse (ASVS V5): a malformed hooks.json must fail red, never throw past us.
    let cfg;
    try {
        cfg = JSON.parse(readText("hooks/hooks.json"));
    }
    catch (e) {
        fail(`hooks/hooks.json is not valid JSON — fail-closed (${e.message})`);
        return;
    }
    // Defensive structural navigation — any missing/wrong-shaped node is a wiring defect, not a crash.
    const pre = cfg?.hooks?.PreToolUse;
    if (!Array.isArray(pre) || pre.length === 0) {
        fail("hooks.json has no PreToolUse hook array (wiring defect)");
        return;
    }
    const entry = pre[0];
    if (entry?.matcher !== "Bash") {
        fail(`hooks.json PreToolUse[0].matcher is not "Bash" (got ${JSON.stringify(entry?.matcher)}) — the guard would not see Bash commands`);
        return;
    }
    const inner = entry.hooks;
    if (!Array.isArray(inner) || inner.length === 0) {
        fail("hooks.json PreToolUse[0].hooks is empty (no command wired)");
        return;
    }
    const command = inner[0].command;
    // Assert the command REFERENCES guard.js (the wiring) — do NOT string-equal the whole
    // `${CLAUDE_PLUGIN_ROOT}` wrapper (that path is environment-dependent and not the contract).
    if (typeof command !== "string" || !/guard\.js/.test(command)) {
        fail(`hooks.json PreToolUse[0].hooks[0].command does not reference guard.js (got ${JSON.stringify(command)})`);
        return;
    }
    // Spawn the COMMITTED guard.js with a matched kubectl-apply payload and assert the deny-JSON.
    // Arg-array spawn (never shell:true on the data path — ASVS V5 / command-injection). The approval
    // env var is NEVER set (V14 — humans hold deploy; the harness must never self-approve).
    const payload = JSON.stringify({
        tool_input: { command: "kubectl apply -f deploy.yaml" },
    });
    const r = spawnSync("node", [abs("hooks/guard.js")], {
        input: payload,
        encoding: "utf8",
    });
    if (r.status !== 0) {
        fail(`guard.js exited nonzero (${r.status}) on a matched deploy payload — expected exit 0 + deny-JSON`);
        return;
    }
    const stdout = r.stdout ?? "";
    if (!stdout.includes('"permissionDecision":"deny"')) {
        fail(`guard.js did not emit the deny decision for a matched deploy (stdout: ${stdout.slice(0, 200)})`);
        return;
    }
    pass('hooks.json → guard.js wiring intact: "Bash" matcher routes to guard.js, which denies a matched deploy');
}
// ---------------------------------------------------------------------------
// oracleDualPathEquivalence (A3 / UAT-AUTO-03, DOGF-01) — real on-disk dual-path convergence proof.
//
// REPLACES the former structural-grep oracleParity. Instead of reading a doc's parity table, it drives
// the committed substrate primitives (claim.js + context-io.js) to replay ONE seeded decomposition two
// independent ways against two hermetic mkdtempSync roots:
//   Mode A (parallel-spawn simulation) — claim all up to width, doWork in fan-out order, then transition
//                                        every task to done (interleaved).
//   Mode B (sequential drain)          — claim one, doWork, done, repeat (strict serial).
// Then it asserts the two final substrates are EQUAL order-independently: the same done/ record set,
// the same per-task admitted-note set (via the single-source projectTaskState/assertEquivalent — the
// SAME comparator convergence-spine.test.ts uses, so the definitions cannot drift), and the frozen
// verdict string present on both. "verified means verified / degrade never break" becomes a substrate-
// convergence proof, not a doc grep.
//
// The seeded decomposition includes >=1 admitted `finding` carrying a FROZEN synthetic stamp
// `verified_by: §14-gate#<fixed-id>` that passes context-io validate() structurally via GATE_STAMP_RE
// (D-03) — deliberately NO live gate: this oracle never calls emitVerdict (the sole sanctioned
// by:§14-gate writer) nor admit (the live-verdict cross-check); gate/admission LOGIC is tested by its
// own suites. Keeping the Tier-1 lane deterministic and tightly scoped is the whole point.
// ---------------------------------------------------------------------------
// Frozen fixture constants (D-03). FIXED_ID makes the stamp deterministic; FROZEN_VERDICT is a fixture
// string literal (context-io's green marker), NOT a gate-authored note.
const FIXED_ID = "R26-DOGF01-0001";
const GATE_STAMP = `§14-gate#${FIXED_ID}`; // literal stamp — passes validate() via GATE_STAMP_RE
const FROZEN_VERDICT = "READY_FOR_HUMAN_REVIEW"; // frozen verdict STRING (no live gate call)
const EQUIV_TASKS = ["t1", "t2", "t3"]; // minimal seeded decomposition (honors wip_limit width of 3)
function seedEquivSubstrate(subtasks) {
    const queueRoot = mkdtempSync(join(tmpdir(), "dpe-equiv-"));
    for (const stage of ["pending", "claimed", "done"]) {
        mkdirSync(join(queueRoot, stage), { recursive: true });
    }
    for (const t of subtasks) {
        writeFileSync(join(queueRoot, "pending", `${t}.md`), `# subtask ${t}\nref: .grugops/context/${t}/\n`);
    }
    const contextRoot = join(queueRoot, ".grugops", "context");
    mkdirSync(contextRoot, { recursive: true });
    return { queueRoot, contextRoot };
}
// Deterministic per-task work, IDENTICAL in both modes (only the RUN ORDER differs). Each task gets one
// soft observation note (no stamp) PLUS one admitted finding carrying the frozen §14-gate stamp and the
// frozen verdict in its body. Fixed `at` values keyed off the task make the canonical replay sort
// mode-independent. Writes through the committed context-io.js appendNote to an explicit contextRoot.
function equivDoWork(sub, task) {
    const n = task.replace(/[^0-9]/g, "") || "0";
    const soft = {
        kind: "observation",
        by: "engineer",
        at: `2026-06-21T10:${String(n).padStart(2, "0")}:00.000Z`,
        verified_by: "",
        confidence: "high",
        refs: [],
        supersedes: null,
    };
    appendNote(task, soft, `observed work for ${task}`, sub.contextRoot);
    const finding = {
        kind: "finding",
        by: "engineer",
        at: `2026-06-21T10:${String(n).padStart(2, "0")}:30.000Z`,
        verified_by: GATE_STAMP,
        confidence: "high",
        refs: [GATE_STAMP],
        supersedes: null,
    };
    appendNote(task, finding, `${FROZEN_VERDICT}: seeded admitted finding for ${task}`, sub.contextRoot);
}
export function oracleDualPathEquivalence() {
    process.stdout.write("\n[oracleDualPathEquivalence] one seed replayed parallel-spawn-sim vs sequential-drain converges on the same admitted note-set + done/ artifact + frozen verdict (A3 / UAT-AUTO-03, DOGF-01)\n");
    const tmpRoots = [];
    try {
        // ── Mode A: PARALLEL-spawn simulation — claim all, work in fan-out (reversed) order, then all done.
        const a = seedEquivSubstrate(EQUIV_TASKS);
        tmpRoots.push(a.queueRoot);
        for (const t of EQUIV_TASKS) {
            if (!claimTask(a.queueRoot, t, "engineer")) {
                fail(`Mode A (parallel-spawn) could not claim seeded task "${t}"`);
                return;
            }
            transition(a.queueRoot, t, "pending", "claimed");
        }
        for (const t of [...EQUIV_TASKS].reverse())
            equivDoWork(a, t);
        for (const t of EQUIV_TASKS)
            transition(a.queueRoot, t, "claimed", "done");
        // ── Mode B: SEQUENTIAL drain — claim one, work, done, repeat (strict serial).
        const b = seedEquivSubstrate(EQUIV_TASKS);
        tmpRoots.push(b.queueRoot);
        for (const t of EQUIV_TASKS) {
            if (!claimTask(b.queueRoot, t, "engineer")) {
                fail(`Mode B (sequential-drain) could not claim seeded task "${t}"`);
                return;
            }
            transition(b.queueRoot, t, "pending", "claimed");
            equivDoWork(b, t);
            transition(b.queueRoot, t, "claimed", "done");
        }
        // ── Converge: the two final substrates must be EQUAL order-independently. ─────────────────────
        let divergence = "";
        // Same done/ record set — AND both must equal the expected per-task artifact set. Comparing the
        // two paths to each other ALONE is vacuous: a `transition` no-op regression drains neither queue,
        // leaving BOTH done/ dirs empty and equal, and the check would pass green (WR-01). Anchoring to the
        // expected `${task}.md` set makes an empty (or partial) drain fail red.
        const doneExpected = JSON.stringify([...EQUIV_TASKS].map((t) => `${t}.md`).sort());
        const doneA = JSON.stringify(readdirSync(join(a.queueRoot, "done")).sort());
        const doneB = JSON.stringify(readdirSync(join(b.queueRoot, "done")).sort());
        if (doneA !== doneB) {
            divergence += `\n  done/ artifact set differs: A=${doneA} B=${doneB}`;
        }
        else if (doneA !== doneExpected) {
            divergence += `\n  done/ artifact set does not match the expected per-task set: got ${doneA}, expected ${doneExpected}`;
        }
        // Same per-task admitted-note set (single-source comparator), plus the frozen verdict + the frozen
        // finding stamp present on BOTH paths (never fabricate — assert the finding actually landed).
        for (const t of EQUIV_TASKS) {
            const pa = projectTaskState(a.contextRoot, t);
            const pb = projectTaskState(b.contextRoot, t);
            const diffs = assertEquivalent(pa, pb);
            if (diffs.length > 0) {
                divergence += `\n  task "${t}" note-sets diverge:${diffs.map((d) => `\n    - ${d}`).join("")}`;
            }
            const verdictA = pa.some((nr) => nr.body.includes(FROZEN_VERDICT));
            const verdictB = pb.some((nr) => nr.body.includes(FROZEN_VERDICT));
            if (!verdictA || !verdictB) {
                divergence += `\n  task "${t}" missing frozen verdict "${FROZEN_VERDICT}" on disk (A=${verdictA} B=${verdictB})`;
            }
            const stampA = pa.some((nr) => nr.verified_by === GATE_STAMP);
            const stampB = pb.some((nr) => nr.verified_by === GATE_STAMP);
            if (!stampA || !stampB) {
                divergence += `\n  task "${t}" missing the frozen finding stamp "${GATE_STAMP}" on disk (A=${stampA} B=${stampB})`;
            }
        }
        if (divergence === "") {
            pass("dual-path equivalence: parallel-spawn-sim and sequential-drain replays converge on the same admitted note-set, the same done/ artifact, and the frozen verdict on disk");
        }
        else {
            fail(`dual-path equivalence violation:${divergence}`);
        }
    }
    finally {
        for (const d of tmpRoots)
            rmSync(d, { recursive: true, force: true });
    }
}
// ---------------------------------------------------------------------------
// Run all oracles — STANDALONE entry only.
//
// Guarded so importing this module for its exported oracle functions (Plan 03 aggregator) does NOT
// auto-run the exit tail. The run-all block executes only when this file is the process entry point
// (`node scripts/check-uat-oracles.js`), mirroring the standalone-not-folded precedent (D-07).
// ---------------------------------------------------------------------------
function runAll() {
    process.stdout.write("== Phase 19 Tier-1 auto-UAT oracles (UAT-AUTO-01/03) ==\n");
    oracleWr05Wording();
    oracleHooksWiring();
    oracleDualPathEquivalence();
    process.stdout.write("\n== Result ==\n");
    if (FAILS === 0) {
        process.stdout.write("ALL CHECKS PASSED\n");
        process.exit(0);
    }
    else {
        process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
        process.exit(1);
    }
}
// Entry check: true only when this module was launched directly (not imported). process.argv[1] is
// the launched script path; compare it to this module's own file URL via pathToFileURL — a hand-built
// `file://${argv[1]}` URL does NOT match on Windows (backslash paths + drive letters), which would make
// a direct `node check-uat-oracles.js` run ZERO oracles and exit 0 — a fabricated green for a
// no-fabrication safety tool (CR-01). Every sibling script (claim/context-io/compactor) uses this form.
const isEntry = process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
    runAll();
}

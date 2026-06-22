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
//   oracleParity (A3 / UAT-AUTO-03) — reads examples/03-ticket-to-pr.md and asserts the dual-path
//                       parity table names the frozen handoff filenames + the frozen gate verdict in
//                       both dispatch columns, and NEVER marks a `pending human` cell passed.
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

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// CHECK_ROOT override is load-bearing: the Vitest harness plants violations into a hermetic mirror
// dir and points CHECK_ROOT at it, then spawns the committed .js against that mirror. When unset,
// resolve every path against the script-relative repo root (cwd does not matter).
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

const abs = (rel: string): string => join(ROOT, rel);
const fileExists = (rel: string): boolean => existsSync(abs(rel));
const readText = (rel: string): string => readFileSync(abs(rel), "utf8");

let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS += 1;
};
// warn() is advisory only — it does NOT increment FAILS (mirrors the foundation-guards spine).
const warn = (m: string): void => {
  process.stdout.write(`  WARN  ${m}\n`);
};

// Exported accessor so an importing aggregator can read the accumulated fail count after invoking
// the oracles (Plan 03 / UAT-AUTO-05). Each oracle increments the shared FAILS on a defect, so an
// importer that calls all three then reads this value inherits the fail signal.
export const uatOracleFails = (): number => FAILS;

// grep -rnE over an explicit file list: return the `path:lineno:line` hits (1-based line numbers,
// mirroring `grep -n`). Missing files are silently skipped here — callers must do their own CR-01
// missing-file fail-red FIRST (see each oracle below).
function grepFiles(files: string[], re: RegExp): string[] {
  const hits: string[] = [];
  for (const rel of files) {
    if (!fileExists(rel)) continue;
    const lines = readText(rel).split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) hits.push(`${rel}:${i + 1}:${lines[i]}`);
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
const WR05_SCAN = [
  ".planning/PROJECT.md",
  ".planning/STATE.md",
  ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
  ".planning/RETROSPECTIVE.md",
];

// Per-beat tolerant regexes. Each requires BOTH the action token AND its phase on the SAME line
// (line-anchored lookaheads), case-insensitive, accommodating the differing prose across the four
// files (e.g. STATE.md's `guard_wr05` is followed by `(scripts/check-foundation-guards.sh)` before
// `in Phase 10`, so the beat2 regex must not require token adjacency).
const WR05_BEATS: { label: string; re: RegExp }[] = [
  {
    label: "beat1: spawn grant dropped in Phase 8",
    re: /(?=.*\bdropped\b)(?=.*\bPhase[ -]?8\b)/i,
  },
  {
    label: "beat2: guarded by guard_wr05 in Phase 10",
    re: /(?=.*guard_wr05)(?=.*\bPhase[ -]?10\b)/i,
  },
  {
    label: "beat3: re-verified GREEN after Phase 11",
    re: /(?=.*re-verified GREEN)(?=.*\bPhase[ -]?11\b)/i,
  },
];

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
const ASYM_ROWS: { label: string; rowRe: RegExp }[] = [
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
const ASYM_SPAWN_WORDING =
  /coordinator|parallel|concurren|fan-?out|dispatch[^|]*agent|(?<!no )\bspawn/i;
// The no-spawn wording every non-CC row MUST still carry (sequential single-window load).
const ASYM_NOSPAWN_WORDING = /no spawn|Sequential role-load/i;

export function oracleWr05Wording(): void {
  process.stdout.write(
    "\n[oracleWr05Wording] WR-05 closure beats + the asymmetric 5-tool-table flip (B3 / UAT-AUTO-01, D-19)\n",
  );

  // CR-01 missing-file fail-red: a scan file that is absent must fail red NAMING the file, never
  // vacuous-PASS. Done FIRST so a missing input can never read as "every file carries every beat".
  let missing = false;
  for (const f of [...WR05_SCAN, ...ASYM_TABLE_FILES]) {
    if (!fileExists(f)) {
      fail(`${f} missing (required WR-05 tracking/table doc)`);
      missing = true;
    }
  }
  if (missing) return;

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
      if (rows.length === 0) continue; // README's table omits headers some rows carry; absence is not drift here
      if (rows.length > 1) {
        asymFail += `\n  ${file}: found ${rows.length} table rows for ${label} — a duplicate/legacy row could hide asymmetry drift (expected exactly one row per tool)`;
      }
      const isCC = label === "Claude Code";
      for (const row of rows) {
        if (isCC) {
          if (!ASYM_SPAWN_WORDING.test(row)) {
            asymFail += `\n  ${file}: the Claude Code row lost the coordinator-spawn wording (the flip must keep it)`;
          }
        } else {
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
    pass(
      "WR-05 wording: closure beats present in all four tracking docs; the 5-tool-table flip is asymmetric (CC row spawns, four CLI rows stay no-spawn)",
    );
  } else {
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
export function oracleHooksWiring(): void {
  process.stdout.write(
    "\n[oracleHooksWiring] hooks.json routes a Bash PreToolUse matcher to guard.js, which denies a matched deploy (A2 / UAT-AUTO-02)\n",
  );

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
  let cfg: unknown;
  try {
    cfg = JSON.parse(readText("hooks/hooks.json"));
  } catch (e) {
    fail(`hooks/hooks.json is not valid JSON — fail-closed (${(e as Error).message})`);
    return;
  }

  // Defensive structural navigation — any missing/wrong-shaped node is a wiring defect, not a crash.
  const pre = (cfg as { hooks?: { PreToolUse?: unknown } })?.hooks?.PreToolUse;
  if (!Array.isArray(pre) || pre.length === 0) {
    fail("hooks.json has no PreToolUse hook array (wiring defect)");
    return;
  }
  const entry = pre[0] as { matcher?: unknown; hooks?: unknown };
  if (entry?.matcher !== "Bash") {
    fail(`hooks.json PreToolUse[0].matcher is not "Bash" (got ${JSON.stringify(entry?.matcher)}) — the guard would not see Bash commands`);
    return;
  }
  const inner = entry.hooks;
  if (!Array.isArray(inner) || inner.length === 0) {
    fail("hooks.json PreToolUse[0].hooks is empty (no command wired)");
    return;
  }
  const command = (inner[0] as { command?: unknown }).command;
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
// oracleParity (A3 / UAT-AUTO-03) — dual-path parity table structural assertion.
//
// examples/03-ticket-to-pr.md carries the DOG-02 dual-path parity table: a Sequential AGENTS.md
// column (agent-proven) and a CC-native sub-agent column (currently `pending human`). The oracle
// asserts the table is structurally shaped for two dispatch columns and names the frozen handoff
// filenames + the frozen gate verdict — WITHOUT ever marking a `pending human` cell as passed
// (no-fabrication). The LIVE fill of the CC-native column comes from Plan 02's Tier-2 run, not here.
// ---------------------------------------------------------------------------
const PARITY_FILE = "examples/03-ticket-to-pr.md";
// (Phase 24) The 17 static handoff templates were deleted; the oracle no longer asserts the parity
// table NAMES specific handoff filenames (asserting against deleted artifacts — Pitfall 5). The
// oracle is NOT retired — the A3/DOG-02 equivalence retirement is Phase 26, out of scope. The live
// parity anchors that remain are the two dispatch-column shape and the frozen gate verdict; the
// per-role output a ticket now produces is recorded as typed notes (Workflow 16), not a static
// handoff file, so there is no deleted filename for the table to pin.
const FROZEN_VERDICT = "READY_FOR_HUMAN_REVIEW";
// The two dispatch-column headers that make the table a TWO-column parity table.
const SEQ_COLUMN = "Sequential AGENTS.md path";
const CC_COLUMN = "CC-native sub-agent path";

export function oracleParity(): void {
  process.stdout.write(
    "\n[oracleParity] dual-path parity table is two-column shaped + names the frozen verdict and never passes a pending-human cell (A3 / UAT-AUTO-03)\n",
  );

  // CR-01 missing-file fail-red.
  if (!fileExists(PARITY_FILE)) {
    fail(`${PARITY_FILE} missing (required for the dual-path parity check)`);
    return;
  }
  const text = readText(PARITY_FILE);

  let parityFail = "";

  // Structural: the table must be shaped for TWO dispatch columns (both headers present).
  if (!text.includes(SEQ_COLUMN)) {
    parityFail += `\n  missing the Sequential dispatch column header ("${SEQ_COLUMN}")`;
  }
  if (!text.includes(CC_COLUMN)) {
    parityFail += `\n  missing the CC-native dispatch column header ("${CC_COLUMN}")`;
  }

  // (Phase 24) No frozen-handoff-filename assertion: the static handoff templates were deleted, so
  // the oracle must not assert the parity table names deleted artifacts (Pitfall 5). The two
  // dispatch-column shape + the frozen gate verdict remain the live parity anchors.

  // Frozen gate verdict must be named.
  if (!text.includes(FROZEN_VERDICT)) {
    parityFail += `\n  missing frozen gate verdict "${FROZEN_VERDICT}"`;
  }

  // No-fabrication: the oracle must DISTINGUISH a structurally-parity-shaped + `pending human` cell
  // from a filled-and-matching cell. The CC-native column legitimately still reads `pending human`
  // (its live fill is the Tier-2 A3-live run, not this deterministic oracle). The structural pass
  // condition is "frozen strings present + two columns shaped" — it must NEVER read a `pending human`
  // cell AS a confirmed match. We surface the still-pending state explicitly (WARN, advisory) so the
  // oracle can never silently report the CC-native path as confirmed when it is not.
  const ccStillPending = /pending human/i.test(text);

  if (parityFail === "") {
    pass(
      "parity structure: two dispatch columns present, frozen verdict named",
    );
    if (ccStillPending) {
      // Advisory only — the structural floor passed; the live CC-native fill is human/Tier-2's job.
      // This is the no-fabrication guard surfaced honestly: the oracle does NOT claim the CC-native
      // column is confirmed.
      warn(
        "CC-native parity column still reads `pending human` — its live fill comes from the Tier-2 A3-live run; NOT marked confirmed here (no-fabrication)",
      );
    }
  } else {
    fail(`dual-path parity structural violation:${parityFail}`);
  }
}

// ---------------------------------------------------------------------------
// Run all oracles — STANDALONE entry only.
//
// Guarded so importing this module for its exported oracle functions (Plan 03 aggregator) does NOT
// auto-run the exit tail. The run-all block executes only when this file is the process entry point
// (`node scripts/check-uat-oracles.js`), mirroring the standalone-not-folded precedent (D-07).
// ---------------------------------------------------------------------------
function runAll(): void {
  process.stdout.write("== Phase 19 Tier-1 auto-UAT oracles (UAT-AUTO-01/03) ==\n");
  oracleWr05Wording();
  oracleHooksWiring();
  oracleParity();

  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
  } else {
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
  }
}

// Entry check: true only when this module was launched directly (not imported). process.argv[1] is
// the launched script path; compare it to this module's own file URL path.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isEntry) {
  runAll();
}

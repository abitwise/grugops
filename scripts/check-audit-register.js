// check-audit-register.ts — Phase 28 AUDIT-01 disposition-register completeness gate (D-05).
//
//   node scripts/check-audit-register.js
// Exit 0 = the register is complete and internally consistent; exit 1 = at least one FAIL.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path (transitively, through the modules it
// imports). Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
//
// ---------------------------------------------------------------------------------------------
// WHY THIS IS A CHECK AND NOT A CLAIM.
//
// Phase 29's roadmap entry declares a dependency on this register, and Phase 30 consumes the claim
// registry beside it. A `.planning/phases/28-.../` artifact is ARCHIVED AT MILESTONE CLOSE and is
// invisible to CI, so "the register is complete" written in a planning document is a sentence that
// stops being true without anything going red. The register therefore lives under `docs/` as a
// durable repo artifact, and this gate holds its completeness on every CI run.
//
// It lives under `docs/` and NOT under `agent-factory/` on purpose: install/install.ts copies the
// whole `agent-factory/` tree into every host repository, and an internal audit record is not
// something a user should find in their own repo.
//
// THIS GATE IS EXPECTED TO FAIL RED UNTIL THE READ PASS IN 28-06 AND 28-07 FILLS THE REGISTER.
// That is deliberate and it is the acceptance evidence for the same argument D-24 makes about the
// AUDIT-02 drift guard: a completeness gate that goes green the moment it appears has never been
// watched distinguish a complete register from an empty one. Measured at the commit that introduced
// it: exit 1, 37 empty observations and 37 unfilled safety-surface flags, with BOTH D-03 equalities
// already green — so the red is precisely the unread files and nothing else.
//
// THE THROW-VERSUS-REPORT SPLIT. scripts/audit-model.ts is a LIBRARY and throws on a register it
// cannot vouch for. This is a GATE and must REPORT: a stack trace is not a verdict, and a gate that
// dies is not a gate that failed. Every parse refusal is caught below and printed through fail().
// ---------------------------------------------------------------------------------------------
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readRegister, REGISTER_PATH, } from "./audit-model.js";
import { listRoles, listWorkflows } from "./kit-model.js";
// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror.
const ROOT = process.env.CHECK_ROOT
    ? process.env.CHECK_ROOT
    : join(import.meta.dirname, "..");
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
};
// Exported accessor so a later aggregator can fold this gate's verdict without reaching for a
// shared global (the check-uat-oracles precedent).
export const auditRegisterFails = () => FAILS;
const ROLES_SUBPATH = "agent-factory/roles";
const WORKFLOWS_SUBPATH = "agent-factory/workflows";
// ---------------------------------------------------------------------------
// THE BARE-OBSERVATION SET, WITH ITS BOUND AND ITS FORBIDDEN ALTERNATIVE.
//
// D-06 requires every row to carry a SUBSTANTIVE observation rather than the bare word describing
// an absence of findings, and this is that requirement ENFORCED rather than requested. An agent
// writing "clean" into 37 rows would produce a green gate over an audit that never happened
// (T-28-14), and this is as far as a mechanism can go against it.
//
// THE BOUND, STATED HONESTLY. This catches an observation that IS one of these, whole. It cannot
// catch a fluent, plausible, false observation, and no mechanism can — that residual is named in
// the register's own `## What this register does not prove` section rather than implied away here.
//
// THE FORBIDDEN ALTERNATIVE, NAMED SO IT IS NOT REDISCOVERED AS A GOOD IDEA: making this a
// SUBSTRING ban. "Clean of retired vocabulary, but the tier table at line 40 still predates the
// tier names" is a real observation, and banning the token would make correct text unsayable — the
// same trap dead-vocabulary.ts's header records twice. The comparison is against the WHOLE
// observation, normalized only for case and trailing punctuation.
// ---------------------------------------------------------------------------
const BARE_OBSERVATIONS = [
    "clean",
    "none",
    "n/a",
    "na",
    "ok",
    "fine",
    "good",
    "nothing",
    "no findings",
    "no finding",
    "no issues",
    "nothing found",
    "none found",
    "no drift",
    "verified",
    "read",
    "done",
];
function normalizeObservation(raw) {
    return raw
        .trim()
        .toLowerCase()
        .replace(/[.!;,]+$/, "")
        .trim();
}
// ---------------------------------------------------------------------------
// The check.
// ---------------------------------------------------------------------------
function runAll() {
    process.stdout.write("\n[check_audit_register] the AUDIT-01 disposition register is complete against the derived kit (D-03 / D-05)\n");
    // ── The derived side ─────────────────────────────────────────────────────
    let derivedRoles;
    let derivedWorkflows;
    try {
        derivedRoles = listRoles(ROOT).map((f) => `${ROLES_SUBPATH}/${f}`);
        derivedWorkflows = listWorkflows(ROOT).map((f) => `${WORKFLOWS_SUBPATH}/${f}`);
    }
    catch (e) {
        // kit-model throws on an unreadable or VACUOUS directory. Reporting a completeness verdict
        // against a set that could not be derived would be a fabricated verdict — an empty derived set
        // makes the equality trivially satisfiable, which is exactly what the library's throw prevents.
        fail(`the audit set could not be derived from scripts/kit-model.js — ${e.message}. ` +
            `Refusing to report a completeness verdict against a set that was never read`);
        finish();
        return;
    }
    const derived = [...derivedRoles, ...derivedWorkflows].sort();
    // ── The register side ────────────────────────────────────────────────────
    let register;
    try {
        register = readRegister(ROOT);
    }
    catch (e) {
        fail(`${REGISTER_PATH} could not be parsed — ${e.message}. The parse authority refuses ` +
            `what it cannot vouch for rather than skipping it, because a skipped row is a silent ` +
            `truncation and a truncated register satisfies every equality computed over it`);
        finish();
        return;
    }
    const counted = register.rows.filter((r) => r.counted);
    const uncounted = register.rows.filter((r) => !r.counted);
    // ── EQUALITY ONE — SET equality, in BOTH directions ──────────────────────
    //
    // This is SET equality on purpose. A count would pass while a decoy displaced a real member: 36
    // rows compared against 36 derived files agree perfectly while one row names a file that does not
    // exist and one file that does exist has no row. Both lists are reported in the DERIVED SORTED
    // order, so two runs over the same tree produce byte-identical output and a diff means a real
    // change rather than a reshuffle.
    const countedPaths = counted.map((r) => r.file).sort();
    if (countedPaths.join("\n") !== derived.join("\n")) {
        const missing = derived.filter((f) => !countedPaths.includes(f));
        const unexpected = countedPaths.filter((f) => !derived.includes(f));
        fail(`equality one: the register's counted rows are not exactly what the listers derive — ` +
            `missing [${missing.join(", ")}], unexpected [${unexpected.join(", ")}]. The register ` +
            `carries ${countedPaths.length} counted row(s) against ${derived.length} derived file(s) ` +
            `(${derivedRoles.length} roles + ${derivedWorkflows.length} workflows). This is SET ` +
            `equality on purpose: a count would pass while a decoy displaced a real member`);
    }
    // ── EQUALITY TWO — independent, and at TWO granularities ─────────────────
    //
    // Reported SEPARATELY from equality one. A single conflated tally lets one number absorb the
    // other's drift, which is the conflation that broke the backstop-marker accounting in this
    // project: a total that double-counts can never close, and the equality quietly stops meaning
    // anything while continuing to hold.
    const declaredSum = register.rows.reduce((n, r) => n + r.findings, 0);
    if (declaredSum !== register.findings.length) {
        fail(`equality two: Table A declares ${declaredSum} finding(s) in total, but Table B carries ` +
            `${register.findings.length} finding row(s). Neither number may absorb the other's drift, ` +
            `so this is reported independently of equality one`);
    }
    // The per-file granularity. The two totals can agree while two individual files are each wrong in
    // opposite directions, which is precisely why one tally is not enough.
    const actualPerFile = new Map();
    for (const f of register.findings) {
        actualPerFile.set(f.file, (actualPerFile.get(f.file) ?? 0) + 1);
    }
    const perFileMismatches = [];
    for (const row of register.rows) {
        const actual = actualPerFile.get(row.file) ?? 0;
        if (actual !== row.findings) {
            perFileMismatches.push(`${row.file} declares ${row.findings} but Table B carries ${actual}`);
        }
    }
    if (perFileMismatches.length > 0) {
        fail(`equality two (per file): ${perFileMismatches.length} row(s) declare a findings count that ` +
            `disagrees with their own Table B rows — ${perFileMismatches.join("; ")}`);
    }
    // ── D-06's substantive-observation requirement ───────────────────────────
    const blank = [];
    const bare = [];
    for (const row of register.rows) {
        const norm = normalizeObservation(row.observation);
        if (norm === "") {
            blank.push(`${row.file} (line ${row.line})`);
        }
        else if (BARE_OBSERVATIONS.includes(norm)) {
            bare.push(`${row.file} (line ${row.line}): "${row.observation.trim()}"`);
        }
    }
    if (blank.length > 0) {
        fail(`${blank.length} row(s) carry a BLANK observation — ${blank.join(", ")}. D-06 requires a ` +
            `substantive observation per row: an empty observation records that nobody wrote anything, ` +
            `which is the honest reading of an unread file and is not a completed row`);
    }
    if (bare.length > 0) {
        fail(`${bare.length} row(s) carry a BARE observation standing in for a substantive one — ` +
            `${bare.join("; ")}. The comparison is against the WHOLE observation, so a sentence that ` +
            `merely contains one of these words is fine; what is refused is the word standing alone`);
    }
    // ── D-18's safety_surface, and the unfilled marker ───────────────────────
    const unfilled = register.rows.filter((r) => r.safetySurface === "—");
    if (unfilled.length > 0) {
        fail(`${unfilled.length} row(s) still carry the unfilled \`safety_surface\` marker "—" — ` +
            `${unfilled.map((r) => `${r.file} (line ${r.line})`).join(", ")}. D-18 derives Phase 29's ` +
            `LANG-02 exclusion list from this column unioned with the claim registry's safety rows, so ` +
            `an unrecorded flag becomes a missing exclusion two phases later. The marker parses and ` +
            `fails here on purpose: writing \`no\` into an unread row would record a verdict nobody reached`);
    }
    // ── The uncounted rows are REPORTED, never invisible ──────────────────────
    // An out-of-set file recorded as a row and then never mentioned again is a file dropped in a
    // slower way. Every uncounted row is named on every run, with the reason its observation carries.
    const uncountedReport = uncounted
        .map((r) => `${r.file} — ${describeUncounted(r)}`)
        .join("; ");
    if (FAILS === 0) {
        // A PASS line must never state a check that was not performed. Every number below is read from
        // the run that just happened: the derived counts come from the listers, the register counts
        // from the parsed rows, and the findings totals from the two tables that were just compared.
        pass(`AUDIT-01 completeness: equality one holds — ${countedPaths.length} counted register row(s) ` +
            `set-equal in both directions to ${derived.length} derived file(s) ` +
            `(${derivedRoles.length} roles + ${derivedWorkflows.length} workflows); equality two holds ` +
            `— Table A declares ${declaredSum} finding(s) and Table B carries ${register.findings.length}, ` +
            `agreeing per file across all ${register.rows.length} row(s); ${uncounted.length} uncounted ` +
            `row(s) recorded by name (${uncountedReport}); every observation substantive and every ` +
            `safety_surface recorded`);
    }
    finish();
}
function describeUncounted(row) {
    const obs = row.observation.trim();
    return obs === "" ? "no reason recorded yet" : obs;
}
function finish() {
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
// Entry check: true only when launched directly. pathToFileURL rather than a hand-built
// `file://${argv[1]}` — the hand-built form does not match on Windows, which would make a direct
// run perform ZERO checks and exit 0, a fabricated green. It is also what lets the test file import
// the exported accessor without the import running the gate inside the vitest worker.
const isEntry = process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
    runAll();
}

// reference-check.ts — the TOOL-02 reference kit-shipped runnable (D-11/D-12 proof).
//
// This is the FIRST kit-shipped runnable and the concrete reference implementation of the
// uniform invocation+result contract (D-12) that every future kit-shipped routine — including
// Phase 16's cross-platform test-integrity checker (16-PRE-DECISIONS.md) — speaks. It is a
// TRIVIAL but real checker: it reads one input file and applies one deterministic rule (the
// input must NOT contain the planted bad token `FORBIDDEN`). Its only job is to prove the
// interface end-to-end so Phase 16 plugs into a demonstrated-working contract.
//
// The mechanism (D-11): authored as .ts in the central kit, compiled to a committed
// reference-check.js (same tsc build + freshness gate as everything else, D-02), then
// MATERIALIZED by install.ts into the host's committed path tools/grugops/reference-check.js.
// The host runs `node tools/grugops/reference-check.js <input>` with ONLY Node present — no
// ~/.grugops, no npm, no node_modules. That is why this file imports node: builtins ONLY
// (Pitfall 3): a single committed .js must run in bare host CI where the central kit is absent.
//
// The D-12 contract (uniform across all kit-shipped runnables):
//   node <repo-local-path>/reference-check.js <input> [--json]
//     exit 0 → pass / no findings
//     exit 1 → findings / fail (the gate blocks)
//     exit 2 → error (could not run — distinguishable from a clean "fail")
//     stdout → human-readable findings in CLEAR PROFESSIONAL VOICE (the audit trail)
//     stdout → optional machine-readable { ok, findings } block when invoked with --json
//
// VOICE DISCIPLINE (CLAUDE.md hard rule): every finding/error string this routine emits is
// CLEAR PROFESSIONAL ENGLISH — this is a quality/safety surface, never caveman voice.
import { readFileSync } from "node:fs";
// The planted bad token the deterministic rule forbids. A real checker would encode its own
// rule here; this reference routine keeps the rule trivial so the CONTRACT is what is proven.
const BAD_TOKEN = "FORBIDDEN";
// --- parse args (D-12): the first non-flag argv is the input path; --json toggles the block. ---
const wantJson = process.argv.includes("--json");
const inputPath = process.argv.slice(2).find((a) => !a.startsWith("--"));
// --- fail-closed input read (exit 2 = error, distinct from a clean fail) ---------------------
// A missing input path, or a missing/unreadable file, is an ERROR — never a silent pass. We read
// fail-closed in a try/catch and exit 2 with a clear-voice message on stderr (so a gate can tell
// "could not run" apart from "ran and found nothing"). T-15-05-DoS: malformed/missing input must
// return a clean error, never crash.
if (!inputPath) {
    process.stderr.write("Error: no input file path was provided. Usage: node reference-check.js <input-file> [--json]\n");
    process.exit(2);
}
let contents;
try {
    contents = readFileSync(inputPath, "utf8");
}
catch {
    process.stderr.write(`Error: cannot read the input file: ${inputPath}\n`);
    process.exit(2);
}
// --- apply the one deterministic rule: the input must not contain the planted bad token ------
const findings = [];
if (contents.includes(BAD_TOKEN)) {
    findings.push(`Forbidden token found: the input contains "${BAD_TOKEN}", which is not permitted in this content.`);
}
// --- emit per the D-12 result contract -------------------------------------------------------
if (findings.length > 0) {
    if (wantJson) {
        console.log(JSON.stringify({ ok: false, findings }));
    }
    else {
        for (const f of findings)
            console.log(f); // clear professional voice, one finding per line
    }
    process.exit(1); // 1 = findings / the gate blocks
}
if (wantJson) {
    console.log(JSON.stringify({ ok: true, findings: [] }));
}
else {
    console.log("No findings.");
}
process.exit(0); // 0 = pass

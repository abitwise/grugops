// check-story-docs.ts — the story-docs gate (phase 43, plan 43-03; D-22, D-23, D-11).
//
// One small gate that keeps the project's story honest in three places a reader meets it:
//
//   1. CLAUDE.md names no `/grug` command word (D-23). The command that ships is `/grugops`; a
//      Claude Code session in this repository reads CLAUDE.md as an instruction, so a stale command
//      name there is a wrong instruction. There is no exemption list: a historical mention is
//      reworded without the slash token.
//
// Each check builds a `Measured` and folds it with `reportMeasured` (scripts/vacuity.ts), so a check
// that visited nothing, or a scan set that came up short, is a failure and never a PASS line.
//
// The scan root honors CHECK_ROOT, as the other gates do, so scripts/check-story-docs.test.ts can
// run this committed `.js` against a hermetic mirror. `isEntrypoint` guards the run so the test can
// import the pure functions below without running the gate.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { reportMeasured } from "./vacuity.js";
const ROOT = process.env.CHECK_ROOT ? process.env.CHECK_ROOT : join(import.meta.dirname, "..");
let FAILS = 0;
const emit = {
    pass(m) {
        process.stdout.write(`  PASS  ${m}\n`);
    },
    fail(m) {
        process.stdout.write(`  FAIL  ${m}\n`);
        FAILS += 1;
    },
};
/** Read a root-relative file, or null when it cannot be read (the caller counts it as not visited). */
function readOrNull(rel) {
    try {
        return readFileSync(join(ROOT, ...rel.split("/")), "utf8");
    }
    catch {
        return null;
    }
}
const excerpt = (s) => {
    const t = s.trim();
    return t.length > 160 ? `${t.slice(0, 157)}...` : t;
};
const renderLine = (f) => `    ${f.file}:${f.line}: ${f.text}`;
// ---------------------------------------------------------------------------------------------
// Check 1 — the `/grug` command word (D-23).
// ---------------------------------------------------------------------------------------------
// `/grug` as a whole command word: `/grug`, `/grug:plan`, `/grug-map`, `/grug-release`. Not
// `/grugops` (the shipped name), and not a path segment such as `commands/grug.md` or
// `.claude/skills/grug/`, where a word character, `.`, `/` or `-` sits right before the slash.
export const GRUG_COMMAND_WORD = /(?<![\w./-])\/grug(?!ops)(?![A-Za-z0-9_])/;
// The one file this check reads.
export const GRUG_SCAN_SET = ["CLAUDE.md"];
/** One finding per line of `text` that carries a `/grug` command word. Lines are 1-based. */
export function grugCommandFindings(text, file = "CLAUDE.md") {
    const out = [];
    text.split("\n").forEach((line, i) => {
        if (GRUG_COMMAND_WORD.test(line))
            out.push({ file, line: i + 1, text: excerpt(line) });
    });
    return out;
}
function runGrugCheck() {
    let visited = 0;
    const findings = [];
    for (const rel of GRUG_SCAN_SET) {
        const text = readOrNull(rel);
        if (text === null)
            continue;
        visited += 1;
        findings.push(...grugCommandFindings(text, rel));
    }
    const m = {
        label: "STORY-05 /grug command word (CLAUDE.md names only the shipped /grugops commands)",
        visited,
        expected: GRUG_SCAN_SET.length,
        findings,
    };
    reportMeasured(m, emit, renderLine);
}
function runAll() {
    process.stdout.write("== Story docs (plan 43-03) ==\n");
    runGrugCheck();
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
if (isEntrypoint(import.meta.url)) {
    runAll();
}

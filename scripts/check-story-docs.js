// check-story-docs.ts — the story-docs gate (phase 43, plan 43-03; D-22, D-23, D-11).
//
// One small gate that keeps the project's story honest in three places a reader meets it:
//
//   1. CLAUDE.md names no `/grug` command word (D-23). The command that ships is `/grugops`; a
//      Claude Code session in this repository reads CLAUDE.md as an instruction, so a stale command
//      name there is a wrong instruction. There is no exemption list: a historical mention is
//      reworded without the slash token.
//   2. Any public page, and the install guide, that mentions parallel work carries the GAP-D1
//      sentence (D-22): parallel scheduling is real on hosts with a spawn tool, and the own-session
//      capture that would prove it live is still `UNKNOWN - verify`. The match is an exact byte
//      substring, so an en dash or missing backticks is a finding.
//   3. No shipped docs link is dead in an installed kit home (D-11). A shipped docs page or
//      agent-factory/README.md may link only to a file that exists and ships (under agent-factory/
//      or in shippedDocs()); a checkout-only target is linked by repository URL instead, and such a
//      URL must name a path that exists. README.md stays in the checkout, so its relative links
//      need only exist there.
//
// Each check builds a `Measured` and folds it with `reportMeasured` (scripts/vacuity.ts), so a check
// that visited nothing, or a scan set that came up short, is a failure and never a PASS line.
//
// The scan root honors CHECK_ROOT, as the other gates do, so scripts/check-story-docs.test.ts can
// run this committed `.js` against a hermetic mirror. `isEntrypoint` guards the run so the test can
// import the pure functions below without running the gate.
import { existsSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { reportMeasured } from "./vacuity.js";
// The public-docs corpus is declared once, in the vocabulary gate; this gate never types a list of
// pages. Both modules read CHECK_ROOT, so a mirror run scans the mirror's corpus.
import { publicDocsCorpus, publicDocsDerivationRefusals } from "./check-public-docs-vocabulary.js";
// The shipped docs are declared once, in the installer's source module; fences are judged by the one
// fence authority.
import { shippedDocs } from "../install/kit-source.js";
import { fencedLineFlags } from "./frontmatter.js";
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
// ---------------------------------------------------------------------------------------------
// Check 2 — the GAP-D1 sentence on pages that mention parallel work (D-22).
// ---------------------------------------------------------------------------------------------
// The exact sentence from 43-CONTEXT <specifics>, backticks included.
export const GAP_D1_SENTENCE = "parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify` (GAP-D1)";
// `parallel` as a whole word, any case. `parallelism` and `unparalleled` do not trigger.
export const PARALLEL_WORD = /\bparallel\b/i;
// The install guide is not in the public-docs corpus, and it says role agents run in parallel.
export const GAP_D1_EXTRA = ["install/README.md"];
/** One finding per page that says `parallel` and lacks the exact GAP-D1 sentence. */
export function gapD1Findings(pages) {
    const out = [];
    for (const { file, text } of pages) {
        if (!PARALLEL_WORD.test(text))
            continue;
        if (text.includes(GAP_D1_SENTENCE))
            continue;
        const line = text.split("\n").findIndex((l) => PARALLEL_WORD.test(l)) + 1;
        out.push({
            file,
            reason: `says "parallel" (first at line ${line}) without the GAP-D1 sentence: ${GAP_D1_SENTENCE}`,
        });
    }
    return out;
}
/** The pages check 2 reads: the public-docs corpus plus the install guide, each once. */
export function gapD1ScanSet() {
    return [...new Set([...publicDocsCorpus(), ...GAP_D1_EXTRA])];
}
function runGapD1Check() {
    for (const r of publicDocsDerivationRefusals()) {
        emit.fail(`STORY-05 GAP-D1: the public-docs corpus derivation refused: ${r}`);
    }
    const scan = gapD1ScanSet();
    const pages = [];
    for (const rel of scan) {
        const text = readOrNull(rel);
        if (text !== null)
            pages.push({ file: rel, text });
    }
    const m = {
        label: "STORY-05 GAP-D1 (a page that mentions parallel work states the open own-session gap)",
        visited: pages.length,
        expected: scan.length,
        findings: gapD1Findings(pages),
    };
    reportMeasured(m, emit, (f) => `    ${f.file}: ${f.reason}`);
}
// An inline link's target: `](target)`, `](<target>)`, optionally followed by a title.
const INLINE_LINK = /\]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
// A reference definition: `[label]: target`, up to three spaces of indent.
const REFERENCE_DEF = /^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/;
// An inline code span; a link written inside one is text, not a link.
const CODE_SPAN = /`[^`\n]*`/g;
// A URL scheme (`https:`, `mailto:`), as opposed to a relative path.
const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;
/** The link targets on one line of prose, in order. */
export function lineLinkTargets(line) {
    const out = [];
    const def = REFERENCE_DEF.exec(line);
    if (def !== null)
        out.push(def[1]);
    const prose = line.replace(CODE_SPAN, "");
    for (const m of prose.matchAll(INLINE_LINK))
        out.push(m[1]);
    return out;
}
function decode(s) {
    try {
        return decodeURIComponent(s);
    }
    catch {
        return s;
    }
}
/** The dead or non-shipping links in one page, under `rule`. Fenced lines are skipped. */
export function linkFindings(file, text, rule, ctx) {
    const out = [];
    const lines = text.split("\n");
    const fenced = fencedLineFlags(text);
    const repoPrefixes = [`${ctx.repository}/blob/main/`, `${ctx.repository}/tree/main/`];
    lines.forEach((line, i) => {
        if (fenced[i] === true)
            return;
        for (const target of lineLinkTargets(line)) {
            const add = (reason) => {
                out.push({ file, line: i + 1, target, reason });
            };
            if (target.startsWith("#"))
                continue;
            if (SCHEME.test(target)) {
                const prefix = repoPrefixes.find((p) => target.startsWith(p));
                if (prefix === undefined)
                    continue; // another host, mailto:, or a repository URL off main
                const path = decode(target.slice(prefix.length).split(/[?#]/)[0]).replace(/\/+$/, "");
                if (path === "" || !ctx.exists(path))
                    add(`repository URL names a path that does not exist: ${path}`);
                continue;
            }
            const bare = decode(target.split("#")[0]);
            if (bare === "")
                continue;
            const resolved = bare.startsWith("/")
                ? posix.normalize(bare.slice(1))
                : posix.normalize(posix.join(posix.dirname(file), bare));
            const rel = resolved.replace(/\/+$/, "");
            if (rel === ".." || rel.startsWith("../")) {
                add("points outside the repository");
                continue;
            }
            if (!ctx.exists(rel)) {
                add(`target does not exist: ${rel}`);
                continue;
            }
            if (rule === "ship" && !(rel === "agent-factory" || rel.startsWith("agent-factory/") || ctx.shipped.has(rel))) {
                add(`target does not ship in a kit home (${rel}); link it by repository URL`);
            }
        }
    });
    return out;
}
// The kit README ships with agent-factory/ but is not a shippedDocs() member; README.md stays in
// the checkout.
export const LINK_SHIP_EXTRA = ["agent-factory/README.md"];
export const LINK_CHECKOUT_PAGES = ["README.md"];
/** The `repository` value from .claude-plugin/plugin.json, or null when it cannot be read. */
function pluginRepository() {
    const text = readOrNull(".claude-plugin/plugin.json");
    if (text === null)
        return null;
    try {
        const repo = JSON.parse(text).repository;
        return typeof repo === "string" && repo.length > 0 ? repo.replace(/\/+$/, "") : null;
    }
    catch {
        return null;
    }
}
function runLinkCheck() {
    const label = "STORY-05 shipped links (a shipped docs link resolves in an installed kit home)";
    const shippedList = shippedDocs(ROOT);
    if (shippedList === null)
        emit.fail(`${label}: shippedDocs() refused (an unreadable docs root or the walk bound)`);
    const repository = pluginRepository();
    if (repository === null)
        emit.fail(`${label}: no \`repository\` string in .claude-plugin/plugin.json`);
    const shipped = new Set(shippedList ?? []);
    const ctx = {
        exists: (rel) => existsSync(join(ROOT, ...rel.split("/"))),
        shipped,
        repository: repository ?? "",
    };
    const pages = [
        ...[...new Set([...(shippedList ?? []), ...LINK_SHIP_EXTRA])].map((file) => ({ file, rule: "ship" })),
        ...LINK_CHECKOUT_PAGES.map((file) => ({ file, rule: "checkout" })),
    ];
    let visited = 0;
    const findings = [];
    for (const { file, rule } of pages) {
        const text = readOrNull(file);
        if (text === null)
            continue;
        visited += 1;
        findings.push(...linkFindings(file, text, rule, ctx));
    }
    const m = { label, visited, expected: pages.length, findings };
    reportMeasured(m, emit, (f) => `    ${f.file}:${f.line}: (${f.target}) ${f.reason}`);
}
function runAll() {
    process.stdout.write("== Story docs (plan 43-03) ==\n");
    runGrugCheck();
    runGapD1Check();
    runLinkCheck();
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

// check-flip-manifest.ts — the GAP-D1 flip gate (Phase 33, plan 33-07; D-17, D-18, D-19).
//
//   node scripts/check-flip-manifest.js [--range <commit|A..B>] [--manifest <repo-relative path>]
//     exit 0 — the manifest parsed; every live-surface part derived non-empty and matched its listed
//              members and declared count; the deduplicated total matched the pin; every declared
//              locator resolved in the state the manifest declares; and, in the discharged state
//              only, the flip commit changed exactly the declared set, no residual token survived in
//              the live-surface set, and every parity cell cited a section the capture summary has.
//     exit 1 — any of those refused, OR the gate could not derive one of its inputs (an unreadable
//              manifest, a failed git invocation, a part that derived nothing, a table the manifest
//              does not carry). In that second case NO verdict is reported over the flip: a gate
//              that dies is not a gate that passed, and the refusal says which input it lacked.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs, node:path, node:child_process for `git`. Zero npm
// dependencies. Clear professional voice throughout (CLAUDE.md hard rule — this is a trace surface).
//
// ---------------------------------------------------------------------------------------------
// TWO SIDES, NEITHER HAND-MAINTAINED AGAINST THE OTHER.
//
// D-17 asks for one commit that touches exactly one declared set, and a check that no `pending
// human` cell or GAP-D1 deferral sentence survives outside it. The obvious design — a list of
// protected files in this gate's source, compared against a list of flipped files in the manifest —
// is two hand-typed sets that rot together while every assertion over them stays green, which is
// this repository's recorded systemic failure class. So the DECLARED side is parsed from the
// manifest (`.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md`: its flip
// and correction tables, its settings, its listed members) and the ACTUAL side is derived from git
// (`diff-tree` over the flip commit) and from the working tree (`ls-files`, the public-docs corpus
// another module already derives). No file list is written into this gate.
//
// THE LIVE-SURFACE SET HAS A BOUNDED DENOMINATOR. Repo-wide, 46 files carry the cell phrase and 47
// carry the deferral token, most of them truthful history. The residual rule therefore runs over an
// ALLOW-LIST OF NAMED PARTS — the same shape `scripts/check-banned-claims.ts` gives its scan set —
// each derived here by a rule, each floored for vacuity, the total pinned in the manifest, and the
// exclusion rule written into the manifest rather than only into this comment. The manifest also
// LISTS each part's members, so the listing and the derivation are compared rather than trusted.
//
// THE PRE-CAPTURE STATE IS A DECLARED PHASE, NOT A BYPASS. Before the flip, every declared surface
// legitimately still carries its cell; the residual rule and the commit-set rule are in force only
// once the manifest's status field reads the discharged value. In the pre-capture state the gate
// still refuses when a derivation fails or when a declared anchor does not resolve against the
// tree — so the manifest is checked against the tree it describes before any flip exists.
// ---------------------------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { publicDocsCorpus, publicDocsDerivationRefusals, } from "./check-public-docs-vocabulary.js";
// The fence PROJECTION, asked of the one authority. This module declares no fence state of its own:
// the manifest's tables are read outside fences by the authority's projection.
import { fencedLineFlags } from "./frontmatter.js";
import { isEntrypoint } from "./is-entry.js";
// CHECK_ROOT override is load-bearing: the Vitest harness builds a planted repository under the OS
// temp dir and points CHECK_ROOT at it, then spawns this committed .js against it. When unset,
// resolve against the script-relative repo root (cwd does not matter). Truthiness, not `??`, so an
// empty CHECK_ROOT degrades to the repo root as it does at every sibling gate.
const ROOT = process.env.CHECK_ROOT ? process.env.CHECK_ROOT : join(import.meta.dirname, "..");
const abs = (rel) => join(ROOT, rel);
export const FLIP_MANIFEST_DEFAULT = ".planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md";
export const MANIFEST_STATUS_VALUES = ["pre-capture", "discharged"];
/** The names of the parts this gate knows how to derive. The manifest must declare exactly these. */
export const LIVE_SURFACE_PART_NAMES = [
    "publicDocs",
    "docsTree",
    "planningLedgers",
    "archivedRecords",
    "runtimeEvidence",
];
export const FLIP_KINDS = ["status", "anchor", "marker", "parity-row", "ledger-row"];
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
};
const note = (m) => {
    process.stdout.write(`[derivation] ${m}\n`);
};
/** Exported accessor so a later aggregator can fold this gate's verdict without a shared global. */
export const flipManifestFails = () => FAILS;
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Reading files and running git — buffer-encoded, then decoded, never a shell on the data path.
// ─────────────────────────────────────────────────────────────────────────────────────────────
function readText(rel) {
    try {
        return readFileSync(abs(rel)).toString("utf8");
    }
    catch (e) {
        throw new Error(`cannot read ${rel} at ${abs(rel)} — ${e.message}. The gate cannot derive the ` +
            `input that file carries, so NO verdict is reported.`);
    }
}
function git(args) {
    try {
        return execFileSync("git", [...args], {
            cwd: ROOT,
            encoding: "buffer",
            maxBuffer: 64 * 1024 * 1024,
        }).toString("utf8");
    }
    catch (e) {
        throw new Error(`\`git ${args.join(" ")}\` failed at ${ROOT} — ${e.message}. The actual side ` +
            `cannot be derived, so NO verdict is reported over it. Confirm this is being run inside a ` +
            `git working tree whose history reaches the flip commit.`);
    }
}
/** Tracked paths under `pathspec`, NUL-delimited so a control byte in a name cannot split a path. */
function gitLsFiles(pathspec) {
    return git(["ls-files", "-z", "--", ...pathspec])
        .split("\0")
        .filter((p) => p !== "");
}
/** Non-overlapping occurrences of `needle` in `hay`. */
function countOccurrences(hay, needle) {
    if (needle === "")
        return 0;
    let n = 0;
    let at = hay.indexOf(needle);
    while (at !== -1) {
        n += 1;
        at = hay.indexOf(needle, at + needle.length);
    }
    return n;
}
/** Strip one code-span wrapper: `` `x` `` or `` `` x `` `` (the latter for values that carry a backtick). */
export function unwrapCell(cell) {
    const t = cell.trim();
    if (t.startsWith("`` ") && t.endsWith(" ``") && t.length >= 6)
        return t.slice(3, -3);
    if (t.length >= 2 && t.startsWith("`") && t.endsWith("`"))
        return t.slice(1, -1);
    return t;
}
/** Split one table line into its cells: unescaped pipes delimit, `\|` is a literal pipe. */
export function splitTableRow(line) {
    const cells = [];
    let cur = "";
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === "\\" && line[i + 1] === "|") {
            cur += "|";
            i += 1;
            continue;
        }
        if (ch === "|") {
            cells.push(cur);
            cur = "";
            continue;
        }
        cur += ch;
    }
    cells.push(cur);
    // A row is written `| a | b |`, so the first and last segments are the empty margins.
    if (cells.length > 0 && cells[0].trim() === "")
        cells.shift();
    if (cells.length > 0 && cells[cells.length - 1].trim() === "")
        cells.pop();
    return cells.map((c) => c.trim());
}
const SEPARATOR_ROW = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
/** Every markdown table in `text` outside fenced blocks, in document order. */
export function parseTables(text) {
    const lines = text.split("\n");
    const fenced = fencedLineFlags(text);
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (fenced[i] || !line.startsWith("|")) {
            i += 1;
            continue;
        }
        const header = splitTableRow(line);
        const sep = lines[i + 1];
        if (sep === undefined || fenced[i + 1] || !SEPARATOR_ROW.test(sep)) {
            i += 1;
            continue;
        }
        const rows = [];
        let j = i + 2;
        while (j < lines.length && !fenced[j] && lines[j].startsWith("|")) {
            rows.push(splitTableRow(lines[j]));
            j += 1;
        }
        out.push({ header, rows, at: i });
        i = j;
    }
    return out;
}
const STATUS_LABEL = "**Manifest status:**";
function statusLineFor(status) {
    return `${STATUS_LABEL} \`${status}\``;
}
function findTable(tables, name, matches) {
    const hits = tables.filter((t) => matches(t.header));
    if (hits.length !== 1) {
        throw new Error(`the manifest carries ${hits.length} "${name}" table(s) (identified by header row), expected ` +
            `exactly 1 — the declared side cannot be parsed, so NO verdict is reported`);
    }
    return hits[0];
}
function requireCells(table, name, width) {
    for (const row of table.rows) {
        if (row.length !== width) {
            throw new Error(`a "${name}" row has ${row.length} cell(s), expected ${width}: ${JSON.stringify(row)} — ` +
                `the declared side cannot be parsed, so NO verdict is reported`);
        }
    }
    return table.rows;
}
/** Parse the manifest text. Throws (no verdict) on any shape it cannot read. */
export function parseManifest(text) {
    const lines = text.split("\n");
    const fenced = fencedLineFlags(text);
    const statusLines = lines.filter((l, i) => !fenced[i] && l.startsWith(STATUS_LABEL));
    if (statusLines.length !== 1) {
        throw new Error(`the manifest carries ${statusLines.length} status line(s) beginning \`${STATUS_LABEL}\`, ` +
            `expected exactly 1 — the state the gate should run in cannot be derived, so NO verdict is reported`);
    }
    const statusLine = statusLines[0].trimEnd();
    const status = MANIFEST_STATUS_VALUES.find((s) => statusLineFor(s) === statusLine);
    if (status === undefined) {
        throw new Error(`the manifest status line reads ${JSON.stringify(statusLine)}; the only declared values are ` +
            `${MANIFEST_STATUS_VALUES.map((s) => `\`${s}\``).join(" and ")} — NO verdict is reported over an undeclared state`);
    }
    const tables = parseTables(text);
    const settingsT = findTable(tables, "settings", (h) => h[0] === "Setting" && h[1] === "Value");
    const partsT = findTable(tables, "parts", (h) => h[0] === "Part" && h[1] === "Derivation rule");
    const membersT = findTable(tables, "members", (h) => h[0] === "Part" && h[1] === "Member");
    const exclT = findTable(tables, "ledger exclusions", (h) => h[0] === "Excluded ledger");
    const markersT = findTable(tables, "deferral markers", (h) => h[0] === "Deferral marker");
    const exemptT = findTable(tables, "exemptions", (h) => h[0] === "Exempt file");
    const flipT = findTable(tables, "flip class", (h) => h[0] === "#" && h[2] === "Kind");
    const corrT = findTable(tables, "correction class", (h) => h[0] === "#" && h[3] === "Stale fragment");
    const settings = new Map();
    for (const [k, v] of requireCells(settingsT, "settings", 2))
        settings.set(k, unwrapCell(v));
    const parts = [];
    for (const [name, rule, count] of requireCells(partsT, "parts", 3)) {
        const n = unwrapCell(name);
        if (!LIVE_SURFACE_PART_NAMES.includes(n)) {
            throw new Error(`the manifest declares a part "${n}" this gate has no derivation rule for; the known parts ` +
                `are ${LIVE_SURFACE_PART_NAMES.join(", ")} — NO verdict is reported over a part that cannot be derived`);
        }
        const declaredCount = Number(unwrapCell(count));
        if (!Number.isInteger(declaredCount) || declaredCount < 0) {
            throw new Error(`the declared count for part "${n}" is not a non-negative integer: ${JSON.stringify(count)}`);
        }
        parts.push({ name: n, rule, declaredCount });
    }
    for (const known of LIVE_SURFACE_PART_NAMES) {
        if (!parts.some((p) => p.name === known)) {
            throw new Error(`the manifest does not declare the part "${known}" this gate derives; every derived part must be ` +
                `declared with its count so the two sides can be compared — NO verdict is reported`);
        }
    }
    const listed = new Map();
    for (const p of parts)
        listed.set(p.name, []);
    for (const [part, member] of requireCells(membersT, "members", 2)) {
        const n = unwrapCell(part);
        const acc = listed.get(n);
        if (acc === undefined) {
            throw new Error(`the members table lists "${unwrapCell(member)}" under an undeclared part "${n}"`);
        }
        acc.push(unwrapCell(member));
    }
    const exclusions = requireCells(exclT, "ledger exclusions", 2).map(([file, reason]) => ({
        file: unwrapCell(file),
        reason,
    }));
    const markers = requireCells(markersT, "deferral markers", 2).map(([m]) => unwrapCell(m));
    const exemptions = requireCells(exemptT, "exemptions", 3).map(([file, anchor, reason]) => ({
        file: unwrapCell(file),
        anchor: unwrapCell(anchor),
        reason,
    }));
    const flip = [];
    for (const [id, file, kind, locator, current, shape] of requireCells(flipT, "flip class", 6)) {
        const k = unwrapCell(kind);
        if (!FLIP_KINDS.includes(k)) {
            throw new Error(`flip row ${id} has kind "${k}"; the declared kinds are ${FLIP_KINDS.join(", ")}`);
        }
        flip.push({ id, file: unwrapCell(file), kind: k, locator: unwrapCell(locator), current, shape });
    }
    const corrections = requireCells(corrT, "correction class", 6).map(([id, file, line, fragment, measured, corrected]) => ({
        id,
        file: unwrapCell(file),
        line,
        fragment: unwrapCell(fragment),
        measured,
        corrected,
    }));
    for (const key of [
        "capture summary",
        "parity table file",
        "parity table header cell",
        "parity data rows",
        "pinned live-surface total",
        "residual token",
    ]) {
        if (!settings.has(key)) {
            throw new Error(`the settings table carries no "${key}" row — NO verdict is reported over an undeclared setting`);
        }
    }
    return { status, statusLine, settings, parts, listed, exclusions, markers, exemptions, flip, corrections };
}
/** The declared set: every file the flip and correction classes name, once each, in first-seen order. */
export function declaredSet(m) {
    const seen = new Set();
    const out = [];
    for (const f of [...m.flip.map((r) => r.file), ...m.corrections.map((r) => r.file)]) {
        if (!seen.has(f)) {
            seen.add(f);
            out.push(f);
        }
    }
    return out;
}
const TOP_LEVEL_PLANNING_MD = /^\.planning\/[^/]+\.md$/;
/** Derive every part by its rule. Pure over `git ls-files`, the public-docs corpus and the manifest. */
export function deriveParts(m) {
    const refusals = [...publicDocsDerivationRefusals()];
    const publicDocs = publicDocsCorpus().slice().sort();
    const docsTree = gitLsFiles(["docs"])
        .filter((p) => p.endsWith(".md") && !p.startsWith("docs/audit/"))
        .sort();
    const topLevel = gitLsFiles([".planning"]).filter((p) => TOP_LEVEL_PLANNING_MD.test(p));
    for (const ex of m.exclusions) {
        if (!topLevel.includes(ex.file)) {
            refusals.push(`the manifest excludes "${ex.file}" from planningLedgers, but that path is not a tracked ` +
                `top-level .planning markdown file — a stale exclusion is a derivation defect, not a pass`);
        }
    }
    const excluded = new Set(m.exclusions.map((e) => e.file));
    const planningLedgers = topLevel.filter((p) => !excluded.has(p)).sort();
    const archivedRecords = declaredSet(m)
        .filter((p) => p.startsWith(".planning/milestones/"))
        .sort();
    const runtimeEvidence = gitLsFiles([])
        .filter((p) => p.endsWith("-RUNTIME-EVIDENCE.md"))
        .sort();
    const parts = [
        { name: "publicDocs", members: publicDocs },
        { name: "docsTree", members: docsTree },
        { name: "planningLedgers", members: planningLedgers },
        { name: "archivedRecords", members: archivedRecords },
        { name: "runtimeEvidence", members: runtimeEvidence },
    ];
    const seen = new Set();
    const union = [];
    let overlap = 0;
    for (const p of parts) {
        for (const f of p.members) {
            if (seen.has(f)) {
                overlap += 1;
                continue;
            }
            seen.add(f);
            union.push(f);
        }
    }
    return { parts, union, overlap, refusals };
}
function sameSet(a, b) {
    const sa = [...new Set(a)].sort();
    const sb = [...new Set(b)].sort();
    return sa.length === sb.length && sa.every((x, i) => x === sb[i]);
}
function setDifference(a, b) {
    const sb = new Set(b);
    return [...new Set(a)].filter((x) => !sb.has(x)).sort();
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The parity table and the ledger appendix — located by header cell and by fence, never by heading.
// ─────────────────────────────────────────────────────────────────────────────────────────────
const PARITY_ROW_LOCATOR = /^row (\d+) "(.+)"$/;
const LEDGER_ROW_LOCATOR = /^id (\d+)$/;
function parityTable(m) {
    const file = m.settings.get("parity table file");
    const headerCell = m.settings.get("parity table header cell");
    const hits = parseTables(readText(file)).filter((t) => t.header[0] === headerCell);
    if (hits.length !== 1) {
        throw new Error(`${file} carries ${hits.length} table(s) whose first header cell is "${headerCell}", expected ` +
            `exactly 1 — the parity table cannot be located, so NO verdict is reported over its cells`);
    }
    return hits[0];
}
/** The `.planning/WINDOWS.md` JSON appendix — the representation the ledger tool writes last. */
function ledgerEntries(file) {
    const lines = readText(file).split("\n");
    const open = lines.findIndex((l) => l.trimEnd() === "````json");
    const close = open === -1 ? -1 : lines.findIndex((l, i) => i > open && l.trimEnd() === "````");
    if (open === -1 || close === -1) {
        throw new Error(`${file} carries no \`\`\`\`json appendix between four-backtick fence lines — the ledger's ` +
            `machine representation cannot be read, so NO verdict is reported over its rows`);
    }
    let parsed;
    try {
        parsed = JSON.parse(lines.slice(open + 1, close).join("\n"));
    }
    catch (e) {
        throw new Error(`${file}'s JSON appendix does not parse: ${e.message} — NO verdict is reported over its rows`);
    }
    if (!Array.isArray(parsed)) {
        throw new Error(`${file}'s JSON appendix is not an array — NO verdict is reported over its rows`);
    }
    return parsed.map((e) => {
        const o = e;
        return { id: Number(o.id), status: String(o.status) };
    });
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The flip commit and its changed-file set.
// ─────────────────────────────────────────────────────────────────────────────────────────────
function statusAt(commit, manifestRel) {
    let text;
    try {
        text = execFileSync("git", ["show", `${commit}:${manifestRel}`], {
            cwd: ROOT,
            encoding: "buffer",
            maxBuffer: 64 * 1024 * 1024,
        }).toString("utf8");
    }
    catch {
        return null;
    }
    try {
        return parseManifest(text).status;
    }
    catch {
        return null;
    }
}
/**
 * The commit that introduced the discharged status line into the manifest: derived from git, never
 * recorded in the manifest (a hash written into the file it names cannot be known before the commit).
 */
export function deriveFlipCommit(m, manifestRel) {
    const discharged = statusLineFor("discharged");
    const candidates = git(["log", "--format=%H", `-S${discharged}`, "--", manifestRel])
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s !== "");
    for (const c of candidates) {
        if (statusAt(c, manifestRel) !== "discharged")
            continue;
        const parent = git(["rev-list", "--parents", "-n", "1", c]).trim().split(/\s+/).slice(1);
        const parentDischarged = parent.some((p) => statusAt(p, manifestRel) === "discharged");
        if (!parentDischarged)
            return c;
    }
    throw new Error(`the manifest reads ${JSON.stringify(m.statusLine)} but no commit in the history of ${manifestRel} ` +
        `introduced that line — the flip commit cannot be derived, so NO verdict is reported over the commit set`);
}
/** The files a commit (or a range) changed, from git, NUL-delimited. */
export function changedFiles(range) {
    const args = range.includes("..")
        ? ["diff", "--name-only", "-z", range]
        : ["diff-tree", "--no-commit-id", "--name-only", "-r", "--root", "-z", range];
    return git(args)
        .split("\0")
        .filter((p) => p !== "")
        .sort();
}
function parseArgs(argv) {
    const cli = { manifest: FLIP_MANIFEST_DEFAULT, range: null };
    for (let i = 0; i < argv.length; i += 1) {
        const a = argv[i];
        if (a === "--range" && argv[i + 1] !== undefined) {
            cli.range = argv[i + 1];
            i += 1;
        }
        else if (a === "--manifest" && argv[i + 1] !== undefined) {
            cli.manifest = argv[i + 1];
            i += 1;
        }
        else {
            throw new Error(`unrecognised argument ${JSON.stringify(a)}; usage: check-flip-manifest.js [--range <commit|A..B>] [--manifest <path>]`);
        }
    }
    return cli;
}
function checkParts(m) {
    const d = deriveParts(m);
    for (const r of d.refusals)
        fail(`live-surface derivation refused: ${r}`);
    const breakdown = d.parts.map((p) => `${p.name} ${p.members.length}`).join(", ");
    const pinned = Number(m.settings.get("pinned live-surface total"));
    note(`live-surface parts: ${breakdown}; overlap ${d.overlap}; derived total ${d.union.length}, pinned ${pinned}`);
    for (const p of d.parts)
        note(`  ${p.name}: ${p.members.join(", ")}`);
    let refused = false;
    for (const p of d.parts) {
        if (p.members.length === 0) {
            refused = true;
            fail(`the "${p.name}" part of the live-surface set derived ZERO members — refusing to report a ` +
                `verdict over a part that contributes nothing (${breakdown}). This floor is per-part on ` +
                `purpose: any one part could empty out while the total still cleared a floor written over ` +
                `the concatenation`);
        }
        const declared = m.parts.find((q) => q.name === p.name);
        if (declared.declaredCount !== p.members.length) {
            refused = true;
            fail(`the "${p.name}" part derived ${p.members.length} member(s) but the manifest declares ` +
                `${declared.declaredCount} (${breakdown}) — walk the part's derivation and the manifest's ` +
                `listing before touching either number`);
        }
        const listed = m.listed.get(p.name) ?? [];
        if (!sameSet(listed, p.members)) {
            refused = true;
            const missing = setDifference(p.members, listed);
            const extra = setDifference(listed, p.members);
            fail(`the "${p.name}" part's derived members differ from the manifest's listing — derived but not ` +
                `listed: [${missing.join(", ")}]; listed but not derived: [${extra.join(", ")}]. The listing ` +
                `is checked against the derivation so that neither is trusted on its own`);
        }
    }
    if (!Number.isInteger(pinned) || d.union.length !== pinned) {
        refused = true;
        fail(`the live-surface set derived ${d.union.length} document(s), expected exactly ${pinned} ` +
            `(${breakdown}, overlap ${d.overlap}) — walk every part's derivation and record what moved ` +
            `BEFORE updating the pinned total in the manifest: moving the pin is how you acknowledge that ` +
            `the set changed, not how you make the failure go away`);
    }
    if (!refused && d.refusals.length === 0) {
        pass(`live-surface set: ${d.union.length} document(s) over ${d.parts.length} floored parts, pinned at ${pinned}`);
    }
    return d.union;
}
function checkLocators(m, manifestRel) {
    const discharged = m.status === "discharged";
    let refusals = 0;
    const texts = new Map();
    const textOf = (rel) => {
        const cached = texts.get(rel);
        if (cached !== undefined)
            return cached;
        const t = readText(rel);
        texts.set(rel, t);
        return t;
    };
    const parityRows = m.flip.filter((r) => r.kind === "parity-row");
    const declaredDataRows = Number(m.settings.get("parity data rows"));
    let parity = null;
    if (parityRows.length > 0) {
        parity = parityTable(m);
        if (parity.rows.length !== declaredDataRows || parityRows.length !== declaredDataRows) {
            refusals += 1;
            fail(`the parity table in ${m.settings.get("parity table file")} has ${parity.rows.length} data ` +
                `row(s); the manifest declares ${declaredDataRows} and enumerates ${parityRows.length} ` +
                `parity-row locators — the three must agree before any cell is judged`);
        }
    }
    let ledger = null;
    for (const row of m.flip) {
        switch (row.kind) {
            case "status": {
                if (row.file !== manifestRel) {
                    refusals += 1;
                    fail(`flip row ${row.id} declares the status field in ${row.file}, but the manifest being read is ${manifestRel}`);
                }
                break;
            }
            case "anchor": {
                const n = countOccurrences(textOf(row.file), row.locator);
                if (!discharged && n === 0) {
                    refusals += 1;
                    fail(`flip row ${row.id}: the pre-flip anchor ${JSON.stringify(row.locator)} does not occur in ` +
                        `${row.file} — the manifest does not describe the tree it is read against`);
                }
                if (discharged && n > 0) {
                    refusals += 1;
                    fail(`flip row ${row.id}: the pre-flip anchor ${JSON.stringify(row.locator)} still occurs ` +
                        `${n} time(s) in ${row.file} — the cell was not flipped`);
                }
                break;
            }
            case "marker": {
                const n = countOccurrences(textOf(row.file), row.locator);
                if (!discharged && n > 0) {
                    refusals += 1;
                    fail(`flip row ${row.id}: the post-flip marker ${JSON.stringify(row.locator)} already occurs ` +
                        `${n} time(s) in ${row.file} before any capture exists`);
                }
                if (discharged && n === 0) {
                    refusals += 1;
                    fail(`flip row ${row.id}: the post-flip marker ${JSON.stringify(row.locator)} does not occur ` +
                        `in ${row.file} — the record was not written`);
                }
                break;
            }
            case "parity-row": {
                const mm = PARITY_ROW_LOCATOR.exec(row.locator);
                if (mm === null || parity === null) {
                    refusals += 1;
                    fail(`flip row ${row.id}: locator ${JSON.stringify(row.locator)} is not of the form row N "label"`);
                    break;
                }
                const idx = Number(mm[1]) - 1;
                const label = mm[2];
                const cells = parity.rows[idx];
                if (cells === undefined) {
                    refusals += 1;
                    fail(`flip row ${row.id}: the parity table has no data row ${idx + 1}`);
                    break;
                }
                if (!discharged && unwrapCell(cells[0]) !== label) {
                    refusals += 1;
                    fail(`flip row ${row.id}: parity data row ${idx + 1} is labelled ${JSON.stringify(cells[0])}, the ` +
                        `manifest says ${JSON.stringify(label)} — the manifest does not describe the tree it is read against`);
                }
                break;
            }
            case "ledger-row": {
                const mm = LEDGER_ROW_LOCATOR.exec(row.locator);
                if (mm === null) {
                    refusals += 1;
                    fail(`flip row ${row.id}: locator ${JSON.stringify(row.locator)} is not of the form id N`);
                    break;
                }
                if (ledger === null)
                    ledger = ledgerEntries(row.file);
                const id = Number(mm[1]);
                const entry = ledger.find((e) => e.id === id);
                if (entry === undefined) {
                    refusals += 1;
                    fail(`flip row ${row.id}: ${row.file}'s JSON appendix carries no row with id ${id}`);
                    break;
                }
                if (!discharged && entry.status !== "open") {
                    refusals += 1;
                    fail(`flip row ${row.id}: ledger row ${id} is "${entry.status}" before the flip; the manifest declares it open`);
                }
                if (discharged && entry.status === "open") {
                    refusals += 1;
                    fail(`flip row ${row.id}: ledger row ${id} is still "open" after the flip — the row was not closed through the tool`);
                }
                break;
            }
        }
    }
    for (const c of m.corrections) {
        const n = countOccurrences(textOf(c.file), c.fragment);
        if (!discharged && n === 0) {
            refusals += 1;
            fail(`correction row ${c.id}: the stale fragment ${JSON.stringify(c.fragment)} does not occur in ` +
                `${c.file}:${c.line} — the manifest does not describe the tree it is read against`);
        }
        if (discharged && n > 0) {
            refusals += 1;
            fail(`correction row ${c.id}: the stale fragment ${JSON.stringify(c.fragment)} still occurs ${n} time(s) in ${c.file} — not corrected`);
        }
    }
    for (const e of m.exemptions) {
        if (countOccurrences(textOf(e.file), e.anchor) === 0) {
            refusals += 1;
            fail(`the residual-rule exemption anchored at ${JSON.stringify(e.anchor)} does not occur in ` +
                `${e.file} — a stale exemption is a derivation defect, not a pass`);
        }
    }
    if (refusals === 0) {
        pass(`every declared locator resolves in the ${m.status} state: ${m.flip.length} flip row(s), ` +
            `${m.corrections.length} correction row(s), ${m.exemptions.length} exemption anchor(s)`);
    }
}
function checkCommitSet(m, manifestRel, range) {
    const declared = declaredSet(m).sort();
    note(`declared set (${declared.length}): ${declared.join(", ")}`);
    const inForce = m.status === "discharged" || range !== null;
    let target;
    if (range !== null) {
        target = range;
    }
    else if (m.status === "discharged") {
        target = deriveFlipCommit(m, manifestRel);
        note(`flip commit derived from git: ${target} (the commit that introduced the discharged status line)`);
    }
    else {
        target = "HEAD";
    }
    const actual = changedFiles(target);
    note(`changed set of ${target} (${actual.length}): ${actual.join(", ")}${inForce ? "" : " — informational; the commit-set rule is not in force in the pre-capture state"}`);
    if (!inForce)
        return;
    const undeclared = setDifference(actual, declared);
    const omitted = setDifference(declared, actual);
    if (undeclared.length > 0) {
        fail(`the flip commit ${target} changed ${undeclared.length} file(s) the manifest does not declare: ${undeclared.join(", ")}`);
    }
    if (omitted.length > 0) {
        fail(`the flip commit ${target} omitted ${omitted.length} declared file(s): ${omitted.join(", ")}`);
    }
    if (undeclared.length === 0 && omitted.length === 0) {
        pass(`the flip commit ${target} changed exactly the declared set (${declared.length} files)`);
    }
}
function main() {
    const cli = parseArgs(process.argv.slice(2));
    const manifestRel = cli.manifest;
    if (!existsSync(abs(manifestRel))) {
        throw new Error(`the flip manifest does not exist at ${abs(manifestRel)} — the declared side cannot be derived, ` +
            `so NO verdict is reported`);
    }
    const m = parseManifest(readText(manifestRel));
    note(`manifest ${manifestRel} status: ${m.status}${m.status === "discharged" ? " (residual rule and commit-set rule in force)" : " (residual rule and commit-set rule not in force)"}`);
    checkParts(m);
    checkLocators(m, manifestRel);
    checkCommitSet(m, manifestRel, cli.range);
    verdict();
}
function verdict() {
    process.stdout.write("\n== Result ==\n");
    if (FAILS === 0) {
        process.stdout.write("ALL CHECKS PASSED\n");
        process.exit(0);
    }
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
}
function runAll() {
    try {
        main();
    }
    catch (e) {
        // A gate that dies is not a gate that failed. Anything the derivations throw — a git invocation
        // that could not run, an unreadable manifest, a table it does not carry — is REPORTED here and the
        // exit code is the verdict, never a stack trace on stderr with a zero status.
        fail(`${e.message}\n        No verdict is reported over the flip, because an input could not be derived`);
        verdict();
    }
}
// Entry check: true only when this module was launched directly (not imported), through the one
// realpath-resolving authority — a hand-built file URL does not match on every host, which would make
// a direct run execute ZERO checks and exit 0. The guard is also what lets the test file IMPORT this
// module's parsers without the import running the gate inside the vitest worker.
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) {
    runAll();
}

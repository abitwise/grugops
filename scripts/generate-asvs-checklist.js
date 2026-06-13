// generate-asvs-checklist.ts — grugops security/NFR checklist generator (SEC-02).
//
// TypeScript port of generate-asvs-checklist.mjs (Phase 15, TOOL-01). This is a TRANSLATION,
// not a redesign: byte-reproducibility IS the contract. The emitted checklist MUST be
// byte-identical to the .mjs output (the D-02 freshness gate AND the security-checklist
// provenance both break on a single-byte drift). Only TypeScript types were added; the source
// pin, the fail-closed load chain, and the deterministic lines.join("\n") + writeFileSync emit
// are byte-for-behavior identical. import.meta.dirname replaces dirname(fileURLToPath(...)).
// NOTE: the provenance header still names `scripts/generate-asvs-checklist.mjs` as the
// re-run command — that line is preserved verbatim so the committed checklist stays byte-
// identical to the .mjs output (Plan 06 retires the .mjs and repoints the header).
//
// Emits agent-factory/checklists/security-nfr-checklist.md from the vendored OWASP ASVS
// 5.0.0 flat.json. Group the 345 requirements by chapter (V1..V17), then write one row per
// requirement carrying its req_id, its L1/L2/L3 level tag, and its req_description copied
// VERBATIM from the source — never invented, never paraphrased (no-fabrication on a security
// surface). A provenance header (D-02) records the exact pin so "not hand-transcribed" is
// provable: the vendored source + this generator both live in-tree, and re-running this script
// reproduces a byte-identical checklist.
//
// Source pin (the integrity anchor — T-14-01): OWASP/ASVS
//   TAG v5.0.0_release · COMMIT 5cf9b032440be53ce345ab3c130fda46ba1ce7a2 · published 2025-05-30
//   artifact 5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.flat.json
//
// Node stdlib ONLY — node:fs + node:path. ZERO npm dependencies. Invocation takes no arguments:
//
//   node scripts/generate-asvs-checklist.js    # exit 0 on success, 1 on any failure
//
// Read/write-only by construction (T-14-02, mirrors validate-agent-factory.ts): SRC and OUT
// are FIXED literal paths joined to the repo root (the script dir's parent). Neither is ever
// derived from argv, env, or file content — no path traversal, no arbitrary write.
//
// Fail closed (T-14-03): JSON.parse is wrapped in try/catch; a parse failure, a null/non-object
// result, a missing requirements array, or a row count != 345 prints a finding to stderr and
// process.exit(1) WITHOUT writing — a partial or garbled checklist never ships. The
// reproducibility cmp check (V-2) catches silent drift on top of this.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// ── Fixed literal paths (read/write-only by construction — never argv/env/content-derived) ───
const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "scripts/asvs/asvs-5.0.0.flat.json");
const OUT = join(ROOT, "agent-factory/checklists/security-nfr-checklist.md");
// ── Source pin (recorded in the provenance header; the SHA is the integrity anchor) ──────────
const ASVS_VERSION = "OWASP ASVS 5.0.0";
const TAG = "v5.0.0_release";
const SHA = "5cf9b032440be53ce345ab3c130fda46ba1ce7a2";
const EXPECTED_ROWS = 345;
// ── Fail-closed load + parse (a missing/garbled source is a finding, never an unhandled throw) ─
const fail = (m) => {
    console.error(`  ERROR    ${m}`);
    process.exit(1);
};
let raw;
try {
    raw = readFileSync(SRC, "utf8");
}
catch {
    fail(`cannot read vendored source: ${SRC}`);
}
let data;
try {
    data = JSON.parse(raw);
}
catch {
    fail(`${SRC}: not valid JSON`);
}
if (data === null || typeof data !== "object" || Array.isArray(data)) {
    fail(`${SRC}: top-level is not a JSON object`);
}
const requirements = data.requirements;
if (!Array.isArray(requirements)) {
    fail(`${SRC}: missing "requirements" array`);
}
// Row-count sanity assert (345) — fail closed on a truncated/tampered source; never partial-write.
if (requirements.length !== EXPECTED_ROWS) {
    fail(`${SRC}: expected ${EXPECTED_ROWS} requirements, found ${requirements.length} — refusing to write a partial checklist`);
}
const byChapter = new Map();
for (const r of requirements) {
    if (!byChapter.has(r.chapter_id)) {
        byChapter.set(r.chapter_id, { name: r.chapter_name, rows: [] });
    }
    byChapter.get(r.chapter_id).rows.push(r);
}
const chapters = [...byChapter.entries()].sort((a, b) => Number(a[0].slice(1)) - Number(b[0].slice(1)));
// ── Cumulative level math (stated honestly in the intro — L3 ⊇ L2 ⊇ L1) ──────────────────────
const count = (lvl) => requirements.filter((r) => r.L === lvl).length;
const l1 = count("1");
const l2cum = l1 + count("2");
const l3cum = l2cum + count("3");
// ── Emit the document: frontmatter + provenance header + clear-voice intro + per-chapter rows ─
const lines = [];
lines.push("---");
lines.push("kind: checklist");
lines.push("---");
lines.push(`<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-asvs-checklist.mjs`);
lines.push(`     Source: ${ASVS_VERSION} · OWASP/ASVS @ ${TAG}`);
lines.push(`     Commit: ${SHA} -->`);
lines.push("# Security / NFR Checklist");
lines.push("");
lines.push(`This is the full OWASP Application Security Verification Standard (ASVS) 5.0 requirement set —`);
lines.push(`${EXPECTED_ROWS} requirements across ${chapters.length} chapters, each tagged with its requirement ID and its`);
lines.push(`assurance level (L1, L2, or L3). It is generated from the pinned source above and is not`);
lines.push(`hand-transcribed; every row's text is copied verbatim from the standard.`);
lines.push("");
lines.push(`ASVS levels are cumulative: Level 2 includes all Level 1 requirements, and Level 3 includes`);
lines.push(`all Level 1 and Level 2 requirements. The \`security.asvs_level\` dial selects the active tier`);
lines.push(`at read and audit time — keep every requirement where \`L <= asvs_level\`. The active set is`);
lines.push(`${l1} requirements at L1, ${l2cum} at L2 (cumulative), and ${l3cum} at L3 (cumulative). This file is`);
lines.push(`not regenerated when the dial changes; the dial is a read-time filter over the full set.`);
lines.push("");
lines.push(`Apply this checklist whenever a change touches authentication, authorization, data handling,`);
lines.push(`cryptography, configuration, or another security concern. Reproduce each control exactly,`);
lines.push(`never skip one. Every pass must cite evidence; mark anything unverified \`UNKNOWN - verify\`.`);
for (const [id, { name, rows }] of chapters) {
    lines.push("");
    lines.push(`## ${id} ${name}`);
    lines.push("");
    for (const r of rows) {
        lines.push(`- [${r.req_id}] [L${r.L}] ${r.req_description}`);
    }
}
lines.push("");
writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(`generate-asvs-checklist: wrote ${requirements.length} requirements across ${chapters.length} chapters to ${OUT}`);
process.exit(0);

// generate-catalog.ts — grugops browsable docs catalog generator (DOCS-01).
//
// Reads the finished kit (agent-factory/roles + agent-factory/workflows) and emits
// docs/catalog/README.md — a single index with one roles table and one workflows table, each row
// linking to its kit source file. The catalog is generated, never hand-maintained: re-running this
// script reproduces a byte-identical file (the freshness gate depends on that). Mirrors the proven
// shape of generate-asvs-checklist.ts: fixed literal paths, fail-closed load, deterministic
// lines.join("\n") + writeFileSync emit, provenance header, single trailing newline, clear voice.
//
// Self-discovery (NOT the stale validate-agent-factory.ts ROLES/WORKFLOWS arrays — those froze at
// v1.0: 16 roles / 14 workflows, missing frontend-ui + workflows 14/15): readdirSync the two source
// dirs. roles/ drops `_`-prefixed files (D-03, so _role-switch-protocol.md is excluded → 17 roles);
// workflows/ keeps all 16 numbered files (00..15).
//
// Read-only (D-01): name from the `# Role:` / `# Workflow:` H1; one-line summary from the first
// sentence of `## One job` (roles) / `## When to use` (workflows); kind/tier/order/cadence from the
// flat key:value frontmatter. No edits to any kit file, no new frontmatter fields.
//
// No fabrication (D-09): workflows 12 (release) and 13 (incident) carry no `cadence` — their cadence
// cell reads `UNKNOWN - verify`, never a fabricated `cadence: both`.
//
// Node stdlib ONLY — node:fs + node:path. ZERO npm dependencies. Invocation takes no arguments:
//
//   node scripts/generate-catalog.js    # exit 0 on success, 1 on any structural miss
//
// Read/write-only by construction (path-traversal mitigation, ASVS V12, mirrors both analogs):
// ROLES_DIR/WORKFLOWS_DIR/OUT are FIXED literal paths joined to the repo root (the script dir's
// parent). None is ever derived from argv, env, or file content.
//
// Fail closed: a kit file with no `# Role:`/`# Workflow:` H1, an empty frontmatter where a required
// field is needed, or a directory read failure prints a finding to stderr and process.exit(1)
// WITHOUT writing — the full lines[] is built first, so a partial or garbled catalog never ships.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { unfencedHeadingIndex, sectionEndIndex } from "./frontmatter.js";

// ── Fixed literal paths (read/write-only by construction — never argv/env/content-derived) ───
const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const WORKFLOWS_DIR = join(ROOT, "agent-factory/workflows");
const OUT = join(ROOT, "docs/catalog/README.md");

// ── Fail-closed helper (a structural miss is a finding, never an unhandled throw) ─────────────
const fail = (m: string): never => {
  console.error(`  ERROR    ${m}`);
  process.exit(1);
};

// ── Flat key:value frontmatter parse (stdlib slice+regex — NO js-yaml/gray-matter) ────────────
function parseFrontmatter(text: string): Record<string, string> {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/); // fence at byte 0
  const fm: Record<string, string> = {};
  if (!m) return fm; // empty → caller treats as a fail-closed signal where a field is required
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

// ── First-sentence summary: split on ". " (period-SPACE), KEEP its period, never re-append ────
// Splitting on bare "." would truncate `AGENTS.md` (agents-md-scribe) and `OWASP ASVS 5.0`
// (workflow 15). `indexOf(". ") === -1` (e.g. incident-responder's single-sentence One job) returns
// the line as-is — which already ends in `.`; appending would produce `..`.
function firstSentence(body: string): string {
  const line = body.trim().split("\n")[0].trim(); // first non-empty line of the section body
  const dot = line.indexOf(". "); // sentence boundary = period-space
  return dot === -1 ? line : line.slice(0, dot + 1);
}

// ── Escape free-text content before it goes into a pipe-delimited table cell (WR-03) ──────────
// A literal `|` in an authored first sentence / H1 / cadence value would inject a spurious column;
// a stray newline would break the row. Backslash-escape `\` first (so we don't double-escape the
// `|` escapes we add next), then `|`, then flatten any newline to a space. Applied ONLY to authored
// content cells (name, summary, cadence) — never to the Source link column, which is constructed
// from a controlled file path and a relative URL we build ourselves.
function cell(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

// ── The body of a `## <heading>` section — ASKED, never answered here ──────────────────────────
// THIS MODULE DOES NOT OWN THE SECTION-EXTENT QUESTION. "Which line is this section's heading, and
// which line ends it" is asked once and answered once, in scripts/frontmatter.ts, for every module
// in this tree. This file asks it; it does not answer it.
//
// WHAT WAS DELETED HERE AND WHY (plan 29-35, LANG-07 / 29-REVIEW § WR-08). This function used to
// build a private `new RegExp` lookahead over the whole document — a THIRD grammar over bytes this
// tree has ONE parser for, duplicated byte-for-byte into scripts/generate-role-adapters.ts. It
// disagreed with the authority on two axes at once. It was FENCE-BLIND: a `## ` line quoted inside a
// fenced example terminated the capture early. And it was LEVEL-BLIND: its terminator named level
// TWO only, so a level-ONE heading did not close the section and the capture ran on into the next
// top-level section. That second half is byte-for-byte the defect scripts/voice-model.ts shipped at
// exit 0 for a whole milestone, and correcting it cost this phase two plans. Per D-24 a duplicate is
// DELETED rather than taught the two rules it was missing: a widened third copy is still a third
// copy, and one authority per predicate is the rule this phase was founded on.
//
// (The retired comment explaining that grammar's `$(?![\s\S])` branch went with the pattern it
// explained. A comment that outlives its construct is the defect one module over.)
//
// THE `-1` ANSWER IS LEGAL, AND IT IS NOT AN INDEX. It means "this document carries no such unfenced
// line", and it is handed back to the two call sites below as `null` — the value they already read
// as "section absent", so no caller changed. It is never defaulted to zero, never clamped with
// `Math.max`, and never swapped for another sentinel: `-1 + 1` is `0`, i.e. "from the top of the
// document", which is the widest possible answer to a question about a bounded section.
//
// FIVE IDENTICAL LINES ALSO LIVE IN scripts/generate-role-adapters.ts, AND THAT IS DELIBERATE — the
// reason is written here so a later reader does not merge them or duplicate them again. A shared
// wrapper would need a NEW module: both generators are top-level script code that writes files the
// moment it is imported, so neither may import the other, and adding a third exported name to
// frontmatter.ts would give one question a second name inside its own authority. Composing two
// exported authority functions at the point of use is not a duplicated grammar — it is two callers
// asking the same parser. Keep the two bodies in step; do not promote them to a fourth name.
function sectionBody(text: string, heading: string): string | null {
  const at = unfencedHeadingIndex(text, `## ${heading}`);
  if (at === -1) return null;
  const end = sectionEndIndex(text, at + 1, 2);
  return text.split("\n").slice(at + 1, end).join("\n");
}

// ── A catalogued kit entry ────────────────────────────────────────────────────────────────────
interface RoleEntry {
  name: string;
  tier: string;
  summary: string;
  link: string;
}
interface WorkflowEntry {
  name: string;
  order: number;
  cadence: string;
  summary: string;
  link: string;
}

// ── Read + parse roles (skip `_`-prefixed → D-03 drops _role-switch-protocol.md) ──────────────
let roleFiles!: string[];
try {
  roleFiles = readdirSync(ROLES_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();
} catch {
  fail(`cannot read roles directory: ${ROLES_DIR}`);
}

const roles: RoleEntry[] = [];
for (const file of roleFiles) {
  const path = join(ROLES_DIR, file);
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`cannot read role file: ${path}`);
  }
  const h1 = text!.match(/^# Role: (.+)$/m);
  if (!h1) fail(`${file}: no \`# Role:\` H1 — refusing to write a partial catalog`);
  const fm = parseFrontmatter(text!);
  const tier = fm.tier;
  if (tier !== "core" && tier !== "enterprise") {
    fail(`${file}: role tier must be core|enterprise, found "${tier ?? ""}"`);
  }
  const body = sectionBody(text!, "One job");
  // `null` = section absent; `""`/whitespace-only = section present but empty. Guard both
  // explicitly so a `## One job\n\n<text>` layout (blank line after the heading) parses correctly
  // rather than tripping a falsy-`""` check (WR-01).
  if (body === null || body.trim() === "") {
    fail(`${file}: no \`## One job\` section — refusing to write a partial catalog`);
  }
  roles.push({
    name: h1![1].trim(),
    tier,
    summary: firstSentence(body!),
    link: `agent-factory/roles/${file}`,
  });
}

// ── Read + parse workflows (all 16 numbered files 00..15) ─────────────────────────────────────
let workflowFiles!: string[];
try {
  // Match the documented contract: numbered workflow files only (`NN-*.md`, 00..15). A stray
  // README.md/_draft.md/note.md dropped into the dir is ignored rather than picked up and hard-
  // failed on the `# Workflow:` H1 check — mirrors the roles loop's `_`-prefix guard (WR-04, D-03).
  workflowFiles = readdirSync(WORKFLOWS_DIR)
    .filter((f) => /^\d{2}-.+\.md$/.test(f))
    .sort();
} catch {
  fail(`cannot read workflows directory: ${WORKFLOWS_DIR}`);
}

const workflows: WorkflowEntry[] = [];
for (const file of workflowFiles) {
  const path = join(WORKFLOWS_DIR, file);
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`cannot read workflow file: ${path}`);
  }
  const h1 = text!.match(/^# Workflow: (.+)$/m);
  if (!h1) fail(`${file}: no \`# Workflow:\` H1 — refusing to write a partial catalog`);
  const fm = parseFrontmatter(text!);
  const order = Number(fm.order);
  if (!Number.isInteger(order)) {
    fail(`${file}: workflow order must be an integer, found "${fm.order ?? ""}"`);
  }
  const body = sectionBody(text!, "When to use");
  // `null` = section absent; `""`/whitespace-only = section present but empty. Guard both
  // explicitly (see the roles loop above — WR-01).
  if (body === null || body.trim() === "") {
    fail(`${file}: no \`## When to use\` section — refusing to write a partial catalog`);
  }
  // No fabrication (D-09): a genuinely absent cadence surfaces UNKNOWN - verify, never `both`.
  const cadence = fm.cadence ? fm.cadence : "UNKNOWN - verify";
  workflows.push({
    name: h1![1].trim(),
    order,
    cadence,
    summary: firstSentence(body!),
    link: `agent-factory/workflows/${file}`,
  });
}

// ── Deterministic ordering (D-08, mandatory for the byte-diff) ─────────────────────────────────
// Roles: core group first, then enterprise; alphabetical (by display name) within each group.
roles.sort((a, b) => {
  if (a.tier !== b.tier) return a.tier === "core" ? -1 : 1;
  return a.name.localeCompare(b.name);
});
// Workflows: numeric `order` ascending (0..15, unique — no tie-break needed).
workflows.sort((a, b) => a.order - b.order);

// ── Emit the document: provenance header + intro + roles table + workflows table ──────────────
const lines: string[] = [];
lines.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->");
lines.push("# grugops Catalog");
lines.push("");
lines.push(
  `This is the generated, browsable index of the grugops kit: ${roles.length} role personas and`,
);
lines.push(
  `${workflows.length} workflows. Each row links to its source file. The catalog is produced by`,
);
lines.push(
  "`scripts/generate-catalog.js` and is never hand-edited — re-run the generator and commit the",
);
lines.push("result. Any unverified field is marked `UNKNOWN - verify` rather than invented.");
lines.push("");
lines.push("## Roles");
lines.push("");
lines.push("| Role | Tier | One job | Source |");
lines.push("| --- | --- | --- | --- |");
for (const r of roles) {
  // Content cells (name, summary) are escaped (WR-03); the Source link column is not (controlled
  // path). `tier` is constrained to core|enterprise so it needs no escaping. The link is RELATIVE
  // from docs/catalog/ (two levels up to the repo root) — portable across local viewers, VS Code
  // preview, plain CommonMark, and npm's README view, not just github.com's blob renderer (WR-02).
  lines.push(`| ${cell(r.name)} | ${r.tier} | ${cell(r.summary)} | [${r.link}](../../${r.link}) |`);
}
lines.push("");
lines.push("## Workflows");
lines.push("");
lines.push("| # | Workflow | Cadence | When to use | Source |");
lines.push("| --- | --- | --- | --- | --- |");
for (const w of workflows) {
  // Content cells (name, cadence, summary) escaped (WR-03); `order` is an integer; link column raw.
  // Relative link from docs/catalog/ — see the roles loop above (WR-02).
  lines.push(
    `| ${w.order} | ${cell(w.name)} | ${cell(w.cadence)} | ${cell(w.summary)} | [${w.link}](../../${w.link}) |`,
  );
}
lines.push(""); // trailing element → exactly one final "\n"

writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(
  `generate-catalog: wrote ${roles.length} roles and ${workflows.length} workflows to ${OUT}`,
);
process.exit(0);

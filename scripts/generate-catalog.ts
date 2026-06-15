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

// ── Extract the body of a `## <heading>` section (up to the next `## ` or end of file) ─────────
function sectionBody(text: string, heading: string): string | null {
  const re = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "m");
  const m = text.match(re);
  return m ? m[1] : null;
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
  if (!body) fail(`${file}: no \`## One job\` section — refusing to write a partial catalog`);
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
  workflowFiles = readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith(".md"))
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
  if (!body) {
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
  lines.push(`| ${r.name} | ${r.tier} | ${r.summary} | [${r.link}](/${r.link}) |`);
}
lines.push("");
lines.push("## Workflows");
lines.push("");
lines.push("| # | Workflow | Cadence | When to use | Source |");
lines.push("| --- | --- | --- | --- | --- |");
for (const w of workflows) {
  lines.push(
    `| ${w.order} | ${w.name} | ${w.cadence} | ${w.summary} | [${w.link}](/${w.link}) |`,
  );
}
lines.push(""); // trailing element → exactly one final "\n"

writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(
  `generate-catalog: wrote ${roles.length} roles and ${workflows.length} workflows to ${OUT}`,
);
process.exit(0);

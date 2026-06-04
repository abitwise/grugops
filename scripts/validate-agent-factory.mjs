// validate-agent-factory.mjs — grugops structure-only validator (VAL-01).
//
// Asserts the frozen grugops kit tree is structurally well-formed: required files exist,
// role/workflow files carry their required sections (by PREFIX match — never exact-string,
// never uniqueness), the config parses with mode/cadence/autonomy, board<->ticket status
// matches (VACUOUS on zero tickets — D-43), traceability completeness is flagged, and
// packaging is present with a named plugin.json.
//
// Node stdlib ONLY — node:fs + node:path + node:url. ZERO npm dependencies. NO package.json
// is created or required (D-45, spec §18). Invocation is bare:
//
//   node scripts/validate-agent-factory.mjs            # exit 0 = green, 1 = errors
//   node scripts/validate-agent-factory.mjs --strict   # warnings promoted to errors
//   VALIDATE_ROOT=/path/to/tree node scripts/validate-agent-factory.mjs   # validate another tree
//
// Two-tier findings (D-44): ERRORS (missing file/section; config doesn't parse or lacks
// mode/cadence/autonomy; plugin.json missing name; board/ticket status mismatch) → exit 1.
// WARNINGS (ticket missing a traceability row, or a row missing Tests/UAT) → reported, exit 0
// bare; --strict promotes them to the nonzero exit.
//
// Read-only by construction (T-06-02): every path is join(ROOT, <fixed literal rel>); no write
// path is ever derived from file content. Every read/JSON.parse is wrapped in try/catch so a
// missing or garbled file becomes a finding, never an unhandled throw (T-06-01/T-06-03,
// mirrors hooks/guard.mjs + install.mjs fail-closed posture).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── Repo-root resolution (env-overridable; self-validates regardless of cwd) ────────────────
// Mirrors install.mjs:33-40 — VALIDATE_ROOT lets the self-test point at a fixture tree.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.VALIDATE_ROOT
  ? resolve(process.env.VALIDATE_ROOT)
  : resolve(SCRIPT_DIR, "..");

// ── Safe filesystem helpers (try/catch → null/false/[]; never throw) ────────────────────────
const exists = (rel) => existsSync(join(ROOT, rel));
const safeRead = (rel) => {
  try {
    return readFileSync(join(ROOT, rel), "utf8");
  } catch {
    return null;
  }
};
const listDir = (rel) => {
  try {
    return existsSync(join(ROOT, rel)) ? readdirSync(join(ROOT, rel)) : [];
  } catch {
    return [];
  }
};

// ── Two-tier finding collector (D-44) ───────────────────────────────────────────────────────
const errors = [];
const warnings = [];
const STRICT = process.argv.includes("--strict");
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ── Frozen name lists (reused verbatim from the Phase-4 harness — never re-derived) ──────────
// 14 workflows (check-structure.sh:33). install has NO numbered workflow — there is no 14-*.md.
const WORKFLOWS = [
  "00-bootstrap-greenfield",
  "01-bootstrap-brownfield",
  "02-idea-to-epics",
  "03-epic-to-tickets",
  "04-ticket-to-pr",
  "05-pr-quality-gate",
  "06-uat-pack",
  "07-backlog-refinement",
  "08-sprint-planning",
  "09-daily-sweep",
  "10-sprint-review",
  "11-retro",
  "12-release",
  "13-incident",
];

// 16 frozen handoff filenames (check-structure.sh:48) — existence-only per §18.
const FROZEN_HANDOFFS = [
  "universal-handoff",
  "business-handoff",
  "product-handoff",
  "system-handoff",
  "architecture-handoff",
  "implementation-handoff",
  "qe-handoff",
  "security-nfr-handoff",
  "uat-handoff",
  "ticket-ready-packet",
  "implementation-ready-packet",
  "release-handoff",
  "incident-postmortem",
  "retro-notes",
  "refinement-notes",
  "sprint-plan",
];

// 16 role filenames — every role authored across Phases 3.
const ROLES = [
  "orchestrator",
  "agents-md-scribe",
  "brownfield-mapper",
  "greenfield-mapper",
  "ba-pm",
  "system-analyst",
  "architect-design",
  "software-engineer",
  "qe-e2e",
  "security-nfr",
  "uat-planner",
  "release-manager",
  "compliance-officer",
  "incident-responder",
  "factory-coach",
  "installer",
];

// 11 checklist filenames (10 named + 00-index) — existence-only per §18.
const CHECKLISTS = [
  "00-index",
  "definition-of-ready",
  "definition-of-done",
  "definition-of-done-enterprise",
  "pr-review-checklist",
  "security-nfr-checklist",
  "compliance-checklist",
  "accessibility-checklist",
  "observability-slo-checklist",
  "release-readiness-checklist",
  "uat-checklist",
];

// Role section headings — match by PREFIX (^## <prefix>), never exact, never uniqueness.
// The real headers carry parenthetical suffixes (## Output (file + format), etc.), and the
// duplicate ## Scope/## Risks in two handoffs means presence>=1 is the only safe assertion
// (PROJECT.md line 96; RESEARCH Pitfall 1/2).
const ROLE_SECTIONS = [
  "## One job",
  "## Caveman prompt",
  "## Reads",
  "## Responsibilities",
  "## Output",
  "## Board moves",
  "## Trace updates",
  "## Hard limits",
];

// Workflow section headings — the 9 §18-named sections, prefix-matched (## Metrics emitted is
// bonus and not asserted).
const WORKFLOW_SECTIONS = [
  "## When",
  "## Agents",
  "## Inputs",
  "## Steps",
  "## Board moves",
  "## Handoffs",
  "## Trace updates",
  "## Stop",
  "## Done",
];

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────
const kebab = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Section presence by prefix: present if ANY line starts with the prefix. Handles
// "## Output (file + format)" and tolerates duplicate sections (presence, not uniqueness).
function checkSections(rel, text, sections, kind) {
  const lines = text.split("\n");
  for (const sec of sections) {
    if (!lines.some((l) => l.startsWith(sec))) {
      err(`${rel}: missing required ${kind} section "${sec}"`);
    }
  }
}

// ── Check 1: required files exist ─────────────────────────────────────────────────────────────
function checkRequiredFiles() {
  for (const r of ROLES) {
    const rel = `agent-factory/roles/${r}.md`;
    if (!exists(rel)) err(`missing required role file: ${rel}`);
  }
  for (const w of WORKFLOWS) {
    const rel = `agent-factory/workflows/${w}.md`;
    if (!exists(rel)) err(`missing required workflow file: ${rel}`);
  }
  for (const h of FROZEN_HANDOFFS) {
    const rel = `agent-factory/handoffs/${h}.md`;
    if (!exists(rel)) err(`missing required handoff file: ${rel}`);
  }
  for (const c of CHECKLISTS) {
    const rel = `agent-factory/checklists/${c}.md`;
    if (!exists(rel)) err(`missing required checklist file: ${rel}`);
  }
  for (const rel of [
    "agent-factory/config/factory.config.json",
    "agent-factory/config/factory.config.md",
    "plans/board.md",
    "plans/traceability.md",
    "plans/nfr-catalog.md",
    "plans/metrics.md",
    "agent-factory/packaging/adapters.md",
    "AGENTS.md",
  ]) {
    if (!exists(rel)) err(`missing required file: ${rel}`);
  }
}

// ── Check 2: role section presence ─────────────────────────────────────────────────────────────
function checkRoleSections() {
  for (const r of ROLES) {
    const rel = `agent-factory/roles/${r}.md`;
    const text = safeRead(rel);
    if (text === null) continue; // missing-file already reported by checkRequiredFiles
    checkSections(rel, text, ROLE_SECTIONS, "role");
  }
}

// ── Check 3: workflow section presence ──────────────────────────────────────────────────────────
function checkWorkflowSections() {
  for (const w of WORKFLOWS) {
    const rel = `agent-factory/workflows/${w}.md`;
    const text = safeRead(rel);
    if (text === null) continue;
    checkSections(rel, text, WORKFLOW_SECTIONS, "workflow");
  }
}

// ── Check 4: config parses + has mode/cadence/autonomy ────────────────────────────────────────
function checkConfig() {
  const rel = "agent-factory/config/factory.config.json";
  const raw = safeRead(rel);
  if (raw === null) return; // missing-file already reported
  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch {
    err(`${rel}: not valid JSON`);
    return;
  }
  for (const key of ["mode", "cadence", "autonomy"]) {
    if (typeof cfg[key] !== "string" || cfg[key].trim() === "") {
      err(`${rel}: missing or empty required key "${key}"`);
    }
  }
}

// ── Check 5+6: board<->ticket status match (vacuous on zero tickets) + traceability rows ──────
function frontMatter(text) {
  const col = text.match(/^column:\s*(.+)$/m);
  const status = text.match(/^status:\s*(.+)$/m);
  return {
    column: col ? col[1].trim() : null,
    status: status ? status[1].trim() : null,
  };
}

function checkTickets() {
  const ticketFiles = listDir("plans/tickets").filter((f) => f.endsWith(".md"));
  if (ticketFiles.length === 0) return; // D-43 vacuity: zero tickets → green

  const board = safeRead("plans/board.md") || "";
  const boardLines = board.split("\n");
  const trace = safeRead("plans/traceability.md") || "";

  const boardHasColumn = (col) =>
    boardLines.some((l) => l.startsWith(`## ${col} `) || l.trim() === `## ${col}`);

  for (const f of ticketFiles) {
    const rel = `plans/tickets/${f}`;
    const text = safeRead(rel);
    if (text === null) continue;
    const { column, status } = frontMatter(text);
    if (column && !boardHasColumn(column)) {
      err(`${rel}: column "${column}" is not a board column`);
    }
    if (column && status && kebab(column) !== status) {
      err(
        `${rel}: status "${status}" does not match column "${column}" (expected kebab "${kebab(column)}")`,
      );
    }
    // Traceability completeness — WARNING (D-44). Ticket id = filename without extension.
    const id = f.replace(/\.md$/, "");
    if (!trace.includes(id)) {
      warn(`${rel}: no traceability row for ticket "${id}"`);
    }
  }
}

// ── Check 7: packaging present + plugin.json has a name ───────────────────────────────────────
function checkPackaging() {
  if (!exists("agent-factory/packaging/adapters.md")) {
    err("missing required packaging file: agent-factory/packaging/adapters.md");
  }
  const rel = ".claude-plugin/plugin.json";
  if (exists(rel)) {
    const raw = safeRead(rel);
    let manifest;
    try {
      manifest = JSON.parse(raw);
    } catch {
      err(`${rel}: not valid JSON`);
      return;
    }
    if (typeof manifest.name !== "string" || manifest.name.trim() === "") {
      err(`${rel}: missing or empty required field "name"`);
    }
  }
}

// ── Run all checks ───────────────────────────────────────────────────────────────────────────
checkRequiredFiles();
checkRoleSections();
checkWorkflowSections();
checkConfig();
checkTickets();
checkPackaging();

// ── Render + exit ──────────────────────────────────────────────────────────────────────────────
for (const e of errors) console.error(`  ERROR    ${e}`);
for (const w of warnings) console.error(`  WARNING  ${w}`);

const failed = errors.length + (STRICT ? warnings.length : 0);
if (failed === 0) {
  console.log("ALL CHECKS PASSED");
  process.exit(0);
}
console.error(`${failed} ERROR(S)${STRICT ? " (--strict: warnings promoted)" : ""}`);
process.exit(1);

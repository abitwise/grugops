// validate-agent-factory.mjs — grugops structure-only validator (VAL-01).
//
// Asserts the frozen grugops kit tree is structurally well-formed: required files exist,
// role/workflow files carry their required sections (by PREFIX match — never exact-string,
// never uniqueness), the config parses with mode/cadence/autonomy AND enum-checks the 8
// optional v1.2 dial keys WHEN PRESENT (bdd; quality.tdd/ui_e2e/test_integrity/gate_enforcement;
// quality.lint shape; security.asvs_level/block_on) — a MISSING key is its lean default, never
// an error (D-14 active-when-present / lenient-when-absent, preserving SC4 zero-config); the
// trace-integrity key is warn|block only — disabling it is rejected (TINT-03 carve-out).
// Board<->ticket status matches (VACUOUS on zero tickets — D-43), traceability completeness is
// flagged, and packaging is present with a named plugin.json.
//
// Node stdlib ONLY — node:fs + node:path + node:url. ZERO npm dependencies. NO package.json
// is created or required (D-45, spec §18). Invocation requires the kit root explicitly:
//
//   VALIDATE_KIT_ROOT=/path/to/kit node scripts/validate-agent-factory.mjs           # exit 0/1
//   VALIDATE_KIT_ROOT=/path/to/kit node scripts/validate-agent-factory.mjs --strict  # warns→errors
//   VALIDATE_KIT_ROOT=/kit VALIDATE_ROOT=/state node scripts/validate-agent-factory.mjs
//
// Two roots (VAL-02 / D-08), resolved separately so the validator cannot false-green in the dev
// checkout (the C3 footgun):
//   VALIDATE_KIT_ROOT  REQUIRED — NO DEFAULT. Holds the read-only kit (agent-factory/…, AGENTS.md,
//                      .claude-plugin/). Unset is a HARD ERROR (process.exit(1) with a "(C3)"
//                      message) — it never silently falls back to "." / the dev checkout.
//   VALIDATE_ROOT      The STATE root (plans/…). Optional; defaults to the repo root (back-compat
//                      for the existing single-tree fixtures and self-validation).
// kit-classified checks resolve under KIT_ROOT; state-classified checks under STATE_ROOT
// (Phase-7 classification: agent-factory/… + AGENTS.md + .claude-plugin/ = KIT; plans/… = STATE).
//
// Two-tier findings (D-44): ERRORS (missing file/section; config doesn't parse or lacks
// mode/cadence/autonomy; a PRESENT dial key carrying an out-of-enum value — e.g. asvs_level:"L4"
// or a trace-integrity value outside warn|block; a malformed quality.lint shape; plugin.json
// missing name; board/ticket status mismatch) → exit 1.
// WARNINGS (ticket missing a traceability row, or a row missing Tests/UAT) → reported, exit 0
// bare; --strict promotes them to the nonzero exit.
//
// Read-only by construction (T-06-02): every path is join(KIT_ROOT|STATE_ROOT, <fixed literal
// rel>); no write path is ever derived from file content. Every read/JSON.parse is wrapped in
// try/catch so a missing or garbled file becomes a finding, never an unhandled throw
// (T-06-01/T-06-03, mirrors hooks/guard.mjs + install.mjs fail-closed posture).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── Two-root resolution (VAL-02 / D-08 — kit root + state root, resolved separately) ─────────
// STATE_ROOT keeps the install.mjs:33-40 back-compat shape: VALIDATE_ROOT, else the repo root.
// KIT_ROOT comes ONLY from VALIDATE_KIT_ROOT and has NO default — the deliberate C3 override
// ("no fallback" beats "sensible default" here, and ONLY here). Unset → hard error, never a
// silent "." / dev-checkout fallback that would false-green.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const STATE_ROOT = process.env.VALIDATE_ROOT
  ? resolve(process.env.VALIDATE_ROOT)
  : resolve(SCRIPT_DIR, ".."); // back-compat repo root for STATE only
if (!process.env.VALIDATE_KIT_ROOT) {
  console.error(
    "  ERROR    VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)",
  );
  process.exit(1); // the no-false-green guard (NO DEFAULT)
}
const KIT_ROOT = resolve(process.env.VALIDATE_KIT_ROOT);

// ── Safe filesystem helpers, forked per root (try/catch → null/false/[]; never throw) ────────
// kit* resolve under KIT_ROOT; state* resolve under STATE_ROOT. Each keeps the fail-closed
// posture verbatim so a missing/garbled file becomes a finding, never an unhandled throw.
const kitExists = (rel) => existsSync(join(KIT_ROOT, rel));
const kitRead = (rel) => {
  try {
    return readFileSync(join(KIT_ROOT, rel), "utf8");
  } catch {
    return null;
  }
};
const kitListDir = (rel) => {
  try {
    return existsSync(join(KIT_ROOT, rel)) ? readdirSync(join(KIT_ROOT, rel)) : [];
  } catch {
    return [];
  }
};

const stateExists = (rel) => existsSync(join(STATE_ROOT, rel));
const stateRead = (rel) => {
  try {
    return readFileSync(join(STATE_ROOT, rel), "utf8");
  } catch {
    return null;
  }
};
const stateListDir = (rel) => {
  try {
    return existsSync(join(STATE_ROOT, rel)) ? readdirSync(join(STATE_ROOT, rel)) : [];
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
    if (!kitExists(rel)) err(`missing required role file: ${rel}`);
  }
  for (const w of WORKFLOWS) {
    const rel = `agent-factory/workflows/${w}.md`;
    if (!kitExists(rel)) err(`missing required workflow file: ${rel}`);
  }
  for (const h of FROZEN_HANDOFFS) {
    const rel = `agent-factory/handoffs/${h}.md`;
    if (!kitExists(rel)) err(`missing required handoff file: ${rel}`);
  }
  for (const c of CHECKLISTS) {
    const rel = `agent-factory/checklists/${c}.md`;
    if (!kitExists(rel)) err(`missing required checklist file: ${rel}`);
  }
  // The former single mixed loop (lines ~201-211) is split by Phase-7 classification:
  // KIT refs (agent-factory/… + AGENTS.md) resolve under KIT_ROOT…
  for (const rel of [
    "agent-factory/config/factory.config.json",
    "agent-factory/config/factory.config.md",
    "agent-factory/packaging/adapters.md",
    "AGENTS.md",
  ]) {
    if (!kitExists(rel)) err(`missing required file: ${rel}`);
  }
  // …and STATE refs (plans/…) resolve under STATE_ROOT.
  for (const rel of [
    "plans/board.md",
    "plans/traceability.md",
    "plans/nfr-catalog.md",
    "plans/metrics.md",
  ]) {
    if (!stateExists(rel)) err(`missing required file: ${rel}`);
  }
}

// ── Check 2: role section presence ─────────────────────────────────────────────────────────────
function checkRoleSections() {
  for (const r of ROLES) {
    const rel = `agent-factory/roles/${r}.md`;
    const text = kitRead(rel);
    if (text === null) continue; // missing-file already reported by checkRequiredFiles
    checkSections(rel, text, ROLE_SECTIONS, "role");
  }
}

// ── Check 3: workflow section presence ──────────────────────────────────────────────────────────
function checkWorkflowSections() {
  for (const w of WORKFLOWS) {
    const rel = `agent-factory/workflows/${w}.md`;
    const text = kitRead(rel);
    if (text === null) continue;
    checkSections(rel, text, WORKFLOW_SECTIONS, "workflow");
  }
}

// ── Check 4: config parses + has mode/cadence/autonomy ────────────────────────────────────────
function checkConfig() {
  const rel = "agent-factory/config/factory.config.json";
  const raw = kitRead(rel);
  if (raw === null) return; // missing-file already reported
  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch {
    err(`${rel}: not valid JSON`);
    return;
  }
  // JSON.parse("null") returns null WITHOUT throwing (so does a bare array / primitive),
  // slipping past the try/catch above; the cfg[key] deref below would then crash with an
  // uncaught TypeError, violating the file-header fail-closed invariant. Reject any
  // non-object parse result as a greppable finding before dereferencing (CR-03 / GAP-3).
  if (cfg === null || typeof cfg !== "object" || Array.isArray(cfg)) {
    err(`${rel}: not a JSON object`);
    return;
  }
  for (const key of ["mode", "cadence", "autonomy"]) {
    if (typeof cfg[key] !== "string" || cfg[key].trim() === "") {
      err(`${rel}: missing or empty required key "${key}"`);
    }
  }

  // ── Optional-enum recognition of the 8 new v1.2 dial keys (SDLC-03 / D-14) ──────────────────
  // ACTIVE-WHEN-PRESENT, LENIENT-WHEN-ABSENT — the opposite contract to the required-string loop
  // above: a MISSING key is its documented lean default (NEVER an error — preserves SC4
  // zero-config); only an INVALID PRESENT value is an err() (always nonzero, even bare — RESEARCH
  // Security row 5, never warn()). Every check is guarded by `if (key in obj)`, never the
  // unconditional loop, so a config without these keys still passes (Pitfall 5 / D-14).
  // The trace-integrity enum is ["warn","block"] — disabling it is deliberately EXCLUDED
  // (TINT-03 safety carve-out: trace-integrity is never fully dialable off).
  const ENUMS = {
    bdd: ["off", "lean", "strict"],
  };
  const Q_ENUMS = {
    tdd: ["off", "encouraged", "required"],
    ui_e2e: ["off", "ui-or-critical-path", "always"],
    test_integrity: ["warn", "block"], // disabling EXCLUDED — TINT-03 carve-out
    gate_enforcement: ["advisory", "blocking"],
  };
  const SEC_ENUMS = {
    asvs_level: ["L1", "L2", "L3"],
    block_on: ["none", "low", "medium", "high"],
  };

  // top-level bdd — presence-guarded; absent = lean default, no error (SC4).
  if ("bdd" in cfg && !ENUMS.bdd.includes(cfg.bdd)) {
    err(`${rel}: invalid "bdd" value "${cfg.bdd}" (allowed: ${ENUMS.bdd.join("|")})`);
  }

  // quality.* enums — only if quality is a non-null, non-array object.
  if (cfg.quality && typeof cfg.quality === "object" && !Array.isArray(cfg.quality)) {
    for (const [k, allowed] of Object.entries(Q_ENUMS)) {
      if (k in cfg.quality && !allowed.includes(cfg.quality[k])) {
        err(
          `${rel}: invalid "quality.${k}" value "${cfg.quality[k]}" (allowed: ${allowed.join("|")})`,
        );
      }
    }
    // quality.lint is an OBJECT { strict:bool, autofix:bool } — SHAPE-check, not enum (D-12).
    if ("lint" in cfg.quality) {
      const l = cfg.quality.lint;
      if (l === null || typeof l !== "object" || Array.isArray(l)) {
        err(`${rel}: "quality.lint" must be an object { strict, autofix }`);
      } else {
        if ("strict" in l && typeof l.strict !== "boolean") {
          err(`${rel}: "quality.lint.strict" must be boolean`);
        }
        if ("autofix" in l && typeof l.autofix !== "boolean") {
          err(`${rel}: "quality.lint.autofix" must be boolean`);
        }
      }
    }
  }

  // security.* enums — only if security is a non-null, non-array object.
  if (cfg.security && typeof cfg.security === "object" && !Array.isArray(cfg.security)) {
    for (const [k, allowed] of Object.entries(SEC_ENUMS)) {
      if (k in cfg.security && !allowed.includes(cfg.security[k])) {
        err(
          `${rel}: invalid "security.${k}" value "${cfg.security[k]}" (allowed: ${allowed.join("|")})`,
        );
      }
    }
  }

  // ── Safety invariant: production_requires_human_confirmation must be true (WR-01) ────────────
  // The ONE field in the schema with a hardcoded safety floor ("Must stay `true`",
  // factory.config.md:28) — the mechanical form of the no-agent-deploy rule (agents never deploy
  // to production alone; a named human always confirms). Mirrors the TINT-03 carve-out: there is
  // NO false value in ANY mode. Presence-guarded so an ABSENT key stays the lean `true` default
  // (preserving SC4 zero-config — only an explicit `false` is rejected); an err() (always nonzero,
  // even bare — never warn()) because a silently-dialed-off deploy guard is a safety regression.
  if (
    "production_requires_human_confirmation" in cfg &&
    cfg.production_requires_human_confirmation !== true
  ) {
    err(
      `${rel}: "production_requires_human_confirmation" must be true (agents never deploy to production alone)`,
    );
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
  const ticketFiles = stateListDir("plans/tickets").filter((f) => f.endsWith(".md"));
  if (ticketFiles.length === 0) return; // D-43 vacuity: zero tickets → green

  const board = stateRead("plans/board.md") || "";
  const boardLines = board.split("\n");
  const trace = stateRead("plans/traceability.md") || "";

  // Full-segment column match (WR-03): a board heading "## <name> (WIP …)" names the
  // column <name>; we compare <name> for EQUALITY with the ticket column, never by bare
  // prefix. The old `startsWith("## " + col + " ")` accepted word-prefixes — col "In"
  // wrongly matched "## In Development (WIP 0/3)" — letting a genuinely wrong column slip
  // the membership check. We normalize each `## ` line by dropping a trailing ` (WIP …)`
  // marker and trimming, then require an exact match.
  const boardColumnName = (line) =>
    line
      .replace(/^##\s+/, "")
      .replace(/\s*\(WIP[^)]*\)\s*$/, "")
      .trim();
  const boardHasColumn = (col) =>
    boardLines.some((l) => l.startsWith("## ") && boardColumnName(l) === col.trim());

  for (const f of ticketFiles) {
    const rel = `plans/tickets/${f}`;
    const text = stateRead(rel);
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
  if (!kitExists("agent-factory/packaging/adapters.md")) {
    err("missing required packaging file: agent-factory/packaging/adapters.md");
  }
  const rel = ".claude-plugin/plugin.json";
  if (kitExists(rel)) {
    const raw = kitRead(rel);
    if (raw === null) {
      // Present but unreadable (EACCES, transient I/O error, or path is a directory).
      // JSON.parse(null) returns null (it does NOT throw), so without this guard the
      // manifest.name deref below crashes with an uncaught TypeError — violating the
      // file's fail-closed invariant. Mirror checkConfig's early return (line 239).
      err(`${rel}: present but unreadable`);
      return;
    }
    let manifest;
    try {
      manifest = JSON.parse(raw);
    } catch {
      err(`${rel}: not valid JSON`);
      return;
    }
    // Twin of checkConfig's guard: JSON.parse("null") returns null without throwing (so does
    // an array / primitive), and the manifest.name deref below would crash with an uncaught
    // TypeError. Reject any non-object parse result as a greppable finding (CR-03 / GAP-3).
    if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
      err(`${rel}: not a JSON object`);
      return;
    }
    if (typeof manifest.name !== "string" || manifest.name.trim() === "") {
      err(`${rel}: missing or empty required field "name"`);
    }
  }
}

// ── Check 8: role-switch protocol exists + is referenced by the Orchestrator ──────────────────
// Structural only: the protocol file is present AND orchestrator.md points at it by path. We
// assert the reference (a substring), never the protocol's prose — presence, not behavior.
function checkRoleSwitchProtocol() {
  const protocolRel = "agent-factory/roles/_role-switch-protocol.md";
  if (!kitExists(protocolRel)) {
    err(`missing required file: ${protocolRel}`);
  }
  const orchRel = "agent-factory/roles/orchestrator.md";
  const orch = kitRead(orchRel);
  if (orch === null) return; // missing-file already reported by checkRequiredFiles
  if (!orch.includes("_role-switch-protocol")) {
    err(`${orchRel}: does not reference the role-switch protocol (_role-switch-protocol)`);
  }
}

// ── Check 9: commit-convention file exists ────────────────────────────────────────────────────
function checkCommitConvention() {
  const rel = "agent-factory/_commit-convention.md";
  if (!kitExists(rel)) {
    err(`missing required file: ${rel}`);
  }
}

// ── Check 10: every workflow has a "## Commit" section ────────────────────────────────────────
// Prefix-match (a line that startsWith "## Commit"), consistent with checkSections — tolerates a
// parenthetical suffix. Structural presence only.
function checkWorkflowCommit() {
  for (const w of WORKFLOWS) {
    const rel = `agent-factory/workflows/${w}.md`;
    const text = kitRead(rel);
    if (text === null) continue; // missing-file already reported by checkRequiredFiles
    const hasCommit = text.split("\n").some((l) => l.startsWith("## Commit"));
    if (!hasCommit) {
      err(`${rel}: missing required "## Commit" section`);
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
checkRoleSwitchProtocol();
checkCommitConvention();
checkWorkflowCommit();

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

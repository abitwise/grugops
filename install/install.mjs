// install.mjs — grugops Node installer (INSTALL-01), functionally identical to install.sh.
//
// Cross-platform (Windows / no-POSIX) sibling of install/install.sh. Node stdlib ONLY:
// node:fs + node:path + node:url + node:os — ZERO npm dependencies, no package.json runtime
// deps to audit (threat T-05-05-SC: accept — no external packages).
//
// Same behavior as install.sh:
//   - additive    — never overwrites or deletes user content; appends via unique sentinels
//   - idempotent  — running twice produces ZERO diff
//   - DRY_RUN=1   — prints the plan and changes NOTHING on the filesystem
//   - reversible  — install/uninstall.sh removes exactly what this added (and only that)
//   - D-30 symlink-with-copy-fallback (fs.symlinkSync → fs.copyFileSync on failure)
//   - NEVER sets the production deploy-approval env var; NEVER touches agent-factory/, plans/, user data
//
// install.sh is the behavioral spec; this mirrors it.
//
// Usage:
//   node install/install.mjs
//   DRY_RUN=1 node install/install.mjs
//   INSTALL_MODE=copy node install/install.mjs
//   GRUGOPS_SRC=/path/to/grugops TARGET=/path/to/repo node install/install.mjs

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  symlinkSync,
  copyFileSync,
  lstatSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const GRUGOPS_SRC = process.env.GRUGOPS_SRC
  ? resolve(process.env.GRUGOPS_SRC)
  : resolve(SCRIPT_DIR, "..");
const TARGET = process.env.TARGET ? resolve(process.env.TARGET) : process.cwd();
const DRY_RUN = process.env.DRY_RUN === "1";
// D-30: default symlink, fall back to copy; INSTALL_MODE=copy forces copy.
const INSTALL_MODE = process.env.INSTALL_MODE || "symlink";

const SKILLS = [
  "grugops",
  "grugops-map",
  "grugops-plan",
  "grugops-ticket",
  "grugops-gate",
  "grugops-uat",
  "grugops-release",
];
const AGENT_REL = ".claude/agents/grugops-orchestrator.md";

// CLAUDE.md sentinel block — byte-identical to install.sh / 05-02's GSD:grugops-start-here.
const CLAUDE_OPEN = "<!-- GSD:grugops-start-here -->";
const CLAUDE_PTR =
  "**grugops — start here:** read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.";
const CLAUDE_CLOSE = "<!-- GSD:grugops-start-here-end -->";

const COPILOT_REL = ".github/copilot-instructions.md";
const COPILOT_OPEN = "<!-- GSD:grugops-start-here -->";
const COPILOT_PTR =
  "grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.";
const COPILOT_CLOSE = "<!-- GSD:grugops-start-here-end -->";

const report = (label, msg) => console.log(`  ${label.padEnd(14)} ${msg}`);

const mkdirp = (dir) => {
  if (!existsSync(dir) && !DRY_RUN) mkdirSync(dir, { recursive: true });
};

const isSymlink = (p) => {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
};

const sameContent = (a, b) => {
  try {
    return readFileSync(a, "utf8") === readFileSync(b, "utf8");
  } catch {
    return false;
  }
};

// ensure_block: idempotent sentinel-delimited append to a user file. Never overwrites; skips
// if the open sentinel is already present; creates the file if absent. Never `>`-truncates.
function ensureBlock(file, open, body, close, label) {
  if (existsSync(file) && readFileSync(file, "utf8").includes(open)) {
    report("skipped", `${label} (sentinel already present)`);
    return;
  }
  if (DRY_RUN) {
    report("would-add", label);
    return;
  }
  mkdirp(dirname(file));
  if (!existsSync(file)) writeFileSync(file, "");
  appendFileSync(file, `\n${open}\n${body}\n${close}\n`);
  report("created", label);
}

// link_or_copy: D-30 symlink-with-copy-fallback, idempotent. Never clobbers a non-grugops
// user file (destinations are all grugops-owned paths).
function linkOrCopy(src, dest, label) {
  if (!existsSync(src)) {
    report("skipped", `${label} (source missing: ${src})`);
    return;
  }
  if (isSymlink(dest)) {
    report("skipped", `${label} (symlink present)`);
    return;
  }
  if (existsSync(dest) && sameContent(src, dest)) {
    report("skipped", `${label} (identical copy present)`);
    return;
  }
  if (DRY_RUN) {
    report(INSTALL_MODE === "copy" ? "would-copy" : "would-link", label);
    return;
  }
  mkdirp(dirname(dest));
  if (INSTALL_MODE !== "copy") {
    try {
      symlinkSync(src, dest);
      if (isSymlink(dest)) {
        report("linked", label);
        return;
      }
    } catch {
      // fall through to copy
    }
  }
  copyFileSync(src, dest);
  report("copied(verify)", label);
}

// merge_gemini: additive read-modify-write of .gemini/settings.json context.fileName. Unlike
// the pure-sh installer, Node can safely JSON.parse/merge. Never `>`-clobbers a user's file
// blindly: a parse failure leaves the file untouched and flags verify.
function mergeGemini() {
  const file = join(TARGET, ".gemini", "settings.json");
  const want = "AGENTS.md";
  if (!existsSync(file)) {
    if (DRY_RUN) {
      report("would-add", ".gemini/settings.json (context.fileName: [AGENTS.md, GEMINI.md])");
      return;
    }
    mkdirp(join(TARGET, ".gemini"));
    writeFileSync(
      file,
      JSON.stringify({ context: { fileName: ["AGENTS.md", "GEMINI.md"] } }, null, 2) + "\n",
    );
    report("created", ".gemini/settings.json (context.fileName wiring)");
    return;
  }
  let json;
  try {
    json = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    report("verify", ".gemini/settings.json is not valid JSON — left untouched; add AGENTS.md to context.fileName manually");
    return;
  }
  json.context = json.context || {};
  const list = Array.isArray(json.context.fileName)
    ? json.context.fileName
    : json.context.fileName
      ? [json.context.fileName]
      : [];
  if (list.includes(want)) {
    report("skipped", ".gemini/settings.json (context.fileName already lists AGENTS.md)");
    return;
  }
  list.push(want);
  json.context.fileName = list;
  if (DRY_RUN) {
    report("would-add", ".gemini/settings.json (merge AGENTS.md into context.fileName)");
    return;
  }
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  report("created", ".gemini/settings.json (merged AGENTS.md into context.fileName)");
}

function detectTools() {
  const found = [];
  if (existsSync(join(TARGET, ".claude"))) found.push("claude");
  if (existsSync(join(TARGET, ".codex"))) found.push("codex");
  if (existsSync(join(TARGET, ".gemini"))) found.push("gemini");
  if (existsSync(join(TARGET, "opencode.json"))) found.push("opencode");
  if (existsSync(join(TARGET, ".github"))) found.push("copilot");
  return found.length ? found.join(" ") : "none-detected";
}

// --- run -------------------------------------------------------------------
console.log("== grugops install ==");
console.log(`source: ${GRUGOPS_SRC}`);
console.log(`target: ${TARGET}`);
if (DRY_RUN) console.log("mode:   DRY_RUN (no filesystem changes)");
console.log(`tools detected: ${detectTools()}`);
console.log("\n-- adapters --");

for (const s of SKILLS) {
  linkOrCopy(
    join(GRUGOPS_SRC, ".claude", "skills", s, "SKILL.md"),
    join(TARGET, ".claude", "skills", s, "SKILL.md"),
    `.claude/skills/${s}/SKILL.md`,
  );
}

linkOrCopy(join(GRUGOPS_SRC, AGENT_REL), join(TARGET, AGENT_REL), AGENT_REL);

if (existsSync(join(TARGET, "AGENTS.md"))) {
  report("skipped", "AGENTS.md (target already has one — left untouched)");
} else {
  linkOrCopy(join(GRUGOPS_SRC, "AGENTS.md"), join(TARGET, "AGENTS.md"), "AGENTS.md");
}

ensureBlock(join(TARGET, "CLAUDE.md"), CLAUDE_OPEN, CLAUDE_PTR, CLAUDE_CLOSE, "CLAUDE.md start-here pointer");
mergeGemini();
ensureBlock(
  join(TARGET, COPILOT_REL),
  COPILOT_OPEN,
  COPILOT_PTR,
  COPILOT_CLOSE,
  `${COPILOT_REL} (optional Copilot pointer)`,
);

console.log("\n-- notes --");
console.log("  Claude Code plugin form (colon commands /grugops:plan) installs separately:");
console.log("    /plugin marketplace add <owner>/grugops   (UNKNOWN - verify against current tool docs)");
console.log("    /plugin install grugops@grugops           (UNKNOWN - verify against current tool docs)");
console.log("  Safety: the mechanical prod-deploy guard is Claude-Code-only (plugin hooks/hooks.json).");
console.log("          The other four tools rely on the autonomy=pr procedural fallback. See install/README.md.");
console.log("  This installer NEVER sets the deploy-approval env var — only a human may approve a deploy.");

console.log(`\n== install complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);

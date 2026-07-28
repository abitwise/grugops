// generate-role-adapters.ts — grugops Claude Code sub-agent adapter generator (SPAWN-01, Phase 27).
//
// Reads the kit's role corpus (agent-factory/roles) and emits one thin-pointer adapter per role into
// .claude/agents/grugops-<role>.md. Sixteen of the seventeen adapters did not exist before this
// generator ran, and the one that did carried a hand-written seven-name spawn grant of which zero
// names resolved to a file. Adapters are therefore GENERATED, never hand-authored: the single
// upstream source for both body shapes and for the capability-to-tool vocabulary is
// agent-factory/packaging/subagent.frontmatter.md, and the role set comes from scripts/kit-model.ts —
// the same authority the KIT-03 referential-integrity oracle consumes, so the generator and the
// oracle can never disagree about what a role is.
//
// Mirrors the proven shape of scripts/generate-catalog.ts: fixed literal paths, zero-dependency
// frontmatter parse, section-body + first-sentence extraction, explicit sort before emit, provenance
// header, build-everything-then-write, single trailing newline, clear professional voice.
//
//   node scripts/generate-role-adapters.js   # exit 0 on success, 1 on any structural miss
//
// Read/write-only by construction (path-traversal mitigation, ASVS V12, T-27-28): ROLES_DIR and
// OUT_DIR are FIXED literal paths joined to the repo root (this script's parent). Neither is ever
// derived from argv, env, or file content, and the script accepts NO output flag — the adapters
// freshness gate mirrors the whole world into a temp tree rather than overriding a path, so a flag
// would break both the security posture and the gate.
//
// Fail closed (T-27-29 / T-27-32): every structural miss — an absent or empty `capabilities:` value,
// a capability token outside the closed vocabulary, a missing `## One job` or `## Activates when`
// section, a non-ASCII role filename, or two roles that would collide after prefixing — prints a
// finding naming the role file and exits 1 WITHOUT writing anything. The whole file set is built in
// memory first, so a partial or garbled adapter directory never ships. Moving these failures to the
// build is the point: an adapter whose `tools` resolve to nothing is refused by the platform at
// launch, which would otherwise land on a user's machine instead of in CI.
//
// Spawn posture (SPAWN-04 / T-27-27): exactly ONE adapter — the coordinator, identified by the role
// whose basename matches COORDINATOR_ROLE and never by a hard-coded adapter filename — carries the
// `coordinator: true` marker and an enumerated `Agent(...)` grant naming the other sixteen adapters
// in sorted order (17 minus itself, no exception list, both role tiers on the same footing). Every
// other adapter simply OMITS the spawn tool from its `tools` line, which is the vendor-documented
// path-independent way to stop a sub-agent from spawning.
//
// Node stdlib ONLY — node:fs + node:path, plus the in-repo kit-model module. Zero npm dependencies.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { listRoles } from "./kit-model.js";

// ── Fixed literal paths (never argv/env/content-derived — ASVS V12) ───────────────────────────
const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const OUT_DIR = join(ROOT, ".claude/agents");

// The agent namespace, and the ONE role stem that is the coordinator. The coordinator is located by
// ROLE basename, never by an adapter filename — a renamed adapter cannot silently become one.
const AGENT_PREFIX = "grugops-";
const COORDINATOR_ROLE = "orchestrator";

// ── Fail-closed helper (a structural miss is a finding, never an unhandled throw) ──────────────
const fail = (m: string): never => {
  console.error(`  ERROR    ${m}`);
  process.exit(1);
};

// ── Closed capability vocabulary → Claude Code tools (single-sourced from the packaging template)
// The ORDER of this array is the emission order, so a role declaring `shell read` and a role
// declaring `read shell` produce the identical `tools` line. Each tool is emitted once.
// `AskUserQuestion` is deliberately absent: it is unconditionally removed from every sub-agent, so
// no token may ever map to it.
const CAPABILITY_TOOLS: readonly { readonly token: string; readonly tools: readonly string[] }[] = [
  { token: "read", tools: ["Read", "Grep", "Glob"] },
  { token: "edit", tools: ["Edit", "Write"] },
  { token: "shell", tools: ["Bash"] },
  { token: "web", tools: ["WebFetch", "WebSearch"] },
  { token: "plan", tools: ["TodoWrite"] },
];
const VOCABULARY = CAPABILITY_TOOLS.map((c) => c.token);

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
// Splitting on a bare "." would truncate `AGENTS.md` (agents-md-scribe). `indexOf(". ") === -1`
// returns the line as-is — it already ends in `.`, so appending would produce `..`.
function firstSentence(body: string): string {
  const line = body.trim().split("\n")[0].trim();
  const dot = line.indexOf(". ");
  return dot === -1 ? line : line.slice(0, dot + 1);
}

// ── Extract the body of a `## <heading>` section (up to the next `## ` or end of file) ─────────
// The lookahead's second branch is `$(?![\s\S])` — true end-of-input, NOT end-of-line, so a
// last-in-file section is not truncated to its first line under the `/m` flag.
function sectionBody(text: string, heading: string): string | null {
  const re = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=\\n## |$(?![\\s\\S]))`, "m");
  const m = text.match(re);
  return m ? m[1] : null;
}

// ── YAML double-quoted scalar ─────────────────────────────────────────────────────────────────
// `description` is DERIVED from authored role prose, and that prose legitimately contains `: `
// (`routing matrix: "Need AGENTS.md"`, `the triggers: authentication`) — and the composed value
// always contains the literal `Use when: `. A plain YAML scalar may not contain a colon-space, so an
// unquoted emission produces an adapter whose frontmatter does not parse and which the platform
// refuses to load. Emitting a double-quoted scalar with `\` and `"` escaped is unconditional rather
// than conditional: a rule that only fires on some inputs is a rule that rots on the next edit.
function yamlQuote(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// ── The resolver block (D-06) — byte-identical in all 17 adapters ─────────────────────────────
// Line 1 is the installer's materialization slot (install/install.ts MAT_SLOT): the installer writes
// the absolute kit path ABOVE it, so every adapter has a target to inject into. Carrying this line
// is also what makes an adapter a legal site for the kit-root environment variable under
// check-kit-refs Assertion 3 — the predicate is two-sided, so the slot and the variable travel
// together or the gate fails red.
const INVARIANT =
  "> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)";

const RESOLVER: readonly string[] = [
  "Resolve the kit root (this adapter is the sole resolver):",
  "",
  "```sh",
  "# 1. (installed) the absolute kit path the installer wrote above this line.",
  "# 2. if absent, self-heal:",
  'KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"',
  '# 3. if "$KIT" still does not exist: STOP. Print:',
  '#    "grugops kit not found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit."',
  "#    Do NOT hunt the repo for agent-factory/… .",
  "```",
];

const HARD_LIMIT =
  "Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.";

const PROVENANCE =
  "<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-role-adapters.js -->";

// ── A resolved role, ready to emit ────────────────────────────────────────────────────────────
interface Adapter {
  file: string; // role filename, e.g. orchestrator.md
  stem: string; // orchestrator
  name: string; // grugops-orchestrator
  description: string;
  tools: string[];
  isCoordinator: boolean;
}

// ── Read the role corpus through the SHARED authority (never a private readdir) ────────────────
let roleFiles: string[];
try {
  roleFiles = listRoles(ROOT);
} catch (e) {
  fail(`${(e as Error).message}`);
}
roleFiles = roleFiles!.slice().sort(); // explicit sort before emit (kit-model already sorts)

const adapters: Adapter[] = [];
const seenNames = new Map<string, string>(); // adapter name -> the role file that claimed it

for (const file of roleFiles) {
  // Encoding gate: adapter names are compared by exact string equality by the KIT-03 oracle, and the
  // freshness gate compares BYTES. A non-ASCII filename introduces normalisation ambiguity into
  // both, so it is refused here rather than left latent.
  // eslint-disable-next-line no-control-regex
  if (/[^\x00-\x7F]/.test(file)) {
    fail(
      `${file}: non-ASCII byte in a role filename — adapter names are compared by exact string equality and written as bytes; rename the role file to ASCII`,
    );
  }

  const path = join(ROLES_DIR, file);
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`cannot read role file: ${path}`);
  }

  const stem = file.replace(/\.md$/, "");
  const name = `${AGENT_PREFIX}${stem}`;
  const claimed = seenNames.get(name);
  if (claimed !== undefined) {
    fail(
      `${file}: adapter name "${name}" collides with the one already produced by ${claimed} — two roles cannot share one adapter file`,
    );
  }
  seenNames.set(name, file);

  // Capabilities → tools, validated against the closed vocabulary at BUILD time (T-27-29).
  const fm = parseFrontmatter(text!);
  const rawCaps = (fm.capabilities ?? "").trim();
  if (rawCaps === "") {
    fail(
      `${file}: \`capabilities:\` is absent or empty — an adapter whose \`tools\` resolve to nothing is refused by the platform at launch; declare at least one of: ${VOCABULARY.join(", ")}`,
    );
  }
  const tokens = rawCaps.split(/\s+/).filter((t) => t !== "");
  for (const t of tokens) {
    if (!VOCABULARY.includes(t)) {
      fail(
        `${file}: capability token "${t}" is outside the closed vocabulary (${VOCABULARY.join(", ")}) — see agent-factory/packaging/subagent.frontmatter.md`,
      );
    }
  }
  // Emit in VOCABULARY order, each tool once — declaration order in the role cannot change the bytes.
  const tools: string[] = [];
  for (const cap of CAPABILITY_TOOLS) {
    if (!tokens.includes(cap.token)) continue;
    for (const tool of cap.tools) if (!tools.includes(tool)) tools.push(tool);
  }

  // Description derivation (D-12): the role's `## One job` first sentence plus its
  // `## Activates when` line. Both sections already exist in all 17 roles and the activates-when
  // line is already phrased as a routing trigger, so this is derivation, not authoring — editing the
  // role updates the adapter and there is nothing to keep in sync by hand.
  const job = sectionBody(text!, "One job");
  if (job === null || job.trim() === "") {
    fail(
      `${file}: no \`## One job\` section — refusing to emit an adapter with an empty description (\`description\` drives auto-routing)`,
    );
  }
  const act = sectionBody(text!, "Activates when");
  if (act === null || act.trim() === "") {
    fail(
      `${file}: no \`## Activates when\` section — refusing to emit an adapter with no use-when clause (\`description\` drives auto-routing)`,
    );
  }
  const description = `${firstSentence(job!)} Use when: ${firstSentence(act!)}`;

  adapters.push({
    file,
    stem,
    name,
    description,
    tools,
    isCoordinator: stem === COORDINATOR_ROLE,
  });
}

// ── Coordinator cardinality: exactly one, located by ROLE basename (never a filename) ─────────
const coordinators = adapters.filter((a) => a.isCoordinator);
if (coordinators.length !== 1) {
  fail(
    `expected exactly one role whose basename is "${COORDINATOR_ROLE}.md" in ${ROLES_DIR}, found ${coordinators.length}${coordinators.length > 0 ? `: ${coordinators.map((c) => c.file).join(", ")}` : " — a zero-coordinator kit has no adapter that may hold the spawn grant"}`,
  );
}
const coordinator = coordinators[0];

// The enumerated grant: every adapter name except the coordinator's own, sorted (D-09). No exception
// list, and no tier filter — capability is not policy (D-10), so the five enterprise-tier roles sit
// in the grant on the same footing as the twelve core-tier ones.
const grant = adapters
  .filter((a) => !a.isCoordinator)
  .map((a) => a.name)
  .sort();

// ── Body composition (single-sourced from agent-factory/packaging/subagent.frontmatter.md) ────
function specialistBody(a: Adapter): string[] {
  return [
    PROVENANCE,
    "",
    INVARIANT,
    "",
    ...RESOLVER,
    "",
    `Read \`agent-factory/roles/${a.file}\` now and act as that role. The role file does the`,
    "thinking; this adapter only points at it.",
    "",
    "Publish your typed notes per `agent-factory/workflows/16-context-read-write.md`. The shared verified context is the only memory — read what earlier roles published, publish your own, and expect nothing to have been passed to you by whoever activated you.",
    "",
    "Never merge to a protected branch. Never deploy to prod. Humans always hold merge and",
    "deploy.",
  ];
}

function coordinatorBody(a: Adapter): string[] {
  return [
    PROVENANCE,
    "",
    INVARIANT,
    "",
    ...RESOLVER,
    "",
    `Read \`agent-factory/roles/${a.file}\` now, then \`.grugops/factory.config.json\`, the root`,
    "`AGENTS.md` and `plans/board.md` (respect every WIP limit), and act as that role.",
    "",
    "Require typed notes per Workflow 16. The shared verified context is the only memory — never relay data between agents.",
    "",
    "**Announce your tier before scheduling.** Pick it by whether the `Agent` tool is available to",
    "you — capability-sensing, never a host name or version. Never spawn under an allowlist the",
    "runtime ignores, and never claim an enforcement you lack.",
    "",
    "- **Full** — started with `claude --agent grugops-orchestrator`: this agent is the main",
    "  thread. Schedule in parallel to `queue.wip_limit`; the enumerated grant above **is**",
    "  runtime-enforced, on this path only.",
    "- **Reduced** — `Agent` is available but the session is a default main thread, what `/grug`",
    "  gets. Schedule in parallel to the same cap. The grant is **not** runtime-enforced here —",
    "  this session's agent declares no allowlist. Say so, and stay inside it by instruction.",
    "- **Degraded** — `Agent` is absent (the four non-Claude-Code CLIs, or a sub-agent at the",
    "  nesting limit). Drain the same queue at concurrency one via",
    "  `agent-factory/roles/_role-switch-protocol.md` — one window, prior context dropped between",
    "  roles — and announce it.",
    "",
    HARD_LIMIT,
  ];
}

function render(a: Adapter): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`name: ${a.name}`);
  lines.push(`description: ${yamlQuote(a.description)}`);
  if (a.isCoordinator) lines.push("coordinator: true");
  const toolLine = a.isCoordinator
    ? `Agent(${grant.join(", ")}), ${a.tools.join(", ")}`
    : a.tools.join(", ");
  lines.push(`tools: ${toolLine}`);
  lines.push("model: inherit");
  lines.push("---");
  lines.push(...(a.isCoordinator ? coordinatorBody(a) : specialistBody(a)));
  lines.push(""); // trailing element → exactly one final "\n"
  return lines.join("\n");
}

// ── Build EVERYTHING, then write (T-27-32: a structural miss never leaves a partial artifact) ──
const rendered = adapters.map((a) => ({
  path: join(OUT_DIR, `${a.name}.md`),
  body: render(a),
}));

try {
  mkdirSync(OUT_DIR, { recursive: true });
} catch {
  fail(`cannot create the adapter directory: ${OUT_DIR}`);
}
for (const r of rendered) {
  writeFileSync(r.path, r.body, "utf8");
}

console.log(
  `generate-role-adapters: wrote ${rendered.length} adapters to ${OUT_DIR} (coordinator ${coordinator.name} grants ${grant.length} names)`,
);
process.exit(0);

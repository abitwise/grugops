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
// Mirrors the proven shape of scripts/generate-catalog.ts: fixed literal paths, section-body +
// first-sentence extraction, explicit sort before emit, provenance header,
// build-everything-then-write, single trailing newline, clear professional voice.
//
// THE FRONTMATTER GRAMMAR IS scripts/frontmatter.ts, AND THERE IS NO SECOND ONE IN THIS FILE.
// This file used to carry its own eight-line `parseFrontmatter`, and that duplicate is what finding
// WR-03 named: `frontmatter.ts` declares itself "the single authority for what does this file's
// frontmatter SAY", and this module — the one that COMPOSES THE SHIPPED `tools:` LINE, i.e. the spawn
// grant itself — answered the same question with a weaker grammar that nothing tested. Three concrete
// divergences were REMOVED with it, and two of them were NOT the harmless fail-closed cases the
// finding expected (measured against the pre-change committed .js, on a scratch mirror):
//
//   1. Key charset. The local `[A-Za-z_]+` excluded digits and hyphens; the authority's `KEY_LINE`
//      accepts YAML's own `[A-Za-z_][A-Za-z0-9_-]*`.
//   2. `capabilities:read edit shell` — a colon with NO following space. The local `\s*` matched zero
//      whitespace and read the value happily; YAML calls that a plain scalar, not a mapping entry, so
//      the platform sees no `capabilities` key there and the authority deliberately refuses the line.
//      The pre-change generator EMITTED `tools: Read, Grep, Glob, Edit, Write, Bash` from it and
//      exited 0. That is a shipped spawn-posture line derived from a key the platform would not read.
//   3. A DUPLICATE `capabilities:` key. The local map silently kept the LAST value — two keys,
//      `read` then `shell`, shipped `tools: Bash` and exited 0. The authority retains EVERY
//      occurrence precisely because discarding one is the bypass shape this project refuses, so a
//      count other than exactly one is now a refusal that names the count.
//
// A fourth divergence was a mis-blamed finding rather than a bypass: an unterminated frontmatter
// block made the local parser return an EMPTY map, so the generator reported "`capabilities:` is
// absent or empty" about a file whose frontmatter could not be read at all. Those are different facts
// and only one of them is actionable; the authority's `ok: false` arm is now branched on explicitly
// and reported as unreadable.
//
// The remedy for two answers to one predicate in this project is to DELETE the second grammar, never
// to teach it an extra case — a weaker second opinion that still votes is worse than none. So the
// local function is gone rather than renamed, commented out or flag-guarded.
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
// THE EMITTED `model:` VALUE COMES FROM scripts/model-tiers.ts, NOT FROM A LITERAL HERE (MODEL-01 /
// MODEL-02, phase 29.1). Three things about that are load-bearing:
//
//   1. THE RESOLUTION HAPPENS ONCE, AT TOP LEVEL, BEFORE the build-everything loop — never inside
//      render(). render() runs INSIDE that loop, so a refusal raised there would abort partway
//      through building and leave the writes that had already been decided, which is exactly the
//      partial-artifact failure T-27-32 exists to prevent. Resolving first keeps the all-or-nothing
//      posture: a refusal reaches `fail` before a single byte is written.
//   2. THE REFUSAL GOES THROUGH `fail`, not through a bare process.exit. `fail`'s variable-level
//      `(m: string) => never` annotation is what lets TypeScript narrow the control flow afterwards,
//      which is the same reason the frontmatter parse branch below reads the success arm without a
//      cast.
//   3. THE ZERO-CONFIG ANSWER IS THE SAME SEVEN BYTES THE LITERAL PRODUCED. With no configuration
//      anywhere the resolver returns `inherit` for every role, so the emitted line and its position
//      are byte-identical to the pre-phase tree — asserted against a FROZEN commit by
//      scripts/adapter-byte-baseline.test.ts, because this file's own freshness gate regenerates
//      both sides from this same generator and therefore cannot decide that question.
//
// Node stdlib ONLY — node:fs + node:path, plus the in-repo kit-model, frontmatter and model-tiers
// modules. The claim still holds after WR-03 and after this phase: `frontmatter.ts` has no imports
// at all, `kit-model.ts` imports only node:fs + node:path, and `model-tiers.ts` imports only
// `kit-model.ts` — so reading through the authorities adds no dependency and no npm package. Zero
// npm dependencies. NOTE for anyone editing this import list: scripts/adapters-freshness.ts mirrors
// this module's import CLOSURE by hand, and a new import must be added to that list in the same
// change or its mirrored generator cannot resolve it.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { listRoles, INVARIANT, RESOLVER } from "./kit-model.js";
import {
  parseFrontmatter,
  sectionEndIndex,
  unfencedHeadingIndex,
} from "./frontmatter.js";
import { resolveModels, type ModelAlias } from "./model-tiers.js";

// ── Fixed literal paths (never argv/env/content-derived — ASVS V12) ───────────────────────────
const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const OUT_DIR = join(ROOT, ".claude/agents");

// The agent namespace, and the ONE role stem that is the coordinator. The coordinator is located by
// ROLE basename, never by an adapter filename — a renamed adapter cannot silently become one.
const AGENT_PREFIX = "grugops-";
const COORDINATOR_ROLE = "orchestrator";

// ── Fail-closed helper (a structural miss is a finding, never an unhandled throw) ──────────────
// The VARIABLE carries the `=> never` annotation, not just the arrow: TypeScript only lets a
// never-returning call narrow control flow when the callee is a function declaration or a const with
// an explicit type annotation. That narrowing is what lets the parse-failure branch below read the
// authority's success arm without a cast, instead of a redundant second `ok` test that would read as
// a fallback for a state that cannot be reached.
const fail: (m: string) => never = (m: string): never => {
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

// ── First-sentence summary: split on ". " (period-SPACE), KEEP its period, never re-append ────
// Splitting on a bare "." would truncate `AGENTS.md` (agents-md-scribe). `indexOf(". ") === -1`
// returns the line as-is — it already ends in `.`, so appending would produce `..`.
function firstSentence(body: string): string {
  const line = body.trim().split("\n")[0].trim();
  const dot = line.indexOf(". ");
  return dot === -1 ? line : line.slice(0, dot + 1);
}

// ── The body of a `## <heading>` section — ASKED, never answered here ──────────────────────────
// THE SECTION-EXTENT GRAMMAR IS scripts/frontmatter.ts, AND THERE IS NO SECOND ONE IN THIS FILE —
// the same sentence the header already makes about the FRONTMATTER grammar, now true of the other
// question this module used to answer privately.
//
// WHAT WAS DELETED HERE AND WHY (plan 29-35, LANG-07 / 29-REVIEW § WR-08). This function built a
// private `new RegExp` lookahead over the whole document, byte-for-byte identical to the copy in
// scripts/generate-catalog.ts — a THIRD grammar over bytes this tree has ONE parser for. It
// disagreed with the authority on two axes. FENCE-BLIND: a `## ` line quoted inside a fenced example
// terminated the capture early. LEVEL-BLIND: its terminator named level TWO only, so a level-ONE
// heading did not close the section and the capture ran on into the next top-level section — the
// identical defect scripts/voice-model.ts shipped at exit 0, which cost this phase plan 29-14 (the
// half-fix) and plan 29-20 (the correction). Per D-24 the remedy is DELETION, never an extra case:
// a widened third copy is still a third copy, exactly as the header argues for the frontmatter half.
//
// THE STAKES HERE ARE HIGHER THAN A DOCS TABLE. This capture becomes the adapter `description` — the
// `One job` sentence and the `Use when:` clause — and `description` DRIVES AUTO-ROUTING. A truncated
// or over-long capture silently changes which agent a request routes to, and `npm run
// freshness:adapters` would then require the wrong bytes to be committed.
//
// THE `-1` ANSWER IS LEGAL, AND IT IS NOT AN INDEX. It means "this document carries no such unfenced
// line", and it is handed back as `null` — the value both call sites already read as "section
// absent", so no caller changed. It is never defaulted to zero, never clamped with `Math.max`, and
// never swapped for another sentinel: `-1 + 1` is `0`, i.e. "from the top of the document".
//
// THESE FIVE LINES ARE IDENTICAL TO scripts/generate-catalog.ts's, AND THAT IS DELIBERATE — the
// reason is written at BOTH sites so a later reader does not merge them or duplicate them again. A
// shared wrapper would need a NEW module: both generators are top-level script code that writes
// files the moment it is imported, so neither may import the other, and adding a third exported name
// to frontmatter.ts would give one question a second name inside its own authority. Composing two
// exported authority functions at the point of use is not a duplicated grammar — it is two callers
// asking the same parser. Keep the two bodies in step; do not promote them to a fourth name.
function sectionBody(text: string, heading: string): string | null {
  const at = unfencedHeadingIndex(text, `## ${heading}`);
  if (at === -1) return null;
  const end = sectionEndIndex(text, at + 1, 2);
  return text.split("\n").slice(at + 1, end).join("\n");
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

// ── The invariant blockquote and the resolver block (D-06) ────────────────────────────────────
// Both are IMPORTED from scripts/kit-model.ts (plan 27-64, D-64 Part B) and are no longer declared
// here. They used to be private constants in this file, which made them unreachable by any second
// generator: this module is top-level script code that writes seventeen files when imported, so a
// consumer could only have RETYPED the text. A second copy of ten lines of shell and a 400-byte
// blockquote is the hand-maintained-literal drift class this phase exists to close, and
// scripts/generate-skill-twins.ts needs both blocks — the resolver to insert into the root skill
// twin, the invariant to LOCATE the insertion point.
//
// The move was proven behavior-preserving before anything depended on it: `npm run
// freshness:adapters` regenerated all seventeen adapters into a temp mirror and byte-compared them
// against the committed ones, exiting 0.
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
  readonly model: ModelAlias; // the resolved alias, emitted verbatim — never a literal in render()
}

// THE ONE RULE FOR "what is this role file's stem". Asked by the model resolution below and by the
// build loop; declared here so the key a map is built with and the key it is read with cannot come
// apart. A role filename is `.md` by listRoles' own filter, so the suffix is always present.
const stemOf = (file: string): string => file.replace(/\.md$/, "");

// ── Read the role corpus through the SHARED authority (never a private readdir) ────────────────
let roleFiles: string[];
try {
  roleFiles = listRoles(ROOT);
} catch (e) {
  fail(`${(e as Error).message}`);
}
roleFiles = roleFiles!.slice().sort(); // explicit sort before emit (kit-model already sorts)

// ── Resolve every role's model alias ONCE, here, BEFORE anything is built ──────────────────────
// Placed at top level rather than inside render() for the T-27-32 reason recorded in the module
// header: render() runs inside the build-everything loop, so a refusal raised there would abort
// partway through and could leave a partial adapter directory. Refusing here writes nothing at all.
//
// THIS INTRODUCES NO NEW ORDERING AUTHORITY. `roleFiles.slice().sort()` above remains the only sort
// before emit; the resolved map is consumed by STEM LOOKUP below, never by iteration, so its own
// insertion order cannot reach an emitted file.
//
// AND NO SECOND STEM RULE. `stemOf` is declared once and asked twice — here, to key the resolution,
// and in the build loop below. Two expressions for "the role's stem" is one expression too many:
// the map is keyed by one of them and read by the other, so a disagreement would surface as a
// lookup that quietly found nothing rather than as an error.
const resolution = resolveModels(roleFiles.map(stemOf));
if (!resolution.ok) fail(resolution.reason);
const models = resolution.value;

const adapters: Adapter[] = [];
// Adapter name FOLDED TO LOWER CASE -> the role file that claimed it. The fold is the whole point:
// two roles whose adapter names differ only by case are distinct files on a case-sensitive
// filesystem and the SAME file on a case-insensitive one (APFS, NTFS), where the second write
// silently destroys the first and the adapter directory comes up one short with no error anywhere.
// grugops ships to Windows, so a role set that is only portable to Linux is refused on every
// platform — including the Linux machine that would otherwise commit it happily.
const seenNames = new Map<string, string>();

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

  const stem = stemOf(file);
  const name = `${AGENT_PREFIX}${stem}`;
  const folded = name.toLowerCase();
  const claimed = seenNames.get(folded);
  if (claimed !== undefined) {
    fail(
      `${file}: adapter name "${name}" collides with the one produced by ${claimed} — two roles cannot share one adapter file (names are compared case-insensitively: on a case-insensitive filesystem the second adapter silently overwrites the first)`,
    );
  }
  seenNames.set(folded, file);

  // Capabilities → tools, read through the ONE frontmatter authority (WR-03) and validated against
  // the closed vocabulary at BUILD time (T-27-29). Three distinct facts, three distinct findings:
  // an unreadable role file, a role with no capabilities key, and a role declaring the key twice are
  // not the same problem and must not print the same sentence.
  const parsed = parseFrontmatter(text!);
  if (!parsed.ok) {
    // A PARSE FAILURE IS A PARSE ARTIFACT, NEVER A VERDICT (frontmatter.ts header). An unreadable
    // role file is a different fact from a role with no capabilities, and the deleted grammar
    // conflated them: it returned an empty map on an unterminated block, so this generator blamed a
    // missing `capabilities:` key on a file whose frontmatter could not be read at all.
    fail(`${file}: frontmatter is unreadable — ${parsed.reason}`);
  }
  const caps = parsed.value.get("capabilities") ?? [];
  if (caps.length === 0) {
    fail(
      `${file}: no \`capabilities:\` key in the role frontmatter — an adapter whose \`tools\` resolve to nothing is refused by the platform at launch; declare at least one of: ${VOCABULARY.join(", ")}`,
    );
  }
  if (caps.length > 1) {
    // The authority retains EVERY occurrence of a key. Picking one here would re-introduce the
    // last-wins reading the deleted grammar had, and a `capabilities:` declaration that is silently
    // discarded is the bypass shape this project refuses. The count is named so the author can see
    // how many were found rather than being told to look for "a duplicate" that may be three.
    fail(
      `${file}: ${caps.length} \`capabilities:\` keys in one role frontmatter, expected exactly 1 — every occurrence is retained rather than last-wins, because silently discarding a declaration is a bypass; delete the extra key`,
    );
  }
  const rawCaps = caps[0].trim();
  if (rawCaps === "") {
    // Wording retained VERBATIM from before the WR-03 switch: a committed refusal case pins this
    // string, and the empty-value fact has not changed. The "absent" half of the sentence is now
    // covered by its own finding above; this arm is reached only by a key that is present and empty.
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

  // The resolved alias, by STEM LOOKUP rather than by iterating the map — the map's own order is
  // then irrelevant to the emitted bytes. A miss is impossible by construction (the resolution was
  // taken over the very set this loop walks) and is still refused BY NAME rather than emitted as an
  // `undefined` that would reach the frontmatter as the four bytes of a broken adapter.
  const model = models.get(stem);
  if (model === undefined) {
    fail(
      `${file}: no model alias resolved for the role stem "${stem}" — the resolution was taken over the same role set this loop walks, so a miss means the two derivations have come apart`,
    );
  }

  adapters.push({
    file,
    stem,
    name,
    description,
    tools,
    isCoordinator: stem === COORDINATOR_ROLE,
    model,
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
    "- **Reduced** — `Agent` is available but the session is a default main thread, what `/grugops`",
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
  // The RESOLVED alias, read off the field. Same slot the literal occupied — directly after `tools:`
  // and immediately before the closing delimiter — so the byte layout is untouched, and no
  // normalization, trimming or String() of a boxed value sits between the resolution and the bytes.
  lines.push(`model: ${a.model}`);
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

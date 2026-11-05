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
// THE `models` CONFIGURATION IS READ AGAINST THE SAME FIXED ROOT, AND NO CONFIG VALUE EVER REACHES A
// PATH (plan 29.1-03, ASVS V12, T-29.1-01). `readModelsConfig` is handed the same `ROOT` constant
// below — `join(import.meta.dirname, "..")`, with no argv override and no environment override — so
// a run inside a hermetic mirror reads that mirror's configuration and nothing else. The block it
// returns is a preset NAME compared by exact equality against a closed two-member set, and a sparse
// map of role stems to aliases whose every KEY is compared against the stem set derived from the
// role-set authority BEFORE it is used anywhere. Nothing read from that file is joined onto a path,
// interpolated into a path, or used to select one. `OUT_DIR` remains a fixed literal joined to
// `ROOT`, this script still accepts NO output flag, and the emitted alias can only ever be one of
// the four members of the closed vocabulary — which is what keeps a YAML-significant byte out of
// the frontmatter this generator writes.
//
// EVERY SUCCESSFUL RUN ANNOUNCES BOTH ITS PRESET INPUT AND ITS RESOLUTION OUTPUT, on stdout, using
// the shared grammars in scripts/model-tiers.ts (`resolvedPresetLine` and `resolvedAssignmentLine`).
// The lines exist so that a CALLER can OBSERVE which resolution a run used rather than infer it from
// the tree afterwards. Their first consumer is scripts/adapters-freshness.ts, which regenerates the
// adapters inside a temp mirror and must know that the mirrored run resolved the zero-config answer:
// that gate's D-04 claim rested until plan 29.1-03 on the mere ABSENCE of a configuration directory
// from its hand-written twin list, and absence is not a pin — an added directory would have made the
// gate config-dependent while everything stayed green.
//
// ANNOUNCING THE PRESET ALONE WAS HALF THE ANSWER (finding CR-01, plan 29.1-07). `resolveModels`
// takes TWO inputs, a preset AND a sparse override map, so a run under a `models.roles` block with
// no `preset` key truthfully announced `none` while emitting adapters that were not the zero-config
// output — and the freshness gate certified it and exited 0. The second line therefore describes
// what the resolution PRODUCED: its member count, its override count and its distinct aliases.
//
// Neither marker is spelled here: each emitter and its reader share one declaration, because a
// hand-copied marker rots apart silently and a reader that stops finding the line is the failure
// mode itself.
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
import { listAgentAdapterSpecs, INVARIANT, RESOLVER, type AgentAdapterSpec } from "./kit-model.js";
import {
  parseFrontmatter,
  sectionEndIndex,
  unfencedHeadingIndex,
} from "./frontmatter.js";
import {
  configKeyStems,
  readModelsConfig,
  resolveAdapterAssignments,
  resolvedAssignmentLine,
  resolvedEffortAssignmentLine,
  resolvedEffortPresetLine,
  resolvedPresetLine,
  type EffortLevel,
  type ModelAlias,
} from "./model-tiers.js";

// ── Fixed literal paths (never argv/env/content-derived — ASVS V12) ───────────────────────────
const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const OUT_DIR = join(ROOT, ".claude/agents");

// The ONE role stem that is the coordinator. The coordinator is located by ROLE basename, never by an
// adapter filename — a renamed adapter cannot silently become one. The agent namespace is not
// declared here (plan 39-02): every adapter name arrives already built from
// scripts/kit-model.ts's listAgentAdapterSpecs, the one place an adapter name is made from a stem.
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
//
// THE `admit` TOKEN (plan 33-28, WINDOWS.md row 255, 33-DIAGNOSIS § 1.3 (i)). On the `--agent`
// path the coordinator's session tool list IS this adapter's `tools:` line — the round-1 init frame
// B:11 listed exactly the seven tools the line then carried — so the plugin's MCP admission tool
// was absent by construction of the grant, and the coordinator could not propose a note through the
// sanctioned writer on the spawn path. The token exists so the coordinator's grant carries that
// route, through this generator and never by a hand edit of the generated adapter. No other role
// declares it: nested role sessions do not receive plugin MCP tools at all (A:784 — "No such tool
// available ... does not offer this tool here") and write notes with `tools/grugops/note.js`
// (phase 41 D-35).
const CAPABILITY_TOOLS: readonly { readonly token: string; readonly tools: readonly string[] }[] = [
  { token: "read", tools: ["Read", "Grep", "Glob"] },
  { token: "edit", tools: ["Edit", "Write"] },
  { token: "shell", tools: ["Bash"] },
  { token: "web", tools: ["WebFetch", "WebSearch"] },
  { token: "plan", tools: ["TodoWrite"] },
  // The spelling is the platform's SCOPED name for the plugin's bundled server — plugin `grugops`
  // (.claude-plugin/plugin.json `name`), server key `grugops` (its `mcpServers.grugops`), tool
  // `propose_note` — the one the round-1 init frame listed (A:11). The bare `mcp__grugops__propose_note`
  // is the server's OWN name and is exposed only if a standalone `.mcp.json` server is ever shipped,
  // which the kit does not do today. Emitted LAST: the built-ins keep the order the table above had.
  { token: "admit", tools: ["mcp__plugin_grugops_grugops__propose_note"] },
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

// ── A resolved adapter, ready to emit ─────────────────────────────────────────────────────────
// One entry per AgentAdapterSpec (plan 39-02, D-13): a role with no `levels` key yields one entry,
// a role declaring levels yields one entry per level and no base entry.
interface Adapter {
  file: string; // role filename, e.g. orchestrator.md
  stem: string; // the ADAPTER stem, e.g. orchestrator or software-engineer-junior
  name: string; // grugops-orchestrator, as listAgentAdapterSpecs built it
  // The level this adapter works at, or null for a role that declares no levels (plan 39-02).
  readonly level: string | null;
  description: string;
  tools: string[];
  isCoordinator: boolean;
  readonly model: ModelAlias; // the resolved alias, emitted verbatim — never a literal in render()
  // The resolved reasoning-effort level (plan 34-01). `inherit` is emitted as NO line at all (D-06).
  readonly effort: EffortLevel;
}

// ── Read the adapter set through the SHARED derivation (never a private readdir) ───────────────
// listAgentAdapterSpecs (scripts/kit-model.ts) is the one answer to "which adapters does the role
// corpus imply": it reads every role's `levels` key and throws, naming the role file, on a malformed
// declaration or a case-folded name collision. A throw is a finding here, never an unhandled crash.
let specs: AgentAdapterSpec[];
try {
  specs = listAgentAdapterSpecs(ROOT);
} catch (e) {
  fail(`${(e as Error).message}`);
}

// ── Resolve every adapter's model alias and effort level ONCE, here, BEFORE anything is built ──
// Placed at top level rather than inside render() for the T-27-32 reason recorded in the module
// header: render() runs inside the build-everything loop, so a refusal raised there would abort
// partway through and could leave a partial adapter directory. Refusing here writes nothing at all.
//
// THIS INTRODUCES NO NEW ORDERING AUTHORITY. The resolved maps are consumed by ADAPTER-STEM LOOKUP
// below, never by iteration, so their own order cannot reach an emitted file.
//
// TWO REFUSALS, IN ORDER, BOTH ABOVE THE LOOP. `readModelsConfig` decides whether the user's file is
// legal at all — an unknown preset name, an unknown role or level key, an alias outside the closed
// set, a degenerate `models` value — against the key set configKeyStems derives from the specs
// (D-15). `resolveAdapterAssignments` then decides whether the legal block can be applied to this
// tree's adapters: non-level adapters through the presets, level adapters through
// `roles[<role>-<level>]`, then `roles[<role>]`, then the LEVELS pin (D-14, D-16). Each returns a
// VERDICT rather than throwing, and each verdict travels straight to `fail`, so a refusal from either
// is exit 1 with nothing written and no output directory created.
const config = readModelsConfig(ROOT, configKeyStems(specs!));
if (!config.ok) fail(config.reason);
const modelsConfig = config.value;

const assignmentResolution = resolveAdapterAssignments(specs!, modelsConfig);
if (!assignmentResolution.ok) fail(assignmentResolution.reason);
const models = assignmentResolution.value.models;
const efforts = assignmentResolution.value.efforts;

const adapters: Adapter[] = [];
// Adapter name FOLDED TO LOWER CASE -> the role file that claimed it. The fold is the whole point:
// two adapters whose names differ only by case are distinct files on a case-sensitive filesystem and
// the SAME file on a case-insensitive one (APFS, NTFS), where the second write silently destroys the
// first and the adapter directory comes up one short with no error anywhere. grugops ships to
// Windows, so a role set that is only portable to Linux is refused on every platform. The derivation
// already refuses this; the check stays here so the generator does not rest its writes on it.
const seenNames = new Map<string, string>();

// The specs grouped by role file, in sorted role-file order, so each role file is read once.
const specsByFile = new Map<string, AgentAdapterSpec[]>();
for (const spec of specs!) {
  const group = specsByFile.get(spec.roleFile);
  if (group === undefined) specsByFile.set(spec.roleFile, [spec]);
  else group.push(spec);
}
const roleFiles = [...specsByFile.keys()].sort();

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
  // `## Activates when` line. Both sections already exist in every role and the activates-when
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
  const baseDescription = `${firstSentence(job!)} Use when: ${firstSentence(act!)}`;

  for (const spec of specsByFile.get(file) ?? []) {
    const isCoordinator = spec.roleStem === COORDINATOR_ROLE;
    // The grant and `coordinator: true` belong to exactly ONE adapter. A leveled coordinator would
    // turn that one adapter into several, each holding the spawn grant, so it is refused by file.
    if (isCoordinator && spec.level !== null) {
      fail(
        `${file}: the coordinator role declares \`levels\` — refusing, because the enumerated spawn grant and \`coordinator: true\` belong to exactly one adapter, and a leveled coordinator would emit one per level. Remedy: remove the \`levels\` key from ${file}.`,
      );
    }

    const folded = spec.name.toLowerCase();
    const claimed = seenNames.get(folded);
    if (claimed !== undefined) {
      fail(
        `${file}: adapter name "${spec.name}" collides with the one produced by ${claimed} — two adapters cannot share one file (names are compared case-insensitively: on a case-insensitive filesystem the second adapter silently overwrites the first)`,
      );
    }
    seenNames.set(folded, file);

    // The resolved alias and effort, by ADAPTER-STEM LOOKUP rather than by iterating the maps — the
    // maps' own order is then irrelevant to the emitted bytes. A miss is impossible by construction
    // (the resolution was taken over the very specs this loop walks) and is still refused BY NAME
    // rather than emitted as an `undefined` that would reach the frontmatter as a broken adapter.
    const model = models.get(spec.adapterStem);
    if (model === undefined) {
      fail(
        `${file}: no model alias resolved for the adapter stem "${spec.adapterStem}" — the resolution was taken over the same adapter specs this loop walks, so a miss means the two derivations have come apart`,
      );
    }
    const effort = efforts.get(spec.adapterStem);
    if (effort === undefined) {
      fail(
        `${file}: no effort level resolved for the adapter stem "${spec.adapterStem}" — the resolution was taken over the same adapter specs this loop walks, so a miss means the two derivations have come apart`,
      );
    }

    adapters.push({
      file,
      stem: spec.adapterStem,
      name: spec.name,
      level: spec.level,
      // A level adapter says its level in the routing text, so the coordinator and a reader can tell
      // the three engineer adapters apart from the description alone. Its use-when clause names the
      // adapter itself in place of the role's `## Activates when` line (WR-03, gap plan 39-11):
      // `description` drives Claude Code's auto-delegation, and the role's own trigger let a main
      // thread route unscored code work to the haiku adapter. A level adapter is used only when the
      // Tech Lead's plan names it; a role with no levels keeps `baseDescription` exactly.
      description:
        spec.level === null
          ? baseDescription
          : `${firstSentence(job!)} Use when: the Tech Lead's plan names ${spec.name}; never for unscored work. Level: ${spec.level}.`,
      tools,
      isCoordinator,
      model,
      effort,
    });
  }
}

// Byte order, never locale order, and never the order `levels` tokens were declared in: the
// adapter list, and the grant read off it, are sorted by name (TIER-02).
adapters.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

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
    // Every level adapter carries one senior line and names no level (Phase 41 D-31, which revises
    // Phase 39 D-13). The tier lives in the adapter name, `model` and `effort`; `## Levels` sends the
    // engineer to the plan that names it.
    ...(a.level === null
      ? []
      : [
          "",
          "Work at senior level: read the `## Levels` section of that role file.",
        ]),
    "",
    "Publish your typed notes per `agent-factory/workflows/16-context-read-write.md`. The shared verified context is the only memory — read what earlier roles published, publish your own, and expect nothing to have been passed to you by whoever activated you.",
    "",
    "Never merge to a protected branch. Never deploy to prod. Humans always hold merge and",
    "deploy.",
  ];
}

// The board path below is a literal, not an import of install/state-layout.js: this file is copied by
// hand into the freshness mirrors (36-RESEARCH Pitfall 8). scripts/adapter-byte-baseline.test.ts ties
// it to BOARD_REL through its third recorded divergence (plan 36-10).
function coordinatorBody(a: Adapter): string[] {
  return [
    PROVENANCE,
    "",
    INVARIANT,
    "",
    ...RESOLVER,
    "",
    `Read \`agent-factory/roles/${a.file}\` now, then \`.grugops/factory.config.json\`, the root`,
    "`AGENTS.md` and `memory-bank/plans/board.md` (respect every WIP limit), and act as that role.",
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
    "- **Degraded** — `Agent` is absent (the non-Claude-Code host CLIs, or a sub-agent at the",
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
  // The resolved EFFORT, directly after `model:` and only when it is not `inherit` (plan 34-01,
  // D-06). `inherit` is Claude Code's documented default ("inherits from session"), so it is written
  // as no line at all — which is what keeps a zero-config repository's adapters byte-identical.
  if (a.effort !== "inherit") lines.push(`effort: ${a.effort}`);
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

// The two per-adapter maps the assignment lines announce (plan 34-19, D-24), built and checked
// HERE, before the first write, for the same T-27-32 reason as the render: a map that does not cover
// every adapter is a structural miss, and a structural miss never leaves a partial artifact. Why they
// exist and why they are keyed by adapter name is recorded at the announcement below.
const modelByAdapter = new Map<string, ModelAlias>(adapters.map((a) => [a.name, a.model]));
const effortByAdapter = new Map<string, EffortLevel>(adapters.map((a) => [a.name, a.effort]));
for (const [dial, map] of [
  ["model", modelByAdapter],
  ["effort", effortByAdapter],
] as const) {
  if (map.size !== rendered.length) {
    fail(
      `the announced ${dial} map has ${map.size} entr${map.size === 1 ? "y" : "ies"} for ${rendered.length} written adapter(s) — the map must have one entry per adapter it describes`,
    );
  }
}

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

// ── The announced resolution: TWO lines, describing two different things (finding CR-01) ─────────
//
// Both sit on the success path AFTER the summary above, whose text is deliberately unchanged so
// nothing keying on it moves. Each emitter owns its whole prefix — no caller prepends this script's
// name, because a prefixed line is a line the matching reader refuses (finding WR-03).
//
// WHAT EACH LINE DESCRIBES, and why one was not enough. THE PRESET LINE DESCRIBES AN INPUT: the
// preset `resolveModels` was handed a few lines up. THE ASSIGNMENT LINE DESCRIBES THE OUTPUT: the
// alias each written adapter was resolved to, how many roles the resolution covered, how many of
// them were set by an OVERRIDE rather than by the preset, and which distinct aliases this run
// actually produced.
//
// The comment that stood here claimed the preset announcement "cannot describe a resolution other
// than the one this run performed". That was true of the OBJECT it named and false of the
// RESOLUTION: `resolveModels` takes two inputs — a preset AND a sparse override map — and only the
// first was announced. Finding CR-01 reproduced the consequence end to end: a run under
// `{"models":{"roles":{"orchestrator":"opus","security-nfr":"opus"}}}` and NO `preset` key announced
// `none`, which is the zero-config answer, while emitting two adapters carrying `model: opus` — and
// scripts/adapters-freshness.ts certified that regeneration as the zero-config output and exited 0.
//
// Both values come from the objects this run resolved from — `modelsConfig.overrides` is the map
// handed to `resolveModels`, and the per-adapter map below is built from the adapter entries render()
// wrote from — so neither line can be a restatement of what the run intended rather than of what it
// did.
//
// THE TWO EFFORT LINES, for the same CR-01 reason (plan 34-03, D-06). `resolveEfforts` is a second
// resolution with its own two inputs — `models.effort.preset` and `models.effort.roles` — and its
// output reaches the adapters as `effort:` lines. A run that announced only its MODEL resolution
// would let scripts/adapters-freshness.ts certify an effort-configured regeneration as the
// zero-config output. So the effort preset line describes the effort INPUT (the preset handed to
// `resolveEfforts`), and the effort assignment line describes the effort OUTPUT. They follow the two
// model lines, so no existing line moves.
//
// BOTH ASSIGNMENT LINES ANNOUNCE THE PER-ADAPTER MAP, NOT ONLY THE DISTINCT SET (plan 34-19, D-24).
// Each map is built from the ADAPTER LIST above, entry by entry: the adapter's `name` (the file name
// render() is written under, without `.md`) to the `model` and `effort` stored on that entry, which
// are the very fields render() reads. So the announcement states, for every written adapter, the
// value the generator resolved for it, and a render() that writes one adapter at another value, or
// drops one `effort:` line, disagrees with the map even when the distinct set is unchanged. That is
// the case-B reproduction the verifier recorded, and plan 34-20 makes the installer compare each
// adapter with this map. The map is keyed by adapter name rather than role stem because the readers
// see only rendered file names; the stem-to-name rule lives in scripts/kit-model.ts. The override
// counts come from the override maps handed to `resolveAdapterAssignments`. The two maps
// are built and checked before the write, beside the render.
console.log(resolvedPresetLine(modelsConfig.preset));
console.log(resolvedAssignmentLine(modelByAdapter, modelsConfig.overrides.size));
console.log(resolvedEffortPresetLine(modelsConfig.effort.preset));
console.log(resolvedEffortAssignmentLine(effortByAdapter, modelsConfig.effort.overrides.size));
process.exit(0);

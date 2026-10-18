// generate-host-entries.ts — the one renderer of the non-Claude host entries (phase 34.1, plan 34.1-01;
// D-08, D-09, D-11, D-20, D-21).
//
// WHAT THIS RENDERS. Every whole-file entry install writes for a host with no Claude Code adapter: the
// agent skill Codex CLI reads (`.agents/skills/grugops/SKILL.md`), the OpenCode command
// (`.opencode/commands/grugops.md`) and the Pi prompt template (`.pi/prompts/grugops.md`), one per adapter kind
// (ENTRY_SHAPES); then each host's launch agent, one per registry row with a launchAgent (LAUNCH_SHAPES, quick task
// 261018-hs8), such as `.agents/agents/grugops-orchestrator.md`. Each entry is ONE kit template,
// `agent-factory/packaging/host-entry.pointer.md`, under a frontmatter block (none at all for an empty one). Install
// never builds entry text: it copies these committed files from the kit source (install.ts writeWholeFileEntry), so
// the entry text exists once, in the kit (the single-source rule, D-11).
//
// THE TEMPLATE IS ASSERTED, NOT TRUSTED. Its body (one trailing newline stripped) must equal POINTER_LINE
// (install/host-tools.ts, the one authority for the start-here sentence followed by KIT_ROUTE) and must carry
// KIT_ROUTE (carriesKitRoute). A template edited by hand is refused, nothing is written, exit 1: the entry
// text is fixed literal text, the same on every machine, and no install-time value reaches it (D-09,
// T-34-13). A body holding either sequence OpenCode expands inside a command body is refused first, by name:
// an exclamation mark followed by a backtick (shell-output injection) and an at-sign followed by a non-space
// character (file inclusion) (opencode.ai/docs/commands/, retrieved 2026-10-11; 34.1-RESEARCH.md Pitfall 8).
//
// OUTPUT PATHS COME FROM THE REGISTRY ONLY (ASVS V12). Each kind's output path is the single entry of
// ROUTE_POINTERS[kind], and each launch agent's is its row's launchAgent (install/host-tools.ts); this file types no
// output path, and it accepts no output argument. A kind with a frontmatter shape whose ROUTE_POINTERS list is not
// exactly one path is refused, and every output path, kind or launch, passes the one relative-path check (pathProblem).
// LAUNCH_SHAPES is checked two-sided against the launch-bearing registry rows (launchShapeProblem), and every
// frontmatter line against the sequences that would change its meaning (frontmatterProblem); a refusal writes nothing.
//
// THE COMMITTED ENTRIES ARE BYTE-PINNED BY THIS GENERATOR'S OWN HALT. Everything is rendered in memory
// first. A committed entry that differs from its render, or is absent, HALTS the run with the path, both
// byte lengths and a bounded line difference (at most 10 lines), and nothing is written. Writing happens
// only under `--overwrite-committed-host-entries`, a flag named for its effect. (The freshness gate that
// mirrors this generator is plan 34.1-02.)
//
//   node scripts/generate-host-entries.js                                   # verify only; exit 1 on drift
//   node scripts/generate-host-entries.js --overwrite-committed-host-entries # adopt a template change
//
// The verdict states what was done: entries rendered, written, already identical. A run that renders zero
// entries is refused.
//
// Node stdlib only, plus the in-repo registry (`../install/host-tools.js`, the allowed scripts-to-registry
// edge) and the entry check (`./is-entry.js`). Findings are in clear professional voice (a build-safety
// surface).

import { lstatSync, mkdirSync, readFileSync, writeFileSync, type Stats } from "node:fs";
import { dirname, join } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { HOST_ADAPTER_KINDS, HOST_TOOLS, LAUNCH_AGENT_NAME, POINTER_LINE, ROUTE_POINTERS, carriesKitRoute, type HostAdapterKind, type HostTool } from "../install/host-tools.js";

// ── Fixed literal paths (never argv, env or content derived; ASVS V12) ──────────────────────────────
const ROOT = join(import.meta.dirname, "..");
/**
 * The one pointer template in the kit (D-11), relative to the repository root. Named `.pointer.md`, not
 * `.template.md`: scripts/kit-model.ts listPackagingTemplates admits every `*.template.md` and `*.frontmatter.md`
 * under agent-factory/packaging into the ONE spawn-grant scan composition, whose members must carry a frontmatter
 * block. This file is a single pointer line with no frontmatter, so under that suffix it would be a keyless scan
 * member (scripts/frontmatter.test.ts refuses that as a silent no-grant). It is not an adapter template.
 */
export const TEMPLATE_REL = "agent-factory/packaging/host-entry.pointer.md";
/** The one flag: it adopts a template or shape change by overwriting the committed entries. */
export const OVERWRITE_FLAG = "--overwrite-committed-host-entries";
const REGEN_CMD = `npm run generate:host-entries -- ${OVERWRITE_FLAG}`;

/** The description every entry's frontmatter carries (the text the Pi template carried before this plan). */
export const ENTRY_DESCRIPTION = "Route a software-delivery request through the grugops Orchestrator.";
/** The line that hands the text typed after the command to the entry, for the hosts that expand it. */
export const ARGUMENTS_LINE = "Request: $ARGUMENTS";

/**
 * One entry's shape: its frontmatter as ordered key/value lines (rendered `key: value`, the value exactly as
 * written here), and whether ARGUMENTS_LINE follows the pointer line.
 */
export interface EntryShape {
  readonly frontmatter: ReadonlyArray<readonly [key: string, value: string]>;
  readonly argumentsLine: boolean;
}

/**
 * ENTRY_SHAPES: the frontmatter shape of each adapter kind's whole-file entry, keyed by HostAdapterKind, so a
 * new kind is a compile error until it is classified here. null for a kind this generator renders nothing
 * for (Claude Code's kit and the Copilot block).
 *   agent-skill:        Codex CLI requires `name` and `description` in SKILL.md (learn.chatgpt.com/docs/build-skills,
 *                       retrieved 2026-10-11). Neither Codex nor Antigravity documents `$ARGUMENTS` for a skill, so
 *                       the entry carries no arguments line (D-21). The `.gemini`-detected row (the Gemini row until plan
 *                       34.1-04 renames it to Antigravity CLI) shares this one entry with Codex CLI (D-12, D-20).
 *   opencode-command:   OpenCode reads `description` from a command's frontmatter and expands `$ARGUMENTS` in its
 *                       body (opencode.ai/docs/commands/, retrieved 2026-10-11).
 *   pi-prompt-template: Pi reads `description` and `argument-hint` from a project prompt template and expands
 *                       `$ARGUMENTS` (Phase 34 34-RESEARCH.md § B). The render is byte-identical to the template
 *                       install wrote before phase 34.1, so an earlier install's unedited copy still reads as current.
 * These are the per-kind entries. A host's own launch agent is shaped by LAUNCH_SHAPES below, keyed by host id,
 * because a launch file belongs to one registry row and not to a kind (quick task 261018-hs8, D-05).
 */
export const ENTRY_SHAPES: Readonly<Record<HostAdapterKind, EntryShape | null>> = {
  "claude-kit": null,
  "copilot-pointer": null,
  "pi-prompt-template": {
    frontmatter: [
      ["description", ENTRY_DESCRIPTION],
      ["argument-hint", '"<request>"'],
    ],
    argumentsLine: true,
  },
  "agent-skill": {
    frontmatter: [
      ["name", "grugops"],
      ["description", ENTRY_DESCRIPTION],
    ],
    argumentsLine: false,
  },
  "opencode-command": {
    frontmatter: [["description", ENTRY_DESCRIPTION]],
    argumentsLine: true,
  },
};

/**
 * LAUNCH_SHAPES (quick task 261018-hs8, D-01, D-04): the frontmatter shape of each host's launch agent, keyed by
 * HostTool id, so the file a row's launchAgent names is rendered from the same pointer template as the kind entries.
 * renderAll refuses (launchShapeProblem) unless its keys are exactly the ids of the HOST_TOOLS rows with a launchAgent,
 * in both directions. A launch agent gets no ARGUMENTS_LINE: an agent definition is not given the typed request as
 * `$ARGUMENTS`.
 * Codex CLI and Claude Code have no row here: their launchAgent is null.
 *   antigravity: Antigravity CLI reads a workspace custom agent from `.agents/agents/<name>.md`; `name` and
 *                `description` are required; `mainAgent: true` (the documented default, kept for intent) allows its
 *                selection as the primary agent in the `/agents` panel; `subagent: false` keeps it out of
 *                `invoke_subagent` delegation (antigravity.google/docs/subagents/, retrieved 2026-10-18).
 *   opencode:    OpenCode reads a per-project agent from `.opencode/agents/<name>.md`; `description` is required;
 *                `mode` is `primary`, `subagent` or `all` and defaults to `all`, so `primary` makes it an agent a
 *                session starts as (opencode.ai/docs/agents/, retrieved 2026-10-18).
 *   copilot:     Copilot CLI reads a project custom agent from `.github/agents/<name>.agent.md`; only `description` is
 *                required, `name` is optional and `tools` unset means all tools (docs.github.com/en/copilot/reference/
 *                custom-agents-configuration, retrieved 2026-10-18). `tools`, `target` and `disable-model-invocation`
 *                are left unset, because their effect on the CLI is `UNKNOWN - verify`.
 *   pi:          no frontmatter at all. Pi appends the named file to its system prompt verbatim (resolvePromptInput,
 *                github.com/earendil-works/pi packages/coding-agent/src/core/resource-loader.ts @ 482c1381, retrieved
 *                2026-10-18), so a frontmatter block would enter the prompt as text (D-05); the render is POINTER_LINE
 *                and its newline.
 */
export const LAUNCH_SHAPES: Readonly<Record<string, EntryShape>> = {
  antigravity: {
    frontmatter: [
      ["name", LAUNCH_AGENT_NAME],
      ["description", ENTRY_DESCRIPTION],
      ["mainAgent", "true"],
      ["subagent", "false"],
    ],
    argumentsLine: false,
  },
  opencode: {
    frontmatter: [
      ["description", ENTRY_DESCRIPTION],
      ["mode", "primary"],
    ],
    argumentsLine: false,
  },
  copilot: {
    frontmatter: [
      ["name", LAUNCH_AGENT_NAME],
      ["description", ENTRY_DESCRIPTION],
    ],
    argumentsLine: false,
  },
  pi: {
    frontmatter: [],
    argumentsLine: false,
  },
};

/**
 * Why LAUNCH_SHAPES (`shapes`) does not match the registry (`hosts`), or null when its keys are exactly the ids of the
 * rows with a non-null launchAgent: a key no such row has is named as extra, and such a row with no key as missing.
 * Pure.
 */
export function launchShapeProblem(shapes: Readonly<Record<string, EntryShape>>, hosts: readonly HostTool[]): string | null {
  const want = hosts.filter((h) => h.launchAgent !== null).map((h) => h.id);
  const have = Object.keys(shapes);
  const extra = have.filter((k) => !want.includes(k));
  const missing = want.filter((id) => !have.includes(id));
  if (extra.length === 0 && missing.length === 0) return null;
  const parts: string[] = [];
  if (extra.length > 0) parts.push(`LAUNCH_SHAPES has a shape for ${extra.join(", ")}, which no registry row with a launchAgent is (extra)`);
  if (missing.length > 0) parts.push(`the registry row(s) ${missing.join(", ")} have a launchAgent but LAUNCH_SHAPES has no shape for them (missing)`);
  return parts.join("; ");
}

/** A frontmatter key this generator writes: a letter, then letters, digits, `-` or `_`. */
const PLAIN_KEY = /^[A-Za-z][A-Za-z0-9_-]*$/;

/**
 * Why a frontmatter shape is refused, or null when it is accepted (quick task 261018-hs8, T-hs8-04). The frontmatter is
 * generator-typed data that templateProblem never sees, so each line is held to the same rules here: every key is a
 * plain key, and no value holds a line break (it would end the line), a colon followed by a space or a space followed
 * by `#` (YAML would read a mapping or a comment), an exclamation mark followed by a backtick, or an at-sign followed by
 * a non-space character (the sequences OpenCode expands, 34.1-RESEARCH.md Pitfall 8). Pure.
 */
export function frontmatterProblem(shape: EntryShape): string | null {
  for (const [k, v] of shape.frontmatter) {
    if (!PLAIN_KEY.test(k)) return `the frontmatter key "${k}" is not a plain key (a letter, then letters, digits, - or _)`;
    if (/[\r\n]/.test(v)) return `the frontmatter value of ${k} holds a line break, which would end its line`;
    if (v.includes(": ")) return `the frontmatter value of ${k} holds a colon followed by a space, which YAML reads as a mapping`;
    if (v.includes(" #")) return `the frontmatter value of ${k} holds a space followed by #, which YAML reads as a comment`;
    if (v.includes("!`")) return `the frontmatter value of ${k} holds an exclamation mark followed by a backtick, which OpenCode runs as a shell command (Pitfall 8)`;
    if (/@\S/.test(v)) return `the frontmatter value of ${k} holds an at-sign followed by a non-space character, which OpenCode reads as a file inclusion (Pitfall 8)`;
  }
  return null;
}

/**
 * The entry text for `shape` around the pointer line `body`: the frontmatter between `---` fence lines, then `body`,
 * then ARGUMENTS_LINE when the shape asks for it. An empty frontmatter list gets no fence lines at all, so the entry is
 * `body` and its newline (a file a host appends verbatim takes no frontmatter into its prompt). Pure.
 */
export function renderEntry(shape: EntryShape, body: string): string {
  const fence = shape.frontmatter.length === 0 ? [] : ["---", ...shape.frontmatter.map(([k, v]) => `${k}: ${v}`), "---"];
  const lines = [...fence, body];
  if (shape.argumentsLine) lines.push(ARGUMENTS_LINE);
  return lines.join("\n") + "\n";
}

/**
 * Why a template body is refused, or null when it is accepted. The body must hold neither sequence OpenCode expands
 * in a command body (Pitfall 8), must carry KIT_ROUTE, and must equal POINTER_LINE byte for byte.
 */
export function templateProblem(body: string): string | null {
  if (body.includes("!`")) {
    return "it holds an exclamation mark followed by a backtick, which OpenCode runs as a shell command inside a command body (Pitfall 8)";
  }
  if (/@\S/.test(body)) {
    return "it holds an at-sign followed by a non-space character, which OpenCode reads as a file inclusion inside a command body (Pitfall 8)";
  }
  if (!carriesKitRoute(body)) {
    return "it does not carry KIT_ROUTE (install/host-tools.ts) byte for byte, so an entry rendered from it would give no route to the kit after a scripted install";
  }
  if (body !== POINTER_LINE) {
    return "its body is not POINTER_LINE (install/host-tools.ts, the one authority for the start-here sentence and KIT_ROUTE); the entry text is fixed kit text and is changed in host-tools.ts, never in the template alone";
  }
  return null;
}

/**
 * One rendered entry. `owner` names what the entry is for, in drift lines: the adapter kind for a kind entry
 * (`agent-skill`), `<host id> launch agent` for a launch agent (`antigravity launch agent`).
 */
export interface RenderedEntry {
  readonly owner: string;
  readonly rel: string;
  readonly text: string;
}

/**
 * Why output path `rel` of `owner` is refused, or null: THE ONE PATH CHECK every output path passes, a kind entry's and
 * a launch agent's alike. It must be a non-empty relative POSIX path inside the repository: no leading `/` or `~`, no
 * drive letter, no backslash, and no empty, `.` or `..` segment (ASVS V12).
 */
function pathProblem(owner: string, rel: string): string | null {
  if (rel.length === 0 || /^[/~]|^[A-Za-z]:|\\/.test(rel) || rel.split("/").some((s) => s === "" || s === "." || s === "..")) {
    return `${owner}'s path "${rel}" is not a relative POSIX path inside the repository`;
  }
  return null;
}

/**
 * The output path of `kind`: the single entry of ROUTE_POINTERS[kind], or a refusal when it is not exactly one path,
 * or when that path fails pathProblem.
 */
export function outputRel(kind: HostAdapterKind): { readonly rel: string } | { readonly problem: string } {
  const rels = ROUTE_POINTERS[kind];
  if (rels.length !== 1) {
    return { problem: `adapter kind ${kind} has a frontmatter shape but ROUTE_POINTERS lists ${rels.length} path(s) for it, not exactly one` };
  }
  const rel = rels[0];
  const why = pathProblem(`adapter kind ${kind}`, rel);
  return why === null ? { rel } : { problem: why };
}

/**
 * Every entry this generator renders from `body`, or the first refusal: the kind entries in HOST_ADAPTER_KINDS order,
 * then one launch agent per HOST_TOOLS row with a launchAgent, in registry order. Before anything is rendered, the
 * template (templateProblem), every ENTRY_SHAPES and LAUNCH_SHAPES shape (frontmatterProblem) and the LAUNCH_SHAPES keys
 * against the registry (launchShapeProblem) are checked. Pure.
 */
export function renderAll(body: string): { readonly entries: readonly RenderedEntry[] } | { readonly problem: string } {
  const why = templateProblem(body);
  if (why !== null) return { problem: `${TEMPLATE_REL}: ${why}` };
  for (const kind of HOST_ADAPTER_KINDS) {
    const shape = ENTRY_SHAPES[kind];
    const fm = shape === null ? null : frontmatterProblem(shape);
    if (fm !== null) return { problem: `ENTRY_SHAPES ${kind}: ${fm}` };
  }
  for (const [id, shape] of Object.entries(LAUNCH_SHAPES)) {
    const fm = frontmatterProblem(shape);
    if (fm !== null) return { problem: `LAUNCH_SHAPES ${id}: ${fm}` };
  }
  const keys = launchShapeProblem(LAUNCH_SHAPES, HOST_TOOLS);
  if (keys !== null) return { problem: keys };
  const entries: RenderedEntry[] = [];
  for (const kind of HOST_ADAPTER_KINDS) {
    const shape = ENTRY_SHAPES[kind];
    if (shape === null) continue;
    const out = outputRel(kind);
    if ("problem" in out) return { problem: out.problem };
    entries.push({ owner: kind, rel: out.rel, text: renderEntry(shape, body) });
  }
  for (const h of HOST_TOOLS) {
    if (h.launchAgent === null) continue;
    const owner = `${h.id} launch agent`;
    const bad = pathProblem(owner, h.launchAgent);
    if (bad !== null) return { problem: bad };
    if (entries.some((e) => e.rel === h.launchAgent)) return { problem: `${owner}'s path "${h.launchAgent}" is already another rendered entry's path` };
    entries.push({ owner, rel: h.launchAgent, text: renderEntry(LAUNCH_SHAPES[h.id], body) });
  }
  if (entries.length === 0) return { problem: `no entry was rendered from ${TEMPLATE_REL}; refusing to report an empty generation as success` };
  return { entries };
}

/**
 * renderedEntryRels (quick task 261018-hs8): THE ONE LIST of the paths this generator renders, kind entries then
 * launch agents, in renderAll's order. The paths do not depend on the template, so it renders from POINTER_LINE (the
 * text the template must equal) and reads no file. It throws an Error naming the refusal when renderAll refuses, so a
 * caller never gets a short list. scripts/check-banned-claims.ts derives its generated-entry exclusions from it, and
 * the tests derive their entry sets from it. Pure.
 */
export function renderedEntryRels(): readonly string[] {
  const r = renderAll(POINTER_LINE);
  if ("problem" in r) throw new Error(`generate-host-entries: ${r.problem}`);
  return r.entries.map((e) => e.rel);
}

// ── The run ─────────────────────────────────────────────────────────────────────────────────────────
const fail: (m: string) => never = (m: string): never => {
  console.error(`  ERROR    ${m}`);
  process.exit(1);
};

const MAX_REPORTED_DIFF_LINES = 10;
const MAX_REPORTED_LINE_CHARS = 200;

// A bounded line difference: the first differing lines with their 1-based numbers, clipped on both axes.
function boundedDifference(committed: string, rendered: string): string {
  const a = committed.split("\n");
  const b = rendered.split("\n");
  const clip = (s: string): string => (s.length > MAX_REPORTED_LINE_CHARS ? `${s.slice(0, MAX_REPORTED_LINE_CHARS)}… (${s.length}B, truncated)` : s);
  const out: string[] = [];
  let shown = 0;
  for (let i = 0; i < Math.max(a.length, b.length) && shown < MAX_REPORTED_DIFF_LINES; i++) {
    const left = i < a.length ? a[i] : null;
    const right = i < b.length ? b[i] : null;
    if (left === right) continue;
    out.push(`    line ${i + 1}:`);
    out.push(`      committed: ${left === null ? "(absent)" : clip(left)}`);
    out.push(`      generated: ${right === null ? "(absent)" : clip(right)}`);
    shown += 1;
  }
  if (shown === MAX_REPORTED_DIFF_LINES) out.push(`    … report truncated at ${MAX_REPORTED_DIFF_LINES} differing line(s)`);
  return out.join("\n");
}

// What is at a committed entry's path: absent, a regular file's text, or a refusal (a link, a directory or
// another special file is never read or written through).
function readCommitted(path: string): { readonly state: "absent" } | { readonly state: "ok"; readonly text: string } {
  let st: Stats;
  try {
    st = lstatSync(path);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { state: "absent" };
    fail(`cannot inspect the committed entry ${path} (${(e as NodeJS.ErrnoException).code ?? "error"})`);
  }
  if (!st.isFile()) fail(`the committed entry ${path} is not a regular file (a link, directory or special file is never read or written through)`);
  try {
    return { state: "ok", text: readFileSync(path, "utf8") };
  } catch (e) {
    fail(`cannot read the committed entry ${path} (${(e as NodeJS.ErrnoException).code ?? "error"})`);
  }
}

function main(): void {
  let overwrite = false;
  for (const a of process.argv.slice(2)) {
    if (a === OVERWRITE_FLAG) {
      overwrite = true;
      continue;
    }
    fail(`unrecognised argument "${a}": this generator accepts only ${OVERWRITE_FLAG}, and deliberately accepts no output path (output paths come only from ROUTE_POINTERS and each row's launchAgent, ASVS V12)`);
  }

  const templatePath = join(ROOT, ...TEMPLATE_REL.split("/"));
  let raw: string;
  try {
    raw = readFileSync(templatePath, "utf8");
  } catch (e) {
    fail(`cannot read the pointer template ${templatePath} (${(e as NodeJS.ErrnoException).code ?? "error"})`);
  }
  const body = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
  const rendered = renderAll(body);
  if ("problem" in rendered) fail(`${rendered.problem}. Nothing was written.`);

  let identical = 0;
  const toWrite: RenderedEntry[] = [];
  let divergence = "";
  for (const e of rendered.entries) {
    const path = join(ROOT, ...e.rel.split("/"));
    const cur = readCommitted(path);
    if (cur.state === "ok" && cur.text === e.text) {
      identical += 1;
      continue;
    }
    if (overwrite) {
      toWrite.push(e);
      continue;
    }
    divergence +=
      cur.state === "absent"
        ? `\n  ${e.rel} (${e.owner}) is absent; generated ${Buffer.byteLength(e.text, "utf8")}B\n`
        : `\n  ${e.rel} (${e.owner}): committed ${Buffer.byteLength(cur.text, "utf8")}B, generated ${Buffer.byteLength(e.text, "utf8")}B\n` +
          boundedDifference(cur.text, e.text) +
          "\n";
  }
  if (divergence !== "") {
    fail(
      `the committed host entr(ies) below are not this generator's output, and nothing was written:\n${divergence}\n` +
        `  If the template or a shape changed on purpose, adopt it: \`${REGEN_CMD}\`, then commit the result.\n` +
        `  If not, the committed entry was edited by hand: restore it by regenerating rather than editing the template to match.`,
    );
  }
  for (const e of toWrite) {
    const path = join(ROOT, ...e.rel.split("/"));
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, e.text, "utf8");
    } catch (err) {
      fail(`cannot write ${path} (${(err as NodeJS.ErrnoException).code ?? "error"})`);
    }
  }
  console.log(
    `generate-host-entries: rendered ${rendered.entries.length} entr(ies) from ${TEMPLATE_REL}, ${toWrite.length} written, ${identical} already identical`,
  );
  process.exit(0);
}

if (isEntrypoint(import.meta.url)) main();

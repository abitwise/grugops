// generate-host-entries.ts — the one renderer of the non-Claude host entries (phase 34.1, plan 34.1-01;
// D-08, D-09, D-11, D-20, D-21).
//
// WHAT THIS RENDERS. Every whole-file entry install writes for a host with no Claude Code adapter: the
// agent skill Codex CLI reads (`.agents/skills/grugops/SKILL.md`), the OpenCode command
// (`.opencode/commands/grugops.md`) and the Pi prompt template (`.pi/prompts/grugops.md`). Each entry is ONE kit
// template,
// `agent-factory/packaging/host-entry.template.md`, under a per-kind frontmatter block. Install never builds
// entry text: it copies these committed files from the kit source (install.ts writeWholeFileEntry), so the
// entry text exists once, in the kit (the single-source rule, D-11).
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
// ROUTE_POINTERS[kind] (install/host-tools.ts); this file types no output path, and it accepts no output
// argument. A kind with a frontmatter shape whose ROUTE_POINTERS list is not exactly one path is refused.
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
import { HOST_ADAPTER_KINDS, POINTER_LINE, ROUTE_POINTERS, carriesKitRoute, type HostAdapterKind } from "../install/host-tools.js";

// ── Fixed literal paths (never argv, env or content derived; ASVS V12) ──────────────────────────────
const ROOT = join(import.meta.dirname, "..");
/** The one pointer template in the kit (D-11), relative to the repository root. */
export const TEMPLATE_REL = "agent-factory/packaging/host-entry.template.md";
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
 * for (Claude Code's kit, the Gemini settings merge, the Copilot block, and a kind with no entry).
 *   agent-skill:        Codex CLI requires `name` and `description` in SKILL.md (learn.chatgpt.com/docs/build-skills,
 *                       retrieved 2026-10-11). Neither Codex nor Antigravity documents `$ARGUMENTS` for a skill, so
 *                       the entry carries no arguments line (D-21).
 *   opencode-command:   OpenCode reads `description` from a command's frontmatter and expands `$ARGUMENTS` in its
 *                       body (opencode.ai/docs/commands/, retrieved 2026-10-11).
 *   pi-prompt-template: Pi reads `description` and `argument-hint` from a project prompt template and expands
 *                       `$ARGUMENTS` (Phase 34 34-RESEARCH.md § B). The render is byte-identical to the template
 *                       install wrote before phase 34.1, so an earlier install's unedited copy still reads as current.
 */
export const ENTRY_SHAPES: Readonly<Record<HostAdapterKind, EntryShape | null>> = {
  "claude-kit": null,
  "gemini-settings": null,
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

/** The entry text for `shape` around the pointer line `body`. Pure. */
export function renderEntry(shape: EntryShape, body: string): string {
  const lines = ["---", ...shape.frontmatter.map(([k, v]) => `${k}: ${v}`), "---", body];
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

/** One rendered entry. */
export interface RenderedEntry {
  readonly kind: HostAdapterKind;
  readonly rel: string;
  readonly text: string;
}

/**
 * The output path of `kind`: the single entry of ROUTE_POINTERS[kind], or a refusal when it is not exactly one
 * relative POSIX path with no `..` segment.
 */
export function outputRel(kind: HostAdapterKind): { readonly rel: string } | { readonly problem: string } {
  const rels = ROUTE_POINTERS[kind];
  if (rels.length !== 1) {
    return { problem: `adapter kind ${kind} has a frontmatter shape but ROUTE_POINTERS lists ${rels.length} path(s) for it, not exactly one` };
  }
  const rel = rels[0];
  if (rel.length === 0 || /^[/~]|^[A-Za-z]:|\\/.test(rel) || rel.split("/").some((s) => s === "" || s === "." || s === "..")) {
    return { problem: `adapter kind ${kind}'s path "${rel}" is not a relative POSIX path inside the repository` };
  }
  return { rel };
}

/** Every entry this generator renders from `body`, in HOST_ADAPTER_KINDS order, or the first refusal. */
export function renderAll(body: string): { readonly entries: readonly RenderedEntry[] } | { readonly problem: string } {
  const why = templateProblem(body);
  if (why !== null) return { problem: `${TEMPLATE_REL}: ${why}` };
  const entries: RenderedEntry[] = [];
  for (const kind of HOST_ADAPTER_KINDS) {
    const shape = ENTRY_SHAPES[kind];
    if (shape === null) continue;
    const out = outputRel(kind);
    if ("problem" in out) return { problem: out.problem };
    entries.push({ kind, rel: out.rel, text: renderEntry(shape, body) });
  }
  if (entries.length === 0) return { problem: `no entry was rendered from ${TEMPLATE_REL}; refusing to report an empty generation as success` };
  return { entries };
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
    fail(`unrecognised argument "${a}": this generator accepts only ${OVERWRITE_FLAG}, and deliberately accepts no output path (output paths come only from ROUTE_POINTERS, ASVS V12)`);
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
        ? `\n  ${e.rel} (${e.kind}) is absent; generated ${Buffer.byteLength(e.text, "utf8")}B\n`
        : `\n  ${e.rel} (${e.kind}): committed ${Buffer.byteLength(cur.text, "utf8")}B, generated ${Buffer.byteLength(e.text, "utf8")}B\n` +
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

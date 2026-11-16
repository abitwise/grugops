// Phase 42 plan 42-03: the skills precedence line and the role-switch protocol's skills line.
//
// The precedence rule is stated once (D-14), so the first case walks the kit's reader-facing
// markdown and derives where the phrase occurs, rather than trusting a list of files.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const AGENTS = readFileSync(join(ROOT, "AGENTS.md"), "utf8");

const PHRASE = "for technique, never for process";
const PRECEDENCE =
  "Use a skill for technique, never for process: grugops roles, workflows and hard limits outrank any skill's text, so never let a skill set branching, merging, planning artifacts or commit cadence.";

/** The body of the `## <heading>` section (prefix match), up to the next `## ` heading. */
function section(text: string, heading: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`## ${heading}`));
  expect(start, `no "## ${heading}" section`).toBeGreaterThanOrEqual(0);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

/** The number of times `needle` occurs in `hay`, counted without overlap. */
function occurrences(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

/** Every `.md` file under `dir`, walked recursively. */
function markdownUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...markdownUnder(path));
    else if (entry.isFile() && entry.name.endsWith(".md")) found.push(path);
  }
  return found;
}

/**
 * The reader-facing corpus: the root and install guides, every kit markdown file, and the `.md` files
 * directly under `docs/`. `docs/audit/` is left out, because its disposition rows quote the line on purpose.
 */
function corpus(): string[] {
  const docs = readdirSync(join(ROOT, "docs"), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => join(ROOT, "docs", e.name));
  return [
    join(ROOT, "AGENTS.md"),
    join(ROOT, "README.md"),
    join(ROOT, "install/README.md"),
    ...markdownUnder(join(ROOT, "agent-factory")),
    ...docs,
  ];
}

describe("the skills precedence line (D-14)", () => {
  it("occurs exactly once across the reader-facing corpus, and that once is in AGENTS.md", () => {
    const files = corpus();
    expect(files.length, "the corpus walk found too few files to mean anything").toBeGreaterThan(50);
    const hits = files
      .map((f) => ({ file: relative(ROOT, f), count: occurrences(readFileSync(f, "utf8"), PHRASE) }))
      .filter((h) => h.count > 0);
    expect(hits).toEqual([{ file: "AGENTS.md", count: 1 }]);
  });

  it("sits in AGENTS.md § Role / workflow files as the full sentence", () => {
    expect(section(AGENTS, "Role / workflow files")).toContain(PRECEDENCE);
  });

  it("is its own paragraph, outside every claim-anchored region", () => {
    const lines = AGENTS.split("\n");
    const at = lines.findIndex((l) => l.includes(PHRASE));
    expect(at, "the precedence line is not in AGENTS.md").toBeGreaterThan(0);
    expect(lines[at]).toBe(PRECEDENCE);
    expect(lines[at - 1], "the line before the precedence paragraph is not blank").toBe("");
    expect(lines[at - 1]).not.toMatch(/<!--\s*claim:/);
  });
});

const PROTOCOL = readFileSync(join(ROOT, "agent-factory/roles/_role-switch-protocol.md"), "utf8");

/** The five sentences of the skills line under step 2 (D-05, D-06), in order. */
const SKILLS_LINE = [
  "Use a skill the role names only when the host lists it.",
  "A listed `<plugin>:<name>` counts as `<name>`.",
  "Otherwise take the role's fallback at once.",
  "Never search the disk for a skill.",
  "`AGENTS.md` says which rules win over a skill.",
];

describe("the role-switch protocol's skills line (D-05, D-06)", () => {
  /** Step 2 of `## The 5 steps`, with its indented lines. */
  const stepTwo = (): string => {
    const body = section(PROTOCOL, "The 5 steps");
    const from = body.indexOf("2. Read the role's file");
    const to = body.indexOf("3. Drop");
    expect(from, "no step 2").toBeGreaterThanOrEqual(0);
    expect(to, "no step 3 after step 2").toBeGreaterThan(from);
    return body.slice(from, to);
  };

  it("keeps `## The 5 steps` with exactly five numbered steps", () => {
    const numbered = section(PROTOCOL, "The 5 steps")
      .split("\n")
      .filter((l) => /^\d+\. /.test(l))
      .map((l) => l.slice(0, l.indexOf(" ") + 1));
    expect(numbered).toEqual(["1. ", "2. ", "3. ", "4. ", "5. "]);
  });

  it("puts the five skills sentences under step 2, in order, on one line", () => {
    const step = stepTwo();
    expect(step).toContain(`   ${SKILLS_LINE.join(" ")}\n`);
    for (const sentence of SKILLS_LINE) expect(occurrences(PROTOCOL, sentence), sentence).toBe(1);
  });

  it("carries no per-host skill path table and does not restate the precedence rule", () => {
    expect(PROTOCOL).not.toContain(".agents/skills");
    expect(PROTOCOL).not.toContain(".claude/skills");
    expect(PROTOCOL).not.toContain(PHRASE);
  });
});

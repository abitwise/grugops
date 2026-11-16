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

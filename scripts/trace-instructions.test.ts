// trace-instructions.test.ts — no kit file tells an agent to edit the trace by hand (phase 37, SPLIT-03, v3.0 D-6,
// D-02; plan 37-18).
//
// WHAT THIS PROVES.
//   - the scan set is every git-tracked markdown file under agent-factory/ plus the root AGENTS.md, derived from one
//     `git ls-files` call, and it is not empty;
//   - the set is not short: its size equals a second listing, computed by walking every directory under
//     agent-factory/ on disk and asking git for the tracked markdown directly inside each one, plus AGENTS.md;
//   - the set holds every role listRoles returns and every workflow listWorkflows returns, and those two lists have
//     ROLE_COUNT and WORKFLOW_COUNT members, so the scan cannot skip a role or a workflow;
//   - each of the two HAND_TRACE_PATTERNS matches its seeded instruction line, neither matches a line that says the
//     trace is rendered, and the line scanner reports a seeded hit with its line number;
//   - across the whole set, zero lines match either pattern. A hit prints `path:line` and the line.
//
// THE PATTERNS ARE IMPORTED, NEVER RESTATED. HAND_TRACE_PATTERNS lives in scripts/trace-model.ts (plan 37-06), which
// also tests the rendered trace index against it. This file holds no copy of either pattern, so the scan and the
// render are held to one pattern pair.
//
// Why the rule exists: the trace is rendered by tools/grugops/trace-render.js from published note refs, and the
// render overwrites hand edits. A kit sentence that tells an agent to add a line to the trace by hand would send it
// to write a file the next render throws away.
//
// The test reads the live tree and writes nothing. Run it with:
//   npx vitest run scripts/trace-instructions.test.ts
// Vitest `globals: false` (the repo default), so the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { HAND_TRACE_PATTERNS } from "./trace-model.js";
import {
  listRoles,
  listWorkflows,
  ROLE_COUNT,
  WORKFLOW_COUNT,
  ROLES_SUBPATH,
  WORKFLOWS_SUBPATH,
} from "./kit-model.js";

const ROOT = join(import.meta.dirname, "..");
const KIT_DIR = "agent-factory";
const SUBSTRATE = "AGENTS.md";

/** Tracked paths for the given pathspecs, NUL-separated so no path is ever split or quoted by git. */
function gitLsFiles(pathspecs: string[]): string[] {
  const out = execFileSync("git", ["ls-files", "-z", "--", ...pathspecs], { cwd: ROOT, encoding: "utf8" });
  return out.split("\0").filter((p) => p.length > 0);
}

/** The scan set: every tracked markdown file under the kit, plus the substrate. */
function scanSet(): string[] {
  return gitLsFiles([KIT_DIR, SUBSTRATE])
    .filter((p) => p.endsWith(".md"))
    .sort();
}

/** Every directory under the kit, found by walking the disk rather than by asking git. */
function kitDirectories(): string[] {
  const dirs: string[] = [];
  const walk = (rel: string): void => {
    dirs.push(rel);
    for (const entry of readdirSync(join(ROOT, rel), { withFileTypes: true })) {
      if (entry.isDirectory()) walk(`${rel}/${entry.name}`);
    }
  };
  walk(KIT_DIR);
  return dirs;
}

/** The second listing: per directory, the tracked markdown directly inside it (`:(glob)` keeps `*` in one level). */
function secondListing(): string[] {
  const files: string[] = [];
  for (const dir of kitDirectories()) files.push(...gitLsFiles([`:(glob)${dir}/*.md`]));
  files.push(...gitLsFiles([SUBSTRATE]));
  return files.sort();
}

interface Hit {
  path: string;
  line: number;
  text: string;
}

/** Every line of `text` that matches either hand-trace pattern, with its 1-based line number. */
function hitsIn(path: string, text: string): Hit[] {
  const hits: Hit[] = [];
  text.split("\n").forEach((line, i) => {
    if (HAND_TRACE_PATTERNS.some((p) => p.test(line))) hits.push({ path, line: i + 1, text: line });
  });
  return hits;
}

describe("the scan set (plan 37-18): every tracked kit markdown file and AGENTS.md, counted two ways", () => {
  const files = scanSet();

  it("is not empty and holds the substrate", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain(SUBSTRATE);
  });

  it("has the size of a second listing computed directory by directory from a walk of the disk", () => {
    const second = secondListing();
    expect(second.length, "the second listing is empty, so the size comparison would prove nothing").toBeGreaterThan(
      1,
    );
    expect(files.length, `scan set ${files.length} files, second listing ${second.length} files`).toBe(second.length);
    expect(files).toEqual(second);
  });

  it("holds every role and every workflow the kit model lists", () => {
    const roles = listRoles();
    const workflows = listWorkflows();
    expect(roles).toHaveLength(ROLE_COUNT);
    expect(workflows).toHaveLength(WORKFLOW_COUNT);
    const missing = [
      ...roles.map((f) => `${ROLES_SUBPATH}/${f}`),
      ...workflows.map((f) => `${WORKFLOWS_SUBPATH}/${f}`),
    ].filter((p) => !files.includes(p));
    expect(missing, "a role or workflow the kit model lists is outside the scan set").toEqual([]);
  });
});

describe("the two hand-trace patterns (imported from scripts/trace-model.ts) catch their seeded lines", () => {
  const [handEdit, oldShape] = HAND_TRACE_PATTERNS as [RegExp, RegExp];
  const rendered = "The ticket's trace file is rendered from published note refs";

  it("there are exactly two patterns", () => {
    expect(HAND_TRACE_PATTERNS).toHaveLength(2);
  });

  it("pattern one matches an instruction to add to the trace by hand", () => {
    expect(handEdit.test("Append to traceability.md the PR link")).toBe(true);
  });

  it("pattern two matches the old row shape", () => {
    expect(oldShape.test("update the traceability row")).toBe(true);
  });

  it("neither matches a line that says the trace is rendered", () => {
    for (const p of HAND_TRACE_PATTERNS) expect(p.test(rendered), `${p} matched: ${rendered}`).toBe(false);
  });

  it("the line scanner reports a seeded hit with its path and line number, and nothing for clean text", () => {
    const seeded = ["# Seeded", "", rendered, "Append to traceability.md the PR link", ""].join("\n");
    expect(hitsIn("seed.md", seeded)).toEqual([
      { path: "seed.md", line: 4, text: "Append to traceability.md the PR link" },
    ]);
    expect(hitsIn("clean.md", ["# Clean", rendered].join("\n"))).toEqual([]);
  });
});

describe("no kit file tells an agent to edit the trace by hand (SPLIT-03, v3.0 D-6, D-02)", () => {
  it("zero lines across the scan set match either pattern", () => {
    const files = scanSet();
    expect(files.length).toBeGreaterThan(0);
    let lines = 0;
    const hits: Hit[] = [];
    for (const path of files) {
      const text = readFileSync(join(ROOT, path), "utf8");
      lines += text.split("\n").length;
      hits.push(...hitsIn(path, text));
    }
    expect(lines, "no line was read, so a zero-hit result would be vacuous").toBeGreaterThan(files.length);
    // One line per hit, joined with " | " so the failure message stays on one line in every reporter.
    const report = hits.map((h) => `${h.path}:${h.line}: ${h.text}`).join(" | ");
    expect(hits.length, `hand-trace instruction(s) found: ${report}`).toBe(0);
  });
});

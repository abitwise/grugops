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
//   - the set holds the three files whose sentences the earlier two-pattern scan missed (plan 37-27, Gap 3);
//   - there are three HAND_TRACE_PATTERNS; every row of KNOWN_VIOLATIONS (every known violating sentence, the three
//     pre-fix kit sentences among them) matches at least one, and no row of RENDERED_WORDING (the rendered-from-refs
//     wording, the rendered index sentence included) matches any;
//   - the line scanner reports a seeded hit with its line number, and the paragraph scanner reports a sentence
//     wrapped over two lines as `path:first-last`, which the line scanner cannot see;
//   - across the whole set, zero lines and zero paragraphs match any pattern. A line hit prints `path:line` and the
//     line; a paragraph hit prints `path:first-last` and the joined paragraph.
//
// THE PATTERNS ARE IMPORTED, NEVER RESTATED. HAND_TRACE_PATTERNS lives in scripts/trace-model.ts (plan 37-06), which
// also tests the rendered trace index against it. This file holds no copy of any pattern, so the scan and the
// render are held to one pattern set.
//
// SCAN-1 (plan 37-27, 37-GAP-PLANNING-BRIEF.md): the patterns are derived from the truth (no kit file tells an agent
// to write the trace by hand), not from the first sentences the scan caught. The corpus below is what keeps them
// that wide: a pattern narrowed until a known violating sentence passes turns a KNOWN_VIOLATIONS row red.
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
import { HAND_TRACE_PATTERNS, renderTraceIndex } from "./trace-model.js";
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

/** True when `text` matches any hand-trace pattern. */
function matchesAny(text: string): boolean {
  return HAND_TRACE_PATTERNS.some((p) => p.test(text));
}

/** Every line of `text` that matches any hand-trace pattern, with its 1-based line number. */
function hitsIn(path: string, text: string): Hit[] {
  const hits: Hit[] = [];
  text.split("\n").forEach((line, i) => {
    if (matchesAny(line)) hits.push({ path, line: i + 1, text: line });
  });
  return hits;
}

interface ParagraphHit {
  path: string;
  first: number;
  last: number;
  text: string;
}

/** A fence delimiter line: three or more backticks or tildes, indented by at most three spaces. */
const FENCE_LINE = /^ {0,3}(`{3,}|~{3,})/;
/**
 * A line that starts a new paragraph even with no blank line before it: a heading, the start of an HTML comment, a
 * table row, or a list-item marker. Without this, the generated header comment `do not hand-edit` would join the
 * `# Traceability` heading below it and read as an instruction to edit the trace.
 */
const PARAGRAPH_START = [
  /^ {0,3}#{1,6}(\s|$)/, // heading
  /^\s*<!--/, // HTML comment start
  /^\s*\|/, // table row
  /^\s*([-*+]|\d{1,9}[.)])(\s|$)/, // list-item marker
];

/**
 * Every paragraph of `text` that matches any hand-trace pattern, reported as `path:first-last` (1-based). Outside
 * fenced blocks, a paragraph is a run of non-blank lines in which every line after the first is not a
 * PARAGRAPH_START line; its lines are trimmed and joined with one space. Kit prose wraps (a violating sentence can
 * sit on two lines), and the line scanner alone is blind to that (SCAN-1, plan 37-27).
 */
function paragraphHitsIn(path: string, text: string): ParagraphHit[] {
  const hits: ParagraphHit[] = [];
  let inFence = false;
  let start = 0;
  let parts: string[] = [];
  const flush = (end: number): void => {
    if (parts.length > 0) {
      const joined = parts.join(" ");
      if (matchesAny(joined)) hits.push({ path, first: start, last: end, text: joined });
    }
    parts = [];
  };
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const n = i + 1;
    if (FENCE_LINE.test(line)) {
      flush(n - 1);
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    if (line.trim() === "") {
      flush(n - 1);
      return;
    }
    if (parts.length > 0 && PARAGRAPH_START.some((p) => p.test(line))) flush(n - 1);
    if (parts.length === 0) start = n;
    parts.push(line.trim());
  });
  flush(lines.length);
  return hits;
}

/** The files that carried the three sentences the two-pattern scan missed (37-VERIFICATION.md Gap 3). */
const GAP3_FILES = [
  "agent-factory/workflows/02-idea-to-epics.md",
  "agent-factory/workflows/03-epic-to-tickets.md",
  "agent-factory/_commit-convention.md",
];

/**
 * Every known violating sentence: each must match at least one pattern. The first three are the kit sentences the
 * two-pattern scan missed, copied verbatim from the files before plan 37-27 reworded them, and kept here as the
 * class corpus. Never drop a row to make the scan pass; a hit is fixed in the kit text.
 */
const KNOWN_VIOLATIONS: readonly string[] = [
  // agent-factory/workflows/02-idea-to-epics.md:41 before plan 37-27
  "The product decisions are recorded as typed notes per Workflow 16 and the trace rows are appended.",
  // agent-factory/workflows/03-epic-to-tickets.md:9 before plan 37-27
  "grug make tickets small — each one has value, scope, acceptance, test notes, size, priority, and a trace row before it can be pulled.",
  // agent-factory/_commit-convention.md:52 before plan 37-27
  "- `docs(board): grug move ABC-001 into In Review, write trace row`",
  "trace rows are written",
  "add a trace row",
  "write trace row",
  "Append to traceability.md the PR link",
  "update the traceability row",
  "hand-edit traceability.md to add the release",
];

/** The sentence line of the rendered index: the one line that is no header, heading, blank or table row. */
function renderedIndexSentence(): string {
  const lines = renderTraceIndex([])
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.startsWith("<!--") && !l.startsWith("#") && !l.startsWith("|"));
  expect(lines, "the rendered index has exactly one sentence line").toHaveLength(1);
  return lines[0]!;
}

/** The rendered-from-refs wording: no row may match any pattern. */
const RENDERED_WORDING: readonly string[] = [
  "The ticket's trace file is rendered from published note refs",
  "A note that names no ticket adds nothing to the trace.",
  "grug write the trail down — tickets, board, rendered trace files, metrics, and context notes",
  // The three plan 37-27 rewordings of the KNOWN_VIOLATIONS kit sentences.
  "The product decisions are recorded as typed notes per Workflow 16, and the epic and feature ids they publish as refs feed the trace render.",
  "grug make tickets small — each one has value, scope, acceptance, test notes, size, priority, and epic and feature ids before it can be pulled.",
  "Those ids are published as refs on a note (Workflow 16), so the trace render gives the ticket a trace file.",
  "- `docs(board): grug move ABC-001 into In Review, commit rendered trace`",
];

describe("the scan set (plan 37-18): every tracked kit markdown file and AGENTS.md, counted two ways", () => {
  const files = scanSet();

  it("is not empty and holds the substrate", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain(SUBSTRATE);
  });

  it("holds the three files whose sentences the two-pattern scan missed (plan 37-27, Gap 3)", () => {
    const missing = GAP3_FILES.filter((p) => !files.includes(p));
    expect(missing, `scan set of ${files.length} files lacks a Gap 3 file`).toEqual([]);
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

describe("the three hand-trace patterns (imported from scripts/trace-model.ts) catch their seeded lines", () => {
  const [handEdit, oldShape] = HAND_TRACE_PATTERNS as [RegExp, RegExp, RegExp];
  const rendered = "The ticket's trace file is rendered from published note refs";

  it("there are exactly three patterns", () => {
    expect(HAND_TRACE_PATTERNS).toHaveLength(3);
  });

  it.each(KNOWN_VIOLATIONS.map((row) => [row]))("KNOWN_VIOLATIONS row matches at least one pattern: %s", (row) => {
    expect(matchesAny(row), `no pattern matched a known violating sentence: ${row}`).toBe(true);
  });

  it.each(RENDERED_WORDING.map((row) => [row]))("RENDERED_WORDING row matches no pattern: %s", (row) => {
    for (const p of HAND_TRACE_PATTERNS) expect(p.test(row), `${p} matched: ${row}`).toBe(false);
  });

  it("the rendered index sentence matches no pattern", () => {
    const sentence = renderedIndexSentence();
    for (const p of HAND_TRACE_PATTERNS) expect(p.test(sentence), `${p} matched: ${sentence}`).toBe(false);
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

describe("the paragraph scanner (plan 37-27, SCAN-1): a violating sentence wrapped over two lines is a hit", () => {
  it.each([
    [
      "the pre-fix 02-idea-to-epics.md sentence split after `the trace`",
      "The product decisions are recorded as typed notes per Workflow 16 and the trace",
      "rows are appended.",
    ],
    ["`Append to` / `traceability.md the PR link`", "Append to", "traceability.md the PR link"],
  ])("%s: paragraph mode reports seed.md:3-4, line mode reports nothing", (_label, first, second) => {
    const seeded = ["# Seeded", "", first, second, "", "Unrelated closing line."].join("\n");
    expect(hitsIn("seed.md", seeded), "a line alone matched, so this row does not test wrapping").toEqual([]);
    expect(paragraphHitsIn("seed.md", seeded)).toEqual([
      { path: "seed.md", first: 3, last: 4, text: `${first} ${second}` },
    ]);
  });

  it("a heading or an HTML comment line does not join the line beside it: the rendered index is no hit", () => {
    // The index's header comment says `do not hand-edit`, and `# Traceability` sits right under it. Joined, the two
    // would read as an instruction to edit traceability; each starts its own paragraph, so they never join.
    const index = renderTraceIndex([]);
    expect(paragraphHitsIn("index.md", index)).toEqual([]);
    const commentThenHeading = ["<!-- do not hand-edit -->", "# Traceability"].join("\n");
    expect(paragraphHitsIn("seed.md", commentThenHeading)).toEqual([]);
    const proseThenComment = ["Do not hand-edit", "<!-- traceability.md is rendered -->"].join("\n");
    expect(paragraphHitsIn("seed.md", proseThenComment)).toEqual([]);
    // Control: the same two lines with no paragraph start between them do join, and are a hit.
    const joined = ["Do not hand-edit", "traceability.md is rendered"].join("\n");
    expect(paragraphHitsIn("seed.md", joined)).toHaveLength(1);
  });

  it("a fenced block is no paragraph", () => {
    const fenced = ["```", "Append to", "traceability.md the PR link", "```"].join("\n");
    expect(paragraphHitsIn("seed.md", fenced)).toEqual([]);
  });
});

describe("no kit file tells an agent to edit the trace by hand (SPLIT-03, v3.0 D-6, D-02)", () => {
  it("zero lines and zero paragraphs across the scan set match any pattern", () => {
    const files = scanSet();
    expect(files.length).toBeGreaterThan(0);
    let lines = 0;
    const hits: Hit[] = [];
    const paragraphHits: ParagraphHit[] = [];
    for (const path of files) {
      const text = readFileSync(join(ROOT, path), "utf8");
      lines += text.split("\n").length;
      hits.push(...hitsIn(path, text));
      paragraphHits.push(...paragraphHitsIn(path, text));
    }
    expect(lines, "no line was read, so a zero-hit result would be vacuous").toBeGreaterThan(files.length);
    // One entry per hit, joined with " | " so the failure message stays on one line in every reporter.
    const lineReport = hits.map((h) => `${h.path}:${h.line}: ${h.text}`).join(" | ");
    const paragraphReport = paragraphHits.map((h) => `${h.path}:${h.first}-${h.last}: ${h.text}`).join(" | ");
    expect(
      { lineHits: hits.length, paragraphHits: paragraphHits.length },
      `hand-trace instruction(s) found in ${files.length} files. Lines: ${lineReport || "none"}. Paragraphs: ${paragraphReport || "none"}`,
    ).toEqual({ lineHits: 0, paragraphHits: 0 });
  });
});

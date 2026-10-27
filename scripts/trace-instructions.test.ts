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
//   - the set has SCAN_SET_SIZE files, so a short set is red even if the second listing were short the same way;
//   - the set holds the three files whose sentences the earlier two-pattern scan missed (plan 37-27, Gap 3);
//   - there are four HAND_TRACE_PATTERNS; every row of KNOWN_VIOLATIONS (every known violating sentence, the three
//     pre-fix kit sentences and the seven 37-REVIEW.md WR-08 sentences among them) matches at least one, and no row of
//     RENDERED_WORDING (the rendered-from-refs wording, the rendered index sentence included) matches any;
//   - every EXCLUSION_CONTROLS pair holds one exclusion of pattern 4: its negative (a live kit sentence where one
//     exists) matches no pattern, and its control positive, the same shape without the excluded feature, matches
//     pattern 4 (plan 37-32, WR-08);
//   - the four patterns stay linear: each returns in well under the RUNTIME_CEILING_MS ceiling on 20,000-character
//     adversarial inputs, in line mode and in paragraph mode;
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
// Round 2 (plan 37-32, D-18, WR-08): the three patterns still needed the word "traceability" or a retired matrix noun,
// so "Append the PR link to the trace." passed. Pattern 4 aims a write verb at the trace in any spelling, and each of
// its exclusions is reasoned from the same truth and held here by a negative and a control (EXCLUSION_CONTROLS).
//
// Round 4 (plan 37-42, D-21, WR-12): plan 37-39's two run-wide exclusions (`per Workflow 16`, and a comma followed by a
// determiner) reached the whole run between the verb and the trace, so a comma list of objects aimed at the trace
// passed. Both were removed; the false hit they were added for, `the rendered trace files`, is now exempted at the noun,
// and the two EXCLUSION_CONTROLS rows that held them are re-pointed at that `rendered` rule.
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
import { HAND_TRACE_PATTERNS, HAND_TRACE_VERB_GROUPS, HAND_TRACE_WRITE_VERBS, renderTraceIndex } from "./trace-model.js";
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
  // The seven sentences of 37-REVIEW.md WR-08's table, verbatim: each passed the three-pattern scan (plan 37-32).
  "Append the PR link to the trace.",
  "Hand-edit the trace.",
  "Update the trace file for the ticket.",
  "Add a line to the trace index.",
  "Write the trace entry for each ticket.",
  "Fill in the Release column of the trace.",
  // The path-dot case: the `.` in `./` stopped pattern 1's old `[^.]{0,120}` bound.
  "Add the test path to ./memory-bank/plans/traceability.md.",
  // The trace in the other spellings pattern 4 names (plan 37-32).
  "Add the PR to the ticket's trace file.",
  "Record the release in each ticket's trace.",
  "Edit the trace index by hand.",
  "Update its trace file.",
  // WR-11 (plan 37-39, D-19): the nine sentences of 37-VERIFICATION.md's SCAN-1 reproduction that matched no pattern,
  // verbatim. Shapes: no determiner, a possessive, an adjective, a plural, a gerund, a verb outside the list, and a
  // note as the object rather than the route.
  "Edit trace files by hand when the render is late.",
  "Update trace files directly.",
  "Update your trace file.",
  "Append the PR link to the generated trace file.",
  "Update the ticket traces by hand.",
  "Keep updating the trace file by hand.",
  "Finish by adding the PR link to the trace.",
  "Copy the PR link into the trace.",
  "Add a note to the trace file by hand.",
  // WR-11: the six further sentences of 37-REVIEW.md WR-11's table, verbatim (the `... to their trace.` row is
  // written out with the sentence it abbreviates).
  "Append the PR link to our trace.",
  "Append the PR link to their trace.",
  "Record the release in the matching trace file.",
  "Write the release id into the ticket's own trace.",
  "Edit these traces.",
  "Start by appending the PR link to traceability.md.",
  // WR-11: the four plan 37-32 sentences of deferred-items.md, verbatim (the note or ref stop, a ticket id as the
  // determiner, a verb outside the list).
  "Update the release refs in the trace file.",
  "Write the PR link into ABC-1's trace.",
  "Update the ticket ABC-1 trace file.",
  "Paste the release id into the trace file.",
  // WR-12 (plan 37-42, D-21): the four sentences of 37-REVIEW.md WR-12, verbatim; each passed the 37-39 scan
  "Append the PR link, the test path and the release to the trace.",
  "Add the PR link, the test path and the release note to each ticket's trace file.",
  "Update the PR link, its tests and the release in the trace file.",
  "Append, per Workflow 16, the PR link to the trace file.",
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
  // WR-09 (plan 37-32): the two sentences that replace the plan 37-27 rewordings of 02-idea-to-epics.md:41 and
  // 03-epic-to-tickets.md:9, which contradicted their own Trace updates sections.
  "The product decisions are recorded as typed notes per Workflow 16. The epic and feature ids reach the trace once Workflow 03 publishes them, with the ticket identifier, on each ticket's note.",
  "Those ids are published with the ticket identifier as refs on a note (Workflow 16).",
  // The rendered wording the gap-planning brief names (37-GAP-PLANNING-BRIEF.md §1.1, 37-REVIEW.md WR-08).
  "the trace render",
  "feed the trace",
  "the rendered trace",
  "with trace ids on refs",
  // WR-11 (plan 37-39): the review's own example of wording a wider pattern 4 must keep negative.
  "this workflow feeds the trace rather than editing it",
  // WR-09 remainder (plan 37-39): agent-factory/workflows/03-epic-to-tickets.md:46, the Done condition.
  "Its epic, feature and NFR ids are published, with the ticket identifier, as refs on a note.",
];

/**
 * One exclusion of pattern 4 per entry. Pattern 4 asks for a write verb aimed at the trace; each exclusion is a case
 * where that shape does not tell an agent to write the trace by hand (scripts/trace-model.ts states the reason).
 * `negative` matches no pattern; `control` is the same shape without the excluded feature and matches pattern 4, so an
 * exclusion that grew past its reason, or a pattern 4 that stopped matching, turns a row red. `source` is the
 * repository-relative file a live negative is copied from, verbatim (held below: the file still holds the sentence,
 * with its line breaks read as spaces), or null when no live kit sentence needs this exclusion alone and the negative
 * is written to isolate it. Never drop a row to make the scan pass.
 */
interface ExclusionControl {
  reason: string;
  source: string | null;
  negative: string;
  control: string;
}
const EXCLUSION_CONTROLS: readonly ExclusionControl[] = [
  {
    reason: "negation `no <word>`: a prohibition tells the agent not to write",
    source: "agent-factory/workflows/05-pr-quality-gate.md",
    negative: "No step edits a trace file or the index by hand.",
    control: "Each step edits a trace file or the index by hand.",
  },
  {
    reason: "negation `never`, before a hyphenated verb",
    source: "agent-factory/workflows/18-context-compaction.md",
    negative: "Never hand-edit a trace file to preserve a trace the compaction actually broke.",
    control: "Hand-edit a trace file to preserve a trace the compaction actually broke.",
  },
  {
    reason: "negation reaches only the verb it precedes, never past its clause",
    source: "agent-factory/workflows/16-context-read-write.md",
    negative: "No workflow edits a trace file or the trace index.",
    control: "Do not wait for the render; add the PR link to the trace.",
  },
  {
    reason: "the renderer as the verb's subject: the render writes, not an agent",
    source: "agent-factory/workflows/12-release.md",
    negative: "The next trace render adds the release to each ticket's trace file and index line.",
    control: "The render is slow, so append the PR link to the trace.",
  },
  {
    reason: "the trace as a predicate after a copula is a classification, not an object (live, also bound by `because`)",
    source: "agent-factory/contracts/board.md",
    negative:
      "The schema is written in clear professional voice because it is a trace and safety surface: the board is what a human reads to learn where work stands, and a parser that quietly reinterprets it reports a state nobody wrote.",
    control: "The schema is written in clear professional voice and it updates a trace and safety surface.",
  },
  {
    reason: "the trace as a predicate after a copula, isolated",
    source: null,
    negative: "The PR link added here is a trace of the change.",
    control: "The PR link added here makes a trace of the change.",
  },
  {
    reason: "the note route between the verb and the trace: a typed note is the sanctioned write",
    source: "agent-factory/roles/software-engineer.md",
    negative:
      "3. Record what changed — files, behavior, tests, commands run — as typed notes for the shared context and the trace.",
    control: "3. Record what changed — files, behavior, tests, commands run — in the shared context and the trace.",
  },
  {
    reason: "the ref route between the verb and the trace, isolated",
    source: null,
    negative: "Record the PR link as refs on a note, so the trace is rendered from it.",
    control: "Record the PR link on the board, so the trace is rendered from it.",
  },
  {
    reason: "a clause bound at a semicolon: the verb's object sits in the clause before it",
    source: "AGENTS.md",
    negative:
      "The Orchestrator classifies the request, activates the right specialist role(s), requires published notes from each, updates the board, and produces the next action; the trace is rendered from those notes.",
    control:
      "The Orchestrator classifies the request, activates the right specialist role(s), requires published notes from each, updates the board, and produces the next action, and the trace is rendered from those notes.",
  },
  {
    reason: "a clause bound at `because`: the reason clause names what a thing is, not what to write",
    source: "agent-factory/contracts/task-notes.template.md",
    negative: "It is written in clear professional voice because it describes a trace surface.",
    control: "It is written in clear professional voice and it describes a trace surface.",
  },
  {
    reason: "a clause bound at a sentence end: a dot followed by a space",
    source: null,
    negative: "Update the board. The trace is rendered from the notes.",
    control: "Update the board, then the trace is rendered from the notes.",
  },
  {
    reason: "a verb followed by `nothing` writes nothing (live, also a `no <word>` negation)",
    source: "agent-factory/workflows/02-idea-to-epics.md",
    negative: "A note that names no ticket adds nothing to the trace.",
    control: "A note that names a ticket adds a line to the trace.",
  },
  {
    reason: "a verb followed by `nothing`, isolated",
    source: null,
    negative: "Each note adds nothing to the trace.",
    control: "Each note adds a line to the trace.",
  },
  {
    reason: "`the trace render` names the renderer, not the trace",
    source: null,
    negative: "Update the trace render step before the release.",
    control: "Update the trace before the release.",
  },
  // WR-11 (plan 37-39, D-19): the exclusions the wider pattern 4 needs, each a family of false hits the planning trial
  // found in the kit.
  {
    reason: "`rendered` before a determiner phrase's `trace files` names the render's output (WF02 artifact list)",
    source: "agent-factory/workflows/02-idea-to-epics.md",
    negative:
      "The artifacts are the epics, the board update, the product notes recorded per Workflow 16 and the rendered trace files.",
    control: "The artifacts are the epics, the board update, the product notes recorded per Workflow 16 and the trace files.",
  },
  {
    reason: "`rendered` before a determiner phrase's `trace files` names the render's output (WF06 artifact list)",
    source: "agent-factory/workflows/06-uat-pack.md",
    negative:
      "The artifacts are the UAT pack notes recorded per Workflow 16, the recorded human signoff, the board move, the metrics and the rendered trace files.",
    control:
      "The artifacts are the UAT pack notes recorded per Workflow 16, the recorded human signoff, the board move, the metrics and the trace files.",
  },
  {
    reason: "a conjunction is never one of the words between a determiner and the trace",
    source: "agent-factory/contracts/board.md",
    negative:
      "**Which directory entries are records.** The rule covers the NFR and trace directories and the move-only surfaces.",
    control: "Update the NFR trace directories.",
  },
  {
    reason: "`rendered` before a determiner-less `trace files` names the render's output",
    source: "agent-factory/_commit-convention.md",
    negative: "grug write the trail down — tickets, board, rendered trace files, metrics, and context notes",
    control: "grug write the trail down — tickets, board, trace files, metrics, and context notes",
  },
  {
    reason: "a colon followed by a space is a clause bound: the verb's object sits in the clause before it",
    source: "agent-factory/workflows/16-context-read-write.md",
    negative:
      "So this workflow feeds the trace rather than editing it: an `artifact-ref` note carries the trace ids, and the render picks them up.",
    control:
      "So this workflow feeds the trace rather than editing it and an `artifact-ref` note carries the trace ids, and the render picks them up.",
  },
  {
    reason: "`trace back` (or `trace forward`) is the verb trace, not the trace as an object",
    source: null,
    negative: "Update the board so every ticket traces back to its epic.",
    control: "Update the board so every ticket trace is current.",
  },
  {
    reason: "the note stop is the route wording only: a note as the place written is no route",
    source: null,
    negative: "Record the PR link as refs on a note, so the trace is rendered from it.",
    control: "Record the PR link in a note, so the trace is rendered from it.",
  },
];

/**
 * The scan set's pinned size. The two-way derivation catches a set that is short against the disk; the pin catches a
 * change in the set itself, which must then be looked at and the pin moved with a dated line.
 * History: 2026-10-24, plan 37-32: 77 files; 77 at 45c04b27.
 */
const SCAN_SET_SIZE = 77;

/**
 * The runtime ceiling for one pattern on one adversarial input. The expected time is a few milliseconds; the ceiling
 * sits about two orders of magnitude above it, so a loaded one-worker run stays green while a backtracking blow-up
 * (a superlinear regular expression once made a guard in this project take 383 s) fails.
 */
const RUNTIME_CEILING_MS = 2000;

/** `text` wrapped at word boundaries into lines of at most `width` characters. */
function wrap(text: string, width: number): string {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ").filter((w) => w.length > 0)) {
    if (line.length > 0 && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else line = line.length > 0 ? `${line} ${word}` : word;
  }
  if (line.length > 0) lines.push(line);
  return lines.join("\n");
}

describe("the scan set (plan 37-18): every tracked kit markdown file and AGENTS.md, counted two ways", () => {
  const files = scanSet();

  it("is not empty and holds the substrate", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain(SUBSTRATE);
  });

  it(`has SCAN_SET_SIZE (${SCAN_SET_SIZE}) files (plan 37-32)`, () => {
    expect(files.length, `scan set ${files.length} files; move the pin with a dated history line`).toBe(SCAN_SET_SIZE);
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

describe("the four hand-trace patterns (imported from scripts/trace-model.ts) catch their seeded lines", () => {
  const [handEdit, oldShape] = HAND_TRACE_PATTERNS as [RegExp, RegExp, RegExp, RegExp];
  const rendered = "The ticket's trace file is rendered from published note refs";

  it("there are exactly four patterns", () => {
    expect(HAND_TRACE_PATTERNS).toHaveLength(4);
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

  it.each(EXCLUSION_CONTROLS.map((c) => [c.reason, c]))(
    "EXCLUSION_CONTROLS (plan 37-32): %s: the negative matches no pattern, the control matches pattern 4",
    (_reason, c) => {
      const pattern4 = HAND_TRACE_PATTERNS[3];
      expect(pattern4, "there is no fourth pattern").toBeDefined();
      for (const p of HAND_TRACE_PATTERNS) expect(p.test(c.negative), `${p} matched: ${c.negative}`).toBe(false);
      expect(pattern4!.test(c.control), `pattern 4 missed the control: ${c.control}`).toBe(true);
      if (c.source !== null) {
        // A live negative is still the kit's sentence: the file holds it once its line breaks are read as spaces.
        const flat = readFileSync(join(ROOT, c.source), "utf8").replace(/\s*\n\s*/g, " ");
        expect(flat.includes(c.negative), `${c.source} no longer holds: ${c.negative}`).toBe(true);
      }
    },
  );

  it("HAND_TRACE_VERB_GROUPS is one grouped authority: each group a base with its forms and one `-ing` form, flattened into HAND_TRACE_WRITE_VERBS (plan 37-39, WR-11)", () => {
    expect(Object.isFrozen(HAND_TRACE_VERB_GROUPS)).toBe(true);
    expect(HAND_TRACE_VERB_GROUPS.length, "there are no verb groups, so every check below is vacuous").toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const group of HAND_TRACE_VERB_GROUPS) {
      expect(Object.isFrozen(group), `group ${group[0]} is not frozen`).toBe(true);
      const [base, ...forms] = group;
      expect(base, "a group is empty").toBeDefined();
      // The base comes first (it is no `-ing` form and no member is shorter), and every form is the same verb (it
      // shares the base's first two letters: `write` and `wrote`, `copy` and `copies`).
      expect(base!.endsWith("ing"), `group ${base} starts with a gerund, not its base`).toBe(false);
      for (const f of forms) {
        expect(f.length, `${f} is shorter than its base ${base}`).toBeGreaterThanOrEqual(base!.length);
        expect(f.slice(0, 2), `${f} is not a form of ${base}`).toBe(base!.slice(0, 2));
      }
      const gerunds = group.filter((v) => v.endsWith("ing"));
      expect(gerunds, `group ${base} must hold exactly one -ing form`).toHaveLength(1);
      expect(forms.length, `group ${base} has no forms beyond its base`).toBeGreaterThan(0);
      for (const v of group) {
        expect(seen.has(v), `${v} is in two groups`).toBe(false);
        seen.add(v);
      }
    }
    expect([...HAND_TRACE_WRITE_VERBS], "HAND_TRACE_WRITE_VERBS is not the groups flattened in order").toEqual(
      HAND_TRACE_VERB_GROUPS.flat(),
    );
    // The plan 37-32 list (scripts/trace-model.ts at 8ff39ab5), copied as a historical floor the groups may only
    // widen. It is a floor, not a pattern: the patterns are still imported.
    const plan3732 = [
      "append", "appends", "appended", "add", "adds", "added", "write", "writes", "wrote", "written", "fill",
      "fills", "filled", "update", "updates", "updated", "record", "records", "recorded", "edit", "edits",
      "edited", "hand-edit", "hand-edits", "hand-edited", "modify", "modifies", "modified", "insert", "inserts",
      "inserted", "put", "puts", "enter", "enters", "entered", "log", "logs", "logged", "maintain", "maintains",
      "maintained", "amend", "amends", "amended", "change", "changes", "changed", "extend", "extends", "extended",
      "rewrite", "rewrites", "rewrote", "rewritten", "replace", "replaces", "replaced", "remove", "removes",
      "removed", "delete", "deletes", "deleted",
    ];
    expect(plan3732.filter((v) => !HAND_TRACE_WRITE_VERBS.includes(v)), "a plan 37-32 verb was dropped").toEqual([]);
    // Copy and paste joined the list in plan 37-39 (deferred-items.md, plan 37-32 entry).
    for (const base of ["copy", "paste"]) {
      expect(HAND_TRACE_VERB_GROUPS.some((g) => g[0] === base), `no ${base} group`).toBe(true);
    }
  });

  it("each pattern returns in under RUNTIME_CEILING_MS on 20,000-character adversarial inputs, line and paragraph", () => {
    // No input holds the word trace, so every pattern fails; a backtracking pattern fails slowly. `the a ` and
    // `ticket's ` (plan 37-39) are runs of pattern 4's determiners, where its determiner and two-word run start.
    const inputs = ["add ".repeat(5000), "add the ".repeat(2500), "the a ".repeat(3334), "ticket's ".repeat(2223)];
    for (const input of inputs) {
      expect(input.length).toBeGreaterThanOrEqual(20000);
      for (const p of HAND_TRACE_PATTERNS) {
        const t0 = performance.now();
        const matched = p.test(input);
        const ms = performance.now() - t0;
        expect(matched, `${p} matched an input with no trace`).toBe(false);
        expect(ms, `${p} took ${ms.toFixed(1)} ms on ${input.length} characters`).toBeLessThan(RUNTIME_CEILING_MS);
      }
      const wrapped = wrap(input, 80);
      expect(wrapped.split("\n").length, "the wrapped text is one line, so it tests no paragraph join").toBeGreaterThan(1);
      const t0 = performance.now();
      const hits = paragraphHitsIn("seed.md", wrapped);
      const ms = performance.now() - t0;
      expect(hits).toEqual([]);
      expect(ms, `the paragraph scan took ${ms.toFixed(1)} ms`).toBeLessThan(RUNTIME_CEILING_MS);
    }
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
    // Plan 37-32 (WR-08): a pattern-4 sentence wrapped before its object.
    ["`Append the PR link to` / `the trace.`", "Append the PR link to", "the trace."],
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

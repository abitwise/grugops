// trace-model.test.ts — the pure trace model (phase 37, plans 37-06 and 37-07, SPLIT-03, D-01, D-02, D-03).
//
// Drives the committed scripts/trace-model.js: ref classification, the row merge, the per-ticket and index
// text, the tree plan, the note collection over two context roots with a task whose read throws, and the two
// cross-plan contracts with plans 37-13 and 37-18. Those two read the validator's own index-line rule
// (state-rules' indexLineFindings over board-model's comment blanking) with the imported BUDGETS, and the
// imported HAND_TRACE_PATTERNS, so no number and no pattern is retyped here. The one copied list is pattern 1's verbs at
// 45c04b27 (plan 37-32), a historical floor HAND_TRACE_WRITE_VERBS may only widen, not a pattern.
//
// Pure: nothing here touches the file system.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import {
  HAND_TRACE_PATTERNS,
  HAND_TRACE_WRITE_VERBS,
  TRACE_GENERATED_HEADER,
  TRACE_LINK_DIR,
  buildTraceRows,
  classifyRef,
  collectTraceNotes,
  compareCodeUnits,
  isTicketRef,
  planTraceTree,
  renderTicketTrace,
  renderTraceIndex,
  traceFileName,
  type TraceRow,
} from "./trace-model.js";
import * as model from "./trace-model.js";
import { indexLineFindings } from "./state-rules.js";
import { isTicketId, normalizeDocument, stripHtmlComments } from "./board-model.js";
import { BUDGETS, TRACE_DIR_REL, TRACEABILITY_REL } from "../install/state-layout.js";
import { EMBED_CLOSE, EMBED_SPECS } from "./generate-runnable-embeds.js";

/** A row with nothing classified, for the index cases (the index reads only the id). */
function bareRow(id: string): TraceRow {
  return { id, Requirement: [], Code: [], Tests: [], UAT: [], Release: [] };
}

// Plan 37-22 (WR-01): `abc-3` was a third row here, a lowercase ticket the board grammar never admits. The rows are
// now the two board identifiers, in an order that code units sort differently from the input.
const INDEX_ROWS = ["ABC-2", "ABC-10"].map(bareRow);

describe("classifyRef: the trace slot each ref shape fills (D-06)", () => {
  it.each([
    ["UAT-12", "UAT"],
    ["REL-0007", "Release"],
    ["NFR-002", "Requirement"],
    ["EPIC-003", "Requirement"],
    ["FEAT-007", "Requirement"],
    ["ADR-004", "Requirement"],
    ["fx.spec.ts", "Tests"],
    ["src/fx/rate.test.ts", "Tests"],
    ["e2e/login.ts", "Tests"],
    ["#41", "Code"],
    ["src/fx/rate.ts", "Code"],
  ])("%s is classified as %s", (ref, expected) => {
    expect(classifyRef(ref, isTicketId)).toBe(expected);
  });

  it("the ticket identifier itself is no cell, and an unshaped word is none either", () => {
    expect(classifyRef("ABC-012", isTicketId)).toBeNull();
    expect(isTicketRef("ABC-012", isTicketId)).toBe(true);
    expect(isTicketRef("NFR-002", isTicketId)).toBe(false);
    expect(isTicketRef("ABC-01/x", isTicketId)).toBe(false);
    expect(classifyRef("prose", isTicketId)).toBeNull();
  });
});

describe("buildTraceRows: one row per ticket, refs merged first-seen without duplicates", () => {
  it("a note carrying [ABC-012, #41, fx.spec.ts, REL-0007] yields one ABC-012 row with those cells", () => {
    const rows = buildTraceRows([{ refs: ["ABC-012", "#41", "fx.spec.ts", "REL-0007"] }], isTicketId);
    expect(rows).toEqual([
      { id: "ABC-012", Requirement: [], Code: ["#41"], Tests: ["fx.spec.ts"], UAT: [], Release: ["REL-0007"] },
    ]);
  });

  it("two notes for one ticket merge their refs first-seen and de-duplicated", () => {
    const rows = buildTraceRows(
      [
        { refs: ["ABC-012", "#41", "NFR-002"] },
        { refs: ["#40", "ABC-012", "#41", "UAT-1"] },
        { refs: ["#99"] },
      ],
      isTicketId,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.Code).toEqual(["#41", "#40"]);
    expect(rows[0]?.Requirement).toEqual(["NFR-002"]);
    expect(rows[0]?.UAT).toEqual(["UAT-1"]);
  });

  it("rows sort by code units, so the order does not depend on the locale; a lowercase ref is no ticket (plan 37-22)", () => {
    const rows = buildTraceRows([{ refs: ["abc-3"] }, { refs: ["ABC-2"] }, { refs: ["ABC-10"] }], isTicketId);
    expect(rows.map((r) => r.id)).toEqual(["ABC-10", "ABC-2"]);
    expect(compareCodeUnits("B", "a")).toBe(-1);
    expect(compareCodeUnits("a", "a")).toBe(0);
  });
});

describe("renderTraceIndex: the one-line-per-ticket index (D-01)", () => {
  it("starts with the generated header and has one linked line per row, in code-unit order", () => {
    const lines = renderTraceIndex(INDEX_ROWS).split("\n");
    expect(lines[0]).toBe(TRACE_GENERATED_HEADER);
    expect(lines).toContain("| Ticket | Trace |");
    const rowLines = lines.filter((l) => l.startsWith("| ") && l.includes("]("));
    expect(rowLines).toEqual([
      "| ABC-10 | [ABC-10](traceability/ABC-10.md) |",
      "| ABC-2 | [ABC-2](traceability/ABC-2.md) |",
    ]);
    expect(renderTraceIndex(INDEX_ROWS).endsWith("|\n")).toBe(true);
    expect(renderTraceIndex(INDEX_ROWS).endsWith("\n\n")).toBe(false);
  });

  it("the index links resolve to TRACE_DIR_REL beside TRACEABILITY_REL", () => {
    expect(`${dirname(TRACEABILITY_REL)}/${TRACE_LINK_DIR}`).toBe(TRACE_DIR_REL);
  });

  it.each([
    ["zero rows", [] as TraceRow[]],
    ["two rows", INDEX_ROWS],
  ])("CROSS-PLAN (37-13): every line of the %s index fits BUDGETS.indexEntryBytes outside comments", (_label, rows) => {
    const normalized = normalizeDocument(renderTraceIndex(rows));
    const findings = indexLineFindings(TRACEABILITY_REL, { normalized, blanked: stripHtmlComments(normalized) }, BUDGETS);
    expect(findings).toEqual([]);
    // PREMISE: the rule is live on this text. A line one byte over the budget is a finding.
    const over = `${normalized}${"x".repeat(BUDGETS.indexEntryBytes + 1)}\n`;
    expect(indexLineFindings(TRACEABILITY_REL, { normalized: over, blanked: stripHtmlComments(over) }, BUDGETS)).toHaveLength(1);
  });
});

describe("HAND_TRACE_PATTERNS: the one home of the hand-trace scan patterns (plan 37-18)", () => {
  it("has exactly four members, case-insensitive and without the g flag, each matching its own control line", () => {
    expect(HAND_TRACE_PATTERNS).toHaveLength(4);
    expect(Object.isFrozen(HAND_TRACE_PATTERNS)).toBe(true);
    for (const p of HAND_TRACE_PATTERNS) {
      expect(p.flags.includes("i")).toBe(true);
      expect(p.flags.includes("g")).toBe(false);
    }
    const [handEdit, oldShape, oldShapeNoWord] = HAND_TRACE_PATTERNS as [RegExp, RegExp, RegExp];
    expect(handEdit.test("Append to traceability.md the PR link")).toBe(true);
    expect(handEdit.test("the traceability matrix")).toBe(false);
    expect(oldShape.test("the traceability matrix")).toBe(true);
    expect(oldShape.test("Append to traceability.md the PR link")).toBe(false);
    // Plan 37-27 (SCAN-1): the third names the retired matrix shape without the word traceability.
    expect(oldShapeNoWord.test("write trace row")).toBe(true);
    expect(oldShapeNoWord.test("Append to traceability.md the PR link")).toBe(false);
    // Plan 37-32 (D-18, WR-08): the fourth aims a write verb at the trace in any spelling.
    const toTheTrace = HAND_TRACE_PATTERNS[3]!;
    expect(toTheTrace.test("Append the PR link to the trace.")).toBe(true);
    expect(toTheTrace.test("Update its trace file.")).toBe(true);
    expect(toTheTrace.test("No step edits a trace file or the index by hand.")).toBe(false);
    // Plan 37-39 (D-19, WR-11): the `-ing` form of a listed verb is a write verb too.
    expect(toTheTrace.test("Keep updating the trace file by hand.")).toBe(true);
    // Pattern 1's bound crosses a path's dot and stops at a sentence end.
    expect(handEdit.test("Add the test path to ./memory-bank/plans/traceability.md.")).toBe(true);
    expect(handEdit.test("Add the test path. The traceability index is rendered.")).toBe(false);
  });

  it("HAND_TRACE_WRITE_VERBS is frozen, letters and hyphens only, and holds every verb pattern 1 held at 45c04b27", () => {
    expect(Object.isFrozen(HAND_TRACE_WRITE_VERBS)).toBe(true);
    for (const v of HAND_TRACE_WRITE_VERBS) expect(v, "a verb needs escaping in a RegExp").toMatch(/^[a-z-]+$/);
    expect(new Set(HAND_TRACE_WRITE_VERBS).size, "a verb is listed twice").toBe(HAND_TRACE_WRITE_VERBS.length);
    // Pattern 1's verbs at 45c04b27, copied from its alternation then: the list may only widen pattern 1.
    const before = [
      "append", "appends", "add", "adds", "write", "writes", "wrote", "written", "fill", "fills", "update",
      "updates", "updated", "record", "records", "edit", "edits", "edited", "hand-edit", "hand-edits",
      "hand-edited", "modify", "modifies", "modified",
    ];
    expect(before.filter((v) => !HAND_TRACE_WRITE_VERBS.includes(v))).toEqual([]);
    // Patterns 1 and 4 are built from the list: every verb starts a match of each.
    const [handEdit, , , toTheTrace] = HAND_TRACE_PATTERNS as [RegExp, RegExp, RegExp, RegExp];
    for (const v of HAND_TRACE_WRITE_VERBS) {
      expect(handEdit.test(`${v} traceability`), `pattern 1 misses ${v}`).toBe(true);
      expect(toTheTrace.test(`${v} the trace`), `pattern 4 misses ${v}`).toBe(true);
    }
  });

  it.each([
    ["zero rows", [] as TraceRow[]],
    ["two rows", INDEX_ROWS],
  ])("CROSS-PLAN (37-18): no line of the %s index matches any pattern, the header comment included", (_label, rows) => {
    const lines = renderTraceIndex(rows).split("\n");
    expect(lines[0]).toBe(TRACE_GENERATED_HEADER);
    for (const line of lines) {
      for (const p of HAND_TRACE_PATTERNS) expect(p.test(line), `${p} matched: ${line}`).toBe(false);
    }
  });
});

describe("renderTicketTrace and traceFileName: one ticket's trace file", () => {
  it("has the header, a title and every trace slot in order, each a bullet list or `None recorded.`", () => {
    const row: TraceRow = {
      id: "ABC-012",
      Requirement: ["NFR-002"],
      Code: ["#41", "a|b"],
      Tests: [],
      UAT: [],
      Release: ["REL-0007"],
    };
    expect(renderTicketTrace(row)).toBe(
      [
        TRACE_GENERATED_HEADER,
        "# Trace: ABC-012",
        "",
        "## Requirement",
        "",
        "- NFR-002",
        "",
        "## Code",
        "",
        "- #41",
        "- a\\|b",
        "",
        "## Tests",
        "",
        "None recorded.",
        "",
        "## UAT",
        "",
        "None recorded.",
        "",
        "## Release",
        "",
        "- REL-0007",
        "",
      ].join("\n"),
    );
    expect(traceFileName("ABC-012")).toBe("ABC-012.md");
  });

  it("a ref holding a line break is flattened, so it cannot start a new markdown line", () => {
    const text = renderTicketTrace({ ...bareRow("ABC-1"), Code: ["a\n# b", "c\rd"] });
    expect(text).toContain("- a # b\n");
    expect(text).toContain("- c d\n");
  });
});

describe("collectTraceNotes and planTraceTree: two roots, a failing task, the planned tree (D-03)", () => {
  it("reads both roots in order, keeps every skip with its arm, and names a task whose read throws", () => {
    const io = {
      listTasks: (root: string) => (root === "live" ? ["t2", "t1", "bad"] : ["t9"]),
      readTask: (task: string, root: string) => {
        if (task === "bad") throw new Error("task name refused");
        return {
          notes: [{ refs: [`${root === "live" ? "ABC" : "ARC"}-${task.slice(1)}`] }],
          skipped: task === "t1" ? [{ file: "x.md", arm: "unsealed", detail: "absent" }] : [],
        };
      },
    };
    const c = collectTraceNotes(["live", "archive"], io);
    expect(c.tasks).toBe(4);
    expect(c.notes.map((n) => n.refs[0])).toEqual(["ABC-1", "ABC-2", "ARC-9"]);
    expect(c.skipped).toEqual([{ root: "live", task: "t1", file: "x.md", arm: "unsealed", detail: "absent" }]);
    expect(c.failedTasks).toEqual([{ root: "live", task: "bad", reason: "task name refused", remedy: null }]);
    // A ticket whose notes sit only in the archive root still gets a row.
    expect(buildTraceRows(c.notes, isTicketId).map((r) => r.id)).toEqual(["ABC-1", "ABC-2", "ARC-9"]);
  });

  it("collectTraceNotes records a thrown value's own string remedy, and null for any other thrown value (plan 37-37, IN-11)", () => {
    const withRemedy = Object.assign(new Error("it is not a directory, so it is not a task"), { remedy: "move it" });
    const emptyRemedy = Object.assign(new Error("empty"), { remedy: "" });
    const numberRemedy = Object.assign(new Error("number"), { remedy: 7 });
    const inherited = Object.create(Object.assign(new Error("proto"), { remedy: "from the prototype" })) as Error;
    const thrown: Record<string, unknown> = {
      a: withRemedy,
      b: new Error("EACCES: permission denied"),
      c: emptyRemedy,
      d: numberRemedy,
      e: "a string",
      f: inherited,
    };
    const io = {
      listTasks: () => Object.keys(thrown),
      readTask: (task: string): never => {
        throw thrown[task];
      },
    };
    const c = collectTraceNotes(["live"], io);
    expect(c.failedTasks.map((f) => `${f.task}:${f.remedy === null ? "null" : f.remedy}`)).toEqual([
      "a:move it",
      "b:null",
      "c:null",
      "d:null",
      "e:null",
      "f:null",
    ]);
    expect(c.failedTasks[0]).toEqual({
      root: "live",
      task: "a",
      reason: "it is not a directory, so it is not a task",
      remedy: "move it",
    });
  });

  it("plans the index first, then one file per ticket under the trace directory, in code-unit order", () => {
    const plan = planTraceTree(INDEX_ROWS, TRACEABILITY_REL, TRACE_DIR_REL);
    expect([...plan.keys()]).toEqual([
      TRACEABILITY_REL,
      `${TRACE_DIR_REL}/ABC-10.md`,
      `${TRACE_DIR_REL}/ABC-2.md`,
    ]);
    expect(plan.get(TRACEABILITY_REL)).toBe(renderTraceIndex(INDEX_ROWS));
    expect(plan.get(`${TRACE_DIR_REL}/ABC-2.md`)).toBe(renderTicketTrace(bareRow("ABC-2")));
    expect([...planTraceTree([], TRACEABILITY_REL, TRACE_DIR_REL).keys()]).toEqual([TRACEABILITY_REL]);
  });
});

// ── Plan 37-07: the owned-entry rule, case-fold collisions and the tree comparison ─────────────────────────
// The new exports are read through the namespace import `model`, so until they exist each case fails on its
// own call rather than the whole file failing to load.

/** A fake repository: absolute path → text. A listing returns the direct children of a directory. */
function fakeTree(root: string, files: Record<string, string>, reads: string[] = []) {
  const map = new Map(Object.entries(files).map(([rel, text]) => [`${root}/${rel}`, text]));
  return {
    readText(path: string): string | null {
      reads.push(path);
      return map.get(path) ?? null;
    },
    listDir(path: string): readonly string[] | null {
      const prefix = `${path}/`;
      const names = [...map.keys()].filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
      return names.length === 0 ? null : names.filter((n) => !n.includes("/"));
    },
  };
}

const ROWS_AB = buildTraceRows([{ refs: ["ABC-1", "#41"] }, { refs: ["ABC-2", "UAT-3"] }], isTicketId);

function freshFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [rel, text] of planTraceTree(ROWS_AB, TRACEABILITY_REL, TRACE_DIR_REL)) files[rel] = text;
  return files;
}

function compare(files: Record<string, string>, reads: string[] = []) {
  const plan = planTraceTree(ROWS_AB, TRACEABILITY_REL, TRACE_DIR_REL);
  return model.compareTraceTree(plan, "/r", fakeTree("/r", files, reads), TRACEABILITY_REL, TRACE_DIR_REL);
}

describe("ownedTraceEntries: the record rule for the trace tree (plan 37-01 contract)", () => {
  it("keeps the names that do not begin with `.`, in code-unit order", () => {
    expect(model.ownedTraceEntries(["ABC-2.md", ".gitkeep", "ABC-10.md", ".DS_Store"])).toEqual(["ABC-10.md", "ABC-2.md"]);
    expect(model.ownedTraceEntries([])).toEqual([]);
  });
});

describe("caseFoldCollisions: identifiers whose trace file names fold to one name (research Pitfall 11)", () => {
  it("groups every identifier whose lower-case file name collides, each group and the groups in code-unit order", () => {
    expect(model.caseFoldCollisions(["abc-1", "ABC-2", "ABC-1", "xyz-3", "Abc-1", "XYZ-3"])).toEqual([
      ["ABC-1", "Abc-1", "abc-1"],
      ["XYZ-3", "xyz-3"],
    ]);
  });

  it("no collision is an empty list, and one identifier given twice is not a collision", () => {
    expect(model.caseFoldCollisions(["ABC-1", "ABC-2", "ABC-1"])).toEqual([]);
  });
});

describe("compareTraceTree: the one comparison render and state-check share (D-01, D-02)", () => {
  it("a fresh tree has no difference", () => {
    expect(compare(freshFiles())).toEqual({ missing: [], extra: [], changed: [], handWritten: [] });
  });

  it("names a missing file, a changed file and an extra generated file, by repository-relative path", () => {
    const files = freshFiles();
    delete files[`${TRACE_DIR_REL}/ABC-1.md`];
    files[`${TRACE_DIR_REL}/ABC-2.md`] += "x";
    files[`${TRACE_DIR_REL}/ABC-9.md`] = `${TRACE_GENERATED_HEADER}\n# Trace: ABC-9\n`;
    expect(compare(files)).toEqual({
      missing: [`${TRACE_DIR_REL}/ABC-1.md`],
      extra: [`${TRACE_DIR_REL}/ABC-9.md`],
      changed: [`${TRACE_DIR_REL}/ABC-2.md`],
      handWritten: [],
    });
  });

  it("a planned or extra file whose first line is not the generated header is hand-written, never changed or extra", () => {
    const files = freshFiles();
    files[TRACEABILITY_REL] = "# Traceability Matrix\n| Ticket | Code |\n";
    files[`${TRACE_DIR_REL}/notes.md`] = "my own notes\n";
    const r = compare(files);
    expect(r.handWritten).toEqual([`${TRACE_DIR_REL}/notes.md`, TRACEABILITY_REL].sort(compareCodeUnits));
    expect(r.changed).toEqual([]);
    expect(r.extra).toEqual([]);
  });

  it("a directory keeper and operating-system metadata are never read, compared or reported", () => {
    const files = freshFiles();
    files[`${TRACE_DIR_REL}/.gitkeep`] = "";
    files[`${TRACE_DIR_REL}/.DS_Store`] = "binary";
    const reads: string[] = [];
    expect(compare(files, reads)).toEqual({ missing: [], extra: [], changed: [], handWritten: [] });
    expect(reads.filter((p) => p.includes("/."))).toEqual([]);
  });

  it("an absent trace directory compares the index alone, so a hand-written index still fails (no vacuous pass)", () => {
    const empty = new Map([[TRACEABILITY_REL, renderTraceIndex([])]]);
    const io = fakeTree("/r", { [TRACEABILITY_REL]: "# Traceability Matrix\n" });
    expect(model.compareTraceTree(empty, "/r", io, TRACEABILITY_REL, TRACE_DIR_REL).handWritten).toEqual([TRACEABILITY_REL]);
    const fresh = fakeTree("/r", { [TRACEABILITY_REL]: renderTraceIndex([]) });
    expect(model.compareTraceTree(empty, "/r", fresh, TRACEABILITY_REL, TRACE_DIR_REL)).toEqual({
      missing: [],
      extra: [],
      changed: [],
      handWritten: [],
    });
  });

  it("a refusal from the text reader propagates, so the caller reports could-not-run", () => {
    const io = {
      readText(): string | null {
        throw new Error("refused: not a regular file");
      },
      listDir: () => null,
    };
    const plan = new Map([[TRACEABILITY_REL, "x"]]);
    expect(() => model.compareTraceTree(plan, "/r", io, TRACEABILITY_REL, TRACE_DIR_REL)).toThrow(
      "refused: not a regular file",
    );
  });

  it("isGeneratedTraceText reads the first line only, and accepts a CRLF line end on it", () => {
    expect(model.isGeneratedTraceText(`${TRACE_GENERATED_HEADER}\nbody\n`)).toBe(true);
    expect(model.isGeneratedTraceText(`${TRACE_GENERATED_HEADER}\r\nbody\r\n`)).toBe(true);
    expect(model.isGeneratedTraceText(`x\n${TRACE_GENERATED_HEADER}\n`)).toBe(false);
    expect(model.isGeneratedTraceText("")).toBe(false);
  });
});

// ── Plan 37-21 (D-17, CR-01, READ-1): one predicate decides that the note read was complete ─────────────────
// The reader's skip arms are imported from the committed context-io.js, so a new reader arm reaches these cases
// without an edit here and is a read failure until TRACE_TRUST_SKIP_ARMS classifies it.

const ctxio: typeof import("./context-io.js") = await import(
  pathToFileURL(join(import.meta.dirname, "context-io.js")).href
);

/** The four reader arms that are I/O conditions, not trust decisions (37-GAP-PLANNING-BRIEF.md READ-1). */
const IO_ARMS = ["unopenable", "not-a-regular-file", "above-ceiling", "vanished"];

/** A collection with no failure: two tasks, one note each, and one skip under each trust arm. */
function completeCollection(): model.TraceCollection {
  return {
    tasks: 2,
    notes: [{ refs: ["ABC-1", "src/a.ts"] }, { refs: ["ABC-2"] }],
    skipped: [
      { root: "live", task: "t1", file: "hand.md", arm: "unsealed", detail: "absent" },
      { root: "archive", task: "t2", file: "junk.md", arm: "unparseable", detail: "" },
    ],
    failedTasks: [],
  };
}

describe("traceReadFailures and planCompleteTraceTree: an incomplete read gives no plan (plan 37-21, CR-01)", () => {
  it("the partition: NOTE_SKIP_ARMS minus TRACE_TRUST_SKIP_ARMS is exactly the four I/O arms", () => {
    const trust = model.TRACE_TRUST_SKIP_ARMS;
    expect(trust).toHaveLength(2);
    for (const arm of trust) expect(ctxio.NOTE_SKIP_ARMS as readonly string[]).toContain(arm);
    const io = ctxio.NOTE_SKIP_ARMS.filter((arm) => !trust.includes(arm));
    expect(io).toHaveLength(4);
    expect([...io].sort()).toEqual([...IO_ARMS].sort());
    expect(Object.isFrozen(trust)).toBe(true);
  });

  it("a failed task is a failure with file and arm null; each I/O arm is a failure; each trust arm is not; an unknown arm is", () => {
    const base = completeCollection();
    expect(model.traceReadFailures(base)).toEqual([]);
    const failed = model.traceReadFailures({
      ...base,
      failedTasks: [{ root: "live", task: "bad", reason: "EACCES: permission denied", remedy: null }],
    });
    expect(failed).toEqual([
      { root: "live", task: "bad", file: null, arm: null, reason: "EACCES: permission denied", remedy: null },
    ]);
    for (const arm of IO_ARMS) {
      const got = model.traceReadFailures({
        ...base,
        skipped: [...base.skipped, { root: "archive", task: "t3", file: "x.md", arm, detail: arm === "vanished" ? "" : "why" }],
      });
      expect(got, arm).toHaveLength(1);
      expect(got[0]?.file).toBe("x.md");
      expect(got[0]?.arm).toBe(arm);
      expect(got[0]?.reason.length, `${arm} carries a reason`).toBeGreaterThan(0);
    }
    for (const arm of model.TRACE_TRUST_SKIP_ARMS) {
      const got = model.traceReadFailures({
        ...base,
        skipped: [{ root: "live", task: "t4", file: "y.md", arm, detail: "" }],
      });
      expect(got, arm).toEqual([]);
    }
    const unknown = model.traceReadFailures({
      ...base,
      skipped: [{ root: "live", task: "t5", file: "z.md", arm: "future-arm", detail: "" }],
    });
    expect(unknown.map((f) => f.arm)).toEqual(["future-arm"]);
  });

  it("traceReadFailures passes a failed task's remedy through and gives null for a skipped note (plan 37-37, IN-11)", () => {
    const got = model.traceReadFailures({
      tasks: 2,
      notes: [],
      skipped: [{ root: "live", task: "a", file: "1.md", arm: "unopenable", detail: "EACCES" }],
      failedTasks: [
        { root: "live", task: "README.md", reason: "it is not a directory, so it is not a task", remedy: "move it" },
        { root: "archive", task: "b", reason: "EACCES", remedy: null },
      ],
    });
    expect(got).toEqual([
      { root: "live", task: "README.md", file: null, arm: null, reason: "it is not a directory, so it is not a task", remedy: "move it" },
      { root: "archive", task: "b", file: null, arm: null, reason: "EACCES", remedy: null },
      { root: "live", task: "a", file: "1.md", arm: "unopenable", reason: "EACCES", remedy: null },
    ]);
  });

  it("failures come in collection order: every failed task, then every non-trust skip", () => {
    const got = model.traceReadFailures({
      tasks: 3,
      notes: [],
      skipped: [
        { root: "live", task: "a", file: "1.md", arm: "vanished", detail: "" },
        { root: "live", task: "a", file: "2.md", arm: "unsealed", detail: "absent" },
        { root: "archive", task: "c", file: "3.md", arm: "unopenable", detail: "EACCES" },
      ],
      failedTasks: [{ root: "archive", task: "b", reason: "refused", remedy: null }],
    });
    expect(got.map((f) => `${f.root}/${f.task}/${f.file ?? "-"}`)).toEqual(["archive/b/-", "live/a/1.md", "archive/c/3.md"]);
  });

  it("on a complete collection the plan equals buildTraceRows plus planTraceTree; on an incomplete one there is no plan", () => {
    const c = completeCollection();
    const done = model.planCompleteTraceTree(c, isTicketId, TRACEABILITY_REL, TRACE_DIR_REL);
    expect(done.complete).toBe(true);
    if (!done.complete) throw new Error("unreachable");
    const rows = buildTraceRows(c.notes, isTicketId);
    expect(done.rows).toEqual(rows);
    expect([...done.plan]).toEqual([...planTraceTree(rows, TRACEABILITY_REL, TRACE_DIR_REL)]);
    const partial = model.planCompleteTraceTree(
      { ...c, failedTasks: [{ root: "live", task: "t9", reason: "EACCES", remedy: null }] },
      isTicketId,
      TRACEABILITY_REL,
      TRACE_DIR_REL,
    );
    expect(partial.complete).toBe(false);
    expect("plan" in partial).toBe(false);
    expect("rows" in partial).toBe(false);
    if (partial.complete) throw new Error("unreachable");
    expect(partial.failures).toHaveLength(1);
  });

  // One authority (37-GAP-PLANNING-BRIEF.md §2.2): the hand-written part of each runnable obtains its plan only
  // from the generated planCompleteTraceTree, called once, and never builds rows or plans a tree itself.
  for (const target of ["scripts/runnable-ref/trace-render.ts", "scripts/runnable-ref/state-check.ts"]) {
    it(`census: after EMBED_CLOSE, ${target} calls planCompleteTraceTree once and never names buildTraceRows or planTraceTree`, () => {
      expect(EMBED_SPECS.map((s) => s.target)).toContain(target);
      const text = readFileSync(join(import.meta.dirname, "..", ...target.split("/")), "utf8");
      const close = text.split("\n").indexOf(EMBED_CLOSE);
      expect(close, `PREMISE: ${target} carries the region's close line`).toBeGreaterThan(0);
      const hand = text.split("\n").slice(close + 1).join("\n");
      const source = ts.createSourceFile(target, hand, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
      const calls: string[] = [];
      const names: string[] = [];
      const walk = (n: ts.Node): void => {
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) calls.push(n.expression.text);
        if (ts.isIdentifier(n)) names.push(n.text);
        ts.forEachChild(n, walk);
      };
      walk(source);
      expect(calls.filter((c) => c === "planCompleteTraceTree")).toHaveLength(1);
      expect(names.filter((x) => x === "buildTraceRows" || x === "planTraceTree")).toEqual([]);
      expect(calls.filter((c) => c === "collectTraceNotes")).toHaveLength(1);
    });
  }
});

// ── Plan 37-22 (D-17, WR-01, AUTH-1): the trace and the board agree on which refs are tickets ────────────────
// One owner answers "is this a ticket identifier": scripts/board-model.ts isTicketId. The trace adds only its
// reserved structural prefixes. The corpus pins today's answer (CWE-79 stays ticket-shaped, as the board grammar
// says), so a later change to either side is visible here.

/** The longest identifier the board grammar admits: a 16-character prefix and 9 digits. */
const LONGEST_BOARD_ID = `A${"Z".repeat(15)}-123456789`;

const AGREEMENT_CORPUS: readonly string[] = [
  "ABC-1",
  "CWE-79",
  "utf-8",
  "abc-1",
  `${"A".repeat(300)}-1`,
  "EPIC-1",
  "FEAT-2",
  "NFR-1",
  "ADR-3",
  "UAT-4",
  "REL-5",
  LONGEST_BOARD_ID,
  `A${"Z".repeat(16)}-1`,
  "ABC-1234567890",
  " ABC-1",
  "ABC-1 ",
  "ABC--1",
  "ABC-1/x",
];

/** The trace's reserved structural prefixes, as the trace model states them (never a ticket). */
const RESERVED = ["EPIC", "FEAT", "NFR", "ADR", "RISK", "REL", "INC", "UAT"];
const reservedPrefix = (x: string): boolean => RESERVED.includes(x.slice(0, x.lastIndexOf("-")));

describe("AUTH-1 agreement: the trace's ticket test is the board grammar's, minus the reserved prefixes (plan 37-22, WR-01)", () => {
  it("the corpus has 18 members, and isTicketRef(x) is isTicketId(x) and not reserved for every one", () => {
    expect(AGREEMENT_CORPUS).toHaveLength(18);
    expect(new Set(AGREEMENT_CORPUS).size).toBe(18);
    for (const x of AGREEMENT_CORPUS) {
      const label = x.length > 40 ? `${x.slice(0, 12)}...(${x.length} chars)` : JSON.stringify(x);
      expect(isTicketRef(x, isTicketId), label).toBe(isTicketId(x) && !reservedPrefix(x));
      if (isTicketRef(x, isTicketId)) expect(isTicketId(x), `the trace accepted ${label}, which the board refuses`).toBe(true);
    }
  });

  it("today's answer is pinned: exactly ABC-1, CWE-79 and the longest board identifier are tickets", () => {
    expect(AGREEMENT_CORPUS.filter((x) => isTicketRef(x, isTicketId))).toEqual(["ABC-1", "CWE-79", LONGEST_BOARD_ID]);
    // PREMISE: the board grammar itself refuses the shapes the old trace shape admitted.
    for (const x of ["utf-8", "abc-1", `${"A".repeat(300)}-1`, `A${"Z".repeat(16)}-1`, "ABC-1234567890"]) {
      expect(isTicketId(x), x.slice(0, 20)).toBe(false);
    }
    expect(LONGEST_BOARD_ID).toHaveLength(26);
  });

  it("the longest board identifier fits the index line budget and the file-name limit", () => {
    const normalized = normalizeDocument(renderTraceIndex([bareRow(LONGEST_BOARD_ID)]));
    expect(indexLineFindings(TRACEABILITY_REL, { normalized, blanked: stripHtmlComments(normalized) }, BUDGETS)).toEqual([]);
    expect(normalized).toContain(`| ${LONGEST_BOARD_ID} | [${LONGEST_BOARD_ID}](traceability/${LONGEST_BOARD_ID}.md) |`);
    expect(Buffer.byteLength(traceFileName(LONGEST_BOARD_ID), "utf8")).toBeLessThanOrEqual(model.TRACE_FILE_NAME_MAX_BYTES);
    expect(model.TRACE_FILE_NAME_MAX_BYTES).toBe(255);
  });

  it("no two distinct identifiers the board admits fold to one trace file name", () => {
    const admitted = AGREEMENT_CORPUS.filter((x) => isTicketId(x));
    expect(admitted.length).toBeGreaterThan(1);
    for (const id of admitted) expect(id).toBe(id.toUpperCase());
    expect(model.caseFoldCollisions(admitted)).toEqual([]);
    expect(new Set(admitted.map((id) => traceFileName(id).toLowerCase())).size).toBe(admitted.length);
  });

  it("isTicketRef's body asks its predicate parameter and holds no regular-expression literal of its own", () => {
    const path = join(import.meta.dirname, "trace-model.ts");
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    const fns = source.statements.filter(
      (s): s is ts.FunctionDeclaration => ts.isFunctionDeclaration(s) && s.name?.text === "isTicketRef",
    );
    expect(fns).toHaveLength(1);
    const fn = fns[0] as ts.FunctionDeclaration;
    expect(fn.parameters).toHaveLength(2);
    const predicate = (fn.parameters[1] as ts.ParameterDeclaration).name;
    expect(ts.isIdentifier(predicate)).toBe(true);
    const predicateName = (predicate as ts.Identifier).text;
    const called: string[] = [];
    let regexLiterals = 0;
    const walk = (n: ts.Node): void => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) called.push(n.expression.text);
      if (n.kind === ts.SyntaxKind.RegularExpressionLiteral) regexLiterals += 1;
      ts.forEachChild(n, walk);
    };
    walk(fn.body as ts.Block);
    expect(called).toContain(predicateName);
    expect(regexLiterals).toBe(0);
  });
});

describe("traceFileNameRefusals: every planned trace file name is legal before the first write (plan 37-22, WR-01)", () => {
  const page = (rel: string): Map<string, string> => new Map([[TRACEABILITY_REL, "index"], [rel, "text"]]);

  it("a planned abc-1.md is one reason: abc-1 is not an identifier the board grammar admits", () => {
    const reasons = model.traceFileNameRefusals(page(`${TRACE_DIR_REL}/abc-1.md`), TRACE_DIR_REL, isTicketId);
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toContain(`${TRACE_DIR_REL}/abc-1.md: `);
  });

  it("a planned 300-letter name is one reason, under the board grammar and under a predicate that admits it", () => {
    const rel = `${TRACE_DIR_REL}/${"A".repeat(300)}-1.md`;
    expect(model.traceFileNameRefusals(page(rel), TRACE_DIR_REL, isTicketId)).toHaveLength(1);
    // The byte limit is its own arm: with a predicate that admits the name, the length alone refuses it.
    const admitAll = (): boolean => true;
    const byLength = model.traceFileNameRefusals(page(rel), TRACE_DIR_REL, admitAll);
    expect(byLength).toHaveLength(1);
    expect(byLength[0]).toContain(`over the ${model.TRACE_FILE_NAME_MAX_BYTES}-byte limit`);
  });

  it("the plan of the whole corpus has no refusal, and the reasons come one per key in code-unit order", () => {
    const rows = buildTraceRows([{ refs: [...AGREEMENT_CORPUS] }], isTicketId);
    expect(rows.map((r) => r.id)).toEqual(["ABC-1", LONGEST_BOARD_ID, "CWE-79"].sort(compareCodeUnits));
    const plan = planTraceTree(rows, TRACEABILITY_REL, TRACE_DIR_REL);
    expect(model.traceFileNameRefusals(plan, TRACE_DIR_REL, isTicketId)).toEqual([]);
    const bad = new Map(plan);
    bad.set(`${TRACE_DIR_REL}/zz-1.md`, "x");
    bad.set(`${TRACE_DIR_REL}/ABC-1.txt`, "x");
    bad.set(`${TRACE_DIR_REL}/sub/ABC-2.md`, "x");
    const reasons = model.traceFileNameRefusals(bad, TRACE_DIR_REL, isTicketId);
    expect(reasons.map((r) => r.slice(0, r.indexOf(": ")))).toEqual(
      [`${TRACE_DIR_REL}/ABC-1.txt`, `${TRACE_DIR_REL}/sub/ABC-2.md`, `${TRACE_DIR_REL}/zz-1.md`].sort(compareCodeUnits),
    );
  });
});

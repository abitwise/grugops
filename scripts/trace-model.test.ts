// trace-model.test.ts — the pure trace model (phase 37, plan 37-06, SPLIT-03, D-01, D-03).
//
// Drives the committed scripts/trace-model.js: ref classification, the row merge, the per-ticket and index
// text, the tree plan, the note collection over two context roots with a task whose read throws, and the two
// cross-plan contracts with plans 37-13 and 37-18. Those two read the validator's own index-line rule
// (state-rules' indexLineFindings over board-model's comment blanking) with the imported BUDGETS, and the
// imported HAND_TRACE_PATTERNS, so no number and no pattern is retyped here.
//
// Pure: nothing here touches the file system.

import { describe, it, expect } from "vitest";
import { dirname } from "node:path";
import {
  HAND_TRACE_PATTERNS,
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
import { indexLineFindings } from "./state-rules.js";
import { normalizeDocument, stripHtmlComments } from "./board-model.js";
import { BUDGETS, TRACE_DIR_REL, TRACEABILITY_REL } from "../install/state-layout.js";

/** A row with nothing classified, for the index cases (the index reads only the id). */
function bareRow(id: string): TraceRow {
  return { id, Requirement: [], Code: [], Tests: [], UAT: [], Release: [] };
}

const THREE_ROWS = ["ABC-2", "ABC-10", "abc-3"].map(bareRow);

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
    expect(classifyRef(ref)).toBe(expected);
  });

  it("the ticket identifier itself is no cell, and an unshaped word is none either", () => {
    expect(classifyRef("ABC-012")).toBeNull();
    expect(isTicketRef("ABC-012")).toBe(true);
    expect(isTicketRef("NFR-002")).toBe(false);
    expect(isTicketRef("ABC-01/x")).toBe(false);
    expect(classifyRef("prose")).toBeNull();
  });
});

describe("buildTraceRows: one row per ticket, refs merged first-seen without duplicates", () => {
  it("a note carrying [ABC-012, #41, fx.spec.ts, REL-0007] yields one ABC-012 row with those cells", () => {
    const rows = buildTraceRows([{ refs: ["ABC-012", "#41", "fx.spec.ts", "REL-0007"] }]);
    expect(rows).toEqual([
      { id: "ABC-012", Requirement: [], Code: ["#41"], Tests: ["fx.spec.ts"], UAT: [], Release: ["REL-0007"] },
    ]);
  });

  it("two notes for one ticket merge their refs first-seen and de-duplicated", () => {
    const rows = buildTraceRows([
      { refs: ["ABC-012", "#41", "NFR-002"] },
      { refs: ["#40", "ABC-012", "#41", "UAT-1"] },
      { refs: ["#99"] },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.Code).toEqual(["#41", "#40"]);
    expect(rows[0]?.Requirement).toEqual(["NFR-002"]);
    expect(rows[0]?.UAT).toEqual(["UAT-1"]);
  });

  it("rows sort by code units, so the order does not depend on the locale", () => {
    const rows = buildTraceRows([{ refs: ["abc-3"] }, { refs: ["ABC-2"] }, { refs: ["ABC-10"] }]);
    expect(rows.map((r) => r.id)).toEqual(["ABC-10", "ABC-2", "abc-3"]);
    expect(compareCodeUnits("B", "a")).toBe(-1);
    expect(compareCodeUnits("a", "a")).toBe(0);
  });
});

describe("renderTraceIndex: the one-line-per-ticket index (D-01)", () => {
  it("starts with the generated header and has one linked line per row, in code-unit order", () => {
    const lines = renderTraceIndex(THREE_ROWS).split("\n");
    expect(lines[0]).toBe(TRACE_GENERATED_HEADER);
    expect(lines).toContain("| Ticket | Trace |");
    const rowLines = lines.filter((l) => l.startsWith("| ") && l.includes("]("));
    expect(rowLines).toEqual([
      "| ABC-10 | [ABC-10](traceability/ABC-10.md) |",
      "| ABC-2 | [ABC-2](traceability/ABC-2.md) |",
      "| abc-3 | [abc-3](traceability/abc-3.md) |",
    ]);
    expect(renderTraceIndex(THREE_ROWS).endsWith("|\n")).toBe(true);
    expect(renderTraceIndex(THREE_ROWS).endsWith("\n\n")).toBe(false);
  });

  it("the index links resolve to TRACE_DIR_REL beside TRACEABILITY_REL", () => {
    expect(`${dirname(TRACEABILITY_REL)}/${TRACE_LINK_DIR}`).toBe(TRACE_DIR_REL);
  });

  it.each([
    ["zero rows", [] as TraceRow[]],
    ["three rows", THREE_ROWS],
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
  it("has exactly two members, case-insensitive and without the g flag, each matching its own control line", () => {
    expect(HAND_TRACE_PATTERNS).toHaveLength(2);
    expect(Object.isFrozen(HAND_TRACE_PATTERNS)).toBe(true);
    for (const p of HAND_TRACE_PATTERNS) {
      expect(p.flags.includes("i")).toBe(true);
      expect(p.flags.includes("g")).toBe(false);
    }
    const [handEdit, oldShape] = HAND_TRACE_PATTERNS as [RegExp, RegExp];
    expect(handEdit.test("Append to traceability.md the PR link")).toBe(true);
    expect(handEdit.test("the traceability matrix")).toBe(false);
    expect(oldShape.test("the traceability matrix")).toBe(true);
    expect(oldShape.test("Append to traceability.md the PR link")).toBe(false);
  });

  it.each([
    ["zero rows", [] as TraceRow[]],
    ["three rows", THREE_ROWS],
  ])("CROSS-PLAN (37-18): no line of the %s index matches either pattern, the header comment included", (_label, rows) => {
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
    expect(c.failedTasks).toEqual([{ root: "live", task: "bad", reason: "task name refused" }]);
    // A ticket whose notes sit only in the archive root still gets a row.
    expect(buildTraceRows(c.notes).map((r) => r.id)).toEqual(["ABC-1", "ABC-2", "ARC-9"]);
  });

  it("plans the index first, then one file per ticket under the trace directory, in code-unit order", () => {
    const plan = planTraceTree(THREE_ROWS, TRACEABILITY_REL, TRACE_DIR_REL);
    expect([...plan.keys()]).toEqual([
      TRACEABILITY_REL,
      `${TRACE_DIR_REL}/ABC-10.md`,
      `${TRACE_DIR_REL}/ABC-2.md`,
      `${TRACE_DIR_REL}/abc-3.md`,
    ]);
    expect(plan.get(TRACEABILITY_REL)).toBe(renderTraceIndex(THREE_ROWS));
    expect(plan.get(`${TRACE_DIR_REL}/ABC-2.md`)).toBe(renderTicketTrace(bareRow("ABC-2")));
    expect([...planTraceTree([], TRACEABILITY_REL, TRACE_DIR_REL).keys()]).toEqual([TRACEABILITY_REL]);
  });
});

// state-rules.test.ts — unit tests for scripts/state-rules.ts, the one owner of every state budget rule and
// of the layout marker reader (phase 37, plan 37-02, SPLIT-04, D-04, D-05, D-10, D-14).
//
// Every boundary case sits at a budget and one past it, with the budget read from BUDGETS in
// install/state-layout.ts, never retyped. The module's own source is parsed to prove it imports nothing and
// reaches for no runtime API, which is what makes it safe for plan 37-03 to copy it into a host runnable and
// what makes every budget check read-only.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { BUDGETS, LAYOUT_MARKER_CONTENT } from "../install/state-layout.js";
import { normalizeDocument, parseBoard, stripHtmlComments } from "./board-model.js";
import {
  boardBudgetFindings,
  budgetEntryNames,
  doneRowFindings,
  fileBytesFinding,
  formatFinding,
  formatMarkerWarning,
  indexLineFindings,
  markerState,
  recordEntryNames,
  sortFindings,
  unmeasuredFinding,
  utf8Bytes,
  type BoardFacts,
  type StateFinding,
} from "./state-rules.js";

const ROOT = join(import.meta.dirname, "..");
const SOURCE_REL = "scripts/state-rules.ts";
const BOM = String.fromCharCode(0xfeff);
const NO_ROWS: BoardFacts = { columns: [] };

/** The three texts boardBudgetFindings reads, for a board with no HTML comment and no CRLF. */
function plainTexts(raw: string): { raw: string; normalized: string; blanked: string } {
  return { raw, normalized: raw, blanked: raw };
}

describe("markerState (D-04, D-05, D-14)", () => {
  const C = LAYOUT_MARKER_CONTENT;

  it("no marker file is absent", () => {
    expect(markerState(null, C)).toEqual({ state: "absent" });
  });

  it("the content with and without one trailing newline is valid", () => {
    expect(markerState(C, C)).toEqual({ state: "valid" });
    expect(markerState(`${C}\n`, C)).toEqual({ state: "valid" });
  });

  it("one leading byte-order mark is removed and CRLF is folded before the comparison", () => {
    expect(markerState(`${BOM}${C}`, C)).toEqual({ state: "valid" });
    expect(markerState(`${C}\r\n`, C)).toEqual({ state: "valid" });
    expect(markerState(`${BOM}${C}\r\n`, C)).toEqual({ state: "valid" });
  });

  it.each([
    ["another version", "layout: v4"],
    ["an empty file", ""],
    ["a second line", `${C}\nsecond line`],
    ["two trailing newlines", `${C}\n\n`],
    ["a lone carriage return", `${C}\r`],
    ["two byte-order marks", `${BOM}${BOM}${C}`],
    ["leading whitespace", ` ${C}`],
    ["a different case", C.toUpperCase()],
  ])("%s is invalid, with a reason", (_label, text) => {
    const s = markerState(text, C);
    expect(s.state).toBe("invalid");
    if (s.state !== "invalid") return;
    expect(s.reason.length).toBeGreaterThan(0);
  });

  it("the reason never repeats the marker's content", () => {
    const s = markerState("layout: secret-token-123", C);
    expect(s.state).toBe("invalid");
    if (s.state === "invalid") expect(s.reason).not.toContain("secret-token-123");
  });

  it("formatMarkerWarning names the marker path, says it is not recognized and that budgets stay warnings", () => {
    const line = formatMarkerWarning("some/where/.layout", "the file is empty");
    expect(line).toContain("some/where/.layout");
    expect(line).toContain("not recognized");
    expect(line).toContain("the file is empty");
    expect(line).toContain("warnings");
  });
});

describe("utf8Bytes", () => {
  it.each([
    ["ascii", "hello"],
    ["two-byte", "é ü ß"],
    ["three-byte", "€ 中文"],
    ["a surrogate pair", "a\u{1F600}b"],
    ["a lone high surrogate", "a\ud800b"],
    ["a lone low surrogate", "a\udc00b"],
    ["a high surrogate at the end", "a\ud800"],
    ["empty", ""],
  ])("%s agrees with Node's UTF-8 encoder", (_label, text) => {
    expect(utf8Bytes(text)).toBe(Buffer.byteLength(text, "utf8"));
  });
});

describe("boardBudgetFindings: BUDGETS.boardBytes", () => {
  it("a board of exactly BUDGETS.boardBytes bytes yields no boardBytes finding", () => {
    const raw = "x".repeat(BUDGETS.boardBytes);
    expect(boardBudgetFindings("b.md", plainTexts(raw), NO_ROWS, BUDGETS)).toEqual([]);
  });

  it("one byte more yields one finding carrying measured, budget, unit and key", () => {
    const raw = "x".repeat(BUDGETS.boardBytes + 1);
    expect(boardBudgetFindings("b.md", plainTexts(raw), NO_ROWS, BUDGETS)).toEqual([
      { rel: "b.md", key: "boardBytes", measured: BUDGETS.boardBytes + 1, budget: BUDGETS.boardBytes, unit: "bytes" },
    ]);
  });

  it("the unit is bytes: a board under budget in UTF-16 code units but over it in UTF-8 bytes is a finding", () => {
    const raw = "é".repeat(Math.floor(BUDGETS.boardBytes / 2) + 1);
    expect(raw.length, "PREMISE: the board is under budget in code units").toBeLessThan(BUDGETS.boardBytes);
    const found = boardBudgetFindings("b.md", plainTexts(raw), NO_ROWS, BUDGETS);
    expect(found).toHaveLength(1);
    expect(found[0]?.key).toBe("boardBytes");
    expect(found[0]?.unit).toBe("bytes");
    expect(found[0]?.measured).toBe(Buffer.byteLength(raw, "utf8"));
  });

  it("the raw text is measured, so a byte-order mark counts", () => {
    const raw = `${BOM}${"x".repeat(BUDGETS.boardBytes - 2)}`;
    expect(Buffer.byteLength(raw, "utf8"), "PREMISE").toBe(BUDGETS.boardBytes + 1);
    expect(boardBudgetFindings("b.md", plainTexts(raw), NO_ROWS, BUDGETS)).toHaveLength(1);
  });
});

/** The three texts of a board document, produced by board-model's own normalizer and comment pass. */
function textsOf(raw: string): { raw: string; normalized: string; blanked: string } {
  const normalized = normalizeDocument(raw);
  return { raw, normalized, blanked: stripHtmlComments(normalized) };
}

/** Board findings for `raw`, parsed by the one board grammar. */
function boardFindingsOf(raw: string): StateFinding[] {
  return boardBudgetFindings("b.md", textsOf(raw), parseBoard(raw), BUDGETS);
}

/** A ticket row `- [ID] <title>` of exactly `units` UTF-16 code units, the title padded with `fill`. */
function rowOf(id: string, units: number, fill = "t"): string {
  const head = `- [${id}] `;
  const title = fill.repeat(Math.ceil((units - head.length) / fill.length)).slice(0, units - head.length);
  const row = `${head}${title}`;
  if (row.length !== units) throw new Error(`PREMISE: built a ${row.length}-unit row, wanted ${units}`);
  return row;
}

describe("boardBudgetFindings: BUDGETS.boardRowChars", () => {
  const board = (row: string): string => `# Board\n\n## Ready (WIP 0/8)\n\n${row}\n`;

  it("a ticket-row line of exactly BUDGETS.boardRowChars code units yields no finding", () => {
    expect(boardFindingsOf(board(rowOf("ABC-1", BUDGETS.boardRowChars)))).toEqual([]);
  });

  it("one code unit more yields one boardRowChars finding carrying its line number", () => {
    expect(boardFindingsOf(board(rowOf("ABC-1", BUDGETS.boardRowChars + 1)))).toEqual([
      {
        rel: "b.md",
        key: "boardRowChars",
        measured: BUDGETS.boardRowChars + 1,
        budget: BUDGETS.boardRowChars,
        unit: "characters",
        line: 5,
      },
    ]);
  });

  it("the unit is UTF-16 code units: a row at the budget in code units but over it in bytes is no finding", () => {
    const row = rowOf("ABC-1", BUDGETS.boardRowChars, "é");
    expect(Buffer.byteLength(row, "utf8"), "PREMISE").toBeGreaterThan(BUDGETS.boardRowChars);
    expect(boardFindingsOf(board(row))).toEqual([]);
  });

  it("a CRLF board is measured on its normalized line, so the carriage return is not counted", () => {
    const raw = board(rowOf("ABC-1", BUDGETS.boardRowChars)).split("\n").join("\r\n");
    expect(boardFindingsOf(raw)).toEqual([]);
  });

  it("an epic row and a heading line are never measured as ticket rows", () => {
    const longHeading = `## ${"H".repeat(BUDGETS.boardRowChars + 40)} (WIP unlimited)`;
    const raw = `# Board\n\n${longHeading}\n\n${rowOf("EPIC-1", BUDGETS.boardRowChars + 40)}\n`;
    const model = parseBoard(raw);
    expect(model.epicRows.length, "PREMISE: the epic row parsed as an epic row").toBe(1);
    expect(model.columns.length, "PREMISE: the long heading opened a column").toBe(1);
    expect(boardFindingsOf(raw)).toEqual([]);
  });

  it("every over-budget row is its own finding", () => {
    const raw = board(`${rowOf("ABC-1", 200)}\n${rowOf("ABC-2", 100)}\n${rowOf("ABC-3", 300)}`);
    const found = boardFindingsOf(raw).filter((f) => f.key === "boardRowChars");
    expect(found.map((f) => [f.line, f.measured])).toEqual([
      [5, 200],
      [7, 300],
    ]);
  });
});

describe("boardBudgetFindings: BUDGETS.boardUpdatedLines", () => {
  it("one `_Updated:` line yields nothing", () => {
    expect(boardFindingsOf("# Board\n_Updated: 2026-10-22 by qe\n")).toEqual([]);
  });

  it("two yield one finding with measured 2, counting the kit placeholder form as well as the canonical one", () => {
    const raw = "# Board\n_Updated: <ISO date> by <role>_\n\n_Updated: 2026-10-22 by qe\n";
    expect(parseBoard(raw).updates.length, "PREMISE: only one of the two is canonical").toBe(1);
    const found = boardFindingsOf(raw);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ key: "boardUpdatedLines", measured: 2, budget: BUDGETS.boardUpdatedLines, unit: "lines" });
  });

  it("a line inside an HTML comment is never counted", () => {
    const raw = "# Board\n_Updated: 2026-10-22 by qe\n<!--\n_Updated: 2026-10-21 by qe\n-->\n";
    expect(boardFindingsOf(raw)).toEqual([]);
  });
});

describe("indexLineFindings: BUDGETS.indexEntryBytes", () => {
  const docOf = (raw: string): { normalized: string; blanked: string } => {
    const normalized = normalizeDocument(raw);
    return { normalized, blanked: stripHtmlComments(normalized) };
  };

  it.each(["trace index", "NFR catalog"])("%s: a line of exactly the budget yields nothing, one byte more yields a finding with its line", (_l) => {
    const at = "e".repeat(BUDGETS.indexEntryBytes);
    const over = "e".repeat(BUDGETS.indexEntryBytes + 1);
    expect(indexLineFindings("i.md", docOf(`# Index\n${at}\n`), BUDGETS)).toEqual([]);
    expect(indexLineFindings("i.md", docOf(`# Index\n\n${over}\n`), BUDGETS)).toEqual([
      {
        rel: "i.md",
        key: "indexEntryBytes",
        measured: BUDGETS.indexEntryBytes + 1,
        budget: BUDGETS.indexEntryBytes,
        unit: "bytes",
        line: 3,
      },
    ]);
  });

  it("the unit is UTF-8 bytes", () => {
    const line = "é".repeat(Math.floor(BUDGETS.indexEntryBytes / 2) + 1);
    expect(line.length, "PREMISE").toBeLessThan(BUDGETS.indexEntryBytes);
    expect(indexLineFindings("i.md", docOf(line), BUDGETS)).toHaveLength(1);
  });

  it("lines inside an HTML comment are never measured, on their own lines or beside an entry", () => {
    const long = "c".repeat(BUDGETS.indexEntryBytes * 3);
    const entry = "e".repeat(BUDGETS.indexEntryBytes);
    const raw = `<!--\n${long}\n-->\n<!-- ${long} -->\n${entry}<!-- ${long} -->\n<!-- ${long} -->${entry}\n`;
    expect(indexLineFindings("i.md", docOf(raw), BUDGETS)).toEqual([]);
  });

  it("the part of a line outside a comment is still measured", () => {
    const over = "e".repeat(BUDGETS.indexEntryBytes + 1);
    expect(indexLineFindings("i.md", docOf(`<!-- note -->${over}\n`), BUDGETS)).toHaveLength(1);
  });

  it("a CRLF index is measured on its normalized lines", () => {
    const at = "e".repeat(BUDGETS.indexEntryBytes);
    expect(indexLineFindings("i.md", docOf(`${at}\r\n${at}\r\n`), BUDGETS)).toEqual([]);
  });
});

describe("fileBytesFinding: the per-file byte budgets", () => {
  it.each([
    ["ticketBytes", BUDGETS.ticketBytes],
    ["nfrBytes", BUDGETS.nfrBytes],
    ["traceBytes", BUDGETS.traceBytes],
    ["progressBytes", BUDGETS.progressBytes],
  ] as const)("%s: at the budget yields nothing, one byte more yields one finding", (key, budget) => {
    expect(fileBytesFinding("d/ABC-7.md", budget, key, BUDGETS)).toBeNull();
    const f = fileBytesFinding("d/ABC-7.md", budget + 1, key, BUDGETS);
    expect(f).toMatchObject({ rel: "d/ABC-7.md", key, measured: budget + 1, budget, unit: "bytes" });
  });

  it("a trace-file finding names the ticket and says to split its work, not to edit the generated file", () => {
    const f = fileBytesFinding("x/traceability/ABC-083.md", BUDGETS.traceBytes + 1, "traceBytes", BUDGETS);
    expect(f?.note).toBeDefined();
    expect(f?.note).toContain("ABC-083");
    expect(f?.note).toMatch(/split/);
    expect(f?.note).toMatch(/generated/);
    expect(f?.note).toMatch(/not edit|never edit|do not edit/);
  });

  it("a finding on any other file carries no trace note", () => {
    expect(fileBytesFinding("t/ABC-1.md", BUDGETS.ticketBytes + 1, "ticketBytes", BUDGETS)?.note).toBeUndefined();
  });

  it("unmeasuredFinding names the file, its budget and its unit, with measured null", () => {
    expect(unmeasuredFinding("n/NFR-1.md", "nfrBytes", BUDGETS, "not a regular file")).toEqual({
      rel: "n/NFR-1.md",
      key: "nfrBytes",
      measured: null,
      budget: BUDGETS.nfrBytes,
      unit: "bytes",
      note: "not a regular file",
    });
    expect(unmeasuredFinding("b.md", "boardRowChars", BUDGETS, "x").unit).toBe("characters");
    expect(unmeasuredFinding("b.md", "doneRows", BUDGETS, "x").unit).toBe("rows");
  });
});

describe("doneRowFindings: BUDGETS.doneRows", () => {
  const doneBoard = (n: number): string =>
    `# Board\n\n## Ready (WIP 0/8)\n\n- [ABC-900] ready row\n\n## Done (WIP unlimited)\n\n` +
    Array.from({ length: n }, (_v, i) => `- [ABC-${i + 1}] done row ${i + 1}`).join("\n") +
    "\n";

  it("BUDGETS.doneRows rows under the Done heading yield nothing", () => {
    const raw = doneBoard(BUDGETS.doneRows);
    expect(doneRowFindings("b.md", parseBoard(raw), BUDGETS)).toEqual([]);
  });

  it("one row more yields one finding with the measured row count", () => {
    const raw = doneBoard(BUDGETS.doneRows + 1);
    const found = doneRowFindings("b.md", parseBoard(raw), BUDGETS);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ rel: "b.md", key: "doneRows", measured: BUDGETS.doneRows + 1, budget: BUDGETS.doneRows, unit: "rows" });
  });

  it("rows under any other column do not count", () => {
    const raw = `# Board\n\n## Ready (WIP unlimited)\n\n${Array.from({ length: BUDGETS.doneRows + 5 }, (_v, i) => `- [ABC-${i + 1}] r`).join("\n")}\n`;
    expect(doneRowFindings("b.md", parseBoard(raw), BUDGETS)).toEqual([]);
  });
});

describe("recordEntryNames and budgetEntryNames: which directory entries are records", () => {
  it("recordEntryNames keeps the names that do not begin with a dot, in code-unit order", () => {
    expect(recordEntryNames(["NFR-002.md", ".gitkeep", "NFR-001.md", ".DS_Store", "notes.md", ".hidden.md"])).toEqual([
      "NFR-001.md",
      "NFR-002.md",
      "notes.md",
    ]);
  });

  it("budgetEntryNames keeps the records that end .md, in code-unit order", () => {
    expect(budgetEntryNames(["b.md", ".hidden.md", ".gitkeep", "notes.txt", "A.md"])).toEqual(["A.md", "b.md"]);
  });

  it("neither changes its input", () => {
    const names = ["b.md", "a.md"];
    recordEntryNames(names);
    budgetEntryNames(names);
    expect(names).toEqual(["b.md", "a.md"]);
  });
});

describe("formatFinding", () => {
  it("spells path, measured, budget, unit and constant, with digits grouped by commas", () => {
    const f: StateFinding = { rel: "a/b.md", key: "boardBytes", measured: 24577, budget: 24576, unit: "bytes" };
    expect(formatFinding(f)).toBe("a/b.md: 24,577 bytes, budget 24,576 bytes (BUDGETS.boardBytes)");
  });

  it("adds the line number and the note when the finding carries them", () => {
    const f: StateFinding = {
      rel: "a/b.md",
      key: "boardRowChars",
      measured: 1234567,
      budget: 160,
      unit: "characters",
      line: 12,
      note: "shorten the title",
    };
    expect(formatFinding(f)).toBe(
      "a/b.md:12: 1,234,567 characters, budget 160 characters (BUDGETS.boardRowChars) — shorten the title",
    );
  });

  it("says a file was not measured, and still names it and its budget", () => {
    const f: StateFinding = {
      rel: "t/x.md",
      key: "ticketBytes",
      measured: null,
      budget: 65536,
      unit: "bytes",
      note: "not a regular file",
    };
    expect(formatFinding(f)).toBe("t/x.md: not measured, budget 65,536 bytes (BUDGETS.ticketBytes) — not a regular file");
  });
});

describe("sortFindings", () => {
  const f = (rel: string, key: string, line?: number): StateFinding => ({
    rel,
    key,
    measured: 1,
    budget: 0,
    unit: "bytes",
    ...(line === undefined ? {} : { line }),
  });

  it("orders by path, then budget key, then line, by code unit", () => {
    const sorted = sortFindings([
      f("b.md", "boardRowChars", 9),
      f("a.md", "z"),
      f("b.md", "boardRowChars", 2),
      f("B.md", "x"),
      f("b.md", "boardBytes"),
    ]);
    expect(sorted.map((x) => `${x.rel}|${x.key}|${x.line ?? "-"}`)).toEqual([
      "B.md|x|-",
      "a.md|z|-",
      "b.md|boardBytes|-",
      "b.md|boardRowChars|2",
      "b.md|boardRowChars|9",
    ]);
  });

  it("does not change its input", () => {
    const input = [f("b.md", "k"), f("a.md", "k")];
    sortFindings(input);
    expect(input.map((x) => x.rel)).toEqual(["b.md", "a.md"]);
  });
});

describe("scripts/state-rules.ts imports nothing and reaches for no runtime API (SPLIT-04, plan 37-03)", () => {
  const source = readFileSync(join(ROOT, SOURCE_REL), "utf8");
  const sf = ts.createSourceFile(SOURCE_REL, source, ts.ScriptTarget.ES2022, true);

  /** Every node of the syntax tree, in source order. */
  function nodes(): ts.Node[] {
    const out: ts.Node[] = [];
    const visit = (n: ts.Node): void => {
      out.push(n);
      n.forEachChild(visit);
    };
    visit(sf);
    return out;
  }

  it("PREMISE: the parse saw the module's exported functions", () => {
    const names = nodes()
      .filter(ts.isFunctionDeclaration)
      .map((n) => n.name?.text);
    expect(names).toContain("markerState");
    expect(names).toContain("boardBudgetFindings");
  });

  it("has no import declaration, no import call and no require", () => {
    const all = nodes();
    expect(all.filter((n) => ts.isImportDeclaration(n) || ts.isImportEqualsDeclaration(n))).toHaveLength(0);
    expect(all.filter((n) => ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword)).toHaveLength(0);
    expect(all.filter((n) => ts.isExportDeclaration(n) && n.moduleSpecifier !== undefined)).toHaveLength(0);
  });

  it("names no runtime global that could reach a file, a process or the network", () => {
    const forbidden = new Set(["require", "process", "globalThis", "Buffer", "fetch", "Deno", "Bun", "module"]);
    const hits = nodes()
      .filter(ts.isIdentifier)
      .map((n) => n.text)
      .filter((t) => forbidden.has(t));
    expect(hits).toEqual([]);
  });
});

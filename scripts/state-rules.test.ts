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
import {
  boardBudgetFindings,
  formatFinding,
  formatMarkerWarning,
  markerState,
  sortFindings,
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

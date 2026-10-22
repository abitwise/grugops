// state-layout.test.ts — the one state path authority (install/state-layout.ts, phase 36 D-13 step 1, D-14, D-17)
// and the one protected root list both removal paths read (LAYOUT-03).
//
// WHAT THIS PROVES.
//   - STATE_ROOTS.length equals the STATE_ROOT_COUNT pin, and the comparison discriminates: a copy with one root
//     dropped and a copy with one root added both fail it. The count is never written as a bare number here.
//   - every *_REL export is a POSIX-relative string (no leading or trailing slash, no backslash, no empty segment),
//     and every subpath of the state root is the root plus exactly one segment;
//   - STATE_ROOTS holds the pre-v3 root and the first segment of the new state root, and holds each root once;
//   - LEGACY_FALLBACK_CLAUSE names the board at both roots, both roots and the migrate command, each from its constant;
//   - install/state-layout.ts is constants only: its syntax tree holds no import, no function and no class;
//   - install/install.ts and install/uninstall.ts both import STATE_ROOTS, and neither holds an array literal naming
//     both ".planning" and "agent-factory" (a second hand-typed copy of the list cannot come back).
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as layout from "./state-layout.js";
import {
  ARCHIVE_REL,
  BOARD_DONE_ARCHIVE_REL,
  BOARD_REL,
  BUDGETS,
  BUDGET_COUNT,
  GRUGOPS_DIR_REL,
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  LEGACY_BOARD_REL,
  LEGACY_FALLBACK_CLAUSE,
  LEGACY_HANDOFFS_REL,
  LEGACY_STATE_ROOT_REL,
  MEMORY_BANK_REL,
  STATE_ROOTS,
  STATE_ROOT_COUNT,
  STATE_ROOT_REL,
  UAT_REL,
} from "./state-layout.js";

const INSTALL_DIR = import.meta.dirname;
const CONTRACT_PATH = join(INSTALL_DIR, "..", "agent-factory", "contracts", "board.md");
/** The heading the contract's budget table sits under; the table is located by it, never by a line number. */
const BUDGETS_HEADING = "### Budgets";

function sourceOf(file: string): ts.SourceFile {
  return ts.createSourceFile(file, readFileSync(join(INSTALL_DIR, file), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}
function walk(node: ts.Node, visit: (n: ts.Node) => void): void {
  visit(node);
  ts.forEachChild(node, (c) => walk(c, visit));
}

/** Every exported *_REL constant, by name. */
const RELS: ReadonlyArray<readonly [string, string]> = Object.entries(layout)
  .filter(([name]) => name.endsWith("_REL"))
  .map(([name, value]) => [name, value as string] as const);

/** The shape a STATE_ROOTS list must have: exactly STATE_ROOT_COUNT roots. */
const holdsTheCount = (roots: readonly string[]): boolean => roots.length === STATE_ROOT_COUNT;

/**
 * The *_REL constants initialised by a plain string: the two state roots, the memory-bank root and the
 * per-repo machine directory. Every other *_REL constant is a template off a declared parent.
 */
const LITERAL_ROOTS: ReadonlySet<string> = new Set(["STATE_ROOT_REL", "LEGACY_STATE_ROOT_REL", "MEMORY_BANK_REL", "GRUGOPS_DIR_REL"]);

/** Every exported `*_REL` const declaration in a source file, by name, with its initializer. */
function relInitializers(sf: ts.SourceFile): Map<string, ts.Expression> {
  const out = new Map<string, ts.Expression>();
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    if (!(st.modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const d of st.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.name.text.endsWith("_REL") && d.initializer !== undefined) out.set(d.name.text, d.initializer);
    }
  }
  return out;
}

/** The parent constant of `${PARENT}/segment`, or null when the initializer is any other shape. */
function parentOf(init: ts.Expression): string | null {
  if (!ts.isTemplateExpression(init) || init.head.text !== "" || init.templateSpans.length !== 1) return null;
  const [span] = init.templateSpans;
  if (span === undefined || !ts.isIdentifier(span.expression)) return null;
  return /^\/[^/\\]+$/.test(span.literal.text) ? span.expression.text : null;
}

/**
 * The parent rule over a syntax tree: a literal *_REL is one of LITERAL_ROOTS, and every other *_REL is
 * `${PARENT}/<one segment>` where PARENT is a *_REL declared in the same file. Returns one line per breach.
 */
function parentProblems(sf: ts.SourceFile): string[] {
  const decls = relInitializers(sf);
  const problems: string[] = [];
  for (const [name, init] of decls) {
    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
      if (!LITERAL_ROOTS.has(name)) problems.push(`${name}: a literal subpath; build it from its parent constant`);
      continue;
    }
    const parent = parentOf(init);
    if (parent === null) problems.push(`${name}: not a declared parent constant plus exactly one segment`);
    else if (!decls.has(parent)) problems.push(`${name}: its parent ${parent} is not a *_REL declared here`);
  }
  return problems;
}

/** name -> declared parent, read off the real module's syntax tree. */
const PARENTS: ReadonlyMap<string, string> = new Map(
  [...relInitializers(sourceOf("state-layout.ts"))].flatMap(([name, init]) => {
    const parent = parentOf(init);
    return parent === null ? [] : [[name, parent] as const];
  }),
);

/**
 * Read the contract's budget table, LOCATED BY ITS HEADING and BOUNDED BY THE NEXT ONE, as (key, value)
 * pairs. A data row whose first cell is not a backticked `BUDGETS.<key>` or whose value is not a base-ten
 * integer is refused rather than skipped, so a typo in the table cannot shrink the comparison silently.
 */
function readBudgetTable(text: string): ReadonlyArray<readonly [string, number]> {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === BUDGETS_HEADING);
  if (start < 0) throw new Error(`the contract carries no "${BUDGETS_HEADING}" heading; rename it here in the same commit if it moved`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^#{1,6} /.test(lines[i] ?? "")) {
      end = i;
      break;
    }
  }
  const span = lines.slice(start + 1, end);
  const first = span.findIndex((l) => l.trimStart().startsWith("|"));
  if (first < 0) throw new Error(`the "${BUDGETS_HEADING}" section carries no table`);
  const rows: Array<readonly [string, number]> = [];
  // span[first] is the header row and span[first + 1] the delimiter; the data rows follow.
  for (let i = first + 2; i < span.length; i += 1) {
    const line = (span[i] ?? "").trim();
    if (!line.startsWith("|")) break;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    const key = /^`BUDGETS\.([A-Za-z][A-Za-z0-9]*)`$/.exec(cells[0] ?? "");
    const value = /^[0-9]+$/.test(cells[1] ?? "") ? Number(cells[1]) : Number.NaN;
    if (cells.length !== 4 || key === null || !Number.isSafeInteger(value)) {
      throw new Error(`the budget table holds a row this reader cannot read: ${line}`);
    }
    rows.push([key[1] ?? "", value]);
  }
  return rows;
}

/** The two directions of a (key, value) pair comparison; a duplicated table row counts as extra. */
function budgetPairMismatches(
  table: ReadonlyArray<readonly [string, number]>,
  entries: ReadonlyArray<readonly [string, number]>,
): { missingFromTable: string[]; extraInTable: string[] } {
  const spell = ([k, v]: readonly [string, number]): string => `${k}=${v}`;
  const want = new Set(entries.map(spell));
  const seen = new Set<string>();
  const extraInTable: string[] = [];
  for (const pair of table.map(spell)) {
    if (!want.has(pair) || seen.has(pair)) extraInTable.push(pair);
    seen.add(pair);
  }
  const missingFromTable = [...want].filter((p) => !seen.has(p));
  return { missingFromTable: missingFromTable.sort(), extraInTable: extraInTable.sort() };
}

describe("STATE_ROOTS is pinned two-sided (LAYOUT-03)", () => {
  it("STATE_ROOTS.length equals STATE_ROOT_COUNT", () => {
    expect(STATE_ROOTS.length).toBe(STATE_ROOT_COUNT);
    expect(holdsTheCount(STATE_ROOTS)).toBe(true);
  });

  it("the comparison discriminates: a copy with one root dropped, or one root added, fails it", () => {
    const dropped = STATE_ROOTS.slice(1);
    const added = [...STATE_ROOTS, "a-root-nobody-added"];
    expect(holdsTheCount(dropped), "a list one root short still matched the pin").toBe(false);
    expect(holdsTheCount(added), "a list one root long still matched the pin").toBe(false);
  });

  it("each root is listed once and is one first segment", () => {
    expect(new Set(STATE_ROOTS).size, `a duplicated root: ${STATE_ROOTS.join(", ")}`).toBe(STATE_ROOTS.length);
    for (const root of STATE_ROOTS) expect(root, root).toMatch(/^[^/\\]+$/);
  });

  it("STATE_ROOTS holds the pre-v3 root and the first segment of the state root", () => {
    expect(STATE_ROOTS).toContain(LEGACY_STATE_ROOT_REL);
    expect(STATE_ROOTS).toContain(STATE_ROOT_REL.split("/")[0]);
  });

  it("STATE_ROOTS holds MEMORY_BANK_REL and GRUGOPS_DIR_REL, the parents of every Phase 37 path", () => {
    expect(STATE_ROOTS).toContain(MEMORY_BANK_REL);
    expect(STATE_ROOTS).toContain(GRUGOPS_DIR_REL);
  });

  it("STATE_ROOTS is frozen", () => {
    expect(Object.isFrozen(STATE_ROOTS)).toBe(true);
  });
});

describe("every *_REL constant is POSIX-relative (LAYOUT-01 encoding)", () => {
  it("the module exports the *_REL constants it names", () => {
    const names = RELS.map(([n]) => n).sort();
    for (const n of [
      "STATE_ROOT_REL",
      "LEGACY_STATE_ROOT_REL",
      "BOARD_REL",
      "UAT_REL",
      "LEGACY_BOARD_REL",
      "LEGACY_HANDOFFS_REL",
      "BOARD_DONE_ARCHIVE_REL",
      "LAYOUT_MARKER_REL",
      "CONTEXT_ARCHIVE_REL",
    ]) {
      expect(names, n).toContain(n);
    }
  });

  for (const [name, value] of RELS) {
    it(`${name} = ${JSON.stringify(value)} has no leading or trailing slash, no backslash and no empty segment`, () => {
      expect(typeof value, name).toBe("string");
      expect(value, name).toMatch(/^[^/\\][^\\]*[^/\\]$/);
      expect(value.split("/").every((s) => s.length > 0), `${name}: an empty segment`).toBe(true);
    });
  }

  // 2026-10-21, plan 37-01: amended from "every subpath of the state root is the state root plus exactly one
  // segment", because the Done archive file sits two segments under the state root by D-07. The rule kept is
  // the one that matters: each subpath constant is its DECLARED parent constant plus exactly one segment.
  it("each subpath constant is its declared parent constant plus exactly one segment", () => {
    expect(parentProblems(sourceOf("state-layout.ts"))).toEqual([]);
    const subs = RELS.filter(([n]) => !LITERAL_ROOTS.has(n));
    expect(subs.length, "no subpath constant is exported").toBeGreaterThan(0);
    for (const [name, value] of subs) {
      const parent = PARENTS.get(name);
      expect(parent, `${name} has no declared parent`).toBeDefined();
      const parentValue = (layout as Record<string, unknown>)[parent ?? ""];
      expect(typeof parentValue, `${name}: parent ${parent} is not an exported string`).toBe("string");
      expect(value.startsWith(`${parentValue as string}/`), `${name} = ${value} is not under ${parent}`).toBe(true);
      expect(value.slice((parentValue as string).length + 1), name).toMatch(/^[^/]+$/);
    }
    expect(UAT_REL).toBe(`${STATE_ROOT_REL}/uat`);
    expect(BOARD_DONE_ARCHIVE_REL).toBe(`${ARCHIVE_REL}/board-done.md`);
    expect(PARENTS.get("BOARD_DONE_ARCHIVE_REL")).toBe("ARCHIVE_REL");
  });

  it("the literal roots are exactly the four declared ones, and STATE_ROOT_REL stays one literal under MEMORY_BANK_REL", () => {
    const literal = RELS.filter(([n]) => !PARENTS.has(n)).map(([n]) => n).sort();
    expect(literal).toEqual([...LITERAL_ROOTS].sort());
    const segments = STATE_ROOT_REL.split("/");
    expect(segments.length, STATE_ROOT_REL).toBe(2);
    expect(segments[0]).toBe(MEMORY_BANK_REL);
    expect(GRUGOPS_DIR_REL.split("/").length, GRUGOPS_DIR_REL).toBe(1);
  });

  it("LEGACY_STATE_ROOT_REL is the parent of the two pre-v3 paths and of no other constant", () => {
    const legacyChildren = [...PARENTS].filter(([, p]) => p === "LEGACY_STATE_ROOT_REL").map(([n]) => n).sort();
    expect(legacyChildren).toEqual(["LEGACY_BOARD_REL", "LEGACY_HANDOFFS_REL"]);
  });

  it("the parent rule discriminates: a two-segment template, a literal subpath and a two-span template are each caught", () => {
    const probe = (text: string): string[] =>
      parentProblems(ts.createSourceFile("probe.ts", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS));
    expect(probe("export const STATE_ROOT_REL = \"a/b\";\nexport const X_REL = `${STATE_ROOT_REL}/one/two`;")).not.toEqual([]);
    expect(probe("export const STATE_ROOT_REL = \"a/b\";\nexport const Y_REL = \"a/b/c\";")).not.toEqual([]);
    expect(probe("export const STATE_ROOT_REL = \"a/b\";\nexport const Z_REL = `${STATE_ROOT_REL}/${STATE_ROOT_REL}`;")).not.toEqual([]);
    expect(probe("export const STATE_ROOT_REL = \"a/b\";\nexport const W_REL = `${UNKNOWN_REL}/c`;")).not.toEqual([]);
    expect(probe("export const STATE_ROOT_REL = \"a/b\";\nexport const V_REL = `${STATE_ROOT_REL}/c`;")).toEqual([]);
  });

  it("every subpath of the pre-v3 root is that root plus exactly one segment", () => {
    for (const value of [LEGACY_BOARD_REL, LEGACY_HANDOFFS_REL]) {
      expect(value.startsWith(`${LEGACY_STATE_ROOT_REL}/`), value).toBe(true);
      expect(value.slice(LEGACY_STATE_ROOT_REL.length + 1), value).toMatch(/^[^/]+$/);
    }
  });
});

describe("LEGACY_FALLBACK_CLAUSE is tied to the constants (D-14, D-06)", () => {
  it("names the board at both roots, both roots and the migrate command, each backticked", () => {
    for (const piece of [BOARD_REL, LEGACY_BOARD_REL, `${LEGACY_STATE_ROOT_REL}/`, `${STATE_ROOT_REL}/`, "install --migrate"]) {
      expect(LEGACY_FALLBACK_CLAUSE, piece).toContain(`\`${piece}\``);
    }
  });

  it("is one line", () => {
    expect(LEGACY_FALLBACK_CLAUSE).not.toMatch(/[\r\n]/);
  });
});

describe("install/state-layout.ts is constants only (D-13 step 1)", () => {
  it("its syntax tree holds no import, no function and no class", () => {
    const found: string[] = [];
    const banned = new Set([
      ts.SyntaxKind.ImportDeclaration,
      ts.SyntaxKind.ImportEqualsDeclaration,
      ts.SyntaxKind.FunctionDeclaration,
      ts.SyntaxKind.ArrowFunction,
      ts.SyntaxKind.FunctionExpression,
      ts.SyntaxKind.ClassDeclaration,
      ts.SyntaxKind.ClassExpression,
    ]);
    const sf = sourceOf("state-layout.ts");
    walk(sf, (n) => {
      if (banned.has(n.kind)) found.push(`${ts.SyntaxKind[n.kind]} at line ${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`);
    });
    expect(found).toEqual([]);
  });
});

describe("both removal paths read the one list (LAYOUT-03, T-36-02)", () => {
  for (const file of ["install.ts", "uninstall.ts"]) {
    it(`${file} imports STATE_ROOTS from ./state-layout.js`, () => {
      const sf = sourceOf(file);
      const names: string[] = [];
      for (const st of sf.statements) {
        if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier) || st.moduleSpecifier.text !== "./state-layout.js") continue;
        const b = st.importClause?.namedBindings;
        if (b !== undefined && ts.isNamedImports(b)) for (const el of b.elements) names.push(el.name.text);
      }
      expect(names).toContain("STATE_ROOTS");
    });

    it(`${file} holds no array literal naming both ".planning" and "agent-factory"`, () => {
      const sf = sourceOf(file);
      const copies: number[] = [];
      walk(sf, (n) => {
        if (!ts.isArrayLiteralExpression(n)) return;
        const strings = n.elements.filter((e): e is ts.StringLiteralLike => ts.isStringLiteralLike(e)).map((e) => e.text);
        if (strings.includes(".planning") && strings.includes("agent-factory")) copies.push(sf.getLineAndCharacterOfPosition(n.getStart()).line + 1);
      });
      expect(copies, `${file}: a hand-typed protected list at line(s) ${copies.join(", ")}`).toEqual([]);
    });
  }

  it("the structural check discriminates: a source holding the retired list is caught", () => {
    const sf = ts.createSourceFile("probe.ts", 'const d = ["agent-factory", "x", ".planning"];', ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let hit = false;
    walk(sf, (n) => {
      if (!ts.isArrayLiteralExpression(n)) return;
      const strings = n.elements.filter((e): e is ts.StringLiteralLike => ts.isStringLiteralLike(e)).map((e) => e.text);
      if (strings.includes(".planning") && strings.includes("agent-factory")) hit = true;
    });
    expect(hit).toBe(true);
  });
});

describe("BUDGETS is pinned two-sided (D-10, SPLIT-04)", () => {
  /** The shape BUDGETS must have: exactly BUDGET_COUNT keys. */
  const holdsTheBudgetCount = (budgets: Readonly<Record<string, number>>): boolean => Object.keys(budgets).length === BUDGET_COUNT;

  it("Object.keys(BUDGETS).length equals BUDGET_COUNT", () => {
    expect(Object.keys(BUDGETS).length).toBe(BUDGET_COUNT);
    expect(holdsTheBudgetCount(BUDGETS)).toBe(true);
  });

  it("the comparison discriminates: a copy with one budget added, or one removed, fails it", () => {
    const added: Record<string, number> = { ...BUDGETS, aBudgetNobodyAdded: 1 };
    const removed: Record<string, number> = { ...BUDGETS };
    delete removed[Object.keys(BUDGETS)[0] ?? ""];
    expect(holdsTheBudgetCount(added), "a copy one budget long still matched the pin").toBe(false);
    expect(holdsTheBudgetCount(removed), "a copy one budget short still matched the pin").toBe(false);
  });

  it("every budget is a positive safe integer, and BUDGETS is frozen", () => {
    for (const [key, value] of Object.entries(BUDGETS)) expect(Number.isSafeInteger(value) && value > 0, key).toBe(true);
    expect(Object.isFrozen(BUDGETS)).toBe(true);
  });
});

describe("the board contract and the constants agree (D-04, D-05, D-07, D-10, D-14)", () => {
  const contract = readFileSync(CONTRACT_PATH, "utf8");

  it("PREMISE: the contract was read", () => {
    expect(contract.length, `${CONTRACT_PATH} read as empty or missing`).toBeGreaterThan(1000);
  });

  it("the contract's budget table holds exactly the pairs of Object.entries(BUDGETS), in both directions", () => {
    const table = readBudgetTable(contract);
    expect(table.length, "the budget table holds no row").toBeGreaterThan(0);
    expect(budgetPairMismatches(table, Object.entries(BUDGETS))).toEqual({ missingFromTable: [], extraInTable: [] });
  });

  it("the table comparison discriminates: a missing key, an extra row and a changed value each fail", () => {
    const entries = Object.entries(BUDGETS);
    const table = readBudgetTable(contract);
    const [firstKey = "", firstValue = 0] = entries[0] ?? [];
    const missing = table.filter(([k]) => k !== firstKey);
    const extra = [...table, ["aBudgetNobodyAdded", 1] as const];
    const changed = table.map(([k, v]) => (k === firstKey ? ([k, firstValue + 1] as const) : ([k, v] as const)));
    const clean = { missingFromTable: [], extraInTable: [] };
    expect(budgetPairMismatches(missing, entries), "a table missing a key still matched").not.toEqual(clean);
    expect(budgetPairMismatches(extra, entries), "a table with an extra row still matched").not.toEqual(clean);
    expect(budgetPairMismatches(changed, entries), "a table with a changed value still matched").not.toEqual(clean);
  });

  it("the table reader refuses a row whose first cell it cannot read, rather than skipping it", () => {
    const probe = ["### Budgets", "", "| Constant | Value | Unit | Applies to |", "|---|---|---|---|", "| `BUDGET.typo` | 1 | rows | x |"].join("\n");
    expect(() => readBudgetTable(probe)).toThrow(/cannot read/);
  });

  it("the contract spells the marker path, the marker content and the Done archive path verbatim", () => {
    for (const piece of [LAYOUT_MARKER_REL, LAYOUT_MARKER_CONTENT, BOARD_DONE_ARCHIVE_REL]) {
      expect(contract, piece).toContain(`\`${piece}\``);
    }
  });

  it("LAYOUT_MARKER_CONTENT is one line with no line ending of its own", () => {
    expect(LAYOUT_MARKER_CONTENT).not.toMatch(/[\r\n]/);
    expect(LAYOUT_MARKER_CONTENT.length).toBeGreaterThan(0);
  });
});

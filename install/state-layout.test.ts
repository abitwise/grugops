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
  BOARD_REL,
  LEGACY_BOARD_REL,
  LEGACY_FALLBACK_CLAUSE,
  LEGACY_HANDOFFS_REL,
  LEGACY_STATE_ROOT_REL,
  STATE_ROOTS,
  STATE_ROOT_COUNT,
  STATE_ROOT_REL,
  UAT_REL,
} from "./state-layout.js";

const INSTALL_DIR = import.meta.dirname;

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

  it("STATE_ROOTS is frozen", () => {
    expect(Object.isFrozen(STATE_ROOTS)).toBe(true);
  });
});

describe("every *_REL constant is POSIX-relative (LAYOUT-01 encoding)", () => {
  it("the module exports the *_REL constants it names", () => {
    const names = RELS.map(([n]) => n).sort();
    for (const n of ["STATE_ROOT_REL", "LEGACY_STATE_ROOT_REL", "BOARD_REL", "UAT_REL", "LEGACY_BOARD_REL", "LEGACY_HANDOFFS_REL"]) {
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

  it("every subpath of the state root is the state root plus exactly one segment", () => {
    const subs = RELS.filter(([n, v]) => n !== "STATE_ROOT_REL" && v.startsWith(`${STATE_ROOT_REL}/`));
    expect(subs.length, "no subpath of the state root is exported").toBeGreaterThan(0);
    for (const [name, value] of subs) {
      expect(value.slice(STATE_ROOT_REL.length + 1), name).toMatch(/^[^/]+$/);
    }
    expect(subs.map(([n]) => n)).toContain("UAT_REL");
    expect(UAT_REL).toBe(`${STATE_ROOT_REL}/uat`);
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

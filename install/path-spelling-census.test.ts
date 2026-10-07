// path-spelling-census.test.ts — a TypeScript-AST census of every site in the installer sources that
// spells or compares a recorded path (plan 34-11 Task 3, D-19, defect class WIN-1;
// .planning/phases/34-model-effort-dial-pi-support/34-GAP-PLANNING-BRIEF.md §2.2 and §2.3).
//
// WHY A CENSUS AS WELL AS install/canonical-path.test.ts. That file proves the one spelling function
// is right for both path flavors. It cannot see a site that spells a path another way: the windows-latest
// run 37521787426 failed 91 tests because two spellings of one directory were compared as bytes, and
// each spelling was locally correct. This file holds the other half: the installer spells and compares a
// recorded path ONLY through install/user-file.ts canonicalPathSpelling (and sameRecordedPath /
// absoluteSpelling, which are built on it). A second fold, a second real-path call, a raw compare of a
// recorded value or a resurrected local `toPosix` turns this file red with the file and line.
//
// THE SCANNED SET IS DERIVED, NOT LISTED: every `*.ts` directly under install/ that is not a test,
// test-support or declaration file. Its size is asserted, so a new or removed module fails here and is
// read before the count is changed. Text in comments never counts: every rule walks the syntax tree.
//
// Plan 34-12 adds the test-side half of this census in its own `describe`; the product half is below.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const INSTALL_DIR = import.meta.dirname;

/** The number of installer source modules counted when this census was written (plan 34-11). */
const SCANNED_FILE_COUNT = 8;

function scannedFiles(): string[] {
  return readdirSync(INSTALL_DIR)
    .filter((n) => n.endsWith(".ts"))
    .filter((n) => !n.endsWith(".test.ts") && !n.endsWith(".test-support.ts") && !n.endsWith(".d.ts"))
    .sort();
}

const sourceCache = new Map<string, ts.SourceFile>();
function sourceOf(file: string): ts.SourceFile {
  let sf = sourceCache.get(file);
  if (sf === undefined) {
    sf = ts.createSourceFile(file, readFileSync(join(INSTALL_DIR, file), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    sourceCache.set(file, sf);
  }
  return sf;
}

const lineOf = (sf: ts.SourceFile, node: ts.Node): number => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

/** The name of the innermost named function around `node` (a declaration, or an arrow / function expression bound to a const). */
function scopeOf(node: ts.Node): string {
  for (let cur: ts.Node | undefined = node.parent; cur !== undefined; cur = cur.parent) {
    if (ts.isFunctionDeclaration(cur) && cur.name) return cur.name.text;
    if ((ts.isArrowFunction(cur) || ts.isFunctionExpression(cur)) && ts.isVariableDeclaration(cur.parent) && ts.isIdentifier(cur.parent.name)) {
      return cur.parent.name.text;
    }
  }
  return "<top-level>";
}

interface Site {
  readonly file: string;
  readonly line: number;
  readonly scope: string;
}
const where = (s: Site): string => `${s.file}:${s.line} (in ${s.scope})`;

/** Every node of every scanned file for which `pick` answers true. */
function sitesWhere(pick: (node: ts.Node, sf: ts.SourceFile) => boolean, files: readonly string[] = scannedFiles()): Site[] {
  const out: Site[] = [];
  for (const file of files) {
    const sf = sourceOf(file);
    const walk = (node: ts.Node): void => {
      if (pick(node, sf)) out.push({ file, line: lineOf(sf, node), scope: scopeOf(node) });
      ts.forEachChild(node, walk);
    };
    walk(sf);
  }
  return out;
}

/** The callee name of a call: `f(...)` → f, `x.f(...)` → f. */
function calleeName(call: ts.CallExpression): string | null {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) return e.name.text;
  return null;
}

/** Whether a pattern argument (a regular-expression or string literal) matches a backslash. */
function patternMatchesBackslash(arg: ts.Expression | undefined): boolean {
  if (arg === undefined) return false;
  if (ts.isRegularExpressionLiteral(arg)) {
    const text = arg.text;
    const lastSlash = text.lastIndexOf("/");
    try {
      return new RegExp(text.slice(1, lastSlash), text.slice(lastSlash + 1).replace("g", "")).test("\\");
    } catch {
      return true; // a pattern this file cannot read is reported, never trusted
    }
  }
  if (ts.isStringLiteralLike(arg)) return arg.text.includes("\\");
  return false;
}

/** A `.split(X).join("/")` chain where X is the host `sep` (or any `.sep`) or a pattern matching a backslash. */
function isSeparatorFoldChain(node: ts.Node): boolean {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression) || node.expression.name.text !== "join") return false;
  const joinArg = node.arguments[0];
  if (joinArg === undefined || !ts.isStringLiteralLike(joinArg) || joinArg.text !== "/") return false;
  const inner = node.expression.expression;
  if (!ts.isCallExpression(inner) || !ts.isPropertyAccessExpression(inner.expression) || inner.expression.name.text !== "split") return false;
  const splitArg = inner.arguments[0];
  if (splitArg === undefined) return false;
  if (ts.isIdentifier(splitArg) && splitArg.text === "sep") return true;
  if (ts.isPropertyAccessExpression(splitArg) && splitArg.name.text === "sep") return true;
  return patternMatchesBackslash(splitArg);
}

const isProcessPlatform = (node: ts.Node): boolean =>
  (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "process" && node.name.text === "platform") ||
  (ts.isElementAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "process" &&
    ts.isStringLiteralLike(node.argumentExpression) &&
    node.argumentExpression.text === "platform");

/** The function (declaration or const-bound arrow) named `name` in `sf`, or null. */
function functionNamed(sf: ts.SourceFile, name: string): ts.Node | null {
  let found: ts.Node | null = null;
  const walk = (node: ts.Node): void => {
    if (found !== null) return;
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node;
    else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer !== undefined) found = node.initializer;
    else ts.forEachChild(node, walk);
  };
  walk(sf);
  return found;
}

/** Every node under `root` for which `pick` answers true. */
function nodesUnder<T extends ts.Node>(root: ts.Node, pick: (n: ts.Node) => n is T): T[] {
  const out: T[] = [];
  const walk = (node: ts.Node): void => {
    if (pick(node)) out.push(node);
    ts.forEachChild(node, walk);
  };
  walk(root);
  return out;
}

const EQUALITY = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
]);

// The functions that ARE the spelling: a platform read inside one would make the rule host-dependent.
const SPELLING_FUNCTIONS = ["canonicalPathSpelling", "sameRecordedPath", "absoluteSpelling", "realTargetPath", "realPathThroughExisting"];

describe("WIN-1 path-spelling census — product (install/*.ts sources)", () => {
  it("the scanned set is every installer source module, and its size is the one counted", () => {
    const files = scannedFiles();
    expect(files, `the scanned set changed: ${files.join(", ")} — read the new module for recorded-path spellings, then update SCANNED_FILE_COUNT`).toHaveLength(
      SCANNED_FILE_COUNT,
    );
    for (const f of ["user-file.ts", "install-marker.ts", "install.ts", "uninstall.ts"]) expect(files).toContain(f);
  });

  it("(a) realpathSync.native is called only in realTargetPath and realPathThroughExisting, exactly twice", () => {
    const sites = sitesWhere(
      (n) =>
        ts.isPropertyAccessExpression(n) && n.name.text === "native" && ts.isIdentifier(n.expression) && n.expression.text === "realpathSync",
    );
    const allowed = new Set(["user-file.ts:realTargetPath", "user-file.ts:realPathThroughExisting"]);
    const offenders = sites.filter((s) => !allowed.has(`${s.file}:${s.scope}`));
    expect(offenders.map(where), "a real-path call outside the two spelling functions: route it through realTargetPath / realPathThroughExisting").toEqual([]);
    expect(sites.map((s) => `${s.file}:${s.scope}`).sort()).toEqual(["user-file.ts:realPathThroughExisting", "user-file.ts:realTargetPath"]);
  });

  it("(b) a .replace / .replaceAll whose pattern matches a backslash occurs only inside canonicalPathSpelling", () => {
    const sites = sitesWhere(
      (n) => ts.isCallExpression(n) && ["replace", "replaceAll"].includes(calleeName(n) ?? "") && patternMatchesBackslash(n.arguments[0]),
    );
    const offenders = sites.filter((s) => !(s.file === "user-file.ts" && s.scope === "canonicalPathSpelling"));
    expect(offenders.map(where), "a second separator fold: spell the path with canonicalPathSpelling").toEqual([]);
    expect(sites, "canonicalPathSpelling no longer folds the separator").toHaveLength(1);
  });

  it("(c) no .split(sep).join(\"/\") (or a backslash split joined with /) occurs in any scanned file", () => {
    const sites = sitesWhere(isSeparatorFoldChain);
    expect(sites.map(where), "a recorded relative path spelled by hand: use canonicalPathSpelling(rel)").toEqual([]);
  });

  it("(d) no variable, function, parameter or import binding named toPosix is declared in a scanned file", () => {
    const sites = sitesWhere(
      (n) =>
        (ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isParameter(n) || ts.isImportSpecifier(n) || ts.isBindingElement(n)) &&
        n.name !== undefined &&
        ts.isIdentifier(n.name) &&
        n.name.text === "toPosix",
    );
    expect(sites.map(where), "a second fold helper: call canonicalPathSpelling from install/user-file.ts").toEqual([]);
  });

  it("(e) install-marker.ts decides both bindings by sameRecordedPath, and never compares `here` raw", () => {
    const calls = sitesWhere((n) => ts.isCallExpression(n) && calleeName(n) === "sameRecordedPath");
    expect(calls.map((s) => `${s.file}:${s.scope}`).sort(), "sameRecordedPath must decide markerBinding and readKitHomeRecord, once each").toEqual([
      "install-marker.ts:markerBinding",
      "install-marker.ts:readKitHomeRecord",
    ]);
    const sf = sourceOf("install-marker.ts");
    const raw: string[] = [];
    for (const fnName of ["markerBinding", "readKitHomeRecord"]) {
      const fn = functionNamed(sf, fnName);
      expect(fn, `no function ${fnName} in install-marker.ts`).not.toBeNull();
      for (const b of nodesUnder(fn as ts.Node, ts.isBinaryExpression)) {
        if (!EQUALITY.has(b.operatorToken.kind)) continue;
        const sides = [b.left, b.right];
        const hereSide = sides.findIndex((x) => ts.isIdentifier(x) && x.text === "here");
        if (hereSide === -1) continue;
        const other = sides[1 - hereSide];
        if (other.kind === ts.SyntaxKind.NullKeyword) continue;
        raw.push(`install-marker.ts:${lineOf(sf, b)} (in ${fnName}) ${b.getText(sf)}`);
      }
    }
    expect(raw, "a raw comparison of a recorded path against `here`: decide it with sameRecordedPath").toEqual([]);
  });

  it("(f) no spelling function reads process.platform; the one platform read is user-file.ts PATH_MAX_BYTES; docAbspath calls absoluteSpelling", () => {
    const reads = sitesWhere(isProcessPlatform);
    const spelling = reads.filter((s) => SPELLING_FUNCTIONS.includes(s.scope));
    expect(spelling.map(where), "the spelling branches on the injected path flavor, never on the platform").toEqual([]);
    // The one platform read in the installer sources predates this plan (plan 33.1-31): a path-length
    // limit, not a spelling. It is pinned by line content so a second read anywhere turns this red.
    const pinned = reads.map((s) => `${s.file}:${s.scope}:${sourceOf(s.file).text.split("\n")[s.line - 1].trim().split(" =")[0]}`);
    expect(pinned, "a process.platform read outside the one classified site").toEqual(["user-file.ts:<top-level>:export const PATH_MAX_BYTES"]);

    const doc = functionNamed(sourceOf("install.ts"), "docAbspath");
    expect(doc, "no docAbspath in install.ts").not.toBeNull();
    const docCalls = nodesUnder(doc as ts.Node, ts.isCallExpression).map((c) => calleeName(c));
    expect(docCalls, "docAbspath must spell through absoluteSpelling").toContain("absoluteSpelling");
    expect(docCalls, "docAbspath must not decide absoluteness by a leading-slash test").not.toContain("startsWith");
  });
});

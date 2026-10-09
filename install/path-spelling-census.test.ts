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
// THE COMPARISON AND ABSOLUTENESS SITES ARE DERIVED TOO (plan 34-21, D-23, review WR-09). Until that plan
// rule (e) inspected two named functions and only equalities with `here`, and rule (f) inspected only
// docAbspath, so a second absoluteness rule in install-marker.ts and the byte comparison in isOwnLink were
// invisible to the file that claimed to hold every site. Rule (e) now finds every equality and every
// startsWith / endsWith whose operand is a recorded-path name, a platform or node:path path producer, or
// the one spelling's own call; rule (f) finds every isAbsolute call, every `.startsWith("/")` and every
// regular-expression literal that matches a drive-letter prefix. Each derived site lies in a spelling
// function, is spelled on every path operand, or is CLASSIFIED with its reason; the derived counts, the
// classified-map sizes and the use of every classified key are asserted, so a new site, a dropped site
// and a stale exemption all turn the file red.
//
// WHAT IS NOT A COMPARISON SITE. A readback that is recorded and later compared only with another
// readback taken by the same function on the same host is not one: user-file.ts treeRecord writes a
// link's readlink into a `link:` record and into a tree's `link <target>` line, and a later treeRecord of
// the same path is what it is compared with (P11 of plan 34-21). A single `link:` record of a file entry
// is compared through isOwnLink, which asks sameRecordedPath (rule (e)'s caller set). A recorded path
// handed to a function that compares it is outside the two shapes rule (e) enumerates; that function's
// own comparison is a site.
//
// THE TEST-SIDE HALF (plan 34-12, D-19). The windows-latest run also failed tests whose product output was
// right: uninstall printed `C:\…\target/.claude/agents` and the test looked for the all-backslash
// `join(target, ".claude", "agents")`; a marker test expected `realpathSync.native(t)` where install wrote
// the canonical spelling. The second `describe` below scans every install/*.test.ts and *.test-support.ts
// and holds them to install/installer-paths.test-support.ts pathText / lineNamesPath / printedRel for a
// printed path and user-file.ts realTargetPath for a recorded one: no test folds a path by hand, matches a
// natively built path against output, decides absoluteness by a leading `/`, or calls
// realpathSync.native outside the one helper.
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
const SPELLING_FUNCTIONS = ["canonicalPathSpelling", "sameRecordedPath", "absoluteSpelling", "isRecordedAbsolute", "realTargetPath", "realPathThroughExisting"];

// ── rule (e): the comparison sites, derived (plan 34-21, D-23, WR-09) ────────────────────────────────

/** The callees whose result is a path the platform or node:path produced: a readback or a resolution. */
const PATH_PRODUCERS = new Set(["readlinkSync", "realpathSync", "realTargetPath", "realPathThroughExisting", "homedir", "cwd", "resolve"]);

/** The names a recorded path, or the value it is compared with, carries in the installer sources. */
const RECORDED_PATH_NAMES = new Set(["target", "grugopsHome", "kitRoot", "boundTo", "here", "TARGET", "GRUGOPS_HOME", "KIT_ROOT", "GRUGOPS_SRC"]);

/** `e` without its parentheses and non-null assertions. */
function stripped(e: ts.Expression): ts.Expression {
  let cur = e;
  while (ts.isParenthesizedExpression(cur) || ts.isNonNullExpression(cur)) cur = cur.expression;
  return cur;
}

/** The one spelling's own call: `canonicalPathSpelling(...)`. */
const isSpelledOperand = (e: ts.Expression): boolean => {
  const x = stripped(e);
  return ts.isCallExpression(x) && calleeName(x) === "canonicalPathSpelling";
};

/** A path operand: a path producer's call, a recorded-path name (identifier or property), or the one spelling's call. */
function isPathOperand(e: ts.Expression): boolean {
  const x = stripped(e);
  if (ts.isCallExpression(x)) return isSpelledOperand(x) || PATH_PRODUCERS.has(calleeName(x) ?? "");
  if (ts.isIdentifier(x)) return RECORDED_PATH_NAMES.has(x.text);
  if (ts.isPropertyAccessExpression(x)) return RECORDED_PATH_NAMES.has(x.name.text);
  return false;
}

/** Excluded by rule: a comparison with `null`, `undefined` or a `typeof` value is not a path comparison. */
const isExcludedOperand = (e: ts.Expression): boolean => {
  const x = stripped(e);
  return x.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(x) && x.text === "undefined") || ts.isTypeOfExpression(x);
};

interface ComparisonSite extends Site {
  /** The operator (`===`, `!==`, `==`, `!=`) or the callee (`startsWith`, `endsWith`). */
  readonly op: string;
  readonly operands: readonly ts.Expression[];
  readonly text: string;
}

/** Every equality, and every startsWith / endsWith (receiver and argument 0), with a path operand. */
function comparisonSites(): ComparisonSite[] {
  const out: ComparisonSite[] = [];
  for (const file of scannedFiles()) {
    const sf = sourceOf(file);
    const walk = (node: ts.Node): void => {
      let op: string | null = null;
      let operands: ts.Expression[] = [];
      if (ts.isBinaryExpression(node) && EQUALITY.has(node.operatorToken.kind)) {
        op = node.operatorToken.getText(sf);
        operands = [node.left, node.right];
      } else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["startsWith", "endsWith"].includes(node.expression.name.text)) {
        op = node.expression.name.text;
        operands = node.arguments[0] === undefined ? [node.expression.expression] : [node.expression.expression, node.arguments[0]];
      }
      if (op !== null && !operands.some(isExcludedOperand) && operands.some(isPathOperand)) {
        out.push({ file, line: lineOf(sf, node), scope: scopeOf(node), op, operands, text: node.getText(sf).replace(/\s+/g, " ") });
      }
      ts.forEachChild(node, walk);
    };
    walk(sf);
  }
  return out;
}

/** The derived comparison sites when plan 34-21 wrote rule (e) (the SUMMARY lists each with its verdict). */
const DERIVED_COMPARISON_COUNT = 5;

/** A comparison site that is neither inside a spelling function nor spelled on every path operand, with its reason. Keyed by file, scope and operator. */
const CLASSIFIED_COMPARISONS = new Map<string, string>([
  [
    "install.ts:<top-level>:===",
    "TARGET === canonicalPathSpelling(GRUGOPS_SRC) (P5): TARGET is canonical at its one assignment (resolveTarget returns canonicalPathSpelling on every arm), so both sides are in the one spelling",
  ],
  [
    "install.ts:isPruneProtected:===",
    "p === TARGET: the protected-path denylist compares a path this run composed from TARGET with TARGET itself; no recorded value and no readback is an operand",
  ],
  [
    "uninstall.ts:isProtected:===",
    "p === TARGET: the protected-path denylist compares a path this run composed from TARGET with TARGET itself; no recorded value and no readback is an operand",
  ],
]);

// ── rule (f): the absoluteness sites, derived (plan 34-21, D-23, WR-09) ──────────────────────────────

/** What kind of absoluteness decision `node` is, or null: an isAbsolute call, a `.startsWith("/")`, or a drive-letter regular expression. */
function absolutenessKind(node: ts.Node): string | null {
  if (ts.isCallExpression(node) && calleeName(node) === "isAbsolute") return "isAbsolute";
  if (ts.isCallExpression(node) && calleeName(node) === "startsWith" && node.arguments[0] !== undefined && ts.isStringLiteralLike(node.arguments[0]) && node.arguments[0].text === "/") {
    return 'startsWith("/")';
  }
  if (ts.isRegularExpressionLiteral(node)) {
    const text = node.text;
    const lastSlash = text.lastIndexOf("/");
    let re: RegExp;
    try {
      re = new RegExp(text.slice(1, lastSlash), text.slice(lastSlash + 1).replace(/[gy]/g, ""));
    } catch {
      return "drive-letter pattern"; // a pattern this file cannot read is reported, never trusted
    }
    for (const probe of ["C:/", "C:\\"]) {
      const m = re.exec(probe);
      if (m !== null && m.index === 0) return "drive-letter pattern";
    }
  }
  return null;
}

/** The functions that own the one absoluteness rule and the one spelling: an absoluteness site inside them is the rule. */
const ABSOLUTENESS_OWNERS = ["canonicalPathSpelling", "isRecordedAbsolute"];

/** The derived absoluteness sites when plan 34-21 wrote rule (f). */
const DERIVED_ABSOLUTENESS_COUNT = 7;

/** An absoluteness site outside the owners, with its reason. Keyed by file, scope and kind. */
const CLASSIFIED_ABSOLUTENESS = new Map<string, string>([
  ["install.ts:targetRel:isAbsolute", "isAbsolute over relative(TARGET, path) (P7): a containment test on a result node:path just computed, not a recorded value"],
  ["install.ts:mkdirp:isAbsolute", "isAbsolute over relative(TARGET, dir) (P7): a containment test on a result node:path just computed, not a recorded value"],
  ["user-file.ts:wayTo:isAbsolute", "isAbsolute over relative(root, path) (P7): a containment test on a result node:path just computed, not a recorded value"],
  ["uninstall.ts:abspath:isAbsolute", "the argv, env or cwd path the process is about to open on this host (P8), not a recorded value"],
  [
    'install-marker.ts:isLedgerPath:startsWith("/")',
    "the ledger entry grammar (P9): a POSIX path relative to the target on every platform, refused when it starts with `/`; a relativity rule of the record format, not a host absoluteness test",
  ],
]);

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

  it("(e) every derived comparison of a recorded path lies in a spelling function, is spelled on every path operand, or is classified; sameRecordedPath decides markerBinding, readKitHomeRecord and isOwnLink", () => {
    const calls = sitesWhere((n) => ts.isCallExpression(n) && calleeName(n) === "sameRecordedPath");
    expect(calls.map((s) => `${s.file}:${s.scope}`).sort(), "sameRecordedPath must decide markerBinding, readKitHomeRecord and isOwnLink, once each").toEqual([
      "install-marker.ts:markerBinding",
      "install-marker.ts:readKitHomeRecord",
      "user-file.ts:isOwnLink",
    ]);

    const sites = comparisonSites();
    const used = new Set<string>();
    const offenders: string[] = [];
    for (const s of sites) {
      if (SPELLING_FUNCTIONS.includes(s.scope)) continue;
      if (s.operands.filter(isPathOperand).every(isSpelledOperand)) continue;
      const key = `${s.file}:${s.scope}:${s.op}`;
      if (CLASSIFIED_COMPARISONS.has(key)) {
        used.add(key);
        continue;
      }
      offenders.push(`${where(s)} ${s.text}`);
    }
    expect(offenders, "a raw comparison of a recorded path: decide it with sameRecordedPath, or spell both sides with canonicalPathSpelling").toEqual([]);
    expect(
      sites.map((s) => `${where(s)} ${s.op}`),
      "the derived comparison sites changed: read each new site, decide it, then update DERIVED_COMPARISON_COUNT",
    ).toHaveLength(DERIVED_COMPARISON_COUNT);
    expect(CLASSIFIED_COMPARISONS.size, "the classified comparison map changed size").toBe(3);
    expect([...CLASSIFIED_COMPARISONS.keys()].filter((k) => !used.has(k)), "a stale exemption: a classified comparison key that no derived site matched").toEqual([]);
  });

  it("(f) every derived absoluteness decision lies in canonicalPathSpelling or isRecordedAbsolute, or is classified", () => {
    const sites: (Site & { readonly kind: string })[] = [];
    for (const file of scannedFiles()) {
      const sf = sourceOf(file);
      const walk = (node: ts.Node): void => {
        const kind = absolutenessKind(node);
        if (kind !== null) sites.push({ file, line: lineOf(sf, node), scope: scopeOf(node), kind });
        ts.forEachChild(node, walk);
      };
      walk(sf);
    }
    const used = new Set<string>();
    const offenders: string[] = [];
    for (const s of sites) {
      if (s.file === "user-file.ts" && ABSOLUTENESS_OWNERS.includes(s.scope)) continue;
      const key = `${s.file}:${s.scope}:${s.kind}`;
      if (CLASSIFIED_ABSOLUTENESS.has(key)) {
        used.add(key);
        continue;
      }
      offenders.push(`${where(s)} ${s.kind}`);
    }
    expect(offenders, "a second absoluteness rule: ask user-file.ts isRecordedAbsolute").toEqual([]);
    expect(
      sites.map((s) => `${where(s)} ${s.kind}`),
      "the derived absoluteness sites changed: read each new site, decide it, then update DERIVED_ABSOLUTENESS_COUNT",
    ).toHaveLength(DERIVED_ABSOLUTENESS_COUNT);
    expect(CLASSIFIED_ABSOLUTENESS.size, "the classified absoluteness map changed size").toBe(5);
    expect([...CLASSIFIED_ABSOLUTENESS.keys()].filter((k) => !used.has(k)), "a stale exemption: a classified absoluteness key that no derived site matched").toEqual([]);
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

// ── the test side (plan 34-12) ──────────────────────────────────────────────────────────────────────

/** The number of installer test and test-support files counted when the test-side census was written (plan 34-12; 28 since plan 34-14 added mode-census.test.ts). */
const TEST_SCANNED_FILE_COUNT = 28;

function scannedTestFiles(): string[] {
  return readdirSync(INSTALL_DIR)
    .filter((n) => n.endsWith(".test.ts") || n.endsWith(".test-support.ts"))
    .sort();
}

/** The callee names that build a path in the host's native spelling (node:path, and the test files' local `at` / `abs` / `atRel` built on join). */
const NATIVE_PATH_BUILDERS = new Set(["join", "resolve", "at", "abs", "atRel"]);

/**
 * Whether `e` is a call that builds a path in the host spelling: a bare `join(...)`, `resolve(...)`,
 * `at(...)` or `abs(...)` (the node:path imports and the test files' local helpers built on them), or
 * `path.join(...)` / `path.win32.join(...)`-style calls. An array's `.join` or `.at` is not one.
 */
function isNativePathCall(e: ts.Expression): boolean {
  if (!ts.isCallExpression(e)) return false;
  const c = e.expression;
  if (ts.isIdentifier(c)) return NATIVE_PATH_BUILDERS.has(c.text);
  if (ts.isPropertyAccessExpression(c) && (c.name.text === "join" || c.name.text === "resolve")) {
    const o = c.expression;
    if (ts.isIdentifier(o)) return o.text === "path";
    if (ts.isPropertyAccessExpression(o)) return o.name.text === "win32" || o.name.text === "posix";
  }
  return false;
}

/**
 * Whether `e` begins with a native path call: the call itself, a template literal that begins with one
 * (`${join(...)} (`), a string concatenation whose left operand does (`join(...) + " ("`, the spelling the
 * windows-latest red in uninstall-removal.test.ts used), or any of these in parentheses.
 */
function beginsWithNativePath(e: ts.Expression | undefined): boolean {
  if (e === undefined) return false;
  if (ts.isParenthesizedExpression(e)) return beginsWithNativePath(e.expression);
  if (isNativePathCall(e)) return true;
  if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.PlusToken) return beginsWithNativePath(e.left);
  return ts.isTemplateExpression(e) && e.head.text === "" && e.templateSpans.length > 0 && beginsWithNativePath(e.templateSpans[0].expression);
}

/**
 * Whether a pattern argument CONSUMES a backslash: a regular expression with a non-empty match on a lone
 * backslash, or a string pattern containing one. Stricter than patternMatchesBackslash, which also answers
 * true for a pattern that matches the empty string (`/^\s*…/`) and so would flag every anchored trim.
 */
function consumesBackslash(arg: ts.Expression | undefined): boolean {
  if (arg === undefined) return false;
  if (ts.isRegularExpressionLiteral(arg)) {
    const text = arg.text;
    const lastSlash = text.lastIndexOf("/");
    try {
      const m = new RegExp(text.slice(1, lastSlash), text.slice(lastSlash + 1).replace("g", "").replace("y", "")).exec("\\");
      return m !== null && m[0].length > 0;
    } catch {
      return true; // a pattern this file cannot read is reported, never trusted
    }
  }
  return ts.isStringLiteralLike(arg) && arg.text.includes("\\");
}

/** A replacement that spells a separator: the string "/" or any `sep` (`sep`, `path.posix.sep`). */
const isSeparatorReplacement = (arg: ts.Expression | undefined): boolean =>
  arg !== undefined &&
  ((ts.isStringLiteralLike(arg) && arg.text === "/") ||
    (ts.isIdentifier(arg) && arg.text === "sep") ||
    (ts.isPropertyAccessExpression(arg) && arg.name.text === "sep"));

describe("WIN-1 path-spelling census — tests (install/*.test.ts and *.test-support.ts)", () => {
  const files = scannedTestFiles();

  it("the scanned set is every installer test and test-support file, and its size is the one counted", () => {
    expect(files, `the scanned test set changed: ${files.join(", ")} — read the new file for path comparisons, then update TEST_SCANNED_FILE_COUNT`).toHaveLength(
      TEST_SCANNED_FILE_COUNT,
    );
    for (const f of ["installer-paths.test-support.ts", "uninstall-removal.test.ts", "installer-dry-run.test.ts", "marker-binding.test.ts", "install.test.ts"]) {
      expect(files).toContain(f);
    }
  });

  it("(t1) realpathSync.native is called only inside nativeRealPath, and nativeRealPath is used only where a native spelling is the point", () => {
    const sites = sitesWhere(
      (n) => ts.isPropertyAccessExpression(n) && n.name.text === "native" && ts.isIdentifier(n.expression) && n.expression.text === "realpathSync",
      files,
    );
    expect(
      sites.filter((s) => !(s.file === "installer-paths.test-support.ts" && s.scope === "nativeRealPath")).map(where),
      "a native real-path spelling in a test: expect user-file.ts realTargetPath for a recorded path, or call nativeRealPath where the native spelling is the point",
    ).toEqual([]);
    expect(sites.map((s) => `${s.file}:${s.scope}`)).toEqual(["installer-paths.test-support.ts:nativeRealPath"]);
    // Every use of nativeRealPath other than its declaration and its import: the remedy case in
    // marker-binding.test.ts (one reference, run once per spelling) and canonical-path.test.ts case (11),
    // which proves realTargetPath is the canonical spelling of the native real path.
    const uses = sitesWhere(
      (n) =>
        ts.isIdentifier(n) &&
        n.text === "nativeRealPath" &&
        !(ts.isFunctionDeclaration(n.parent) && n.parent.name === n) &&
        !ts.isImportSpecifier(n.parent),
      files,
    );
    const byFile = new Map<string, number>();
    for (const u of uses) byFile.set(u.file, (byFile.get(u.file) ?? 0) + 1);
    expect(Object.fromEntries([...byFile].sort()), `nativeRealPath used at: ${uses.map(where).join(", ")}`).toEqual({
      "canonical-path.test.ts": 2,
      "marker-binding.test.ts": 1,
    });
  });

  it("(t2) no test folds a path by hand: no .replace / .replaceAll of a backslash with a separator, no .split on a backslash, no .split(sep).join(\"/\")", () => {
    const folds = sitesWhere(
      (n) =>
        ts.isCallExpression(n) &&
        ["replace", "replaceAll"].includes(calleeName(n) ?? "") &&
        consumesBackslash(n.arguments[0]) &&
        isSeparatorReplacement(n.arguments[1]),
      files,
    );
    expect(folds.map(where), "a hand-made separator fold: compare through pathText / lineNamesPath / printedRel").toEqual([]);
    const splits = sitesWhere((n) => ts.isCallExpression(n) && calleeName(n) === "split" && ts.isPropertyAccessExpression(n.expression) && consumesBackslash(n.arguments[0]), files);
    expect(splits.map(where), "a path split on a backslash: compare through pathText / printedRel").toEqual([]);
    const chains = sitesWhere(isSeparatorFoldChain, files);
    expect(chains.map(where), "a path spelled by hand with split(sep).join(\"/\"): use printedRel / pathText").toEqual([]);
  });

  it("(t3) no test matches a natively built path against output: includes / toContain / startsWith / endsWith, or a RegExp, built from join / resolve / at / abs", () => {
    const direct = sitesWhere(
      (n) =>
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        ["includes", "toContain", "startsWith", "endsWith"].includes(n.expression.name.text) &&
        beginsWithNativePath(n.arguments[0]),
      files,
    );
    expect(direct.map(where), "a printed path compared in the host spelling: use lineNamesPath(line, path) or pathText").toEqual([]);
    const regex = sitesWhere(
      (n) =>
        ts.isNewExpression(n) &&
        ts.isIdentifier(n.expression) &&
        n.expression.text === "RegExp" &&
        (n.arguments ?? []).some((a) => ts.isTemplateExpression(a) && a.templateSpans.some((sp) => nodesUnder(sp.expression, (x): x is ts.Expression => ts.isExpression(x) && isNativePathCall(x)).length > 0)),
      files,
    );
    expect(regex.map(where), "a RegExp built from a host-spelled path: match the line with lineNamesPath instead").toEqual([]);
    // The same comparison one step removed: the argument is a variable whose declaration builds the path
    // natively (`const bak = join(...)`, then `l.includes(bak)`). The declaration is found by the type
    // checker's symbol resolution (imports are not resolved; only local declarations count), so a loop
    // variable or a parameter of the same name elsewhere is never confused with it.
    const program = ts.createProgram(
      files.map((f) => join(INSTALL_DIR, f)),
      { noResolve: true, noLib: true, types: [] },
    );
    const checker = program.getTypeChecker();
    const viaVariable: string[] = [];
    for (const file of files) {
      const sf = program.getSourceFile(join(INSTALL_DIR, file));
      expect(sf, `the program has no ${file}`).toBeDefined();
      const walk = (n: ts.Node): void => {
        if (
          ts.isCallExpression(n) &&
          ts.isPropertyAccessExpression(n.expression) &&
          ["includes", "toContain", "startsWith", "endsWith"].includes(n.expression.name.text) &&
          n.arguments[0] !== undefined &&
          ts.isIdentifier(n.arguments[0])
        ) {
          const decl = checker.getSymbolAtLocation(n.arguments[0])?.declarations?.[0];
          if (decl !== undefined && ts.isVariableDeclaration(decl) && beginsWithNativePath(decl.initializer)) {
            viaVariable.push(`${file}:${lineOf(sf as ts.SourceFile, n)} (${n.arguments[0].text})`);
          }
        }
        ts.forEachChild(n, walk);
      };
      walk(sf as ts.SourceFile);
    }
    expect(viaVariable, "a printed path compared in the host spelling through a variable: use lineNamesPath(line, path) or pathText").toEqual([]);
  });

  it("(t4) no test decides absoluteness by a leading `/` (`.startsWith(\"/\")`)", () => {
    const sites = sitesWhere(
      (n) =>
        ts.isCallExpression(n) &&
        calleeName(n) === "startsWith" &&
        n.arguments[0] !== undefined &&
        ts.isStringLiteralLike(n.arguments[0]) &&
        n.arguments[0].text === "/",
      files,
    );
    expect(sites.map(where), "a leading-/ absolute test reads C:\\… as relative: use printedRel (the flavor's isAbsolute)").toEqual([]);
  });

  it("(t5) no test declares toPosix, and the one canonicalPath delegates to realTargetPath", () => {
    const toPosixDecls = sitesWhere(
      (n) =>
        (ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isParameter(n) || ts.isImportSpecifier(n) || ts.isBindingElement(n)) &&
        n.name !== undefined &&
        ts.isIdentifier(n.name) &&
        n.name.text === "toPosix",
      files,
    );
    expect(toPosixDecls.map(where), "a second test-side spelling: compare through pathText or realTargetPath").toEqual([]);
    const decls = sitesWhere(
      (n) => (ts.isFunctionDeclaration(n) || ts.isVariableDeclaration(n)) && n.name !== undefined && ts.isIdentifier(n.name) && n.name.text === "canonicalPath",
      files,
    );
    expect(decls.map((d) => d.file), "the declarations named canonicalPath").toEqual(["install.test.ts"]);
    const fn = functionNamed(sourceOf("install.test.ts"), "canonicalPath");
    expect(fn, "no canonicalPath in install.test.ts").not.toBeNull();
    const calls = nodesUnder(fn as ts.Node, ts.isCallExpression).map((c) => calleeName(c));
    expect(calls, "canonicalPath must delegate to user-file.ts realTargetPath").toContain("realTargetPath");
    expect(calls.filter((c) => c === "replace" || c === "replaceAll" || c === "native" || c === "toPosix"), "canonicalPath must not spell the path itself").toEqual([]);
  });
});

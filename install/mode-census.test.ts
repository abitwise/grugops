// mode-census.test.ts — a TypeScript-AST census of every test and product site that sets, reads as
// evidence, renders or compares a file mode (plan 34-14, D-19, defect class WIN-2;
// .planning/phases/34-model-effort-dial-pi-support/34-GAP-PLANNING-BRIEF.md §2.2 and §2.3).
//
// WHY A CENSUS. The windows-latest run 37521787426 failed with `lost the user's mode: expected 438 to be
// 502`: tests modelled "the user changed the mode" with an owner-execute flip (0o766) that Windows cannot
// store, since it keeps only the read-only attribute of a file. Every POSIX run was green. Plan 34-13 fixed
// the sites: one test helper makes a user mode edit (installer-paths.test-support.ts userModeEdit, which
// clears the write bits), expected modes are read back with storedMode, and the product renders a mode
// only through user-file.ts modeText and compares a recorded mode only through install-marker.ts
// modeMatches. This file holds that rule on every OS, so a later edit that brings back a flip, a literal
// expected mode or a second comparison turns red on macOS and Linux too, not only on Windows (WIN-3).
//
// THE RULES.
//   (a) Installer tests (install/*.test.ts and *.test-support.ts): every chmod call is the one inside
//       userModeEdit (whose mode argument must be `<mode> & ~0o222`), or its line carries a trailing `// mode-census: <kind>` comment whose kind is in the
//       closed set below. The per-kind counts are numbers measured when this file was written.
//   (b) Scripts tests (scripts/*.test.ts): the chmod calls are counted, and no test reads `.mode` from a
//       stat result, so no scripts test uses a mode value as evidence.
//   (c) Installer sources (install/*.ts, not tests): one renderer (`.toString(8)` only in modeText), no
//       `modeOctal`, and one comparison (an equality with a mode operand only inside modeMatches).
//   (d) Installer tests: no fileRecord call takes a literal mode, no `toBe` / `toEqual` takes an octal
//       literal, no literal carries `;mode=` with four digits or the printed `file mode is` with four
//       digits. Only a line tagged `mode-census: row-315` (WINDOWS.md row 315, cases skipped where a mode
//       is not a fixture) may hold a literal expected mode.
//
// THE TAG KINDS (rule (a)). A tag says why a raw chmod is not a user mode edit:
//   access-denial  takes a permission away so a read or write fails (each such case is probe- or
//                  capability-gated where the platform ignores the bits);
//   restore        gives the permission back so the case or its cleanup can go on;
//   row-315        the chmod of a case WINDOWS.md row 315 covers (skipped on win32 and as root, reason
//                  printed); only in the two files that row names;
//   posix-bits     sets permission bits beyond read-only, inside a case gated on the measured host
//                  capability "POSIX permission bits beyond read-only" (plan 34-13, WINDOWS.md row 318).
//                  Added by this plan for installer-prune.test.ts IN-03: the case is neither of the other
//                  three, and the capability gate is checked structurally below. Plan 34-22 (D-23, WR-10)
//                  added the second asker: record-truth.test.ts's L1 pointer rows, whose writable mode
//                  change (the other-read bit toggled) reaches uninstall's pointer-file mode comparison.
// A tag claims a kind; the behavioural tests, not the tags, prove the rule (T-34-40, accepted). The counts
// make a new tag visible in review.
//
// LIMITS (stated, not hidden). A mode written in decimal (`toBe(420)`) cannot be told from any other
// number and is not caught. A chmod reached through an alias of the function (`const c = chmodSync`) is
// not caught. Rule (b) follows a stat result through a variable declared or assigned in the same file,
// by name (over-inclusive, so it fails closed), not through function returns.
//
// THE SCANNED SETS ARE DERIVED, NOT LISTED, and their sizes are asserted. Text in comments never counts
// except the tag itself, which must sit in a line comment after the call it tags.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const INSTALL_DIR = import.meta.dirname;
const SCRIPTS_DIR = join(INSTALL_DIR, "..", "scripts");

/** Sizes of the scanned sets, counted when this census was written (plan 34-14). */
const INSTALL_TEST_FILE_COUNT = 28;
const SCRIPTS_TEST_FILE_COUNT = 71;
const SOURCE_FILE_COUNT = 8;

/** Rule (a): the tagged raw chmod calls per kind, and the one untagged call (inside userModeEdit). */
const TAG_KIND_COUNTS: Readonly<Record<string, number>> = {
  "access-denial": 10,
  restore: 18,
  "row-315": 5,
  "posix-bits": 2,
};
const USER_MODE_EDIT_CHMOD_COUNT = 1;

/** Rule (b): the chmod calls in the scripts tests (access denial and restore; none sets a mode as evidence). */
const SCRIPTS_CHMOD_COUNT = 33;

/** Rule (d): the expected-mode literals allowed on a `mode-census: row-315` line. */
const ROW_315_LITERAL_EXPECTATION_COUNT = 2;

/** The files WINDOWS.md row 315 names; a row-315 tag anywhere else is a misclassification. */
const ROW_315_FILES = ["installer-marker-retention.test.ts", "installer-prune.test.ts"];
const POSIX_BITS_CAPABILITY = "POSIX permission bits beyond read-only";

const CHMOD_CALLEES = new Set(["chmodSync", "chmod", "fchmodSync", "fchmod", "lchmodSync", "lchmod"]);
const STAT_CALLEES = new Set(["statSync", "lstatSync", "fstatSync", "stat", "lstat", "fstat"]);
const TAG = /\/\/.*\bmode-census:\s*([A-Za-z0-9-]+)/;

function installTestFiles(): string[] {
  return readdirSync(INSTALL_DIR)
    .filter((n) => n.endsWith(".test.ts") || n.endsWith(".test-support.ts"))
    .sort();
}
function scriptsTestFiles(): string[] {
  return readdirSync(SCRIPTS_DIR)
    .filter((n) => n.endsWith(".test.ts"))
    .sort();
}
function sourceFiles(): string[] {
  return readdirSync(INSTALL_DIR)
    .filter((n) => n.endsWith(".ts"))
    .filter((n) => !n.endsWith(".test.ts") && !n.endsWith(".test-support.ts") && !n.endsWith(".d.ts"))
    .sort();
}

const sourceCache = new Map<string, ts.SourceFile>();
function sourceOf(dir: string, file: string): ts.SourceFile {
  const key = join(dir, file);
  let sf = sourceCache.get(key);
  if (sf === undefined) {
    sf = ts.createSourceFile(file, readFileSync(key, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    sourceCache.set(key, sf);
  }
  return sf;
}

const lineOf = (sf: ts.SourceFile, node: ts.Node): number => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

/** The text from the end of `node` to the end of its last line: where a trailing tag comment sits. */
function trailingText(sf: ts.SourceFile, node: ts.Node): string {
  const eol = sf.text.indexOf("\n", node.end);
  return sf.text.slice(node.end, eol === -1 ? sf.text.length : eol);
}

/** The kind of the `// mode-census: <kind>` comment after `node` on its line, or null. */
function tagAfter(sf: ts.SourceFile, node: ts.Node): string | null {
  return TAG.exec(trailingText(sf, node))?.[1] ?? null;
}

/** The name of the innermost named function around `node`. */
function scopeOf(node: ts.Node): string {
  for (let cur: ts.Node | undefined = node.parent; cur !== undefined; cur = cur.parent) {
    if (ts.isFunctionDeclaration(cur) && cur.name) return cur.name.text;
    if ((ts.isArrowFunction(cur) || ts.isFunctionExpression(cur)) && ts.isVariableDeclaration(cur.parent) && ts.isIdentifier(cur.parent.name)) {
      return cur.parent.name.text;
    }
    if (ts.isMethodDeclaration(cur) && ts.isIdentifier(cur.name)) return cur.name.text;
  }
  return "<top-level>";
}

/** The callee name of a call: `f(...)` → f, `x.f(...)` → f. */
function calleeName(call: ts.CallExpression): string | null {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) return e.name.text;
  return null;
}

/** `e` without parentheses, `await`, `!`, `as` and `satisfies` around it. */
function unwrap(e: ts.Expression): ts.Expression {
  for (;;) {
    if (ts.isParenthesizedExpression(e) || ts.isAwaitExpression(e) || ts.isNonNullExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e)) {
      e = e.expression;
    } else {
      return e;
    }
  }
}

interface Hit {
  readonly file: string;
  readonly line: number;
  readonly scope: string;
  readonly node: ts.Node;
  readonly sf: ts.SourceFile;
}
const where = (h: Hit): string => `${h.file}:${h.line} (in ${h.scope}) ${h.node.getText(h.sf).slice(0, 120)}`;

function hitsWhere(dir: string, files: readonly string[], pick: (node: ts.Node, sf: ts.SourceFile) => boolean): Hit[] {
  const out: Hit[] = [];
  for (const file of files) {
    const sf = sourceOf(dir, file);
    const walk = (node: ts.Node): void => {
      if (pick(node, sf)) out.push({ file, line: lineOf(sf, node), scope: scopeOf(node), node, sf });
      ts.forEachChild(node, walk);
    };
    walk(sf);
  }
  return out;
}

const isChmodCall = (n: ts.Node): n is ts.CallExpression => ts.isCallExpression(n) && CHMOD_CALLEES.has(calleeName(n) ?? "");
const isStatCall = (e: ts.Expression): boolean => {
  const u = unwrap(e);
  return ts.isCallExpression(u) && STAT_CALLEES.has(calleeName(u) ?? "");
};
const isOctalLiteral = (n: ts.Node, sf: ts.SourceFile): boolean => ts.isNumericLiteral(n) && /^0[oO]/.test(n.getText(sf));

/** Whether `n` is an operand of a bitwise `&` (a mask). */
const isMaskOperand = (n: ts.Node): boolean => ts.isBinaryExpression(n.parent) && n.parent.operatorToken.kind === ts.SyntaxKind.AmpersandToken;

function someUnder(root: ts.Node, pick: (n: ts.Node) => boolean): boolean {
  let found = false;
  const walk = (n: ts.Node): void => {
    if (found) return;
    if (pick(n)) found = true;
    else ts.forEachChild(n, walk);
  };
  walk(root);
  return found;
}

/** The innermost function-like node around `node`, or null at top level. */
function enclosingFunction(node: ts.Node): ts.FunctionLikeDeclaration | null {
  for (let cur: ts.Node | undefined = node.parent; cur !== undefined; cur = cur.parent) {
    if (ts.isArrowFunction(cur) || ts.isFunctionExpression(cur) || ts.isFunctionDeclaration(cur) || ts.isMethodDeclaration(cur)) return cur;
  }
  return null;
}

function countBy<T>(items: readonly T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[key(i)] = (out[key(i)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

// ── (a) the chmod calls of the installer tests ─────────────────────────────────────────────────────

describe("WIN-2 mode census (a): every chmod in an installer test is the one user mode edit or a tagged non-edit", () => {
  const files = installTestFiles();
  const chmods = hitsWhere(INSTALL_DIR, files, isChmodCall);
  const inHelper = (h: Hit): boolean => h.file === "installer-paths.test-support.ts" && h.scope === "userModeEdit";

  it("the scanned set is every installer test and test-support file, and its size is the one counted", () => {
    expect(files, `the scanned set changed: ${files.join(", ")} — read the new file for chmod calls and mode expectations, then update INSTALL_TEST_FILE_COUNT`).toHaveLength(
      INSTALL_TEST_FILE_COUNT,
    );
    for (const f of ["installer-paths.test-support.ts", "install.test.ts", "installer-marker-retention.test.ts", "settings-json-provenance.test.ts", "installer-prune.test.ts", "mode-census.test.ts"]) {
      expect(files).toContain(f);
    }
  });

  it("exactly one chmod is untagged, and it is the one inside userModeEdit", () => {
    expect(chmods.filter(inHelper).map(where), "the user mode edit helper no longer makes its edit with a chmod").toHaveLength(USER_MODE_EDIT_CHMOD_COUNT);
    const untagged = chmods.filter((h) => !inHelper(h) && tagAfter(h.sf, h.node) === null);
    expect(
      untagged.map(where),
      "a raw chmod in an installer test: a user mode edit goes through installer-paths.test-support.ts userModeEdit (a change every platform stores); any other chmod carries a trailing `// mode-census: <kind>` comment",
    ).toEqual([]);
  });

  it("the chmod inside userModeEdit clears the write bits (`<mode> & ~0o222`), the one mode change every platform stores", () => {
    // Mutation m4 of plan 34-14: an owner-execute flip (0o766) inside the helper is a change macOS and Linux
    // store, so every behavioural test stays green on a POSIX host. This shape check is what turns it red there.
    const clearsWriteBits = (e: ts.Expression | undefined): boolean => {
      if (e === undefined) return false;
      const u = unwrap(e);
      if (!ts.isBinaryExpression(u) || u.operatorToken.kind !== ts.SyntaxKind.AmpersandToken) return false;
      const mask = unwrap(u.right);
      return ts.isPrefixUnaryExpression(mask) && mask.operator === ts.SyntaxKind.TildeToken && ts.isNumericLiteral(mask.operand) && Number(mask.operand.text) === 0o222;
    };
    const helper = chmods.filter(inHelper);
    expect(helper.filter((h) => !clearsWriteBits((h.node as ts.CallExpression).arguments[1])).map(where), "userModeEdit no longer clears exactly the write bits").toEqual([]);
  });

  it("every tag names a kind from the closed set, and the per-kind counts are the ones measured", () => {
    const tagged = chmods.filter((h) => !inHelper(h)).map((h) => ({ h, kind: tagAfter(h.sf, h.node) ?? "<none>" }));
    const unknown = tagged.filter((t) => !(t.kind in TAG_KIND_COUNTS));
    expect(unknown.map((t) => `${where(t.h)} → ${t.kind}`), `a tag outside the closed set {${Object.keys(TAG_KIND_COUNTS).join(", ")}}`).toEqual([]);
    const byKind = countBy(tagged, (t) => t.kind);
    const byFileKind = countBy(tagged, (t) => `${t.h.file} ${t.kind}`);
    expect(byKind, `per-kind chmod counts changed; per file and kind: ${JSON.stringify(byFileKind)}`).toEqual(
      Object.fromEntries(Object.entries(TAG_KIND_COUNTS).sort(([a], [b]) => a.localeCompare(b))),
    );
  });

  it("a row-315 tag is only in the files WINDOWS.md row 315 names, and a posix-bits chmod is inside a case gated on the POSIX-bits capability", () => {
    const row315 = chmods.filter((h) => tagAfter(h.sf, h.node) === "row-315");
    expect(row315.filter((h) => !ROW_315_FILES.includes(h.file)).map(where), "a row-315 tag in a file WINDOWS.md row 315 does not name").toEqual([]);
    const posix = chmods.filter((h) => tagAfter(h.sf, h.node) === "posix-bits");
    const ungated = posix.filter((h) => {
      const fn = enclosingFunction(h.node);
      return (
        fn === null ||
        !someUnder(
          fn,
          (n) =>
            ts.isCallExpression(n) &&
            calleeName(n) === "hostCapabilityOrSkip" &&
            n.arguments[0] !== undefined &&
            ts.isStringLiteralLike(n.arguments[0]) &&
            n.arguments[0].text === POSIX_BITS_CAPABILITY,
        )
      );
    });
    expect(ungated.map(where), `a posix-bits chmod outside a case that asks hostCapabilityOrSkip("${POSIX_BITS_CAPABILITY}", …)`).toEqual([]);
  });

  it("no tag sits on a line that is neither a chmod nor a row-315 literal expectation (no stray or misplaced tags)", () => {
    const tagLines = new Set(chmods.map((h) => `${h.file}:${h.line}`));
    for (const h of rowLiteralExpectations()) tagLines.add(`${h.file}:${h.line}`);
    const stray: string[] = [];
    for (const file of files.filter((f) => f !== "mode-census.test.ts")) {
      sourceOf(INSTALL_DIR, file)
        .text.split("\n")
        .forEach((l, i) => {
          if (l.includes("mode-census:") && !tagLines.has(`${file}:${i + 1}`)) stray.push(`${file}:${i + 1} ${l.trim()}`);
        });
    }
    expect(stray, "a mode-census tag that tags nothing this census reads").toEqual([]);
  });
});

// ── (b) the scripts tests ──────────────────────────────────────────────────────────────────────────

describe("WIN-2 mode census (b): no scripts test uses a mode as evidence", () => {
  const files = scriptsTestFiles();

  it("the scanned set is every scripts test, and its size is the one counted", () => {
    expect(files, `the scanned set changed: ${files.length} files — read the new test for chmod calls and mode reads, then update SCRIPTS_TEST_FILE_COUNT`).toHaveLength(
      SCRIPTS_TEST_FILE_COUNT,
    );
    for (const f of ["board-read.test.ts", "context-io.test.ts", "kit-model.test.ts"]) expect(files).toContain(f);
  });

  it("the chmod calls in the scripts tests are the number counted", () => {
    const chmods = hitsWhere(SCRIPTS_DIR, files, isChmodCall);
    expect(chmods.length, `scripts chmod calls per file: ${JSON.stringify(countBy(chmods, (h) => h.file))} — read each new one: an access denial or a restore is fine, a mode set as evidence is a WIN-2 member`).toBe(
      SCRIPTS_CHMOD_COUNT,
    );
  });

  it("no scripts test reads .mode from a statSync / lstatSync / fstatSync (or async) result", () => {
    const reads: string[] = [];
    for (const file of files) {
      const sf = sourceOf(SCRIPTS_DIR, file);
      // Names bound to a stat result anywhere in the file (over-inclusive by design: fails closed).
      const statNames = new Set<string>();
      const collect = (n: ts.Node): void => {
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer !== undefined && isStatCall(n.initializer)) statNames.add(n.name.text);
        if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(n.left) && isStatCall(n.right)) statNames.add(n.left.text);
        ts.forEachChild(n, collect);
      };
      collect(sf);
      const fromStat = (e: ts.Expression): boolean => {
        const u = unwrap(e);
        return isStatCall(u) || (ts.isIdentifier(u) && statNames.has(u.text));
      };
      const walk = (n: ts.Node): void => {
        const modeRead =
          (ts.isPropertyAccessExpression(n) && n.name.text === "mode" && fromStat(n.expression)) ||
          (ts.isElementAccessExpression(n) && ts.isStringLiteralLike(n.argumentExpression) && n.argumentExpression.text === "mode" && fromStat(n.expression)) ||
          (ts.isBindingElement(n) &&
            ts.isObjectBindingPattern(n.parent) &&
            ((n.propertyName !== undefined && ts.isIdentifier(n.propertyName) && n.propertyName.text === "mode") ||
              (n.propertyName === undefined && ts.isIdentifier(n.name) && n.name.text === "mode")) &&
            ts.isVariableDeclaration(n.parent.parent) &&
            n.parent.parent.initializer !== undefined &&
            fromStat(n.parent.parent.initializer));
        if (modeRead) reads.push(`scripts/${file}:${lineOf(sf, n)} ${n.getText(sf).slice(0, 100)}`);
        ts.forEachChild(n, walk);
      };
      walk(sf);
    }
    expect(reads, "a scripts test reads a file mode as evidence: a POSIX bit Windows may not store; compare what the platform stores (see installer-paths.test-support.ts storedMode / userModeEdit)").toEqual([]);
  });
});

// ── (c) the installer sources ──────────────────────────────────────────────────────────────────────

describe("WIN-2 mode census (c): the installer has one mode renderer and one recorded-mode comparison", () => {
  const files = sourceFiles();

  it("the scanned set is every installer source module, and its size is the one counted", () => {
    expect(files, `the scanned set changed: ${files.join(", ")} — read the new module for mode rendering and comparison, then update SOURCE_FILE_COUNT`).toHaveLength(
      SOURCE_FILE_COUNT,
    );
    for (const f of ["user-file.ts", "install-marker.ts", "install.ts", "uninstall.ts"]) expect(files).toContain(f);
  });

  it("`.toString(8)` occurs only inside modeText in user-file.ts, and modeText is declared once, there", () => {
    const renders = hitsWhere(
      INSTALL_DIR,
      files,
      (n) => ts.isCallExpression(n) && calleeName(n) === "toString" && n.arguments[0] !== undefined && ts.isNumericLiteral(n.arguments[0]) && Number(n.arguments[0].text) === 8,
    );
    expect(
      renders.filter((h) => !(h.file === "user-file.ts" && h.scope === "modeText")).map(where),
      "a second mode renderer: render a file mode with user-file.ts modeText",
    ).toEqual([]);
    expect(renders.map((h) => `${h.file}:${h.scope}`), "modeText no longer renders through toString(8)").toEqual(["user-file.ts:modeText"]);
    const decls = hitsWhere(
      INSTALL_DIR,
      files,
      (n) => (ts.isFunctionDeclaration(n) || ts.isVariableDeclaration(n)) && n.name !== undefined && ts.isIdentifier(n.name) && n.name.text === "modeText",
    );
    expect(decls.map((h) => h.file), "the declarations named modeText").toEqual(["user-file.ts"]);
  });

  it("no declaration, import or export named modeOctal exists", () => {
    const sites = hitsWhere(
      INSTALL_DIR,
      files,
      (n) =>
        (ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isParameter(n) || ts.isImportSpecifier(n) || ts.isExportSpecifier(n) || ts.isBindingElement(n)) &&
        n.name !== undefined &&
        ts.isIdentifier(n.name) &&
        n.name.text === "modeOctal",
    );
    expect(sites.map(where), "modeOctal was the second renderer plan 34-13 removed: use modeText").toEqual([]);
  });

  it("an equality with a mode operand (modeText(…), recordedModeOf(…) or a .mode read) occurs only inside modeMatches, and modeMatches is asked by recordMatches and the two uninstall created-file checks", () => {
    const EQUALITY = new Set([
      ts.SyntaxKind.EqualsEqualsEqualsToken,
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.SyntaxKind.EqualsEqualsToken,
      ts.SyntaxKind.ExclamationEqualsToken,
    ]);
    const modeOperand = (e: ts.Expression): boolean => {
      const u = unwrap(e);
      if (ts.isCallExpression(u)) return ["modeText", "recordedModeOf"].includes(calleeName(u) ?? "");
      if (ts.isPropertyAccessExpression(u)) return u.name.text === "mode";
      if (ts.isBinaryExpression(u) && u.operatorToken.kind === ts.SyntaxKind.AmpersandToken) return modeOperand(u.left) || modeOperand(u.right);
      return false;
    };
    const compares = hitsWhere(INSTALL_DIR, files, (n) => ts.isBinaryExpression(n) && EQUALITY.has(n.operatorToken.kind) && (modeOperand(n.left) || modeOperand(n.right)));
    expect(
      compares.filter((h) => !(h.file === "install-marker.ts" && h.scope === "modeMatches")).map(where),
      "a second mode comparison: compare a recorded mode with install-marker.ts modeMatches(recordedMode, mode)",
    ).toEqual([]);
    expect(compares.map((h) => `${h.file}:${h.scope}`), "modeMatches no longer holds the one comparison").toEqual(["install-marker.ts:modeMatches"]);
    const asks = hitsWhere(INSTALL_DIR, files, (n) => ts.isCallExpression(n) && calleeName(n) === "modeMatches");
    expect(countBy(asks, (h) => h.file), `modeMatches is asked at: ${asks.map(where).join("; ")}`).toEqual({ "install-marker.ts": 1, "uninstall.ts": 2 });
    expect(asks.filter((h) => h.file === "install-marker.ts").map((h) => h.scope)).toEqual(["recordMatches"]);
  });
});

// ── (d) no literal expected mode in an installer test ─────────────────────────────────────────────

/**
 * Every `toBe` / `toEqual` / `toStrictEqual` call in the installer tests whose argument holds an octal literal
 * as a value. An octal literal that is an operand of `&` is a mask over a mode read back from the platform
 * (`statSync(p).mode & 0o7777`, the correct practice, W15), not an expected mode, and does not count.
 */
function octalExpectations(): Hit[] {
  return hitsWhere(
    INSTALL_DIR,
    installTestFiles(),
    (n, sf) =>
      ts.isCallExpression(n) &&
      ["toBe", "toEqual", "toStrictEqual"].includes(calleeName(n) ?? "") &&
      n.arguments.some((a) => someUnder(a, (x) => isOctalLiteral(x, sf) && !isMaskOperand(x))),
  );
}

/** Every literal (string, template piece, regular expression) in the installer tests that spells a mode. */
const MODE_TEXT = [/;mode=[0-7]{4}/, /file mode is [0-7]{4}/];
function modeTextLiterals(): Hit[] {
  return hitsWhere(INSTALL_DIR, installTestFiles(), (n) => {
    const text =
      ts.isStringLiteralLike(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)
        ? n.text
        : ts.isRegularExpressionLiteral(n)
          ? n.text
          : null;
    return text !== null && MODE_TEXT.some((p) => p.test(text));
  });
}

/** The literal expected modes that sit on a `mode-census: row-315` line (the assertion's own line). */
function rowLiteralExpectations(): Hit[] {
  const onRow315 = (h: Hit): boolean => {
    const stmt = statementOf(h.node);
    return tagAfter(h.sf, stmt) === "row-315";
  };
  return [...octalExpectations(), ...modeTextLiterals()].filter(onRow315);
}

/** The statement a node belongs to (the tag sits after the statement, not after the inner literal). */
function statementOf(node: ts.Node): ts.Node {
  let cur: ts.Node = node;
  while (cur.parent !== undefined && !ts.isSourceFile(cur.parent) && !ts.isBlock(cur.parent) && !ts.isStatement(cur)) cur = cur.parent;
  return cur;
}

describe("WIN-2 mode census (d): no installer test expects a literal mode", () => {
  const files = installTestFiles();

  it("no fileRecord call takes a numeric literal mode", () => {
    const sites = hitsWhere(
      INSTALL_DIR,
      files,
      (n) => ts.isCallExpression(n) && calleeName(n) === "fileRecord" && n.arguments[1] !== undefined && ts.isNumericLiteral(unwrap(n.arguments[1])),
    );
    expect(sites.map(where), "a record built with a literal mode: take the mode the platform stored (storedMode) or the one userModeEdit returns").toEqual([]);
  });

  it("no toBe / toEqual takes an octal literal, and no literal spells `;mode=` or `file mode is` with four digits, except on a row-315 line", () => {
    const row315 = rowLiteralExpectations();
    const exempt = new Set(row315.map((h) => h.node));
    const offenders = [...octalExpectations(), ...modeTextLiterals()].filter((h) => !exempt.has(h.node));
    expect(
      offenders.map(where),
      "a literal expected mode: read the expectation back with storedMode (or modeText(storedMode(p))), since Windows stores only the read-only bit",
    ).toEqual([]);
    expect(row315.map(where), "the row-315 literal expectations changed").toHaveLength(ROW_315_LITERAL_EXPECTATION_COUNT);
    expect(row315.every((h) => ROW_315_FILES.includes(h.file))).toBe(true);
  });
});

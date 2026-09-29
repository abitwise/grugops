// installer-fs-census.test.ts — a TypeScript-AST census of every MUTATING `node:fs` call site in the
// installer binaries (plan 33.1-18 Task 3, CR-02 sibling arms, T-33.1-181 / T-33.1-184).
//
// WHY A CENSUS AS WELL AS THE BEHAVIOURAL MATRIX. install/installer-dry-run.test.ts proves the
// DRY_RUN flows it runs. A flow it does not run proves nothing about a call site only that flow
// reaches. This file closes the other side statically: every mutating filesystem call under
// install/ is enumerated from the syntax tree and must match a pinned table, row for row and count
// for count, that names HOW the call is kept off the DRY_RUN path. A new call site, a call moved to
// another function, or a mutating function reached by any route other than a direct call turns this
// file red, and the fix is to read the new site and classify it, never to widen the scan.
//
// THE SCANNED SET IS DERIVED, NOT LISTED: every `*.ts` directly under install/ that is not a test,
// test-support or declaration file. Nothing is hand-maintained on the file axis.
//
// THE CONSTRAINTS ON HOW node:fs IS REACHED are what make a syntactic census sound:
//   - node:fs / fs / node:fs/promises / fs/promises are imported ONLY in the named-import form, so
//     every binding that can reach the filesystem has a name this file can see;
//   - `require`, `createRequire` and `getBuiltinModule` named anywhere, dynamic `import()`,
//     `import x = require()`, an fs module name as a string outside an import declaration, and
//     re-exports from the fs modules are refused outright, so there is no second door;
//   - a local binding of a mutating name is only ever the callee of a call: storing it, passing it,
//     re-exporting it or re-binding it is refused, so the call sites ARE the direct calls.
// Anything outside these constraints is a failure, not a skip.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const INSTALL_DIR = import.meta.dirname;
const FS_MODULES = new Set(["node:fs", "fs", "node:fs/promises", "fs/promises"]);
// Names that load a module at run time. `getBuiltinModule` is process.getBuiltinModule (Node 22.3+).
const LOADER_NAMES = new Set(["require", "createRequire", "getBuiltinModule"]);

// The two classification sets. Every name any scanned file imports from an FS module is in exactly
// one of them. FS_MUTATING also carries names no file imports today (the plan's floor), so a future
// import of one of them is already classified as mutating rather than silently read-only.
const FS_READ_ONLY = new Set([
  "existsSync",
  "readFileSync",
  "readSync",
  "readdirSync",
  "lstatSync",
  "statSync",
  "readlinkSync",
  "realpathSync",
  // plan 33.1-26 (DC-3): install/user-file.ts's descriptor calls and flag constants. fstatSync and
  // closeSync only inspect or release a descriptor; `constants` is the flag table the read-only open
  // takes its flags from (the `read-only-open` gate below checks those flags).
  "fstatSync",
  "closeSync",
  "constants",
]);
const FS_MUTATING = new Set([
  "writeFileSync",
  "appendFileSync",
  "renameSync",
  "linkSync",
  "unlinkSync",
  "mkdirSync",
  "rmSync",
  "rmdirSync",
  "copyFileSync",
  "cpSync",
  "symlinkSync",
  "mkdtempSync",
  "chmodSync",
  "truncateSync",
  "utimesSync",
  "openSync",
  "writeSync",
  "promises",
]);

// The closed gate vocabulary (plan 33.1-18 Task 3 step 2):
//   dry-run-return-above   on every path through the scope an `if (DRY_RUN)` branch returns or
//                          continues before the call
//   dry-run-guard-inline   the call's own condition includes `!DRY_RUN`
//   helper-gated           every caller of the helper is itself gated (the callers are named)
//   scratch-outside-roots  the call writes only under an os.tmpdir() mkdtemp directory the scope
//                          removes, never under TARGET or GRUGOPS_HOME
//   read-only-open         (plan 33.1-26, DC-3) an openSync whose flags expression names only
//                          O_RDONLY, O_NONBLOCK and O_NOCTTY from the imported `constants`, joined by
//                          `|`, each optional one as `(constants.O_X ?? 0)`, with no third (mode)
//                          argument. It creates, truncates and writes nothing. The flags are checked
//                          structurally below, not taken from the row's `why`.
type Gate = "dry-run-return-above" | "dry-run-guard-inline" | "helper-gated" | "scratch-outside-roots" | "read-only-open";
const GATES: ReadonlySet<string> = new Set<Gate>([
  "dry-run-return-above",
  "dry-run-guard-inline",
  "helper-gated",
  "scratch-outside-roots",
  "read-only-open",
]);

interface ClassifiedSite {
  /** `<file>:<scope>:<fs name>` — the fs name is the IMPORTED name, never a local alias. */
  readonly site: string;
  readonly count: number;
  readonly gate: Gate;
  readonly why: string;
}

// One row per `<file>:<scope>:<fs name>`, with its count. Each `why` cites the lines read when the
// row was classified (plan 33.1-18 Task 3). A line number that has since moved does not fail this
// file; a call that moved to another scope, or a count that changed, does.
const CLASSIFIED_SITES: readonly ClassifiedSite[] = [
  {
    site: "install.ts:backupDir:renameSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1279-1282 `if (DRY_RUN)` reports would-backup and returns before renameSync at :1283; the earlier returns (:1263-1278) only read",
  },
  {
    site: "install.ts:backupIfDiffers:renameSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1238-1241 `if (DRY_RUN)` reports would-backup and returns before renameSync at :1242; the earlier branches only read",
  },
  {
    site: "install.ts:copyKit:cpSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1617-1620 `if (DRY_RUN)` is the first statement and returns before cpSync at :1625",
  },
  {
    site: "install.ts:copyKit:renameSync",
    count: 3,
    gate: "dry-run-return-above",
    why: "install.ts:1617-1620 returns at the top of copyKit before the renames at :1630, :1631 and :1637",
  },
  {
    site: "install.ts:copyKit:rmSync",
    count: 2,
    gate: "dry-run-return-above",
    why: "install.ts:1617-1620 returns at the top of copyKit before the removals at :1624 and :1642",
  },
  {
    site: "install.ts:ensureBlock:appendFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1496-1499 `if (DRY_RUN)` reports would-add and returns before appendFileSync at :1502",
  },
  {
    site: "install.ts:ensureBlock:writeFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1496-1499 returns before the empty-file create at :1501",
  },
  {
    site: "install.ts:linkOrCopy:copyFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1521-1524 `if (DRY_RUN)` reports would-copy/would-link and returns before copyFileSync at :1537",
  },
  {
    site: "install.ts:linkOrCopy:symlinkSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1521-1524 returns before symlinkSync at :1528",
  },
  {
    site: "install.ts:materializeAdapter:writeFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:2184-2187 `if (DRY_RUN)` reports would-materialize and returns before writeFileSync at :2189; the earlier returns (:2129-2165) only read",
  },
  {
    site: "install.ts:materializeRunnable:copyFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:2293-2296 `if (DRY_RUN)` reports would-add and continues the loop before copyFileSync at :2298",
  },
  {
    site: "install.ts:mergeGemini:writeFileSync",
    count: 2,
    gate: "dry-run-return-above",
    why: "install.ts:1554-1557 returns before the create at :1559; install.ts:1585-1588 returns before the merge write at :1589",
  },
  {
    site: "install.ts:migratePreSteps:copyFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1429-1432 `if (DRY_RUN)` reports would-move and continues before copyFileSync at :1436",
  },
  {
    site: "install.ts:migratePreSteps:renameSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1429-1432 continues before the config backup rename at :1443",
  },
  {
    site: "install.ts:migratePreSteps:rmSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1480-1483 `if (DRY_RUN)` reports would-unlink and continues before rmSync at :1484",
  },
  {
    site: "install.ts:mkdirp:mkdirSync",
    count: 1,
    gate: "dry-run-guard-inline",
    why: "install.ts:430 the call's own condition is `!existsSync(dir) && !DRY_RUN` (the ancestor walk added by plan 33.1-21 inside that branch only reads)",
  },
  {
    site: "install.ts:removeBackup:rmSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1329-1332 `if (DRY_RUN)` reports would-remove and returns before rmSync at :1333",
  },
  {
    site: "install.ts:renderAdaptersInMirror:copyFileSync",
    count: 1,
    gate: "scratch-outside-roots",
    why: "install.ts:1789-1790 copies the target config INTO the mkdtemp mirror `dir` (install.ts:1719, under os.tmpdir()); removed in the finally at :1973",
  },
  {
    site: "install.ts:renderAdaptersInMirror:cpSync",
    count: 2,
    gate: "scratch-outside-roots",
    why: "install.ts:1747 and :1750 copy kit sources into the mkdtemp mirror `dir` (:1719); removed in the finally at :1973",
  },
  {
    site: "install.ts:renderAdaptersInMirror:mkdirSync",
    count: 3,
    gate: "scratch-outside-roots",
    why: "install.ts:1743, :1744 and :1789 create directories under the mkdtemp mirror `dir` (:1719); removed in the finally at :1973",
  },
  {
    site: "install.ts:renderAdaptersInMirror:mkdtempSync",
    count: 1,
    gate: "scratch-outside-roots",
    why: "install.ts:1719 creates the mirror under join(tmpdir(), ...), never under TARGET or GRUGOPS_HOME; removed in the finally at :1973",
  },
  {
    site: "install.ts:renderAdaptersInMirror:rmSync",
    count: 1,
    gate: "scratch-outside-roots",
    why: "install.ts:1973 removes only the mkdtemp mirror `dir` (:1719)",
  },
  {
    site: "install.ts:renderAdaptersInMirror:writeFileSync",
    count: 2,
    gate: "scratch-outside-roots",
    why: "install.ts:1745 and :1756 write package.json and the resolution probe under the mkdtemp mirror `dir` (:1719); removed in the finally at :1973",
  },
  {
    site: "install.ts:seedFile:copyFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:2199-2202 `if (DRY_RUN)` reports would-add and returns before copyFileSync at :2204",
  },
  {
    site: "install.ts:writeAskRules:writeFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:3067-3070 `if (DRY_RUN)` reports would-add and returns before writeFileSync at :3077; every earlier return only reads",
  },
  {
    site: "install.ts:writeMarker:writeFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:2315-2318 `if (DRY_RUN)` reports would-add and returns before writeFileSync at :2334",
  },
  {
    site: "user-file.ts:readUserFile:openSync",
    count: 1,
    gate: "read-only-open",
    why: "user-file.ts readUserFile opens with constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOCTTY ?? 0) and no mode, only after statSync showed a regular file within the bound; the descriptor is fstat'ed, read and closed in a finally (plan 33.1-26, DC-3)",
  },
  {
    site: "uninstall.ts:removeAskRules:unlinkSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "uninstall.ts:588-593 `if (DRY_RUN)` reports would-remove and returns before unlinkSync at :596; the earlier returns only read",
  },
  {
    site: "uninstall.ts:removeAskRules:writeFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "uninstall.ts:588-593 returns before writeFileSync at :601",
  },
  {
    site: "uninstall.ts:removeFile:rmSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "uninstall.ts:242-245 `if (DRY_RUN)` reports would-remove and returns before rmSync at :246",
  },
  {
    site: "uninstall.ts:removeIfEmpty:rmSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "uninstall.ts:377-380 `if (DRY_RUN)` reports would-remove and returns before rmSync at :381",
  },
  {
    site: "uninstall.ts:removeMarker:rmSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "uninstall.ts:630-633 `if (DRY_RUN)` reports would-remove and returns before rmSync at :634",
  },
  {
    site: "uninstall.ts:removeSentinelBlock:writeFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "uninstall.ts:304-307 `if (DRY_RUN)` reports would-remove and returns before writeFileSync at :359",
  },
  {
    site: "uninstall.ts:rmdirIfEmpty:rmdirSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "uninstall.ts:270-273 `if (DRY_RUN)` reports would-rmdir and returns before rmdirSync at :275; emptiness is read with readdirSync at :265 (CR-02 fix)",
  },
  {
    site: "uninstall.ts:unmergeGemini:unlinkSync",
    count: 2,
    gate: "dry-run-return-above",
    why: "uninstall.ts:413-416 `if (DRY_RUN)` reports would-edit and returns before unlinkSync at :445 and :459",
  },
  {
    site: "uninstall.ts:unmergeGemini:writeFileSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "uninstall.ts:413-416 returns before writeFileSync at :461",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// The derivation.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function scannedFiles(): string[] {
  return readdirSync(INSTALL_DIR)
    .filter((n) => n.endsWith(".ts"))
    .filter((n) => !n.endsWith(".test.ts") && !n.endsWith(".test-support.ts") && !n.endsWith(".d.ts"))
    .sort();
}

interface FileCensus {
  readonly file: string;
  /** Every refusal found in the file, one human-readable line each. */
  readonly refusals: string[];
  /** Imported fs name → local binding names (aliases included). */
  readonly imports: Map<string, Set<string>>;
  /** `<file>:<scope>:<fs name>` for every direct call of a mutating binding, with repeats. */
  readonly sites: string[];
  /** Every direct openSync call, with the problem its flags have under `read-only-open` (null: none). */
  readonly opens: { readonly site: string; readonly line: number; readonly flagsProblem: string | null }[];
}

// THE read-only-open FLAGS CHECK (plan 33.1-26, DC-3). Exported to the cases below through the
// census, and also driven directly over synthetic calls, so a mutation of the rule shows red here.
const READ_ONLY_OPEN_FLAGS = new Set(["O_RDONLY", "O_NONBLOCK", "O_NOCTTY"]);
function readOnlyOpenProblem(call: ts.CallExpression, constantsLocals: ReadonlySet<string>, sf: ts.SourceFile): string | null {
  if (call.arguments.length !== 2) return `takes ${call.arguments.length} argument(s); a read-only open takes the path and the flags only`;
  const problems: string[] = [];
  const named = new Set<string>();
  const flagName = (n: ts.Node): string | null =>
    ts.isPropertyAccessExpression(n) &&
    ts.isIdentifier(n.expression) &&
    constantsLocals.has(n.expression.text) &&
    READ_ONLY_OPEN_FLAGS.has(n.name.text)
      ? n.name.text
      : null;
  const visit = (n: ts.Node): void => {
    if (ts.isParenthesizedExpression(n)) return visit(n.expression);
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.BarToken) {
      visit(n.left);
      visit(n.right);
      return;
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
      const name = flagName(n.left);
      if (name !== null && name !== "O_RDONLY" && ts.isNumericLiteral(n.right) && n.right.text === "0") {
        named.add(name);
        return;
      }
      problems.push(`\`${n.getText(sf)}\` is not \`(constants.O_NONBLOCK ?? 0)\` or \`(constants.O_NOCTTY ?? 0)\``);
      return;
    }
    const name = flagName(n);
    if (name !== null) {
      named.add(name);
      return;
    }
    problems.push(`\`${n.getText(sf)}\` is not one of constants.${[...READ_ONLY_OPEN_FLAGS].join(" / constants.")}`);
  };
  visit(call.arguments[1]);
  if (!named.has("O_RDONLY")) problems.push("the flags do not name constants.O_RDONLY");
  return problems.length === 0 ? null : problems.join("; ");
}

const lineOf = (sf: ts.SourceFile, node: ts.Node): number => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

function moduleText(node: ts.Expression | undefined): string | null {
  return node !== undefined && ts.isStringLiteral(node) ? node.text : null;
}

// An identifier in one of these positions is a NAME, not a reference to a local binding.
function isNonReferencePosition(id: ts.Identifier): boolean {
  const p = id.parent;
  if (ts.isPropertyAccessExpression(p) && p.name === id) return true;
  if (ts.isPropertyAssignment(p) && p.name === id) return true;
  if (ts.isPropertySignature(p) && p.name === id) return true;
  if (ts.isPropertyDeclaration(p) && p.name === id) return true;
  if (ts.isMethodDeclaration(p) && p.name === id) return true;
  if (ts.isQualifiedName(p) && p.right === id) return true;
  if (ts.isImportSpecifier(p)) return true;
  return false;
}

function scopeOf(node: ts.Node): string {
  for (let cur: ts.Node | undefined = node.parent; cur !== undefined; cur = cur.parent) {
    if (ts.isFunctionDeclaration(cur) && cur.name) return cur.name.text;
    if (
      (ts.isArrowFunction(cur) || ts.isFunctionExpression(cur)) &&
      ts.isVariableDeclaration(cur.parent) &&
      ts.isIdentifier(cur.parent.name)
    ) {
      return cur.parent.name.text;
    }
  }
  return "<top-level>";
}

function censusOf(file: string): FileCensus {
  const text = readFileSync(join(INSTALL_DIR, file), "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const refusals: string[] = [];
  const imports = new Map<string, Set<string>>();
  const localToImported = new Map<string, string>();
  const sites: string[] = [];
  const opens: { site: string; line: number; flagsProblem: string | null }[] = [];

  // Pass 1: the import surface.
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) {
      const mod = moduleText(st.moduleSpecifier);
      if (mod === null || !FS_MODULES.has(mod)) continue;
      const clause = st.importClause;
      if (clause === undefined) continue; // a bare side-effect import binds nothing
      if (clause.name) refusals.push(`${file}:${lineOf(sf, st)} default import of ${mod} (named imports only)`);
      const nb = clause.namedBindings;
      if (nb !== undefined && ts.isNamespaceImport(nb)) {
        refusals.push(`${file}:${lineOf(sf, st)} namespace import of ${mod} (named imports only)`);
      } else if (nb !== undefined) {
        for (const el of nb.elements) {
          const imported = (el.propertyName ?? el.name).text;
          const local = el.name.text;
          if (!imports.has(imported)) imports.set(imported, new Set());
          imports.get(imported)!.add(local);
          localToImported.set(local, imported);
        }
      }
    } else if (ts.isImportEqualsDeclaration(st)) {
      refusals.push(`${file}:${lineOf(sf, st)} import-equals declaration (named ES imports only)`);
    } else if (ts.isExportDeclaration(st)) {
      const mod = moduleText(st.moduleSpecifier);
      if (mod !== null && FS_MODULES.has(mod)) refusals.push(`${file}:${lineOf(sf, st)} re-export from ${mod}`);
    }
  }

  // Pass 2: every node.
  const walk = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (callee.kind === ts.SyntaxKind.ImportKeyword) {
        refusals.push(`${file}:${lineOf(sf, node)} dynamic import() (static named imports only)`);
      }
    }
    // A module loader named ANYWHERE — called, stored, passed, or reached as a property — is a
    // second door to node:fs. Refusing only a direct CALL of `require` let `const r = x.require;
    // r("node:fs")` through (measured while writing this file), so every mention is refused.
    if (ts.isIdentifier(node) && LOADER_NAMES.has(node.text)) {
      refusals.push(`${file}:${lineOf(sf, node)} module loader ${node.text} named (a second door to node:fs)`);
    }
    // An fs module name as a string anywhere but an import declaration's specifier is a second
    // door too (a loader reached by a name this list does not know).
    if (
      ts.isStringLiteralLike(node) &&
      FS_MODULES.has(node.text) &&
      !(ts.isImportDeclaration(node.parent) && node.parent.moduleSpecifier === node)
    ) {
      refusals.push(`${file}:${lineOf(sf, node)} fs module name "${node.text}" outside an import declaration`);
    }
    if (ts.isIdentifier(node) && !isNonReferencePosition(node)) {
      const imported = localToImported.get(node.text);
      if (imported !== undefined && FS_MUTATING.has(imported)) {
        const p = node.parent;
        if (ts.isCallExpression(p) && p.expression === node) {
          sites.push(`${file}:${scopeOf(p)}:${imported}`);
          if (imported === "openSync") {
            opens.push({
              site: `${file}:${scopeOf(p)}:${imported}`,
              line: lineOf(sf, p),
              flagsProblem: readOnlyOpenProblem(p, imports.get("constants") ?? new Set(), sf),
            });
          }
        } else {
          refusals.push(
            `${file}:${lineOf(sf, node)} mutating fs binding ${node.text} (${imported}) used other than as a direct callee`,
          );
        }
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);

  return { file, refusals, imports, sites, opens };
}

function countBy(xs: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// The checks.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const FILES = scannedFiles();
const CENSUS = FILES.map(censusOf);

describe("installer fs census (CR-02 sibling arms, statically)", () => {
  it("the scanned set is derived and non-empty", () => {
    console.log(`installer fs census: ${FILES.length} non-test module(s) under install/: ${FILES.join(", ")}`);
    expect(FILES.length, "no non-test *.ts under install/ — the census would scan nothing").toBeGreaterThan(0);
    expect(FILES).toContain("uninstall.ts");
    expect(FILES).toContain("install.ts");
  });

  it("node:fs is reached only through named imports, and never through require/createRequire/getBuiltinModule/import()", () => {
    const refused = CENSUS.flatMap((c) => c.refusals.filter((r) => !r.includes("used other than as a direct callee")));
    expect(refused, refused.join("\n")).toEqual([]);
  });

  it("every imported fs name is classified in exactly one of FS_READ_ONLY / FS_MUTATING", () => {
    for (const n of FS_READ_ONLY) expect(FS_MUTATING.has(n), `${n} is in both sets`).toBe(false);
    const imported = new Set(CENSUS.flatMap((c) => [...c.imports.keys()]));
    const unclassified = [...imported].filter((n) => !FS_READ_ONLY.has(n) && !FS_MUTATING.has(n)).sort();
    expect(unclassified, `unclassified fs import(s): ${unclassified.join(", ")}`).toEqual([]);
    // The converse side is REPORTED, not failed: FS_MUTATING deliberately pre-classifies names no
    // module imports today, so a future import of one is already mutating.
    const unused = [...FS_READ_ONLY, ...FS_MUTATING].filter((n) => !imported.has(n)).sort();
    console.log(`installer fs census: classified names no scanned module imports: ${unused.join(", ") || "none"}`);
  });

  it("every reference to a mutating fs binding is the callee of a direct call", () => {
    const refused = CENSUS.flatMap((c) => c.refusals.filter((r) => r.includes("used other than as a direct callee")));
    expect(refused, refused.join("\n")).toEqual([]);
  });

  it("every CLASSIFIED_SITES row carries a gate from the closed vocabulary and a reason", () => {
    for (const row of CLASSIFIED_SITES) {
      expect(GATES.has(row.gate), `${row.site}: gate ${row.gate}`).toBe(true);
      expect(row.why.trim().length, `${row.site}: empty why`).toBeGreaterThan(0);
      expect(row.count, `${row.site}: count`).toBeGreaterThan(0);
    }
    const keys = CLASSIFIED_SITES.map((r) => r.site);
    expect(new Set(keys).size, "duplicate CLASSIFIED_SITES row").toBe(keys.length);
  });

  it("every openSync in a `read-only-open` row opens read-only, structurally (plan 33.1-26, DC-3)", () => {
    const readOnlyRows = new Set(CLASSIFIED_SITES.filter((r) => r.gate === "read-only-open").map((r) => r.site));
    const opens = CENSUS.flatMap((c) => c.opens).filter((o) => readOnlyRows.has(o.site));
    // Vacuity floor: the row set and the call set are each non-empty and cover each other.
    expect(readOnlyRows.size, "no read-only-open row: the check would ask nothing").toBeGreaterThan(0);
    expect(new Set(opens.map((o) => o.site)), "a read-only-open row names no openSync call").toEqual(readOnlyRows);
    const bad = opens.filter((o) => o.flagsProblem !== null).map((o) => `${o.site} (line ${o.line}): ${o.flagsProblem}`);
    expect(bad, bad.join("\n")).toEqual([]);
  });

  it("the read-only-open flags check refuses every write-capable or unrecognised flags shape (mutation proof)", () => {
    const problemOf = (src: string): string | null => {
      const sf = ts.createSourceFile("probe.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      let call: ts.CallExpression | undefined;
      const find = (n: ts.Node): void => {
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "openSync") call = n;
        ts.forEachChild(n, find);
      };
      find(sf);
      return readOnlyOpenProblem(call!, new Set(["constants", "fsc"]), sf);
    };
    const accepted = [
      "openSync(p, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOCTTY ?? 0));",
      "openSync(p, constants.O_RDONLY | constants.O_NONBLOCK);",
      "openSync(p, fsc.O_RDONLY);",
    ];
    const refused = [
      "openSync(p, constants.O_WRONLY);",
      "openSync(p, constants.O_RDWR | constants.O_NONBLOCK);",
      "openSync(p, constants.O_RDONLY | constants.O_CREAT);",
      "openSync(p, constants.O_RDONLY | constants.O_TRUNC);",
      "openSync(p, constants.O_RDONLY | constants.O_APPEND);",
      "openSync(p, constants.O_RDONLY, 0o644);",
      "openSync(p, \"r+\");",
      "openSync(p, \"r\");",
      "openSync(p, 2);",
      "openSync(p, flags);",
      "openSync(p, other.O_RDONLY);",
      "openSync(p, constants.O_NONBLOCK);",
      "openSync(p, constants.O_RDONLY | (constants.O_NONBLOCK ?? 1));",
      "openSync(p, constants.O_RDONLY | (constants.O_WRONLY ?? 0));",
      "openSync(p, constants.O_RDONLY + constants.O_NONBLOCK);",
      "openSync(p);",
    ];
    for (const src of accepted) expect(problemOf(src), src).toBeNull();
    for (const src of refused) expect(problemOf(src), src).not.toBeNull();
    expect(accepted.length + refused.length).toBe(19);
  });

  it("the mutating call-site multiset equals CLASSIFIED_SITES two-sided, with counts", () => {
    const found = countBy(CENSUS.flatMap((c) => c.sites));
    const pinned = new Map(CLASSIFIED_SITES.map((r) => [r.site, r.count]));
    const problems: string[] = [];
    for (const [site, n] of [...found].sort()) {
      const want = pinned.get(site);
      if (want === undefined) problems.push(`UNCLASSIFIED ${site} x${n}`);
      else if (want !== n) problems.push(`COUNT ${site}: found ${n}, pinned ${want}`);
    }
    for (const [site, n] of [...pinned].sort()) {
      if (!found.has(site)) problems.push(`STALE ROW ${site} x${n} (no such call site)`);
    }
    console.log(`installer fs census: ${[...found.values()].reduce((a, b) => a + b, 0)} mutating call site(s) in ${found.size} row(s)`);
    expect(problems, problems.join("\n")).toEqual([]);
  });
});

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
// A SECOND AXIS, READS (plan 33.1-27, brief DC-3). Every call of a node:fs export that can read a
// file's content is either inside install/user-file.ts readUserFile (the one bounded reader of a
// user path) or a READ_SITES row whose source argument is a kit path or standard input. The set of
// content-reading exports is derived from node:fs's own export list, not typed. The same census
// runs over each committed `.js`, so what tsc emitted is held to the same rule as its source.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
// The read axis enumerates node:fs's exports. A namespace import is fine in this TEST; the census's
// named-imports-only rule applies to the scanned installer modules.
import * as nodeFs from "node:fs";
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
    why: "install.ts:1426-1429 `if (DRY_RUN)` reports would-backup and returns before renameSync at :1430; the earlier returns (:1405-1425, including the wayTo refusal of a link or non-directory on the way added by the red-team fixes of plan 33.1-26) only read",
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
    why: "install.ts:1763-1766 `if (DRY_RUN)` reports would-add and returns before appendFileSync at :1775 (an existing regular file readForWrite read; red-team of plan 33.1-26). The create branch above it (writeTargetFile, then recordCreatedFile for the createdFiles ledger, plan 33.1-28) is after the same return",
  },
  {
    site: "install.ts:linkOrCopy:symlinkSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1821-1824 returns before symlinkSync at :1832 (reached only when readForWrite answered create)",
  },
  {
    site: "install.ts:migratePreSteps:renameSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1606-1609 continues before the config backup rename at :1622 (after readForWrite read both the legacy config and its destination; red-team of plan 33.1-26)",
  },
  {
    site: "install.ts:migratePreSteps:unlinkSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1703-1706 `if (DRY_RUN)` reports would-unlink and continues before unlinkSync at :1712 (after wayTo refused a link or non-directory on the way; red-team of plan 33.1-26). It replaced rmSync in the red-team fixes of plan 33.1-27: a throw is a counted verify and `unlinked` needs gone()",
  },
  {
    site: "install.ts:mkdirp:mkdirSync",
    count: 3,
    gate: "dry-run-guard-inline",
    why: "install.ts:470 (the kit home, outside the target: `!existsSync(dir) && !DRY_RUN`), :475 (a missing target: `!existsSync(TARGET) && !DRY_RUN`) and :486 (one missing component, non-recursive: `if (!DRY_RUN)`), each with `!DRY_RUN` in its own condition, below an `if (DRY_RUN) return null` at :473 for the in-target walk (red-team of plan 33.1-26: each existing component is checked with directoryComponent before the next is made)",
  },
  {
    site: "install.ts:writeTargetFile:writeFileSync",
    count: 1,
    gate: "helper-gated",
    why: "install.ts:509 writeTargetFile is the one writer of a whole file under TARGET (red-team of plan 33.1-26; flag \"wx\" for a create). Every caller returns or continues under DRY_RUN before calling it: migratePreSteps (:1606 continue, call :1611), ensureBlock (:1701, call :1707), linkOrCopy (:1752, call :1772), mergeGemini (:1937, call :1943; :1994, call :1998; plan 33.1-29 asks the geminiSettings ledger and the file's shape before either), materializeAdapter (:2447, call :2451), seedFile (:2477, call :2481), materializeRunnable (:2582 continue, call :2586), writeMarker (:2643, call :2683), writeAskRules (:3503, call :3512). It replaced the nine per-site writeFileSync/copyFileSync rows of plans 33.1-18/26",
  },
  {
    site: "install.ts:removeBackup:rmSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1495-1498 `if (DRY_RUN)` reports would-remove and returns before rmSync at :1504 (a directory backup, by lstat)",
  },
  {
    site: "install.ts:removeBackup:unlinkSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "install.ts:1495-1498 returns before unlinkSync at :1505 (anything that is not a directory, a link included, removed as a name; red-team of plan 33.1-27). A throw is a counted verify and `removed` needs gone()",
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
    count: 3,
    gate: "scratch-outside-roots",
    why: "install.ts:1819 and :1830 write package.json and the resolution probe, and :1870 writes the target config's readUserFile bytes (plan 33.1-26, DC-3; it replaced copyFileSync), all under the mkdtemp mirror `dir` (:1793); removed in the finally at :2053",
  },
  {
    site: "user-file.ts:readUserFile:openSync",
    count: 1,
    gate: "read-only-open",
    why: "user-file.ts readUserFile opens with constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOCTTY ?? 0) and no mode, only after statSync showed a regular file within the bound; the descriptor is fstat'ed, read and closed in a finally (plan 33.1-26, DC-3)",
  },
  {
    site: "uninstall.ts:unlinkPath:unlinkSync",
    count: 1,
    gate: "helper-gated",
    why: "uninstall.ts:281 unlinkPath is the one removal of a file or a link (red-team of plan 33.1-27: it replaced four rmSync and three unlinkSync sites; a throw is a counted verify and `removed` needs gone()). Every caller returns under DRY_RUN before calling it: removeFile (:370, call :374), removeOwnedEmptyFile (:594, call :598; plan 33.1-28 replaced the old whitespace-only remover, and it is reached only when the createdFiles ledger lists the file), unmergeGemini (:760, call :766; :801, call :807; plan 33.1-29: reached only when the geminiSettings ledger records that install created the file, and either it still holds the bytes install wrote or nothing is left in it once the recorded AGENTS.md entry is removed), removeAskRules (:833, call :841), removeMarker (:910, call :914)",
  },
  {
    site: "uninstall.ts:rewritePath:writeFileSync",
    count: 1,
    gate: "helper-gated",
    why: "uninstall.ts:301 rewritePath is the one rewrite of an edited file (red-team of plan 33.1-27; a throw is a counted verify). Every caller returns under DRY_RUN before calling it: removeSentinelBlock (:560, call :564; plan 33.1-28 computes the post-removal text before that return and writes nothing when no terminated block was found), unmergeGemini (:810, call :815; plan 33.1-29: only the recorded append is reversed, after the geminiSettings ledger and the file's shape were asked), removeAskRules (:833, call :846)",
  },
  {
    site: "uninstall.ts:rmdirIfEmpty:rmdirSync",
    count: 1,
    gate: "dry-run-return-above",
    why: "uninstall.ts:408-411 `if (DRY_RUN)` reports would-rmdir and returns before rmdirSync at :413; emptiness is read with readdirSync at :399, and ownership (the createdDirs ledger only, plan 33.1-28) is decided before that return (CR-02 fix)",
  },

];

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE READ AXIS (plan 33.1-27, brief DC-3: an unbounded read of a user-controlled path).
//
// The DRY_RUN axis above asks how each MUTATING call is kept off the preview path. This axis asks
// the DC-3 question of every CONTENT READ: every call under install/ that can read a file's bytes
// (or block opening one) is either inside user-file.ts readUserFile, the one bounded reader, or a
// READ_SITES row whose source is a kit path (or standard input), never a user path.
//
// THE API SET IS DERIVED FROM node:fs ITSELF. The first draft of this axis listed four APIs and so
// could not see two copyFileSync calls whose source was a user path (plan 33.1-26 fixed those). A
// hand list of APIs is the set-literal drift this repository has paid for before. So the test reads
// node:fs's own export list: every export whose NAME marks a possible content read (it starts with
// read, copy, cp or open, or ends with ReadStream; and `promises`, the async namespace, which stands
// for every import from node:fs/promises) must be classified, by reading what it does, in exactly
// one of CONTENT_READER and NOT_CONTENT_READER. Both directions are asserted, so a Node upgrade that
// adds such an export fails this file until someone classifies it, and a classified name Node no
// longer exports fails too. realpathSync is an example of a name the pattern does not reach and that
// reads no content either (it resolves a path).
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** A node:fs export name that may mark a content read. */
const CONTENT_READ_NAME = /^(read|copy|cp|open)|ReadStream$/;

// Each of these reads a file's bytes, copies them (a copy reads its source), opens a descriptor
// (an open of a FIFO blocks until a writer appears), or is the async namespace that holds all of
// those. A call of one is a content read.
const CONTENT_READER = new Set([
  "copyFile",
  "copyFileSync",
  "cp",
  "cpSync",
  "createReadStream",
  "open",
  "openSync",
  "openAsBlob",
  "read",
  "readSync",
  "readv",
  "readvSync",
  "readFile",
  "readFileSync",
  "ReadStream",
  "FileReadStream",
  "promises",
]);
// Each of these reads directory entries or a link's target, never a file's content, and none of them
// opens a FIFO: a FIFO in a directory is listed, not read, and readlink reads the link itself.
const NOT_CONTENT_READER = new Set(["readdir", "readdirSync", "readlink", "readlinkSync", "opendir", "opendirSync"]);

// The one reader: every content read inside user-file.ts must be in this function.
const USER_FILE_READER_SCOPE = "user-file.ts:readUserFile";

// The roots a kit-path source may start from: the kit source checkout, the shared kit home, and
// the kit root inside it. A source argument must be one of these identifiers or `join(<root>, ...)`,
// and must not name TARGET.
const KIT_ROOT_NAMES = new Set(["GRUGOPS_SRC", "GRUGOPS_HOME", "KIT_ROOT"]);

type ReadClass = "kit-path" | "stdin";

interface ReadSite {
  /** `<file>:<scope>:<fs name>`, as on the DRY_RUN axis. */
  readonly site: string;
  readonly count: number;
  readonly cls: ReadClass;
  /** The source argument's text, whitespace-collapsed: argument 0 (the path, or the descriptor). */
  readonly source: string;
  /** The root the source lies under (kit-path), or why it is not a path (stdin). */
  readonly why: string;
}

// One row per `<file>:<scope>:<fs name>` outside user-file.ts. Every call at the site has argument 0
// equal to `source`. A site whose source is under TARGET is a finding: it is routed through
// readUserFile, never classified here.
const READ_SITES: readonly ReadSite[] = [
  {
    site: "install.ts:readlineSync:readSync",
    count: 1,
    cls: "stdin",
    source: "0",
    why: "descriptor 0 is standard input, read one byte at a time for the interactive target prompt (--yes and a non-TTY never reach it); no path is opened",
  },
  {
    site: "install.ts:copyKit:cpSync",
    count: 1,
    cls: "kit-path",
    source: 'join(GRUGOPS_SRC, "agent-factory")',
    why: "the kit source checkout (GRUGOPS_SRC): the kit is copied into a staging directory beside the kit home",
  },
  {
    site: "install.ts:renderAdaptersInMirror:cpSync",
    count: 2,
    cls: "kit-path",
    source: 'join(GRUGOPS_SRC, ...rel.split("/"))',
    why: "the kit source checkout (GRUGOPS_SRC): the renderer's inputs are copied into the mkdtemp render mirror; the target's config is written into it from readUserFile's bytes instead (plan 33.1-26)",
  },
];

/** Modules that make no content read at all (plan 33.1-27): they read only through user-file.ts. */
const ZERO_READER_FILES = ["uninstall.ts", "install-marker.ts"];

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
  /** Every direct call of a CONTENT_READER binding: its site, its argument 0's text, and its line. */
  readonly reads: { readonly site: string; readonly source: string; readonly line: number }[];
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
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".js") ? ts.ScriptKind.JS : ts.ScriptKind.TS);
  const refusals: string[] = [];
  const imports = new Map<string, Set<string>>();
  const localToImported = new Map<string, string>();
  // The read axis's key for each local binding: the imported name for node:fs / fs, and `promises`
  // for ANY name imported from node:fs/promises / fs/promises (the whole async namespace).
  const localToReaderKey = new Map<string, string>();
  const sites: string[] = [];
  const opens: { site: string; line: number; flagsProblem: string | null }[] = [];
  const reads: { site: string; source: string; line: number }[] = [];

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
          localToReaderKey.set(local, mod.endsWith("promises") ? "promises" : imported);
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
      const readerKey = localToReaderKey.get(node.text);
      if (readerKey !== undefined && CONTENT_READER.has(readerKey)) {
        const p = node.parent;
        if (ts.isCallExpression(p) && p.expression === node) {
          const arg0 = p.arguments[0];
          reads.push({
            site: `${file.replace(/\.js$/, ".ts")}:${scopeOf(p)}:${readerKey}`,
            source: arg0 === undefined ? "" : arg0.getText(sf).replace(/\s+/g, " "),
            line: lineOf(sf, p),
          });
        } else {
          refusals.push(
            `${file}:${lineOf(sf, node)} content-reading fs binding ${node.text} (${readerKey}) used other than as a direct callee`,
          );
        }
      }
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

  return { file, refusals, imports, sites, opens, reads };
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

  // THE DC-3 FLOOR, EVERY MODULE (red-team of plan 33.1-26, extended by plan 33.1-27). A module
  // reads a file's content only through user-file.ts readUserFile or at a pinned READ_SITES row, so
  // its committed .js names no CONTENT_READER outside a comment except the ones its own rows pin.
  // Both halves, because the .ts census cannot see what tsc emitted and the .js text scan cannot see
  // an alias (the read axis below also runs the census over each .js). The text scan skips the
  // CONTENT_READER names that are ordinary English words in the installers' messages ("read",
  // "open", "cp", "promises"); the .js census covers those.
  it("each module's .js names no content reader outside a comment beyond its own pinned read sites (DC-3 floor)", () => {
    const TEXT_SCANNED = [...CONTENT_READER].filter((n) => !["read", "open", "cp", "promises"].includes(n));
    // The floor plan 33.1-26 set for install.js, kept as a subset: every one of these is scanned.
    for (const n of ["readFileSync", "copyFileSync", "createReadStream", "openSync"]) expect(TEXT_SCANNED).toContain(n);
    const installCensus = CENSUS.find((c) => c.file === "install.ts");
    expect(installCensus, "install.ts is not in the scanned set").toBeDefined();
    const problems: string[] = [];
    for (const c of CENSUS) {
      // Allowed: the names this module's pinned READ_SITES rows name, and for user-file.ts the reads
      // inside readUserFile. Taken from the pins, not from the reads found, so an unpinned read is
      // refused here as well as by the read axis below.
      const allowed = new Set([
        ...READ_SITES.filter((r) => r.site.startsWith(`${c.file}:`)).map((r) => r.site.split(":")[2]),
        ...c.reads.filter((r) => r.site.startsWith(`${USER_FILE_READER_SCOPE}:`)).map((r) => r.site.split(":")[2]),
      ]);
      const importedReaders = [...c.imports.keys()].filter((n) => CONTENT_READER.has(n) && !allowed.has(n));
      for (const n of importedReaders) problems.push(`${c.file} imports ${n} from node:fs and has no pinned read of it`);
      const jsFile = c.file.replace(/\.ts$/, ".js");
      const js = readFileSync(join(INSTALL_DIR, jsFile), "utf8").split("\n");
      js.forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const name of TEXT_SCANNED) {
          if (!allowed.has(name) && new RegExp(`\\b${name}\\b`).test(line)) problems.push(`${jsFile}:${i + 1}: ${name}: ${line.trim()}`);
        }
      });
    }
    expect(problems, problems.join("\n")).toEqual([]);
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// The read axis checks (plan 33.1-27, DC-3).
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const FS_EXPORTS = Object.keys(nodeFs);
const CONTENT_READ_CANDIDATES = [...new Set(FS_EXPORTS.filter((n) => CONTENT_READ_NAME.test(n) || n === "promises"))].sort();
const CENSUS_JS = FILES.map((f) => censusOf(f.replace(/\.ts$/, ".js")));

function readSiteProblems(census: readonly FileCensus[]): string[] {
  const problems: string[] = [];
  const found = new Map<string, { count: number; sources: Set<string>; lines: number[] }>();
  for (const r of census.flatMap((c) => c.reads)) {
    if (r.site.startsWith("user-file.ts:")) {
      const scope = r.site.split(":").slice(0, 2).join(":");
      if (scope !== USER_FILE_READER_SCOPE) problems.push(`OUTSIDE THE READER ${r.site} (line ${r.line}): user-file.ts reads content only in readUserFile`);
      continue;
    }
    const e = found.get(r.site) ?? { count: 0, sources: new Set<string>(), lines: [] };
    e.count += 1;
    e.sources.add(r.source);
    e.lines.push(r.line);
    found.set(r.site, e);
  }
  const pinned = new Map(READ_SITES.map((r) => [r.site, r]));
  for (const [site, e] of [...found].sort()) {
    const row = pinned.get(site);
    if (row === undefined) {
      problems.push(`UNCLASSIFIED ${site} x${e.count} (line(s) ${e.lines.join(", ")}; source ${[...e.sources].join(" | ")})`);
      continue;
    }
    if (row.count !== e.count) problems.push(`COUNT ${site}: found ${e.count}, pinned ${row.count}`);
    for (const src of e.sources) {
      if (src !== row.source) problems.push(`SOURCE ${site}: found \`${src}\`, pinned \`${row.source}\``);
    }
  }
  for (const [site, row] of [...pinned].sort()) {
    if (!found.has(site)) problems.push(`STALE ROW ${site} x${row.count} (no such read)`);
  }
  return problems;
}

/** The structural rule for a pinned source: what makes it a kit path or standard input. */
function sourceProblem(row: ReadSite): string | null {
  const sf = ts.createSourceFile("src.ts", row.source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const st = sf.statements[0];
  if (sf.statements.length !== 1 || st === undefined || !ts.isExpressionStatement(st)) return "is not one expression";
  const e = st.expression;
  if (row.cls === "stdin") return ts.isNumericLiteral(e) && e.text === "0" ? null : "is not the descriptor 0";
  if (/\bTARGET\b/.test(row.source)) return "names TARGET, a user path";
  const rootOf = (n: ts.Expression): string | null => {
    if (ts.isIdentifier(n)) return n.text;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "join" && n.arguments.length > 0) {
      const a0 = n.arguments[0];
      return ts.isIdentifier(a0) ? a0.text : null;
    }
    return null;
  };
  const root = rootOf(e);
  return root !== null && KIT_ROOT_NAMES.has(root) ? null : `does not start from a kit root (${[...KIT_ROOT_NAMES].join(", ")})`;
}

describe("installer fs census — the read axis (DC-3, plan 33.1-27)", () => {
  it("every node:fs export whose name may mark a content read is classified, two-sided, in CONTENT_READER or NOT_CONTENT_READER", () => {
    console.log(
      `installer fs census: node ${process.version}: ${FS_EXPORTS.length} node:fs export(s); ${CONTENT_READ_CANDIDATES.length} match the ` +
        `content-read pattern; CONTENT_READER ${CONTENT_READER.size}, NOT_CONTENT_READER ${NOT_CONTENT_READER.size}`,
    );
    expect(CONTENT_READER.size, "CONTENT_READER is empty: the axis would ask nothing").toBeGreaterThan(0);
    const problems: string[] = [];
    for (const n of CONTENT_READER) if (NOT_CONTENT_READER.has(n)) problems.push(`${n} is in both sets`);
    for (const n of CONTENT_READ_CANDIDATES) {
      if (!CONTENT_READER.has(n) && !NOT_CONTENT_READER.has(n)) problems.push(`UNCLASSIFIED node:fs export ${n}: read what it does and classify it`);
    }
    for (const n of [...CONTENT_READER, ...NOT_CONTENT_READER]) {
      if (!FS_EXPORTS.includes(n)) problems.push(`STALE ${n}: no longer a node:fs export`);
      if (!CONTENT_READ_CANDIDATES.includes(n)) problems.push(`${n} does not match the content-read pattern, so the pattern could not have asked about it`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
    expect(CONTENT_READER.size + NOT_CONTENT_READER.size).toBe(CONTENT_READ_CANDIDATES.length);
  });

  it("every READ_SITES row has a non-empty reason and a source that is a kit path (or standard input), never TARGET", () => {
    const keys = READ_SITES.map((r) => r.site);
    expect(new Set(keys).size, "duplicate READ_SITES row").toBe(keys.length);
    const problems: string[] = [];
    for (const row of READ_SITES) {
      if (row.why.trim() === "") problems.push(`${row.site}: empty why`);
      if (row.count < 1) problems.push(`${row.site}: count ${row.count}`);
      if (!CONTENT_READER.has(row.site.split(":")[2])) problems.push(`${row.site}: not a CONTENT_READER`);
      const p = sourceProblem(row);
      if (p !== null) problems.push(`${row.site}: source \`${row.source}\` ${p}`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("every content read under install/ is inside readUserFile or a READ_SITES row, two-sided with counts and sources", () => {
    const n = CENSUS.flatMap((c) => c.reads).length;
    console.log(`installer fs census: ${n} content read(s) in the .ts sources; READ_SITES ${READ_SITES.length} row(s)`);
    const problems = readSiteProblems(CENSUS);
    expect(problems, problems.join("\n")).toEqual([]);
    // Vacuity floor: the one reader itself is seen by the axis (its openSync and readSync).
    expect(CENSUS.flatMap((c) => c.reads).some((r) => r.site === `${USER_FILE_READER_SCOPE}:openSync`)).toBe(true);
  });

  it("uninstall.ts and install-marker.ts make no content read and import no content reader (they read through user-file.ts)", () => {
    const problems: string[] = [];
    for (const f of ZERO_READER_FILES) {
      const c = CENSUS.find((x) => x.file === f);
      if (c === undefined) {
        problems.push(`${f} is not in the scanned set`);
        continue;
      }
      for (const r of c.reads) problems.push(`${r.site} (line ${r.line}): ${f} must read through user-file.ts`);
      for (const n of c.imports.keys()) if (CONTENT_READER.has(n)) problems.push(`${f} imports ${n} from node:fs`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("the committed .js of every module has the same content reads as its source, and no refusal", () => {
    const refused = CENSUS_JS.flatMap((c) => c.refusals);
    expect(refused, refused.join("\n")).toEqual([]);
    const key = (cs: readonly FileCensus[]): string[] => cs.flatMap((c) => c.reads.map((r) => `${r.site} ${r.source}`)).sort();
    expect(key(CENSUS_JS)).toEqual(key(CENSUS));
    expect(readSiteProblems(CENSUS_JS)).toEqual([]);
  });

  it("a content-reading binding is only ever the callee of a direct call (no stored or passed reader)", () => {
    const refused = [...CENSUS, ...CENSUS_JS].flatMap((c) => c.refusals.filter((r) => r.includes("content-reading fs binding")));
    expect(refused, refused.join("\n")).toEqual([]);
  });
});

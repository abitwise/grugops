// board-readonly.test.ts — the board projector CANNOT WRITE, and that is decided by a MECHANISM.
//
// WHY THIS FILE EXISTS. Every comparable tool in this space is a control plane: it reads a board and
// then acts on it. grugops's projector is deliberately not one — it renders state and changes
// nothing — and CLAUDE.md's hard safety rule is that such a property is enforced mechanically rather
// than asserted in a docblock. A sentence saying "this module is read-only" is true until the next
// commit and says nothing afterwards. This file re-decides the property from the bytes on every run.
//
// WHAT IT DECIDES. Two claims, both over the transitive closure of the COMPILED artifact
// `scripts/board-dashboard.js` — the thing a host actually runs, not the `.ts` a reader sees:
//
//   1. No mutating `node:fs` / `node:fs/promises` symbol is reachable from that closure (DASH-06).
//   2. The closure imports none of the socket / process-spawning builtins (DASH-08, "no socket").
//
// BOTH SIDES ARE DERIVED, NOT TYPED OUT. This repository's recorded second systemic failure class is
// a hand-maintained set literal that rots while every gate over it stays green — the spawn defect
// shipped seven granted role names against zero adapter files, and the suite was green throughout
// ([[grugops-set-literal-drift]]). So:
//
//   • the MODULE set comes from `jsImportClosure`, computed from the bytes of the files themselves;
//   • the per-module `node:fs` SYMBOL set comes from the TypeScript AST, the way
//     `scripts/context-io-writer-set.test.ts` derives its note-writer set;
//   • the MUTATING set comes from enumerating the runtime's own `node:fs` exports against the D-21
//     write-class stems.
//
// Only ONE set in this file is hand-named: the three stem false positives, whose cardinality is
// asserted two-sided with a decision-shaped message, so a fourth exclusion is a decision somebody
// makes rather than a constant somebody bumps.
//
// EVERY EMPTINESS CLAIM IS PRECEDED BY A PREMISE. "The intersection is empty" is trivially true of an
// empty closure, and "no banned module is imported" is trivially true of an empty specifier set. This
// repository's history records six instances across four consecutive verification rounds of a harness
// producing a FALSE result because its own premise was never asserted. So the premises here are
// failing assertions carrying a `PREMISE:` message, never assumptions.
//
// WHICH PIN IS THE BLOCKING ONE, AND WHY IT IS NOT THE RUNTIME COUNT. The two-sided pin that can red
// this file is the CLOSURE'S OWN `node:fs` symbol set — the handful of read symbols the dashboard
// actually imports. That number is a function of this repository's code, so no Node upgrade can move
// it. The runtime enumeration's cardinality is a function of the Node version instead: CI pins Node
// 22 and this tree's developer machine is on Node 24, so a bare two-sided pin over it would be red on
// one and green on the other for a reason that has nothing to do with the dashboard — and a pin that
// reds for an unrelated reason gets loosened until it stops noticing. It is therefore PRINTED and
// VERSION-LABELLED on every run and asserted only to be non-empty. A mutating symbol added by a
// future Node still reds this file the moment any closure module imports it, because the closure-side
// intersection is what decides, not the count.
//
// WHAT IT CLOSES BY REFUSAL RATHER THAN BY RECOGNITION (32-11, closing CR-01). An fs namespace
// binding has exactly ONE admitted use: as the object of a member access. Every other read of that
// binding — destructured, aliased, spread, passed as an argument, placed in a literal, re-exported,
// returned from a function — is REFUSED by name as an opaque acquisition, and an fs module identity
// handed as a string-literal argument to ANY call is refused the same way. Before 32-11 the
// destructure in particular was neither recognised nor refused: `import * as fsns from "node:fs";
// const { writeFileSync, rmSync } = fsns;` contributed nothing to either set, and this guard
// reported 24 passed and exit 0 over a module that wrote and deleted files
// (`.planning/phases/32-board-projector-cli-dashboard/32-11-RED-baseline.txt`). The rule is stated
// as the canonical form and the complement is refused, because widening a matcher once per
// counter-example is the failure this repository has paid for twice.
//
// WHAT IT DOES NOT CLOSE, NAMED RATHER THAN IMPLIED:
//   • The derivation is SYNTACTIC. An aliased re-export (`export { writeFileSync as w }` through an
//     intermediate module) or a dynamic `import()` of a COMPUTED specifier is not resolved by name.
//     Both are refused rather than ignored — an unresolvable acquisition is collected and asserted
//     absent — but a route this file cannot see is a route it cannot decide. Widening the matcher
//     once per counter-example is the failure this repository has already paid for, so the boundary
//     is written down instead.
//   • A module identity ASSEMBLED at runtime and handed to something that is not `import`/`require`
//     — `process.getBuiltinModule("node:" + "fs")` — is not a string literal, so the argument rule
//     above does not see it. `import(expr)` and `require(expr)` with a non-literal ARE refused
//     (`opaqueSpecifiers`); this residual is the non-module-system spelling of the same idea, and it
//     is recorded here rather than closed by a denylist of callee names.
//   • A writer VALUE received at runtime from outside the closure (a callback parameter that happens
//     to be `writeFileSync`) is not decidable syntactically at all. The zero-runtime-dependency
//     assertion in PART SIX and the relative-only closure walk are what bound how such a value could
//     arrive.
//   • THE SUBJECT IS THE COMMITTED `.js`. A writer added to a `.ts` and not rebuilt is a program
//     this guard never saw. PART SIX asserts the binding to `check:build-parity`, which is the
//     mechanism that makes the analysed `.js` the same program as its `.ts`.
//   • `open` and `openSync` STAY IN the mutating set. Their write-ness depends on a flag literal and
//     a name-based derivation cannot decide it, so the safe direction for a safety guard is to refuse.
//   • `jsImportClosure` follows RELATIVE specifiers only. A `node_modules` import would be invisible
//     here; this repository ships zero runtime dependencies, which is what makes that acceptable, and
//     the `dependencies === undefined` assertion in this file is what keeps it true.
//
// HOW IT IS REACHED, AND THE ONE DEVIATION THAT BUYS IT — RECORDED SO IT IS A DECISION.
//
// D-21 requires this guard to run in the repository suite AND as a named `check:*` npm script. The
// entry added for it is:
//
//     "check:dashboard-readonly": "npx vitest run scripts/board-readonly.test.ts"
//
// It is the FIRST `check:*` entry in this repository that is not the two-step
// `tsc --outDir .tmp-build && node scripts/<x>.js` shape every other one uses. That is a deviation,
// and the reason is a measurement: the AST derivation above needs `typescript`, and zero of the 25
// committed runnable `scripts/*.ts` files import anything other than a `node:` builtin or a relative
// `./*.js`. All five files in this tree that import `typescript` are `.test.ts`. A runnable
// `scripts/check-dashboard-readonly.ts` importing a devDependency would be the first to break that
// 25-of-25 invariant and the first `check:*` script unrunnable from a checkout.
//
// THE ALTERNATIVE WAS REJECTED, AND THE REJECTION IS THE POINT. The other way to keep the script
// shape is a stdlib-only regex scanner over the compiled closure, kept ALONGSIDE this AST test. That
// would give ONE PREDICATE TWO AUTHORITIES — two implementations of "is this closure read-only",
// free to disagree, each green on its own. That is precisely the Phase 29 failure this repository
// spent five rounds on: LANG-04's enumeration was relocated into a second hand-authored list, and the
// relocated copy passed everything the first one refused. One authority, one implementation. The
// cost is that this check needs `node_modules`, exactly as `npm test` already does.
//
// NO DUPLICATE CI STEP, ALSO BY DECISION. This file already runs in CI through the suite step named
// `Vitest (e2e lane excluded)` (`.github/workflows/ci.yml:173-174`,
// `npx vitest run --exclude '**/scripts/e2e/**'`). A second workflow step invoking
// `npm run check:dashboard-readonly` would run the same file twice and would be the same
// two-authorities smell one level up, in the workflow file. The absence of a named CI step for this
// gate is therefore a recorded decision, not an oversight.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import ts from "typescript";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import * as nodeFs from "node:fs";
import * as nodeFsPromises from "node:fs/promises";
import { dirname, join } from "node:path";

import { copyImportClosure, jsImportClosure } from "./js-import-closure.js";

const ROOT = join(import.meta.dirname, "..");

/** The compiled entry the guard walks — the artifact a host runs, never the `.ts`. */
const DASHBOARD_ENTRY = "scripts/board-dashboard.js";
/** The pure model, whose own closure must not reach `node:fs` at all (D-15, D-23). */
const MODEL_ENTRY = "scripts/board-model.js";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE AST DERIVATION — one pass per closure module, over the bytes of the committed `.js`.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Both spellings of both filesystem modules. A guard that only knew `node:fs` would miss `fs`. */
const FS_MODULE_IDENTITIES = Object.freeze(["fs", "fs/promises"]);

/** `node:net` and `net` are the same module; the ban is over identity, not over spelling. */
function normalizeSpecifier(specifier: string): string {
  return specifier.startsWith("node:") ? specifier.slice("node:".length) : specifier;
}

function isFsSpecifier(specifier: string): boolean {
  return FS_MODULE_IDENTITIES.includes(normalizeSpecifier(specifier));
}

function isBareSpecifier(specifier: string): boolean {
  return !specifier.startsWith(".") && !specifier.startsWith("/");
}

interface ModuleFacts {
  /** Top-level statement count. Zero means the parse read nothing and every claim below is vacuous. */
  readonly statements: number;
  /** Syntactic parse diagnostics. A file the parser could not read must RED the guard, never pass it. */
  readonly parseErrors: readonly string[];
  /** Every `node:fs` / `node:fs/promises` symbol imported by name or reached through a namespace. */
  readonly fsSymbols: ReadonlySet<string>;
  /** Every bare specifier — the set `jsImportClosure` deliberately skips, and the socket ban's input. */
  readonly bareSpecifiers: ReadonlySet<string>;
  /**
   * Acquisitions of a filesystem module whose symbols this syntactic pass CANNOT name: a dynamic
   * `import("node:fs")`, a `require("node:fs")`, an `export * from "node:fs"`, or a computed member
   * access on an fs namespace. Each one is a route the derivation cannot decide, so each is collected
   * and asserted absent rather than silently producing a short symbol set.
   */
  readonly opaqueFsAcquisitions: readonly string[];
  /** Module specifiers that are not string literals — a computed `import(expr)`. Same fail-closed rule. */
  readonly opaqueSpecifiers: readonly string[];
}

function analyzeModule(absPath: string, label: string): ModuleFacts {
  const source = ts.createSourceFile(label, readFileSync(absPath, "utf8"), ts.ScriptTarget.Latest, true);

  // `parseDiagnostics` is not on the public `SourceFile` type, but it is the only place the syntactic
  // errors of a standalone parse are recorded. Read defensively: absent means "this TypeScript build
  // does not expose it", which the statement-count premise still covers.
  const parseErrors = (
    (source as unknown as { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
  ).map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "));

  const fsSymbols = new Set<string>();
  const bareSpecifiers = new Set<string>();
  const fsNamespaceBindings = new Set<string>();
  const opaqueFsAcquisitions: string[] = [];
  const opaqueSpecifiers: string[] = [];

  const literalText = (node: ts.Node | undefined): string | null =>
    node !== undefined && ts.isStringLiteralLike(node) ? node.text : null;

  const noteSpecifier = (specifier: string): void => {
    if (isBareSpecifier(specifier)) bareSpecifiers.add(specifier);
  };

  /** Refusal messages carry source text; a whole call or declaration can be long, so flatten and cap. */
  const briefly = (text: string): string => {
    const flat = text.replace(/\s+/g, " ").trim();
    return flat.length > 140 ? `${flat.slice(0, 137)}...` : flat;
  };

  /**
   * THE ONE PLACE A MEMBER NAME OF A FILESYSTEM MODULE BECOMES A CLAIM (plan 32-14, finding F-02).
   *
   * A NAME lands in `fsSymbols` from FOUR syntactic positions, and the re-entry rule 32-11 added was
   * asked at only TWO of them:
   *
   *   1. a property access on an fs namespace       — `fsns.promises`        (asked, 32-11)
   *   2. a string-literal element access on one     — `fsns["promises"]`     (asked, 32-11)
   *   3. a NAMED IMPORT from an fs specifier        — `import { promises }`  (NOT asked)
   *   4. a NAMED RE-EXPORT from an fs specifier     — `export { promises }`  (NOT asked)
   *
   * Positions 3 and 4 are the same capability by another spelling: `promises` and `default` are
   * THEMSELVES namespaces holding the whole writer set, so a named import of one hands a module
   * every writer in `node:fs` under a name that matches no write-class stem. The guard still went
   * red on that shape — but on the CARDINALITY pin, whose failure message tells a maintainer to
   * "weigh the new symbol … it is a decision". A maintainer who weighs `promises` against
   * `MUTATING_FS_SYMBOLS`, finds it absent, and adds it to `EXPECTED_CLOSURE_FS_SYMBOLS` re-greens
   * the guard over a full writer in ONE edit. A pin catching a writer by accident is not the
   * intersection deciding it — the same sentence 32-11 wrote about the namespace route, which is
   * why the fix is to ask the SAME derived predicate at the remaining two positions rather than to
   * add a third rule.
   */
  const noteFsMember = (name: string, sourceText: string): void => {
    if (NAMESPACE_REENTRY_MEMBERS.includes(name)) {
      opaqueFsAcquisitions.push(briefly(sourceText));
    } else fsSymbols.add(name);
  };

  const collectSpecifiers = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      const specifier = literalText(node.moduleSpecifier);
      if (specifier === null) {
        opaqueSpecifiers.push(node.getText());
      } else {
        noteSpecifier(specifier);
        if (isFsSpecifier(specifier)) {
          const clause = node.importClause;
          // A default import of a builtin under esModuleInterop IS the namespace object, so it is
          // treated as one rather than ignored.
          if (clause?.name) fsNamespaceBindings.add(clause.name.text);
          const bindings = clause?.namedBindings;
          if (bindings !== undefined && ts.isNamespaceImport(bindings)) {
            fsNamespaceBindings.add(bindings.name.text);
          }
          if (bindings !== undefined && ts.isNamedImports(bindings)) {
            for (const element of bindings.elements) {
              noteFsMember((element.propertyName ?? element.name).text, element.getText());
            }
          }
        }
      }
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
      const specifier = literalText(node.moduleSpecifier);
      if (specifier === null) {
        opaqueSpecifiers.push(node.getText());
      } else {
        noteSpecifier(specifier);
        if (isFsSpecifier(specifier)) {
          const clause = node.exportClause;
          if (clause !== undefined && ts.isNamedExports(clause)) {
            for (const element of clause.elements) {
              noteFsMember((element.propertyName ?? element.name).text, element.getText());
            }
          } else {
            // `export * from "node:fs"` re-exports every symbol including every writer, and no name
            // in the source says so. Opaque, therefore refused.
            opaqueFsAcquisitions.push(node.getText());
          }
        }
      }
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (isDynamicImport || isRequire) {
        const specifier = literalText(node.arguments[0]);
        if (specifier === null) {
          opaqueSpecifiers.push(node.getText());
        } else {
          noteSpecifier(specifier);
          if (isFsSpecifier(specifier)) opaqueFsAcquisitions.push(node.getText());
        }
      } else {
        // THE ACQUISITION ARM, GENERALISED (deviation, Rule 2 — recorded in 32-11-SUMMARY.md).
        // `import(…)` and `require(…)` are two SPELLINGS of "hand a module identity to a function
        // and get the module back", and they are not the only ones: `createRequire(url)("node:fs")`
        // never spells `require` at the call site, and `process.getBuiltinModule("node:fs")` and
        // `process.binding("fs")` return the real module without any module-system call at all.
        // Rather than name those three (one more heuristic per counter-example, the failure this
        // file's docblock already refuses), the rule is over the ARGUMENT: a filesystem module
        // IDENTITY appearing as a string-literal argument to ANY call is an acquisition this
        // syntactic pass cannot follow, so it is refused.
        //
        // It is deliberately NOT routed through `noteSpecifier`. A plain call's string argument is
        // not a module-identity position, and folding it into `bareSpecifiers` would make a
        // harmless `f("net")` read as an import of node:net and red the DASH-08 ban for a reason
        // that has nothing to do with a socket. Refusal here, no specifier claim.
        for (const argument of node.arguments) {
          const literal = literalText(argument);
          if (literal !== null && isFsSpecifier(literal)) {
            opaqueFsAcquisitions.push(briefly(node.getText()));
            break;
          }
        }
      }
    }
    ts.forEachChild(node, collectSpecifiers);
  };
  collectSpecifiers(source);

  /**
   * THE CANONICAL FORM (32-11, closing CR-01).
   *
   * An identifier bound to an fs namespace may appear in exactly ONE position that is not its own
   * binding site: as the OBJECT of a member access. That is the whole admitted use. Every other
   * READ of the binding — destructured, aliased, spread, passed as an argument, put in a literal,
   * re-exported, returned — hands the namespace object to a route this syntactic pass cannot
   * follow, and each of those routes reaches every writer in `node:fs` without naming one.
   *
   * The rule is therefore stated as an ALLOW-LIST and everything outside it is refused. The
   * alternative — teaching the matcher to also recognise a destructuring pattern — is one more
   * heuristic per counter-example, which is the shape this repository has spent eight rounds on
   * twice ([[grugops-safety-invariant-green-suite-insufficient]]).
   *
   * THE EXEMPTIONS ARE EXACTLY TWO, AND BOTH ARE BINDING SITES RATHER THAN READS. A THIRD
   * EXEMPTION IS A DECISION SOMEBODY RECORDS HERE WITH ITS REASON, never a condition somebody
   * appends — the same posture the three named stem exclusions below already take.
   */
  const isAdmittedNamespacePosition = (node: ts.Identifier): boolean => {
    const parent = node.parent as ts.Node | undefined;
    if (parent === undefined) return false;
    // Exemption 1 — the binding site of `import * as fsns from "node:fs"`.
    if (ts.isNamespaceImport(parent) && parent.name === node) return true;
    // Exemption 2 — the binding site of `import fs from "node:fs"`, which `collectSpecifiers`
    // already treats as a namespace object under esModuleInterop.
    if (ts.isImportClause(parent) && parent.name === node) return true;
    // The ONE admitted read: the object of a property or element access.
    if (ts.isPropertyAccessExpression(parent) && parent.expression === node) return true;
    if (ts.isElementAccessExpression(parent) && parent.expression === node) return true;
    return false;
  };

  /**
   * TWO PROPERTIES OF THIS PASS, WRITTEN DOWN SO A LATER READER DOES NOT "FIX" THEM:
   *
   *   • THE PASS IS NAME-SCOPED, NOT BINDING-SCOPED. A parameter or a local that happens to reuse a
   *     namespace identifier's spelling is treated as the namespace. The imprecision runs in the
   *     direction of REFUSAL, which is the only direction a safety guard may be imprecise in;
   *     loosening it to be scope-accurate would trade a false red for a possible false green.
   *   • THE ELEMENT-ACCESS ARM IS UNCHANGED. A computed key is already an opaque acquisition and a
   *     string-literal key still names its symbol. The canonical form is a UNION with that arm, not
   *     a replacement for it, and `NAMESPACE_ESCAPE_SHAPES` tests the union.
   */
  const collectNamespaceUses = (node: ts.Node): void => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      fsNamespaceBindings.has(node.expression.text)
    ) {
      // `fsns.default` and `fsns.promises` are THEMSELVES namespaces holding the whole writer set.
      // Every member read off one of them is a property access whose own expression is not an
      // identifier, so this pass would name `default`/`promises` and nothing behind it. Refused
      // rather than named (deviation, Rule 2), over a set DERIVED from the runtime.
      noteFsMember(node.name.text, node.getText());
    } else if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      fsNamespaceBindings.has(node.expression.text)
    ) {
      const key = literalText(node.argumentExpression);
      // A COMPUTED key is refused here rather than in `noteFsMember`: it carries no name to ask the
      // re-entry rule about, which is a different reason from "this name re-enters a namespace".
      if (key === null) opaqueFsAcquisitions.push(briefly(node.getText()));
      else noteFsMember(key, node.getText());
    } else if (
      ts.isIdentifier(node) &&
      fsNamespaceBindings.has(node.text) &&
      !isAdmittedNamespacePosition(node)
    ) {
      opaqueFsAcquisitions.push(briefly((node.parent ?? node).getText()));
    }
    ts.forEachChild(node, collectNamespaceUses);
  };
  if (fsNamespaceBindings.size > 0) collectNamespaceUses(source);

  return {
    statements: source.statements.length,
    parseErrors,
    fsSymbols,
    bareSpecifiers,
    opaqueFsAcquisitions,
    opaqueSpecifiers,
  };
}

interface ClosureFacts {
  readonly modules: readonly string[];
  readonly perModule: ReadonlyMap<string, ModuleFacts>;
  /** The union of every module's `node:fs` symbols, sorted. */
  readonly fsSymbols: readonly string[];
  /** The union of every module's bare specifiers, sorted. */
  readonly bareSpecifiers: readonly string[];
  readonly opaqueFsAcquisitions: readonly string[];
  readonly opaqueSpecifiers: readonly string[];
}

/**
 * THE DERIVATION: walk one entry's committed-`.js` closure and analyze every module in it.
 *
 * Takes `root` rather than closing over `ROOT` so the discrimination cases can point it at a mirror
 * built from the live sources and watch the same predicate fail.
 */
function analyzeClosure(root: string, entryRel: string): ClosureFacts {
  const modules = jsImportClosure(root, entryRel);
  const perModule = new Map<string, ModuleFacts>();
  const fsSymbols = new Set<string>();
  const bareSpecifiers = new Set<string>();
  const opaqueFsAcquisitions: string[] = [];
  const opaqueSpecifiers: string[] = [];
  for (const rel of modules) {
    const facts = analyzeModule(join(root, rel), rel);
    perModule.set(rel, facts);
    for (const symbol of facts.fsSymbols) fsSymbols.add(symbol);
    for (const specifier of facts.bareSpecifiers) bareSpecifiers.add(specifier);
    for (const text of facts.opaqueFsAcquisitions) opaqueFsAcquisitions.push(`${rel}: ${text}`);
    for (const text of facts.opaqueSpecifiers) opaqueSpecifiers.push(`${rel}: ${text}`);
  }
  return {
    modules,
    perModule,
    fsSymbols: [...fsSymbols].sort(),
    bareSpecifiers: [...bareSpecifiers].sort(),
    opaqueFsAcquisitions,
    opaqueSpecifiers,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE THREE SETS.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The modules the closure MUST contain. An absentee means the walk measured something else. */
const REQUIRED_CLOSURE_MODULES = Object.freeze([
  "scripts/board-dashboard.js",
  "scripts/board-read.js",
  "scripts/board-model.js",
]);

/**
 * The `node:fs` symbols the dashboard closure actually holds. MEASURED, not aspirational:
 *
 *   scripts/board-dashboard.js  existsSync, watch      (the watch loop and its guard)
 *   scripts/board-read.js       existsSync, readFileSync, readdirSync, realpathSync, statSync
 *   scripts/is-entry.js         realpathSync
 *   scripts/kit-model.js        existsSync, readFileSync, readdirSync, realpathSync, statSync
 *
 * Every one is a reader. THIS IS THE BLOCKING PIN: it is a function of this repository's code, so a
 * Node upgrade cannot move it, and it is the number the phase actually cares about.
 */
const EXPECTED_CLOSURE_FS_SYMBOLS = Object.freeze([
  "existsSync",
  "readFileSync",
  "readdirSync",
  "realpathSync",
  "statSync",
  "watch",
]);

/** The cardinality of that set. A seventh symbol is a decision, never a bumped constant. */
const EXPECTED_CLOSURE_FS_SYMBOL_COUNT = 6;

/**
 * D-21's write-class name stems, verbatim.
 *
 * They are hand-named because D-21 names them — a stem is the DEFINITION of "write-class", not a
 * membership list. What is derived is which of the RUNTIME's symbols they match, which is the set
 * that rots when Node adds a writer.
 */
const WRITE_CLASS_STEMS = Object.freeze([
  "write",
  "append",
  "rename",
  "unlink",
  "rm",
  "mkdir",
  "mkdtemp",
  "copy",
  "cp",
  "chmod",
  "chown",
  "truncate",
  "utimes",
  "link",
  "symlink",
  "open",
]);

/**
 * The descriptor prefixes POSIX-derived `fs` names carry in front of a stem: `f` for the
 * file-descriptor form (`ftruncate`, `futimes`, `fchmod`), `l` for the don't-follow-symlinks form
 * (`lchmod`, `lutimes`), and `create` / `file` for the stream constructors (`createWriteStream`,
 * `FileWriteStream`).
 *
 * This is a RULE rather than a hand-listed set of variants, which matters in both directions. A bare
 * substring match would also catch `readlink` and `readlinkSync` — read-only symbols that would then
 * red the guard for no reason, and a guard that reds for no reason is a guard that gets loosened.
 * Anchoring at a descriptor prefix admits `ftruncate` and refuses `readlink` by construction.
 */
const DESCRIPTOR_PREFIXES = Object.freeze(["", "f", "l", "create", "file"]);

function matchesWriteClassStem(name: string): boolean {
  const lower = name.toLowerCase();
  return WRITE_CLASS_STEMS.some((stem) => DESCRIPTOR_PREFIXES.some((d) => lower.startsWith(d + stem)));
}

/** Every symbol the RUNTIME exports from either filesystem module whose name matches a write stem. */
function stemMatchedRuntimeSymbols(): readonly string[] {
  const all = new Set<string>([...Object.keys(nodeFs), ...Object.keys(nodeFsPromises)]);
  return [...all].filter(matchesWriteClassStem).sort();
}

/**
 * The three symbols the stems catch that are NOT writers, each named with its reason:
 *
 *   opendir / opendirSync   read-only directory iterators; the bounded walk may legitimately want
 *                           `opendirSync`, and both are caught only by sharing the `open` stem
 *   openAsBlob              read-only; same stem, same accident
 *
 * `open` and `openSync` are deliberately NOT here. Their write-ness depends on a flag literal, a
 * name-based derivation cannot decide it, and the safe direction for a safety guard is to refuse.
 */
const STEM_FALSE_POSITIVES = Object.freeze(["openAsBlob", "opendir", "opendirSync"]);

/**
 * The cardinality of the exclusion set. A FOURTH exclusion is a decision: it means somebody has
 * judged a stem-matched symbol read-only, and that judgment belongs in the list above with its
 * reason, not in a bumped constant.
 */
const STEM_FALSE_POSITIVE_COUNT = 3;

/**
 * THE NAMESPACE RE-ENTRY MEMBERS — DERIVED FROM THE RUNTIME, never typed out (32-11).
 *
 * Some members of the `node:fs` namespace are themselves namespaces holding the whole writer set:
 * `fsns.promises.writeFile(p, "x")` and `fsns.default.writeFileSync(p, "x")` both write, and both
 * reach the writer through a SECOND member access whose own expression is not an identifier — which
 * this pass does not follow. Measured before this rule existed: a mirror planted with
 * `fsns.promises.writeFile` produced `opaqueFsAcquisitions: []` and a mutating-symbol intersection
 * of `[]`, i.e. the case that names the danger stayed green. (The two-sided closure pin did move,
 * because `promises` entered `fsSymbols` — but a cardinality pin catching a writer by accident is
 * not the same as the intersection deciding it.)
 *
 * So a member access naming a re-entry is REFUSED rather than named. The set is derived by asking
 * the runtime which object-valued members of `node:fs` carry a mutating symbol as a function, so a
 * future Node adding a third one is covered without anybody editing this file — the set-literal
 * drift class this repository has already paid for ([[grugops-set-literal-drift]]).
 */
function namespaceReentryMembers(): readonly string[] {
  const found = new Set<string>();
  for (const [key, value] of Object.entries(nodeFs as unknown as Record<string, unknown>)) {
    if (value === null || typeof value !== "object") continue;
    const inner = value as Record<string, unknown>;
    if (MUTATING_FS_SYMBOLS.some((symbol) => typeof inner[symbol] === "function")) found.add(key);
  }
  return [...found].sort();
}

/** The ambiguous pair that stays IN the mutating set, by decision rather than by omission. */
const AMBIGUOUS_RETAINED = Object.freeze(["open", "openSync"]);

const STEM_MATCHED_FS_SYMBOLS = stemMatchedRuntimeSymbols();
const MUTATING_FS_SYMBOLS = Object.freeze(
  STEM_MATCHED_FS_SYMBOLS.filter((name) => !STEM_FALSE_POSITIVES.includes(name)),
);

/** Derived, not typed: the `node:fs` members that are themselves namespaces holding the writers. */
const NAMESPACE_REENTRY_MEMBERS = Object.freeze(namespaceReentryMembers());

// The runtime-side observation, PRINTED AND VERSION-LABELLED on every run rather than pinned across
// Node majors. A reader comparing a CI log against a local log can see at a glance whether a
// disagreement is about the dashboard or about the runtime underneath it.
//
// Two shapes here were MEASURED rather than assumed, because "printed on every run" is a claim that
// is easy to make and easy to have no output behind. Against vitest 4.1.8's DEFAULT reporter:
//   • module-scope `console.log`  → printed NOTHING (collection-time console output is not surfaced)
//   • in-test / in-hook `console.log` → printed NOTHING (the default reporter surfaces console output
//     only for failing tests; `--reporter=verbose` shows it, and CI does not pass that flag)
//   • `process.stdout.write`      → printed, under the default reporter, from a hook and from a test
// So the write is direct, and it is emitted from a FILE-LEVEL `beforeAll` so that a filtered run
// (`-t "no socket"`) still carries the label.
beforeAll(() => {
  process.stdout.write(
    `board-readonly: mutating fs symbols ${MUTATING_FS_SYMBOLS.length} ` +
      `(stem-matched ${STEM_MATCHED_FS_SYMBOLS.length} minus ${STEM_FALSE_POSITIVE_COUNT} named ` +
      `exclusions) on node ${process.versions.node}\n`,
  );
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE — the premises. Asserted BEFORE anything downstream is claimed empty.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the read-only guard asserts its own premises first", () => {
  it("PREMISE: the dashboard closure is non-empty and contains the modules under test", () => {
    const { modules } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      modules.length,
      `PREMISE: jsImportClosure(ROOT, "${DASHBOARD_ENTRY}") returned an EMPTY closure, so every ` +
        "intersection claimed empty below measured nothing at all",
    ).toBeGreaterThan(0);
    const missing = REQUIRED_CLOSURE_MODULES.filter((m) => !modules.includes(m));
    expect(
      missing,
      `PREMISE: the closure is missing ${missing.join(", ") || "(nothing)"} — the walk reached ` +
        `something other than the dashboard's real module graph. It found: ${modules.join(", ")}`,
    ).toEqual([]);
  });

  it("PREMISE: every closure module parsed, and none parsed to nothing", () => {
    const { perModule } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    for (const [rel, facts] of perModule) {
      expect(
        facts.parseErrors,
        `PREMISE: ${rel} produced syntactic parse errors, so its symbol set is whatever the parser ` +
          "managed before giving up. An unreadable module must RED this guard, never pass it",
      ).toEqual([]);
      expect(
        facts.statements,
        `PREMISE: the parse of ${rel} yielded ZERO top-level statements, so its contribution to ` +
          "every derived set below is an empty set that means nothing",
      ).toBeGreaterThan(0);
    }
  });

  it("PREMISE: the runtime enumeration matched at least one write-class symbol", () => {
    expect(
      STEM_MATCHED_FS_SYMBOLS.length,
      "PREMISE: the write-class stems matched ZERO of the runtime's fs exports, so the mutating set " +
        "is empty and the intersection below is empty for a reason that has nothing to do with the " +
        "dashboard",
    ).toBeGreaterThan(0);
    expect(MUTATING_FS_SYMBOLS.length).toBeGreaterThan(0);
  });

  it("PREMISE: no closure module acquires a filesystem module by a route this pass cannot name", () => {
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      facts.opaqueFsAcquisitions,
      "PREMISE: a closure module reaches node:fs through a route this syntactic pass cannot " +
        "follow — a dynamic import, a require, an `export * from`, an fs module identity handed " +
        "to another call, a computed member access, or a READ of an fs-namespace binding that is " +
        "not a direct member access (a destructure, an alias, a spread, an argument, a re-export). " +
        "The derivation cannot name the symbols behind such a route, so it refuses rather than " +
        "reporting a short set",
    ).toEqual([]);
    expect(
      facts.opaqueSpecifiers,
      "PREMISE: a closure module imports from a COMPUTED specifier. The module identity behind it " +
        "is undecidable here, so the ban below could not have been asked of it",
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO — the derived sets, asserted by MEMBERS and by COUNT as two separate cases.
//
// A single `toEqual([...])` reports a member change and a cardinality change as the same failure,
// and the second is the one that means "a symbol landed that nobody weighed".
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the closure's own fs symbol set is the blocking pin", () => {
  it("the derived closure fs symbol set has the expected MEMBERS", () => {
    expect(analyzeClosure(ROOT, DASHBOARD_ENTRY).fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
  });

  it("the derived closure fs symbol set has the expected COUNT", () => {
    expect(
      analyzeClosure(ROOT, DASHBOARD_ENTRY).fsSymbols.length,
      "a node:fs symbol entered or left the dashboard's import closure. This is the pin a Node " +
        "upgrade cannot move, so the move came from this repository's own code: weigh the new " +
        "symbol against the read-only property and name it above — it is a decision, never a " +
        "bumped constant",
    ).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
  });

  it("the pure model's own closure carries no node:fs specifier at all (D-15, D-23)", () => {
    // A stronger and cheaper claim than "no mutating symbol": board-model.ts is pure by
    // construction, so no board byte can reach a filesystem path from inside it.
    const facts = analyzeClosure(ROOT, MODEL_ENTRY);
    expect(facts.modules.length, "PREMISE: the model closure is empty").toBeGreaterThan(0);
    const fsSpecifiers = facts.bareSpecifiers.filter(isFsSpecifier);
    expect(
      fsSpecifiers,
      `scripts/board-model.js's closure imports ${fsSpecifiers.join(", ")}. D-15 and D-23 make the ` +
        "model pure and put every filesystem touch in scripts/board-read.ts; this is the mechanical " +
        "form of that boundary",
    ).toEqual([]);
    expect(facts.fsSymbols).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE — the mutating set, and the exclusions that are decisions rather than constants.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the mutating set is derived from the runtime, and its exclusions are named", () => {
  it("every named exclusion is actually present in the stem-matched set", () => {
    // An exclusion for a symbol the stems never matched is an exclusion silently doing nothing —
    // and it would keep the count at 3 while the reason for one of the three had evaporated.
    for (const name of STEM_FALSE_POSITIVES) {
      expect(
        STEM_MATCHED_FS_SYMBOLS,
        `the exclusion "${name}" is not in the stem-matched set on node ${process.versions.node}, ` +
          "so it excludes nothing. Either the stems changed or the runtime dropped the symbol; " +
          "either way the exclusion list below is now describing something that is not there",
      ).toContain(name);
    }
  });

  it("the exclusion set has exactly three members", () => {
    expect(
      STEM_FALSE_POSITIVES.length,
      "a fourth stem exclusion is a DECISION: it asserts that a write-stem-matched symbol is " +
        "read-only. That judgment belongs beside the other three with its reason written out, not " +
        "in a bumped constant",
    ).toBe(STEM_FALSE_POSITIVE_COUNT);
  });

  it("open and openSync remain IN the mutating set", () => {
    // Their write-ness depends on the flag literal at the call site (`"w"`, `"a"`, `O_CREAT`), which
    // a name-based derivation cannot read. A guard that cannot decide must refuse.
    for (const name of AMBIGUOUS_RETAINED) {
      expect(MUTATING_FS_SYMBOLS).toContain(name);
    }
  });

  it("the stem rule admits the descriptor forms and refuses the read-only lookalikes", () => {
    // The descriptor-prefix anchoring, exercised in both directions so the rule is a control rather
    // than a coincidence of this Node version's export list.
    for (const writer of ["ftruncate", "lchmod", "futimes", "createWriteStream", "mkdtempSync"]) {
      expect(matchesWriteClassStem(writer), `${writer} should match a write-class stem`).toBe(true);
    }
    for (const reader of ["readlink", "readlinkSync", "readFileSync", "statSync", "watch"]) {
      expect(matchesWriteClassStem(reader), `${reader} must NOT match a write-class stem`).toBe(false);
    }
  });

  it("the dashboard closure reaches NO mutating fs symbol", () => {
    const { fsSymbols } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    const reachable = fsSymbols.filter((s) => MUTATING_FS_SYMBOLS.includes(s));
    expect(
      reachable,
      `the board projector's import closure reaches the mutating node:fs symbol(s) ` +
        `${reachable.join(", ")}. The projector renders state and changes nothing (DASH-06); a ` +
        "writer in its closure makes it a control plane",
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FOUR — module IDENTITY (DASH-06 and DASH-08 both), decided by an ALLOW-LIST.
//
// `jsImportClosure` gives the FILE list but deliberately skips BARE specifiers — its own docblock
// says so — so this part needs the second AST pass PART ONE already collected. A claim asserted over
// an empty specifier set is a green that measured nothing, so the set is asserted non-empty first.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * THE BUILTIN IDENTITIES THE DASHBOARD CLOSURE MAY REACH — MEASURED, then pinned in BOTH directions.
 *
 * WHY THIS REPLACED A DENY-LIST, WITH THE MEASUREMENT THAT FORCED IT (32-20, closing 32-REVIEW.md
 * WR-02 and 32-VERIFICATION.md gap 2). Until 32-20 the module question was decided by
 * `BANNED_MODULES` + `ADDITIONAL_BANNED_MODULES`: fifteen hand-typed names to REFUSE. Every builtin
 * outside those fifteen was admitted by construction — including three that create and write files
 * with no obfuscation whatsoever. Measured against the COMMITTED `.js` and recorded verbatim in
 * `.planning/phases/32-board-projector-cli-dashboard/32-20-RED-baseline.txt`:
 *
 *   import { writeHeapSnapshot } from "node:v8";   export const d = (p) => writeHeapSnapshot(p);
 *        npm run check:dashboard-readonly → exit 0, 59 passed / 59
 *   import { DatabaseSync } from "node:sqlite";    export const d = (p) => new DatabaseSync(p);
 *        npm run check:dashboard-readonly → exit 0, 59 passed / 59
 *   import { runInNewContext } from "node:vm";     export const e = (s) => runInNewContext(s);
 *        npm run check:dashboard-readonly → exit 0, 59 passed / 59
 *
 * So the rule is inverted, to the same posture 32-11 gave the namespace binding one register over:
 * state the CANONICAL FORM and refuse the complement. The live normalized bare-specifier set must
 * EQUAL this list — members in both directions, plus a count. Equality rather than containment is
 * the whole point: a builtin nobody has met yet is refused BY CONSTRUCTION rather than by having
 * been listed, and a new legitimate import becomes a decision somebody records here with its reason.
 *
 * WRITTEN WITHOUT THE `node:` PREFIX because the question is module IDENTITY: `v8` and `node:v8` are
 * the same module, and a rule that only knew one spelling is a rule an import walks around by
 * deleting five characters. `normalizeSpecifier` is what makes the two spellings one identity.
 */
const ALLOWED_BUILTIN_SPECIFIERS = Object.freeze([
  // "fs" — the bounded READ surface this whole file exists to bound: existsSync, readFileSync,
  //        readdirSync, realpathSync, statSync, watch. Brought in by scripts/board-dashboard.js,
  //        scripts/board-read.js, scripts/is-entry.js and scripts/kit-model.js. WHICH symbols of it
  //        are reachable is decided separately, by the two-sided pin in PART TWO.
  "fs",
  // "path" — join / dirname / relative / resolve over paths the containment authority has already
  //        decided. Brought in by scripts/board-dashboard.js, scripts/board-read.js,
  //        scripts/kit-model.js. It touches no descriptor and opens nothing.
  "path",
  // "url" — fileURLToPath / pathToFileURL, used by scripts/is-entry.js for the "was this module the
  //        entrypoint" comparison. Pure string work over a URL; it performs no I/O.
  "url",
]);

/**
 * The cardinality of the allow-list. A FOURTH admitted builtin is a DECISION: somebody has judged
 * that the projector may reach a capability it could not reach before, and that judgment belongs in
 * the list above with the reason and the module that brings it in — never in a bumped constant.
 */
const ALLOWED_BUILTIN_SPECIFIER_COUNT = 3;

/** Every bare specifier the closure reaches, reduced to module IDENTITY and de-duplicated. */
function normalizedBuiltinIdentities(facts: ClosureFacts): readonly string[] {
  return [...new Set(facts.bareSpecifiers.map(normalizeSpecifier))].sort();
}

/**
 * D-21's five banned modules, verbatim.
 *
 * WHAT THIS LIST IS NOW (32-20). It is the WRITTEN RECORD of D-21 — the decision that the projector
 * spawns nothing and listens on nothing — and it no longer DECIDES the module question on its own.
 * `ALLOWED_BUILTIN_SPECIFIERS` decides it, and it refuses all fifteen of these names plus every
 * other builtin by construction. The list is kept because deleting it would delete the record of a
 * decision, and a decision nobody can find gets re-litigated.
 *
 * THE TWO STATEMENTS MUST NOT DRIFT APART, so their disagreement is itself a case: every banned
 * identity is asserted ABSENT from the allow-list. Without that, a later edit could admit `net` in
 * one place while the other place still said it was banned, and both would be green.
 */
const BANNED_MODULES = Object.freeze([
  "child_process",
  "net",
  "http",
  "https",
  "worker_threads",
]);

/** The cardinality D-21 names. */
const BANNED_MODULE_COUNT = 5;

/**
 * The rest of the socket family, added here because the five above do not cover it and every one of
 * these opens a listening socket or forks a process (deviation from the plan text, Rule 2 — see the
 * plan summary). Each with the reason it belongs:
 *
 *   http2      a listening HTTP/2 server, and not reachable through `node:http`
 *   dgram      UDP sockets, which no member of the five above covers
 *   tls        TLS sockets and `tls.createServer`
 *   cluster    forks worker processes and shares server handles between them
 *   inspector  `inspector.open()` starts a debugger WebSocket server on a port
 *
 * This is a SECOND named set rather than five more members of the first, so that D-21's own
 * cardinality assertion stays exactly the number D-21 states and this extension stays visibly an
 * extension.
 *
 * Like `BANNED_MODULES`, and for the same reason, this is now a RECORD rather than the deciding
 * predicate (32-20): the ten names below are refused because they are not in
 * `ALLOWED_BUILTIN_SPECIFIERS`, exactly as `node:v8` and `node:sqlite` are — neither of which any
 * deny-list here ever named.
 */
const ADDITIONAL_BANNED_MODULES = Object.freeze([
  "http2",
  "dgram",
  "tls",
  "cluster",
  "inspector",
]);

/** The cardinality of the extension. A sixth is a decision, made here rather than in a constant. */
const ADDITIONAL_BANNED_MODULE_COUNT = 5;

const ALL_BANNED_MODULES = Object.freeze([...BANNED_MODULES, ...ADDITIONAL_BANNED_MODULES]);

/**
 * The banned identities a closure actually reaches, by normalized name, sorted.
 *
 * NOT THE DECIDING PREDICATE ANY MORE (32-20). It survives as the thing that puts a D-21 NAME in a
 * failure message — "the closure reaches net" reads better than "the identity set gained a member" —
 * and as the input to the two planted-socket discrimination cases. Every assertion it appears in is
 * accompanied by the allow-list equality, which is what actually refuses.
 */
function bannedModulesReached(facts: ClosureFacts): readonly string[] {
  return [
    ...new Set(
      facts.bareSpecifiers
        .map(normalizeSpecifier)
        .filter((identity) => ALL_BANNED_MODULES.includes(identity)),
    ),
  ].sort();
}

describe("32-20 — the builtin identities the closure may reach are an ALLOW-LIST, pinned two-sided", () => {
  it("PREMISE: the allow-list is non-empty and every entry is REACHABLE in the live closure", () => {
    // Two directions of the same premise. An empty allow-list would make the equality below a claim
    // about nothing; an entry the closure stopped importing would be a permanent widening nobody
    // notices — the admission stays granted long after the reason for it evaporated, which is the
    // set-literal drift class this repository has already paid for ([[grugops-set-literal-drift]]).
    expect(
      ALLOWED_BUILTIN_SPECIFIERS.length,
      "PREMISE: the builtin allow-list is EMPTY, so the equality below says the closure imports no " +
        "builtin at all, and it would be green only over a closure that imports nothing",
    ).toBeGreaterThan(0);
    const live = normalizedBuiltinIdentities(analyzeClosure(ROOT, DASHBOARD_ENTRY));
    for (const allowed of ALLOWED_BUILTIN_SPECIFIERS) {
      expect(
        live,
        `the allow-list admits "${allowed}", and no module in the dashboard closure imports it any ` +
          "more. An admission whose reason has evaporated is a permanent widening: remove the entry " +
          "(and its reason) rather than leaving the door open for the next import that wants it",
      ).toContain(allowed);
    }
  });

  it("the closure's normalized builtin identities have exactly the allowed MEMBERS", () => {
    const live = normalizedBuiltinIdentities(analyzeClosure(ROOT, DASHBOARD_ENTRY));
    const unadmitted = live.filter((identity) => !ALLOWED_BUILTIN_SPECIFIERS.includes(identity));
    expect(
      unadmitted,
      `the dashboard closure reaches the builtin(s) ${unadmitted.join(", ")}, which nobody has ` +
        "admitted. THIS IS A DECISION, not a constant: a builtin is a capability, and three of the " +
        "ones this rule refuses (node:v8's writeHeapSnapshot, node:sqlite's DatabaseSync, " +
        "node:vm) create and write files while naming no fs symbol at all. If the import is " +
        "legitimate, add the identity to ALLOWED_BUILTIN_SPECIFIERS with the reason it belongs and " +
        "the module that brings it in, and move the count with it",
    ).toEqual([]);
    expect(live).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
  });

  it("the closure's normalized builtin identity set has the expected COUNT", () => {
    expect(
      normalizedBuiltinIdentities(analyzeClosure(ROOT, DASHBOARD_ENTRY)).length,
      "the number of distinct builtins the projector can reach moved. Like the fs symbol count, " +
        "this is a function of THIS repository's code rather than of the Node version, so the move " +
        "came from a commit here: weigh the change against 'the projector renders state and changes " +
        "nothing' and record it above — it is never a bumped constant",
    ).toBe(ALLOWED_BUILTIN_SPECIFIER_COUNT);
  });

  it("every banned identity is ABSENT from the allow-list, so the record and the rule cannot disagree", () => {
    // D-21's list is now documentation and the allow-list is the rule. Two statements about the same
    // question, free to drift, is the Phase 29 LANG-04 shape: the relocated copy passed everything
    // the first one refused. They are asserted to agree instead.
    const contradictions = ALL_BANNED_MODULES.filter((banned) =>
      ALLOWED_BUILTIN_SPECIFIERS.includes(banned),
    );
    expect(
      contradictions,
      `${contradictions.join(", ")} is recorded as BANNED by D-21 and simultaneously ADMITTED by ` +
        "the allow-list. One of the two statements is wrong, and while they disagree the gate is " +
        "green over a module D-21 says the projector must not reach",
    ).toEqual([]);
  });

  it("POSITIVE CONTROL: importing an ALLOW-LISTED builtin read-only leaves the gate green", () => {
    // Without this case the rule could refuse EVERY builtin — including the three the dashboard
    // legitimately needs — and still look correct. A rule with no positive control is a rule nobody
    // can tell apart from a refusal of everything, and it is the version that gets loosened.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import { basename, extname } from "node:path";\n' +
          "export const stemOf20 = (p) => basename(p, extname(p));",
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(normalizedBuiltinIdentities(facts)).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
        expect(normalizedBuiltinIdentities(facts).length).toBe(ALLOWED_BUILTIN_SPECIFIER_COUNT);
        expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
        expect(facts.fsSymbols.length).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
        expect(facts.opaqueFsAcquisitions).toEqual([]);
      },
    );
  });
});

describe("32-06 — the dashboard opens no socket and spawns no process", () => {
  it("PREMISE: the collected bare-specifier set is non-empty", () => {
    // The closure walker skips bare specifiers, so this set is produced by a DIFFERENT pass than the
    // module list. If that pass collected nothing, the ban below is a statement about an empty set.
    const { bareSpecifiers } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      bareSpecifiers.length,
      "PREMISE: the second AST pass collected ZERO bare specifiers across the whole dashboard " +
        "closure, so the module ban below was asked of nothing at all",
    ).toBeGreaterThan(0);
    // `node:url` arrives transitively through scripts/is-entry.js and is a known-safe read-only
    // builtin. It is named here so a reader can tell "the pass sees transitive specifiers" from
    // "the pass only sees the entry's own".
    expect(bareSpecifiers).toContain("node:url");
  });

  it("the banned list has exactly the five members D-21 names", () => {
    expect(
      BANNED_MODULES.length,
      "the D-21 ban list moved. Adding or removing a banned module changes what 'no socket' means " +
        "for the projector — it is a decision, never a bumped constant",
    ).toBe(BANNED_MODULE_COUNT);
    expect([...BANNED_MODULES].sort()).toEqual([
      "child_process",
      "http",
      "https",
      "net",
      "worker_threads",
    ]);
  });

  it("the socket-family extension has exactly five members", () => {
    expect(
      ADDITIONAL_BANNED_MODULES.length,
      "the socket-family extension moved. Every member of it opens a listening socket or forks a " +
        "process, so a sixth is a decision that belongs beside the other five with its reason",
    ).toBe(ADDITIONAL_BANNED_MODULE_COUNT);
  });

  it("the dashboard closure imports no banned module (a COROLLARY of the allow-list, not the rule)", () => {
    // This case names D-21's modules in its failure message, which is worth keeping. It is NOT what
    // decides: the allow-list above refuses these fifteen and every other builtin, and it is
    // asserted here beside the corollary so this case cannot be green while the rule is red.
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    const reached = bannedModulesReached(facts);
    expect(
      reached,
      `the board projector's import closure reaches ${reached.join(", ")}. The projector renders ` +
        "state over a filesystem read; it listens on nothing and spawns nothing (DASH-08)",
    ).toEqual([]);
    expect(normalizedBuiltinIdentities(facts)).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FIVE — the discrimination. Every green above is worth exactly as much as this part.
//
// A structural assertion nobody has watched FAIL is not yet a control. Both mirrors are built FROM
// THE LIVE SOURCES at test time, so a refactor of a real module cannot leave a fixture behind
// asserting something the tree no longer says.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * The repository's scratch root (`.gitignore:19`), which vitest is also told not to COLLECT from
 * (`vitest.config.ts`). Both matter: a planted `.js` beside the real modules would be a file the
 * default include glob could pick up, and a `git status`-based residue check is blind to a
 * gitignored path — so the residue predicate here is a REAL LISTING of this directory.
 */
const SCRATCH_ROOT = join(ROOT, ".temp", "board-readonly");

/** The symbol planted to make the intersection case fail. A writer, and unambiguously one. */
const PLANTED_WRITER = "writeFileSync";

/**
 * Copy the live closure into a fresh mirror root, apply one plant, and hand the mirror root to
 * `use`. The mirror is removed in a `finally`, so a failing assertion cannot leave residue.
 */
function withLiveMirror(
  plant: { readonly module: string; readonly appendSource: string },
  use: (mirrorRoot: string) => void,
): void {
  mkdirSync(SCRATCH_ROOT, { recursive: true });
  const mirrorRoot = mkdtempSync(join(SCRATCH_ROOT, "board-readonly-mirror-"));
  try {
    copyImportClosure(ROOT, DASHBOARD_ENTRY, (rel) => {
      const destination = join(mirrorRoot, rel);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(ROOT, rel), destination);
    });
    const planted = join(mirrorRoot, plant.module);
    expect(
      existsSync(planted),
      `PREMISE: the mirror does not contain ${plant.module}, so the plant had nothing to modify`,
    ).toBe(true);
    // ESM import declarations are hoisted, so appending one is a valid module. The mirror is only
    // ever PARSED here, never executed.
    writeFileSync(planted, `${readFileSync(planted, "utf8")}\n${plant.appendSource}\n`);
    use(mirrorRoot);
  } finally {
    rmSync(mirrorRoot, { recursive: true, force: true });
  }
}

/**
 * THE ESCAPE SHAPES, HELD AS DATA (32-11).
 *
 * A hand-maintained list of `it(…)` blocks is the set-literal drift class this repository has
 * already paid for — seven granted role names against zero adapter files, green throughout
 * ([[grugops-set-literal-drift]]). So the spellings are ROWS, the block below is one iteration over
 * them, and adding a spelling is adding a row.
 *
 * Every row is a DISTINCT SPELLING of the same escape: a module that binds `node:fs` (or
 * `node:fs/promises`) and then reaches a writer through it by a route that is not a direct member
 * access. One predicate decides all of them — after planting, `analyzeClosure` returns a non-empty
 * `opaqueFsAcquisitions` naming the planted module — and it is the SAME predicate PART ONE's premise
 * case asserts against the live tree, so the discrimination and the live assertion cannot drift
 * apart.
 *
 * Row 10 (the computed element access) was refused BEFORE 32-11 by the older element-access arm. It
 * is kept in the enumeration so that what is tested is the UNION of the old arm and the new rule,
 * not the new rule alone.
 */
const NAMESPACE_ESCAPE_SHAPES = Object.freeze([
  {
    name: "destructuring bind of two writers from a namespace",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const { writeFileSync, rmSync } = fsns;\n" +
      'export const escape01 = (p) => { writeFileSync(p, "x"); rmSync(p); };',
  },
  {
    name: "rest-element destructure of a namespace",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const { readFileSync: readAlias, ...restOfFs } = fsns;\n" +
      'export const escape02 = (p) => { void readAlias; return restOfFs.writeFileSync(p, "x"); };',
  },
  {
    name: "plain alias assignment of the namespace to another identifier",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const aliasedFs = fsns;\n" +
      'export const escape03 = (p) => aliasedFs.writeFileSync(p, "x");',
  },
  {
    name: "the namespace passed as a call argument",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      'const writeThrough = (mod, p) => mod.writeFileSync(p, "x");\n' +
      "export const escape04 = (p) => writeThrough(fsns, p);",
  },
  {
    name: "object spread of the namespace into a literal",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const spreadFs = { ...fsns };\n" +
      'export const escape05 = (p) => spreadFs.writeFileSync(p, "x");',
  },
  {
    name: "the namespace inside an array literal",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const fsSlots = [fsns];\n" +
      'export const escape06 = (p) => fsSlots[0].writeFileSync(p, "x");',
  },
  {
    name: "the namespace as a shorthand property of an object literal",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const bag = { fsns };\n" +
      'export const escape07 = (p) => bag.fsns.writeFileSync(p, "x");',
  },
  {
    name: "Object.values over the namespace",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "export const escape08 = (p) => Object.values(fsns)[0](p);",
  },
  {
    name: "Reflect.get over the namespace with a string key",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      'export const escape09 = (p) => Reflect.get(fsns, "writeFileSync")(p, "x");',
  },
  {
    name: "element access with a COMPUTED key (refused before 32-11; kept so the UNION is tested)",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      'const computedKey = "writeFileSync";\n' +
      'export const escape10 = (p) => fsns[computedKey](p, "x");',
  },
  {
    name: "a re-export of the namespace binding",
    appendSource: 'import * as fsns from "node:fs";\nexport { fsns as escape11 };',
  },
  {
    name: "the namespace returned from an exported arrow function",
    appendSource: 'import * as fsns from "node:fs";\nexport const escape12 = () => fsns;',
  },
  {
    name: "a DEFAULT import of node:fs destructured (the esModuleInterop spelling)",
    appendSource:
      'import fsDefault from "node:fs";\n' +
      "const { writeFileSync: writeViaDefault } = fsDefault;\n" +
      'export const escape13 = (p) => writeViaDefault(p, "x");',
  },
  {
    name: "a namespace import of node:fs/promises destructured (the second module identity)",
    appendSource:
      'import * as fspns from "node:fs/promises";\n' +
      "const { writeFile } = fspns;\n" +
      'export const escape14 = (p) => writeFile(p, "x");',
  },
]);

/**
 * The cardinality of the enumeration. A FIFTEENTH spelling is a DECISION recorded as a row above
 * with its name, never a constant somebody bumps — the same posture as the stem-exclusion count and
 * the two banned-module counts.
 */
const NAMESPACE_ESCAPE_SHAPE_COUNT = 14;

/**
 * THE ACQUISITION SHAPES — a SECOND table, deliberately not fifteen more rows of the first.
 *
 * These are not namespace escapes: no namespace binding exists in any of them. They are the other
 * way a module obtains `node:fs` — hand a module identity to something and get the module back —
 * and they are refused by `collectSpecifiers` rather than by the canonical form. Keeping them in
 * their own table with their own pin is what lets the first table's count stay exactly the number of
 * namespace-escape spellings.
 *
 * Rows 1-3 were already refused before 32-11; the prose claim in this file's docblock that they were
 * is now a row each, because a claim without a case is the thing 32-11 exists to remove. Rows 4-6
 * are refused by the generalised argument arm added in 32-11 (deviation, Rule 2): none of them
 * spells `require` or `import` at the call site, and all three return the real `node:fs`.
 */
const ACQUISITION_SHAPES = Object.freeze([
  {
    name: "require(\"node:fs\") — refused by the require arm of collectSpecifiers",
    appendSource:
      'import { createRequire } from "node:module";\n' +
      "const require = createRequire(import.meta.url);\n" +
      'export const acquire01 = (p) => require("node:fs").writeFileSync(p, "x");',
  },
  {
    name: 'export * from "node:fs" — refused by the export arm of collectSpecifiers',
    appendSource: 'export * from "node:fs";',
  },
  {
    name: 'await import("node:fs") — refused by the dynamic-import arm of collectSpecifiers',
    appendSource: 'const acquired03 = await import("node:fs");\nvoid acquired03;',
  },
  {
    name: "createRequire(url)(\"node:fs\") — the require alias that never spells `require`",
    appendSource:
      'import { createRequire } from "node:module";\n' +
      'export const acquire04 = (p) => createRequire(import.meta.url)("node:fs").writeFileSync(p, "x");',
  },
  {
    name: 'process.getBuiltinModule("node:fs") — no module-system call at all',
    appendSource:
      'export const acquire05 = (p) => process.getBuiltinModule("node:fs").writeFileSync(p, "x");',
  },
  {
    name: 'process.binding("fs") — the legacy internal binding',
    appendSource: 'export const acquire06 = () => process.binding("fs");',
  },
  // ── Plan 32-14, finding F-02: the re-entry rule asked at the two remaining positions ──────────
  // Before this round these two rows were GREEN on `opaqueFsAcquisitions` and red only on the
  // cardinality pin — `promises` matches no write-class stem, so the intersection never saw the
  // writer. `noteFsMember` is now asked at the named-import and named-re-export positions too, so
  // both rows are refused for the reason they are dangerous rather than because a count moved.
  {
    name: 'import { promises } from "node:fs" — a NAMED IMPORT of a namespace re-entry member',
    appendSource:
      'import { promises as fsp07 } from "node:fs";\n' +
      'export const acquire07 = (p) => fsp07.writeFile(p, "x");',
  },
  {
    name: 'export { promises } from "node:fs" — the same re-entry as a NAMED RE-EXPORT',
    appendSource: 'export { promises as acquire08 } from "node:fs";',
  },
]);

/** The cardinality of the acquisition table. A ninth route is a decision, recorded as a row. */
const ACQUISITION_SHAPE_COUNT = 8;

describe("32-06 — the guard discriminates: both halves are shown to fail", () => {
  it("CONTROL: an UNPLANTED mirror of the live closure is still green", () => {
    // Without this, a red against a planted mirror could be caused by the mirroring itself rather
    // than by the plant, and the discrimination would be measuring the harness.
    withLiveMirror({ module: DASHBOARD_ENTRY, appendSource: "// no plant" }, (mirrorRoot) => {
      const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
      expect(facts.modules.length).toBe(analyzeClosure(ROOT, DASHBOARD_ENTRY).modules.length);
      expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
      expect(bannedModulesReached(facts)).toEqual([]);
    });
  });

  it("a planted mutating fs symbol makes the intersection case FAIL", () => {
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource: `import { ${PLANTED_WRITER} } from "node:fs";`,
      },
      (mirrorRoot) => {
        const { fsSymbols } = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        const reachable = fsSymbols.filter((s) => MUTATING_FS_SYMBOLS.includes(s));
        expect(reachable).toContain(PLANTED_WRITER);
        expect(reachable).not.toEqual([]);
        // …and the blocking two-sided pin moves by exactly one, so the difference is caused by the
        // plant rather than by a derivation that broke and started reporting some other set.
        expect(fsSymbols.length).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT + 1);
      },
    );
  });

  it("a planted node:net import makes the module-ban case FAIL", () => {
    withLiveMirror(
      {
        module: DASHBOARD_ENTRY,
        appendSource: 'import { createServer } from "node:net";',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(bannedModulesReached(facts)).toEqual(["net"]);
        // …and the ALLOW-LIST refuses it too, which is what makes the same plant fail for a module
        // the deny-list never named (32-20). Both sides are asserted so the corollary cannot outlive
        // the rule.
        expect(normalizedBuiltinIdentities(facts)).toContain("net");
        expect(normalizedBuiltinIdentities(facts).length).toBe(ALLOWED_BUILTIN_SPECIFIER_COUNT + 1);
      },
    );
  });

  it("the UN-PREFIXED spelling of a banned module is caught too", () => {
    // `net` and `node:net` are the same module. A ban that only knew the prefixed spelling would be
    // a ban an import walks around by deleting five characters.
    withLiveMirror(
      {
        module: DASHBOARD_ENTRY,
        appendSource: 'import { createServer } from "net";',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(bannedModulesReached(facts)).toEqual(["net"]);
        expect(normalizedBuiltinIdentities(facts)).toContain("net");
      },
    );
  });

  it("a module acquiring node:fs by a route the pass cannot name is REFUSED, not ignored", () => {
    // Fail-closed, the direction that matters: an undecidable acquisition must red the guard rather
    // than quietly contribute an empty symbol set to the union.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource: 'const dynamicFs = await import("node:fs");\nvoid dynamicFs;',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.opaqueFsAcquisitions.length).toBeGreaterThan(0);
        expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
      },
    );
  });

  it("a namespace DESTRUCTURE of node:fs is REFUSED, not invisible (CR-01)", () => {
    // THE FINDING THIS CASE EXISTS FOR, verbatim from the verifier's own probe
    // (32-VERIFICATION.md, CR-01 transcript): an ordinary two-line ESM pattern shipped a module
    // that writes AND deletes files past a fully green guard. The old derivation named an fs symbol
    // only on a DIRECT member access, so the destructuring bind below contributed nothing to
    // `fsSymbols` and nothing to `opaqueFsAcquisitions`, the pinned closure count did not move, and
    // `npm run check:dashboard-readonly` exited 0 over `nuke`.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import * as fsns from "node:fs";\n' +
          "const { writeFileSync, rmSync } = fsns;\n" +
          'export function nuke(p) { writeFileSync(p, "x"); rmSync(p); }',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.opaqueFsAcquisitions.length,
          "a closure module bound node:fs as a namespace and then READ that binding by a route " +
            "other than a member access. The symbols behind such a read cannot be named " +
            "syntactically, so the acquisition must be REFUSED — this is the exact shape that " +
            "shipped a full writer past a green guard (CR-01). Collected instead: " +
            `[${facts.opaqueFsAcquisitions.join(" | ")}], fsSymbols [${facts.fsSymbols.join(", ")}]`,
        ).toBeGreaterThan(0);
        expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
      },
    );
  });

  it("POSITIVE CONTROL: a DIRECT member access on an fs namespace is still admitted and still named", () => {
    // Without this case the rule above could refuse EVERY namespace and still look right. The guard
    // refuses escapes, not namespaces: `readFileSync` is already one of the six, so a correct rule
    // moves nothing at all.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import * as fsns from "node:fs";\n' +
          'export const readViaNamespace = (p) => fsns.readFileSync(p, "utf8");',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.opaqueFsAcquisitions,
          "a DIRECT member access on an fs namespace is the ONE admitted use of the binding. " +
            "Refusing it would red the live closure the moment anybody wrote the legitimate shape, " +
            "the rule would be loosened under that pressure, and the result would be weaker than " +
            "the rule it replaced",
        ).toEqual([]);
        expect(facts.fsSymbols).toContain("readFileSync");
        expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
        expect(facts.fsSymbols.length).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
      },
    );
  });

  it("a STRING-LITERAL element access on an fs namespace still names its symbol", () => {
    // The element-access arm is UNCHANGED by the canonical form: a literal key still names, and the
    // new rule is a UNION with it rather than a replacement for it.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import * as fsns from "node:fs";\n' +
          'export const statViaKey = (p) => fsns["statSync"](p);',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.opaqueFsAcquisitions).toEqual([]);
        expect(facts.fsSymbols).toContain("statSync");
        expect(facts.fsSymbols.length).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
      },
    );
  });

  it("a COMPUTED element access on an fs namespace is still refused (the older arm survives the union)", () => {
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import * as fsns from "node:fs";\n' +
          'const key = "writeFileSync";\n' +
          'export const w = (p) => fsns[key](p, "x");',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.opaqueFsAcquisitions.length).toBeGreaterThan(0);
        expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
      },
    );
  });

  it("PREMISE: the derived namespace re-entry set is non-empty and holds both known re-entries", () => {
    // Derived by asking the runtime, so a future Node adding a third re-entry is covered without
    // an edit here. Asserted non-empty because a refusal over an empty set refuses nothing, and
    // asserted to hold the two this repository has actually measured, because a derivation that
    // silently stopped finding them would leave the refusal below green and vacuous.
    expect(
      NAMESPACE_REENTRY_MEMBERS.length,
      "PREMISE: no member of node:fs was derived as a namespace re-entry on node " +
        `${process.versions.node}, so the refusal of `.concat(
          "`fsns.promises` / `fsns.default` refuses nothing at all",
        ),
    ).toBeGreaterThan(0);
    for (const member of ["default", "promises"]) {
      expect(
        NAMESPACE_REENTRY_MEMBERS,
        `"${member}" is a member of node:fs whose own object carries the writer set, and the ` +
          "derivation no longer finds it. Either the runtime changed shape or the derivation broke; " +
          "either way a writer is reachable through it with nothing refusing the route",
      ).toContain(member);
    }
  });

  for (const member of ["default", "promises"]) {
    it(`a member access naming \`${member}\` RE-ENTERS a namespace and is refused (deviation, Rule 2)`, () => {
      // Both plants are working writers. MEASURED before this rule existed (recorded in
      // 32-11-GREEN-proof.txt): `fsns.promises.writeFile` produced `opaqueFsAcquisitions: []` AND a
      // mutating-symbol intersection of `[]` — the case that names the danger stayed green, and the
      // only thing that moved was the cardinality pin gaining the member name `promises`. A pin
      // catching a writer by accident is not the same as the intersection deciding it.
      withLiveMirror(
        {
          module: "scripts/board-read.js",
          appendSource:
            'import * as fsns from "node:fs";\n' +
            `export const nukeVia_${member} = (p) => fsns.${member}.writeFileSync(p, "x");`,
        },
        (mirrorRoot) => {
          const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
          expect(facts.opaqueFsAcquisitions.length).toBeGreaterThan(0);
          expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
          expect(
            facts.fsSymbols,
            `"${member}" must not be NAMED as an fs symbol: naming it would put a namespace object ` +
              "in the symbol set, where the mutating-set intersection would then ask whether the " +
              `string "${member}" is a writer and answer no`,
          ).not.toContain(member);
        },
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────
  // THE ENUMERATION (32-11). Both tables are asserted non-empty and pinned two-sided BEFORE the
  // iterations claim anything, because an emptiness claim over an empty denominator is the
  // false-green this repository has recorded six instances of.
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  it("PREMISE: both escape tables are non-empty before any iteration over them claims anything", () => {
    expect(
      NAMESPACE_ESCAPE_SHAPES.length,
      "PREMISE: the namespace-escape table is EMPTY, so the block below iterates over nothing and " +
        "every refusal it appears to prove was never asked for",
    ).toBeGreaterThan(0);
    expect(
      ACQUISITION_SHAPES.length,
      "PREMISE: the acquisition table is EMPTY, so the same block proves nothing about require, " +
        "export *, dynamic import, or the three non-module-system routes",
    ).toBeGreaterThan(0);
  });

  it("the namespace-escape table has exactly fourteen rows", () => {
    expect(
      NAMESPACE_ESCAPE_SHAPES.length,
      "a FIFTEENTH namespace-escape spelling is a DECISION: it belongs in NAMESPACE_ESCAPE_SHAPES " +
        "as a named row with the source that spells it, so the enumeration and the count move " +
        "together. It is never a bumped constant",
    ).toBe(NAMESPACE_ESCAPE_SHAPE_COUNT);
    expect(
      ACQUISITION_SHAPES.length,
      "a NINTH acquisition route is a DECISION, recorded as a row in ACQUISITION_SHAPES with the " +
        "source that reaches node:fs through it",
    ).toBe(ACQUISITION_SHAPE_COUNT);
  });

  it("no two rows in either table share a name", () => {
    // A table whose rows silently collapse is a table that tests fewer things than it counts: two
    // identically-named `it(…)` blocks still both run, but a reader counting names in the reporter
    // would credit the enumeration with coverage it does not have.
    for (const [label, rows] of [
      ["NAMESPACE_ESCAPE_SHAPES", NAMESPACE_ESCAPE_SHAPES],
      ["ACQUISITION_SHAPES", ACQUISITION_SHAPES],
    ] as const) {
      const names = rows.map((row) => row.name);
      expect(
        new Set(names).size,
        `${label} carries duplicate row names, so its cardinality overstates what it tests`,
      ).toBe(names.length);
      for (const name of names) expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  for (const shape of NAMESPACE_ESCAPE_SHAPES) {
    it(`namespace escape is REFUSED: ${shape.name}`, () => {
      withLiveMirror(
        { module: "scripts/board-read.js", appendSource: shape.appendSource },
        (mirrorRoot) => {
          const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
          expect(
            facts.opaqueFsAcquisitions.length,
            `the escape spelling "${shape.name}" was NOT refused. It reaches every writer in ` +
              "node:fs without naming one, so a guard that neither names it nor refuses it is " +
              `green over a writer. Collected: [${facts.opaqueFsAcquisitions.join(" | ")}]`,
          ).toBeGreaterThan(0);
          expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
        },
      );
    });
  }

  for (const shape of ACQUISITION_SHAPES) {
    it(`fs acquisition is REFUSED: ${shape.name}`, () => {
      withLiveMirror(
        { module: "scripts/board-read.js", appendSource: shape.appendSource },
        (mirrorRoot) => {
          const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
          expect(
            facts.opaqueFsAcquisitions.length,
            `the acquisition route "${shape.name}" was NOT refused. Collected: ` +
              `[${facts.opaqueFsAcquisitions.join(" | ")}]`,
          ).toBeGreaterThan(0);
          expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
        },
      );
    });
  }

  it("CONTROL: a call carrying a NON-fs string literal is neither refused nor read as an import", () => {
    // The generalised argument arm refuses a call whose string argument is an fs module IDENTITY. It
    // must not also turn every string argument into a module specifier: if it did, a harmless
    // `["net", "http"].join()` would red the DASH-08 socket ban, the arm would be loosened under
    // that pressure, and the result would be weaker than the arm it replaced.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'export const harmless = () => ["net", "http", "child_process"].join(",");\n' +
          'export const alsoHarmless = (p) => String(p).padEnd(4, "fsx");',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.opaqueFsAcquisitions).toEqual([]);
        expect(bannedModulesReached(facts)).toEqual([]);
        expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
      },
    );
  });

  it("the scratch root is left with no mirror residue", () => {
    // A real LISTING, not `git status`: `.temp/` is gitignored, so a git-based residue check is
    // blind to exactly the directory the mirrors live in (the round-5 lesson recorded in
    // vitest.config.ts).
    const survivors = existsSync(SCRATCH_ROOT) ? readdirSync(SCRATCH_ROOT) : [];
    expect(survivors, `mirror residue survived under ${SCRATCH_ROOT}`).toEqual([]);
  });
});

afterAll(() => {
  // Belt and braces for a crashed run: `withLiveMirror`'s `finally` removes each mirror, and this
  // removes the parent so no empty scratch directory survives either.
  rmSync(SCRATCH_ROOT, { recursive: true, force: true });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART SIX — the ABSENCE of a runtime dependency, asserted rather than assumed.
//
// The whole closure walk rests on "this repository ships zero runtime dependencies": bare specifiers
// are node builtins, so skipping them loses nothing. The day a `dependencies` key appears, that
// premise is false and the closure above is silently short by everything under node_modules. So the
// premise is a failing assertion here, the same fail-closed posture `check:build-parity` uses.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the guard adds no runtime dependency", () => {
  it("package.json still has no `dependencies` key", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      readonly dependencies?: unknown;
      readonly scripts?: Record<string, string>;
    };
    expect(
      manifest.dependencies,
      "a `dependencies` key appeared in package.json. jsImportClosure follows RELATIVE specifiers " +
        "only, so a runtime dependency is invisible to the closure this guard walks — the guard " +
        "would stay green while reporting a set that is short by everything under node_modules",
    ).toBeUndefined();
  });

  it("every closure module under scripts/ has a sibling .ts source (32-11)", () => {
    // ASK WHAT THE GUARD IS ASKED OF, NOT ONLY WHAT IT REFUSES. `analyzeClosure` walks
    // `scripts/board-dashboard.js` — the COMMITTED BUILD OUTPUT. A `.js` in that closure with no
    // `.ts` beside it is a program no source in this repository describes, and nothing else in this
    // file would notice it. The list is DERIVED from the closure's own module list rather than
    // typed out, because a typed list is the drift class this repository has already paid for.
    const { modules } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      modules.length,
      "PREMISE: the closure is empty, so the source-parity claim below is a statement about no " +
        "modules at all",
    ).toBeGreaterThan(0);
    const scriptModules = modules.filter((rel) => rel.startsWith("scripts/") && rel.endsWith(".js"));
    expect(
      scriptModules.length,
      "PREMISE: no closure module is a scripts/*.js, so the sibling-source claim measured nothing",
    ).toBeGreaterThan(0);
    const sourceless = scriptModules.filter(
      (rel) => !existsSync(join(ROOT, `${rel.slice(0, -".js".length)}.ts`)),
    );
    expect(
      sourceless,
      `the dashboard closure contains committed build output with no TypeScript source: ` +
        `${sourceless.join(", ")}. CLAUDE.md's tooling-layer contract is that every runnable .js is ` +
        "compiled from a .ts in this tree; a .js without one is a program this repository cannot " +
        "rebuild, and this guard would keep analysing it forever",
    ).toEqual([]);
  });

  it("check:build-parity exists and CI runs it — it is what makes the analysed .js the real program (32-11)", () => {
    // THIS GUARD'S ANSWER IS ONLY AS GOOD AS THE BUILD'S FRESHNESS. A writer introduced in a `.ts`
    // and not rebuilt is invisible here, because the subject of every assertion above is the
    // committed `.js`. That precondition lives in a DIFFERENT script, so the dependency is asserted
    // rather than left for a reader to infer.
    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      readonly scripts?: Record<string, string>;
    };
    expect(
      manifest.scripts?.["check:build-parity"],
      "package.json no longer carries a `check:build-parity` entry. This guard decides a question " +
        "about the COMMITTED .js, and check:build-parity is the mechanism that makes that .js the " +
        "same program as its .ts. Without it, a green here is green over whatever was last committed",
    ).toBeDefined();

    const workflowPath = join(ROOT, ".github", "workflows", "ci.yml");
    expect(
      existsSync(workflowPath),
      `PREMISE: ${workflowPath} is absent, so the claim that CI runs the parity check could not be ` +
        "measured. Record `UNKNOWN - verify` rather than asserting a green that was not measured",
    ).toBe(true);
    expect(
      readFileSync(workflowPath, "utf8"),
      "the CI workflow no longer invokes `npm run check:build-parity`. The freshness precondition " +
        "this guard depends on would then hold only on a developer's machine",
    ).toContain("npm run check:build-parity");
  });

  it("the check:dashboard-readonly entry runs exactly this file", () => {
    // One authority, one implementation: the named command and the suite must not be able to drift
    // apart, which they cannot if the command IS the suite pointed at one file.
    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      readonly scripts?: Record<string, string>;
    };
    expect(manifest.scripts?.["check:dashboard-readonly"]).toBe(
      "npx vitest run scripts/board-readonly.test.ts",
    );
  });
});

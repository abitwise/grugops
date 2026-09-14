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
// WHAT IT DOES NOT CLOSE, NAMED RATHER THAN IMPLIED:
//   • The derivation is SYNTACTIC. An aliased re-export (`export { writeFileSync as w }` through an
//     intermediate module) or a dynamic `import()` of a COMPUTED specifier is not resolved by name.
//     Both are refused rather than ignored — an unresolvable acquisition is collected and asserted
//     absent — but a route this file cannot see is a route it cannot decide. Widening the matcher
//     once per counter-example is the failure this repository has already paid for, so the boundary
//     is written down instead.
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
              fsSymbols.add((element.propertyName ?? element.name).text);
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
              fsSymbols.add((element.propertyName ?? element.name).text);
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
      }
    }
    ts.forEachChild(node, collectSpecifiers);
  };
  collectSpecifiers(source);

  const collectNamespaceMembers = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      if (fsNamespaceBindings.has(node.expression.text)) fsSymbols.add(node.name.text);
    } else if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression)) {
      if (fsNamespaceBindings.has(node.expression.text)) {
        const key = literalText(node.argumentExpression);
        if (key === null) opaqueFsAcquisitions.push(node.getText());
        else fsSymbols.add(key);
      }
    }
    ts.forEachChild(node, collectNamespaceMembers);
  };
  if (fsNamespaceBindings.size > 0) collectNamespaceMembers(source);

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

/** The ambiguous pair that stays IN the mutating set, by decision rather than by omission. */
const AMBIGUOUS_RETAINED = Object.freeze(["open", "openSync"]);

const STEM_MATCHED_FS_SYMBOLS = stemMatchedRuntimeSymbols();
const MUTATING_FS_SYMBOLS = Object.freeze(
  STEM_MATCHED_FS_SYMBOLS.filter((name) => !STEM_FALSE_POSITIVES.includes(name)),
);

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
      "PREMISE: a closure module reaches node:fs through a dynamic import, a require, an " +
        "`export * from`, or a computed member access. The syntactic derivation cannot name the " +
        "symbols behind such a route, so it refuses rather than reporting a short set",
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
// PART FOUR — the module ban (DASH-08, "no socket").
//
// `jsImportClosure` gives the FILE list but deliberately skips BARE specifiers — its own docblock
// says so — so the ban needs the second AST pass PART ONE already collected. A ban asserted over an
// empty specifier set is a green that measured nothing, so the set is asserted non-empty first.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * D-21's five banned modules, verbatim. The projector spawns nothing and listens on nothing.
 *
 * Written WITHOUT the `node:` prefix because the ban is over module IDENTITY: `net` and `node:net`
 * are the same module, and a ban that only knew one spelling would be a ban an import could walk
 * around by dropping four characters.
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

/** The banned identities a closure actually reaches, by normalized name, sorted. */
function bannedModulesReached(facts: ClosureFacts): readonly string[] {
  return [
    ...new Set(
      facts.bareSpecifiers
        .map(normalizeSpecifier)
        .filter((identity) => ALL_BANNED_MODULES.includes(identity)),
    ),
  ].sort();
}

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

  it("the dashboard closure imports no banned module", () => {
    const reached = bannedModulesReached(analyzeClosure(ROOT, DASHBOARD_ENTRY));
    expect(
      reached,
      `the board projector's import closure reaches ${reached.join(", ")}. The projector renders ` +
        "state over a filesystem read; it listens on nothing and spawns nothing (DASH-08)",
    ).toEqual([]);
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
        const reached = bannedModulesReached(analyzeClosure(mirrorRoot, DASHBOARD_ENTRY));
        expect(reached).toEqual(["net"]);
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
        expect(bannedModulesReached(analyzeClosure(mirrorRoot, DASHBOARD_ENTRY))).toEqual(["net"]);
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

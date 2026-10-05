// host-protection-floor.test.ts — the static census of the git-host check's floor (Phase 33.1,
// plan 33.1-22, Gap A of 33.1-VERIFICATION.md, re-review CR-01, decision D-30).
//
// WHY A CENSUS. D-30 fixes the rule: anything unreadable, absent or oddly shaped is
// `UNKNOWN - verify`, never `protected`. Every round of this phase fixed the named site while a
// sibling site of the same class survived (brief 33.1-GAP-PLANNING-BRIEF.md, DC-1). Plan 33.1-22
// moved every read that can produce `held` or `binds` behind one reader, readFact(value,
// ACCEPT.<name>), and every other host field behind one accessor, hostField(value, key). This file
// holds that shape statically, so a future ad-hoc reader cannot slip past it:
//
//   1. PRODUCERS. Every string literal "held", "binds", "failed", "bypassable", "protected" or
//      "unprotected" in host-protection.ts is either non-producing (an operand of ===, !==, == or
//      !=, a `case` clause expression, inside a type node, or the key argument of hostField, which
//      names a host field and is never returned) or counted under its enclosing scope.
//      The counted multiset equals the pinned PRODUCERS table, two-sided, with counts. A new
//      producer in a row reader, or a new path to a `protected` verdict, turns this red.
//      "unknown" and "UNKNOWN - verify" are deliberately NOT pinned: they are the fail-closed
//      defaults, and a new producer of either can only lower a verdict, never raise one.
//   2. HOST_READS. A type-checked census: a ts.Program over host-protection.ts finds every read of a
//      value whose type is the host-JSON type `Record<string, unknown>` (property and element
//      access, destructuring, Object.* / Reflect.* / JSON.stringify over it, spread, `for…in`, and
//      `in`). Each read must sit inside readFact, hostField or an ACCEPT entry's predicate; the one
//      declared exception is environmentName, class `config-json`, which parses the user's
//      factory.config.json and not a host answer. Any such access on an `any`-typed value is refused
//      anywhere in the file. The census fails closed: it first asserts zero syntactic and semantic
//      diagnostics for the file, because a file it cannot type proves nothing. Reads are keyed by
//      access NODE per scope, so a new hostField(x, "k") call site adds no row (the access it makes
//      is the one inside hostField).
//      A cast or a type guard that turns an opaque value into an object type with named properties
//      is refused too, because it would move a host read out of the type the census looks for.
//   3. The readFact argument census: every readFact call passes `ACCEPT.<name>` as its second
//      argument, the names used equal the keys declared in the ACCEPT object literal, two-sided,
//      and ACCEPT is referenced nowhere else except the load-time self-check.
//   4. The source calls assertAcceptTable() at top level, after ACCEPT and the uncaughtException
//      handler, and before any gh call.
//
// This is the static half. The behavioural half is section 5, "evidence-field matrix" (plan
// 33.1-23): every field of every host answer that feeds a floor row, taken from the strong fixture
// by walking it, removed, nulled or garbled alone, run through the COMMITTED host-protection.js.
// Section 6, "evidence-field pairs" (plan 33.1-24), breaks two fields at once: sibling fields of one
// answer, the representatives of every two floor rows, and (until plan 33.1-41) each branch row
// beside the protected-branch evidence of the environment's branch-policy row.
// Plan 33.1-41 (33.1 D-31 Q4): the check no longer reads the production environment, so the
// environments list, the protected-branch list and the listed branch's protection are no longer
// read, the matrix walks only the three bodies still read, and every run asserts the environment
// line is the by-design `UNKNOWN - verify` line.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import ts from "typescript";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const HERE = import.meta.dirname;
const REPO_ROOT = join(HERE, "..", "..");
const SOURCE = join(HERE, "host-protection.ts");

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// The pinned tables.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const STATE_LITERALS = new Set(["held", "binds", "failed", "bypassable", "protected", "unprotected"]);

interface PinnedRow {
  readonly key: string;
  readonly count: number;
  readonly why: string;
}

// `<scope>:<literal>` → count. Every row names why that scope may produce the literal.
const PRODUCERS: readonly PinnedRow[] = [
  { key: "readFact:held", count: 1, why: "the one reader: held only when an ACCEPT entry accepts the value" },
  { key: "readFact:failed", count: 1, why: "the one reader: failed only when an ACCEPT entry reads the value as not shown" },
  { key: "toBinding:binds", count: 1, why: "a source binds only from a readFact `held`" },
  { key: "toBinding:bypassable", count: 1, why: "a source is bypassable only from a readFact `failed`" },
  { key: "bindSources:held", count: 1, why: "derived: at least one source both shows the item (held) and binds" },
  { key: "bindSources:failed", count: 1, why: "derived: every source was read and none shows the item and binds" },
  { key: "combineArms:held", count: 1, why: "derived: the union rule, held when either arm is held" },
  { key: "combineArms:failed", count: 1, why: "derived: the union rule, failed only when both arms are failed" },
  { key: "qualifierFact:held", count: 1, why: "derived: the qualifier is held exactly when every item row is held" },
  { key: "qualifierFact:failed", count: 1, why: "derived: an item failed and a source that would show it is bypassable" },
  {
    key: "rulesetReading:failed",
    count: 1,
    why: "a rule list read in full holds no rule of the item's type (downgraded to unknown when the list is partial)",
  },
  { key: "classicReading:failed", count: 1, why: "the host reports no classic protection (404 `Branch not protected`, or `.protected === false`)" },
  { key: "branchVerdict:protected", count: 1, why: "the one branch verdict: every BRANCH_FLOOR row is held" },
  { key: "branchVerdict:unprotected", count: 1, why: "the one branch verdict: some row is failed" },
  // Plan 33.1-41 (33.1 D-31 Q4) removed four rows with the environment reading: the two
  // ENVIRONMENT_FLOOR[...].read:failed rows (required_reviewer, no_self_review) and
  // environmentVerdict:protected / environmentVerdict:unprotected. 18 rows before, 14 after.
  // environmentByDesign produces no state literal: its verdict is always UNKNOWN - verify.
];

// The only scopes that may produce "held" or "binds", and "protected" (the plan's stated sets). A
// row outside these for those literals is refused even if someone pins it.
const HELD_BINDS_SCOPES = new Set(["readFact", "toBinding", "bindSources", "combineArms", "qualifierFact"]);
const PROTECTED_SCOPES = new Set(["branchVerdict"]);

type ReadClass = "reader" | "config-json";

interface HostReadRow extends PinnedRow {
  readonly cls: ReadClass;
}

// `<scope>:<read kind>` → count. `reader` rows must sit in readFact, hostField or an ACCEPT
// predicate; the `config-json` row is the one declared exception.
const HOST_READS: readonly HostReadRow[] = [
  { key: "hostField:element", count: 1, cls: "reader", why: "the one accessor: value[key] after isObject(value)" },
  { key: "ACCEPT.bypassAllowances.held:property", count: 3, cls: "reader", why: "users, teams and apps must all be empty arrays" },
  { key: "ACCEPT.enforceAdmins.held:property", count: 1, cls: "reader", why: "enforce_admins.enabled === true" },
  { key: "ACCEPT.enforceAdmins.failed:property", count: 1, cls: "reader", why: "enforce_admins.enabled === false" },
  { key: "ACCEPT.disabledFlag.held:property", count: 1, cls: "reader", why: "allow_*.enabled === false" },
  { key: "ACCEPT.disabledFlag.failed:property", count: 1, cls: "reader", why: "allow_*.enabled === true" },
  { key: "ACCEPT.ruleEntry.held:property", count: 1, cls: "reader", why: "a rule entry's type must be a string" },
  // Plan 33.1-41 (33.1 D-31 Q4) removed ACCEPT.deploymentBranchPolicy.held:property x2 and
  // ACCEPT.protectedBranchList.held:property x3 with the environment reading. 11 rows before, 9 after.
  {
    key: "ACCEPT.classicProtectionRecord.held:property",
    count: 5,
    cls: "reader",
    why: "a protection record: no message, no protected, and enforce_admins an object whose enabled is a boolean (red-team finding 1 of plan 33.1-23)",
  },
  {
    key: "environmentName:property",
    count: 4,
    cls: "config-json",
    why: "parses the user's factory.config.json `environments` list (not a host answer), text read through readConfigText, the one bounded reader (plan 33.1-25, brief DC-3)",
  },
];

const CONFIG_JSON_SCOPES = new Set(["environmentName"]);
const isReaderScope = (scope: string): boolean => scope === "readFact" || scope === "hostField" || scope.startsWith("ACCEPT.");

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// The program, built once. Fail-closed: a file the checker cannot type proves nothing.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function buildProgram(): { program: ts.Program; sf: ts.SourceFile; checker: ts.TypeChecker } {
  const configPath = join(REPO_ROOT, "tsconfig.json");
  const read = ts.readConfigFile(configPath, (p) => ts.sys.readFile(p));
  if (read.error !== undefined) throw new Error(`tsconfig.json could not be read: ${ts.flattenDiagnosticMessageText(read.error.messageText, "\n")}`);
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, REPO_ROOT);
  const program = ts.createProgram({ rootNames: [SOURCE], options: { ...parsed.options, noEmit: true } });
  const sf = program.getSourceFile(SOURCE);
  if (sf === undefined) throw new Error(`the program has no source file for ${SOURCE}`);
  return { program, sf, checker: program.getTypeChecker() };
}

const { program, sf: SF, checker: CHECKER } = buildProgram();

const lineOf = (node: ts.Node): number => SF.getLineAndCharacterOfPosition(node.getStart(SF)).line + 1;

function diagnosticsText(list: readonly ts.Diagnostic[]): string[] {
  return list.map((d) => {
    const where = d.file !== undefined && d.start !== undefined ? `:${d.file.getLineAndCharacterOfPosition(d.start).line + 1}` : "";
    return `host-protection.ts${where} ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// Scope naming: the path of named containers from the file root down to the node.
//   - a function declaration or method: its name
//   - a variable or object property whose (unwrapped) initializer is a function, an object literal
//     or an array literal: its name (so ACCEPT entries read `ACCEPT.<entry>.held`)
//   - an object literal inside an array literal: `[<id>]` when it has a string `id`, else `[<index>]`
//     (so table rows read `ENVIRONMENT_FLOOR[required_reviewer].read`)
// An anonymous function (a callback) adds nothing: it belongs to the scope that encloses it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function unwrap(e: ts.Expression): ts.Expression {
  let cur = e;
  while (ts.isParenthesizedExpression(cur) || ts.isAsExpression(cur) || ts.isSatisfiesExpression(cur) || ts.isTypeAssertionExpression(cur)) {
    cur = cur.expression;
  }
  return cur;
}

function isContainer(e: ts.Expression | undefined): boolean {
  if (e === undefined) return false;
  const u = unwrap(e);
  return ts.isArrowFunction(u) || ts.isFunctionExpression(u) || ts.isObjectLiteralExpression(u) || ts.isArrayLiteralExpression(u);
}

function within(node: ts.Node, outer: ts.Node | undefined): boolean {
  return outer !== undefined && node.pos >= outer.pos && node.end <= outer.end;
}

function rowLabel(obj: ts.ObjectLiteralExpression, arr: ts.ArrayLiteralExpression): string {
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "id" && ts.isStringLiteral(p.initializer)) {
      return `[${p.initializer.text}]`;
    }
  }
  return `[${arr.elements.indexOf(obj)}]`;
}

function scopeOf(node: ts.Node): string {
  const parts: string[] = [];
  for (let cur: ts.Node = node; cur.parent !== undefined; cur = cur.parent) {
    const p = cur.parent;
    if ((ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) && p.name !== undefined && cur !== p.name) {
      parts.unshift(p.name.getText(SF));
    } else if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name) && cur === p.initializer && isContainer(p.initializer)) {
      parts.unshift(p.name.text);
    } else if (ts.isPropertyAssignment(p) && cur === p.initializer && isContainer(p.initializer)) {
      parts.unshift(p.name.getText(SF));
    } else if (ts.isArrayLiteralExpression(p) && ts.isObjectLiteralExpression(cur)) {
      parts.unshift(rowLabel(cur, p));
    }
  }
  if (parts.length === 0) return "<top-level>";
  return parts.reduce((acc, part) => (acc === "" ? part : part.startsWith("[") ? `${acc}${part}` : `${acc}.${part}`), "");
}

function countBy(xs: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

function twoSided(found: Map<string, number>, pinned: readonly PinnedRow[]): string[] {
  const want = new Map(pinned.map((r) => [r.key, r.count]));
  const problems: string[] = [];
  for (const [key, n] of [...found].sort()) {
    const w = want.get(key);
    if (w === undefined) problems.push(`UNCOUNTED ${key} x${n}`);
    else if (w !== n) problems.push(`COUNT ${key}: found ${n}, pinned ${w}`);
  }
  for (const [key, n] of [...want].sort()) if (!found.has(key)) problems.push(`STALE ROW ${key} x${n} (nothing produces it)`);
  return problems;
}

function walk(node: ts.Node, visit: (n: ts.Node) => void): void {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
}

function inTypeNode(node: ts.Node): boolean {
  for (let cur: ts.Node | undefined = node.parent; cur !== undefined; cur = cur.parent) {
    if (ts.isTypeNode(cur)) return true;
    if (ts.isStatement(cur) || ts.isSourceFile(cur)) return false;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 1. PRODUCERS: where the state literals are produced.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const COMPARISONS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
]);

function producerCensus(): string[] {
  const out: string[] = [];
  walk(SF, (node) => {
    if (!(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) return;
    if (!STATE_LITERALS.has(node.text)) return;
    const p = node.parent;
    if (ts.isBinaryExpression(p) && COMPARISONS.has(p.operatorToken.kind)) return;
    if (ts.isCaseClause(p) && p.expression === node) return;
    if (inTypeNode(node)) return;
    // The key argument of hostField(value, key) names a host FIELD (for example the branch
    // endpoint's `protected` boolean); hostField returns the value under it, never the key.
    if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === "hostField" && p.arguments[1] === node) return;
    out.push(`${scopeOf(node)}:${node.text}`);
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 2. HOST_READS: where a host-JSON value is read (type-checked).
// ═══════════════════════════════════════════════════════════════════════════════════════════════

// The host-JSON type: a string index signature of `unknown` and no named property
// (`Record<string, unknown>`, however it is spelled). A union counts when any member is one.
function isHostJson(t: ts.Type): boolean {
  if (t.isUnion()) return t.types.some(isHostJson);
  if ((t.flags & ts.TypeFlags.Object) === 0) return false;
  const index = CHECKER.getIndexInfosOfType(t).find((i) => (i.keyType.flags & ts.TypeFlags.String) !== 0);
  return index !== undefined && (index.type.flags & ts.TypeFlags.Unknown) !== 0 && t.getProperties().length === 0;
}

function isAny(t: ts.Type): boolean {
  return (t.flags & ts.TypeFlags.Any) !== 0;
}

const ENUMERATING_CALLS = new Set([
  "Object.keys",
  "Object.values",
  "Object.entries",
  "Object.getOwnPropertyNames",
  "Object.getOwnPropertyDescriptor",
  "Object.getOwnPropertyDescriptors",
  "Object.assign",
  "Object.hasOwn",
  "Reflect.get",
  "Reflect.has",
  "Reflect.ownKeys",
  "Reflect.getOwnPropertyDescriptor",
  "JSON.stringify",
]);

interface Read {
  readonly scope: string;
  readonly kind: string;
  readonly line: number;
}

// The type of the value a binding pattern destructures: the checker gives it at the pattern itself,
// for a declaration with an initializer, a `for…of` element, a parameter or a nested pattern alike.
function patternSourceType(pattern: ts.BindingPattern): ts.Type {
  return CHECKER.getTypeAtLocation(pattern);
}

function hostReadCensus(): { reads: Read[]; anyRefusals: string[] } {
  const reads: Read[] = [];
  const anyRefusals: string[] = [];
  const consider = (obj: ts.Node, kind: string, at: ts.Node): void => {
    const t = CHECKER.getTypeAtLocation(obj);
    if (isAny(t)) anyRefusals.push(`${kind} on an any-typed value at host-protection.ts:${lineOf(at)} (${scopeOf(at)}): ${at.getText(SF).slice(0, 80)}`);
    else if (isHostJson(t)) reads.push({ scope: scopeOf(at), kind, line: lineOf(at) });
  };
  walk(SF, (node) => {
    if (inTypeNode(node)) return;
    if (ts.isPropertyAccessExpression(node)) consider(node.expression, "property", node);
    else if (ts.isElementAccessExpression(node)) consider(node.expression, "element", node);
    else if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
      const t = patternSourceType(node);
      for (const el of node.elements) {
        if (!ts.isBindingElement(el)) continue;
        if (isAny(t)) anyRefusals.push(`destructure of an any-typed value at host-protection.ts:${lineOf(el)} (${scopeOf(el)})`);
        else if (isHostJson(t)) reads.push({ scope: scopeOf(el), kind: "binding", line: lineOf(el) });
      }
    } else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
      const name = `${node.expression.expression.text}.${node.expression.name.text}`;
      if (ENUMERATING_CALLS.has(name)) for (const arg of node.arguments) consider(arg, "object-call", node);
    } else if (ts.isForInStatement(node)) consider(node.expression, "for-in", node);
    else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InKeyword) consider(node.right, "in", node);
    else if (ts.isSpreadAssignment(node) || ts.isSpreadElement(node)) consider(node.expression, "spread", node);
  });
  return { reads, anyRefusals };
}

// The census above finds reads by the host-JSON TYPE, so a host value that is given another type
// would slip past it: `(v as { enabled: boolean }).enabled`, or a type guard `v is { enabled:
// boolean }`, reads a host field on a value typed as a shape. Both are refused: no cast and no type
// predicate may turn an opaque value (`unknown`, `any` or host JSON) into an object type with named
// properties. Arrays and tuples are not shapes (an element of a host list is still `unknown`).
function isOpaque(t: ts.Type): boolean {
  if (t.isUnion()) return t.types.some(isOpaque);
  return (t.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) !== 0 || isHostJson(t);
}

function isShaped(t: ts.Type): boolean {
  if (t.isUnion() || t.isIntersection()) return t.types.some(isShaped);
  if ((t.flags & ts.TypeFlags.Object) === 0) return false;
  if (CHECKER.isArrayType(t) || CHECKER.isTupleType(t)) return false;
  return t.getProperties().length > 0;
}

function shapeRefusals(): string[] {
  const out: string[] = [];
  walk(SF, (node) => {
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
      if (isOpaque(CHECKER.getTypeAtLocation(node.expression)) && isShaped(CHECKER.getTypeAtLocation(node))) {
        out.push(`a cast gives an opaque value a shape at host-protection.ts:${lineOf(node)} (${scopeOf(node)}): ${node.getText(SF).slice(0, 80)}`);
      }
    }
    if (ts.isFunctionLike(node) && node.type !== undefined && ts.isTypePredicateNode(node.type)) {
      const sig = CHECKER.getSignatureFromDeclaration(node);
      const pred = sig === undefined ? undefined : CHECKER.getTypePredicateOfSignature(sig);
      if (pred?.type !== undefined && pred.parameterIndex !== undefined) {
        const param = node.parameters[pred.parameterIndex];
        const from = param === undefined ? undefined : CHECKER.getTypeAtLocation(param);
        if (from !== undefined && isOpaque(from) && isShaped(pred.type)) {
          out.push(`a type guard gives an opaque value a shape at host-protection.ts:${lineOf(node)} (${scopeOf(node)}): ${node.type.getText(SF)}`);
        }
      }
    }
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 3 and 4. readFact's arguments, the ACCEPT keys, and the top-level self-check.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function acceptDeclaration(): ts.ObjectLiteralExpression {
  let found: ts.ObjectLiteralExpression | undefined;
  for (const st of SF.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const d of st.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.name.text === "ACCEPT" && d.initializer !== undefined) {
        const init = unwrap(d.initializer);
        if (ts.isObjectLiteralExpression(init)) found = init;
      }
    }
  }
  if (found === undefined) throw new Error("host-protection.ts declares no top-level `const ACCEPT = { ... }` object literal");
  return found;
}

function acceptCensus(): { declared: string[]; used: string[]; refusals: string[] } {
  const decl = acceptDeclaration();
  const declared = decl.properties.map((p) => (p.name !== undefined ? p.name.getText(SF) : `<unnamed at :${lineOf(p)}>`));
  const used: string[] = [];
  const refusals: string[] = [];
  walk(SF, (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "readFact") {
      const arg = node.arguments[1];
      if (
        node.arguments.length === 2 &&
        arg !== undefined &&
        ts.isPropertyAccessExpression(arg) &&
        ts.isIdentifier(arg.expression) &&
        arg.expression.text === "ACCEPT"
      ) {
        used.push(arg.name.text);
      } else {
        refusals.push(`readFact called at host-protection.ts:${lineOf(node)} without ACCEPT.<name> as its second argument: ${node.getText(SF).slice(0, 80)}`);
      }
    }
    if (ts.isIdentifier(node) && node.text === "readFact") {
      const p = node.parent;
      const isCallee = ts.isCallExpression(p) && p.expression === node;
      const isDecl = ts.isFunctionDeclaration(p) && p.name === node;
      if (!isCallee && !isDecl) refusals.push(`readFact referenced other than as a callee at host-protection.ts:${lineOf(node)}`);
    }
    if (ts.isIdentifier(node) && node.text === "ACCEPT") {
      const p = node.parent;
      const isDecl = ts.isVariableDeclaration(p) && p.name === node;
      const isReadFactArg =
        ts.isPropertyAccessExpression(p) && p.expression === node && ts.isCallExpression(p.parent) && p.parent.arguments[1] === p &&
        ts.isIdentifier(p.parent.expression) && p.parent.expression.text === "readFact";
      const inSelfCheck = scopeOf(node) === "assertAcceptTable";
      if (!isDecl && !isReadFactArg && !inSelfCheck) {
        refusals.push(`ACCEPT referenced outside readFact's second argument and the self-check at host-protection.ts:${lineOf(node)}`);
      }
    }
  });
  return { declared, used, refusals };
}

function containsCallOf(node: ts.Node, names: ReadonlySet<string>): boolean {
  let hit = false;
  walk(node, (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && names.has(n.expression.text)) hit = true;
  });
  return hit;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// The checks.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("host-protection.ts floor census (Gap A, CR-01, D-30, plan 33.1-22)", () => {
  it("the type checker reads host-protection.ts with zero syntactic and zero semantic diagnostics (fail closed)", () => {
    const syntactic = diagnosticsText(program.getSyntacticDiagnostics(SF));
    const semantic = diagnosticsText(program.getSemanticDiagnostics(SF));
    expect(syntactic, syntactic.join("\n")).toEqual([]);
    expect(semantic, semantic.join("\n")).toEqual([]);
  });

  it("PRODUCERS: the state literals are produced only in the pinned scopes, two-sided, with counts", () => {
    const found = countBy(producerCensus());
    console.log(`host-protection floor census, PRODUCERS: ${[...found].sort().map(([k, n]) => `${k} x${n}`).join(", ")}`);
    expect(found.size, "the census found no producer at all — it is scanning nothing").toBeGreaterThan(0);
    const problems = twoSided(found, PRODUCERS);
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("PRODUCERS: every row carries a reason, and held/binds/protected come only from their stated scopes", () => {
    const keys = PRODUCERS.map((r) => r.key);
    expect(new Set(keys).size, "duplicate PRODUCERS row").toBe(keys.length);
    for (const row of PRODUCERS) {
      expect(row.why.trim().length, `${row.key}: empty why`).toBeGreaterThan(0);
      expect(row.count, `${row.key}: count`).toBeGreaterThan(0);
      const at = row.key.lastIndexOf(":");
      const scope = row.key.slice(0, at);
      const literal = row.key.slice(at + 1);
      expect(STATE_LITERALS.has(literal), `${row.key}: not a pinned state literal`).toBe(true);
      if (literal === "held" || literal === "binds") expect(HELD_BINDS_SCOPES.has(scope), `${row.key}: held/binds outside its scopes`).toBe(true);
      if (literal === "protected" || literal === "unprotected") expect(PROTECTED_SCOPES.has(scope), `${row.key}: a verdict outside the one verdict function`).toBe(true);
    }
  });

  it("HOST_READS: no access on an any-typed value anywhere in the file", () => {
    const { anyRefusals } = hostReadCensus();
    expect(anyRefusals, anyRefusals.join("\n")).toEqual([]);
  });

  it("HOST_READS: every host-JSON read sits in readFact, hostField or an ACCEPT predicate (or the declared config-json exception), two-sided, with counts", () => {
    const { reads } = hostReadCensus();
    const found = countBy(reads.map((r) => `${r.scope}:${r.kind}`));
    console.log(`host-protection floor census, HOST_READS: ${[...found].sort().map(([k, n]) => `${k} x${n}`).join(", ")}`);
    expect(reads.length, "the census found no host-JSON read — the type test is matching nothing").toBeGreaterThan(0);
    const outside = reads
      .filter((r) => !isReaderScope(r.scope) && !CONFIG_JSON_SCOPES.has(r.scope))
      .map((r) => `OUTSIDE THE READER ${r.scope}:${r.kind} at host-protection.ts:${r.line}`);
    expect(outside, outside.join("\n")).toEqual([]);
    const problems = twoSided(found, HOST_READS);
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("HOST_READS: no cast and no type guard gives an opaque host value an object shape (the census cannot be sidestepped by retyping)", () => {
    const refusals = shapeRefusals();
    expect(refusals, refusals.join("\n")).toEqual([]);
  });

  it("HOST_READS: every pinned row carries a reason and a class that matches its scope", () => {
    const keys = HOST_READS.map((r) => r.key);
    expect(new Set(keys).size, "duplicate HOST_READS row").toBe(keys.length);
    for (const row of HOST_READS) {
      expect(row.why.trim().length, `${row.key}: empty why`).toBeGreaterThan(0);
      const scope = row.key.slice(0, row.key.lastIndexOf(":"));
      if (row.cls === "reader") expect(isReaderScope(scope), `${row.key}: a reader row outside the reader`).toBe(true);
      else expect(CONFIG_JSON_SCOPES.has(scope), `${row.key}: a config-json row outside environmentName`).toBe(true);
    }
  });

  it("readFact is only ever called with ACCEPT.<name>, and the names used equal the ACCEPT keys, two-sided", () => {
    const { declared, used, refusals } = acceptCensus();
    console.log(`host-protection floor census, ACCEPT: ${declared.length} key(s) declared, ${used.length} readFact call(s)`);
    expect(refusals, refusals.join("\n")).toEqual([]);
    expect(declared.length, "ACCEPT declares no entry").toBeGreaterThan(0);
    expect(new Set(declared).size, "duplicate ACCEPT key").toBe(declared.length);
    const usedSet = new Set(used);
    const unused = declared.filter((k) => !usedSet.has(k)).sort();
    const undeclared = [...usedSet].filter((k) => !declared.includes(k)).sort();
    expect(unused, `ACCEPT keys no readFact call uses: ${unused.join(", ")}`).toEqual([]);
    expect(undeclared, `readFact uses names ACCEPT does not declare: ${undeclared.join(", ")}`).toEqual([]);
  });

  it("assertAcceptTable() is called at top level, after ACCEPT and the uncaughtException handler, before any gh call", () => {
    const statements = [...SF.statements];
    const callAt = statements.findIndex(
      (st) =>
        ts.isExpressionStatement(st) &&
        ts.isCallExpression(st.expression) &&
        ts.isIdentifier(st.expression.expression) &&
        st.expression.expression.text === "assertAcceptTable" &&
        st.expression.arguments.length === 0,
    );
    expect(callAt, "no top-level assertAcceptTable() call").toBeGreaterThan(-1);
    const acceptAt = statements.findIndex((st) => within(acceptDeclaration(), st));
    const handlerAt = statements.findIndex((st) => st.getText(SF).startsWith('process.on("uncaughtException"'));
    const ghAt = statements.findIndex((st) => !ts.isFunctionDeclaration(st) && containsCallOf(st, new Set(["runGh", "apiGet"])));
    expect(handlerAt, "no top-level uncaughtException handler").toBeGreaterThan(-1);
    expect(acceptAt, "ACCEPT is not a top-level declaration").toBeGreaterThan(-1);
    expect(ghAt, "no top-level statement calls gh — the ordering check would be vacuous").toBeGreaterThan(-1);
    expect(handlerAt).toBeLessThan(callAt);
    expect(acceptAt).toBeLessThan(callAt);
    expect(callAt).toBeLessThan(ghAt);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 5. The evidence-field matrix (plan 33.1-23, Gap A, D-30, brief 33.1-GAP-PLANNING-BRIEF.md DC-1).
//
// Every field of every host answer that feeds a floor row is taken from the strong baselines by
// WALKING the answers (object keys and array indices, root included), never from a typed list. Each
// field is mutated alone: absent (for a root, the fixture entry is removed; for an array element,
// the element is removed), null, a value of another JSON type, and for arrays `[null]`. For every
// mutation the rows the field feeds (LEAVES) read `unknown` (or what one of the two EXCEPTIONS
// declares), every other row of both targets stays `held`, the fed target is not `protected`, and
// the run does not exit 0. An INERT field changes nothing. A removed array element is a different,
// well-formed list rather than an absent field: a list read in full without the element can
// correctly read `failed`, so removal asserts the weaker "not held, target not protected".
//
// The run helper and the stub keys are COPIED from host-protection.test.ts, because that file exports
// nothing (a vitest file is not a module other test files import; install/installer-dry-run.test.ts
// records the same for its own copies). Plan 33.1-24 reuses BASELINES, BODIES, LEAVES and
// runHostCheck in place for its pairs matrix.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const CHECK_JS = join(HERE, "host-protection.js");
const GH_STUB = join(HERE, "fixtures", "gh-stub.mjs");
const STRONG_FIXTURE = join(HERE, "fixtures", "host-strong.fixture.json");

type Fixture = Record<string, unknown>;
const api = (path: string): string => `api --method GET -i ${path}`;
const RULES_MAIN = api("repos/{owner}/{repo}/rules/branches/main?per_page=100");
const RULESET_1 = api("repos/{owner}/{repo}/rulesets/1");
const PROTECTION = (b: string): string => api(`repos/{owner}/{repo}/branches/${b}/protection`);

interface HostJson {
  ok: boolean;
  floor: { branch: string[]; environment: string[] };
  targets: Array<{ kind: string; name: string; verdict: string; facts?: Array<{ id: string; state: string; evidence: string }> }>;
  calls: string[][];
}
interface MatrixRun {
  status: number | null;
  json: HostJson | undefined;
  stdout: string;
}

// Runs the COMMITTED host-protection.js through its --gh-script seam with gh-stub.mjs, in a scratch
// cwd (no factory.config.json, so the environment line names the documented default `production`).
function runHostCheck(fixture: Fixture): MatrixRun {
  const scratch = mkdtempSync(join(tmpdir(), "grugops-floor-matrix-"));
  try {
    const fixturePath = join(scratch, "fixture.json");
    writeFileSync(fixturePath, JSON.stringify(fixture));
    const r = spawnSync("node", [CHECK_JS, "--gh-script", GH_STUB, "--json"], {
      encoding: "utf8",
      cwd: scratch,
      env: { ...process.env, GH_STUB_FIXTURE: fixturePath, GH_STUB_LOG: "" },
    });
    const stdout = r.stdout ?? "";
    const lines = stdout.trim().split("\n");
    const at = lines.findIndex((l) => l.startsWith("HOST-PROTECTION:"));
    let json: HostJson | undefined;
    try {
      json = at < 0 ? undefined : (JSON.parse(lines.slice(at + 1).join("\n")) as HostJson);
    } catch {
      json = undefined;
    }
    return { status: r.status, json, stdout };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

function targetOf(json: HostJson | undefined, kind: string, name: string): HostJson["targets"][number] | undefined {
  return json?.targets.find((t) => t.kind === kind && t.name === name);
}

// Every fact of branch main, by row id. The environment target is fed by no evidence (33.1 D-31 Q4):
// every run asserts it separately with expectEnvironmentByDesign.
function rowStates(json: HostJson | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of targetOf(json, "branch", "main")?.facts ?? []) out.set(f.id, f.state);
  return out;
}

// The environment line of every run (33.1 D-31 Q4): UNKNOWN - verify, one `unknown` fact per row of
// floor.environment with the by-design evidence, and no call to the environments list or the
// protected-branch list. Whatever field a mutation breaks, this line never changes.
function expectEnvironmentByDesign(r: MatrixRun, label: string): void {
  const env = targetOf(r.json, "environment", "production");
  expect(env?.verdict, `${label}: the environment line\n${r.stdout}`).toBe("UNKNOWN - verify");
  expect(env?.facts?.length, `${label}: one fact per production row`).toBe(r.json?.floor.environment.length);
  for (const f of env?.facts ?? []) {
    expect(f.state, `${label}: environment row ${f.id}`).toBe("unknown");
    expect(f.evidence, `${label}: environment row ${f.id}`).toBe("not read by design (33.1 D-31)");
  }
  const asked = (r.json?.calls ?? []).map((c) => c.join(" ")).filter((c) => c.includes("environments") || c.includes("branches?protected="));
  expect(asked, `${label}: calls the check no longer makes`).toEqual([]);
}

// ── The two baselines, both built from the shared strong fixture ────────────────────────────────
function strongFixture(): Fixture {
  return JSON.parse(readFileSync(STRONG_FIXTURE, "utf8")) as Fixture;
}
// A strong classic body with an explicit, empty pull request bypass allowance.
function classicStrongBody(): Record<string, unknown> {
  return {
    enforce_admins: { enabled: true },
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      // The two stale-approval settings (33.1 D-33 (d), plan 33.1-42).
      dismiss_stale_reviews: true,
      require_last_push_approval: true,
      bypass_pull_request_allowances: { users: [], teams: [], apps: [] },
    },
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false },
  };
}
const BASELINES = {
  // The ruleset arm shows every branch row; main's classic arm is 404 `Branch not protected`.
  RULESET_ARM: (): Fixture => ({ ...strongFixture(), [PROTECTION("main")]: { status: 404, body: { message: "Branch not protected" } } }),
  // No ruleset rule; main's strong classic body shows every branch row.
  CLASSIC_ARM: (): Fixture => ({
    ...strongFixture(),
    [RULES_MAIN]: { status: 200, body: [] },
    [PROTECTION("main")]: { status: 200, body: classicStrongBody() },
  }),
} as const;
type BaselineName = keyof typeof BASELINES;

// The evidence bodies and the baseline each is taken from. Six before plan 33.1-41; the environments
// list, the protected-branch list and the listed branch's protection (listedClassic) are no longer
// read (33.1 D-31 Q4), so three are left.
type BodyName = "rules" | "ruleset" | "classic";
const BODIES: Record<BodyName, { baseline: BaselineName; key: string }> = {
  rules: { baseline: "RULESET_ARM", key: RULES_MAIN },
  ruleset: { baseline: "RULESET_ARM", key: RULESET_1 },
  classic: { baseline: "CLASSIC_ARM", key: PROTECTION("main") },
};
const BODY_NAMES = Object.keys(BODIES) as BodyName[];

function bodyOf(name: BodyName): unknown {
  const entry = BASELINES[BODIES[name].baseline]()[BODIES[name].key];
  if (typeof entry !== "object" || entry === null || !("body" in entry)) throw new Error(`baseline has no body for ${name}`);
  return entry.body;
}

// ── The path walk ────────────────────────────────────────────────────────────────────────────────
type Seg = string | number;
const pathText = (segs: readonly Seg[]): string => `$${segs.map((s) => (typeof s === "number" ? `[${s}]` : `.${s}`)).join("")}`;

function walkPaths(v: unknown, segs: Seg[] = [], out: Seg[][] = []): Seg[][] {
  out.push(segs);
  if (Array.isArray(v)) {
    const list: unknown[] = v;
    list.forEach((e, i) => walkPaths(e, [...segs, i], out));
  } else if (typeof v === "object" && v !== null) {
    for (const [k, child] of Object.entries(v)) walkPaths(child, [...segs, k], out);
  }
  return out;
}

function childOf(v: unknown, s: Seg): unknown {
  if (typeof s === "number") return Array.isArray(v) ? (v as unknown[])[s] : undefined;
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>)[s] : undefined;
}

// Every path of every body, keyed `<body>:<path>`.
interface WalkedPath {
  key: string;
  body: BodyName;
  segs: Seg[];
  value: unknown;
}
function walkedPaths(): WalkedPath[] {
  return BODY_NAMES.flatMap((body) => {
    const root = bodyOf(body);
    return walkPaths(root).map((segs) => ({ key: `${body}:${pathText(segs)}`, body, segs, value: segs.reduce(childOf, root) }));
  });
}

// ── The mutations ────────────────────────────────────────────────────────────────────────────────
type Mutation = "absent" | "removed" | "null" | "wrong-type" | "[null]";

function mutationsFor(p: WalkedPath): Mutation[] {
  const last = p.segs[p.segs.length - 1];
  const out: Mutation[] = [typeof last === "number" ? "removed" : "absent", "null", "wrong-type"];
  if (Array.isArray(p.value)) out.push("[null]");
  return out;
}

// A value of another JSON type: string → 7, number → "x", boolean → "x", object → "x", array → {}.
function wrongType(v: unknown): unknown {
  if (typeof v === "string") return 7;
  if (Array.isArray(v)) return {};
  return "x";
}

function replacement(m: Exclude<Mutation, "absent" | "removed">, v: unknown): unknown {
  if (m === "null") return null;
  if (m === "[null]") return [null];
  return wrongType(v);
}

function mutated(p: WalkedPath, m: Mutation): Fixture {
  const fx = BASELINES[BODIES[p.body].baseline]();
  applyMutation(fx, p, m);
  return fx;
}

// Applies one mutation to `fx` in place. The pairs matrix (plan 33.1-24, section 6) applies two to
// one fixture through this same function, so a pair uses exactly the single-field mutations.
function applyMutation(fx: Fixture, p: WalkedPath, m: Mutation): void {
  const key = BODIES[p.body].key;
  if (p.segs.length === 0) {
    if (m === "absent") {
      delete fx[key];
      return;
    }
    if (m === "removed") throw new Error("a root is never an array element");
    fx[key] = { ...(fx[key] as Record<string, unknown>), body: replacement(m, p.value) };
    return;
  }
  const entry = structuredClone(fx[key]) as Record<string, unknown>;
  fx[key] = entry;
  const parent = p.segs.slice(0, -1).reduce(childOf, entry.body);
  const last = p.segs[p.segs.length - 1];
  if (typeof last === "number") {
    const list = parent as unknown[];
    if (m === "removed") list.splice(last, 1);
    else if (m === "absent") throw new Error("an array element is removed, not made absent");
    else list[last] = replacement(m, p.value);
  } else {
    const obj = parent as Record<string, unknown>;
    if (m === "absent") delete obj[last];
    else if (m === "removed") throw new Error("an object key is made absent, not removed");
    else obj[last] = replacement(m, p.value);
  }
}

// ── The rows ─────────────────────────────────────────────────────────────────────────────────────
// The rows evidence fields feed: the branch floor only. The five ENVIRONMENT_FLOOR rows are fed by no
// host field since plan 33.1-41 (33.1 D-31 Q4).
// In table order. Plan 33.1-42 (33.1 D-33 (d)) added stale_dismissal and last_push_approval after
// approving_review: five rows before, seven after.
const BRANCH_ROWS = [
  "pull_request",
  "approving_review",
  "stale_dismissal",
  "last_push_approval",
  "no_force_push",
  "no_deletion",
  "no_bypass",
] as const;
type RowId = (typeof BRANCH_ROWS)[number];
const ALL: readonly RowId[] = BRANCH_ROWS;
// The review items (`reviewItem: true`): everything a pull_request rule or classic
// required_pull_request_reviews shows, and the bypass allowance binds. Three rows before plan
// 33.1-42 (pull_request, approving_review, no_bypass), five after.
const REVIEW: readonly RowId[] = ["pull_request", "approving_review", "stale_dismissal", "last_push_approval", "no_bypass"];
// A pull_request rule's `parameters` object feeds every row read from a parameter.
const PARAMS: readonly RowId[] = ["approving_review", "stale_dismissal", "last_push_approval", "no_bypass"];
const APPROVAL: readonly RowId[] = ["approving_review", "no_bypass"];
const STALE: readonly RowId[] = ["stale_dismissal", "no_bypass"];
const LAST_PUSH: readonly RowId[] = ["last_push_approval", "no_bypass"];
const NFF: readonly RowId[] = ["no_force_push", "no_bypass"];
const DEL: readonly RowId[] = ["no_deletion", "no_bypass"];

// LEAVES: `<body>:<path>` → the rows the field feeds. An empty list marks an INERT field (and must
// have its INERT reason below). Follows plan 33.1-22's ACCEPT entries and the union rule; the
// corrections to the plan's mapping are recorded in 33.1-23-SUMMARY.md.
const LEAVES: Readonly<Record<string, readonly RowId[]>> = {
  "rules:$": ALL,
  // A whole rule entry nulled or garbled names no ruleset and no source, so since plan 33.1-24 it
  // is asked by the source agreement of every ruleset it may belong to (every branch row). Removing
  // the element is a shorter, well-formed list and still fails only its own rows.
  "rules:$[0]": ALL,
  "rules:$[0].type": REVIEW,
  "rules:$[0].parameters": PARAMS,
  "rules:$[0].parameters.required_approving_review_count": APPROVAL,
  // The two stale-approval settings (plan 33.1-42, 33.1 D-33 (d)), read through ACCEPT.enabledFlag.
  "rules:$[0].parameters.dismiss_stale_reviews_on_push": STALE,
  "rules:$[0].parameters.require_last_push_approval": LAST_PUSH,
  // Read since red-team case P of plan 33.1-22: every rule of a ruleset must name the source the
  // ruleset's own body names, or the ruleset binds nothing on this branch (every branch row).
  "rules:$[0].ruleset_source_type": ALL,
  "rules:$[0].ruleset_source": ALL,
  "rules:$[0].ruleset_id": REVIEW,
  "rules:$[1]": ALL,
  "rules:$[1].type": NFF,
  "rules:$[1].ruleset_source_type": ALL,
  "rules:$[1].ruleset_source": ALL,
  "rules:$[1].ruleset_id": NFF,
  "rules:$[2]": ALL,
  "rules:$[2].type": DEL,
  "rules:$[2].ruleset_source_type": ALL,
  "rules:$[2].ruleset_source": ALL,
  "rules:$[2].ruleset_id": DEL,
  "ruleset:$": ALL,
  "ruleset:$.id": ALL,
  // enforcement, target, source and source_type: read since plan 33.1-22's red-team round.
  "ruleset:$.target": ALL,
  "ruleset:$.enforcement": ALL,
  "ruleset:$.source": ALL,
  "ruleset:$.source_type": ALL,
  "ruleset:$.current_user_can_bypass": ALL,
  "classic:$": ALL,
  "classic:$.enforce_admins": ALL,
  "classic:$.enforce_admins.enabled": ALL,
  "classic:$.required_pull_request_reviews": REVIEW,
  "classic:$.required_pull_request_reviews.required_approving_review_count": APPROVAL,
  "classic:$.required_pull_request_reviews.dismiss_stale_reviews": STALE,
  "classic:$.required_pull_request_reviews.require_last_push_approval": LAST_PUSH,
  "classic:$.required_pull_request_reviews.bypass_pull_request_allowances": REVIEW,
  "classic:$.required_pull_request_reviews.bypass_pull_request_allowances.users": REVIEW,
  "classic:$.required_pull_request_reviews.bypass_pull_request_allowances.teams": REVIEW,
  "classic:$.required_pull_request_reviews.bypass_pull_request_allowances.apps": REVIEW,
  "classic:$.allow_force_pushes": NFF,
  "classic:$.allow_force_pushes.enabled": NFF,
  "classic:$.allow_deletions": DEL,
  "classic:$.allow_deletions.enabled": DEL,
};

// INERT: a closed set, one reason each, equal to the LEAVES entries with no row. Empty since plan
// 33.1-41: the eleven inert fields were the reviewer's login (environments) and ten fields of the
// listed branch's protection (listedClassic), and the check no longer reads either body (33.1 D-31
// Q4). Every field of the three bodies still read feeds a branch row.
const INERT: Readonly<Record<string, string>> = {};

// EXCEPTIONS: a closed set of exactly one (two before plan 33.1-41, which removed
// ACCEPT.deploymentBranchPolicy with the environment reading), an ACCEPT entry with a written
// absentFailedWhy. `<body>:<path>|<mutation>` → the state each fed row reads instead of `unknown`.
const EXCEPTIONS: Readonly<Record<string, { rows: Readonly<Partial<Record<RowId, string>>>; why: string }>> = {
  "classic:$.required_pull_request_reviews|absent": {
    // stale_dismissal and last_push_approval added by plan 33.1-42: they read the same object first.
    rows: { pull_request: "failed", approving_review: "failed", stale_dismissal: "failed", last_push_approval: "failed", no_bypass: "unknown" },
    why: "ACCEPT.classicReviews reads an absent key as failed (absentFailedWhy: observed, not documented; failed is fail-safe)",
  },
};

// ABSENT_NEUTRAL: an evidence field whose ABSENCE the check reads as neutral by design, with the
// reason: removing the key leaves the branch protected, while null and a value of another type still
// make every row it feeds unknown. Empty since plan 33.1-41: its one entry was the environments list's
// total_count, which the check no longer reads (33.1 D-31 Q4).
const ABSENT_NEUTRAL: Readonly<Record<string, string>> = {};

// The pinned field counts. A fixture that gains or loses a field changes a count and stays red until
// someone reads the new field and classifies it in LEAVES.
const FIELDS_PER_BODY: Readonly<Record<BodyName, number>> = {
  // 18 → 20 and 13 → 15 (plan 33.1-42, 33.1 D-33 (d)): the pull_request rule's parameters gain
  // dismiss_stale_reviews_on_push and require_last_push_approval; classic required_pull_request_reviews
  // gains dismiss_stale_reviews and require_last_push_approval. ruleset is unchanged.
  rules: 20,
  ruleset: 7,
  classic: 15,
};
// 60 → 62 and 14 → 12 (red-team finding 1 of plan 33.1-23): listedClassic enforce_admins and
// enforce_admins.enabled moved from INERT to the branch-policy row. 62 → 63 and 12 → 11 (red-team
// B2 of plan 33.1-24): environments total_count is read now, so it moved from INERT to every
// environment row (its absence is neutral, ABSENT_NEUTRAL). No field was made inert.
// 63 → 38 and 11 → 0 (plan 33.1-41, 33.1 D-31 Q4): the environments body (19 fields: 18 evidence,
// 1 inert), the protected-branch list (4 evidence) and listedClassic (13 fields: 3 evidence, 10
// inert) are no longer read, so they are no longer walked: 63 - 18 - 4 - 3 = 38 evidence and
// 11 - 1 - 10 = 0 inert. The three bodies still read (rules 18, ruleset 7, classic 13) are unchanged,
// every one of their 38 fields feeds a branch row, and no field was made inert.
// 38 → 42 (plan 33.1-42, 33.1 D-33 (d)): the four stale-approval settings, two on each arm, are
// evidence fields (each feeds its own row and the qualifier). INERT stays 0.
const EVIDENCE_FIELD_COUNT = 42;
const INERT_FIELD_COUNT = 0;

const WALKED = walkedPaths();

describe("evidence-field matrix (Gap A, D-30, derived)", () => {
  it("both baselines read branch main protected, exit 0, from the arm each claims; the environment line is the by-design line", () => {
    const ruleset = runHostCheck(BASELINES.RULESET_ARM());
    const classic = runHostCheck(BASELINES.CLASSIC_ARM());
    for (const r of [ruleset, classic]) {
      expect(targetOf(r.json, "branch", "main")?.verdict, r.stdout).toBe("protected");
      expectEnvironmentByDesign(r, "baseline");
      expect(r.status).toBe(0);
    }
    const shownBy = (r: MatrixRun): string => r.stdout.split("\n").find((l) => l.startsWith("branch main:")) ?? "";
    expect(shownBy(ruleset)).toContain("(ruleset)");
    expect(shownBy(classic)).toContain("(classic protection)");
  });

  it("the walked field set equals LEAVES, both ways, and the counts are the pinned ones", () => {
    const walked = WALKED.map((p) => p.key);
    const perBody = Object.fromEntries(BODY_NAMES.map((b) => [b, WALKED.filter((p) => p.body === b).length]));
    const evidence = walked.filter((k) => (LEAVES[k] ?? []).length > 0).length;
    const inert = walked.filter((k) => LEAVES[k] !== undefined && LEAVES[k].length === 0).length;
    console.log(
      `host-protection evidence-field matrix: ${walked.length} fields walked (${BODY_NAMES.map((b) => `${b} ${perBody[b]}`).join(", ")}); ${evidence} evidence, ${inert} inert`,
    );
    expect(new Set(walked).size, "a walked path twice").toBe(walked.length);
    const unclassified = walked.filter((k) => LEAVES[k] === undefined);
    const stale = Object.keys(LEAVES).filter((k) => !walked.includes(k));
    expect(unclassified, `fields the fixtures carry that LEAVES does not classify:\n${unclassified.join("\n")}`).toEqual([]);
    expect(stale, `LEAVES rows no fixture carries:\n${stale.join("\n")}`).toEqual([]);
    expect(perBody).toEqual(FIELDS_PER_BODY);
    expect(evidence).toBe(EVIDENCE_FIELD_COUNT);
    expect(inert).toBe(INERT_FIELD_COUNT);
    expect(walked.length).toBe(EVIDENCE_FIELD_COUNT + INERT_FIELD_COUNT);
  });

  it("INERT is exactly the LEAVES entries with no row, each with a reason; EXCEPTIONS has exactly one entry, with a reason", () => {
    const markedInert = Object.keys(LEAVES).filter((k) => LEAVES[k].length === 0).sort();
    expect(Object.keys(INERT).sort()).toEqual(markedInert);
    for (const [k, why] of Object.entries(INERT)) expect(why.trim().length, `${k}: empty reason`).toBeGreaterThan(0);
    expect(Object.keys(EXCEPTIONS)).toHaveLength(1);
    for (const [k, e] of Object.entries(EXCEPTIONS)) {
      expect(e.why.trim().length, `${k}: empty reason`).toBeGreaterThan(0);
      const [path] = k.split("|");
      for (const row of Object.keys(e.rows)) expect(LEAVES[path], `${k} names a row its field does not feed`).toContain(row);
    }
  });

  it("ABSENT_NEUTRAL is empty since plan 33.1-41 (its one field, environments total_count, is no longer read); any entry would be an evidence field with a reason", () => {
    expect(Object.keys(ABSENT_NEUTRAL)).toHaveLength(0);
    for (const [k, why] of Object.entries(ABSENT_NEUTRAL)) {
      expect(why.trim().length, `${k}: empty reason`).toBeGreaterThan(0);
      expect((LEAVES[k] ?? []).length, `${k} feeds no row`).toBeGreaterThan(0);
      const p = WALKED.find((w) => w.key === k);
      expect(p, `${k} is not walked`).toBeDefined();
      expect(typeof p!.segs[p!.segs.length - 1], `${k} is an array element`).toBe("string");
    }
  });

  it("the rows fed by evidence fields are exactly the branch fact ids of a baseline run (floor.branch); floor.environment is fed by none", () => {
    const r = runHostCheck(BASELINES.RULESET_ARM());
    const factIds = [...rowStates(r.json).keys()].sort();
    const fed = [...new Set(Object.values(LEAVES).flat())].sort();
    expect(fed).toEqual(factIds);
    expect(fed.length).toBe(r.json?.floor.branch.length ?? 0);
    expect(new Set(factIds).size, "a row id twice").toBe(factIds.length);
    const envIds = (targetOf(r.json, "environment", "production")?.facts ?? []).map((f) => f.id);
    expect(envIds.length).toBe(r.json?.floor.environment.length);
    expect(envIds.filter((id) => (fed as string[]).includes(id)), "an environment row fed by a host field").toEqual([]);
  });

  for (const p of WALKED) {
    const rows = LEAVES[p.key] ?? [];
    const inert = rows.length === 0;
    it(`${p.key} → ${inert ? "inert: both targets stay protected" : `feeds ${rows.join(", ")}`}`, { timeout: 30_000 }, () => {
      expect(LEAVES[p.key], `${p.key} is not classified in LEAVES`).toBeDefined();
      for (const m of mutationsFor(p)) {
        const r = runHostCheck(mutated(p, m));
        const states = rowStates(r.json);
        const label = `${p.key} ${m}`;
        expect(states.size, `${label}: every branch row reported\n${r.stdout}`).toBe(BRANCH_ROWS.length);
        expectEnvironmentByDesign(r, label);
        if (inert || (m === "absent" && ABSENT_NEUTRAL[p.key] !== undefined)) {
          expect(targetOf(r.json, "branch", "main")?.verdict, label).toBe("protected");
          expect(r.status, label).toBe(0);
          continue;
        }
        const exception = EXCEPTIONS[`${p.key}|${m}`];
        for (const [id, state] of states) {
          const fed = rows.includes(id as RowId);
          if (!fed) expect(state, `${label}: row ${id} is not fed and must stay held`).toBe("held");
          else if (m !== "removed") expect(state, `${label}: row ${id}`).toBe(exception?.rows[id as RowId] ?? "unknown");
        }
        // A removed element leaves a shorter, well-formed list: some fed row must stop being held
        // (the one the element showed), but a row the rest of the list still shows may stay held
        // (removing the only reviewer fails the reviewer row, while prevent_self_review stays read).
        if (m === "removed") {
          const stillHeld = rows.filter((id) => states.get(id) === "held");
          expect(stillHeld.length, `${label}: every fed row still held (${stillHeld.join(", ")})`).toBeLessThan(rows.length);
        }
        expect(targetOf(r.json, "branch", "main")?.verdict, label).not.toBe("protected");
        expect(r.status, label).not.toBe(0);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 6. Evidence-field pairs (plan 33.1-24, Gap A, D-30, brief 33.1-GAP-PLANNING-BRIEF.md DC-1 §2.1:
//    "one at a time and in pairs, including cross-row cases").
//
// Two broken fields together can form a shape that looks legitimate where each alone does not (an
// empty deployment_branch_policy object is the example: either key alone left present still reads
// unknown). Section 5 covers every field alone; this section breaks two at once, reusing section
// 5's baselines, walk, LEAVES, applyMutation and runHostCheck in place, so the pair universe is the
// same field universe.
//
// SIBLING_PAIRS: every unordered pair of evidence (non-inert) walked paths with the same parent
// (same body, same parent path; the elements of one array are siblings), each pair in the baseline
// its body is taken from, under the four combinations of {absent, wrong type}. "Absent" is section
// 5's: a key is deleted, an array element is removed. "Wrong type" is section 5's wrongType().
//
// The class rule asserted for every pair: every row either field feeds is not `held` (a pair may
// mix an EXCEPTIONS path with another, so `unknown` versus `failed` is not asserted), every row fed
// by neither stays `held`, a target either field feeds is not `protected`, and the run does not
// exit 0. A pair that breaks this is a DC-1 defect in the check, fixed in host-protection.ts
// through readFact / ACCEPT, never by dropping the pair or marking a path inert.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

type PairMutation = "absent" | "wrong-type";
interface PairMember {
  path: WalkedPath;
  m: PairMutation;
}

const EVIDENCE_PATHS: readonly WalkedPath[] = WALKED.filter((p) => (LEAVES[p.key] ?? []).length > 0);
const lastSeg = (p: WalkedPath): Seg | undefined => p.segs[p.segs.length - 1];
const parentKey = (p: WalkedPath): string | undefined => (p.segs.length === 0 ? undefined : `${p.body}:${pathText(p.segs.slice(0, -1))}`);

// Section 5's mutation for "absent": an array element is removed, a key is deleted.
const asMutation = (x: PairMember): Mutation => (x.m === "wrong-type" ? "wrong-type" : typeof lastSeg(x.path) === "number" ? "removed" : "absent");

// Both members' mutations applied to one fixture of their shared baseline. Deeper paths go first,
// and within one array the higher index first, so removing one member never moves the other.
function mutatedPair(members: readonly PairMember[]): Fixture {
  const baselines = new Set(members.map((x) => BODIES[x.path.body].baseline));
  if (baselines.size !== 1) throw new Error(`a pair spans two baselines: ${members.map((x) => x.path.key).join(" + ")}`);
  const fx = BASELINES[[...baselines][0]]();
  const index = (x: PairMember): number => {
    const s = lastSeg(x.path);
    return typeof s === "number" ? s : -1;
  };
  const order = [...members].sort((a, b) => b.path.segs.length - a.path.segs.length || index(b) - index(a));
  for (const x of order) applyMutation(fx, x.path, asMutation(x));
  return fx;
}

const pairLabel = (members: readonly PairMember[]): string => members.map((x) => `${x.path.key} ${asMutation(x)}`).join(" + ");

// The class rule for one pair run.
function expectPairClassRule(members: readonly PairMember[], r: MatrixRun): void {
  const label = pairLabel(members);
  const states = rowStates(r.json);
  expect(states.size, `${label}: every branch row reported\n${r.stdout}`).toBe(BRANCH_ROWS.length);
  expectEnvironmentByDesign(r, label);
  const fed = new Set<string>(members.flatMap((x) => LEAVES[x.path.key]));
  // A member changed in place (a key deleted, a value of another type) makes every row it feeds
  // not held. A REMOVED array element leaves a shorter, well-formed list, as in section 5: some row
  // it feeds must stop being held, but a row the rest of the list still shows may stay held.
  const mustNotHold = new Set<string>(members.filter((x) => asMutation(x) !== "removed").flatMap((x) => LEAVES[x.path.key]));
  for (const [id, state] of states) {
    if (mustNotHold.has(id)) expect(state, `${label}: row ${id} is fed and must not be held\n${r.stdout}`).not.toBe("held");
    else if (!fed.has(id)) expect(state, `${label}: row ${id} is not fed and must stay held\n${r.stdout}`).toBe("held");
  }
  for (const x of members.filter((m) => asMutation(m) === "removed")) {
    const stillHeld = LEAVES[x.path.key].filter((id) => states.get(id) === "held");
    expect(stillHeld.length, `${label}: every row ${x.path.key} feeds is still held (${stillHeld.join(", ")})\n${r.stdout}`).toBeLessThan(
      LEAVES[x.path.key].length,
    );
  }
  expect(fed.size, `${label}: the pair feeds a row`).toBeGreaterThan(0);
  expect(targetOf(r.json, "branch", "main")?.verdict, label).not.toBe("protected");
  expect(r.status, label).not.toBe(0);
}

const PAIR_COMBOS: ReadonlyArray<readonly [PairMutation, PairMutation]> = [
  ["absent", "absent"],
  ["absent", "wrong-type"],
  ["wrong-type", "absent"],
  ["wrong-type", "wrong-type"],
];

function siblingPairs(): Array<readonly [WalkedPath, WalkedPath]> {
  const out: Array<readonly [WalkedPath, WalkedPath]> = [];
  EVIDENCE_PATHS.forEach((a, i) => {
    for (const b of EVIDENCE_PATHS.slice(i + 1)) {
      const pa = parentKey(a);
      if (pa !== undefined && pa === parentKey(b)) out.push([a, b]);
    }
  });
  return out;
}
const SIBLING_PAIRS = siblingPairs();
// Pinned from the first green run (plan 33.1-24): the fixture's real sibling evidence fields. The
// pairs by parent are rules $ 3, rules $[0] 10, rules $[1] 6, rules $[2] 6, ruleset $ 15, classic $
// 6, classic reviews 1, classic bypass allowances 3, environment $[0] 6, its deployment branch
// policy 1, its reviewer rule 3, the reviewer entry 1, and the protected-branch list element 1.
// 62 → 63 (red-team B2 of plan 33.1-24): environments total_count is an evidence field now, so it
// pairs with its sibling environments $.environments (environments $ 1).
// 63 → 50 (plan 33.1-41, 33.1 D-31 Q4): the environments body (environment $[0] 6, its deployment
// branch policy 1, its reviewer rule 3, the reviewer entry 1, environments $ 1) and the
// protected-branch list element (1) are no longer read: 63 - 13 = 50. The pairs of the three bodies
// still read (rules 3 + 10 + 6 + 6, ruleset 15, classic 6 + 1 + 3) are unchanged.
// 50 → 58 (plan 33.1-42, 33.1 D-33 (d)): the pull_request rule's parameters go from 1 evidence field
// to 3, so 0 → C(3, 2) = 3 pairs (rules $[0].parameters 3); classic required_pull_request_reviews
// goes from 2 evidence children (the count, the allowance) to 4, so 1 → C(4, 2) = 6 pairs. 50 + 3 + 5.
const SIBLING_PAIR_COUNT = 58;

// ── Cross-row and cross-target pairs (plan 33.1-24 Task 2) ──────────────────────────────────────
// The row ids come from baseline runs' facts, never from a typed list.
const CLASSIC_RUN = runHostCheck(BASELINES.CLASSIC_ARM());
const RULESET_RUN = runHostCheck(BASELINES.RULESET_ARM());
const ROW_IDS: readonly string[] = [...rowStates(CLASSIC_RUN.json).keys()];
const BRANCH_IDS: readonly string[] = (targetOf(RULESET_RUN.json, "branch", "main")?.facts ?? []).map((f) => f.id);

// A row's REPRESENTATIVE: among the evidence paths of the given bodies that feed the row, the one
// that feeds the fewest rows, then the deepest, then the first in walk order (the sort is stable).
// The plan's literal rule ("the first evidence path in walk order") picks each body's ROOT, which
// feeds every row of its target, so the 45 row pairs would collapse into three fixtures (classic
// root absent, environments root absent, both). The most specific field keeps each pair about the
// two rows it names; the choice is recorded in 33.1-24-SUMMARY.md.
const feedsOf = (p: WalkedPath): readonly string[] => LEAVES[p.key] ?? [];
function representative(row: string, bodies: readonly BodyName[]): WalkedPath | undefined {
  const candidates = EVIDENCE_PATHS.filter((p) => bodies.includes(p.body) && feedsOf(p).includes(row));
  return [...candidates].sort((a, b) => feedsOf(a).length - feedsOf(b).length || b.segs.length - a.segs.length)[0];
}
const CLASSIC_BODIES: readonly BodyName[] = BODY_NAMES.filter((b) => BODIES[b].baseline === "CLASSIC_ARM");
const RULESET_RULE_BODIES: readonly BodyName[] = ["rules", "ruleset"];

interface RowPair {
  rows: readonly [string, string];
  paths: readonly [WalkedPath | undefined, WalkedPath | undefined];
}
function rowPairs(): RowPair[] {
  const out: RowPair[] = [];
  ROW_IDS.forEach((a, i) => {
    for (const b of ROW_IDS.slice(i + 1)) out.push({ rows: [a, b], paths: [representative(a, CLASSIC_BODIES), representative(b, CLASSIC_BODIES)] });
  });
  return out;
}
const ROW_PAIRS = rowPairs();
// C(10, 2) = 45 before plan 33.1-41 (floor.branch plus floor.environment). C(5, 2) = 10 after: the
// five ENVIRONMENT_FLOOR rows are fed by no host field (33.1 D-31 Q4), so only the five branch rows
// of the CLASSIC_ARM run pair.
// C(5, 2) = 10 → C(7, 2) = 21 (plan 33.1-42, 33.1 D-33 (d)): the two stale-approval rows join the
// branch rows of the CLASSIC_ARM run.
const ROW_PAIR_COUNT = 21;

// The other target's evidence: every walked path that feeds a row of no branch. Before plan 33.1-41
// these were the protected-branch list's evidence paths and the listed branch's classic root (the
// environment's branch-policy evidence), five in all. Derived now from LEAVES, never typed: the
// environment is fed by no host field (33.1 D-31 Q4), so the set is empty.
const PROTECTED_BRANCH_PATHS: readonly WalkedPath[] = WALKED.filter((p) => feedsOf(p).some((id) => !(BRANCH_ROWS as readonly string[]).includes(id)));
interface CrossPair {
  row: string;
  branchPath: WalkedPath | undefined;
  policyPath: WalkedPath;
}
const CROSS_TARGET_PAIRS: readonly CrossPair[] = BRANCH_IDS.flatMap((row) =>
  PROTECTED_BRANCH_PATHS.map((policyPath) => ({ row, branchPath: representative(row, RULESET_RULE_BODIES), policyPath })),
);
// 5 branch rows × (4 protected-branch-list evidence paths + the listed branch's classic root) = 25
// before plan 33.1-41. 5 × 0 = 0 after: the environment target reads no host field. What the
// cross-target pairs held (a broken branch never lifts the other target) is now asserted in every
// run of sections 5 and 6 by expectEnvironmentByDesign.
const CROSS_TARGET_PAIR_COUNT = 0;

// Both members absent; a representative two rows share is one member.
function absentMembers(paths: ReadonlyArray<WalkedPath | undefined>): PairMember[] {
  const out: PairMember[] = [];
  for (const p of paths) {
    if (p === undefined) throw new Error("a row has no representative evidence path");
    if (!out.some((x) => x.path.key === p.key)) out.push({ path: p, m: "absent" });
  }
  return out;
}

describe("evidence-field pairs (DC-1, plan 33.1-24)", () => {
  it("SIBLING_PAIRS is derived from the walk, holds no inert path, and has the pinned count", () => {
    const byParent = countBy(SIBLING_PAIRS.map(([a]) => parentKey(a) ?? ""));
    console.log(
      `host-protection evidence-field pairs: ${SIBLING_PAIRS.length} sibling pairs (${[...byParent].map(([k, n]) => `${k} ${n}`).join(", ")})\n` +
        SIBLING_PAIRS.map(([a, b]) => `  ${a.key} + ${b.key}`).join("\n"),
    );
    for (const [a, b] of SIBLING_PAIRS) {
      expect(INERT[a.key], `${a.key} is inert`).toBeUndefined();
      expect(INERT[b.key], `${b.key} is inert`).toBeUndefined();
      expect(a.body).toBe(b.body);
    }
    expect(new Set(SIBLING_PAIRS.map(([a, b]) => `${a.key}|${b.key}`)).size, "a pair twice").toBe(SIBLING_PAIRS.length);
    expect(SIBLING_PAIRS.length).toBe(SIBLING_PAIR_COUNT);
  });

  for (const [a, b] of SIBLING_PAIRS) {
    it(`sibling pair ${a.key} + ${b.key}`, { timeout: 30_000 }, () => {
      for (const [ma, mb] of PAIR_COMBOS) {
        const members = [
          { path: a, m: ma },
          { path: b, m: mb },
        ];
        expectPairClassRule(members, runHostCheck(mutatedPair(members)));
      }
    });
  }

  it("ROW_PAIRS is C(n, 2) over the CLASSIC_ARM run's fact ids, every row has a CLASSIC_ARM representative, and the count is pinned", () => {
    console.log(
      `host-protection row pairs: ${ROW_PAIRS.length} (rows: ${ROW_IDS.join(", ")})\n` +
        ROW_IDS.map((id) => `  ${id} ← ${representative(id, CLASSIC_BODIES)?.key ?? "(none)"}`).join("\n"),
    );
    const n = ROW_IDS.length;
    expect(n).toBe(BRANCH_ROWS.length);
    expect(new Set(ROW_IDS).size).toBe(n);
    expect(ROW_PAIRS.length).toBe((n * (n - 1)) / 2);
    expect(ROW_PAIRS.length).toBe(ROW_PAIR_COUNT);
    for (const id of ROW_IDS) {
      const rep = representative(id, CLASSIC_BODIES);
      expect(rep, `${id} has no representative`).toBeDefined();
      expect(BODIES[rep!.body].baseline, id).toBe("CLASSIC_ARM");
      expect(feedsOf(rep!), id).toContain(id);
    }
  });

  for (const { rows, paths } of ROW_PAIRS) {
    it(`row pair ${rows[0]} + ${rows[1]} (${paths[0]?.key} + ${paths[1]?.key})`, { timeout: 30_000 }, () => {
      const members = absentMembers(paths);
      expectPairClassRule(members, runHostCheck(mutatedPair(members)));
    });
  }

  it("CROSS_TARGET_PAIRS is (branch rows) × (paths feeding the other target) from the RULESET_ARM run, and the count is pinned (0 since 33.1 D-31 Q4)", () => {
    console.log(
      `host-protection cross-target pairs: ${CROSS_TARGET_PAIRS.length} (${BRANCH_IDS.length} branch rows × ${PROTECTED_BRANCH_PATHS.length} protected-branch evidence paths: ${PROTECTED_BRANCH_PATHS.map((p) => p.key).join(", ")})\n` +
        BRANCH_IDS.map((id) => `  ${id} ← ${representative(id, RULESET_RULE_BODIES)?.key ?? "(none)"}`).join("\n"),
    );
    expect(BRANCH_IDS).toEqual([...BRANCH_ROWS]);
    expect(PROTECTED_BRANCH_PATHS.map((p) => p.key), "a walked path feeds the environment target").toEqual([]);
    for (const id of BRANCH_IDS) {
      const rep = representative(id, RULESET_RULE_BODIES);
      expect(rep, `${id} has no representative`).toBeDefined();
      expect(BODIES[rep!.body].baseline, id).toBe("RULESET_ARM");
    }
    expect(CROSS_TARGET_PAIRS.length).toBe(BRANCH_IDS.length * PROTECTED_BRANCH_PATHS.length);
    expect(CROSS_TARGET_PAIRS.length).toBe(CROSS_TARGET_PAIR_COUNT);
  });

  for (const { row, branchPath, policyPath } of CROSS_TARGET_PAIRS) {
    it(`cross-target pair ${row} (${branchPath?.key}) + ${policyPath.key}`, { timeout: 30_000 }, () => {
      const members = absentMembers([branchPath, policyPath]);
      const r = runHostCheck(mutatedPair(members));
      const label = pairLabel(members);
      expect(targetOf(r.json, "branch", "main")?.verdict, `${label}\n${r.stdout}`).not.toBe("protected");
      expectPairClassRule(members, r);
    });
  }
});

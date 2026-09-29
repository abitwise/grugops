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
  {
    key: "ENVIRONMENT_FLOOR[required_reviewer].read:failed",
    count: 1,
    why: "every readable required_reviewers rule names no reviewer; passed through downgrade(), so a garbage entry makes it unknown",
  },
  {
    key: "ENVIRONMENT_FLOOR[no_self_review].read:failed",
    count: 1,
    why: "there is no required_reviewers rule at all; passed through downgrade(), so a garbage entry makes it unknown",
  },
  { key: "branchVerdict:protected", count: 1, why: "the one branch verdict: every BRANCH_FLOOR row is held" },
  { key: "branchVerdict:unprotected", count: 1, why: "the one branch verdict: some row is failed" },
  { key: "environmentVerdict:protected", count: 1, why: "the one environment verdict: every ENVIRONMENT_FLOOR row is held" },
  { key: "environmentVerdict:unprotected", count: 1, why: "the one environment verdict: some row is failed" },
];

// The only scopes that may produce "held" or "binds", and "protected" (the plan's stated sets). A
// row outside these for those literals is refused even if someone pins it.
const HELD_BINDS_SCOPES = new Set(["readFact", "toBinding", "bindSources", "combineArms", "qualifierFact"]);
const PROTECTED_SCOPES = new Set(["branchVerdict", "environmentVerdict"]);

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
  {
    key: "ACCEPT.deploymentBranchPolicy.held:property",
    count: 2,
    cls: "reader",
    why: "protected_branches === true and custom_branch_policies === false",
  },
  {
    key: "ACCEPT.protectedBranchList.held:property",
    count: 3,
    cls: "reader",
    why: "the one listed element: protected === true, and a string name that usableBranch accepts (plan 33.1-23)",
  },
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
    why: "parses the user's factory.config.json `environments` list (not a host answer); plan 33.1-25 bounds this read",
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
      if (literal === "protected" || literal === "unprotected") expect(PROTECTED_SCOPES.has(scope), `${row.key}: a verdict outside the two verdict functions`).toBe(true);
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
const ENVS = api("repos/{owner}/{repo}/environments?per_page=100");
const PROTECTED_LIST = api("repos/{owner}/{repo}/branches?protected=true&per_page=1");

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
// cwd (no factory.config.json, so the environment name is the documented default `production`).
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

// Every fact of branch main and environment production, by row id.
function rowStates(json: HostJson | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const t of [targetOf(json, "branch", "main"), targetOf(json, "environment", "production")]) {
    for (const f of t?.facts ?? []) out.set(f.id, f.state);
  }
  return out;
}

// ── The two baselines, both built from the shared strong fixture ────────────────────────────────
function strongFixture(): Fixture {
  return JSON.parse(readFileSync(STRONG_FIXTURE, "utf8")) as Fixture;
}
// A strong classic body with an explicit, empty pull request bypass allowance.
function classicStrongBody(): Record<string, unknown> {
  return {
    enforce_admins: { enabled: true },
    required_pull_request_reviews: { required_approving_review_count: 1, bypass_pull_request_allowances: { users: [], teams: [], apps: [] } },
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false },
  };
}
const BASELINES = {
  // The ruleset arm shows every branch row; main's classic arm is 404 `Branch not protected`; the
  // environment's branch-policy evidence comes from the protected-branch list and hotfix's body.
  RULESET_ARM: (): Fixture => ({ ...strongFixture(), [PROTECTION("main")]: { status: 404, body: { message: "Branch not protected" } } }),
  // No ruleset rule; main's strong classic body shows every branch row and is the environment's
  // branch-policy evidence.
  CLASSIC_ARM: (): Fixture => ({
    ...strongFixture(),
    [RULES_MAIN]: { status: 200, body: [] },
    [PROTECTION("main")]: { status: 200, body: classicStrongBody() },
  }),
} as const;
type BaselineName = keyof typeof BASELINES;

// The six evidence bodies and the baseline each is taken from.
type BodyName = "rules" | "ruleset" | "classic" | "environments" | "protectedList" | "listedClassic";
const BODIES: Record<BodyName, { baseline: BaselineName; key: string }> = {
  rules: { baseline: "RULESET_ARM", key: RULES_MAIN },
  ruleset: { baseline: "RULESET_ARM", key: RULESET_1 },
  classic: { baseline: "CLASSIC_ARM", key: PROTECTION("main") },
  environments: { baseline: "CLASSIC_ARM", key: ENVS },
  protectedList: { baseline: "RULESET_ARM", key: PROTECTED_LIST },
  listedClassic: { baseline: "RULESET_ARM", key: PROTECTION("hotfix") },
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
  const key = BODIES[p.body].key;
  if (p.segs.length === 0) {
    if (m === "absent") {
      delete fx[key];
      return fx;
    }
    if (m === "removed") throw new Error("a root is never an array element");
    fx[key] = { ...(fx[key] as Record<string, unknown>), body: replacement(m, p.value) };
    return fx;
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
  return fx;
}

// ── The rows ─────────────────────────────────────────────────────────────────────────────────────
const BRANCH_ROWS = ["pull_request", "approving_review", "no_force_push", "no_deletion", "no_bypass"] as const;
const ENV_ROWS = ["environment_exists", "required_reviewer", "no_self_review", "no_admin_bypass", "branch_policy"] as const;
type RowId = (typeof BRANCH_ROWS)[number] | (typeof ENV_ROWS)[number];
const B5: readonly RowId[] = BRANCH_ROWS;
const E5: readonly RowId[] = ENV_ROWS;
const PR: readonly RowId[] = ["pull_request", "approving_review", "no_bypass"];
const APPROVAL: readonly RowId[] = ["approving_review", "no_bypass"];
const NFF: readonly RowId[] = ["no_force_push", "no_bypass"];
const DEL: readonly RowId[] = ["no_deletion", "no_bypass"];
const REVIEWER: readonly RowId[] = ["required_reviewer", "no_self_review"];
const POLICY: readonly RowId[] = ["branch_policy"];
const INERT_ROWS: readonly RowId[] = [];
const isBranchRow = (id: RowId): boolean => (BRANCH_ROWS as readonly string[]).includes(id);

// LEAVES: `<body>:<path>` → the rows the field feeds. An empty list marks an INERT field (and must
// have its INERT reason below). Follows plan 33.1-22's ACCEPT entries and the union rule; the
// corrections to the plan's mapping are recorded in 33.1-23-SUMMARY.md.
const LEAVES: Readonly<Record<string, readonly RowId[]>> = {
  "rules:$": B5,
  "rules:$[0]": PR,
  "rules:$[0].type": PR,
  "rules:$[0].parameters": APPROVAL,
  "rules:$[0].parameters.required_approving_review_count": APPROVAL,
  // Read since red-team case P of plan 33.1-22: every rule of a ruleset must name the source the
  // ruleset's own body names, or the ruleset binds nothing on this branch (every branch row).
  "rules:$[0].ruleset_source_type": B5,
  "rules:$[0].ruleset_source": B5,
  "rules:$[0].ruleset_id": PR,
  "rules:$[1]": NFF,
  "rules:$[1].type": NFF,
  "rules:$[1].ruleset_source_type": B5,
  "rules:$[1].ruleset_source": B5,
  "rules:$[1].ruleset_id": NFF,
  "rules:$[2]": DEL,
  "rules:$[2].type": DEL,
  "rules:$[2].ruleset_source_type": B5,
  "rules:$[2].ruleset_source": B5,
  "rules:$[2].ruleset_id": DEL,
  "ruleset:$": B5,
  "ruleset:$.id": B5,
  // enforcement, target, source and source_type: read since plan 33.1-22's red-team round.
  "ruleset:$.target": B5,
  "ruleset:$.enforcement": B5,
  "ruleset:$.source": B5,
  "ruleset:$.source_type": B5,
  "ruleset:$.current_user_can_bypass": B5,
  "classic:$": B5,
  "classic:$.enforce_admins": B5,
  "classic:$.enforce_admins.enabled": B5,
  "classic:$.required_pull_request_reviews": PR,
  "classic:$.required_pull_request_reviews.required_approving_review_count": APPROVAL,
  "classic:$.required_pull_request_reviews.bypass_pull_request_allowances": PR,
  "classic:$.required_pull_request_reviews.bypass_pull_request_allowances.users": PR,
  "classic:$.required_pull_request_reviews.bypass_pull_request_allowances.teams": PR,
  "classic:$.required_pull_request_reviews.bypass_pull_request_allowances.apps": PR,
  "classic:$.allow_force_pushes": NFF,
  "classic:$.allow_force_pushes.enabled": NFF,
  "classic:$.allow_deletions": DEL,
  "classic:$.allow_deletions.enabled": DEL,
  "environments:$": E5,
  "environments:$.total_count": INERT_ROWS,
  "environments:$.environments": E5,
  "environments:$.environments[0]": E5,
  "environments:$.environments[0].name": E5,
  "environments:$.environments[0].can_admins_bypass": ["no_admin_bypass"],
  "environments:$.environments[0].deployment_branch_policy": POLICY,
  "environments:$.environments[0].deployment_branch_policy.protected_branches": POLICY,
  "environments:$.environments[0].deployment_branch_policy.custom_branch_policies": POLICY,
  "environments:$.environments[0].protection_rules": REVIEWER,
  "environments:$.environments[0].protection_rules[0]": REVIEWER,
  "environments:$.environments[0].protection_rules[0].type": REVIEWER,
  "environments:$.environments[0].protection_rules[0].prevent_self_review": ["no_self_review"],
  // WR-01 (plan 33.1-22): a rule whose reviewers are not readable leaves the self-review row
  // unreadable too, so every reviewers field feeds both reviewer rows.
  "environments:$.environments[0].protection_rules[0].reviewers": REVIEWER,
  "environments:$.environments[0].protection_rules[0].reviewers[0]": REVIEWER,
  "environments:$.environments[0].protection_rules[0].reviewers[0].type": REVIEWER,
  "environments:$.environments[0].protection_rules[0].reviewers[0].reviewer": REVIEWER,
  "environments:$.environments[0].protection_rules[0].reviewers[0].reviewer.login": INERT_ROWS,
  "environments:$.environments[0].protection_rules[0].reviewers[0].reviewer.id": REVIEWER,
  "protectedList:$": POLICY,
  "protectedList:$[0]": POLICY,
  "protectedList:$[0].name": POLICY,
  "protectedList:$[0].protected": POLICY,
  "listedClassic:$": POLICY,
  "listedClassic:$.enforce_admins": POLICY,
  "listedClassic:$.enforce_admins.enabled": POLICY,
  "listedClassic:$.required_pull_request_reviews": INERT_ROWS,
  "listedClassic:$.required_pull_request_reviews.required_approving_review_count": INERT_ROWS,
  "listedClassic:$.required_pull_request_reviews.bypass_pull_request_allowances": INERT_ROWS,
  "listedClassic:$.required_pull_request_reviews.bypass_pull_request_allowances.users": INERT_ROWS,
  "listedClassic:$.required_pull_request_reviews.bypass_pull_request_allowances.teams": INERT_ROWS,
  "listedClassic:$.required_pull_request_reviews.bypass_pull_request_allowances.apps": INERT_ROWS,
  "listedClassic:$.allow_force_pushes": INERT_ROWS,
  "listedClassic:$.allow_force_pushes.enabled": INERT_ROWS,
  "listedClassic:$.allow_deletions": INERT_ROWS,
  "listedClassic:$.allow_deletions.enabled": INERT_ROWS,
};

// INERT: a closed set, one reason each, equal to the LEAVES entries with no row.
// Since red-team finding 1 of plan 33.1-23 the listed branch's body counts only as a protection
// record, which reads enforce_admins (so those two fields feed the branch-policy row); its other
// fields still decide nothing.
const LISTED_CLASSIC_INERT =
  "only the 200 status and a protection record (enforce_admins { enabled: boolean }) of the listed branch's protection are read for the branch-policy evidence; its other fields decide nothing";
const INERT: Readonly<Record<string, string>> = {
  "environments:$.total_count": "never read: the check reads the environments list itself",
  "environments:$.environments[0].protection_rules[0].reviewers[0].reviewer.login": "identities are never read; the reviewer's id decides",
  "listedClassic:$.required_pull_request_reviews": LISTED_CLASSIC_INERT,
  "listedClassic:$.required_pull_request_reviews.required_approving_review_count": LISTED_CLASSIC_INERT,
  "listedClassic:$.required_pull_request_reviews.bypass_pull_request_allowances": LISTED_CLASSIC_INERT,
  "listedClassic:$.required_pull_request_reviews.bypass_pull_request_allowances.users": LISTED_CLASSIC_INERT,
  "listedClassic:$.required_pull_request_reviews.bypass_pull_request_allowances.teams": LISTED_CLASSIC_INERT,
  "listedClassic:$.required_pull_request_reviews.bypass_pull_request_allowances.apps": LISTED_CLASSIC_INERT,
  "listedClassic:$.allow_force_pushes": LISTED_CLASSIC_INERT,
  "listedClassic:$.allow_force_pushes.enabled": LISTED_CLASSIC_INERT,
  "listedClassic:$.allow_deletions": LISTED_CLASSIC_INERT,
  "listedClassic:$.allow_deletions.enabled": LISTED_CLASSIC_INERT,
};

// EXCEPTIONS: a closed set of exactly two, each an ACCEPT entry with a written absentFailedWhy.
// `<body>:<path>|<mutation>` → the state each fed row reads instead of `unknown`.
const EXCEPTIONS: Readonly<Record<string, { rows: Readonly<Partial<Record<RowId, string>>>; why: string }>> = {
  "classic:$.required_pull_request_reviews|absent": {
    rows: { pull_request: "failed", approving_review: "failed", no_bypass: "unknown" },
    why: "ACCEPT.classicReviews reads an absent key as failed (absentFailedWhy: observed, not documented; failed is fail-safe)",
  },
  "environments:$.environments[0].deployment_branch_policy|null": {
    rows: { branch_policy: "failed" },
    why: "ACCEPT.deploymentBranchPolicy reads null as failed (absentFailedWhy: GitHub documents null as any branch may deploy)",
  },
};

// The pinned field counts. A fixture that gains or loses a field changes a count and stays red until
// someone reads the new field and classifies it in LEAVES.
const FIELDS_PER_BODY: Readonly<Record<BodyName, number>> = {
  rules: 18,
  ruleset: 7,
  classic: 13,
  environments: 19,
  protectedList: 4,
  listedClassic: 13,
};
// 60 → 62 and 14 → 12 (red-team finding 1 of plan 33.1-23): listedClassic enforce_admins and
// enforce_admins.enabled moved from INERT to the branch-policy row. No field was made inert.
const EVIDENCE_FIELD_COUNT = 62;
const INERT_FIELD_COUNT = 12;

const WALKED = walkedPaths();

describe("evidence-field matrix (Gap A, D-30, derived)", () => {
  it("both baselines read branch main and environment production protected, exit 0, from the arm each claims", () => {
    const ruleset = runHostCheck(BASELINES.RULESET_ARM());
    const classic = runHostCheck(BASELINES.CLASSIC_ARM());
    for (const r of [ruleset, classic]) {
      expect(targetOf(r.json, "branch", "main")?.verdict, r.stdout).toBe("protected");
      expect(targetOf(r.json, "environment", "production")?.verdict, r.stdout).toBe("protected");
      expect(r.status).toBe(0);
    }
    const policy = (r: MatrixRun): string => targetOf(r.json, "environment", "production")?.facts?.find((f) => f.id === "branch_policy")?.evidence ?? "";
    expect(policy(ruleset)).toContain('"hotfix"');
    expect(policy(classic)).toContain('"main"');
    expect(classic.json?.calls.some((c) => c.join(" ").includes("branches?protected=true"))).toBe(false);
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

  it("INERT is exactly the LEAVES entries with no row, each with a reason; EXCEPTIONS has exactly two entries, each with a reason", () => {
    const markedInert = Object.keys(LEAVES).filter((k) => LEAVES[k].length === 0).sort();
    expect(Object.keys(INERT).sort()).toEqual(markedInert);
    for (const [k, why] of Object.entries(INERT)) expect(why.trim().length, `${k}: empty reason`).toBeGreaterThan(0);
    expect(Object.keys(EXCEPTIONS)).toHaveLength(2);
    for (const [k, e] of Object.entries(EXCEPTIONS)) {
      expect(e.why.trim().length, `${k}: empty reason`).toBeGreaterThan(0);
      const [path] = k.split("|");
      for (const row of Object.keys(e.rows)) expect(LEAVES[path], `${k} names a row its field does not feed`).toContain(row);
    }
  });

  it("the rows fed by evidence fields are exactly the fact ids of a baseline run: floor.branch plus floor.environment", () => {
    const r = runHostCheck(BASELINES.RULESET_ARM());
    const factIds = [...rowStates(r.json).keys()].sort();
    const fed = [...new Set(Object.values(LEAVES).flat())].sort();
    expect(fed).toEqual(factIds);
    expect(fed.length).toBe((r.json?.floor.branch.length ?? 0) + (r.json?.floor.environment.length ?? 0));
    expect(new Set(factIds).size, "a row id shared by the two tables").toBe(factIds.length);
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
        expect(states.size, `${label}: every row of both targets reported\n${r.stdout}`).toBe(BRANCH_ROWS.length + ENV_ROWS.length);
        if (inert) {
          expect(targetOf(r.json, "branch", "main")?.verdict, label).toBe("protected");
          expect(targetOf(r.json, "environment", "production")?.verdict, label).toBe("protected");
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
        const fedTargets = new Set(rows.map((id) => (isBranchRow(id) ? "branch" : "environment")));
        if (fedTargets.has("branch")) expect(targetOf(r.json, "branch", "main")?.verdict, label).not.toBe("protected");
        if (fedTargets.has("environment")) expect(targetOf(r.json, "environment", "production")?.verdict, label).not.toBe("protected");
        expect(r.status, label).not.toBe(0);
      }
    });
  }
});

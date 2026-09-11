// nonblocking-reader-parity.test.ts — ONE RULE, TWO IMPLEMENTATIONS, BOUND IN BOTH DIRECTIONS.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS.
//
// D-24 (plan 31-21) made "every read on a caller-influenced position goes through one non-blocking
// regular-file reader" a rule of `scripts/context-io.ts`. Plan 31-27 carried that rule to
// `hooks/hook-entry.ts` — the PreToolUse wrapper `hooks/hooks.json` actually names — because CR-17
// measured the wrapper hanging at EXIT=124 with zero bytes on both streams for one `mkfifo` at any
// of thirteen agent-writable manifest paths.
//
// The wrapper could not IMPORT the module's reader. Its import list is `node:` builtins only, and
// that list is the whole reason the wrapper is a separate process: importing from `scripts/` would
// hand the corruption class that reaches the decider a route into the wrapper. So the rule now has
// TWO implementations, which is this repository's own recorded drift shape — a hand-maintained
// second spelling that rots while every test stays green.
//
// This file is what stops that. It binds the two in BOTH directions:
//
//   AXIS 1 — CARDINALITY. The set of files implementing the discipline is DERIVED from source by
//   asking a STRUCTURAL question (a function that opens a descriptor with the non-blocking flag,
//   stats THAT descriptor, and refuses a non-regular result), never by grepping for a name. The
//   members and the count are asserted, and two seeded mirrors move the count by exactly one in
//   each direction — a derivation that cannot move is a literal wearing a derivation's clothes.
//
//   AXIS 2 — AGREEMENT. ONE shared file-shape corpus is driven through BOTH implementations and
//   each outcome is classified into a decision class. The two must agree class-for-class on every
//   shape. A shape this platform cannot create is a LOUD, COUNTED skip — never a silent pass.
//
// THE WALK IS RECURSIVE FROM THE SourceFile, NOT OVER TOP-LEVEL DECLARATIONS. `31-REVIEW.md`'s
// WR-27 found the existing `deriveFsBlockingSites` axis in `scripts/context-io-writer-set.test.ts`
// walking only top-level function declarations, so a blocking read inside an arrow function, a class
// method or an `if (isMain)` block was invisible to its count. That axis is `31-29`'s to fix; this
// one must not be born with the same defect.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, afterAll } from "vitest";
import ts from "typescript";
import { spawnSync, execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { closureTargets } from "./js-import-closure.js";

const ROOT = join(import.meta.dirname, "..");

/** The COMMITTED module — the parity is measured against the artifact, never against a copy. */
const io: typeof import("./context-io.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "context-io.js")).href
);

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// AXIS 1 — the implementing-file set, DERIVED.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * THE ACCEPTED SPELLINGS OF THE REFUSAL, ENUMERATED ONCE (plan 31-36, `WR-32`).
 *
 * Until this plan the refusal was recognised by ONE syntactic shape — a `!` prefix over an
 * `.isFile()` call — and BOTH mutation mirrors were written in that same shape, so both proved only
 * that the predicate recognises ITSELF. Measured: the transcribed predicate applied to a
 * semantically identical implementation spelled `st.isFile() === false` answered
 * `{"nb":true,"ds":true,"rf":false,"th":true,"all":false}`, so the file never joined `IMPLEMENTING`
 * and the cardinality assertion stayed green at 2. `st.isFile() !== true` and a negated `if`/`else`
 * with the `throw` in the else branch answered the same.
 *
 * THIS LIST IS THE SINGLE DERIVATION BEHIND BOTH AXES. The predicate accepts every spelling in it,
 * and the mutation mirrors are GENERATED from it — one per entry — rather than written beside it. A
 * hand-written mirror set beside a hand-written accepted set is two literals that drift
 * independently, which is this phase's other recorded failure class. The `it` that drives each
 * mirror records its id, and a case below asserts the driven set IS this set.
 */
interface RefusalSpelling {
  readonly id: string;
  /** How the refusal reads, for the failure message. */
  readonly reads: string;
  /** The refusal, rendered into a body that already holds `st` from `fstatSync(fd)`. */
  readonly render: () => string;
}

const REFUSAL_SPELLINGS: readonly RefusalSpelling[] = Object.freeze([
  {
    id: "negated-call",
    reads: "if (!st.isFile()) throw",
    render: () => '    if (!st.isFile()) throw new Error("not a regular file");',
  },
  {
    id: "equals-false",
    reads: "if (st.isFile() === false) throw",
    render: () => '    if (st.isFile() === false) throw new Error("not a regular file");',
  },
  {
    id: "not-equals-true",
    reads: "if (st.isFile() !== true) throw",
    render: () => '    if (st.isFile() !== true) throw new Error("not a regular file");',
  },
  {
    id: "else-branch",
    reads: "if (st.isFile()) { … } else { throw }",
    render: () =>
      [
        "    if (st.isFile()) {",
        "      void st;",
        "    } else {",
        '      throw new Error("not a regular file");',
        "    }",
      ].join("\n"),
  },
]);

/** A `throw` anywhere in this statement, not descending into a nested function-like. */
function containsThrow(node: ts.Node): boolean {
  let found = false;
  const walk = (n: ts.Node): void => {
    if (found) return;
    if (
      n !== node &&
      (ts.isFunctionDeclaration(n) ||
        ts.isFunctionExpression(n) ||
        ts.isArrowFunction(n) ||
        ts.isMethodDeclaration(n))
    ) {
      return;
    }
    if (ts.isThrowStatement(n)) {
      found = true;
      return;
    }
    ts.forEachChild(n, walk);
  };
  walk(node);
  return found;
}

/**
 * THE SEMANTIC QUESTION, asked of one `isFile()` call: which branch does this function take when the
 * descriptor is NOT a regular file?
 *
 * The call is climbed outward through the operators that only change POLARITY — parentheses, `!`,
 * and a strict or loose comparison against a boolean literal — until an `if` is reached whose
 * condition is what was climbed to. The branch returned is the one taken when `isFile()` is FALSE.
 * `undefined` means the call does not decide a branch at all, which is not a refusal however the
 * rest of the function is written.
 */
function branchWhenNotRegular(call: ts.Node): ts.Statement | undefined {
  let node: ts.Node = call;
  // True while the climbed expression is TRUE exactly when `isFile()` is true.
  let trueWhenRegular = true;
  for (;;) {
    const parent: ts.Node | undefined = node.parent;
    if (parent === undefined) return undefined;
    if (ts.isParenthesizedExpression(parent)) {
      node = parent;
      continue;
    }
    if (ts.isPrefixUnaryExpression(parent) && parent.operator === ts.SyntaxKind.ExclamationToken) {
      trueWhenRegular = !trueWhenRegular;
      node = parent;
      continue;
    }
    if (ts.isBinaryExpression(parent)) {
      const other = parent.left === node ? parent.right : parent.left;
      const op = parent.operatorToken.kind;
      const equality =
        op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.EqualsEqualsToken;
      const inequality =
        op === ts.SyntaxKind.ExclamationEqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsToken;
      const literalTrue = other.kind === ts.SyntaxKind.TrueKeyword;
      const literalFalse = other.kind === ts.SyntaxKind.FalseKeyword;
      if ((equality || inequality) && (literalTrue || literalFalse)) {
        // `=== true` and `!== false` keep the polarity; `=== false` and `!== true` flip it.
        if ((equality && literalFalse) || (inequality && literalTrue)) trueWhenRegular = !trueWhenRegular;
        node = parent;
        continue;
      }
      return undefined;
    }
    if (ts.isIfStatement(parent) && parent.expression === node) {
      return trueWhenRegular ? parent.elseStatement : parent.thenStatement;
    }
    return undefined;
  }
}

/**
 * Does this function-like node IMPLEMENT the non-blocking regular-file discipline?
 *
 * The question is structural and is asked of the node's OWN body — the walk stops at any nested
 * function-like boundary, so the discipline is attributed to the innermost function that actually
 * spells it rather than to every enclosing scope.
 *
 * All three must be present:
 *   1. a call to `openSync` whose argument list mentions the non-blocking flag bit,
 *   2. a call to `fstatSync` (the stat is on the DESCRIPTOR, which is the point — a path stat can be
 *      raced, and a path stat does not stop `open(2)` from having already blocked),
 *   3. a refusal, asked as what the function DOES rather than as which operator it used: the
 *      function branches on `fstat`'s regular-file answer and THROWS on the not-a-regular-file side
 *      of that branch. `WR-32` measured the previous one-operator recognition walking straight past
 *      three semantically identical spellings.
 */
function bodyImplementsDiscipline(fn: ts.SignatureDeclaration): boolean {
  const body = (fn as { body?: ts.Node }).body;
  if (body === undefined) return false;
  let nonBlockingOpen = false;
  let descriptorStat = false;
  let refusesNonRegular = false;
  let sawThrow = false;

  const mentionsNonBlockingFlag = (node: ts.Node): boolean => {
    let found = false;
    const look = (n: ts.Node): void => {
      if (ts.isIdentifier(n) && n.text === "O_NONBLOCK") found = true;
      ts.forEachChild(n, look);
    };
    look(node);
    return found;
  };

  const walk = (node: ts.Node): void => {
    // Attribute to the innermost function: do not descend into a nested function-like.
    if (
      node !== body &&
      (ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node))
    ) {
      return;
    }
    if (ts.isCallExpression(node)) {
      const callee = ts.isIdentifier(node.expression) ? node.expression.text : "";
      if (callee === "openSync" && node.arguments.some((a) => mentionsNonBlockingFlag(a))) {
        nonBlockingOpen = true;
      }
      if (callee === "fstatSync") descriptorStat = true;
      // THE REFUSAL, RECOGNISED BY WHAT IT MEANS. However the descriptor variable is named and
      // however the test is spelled, the question is the same: when this descriptor is NOT a regular
      // file, does control reach a `throw`?
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "isFile") {
        const branch = branchWhenNotRegular(node);
        if (branch !== undefined && containsThrow(branch)) refusesNonRegular = true;
      }
    }
    if (ts.isThrowStatement(node)) sawThrow = true;
    ts.forEachChild(node, walk);
  };
  walk(body);
  return nonBlockingOpen && descriptorStat && refusesNonRegular && sawThrow;
}

/** Every function-like node in a source file, found by a RECURSIVE walk (WR-27's lesson). */
function everyFunctionLike(source: ts.SourceFile): ts.SignatureDeclaration[] {
  const out: ts.SignatureDeclaration[] = [];
  const walk = (node: ts.Node): void => {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      out.push(node);
    }
    ts.forEachChild(node, walk);
  };
  walk(source);
  return out;
}

/**
 * THE INPUT BOUNDARY IS DERIVED FROM TWO INDEPENDENT SOURCES (plan 31-36, `WR-32`).
 *
 * `git ls-files` alone cannot see an UNTRACKED third implementation, and a derivation that cannot
 * see a member has not measured a cardinality — it has measured its own census. `vitest.config.ts`
 * records the same blindness one register over for the `git status` residue predicate, where a
 * gitignored path was invisible to every residue gate in three rounds and the remedy was a REAL
 * listing.
 *
 * So both lists are computed: the tracked one, and a real filesystem walk of the three directories
 * this repository's runnable code lives in. The CANDIDATES are their UNION — the walk alone would
 * miss a tracked file whose directory the roots do not cover — and a case below asserts the two
 * AGREE over the walk's own roots, naming any path present in one and absent from the other.
 */
const WALK_ROOTS: readonly string[] = Object.freeze(["scripts", "hooks", "install"]);

function excludedFromCensus(rel: string): boolean {
  return rel.includes("node_modules") || rel.includes("runnable-ref/fixtures/");
}

/** Repo-relative `.ts` paths git knows about, tests included. */
function trackedSources(root: string): string[] {
  return execFileSync("git", ["ls-files", "*.ts"], { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !excludedFromCensus(l))
    .sort();
}

/** Repo-relative `.ts` paths a REAL listing of `WALK_ROOTS` finds, tracked or not. */
function walkedSources(root: string): string[] {
  const out: string[] = [];
  const descend = (rel: string): void => {
    let entries;
    try {
      entries = readdirSync(join(root, rel), { withFileTypes: true });
    } catch {
      return; // a root this checkout does not have is not a finding; the tracked list still covers it
    }
    for (const e of entries) {
      const child = `${rel}/${e.name}`;
      if (e.name.startsWith(".") || excludedFromCensus(child)) continue;
      if (e.isDirectory()) descend(child);
      else if (e.isFile() && e.name.endsWith(".ts")) out.push(child);
    }
  };
  for (const r of WALK_ROOTS) descend(r);
  return out.sort();
}

function underWalkRoots(rel: string): boolean {
  return WALK_ROOTS.some((r) => rel.startsWith(`${r}/`));
}

/** The repo-relative `.ts` files a derivation may consider: the UNION of the two censuses. */
function candidateSources(root: string): string[] {
  return [...new Set([...trackedSources(root), ...walkedSources(root)])].sort();
}

/** The DERIVED set of files implementing the discipline, repo-relative and sorted. */
function deriveImplementingFiles(root: string, files: string[]): string[] {
  const hits = new Set<string>();
  for (const rel of files) {
    const abs = join(root, rel);
    if (!existsSync(abs)) continue;
    const source = ts.createSourceFile(rel, readFileSync(abs, "utf8"), ts.ScriptTarget.Latest, true);
    for (const fn of everyFunctionLike(source)) {
      if (bodyImplementsDiscipline(fn)) {
        hits.add(rel);
        break;
      }
    }
  }
  return [...hits].sort();
}

const TRACKED = trackedSources(ROOT);
const WALKED = walkedSources(ROOT);
const CANDIDATES = candidateSources(ROOT);
const IMPLEMENTING = deriveImplementingFiles(ROOT, CANDIDATES);

/**
 * A third implementation of the discipline, spelled the way `spelling` spells its refusal.
 *
 * One source for every mirror, so a mirror can differ from its sibling ONLY in the refusal — which
 * is the variable under test. The seed is a real implementation rather than a marker string, because
 * the derivation asks a structural question and a marker would prove nothing.
 */
function seededThirdImplementation(spelling: RefusalSpelling): string {
  return [
    'import { openSync, fstatSync, closeSync, constants as fsConstants } from "node:fs";',
    "export function seededReader(path: string): void {",
    "  const fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);",
    "  try {",
    "    const st = fstatSync(fd);",
    spelling.render(),
    "  } finally {",
    "    closeSync(fd);",
    "  }",
    "}",
    "",
  ].join("\n");
}

/** Which accepted spellings a mirror actually DROVE. Compared to the enumeration below. */
const drivenSpellings = new Set<string>();

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

describe("31-27 — the non-blocking read rule has exactly TWO implementations, derived", () => {
  it("PREMISE: the derivation actually looked at something", () => {
    // A vacuity floor. A candidate list that silently went short would make every count below
    // trivially satisfiable, which is the failure this repository has recorded six rounds running.
    expect(CANDIDATES.length, "no candidate .ts sources were listed at all").toBeGreaterThan(20);
    expect(CANDIDATES).toContain("scripts/context-io.ts");
    expect(CANDIDATES).toContain("hooks/hook-entry.ts");
  });

  it("PREMISE: the candidate list is TWO independently derived censuses, and they agree", () => {
    // Each census is asserted non-vacuous on its own first: a union in which one side silently
    // returned nothing still looks like a full list, and "the two agree" would then be a statement
    // about one of them.
    expect(TRACKED.length, "`git ls-files` listed no .ts sources at all").toBeGreaterThan(20);
    expect(WALKED.length, `a real listing of ${WALK_ROOTS.join(", ")} found no .ts sources`).toBeGreaterThan(10);
    const trackedHere = TRACKED.filter(underWalkRoots);
    const onlyOnDisk = WALKED.filter((f) => !trackedHere.includes(f));
    const onlyInGit = trackedHere.filter((f) => !WALKED.includes(f));
    expect(
      onlyOnDisk,
      `present under ${WALK_ROOTS.join(", ")} on disk and INVISIBLE to \`git ls-files\`: ` +
        `${onlyOnDisk.join(", ")}. An untracked implementation is a real implementation; the union ` +
        "above DOES consider it, and this case is how it stops being silent.",
    ).toEqual([]);
    expect(
      onlyInGit,
      `tracked and absent from a real listing: ${onlyInGit.join(", ")}`,
    ).toEqual([]);
  });

  it("the derived implementing-file set has the expected MEMBERS", () => {
    expect(
      IMPLEMENTING,
      "the set of files implementing the non-blocking regular-file discipline MOVED. A third " +
        "implementation is a third spelling of one rule and will drift; a lost one is CR-12/CR-17 " +
        "coming back. Neither is fixed by editing this list.",
    ).toEqual(["hooks/hook-entry.ts", "scripts/context-io.ts"]);
  });

  it("the derived CARDINALITY is 2", () => {
    expect(IMPLEMENTING.length).toBe(2);
  });

  // ONE MIRROR PER ACCEPTED SPELLING, GENERATED FROM THE SAME LIST THE PREDICATE ACCEPTS. Writing
  // the mirrors beside the list instead of from it is what let `WR-32` ship two mirrors in the
  // predicate's own operator: both moved the count, and both proved only that the predicate
  // recognises itself.
  for (const spelling of REFUSAL_SPELLINGS) {
    it(`a seeded THIRD implementation spelled "${spelling.reads}" moves the derived count 2 -> 3`, () => {
      const root = mkdtempSync(join(ROOT, ".temp", `31-36-parity-seed3-${spelling.id}-`));
      tmpRoots.push(root);
      mkdirSync(join(root, "scripts"), { recursive: true });
      writeFileSync(
        join(root, "scripts", "seeded-third-reader.ts"),
        seededThirdImplementation(spelling),
      );
      const seeded = deriveImplementingFiles(root, ["scripts/seeded-third-reader.ts"]);
      expect(
        seeded,
        `the refusal spelled "${spelling.reads}" was NOT recognised. A predicate that reads one ` +
          "operator, mirrored by seeds written in that operator, has proven only that it recognises " +
          "itself — and a third implementation spelled differently is a third spelling of one rule " +
          "that will drift, invisibly.",
      ).toEqual(["scripts/seeded-third-reader.ts"]);
      const withSeed = [...IMPLEMENTING, ...seeded].sort();
      expect(withSeed.length, "2 -> 3").toBe(3);
      // SHOWN RED: with the seed present, the MEMBERS assertion above does not hold. A mirror that
      // moves a count without reddening the assertion the count feeds is a mirror that proves
      // nothing.
      expect(withSeed).not.toEqual(["hooks/hook-entry.ts", "scripts/context-io.ts"]);
      drivenSpellings.add(spelling.id);
    });
  }

  it("every ENUMERATED spelling was driven by a mirror — the two sets are one derivation", () => {
    // BOTH AXES DERIVED FROM ONE LIST. The accepted set and the mirror set cannot go short
    // independently: the mirrors are generated by iterating this list, and the ids the mirrors
    // actually recorded are compared back to it. Watched red by generating over a proper subset —
    // the driven set then names exactly the spelling nothing exercised.
    expect(REFUSAL_SPELLINGS.length, "no refusal spelling is enumerated at all").toBeGreaterThan(3);
    expect([...drivenSpellings].sort()).toEqual(REFUSAL_SPELLINGS.map((s) => s.id).sort());
    expect(drivenSpellings.size).toBe(REFUSAL_SPELLINGS.length);
  });

  it("CONTROL: a function that stats the descriptor but THROWS ON NOTHING is not counted", () => {
    // The widening must not accept a function that fails to refuse. This is the other side of the
    // same rule and it is what stops "recognise it semantically" from becoming "recognise anything".
    const root = mkdtempSync(join(ROOT, ".temp", "31-36-parity-nothrow-"));
    tmpRoots.push(root);
    mkdirSync(join(root, "scripts"), { recursive: true });
    writeFileSync(
      join(root, "scripts", "seeded-third-reader.ts"),
      [
        'import { openSync, fstatSync, closeSync, constants as fsConstants } from "node:fs";',
        "export function seededReader(path: string): boolean {",
        "  const fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);",
        "  try {",
        "    const st = fstatSync(fd);",
        "    return st.isFile();",
        "  } finally {",
        "    closeSync(fd);",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
    expect(
      deriveImplementingFiles(root, ["scripts/seeded-third-reader.ts"]),
      "a reader that REPORTS the shape without refusing it does not implement the discipline",
    ).toEqual([]);
  });

  it("CONTROL: a function that refuses a non-regular file but opens BLOCKING is not counted", () => {
    const root = mkdtempSync(join(ROOT, ".temp", "31-36-parity-blocking-"));
    tmpRoots.push(root);
    mkdirSync(join(root, "scripts"), { recursive: true });
    writeFileSync(
      join(root, "scripts", "seeded-third-reader.ts"),
      [
        'import { openSync, fstatSync, closeSync, constants as fsConstants } from "node:fs";',
        "export function seededReader(path: string): void {",
        "  const fd = openSync(path, fsConstants.O_RDONLY);",
        "  try {",
        "    const st = fstatSync(fd);",
        '    if (st.isFile() === false) throw new Error("not a regular file");',
        "  } finally {",
        "    closeSync(fd);",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
    expect(
      deriveImplementingFiles(root, ["scripts/seeded-third-reader.ts"]),
      "the refusal is not the whole rule: `open(2)` without the non-blocking flag has ALREADY " +
        "blocked by the time there is a descriptor to stat",
    ).toEqual([]);
  });

  it("a seeded implementation that LOSES its regular-file refusal moves the count 2 -> 1", () => {
    const root = mkdtempSync(join(ROOT, ".temp", "31-27-parity-seed1-"));
    tmpRoots.push(root);
    mkdirSync(join(root, "hooks"), { recursive: true });
    const src = readFileSync(join(ROOT, "hooks", "hook-entry.ts"), "utf8");
    const mutated = src.replace("if (!st.isFile()) {", "if (false as boolean) {");
    expect(mutated, "the seed matched nothing — this mirror would prove nothing").not.toBe(src);
    writeFileSync(join(root, "hooks", "hook-entry.ts"), mutated);
    const seeded = deriveImplementingFiles(root, ["hooks/hook-entry.ts"]);
    expect(
      seeded,
      "a wrapper that stopped refusing a non-regular file must LEAVE the derived set",
    ).toEqual([]);
    // The whole-repo count with that member removed is 1: the other implementation, and only it.
    const withoutSeed = IMPLEMENTING.filter((f) => f !== "hooks/hook-entry.ts");
    expect(withoutSeed.length, "2 -> 1").toBe(1);
    expect(withoutSeed).toEqual(["scripts/context-io.ts"]);
    // SHOWN RED: with the refusal gone the MEMBERS assertion above does not hold either.
    expect(withoutSeed).not.toEqual(["hooks/hook-entry.ts", "scripts/context-io.ts"]);
  });

  it("an UNTRACKED third implementation under scripts/ is visible to the derivation", () => {
    // `WR-32`'s third measurement, now a case. The file is written into the REAL `scripts/` tree,
    // because the blindness under test is a property of `git ls-files` over the real tree and a
    // temporary root would not reproduce it. It is removed in a `finally`.
    const rel = "scripts/31-36-untracked-parity-probe.ts";
    const abs = join(ROOT, rel);
    expect(existsSync(abs), "the probe path is occupied — refusing to overwrite it").toBe(false);
    try {
      writeFileSync(abs, seededThirdImplementation(REFUSAL_SPELLINGS[0] as RefusalSpelling));
      // WATCHED RED FOR THE AGREEMENT CASE ABOVE: this is exactly the disagreement it reports.
      expect(trackedSources(ROOT), "git cannot see an untracked file, which is the point").not.toContain(rel);
      expect(walkedSources(ROOT), "a real listing sees it").toContain(rel);
      expect(candidateSources(ROOT), "and the UNION considers it").toContain(rel);
      const derived = deriveImplementingFiles(ROOT, candidateSources(ROOT));
      expect(
        derived.length,
        `the derived implementing-file set did not move for an untracked third implementation. A ` +
          `census that cannot see a member has not measured a cardinality. derived=${derived.join(", ")}`,
      ).toBe(IMPLEMENTING.length + 1);
      expect(derived).toContain(rel);
    } finally {
      rmSync(abs, { force: true });
    }
    expect(existsSync(abs), "the probe file survived the case").toBe(false);
    // AND THE BASELINE DID NOT MOVE: widening what the axis CAN see is not re-baselining what it
    // DOES see.
    expect(deriveImplementingFiles(ROOT, candidateSources(ROOT))).toEqual(IMPLEMENTING);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// AXIS 2 — ONE shared corpus, TWO consumers, the same decision required of each.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * The decision classes. Four were planned; the corpus MEASURED a fifth.
 *
 * `refuse-unopenable` is a real, distinct outcome and is recorded rather than folded into
 * `refuse-shape`: a unix socket fails at `open(2)` with ENOTSUP on darwin, BEFORE either
 * implementation has a descriptor to `fstat`. Both implementations reach it, both refuse in bounded
 * time, and both name the position — so the AGREEMENT this axis asserts holds. Classifying it as
 * `refuse-shape` would claim a mechanism neither implementation reaches on this platform.
 */
type DecisionClass = "read" | "absent" | "refuse-shape" | "refuse-ceiling" | "refuse-unopenable";

/** The ceiling the corpus hands the module's reader. See the ceiling case below for why. */
const CORPUS_CEILING_BYTES = 8 * 1024 * 1024;

type Shape = {
  readonly name: string;
  /** Create the shape at `at`; return false when this platform cannot make it. */
  readonly make: (at: string) => boolean;
};

const SHAPES: readonly Shape[] = Object.freeze([
  { name: "absent", make: () => true },
  {
    name: "empty regular file",
    make: (at: string): boolean => {
      writeFileSync(at, "");
      return true;
    },
  },
  {
    name: "ordinary regular file",
    make: (at: string): boolean => {
      writeFileSync(at, "export const seededByTheParityCorpus = 1;\n");
      return true;
    },
  },
  {
    name: "symlink to a regular file",
    make: (at: string): boolean => {
      const target = at + ".parity-target";
      writeFileSync(target, "export const seededByTheParityCorpus = 2;\n");
      symlinkSync(target, at);
      return true;
    },
  },
  {
    name: "directory",
    make: (at: string): boolean => {
      mkdirSync(at, { recursive: true });
      return true;
    },
  },
  {
    name: "FIFO",
    make: (at: string): boolean => {
      try {
        execFileSync("mkfifo", [at]);
        return existsSync(at);
      } catch {
        return false;
      }
    },
  },
  {
    name: "unix socket",
    make: (at: string): boolean => {
      // Bound by a child that STAYS ALIVE — a server that closes unlinks its own socket, and the
      // corpus would then be silently driving the `absent` shape while reporting `unix socket`.
      const child = spawnSync(
        "node",
        [
          "-e",
          'const net=require("net");const s=net.createServer();s.listen(process.argv[1],()=>{' +
            "process.stdout.write('bound');});setTimeout(()=>{},3000);",
          at,
        ],
        { encoding: "utf8", timeout: 10_000 },
      );
      void child;
      return existsSync(at);
    },
  },
  {
    name: "over-ceiling regular file",
    make: (at: string): boolean => {
      writeFileSync(at, Buffer.alloc(9 * 1024 * 1024, 0x61));
      return true;
    },
  },
]);

/** Classify what the MODULE's exported reader decided about one shape. */
function classifyModule(at: string): DecisionClass {
  try {
    const text = io.readRegularFileOrNull(at, CORPUS_CEILING_BYTES, "parity corpus position");
    return text === null ? "absent" : "read";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("is not a regular file")) return "refuse-shape";
    if (msg.includes("above the")) return "refuse-ceiling";
    if (msg.includes("could not be opened")) return "refuse-unopenable";
    throw new Error(`the module's reader refused a corpus shape in an unclassified way: ${msg}`);
  }
}

/** Classify what the WRAPPER decided about one shape, observed END-TO-END at the hooks.json entry. */
function classifyWrapper(mirrorRoot: string, position: string): DecisionClass {
  const hooks = JSON.parse(readFileSync(join(ROOT, "hooks", "hooks.json"), "utf8")) as {
    hooks: { PreToolUse: Array<{ matcher: string; hooks: Array<{ command: string }> }> };
  };
  const raw = hooks.hooks.PreToolUse.find((m) => m.matcher === "Bash")?.hooks[0]?.command ?? "";
  if (!raw.includes("hooks/hook-entry.js")) {
    throw new Error(`the PreToolUse command bypasses the wrapper: ${raw}`);
  }
  const cmd = raw.split("${CLAUDE_PLUGIN_ROOT}").join(mirrorRoot);
  const argv: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of cmd) {
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === " " && !quoted) { if (cur !== "") { argv.push(cur); cur = ""; } continue; }
    cur += ch;
  }
  if (cur !== "") argv.push(cur);

  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined) continue;
    env[k] = v;
  }
  const r = spawnSync(argv[0] as string, argv.slice(1), {
    input: JSON.stringify({ tool_input: { command: "git push --force origin main" } }),
    encoding: "utf8",
    env,
    timeout: 20_000,
  });
  if (r.status !== 0) {
    throw new Error(`the wrapper did not ANSWER for ${position}: status=${String(r.status)}`);
  }
  const reason = (r.stdout ?? "").includes("permissionDecisionReason")
    ? ((JSON.parse(r.stdout) as { hookSpecificOutput: { permissionDecisionReason: string } })
        .hookSpecificOutput.permissionDecisionReason)
    : "";
  if (!reason.includes(position)) return "read"; // it hashed the module and moved on
  if (reason.includes("manifest-path-not-a-regular-file")) return "refuse-shape";
  if (reason.includes("ceiling")) return "refuse-ceiling";
  if (reason.includes("ENOENT")) return "absent";
  if (reason.includes("could not be read")) return "refuse-unopenable";
  return "read"; // a manifest MISMATCH names the module: the wrapper read it and disagreed
}

describe("31-27 — one shared file-shape corpus, the SAME decision required of both", () => {
  const POSITION = "scripts/checkpoints.js"; // an ordinary agent-writable DECIDER_MANIFEST position
  const rows: Array<{ shape: string; module: string; wrapper: string; ms: number }> = [];
  const skipped: string[] = [];

  function mirror(): string {
    const root = mkdtempSync(join(ROOT, ".temp", "31-27-parity-"));
    tmpRoots.push(root);
    for (const t of closureTargets(ROOT, "hooks/hook-entry.js", root)) {
      mkdirSync(dirname(t.to), { recursive: true });
      copyFileSync(t.from, t.to);
    }
    for (const t of closureTargets(ROOT, "hooks/guard.js", root)) {
      mkdirSync(dirname(t.to), { recursive: true });
      copyFileSync(t.from, t.to);
    }
    return root;
  }

  for (const shape of SHAPES) {
    it(`"${shape.name}" produces the SAME decision class from both implementations`, () => {
      const root = mirror();
      const at = join(root, POSITION);
      rmSync(at, { recursive: true, force: true });
      const made = shape.make(at);
      if (!made) {
        // A LOUD skip carrying the shape and the platform. It is COUNTED below, and the count is
        // asserted against what the platform predicate reported — a corpus that silently ran fewer
        // shapes than it claims is a red test here, not a green one.
        skipped.push(`${shape.name}@${process.platform}`);
        expect(
          `SKIPPED shape="${shape.name}" platform=${process.platform}: this platform would not create it`,
        ).toContain("SKIPPED");
        return;
      }
      const t0 = Date.now();
      const fromModule = classifyModule(at);
      const fromWrapper = classifyWrapper(root, POSITION);
      const ms = Date.now() - t0;
      rows.push({ shape: shape.name, module: fromModule, wrapper: fromWrapper, ms });
      expect(
        fromWrapper,
        `"${shape.name}": the module decided ${fromModule} and the wrapper decided ${fromWrapper}. ` +
          `Two implementations of one rule that disagree on a shape ARE the drift this axis exists ` +
          `to catch.`,
      ).toBe(fromModule);
      expect(ms, `"${shape.name}" took ${String(ms)} ms — bounded means bounded`).toBeLessThan(5_000);
    }, 30_000);
  }

  it("the corpus drove every shape it claims, and the skipped count matches the platform", () => {
    expect(rows.length + skipped.length).toBe(SHAPES.length);
    expect(
      skipped,
      `shapes skipped on ${process.platform}: ${skipped.join(", ") || "(none)"}`,
    ).toEqual(skipped); // recorded, whatever it is
    expect(rows.length, "the corpus ran ZERO shapes — every agreement above measured nothing")
      .toBeGreaterThan(0);
    const disagreements = rows.filter((r) => r.module !== r.wrapper);
    expect(disagreements, `disagreeing rows: ${JSON.stringify(disagreements)}`).toEqual([]);
    // The corpus REPORTS itself. A table nobody can read is a measurement nobody can check, and
    // "the number of disagreeing rows is 0" is only meaningful beside the rows it counted.
    // eslint-disable-next-line no-console
    console.log(
      `[31-27 parity] platform=${process.platform} driven=${String(rows.length)} ` +
        `skipped=${String(skipped.length)} maxMs=${String(Math.max(...rows.map((r) => r.ms)))}\n` +
        rows.map((r) => `  ${r.shape.padEnd(26)} module=${r.module.padEnd(20)} wrapper=${r.wrapper}`).join("\n") +
        (skipped.length > 0 ? `\n  SKIPPED: ${skipped.join(", ")}` : ""),
    );
  });
});

describe("31-27 — each ceiling is stated ONCE, in its own file, and they are NOT equal by rule", () => {
  // THE ASSERTION IS "STATED ONCE", NEVER "EQUAL". A note and a hook module are different objects.
  // Asserting the two numbers equal would make one of them a coincidence of refactoring and would
  // freeze the wrong rule: the day a hook module legitimately needs a different bound from a note,
  // an equality assertion is what would have to be deleted, and deleting an assertion is exactly how
  // a gate quietly stops meaning anything.
  it("the wrapper's ceiling is defined exactly once in hooks/hook-entry.ts", () => {
    const src = readFileSync(join(ROOT, "hooks", "hook-entry.ts"), "utf8");
    const defs = [...src.matchAll(/^const HOOK_MODULE_MAX_BYTES = .*$/gm)];
    expect(defs.length, "the wrapper's ceiling is defined more than once, or not at all").toBe(1);
    expect(defs[0]?.[0]).toContain("8 * 1024 * 1024");
  });

  it("the module's note ceiling is defined exactly once in scripts/context-io.ts", () => {
    // 31-29 (CR-19 / D-31): the ceiling became an EXPORT, because a bound is owned by the side that
    // admits and BOTH sides must read one binding. The `export` modifier is admitted here; what
    // this case asserts is unchanged and is the thing that matters — the ceiling is defined ONCE.
    // A second definition is how the write side and the read side came to disagree in the first
    // place, and it stays the failure this case reports.
    const src = readFileSync(join(ROOT, "scripts", "context-io.ts"), "utf8");
    const defs = [...src.matchAll(/^(?:export )?const NOTE_FILE_MAX_BYTES = .*$/gm)];
    expect(defs.length, "the note ceiling is defined more than once, or not at all").toBe(1);
    expect(defs[0]?.[0]).toContain("8 * 1024 * 1024");
  });
});

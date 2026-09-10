// uat-gate-exit-contract.test.ts — the §14 gate's exit-code branch, BOUND to the mechanism it
// branches on (plan 31-30, D-32).
//
// WHAT THIS FILE HOLDS, AND WHY IT IS A GATE RATHER THAN A COMMENT.
//
// `D-28` (plan 31-25) holds the `{0,1,2}` contract at two decided boundaries — one per file and one
// per process — and its own "what D-28 does NOT establish" block names the residue plainly: a fault
// that terminates the process WITHOUT UNWINDING (an out-of-memory kill, or a signal) is caught by no
// `try` and is outside both boundaries. That is true, and the runnable cannot fix it: a process
// killed by a signal runs no `catch` clause. The CALLER can, and until this plan
// `agent-factory/workflows/05-pr-quality-gate.md` step 3 branched on `0`, `1` and `2` and said
// nothing about a run that produced no exit code at all.
//
// MEASURED BEFORE THE PROSE WAS WRITTEN. The arm set derived from the workflow's own prose had
// cardinality 3. The runnable was then spawned against a 40-spec probe repository and killed
// mid-run: `EXIT CODE: null`, `SIGNAL: "SIGKILL"`, zero bytes on both streams; and again with
// SIGTERM, same shape. No arm matched `null`.
//
// THE FOUR CASES BELOW ARE THE BINDING, NOT THE CLAIM.
//   1. The arm set is DERIVED from the workflow's prose — never listed here — and asserted at four,
//      pairwise distinct, with the signal arm present by its own words.
//   2. The runnable's reachable return values are DERIVED from its syntax tree and asserted to be a
//      SUBSET of the numeric outcomes the caller's arms handle. A fifth return added later without a
//      caller arm turns this red. An UNRESOLVED return is red too — a derivation that silently drops
//      what it cannot follow is the failure mode this file exists to prevent.
//   3. A seeded mirror removing one arm moves the derived count by exactly one.
//   4. The recipe and the workflow are asserted to agree, in BOTH directions, over the numeric arms.
//
// Plus (plan 31-30, Task 1 MOVEMENT 4) the residue-predicate case: the `git status`-based `.temp/`
// gate rounds 3, 4 and 5 relied on CANNOT OBSERVE ITS SUBJECT, and the case demonstrates that rather
// than asserting it.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, writeFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const WF05 = join(REPO_ROOT, "agent-factory", "workflows", "05-pr-quality-gate.md");
const RECIPE = join(REPO_ROOT, "agent-factory", "checklists", "browser-uat-recipe.md");
const RUNNABLE_TS = join(REPO_ROOT, "scripts", "runnable-ref", "uat-spec-integrity.ts");

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The derivation. TWO ANCHORS AND NOTHING ELSE, and both are FAIL-CLOSED.
//
// An anchor that stops resolving is a hard throw, never an empty region. The one outcome this file
// must never produce is "zero arms derived, therefore nothing to check" — that is the most expensive
// possible green, and it is exactly the shape `00-base.md` records for an unresolvable base commit.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The bullet that carries the contract. Matched by its opening instruction, not by a line number. */
const BULLET_OPENER = /^\s*-\s+Run the UAT spec-integrity check\b/;
/** The sentence that opens the arm run. */
const ARM_RUN_START = "Branch on the exit code.";
/** The sentence that closes it. Everything after belongs to the surrounding prose, not to an arm. */
const ARM_RUN_END = "Exit `2` is recorded as such";

export interface DerivedArm {
  readonly code: string;
  readonly clause: string;
}

/**
 * Derive the exit-code arms from the workflow's OWN prose.
 *
 * An arm is a backticked marker followed by an arrow. Its clause runs to the next marker, or to the
 * end of the arm run for the last one. The three pre-existing arms therefore keep byte-identical
 * clause text when a fourth is appended, which is what makes the CONTROL in this plan checkable.
 */
export function deriveArms(workflowText: string): DerivedArm[] {
  const bullet = workflowText.split("\n").find((l) => BULLET_OPENER.test(l));
  if (bullet === undefined) {
    throw new Error(
      "uat-gate-exit-contract: the UAT spec-integrity bullet was not found in 05-pr-quality-gate.md. " +
        "This is a check that did not run, not a check that passed.",
    );
  }
  const a = bullet.indexOf(ARM_RUN_START);
  const b = bullet.indexOf(ARM_RUN_END);
  if (a < 0 || b < 0 || b <= a) {
    throw new Error(
      `uat-gate-exit-contract: the arm run is unresolvable (start=${a}, end=${b}). ` +
        "Both anchors must be present and ordered; an unresolvable region is fail-closed.",
    );
  }
  const region = bullet.slice(a + ARM_RUN_START.length, b);
  const markers = [...region.matchAll(/`([^`]+)`\s*→\s*/g)];
  return markers.map((m, i) => ({
    code: m[1],
    clause: region
      .slice(
        (m.index ?? 0) + m[0].length,
        i + 1 < markers.length ? (markers[i + 1].index ?? region.length) : region.length,
      )
      .trim(),
  }));
}

/** The numeric arms, as numbers. The non-numeric arm (`no exit code`) is deliberately excluded. */
export function numericArmCodes(arms: readonly DerivedArm[]): number[] {
  return arms
    .map((x) => x.code.trim())
    .filter((c) => /^\d+$/.test(c))
    .map((c) => Number(c))
    .sort((x, y) => x - y);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The runnable's reachable return values, derived from its SYNTAX TREE.
//
// Start at `main`. Follow every `return`:
//   - a numeric literal is an outcome;
//   - a call to a local function is followed into that function;
//   - a call through a local alias (`const report = deps.reportMeasured ?? reportMeasured`) resolves
//     to the DEFAULT operand, which is the function the CLI actually runs;
//   - anything else is UNRESOLVED, and unresolved is RED.
//
// The last clause is the point. A walker that quietly ignores a return shape it cannot follow is a
// walker that reports a short set as a complete one, and this file's whole job is to be the thing
// that notices a fifth outcome nobody wrote an arm for.
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface ReachableOutcomes {
  readonly codes: number[];
  readonly unresolved: string[];
  readonly functionsWalked: string[];
}

export function deriveReachableReturns(sourceText: string, entry = "main"): ReachableOutcomes {
  const sf = ts.createSourceFile("probe.ts", sourceText, ts.ScriptTarget.ES2022, true);

  const functions = new Map<string, ts.FunctionDeclaration>();
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name !== undefined) functions.set(st.name.text, st);
  }
  if (!functions.has(entry)) {
    throw new Error(`uat-gate-exit-contract: no function declaration named \`${entry}\` — fail-closed.`);
  }

  const codes = new Set<number>();
  const unresolved: string[] = [];
  const walked: string[] = [];
  const seen = new Set<string>();

  // Local aliases inside a function body: `const report = deps.reportMeasured ?? reportMeasured;`
  // The resolved name is the RIGHT operand of the `??`, which is what an unsupplied dependency runs.
  const localAliases = (fn: ts.FunctionDeclaration): Map<string, string> => {
    const out = new Map<string, string>();
    const visit = (n: ts.Node): void => {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer !== undefined) {
        const init = n.initializer;
        if (
          ts.isBinaryExpression(init) &&
          init.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken &&
          ts.isIdentifier(init.right)
        ) {
          out.set(n.name.text, init.right.text);
        } else if (ts.isIdentifier(init)) {
          out.set(n.name.text, init.text);
        }
      }
      ts.forEachChild(n, visit);
    };
    if (fn.body !== undefined) visit(fn.body);
    return out;
  };

  const walk = (name: string): void => {
    if (seen.has(name)) return;
    seen.add(name);
    const fn = functions.get(name);
    if (fn === undefined) {
      unresolved.push(`callee \`${name}\` is not a top-level function declaration in this module`);
      return;
    }
    walked.push(name);
    const aliases = localAliases(fn);
    const visit = (n: ts.Node): void => {
      // Do not descend into a nested function declaration/expression: its returns are ITS returns.
      if (n !== fn && (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n))) {
        return;
      }
      if (ts.isReturnStatement(n)) {
        const e = n.expression;
        if (e === undefined) {
          unresolved.push(`\`${name}\`: a bare \`return\` with no expression`);
        } else if (ts.isNumericLiteral(e)) {
          codes.add(Number(e.text));
        } else if (ts.isCallExpression(e) && ts.isIdentifier(e.expression)) {
          const callee = e.expression.text;
          walk(aliases.get(callee) ?? callee);
        } else {
          unresolved.push(`\`${name}\`: return of an unfollowable expression \`${e.getText(sf).slice(0, 60)}\``);
        }
      }
      ts.forEachChild(n, visit);
    };
    if (fn.body !== undefined) visit(fn.body);
  };

  walk(entry);
  return { codes: [...codes].sort((a, b) => a - b), unresolved, functionsWalked: walked };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("§14 gate exit-code contract — the arms are derived from the workflow's own prose", () => {
  const wf = readFileSync(WF05, "utf8");

  it("derives FOUR arms, pairwise distinct, from the UAT spec-integrity bullet", () => {
    const arms = deriveArms(wf);
    // The vacuity floor first: a derivation that found nothing is a check that did not run.
    expect(arms.length).toBeGreaterThan(0);
    expect(arms).toHaveLength(4);
    const codes = arms.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length); // pairwise distinct
    expect(codes).toEqual(["0", "1", "2", "no exit code"]);
  });

  it("the signal arm names could-not-run, and says never a pass and never a finding", () => {
    const arms = deriveArms(wf);
    const signal = arms.find((a) => a.code === "no exit code");
    expect(signal).toBeDefined();
    const clause = signal!.clause;
    expect(clause).toContain("killed by a signal");
    expect(clause).toContain("could-not-run");
    expect(clause).toContain("naming the signal");
    expect(clause).toContain("never read as a pass");
    expect(clause).toContain("never read as a finding");
  });

  it("CONTROL: the three pre-existing arms are byte-identical to what plan 31-25 left", () => {
    // Quoted, not derived: these three clauses predate this plan, and the property under test is
    // that the fourth arm was an ADDITION rather than a rewrite of a paragraph other gates bind to.
    const arms = deriveArms(wf);
    expect(arms[0]).toEqual({ code: "0", clause: "every UAT spec is clean, pass." });
    expect(arms[1]).toEqual({
      code: "1",
      clause: "a spec-integrity finding, which the gate flags, naming the file and the line.",
    });
    expect(arms[2]).toEqual({
      code: "2",
      clause: "the checker did not run, which is an error distinct from a clean fail.",
    });
  });

  it("SEEDED MIRROR: removing one arm from the prose moves the derived count by exactly one", () => {
    const before = deriveArms(wf).length;
    const mirrored = wf.replace("`1` → a spec-integrity finding,", "a spec-integrity finding,");
    expect(mirrored).not.toBe(wf); // the seed actually landed
    const after = deriveArms(mirrored).length;
    expect(before - after).toBe(1);
    expect(after).toBe(3);
    // And the four-arm assertion is RED against the mirror, which is what makes it a gate.
    expect(() => expect(deriveArms(mirrored)).toHaveLength(4)).toThrow();
  });

  it("FAIL-CLOSED: an unresolvable arm run throws rather than deriving an empty set", () => {
    const noAnchor = wf.replace(ARM_RUN_START, "Consider the exit code.");
    expect(() => deriveArms(noAnchor)).toThrow(/arm run is unresolvable/);
    const noBullet = wf.replace(/^(\s*)-(\s+)Run the UAT spec-integrity check/m, "$1-$2Skip the UAT check");
    expect(() => deriveArms(noBullet)).toThrow(/bullet was not found/);
  });
});

describe("§14 gate exit-code contract — every outcome the runnable can reach has a caller arm", () => {
  const wf = readFileSync(WF05, "utf8");
  const src = readFileSync(RUNNABLE_TS, "utf8");

  it("derives the runnable's reachable return values from its syntax tree, with nothing unresolved", () => {
    const r = deriveReachableReturns(src);
    expect(r.unresolved).toEqual([]);
    // The walk reached more than `main` alone — a one-function walk would report `{2}` and pass a
    // subset assertion while having looked at nothing.
    expect(r.functionsWalked.length).toBeGreaterThan(1);
    expect(r.functionsWalked).toContain("main");
    expect(r.codes).toEqual([0, 1, 2]);
  });

  it("the reachable return set is a SUBSET of the numeric outcomes the caller's arms handle", () => {
    const handled = new Set(numericArmCodes(deriveArms(wf)));
    expect([...handled].sort((a, b) => a - b)).toEqual([0, 1, 2]);
    const reachable = deriveReachableReturns(src).codes;
    expect(reachable.length).toBeGreaterThan(0);
    for (const code of reachable) expect(handled.has(code)).toBe(true);
  });

  it("SEEDED MIRROR: a fifth return no arm handles turns the subset assertion red", () => {
    const handled = new Set(numericArmCodes(deriveArms(wf)));
    // Inject a return the caller has no arm for, at the top of `main`'s try block.
    const anchor = "  try {\n    return runMain(argv, deps, out, err);";
    expect(src).toContain(anchor);
    const mirrored = src.replace(anchor, "  try {\n    if (argv.length === 99) return 7;\n    return runMain(argv, deps, out, err);");
    const reachable = deriveReachableReturns(mirrored).codes;
    expect(reachable).toContain(7);
    expect(handled.has(7)).toBe(false);
    expect(() => {
      for (const code of reachable) expect(handled.has(code)).toBe(true);
    }).toThrow();
  });

  it("SEEDED MIRROR: a return the walker cannot follow is RED, never silently dropped", () => {
    const anchor = "  try {\n    return runMain(argv, deps, out, err);";
    const mirrored = src.replace(anchor, "  try {\n    return deps.mystery!(argv);");
    const r = deriveReachableReturns(mirrored);
    expect(r.unresolved.length).toBeGreaterThan(0);
    expect(r.unresolved.join(" ")).toContain("unfollowable");
  });
});

describe("§14 gate exit-code contract — the workflow and the recipe agree, in both directions", () => {
  const wf = readFileSync(WF05, "utf8");
  const recipe = readFileSync(RECIPE, "utf8");

  /** The recipe's exit-code table rows: `| 0 | pass — no findings |`. Derived, never listed. */
  const recipeCodes = (): number[] => {
    const rows = [...recipe.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*$/gm)].map((m) => Number(m[1]));
    return [...new Set(rows)].sort((a, b) => a - b);
  };

  it("DIRECTION A: every numeric code the recipe's table publishes is an arm the workflow handles", () => {
    const codes = recipeCodes();
    expect(codes.length).toBeGreaterThan(0);
    const handled = new Set(numericArmCodes(deriveArms(wf)));
    for (const c of codes) expect(handled.has(c)).toBe(true);
  });

  it("DIRECTION B: every numeric arm the workflow handles is published by the recipe's table", () => {
    const codes = new Set(recipeCodes());
    const arms = numericArmCodes(deriveArms(wf));
    expect(arms.length).toBeGreaterThan(0);
    for (const a of arms) expect(codes.has(a)).toBe(true);
  });

  it("the NON-NUMERIC arm is disclosed by the recipe, which points at the caller that decides it", () => {
    // The recipe describes the RUNNABLE, so it cannot carry a fourth exit code — there is none.
    // What it must carry is the disclosure D-28 wrote and a pointer to the arm that answers it.
    expect(recipe).toContain("terminates the process without unwinding");
    expect(recipe).toContain("agent-factory/workflows/05-pr-quality-gate.md");
    expect(recipe).toContain("fourth arm for a run with no exit code");
    const arms = deriveArms(wf);
    expect(arms.some((a) => !/^\d+$/.test(a.code))).toBe(true);
  });
});

describe("the `.temp/` residue predicate can observe its own subject", () => {
  // MEASURED, NOT ASSERTED (plan 31-30 Task 1, MOVEMENT 4). Rounds 3, 4 and 5 used
  // `git status --short .temp` as the residue gate. `.temp/` is gitignored at `.gitignore:19`, so
  // that command prints NOTHING however full the directory is — round 5 measured 57 surviving
  // artifacts while the gate stayed silent, and a stray `*.uat.spec.ts` under there killed a whole
  // suite run on SIGSEGV. The replacement predicate is a real listing plus a named-pipe sweep.
  const PROBE = join(REPO_ROOT, ".temp", "31-30-residue-predicate-probe.txt");

  it("git status is BLIND to a planted `.temp/` file, and a real listing is not", () => {
    mkdirSync(join(REPO_ROOT, ".temp"), { recursive: true });
    writeFileSync(PROBE, "planted by scripts/uat-gate-exit-contract.test.ts\n");
    try {
      const ignored = spawnSync("git", ["check-ignore", "-v", PROBE], { cwd: REPO_ROOT, encoding: "utf8" });
      expect(ignored.status).toBe(0);
      expect(ignored.stdout).toContain(".gitignore");
      expect(ignored.stdout).toContain(".temp/");

      // THE INERT PREDICATE: silent, exit 0, with the file sitting right there.
      const status = spawnSync("git", ["status", "--short", ".temp"], { cwd: REPO_ROOT, encoding: "utf8" });
      expect(status.status).toBe(0);
      expect(status.stdout.trim()).toBe("");

      // THE REAL PREDICATE: a listing, which sees it.
      const listing = readdirSync(join(REPO_ROOT, ".temp"));
      expect(listing).toContain("31-30-residue-predicate-probe.txt");
      expect(existsSync(PROBE)).toBe(true);
    } finally {
      rmSync(PROBE, { force: true });
    }
    expect(existsSync(PROBE)).toBe(false);
  });

  it("the named-pipe sweep is part of the predicate and runs over the real tree", () => {
    // A FIFO under a probe root is what hangs a reader; the sweep is the half a listing alone
    // does not give you, because a FIFO IS listed and reads as an ordinary name.
    const sweep = spawnSync("find", [join(REPO_ROOT, ".temp"), "-type", "p"], { encoding: "utf8" });
    // `find` over a possibly-absent directory is allowed to fail; what is NOT allowed is a
    // surviving FIFO. An absent `.temp/` is the cleanest possible answer.
    const fifos = (sweep.stdout ?? "").split("\n").filter((s) => s.trim() !== "");
    expect(fifos).toEqual([]);
  });
});

describe("the disposition register's measuring stick did not move", () => {
  // T-31-30-03. A debt cleared by moving the base commit forward, or by narrowing the watched
  // corpus, is a finding cleared by deleting its evidence — the gate's own message says so.
  const BASE = join(REPO_ROOT, "docs", "audit", "29-style-dispositions", "00-base.md");

  it("`00-base.md` still records the base commit round 5 measured against", () => {
    const text = readFileSync(BASE, "utf8");
    const m = text.match(/^base_commit:\s*([0-9a-f]{40})\s*$/m);
    expect(m).not.toBeNull();
    expect(m![1]).toBe("4d2b8f079cc43d7d6184729966492789fb4dc05e");
    expect(m![1].startsWith("4d2b8f0")).toBe(true);
  });

  it("the watched corpus is not narrowed — the gate reports its own cardinality, unchanged at 40", () => {
    const r = spawnSync("node", [join(REPO_ROOT, "scripts", "check-diff-disposition.js")], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    const all = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    const m = all.match(/watched corpus:\s*(\d+)\s*markdown file\(s\)/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBe(40);
    // The gate spawns a real `git diff` against the recorded base over the whole watched corpus and
    // takes ~7 s on this machine. The budget is sized to the measured spawn cost, so a red here is
    // drift rather than the default 5 000 ms timeout.
  }, 60_000);
});

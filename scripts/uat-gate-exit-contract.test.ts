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
// Plus (plan 31-30, Task 3 MOVEMENT 4) the harness-instance tally gate: one tracked list, contiguous
// unique ordinals, and every ordinal-claiming sentence in the phase's own records present in it,
// over a DERIVED scanned-document set whose cardinality is asserted.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, writeFileSync, rmSync, mkdirSync, mkdtempSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import ts from "typescript";
// THE ONE AUTHORITY over "where is the ubuntu gate block of .github/workflows/ci.yml". Imported
// rather than restated: `(r-class-authority)` in scripts/check-foundation-guards.test.ts derives its
// member set from THIS import and refuses any scripts/*.test.ts that spells the block's step name
// with a locator of its own. It fired on this file's first draft, which is the gate working.
import { UBUNTU_BLOCK_STEP_NAME, ciWorkflow } from "./ci-workflow.testkit.js";

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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The harness-instance tally (plan 31-30, Task 3 MOVEMENT 4).
//
// `docs/audit/31-round5-residuals.md` §9.4 measured the phase's running count COLLIDED: two plans of
// round 5 both called their correction "the ninth logged instance", and three more recorded instances
// without numbering them. A running tally is not an index. What closes it is ONE derived list, in ONE
// place, with the numbering READ OFF that list — which is what these cases hold.
//
// A prior SUMMARY is history and is NEVER rewritten. The collision is ANNOTATED in the list.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const INSTANCE_LIST = join(REPO_ROOT, "docs", "audit", "harness-false-result-instances.md");
const PHASE_DIR = join(REPO_ROOT, ".planning", "phases", "31-autonomous-manual-testing");
const AUDIT_DIR = join(REPO_ROOT, "docs", "audit");

/** Ordinal words this phase's records actually use when claiming a numbered instance. */
const ORDINAL_WORDS = [
  "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth",
  "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth",
  "eighteenth", "nineteenth", "twentieth",
] as const;

/**
 * A sentence CLAIMS an ordinal when it names one of the words above immediately before the phrase
 * "logged instance". The phrase is the anchor, so an ordinary use of "ninth" elsewhere is not a
 * claim — the predicate is about the tally, not about the word.
 */
export function ordinalClaimsIn(text: string): string[] {
  const alt = ORDINAL_WORDS.join("|");
  const re = new RegExp(`\\*{0,2}(${alt})\\*{0,2}\\s+logged\\s+instance`, "gi");
  return [...text.matchAll(re)].map((m) => m[1].toLowerCase());
}

/**
 * The scanned document set, DERIVED: every `*-SUMMARY.md` of this phase plus every `docs/audit/31-*`
 * document. Never listed — a hand-typed member list is the set-literal drift class this repository
 * names as its second systemic failure.
 */
export function scannedDocuments(): string[] {
  const summaries = readdirSync(PHASE_DIR)
    .filter((f) => f.endsWith("-SUMMARY.md"))
    .map((f) => join(PHASE_DIR, f));
  const audits = readdirSync(AUDIT_DIR)
    .filter((f) => /^31-.*\.md$/.test(f))
    .map((f) => join(AUDIT_DIR, f));
  return [...summaries, ...audits].sort();
}

/** The ordinals the tracked list itself declares, read off its `| N |` first column. */
export function listedOrdinals(text: string): number[] {
  return [...text.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((m) => Number(m[1]));
}

describe("the harness-false-result tally is ONE list with the numbering read off it", () => {
  it("the tracked list exists and its ordinals are contiguous from one, with no duplicate", () => {
    expect(existsSync(INSTANCE_LIST)).toBe(true);
    const ordinals = listedOrdinals(readFileSync(INSTANCE_LIST, "utf8"));
    expect(ordinals.length).toBeGreaterThan(0);
    expect(new Set(ordinals).size).toBe(ordinals.length); // no ordinal claimed twice
    expect(ordinals).toEqual(Array.from({ length: ordinals.length }, (_, i) => i + 1));
  });

  it("the round-5 collision is ANNOTATED in the list rather than repaired in either SUMMARY", () => {
    const text = readFileSync(INSTANCE_LIST, "utf8");
    expect(text).toContain("31-22-SUMMARY.md");
    expect(text).toContain("31-25-SUMMARY.md");
    expect(text.toLowerCase()).toContain("collision");
    // The SUMMARYs still say what they said. History is not rewritten.
    const s22 = readFileSync(join(PHASE_DIR, "31-22-SUMMARY.md"), "utf8");
    const s25 = readFileSync(join(PHASE_DIR, "31-25-SUMMARY.md"), "utf8");
    expect(ordinalClaimsIn(s22)).toContain("ninth");
    expect(ordinalClaimsIn(s25)).toContain("ninth");
  });

  it("the scanned document set is DERIVED and its cardinality is asserted, so a short scan is red", () => {
    const docs = scannedDocuments();
    // Two-sided: a floor that a silently-empty readdir cannot clear, and the real count.
    expect(docs.length).toBeGreaterThan(25);
    const summaries = docs.filter((d) => d.endsWith("-SUMMARY.md"));
    const audits = docs.filter((d) => d.includes(`${"docs"}/audit/`));
    expect(summaries.length).toBeGreaterThan(25);
    expect(audits.length).toBeGreaterThan(0);
    expect(summaries.length + audits.length).toBe(docs.length);
  });

  it("every ordinal-claiming sentence in the scanned set appears in the tracked list", () => {
    const listText = readFileSync(INSTANCE_LIST, "utf8");
    const missing: string[] = [];
    let claimsExamined = 0;
    let claimingDocs = 0;
    for (const doc of scannedDocuments()) {
      if (resolve(doc) === resolve(INSTANCE_LIST)) continue;
      const found = ordinalClaimsIn(readFileSync(doc, "utf8"));
      claimsExamined += found.length;
      if (found.length > 0) claimingDocs += 1;
      for (const ordinal of new Set(found)) {
        // The list must name BOTH the document and the ordinal word it claimed.
        const named = listText.includes(doc.slice(REPO_ROOT.length + 1)) || listText.includes(doc.split("/").pop()!);
        if (!named || !listText.toLowerCase().includes(ordinal)) {
          missing.push(`${doc.split("/").pop()} claims "${ordinal}" and is absent from the tracked list`);
        }
      }
    }
    // THE VACUITY FLOOR, AND IT IS THE HALF THAT MATTERS. A scan that matched NOTHING would report an
    // empty `missing` list and pass forever, which is precisely the shape §9.4 measured elsewhere.
    // Measured at the commit that wrote this list: 11 claims across 6 documents.
    expect(claimsExamined, "the ordinal scan matched NOTHING — the predicate, not the tree").toBeGreaterThan(5);
    expect(claimingDocs, "the claims must be spread across documents, not all in one").toBeGreaterThan(2);
    expect(missing).toEqual([]);
  });

  it("SEEDED MIRROR: a document carrying an unlisted ordinal claim turns the gate red", () => {
    const dir = mkdtempSync(join(tmpdir(), "grugops-tally-"));
    try {
      const seeded = join(dir, "31-99-SUMMARY.md");
      writeFileSync(seeded, "This correction is the **nineteenth** logged instance of the class.\n");
      const claims = ordinalClaimsIn(readFileSync(seeded, "utf8"));
      expect(claims).toEqual(["nineteenth"]);
      const listText = readFileSync(INSTANCE_LIST, "utf8");
      expect(listText).not.toContain("31-99-SUMMARY.md");
      // The same predicate the case above runs, applied to the seeded document: RED.
      expect(listText.includes("31-99-SUMMARY.md")).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("every plan of round 6 carries the debt-does-not-grow acceptance criterion", () => {
  // `31-round6-residual-dispositions.md` §F records the remedy for the 110-finding
  // `check:diff-disposition` debt as: "Pay down inside the owning plans; add 'debt does not grow' as
  // an acceptance criterion on every round-6 plan." The confirmation is DERIVED over the round's own
  // PLAN files, with the plan count asserted, so a sixth plan added later without the criterion is a
  // red rather than a silent non-member.
  const ROUND_6_PLANS = /^31-(2[789]|3[01])-PLAN\.md$/;

  it("all five round-6 PLAN files state it, and the count is asserted at five", () => {
    const plans = readdirSync(PHASE_DIR).filter((f) => ROUND_6_PLANS.test(f)).sort();
    expect(plans.length, "the round-6 plan enumeration came back short").toBe(5);
    const without: string[] = [];
    for (const f of plans) {
      const text = readFileSync(join(PHASE_DIR, f), "utf8").toLowerCase();
      if (!text.includes("debt does not grow")) without.push(f);
    }
    expect(
      without,
      "a round-6 plan that does not carry the criterion can grow the debt without anything going red",
    ).toEqual([]);
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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The platform shape corpus (plan 31-30, Task 2 — R-03 / R-31-19-03).
//
// THE CORRECTION FIRST, because it is the substance. `.github/workflows/ci.yml` has carried a
// `windows-latest` leg since plan 20-04. The round-6 disposition document proposes closing `R-03` by
// "adding a windows-latest job"; adding a job that already exists would be a fabricated closure. So
// these cases assert what the leg DOES run, that the new steps were APPENDED to it rather than
// replacing anything, and that the Windows-scoped half really is Windows-scoped.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const SHAPE_GATE_JS = join(REPO_ROOT, "scripts", "check-platform-shapes.js");

/** Every `- name:` step in the workflow, in order, with the `if:` condition that guards it. */
export function ciSteps(text: string): Array<{ name: string; guard: string; run: string }> {
  const lines = text.split("\n");
  const out: Array<{ name: string; guard: string; run: string }> = [];
  let cur: { name: string; guard: string; run: string } | null = null;
  for (const raw of lines) {
    const l = raw.trim();
    if (l.startsWith("- name: ")) {
      if (cur !== null) out.push(cur);
      cur = { name: l.slice("- name: ".length), guard: "", run: "" };
      continue;
    }
    if (cur === null) continue;
    if (l.startsWith("if: ")) cur.guard = l.slice("if: ".length);
    if (l.startsWith("run: ")) cur.run += `${l.slice("run: ".length)}\n`;
    else if (l.startsWith("node ") || l.startsWith("npm ") || l.startsWith("npx ")) cur.run += `${l}\n`;
  }
  if (cur !== null) out.push(cur);
  return out;
}

describe("R-03 — the windows-latest leg PRE-EXISTS this plan, and the shape steps were appended to it", () => {
  const ci = ciWorkflow();

  it("the matrix still declares BOTH legs — a removed Windows leg is the opposite of this plan", () => {
    expect(ci).toContain("windows-latest");
    const occurrences = (ci.match(/windows-latest/g) ?? []).length;
    expect(occurrences).toBeGreaterThan(0);
    expect(ci).toMatch(/os:\s*\[ubuntu-latest,\s*windows-latest\]/);
  });

  it("the PRE-EXISTING steps the Windows leg already ran are still there and still unguarded-or-non-ubuntu", () => {
    // MEASURED FROM THE FILE, never asserted from memory. These are the steps a windows-latest run
    // executed before this plan: checkout, node, npm ci, build, typecheck, vitest.
    const steps = ciSteps(ci);
    expect(steps.length).toBeGreaterThan(5);
    const windowsReachable = steps.filter((s) => s.guard === "" || !s.guard.includes("== 'ubuntu-latest'"));
    const names = windowsReachable.map((s) => s.name);
    expect(names).toContain("Checkout");
    expect(names).toContain("Setup Node 22");
    expect(names.some((n) => n.startsWith("Install (dev deps only"))).toBe(true);
    expect(names.some((n) => n.startsWith("Build (every other leg"))).toBe(true);
    expect(names).toContain("Typecheck (shipped source + test-inclusive target)");
    expect(names).toContain("Vitest (e2e lane excluded)");
  });

  it("the new corpus step runs on EVERY leg, so the empty half of the skip list is observed too", () => {
    const steps = ciSteps(ci);
    const corpus = steps.find((s) => s.name.startsWith("Platform shape corpus"));
    expect(corpus).toBeDefined();
    expect(corpus!.guard, "the differential measurement needs both platforms").toBe("");
    expect(corpus!.run).toContain("node scripts/check-platform-shapes.js");
  });

  it("the Windows-scoped step IS Windows-scoped, and it demands a non-empty remainder", () => {
    const steps = ciSteps(ci);
    const win = steps.find((s) => s.name.startsWith("Windows shape remainder"));
    expect(win).toBeDefined();
    expect(win!.guard).toBe("matrix.os == 'windows-latest'");
    expect(win!.run).toContain("node scripts/check-platform-shapes.js");
    expect(ci).toContain("GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS");
  });

  it("no ubuntu-only gate was moved: the freshness/repo block is still ubuntu-scoped and still LAST", () => {
    const steps = ciSteps(ci);
    const block = steps.find((s) => s.name === UBUNTU_BLOCK_STEP_NAME);
    expect(block).toBeDefined();
    expect(block!.guard).toBe("matrix.os == 'ubuntu-latest'");
    // Still the last step — `(r-bound-synthetic)` in check-foundation-guards.test.ts depends on it.
    expect(steps[steps.length - 1]!.name).toBe(block!.name);
    // The EARLIER ubuntu-only gate too, located by its own distinct name rather than by the block
    // authority's prefix — they are two different steps and conflating them would assert nothing.
    const freshnessFirst = steps.find((s) => s.name.includes("before any build"));
    expect(freshnessFirst).toBeDefined();
    expect(freshnessFirst!.guard).toBe("matrix.os == 'ubuntu-latest'");
  });
});

describe("the skip list is a MEASURED artifact, not a printed line nobody reads", () => {
  function runGate(env: Record<string, string> = {}): { status: number | null; out: string } {
    const r = spawnSync("node", [SHAPE_GATE_JS], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, ...env },
      timeout: 120_000,
    });
    return { status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
  }

  it("EMPTY on a platform that constructs every shape — and it SAYS SO rather than printing nothing", () => {
    const r = runGate();
    expect(r.status).toBe(0);
    expect(r.out).toContain("SKIPPED SHAPES (0):");
    expect(r.out).toContain("(none) — this platform constructed every shape in the corpus");
    // The corpus really drove things; an empty skip list beside an empty driven list proves nothing.
    expect(r.out).toMatch(/DRIVEN \((\d+)\):/);
    const driven = Number(/DRIVEN \((\d+)\):/.exec(r.out)![1]);
    expect(driven).toBeGreaterThan(10);
  }, 180_000);

  it("NON-EMPTY on a platform lacking a shape, and each entry names the shape AND the platform", () => {
    // Darwin constructs every shape, so the absent-platform arm is reached through the disclosed
    // test seam. Without it this arm would never execute anywhere a developer can watch it.
    const r = runGate({ GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT: "FIFO" });
    expect(r.status).toBe(0);
    const m = /SKIPPED SHAPES \((\d+)\):/.exec(r.out);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThan(0);
    for (const line of r.out.split("\n").filter((l) => l.trim().startsWith('shape="'))) {
      expect(line).toContain('shape="FIFO"');
      expect(line).toContain('position="');
      expect(line).toContain(`platform=${process.platform}`);
      expect(line.length).toBeGreaterThan(60); // it carries a reason, not just a name
    }
  }, 180_000);

  it("a silent Windows remainder is RED: REQUIRE_SKIPS with an empty list fails the step", () => {
    const r = runGate({ GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS: "1" });
    expect(r.status).toBe(1);
    expect(r.out).toContain("the skip list is EMPTY");
    expect(r.out).toContain("CHECK(S) FAILED");
  }, 180_000);

  it("the exit-code contract and the R-31-19-03 identity measurement are both driven and printed", () => {
    const r = runGate();
    expect(r.out).toContain("spec-integrity exit contract");
    expect(r.out).toContain("R-31-19-03 — directory identity on ");
    expect(r.out).toMatch(/degenerate\s+(YES|no)/);
  }, 180_000);
});

describe("the mkfifo call sites that make a Windows suite run unreachable are MEASURED, not asserted", () => {
  // The finding is a property of the SOURCE, so darwin can measure it. What a Windows run then does
  // is NOT measurable from here and is not claimed anywhere. Carried in deferred-items.md.
  it("counts the unguarded POSIX-only FIFO constructions in the test corpus", () => {
    const sites: string[] = [];
    for (const dir of ["scripts", "hooks", "install"]) {
      for (const f of readdirSync(join(REPO_ROOT, dir))) {
        if (!f.endsWith(".test.ts")) continue;
        readFileSync(join(REPO_ROOT, dir, f), "utf8")
          .split("\n")
          .forEach((l, i) => {
            if (/["']mkfifo["']/.test(l)) sites.push(`${dir}/${f}:${String(i + 1)}`);
          });
      }
    }
    // The scan's own premise: a walk that found nothing would pass forever.
    expect(sites.length, "the mkfifo scan found no call sites at all — the scan is broken").toBeGreaterThan(0);
    // The one GUARDED site is the parity corpus's own shape, which returns false and skips.
    const guarded = sites.filter((s) => s.startsWith("scripts/nonblocking-reader-parity.test.ts"));
    expect(guarded.length).toBe(1);
    // Recorded rather than thresholded: this number is a carried finding with an owner, not a gate
    // this plan is closing. A rising count is visible in the diff of this assertion's message.
    // eslint-disable-next-line no-console
    console.log(
      `[31-30] mkfifo call sites in test modules: ${String(sites.length)} ` +
        `(${String(guarded.length)} guarded, ${String(sites.length - guarded.length)} unguarded)\n  ` +
        sites.join("\n  "),
    );
    expect(sites.length - guarded.length).toBeGreaterThan(0);
  });
});

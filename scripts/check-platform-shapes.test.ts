// check-platform-shapes.test.ts — CAN THE CONTROL OBSERVE THE PROPERTY IT CLAIMS? (plan 31-36,
// `WR-31` and `IN-18`).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS.
//
// `scripts/check-platform-shapes.ts`'s own header states the control's purpose: the ordinary shape
// "must NOT be refused by the not-a-regular-file clause", and "a run that refuses everything proves
// nothing". Round 7's review MEASURED the run and found the second sentence true of it: BOTH
// controls at BOTH positions were refusals — the manifest control drew a frozen-manifest deny, the
// note control drew a `destination already holds a DIFFERENT note` refusal — and the gate printed
// `not refused (correct)` for all four rows and `ALL CHECKS PASSED`. The implemented check asked
// only whether one refusal CLAUSE STRING was absent, so "the position produced its ordinary outcome"
// and "the position refused for a DIFFERENT reason" were indistinguishable.
//
// This repository has logged fourteen instances of a verification harness producing a false result.
// The standing rule from that log is to ASSERT THE HARNESS'S OWN PREMISE before reading its answer,
// and a control whose RED path has never been driven is a premise nobody has asserted. So this file
// drives the gate three ways — ordinarily, with the pre-fix staging restored behind the documented
// `GRUGOPS_PLATFORM_SHAPES_STALE_CONTROL` seam, and with the forced-absent seam — and asserts what
// each run must report.
//
// EVERY EXPECTATION IS DERIVED FROM THE MODULE'S OWN SYNTAX TREE, NOT TYPED BESIDE IT. The corpus's
// shape names, which of them are CONTROLS, and the position labels are read out of
// `check-platform-shapes.ts` with the TypeScript parser. A hand-typed expectation is a second
// literal that drifts from the first while both stay green, which is this phase's other recorded
// failure class. The module cannot be IMPORTED for these facts — it is a CLI that calls
// `process.exit(main())` at load — so the tree is read and the artifact is spawned.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import ts from "typescript";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-platform-shapes.js");
const GATE_TS = join(ROOT, "scripts", "check-platform-shapes.ts");
const HOOK_ENTRY_JS = join(ROOT, "hooks", "hook-entry.js");

/** The seam that restores the PRE-FIX staging, so the control's RED path is drivable. */
const STALE_CONTROL_ENV = "GRUGOPS_PLATFORM_SHAPES_STALE_CONTROL";
const FORCE_ABSENT_ENV = "GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT";

/** The wrapper's own fail-closed marker. The gate classifies on it; this file asserts it exists. */
const FAIL_CLOSED_PREFIX = "Blocked (fail-closed):";

// ── The expectations, DERIVED from the module's syntax tree ──────────────────────────────────

interface DerivedShape {
  readonly name: string;
  readonly expectsRefusal: boolean;
}

function derive(): { shapes: DerivedShape[]; positions: string[] } {
  const source = ts.createSourceFile(
    "check-platform-shapes.ts",
    readFileSync(GATE_TS, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const shapes: DerivedShape[] = [];
  const positions: string[] = [];
  // A position label may be written at the call site or held in a `const NAME = "…"` above it. Both
  // are the same fact; a derivation that only accepts one spelling goes SILENTLY SHORT the day the
  // other is used, which is what the PREMISE case below exists to catch.
  const stringConsts = new Map<string, string>();
  const collectConsts = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      ts.isStringLiteral(node.initializer)
    ) {
      stringConsts.set(node.name.text, node.initializer.text);
    }
    ts.forEachChild(node, collectConsts);
  };
  collectConsts(source);
  const asLabel = (arg: ts.Expression): string | undefined => {
    if (ts.isStringLiteral(arg)) return arg.text;
    if (ts.isIdentifier(arg)) return stringConsts.get(arg.text);
    return undefined;
  };
  const walk = (node: ts.Node): void => {
    // A corpus entry: an object literal carrying BOTH `name` and `expectsNotRegularFileRefusal`.
    if (ts.isObjectLiteralExpression(node)) {
      let name: string | undefined;
      let expects: boolean | undefined;
      for (const p of node.properties) {
        if (!ts.isPropertyAssignment(p) || !ts.isIdentifier(p.name)) continue;
        if (p.name.text === "name" && ts.isStringLiteral(p.initializer)) name = p.initializer.text;
        if (p.name.text === "expectsNotRegularFileRefusal") {
          if (p.initializer.kind === ts.SyntaxKind.TrueKeyword) expects = true;
          if (p.initializer.kind === ts.SyntaxKind.FalseKeyword) expects = false;
        }
      }
      if (name !== undefined && expects !== undefined) shapes.push({ name, expectsRefusal: expects });
    }
    // A position: the string literal each `drivePosition(...)` call site names itself with.
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "drivePosition" &&
      node.arguments[0] !== undefined
    ) {
      const label = asLabel(node.arguments[0]);
      if (label !== undefined) positions.push(label);
    }
    ts.forEachChild(node, walk);
  };
  walk(source);
  return { shapes, positions };
}

const { shapes: SHAPES, positions: POSITIONS } = derive();
const CONTROL_SHAPES = SHAPES.filter((s) => !s.expectsRefusal).map((s) => s.name);
const REFUSING_SHAPES = SHAPES.filter((s) => s.expectsRefusal).map((s) => s.name);

const ORDINARY_OUTCOME = "ordinary outcome (correct)";

interface Run {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly driven: string[];
}

function runGate(extraEnv: Record<string, string>): Run {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined) continue;
    env[k] = v;
  }
  const r = spawnSync(process.execPath, [GATE_JS], {
    encoding: "utf8",
    env: { ...env, ...extraEnv },
    timeout: 180_000,
  });
  const stdout = r.stdout ?? "";
  // The DRIVEN block: every line between the header and the blank line that ends it.
  const lines = stdout.split("\n");
  const start = lines.findIndex((l) => l.startsWith("DRIVEN ("));
  const driven: string[] = [];
  if (start >= 0) {
    for (const l of lines.slice(start + 1)) {
      if (!l.startsWith("  ")) break;
      driven.push(l);
    }
  }
  return { status: r.status, stdout, stderr: r.stderr ?? "", driven };
}

/**
 * The SHAPE-CORPUS rows naming a given shape — the ones a derived position label opens.
 *
 * The DRIVEN block also carries the exit-contract rows and the directory-identity row, and a bare
 * substring match over the whole block picks them up (`R-31-19-03 directory identity` contains
 * `directory`). Anchoring on the derived position labels is what keeps the denominator the corpus's
 * own rather than the block's.
 */
function corpusRows(run: Run): string[] {
  return run.driven.filter((l) => POSITIONS.some((p) => l.startsWith(`  ${p} `)));
}

function rowsFor(run: Run, shape: string): string[] {
  return corpusRows(run).filter((l) => l.includes(shape));
}

describe("31-36 WR-31 — the CONTROL rows can observe the property they claim", () => {
  it("PREMISE: the corpus, its CONTROLS and the positions were actually derived from the module", () => {
    // A derivation that silently went short makes every count below trivially satisfiable. This is
    // the "derive the element count independently of the loop that consumes it" floor.
    expect(SHAPES.length, "no corpus shapes were derived from check-platform-shapes.ts").toBeGreaterThan(3);
    expect(CONTROL_SHAPES.length, "no CONTROL shape was derived").toBeGreaterThan(1);
    expect(REFUSING_SHAPES.length, "no refusal-expecting shape was derived").toBeGreaterThan(1);
    expect(POSITIONS.length, "no drivePosition call site was derived").toBeGreaterThan(1);
    expect(CONTROL_SHAPES.length + REFUSING_SHAPES.length).toBe(SHAPES.length);
  });

  it("PREMISE: the fail-closed marker the gate classifies on exists in the committed wrapper", () => {
    // The manifest position's verdict classifier distinguishes "the wrapper answered with the
    // DECIDER's decision" from "the wrapper refused with its own fail-closed deny". If the marker it
    // reads is absent from the artifact, the classifier can never see the fail-closed arm and the
    // control's assertion is vacuous. The classifier's own premise, asserted before its answer.
    expect(readFileSync(HOOK_ENTRY_JS, "utf8")).toContain(FAIL_CLOSED_PREFIX);
  });

  it("the ordinary run reports an ORDINARY OUTCOME for every CONTROL row, at every position", () => {
    const run = runGate({});
    expect(run.status, `the gate exited ${String(run.status)}:\n${run.stdout}`).toBe(0);
    const controlRows = corpusRows(run).filter((l) => CONTROL_SHAPES.some((s) => l.includes(s)));
    // Derived both ways: one row per CONTROL shape per position, from two independent derivations.
    expect(
      controlRows.length,
      `expected ${String(CONTROL_SHAPES.length)} CONTROL shapes x ${String(POSITIONS.length)} ` +
        `positions of CONTROL rows; the DRIVEN block held ${String(controlRows.length)}:\n` +
        run.driven.join("\n"),
    ).toBe(CONTROL_SHAPES.length * POSITIONS.length);
    for (const row of controlRows) {
      expect(
        row.trimEnd().endsWith(ORDINARY_OUTCOME),
        `a CONTROL row did not report its position's ordinary outcome: "${row.trim()}". A control ` +
          "scored by the ABSENCE of one refusal clause cannot tell an ordinary outcome from a " +
          "refusal for a different reason.",
      ).toBe(true);
    }
  });

  it("CONTROL: the refusal-expecting rows are unmoved — every one is a named refusal", () => {
    const run = runGate({});
    for (const shape of REFUSING_SHAPES) {
      const rows = rowsFor(run, shape);
      expect(rows.length, `no row drove the shape "${shape}"`).toBe(POSITIONS.length);
      for (const row of rows) {
        expect(row.trimEnd().endsWith("named refusal"), `"${row.trim()}"`).toBe(true);
      }
    }
  });

  it("the CONTROL can report RED: the pre-fix staging turns the gate red, naming both verdicts", () => {
    // A control whose red path was never driven is the same unmeasured premise this file exists to
    // close. The seam restores EXACTLY the staging the review measured: an empty regular file at
    // each position, so the ordinary outcome is unreachable at both.
    const run = runGate({ [STALE_CONTROL_ENV]: "1" });
    expect(
      run.status,
      `the gate exited ${String(run.status)} with the pre-fix staging restored. A control that ` +
        `cannot report red has not been fixed.\n${run.stdout}`,
    ).toBe(1);
    expect(run.stdout).toContain("A corpus in which every shape is refused has measured nothing");
    for (const position of POSITIONS) {
      expect(
        run.stdout,
        `no CONTROL failure was reported at "${position}" under the pre-fix staging`,
      ).toContain(`${position} / `);
    }
    // The message names the MEASURED verdict and the EXPECTED one, per the class this closes.
    expect(run.stdout).toMatch(/verdict=refuse, expected write/);
    expect(run.stdout).toMatch(/verdict=fail-closed, expected answered/);
  });
});

describe("31-36 IN-18 — the forced-absent seam skips WITHOUT constructing the shape", () => {
  it("with every shape forced absent, the positions record their skips without planting anything", () => {
    // THE OBSERVATION, MADE FROM OUTSIDE THE MODULE. `plant()` cannot take a single step without
    // `mkdtemp`ing a scratch root, so a run whose TMPDIR DOES NOT EXIST dies on the first plant it
    // performs. Pre-fix the seam called `plant(shape)` and then discarded the result, so the first
    // forced shape threw before any skip was recorded and the run reported ZERO skips. Post-fix the
    // seam never plants, so every skip is recorded and the run reports all of them — the count is
    // the proof that nothing was constructed, and it is derived from the corpus rather than typed.
    const parent = mkdtempSync(join(tmpdir(), "31-36-absent-"));
    const missing = join(parent, "there-is-no-such-directory");
    try {
      const run = runGate({
        [FORCE_ABSENT_ENV]: SHAPES.map((s) => s.name).join(","),
        TMPDIR: missing,
        TMP: missing,
        TEMP: missing,
      });
      const expected = SHAPES.length * POSITIONS.length;
      expect(
        run.stdout,
        `the run did not record ${String(expected)} skips (${String(SHAPES.length)} shapes x ` +
          `${String(POSITIONS.length)} positions). A seam that plants what it has already decided ` +
          `to skip dies before it records anything.\n${run.stdout}`,
      ).toContain(`SKIPPED SHAPES (${String(expected)}):`);
      for (const shape of SHAPES) expect(run.stdout).toContain(`shape="${shape.name}"`);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
});

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
// EVERY EXPECTATION IS DERIVED FROM THE MODULE'S OWN SYNTAX TREE OR FROM ITS OWN EXPORTS, NOT TYPED
// BESIDE IT. The corpus's shape names, which of them are CONTROLS, and the position labels are read
// out of `check-platform-shapes.ts` with the TypeScript parser. A hand-typed expectation is a second
// literal that drifts from the first while both stay green, which is this phase's other recorded
// failure class.
//
// THE MODULE WAS NOT IMPORTABLE UNTIL PLAN 31-43 and this header said so: it called
// `process.exit(main())` at load, so the tree was read and the artifact was spawned, and nothing
// else was possible. It now runs its CLI behind the ONE entrypoint predicate `scripts/is-entry.ts`
// owns, which is why the outcome vocabulary and the label derivation below can be ASKED of the
// committed `.js` rather than re-spelled here. That the import does not run the gate is itself
// asserted, before any answer it gives is read.
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

function derive(): { shapes: DerivedShape[]; positions: string[]; consts: Map<string, string> } {
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
  return { shapes, positions, consts: stringConsts };
}

const { shapes: SHAPES, positions: POSITIONS, consts: MODULE_CONSTS } = derive();

/**
 * The two position labels, READ OUT OF THE MODULE'S OWN CONSTANTS rather than indexed out of
 * `POSITIONS` by position. An index is an ordering assumption that silently re-aims every assertion
 * below the day a third position is added or the two are reordered.
 */
const NOTE_POSITION_LABEL = MODULE_CONSTS.get("NOTE_POSITION") ?? "";
const MANIFEST_POSITION_LABEL = MODULE_CONSTS.get("MANIFEST_POSITION_LABEL") ?? "";
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
    //
    // THE NOTE POSITION'S EXPECTED OUTCOME CHANGED IN PLAN 31-43 (`WR-41`), DELIBERATELY. It read
    // `expected write` until round 9, and `write` was unreachable at this position: the ordinary
    // staging plants exactly the bytes the writer would write, so every ordinary drive takes
    // `writeNoteFile`'s decided identical-bytes NO-OP branch. The expectation now names the outcome
    // the staging actually produces, and the driver reports it from the target's own state.
    expect(run.stdout).toMatch(/verdict=refuse, expected identical-no-op/);
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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 31-43 `WR-41` — A CONTROL THAT CANNOT OBSERVE ITS OWN EFFECT IS NOT A CONTROL.
//
// Round 8's review measured what plan 31-36's fix actually bought at the NOTE position: the driver
// set `verdict = "write"` on ANY non-throwing call, so asserting that verdict positively was
// asserting "the writer did not refuse" — which is what the clause-absence check it replaced already
// implied there. Worse, the ordinary staging plants bytes IDENTICAL to what the writer would write,
// so the drive passes through `writeNoteFile`'s decided identical-bytes NO-OP branch: nothing is
// written at the planted position, the disk is never inspected, and the row prints
// `ordinary outcome (correct)`.
//
// THE READING TAKEN BEFORE ANY OF THIS WAS CHANGED (plan 31-43, MOVEMENT 1), against the committed
// `scripts/context-io.js` at `072e542`, reproducing the module's own note-position staging:
//
//   note id     20260913T005235Z-qe-observation-7223f262      ordinary bytes 162
//   verdict     "write"                                        row printed `ordinary outcome (correct)`
//   before      size=162 ino=217606675 mtime=2026-09-13T00:52:35.370Z
//               sha256=2f60f0bbda45c28727c3f5a2d05b0976e368027def4192858d4984b5268f8c98
//   after       size=162 ino=217606675 mtime=2026-09-13T00:52:35.370Z
//               sha256=2f60f0bbda45c28727c3f5a2d05b0976e368027def4192858d4984b5268f8c98
//   changed     bytes no · size no · inode no · mtime no · ctime no
//
// So the cases below assert the two things that reading shows missing: the driver reports WHAT
// HAPPENED at the target, observed from the target's own state; and the harness reads the planted
// position itself after the drive rather than inferring its contents from the absence of a throw.
// Both are watched failing against MIRRORS whose difference from the live driver is asserted before
// any result is read.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The seam that replaces the note position's in-child driver with a named mirror. */
const MIRROR_DRIVER_ENV = "GRUGOPS_PLATFORM_SHAPES_MIRROR_DRIVER";

/** The note position's ordinary outcome: the staging plants what the writer would write. */
const NOTE_ORDINARY_OUTCOME = "identical-no-op";

/** The harness's own read of the planted position, quoted so both users spell it once. */
const CONTENTS_CLAUSE = "the planted position does not hold the bytes that were planted there";

interface ExportProbe {
  readonly ranTheGateAtImport: boolean;
  readonly parsed: boolean;
  readonly outcomes: string[];
  readonly labels: string[];
  readonly rowLabels: string[];
  readonly ordinaryLabel: string;
  readonly namedRefusalLabel: string;
  readonly mirrorKinds: string[];
  readonly derived: Array<{
    readonly outcome: string;
    readonly asMismatch: string;
    readonly asExpected: string;
    readonly asNamedRefusal: string;
  }>;
  readonly raw: string;
}

/**
 * READ THE COMMITTED ARTIFACT'S OWN EXPORTS, IN A CHILD, AND ASSERT THE IMPORT DID NOT RUN THE GATE.
 *
 * The vocabulary and the label derivation are the two things a test must not re-spell: a hand-typed
 * copy is the "set-literal drift" class this phase has already paid for twice. They are therefore
 * read out of `scripts/check-platform-shapes.js` — the artifact CI runs, not the source vitest
 * transpiles. The import is performed in a CHILD because a module that runs its CLI at load would
 * call `process.exit` inside the vitest worker; that the import is now inert is itself the premise
 * this probe asserts first, by checking the gate's banner is absent from the child's output.
 */
function probeExports(): ExportProbe {
  const src = [
    'import { pathToFileURL } from "node:url";',
    `const m = await import(pathToFileURL(${JSON.stringify(GATE_JS)}).href);`,
    "const outcomes = Array.from(m.PLATFORM_SHAPE_OUTCOMES ?? []);",
    "console.log('PROBE ' + JSON.stringify({",
    "  outcomes,",
    "  labels: Array.from(m.CONTROL_OUTCOME_LABELS ?? []),",
    "  rowLabels: Array.from(m.ROW_LABELS ?? []),",
    "  ordinaryLabel: m.ORDINARY_OUTCOME ?? '',",
    "  namedRefusalLabel: m.CONTROL_NAMED_REFUSAL_LABEL ?? '',",
    "  mirrorKinds: Array.from(m.MIRROR_DRIVER_KINDS ?? []),",
    "  derived: typeof m.controlOutcomeLabel === 'function'",
    "    ? outcomes.map((o) => ({",
    "        outcome: o,",
    "        asMismatch: m.controlOutcomeLabel(o, '__no-position-expects-this__', false),",
    "        asExpected: m.controlOutcomeLabel(o, o, false),",
    "        asNamedRefusal: m.controlOutcomeLabel(o, o, true),",
    "      }))",
    "    : [],",
    "}));",
  ].join("\n");
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", src], {
    encoding: "utf8",
    timeout: 120_000,
  });
  const stdout = r.stdout ?? "";
  const line = stdout.split("\n").find((l) => l.startsWith("PROBE "));
  let body: Partial<ExportProbe> = {};
  let parsed = false;
  if (line !== undefined) {
    try {
      body = JSON.parse(line.slice("PROBE ".length)) as Partial<ExportProbe>;
      parsed = true;
    } catch {
      parsed = false;
    }
  }
  return {
    ranTheGateAtImport: stdout.includes("[check_platform_shapes] platform="),
    parsed,
    outcomes: body.outcomes ?? [],
    labels: body.labels ?? [],
    rowLabels: body.rowLabels ?? [],
    ordinaryLabel: body.ordinaryLabel ?? "",
    namedRefusalLabel: body.namedRefusalLabel ?? "",
    mirrorKinds: body.mirrorKinds ?? [],
    derived: body.derived ?? [],
    raw: `${stdout}${r.stderr ?? ""}`,
  };
}

/** The gate's own failure lines, which are the record beside each printed row. */
function failLines(run: Run): string[] {
  return run.stdout
    .split("\n")
    .filter((l) => l.startsWith("  FAIL  "))
    .map((l) => l.slice("  FAIL  ".length));
}

/** The two digests the gate prints when a mirror is active, so difference is asserted, not assumed. */
function mirrorDigests(run: Run): { ordinary: string; mirror: string; differ: string } {
  const grab = (label: string): string => {
    const m = new RegExp(`${label}\\s+sha256=([0-9a-f]+)`).exec(run.stdout);
    return m?.[1] ?? "";
  };
  return {
    ordinary: grab("ordinary driver"),
    mirror: grab("mirror driver"),
    differ: /differ\s+(\S+)/.exec(run.stdout)?.[1] ?? "",
  };
}

/**
 * Run the gate under a named mirror, ASSERTING THE MIRROR DIFFERS FROM THE LIVE DRIVER FIRST.
 *
 * "Watched failing" means the artifact that produced the red is known to be a different artifact
 * from the one that ships. The gate prints both digests; nothing below reads a row until they have
 * been compared here.
 */
const MIRROR_RUNS = new Map<string, Run>();

function runMirror(kind: string): Run {
  let run = MIRROR_RUNS.get(kind);
  if (run === undefined) {
    run = runGate({ [MIRROR_DRIVER_ENV]: kind });
    MIRROR_RUNS.set(kind, run);
  }
  const d = mirrorDigests(run);
  expect(d.ordinary, `the gate did not print the ordinary driver's digest:\n${run.stdout}`).toMatch(
    /^[0-9a-f]{64}$/,
  );
  expect(d.mirror, `the gate did not print the mirror driver's digest:\n${run.stdout}`).toMatch(
    /^[0-9a-f]{64}$/,
  );
  expect(
    d.mirror,
    `the mirror "${kind}" is BYTE-IDENTICAL to the live driver, so a red it produces measures ` +
      "nothing about the live artifact.",
  ).not.toBe(d.ordinary);
  expect(d.differ, `the gate did not report the two drivers as differing:\n${run.stdout}`).toBe("yes");
  return run;
}

describe("31-43 WR-41 — the note-position CONTROL observes its own effect", () => {
  it("PREMISE: the gate's outcome vocabulary is readable, and importing it does NOT run the gate", () => {
    // The position labels this block anchors on are the module's own constants, and they must be
    // the same strings `drivePosition` is called with — otherwise every row filter below selects
    // nothing and every count is trivially satisfied.
    expect(POSITIONS, "the NOTE position label was not derived from the module").toContain(
      NOTE_POSITION_LABEL,
    );
    expect(POSITIONS, "the MANIFEST position label was not derived from the module").toContain(
      MANIFEST_POSITION_LABEL,
    );
    const probe = probeExports();
    expect(
      probe.ranTheGateAtImport,
      "importing scripts/check-platform-shapes.js RAN THE GATE. A module that calls process.exit at " +
        "load cannot be asked what its own vocabulary is, so every expectation about it would have " +
        `to be a second hand-typed spelling.\n${probe.raw}`,
    ).toBe(false);
    expect(probe.parsed, `the export probe printed nothing readable:\n${probe.raw}`).toBe(true);
    expect(
      probe.outcomes.length,
      `PLATFORM_SHAPE_OUTCOMES is not exported or is empty:\n${probe.raw}`,
    ).toBeGreaterThan(3);
    expect(new Set(probe.outcomes).size, "the outcome vocabulary repeats a member").toBe(
      probe.outcomes.length,
    );
    // The two outcomes THIS finding is about: a real write and an identical-bytes no-op must be
    // DIFFERENT members, or the driver cannot report which one happened.
    expect(probe.outcomes, "the vocabulary cannot tell a write from a no-op").toContain("write");
    expect(probe.outcomes, "the vocabulary cannot tell a write from a no-op").toContain(
      NOTE_ORDINARY_OUTCOME,
    );
  });

  it("PREMISE: the note position's expected CONTROL outcome is the identical-bytes NO-OP", () => {
    // Stated by the GATE, not by this file: under the pre-fix staging the control's failure message
    // names the outcome it expected. The staging plants exactly what the writer would write, so the
    // ordinary outcome at this position IS the no-op — and a control asserting anything weaker is
    // asserting that the writer did not refuse.
    const run = runGate({ [STALE_CONTROL_ENV]: "1" });
    expect(run.status, `the gate exited ${String(run.status)}:\n${run.stdout}`).toBe(1);
    expect(run.stdout).toContain(`expected ${NOTE_ORDINARY_OUTCOME}`);
  });

  it("MIRROR: a driver that reports the write value WITHOUT WRITING turns the note CONTROL red", () => {
    const run = runMirror("reports-write-without-writing");
    expect(
      run.status,
      `the gate exited ${String(run.status)} while its note-position driver reported a write it ` +
        `never performed. That is the WR-41 reading, unfixed.\n${run.stdout}`,
    ).toBe(1);
    const named = failLines(run).filter(
      (f) => f.startsWith(`${NOTE_POSITION_LABEL} / `) && f.includes("verdict=write"),
    );
    expect(
      named.length,
      `no failure named the note position's CONTROL and the outcome the mirror reported:\n${run.stdout}`,
    ).toBeGreaterThan(0);
    expect(named.join("\n")).toContain(`expected ${NOTE_ORDINARY_OUTCOME}`);
  });

  it("MIRROR: a driver that OVERWRITES the target and reports a no-op is caught by the harness's own read", () => {
    // The driver's report and the target's state disagree, and only a read of the planted position
    // can see it. This is the case that makes the disk read load-bearing rather than decorative.
    const run = runMirror("overwrites-the-target-and-reports-a-no-op");
    expect(
      run.status,
      `the gate exited ${String(run.status)} while the target's contents disagreed with the ` +
        `driver's own report.\n${run.stdout}`,
    ).toBe(1);
    expect(
      failLines(run).some(
        (f) => f.startsWith(`${NOTE_POSITION_LABEL} / `) && f.includes(CONTENTS_CLAUSE),
      ),
      `the harness did not read the planted position after the drive:\n${run.stdout}`,
    ).toBe(true);
  });

  it("CONTROL: under a note-position mirror the MANIFEST position is untouched and still ordinary", () => {
    // WR-31's fix is genuine at the manifest position — its verdict discriminates a fail-closed
    // refusal from the decider's own answer — so it is re-driven here rather than re-designed.
    const run = runMirror("reports-write-without-writing");
    const manifestControls = corpusRows(run).filter(
      (l) => l.startsWith(`  ${MANIFEST_POSITION_LABEL} `) && CONTROL_SHAPES.some((s) => l.includes(s)),
    );
    expect(manifestControls.length, `no manifest CONTROL rows:\n${run.driven.join("\n")}`).toBe(
      CONTROL_SHAPES.length,
    );
    for (const row of manifestControls) {
      expect(row.trimEnd().endsWith(ORDINARY_OUTCOME), `"${row.trim()}"`).toBe(true);
    }
    for (const f of failLines(run)) {
      expect(
        f.startsWith(`${MANIFEST_POSITION_LABEL} / `),
        `a note-position mirror moved the MANIFEST position: "${f}"`,
      ).toBe(false);
    }
  });

  it("CONTROL: the ordinary run still exits zero with every refusal row refusing by its own clause", () => {
    const run = runGate({});
    expect(run.status, `the gate exited ${String(run.status)}:\n${run.stdout}`).toBe(0);
    expect(run.stdout).toContain("ALL CHECKS PASSED");
    for (const shape of REFUSING_SHAPES) {
      for (const row of rowsFor(run, shape)) {
        expect(row.trimEnd().endsWith("named refusal"), `"${row.trim()}"`).toBe(true);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 31-43 `IN-20` — A RECORD NAMES THE CONDITION THAT IS TRUE.
//
// The printed label was `ordinary && !namedRefusal ? ORDINARY_OUTCOME : "REFUSED (wrong)"` — a
// two-way choice over one condition, so EVERY outcome that was not the expected one printed the
// refusal label. A crashed driver, a no-answer and a status-bearing answer all read `REFUSED
// (wrong)` in the table two verification rounds compare against: a WRONG DIAGNOSIS in the record,
// even though the failure entry beside it carried the true verdict. That is the class `D-31 (3)`
// already closed once in this repository, one module over, for a refusal MESSAGE.
//
// The label is now DERIVED from the outcome the driver reported, over the closed vocabulary Task 1
// published, with the label set's cardinality asserted against that vocabulary in BOTH directions —
// so a third outcome cannot arrive wearing a second outcome's name. Each label is driven by a case
// that produces exactly that outcome, live wherever a mirror can reach it and through the module's
// own exported derivation where no staging on this platform can.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The label a row printed, chosen from the module's OWN published set rather than parsed by hand. */
function labelOfRow(run: Run, position: string, shape: string, rowLabels: string[]): string {
  const row = corpusRows(run).find((l) => l.startsWith(`  ${position} `) && l.includes(shape));
  if (row === undefined) return "";
  const trimmed = row.trimEnd();
  const hits = rowLabels.filter((l) => trimmed.endsWith(l));
  // Exactly one, because no published label is a suffix of another — asserted in the premise below.
  return hits.length === 1 ? (hits[0] as string) : `UNRECOGNISED("${trimmed}")`;
}

/** Every corpus row's label must agree with the failure entries recorded beside it. */
function agreementProblems(run: Run, probe: ExportProbe): string[] {
  const problems: string[] = [];
  const expected = new Set([probe.ordinaryLabel, "named refusal"]);
  const fails = failLines(run);
  for (const row of corpusRows(run)) {
    const trimmed = row.trimEnd();
    const position = POSITIONS.find((p) => trimmed.startsWith(`  ${p} `));
    if (position === undefined) continue;
    const label = probe.rowLabels.filter((l) => trimmed.endsWith(l));
    if (label.length !== 1) {
      problems.push(`a row printed a label outside the module's published set: "${trimmed}"`);
      continue;
    }
    const printed = label[0] as string;
    // "Beside it" = a failure entry opening with this row's own `position / shape:` coordinate.
    // The position-level premises (`position: …`) carry no ` / ` and are correctly excluded.
    const beside = fails.filter((f) => {
      if (!f.startsWith(`${position} / `)) return false;
      const end = f.indexOf(": ");
      if (end < 0) return false;
      return trimmed.includes(f.slice(position.length + 3, end));
    });
    if (expected.has(printed)) {
      if (beside.length > 0) {
        problems.push(`"${trimmed}" printed an EXPECTED label beside ${String(beside.length)} failure(s)`);
      }
      continue;
    }
    if (beside.length === 0) {
      problems.push(`"${trimmed}" printed "${printed}" and NO failure was recorded beside it`);
      continue;
    }
    if (printed.startsWith("NOT ORDINARY (")) {
      const outcome = printed.slice("NOT ORDINARY (".length, -1);
      if (!beside.some((f) => f.includes(`verdict=${outcome}`))) {
        problems.push(
          `"${trimmed}" printed "${printed}" and no failure beside it names verdict=${outcome}`,
        );
      }
    }
  }
  return problems;
}

describe("31-43 IN-20 — the printed label is derived from the outcome that happened", () => {
  it("PREMISE: the label set is DERIVED from the vocabulary, with its cardinality asserted both ways", () => {
    const probe = probeExports();
    expect(probe.parsed, `the export probe printed nothing readable:\n${probe.raw}`).toBe(true);
    expect(
      probe.labels.length,
      "the CONTROL label set is not the ordinary label, the refusal label and one label per outcome",
    ).toBe(probe.outcomes.length + 2);
    expect(new Set(probe.labels).size, "the label set repeats a label").toBe(probe.labels.length);
    // FORWARD: every outcome has a label of its own.
    const byOutcome = new Map(probe.derived.map((d) => [d.outcome, d.asMismatch]));
    for (const outcome of probe.outcomes) {
      const label = byOutcome.get(outcome);
      expect(label, `outcome "${outcome}" has no label`).toBeDefined();
      expect(probe.labels, `the label for "${outcome}" is not in the published label set`).toContain(
        label,
      );
      expect(label, `the label for "${outcome}" does not name it`).toContain(outcome);
    }
    // BACKWARD: every label belongs to exactly one outcome, or is one of the two fixed labels.
    for (const label of probe.labels) {
      if (label === probe.ordinaryLabel || label === probe.namedRefusalLabel) continue;
      const owners = probe.derived.filter((d) => d.asMismatch === label);
      expect(owners.length, `the label "${label}" belongs to ${String(owners.length)} outcomes`).toBe(1);
    }
    // NO PUBLISHED LABEL IS A SUFFIX OF ANOTHER. Every row assertion in this file anchors on the
    // label ENDING the row, so a label that ended another would make those assertions ambiguous.
    for (const a of probe.rowLabels) {
      for (const b of probe.rowLabels) {
        if (a === b) continue;
        expect(b.endsWith(a), `the label "${a}" is a suffix of "${b}"`).toBe(false);
      }
    }
    expect(probe.rowLabels.length, "ROW_LABELS is not the CONTROL labels plus the refusal-row labels").toBe(
      probe.labels.length + 3,
    );
  });

  it("ONE CASE PER LABEL: the module's own derivation produces exactly that label for that outcome", () => {
    // The derivation is asked, per outcome, for all three of its arms. This is the case that covers
    // every label including the ones no staging on this platform can reach; the cases below then
    // drive the reachable ones end to end, through the artifact, against a seeded mirror.
    const probe = probeExports();
    expect(probe.derived.length, "the derivation was not exported").toBe(probe.outcomes.length);
    for (const d of probe.derived) {
      expect(d.asExpected, `the ordinary arm for "${d.outcome}"`).toBe(probe.ordinaryLabel);
      expect(d.asNamedRefusal, `the named-refusal arm for "${d.outcome}"`).toBe(probe.namedRefusalLabel);
      expect(d.asMismatch, `the mismatch arm for "${d.outcome}"`).toBe(`NOT ORDINARY (${d.outcome})`);
    }
  });

  it("MIRROR: a driver that CRASHES without printing does not print the refusal label", () => {
    // The heart of IN-20: this row read `REFUSED (wrong)` before this plan, for a driver that never
    // refused anything.
    const run = runMirror("crashes-without-printing");
    const probe = probeExports();
    expect(run.status, `the gate exited ${String(run.status)}:\n${run.stdout}`).toBe(1);
    const label = labelOfRow(run, NOTE_POSITION_LABEL, CONTROL_SHAPES[0] as string, probe.rowLabels);
    expect(label, "a crashed driver was recorded as a refusal").not.toBe(probe.namedRefusalLabel);
    expect(label).toBe("NOT ORDINARY (nonzero-exit)");
  });

  it("MIRROR: a driver that exits zero and reports NOTHING is named as that", () => {
    const run = runMirror("exits-silently-without-reporting");
    const probe = probeExports();
    expect(labelOfRow(run, NOTE_POSITION_LABEL, CONTROL_SHAPES[0] as string, probe.rowLabels)).toBe(
      "NOT ORDINARY (crashed)",
    );
  });

  it("MIRROR: a driver killed by a signal is named as that, not as a refusal", () => {
    const run = runMirror("signals-itself");
    const probe = probeExports();
    expect(labelOfRow(run, NOTE_POSITION_LABEL, CONTROL_SHAPES[0] as string, probe.rowLabels)).toBe(
      "NOT ORDINARY (signalled)",
    );
  });

  it("MIRROR: a call that returns with NOTHING at the target is named as that", () => {
    const run = runMirror("deletes-the-target-and-reports-what-it-observed");
    const probe = probeExports();
    expect(labelOfRow(run, NOTE_POSITION_LABEL, CONTROL_SHAPES[0] as string, probe.rowLabels)).toBe(
      "NOT ORDINARY (no-write)",
    );
  });

  it("MIRROR: a token outside the vocabulary is NAMED, never mapped onto a member", () => {
    // "a third outcome cannot arrive wearing a second outcome's name", driven.
    const run = runMirror("reports-a-token-outside-the-vocabulary");
    const probe = probeExports();
    expect(labelOfRow(run, NOTE_POSITION_LABEL, CONTROL_SHAPES[0] as string, probe.rowLabels)).toBe(
      "NOT ORDINARY (unclassifiable)",
    );
  });

  it("MIRROR: a CONTROL genuinely refused by this position's own clause prints the refusal label", () => {
    const run = runMirror("reports-the-positions-own-refusal-clause");
    const probe = probeExports();
    expect(labelOfRow(run, NOTE_POSITION_LABEL, CONTROL_SHAPES[0] as string, probe.rowLabels)).toBe(
      probe.namedRefusalLabel,
    );
  });

  it("MIRROR: the two WR-41 mirrors print the outcome they produced, not the refusal label", () => {
    const probe = probeExports();
    expect(
      labelOfRow(
        runMirror("reports-write-without-writing"),
        NOTE_POSITION_LABEL,
        CONTROL_SHAPES[0] as string,
        probe.rowLabels,
      ),
    ).toBe("NOT ORDINARY (write)");
    expect(
      labelOfRow(
        runMirror("overwrites-the-target-and-reports-a-no-op"),
        NOTE_POSITION_LABEL,
        CONTROL_SHAPES[0] as string,
        probe.rowLabels,
      ),
    ).toBe("NOT ORDINARY (identical-no-op)");
  });

  it("the pre-fix staging's two CONTROL rows name the outcomes they actually produced", () => {
    const run = runGate({ [STALE_CONTROL_ENV]: "1" });
    const probe = probeExports();
    expect(labelOfRow(run, NOTE_POSITION_LABEL, CONTROL_SHAPES[0] as string, probe.rowLabels)).toBe(
      "NOT ORDINARY (refuse)",
    );
    expect(
      labelOfRow(run, MANIFEST_POSITION_LABEL, CONTROL_SHAPES[0] as string, probe.rowLabels),
    ).toBe("NOT ORDINARY (fail-closed)");
  });

  it("EVERY row's label agrees with the failure entries recorded beside it, in every run", () => {
    // The review's point was that the true verdict was ALREADY there, beside a wrong label. So the
    // two are asserted to agree: an expected label with a failure beside it, or an unexpected label
    // with none, is itself reported.
    const probe = probeExports();
    const runs: Array<[string, Run]> = [
      ["ordinary", runGate({})],
      ["stale-control", runGate({ [STALE_CONTROL_ENV]: "1" })],
      ...probe.mirrorKinds.map((k): [string, Run] => [k, runMirror(k)]),
    ];
    const problems: string[] = [];
    for (const [name, run] of runs) {
      for (const p of agreementProblems(run, probe)) problems.push(`${name}: ${p}`);
    }
    expect(problems, `a printed label disagrees with the record beside it:\n${problems.join("\n")}`).toEqual(
      [],
    );
  });

  it("COVERAGE: every label was WATCHED live except the two this platform cannot stage", () => {
    // Derive what was watched rather than asserting a hand-kept list. The two undriven labels are
    // named here so a new label that cannot be driven fails this case instead of quietly joining
    // them. `answered` is the MANIFEST position's own ordinary outcome and no note-position mirror
    // can produce it at a position that expects it to be wrong; `no-answer` needs a child that
    // produces no exit code and no signal, which no driver mirror can arrange.
    const probe = probeExports();
    const DISCLOSED_UNDRIVEN = ["NOT ORDINARY (answered)", "NOT ORDINARY (no-answer)"];
    const watched = new Set<string>();
    const runs = [
      runGate({}),
      runGate({ [STALE_CONTROL_ENV]: "1" }),
      ...probe.mirrorKinds.map((k) => runMirror(k)),
    ];
    for (const run of runs) {
      for (const row of corpusRows(run)) {
        const trimmed = row.trimEnd();
        for (const l of probe.rowLabels) if (trimmed.endsWith(l)) watched.add(l);
      }
    }
    const unwatched = probe.labels.filter((l) => !watched.has(l)).sort();
    expect(
      unwatched,
      "the set of labels no run produced is not the disclosed pair. A label nobody has watched " +
        "being printed is a label nobody has watched at all.",
    ).toEqual([...DISCLOSED_UNDRIVEN].sort());
  });

  it("COVERAGE: every mirror kind the module publishes was driven by a case above", () => {
    // The set-literal rule applied to this file's own seams: derive the published set, assert the
    // driven set covers it. Runs last on purpose — it reads what the cases above drove.
    const probe = probeExports();
    expect(probe.mirrorKinds.length, "no mirror kinds are published").toBeGreaterThan(5);
    const undriven = probe.mirrorKinds.filter((k) => !MIRROR_RUNS.has(k));
    expect(undriven, `these published mirror kinds no case drives:\n${undriven.join("\n")}`).toEqual([]);
  });
});

// context-io-writer-set.test.ts — the note-writer set is DERIVED, COUNTED, and every member EXERCISED.
//
// WHY THIS FILE EXISTS. 31-VERIFICATION.md closed on a defect whose whole shape was reachability:
// the D-03 evidence-binding comparison was correct, lived in exactly one place, was covered by a
// green suite — and was not reached from `appendNote`, the writer two shipped workflows name BY
// NAME. A fabricated `gate_run` went in through that writer and came back with an id.
//
// The plan that fixed it wired one call. This file is what stops the NEXT writer from landing
// without one. It does not ask "does appendNote refuse?" — 31-05's cases in
// `scripts/context-io.test.ts` ask that. It asks the question that was never asked: WHICH
// FUNCTIONS CAN WRITE A NOTE AT ALL, and is every one of them bound?
//
// THE SET IS DERIVED, NOT TYPED OUT. This repository's second systemic failure class is a
// hand-maintained set literal that rots while the suite stays green (7 granted names, 0 adapter
// files). So the writer set is computed from `scripts/context-io.ts` by the TypeScript AST — every
// exported function whose transitive call closure reaches `writeNoteFile` — and BOTH its members
// and its cardinality are asserted. A writer added later moves both and turns this file red before
// it can ship unbound.
//
// WHAT IT DOES NOT CLOSE, NAMED RATHER THAN IMPLIED (PART FIVE):
//   • The derivation is SYNTACTIC. It resolves `foo(...)` by identifier; an alias
//     (`const f = writeNoteFile; f(...)`) or a computed member call is not seen. Widening the
//     matcher once per counter-example is the failure this repository has paid for, so the boundary
//     is written down. What stops such a call is the behavioural refusal, which PART THREE drives.
//   • `atomicWrite` is an EXPORTED, general-purpose file writer that takes its destination from its
//     caller and does NOT reach `writeNoteFile`. It is therefore not a note writer and nothing here
//     binds it. It is derived, asserted, and disclosed in `NON_NOTE_WRITER_RESIDUALS` — the accepted
//     T-31-25 residual, forbidden by workflows 16 and 18 rather than by code.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import ts from "typescript";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const CONTEXT_IO_TS = join(ROOT, "scripts", "context-io.ts");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

/** The committed compiled artifact — the thing a host actually runs, and so the thing driven here. */
const mod: typeof import("./context-io.js") = await import(pathToFileURL(CONTEXT_IO_JS).href);

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE EXPECTED SET AND THE EXPECTED COUNT — two constants on purpose.
//
// A single `expect(derived).toEqual([...])` reports a member change and a cardinality change as the
// same failure, and the second is the one that means "something landed that nobody exercised". They
// are asserted separately so the two failures read differently.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Every EXPORTED function of scripts/context-io.ts whose call closure reaches writeNoteFile. */
const EXPECTED_NOTE_WRITERS = Object.freeze([
  "admitAndAppend",
  "appendNote",
  "emitCheckpointNote",
  "emitVerdict",
]);

/** The cardinality of that set. A fifth writer is a decision, never a bumped constant. */
const EXPECTED_NOTE_WRITER_COUNT = 4;

/**
 * The DISCLOSED residual: an exported function that writes to the filesystem, takes its destination
 * from its caller, and is NOT a note writer (it does not reach writeNoteFile). Nothing in this file
 * binds it — a hand-authored context path could still reach it — which is exactly why it is named
 * here instead of being left as a silence. T-31-25, disposition `accept`.
 */
const NON_NOTE_WRITER_RESIDUALS = Object.freeze(["atomicWrite"]);

/** Occurrences of `appendNote(` across tracked NON-TEST sources under scripts/, hooks/, install/. */
const EXPECTED_APPEND_NOTE_CALL_SITES = 6;

/** Files under agent-factory/ whose prose names `appendNote`. */
const EXPECTED_AGENT_FACTORY_MENTIONS = 4;

/** The filesystem write primitives a direct caller reaches without going through a note writer. */
const FS_WRITE_PRIMITIVES = Object.freeze([
  "writeFileSync",
  "appendFileSync",
  "renameSync",
  "unlinkSync",
  "mkdirSync",
  "rmSync",
  "copyFileSync",
]);

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE — the derivation.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

interface SourceAnalysis {
  /** Top-level function declarations, name → the identifiers its body calls. */
  readonly calls: Map<string, Set<string>>;
  /** The subset of those names carrying an `export` modifier. */
  readonly exported: Set<string>;
}

function analyze(sourcePath: string): SourceAnalysis {
  const source = ts.createSourceFile(
    "context-io.ts",
    readFileSync(sourcePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const calls = new Map<string, Set<string>>();
  const exported = new Set<string>();
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
    const name = statement.name.text;
    const called = new Set<string>();
    const walk = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        called.add(node.expression.text);
      }
      ts.forEachChild(node, walk);
    };
    if (statement.body) walk(statement.body);
    calls.set(name, called);
    const modifiers = ts.getModifiers(statement) ?? [];
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) exported.add(name);
  }
  return { calls, exported };
}

/** The transitive closure of "calls" from one function, over the file's own declarations. */
function closureOf(analysis: SourceAnalysis, start: string): Set<string> {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const callee of analysis.calls.get(current) ?? []) {
      if (seen.has(callee)) continue;
      seen.add(callee);
      if (analysis.calls.has(callee)) stack.push(callee);
    }
  }
  return seen;
}

/**
 * THE DERIVATION: the exported functions of `sourcePath` that can reach the single note-file write
 * chokepoint. Sorted, so a member comparison is order-independent.
 */
function deriveNoteWriters(sourcePath: string): string[] {
  const analysis = analyze(sourcePath);
  return [...analysis.exported]
    .filter((name) => closureOf(analysis, name).has("writeNoteFile"))
    .sort();
}

describe("31-05 — the note-writer set is derived from the module, not typed out", () => {
  it("PREMISE: the parse actually yielded declarations and exports", () => {
    // ASSERT THE HARNESS'S OWN PREMISE. A derivation that silently parsed nothing returns an empty
    // set, and an empty set trivially satisfies every "no unbound writer" claim below. This
    // repository has recorded a FALSE verification-harness premise six times across four rounds, so
    // the premise is a failing assertion rather than an assumption.
    const analysis = analyze(CONTEXT_IO_TS);
    expect(
      analysis.calls.size,
      "PREMISE: the TypeScript parse of scripts/context-io.ts yielded ZERO top-level function " +
        "declarations, so every derivation below measured nothing at all",
    ).toBeGreaterThan(0);
    expect(
      analysis.exported.size,
      "PREMISE: the parse found ZERO exported functions, so the writer derivation had no candidates " +
        "and its emptiness would say nothing about the module",
    ).toBeGreaterThan(0);
    expect(
      analysis.calls.has("writeNoteFile"),
      "PREMISE: the write chokepoint `writeNoteFile` was not found as a top-level declaration, so " +
        "the closure test below could never be true for any candidate",
    ).toBe(true);
  });

  it("the derived writer set has the expected MEMBERS", () => {
    expect(deriveNoteWriters(CONTEXT_IO_TS)).toEqual([...EXPECTED_NOTE_WRITERS]);
  });

  it("the derived writer set has the expected COUNT", () => {
    expect(
      deriveNoteWriters(CONTEXT_IO_TS).length,
      "a note writer landed or left scripts/context-io.ts. A new one is a function that can put a " +
        "note into the shared verified context, so it needs an admission binding and a driver in " +
        "WRITER_EXERCISES below — it is a decision, never a bumped constant",
    ).toBe(EXPECTED_NOTE_WRITER_COUNT);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO — the derivation DISCRIMINATES.
//
// A structural assertion nobody has watched fail is not yet a control. The mirror is BUILT FROM the
// live source rather than from a fixture, so it cannot drift away from the thing it copies.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const SEEDED_WRITER = "seededImpostorNoteWriter";

function mirrorWithExtraWriter(): string {
  const dir = freshTmp("ctx-io-writer-mirror-");
  const path = join(dir, "context-io.ts");
  writeFileSync(
    path,
    readFileSync(CONTEXT_IO_TS, "utf8") +
      `\nexport function ${SEEDED_WRITER}(notesDir: string, id: string, text: string): void {\n` +
      `  writeNoteFile(notesDir, id, text);\n}\n`,
  );
  return path;
}

describe("31-05 — the writer derivation is a control, not a coincidence", () => {
  it("a SECOND exported writer in the module joins the derived set", () => {
    const derived = deriveNoteWriters(mirrorWithExtraWriter());
    expect(derived).toContain(SEEDED_WRITER);
    expect(derived).not.toEqual([...EXPECTED_NOTE_WRITERS]);
  });

  it("a SECOND exported writer moves the COUNT by exactly one", () => {
    const derived = deriveNoteWriters(mirrorWithExtraWriter()).length;
    expect(derived).not.toBe(EXPECTED_NOTE_WRITER_COUNT);
    // …by exactly one, so the difference is caused by the seeded function rather than by a
    // derivation that broke and started reporting some other number.
    expect(derived).toBe(EXPECTED_NOTE_WRITER_COUNT + 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE — every member of the derived set is exercised.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The verifier's fabricated provenance, verbatim: a gate run that never existed. */
const FABRICATED_RUN = "no-such-gate-run-ever-existed";
const FABRICATED_SHA = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";
const FABRICATED_CONTENT_HASH = "0123456789abcdef".repeat(4);

function fabricatedEvidence(): Parameters<typeof mod.appendNote>[1] {
  return {
    kind: "artifact-ref",
    by: "qe-e2e",
    at: "2026-09-07T09:00:00Z",
    verified_by: "",
    confidence: "high",
    refs: ["tests/e2e/uat/TICKET-1.uat.spec.ts"],
    supersedes: null,
    sha: FABRICATED_SHA,
    gate_run: FABRICATED_RUN,
    content_hash: FABRICATED_CONTENT_HASH,
  };
}

function noteFileCount(contextRoot: string, task: string): number {
  const dir = join(contextRoot, task, "notes");
  return existsSync(dir) ? readdirSync(dir).length : 0;
}

/**
 * How one writer is exercised.
 *
 *  • `behavioral` — the writer accepts a caller-supplied kind, so it CAN be asked to author an
 *    artifact-ref. It is driven with the fabricated provenance and must refuse, writing nothing.
 *  • `structural` — the writer composes its note's `kind` from a SOURCE LITERAL, so it cannot
 *    express the kind at all. The impossibility is asserted POSITIVELY off the parsed source rather
 *    than left as an untested silence: an unexercised member is precisely what this file removes.
 */
type Exercise =
  | { readonly mode: "behavioral"; readonly drive: (contextRoot: string, task: string) => string }
  | { readonly mode: "structural"; readonly composedKind: string };

const WRITER_EXERCISES: Record<string, Exercise> = {
  appendNote: {
    mode: "behavioral",
    drive: (contextRoot, task) => {
      try {
        mod.appendNote(task, fabricatedEvidence(), "body", contextRoot);
        return ""; // no refusal — the caller asserts this is a failure
      } catch (e) {
        return (e as Error).message;
      }
    },
  },
  admitAndAppend: {
    mode: "behavioral",
    drive: (contextRoot, task) => {
      // A fresh repoRoot with no config at all → the lean dial, so governance is not the decider.
      const result = mod.admitAndAppend(
        task,
        fabricatedEvidence(),
        "body",
        contextRoot,
        freshTmp("ctx-io-writer-repo-"),
      );
      return result.id === null ? result.findings.join("\n") : "";
    },
  },
  // STRUCTURAL IMPOSSIBILITY, NOT A BEHAVIOURAL REFUSAL. `emitVerdict` composes `kind: "finding"`
  // from a literal and takes no kind from its caller; there is no argument that makes it author an
  // artifact-ref. Asserted off the source below, and paired with the `artifact-ref` absence check.
  emitVerdict: { mode: "structural", composedKind: "finding" },
  // Likewise `emitCheckpointNote`: a fixed reserved-identity emitter over a roster-checked input.
  emitCheckpointNote: { mode: "structural", composedKind: "finding" },
};

/** The `kind:` string literals a named function composes, read off the parsed source. */
function composedKindLiterals(sourcePath: string, functionName: string): string[] {
  const source = ts.createSourceFile(
    "context-io.ts",
    readFileSync(sourcePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const found: string[] = [];
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || statement.name?.text !== functionName) continue;
    const walk = (node: ts.Node): void => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "kind" &&
        ts.isStringLiteral(node.initializer)
      ) {
        found.push(node.initializer.text);
      }
      ts.forEachChild(node, walk);
    };
    if (statement.body) walk(statement.body);
  }
  return found;
}

/** The source text of one named top-level function, for the absence check below. */
function functionSource(sourcePath: string, functionName: string): string {
  const text = readFileSync(sourcePath, "utf8");
  const source = ts.createSourceFile("context-io.ts", text, ts.ScriptTarget.Latest, true);
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === functionName) {
      return text.slice(statement.getStart(source), statement.getEnd());
    }
  }
  return "";
}

describe("31-05 — every derived note writer is exercised against fabricated provenance", () => {
  it("the exercise table's key set EQUALS the derived writer set", () => {
    // Asserted BEFORE any driver runs. A writer that landed with no driver would otherwise be
    // silently skipped by the loop below, which is the exact silence this file exists to remove.
    expect(
      Object.keys(WRITER_EXERCISES).sort(),
      "a derived note writer has no driver in WRITER_EXERCISES (or a driver names a function that " +
        "is no longer a writer). Every writer is exercised or the set is not covered",
    ).toEqual(deriveNoteWriters(CONTEXT_IO_TS));
  });

  for (const name of EXPECTED_NOTE_WRITERS) {
    it(`${name}: refuses the fabricated artifact-ref, or cannot express the kind at all`, () => {
      const exercise = WRITER_EXERCISES[name];
      expect(exercise, `${name} has no exercise`).toBeDefined();
      if (exercise.mode === "behavioral") {
        const contextRoot = freshTmp(`ctx-io-writer-${name}-`);
        const task = "writer-set-task";
        const before = noteFileCount(contextRoot, task);
        const refusal = exercise.drive(contextRoot, task);
        expect(
          refusal,
          `${name} accepted a fabricated gate_run — the admission authority was not reached`,
        ).not.toBe("");
        expect(refusal).toContain(FABRICATED_RUN);
        expect(
          noteFileCount(contextRoot, task),
          `${name} refused but left a file behind — "nothing is written" must be true of the disk`,
        ).toBe(before);
      } else {
        const literals = composedKindLiterals(CONTEXT_IO_TS, name);
        expect(
          literals,
          `${name}'s composed kind is no longer a single source literal, so it may now be able to ` +
            `author an artifact-ref and needs a behavioural driver instead of this assertion`,
        ).toEqual([exercise.composedKind]);
        expect(exercise.composedKind).not.toBe("artifact-ref");
        // A second, independent structural fact: the kind does not appear in the function at all.
        expect(
          functionSource(CONTEXT_IO_TS, name).includes("artifact-ref"),
          `${name} names the artifact-ref kind in its body — the structural impossibility claimed ` +
            `for it is no longer obviously true and must be re-derived`,
        ).toBe(false);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FOUR — the refusal is WATCHED FAILING.
//
// A control nobody has seen fail is a claim. The committed .js is mirrored, the authority call in
// appendNote is textually neutralized, and the fabricated artifact-ref is then WRITTEN in the
// mirror — which is what proves the live refusal is caused by that call and not by an unrelated check.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const AUTHORITY_CALL = "const admission = admit(task, text, contextRoot, repoRoot);";

describe("31-05 — neutralizing the authority call makes the fabricated evidence WRITE", () => {
  it("the neutralized mirror of the committed .js writes what the live module refuses", async () => {
    const original = readFileSync(CONTEXT_IO_JS, "utf8");
    // PREMISE: the anchor exists exactly once in the compiled artifact. A mutation that matched
    // nothing would produce an unmutated copy, and the "it writes" assertion below would then be
    // measuring the live module while claiming to measure a neutralized one.
    expect(
      original.split(AUTHORITY_CALL).length - 1,
      "PREMISE: the authority call was not found exactly once in the committed scripts/context-io.js, " +
        "so the neutralization below mutated nothing and this case proves nothing",
    ).toBe(1);
    const dir = freshTmp("ctx-io-neutralized-");
    const mutated = original
      .replace(AUTHORITY_CALL, "const admission = [];")
      // Point the mirror's relative imports at the REAL sibling modules, so the copy is the same
      // program minus one call rather than a differently-wired one.
      .replace(
        /from "\.\/([A-Za-z0-9._-]+\.js)"/g,
        (_m, file: string) => `from "${pathToFileURL(join(ROOT, "scripts", file)).href}"`,
      );
    expect(
      mutated.includes(AUTHORITY_CALL),
      "PREMISE: the authority call survived the neutralization",
    ).toBe(false);
    const mirrorPath = join(dir, "context-io.js");
    writeFileSync(mirrorPath, mutated);
    const neutralized: typeof import("./context-io.js") = await import(
      pathToFileURL(mirrorPath).href
    );
    const contextRoot = freshTmp("ctx-io-neutralized-ctx-");
    const task = "writer-set-task";
    const id = neutralized.appendNote(task, fabricatedEvidence(), "body", contextRoot);
    expect(id).toBeTruthy();
    expect(noteFileCount(contextRoot, task)).toBe(1);
    // …and the LIVE module refuses the identical call, which is the comparison that makes the
    // mirror meaningful rather than merely different.
    const liveRoot = freshTmp("ctx-io-neutralized-live-");
    expect(() => mod.appendNote(task, fabricatedEvidence(), "body", liveRoot)).toThrow(
      new RegExp(FABRICATED_RUN),
    );
    expect(noteFileCount(liveRoot, task)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FIVE — the reachability facts, computed and asserted rather than described.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function trackedFiles(...globs: string[]): string[] {
  const listed = spawnSync("git", ["ls-files", ...globs], { cwd: ROOT, encoding: "utf8" });
  expect(
    listed.status,
    "PREMISE: `git ls-files` did not run, so the reachability counts below were never measured — " +
      "a premise that could not be checked FAILS here rather than being skipped",
  ).toBe(0);
  return (listed.stdout ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

describe("31-05 — the reachability remainder is written down", () => {
  it("the appendNote call sites in tracked non-test sources are counted", () => {
    const sources = trackedFiles("scripts/*.ts", "hooks/*.ts", "install/*.ts").filter(
      (p) => !p.endsWith(".test.ts"),
    );
    expect(sources.length, "PREMISE: no tracked sources were listed at all").toBeGreaterThan(10);
    let total = 0;
    for (const rel of sources) {
      total += (readFileSync(join(ROOT, rel), "utf8").match(/appendNote\(/g) ?? []).length;
    }
    expect(
      total,
      "the number of places that can invoke the sanctioned note writer moved. Each one is a place " +
        "an artifact-ref could be authored, so the count is a decision rather than a bumped constant",
    ).toBe(EXPECTED_APPEND_NOTE_CALL_SITES);
  });

  it("the agent-factory documents that name appendNote are counted", () => {
    const docs = trackedFiles("agent-factory/**").filter((rel) =>
      readFileSync(join(ROOT, rel), "utf8").includes("appendNote"),
    );
    expect(
      docs.length,
      `the kit documents naming appendNote are [${docs.join(", ")}] — a document that names the ` +
        `sanctioned writer states what an agent may do with it, so a new one is prose that must be ` +
        `checked against the mechanism rather than a number to bump`,
    ).toBe(EXPECTED_AGENT_FACTORY_MENTIONS);
  });

  it("the non-note-writer filesystem residual is derived, and it is atomicWrite", () => {
    const analysis = analyze(CONTEXT_IO_TS);
    const nonWriters = [...analysis.exported].filter(
      (name) => !closureOf(analysis, name).has("writeNoteFile"),
    );
    // DIRECT callers of a filesystem write primitive: these write where their CALLER points them,
    // which is what makes them reachable from a hand-authored path.
    const direct = nonWriters
      .filter((name) =>
        FS_WRITE_PRIMITIVES.some((primitive) => (analysis.calls.get(name) ?? new Set()).has(primitive)),
      )
      .sort();
    expect(
      direct,
      "an exported non-note-writer gained a direct filesystem write. It is not bound by the " +
        "admission authority and nothing in this file binds it, so it belongs in " +
        "NON_NOTE_WRITER_RESIDUALS with a disposition, or it belongs behind writeNoteFile",
    ).toEqual([...NON_NOTE_WRITER_RESIDUALS]);
    // The wider transitive remainder is bounded too: the others reach the filesystem only through
    // a path THEY derive (the audit ledger, the rendered index), never one a caller hands them.
    const transitive = nonWriters.filter((name) =>
      FS_WRITE_PRIMITIVES.some((primitive) => closureOf(analysis, name).has(primitive)),
    );
    expect(
      transitive.length,
      "the set of exported non-note-writers that can reach the filesystem at all moved; the " +
        "residual disclosure above is stated against a remainder that is no longer the measured one",
    ).toBe(3);
  });

  it("the filesystem alphabet the residual is derived over is itself bounded", () => {
    // FS_WRITE_PRIMITIVES is the one hand-written set in this file, and a hand-written set that
    // nobody bounds is this repository's second systemic failure class: it rots while green. The
    // module can only reach the filesystem through what it IMPORTS, so the import clause is the
    // bound. Its cardinality is asserted rather than its contents, so a NEW node:fs binding — the
    // only way a new write primitive can appear — turns this file red and a human classifies it.
    const source = ts.createSourceFile(
      "context-io.ts",
      readFileSync(CONTEXT_IO_TS, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const bindings: string[] = [];
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
      if (statement.moduleSpecifier.text !== "node:fs") continue;
      const named = statement.importClause?.namedBindings;
      if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) bindings.push(element.name.text);
      }
    }
    expect(bindings.length, "PREMISE: no node:fs bindings were parsed at all").toBeGreaterThan(0);
    expect(
      bindings.length,
      `scripts/context-io.ts now imports [${bindings.join(", ")}] from node:fs. A binding was added ` +
        `or removed, so the write-primitive alphabet this file derives its residual over must be ` +
        `re-classified rather than assumed unchanged`,
    ).toBe(14);
  });
});

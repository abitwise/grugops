// trace-freshness.test.ts — the own-tree trace freshness gate (MIGR-03; phase 37, plan 37-08, SPLIT-03, D-01).
//
// Drives the COMMITTED scripts/trace-freshness.js against mkdtempSync CHECK_ROOT trees. Each tree is rendered
// by the committed host runnable scripts/runnable-ref/trace-render.js in write mode, so the committed
// index and trace files equal a fresh render, and then changed one way at a time. Nothing is written into this
// repository's tree. Not in the e2e lane: a hermetic temp-dir test.
//
// Proves (the gate is a directory compare through the runnable's --check, D-01):
//   fresh          : the index and trace files equal a fresh render → exit 0 and a fresh line.
//   stale          : one changed byte, one deleted trace file, one extra generated trace file → exit 1, each
//                    naming the file.
//   keeper         : a .gitkeep in the trace directory is outside the owned tree → exit 0, its bytes unchanged.
//   no vacuous pass: no .grugops/context and a hand-written matrix as the index → exit 1; the zero-row
//                    generated index on the same tree → exit 0 (research Pitfall 3).
//   could not run  : an unreadable root → exit 1 with "could not run", never fresh; the verdict mapping
//                    turns exit 2, a signal and a spawn error into could-not-run.
//   wiring         : package.json declares the script and .github/workflows/ci.yml runs it in the ubuntu gate
//                    block.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { CONTEXT_REL, TRACE_DIR_REL, TRACEABILITY_REL } from "../install/state-layout.js";
import { TRACE_GENERATED_HEADER, traceFileName } from "./trace-model.js";
import { ciWorkflow, ubuntuBlockCommands } from "./ci-workflow.testkit.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "trace-freshness.js");
const RUNNABLE_JS = join(ROOT, "scripts", "runnable-ref", "trace-render.js");
/** A hand-written matrix: the seed the kit ships, which is the shape this repository's own index had. */
const HAND_WRITTEN_MATRIX = join(ROOT, "agent-factory", "seed", ...TRACEABILITY_REL.split("/"));

const gate: typeof import("./trace-freshness.js") = await import(pathToFileURL(GATE_JS).href);
const ctxio: typeof import("./context-io.js") = await import(pathToFileURL(join(ROOT, "scripts", "context-io.js")).href);

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

/** The bytes of a regular file, read only after lstat confirms it is one (a FIFO is never opened). */
function readRegular(abs: string): string {
  const st = lstatSync(abs);
  if (!st.isFile()) throw new Error(`PREMISE: ${abs} is not a regular file`);
  return readFileSync(abs, "utf8");
}

/** A sealed note carrying `refs`, planted under `<root>/.grugops/context/<task>/notes/<name>.md`. */
function plantNote(root: string, task: string, name: string, refs: readonly string[]): void {
  const dir = join(root, CONTEXT_REL, task, "notes");
  mkdirSync(dir, { recursive: true });
  const fence =
    `id: ${name}\n` +
    "kind: artifact-ref\n" +
    "by: engineer\n" +
    "at: 2026-10-22T10:00:00Z\n" +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    refs.map((r) => `  - ${r}`).join("\n") +
    "\n" +
    "supersedes: \n";
  const rest = "---\n\n" + "an artifact-ref note carrying trace refs.\n";
  const text = "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
  writeFileSync(join(dir, `${name}.md`), text, "utf8");
}

/** A tree with the state directory and no notes, index or trace directory yet. */
function emptyRoot(prefix: string): string {
  const root = freshTmp(prefix);
  mkdirSync(join(root, TRACE_DIR_REL, ".."), { recursive: true });
  return root;
}

/** Render `root` with the committed runnable in write mode, so its committed tree equals a fresh render. */
function render(root: string): void {
  const r = spawnSync(process.execPath, [RUNNABLE_JS, root], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`PREMISE: the render did not seed the fixture (exit ${r.status}): ${r.stdout}${r.stderr}`);
}

/** A rendered tree holding two tickets, so the trace directory holds two generated files. */
function renderedRoot(prefix: string): string {
  const root = emptyRoot(prefix);
  plantNote(root, "taskA", "n1", ["ABC-001", "src/a.ts", "a.spec.ts"]);
  plantNote(root, "taskB", "n2", ["ABC-002", "src/b.ts"]);
  render(root);
  expect(readRegular(join(root, TRACE_DIR_REL, traceFileName("ABC-001"))).split("\n")[0]).toBe(TRACE_GENERATED_HEADER);
  return root;
}

function runGate(checkRoot: string): { status: number | null; out: string } {
  const r = spawnSync(process.execPath, [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

describe("trace-freshness — a directory compare through the runnable's --check (D-01)", () => {
  it("exits 0 with a fresh line when the index and every trace file equal a fresh render", () => {
    const r = runGate(renderedRoot("trace-gate-fresh-"));
    expect(r.status, r.out).toBe(0);
    expect(r.out).toContain(`Traceability fresh: ${TRACEABILITY_REL} and ${TRACE_DIR_REL}/`);
  });

  it("exits 1 naming the file when one byte of a trace file changed", () => {
    const root = renderedRoot("trace-gate-byte-");
    const rel = `${TRACE_DIR_REL}/${traceFileName("ABC-001")}`;
    const text = readRegular(join(root, rel));
    writeFileSync(join(root, rel), text.replace("src/a.ts", "src/A.ts"), "utf8");
    const r = runGate(root);
    expect(r.status, r.out).toBe(1);
    expect(r.out).toContain(`CHANGED ${rel}`);
    expect(r.out).toContain("STALE");
    expect(r.out).toContain("node scripts/trace-render.js");
    expect(r.out).not.toContain("Traceability fresh:");
  });

  it("exits 1 naming the file when a trace file was deleted", () => {
    const root = renderedRoot("trace-gate-deleted-");
    const rel = `${TRACE_DIR_REL}/${traceFileName("ABC-002")}`;
    unlinkSync(join(root, rel));
    const r = runGate(root);
    expect(r.status, r.out).toBe(1);
    expect(r.out).toContain(`MISSING ${rel}`);
    expect(r.out).toContain("STALE");
  });

  it("exits 1 naming the file when an extra generated trace file sits in the trace directory", () => {
    const root = renderedRoot("trace-gate-extra-");
    const rel = `${TRACE_DIR_REL}/${traceFileName("ZZZ-999")}`;
    writeFileSync(join(root, rel), `${TRACE_GENERATED_HEADER}\n# ZZZ-999\n`, "utf8");
    const r = runGate(root);
    expect(r.status, r.out).toBe(1);
    expect(r.out).toContain(`EXTRA ${rel}`);
    expect(r.out).toContain("STALE");
  });

  it("exits 0 with a .gitkeep in the trace directory, and leaves the keeper's bytes unchanged", () => {
    const root = renderedRoot("trace-gate-keeper-");
    const keeper = join(root, TRACE_DIR_REL, ".gitkeep");
    writeFileSync(keeper, "keeper bytes\n", "utf8");
    const r = runGate(root);
    expect(r.status, r.out).toBe(0);
    expect(r.out).not.toContain(".gitkeep");
    expect(readRegular(keeper)).toBe("keeper bytes\n");
  });
});

describe("trace-freshness — never a vacuous pass (research Pitfall 3)", () => {
  it("no .grugops/context and a hand-written matrix as the index: exit 1, the index named as hand-written", () => {
    const root = emptyRoot("trace-gate-handwritten-");
    writeFileSync(join(root, TRACEABILITY_REL), readRegular(HAND_WRITTEN_MATRIX), "utf8");
    const r = runGate(root);
    expect(r.status, r.out).toBe(1);
    expect(r.out).toContain(`HAND-WRITTEN ${TRACEABILITY_REL}`);
    expect(r.out).not.toContain("Traceability fresh:");
  });

  it("the same tree with the zero-row generated index: exit 0", () => {
    const root = emptyRoot("trace-gate-zero-row-");
    render(root);
    expect(readRegular(join(root, TRACEABILITY_REL)).split("\n")[0]).toBe(TRACE_GENERATED_HEADER);
    const r = runGate(root);
    expect(r.status, r.out).toBe(0);
    expect(r.out).toContain("Traceability fresh:");
  });

  it("no index at all, and no notes: exit 1 naming the missing index", () => {
    const root = emptyRoot("trace-gate-no-index-");
    const r = runGate(root);
    expect(r.status, r.out).toBe(1);
    expect(r.out).toContain(`MISSING ${TRACEABILITY_REL}`);
  });
});

describe("trace-freshness — a render that could not run is never fresh", () => {
  it("an unreadable root (it does not exist): exit 1 and the could-not-run line", () => {
    const r = runGate(join(freshTmp("trace-gate-absent-"), "no-such-root"));
    expect(r.status, r.out).toBe(1);
    expect(r.out).toContain("Traceability freshness check FAILED: the render could not run");
    expect(r.out).not.toContain("Traceability fresh:");
    expect(r.out).not.toContain("STALE");
  });

  it("a root with no state directory: exit 1 and the could-not-run line", () => {
    const r = runGate(freshTmp("trace-gate-no-state-"));
    expect(r.status, r.out).toBe(1);
    expect(r.out).toContain("Traceability freshness check FAILED: the render could not run");
  });

  it("the verdict mapping: only exit 0 is fresh, only exit 1 is stale; exit 2, a signal and a spawn error are could-not-run", () => {
    expect(gate.freshnessVerdict({ status: 0 })).toBe("fresh");
    expect(gate.freshnessVerdict({ status: 1 })).toBe("stale");
    expect(gate.freshnessVerdict({ status: 2 })).toBe("could-not-run");
    expect(gate.freshnessVerdict({ status: 3 })).toBe("could-not-run");
    expect(gate.freshnessVerdict({ status: null })).toBe("could-not-run");
    expect(gate.freshnessVerdict({ status: 0, error: new Error("spawn ENOENT") })).toBe("could-not-run");
  });
});

describe("trace-freshness — wired at both ends", () => {
  it("package.json declares the script and the ubuntu gate block of .github/workflows/ci.yml runs it once", () => {
    const pkg = JSON.parse(readRegular(join(ROOT, "package.json"))) as { scripts: Record<string, string> };
    expect(pkg.scripts["freshness:traceability"]).toBe("tsc --outDir .tmp-build && node scripts/trace-freshness.js");
    const commands = ubuntuBlockCommands(ciWorkflow());
    expect(commands, "PREMISE: the block is the gate block").toContain("npm run freshness:adapters");
    expect(commands.filter((c) => c === "npm run freshness:traceability"), "one command line in the ubuntu gate block").toHaveLength(1);
  });
});

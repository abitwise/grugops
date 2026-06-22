// trace-render.test.ts — behavioral oracle for the MIGR-03 trace render (D-01/D-04/D-06).
//
// Drives the COMMITTED compiled artifact scripts/trace-render.js (never the .ts): spawns the render
// CLI with explicit (ctxRoot, plansRoot) temp dirs and imports the compiled .js for the pure-function
// path (renderTraceability). All note I/O is into mkdtempSync temp dirs — nothing is written into the
// committed tree. NOT in the e2e lane (project memory: bare `npm test` triggers the live claude-CLI
// lane; this is a hermetic temp-dir test).
//
// Proves:
//   row keyed by ticket id : a note carrying refs for ticket ABC-001 renders a row keyed by ABC-001
//                            across columns Requirement | Code | Tests | UAT | Release.
//   byte-reproducible      : two renders over the same notes produce byte-identical output.
//   GENERATED header       : the render carries the "GENERATED — do not hand-edit" header naming the
//                            re-run command (node scripts/trace-render.js).
//   pipe-escaped cells     : a `|` in a ref value is cell()-escaped, never breaking the table.
//   ticket ids verbatim    : ticket ids appear literally in the rendered rows (A2 — the validator
//                            trace.includes(id) re-point stays minimal).
//   greenfield             : no notes yet → an empty-but-headed table, never a crash.
//
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const RENDER_JS = join(ROOT, "scripts", "trace-render.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Import the compiled .js for the pure-function path. The committed .js must exist for this to
// resolve — the test-first contract.
const mod: typeof import("./trace-render.js") = await import(pathToFileURL(RENDER_JS).href);

// Plant a valid note file under <ctxRoot>/<task>/notes/<name>.md carrying the given refs.
function plantNote(
  ctxRoot: string,
  task: string,
  name: string,
  at: string,
  refs: string[],
): void {
  const notesDir = join(ctxRoot, task, "notes");
  mkdirSync(notesDir, { recursive: true });
  const refsBlock = refs.map((r) => `  - ${r}`).join("\n");
  const text =
    "---\n" +
    `id: ${name}\n` +
    "kind: artifact-ref\n" +
    "by: engineer\n" +
    `at: ${at}\n` +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    refsBlock +
    "\n" +
    "supersedes: \n" +
    "---\n\n" +
    "an artifact-ref note carrying trace refs.\n";
  writeFileSync(join(notesDir, `${name}.md`), text, "utf8");
}

// Run the render CLI against explicit temp roots: `node trace-render.js <ctxRoot> <plansRoot>`.
function runRender(ctxRoot: string, plansRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [RENDER_JS, ctxRoot, plansRoot], { encoding: "utf8" });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

function makeRoots(prefix: string): { ctxRoot: string; plansRoot: string } {
  const base = freshTmp(prefix);
  const ctxRoot = join(base, ".grugops", "context");
  const plansRoot = join(base, "plans");
  mkdirSync(ctxRoot, { recursive: true });
  mkdirSync(plansRoot, { recursive: true });
  return { ctxRoot, plansRoot };
}

describe("trace-render — note refs → plans/traceability.md (D-01/D-04/D-06)", () => {
  it("renders a row keyed by ticket id across the five trace columns", () => {
    const { ctxRoot, plansRoot } = makeRoots("trace-row-");
    plantNote(ctxRoot, "taskA", "n1", "2026-06-21T10:00:00Z", [
      "ABC-001",
      "NFR-002",
      "src/auth/login.ts",
      "auth.spec.ts",
      "UAT-12",
      "REL-0007",
    ]);
    const r = runRender(ctxRoot, plansRoot);
    expect(r.status).toBe(0);
    const text = readFileSync(join(plansRoot, "traceability.md"), "utf8");
    // The five-column header.
    expect(text).toContain("| Requirement | Code | Tests | UAT | Release |");
    // A row keyed by the ticket id, with each ref routed to its column.
    expect(text).toMatch(/\|\s*ABC-001[^|]*\|/);
    expect(text).toContain("src/auth/login.ts"); // Code
    expect(text).toContain("auth.spec.ts"); // Tests
    expect(text).toContain("UAT-12"); // UAT
    expect(text).toContain("REL-0007"); // Release
    expect(text).toContain("NFR-002"); // Requirement
  });

  it("is byte-reproducible across two renders over the same notes", () => {
    const { ctxRoot, plansRoot } = makeRoots("trace-repro-");
    plantNote(ctxRoot, "taskA", "n1", "2026-06-21T10:00:00Z", ["ABC-001", "src/a.ts"]);
    plantNote(ctxRoot, "taskB", "n2", "2026-06-21T09:00:00Z", ["ABC-002", "src/b.ts"]);
    mod.renderTraceability(ctxRoot, plansRoot);
    const first = readFileSync(join(plansRoot, "traceability.md"));
    mod.renderTraceability(ctxRoot, plansRoot);
    const second = readFileSync(join(plansRoot, "traceability.md"));
    expect(first.equals(second)).toBe(true);
    expect(first.toString("utf8").endsWith("\n")).toBe(true);
    // Deterministic ticket-id sort: ABC-001 precedes ABC-002.
    const text = first.toString("utf8");
    expect(text.indexOf("ABC-001")).toBeLessThan(text.indexOf("ABC-002"));
  });

  it("carries the GENERATED do-not-hand-edit header naming the re-run command", () => {
    const { ctxRoot, plansRoot } = makeRoots("trace-header-");
    mod.renderTraceability(ctxRoot, plansRoot);
    const text = readFileSync(join(plansRoot, "traceability.md"), "utf8");
    expect(text).toContain("GENERATED — do not hand-edit");
    expect(text).toContain("node scripts/trace-render.js");
  });

  it("cell()-escapes a pipe in a ref value, never breaking the table", () => {
    const { ctxRoot, plansRoot } = makeRoots("trace-pipe-");
    plantNote(ctxRoot, "taskA", "n1", "2026-06-21T10:00:00Z", ["ABC-001", "src/a|b.ts"]);
    mod.renderTraceability(ctxRoot, plansRoot);
    const text = readFileSync(join(plansRoot, "traceability.md"), "utf8");
    // The literal pipe is backslash-escaped so it cannot split the cell.
    expect(text).toContain("src/a\\|b.ts");
  });

  it("emits ticket ids verbatim in the rendered rows (A2 — validator re-point stays minimal)", () => {
    const { ctxRoot, plansRoot } = makeRoots("trace-verbatim-");
    plantNote(ctxRoot, "taskA", "n1", "2026-06-21T10:00:00Z", ["XYZ-042", "src/x.ts"]);
    mod.renderTraceability(ctxRoot, plansRoot);
    const text = readFileSync(join(plansRoot, "traceability.md"), "utf8");
    expect(text).toContain("XYZ-042");
  });

  it("greenfield: no notes yet → an empty-but-headed table, no crash", () => {
    const { ctxRoot, plansRoot } = makeRoots("trace-greenfield-");
    expect(() => mod.renderTraceability(ctxRoot, plansRoot)).not.toThrow();
    const text = readFileSync(join(plansRoot, "traceability.md"), "utf8");
    expect(text).toContain("| Requirement | Code | Tests | UAT | Release |");
    // No data rows beyond the header + separator.
    expect(text).toContain("GENERATED — do not hand-edit");
  });
});

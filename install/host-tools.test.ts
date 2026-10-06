// host-tools.test.ts — the host-tool registry (install/host-tools.ts, phase 34 D-11) and the
// installer behaviour derived from it (plan 34-02).
//
// The detection cases drive the COMMITTED install/install.js (run `npm run build` first), under
// DRY_RUN, hermetically: each case gets its own scratch target and kit home under one realpath'd
// mkdtemp root, removed by afterAll. The per-row cases are generated from HOST_TOOLS itself, so a
// new registry row gets its detection case with no edit here; the row count is asserted against the
// HOST_TOOL_COUNT pin before the loop, so the loop cannot silently run short.
//
// Windows-safe (D-09): every filesystem path is built with `join`, only stdout lines are compared,
// and no case creates a symlink, changes a mode or renames over a file.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HOST_TOOLS, HOST_TOOL_COUNT } from "./host-tools.js";
import { runInstall } from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-host-tools-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

let caseNo = 0;
/** A fresh directory under SCRATCH for one case: an empty target, a kit home and a HOME. */
function freshCase(label: string): { target: string; kitHome: string; home: string } {
  caseNo += 1;
  const root = join(SCRATCH, `${caseNo}-${label}`);
  const target = join(root, "target");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  return { target, kitHome: join(root, "kit-home"), home };
}

/** Plant a registry row's detection path in `target`: a file when it ends `.json`, a directory otherwise. */
function plantSignal(target: string, detect: string): void {
  const p = join(target, ...detect.split("/"));
  if (detect.endsWith(".json")) writeFileSync(p, "{}\n");
  else mkdirSync(p, { recursive: true });
}

/** Run the committed installer under DRY_RUN and return its stdout lines; a failed run fails the case. */
function dryRunLines(c: { target: string; kitHome: string; home: string }): string[] {
  const r = runInstall(c.target, c.kitHome, [], { dryRun: true, home: c.home, timeoutMs: 60_000 });
  expect(r.error, `the installer could not be spawned: ${String(r.error)}`).toBeUndefined();
  expect(r.status, `DRY_RUN install exited ${String(r.status)}; stderr:\n${r.stderr}`).toBe(0);
  return r.stdout.split(/\r?\n/);
}

/** The one `tools detected: ` line of a run's stdout. */
function detectedLine(lines: readonly string[]): string {
  const hits = lines.filter((l) => l.startsWith("tools detected: "));
  expect(hits, "stdout carries exactly one `tools detected:` line").toHaveLength(1);
  return hits[0];
}

describe("detectTools() is derived from HOST_TOOLS (plan 34-02)", () => {
  // Asserted before the per-row loop, so a registry that lost or gained a row without moving the
  // pin fails here rather than running a short or long loop that still looks green.
  it("the registry has exactly HOST_TOOL_COUNT rows, so the per-row cases below run that many times", () => {
    expect(HOST_TOOLS.length).toBe(HOST_TOOL_COUNT);
  });

  for (const row of HOST_TOOLS) {
    it(`a target holding only \`${row.detect}\` is reported as \`tools detected: ${row.id}\``, () => {
      const c = freshCase(row.id);
      plantSignal(c.target, row.detect);
      expect(detectedLine(dryRunLines(c))).toBe(`tools detected: ${row.id}`);
    });
  }

  it("an empty target is reported as `tools detected: none-detected`", () => {
    const c = freshCase("empty");
    expect(detectedLine(dryRunLines(c))).toBe("tools detected: none-detected");
  });

  it("a target holding every row's signal reports every id, in registry order, joined by one space", () => {
    const c = freshCase("all");
    for (const row of HOST_TOOLS) plantSignal(c.target, row.detect);
    expect(detectedLine(dryRunLines(c))).toBe(`tools detected: ${HOST_TOOLS.map((t) => t.id).join(" ")}`);
  });

  // The existing hosts' output must stay byte-identical to the hand-written list detectTools()
  // replaced. This literal is that list's output, written once here as the regression anchor.
  it("the all-signals line is byte-identical to the pre-registry order with `pi` appended", () => {
    const c = freshCase("all-literal");
    for (const row of HOST_TOOLS) plantSignal(c.target, row.detect);
    expect(detectedLine(dryRunLines(c))).toBe("tools detected: claude codex gemini opencode copilot pi");
  });
});

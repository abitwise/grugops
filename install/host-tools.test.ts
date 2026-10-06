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
import { HOST_TOOLS, HOST_TOOL_COUNT, HOST_ADAPTER_KINDS, PI_PROMPT_REL } from "./host-tools.js";
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

describe("HOST_TOOLS integrity (plan 34-02)", () => {
  // Two-sided: a registry one row short or one row long of the pin both fail.
  it("HOST_TOOLS.length equals the HOST_TOOL_COUNT pin", () => {
    expect(HOST_TOOLS.length).toBe(HOST_TOOL_COUNT);
    expect(HOST_TOOL_COUNT).toBeGreaterThan(0);
  });

  for (const field of ["id", "name", "shortName", "detect"] as const) {
    it(`every row's \`${field}\` is unique across the registry`, () => {
      const values = HOST_TOOLS.map((t) => t[field]);
      expect(values).toHaveLength(HOST_TOOL_COUNT);
      expect(new Set(values).size, `duplicate ${field} in ${JSON.stringify(values)}`).toBe(values.length);
      for (const v of values) expect(v.length, `an empty ${field}`).toBeGreaterThan(0);
    });
  }

  it("every row's adapter is a HOST_ADAPTER_KINDS member, and every member is used by at least one row", () => {
    const kinds: readonly string[] = HOST_ADAPTER_KINDS;
    for (const t of HOST_TOOLS) expect(kinds, `${t.id}'s adapter ${t.adapter}`).toContain(t.adapter);
    const used = new Set(HOST_TOOLS.map((t) => t.adapter));
    for (const k of HOST_ADAPTER_KINDS) expect(used.has(k), `adapter kind ${k} is used by no row`).toBe(true);
    expect(new Set(kinds).size, "HOST_ADAPTER_KINDS carries a duplicate").toBe(kinds.length);
  });

  it("exactly one row dispatches by `spawn`, and it is `claude`; every other row is `sequential`", () => {
    const spawn = HOST_TOOLS.filter((t) => t.dispatch === "spawn");
    expect(spawn.map((t) => t.id)).toEqual(["claude"]);
    for (const t of HOST_TOOLS) expect(["spawn", "sequential"], `${t.id}'s dispatch`).toContain(t.dispatch);
  });

  it("every row's entryFiles is non-empty and contains AGENTS.md", () => {
    for (const t of HOST_TOOLS) {
      expect(t.entryFiles.length, `${t.id} has no entry file`).toBeGreaterThan(0);
      expect(t.entryFiles, `${t.id}'s entry files`).toContain("AGENTS.md");
    }
  });

  it("every row's detect path is a target-root-relative POSIX path, never a user-level location", () => {
    for (const t of HOST_TOOLS) {
      expect(t.detect, `${t.id}'s detect path`).not.toMatch(/^[/~]|^[A-Za-z]:|\\|(^|\/)\.\.(\/|$)/);
    }
  });

  it("PI_PROMPT_REL sits under the Pi row's detect path and ends with .md", () => {
    const pi = HOST_TOOLS.filter((t) => t.id === "pi");
    expect(pi, "the registry has one `pi` row").toHaveLength(1);
    expect(PI_PROMPT_REL.startsWith(`${pi[0].detect}/`), `${PI_PROMPT_REL} is not under ${pi[0].detect}/`).toBe(true);
    expect(PI_PROMPT_REL.endsWith(".md")).toBe(true);
  });

  it("a DRY_RUN install prints one closing line ending `get documentation only.` that names every non-spawn host, in registry order", () => {
    const lines = dryRunLines(freshCase("closing-line"));
    const closing = lines.filter((l) => l.endsWith("get documentation only."));
    expect(closing, "stdout carries exactly one closing host line").toHaveLength(1);
    const line = closing[0];
    const nonSpawn = HOST_TOOLS.filter((t) => t.dispatch !== "spawn").map((t) => t.name);
    expect(nonSpawn.length).toBeGreaterThan(0);
    const listed = /\(([^()]*)\) get documentation only\.$/.exec(line);
    expect(listed, `the closing line names no parenthesised host list: ${line}`).not.toBeNull();
    expect(listed![1]).toBe(nonSpawn.join(", "));
    for (const t of HOST_TOOLS.filter((x) => x.dispatch === "spawn")) expect(listed![1]).not.toContain(t.name);
    // No count word: the line is derived, so it can never carry a stale number.
    expect(line).not.toMatch(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i);
  });
});

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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
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

// ── Plan 34-06 (D-11): every per-host table in the docs equals the registry, two-sided. ────────────
//
// THE FILE SET IS DERIVED, NEVER LISTED. It is every tracked markdown file outside the declared
// exclusions that carries a table row whose first cell is a bold registry name, plus one declared
// extra scanned by the same rule. A doc that grows a per-host table joins the set by that change
// alone; a floor asserts the set still holds the three files that carry one today, so a table that
// disappears (or a CLAUDE.md regeneration that drops it) fails red rather than leaving the set.
//
// A PER-HOST TABLE is a run of consecutive lines starting with `|` that holds at least one bold
// registry-name first cell. In each such table the bold first cells must equal the registry names
// exactly, one row each: a missing host, a duplicate and a bold row naming anything else all fail,
// naming the file and the name. Where the table's header has an `Entry file it reads` column, each
// host's cell must name (in backticks) every entry file the registry lists for that host.
//
// Windows-safe (D-09): files are listed with `git ls-files -z` through spawnSync and split on NUL,
// paths are joined per segment, and lines are split on `\r?\n`.
describe("every per-host table equals the registry (plan 34-06)", () => {
  const REPO = join(import.meta.dirname, "..");
  /** Declared exclusions: history, audit records, frozen spec inputs, and the changelog. */
  const EXCLUDED_PREFIXES = [".planning/", "docs/audit/", "docs/initial/"];
  const EXCLUDED_FILES = ["CHANGELOG.md"];
  /**
   * The declared extra, scanned by the same rule as the derived files. CLAUDE.md's stack section is
   * marked `GSD:stack-start source:research/STACK.md`, so a per-host table written there would
   * regenerate into CLAUDE.md. It carries none today (the table left it in commit 84b791bf, the
   * v1.1 research rewrite), so it joins the set only if one is written there.
   */
  const DECLARED_EXTRAS = [".planning/research/STACK.md"];
  /** The files that carry a per-host table today; the derived set must contain each. */
  const FLOOR = ["agent-factory/packaging/adapters.md", "agent-factory/README.md", "CLAUDE.md"];
  const NAMES = HOST_TOOLS.map((t) => t.name);
  const BOLD_FIRST_CELL = /^\|\s*\*\*(.+?)\*\*\s*\|/;

  function readRepo(rel: string): string {
    return readFileSync(join(REPO, ...rel.split("/")), "utf8");
  }

  /** The per-host tables of one document: each is its header line plus its lines. */
  function hostTables(text: string): { header: string; lines: string[] }[] {
    const out: { header: string; lines: string[] }[] = [];
    let block: string[] = [];
    const flush = (): void => {
      const holdsHost = block.some((l) => {
        const m = BOLD_FIRST_CELL.exec(l);
        return m !== null && NAMES.includes(m[1].trim());
      });
      if (holdsHost) out.push({ header: block[0], lines: block });
      block = [];
    };
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith("|")) block.push(line);
      else flush();
    }
    flush();
    return out;
  }

  function trackedMarkdown(): string[] {
    const r = spawnSync("git", ["ls-files", "-z", "--", "*.md"], { cwd: REPO, encoding: "utf8" });
    expect(r.status, `git ls-files failed: ${r.stderr}`).toBe(0);
    return r.stdout.split("\0").filter((p) => p !== "");
  }

  function derivedSet(): string[] {
    const candidates = trackedMarkdown().filter(
      (p) => !EXCLUDED_PREFIXES.some((x) => p.startsWith(x)) && !EXCLUDED_FILES.includes(p),
    );
    return [...candidates, ...DECLARED_EXTRAS].filter((p) => hostTables(readRepo(p)).length > 0);
  }

  const cells = (row: string): string[] => row.split("|").slice(1, -1).map((c) => c.trim());

  it("the derived table set holds at least the files that carry a per-host table today", () => {
    const set = derivedSet();
    for (const f of FLOOR) expect(set, `${f} no longer carries a per-host table`).toContain(f);
    // The candidate listing itself is non-empty and large, so the derivation is not vacuous.
    expect(trackedMarkdown().length).toBeGreaterThan(FLOOR.length);
  });

  it("in every per-host table, the bold first cells equal the registry names exactly, one row each", () => {
    const problems: string[] = [];
    let tablesChecked = 0;
    for (const file of derivedSet()) {
      for (const table of hostTables(readRepo(file))) {
        tablesChecked += 1;
        const bold = table.lines
          .map((l) => BOLD_FIRST_CELL.exec(l)?.[1].trim())
          .filter((n): n is string => n !== undefined);
        for (const name of NAMES) {
          const n = bold.filter((b) => b === name).length;
          if (n !== 1) problems.push(`${file}: ${n} row(s) for registry host "${name}" (expected 1)`);
        }
        for (const b of bold) {
          if (!NAMES.includes(b)) problems.push(`${file}: bold row "${b}" is not a registry host`);
        }
      }
    }
    expect(problems).toEqual([]);
    expect(tablesChecked).toBeGreaterThanOrEqual(FLOOR.length);
  });

  it("where a per-host table has an `Entry file it reads` column, each host's cell names every registry entry file", () => {
    const problems: string[] = [];
    let cellsChecked = 0;
    for (const file of derivedSet()) {
      for (const table of hostTables(readRepo(file))) {
        const col = cells(table.header).indexOf("Entry file it reads");
        if (col < 0) continue;
        for (const line of table.lines) {
          const name = BOLD_FIRST_CELL.exec(line)?.[1].trim();
          const host = HOST_TOOLS.find((t) => t.name === name);
          if (host === undefined) continue;
          const cell = cells(line)[col] ?? "";
          cellsChecked += 1;
          for (const f of host.entryFiles) {
            if (!cell.includes(`\`${f}\``)) {
              problems.push(`${file}: the ${host.name} entry-file cell does not name \`${f}\``);
            }
          }
        }
      }
    }
    expect(problems).toEqual([]);
    // Every FLOOR file's table has the column today, so every host is checked in each of them.
    expect(cellsChecked).toBeGreaterThanOrEqual(FLOOR.length * HOST_TOOLS.length);
  });
});

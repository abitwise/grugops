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
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import ts from "typescript";
import {
  HOST_TOOLS,
  HOST_TOOL_COUNT,
  HOST_ADAPTER_KINDS,
  PI_PROMPT_REL,
  AGENT_SKILL_REL,
  OPENCODE_COMMAND_REL,
  KIT_ROUTE,
  POINTER_LINE,
  START_HERE_SENTENCE,
  carriesKitRoute,
  agentFlag,
  hostForFlag,
  ROUTE_POINTERS,
  ADAPTER_FOOTPRINT,
  entryOwners,
  routeCarriers,
  reachVia,
  strandedBy,
  type HostTool,
  type HostAdapterKind,
  type RouteFacts,
} from "./host-tools.js";
import { BLOCK_RELS } from "./install-marker.js";
import { ENTRY_SHAPES } from "../scripts/generate-host-entries.js";
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

/**
 * Plant a registry row's detection path in `target`: a file when its last segment has an extension after its first
 * character (`opencode.json`, Copilot's `.github/copilot-instructions.md`, D-24), with its parent directories; a
 * directory otherwise (`.claude`, `.gemini`, `.pi`).
 */
function plantSignal(target: string, detect: string): void {
  const p = join(target, ...detect.split("/"));
  const last = detect.split("/").pop() ?? detect;
  if (/^.+\.[a-z]+$/.test(last)) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, last.endsWith(".json") ? "{}\n" : "# the user's own file\n");
  } else mkdirSync(p, { recursive: true });
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

  // D-24: a bare `.github` (workflows, issue templates) is in most GitHub repositories and is no Copilot signal.
  it("a target holding only a bare `.github/` directory is reported as `tools detected: none-detected` (D-24)", () => {
    const c = freshCase("bare-github");
    mkdirSync(join(c.target, ".github", "workflows"), { recursive: true });
    expect(detectedLine(dryRunLines(c))).toBe("tools detected: none-detected");
  });

  it("an empty target is reported as `tools detected: none-detected`", () => {
    const c = freshCase("empty");
    expect(detectedLine(dryRunLines(c))).toBe("tools detected: none-detected");
  });

  it("a target holding every row's signal reports every id, in registry order, joined by one space", () => {
    const c = freshCase("all");
    for (const row of HOST_TOOLS) plantSignal(c.target, row.detect);
    expect(detectedLine(dryRunLines(c))).toBe(`tools detected: ${HOST_TOOLS.map((t) => t.id).join(" ")}`);
  });

  // The existing hosts' output must keep the order of the hand-written detection detectTools() replaced. The anchor
  // is that detection's signal order (with `.pi` appended by phase 34), written once here; the expected ids are read
  // from the registry by signal, so a renamed row (phase 34.1 D-12 renamed the `.gemini` row) moves no literal here,
  // and a reordered registry still fails.
  it("the all-signals line keeps the pre-registry detection order (by signal), with `.pi` appended", () => {
    // Copilot's signal is its instructions file since phase 34.1 (D-24); its position in the order is unchanged.
    const PRE_REGISTRY_SIGNAL_ORDER = [".claude", ".codex", ".gemini", "opencode.json", ".github/copilot-instructions.md", ".pi"];
    expect(PRE_REGISTRY_SIGNAL_ORDER, "the anchor names every registry signal once").toHaveLength(HOST_TOOL_COUNT);
    const ids = PRE_REGISTRY_SIGNAL_ORDER.map((signal) => {
      const rows = HOST_TOOLS.filter((t) => t.detect === signal);
      expect(rows, `one registry row is detected by ${signal}`).toHaveLength(1);
      return rows[0].id;
    });
    const c = freshCase("all-literal");
    for (const row of HOST_TOOLS) plantSignal(c.target, row.detect);
    expect(detectedLine(dryRunLines(c))).toBe(`tools detected: ${ids.join(" ")}`);
  });

  // Phase 34.1 D-12, D-13, D-22: the `.gemini`-detected row is Antigravity CLI, and its registry entry says, beside the
  // detect value, that the signal is `UNKNOWN - verify` (no project-level `.gemini/` use by Antigravity CLI was found).
  it("the `.gemini`-detected row is Antigravity CLI, and the registry source marks that detect signal `UNKNOWN - verify` beside it", () => {
    const rows = HOST_TOOLS.filter((t) => t.detect === ".gemini");
    expect(rows, "one row is detected by .gemini").toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "antigravity", name: "Antigravity CLI", shortName: "Antigravity", adapter: "agent-skill", dispatch: "sequential" });
    expect(rows[0].entryFiles).toEqual(["AGENTS.md"]);
    // The row's own object literal in install/host-tools.ts: from the `{` that opens it to the `}` that closes it.
    const src = readFileSync(join(import.meta.dirname, "host-tools.ts"), "utf8");
    const at = src.indexOf(`id: "${rows[0].id}",`);
    expect(at, "the row's id line is in host-tools.ts").toBeGreaterThan(0);
    const open = src.lastIndexOf("\n  {\n", at);
    const close = src.indexOf("\n  },", at);
    expect(open, "the row's opening brace").toBeGreaterThan(0);
    expect(close, "the row's closing brace").toBeGreaterThan(at);
    const rowText = src.slice(open, close);
    expect(rowText).toContain('detect: ".gemini",');
    expect(rowText).toContain("`.gemini` is UNKNOWN - verify");
    expect(rowText.split("\n  {\n").length, "the slice holds exactly one row").toBe(2);
  });
});

describe("per-agent flags (phase 34.1, D-01)", () => {
  // The flag set is derived from the registry, one flag per row, and the count is asserted against the pin so a
  // short or empty set cannot pass a loop vacuously.
  it("the agent flag set has HOST_TOOL_COUNT members, each `--` followed by a registry id", () => {
    const flags = new Set(HOST_TOOLS.map(agentFlag));
    expect(`agent flags: ${flags.size}`).toBe(`agent flags: ${HOST_TOOL_COUNT}`);
    for (const host of HOST_TOOLS) expect(agentFlag(host)).toBe(`--${host.id}`);
  });

  it("hostForFlag round-trips every agent flag to its own row", () => {
    let seen = 0;
    for (const host of HOST_TOOLS) {
      expect(hostForFlag(agentFlag(host))).toBe(host);
      seen++;
    }
    expect(seen).toBe(HOST_TOOL_COUNT);
  });

  // No all-agents flag (D-01), and no loose matching: a near spelling is an unknown argument, not an agent flag.
  it("hostForFlag returns null for an all-agents spelling and for near spellings of a flag", () => {
    const codex = HOST_TOOLS.find((h) => h.id === "codex");
    expect(codex, "the codex row the near spellings below are built from").toBeDefined();
    for (const arg of ["--all", "--every", "--", "-codex", "--Codex", "--codex=1", " --codex", "codex", ""]) {
      expect(`${JSON.stringify(arg)}: ${hostForFlag(arg)?.id ?? null}`).toBe(`${JSON.stringify(arg)}: null`);
    }
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

  // Plan 34.1-01 (D-08, D-11): every pointer path the registry places is either a whole-file entry the generator
  // renders (its kind has an ENTRY_SHAPES shape) or a sentinel-block carrier install appends to (BLOCK_RELS,
  // install-marker.ts), never both and never neither; both sets are derived, and their union is every pointer.
  it("every ROUTE_POINTERS value is a path the generator renders or a block carrier, exactly one of the two", () => {
    const rendered = new Set(HOST_ADAPTER_KINDS.flatMap((k) => (ENTRY_SHAPES[k] === null ? [] : [...ROUTE_POINTERS[k]])));
    const all = [...new Set(Object.values(ROUTE_POINTERS).flat())];
    expect(rendered.size, "premise: the generator renders some pointer").toBeGreaterThan(0);
    for (const rel of all) {
      const isBlock = BLOCK_RELS.includes(rel);
      expect(rendered.has(rel) !== isBlock, `${rel}: rendered ${rendered.has(rel)}, block carrier ${isBlock}`).toBe(true);
    }
    for (const rel of BLOCK_RELS) expect(all, `block carrier ${rel} is no ROUTE_POINTERS value`).toContain(rel);
    for (const k of HOST_ADAPTER_KINDS) {
      if (ENTRY_SHAPES[k] !== null) expect(ROUTE_POINTERS[k], `${k} has a shape, so exactly one path`).toHaveLength(1);
    }
  });

  it("AGENT_SKILL_REL is the pointer of exactly the rows whose adapter is `agent-skill`, and OPENCODE_COMMAND_REL of exactly the `opencode-command` rows", () => {
    for (const [rel, kind] of [
      [AGENT_SKILL_REL, "agent-skill"],
      [OPENCODE_COMMAND_REL, "opencode-command"],
    ] as const) {
      const holders = HOST_TOOLS.filter((h) => ROUTE_POINTERS[h.adapter].includes(rel)).map((h) => h.id);
      const ofKind = HOST_TOOLS.filter((h) => h.adapter === kind).map((h) => h.id);
      expect(ofKind.length, `premise: some row has adapter ${kind}`).toBeGreaterThan(0);
      expect(holders, rel).toEqual(ofKind);
      expect(rel.startsWith(".gemini/"), `${rel} is under .gemini/ (refuted by D-20)`).toBe(false);
    }
  });

  it("POINTER_LINE is START_HERE_SENTENCE, one space, then KIT_ROUTE, on one line", () => {
    expect(POINTER_LINE).toBe(`${START_HERE_SENTENCE} ${KIT_ROUTE}`);
    expect(carriesKitRoute(POINTER_LINE)).toBe(true);
    expect(POINTER_LINE.includes("\n")).toBe(false);
  });

  it("PI_PROMPT_REL sits under the Pi row's detect path and ends with .md", () => {
    const pi = HOST_TOOLS.filter((t) => t.id === "pi");
    expect(pi, "the registry has one `pi` row").toHaveLength(1);
    expect(PI_PROMPT_REL.startsWith(`${pi[0].detect}/`), `${PI_PROMPT_REL} is not under ${pi[0].detect}/`).toBe(true);
    expect(PI_PROMPT_REL.endsWith(".md")).toBe(true);
  });

  // D-21 (plan 34.1-08): every row carries the invocation its documentation gives, and Codex's is `$grugops`, never a
  // slash command (Codex does not turn skills into slash commands).
  it("every row's `invoke` is non-empty; the codex row's names `$grugops` and no `/grugops`", () => {
    let seen = 0;
    for (const t of HOST_TOOLS) {
      expect(t.invoke.trim().length, `${t.id} has no invoke text`).toBeGreaterThan(0);
      seen++;
    }
    expect(seen).toBe(HOST_TOOL_COUNT);
    const codex = HOST_TOOLS.filter((t) => t.id === "codex");
    expect(codex, "the registry has one `codex` row").toHaveLength(1);
    expect(codex[0].invoke).toContain("$grugops");
    expect(codex[0].invoke).not.toContain("/grugops");
  });

  // D-21 (plan 34.1-08): the closing notes give one line per chosen agent, naming what the install record holds for
  // it and its `invoke` text, then one line saying no invocation was run on a live host. Derived from the registry.
  it("an install for every agent closes with one line per agent ending in its invoke text, and the UNKNOWN - verify line", () => {
    const c = freshCase("closing-lines");
    const r = runInstall(c.target, c.kitHome, [], { home: c.home, timeoutMs: 120_000 });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const notes = r.stdout.split(/\r?\n/);
    let seen = 0;
    for (const t of HOST_TOOLS) {
      const mine = notes.filter((l) => l.startsWith(`  ${t.name}: `));
      expect(mine, `closing lines for ${t.name}\n${r.stdout}`).toHaveLength(1);
      expect(mine[0].endsWith(` — ${t.invoke}`), mine[0]).toBe(true);
      for (const rel of ROUTE_POINTERS[t.adapter]) expect(mine[0], `${t.name}'s line names ${rel}`).toContain(rel);
      seen++;
    }
    expect(seen).toBe(HOST_TOOL_COUNT);
    const unknown = notes.filter((l) => l.includes("grugops has not run them on a live host (UNKNOWN - verify)"));
    expect(unknown, r.stdout).toHaveLength(1);
    expect(r.stdout, "the retired documentation-only line is gone").not.toContain("get documentation only.");
  });

  it("a --codex install closes with Codex CLI's line only, naming the agent skill and `$grugops`", () => {
    const c = freshCase("closing-codex");
    const codex = HOST_TOOLS.filter((t) => t.id === "codex")[0];
    const r = runInstall(c.target, c.kitHome, [agentFlag(codex)], { home: c.home, timeoutMs: 120_000 });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const notes = r.stdout.split(/\r?\n/);
    for (const t of HOST_TOOLS) {
      const mine = notes.filter((l) => l.startsWith(`  ${t.name}: `));
      expect(mine, `closing lines for ${t.name}`).toHaveLength(t === codex ? 1 : 0);
    }
    const line = notes.filter((l) => l.startsWith(`  ${codex.name}: `))[0];
    expect(line).toBe(`  ${codex.name}: ${AGENT_SKILL_REL} — ${codex.invoke}`);
    expect(line).toContain("$grugops");
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

// ── Plan 34-06 (PI-01, D-10): Pi's conventions are recorded in the packaging authority, with sources. ─
//
// The section is found by heading (exactly one), bounded at the next heading of the same or a higher
// level, and must carry the primary sources (repository and site), the retrieval date, the prompt
// template directory and the exact path the installer writes (PI_PROMPT_REL, imported, never
// retyped). Every bullet in it is a factual claim and must carry its own source and date. Its safety
// statement must name the git host as the hard control, because Pi asks for no approval per call.
describe("Pi conventions are recorded with sources (plan 34-06)", () => {
  const ADAPTERS = join(import.meta.dirname, "..", "agent-factory", "packaging", "adapters.md");
  const HEADING_TEXT = "Pi (pi.dev) conventions";
  const RETRIEVED = "2026-10-06";

  function piSection(): string {
    const lines = readFileSync(ADAPTERS, "utf8").split(/\r?\n/);
    const heads = lines
      .map((l, i) => ({ i, m: /^(#{1,6})\s+(.*)$/.exec(l) }))
      .filter((h) => h.m !== null);
    const hits = heads.filter((h) => h.m![2].includes(HEADING_TEXT));
    expect(hits.length, `adapters.md must carry exactly one "${HEADING_TEXT}" heading`).toBe(1);
    const level = hits[0].m![1].length;
    const next = heads.find((h) => h.i > hits[0].i && h.m![1].length <= level);
    return lines.slice(hits[0].i + 1, next === undefined ? lines.length : next.i).join("\n");
  }

  it("the section names the primary sources, the retrieval date, the template directory and the written path", () => {
    const sec = piSection();
    for (const token of ["github.com/earendil-works/pi", "pi.dev", RETRIEVED, ".pi/prompts/", PI_PROMPT_REL]) {
      expect(sec, `the Pi section does not carry ${token}`).toContain(token);
    }
  });

  it("every bullet in the section carries a Pi source and the retrieval date", () => {
    const bullets = piSection()
      .split(/\n(?=- )/)
      .filter((b) => b.startsWith("- "))
      // A markdown line wrap is a space, so a source wrapped across lines still counts.
      .map((b) => b.replace(/\s+/g, " "));
    // The section records the context-file, template, trust, skills, sub-agent and detection facts.
    expect(bullets.length).toBeGreaterThanOrEqual(6);
    for (const b of bullets) {
      expect(b, `bullet without a source: ${b.slice(0, 60)}`).toMatch(/github\.com\/earendil-works\/pi|pi\.dev/);
      expect(b, `bullet without the retrieval date: ${b.slice(0, 60)}`).toContain(`retrieved ${RETRIEVED}`);
    }
  });

  it("the safety statement says Pi asks for no approval per tool call and names the git host as the only hard control", () => {
    const safety = /\*\*Safety on Pi\.\*\*([\s\S]*?)(?:\n\n|$)/.exec(piSection());
    expect(safety, "the Pi section has no **Safety on Pi.** paragraph").not.toBeNull();
    const text = safety![1].replace(/\s+/g, " ");
    expect(text).toContain("does not ask for approval before every tool call");
    expect(text).toMatch(/git host is therefore the only hard control/);
    expect(text).toContain("security.md");
  });
});

// ── Plan 34-08 (PI-02, PI-04, D-12/D-13/D-16/D-17): the install guide covers Pi. ─────────────────────
//
// The guide is held to the registry, not to hand-typed strings: the template path is PI_PROMPT_REL
// (imported), the Pi bullet in § 5 is found by the registry's Pi `name`, and the host lists in the
// § 5 lead sentence and the § 6 Degraded paragraph must name every sequential host the registry
// holds. Every backticked token that starts with `.pi/prompts/` must be PI_PROMPT_REL itself, so a
// second spelling of the template path cannot appear anywhere in the guide. Sections are found by
// heading (exactly one each) and bounded at the next heading of the same or a higher level.
describe("install guide covers Pi (plan 34-08)", () => {
  const GUIDE = join(import.meta.dirname, "README.md");
  const FRONTMATTER_DOC = join(import.meta.dirname, "..", "agent-factory", "packaging", "subagent.frontmatter.md");
  const SCOPE_HEADING = "Host-CLI scope of the model and effort dials";
  const PI = HOST_TOOLS.find((t) => t.id === "pi");
  const flat = (s: string): string => s.replace(/\s+/g, " ");

  function section(file: string, headingText: string): string {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    const heads = lines
      .map((l, i) => ({ i, m: /^(#{1,6})\s+(.*)$/.exec(l) }))
      .filter((h) => h.m !== null);
    const hits = heads.filter((h) => h.m![2].trim() === headingText);
    expect(hits.length, `${file} must carry exactly one "${headingText}" heading`).toBe(1);
    const level = hits[0].m![1].length;
    const next = heads.find((h) => h.i > hits[0].i && h.m![1].length <= level);
    return lines.slice(hits[0].i + 1, next === undefined ? lines.length : next.i).join("\n");
  }

  it("the registry has a Pi row (the cases below read its name)", () => {
    expect(PI, "HOST_TOOLS has no row with id `pi`").toBeDefined();
  });

  it("the per-repo touch list has a bullet for PI_PROMPT_REL that names the ledger and the dry-run line", () => {
    const touches = section(GUIDE, "What the installer touches (per-repo), and only this");
    const bullet = touches.split(/\n(?=- )/).find((b) => b.startsWith(`- \`${PI_PROMPT_REL}\``));
    expect(bullet, `the touch list has no bullet starting with \`${PI_PROMPT_REL}\``).toBeDefined();
    const text = flat(bullet!);
    for (const token of ["`.grugops/install.json`", "`would-add`", "left untouched", "`AGENTS.md`", "`agent-factory/roles/orchestrator.md`"]) {
      expect(text, `the Pi touch-list bullet does not carry ${token}`).toContain(token);
    }
  });

  it("the Pi usage section names the path, the command, the repository root, project trust, and points at the dial scope section", () => {
    const use = flat(section(GUIDE, "Using grugops on Pi"));
    for (const token of [PI_PROMPT_REL, "`/grugops <request>`", "repository root", "project trust", "pi.dev", "retrieved 2026-10-06", SCOPE_HEADING]) {
      expect(use, `the Pi usage section does not carry ${token}`).toContain(token);
    }
    // The pointer must land: the named section exists in the frontmatter authority.
    expect(readFileSync(FRONTMATTER_DOC, "utf8")).toContain(`## ${SCOPE_HEADING}`);
  });

  it("§ 5 has a bullet for the registry's Pi name that says Pi asks for no approval per tool call and names the git host, with a source", () => {
    const other = section(GUIDE, "Other tools (documentation only)");
    const bullet = other.split(/\n(?=- )/).find((b) => b.startsWith(`- **${PI!.name}**`));
    expect(bullet, `§ 5 "Other tools" has no bullet starting with **${PI!.name}**`).toBeDefined();
    const text = flat(bullet!);
    expect(text).toContain("does not ask for approval before every tool call");
    expect(text).toContain("git host");
    expect(text).toMatch(/only hard control/);
    expect(text).toContain("github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/security.md");
  });

  it("the § 5 lead sentence and the § 6 Degraded paragraph name every sequential host in the registry", () => {
    const sequential = HOST_TOOLS.filter((t) => t.dispatch === "sequential");
    expect(sequential.length).toBe(HOST_TOOL_COUNT - 1);
    const lead = flat(section(GUIDE, "Other tools (documentation only)").split(/\n\n/).find((p) => p.trim() !== "")!);
    const degraded = flat(section(GUIDE, "Degraded — no `Agent` tool at all"));
    for (const t of sequential) {
      expect(lead, `the § 5 lead sentence does not name ${t.name}`).toContain(t.name);
      expect(degraded, `the § 6 Degraded paragraph does not name ${t.name}`).toContain(t.name);
    }
  });

  it("every backticked token in the guide that starts with `.pi/prompts/` is PI_PROMPT_REL", () => {
    const tokens = [...readFileSync(GUIDE, "utf8").matchAll(/`([^`\n]+)`/g)]
      .map((m) => m[1])
      .filter((t) => t.startsWith(".pi/prompts/"));
    // The touch list, the usage section and the Undo sentence each name the path.
    expect(tokens.length).toBeGreaterThanOrEqual(3);
    for (const t of tokens) expect(t).toBe(PI_PROMPT_REL);
  });
});

// ── Plan 34-30 (D-26, DOC-1, G-34-2): the guide's Pi section states the kit route the code writes. ────
//
// Plan 34-16 added a caveat saying the template names a path inside the repository and that kit discovery
// after a scripted install is unknown. Plans 34-27 to 34-29 made the template carry KIT_ROUTE, so that
// caveat is false. The section is found by heading (exactly one) and bounded at the next heading of the
// same or a higher level, as the 34-06 and 34-08 cases bound theirs. The tokens it must name are taken
// from KIT_ROUTE itself (its backticked tokens that name one file or field, not a pattern or a
// placeholder), so a change to the route moves this case with it. The live run stays `UNKNOWN - verify`.
describe("the install guide states the kit route for Pi (plan 34-30, D-26)", () => {
  const GUIDE = join(import.meta.dirname, "README.md");
  const flat = (s: string): string => s.replace(/\s+/g, " ");

  function guideSection(headingText: string): string {
    const lines = readFileSync(GUIDE, "utf8").split(/\r?\n/);
    const heads = lines
      .map((l, i) => ({ i, m: /^(#{1,6})\s+(.*)$/.exec(l) }))
      .filter((h) => h.m !== null);
    const hits = heads.filter((h) => h.m![2].trim() === headingText);
    expect(hits.length, `the guide must carry exactly one "${headingText}" heading`).toBe(1);
    const level = hits[0].m![1].length;
    const next = heads.find((h) => h.i > hits[0].i && h.m![1].length <= level);
    return flat(lines.slice(hits[0].i + 1, next === undefined ? lines.length : next.i).join("\n"));
  }
  const piUse = (): string => guideSection("Using grugops on Pi");
  const ROUTE_SECTION = "How a host finds the kit after a scripted install";

  // KIT_ROUTE's backticked tokens that name one file or one field (a token holding `…` or `<` is a
  // pattern or a placeholder, not a name).
  const ROUTE_NAMES = [...KIT_ROUTE.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((t) => !t.includes("…") && !t.includes("<"));

  it("KIT_ROUTE names the marker file and its kitRoot field (the cases below read these names)", () => {
    expect(ROUTE_NAMES).toContain(".grugops/install.json");
    expect(ROUTE_NAMES).toContain("kitRoot");
  });

  it("the Pi section names every file and field KIT_ROUTE names, and the --check reach lines", () => {
    const use = piUse();
    for (const t of ROUTE_NAMES) expect(use, `the Pi section does not name \`${t}\``).toContain(`\`${t}\``);
    expect(use).toContain("--check");
  });

  it("the Pi section keeps the live run `UNKNOWN - verify`, and no longer says the template names a path inside the repository", () => {
    const use = piUse();
    const caveat = use.split(/(?<=\.)\s+/).find((s) => s.includes("`UNKNOWN - verify`"));
    expect(caveat, "the Pi section has no `UNKNOWN - verify` sentence").toBeDefined();
    expect(caveat!).toMatch(/live run/);
    expect(caveat!).toContain("34-UAT.md");
    // The 34-16 sentence (WR-06): true before D-26, false since plan 34-27.
    expect(use).not.toContain("a path inside the repository");
    expect(use).not.toContain("No Pi run has shown whether Pi reaches the kit");
  });

  it("the kit-route section names KIT_ROUTE, the marker field, and every route carrier the registry derives", () => {
    const sec = guideSection(ROUTE_SECTION);
    expect(sec).toContain("`KIT_ROUTE`");
    for (const t of ROUTE_NAMES) expect(sec, `the kit-route section does not name \`${t}\``).toContain(`\`${t}\``);
    // The files --check asks: the union of routeCarriers over HOST_TOOLS (install.ts routeCarrierSet).
    const carriers = [...new Set(HOST_TOOLS.flatMap((h) => [...routeCarriers(h)]))];
    expect(carriers.length).toBeGreaterThan(1);
    for (const rel of carriers) expect(sec, `the kit-route section does not name \`${rel}\``).toContain(`\`${rel}\``);
    for (const token of ["--check", "`reach`", "FAIL", "WARN", "`UNKNOWN - verify`"]) {
      expect(sec, `the kit-route section does not carry ${token}`).toContain(token);
    }
  });

  // Plan 34-36 (D-27, DOC-1 for point 2): the section states the counting rule (strandedBy: a carrier that leaves
  // no host without a route is an uncounted `note`). Every 34-30 token is kept. Phase 34.1 D-12 deleted the Gemini
  // entry gate this case also asked the section to state (the settings path and `context.fileName`); plan 34.1-04
  // replaced those two expectations with the case below (every route carrier derived from HOST_TOOLS and
  // ROUTE_POINTERS, and no `context.fileName` instruction).
  it("the kit-route section names every route carrier HOST_TOOLS and ROUTE_POINTERS derive, and gives no `context.fileName` instruction (plan 34.1-04, D-12)", () => {
    const sec = guideSection(ROUTE_SECTION);
    const fromEntries = HOST_TOOLS.flatMap((h) => [...h.entryFiles]);
    const fromPointers = Object.values(ROUTE_POINTERS).flatMap((rels) => [...rels]);
    const carriers = [...new Set([...fromEntries, ...fromPointers])];
    // Two-sided against the one derivation install.ts asks (routeCarriers), so neither list can drift from the other.
    expect([...carriers].sort()).toEqual([...new Set(HOST_TOOLS.flatMap((h) => [...routeCarriers(h)]))].sort());
    expect(carriers.length, "premise: more than one route carrier").toBeGreaterThan(1);
    for (const rel of carriers) expect(sec, `the kit-route section does not name \`${rel}\``).toContain(`\`${rel}\``);
    expect(sec, "the kit-route section still tells a reader about `context.fileName` (D-12 deleted that route)").not.toContain("context.fileName");
  });

  it("the kit-route section names the uncounted `note` and --strict (plan 34-36, D-27)", () => {
    const sec = guideSection(ROUTE_SECTION);
    expect(sec, "the kit-route section does not name the uncounted `note`").toContain("uncounted `note`");
    expect(sec, "the kit-route section does not say --strict passes an uncounted note").toContain("--strict");
    expect(sec).toContain("`KIT_ROUTE`");
    for (const t of ROUTE_NAMES) expect(sec, `the kit-route section does not name \`${t}\``).toContain(`\`${t}\``);
    for (const rel of new Set(HOST_TOOLS.flatMap((h) => [...routeCarriers(h)]))) {
      expect(sec, `the kit-route section does not name \`${rel}\``).toContain(`\`${rel}\``);
    }
    for (const token of ["--check", "`reach`", "FAIL", "WARN", "`UNKNOWN - verify`"]) {
      expect(sec, `the kit-route section does not carry ${token}`).toContain(token);
    }
  });

  // Plan 34-36 (IN-06, D-27 point 4): the touch list's AGENTS.md bullet says what the AGENTS.md step does: copy
  // (or link) when the target has none, and refresh install's own unedited copy (refreshOwnFile, asking
  // refreshable). The bullet is the list item that starts with "- `AGENTS.md`", bounded at the next list item or
  // blank line.
  it("the AGENTS.md bullet says install refreshes its own unedited copy (plan 34-36, IN-06)", () => {
    const lines = readFileSync(GUIDE, "utf8").split(/\r?\n/);
    const starts = lines.map((l, i) => ({ l, i })).filter((x) => x.l.startsWith("- `AGENTS.md`"));
    expect(starts.length, "the guide must carry exactly one list item starting with - `AGENTS.md`").toBe(1);
    const from = starts[0].i;
    let to = from + 1;
    while (to < lines.length && lines[to].trim() !== "" && !lines[to].startsWith("- ")) to += 1;
    const bullet = flat(lines.slice(from, to).join("\n"));
    expect(bullet, "the AGENTS.md bullet says install copies it only when the target has none").not.toContain("only when the target has none");
    expect(bullet).toContain("when the target has none");
    expect(bullet).toContain("refreshed when it is install's own unedited copy");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The kit route in the kit's AGENTS.md (plan 34-27, D-26). KIT_ROUTE is the one authority for the route
// sentence; the "Kit vs state" rule carries it byte for byte, once, and keeps the SC2 invariant sentence
// that scripts/check-kit-refs.ts pins at every marker site.
// ─────────────────────────────────────────────────────────────────────────────────────────────
describe("the kit route in AGENTS.md (plan 34-27, D-26)", () => {
  const AGENTS = readFileSync(join(import.meta.dirname, "..", "AGENTS.md"), "utf8");
  const SC2 = "If the kit dir is absent, STOP — do not hunt.";

  /** The body of the `## Kit vs state` section: the lines after its heading, up to the next `## ` heading. */
  const kitVsState = (): string => {
    const lines = AGENTS.split("\n");
    const at = lines.findIndex((l) => l === "## Kit vs state");
    expect(at, "AGENTS.md has no `## Kit vs state` heading").toBeGreaterThan(-1);
    const next = lines.findIndex((l, i) => i > at && l.startsWith("## "));
    return lines.slice(at + 1, next === -1 ? lines.length : next).join("\n");
  };

  /** How many times `needle` occurs in `hay`, without overlap. */
  const occurrences = (hay: string, needle: string): number => hay.split(needle).length - 1;

  it("KIT_ROUTE is fixed text naming the marker field, and carriesKitRoute is exact containment", () => {
    expect(KIT_ROUTE).toContain("`kitRoot`");
    expect(KIT_ROUTE).toContain("`.grugops/install.json`");
    expect(KIT_ROUTE).not.toContain("GRUGOPS_HOME");
    expect(carriesKitRoute(`before ${KIT_ROUTE} after`)).toBe(true);
    expect(carriesKitRoute(KIT_ROUTE.slice(0, -1))).toBe(false);
  });

  it("AGENTS.md carries KIT_ROUTE exactly once, inside the Kit vs state section", () => {
    expect(occurrences(AGENTS, KIT_ROUTE), "KIT_ROUTE occurrences in AGENTS.md").toBe(1);
    expect(occurrences(kitVsState(), KIT_ROUTE), "KIT_ROUTE occurrences in the Kit vs state section").toBe(1);
  });

  it("AGENTS.md keeps the SC2 invariant sentence", () => {
    expect(AGENTS).toContain(SC2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The route carriers per host (plan 34-28, D-26 point 3). ROUTE_POINTERS classifies every adapter kind;
// routeCarriers is the one derivation install's notes and `--check` use. The expected
// values here are computed by this file from HOST_TOOLS and ROUTE_POINTERS, never typed, so a registry
// change moves them with it.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/** This file's own derivation: a host's entry files, then its adapter kind's pointers, first occurrence kept. */
const expectedCarriers = (adapter: string, entryFiles: readonly string[]): string[] => {
  const out: string[] = [];
  for (const f of [...entryFiles, ...(ROUTE_POINTERS as Record<string, readonly string[]>)[adapter]]) if (!out.includes(f)) out.push(f);
  return out;
};
const AGENTS_ONLY_COUNT = 0;
const AGENTS_ONLY = HOST_TOOLS.filter((h) => {
  const c = expectedCarriers(h.adapter, h.entryFiles);
  return c.length === 1 && c[0] === "AGENTS.md";
}).map((h) => h.name);

describe("route carriers are derived from the registry (plan 34-28, D-26 point 3)", () => {
  it("ROUTE_POINTERS has exactly the keys of HOST_ADAPTER_KINDS, and every value is a list of target-relative POSIX paths", () => {
    expect(Object.keys(ROUTE_POINTERS).sort()).toEqual([...HOST_ADAPTER_KINDS].sort());
    for (const [kind, paths] of Object.entries(ROUTE_POINTERS)) {
      expect(Array.isArray(paths), `${kind}'s pointers are not a list`).toBe(true);
      for (const p of paths) {
        expect(p.length, `${kind} has an empty pointer path`).toBeGreaterThan(0);
        expect(p, `${kind}'s pointer ${p} is not a target-relative POSIX path`).not.toMatch(/^[/~]|^[A-Za-z]:|\\|(^|\/)\.\.(\/|$)/);
      }
    }
  });

  for (const h of HOST_TOOLS) {
    it(`routeCarriers(${h.id}) is its entryFiles together with ROUTE_POINTERS[${h.adapter}], without duplicates`, () => {
      const got = [...routeCarriers(h)];
      expect(got).toEqual(expectedCarriers(h.adapter, h.entryFiles));
      expect(new Set(got).size).toBe(got.length);
    });
  }

  // AGENTS_ONLY_COUNT 1 -> 0 on 2026-10-11 (plan 34.1-03, D-12/D-20): the one host whose only route carrier was
  // AGENTS.md (the `.gemini`-detected row, adapter `gemini-settings`, which wrote no pointer) moved to `agent-skill` and
  // reads AGENT_SKILL_REL too, so every registry row now has an entry of its own beside AGENTS.md. A user's AGENTS.md
  // without the route then strands no host by itself (the counting rule makes its line an uncounted `note`).
  it(`the hosts whose only route carrier is AGENTS.md, derived (${AGENTS_ONLY_COUNT}): ${AGENTS_ONLY.join(", ") || "none"}`, () => {
    expect(AGENTS_ONLY.length, "the derived count of AGENTS.md-only hosts moved; re-derive and re-pin AGENTS_ONLY_COUNT").toBe(AGENTS_ONLY_COUNT);
    const viaModule = HOST_TOOLS.filter((h) => {
      const c = routeCarriers(h);
      return c.length === 1 && c[0] === "AGENTS.md";
    }).map((h) => h.name);
    expect(viaModule).toEqual(AGENTS_ONLY);
  });
});

// ── THE ONE OWNER OF "DOES HOST H READ ROUTE CARRIER X HERE" (plan 34-32; phase 34.1 D-12, D-17, D-20) ──────────────
//
// Plan 34-32 gave the registry an `entryGates` field (Gemini CLI read AGENTS.md only when its settings listed it)
// and install.ts one owner of the answer, hostReadsCarrier. Phase 34.1 D-12 deleted the gate, the field and the
// `gemini-settings` adapter kind with the Gemini merge; hostReadsCarrier stays the one owner and now answers
// routeCarriers membership. The census below holds the owner in place: install.ts reads no `entryFiles` itself, and
// calls routeCarriers only inside the functions named here, with the counts pinned. D-17 (IN-14) deleted the dead
// export hostsReading; the D-12 census in install/installer-fs-census.test.ts holds every deleted name out.

describe("the registry after D-12: no entry gates; two rows share the agent skill (phase 34.1, D-12, D-20)", () => {
  it("no HostTool row has an `entryGates` key (the field was deleted with the Gemini entry gate, D-12)", () => {
    for (const t of HOST_TOOLS) expect(Object.prototype.hasOwnProperty.call(t, "entryGates"), `${t.id} still has entryGates`).toBe(false);
  });

  it("the Codex CLI row and the `.gemini`-detected row both have adapter `agent-skill` and route through AGENT_SKILL_REL alone (D-20, two rows, one entry)", () => {
    const codex = HOST_TOOLS.filter((t) => t.id === "codex");
    const dotGemini = HOST_TOOLS.filter((t) => t.detect === ".gemini");
    expect(codex.length, "premise: one codex row").toBe(1);
    expect(dotGemini.length, "premise: one row detected by .gemini").toBe(1);
    for (const t of [...codex, ...dotGemini]) {
      expect(t.adapter, `${t.id}'s adapter`).toBe("agent-skill");
      expect([...ROUTE_POINTERS[t.adapter]], `${t.id}'s pointers`).toEqual([AGENT_SKILL_REL]);
      expect(routeCarriers(t), `${t.id}'s carriers`).toContain(AGENT_SKILL_REL);
    }
    expect(HOST_TOOLS.filter((t) => t.adapter === "agent-skill").map((t) => t.id).sort()).toEqual([codex[0].id, dotGemini[0].id].sort());
    expect(AGENT_SKILL_REL.startsWith(".gemini/"), "the shared entry is under .gemini/ (refuted by D-20)").toBe(false);
  });
});

const INSTALL_TS = join(import.meta.dirname, "install.ts");
const installSource = (): ts.SourceFile => ts.createSourceFile("install.ts", readFileSync(INSTALL_TS, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

/** The name of the function declaration enclosing `node` (an arrow or method inside one belongs to it), or `<module>`. */
function enclosingFunction(node: ts.Node): string {
  for (let p: ts.Node | undefined = node.parent; p !== undefined; p = p.parent) {
    if (ts.isFunctionDeclaration(p) && p.name !== undefined) return p.name.text;
  }
  return "<module>";
}

/** Every node of `sf`, depth first. */
function allNodes(sf: ts.SourceFile): ts.Node[] {
  const out: ts.Node[] = [];
  const visit = (n: ts.Node): void => {
    out.push(n);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

// THE PINNED CALL SITES. routeCarriers is the static carrier set; a verdict asks hostReadsCarrier instead.
// hostReadsCarrier and routeCarrierSet are the owner functions the plan names. Plan 34-33 removed noteMissingRoute
// (install's route note): install's notes now ask strandedBy through noteStrandingCarriers. Phase 34.1 D-17 (IN-14)
// deleted hostsReading, which install.ts already called nowhere; the census below still refuses the name, so it
// cannot come back as a second "could read" derivation. Re-derived 2026-10-11 (plan 34.1-03) by running this census
// over the D-12 tree: unchanged, hostReadsCarrier ×1 and routeCarrierSet ×1.
const OWNER_CALLS: Readonly<Record<string, number>> = {
  "routeCarriers@hostReadsCarrier": 1,
  "routeCarriers@routeCarrierSet": 1,
};

// The functions that ask hostReadsCarrier, and the functions that ask strandedBy (plan 34-33): the doctor's carrier
// lines (kitRouteFindings) and install's route-note pass (noteStrandingCarriers). No other site derives either answer.
const HOST_READS_CARRIER_CALLERS: readonly string[] = ["kitRouteFindings", "noteStrandingCarriers"];
const STRANDED_BY_CALLERS: readonly string[] = ["kitRouteFindings", "noteStrandingCarriers"];

describe("census: install.ts asks the one owner of 'does host H read entry file X here' (plan 34-32, AUTH-1)", () => {
  it("install.ts reads no `entryFiles` itself: no property access, element access or destructuring of it", () => {
    const hits: string[] = [];
    for (const n of allNodes(installSource())) {
      if (ts.isPropertyAccessExpression(n) && n.name.text === "entryFiles") hits.push(`.entryFiles in ${enclosingFunction(n)}`);
      if (ts.isElementAccessExpression(n) && ts.isStringLiteralLike(n.argumentExpression) && n.argumentExpression.text === "entryFiles") {
        hits.push(`["entryFiles"] in ${enclosingFunction(n)}`);
      }
      if (ts.isBindingElement(n) && ((n.propertyName !== undefined && ts.isIdentifier(n.propertyName) && n.propertyName.text === "entryFiles") || (n.propertyName === undefined && ts.isIdentifier(n.name) && n.name.text === "entryFiles"))) {
        hits.push(`{ entryFiles } in ${enclosingFunction(n)}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it(`routeCarriers is called only at the pinned sites, and hostsReading nowhere: ${Object.entries(OWNER_CALLS).map(([k, v]) => `${k} ×${v}`).join(", ")}`, () => {
    const found: Record<string, number> = {};
    const notCalls: string[] = [];
    for (const n of allNodes(installSource())) {
      if (!ts.isIdentifier(n) || (n.text !== "routeCarriers" && n.text !== "hostsReading")) continue;
      // The import specifier is the one reference that is not a use.
      if (ts.isImportSpecifier(n.parent)) continue;
      if (ts.isCallExpression(n.parent) && n.parent.expression === n) {
        const key = `${n.text}@${enclosingFunction(n)}`;
        found[key] = (found[key] ?? 0) + 1;
      } else {
        notCalls.push(`${n.text} used as a value in ${enclosingFunction(n)}`);
      }
    }
    // Printed so the SUMMARY records the measured counts.
    console.log(`install.ts owner-call census: ${JSON.stringify(found)}`);
    expect(notCalls, "a reference that is not a direct call escapes the census").toEqual([]);
    expect(found).toEqual(OWNER_CALLS);
  });

  it(`hostReadsCarrier is called by ${HOST_READS_CARRIER_CALLERS.join(" and ")} (re-derived after D-12 deleted ENTRY_GATE_CHECKS)`, () => {
    const nodes = allNodes(installSource());
    const callers = new Set(
      nodes
        .filter((n): n is ts.Identifier => ts.isIdentifier(n) && n.text === "hostReadsCarrier" && ts.isCallExpression(n.parent) && n.parent.expression === n)
        .map((n) => enclosingFunction(n)),
    );
    // Plan 34-33: carrierFinding became classifyCarrier, which prints nothing and asks no host; kitRouteFindings asks
    // hostReadsCarrier once per host and carrier and builds the facts strandedBy takes.
    expect([...callers].sort()).toEqual([...HOST_READS_CARRIER_CALLERS].sort());
  });

  it("the reach loop walks routeCarrierSet order; for every host that order, restricted to its carriers, is its routeCarriers order", () => {
    const set = [...new Set(HOST_TOOLS.flatMap((h) => [...routeCarriers(h)]))];
    for (const h of HOST_TOOLS) expect(set.filter((rel) => routeCarriers(h).includes(rel)), h.id).toEqual([...routeCarriers(h)]);
  });
});

// ── ONE OWNER OF WHAT INSTALL WOULD WRITE INTO A ROUTE CARRIER, AND ONE OF WHOSE LINK IT IS (phase 34.1, D-15, D-16; AUTH-1) ──
//
// installWouldWrite answers refresh, append, create or none for a route carrier; refreshable stays its refresh half and
// is asked by nothing else, so no caller re-derives "would install refresh X" beside it. linkOwnership answers "is this a
// link a --symlink install made". The census pins every direct call by enclosing function declaration (`<module>` is
// the top-level AGENTS.md step) and refuses any reference that is not a direct call, so a second derivation, or a caller
// that passes the owner around, is a red census line until it is looked at. Measured 2026-10-12 (plan 34.1-11):
//   refreshable: installWouldWrite only (it moved there from classifyCarrier, ensureBlock and refreshOwnFile).
//   installWouldWrite: the doctor (classifyCarrier; kitRouteFindings' absent arm) and install (ensureBlock,
//     writeWholeFileEntry, the AGENTS.md step); refreshOwnFile takes the answer from its caller.
//   linkOwnership: refreshable's link arm, installWouldWrite's blocked arm, blockedWriteText (install's verifies),
//     kitRouteFindings' user remedy and noteStrandingCarriers' route note.
const WRITE_OWNER_CALLS: Readonly<Record<string, number>> = {
  "refreshable@installWouldWrite": 1,
  "installWouldWrite@classifyCarrier": 1,
  "installWouldWrite@kitRouteFindings": 1,
  "installWouldWrite@ensureBlock": 1,
  "installWouldWrite@writeWholeFileEntry": 1,
  "installWouldWrite@<module>": 1,
  "linkOwnership@refreshable": 1,
  "linkOwnership@installWouldWrite": 1,
  "linkOwnership@blockedWriteText": 1,
  "linkOwnership@kitRouteFindings": 1,
  "linkOwnership@noteStrandingCarriers": 1,
};

describe("census: install.ts asks one owner of what install would write into a carrier, and one of whose link it is (phase 34.1, D-15, D-16)", () => {
  it(`the owners are called only at the pinned sites: ${Object.entries(WRITE_OWNER_CALLS).map(([k, v]) => `${k} ×${v}`).join(", ")}`, () => {
    const owners = new Set(["refreshable", "installWouldWrite", "linkOwnership"]);
    const found: Record<string, number> = {};
    const notCalls: string[] = [];
    const declared: string[] = [];
    for (const n of allNodes(installSource())) {
      if (!ts.isIdentifier(n) || !owners.has(n.text)) continue;
      if (ts.isFunctionDeclaration(n.parent) && n.parent.name === n) {
        declared.push(n.text);
        continue;
      }
      if (ts.isCallExpression(n.parent) && n.parent.expression === n) {
        const key = `${n.text}@${enclosingFunction(n)}`;
        found[key] = (found[key] ?? 0) + 1;
      } else {
        notCalls.push(`${n.text} used as a value in ${enclosingFunction(n)}`);
      }
    }
    console.log(`install.ts write-owner census: ${JSON.stringify(found)}`);
    expect(declared.sort(), "each owner is one function declaration").toEqual([...owners].sort());
    expect(notCalls, "a reference that is not a direct call escapes the census").toEqual([]);
    expect(found).toEqual(WRITE_OWNER_CALLS);
  });
});

// ── THE ONE DERIVATION OF THE HOSTS A CARRIER STRANDS (plan 34-33, D-27 point 2; VERDICT-1, AUTH-1) ──────────────
//
// reachVia and strandedBy (host-tools.ts) are pure over RouteFacts. They are checked here over EVERY combination of
// the facts against a brute-force oracle written in this file from the registry (expectedCarriers above, never
// routeCarriers): holds for each carrier of the derived carrier set (2^n), and adapterReaches for each host whose
// adapter kind is `claude-kit` (2^k); a host reads every carrier its expectedCarriers include. The counts are pinned,
// so a registry change that moves them fails red here until this table is looked at again.
// TABLE_CARRIERS 4 -> 6 on 2026-10-11 (plan 34.1-01, D-08, D-11): `.agents/skills/grugops/SKILL.md` (Codex CLI's
// agent-skill pointer) and `.opencode/commands/grugops.md` (OpenCode's command) joined the derived carrier set, so the
// table has 2^(6+1+1) = 256 combinations.
// TABLE_GATED_PAIRS (1) deleted on 2026-10-11 (plan 34.1-03, D-12): the Gemini entry gate and the registry's
// entryGates field are gone, so no (host, file) pair is read only sometimes and the gate dimension left the table:
// 2^(6+1) = 128 combinations. TABLE_CARRIERS stays 6: the `.gemini`-detected row moved to `agent-skill`, whose pointer
// AGENT_SKILL_REL was already in the set through Codex CLI (D-20).
const TABLE_CARRIERS = 6;
const TABLE_ADAPTER_HOSTS = 1;
// THE HOST-SET AXIS (plan 34.1-10, D-07): strandedBy takes the installed host set as a required argument, so the table
// also quantifies over every subset of HOST_TOOLS (2^HOST_TOOL_COUNT, asserted) and the oracle is restricted to it.
const TABLE_HOST_SUBSETS = 2 ** HOST_TOOL_COUNT;

/** Every subset of HOST_TOOLS, each in registry order (bit i of the index keeps row i). */
function hostSubsets(): HostTool[][] {
  const out: HostTool[][] = [];
  for (let bits = 0; bits < 2 ** HOST_TOOLS.length; bits++) out.push(HOST_TOOLS.filter((_, i) => ((bits >> i) & 1) === 1));
  return out;
}

describe("reachVia and strandedBy over every combination of the facts (plan 34-33, D-27 point 2)", () => {
  const carriers = [...new Set(HOST_TOOLS.flatMap((h) => expectedCarriers(h.adapter, h.entryFiles)))];
  const adapterHosts = HOST_TOOLS.filter((h) => h.adapter === "claude-kit");

  it(`the table's dimensions: ${TABLE_CARRIERS} carriers, ${TABLE_ADAPTER_HOSTS} claude-kit host(s), ${2 ** (TABLE_CARRIERS + TABLE_ADAPTER_HOSTS)} combinations`, () => {
    expect(carriers.length).toBe(TABLE_CARRIERS);
    expect(adapterHosts.length).toBe(TABLE_ADAPTER_HOSTS);
  });

  it(`the host-set axis: every subset of the ${HOST_TOOL_COUNT} registry rows, ${TABLE_HOST_SUBSETS} subsets`, () => {
    expect(HOST_TOOLS.length).toBe(HOST_TOOL_COUNT);
    expect(hostSubsets().length).toBe(TABLE_HOST_SUBSETS);
    expect(new Set(hostSubsets().map((sub) => sub.map((h) => h.id).join(","))).size, "two subsets are the same").toBe(TABLE_HOST_SUBSETS);
  });

  it("every combination and every installed host set: reachVia equals the oracle's carriers (registry carrier order) and adapter; strandedBy equals the oracle's stranded hosts restricted to the set (registry order), and is empty whenever the carrier holds", () => {
    const n = carriers.length;
    const k = adapterHosts.length;
    const subsets = hostSubsets();
    let combos = 0;
    let subsetRuns = 0;
    let strandedSeen = 0;
    let emptySeen = 0;
    let narrowedSeen = 0;
    for (let bits = 0; bits < 2 ** (n + k); bits++) {
      combos += 1;
      const bit = (i: number): boolean => ((bits >> i) & 1) === 1;
      const holdsSet = new Set(carriers.filter((_, i) => bit(i)));
      const adapterSet = new Set(adapterHosts.filter((_, i) => bit(n + i)).map((h) => h.id));
      const facts: RouteFacts = {
        reads: (h, rel) => expectedCarriers(h.adapter, h.entryFiles).includes(rel),
        holds: (rel) => holdsSet.has(rel),
        adapterReaches: (h) => adapterSet.has(h.id),
      };
      // THE ORACLE: written from the definitions, sharing nothing with host-tools.ts but the registry rows.
      const oracleVia = (h: HostTool): string[] => expectedCarriers(h.adapter, h.entryFiles).filter((rel) => holdsSet.has(rel));
      const label = `holds=[${[...holdsSet].join(",")}] adapters=[${[...adapterSet].join(",")}]`;
      for (const h of HOST_TOOLS) {
        const v = reachVia(h, facts);
        expect([...v.carriers], `reachVia(${h.id}) ${label}`).toEqual(oracleVia(h));
        expect(v.adapter, `reachVia(${h.id}).adapter ${label}`).toBe(adapterSet.has(h.id));
      }
      for (const rel of [...carriers, "no/such/carrier.md"]) {
        const all = holdsSet.has(rel)
          ? []
          : HOST_TOOLS.filter(
              (h) => expectedCarriers(h.adapter, h.entryFiles).includes(rel) && oracleVia(h).length === 0 && !adapterSet.has(h.id),
            ).map((h) => h.id);
        for (const subset of subsets) {
          subsetRuns += 1;
          // The oracle restricted to the installed set: the stranded hosts among its members, in registry order. The
          // subset is handed over in reverse order, so an answer in the caller's order instead of the registry's is red.
          const ids = new Set(subset.map((h) => h.id));
          const want = all.filter((id) => ids.has(id));
          const got = strandedBy(rel, facts, [...subset].reverse()).map((h) => h.id);
          const sub = `hosts=[${[...ids].join(",")}]`;
          expect(got, `strandedBy(${rel}) ${label} ${sub}`).toEqual(want);
          if (holdsSet.has(rel)) expect(got, `strandedBy(${rel}) while it holds ${label} ${sub}`).toEqual([]);
          if (got.length > 0) strandedSeen += 1;
          else emptySeen += 1;
          if (want.length < all.length) narrowedSeen += 1;
        }
      }
    }
    expect(combos).toBe(2 ** (TABLE_CARRIERS + TABLE_ADAPTER_HOSTS));
    expect(subsetRuns).toBe(2 ** (TABLE_CARRIERS + TABLE_ADAPTER_HOSTS) * (TABLE_CARRIERS + 1) * TABLE_HOST_SUBSETS);
    // The set narrows some answer (a stranded host outside the installed set is dropped).
    expect(narrowedSeen).toBeGreaterThan(0);
    // Vacuity floors: the table reaches both answers.
    expect(strandedSeen).toBeGreaterThan(0);
    expect(emptySeen).toBeGreaterThan(0);
  });

  it(`strandedBy is called in install.ts only by ${STRANDED_BY_CALLERS.join(" and ")}, and reachVia only inside the same functions`, () => {
    const nodes = allNodes(installSource());
    const callersOf = (name: string): string[] =>
      [...new Set(nodes.filter((n): n is ts.Identifier => ts.isIdentifier(n) && n.text === name && ts.isCallExpression(n.parent) && n.parent.expression === n).map((n) => enclosingFunction(n)))].sort();
    expect(callersOf("strandedBy")).toEqual([...STRANDED_BY_CALLERS].sort());
    for (const c of callersOf("reachVia")) expect(STRANDED_BY_CALLERS, `reachVia called in ${c}`).toContain(c);
  });
});

// ── entryOwners: which agents own an install-ledger entry (phase 34.1, D-05, D-06, D-20, D-23) ───────────────────────
// The expected owners are derived from the registry (the rows of an adapter kind), never typed as ids, so a new row on a
// kind is owned with no edit here.
describe("entryOwners: the one answer to which agents own a ledger entry (phase 34.1, D-05)", () => {
  const rowsOf = (kind: HostAdapterKind): string[] => HOST_TOOLS.filter((h) => h.adapter === kind).map((h) => h.id);

  it("every ROUTE_POINTERS value is inside its kind's footprint, and a file entry there is owned by exactly that kind's rows", () => {
    let n = 0;
    for (const kind of HOST_ADAPTER_KINDS) {
      for (const rel of ROUTE_POINTERS[kind]) {
        n++;
        const inFootprint = ADAPTER_FOOTPRINT[kind].some((p) => p === rel || (p.endsWith("/") && rel.startsWith(p)));
        expect(inFootprint, `${rel} (${kind}) is not in its kind's footprint`).toBe(true);
        expect(entryOwners({ path: rel, kind: "file" }), rel).toEqual(rowsOf(kind));
      }
    }
    expect(n, "the pointer census matched nothing").toBeGreaterThanOrEqual(HOST_ADAPTER_KINDS.length);
  });

  it("the shared skill is owned by exactly the agent-skill rows (Codex CLI and Antigravity CLI, D-20)", () => {
    const owners = entryOwners({ path: AGENT_SKILL_REL, kind: "file" });
    expect(owners).toEqual(rowsOf("agent-skill"));
    expect(owners.length, "the shared skill must have two owners").toBe(2);
  });

  it("Claude Code's prefix covers its skills, adapters and the ask rules; directories on the way belong to the agent", () => {
    const cases: ReadonlyArray<readonly [string, string, HostAdapterKind]> = [
      [".claude/settings.json", "ask-rules", "claude-kit"],
      [".claude/settings.json", "file", "claude-kit"],
      [".claude/skills/grugops/SKILL.md", "file", "claude-kit"],
      [".claude/agents/grugops-orchestrator.md", "file", "claude-kit"],
      [".claude/agents/grugops-orchestrator.md.grugops-edited-2026-01-02T03-04-05.678Z", "backup", "claude-kit"],
      ["CLAUDE.md", "block", "claude-kit"],
      [".claude", "dir", "claude-kit"],
      [".claude/skills/grugops", "dir", "claude-kit"],
      [".agents", "dir", "agent-skill"],
      [".agents/skills", "dir", "agent-skill"],
      [".agents/skills/grugops", "dir", "agent-skill"],
      [".github", "dir", "copilot-pointer"],
      [".github/copilot-instructions.md", "block", "copilot-pointer"],
      [".pi", "dir", "pi-prompt-template"],
      [".pi/prompts", "dir", "pi-prompt-template"],
      [".opencode", "dir", "opencode-command"],
      [".opencode/commands", "dir", "opencode-command"],
      [OPENCODE_COMMAND_REL, "file", "opencode-command"],
      ["opencode.json", "file", "opencode-command"],
      [PI_PROMPT_REL, "file", "pi-prompt-template"],
    ];
    for (const [path, kind, owner] of cases) expect(entryOwners({ path, kind }), `${path} (${kind})`).toEqual(rowsOf(owner));
  });

  it("the shared footprint has no owner: AGENTS.md, tools/grugops/, the marker and the legacy Gemini settings (D-06, D-23)", () => {
    const shared: ReadonlyArray<readonly [string, string]> = [
      ["AGENTS.md", "file"],
      ["tools/grugops/x.js", "file"],
      ["tools/grugops", "dir"],
      ["tools", "dir"],
      [".grugops/install.json", "file"],
      [".gemini/settings.json", "gemini"],
      [".gemini", "dir"],
      ["agent-factory.bak.2026-10-05T10-00-00.000Z", "backup"],
    ];
    for (const [path, kind] of shared) expect(entryOwners({ path, kind }), `${path} (${kind})`).toEqual([]);
  });

  it("only a directory entry is owned by being on the way, and a prefix matches whole segments only", () => {
    expect(entryOwners({ path: ".agents", kind: "file" }), "a file named like a directory on the way").toEqual([]);
    expect(entryOwners({ path: ".pi/prompts", kind: "file" })).toEqual([]);
    expect(entryOwners({ path: ".claudette/x.md", kind: "file" }), "a sibling of .claude/").toEqual([]);
    expect(entryOwners({ path: ".claude", kind: "file" }), "the bare name of the prefix, not a directory entry").toEqual([]);
    expect(entryOwners({ path: "CLAUDE.md.bak", kind: "file" })).toEqual([]);
    expect(entryOwners({ path: ".agents/skills/grugops-other/SKILL.md", kind: "file" }), "another skill under .agents").toEqual([]);
    expect(entryOwners({ path: ".agents/skills/grug", kind: "dir" }), "a segment prefix is not a directory on the way").toEqual([]);
  });

  it("every adapter kind has a footprint, and every footprint path is a POSIX relative path", () => {
    for (const kind of HOST_ADAPTER_KINDS) {
      expect(ADAPTER_FOOTPRINT[kind].length, kind).toBeGreaterThan(0);
      for (const p of ADAPTER_FOOTPRINT[kind]) expect(p, `${kind}: ${p}`).toMatch(/^[^/\\][^\\]*$/);
    }
    expect(Object.keys(ADAPTER_FOOTPRINT).sort()).toEqual([...HOST_ADAPTER_KINDS].sort());
  });
});

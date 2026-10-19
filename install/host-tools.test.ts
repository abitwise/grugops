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
  ANTIGRAVITY_AGENT_REL,
  COPILOT_AGENT_REL,
  LAUNCH_AGENT_NAME,
  OPENCODE_AGENT_REL,
  PI_LAUNCH_REL,
  OPENCODE_COMMAND_REL,
  KIT_ROUTE,
  LAUNCH_NOT_LIVE,
  POINTER_LINE,
  START_HERE_SENTENCE,
  carriesKitRoute,
  agentFlag,
  hostForFlag,
  ROUTE_POINTERS,
  ADAPTER_FOOTPRINT,
  entryOwners,
  hostFootprint,
  hostPointers,
  launchCarriers,
  launchInvoke,
  launchLiveNote,
  launchSession,
  routeCarriers,
  reachVia,
  strandedBy,
  type HostTool,
  type HostAdapterKind,
  type LaunchForm,
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
      // Review WR-03: a fresh install writes every launch file, so each launch row's line offers its launch form after
      // the invoke text; a row with none ends with the invoke text.
      const launch = launchInvoke(t);
      expect(mine[0].endsWith(` — ${t.invoke}${launch === null ? "" : `; or ${launch}`}`), mine[0]).toBe(true);
      // Every hostPointers path of the row (its kind's pointers, then its launch agent; quick task 261018-hs8).
      for (const rel of hostPointers(t)) expect(mine[0], `${t.name}'s line names ${rel}`).toContain(rel);
      seen++;
    }
    expect(seen).toBe(HOST_TOOL_COUNT);
    // Moved 2026-10-18 (quick task 261018-vfm): a human's live run verified launch forms on 2026-10-18, and the OpenCode
    // panel form comes from that run, not from documentation, so the generic line now names forms marked verified live
    // and keeps every other form, and the kit route of every launched session, UNKNOWN - verify.
    // Re-pinned 2026-10-19 by quick task 261019-i3g (review IN-12): the line is built from the forms this run gave, so
    // the two `toContain` pins (which passed whatever the registry said) are now the exact oracle line over the rows
    // with a launch file, every one of which a fresh install offers (asserted per row above).
    expectProvenance(r.stdout, HOST_TOOLS.filter((t) => t.launchAgent !== null), "every agent");
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

// ── THE PROVENANCE LINE NAMES ONLY THE FORMS THIS RUN GAVE (quick task 261019-i3g, 261018-vfm review IN-12) ────────────
//
// Before this fix the closing notes ended with one constant line that spoke of forms marked verified live and of
// launch forms on every run, even a `--codex` run that gave neither, and its pin (toContain "verified live") could not
// fail when the registry changed. The line is now built from the launch forms the run gave. THE ORACLE IS WRITTEN HERE,
// independently of the product: it reads each given row's launchForm.verifiedLive directly and types each sentence as
// a literal. The given set is derived from the registry AND read back from the output (a row gave its form exactly
// when its closing line ends with `; or <launchInvoke>`), and the two must agree.
const PROVENANCE_HEAD = "  These invocation forms come from";
const PROVENANCE_BASE = "These invocation forms come from each host's documentation, and grugops has not run them on a live host (UNKNOWN - verify).";
/** The oracle's provenance line for the rows whose launch form the run gave. */
function provenanceOracle(given: readonly HostTool[]): string {
  if (given.length === 0) return `  ${PROVENANCE_BASE}`;
  const clauses: string[] = [];
  if (given.some((h) => h.launchForm !== null && h.launchForm.verifiedLive !== null)) {
    clauses.push("a form marked verified live was run by a human on the live host on the date shown");
  }
  if (given.some((h) => h.launchForm !== null && h.launchForm.verifiedLive === null)) {
    clauses.push("a form not marked verified live comes from its host's documentation, and grugops has not run it on a live host (UNKNOWN - verify)");
  }
  clauses.push("whether a session started with a launch form then follows the kit route is UNKNOWN - verify on every host");
  return `  ${PROVENANCE_BASE} Of the launch forms given here, ${clauses.join("; ")}.`;
}
/** Assert the run's one provenance line is the oracle's for `given`, with both sides of each condition. */
function expectProvenance(stdout: string, given: readonly HostTool[], what: string): void {
  const lines = stdout.split(/\r?\n/).filter((l) => l.startsWith(PROVENANCE_HEAD));
  expect(lines, `${what}: exactly one provenance line\n${stdout}`).toHaveLength(1);
  const line = lines[0];
  expect(line, `${what}: the provenance line`).toBe(provenanceOracle(given));
  // Both sides of each condition. The not-verified clause itself says "not marked verified live", so the verified-live
  // side is asked of its own clause ("a form marked verified live"), never of the bare words (measured 2026-10-19: a
  // GitHub Copilot CLI-alone run gives only the not-verified clause, which holds the words "verified live").
  const anyLive = given.some((h) => h.launchForm !== null && h.launchForm.verifiedLive !== null);
  const anyUndated = given.some((h) => h.launchForm !== null && h.launchForm.verifiedLive === null);
  expect(line.includes("a form marked verified live"), `${what}: the verified-live clause exactly when a given form has a date`).toBe(anyLive);
  expect(line.includes("not marked verified live"), `${what}: the not-verified clause exactly when a given form has none`).toBe(anyUndated);
  expect(line.includes("verified live"), `${what}: "verified live" only when a form was given`).toBe(anyLive || anyUndated);
  expect(line.includes("launch form"), `${what}: "launch form" exactly when a form was given`).toBe(given.length > 0);
}
/** The rows whose closing line in `stdout` ends with their launch form (the set the output says it gave). */
function givenInOutput(stdout: string, rows: readonly HostTool[]): HostTool[] {
  const notes = stdout.split(/\r?\n/);
  return rows.filter((h) => {
    const launch = launchInvoke(h);
    return launch !== null && notes.some((l) => l.startsWith(`  ${h.name}: `) && l.endsWith(`; or ${launch}`));
  });
}

describe("the closing notes' provenance line names only the forms this run gave (quick task 261019-i3g, review IN-12)", () => {
  for (const h of HOST_TOOLS) {
    it(`${h.name} installed alone: the provenance line is the oracle's for ${h.launchAgent === null ? "no launch form" : "its launch form"}`, () => {
      const c = freshCase(`provenance-${h.id}`);
      const r = runInstall(c.target, c.kitHome, [agentFlag(h)], { home: c.home, timeoutMs: 120_000 });
      expect(r.status, r.stdout + r.stderr).toBe(0);
      const expected = h.launchAgent === null ? [] : [h];
      expect(givenInOutput(r.stdout, HOST_TOOLS).map((t) => t.id), `premise: the forms the output gave`).toEqual(expected.map((t) => t.id));
      expectProvenance(r.stdout, expected, `${h.name} alone`);
    });
  }

  it("every agent, with the user's own file at every launch path: no form is given, and the provenance line is the base sentence alone", () => {
    const c = freshCase("provenance-own-files");
    for (const h of HOST_TOOLS) {
      if (h.launchAgent === null) continue;
      const p = join(c.target, ...h.launchAgent.split("/"));
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, "my own agent file\n");
    }
    const r = runInstall(c.target, c.kitHome, [], { home: c.home, timeoutMs: 120_000 });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    for (const h of HOST_TOOLS) {
      const mine = r.stdout.split(/\r?\n/).filter((l) => l.startsWith(`  ${h.name}: `));
      expect(mine, `premise: one closing line for ${h.name}`).toHaveLength(1);
      expect(mine[0], `premise: ${h.name}'s closing line gives no launch form`).not.toContain("; or ");
    }
    expectProvenance(r.stdout, [], "own files");
    expect(r.stdout.split(/\r?\n/).filter((l) => l.startsWith(PROVENANCE_HEAD))).toEqual([`  ${PROVENANCE_BASE}`]);
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

  // Quick task 261018-hs8 (D-03, D-05): every launch file the registry gives a row has its own touch-list bullet,
  // held to the Pi template bullet's rule. The launch paths are read from the registry rows (launchAgent), never typed
  // here, so a new launch agent needs a bullet before this case is green.
  it("the per-repo touch list has a bullet for each row's launchAgent that names its host, the ledger and the dry-run line", () => {
    const touches = section(GUIDE, "What the installer touches (per-repo), and only this");
    const bullets = touches.split(/\n(?=- )/);
    const launching = HOST_TOOLS.filter((t) => t.launchAgent !== null);
    expect(launching.length, "premise: some registry row has a launch agent").toBeGreaterThan(0);
    for (const t of launching) {
      const rel = t.launchAgent!;
      const mine = bullets.filter((b) => b.startsWith(`- \`${rel}\``));
      expect(mine.length, `the touch list must carry exactly one bullet starting with \`${rel}\``).toBe(1);
      const text = flat(mine[0]);
      for (const token of [t.name, "`.grugops/install.json`", "`would-add`", "left untouched", "no role text"]) {
        expect(text, `the ${t.name} launch-agent bullet does not carry ${token}`).toContain(token);
      }
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

  // D-06 (quick task 261018-hs8, human 2026-10-18, review CR-01; reverses planner decision PD-1): the section names every
  // launch file (each row's launchAgent, read from the registry data), says a default session does not read it and
  // that it is not counted as a route carrier, and words its `--check` line "a session started with" for a command
  // form, or "a session where you pick" for a panel form (quick task 261018-vfm, human 2026-10-18). The PD-1 sentence
  // (a launch file counted as one of its host's route carriers) is gone.
  it("the kit-route section names every launch file, says it is not a route carrier, and no longer says --check counts it as one (D-06)", () => {
    const sec = guideSection(ROUTE_SECTION);
    const launches = HOST_TOOLS.flatMap((h) => (h.launchAgent === null ? [] : [h.launchAgent]));
    expect(launches.length, "premise: some row has a launch file").toBeGreaterThan(0);
    for (const rel of launches) expect(sec, `the kit-route section does not name \`${rel}\``).toContain(`\`${rel}\``);
    expect(sec, "the PD-1 sentence is still there").not.toContain("counts it as one of its host's route carriers");
    expect(sec).toContain("not a route carrier");
    expect(sec).toContain("a session started with");
    expect(sec, "the panel wording of a launch line (quick task 261018-vfm)").toContain("a session where you pick");
    // Quick task 261019-ktd (review WR-05, WR-10): the section says a launch line also gives the form's live-run state,
    // the verified-live note with its host version or "host version not recorded", or LAUNCH_NOT_LIVE.
    expect(sec, "the live-run state of a form nobody ran live").toContain("UNKNOWN - verify: no live run");
    expect(sec, "the note's arm for a run that recorded no host version").toContain("host version not recorded");
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
/**
 * This file's own derivation, from the registry DATA only (never hostPointers or routeCarriers): a host's entry files,
 * then its adapter kind's pointers, first occurrence kept. A row's launchAgent is not one of them (D-06, quick task
 * 261018-hs8, human 2026-10-18; it reverses planner decision PD-1): a default session never reads it.
 */
const expectedCarriers = (h: Pick<HostTool, "adapter" | "entryFiles">): string[] => {
  const out: string[] = [];
  for (const f of [...h.entryFiles, ...(ROUTE_POINTERS as Record<string, readonly string[]>)[h.adapter]]) if (!out.includes(f)) out.push(f);
  return out;
};
const AGENTS_ONLY_COUNT = 0;
const AGENTS_ONLY = HOST_TOOLS.filter((h) => {
  const c = expectedCarriers(h);
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
      expect(got).toEqual(expectedCarriers(h));
      if (h.launchAgent !== null) expect(got, `routeCarriers(${h.id}) holds its launch file (D-06)`).not.toContain(h.launchAgent);
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

// ── ONE OWNER OF WHETHER A LAUNCH FILE IS INSTALL'S OWN (quick task 261019-faq, 261018-vfm review WR-08; AUTH-1) ──────
//
// Before this fix `--check` step (f) said ok for any file at a launch path holding the route sentence, while install's
// closing line offered the launch form only for a file install owns: two rules for one question. launchOwned is now the
// one answer. The census pins its call sites by enclosing function declaration (doctor step (f) in kitRouteFindings,
// and launchClosingClause), refuses any reference that is not a direct call, and refuses a direct owns call in either
// caller, so neither can answer the question a second way beside it. Measured 2026-10-19 by this census.
const LAUNCH_OWNER_CALLS: Readonly<Record<string, number>> = {
  "launchOwned@kitRouteFindings": 1,
  "launchOwned@launchClosingClause": 1,
};

describe("census: install.ts asks one owner of whether a launch file is install's own (quick task 261019-faq, review WR-08)", () => {
  it(`launchOwned is one function declaration called only at the pinned sites (${Object.entries(LAUNCH_OWNER_CALLS).map(([k, v]) => `${k} ×${v}`).join(", ")}), and neither caller calls owns`, () => {
    const found: Record<string, number> = {};
    const notCalls: string[] = [];
    const declared: string[] = [];
    const ownsInCallers: string[] = [];
    const callers = new Set(Object.keys(LAUNCH_OWNER_CALLS).map((k) => k.slice(k.indexOf("@") + 1)));
    for (const n of allNodes(installSource())) {
      if (!ts.isIdentifier(n)) continue;
      if (n.text === "owns" && ts.isCallExpression(n.parent) && n.parent.expression === n && callers.has(enclosingFunction(n))) {
        ownsInCallers.push(`owns@${enclosingFunction(n)}`);
      }
      if (n.text !== "launchOwned") continue;
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
    console.log(`install.ts launch-owner census: ${JSON.stringify(found)}`);
    expect(declared, "launchOwned is one function declaration").toEqual(["launchOwned"]);
    expect(notCalls, "a reference that is not a direct call escapes the census").toEqual([]);
    expect(ownsInCallers, "a launchOwned caller asks owns itself").toEqual([]);
    expect(found).toEqual(LAUNCH_OWNER_CALLS);
  });

  // Quick task 261019-i3g (review WR-09): the closing clause holds no reason text of its own. Before the fix it printed
  // one fixed reason ("install neither wrote nor owns"), whatever launchOwned found. Now launchOwned builds the whole
  // reason and the clause prints it verbatim, so no string literal or template piece inside launchClosingClause may
  // word a cause about the record or the writer.
  it("launchClosingClause holds no reason text of its own: no literal in it says wrote, owns, record, ledger or install's", () => {
    const pieces: string[] = [];
    let declarations = 0;
    for (const n of allNodes(installSource())) {
      if (ts.isFunctionDeclaration(n) && n.name?.text === "launchClosingClause" && n.body !== undefined) declarations++;
      if (enclosingFunction(n) !== "launchClosingClause") continue;
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) pieces.push(n.text);
      else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) pieces.push(n.text);
    }
    expect(declarations, "premise: launchClosingClause is one function declaration with a body").toBe(1);
    expect(pieces.length, "premise: the walk found the clause's literals").toBeGreaterThan(0);
    const reasonWords = pieces.filter((t) => /wrote|owns|record|ledger|install's/.test(t));
    expect(reasonWords, "a reason literal in launchClosingClause (the reason comes only from launchOwned)").toEqual([]);
  });
});

// ── THE LAUNCH PAIR IS ONE TYPE (quick task 261019-i3g, 261018-vfm review IN-13) ───────────────────────────────────────
//
// Before this fix launchAgent and launchForm were two independent fields, and only a registry test held "both set or
// both null". So kitRouteFindings step (f) carried a `launchSession(host) ?? <a backticked path>` fallback that would
// print a file path as a launch command if a row held one and not the other. The pair is now one discriminated union
// (host-tools.ts LaunchPair), so a row with one and not the other does not compile, and narrowing on launchAgent
// gives a non-null launchForm. The two @ts-expect-error rows are checked by `npm run typecheck` (tsconfig.tests.json);
// vitest runs only the controls. Every variable is read in an expect: under noUnusedLocals an unused variable would
// itself satisfy a directive, and the pin would pass whatever the type says.
describe("the launch pair is one type (quick task 261019-i3g, review IN-13)", () => {
  it("a row with a launch file and no form, or a form and no file, does not compile; both null and both set do", () => {
    const base: HostTool = HOST_TOOLS[0];
    const form: LaunchForm = { kind: "command", text: "`x`", verifiedLive: null, caution: null, noun: "launch file" };
    // @ts-expect-error a launch file with no launch form
    const fileOnly: HostTool = { ...base, launchAgent: "x.md", launchForm: null };
    // @ts-expect-error a launch form with no launch file
    const formOnly: HostTool = { ...base, launchAgent: null, launchForm: { kind: "command", text: "`x`", verifiedLive: null, caution: null, noun: "launch file" } };
    const neither: HostTool = { ...base, launchAgent: null, launchForm: null };
    const both: HostTool = { ...base, launchAgent: "x.md", launchForm: form };
    expect([fileOnly.launchAgent, fileOnly.launchForm]).toEqual(["x.md", null]);
    expect([formOnly.launchAgent, formOnly.launchForm]).toEqual([null, form]);
    expect([neither.launchAgent, neither.launchForm]).toEqual([null, null]);
    expect([both.launchAgent, both.launchForm]).toEqual(["x.md", form]);
  });

  it("narrowed on launchAgent, every launch row's launchSession and launchInvoke are strings, with no null to default", () => {
    let seen = 0;
    for (const h of HOST_TOOLS) {
      if (h.launchAgent === null) continue;
      const session: string = launchSession(h);
      const invoke: string = launchInvoke(h);
      expect(session.length, `${h.id}: launchSession`).toBeGreaterThan(0);
      expect(invoke.length, `${h.id}: launchInvoke`).toBeGreaterThan(0);
      seen++;
    }
    expect(seen, "premise: the registry has launch rows").toBe(HOST_TOOLS.filter((h) => h.launchAgent !== null).length);
    expect(seen).toBeGreaterThan(0);
  });
});

// ── NO SILENT LAUNCH FALLBACK IN install.ts (quick task 261019-i3g, 261018-vfm review IN-13) ───────────────────────────
//
// The type above holds the pair; this census holds the code that reads it. (a) No `??` whose left operand is a call of
// launchSession or launchInvoke: the narrowed type gives a string, and a default would print an invented form.
// (b) In kitRouteFindings, no `??` whose left operand is a property access named `why`: the `user` carrier state
// always carries its reason (CarrierClass), and the old default worded an append as "install will not write it".
// (c) kitRouteFindings holds a throw whose argument names `appendable`: that state cannot reach step (f) (no launch
// file is a ROUTE_BLOCKS carrier), so reaching it fails loudly instead of printing a verdict with no words for it.
describe("census: no silent launch fallback in install.ts (review IN-13)", () => {
  it("no `??` defaults launchSession, launchInvoke or kitRouteFindings' `why`, and step (f) throws on `appendable`", () => {
    const launchDefaults: string[] = [];
    const whyDefaults: string[] = [];
    const appendableThrows: string[] = [];
    let kitRouteFindings = 0;
    const sf = installSource();
    for (const n of allNodes(sf)) {
      if (ts.isFunctionDeclaration(n) && n.name?.text === "kitRouteFindings" && n.body !== undefined) kitRouteFindings++;
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
        const left = n.left;
        if (ts.isCallExpression(left) && ts.isIdentifier(left.expression) && ["launchSession", "launchInvoke"].includes(left.expression.text)) {
          launchDefaults.push(`${n.getText(sf)} in ${enclosingFunction(n)}`);
        }
        if (ts.isPropertyAccessExpression(left) && left.name.text === "why" && enclosingFunction(n) === "kitRouteFindings") {
          whyDefaults.push(n.getText(sf));
        }
      }
      if (ts.isThrowStatement(n) && enclosingFunction(n) === "kitRouteFindings" && n.expression.getText(sf).includes("appendable")) {
        appendableThrows.push(n.expression.getText(sf));
      }
    }
    expect(kitRouteFindings, "premise: kitRouteFindings is one function declaration with a body").toBe(1);
    expect(launchDefaults, "(a) a `??` default on launchSession or launchInvoke").toEqual([]);
    expect(whyDefaults, "(b) a `??` default on a `why` in kitRouteFindings").toEqual([]);
    expect(appendableThrows.length, "(c) kitRouteFindings throws on the `appendable` state").toBe(1);
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
// TABLE_CARRIERS 6 -> 7 on 2026-10-18 (quick task 261018-hs8): Antigravity CLI's launch agent
// `.agents/agents/grugops-orchestrator.md` (its row's launchAgent) joined the derived carrier set, so the table has
// 2^(7+1) = 256 combinations.
// TABLE_CARRIERS 7 -> 10 on 2026-10-18 (quick task 261018-hs8, Task 2): the launch agents of OpenCode, Copilot CLI and
// Pi (`.opencode/agents/grugops-orchestrator.md`, `.github/agents/grugops-orchestrator.agent.md`,
// `.pi/grugops-orchestrator.md`, each its row's launchAgent) joined the derived carrier set, so the table has
// 2^(10+1) = 2048 combinations.
// TABLE_CARRIERS 10 -> 6 on 2026-10-18 (quick task 261018-hs8 fix pass, D-06, human after review CR-01; it reverses
// planner decision PD-1): the four launch files left the derived carrier set, because a default session never reads
// one, so the table is back to 2^(6+1) = 128 combinations.
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
  const carriers = [...new Set(HOST_TOOLS.flatMap((h) => expectedCarriers(h)))];
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
        reads: (h, rel) => expectedCarriers(h).includes(rel),
        holds: (rel) => holdsSet.has(rel),
        adapterReaches: (h) => adapterSet.has(h.id),
      };
      // THE ORACLE: written from the definitions, sharing nothing with host-tools.ts but the registry rows.
      const oracleVia = (h: HostTool): string[] => expectedCarriers(h).filter((rel) => holdsSet.has(rel));
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
              (h) => expectedCarriers(h).includes(rel) && oracleVia(h).length === 0 && !adapterSet.has(h.id),
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

// ── THE LAUNCH AGENT FIELD (quick task 261018-hs8, D-01, D-05) ───────────────────────────────────────────────────────
// HostTool.launchAgent is the one authority for a host's launch file. The launch-bearing rows are derived from the
// registry data and pinned (LAUNCH_AGENT_COUNT), and every owner expectation below is read from the registry rows.
// LAUNCH_AGENT_COUNT = 1 on 2026-10-18 (quick task 261018-hs8, Task 1, the tracer): Antigravity CLI only. It moves with
// a reason when another row gains a launch agent.
// LAUNCH_AGENT_COUNT 1 -> 4 on 2026-10-18 (quick task 261018-hs8, Task 2): the OpenCode, Copilot CLI and Pi rows gained
// their launch agents. Codex CLI and Claude Code stay null.
const LAUNCH_AGENT_COUNT = 4;
const LAUNCH_ROWS = HOST_TOOLS.filter((h) => h.launchAgent !== null);
/**
 * The launch-wording oracle (quick task 261018-vfm; with the live-run state since quick task 261019-ktd, review WR-05,
 * WR-10). Every expected string is built here from the row's own kind, text, date and hostVersion with literal
 * prefixes and suffixes, never by calling the helper under test, so a helper that words a panel pick as a command,
 * drops the live-run state or drops the host version goes red.
 */
function expectLaunchWording(h: HostTool): void {
  const lf = h.launchForm;
  expect(lf, `${h.id}: a launch row has a launch form`).not.toBeNull();
  if (lf === null) return;
  const form = lf.text;
  const run = lf.verifiedLive;
  const note =
    run === null ? null : "verified live by a human on " + run.date + (run.hostVersion === null ? ", host version not recorded" : " on " + h.name + " " + run.hostVersion);
  expect(launchLiveNote(h), h.id).toBe(note);
  const phrase = (lf.kind === "panel" ? "a session where you pick " : "a session started with ") + form;
  expect(launchSession(h), h.id).toBe(phrase + " (" + (note === null ? "UNKNOWN - verify: no live run" : note) + ")");
  const clause = lf.kind === "panel" ? "pick " + form + " to run the session as the Orchestrator" : "start the session as the Orchestrator with " + form;
  // Quick task 261019-mq1 (261018-hs8 review WR-02): the clause ends with the row's caution, after its note, when the
  // row has one.
  expect(launchInvoke(h), h.id).toBe(clause + (note === null ? "" : " (" + note + ")") + (lf.caution === null ? "" : ". Warning: " + lf.caution));
}

describe("HostTool.launchAgent: the per-host launch file (quick task 261018-hs8, D-01, D-05)", () => {
  it("every registry row states launchAgent (a string or null), so no row leaves it out", () => {
    for (const h of HOST_TOOLS) {
      expect(Object.prototype.hasOwnProperty.call(h, "launchAgent"), `${h.id} has no launchAgent field`).toBe(true);
      expect(h.launchAgent === null || typeof h.launchAgent === "string", `${h.id}.launchAgent`).toBe(true);
    }
  });

  it(`the launch-bearing rows, derived (${LAUNCH_AGENT_COUNT}): ${LAUNCH_ROWS.map((h) => h.id).join(", ")}`, () => {
    expect(LAUNCH_ROWS.length, "the derived count of launch-bearing rows moved; re-derive and re-pin LAUNCH_AGENT_COUNT").toBe(LAUNCH_AGENT_COUNT);
    expect(LAUNCH_ROWS.map((h) => h.id)).toEqual(["antigravity", "opencode", "copilot", "pi"]);
    expect(HOST_TOOLS.filter((h) => h.launchAgent === null).map((h) => h.id), "no launch agent").toEqual(["claude", "codex"]);
    expect(HOST_TOOLS.find((h) => h.id === "antigravity")?.launchAgent).toBe(ANTIGRAVITY_AGENT_REL);
    expect(HOST_TOOLS.find((h) => h.id === "opencode")?.launchAgent).toBe(OPENCODE_AGENT_REL);
    expect(HOST_TOOLS.find((h) => h.id === "copilot")?.launchAgent).toBe(COPILOT_AGENT_REL);
    expect(HOST_TOOLS.find((h) => h.id === "pi")?.launchAgent).toBe(PI_LAUNCH_REL);
    expect(ANTIGRAVITY_AGENT_REL).toBe(`.agents/agents/${LAUNCH_AGENT_NAME}.md`);
    expect(OPENCODE_AGENT_REL).toBe(`.opencode/agents/${LAUNCH_AGENT_NAME}.md`);
    expect(COPILOT_AGENT_REL).toBe(`.github/agents/${LAUNCH_AGENT_NAME}.agent.md`);
    expect(PI_LAUNCH_REL).toBe(`.pi/${LAUNCH_AGENT_NAME}.md`);
    expect(LAUNCH_AGENT_NAME).toBe("grugops-orchestrator");
  });

  it("D-01: the basename of every launch path, with `.agent.md` or `.md` stripped, is LAUNCH_AGENT_NAME", () => {
    for (const h of LAUNCH_ROWS) {
      const base = h.launchAgent!.split("/").pop()!;
      const id = base.endsWith(".agent.md") ? base.slice(0, -".agent.md".length) : base.endsWith(".md") ? base.slice(0, -".md".length) : base;
      expect(id, `${h.id}: ${h.launchAgent}`).toBe(LAUNCH_AGENT_NAME);
    }
  });

  it("D-02: no launch path is a file Pi loads on its own (`.pi/SYSTEM.md`, `.pi/APPEND_SYSTEM.md`) or Pi's settings, and Pi's lies under `.pi/`", () => {
    const refused = [".pi/SYSTEM.md", ".pi/APPEND_SYSTEM.md", ".pi/settings.json"];
    for (const h of HOST_TOOLS) {
      for (const rel of [...hostPointers(h), ...hostFootprint(h)]) expect(refused.includes(rel), `${h.id}: ${rel}`).toBe(false);
    }
    expect(PI_LAUNCH_REL.startsWith(".pi/")).toBe(true);
    expect(PI_LAUNCH_REL.split("/"), "directly under .pi/, outside .pi/prompts/ (not a prompt template)").toHaveLength(2);
  });

  it("each launch path is a target-relative POSIX path, unique across rows, and in no kind's ROUTE_POINTERS or ADAPTER_FOOTPRINT (ownership is per agent, D-05)", () => {
    const kindPaths = new Set([...Object.values(ROUTE_POINTERS).flat(), ...Object.values(ADAPTER_FOOTPRINT).flat()]);
    const seen = new Set<string>();
    for (const h of LAUNCH_ROWS) {
      const rel = h.launchAgent!;
      expect(rel, `${h.id}: ${rel}`).not.toMatch(/^[/~]|^[A-Za-z]:|\\|(^|\/)\.\.(\/|$)|(^|\/)\.(\/|$)|\/\/|\/$/);
      expect(rel.length, h.id).toBeGreaterThan(0);
      expect(seen.has(rel), `${rel} is two rows' launch agent`).toBe(false);
      seen.add(rel);
      expect(kindPaths.has(rel), `${rel} (${h.id}) is listed in a per-kind table`).toBe(false);
      for (const p of Object.values(ADAPTER_FOOTPRINT).flat()) expect(p.endsWith("/") && rel.startsWith(p), `${rel} is under the kind prefix ${p}`).toBe(false);
    }
  });

  it("hostPointers and hostFootprint are the kind's table, then the row's launchAgent, for every row (checked against the data, not themselves)", () => {
    for (const h of HOST_TOOLS) {
      const launch = h.launchAgent === null ? [] : [h.launchAgent];
      expect([...hostPointers(h)], h.id).toEqual([...new Set([...ROUTE_POINTERS[h.adapter], ...launch])]);
      expect([...hostFootprint(h)], h.id).toEqual([...new Set([...ADAPTER_FOOTPRINT[h.adapter], ...launch])]);
    }
  });

  it("the launch file and the directory install makes for it belong to their one row; the shared directory and the shared skill keep both owners", () => {
    const ids = (...want: string[]): string[] => HOST_TOOLS.filter((h) => want.includes(h.id)).map((h) => h.id);
    expect(entryOwners({ path: ANTIGRAVITY_AGENT_REL, kind: "file" })).toEqual(["antigravity"]);
    expect(entryOwners({ path: ".agents/agents", kind: "dir" })).toEqual(["antigravity"]);
    expect(entryOwners({ path: ".agents", kind: "dir" })).toEqual(ids("codex", "antigravity"));
    expect(entryOwners({ path: AGENT_SKILL_REL, kind: "file" })).toEqual(ids("codex", "antigravity"));
    expect(entryOwners({ path: ".agents/agents", kind: "file" }), "a file named like the launch directory").toEqual([]);
    expect(entryOwners({ path: ".agents/agents/other.md", kind: "file" }), "another file in the launch directory").toEqual([]);
    for (const h of LAUNCH_ROWS) expect(entryOwners({ path: h.launchAgent!, kind: "file" }), h.launchAgent!).toEqual([h.id]);
    // Task 2 (2026-10-18): each new launch file's directory belongs to its one row, and so does the parent directory
    // install makes for it, including `.github`, which Copilot CLI's block file already gave it.
    expect(entryOwners({ path: OPENCODE_AGENT_REL, kind: "file" })).toEqual(["opencode"]);
    expect(entryOwners({ path: ".opencode/agents", kind: "dir" })).toEqual(["opencode"]);
    expect(entryOwners({ path: ".opencode", kind: "dir" })).toEqual(["opencode"]);
    expect(entryOwners({ path: COPILOT_AGENT_REL, kind: "file" })).toEqual(["copilot"]);
    expect(entryOwners({ path: ".github/agents", kind: "dir" })).toEqual(["copilot"]);
    expect(entryOwners({ path: ".github", kind: "dir" })).toEqual(["copilot"]);
    expect(entryOwners({ path: ".github/workflows/ci.yml", kind: "file" }), "a user's workflow under .github").toEqual([]);
    expect(entryOwners({ path: PI_LAUNCH_REL, kind: "file" })).toEqual(["pi"]);
    expect(entryOwners({ path: ".pi", kind: "dir" })).toEqual(["pi"]);
    expect(entryOwners({ path: ".pi/SYSTEM.md", kind: "file" }), "a user's Pi system prompt").toEqual([]);
  });

  // D-06 (human 2026-10-18, review CR-01; it reverses planner decision PD-1, which made routeCarriers end with the
  // launch file): a launch file is read only by a session started with it, so it is in no row's routeCarriers, and in
  // no other row's either; launchCarriers is the row's launch file alone. Checked against the registry data.
  it("routeCarriers of every row is its entryFiles, then its kind's ROUTE_POINTERS, and holds no row's launch file (D-06)", () => {
    const launches = LAUNCH_ROWS.map((h) => h.launchAgent!);
    for (const h of HOST_TOOLS) {
      const carriers = [...routeCarriers(h)];
      expect(carriers, h.id).toEqual([...new Set([...h.entryFiles, ...ROUTE_POINTERS[h.adapter]])]);
      for (const rel of launches) expect(carriers, `${h.id}'s routeCarriers hold the launch file ${rel}`).not.toContain(rel);
    }
  });

  it("launchCarriers of every row is its launchAgent alone, or nothing (D-06)", () => {
    for (const h of HOST_TOOLS) expect([...launchCarriers(h)], h.id).toEqual(h.launchAgent === null ? [] : [h.launchAgent]);
  });

  // Review WR-03: invoke is the default session's text and never names the launch form; launchInvoke carries it and is
  // offered by install's closing notes only for a launch file install owns. Quick task 261018-vfm (2026-10-18): the
  // launch form's shape is typed (LaunchForm.kind, a `command` or a `panel` pick), and every wording below is built
  // here from the row's own kind, text and verifiedLive with literal prefixes and suffixes, never by calling the helper
  // under test, so a helper that words a panel pick as a command (or drops the dated note) goes red.
  it("every launch row's launch form is typed, its text is backticked, names LAUNCH_AGENT_NAME or the launch path, is absent from invoke, and launchSession, launchInvoke and launchLiveNote word it by its kind (WR-03, D-06, 261018-vfm)", () => {
    const PANEL_TEXT = "`" + LAUNCH_AGENT_NAME + "` in the `/agents` panel";
    for (const h of HOST_TOOLS) {
      if (h.launchAgent === null) {
        expect(h.launchForm, h.id).toBeNull();
        expect(launchInvoke(h), h.id).toBeNull();
        expect(launchSession(h), h.id).toBeNull();
        expect(launchLiveNote(h), h.id).toBeNull();
        continue;
      }
      const lf = h.launchForm;
      expect(lf, `${h.id}: a launch row has a launch form`).not.toBeNull();
      if (lf === null) continue;
      const form = lf.text;
      expect(["command", "panel"], `${h.id}: kind`).toContain(lf.kind);
      expect(form, h.id).toMatch(/`[^`]+`/);
      expect(form.includes(LAUNCH_AGENT_NAME) || form.includes(h.launchAgent), `${h.id}: ${form}`).toBe(true);
      expect(h.invoke, `${h.id}'s invoke names its launch form`).not.toContain(form);
      for (const tok of form.match(/`[^`]+`/g) ?? []) if (tok.includes(LAUNCH_AGENT_NAME) || tok.includes(h.launchAgent)) expect(h.invoke, `${h.id}'s invoke names ${tok}`).not.toContain(tok);
      if (lf.kind === "panel") {
        expect(form, `${h.id}: a panel pick's text`).toBe(PANEL_TEXT);
        for (const tok of form.match(/`[^`]+`/g) ?? []) expect(tok.slice(1).startsWith("--"), `${h.id}: a panel pick names the flag ${tok}`).toBe(false);
        expect(form.split(/\s+/).some((w) => w.replace(/^`/, "").startsWith("--")), `${h.id}: a panel pick names a command-line flag`).toBe(false);
      } else {
        expect(form.startsWith("`"), `${h.id}: a command form starts with its backticked command`).toBe(true);
      }
      const run = lf.verifiedLive;
      if (run !== null) {
        expect(run.date, `${h.id}: the live run's date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(run.hostVersion === null || (typeof run.hostVersion === "string" && run.hostVersion.length > 0), `${h.id}: hostVersion is null or a non-empty string`).toBe(true);
      }
      expectLaunchWording(h);
    }
    expect(LAUNCH_NOT_LIVE, "the live-run state of a form nobody ran live").toBe("UNKNOWN - verify: no live run");
  });

  // Quick task 261019-ktd (review WR-10): the note's arm for a live run that recorded no host version. Every row in
  // the registry today carries the host version the human gave, so this arm is proved on a synthetic row: a verified
  // launch row spread, with its hostVersion set to null. It is a test fixture, not a run anyone made.
  it("a live run with no recorded host version reads \"host version not recorded\" in the note, the session phrase and the clause (261019-ktd)", () => {
    const verified = LAUNCH_ROWS.filter((h) => h.launchForm !== null && h.launchForm.verifiedLive !== null);
    expect(verified.length, "premise: some launch row was verified live").toBeGreaterThan(0);
    for (const h of verified) {
      const lf = h.launchForm!;
      const unrecorded = { ...h, launchForm: { ...lf, verifiedLive: { date: lf.verifiedLive!.date, hostVersion: null } } } as HostTool;
      expect(launchLiveNote(unrecorded), h.id).toBe("verified live by a human on " + lf.verifiedLive!.date + ", host version not recorded");
      expectLaunchWording(unrecorded);
    }
  });

  // The human's live-run report of 2026-10-18 (quick task 261018-vfm), pinned literally: Antigravity CLI and OpenCode
  // are picked in the `/agents` panel, and picking it works (verified live); on the same run a human found that
  // OpenCode 2.0.26 did not start a session with `--agent`; Pi loads the file passed with `--append-system-prompt`
  // (verified live; Pi's [Context] listed it); GitHub Copilot CLI was skipped, so it stays UNKNOWN - verify. Codex CLI
  // has no launch agent. A row moves here only with a new dated report from a human's live run.
  // Re-pinned 2026-10-19 by quick task 261019-ktd (review WR-10): verifiedLive records the live run as
  // {date, hostVersion}. The host versions are the ones the human gave on 2026-10-19 for the runs of 2026-10-18
  // (Antigravity CLI as `agy 1.4.2`, recorded as the version 1.4.2); none is taken from a `--help` read.
  it("each launch row's kind and verifiedLive are the human's live-run report of 2026-10-18, with the host versions given on 2026-10-19 (261018-vfm, 261019-ktd)", () => {
    const got = Object.fromEntries(LAUNCH_ROWS.map((h) => [h.id, h.launchForm === null ? null : [h.launchForm.kind, h.launchForm.verifiedLive]]));
    expect(got).toEqual({
      antigravity: ["panel", { date: "2026-10-18", hostVersion: "1.4.2" }],
      opencode: ["panel", { date: "2026-10-18", hostVersion: "2.0.26" }],
      copilot: ["command", null],
      pi: ["command", { date: "2026-10-18", hostVersion: "1.1.0" }],
    });
  });

  // Pinned 2026-10-19 by quick task 261019-mq1 (261018-hs8 review WR-02, IN-05), literally: what install's lines call
  // each launch file (a file Pi reads as text is a launch file; an agent definition the host lists is a launch agent),
  // and the warning install prints after a launch form. Only Pi's form carries one: the flag reads the file into Pi's
  // system prompt without Pi's project-trust check. A row moves here only with a stated reason.
  it("each launch row's noun and caution are pinned literally; only Pi's form carries a caution (261019-mq1, review WR-02, IN-05)", () => {
    const got = Object.fromEntries(LAUNCH_ROWS.map((h) => [h.id, h.launchForm === null ? null : [h.launchForm.noun, h.launchForm.caution]]));
    expect(got).toEqual({
      antigravity: ["launch agent", null],
      opencode: ["launch agent", null],
      copilot: ["launch agent", null],
      pi: ["launch file", "the flag reads the file into Pi's system prompt without Pi's project-trust check, so only use it in a repository you trust"],
    });
    expect(LAUNCH_ROWS.filter((h) => h.launchForm !== null && h.launchForm.caution !== null).map((h) => h.id)).toEqual(["pi"]);
  });
});

// ── CENSUS: THE PER-KIND TABLES ARE INDEXED ONLY BY THE HELPERS AND THE GENERATOR'S outputRel (261018-hs8) ──────────
// A consumer that reads ROUTE_POINTERS[h.adapter] or ADAPTER_FOOTPRINT[h.adapter] itself would miss the row's launch
// agent (per-kind ownership, the class D-05 rules out). Every tracked non-test `.ts` under install/ and scripts/ is
// parsed, and every element access whose object is the identifier ROUTE_POINTERS or ADAPTER_FOOTPRINT is counted by
// file and enclosing function. Only outputRel stays per kind, because it places a kind's own entry, and routeCarriers
// (D-06), because it is the default-session set that leaves the launch agent out.
// 3 -> 4 on 2026-10-18 (quick task 261018-hs8 fix pass, D-06): routeCarriers reads ROUTE_POINTERS by kind again, on
// purpose: it is the set a DEFAULT session reads, which leaves the row's launch file out (launchCarriers holds it).
const PER_KIND_ACCESSES: Readonly<Record<string, number>> = {
  "host-tools.ts@hostPointers": 1,
  "host-tools.ts@hostFootprint": 1,
  "host-tools.ts@routeCarriers": 1,
  "generate-host-entries.ts@outputRel": 1,
};

describe("census: ROUTE_POINTERS and ADAPTER_FOOTPRINT are indexed only by hostPointers, hostFootprint, routeCarriers and outputRel (quick task 261018-hs8)", () => {
  it(`exactly ${Object.values(PER_KIND_ACCESSES).reduce((a, b) => a + b, 0)} element accesses in product code: ${Object.keys(PER_KIND_ACCESSES).join(", ")}`, () => {
    const repo = join(import.meta.dirname, "..");
    const ls = spawnSync("git", ["-C", repo, "ls-files", "--", "install/*.ts", "scripts/*.ts"], { encoding: "utf8" });
    expect(ls.status, ls.stderr).toBe(0);
    const files = ls.stdout
      .split("\n")
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts") && !/\.test(-support)?\.ts$|\.testkit\.ts$/.test(f));
    expect(files, "premise: the census reads host-tools.ts").toContain("install/host-tools.ts");
    expect(files, "premise: the census reads the generator").toContain("scripts/generate-host-entries.ts");
    expect(files, "premise: the census reads install.ts").toContain("install/install.ts");
    expect(files, "premise: the census reads uninstall.ts").toContain("install/uninstall.ts");
    const found: Record<string, number> = {};
    for (const f of files) {
      const sf = ts.createSourceFile(f, readFileSync(join(repo, ...f.split("/")), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      for (const n of allNodes(sf)) {
        if (!ts.isElementAccessExpression(n) || !ts.isIdentifier(n.expression)) continue;
        if (n.expression.text !== "ROUTE_POINTERS" && n.expression.text !== "ADAPTER_FOOTPRINT") continue;
        const key = `${f.split("/").pop()}@${enclosingFunction(n)}`;
        found[key] = (found[key] ?? 0) + 1;
      }
    }
    console.log(`per-kind table access census: ${JSON.stringify(found)} over ${files.length} file(s)`);
    expect(found).toEqual(PER_KIND_ACCESSES);
  });
});

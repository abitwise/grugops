// host-entries.test.ts — the install side of every whole-file host entry (phase 34.1, plan 34.1-01; D-08, D-09,
// D-11, D-20, D-21; T-34-13).
//
// WHAT IS UNDER TEST. A scripted install copies each non-Claude whole-file entry (the agent skill Codex CLI reads,
// `.agents/skills/grugops/SKILL.md`; the OpenCode command; the Pi prompt template) from the committed generated file
// in the kit source (GRUGOPS_SRC), records it in the install ledger as a kit-false `file` entry, and uninstall
// removes it through the ledger walk. `--check` names each entry as a route carrier.
//
// THE ENTRY SET IS DERIVED, NEVER TYPED. ENTRY_RELS is the generator's own renderedEntryRels()
// (scripts/generate-host-entries.ts): the ROUTE_POINTERS path of every adapter kind it renders, then each registry
// row's launch agent (quick task 261018-hs8), with its count asserted; every other ROUTE_POINTERS path is checked to be
// a sentinel-block carrier on disk after an install, so the two sides cannot drift apart silently.
//
// Drives the COMMITTED install/install.js and uninstall.js (npm run build first). Every target and kit home
// (GRUGOPS_HOME) is a scratch directory under one per-file root, removed in afterAll.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { HOST_TOOLS, HOST_TOOL_COUNT, ROUTE_POINTERS, KIT_ROUTE, AGENT_SKILL_REL, ANTIGRAVITY_AGENT_REL, agentFlag } from "./host-tools.js";
import { renderedEntryRels } from "../scripts/generate-host-entries.js";
import { LEGACY_ADAPTER_KINDS, contentRecord, fileRecord } from "./install-marker.js";
import { INSTALL_JS, MARKER_REL, REPO_ROOT, pathText, runInstall, runUninstall, spawnBin, type Run } from "./installer-paths.test-support.js";
import { fileRecords, markerLedger, readMarkerObject, withLedger, withoutAgentsField } from "./ledger.test-support.js";

const ROOT = mkdtempSync(join(tmpdir(), "ghentries-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

let n = 0;
/** A fresh scratch row: an empty git repository and a separate kit home, both under ROOT. */
function scratchRow(): { target: string; kitHome: string } {
  const dir = join(ROOT, `r${n++}`);
  const target = join(dir, "t");
  const kitHome = join(dir, "kit");
  mkdirSync(target, { recursive: true });
  spawnSync("git", ["init", "-q", target], { encoding: "utf8" });
  return { target, kitHome };
}

const at = (root: string, rel: string): string => join(root, ...rel.split("/"));
const check = (target: string, kitHome: string): Run => spawnBin(INSTALL_JS, ["--check"], target, kitHome);
const lines = (out: string): string[] => out.split("\n");

/** Every whole-file entry the generator renders, as the registry places it: the generator's own list. */
const ENTRY_RELS: readonly string[] = renderedEntryRels();
/** The pinned count of ENTRY_RELS: it moves only with a reason. Plan 34.1-01: the agent skill (Codex CLI), the Pi
 *  prompt template and the OpenCode command. 3 -> 4 on 2026-10-18 (quick task 261018-hs8, Task 1): the first launch
 *  agent, `.agents/agents/grugops-orchestrator.md` (Antigravity CLI's). 4 -> 7 on 2026-10-18 (quick task 261018-hs8,
 *  Task 2): the launch agents of OpenCode, Copilot CLI and Pi. */
const ENTRY_COUNT = 7;
/** The carriers registry row `h` reads, from the registry data: entry files, its kind's pointers, its launch agent. */
const readsOf = (h: (typeof HOST_TOOLS)[number]): string[] => [...h.entryFiles, ...ROUTE_POINTERS[h.adapter], ...(h.launchAgent === null ? [] : [h.launchAgent])];

describe("host entries: a scripted install gives Codex CLI its skill entry (plan 34.1-01, D-08, D-20)", () => {
  it(`the derived entry set has ${ENTRY_COUNT} path(s) and includes AGENT_SKILL_REL`, () => {
    expect(ENTRY_RELS.length, ENTRY_RELS.join(", ")).toBe(ENTRY_COUNT);
    expect(ENTRY_RELS).toContain(AGENT_SKILL_REL);
    for (const rel of ENTRY_RELS) expect(rel.startsWith(".gemini/"), rel).toBe(false);
  });

  it("tracer: install writes the committed bytes, records a kit-false file entry, --check names the carrier and Codex's reach line, uninstall removes it and the directories install made", () => {
    const { target, kitHome } = scratchRow();
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);

    const file = at(target, AGENT_SKILL_REL);
    expect(lstatSync(file).isFile(), "the skill entry is a regular file").toBe(true);
    const committed = readFileSync(at(REPO_ROOT, AGENT_SKILL_REL));
    expect(readFileSync(file).equals(committed), "the installed bytes equal the committed generated file").toBe(true);
    expect(committed.toString("utf8")).toContain(KIT_ROUTE);
    expect(contentRecord(readFileSync(file)), "premise: the installed bytes hash like the committed file").toBe(contentRecord(committed));

    const marker = readMarkerObject(target);
    const own = fileRecords(marker, false);
    // The record is install-marker.ts fileRecord of the bytes written and the mode the file has now (writtenFileRecord).
    expect(own[AGENT_SKILL_REL], `the ledger has no kit-false file entry for ${AGENT_SKILL_REL}`).toBe(fileRecord(committed, lstatSync(file).mode));
    expect(fileRecords(marker, true)[AGENT_SKILL_REL], "the entry is not recorded as a kit file").toBeUndefined();

    expect(existsSync(at(target, ".gemini/skills/grugops/SKILL.md")), ".gemini/skills/grugops/SKILL.md is never written (D-20)").toBe(false);

    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(
      lines(c.stdout).some((l) => /^ {2}ok\s/.test(l) && l.includes(`kit route carried by ${AGENT_SKILL_REL} (read by `)),
      c.stdout,
    ).toBe(true);
    const codex = HOST_TOOLS.filter((h) => ROUTE_POINTERS[h.adapter].includes(AGENT_SKILL_REL));
    expect(codex.length, "premise: some registry host has the agent-skill entry").toBeGreaterThan(0);
    for (const h of codex) {
      const reach = lines(c.stdout).filter((l) => /^ {2}reach\s/.test(l) && l.includes(`${h.name}: `));
      expect(reach.length, c.stdout).toBe(1);
      expect(reach[0], c.stdout).toContain(`reaches the Orchestrator through`);
      expect(reach[0], c.stdout).toContain(AGENT_SKILL_REL);
    }

    const u = runUninstall(target, kitHome);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    expect(existsSync(file), u.stdout).toBe(false);
    for (const d of [".agents/skills/grugops", ".agents/skills", ".agents"]) expect(existsSync(at(target, d)), `${d} left after uninstall`).toBe(false);
  });
});

// ── ONE AGENT, ONE ENTRY (plan 34.1-08, D-06, D-10) ─────────────────────────────────────────────────────────────────
// `install.js --codex` into an empty repository: the shared footprint (AGENTS.md, tools/grugops/, the marker, the seeded
// state) and Codex CLI's one entry, and nothing for any other agent. The class test over every registry row is in
// install/installer-write-set.test.ts ("every agent writes only its own footprint and the shared files").
describe("host entries: a single-agent install writes the shared files and that agent's entry only (plan 34.1-08, D-06, D-10)", () => {
  it("tracer: --codex into an empty repository writes AGENTS.md, tools/grugops/, the marker, the seeded state and the agent skill; nothing under .claude/, .github/, .pi/ or .opencode/, no CLAUDE.md; the marker records agents [codex]", () => {
    const { target, kitHome } = scratchRow();
    const codex = HOST_TOOLS.find((h) => h.id === "codex");
    expect(codex, "premise: the registry has a codex row").toBeDefined();
    const r = runInstall(target, kitHome, [agentFlag(codex!)]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    // The shared footprint (D-06).
    for (const rel of ["AGENTS.md", MARKER_REL, ".grugops/factory.config.json", "plans/board.md", "memory-bank/00-index.md"]) {
      expect(lstatSync(at(target, rel)).isFile(), `${rel} was not written`).toBe(true);
    }
    expect(lstatSync(at(target, "tools/grugops")).isDirectory(), "tools/grugops/ was not written").toBe(true);
    // Codex CLI's one entry.
    expect(readFileSync(at(target, AGENT_SKILL_REL)).equals(readFileSync(at(REPO_ROOT, AGENT_SKILL_REL))), AGENT_SKILL_REL).toBe(true);
    // Nothing for any other agent (D-10: no .claude/ path at all when Claude Code is not chosen).
    for (const rel of [".claude", "CLAUDE.md", ".github", ".pi", ".opencode", "opencode.json"]) {
      expect(existsSync(at(target, rel)), `${rel} was written by an install that chose only Codex CLI`).toBe(false);
    }
    expect(readMarkerObject(target).agents).toEqual(["codex"]);
  });

  // D-07 (plan 34.1-10, VERDICT-1): the doctor speaks only for the agents installed here. The carriers it must not
  // report are derived: every route carrier (entry files and pointers over HOST_TOOLS) that Codex CLI does not read.
  it("tracer: --codex, then --check: exactly one reach line, for Codex CLI, through AGENTS.md and the agent skill; no carrier line for a file Codex CLI does not read", () => {
    const { target, kitHome } = scratchRow();
    const codex = HOST_TOOLS.find((h) => h.id === "codex");
    expect(codex, "premise: the registry has a codex row").toBeDefined();
    const r = runInstall(target, kitHome, [agentFlag(codex!)]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const c = check(target, kitHome);
    const reach = lines(c.stdout).filter((l) => /^ {2}reach\s/.test(l));
    expect(reach.length, c.stdout).toBe(1);
    expect(reach[0], c.stdout).toContain(`${codex!.name}: reaches the Orchestrator through AGENTS.md, ${AGENT_SKILL_REL}`);
    const codexReads = new Set(readsOf(codex!));
    const others = [...new Set(HOST_TOOLS.flatMap(readsOf))].filter((rel) => !codexReads.has(rel));
    expect(others.length, "premise: some route carrier is not Codex CLI's").toBeGreaterThan(0);
    for (const rel of ["CLAUDE.md", ".github/copilot-instructions.md", ANTIGRAVITY_AGENT_REL]) expect(others, `premise: ${rel} is a carrier Codex CLI does not read`).toContain(rel);
    for (const rel of others) {
      const named = lines(c.stdout).filter((l) => /^ {2}\S+\s+kit route/.test(l) && (l.includes(`kit route: ${rel} `) || l.includes(`kit route missing from ${rel} `) || l.includes(`kit route carried by ${rel} `)));
      expect(named, `${rel} is reported by --check after a Codex-only install\n${c.stdout}`).toEqual([]);
    }
  });

  // Quick task 261018-hs8 (the tracer, D-03, D-05): Antigravity CLI's launch agent through install, `--check` and
  // uninstall, beside the skill it shares with Codex CLI.
  it("tracer: --codex --antigravity writes the launch agent's committed bytes as a kit-false file entry, --check names it as a carrier read by Antigravity CLI, and a flag-less uninstall removes it", () => {
    const { target, kitHome } = scratchRow();
    const rows = ["codex", "antigravity"].map((id) => HOST_TOOLS.find((h) => h.id === id));
    expect(rows.every((h) => h !== undefined), "premise: the registry has codex and antigravity rows").toBe(true);
    const agy = rows[1]!;
    expect(agy.launchAgent, "premise: Antigravity CLI's launch agent").toBe(ANTIGRAVITY_AGENT_REL);
    const r = runInstall(target, kitHome, rows.map((h) => agentFlag(h!)));
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const file = at(target, ANTIGRAVITY_AGENT_REL);
    const committed = readFileSync(at(REPO_ROOT, ANTIGRAVITY_AGENT_REL));
    expect(lstatSync(file).isFile(), "the launch agent is a regular file").toBe(true);
    expect(readFileSync(file).equals(committed), "the installed bytes equal the committed generated file").toBe(true);
    expect(reports(r.stdout, "created", ANTIGRAVITY_AGENT_REL), r.stdout).toBe(true);
    expect(r.stdout, "the created line names it Antigravity CLI's launch agent").toContain(`${ANTIGRAVITY_AGENT_REL} (${agy.name} launch agent)`);
    const marker = readMarkerObject(target);
    expect(fileRecords(marker, false)[ANTIGRAVITY_AGENT_REL], r.stdout).toBe(fileRecord(committed, lstatSync(file).mode));
    expect(fileRecords(marker, true)[ANTIGRAVITY_AGENT_REL], "the entry is not recorded as a kit file").toBeUndefined();
    expect(ledgerEntriesFor(target, ".agents/agents").map((e) => (e as Record<string, unknown>).kind), "the directory install made").toEqual(["dir"]);

    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const carrier = lines(c.stdout).filter((l) => /^ {2}ok\s/.test(l) && l.includes(`kit route carried by ${ANTIGRAVITY_AGENT_REL} (read by `));
    expect(carrier.length, c.stdout).toBe(1);
    expect(carrier[0], c.stdout).toContain(`(read by ${agy.name})`);
    const reach = lines(c.stdout).filter((l) => /^ {2}reach\s/.test(l) && l.includes(`${agy.name}: `));
    expect(reach.length, c.stdout).toBe(1);
    expect(reach[0], c.stdout).toContain(ANTIGRAVITY_AGENT_REL);

    const u = runUninstall(target, kitHome);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    expect(existsSync(file), u.stdout).toBe(false);
    for (const d of [".agents/agents", ".agents"]) expect(existsSync(at(target, d)), `${d} left after uninstall`).toBe(false);
  });
});

// ── EACH LAUNCH AGENT, ALONE (quick task 261018-hs8, Task 2; D-03, D-05) ─────────────────────────────────────────────
// Derived over the launch-bearing registry rows: an install with only that agent's flag writes its launch file with
// the committed bytes as a kit-false file entry, and `--check` prints the carrier `ok` line for it, read by that agent
// alone, and counts it in that agent's reach line.
const LAUNCH_ROWS = HOST_TOOLS.filter((h) => h.launchAgent !== null);
describe(`host entries: each launch agent after a single-agent install (${LAUNCH_ROWS.map((h) => h.id).join(", ")})`, () => {
  it("premise: the launch-bearing rows are the four the registry names", () => {
    expect(LAUNCH_ROWS.map((h) => h.id)).toEqual(["antigravity", "opencode", "copilot", "pi"]);
  });

  for (const h of LAUNCH_ROWS) {
    it(`${agentFlag(h)} only, then --check: ${h.launchAgent} is written and recorded, and is a carrier \`ok\` line read by ${h.name}`, () => {
      const { target, kitHome } = scratchRow();
      const rel = h.launchAgent!;
      const r = runInstall(target, kitHome, [agentFlag(h)]);
      expect(r.status, r.stdout + r.stderr).toBe(0);
      const file = at(target, rel);
      const committed = readFileSync(at(REPO_ROOT, rel));
      expect(readFileSync(file).equals(committed), "the installed bytes equal the committed generated file").toBe(true);
      expect(r.stdout, "the created line names it the agent's launch agent").toContain(`${rel} (${h.name} launch agent)`);
      const marker = readMarkerObject(target);
      expect(fileRecords(marker, false)[rel], r.stdout).toBe(fileRecord(committed, lstatSync(file).mode));
      const c = check(target, kitHome);
      expect(c.status, c.stdout + c.stderr).toBe(0);
      const carrier = lines(c.stdout).filter((l) => /^ {2}ok\s/.test(l) && l.includes(`kit route carried by ${rel} (read by `));
      expect(carrier.length, c.stdout).toBe(1);
      expect(carrier[0], c.stdout).toContain(`(read by ${h.name})`);
      const reach = lines(c.stdout).filter((l) => /^ {2}reach\s/.test(l));
      expect(reach.length, c.stdout).toBe(1);
      expect(reach[0], c.stdout).toContain(`${h.name}: `);
      expect(reach[0], c.stdout).toContain(rel);
    }, 120_000);
  }
});

// ── --check SPEAKS FOR THE INSTALLED AGENTS ONLY (plan 34.1-10, D-07; VERDICT-1) ────────────────────────────────────
// Every registry row, derived (count asserted): an install with only that agent's flag, then `--check`. The doctor
// reaches ALL CHECKS PASSED at exit 0 with exactly one reach line, naming that row; the Claude Code adapter
// cross-check runs only for the `claude-kit` row. Then the two fallbacks of the installed set: a legacy marker (no
// `agents` field, a usable ledger) and a v2.1.0-shaped marker (no ledger), which falls to detection with a note.
const reachOf = (stdout: string): string[] => lines(stdout).filter((l) => /^ {2}reach\s/.test(l));
/** The host name a reach line is about (the text before its first `: `, after the label column). */
const reachHost = (line: string): string => line.trim().replace(/^reach\s+/, "").split(": ")[0];
const ADAPTER_AGREE = /^ {2}ok\s+kit-root sources agree \(\//;
const MARKER_AGREE = /^ {2}ok\s+kit-root sources agree \(rule and marker: .*\); no Claude Code adapter is installed here, so no adapter KIT= line was read$/;

describe("--check reports only the installed agents: one reach line per installed agent (plan 34.1-10, D-07)", () => {
  it(`the registry has ${HOST_TOOL_COUNT} rows, one single-agent case each`, () => {
    expect(HOST_TOOLS.length).toBe(HOST_TOOL_COUNT);
  });

  for (const h of HOST_TOOLS) {
    it(`${agentFlag(h)} only, then --check: exit 0, ALL CHECKS PASSED, exactly one reach line, for ${h.name}; the adapter cross-check ${h.adapter === "claude-kit" ? "runs" : "is replaced by the rule-and-marker one"}`, () => {
      const { target, kitHome } = scratchRow();
      const r = runInstall(target, kitHome, [agentFlag(h)]);
      expect(r.status, r.stdout + r.stderr).toBe(0);
      expect(readMarkerObject(target).agents, "premise: the marker records the one agent").toEqual([h.id]);
      const c = check(target, kitHome);
      expect(c.status, c.stdout + c.stderr).toBe(0);
      expect(lines(c.stdout), c.stdout).toContain("ALL CHECKS PASSED");
      const reach = reachOf(c.stdout);
      expect(reach.map(reachHost), c.stdout).toEqual([h.name]);
      expect(reach[0], c.stdout).toContain(`${h.name}: reaches the Orchestrator through`);
      const claude = h.adapter === "claude-kit";
      expect(lines(c.stdout).some((l) => ADAPTER_AGREE.test(l) && !l.includes("rule and marker")), `the adapter cross-check's ok line\n${c.stdout}`).toBe(claude);
      expect(lines(c.stdout).some((l) => MARKER_AGREE.test(l)), `the rule-and-marker cross-check's ok line\n${c.stdout}`).toBe(!claude);
      if (!claude) {
        // No line names a path under the target's `.claude/` (a Claude Code adapter), and the install wrote none. Both
        // sides in pathText's one spelling (WIN-1 path-spelling census).
        expect(lines(c.stdout).filter((l) => pathText(l).includes(pathText(join(target, ".claude")))), c.stdout).toEqual([]);
        expect(existsSync(at(target, ".claude")), "premise: no .claude/ in the target").toBe(false);
      }
    }, 120_000);
  }

  it("a legacy marker (every agent installed, then `agents` deleted): reach lines for exactly the LEGACY_ADAPTER_KINDS rows", () => {
    const { target, kitHome } = scratchRow();
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    withoutAgentsField(target);
    const legacy = HOST_TOOLS.filter((h) => LEGACY_ADAPTER_KINDS.includes(h.adapter));
    expect(legacy.map((h) => h.id), "premise: the legacy rule's rows (D-23)").toEqual(["claude", "copilot", "pi"]);
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(reachOf(c.stdout).map(reachHost), c.stdout).toEqual(legacy.map((h) => h.name));
    expect(lines(c.stdout).some((l) => l.includes("no installed set is recorded")), c.stdout).toBe(false);
  }, 120_000);

  it("a v2.1.0-shaped marker with no ledger in a target holding .claude: the detection note and a reach line for Claude Code", () => {
    const { target, kitHome } = scratchRow();
    const claude = HOST_TOOLS.find((h) => h.adapter === "claude-kit");
    expect(claude, "premise: a claude-kit row").toBeDefined();
    const r = runInstall(target, kitHome, [agentFlag(claude!)]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    // The marker as v2.1.0 wrote it: the kit fields and the target, no `agents` and no `ledger` (D-23).
    const m = readMarkerObject(target);
    const v210 = { kitVersion: m.kitVersion, grugopsHome: m.grugopsHome, kitRoot: m.kitRoot, installMode: m.installMode, target: m.target };
    writeMarkerObject(target, v210);
    const detected = HOST_TOOLS.filter((h) => existsSync(at(target, h.detect)));
    expect(detected.map((h) => h.id), "premise: only .claude is detected").toEqual([claude!.id]);
    const c = check(target, kitHome);
    const notes = linesUnder(c.stdout, "note").filter((l) => l.includes("no installed set is recorded in .grugops/install.json, so --check reports the agents detected here"));
    expect(notes.length, c.stdout).toBe(1);
    expect(notes[0], c.stdout).toContain(`${claude!.name}: ${claude!.detect}`);
    expect(reachOf(c.stdout).map(reachHost), c.stdout).toEqual([claude!.name]);
  }, 120_000);
});

// ── EVERY WHOLE-FILE ENTRY (plan 34.1-01, task 2; briefs DC-2, DC-3; T-34-13) ─────────────────────────────────────────

/** The report lines of `stdout` under `label`: two-space indent, then the label as the first token. */
const linesUnder = (stdout: string, label: string): string[] =>
  stdout.split(/\r?\n/).filter((l) => l.startsWith("  ") && l.trim().split(/\s+/)[0] === label);
/** Whether `stdout` has a `label` line whose subject is `rel`. */
const reports = (stdout: string, label: string, rel: string): boolean => linesUnder(stdout, label).some((l) => l.trim().split(/\s+/)[1] === rel);
/** Write `marker` back as install does (two-space indent, final newline). */
const writeMarkerObject = (target: string, marker: Record<string, unknown>): void =>
  writeFileSync(at(target, MARKER_REL), JSON.stringify(marker, null, 2) + "\n");
/** Every ledger entry (any kind) whose path is `rel`. */
const ledgerEntriesFor = (target: string, rel: string): unknown[] => markerLedger(target).filter((e) => e.path === rel);

/**
 * A kit source without the whole-file entries: every tracked file of this repository outside `.planning/`, copied,
 * except `skip`. Built once (it is the slowest step of this file).
 */
let SRC_WITHOUT_ENTRIES: string | null = null;
function kitSourceWithoutEntries(): string {
  if (SRC_WITHOUT_ENTRIES !== null) return SRC_WITHOUT_ENTRIES;
  const src = join(ROOT, "src-without-entries");
  const ls = spawnSync("git", ["-C", REPO_ROOT, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  expect(ls.status, ls.stderr).toBe(0);
  const skip = new Set(ENTRY_RELS);
  let copied = 0;
  for (const rel of ls.stdout.split("\0")) {
    if (rel === "" || rel.startsWith(".planning/") || skip.has(rel)) continue;
    const from = at(REPO_ROOT, rel);
    if (!existsSync(from) || !lstatSync(from).isFile()) continue;
    mkdirSync(dirname(at(src, rel)), { recursive: true });
    cpSync(from, at(src, rel));
    copied += 1;
  }
  expect(copied, "premise: the kit source copy holds files").toBeGreaterThan(0);
  for (const rel of ENTRY_RELS) expect(existsSync(at(src, rel)), `premise: the copy has no ${rel}`).toBe(false);
  SRC_WITHOUT_ENTRIES = src;
  return src;
}

describe(`host entries: every whole-file entry, derived (${ENTRY_RELS.length}: ${ENTRY_RELS.join(", ")})`, () => {
  it("each entry is a committed file in this repository that carries KIT_ROUTE", () => {
    for (const rel of ENTRY_RELS) {
      expect(lstatSync(at(REPO_ROOT, rel)).isFile(), rel).toBe(true);
      expect(readFileSync(at(REPO_ROOT, rel), "utf8"), rel).toContain(KIT_ROUTE);
    }
  });

  it("the other ROUTE_POINTERS paths are sentinel-block carriers on disk after an install, so the entry set and the block set partition them", () => {
    const { target, kitHome } = scratchRow();
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const others = [...new Set(HOST_TOOLS.flatMap((h) => [...ROUTE_POINTERS[h.adapter]]))].filter((rel) => !ENTRY_RELS.includes(rel));
    expect(others.length, "premise: some ROUTE_POINTERS path is a block carrier").toBeGreaterThan(0);
    for (const rel of others) expect(readFileSync(at(target, rel), "utf8"), rel).toMatch(/<!-- GSD:grugops-[a-z-]*start-here -->/);
  });

  it("install writes each entry's committed bytes, as a kit-false file entry; uninstall removes every one", () => {
    const { target, kitHome } = scratchRow();
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const marker = readMarkerObject(target);
    for (const rel of ENTRY_RELS) {
      const committed = readFileSync(at(REPO_ROOT, rel));
      expect(readFileSync(at(target, rel)).equals(committed), rel).toBe(true);
      expect(reports(r.stdout, "created", rel), r.stdout).toBe(true);
      expect(fileRecords(marker, false)[rel], rel).toBe(fileRecord(committed, lstatSync(at(target, rel)).mode));
    }
    const u = runUninstall(target, kitHome);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    for (const rel of ENTRY_RELS) expect(existsSync(at(target, rel)), `${rel} left after uninstall`).toBe(false);
  });

  it("a user's own file at every entry path is left byte for byte, gets no ledger entry, and survives uninstall", () => {
    const { target, kitHome } = scratchRow();
    const own = (rel: string): string => `# My own ${rel}\n\nMy own instructions.\n`;
    for (const rel of ENTRY_RELS) {
      mkdirSync(dirname(at(target, rel)), { recursive: true });
      writeFileSync(at(target, rel), own(rel));
    }
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    for (const rel of ENTRY_RELS) {
      expect(readFileSync(at(target, rel), "utf8"), rel).toBe(own(rel));
      expect(ledgerEntriesFor(target, rel), rel).toEqual([]);
      expect(reports(r.stdout, "skipped", rel), r.stdout).toBe(true);
    }
    const u = runUninstall(target, kitHome);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    for (const rel of ENTRY_RELS) expect(readFileSync(at(target, rel), "utf8"), `${rel} after uninstall`).toBe(own(rel));
  });

  it("install's own unedited copy from an earlier install whose bytes differ is reported `refreshed` and replaced with the committed bytes", () => {
    const { target, kitHome } = scratchRow();
    const first = runInstall(target, kitHome);
    expect(first.status, first.stdout + first.stderr).toBe(0);
    // Each entry as an earlier install left it: the text without KIT_ROUTE, and the ledger record of those bytes
    // (keeping its `;mode=` suffix), as install recorded what it wrote.
    for (const rel of ENTRY_RELS) {
      const stale = readFileSync(at(target, rel), "utf8").replace(` ${KIT_ROUTE}`, "");
      expect(stale.includes(KIT_ROUTE), `premise: ${rel}'s stale text holds no route`).toBe(false);
      writeFileSync(at(target, rel), stale);
      writeMarkerObject(
        target,
        withLedger(readMarkerObject(target), (entries) => {
          const e = entries.find((x) => x.kind === "file" && x.path === rel);
          expect(e, `premise: the ledger records ${rel}`).toBeDefined();
          const content = String((e as Record<string, unknown>).content);
          const i = content.indexOf(";mode=");
          (e as Record<string, unknown>).content = contentRecord(stale) + (i === -1 ? "" : content.slice(i));
        }),
      );
    }
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    const marker = readMarkerObject(target);
    for (const rel of ENTRY_RELS) {
      expect(reports(again.stdout, "refreshed", rel), again.stdout).toBe(true);
      const committed = readFileSync(at(REPO_ROOT, rel));
      expect(readFileSync(at(target, rel)).equals(committed), rel).toBe(true);
      expect(fileRecords(marker, false)[rel], rel).toBe(fileRecord(committed, lstatSync(at(target, rel)).mode));
    }
  });

  it("a DRY_RUN writes no entry and reports `would-add` for every one", () => {
    const { target, kitHome } = scratchRow();
    const r = runInstall(target, kitHome, [], { dryRun: true });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    for (const rel of ENTRY_RELS) {
      expect(reports(r.stdout, "would-add", rel), r.stdout).toBe(true);
      expect(existsSync(at(target, rel)), rel).toBe(false);
    }
  });

  it("a kit source without the entries: each is reported `skipped`, naming the kit source, and nothing is written or recorded", () => {
    const src = kitSourceWithoutEntries();
    const { target, kitHome } = scratchRow();
    const r = runInstall(target, kitHome, [], { src });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    for (const rel of ENTRY_RELS) {
      const line = linesUnder(r.stdout, "skipped").find((l) => l.trim().split(/\s+/)[1] === rel);
      expect(line, r.stdout).toBeDefined();
      expect(line).toContain(`the kit source has no ${rel}`);
      expect(existsSync(at(target, rel)), rel).toBe(false);
      expect(ledgerEntriesFor(target, rel), rel).toEqual([]);
    }
  }, 120_000);

  it("T-34-13: two installs with different GRUGOPS_HOME and different targets write byte-identical entries holding no absolute path", () => {
    const a = scratchRow();
    const b = scratchRow();
    expect(a.kitHome).not.toBe(b.kitHome);
    const ra = runInstall(a.target, a.kitHome);
    const rb = runInstall(b.target, b.kitHome);
    expect(ra.status, ra.stdout + ra.stderr).toBe(0);
    expect(rb.status, rb.stdout + rb.stderr).toBe(0);
    for (const rel of ENTRY_RELS) {
      const ta = readFileSync(at(a.target, rel), "utf8");
      const tb = readFileSync(at(b.target, rel), "utf8");
      expect(ta, rel).toBe(tb);
      for (const v of [a.kitHome, b.kitHome, a.target, b.target, ROOT, tmpdir()]) expect(ta.includes(v), `${rel} names ${v}`).toBe(false);
      expect(ta, `${rel} holds a leading-slash path`).not.toMatch(/(^|[\s`"'(=])\/[^\s]/m);
    }
  });
});

// host-entries.test.ts — the install side of every whole-file host entry (phase 34.1, plan 34.1-01; D-08, D-09,
// D-11, D-20, D-21; T-34-13).
//
// WHAT IS UNDER TEST. A scripted install copies each non-Claude whole-file entry (the agent skill Codex CLI reads,
// `.agents/skills/grugops/SKILL.md`; the OpenCode command; the Pi prompt template) from the committed generated file
// in the kit source (GRUGOPS_SRC), records it in the install ledger as a kit-false `file` entry, and uninstall
// removes it through the ledger walk. `--check` names each entry as a route carrier.
//
// THE ENTRY SET IS DERIVED, NEVER TYPED. ENTRY_RELS is ROUTE_POINTERS[h.adapter] over HOST_TOOLS for every adapter
// kind the generator renders (ENTRY_SHAPES non-null in scripts/generate-host-entries.ts), first-seen registry
// order, with its count asserted; every other ROUTE_POINTERS path is checked to be a sentinel-block carrier on disk
// after an install, so the two sides cannot drift apart silently.
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
import { HOST_TOOLS, ROUTE_POINTERS, KIT_ROUTE, AGENT_SKILL_REL, agentFlag } from "./host-tools.js";
import { ENTRY_SHAPES } from "../scripts/generate-host-entries.js";
import { contentRecord, fileRecord } from "./install-marker.js";
import { INSTALL_JS, MARKER_REL, REPO_ROOT, runInstall, runUninstall, spawnBin, type Run } from "./installer-paths.test-support.js";
import { fileRecords, markerLedger, readMarkerObject, withLedger } from "./ledger.test-support.js";

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

/** Every whole-file entry the generator renders, as the registry places it: derived, first-seen registry order. */
const ENTRY_RELS: readonly string[] = [
  ...new Set(HOST_TOOLS.flatMap((h) => (ENTRY_SHAPES[h.adapter] === null ? [] : [...ROUTE_POINTERS[h.adapter]]))),
];
/** The pinned count of ENTRY_RELS: it moves only with a reason. Plan 34.1-01: the agent skill (Codex CLI), the Pi
 *  prompt template and the OpenCode command. */
const ENTRY_COUNT = 3;

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
    const codexReads = new Set([...codex!.entryFiles, ...ROUTE_POINTERS[codex!.adapter]]);
    const others = [...new Set(HOST_TOOLS.flatMap((h) => [...h.entryFiles, ...ROUTE_POINTERS[h.adapter]]))].filter((rel) => !codexReads.has(rel));
    expect(others.length, "premise: some route carrier is not Codex CLI's").toBeGreaterThan(0);
    for (const rel of ["CLAUDE.md", ".github/copilot-instructions.md"]) expect(others, `premise: ${rel} is a carrier Codex CLI does not read`).toContain(rel);
    for (const rel of others) {
      const named = lines(c.stdout).filter((l) => /^ {2}\S+\s+kit route/.test(l) && (l.includes(`kit route: ${rel} `) || l.includes(`kit route missing from ${rel} `) || l.includes(`kit route carried by ${rel} `)));
      expect(named, `${rel} is reported by --check after a Codex-only install\n${c.stdout}`).toEqual([]);
    }
  });
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

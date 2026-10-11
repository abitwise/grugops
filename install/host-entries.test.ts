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
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { HOST_TOOLS, ROUTE_POINTERS, KIT_ROUTE, AGENT_SKILL_REL } from "./host-tools.js";
import { ENTRY_SHAPES } from "../scripts/generate-host-entries.js";
import { contentRecord, fileRecord } from "./install-marker.js";
import { INSTALL_JS, REPO_ROOT, runInstall, runUninstall, spawnBin, type Run } from "./installer-paths.test-support.js";
import { fileRecords, readMarkerObject } from "./ledger.test-support.js";

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
/** The pinned count of ENTRY_RELS: it moves only with a reason (task 1 of plan 34.1-01: the agent skill and the Pi template is plan task 2). */
const ENTRY_COUNT = 1;

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

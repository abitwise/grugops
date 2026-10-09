// closing-claims.test.ts — the closing `-- notes --` block of an install says what THIS run did with
// Claude Code ask rules (plan 34-25, D-25, review WR-12, gap G-34-4).
//
// THE CLASS RULE (brief DOC-1 at run time). An end-of-run sentence states what this run did, read from
// the outcome its owner returned; it never states the intended effect. writeAskRules() owns the answer
// to "did this run add ask rules", returns it as an AskRulesOutcome, and the notes block prints only
// the sentence for that outcome. The sentence it replaced ("This installer wrote ... ask rules ...")
// was a literal printed by every run, including runs that refused, previewed, or wanted no rule.
//
// THE ORACLE IS THE SETTINGS FILE, NOT THE INSTALLER'S OUTPUT. A row's `grew` is computed by this test
// from .claude/settings.json alone: the file parses as JSON after the run and its permissions.ask array
// is longer than before (absent or unparseable before counts as zero entries; a file the run did not
// change never grew). The notes carry the added-rules sentence exactly when the file grew.
//
// Drives the COMMITTED install/install.js (npm run build first). Every target, kit home (GRUGOPS_HOME)
// and HOME is a scratch directory under one per-file root, removed in afterAll.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { makeFixture, runInstall, NOTIFY_CONFIG, type Run } from "./installer-paths.test-support.js";

const ROOT = mkdtempSync(join(tmpdir(), "gclose-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

let n = 0;
/** A fresh scratch row: a user repository, a kit home and a HOME, all under ROOT. */
function scratchRow(): { target: string; kitHome: string; home: string } {
  const dir = join(ROOT, `r${n++}`);
  const target = join(dir, "t");
  const kitHome = join(dir, "kit");
  const home = join(dir, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  makeFixture(target);
  return { target, kitHome, home };
}

const settingsPath = (t: string): string => join(t, ".claude", "settings.json");

/**
 * The notes block: the lines from the `-- notes --` line up to, not including, the first later line
 * that starts with `== install` (the closing banner).
 */
function notesBlock(stdout: string): string[] {
  const lines = stdout.split("\n");
  const start = lines.findIndex((l) => l === "-- notes --");
  if (start < 0) return [];
  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    if (i > start && lines[i].startsWith("== install")) break;
    out.push(lines[i]);
  }
  return out;
}

// The sentence forms, one per outcome kind. Matched against the notes block only.
const ADDED = /This run added \d+ Claude Code ask rule\(s\)/;
const NONE_WANTED = /No ask rule was written: no checkpoint is at block/;
const ONLY_FLOOR = /the git host is the only floor/;

describe("closing claims: the notes say what writeAskRules did (plan 34-25, D-25, WR-12)", () => {
  it("R14 fresh install: the notes carry the added-rules sentence with the count 55 and .claude/settings.json", () => {
    const { target, kitHome, home } = scratchRow();
    const r: Run = runInstall(target, kitHome, [], { home });
    expect(r.status, r.stdout).toBe(0);
    const notes = notesBlock(r.stdout);
    expect(notes.length, r.stdout).toBeGreaterThan(1);
    const added = notes.join("\n");
    expect(added).toMatch(/This run added 55 Claude Code ask rule\(s\)/);
    expect(added).toContain(".claude/settings.json");
    expect(added).not.toMatch(ONLY_FLOOR);
  });

  it("R9 every checkpoint lowered: no added-rules sentence, no rule written, the git host named as the only floor", () => {
    const { target, kitHome, home } = scratchRow();
    mkdirSync(join(target, ".grugops"), { recursive: true });
    writeFileSync(join(target, ".grugops", "factory.config.json"), NOTIFY_CONFIG);
    const r = runInstall(target, kitHome, [], { home });
    expect(r.status, r.stdout).toBe(0);
    const notes = notesBlock(r.stdout).join("\n");
    expect(notes, r.stdout).not.toMatch(/installer wrote Claude Code ask rules/);
    expect(notes).not.toMatch(ADDED);
    expect(notes).toMatch(NONE_WANTED);
    expect(notes).toMatch(ONLY_FLOOR);
    expect(existsSync(settingsPath(target))).toBe(false);
  });
});

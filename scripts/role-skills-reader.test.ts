// role-skills-reader.test.ts — the reader install.js --check spawns for declared skills (phase 42, plans 42-02 and
// 42-08; SKILL-05, D-02, D-24).
//
// WHAT IS UNDER TEST. scripts/role-skills-reader.ts reads every role of a kit home through the one role admission
// (admitRole) and the one `skills:` projection (roleSkillsOf), and reports `{ skills, refusals }`: each declared skill
// with the roles that declare it, roles in sorted file-name order and skills in first-declaration order, and each role
// it refused with the reason. Its CLI prints that report as one JSON line. These cases moved here from
// install/skills-doctor.test.ts (plan 42-08), which keeps the doctor's own cases.
//
// Every kit is a scratch folder under one mkdtemp root, removed by afterAll. The CLI cases drive the COMMITTED
// scripts/role-skills-reader.js (npm run build first).
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { readRoleSkills } from "./role-skills-reader.js";

const SCRIPTS = import.meta.dirname;
const READER_JS = join(SCRIPTS, "role-skills-reader.js");
const FIXTURE = join(SCRIPTS, "fixtures", "role-skills.md");

const ROOT = mkdtempSync(join(tmpdir(), "grugops-role-skills-reader-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

let n = 0;
/** A scratch kit home holding only the given roles, written in the order given. */
function kitWith(roles: Readonly<Record<string, string>>): string {
  const kit = join(ROOT, `k${n++}`);
  const dir = join(kit, "agent-factory", "roles");
  mkdirSync(dir, { recursive: true });
  for (const [name, text] of Object.entries(roles)) writeFileSync(join(dir, `${name}.md`), text);
  return kit;
}
const role = (front: string): string => `---\nkind: role\ntier: core\n${front}---\n# Role\n`;

describe("readRoleSkills: kit home in, one report out", () => {
  it("the fixture role declares ui-ux-pro-max then frontend-design, in that order", () => {
    const kit = kitWith({});
    copyFileSync(FIXTURE, join(kit, "agent-factory", "roles", "skills-fixture.md"));
    const report = readRoleSkills(kit);
    expect(report.refusals).toEqual([]);
    expect(report.skills).toEqual({ "ui-ux-pro-max": ["skills-fixture"], "frontend-design": ["skills-fixture"] });
    expect(Object.keys(report.skills)).toEqual(["ui-ux-pro-max", "frontend-design"]);
  });

  it("two roles declaring one skill: the skill names both roles in sorted order, no refusal", () => {
    const kit = kitWith({
      "frontend-ui": role("skills: ui-ux-pro-max\n"),
      designer: role("skills: ui-ux-pro-max\n"),
      "tech-lead": role(""),
    });
    expect(readRoleSkills(kit)).toEqual({ skills: { "ui-ux-pro-max": ["designer", "frontend-ui"] }, refusals: [] });
  });

  it("roles come back in sorted file-name order whatever order they were written in, and skills in first-declaration order", () => {
    const kit = kitWith({
      "c-role": role("skills: shared\n"),
      "a-role": role("skills: zeta shared\n"),
      "b-role": role("skills: alpha shared\n"),
    });
    const report = readRoleSkills(kit);
    expect(report.skills.shared).toEqual(["a-role", "b-role", "c-role"]);
    expect(Object.keys(report.skills)).toEqual(["zeta", "shared", "alpha"]);
  });

  it("a refused role becomes a refusal with its reason and declares nothing", () => {
    const kit = kitWith({ designer: role("skills: Not-Kebab\n"), "frontend-ui": role("skills: frontend-design\n") });
    const report = readRoleSkills(kit);
    expect(report.skills).toEqual({ "frontend-design": ["frontend-ui"] });
    expect(report.refusals.map((r) => r.role)).toEqual(["designer"]);
    expect(report.refusals[0]?.reason ?? "").toContain("lower-case kebab");
  });

  it("a `skills:` block sequence is refused, and the other roles' skills are still read", () => {
    const kit = kitWith({ designer: role("skills:\n  - ui-ux-pro-max\n"), "frontend-ui": role("skills: frontend-design\n") });
    const report = readRoleSkills(kit);
    expect(report.skills).toEqual({ "frontend-design": ["frontend-ui"] });
    expect(report.refusals.map((r) => r.role)).toEqual(["designer"]);
    expect(report.refusals[0]?.reason ?? "").toContain("block sequence");
  });

  it("a kit where no role declares a skill gives an empty report; a role with no `skills:` key declares nothing (D-02)", () => {
    const kit = kitWith({ designer: role(""), "tech-lead": role("capabilities: read\n") });
    expect(readRoleSkills(kit)).toEqual({ skills: {}, refusals: [] });
  });
});

describe("role-skills-reader.js: the CLI the doctor spawns", () => {
  it("prints exactly one line of JSON and exits 0; with no argument it exits 2 and prints nothing on stdout", () => {
    const kit = kitWith({ designer: role("skills: ui-ux-pro-max\n") });
    const ok = spawnSync(process.execPath, [READER_JS, kit], { encoding: "utf8" });
    expect(ok.status, ok.stderr).toBe(0);
    expect(ok.stdout.endsWith("\n")).toBe(true);
    expect(ok.stdout.slice(0, -1).includes("\n")).toBe(false);
    expect(JSON.parse(ok.stdout)).toEqual({ skills: { "ui-ux-pro-max": ["designer"] }, refusals: [] });
    const bare = spawnSync(process.execPath, [READER_JS], { encoding: "utf8" });
    expect(bare.status).toBe(2);
    expect(bare.stdout).toBe("");
    expect(bare.stderr).not.toBe("");
  });

  it("an unreadable roles folder exits 1 with a stderr message and no stdout", () => {
    const kit = join(ROOT, `k${n++}`);
    mkdirSync(kit, { recursive: true });
    const r = spawnSync(process.execPath, [READER_JS, kit], { encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stdout).toBe("");
    expect(r.stderr).not.toBe("");
  });
});

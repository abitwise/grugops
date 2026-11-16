// skills-doctor.test.ts — the doctor's declared-skills section (phase 42, plan 42-02; SKILL-05, SKILL-01).
//
// WHAT IS UNDER TEST. A role may declare optional skills (`skills: ui-ux-pro-max`). `install.js --check` reads those
// declarations through the committed reader scripts/role-skills-reader.js (the one parser, roleSkillsOf, behind
// admitRole) and, for every installed host, looks for `<folder>/<skill>/SKILL.md` in that host's project folders under
// the target and its user folders under the home directory (HOST_SKILL_DIRS in install/host-tools.ts). A skill no
// checked folder holds gives one uncounted `advisory` line; a found skill gives one uncounted `ok` line. The check
// never changes the exit code, `--strict` never promotes it, and it writes nothing.
//
// HERMETIC. Every install and check runs with a scratch target, a scratch kit home (GRUGOPS_HOME), a scratch HOME and
// a PATH holding only an empty scratch folder (hermeticEnv), so neither the real home nor a real host binary is read.
// The planted kit home has every `skills:` line removed first, so a role the kit ships with a declaration cannot add a
// line this file does not expect. One case (plan 42-07) never plants: it checks the kit as it ships, so its expected
// line count is derived from the shipped roles' declarations (zero today), and the README case pins the
// `**Declared skills.**` bullet of install/README.md that describes these lines.
//
// The reader's own cases are in scripts/role-skills-reader.test.ts, and the two-way pin of HOST_SKILL_DIRS to the
// registry is in install/host-tools.test.ts (plan 42-08).
//
// Drives the COMMITTED install/install.js and scripts/role-skills-reader.js (npm run build first).
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { INSTALL_JS, REPO_ROOT, hermeticEnv, runInstall, snapshotTree, spawnBin, type Run } from "./installer-paths.test-support.js";
import { readRoleSkills } from "../scripts/role-skills-reader.js";

const ROOT = mkdtempSync(join(tmpdir(), "grugops-skills-doctor-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

let n = 0;
interface Row {
  readonly target: string;
  readonly kitHome: string;
  readonly home: string;
  readonly bin: string;
}
/** A fresh scratch row: an empty git repository, a separate kit home, a scratch HOME and an empty PATH folder. */
function scratchRow(): Row {
  const dir = join(ROOT, `r${n++}`);
  const row = { target: join(dir, "t"), kitHome: join(dir, "kit"), home: join(dir, "home"), bin: join(dir, "bin") };
  mkdirSync(row.target, { recursive: true });
  mkdirSync(row.home, { recursive: true });
  mkdirSync(row.bin, { recursive: true });
  spawnSync("git", ["init", "-q", row.target], { encoding: "utf8" });
  return row;
}

/** Remove every `skills:` line from every role of `kitHome`, then declare `skills` on the named roles. */
function plantSkills(kitHome: string, declared: Readonly<Record<string, string>>): void {
  const roles = join(kitHome, "agent-factory", "roles");
  for (const f of readdirSync(roles).filter((x) => x.endsWith(".md"))) {
    const file = join(roles, f);
    const text = readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => !l.startsWith("skills:"))
      .join("\n");
    const value = declared[f.replace(/\.md$/, "")];
    // The frontmatter opens on line 1; the declaration goes right after the opening delimiter.
    // A value that starts with a newline is written as is after `skills:` (a block sequence, for the refusal case).
    const line = value === undefined ? "" : value.startsWith("\n") ? `skills:${value}` : `skills: ${value}`;
    writeFileSync(file, value === undefined ? text : text.replace(/^---\n/, `---\n${line}\n`));
  }
}

/** An install for `flags` into a fresh row whose kit home declares `declared` (every other `skills:` line removed). */
function installedWith(flags: readonly string[], declared: Readonly<Record<string, string>>): Row {
  const row = scratchRow();
  const r = runInstall(row.target, row.kitHome, flags, { home: row.home, env: hermeticEnv(row.home, row.bin) });
  expect(r.status, r.stdout + r.stderr).toBe(0);
  plantSkills(row.kitHome, declared);
  return row;
}

/** A Claude Code install into a fresh row whose kit home declares `skills: ui-ux-pro-max` on designer.md alone. */
function installedWithPlantedSkill(): Row {
  return installedWith(["--claude"], { designer: "ui-ux-pro-max" });
}

const check = (row: Row, extra: readonly string[] = [], env: Readonly<Record<string, string | undefined>> = {}): Run =>
  spawnBin(INSTALL_JS, ["--check", ...extra], row.target, row.kitHome, { home: row.home, env: { ...hermeticEnv(row.home, row.bin), ...env } });

const lines = (out: string): string[] => out.split("\n");
const MISSING_CLAUDE = /^ {2}advisory\s+skill ui-ux-pro-max \(designer\) not found for Claude Code; optional, see docs\/skills\.md$/;
const FOUND_CLAUDE = /^ {2}ok\s+skill ui-ux-pro-max \(designer\) found for Claude Code$/;
const counted = (out: string): string[] => lines(out).filter((l) => /^ {2}(FAIL|WARN)\s/.test(l));
const summaryLine = (out: string): string =>
  lines(out).filter((l) => /^(ALL CHECKS PASSED|\d+ WARNING\(S\)|\d+ FAILURE\(S\))/.test(l)).join("\n");

/** Create `<home>/.claude/skills/ui-ux-pro-max/SKILL.md`, the Claude Code user folder of the skill. */
function placeUserSkill(row: Row): void {
  const dir = join(row.home, ".claude", "skills", "ui-ux-pro-max");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), "---\nname: ui-ux-pro-max\ndescription: test skill\n---\n");
}

// ── the doctor ────────────────────────────────────────────────────────────────────────────────────────────────────
describe("--check: a declared skill no checked folder holds is one advisory line (plan 42-02, SKILL-05, D-25, D-26)", () => {
  it("tracer: a skill declared by designer and absent from every Claude Code folder prints one advisory line; present, it prints ok; both exit the same", () => {
    const row = installedWithPlantedSkill();
    const absent = check(row);
    const missing = lines(absent.stdout).filter((l) => MISSING_CLAUDE.test(l));
    expect(missing.length, absent.stdout).toBe(1);
    expect(lines(absent.stdout).filter((l) => FOUND_CLAUDE.test(l)), absent.stdout).toEqual([]);

    placeUserSkill(row);
    const present = check(row);
    expect(lines(present.stdout).filter((l) => MISSING_CLAUDE.test(l)), present.stdout).toEqual([]);
    expect(lines(present.stdout).filter((l) => FOUND_CLAUDE.test(l)).length, present.stdout).toBe(1);
    expect(absent.status, absent.stdout + absent.stderr).toBe(present.status);
  });

  it("a skill in the Claude Code project folder of the target is found", () => {
    const row = installedWithPlantedSkill();
    const dir = join(row.target, ".claude", "skills", "ui-ux-pro-max");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), "---\nname: ui-ux-pro-max\ndescription: test skill\n---\n");
    const c = check(row);
    expect(lines(c.stdout).filter((l) => FOUND_CLAUDE.test(l)).length, c.stdout).toBe(1);
  });

  it("a folder whose name differs only in case does not match: the name is compared byte for byte", () => {
    const row = installedWithPlantedSkill();
    const dir = join(row.home, ".claude", "skills", "UI-UX-Pro-Max");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), "---\nname: x\ndescription: x\n---\n");
    const c = check(row);
    // A case-insensitive filesystem resolves the declared name to this folder; only a case-sensitive one can tell.
    const caseSensitive = !existsSync(join(row.home, ".claude", "skills", "ui-ux-pro-max"));
    if (caseSensitive) expect(lines(c.stdout).filter((l) => MISSING_CLAUDE.test(l)).length, c.stdout).toBe(1);
  });

  it("the reader failing prints `declared skills not checked` and no per-skill line", () => {
    const row = installedWithPlantedSkill();
    // A kit home with no roles folder: the reader exits non-zero.
    rmSync(join(row.kitHome, "agent-factory", "roles"), { recursive: true, force: true });
    const c = check(row);
    const notChecked = lines(c.stdout).filter((l) => /^ {2}advisory\s+declared skills not checked: \S/.test(l));
    expect(notChecked.length, c.stdout).toBe(1);
    expect(lines(c.stdout).filter((l) => /^ {2}\S+\s+skill /.test(l)), c.stdout).toEqual([]);
  });
});

describe("--check: the skill line is advisory in fact (plan 42-02, D-25)", () => {
  it("absent and present exit the same, with and without --strict; the absent run adds no FAIL or WARN line and the summary line is the same", () => {
    const row = installedWithPlantedSkill();
    const absent = check(row);
    const absentStrict = check(row, ["--strict"]);
    expect(lines(absent.stdout).filter((l) => MISSING_CLAUDE.test(l)).length, absent.stdout).toBe(1);
    placeUserSkill(row);
    const present = check(row);
    const presentStrict = check(row, ["--strict"]);
    expect(absent.status, absent.stdout).toBe(present.status);
    expect(absentStrict.status, absentStrict.stdout).toBe(presentStrict.status);
    expect(counted(absent.stdout)).toEqual(counted(present.stdout));
    expect(counted(absentStrict.stdout)).toEqual(counted(presentStrict.stdout));
    expect(summaryLine(absent.stdout)).toBe(summaryLine(present.stdout));
    expect(summaryLine(absent.stdout), absent.stdout).not.toBe("");
  });

  it("a --check run leaves the scratch target and the scratch HOME byte-identical", () => {
    const row = installedWithPlantedSkill();
    const targetBefore = snapshotTree(row.target);
    const homeBefore = snapshotTree(row.home);
    const c = check(row);
    expect(lines(c.stdout).filter((l) => MISSING_CLAUDE.test(l)).length, c.stdout).toBe(1);
    expect(snapshotTree(row.target)).toBe(targetBefore);
    expect(snapshotTree(row.home)).toBe(homeBefore);
  });
});

// ── Claude Code plugin installs (plan 42-08, D-24) ────────────────────────────────────────────────────────────────
// A Claude Code plugin records each install in `<plugins root>/installed_plugins.json` (`installPath`), and carries its
// skills in `<installPath>/skills/` and in each `skills` path of `<installPath>/.claude-plugin/plugin.json`. The plugins
// root is CLAUDE_CODE_PLUGIN_CACHE_DIR when set, else `<home>/.claude/plugins`.

const NOT_CHECKED_CLAUDE = /^ {2}advisory\s+skill ui-ux-pro-max \(designer\) not checked for Claude Code: (\S.*); optional, see docs\/skills\.md$/;
const PLUGIN_KEY = "ui-ux-pro-max@ui-ux-pro-max-skill";
const SKILL_TEXT = "---\nname: ui-ux-pro-max\ndescription: test skill\n---\n";

interface PluginSpec {
  /** The plugin key in the record. */
  readonly key?: string;
  /** The `.claude-plugin/plugin.json` object; no manifest when omitted. */
  readonly manifest?: Readonly<Record<string, unknown>>;
  /** The folder, relative to installPath, that gets `ui-ux-pro-max/SKILL.md`; no skill when omitted. */
  readonly skillRel?: string;
}

/** Write `<pluginsRoot>/installed_plugins.json` naming one plugin under `<pluginsRoot>/cache`, as Claude Code lays it out. */
function plantClaudePlugin(pluginsRoot: string, spec: PluginSpec): string {
  const key = spec.key ?? PLUGIN_KEY;
  const installPath = join(pluginsRoot, "cache", key.replace("@", "-"), "1.0.0");
  mkdirSync(installPath, { recursive: true });
  if (spec.manifest !== undefined) {
    mkdirSync(join(installPath, ".claude-plugin"), { recursive: true });
    writeFileSync(join(installPath, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "ui-ux-pro-max", ...spec.manifest }));
  }
  if (spec.skillRel !== undefined) {
    const dir = join(installPath, ...spec.skillRel.split("/"), "ui-ux-pro-max");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), SKILL_TEXT);
  }
  const record = { version: 2, plugins: { [key]: [{ scope: "user", installPath, version: "1.0.0" }] } };
  writeFileSync(join(pluginsRoot, "installed_plugins.json"), JSON.stringify(record));
  return installPath;
}
const homePlugins = (row: Row): string => {
  const dir = join(row.home, ".claude", "plugins");
  mkdirSync(dir, { recursive: true });
  return dir;
};
const only = (out: string, re: RegExp): string[] => lines(out).filter((l) => re.test(l));

describe("--check: a skill a Claude Code plugin installs is found through installed_plugins.json (plan 42-08, D-24)", () => {
  it("tracer: the manifest layout `\"skills\": \"./.claude/skills/\"` (ui-ux-pro-max's) is found, not reported missing", () => {
    const row = installedWithPlantedSkill();
    plantClaudePlugin(homePlugins(row), { manifest: { skills: "./.claude/skills/" }, skillRel: ".claude/skills" });
    const c = check(row);
    expect(only(c.stdout, FOUND_CLAUDE).length, c.stdout).toBe(1);
    expect(only(c.stdout, MISSING_CLAUDE), c.stdout).toEqual([]);
    expect(only(c.stdout, NOT_CHECKED_CLAUDE), c.stdout).toEqual([]);
  });

  it("a manifest `skills` list is read path by path", () => {
    const row = installedWithPlantedSkill();
    plantClaudePlugin(homePlugins(row), { manifest: { skills: ["./other", "./.claude/skills"] }, skillRel: ".claude/skills" });
    const c = check(row);
    expect(only(c.stdout, FOUND_CLAUDE).length, c.stdout).toBe(1);
  });

  it("the default layout `skills/` with no manifest `skills` field is found", () => {
    const row = installedWithPlantedSkill();
    plantClaudePlugin(homePlugins(row), { manifest: {}, skillRel: "skills" });
    const c = check(row);
    expect(only(c.stdout, FOUND_CLAUDE).length, c.stdout).toBe(1);
  });

  it("the default layout `skills/` with no manifest at all is found", () => {
    const row = installedWithPlantedSkill();
    plantClaudePlugin(homePlugins(row), { skillRel: "skills" });
    const c = check(row);
    expect(only(c.stdout, FOUND_CLAUDE).length, c.stdout).toBe(1);
  });

  it("a plugin that does not carry the skill leaves the missing line", () => {
    const row = installedWithPlantedSkill();
    plantClaudePlugin(homePlugins(row), { manifest: {} });
    const c = check(row);
    expect(only(c.stdout, MISSING_CLAUDE).length, c.stdout).toBe(1);
  });

  it("CLAUDE_CODE_PLUGIN_CACHE_DIR set: that folder's installed_plugins.json is read", () => {
    const row = installedWithPlantedSkill();
    const cache = join(row.home, "elsewhere", "plugins");
    mkdirSync(cache, { recursive: true });
    plantClaudePlugin(cache, { skillRel: "skills" });
    const c = check(row, [], { CLAUDE_CODE_PLUGIN_CACHE_DIR: cache });
    expect(only(c.stdout, FOUND_CLAUDE).length, c.stdout).toBe(1);
  });

  it("CLAUDE_CODE_PLUGIN_CACHE_DIR set: the record under <HOME>/.claude/plugins is not consulted", () => {
    const row = installedWithPlantedSkill();
    plantClaudePlugin(homePlugins(row), { skillRel: "skills" });
    const cache = join(row.home, "elsewhere", "plugins");
    mkdirSync(cache, { recursive: true });
    const c = check(row, [], { CLAUDE_CODE_PLUGIN_CACHE_DIR: cache });
    expect(only(c.stdout, FOUND_CLAUDE), c.stdout).toEqual([]);
    expect(only(c.stdout, MISSING_CLAUDE).length, c.stdout).toBe(1);
  });

  it("an installed_plugins.json that is not JSON gives a Claude Code `not checked` line with the reason, never `not found`", () => {
    const row = installedWithPlantedSkill();
    writeFileSync(join(homePlugins(row), "installed_plugins.json"), "{ not json");
    const c = check(row);
    const nc = only(c.stdout, NOT_CHECKED_CLAUDE);
    expect(nc.length, c.stdout).toBe(1);
    expect(nc[0], c.stdout).toContain("installed_plugins.json");
    expect(only(c.stdout, MISSING_CLAUDE), c.stdout).toEqual([]);
  });

  it("an installed_plugins.json of another shape gives a Claude Code `not checked` line, never `not found`", () => {
    const row = installedWithPlantedSkill();
    writeFileSync(join(homePlugins(row), "installed_plugins.json"), JSON.stringify({ version: 2, plugins: { [PLUGIN_KEY]: { installPath: "/x" } } }));
    const c = check(row);
    expect(only(c.stdout, NOT_CHECKED_CLAUDE).length, c.stdout).toBe(1);
    expect(only(c.stdout, MISSING_CLAUDE), c.stdout).toEqual([]);
  });

  it("a manifest `skills` path `../outside` is refused: `not checked` naming the plugin key, never followed and never `not found`", () => {
    const row = installedWithPlantedSkill();
    const installPath = plantClaudePlugin(homePlugins(row), { manifest: { skills: "../outside" } });
    // The escaping path does hold the skill, so a lookup that followed it would print `found`.
    const out = join(installPath, "..", "outside", "ui-ux-pro-max");
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "SKILL.md"), SKILL_TEXT);
    const c = check(row);
    const nc = only(c.stdout, NOT_CHECKED_CLAUDE);
    expect(nc.length, c.stdout).toBe(1);
    expect(nc[0], c.stdout).toContain(PLUGIN_KEY);
    expect(only(c.stdout, FOUND_CLAUDE), c.stdout).toEqual([]);
    expect(only(c.stdout, MISSING_CLAUDE), c.stdout).toEqual([]);
  });

  it("an absolute manifest `skills` path is refused: `not checked` naming the plugin key", () => {
    const row = installedWithPlantedSkill();
    const installPath = plantClaudePlugin(homePlugins(row), { manifest: {} });
    const abs = join(installPath, "abs");
    const dir = join(abs, "ui-ux-pro-max");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), SKILL_TEXT);
    writeFileSync(join(installPath, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "x", skills: abs }));
    const c = check(row);
    const nc = only(c.stdout, NOT_CHECKED_CLAUDE);
    expect(nc.length, c.stdout).toBe(1);
    expect(nc[0], c.stdout).toContain(PLUGIN_KEY);
    expect(only(c.stdout, FOUND_CLAUDE), c.stdout).toEqual([]);
  });

  it("a skill found in the user folder is found even when the plugin record cannot be read", () => {
    const row = installedWithPlantedSkill();
    writeFileSync(join(homePlugins(row), "installed_plugins.json"), "{ not json");
    placeUserSkill(row);
    const c = check(row);
    expect(only(c.stdout, FOUND_CLAUDE).length, c.stdout).toBe(1);
    expect(only(c.stdout, NOT_CHECKED_CLAUDE), c.stdout).toEqual([]);
  });

  it("the plugin-present and plugin-absent runs exit the same, with and without --strict, with the same counted lines", () => {
    const absentRow = installedWithPlantedSkill();
    plantClaudePlugin(homePlugins(absentRow), { manifest: {} });
    const presentRow = installedWithPlantedSkill();
    plantClaudePlugin(homePlugins(presentRow), { manifest: { skills: "./.claude/skills/" }, skillRel: ".claude/skills" });
    const absent = check(absentRow);
    const present = check(presentRow);
    const absentStrict = check(absentRow, ["--strict"]);
    const presentStrict = check(presentRow, ["--strict"]);
    expect(only(absent.stdout, MISSING_CLAUDE).length, absent.stdout).toBe(1);
    expect(only(present.stdout, FOUND_CLAUDE).length, present.stdout).toBe(1);
    expect(absent.status, absent.stdout).toBe(present.status);
    expect(absentStrict.status, absentStrict.stdout).toBe(presentStrict.status);
    expect(counted(absent.stdout)).toEqual(counted(present.stdout));
    expect(summaryLine(absent.stdout)).toBe(summaryLine(present.stdout));
  });

  it("a --check run with a plugin record leaves the scratch target and the scratch HOME byte-identical", () => {
    const row = installedWithPlantedSkill();
    plantClaudePlugin(homePlugins(row), { manifest: { skills: "./.claude/skills/" }, skillRel: ".claude/skills" });
    const targetBefore = snapshotTree(row.target);
    const homeBefore = snapshotTree(row.home);
    const c = check(row);
    expect(only(c.stdout, FOUND_CLAUDE).length, c.stdout).toBe(1);
    expect(snapshotTree(row.target)).toBe(targetBefore);
    expect(snapshotTree(row.home)).toBe(homeBefore);
  });
});

// ── every installed host from its own HOST_SKILL_DIRS row, and the not-checked cases (plan 42-08, D-24) ─────────────
const skillLine = (label: "advisory" | "ok", rest: string): RegExp =>
  new RegExp(`^ {2}${label}\\s+skill ${rest.replace(/[().]/g, (c) => `\\${c}`)}$`);
const OPT = "; optional, see docs/skills.md";

/** Create `<root>/<rel>/<skill>/SKILL.md`. */
function placeSkill(root: string, rel: string, skill = "ui-ux-pro-max"): void {
  const dir = join(root, ...rel.split("/"), skill);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), `---\nname: ${skill}\ndescription: test skill\n---\n`);
}

describe("--check: each installed host is checked from its own row (plan 42-08, D-24)", () => {
  it("--claude --codex with the skill only in <HOME>/.agents/skills: Claude Code is missing, Codex CLI is found", () => {
    const row = installedWith(["--claude", "--codex"], { designer: "ui-ux-pro-max" });
    placeSkill(row.home, ".agents/skills");
    const c = check(row);
    expect(only(c.stdout, MISSING_CLAUDE).length, c.stdout).toBe(1);
    expect(only(c.stdout, skillLine("ok", "ui-ux-pro-max (designer) found for Codex CLI")).length, c.stdout).toBe(1);
    expect(only(c.stdout, /^ {2}\S+\s+skill /).length, c.stdout).toBe(2);
  });

  it("the Codex CLI missing line carries the plugin clause, because its plugin installs are not known", () => {
    const row = installedWith(["--codex"], { designer: "ui-ux-pro-max" });
    const c = check(row);
    const want = skillLine(
      "advisory",
      `ui-ux-pro-max (designer) not found for Codex CLI${OPT} (plugin installs on Codex CLI are not checked: UNKNOWN - verify)`,
    );
    expect(only(c.stdout, want).length, c.stdout).toBe(1);
  });

  it("CODEX_HOME set and the skill absent: the Codex CLI line is `not checked` and names CODEX_HOME, never `not found`", () => {
    const row = installedWith(["--codex"], { designer: "ui-ux-pro-max" });
    const c = check(row, [], { CODEX_HOME: join(row.home, "codex-home") });
    const nc = only(c.stdout, /^ {2}advisory\s+skill ui-ux-pro-max \(designer\) not checked for Codex CLI: .*; optional, see docs\/skills\.md$/);
    expect(nc.length, c.stdout).toBe(1);
    expect(nc[0], c.stdout).toContain("CODEX_HOME");
    expect(only(c.stdout, /not found for Codex CLI/), c.stdout).toEqual([]);
  });

  it("CODEX_HOME set and the skill in the target's .agents/skills: found", () => {
    const row = installedWith(["--codex"], { designer: "ui-ux-pro-max" });
    placeSkill(row.target, ".agents/skills");
    const c = check(row, [], { CODEX_HOME: join(row.home, "codex-home") });
    expect(only(c.stdout, skillLine("ok", "ui-ux-pro-max (designer) found for Codex CLI")).length, c.stdout).toBe(1);
  });

  it("CLAUDE_CONFIG_DIR set and the skill absent: the Claude Code line is `not checked` and names CLAUDE_CONFIG_DIR", () => {
    const row = installedWithPlantedSkill();
    const c = check(row, [], { CLAUDE_CONFIG_DIR: join(row.home, "claude-config") });
    const nc = only(c.stdout, NOT_CHECKED_CLAUDE);
    expect(nc.length, c.stdout).toBe(1);
    expect(nc[0], c.stdout).toContain("CLAUDE_CONFIG_DIR");
    expect(only(c.stdout, MISSING_CLAUDE), c.stdout).toEqual([]);
  });

  it("--antigravity with the skill in <HOME>/.gemini/config/plugins/<plugin>/skills: found for Antigravity CLI", () => {
    const row = installedWith(["--antigravity"], { designer: "ui-ux-pro-max" });
    placeSkill(row.home, ".gemini/config/plugins/some-plugin/skills");
    const c = check(row);
    expect(only(c.stdout, skillLine("ok", "ui-ux-pro-max (designer) found for Antigravity CLI")).length, c.stdout).toBe(1);
  });

  it("--antigravity with the skill nowhere: the missing line, without the plugin clause, because its plugin folders were checked", () => {
    const row = installedWith(["--antigravity"], { designer: "ui-ux-pro-max" });
    mkdirSync(join(row.home, ".gemini", "config", "plugins", "some-plugin", "skills"), { recursive: true });
    const c = check(row);
    expect(only(c.stdout, skillLine("advisory", `ui-ux-pro-max (designer) not found for Antigravity CLI${OPT}`)).length, c.stdout).toBe(1);
  });

  it("--antigravity whose plugins folder is a file: the Antigravity CLI line is `not checked`, never `not found`", () => {
    const row = installedWith(["--antigravity"], { designer: "ui-ux-pro-max" });
    mkdirSync(join(row.home, ".gemini", "config"), { recursive: true });
    writeFileSync(join(row.home, ".gemini", "config", "plugins"), "not a folder\n");
    const c = check(row);
    const nc = only(c.stdout, /^ {2}advisory\s+skill ui-ux-pro-max \(designer\) not checked for Antigravity CLI: .*; optional, see docs\/skills\.md$/);
    expect(nc.length, c.stdout).toBe(1);
    expect(only(c.stdout, /not found for Antigravity CLI/), c.stdout).toEqual([]);
  });

  it("two roles declaring one skill: one line per host naming both roles in sorted order", () => {
    const row = installedWith(["--claude", "--codex"], { "frontend-ui": "ui-ux-pro-max", designer: "ui-ux-pro-max" });
    const c = check(row);
    const lns = only(c.stdout, /^ {2}\S+\s+skill /);
    expect(lns.length, c.stdout).toBe(2);
    expect(lns.every((l) => l.includes("skill ui-ux-pro-max (designer, frontend-ui) ")), c.stdout).toBe(true);
    expect(lns.filter((l) => l.includes(" for Claude Code")).length, c.stdout).toBe(1);
    expect(lns.filter((l) => l.includes(" for Codex CLI")).length, c.stdout).toBe(1);
  });

  it("a role whose `skills:` is refused gives the reader-refusal line naming it, and the other roles' skills are still checked", () => {
    const row = installedWith(["--claude"], { designer: "\n  - ui-ux-pro-max", "frontend-ui": "frontend-design" });
    const c = check(row);
    const refused = only(c.stdout, /^ {2}advisory\s+declared skills of designer not read: \S.* \(the role-frontmatter guard reports this\)$/);
    expect(refused.length, c.stdout).toBe(1);
    expect(refused[0], c.stdout).toContain("block sequence");
    expect(only(c.stdout, skillLine("advisory", `frontend-design (frontend-ui) not found for Claude Code${OPT}`)).length, c.stdout).toBe(1);
    expect(only(c.stdout, /skill ui-ux-pro-max/), c.stdout).toEqual([]);
  });

  it("no role declares a skill: no skill line at all", () => {
    const row = installedWith(["--claude", "--codex", "--antigravity"], {});
    const c = check(row);
    expect(only(c.stdout, /^ {2}(advisory|ok)\s+skill /), c.stdout).toEqual([]);
    expect(only(c.stdout, /declared skills/), c.stdout).toEqual([]);
  });

  it("every not-checked and refusal run exits as the plain missing run does, with and without --strict, with the same counted lines", () => {
    const plain = installedWith(["--claude", "--codex"], { designer: "ui-ux-pro-max" });
    const odd = installedWith(["--claude", "--codex"], { designer: "\n  - ui-ux-pro-max", "frontend-ui": "ui-ux-pro-max" });
    writeFileSync(join(homePlugins(odd), "installed_plugins.json"), "{ not json");
    const env = { CODEX_HOME: join(odd.home, "codex-home") };
    for (const extra of [[], ["--strict"]] as const) {
      const a = check(plain, extra);
      const b = check(odd, extra, env);
      expect(only(b.stdout, /not checked for/).length, b.stdout).toBe(2);
      expect(a.status, a.stdout).toBe(b.status);
      expect(counted(a.stdout)).toEqual(counted(b.stdout));
      expect(summaryLine(a.stdout)).toBe(summaryLine(b.stdout));
    }
  });
});

// ── the shipped kit and the README (plan 42-07; SKILL-05, D-24 to D-26) ───────────────────────────────────────────
describe("--check on the kit as it ships, and the README bullet that describes the skill lines (plan 42-07, SKILL-05)", () => {
  it("an install of the shipped kit for Claude Code and Codex CLI prints one skill line per declared skill per agent, and exits as the no-declaration run does", () => {
    const shipped = scratchRow();
    const r = runInstall(shipped.target, shipped.kitHome, ["--claude", "--codex"], {
      home: shipped.home,
      env: hermeticEnv(shipped.home, shipped.bin),
    });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const c = check(shipped);
    const declared = Object.keys(readRoleSkills(REPO_ROOT).skills).length;
    expect(only(c.stdout, /^ {2}(advisory|ok)\s+skill /).length, c.stdout).toBe(declared * 2);
    expect(only(c.stdout, /declared skills/), c.stdout).toEqual([]);
    const none = check(installedWith(["--claude", "--codex"], {}));
    expect(c.status, c.stdout).toBe(none.status);
  });

  it("install/README.md's --check list has one **Declared skills.** bullet that says what the lines are and links docs/skills.md", () => {
    const flat = readFileSync(join(REPO_ROOT, "install", "README.md"), "utf8").replace(/\s+/g, " ");
    const parts = flat.split("- **Declared skills.**");
    expect(parts.length - 1, "the number of **Declared skills.** bullets").toBe(1);
    const bullet = parts[1]?.split(" - **")[0] ?? "";
    expect(bullet).toContain("installs nothing");
    expect(bullet).toContain("no skill line");
    expect(bullet).toContain("`not checked`");
    expect(bullet).toContain("[docs/skills.md](../docs/skills.md)");
  });
});

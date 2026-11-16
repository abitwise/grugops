// Phase 42 plan 42-03: the skills precedence line and the role-switch protocol's skills line.
//
// The precedence rule is stated once (D-14), so the first case walks the kit's reader-facing
// markdown and derives where the phrase occurs, rather than trusting a list of files.
import { describe, it, expect, afterAll } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { ROLE_HEADING_ORDER, checkHeadingOrder } from "./check-role-rules.js";
import { readRoleSkills, type RoleSkillsReport } from "./role-skills-reader.js";
import { ROLE_COUNT, ROLES_SUBPATH, listRoles } from "./kit-model.js";
import { HOST_SKILL_DIRS, HOST_TOOLS, type HostSkillDirs, type HostTool } from "../install/host-tools.js";

const ROOT = join(import.meta.dirname, "..");
const AGENTS = readFileSync(join(ROOT, "AGENTS.md"), "utf8");

/**
 * The `## Skills` contract (plan 42-06; D-02, D-04, D-07), declared once so plan 42-07 can hold docs/skills.md to the same
 * text. A role that declares a skill carries a `## Skills` section whose table starts with this header line.
 */
const SKILLS_TABLE_HEADER = "| Situation | Skill | Without it |";
/** The two fragments of the record line every `## Skills` section carries. */
const SKILLS_RECORD_FRAGMENTS: readonly string[] = ["not available; used fallback", "Never claim a skill ran."];

const PHRASE = "for technique, never for process";
const PRECEDENCE =
  "Use a skill for technique, never for process: grugops roles, workflows and hard limits outrank any skill's text, so never let a skill set branching, merging, planning artifacts or commit cadence.";

/** The body of the `## <heading>` section (prefix match), up to the next `## ` heading. */
function section(text: string, heading: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`## ${heading}`));
  expect(start, `no "## ${heading}" section`).toBeGreaterThanOrEqual(0);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

/** The number of times `needle` occurs in `hay`, counted without overlap. */
function occurrences(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

/** Every `.md` file under `dir`, walked recursively. */
function markdownUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...markdownUnder(path));
    else if (entry.isFile() && entry.name.endsWith(".md")) found.push(path);
  }
  return found;
}

/**
 * The reader-facing corpus: the root and install guides, every kit markdown file, and the `.md` files
 * directly under `docs/`. `docs/audit/` is left out, because its disposition rows quote the line on purpose.
 */
function corpus(): string[] {
  const docs = readdirSync(join(ROOT, "docs"), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => join(ROOT, "docs", e.name));
  return [
    join(ROOT, "AGENTS.md"),
    join(ROOT, "README.md"),
    join(ROOT, "install/README.md"),
    ...markdownUnder(join(ROOT, "agent-factory")),
    ...docs,
  ];
}

describe("the skills precedence line (D-14)", () => {
  it("occurs exactly once across the reader-facing corpus, and that once is in AGENTS.md", () => {
    const files = corpus();
    expect(files.length, "the corpus walk found too few files to mean anything").toBeGreaterThan(50);
    const hits = files
      .map((f) => ({ file: relative(ROOT, f), count: occurrences(readFileSync(f, "utf8"), PHRASE) }))
      .filter((h) => h.count > 0);
    expect(hits).toEqual([{ file: "AGENTS.md", count: 1 }]);
  });

  it("sits in AGENTS.md § Role / workflow files as the full sentence", () => {
    expect(section(AGENTS, "Role / workflow files")).toContain(PRECEDENCE);
  });

  it("is its own paragraph, outside every claim-anchored region", () => {
    const lines = AGENTS.split("\n");
    const at = lines.findIndex((l) => l.includes(PHRASE));
    expect(at, "the precedence line is not in AGENTS.md").toBeGreaterThan(0);
    expect(lines[at]).toBe(PRECEDENCE);
    expect(lines[at - 1], "the line before the precedence paragraph is not blank").toBe("");
    expect(lines[at - 1]).not.toMatch(/<!--\s*claim:/);
  });
});

const PROTOCOL = readFileSync(join(ROOT, "agent-factory/roles/_role-switch-protocol.md"), "utf8");

/** The five sentences of the skills line under step 2 (D-05, D-06), in order. */
const SKILLS_LINE = [
  "Use a skill the role names only when the host lists it.",
  "A listed `<plugin>:<name>` counts as `<name>`.",
  "Otherwise take the role's fallback at once.",
  "Never search the disk for a skill.",
  "`AGENTS.md` says which rules win over a skill.",
];

describe("the role-switch protocol's skills line (D-05, D-06)", () => {
  /** Step 2 of `## The 5 steps`, with its indented lines. */
  const stepTwo = (): string => {
    const body = section(PROTOCOL, "The 5 steps");
    const from = body.indexOf("2. Read the role's file");
    const to = body.indexOf("3. Drop");
    expect(from, "no step 2").toBeGreaterThanOrEqual(0);
    expect(to, "no step 3 after step 2").toBeGreaterThan(from);
    return body.slice(from, to);
  };

  it("keeps `## The 5 steps` with exactly five numbered steps", () => {
    const numbered = section(PROTOCOL, "The 5 steps")
      .split("\n")
      .filter((l) => /^\d+\. /.test(l))
      .map((l) => l.slice(0, l.indexOf(" ") + 1));
    expect(numbered).toEqual(["1. ", "2. ", "3. ", "4. ", "5. "]);
  });

  it("puts the five skills sentences under step 2, in order, on one line", () => {
    const step = stepTwo();
    expect(step).toContain(`   ${SKILLS_LINE.join(" ")}\n`);
    for (const sentence of SKILLS_LINE) expect(occurrences(PROTOCOL, sentence), sentence).toBe(1);
  });

  it("carries no per-host skill path table and does not restate the precedence rule", () => {
    expect(PROTOCOL).not.toContain(".agents/skills");
    expect(PROTOCOL).not.toContain(".claude/skills");
    expect(PROTOCOL).not.toContain(PHRASE);
  });
});

// Phase 42 plan 42-06: design-system files in the user's repo are user artifacts (amended SKILL-04; D-19, D-23).

const DESIGNER = readFileSync(join(ROOT, "agent-factory/roles/designer.md"), "utf8");
const FRONTEND_UI = readFileSync(join(ROOT, "agent-factory/roles/frontend-ui.md"), "utf8");
const WF14 = readFileSync(join(ROOT, "agent-factory/workflows/14-ui-design-to-build.md"), "utf8");

/** The five sentences that close Workflow 14 step 1 (D-19), in order. */
const WF14_DESIGN_SYSTEM = [
  "Read the design-system files in the user's repo, such as token, theme or style-guide files.",
  "Never write them; they are user artifacts.",
  "When they disagree with the Designer's notes, the files win.",
  "Align the notes to the files.",
  "Record each conflict in a note for the human.",
];

describe("design-system files are user artifacts the Designer and Frontend/UI read, never write (amended SKILL-04; D-19, D-23)", () => {
  it("names `design-system files` in exactly the two roles and Workflow 14, walking AGENTS.md and agent-factory/", () => {
    const files = [join(ROOT, "AGENTS.md"), ...markdownUnder(join(ROOT, "agent-factory"))];
    expect(files.length, "the walk found too few files to mean anything").toBeGreaterThan(50);
    const hits = files
      .filter((f) => readFileSync(f, "utf8").includes("design-system files"))
      .map((f) => relative(ROOT, f))
      .sort();
    expect(hits).toEqual([
      "agent-factory/roles/designer.md",
      "agent-factory/roles/frontend-ui.md",
      "agent-factory/workflows/14-ui-design-to-build.md",
    ]);
  });

  it("puts the never-write sentence in designer.md § Hard limits, pointing to Workflow 14 step 1", () => {
    expect(section(DESIGNER, "Hard limits")).toContain(
      "Never write design-system files in the user's repo; they are user artifacts you read per Workflow 14 step 1.",
    );
  });

  it("puts the never-write sentence in frontend-ui.md § Hard limits", () => {
    expect(section(FRONTEND_UI, "Hard limits")).toContain(
      "Never write design-system files in the user's repo; they are user artifacts you read.",
    );
  });

  it("closes Workflow 14 step 1 with the read, never-write and conflict sentences, in order, on the step's one line", () => {
    const step = section(WF14, "Steps")
      .split("\n")
      .find((l) => l.startsWith("1. Establish the design system once per product (Designer)."));
    expect(step, "no Workflow 14 step 1").toBeDefined();
    expect(step?.endsWith(` ${WF14_DESIGN_SYSTEM.join(" ")}`), "step 1 does not end with the five sentences").toBe(true);
  });

  it("carries no general rule in the role-switch protocol or AGENTS.md (D-23)", () => {
    expect(PROTOCOL).not.toContain("design-system");
    expect(AGENTS).not.toContain("design-system");
  });

  it("keeps both roles' capabilities and declares no skill (42-04: no kit change)", () => {
    for (const [name, text] of [["designer.md", DESIGNER], ["frontend-ui.md", FRONTEND_UI]] as const) {
      expect(text.split("\n").filter((l) => l.startsWith("capabilities:")), name).toEqual(["capabilities: read edit shell"]);
      expect(text.split("\n").some((l) => l.startsWith("skills:")), `${name} has a skills: line`).toBe(false);
    }
  });
});

// Phase 42 plan 42-06: the declare-plus-fallback contract (amended SKILL-01; D-02, D-03, D-04, D-07), and the invariant test the
// 42-03 assumption-delta decision accepted. No shipped role declares a skill (42-04: ratify-none), so the positive case is a
// fixture role; every fixture skill name is invented, so no fixture reads as a recommendation.

/**
 * The `## Skills` contract findings for one role, given its raw text and the skills `readRoleSkills` reports it declares.
 * Each finding starts with the role name.
 */
function skillsSectionFindings(role: string, text: string, declared: readonly string[]): string[] {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.trimEnd() === "## Skills");
  if (start === -1) return declared.length === 0 ? [] : [`${role}: declares ${declared.join(", ")} but has no \`## Skills\` section`];
  if (declared.length === 0) return [`${role}: has a \`## Skills\` section but declares no skill`];

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  const body = end === -1 ? rest : rest.slice(0, end);
  const out: string[] = [];

  const header = body.findIndex((l) => l.trim() === SKILLS_TABLE_HEADER);
  const rows: { skill: string; without: string }[] = [];
  if (header === -1) out.push(`${role}: \`## Skills\` has no \`${SKILLS_TABLE_HEADER}\` table`);
  else {
    for (const line of body.slice(header + 1)) {
      if (!line.trim().startsWith("|")) break;
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
      rows.push({ skill: (cells[1] ?? "").replaceAll("`", ""), without: cells[2] ?? "" });
    }
  }
  const named = rows.map((r) => r.skill);
  for (const skill of declared) if (!named.includes(skill)) out.push(`${role}: declared skill \`${skill}\` has no \`## Skills\` row`);
  for (const { skill, without } of rows) {
    if (!declared.includes(skill)) out.push(`${role}: a \`## Skills\` row names \`${skill}\`, which the role does not declare`);
    else if (without === "" || /^[-—–]$/.test(without)) out.push(`${role}: the \`${skill}\` row has an empty \`Without it\` cell`);
  }
  const joined = body.join("\n");
  for (const fragment of SKILLS_RECORD_FRAGMENTS) {
    if (!joined.includes(fragment)) out.push(`${role}: \`## Skills\` lacks the record line fragment \`${fragment}\``);
  }
  return out;
}

/** The skills `report` lists `role` under, in report order. */
function declaredBy(report: RoleSkillsReport, role: string): string[] {
  return Object.entries(report.skills)
    .filter(([, roles]) => roles.includes(role))
    .map(([skill]) => skill);
}

const SCRATCH = mkdtempSync(join(tmpdir(), "grugops-skills-contract-"));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

let kits = 0;
/** A scratch kit home holding one role file, `fixture.md`; returns the kit home. */
function kitWithRole(text: string): string {
  const kit = join(SCRATCH, `k${kits++}`);
  mkdirSync(join(kit, ROLES_SUBPATH), { recursive: true });
  writeFileSync(join(kit, ROLES_SUBPATH, "fixture.md"), text);
  return kit;
}

const RECORD_LINE = `When the host does not list a skill, note \`<skill> ${SKILLS_RECORD_FRAGMENTS[0]}\`. ${SKILLS_RECORD_FRAGMENTS[1]}`;
const ROW = "| A UI ticket needs a token audit | `example-skill` | Follow `agent-factory/checklists/accessibility-checklist.md`. |";

/** A `## Skills` section body: the table, its rows, a blank line and the record line. */
function skillsBody(rows: readonly string[], record: string = RECORD_LINE): string {
  return [SKILLS_TABLE_HEADER, "|---|---|---|", ...rows, "", record].join("\n");
}

/**
 * A fixture role composed from `ROLE_HEADING_ORDER`, so a change to the order cannot leave the fixtures behind. `skills` is the
 * frontmatter value, or null for no `skills:` line; `body` is the `## Skills` body, or null for no section; `afterOutput` moves
 * the section out of the open slot to just after `## Output`.
 */
function fixtureRole(skills: string | null, body: string | null, afterOutput = false): string {
  const out = ["---", "kind: role", "tier: core", "capabilities: read edit shell"];
  if (skills !== null) out.push(`skills: ${skills}`);
  out.push("---", "# Role: Fixture", "");
  for (const heading of ROLE_HEADING_ORDER) {
    out.push(heading, "Fixture text.", "");
    const slot = afterOutput ? "## Output" : "## Responsibilities";
    if (body !== null && heading === slot) out.push("## Skills", body, "");
  }
  return out.join("\n");
}

/** Read the fixture back through the one parser the doctor uses, and run the contract checker on it. */
function contractOf(text: string): { declared: string[]; findings: string[] } {
  const report = readRoleSkills(kitWithRole(text));
  expect(report.refusals, "the fixture role was refused").toEqual([]);
  const declared = declaredBy(report, "fixture");
  return { declared, findings: skillsSectionFindings("fixture", text, declared) };
}

describe("a role may declare a skill with a built-in fallback, and every shipped role holds the contract (amended SKILL-01; D-02, D-04, D-07)", () => {
  it("every shipped role has a `## Skills` section exactly when it declares a skill, and no declaration is refused", () => {
    const roles = listRoles(ROOT);
    expect(roles.length, "the role walk is not the whole role set").toBe(ROLE_COUNT);
    const report = readRoleSkills(ROOT);
    expect(report.refusals).toEqual([]);
    const findings: string[] = [];
    for (const file of roles) {
      const role = file.slice(0, -".md".length);
      const text = readFileSync(join(ROOT, ROLES_SUBPATH, file), "utf8");
      const declared = declaredBy(report, role);
      const hasSection = text.split("\n").some((l) => l.trimEnd() === "## Skills");
      expect(hasSection, `${role}: a \`## Skills\` section exactly when a skill is declared`).toBe(declared.length > 0);
      findings.push(...skillsSectionFindings(role, text, declared));
    }
    expect(findings).toEqual([]);
  });

  it("a fixture role declaring `example-skill` with a fallback row and the record line passes the checker and the heading order", () => {
    const text = fixtureRole("example-skill", skillsBody([ROW]));
    const { declared, findings } = contractOf(text);
    expect(declared).toEqual(["example-skill"]);
    expect(findings).toEqual([]);
    expect(checkHeadingOrder("fixture", text)).toEqual([]);
  });

  it.each([
    ["declared with no section", fixtureRole("example-skill", null)],
    ["a section with no declaration", fixtureRole(null, skillsBody([ROW]))],
    ["a row with an empty `Without it` cell", fixtureRole("example-skill", skillsBody(["| A UI ticket needs a token audit | `example-skill` |  |"]))],
    ["a row whose `Without it` cell is a dash", fixtureRole("example-skill", skillsBody(["| A UI ticket needs a token audit | `example-skill` | — |"]))],
    ["a declared skill with no row", fixtureRole("example-skill", skillsBody([]))],
    ["a section missing `Never claim a skill ran.`", fixtureRole("example-skill", skillsBody([ROW], RECORD_LINE.replace(` ${SKILLS_RECORD_FRAGMENTS[1]}`, "")))],
  ])("refuses %s with exactly one finding naming the role", (_case, text) => {
    const { findings } = contractOf(text);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.startsWith("fixture:"), findings[0]).toBe(true);
  });

  it("refuses a row naming a skill the role does not declare with exactly one finding naming that skill", () => {
    const stray = "| A second case | `undeclared-example-skill` | Follow the role's own rule. |";
    const { findings } = contractOf(fixtureRole("example-skill", skillsBody([ROW, stray])));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain("undeclared-example-skill");
  });

  it("refuses a `## Skills` section after `## Output` through checkHeadingOrder", () => {
    const findings = checkHeadingOrder("fixture", fixtureRole("example-skill", skillsBody([ROW]), true));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain("`## Skills`");
  });
});

// Phase 42 plan 42-07: docs/skills.md, pinned two ways to the code it describes (amended SKILL-01, SKILL-03; SKILL-05;
// D-01, D-06, D-24). The page recommends no skill (42-04: ratify-none), so its skill set must equal the set the shipped
// roles declare, which is empty today; its host table must equal HOST_SKILL_DIRS; and its spawn-mode sentence must hold
// for every Claude Code adapter's `tools:` line.

const SKILLS_DOC_PATH = join(ROOT, "docs", "skills.md");
const NO_RECOMMENDATION = "grugops recommends no third-party skill.";
const HOST_TABLE_HEADER = "| Host | Project folders | User folders | Plugin installs | May be moved by |";

/** The page, or an empty string when it does not exist yet, so each case fails on its own assertion. */
function skillsDoc(): string {
  return existsSync(SKILLS_DOC_PATH) ? readFileSync(SKILLS_DOC_PATH, "utf8") : "";
}

/** The `|`-led lines of a section body, in order. */
function tableLines(body: string): string[] {
  return body.split("\n").filter((l) => l.trim().startsWith("|"));
}

/** The data rows of a markdown table: the lines after the header, without the separator row. */
function dataRows(lines: readonly string[]): string[] {
  return lines.slice(1).filter((l) => !/^\|(\s*:?-+:?\s*\|)+\s*$/.test(l.trim()));
}

/** The cells of one table row, trimmed. */
function cellsOf(row: string): string[] {
  return row.trim().slice(1, -1).split("|").map((c) => c.trim());
}

/**
 * The one rendering of a host row (D-06, D-24). The page copies what this returns, so the page and HOST_SKILL_DIRS
 * cannot drift apart silently.
 */
function renderHostRow(host: HostTool, dirs: HostSkillDirs): string {
  const folders = (paths: readonly string[], prefix: string): string => paths.map((p) => `\`${prefix}${p}/\``).join(", ");
  const plugins =
    dirs.plugins.kind === "claude-installed-plugins"
      ? "each plugin in Claude Code's installed-plugin record"
      : dirs.plugins.kind === "plugin-folders"
        ? `the \`skills/\` folder of each plugin under \`~/${dirs.plugins.userRoot}/\``
        : "`UNKNOWN - verify`";
  const overrides = dirs.userOverrides.length === 0 ? "none" : dirs.userOverrides.map((v) => `\`${v}\``).join(", ");
  return `| ${[host.name, folders(dirs.project, ""), folders(dirs.user, "~/"), plugins, overrides].join(" | ")} |`;
}

/**
 * The findings for the `## Recommended skills` section against the skills the shipped roles declare (D-01). With no
 * declared skill the section carries the no-recommendation sentence and no table; with any, it carries no such sentence
 * and its table names exactly the declared skills, each in its first cell.
 */
function recommendedSkillsFindings(body: string, declared: readonly string[]): string[] {
  const out: string[] = [];
  const lines = tableLines(body);
  const named = dataRows(lines).map((r) => (cellsOf(r)[0] ?? "").replaceAll("`", ""));
  if (declared.length === 0) {
    if (!body.includes(NO_RECOMMENDATION)) out.push(`no role declares a skill, but the section lacks "${NO_RECOMMENDATION}"`);
    if (lines.length > 0) out.push("no role declares a skill, but the section has a table");
    return out;
  }
  if (body.includes(NO_RECOMMENDATION)) out.push(`a role declares a skill, but the section still says "${NO_RECOMMENDATION}"`);
  for (const skill of declared) if (!named.includes(skill)) out.push(`declared skill \`${skill}\` is not named in the section`);
  for (const skill of named) if (!declared.includes(skill)) out.push(`the section names \`${skill}\`, which no role declares`);
  return out;
}

/** The comma-separated tokens of a `tools:` value, trimmed. A `Skill` grant is the token `Skill` or `Skill(...)`. */
function toolTokens(line: string): string[] {
  return line.replace(/^tools:\s*/, "").split(",").map((t) => t.trim());
}

describe("docs/skills.md: no recommended skill, pinned to the declarations, the host table and the adapters (amended SKILL-01, SKILL-03; SKILL-05)", () => {
  it("§ Recommended skills names exactly the skills the shipped roles declare, both ways", () => {
    const report = readRoleSkills(ROOT);
    expect(report.refusals).toEqual([]);
    const declared = Object.keys(report.skills).sort();
    expect(recommendedSkillsFindings(section(skillsDoc(), "Recommended skills"), declared)).toEqual([]);
  });

  it("the Recommended-skills pin fails both ways: a declaration the page does not name, and a table with no declaration", () => {
    const empty = `${NO_RECOMMENDATION}\n\nA maintainer declined the proposals.`;
    expect(recommendedSkillsFindings(empty, [])).toEqual([]);
    const gained = recommendedSkillsFindings(empty, ["example-skill"]);
    expect(gained.some((f) => f.includes("example-skill"))).toBe(true);
    expect(gained.some((f) => f.includes(NO_RECOMMENDATION))).toBe(true);
    const table = "| Skill | Roles |\n|---|---|\n| `example-skill` | designer |";
    expect(recommendedSkillsFindings(table, ["example-skill"])).toEqual([]);
    expect(recommendedSkillsFindings(table, [])).toHaveLength(2);
    expect(recommendedSkillsFindings(table, ["example-skill", "second-example-skill"])).toEqual([
      "declared skill `second-example-skill` is not named in the section",
    ]);
  });

  it("§ Where each host looks for skills has one row per HOST_TOOLS host, in registry order, equal cell by cell to HOST_SKILL_DIRS", () => {
    expect(Object.keys(HOST_SKILL_DIRS).sort()).toEqual(HOST_TOOLS.map((h) => h.id).sort());
    const lines = tableLines(section(skillsDoc(), "Where each host looks for skills"));
    expect(lines[0]?.trim()).toBe(HOST_TABLE_HEADER);
    const rows = dataRows(lines);
    expect(rows.map((r) => cellsOf(r)[0]), "the host rows, by name and order").toEqual(HOST_TOOLS.map((h) => h.name));
    for (const host of HOST_TOOLS) {
      const dirs = HOST_SKILL_DIRS[host.id];
      expect(dirs, `HOST_SKILL_DIRS has no row for ${host.name}`).toBeDefined();
      const row = rows.find((r) => cellsOf(r)[0] === host.name);
      expect(row?.trim(), `the ${host.name} row`).toBe(renderHostRow(host, dirs as HostSkillDirs));
    }
  });

  it("§ How a role declares a skill carries the role contract's table header and record line, and the spawn-mode limit", () => {
    const body = section(skillsDoc(), "How a role declares a skill");
    expect(body).toContain(SKILLS_TABLE_HEADER);
    for (const fragment of SKILLS_RECORD_FRAGMENTS) expect(body).toContain(fragment);
    expect(body).toContain("skills:");
    expect(body).toContain("no `Skill` tool");
  });

  it("no Claude Code role adapter has a `Skill` tool, so the page's spawn-mode sentence holds", () => {
    const dir = join(ROOT, ".claude", "agents");
    const adapters = readdirSync(dir).filter((f) => f.endsWith(".md"));
    expect(adapters.length).toBeGreaterThan(0);
    for (const file of adapters) {
      const line = readFileSync(join(dir, file), "utf8").split("\n").find((l) => l.startsWith("tools:"));
      expect(line, `${file} has no tools: line`).toBeDefined();
      const grants = toolTokens(line ?? "").filter((t) => t === "Skill" || t.startsWith("Skill("));
      expect(grants, `${file} grants a Skill tool`).toEqual([]);
    }
  });

  it("§ Read this first carries the vet-it-yourself notice and points to AGENTS.md without restating its line", () => {
    const page = skillsDoc();
    const body = section(page, "Read this first");
    expect(body).toContain("Any skill you install is third-party code you vet yourself.");
    expect(body).toContain("never vendors or installs a skill");
    expect(body).toContain("AGENTS.md");
    expect(page).not.toContain(PHRASE);
  });

  it("§ What install.js --check does and § Design-system files say what the doctor and the two roles do", () => {
    const page = skillsDoc();
    const check = section(page, "What install.js --check does");
    expect(check).toContain("installs nothing");
    expect(check).toContain("no skill line");
    expect(check).toContain("`--strict`");
    const design = section(page, "Design-system files");
    expect(design).toContain("design-system files");
    expect(design).toContain("never write them");
  });

  it("§ How these were chosen names a record that exists and both re-evaluation triggers; the page prints no pin or install command", () => {
    const page = skillsDoc();
    const body = section(page, "How these were chosen");
    const paths = [...body.matchAll(/`([^`\s]+\.md)`/g)].map((m) => m[1] ?? "");
    expect(paths.length, "the section names no .md path").toBeGreaterThan(0);
    for (const p of paths) expect(existsSync(join(ROOT, p)), p).toBe(true);
    expect(body).toContain("asks to bump");
    expect(body).toContain("security advisory");
    expect(page).not.toMatch(/[0-9a-f]{40}/);
    for (const command of ["/plugin install", "npm install", "npx ", "pip install"]) expect(page).not.toContain(command);
  });
});

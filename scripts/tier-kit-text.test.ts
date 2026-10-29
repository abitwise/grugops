// tier-kit-text.test.ts — text assertions over the kit prose Phase 39 writes.
//
// Plan 39-05 adds the cases for agent-factory/checklists/complexity-rubric.md (TIER-01, TIER-03,
// D-11, D-31) and agent-factory/roles/tech-lead.md (TIER-01; D-04..D-07, D-10, D-17, D-19, D-21).
// Plan 39-06 adds the cases for agent-factory/roles/designer.md (TIER-05; D-23..D-27).
// Plan 39-07 adds the cases for the engineer's `levels:` line and `## Levels` section (TIER-02,
// TIER-03; D-5, D-10, D-17, D-18, D-31), and the dial documentation of the D-2 amendment and the
// level keys (D-2, D-15, D-16, D-22). Later Phase 39 plans add WF04 and WF14.
//
// Each case reads the shipped file and asserts a stated phrase or an ordering. The cases are about
// the WORDS an agent reads: the junior gate and its exclusions are enforced in text (D-31), so the
// text is what this file pins.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const RUBRIC_PATH = "agent-factory/checklists/complexity-rubric.md";
const RUBRIC = readFileSync(join(ROOT, RUBRIC_PATH), "utf8");
const TECH_LEAD = readFileSync(join(ROOT, "agent-factory/roles/tech-lead.md"), "utf8");
const DESIGNER = readFileSync(join(ROOT, "agent-factory/roles/designer.md"), "utf8");
const CHECKLIST_INDEX = readFileSync(join(ROOT, "agent-factory/checklists/00-index.md"), "utf8");
const ENGINEER = readFileSync(join(ROOT, "agent-factory/roles/software-engineer.md"), "utf8");

/** The body of the `## <heading>` section (prefix match), up to the next `## ` heading. */
function section(text: string, heading: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`## ${heading}`));
  expect(start, `no "## ${heading}" section`).toBeGreaterThanOrEqual(0);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

/** The numbered list items of a section, in order, with their numbers. */
function numbered(body: string): { n: number; text: string }[] {
  return body
    .split("\n")
    .map((l) => /^(\d+)\. (.*)$/.exec(l))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ n: Number(m[1]), text: m[2] as string }));
}

/** The F-factor table row whose first cell starts with `id`, split into its cells. */
function factorRow(id: string): string[] {
  const row = RUBRIC.split("\n").find((l) => l.startsWith(`| ${id} `));
  expect(row, `no factor table row for ${id}`).toBeDefined();
  return (row as string).split("|").slice(1, -1).map((c) => c.trim());
}

describe("complexity-rubric.md (TIER-01, TIER-03, D-11, D-12, D-31)", () => {
  it("is a lean-tier checklist with its heading, listed in the checklist index", () => {
    expect(RUBRIC.startsWith("---\nkind: checklist\ntier: lean\n---\n# Complexity rubric\n")).toBe(true);
    const rows = CHECKLIST_INDEX.split("\n").filter((l) => l.startsWith("| `complexity-rubric.md` |"));
    expect(rows).toHaveLength(1);
    // It sits in the Lean tier table, before the Enterprise heading.
    expect(CHECKLIST_INDEX.indexOf(rows[0] as string)).toBeLessThan(CHECKLIST_INDEX.indexOf("## Enterprise tier"));
  });

  it("names the Tech Lead, both modes and the Definition of Ready as when it applies", () => {
    expect(RUBRIC).toContain("The Tech Lead scores every ticket with this rubric, in both modes, after the Definition of Ready check.");
  });

  it("lists the six factors F1-F6 in order, each with a 0, 1 and 2 column and a way to measure it", () => {
    const ids = RUBRIC.split("\n")
      .map((l) => /^\| (F\d) /.exec(l))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => m[1]);
    expect(ids).toEqual(["F1", "F2", "F3", "F4", "F5", "F6"]);
    const names = ["F1 files touched", "F2 spec completeness", "F3 risk surface", "F4 novelty", "F5 test burden", "F6 blast radius"];
    for (const name of names) {
      const cells = factorRow(name.slice(0, 2));
      expect(cells[0]).toBe(name);
      expect(cells, `${name} needs five cells: name, 0, 1, 2, how to measure`).toHaveLength(5);
      for (const c of cells) expect(c.length, `${name} has an empty cell`).toBeGreaterThan(0);
    }
  });

  it("TIER-03 / D-31: the F3 = 2 cell carries auth, money, PII, security, migration, concurrency and test integrity", () => {
    const two = factorRow("F3")[3] as string;
    for (const tag of ["auth", "money", "PII", "security", "migration", "concurrency", "test integrity"]) {
      expect(two, `F3 = 2 is missing "${tag}"`).toContain(tag);
    }
  });

  it("TIER-03 / D-31: any one of the four exclusions makes the junior level impossible", () => {
    const body = section(RUBRIC, "Junior exclusions");
    expect(body).toContain("Security, migration, concurrency and test integrity are F3 = 2 risk tags, with auth, money and PII.");
    expect(body).toContain("Any one of them makes the junior level impossible.");
  });

  it("precision: each factor is an integer 0, 1 or 2 and the sum is a plain total with no weights and no rounding", () => {
    expect(section(RUBRIC, "Factors")).toContain("Each factor is an integer 0, 1 or 2.");
    expect(RUBRIC).toContain("The sum is their plain total, with no weights and no rounding.");
    expect(RUBRIC).toContain("The bands are inclusive.");
  });

  it("ordering: the mapping is a numbered list 1-7 in the fixed rule order", () => {
    const items = numbered(section(RUBRIC, "Mapping"));
    expect(items.map((i) => i.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const expected: RegExp[] = [
      /^Size XL, or a file plan too large for one PR, gives `SPLIT_REQUIRED` and no level\.$/,
      /^F2 = 2 is not dispatchable, so the ticket goes back to `In Design` for the Architect\.$/,
      /^Sum the six scores\./,
      /^A sum of 0-3 gives junior only when F2 = 0 and F3 = 0, and otherwise gives mid\.$/,
      /^A sum of 4-7 gives mid\.$/,
      /^A sum of 8-12 gives senior\.$/,
      /^F3 = 2 gives at least mid\.$/,
    ];
    items.forEach((item, i) => expect(item.text).toMatch(expected[i] as RegExp));
    expect(section(RUBRIC, "Mapping")).toContain("Apply these rules in this order.");
  });

  it("boundary: the bands put sums 3 and 4, and sums 7 and 8, on different sides", () => {
    const mapping = section(RUBRIC, "Mapping");
    // 3 is the top of the junior band and 4 the bottom of mid; 7 the top of mid and 8 the bottom of senior.
    expect(mapping).toMatch(/0-3 gives junior/);
    expect(mapping).toMatch(/4-7 gives mid/);
    expect(mapping).toMatch(/8-12 gives senior/);
    expect(mapping).not.toMatch(/0-4|3-7|7-12|0-7/);
  });

  it("adjacency: a sum of 0-3 with F2 = 1 or F3 = 1 maps to mid and never to junior", () => {
    expect(section(RUBRIC, "Mapping")).toContain("A sum of 0-3 with F2 = 1 or F3 = 1 maps to mid, never to junior.");
  });

  it("empty: an unmeasurable factor is `UNKNOWN - verify` scored 2, and no file list scores F2 = 2", () => {
    const body = section(RUBRIC, "Unknowns");
    expect(body).toContain("A factor the Tech Lead cannot measure is recorded `UNKNOWN - verify` and scored 2.");
    expect(body).toContain("A dev plan with no file list scores F2 = 2.");
  });

  it("the record lists the factors in F1-F6 order, then the sum, the level, the adapter and any fired rule", () => {
    const body = section(RUBRIC, "Record");
    expect(body).toContain("each factor in F1-F6 order, with its score and the fact behind it");
    expect(body).toContain("the sum, the level, the adapter `grugops-software-engineer-<level>` and any rule above that fired");
  });

  it("D-11: it carries the LOW confidence label and the calibration trigger of about 30 scored tickets", () => {
    const body = section(RUBRIC, "Confidence");
    expect(body).toContain("LOW confidence");
    expect(body).toContain("starting values");
    expect(body).toContain("about 30 scored tickets");
  });
});

describe("tech-lead.md (TIER-01; D-01, D-04..D-07, D-10, D-12, D-17, D-19, D-21)", () => {
  it("D-01: core tier, the read edit shell capabilities, no skills value, and the role heading", () => {
    expect(TECH_LEAD.startsWith("---\nkind: role\ntier: core\ncapabilities: read edit shell\n---\n# Role: Tech Lead\n")).toBe(true);
    expect(TECH_LEAD).not.toMatch(/^skills:/m);
  });

  it("its one job is to score, name the level and plan the dev tasks", () => {
    expect(section(TECH_LEAD, "One job").trim().split("\n")[0]).toBe(
      "Score each ticket's complexity, name the engineer level and plan the dev tasks.",
    );
  });

  it("carries exactly one Workflow 16 and one Workflow 18 reference", () => {
    expect(TECH_LEAD.split("16-context-read-write").length - 1).toBe(1);
    expect(TECH_LEAD.split("18-context-compaction").length - 1).toBe(1);
  });

  it("D-12: it points at the rubric and does not restate it", () => {
    expect(TECH_LEAD).toContain(RUBRIC_PATH);
    // The rubric's own bands, factor names and table are not in the role.
    for (const restated of ["0-3", "4-7", "8-12", "F1", "F6", "blast radius", "| F"]) {
      expect(TECH_LEAD, `the role restates the rubric ("${restated}")`).not.toContain(restated);
    }
  });

  it("D-05: it plans only on the Architect's published notes and sends an undesigned approach back to `In Design`", () => {
    const body = section(TECH_LEAD, "Responsibilities");
    expect(body).toContain("Plan only on top of the Architect's published notes.");
    expect(body).toContain("When the approach still needs design (F2 = 2), record the gap and send the ticket back to `In Design`.");
    expect(section(TECH_LEAD, "Hard limits")).toContain("Never make a structural decision");
  });

  it("D-06: it may return `SPLIT_REQUIRED`", () => {
    expect(section(TECH_LEAD, "Responsibilities")).toContain(
      "Return `SPLIT_REQUIRED` for an XL ticket or a file plan too large for one PR.",
    );
  });

  it("D-07: each dev task names a file path, the change and concrete Given/When/Then test cases", () => {
    expect(section(TECH_LEAD, "Responsibilities")).toContain(
      "each with a file path, the change and concrete Given/When/Then test cases",
    );
  });

  it("D-10: the plan is guidance an engineer may deviate from with a recorded reason", () => {
    expect(section(TECH_LEAD, "Hard limits")).toContain(
      "The plan is guidance: an engineer may deviate from it and records the reason.",
    );
  });

  it("D-04 / D-17: the Output names the decision note's contents and the `## Tech Lead plan` section", () => {
    const body = section(TECH_LEAD, "Output");
    expect(body).toContain(
      "A `decision` note per Workflow 16 holding the six factor scores with the fact behind each, the sum, the level, the adapter `grugops-software-engineer-<level>` and the dev tasks.",
    );
    expect(body).toContain("A short `## Tech Lead plan` section in the ticket body: level, adapter, sum and note id.");
    expect(body).toContain("No ticket frontmatter key and no dev-plan file.");
    expect(section(TECH_LEAD, "Responsibilities")).toContain("the Orchestrator dispatches exactly that adapter");
  });

  it("D-9 (prohibition): neither file tells an agent to write a `level` ticket key", () => {
    // The closed ticket key set itself is pinned two-sided by TICKET_KEY_COUNT in
    // scripts/board-model.ts; this file reads text only, so it does not import the key half (the
    // one-authority census in scripts/validate.test.ts refuses a text scanner that does).
    for (const [name, text] of [["tech-lead.md", TECH_LEAD], ["complexity-rubric.md", RUBRIC]] as const) {
      expect(text, `${name} spells a \`level:\` key`).not.toMatch(/^\s*level:/m);
      expect(text, `${name} spells a \`level:\` key`).not.toContain("`level:");
    }
    expect(section(TECH_LEAD, "Output")).toContain("No ticket frontmatter key");
  });

  it("D-08: the ticket stays in `Ready for Dev` while the Tech Lead plans; F2 = 2 returns it to `In Design`", () => {
    const body = section(TECH_LEAD, "Board moves");
    expect(body).toContain("No column of its own: the ticket stays in `Ready for Dev` while the Tech Lead plans.");
    expect(body).toContain("F2 = 2 returns a ticket to `In Design`.");
  });

  it("D-19: it owns the exit of a dev-raised `## Blocked` and records one of the four moves in a new decision note", () => {
    const resp = section(TECH_LEAD, "Responsibilities");
    expect(resp).toContain(
      "On a ticket the engineer moved to `## Blocked`, read its `failed-attempt` note and record one move in a new decision note: escalate one level, at most once per ticket; re-plan and re-score; split; or send it back to the Architect.",
    );
    expect(section(TECH_LEAD, "Board moves")).toContain(
      "It owns the exit of a dev-raised `## Blocked`, returning the ticket to `Ready for Dev`.",
    );
  });

  it("D-21: it never escalates twice, and stops for a named human once the options are used up", () => {
    const body = section(TECH_LEAD, "Hard limits");
    expect(body).toContain("Never escalate a ticket twice.");
    expect(body).toContain("After the options are used up, stop for a named human.");
    expect(body).toContain("Merge and deploy stay with humans.");
  });
});

describe("designer.md (TIER-05; D-23..D-27)", () => {
  it("D-27: core tier, the read edit capabilities, no skills value, and the role heading", () => {
    expect(DESIGNER.startsWith("---\nkind: role\ntier: core\ncapabilities: read edit\n---\n# Role: Designer\n")).toBe(true);
    expect(DESIGNER).not.toMatch(/^skills:/m);
    // T-39-21: never the coordinator-only `admit` capability, and no spawn grant.
    expect(DESIGNER).not.toMatch(/^capabilities:.*\badmit\b/m);
    expect(DESIGNER).not.toContain("Agent(");
  });

  it("its one job is to set the product-wide design strategy every UI ticket builds on", () => {
    expect(section(DESIGNER, "One job").trim().split("\n")[0]).toBe(
      "Set the product-wide design strategy and guidelines every UI ticket builds on.",
    );
  });

  it("carries exactly one Workflow 16 and one Workflow 18 reference", () => {
    expect(DESIGNER.split("16-context-read-write").length - 1).toBe(1);
    expect(DESIGNER.split("18-context-compaction").length - 1).toBe(1);
  });

  it("reads the product context, the architecture notes, earlier Designer notes and the accessibility checklist", () => {
    const body = section(DESIGNER, "Reads");
    expect(body).toContain("The product context and the architecture notes, pulled per Workflow 16.");
    expect(body).toContain("Any earlier Designer notes");
    expect(body).toContain("`agent-factory/checklists/accessibility-checklist.md`");
  });

  it("D-26: it owns the principles, the token system, the style direction, the WCAG 2.2 AA bar and the tells to avoid", () => {
    const body = section(DESIGNER, "Responsibilities");
    expect(body).toContain("Set the design principles and the style direction for the product.");
    expect(body).toContain("Define the token system: the palette, the type scale and the spacing scale.");
    expect(body).toContain("Set the product-wide accessibility bar at WCAG 2.2 AA.");
    expect(body).toContain("Name the generated-design tells to avoid");
  });

  it("D-26: it leaves the per-ticket work to Frontend/UI", () => {
    expect(section(DESIGNER, "Responsibilities")).toContain(
      "Leave the component inventory, the five states, per-ticket WCAG application and the visual baseline to Frontend/UI.",
    );
    expect(section(DESIGNER, "Hard limits")).toContain("Never author a per-ticket contract, and never write component code.");
  });

  it("D-25: it runs once per product and re-runs for a UI epic only on a new direction", () => {
    expect(section(DESIGNER, "Activates when").trim()).toBe(
      "Need a design system for UI work (the first UI work in a repo, or a UI epic that needs a new direction).",
    );
    const body = section(DESIGNER, "Responsibilities");
    expect(body).toContain("Run once per product.");
    expect(body).toContain("Re-run for a UI epic only when it needs a new direction; per-ticket UI goes straight to Frontend/UI.");
  });

  it("D-24: it publishes only typed `decision` and `artifact-ref` notes and no memory-bank master file", () => {
    const body = section(DESIGNER, "Output");
    expect(body).toContain("Typed `decision` and `artifact-ref` notes per Workflow 16, each with the trace ids on its refs");
    expect(body).toContain("No memory-bank master file.");
    // No other note kind is named as an output.
    for (const kind of ["`observation`", "`finding`", "`failed-attempt`"]) {
      expect(body, `the Output names ${kind}`).not.toContain(kind);
    }
  });

  it("it causes no column transition and runs at the design step before Frontend/UI", () => {
    expect(section(DESIGNER, "Board moves")).toContain(
      "No column transition of its own: the Designer runs at the design step, before Frontend/UI writes the ticket's contract.",
    );
  });

  it("Hard limits: the WCAG 2.2 AA bar in clear professional English, no fabrication, merge and deploy with humans", () => {
    const body = section(DESIGNER, "Hard limits");
    expect(body).toContain("The accessibility bar is WCAG 2.2 AA, stated in clear professional English.");
    expect(body).toContain("Never fabricate a guideline or a passing bar; mark anything unverified `UNKNOWN - verify`.");
    expect(body).toContain("Merge and deploy remain human decisions.");
  });
});

describe("software-engineer.md `## Levels` (TIER-02, TIER-03; D-5, D-10, D-13, D-17, D-18, D-31)", () => {
  const levels = (): string => section(ENGINEER, "Levels");

  it("D-13: the frontmatter declares `levels: junior mid senior` once, as its last line", () => {
    const fm = ENGINEER.split("\n---\n")[0] as string;
    expect(fm.split("\n").filter((l) => l.startsWith("levels:"))).toEqual(["levels: junior mid senior"]);
    expect(fm.split("\n").at(-1)).toBe("levels: junior mid senior");
  });

  it("the `## Levels` section exists once and sits right after `## Responsibilities`", () => {
    const headings = ENGINEER.split("\n").filter((l) => l.startsWith("## "));
    expect(headings.filter((h) => h === "## Levels")).toHaveLength(1);
    expect(headings[headings.indexOf("## Levels") - 1]).toBe("## Responsibilities");
  });

  it("D-17: on Claude Code it names the three level adapters and says the Tech Lead names one per ticket", () => {
    const body = levels();
    expect(body).toContain("On Claude Code this role runs as `grugops-software-engineer-junior`, `-mid` or `-senior`");
    expect(body).toContain("the Tech Lead names one for each ticket");
  });

  it("D-5 / D-17: on the other hosts the level in the ticket's `## Tech Lead plan` is scope guidance only, with no model advice", () => {
    const body = levels();
    expect(body).toContain("On the other hosts, read the level in the ticket's `## Tech Lead plan` section and keep to that level's scope; the model does not change.");
    // No model is named or advised anywhere in the section.
    for (const word of ["haiku", "sonnet", "opus", "Haiku", "Sonnet", "Opus", "effort"]) {
      expect(body, `the section must not advise a model: "${word}"`).not.toContain(word);
    }
  });

  it("the scope of each level is the complexity rubric's, which it points at and does not restate", () => {
    const body = levels();
    expect(body).toContain("`agent-factory/checklists/complexity-rubric.md` sets the scope of each level.");
    expect(body).not.toContain("F1");
  });

  it("TIER-03 / D-31: a junior takes only tasks whose plan fixes what to write, and stops `BLOCKED` on the four excluded kinds of work", () => {
    const body = levels();
    expect(body).toContain("A junior takes only tasks whose plan already fixes what to write.");
    expect(body).toContain("A junior that meets security, migration, concurrency or test-integrity work stops and reports `BLOCKED`.");
  });

  it("D-10: every level may deviate from the plan, recording what changed and why", () => {
    expect(levels()).toContain("At any level you may deviate from the plan to fit the real code; record what changed and why in your notes.");
  });

  it("D-18: a blocked engineer, or one whose gate fails a second time, publishes a `failed-attempt` note per WF04", () => {
    expect(levels()).toContain(
      "When you are blocked, or the gate fails a second time, publish a `failed-attempt` note per `agent-factory/workflows/04-ticket-to-pr.md`.",
    );
  });

  it("the role keeps exactly one Workflow 16 and one Workflow 18 reference after the section lands", () => {
    expect(ENGINEER.split("16-context-read-write.md").length - 1).toBe(1);
    expect(ENGINEER.split("18-context-compaction.md").length - 1).toBe(1);
  });
});

describe("the level dial documentation (TIER-03; D-2, D-5, D-15, D-16, D-17, D-22)", () => {
  const CONFIG = readFileSync(join(ROOT, "agent-factory/config/factory.config.md"), "utf8");
  const PACKAGING = readFileSync(join(ROOT, "agent-factory/packaging/subagent.frontmatter.md"), "utf8");
  const TIERS = readFileSync(join(ROOT, "scripts/model-tiers.ts"), "utf8");

  it("factory.config.md names the three level adapter stems and their D-14 pins", () => {
    for (const stem of ["software-engineer-junior", "software-engineer-mid", "software-engineer-senior"]) {
      expect(CONFIG).toContain(`\`${stem}\``);
    }
    expect(CONFIG).toContain("junior `haiku` at effort `medium`, mid `sonnet` at effort `medium`, senior `opus` at effort `high`");
  });

  it("D-15 / D-16: the role-wide key covers all three levels, a level key wins, and no preset changes a level", () => {
    expect(CONFIG).toContain("The key `software-engineer` applies to all three levels, and a level key wins over it for its own level.");
    expect(CONFIG).toContain("A `preset`, `none` or `tiered`, never changes a level: only a `roles` entry does.");
    expect(CONFIG).toContain("nor a level adapter stem");
  });

  it("D-2 / D-22: the v2.1.293 floor is recorded with its source, and Haiku 4.5 on the cloud providers is `UNKNOWN - verify` for effort", () => {
    expect(CONFIG).toContain("Claude Code v2.1.293 or later");
    expect(CONFIG).toContain("does not check the installed Claude Code version");
    expect(CONFIG).toMatch(/Haiku 4\.5[^\n]*`UNKNOWN - verify`/);
    expect(TIERS).toContain("v2.1.293");
    expect(TIERS).toContain("THE D-2 AMENDMENT RECORD");
  });

  it("D-5 / D-17: the level is guidance on every other host, with no model advice", () => {
    expect(CONFIG).toContain("**The level is guidance on the other hosts.**");
    expect(CONFIG).toContain("grugops gives no model advice for those hosts.");
  });

  it("T-39-11: the three run-time flattening paths are named and no enforcement is claimed", () => {
    expect(CONFIG).toContain("**A `model` or `effort` parameter on the spawn call.**");
    expect(CONFIG).toContain("**`CLAUDE_CODE_SUBAGENT_MODEL`.**");
    expect(CONFIG).toContain("**An `availableModels` restriction.**");
    expect(CONFIG).toContain("grugops does not enforce the level");
  });

  it("subagent.frontmatter.md carries no specialist or adapter count, and documents the level adapter's differing lines", () => {
    expect(PACKAGING).not.toMatch(/\b(16|sixteen) (of them|specialist|adapters)/i);
    expect(PACKAGING).toContain("### The level adapter");
    expect(PACKAGING).toContain("`name` is `grugops-<role>-<level>`.");
    expect(PACKAGING).toContain("ends with ` Level: <level>.` inside its quotes");
  });
});

// tier-kit-text.test.ts — text assertions over the kit prose Phase 39 writes.
//
// Plan 39-05 adds the cases for agent-factory/checklists/complexity-rubric.md (TIER-01, TIER-03,
// D-11, D-31) and agent-factory/roles/tech-lead.md (TIER-01; D-04..D-07, D-10, D-17, D-19, D-21).
// Plan 39-06 adds the cases for agent-factory/roles/designer.md (TIER-05; D-23..D-27).
// Plan 39-07 adds the cases for the engineer's `levels:` line and `## Levels` section (TIER-02,
// TIER-03; D-5, D-10, D-17, D-18, D-31), and the dial documentation of the D-2 amendment and the
// level keys (D-2, D-15, D-16, D-22).
// Plan 39-08 adds the cases for the Tech Lead in agent-factory/workflows/04-ticket-to-pr.md and the
// Orchestrator's routing block (TIER-01; D-02, D-05, D-06, D-08, D-17, D-30), and for the WF04
// escalation path (TIER-04; D-18..D-21).
// Plan 39-09 adds the cases for the Designer in agent-factory/workflows/14-ui-design-to-build.md and
// for Frontend/UI reading the Designer's tokens (TIER-05; D-23..D-26).
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

  it("WR-07: the Tech Lead writes the dev tasks before it scores, so the factors read a written dev plan", () => {
    expect(RUBRIC).toContain("The Tech Lead writes the dev tasks first, so the factors read a written dev plan.");
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
    // WR-14, re-review WR-05: the move note's fixed `Move:` line lives once, in Workflow 04 step 15,
    // and the role points at it rather than restating it.
    expect(section(TECH_LEAD, "Output")).not.toContain("Move:");
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
    // WR-12, re-review WR-05: the exit depends on the move, and Workflow 04 step 15 names it per move
    // (pinned in the WF04 describe below); the role points there instead of restating it.
    expect(section(TECH_LEAD, "Board moves")).toContain(
      "It owns the exit of a dev-raised `## Blocked`, per Workflow 04 step 15.",
    );
  });

  it("D-21: it never escalates twice, and stops for a named human once the options are used up", () => {
    const body = section(TECH_LEAD, "Hard limits");
    expect(body).toContain("Never escalate a ticket twice.");
    expect(body).toContain("After the options are used up, stop for a named human.");
    expect(body).toContain("Merge and deploy stay with humans.");
  });

  it("WR-07: Responsibilities write the dev tasks (item 2) before scoring them (item 3)", () => {
    const items = numbered(section(TECH_LEAD, "Responsibilities"));
    expect(items[1]?.n).toBe(2);
    expect(items[1]?.text.startsWith("Write the dev tasks")).toBe(true);
    expect(items[2]?.n).toBe(3);
    expect(items[2]?.text.startsWith("Score the dev tasks and the ticket per the rubric.")).toBe(true);
  });

  it("WR-15: the role reads Workflow 04 and holds a gate-failure ticket in `Blocked` for a named human", () => {
    expect(section(TECH_LEAD, "Reads")).toContain(
      "- `agent-factory/workflows/04-ticket-to-pr.md` steps 14-16, the path of a blocked ticket.",
    );
    const item5 = numbered(section(TECH_LEAD, "Responsibilities")).find((i) => i.n === 5)?.text ?? "";
    // WR-16, re-review WR-05: the role meets the human stops through Workflow 04 step 15, which holds
    // them once (pinned in the WF04 describe below), instead of restating the checkpoint conditions.
    expect(item5).toContain(
      "Follow Workflow 04 step 15 for the `Move:` line, the re-score rule and the named-human stops.",
    );
    expect(section(TECH_LEAD, "Board moves")).toContain("per Workflow 04 step 15");
  });

  it("WR-01: besides the one escalation the Tech Lead makes at most one other move, and a level-raising re-score is the escalation", () => {
    const item5 = numbered(section(TECH_LEAD, "Responsibilities")).find((i) => i.n === 5)?.text ?? "";
    expect(item5).toContain("Besides the escalation, make at most one other move per ticket.");
    // WR-13, re-review WR-05: the re-score rule lives once, in Workflow 04 step 15 (pinned in the
    // WF04 describe below); the role points there, and restates neither the rule nor its stops.
    expect(item5).toContain("Follow Workflow 04 step 15 for the `Move:` line, the re-score rule");
    expect(item5).not.toContain("one level only");
  });
});

describe("designer.md (TIER-05; D-23..D-27)", () => {
  it("D-27: core tier, the read edit shell capabilities, no skills value, and the role heading", () => {
    expect(DESIGNER.startsWith("---\nkind: role\ntier: core\ncapabilities: read edit shell\n---\n# Role: Designer\n")).toBe(true);
    expect(DESIGNER).not.toMatch(/^skills:/m);
    // T-39-21: never the coordinator-only `admit` capability, and no spawn grant.
    expect(DESIGNER).not.toMatch(/^capabilities:.*\badmit\b/m);
    expect(DESIGNER).not.toContain("Agent(");
  });

  it("CR-01, T-39-22: the generated adapter carries Bash to reach the sanctioned writer, and no spawn grant or MCP admission tool", () => {
    // Gap plan 39-11: Workflow 16 admits a note only through the sanctioned writer, which a nested
    // role session reaches through the shell. The tools line is the adapter generator's output for
    // `read edit shell`; no admission tool and no spawn grant ride along with it.
    const adapter = readFileSync(join(ROOT, ".claude/agents/grugops-designer.md"), "utf8");
    const tools = adapter.split("\n").find((l) => l.startsWith("tools:"));
    expect(tools, "the adapter has no tools: line").toBeDefined();
    expect(tools!.slice("tools:".length).trim()).toBe("Read, Grep, Glob, Edit, Write, Bash");
    expect(adapter).not.toContain("Agent(");
    expect(adapter).not.toContain("mcp__");
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

  it("WR-08: in a brownfield repo it reads the brownfield map and the shipped styles as its starting direction", () => {
    const body = section(DESIGNER, "Reads");
    expect(body).toContain("`memory-bank/brownfield-map.md`");
    expect(body).toContain("the starting direction, not a system to replace");
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

  it("D-18 / WR-04: a blocked engineer, or one whose gate ends `BLOCKED_NEEDS_FIX` after its bounded self-fix, publishes a `failed-attempt` note per WF04", () => {
    expect(levels()).toContain(
      "When you are blocked, or the gate ends `BLOCKED_NEEDS_FIX` after its bounded self-fix for an agent-fixable reason, publish a `failed-attempt` note per `agent-factory/workflows/04-ticket-to-pr.md`.",
    );
    // The old trigger wording disagreed with WF04 step 14 and the self-fix dial.
    expect(levels()).not.toContain("the gate fails a second time");
  });

  it("WR-02 / TIER-03: a junior also stops on every other rubric risk tag, F3 = 1 included", () => {
    expect(levels()).toContain(
      "So does a junior that meets any other risk tag the rubric lists: auth, money, PII, data writes, a public interface or config.",
    );
    expect(section(RUBRIC, "Junior exclusions")).toContain(
      "The F3 = 1 tags (data writes, public interface, config) also rule junior out, by mapping rule 4.",
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

  it("T-39-11 / WR-09: the run-time flattening paths are named, the mod hook among them with its source, and no enforcement is claimed", () => {
    expect(CONFIG).toContain("**A `model` or `effort` parameter on the spawn call.**");
    expect(CONFIG).toContain("**`CLAUDE_CODE_SUBAGENT_MODEL`.**");
    expect(CONFIG).toContain("**An `availableModels` restriction.**");
    expect(CONFIG).toContain(
      "- **An installed mod's `agent.spawn` hook.** \"If an installed mod sets a model in its `agent.spawn` hook, Claude Code uses that model in place of the per-invocation parameter\" (`code.claude.com/docs/en/sub-agents`, read 2026-10-30).",
    );
    expect(CONFIG).toContain("grugops does not enforce the level");
    // WR-09: the lead-in carries no count, so a fifth setting cannot make it wrong.
    const lead = CONFIG.split("\n").find((l) => l.startsWith("**What can flatten the levels at run time.**")) ?? "";
    expect(lead, "no flattening lead-in").not.toBe("");
    expect(lead).not.toMatch(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+) run-time settings?\b/i);
    expect(lead).toContain("the following run-time settings take precedence over it");
  });

  it("subagent.frontmatter.md carries no specialist or adapter count, and documents the level adapter's differing lines", () => {
    expect(PACKAGING).not.toMatch(/\b(16|sixteen) (of them|specialist|adapters)/i);
    expect(PACKAGING).toContain("### The level adapter");
    expect(PACKAGING).toContain("`name` is `grugops-<role>-<level>`.");
    expect(PACKAGING).toContain("ends with ` Level: <level>.` inside its quotes");
  });

  it("WR-03: a level adapter is routed only by the name the Tech Lead's plan gives, never for unscored work", () => {
    expect(PACKAGING).toContain("never for unscored work");
    for (const level of ["junior", "mid", "senior"]) {
      const name = `grugops-software-engineer-${level}`;
      const adapter = readFileSync(join(ROOT, ".claude/agents", `${name}.md`), "utf8");
      const description = adapter.split("\n").find((l) => l.startsWith("description:"));
      expect(description, `${name} has no description: line`).toBeDefined();
      expect(description).toContain("never for unscored work");
      expect(description).toContain(name);
    }
  });
});

describe("WF04 and the Orchestrator route each ticket through the Tech Lead (TIER-01; D-02, D-05, D-06, D-08, D-17, D-30)", () => {
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");
  const ORCH_PATH = join(ROOT, "agent-factory/roles/orchestrator.md");
  const ORCH = readFileSync(ORCH_PATH, "utf8");
  const PACKAGING = readFileSync(join(ROOT, "agent-factory/packaging/subagent.frontmatter.md"), "utf8");
  const steps = numbered(section(WF04, "Steps"));

  it("the steps are numbered 1..n with no gap", () => {
    expect(steps.length).toBeGreaterThan(3);
    expect(steps.map((s) => s.n)).toEqual(steps.map((_, i) => i + 1));
  });

  it("D-06: step 1 is still the Definition of Ready step", () => {
    expect(steps[0]?.text).toContain("Confirm the ticket against `agent-factory/checklists/definition-of-ready.md` (Orchestrator).");
  });

  it("D-02: the step right after the Definition of Ready step is the Tech Lead's, and it names complexity-rubric.md", () => {
    const step = steps[1]?.text ?? "";
    expect(step.startsWith("Assess the ticket per `agent-factory/checklists/complexity-rubric.md` (Tech Lead).")).toBe(true);
    expect(step).toContain("a `decision` note per Workflow 16");
    expect(step).toContain("`## Tech Lead plan` section into the ticket body");
  });

  it("WR-07: the Tech Lead step writes the dev tasks before it scores them", () => {
    expect(steps[1]?.text).toContain("Write the dev tasks first, then score them");
  });

  it("D-08: the pull into development waits for the plan note, after the Tech Lead step", () => {
    expect(steps[2]?.text).toContain("Pull the ticket into development once the plan note is published");
  });

  it("D-17 / T-39-14: the dispatch step spawns the named adapter as a non-fork sub-agent with no `model` or `effort` parameter", () => {
    const step = steps.find((s) => s.text.startsWith("Create one `pending/` subtask for the exact adapter"));
    expect(step, "no dispatch step").toBeDefined();
    const t = (step as { text: string }).text;
    expect(t).toContain("non-fork sub-agent");
    expect(t).toContain("Pass no `model` or `effort` parameter on the spawn call.");
    expect(t).toContain("Never re-decide the level.");
    expect(t).toContain("reads its level from `## Tech Lead plan`");
    // The dispatch comes right after the pull and right before the implementation step.
    const n = (step as { n: number }).n;
    expect(steps[n - 2]?.text).toContain("Pull the ticket into development");
    expect(steps[n]?.text.startsWith("Implement the one ticket on a branch")).toBe(true);
  });

  it("the flow, the agents and the inputs name the Tech Lead and the rubric", () => {
    expect(section(WF04, "When to use")).toContain("-> Tech Lead plan -> Software Engineer (named level) ->");
    expect(section(WF04, "Agents involved")).toContain("- Tech Lead — scores the ticket on the complexity rubric");
    expect(section(WF04, "Agents involved")).toContain("at the level the Tech Lead names");
    expect(section(WF04, "Inputs required")).toContain("- `agent-factory/checklists/complexity-rubric.md`");
  });

  it("D-08: the ticket stays in `Ready for Dev` while the Tech Lead plans", () => {
    const moves = section(WF04, "Board moves");
    expect(moves).toContain("The ticket stays in `Ready for Dev` while the Tech Lead plans.");
    expect(moves).toContain("only once the Tech Lead's plan note is published");
  });

  it("D-05 / D-06: the stop conditions send an undesigned approach to `In Design` and cover a file plan too large for one PR", () => {
    const stops = section(WF04, "Stop conditions");
    expect(stops).toContain("(F2 = 2) -> record the gap and send the ticket back to `In Design` for the Architect. Dispatch no engineer.");
    expect(stops).toContain("the Tech Lead's file plan is too large for one PR -> `SPLIT_REQUIRED`");
  });

  it("D-30: the Orchestrator routes plan, code and design system to the Tech Lead, the engineer and the Designer", () => {
    const routing = ORCH.slice(ORCH.indexOf("### Routing matrix"), ORCH.indexOf("### WIP gate"));
    expect(routing).toContain("plan -> Tech Lead");
    // WR-05: the Tech Lead route names a ready ticket's dev plan, so product planning keeps its BA/PM route.
    expect(routing).toContain("ready-ticket dev plan -> Tech Lead");
    expect(routing).toContain("code -> Software Engineer (level from Tech Lead)");
    expect(routing).toContain("design system -> Designer");
    // Every route the block carried before the rewrite is still there.
    for (const route of [
      "product clarity -> BA/PM",
      "flows/system rules -> System Analyst",
      "structure/tradeoffs -> Architect",
      "repo mapping -> Brownfield|Greenfield Mapper",
      "tests -> QE/E2E",
      "risk/security/compliance -> Security/NFR (+ Compliance Officer if regime set)",
      "business acceptance -> UAT Planner",
      "UI/frontend -> Frontend/UI",
      "release -> Release Manager (ent.)",
      "incident -> Incident Responder (ent.)",
      "sprint end/metrics dip -> Factory Coach (ent.)",
      "AGENTS.md -> AGENTS.md Scribe",
      "adapters installed -> Installer",
    ]) {
      expect(routing, route).toContain(route);
    }
  });

  it("D-30: orchestrator.md did not grow past its 7,359 bytes before plan 39-08", () => {
    expect(readFileSync(ORCH_PATH).byteLength).toBeLessThanOrEqual(7359);
  });

  it("the packaging specimen names no retired base engineer adapter", () => {
    expect(PACKAGING).not.toMatch(/grugops-software-engineer(?![-a-z])/);
  });
});

describe("WF04 escalation path (TIER-04; D-18, D-19, D-20, D-21)", () => {
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");
  const WF05 = readFileSync(join(ROOT, "agent-factory/workflows/05-pr-quality-gate.md"), "utf8");
  const steps = numbered(section(WF04, "Steps"));
  const stops = section(WF04, "Stop conditions").split("\n").filter((l) => l.startsWith("- "));
  const stepAt = (prefix: string) => {
    const s = steps.find((x) => x.text.startsWith(prefix));
    expect(s, `no step starting "${prefix}"`).toBeDefined();
    return s as { n: number; text: string };
  };

  it("D-18: the engineer records a `failed-attempt` note on `BLOCKED` or an agent-fixable `BLOCKED_NEEDS_FIX`, and moves the ticket to `Blocked` naming the Tech Lead", () => {
    const s = stepAt("Record a `failed-attempt` note per Workflow 16 when the engineer reports `BLOCKED` (Software Engineer).");
    expect(s.text).toContain("when the gate ends `BLOCKED_NEEDS_FIX` after its bounded self-fix, for an agent-fixable reason");
    expect(s.text).toContain("Move the ticket to the `Blocked` column.");
    expect(s.text).toContain("Add a `## Blocked` bullet naming the Tech Lead as the owner who clears it.");
    // Escalation comes after the gate and the QE steps.
    expect(s.n).toBeGreaterThan(stepAt("Assess the feature by trying to break it (QE/E2E).").n);
    expect(s.n).toBeGreaterThan(stepAt("Run the quality gate per").n);
  });

  it("T-39-16: a human-only gate failure never takes the escalation path", () => {
    const s = stepAt("Record a `failed-attempt` note");
    expect(s.text).toContain("A human-only gate failure (visual baseline, test integrity) never takes this path; Workflow 05 hands it to its human.");
  });

  it("D-19: the Tech Lead reads the note and picks one move, escalating one level at most once per ticket", () => {
    const s = stepAt("Read the `failed-attempt` note (Tech Lead).");
    expect(s.text).toContain("escalate one level at most once per ticket, re-plan and re-score, split, or return it to the Architect");
    expect(s.text).toContain("Record the move in a new `decision` note per Workflow 16.");
    expect(s.text).toContain("On an escalation or a re-plan, return the ticket to `Ready for Dev`.");
  });

  it("WR-01: one escalation and one other move per ticket, counted from the decision notes, then a named human", () => {
    const s = stepAt("Read the `failed-attempt` note (Tech Lead).");
    expect(s.text).toContain("Besides the escalation, make at most one other move per ticket.");
    expect(s.text).toContain("A re-score that raises the level is the escalation, and it moves the ticket one level only.");
    // Re-review WR-03: the two re-score stops follow `checkpoints.escalate_unadjudicable_result`, the
    // cell the used-up stop is tagged with, so the step and the tagged stop agree under every value,
    // and `notify` / `off` leave the Tech Lead a legal move.
    expect(s.text).toContain(
      "When the scores call for more than one level, or for a raise after the escalation is spent, read `checkpoints.escalate_unadjudicable_result`.",
    );
    expect(s.text).toContain("The used-up stop below follows the same value.");
    expect(s.text).toContain("At `block`, the default, stop for a named human.");
    expect(s.text).toContain("At `notify` or `off`, raise one level if the escalation is unspent; otherwise keep the level.");
    expect(s.text).toContain("Record the scored level in the move note.");
    expect(s.text).toContain("At `notify`, also record an `observation` per Workflow 16 that names the move note.");
    expect(s.text).not.toContain("Stop for a named human when the scores call for");
    // WR-14: a move note carries a fixed `Move:` line, and only those notes are counted.
    expect(s.text).toContain(
      "Count the earlier moves from the Tech Lead's `decision` notes for this ticket that carry a `Move:` line.",
    );
    expect(s.text).toContain("The plan note from step 2 carries none.");
    // Re-review WR-02: a move the human rejected is not counted against the Tech Lead's options.
    expect(s.text).toContain("Skip a move that a `Confirmed: no` finding names.");
    expect(s.text).toContain("Open its body with `Move: escalate`, `Move: re-plan`, `Move: split` or `Move: architect`.");
    expect(s.text).toContain("Mark a re-score that raises the level `Move: escalate`.");
    expect(s.text).not.toContain("Count the earlier moves from the ticket's `decision` notes.");
    const b = stops.filter((l) => l.startsWith("- The Tech Lead's options are used up ->"));
    expect(b).toHaveLength(1);
    expect(b[0]).toContain("the one escalation is spent");
    expect(b[0]).toContain("the one other move is spent too");
    expect(b[0]).toContain("It also means the scores call for more than one level, or for a raise after the escalation is spent.");
  });

  it("D-20: the re-enqueue is a new `pending/` subtask on the same context, and the spawn prompt carries only the task reference", () => {
    const s = stepAt("Create a new `pending/` subtask for the adapter the new note names (Orchestrator).");
    expect(s.text).toContain("Point its `ref:` at the same per-task context.");
    expect(s.text).toContain("Never re-pend a `done/` subtask.");
    expect(s.text).toContain("Spawn the adapter as step 4 does.");
    expect(steps[3]?.text).toContain("non-fork sub-agent");
    expect(s.text).toContain("The spawn prompt carries the task reference and nothing else.");
    expect(s.n).toBe(stepAt("Read the `failed-attempt` note (Tech Lead).").n + 1);
  });

  it("D-18 / D-19: a `BLOCKED` engineer stops for the Tech Lead with no checkpoint tag", () => {
    const b = stops.filter((l) => l.startsWith("- The engineer reports `BLOCKED` ->"));
    expect(b).toHaveLength(1);
    expect(b[0]).toContain("naming the Tech Lead as its owner");
    expect(b[0]).not.toMatch(/checkpoint/i);
  });

  it("T-39-16: the gate-failure stop keeps the WF05 human stop, tagged `exhaust_self_fix_budget`", () => {
    const b = stops.filter((l) => l.startsWith("- The gate ends `BLOCKED_NEEDS_FIX`"));
    expect(b).toHaveLength(1);
    // Plan 39-12 (CR-02): the human stop is named in step 15 too, and the WF05 reference is accurate.
    expect(b[0]).toContain("A named human confirms the Tech Lead's decision before the re-enqueue (step 15).");
    expect(b[0]).toContain("Workflow 05 sets this human stop when the self-fix budget is spent.");
    expect(WF04).not.toContain("before the re-enqueue, per Workflow 05");
    expect(b[0]?.endsWith("`checkpoint: exhaust_self_fix_budget`")).toBe(true);
    expect(WF04.split("checkpoint: exhaust_self_fix_budget").length - 1).toBe(1);
    // The WF05 stop is still there, unchanged in count.
    expect(WF05.split("checkpoint: exhaust_self_fix_budget").length - 1).toBe(1);
  });

  it("CR-02: after a gate failure the numbered steps stop for a named human before any re-enqueue", () => {
    const s15 = stepAt("Read the `failed-attempt` note (Tech Lead).").text;
    // WR-16: the stop follows the `exhaust_self_fix_budget` value; `block` is the default.
    expect(s15).toContain(
      "After a gate `BLOCKED_NEEDS_FIX`, read `checkpoints.exhaust_self_fix_budget`, the value the gate-failure stop below follows.",
    );
    // Re-review WR-04: `notify` proceeds and is recorded; only `off` proceeds silently.
    expect(s15).toContain(
      "At `notify`, make the move and record an `observation` per Workflow 16 that names the move note.",
    );
    expect(s15).toContain("At `off`, make the move without that human.");
    expect(s15).not.toContain("At `notify` or `off`, make the move without that human.");
    const stop = s15.indexOf("At `block`, the default, stop until a named human confirms the move.");
    expect(stop).toBeGreaterThanOrEqual(0);
    expect(stop).toBeLessThan(s15.indexOf("On an escalation or a re-plan, return the ticket to `Ready for Dev`."));
    const s16 = stepAt("Create a new `pending/` subtask for the adapter the new note names (Orchestrator).").text;
    // WR-15, re-review WR-02: the human's answer is a published `human:<name>` finding that says yes
    // or no, and step 16 waits only for a yes, so a recorded rejection never releases the re-enqueue.
    expect(s16).toContain("After a gate failure at `block`, wait also for a `Confirmed: yes` finding that names the move note.");
    expect(s16).not.toContain("wait also for the `human:<name>` finding");
    expect(s15).toContain("Leave the ticket in `Blocked` until then.");
    // WR-01 (iteration 2): the step names who writes the finding and the limit, and says honestly
    // that admission checks the stamp only at `context.human_admission: all`.
    expect(s15).toContain("Once the named human answers, the Tech Lead records the answer as a `finding` per Workflow 16.");
    expect(s15).toContain("Open its body with `Confirmed: yes` or `Confirmed: no`.");
    expect(s15).toContain("A `Confirmed: no` move is neither carried out nor counted.");
    expect(s15).toContain("Record a new move, or stop for a named human once the options are used up.");
    expect(s15).toContain("Stamp it `human:<name>`, with the move note's id among its refs.");
    expect(s15).toContain("Never write that stamp without the human's answer.");
    expect(s15).toContain(
      "Only at `context.human_admission: all` does admission check that stamp, and only Claude Code binds it to the human's session grant.",
    );
    expect(s15).toContain("At the default `off` it is a prose-tier record.");
    // The human stop stays tagged only in `## Stop conditions`; no step carries a checkpoint tag.
    expect(section(WF04, "Steps")).not.toContain("checkpoint:");
    // Workflow 05's own stop is unchanged.
    expect(WF05).toContain("Stop and hand to a human. `checkpoint: exhaust_self_fix_budget`");
  });

  it("D-21 / T-39-15: once the options are used up a named human takes the ticket, never a retry loop", () => {
    const b = stops.filter((l) => l.startsWith("- The Tech Lead's options are used up ->"));
    expect(b).toHaveLength(1);
    expect(b[0]).toContain("stop and hand the ticket to a named human; never retry in a loop.");
    expect(b[0]).toContain("the one escalation is spent");
    expect(b[0]?.endsWith("`checkpoint: escalate_unadjudicable_result`")).toBe(true);
    expect(WF04.split("checkpoint: escalate_unadjudicable_result").length - 1).toBe(1);
  });

  it("the board moves name the escalation's `Blocked` move and the Tech Lead's exit", () => {
    expect(section(WF04, "Board moves")).toContain(
      "On an escalation the Software Engineer moves the ticket to `Blocked`, and the Tech Lead owns its exit back to `Ready for Dev`.",
    );
    expect(section(WF04, "Board moves")).toContain(
      "After a split that exit is `Backlog`, and after an Architect pass it is `In Design`.",
    );
  });

  it("WR-12: a split or an Architect pass leaves `Ready for Dev` alone and re-enqueues no engineer", () => {
    const s15 = stepAt("Read the `failed-attempt` note (Tech Lead).").text;
    expect(s15).not.toContain("Return the ticket to `Ready for Dev`.");
    expect(s15).toContain("On a split, move it to `Backlog` for BA/PM.");
    expect(s15).toContain("On an Architect pass, move it to `In Design`.");
    const s16 = stepAt("Create a new `pending/` subtask for the adapter the new note names (Orchestrator).").text;
    expect(s16).toContain("Create it only after an escalation or a re-plan.");
    expect(s16).toContain("A split or an Architect pass dispatches no engineer.");
  });
});

describe("WF14 runs the Designer before Frontend/UI, and Frontend/UI reads the Designer's tokens (TIER-05; D-23..D-26)", () => {
  const WF14 = readFileSync(join(ROOT, "agent-factory/workflows/14-ui-design-to-build.md"), "utf8");
  const FRONTEND = readFileSync(join(ROOT, "agent-factory/roles/frontend-ui.md"), "utf8");
  const steps = numbered(section(WF14, "Steps"));
  const designerStep = steps.find((s) => s.text.startsWith("Establish the design system once per product (Designer)."));
  const contractStep = steps.find((s) => s.text.startsWith("Draft the UI/design contract"));

  it("the steps are numbered 1..n with no gap", () => {
    expect(steps.length).toBeGreaterThan(3);
    expect(steps.map((s) => s.n)).toEqual(steps.map((_, i) => i + 1));
  });

  it("D-23: the Designer step comes first, right before the Frontend/UI contract step", () => {
    expect(designerStep, "no Designer step").toBeDefined();
    expect(contractStep, "no contract step").toBeDefined();
    expect(designerStep?.n).toBe(1);
    expect(contractStep?.text).toContain("(Frontend/UI)");
    expect(contractStep?.n).toBe((designerStep?.n ?? 0) + 1);
  });

  it("D-25: the Designer step names the first-UI-work cadence, the empty case and the new-direction re-run", () => {
    const t = designerStep?.text ?? "";
    expect(t).toContain("Run this step on the first UI work in a repo.");
    expect(t).toContain("That includes any UI ticket that arrives with no published guidelines.");
    expect(t).toContain("Re-run it for a UI epic only when the epic needs a new direction.");
    expect(t).toContain("Per-ticket UI work skips this step and reads the existing guidelines.");
  });

  it("D-24 / ordering edge: the guidelines are typed notes, and a newer decision supersedes an older one", () => {
    const t = designerStep?.text ?? "";
    expect(t).toContain("Record the guidelines as typed `decision` and `artifact-ref` notes per Workflow 16.");
    expect(t).toContain("A newer Designer decision supersedes an older one through its `supersedes` field, per Workflow 16.");
    expect(WF14).not.toMatch(/memory-bank\/[^\s`]*design/i);
  });

  it("D-26: the contract step reads the tokens from the Designer's notes and keeps the per-ticket work with Frontend/UI", () => {
    const t = contractStep?.text ?? "";
    expect(t).toContain("Read the design tokens (palette, type scale, spacing) from the Designer's published notes.");
    expect(t).toContain("Never name a new token.");
    expect(t).toContain("The contract names the component inventory.");
    expect(t).toContain("five states");
    expect(t).toContain("WCAG 2.2 AA");
    expect(t).toContain("visual-baseline");
    expect(WF14).not.toContain("names the design tokens");
  });

  it("the flow, the agents, the inputs and the board moves name the Designer", () => {
    expect(section(WF14, "When to use")).toContain("product context -> Designer design system (once per product) -> Frontend/UI design contract");
    const agents = section(WF14, "Agents involved").split("\n").filter((l) => l.startsWith("- "));
    expect(agents[0]?.startsWith("- Designer — sets the product-wide design system")).toBe(true);
    expect(section(WF14, "Inputs required")).toContain("- The Designer's published guidelines, read per Workflow 16 as `decision` and `artifact-ref` notes.");
    expect(section(WF14, "Board moves")).toContain("The Designer causes no board transition either.");
  });

  it("D-26: frontend-ui.md reads the Designer's tokens and never tells the role to name them", () => {
    expect(FRONTEND).not.toContain("Name the design tokens");
    expect(section(FRONTEND, "Reads")).toContain("- The Designer's published guidelines (pulled per Workflow 16)");
    const r2 = numbered(section(FRONTEND, "Responsibilities"))[1]?.text ?? "";
    expect(r2.startsWith("Read the design tokens (palette, type scale, spacing) from the Designer's published notes; never name new ones.")).toBe(true);
    expect(r2).toContain("Name the component inventory");
    expect(section(FRONTEND, "Output")).toContain("the token references read from the Designer's notes");
  });

  it("D-26 / T-39-17: a token the guidelines lack stops for a Designer decision, untagged, and Frontend/UI never invents one", () => {
    const stops = section(WF14, "Stop conditions").split("\n").filter((l) => l.startsWith("- "));
    const b = stops.filter((l) => l.startsWith("- A ticket needs a token the Designer's guidelines lack →"));
    expect(b).toHaveLength(1);
    expect(b[0]).toContain("stop and send it to the Designer for a recorded decision.");
    expect(b[0]).toContain("Frontend/UI never invents a token.");
    // It hands to a role, not a human, so it carries no checkpoint tag.
    expect(b[0]).not.toMatch(/checkpoint/i);
    expect(WF14.split("invents a token").length - 1).toBe(1);
  });

  it("D-26: the done condition says the contract reads its tokens from the Designer's guidelines", () => {
    expect(section(WF14, "Done condition")).toContain("The contract reads its tokens from the Designer's guidelines.");
  });
});

describe("install/README.md documents the engineer level adapters and the stale-adapter report (TIER-03, TIER-06; D-5, D-13, D-17, D-22)", () => {
  const README = readFileSync(join(ROOT, "install/README.md"), "utf8");

  it("D-22: names the Claude Code v2.1.293 floor, the Haiku 4.5 effort `UNKNOWN - verify`, and that --check does not probe the version", () => {
    expect(README).toContain("v2.1.293");
    expect(README).toContain("Haiku 4.5");
    expect(README).toContain("`install.js --check` does not probe the\nClaude Code version yet");
  });

  it("D-5 / D-17: the level adapters are Claude Code only, and the level is scope guidance with no model advice elsewhere", () => {
    expect(README).toContain("### The engineer level adapters (Claude Code only)");
    expect(README).toContain("the level in the ticket is scope guidance");
    expect(README).toContain("grugops gives no model advice for those hosts");
  });

  it("names the run-time paths that flatten the levels", () => {
    expect(README).toContain("CLAUDE_CODE_SUBAGENT_MODEL");
    expect(README).toContain("CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1");
    expect(README).toContain("`agent.spawn` hook");
    expect(README).toContain("`availableModels` restriction");
  });

  it("WR-09: the flattening paragraph names the settings and points to factory.config.md for how each works", () => {
    const para = README.slice(README.indexOf("**What can flatten the levels at run time.**"));
    expect(README.indexOf("**What can flatten the levels at run time.**")).toBeGreaterThanOrEqual(0);
    const body = para.slice(0, para.indexOf("\n\n"));
    expect(body).toContain("`agent-factory/config/factory.config.md` (§ `models.effort` sub-fields)");
    expect(body).toContain("no grugops gate sees any of them");
    expect(body).toContain("`/tasks`");
    // The precedence detail lives once, in factory.config.md.
    expect(README).not.toContain("per-invocation");
  });

  it("D-13: documents the stale-adapter report and its remedy", () => {
    expect(README).toContain("no longer ships");
    expect(README).toContain("Install never deletes, renames or rewrites such a file.");
  });

  it("WR-06: a repository the install ledger cannot vouch for gets a `note` for each unshipped adapter, and §6 names both report forms", () => {
    expect(README).toContain("v2.1 or earlier");
    expect(README).toContain("print a `note` instead");
    // The exit-code sentence is pinned in two halves that meet at "the exit", so no literal here
    // spells the second ticket key word: a test file that names both ticket keys is counted as a
    // second ticket-frontmatter reader by validate.test.ts (the 32.1-04 reword precedent).
    expect(README).toContain("The note comes back on every run until the file is gone, and\nthe exit");
    expect(README).toContain("does not change. Check each named file by hand.");
    // WR-11: the README says what each mode prints over a marker the ledger cannot answer from. A
    // malformed ledger is refused by install and `--dry-run` with no note; only `--check` notes.
    expect(README).not.toContain("absent or cannot be\nread");
    expect(README).toContain("Two marker states print no note from install.");
    expect(README).toContain("`install.js --check` reports the malformed\nledger as a `FAIL` and still prints the note.");
    expect(README).toContain("install and `install.js --check` both stop at the marker and print no note.");
    expect(README).toContain("install names\nit in a `verify` line (exit `3`) and `--check` in a `FAIL`; otherwise both name it in a `note`.");
  });

  it("carries no hand-typed specialist count", () => {
    expect(README).not.toMatch(/\b16 specialist/i);
  });
});

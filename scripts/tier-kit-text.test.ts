// tier-kit-text.test.ts — text assertions over the kit prose Phase 39 writes.
//
// Plan 39-05 adds the cases for agent-factory/checklists/complexity-rubric.md (TIER-01, TIER-03,
// D-11, D-31) and agent-factory/roles/tech-lead.md (TIER-01; D-04..D-07, D-10, D-17, D-19, D-21).
// Later Phase 39 plans add the Designer, the engineer `## Levels` section, WF04 and WF14.
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
const CHECKLIST_INDEX = readFileSync(join(ROOT, "agent-factory/checklists/00-index.md"), "utf8");

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

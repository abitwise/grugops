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
// Plan 39-19 (G-39-71, D-21 amended) adds the cases for the Workflow 04 hand-off loop: a blocked
// ticket the Tech Lead cannot resolve goes to the role whose job covers its cause, and a named human
// is asked only after three disputed rounds on one cause or for a fundamental change.
// Plan 40-02 adds the cases for the engineer's plain rewrite: the section order, `## Do less`, the
// `shortcut:` marker and `Not checked:` line in `## Output`, the two board moves and `## Stop when`
// (PLAIN-02, PLAIN-05; D-08, D-10, D-12, D-20..D-24, D-33).
// Plan 40-13 adds the cases for the Orchestrator's lean close: it needs the named human's sign-off
// and a human merge, the lean Definition of Done needs the merge, and lean mode has one owner for
// the `In UAT` exit across uat-planner.md and Workflow 06 (PLAIN-02, PLAIN-03; CR-02, WR-02, D-33).
// Plan 40-17 adds the cases for the dial-following lean close: the close and its Stop-when hold
// are pinned as exact sentences, Workflow 06 says the lean close stops at the same `sign_off_acceptance`
// checkpoint and that the dial never removes the human merge (PLAIN-03; WR-01, WR-03; human decision
// 2026-11-02). Its mutation cases apply the reviewer's own edit, and each single dropped condition,
// to an in-memory copy of orchestrator.md and require leanCloseViolations() to go red (WR-01).
// Plan 40-23 pins the lean close and its hold to the named human's sign-off (WR-08, decision 4) and holds the UAT
// Planner's unconditional sign-off and Workflow 06's dial paragraph to the same rule (WR-09, decision 2; human decisions
// 2026-11-03).
//
// Each case reads the shipped file and asserts a stated phrase or an ordering. The cases are about
// the WORDS an agent reads: the junior gate and its exclusions are enforced in text (D-31), so the
// text is what this file pins.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const RUBRIC_PATH = "agent-factory/checklists/complexity-rubric.md";
const RUBRIC = readFileSync(join(ROOT, RUBRIC_PATH), "utf8");
const TECH_LEAD = readFileSync(join(ROOT, "agent-factory/roles/tech-lead.md"), "utf8");
const DESIGNER = readFileSync(join(ROOT, "agent-factory/roles/designer.md"), "utf8");
const CHECKLIST_INDEX = readFileSync(join(ROOT, "agent-factory/checklists/00-index.md"), "utf8");
const ENGINEER = readFileSync(join(ROOT, "agent-factory/roles/software-engineer.md"), "utf8");
const ORCHESTRATOR = readFileSync(join(ROOT, "agent-factory/roles/orchestrator.md"), "utf8");
const LEAN_DOD = readFileSync(join(ROOT, "agent-factory/checklists/definition-of-done.md"), "utf8");
const SEED_BOARD = readFileSync(join(ROOT, "agent-factory/seed/memory-bank/plans/board.md"), "utf8");
const UAT_PLANNER = readFileSync(join(ROOT, "agent-factory/roles/uat-planner.md"), "utf8");
const WF06 = readFileSync(join(ROOT, "agent-factory/workflows/06-uat-pack.md"), "utf8");

/**
 * Plans 40-17 and 40-23 (WR-01, WR-03, WR-08): the exact sentence that states the Orchestrator's lean
 * close, and the exact `## Stop when` item that holds the ticket until that close may happen. The
 * sign-off is the named human's at every dial value, and the human merge is required too; neither
 * condition follows the dial (human decision 4, 2026-11-03). Dropping either condition breaks the match.
 */
const CLOSE_SENTENCE =
  "Close only after the named human signed off acceptance, a human merged the PR and `agent-factory/checklists/definition-of-done.md` holds.";
const HOLD_ITEM =
  "- If a human has not merged the PR or the named human has not signed off acceptance, leave the ticket in `In UAT`.";

/** Plan 40-17's close sentence and hold item, which WR-08 retired; the mutation cases keep them red. */
const PLAN_40_17_CLOSE =
  "Close only after the sign-off that `checkpoint: sign_off_acceptance` requires, a human merged the PR and `agent-factory/checklists/definition-of-done.md` holds.";
const PLAN_40_17_HOLD = "- If a human has not merged the PR or `sign_off_acceptance` is not met, leave the ticket in `In UAT`.";

/** Plan 40-23 (WR-09, human decision 2, 2026-11-03): Workflow 06's dial paragraph sentences. */
const WF06_SIGN_OFF =
  "The `In UAT -> Ready to Release` move waits for the named human's sign-off at every value of `sign_off_acceptance`.";
const WF06_LEAN_CLOSE = "In lean mode, the Orchestrator's close to `Done` waits for the same sign-off.";
const WF06_DIAL =
  "The dial governs only how the Orchestrator records the lean close, and it never removes the human merge or the named human's sign-off.";

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

/**
 * Plan 40-17 (WR-01): what is wrong with a text's lean close. "close" when the `## Board moves` line
 * holding "`In UAT → Done`" does not carry CLOSE_SENTENCE exactly once; "hold" when the `## Stop when`
 * list items do not carry HOLD_ITEM exactly once. A correct Orchestrator gives [].
 */
function leanCloseViolations(text: string): string[] {
  const out: string[] = [];
  const closeLines = section(text, "Board moves")
    .split("\n")
    .filter((l) => l.includes("`In UAT → Done`"));
  if (closeLines.length !== 1 || occurrences(closeLines[0] ?? "", CLOSE_SENTENCE) !== 1) out.push("close");
  const holds = section(text, "Stop when")
    .split("\n")
    .filter((l) => l === HOLD_ITEM);
  if (holds.length !== 1) out.push("hold");
  return out;
}

/**
 * The numbered list items of a section, in order, with their numbers.
 *
 * Plan 39-16 (G-39-7): an indented, non-blank line right after a numbered line belongs to that item
 * (Workflow 04 step 15 carries its parts as indented sub-bullets). Each such line is appended to the
 * item's text with its leading whitespace and one leading `- ` marker removed, joined by a single
 * space, so a case reading the step sees every sentence. A blank line, the next numbered line or a
 * line with no leading whitespace ends the fold.
 */
function numbered(body: string): { n: number; text: string }[] {
  const items: { n: number; text: string }[] = [];
  let open = false;
  for (const l of body.split("\n")) {
    const m = /^(\d+)\. (.*)$/.exec(l);
    if (m !== null) {
      items.push({ n: Number(m[1]), text: m[2] as string });
      open = true;
    } else if (open && /^[ \t]+\S/.test(l)) {
      const last = items[items.length - 1] as { n: number; text: string };
      last.text = `${last.text} ${l.replace(/^[ \t]+/, "").replace(/^- /, "")}`;
    } else {
      open = false;
    }
  }
  return items;
}

/** The opening of Workflow 04 step 15's ask-once sub-bullet (plan 41-02, D-21). */
const ASK = "Apply the ask-once rule at every human stop.";

/**
 * Workflow 04 step 15's sub-bullets, in order, from the lines of `## Steps`.
 *
 * Plan 41-02: a line with six leading spaces belongs to the sub-bullet above it (the stop precedence
 * carries its order as a numbered list). It folds into that item, joined by one space with the leading
 * spaces removed, the same text `numbered()` gives. Any other line ends the walk.
 */
function step15Subs(lines: readonly string[]): string[] {
  const subs: string[] = [];
  for (let i = lines.findIndex((l) => l.startsWith("15. ")) + 1; i < lines.length; i++) {
    const l = lines[i] as string;
    if (l.startsWith("    - ")) subs.push(l.slice("    - ".length));
    else if (l.startsWith("      ") && subs.length > 0) subs[subs.length - 1] += ` ${l.trimStart()}`;
    else break;
  }
  return subs;
}

/**
 * The Tech Lead's dev-raised-block item, found by its opening words. Plan 40-03 (D-20) inserted the
 * scope-first item, so the block item no longer sits at a fixed number.
 */
function blockedItem(): string {
  const item = numbered(section(TECH_LEAD, "Responsibilities")).find((i) =>
    i.text.startsWith("On a ticket the engineer moved to `## Blocked`"),
  );
  expect(item, "no dev-raised-block item in tech-lead.md `## Responsibilities`").toBeDefined();
  return (item as { n: number; text: string }).text;
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
      // Plan 40-03 (D-14, WP-03): the 27-word sentence split in two; every named part survives.
      "A `decision` note per Workflow 16: the six factor scores with the fact behind each, the sum, the level and the dev tasks.",
    );
    expect(body).toContain("It names the adapter `grugops-software-engineer-<level>`.");
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
    // Plan 40-03 (D-11, D-33): second person, and the F2 = 2 return is the declared pair as a code span.
    expect(body).toContain("The ticket stays in `Ready for Dev` while you plan.");
    expect(body).toContain("You own `Ready for Dev → In Design` at F2 = 2.");
  });

  it("D-19: it owns the exit of a dev-raised `## Blocked` and records one of the four moves in a new decision note", () => {
    const resp = section(TECH_LEAD, "Responsibilities");
    // Plan 40-03 (D-14, WP-02): the 41-word sentence split; the four moves are listed once, in
    // Workflow 04 step 15, and the once-per-ticket escalation limit is the `## Stop when` stop.
    expect(resp).toContain("On a ticket the engineer moved to `## Blocked`, read its `failed-attempt` note.");
    expect(resp).toContain("Record one move in a new decision note.");
    expect(readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8")).toContain(
      "Choose one: escalate one level at most once per ticket, re-plan and re-score, split, or return it to the Architect.",
    );
    // WR-12, re-review WR-05: the exit depends on the move, and Workflow 04 step 15 names it per move
    // (pinned in the WF04 describe below); the role points there instead of restating it.
    // Plan 40-03 (D-33): the three exits are the declared `Blocked →` pairs, as code spans.
    expect(section(TECH_LEAD, "Board moves")).toContain(
      "You own the exit of a dev-raised `## Blocked`, per Workflow 04 step 15: `Blocked → Ready for Dev`, `Blocked → Backlog` or `Blocked → In Design`.",
    );
  });

  it("D-21 amended: a second escalation stops for a named human, a used-up ticket goes to the resolving role, and three disputed rounds stop for a named human", () => {
    // Plan 40-03 (D-10): the stops moved from `## Hard limits` to `## Stop when`, byte-exact; merge
    // and deploy stay a hard limit.
    const body = section(TECH_LEAD, "Stop when");
    // G-39-71 (plan 39-19): a human may name a second escalation at the human stop, so the limit is
    // on the Tech Lead's own moves.
    // Quick 261031-rhv R4 (Olger Oeselg, 2026-10-31): a raise past the spent escalation applies the
    // human stop, so the Tech Lead stops for a named human before a second escalation.
    expect(body).toContain("Stop the same way before a second escalation.");
    // Plan 39-18 (WR-01) made the used-up limit follow the tagged cell. G-39-71 (plan 39-19, D-21
    // amended): the hand-off runs under every value; the cell decides only the final human stop.
    for (const sentence of [
      "After the options are used up, hand the ticket to the role whose job covers its cause.",
      "Stop for a named human after three disputed rounds, or when the fix changes a requirement or a rule fundamentally.",
      // Quick 261031-oxi defect 5 (Olger Oeselg, 2026-10-31): the park lasts until a human answers.
      "At `notify` or `off`, leave it in `Blocked` with no move until a human answers.",
    ]) {
      expect(body).toContain(sentence);
    }
    expect(section(TECH_LEAD, "Hard limits")).toContain("Merge and deploy stay with humans.");
    for (const sentence of [
      "Stop the same way before a second escalation.",
      "After the options are used up, hand the ticket to the role whose job covers its cause.",
      "Stop for a named human after three disputed rounds",
    ]) {
      expect(section(TECH_LEAD, "Hard limits"), `the stop "${sentence}" is stated twice`).not.toContain(sentence);
    }
  });

  it("WR-07: Responsibilities scope the change, then write the dev tasks, then score them (plan 40-03 order)", () => {
    // Plan 40-03 (D-20): the scope-first item sits before "Write the dev tasks", so the case asserts the
    // order of the three items by their text rather than by fixed indices.
    const items = numbered(section(TECH_LEAD, "Responsibilities"));
    const at = (prefix: string) => items.findIndex((i) => i.text.startsWith(prefix));
    const scope = at("Write down every place the change reaches");
    const write = at("Write the dev tasks");
    const score = at("Score the dev tasks and the ticket per the rubric.");
    expect(scope, "no scope-first item").toBeGreaterThanOrEqual(0);
    expect(write).toBe(scope + 1);
    expect(score).toBe(write + 1);
  });

  it("WR-15: the role reads Workflow 04 and holds a gate-failure ticket in `Blocked` for a named human", () => {
    // G-39-71 (plan 39-19): the blocked-ticket path now ends at step 17, the receiving role's answer.
    expect(section(TECH_LEAD, "Reads")).toContain(
      "- `agent-factory/workflows/04-ticket-to-pr.md` steps 14-17, the path of a blocked ticket.",
    );
    const item5 = blockedItem();
    // WR-16, re-review WR-05: the role meets the human stops through Workflow 04 step 15, which holds
    // them once (pinned in the WF04 describe below), instead of restating the checkpoint conditions.
    // G-39-71 (plan 39-19): the re-score rule became the hand-off.
    expect(item5).toContain(
      "Follow Workflow 04 step 15 for the `Move:` line, the hand-off and the named-human stops.",
    );
    expect(section(TECH_LEAD, "Board moves")).toContain("per Workflow 04 step 15");
  });

  it("WR-01: besides the one escalation the Tech Lead makes at most one other move, and a level-raising re-score is the escalation", () => {
    const item5 = blockedItem();
    expect(item5).toContain("Besides the escalation, make at most one other move per ticket.");
    // WR-13, re-review WR-05: the re-score rule lives once, in Workflow 04 step 15 (pinned in the
    // WF04 describe below); the role points there, and restates neither the rule nor its stops.
    // G-39-71 (plan 39-19): the pointer names the hand-off.
    expect(item5).toContain("Follow Workflow 04 step 15 for the `Move:` line, the hand-off");
    expect(item5).not.toContain("one level only");
  });
});

describe("tech-lead.md plain conform (PLAIN-05; D-10, D-18, D-20, D-33, D-36)", () => {
  it("D-20: scope-first names every place the change reaches, the dropped options and the never-cut floor", () => {
    const item = numbered(section(TECH_LEAD, "Responsibilities")).find((i) =>
      i.text.startsWith("Write down every place the change reaches"),
    )?.text ?? "";
    expect(item).toContain("Write down every place the change reaches: callers, tests, fixtures, config, exports.");
    expect(item).toContain("Name each option nobody asked for as dropped.");
    expect(item).toContain(
      "Write the never-cut floor: trust-boundary validation, error handling that prevents data loss, security, accessibility, anything the user asked for.",
    );
  });

  it("D-20: the `## Tech Lead plan` section records the scope, the dropped options and the floor", () => {
    const body = section(TECH_LEAD, "Output");
    expect(body).toContain(
      "A short `## Tech Lead plan` section in the ticket body: level, adapter, sum and note id. It also records the scope, the dropped options and the floor.",
    );
  });

  it("D-36: `## Hard limits` keeps the no-fabrication sentence and marks an unmeasurable factor `UNKNOWN - verify`", () => {
    const limits = section(TECH_LEAD, "Hard limits");
    expect(limits).toContain("never fabricate a score");
    expect(limits).toContain("Mark an unmeasurable factor `UNKNOWN - verify`, scored per the rubric.");
    expect(RUBRIC).toContain("A factor the Tech Lead cannot measure is recorded `UNKNOWN - verify` and scored 2.");
  });

  it("D-33: `## Board moves` names exactly the four declared exception pairs", () => {
    const pairs = [...section(TECH_LEAD, "Board moves").matchAll(/`([^`]+ → [^`]+)`/g)].map((m) => m[1]);
    expect(pairs).toEqual(["Ready for Dev → In Design", "Blocked → Ready for Dev", "Blocked → Backlog", "Blocked → In Design"]);
  });

  it("D-10: `## Stop when` follows `## Hard limits`, closes the file, and ends with the done stop", () => {
    const headings = TECH_LEAD.split("\n").filter((l) => l.startsWith("## "));
    expect(headings).toEqual([
      "## One job",
      "## Activates when",
      "## Reads",
      "## Responsibilities",
      "## Output",
      "## Board moves",
      "## Trace updates",
      "## Hard limits",
      "## Stop when",
    ]);
    expect(section(TECH_LEAD, "Stop when")).toContain(
      "- When the level is named, stop done and hand the ticket to the Orchestrator.",
    );
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

describe("designer.md and frontend-ui.md plain rewrite (PLAIN-02; D-10, D-13, D-18, D-33)", () => {
  const FRONTEND_UI = readFileSync(join(ROOT, "agent-factory/roles/frontend-ui.md"), "utf8");
  const ORDER = [
    "## One job",
    "## Activates when",
    "## Reads",
    "## Responsibilities",
    "## Output",
    "## Board moves",
    "## Trace updates",
    "## Hard limits",
    "## Stop when",
  ];

  it("both roles use the reference section order with bare headings", () => {
    for (const [name, text] of [["designer.md", DESIGNER], ["frontend-ui.md", FRONTEND_UI]] as const) {
      expect(text.split("\n").filter((l) => l.startsWith("## ")), name).toEqual(ORDER);
    }
  });

  it("D-33: neither role claims a board pair", () => {
    for (const [name, text] of [["designer.md", DESIGNER], ["frontend-ui.md", FRONTEND_UI]] as const) {
      expect(section(text, "Board moves"), `${name} claims a pair`).not.toContain(" → ");
    }
    expect(section(FRONTEND_UI, "Board moves")).toContain(
      "You own no board move: you write the contract at the design step, before `In Development`.",
    );
  });

  it("D-13: the Designer drops the coding-rules line and Frontend/UI keeps it", () => {
    expect(DESIGNER).not.toContain("12 coding rules");
    expect(FRONTEND_UI).toContain("Follow the 12 coding rules in `AGENTS.md`.");
  });

  it("D-10: each role states when it stops, and Frontend/UI returns a ticket with no guidelines for the Designer", () => {
    expect(section(DESIGNER, "Stop when")).toContain(
      "- When a design decision changes the architecture, report `BLOCKED` and hand it to the Architect.",
    );
    expect(section(FRONTEND_UI, "Stop when")).toContain(
      "- When the Designer's guidelines are missing or lack a token, report `BLOCKED` and return the ticket to the Orchestrator for the Designer.",
    );
  });

  it("D-05: the moved detail lives in Workflow 14 steps 1 and 2", () => {
    const wf14 = readFileSync(join(ROOT, "agent-factory/workflows/14-ui-design-to-build.md"), "utf8");
    expect(section(DESIGNER, "Responsibilities")).toContain("4. Name the generated-design tells to avoid, per Workflow 14 step 1.");
    expect(wf14).toContain("Name the generated-design tells to avoid, such as stock gradients, uniform card grids and filler copy.");
    expect(section(FRONTEND_UI, "Output")).toContain("every part Workflow 14 step 2 names");
    expect(wf14).toContain("It names the responsive and performance budget and the verification owner too.");
  });
});

describe("pr-review-checklist.md lean lens (PLAIN-06; D-25)", () => {
  const CHECKLIST = readFileSync(join(ROOT, "agent-factory/checklists/pr-review-checklist.md"), "utf8");
  const lens = (): string => section(CHECKLIST, "Lean lens (advisory)");

  it("keeps the lean-tier frontmatter and carries the advisory lens heading once", () => {
    expect(CHECKLIST.startsWith("---\nkind: checklist\ntier: lean\n---\n# PR Review Checklist\n")).toBe(true);
    expect(CHECKLIST.split("\n").filter((l) => l === "## Lean lens (advisory)")).toHaveLength(1);
  });

  it("reviews correctness, safety and tests before lean, and never blocks a PR on its own", () => {
    expect(lens()).toContain("- Review correctness, safety and tests first; apply the lean lens last.");
    expect(lens()).toContain("- The lens is advisory: a lean finding never blocks a PR on its own.");
  });

  it("no case, no finding, and no style-taste finding", () => {
    expect(lens()).toContain("No case, no finding: each finding names the concrete code it would delete, reuse or merge.");
    expect(lens()).toContain("- Raise no style-taste finding.");
  });

  it("names the six sub-tags, splits by job, and flags a `shortcut:` marker with no upgrade trigger", () => {
    for (const tag of ["`delete`", "`reuse`", "`stdlib/native`", "`yagni`", "`merge`", "`split by job`"]) {
      expect(lens(), `the lens lacks the ${tag} tag`).toContain(tag);
    }
    expect(lens()).toContain("- Split by job, never by line count.");
    expect(lens()).toContain("- Flag a `shortcut:` marker that names no upgrade trigger.");
  });

  it("prints no savings or line-count number", () => {
    expect(lens()).toContain("- Never print a savings figure or a line count.");
    expect(lens()).not.toMatch(/\d\s*%/);
  });

  it("D-26: NOTICE credits ponytail for the engineer's and Tech Lead's do-less rules and the lens", () => {
    const notice = readFileSync(join(ROOT, "NOTICE"), "utf8");
    for (const path of [
      "agent-factory/roles/software-engineer.md",
      "agent-factory/roles/tech-lead.md",
      "agent-factory/checklists/pr-review-checklist.md",
    ]) {
      expect(notice, `NOTICE does not name ${path}`).toContain(path);
    }
    expect(readFileSync(join(ROOT, "agent-factory/NOTICE"), "utf8")).toBe(notice);
  });
});

describe("software-engineer.md `## Levels` (TIER-02, TIER-03; D-5, D-10, D-13, D-17, D-18, D-31)", () => {
  const levels = (): string => section(ENGINEER, "Levels");
  /** The one sentence of `## Levels` that may name effort (Phase 41 D-31). */
  const SENIOR_SENTENCE = "Every tier works as a senior engineer: the tiers differ in adapter name, model and effort, not in persona.";

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
    expect(body).toContain("Keep to that level's scope; on the other hosts the model does not change.");
    // No model is named or advised anywhere in the section. Phase 41 D-31 names effort as a tier
    // difference in one sentence, so only that sentence is stripped and any other use still fails.
    expect(body).toContain(SENIOR_SENTENCE);
    const rest = body.replace(SENIOR_SENTENCE, "");
    for (const word of ["haiku", "sonnet", "opus", "Haiku", "Sonnet", "Opus", "effort"]) {
      expect(rest, `the section must not advise a model: "${word}"`).not.toContain(word);
    }
  });

  it("Phase 41 D-31: every tier works as a senior engineer, and the tiers differ in adapter name, model and effort", () => {
    expect(levels()).toContain(SENIOR_SENTENCE);
  });

  it("Phase 41 D-31: every host reads the plan before it starts, and no sentence scopes that read to some hosts", () => {
    const naming = levels()
      .split(/(?<=\.)\s+/)
      .filter((sentence) => sentence.includes("## Tech Lead plan"));
    expect(naming.length, "a sentence of the section names the plan").toBeGreaterThan(0);
    for (const sentence of naming) {
      expect(sentence.startsWith("On every host"), "a sentence naming the plan opens On every host").toBe(true);
    }
    expect(levels()).toContain("On every host, read the adapter or level named in the ticket's `## Tech Lead plan` section before you start.");
  });

  it("the scope of each level is the complexity rubric's, which it points at and does not restate", () => {
    const body = levels();
    expect(body).toContain("`agent-factory/checklists/complexity-rubric.md` sets the scope of each level.");
    expect(body).not.toContain("F1");
  });

  it("TIER-03 / D-31: a junior plan takes only tasks whose plan fixes what to write, and stops `BLOCKED` on the four excluded kinds of work", () => {
    const body = levels();
    expect(body).toContain("A junior plan names the `grugops-software-engineer-junior` adapter, or the junior level on the other hosts.");
    expect(body).toContain("Under a junior plan, take only tasks whose plan already fixes what to write.");
    expect(body).toContain("Stop and report `BLOCKED` on security, migration, concurrency or test-integrity work.");
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

  it("WR-02 / TIER-03: a junior plan also stops on every other rubric risk tag, F3 = 1 included", () => {
    expect(levels()).toContain(
      "Stop the same way on any other risk tag the rubric lists: auth, money, PII, data writes, a public interface or config.",
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

describe("software-engineer.md plain rewrite (PLAIN-02, PLAIN-05; D-20..D-24)", () => {
  it("D-08 / D-12: the headings follow the skeleton order, `## Levels` then `## Do less` after `## Responsibilities`, no suffix", () => {
    const headings = ENGINEER.split("\n").filter((l) => l.startsWith("## "));
    expect(headings).toEqual([
      "## One job",
      "## Activates when",
      "## Reads",
      "## Responsibilities",
      "## Levels",
      "## Do less",
      "## Output",
      "## Board moves",
      "## Trace updates",
      "## Hard limits",
      "## Stop when",
    ]);
  });

  it("D-20 / D-24: `## Do less` holds the six ladder rungs in order, the whole-change rule, the floor and the one-test rule, at every level", () => {
    const body = section(ENGINEER, "Do less");
    const rungs = body.split("\n").filter((l) => l.startsWith("- "));
    expect(rungs).toHaveLength(6);
    const marks = ["Does it need to exist?", "Reuse what this codebase has", "standard library or a platform feature", "installed dependency", "one line a reader follows", "minimum code that works"];
    marks.forEach((m, i) => expect(rungs[i], `rung ${i + 1}`).toContain(m));
    expect(body).toContain("Finish the whole change, including callers, tests and fixtures it breaks.");
    expect(body).toContain(
      "Never cut validation at trust boundaries, error handling that prevents data loss, security, accessibility, or anything the user asked for.",
    );
    expect(body).toContain("New non-trivial logic (a branch, a loop, a parser, money or security) gets one small test.");
    expect(body).toContain("These rules hold at every level.");
  });

  it("D-21 / D-22 / D-23: `## Output` states the `shortcut:` marker and a `Not checked:` line in an `observation` note, capped by the change", () => {
    const body = section(ENGINEER, "Output");
    expect(body).toContain("Mark each deliberate shortcut in code as `shortcut: <the limit>, <when to upgrade>`.");
    expect(body).toContain("End with a `Not checked:` line in an `observation` note.");
    expect(body).toContain("Give one or two lines on what you skipped or left unchecked, and any risk for a human.");
    expect(body).toContain("Never make it longer than the change.");
  });

  it("D-33: `## Board moves` names the two owned pairs as code spans", () => {
    const body = section(ENGINEER, "Board moves");
    expect(body).toContain("`In Development → In Review`");
    expect(body).toContain("`In Development → Blocked`");
  });

  it("D-10: `## Stop when` holds at least two items, one reporting `BLOCKED`, each naming who gets the ticket", () => {
    const items = section(ENGINEER, "Stop when")
      .split("\n")
      .filter((l) => l.startsWith("- "));
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.some((l) => l.includes("`BLOCKED`"))).toBe(true);
    for (const l of items) {
      expect(l.startsWith("- When "), l).toBe(true);
      expect(/Tech Lead|QE\/E2E/.test(l), `no receiving role: ${l}`).toBe(true);
    }
  });

  it("Phase 41 D-31: the junior stop in `## Stop when` keys on a junior plan", () => {
    expect(section(ENGINEER, "Stop when")).toContain("- When a junior plan meets work that `## Levels` excludes, stop as it says; the Tech Lead takes the ticket.");
  });

  it("the `## Levels` section keeps its pinned sentences and points no level at a different do-less rule", () => {
    const levels = section(ENGINEER, "Levels");
    expect(levels).toContain("Under a junior plan, take only tasks whose plan already fixes what to write.");
    expect(levels).toContain("At any level you may deviate from the plan to fit the real code; record what changed and why in your notes.");
    expect(levels).not.toContain("Do less");
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
    expect(CONFIG).toContain("junior `haiku` at effort `xhigh`, mid `sonnet` at effort `high`, senior `opus` at effort `medium`");
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
    // Re-review WR-06: the note says which of the two causes raised the block, in a fixed first
    // line, so steps 15 and 16 can decide on the gate-failure stop without reading free text.
    expect(s.text).toContain(
      "Open its body with `Cause: engineer` for a `BLOCKED` report, or `Cause: gate` for a gate failure.",
    );
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
    // Re-review WR-03: the stops follow `checkpoints.escalate_unadjudicable_result`, the cell the
    // used-up stop is tagged with, so the step and the tagged stop agree under every value.
    // G-39-71 (plan 39-19, D-21 amended): scores the rubric cannot adjudicate are part of "used up", and
    // the hand-off runs first; the cell is read only at the human stop.
    // Quick 261031-rhv R4 (Olger Oeselg, 2026-10-31): a raise past the spent escalation left "used up"
    // for the human stop, so used up keeps only the multi-level scores while the escalation is unspent.
    expect(s.text).toContain(
      "Used up also covers scores calling for more than one level while the escalation is unspent.",
    );
    expect(s.text).toContain("Read `checkpoints.escalate_unadjudicable_result`.");
    expect(s.text).toContain("The used-up stop below follows the same value.");
    // Plan 39-17 (CR-01): the stop at `block` records no move until the human answers.
    expect(s.text).toContain("At `block`, the default, stop for a named human, and record no move until the human answers.");
    // G-39-71 (plan 39-19): the lowered-cell level raise and the scored-level record are retired; the move
    // note carries the level the human named.
    expect(s.text).not.toContain("At `notify` or `off`, raise one level if the escalation is unspent; otherwise keep the level.");
    expect(s.text).not.toContain("Record the scored level in the move note.");
    expect(s.text).toContain("After the human stop, record the move and the level the human named.");
    // G-39-71 (plan 39-19): `notify` records its observation once, naming the last hand-off note.
    expect(s.text).toContain("At `notify`, record an `observation` per Workflow 16 once, naming the last hand-off note.");
    expect(s.text).not.toContain("Stop for a named human when the scores call for");
    // WR-14: a move note carries a fixed `Move:` line, and only those notes are counted.
    expect(s.text).toContain(
      "Count the earlier moves from the Tech Lead's `decision` notes for this ticket that carry a `Move:` line.",
    );
    expect(s.text).toContain("The plan note from step 2 carries none.");
    // Re-review WR-02: a move the human rejected is not counted against the Tech Lead's options.
    expect(s.text).toContain("Skip a move that a `Confirmed: no` finding names.");
    // G-39-71 (plan 39-19): a hand-off is a fifth `Move:` value, and it counts toward no move limit.
    expect(s.text).toContain(
      "Open its body with `Move: escalate`, `Move: re-plan`, `Move: split`, `Move: architect` or `Move: hand-off`.",
    );
    expect(s.text).toContain("A `Move: hand-off` note counts toward no move limit.");
    expect(s.text).toContain("Mark a re-score that raises the level `Move: escalate`.");
    expect(s.text).not.toContain("Count the earlier moves from the ticket's `decision` notes.");
    const b = stops.filter((l) => l.startsWith("- The Tech Lead's options are used up ->"));
    expect(b).toHaveLength(1);
    expect(b[0]).toContain("the one escalation is spent");
    expect(b[0]).toContain("the one other move is spent too");
    // Quick 261031-rhv R4 (Olger Oeselg, 2026-10-31): the used-up stop keeps the unspent-escalation case.
    expect(b[0]).toContain("It also means the scores call for more than one level while the escalation is unspent.");
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

  it("IN-04: the step numbers tech-lead.md cites are the blocked-ticket steps, found by their text", () => {
    // The role cites Workflow 04 by number ("steps 14-17", "step 15"). Inserting a step above them
    // would silently point the Tech Lead at the wrong steps, so the numbers are tied to the text here.
    expect(stepAt("Record a `failed-attempt` note per Workflow 16 when the engineer reports `BLOCKED` (Software Engineer).").n).toBe(14);
    expect(stepAt("Read the `failed-attempt` note (Tech Lead).").n).toBe(15);
    expect(stepAt("Create a new `pending/` subtask for the adapter the new note names (Orchestrator).").n).toBe(16);
    // G-39-71 (plan 39-19): step 17 tells the receiving role how to answer a hand-off.
    expect(stepAt("Read the hand-off note (receiving role).").n).toBe(17);
    // G-39-71 (plan 39-19): the role reads through step 17.
    expect(section(TECH_LEAD, "Reads")).toContain("`agent-factory/workflows/04-ticket-to-pr.md` steps 14-17");
    const cited = [...TECH_LEAD.matchAll(/Workflow 04 steps? (\d+)/g)].map((m) => Number(m[1]));
    expect(cited.length).toBeGreaterThan(0);
    for (const n of cited) expect(n, "tech-lead.md cites a Workflow 04 step other than 15").toBe(15);
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
    // Re-review IN-01: the stop names both holds, the `Blocked` exit (step 15) and the re-enqueue (step 16).
    expect(b[0]).toContain(
      "A named human confirms the Tech Lead's move before the ticket leaves `Blocked` (step 15) and before any re-enqueue (step 16).",
    );
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
    // Re-review WR-06: the condition reads the note's fixed `Cause:` line, not its free text.
    expect(s15).toContain(
      "When the note opens with `Cause: gate`, read `checkpoints.exhaust_self_fix_budget`, the value the gate-failure stop below follows.",
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
    // Plan 39-17 (CR-01): the hold names the cell it reads, since step 15 reads two cells.
    expect(s16).toContain(
      "After a `Cause: gate` note at `checkpoints.exhaust_self_fix_budget: block`, wait also for a `Confirmed: yes` finding naming the move note.",
    );
    expect(s16).not.toContain("wait also for the `human:<name>` finding");
    expect(s15).toContain("Leave the ticket in `Blocked` until then.");
    // WR-01 (iteration 2): the step names who writes the finding and the limit, and says honestly
    // that admission checks the stamp only at `context.human_admission: all`.
    // Plan 41-02 (D-21): the Tech Lead records from the Orchestrator's answer note, not from the human.
    expect(s15).toContain("Once that answer note is published, the Tech Lead records the answer as a `finding` per Workflow 16.");
    expect(s15).toContain("Open its body with `Confirmed: yes` or `Confirmed: no`.");
    expect(s15).toContain("A `Confirmed: no` move is neither carried out nor counted.");
    // Plan 39-18 (WR-01): once the options are used up the confirmation no longer points at an
    // unconditional named-human stop. G-39-71 (plan 39-19): it points at the hand-off.
    expect(s15).toContain("Record a new move, or apply the hand-off once the options are used up.");
    expect(s15).toContain("Stamp it `human:<name>`, with the move note's id and the answer note's id among its refs.");
    expect(s15).toContain("Never write that stamp without the human's answer.");
    // Plan 41-08 (D-35): a spawned Tech Lead writes this finding through `note.js`, which binds nothing.
    expect(s15).toContain("Only at `context.human_admission: all` does admission check that stamp.");
    expect(s15).toContain("Only the Claude Code `propose_note` tool binds it to the human's session grant.");
    expect(s15).toContain("`tools/grugops/note.js` does not bind it.");
    expect(s15).toContain("At the default `off` it is a prose-tier record.");
    // The human stop stays tagged only in `## Stop conditions`; no step carries a checkpoint tag.
    expect(section(WF04, "Steps")).not.toContain("checkpoint:");
    // Workflow 05's own stop is unchanged.
    expect(WF05).toContain("Stop and hand to a human. `checkpoint: exhaust_self_fix_budget`");
  });

  it("D-21 amended / T-39-15: once the options are used up the resolving role takes the ticket, a named human after three disputed rounds, never a retry loop", () => {
    const b = stops.filter((l) => l.startsWith("- The Tech Lead's options are used up ->"));
    expect(b).toHaveLength(1);
    // G-39-71 (plan 39-19): the hand-off comes first; the named human only after three disputed rounds.
    expect(b[0]).toContain("hand the ticket to the role whose job covers its cause; never retry in a loop.");
    expect(b[0]).toContain(
      "Stop for a named human after three disputed rounds, or when the fix changes a requirement or a rule fundamentally.",
    );
    expect(b[0]).toContain("the one escalation is spent");
    expect(b[0]?.endsWith("`checkpoint: escalate_unadjudicable_result`")).toBe(true);
    expect(WF04.split("checkpoint: escalate_unadjudicable_result").length - 1).toBe(1);
  });

  it("the board moves name the escalation's `Blocked` move and the Tech Lead's exit", () => {
    // Re-review IN-03: "escalation" is one Tech Lead move, so the `Blocked` entry names its two
    // causes instead, and the exit names all four moves, the re-plan included.
    expect(section(WF04, "Board moves")).toContain(
      "When the engineer reports `BLOCKED`, or the gate ends `BLOCKED_NEEDS_FIX`, the Software Engineer moves the ticket to `Blocked`.",
    );
    expect(section(WF04, "Board moves")).toContain(
      "The Tech Lead owns its exit: `Ready for Dev` after an escalation or a re-plan, `Backlog` after a split, `In Design` after an Architect pass.",
    );
    expect(section(WF04, "Board moves")).not.toContain("On an escalation the Software Engineer");
  });

  it("WR-12: a split or an Architect pass leaves `Ready for Dev` alone and re-enqueues no engineer", () => {
    const s15 = stepAt("Read the `failed-attempt` note (Tech Lead).").text;
    expect(s15).not.toContain("Return the ticket to `Ready for Dev`.");
    expect(s15).toContain("On a split, move it to `Backlog` for BA/PM.");
    expect(s15).toContain("On an Architect pass, move it to `In Design`.");
    const s16 = stepAt("Create a new `pending/` subtask for the adapter the new note names (Orchestrator).").text;
    // G-39-71 (plan 39-19): a hand-off also dispatches, to the receiving role.
    expect(s16).toContain("Create it only after an escalation, a re-plan or a hand-off.");
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
    // Plan 40-03 (D-14): one action per item, so the component inventory is the next item.
    const r3 = numbered(section(FRONTEND, "Responsibilities"))[2]?.text ?? "";
    expect(r3.startsWith("Name the component inventory")).toBe(true);
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

  it("G-39-5: the level table carries the 2026-10-30 re-decided pins (D-14 as amended)", () => {
    expect(README).toContain("| `grugops-software-engineer-junior` | `haiku` | `xhigh` |");
    expect(README).toContain("| `grugops-software-engineer-mid` | `sonnet` | `high` |");
    expect(README).toContain("| `grugops-software-engineer-senior` | `opus` | `medium` |");
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
    // Re-review IN-02: the lead sentence names install and `--dry-run`, not `--check`, and the
    // unreadable-marker sentence names `--dry-run` too, matching a probe of all three modes.
    expect(README).toContain("Two marker states stop install and `--dry-run` without a note.");
    expect(README).not.toContain("Two marker states print no note from install.");
    expect(README).toContain("`install.js --check`\nreports the malformed ledger as a `FAIL` and still prints the note.");
    expect(README).toContain("install, `--dry-run` and `install.js --check` all\nstop at the marker and print no note.");
    expect(README).toContain("install names\nit in a `verify` line (exit `3`) and `--check` in a `FAIL`; otherwise both name it in a `note`.");
  });

  it("carries no hand-typed specialist count", () => {
    expect(README).not.toMatch(/\b16 specialist/i);
  });
});

// The committed derivation, loaded the way config-governance-consistency.test.ts loads it, so the
// escalate paragraph is checked against the tagged sites the corpus reports, not a typed list.
const cp: typeof import("./checkpoints.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "checkpoints.js")).href
);

describe("factory.config.md `checkpoints` wording matches Workflow 04 step 15 (quick 261030-fzo; HD-2, HD-3)", () => {
  const CONFIG = readFileSync(join(ROOT, "agent-factory/config/factory.config.md"), "utf8");
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");
  const CHECKPOINTS_TS = readFileSync(join(ROOT, "scripts/checkpoints.ts"), "utf8");
  // The parenthetical the HEAD `notify` bullet and JSDoc ended with (8c6c26f1, config line 192).
  const HEAD_PARENTHETICAL = "is recorded (a finding note)";
  const OPEN = "### `checkpoints` sub-fields";
  const CLOSE = "#### Translating a retired `autonomy` value";
  const from = CONFIG.indexOf(OPEN);
  const to = CONFIG.indexOf(CLOSE);
  const slice = CONFIG.slice(from, to);
  const sliceLines = slice.split("\n");
  const steps = numbered(section(WF04, "Steps"));
  const stepAt = (prefix: string) => {
    const s = steps.find((x) => x.text.startsWith(prefix));
    expect(s, `no step starting "${prefix}"`).toBeDefined();
    return s as { n: number; text: string };
  };
  const STEP15 = "Read the `failed-attempt` note (Tech Lead).";

  it("the roster section is bounded by its two headings", () => {
    expect(from).toBeGreaterThanOrEqual(0);
    expect(to).toBeGreaterThan(from);
  });

  it("N1: the `notify` bullet defers the record kind to Workflow 16 and names `observation` for an unstamped record", () => {
    const bullets = sliceLines.filter((l) => l.startsWith("- `notify` — "));
    expect(bullets).toHaveLength(1);
    const b = bullets[0] as string;
    expect(b).toContain("recorded in a note per Workflow 16");
    expect(b).toContain("`finding`");
    expect(b).toContain("`observation`");
    expect(b).toContain("Workflow 04 step 15");
    expect(b).not.toContain(HEAD_PARENTHETICAL);
  });

  it("N2: every notify-only (`At \\`notify\\`,`) sentence of Workflow 04 step 15 records an `observation` per Workflow 16, the kind the config bullet names", () => {
    // "At `notify`," (comma) picks the notify-only sentences. The shared "At `notify` or `off`, …"
    // sentence names the level move both values make, not the record `notify` adds.
    const sentences = stepAt(STEP15).text.split(". ").filter((x) => x.startsWith("At `notify`,"));
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    for (const s of sentences) {
      expect(s).toContain("`observation`");
      expect(s).toContain("per Workflow 16");
    }
    const bullet = sliceLines.find((l) => l.startsWith("- `notify` — ")) as string;
    expect(bullet).toContain("`observation`");
  });

  it("N3: the `Disposition` JSDoc `notify` entry says per Workflow 16 and `observation`", () => {
    const lines = CHECKPOINTS_TS.split("\n");
    const start = lines.findIndex((l) => l.startsWith(" *   notify — "));
    expect(start).toBeGreaterThanOrEqual(0);
    const end = lines.findIndex((l, i) => i > start && l.startsWith(" *   off "));
    expect(end).toBeGreaterThan(start);
    const entry = lines.slice(start, end).join("\n");
    expect(entry).toContain("per Workflow 16");
    expect(entry).toContain("`observation`");
    expect(entry).not.toContain(HEAD_PARENTHETICAL);
  });
  const ESCALATE_LEAD = "**What `escalate_unadjudicable_result` gates.**";
  const NEXT_PARA = "**Which members are floor-tier is not decided here.**";
  const escalateParagraph = () => {
    const a = sliceLines.findIndex((l) => l.startsWith(ESCALATE_LEAD));
    const b = sliceLines.findIndex((l) => l.startsWith(NEXT_PARA));
    expect(a, `no line starting ${ESCALATE_LEAD}`).toBeGreaterThanOrEqual(0);
    expect(b).toBeGreaterThan(a);
    return sliceLines.slice(a, b).join("\n");
  };

  it("E1: exactly one **What `escalate_unadjudicable_result` gates.** paragraph, before the floor-tier paragraph", () => {
    expect(sliceLines.filter((l) => l.startsWith(ESCALATE_LEAD))).toHaveLength(1);
    expect(escalateParagraph().length).toBeGreaterThan(ESCALATE_LEAD.length);
  });

  it("E2: the paragraph names the workflow of every derived `escalate_unadjudicable_result` site", () => {
    const para = escalateParagraph();
    const sites = cp.deriveCheckpoints(ROOT).sites.get("escalate_unadjudicable_result") ?? [];
    expect(sites.length).toBeGreaterThan(0);
    expect(sites.length).toBe(cp.CHECKPOINT_SITE_COUNTS.escalate_unadjudicable_result);
    for (const site of sites) expect(para).toContain(`Workflow ${site.file.slice(0, 2)}`);
  });

  it("E3: the per-value sentences at Workflow 04 step 15 match the step's own text", () => {
    const para = escalateParagraph();
    expect(para).toContain("Workflow 04 step 15");
    // G-39-71 (plan 39-19): the hand-offs run under every value; the per-value sentences describe only
    // the final human stop.
    expect(para).toContain(
      "`block`, the default: the Tech Lead stops for a named human after three disputed rounds, or when the fix changes a requirement or a rule fundamentally.",
    );
    expect(para).toContain("`notify`: the hand-offs run the same way.");
    expect(para).toContain("an `observation` per Workflow 16 names the last hand-off note");
    expect(para).toContain("`off`: the same as `notify`, with no `observation`.");
    const s15 = stepAt(STEP15).text;
    expect(s15).toContain("At `block`, the default, stop for a named human, and record no move until the human answers.");
    // G-39-71 (plan 39-19): at a lowered cell the human stop parks the ticket, and `notify` records its
    // observation once, naming the last hand-off note.
    expect(s15).toContain("At `notify` or `off`, the ticket stays in `Blocked` with no move until a human answers.");
    expect(s15).toContain("At `notify`, record an `observation` per Workflow 16 once, naming the last hand-off note.");
  });

  it("E4: the roster row's stop cell points at the paragraph", () => {
    const rows = sliceLines.filter((l) => l.startsWith("| `escalate_unadjudicable_result` |"));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain("What `escalate_unadjudicable_result` gates");
  });
});

describe("WF04 step 15 is a lead line and labelled sub-bullets (G-39-7)", () => {
  // Plan 39-16 (UAT test 7): step 15 held six decisions in one paragraph, and both named-human stops
  // sat mid-paragraph. Every sentence is kept word for word; each part, and each human stop, now
  // opens its own indented sub-bullet under a short lead line.
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");
  const lines = section(WF04, "Steps").split("\n");
  const at15 = lines.findIndex((l) => l.startsWith("15. "));
  const subs = step15Subs(lines);
  const lead = (lines[at15] ?? "").slice("15. ".length);
  const STEP15 = "Read the `failed-attempt` note (Tech Lead).";
  const RESCORE_STOP = "At `block`, the default, stop for a named human, and record no move until the human answers.";
  const GATE_STOP = "At `block`, the default, stop until a named human confirms the move.";

  // G-39-71 (plan 39-19): the re-score stop became the hand-off and the human stop, so six became seven.
  // Plan 41-02 (D-21, D-27): the ask-once rule and the stop precedence are their own sub-bullets, so
  // seven became nine, and the precedence carries three six-space numbered lines.
  it("step 15 has exactly nine indented sub-bullets and three folded lines, followed directly by step 16", () => {
    expect(at15).toBeGreaterThanOrEqual(0);
    expect(subs).toHaveLength(9);
    const body = lines.slice(at15 + 1, lines.findIndex((l) => l.startsWith("16. ")));
    expect(body.filter((l) => /^ {4}- /.test(l))).toHaveLength(subs.length);
    expect(body.filter((l) => /^ {6}\d\. /.test(l))).toHaveLength(3);
    expect(body).toHaveLength(subs.length + 3);
  });

  it("step15Subs folds a six-space line into the sub-bullet above it and stops at anything else", () => {
    expect(step15Subs(["14. a", "15. b", "    - c", "      1. d", "      2. e", "    - f", "16. g", "    - h"])).toEqual([
      "c 1. d 2. e",
      "f",
    ]);
  });

  it("the lead line carries the choice of moves and no named-human stop", () => {
    expect(lead.startsWith(STEP15)).toBe(true);
    expect(lead).toContain("Choose one: escalate one level at most once per ticket");
    expect(lead).not.toContain("named human");
  });

  it("the sub-bullets open, in order, with the move limits, the hand-off, the stop precedence, the human stop, the move record, the gate-failure stop, the ask-once rule, the confirmation and the board", () => {
    // Plan 39-17 (CR-01): the human stop comes before the move record, so at `block` the Tech Lead
    // stops before any move note exists. G-39-71 (plan 39-19): the hand-off and the human stop replace the
    // re-score stop. Plan 41-02 (D-21): the ask-once rule follows both stops and comes before the
    // confirmation it feeds, and the stop precedence (D-27) reads before either stop it orders.
    const openings = [
      "Apply the move limits.",
      "Apply the hand-off.",
      "Apply the stop precedence.",
      "Apply the human stop.",
      "Record the move in a new `decision` note per Workflow 16.",
      "Apply the gate-failure stop.",
      ASK,
      "Record the human's confirmation.",
      "Update the board.",
    ];
    expect(subs).toHaveLength(openings.length);
    openings.forEach((o, i) => expect(subs[i]?.startsWith(`${o} `), `sub-bullet ${i + 1} opens "${o}"`).toBe(true));
  });

  it("each named-human stop sits in the sub-bullet whose opening names it", () => {
    const rescore = subs.filter((s) => s.includes(RESCORE_STOP));
    expect(rescore).toHaveLength(1);
    // G-39-71 (plan 39-19): the no-move sentence now sits in the human-stop sub-bullet.
    expect(rescore[0]?.startsWith("Apply the human stop. ")).toBe(true);
    const gate = subs.filter((s) => s.includes(GATE_STOP));
    expect(gate).toHaveLength(1);
    expect(gate[0]?.startsWith("Apply the gate-failure stop. ")).toBe(true);
    const board = subs[subs.length - 1] ?? "";
    expect(board).toContain("On an escalation or a re-plan, return the ticket to `Ready for Dev`.");
    expect(board).toContain("On a split, move it to `Backlog` for BA/PM.");
    expect(board).toContain("On an Architect pass, move it to `In Design`.");
  });

  it("numbered() folds every sub-bullet into step 15's text, so the step-15 cases still read each sentence", () => {
    const s15 = numbered(section(WF04, "Steps")).find((s) => s.text.startsWith(STEP15));
    expect(s15?.n).toBe(15);
    expect(s15?.text).toBe([lead, ...subs].join(" "));
  });
});

describe("WF04 step 15 holds the re-score stop before any move note, and step 16 holds for it (CR-01, 39-17)", () => {
  // Plan 39-17 (CR-01): plan 39-16 put the move record before the re-score stop, and step 16 held the
  // re-enqueue only after a gate failure. So at `block` a two-level re-score could be re-enqueued
  // before the named human answered. The stop now comes first, records no move until the human
  // answers, and step 16 holds for a `Stop: re-score` move note as it does for a `Cause: gate` note.
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");
  const lines = section(WF04, "Steps").split("\n");
  const subs = step15Subs(lines);
  const steps = numbered(section(WF04, "Steps"));
  const stepAt = (prefix: string) => {
    const s = steps.find((x) => x.text.startsWith(prefix));
    expect(s, `no step starting "${prefix}"`).toBeDefined();
    return s as { n: number; text: string };
  };
  const subAt = (opening: string) => {
    const i = subs.findIndex((s) => s.startsWith(`${opening} `));
    expect(i, `no sub-bullet opening "${opening}"`).toBeGreaterThanOrEqual(0);
    return { i, text: subs[i] as string };
  };
  // G-39-71 (plan 39-19): the re-score stop is now the human stop; the hold reads a `Stop: human` line.
  const RESCORE = "Apply the human stop.";
  const RECORD = "Record the move in a new `decision` note per Workflow 16.";
  const CONFIRM = "Record the human's confirmation.";
  const NO_MOVE = "At `block`, the default, stop for a named human, and record no move until the human answers.";
  const GATE_HOLD =
    "After a `Cause: gate` note at `checkpoints.exhaust_self_fix_budget: block`, wait also for a `Confirmed: yes` finding naming the move note.";
  const RESCORE_HOLD =
    "After a `Stop: human` move note at `checkpoints.escalate_unadjudicable_result: block`, wait also for a `Confirmed: yes` finding naming it.";
  // A whole sentence: the literal sits at the start of the text or after ". ", and ends the text or
  // is followed by a space.
  const hasSentence = (text: string, sentence: string) =>
    (` ${text} `).includes(` ${sentence} `);

  it("CR-01 (a): the re-score stop sub-bullet, and its no-move sentence, come before the move record", () => {
    expect(subAt(RESCORE).i).toBeLessThan(subAt(RECORD).i);
    const s15 = stepAt("Read the `failed-attempt` note (Tech Lead).").text;
    const stop = s15.indexOf(NO_MOVE);
    expect(stop, "the no-move sentence is in step 15").toBeGreaterThanOrEqual(0);
    expect(stop).toBeLessThan(s15.indexOf(RECORD));
  });

  it("CR-01 (b): at `block` the re-score stop leaves the ticket `Blocked` and lets the human name the level", () => {
    const t = subAt(RESCORE).text;
    for (const sentence of [
      NO_MOVE,
      "Leave the ticket in `Blocked` while the human decides.",
      "The human's level stands, even past the move limits.",
    ]) {
      expect(hasSentence(t, sentence), `re-score sub-bullet lacks "${sentence}"`).toBe(true);
    }
    // Plan 41-02 (D-21): the question moved to the ask-once sub-bullet, word for word.
    const askLevel = "Ask the human for a level, or for another move.";
    expect(hasSentence(subAt(ASK).text, askLevel), `ask-once sub-bullet lacks "${askLevel}"`).toBe(true);
  });

  it("CR-01 (c): the move record carries the human's level and a `Stop: human` line", () => {
    const t = subAt(RECORD).text;
    // G-39-71 (plan 39-19): the record follows the human stop, which replaced the re-score stop.
    for (const sentence of [
      "After the human stop, record the move and the level the human named.",
      "Put the line `Stop: human` under the `Move:` line when the human stop applied.",
    ]) {
      expect(hasSentence(t, sentence), `move-record sub-bullet lacks "${sentence}"`).toBe(true);
    }
  });

  it("CR-01 (d): the human's confirmation carries the named level on a `Level:` line", () => {
    const t = subAt(CONFIRM).text;
    // G-39-71 (plan 39-19): renamed with the stop.
    const sentence = "At the human stop, put the level the human named on a `Level:` line.";
    expect(hasSentence(t, sentence), `confirmation sub-bullet lacks "${sentence}"`).toBe(true);
  });

  it("CR-01 (e): step 16 holds the re-enqueue for both human stops and names the cell in each", () => {
    const s16 = stepAt("Create a new `pending/` subtask for the adapter the new note names (Orchestrator).").text;
    expect(s16).toContain(GATE_HOLD);
    expect(s16).toContain(RESCORE_HOLD);
    expect(s16).toContain("Create it only once the step 15 move is recorded.");
    const noEngineer = s16.indexOf("A split or an Architect pass dispatches no engineer.");
    expect(noEngineer).toBeGreaterThanOrEqual(0);
    expect(s16.indexOf(GATE_HOLD)).toBeLessThan(noEngineer);
    expect(s16.indexOf(RESCORE_HOLD)).toBeLessThan(noEngineer);
  });
});

describe("WF04 asks a human once, and the answer note wakes the Tech Lead at both human stops (plan 41-02; D-21, D-26)", () => {
  // Phase 39 UAT test 71 residual (1): nothing said who wakes the Tech Lead after the human answers, and
  // the human was asked twice, once by the Orchestrator and once by the Tech Lead. One rule now covers
  // the human stop and the gate-failure stop.
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");
  const subs = step15Subs(section(WF04, "Steps").split("\n"));
  const indexOfSub = (opening: string) => {
    const i = subs.findIndex((s) => s.startsWith(`${opening} `));
    expect(i, `no sub-bullet opening "${opening}"`).toBeGreaterThanOrEqual(0);
    return i;
  };
  const sub = (opening: string) => subs[indexOfSub(opening)] as string;
  const hasSentence = (text: string, sentence: string) => (` ${text} `).includes(` ${sentence} `);
  const GATE = "Apply the gate-failure stop.";
  const STOP = "Apply the human stop.";
  const CONFIRM = "Record the human's confirmation.";

  it("the ask-once sub-bullet names who asks, what wakes the Tech Lead and that the Tech Lead never asks again", () => {
    for (const sentence of [
      "Only the Orchestrator asks the human.",
      "That subtask is the wake-up.",
      "The Tech Lead never asks the human again.",
    ]) {
      expect(hasSentence(sub(ASK), sentence), `ask-once sub-bullet lacks "${sentence}"`).toBe(true);
    }
  });

  it("the ask-once sub-bullet holds the sentences moved out of the human stop, and the human stop no longer asks", () => {
    for (const sentence of [
      "Show the human the hand-off notes and the answers to them.",
      "Ask the human for a level, or for another move.",
      "After a `Fundamental:` note, ask the human to approve or reject the proposed change.",
      "At every value, the Orchestrator records the answer in a `decision` note per Workflow 16, naming the human.",
      "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that note at step 15.",
    ]) {
      expect(hasSentence(sub(ASK), sentence), `ask-once sub-bullet lacks "${sentence}"`).toBe(true);
      expect(sub(STOP)).not.toContain(sentence);
    }
  });

  it("the ask-once sub-bullet covers the gate-failure stop too", () => {
    const sentence = "After a `Cause: gate` note, show the human the move note and ask for a yes or a no.";
    expect(hasSentence(sub(ASK), sentence), `ask-once sub-bullet lacks "${sentence}"`).toBe(true);
  });

  it("D-26: only the waiting ticket pauses", () => {
    const sentence = "Only the waiting ticket pauses: the Orchestrator keeps refilling other ready work per Workflow 17.";
    expect(hasSentence(sub(ASK), sentence), `ask-once sub-bullet lacks "${sentence}"`).toBe(true);
  });

  it("the confirmation records from the answer note and cites it, and the double ask is gone", () => {
    for (const sentence of [
      "Once that answer note is published, the Tech Lead records the answer as a `finding` per Workflow 16.",
      "Stamp it `human:<name>`, with the move note's id and the answer note's id among its refs.",
    ]) {
      expect(hasSentence(sub(CONFIRM), sentence), `confirmation sub-bullet lacks "${sentence}"`).toBe(true);
    }
    expect(subs.join(" ")).not.toContain("At the human stop, show the human the move note before recording the answer.");
  });

  it("the `human:<name>` stamp sentences stay word for word", () => {
    for (const sentence of [
      "Never write that stamp without the human's answer.",
      "Only at `context.human_admission: all` does admission check that stamp.",
      "Only the Claude Code `propose_note` tool binds it to the human's session grant.",
      "`tools/grugops/note.js` does not bind it.",
      "At the default `off` it is a prose-tier record.",
    ]) {
      expect(hasSentence(sub(CONFIRM), sentence), `confirmation sub-bullet lacks "${sentence}"`).toBe(true);
    }
  });

  it("the ask-once sub-bullet comes after the gate-failure stop and before the confirmation", () => {
    expect(indexOfSub(ASK)).toBeGreaterThan(indexOfSub(GATE));
    expect(indexOfSub(ASK)).toBeLessThan(indexOfSub(CONFIRM));
  });
});

describe("tech-lead.md and the config paragraph say who asks the human (plan 41-02; D-21)", () => {
  // `## Stop when` tells the Tech Lead to "stop for a named human", which a reader can take as the Tech
  // Lead asking. One sentence in responsibility 6 removes that reading, and the config paragraph no
  // longer says the Tech Lead asks.
  const CONFIG = readFileSync(join(ROOT, "agent-factory/config/factory.config.md"), "utf8");
  const cl = CONFIG.split("\n");
  const para = cl
    .slice(
      cl.findIndex((l) => l.startsWith("**What `escalate_unadjudicable_result` gates.**")),
      cl.findIndex((l) => l.startsWith("**Which members are floor-tier is not decided here.**")),
    )
    .join("\n");

  it("responsibility 6 says only the Orchestrator asks, and the Tech Lead records from its answer note", () => {
    const item = numbered(section(TECH_LEAD, "Responsibilities"))[5]?.text ?? "";
    expect(` ${item} `).toContain(" Only the Orchestrator asks the human: record a `Confirmed:` finding from its answer note. ");
  });

  it("the config paragraph says the Orchestrator asks, once, and no longer that the Tech Lead asks", () => {
    expect(para.length).toBeGreaterThan(0);
    expect(para).toContain("Only the Orchestrator asks the human, once.");
    expect(para).toContain("The Orchestrator asks the human to approve or reject a `Fundamental:` proposal.");
    expect(para).not.toContain("and asks the human to approve");
  });
});

describe("WF04 gives competing stops one order, an approval names its proposal, and step 4 claims (plan 41-02; D-04, D-22 to D-25, D-27)", () => {
  // Phase 39 UAT test 71 residuals (2) to (4): two stops could both claim one ticket, the step 16 gate
  // hold could hold a later hand-off, and an `Approved:` line bound to no specific change.
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");
  const lines = section(WF04, "Steps").split("\n");
  const subs = step15Subs(lines);
  const steps = numbered(section(WF04, "Steps"));
  const indexOfSub = (opening: string) => {
    const i = subs.findIndex((s) => s.startsWith(`${opening} `));
    expect(i, `no sub-bullet opening "${opening}"`).toBeGreaterThanOrEqual(0);
    return i;
  };
  const sub = (opening: string) => subs[indexOfSub(opening)] as string;
  const hasSentence = (text: string, sentence: string) => (` ${text} `).includes(` ${sentence} `);
  const holdsAll = (text: string, where: string, sentences: string[]) => {
    for (const sentence of sentences) expect(hasSentence(text, sentence), `${where} lacks "${sentence}"`).toBe(true);
  };
  const PRECEDENCE = "Apply the stop precedence.";
  // Plan 41-08 (WR-02): the list says to take the first line that fits, so a line that sends a ticket
  // past the human stop has to carry the limit itself.
  const LIMIT = "The three-hand-off limit and the stop before a fourth hand-off still apply.";
  const LINE1 = `1. Apply step 17's revert hand-off to an unapproved fundamental change, not the stop for a proposed \`Fundamental:\` note. ${LIMIT}`;
  const LINE2 = "2. Apply the hand-off before a stop for a raise past the spent escalation, once the options are used up.";
  const LINE3 = "3. Apply the step 16 gate hold only to the move that answers its `Cause: gate` note.";

  /** Numbered line `n` of the precedence list, on its own, so a sentence on one line cannot stand in for another. */
  const precedenceLine = (n: number) => lines[lines.findIndex((l) => l.startsWith(`    - ${PRECEDENCE} `)) + n] as string;

  it("the precedence sub-bullet sits between the hand-off and the human stop and folds its three numbered lines", () => {
    expect(indexOfSub(PRECEDENCE)).toBe(indexOfSub("Apply the hand-off.") + 1);
    expect(indexOfSub("Apply the human stop.")).toBe(indexOfSub(PRECEDENCE) + 1);
    const at = lines.findIndex((l) => l.startsWith(`    - ${PRECEDENCE} `));
    expect(lines[at]).toBe(`    - ${PRECEDENCE} Take the first line that fits.`);
    expect(lines[at + 1]).toBe(`      ${LINE1}`);
    expect(lines[at + 2]?.startsWith(`      ${LINE2} `)).toBe(true);
    expect(lines[at + 3]?.startsWith(`      ${LINE3} `)).toBe(true);
    expect(lines[at + 4]?.startsWith("    - Apply the human stop. ")).toBe(true);
  });

  it("D-22, WR-02: line 1 sends an unapproved fundamental change to the revert hand-off, not the `Fundamental:` stop, and keeps the hand-off limit", () => {
    holdsAll(sub(PRECEDENCE), "precedence sub-bullet", [LINE1]);
    expect(precedenceLine(1).endsWith(` ${LIMIT}`), "line 1 ends in the limit sentence").toBe(true);
    expect(WF04).not.toContain("never the human stop");
    // The limit the line points at stays where it is set.
    holdsAll(sub("Apply the hand-off."), "hand-off sub-bullet", ["Hand off one cause at most three times."]);
    holdsAll(sub("Apply the human stop."), "human-stop sub-bullet", ["Apply it also before a fourth hand-off on one ticket."]);
  });

  it("D-23: line 2 puts the hand-off before the raise stop and keeps the three-rounds and fundamental rules", () => {
    holdsAll(sub(PRECEDENCE), "precedence sub-bullet", [
      LINE2,
      "Apply that stop only when the ticket comes back still needing the raise.",
      "The three-rounds and fundamental rules still apply.",
    ]);
  });

  it("D-25, WR-02: line 3 binds the gate hold to the move that answers it, and a later revert hand-off does not wait but keeps the hand-off limit", () => {
    holdsAll(sub(PRECEDENCE), "precedence sub-bullet", [
      LINE3,
      "Dispatch a later revert hand-off on the same ticket without waiting.",
    ]);
    // Line 1 holds the same sentence, so the sub-bullet alone cannot prove line 3 does.
    expect(precedenceLine(3)).toContain(`Dispatch a later revert hand-off on the same ticket without waiting. ${LIMIT}`);
  });

  it("D-22: the human stop applies to a proposed `Fundamental:` note only", () => {
    const t = sub("Apply the human stop.");
    holdsAll(t, "human-stop sub-bullet", [
      "Apply it after three disputed rounds, or when a proposed `Fundamental:` note waits for approval.",
    ]);
    expect(t).not.toContain("when the fix changes a requirement or a rule fundamentally");
  });

  it("D-24: the move record names the human and the `Fundamental:` note, with no content hash", () => {
    const t = sub("Record the move in a new `decision` note per Workflow 16.");
    holdsAll(t, "move-record sub-bullet", [
      "Name the human and the id of the `Fundamental:` note it answers on that line.",
    ]);
    expect(t).not.toContain("line naming the human.");
    expect(WF04).not.toMatch(/\bhash\b/i);
  });

  it("D-24: step 17 reads the pass rule and then binds it to the `Fundamental:` note behind the change", () => {
    const s17 = steps[16]?.text ?? "";
    expect(s17).toContain(
      "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`. That `Approved:` line names the `Fundamental:` note behind this change.",
    );
  });

  it("D-04: step 4 claims before the spawn and still passes no `model` or `effort` parameter", () => {
    const s4 = steps[3]?.text ?? "";
    const CLAIM = "Run `node tools/grugops/claim.js claim <task> --by <adapter> --level <level>` per Workflow 17.";
    const SPAWN = "Spawn that adapter by name as a non-fork sub-agent.";
    holdsAll(s4, "step 4", [CLAIM, SPAWN, "Pass no `model` or `effort` parameter on the spawn call."]);
    expect(s4.indexOf(CLAIM)).toBeLessThan(s4.indexOf(SPAWN));
  });

  it("the raise trigger and the two checkpoint tags are untouched", () => {
    holdsAll(sub("Apply the human stop."), "human-stop sub-bullet", [
      "Apply it also when the scores call for a raise past the spent escalation.",
    ]);
    for (const tag of ["`checkpoint: exhaust_self_fix_budget`", "`checkpoint: escalate_unadjudicable_result`"]) {
      expect(WF04.split(tag), tag).toHaveLength(2);
    }
  });
});

describe("WF04, tech-lead.md and factory.config.md give a used-up ticket one outcome under every value (WR-01, 39-18)", () => {
  // Plan 39-18 (WR-01, option park-in-blocked, decided by Olger Oeselg on 2026-10-30): the used-up stop
  // is tagged `checkpoint: escalate_unadjudicable_result`, and step 15 says it follows the same value as
  // the re-score stop. The text defined `notify`/`off` only for the re-score case, so a lowered cell
  // left a used-up ticket with no legal move and no `Move:` label for a kept level. Now: at `block` a
  // named human takes the ticket; at `notify` or `off` the Tech Lead makes no move, nothing is
  // re-enqueued, the ticket stays in `Blocked`, and Workflow 09 raises it for a human.
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");
  const CONFIG = readFileSync(join(ROOT, "agent-factory/config/factory.config.md"), "utf8");
  const lines = section(WF04, "Steps").split("\n");
  const subs = step15Subs(lines);
  const subAt = (opening: string) => {
    const i = subs.findIndex((s) => s.startsWith(`${opening} `));
    expect(i, `no sub-bullet opening "${opening}"`).toBeGreaterThanOrEqual(0);
    return subs[i] as string;
  };
  const hasSentence = (text: string, sentence: string) => (` ${text} `).includes(` ${sentence} `);
  const stops = section(WF04, "Stop conditions").split("\n").filter((l) => l.startsWith("- "));
  const usedUp = () => {
    const b = stops.filter((l) => l.startsWith("- The Tech Lead's options are used up ->"));
    expect(b).toHaveLength(1);
    return b[0] as string;
  };
  const escalateParagraph = () => {
    const cl = CONFIG.split("\n");
    const a = cl.findIndex((l) => l.startsWith("**What `escalate_unadjudicable_result` gates.**"));
    const b = cl.findIndex((l) => l.startsWith("**Which members are floor-tier is not decided here.**"));
    expect(a).toBeGreaterThanOrEqual(0);
    expect(b).toBeGreaterThan(a);
    return cl.slice(a, b);
  };

  it("(a) the move limits send a ticket with both options spent to the hand-off", () => {
    const t = subAt("Apply the move limits.");
    // G-39-71 (plan 39-19): both options spent now leads to the hand-off, not the used-up stop.
    const sentence = "Once the escalation and the other move are both spent, apply the hand-off.";
    expect(hasSentence(t, sentence), `move-limits sub-bullet lacks "${sentence}"`).toBe(true);
  });

  it("(b) the human stop follows the used-up stop's value and parks the ticket at `notify` or `off`", () => {
    // G-39-71 (plan 39-19): the re-score stop became the human stop; the kept-level label is retired.
    const t = subAt("Apply the human stop.");
    for (const sentence of [
      "The used-up stop below follows the same value.",
      "At `notify` or `off`, the ticket stays in `Blocked` with no move until a human answers.",
      "At `notify`, record an `observation` per Workflow 16 once, naming the last hand-off note.",
    ]) {
      expect(hasSentence(t, sentence), `human-stop sub-bullet lacks "${sentence}"`).toBe(true);
    }
    expect(t).not.toContain("Mark a kept level `Move: re-plan`.");
  });

  it("(c) the confirmation points at the hand-off once the options are used up", () => {
    const t = subAt("Record the human's confirmation.");
    // G-39-71 (plan 39-19): the confirmation points at the hand-off.
    const sentence = "Record a new move, or apply the hand-off once the options are used up.";
    expect(hasSentence(t, sentence), `confirmation sub-bullet lacks "${sentence}"`).toBe(true);
    expect(t).not.toContain("or stop for a named human once the options are used up");
  });

  it("(d) the tagged used-up stop states the lowered outcome, keeps the loop bound and its tag; WF04 keeps two tags", () => {
    const b = usedUp();
    // G-39-71 (plan 39-19): at a lowered cell the final human stop parks the ticket.
    // Quick 261031-oxi defect 5 (Olger Oeselg, 2026-10-31): the park lasts until a human answers.
    const PARKED = "At `notify` or `off`, that stop leaves the ticket in `Blocked` with no move and no re-enqueue until a human answers.";
    expect(b).toContain(PARKED);
    expect(b).toContain("never retry in a loop.");
    expect(b.endsWith(`${PARKED} \`checkpoint: escalate_unadjudicable_result\``)).toBe(true);
    expect(WF04.split("checkpoint: ").length - 1).toBe(2);
  });

  it("(e) tech-lead.md `## Stop when` hands a used-up ticket off, stops for a human after three disputed rounds, and parks it at `notify` or `off`", () => {
    const body = section(TECH_LEAD, "Stop when");
    // G-39-71 (plan 39-19, D-21 amended): the 39-18 no-move limit became the hand-off and the final
    // human stop.
    for (const sentence of [
      "After the options are used up, hand the ticket to the role whose job covers its cause.",
      "Stop for a named human after three disputed rounds, or when the fix changes a requirement or a rule fundamentally.",
      // Quick 261031-oxi defect 5 (Olger Oeselg, 2026-10-31): the park lasts until a human answers.
      "At `notify` or `off`, leave it in `Blocked` with no move until a human answers.",
    ]) {
      expect(body).toContain(sentence);
    }
    // Quick 261031-rhv R4 (Olger Oeselg, 2026-10-31): a raise past the spent escalation applies the
    // human stop, so the Tech Lead stops for a named human before a second escalation.
    expect(body).toContain("Stop the same way before a second escalation.");
    expect(body).not.toContain("After the options are used up, stop for a named human.");
  });

  it("(f) the factory.config.md paragraph names the hand-off, Workflow 09 and the loop bound under every value", () => {
    const para = escalateParagraph();
    const text = para.join("\n");
    // G-39-71 (plan 39-19): the kept-level move is retired.
    expect(text).not.toContain("Keeping the level is a `Move: re-plan`.");
    expect(text).toContain("Workflow 09");
    expect(text).toContain("`blocked_escalation_days`");
    const wf04Stop = para.filter((l) => l.startsWith("- Workflow 04, `## Stop conditions`:"));
    expect(wf04Stop).toHaveLength(1);
    expect(wf04Stop[0]).toContain(
      "Under every value the Tech Lead then hands the ticket to the role whose job covers its cause, at most three times per cause.",
    );
    expect(wf04Stop[0]).toContain("Under every value it is never retried in a loop.");
    expect(wf04Stop[0]).not.toContain("The ticket goes to a named human and is never retried in a loop.");
  });
});

describe("A blocked ticket the Tech Lead cannot resolve goes to the role whose job covers its cause (G-39-71, 39-19)", () => {
  // Plan 39-19 (G-39-71, D-21 amended, decided by Olger Oeselg on 2026-10-31 at Phase 39 UAT test 71):
  // once the Tech Lead's options are used up, or the scores call for more than it may move, the ticket
  // is handed to the role whose job covers its cause, at every value of
  // `checkpoints.escalate_unadjudicable_result`, at most three times for one cause. A named human is
  // asked only after three disputed rounds on one cause, or for a fundamental change. A round is a
  // recorded `Disputed:` note, so a block with a new cause counts no round. The cell decides only the
  // final human stop: at `block` a named human; at `notify` or `off` the ticket waits in `Blocked`.
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");
  const lines = section(WF04, "Steps").split("\n");
  const at15 = lines.findIndex((l) => l.startsWith("15. "));
  const subs = step15Subs(lines);
  const subAt = (opening: string) => {
    const i = subs.findIndex((s) => s.startsWith(`${opening} `));
    expect(i, `no sub-bullet opening "${opening}"`).toBeGreaterThanOrEqual(0);
    return subs[i] as string;
  };
  const steps = numbered(section(WF04, "Steps"));
  const stepAt = (prefix: string) => {
    const s = steps.find((x) => x.text.startsWith(prefix));
    expect(s, `no step starting "${prefix}"`).toBeDefined();
    return s as { n: number; text: string };
  };
  const hasSentence = (text: string, sentence: string) => (` ${text} `).includes(` ${sentence} `);
  const holdsAll = (text: string, where: string, sentences: string[]) => {
    for (const sentence of sentences) expect(hasSentence(text, sentence), `${where} lacks "${sentence}"`).toBe(true);
  };
  const stops = section(WF04, "Stop conditions").split("\n").filter((l) => l.startsWith("- "));
  const usedUp = () => {
    const b = stops.filter((l) => l.startsWith("- The Tech Lead's options are used up ->"));
    expect(b).toHaveLength(1);
    return b[0] as string;
  };
  const STEP15 = "Read the `failed-attempt` note (Tech Lead).";
  const STEP16 = "Create a new `pending/` subtask for the adapter the new note names (Orchestrator).";
  const STEP17 = "Read the hand-off note (receiving role).";
  // The gate-failure sub-bullet at plan base (40d0743f), copied from the file before the edit. It is
  // Workflow 05's `exhaust_self_fix_budget` stop and stays byte for byte; a hand-off is a `Move:`, so
  // the stop covers a hand-off after a `Cause: gate` note too.
  const GATE_FAILURE_AT_BASE =
    "Apply the gate-failure stop. When the note opens with `Cause: gate`, read `checkpoints.exhaust_self_fix_budget`, the value the gate-failure stop below follows. At `block`, the default, stop until a named human confirms the move. Leave the ticket in `Blocked` until then. At `notify`, make the move and record an `observation` per Workflow 16 that names the move note. At `off`, make the move without that human.";

  it("(a) the hand-off sub-bullet names the receiving role, runs at every value and bounds each cause", () => {
    holdsAll(subAt("Apply the hand-off."), "hand-off sub-bullet", [
      "Apply the hand-off.",
      "Once the options are used up, hand the ticket to the role whose job covers its cause.",
      // Quick 261031-rhv R4 (Olger Oeselg, 2026-10-31): a raise past the spent escalation is a human stop.
      "Used up also covers scores calling for more than one level while the escalation is unspent.",
      "Make the hand-off at every value of `checkpoints.escalate_unadjudicable_result`.",
      "Name BA/PM for scope or acceptance, and the Architect for design.",
      "Name another role when its one job covers the cause.",
      "Add a `## Blocked` bullet naming that role as the owner who clears it.",
      "Hand off one cause at most three times.",
    ]);
  });

  it("(b) the human-stop sub-bullet comes after three disputed rounds or a fundamental change; `block` before `notify`/`off`", () => {
    const t = subAt("Apply the human stop.");
    const BLOCK = [
      "At `block`, the default, stop for a named human, and record no move until the human answers.",
      "Leave the ticket in `Blocked` while the human decides.",
      "The human's level stands, even past the move limits.",
      "A move or hand-off the human names counts toward no limit.",
    ];
    const LOWERED = "At `notify` or `off`, the ticket stays in `Blocked` with no move until a human answers.";
    holdsAll(t, "human-stop sub-bullet", [
      "Apply the human stop.",
      // Plan 41-02 (D-22): the stop covers a proposal only; an already-made change takes the revert hand-off.
      "Apply it after three disputed rounds, or when a proposed `Fundamental:` note waits for approval.",
      "A round is a `Disputed:` `decision` note naming a hand-off note for the same cause.",
      "A receiving role writes one per step 17.",
      "Record one when the ticket blocks again for the cause a `Resolved:` fix addressed.",
      "A block with a new cause counts no round.",
      "Add a `## Blocked` bullet naming a human as the owner who clears it.",
      "Read `checkpoints.escalate_unadjudicable_result`.",
      "The used-up stop below follows the same value.",
      ...BLOCK,
      LOWERED,
      "Workflow 09 raises it for a human when its sweep finds it blocked past `blocked_escalation_days`.",
      "At `notify`, record an `observation` per Workflow 16 once, naming the last hand-off note.",
    ]);
    for (const sentence of BLOCK) expect(t.indexOf(sentence)).toBeLessThan(t.indexOf(LOWERED));
    // Plan 41-02 (D-21): what the human is shown and asked moved to the ask-once sub-bullet, word for word.
    const MOVED = ["Show the human the hand-off notes and the answers to them.", "Ask the human for a level, or for another move."];
    holdsAll(subAt(ASK), "ask-once sub-bullet", MOVED);
    for (const sentence of MOVED) expect(t).not.toContain(sentence);
  });

  it("(c) the move record carries five `Move:` values, the `To:` line and the `Stop: human` line", () => {
    holdsAll(subAt("Record the move in a new `decision` note per Workflow 16."), "move-record sub-bullet", [
      "Open its body with `Move: escalate`, `Move: re-plan`, `Move: split`, `Move: architect` or `Move: hand-off`.",
      "Under `Move: hand-off`, add a `To:` line naming the receiving role, then state the cause.",
      "After the human stop, record the move and the level the human named.",
      "Put the line `Stop: human` under the `Move:` line when the human stop applied.",
    ]);
  });

  // Plan 41-02 (D-21): this sentence asked the human a second time, so it is deleted. At `block` the
  // human stop records no move before the answer, so the note it showed did not exist yet either.
  it("(d) the confirmation carries the human's level and never shows the human a note", () => {
    const t = subAt("Record the human's confirmation.");
    holdsAll(t, "confirmation sub-bullet", ["At the human stop, put the level the human named on a `Level:` line."]);
    expect(stepAt(STEP15).text).not.toContain("At the human stop, show the human the move note before recording the answer.");
    expect(t).not.toContain("show the human");
  });

  it("(e) step 16 dispatches the receiving role through the queue and holds on a `Stop: human` move note", () => {
    holdsAll(stepAt(STEP16).text, "step 16", [
      "Create it only after an escalation, a re-plan or a hand-off.",
      "For a hand-off, take the adapter of the role on the `To:` line.",
      "After a `Stop: human` move note at `checkpoints.escalate_unadjudicable_result: block`, wait also for a `Confirmed: yes` finding naming it.",
      "After a `Cause: gate` note at `checkpoints.exhaust_self_fix_budget: block`, wait also for a `Confirmed: yes` finding naming the move note.",
      "The spawn prompt carries the task reference and nothing else.",
    ]);
  });

  it("(f) step 17 tells the receiving role how to answer and which board exit follows", () => {
    const s = stepAt(STEP17);
    expect(s.n).toBe(17);
    holdsAll(s.text, "step 17", [
      STEP17,
      "Fix the cause within the role's own job, or dispute it.",
      "Answer it in a `decision` note per Workflow 16 that names the hand-off note.",
      "Open its body with `Resolved:`, `Disputed:` or `Fundamental:`, then the reason.",
      "Mark it `Fundamental:` when the fix changes a requirement or a rule fundamentally.",
      "A change is fundamental when it alters what a requirement delivers, beyond a split or clearer acceptance.",
      "Altering a business rule, a hard limit, a `checkpoints` value or an ADR is fundamental too.",
      "After `Resolved:`, move the ticket out of `Blocked`: to `Backlog` after a split, otherwise to `Ready for Dev`.",
      "The Tech Lead then plans it again per step 2 before any pull.",
      "After `Disputed:` or `Fundamental:`, name the Tech Lead as the `## Blocked` owner again.",
    ]);
  });

  it("(g) the used-up stop hands off first, keeps the loop bound and its tag; WF04 keeps 2 tags and 6 stop bullets", () => {
    const b = usedUp();
    holdsAll(b.slice("- ".length), "used-up stop", [
      "hand the ticket to the role whose job covers its cause; never retry in a loop.",
      "Used up means the one escalation is spent and the one other move is spent too.",
      // Quick 261031-rhv R4 (Olger Oeselg, 2026-10-31): a raise past the spent escalation is a human stop.
      "It also means the scores call for more than one level while the escalation is unspent.",
      "Stop for a named human after three disputed rounds, or when the fix changes a requirement or a rule fundamentally.",
      // Quick 261031-oxi defect 5 (Olger Oeselg, 2026-10-31): the park lasts until a human answers.
      "At `notify` or `off`, that stop leaves the ticket in `Blocked` with no move and no re-enqueue until a human answers.",
    ]);
    expect(b).toContain("never retry in a loop.");
    expect(b.endsWith("`checkpoint: escalate_unadjudicable_result`")).toBe(true);
    expect(WF04.split("checkpoint: ").length - 1).toBe(2);
    expect(stops).toHaveLength(6);
  });

  it("(h) the board sub-bullet, `## Board moves` and `## Agents involved` name the receiving role's exit", () => {
    holdsAll(subAt("Update the board."), "board sub-bullet", [
      "On a hand-off, keep it in `Blocked`; the receiving role owns its exit per step 17.",
    ]);
    expect(section(WF04, "Board moves")).toContain(
      "On a hand-off the ticket stays in `Blocked`, and the receiving role owns its exit per step 17.",
    );
    expect(section(WF04, "Agents involved")).toContain(
      "- Receiving role (BA/PM, Architect or another role) — fixes or disputes the cause of a ticket the Tech Lead hands off.",
    );
  });

  it("(i) the gate-failure sub-bullet is unchanged character for character, and step 14 keeps the human-only path", () => {
    expect(subAt("Apply the gate-failure stop.")).toBe(GATE_FAILURE_AT_BASE);
    expect(stepAt("Record a `failed-attempt` note").text).toContain(
      "A human-only gate failure (visual baseline, test integrity) never takes this path; Workflow 05 hands it to its human.",
    );
  });

  it("(j) the retired outcomes are gone from Workflow 04", () => {
    for (const retired of [
      "Apply the re-score stop.",
      "At `notify` or `off`, raise one level if the escalation is unspent; otherwise keep the level.",
      "Mark a kept level `Move: re-plan`.",
      "Stop: re-score",
      "stop and hand the ticket to a named human",
    ]) {
      expect(WF04, `Workflow 04 still carries "${retired}"`).not.toContain(retired);
    }
    expect(stepAt(STEP15).n).toBe(15);
  });

  // W1: the four places that state the used-up outcome say the same thing at every value of the cell.
  const CONFIG = readFileSync(join(ROOT, "agent-factory/config/factory.config.md"), "utf8");
  const BA_PM = readFileSync(join(ROOT, "agent-factory/roles/ba-pm.md"), "utf8");
  const ARCHITECT = readFileSync(join(ROOT, "agent-factory/roles/architect-design.md"), "utf8");
  const escalateParagraph = () => {
    const cl = CONFIG.split("\n");
    const a = cl.findIndex((l) => l.startsWith("**What `escalate_unadjudicable_result` gates.**"));
    const b = cl.findIndex((l) => l.startsWith("**Which members are floor-tier is not decided here.**"));
    expect(a, "no escalate paragraph").toBeGreaterThanOrEqual(0);
    expect(b).toBeGreaterThan(a);
    return cl.slice(a, b).join("\n");
  };
  const HANDOFF = "the role whose job covers its cause";
  const HUMAN = "after three disputed rounds, or when the fix changes a requirement or a rule fundamentally";
  const PARK = "in `Blocked` with no move";

  it("(k) WF04 step 15, the used-up stop, tech-lead.md `## Stop when` and the config paragraph share the three phrases (W1)", () => {
    // Plan 41-02 (D-22): step 15's own trigger names the proposal, because the stop precedence sends an
    // already-made change to the revert hand-off. The three summaries keep the general wording.
    const STEP15_HUMAN = "after three disputed rounds, or when a proposed `Fundamental:` note waits for approval";
    const places: [string, string, string][] = [
      ["Workflow 04 step 15", stepAt(STEP15).text, STEP15_HUMAN],
      ["the Workflow 04 used-up stop", usedUp(), HUMAN],
      ["tech-lead.md `## Stop when`", section(TECH_LEAD, "Stop when"), HUMAN],
      ["the factory.config.md escalate paragraph", escalateParagraph(), HUMAN],
    ];
    for (const [where, text, human] of places) {
      for (const phrase of [HANDOFF, human, PARK]) expect(text, `${where} lacks "${phrase}"`).toContain(phrase);
    }
    expect(stepAt(STEP15).text).toContain("Make the hand-off at every value of `checkpoints.escalate_unadjudicable_result`.");
    expect(escalateParagraph()).toContain(
      "Under every value the Tech Lead then hands the ticket to the role whose job covers its cause, at most three times per cause.",
    );
  });

  it("(l) the config paragraph gives one sentence per value, defines a round, and names the stale-blocker and fundamental-change limits", () => {
    const para = escalateParagraph();
    for (const sentence of [
      "`block`, the default: the Tech Lead stops for a named human after three disputed rounds, or when the fix changes a requirement or a rule fundamentally.",
      "`notify`: the hand-offs run the same way.",
      "`off`: the same as `notify`, with no `observation`.",
      "A round is a `Disputed:` note about the same cause: a receiving role disputes a hand-off, or the Tech Lead records that the ticket blocked again for the cause a `Resolved:` fix addressed.",
      "A block with a new cause counts no round.",
      "If `checkpoints.escalate_stale_blocker` is lowered too, nothing raises a parked ticket: it waits in `Blocked` until a human reads the board.",
      "Nor does lowering it license an agent to make a fundamental change to a requirement or a rule.",
    ]) {
      expect(para, `config paragraph lacks "${sentence}"`).toContain(sentence);
    }
    // Checker revision 1: no round without a recorded disagreement, in the step as in the config.
    expect(hasSentence(stepAt(STEP15).text, "A block with a new cause counts no round.")).toBe(true);
  });

  it("(m) BA/PM and the Architect each point at Workflow 04 step 17 from `## Responsibilities`", () => {
    for (const [name, role] of [
      ["ba-pm.md", BA_PM],
      ["architect-design.md", ARCHITECT],
    ] as const) {
      expect(section(role, "Responsibilities"), `${name} lacks the step 17 pointer`).toContain(
        "Answer a Tech Lead hand-off per Workflow 04 step 17.",
      );
    }
  });

  it("(n) the retired outcomes are gone from tech-lead.md and factory.config.md", () => {
    for (const [name, text] of [
      ["tech-lead.md", TECH_LEAD],
      ["factory.config.md", CONFIG],
    ] as const) {
      for (const retired of [
        "make no move of your own",
        "Keeping the level is a `Move: re-plan`.",
        "`notify`: the Tech Lead raises the level one step if the escalation is unspent, and otherwise keeps the level.",
        "two-level re-score stop",
      ]) {
        expect(text, `${name} still carries "${retired}"`).not.toContain(retired);
      }
    }
  });

  // 39-UAT D3 (Olger Oeselg, 2026-10-31) closes 39-REVIEW CR-01 and CR-03 with two one-sentence edits
  // to step 17, quick task 261031-nd9: the Tech Lead is queued again after a dispute, and the re-plan
  // after `Resolved:` keeps the step 15 move limits.
  it("(o) D3 / CR-01: after `Disputed:` or `Fundamental:` the Orchestrator queues the Tech Lead (quick 261031-nd9)", () => {
    const t = stepAt(STEP17).text;
    const OWNER = "After `Disputed:` or `Fundamental:`, name the Tech Lead as the `## Blocked` owner again.";
    const QUEUE = "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that answer note at step 15.";
    holdsAll(t, "step 17", [OWNER, QUEUE]);
    expect(t.indexOf(QUEUE)).toBeGreaterThan(t.indexOf(OWNER));
  });

  it("(p) D3 / CR-03: the step 15 move limits bind the step 2 re-plan after `Resolved:` (quick 261031-nd9)", () => {
    const t = stepAt(STEP17).text;
    const REPLAN = "The Tech Lead then plans it again per step 2 before any pull.";
    const BIND = "The step 15 move limits bind that plan: record a level raise in it as `Move: escalate`.";
    holdsAll(t, "step 17", [REPLAN, BIND]);
    expect(t.indexOf(BIND)).toBeGreaterThan(t.indexOf(REPLAN));
  });

  // 39-UAT D1 (Olger Oeselg, 2026-10-31) closes 39-REVIEW CR-02, quick task 261031-nd9: a role only
  // proposes a fundamental change and leaves it unmade until a named human approves, and the Tech Lead
  // checks every `Resolved:` note against the step 17 definition before step 16 dispatches.
  it("(q) D1 / CR-02: a fundamental change is a proposal a named human approves, and every `Resolved:` note is checked (quick 261031-nd9)", () => {
    const s17 = stepAt(STEP17).text;
    const MARK = "Mark it `Fundamental:` when the fix changes a requirement or a rule fundamentally.";
    const PROPOSE = "Only propose a fundamental fix: leave the requirement, rule, ADR or `checkpoints` value unchanged until a named human approves.";
    const DEFINITION = "Altering a business rule, a hard limit, a `checkpoints` value or an ADR is fundamental too.";
    // Quick 261031-oxi defect 3 (Olger Oeselg, 2026-10-31): the check runs at the step 2 re-plan, reads
    // the diff, and passes a change that names the human's approval `finding`.
    const CHECK = "At the step 2 re-plan, the Tech Lead checks the diff behind every `Resolved:` note against this definition.";
    // Quick 261031-rhv R3 (Olger Oeselg, 2026-10-31): the check passes a fundamental change only on a
    // hand-off note that carries the human's `Approved:` line.
    const TREAT = "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`.";
    holdsAll(s17, "step 17", [MARK, PROPOSE, DEFINITION, CHECK, TREAT]);
    expect(s17.indexOf(PROPOSE)).toBeGreaterThan(s17.indexOf(MARK));
    expect(s17.indexOf(CHECK)).toBeGreaterThan(s17.indexOf(DEFINITION));
    expect(s17.indexOf(TREAT)).toBeGreaterThan(s17.indexOf(CHECK));

    const stop = subAt("Apply the human stop.");
    const APPROVE = "After a `Fundamental:` note, ask the human to approve or reject the proposed change.";
    const HAND_BACK = "On approval, hand the ticket back to the proposing role to make the change.";
    const LOWERED = "At `notify` or `off`, the ticket stays in `Blocked` with no move until a human answers.";
    holdsAll(stop, "human-stop sub-bullet", [HAND_BACK, LOWERED]);
    expect(stop.indexOf(HAND_BACK)).toBeLessThan(stop.indexOf(LOWERED));
    // Plan 41-02 (D-21): the question moved to the ask-once sub-bullet, word for word.
    holdsAll(subAt(ASK), "ask-once sub-bullet", [APPROVE]);
    expect(stop).not.toContain(APPROVE);

    expect(escalateParagraph()).toContain(
      "A role only proposes such a change and leaves it unmade until a named human approves, and the Tech Lead checks every `Resolved:` note against that definition.",
    );
    // Plan 40-03 (D-14): the `Resolved:` check is its own item, one action per item.
    expect(numbered(section(TECH_LEAD, "Responsibilities")).map((i) => i.text)).toContain(
      "Check every `Resolved:` note per step 17.",
    );
  });

  // 39-UAT D2 (Olger Oeselg, 2026-10-31) closes 39-REVIEW CR-04, quick task 261031-nd9: a cause carries
  // a stable `Cause-id:` line, and three hand-offs on one ticket reach the human stop.
  it("(r) D2 / CR-04: a `Cause-id:` line names the cause, and the human stop applies before a fourth hand-off on one ticket (quick 261031-nd9; wording per quick 261031-oxi defect 6)", () => {
    // Quick 261031-oxi defect 6 (Olger Oeselg, 2026-10-31): the ceiling wording moved from "after three
    // hand-offs on one ticket" to "before a fourth hand-off on one ticket", so its timing has one reading.
    holdsAll(subAt("Record the move in a new `decision` note per Workflow 16."), "move-record sub-bullet", [
      "Add a `Cause-id:` line: the id of the `failed-attempt` note that first raised the cause.",
    ]);
    holdsAll(stepAt(STEP17).text, "step 17", ["Copy the hand-off note's `Cause-id:` line into a `Disputed:` answer."]);
    holdsAll(subAt("Apply the human stop."), "human-stop sub-bullet", [
      "Apply it also before a fourth hand-off on one ticket.",
      "Two notes share a cause when they carry the same `Cause-id:` line.",
    ]);
    const CEILING = "before a fourth hand-off on one ticket";
    const places: [string, string][] = [
      ["Workflow 04 step 15", stepAt(STEP15).text],
      ["the Workflow 04 used-up stop", usedUp()],
      ["tech-lead.md `## Stop when`", section(TECH_LEAD, "Stop when")],
      ["the factory.config.md escalate paragraph", escalateParagraph()],
    ];
    for (const [where, text] of places) expect(text, `${where} lacks "${CEILING}"`).toContain(CEILING);
    holdsAll(usedUp().slice("- ".length), "used-up stop", ["The same stop applies before a fourth hand-off on one ticket."]);
    holdsAll(section(TECH_LEAD, "Stop when"), "tech-lead.md `## Stop when`", [
      "Stop the same way before a fourth hand-off on one ticket.",
    ]);
    expect(WF04.split("checkpoint: ").length - 1).toBe(2);
    expect(stops).toHaveLength(6);
  });

  // Quick 261031-oxi (Olger Oeselg, 2026-10-31) closes the hand-off loop defects the first-time-reader
  // re-trace found after quick 261031-nd9. Shared sentences for cases (s) to (w).
  const HAND_BACK = "On approval, hand the ticket back to the proposing role to make the change.";
  const PROPOSE = "Only propose a fundamental fix: leave the requirement, rule, ADR or `checkpoints` value unchanged until a named human approves.";
  const DEFINITION = "Altering a business rule, a hard limit, a `checkpoints` value or an ADR is fundamental too.";
  const RESOLVED_MOVE = "After `Resolved:`, move the ticket out of `Blocked`: to `Backlog` after a split, otherwise to `Ready for Dev`.";
  const LEVEL_STANDS = "The human's level stands, even past the move limits.";
  const STOP_HOLD = "After a `Stop: human` move note at `checkpoints.escalate_unadjudicable_result: block`, wait also for a `Confirmed: yes` finding naming it.";
  const CHECK_NEW = "At the step 2 re-plan, the Tech Lead checks the diff behind every `Resolved:` note against this definition.";
  // Quick 261031-rhv R3 (Olger Oeselg, 2026-10-31): the check passes a fundamental change only on a
  // hand-off note that carries `Approved:`.
  const TREAT_NEW = "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`.";
  const RECORD_BACK = "Record either hand-back as `Move: hand-off` with `Stop: human`; it counts toward no limit.";

  // Quick 261031-oxi defect 1 (Olger Oeselg, 2026-10-31): an approved fundamental change no longer
  // re-blocks itself.
  it("(s) defect 1: an approved fundamental change names the `Approved:` hand-off note and passes the check (quick 261031-oxi; wording per quick 261031-rhv R3)", () => {
    const s17 = stepAt(STEP17).text;
    // Quick 261031-rhv R3 (Olger Oeselg, 2026-10-31): the `Resolved:` answer names the hand-off note
    // that carries the human's `Approved:` line.
    const APPROVED = "Once a named human approves, make the change and answer `Resolved:`, naming the hand-off note that carries `Approved:`.";
    holdsAll(s17, "step 17", [PROPOSE, APPROVED, TREAT_NEW]);
    expect(s17.indexOf(APPROVED)).toBeGreaterThan(s17.indexOf(PROPOSE));
    const stop = subAt("Apply the human stop.");
    holdsAll(stop, "human-stop sub-bullet", [HAND_BACK, RECORD_BACK, LEVEL_STANDS]);
    expect(stop.indexOf(RECORD_BACK)).toBeGreaterThan(stop.indexOf(HAND_BACK));
    expect(stop.indexOf(RECORD_BACK)).toBeLessThan(stop.indexOf(LEVEL_STANDS));
  });

  // Quick 261031-oxi defect 2 (Olger Oeselg, 2026-10-31): a rejected `Fundamental:` proposal has a branch.
  it("(t) defect 2: a rejected `Fundamental:` proposal follows the human's move or goes back to the proposing role (quick 261031-oxi)", () => {
    const stop = subAt("Apply the human stop.");
    const REJECT = "On rejection, apply the move the human names.";
    const WITHOUT = "Without one, hand the ticket back to the proposing role to fix it within the current requirement and rules.";
    holdsAll(stop, "human-stop sub-bullet", [HAND_BACK, REJECT, WITHOUT, RECORD_BACK]);
    expect(stop.indexOf(HAND_BACK)).toBeLessThan(stop.indexOf(REJECT));
    expect(stop.indexOf(REJECT)).toBeLessThan(stop.indexOf(WITHOUT));
    expect(stop.indexOf(WITHOUT)).toBeLessThan(stop.indexOf(RECORD_BACK));
    const para = escalateParagraph();
    for (const sentence of [
      "On approval it hands the ticket back to the proposing role to make the change.",
      "On rejection it applies the move the human names, or else hands the ticket back to fix it within the current requirement and rules.",
      "Neither hand-back counts toward a limit.",
    ]) {
      expect(para, `config paragraph lacks "${sentence}"`).toContain(sentence);
    }
  });

  // Quick 261031-oxi defect 3 (Olger Oeselg, 2026-10-31): the `Resolved:` check runs at the step 2
  // re-plan, the path `Resolved:` really takes, and reads the diff.
  it("(u) defect 3: the `Resolved:` check reads the diff at the step 2 re-plan and an unapproved change is reverted (quick 261031-oxi)", () => {
    const s17 = stepAt(STEP17).text;
    // Quick 261031-rhv R1 (Olger Oeselg, 2026-10-31): the revert is a recorded hand-off to the role that
    // made the change.
    const REVERT = "Otherwise the Tech Lead returns the ticket to `Blocked` and applies the hand-off to the role that made the change.";
    holdsAll(s17, "step 17", [DEFINITION, CHECK_NEW, TREAT_NEW, REVERT, RESOLVED_MOVE]);
    const order = [DEFINITION, CHECK_NEW, TREAT_NEW, REVERT, RESOLVED_MOVE].map((x) => s17.indexOf(x));
    for (let i = 1; i < order.length; i++) expect(order[i] as number).toBeGreaterThan(order[i - 1] as number);
    expect(s17).not.toContain("Before step 16 dispatches");
  });

  // Quick 261031-oxi defect 4 (Olger Oeselg, 2026-10-31): after `Resolved:`, a level raise at the re-plan
  // is the one escalation, and a raise past the spent escalation reaches the human stop.
  it("(v) defect 4: a re-plan raise is the one escalation, and a raise past it returns the ticket to the human stop (quick 261031-oxi)", () => {
    const s17 = stepAt(STEP17).text;
    const BIND = "The step 15 move limits bind that plan: record a level raise in it as `Move: escalate`.";
    const RAISE_ONE = "The raise counts as the one escalation per ticket.";
    const RAISE_PAST = "For a raise past the spent escalation, the Tech Lead returns the ticket to `Blocked` and applies the human stop.";
    const OWNER = "After `Disputed:` or `Fundamental:`, name the Tech Lead as the `## Blocked` owner again.";
    holdsAll(s17, "step 17", [BIND, RAISE_ONE, RAISE_PAST, OWNER]);
    expect(s17.indexOf(RAISE_ONE)).toBeGreaterThan(s17.indexOf(BIND));
    expect(s17.indexOf(RAISE_PAST)).toBeGreaterThan(s17.indexOf(RAISE_ONE));
    expect(s17.indexOf(OWNER)).toBeGreaterThan(s17.indexOf(RAISE_PAST));
  });

  // Quick 261031-oxi defect 5 (Olger Oeselg, 2026-10-31): a ticket parked at `notify` or `off` resumes
  // once a human answers.
  it("(w) defect 5: a ticket parked at `notify` or `off` follows the `block` path once a human answers (quick 261031-oxi)", () => {
    const RESUME = "At `notify` or `off`, once a human answers, follow the `block` path: the move record, the confirmation and step 16.";
    expect(subAt("Apply the human stop.").endsWith(RESUME)).toBe(true);
    const s16 = stepAt(STEP16).text;
    const WAIT = "Wait the same way at `notify` or `off` once a human answers.";
    holdsAll(s16, "step 16", [STOP_HOLD, WAIT]);
    expect(s16.indexOf(WAIT)).toBeGreaterThan(s16.indexOf(STOP_HOLD));
    const PARKED_NEW = "At `notify` or `off`, that stop leaves the ticket in `Blocked` with no move and no re-enqueue until a human answers.";
    expect(usedUp()).toContain(PARKED_NEW);
    expect(usedUp().endsWith(`${PARKED_NEW} \`checkpoint: escalate_unadjudicable_result\``)).toBe(true);
    const para = escalateParagraph();
    for (const sentence of [
      "at `notify` or `off` the ticket stays in `Blocked` with no move until a human answers.",
      "Once a human answers, the Tech Lead proceeds as at `block`, from the move record through Workflow 04 step 16.",
    ]) {
      expect(para, `config paragraph lacks "${sentence}"`).toContain(sentence);
    }
    expect(section(TECH_LEAD, "Stop when")).toContain(
      "At `notify` or `off`, leave it in `Blocked` with no move until a human answers.",
    );
  });

  // Quick 261031-oxi defect 6 (Olger Oeselg, 2026-10-31): the per-ticket ceiling reads "before a fourth
  // hand-off on one ticket" everywhere, so its timing has one reading; no stop or tag moves.
  it("(x) defect 6: the per-ticket ceiling stops before a fourth hand-off on one ticket in every place (quick 261031-oxi)", () => {
    const OLD = "three hand-offs on one ticket";
    for (const [name, text] of [
      ["Workflow 04", WF04],
      ["tech-lead.md", TECH_LEAD],
      ["factory.config.md", CONFIG],
    ] as const) {
      expect(text, `${name} still carries "${OLD}"`).not.toContain(OLD);
    }
    const row = CONFIG.split("\n").filter((l) => l.startsWith("| `escalate_unadjudicable_result` |"));
    expect(row).toHaveLength(1);
    expect(row[0]).toContain(", or before a fourth hand-off on one ticket,");
    const para = escalateParagraph();
    expect(para).toContain("The same holds before a fourth hand-off on one ticket.");
    // Plan 41-02 (D-21): the sentence split, because the Orchestrator asks and the Tech Lead does not.
    expect(para).toContain("It stops the same way before a fourth hand-off on one ticket.");
    expect(para).toContain("The Orchestrator asks the human to approve or reject a `Fundamental:` proposal.");
    expect(WF04.split("checkpoint: ").length - 1).toBe(2);
    expect(stops).toHaveLength(6);
  });

  // Quick 261031-oxi defect 7 (Olger Oeselg, 2026-10-31): the Orchestrator queues the Tech Lead after the
  // first block and after `Resolved:`, in the same words as the D3 queue sentence.
  it("(y) defect 7: the Orchestrator queues the Tech Lead after the first block and after `Resolved:` (quick 261031-oxi)", () => {
    const s14 = stepAt("Record a `failed-attempt` note").text;
    const OWNER14 = "Add a `## Blocked` bullet naming the Tech Lead as the owner who clears it.";
    const QUEUE14 = "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that `failed-attempt` note at step 15.";
    holdsAll(s14, "step 14", [OWNER14, QUEUE14]);
    expect(s14.indexOf(QUEUE14)).toBeGreaterThan(s14.indexOf(OWNER14));
    const s15 = stepAt(STEP15).text;
    // Quick 261031-rhv R2 (Olger Oeselg, 2026-10-31): any answer note that queued the Tech Lead is read,
    // the Orchestrator's record of a human's answer included.
    const READ_ANSWER = "When an answer note queued the Tech Lead, read that note too.";
    holdsAll(s15, "step 15", [READ_ANSWER]);
    expect(s15.startsWith(STEP15)).toBe(true);
    expect(s15.indexOf(READ_ANSWER)).toBeLessThan(s15.indexOf("Choose one:"));
    const lead = lines[at15] as string;
    expect(lead.startsWith(`15. ${STEP15}`)).toBe(true);
    expect(lead).not.toContain("named human");
    const s17 = stepAt(STEP17).text;
    const QUEUE_RESOLVED = "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that answer note at step 2.";
    const REPLAN = "The Tech Lead then plans it again per step 2 before any pull.";
    holdsAll(s17, "step 17", [RESOLVED_MOVE, QUEUE_RESOLVED, REPLAN]);
    expect(s17.indexOf(QUEUE_RESOLVED)).toBeGreaterThan(s17.indexOf(RESOLVED_MOVE));
    expect(s17.indexOf(REPLAN)).toBeGreaterThan(s17.indexOf(QUEUE_RESOLVED));
  });
  // Quick 261031-rhv (Olger Oeselg, 2026-10-31) closes R1-R3 from the second re-trace. Shared sentences
  // for cases (z) to (ab).
  const PASS_RULE = "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`.";
  const APPROVED_NOTE = "Once a named human approves, make the change and answer `Resolved:`, naming the hand-off note that carries `Approved:`.";
  const REVERT_HANDOFF = "Otherwise the Tech Lead returns the ticket to `Blocked` and applies the hand-off to the role that made the change.";
  const READ_ANY = "When an answer note queued the Tech Lead, read that note too.";

  // Quick 261031-rhv R1 (Olger Oeselg, 2026-10-31): the revert of an unapproved fundamental change is a
  // recorded hand-off, so it counts toward the per-ticket ceiling and step 16 dispatches it.
  it("(z) R1: an unapproved fundamental change goes back through a recorded hand-off that counts like any other (quick 261031-rhv)", () => {
    const s17 = stepAt(STEP17).text;
    const REVERT_NOTE = "Its `Move: hand-off` note keeps the cause's `Cause-id:` line and states the reason: revert the unapproved change.";
    const REVERT_COUNTS = "That hand-off counts like any other, and step 16 dispatches it.";
    const seq = [CHECK_NEW, TREAT_NEW, REVERT_HANDOFF, REVERT_NOTE, REVERT_COUNTS, RESOLVED_MOVE];
    expect(TREAT_NEW).toBe(PASS_RULE);
    holdsAll(s17, "step 17", seq);
    const order = seq.map((x) => s17.indexOf(x));
    for (let i = 1; i < order.length; i++) expect(order[i] as number).toBeGreaterThan(order[i - 1] as number);
    expect(s17).not.toContain("subtask for the role that made the change");
    holdsAll(subAt("Apply the hand-off."), "hand-off sub-bullet", [
      "Add a `## Blocked` bullet naming that role as the owner who clears it.",
    ]);
    holdsAll(subAt("Apply the human stop."), "human-stop sub-bullet", [
      "Apply it also before a fourth hand-off on one ticket.",
      RECORD_BACK,
    ]);
    holdsAll(stepAt(STEP16).text, "step 16", ["For a hand-off, take the adapter of the role on the `To:` line."]);
  });

  // Quick 261031-rhv R2 (Olger Oeselg, 2026-10-31; "grugops orchestrator is the one who notifies tech
  // lead"): once a human answers the human stop, the Orchestrator records the answer and queues the
  // Tech Lead, at every value of the cell.
  it("(aa) R2: once a human answers the human stop, the Orchestrator records the answer and queues the Tech Lead at every value (quick 261031-rhv)", () => {
    const stop = subAt("Apply the human stop.");
    const ask = subAt(ASK);
    const APPROVE = "After a `Fundamental:` note, ask the human to approve or reject the proposed change.";
    const RECORD_ANSWER = "At every value, the Orchestrator records the answer in a `decision` note per Workflow 16, naming the human.";
    const QUEUE_ANSWER = "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that note at step 15.";
    // Plan 41-02 (D-21): the three sentences moved to the ask-once sub-bullet, word for word and in this
    // order. The hand-back stays in the human stop, and each sentence now sits in step 15 exactly once.
    const seq = [APPROVE, RECORD_ANSWER, QUEUE_ANSWER];
    holdsAll(ask, "ask-once sub-bullet", seq);
    const order = seq.map((x) => ask.indexOf(x));
    for (let i = 1; i < order.length; i++) expect(order[i] as number).toBeGreaterThan(order[i - 1] as number);
    holdsAll(stop, "human-stop sub-bullet", [HAND_BACK]);
    for (const sentence of seq) expect(stepAt(STEP15).text.split(sentence)).toHaveLength(2);
    expect(
      stop.endsWith("At `notify` or `off`, once a human answers, follow the `block` path: the move record, the confirmation and step 16."),
    ).toBe(true);
    holdsAll(stepAt(STEP15).text, "step 15", [READ_ANY]);
    expect(escalateParagraph()).toContain(
      "Under every value, once a human answers at the human stop, the Orchestrator records the answer in a `decision` note and queues the Tech Lead.",
    );
  });

  // Quick 261031-rhv R3 (Olger Oeselg, 2026-10-31): the hand-back after a `Fundamental:` proposal says
  // whether the human approved or rejected it, and the receiving role acts on that line.
  it("(ab) R3: the move note carries the human's `Approved:` or `Rejected:` verdict, and the receiving role acts on it (quick 261031-rhv)", () => {
    const rec = subAt("Record the move in a new `decision` note per Workflow 16.");
    const STOP_LINE = "Put the line `Stop: human` under the `Move:` line when the human stop applied.";
    // Plan 41-02 (D-24): the line also names the `Fundamental:` note it answers.
    const VERDICT = "After the human approves or rejects a `Fundamental:` proposal, add an `Approved:` or `Rejected:` line.";
    const VERDICT_NAMES = "Name the human and the id of the `Fundamental:` note it answers on that line.";
    holdsAll(rec, "move-record sub-bullet", [STOP_LINE, VERDICT, VERDICT_NAMES]);
    expect(rec.indexOf(STOP_LINE)).toBeLessThan(rec.indexOf(VERDICT));
    expect(rec.indexOf(VERDICT)).toBeLessThan(rec.indexOf(VERDICT_NAMES));
    const s17 = stepAt(STEP17).text;
    const REJECTED_NOTE = "When the hand-off note carries `Rejected:`, fix the cause within the current requirement and rules.";
    const seq = [PROPOSE, APPROVED_NOTE, REJECTED_NOTE, DEFINITION, TREAT_NEW];
    holdsAll(s17, "step 17", seq);
    const order = seq.map((x) => s17.indexOf(x));
    for (let i = 1; i < order.length; i++) expect(order[i] as number).toBeGreaterThan(order[i - 1] as number);
    expect(WF04).not.toContain("approval `finding`");
  });

  // Quick 261031-rhv R4 (Olger Oeselg, 2026-10-31): a raise past the spent escalation applies the human
  // stop in WF04 step 15, step 17, the used-up stop, tech-lead.md and the config row and paragraph, and
  // the Tech Lead publishes no plan note naming that level before the human answers.
  it("(ac) R4: a raise past the spent escalation applies the human stop everywhere, and no plan note names that level first (quick 261031-rhv)", () => {
    holdsAll(subAt("Apply the hand-off."), "hand-off sub-bullet", [
      "Used up also covers scores calling for more than one level while the escalation is unspent.",
    ]);
    const stop = subAt("Apply the human stop.");
    const CEILING = "Apply it also before a fourth hand-off on one ticket.";
    const RAISE_TRIGGER = "Apply it also when the scores call for a raise past the spent escalation.";
    const ROUND = "A round is a `Disputed:` `decision` note naming a hand-off note for the same cause.";
    holdsAll(stop, "human-stop sub-bullet", [CEILING, RAISE_TRIGGER, ROUND]);
    expect(stop.indexOf(CEILING)).toBeLessThan(stop.indexOf(RAISE_TRIGGER));
    expect(stop.indexOf(RAISE_TRIGGER)).toBeLessThan(stop.indexOf(ROUND));
    expect(WF04).not.toContain("or for a raise");

    const s17 = stepAt(STEP17).text;
    const RAISE_PAST = "For a raise past the spent escalation, the Tech Lead returns the ticket to `Blocked` and applies the human stop.";
    const NO_PLAN = "It publishes no plan note naming the raised level before the human answers.";
    const OWNER = "After `Disputed:` or `Fundamental:`, name the Tech Lead as the `## Blocked` owner again.";
    holdsAll(s17, "step 17", [RAISE_PAST, NO_PLAN, OWNER]);
    expect(s17.indexOf(RAISE_PAST)).toBeLessThan(s17.indexOf(NO_PLAN));
    expect(s17.indexOf(NO_PLAN)).toBeLessThan(s17.indexOf(OWNER));

    const used = usedUp().slice("- ".length);
    const STOP_CEILING = "The same stop applies before a fourth hand-off on one ticket.";
    const STOP_RAISE = "The same stop applies when the scores call for a raise past the spent escalation.";
    holdsAll(used, "used-up stop", [
      "It also means the scores call for more than one level while the escalation is unspent.",
      STOP_CEILING,
      STOP_RAISE,
    ]);
    expect(used.indexOf(STOP_CEILING)).toBeLessThan(used.indexOf(STOP_RAISE));

    const limits = section(TECH_LEAD, "Stop when");
    const SECOND = "Stop the same way before a second escalation.";
    const FOURTH = "Stop the same way before a fourth hand-off on one ticket.";
    holdsAll(limits, "tech-lead.md `## Stop when`", [SECOND, FOURTH]);
    expect(limits.indexOf(SECOND)).toBeLessThan(limits.indexOf(FOURTH));
    expect(limits).not.toContain("Never escalate a ticket twice on your own.");

    const row = CONFIG.split("\n").filter((l) => l.startsWith("| `escalate_unadjudicable_result` |"));
    expect(row).toHaveLength(1);
    expect(row[0]).toContain(", or whose scores call for a raise past the spent escalation.");
    const para = escalateParagraph();
    for (const sentence of [
      "or the scores call for more than one level while the escalation is unspent.",
      "The same holds when the scores call for a raise past the spent escalation.",
      "It stops the same way when the scores call for a raise past the spent escalation.",
    ]) {
      expect(para, `config paragraph lacks "${sentence}"`).toContain(sentence);
    }
    expect(CONFIG).not.toContain("or for a raise after the escalation is spent");
    expect(WF04.split("checkpoint: ").length - 1).toBe(2);
    expect(stops).toHaveLength(6);
  });
});

describe("the lean close keeps its human conditions (CR-02, WR-02; D-33)", () => {
  /**
   * The text that states the Orchestrator's `In UAT → Done` close: the `## Board moves` line that
   * holds the pair, plus any lines after it up to a blank line or the next `You own`/`You enforce`
   * line. The partition guard checks who owns a pair, never its condition, so this pins the condition.
   */
  function leanClose(): string {
    const lines = section(ORCHESTRATOR, "Board moves").split("\n");
    const start = lines.findIndex((l) => l.includes("`In UAT → Done`"));
    expect(start, "orchestrator.md `## Board moves` has no `In UAT → Done` line").toBeGreaterThanOrEqual(0);
    const out = [lines[start] ?? ""];
    for (const l of lines.slice(start + 1)) {
      if (l.trim() === "" || l.startsWith("You own") || l.startsWith("You enforce")) break;
      out.push(l);
    }
    return out.join(" ");
  }

  it("CR-02, WR-03: the lean close is the exact sentence: the named human's sign-off, a human merge and the lean DoD", () => {
    const close = leanClose();
    expect(close, "the lean close lost its owner sentence").toContain("You own `In UAT → Done`, the lean-mode close.");
    expect(leanCloseViolations(ORCHESTRATOR), `the lean close is not "${CLOSE_SENTENCE}"`).not.toContain("close");
  });

  it("CR-02, WR-03: `## Stop when` holds the ticket in `In UAT` with the exact item: no human merge or no named human's sign-off", () => {
    expect(leanCloseViolations(ORCHESTRATOR), `no \`## Stop when\` item is "${HOLD_ITEM}"`).not.toContain("hold");
  });

  it("CR-02: the lean Definition of Done needs the PR merged by a human", () => {
    const bullets = LEAN_DOD.split("\n").filter((l) => l.startsWith("- "));
    expect(bullets.filter((l) => l.includes("merged by a human"))).toHaveLength(1);
  });

  it("D-33: the seed board's Done entry is unchanged", () => {
    const row = SEED_BOARD.split("\n").filter((l) => l.startsWith("| Done |"));
    expect(row).toHaveLength(1);
    expect(row[0]).toContain("merged + released (or merged, lean)");
  });

  /** The sentences of a text: split at each line break and after each full stop. */
  function sentences(text: string): string[] {
    return text
      .split(/\n|(?<=\.)\s+/)
      .map((t) => t.trim())
      .filter((t) => t !== "");
  }

  it("WR-02: the UAT Planner owns `In UAT → Ready to Release` in enterprise mode only and hands the lean close to the Orchestrator", () => {
    const moves = sentences(section(UAT_PLANNER, "Board moves"));
    const forward = moves.filter((t) => t.includes("`In UAT → Ready to Release`"));
    expect(forward, "uat-planner.md `## Board moves` lost the forward pair").toHaveLength(1);
    expect(forward[0]).toContain("enterprise");
    const lean = moves.filter((t) => t.includes("lean") && t.includes("`In UAT`") && t.includes("Orchestrator"));
    expect(lean, "no uat-planner.md `## Board moves` sentence leaves the lean ticket in `In UAT` for the Orchestrator").toHaveLength(1);
  });

  it("WR-02: the UAT Planner's done stop names the Release Manager for enterprise and the Orchestrator for lean", () => {
    const done = section(UAT_PLANNER, "Stop when")
      .split("\n")
      .filter((l) => l.startsWith("- ") && l.includes("stop done"));
    expect(done).toHaveLength(1);
    for (const phrase of ["enterprise", "Release Manager", "lean", "Orchestrator"]) {
      expect(done[0], `the done stop lacks "${phrase}"`).toContain(phrase);
    }
  });

  it("WR-02: Workflow 06 `## Board moves` and `## Done condition` name the Orchestrator's lean close", () => {
    const moves = section(WF06, "Board moves");
    expect(moves).toContain("Orchestrator");
    expect(moves).toContain("merged");
    expect(section(WF06, "Done condition")).toContain("Orchestrator");
  });

  it("WR-02: Workflow 06 no longer offers the UAT Planner a direct move to `Done` in lean mode", () => {
    for (const heading of ["Board moves", "Done condition"]) {
      const body = section(WF06, heading);
      expect(body, `${heading} keeps the old lean parenthetical`).not.toContain("or directly to `Done` in lean mode");
      expect(body, `${heading} keeps the old lean parenthetical`).not.toContain("(or to `Done` in lean mode)");
      expect(body, `${heading} still sends the ticket to \`Done\` in lean mode`).not.toMatch(/`Done`\)? in lean mode/);
      expect(body, `${heading} keeps the stale lean-path sentence`).not.toContain("straight to `Done`");
    }
  });
});

describe("the lean close waits for the named human (WR-03, WR-08, WR-09; human decisions 2026-11-02 and 2026-11-03)", () => {
  it("WR-03, WR-09: Workflow 06 says the Orchestrator's lean close waits for the same sign-off", () => {
    expect(section(WF06, "Board moves")).toContain(WF06_LEAN_CLOSE);
  });

  it("WR-03: Workflow 06 says the dial never removes the human merge", () => {
    expect(section(WF06, "Board moves")).toContain("never removes the human merge");
  });

  it("WR-03: Workflow 06 names what `notify` and `off` do, and the `observation` an unstamped record becomes", () => {
    const moves = section(WF06, "Board moves");
    for (const token of ["`notify`", "`off`", "`observation`"]) {
      expect(moves, `Workflow 06 \`## Board moves\` lacks ${token}`).toContain(token);
    }
  });

  it("PLAIN-03: Workflow 06 keeps the zero-config posture at the named human", () => {
    expect(section(WF06, "Board moves")).toContain("The zero-config posture stops there");
  });

  it("WR-01: the live Orchestrator has no lean-close violation", () => {
    expect(leanCloseViolations(ORCHESTRATOR)).toEqual([]);
  });
});

describe("WR-01: dropping a lean-close condition is red (mutation cases)", () => {
  /** ORCHESTRATOR with each [from, to] replacement applied once. A plant that changes nothing fails. */
  function mutate(pairs: [string, string][]): string {
    let text = ORCHESTRATOR;
    for (const [from, to] of pairs) {
      const next = text.replace(from, to);
      expect(next, `the plant "${from}" changed nothing`).not.toBe(text);
      text = next;
    }
    return text;
  }

  it("WR-01: the live Orchestrator gives no violation", () => {
    expect(leanCloseViolations(ORCHESTRATOR)).toEqual([]);
  });

  it("WR-01: the reviewer's mutation of both lines is red on the close and the hold", () => {
    const mutated = mutate([
      [
        CLOSE_SENTENCE,
        "Close once a human merged the PR; the named human may sign off later (`checkpoint: sign_off_acceptance`), and `agent-factory/checklists/definition-of-done.md` holds.",
      ],
      [HOLD_ITEM, "- If no human has merged the PR, leave the ticket in `In UAT`."],
    ]);
    const found = leanCloseViolations(mutated);
    expect(found).toContain("close");
    expect(found).toContain("hold");
  });

  it("WR-01: dropping only the sign-off clause from the close is red", () => {
    const mutated = mutate([[CLOSE_SENTENCE, CLOSE_SENTENCE.replace("the named human signed off acceptance, ", "")]]);
    expect(leanCloseViolations(mutated)).toEqual(["close"]);
  });

  it("WR-01: dropping only the merge clause from the close is red", () => {
    const mutated = mutate([[CLOSE_SENTENCE, CLOSE_SENTENCE.replace("a human merged the PR and ", "")]]);
    expect(leanCloseViolations(mutated)).toEqual(["close"]);
  });

  it("WR-01: dropping only the sign-off condition from the hold is red", () => {
    const mutated = mutate([[HOLD_ITEM, HOLD_ITEM.replace(" or the named human has not signed off acceptance", "")]]);
    expect(leanCloseViolations(mutated)).toEqual(["hold"]);
  });

  it("WR-01: dropping only the merge condition from the hold is red", () => {
    const mutated = mutate([[HOLD_ITEM, HOLD_ITEM.replace("a human has not merged the PR or ", "")]]);
    expect(leanCloseViolations(mutated)).toEqual(["hold"]);
  });

  it("WR-08 (plan 40-23): the plan 40-17 close sentence is red if it comes back", () => {
    const mutated = mutate([[CLOSE_SENTENCE, PLAN_40_17_CLOSE]]);
    expect(leanCloseViolations(mutated)).toEqual(["close"]);
  });

  it("WR-08 (plan 40-23): the plan 40-17 hold is red if it comes back", () => {
    const mutated = mutate([[HOLD_ITEM, PLAN_40_17_HOLD]]);
    expect(leanCloseViolations(mutated)).toEqual(["hold"]);
  });
});

describe("WR-09 (plan 40-23): the UAT Planner's named-human sign-off is unconditional in the role and in Workflow 06 (human decision 2026-11-03)", () => {
  it("WR-09: uat-planner.md `## Board moves` gives the enterprise move to the named human's sign-off", () => {
    expect(section(UAT_PLANNER, "Board moves")).toContain(
      "In enterprise mode, you own `In UAT → Ready to Release` once the named human signs off the scenarios.",
    );
  });

  it("WR-09: uat-planner.md `## Hard limits` needs a named human sign-off and bans self-signing", () => {
    const limits = section(UAT_PLANNER, "Hard limits");
    expect(limits).toContain("Acceptance needs a named human sign-off.");
    expect(limits).toContain("Never self-sign: an agent that signs removes the one human the gate exists for.");
  });

  it("WR-09: uat-planner.md `## Stop when` leaves an unclear result for a named human and stops done after the sign-off", () => {
    const stops = section(UAT_PLANNER, "Stop when");
    expect(stops).toContain("- When a result is ambiguous or unmet, stop and leave the ticket in `In UAT` for a named human.");
    expect(stops).toContain(
      "- After the human signs off, stop done: the Release Manager takes it in enterprise mode, the Orchestrator in lean.",
    );
  });

  it("WR-09: no uat-planner.md sign-off section makes the sign-off follow `sign_off_acceptance`", () => {
    for (const heading of ["Board moves", "Hard limits", "Stop when"]) {
      expect(section(UAT_PLANNER, heading), `uat-planner.md \`## ${heading}\` names the dial`).not.toContain("sign_off_acceptance");
    }
  });

  it("WR-09: Workflow 06 `## Board moves` says the move waits for the named human at every value and the dial only shapes the lean close record", () => {
    const moves = section(WF06, "Board moves");
    expect(moves).toContain(WF06_SIGN_OFF);
    expect(moves).toContain(WF06_DIAL);
    expect(moves).toContain("In enterprise mode, the UAT Planner moves the ticket to `Ready to Release` once the named human signs off.");
  });

  it("WR-09: Workflow 06 `## Board moves` drops every old claim that the dial lowers the sign-off", () => {
    const moves = section(WF06, "Board moves");
    for (const phrase of ["governs both", "the dial changes who signs", "trusts its machine-backed evidence", "the move or close proceeds"]) {
      expect(moves, `Workflow 06 \`## Board moves\` keeps "${phrase}"`).not.toContain(phrase);
    }
  });
});

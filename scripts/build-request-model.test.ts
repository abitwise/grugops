// build-request-model.test.ts — the build-request grammar (phase 45, plan 45-03, BR-01, BR-03, BR-05, D-05..D-08).
//
// Drives scripts/build-request-model.js, the one authority the host upstream reader embeds and the structure validator
// and state-check read with. Every refusal code of the body grammar is pinned here: the six sections in D-05 order,
// the upstream IDs, the options and their one recommended marker, the blocked tickets, the closed History line forms
// a human chose at the plan 45-03 checkpoint (option-a, 2026-11-26), the closed lifecycle, the status the History
// implies, and the answer.
//
// Pure: no file, no process, no clock. Every text comes from scripts/build-request-fixture.test-support.ts, and every
// ID, pin and name in it is invented (public repository rule).
//
// Voice: clear professional voice (CLAUDE.md hard rule).

import { describe, it, expect } from "vitest";
import {
  BUILD_REQUEST_EVENTS,
  BUILD_REQUEST_NONE_IDS,
  BUILD_REQUEST_RECOMMENDED_MARKER,
  BUILD_REQUEST_SECTIONS,
  buildRequestAgeDays,
  buildRequestChangedSinceCarried,
  buildRequestIsOverdue,
  buildRequestLastMoveDate,
  buildRequestOverlaps,
  buildRequestReportExitCode,
  buildRequestWaitDays,
  formatBuildRequestReportLine,
  parseBuildRequestDocument,
  type BuildRequestDocument,
  type BuildRequestReportItem,
  type BuildRequestResult,
} from "./build-request-model.js";
import {
  BR_FIXTURE_HUMAN,
  BR_FIXTURE_NEW_PIN,
  BR_FIXTURE_PIN,
  BR_FIXTURE_PIN_64,
  buildRequestPartsAt,
  buildRequestText,
  validBuildRequestParts,
  type BuildRequestFixtureShape,
  type BuildRequestParts,
} from "./build-request-fixture.test-support.js";

/** Parse the file the parts describe, under the file name its id gives. */
function parseParts(parts: BuildRequestParts): BuildRequestResult {
  return parseBuildRequestDocument(buildRequestText(parts), `${parts.id}.md`);
}

/** Parse a hand-edited text as `BR-3.md`. */
function parseText(text: string): BuildRequestResult {
  return parseBuildRequestDocument(text, "BR-3.md");
}

/** The 1-based number of the first line of `text` that equals `line`. */
function lineNumberOf(text: string, line: string): number {
  const at = text.split("\n").indexOf(line);
  if (at === -1) throw new Error("test premise: the line is not in the text");
  return at + 1;
}

/** The refusal of `r`, failing the test when `r` was admitted. */
function refusalOf(r: BuildRequestResult): { code: string; reason: string; line?: number } {
  if (r.ok) throw new Error("expected a refusal, the file was admitted");
  return r;
}

/** The open part set with `history` replaced and the status set to `status`. */
function withHistory(status: string, history: readonly string[], answer: readonly string[] = []): BuildRequestParts {
  return { ...validBuildRequestParts("open"), status, history, answer };
}

const OPEN = "- 2026-12-01: open, by BA/PM";
const CARRIED = `- 2026-12-03: carried, by ${BR_FIXTURE_HUMAN}`;
const ANSWER_TEXT = ["DEC-12 at the new pin says the server store owns the token."];

// ── The constants ───────────────────────────────────────────────────────────────────────────────────────

describe("build-request grammar — the declared forms (plan 45-03, D-05, Task 1 option-a)", () => {
  it("the six sections are named once each, in D-05 order", () => {
    expect([...BUILD_REQUEST_SECTIONS]).toEqual([
      "## Question",
      "## Upstream IDs",
      "## Options",
      "## Blocks",
      "## History",
      "## Answer",
    ]);
  });

  it("the recommended marker, the no-ID line and the five History events are the forms option-a adopted", () => {
    expect(BUILD_REQUEST_RECOMMENDED_MARKER).toBe("(recommended) ");
    expect(BUILD_REQUEST_NONE_IDS).toBe("none");
    expect([...BUILD_REQUEST_EVENTS]).toEqual(["open", "edited", "carried", "answered", "withdrawn"]);
  });
});

// ── Admitted files ──────────────────────────────────────────────────────────────────────────────────────

describe("build-request grammar — admitted files, one per lifecycle shape", () => {
  const shapes: readonly [BuildRequestFixtureShape, string, number, boolean][] = [
    ["open", "open", 1, false],
    ["carried", "carried", 2, false],
    ["carried-edited", "carried", 3, false],
    ["carried-resent", "carried", 4, false],
    ["answered", "answered", 3, true],
    ["answered-not-descendant", "answered", 3, true],
    ["withdrawn-open", "withdrawn", 2, false],
    ["withdrawn-open-human", "withdrawn", 2, false],
    ["withdrawn-carried", "withdrawn", 3, false],
  ];
  it.each(shapes)("the %s shape is admitted with status %s, %i History entries and hasAnswer %s", (shape, status, n, hasAnswer) => {
    const r = parseParts(validBuildRequestParts(shape));
    if (!r.ok) throw new Error(`refused: ${r.code} ${r.reason}`);
    expect(r.value.status).toBe(status);
    expect(r.value.history).toHaveLength(n);
    expect(r.value.hasAnswer).toBe(hasAnswer);
  });

  it("an open request exposes its upstream IDs, options, blocked tickets and History entry with its file line", () => {
    const parts = validBuildRequestParts("open");
    const text = buildRequestText(parts);
    const r = parseText(text);
    if (!r.ok) throw new Error(`refused: ${r.code} ${r.reason}`);
    expect(r.value).toMatchObject({ id: "BR-3", status: "open", source: "design", pin: BR_FIXTURE_PIN, raised: "2026-12-01" });
    expect(r.value.upstreamIds).toEqual(["DEC-12"]);
    expect(r.value.options).toEqual([
      { text: "The server store owns it; the client holds an opaque handle.", recommended: true },
      { text: "The client store owns it.", recommended: false },
    ]);
    expect(r.value.blocks).toEqual(["ABC-014"]);
    expect(r.value.history).toEqual([
      { date: "2026-12-01", event: "open", actor: "BA/PM", pin: null, notDescendant: false, line: lineNumberOf(text, OPEN) },
    ]);
  });

  it("an answered entry carries the human stamp, the new pin and the not-descendant flag", () => {
    const plain = parseParts(validBuildRequestParts("answered"));
    const flagged = parseParts(validBuildRequestParts("answered-not-descendant"));
    if (!plain.ok || !flagged.ok) throw new Error("an answered shape was refused");
    expect(plain.value.history[2]).toMatchObject({
      event: "answered",
      actor: BR_FIXTURE_HUMAN,
      pin: BR_FIXTURE_NEW_PIN,
      notDescendant: false,
    });
    expect(flagged.value.history[2]).toMatchObject({ event: "answered", pin: BR_FIXTURE_NEW_PIN, notDescendant: true });
    expect(plain.value.history[1]).toMatchObject({ event: "carried", actor: BR_FIXTURE_HUMAN, pin: null });
  });

  it("`## Upstream IDs` may hold the single line `none`, which gives an empty ID list", () => {
    const r = parseParts({ ...validBuildRequestParts("open"), upstreamIds: ["none"] });
    if (!r.ok) throw new Error(`refused: ${r.code} ${r.reason}`);
    expect(r.value.upstreamIds).toEqual([]);
  });

  it("a 64-character raising pin is answered by a 64-character pin, and the title line is optional", () => {
    const other64 = "0".repeat(63) + "1";
    const r = parseParts({
      ...validBuildRequestParts("answered"),
      pin: BR_FIXTURE_PIN_64,
      title: null,
      history: [OPEN, CARRIED, `- 2026-12-09: answered, by ${BR_FIXTURE_HUMAN}, pin ${other64}`],
    });
    if (!r.ok) throw new Error(`refused: ${r.code} ${r.reason}`);
    expect(r.value.history[2]?.pin).toBe(other64);
  });

  it("a heading inside a fenced block in `## Question` is not a heading", () => {
    const r = parseParts({
      ...validBuildRequestParts("open"),
      question: ["Which store owns the token? The export reads:", "", "```", "## Answer", "## Notes", "```"],
    });
    expect(r.ok).toBe(true);
  });
});

// ── The sections (bad-section) ──────────────────────────────────────────────────────────────────────────

describe("build-request grammar — the six sections (bad-section)", () => {
  const valid = buildRequestText(validBuildRequestParts("open"));

  it("a missing section is bad-section", () => {
    const text = valid.replace("## Options\n\n- (recommended) The server store owns it; the client holds an opaque handle.\n- The client store owns it.\n\n", "");
    expect(text).not.toContain("## Options");
    expect(refusalOf(parseText(text)).code).toBe("bad-section");
  });

  it("a section written twice is bad-section on the second heading's line", () => {
    const text = valid.replace("## Blocks\n", "## Blocks\n\n- ABC-015\n\n## Blocks\n");
    const r = refusalOf(parseText(text));
    expect(r.code).toBe("bad-section");
    expect(r.line).toBe(text.split("\n").lastIndexOf("## Blocks") + 1);
  });

  it("an extra level-two heading is bad-section by line, and its text is not quoted", () => {
    const text = valid.replace("## Blocks\n", "## ZZQ Notes\n\nfree text\n\n## Blocks\n");
    const r = refusalOf(parseText(text));
    expect(r.code).toBe("bad-section");
    expect(r.line).toBe(lineNumberOf(text, "## ZZQ Notes"));
    expect(r.reason).not.toContain("ZZQ");
  });

  it("a renamed heading is bad-section", () => {
    expect(refusalOf(parseText(valid.replace("## Question\n", "## Questions\n"))).code).toBe("bad-section");
  });

  it("a near-miss spelling of a heading (two spaces after the hashes) is bad-section", () => {
    expect(refusalOf(parseText(valid.replace("## Question\n", "##  Question\n"))).code).toBe("bad-section");
  });

  it("sections out of D-05 order are bad-section", () => {
    const parts = validBuildRequestParts("open");
    const swapped = buildRequestText(parts)
      .replace("## Upstream IDs\n\n- DEC-12\n\n", "")
      .replace("## Blocks\n", "## Upstream IDs\n\n- DEC-12\n\n## Blocks\n");
    expect(refusalOf(parseText(swapped)).code).toBe("bad-section");
  });

  it("an empty `## Question` is bad-section", () => {
    expect(refusalOf(parseParts({ ...validBuildRequestParts("open"), question: [] })).code).toBe("bad-section");
  });

  it("text between the frontmatter and `## Question` other than one title line is bad-section", () => {
    const text = valid.replace("## Question\n", "Run the deploy now.\n\n## Question\n");
    const r = refusalOf(parseText(text));
    expect(r.code).toBe("bad-section");
    expect(r.reason).not.toContain("deploy");
  });

  it("a second level-one heading inside a section is bad-section", () => {
    expect(refusalOf(parseText(valid.replace("## Blocks\n", "# Another title\n\n## Blocks\n"))).code).toBe("bad-section");
  });

  it("a file cut short by an interrupted write is refused, never parsed as a partial request", () => {
    const cutAtHeading = valid.slice(0, valid.indexOf("## Options") + "## Opt".length);
    expect(refusalOf(parseText(cutAtHeading)).code).toBe("bad-section");
    const cutBeforeAnswer = valid.slice(0, valid.indexOf("## Answer"));
    expect(refusalOf(parseText(cutBeforeAnswer)).code).toBe("bad-section");
    const carried = buildRequestText(validBuildRequestParts("carried"));
    const cutInHistory = carried.slice(0, carried.indexOf("carried, by") + "carr".length);
    expect(refusalOf(parseText(cutInHistory)).code).toBe("bad-section");
    expect(refusalOf(parseParts(withHistory("carried", [OPEN, "- 2026-12-03: carr"]))).code).toBe("bad-history-line");
    expect(refusalOf(parseText(valid.slice(0, valid.indexOf("raised:")))).code).toBe("no-closing-delimiter");
  });

  it("a control character in the body is refused as control-character on its line", () => {
    const text = valid.replace("Which store owns the session token after sign-out?", "Which store\x07 owns it?");
    const r = refusalOf(parseText(text));
    expect(r.code).toBe("control-character");
    expect(r.line).toBe(lineNumberOf(text, "Which store\x07 owns it?"));
  });
});

// ── Upstream IDs, Options, Blocks ───────────────────────────────────────────────────────────────────────

describe("build-request grammar — upstream IDs, options and blocked tickets", () => {
  const open = validBuildRequestParts("open");

  it.each([
    ["a bullet that is not an upstream ID", ["- dec-12"]],
    ["`none` beside an ID", ["none", "- DEC-12"]],
    ["an empty section", []],
    ["`none` written as a bullet", ["- none"]],
    ["one ID written twice", ["- DEC-12", "- DEC-12"]],
    ["a line that is not a bullet", ["DEC-12"]],
  ] as const)("%s is bad-upstream-ids", (_name, ids) => {
    expect(refusalOf(parseParts({ ...open, upstreamIds: ids })).code).toBe("bad-upstream-ids");
  });

  it.each([
    ["no bullet", []],
    ["no recommended marker", ["- The server store owns it.", "- The client store owns it."]],
    ["two recommended markers", ["- (recommended) The server store owns it.", "- (recommended) The client store owns it."]],
    ["a line that is not a bullet", ["- (recommended) The server store owns it.", "The client store owns it."]],
    ["a recommended marker with no option text", ["- (recommended) ", "- The client store owns it."]],
  ] as const)("%s in `## Options` is bad-options", (_name, options) => {
    expect(refusalOf(parseParts({ ...open, options })).code).toBe("bad-options");
  });

  it.each([
    ["no bullet", []],
    ["an ID that is not a ticket ID", ["- abc-14"]],
    ["the reserved build-request prefix", ["- BR-2"]],
    ["the reserved decision prefix", ["- ADR-3"]],
    ["an epic ID", ["- EPIC-1"]],
    ["one ticket written twice", ["- ABC-014", "- ABC-014"]],
  ] as const)("%s in `## Blocks` is bad-blocks", (_name, blocks) => {
    expect(refusalOf(parseParts({ ...open, blocks })).code).toBe("bad-blocks");
  });
});

// ── The History line forms ──────────────────────────────────────────────────────────────────────────────

describe("build-request grammar — the closed History line forms (bad-history-line)", () => {
  it.each([
    ["a missing comma before `by`", "- 2026-12-03: carried by human:jane.example"],
    ["a missing colon after the date", "- 2026-12-03 carried, by human:jane.example"],
    ["a name with a space", "- 2026-12-03: carried, by human:Jane Example"],
    ["an empty human name", "- 2026-12-03: carried, by human:"],
    ["a role name as the actor", "- 2026-12-03: carried, by Architect"],
    ["a date that is not a calendar date", "- 2026-02-30: carried, by human:jane.example"],
    ["an event outside the closed set", "- 2026-12-03: approved, by human:jane.example"],
    ["an asterisk bullet", "* 2026-12-03: carried, by human:jane.example"],
    ["trailing text on a carried line", "- 2026-12-03: carried, by human:jane.example, today"],
    ["an edit with no description", "- 2026-12-03: edited, by BA/PM"],
    ["an answered line with no pin", "- 2026-12-03: answered, by human:jane.example"],
    ["an answered pin that is not an object id", "- 2026-12-03: answered, by human:jane.example, pin 0123abc"],
    ["an unknown answered flag", `- 2026-12-03: answered, by human:jane.example, pin ${BR_FIXTURE_NEW_PIN}, later`],
  ])("%s is bad-history-line on its own line", (_name, line) => {
    const text = buildRequestText(withHistory("carried", [OPEN, line]));
    const r = refusalOf(parseText(text));
    expect(r.code).toBe("bad-history-line");
    expect(r.line).toBe(lineNumberOf(text, line));
  });

  it("a withdrawn line with no reason is bad-history-line", () => {
    expect(refusalOf(parseParts(withHistory("withdrawn", [OPEN, "- 2026-12-02: withdrawn, by BA/PM"]))).code).toBe(
      "bad-history-line",
    );
  });
});

describe("build-request grammar — History order (bad-history-order)", () => {
  it("a date earlier than the entry before it is bad-history-order", () => {
    const back = `- 2026-11-30: carried, by ${BR_FIXTURE_HUMAN}`;
    const text = buildRequestText(withHistory("carried", [OPEN, back]));
    const r = refusalOf(parseText(text));
    expect(r.code).toBe("bad-history-order");
    expect(r.line).toBe(lineNumberOf(text, back));
  });

  it("a first entry that is not `open` is bad-history-order", () => {
    expect(refusalOf(parseParts(withHistory("carried", [CARRIED]))).code).toBe("bad-history-order");
  });

  it("a first `open` entry dated other than `raised` is bad-history-order", () => {
    expect(refusalOf(parseParts(withHistory("open", ["- 2026-12-02: open, by BA/PM"]))).code).toBe("bad-history-order");
  });

  it("an empty `## History` is bad-history-order", () => {
    expect(refusalOf(parseParts(withHistory("open", []))).code).toBe("bad-history-order");
  });

  it("two entries on one date keep their written order and are admitted", () => {
    const r = parseParts(withHistory("carried", [OPEN, `- 2026-12-01: carried, by ${BR_FIXTURE_HUMAN}`]));
    expect(r.ok).toBe(true);
  });
});

// ── The lifecycle ───────────────────────────────────────────────────────────────────────────────────────

describe("build-request grammar — the closed lifecycle (bad-transition, D-06, D-07, BR-05)", () => {
  const answeredBy = (actor: string, pin: string) => `- 2026-12-09: answered, by ${actor}, pin ${pin}`;

  it("`open` to `answered` with no carry is bad-transition: an unsent request is withdrawn, not answered", () => {
    const line = answeredBy(BR_FIXTURE_HUMAN, BR_FIXTURE_NEW_PIN);
    const text = buildRequestText(withHistory("answered", [OPEN, line], ANSWER_TEXT));
    const r = refusalOf(parseText(text));
    expect(r.code).toBe("bad-transition");
    expect(r.line).toBe(lineNumberOf(text, line));
  });

  it("[EDGE BR-05/adjacency] an answer pin equal to the raising pin is bad-transition", () => {
    const r = parseParts(withHistory("answered", [OPEN, CARRIED, answeredBy(BR_FIXTURE_HUMAN, BR_FIXTURE_PIN)], ANSWER_TEXT));
    expect(refusalOf(r).code).toBe("bad-transition");
  });

  it("an answer pin of another object-format length than the raising pin is bad-transition", () => {
    const r = parseParts(withHistory("answered", [OPEN, CARRIED, answeredBy(BR_FIXTURE_HUMAN, BR_FIXTURE_PIN_64)], ANSWER_TEXT));
    expect(refusalOf(r).code).toBe("bad-transition");
  });

  it("PROHIBITION: a carried or answered entry by BA/PM is bad-transition (no agent records its own request carried)", () => {
    expect(refusalOf(parseParts(withHistory("carried", [OPEN, "- 2026-12-03: carried, by BA/PM"]))).code).toBe(
      "bad-transition",
    );
    expect(
      refusalOf(parseParts(withHistory("answered", [OPEN, CARRIED, answeredBy("BA/PM", BR_FIXTURE_NEW_PIN)], ANSWER_TEXT)))
        .code,
    ).toBe("bad-transition");
  });

  it("any entry after `answered` is bad-transition, an edit included", () => {
    const after = "- 2026-12-10: edited, by BA/PM: fixed a typo";
    const r = parseParts(
      withHistory("answered", [OPEN, CARRIED, answeredBy(BR_FIXTURE_HUMAN, BR_FIXTURE_NEW_PIN), after], ANSWER_TEXT),
    );
    expect(refusalOf(r).code).toBe("bad-transition");
  });

  it("any entry after `withdrawn` is bad-transition", () => {
    const r = parseParts(
      withHistory("carried", [OPEN, "- 2026-12-02: withdrawn, by BA/PM: a duplicate of BR-2", CARRIED]),
    );
    expect(refusalOf(r).code).toBe("bad-transition");
  });

  it("a carried request withdrawn by BA/PM is bad-transition; only a named human drops a carried request", () => {
    const r = parseParts(withHistory("withdrawn", [OPEN, CARRIED, "- 2026-12-06: withdrawn, by BA/PM: no longer needed"]));
    expect(refusalOf(r).code).toBe("bad-transition");
  });

  it("an open request withdrawn on a named human's word is admitted: status withdrawn, 2 entries, no answer (G-45-9, UAT decision 1)", () => {
    const r = parseParts(
      withHistory("withdrawn", [OPEN, `- 2026-12-02: withdrawn, by ${BR_FIXTURE_HUMAN}: floor conflict, the work is re-planned`]),
    );
    if (!r.ok) throw new Error(`refused: ${r.code} ${r.reason}`);
    expect(r.value.status).toBe("withdrawn");
    expect(r.value.history).toHaveLength(2);
    expect(r.value.hasAnswer).toBe(false);
  });

  it("a second `open` entry and an edit by a human stamp are bad-transition", () => {
    expect(refusalOf(parseParts(withHistory("open", [OPEN, "- 2026-12-02: open, by BA/PM"]))).code).toBe("bad-transition");
    expect(
      refusalOf(parseParts(withHistory("open", [OPEN, `- 2026-12-02: edited, by ${BR_FIXTURE_HUMAN}: added a ticket`]))).code,
    ).toBe("bad-transition");
  });
});

// ── Status and answer ───────────────────────────────────────────────────────────────────────────────────

describe("build-request grammar — the status the History implies (status-mismatch) and the answer (bad-answer)", () => {
  it("frontmatter `open` over a History that ends `carried` is status-mismatch", () => {
    expect(refusalOf(parseParts(withHistory("open", [OPEN, CARRIED]))).code).toBe("status-mismatch");
  });

  it("frontmatter `carried` over a History that ends `open` is status-mismatch", () => {
    expect(refusalOf(parseParts(withHistory("carried", [OPEN]))).code).toBe("status-mismatch");
  });

  it("an `edited` entry does not move the status: `carried` then `edited` still implies `carried`", () => {
    expect(parseParts(validBuildRequestParts("carried-edited")).ok).toBe(true);
  });

  it("[EDGE BR-05/empty] answer text before `answered` is bad-answer", () => {
    expect(refusalOf(parseParts({ ...validBuildRequestParts("carried"), answer: ANSWER_TEXT })).code).toBe("bad-answer");
  });

  it("[EDGE BR-05/empty] an empty `## Answer` once `answered` is bad-answer", () => {
    expect(refusalOf(parseParts({ ...validBuildRequestParts("answered"), answer: [] })).code).toBe("bad-answer");
  });
});

// ── Value-silent reasons ────────────────────────────────────────────────────────────────────────────────

describe("build-request grammar — every refusal reason names the line and the rule and quotes no file text", () => {
  const MARK = "ZZQ-IGNORE-PREVIOUS";
  const open = validBuildRequestParts("open");
  const planted: readonly [string, BuildRequestParts][] = [
    ["bad-upstream-ids", { ...open, upstreamIds: [`- ${MARK}`] }],
    ["bad-options", { ...open, options: [`- ${MARK}`] }],
    ["bad-blocks", { ...open, blocks: [`- ${MARK}`] }],
    ["bad-history-line", { ...open, history: [OPEN, `- 2026-12-02: ${MARK}`] }],
    ["bad-transition", { ...open, history: [OPEN, `- 2026-12-02: edited, by ${BR_FIXTURE_HUMAN}: ${MARK}`] }],
    ["bad-answer", { ...open, answer: [MARK] }],
  ];
  it.each(planted)("%s quotes none of the planted text", (code, parts) => {
    const r = refusalOf(parseParts(parts));
    expect(r.code).toBe(code);
    expect(r.reason).not.toContain(MARK);
    expect(r.reason).not.toContain("ZZQ");
  });
});

// ── The derivations (Task 3, D-08, D-12, D-13, BR-06) ───────────────────────────────────────────────────

/** The admitted document of a fixture shape. */
function docOf(shape: BuildRequestFixtureShape): BuildRequestDocument {
  const r = parseParts(validBuildRequestParts(shape));
  if (!r.ok) throw new Error(`test premise: the ${shape} shape was refused (${r.code})`);
  return r.value;
}

describe("build-request derivations — changed since carried (D-08, D-12)", () => {
  it.each([
    ["open", false],
    ["carried", false],
    ["carried-edited", true],
    ["carried-resent", false],
    ["answered", false],
    ["withdrawn-open", false],
    ["withdrawn-open-human", false],
    ["withdrawn-carried", false],
  ] as const)("the %s shape gives %s", (shape, want) => {
    expect(buildRequestChangedSinceCarried(docOf(shape))).toBe(want);
  });

  it("an edit made before the request was carried does not flag it", () => {
    const r = parseParts(
      withHistory("carried", [OPEN, "- 2026-12-02: edited, by BA/PM: reworded the question", CARRIED]),
    );
    if (!r.ok) throw new Error(`refused: ${r.code}`);
    expect(buildRequestChangedSinceCarried(r.value)).toBe(false);
  });
});

describe("build-request derivations — the last status move (D-13)", () => {
  it.each([
    ["open", "2026-12-01"],
    ["carried", "2026-12-03"],
    ["carried-edited", "2026-12-03"],
    ["carried-resent", "2026-12-06"],
    ["answered", null],
    ["answered-not-descendant", null],
    ["withdrawn-open", null],
    ["withdrawn-open-human", null],
    ["withdrawn-carried", null],
  ] as const)("the %s shape last moved on %s", (shape, want) => {
    expect(buildRequestLastMoveDate(docOf(shape))).toBe(want);
  });
});

describe("build-request derivations — age in whole UTC days (BR-06)", () => {
  it("[EDGE BR-06/precision] 2026-12-01 to 2026-12-11 is 10 days", () => {
    expect(buildRequestAgeDays("2026-12-01", "2026-12-11")).toBe(10);
  });

  it("[EDGE BR-06/precision] across a month end and a leap day, 2028-02-28 to 2028-03-01 is 2 days", () => {
    expect(buildRequestAgeDays("2028-02-28", "2028-03-01")).toBe(2);
  });

  it("across a year end and a non-leap February the count stays whole", () => {
    expect(buildRequestAgeDays("2026-12-31", "2027-01-01")).toBe(1);
    expect(buildRequestAgeDays("2027-02-28", "2027-03-01")).toBe(1);
  });

  it("equal dates give 0, and a `from` after `today` gives a negative number", () => {
    expect(buildRequestAgeDays("2026-12-11", "2026-12-11")).toBe(0);
    expect(buildRequestAgeDays("2026-12-11", "2026-12-01")).toBe(-10);
  });

  it("the wait counts from the last status move, and a finished request has none", () => {
    expect(buildRequestWaitDays(docOf("open"), "2026-12-11")).toBe(10);
    expect(buildRequestWaitDays(docOf("carried"), "2026-12-11")).toBe(8);
    expect(buildRequestWaitDays(docOf("carried-resent"), "2026-12-11")).toBe(5);
    expect(buildRequestWaitDays(docOf("answered"), "2026-12-11")).toBeNull();
    expect(buildRequestWaitDays(docOf("withdrawn-carried"), "2026-12-11")).toBeNull();
  });
});

describe("build-request derivations — overdue past the escalation threshold (BR-06, D-13)", () => {
  it("[EDGE BR-06/boundary] a wait equal to the threshold is not overdue", () => {
    expect(buildRequestIsOverdue(10, 10)).toBe(false);
  });

  it("[EDGE BR-06/boundary] a wait one day past the threshold is overdue", () => {
    expect(buildRequestIsOverdue(11, 10)).toBe(true);
  });

  it("a fresh request is not overdue", () => {
    expect(buildRequestIsOverdue(0, 10)).toBe(false);
  });
});

// ── The requests report lines (plan 45-07, BR-03, BR-04, BR-05, BR-06, D-09..D-13) ─────────────────────

describe("requests report — one line per kind, in the plan 45-07 grammar", () => {
  const A = BR_FIXTURE_PIN;
  const B = BR_FIXTURE_NEW_PIN;
  it.each([
    [{ kind: "carry-open", id: "BR-1", source: "design", since: "2026-12-01" }, "carry BR-1 design: open since 2026-12-01"],
    [
      { kind: "carry-changed", id: "BR-1", source: "design", since: "2026-12-03" },
      "carry BR-1 design: changed since carried 2026-12-03",
    ],
    [
      { kind: "wait", id: "BR-1", source: "design", status: "open", days: 11, threshold: 10 },
      "wait BR-1 design: open for 11 days (escalation_days 10)",
    ],
    [
      { kind: "wait", id: "BR-2", source: "ux-kit", status: "carried", days: 31, threshold: 30 },
      "wait BR-2 ux-kit: carried for 31 days (escalation_days 30)",
    ],
    [
      { kind: "answer-candidate", id: "BR-1", source: "design", changed: ["DEC-1"], raisedAt: A, pinNow: B },
      `answer-candidate BR-1 design: changed DEC-1 (raised at ${A}, pin now ${B})`,
    ],
    [
      { kind: "answer-candidate", id: "BR-1", source: "design", changed: ["DEC-2", "DEC-1"], raisedAt: A, pinNow: B },
      `answer-candidate BR-1 design: changed DEC-2, DEC-1 (raised at ${A}, pin now ${B})`,
    ],
    [
      { kind: "pin-moved", id: "BR-1", source: "design", raisedAt: A, pinNow: B },
      `pin-moved BR-1 design: no listed ID changed (raised at ${A}, pin now ${B})`,
    ],
    [
      { kind: "not-descendant", id: "BR-1", source: "design", raisedAt: A, pinNow: B },
      `not-descendant BR-1 design: pin now ${B} does not descend from ${A}`,
    ],
    [{ kind: "overlap", a: "BR-1", b: "BR-2", source: "design", ids: ["DEC-1"] }, "overlap BR-1 BR-2 design: DEC-1"],
    [
      { kind: "overlap", a: "BR-2", b: "BR-10", source: "design", ids: ["DEC-3", "Q-1"] },
      "overlap BR-2 BR-10 design: DEC-3, Q-1",
    ],
    [
      { kind: "unknown", id: "BR-1", source: "ghost", reason: "source ghost is not declared" },
      "UNKNOWN - verify BR-1 ghost: source ghost is not declared",
    ],
  ] as const)("%o prints %s", (item, line) => {
    expect(formatBuildRequestReportLine(item as BuildRequestReportItem)).toBe(line);
  });
});

describe("requests report — the exit code (plan 45-07)", () => {
  const carry: BuildRequestReportItem = { kind: "carry-open", id: "BR-1", source: "design", since: "2026-12-01" };
  const unknown: BuildRequestReportItem = { kind: "unknown", id: "BR-1", source: "ghost", reason: "source ghost is not declared" };
  const refused: BuildRequestReportItem = { kind: "refused", fileName: "BR-2.md", code: "unknown-key" };
  it("an UNKNOWN - verify line alone, or beside a carry line, gives exit 2", () => {
    expect(buildRequestReportExitCode([unknown])).toBe(2);
    expect(buildRequestReportExitCode([carry, unknown])).toBe(2);
    expect(buildRequestReportExitCode([refused, carry])).toBe(2);
  });

  it.each([
    [{ kind: "carry-changed", id: "BR-1", source: "design", since: "2026-12-03" }],
    [{ kind: "wait", id: "BR-1", source: "design", status: "open", days: 11, threshold: 10 }],
    [{ kind: "answer-candidate", id: "BR-1", source: "design", changed: ["DEC-1"], raisedAt: BR_FIXTURE_PIN, pinNow: BR_FIXTURE_NEW_PIN }],
    [{ kind: "pin-moved", id: "BR-1", source: "design", raisedAt: BR_FIXTURE_PIN, pinNow: BR_FIXTURE_NEW_PIN }],
    [{ kind: "not-descendant", id: "BR-1", source: "design", raisedAt: BR_FIXTURE_PIN, pinNow: BR_FIXTURE_NEW_PIN }],
    [{ kind: "overlap", a: "BR-1", b: "BR-2", source: "design", ids: ["DEC-1"] }],
  ] as const)("any other report line (%o) gives exit 1", (item) => {
    expect(buildRequestReportExitCode([item as BuildRequestReportItem])).toBe(1);
  });

  it("the none and quiet lines give exit 0", () => {
    expect(buildRequestReportExitCode([{ kind: "none" }])).toBe(0);
    expect(buildRequestReportExitCode([{ kind: "quiet", onFile: 2 }])).toBe(0);
  });
});

/** The admitted document of `parts`, failing the test when it is refused. */
function admitted(parts: BuildRequestParts): BuildRequestDocument {
  const r = parseParts(parts);
  if (!r.ok) throw new Error(`test premise: ${parts.id} was refused (${r.code}: ${r.reason})`);
  return r.value;
}

describe("requests report — overlaps between open and carried requests (D-09, BR-03)", () => {
  it("two open requests for one source that both name DEC-1 give one overlap item", () => {
    const one = admitted(buildRequestPartsAt({ id: "BR-1", raised: "2026-12-01", upstreamIds: ["DEC-1"] }));
    const two = admitted(buildRequestPartsAt({ id: "BR-2", raised: "2026-12-01", upstreamIds: ["DEC-1"] }));
    expect(buildRequestOverlaps([two, one])).toEqual([{ kind: "overlap", a: "BR-1", b: "BR-2", source: "design", ids: ["DEC-1"] }]);
  });

  it("[EDGE BR-04/ordering] pairs come out by the first ID then the second, numerically, the shared IDs in the first request's order", () => {
    const docs = [
      admitted(buildRequestPartsAt({ id: "BR-10", raised: "2026-12-01", upstreamIds: ["Q-1", "DEC-3"] })),
      admitted(buildRequestPartsAt({ id: "BR-2", raised: "2026-12-01", upstreamIds: ["DEC-3", "DEC-9", "Q-1"] })),
      admitted(buildRequestPartsAt({ id: "BR-3", raised: "2026-12-01", upstreamIds: ["DEC-9"], after: [["carried", "2026-12-02"]] })),
    ];
    expect(buildRequestOverlaps(docs).map(formatBuildRequestReportLine)).toEqual([
      "overlap BR-2 BR-3 design: DEC-9",
      "overlap BR-2 BR-10 design: DEC-3, Q-1",
    ]);
  });

  it("the same IDs under different sources give nothing", () => {
    const one = admitted(buildRequestPartsAt({ id: "BR-1", raised: "2026-12-01", upstreamIds: ["DEC-1"] }));
    const two = admitted(buildRequestPartsAt({ id: "BR-2", source: "ux-kit", raised: "2026-12-01", upstreamIds: ["DEC-1"] }));
    expect(buildRequestOverlaps([one, two])).toEqual([]);
  });

  it("a withdrawn or answered request never overlaps", () => {
    const open = admitted(buildRequestPartsAt({ id: "BR-1", raised: "2026-12-01", upstreamIds: ["DEC-12"] }));
    const answered = admitted({ ...validBuildRequestParts("answered"), id: "BR-2" });
    const withdrawn = admitted({ ...validBuildRequestParts("withdrawn-open"), id: "BR-4" });
    expect(answered.upstreamIds, "PREMISE: the answered request names DEC-12").toEqual(["DEC-12"]);
    expect(buildRequestOverlaps([open, answered, withdrawn])).toEqual([]);
  });

  it("[EDGE BR-05/empty] a request whose `## Upstream IDs` is `none` overlaps nothing", () => {
    const none = admitted(buildRequestPartsAt({ id: "BR-1", raised: "2026-12-01", upstreamIds: [] }));
    const other = admitted(buildRequestPartsAt({ id: "BR-2", raised: "2026-12-01", upstreamIds: ["DEC-1"] }));
    expect(none.upstreamIds).toEqual([]);
    expect(buildRequestOverlaps([none, other])).toEqual([]);
  });
});

describe("requests report — the dated fixture builder gives the History each shape implies", () => {
  it("carried, edited after the carry, then carried again", () => {
    const doc = admitted(
      buildRequestPartsAt({
        id: "BR-5",
        raised: "2026-12-01",
        after: [
          ["carried", "2026-12-02"],
          ["edited", "2026-12-04"],
          ["carried", "2026-12-06"],
        ],
      }),
    );
    expect(doc.status).toBe("carried");
    expect(buildRequestChangedSinceCarried(doc)).toBe(false);
    expect(buildRequestLastMoveDate(doc)).toBe("2026-12-06");
  });
});

// build-request-fixture.test-support.ts — builders of build-request file text for the build-request grammar's tests
// (phase 45, plan 45-03, BR-01, BR-03, BR-05, D-05..D-08).
//
// WHAT IT IS. Functions that assemble the text of one `memory-bank/plans/build-requests/BR-<n>.md` file from its parts:
// the five frontmatter values, then the six sections in D-05 order (`## Question`, `## Upstream IDs`, `## Options`,
// `## Blocks`, `## History`, `## Answer`). validBuildRequestParts gives one admitted part set per lifecycle shape, in
// the History line forms a human chose at the plan 45-03 checkpoint (option-a, 2026-11-26). A test changes one part,
// or edits the assembled text, to plant exactly one defect.
//
// SYNTHETIC DATA. Every ID, pin, name and sentence below is invented for these tests (DEC-12, ABC-014,
// `human:jane.example`). It names no real project, product or person, as the public repository rule requires.
//
// TEST HARNESS, NOT TOOLING. The `.test-support.ts` suffix keeps this file out of emit (tsconfig.json), so it has no
// `.js` twin. It imports nothing.
//
// Voice: clear professional voice (CLAUDE.md hard rule).

/** The raising pin every valid part set uses: an invented 40-hex commit id. */
export const BR_FIXTURE_PIN = "0123456789abcdef0123456789abcdef01234567";

/** A second invented 40-hex commit id, the pin a human set when the request was answered. */
export const BR_FIXTURE_NEW_PIN = "89abcdef0123456789abcdef0123456789abcdef";

/** An invented 64-hex commit id, for the object-format length rule. */
export const BR_FIXTURE_PIN_64 = "fedcba9876543210".repeat(4);

/** The invented human stamp of every carried and answered line. */
export const BR_FIXTURE_HUMAN = "human:jane.example";

/** The parts of one build-request file. Each section is a list of body lines, written as they appear in the file. */
export interface BuildRequestParts {
  readonly id: string;
  readonly status: string;
  readonly source: string;
  readonly pin: string;
  readonly raised: string;
  /** The level-one title line under the frontmatter, or null for none. */
  readonly title: string | null;
  readonly question: readonly string[];
  readonly upstreamIds: readonly string[];
  readonly options: readonly string[];
  readonly blocks: readonly string[];
  readonly history: readonly string[];
  readonly answer: readonly string[];
}

/** The lifecycle shapes validBuildRequestParts can build, each admitted by the grammar. */
export type BuildRequestFixtureShape =
  | "open"
  | "carried"
  | "carried-edited"
  | "carried-resent"
  | "answered"
  | "answered-not-descendant"
  | "withdrawn-open"
  | "withdrawn-carried";

/** One section: its heading line, a blank line, its body lines, and a blank line when it has any. */
function buildRequestFixtureSection(heading: string, lines: readonly string[]): string {
  return lines.length === 0 ? `${heading}\n\n` : `${heading}\n\n${lines.join("\n")}\n\n`;
}

/** The full text of a build-request file from its parts, ending in one newline. */
export function buildRequestText(parts: BuildRequestParts): string {
  const text =
    "---\n" +
    `id: ${parts.id}\n` +
    `status: ${parts.status}\n` +
    `source: ${parts.source}\n` +
    `pin: ${parts.pin}\n` +
    `raised: ${parts.raised}\n` +
    "---\n" +
    (parts.title === null ? "" : `${parts.title}\n\n`) +
    buildRequestFixtureSection("## Question", parts.question) +
    buildRequestFixtureSection("## Upstream IDs", parts.upstreamIds) +
    buildRequestFixtureSection("## Options", parts.options) +
    buildRequestFixtureSection("## Blocks", parts.blocks) +
    buildRequestFixtureSection("## History", parts.history) +
    buildRequestFixtureSection("## Answer", parts.answer);
  return text.replace(/\n+$/, "\n");
}

/** One admitted part set for `shape`, with the id `BR-3`. */
export function validBuildRequestParts(shape: BuildRequestFixtureShape): BuildRequestParts {
  const open = "- 2026-12-01: open, by BA/PM";
  const carried = `- 2026-12-03: carried, by ${BR_FIXTURE_HUMAN}`;
  const edited = "- 2026-12-05: edited, by BA/PM: added ABC-021 to Blocks";
  const answered = `- 2026-12-09: answered, by ${BR_FIXTURE_HUMAN}, pin ${BR_FIXTURE_NEW_PIN}`;
  const base = {
    id: "BR-3",
    source: "design",
    pin: BR_FIXTURE_PIN,
    raised: "2026-12-01",
    title: "# BR-3: Which store owns the session token",
    question: ["Which store owns the session token after sign-out?"],
    upstreamIds: ["- DEC-12"],
    options: ["- (recommended) The server store owns it; the client holds an opaque handle.", "- The client store owns it."],
    blocks: ["- ABC-014"],
    answer: [] as readonly string[],
  };
  const answerText = ["DEC-12 at the new pin says the server store owns the token."];
  switch (shape) {
    case "open":
      return { ...base, status: "open", history: [open] };
    case "carried":
      return { ...base, status: "carried", history: [open, carried] };
    case "carried-edited":
      return { ...base, status: "carried", blocks: ["- ABC-014", "- ABC-021"], history: [open, carried, edited] };
    case "carried-resent":
      return {
        ...base,
        status: "carried",
        blocks: ["- ABC-014", "- ABC-021"],
        history: [open, carried, edited, `- 2026-12-06: carried, by ${BR_FIXTURE_HUMAN}`],
      };
    case "answered":
      return { ...base, status: "answered", history: [open, carried, answered], answer: answerText };
    case "answered-not-descendant":
      return {
        ...base,
        status: "answered",
        history: [open, carried, `${answered}, not-descendant`],
        answer: answerText,
      };
    case "withdrawn-open":
      return { ...base, status: "withdrawn", history: [open, "- 2026-12-02: withdrawn, by BA/PM: a duplicate of BR-2"] };
    case "withdrawn-carried":
      return {
        ...base,
        status: "withdrawn",
        history: [open, carried, `- 2026-12-06: withdrawn, by ${BR_FIXTURE_HUMAN}: no longer needed`],
      };
  }
}

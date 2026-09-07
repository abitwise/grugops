// chrome-lane-bar.test.ts — the D-09 bar, asserted structurally: the attended Chrome lane has NO
// route to a §14-gate stamp.
//
// WHY THIS FILE EXISTS. The phase's assumption-delta decision (plan 31-04) kept the committed
// `*.uat.spec.ts` as the ONE kind of machine evidence and accepted a companion invariant in
// exchange: a contract test that goes red the instant a future phase gives the attended lane a
// route to the machine stamp. This is that test.
//
// THE TWO HALVES OF THE BAR, AND WHY ONLY ONE OF THEM LIVES HERE.
//   • The BEHAVIOURAL half already exists and is NOT duplicated here: the reserved-identity refusal
//     cases in `scripts/context-io.test.ts` prove that a note claiming `by: §14-gate` from any path
//     but the gate's own emitter is refused at write time. Read them there.
//   • The STRUCTURAL half is this file: the set of repository sources that INVOKE the verdict
//     carve-out has exactly one member, and neither document that defines the attended lane carries
//     a route into it.
//
// THE RESIDUALS THIS TEST DOES NOT CLOSE, NAMED AND MEASURED RATHER THAN IMPLIED. It asserts the
// absence of a route in this repository's own TypeScript sources under `scripts/`, `hooks/` and
// `install/`, and in the documents that define the lane. It does NOT prove totality, and the
// red-team pass run before it was committed found exactly where it stops:
//
//   1. THE PREDICATE IS SYNTACTIC AND AN ALIAS DEFEATS IT. Measured: `const f = emitVerdict;` then
//      `f(…)`, and `mod["emitVerdict"](…)`, both contain no `emitVerdict(` and are therefore NOT
//      reported. Widening the matcher once per counter-example is the failure this repository has
//      paid for repeatedly, so the boundary is written down instead. What actually stops such a
//      call is the BEHAVIOURAL half in `scripts/context-io.test.ts`, which refuses the resulting
//      note at write time no matter which expression produced it.
//   2. A HOST REPOSITORY'S OWN SCRIPTS ARE OUT OF SCOPE ENTIRELY. Only this tree is walked.
//   3. A LANE OPERATOR HAND-WRITING A NOTE is covered by the admission grant the `admission-guard`
//      hook reads in a separate process, not by anything here.
//
// The two set literals this file used to carry — the source directories and the lane documents —
// were the third residual, and that one is CLOSED rather than disclosed: the lane-document set is
// derived from the kit below, and the walk's coverage of every tracked source is asserted against
// `git ls-files` with its remainder named. A green run here says what these derivations measured,
// and nothing wider.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { tmpdir } from "node:os";

const ROOT = join(import.meta.dirname, "..");

// ── Part one's inputs ───────────────────────────────────────────────────────────────────────────

/** The directories that hold this repository's own TypeScript sources. */
const SOURCE_DIRS = ["scripts", "hooks", "install"] as const;

/** Directories the walk never descends into — dependencies and build output are not authors. */
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  ".tmp-build",
]);

/** The verdict carve-out's symbol. `scripts/context-io.ts` declares it and the §14 gate calls it. */
const VERDICT_EMITTER = "emitVerdict";

/**
 * THE PREDICATE, stated narrowly on purpose: the identifier immediately followed by `(`.
 *
 * That is a call site or the declaration of the callee. A PROSE MENTION is deliberately outside it,
 * and the distinction is load-bearing rather than cosmetic — `scripts/compactor.ts` writes
 * `appendNote/emitVerdict)` in a comment and `scripts/check-uat-oracles.ts` writes
 * `never calls emitVerdict (…)`. Both NAME the emitter in order to say they do not reach it, and a
 * bare-mention predicate would report each of them as an author of a note it never writes.
 */
const INVOCATION = `${VERDICT_EMITTER}(`;

/**
 * The one legitimate author, and its count asserted SEPARATELY from the equality.
 *
 * The count is not redundant with the equality: a derivation that collapsed to the empty set would
 * satisfy neither, but the count is the assertion that SAYS SO — `[] !== ["scripts/context-io.ts"]`
 * reads as a moved member, while `0 !== 1` reads as a derivation that produced nothing.
 */
const EXPECTED_VERDICT_AUTHORS = ["scripts/context-io.ts"] as const;
const EXPECTED_VERDICT_AUTHOR_COUNT = 1;

/**
 * The DENOMINATOR floor for the walk, so a narrowed or broken walk cannot pass the equality above
 * by finding nothing to disagree with. Measured at 65 sources when this file was written.
 *
 * It is a FLOOR and not a two-sided pin, and the reason is written down rather than left as a
 * weaker habit: this repository adds TypeScript sources every phase, so an exact pin here would be
 * a hand-maintained number that rots while the assertion it guards stays green — this project's own
 * named failure class. What the floor has to catch is the VACUOUS walk, and it catches it.
 */
const WALKED_SOURCE_FLOOR = 40;

// ── Part three's inputs ─────────────────────────────────────────────────────────────────────────

/** The heading both documents use for the lane. One concept, one name, one anchor. */
const ATTENDED_LANE_HEADING = "## The attended Chrome lane";

/**
 * The documents that DEFINE the attended lane — DERIVED from the kit, then compared against the
 * pair below.
 *
 * A typed-out list here would be the hand-maintained set literal this repository names as its second
 * systemic failure class: a THIRD lane document could land, go unscanned, and every assertion below
 * would stay green while covering less than it claims. So the set is derived by walking the kit for
 * the anchor heading, and the named pair is what the derivation is CHECKED AGAINST rather than what
 * it is read from.
 */
const KIT_DIR = "agent-factory";
const EXPECTED_ATTENDED_LANE_DOCS = [
  "agent-factory/checklists/browser-uat-recipe.md",
  "agent-factory/workflows/06-uat-pack.md",
] as const;

const EXPECTED_REGION_COUNT = 2;

/**
 * Tracked `.ts` sources the three walked directories do NOT cover, named so the gap is an assertion
 * rather than a silence. Measured against `git ls-files` when this file was written: one file, the
 * test runner's own configuration, which invokes nothing.
 */
const UNWALKED_TRACKED_SOURCES = ["vitest.config.ts"] as const;

/** The reserved gate identity, spelled here exactly as a note's `by:` field carries it. */
const GATE_IDENTITY_STAMP = "§14-gate";

/** The two strings whose presence in a lane region would BE the route. */
const FORBIDDEN_IN_LANE = [VERDICT_EMITTER, GATE_IDENTITY_STAMP] as const;

// ── The derivations ─────────────────────────────────────────────────────────────────────────────

function descend(dir: string, root: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) descend(abs, root, out);
      continue;
    }
    if (!entry.isFile()) continue;
    // Only `.ts`. A committed `.js` twin is a BUILD of one of these files, never a second author,
    // and counting both would double every member of the set below.
    if (!entry.name.endsWith(".ts")) continue;
    // A test is not an author. `scripts/context-io.test.ts` invokes the emitter dozens of times.
    if (entry.name.endsWith(".test.ts")) continue;
    out.push(relative(root, abs).split(sep).join("/"));
  }
}

/** Every non-test TypeScript source under the three source directories, repo-relative and sorted. */
function walkTypeScriptSources(root: string): string[] {
  const out: string[] = [];
  for (const dir of SOURCE_DIRS) {
    const abs = join(root, dir);
    try {
      if (!statSync(abs).isDirectory()) continue;
    } catch {
      continue;
    }
    descend(abs, root, out);
  }
  return out.sort();
}

/** The derived set: every walked source whose text invokes the verdict carve-out. */
function deriveVerdictAuthors(root: string): string[] {
  return walkTypeScriptSources(root).filter((rel) =>
    readFileSync(join(root, rel), "utf8").includes(INVOCATION),
  );
}

/** An ATX heading line, captured so its LEVEL can be compared. */
const HEADING_LINE = /^(#{1,6})\s+\S/;

/**
 * Extract a heading's section, BOUNDED BY THE NEXT HEADING OF THE SAME OR HIGHER LEVEL.
 *
 * The bound is the whole point. An extractor that ran to end-of-file would adopt every later
 * section of the document, and the no-forbidden-string assertion over the result would then be a
 * statement about the whole file wearing the shape of a statement about the lane. The tests below
 * assert the bound NUMERICALLY rather than trusting this comment.
 */
function extractSection(text: string, heading: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.trimEnd() === heading);
  if (start < 0) {
    throw new Error(
      `chrome-lane-bar: the anchor heading ${JSON.stringify(heading)} was not found — the ` +
        `region derivation has no input and every assertion over it would be vacuous`,
    );
  }
  const level = heading.slice(0, heading.indexOf(" ")).length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = HEADING_LINE.exec(lines[i]);
    if (m !== null && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

/** Which forbidden strings a region carries. `[]` is the only admissible answer for a real region. */
function forbiddenHits(region: string): string[] {
  return FORBIDDEN_IN_LANE.filter((f) => region.includes(f));
}

/** Every kit markdown file carrying the anchor heading, repo-relative and sorted. */
function deriveAttendedLaneDocs(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) walk(abs);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const lines = readFileSync(abs, "utf8").split("\n");
      if (lines.some((l) => l.trimEnd() === ATTENDED_LANE_HEADING)) {
        out.push(relative(root, abs).split(sep).join("/"));
      }
    }
  };
  walk(join(root, KIT_DIR));
  return out.sort();
}

// ── Temp-tree bookkeeping (the test-skip-integrity.test.ts harness shape) ───────────────────────

const tmpDirs: string[] = [];
function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length > 0) {
    rmSync(tmpDirs.pop() as string, { recursive: true, force: true });
  }
});

function writeInto(root: string, rel: string, content: string): void {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE — the verdict-author set has exactly one member (D-09).
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("31-04 D-09: exactly one repository source invokes the verdict carve-out", () => {
  it("the walk covers a real corpus — the denominator floor, asserted before the set", () => {
    const walked = walkTypeScriptSources(ROOT);
    expect(
      walked.length,
      `chrome-lane-bar: the walk derived ${walked.length} non-test TypeScript sources under ` +
        `${SOURCE_DIRS.join(", ")}, below the floor of ${WALKED_SOURCE_FLOOR} — a short or empty ` +
        `walk would make the author-set equality below meaningless`,
    ).toBeGreaterThanOrEqual(WALKED_SOURCE_FLOOR);
  });

  it("the derived author set has the expected COUNT", () => {
    const authors = deriveVerdictAuthors(ROOT);
    expect(
      authors.length,
      `chrome-lane-bar: derived ${authors.length} verdict author(s) [${authors.join(", ")}], ` +
        `expected exactly ${EXPECTED_VERDICT_AUTHOR_COUNT} — a SECOND author is a new route to the ` +
        `machine stamp and needs a decision, never a bumped constant`,
    ).toBe(EXPECTED_VERDICT_AUTHOR_COUNT);
  });

  it("the derived author set has the expected MEMBER", () => {
    expect(deriveVerdictAuthors(ROOT)).toEqual([...EXPECTED_VERDICT_AUTHORS]);
  });

  it("PREMISE: the walk covers every tracked source but a named, asserted remainder", () => {
    // ASSERT THE HARNESS'S OWN PREMISE. The three walked directories are this file's input
    // boundary, and a boundary nobody compared against the repository is a claim, not a bound. The
    // comparison is made against `git ls-files`, which is the same authority the foundation guards
    // pin their own module walk to.
    const listed = spawnSync("git", ["ls-files", "*.ts"], { cwd: ROOT, encoding: "utf8" });
    expect(
      listed.status,
      "chrome-lane-bar: `git ls-files` did not run, so the walk's coverage was never compared — " +
        "a premise that could not be checked FAILS here rather than being skipped",
    ).toBe(0);
    const tracked = (listed.stdout ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.endsWith(".test.ts"));
    expect(tracked.length).toBeGreaterThanOrEqual(WALKED_SOURCE_FLOOR);

    const walked = new Set(walkTypeScriptSources(ROOT));
    const outside = tracked.filter((p) => !walked.has(p)).sort();
    expect(
      outside,
      `chrome-lane-bar: ${outside.length} tracked non-test source(s) sit outside the walk ` +
        `[${outside.join(", ")}] — every one of them is a place a second verdict author could ` +
        `land unseen, so the remainder is named here rather than left as a silence`,
    ).toEqual([...UNWALKED_TRACKED_SOURCES]);
    // …and the named remainder carries no route either, so naming it is not excusing it.
    for (const rel of outside) {
      expect(
        readFileSync(join(ROOT, rel), "utf8").includes(INVOCATION),
        `${rel}: an unwalked tracked source invokes the verdict carve-out`,
      ).toBe(false);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO — the author-set assertion DISCRIMINATES.
//
// A structural assertion nobody has watched fail is not yet a control. The fixture reproduces the
// derived author set from the live tree and adds ONE extra file carrying the same invocation.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("31-04 D-09: the author-set assertion is a control, not a coincidence", () => {
  function seededFixtureRoot(): string {
    const root = mkTmp("grugops-chrome-lane-authors-");
    // The fixture is BUILT FROM THE LIVE DERIVATION rather than from a typed-out path list, so it
    // cannot drift away from the thing it is supposed to be a copy of.
    for (const rel of deriveVerdictAuthors(ROOT)) {
      writeInto(root, rel, readFileSync(join(ROOT, rel), "utf8"));
    }
    writeInto(
      root,
      "scripts/impostor-lane.ts",
      `// a second file that reaches the carve-out\nexport const x = ${INVOCATION}"t", "i", "clean", "abc", ".");\n`,
    );
    return root;
  }

  it("a SECOND author in the tree breaks the member equality", () => {
    const authors = deriveVerdictAuthors(seededFixtureRoot());
    // The premise first: the fixture really does carry the extra author. A fixture that failed to
    // write it would make the refusal below pass for a bookkeeping reason.
    expect(authors).toContain("scripts/impostor-lane.ts");
    expect(authors).not.toEqual([...EXPECTED_VERDICT_AUTHORS]);
  });

  it("a SECOND author in the tree breaks the count", () => {
    const derived = deriveVerdictAuthors(seededFixtureRoot()).length;
    expect(derived).not.toBe(EXPECTED_VERDICT_AUTHOR_COUNT);
    // …and it moved by exactly one, so the refusal is caused by the seeded file rather than by a
    // derivation that broke and started reporting some other number.
    expect(derived).toBe(EXPECTED_VERDICT_AUTHOR_COUNT + 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE — the documented lane carries no route.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("31-04 D-09: the documented attended lane carries no route to the machine stamp", () => {
  function liveRegions(): { doc: string; region: string; whole: string }[] {
    return deriveAttendedLaneDocs(ROOT).map((doc) => {
      const whole = readFileSync(join(ROOT, doc), "utf8");
      return { doc, region: extractSection(whole, ATTENDED_LANE_HEADING), whole };
    });
  }

  it("the lane-document set is DERIVED from the kit and equals the named pair", () => {
    const derived = deriveAttendedLaneDocs(ROOT);
    expect(
      derived,
      `chrome-lane-bar: the kit walk derived [${derived.join(", ")}] as the documents defining the ` +
        `attended lane — a THIRD document would be scanned by nothing below, so the derivation is ` +
        `compared against the named pair rather than read from it`,
    ).toEqual([...EXPECTED_ATTENDED_LANE_DOCS]);
  });

  it("the region derivation is non-empty and has the expected COUNT", () => {
    const regions = liveRegions();
    expect(
      regions.length,
      `chrome-lane-bar: derived ${regions.length} attended-lane region(s) from ` +
        `[${regions.map((r) => r.doc).join(", ")}], expected exactly ${EXPECTED_REGION_COUNT}`,
    ).toBe(EXPECTED_REGION_COUNT);
    for (const { doc, region } of regions) {
      expect(region.length, `${doc}: the extracted region is empty`).toBeGreaterThan(0);
    }
  });

  it("each region is strictly shorter than its file", () => {
    for (const { doc, region, whole } of liveRegions()) {
      expect(
        region.length,
        `${doc}: the extracted region is ${region.length} B of a ${whole.length} B file — an ` +
          `extractor that ran to end-of-file would adopt unrelated later sections and every ` +
          `assertion over the region would become a statement about the whole document`,
      ).toBeLessThan(whole.length);
    }
  });

  // ── THE LENGTH COMPARISON ABOVE DOES NOT DISCRIMINATE, AND THE FIX IS NOT ANOTHER NUMBER. ──────
  //
  // Measured, not assumed. The bound was mutated to `if (false && …)` — an extractor that reads to
  // end-of-file — and the whole file stayed GREEN at 10 passed. The reason is arithmetic: the anchor
  // heading does not sit on line 0, so a region running to EOF is still SHORTER than its file by
  // exactly the bytes above the anchor. A length comparison can never see the difference.
  //
  // So the bound is asserted where it actually lives: at the region's EDGE. Two cases follow — the
  // region carries no heading that would have closed it, and the text immediately after the region
  // BEGINS with the heading that did. Both go red under the mutation above; the length comparison
  // is kept beside them because it is a cheap non-vacuity check, not because it is the control.

  it("the region carries exactly ONE heading at its own level or higher — its own anchor", () => {
    const level = ATTENDED_LANE_HEADING.slice(0, ATTENDED_LANE_HEADING.indexOf(" ")).length;
    for (const { doc, region } of liveRegions()) {
      const closers = region
        .split("\n")
        .filter((l) => {
          const m = HEADING_LINE.exec(l);
          return m !== null && m[1].length <= level;
        });
      expect(
        closers,
        `${doc}: the extracted region carries ${closers.length} heading(s) at level <= ${level}; ` +
          `every one after the first is a section the extractor should have stopped at`,
      ).toEqual([ATTENDED_LANE_HEADING]);
    }
  });

  it("the extractor STOPS AT a heading — the text after each region opens with one", () => {
    const level = ATTENDED_LANE_HEADING.slice(0, ATTENDED_LANE_HEADING.indexOf(" ")).length;
    for (const { doc, region, whole } of liveRegions()) {
      const start = whole.indexOf(region);
      expect(start, `${doc}: the extracted region is not a substring of its source`).toBeGreaterThanOrEqual(0);
      const after = whole.slice(start + region.length);
      // The premise: this document HAS a later section, so "stopped at a heading" is a question the
      // corpus can actually answer. A document whose lane section is last would make it vacuous.
      expect(after.length, `${doc}: nothing follows the region — the bound is untestable here`).toBeGreaterThan(0);
      // `slice(start, end).join("\n")` drops the separator that ended the last region line, so the
      // remainder opens with that newline. One is consumed here; a SECOND blank line would still be
      // a finding, which is the direction this assertion has to fail in.
      const firstLine = (after.startsWith("\n") ? after.slice(1) : after).split("\n")[0];
      const m = HEADING_LINE.exec(firstLine);
      expect(
        m !== null && m[1].length <= level,
        `${doc}: the region ended at ${JSON.stringify(firstLine)} rather than at a heading of ` +
          `level <= ${level} — the extractor ran past its bound`,
      ).toBe(true);
    }
  });

  it("a forbidden string planted in a LATER section is NOT adopted by the region", () => {
    // The direct control for the bound: the only thing that changes between this document and the
    // live one is a section AFTER the lane. A region that reported the plant would have read past
    // its bound, which is the failure the two cases above exist to catch.
    const doc = EXPECTED_ATTENDED_LANE_DOCS[1];
    const whole = readFileSync(join(ROOT, doc), "utf8");
    const planted = `${whole}\n\n## A later section\n\nThis section names ${VERDICT_EMITTER} and ${GATE_IDENTITY_STAMP}.\n`;
    const root = mkTmp("grugops-chrome-lane-later-");
    writeInto(root, doc, planted);
    const plantedWhole = readFileSync(join(root, doc), "utf8");
    // The premise: the plant really is in the document, and it really is outside the region.
    expect(forbiddenHits(plantedWhole)).toEqual([...FORBIDDEN_IN_LANE]);
    expect(forbiddenHits(extractSection(plantedWhole, ATTENDED_LANE_HEADING))).toEqual([]);
  });

  it("no attended-lane region names the verdict emitter or a gate-identity stamp", () => {
    for (const { doc, region } of liveRegions()) {
      expect(forbiddenHits(region), `${doc}: the attended-lane region carries a route`).toEqual([]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FOUR — the no-route assertion DISCRIMINATES, once per forbidden string.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("31-04 D-09: the no-route assertion is a control, not a coincidence", () => {
  for (const forbidden of FORBIDDEN_IN_LANE) {
    it(`a region seeded with ${JSON.stringify(forbidden)} is reported`, () => {
      const doc = EXPECTED_ATTENDED_LANE_DOCS[1];
      const whole = readFileSync(join(ROOT, doc), "utf8");
      const seededWhole = whole.replace(
        ATTENDED_LANE_HEADING,
        `${ATTENDED_LANE_HEADING}\n\nThe lane calls ${forbidden} directly.`,
      );
      const root = mkTmp("grugops-chrome-lane-region-");
      writeInto(root, doc, seededWhole);
      // Re-read from disk and re-extract, so the EXTRACTOR is inside the loop being proven.
      const seededRegion = extractSection(
        readFileSync(join(root, doc), "utf8"),
        ATTENDED_LANE_HEADING,
      );
      expect(forbiddenHits(seededRegion)).toEqual([forbidden]);
      // THE CONTROL, in the same case: the UNSEEDED copy of the same document, extracted by the
      // same function, reports nothing. Without it a hit could come from the extractor rather than
      // from the seed.
      const cleanRoot = mkTmp("grugops-chrome-lane-control-");
      writeInto(cleanRoot, doc, whole);
      expect(
        forbiddenHits(
          extractSection(readFileSync(join(cleanRoot, doc), "utf8"), ATTENDED_LANE_HEADING),
        ),
      ).toEqual([]);
    });
  }
});

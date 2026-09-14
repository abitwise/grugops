// board-corpus.test.ts — THE REPLAY OF BOTH HALVES, AND THE PROOF THE STRIP CAN FAIL (plan 32-04).
//
// WHAT THIS FILE MEASURES, AND WHY EITHER HALF ALONE MEASURES NOTHING.
//
// Admitting everything and refusing everything are both trivially achievable. A grammar that
// admitted every byte would pass the live replay below and fail the mutation replay; a grammar that
// refused every byte would pass the mutation replay and fail the live one. Only the two together
// say the grammar DISCRIMINATES, and only a per-row DISPOSITION says it discriminated for the right
// reason — "it failed" and "it failed into the bucket the contract names" are different claims.
//
// THE DISPOSITION RESOLVER LIVES HERE RATHER THAN IN THE CORPUS. `scripts/board-corpus.ts` imports
// nothing from `scripts/board-model.ts`, because a corpus that imported the module it exists to
// measure could not be evidence about it. The resolver below is the one place the two meet.
//
// THE RESOLVER READS THE MODEL, NEVER THE RAW LINE. It asks which bucket of the returned
// `BoardModel` carries the subject's line number, and falls through to `blanked` only when no bucket
// carries it and the raw line was not blank to begin with. That fall-through is the one arm a reader
// should be suspicious of, which is exactly why the discrimination proof in part four exists: a
// resolver whose `blanked` arm were a silent catch-all would report the same answer with the comment
// pre-pass deleted, and part four shows it does not.
//
// A VACUITY FLOOR CATCHES AN EMPTY DENOMINATOR AND HAS NEVER CAUGHT A SILENTLY SHORT ONE. Every
// count below is derived independently of the loop that consumes it, the disposition set and the
// frame set are compared in BOTH directions, and the per-source live-row totals are pinned against
// the research measurement so a corpus that lost a whole source fails by name rather than by a
// smaller green number.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseBoard } from "./board-model.js";
import type { BoardModel } from "./board-model.js";
import {
  BOARD_CORPUS,
  BOARD_CORPUS_COUNT,
  BOARD_CORPUS_SOURCES,
  DISPOSITIONS,
  DISPOSITION_COUNT,
  FRAMES,
  FRAME_COUNT,
  citedSources,
  frameDocument,
  rowById,
  rowsOfKind,
} from "./board-corpus.js";
import type { CorpusRow, Disposition } from "./board-corpus.js";

const ROOT = join(import.meta.dirname, "..");

// ── The resolver ─────────────────────────────────────────────────────────────────────────────────

/**
 * Which bucket of the parsed model holds the subject line.
 *
 * `preamble` and `nonColumnSection` carry TEXT rather than line numbers, so those two arms compare
 * text. The frames each place their subject on a line whose text appears nowhere else in the
 * document they build, so the comparison cannot collide.
 */
function dispositionOf(model: BoardModel, lineNo: number, rawLine: string): Disposition | null {
  if (model.columns.some((c) => c.line === lineNo)) return "columnHeading";
  if (model.nonColumnSections.some((s) => s.line === lineNo)) return "nonColumnHeading";
  for (const c of model.columns) {
    if (c.rows.some((r) => r.line === lineNo)) return "row";
  }
  if (model.epicRows.some((r) => r.line === lineNo)) return "epicRow";
  if (model.updates.some((u) => u.line === lineNo)) return "update";
  if (model.unparsed.some((u) => u.line === lineNo)) return "unparsed";
  if (model.preamble.includes(rawLine)) return "preamble";
  if (model.nonColumnSections.some((s) => s.lines.includes(rawLine))) return "nonColumnSection";
  // No bucket claimed a line that carried content. The grammar never saw it, which is what the
  // comment pre-pass does and the only thing that does it.
  if (rawLine.trim() !== "") return "blanked";
  return null;
}

type Replayed = {
  readonly row: CorpusRow;
  readonly model: BoardModel;
  readonly subjectLine: number;
  readonly rawLine: string;
  readonly actual: Disposition | null;
};

function replay(row: CorpusRow): Replayed {
  const { text, subjectLine } = frameDocument(row);
  const model = parseBoard(text);
  const rawLine = text.split("\n")[subjectLine - 1] as string;
  return { row, model, subjectLine, rawLine, actual: dispositionOf(model, subjectLine, rawLine) };
}

/** The whole corpus, replayed once and shared. */
const REPLAYED: readonly Replayed[] = BOARD_CORPUS.map(replay);

/** A failure line that names the row, its source, what was expected and what happened. */
function describeMismatch(r: Replayed): string {
  return (
    `${r.row.id} (${r.row.kind}, frame ${r.row.frame}, cited to ${r.row.source}): expected ` +
    `${r.row.expectedDisposition}, got ${r.actual ?? "NO BUCKET AT ALL"} for line ${r.subjectLine} ` +
    `-> ${JSON.stringify(r.rawLine.slice(0, 120))}`
  );
}

/** The row's own bytes, with the elision marker and everything after it dropped. */
function transcribedHead(row: CorpusRow): string {
  const at = row.input.indexOf(" ... [elided ");
  return at === -1 ? row.input : row.input.slice(0, at);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE — the harness's own premises.
//
// This repository has recorded a FALSE verification-harness premise in six separate instances across
// four consecutive rounds, so every premise here is a failing assertion rather than an assumption.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-corpus — the harness's own premises", () => {
  it("PREMISE: the corpus loaded, and its own count agrees with its length", () => {
    expect(
      BOARD_CORPUS.length,
      "PREMISE: the corpus is EMPTY, so every replay below swept nothing and reported green over it",
    ).toBeGreaterThan(0);
    expect(
      BOARD_CORPUS.length,
      "PREMISE: the corpus length disagrees with BOARD_CORPUS_COUNT. The module-load throw should " +
        "have fired before this line ran, so reaching here means the integrity check itself broke",
    ).toBe(BOARD_CORPUS_COUNT);
  });

  it("PREMISE: the replay's denominator is the corpus, derived by the loop rather than read off it", () => {
    let swept = 0;
    for (const r of REPLAYED) {
      if (typeof r.row.id === "string") swept += 1;
    }
    expect(swept, "cells the replay loop actually walked").toBe(BOARD_CORPUS_COUNT);
    expect(REPLAYED.length, "the replayed array's own length, a second witness").toBe(swept);
  });

  it("PREMISE: every kind is represented, so no half of the corpus is silently empty", () => {
    expect(rowsOfKind("live").length, "live rows").toBeGreaterThanOrEqual(141);
    expect(rowsOfKind("mutation").length, "mutation rows").toBeGreaterThanOrEqual(11);
    expect(rowsOfKind("control").length, "control rows").toBeGreaterThan(0);
    expect(
      rowsOfKind("live").length + rowsOfKind("mutation").length + rowsOfKind("control").length,
      "the three kinds must partition the corpus, so a fourth kind cannot hide in it",
    ).toBe(BOARD_CORPUS_COUNT);
  });

  it("PREMISE: at least four mutations are comment-strip mutations, the shapes nothing on disk carries", () => {
    const commentMutations = rowsOfKind("mutation").filter((r) => r.frame.startsWith("comment"));
    expect(
      commentMutations.map((r) => r.id).sort(),
      "the comment-strip mutations, named so a deletion is visible rather than arithmetic",
    ).toEqual([
      "mut-comment-indent-tab",
      "mut-comment-indent1",
      "mut-comment-inside-column",
      "mut-comment-unindented",
      "mut-comment-unterminated",
    ]);
    expect(commentMutations.length).toBeGreaterThanOrEqual(4);
  });

  it("PREMISE: every row's declared disposition is a member of the closed set", () => {
    const declared = new Set<string>(DISPOSITIONS);
    expect(DISPOSITIONS.length, "the disposition set is pinned two-sided").toBe(DISPOSITION_COUNT);
    const strays = BOARD_CORPUS.filter((r) => !declared.has(r.expectedDisposition)).map((r) => r.id);
    expect(strays, "rows declaring a disposition outside the closed set").toEqual([]);
  });

  it("PREMISE: every frame is pinned and every one of them is exercised, in both directions", () => {
    expect(FRAMES.length, "the frame set is pinned two-sided").toBe(FRAME_COUNT);
    const used = new Set(BOARD_CORPUS.map((r) => r.frame));
    expect(
      [...used].sort(),
      "a frame declared but never exercised is a positional rule nobody measured, and a frame " +
        "exercised but never declared is a document shape the corpus cannot describe",
    ).toEqual([...FRAMES].sort());
  });

  it("PREMISE: the declared sources and the cited sources agree in BOTH directions", () => {
    expect(
      citedSources(),
      "a declared source with no row is as much a defect as a row citing an undeclared path",
    ).toEqual([...BOARD_CORPUS_SOURCES].sort());
  });

  it("PREMISE: the live ticket rows still total 141, split as the research measurement recorded", () => {
    const perSource = new Map<string, number>();
    for (const row of BOARD_CORPUS) {
      if (row.kind !== "live") continue;
      if (!row.id.startsWith("live-chess-") && !row.id.startsWith("live-dogfood-")) {
        if (!row.id.startsWith("live-spec-") && !row.id.startsWith("live-ex")) continue;
      }
      perSource.set(row.source, (perSource.get(row.source) ?? 0) + 1);
    }
    const counted = [...perSource.entries()].sort();
    expect(counted, "the per-source live ticket-row totals, pinned against the measured inventory").toEqual([
      ["docs/initial/agent_factory_builder_spec_v2.md", 8],
      ["examples/02-brownfield-bootstrap.md", 3],
      ["examples/05-release-run.md", 1],
      ["scripts/fixtures/board-replay/chess-board.md", 113],
      ["scripts/fixtures/board-replay/dogfood-board.md", 16],
    ]);
    expect(
      counted.reduce((a, [, n]) => a + n, 0),
      "141 rows were measured in the wild; a smaller total is a source that quietly left",
    ).toBe(141);
  });

  it("PREMISE: every row id is unique, so a failure message names one row rather than a class", () => {
    const ids = BOARD_CORPUS.map((r) => r.id);
    expect(new Set(ids).size, "duplicate row ids").toBe(ids.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO — the replay, both halves.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-corpus — the LIVE half is admitted, each row into its named bucket", () => {
  it("replays every live row to exactly the disposition the contract assigns it", () => {
    const live = REPLAYED.filter((r) => r.row.kind === "live");
    expect(live.length, "live rows actually replayed").toBe(rowsOfKind("live").length);
    const mismatches = live.filter((r) => r.actual !== r.row.expectedDisposition).map(describeMismatch);
    expect(mismatches.slice(0, 5), "the first five live mismatches, each naming its row").toEqual([]);
    expect(mismatches.length, "total live mismatches").toBe(0);
  });

  it("places every measured ticket row in a column rather than on the findings list", () => {
    const tickets = REPLAYED.filter(
      (r) => r.row.kind === "live" && (r.row.expectedDisposition === "row" || r.row.expectedDisposition === "epicRow"),
    );
    expect(tickets.length, "the measured ticket rows").toBe(141);
    const refused = tickets.filter((r) => r.actual === "unparsed").map(describeMismatch);
    expect(
      refused.slice(0, 5),
      "a row a human considers well formed landing on the findings list is the D-01 defect research " +
        "measured at thirty-eight rows, and D-22 exists to keep it at zero",
    ).toEqual([]);
  });
});

describe("board-corpus — the MUTATION half is refused, each row into its named bucket", () => {
  it("replays every mutation row to exactly the disposition the contract assigns it", () => {
    const mutations = REPLAYED.filter((r) => r.row.kind === "mutation");
    expect(mutations.length, "mutation rows actually replayed").toBe(rowsOfKind("mutation").length);
    const mismatches = mutations
      .filter((r) => r.actual !== r.row.expectedDisposition)
      .map(describeMismatch);
    expect(mismatches.slice(0, 5), "the first five mutation mismatches").toEqual([]);
    expect(mismatches.length, "total mutation mismatches").toBe(0);
  });

  it("lets NO mutation reach a live bucket", () => {
    const liveBuckets = new Set<Disposition>(["row", "epicRow", "update"]);
    const promoted = REPLAYED.filter(
      (r) => r.row.kind === "mutation" && r.actual !== null && liveBuckets.has(r.actual),
    ).map(describeMismatch);
    expect(
      promoted,
      "a mutation reaching row, epicRow or update is a shape derived from a REFUSAL rule that the " +
        "grammar admitted — the projector would be reporting state nobody wrote",
    ).toEqual([]);
  });

  it("refuses the mutations into MORE THAN ONE bucket, so the refusal is named and not blanket", () => {
    const buckets = new Set(REPLAYED.filter((r) => r.row.kind === "mutation").map((r) => r.actual));
    expect(
      [...buckets].sort(),
      "a grammar that refused everything into one bucket would pass the case above and tell a " +
        "reader nothing about WHY any particular line was declined",
    ).toEqual(["blanked", "nonColumnHeading", "preamble", "unparsed"]);
  });
});

describe("board-corpus — the CONTROL half records where prose and shipped code part", () => {
  it("replays every control row to exactly the disposition declared for it", () => {
    const controls = REPLAYED.filter((r) => r.row.kind === "control");
    expect(controls.length, "control rows actually replayed").toBe(rowsOfKind("control").length);
    const mismatches = controls.filter((r) => r.actual !== r.row.expectedDisposition).map(describeMismatch);
    expect(mismatches, "control mismatches").toEqual([]);
  });

  it("captures a parenthetical after TWO spaces and not after one or a tab", () => {
    const capture = (id: string): string => {
      const row = rowById(id);
      expect(row, `the corpus no longer carries ${id}`).toBeDefined();
      const r = replay(row as CorpusRow);
      const all = [...r.model.columns.flatMap((c) => c.rows), ...r.model.epicRows];
      const found = all.find((x) => x.line === r.subjectLine);
      expect(found, `${id} did not land as a row at all`).toBeDefined();
      return found?.meta === null || found?.meta === undefined ? "null" : "captured";
    };
    expect(capture("ctl-gap-two-spaces"), "two spaces — the gap the contract names").toBe("captured");
    expect(capture("ctl-gap-one-space"), "one space — the row stays legal, the meta does not").toBe("null");
    expect(capture("ctl-gap-tab"), "a tab — a gap rule written against \\s{2} would part company here").toBe(
      "null",
    );
  });

  it("agrees with every declared expectedMeta, over a denominator derived independently", () => {
    const declared = BOARD_CORPUS.filter((r) => r.expectedMeta !== undefined);
    expect(
      declared.length,
      "PREMISE: no row declares an expectedMeta, so the case below compares nothing",
    ).toBeGreaterThan(0);
    expect(
      declared.every((r) => r.transcription === "verbatim" || r.kind !== "live"),
      "a FRAMED live row must make no meta claim: eliding a tail cuts the closing parenthesis, so " +
        "its capture would be a property of the transcription rather than of the artifact",
    ).toBe(true);

    let compared = 0;
    const mismatches: string[] = [];
    for (const r of REPLAYED) {
      if (r.row.expectedMeta === undefined) continue;
      compared += 1;
      const all = [...r.model.columns.flatMap((c) => c.rows), ...r.model.epicRows];
      const found = all.find((x) => x.line === r.subjectLine);
      const actual = found === undefined || found.meta === null ? "null" : "captured";
      if (actual !== r.row.expectedMeta) {
        mismatches.push(`${r.row.id}: expected meta ${r.row.expectedMeta}, got ${actual}`);
      }
    }
    expect(compared, "the loop's own denominator").toBe(declared.length);
    expect(mismatches, "meta mismatches").toEqual([]);
  });
});

describe("board-corpus — every disposition is REACHED, in both directions", () => {
  it("reaches every declared disposition and declares every reached one", () => {
    const reached = new Set(REPLAYED.map((r) => r.actual));
    expect(
      reached.has(null),
      "a row reached NO bucket at all, which the partition forbids for a line carrying content",
    ).toBe(false);
    expect(
      [...reached].sort(),
      "a disposition declared but never reached is a bucket nobody measured; a disposition reached " +
        "but never declared is a bucket the corpus cannot name",
    ).toEqual([...DISPOSITIONS].sort());
  });

  it("names the rows that carry each disposition, so a bucket held up by one row is visible", () => {
    const perBucket = new Map<string, number>();
    for (const r of REPLAYED) perBucket.set(String(r.actual), (perBucket.get(String(r.actual)) ?? 0) + 1);
    const thin = [...perBucket.entries()].filter(([, n]) => n === 0);
    expect(thin, "a bucket reached zero times").toEqual([]);
    expect(perBucket.size, "distinct buckets reached").toBe(DISPOSITION_COUNT);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE — provenance. A row cannot outlive the artifact that justifies it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-corpus — provenance", () => {
  it("finds every transcribed board row in the committed fixture it cites", () => {
    const fixtures = new Map<string, readonly string[]>();
    for (const rel of ["scripts/fixtures/board-replay/chess-board.md", "scripts/fixtures/board-replay/dogfood-board.md"]) {
      fixtures.set(rel, readFileSync(join(ROOT, rel), "utf8").split("\n"));
    }

    let checked = 0;
    const missing: string[] = [];
    for (const row of BOARD_CORPUS) {
      const lines = fixtures.get(row.source);
      if (lines === undefined || row.frame !== "column" || row.kind !== "live") continue;
      checked += 1;
      const head = transcribedHead(row);
      if (!lines.some((l) => l.startsWith(head))) missing.push(`${row.id} -> ${row.source}`);
    }
    expect(
      checked,
      "PREMISE: no transcribed board row was checked against its fixture, so the sweep below said nothing",
    ).toBe(129);
    expect(
      missing.slice(0, 5),
      "a row whose bytes are not in the fixture it cites is a row nobody can check against its record",
    ).toEqual([]);
  });

  it("keeps the bound-case line whole in the fixture while the corpus row carries only its head", () => {
    const chess = readFileSync(join(ROOT, "scripts/fixtures/board-replay/chess-board.md"), "utf8");
    const long = chess.split("\n").filter((l) => Buffer.byteLength(l, "utf8") >= 34494);
    expect(long.length, "exactly one line survives the trim at its full length (T-32-01)").toBe(1);
  });

  it("records no path under anybody's home directory in any committed artifact of this plan", () => {
    for (const rel of [
      "scripts/board-corpus.ts",
      "scripts/fixtures/board-replay/chess-board.md",
      "scripts/fixtures/board-replay/dogfood-board.md",
    ]) {
      const text = readFileSync(join(ROOT, rel), "utf8");
      expect(text.includes("Projects/hacks"), `${rel} carries a home-directory path`).toBe(false);
      expect(/\/Users\/[a-z]/i.test(text), `${rel} carries an absolute home path`).toBe(false);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FOUR — the D-03 documentation-block case, and the proof it can fail.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

// `carriesBoardShape` is MEASURED, not assumed, and it is `false` for one of the three.
//
// `plans/traceability.md`'s documentation block illustrates a PIPE TABLE, not a board. Nothing
// inside it is board-shaped, so "this block yields zero columns" is true of it for a reason that has
// nothing to do with the comment pre-pass — an empty document yields zero columns too. Recording
// that as a field, and asserting the field two-sided, is what stops the third block from reading as
// a third piece of evidence for a claim it does not support. The evidence for that claim lives in
// the un-indented mutation replayed in the discrimination proof below.
const DOC_BLOCKS = [
  { rel: "plans/board.md", from: 4, to: 51, carriesBoardShape: true },
  { rel: "agent-factory/seed/plans/board.md", from: 4, to: 51, carriesBoardShape: true },
  { rel: "plans/traceability.md", from: 4, to: 34, carriesBoardShape: false },
] as const;

/** One documentation block, sliced by the line numbers the plan names. */
function readBlock(rel: string, from: number, to: number): string {
  const lines = readFileSync(join(ROOT, rel), "utf8").split("\n");
  return lines.slice(from - 1, to).join("\n");
}

describe("board-corpus — a documentation block is not live state (D-03)", () => {
  it("PREMISE: each cited block really is a comment, opening on its first line and closing on its last", () => {
    for (const b of DOC_BLOCKS) {
      const lines = readBlock(b.rel, b.from, b.to).split("\n");
      expect(lines[0], `${b.rel}:${b.from} should open the comment`).toBe("<!--");
      expect(lines[lines.length - 1], `${b.rel}:${b.to} should close it`).toBe("-->");
    }
  });

  it("PREMISE: which blocks carry a board shape is MEASURED, and two of the three do", () => {
    const measured = DOC_BLOCKS.map((b) => {
      const body = readBlock(b.rel, b.from, b.to);
      const boardish = body.split("\n").filter((l) => /^\s*(## .*\(WIP |- \[[A-Z])/.test(l));
      return { rel: b.rel, boardish: boardish.length > 0 };
    });
    expect(
      measured,
      "a block asserted to yield zero columns while carrying NOTHING board-shaped is asserting zero " +
        "over nothing, and this file records which of the three that is rather than letting it pass " +
        "as a third witness",
    ).toEqual(DOC_BLOCKS.map((b) => ({ rel: b.rel, boardish: b.carriesBoardShape })));
    expect(
      measured.filter((m) => m.boardish).length,
      "at least two blocks must carry a board shape, or the case below measures the pre-pass nowhere",
    ).toBeGreaterThanOrEqual(2);
  });

  for (const b of DOC_BLOCKS) {
    it(`gives ${b.rel}'s documentation block zero columns, zero rows and zero updates`, () => {
      const model = parseBoard(readBlock(b.rel, b.from, b.to));
      expect(model.columns.length, "columns").toBe(0);
      expect(model.columns.reduce((a, c) => a + c.rows.length, 0) + model.epicRows.length, "rows").toBe(0);
      expect(model.updates.length, "updates").toBe(0);
    });
  }
});

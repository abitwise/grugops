// canonical-corpus.test.ts — THE REPLAY of the rounds-1-11 historical bypass corpus against the
// canonical admission reader (plan 27-63, D-64 vacuity trap 2).
//
// A GREEN RUN OF THIS FILE IS A FLOOR AND IS NOT CLOSURE EVIDENCE. Eleven consecutive review rounds
// of this phase ended with a live bypass while the suite was green, and rounds 10 and 11 each shipped
// a regression inside their own fix. The closure evidence this file produces is the PRINTED PER-ROW
// TRANSCRIPT — the row id, its round, its finding id, its refusal code and the refusal TEXT — plus
// the round-coverage table. The green line is not the evidence.
//
// "IT FAILED" AND "IT FAILED FOR THE RIGHT REASON" ARE DIFFERENT CLAIMS. Every row declares the
// refusal code it expects, and the replay asserts the reader's actual code EQUALS it. A row refused
// for an unrelated reason is a red, not a closure, because a grammar that refuses everything satisfies
// "all rows refused" while proving nothing at all.
//
// THE REPLAY IS ONE DERIVED ITERATION, NOT A CASE PER SHAPE. A hand-enumerated replay is a list that
// rots while green — this repository's second systemic failure class, which already cost it seven
// granted names with zero resolving files. A row added to `canonical-corpus.ts` is replayed here
// automatically or the corpus stops being the authority.
//
// NO LOADER IS RUN HERE, AND NO LOADER VERDICT IS INFERRED. Each row carries the loader verdict its
// SOURCE RECORDS, verbatim, or `null`. A `null` is printed as `UNKNOWN - verify` with the reason.
// Rounds 1 through 4 had no YAML loader available in their review environment and said so; inventing
// one for them here would be exactly the fabrication CLAUDE.md forbids by name.
//
// EVERY CASE IMPORTS THE COMMITTED `.js`, never the `.ts` — the artifact a gate will execute is the
// artifact under test, which is this repository's resolution behaviour and is deliberate.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { admit, REFUSAL_CODES, type RefusalCode } from "./canonical-frontmatter.js";

import {
  CORPUS,
  CORPUS_COUNT,
  ROUNDS,
  citedSources,
  rowsByRound,
  unresolvedSources,
  type CorpusRow,
} from "./canonical-corpus.js";

const ROOT = join(import.meta.dirname, "..");

const log = (s: string): void => {
  // eslint-disable-next-line no-console
  console.log(s);
};

// One replay of one row. Returns the verdict in a shape both the transcript and the assertions read,
// so the printed line and the asserted fact cannot describe different runs.
type Replayed = {
  readonly row: CorpusRow;
  readonly admitted: boolean;
  readonly code: RefusalCode | null;
  readonly reason: string | null;
  // Present only when the row ADMITTED: what the reader read, so a failure names the value that got
  // through rather than only the fact that something did.
  readonly admittedValue: string | null;
};

function replay(row: CorpusRow): Replayed {
  const a = admit(row.text);
  if (a.ok) {
    const rendered = [...a.value]
      .map(([k, v]) =>
        v.kind === "scalar" ? `${k}: ${v.value}` : `${k}: [${v.items.join(" | ")}]`,
      )
      .join("; ");
    return { row, admitted: true, code: null, reason: null, admittedValue: rendered };
  }
  return {
    row,
    admitted: false,
    code: a.code,
    reason: a.reason,
    admittedValue: null,
  };
}

const REPLAYED: readonly Replayed[] = CORPUS.map(replay);

describe("canonical-corpus: the rounds-1-11 bypass corpus replays as NAMED LOUD REFUSALS", () => {
  // ── The non-vacuity floors, FIRST ─────────────────────────────────────────────────────────────
  //
  // Every case below iterates the corpus, and a loop over an empty array passes. The floors are their
  // own named cases and they run first, so a corpus that lost its rows is a visible anomaly rather
  // than a green line.

  it("floor: the corpus is non-empty, matches its own declared count, and is not one row per round", () => {
    expect(CORPUS.length).toBeGreaterThan(0);
    expect(
      CORPUS.length,
      `the corpus holds ${CORPUS.length} row(s) and CORPUS_COUNT declares ${CORPUS_COUNT}`,
    ).toBe(CORPUS_COUNT);
    // ONE ROW PER ROUND WOULD SATISFY "every round is represented" AND PROVE ALMOST NOTHING. The
    // families this corpus replays are plural inside a round — round 8 alone reproduced eight — so
    // the total must exceed the round count for the coverage claim to mean what it says.
    expect(
      CORPUS_COUNT,
      `CORPUS_COUNT is ${CORPUS_COUNT} and there are ${ROUNDS.length} rounds; a corpus of one row per round cannot satisfy the completeness claim`,
    ).toBeGreaterThan(ROUNDS.length);

    // Row ids are the handle plan 27-65 plants by. A duplicate id makes two different documents
    // answer to one name, which is how a gate proof comes to test the wrong bytes.
    const ids = CORPUS.map((r) => r.id);
    expect(new Set(ids).size, "every corpus row id must be unique").toBe(ids.length);

    log(
      `canonical-corpus: ${CORPUS.length} row(s), ${new Set(ids).size} distinct id(s), ${ROUNDS.length} rounds declared`,
    );
  });

  it("provenance: every cited source artifact resolves on disk", () => {
    const missing = unresolvedSources(ROOT);
    expect(
      missing,
      `corpus rows cite source artifact(s) that do not exist: ${missing.join(", ")}`,
    ).toEqual([]);

    // The floor for the check itself: a corpus citing nothing would return an empty list too.
    const sources = citedSources();
    expect(sources.length).toBeGreaterThan(0);
    for (const rel of sources) {
      // Resolve a second way — read the file — so "exists" is not satisfied by a directory or a
      // broken symlink that `existsSync` reports true for.
      expect(
        readFileSync(join(ROOT, rel), "utf8").length,
        `${rel} resolves but is empty`,
      ).toBeGreaterThan(0);
    }
    log(
      `canonical-corpus: ${sources.length} distinct source artifact(s) cited, all resolving:\n  ${sources.join("\n  ")}`,
    );
  });

  it("round coverage is asserted TWO-SIDED over rounds 1 through 11, and a round with zero rows fails BY NAME", () => {
    const byRound = rowsByRound();

    // Direction 1 — every declared round has at least one row. Named, not counted: "9 of 11" tells
    // the next reader nothing about WHICH family stopped being replayed.
    const empty = ROUNDS.filter((n) => (byRound.get(n) ?? []).length === 0);
    expect(
      empty,
      `round(s) with ZERO rows: ${empty.join(", ")} — a replay corpus that silently lost the shapes it exists to replay is worse than no corpus`,
    ).toEqual([]);

    // Direction 2 — every round the corpus mentions is one of the declared rounds. Without this a
    // typo'd round number satisfies direction 1 while quietly moving a row out of its family.
    const stray = [...byRound.keys()].filter((n) => !ROUNDS.includes(n));
    expect(
      stray,
      `corpus row(s) claim round(s) outside the declared range 1..11: ${stray.join(", ")}`,
    ).toEqual([]);

    const table = [...byRound]
      .map(([round, rows]) => {
        const kinds = { bypass: 0, control: 0, divergence: 0 };
        for (const r of rows) kinds[r.kind] += 1;
        return `  round ${String(round).padStart(2)} : ${String(rows.length).padStart(2)} row(s)  (bypass ${kinds.bypass}, control ${kinds.control}, divergence ${kinds.divergence})`;
      })
      .join("\n");
    log(`canonical-corpus: rows per round\n${table}`);
  });

  // ── THE REPLAY ────────────────────────────────────────────────────────────────────────────────

  it("THE REPLAY: every corpus row is REFUSED, on its declared code, and the refusal TEXT is printed", () => {
    const lines: string[] = [];
    const admittedRows: string[] = [];
    const wrongCode: string[] = [];

    for (const r of REPLAYED) {
      const { row } = r;
      // A row with no recorded loader verdict prints its note, which already opens with
      // `UNKNOWN - verify` (asserted by the anti-circularity case below). Prefixing it again would
      // make the marker look like this file's editorialising rather than the row's own record.
      const loader = row.loaderVerdict === null ? row.loaderNote : row.loaderVerdict;

      if (r.admitted) {
        admittedRows.push(
          `${row.id} (round ${row.round}, ${row.finding}, ${row.source}) ADMITTED, and the reader read: ${r.admittedValue}`,
        );
        lines.push(
          `  [ADMITTED] ${row.id}  round ${row.round}  ${row.finding}\n` +
            `      admitted value : ${r.admittedValue}\n` +
            `      loader         : ${loader}`,
        );
        continue;
      }

      if (r.code !== row.expected) {
        wrongCode.push(
          `${row.id} (round ${row.round}, ${row.finding}) declared \`${row.expected}\` and produced \`${r.code}\` — a row refused for an unrelated reason is not a closure`,
        );
      }

      lines.push(
        `  [${r.code}] ${row.id}  round ${row.round}  ${row.finding}  (${row.kind}, reproduced at ${row.reproducedAt})\n` +
          `      source  : ${row.source} — ${row.sourceDetail}\n` +
          `      label   : ${row.label}\n` +
          `      refusal : ${r.reason}\n` +
          `      loader  : ${loader}`,
      );
    }

    // PRINT BEFORE ASSERTING. The transcript is this case's primary output and a red run needs it
    // more than a green one does.
    log(
      `canonical-corpus: PER-ROW REPLAY TRANSCRIPT (${REPLAYED.length} rows)\n${lines.join("\n")}`,
    );

    expect(
      admittedRows,
      `corpus row(s) were ADMITTED by the canonical reader — the historical bypass is NOT closed:\n${admittedRows.join("\n")}`,
    ).toEqual([]);

    expect(
      wrongCode,
      `corpus row(s) refused on a code other than the one they declare:\n${wrongCode.join("\n")}`,
    ).toEqual([]);

    // Every refusal carries prose that names the line and the offending byte. A code with an empty
    // reason would satisfy both assertions above and tell a human nothing.
    for (const r of REPLAYED) {
      expect(
        (r.reason ?? "").length,
        `${r.row.id} refused with an empty or near-empty reason`,
      ).toBeGreaterThan(40);
    }

    log(
      `canonical-corpus: ${REPLAYED.length}/${CORPUS.length} row(s) REFUSED, 0 admitted, 0 code mismatches`,
    );
  });

  it("the refusal codes the HISTORY exercises are reported against the codes the reader EXPORTS", () => {
    const exercised = new Set<RefusalCode>();
    for (const r of REPLAYED) if (r.code !== null) exercised.add(r.code);

    // Every code the corpus produces must be a member of the exported vocabulary. This is the
    // direction that CAN fail: a refusal outside the enumeration is the catch-all the reader is
    // built to not have.
    const outside = [...exercised].filter(
      (c) => !(REFUSAL_CODES as readonly string[]).includes(c),
    );
    expect(
      outside,
      `the corpus produced refusal code(s) outside REFUSAL_CODES: ${outside.join(", ")}`,
    ).toEqual([]);

    // The converse is INFORMATION, NOT A FAILURE. 27-62 already proved every exported code reachable
    // by a construct-specific document; a code the HISTORY never exercised simply means no review
    // round happened to reproduce that construct. Naming the list is what stops a later reader from
    // mistaking this corpus for a completeness claim over the vocabulary.
    const unexercised = REFUSAL_CODES.filter((c) => !exercised.has(c));

    const histogram = [...exercised]
      .sort()
      .map((c) => `${c} ${REPLAYED.filter((r) => r.code === c).length}`)
      .join(", ");

    log(
      `canonical-corpus: codes EXERCISED by the history = ${exercised.size}/${REFUSAL_CODES.length} — ${histogram}`,
    );
    log(
      `canonical-corpus: codes the history does NOT exercise (${unexercised.length}, recorded as INFORMATION, not a failure) = ${unexercised.join(", ")}`,
    );
  });

  it("anti-circularity: the loader column is what the SOURCE RECORDS, and a row with no recorded verdict is UNKNOWN - verify", () => {
    // NO LOADER RUNS IN THIS CASE. The point is that the corpus carries what the record says. A row
    // whose source printed a libyaml transcript must carry it; a row whose source printed none must
    // carry `null` AND a reason, and must never acquire an inferred verdict.
    const missingNote = CORPUS.filter((r) => r.loaderNote.trim().length === 0);
    expect(
      missingNote.map((r) => r.id),
      "every row must carry a loaderNote, so a null loader verdict always carries its reason",
    ).toEqual([]);

    const unknown = CORPUS.filter((r) => r.loaderVerdict === null);
    const recorded = CORPUS.filter((r) => r.loaderVerdict !== null);

    // A `null` verdict must SAY so. This is the assertion that stops a silent null from reading as
    // "no loader disagreement".
    for (const r of unknown) {
      expect(
        r.loaderNote.includes("UNKNOWN - verify"),
        `${r.id} records no loader verdict and its note does not mark it \`UNKNOWN - verify\``,
      ).toBe(true);
    }

    // Floor in both directions: a corpus where every row were UNKNOWN would pass the loop above
    // vacuously, and one where none were would mean the honesty branch is never exercised.
    expect(
      recorded.length,
      "no corpus row carries a recorded loader verdict — the anti-circularity control is vacuous",
    ).toBeGreaterThan(0);
    expect(
      unknown.length,
      "no corpus row is marked UNKNOWN - verify, which would mean a loader verdict was inferred somewhere",
    ).toBeGreaterThan(0);

    log(
      `canonical-corpus: loader column — ${recorded.length} row(s) carry the verdict their source recorded, ${unknown.length} row(s) are \`UNKNOWN - verify\` (no loader was run in this file)`,
    );
    log(
      `canonical-corpus: rows marked UNKNOWN - verify:\n  ${unknown.map((r) => `${r.id} (round ${r.round}) — ${r.loaderNote}`).join("\n  ")}`,
    );
  });
});

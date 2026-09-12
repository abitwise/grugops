// harness-instance-ledger.test.ts — THE LEDGER'S OWN PREMISE, ASKED BEFORE THE LEDGER IS BELIEVED.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS.
//
// `docs/audit/harness-false-result-instances.md` is the artifact the NEXT gap-closure round starts
// from. It is the one authoritative list of the instances in which a verification harness in this
// phase produced a FALSE RESULT about its own premise, and its ordinals are read off it rather than
// typed into a summary.
//
// `31-REVIEW.md`'s `WR-34` measured the list failing its own standard. Row 13's catch column ended
// *"the fixture now writes `context: { human_admission: "high-severity", audit_retention:
// "retained" }` before the shape is planted"*. `scripts/check-platform-shapes.ts` does the OPPOSITE:
// the GOV-02 ledger position was DROPPED, deliberately, with its own explanatory comment, and
// `grep -c factory.config.json` over that module finds the string only inside that comment. A
// register that states a mechanism is present where it is not hands the next round a false premise —
// which is the same class of defect the register exists to record.
//
// SO THE LIST IS CHECKED AGAINST THE TREE IT NAMES. A row NAMES its evidence, in backticks, in its
// own cells. A row CLAIMS a mechanism, in backticks, in its `How it was caught` column. This file
// asserts every claim is findable in the evidence the row itself named — no more, because a row that
// names no file makes no checkable claim about the tree, and no less, because a claim nobody can
// substantiate is exactly what `WR-34` found.
//
// THE DENOMINATOR IS ASSERTED BEFORE ANY CONCLUSION. A ledger case with an empty denominator would
// report green over nothing, and "a green from an empty denominator" is instance 4 and instance 14 of
// the very list this file reads. The row count, the checked-claim count and the exempt count are all
// printed and floored here rather than inferred from a pass.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const LEDGER = join(ROOT, "docs", "audit", "harness-false-result-instances.md");

/**
 * The one phase directory a row's short citations (`31-08-SUMMARY.md:122`) are relative to. The
 * ledger's title scopes it to phase 31, so this is the scope the ledger itself publishes rather than
 * a second convention invented here.
 */
const PHASE_DIR = join(ROOT, ".planning", "phases", "31-autonomous-manual-testing");

/** A backticked span that is a repo-relative path citation, with or without a `:line` suffix. */
const PATH_SPAN = /^[A-Za-z0-9._/-]+\.(?:ts|js|md|json)(?::\d+)?$/;

/**
 * A backticked span that is one of this repository's own IDS rather than a mechanism.
 *
 * `WR-34`, `CR-18`, `D-30 (5)`, `R-31-31-01`, `AUTO-06`, `UATX-01`, `31-36` — a finding, a decision,
 * a residual, a requirement or a plan. A citation points AT a record; it makes no claim about what
 * any file contains, so requiring it to be greppable in the evidence would test the wrong thing.
 * The shape is the repository's whole id vocabulary — letters-then-digits or plan-then-plan — and
 * NOT a list of the ids that happen to appear in the ledger today. The excluded count is PRINTED
 * below, so an exclusion that quietly grew is visible rather than inferred from a pass.
 */
const ID_SPAN = /^(?:[A-Z][A-Za-z]{0,5}|\d{2})(?:-\d{1,3}){1,3}(?:\s*\(\d+\))?$/;

interface LedgerRow {
  readonly ordinal: number;
  /** Every cell, in order: plan/document, harness, false premise, how caught, claimed ordinal. */
  readonly cells: readonly string[];
}

/**
 * Parse the ledger's instance table. The section bound is the ledger's own next heading.
 *
 * The text is a PARAMETER (31-40, `IN-21`) so a mirror of the ledger can be parsed by the same
 * function the live file goes through. Two parsers for one table would be two answers to one
 * question, and the mirrors below would then be proving something about the mirror's parser.
 */
function readRows(doc: string = readFileSync(LEDGER, "utf8")): LedgerRow[] {
  const from = doc.indexOf("## The instances");
  const to = doc.indexOf("## How this list");
  expect(from, "the ledger has no `## The instances` section").toBeGreaterThan(-1);
  expect(to, "the ledger has no section after the instance table").toBeGreaterThan(from);
  const section = doc.slice(from, to);
  return [...section.matchAll(/^\|\s*(\d+)\s*\|(.*)\|\s*$/gm)].map((m) => ({
    ordinal: Number(m[1]),
    cells: (m[2] ?? "").split("|").map((c) => c.trim()),
  }));
}

/** Backticked spans in a piece of cell text, in order. */
function spansOf(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string);
}

/**
 * The files a row NAMES, resolved against the two roots its own citations use: the repository root
 * and the phase directory its short `*-SUMMARY.md` citations are relative to. A citation that
 * resolves to neither is reported rather than silently dropped — a ledger that cites a file which
 * does not exist is the same defect one register over.
 */
function namedFiles(row: LedgerRow): { resolved: string[]; unresolved: string[] } {
  const resolved: string[] = [];
  const unresolved: string[] = [];
  for (const span of spansOf(row.cells.join(" | "))) {
    if (!PATH_SPAN.test(span)) continue;
    const bare = span.split(":")[0] as string;
    const candidate = [join(ROOT, bare), join(PHASE_DIR, bare)].find((p) => existsSync(p));
    if (candidate === undefined) unresolved.push(span);
    else if (!resolved.includes(candidate)) resolved.push(candidate);
  }
  return { resolved, unresolved };
}

/** The mechanisms a row CLAIMS, read from its `How it was caught` column only. */
function claimedMechanisms(row: LedgerRow): string[] {
  return spansOf(row.cells[3] ?? "").filter((s) => !PATH_SPAN.test(s) && !ID_SPAN.test(s));
}

/** The id citations a row makes in that same column — counted so the exclusion stays visible. */
function citedIds(row: LedgerRow): string[] {
  return spansOf(row.cells[3] ?? "").filter((s) => ID_SPAN.test(s));
}

interface LedgerTally {
  /** The denominator: how many rows were parsed at all. */
  readonly rows: number;
  /** Mechanism claims actually checked against the evidence their own row named. */
  readonly checked: number;
  /** Rows that name a readable file but claim no mechanism. */
  readonly exemptNoClaim: number;
  /** Rows that name no readable file, and therefore make no checkable claim about the tree. */
  readonly exemptNoFile: number;
  /** Id citations excluded from the claim set, counted so a quietly-grown exclusion is visible. */
  readonly excludedIds: number;
  /** Claims the evidence does not carry — the failures this file exists to report. */
  readonly offenders: readonly string[];
}

/**
 * THE ONE COUNTING AUTHORITY over a set of ledger rows (31-40, `IN-21`).
 *
 * Every count this file asserts comes from here, and the mirrors below are tallied by the same
 * function as the live ledger. Before this it was a loop inlined in one case, which is why the
 * assertion `IN-21` named could compare three terms of that loop against each other and be true by
 * construction: there was nothing else to compare them to.
 */
function tally(rows: readonly LedgerRow[]): LedgerTally {
  let checked = 0;
  let exemptNoClaim = 0;
  let exemptNoFile = 0;
  let excludedIds = 0;
  const offenders: string[] = [];

  for (const row of rows) {
    const { resolved } = namedFiles(row);
    const mechanisms = claimedMechanisms(row);
    excludedIds += citedIds(row).length;
    if (resolved.length === 0) {
      // A row that names no readable file makes no checkable claim ABOUT THE TREE. It is counted,
      // never silently skipped: an exempt count that quietly grew would empty this axis.
      exemptNoFile++;
      continue;
    }
    if (mechanisms.length === 0) {
      exemptNoClaim++;
      continue;
    }
    const evidence = resolved.map((f) => readFileSync(f, "utf8"));
    for (const mechanism of mechanisms) {
      checked++;
      if (!evidence.some((text) => text.includes(mechanism))) {
        offenders.push(
          `row ${String(row.ordinal)} claims \`${mechanism.slice(0, 120)}\`, which is in none of ` +
            `the files it names: ${resolved.map((f) => relative(ROOT, f)).join(", ")}`,
        );
      }
    }
  }
  return { rows: rows.length, checked, exemptNoClaim, exemptNoFile, excludedIds, offenders };
}

describe("31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed", () => {
  const rows = readRows();

  it("the ledger parses to a NON-ZERO row denominator, and its ordinals are the ones it publishes", () => {
    // FIRST, AND FOR A STATED REASON. Every conclusion below is drawn per row. A parse that produced
    // zero rows would report a clean pass over nothing, and a green from an empty denominator is
    // instance 4 and instance 14 of this very list — the shape this file must not repeat.
    expect(rows.length, "the ledger's instance table parsed to ZERO rows").toBeGreaterThan(0);
    const ordinals = rows.map((r) => r.ordinal);
    expect(ordinals, "the ordinals are not contiguous from 1").toEqual(
      ordinals.map((_, i) => i + 1),
    );
    // eslint-disable-next-line no-console
    console.log(`[31-37 ledger premise] rows parsed = ${String(rows.length)}`);
  });

  it("every FILE a row cites exists in the tree it names", () => {
    const offenders: string[] = [];
    let cited = 0;
    for (const row of rows) {
      const { resolved, unresolved } = namedFiles(row);
      cited += resolved.length + unresolved.length;
      for (const u of unresolved) offenders.push(`row ${String(row.ordinal)}: ${u}`);
    }
    expect(cited, "no row cites a file at all — this axis measured nothing").toBeGreaterThan(0);
    expect(offenders, `citations that resolve to no file: ${offenders.join("; ")}`).toEqual([]);
    // eslint-disable-next-line no-console
    console.log(`[31-37 ledger premise] file citations resolved = ${String(cited)}`);
  });

  it("every MECHANISM a row claims is greppable in the evidence that row itself names", () => {
    const t = tally(rows);

    // eslint-disable-next-line no-console
    console.log(
      `[31-37 ledger premise] mechanism claims checked = ${String(t.checked)}; ` +
        `rows exempt for claiming no mechanism = ${String(t.exemptNoClaim)}; ` +
        `rows exempt for naming no readable file = ${String(t.exemptNoFile)}; ` +
        `id citations excluded = ${String(t.excludedIds)}; ` +
        `rows total = ${String(t.rows)}`,
    );

    // THE FLOOR, ASSERTED BEFORE THE VERDICT. Every row could be exempt and this axis would still
    // report green, which is the vacuity shape this repository's own list records twice.
    expect(t.checked, "NO mechanism claim was checked — this axis is vacuous").toBeGreaterThan(0);

    // ── WHAT REPLACED `IN-21`'s LINE, AND WHY THE LINE WENT (plan 31-40). ───────────────────────
    //
    // WHAT WAS THERE. `exemptNoClaim + exemptNoFile + (rows with both files and mechanisms) ===
    // rows.length`. Its three terms are "no files", "files but no mechanisms" and "files and
    // mechanisms" — a PARTITION of the row set by construction, so the equality holds for every
    // possible input, including inputs this file exists to reject. It could not fail, and a floor
    // that cannot fail dilutes the one beside it that works.
    //
    // IT IS REMOVED RATHER THAN REPAIRED, because the property it reached for — "every row is
    // accounted for" — is already true of `tally` by construction and does not need asserting. What
    // the file actually cares about is the RATIO between substantiated claims and rows that
    // substantiate nothing, and that is what the two assertions below measure.
    //
    // THE FLOOR, AND THE INPUT THAT MAKES IT FAIL. More mechanism claims are checked than there are
    // rows making no checkable claim at all. It fails on a table that has grown mostly by rows
    // citing no file and claiming no mechanism — the register diluting into prose while every row
    // still parses. Both sides are measured from the parsed rows at run time; neither is a typed
    // number, because a typed number on either side is the set-literal drift class this repository
    // keeps deleting. Watched failing below against a mirror with its path citations stripped.
    expect(
      t.checked,
      `only ${String(t.checked)} mechanism claim(s) are substantiated against ${String(
        t.exemptNoClaim + t.exemptNoFile,
      )} row(s) that make no checkable claim about the tree at all. The register is diluting into ` +
        `prose: rows are being added that cite nothing greppable, so this axis keeps reporting ` +
        `green over a shrinking fraction of the list`,
    ).toBeGreaterThan(t.exemptNoClaim + t.exemptNoFile);

    // THE CEILING, IN THE OTHER DIRECTION. At most half the rows may name no readable evidence. A
    // growing population of rows that make no claim about the tree is exactly what this register
    // exists to prevent, and it must be VISIBLE rather than absorbed into an exempt count nobody
    // compares to anything. Both sides derived from the same parsed rows; watched failing below.
    expect(
      t.exemptNoFile,
      `${String(t.exemptNoFile)} of ${String(t.rows)} row(s) name no readable file, so more than ` +
        `half the ledger makes no checkable claim about the tree it describes`,
    ).toBeLessThanOrEqual(t.rows - t.exemptNoFile);

    expect(
      t.offenders,
      `the ledger claims a mechanism the tree it names does not carry:\n${t.offenders.join("\n")}`,
    ).toEqual([]);
  });
});

// ─── The two new floors are watched FAILING, because a floor nobody has seen fail is a sentence. ─
//
// `IN-21`'s line could not fail for any input. Replacing it with two that CAN is only worth
// something if somebody has watched them do it, so each is driven against a mirror of the ledger's
// own rows. The mirrors are built from the SAME `readRows` the live case goes through and are
// confirmed DIFFERENT from the live rows before any count is read.

/** A mirror of the rows with the path citations stripped from all but the first `keep` of them. */
function withPathCitationsStripped(rows: readonly LedgerRow[], keep: number): LedgerRow[] {
  return rows.map((row, i) =>
    i < keep
      ? row
      : {
          ordinal: row.ordinal,
          cells: row.cells.map((cell) =>
            cell.replace(/`([^`]+)`/g, (whole, inner: string) =>
              PATH_SPAN.test(inner) ? "(citation removed)" : whole,
            ),
          ),
        },
  );
}

describe("31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors", () => {
  const rows = readRows();

  it("PREMISE: the live tree's own reading, printed before any mirror is believed", () => {
    const live = tally(rows);
    // eslint-disable-next-line no-console
    console.log(
      `[31-40 IN-21] live reading: rows = ${String(live.rows)}; checked = ${String(live.checked)}; ` +
        `no-evidence rows = ${String(live.exemptNoFile)}; no-claim rows = ${String(live.exemptNoClaim)}`,
    );
    // THE ANCHOR for both mirrors: every row on this tree resolves at least one citation today, so
    // the no-evidence count is the thing a mirror MOVES. Asserted before either mirror runs — a
    // mirror whose starting point was already what it claims to produce proves nothing.
    expect(
      live.exemptNoFile,
      "a row already names no readable file, so the mirrors below no longer start from a tree in " +
        "which stripping citations is the only way to move the count",
    ).toBe(0);
    expect(live.checked).toBeGreaterThan(0);
  });

  it("a mirror with EVERY row's path citations stripped turns the new FLOOR red", () => {
    const mirrored = withPathCitationsStripped(rows, 0);
    expect(
      JSON.stringify(mirrored) === JSON.stringify(rows),
      "PREMISE: the stripped mirror is identical to the live rows, so anything read off it is a " +
        "reading of the live ledger wearing a mirror's name",
    ).toBe(false);
    const t = tally(mirrored);
    expect(t.rows, "the mirror lost rows — it was meant to lose citations").toBe(rows.length);
    expect(t.exemptNoFile).toBe(rows.length);
    expect(t.checked).toBe(0);
    // The floor's own comparison, run on the mirror: it FAILS, which is the whole point.
    expect(
      t.checked > t.exemptNoClaim + t.exemptNoFile,
      "the floor held on a ledger whose every row cites nothing, so it is not a floor",
    ).toBe(false);
  });

  it("a mirror with a MAJORITY of rows stripped turns the new CEILING red", () => {
    // WHY A MAJORITY AND NOT "every row names evidence". The review's remedy asks for a mirror that
    // moves the ceiling's reading. On this tree every row ALREADY names evidence — the live
    // no-evidence count is 0, asserted in the premise above — so a mirror in that direction
    // reproduces the live reading exactly and moves nothing. The reading that moves is the one
    // toward the input the ceiling exists to reject, and it is written in that direction.
    const keep = 2;
    const mirrored = withPathCitationsStripped(rows, keep);
    expect(
      JSON.stringify(mirrored) === JSON.stringify(rows),
      "PREMISE: the majority-stripped mirror is identical to the live rows",
    ).toBe(false);
    const t = tally(mirrored);
    expect(t.exemptNoFile, "the mirror did not strip the rows it said it would").toBe(
      rows.length - keep,
    );
    expect(
      t.exemptNoFile <= t.rows - t.exemptNoFile,
      "the ceiling held on a ledger where all but two rows cite nothing, so it is not a ceiling",
    ).toBe(false);
  });
});

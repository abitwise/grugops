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

/** Parse the ledger's instance table. The section bound is the ledger's own next heading. */
function readRows(): LedgerRow[] {
  const doc = readFileSync(LEDGER, "utf8");
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

    // eslint-disable-next-line no-console
    console.log(
      `[31-37 ledger premise] mechanism claims checked = ${String(checked)}; ` +
        `rows exempt for claiming no mechanism = ${String(exemptNoClaim)}; ` +
        `rows exempt for naming no readable file = ${String(exemptNoFile)}; ` +
        `id citations excluded = ${String(excludedIds)}; ` +
        `rows total = ${String(rows.length)}`,
    );
    // THE FLOOR, ASSERTED BEFORE THE VERDICT. Every row could be exempt and this axis would still
    // report green, which is the vacuity shape this repository's own list records twice.
    expect(checked, "NO mechanism claim was checked — this axis is vacuous").toBeGreaterThan(0);
    expect(exemptNoClaim + exemptNoFile + rows.filter((r) => claimedMechanisms(r).length > 0 && namedFiles(r).resolved.length > 0).length)
      .toBe(rows.length);
    expect(
      offenders,
      `the ledger claims a mechanism the tree it names does not carry:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});

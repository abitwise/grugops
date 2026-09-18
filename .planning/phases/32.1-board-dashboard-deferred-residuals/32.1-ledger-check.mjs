#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// 32.1-ledger-check.mjs — D-16's completion property, MEASURED over 32.1-LEDGER.md.
//
// WHAT THIS DECIDES. Phase 32.1 is complete when every item it enumerated carries exactly one
// terminal disposition. That is a COUNT EQUALITY between two sets derived from the same table, plus
// a second equality between the item count and the sum of the FOUR source sizes (D-22, widened by
// plan 32.1-15 to absorb this phase's OWN code review). Neither is a number this script or that
// document asserts about itself.
//
// WHY A FOURTH SOURCE (plan 32.1-15, D-16 and D-22). The first three sources are all phase 32's:
// its round-4 findings, its review warnings, and the ledger rows it carried. Phase 32.1's own code
// review was outside the enumeration, which is exactly how its ten findings sat outside a count
// that read as complete. A completion equality that cannot see its own review is an equality over
// the wrong set. The fourth source is added as a DERIVATION, not as a number: the arm below reads
// 32.1-REVIEW.md's own headings.
//
// WHY IT LIVES HERE AND NOT IN THE SUITE. A permanent vitest case that reads a phase document under
// .planning/ turns the suite RED on the commit that writes that document — this repository has
// already paid for that shape once, in a phase whose coverage case read a review file. This is a
// small derived check filed beside the phase and run as its plan's gate. The suite stays about the
// code.
//
// DEPENDENCIES: none outside Node's standard library, and it reads exactly one file.
//
// THE REPORTING SHAPE is borrowed from scripts/vacuity.ts's reportMeasured (:46-97): ordered
// branches, the vacuity floor FIRST so a zero-element parse is reported as "this check was NOT
// performed" rather than as "no findings", and a PASS line that CARRIES THE MEASUREMENT rather than
// asserting a verdict. The forbidden alternative is named there and named again here: a bare
// `if (n !== m)` with a message that prints two numbers tells a reader nineteen versus eighteen and
// nothing about which item to go and write.
//
// THE PREMISE-FIRST ORDER is borrowed from scripts/context-io-writer-set.test.ts (:229-248). This
// repository has recorded a FALSE verification-harness premise six times across four rounds. A
// check over an empty parse is TRUE over nothing, so the premise is asked before the equality and
// not after it.
// ---------------------------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const LEDGER = join(HERE, "32.1-LEDGER.md");

// The FOUR SOURCE DOCUMENTS, read so the denominator can be derived a second time WITHOUT this
// document's participation. See step (3b) for why that second derivation exists.
const PHASE32 = join(HERE, "..", "32-board-projector-cli-dashboard");
const REVIEW_FINDINGS = join(PHASE32, "32-40-ADVERSARIAL-REVIEW.md");
const REVIEW_WARNINGS = join(PHASE32, "32-REVIEW.md");
const CONTEXT = join(HERE, "32.1-CONTEXT.md");
const REVIEW_32_1 = join(HERE, "32.1-REVIEW.md");

// The three spellings 32.1-LEDGER.md's disposition column may carry. This is a CLOSED set: a cell
// outside it is not a fourth disposition, it is a row missing one, and step 2 names it as such.
const TERMINAL = new Set([
  "closed-with-reproduction",
  "waived-with-reason",
  "re-homed-with-named-owner",
]);

// The table is located by its own HEADER rather than by position in the file, so inserting a
// section above it cannot move what this script reads.
const HEADER = /^\|\s*item\s*\|\s*source\s*\|\s*requirement\s*\|\s*disposition\s*\|\s*evidence\s*\|/;
const DELIM = /^\|[\s:|-]+\|$/;

const failures = [];
function fail(msg) {
  failures.push(msg);
  console.error("FAIL  " + msg);
}

// --- parse -----------------------------------------------------------------------------------

const lines = readFileSync(LEDGER, "utf8").split("\n");
const start = lines.findIndex((l) => HEADER.test(l));
if (start === -1) {
  console.error(
    "FAIL  premise: no item table found in " + LEDGER + " — the header row " +
      "`| item | source | requirement | disposition | evidence |` is absent, so this check " +
      "parsed nothing and every equality below would hold over an empty set.",
  );
  process.exit(1);
}

const rows = [];
for (let i = start + 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.startsWith("|")) break;      // the table ends at the first non-table line
  if (DELIM.test(line)) continue;        // the header/body delimiter is not an item
  // Split on UNESCAPED separators only. A cell carrying `\|` must not shift the column index —
  // that is the exact hazard .planning/WINDOWS.md's own reconciliation refuses by name.
  const cells = line.replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim());
  rows.push({ line: i + 1, item: cells[0], source: cells[1], disposition: cells[3] });
}

// --- (1) VACUITY FLOOR — asked BEFORE the equality, never after -------------------------------

if (rows.length === 0) {
  console.error(
    "FAIL  premise: the item table parsed ZERO rows. A completion check over an empty parse is " +
      "TRUE over nothing: it would report that every one of no items carries a disposition. " +
      "The equality below has not been asked, because there was nothing to ask it of.",
  );
  process.exit(1);
}

const itemCount = rows.length;

// --- (2) THE COMPLETION EQUALITY — and a failure message that NAMES the items ------------------

const missing = rows.filter((r) => !TERMINAL.has(r.disposition));
const terminalCount = itemCount - missing.length;

if (terminalCount !== itemCount) {
  fail(
    "completion equality: " + terminalCount + " of " + itemCount + " item(s) carry a terminal " +
      "disposition. The " + missing.length + " that do not are named below — a bare count tells a " +
      "reader nothing about which item to go and write:\n" +
      missing
        .map(
          (r) =>
            "        " + LEDGER.split("/").pop() + ":" + r.line + "  item `" + r.item +
            "` carries `" + (r.disposition || "(empty)") + "`, which is not one of " +
            [...TERMINAL].join(" / "),
        )
        .join("\n"),
  );
}

// --- (3) D-22's HALF — the denominator is the SUM of the derived source sizes ------------------
//
// The sizes are DERIVED from the table's own source column. They are not numbers this script knows:
// when a fourth source appeared (plan 32.1-15), the sum moved and this assertion carried it without
// a line changing here. That is what makes the denominator a measurement rather than a claim the
// document makes about itself. The only number this step pins is HOW MANY distinct sources D-22
// names, and that pin is below.

const bySource = new Map();
for (const r of rows) bySource.set(r.source, (bySource.get(r.source) || 0) + 1);
const sourceSum = [...bySource.values()].reduce((a, b) => a + b, 0);
const sourceSummary = [...bySource.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([name, n]) => name + " " + n)
  .join(", ");

if (sourceSum !== itemCount) {
  fail(
    "denominator: the " + bySource.size + " source sizes sum to " + sourceSum + " but the table holds " +
      itemCount + " item row(s). Derived sizes: " + sourceSummary + ". D-22 requires the " +
      "denominator to be a measurement over named sources, so a row whose source cell is blank " +
      "or unrecognised breaks the sum rather than being quietly absorbed.",
  );
}

// D-22 named three sources; plan 32.1-15 widened it to FOUR by adding this phase's own code review.
// The pin moves with the decision and never drifts silently: a fifth source, or a source whose rows
// all vanished, reds here by name.
const SOURCE_COUNT = 4;
if (bySource.size !== SOURCE_COUNT) {
  fail(
    "denominator: the source column yields " + bySource.size + " distinct source(s), not the " +
      SOURCE_COUNT + " D-22 names as widened by plan 32.1-15. Derived: " + sourceSummary,
  );
}

// --- (3b) THE DENOMINATOR, DERIVED A SECOND TIME — from the SOURCES, not from this document ----
//
// WHY THIS EXISTS. Step (3) derives the three source sizes from the table's own source column, so
// its sum and the item count are two readings of the SAME rows: delete an item row and both fall
// together, and the equality holds at 18 = 18 while an item has silently vanished. A vacuity floor
// catches an EMPTY denominator; it never catches a SILENTLY SHORT one. The fix this repository has
// recorded for that is to derive the ELEMENT count independently of the loop that consumes it.
//
// So the denominator is derived AGAIN, from the four documents D-22 names as widened by plan
// 32.1-15, none of which is 32.1-LEDGER.md:
//   * the round-4 findings  — the OPEN `### F-NN` headings of 32-40-ADVERSARIAL-REVIEW.md § 12
//     (F-22 is CLOSED (harness) and recorded outside the ratio, so it is outside this count too);
//   * the review warnings   — the `### WR-NN:` headings of 32-REVIEW.md § Warnings;
//   * the ledger rows       — the bolded row ids in 32.1-CONTEXT.md's phase-boundary bullet, MINUS
//     any that fall inside the finding rows' own id range, which that bullet also names;
//   * THIS PHASE'S OWN REVIEW — the `### WR-NN:` and `### IN-NN:` headings of 32.1-REVIEW.md. Both
//     kinds count: a review's information items are work the phase did, and leaving them outside
//     the enumeration is the same blindness at one register lower. That document ALSO carries its
//     own `findings:` counters in frontmatter, and this arm asserts the headings and the counters
//     agree — a heading somebody mistyped is then a red here rather than a silently short source.
//
// That last subtraction is the nineteen-versus-twenty reconciliation, DERIVED rather than read out
// of a paragraph: the phase boundary says "the eight carried ... ledger rows" and then lists eight
// ids, one of which (row 207) it immediately identifies as F-21 — already counted as a finding.
// Dropping it is what turns twenty into nineteen, and this check performs that subtraction itself
// so the reconciliation is a measurement rather than a sentence.

function derivedDenominator() {
  const findings = (readFileSync(REVIEW_FINDINGS, "utf8").match(/^### F-\d+ — OPEN/gm) || []).length;
  const warnings = (readFileSync(REVIEW_WARNINGS, "utf8").match(/^### WR-\d+:/gm) || []).length;

  // The fourth source: this phase's own review, counted from its headings and cross-checked
  // against the counters the same document publishes about itself.
  const r = readFileSync(REVIEW_32_1, "utf8");
  const ownWarnings = (r.match(/^### WR-\d+:/gm) || []).length;
  const ownInfo = (r.match(/^### IN-\d+:/gm) || []).length;
  const own = ownWarnings + ownInfo;
  const fm = /^---\n([\s\S]*?)\n---/.exec(r);
  const counted = (key) => {
    const m = fm && new RegExp("^\\s*" + key + ":\\s*(\\d+)\\s*$", "m").exec(fm[1]);
    return m ? Number(m[1]) : null;
  };
  const fmWarning = counted("warning");
  const fmInfo = counted("info");
  if (fmWarning === null || fmInfo === null) {
    return { ok: false, why: "32.1-REVIEW.md's own `findings:` counters did not parse" };
  }
  if (fmWarning !== ownWarnings || fmInfo !== ownInfo) {
    return {
      ok: false,
      why:
        "32.1-REVIEW.md disagrees with itself: its headings yield " + ownWarnings + " warning(s) " +
        "and " + ownInfo + " information item(s), while its frontmatter counters say " + fmWarning +
        " and " + fmInfo + ". The fourth source's size is therefore not established",
    };
  }

  const ctx = readFileSync(CONTEXT, "utf8");
  // The finding rows' id range, as the phase boundary itself states it (an en dash or a hyphen).
  const range = /WINDOWS\.md rows (\d+)[–-](\d+)/.exec(ctx);
  // The carried-rows bullet, bounded at the next top-level bullet so a later one cannot join it.
  const bullet = /- the eight carried or undecidable ledger rows re-homed here:([\s\S]*?)\n- /.exec(ctx);
  if (!range || !bullet) {
    return { ok: false, why: "the phase boundary's row range or carried-rows bullet did not parse" };
  }
  const lo = Number(range[1]);
  const hi = Number(range[2]);
  const ids = [...new Set((bullet[1].match(/\*\*(\d+)\*\*/g) || []).map((m) => Number(m.slice(2, -2))))];
  const carried = ids.filter((id) => id < lo || id > hi);
  const doubleCounted = ids.filter((id) => id >= lo && id <= hi);
  return {
    ok: true,
    findings,
    warnings,
    carried: carried.length,
    own,
    total: findings + warnings + carried.length + own,
    detail:
      "findings " + findings + " (OPEN `### F-NN` headings) + ledger rows " + carried.length +
      " (" + carried.sort((a, b) => a - b).join(", ") + "; " + doubleCounted.length +
      " id(s) dropped as already counted among the findings at rows " + lo + "-" + hi +
      ": " + (doubleCounted.join(", ") || "none") + ") + review warnings " + warnings +
      " + 32.1 review items " + own + " (" + ownWarnings + " `### WR-NN:` + " + ownInfo +
      " `### IN-NN:` headings of 32.1-REVIEW.md, agreeing with that file's own counters)",
  };
}

const second = derivedDenominator();
if (!second.ok) {
  fail(
    "second denominator: " + second.why + ". The independent derivation did not run, so the item " +
      "count below rests on a single reading of the table it is counting.",
  );
} else if (second.total !== itemCount) {
  fail(
    "second denominator: the four SOURCE DOCUMENTS yield " + second.total + " item(s) but the " +
      "table holds " + itemCount + ". " + second.detail + ". The two derivations are independent " +
      "on purpose — the table's own source column falls with the table, so a deleted item row " +
      "would keep step (3) green at " + itemCount + " = " + itemCount + " while an item vanished.",
  );
}

// --- (4) the PASS line CARRIES THE MEASUREMENT -------------------------------------------------

if (failures.length > 0) {
  console.error("\n" + failures.length + " failure(s). Phase 32.1's completion property does NOT hold.");
  process.exit(1);
}

console.log(
  "PASS  32.1 completion equality: " + terminalCount + " of " + itemCount +
    " item(s) carry exactly one terminal disposition, over a denominator of " + sourceSum +
    " derived from " + bySource.size + " named source(s) [" + sourceSummary + "]. " +
    "Dispositions: " +
    [...TERMINAL]
      .map((d) => d + " " + rows.filter((r) => r.disposition === d).length)
      .join(", ") +
    ".\n" +
    "      The same denominator derived AGAIN from the four source documents, without this " +
    "document's participation: " + second.total + " — " + second.detail + ".",
);

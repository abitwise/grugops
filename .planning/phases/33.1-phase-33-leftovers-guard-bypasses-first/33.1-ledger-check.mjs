#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// 33.1-ledger-check.mjs — every finding of every gap-round review is folded or ledgered.
//
// WHAT THIS DECIDES. Phase 33.1 D-06 / D-20: nothing a review finds is silently dropped. The
// script holds a table of review rounds, one row per byte snapshot. For each finding of each
// round it answers, per finding, one of two things:
//   folded   — the finding id is named in the `requirements:` frontmatter of one of that round's
//              closing plans (round 1: 33.1-22-PLAN.md to 33.1-34-PLAN.md; round 2: 33.1-36-PLAN.md
//              to 33.1-42-PLAN.md);
//   ledgered — deferred-items.md has a table row whose "Found in" cell ENDS WITH that round's
//              suffix ("(gap round 1 re-review)" or "(gap round 2 review)") and whose Item cell
//              starts with the finding id, and that row's reason ends "Open." or "Accepted.".
// It prints the lines grouped per round (`<id> folded (<plans>)` or `<id> ledgered`) and exits 1
// when any round fails: a finding that is neither, a finding count that is not the round's
// expected count, or an input that cannot be read.
//
// WHY THERE ARE TWO SNAPSHOTS. /gsd-code-review writes its report to one fixed path in this phase
// directory and overwrites whatever is there on every re-review. Each round's finding set is
// therefore read from a committed byte snapshot of that report, which no later review can
// overwrite: 33.1-REVIEW-GAP-ROUND-1.md (the gap-round-1 re-review, at commit b70d2063) and
// 33.1-REVIEW-GAP-ROUND-2.md (the gap-round-2 review, at commit 126cf7cd). This script never
// opens the live report path, and ledger rows are found by the suffix of their "Found in" cell
// alone, so the live report's file name is never spelled outside these comments.
//
// THE COUNT IS DERIVED TWICE. Per round, the finding ids come from the snapshot's `### <ID>:`
// headings, and the snapshot's own frontmatter states `total:`. The two must agree, and both must
// equal the round's expected count, so a heading the pattern missed (a silently short set) fails
// instead of passing on fewer findings.
//
// DEPENDENCIES: none outside Node's standard library.
//
// USAGE: node .planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-ledger-check.mjs
// ---------------------------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const LEDGER = join(HERE, "deferred-items.md");
const ID = /^(?:CR|WR|IN)-\d+/;

const ROUNDS = [
  {
    name: "gap round 1",
    snapshot: "33.1-REVIEW-GAP-ROUND-1.md",
    plans: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
    suffix: "(gap round 1 re-review)",
    expected: 13,
  },
  {
    name: "gap round 2",
    snapshot: "33.1-REVIEW-GAP-ROUND-2.md",
    plans: [36, 37, 38, 39, 40, 41, 42],
    suffix: "(gap round 2 review)",
    expected: 12,
  },
];

function read(path, problems) {
  try {
    return readFileSync(path, "utf8");
  } catch (e) {
    problems.push(`cannot read ${path}: ${e && e.code ? e.code : String(e)}`);
    return null;
  }
}

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  return m ? m[1] : null;
}

function checkRound(round) {
  const problems = [];
  const lines = [];

  // 1. The finding set, from the round's snapshot only.
  const snapshot = read(join(HERE, round.snapshot), problems);
  const findings = [];
  if (snapshot !== null) {
    for (const line of snapshot.split(/\r?\n/)) {
      const m = /^### ((?:CR|WR|IN)-\d+):/.exec(line);
      if (m) findings.push(m[1]);
    }
    const fm = frontmatter(snapshot);
    const total = fm === null ? null : /^\s*total:\s*(\d+)\s*$/m.exec(fm);
    if (total === null) {
      problems.push("the snapshot's frontmatter states no findings total");
    } else if (Number(total[1]) !== findings.length) {
      problems.push(`the snapshot's frontmatter says total ${total[1]}, its headings name ${findings.length}`);
    }
    if (new Set(findings).size !== findings.length) {
      problems.push(`the snapshot names a finding id twice: ${findings.join(", ")}`);
    }
  }
  if (findings.length !== round.expected) {
    problems.push(`expected ${round.expected} findings in the snapshot, found ${findings.length}`);
  }

  // 2. The requirements of every closing plan of this round.
  const foldedIn = new Map(); // id -> [plan]
  for (const n of round.plans) {
    const plan = `33.1-${n}`;
    const text = read(join(HERE, `${plan}-PLAN.md`), problems);
    if (text === null) continue;
    const fm = frontmatter(text);
    const line = fm === null ? null : /^requirements:\s*(\[.*\])\s*$/m.exec(fm);
    if (line === null) {
      problems.push(`${plan}-PLAN.md has no requirements array in its frontmatter`);
      continue;
    }
    let ids;
    try {
      ids = JSON.parse(line[1]);
    } catch {
      problems.push(`${plan}-PLAN.md requirements is not a readable list: ${line[1]}`);
      continue;
    }
    if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string")) {
      problems.push(`${plan}-PLAN.md requirements is not a list of strings`);
      continue;
    }
    for (const id of ids) {
      if (!foldedIn.has(id)) foldedIn.set(id, []);
      foldedIn.get(id).push(plan);
    }
  }

  // 3. The ledger rows for this round, identified by the suffix of their "Found in" cell.
  const ledgered = new Set();
  const ledger = read(LEDGER, problems);
  if (ledger !== null) {
    for (const line of ledger.split(/\r?\n/)) {
      if (!line.startsWith("|")) continue;
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (!cells[0] || !cells[0].endsWith(round.suffix)) continue;
      if (cells.length !== 4) {
        problems.push(`a ledger row for this round does not have 4 cells: ${line.slice(0, 120)}`);
        continue;
      }
      const id = ID.exec(cells[2]);
      if (id === null) {
        problems.push(`a ledger row for this round names no finding id at the start of its Item cell: ${cells[2].slice(0, 80)}`);
        continue;
      }
      if (!/(?:Open|Accepted)\.$/.test(cells[3])) {
        problems.push(`${id[0]}: its ledger row's reason does not end "Open." or "Accepted."`);
        continue;
      }
      ledgered.add(id[0]);
    }
  }

  // 4. One line per finding.
  for (const id of findings) {
    const plans = foldedIn.get(id);
    if (plans && plans.length > 0) {
      lines.push(`${id} folded (${plans.join(", ")})`);
    } else if (ledgered.has(id)) {
      lines.push(`${id} ledgered`);
    } else {
      problems.push(`${id} is neither folded into a closing plan of this round nor ledgered`);
    }
  }
  return { findings, lines, problems };
}

let failed = false;
for (const round of ROUNDS) {
  const { findings, lines, problems } = checkRound(round);
  console.log(`== ${round.name} (${round.snapshot})`);
  for (const l of lines) console.log(l);
  if (problems.length > 0) {
    failed = true;
    for (const p of problems) console.error(`FAIL ${round.name}: ${p}`);
  } else {
    console.error(`OK ${round.name}: ${findings.length} findings, each folded or ledgered`);
  }
}
if (failed) process.exit(1);

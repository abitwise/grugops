#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// 33.1-ledger-check.mjs — every finding of the gap-round-1 re-review is folded or ledgered.
//
// WHAT THIS DECIDES. Phase 33.1 D-06 / D-20: nothing a review finds is silently dropped. For each
// finding of the gap-round-1 re-review this script answers, per finding, one of two things:
//   folded   — the finding id is named in the `requirements:` frontmatter of a round-2 code plan
//              (33.1-22-PLAN.md to 33.1-34-PLAN.md);
//   ledgered — deferred-items.md has a table row whose "Found in" cell ENDS WITH the suffix
//              "(gap round 1 re-review)" and whose Item cell starts with the finding id, and that
//              row's reason ends "Open." or "Accepted.".
// It prints one line per finding (`<id> folded (<plans>)` or `<id> ledgered`) and exits 1 when a
// finding is neither, when the finding count is not 13, or when an input cannot be read.
//
// WHY IT READS THE SNAPSHOT. /gsd-code-review writes its report to one fixed path in this phase
// directory and overwrites whatever is there. The finding set is therefore read from the committed
// byte snapshot 33.1-REVIEW-GAP-ROUND-1.md (a copy of that report at commit b70d2063), which no
// later review can overwrite. This script never opens the live report path. Ledger rows are found
// by the suffix of their "Found in" cell alone, so the live report's file name is never spelled here.
//
// THE COUNT IS DERIVED TWICE. The finding ids come from the snapshot's `### <ID>:` headings, and
// the snapshot's own frontmatter states `total:`. The two must agree, and both must be 13, so a
// heading the pattern missed (a silently short set) fails instead of passing on fewer findings.
//
// DEPENDENCIES: none outside Node's standard library.
//
// USAGE: node .planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-ledger-check.mjs
// ---------------------------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = join(HERE, "33.1-REVIEW-GAP-ROUND-1.md");
const LEDGER = join(HERE, "deferred-items.md");
const PLAN_NUMBERS = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34];
const EXPECTED_FINDINGS = 13;
const LEDGER_SUFFIX = "(gap round 1 re-review)";
const ID = /^(?:CR|WR|IN)-\d+/;

const problems = [];

function read(path) {
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

// 1. The finding set, from the snapshot only.
const snapshot = read(SNAPSHOT);
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
if (findings.length !== EXPECTED_FINDINGS) {
  problems.push(`expected ${EXPECTED_FINDINGS} findings in the snapshot, found ${findings.length}`);
}

// 2. The requirements of every round-2 code plan.
const foldedIn = new Map(); // id -> [plan]
for (const n of PLAN_NUMBERS) {
  const plan = `33.1-${n}`;
  const text = read(join(HERE, `${plan}-PLAN.md`));
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

// 3. The ledger rows for this review, identified by the suffix of their "Found in" cell.
const ledgered = new Set();
const ledger = read(LEDGER);
if (ledger !== null) {
  for (const line of ledger.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (!cells[0] || !cells[0].endsWith(LEDGER_SUFFIX)) continue;
    if (cells.length !== 4) {
      problems.push(`a ledger row for this review does not have 4 cells: ${line.slice(0, 120)}`);
      continue;
    }
    const id = ID.exec(cells[2]);
    if (id === null) {
      problems.push(`a ledger row for this review names no finding id at the start of its Item cell: ${cells[2].slice(0, 80)}`);
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
    console.log(`${id} folded (${plans.join(", ")})`);
  } else if (ledgered.has(id)) {
    console.log(`${id} ledgered`);
  } else {
    problems.push(`${id} is neither folded into a round-2 plan nor ledgered`);
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`FAIL: ${p}`);
  process.exit(1);
}
console.error(`OK: ${findings.length} findings, each folded or ledgered`);

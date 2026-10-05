#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// 33.1-env-claim-scan.mjs — the published-claim scan for decision 33.1 D-31, Q4 (plan 33.1-41).
//
// WHAT IT PROVES. After plan 33.1-41 the git-host check (tools/grugops/host-protection.js) does not
// read the production environment: its environment line reads `UNKNOWN - verify` by design. This
// scan finds every published or watched document that could still say otherwise, and every
// paragraph in it that refers to the check and mentions an environment, and it fails while any such
// paragraph does not cite `33.1 D-31`. So it proves that every such paragraph was revisited for Q4.
//
// WHAT IT DOES NOT PROVE. It does not prove that the new sentence is true. A paragraph that cites
// 33.1 D-31 and still says the check reads the environment passes this scan. The per-paragraph table
// in 33.1-41-SUMMARY.md and a reader of the committed host-protection.js cover that.
//
// THE UNIVERSE (derived, never typed). `git ls-files` of docs/**/*.md, agent-factory/**/*.md,
// install/**/*.md and the top-level *.md files, minus two exclusions, each printed with its reason:
//   - docs/audit/29-style-dispositions/ — append-only per-plan diff records whose `before` column
//     quotes text as it was;
//   - CHANGELOG.md outside `## [Unreleased]` — released history.
// A PARAGRAPH is a run of non-blank lines; a heading, a table row and a list item each start a new
// one.
// THE DOCUMENT SET: a file that names the check (`host-protection`, `host check` or `git-host check`,
// any case), or that holds a paragraph stating the environment floor (`production environment`,
// `deployment environment` or `prod environment`, together with `hard floor`, `git host`,
// `required reviewer` or a check name). Its size is pinned as EXPECTED_DOCUMENTS; a different count
// fails, printing the difference, so a new document that describes the check is never missed
// silently.
// A CLAIM: a paragraph of the set that refers to the check (a check name, `the check` or
// `this script`) and mentions `environment`, without citing `33.1 D-31`. A paragraph that matches
// but is about another check goes in NOT_THE_HOST_CHECK with its reason.
//
// DEPENDENCIES: Node's standard library and `git` on PATH.
// USAGE: node 33.1-env-claim-scan.mjs        (exit 0: the pinned count and no claim; exit 1 otherwise)
// ---------------------------------------------------------------------------------------------

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

// Pinned to the count this plan derived at its start (11 at planning commit 9f7618dc).
const EXPECTED_DOCUMENTS = 11;

// `<file>:<first line>` → why the paragraph is about another check. Empty at planning.
const NOT_THE_HOST_CHECK = {};

const EXCLUDED = [
  ["docs/audit/29-style-dispositions/", "append-only per-plan diff records; their `before` column quotes text as it was"],
  ["CHANGELOG.md outside `## [Unreleased]`", "released history"],
];

const CHECK_NAME = /host-protection|host check|git-host check/i;
const REFERS_TO_CHECK = /host-protection|host check|git-host check|\bthe check\b|\bthis script\b/i;
const ENV_FLOOR = /\b(production|deployment|prod) environment/i;
const FLOOR_CONTEXT = /hard floor|git host|required reviewer|host-protection|host check|git-host check/i;
const CITES_Q4 = "33.1 D-31";

const tracked = execFileSync("git", ["ls-files", "-z", "--", "docs", "agent-factory", "install", "*.md"], { cwd: REPO_ROOT, encoding: "utf8" })
  .split("\0")
  .filter((p) => p.endsWith(".md"))
  .filter((p) => p.startsWith("docs/") || p.startsWith("agent-factory/") || p.startsWith("install/") || !p.includes("/"))
  .filter((p) => !p.startsWith(EXCLUDED[0][0]))
  .sort();

// The paragraphs of a file, each with its first line number in the whole file (1-based). For
// CHANGELOG.md only the `## [Unreleased]` section is read; line numbers still count from the top.
function paragraphs(path) {
  const lines = readFileSync(join(REPO_ROOT, path), "utf8").split(/\r?\n/);
  let from = 0;
  let to = lines.length;
  if (path === "CHANGELOG.md") {
    from = lines.findIndex((l) => l.startsWith("## [Unreleased]"));
    if (from < 0) return [];
    const next = lines.findIndex((l, i) => i > from && l.startsWith("## "));
    to = next < 0 ? lines.length : next;
  }
  const out = [];
  let cur = null;
  const starts = (l) => /^\s*#/.test(l) || /^\s*\|/.test(l) || /^\s*([-*+]|\d+[.)])\s/.test(l);
  for (let i = from; i < to; i++) {
    const l = lines[i];
    if (l.trim() === "") {
      cur = null;
      continue;
    }
    if (cur === null || starts(l)) {
      cur = { line: i + 1, text: l };
      out.push(cur);
    } else {
      cur.text += `\n${l}`;
    }
  }
  return out;
}

const members = [];
for (const path of tracked) {
  const paras = paragraphs(path);
  const why = [];
  if (paras.some((p) => CHECK_NAME.test(p.text))) why.push("names the check");
  if (paras.some((p) => ENV_FLOOR.test(p.text) && FLOOR_CONTEXT.test(p.text))) why.push("states the production-environment floor");
  if (why.length > 0) members.push({ path, why, paras });
}

console.log(`universe: ${tracked.length} tracked markdown file(s); excluded:`);
for (const [what, reason] of EXCLUDED) console.log(`  - ${what}: ${reason}`);
console.log(`document set: ${members.length} file(s) (EXPECTED_DOCUMENTS ${EXPECTED_DOCUMENTS})`);
for (const m of members) console.log(`  ${m.path} (${m.why.join("; ")})`);
console.log(`NOT_THE_HOST_CHECK: ${Object.keys(NOT_THE_HOST_CHECK).length} entr${Object.keys(NOT_THE_HOST_CHECK).length === 1 ? "y" : "ies"}`);

let failed = false;
if (members.length !== EXPECTED_DOCUMENTS) {
  failed = true;
  console.log(`FAIL document count: found ${members.length}, pinned ${EXPECTED_DOCUMENTS} (a difference of ${members.length - EXPECTED_DOCUMENTS})`);
}

let claims = 0;
for (const m of members) {
  for (const p of m.paras) {
    if (!REFERS_TO_CHECK.test(p.text) || !/environment/i.test(p.text) || p.text.includes(CITES_Q4)) continue;
    const key = `${m.path}:${p.line}`;
    if (NOT_THE_HOST_CHECK[key] !== undefined) continue;
    claims++;
    console.log(`CLAIM ${key}: ${p.text.replace(/\s+/g, " ").slice(0, 160)}`);
  }
}
console.log(`claims: ${claims}`);
if (claims > 0) failed = true;
process.exit(failed ? 1 : 0);

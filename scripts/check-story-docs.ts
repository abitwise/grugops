// check-story-docs.ts — the story-docs gate (phase 43, plan 43-03; D-22, D-23, D-11).
//
// One small gate that keeps the project's story honest in three places a reader meets it:
//
//   1. CLAUDE.md names no `/grug` command word (D-23). The command that ships is `/grugops`; a
//      Claude Code session in this repository reads CLAUDE.md as an instruction, so a stale command
//      name there is a wrong instruction. There is no exemption list: a historical mention is
//      reworded without the slash token.
//   2. Any public page, and the install guide, that mentions parallel work carries the GAP-D1
//      sentence (D-22): parallel scheduling is real on hosts with a spawn tool, and the own-session
//      capture that would prove it live is still `UNKNOWN - verify`. The match is an exact byte
//      substring, so an en dash or missing backticks is a finding.
//
// Each check builds a `Measured` and folds it with `reportMeasured` (scripts/vacuity.ts), so a check
// that visited nothing, or a scan set that came up short, is a failure and never a PASS line.
//
// The scan root honors CHECK_ROOT, as the other gates do, so scripts/check-story-docs.test.ts can
// run this committed `.js` against a hermetic mirror. `isEntrypoint` guards the run so the test can
// import the pure functions below without running the gate.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { reportMeasured, type Measured } from "./vacuity.js";
// The public-docs corpus is declared once, in the vocabulary gate; this gate never types a list of
// pages. Both modules read CHECK_ROOT, so a mirror run scans the mirror's corpus.
import { publicDocsCorpus, publicDocsDerivationRefusals } from "./check-public-docs-vocabulary.js";

const ROOT = process.env.CHECK_ROOT ? process.env.CHECK_ROOT : join(import.meta.dirname, "..");

let FAILS = 0;
const emit = {
  pass(m: string): void {
    process.stdout.write(`  PASS  ${m}\n`);
  },
  fail(m: string): void {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
  },
};

/** Read a root-relative file, or null when it cannot be read (the caller counts it as not visited). */
function readOrNull(rel: string): string | null {
  try {
    return readFileSync(join(ROOT, ...rel.split("/")), "utf8");
  } catch {
    return null;
  }
}

/** A finding tied to one line of one file. */
export interface LineFinding {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

const excerpt = (s: string): string => {
  const t = s.trim();
  return t.length > 160 ? `${t.slice(0, 157)}...` : t;
};

const renderLine = (f: LineFinding): string => `    ${f.file}:${f.line}: ${f.text}`;

// ---------------------------------------------------------------------------------------------
// Check 1 — the `/grug` command word (D-23).
// ---------------------------------------------------------------------------------------------

// `/grug` as a whole command word: `/grug`, `/grug:plan`, `/grug-map`, `/grug-release`. Not
// `/grugops` (the shipped name), and not a path segment such as `commands/grug.md` or
// `.claude/skills/grug/`, where a word character, `.`, `/` or `-` sits right before the slash.
export const GRUG_COMMAND_WORD = /(?<![\w./-])\/grug(?!ops)(?![A-Za-z0-9_])/;

// The one file this check reads.
export const GRUG_SCAN_SET: readonly string[] = ["CLAUDE.md"];

/** One finding per line of `text` that carries a `/grug` command word. Lines are 1-based. */
export function grugCommandFindings(text: string, file: string = "CLAUDE.md"): LineFinding[] {
  const out: LineFinding[] = [];
  text.split("\n").forEach((line, i) => {
    if (GRUG_COMMAND_WORD.test(line)) out.push({ file, line: i + 1, text: excerpt(line) });
  });
  return out;
}

function runGrugCheck(): void {
  let visited = 0;
  const findings: LineFinding[] = [];
  for (const rel of GRUG_SCAN_SET) {
    const text = readOrNull(rel);
    if (text === null) continue;
    visited += 1;
    findings.push(...grugCommandFindings(text, rel));
  }
  const m: Measured<LineFinding> = {
    label: "STORY-05 /grug command word (CLAUDE.md names only the shipped /grugops commands)",
    visited,
    expected: GRUG_SCAN_SET.length,
    findings,
  };
  reportMeasured(m, emit, renderLine);
}

// ---------------------------------------------------------------------------------------------
// Check 2 — the GAP-D1 sentence on pages that mention parallel work (D-22).
// ---------------------------------------------------------------------------------------------

// The exact sentence from 43-CONTEXT <specifics>, backticks included.
export const GAP_D1_SENTENCE =
  "parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify` (GAP-D1)";

// `parallel` as a whole word, any case. `parallelism` and `unparalleled` do not trigger.
export const PARALLEL_WORD = /\bparallel\b/i;

// The install guide is not in the public-docs corpus, and it says role agents run in parallel.
export const GAP_D1_EXTRA: readonly string[] = ["install/README.md"];

/** A finding that names a whole file. */
export interface FileFinding {
  readonly file: string;
  readonly reason: string;
}

/** One finding per page that says `parallel` and lacks the exact GAP-D1 sentence. */
export function gapD1Findings(pages: readonly { readonly file: string; readonly text: string }[]): FileFinding[] {
  const out: FileFinding[] = [];
  for (const { file, text } of pages) {
    if (!PARALLEL_WORD.test(text)) continue;
    if (text.includes(GAP_D1_SENTENCE)) continue;
    const line = text.split("\n").findIndex((l) => PARALLEL_WORD.test(l)) + 1;
    out.push({
      file,
      reason: `says "parallel" (first at line ${line}) without the GAP-D1 sentence: ${GAP_D1_SENTENCE}`,
    });
  }
  return out;
}

/** The pages check 2 reads: the public-docs corpus plus the install guide, each once. */
export function gapD1ScanSet(): string[] {
  return [...new Set([...publicDocsCorpus(), ...GAP_D1_EXTRA])];
}

function runGapD1Check(): void {
  for (const r of publicDocsDerivationRefusals()) {
    emit.fail(`STORY-05 GAP-D1: the public-docs corpus derivation refused: ${r}`);
  }
  const scan = gapD1ScanSet();
  const pages: { file: string; text: string }[] = [];
  for (const rel of scan) {
    const text = readOrNull(rel);
    if (text !== null) pages.push({ file: rel, text });
  }
  const m: Measured<FileFinding> = {
    label: "STORY-05 GAP-D1 (a page that mentions parallel work states the open own-session gap)",
    visited: pages.length,
    expected: scan.length,
    findings: gapD1Findings(pages),
  };
  reportMeasured(m, emit, (f) => `    ${f.file}: ${f.reason}`);
}

function runAll(): void {
  process.stdout.write("== Story docs (plan 43-03) ==\n");
  runGrugCheck();
  runGapD1Check();
  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
  } else {
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
  }
}

if (isEntrypoint(import.meta.url)) {
  runAll();
}

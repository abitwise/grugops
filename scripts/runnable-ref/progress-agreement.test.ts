// progress-agreement.test.ts — one answer to "which progress headings are dated entries" (phase 37, plan 37-23,
// D-17, WR-02, the AUTH-1 rule of 37-GAP-PLANNING-BRIEF.md).
//
// The question has one owner: scripts/state-rules.ts progressEntries, which asks the one section-extent owner
// (scripts/frontmatter.ts sectionEndIndex, D-16) which lines are `##` section headings. state-check reports
// ROLLABLE from that answer, and state-roll's planner moves entries by it. For every row of PROGRESS_CORPUS this
// table asks all three and requires one boolean:
//
//   - the unit answer: progressEntries(the comment-blanked, normalized view, sectionEndIndex).dated is not empty,
//     computed with the committed state-rules.js, frontmatter.js and board-model.js;
//   - state-check.js prints a `ROLLABLE  progress` line;
//   - state-roll.js --dry-run prints a progress PLAN line.
//
// And whenever state-check says ROLLABLE, state-roll --dry-run exits 0: the daily sweep (Workflow 09) is never
// sent to run a roll that the roll then refuses (T-37-51). Each runnable is the COMMITTED .js copied ALONE into an
// empty temporary directory (the host emulation), and every repository is an mkdtempSync directory built from the
// state-layout constants. --dry-run writes nothing.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  BOARD_REL,
  BUDGETS,
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  NFR_CATALOG_REL,
  NFR_DIR_REL,
  PROGRESS_REL,
  TICKETS_REL,
  TRACE_DIR_REL,
  TRACEABILITY_REL,
} from "../../install/state-layout.js";
import { normalizeDocument, stripHtmlComments } from "../board-model.js";
import { sectionEndIndex } from "../frontmatter.js";
import { progressEntries } from "../state-rules.js";
import { renderTraceIndex } from "../trace-model.js";

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/** The committed runnable `name`, copied alone into an empty directory. */
function hostCopy(name: string): string {
  const host = mkTmp(`grugops-progress-agreement-${name}-`);
  const js = join(host, name);
  copyFileSync(join(import.meta.dirname, name), js);
  return js;
}

const CHECK_JS = hostCopy("state-check.js");
const ROLL_JS = hostCopy("state-roll.js");

function run(js: string, ...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [js, ...args], { encoding: "utf8", cwd: dirname(js) });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Write `text` at `rel` in `root`, creating its directory. */
function plant(root: string, rel: string, text: string): void {
  const p = join(root, ...rel.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

/** A board that keeps every budget, with an empty Done column: no Done roll is due. */
const CLEAN_BOARD = "# Board\n\n## Ready (WIP unlimited)\n\n- [ABC-001] a ready ticket\n\n## Done (WIP unlimited)\n";

/**
 * A repository that keeps every budget but the progress file's, with the D-14 marker: a board, both index files,
 * a keeper in the ticket, NFR and trace directories, one small ticket, and `progress` at PROGRESS_REL.
 */
function repoWith(progress: string): string {
  const root = mkTmp("grugops-progress-agreement-repo-");
  plant(root, BOARD_REL, CLEAN_BOARD);
  plant(root, TRACEABILITY_REL, renderTraceIndex([]));
  plant(root, NFR_CATALOG_REL, "# NFR catalog\n");
  for (const dir of [TICKETS_REL, NFR_DIR_REL, TRACE_DIR_REL]) plant(root, `${dir}/.gitkeep`, "");
  plant(root, `${TICKETS_REL}/ABC-001.md`, "# ABC-001\n");
  plant(root, LAYOUT_MARKER_REL, LAYOUT_MARKER_CONTENT);
  plant(root, PROGRESS_REL, progress);
  return root;
}

/** One line long enough to put any row over BUDGETS.progressBytes. */
const FILL = "x".repeat(BUDGETS.progressBytes + 100);
const BT = "`".repeat(3);
const TILDE = "~".repeat(3);

type Row = { readonly name: string; readonly text: string; readonly dated: boolean };

/**
 * The progress corpus (plan 37-23, the spec-less probe record's edges). `dated` is the hand-authored answer, so
 * the table cannot pass by the three answers agreeing on a wrong one.
 */
const PROGRESS_CORPUS: readonly Row[] = [
  {
    name: "a backtick-fenced dated heading only, beside a standing section",
    text: `# Progress\n\n${BT}markdown\n## 2020-01-01 example entry\n${BT}\n\n## Standing directive\n${FILL}\n`,
    dated: false,
  },
  {
    name: "a tilde-fenced dated heading only, beside a standing section",
    text: `# Progress\n\n${TILDE}\n## 2020-01-01 example entry\n${TILDE}\n\n## Standing directive\n${FILL}\n`,
    dated: false,
  },
  {
    name: "a fenced dated heading inside a real dated entry above it",
    text: `# Progress\n\n## 2026-10-01 real entry\ndid things\n\n${BT}\n## 2020-01-01 example entry\n${BT}\n\n## Standing directive\n${FILL}\n`,
    dated: true,
  },
  {
    name: "a fenced dated heading in a standing section, with a real dated entry below it",
    text: `# Progress\n\n## Standing directive\nkeep reading\n\n${BT}\n## 2020-01-01 example entry\n${BT}\n\n## 2026-10-01 real entry\n${FILL}\n`,
    dated: true,
  },
  {
    name: "a dated heading only inside an HTML comment",
    text: `# Progress\n\n<!--\n## 2026-10-01 commented out\n-->\n\n## Standing directive\n${FILL}\n`,
    dated: false,
  },
  {
    name: "a real dated entry with a `### 2020-01-01` subheading",
    text: `# Progress\n\n## 2026-10-01 real entry\n### 2020-01-01 detail\nmore\n\n## Standing directive\n${FILL}\n`,
    dated: true,
  },
  {
    name: "`## 2026-13-01` only: not a calendar date",
    text: `# Progress\n\n## 2026-13-01 not a date\nx\n\n## Standing directive\n${FILL}\n`,
    dated: false,
  },
  {
    name: "a bare `##` between two dated entries",
    text: `# Progress\n\n## 2026-10-01 first\nx\n##\ny\n\n## 2026-10-02 second\n${FILL}\n`,
    dated: true,
  },
  {
    name: "CRLF line ends with a fenced dated heading only",
    text: `# Progress\n\n${BT}\n## 2020-01-01 example entry\n${BT}\n\n## Standing directive\n${FILL}\n`.replace(/\n/g, "\r\n"),
    dated: false,
  },
  {
    name: "an unterminated fence at the end holding a dated heading, inside a real dated entry",
    text: `# Progress\n\n## Standing directive\n${FILL}\n\n## 2026-10-01 real entry\ndid things\n\n${BT}\n## 2020-01-01 in an unterminated fence\nnever closed\n`,
    dated: true,
  },
];

/** The corpus size, asserted: a row that silently drops out of the table is a failure, not a pass. */
const CORPUS_ROWS = 10;

/** The unit answer: the dated headings the one classifier finds in the view state-check and state-roll read. */
function unitDated(text: string): string[] {
  return progressEntries(stripHtmlComments(normalizeDocument(text)), sectionEndIndex).dated.map((d) => d.heading);
}

/** The headings of the progress PLAN lines a --dry-run printed. */
function plannedHeadings(stdout: string): string[] {
  return stdout
    .split("\n")
    .map((l) => /^PLAN {4}progress {2}`## (.*)` {2}lines? /.exec(l)?.[1])
    .filter((h): h is string => h !== undefined);
}

let rowsRun = 0;

describe("progress agreement: the classifier, state-check's ROLLABLE and state-roll's plan give one answer (plan 37-23, WR-02, AUTH-1)", () => {
  it.each(PROGRESS_CORPUS.map((r) => [r.name, r] as const))("%s", (_name, row) => {
    expect(Buffer.byteLength(row.text, "utf8"), "PREMISE: the row is over BUDGETS.progressBytes").toBeGreaterThan(
      BUDGETS.progressBytes,
    );
    const dated = unitDated(row.text);
    const unit = dated.length > 0;

    const root = repoWith(row.text);
    const check = run(CHECK_JS, root);
    // The marker is on and the progress file is the only file over its budget: one finding, exit 1, never 2.
    expect(check.status, check.stdout + check.stderr).toBe(1);
    const rollable = check.stdout.split("\n").some((l) => l.startsWith("ROLLABLE  progress"));

    const roll = run(ROLL_JS, root, "--dry-run");
    const planned = plannedHeadings(roll.stdout);
    const plans = planned.length > 0;

    expect({ unit, rollable, plans }, `state-check:\n${check.stdout}\nstate-roll:\n${roll.stdout}${roll.stderr}`).toEqual({
      unit: row.dated,
      rollable: row.dated,
      plans: row.dated,
    });
    // ROLLABLE is never followed by a refusal: state-roll exits 0 on a file state-check called ROLLABLE. No row
    // of this corpus is refused either way.
    expect(roll.status, roll.stdout + roll.stderr).toBe(0);
    if (!plans) expect(roll.stdout).toContain(`Nothing can roll: ${PROGRESS_REL}`);
    // Every entry state-roll plans to move is one the classifier dated: no fenced heading moves as an entry.
    for (const h of planned) expect(dated).toContain(h);
    rowsRun += 1;
  });

  it(`the table ran all ${CORPUS_ROWS} rows`, () => {
    expect(PROGRESS_CORPUS).toHaveLength(CORPUS_ROWS);
    expect(rowsRun).toBe(CORPUS_ROWS);
  });
});

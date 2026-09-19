// check-flip-manifest.test.ts — every refusal the GAP-D1 flip gate can issue, reproduced on a
// PLANTED repository under the OS temp dir, each with its passing converse (plan 33-07, task 3).
//
// Repo law (MEMORY: "green suite insufficient"): a green suite over a gate proves nothing unless
// each refusal has been SEEN to fire. So every behavioural case here drives the COMMITTED .js via
// spawnSync against a real git repository built under the OS temp dir — never the .ts, and never
// the real working tree. Nothing is ever written into the committed tree. The harness is modelled on
// scripts/check-diff-disposition.test.ts, which recorded the same two reproductions-as-permanent-cases
// argument for the same reason: the predicate reads a diff, and today's real diff is empty.
//
// THE TWO MANDATORY REPRODUCTIONS, WRITTEN RED FIRST (the red run is quoted in 33-07-SUMMARY.md):
//   1. a tree in the discharged state where a `pending human` cell survives INSIDE the derived
//      live-surface set, in a file the manifest does not declare;
//   2. a tree in the discharged state where a flipped parity cell carries NO citation.
// Each has its converse in the same file: the same cell surviving OUTSIDE the live-surface set
// passes, and a cell carrying a well-formed citation to an existing summary section passes. The
// pair is what proves the gate discriminates rather than refuses everything.

import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import {
  FLIP_MANIFEST_DEFAULT,
  LIVE_SURFACE_PART_NAMES,
  splitTableRow,
  unwrapCell,
  parseTables,
  parseManifest,
  parseCitation,
  declaredSet,
} from "./check-flip-manifest.js";

const REPO = join(import.meta.dirname, "..");
const GATE_JS = join(REPO, "scripts", "check-flip-manifest.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// A git environment with no dependence on the developer's own config, so the harness cannot fail on
// a box where committing needs a name.
const GIT_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "grugops harness",
  GIT_AUTHOR_EMAIL: "harness@example.invalid",
  GIT_COMMITTER_NAME: "grugops harness",
  GIT_COMMITTER_EMAIL: "harness@example.invalid",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

// MEASURED HARNESS HAZARD, NAMED RATHER THAN LEFT AS A FLAKE. On this host (darwin, git 2.55.0)
// two of the first four full runs saw `git add -A` in a FRESH temp repository die with `error: <path>: failed
// to insert into database / fatal: updating files failed` — a transient loose-object write failure
// that never reproduced in a 60-repository stress loop and that no gate under test can cause,
// because the gate is spawned only after the commit lands. The harness retries THAT ONE message a
// bounded number of times and still throws on anything else, so a real harness defect stays loud.
const TRANSIENT_OBJECT_WRITE = "failed to insert into database";
const GIT_RETRIES = 3;

function gitIn(cwd: string, args: string[]): string {
  let last: ReturnType<typeof spawnSync> | null = null;
  for (let attempt = 0; attempt < GIT_RETRIES; attempt += 1) {
    const r = spawnSync("git", args, { cwd, encoding: "utf8", env: GIT_ENV });
    if (r.status === 0) return (r.stdout as string | null) ?? "";
    last = r;
    if (!String(r.stderr ?? "").includes(TRANSIENT_OBJECT_WRITE)) break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50 * (attempt + 1));
  }
  throw new Error(
    `harness: \`git ${args.join(" ")}\` failed in ${cwd} (status ${last?.status})\n${last?.stdout ?? ""}${last?.stderr ?? ""}`,
  );
}

function write(root: string, rel: string, content: string): void {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

function runGate(
  checkRoot: string,
  args: readonly string[] = [],
): { status: number; stdout: string } {
  const r = spawnSync(process.execPath, [GATE_JS, ...args], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The planted corpus. Small, and shaped so every live-surface part derives at least one member.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const MANIFEST_REL = FLIP_MANIFEST_DEFAULT;
const SUMMARY_NAME = "33-CAPTURE-SUMMARY.md";
const SUMMARY_REL = join(dirname(MANIFEST_REL), SUMMARY_NAME).split("\\").join("/");
const PARITY_REL = "examples/03-ticket-to-pr.md";
const RUNBOOK_REL = "docs/runbook.md";
const STATE_REL = ".planning/STATE.md";
const MILESTONES_REL = ".planning/MILESTONES.md";
const RECORD_REL = ".planning/milestones/v1.0-phases/06-x/06-VERIFICATION.md";
const EVIDENCE_REL = ".planning/phases/27-x/27-SPAWN-03-RUNTIME-EVIDENCE.md";
const HISTORY_REL = ".planning/phases/27-x/27-05-PLAN.md";
const LEDGER_REL = ".planning/WINDOWS.md";

const CELL = "pending human";
const HISTORY_LINE = "- [Phase 06]: [06-05] the dogfood left one cell at pending human, deferred";
const CAPTURE_DATE = "2026-09-30";
const SECTION = "CAP-03 verdict (D-02) — run A";
const CITED = (value: string, section: string = SECTION, date: string = CAPTURE_DATE): string =>
  `\`${value}\` (captured ${date}, \`${SUMMARY_NAME}\` § ${section})`;

const PARITY_TABLE_PRE = [
  "| Parity dimension | Sequential path | CC-native path |",
  "|---|---|---|",
  `| Same ticket | \`ABC-001\` (driven here) | \`${CELL}\` (runbook step 3) |`,
  `| Gate verdict | \`READY_FOR_HUMAN_REVIEW\` | \`${CELL}\` (runbook step 3) |`,
].join("\n");

const PARITY_TABLE_POST = (rightCells: readonly [string, string], leftCells?: readonly [string, string]): string =>
  [
    "| Parity dimension | Sequential path | CC-native path |",
    "|---|---|---|",
    `| Same ticket | ${leftCells?.[0] ?? CITED("ABC-001")} | ${rightCells[0]} |`,
    `| Gate verdict | ${leftCells?.[1] ?? CITED("READY_FOR_HUMAN_REVIEW")} | ${rightCells[1]} |`,
  ].join("\n");

const PARITY_DOC = (table: string, intro: string): string =>
  ["# Example 03", "", intro, "", table, "", "Closing prose.", ""].join("\n");
const INTRO_PRE = `until then its cells read **${CELL}** (never simulated).`;
const INTRO_POST = `Both columns were captured on ${CAPTURE_DATE}; see the summary.`;

const LEDGER = (status: string): string =>
  [
    "---",
    "schema_version: 1",
    "---",
    "",
    "# Broken Windows Ledger",
    "",
    "| id | status |",
    "|----|--------|",
    `| 1 | ${status} |`,
    "",
    "````json",
    JSON.stringify([{ id: 1, kind: "unrun-verify", status, description: "slots empty" }], null, 2),
    "````",
    "",
  ].join("\n");

const STATE_PRE = [
  "# State",
  "",
  "## Decisions",
  "",
  HISTORY_LINE,
  "",
  "## Open",
  "",
  "**GAP-D1 — standing deferral:** the flip waits on one captured run.",
  "",
].join("\n");
const STATE_POST = STATE_PRE.replace(
  "**GAP-D1 — standing deferral:** the flip waits on one captured run.",
  `GAP-D1 discharged ${CAPTURE_DATE} (\`${SUMMARY_NAME}\`).`,
);

const RECORD_PRE = ["---", "status: human_needed", "---", "", "The table has 9 cells still open.", ""].join("\n");
const RECORD_POST = ["---", "status: passed", "---", "", "The table has seven cells, filled by the capture.", ""].join("\n");

const EVIDENCE_PRE = ["---", "status: performed", "---", "", "## Slots", "", "- **observed by:** a human", ""].join("\n");
const EVIDENCE_POST = `${EVIDENCE_PRE}\n## Headless capture\n\nPasted from \`${SUMMARY_NAME}\` § ${SECTION}.\n`;

const SUMMARY_DOC = ["# Capture summary", "", "## Run", "", "one run", "", `## ${SECTION}`, "", "pass", "", "## Completion", "", "Outcome: pass", ""].join("\n");

interface ManifestSpec {
  status: "pre-capture" | "discharged";
  /** Listed members per part; defaults to the planted corpus's derivation. */
  members?: Partial<Record<(typeof LIVE_SURFACE_PART_NAMES)[number], string[]>>;
  counts?: Partial<Record<(typeof LIVE_SURFACE_PART_NAMES)[number], number>>;
  pin?: number;
  parityRows?: number;
  extraFlipRows?: string[];
  omitFlipRowIds?: string[];
}

const DEFAULT_MEMBERS: Record<(typeof LIVE_SURFACE_PART_NAMES)[number], string[]> = {
  publicDocs: ["README.md", "agent-factory/README.md", "docs/GUARANTEES.md", PARITY_REL],
  docsTree: ["docs/GUARANTEES.md", RUNBOOK_REL],
  planningLedgers: [STATE_REL, LEDGER_REL],
  archivedRecords: [RECORD_REL],
  runtimeEvidence: [EVIDENCE_REL],
};
const DEFAULT_PIN = 9;

/** Render a manifest in exactly the table grammar the gate reads. */
function renderManifest(spec: ManifestSpec): string {
  const members = { ...DEFAULT_MEMBERS, ...(spec.members ?? {}) };
  const counts = Object.fromEntries(
    LIVE_SURFACE_PART_NAMES.map((n) => [n, spec.counts?.[n] ?? members[n].length]),
  ) as Record<(typeof LIVE_SURFACE_PART_NAMES)[number], number>;
  const flipRows = [
    `| F1 | \`${MANIFEST_REL}\` | \`status\` | \`**Manifest status:**\` | \`pre-capture\` | the second value |`,
    `| F2 | \`${PARITY_REL}\` | \`anchor\` | \`until then its cells read **${CELL}**\` | intro | past tense |`,
    `| F3 | \`${PARITY_REL}\` | \`parity-row\` | \`row 1 "Same ticket"\` | right cell pending | cited |`,
    `| F4 | \`${PARITY_REL}\` | \`parity-row\` | \`row 2 "Gate verdict"\` | right cell pending | cited |`,
    `| F5 | \`${RECORD_REL}\` | \`anchor\` | \`status: human_needed\` | frontmatter | \`status: passed\` |`,
    `| F6 | \`${EVIDENCE_REL}\` | \`marker\` | \`${SUMMARY_NAME}\` | absent | a pasted block |`,
    `| F7 | \`${LEDGER_REL}\` | \`ledger-row\` | \`id 1\` | \`open\` | \`fixed\` via the tool |`,
    `| F8 | \`${STATE_REL}\` | \`anchor\` | \`**GAP-D1 — standing deferral\` | standing deferral | discharged |`,
    ...(spec.extraFlipRows ?? []),
  ].filter((r) => !(spec.omitFlipRowIds ?? []).some((id) => r.startsWith(`| ${id} |`)));
  return [
    "# Planted flip manifest",
    "",
    `**Manifest status:** \`${spec.status}\``,
    "",
    "| Setting | Value |",
    "|---|---|",
    `| capture summary | \`${SUMMARY_NAME}\` |`,
    `| parity table file | \`${PARITY_REL}\` |`,
    "| parity table header cell | `Parity dimension` |",
    `| parity data rows | \`${spec.parityRows ?? 2}\` |`,
    `| pinned live-surface total | \`${spec.pin ?? DEFAULT_PIN}\` |`,
    `| residual token | \`${CELL}\` |`,
    "",
    "| Part | Derivation rule | Declared count |",
    "|---|---|---|",
    ...LIVE_SURFACE_PART_NAMES.map((n) => `| \`${n}\` | planted | ${counts[n]} |`),
    "",
    "| Excluded ledger | Reason |",
    "|---|---|",
    `| \`${MILESTONES_REL}\` | the milestone log is a record |`,
    "",
    "| Deferral marker | Measured lines |",
    "|---|---|",
    "| `standing deferral` | planted |",
    "",
    "| Exempt file | Anchor | Reason |",
    "|---|---|---|",
    `| \`${STATE_REL}\` | \`- [Phase 06]: [06-05] the dogfood\` | a dated decision-log entry |`,
    "",
    "| Part | Member |",
    "|---|---|",
    ...LIVE_SURFACE_PART_NAMES.flatMap((n) => members[n].map((m) => `| \`${n}\` | \`${m}\` |`)),
    "",
    "| # | File | Kind | Locator | Current value | Post-flip shape |",
    "|---|---|---|---|---|---|",
    ...flipRows,
    "",
    "| # | File | Line | Stale fragment | Measured true count | Corrected wording |",
    "|---|---|---|---|---|---|",
    `| C1 | \`${RECORD_REL}\` | 5 | \`has 9 cells\` | 7 | "has seven cells" |`,
    "",
  ].join("\n");
}

/** The corpus every planted tree starts from: the pre-capture state, every part non-empty. */
function writeCorpus(root: string): void {
  write(root, "README.md", "# Planted\n\nA root document.\n");
  write(root, "agent-factory/README.md", "# Kit\n");
  write(root, "docs/GUARANTEES.md", "# Guarantees\n");
  write(root, RUNBOOK_REL, "# Runbook\n\nA human fallback description.\n");
  write(root, PARITY_REL, PARITY_DOC(PARITY_TABLE_PRE, INTRO_PRE));
  write(root, STATE_REL, STATE_PRE);
  write(root, MILESTONES_REL, `# Milestones\n\nCarried: GAP-D1 — standing deferral of the flip.\n`);
  write(root, RECORD_REL, RECORD_PRE);
  write(root, EVIDENCE_REL, EVIDENCE_PRE);
  write(root, HISTORY_REL, `# Plan 27-05\n\nThe cell read ${CELL} at the time.\n`);
  write(root, LEDGER_REL, LEDGER("open"));
  write(root, MANIFEST_REL, renderManifest({ status: "pre-capture" }));
}

interface PlantOptions {
  /** Corpus files removed before the base commit (to empty a part, or to lose the manifest). */
  remove?: string[];
  /** The manifest rendered into the base commit; defaults to the pre-capture manifest. */
  manifest?: ManifestSpec;
  /** Skip `git init`, so every git invocation fails. */
  noGit?: boolean;
}

/** A planted repository in the pre-capture state, committed once. */
function plantPreCapture(
  prefix: string,
  extra: Record<string, string> = {},
  opts: PlantOptions = {},
): string {
  const root = freshTmp(prefix);
  writeCorpus(root);
  for (const [rel, content] of Object.entries(extra)) write(root, rel, content);
  if (opts.manifest !== undefined) write(root, MANIFEST_REL, renderManifest(opts.manifest));
  for (const rel of opts.remove ?? []) rmSync(join(root, rel), { force: true });
  if (opts.noGit) return root;
  gitIn(root, ["init", "-q"]);
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "base"]);
  return root;
}

interface FlipSpec {
  /** Files written in the flip commit. Defaults to the complete, correct flip. */
  files?: Record<string, string>;
  /** Files written in a SEPARATE commit before the flip (the capture summary lands this way). */
  before?: Record<string, string>;
  manifest?: ManifestSpec;
}

/** The complete, correct flip commit: every declared file changed, every cell cited. */
function correctFlipFiles(): Record<string, string> {
  return {
    [PARITY_REL]: PARITY_DOC(
      PARITY_TABLE_POST([CITED("ABC-001"), CITED("READY_FOR_HUMAN_REVIEW")]),
      INTRO_POST,
    ),
    [STATE_REL]: STATE_POST,
    [RECORD_REL]: RECORD_POST,
    [EVIDENCE_REL]: EVIDENCE_POST,
    [LEDGER_REL]: LEDGER("fixed"),
  };
}

/** Plant, commit the base, land the summary in its own commit, then commit the flip. */
function plantDischarged(prefix: string, spec: FlipSpec = {}, extraBase: Record<string, string> = {}): string {
  const root = plantPreCapture(prefix, extraBase);
  const before = { [SUMMARY_REL]: SUMMARY_DOC, ...(spec.before ?? {}) };
  for (const [rel, content] of Object.entries(before)) write(root, rel, content);
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "capture summary"]);
  const files = spec.files ?? correctFlipFiles();
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  write(root, MANIFEST_REL, renderManifest({ status: "discharged", ...(spec.manifest ?? {}) }));
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "flip"]);
  return root;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The control: the planted pre-capture tree is a tree the gate accepts.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — the planted pre-capture tree (control)", () => {
  it("exits 0, names the status it read, and prints every part with the derived total beside the pin", () => {
    const root = plantPreCapture("flip-pre-");
    const r = runGate(root);
    expect(r.stdout).toContain("status: pre-capture");
    expect(r.stdout).toContain(
      "live-surface parts: publicDocs 4, docsTree 2, planningLedgers 2, archivedRecords 1, runtimeEvidence 1; overlap 1; derived total 9, pinned 9",
    );
    expect(r.stdout).toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// REPRODUCTION 1 — the residual rule: a cell surviving INSIDE the live-surface set, discharged.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — the residual rule (D-17)", () => {
  it("RED 1: a `pending human` cell surviving inside the derived live-surface set, in an undeclared file, exits 1 and names file and line", () => {
    // docs/runbook.md is a docsTree member the manifest does NOT declare. The planted runbook carries
    // the cell in its base commit, so the flip commit still changes exactly the declared set.
    const root = plantDischarged("flip-residual-in-", {}, {
      [RUNBOOK_REL]: `# Runbook\n\nFallback.\n\nThe cell still reads \`${CELL}\` here.\n`,
    });
    const r = runGate(root);
    expect(r.stdout).toContain(`${RUNBOOK_REL}:5`);
    expect(r.stdout).toContain("CHECK(S) FAILED");
    expect(r.status).toBe(1);
  });

  it("CONVERSE 1: the same cell surviving OUTSIDE the live-surface set (a plan record, an excluded ledger) passes", () => {
    // HISTORY_REL (a plan under .planning/phases/) and MILESTONES_REL (an excluded ledger) both carry
    // a token in the base corpus already; the correct flip leaves them untouched.
    const root = plantDischarged("flip-residual-out-");
    expect(readFileSync(join(root, HISTORY_REL), "utf8")).toContain(CELL);
    expect(readFileSync(join(root, MILESTONES_REL), "utf8")).toContain("standing deferral");
    const r = runGate(root);
    expect(r.stdout).toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });

  it("the same surviving cell does NOT fail the gate in the pre-capture state — before the flip those cells are correct", () => {
    const root = plantPreCapture("flip-residual-pre-", {
      [RUNBOOK_REL]: `# Runbook\n\nThe cell still reads \`${CELL}\` here.\n`,
    });
    const r = runGate(root);
    expect(r.stdout).toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// REPRODUCTION 2 — the citation rule (D-18): a flipped cell with no citation.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — the citation rule (D-18)", () => {
  it("RED 2: a flipped parity cell with no parenthetical exits 1 and names the cell", () => {
    const root = plantDischarged("flip-uncited-", {
      files: {
        ...correctFlipFiles(),
        [PARITY_REL]: PARITY_DOC(
          PARITY_TABLE_POST([CITED("ABC-001"), "`READY_FOR_HUMAN_REVIEW`"]),
          INTRO_POST,
        ),
      },
    });
    const r = runGate(root);
    expect(r.stdout).toContain("row 2");
    expect(r.stdout).toContain("READY_FOR_HUMAN_REVIEW");
    expect(r.stdout).toContain("CHECK(S) FAILED");
    expect(r.status).toBe(1);
  });

  it("CONVERSE 2: every cell carrying a well-formed citation to an existing summary section passes", () => {
    const root = plantDischarged("flip-cited-");
    const r = runGate(root);
    expect(r.stdout).toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The rest of the citation rule: a missing date, a missing section reference, a section the
// summary does not carry — each named, each with the well-formed converse above.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — the citation rule, piece by piece", () => {
  const flipWithRightCells = (cells: readonly [string, string]): Record<string, string> => ({
    ...correctFlipFiles(),
    [PARITY_REL]: PARITY_DOC(PARITY_TABLE_POST(cells), INTRO_POST),
  });

  it("a parenthetical without an ISO date is refused by name", () => {
    const root = plantDischarged("flip-nodate-", {
      files: flipWithRightCells([CITED("ABC-001"), `\`READY_FOR_HUMAN_REVIEW\` (captured, \`${SUMMARY_NAME}\` § ${SECTION})`]),
    });
    const r = runGate(root);
    expect(r.stdout).toContain("does not open with `captured` and an ISO date");
    expect(r.stdout).toContain("row 2");
    expect(r.status).toBe(1);
  });

  it("a parenthetical that names no summary section is refused by name", () => {
    const root = plantDischarged("flip-nosection-", {
      files: flipWithRightCells([CITED("ABC-001"), `\`READY_FOR_HUMAN_REVIEW\` (captured ${CAPTURE_DATE})`]),
    });
    const r = runGate(root);
    expect(r.stdout).toContain("names no summary section");
    expect(r.status).toBe(1);
  });

  it("a citation naming a section the capture summary does not carry is refused, naming the section", () => {
    const root = plantDischarged("flip-missing-section-", {
      files: flipWithRightCells([CITED("ABC-001"), CITED("READY_FOR_HUMAN_REVIEW", "Verdict that is not there")]),
    });
    const r = runGate(root);
    expect(r.stdout).toContain('cites section "Verdict that is not there", which does not exist as a heading');
    expect(r.status).toBe(1);
  });

  it("a heading quoted inside a fenced block of the summary does not count as a section", () => {
    const fencedSummary = ["# Capture summary", "", "```", "## Fenced heading", "```", "", `## ${SECTION}`, ""].join("\n");
    const root = plantDischarged("flip-fenced-section-", {
      before: { [SUMMARY_REL]: fencedSummary },
      files: flipWithRightCells([CITED("ABC-001"), CITED("READY_FOR_HUMAN_REVIEW", "Fenced heading")]),
    });
    const r = runGate(root);
    expect(r.stdout).toContain('cites section "Fenced heading", which does not exist');
    expect(r.status).toBe(1);
  });

  it("the discharged state with NO capture summary on disk reports no verdict rather than a clean one", () => {
    const root = plantDischarged("flip-nosummary-");
    rmSync(join(root, SUMMARY_REL));
    const r = runGate(root);
    expect(r.stdout).toContain("the capture summary");
    expect(r.stdout).toContain("NO verdict is reported");
    expect(r.status).toBe(1);
  });

  it("parseCitation reads the form exactly and names what a malformed cell lacks", () => {
    expect(parseCitation(CITED("x", "S"))).toEqual({
      citation: { value: "x", date: CAPTURE_DATE, summary: SUMMARY_NAME, section: "S" },
    });
    expect(parseCitation("`x`")).toEqual({ refused: expect.stringContaining("no parenthetical") });
    expect(parseCitation("`x` (captured 2026-09-30)")).toEqual({ refused: expect.stringContaining("no summary section") });
    expect(parseCitation(`\`x\` (captured 2026-09-30, \`${SUMMARY_NAME}\` § S) trailing`)).toEqual({
      refused: expect.stringContaining("does not match the citation form exactly"),
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The deferral-sentence half of the residual rule (T2), and the anchored history exemption.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — GAP-D1 deferral sentences and the history exemption", () => {
  it("a GAP-D1 line carrying a declared deferral marker survives the flip: refused by file and line", () => {
    const stateStillDeferring = STATE_PRE.replace(
      "**GAP-D1 — standing deferral:** the flip waits on one captured run.",
      "GAP-D1 remains a standing deferral after all.",
    );
    const root = plantDischarged("flip-t2-", { files: { ...correctFlipFiles(), [STATE_REL]: stateStillDeferring } });
    const r = runGate(root);
    expect(r.stdout).toContain(`${STATE_REL}:9 still carries a GAP-D1 deferral sentence`);
    expect(r.status).toBe(1);
  });

  it("CONVERSE: a GAP-D1 line WITHOUT a deferral marker (the discharge note) passes, and so does the exempt history line", () => {
    const root = plantDischarged("flip-t2-converse-");
    const state = readFileSync(join(root, STATE_REL), "utf8");
    expect(state).toContain("GAP-D1 discharged");
    expect(state).toContain(HISTORY_LINE);
    const r = runGate(root);
    expect(r.stdout).toContain("1 anchored history line(s) exempt");
    expect(r.stdout).toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });

  it("a history exemption whose anchor no longer resolves is a derivation defect, not a pass", () => {
    const root = plantDischarged("flip-stale-exemption-", {
      files: { ...correctFlipFiles(), [STATE_REL]: STATE_POST.replace(HISTORY_LINE, "- [Phase 06]: rewritten") },
    });
    const r = runGate(root);
    expect(r.stdout).toContain("exemption anchored at");
    expect(r.stdout).toContain("a stale exemption is a derivation defect");
    expect(r.status).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The commit-set rule: nothing undeclared rides along, nothing declared is omitted.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — the commit-set rule (D-17)", () => {
  it("a flip commit that changes a file the manifest does not declare is refused, naming the file", () => {
    const root = plantDischarged("flip-undeclared-", {
      files: { ...correctFlipFiles(), "README.md": "# Planted\n\nRode along.\n" },
    });
    const r = runGate(root);
    expect(r.stdout).toContain("changed 1 file(s) the manifest does not declare: README.md");
    expect(r.status).toBe(1);
  });

  it("a flip commit that omits a declared file is refused, naming the file", () => {
    const files = correctFlipFiles();
    delete files[LEDGER_REL];
    const root = plantDischarged("flip-omitted-", { files });
    const r = runGate(root);
    expect(r.stdout).toContain(`omitted 1 declared file(s): ${LEDGER_REL}`);
    // The ledger row is also still open, which is the other half of the same omission.
    expect(r.stdout).toContain('ledger row 1 is still "open" after the flip');
    expect(r.status).toBe(1);
  });

  it("the flip commit is DERIVED from history — a later commit on top does not move the comparison", () => {
    const root = plantDischarged("flip-later-commit-");
    write(root, RUNBOOK_REL, "# Runbook\n\nEdited after the flip, with no token.\n");
    gitIn(root, ["add", "-A"]);
    gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "later"]);
    const r = runGate(root);
    expect(r.stdout).toContain("flip commit derived from git");
    expect(r.stdout).toContain("changed exactly the declared set (6 files)");
    expect(r.status).toBe(0);
  });

  it("an explicit --range is judged even in the pre-capture state — the operator asked", () => {
    const root = plantPreCapture("flip-range-");
    const r = runGate(root, ["--range", "HEAD"]);
    expect(r.stdout).toContain("the manifest does not declare");
    expect(r.status).toBe(1);
  });

  it("CONVERSE: an explicit --range over exactly the declared set passes in the discharged state", () => {
    const root = plantDischarged("flip-range-ok-");
    const r = runGate(root, ["--range", "HEAD"]);
    expect(r.stdout).toContain("changed exactly the declared set");
    expect(r.status).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The live-surface set: the per-part vacuity floor and the pinned total.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — the floored, pinned live-surface set", () => {
  it("a part deriving ZERO members refuses a verdict and names the part with every part's count", () => {
    const root = plantPreCapture("flip-vacuous-", {}, {
      remove: [EVIDENCE_REL],
      manifest: {
        status: "pre-capture",
        members: { runtimeEvidence: [] },
        pin: DEFAULT_PIN - 1,
        omitFlipRowIds: ["F6"],
      },
    });
    const r = runGate(root);
    expect(r.stdout).toContain('the "runtimeEvidence" part of the live-surface set derived ZERO members');
    expect(r.stdout).toContain("publicDocs 4, docsTree 2, planningLedgers 2, archivedRecords 1, runtimeEvidence 0");
    expect(r.stdout).not.toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(1);
  });

  it("a derived total one below the pin refuses, naming every part's count and the remedy's order", () => {
    const root = plantPreCapture("flip-pin-", {}, { manifest: { status: "pre-capture", pin: DEFAULT_PIN + 1 } });
    const r = runGate(root);
    expect(r.stdout).toContain(`derived ${DEFAULT_PIN} document(s), expected exactly ${DEFAULT_PIN + 1}`);
    expect(r.stdout).toContain("publicDocs 4, docsTree 2, planningLedgers 2, archivedRecords 1, runtimeEvidence 1, overlap 1");
    expect(r.stdout).toContain("moving the pin is how you acknowledge that the set changed, not how you make the failure go away");
    expect(r.status).toBe(1);
  });

  it("a listing that disagrees with the derivation is refused in both directions", () => {
    const root = plantPreCapture("flip-listing-", {}, {
      manifest: { status: "pre-capture", members: { docsTree: ["docs/GUARANTEES.md", "docs/not-there.md"] } },
    });
    const r = runGate(root);
    expect(r.stdout).toContain(`derived but not listed: [${RUNBOOK_REL}]; listed but not derived: [docs/not-there.md]`);
    expect(r.status).toBe(1);
  });

  it("every part the gate derives must be declared: the gate and the manifest name the same parts", () => {
    expect([...LIVE_SURFACE_PART_NAMES].sort()).toEqual(
      ["archivedRecords", "docsTree", "planningLedgers", "publicDocs", "runtimeEvidence"],
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Inputs the gate cannot derive: no verdict, said so, never a clean result.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — an underived input is NO verdict", () => {
  it("a missing manifest exits 1 and says no verdict is reported", () => {
    const root = plantPreCapture("flip-nomanifest-");
    rmSync(join(root, MANIFEST_REL));
    const r = runGate(root);
    expect(r.stdout).toContain("the flip manifest does not exist");
    expect(r.stdout).toContain("NO verdict is reported");
    expect(r.stdout).not.toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(1);
  });

  it("a failed git invocation (no repository) exits 1 and says the actual side cannot be derived", () => {
    const root = plantPreCapture("flip-nogit-", {}, { noGit: true });
    const r = runGate(root);
    expect(r.stdout).toContain("`git ls-files");
    expect(r.stdout).toContain("NO verdict is reported");
    expect(r.stdout).not.toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(1);
  });

  it("a manifest in an undeclared state exits 1 naming the two declared values", () => {
    const root = plantPreCapture("flip-badstatus-");
    write(root, MANIFEST_REL, renderManifest({ status: "pre-capture" }).replace("`pre-capture`", "`flipped`"));
    const r = runGate(root);
    expect(r.stdout).toContain("the only declared values are `pre-capture` and `discharged`");
    expect(r.status).toBe(1);
  });

  it("a manifest missing one of its tables exits 1 naming the table", () => {
    const root = plantPreCapture("flip-notable-");
    write(root, MANIFEST_REL, renderManifest({ status: "pre-capture" }).replace("| Deferral marker | Measured lines |", "| Markers | Lines |"));
    const r = runGate(root);
    expect(r.stdout).toContain('carries 0 "deferral markers" table(s)');
    expect(r.status).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The manifest is checked against the tree it describes — in the pre-capture state too.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — locators must resolve in the declared state", () => {
  it("pre-capture: an anchor that does not occur in its file is refused", () => {
    const root = plantPreCapture("flip-stale-anchor-", {
      [RECORD_REL]: RECORD_PRE.replace("status: human_needed", "status: open"),
    });
    const r = runGate(root);
    expect(r.stdout).toContain('flip row F5: the pre-flip anchor "status: human_needed" does not occur');
    expect(r.status).toBe(1);
  });

  it("pre-capture: a marker already present before any capture is refused", () => {
    const root = plantPreCapture("flip-early-marker-", { [EVIDENCE_REL]: EVIDENCE_POST });
    const r = runGate(root);
    expect(r.stdout).toContain("flip row F6: the post-flip marker");
    expect(r.stdout).toContain("before any capture exists");
    expect(r.status).toBe(1);
  });

  it("pre-capture: a parity row whose label differs from the manifest's is refused", () => {
    const root = plantPreCapture("flip-label-", {
      [PARITY_REL]: PARITY_DOC(PARITY_TABLE_PRE.replace("| Gate verdict |", "| Verdict |"), INTRO_PRE),
    });
    const r = runGate(root);
    expect(r.stdout).toContain('parity data row 2 is labelled "Verdict", the manifest says "Gate verdict"');
    expect(r.status).toBe(1);
  });

  it("the parity table's data-row count must agree with the settings and the enumerated rows", () => {
    const root = plantPreCapture("flip-rowcount-", {
      [PARITY_REL]: PARITY_DOC(`${PARITY_TABLE_PRE}\n| Extra | x | y |`, INTRO_PRE),
    });
    const r = runGate(root);
    expect(r.stdout).toContain("has 3 data row(s); the manifest declares 2 and enumerates 2");
    expect(r.status).toBe(1);
  });

  it("discharged: a correction fragment that survives is refused, naming the row", () => {
    const root = plantDischarged("flip-uncorrected-", {
      files: { ...correctFlipFiles(), [RECORD_REL]: RECORD_POST.replace("has seven cells", "has 9 cells") },
    });
    const r = runGate(root);
    expect(r.stdout).toContain('correction row C1: the stale fragment "has 9 cells" still occurs');
    expect(r.status).toBe(1);
  });

  it("discharged: a marker that was never written is refused", () => {
    const root = plantDischarged("flip-nomarker-", {
      files: { ...correctFlipFiles(), [EVIDENCE_REL]: `${EVIDENCE_PRE}\nEdited without the block.\n` },
    });
    const r = runGate(root);
    expect(r.stdout).toContain("flip row F6: the post-flip marker");
    expect(r.stdout).toContain("the record was not written");
    expect(r.status).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The parsers, imported rather than spawned: the table grammar the manifest is written in.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-flip-manifest — the manifest grammar", () => {
  it("splits a row on unescaped pipes only, and reads `\\|` as a literal pipe", () => {
    expect(splitTableRow("| a | b \\| c | `d` |")).toEqual(["a", "b | c", "`d`"]);
  });

  it("unwraps one backtick pair, or a double-backtick pair with inner spaces, and nothing else", () => {
    expect(unwrapCell("`x`")).toBe("x");
    expect(unwrapCell("`` a `b` c ``")).toBe("a `b` c");
    expect(unwrapCell("`x` (note)")).toBe("`x` (note)");
    expect(unwrapCell("plain")).toBe("plain");
  });

  it("finds every table outside fences and the planted manifest parses to its declared set", () => {
    const text = renderManifest({ status: "pre-capture" });
    expect(parseTables(text).length).toBe(8);
    const m = parseManifest(text);
    expect(m.status).toBe("pre-capture");
    expect(declaredSet(m).sort()).toEqual(
      [MANIFEST_REL, PARITY_REL, RECORD_REL, EVIDENCE_REL, LEDGER_REL, STATE_REL].sort(),
    );
  });
});

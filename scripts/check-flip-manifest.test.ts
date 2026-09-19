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

function gitIn(cwd: string, args: string[]): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: GIT_ENV });
  if (r.status !== 0) {
    throw new Error(
      `harness: \`git ${args.join(" ")}\` failed in ${cwd} (status ${r.status})\n${r.stdout ?? ""}${r.stderr ?? ""}`,
    );
  }
  return r.stdout ?? "";
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

/** A planted repository in the pre-capture state, committed once. */
function plantPreCapture(prefix: string, extra: Record<string, string> = {}): string {
  const root = freshTmp(prefix);
  writeCorpus(root);
  for (const [rel, content] of Object.entries(extra)) write(root, rel, content);
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

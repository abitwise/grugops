// audit-model.test.ts — the hermetic harness for the Phase 28 audit parse authority.
//
// WHAT THIS FILE IS FOR, STATED PLAINLY. scripts/audit-model.ts parses two HAND-AUTHORED markdown
// artifacts that a gate reads to decide whether the build is green. This repository has no prior
// instance of that contract: docs/catalog/README.md is GENERATED, so its gate compares bytes rather
// than parsing intent. A parser over hand-authored input has exactly one safe posture — refuse
// everything it cannot vouch for — and the reason is arithmetic rather than taste: a SKIPPED row is
// a silent truncation, and a truncated set satisfies every completeness equality downstream of it.
//
// So the cases below are overwhelmingly REFUSAL cases, and each was written and watched FAILING
// before the validation that satisfies it existed. A parser test suite that only exercises
// well-formed input measures nothing: returning a partially-parsed result and refusing are
// indistinguishable on good input, and they differ on exactly the input that matters.
//
// TWO PROPERTIES THE INDIVIDUAL ARMS DO NOT BUY, TESTED SEPARATELY:
//
//   * THE UNION. kit-model.ts records the lesson at partitionPluginComponentClaims: after splitting
//     a predicate into arms, test their UNION. A register that violates two rules at once must be
//     refused, and the case asserts WHICH refusal fires — so the arms are ORDERED rather than
//     racing, and the message a human meets is reproducible.
//   * THE DE-DUPLICATION. A value that violates twice is named ONCE. The same defect was closed
//     once already in this repository (plan 27-46, D-53) because a key printed twice reads to a
//     human as two findings.
//
// Fixtures are synthesized into the OS temp dir. The live artifacts are NEVER read by a behavioural
// case and are NEVER written to — the one case that touches the real tree reads
// agent-factory/config/factory.config.json, read-only, to prove SAFETY_FLOORS cannot drift from the
// config it describes.
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane). Run with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/audit-model.test.ts
// Vitest globals:false -> import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readRegister,
  readRegistry,
  isBlank,
  BLANK_MARKERS,
  BLANK_MARKER_COUNT,
  DISPOSITIONS,
  CLAIM_KINDS,
  CLAIM_STATUSES,
  SAFETY_FLOORS,
  RUBRIC_CATEGORIES,
  SAFETY_SURFACE_VALUES,
  REGISTER_PATH,
  REGISTRY_PATH,
  safetyFloorLiveValue,
} from "./audit-model.js";
// The ONE fence authority, imported so this file's expected sets are derived through the SAME
// per-line projection the parser composes — never through a second toggle written here, which would
// make this harness a fourth fence state machine and defeat its own premise.
import {
  FENCE_DELIMITER_LINE,
  fencedLineFlags,
  unfencedMatchIndices,
} from "./frontmatter.js";
// CR-02's consequence is asserted at its POINT OF EFFECT. A parser-only assertion would leave the
// exclusion list — the thing LANG-02 actually consults — untested.
import { safetySurfaceUnion } from "./generate-safety-surface.js";

const REPO_ROOT = join(import.meta.dirname, "..");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Fixture builders. They emit the register/registry SHAPE and take raw row text, so a case can
// plant a malformed row without the builder quietly repairing it — a builder that normalizes its
// input would make every refusal case unreachable.
// ---------------------------------------------------------------------------

const TABLE_A_HEADER = "| file | kind | counted | safety_surface | findings | observation |";
const TABLE_A_SEP = "|---|---|---|---|---|---|";
const TABLE_B_HEADER = "| finding_id | file | category | disposition | target_phase | reason |";
const TABLE_B_SEP = "|---|---|---|---|---|---|";

interface RegisterFixture {
  readonly tableAHeader?: string;
  readonly rowsA: readonly string[];
  readonly tableBHeader?: string;
  readonly rowsB: readonly string[];
  readonly omitTableA?: boolean;
}

function writeRegisterFixture(fx: RegisterFixture): string {
  const dir = freshTmp("grugops-audit-model-");
  mkdirSync(join(dir, "docs", "audit"), { recursive: true });
  const lines: string[] = [
    "# Phase 28 Disposition Register",
    "",
    "## What this register does not prove",
    "",
    "Prose.",
    "",
  ];
  if (fx.omitTableA !== true) {
    lines.push("## Table A — audited files", "");
    lines.push(fx.tableAHeader ?? TABLE_A_HEADER, TABLE_A_SEP, ...fx.rowsA, "");
  }
  lines.push("## Table B — findings", "");
  lines.push(fx.tableBHeader ?? TABLE_B_HEADER, TABLE_B_SEP, ...fx.rowsB, "");
  writeFileSync(join(dir, REGISTER_PATH), lines.join("\n"), "utf8");
  return dir;
}

// A single well-formed Table A row.
function rowA(
  file: string,
  kind = "role",
  counted = "yes",
  safety = "no",
  findings = "0",
  observation = "Read in full; no finding.",
): string {
  return `| ${file} | ${kind} | ${counted} | ${safety} | ${findings} | ${observation} |`;
}

function rowB(
  id: string,
  file: string,
  category = "1",
  disposition = "fixed",
  target = "—",
  reason = "—",
): string {
  return `| ${id} | ${file} | ${category} | ${disposition} | ${target} | ${reason} |`;
}

// The 37-row shape the live register carries: 36 counted + the one uncounted protocol row.
function thirtySevenRows(): string[] {
  const rows: string[] = [];
  for (let i = 1; i <= 17; i++) {
    rows.push(rowA(`agent-factory/roles/r${String(i).padStart(2, "0")}.md`, "role"));
  }
  for (let i = 1; i <= 19; i++) {
    rows.push(rowA(`agent-factory/workflows/w${String(i).padStart(2, "0")}.md`, "workflow"));
  }
  rows.push(
    rowA(
      "agent-factory/roles/_role-switch-protocol.md",
      "protocol",
      "no",
      "no",
      "0",
      "Out-of-set by derivation; still read once.",
    ),
  );
  return rows;
}

function writeRegistryFixture(body: string): string {
  const dir = freshTmp("grugops-audit-registry-");
  mkdirSync(join(dir, "docs", "audit"), { recursive: true });
  writeFileSync(join(dir, REGISTRY_PATH), body, "utf8");
  return dir;
}

const FENCE = "```";

function claimBlock(
  id: string,
  opts: {
    file?: string;
    line?: string;
    kind?: string;
    dependsOn?: string;
    status?: string;
    text?: string;
    omitFence?: boolean;
  } = {},
): string {
  const head = [
    `### ${id}`,
    "",
    `- file: ${opts.file ?? "README.md"}`,
    `- line: ${opts.line ?? "3"}`,
    `- kind: ${opts.kind ?? "architecture"}`,
    `- depends_on: ${opts.dependsOn ?? "—"}`,
    `- status: ${opts.status ?? "true"}`,
    "",
  ];
  if (opts.omitFence === true) return head.join("\n");
  return [...head, FENCE, opts.text ?? "A claim sentence.", FENCE, ""].join("\n");
}

function registryDoc(...blocks: string[]): string {
  return ["# Phase 28 Claim Registry", "", "## Claims", "", ...blocks].join("\n");
}

// ---------------------------------------------------------------------------

describe("audit-model: the closed sets", () => {
  it("pins every closed set two-sided", () => {
    // Two-sided on purpose (the kit-model.test.ts convention): a set that silently SHRANK admits
    // less than its requirement names, and a set that silently GREW is a vocabulary nobody reviewed.
    expect(DISPOSITIONS.length).toBe(3);
    expect(DISPOSITIONS.length).not.toBe(2);
    expect(DISPOSITIONS.length).not.toBe(4);

    expect(CLAIM_KINDS.length).toBe(3);
    expect(CLAIM_KINDS.length).not.toBe(2);
    expect(CLAIM_KINDS.length).not.toBe(4);

    expect(RUBRIC_CATEGORIES.length).toBe(6);
    expect(RUBRIC_CATEGORIES.length).not.toBe(5);
    expect(RUBRIC_CATEGORIES.length).not.toBe(7);

    expect(SAFETY_FLOORS.length).toBe(4);
    expect(SAFETY_FLOORS.length).not.toBe(3);
    expect(SAFETY_FLOORS.length).not.toBe(5);
  });

  it("DISPOSITIONS holds exactly AUDIT-01's three names, nothing invented", () => {
    expect([...DISPOSITIONS]).toEqual(["fixed", "accepted", "deferred"]);
  });

  it("CLAIM_KINDS holds exactly D-13's three kinds", () => {
    expect([...CLAIM_KINDS]).toEqual(["safety", "architecture", "install"]);
  });

  it("CLAIM_STATUSES holds exactly D-17's three statuses", () => {
    expect([...CLAIM_STATUSES]).toEqual(["true", "overstated", "false"]);
  });

  it("RUBRIC_CATEGORY 6 is record-only and names Phase 29 as its only legal target", () => {
    const six = RUBRIC_CATEGORIES[5];
    expect(six.category).toBe(6);
    expect(six.recordOnly).toBe(true);
    expect(six.onlyLegalTargetPhase).toBe("29");
    // The other five are NOT record-only — otherwise the record-only marker would be vacuous.
    for (const c of RUBRIC_CATEGORIES.slice(0, 5)) expect(c.recordOnly).toBe(false);
  });

  it("SAFETY_FLOORS' config-backed entries match the LIVE factory.config.json, read at run time", () => {
    // The floor list must not be able to drift from the config it describes. This case reads the
    // config INDEPENDENTLY of the module and compares — so a transcribed value that goes stale is a
    // red test rather than a stale comment.
    const cfg = JSON.parse(
      readFileSync(join(REPO_ROOT, "agent-factory/config/factory.config.json"), "utf8"),
    ) as Record<string, unknown>;

    const backed = SAFETY_FLOORS.filter((f) => f.configPath !== null);
    // Non-vacuity: at least one floor must actually be config-backed, or this case proves nothing.
    expect(backed.length).toBe(3);

    for (const floor of backed) {
      const path = floor.configPath as string;
      const expected = path
        .split(".")
        .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)[k], cfg);
      expect(expected).not.toBeUndefined();
      expect(safetyFloorLiveValue(floor, REPO_ROOT)).toEqual(expected);
    }
  });

  it("the hard-limit floor declares no config key rather than inventing one", () => {
    const hard = SAFETY_FLOORS.filter((f) => f.configPath === null);
    expect(hard.length).toBe(1);
    expect(hard[0].id).toBe("protected_branch_merge");
    expect(safetyFloorLiveValue(hard[0], REPO_ROOT)).toBeNull();
  });

  it("SAFETY_SURFACE_VALUES carries the unfilled marker alongside yes/no", () => {
    expect([...SAFETY_SURFACE_VALUES]).toEqual(["yes", "no", "—"]);
  });

  // ── 28-REVIEW CR-03 / CR-04: ONE element-level blank authority, and it stays one. ────────────────
  it("BLANK_MARKERS is a closed set, pinned two-sided, and isBlank is its only reader", () => {
    expect([...BLANK_MARKERS]).toEqual(["", "—", "–", "-"]);
    expect(BLANK_MARKERS.length).toBe(BLANK_MARKER_COUNT);
    expect(BLANK_MARKERS.length).not.toBe(3);
    expect(BLANK_MARKERS.length).not.toBe(5);
    for (const m of BLANK_MARKERS) expect(isBlank(m), JSON.stringify(m)).toBe(true);
    // Whitespace around a marker is still blank; a real cell is not.
    expect(isBlank("  —  ")).toBe(true);
    expect(isBlank("\t\n ")).toBe(true);
    expect(isBlank("Read in full; no finding.")).toBe(false);
    // A bare NON-ANSWER is deliberately NOT blank — it belongs to check-audit-register's
    // BARE_OBSERVATIONS, which answers a different question. Pinned so the two sets cannot merge.
    expect(isBlank("?")).toBe(false);
    expect(isBlank("tbd")).toBe(false);
  });

  it("no other scripts/ source re-derives the blank predicate — the fourth definition cannot land", () => {
    // THE CONTROL, AND ITS BOUND, STATED. Phase 28 shipped THREE definitions of "blank" over one
    // class of cell and they disagreed; collapsing them to one is worth nothing if a fourth can be
    // written next week. A re-derivation has a recognisable shape: an equality against the empty
    // string DISJOINED, on the same line, with an equality against a placeholder glyph. That is
    // exactly what check-claim-anchors.ts:286 read.
    //
    // WHAT IT CANNOT SEE, so no reader over-reads it: a re-derivation spelled as a Set, a switch, or
    // a regex would pass. This catches the shape that was actually shipped, three times, and it is a
    // control rather than a proof. The positive half below is the load-bearing one.
    const offenders: string[] = [];
    for (const name of readdirSync(join(REPO_ROOT, "scripts")).sort()) {
      if (!name.endsWith(".ts") || name.endsWith(".test.ts")) continue;
      readFileSync(join(REPO_ROOT, "scripts", name), "utf8")
        .split("\n")
        .forEach((line, n) => {
          if (line.trim().startsWith("//")) return;
          if (/===\s*""/.test(line) && /===\s*"(—|–|-)"/.test(line)) {
            offenders.push(`scripts/${name}:${n + 1}: ${line.trim()}`);
          }
        });
    }
    expect(
      offenders,
      `a blank predicate is being re-derived instead of asking audit-model.isBlank:\n${offenders.join("\n")}`,
    ).toEqual([]);

    // NON-VACUITY, and the positive half: the two gates that used to re-derive it now IMPORT it. A
    // scan that found nothing anywhere would satisfy the assertion above while proving nothing.
    for (const consumer of ["check-audit-register.ts", "check-claim-anchors.ts"]) {
      const src = readFileSync(join(REPO_ROOT, "scripts", consumer), "utf8");
      expect(src, consumer).toMatch(/^\s+isBlank,$/m);
      expect(src, consumer).toMatch(/isBlank\(/);
    }
  });
});

describe("audit-model: readRegister — the well-formed path", () => {
  it("returns 37 rows of which 36 carry counted: yes", () => {
    const dir = writeRegisterFixture({ rowsA: thirtySevenRows(), rowsB: [] });
    const reg = readRegister(dir);
    expect(reg.rows.length).toBe(37);
    expect(reg.rows.filter((r) => r.counted).length).toBe(36);
    expect(reg.rows.filter((r) => !r.counted).length).toBe(1);
    expect(reg.findings.length).toBe(0);
  });

  it("carries the declared findings count and the finding rows through", () => {
    const rows = thirtySevenRows();
    rows[0] = rowA("agent-factory/roles/r01.md", "role", "yes", "yes", "2", "Two findings.");
    const dir = writeRegisterFixture({
      rowsA: rows,
      rowsB: [
        rowB("F-28-001", "agent-factory/roles/r01.md", "1", "fixed"),
        rowB("F-28-002", "agent-factory/roles/r01.md", "6", "deferred", "29", "Phase 29 owns it."),
      ],
    });
    const reg = readRegister(dir);
    expect(reg.rows[0].findings).toBe(2);
    expect(reg.rows[0].safetySurface).toBe("yes");
    expect(reg.findings.length).toBe(2);
    expect(reg.findings[1].category).toBe(6);
    expect(reg.findings[1].targetPhase).toBe("29");
  });

  it("preserves the register's declared line number on every row, for quotable refusals", () => {
    const dir = writeRegisterFixture({ rowsA: thirtySevenRows(), rowsB: [] });
    const reg = readRegister(dir);
    for (const r of reg.rows) expect(r.line).toBeGreaterThan(0);
    // Rows are in file order, so line numbers strictly increase.
    for (let i = 1; i < reg.rows.length; i++) {
      expect(reg.rows[i].line).toBeGreaterThan(reg.rows[i - 1].line);
    }
  });
});

describe("audit-model: readRegister — the refusals", () => {
  it("refuses a missing register BY NAME rather than returning nothing", () => {
    const dir = freshTmp("grugops-audit-missing-");
    expect(() => readRegister(dir)).toThrow(/refusing/);
    expect(() => readRegister(dir)).toThrow(new RegExp(REGISTER_PATH.replace(/\//g, "\\/")));
  });

  it("refuses a register with ZERO file rows — never returns an empty array", () => {
    // A vacuous register satisfies every downstream equality: 0 === 0. The refusal lives in the
    // PARSER rather than in the gate because every consumer of this parser inherits it here.
    const dir = writeRegisterFixture({ rowsA: [], rowsB: [] });
    expect(() => readRegister(dir)).toThrow(/refusing/);
    expect(() => readRegister(dir)).toThrow(/zero file rows/);
  });

  it("refuses a register with no Table A heading at all", () => {
    const dir = writeRegisterFixture({ omitTableA: true, rowsA: [], rowsB: [] });
    expect(() => readRegister(dir)).toThrow(/Table A/);
  });

  it("refuses a Table A header row whose columns are reordered", () => {
    const dir = writeRegisterFixture({
      tableAHeader: "| kind | file | counted | safety_surface | findings | observation |",
      rowsA: thirtySevenRows(),
      rowsB: [],
    });
    expect(() => readRegister(dir)).toThrow(/column/i);
  });

  it("refuses an unreadable row NAMING ITS LINE, rather than skipping it", () => {
    const rows = thirtySevenRows();
    rows[4] = "| agent-factory/roles/r05.md | role | yes | no |"; // 4 cells, not 6
    const dir = writeRegisterFixture({ rowsA: rows, rowsB: [] });
    expect(() => readRegister(dir)).toThrow(/refusing/);
    expect(() => readRegister(dir)).toThrow(/line \d+/);
    // Never a silent skip: the shortfall must not surface as 36 rows.
    expect(() => readRegister(dir)).toThrow(/6 column/);
  });

  it("refuses a duplicate file key in Table A, naming the value ONCE", () => {
    const rows = thirtySevenRows();
    rows.push(rowA("agent-factory/roles/r01.md", "role"));
    const dir = writeRegisterFixture({ rowsA: rows, rowsB: [] });
    let msg = "";
    try {
      readRegister(dir);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/duplicate/i);
    expect(msg.split("agent-factory/roles/r01.md").length - 1).toBe(1);
  });

  it("refuses a duplicate finding_id, naming the value ONCE", () => {
    const dir = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [
        rowB("F-28-001", "agent-factory/roles/r01.md"),
        rowB("F-28-001", "agent-factory/roles/r02.md"),
      ],
    });
    let msg = "";
    try {
      readRegister(dir);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/duplicate/i);
    expect(msg.split("F-28-001").length - 1).toBe(1);
  });

  it("refuses a finding_id outside the canonical F-28-NNN form", () => {
    const dir = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [rowB("F-28-A", "agent-factory/roles/r01.md")],
    });
    expect(() => readRegister(dir)).toThrow(/F-28-NNN/);
  });

  it("refuses an illegal kind, counted, safety_surface or findings value by name", () => {
    const base = thirtySevenRows();

    const badKind = [...base];
    badKind[0] = rowA("agent-factory/roles/r01.md", "checklist");
    expect(() => readRegister(writeRegisterFixture({ rowsA: badKind, rowsB: [] }))).toThrow(
      /checklist/,
    );

    const badCounted = [...base];
    badCounted[0] = rowA("agent-factory/roles/r01.md", "role", "maybe");
    expect(() => readRegister(writeRegisterFixture({ rowsA: badCounted, rowsB: [] }))).toThrow(
      /maybe/,
    );

    const badSafety = [...base];
    badSafety[0] = rowA("agent-factory/roles/r01.md", "role", "yes", "TBD");
    expect(() => readRegister(writeRegisterFixture({ rowsA: badSafety, rowsB: [] }))).toThrow(
      /TBD/,
    );

    const badFindings = [...base];
    badFindings[0] = rowA("agent-factory/roles/r01.md", "role", "yes", "no", "-1");
    expect(() => readRegister(writeRegisterFixture({ rowsA: badFindings, rowsB: [] }))).toThrow(
      /non-negative integer/,
    );
  });

  // ── 28-REVIEW WR-02: the numeric cells hold a CANONICAL FORM, not a lenient prefix parse. ───────
  //
  // RED AGAINST THE PRE-FIX BUILD. `Number.parseInt` is a prefix parser, and the module declared a
  // canonical-form doctrine for its IDS while its NUMBERS accepted anything with a leading digit.
  // Measured on the committed build: "0 abc" -> 0, "1e9" -> 1, "6 (record-only)" -> 6, all green.
  // "1e9" is the sharp one: D-03's equality two then compares a number the author never wrote
  // against Table B's real count and agrees or disagrees for the wrong reason.
  it("refuses a `findings` cell outside the bare-non-negative-integer form", () => {
    const base = thirtySevenRows();
    // NOT in this list: a cell padded with spaces. splitRow() trims every cell before the value is
    // ever seen, because padding is markdown TABLE FORMATTING and not part of the value — `| 1 |`
    // and `|1|` are the same cell. Measured, not assumed: " 1" parses green and must.
    for (const bad of ["0 abc", "1e9", "+1", "01", "1.0", "0x1", "one"]) {
      const rows = [...base];
      rows[0] = rowA("agent-factory/roles/r01.md", "role", "yes", "no", bad);
      let msg = "";
      try {
        readRegister(writeRegisterFixture({ rowsA: rows, rowsB: [] }));
      } catch (e) {
        msg = (e as Error).message;
      }
      expect(msg, `findings: ${JSON.stringify(bad)}`).toMatch(/bare non-negative integer/);
      expect(msg, `findings: ${JSON.stringify(bad)}`).toContain(bad.trim());
    }
  });

  it("refuses a `category` cell outside the bare-non-negative-integer form", () => {
    for (const bad of ["6 (record-only)", "1e9", "+2", "02", "3."]) {
      const dir = writeRegisterFixture({
        rowsA: thirtySevenRows(),
        rowsB: [rowB("F-28-001", "agent-factory/roles/r01.md", bad)],
      });
      let msg = "";
      try {
        readRegister(dir);
      } catch (e) {
        msg = (e as Error).message;
      }
      expect(msg, `category: ${JSON.stringify(bad)}`).toMatch(/bare non-negative integer/);
    }
  });

  it("still admits the canonical numeric forms — the refusal discriminates", () => {
    // A refusal that also rejected the real register would be a regression wearing a fix's shape.
    // `0` and a multi-digit value are both legal; the live register carries 0..3 in `findings`.
    const rows = thirtySevenRows();
    rows[0] = rowA("agent-factory/roles/r01.md", "role", "yes", "no", "0");
    rows[1] = rowA("agent-factory/roles/r02.md", "role", "yes", "no", "10");
    const reg = readRegister(
      writeRegisterFixture({
        rowsA: rows,
        rowsB: Array.from({ length: 10 }, (_, i) =>
          rowB(`F-28-${String(i + 1).padStart(3, "0")}`, "agent-factory/roles/r02.md", "6", "deferred", "29"),
        ),
      }),
    );
    expect(reg.rows[0].findings).toBe(0);
    expect(reg.rows[1].findings).toBe(10);
    expect(reg.findings.length).toBe(10);
  });

  it("refuses a disposition outside the legal set, printing the offending value AND the whole legal set", () => {
    const dir = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [rowB("F-28-001", "agent-factory/roles/r01.md", "1", "wontfix")],
    });
    let msg = "";
    try {
      readRegister(dir);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain("wontfix");
    // Actionable rather than merely non-zero: every legal member is printed.
    for (const d of DISPOSITIONS) expect(msg).toContain(d);
  });

  it("names a repeated foreign disposition value exactly ONCE (the de-duplication requirement)", () => {
    const dir = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [
        rowB("F-28-001", "agent-factory/roles/r01.md", "1", "wontfix"),
        rowB("F-28-002", "agent-factory/roles/r02.md", "1", "wontfix"),
      ],
    });
    let msg = "";
    try {
      readRegister(dir);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg.split("wontfix").length - 1).toBe(1);
  });

  it("refuses a deferred finding with no target_phase", () => {
    const dir = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [rowB("F-28-001", "agent-factory/roles/r01.md", "1", "deferred", "—", "A reason.")],
    });
    expect(() => readRegister(dir)).toThrow(/target_phase/);
  });

  it("refuses an accepted finding with no reason", () => {
    const dir = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [rowB("F-28-001", "agent-factory/roles/r01.md", "1", "accepted", "—", "—")],
    });
    expect(() => readRegister(dir)).toThrow(/reason/);
  });

  it("refuses a finding whose file is absent from Table A (the foreign-key direction)", () => {
    const dir = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [rowB("F-28-001", "agent-factory/checklists/nope.md")],
    });
    expect(() => readRegister(dir)).toThrow(/agent-factory\/checklists\/nope\.md/);
    expect(() => readRegister(dir)).toThrow(/Table A/);
  });

  it("refuses a category outside 1..6", () => {
    const dir = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [rowB("F-28-001", "agent-factory/roles/r01.md", "7")],
    });
    expect(() => readRegister(dir)).toThrow(/category/);
  });

  it("refuses a category-6 finding dispositioned anything but deferred-to-29, and parses the legal one", () => {
    // D-07's record-only rule made STRUCTURAL. A convention is ignored; a parser refusal is not.
    const fixedSix = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [rowB("F-28-001", "agent-factory/roles/r01.md", "6", "fixed")],
    });
    expect(() => readRegister(fixedSix)).toThrow(/record-only/i);

    const wrongPhase = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [rowB("F-28-001", "agent-factory/roles/r01.md", "6", "deferred", "30", "Later.")],
    });
    expect(() => readRegister(wrongPhase)).toThrow(/29/);

    const legal = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [
        rowB("F-28-001", "agent-factory/roles/r01.md", "6", "deferred", "29", "Phase 29 owns it."),
      ],
    });
    expect(readRegister(legal).findings.length).toBe(1);
  });

  it("UNION of two arms: a duplicate id AND a missing target_phase are both present, and the DUPLICATE fires", () => {
    // The arms must be ORDERED rather than racing. Whichever refusal fires, it must be the same one
    // on every run, or the message a human meets is not reproducible.
    const dir = writeRegisterFixture({
      rowsA: thirtySevenRows(),
      rowsB: [
        rowB("F-28-001", "agent-factory/roles/r01.md", "1", "deferred", "—", "A reason."),
        rowB("F-28-001", "agent-factory/roles/r02.md", "1", "fixed"),
      ],
    });
    expect(() => readRegister(dir)).toThrow(/duplicate/i);
    expect(() => readRegister(dir)).not.toThrow(/target_phase/);
  });

  it("UNION of a Table A arm and a Table B arm: the Table A arm fires first", () => {
    const rows = thirtySevenRows();
    rows.push(rowA("agent-factory/roles/r01.md", "role"));
    const dir = writeRegisterFixture({
      rowsA: rows,
      rowsB: [rowB("F-28-001", "agent-factory/roles/r01.md", "1", "wontfix")],
    });
    expect(() => readRegister(dir)).toThrow(/duplicate/i);
    expect(() => readRegister(dir)).not.toThrow(/wontfix/);
  });
});

// ── (Plan 29-25, LANG-07) `tableUnder` DELEGATES — EVERY AXIS THE REWIRE MOVED, FROM BOTH SIDES. ──
//
// `tableUnder` was the FIFTH section locator of the class plans 29-20 through 29-24 unified, logged
// by 29-22, re-logged by 29-23 and named by 29-24 as the only known survivor. Plan 29-25 closes it,
// and 29-24's own Deviation 1 is the reason this block exists: that plan ran mutations after its
// suite went green and found SIX axes its rewire had MOVED that nothing owned. An unpinned widening
// is indistinguishable from an accident, so each axis below is asserted in BOTH directions.
//
// The live register is byte-unmoved by the rewire — 37 Table A rows and 32 Table B findings before
// and after, with `check-audit-register`'s transcript identical — so the proof of this fix is a
// PLANTED input and never a moved number.
describe("audit-model: tableUnder takes its section extent from the ONE authority (plan 29-25)", () => {
  // A register written line by line, so a case can plant a shape the structured fixture cannot.
  function rawRegister(...lines: string[]): string {
    const dir = freshTmp("grugops-audit-locator-");
    mkdirSync(join(dir, "docs", "audit"), { recursive: true });
    writeFileSync(join(dir, REGISTER_PATH), lines.join("\n"), "utf8");
    return dir;
  }
  const preamble = [
    "# Phase 28 Disposition Register",
    "",
    "## What this register does not prove",
    "",
    "Prose.",
    "",
  ];
  const tableA = (...extra: string[]): string[] => [
    "## Table A — audited files",
    "",
    TABLE_A_HEADER,
    TABLE_A_SEP,
    ...thirtySevenRows(),
    ...extra,
    "",
  ];
  const tableB = (...rows: string[]): string[] => [
    "## Table B — findings",
    "",
    TABLE_B_HEADER,
    TABLE_B_SEP,
    ...rows,
    "",
  ];

  it("a LEVEL-ONE heading closes Table A's section, exactly as `## ` does", () => {
    // THE CR-02 AXIS, ONE CHARACTER TO THE LEFT, IN THE LAST MODULE THAT STILL HAD IT. The deleted
    // close was `lines[i].startsWith("## ")`, so a `# ` heading between the two tables closed nothing
    // and every pipe row below it — Table B's header, its separator and its rows — was harvested into
    // Table A. Asserted through the parse: Table A holds exactly its own 37 rows.
    // THE FIXTURE'S SHAPE IS THE WHOLE CASE, AND THE FIRST DRAFT OF IT DISCRIMINATED NOTHING. Putting
    // only PROSE between `# Appendix` and `## Table B — findings` proves nothing: the deleted close
    // walks past the level-one heading and then stops at the level-two one, harvesting the same rows
    // the authority does. Caught by running the mutation rather than by reading — the deleted close
    // was restored and not one case moved. So a PIPE ROW is planted under the level-one successor.
    // Under the deleted close that row lands inside Table A and the parse REFUSES on its cell count;
    // under the authority it is outside the section and the parse is clean.
    const STRAY_ROW = "| a stray two-cell row under the appendix | not a register row |";
    const dir = rawRegister(
      ...preamble,
      ...tableA(),
      "# Appendix",
      "",
      "A later top-level section, carrying a table of its own:",
      "",
      STRAY_ROW,
      "",
      ...tableB(rowB("F-28-001", "agent-factory/roles/r01.md")),
    );
    const reg = readRegister(dir);
    expect(reg.rows).toHaveLength(37);
    expect(reg.findings).toHaveLength(1);

    // THE DISCRIMINATION, ASSERTED OVER THE HARVESTED LINES RATHER THAN OVER AN INDEX. The DELETED
    // close is restated here as a reference INPUT and the two answers are compared by WHAT THEY
    // COLLECT, because comparing where they STOP is what let the first draft pass: two closes can
    // stop at different lines and still collect the same rows.
    const lines = readFileSync(join(dir, REGISTER_PATH), "utf8").split("\n");
    const anchor = lines.indexOf("## Table A — audited files");
    expect(anchor).toBeGreaterThan(-1);
    const deletedEnd = (): number => {
      for (let i = anchor + 1; i < lines.length; i += 1) {
        if (lines[i].startsWith("## ")) return i;
      }
      return lines.length;
    };
    const pipeLinesTo = (end: number): string[] =>
      lines.slice(anchor + 1, end).filter((l) => l.trim().startsWith("|"));
    const authorityEnd = lines.indexOf("# Appendix");
    expect(authorityEnd).toBeGreaterThan(anchor);
    expect(
      pipeLinesTo(deletedEnd()).filter((l) => !pipeLinesTo(authorityEnd).includes(l)),
      "the deleted `## `-only close must HARVEST a line the authority does not, or this case discriminates nothing",
    ).toEqual([STRAY_ROW]);
  });

  it("a LEVEL-THREE heading does NOT close it — a sub-heading structures a section rather than leaving it", () => {
    // The other side of the same axis. `sectionEndIndex(..., 2)` closes on level at most two, so a
    // `### ` between two runs of rows keeps both runs inside the table. Treating every heading as an
    // exit would silently drop every row below the first sub-heading, with no number saying so.
    const dir = rawRegister(
      ...preamble,
      ...tableA("", "### A note about the rows above", "", rowA("agent-factory/roles/r18.md")),
      ...tableB(),
    );
    const reg = readRegister(dir);
    expect(reg.rows, "the rows below a `### ` sub-heading stay in the table").toHaveLength(38);
    expect(reg.rows[37].file).toBe("agent-factory/roles/r18.md");
  });

  it("a FENCED quotation of the table heading is not the anchor — the real heading is", () => {
    // The anchor is fence-aware now. Before the rewire `findIndex(l => l.trim() === heading)` took
    // the FIRST textual match, so a register documenting its own heading inside a fenced example had
    // that quotation adopted and every real row fell outside the parse.
    const dir = rawRegister(
      ...preamble,
      "```",
      "## Table A — audited files",
      "| file | kind | counted | safety_surface | findings | observation |",
      "```",
      "",
      ...tableA(),
      ...tableB(),
    );
    const reg = readRegister(dir);
    expect(reg.rows, "the REAL table is parsed, not the quoted one").toHaveLength(37);
  });

  it("a FENCED seven-column row under the real heading donates no row", () => {
    // The mirror image of this module's own silent-truncation argument: a parser that ADOPTS a row
    // nobody wrote. A fenced example inside the table's section is documentation, not data.
    const dir = rawRegister(
      ...preamble,
      ...tableA(
        "",
        "An example of the shape, quoted rather than declared:",
        "",
        "```",
        rowA("agent-factory/roles/zz-not-a-real-row.md"),
        "```",
      ),
      ...tableB(),
    );
    const reg = readRegister(dir);
    expect(reg.rows).toHaveLength(37);
    expect(
      reg.rows.map((r) => r.file),
      "a fenced example row must not become a register row",
    ).not.toContain("agent-factory/roles/zz-not-a-real-row.md");
  });

  it("a TRAILING-space heading is located and a LEADING-space heading is refused BY NAME", () => {
    // The equality moved from `trim()` to the authority's `trimEnd()`, which is a NARROWING as well
    // as a normalisation, so both directions are pinned. Column-zero anchors are the convention the
    // other four gates already share; admitting indented ATX would change what all five scan.
    const trailing = rawRegister(
      ...preamble,
      "## Table A — audited files  ",
      "",
      TABLE_A_HEADER,
      TABLE_A_SEP,
      ...thirtySevenRows(),
      "",
      ...tableB(),
    );
    expect(readRegister(trailing).rows).toHaveLength(37);

    const leading = rawRegister(
      ...preamble,
      "  ## Table A — audited files",
      "",
      TABLE_A_HEADER,
      TABLE_A_SEP,
      ...thirtySevenRows(),
      "",
      ...tableB(),
    );
    expect(() => readRegister(leading)).toThrow(/carries no .* heading/);
  });
});

describe("audit-model: readRegistry", () => {
  it("returns claim rows with the fenced text extracted BYTE-FOR-BYTE", () => {
    // 28-04 compares this text against the anchored sentence as an EXACT byte comparison. Any
    // normalization here — trimming, whitespace collapse, line-ending rewrite — would silently
    // weaken that comparison, so the extraction is measured on text designed to expose each.
    const weird = "  leading spaces and a trailing tab\t\nsecond line  ";
    const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001", { text: weird })));
    const reg = readRegistry(dir);
    expect(reg.claims.length).toBe(1);
    expect(reg.claims[0].verbatim).toBe(weird);
    expect(reg.claims[0].id).toBe("C-28-001");
    expect(reg.claims[0].file).toBe("README.md");
    expect(reg.claims[0].line).toBe("3");
    expect(reg.claims[0].kind).toBe("architecture");
    expect(reg.claims[0].status).toBe("true");
    expect(reg.claims[0].dependsOn).toEqual([]);
  });

  it("carries a multi-floor depends_on through as a list", () => {
    const dir = writeRegistryFixture(
      registryDoc(
        claimBlock("C-28-001", {
          kind: "safety",
          dependsOn: "autonomy, protected_branch_merge",
        }),
      ),
    );
    expect(readRegistry(dir).claims[0].dependsOn).toEqual([
      "autonomy",
      "protected_branch_merge",
    ]);
  });

  it("refuses a missing registry by name", () => {
    const dir = freshTmp("grugops-audit-registry-missing-");
    expect(() => readRegistry(dir)).toThrow(/refusing/);
  });

  it("refuses a registry with zero claims", () => {
    const dir = writeRegistryFixture(registryDoc());
    expect(() => readRegistry(dir)).toThrow(/zero claim/);
  });

  it("refuses a claim with no fenced block", () => {
    const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001", { omitFence: true })));
    expect(() => readRegistry(dir)).toThrow(/fenced/);
  });

  it("refuses a duplicate claim id, naming it once", () => {
    const dir = writeRegistryFixture(
      registryDoc(claimBlock("C-28-001"), claimBlock("C-28-001")),
    );
    let msg = "";
    try {
      readRegistry(dir);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/duplicate/i);
    expect(msg.split("C-28-001").length - 1).toBe(1);
  });

  it("refuses a kind outside CLAIM_KINDS, printing the legal set", () => {
    const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001", { kind: "marketing" })));
    let msg = "";
    try {
      readRegistry(dir);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain("marketing");
    for (const k of CLAIM_KINDS) expect(msg).toContain(k);
  });

  it("refuses a status outside CLAIM_STATUSES", () => {
    const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001", { status: "partial" })));
    expect(() => readRegistry(dir)).toThrow(/partial/);
  });

  it("refuses a depends_on naming a floor outside SAFETY_FLOORS", () => {
    const dir = writeRegistryFixture(
      registryDoc(claimBlock("C-28-001", { kind: "safety", dependsOn: "vibes" })),
    );
    let msg = "";
    try {
      readRegistry(dir);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain("vibes");
    for (const f of SAFETY_FLOORS) expect(msg).toContain(f.id);
  });

  it("refuses a claim id outside the canonical C-28-NNN form", () => {
    const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-A")));
    expect(() => readRegistry(dir)).toThrow(/C-28-NNN/);
  });

  // ── 28-REVIEW CR-02: the metadata region skips nothing and overwrites nothing silently. ─────────
  //
  // RED AGAINST THE PRE-FIX BUILD. `readRegistry` did `meta[m[1]] = m[2].trim()` with no duplicate
  // detection and dropped any line the metadata regex did not match. The file already had a
  // "refuses a duplicate claim id" case and had NO duplicate-metadata-key case.
  it("refuses a DUPLICATE metadata key — a second `status:` must never launder a claim", () => {
    // The exact laundering shape: `false` first, `true` second. Pre-fix this parsed green as
    // {"id":"C-28-001","status":"true","disposition":""}, and check-claim-anchors.js short-circuits
    // on status === "true", skipping every D-17 disposition / finding_id / target_phase obligation.
    const body = [
      "# Phase 28 Claim Registry",
      "",
      "## Claims",
      "",
      "### C-28-001",
      "",
      "- file: README.md",
      "- line: 3",
      "- kind: safety",
      "- depends_on: autonomy",
      "- status: false",
      "- status: true",
      "",
      FENCE,
      "A claim.",
      FENCE,
      "",
    ].join("\n");
    const dir = writeRegistryFixture(body);
    let msg = "";
    try {
      readRegistry(dir);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/duplicate metadata key/i);
    expect(msg).toContain("status");
    expect(msg).toContain("C-28-001");
    // The refusal must name the LINE, so a fix is a jump rather than a search.
    expect(msg).toContain("line 12");
  });

  it("refuses an UNRECOGNISED line in the metadata region rather than dropping it", () => {
    // A dropped line reads downstream as an ABSENT key — the silent-truncation shape this module's
    // header refuses. Blank lines stay legal; this one is not blank and is not `- key: value`.
    const body = [
      "# Phase 28 Claim Registry",
      "",
      "## Claims",
      "",
      "### C-28-001",
      "",
      "- file: README.md",
      "  status: true",
      "- line: 3",
      "- kind: architecture",
      "- depends_on: —",
      "- status: true",
      "",
      FENCE,
      "A claim.",
      FENCE,
      "",
    ].join("\n");
    const dir = writeRegistryFixture(body);
    let msg = "";
    try {
      readRegistry(dir);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/neither blank nor/i);
    expect(msg).toContain("status: true");
  });

  it("still admits the blank lines the region legitimately carries", () => {
    // The refusal above must not have made the ordinary shape unparseable: `claimBlock` emits a blank
    // line after the heading and another before the fence, and the live registry does the same.
    const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001")));
    expect(readRegistry(dir).claims.length).toBe(1);
  });

  // ── 28-REVIEW CR-03: an EMPTY verbatim fence is refused at the parse authority. ──────────────────
  //
  // RED AGAINST THE PRE-FIX BUILD. `"".split("\n")` is `[""]` — one element — so check-claim-anchors
  // sliced the single line below the anchor, compared "" against it, and when that line was blank
  // (the normal markdown shape) the buffers compared EQUAL. The gate then reported
  // `1 verbatim comparison(s) performed, all byte-identical` over a comparison that proved nothing.
  it("refuses an EMPTY fenced block — a comparison that cannot fail is not a comparison", () => {
    const body = [
      "# Phase 28 Claim Registry",
      "",
      "## Claims",
      "",
      "### C-28-001",
      "",
      "- file: README.md",
      "- line: 3",
      "- kind: architecture",
      "- depends_on: —",
      "- status: true",
      "",
      FENCE,
      FENCE,
      "",
    ].join("\n");
    let msg = "";
    try {
      readRegistry(writeRegistryFixture(body));
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/no claim text/i);
    expect(msg).toContain("C-28-001");
    // The refusal must state WHY an empty verbatim is dangerous, not merely that it is empty.
    expect(msg).toMatch(/byte-identical|vacuous/i);
  });

  it("refuses a WHITESPACE-ONLY fenced block for the same reason", () => {
    const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001", { text: "   \t  " })));
    expect(() => readRegistry(dir)).toThrow(/no claim text/i);
  });

  it("refuses a fenced block that is only a PLACEHOLDER GLYPH", () => {
    for (const glyph of ["—", "–", "-"]) {
      const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001", { text: glyph })));
      expect(() => readRegistry(dir), glyph).toThrow(/no claim text/i);
    }
  });

  it("still admits a real one-line claim — the refusal discriminates", () => {
    const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001", { text: "x" })));
    expect(readRegistry(dir).claims[0].verbatim).toBe("x");
  });

  // ── 28-REVIEW WR-07: `line` is a REQUIRED key, so its FORM is held even though its VALUE is not.
  //
  // The registry documents, in its own `## Why `line` is recorded and not checked` section, that the
  // number is advisory: asserting it would red on every unrelated edit above a claim. That decision
  // stands. What did not stand is that a required key was never validated at all.
  it("refuses a `line` outside the canonical `N` / `N-M` form", () => {
    for (const bad of ["banana", "", "4a", "-4", "4-", "4 - 6", "4,6"]) {
      const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001", { line: bad })));
      let msg = "";
      try {
        readRegistry(dir);
      } catch (e) {
        msg = (e as Error).message;
      }
      expect(msg, `line: ${JSON.stringify(bad)}`).toMatch(/canonical form/);
    }
  });

  it("admits BOTH live `line` shapes — a single line and a range", () => {
    // Re-measured on the committed registry 2026-08-13: 42 rows, 19 single values and 23 ranges
    // (38 / 19 / 19 at the 2026-08-12 measurement). A refusal that rejected either shape would be a
    // regression wearing a fix's shape.
    for (const good of ["4", "7-8", "100-103", "0"]) {
      const dir = writeRegistryFixture(registryDoc(claimBlock("C-28-001", { line: good })));
      expect(readRegistry(dir).claims[0].line, good).toBe(good);
    }
  });

  it("refuses a claim missing a required metadata key, naming the key", () => {
    const body = [
      "# Phase 28 Claim Registry",
      "",
      "## Claims",
      "",
      "### C-28-001",
      "",
      "- file: README.md",
      "- kind: architecture",
      "- depends_on: —",
      "- status: true",
      "",
      FENCE,
      "A claim.",
      FENCE,
      "",
    ].join("\n");
    const dir = writeRegistryFixture(body);
    expect(() => readRegistry(dir)).toThrow(/line/);
  });
});

// ---------------------------------------------------------------------------------------------
// (Plan 29-28, 29-REVIEW § CR-02) THE REGISTRY'S BLOCK BOUNDARIES COME FROM THE ONE AUTHORITY.
//
// `readRegistry` used to scan RAW lines for `CLAIM_HEADING_RE` and take each block's end from the
// next index in that array — a section-extent construct, fence-blind, and invisible to the owner
// scan on BOTH of its arms. A claim block written inside a FENCED EXAMPLE therefore parsed as a
// live `kind: safety` row, entered `safetySurfaceUnion`, and entered the D-18 exclusion list that
// LANG-02 consults to decide which files a language pass may not touch. Documentation read as live
// data, in the phase whose founding rule is that it must not be.
//
// EVERY CASE BELOW IS TWO-SIDED. A fence-aware locator that flagged EVERYTHING would satisfy the
// "no phantom row" half and answer nothing correctly, which is the half-fix shape that let three of
// this phase's defects survive a whole gap-closure round.
// ---------------------------------------------------------------------------------------------
describe("audit-model: readRegistry's block boundaries come from the ONE authority (plan 29-28, CR-02)", () => {
  // The reviewer's fixture (29-REVIEW.md § CR-02), rebuilt with the illustration's outer fence
  // CLOSED so the document carries an EVEN delimiter count. The reviewer's transcription left the
  // outer example open, which the unterminated-fence refusal added by this same plan would refuse
  // for a different reason — and a fixture that fails for the wrong reason proves nothing about the
  // right one. The SHAPE the review reproduced is preserved exactly: a `### C-28-999` heading and a
  // full metadata block, written inside a fenced example, with their own delimiter pair inside it.
  const REAL_ONLY = "The real claim sentence.";
  function phantomRegistry(): string {
    return [
      "# Phase 28 Claim Registry",
      "",
      "## Claims",
      "",
      "### C-28-001",
      "",
      "- file: README.md",
      "- line: 4",
      "- kind: architecture",
      "- depends_on: autonomy",
      "- status: true",
      "",
      FENCE, // 1 — the real claim's fence opens
      REAL_ONLY,
      FENCE, // 2 — and closes
      "",
      "## How to write a claim block",
      "",
      "An example, quoted rather than declared:",
      "",
      FENCE, // 3 — the illustration opens
      "### C-28-999",
      "",
      "- file: PHANTOM.md",
      "- line: 1",
      "- kind: safety",
      "- depends_on: autonomy",
      "- status: true",
      "",
      FENCE, // 4
      "The phantom claim sentence.",
      FENCE, // 5
      FENCE, // 6 — the illustration closes
      "",
    ].join("\n");
  }

  it("a claim block written INSIDE a fenced example produces NO row — documentation is not live data", () => {
    // RED AGAINST THE PRE-FIX BUILD: two rows, the second
    // {"id":"C-28-999","file":"PHANTOM.md","kind":"safety"} — a safety claim for a file that has no
    // claim at all, and a file that has never been audited.
    const dir = writeRegistryFixture(phantomRegistry());
    const reg = readRegistry(dir);
    expect(reg.claims.map((c) => c.id)).toEqual(["C-28-001"]);
    expect(reg.claims[0].verbatim).toBe(REAL_ONLY);
    // The phantom's FILE is asserted absent by name, not merely the count — a count could be right
    // for the wrong reason (one row dropped, one gained).
    expect(reg.claims.map((c) => c.file)).not.toContain("PHANTOM.md");
  });

  it("the SAME block OUTSIDE a fence DOES produce a row — the other side of fence-awareness", () => {
    // Without this half a locator that returned NOTHING would pass the case above.
    const dir = writeRegistryFixture(
      registryDoc(
        claimBlock("C-28-001"),
        claimBlock("C-28-999", { file: "PHANTOM.md", line: "1", kind: "safety" }),
      ),
    );
    const reg = readRegistry(dir);
    expect(reg.claims.map((c) => c.id)).toEqual(["C-28-001", "C-28-999"]);
    expect(reg.claims.map((c) => c.file)).toContain("PHANTOM.md");
  });

  it("a fenced example BETWEEN two real blocks donates NO metadata to the block above it", () => {
    // The block's SPAN may now legally skip over a fenced example, so the span alone no longer
    // bounds the metadata region. The METADATA region is still bounded by the block's OWN first
    // delimiter, which is what stops the example's `- file:` line rewriting the block above it.
    // Asserted as a case rather than as a sentence in the source.
    const body = [
      "# Phase 28 Claim Registry",
      "",
      "## Claims",
      "",
      "### C-28-001",
      "",
      "- file: README.md",
      "- line: 4",
      "- kind: architecture",
      "- depends_on: autonomy",
      "- status: true",
      "",
      FENCE,
      "The first claim.",
      FENCE,
      "",
      "An illustration between the two real blocks:",
      "",
      FENCE,
      "- file: EVIL.md",
      "- kind: safety",
      "- status: true",
      "### C-28-500",
      FENCE,
      "",
      "### C-28-002",
      "",
      "- file: AGENTS.md",
      "- line: 9",
      "- kind: architecture",
      "- depends_on: autonomy",
      "- status: true",
      "",
      FENCE,
      "The second claim.",
      FENCE,
      "",
    ].join("\n");
    const reg = readRegistry(writeRegistryFixture(body));
    expect(reg.claims.map((c) => c.id)).toEqual(["C-28-001", "C-28-002"]);
    expect(reg.claims[0].file).toBe("README.md");
    expect(reg.claims[0].verbatim).toBe("The first claim.");
    expect(reg.claims[1].file).toBe("AGENTS.md");
    expect(reg.claims[1].verbatim).toBe("The second claim.");
    expect(reg.claims.map((c) => c.file)).not.toContain("EVIL.md");
  });

  // ── THE POINT OF EFFECT. `safetySurfaceUnion` is where a fabricated row STOPS being a parse
  // curiosity and becomes an entry in the D-18 exclusion list — the list LANG-02 consults to decide
  // which files a controlled-language pass may not reword. Round 3's standing lesson is to move the
  // gate to the point of effect; a parser-only assertion would leave the union untested. ──────────
  function unionMirror(registryBody: string): string {
    const dir = freshTmp("grugops-audit-union-");
    mkdirSync(join(dir, "docs", "audit"), { recursive: true });
    writeFileSync(
      join(dir, REGISTER_PATH),
      [
        "# Register",
        "",
        "## Table A — audited files",
        "",
        TABLE_A_HEADER,
        TABLE_A_SEP,
        rowA("agent-factory/roles/r01.md", "role", "yes", "no", "0", "Read in full; no finding."),
        "",
        "## Table B — findings",
        "",
        TABLE_B_HEADER,
        TABLE_B_SEP,
        "",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(join(dir, REGISTRY_PATH), registryBody, "utf8");
    return dir;
  }

  it("the fenced phantom adds NOTHING to safetySurfaceUnion — asserted where the consequence lands", () => {
    const files = safetySurfaceUnion(unionMirror(phantomRegistry())).map((e) => e.file);
    expect(files).not.toContain("PHANTOM.md");
  });

  it("an UNFENCED `kind: safety` claim DOES reach safetySurfaceUnion — the union's other side", () => {
    // NON-VACUITY: without this half, a union that returned nothing at all would satisfy the case
    // above. The same file, the same `kind: safety`, moved outside the fence.
    const files = safetySurfaceUnion(
      unionMirror(
        registryDoc(
          claimBlock("C-28-001"),
          claimBlock("C-28-999", { file: "PHANTOM.md", line: "1", kind: "safety" }),
        ),
      ),
    ).map((e) => e.file);
    expect(files).toContain("PHANTOM.md");
  });

  it("the LIVE registry's claim count equals its INDEPENDENTLY derived unfenced heading count", () => {
    // The fix closes a ROUTE; it must not move a number on correct bytes. The expected count is
    // derived here by an expression written separately from the parser's own loop — the parser is
    // not asked to confirm itself.
    const text = readFileSync(join(REPO_ROOT, REGISTRY_PATH), "utf8");
    const lines = text.split("\n");
    const flags = fencedLineFlags(text);
    const expected = lines.filter((l, i) => !flags[i] && /^###\s+\S+\s*$/.test(l)).length;
    expect(expected, "the live registry must carry claim blocks at all").toBeGreaterThan(0);
    expect(readRegistry(REPO_ROOT).claims.length).toBe(expected);
  });
});

// ---------------------------------------------------------------------------------------------
// (Plan 29-28, 29-REVIEW § WR-02) ONE FENCE RECOGNISER IN THE MODULE THAT CARRIED TWO.
//
// `tableUnder` decided "is this line fenced" through `fencedLineFlags` and `FENCE_DELIMITER_LINE`.
// Thirty lines further down in the SAME module, `parseClaimBlock` decided the same question with a
// private `trim()` equality. They disagreed on two axes, and the disagreement was live on correct
// bytes in both directions:
//
//   axis                                    | shared class   | the deleted private equality
//   ----------------------------------------|----------------|------------------------------
//   a delimiter carrying an INFO STRING      | IS a delimiter | is NOT — the block was refused
//   a delimiter INDENTED three spaces        | is NOT         | IS — a false delimiter accepted
//
// Both directions are asserted for each axis. A one-sided case is how this phase's last three
// half-fixes survived a whole gap-closure round.
// ---------------------------------------------------------------------------------------------
describe("audit-model: parseClaimBlock answers the fence question ONCE (plan 29-28, WR-02)", () => {
  /** A claim block whose fence delimiters are spelled by the caller. */
  function blockWithDelimiters(open: string, close: string, text = "A claim sentence."): string {
    return [
      "# Phase 28 Claim Registry",
      "",
      "## Claims",
      "",
      "### C-28-001",
      "",
      "- file: README.md",
      "- line: 4",
      "- kind: architecture",
      "- depends_on: autonomy",
      "- status: true",
      "",
      open,
      text,
      close,
      "",
    ].join("\n");
  }

  const INFO = `${FENCE}text`;
  const INDENTED = `   ${FENCE}`;

  it("AXIS 1 — a delimiter carrying an INFO STRING opens the block, as it does for every other consumer", () => {
    // RED AGAINST THE PRE-FIX BUILD: refused "carries no fenced block" on correct bytes, because
    // `"```text".trim() !== "```"`.
    const reg = readRegistry(writeRegistryFixture(blockWithDelimiters(INFO, FENCE)));
    expect(reg.claims.map((c) => c.id)).toEqual(["C-28-001"]);
    expect(reg.claims[0].verbatim).toBe("A claim sentence.");
    // AND THE TWO ANSWERS CONVERGE, asserted rather than assumed: the shared class agrees this line
    // is a delimiter, which is the whole point of deleting the second opinion.
    expect(FENCE_DELIMITER_LINE.test(INFO)).toBe(true);
  });

  it("AXIS 1, the other side — a plain column-zero delimiter still opens the block", () => {
    // Without this half, a recogniser that accepted EVERY line would satisfy the case above.
    const reg = readRegistry(writeRegistryFixture(blockWithDelimiters(FENCE, FENCE)));
    expect(reg.claims[0].verbatim).toBe("A claim sentence.");
  });

  it("AXIS 2 — a THREE-SPACE-INDENTED delimiter is not a delimiter here either, matching the rest of the tree", () => {
    // RED AGAINST THE PRE-FIX BUILD: `"   ```".trim() === "```"`, so this parser accepted a
    // delimiter that `fencedLineFlags` — in the same module, thirty lines up — says is not one.
    // The refusal is by NAME; the block genuinely carries no fenced block under the shared class.
    expect(() => readRegistry(writeRegistryFixture(blockWithDelimiters(INDENTED, INDENTED)))).toThrow(
      /carries no fenced block/,
    );
    expect(FENCE_DELIMITER_LINE.test(INDENTED)).toBe(false);
  });

  it("AXIS 2, the other side — the SAME delimiters de-indented parse, so the refusal is about the indent", () => {
    // A refusal that fired for some other reason would prove nothing about the indentation axis.
    const reg = readRegistry(
      writeRegistryFixture(blockWithDelimiters(INDENTED.trim(), INDENTED.trim())),
    );
    expect(reg.claims[0].verbatim).toBe("A claim sentence.");
  });

  it("the two answers AGREE on every axis, derived rather than tabulated by hand", () => {
    // The disagreement was a PROPERTY of two expressions, so it is closed by comparing the two
    // expressions — not by listing outcomes. The deleted equality is reconstructed here as the ONLY
    // place it still exists, and swept against the shared class over spellings that include both
    // recorded disagreement axes.
    const deletedPrivateEquality = (l: string): boolean => l.trim() === FENCE;
    const spellings = [
      FENCE,
      INFO,
      INDENTED,
      `${FENCE}   `,
      ` ${FENCE}`,
      `${FENCE}${FENCE.slice(0, 1)}`,
      "not a fence",
      "",
      `text${FENCE}`,
    ];
    const disagreements = spellings.filter(
      (s) => FENCE_DELIMITER_LINE.test(s) !== deletedPrivateEquality(s),
    );
    // NON-VACUITY: the sweep must really have contained the disagreement, or "the module now agrees
    // with itself" would be a claim over an empty set.
    expect(
      disagreements.length,
      "the sweep must reproduce the recorded disagreement, or it proves nothing",
    ).toBeGreaterThan(0);
    expect(disagreements).toContain(INFO);
    expect(disagreements).toContain(INDENTED);
    // And the SHIPPED parser follows the shared class on each of them — proven by parse outcome,
    // not by re-testing the regex.
    for (const s of spellings) {
      const doc = blockWithDelimiters(s, s);
      const parses = ((): boolean => {
        try {
          readRegistry(writeRegistryFixture(doc));
          return true;
        } catch {
          return false;
        }
      })();
      // A line that is a delimiter under the shared class opens AND closes the block, so the block
      // parses; a line that is not leaves the block with no fenced block at all.
      expect(parses, `delimiter spelling ${JSON.stringify(s)}`).toBe(
        FENCE_DELIMITER_LINE.test(s),
      );
    }
  });

  it("the LIVE registry verbatim texts equal an INDEPENDENTLY derived extraction, byte for byte", () => {
    // The extraction feeds the byte-exact D-16 verbatim-at-anchor comparison, so a silent change
    // to it is the failure the claim-anchor gate exists to catch. A hardcoded digest would catch
    // that drift — and would ALSO red the day a claim is legitimately added, which makes it a
    // false-red generator rather than a pin. What is asserted instead is an equality against a
    // SECOND extraction, written here from the same two authorities the parser composes: it stays
    // true as the registry grows, and still reds the moment the parser stops agreeing with the
    // shared delimiter class. The pre/post digest equality this plan requires is a ONE-OFF
    // measurement over one commit pair, and lives in the SUMMARY where a one-off measurement
    // belongs.
    const text = readFileSync(join(REPO_ROOT, REGISTRY_PATH), "utf8");
    const lines = text.split("\n");
    const starts = unfencedMatchIndices(text, /^###\s+(\S+)\s*$/);
    expect(starts.length, "the live registry must carry claim blocks at all").toBeGreaterThan(0);
    const derived: string[] = [];
    for (let n = 0; n < starts.length; n++) {
      const from = starts[n];
      const to = n + 1 < starts.length ? starts[n + 1] : lines.length;
      const delims: number[] = [];
      for (let i = from + 1; i < to; i++) {
        if (FENCE_DELIMITER_LINE.test(lines[i])) delims.push(i);
        if (delims.length === 2) break;
      }
      expect(delims, `claim block at line ${from + 1} must carry a delimiter pair`).toHaveLength(2);
      derived.push(lines.slice(delims[0] + 1, delims[1]).join("\n"));
    }
    expect(readRegistry(REPO_ROOT).claims.map((c) => c.verbatim)).toEqual(derived);
    // NON-VACUITY: an all-empty extraction compares equal to an all-empty derivation.
    expect(derived.length).toBe(starts.length);
    expect(derived.every((v) => v.length > 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// (Plan 29-28) THE HAZARD THE FENCE-AWARE FIX OPENS, CLOSED IN THE SAME PLAN THAT OPENS IT.
//
// `fencedLineFlags` leaves its toggle SET at EOF on an unterminated fence. For a prose scanner that
// is a fail-safe; for a fence-AWARE claim-heading scan it inverts, because every claim heading
// below an unclosed delimiter disappears and the claim list SILENTLY SHORTENS. Reproduced against
// the post-CR-02 / pre-refusal build: deleting one closing delimiter from the twentieth block of
// the live registry took the claim count 42 -> 20 and `safetySurfaceUnion` 41 -> 39, with
// check-audit-register, check-claim-anchors and generate-safety-surface all exiting 0.
//
// That is LANG-06's CR-01 fail-open shape, reached through the same mechanism, and it must not ship
// unclosed in the plan that creates it.
// ---------------------------------------------------------------------------------------------
describe("audit-model: an unterminated fence cannot silently shorten the claim list (plan 29-28)", () => {
  function registryWithBlocks(n: number, mutate?: (lines: string[]) => string[]): string {
    const out: string[] = ["# Phase 28 Claim Registry", "", "## Claims", ""];
    for (let i = 1; i <= n; i++) {
      out.push(
        `### C-28-${String(i).padStart(3, "0")}`,
        "",
        "- file: README.md",
        "- line: 4",
        "- kind: architecture",
        "- depends_on: autonomy",
        "- status: true",
        "",
        FENCE,
        `Claim number ${i}.`,
        FENCE,
        "",
      );
    }
    return (mutate ? mutate(out) : out).join("\n");
  }

  it("an EVEN delimiter count parses normally — the direction a one-sided assertion would miss", () => {
    const body = registryWithBlocks(3);
    // PREMISE, asserted rather than assumed: the fixture really is even.
    const delims = body.split("\n").filter((l) => FENCE_DELIMITER_LINE.test(l)).length;
    expect(delims % 2, "the control fixture must carry an EVEN delimiter count").toBe(0);
    expect(readRegistry(writeRegistryFixture(body)).claims).toHaveLength(3);
  });

  it("an ODD delimiter count is a NAMED refusal, and it names the last delimiter's line number", () => {
    // One closing delimiter deleted from the SECOND of three blocks — partway through, so the
    // pre-refusal behaviour is a SHORT list rather than an empty one.
    let removedAt = -1;
    const body = registryWithBlocks(3, (lines) => {
      const delims: number[] = [];
      lines.forEach((l, i) => {
        if (FENCE_DELIMITER_LINE.test(l)) delims.push(i);
      });
      removedAt = delims[3]; // the SECOND block's closing delimiter
      return lines.filter((_, i) => i !== removedAt);
    });
    const all = body.split("\n");
    const delims = all.map((l, i) => (FENCE_DELIMITER_LINE.test(l) ? i : -1)).filter((i) => i >= 0);
    // PREMISE: the mutation really produced an odd count, and a genuinely SHORTER unfenced scan.
    expect(delims.length % 2, "the mutated fixture must carry an ODD delimiter count").toBe(1);
    expect(
      unfencedMatchIndices(body, /^###\s+(\S+)\s*$/).length,
      "the mutation must really hide claim headings, or there is no hazard to refuse",
    ).toBeLessThan(3);

    let msg = "";
    try {
      readRegistry(writeRegistryFixture(body));
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/ODD number/);
    // The line number of the LAST delimiter, so the author can find the unclosed one.
    expect(msg).toContain(`line ${delims[delims.length - 1] + 1}`);
    // And the refusal says what the CONSEQUENCE is, because "unterminated fence" alone reads like a
    // formatting nit rather than a safety-list narrowing.
    expect(msg).toMatch(/SHORTER CLAIM LIST/);
    expect(msg).toMatch(/exclusion list/);
  });

  it("the refusal fires INSTEAD of a short parse — the same bytes, both outcomes named", () => {
    // The discrimination, made explicit: under a fence-aware scan with no refusal the mutated
    // document yields FEWER blocks than the well-formed one. The refusal is what stops that number
    // from being returned as if it were the answer.
    const good = registryWithBlocks(3);
    const bad = registryWithBlocks(3, (lines) => {
      const delims: number[] = [];
      lines.forEach((l, i) => {
        if (FENCE_DELIMITER_LINE.test(l)) delims.push(i);
      });
      return lines.filter((_, i) => i !== delims[3]);
    });
    const RE = /^###\s+(\S+)\s*$/;
    expect(unfencedMatchIndices(good, RE)).toHaveLength(3);
    expect(unfencedMatchIndices(bad, RE).length).toBeLessThan(3);
    expect(readRegistry(writeRegistryFixture(good)).claims).toHaveLength(3);
    expect(() => readRegistry(writeRegistryFixture(bad))).toThrow(/ODD number/);
  });

  // ── THE PUBLISHED DENOMINATOR, PINNED TWO-SIDED OVER THE LIVE REGISTRY. ───────────────────────
  it("the LIVE registry's excluded-heading tally is pinned against a count derived here", () => {
    // Re-derived in this session, never transcribed from the plan: the plan said round 3 measured
    // 42 shaped lines and 0 fenced, and a transcribed number is a number nobody checked.
    const text = readFileSync(join(REPO_ROOT, REGISTRY_PATH), "utf8");
    const lines = text.split("\n");
    const flags = fencedLineFlags(text);
    const SHAPE = /^###\s+(\S+)\s*$/;
    const shaped = lines.filter((l) => SHAPE.test(l)).length;
    const fenced = lines.filter((l, i) => flags[i] && SHAPE.test(l)).length;

    const reg = readRegistry(REPO_ROOT);
    expect(reg.headingShapedLines).toBe(shaped);
    expect(reg.headingShapedFenced).toBe(fenced);
    // NON-VACUITY: a registry with no claim-shaped lines would satisfy every equality above.
    expect(shaped, "the live registry must carry claim-heading-shaped lines").toBeGreaterThan(0);
    // THE PIN THAT MOVES THE DAY A CLAIM HEADING IS FIRST WRITTEN INSIDE AN EXAMPLE. Today it is 0;
    // if it ever becomes non-zero the exclusion list is being fed by a fence-aware filter over
    // documentation, and that is a decision someone must make deliberately rather than discover.
    expect(fenced).toBe(0);
    // And the projection really is the difference of the two published tallies.
    expect(reg.claims.length).toBe(shaped - fenced);
  });

  it("THE TALLY PIN IS PROVEN ABLE TO FAIL: a planted fenced claim heading moves it, and the plant is named", () => {
    // The falsifiability probe. Same rule, one planted member: a claim heading written inside a
    // fenced example in a MIRROR of the live registry. If the tally could not move, the pin above
    // would be decoration.
    const live = readFileSync(join(REPO_ROOT, REGISTRY_PATH), "utf8");
    const planted = `${live}\n## An illustration\n\n${FENCE}\n### C-28-999\n- file: PHANTOM.md\n${FENCE}\n`;
    const dir = writeRegistryFixture(planted);

    const SHAPE = /^###\s+(\S+)\s*$/;
    const flags = fencedLineFlags(planted);
    const plantedLines = planted.split("\n");
    const shaped = plantedLines.filter((l) => SHAPE.test(l)).length;
    const fenced = plantedLines.filter((l, i) => flags[i] && SHAPE.test(l)).length;
    // THE PLANT ADDED EXACTLY ONE FENCED SHAPED LINE — asserted, so a plant that landed outside the
    // fence (or twice) fails loudly instead of proving the wrong thing.
    const liveFlags = fencedLineFlags(live);
    const liveLines = live.split("\n");
    const liveFenced = liveLines.filter((l, i) => liveFlags[i] && SHAPE.test(l)).length;
    expect(fenced, "the plant must add exactly one FENCED claim-heading-shaped line").toBe(
      liveFenced + 1,
    );

    const reg = readRegistry(dir);
    expect(reg.headingShapedFenced).toBe(fenced);
    // The pin from the case above, run over the planted mirror, MUST now fail — and the failure
    // reports the moved count rather than a bare inequality.
    let failure = "";
    try {
      expect(reg.headingShapedFenced).toBe(liveFenced);
    } catch (e) {
      failure = (e as Error).message;
    }
    expect(failure, "the tally pin did not move on a planted fenced heading").not.toBe("");
    expect(failure).toContain(String(fenced));
    // And the planted phantom reached NO claim row — the two halves of this plan agreeing.
    expect(reg.claims.map((c) => c.file)).not.toContain("PHANTOM.md");
    expect(reg.claims.length).toBe(shaped - fenced);
  });
});

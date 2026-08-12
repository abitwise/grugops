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

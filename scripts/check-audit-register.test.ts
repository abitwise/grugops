// check-audit-register.test.ts — the hermetic harness for the D-05 completeness gate.
//
// THE ONE PROPERTY THIS FILE EXISTS TO BUY. The gate is RED against the register committed in plan
// 28-03, and a RED verdict proves nothing by itself: a gate that always fails is trivially red.
// These cases turn that verdict into a MEASUREMENT — the same committed .js exits 0 against a
// FILLED register on a clean mirror, and exits 1 on each planted shape, naming what it found.
// The clean-mirror case was written and confirmed green FIRST, which is what makes the RED
// transcript in the plan summary a statement about the register rather than about the gate.
//
// THE ADJACENCY PAIR IS THE POINT. Equality one filters on `counted: yes` before counting. A filter
// that is merely PRESENT is not a filter that is load-bearing, so both directions are exercised: a
// second uncounted row must keep equality one green at 36, and flipping the protocol row to
// `counted: yes` must turn it red at 37. Either case alone would leave the other direction asserted
// rather than demonstrated.
//
// Every behavioural case drives the COMMITTED .js via spawnSync against a hermetic CHECK_ROOT
// mirror under the OS temp dir — never the .ts, and never the real tree.
//
// NOT in the e2e lane. Run with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/check-audit-register.test.ts
// Vitest globals:false -> import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROLE_COUNT, WORKFLOW_COUNT, listRoles, listWorkflows } from "./kit-model.js";
import { REGISTER_PATH, REGISTRY_PATH, readRegister } from "./audit-model.js";
import { PROTOCOL_FILE } from "./audit-prepass.js";
import {
  renderSafetySurface,
  safetySurfaceUnion,
  OUT as SAFETY_SURFACE_PATH,
} from "./generate-safety-surface.js";

/** A minimal parseable registry with one `kind: safety` row, so the D-18 union is never empty. */
const MIRROR_REGISTRY = [
  "# Registry",
  "",
  "### C-28-001",
  "",
  "- file: README.md",
  "- line: 4",
  "- kind: safety",
  "- depends_on: autonomy",
  "- status: true",
  "- mechanism: measured against the live config value.",
  "",
  "```",
  "A sentence.",
  "```",
  "",
].join("\n");

const REPO_ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(REPO_ROOT, "scripts", "check-audit-register.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

const SUBSTANTIVE = "Read in full against all six rubric categories; no finding.";

interface RowSpec {
  file: string;
  kind: string;
  counted: string;
  safety: string;
  findings: string;
  observation: string;
}

// THE DEFAULT ROWS CARRY `safety_surface: yes` ON EVERY COUNTED ROW, AS THE LIVE REGISTER DOES.
//
// They carried `no` until plan 29-21, which made the mirror a shape the shipped artifact is not:
// all 36 counted rows in `docs/audit/28-disposition-register.md` are flagged `yes`, and the derived
// exclusion list says why in its own words — every audited kit file carries permission-bearing or
// no-fabrication text, so the register arm flags all of them. A mirror flagging none could not
// express the CR-01 defect at all, because there was no `yes` left to flip.
function defaultRows(): RowSpec[] {
  const rows: RowSpec[] = [];
  for (let i = 1; i <= ROLE_COUNT; i++) {
    rows.push({
      file: `agent-factory/roles/role-${String(i).padStart(2, "0")}.md`,
      kind: "role",
      counted: "yes",
      safety: "yes",
      findings: "0",
      observation: SUBSTANTIVE,
    });
  }
  for (let i = 0; i < WORKFLOW_COUNT; i++) {
    rows.push({
      file: `agent-factory/workflows/${String(i).padStart(2, "0")}-flow.md`,
      kind: "workflow",
      counted: "yes",
      safety: "yes",
      findings: "0",
      observation: SUBSTANTIVE,
    });
  }
  rows.push({
    file: PROTOCOL_FILE,
    kind: "protocol",
    counted: "no",
    safety: "no",
    findings: "0",
    observation: "Out-of-set by derivation; read once for the drift check.",
  });
  return rows;
}

function renderRegister(rows: readonly RowSpec[], findingRows: readonly string[]): string {
  return [
    "# Register",
    "",
    "## Table A — audited files",
    "",
    "| file | kind | counted | safety_surface | findings | observation |",
    "|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.file} | ${r.kind} | ${r.counted} | ${r.safety} | ${r.findings} | ${r.observation} |`,
    ),
    "",
    "## Table B — findings",
    "",
    "| finding_id | file | category | disposition | target_phase | reason |",
    "|---|---|---|---|---|---|",
    ...findingRows,
    "",
  ].join("\n");
}

/** A mirror carrying the kit SHAPE the listers derive from, plus a register. */
function buildMirror(
  rows: readonly RowSpec[] = defaultRows(),
  findingRows: readonly string[] = [],
  registerText?: string,
): string {
  const dir = freshTmp("grugops-audit-register-");
  mkdirSync(join(dir, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(dir, "agent-factory", "workflows"), { recursive: true });
  mkdirSync(join(dir, "docs", "audit"), { recursive: true });
  for (let i = 1; i <= ROLE_COUNT; i++) {
    writeFileSync(join(dir, "agent-factory", "roles", `role-${String(i).padStart(2, "0")}.md`), "x");
  }
  for (let i = 0; i < WORKFLOW_COUNT; i++) {
    writeFileSync(
      join(dir, "agent-factory", "workflows", `${String(i).padStart(2, "0")}-flow.md`),
      "x",
    );
  }
  writeFileSync(join(dir, PROTOCOL_FILE), "x");
  writeFileSync(
    join(dir, REGISTER_PATH),
    registerText ?? renderRegister(rows, findingRows),
    "utf8",
  );
  // The gate also folds the D-18 exclusion-list freshness guard (plan 28-07), which derives from
  // this register AND the claim registry. A mirror therefore needs both, plus a list generated FROM
  // this mirror, or the guard fails closed — which is the correct behaviour and would otherwise red
  // every case here for a reason none of them is about. The registry carries one `kind: safety` row
  // so the union is non-empty even when every register row is `safety_surface: no`.
  writeFileSync(join(dir, REGISTRY_PATH), MIRROR_REGISTRY, "utf8");
  try {
    writeFileSync(join(dir, SAFETY_SURFACE_PATH), renderSafetySurface(dir), "utf8");
  } catch {
    // A deliberately malformed register cannot be regenerated from. Those cases assert a PARSE
    // refusal, and the gate returns before the freshness guard runs, so the placeholder is never
    // compared. Writing something rather than nothing keeps the mirror shape uniform.
    writeFileSync(join(dir, SAFETY_SURFACE_PATH), "unreachable\n", "utf8");
  }
  return dir;
}

function runGate(root: string): { status: number | null; out: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: root },
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe("check-audit-register: the green baseline", () => {
  it("exits 0 against a FILLED register on a clean mirror", () => {
    // Written and confirmed green FIRST. Without it the RED transcript below would be consistent
    // with a gate that cannot pass at all.
    const r = runGate(buildMirror());
    expect(r.status).toBe(0);
    expect(r.out).toContain("ALL CHECKS PASSED");
  });

  it("the PASS line names every count it actually read", () => {
    const r = runGate(buildMirror());
    expect(r.out).toContain(String(ROLE_COUNT));
    expect(r.out).toContain(String(WORKFLOW_COUNT));
    expect(r.out).toMatch(/36/); // counted register rows
    expect(r.out).toMatch(/uncounted/i); // the uncounted row is named, never invisible
    expect(r.out).toContain(PROTOCOL_FILE);
  });

  it("produces BYTE-IDENTICAL output on two runs over one fixture", () => {
    const dir = buildMirror();
    expect(runGate(dir).out).toBe(runGate(dir).out);
  });
});

describe("check-audit-register: equality one — SET equality, both directions", () => {
  it("fails naming BOTH a missing list and an unexpected list", () => {
    const rows = defaultRows();
    // Displace a real member with a decoy: the COUNT is unchanged, so only set equality catches it.
    rows[0] = { ...rows[0], file: "agent-factory/roles/decoy.md" };
    const r = runGate(buildMirror(rows));
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/missing \[/);
    expect(r.out).toMatch(/unexpected \[/);
    expect(r.out).toContain("agent-factory/roles/decoy.md");
    expect(r.out).toContain("agent-factory/roles/role-01.md");
  });

  it("fails when a derived file has no row at all", () => {
    const rows = defaultRows().filter((r) => r.file !== "agent-factory/roles/role-05.md");
    const r = runGate(buildMirror(rows));
    expect(r.status).toBe(1);
    expect(r.out).toContain("agent-factory/roles/role-05.md");
  });

  it("reports the missing and unexpected members in DERIVED SORTED order", () => {
    const rows = defaultRows().filter(
      (r) =>
        r.file !== "agent-factory/roles/role-05.md" &&
        r.file !== "agent-factory/roles/role-02.md",
    );
    const r = runGate(buildMirror(rows));
    const m = /missing \[([^\]]*)\]/.exec(r.out);
    expect(m).not.toBeNull();
    expect((m as RegExpExecArray)[1]).toBe(
      "agent-factory/roles/role-02.md, agent-factory/roles/role-05.md",
    );
  });
});

describe("check-audit-register: the ADJACENCY pair — the counted filter is load-bearing", () => {
  it("a SECOND uncounted row leaves equality one GREEN at 36 and trips the UNCOUNTED pin instead", () => {
    // THE CASE'S POINT IS UNCHANGED AND ITS ASSERTION IS INVERTED (28-REVIEW WR-12). It exists to
    // demonstrate that equality one FILTERS on `counted: yes` — a second uncounted row must not move
    // the 36. It used to prove that by asserting the whole gate stayed green, which also proved that
    // an uncounted row was constrained by NOTHING, while feeding the D-18 exclusion list through
    // safetySurfaceUnion(). The arm is now pinned, so the run reds — and the demonstration is
    // sharper, not weaker: equality one is asserted to have stayed silent while the pin fired.
    const rows = defaultRows();
    rows.push({
      file: "agent-factory/roles/_another-protocol.md",
      kind: "protocol",
      counted: "no",
      safety: "no",
      findings: "0",
      observation: "A second out-of-set file, recorded rather than dropped.",
    });
    const dir = buildMirror(rows);
    writeFileSync(join(dir, "agent-factory/roles/_another-protocol.md"), "x");
    const r = runGate(dir);
    expect(r.status).toBe(1);
    // EQUALITY ONE STAYED GREEN — the counted filter is load-bearing, which is what this case is for.
    expect(r.out).not.toMatch(/equality one:/);
    // The UNCOUNTED pin is what fired, and it names both the found set and the expected one.
    expect(r.out).toMatch(/uncounted rows are \[/);
    expect(r.out).toContain("_another-protocol.md");
    expect(r.out).toContain(PROTOCOL_FILE);
  });

  // ── 28-REVIEW WR-12: a register row naming a file that is not on disk. ───────────────────────────
  it("fails an UNCOUNTED row naming a file that does not exist, which nothing else constrains", () => {
    // The uncounted arm is invisible to equality one, so without this check a row about a file that
    // was never there recorded a read that could not have happened — and its `safety_surface` flag
    // still entered the D-18 exclusion list.
    const rows = defaultRows().map((r) =>
      r.file === PROTOCOL_FILE ? { ...r, file: "agent-factory/roles/_never-existed.md" } : r,
    );
    const r = runGate(buildMirror(rows));
    expect(r.status).toBe(1);
    expect(r.out).toContain("_never-existed.md");
    expect(r.out).toMatch(/not on disk/);
    // Distinguishable from equality one in the same run — the two must not be read as one failure.
    expect(r.out).not.toMatch(/equality one:/);
  });

  it("flipping the protocol row to counted: yes turns equality one RED at 37 against 36", () => {
    const rows = defaultRows().map((r) =>
      r.file === PROTOCOL_FILE ? { ...r, counted: "yes" } : r,
    );
    const r = runGate(buildMirror(rows));
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/37/);
    expect(r.out).toMatch(/36/);
    expect(r.out).toContain(PROTOCOL_FILE);
  });
});

describe("check-audit-register: equality two — independent, at two granularities", () => {
  it("fails when the declared findings sum disagrees with the finding row count", () => {
    const rows = defaultRows();
    rows[0] = { ...rows[0], findings: "2" };
    const r = runGate(
      buildMirror(rows, [
        "| F-28-001 | agent-factory/roles/role-01.md | 1 | fixed | — | — |",
      ]),
    );
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/2/);
    expect(r.out).toMatch(/1/);
  });

  it("fails PER FILE when a row's declared count disagrees with its own finding rows", () => {
    // The totals can agree while two individual files are each wrong in opposite directions. The
    // per-file granularity is what catches that, and it is why one conflated tally is refused.
    const rows = defaultRows();
    rows[0] = { ...rows[0], findings: "2" };
    rows[1] = { ...rows[1], findings: "0" };
    const r = runGate(
      buildMirror(rows, [
        "| F-28-001 | agent-factory/roles/role-01.md | 1 | fixed | — | — |",
        "| F-28-002 | agent-factory/roles/role-02.md | 1 | fixed | — | — |",
      ]),
    );
    expect(r.status).toBe(1);
    expect(r.out).toContain("agent-factory/roles/role-01.md");
    expect(r.out).toContain("agent-factory/roles/role-02.md");
  });

  it("reports the two equalities INDEPENDENTLY, never as one tally", () => {
    const rows = defaultRows();
    rows[0] = { ...rows[0], file: "agent-factory/roles/decoy.md", findings: "3" };
    const r = runGate(buildMirror(rows));
    expect(r.status).toBe(1);
    // Both failures present in one run: neither absorbed the other.
    expect(r.out).toMatch(/equality one/i);
    expect(r.out).toMatch(/equality two/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// EQUALITY THREE — the flagged rows ARE the derived kit (round-2 CR-01).
//
// Equality one pins the counted ROW SET. Nothing pinned this column's VALUES, and this column is
// the larger arm of the D-18 union that becomes `guard_diff_disposition`'s entire watched corpus.
// The round-2 review reproduced the consequence end to end on the live tree: reword a frozen
// `## Hard limits` sentence, flip ONE cell here from `yes` to `no`, regenerate, and all four gates
// exit 0 together. The register lives under `docs/` and is not itself watched, so the edit that
// performs the narrowing owes no disposition row.
// ─────────────────────────────────────────────────────────────────────────────────────────────
describe("check-audit-register: equality three — the flagged rows are the derived kit (CR-01)", () => {
  const FLIP_TARGET = "agent-factory/roles/role-07.md";

  it("REDs ONE `safety_surface` cell flipped yes → no, naming the file", () => {
    const controlRows = defaultRows();
    const flippedRows = controlRows.map((r) =>
      r.file === FLIP_TARGET ? { ...r, safety: "no" } : r,
    );

    // ── PREMISE 1 — exactly one cell moved, and it moved on a COUNTED row naming a derived file.
    const moved = flippedRows.filter((r, i) => r.safety !== controlRows[i].safety);
    expect(moved.map((r) => r.file)).toEqual([FLIP_TARGET]);
    expect(moved[0].counted).toBe("yes");

    const controlDir = buildMirror(controlRows);
    const flippedDir = buildMirror(flippedRows);

    // ── PREMISE 2 — the regenerated union really is one markdown entry shorter, short by that
    //    member. Measured through the ONE derivation, not through the row spec that produced it.
    const md = (root: string): string[] =>
      safetySurfaceUnion(root)
        .map((e) => e.file)
        .filter((f) => f.endsWith(".md"))
        .sort();
    expect(md(controlDir)).toContain(FLIP_TARGET);
    expect(md(flippedDir)).not.toContain(FLIP_TARGET);
    expect(md(flippedDir).length).toBe(md(controlDir).length - 1);

    // ── PREMISE 3 — the CONTROL mirror is green, so the RED below is about the flip.
    expect(runGate(controlDir).status).toBe(0);

    const r = runGate(flippedDir);
    expect(r.status).toBe(1);
    expect(r.out).toContain(FLIP_TARGET);
    expect(r.out).toMatch(/derived but NOT flagged/);
    // The asymmetry that makes the hole invisible is in the message a person reads, not only in a
    // comment: the register is not itself a member of the corpus it derives.
    expect(r.out).toMatch(/NOT itself a member of the corpus it derives/);
    // Equality one stayed SILENT — the row set is untouched, so this is a second, independent
    // question about the same column and neither number absorbs the other's drift.
    expect(r.out).not.toMatch(/equality one:/);
  });

  it("REDs the OTHER direction — a flagged counted row naming a file the listers do not derive", () => {
    // Direction two cannot be isolated from equality one by construction: a counted row that names
    // a file outside the derived kit is, itself, an equality-one failure. The property this case
    // buys is that equality three still names the member IN THE SAME RUN rather than letting
    // equality one's report absorb it.
    //
    // The stray path is `_`-PREFIXED on purpose: listRoles drops those, so the file can exist on
    // disk (satisfying the missing-on-disk arm, which would otherwise be the failure this case
    // reported) while remaining outside the derived set. A plain `stray.md` in `roles/` would be
    // DERIVED, and the case would have measured the opposite of what it claims.
    const STRAY = "agent-factory/roles/_stray.md";
    const rows = defaultRows().map((r) =>
      r.file === FLIP_TARGET ? { ...r, file: STRAY } : r,
    );
    const dir = buildMirror(rows);
    writeFileSync(join(dir, STRAY), "x");
    expect(listRoles(dir).map((f) => `agent-factory/roles/${f}`)).not.toContain(STRAY);
    const r = runGate(dir);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/flagged but NOT derived/);
    expect(r.out).toContain(STRAY);
    // Both reported, neither absorbed.
    expect(r.out).toMatch(/equality one:/);
    expect(r.out).toMatch(/derived but NOT flagged/);
  });

  it("the PASS line states equality three with the numbers the run measured", () => {
    const r = runGate(buildMirror());
    expect(r.status).toBe(0);
    expect(r.out).toMatch(/equality three holds/);
    expect(r.out).toContain(String(ROLE_COUNT + WORKFLOW_COUNT));
  });

  it("the LIVE committed register satisfies equality three", () => {
    // The gate's own arithmetic, re-derived here by a different path: every counted row in the
    // shipped register is flagged, and the flagged set is exactly the live listers' output.
    const flagged = readRegister()
      .rows.filter((r) => r.counted && r.safetySurface === "yes")
      .map((r) => r.file)
      .sort();
    const derived = [
      ...listRoles().map((f) => `agent-factory/roles/${f}`),
      ...listWorkflows().map((f) => `agent-factory/workflows/${f}`),
    ].sort();
    expect(flagged).toEqual(derived);
    expect(flagged.length).toBe(ROLE_COUNT + WORKFLOW_COUNT);
  });
});

describe("check-audit-register: the substantive-observation requirement", () => {
  it("fails a BLANK observation, naming the file", () => {
    const rows = defaultRows();
    rows[3] = { ...rows[3], observation: "" };
    const r = runGate(buildMirror(rows));
    expect(r.status).toBe(1);
    expect(r.out).toContain(rows[3].file);
    expect(r.out).toMatch(/blank|empty/i);
  });

  it("fails a BARE-WORD observation standing in for one", () => {
    for (const bare of ["clean", "Clean.", "none", "n/a", "no findings", "OK", "?", "TBD"]) {
      const rows = defaultRows();
      rows[3] = { ...rows[3], observation: bare };
      const r = runGate(buildMirror(rows));
      expect(r.status).toBe(1);
      expect(r.out).toMatch(/observation/i);
    }
  });

  // ── 28-REVIEW CR-04: the register's OWN placeholder glyph is a blank observation. ────────────────
  //
  // RED AGAINST THE PRE-FIX BUILD. `normalizeObservation` trimmed, lowercased and stripped trailing
  // `[.!;,]`, and nothing else — so `normalizeObservation("—")` returned `"—"`, which was neither
  // blank nor a member of BARE_OBSERVATIONS, and a register of em dashes satisfied D-06. The glyph
  // matters because it is this register's OWN unfilled marker for `safety_surface`: it is the
  // character an author is likeliest to type into an unread row, and the D-18 arm sixteen lines away
  // already caught it in the other column. The gate now asks audit-model.isBlank, the one
  // element-level authority.
  it("fails a PLACEHOLDER-GLYPH observation, naming the file (the register's own unfilled marker)", () => {
    for (const glyph of ["—", "–", "-"]) {
      const rows = defaultRows();
      rows[3] = { ...rows[3], observation: glyph };
      const r = runGate(buildMirror(rows));
      expect(r.status, glyph).toBe(1);
      expect(r.out, glyph).toContain(rows[3].file);
      expect(r.out, glyph).toMatch(/BLANK observation/);
    }
  });

  it("accepts a substantive observation that happens to CONTAIN a bare word", () => {
    // The check must not become a word ban: "the file is clean of retired vocabulary, but ..." is a
    // real observation. Banning the token would make correct text unsayable.
    const rows = defaultRows();
    rows[3] = {
      ...rows[3],
      observation:
        "Clean of retired vocabulary; the tier table at line 40 still predates the tier names.",
    };
    expect(runGate(buildMirror(rows)).status).toBe(0);
  });
});

describe("check-audit-register: the unfilled safety_surface marker", () => {
  it("fails while any row still carries the unfilled marker, naming the file", () => {
    const rows = defaultRows();
    rows[2] = { ...rows[2], safety: "—" };
    const r = runGate(buildMirror(rows));
    expect(r.status).toBe(1);
    expect(r.out).toContain(rows[2].file);
    expect(r.out).toMatch(/safety_surface/);
  });
});

describe("check-audit-register: it REPORTS a parse refusal rather than crashing", () => {
  it("names the parse refusal and exits 1 on a malformed register", () => {
    // audit-model is a LIBRARY and throws; this is a GATE and must report. A stack trace is not a
    // gate verdict, and a gate that dies is not a gate that failed.
    //
    // THE MALFORMATION IS DERIVED FROM THE RENDERED ROW, NEVER TYPED. It used to be a hard-coded
    // literal spelling every cell of row one — `| ... | role | yes | no | 0 |` — and plan 29-21's
    // change of the default `safety_surface` from `no` to `yes` made that literal stop matching.
    // The replace became a no-op, the register parsed cleanly, and the case went green while
    // asserting a parse refusal that never happened. That is the harness-premise failure this
    // project has now recorded seven times; it is fixed by truncating the row the renderer
    // actually produced.
    const rows = defaultRows();
    const rendered = renderRegister(rows, []);
    const victim = rendered
      .split("\n")
      .find((l) => l.startsWith(`| ${rows[0].file} |`));
    expect(victim, "the row the malformation targets must exist in the rendered register").toBeDefined();
    const truncated = `${(victim as string).split("|").slice(0, 4).join("|")}|`;
    expect(truncated).not.toBe(victim); // the malformation is real, not a no-op
    const text = rendered.replace(victim as string, truncated);
    expect(text).not.toBe(rendered);
    const r = runGate(buildMirror(rows, [], text));
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/refus/i);
    expect(r.out).not.toMatch(/at Object\.|node:internal/);
  });

  it("names a missing register rather than reporting a vacuous pass", () => {
    const dir = buildMirror();
    rmSync(join(dir, REGISTER_PATH));
    const r = runGate(dir);
    expect(r.status).toBe(1);
    expect(r.out).toContain(REGISTER_PATH);
  });
});

describe("check-audit-register: the committed skeleton is RED, by design", () => {
  it("exits 0 against the real committed register, now that every row is filled", () => {
    // THE RED-TO-GREEN TRANSITION, AND WHY THIS CASE CHANGED. Plan 28-03 landed this gate RED
    // against an unfilled register (D-24's posture applied to AUDIT-01) and this case asserted that
    // red. Plans 28-06 and 28-07 filled all 37 rows, so the assertion was inverted here rather than
    // deleted: keeping a case that demands exit 1 would have made the completed register look like
    // a regression, and deleting it would have dropped the only case that runs the gate against the
    // REAL artifact instead of a mirror.
    //
    // The green is a property of the REGISTER, not of the gate. Every refusal case in this file
    // still reds on its planted shape, and each was watched doing so; this case only adds that the
    // shipped artifact is one the gate accepts.
    const r = spawnSync("node", [GATE_JS], { encoding: "utf8" });
    const out = `${r.stdout}${r.stderr}`;
    expect(r.status).toBe(0);
    expect(out).toContain("ALL CHECKS PASSED");
    // The PASS line states both equalities and the folded freshness verdict, so a green that
    // skipped one of them would not match.
    expect(out).toMatch(/equality one holds/);
    expect(out).toMatch(/equality two holds/);
    expect(out).toContain(SAFETY_SURFACE_PATH);
  });

  it("the committed register's 36 counted paths equal the LIVE listers' output", () => {
    // THIS CASE READ THE REGISTER WITH A SECOND GRAMMAR UNTIL PLAN 28-06, AND THE SECOND GRAMMAR WAS
    // WRONG. It selected counted rows by the SUBSTRING `| yes |` over the raw row text. That
    // predicate is only accidentally equivalent to "the `counted` column says yes": it holds while
    // every row's `safety_surface` is the unfilled marker `—`, and stops holding the moment a row
    // carries `safety_surface: yes`, because the substring then matches the WRONG CELL. The instant
    // 28-06 filled the protocol row (`| no | yes |`) the case reported 37 against 36 — an uncounted
    // row counted, by a text predicate, inside a file whose whole subject is a register that must
    // not be read twice by two grammars. That is this repository's named duplicate-grammar failure
    // class, committed inside the harness for the gate that exists to prevent it.
    //
    // Fixed by asking the ONE parse authority for the column instead of pattern-matching the row.
    // `readRegister()` reads columns POSITIONALLY and already refuses a `counted` value outside
    // [yes, no], so no substring can reach the wrong cell.
    //
    // AND THE CASE'S OWN COMMENT WAS FALSE TOO. It said "generated at run time from the listers and
    // compared", but the body compared nothing against any lister — it asserted two cardinalities
    // and never looked at `listRoles()` or `listWorkflows()`, so a register naming 36 wrong paths
    // passed it. It now does what it always claimed: SET equality against the live listers, both
    // directions, which is the property a count cannot buy.
    const counted = readRegister()
      .rows.filter((r) => r.counted)
      .map((r) => r.file);
    const derived = [
      ...listRoles().map((f) => `agent-factory/roles/${f}`),
      ...listWorkflows().map((f) => `agent-factory/workflows/${f}`),
    ];
    expect(counted.length).toBe(ROLE_COUNT + WORKFLOW_COUNT);
    expect(new Set(counted).size).toBe(ROLE_COUNT + WORKFLOW_COUNT);
    expect([...counted].sort()).toEqual([...derived].sort());
  });
});

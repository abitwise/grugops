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
import { REGISTER_PATH, REGISTRY_PATH, readRegister, readRegistry } from "./audit-model.js";
import { PROTOCOL_FILE } from "./audit-prepass.js";
import { publicDocsScan } from "./check-public-docs-vocabulary.js";
import {
  CLAIM_KIND_CARDINALITY,
  SAFETY_CLAIM_HOMES,
  registryArmFindings,
} from "./check-audit-register.js";
import {
  renderSafetySurface,
  safetySurfaceUnion,
  OUT as SAFETY_SURFACE_PATH,
} from "./generate-safety-surface.js";

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE MIRROR'S CLAIM REGISTRY — the REGISTRY arm of the D-18 union (plan 29-30).
//
// It carried ONE `kind: safety` row until this plan, which was enough to keep the union non-empty
// and nothing else. Equality four pins the registry arm's per-kind cardinality, so a one-row mirror
// is a shape the shipped artifact is not — the same correction plan 29-21 had to make to the
// register rows above, for the same reason: a fixture that cannot express the live distribution
// cannot express the defect either.
//
// THE DISTRIBUTION IS WRITTEN HERE AS LITERALS AND IS NEVER DERIVED FROM THE GATE'S DECLARED MAP.
// A fixture built from the baseline it is used to falsify follows that baseline everywhere it
// moves, so every perturbation probe below would plant a mutation and measure nothing. The two
// numbers are tied together instead by an explicit case ("the mirror's distribution equals the
// declared map"), which makes drift loud rather than silent.
// 28 -> 32 (plan 29-52, D-54): `C-28-043` .. `C-28-046` entered the live registry as `architecture`
// rows freezing the four unanchored claim-bearing paragraphs of check-banned-claims's one named
// exemption region. This literal is deliberately NOT derived from the gate's map — it is moved by
// hand here, and the "mirror's distribution equals the declared map" case below is what made the
// drift loud rather than silent. That case firing is this mechanism working.
const MIRROR_ARCHITECTURE_CLAIMS = 32;
const MIRROR_INSTALL_CLAIMS = 8;

/**
 * The SAFETY ARM, spelled out exactly as the live registry carries it. The gate pins this roster
 * two-sided, so a mirror that invented its own ids and homes would red for a reason no case here is
 * about — and it could not express the count-preserving REHOME the adversarial pass found either.
 */
const MIRROR_SAFETY_HOMES: readonly { claim: string; file: string }[] = [
  { claim: "C-28-001", file: "README.md" },
  { claim: "C-28-010", file: "AGENTS.md" },
  { claim: "C-28-018", file: "AGENTS.md" },
  { claim: "C-28-023", file: "agent-factory/README.md" },
  { claim: "C-28-032", file: "agent-factory/README.md" },
  { claim: "C-28-038", file: ".claude-plugin/plugin.json" },
];
const MIRROR_SAFETY_CLAIMS = MIRROR_SAFETY_HOMES.length;

/** A root markdown file, so `publicDocsScan()` vouches for it on the mirror as it does live. */
const MIRROR_ROOT_DOC = "README.md";
/**
 * The home carrying EXACTLY ONE safety claim, so flipping that one cell is the only way a file can
 * LEAVE the union. It is `README.md` on the live tree, which is why round 3's WR-06 recipe used it.
 */
const MIRROR_SOLE_DOC = "README.md";
/** The markdown documents the mirror must carry for `publicDocsScan()` to vouch for the arm. */
const MIRROR_PUBLIC_DOCS = ["README.md", "AGENTS.md", "agent-factory/README.md"];
/** The one non-markdown member: both derivations are markdown-blind, so it is declared by name. */
const MIRROR_NON_MARKDOWN = ".claude-plugin/plugin.json";

interface ClaimSpec {
  readonly id: string;
  readonly file: string;
  readonly kind: string;
}

/**
 * 42 claims in the live per-kind distribution, with the safety arm spread across all three ways a
 * member can be vouched for: a root public document, a derived kit file, and the declared
 * non-markdown member.
 */
function defaultClaims(): ClaimSpec[] {
  const out: ClaimSpec[] = [];
  for (const h of MIRROR_SAFETY_HOMES) out.push({ id: h.claim, file: h.file, kind: "safety" });
  // The filler ids start at 101 so they can never collide with a roster id, whatever the roster
  // becomes. A colliding id would be a duplicate-claim parse refusal, which is a red for a reason
  // no case here is about.
  let n = 101;
  for (let i = 0; i < MIRROR_ARCHITECTURE_CLAIMS; i++) {
    out.push({ id: `C-28-${n++}`, file: MIRROR_ROOT_DOC, kind: "architecture" });
  }
  for (let i = 0; i < MIRROR_INSTALL_CLAIMS; i++) {
    out.push({ id: `C-28-${n++}`, file: MIRROR_ROOT_DOC, kind: "install" });
  }
  return out;
}

function renderRegistry(claims: readonly ClaimSpec[]): string {
  const lines: string[] = ["# Registry", ""];
  for (const c of claims) {
    lines.push(
      `### ${c.id}`,
      "",
      `- file: ${c.file}`,
      "- line: 4",
      `- kind: ${c.kind}`,
      "- depends_on: autonomy",
      "- status: true",
      "- mechanism: measured against the live config value.",
      "",
      "```",
      `A sentence for ${c.id}.`,
      "```",
      "",
    );
  }
  return lines.join("\n");
}

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
  claims: readonly ClaimSpec[] = defaultClaims(),
): string {
  const dir = freshTmp("grugops-audit-register-");
  mkdirSync(join(dir, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(dir, "agent-factory", "workflows"), { recursive: true });
  mkdirSync(join(dir, "docs", "audit"), { recursive: true });
  // A root markdown document, so the mirror's `publicDocsScan()` has a member exactly as the live
  // tree does. Without it the vouching derivation is empty on every mirror and equality four's
  // containment arm would red for a reason no case here is about.
  for (const doc of MIRROR_PUBLIC_DOCS) {
    mkdirSync(join(dir, doc, ".."), { recursive: true });
    writeFileSync(join(dir, doc), `# Mirror ${doc}\n`);
  }
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
  writeFileSync(join(dir, REGISTRY_PATH), renderRegistry(claims), "utf8");
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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// EQUALITY FOUR — the REGISTRY arm of the D-18 union (plan 29-30, 29-REVIEW round 3 § WR-06).
//
// The union is `register rows flagged safety_surface: yes` ∪ `registry rows of kind: safety`. Round
// 2 pinned it twice and BOTH pins landed on the REGISTER arm (equality three at the source, the
// containment pin at check-diff-disposition). Containment is one-directional by design, so the
// registry arm — four files on the live tree, two of them present by registry reason ALONE — was
// unpinned in both directions. Round 3 reproduced it: flip ONE `kind:` cell from `safety` to
// `architecture` and README.md leaves the union AND the watched corpus while every gate exits 0.
//
// These cases are the register arm's harness cases, twinned onto the registry arm.
// ─────────────────────────────────────────────────────────────────────────────────────────────
const claimsWith = (
  base: readonly ClaimSpec[],
  index: number,
  patch: Partial<ClaimSpec>,
): ClaimSpec[] => base.map((c, i) => (i === index ? { ...c, ...patch } : c));

const indexOfSoleSafetyClaim = (claims: readonly ClaimSpec[]): number => {
  const hits = claims
    .map((c, i) => (c.kind === "safety" && c.file === MIRROR_SOLE_DOC ? i : -1))
    .filter((i) => i >= 0);
  if (hits.length !== 1) {
    throw new Error(
      `harness premise: ${MIRROR_SOLE_DOC} must host EXACTLY ONE safety claim for a flip to remove ` +
        `it from the union, but the fixture gives it ${hits.length}`,
    );
  }
  return hits[0];
};

/** The registry arm as the union derives it, measured through the ONE derivation. */
const unionOf = (root: string): string[] =>
  safetySurfaceUnion(root)
    .map((e) => e.file)
    .sort();

const kindCountsOf = (root: string): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const c of readRegistry(root).claims) out[c.kind] = (out[c.kind] ?? 0) + 1;
  return out;
};

describe("check-audit-register: equality four — the REGISTRY arm (round-3 WR-06)", () => {
  it("the fixture's claim distribution is the one the gate declares — a drift pin, not a derivation", () => {
    // The fixture is written as literals ABOVE and this is the only place the two numbers meet. If
    // the fixture were built FROM the declared map, every perturbation case below would move the
    // baseline and the measurement together and measure nothing.
    const declared = Object.fromEntries(
      CLAIM_KIND_CARDINALITY.map((c) => [c.kind, c.count]),
    );
    expect(declared).toEqual({
      safety: MIRROR_SAFETY_CLAIMS,
      architecture: MIRROR_ARCHITECTURE_CLAIMS,
      install: MIRROR_INSTALL_CLAIMS,
    });
  });

  it("the LIVE registry's kind distribution equals the declared map, in BOTH directions", () => {
    // The direction round 3 reproduced, asserted against the shipped artifact rather than a mirror.
    const live = kindCountsOf(REPO_ROOT);
    const declared = Object.fromEntries(
      CLAIM_KIND_CARDINALITY.map((c) => [c.kind, c.count]),
    );
    expect(live).toEqual(declared);
    expect(CLAIM_KIND_CARDINALITY.reduce((n, c) => n + c.count, 0)).toBe(
      readRegistry(REPO_ROOT).claims.length,
    );
  });

  it("the fixture's safety roster is the one the gate declares — a drift pin, not a derivation", () => {
    expect(MIRROR_SAFETY_HOMES.map((h) => `${h.claim} -> ${h.file}`).sort()).toEqual(
      SAFETY_CLAIM_HOMES.map((h) => `${h.claim} -> ${h.file}`).sort(),
    );
  });

  it("the LIVE registry's safety arm equals the declared roster, in BOTH directions", () => {
    const live = readRegistry(REPO_ROOT)
      .claims.filter((c) => c.kind === "safety")
      .map((c) => `${c.id} -> ${c.file}`)
      .sort();
    expect(live).toEqual(SAFETY_CLAIM_HOMES.map((h) => `${h.claim} -> ${h.file}`).sort());
  });

  it("REDs a REHOMED safety claim — the count-preserving move a cardinality is BLIND to", () => {
    // THE BYPASS THE MANDATED ADVERSARIAL PASS FOUND AGAINST THIS PLAN'S OWN FIRST FIX. Rehome a
    // `kind: safety` claim from README.md to another VOUCHED public document and every count is
    // preserved — 6 safety claims before and after, 3 markdown residue members before and after —
    // while README.md leaves the D-18 exclusion list. Measured against the cardinality-only build:
    // all seven gates exited 0.
    const control = defaultClaims();
    const at = indexOfSoleSafetyClaim(control);
    const REHOMED_TO = "AGENTS.md"; // already on the arm AND vouched: no other check can see it
    const rehomed = claimsWith(control, at, { file: REHOMED_TO });

    const controlDir = buildMirror(defaultRows(), [], undefined, control);
    const rehomedDir = buildMirror(defaultRows(), [], undefined, rehomed);

    // ── PREMISE 1 — every COUNT this gate holds is preserved, so the roster is the only thing that
    //    can speak. This is the assertion that makes the case a statement about membership.
    expect(kindCountsOf(rehomedDir)).toEqual(kindCountsOf(controlDir));

    // ── PREMISE 2 — and the plant is real AT THE POINT OF EFFECT: the old home left the union.
    expect(unionOf(controlDir)).toContain(MIRROR_SOLE_DOC);
    expect(unionOf(rehomedDir)).not.toContain(MIRROR_SOLE_DOC);

    // ── PREMISE 3 — the new home is VOUCHED, so layer one is silent by construction.
    expect(publicDocsScan()).toContain(REHOMED_TO);

    expect(runGate(controlDir).status).toBe(0);
    const r = runGate(rehomedDir);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/equality four \(safety arm roster\)/);
    expect(r.out).toContain(`${control[at].id} -> ${MIRROR_SOLE_DOC}`);
    expect(r.out).toContain(`${control[at].id} -> ${REHOMED_TO}`);
    // The cardinality is SILENT here, which is the whole point of the case.
    expect(r.out).not.toMatch(/equality four \(kind cardinality\)/);
    expect(r.out).not.toMatch(/equality four \(safety claim NOT vouched for\)/);
  });

  it("REDs a ONE-CELL `kind: safety` flip, naming the kind — round 3's exact WR-06 recipe", () => {
    const control = defaultClaims();
    const at = indexOfSoleSafetyClaim(control);
    const flipped = claimsWith(control, at, { kind: "architecture" });

    // ── PREMISE 1 — exactly one cell moved, and it moved from `safety`.
    const moved = flipped.filter((c, i) => c.kind !== control[i].kind);
    expect(moved.map((c) => c.id)).toEqual([control[at].id]);
    expect(control[at].kind).toBe("safety");

    const controlDir = buildMirror(defaultRows(), [], undefined, control);
    const flippedDir = buildMirror(defaultRows(), [], undefined, flipped);

    // ── PREMISE 2 — the plant is not a no-op AT THE POINT OF EFFECT: the file really does leave the
    //    D-18 union. A case whose plant changed nothing passes for the wrong reason.
    expect(unionOf(controlDir)).toContain(MIRROR_SOLE_DOC);
    expect(unionOf(flippedDir)).not.toContain(MIRROR_SOLE_DOC);
    expect(unionOf(flippedDir).length).toBe(unionOf(controlDir).length - 1);

    // ── PREMISE 3 — the CONTROL mirror is green, so the RED below is about the flip.
    expect(runGate(controlDir).status).toBe(0);

    const r = runGate(flippedDir);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/equality four \(kind cardinality\)/);
    expect(r.out).toMatch(/\bsafety\b/);
    expect(r.out).toMatch(/architecture/);
    // Equality three stays SILENT: the register's column never moved, so this is a second,
    // independent question about the same union and neither arm absorbs the other's drift.
    expect(r.out).not.toMatch(/equality three \(/);
  });

  it("REDs a STRAY `kind: safety` row whose home NO derivation vouches for — a DIFFERENT defect", () => {
    // `docs/audit/28-claim-registry.md` exists on the mirror and is neither a public document nor a
    // derived kit file, so it is outside both derivations while being a real file — which isolates
    // this from a missing-file failure.
    const STRAY = REGISTRY_PATH;
    const control = defaultClaims();
    const at = indexOfSoleSafetyClaim(control);
    const strayed = claimsWith(control, at, { file: STRAY });

    // ── PREMISE — the kind column did NOT move, so this case cannot be passing on the cardinality
    //    finding the previous case is about.
    expect(strayed.map((c) => c.kind)).toEqual(control.map((c) => c.kind));

    const dir = buildMirror(defaultRows(), [], undefined, strayed);
    const r = runGate(dir);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/equality four \(safety claim NOT vouched for\)/);
    expect(r.out).toContain(STRAY);
    // TWO ACTS, TWO REMEDIES, TWO FINDINGS. The stray must not be reported through the cardinality
    // finding, and the flip must not be reported through this one.
    expect(r.out).not.toMatch(/equality four \(kind cardinality\)/);
  });

  it("REDs an UNDECLARED non-markdown safety claim, naming the file and the declared member", () => {
    const control = defaultClaims();
    const at = indexOfSoleSafetyClaim(control);
    const dir = buildMirror(
      defaultRows(),
      [],
      undefined,
      claimsWith(control, at, { file: "package.json" }),
    );
    const r = runGate(dir);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/equality four \(undeclared non-markdown safety claim\)/);
    expect(r.out).toContain("package.json");
    expect(r.out).toContain(MIRROR_NON_MARKDOWN);
  });

  it("THE PER-KIND PIN IS FALSIFIABLE FOR EVERY DECLARED KIND, not for one of them", () => {
    // A probe run on one kind proves one kind. Each declared kind is perturbed by one in turn and
    // the refusal must name THAT kind.
    for (const declared of CLAIM_KIND_CARDINALITY) {
      const control = defaultClaims();
      const victim = control.findIndex((c) => c.kind === declared.kind);
      expect(victim, `the fixture must carry a ${declared.kind} claim`).toBeGreaterThanOrEqual(0);
      const short = control.filter((_, i) => i !== victim);
      const dir = buildMirror(defaultRows(), [], undefined, short);

      // ── PREMISE — the derived count for THIS kind really moved by one on the mirror.
      expect(kindCountsOf(dir)[declared.kind] ?? 0, declared.kind).toBe(declared.count - 1);

      const r = runGate(dir);
      expect(r.status, declared.kind).toBe(1);
      expect(r.out, declared.kind).toMatch(/equality four \(kind cardinality\)/);
      expect(r.out, declared.kind).toContain(
        `${declared.kind} declares ${declared.count} but the registry carries ${declared.count - 1}`,
      );
    }
  });

  it("REDs a VACUOUS registry arm — zero `kind: safety` rows is a named refusal, not an empty-set pass", () => {
    // An arm that derives nothing satisfies every equality written over it. This is the argument
    // generate-safety-surface.ts already makes for the empty UNION and kit-model.ts makes for
    // refuseEmpty(), applied to the arm.
    const none = defaultClaims().map((c) =>
      c.kind === "safety" ? { ...c, kind: "architecture" } : c,
    );
    const dir = buildMirror(defaultRows(), [], undefined, none);
    expect(kindCountsOf(dir)["safety"]).toBeUndefined();
    const r = runGate(dir);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/equality four \(the registry arm is EMPTY\)/);
  });

  it("THE BOTH-ARMS PROBE: one cell of EACH arm moves at once, and BOTH are named", () => {
    // THE CASE NEITHER SINGLE-ARM HARNESS COULD HAVE PRODUCED. Round 3's finding is that two pins
    // covering one arm read as coverage. A gate that reported only the first arm it met would pass
    // every single-arm case in this file and still leave the second arm's drift invisible in
    // exactly the arrangement a real narrowing edit takes.
    const REGISTER_FLIP = "agent-factory/roles/role-07.md";
    const rows = defaultRows().map((r) =>
      r.file === REGISTER_FLIP ? { ...r, safety: "no" } : r,
    );
    const control = defaultClaims();
    const at = indexOfSoleSafetyClaim(control);
    const claims = claimsWith(control, at, { kind: "architecture" });
    const dir = buildMirror(rows, [], undefined, claims);

    // ── PREMISE — BOTH plants landed, each measured at its own point of effect.
    const union = unionOf(dir);
    expect(union).not.toContain(REGISTER_FLIP); // register arm moved
    expect(union).not.toContain(MIRROR_SOLE_DOC); // registry arm moved

    const r = runGate(dir);
    expect(r.status).toBe(1);

    // THE FINDING COUNT IS THE ASSERTION, not merely the presence of one message.
    const findings = r.out.split("\n").filter((l) => l.trimStart().startsWith("FAIL "));
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.some((f) => f.includes("equality three (derived but NOT flagged)"))).toBe(true);
    expect(findings.some((f) => f.includes("equality four (kind cardinality)"))).toBe(true);
    // The PUBLISHED count and the findings actually printed are the same number — a tally that
    // disagreed with its own list would be a number a reader cannot reconcile.
    expect(r.out).toContain(`${findings.length} CHECK(S) FAILED`);

    // AND THE COUNT ASSERTION IS PROVEN TO BE DOING WORK. An early-returning gate's observable
    // output is its FIRST finding alone — the single-arm shape every case above accepts — and this
    // assertion must reject it.
    expect(() => expect(findings.slice(0, 1).length).toBeGreaterThanOrEqual(2)).toThrow();
  });

  it("EVERY PREMISE ABOVE IS SHOWN FAILING on a no-op plant — a vacuous plant proves nothing", () => {
    // The recorded first-draft failure at check-foundation-guards.test.ts:5068, and this
    // repository's SEVENTH harness-premise failure in this phase alone. A case whose plant changed
    // nothing passes for the wrong reason, so each premise the cases above rest on is driven once
    // against an unmutated fixture and required to THROW.
    const control = defaultClaims();
    const at = indexOfSoleSafetyClaim(control);
    const noop = claimsWith(control, at, { kind: "safety" }); // the SAME kind — a no-op
    const controlDir = buildMirror(defaultRows(), [], undefined, control);
    const noopDir = buildMirror(defaultRows(), [], undefined, noop);

    // The flip case's PREMISE 1: "exactly one cell moved".
    expect(() =>
      expect(noop.filter((c, i) => c.kind !== control[i].kind).map((c) => c.id)).toEqual([
        control[at].id,
      ]),
    ).toThrow();
    // The flip case's PREMISE 2: "the file really leaves the union".
    expect(() => expect(unionOf(noopDir)).not.toContain(MIRROR_SOLE_DOC)).toThrow();
    expect(() =>
      expect(unionOf(noopDir).length).toBe(unionOf(controlDir).length - 1),
    ).toThrow();
    // The per-kind probe's PREMISE: "the derived count for THIS kind moved by one".
    for (const declared of CLAIM_KIND_CARDINALITY) {
      expect(() =>
        expect(kindCountsOf(noopDir)[declared.kind] ?? 0).toBe(declared.count - 1),
      ).toThrow();
    }
    // And the no-op mirror is GREEN, which is the other half of the same statement.
    expect(runGate(noopDir).status).toBe(0);
  });

  it("the PASS line PUBLISHES the registry arm's size beside the register arm's", () => {
    const r = runGate(buildMirror());
    expect(r.status).toBe(0);
    expect(r.out).toMatch(/equality four holds/);
    expect(r.out).toContain(
      `${MIRROR_SAFETY_CLAIMS} \`kind: safety\` claim(s)`,
    );
  });
});

describe("check-audit-register: equality four's declared map cannot silently go SHORT", () => {
  // THE BASELINE'S OWN FLOOR. A per-kind map that loses a kind takes that kind's rows with it and
  // every remaining equality still holds — the set-literal-drift class one level up. These drive
  // the exported predicate directly, because the map lives in the gate's SOURCE and a mirror cannot
  // perturb it.
  const liveClaims = readRegistry(REPO_ROOT).claims.map((c) => ({
    id: c.id,
    file: c.file,
    kind: c.kind as string,
  }));
  const vouched = [
    ...publicDocsScan(),
    ...listRoles(REPO_ROOT).map((f) => `agent-factory/roles/${f}`),
    ...listWorkflows(REPO_ROOT).map((f) => `agent-factory/workflows/${f}`),
  ];

  it("the live inputs produce NO finding — the control, so every red below is about the plant", () => {
    expect(
      registryArmFindings({
        claims: liveClaims,
        vouched,
        cardinality: CLAIM_KIND_CARDINALITY,
        roster: SAFETY_CLAIM_HOMES,
      }),
    ).toEqual([]);
  });

  it("DELETING a kind from the declared map REDs on the SUM floor, naming the shortfall", () => {
    for (const dropped of CLAIM_KIND_CARDINALITY) {
      const short = CLAIM_KIND_CARDINALITY.filter((c) => c.kind !== dropped.kind);
      const findings = registryArmFindings({
        claims: liveClaims,
        vouched,
        cardinality: short,
        roster: SAFETY_CLAIM_HOMES,
      });
      const sum = findings.filter((f) => /the declared kind map is SHORT/.test(f));
      expect(sum.length, dropped.kind).toBe(1);
      expect(sum[0]).toContain(
        `${liveClaims.length - dropped.count} claim(s) against ${liveClaims.length}`,
      );
    }
  });

  it("DELETING a kind is ALSO a coverage failure — the map must name every legal kind", () => {
    const short = CLAIM_KIND_CARDINALITY.filter((c) => c.kind !== "install");
    const findings = registryArmFindings({
      claims: liveClaims,
      vouched,
      cardinality: short,
        roster: SAFETY_CLAIM_HOMES,
    });
    expect(findings.some((f) => /omits a legal kind/.test(f))).toBe(true);
    expect(findings.some((f) => /install/.test(f))).toBe(true);
  });

  it("the predicate reports EVERY defect it finds — it never returns at the first one", () => {
    // The finding COUNT is the assertion, not merely the presence of one message: a predicate that
    // stopped at its first defect would satisfy every single-defect case above and still leave the
    // second arm's drift invisible in exactly the arrangement a real narrowing edit takes.
    const safetyIdx = liveClaims
      .map((c, i) => (c.kind === "safety" ? i : -1))
      .filter((i) => i >= 0);
    expect(safetyIdx.length, "the plant needs two distinct safety claims").toBeGreaterThanOrEqual(2);
    const planted = liveClaims.map((c, i) => {
      // TWO DEFECTS OF DIFFERENT CLASSES, one commit: one cell reclassified out of the arm, and one
      // surviving safety claim rehomed where no derivation vouches for it.
      if (i === safetyIdx[0]) return { ...c, kind: "architecture" };
      if (i === safetyIdx[1]) return { ...c, file: "docs/audit/28-claim-registry.md" };
      return c;
    });
    const findings = registryArmFindings({
      claims: planted,
      vouched,
      cardinality: CLAIM_KIND_CARDINALITY,
        roster: SAFETY_CLAIM_HOMES,
    });
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.some((f) => /kind cardinality/.test(f))).toBe(true);
    expect(findings.some((f) => /safety claim NOT vouched for/.test(f))).toBe(true);

    // AND THE COUNT ASSERTION IS PROVEN TO BE DOING WORK. An early-returning predicate's observable
    // output on this input is its FIRST finding alone; that is exactly the single-defect shape
    // every other case here accepts, and this assertion must reject it.
    const earlyReturn = findings.slice(0, 1);
    expect(() => expect(earlyReturn.length).toBeGreaterThanOrEqual(2)).toThrow();
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

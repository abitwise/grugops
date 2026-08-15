// generate-safety-surface.test.ts — the harness for D-18's derived safety-surface exclusion list.
//
// THE ONE PROPERTY THIS FILE EXISTS TO BUY. The exclusion list is what Phase 29's LANG-02 and
// LANG-03 consult before rewording anything, so its failure mode is silent and asymmetric: a list
// that is too SHORT permits a style pass over admission or compliance text and presents as a clean
// green build, while a list that is too long only costs Phase 29 some work. Every case below is
// therefore written against under-inclusion — the empty-union refusal, the de-duplication that must
// not drop a reason, and the byte-exact freshness guard that must red when a source moves.
//
// WHY THE UNION IS DERIVED AND NOT HAND-LISTED. A standalone list would be a fourth maintained set
// inside a phase whose subject is maintained sets rotting. The two sources — the register's
// `safety_surface` column and the registry's `kind: safety` rows — are already maintained for other
// reasons and are already gated, so the derived list inherits their upkeep instead of adding its own.
//
// Behavioural cases drive the COMMITTED .js via spawnSync against a hermetic CHECK_ROOT mirror
// under the OS temp dir — never the .ts, and never the real tree. The two real-tree cases are
// explicitly marked as such: they assert the shipped artifact, which is the thing CI protects.
//
// NOT in the e2e lane. Run with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/generate-safety-surface.test.ts
// Vitest globals:false -> import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROLE_COUNT, WORKFLOW_COUNT } from "./kit-model.js";
import { REGISTER_PATH, REGISTRY_PATH, readRegister, readRegistry } from "./audit-model.js";
import { PROTOCOL_FILE } from "./audit-prepass.js";
import { renderSafetySurface, OUT } from "./generate-safety-surface.js";
// (Plan 29-30) The gate this file's freshness-guard cases SPAWN now pins the registry arm's roster
// and per-kind cardinality (equality four), so a mirror carrying one claim is a shape the shipped
// artifact is not and reds for a reason no case here is about. The fixture is DERIVED from those
// declarations rather than transcribed a third time: the drift pin between the literals and the
// gate lives in check-audit-register.test.ts, which is also where the perturbation probes live, and
// a second hand-copy here would be the set-literal drift class with no probe over it.
import {
  CLAIM_KIND_CARDINALITY,
  SAFETY_CLAIM_HOMES,
} from "./check-audit-register.js";

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
}

/** A register mirror whose safety flags the caller controls. */
function renderRegister(rows: readonly RowSpec[]): string {
  return [
    "# Register",
    "",
    "## Table A — audited files",
    "",
    "| file | kind | counted | safety_surface | findings | observation |",
    "|---|---|---|---|---|---|",
    ...rows.map(
      (r) => `| ${r.file} | ${r.kind} | ${r.counted} | ${r.safety} | 0 | ${SUBSTANTIVE} |`,
    ),
    "",
    "## Table B — findings",
    "",
    "| finding_id | file | category | disposition | target_phase | reason |",
    "|---|---|---|---|---|---|",
    "",
  ].join("\n");
}

interface ClaimSpec {
  id: string;
  file: string;
  kind: string;
}

function renderRegistry(claims: readonly ClaimSpec[]): string {
  const blocks = claims.map((c) =>
    [
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
      "A sentence.",
      "```",
      "",
    ].join("\n"),
  );
  return ["# Registry", "", ...blocks].join("\n");
}

function defaultRows(safety = "yes"): RowSpec[] {
  const rows: RowSpec[] = [];
  for (let i = 1; i <= ROLE_COUNT; i++) {
    rows.push({
      file: `agent-factory/roles/role-${String(i).padStart(2, "0")}.md`,
      kind: "role",
      counted: "yes",
      safety,
    });
  }
  for (let i = 0; i < WORKFLOW_COUNT; i++) {
    rows.push({
      file: `agent-factory/workflows/${String(i).padStart(2, "0")}-flow.md`,
      kind: "workflow",
      counted: "yes",
      safety,
    });
  }
  rows.push({ file: PROTOCOL_FILE, kind: "protocol", counted: "no", safety });
  return rows;
}

/**
 * The claim set the spawned gate accepts: the safety arm's declared roster plus filler claims that
 * make up each remaining kind's declared cardinality. Filler ids start at 101 so they can never
 * collide with a roster id, whatever the roster becomes.
 */
function defaultClaims(): ClaimSpec[] {
  const out: ClaimSpec[] = SAFETY_CLAIM_HOMES.map((h) => ({
    id: h.claim,
    file: h.file,
    kind: "safety",
  }));
  let n = 101;
  for (const entry of CLAIM_KIND_CARDINALITY) {
    if (entry.kind === "safety") continue;
    for (let i = 0; i < entry.count; i++) {
      out.push({ id: `C-28-${n++}`, file: "README.md", kind: entry.kind });
    }
  }
  return out;
}

/**
 * A mirror carrying the kit shape, a register, a registry, and — unless told otherwise — an
 * exclusion list generated FROM that mirror, so the freshness guard sees a fresh pair.
 */
function buildMirror(opts: {
  rows?: readonly RowSpec[];
  claims?: readonly ClaimSpec[];
  /** `null` = write no exclusion list at all. A string = write exactly these bytes. */
  exclusions?: string | null;
}): string {
  const rows = opts.rows ?? defaultRows();
  const claims = opts.claims ?? defaultClaims();
  const dir = freshTmp("grugops-safety-surface-");
  mkdirSync(join(dir, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(dir, "agent-factory", "workflows"), { recursive: true });
  mkdirSync(join(dir, "docs", "audit"), { recursive: true });
  // The public documents the safety arm's roster names, so `publicDocsScan()` vouches for them on
  // the mirror as it does live. Without them equality four's containment arm reds on every case.
  for (const doc of SAFETY_CLAIM_HOMES.map((h) => h.file).filter((f) => f.endsWith(".md"))) {
    mkdirSync(join(dir, doc, ".."), { recursive: true });
    writeFileSync(join(dir, doc), `# Mirror ${doc}\n`);
  }
  for (const r of rows) {
    mkdirSync(join(dir, r.file, ".."), { recursive: true });
    writeFileSync(join(dir, r.file), "x");
  }
  writeFileSync(join(dir, REGISTER_PATH), renderRegister(rows), "utf8");
  writeFileSync(join(dir, REGISTRY_PATH), renderRegistry(claims), "utf8");
  if (opts.exclusions !== null) {
    writeFileSync(join(dir, OUT), opts.exclusions ?? renderSafetySurface(dir), "utf8");
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

/** The entry rows of a rendered list — the lines naming a path. */
function entryPaths(text: string): string[] {
  return text
    .split("\n")
    .filter((l) => /^\| `[^`]+` \|/.test(l))
    .map((l) => l.split("`")[1]);
}

describe("generate-safety-surface: OUT is a fixed literal", () => {
  it("is the exact repo-relative path, never argv/env/content-derived", () => {
    // The root is redirected under test; the path never is. This is the ASVS V12 path-traversal
    // posture generate-catalog.ts sets and the reason a mirror can be pointed at safely.
    expect(OUT).toBe("docs/audit/28-safety-surface-exclusions.md");
  });
});

describe("generate-safety-surface: the union", () => {
  it("carries every register row flagged safety_surface AND every registry safety row", () => {
    const dir = buildMirror({
      rows: defaultRows("yes"),
      claims: [
        { id: "C-28-001", file: "README.md", kind: "safety" },
        { id: "C-28-002", file: "AGENTS.md", kind: "architecture" },
      ],
      exclusions: null,
    });
    const paths = entryPaths(renderSafetySurface(dir));
    // 37 flagged register rows + README.md from the registry. AGENTS.md is `architecture`, not
    // `safety`, so it must NOT appear — the filter is load-bearing, not decorative.
    expect(paths).toContain("README.md");
    expect(paths).not.toContain("AGENTS.md");
    expect(paths.length).toBe(ROLE_COUNT + WORKFLOW_COUNT + 1 + 1);
  });

  it("EXCLUDES a register row whose safety_surface is `no`", () => {
    const rows = defaultRows("yes");
    const quiet = { ...rows[0], safety: "no" };
    const dir = buildMirror({
      rows: [quiet, ...rows.slice(1)],
      exclusions: null,
    });
    expect(entryPaths(renderSafetySurface(dir))).not.toContain(quiet.file);
  });

  it("de-duplicates a file present in BOTH sources and records BOTH reasons", () => {
    // No real file is in this position today (Table A holds only agent-factory/ kit files and every
    // safety claim lives in a public doc outside it), so the de-dup path is proven on a fixture
    // rather than asserted from the shipped artifact.
    const rows = defaultRows("yes");
    const shared = rows[0].file;
    const dir = buildMirror({
      rows,
      claims: [{ id: "C-28-007", file: shared, kind: "safety" }],
      exclusions: null,
    });
    const text = renderSafetySurface(dir);
    const paths = entryPaths(text);
    expect(paths.filter((p) => p === shared).length).toBe(1);
    const row = text.split("\n").find((l) => l.includes(`\`${shared}\``))!;
    expect(row).toMatch(/register/i);
    expect(row).toContain("C-28-007");
  });

  it("orders entries by path, so two regenerations are byte-identical", () => {
    const dir = buildMirror({ exclusions: null });
    const paths = entryPaths(renderSafetySurface(dir));
    expect(paths).toStrictEqual([...paths].sort());
    expect(renderSafetySurface(dir)).toBe(renderSafetySurface(dir));
  });

  it("states an entry count in the header that equals the entries it actually rendered", () => {
    const dir = buildMirror({ exclusions: null });
    const text = renderSafetySurface(dir);
    const declared = Number(text.match(/\*\*Entries:\*\*\s+(\d+)/)![1]);
    expect(declared).toBe(entryPaths(text).length);
  });
});

describe("generate-safety-surface: an empty union is a NAMED refusal, never an empty file", () => {
  it("throws rather than rendering a list with zero entries", () => {
    // The worst available failure of this artifact: a zero-entry exclusion list silently permits a
    // style pass over every file in the kit and presents as a clean green build.
    const dir = buildMirror({
      rows: defaultRows("no"),
      claims: [{ id: "C-28-001", file: "README.md", kind: "install" }],
      exclusions: null,
    });
    expect(() => renderSafetySurface(dir)).toThrow(/refusing to (render|return) an empty/i);
  });

  it("names WHY an empty list is refused, not merely THAT it is", () => {
    const dir = buildMirror({
      rows: defaultRows("no"),
      claims: [{ id: "C-28-001", file: "README.md", kind: "install" }],
      exclusions: null,
    });
    expect(() => renderSafetySurface(dir)).toThrow(/style pass|exclud/i);
  });
});

describe("check-audit-register: the folded freshness guard", () => {
  it("exits 0 when the committed list matches a fresh regeneration", () => {
    // The green baseline, written first — without it every red below is consistent with a guard
    // that can never pass.
    const r = runGate(buildMirror({}));
    expect(r.status).toBe(0);
    expect(r.out).toContain("ALL CHECKS PASSED");
  });

  it("REDS when one register safety_surface flag is flipped without regenerating", () => {
    const rows = defaultRows("yes");
    const dir = buildMirror({ rows });
    // Flip one row to `no` AFTER the list was generated — the source moved, the artifact did not.
    const stale = readFileSync(join(dir, REGISTER_PATH), "utf8").replace(
      `| ${rows[0].file} | role | yes | yes |`,
      `| ${rows[0].file} | role | yes | no |`,
    );
    writeFileSync(join(dir, REGISTER_PATH), stale, "utf8");
    const r = runGate(dir);
    expect(r.status).toBe(1);
    expect(r.out).toContain(OUT);
    expect(r.out).toMatch(/generate:safety-surface/);
  });

  it("REDS when the exclusion list is missing entirely", () => {
    const r = runGate(buildMirror({ exclusions: null }));
    expect(r.status).toBe(1);
    expect(r.out).toContain(OUT);
  });

  it("REDS on a one-byte divergence, so the comparison is exact and not normalized", () => {
    const dir = buildMirror({});
    const fresh = readFileSync(join(dir, OUT), "utf8");
    writeFileSync(join(dir, OUT), `${fresh} `, "utf8"); // one trailing space
    const r = runGate(dir);
    expect(r.status).toBe(1);
    expect(r.out).toContain(OUT);
  });
});

describe("generate-safety-surface: the SHIPPED artifact", () => {
  it("the committed list matches a fresh regeneration of the real tree", () => {
    expect(readFileSync(join(REPO_ROOT, OUT), "utf8")).toBe(renderSafetySurface(REPO_ROOT));
  });

  it("its entry count equals the union recomputed from the two parse authorities", () => {
    // Recomputed here from readRegister/readRegistry rather than read from the header, so the
    // header cannot vouch for itself.
    const expected = new Set<string>();
    for (const r of readRegister(REPO_ROOT).rows) {
      if (r.safetySurface === "yes") expected.add(r.file);
    }
    for (const c of readRegistry(REPO_ROOT).claims) {
      if (c.kind === "safety") expected.add(c.file);
    }
    const paths = entryPaths(readFileSync(join(REPO_ROOT, OUT), "utf8"));
    expect(new Set(paths)).toStrictEqual(expected);
    expect(paths.length).toBe(expected.size);
  });

  it("tells its Phase 29 consumer what honouring it means", () => {
    const text = readFileSync(join(REPO_ROOT, OUT), "utf8");
    expect(text).toMatch(/LANG-03/);
    expect(text).toMatch(/generate:safety-surface/);
    expect(text).toMatch(/28-disposition-register\.md/);
    expect(text).toMatch(/28-claim-registry\.md/);
  });
});

// generate-catalog.test.ts — DOCS-01 oracle for the browsable docs catalog generator
// (Vitest harness for scripts/generate-catalog.js).
//
// Drives the COMMITTED compiled artifact scripts/generate-catalog.js (never the .ts) and asserts
// the DOCS-01 contract over the real kit (17 roles + 19 workflows):
//   (1) WRITES + EXITS 0 over the real kit, leaving the tree clean (regen == committed bytes);
//   (2) BYTE-REPRODUCIBLE: two successive regenerations are byte-identical (and equal committed);
//   (3) COMPLETE SET: all 17 role names + all 19 workflow names present, exactly 17 + 19 rows;
//   (4) FAIL-CLOSED: a tampered kit file with no `# Role:` H1 → exit 1, NO partial write — proven
//       hermetically (mirror-and-tamper into a temp dir) so the real tree is never touched;
//   (5) NO FABRICATION: workflows 12/13 cadence cell reads `UNKNOWN - verify`, never `cadence: both`,
//       and no `..` (double-period) appears anywhere (the incident-responder single-sentence edge).
//
// The generator's ROLES_DIR/WORKFLOWS_DIR/OUT are FIXED literal paths joined to its own repo root
// (path-traversal mitigation — never argv/env/content-derived). So the fail-closed case copies the
// generator .js plus a TAMPERED agent-factory/{roles,workflows} + a sentinel output into a temp
// mirror laid out as <tmp>/scripts/... and <tmp>/agent-factory/..., then runs the mirrored .js there.
// The real tree is read-only in (1)/(2)/(3)/(5) and untouched in (4).
//
// This file ships RED until Task 2 builds the committed generate-catalog.js — that is correct
// Wave-0 sequencing (the oracle is authored before the implementation).

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GEN_JS = join(ROOT, "scripts", "generate-catalog.js");
const OUT = join(ROOT, "docs", "catalog", "README.md");

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// ── The generator's in-repo import closure, DERIVED rather than hand-listed ────────────────────
// (Plan 29-35) The hermetic mirror below must carry every `./x.js` the committed generator imports,
// transitively. Until this plan the generator imported nothing and the mirror was a single cpSync;
// deleting its private section-extent grammar (LANG-07 / WR-08) put `frontmatter.js` in the closure.
// The set is READ OUT OF THE COMMITTED SOURCES rather than hand-listed — the same derivation
// scripts/generate-role-adapters.test.ts already uses — so a second import needs no edit here.
//
// WHY DERIVED HERE AND HAND-LISTED IN scripts/catalog-freshness.ts: that module is a build-safety
// GATE, and a gate that carries its own "what does this module import" grammar is a second grammar
// in the place it can do the most harm (the recorded trade in scripts/adapters-freshness.ts). This
// is a test harness, where a set literal is the drift class this repository has already corrected
// four times. Different failure surfaces, different answers, both written down.
//
// THE WALK IS FLOORED: an empty closure would mirror nothing and every case below would silently be
// running a generator that cannot start.
function importClosure(entry: string, seen = new Set<string>()): Set<string> {
  const src = readFileSync(join(ROOT, "scripts", entry), "utf8");
  for (const m of src.matchAll(/from\s+"\.\/([A-Za-z0-9._-]+\.js)"/g)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    importClosure(m[1], seen);
  }
  return seen;
}
const GEN_MODULES = [...importClosure("generate-catalog.js")].sort();

// (27-60 / WR-04) A local `out(r)` helper lived here, read by nothing — the first thing the
// test-inclusive typecheck target ever saw. Every call site in this file inlines
// `${r.stdout}${r.stderr}` directly, so the helper was dead rather than merely unused-for-now.
// Removed at its site; no assertion changed.

// The 17 role display names (from each file's `# Role:` H1) — load-bearing literals.
const ROLE_NAMES = [
  "AGENTS.md Scribe",
  "Architect/Design",
  "BA/PM",
  "Brownfield Mapper",
  "Compliance Officer",
  "Factory Coach",
  "Frontend/UI",
  "Greenfield Mapper",
  "Incident Responder",
  "Installer",
  "Orchestrator",
  "QE/E2E",
  "Release Manager",
  "Security/NFR",
  "Software Engineer",
  "System Analyst",
  "UAT Planner",
];

// The 19 workflow display names (from each file's `# Workflow:` H1) — load-bearing literals.
const WORKFLOW_NAMES = [
  "Bootstrap greenfield",
  "Bootstrap brownfield",
  "Idea to epics",
  "Epic to tickets",
  "Ticket to PR",
  "PR quality gate",
  "UAT pack",
  "Backlog refinement",
  "Sprint planning",
  "Daily sweep",
  "Sprint review",
  "Retro",
  "Release",
  "Incident",
  "UI design to build",
  "Security audit (OWASP ASVS)",
  "task claim + schedule",
  "context read/write",
  "context compaction",
];

// Count data rows in a GitHub-flavored markdown table body for a given source-dir prefix.
// A data row links to `agent-factory/<dir>/<file>.md`; the header/separator rows do not, so this
// counts only real entries (not raw `.` or `|` tallies).
function countRowsLinkingInto(text: string, dir: string): number {
  const re = new RegExp(`agent-factory/${dir}/[^)\\s|]+\\.md`, "g");
  return (text.match(re) ?? []).length;
}

describe("generate-catalog.js (DOCS-01)", () => {
  // (1) writes the catalog + exits 0 over the real kit. The regenerated bytes equal the committed
  // bytes (parity → no-op), so the real tree is left clean. Restore defensively in finally.
  it("writes the catalog and exits 0, leaving the tree clean", () => {
    const before = readFileSync(OUT);
    const r = spawnSync("node", [GEN_JS], { encoding: "utf8" });
    try {
      expect(r.status).toBe(0);
      const after = readFileSync(OUT);
      expect(after.length).toBeGreaterThan(0);
      // The committed catalog IS the generator's deterministic output, so a regen is a no-op.
      expect(after.equals(before)).toBe(true);
    } finally {
      writeFileSync(OUT, before);
    }
  });

  // (2) byte-reproducibility: two successive regenerations produce byte-identical output, equal to
  // the committed bytes.
  it("byte-reproducible: regenerating twice yields identical bytes", () => {
    const before = readFileSync(OUT);
    try {
      const r1 = spawnSync("node", [GEN_JS], { encoding: "utf8" });
      expect(r1.status).toBe(0);
      const first = readFileSync(OUT);
      const r2 = spawnSync("node", [GEN_JS], { encoding: "utf8" });
      expect(r2.status).toBe(0);
      const second = readFileSync(OUT);
      expect(second.equals(first)).toBe(true);
      expect(second.equals(before)).toBe(true);
    } finally {
      writeFileSync(OUT, before);
    }
  });

  // (3) complete set: all 17 role names + all 19 workflow names present (incl. frontend-ui via its
  // source link, and workflows 14 + 15 + 16 + 17 + 18); exactly 17 role data rows + 19 workflow data rows.
  it("contains all 17 roles and all 19 workflows with exact row counts", () => {
    const before = readFileSync(OUT);
    try {
      const r = spawnSync("node", [GEN_JS], { encoding: "utf8" });
      expect(r.status).toBe(0);
      const text = readFileSync(OUT, "utf8");

      for (const name of ROLE_NAMES) expect(text).toContain(name);
      for (const name of WORKFLOW_NAMES) expect(text).toContain(name);

      // The frontend-ui role + workflows 14/15 source files must be linked (the finished set).
      expect(text).toContain("agent-factory/roles/frontend-ui.md");
      expect(text).toContain("agent-factory/workflows/14-ui-design-to-build.md");
      expect(text).toContain("agent-factory/workflows/15-security-audit.md");

      // Exactly 17 role rows + 19 workflow rows (count via source-link matches, not `.` tallies).
      expect(countRowsLinkingInto(text, "roles")).toBe(17);
      expect(countRowsLinkingInto(text, "workflows")).toBe(19);
    } finally {
      writeFileSync(OUT, before);
    }
  });

  // (4) fail-closed: a kit file with no `# Role:` H1 → exit 1, NO partial write. Built hermetically:
  // mirror the generator .js + a TAMPERED agent-factory/{roles,workflows} into <tmp>, plant a
  // sentinel at <tmp>/docs/catalog/README.md, run the mirrored .js, assert exit 1 AND the sentinel
  // survives unchanged (refused to write a partial). The real tree is never touched.
  it("fail-closed: a kit file with no H1 → exit 1, no partial write", () => {
    const m = mkdtempSync(join(tmpdir(), "grugops-catalog-"));
    tmpDirs.push(m);
    mkdirSync(join(m, "scripts"), { recursive: true });
    mkdirSync(join(m, "docs", "catalog"), { recursive: true });
    cpSync(GEN_JS, join(m, "scripts", "generate-catalog.js"));
    // NOT VACUOUS: the generator imports the section-locator authority, so an empty closure means
    // the derivation read the wrong file and this case would exit 1 on a module-resolution error
    // while the sentinel survived — passing for a reason that has nothing to do with the H1 check.
    expect(
      GEN_MODULES,
      "the generator's import closure came back empty — the mirror would be one module short and this case would go green on ERR_MODULE_NOT_FOUND",
    ).toContain("frontmatter.js");
    for (const mod of GEN_MODULES) {
      cpSync(join(ROOT, "scripts", mod), join(m, "scripts", mod));
    }
    cpSync(join(ROOT, "agent-factory", "roles"), join(m, "agent-factory", "roles"), {
      recursive: true,
    });
    cpSync(
      join(ROOT, "agent-factory", "workflows"),
      join(m, "agent-factory", "workflows"),
      { recursive: true },
    );

    // Tamper: strip the `# Role:` H1 line from one mirrored role file (a missing name = drift).
    const victim = join(m, "agent-factory", "roles", "orchestrator.md");
    const tampered = readFileSync(victim, "utf8").replace(/^# Role: .+$/m, "# (stripped)");
    writeFileSync(victim, tampered);

    // Plant a sentinel the generator must NOT overwrite on the fail-closed path.
    const sentinel = "SENTINEL — must not be overwritten on a fail-closed run.\n";
    const outPath = join(m, "docs", "catalog", "README.md");
    writeFileSync(outPath, sentinel);

    const r = spawnSync("node", [join(m, "scripts", "generate-catalog.js")], {
      encoding: "utf8",
    });
    expect(r.status).toBe(1);
    // THE EXIT CODE IS ATTRIBUTED, NOT MERELY OBSERVED (plan 29-35). `1` is also what Node returns
    // for an unresolved import, and this case would otherwise report a fail-closed refusal it never
    // reached. The refusal must NAME the tampered role file, and the run must not have died on
    // module resolution.
    expect(`${r.stdout}${r.stderr}`).toContain("orchestrator.md: no `# Role:` H1");
    expect(`${r.stdout}${r.stderr}`).not.toContain("ERR_MODULE_NOT_FOUND");
    // No partial write: the sentinel survives unchanged.
    expect(existsSync(outPath)).toBe(true);
    expect(readFileSync(outPath, "utf8")).toBe(sentinel);
  });

  // (5) no fabrication: workflows 12 (Release) and 13 (Incident) carry no `cadence` frontmatter, so
  // their cadence cell must read `UNKNOWN - verify` — never a fabricated `cadence: both` or bare
  // `both`. Also assert no `..` (double-period) anywhere (the incident-responder single-sentence
  // summary edge — appending a period would produce `..`).
  it("no fabrication: workflows 12/13 cadence reads UNKNOWN - verify, no fabricated cadence, no double-period", () => {
    const before = readFileSync(OUT);
    try {
      const r = spawnSync("node", [GEN_JS], { encoding: "utf8" });
      expect(r.status).toBe(0);
      const text = readFileSync(OUT, "utf8");

      // The two enterprise workflows with no cadence must surface UNKNOWN - verify.
      expect(text).toContain("UNKNOWN - verify");
      // No fabricated cadence value for the absent field.
      expect(text).not.toContain("cadence: both");
      // No FABRICATED double-period after a sentence (Pitfall 1 — incident-responder single-sentence
      // summary, where naively re-appending a period would yield `word..`). Scoped to that artifact
      // — a word char followed by `..` then whitespace/pipe/end-of-line — so it no longer false-fails
      // on the legitimate `../../` in the now-relative source links (or on `...` ellipses). (IN-03,
      // mandatory collateral of WR-02's relative-link form.)
      expect(text).not.toMatch(/\w\.\.(\s|\||$)/m);
    } finally {
      writeFileSync(OUT, before);
    }
  });

  // ── (6) THE SECTION-EXTENT UNIFICATION, HELD ON BOTH AXES (plan 29-35, LANG-07 / WR-08) ───────
  //
  // This generator used to bound `## <heading>` with a private `new RegExp` lookahead over the whole
  // document. Plan 29-35 deleted it and asked `unfencedHeadingIndex` + `sectionEndIndex` instead.
  // Live reachability over the committed kit was ZERO on both axes on the day of the change, so
  // `docs/catalog/README.md` is byte-identical — which means nothing in the artifact distinguishes
  // that change from a rename. These two cases are what does.
  //
  // THE CASES LIVE IN BOTH GENERATORS' TEST FILES because the defect existed in both, and a case in
  // one file proves nothing about the other. The two deleted copies were byte-identical, so the
  // hazard was too.

  /**
   * THE HISTORICAL GRAMMAR — A FIXTURE, NOT A LIVE SECOND GRAMMAR.
   *
   * The exact pattern plan 29-35 DELETED from this generator, reconstructed here and NOWHERE ELSE.
   * Called only by the two cases below, imported by nothing, exported to nothing. It exists to show
   * that the planted documents DISCRIMINATE — that the shipped path and the grammar it replaced give
   * different answers on them. Without it, a case asserting the correct answer passes on a fix and on
   * a coincidence alike.
   */
  const HISTORICAL_LOOKAHEAD_GRAMMAR = (
    text: string,
    heading: string,
  ): string | null => {
    const re = new RegExp(
      `^## ${heading}\\n([\\s\\S]*?)(?=\\n## |$(?![\\s\\S]))`,
      "m",
    );
    const m = text.match(re);
    return m ? m[1] : null;
  };

  /** A hermetic mirror of the generator, its import closure and the kit. The live tree is untouched. */
  function catalogMirror(): string {
    const m = mkdtempSync(join(tmpdir(), "grugops-catalog-extent-"));
    tmpDirs.push(m);
    mkdirSync(join(m, "scripts"), { recursive: true });
    mkdirSync(join(m, "docs", "catalog"), { recursive: true });
    cpSync(GEN_JS, join(m, "scripts", "generate-catalog.js"));
    for (const mod of GEN_MODULES) {
      cpSync(join(ROOT, "scripts", mod), join(m, "scripts", mod));
    }
    cpSync(join(ROOT, "agent-factory", "roles"), join(m, "agent-factory", "roles"), {
      recursive: true,
    });
    cpSync(
      join(ROOT, "agent-factory", "workflows"),
      join(m, "agent-factory", "workflows"),
      { recursive: true },
    );
    return m;
  }
  const runMirror = (m: string): { status: number | null; text: string } => {
    const r = spawnSync("node", [join(m, "scripts", "generate-catalog.js")], {
      encoding: "utf8",
    });
    return { status: r.status, text: `${r.stdout}${r.stderr}` };
  };
  /** The `One job` cell of the QE/E2E row, read out of the generated table. */
  const qeJobCell = (m: string): string => {
    const row = readFileSync(join(m, "docs", "catalog", "README.md"), "utf8")
      .split("\n")
      .find((l) => l.includes("agent-factory/roles/qe-e2e.md"));
    if (row === undefined) throw new Error("the QE/E2E row is absent from the generated catalog");
    return row.split("|")[3].trim();
  };

  it("a fenced level-two heading INSIDE the document does not steal the section — the FENCE axis", () => {
    const m = catalogMirror();
    // CONTROL FIRST: the unplanted mirror produces the real summary, so any movement below is caused
    // by the plant and not by the mirror.
    expect(runMirror(m).status).toBe(0);
    expect(qeJobCell(m)).toBe("Break the feature with tests and report the gaps.");

    const rolePath = join(m, "agent-factory", "roles", "qe-e2e.md");
    const original = readFileSync(rolePath, "utf8");
    // THE PLANT: the role QUOTES its own `## One job` heading inside a fenced example, above the real
    // section — the WR-01 document, showing documentation rather than declaring a second section.
    const planted = original.replace(
      "# Role: QE/E2E\n",
      "# Role: QE/E2E\n\n```md\n## One job\nThis block is an EXAMPLE, not the section.\n```\n",
    );
    expect(planted, "the plant must really have been applied").not.toBe(original);
    writeFileSync(rolePath, planted);

    // THE DISCRIMINATION, BEFORE THE CLAIM.
    expect(
      HISTORICAL_LOOKAHEAD_GRAMMAR(planted, "One job"),
      "the deleted grammar must answer DIFFERENTLY on this document, or the case cannot fail",
    ).toEqual("This block is an EXAMPLE, not the section.\n```\n");

    // THE SHIPPED PATH, asserted as the exact cell — a literal, never a containment, because a
    // containment assertion is satisfied by a truncated capture that includes the fragment.
    expect(runMirror(m).status).toBe(0);
    expect(qeJobCell(m)).toBe("Break the feature with tests and report the gaps.");
    // …and NOT the row the deleted grammar would have published, stated as its own literal.
    expect(qeJobCell(m)).not.toBe("This block is an EXAMPLE, not the section.");
  });

  it("a level-ONE heading after the section CLOSES it — the LEVEL axis", () => {
    const m = catalogMirror();
    expect(runMirror(m).status).toBe(0);

    const rolePath = join(m, "agent-factory", "roles", "qe-e2e.md");
    const original = readFileSync(rolePath, "utf8");
    // THE PLANT: an EMPTY `## One job` followed immediately by a level-ONE heading with content. The
    // deleted terminator named level two only, so a `# ` heading did not close the section and the
    // capture ran into the next top-level section — byte-for-byte the defect voice-model.ts shipped
    // at exit 0, which cost this phase plans 29-14 and 29-20 one module over.
    const planted = original.replace(
      "## One job\nBreak the feature with tests and report the gaps.\n",
      "## One job\n\n# Appendix\nThis paragraph belongs to the appendix, not to the role's one job.\n",
    );
    expect(planted, "the plant must really have been applied").not.toBe(original);
    writeFileSync(rolePath, planted);

    // THE DISCRIMINATION, BEFORE THE CLAIM: the deleted grammar adopts the appendix and would have
    // published `# Appendix` as a catalogue summary at exit 0.
    expect(
      HISTORICAL_LOOKAHEAD_GRAMMAR(planted, "One job"),
      "the deleted grammar must answer DIFFERENTLY on this document, or the case cannot fail",
    ).toEqual(
      "\n# Appendix\nThis paragraph belongs to the appendix, not to the role's one job.\n",
    );

    // THE SHIPPED PATH sees an EMPTY section, which is what it is, and fails closed by name.
    const r = runMirror(m);
    expect(r.status).toBe(1);
    expect(r.text).toContain(
      "qe-e2e.md: no `## One job` section — refusing to write a partial catalog",
    );
    expect(r.text).not.toContain("# Appendix");
  });
});

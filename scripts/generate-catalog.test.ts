// generate-catalog.test.ts — oracle for the reference generator (DOCS-01; plan 43-04, D-13, D-16, D-17)
// (Vitest harness for scripts/generate-catalog.js).
//
// Drives the COMMITTED compiled artifact scripts/generate-catalog.js (never the .ts) and asserts its
// contract over the real kit. The generator writes docs/reference/README.md (the index: one roles table
// and one workflows table) and one page per role at docs/reference/agents/<role-stem>.md:
//   (1) WRITES + EXITS 0 over the real kit, leaving the tree clean (regen == committed pages);
//   (2) BYTE-REPRODUCIBLE: two successive regenerations give the same page set and the same bytes;
//   (3) COMPLETE SET: every role and workflow name present, with exact row counts;
//   (4) FAIL-CLOSED: a tampered kit file with no `# Role:` H1 → exit 1, NO partial write and no page
//       deleted — proven hermetically (mirror-and-tamper into a temp dir) so the real tree is never touched;
//   (5) NO FABRICATION: workflows 12/13 cadence cell reads `UNKNOWN - verify`, never `cadence: both`,
//       and no `..` (double-period) appears anywhere (the incident-responder single-sentence edge).
//
// The generator's ROLES_DIR/WORKFLOWS_DIR/OUT_DIR are FIXED literal paths joined to its own repo root
// (path-traversal mitigation — never argv/env/content-derived). So the hermetic cases copy the generator
// .js and its import closure plus agent-factory/{roles,workflows} into a temp mirror laid out as
// <tmp>/scripts/... and <tmp>/agent-factory/..., then run the mirrored .js there. The real-tree cases
// snapshot the whole docs/reference/ tree and restore it.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  lstatSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix } from "node:path";
import {
  PLUGIN_SKILL_ADAPTER_COUNT,
  ROLE_COUNT,
  WORKFLOW_COUNT,
  WORKFLOWS_SUBPATH,
  isNumberedWorkflowFile,
  listRoleDisplayNames,
  listPluginSkillAdapters,
  listRoles,
  listWorkflowDisplayNames,
} from "./kit-model.js";
import { parseFrontmatter } from "./frontmatter.js";
import { HOST_TOOLS } from "../install/host-tools.js";

const ROOT = join(import.meta.dirname, "..");
const GEN_JS = join(ROOT, "scripts", "generate-catalog.js");
const OUT = join(ROOT, "docs", "reference", "README.md");

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
//
// (Plan 43-05) THE CLOSURE IS REPO-RELATIVE. The generator reads the host registry through
// `../install/host-tools.js`, a module outside scripts/, so each member is a POSIX path from the
// repository root (`scripts/frontmatter.js`, `install/host-tools.js`), resolved against the importing
// module's own directory.
function importClosure(entryRel: string, seen = new Set<string>()): Set<string> {
  const src = readFileSync(join(ROOT, ...entryRel.split("/")), "utf8");
  for (const m of src.matchAll(/from\s+"(\.\.?\/[A-Za-z0-9._/-]+\.js)"/g)) {
    const rel = posix.normalize(posix.join(posix.dirname(entryRel), m[1]));
    if (seen.has(rel)) continue;
    seen.add(rel);
    importClosure(rel, seen);
  }
  return seen;
}
const GEN_MODULES = [...importClosure("scripts/generate-catalog.js")].sort();

// The generator's DATA inputs (plan 43-05): the kit roles and workflows, the plugin skills it pages,
// the standalone skill twins it reads Claude Code's command names from, and the plugin manifest it
// reads the plugin name and repository URL from. Data, not imports, so no import walk finds them.
const GEN_DATA = [
  "agent-factory/roles",
  "agent-factory/workflows",
  "skills",
  ".claude/skills",
  ".claude-plugin",
] as const;

/** Copy the committed generator, its import closure and its data into the mirror `m`. */
function mirrorGeneratorInto(m: string): void {
  // NOT VACUOUS: the generator imports the section-locator authority, so an empty closure means
  // the derivation read the wrong file and a case would exit 1 on a module-resolution error while
  // its sentinel survived, passing for a reason that has nothing to do with the refusal it names.
  expect(
    GEN_MODULES,
    "the generator's import closure came back empty — the mirror would be one module short and a case would go green on ERR_MODULE_NOT_FOUND",
  ).toContain("scripts/frontmatter.js");
  mkdirSync(join(m, "scripts"), { recursive: true });
  mkdirSync(join(m, "docs", "reference"), { recursive: true });
  cpSync(GEN_JS, join(m, "scripts", "generate-catalog.js"));
  for (const rel of [...GEN_MODULES, ...GEN_DATA]) {
    mkdirSync(dirname(join(m, ...rel.split("/"))), { recursive: true });
    cpSync(join(ROOT, ...rel.split("/")), join(m, ...rel.split("/")), { recursive: true });
  }
}

// ── The committed reference tree, snapshotted and restored as a whole (plan 43-04) ──────────────
// The generator writes the index and one page per role and deletes any stray page under
// docs/reference/, so the real-tree cases below snapshot every regular file under that directory
// (lstat, links never followed) and restore the whole set, not one file. An absent directory is an
// empty snapshot, so a case reds on its own assertion rather than on a missing-file throw.
const REF_DIR = join(ROOT, "docs", "reference");
function snapshotReference(): Map<string, Buffer> {
  const snap = new Map<string, Buffer>();
  const walk = (rel: string): void => {
    const abs = rel === "" ? REF_DIR : join(REF_DIR, ...rel.split("/"));
    let st;
    try {
      st = lstatSync(abs);
    } catch {
      return;
    }
    if (st.isDirectory()) {
      for (const n of readdirSync(abs).sort()) walk(rel === "" ? n : `${rel}/${n}`);
    } else if (st.isFile()) {
      snap.set(rel, readFileSync(abs));
    }
  };
  walk("");
  return snap;
}
/** Every regular file under `dir`, by POSIX relative path, with its bytes (lstat; links never followed). */
function snapshotDir(dir: string): Map<string, Buffer> {
  const snap = new Map<string, Buffer>();
  const walk = (rel: string): void => {
    const abs = rel === "" ? dir : join(dir, ...rel.split("/"));
    const st = lstatSync(abs);
    if (st.isDirectory()) {
      for (const n of readdirSync(abs).sort()) walk(rel === "" ? n : `${rel}/${n}`);
    } else if (st.isFile()) {
      snap.set(rel, readFileSync(abs));
    }
  };
  walk("");
  return snap;
}
function sameSnapshot(a: Map<string, Buffer>, b: Map<string, Buffer>): boolean {
  if (a.size !== b.size) return false;
  for (const [rel, bytes] of a) {
    const other = b.get(rel);
    if (other === undefined || !other.equals(bytes)) return false;
  }
  return true;
}
function restoreReference(snap: Map<string, Buffer>): void {
  for (const rel of snapshotReference().keys()) {
    if (!snap.has(rel)) rmSync(join(REF_DIR, ...rel.split("/")), { force: true });
  }
  for (const [rel, bytes] of snap) {
    const abs = join(REF_DIR, ...rel.split("/"));
    let now: Buffer | null = null;
    try {
      now = readFileSync(abs);
    } catch {
      now = null;
    }
    if (now !== null && now.equals(bytes)) continue;
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, bytes);
  }
}

// (27-60 / WR-04) A local `out(r)` helper lived here, read by nothing — the first thing the
// test-inclusive typecheck target ever saw. Every call site in this file inlines
// `${r.stdout}${r.stderr}` directly, so the helper was dead rather than merely unused-for-now.
// Removed at its site; no assertion changed.

// The role and workflow display names, DERIVED from kit-model (plan 43-04, D-17): each file's
// `# Role:` / `# Workflow:` heading, read through listRoleDisplayNames and listWorkflowDisplayNames
// over the same sets the generator walks. No name list and no count is typed in this file; the
// fixture-agreement case below holds both sets against ROLE_COUNT and WORKFLOW_COUNT, which
// guard_kit_counts pins two-sided.
const ROLE_NAMES: readonly string[] = listRoleDisplayNames(ROOT);
// The skill ops (plan 43-05, D-15, D-17): the directory name of each listPluginSkillAdapters() entry,
// whose page is docs/reference/skills/<op>.md. The page total is the index, one page per role and one
// per plugin skill, each count a kit-model constant pinned two-sided elsewhere, never typed here.
const SKILL_OPS: readonly string[] = listPluginSkillAdapters(ROOT).map((rel) => rel.slice(0, -"/SKILL.md".length));
const PAGE_TOTAL = 1 + ROLE_COUNT + PLUGIN_SKILL_ADAPTER_COUNT;
const WORKFLOW_NAMES: readonly string[] = listWorkflowDisplayNames(ROOT);

// Count data rows in a GitHub-flavored markdown table body for a given source-dir prefix.
// A data row links to `agent-factory/<dir>/<file>.md`; the header/separator rows do not, so this
// counts only real entries (not raw `.` or `|` tallies).
function countRowsLinkingInto(text: string, dir: string): number {
  const re = new RegExp(`agent-factory/${dir}/[^)\\s|]+\\.md`, "g");
  return (text.match(re) ?? []).length;
}

describe("generate-catalog.js (DOCS-01)", () => {
  // (1) writes the reference tree + exits 0 over the real kit. The regenerated pages equal the
  // committed pages (parity → no-op), so the real tree is left clean. Restore defensively in finally.
  it("writes the reference tree and exits 0, leaving the tree clean", () => {
    const before = snapshotReference();
    const r = spawnSync("node", [GEN_JS], { encoding: "utf8" });
    try {
      expect(r.status, `${r.stdout}${r.stderr}`).toBe(0);
      const after = snapshotReference();
      // The index, one page per role and one page per plugin skill, and nothing else.
      expect(after.size).toBe(PAGE_TOTAL);
      expect(after.get("README.md")?.length ?? 0).toBeGreaterThan(0);
      // The committed tree IS the generator's deterministic output, so a regen is a no-op.
      expect(sameSnapshot(after, before)).toBe(true);
    } finally {
      restoreReference(before);
    }
  });

  // (2) byte-reproducibility: two successive regenerations produce byte-identical output, equal to
  // the committed bytes.
  it("byte-reproducible: regenerating twice yields identical bytes", () => {
    const before = snapshotReference();
    try {
      const r1 = spawnSync("node", [GEN_JS], { encoding: "utf8" });
      expect(r1.status).toBe(0);
      const first = snapshotReference();
      const r2 = spawnSync("node", [GEN_JS], { encoding: "utf8" });
      expect(r2.status).toBe(0);
      const second = snapshotReference();
      // Every page, not only the index: two runs give the same page set and the same bytes.
      expect(first.size).toBe(PAGE_TOTAL);
      expect(sameSnapshot(second, first)).toBe(true);
      expect(sameSnapshot(second, before)).toBe(true);
    } finally {
      restoreReference(before);
    }
  });

  // (3) complete set: every role and workflow display name present (incl. frontend-ui via its source
  // link, and workflows 14 + 15); exactly ROLE_COUNT role rows + WORKFLOW_COUNT workflow rows.
  it("contains every role and every workflow with exact row counts (ROLE_COUNT, WORKFLOW_COUNT)", () => {
    const before = snapshotReference();
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

      // Exactly ROLE_COUNT role rows + WORKFLOW_COUNT workflow rows (count via source-link matches,
      // not `.` tallies). Both counts are the kit authority's constants, never typed here (D-17).
      expect(countRowsLinkingInto(text, "roles")).toBe(ROLE_COUNT);
      expect(countRowsLinkingInto(text, "workflows")).toBe(WORKFLOW_COUNT);
    } finally {
      restoreReference(before);
    }
  });

  // ── The corpus cardinality, held by a mechanism instead of by prose (round 6, plan 29-46 — WR-03)
  //
  // WHAT THIS CASE HOLDS, AND WHAT IT CANNOT SEE — declared here because a predicate that does not
  // state its own bound is how this phase has repeatedly shipped a green gate over an unheld fact.
  //
  // IT HOLDS the workflow corpus this generator actually walks against WORKFLOW_COUNT in
  // scripts/kit-model.ts — the constant guard_kit_counts already pins TWO-SIDED — and against this
  // file's own hand-written name fixtures. So a file added to the kit directory, a fixture left
  // behind, and a constant bumped without walking its consumers all part company HERE, on the day it
  // happens.
  //
  // IT DOES NOT READ COMMENTS. It cannot tell whether a sentence in scripts/generate-catalog.ts's
  // prose still describes the corpus, and nothing in this repository can. That is exactly why plan
  // 29-46 DELETED the stale cardinality statements from that module rather than typing fresher
  // numbers into the same places: the count is held HERE, by a mechanism, and prose restating a count
  // a mechanism already holds is a second declaration with nothing behind it — which is the drift
  // WR-03 found, rotted silently, and green the whole time.
  it("the workflow corpus the generator walks is exactly WORKFLOW_COUNT, and the fixtures agree", () => {
    // DERIVED INDEPENDENTLY OF THE LOOP THAT CONSUMES IT. The directory is read through the SAME
    // membership rule the generator asks — isNumberedWorkflowFile in scripts/kit-model.js — never by
    // counting WORKFLOW_NAMES, so "the directory gained a file" and "the fixture lost a name" are two
    // different reds here rather than one shared silence.
    //
    // AND THE RULE IS ASKED, NOT RETYPED (round 6, IN-01 — plan 29-54). A hand-copied duplicate of the
    // generator's expression stood on this line. It was the drift class this very case exists to
    // catch, reappearing one level down inside its own remedy: widen the generator's pattern and this
    // case would keep the OLD contract and stay green for as long as the file set happened not to
    // change. There is now one declaration and three consumers, and widening it moves all three.
    const onDisk = readdirSync(join(ROOT, WORKFLOWS_SUBPATH)).filter(isNumberedWorkflowFile);
    // TWO FLOORS, NOT ONE. A floor on the derived set alone still passes vacuously when the CONSTANT
    // is the side that went to zero, and an equality between two empty sets is the emptiest possible
    // green. Both sides are floored ABOVE the equality, so neither can satisfy it by being absent.
    expect(
      onDisk.length,
      "the workflows directory yielded no numbered files at all",
    ).toBeGreaterThan(0);
    expect(WORKFLOW_COUNT, "the pinned constant itself went to zero").toBeGreaterThan(0);
    expect(
      onDisk.length,
      "the numbered workflow files on disk and WORKFLOW_COUNT disagree",
    ).toBe(WORKFLOW_COUNT);
    expect(
      WORKFLOW_NAMES.length,
      "this file's WORKFLOW_NAMES fixture drifted away from WORKFLOW_COUNT",
    ).toBe(WORKFLOW_COUNT);
    expect(
      ROLE_NAMES.length,
      "this file's ROLE_NAMES fixture drifted away from ROLE_COUNT",
    ).toBe(ROLE_COUNT);
  });

  // (4) fail-closed: a kit file with no `# Role:` H1 → exit 1, NO partial write. Built hermetically:
  // mirror the generator .js + a TAMPERED agent-factory/{roles,workflows} into <tmp>, plant a
  // sentinel at <tmp>/docs/reference/README.md, run the mirrored .js, assert exit 1 AND the sentinel
  // survives unchanged (refused to write a partial). The real tree is never touched.
  it("fail-closed: a kit file with no H1 → exit 1, no partial write", () => {
    const m = mkdtempSync(join(tmpdir(), "grugops-catalog-"));
    tmpDirs.push(m);
    mirrorGeneratorInto(m);

    // Tamper: strip the `# Role:` H1 line from one mirrored role file (a missing name = drift).
    const victim = join(m, "agent-factory", "roles", "orchestrator.md");
    const tampered = readFileSync(victim, "utf8").replace(/^# Role: .+$/m, "# (stripped)");
    writeFileSync(victim, tampered);

    // Plant a sentinel the generator must NOT overwrite on the fail-closed path.
    const sentinel = "SENTINEL — must not be overwritten on a fail-closed run.\n";
    const outPath = join(m, "docs", "reference", "README.md");
    writeFileSync(outPath, sentinel);
    // …and a role page and a stray page: a run that fails before writing neither rewrites a page nor
    // deletes a stray one, so every page under docs/reference/ is byte-unchanged (plan 43-04).
    mkdirSync(join(m, "docs", "reference", "agents"), { recursive: true });
    const rolePage = join(m, "docs", "reference", "agents", "qe-e2e.md");
    const strayPage = join(m, "docs", "reference", "agents", "zzz-stray.md");
    writeFileSync(rolePage, sentinel);
    writeFileSync(strayPage, sentinel);

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
    // No partial write: the sentinels survive unchanged and the stray page is not deleted.
    expect(existsSync(outPath)).toBe(true);
    expect(readFileSync(outPath, "utf8")).toBe(sentinel);
    expect(readFileSync(rolePage, "utf8")).toBe(sentinel);
    expect(readFileSync(strayPage, "utf8")).toBe(sentinel);
  });

  // ── The reference pages (plan 43-04, D-13, D-16, D-17) ──────────────────────────────────────
  //
  // One page per role at docs/reference/agents/<role-stem>.md, for every member of kit-model
  // listRoles(); the page set is compared with the role set both ways, so neither a hand-listed page
  // nor a role without a page can pass. Each page opens with the provenance line, the display name
  // from the `# Role:` heading, the first sentence of `## One job` and a link to the role source.
  // Plan 43-14 adds the header block and the extracted sections to the same pages.
  const PROVENANCE = "<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->";

  it("writes one page per listRoles() member under docs/reference/agents/, each opening with the provenance line, the display name, the One job sentence and the source link", () => {
    const m = catalogMirror();
    const run = runMirror(m);
    expect(run.status, run.text).toBe(0);
    const roleFiles = listRoles(ROOT);
    const names = listRoleDisplayNames(ROOT);
    expect(roleFiles.length, "PREMISE: the role set is not empty").toBeGreaterThan(0);
    const pages = readdirSync(join(m, "docs", "reference", "agents")).sort();
    // Two-sided: the page set is exactly the role set, named by the role file stem.
    expect(pages).toEqual([...roleFiles].sort());
    expect(pages.length).toBe(ROLE_COUNT);
    const index = readFileSync(join(m, "docs", "reference", "README.md"), "utf8");
    roleFiles.forEach((file, i) => {
      const page = readFileSync(join(m, "docs", "reference", "agents", file), "utf8");
      const lines = page.split("\n");
      expect(lines[0], file).toBe(PROVENANCE);
      expect(lines[1], file).toBe(`# ${names[i]}`);
      // The One job sentence is the one the index row publishes for this role, and the role source
      // carries it word for word.
      const row = index.split("\n").find((l) => l.includes(`(agents/${file})`));
      expect(row, `the index has no row linking agents/${file}`).toBeDefined();
      const summary = row!.split(" | ")[2];
      expect(lines[3], file).toBe(summary.replace(/\\\|/g, "|").replace(/\\\\/g, "\\"));
      expect(readFileSync(join(m, "agent-factory", "roles", file), "utf8")).toContain(lines[3]);
      expect(page, file).toContain(
        `Full role: [agent-factory/roles/${file}](../../../agent-factory/roles/${file})`,
      );
      expect(page.endsWith("\n") && !page.endsWith("\n\n"), `${file}: one trailing newline`).toBe(true);
    });
  });

  it("the index lists roles core first then by display name, and workflows in numeric order", () => {
    const m = catalogMirror();
    const run = runMirror(m);
    expect(run.status, run.text).toBe(0);
    const index = readFileSync(join(m, "docs", "reference", "README.md"), "utf8").split("\n");
    const roleRows = index.filter((l) => l.includes("(agents/"));
    expect(roleRows.length).toBe(ROLE_COUNT);
    const parsed = roleRows.map((l) => {
      const c = l.split(" | ");
      return { name: c[0].replace(/^\| /, ""), tier: c[1] };
    });
    const firstEnterprise = parsed.findIndex((r) => r.tier === "enterprise");
    expect(firstEnterprise, "PREMISE: the kit has both tiers").toBeGreaterThan(0);
    expect(parsed.slice(firstEnterprise).every((r) => r.tier === "enterprise")).toBe(true);
    for (const group of [parsed.slice(0, firstEnterprise), parsed.slice(firstEnterprise)]) {
      const names = group.map((r) => r.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    }
    const orders = index
      .filter((l) => l.includes("agent-factory/workflows/"))
      .map((l) => Number(l.split(" | ")[0].replace(/^\| /, "")));
    expect(orders.length).toBe(WORKFLOW_COUNT);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("the committed index links exactly the committed role pages, both ways, and both equal the listRoles() stems", () => {
    // Read-only over the committed tree. The index's `agents/<file>` link targets, the files under
    // docs/reference/agents/ and the kit-model role set are three derivations of one fact; any two
    // disagreeing (a page with no row, a row with no page, a role with neither) is red.
    const index = readFileSync(OUT, "utf8");
    const linked = [...index.matchAll(/\]\(agents\/([^)\s/]+\.md)\)/g)].map((x) => x[1]).sort();
    const onDisk = readdirSync(join(REF_DIR, "agents")).sort();
    const roles = [...listRoles(ROOT)].sort();
    expect(roles.length, "PREMISE: the role set is not empty").toBeGreaterThan(0);
    expect(new Set(linked).size, "each page is linked once").toBe(linked.length);
    expect(linked.filter((f) => !onDisk.includes(f)), "linked from the index, no page on disk").toEqual([]);
    expect(onDisk.filter((f) => !linked.includes(f)), "a page on disk the index does not link").toEqual([]);
    expect(linked).toEqual(roles);
    expect(onDisk).toEqual(roles);
  });

  // ── The skill pages (plan 43-05, D-15, D-16, D-17) ───────────────────────────────────────────
  //
  // One page per plugin skill at docs/reference/skills/<op>.md, for every member of kit-model
  // listPluginSkillAdapters(); each opens with the provenance line and `# <op>`, gives the skill's
  // frontmatter `description`, its `allowed-tools`, and its source as a repository URL (skills/ does
  // not ship to the kit home, so a relative link would be dead there). The expected values are read
  // here through the one frontmatter authority, never typed.
  const PLUGIN_JSON = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "plugin.json"), "utf8")) as {
    name: string;
    repository: string;
  };
  const skillField = (op: string, key: string): string[] => {
    const parsed = parseFrontmatter(readFileSync(join(ROOT, "skills", op, "SKILL.md"), "utf8"));
    if (!parsed.ok) throw new Error(`skills/${op}/SKILL.md: unreadable frontmatter — ${parsed.reason}`);
    return parsed.value.get(key) ?? [];
  };
  /** The pages a run wrote under <m>/docs/reference/skills/, or an empty list when none were. */
  const skillPagesIn = (m: string): string[] => {
    const dir = join(m, "docs", "reference", "skills");
    return existsSync(dir) ? readdirSync(dir).sort() : [];
  };

  it("writes one page per listPluginSkillAdapters() member under docs/reference/skills/, each with the provenance line, `# <op>`, the description, the allowed tools and the repository-URL source", () => {
    const m = catalogMirror();
    const run = runMirror(m);
    expect(run.status, run.text).toBe(0);
    expect(SKILL_OPS.length, "PREMISE: the plugin skill set is not empty").toBeGreaterThan(0);
    // Two-sided: the page set is exactly the plugin skill set, named by the op.
    expect(skillPagesIn(m)).toEqual(SKILL_OPS.map((op) => `${op}.md`).sort());
    expect(skillPagesIn(m).length).toBe(PLUGIN_SKILL_ADAPTER_COUNT);
    for (const op of skillPagesIn(m).map((f) => f.slice(0, -".md".length))) {
      const page = readFileSync(join(m, "docs", "reference", "skills", `${op}.md`), "utf8");
      const lines = page.split("\n");
      expect(lines[0], op).toBe(PROVENANCE);
      expect(lines[1], op).toBe(`# ${op}`);
      const [description] = skillField(op, "description");
      expect(description, `PREMISE: skills/${op}/SKILL.md has a description`).toBeTruthy();
      expect(lines[3], op).toBe(description);
      // The allowed tools, as the authority reads the block sequence, under their own heading.
      const [tools] = skillField(op, "allowed-tools");
      expect(tools, `PREMISE: skills/${op}/SKILL.md has allowed-tools`).toBeTruthy();
      const at = lines.indexOf("## Allowed tools");
      expect(at, `${op}: no ## Allowed tools heading`).toBeGreaterThan(0);
      expect(lines[at + 2], op).toBe(tools);
      // The source is the repository URL of the plugin skill file; the twin is named as generated.
      const url = `${PLUGIN_JSON.repository}/blob/main/skills/${op}/SKILL.md`;
      expect(page, op).toContain(`Source: [skills/${op}/SKILL.md](${url})`);
      expect(page, op).toContain("npm run freshness:skill-twins");
      expect(page.endsWith("\n") && !page.endsWith("\n\n"), `${op}: one trailing newline`).toBe(true);
    }
  });

  it("the committed index has one `## Skills` table that links exactly the committed skill pages, both ways, and both equal the plugin skill ops", () => {
    // Read-only over the committed tree: the index's `skills/<op>.md` link targets, the files under
    // docs/reference/skills/ and the kit-model plugin skill set are three derivations of one fact.
    const index = readFileSync(OUT, "utf8");
    expect(index.split("\n").filter((l) => l === "## Skills").length, "one ## Skills heading").toBe(1);
    const linked = [...index.matchAll(/\]\(skills\/([^)\s/]+\.md)\)/g)].map((x) => x[1]).sort();
    const onDisk = skillPagesIn(ROOT);
    const ops = SKILL_OPS.map((op) => `${op}.md`).sort();
    expect(ops.length, "PREMISE: the plugin skill set is not empty").toBeGreaterThan(0);
    expect(new Set(linked).size, "each skill page is linked once").toBe(linked.length);
    expect(linked.filter((f) => !onDisk.includes(f)), "linked from the index, no page on disk").toEqual([]);
    expect(onDisk.filter((f) => !linked.includes(f)), "a page on disk the index does not link").toEqual([]);
    expect(linked).toEqual(ops);
    expect(onDisk).toEqual(ops);
  });

  // ── Invocation per host, workflows named, roles reached (plan 43-05 Task 2, D-15) ──────────────
  //
  // Every expected value is DERIVED here from the same sources the generator reads: the host registry
  // (HOST_TOOLS), plugin.json, the standalone twin whose description equals the plugin skill's, the
  // workflow paths the skill body names and those workflows' `## Agents involved` bullets. No command
  // spelling is typed in this file.
  /** The body lines of `## <heading>` in a page, up to the next level-two heading. */
  const pageSection = (page: string, heading: string): string[] => {
    const lines = page.split("\n");
    const at = lines.indexOf(`## ${heading}`);
    if (at === -1) return [];
    const end = lines.findIndex((l, i) => i > at && l.startsWith("## "));
    return lines.slice(at + 1, end === -1 ? lines.length : end);
  };
  const committedSkillPage = (op: string): string => {
    const path = join(REF_DIR, "skills", `${op}.md`);
    return existsSync(path) ? readFileSync(path, "utf8") : "";
  };
  /** The standalone twin (`.claude/skills/<d>/SKILL.md`) whose description equals the plugin skill's. */
  const twinNameOf = (op: string): string => {
    const [description] = skillField(op, "description");
    const names = readdirSync(join(ROOT, ".claude", "skills"))
      .filter((d) => existsSync(join(ROOT, ".claude", "skills", d, "SKILL.md")))
      .flatMap((d) => {
        const parsed = parseFrontmatter(readFileSync(join(ROOT, ".claude", "skills", d, "SKILL.md"), "utf8"));
        if (!parsed.ok) throw new Error(`.claude/skills/${d}/SKILL.md: unreadable frontmatter`);
        return (parsed.value.get("description") ?? [])[0] === description ? (parsed.value.get("name") ?? []) : [];
      });
    if (names.length !== 1) throw new Error(`PREMISE: skills/${op} has ${names.length} standalone twins, expected 1`);
    return names[0];
  };
  /** Escape a cell the way the generator does (backslash, then pipe). */
  const asCell = (t: string): string => t.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
  const DISPATCHER = SKILL_OPS.find((op) => skillField(op, "name")[0] === PLUGIN_JSON.name);

  it("gate.md's Invocation table has one plain-text row per HOST_TOOLS host, in registry order: the standalone and plugin commands for the spawn host, the dispatcher route for the sequential hosts", () => {
    const rows = pageSection(committedSkillPage("gate"), "Invocation").filter((l) => l.startsWith("| ") && !l.startsWith("| ---"));
    // The header row, then one row per host, each opening with the host's registry name in plain text.
    expect(rows.length, "the Invocation table: a header and one row per host").toBe(1 + HOST_TOOLS.length);
    HOST_TOOLS.forEach((host, i) => {
      const row = rows[i + 1];
      expect(row.startsWith(`| ${host.name} | `), `row ${i + 1} opens with the plain host name ${host.name}`).toBe(true);
      if (host.dispatch === "spawn") {
        expect(row).toContain(`\`/${twinNameOf("gate")} "<request>"\``);
        expect(row).toContain(`\`/${PLUGIN_JSON.name}:${skillField("gate", "name")[0]} "<request>"\``);
      } else {
        expect(row).toContain(`Through the dispatcher: ${asCell(host.invoke)}`);
      }
    });
    const codex = HOST_TOOLS.find((h) => h.id === "codex");
    expect(codex, "PREMISE: the registry has a Codex row").toBeDefined();
    expect(rows.find((r) => r.startsWith(`| ${codex!.name} | `))).toContain("$grugops");
  });

  it("the dispatcher's page shows each sequential host's invoke text as is", () => {
    expect(DISPATCHER, "PREMISE: one plugin skill is named after the plugin (the dispatcher)").toBeDefined();
    const rows = pageSection(committedSkillPage(DISPATCHER!), "Invocation");
    for (const host of HOST_TOOLS.filter((h) => h.dispatch === "sequential")) {
      expect(rows, host.name).toContain(`| ${host.name} | ${asCell(host.invoke)} |`);
    }
    expect(pageSection(committedSkillPage(DISPATCHER!), "Workflows").join("\n")).toContain(
      "The Orchestrator picks the workflow for the request.",
    );
  });

  it("gate.md lists the workflows its body names and links the roles they involve plus the roles the body names", () => {
    const body = readFileSync(join(ROOT, "skills", "gate", "SKILL.md"), "utf8");
    const named = [...new Set([...body.matchAll(/agent-factory\/workflows\/([A-Za-z0-9._-]+\.md)/g)].map((x) => x[1]))].sort();
    expect(named.length, "PREMISE: the gate skill names at least one workflow").toBeGreaterThan(0);
    const page = committedSkillPage("gate");
    const wf = pageSection(page, "Workflows").join("\n");
    for (const f of named) expect(wf).toContain(`(../../../agent-factory/workflows/${f})`);
    // The roles: each `- <Display Name> — ` bullet of the named workflows' Agents involved section that
    // is a role display name, plus each non-underscore role file the body names.
    const files = listRoles(ROOT);
    const names = listRoleDisplayNames(ROOT);
    const expected = new Set<string>();
    for (const f of named) {
      const text = readFileSync(join(ROOT, "agent-factory", "workflows", f), "utf8").split("\n");
      const at = text.indexOf("## Agents involved");
      expect(at, `PREMISE: ${f} has an Agents involved section`).toBeGreaterThan(-1);
      for (const l of text.slice(at + 1)) {
        if (l.startsWith("## ")) break;
        const m = l.match(/^- (.+?) — /);
        if (m && names.includes(m[1])) expected.add(files[names.indexOf(m[1])]);
      }
    }
    for (const x of body.matchAll(/agent-factory\/roles\/([A-Za-z0-9._-]+\.md)/g)) {
      if (!x[1].startsWith("_")) expected.add(x[1]);
    }
    expect(expected.has("orchestrator.md"), "PREMISE: the Orchestrator is among the roles reached").toBe(true);
    const linked = [...pageSection(page, "Roles it reaches").join("\n").matchAll(/\]\(\.\.\/agents\/([^)]+\.md)\)/g)].map((x) => x[1]).sort();
    expect(linked).toEqual([...expected].sort());
  });

  it("no generated row opens with a bold cell, and the generator types no command spelling", () => {
    for (const op of SKILL_OPS) {
      expect(committedSkillPage(op), `PREMISE: docs/reference/skills/${op}.md exists`).not.toBe("");
    }
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => (lstatSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
    const bold = walk(REF_DIR).flatMap((f) =>
      readFileSync(f, "utf8").split("\n").filter((l) => /^\| *\*\*/.test(l)).map((l) => `${f}: ${l}`),
    );
    expect(bold).toEqual([]);
    const src = readFileSync(join(ROOT, "scripts", "generate-catalog.ts"), "utf8");
    expect(src.match(/'\/grugops|"\/grugops/g) ?? []).toEqual([]);
  });

  it("fail-closed: a skill body naming a workflow listWorkflows does not hold → exit 1 naming the skill and the path, and no page changes", () => {
    const m = catalogMirror();
    expect(runMirror(m).status).toBe(0);
    const before = snapshotDir(join(m, "docs", "reference"));
    expect(before.size, "PREMISE: the first run wrote the tree").toBe(PAGE_TOTAL);
    const victim = join(m, "skills", "gate", "SKILL.md");
    writeFileSync(victim, `${readFileSync(victim, "utf8")}\nAlso run \`agent-factory/workflows/99-nope.md\`.\n`);
    const run = runMirror(m);
    expect(run.status, run.text).toBe(1);
    expect(run.text).toContain("skills/gate/SKILL.md");
    expect(run.text).toContain("agent-factory/workflows/99-nope.md");
    expect(run.text).not.toContain("ERR_MODULE_NOT_FOUND");
    expect(sameSnapshot(snapshotDir(join(m, "docs", "reference")), before)).toBe(true);
  });

  it("fail-closed: two standalone twins sharing one description → exit 1 naming both, and no page changes", () => {
    const m = catalogMirror();
    expect(runMirror(m).status).toBe(0);
    const before = snapshotDir(join(m, "docs", "reference"));
    const twin = twinNameOf("gate");
    const copyDir = join(m, ".claude", "skills", `${twin}-copy`);
    mkdirSync(copyDir, { recursive: true });
    writeFileSync(
      join(copyDir, "SKILL.md"),
      readFileSync(join(m, ".claude", "skills", twin, "SKILL.md"), "utf8").replace(`name: ${twin}`, `name: ${twin}-copy`),
    );
    const run = runMirror(m);
    expect(run.status, run.text).toBe(1);
    expect(run.text).toContain(`.claude/skills/${twin}/SKILL.md`);
    expect(run.text).toContain(`.claude/skills/${twin}-copy/SKILL.md`);
    expect(run.text).not.toContain("ERR_MODULE_NOT_FOUND");
    expect(sameSnapshot(snapshotDir(join(m, "docs", "reference")), before)).toBe(true);
  });

  it("deletes a stray .md page under docs/reference/ and leaves a non-page file alone", () => {
    const m = catalogMirror();
    expect(runMirror(m).status).toBe(0);
    const stray = join(m, "docs", "reference", "agents", "zzz-stray.md");
    const note = join(m, "docs", "reference", "agents", "keep.txt");
    writeFileSync(stray, "stray\n");
    writeFileSync(note, "not a page\n");
    const run = runMirror(m);
    expect(run.status, run.text).toBe(0);
    expect(existsSync(stray)).toBe(false);
    expect(readFileSync(note, "utf8")).toBe("not a page\n");
  });

  it("refuses, writing nothing, when a page path is a link: it never writes through it", () => {
    const m = catalogMirror();
    expect(runMirror(m).status).toBe(0);
    const outside = join(m, "outside.md");
    writeFileSync(outside, "OUTSIDE\n");
    const page = join(m, "docs", "reference", "agents", "orchestrator.md");
    rmSync(page);
    symlinkSync(outside, page);
    const indexBefore = readFileSync(join(m, "docs", "reference", "README.md"));
    const run = runMirror(m);
    expect(run.status).toBe(1);
    expect(run.text).toContain("docs/reference/agents/orchestrator.md");
    expect(readFileSync(outside, "utf8")).toBe("OUTSIDE\n");
    expect(readFileSync(join(m, "docs", "reference", "README.md")).equals(indexBefore)).toBe(true);
  });

  // (round 6, IN-02 / residual 29-46 R2 — plan 29-54) A DUPLICATE WORKFLOW ORDER STOPS THE GENERATOR.
  //
  // WHAT THIS HOLDS AND WHY IT IS HERE RATHER THAN IN PROSE. The workflows table is published in
  // ascending `order`. A comment beside that sort used to ASSERT the values were unique and cite a
  // one-off re-verification as the evidence; nothing in the repository enforced it, so a standing
  // property rested on a point-in-time measurement — the same shape as the stale cardinality plan
  // 29-46 deleted from this generator's header, one screen above. If two workflows ever declared one
  // order, `Array.prototype.sort` is stable, so their relative position would fall through to the
  // order readdirSync returned them in, and the generated document would differ between machines for
  // no visible reason while every freshness gate on the machine that wrote it stayed green.
  //
  // THE GATE IS AT THE POINT OF EFFECT, NOT ONLY HERE. This case proves the GENERATOR refuses; it is
  // not itself the thing that notices. Delete this case and the property still holds; delete the
  // refusal and this case reds.
  it("fail-closed: two workflows declaring the same `order` → exit 1 naming both files, no partial write", () => {
    const m = mkdtempSync(join(tmpdir(), "grugops-catalog-dup-order-"));
    tmpDirs.push(m);
    // NOT VACUOUS — mirrorGeneratorInto asserts the closure holds the frontmatter authority, the same
    // attribution the H1 case above makes.
    mirrorGeneratorInto(m);

    // Tamper: give a second workflow an order another one already declares. The DONOR's value is read
    // off the mirrored corpus rather than typed here, so this fixture cannot go stale against a kit
    // whose numbering changed — and the collision is constructed from the corpus's own facts.
    const donorFile = "00-bootstrap-greenfield.md";
    const victimFile = "01-bootstrap-brownfield.md";
    const donorOrder = readFileSync(join(m, "agent-factory", "workflows", donorFile), "utf8").match(
      /^order: (\d+)$/m,
    );
    expect(
      donorOrder,
      `${donorFile}: no \`order:\` line to copy — the fixture's premise is gone, not its subject`,
    ).not.toBeNull();
    const victimPath = join(m, "agent-factory", "workflows", victimFile);
    const victimBefore = readFileSync(victimPath, "utf8");
    const victimOrder = victimBefore.match(/^order: (\d+)$/m);
    expect(victimOrder, `${victimFile}: no \`order:\` line to overwrite`).not.toBeNull();
    // PREMISE ASSERTED: the two must DISAGREE before the tamper, or the fixture would be testing a
    // collision the corpus already had and this case would pass without the tamper doing anything.
    expect(
      victimOrder![1],
      "the donor and victim already declare the same order — the tamper would be a no-op",
    ).not.toBe(donorOrder![1]);
    writeFileSync(victimPath, victimBefore.replace(/^order: \d+$/m, `order: ${donorOrder![1]}`));

    // Plant a sentinel the generator must NOT overwrite on the fail-closed path.
    const sentinel = "SENTINEL — must not be overwritten on a duplicate-order run.\n";
    const outPath = join(m, "docs", "reference", "README.md");
    writeFileSync(outPath, sentinel);

    const r = spawnSync("node", [join(m, "scripts", "generate-catalog.js")], {
      encoding: "utf8",
    });
    const out = `${r.stdout}${r.stderr}`;
    expect(r.status, out).toBe(1);
    // ATTRIBUTED, NOT MERELY OBSERVED: the refusal must name BOTH colliding files and the shared
    // value, and the run must not have died on module resolution.
    expect(out).not.toContain("ERR_MODULE_NOT_FOUND");
    expect(out).toContain(donorFile);
    expect(out).toContain(victimFile);
    expect(out).toContain(`order: ${donorOrder![1]}`);
    // No partial write: the sentinel survives unchanged, so the catalog is never emitted from an
    // ambiguous ordering.
    expect(existsSync(outPath)).toBe(true);
    expect(readFileSync(outPath, "utf8")).toBe(sentinel);
  });

  // (LANG-07 / D-22, D-23, D-24 — plan 29-54) THIS MODULE DECLARES NO FRONTMATTER GRAMMAR.
  //
  // WHY THIS CASE EXISTS. LANG-07's closure deleted this generator's private `key: value` parser and
  // moved the question onto the ONE authority in scripts/frontmatter.ts. Round 5 verified that, round
  // 6 regression-checked it, and both did so with `grep -c "function parseFrontmatter"` — a check
  // against a SPELLING. A second grammar named `readFm` would satisfy that grep and defeat the
  // decision. The property is that this module declares no leading-metadata grammar AT ALL, so the
  // property is what is asserted here, and it is asserted by a mechanism that outlives the round that
  // took it by hand.
  //
  // ITS COVERAGE BOUND, STATED PLAINLY BECAUSE A PREDICATE THAT DOES NOT STATE ITS BOUND IS HOW THIS
  // PHASE HAS REPEATEDLY SHIPPED A GREEN GATE OVER AN UNHELD FACT:
  //
  //   • IT HOLDS scripts/generate-catalog.{ts,js} AND NOTHING ELSE. The authority has other
  //     consumers; this case says nothing whatever about them.
  //   • IT ENUMERATES FOUR MARKERS, NOT EVERY POSSIBLE GRAMMAR. A parser written with no
  //     frontmatter-named binding, no fence token, no string-keyed map read and a fresh import would
  //     pass. The markers are chosen to catch the shape that was actually deleted here — an anchored
  //     `---` fence match feeding a `key: value` scan — because that shape is the one this module has
  //     already grown once.
  it("LANG-07 — the generator declares no frontmatter grammar; every leading-metadata fact comes from the one authority", () => {
    const stripComments = (t: string) =>
      t
        .split("\n")
        .filter((l) => !l.trimStart().startsWith("//"))
        .join("\n");
    const SOURCES = ["generate-catalog.ts", "generate-catalog.js"] as const;

    for (const name of SOURCES) {
      const raw = readFileSync(join(ROOT, "scripts", name), "utf8");
      // NON-VACUITY: an unreadable or empty module would satisfy every marker below by having no text
      // to fail on, which is the emptiest possible green.
      expect(raw.length, `${name}: read back empty`).toBeGreaterThan(1000);
      const code = stripComments(raw);

      // MARKER 1 — the authority is IMPORTED, and the import is DERIVED from the module's own import
      // statement rather than asserted as a string this file happens to know. If the generator ever
      // stops importing the authority, the question is being answered somewhere else.
      const importBlock = code.match(
        /import\s*\{([^}]*)\}\s*from\s*"\.\/frontmatter\.js"/,
      );
      expect(
        importBlock,
        `${name}: no import from "./frontmatter.js" — the one authority is not being asked at all`,
      ).not.toBeNull();
      const imported = importBlock![1]
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      expect(imported, `${name}: the authority import names`).toContain("parseFrontmatter");

      // MARKER 2 — NO BINDING IN THIS MODULE IS NAMED AFTER FRONTMATTER. This is the widening of the
      // round-5/round-6 grep: it catches `parseFrontmatter`, `readFrontmatter`, `frontmatterOf` and
      // every other declaration carrying the word, rather than one exact function name.
      const localBindings = [
        ...code.matchAll(
          /(?:function|const|let|var|class)\s+([A-Za-z0-9_$]*[Ff]rontmatter[A-Za-z0-9_$]*)/g,
        ),
      ].map((m) => m[1]);
      expect(
        localBindings,
        `${name}: declares a frontmatter-named binding — the authority is scripts/frontmatter.ts and this module must only ask it`,
      ).toEqual([]);

      // MARKER 3 — NO LEADING-FENCE TOKEN. The deleted grammar opened with a `---` fence match
      // anchored at byte 0. The three-hyphen run is checked only in the forms a PARSER would use — a
      // bare string literal and a regex anchor — so the markdown table separators this module emits
      // (`| --- | --- |`) are outside the marker by construction rather than by exemption.
      for (const token of ['"---"', "'---'", "`---`", "/^---", "\\n---", "^---$"]) {
        expect(code, `${name}: carries the fence-parsing token ${token}`).not.toContain(token);
      }

      // MARKER 4 — EVERY STRING-KEYED MAP READ COMES OFF A `parseFrontmatter` RESULT. The receivers
      // are DERIVED: the names bound from a `parseFrontmatter(...)` call are read out of the module,
      // and every `.get("<key>")` in the module must be reached through one of them. A local parser
      // returning its own map would be read through a receiver that is not on that list.
      const authorityResults = [
        ...code.matchAll(/const\s+([A-Za-z0-9_$]+)\s*=\s*parseFrontmatter\(/g),
      ].map((m) => `${m[1]}.value`);
      expect(
        authorityResults.length,
        `${name}: no \`const x = parseFrontmatter(\` call site — the authority is imported but never asked`,
      ).toBeGreaterThan(0);
      const stringKeyedReceivers = [...code.matchAll(/([A-Za-z0-9_$.]+)\.get\("/g)].map(
        (m) => m[1],
      );
      expect(
        stringKeyedReceivers.length,
        `${name}: no string-keyed map read found at all — the derivation is looking at the wrong text`,
      ).toBeGreaterThan(0);
      for (const receiver of stringKeyedReceivers) {
        expect(
          authorityResults,
          `${name}: \`${receiver}.get("...")\` reads a string-keyed map that did not come from the one authority`,
        ).toContain(receiver);
      }
    }
  });

  // (5) no fabrication: workflows 12 (Release) and 13 (Incident) carry no `cadence` frontmatter, so
  // their cadence cell must read `UNKNOWN - verify` — never a fabricated `cadence: both` or bare
  // `both`. Also assert no `..` (double-period) anywhere (the incident-responder single-sentence
  // summary edge — appending a period would produce `..`).
  it("no fabrication: workflows 12/13 cadence reads UNKNOWN - verify, no fabricated cadence, no double-period", () => {
    const before = snapshotReference();
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
      restoreReference(before);
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
    mirrorGeneratorInto(m);
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
    const row = readFileSync(join(m, "docs", "reference", "README.md"), "utf8")
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

  // ── (7) THE FRONTMATTER UNIFICATION — THE RETURN-SHAPE DIFFERENCE MADE FALSIFIABLE ────────────
  //     (plan 29-40, gap G-29-1 of 29-UAT.md, closing V-29-35-01)
  //
  // This generator used to declare its OWN flat `key: value` frontmatter parser beside the exported
  // authority in `scripts/frontmatter.ts`. Plan 29-40 deleted it (D-24). Measured over the 36 governed
  // documents on the day of the change, the two grammars disagreed on NOTHING — 0 skipped key
  // spellings, 0 duplicated keys, 0 empty read values, 0 documents with no fence, 0 CRLF documents —
  // so `docs/catalog/README.md` is byte-identical and nothing in the artifact distinguishes that
  // change from a rename. THESE THREE CASES ARE WHAT DOES.
  //
  // The one non-mechanical step was the RETURN SHAPE. The deleted copy returned
  // `Record<string, string>`; the authority returns `Parsed<FrontmatterKeys>` — a discriminated result
  // over a `Map<string, string[]>`. That buys a parse-failure arm and a multiplicity question the
  // last-wins regex never had to answer, and it separates three facts the old shape printed as one.
  //
  // EVERY "PRE-CHANGE" CLAIM BELOW WAS MEASURED, NOT REASONED. The three plants were run against the
  // pre-change committed `scripts/generate-catalog.js` (`git show 803b9c1:scripts/generate-catalog.js`)
  // on a scratch mirror in the same session that wrote these cases, and each measured result is
  // recorded at its case.

  /**
   * THE HISTORICAL FLAT `key: value` GRAMMAR — A FIXTURE, NOT A LIVE SECOND GRAMMAR.
   *
   * The exact ten lines plan 29-40 DELETED from this generator: a `^---\n([\s\S]*?)\n---\n` fence
   * match anchored at byte 0, a `^([A-Za-z_]+):\s*(.*)$` key line, LAST-WINS assignment into a plain
   * object, and an EMPTY MAP returned for a document it could not read. Reconstructed here and NOWHERE
   * ELSE — called only by the three cases below, imported by nothing, exported to nothing. Named for
   * what it is, exactly as `HISTORICAL_LOOKAHEAD_GRAMMAR` above is, so no reader mistakes it for a
   * live second grammar and no later plan "unifies" it back into the module.
   *
   * It exists so each planted document DISCRIMINATES: without it, a case asserting the correct answer
   * passes on a fix and on a coincidence alike, and this phase has four rounds of assertions that
   * passed for the wrong reason.
   */
  const HISTORICAL_FLAT_KV_GRAMMAR = (text: string): Record<string, string> => {
    const m = text.match(/^---\n([\s\S]*?)\n---\n/);
    const fm: Record<string, string> = {};
    if (!m) return fm;
    for (const line of m[1].split("\n")) {
      const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (kv) fm[kv[1]] = kv[2].trim();
    }
    return fm;
  };

  /** The `Tier` cell of the QE/E2E row (roles table: name | tier | one job | source). */
  const qeTierCell = (m: string): string => {
    const row = readFileSync(join(m, "docs", "reference", "README.md"), "utf8")
      .split("\n")
      .find((l) => l.includes("agent-factory/roles/qe-e2e.md"));
    if (row === undefined) throw new Error("the QE/E2E row is absent from the generated catalog");
    return row.split("|")[2].trim();
  };
  /** The `Cadence` cell of a workflow row (workflows table: # | name | cadence | when | source). */
  const workflowCadenceCell = (m: string, file: string): string => {
    const row = readFileSync(join(m, "docs", "reference", "README.md"), "utf8")
      .split("\n")
      .find((l) => l.includes(`agent-factory/workflows/${file}`));
    if (row === undefined) throw new Error(`the ${file} row is absent from the generated catalog`);
    return row.split("|")[3].trim();
  };

  it("an unreadable frontmatter is its OWN finding, not a missing tier", () => {
    // PRE-CHANGE, MEASURED: the deleted grammar's fence match simply failed on an unterminated block
    // and it returned an EMPTY map, so this generator printed
    //   `qe-e2e.md: role tier must be core|enterprise, found ""`
    // about a file whose frontmatter was never parsed at all. A parse artifact rendered as a field
    // verdict sends the author to the wrong line of the wrong file. That is verbatim the conflation
    // the sibling generator's own conversion deleted, with its reason at generate-role-adapters.ts:259.
    const m = catalogMirror();
    // CONTROL FIRST: the unplanted mirror succeeds, so any movement below is caused by the plant.
    expect(runMirror(m).status).toBe(0);

    const rolePath = join(m, "agent-factory", "roles", "qe-e2e.md");
    // (Plan 40-01, PLAIN-01) NO LIVE ROLE CARRIES A FENCE ANY MORE. This case was measured against the
    // fenced `## Caveman prompt` block the live qe-e2e.md carried under `## One job`; PLAIN-01 deleted
    // it. So the case plants the fenced block it needs into its OWN mirror copy, at the position the
    // live block occupied (directly after the `## One job` paragraph), and the measurement below was
    // re-taken on those bytes: the runaway region still reaches the fence delimiter at line 11. The
    // assertion stays exact — it was re-measured, not loosened.
    const unfenced = readFileSync(rolePath, "utf8").split("\n");
    const oneJob = unfenced.indexOf("## One job");
    expect(oneJob, "the fixture must carry `## One job` to plant after").toBeGreaterThan(-1);
    const fenceBlock = ["## Caveman prompt", "```", "You find the bug.", "```", ""];
    const original = [
      ...unfenced.slice(0, oneJob + 3),
      ...fenceBlock,
      ...unfenced.slice(oneJob + 3),
    ].join("\n");
    writeFileSync(rolePath, original);
    // THE PLANT: splice out the CLOSING `---` delimiter, so the frontmatter region opens and never
    // closes. This is the shape G-29-1 names and the shape the sibling's own case plants.
    const lines = original.split("\n");
    const closingAt = lines.indexOf("---", 1);
    expect(closingAt, "the fixture must really have found a closing delimiter to splice out").toBe(4);
    lines.splice(closingAt, 1);
    const planted = lines.join("\n");
    expect(planted, "the plant must really have been applied").not.toBe(original);
    writeFileSync(rolePath, planted);

    // THE DISCRIMINATION, BEFORE THE CLAIM: the deleted grammar reads this document as carrying NO
    // KEYS AT ALL — an absence, which is a different fact from "cannot be read" and is the whole bug.
    const control = HISTORICAL_FLAT_KV_GRAMMAR(planted);
    expect(
      Object.keys(control),
      "the deleted grammar must answer DIFFERENTLY on this document, or the case cannot fail: it returned an EMPTY map, which the pre-change generator then reported as a missing tier",
    ).toEqual([]);
    expect(control.tier).toBeUndefined();

    // THE SHIPPED PATH. Asserted by EQUALITY on the whole message, never by containment: a
    // containment assertion is satisfied by a refusal that names the wrong fact and happens to
    // include the fragment.
    //
    // WHICH HALF OF THIS CASE IS DERIVED AND WHICH HALF IS DELIBERATELY BRITTLE (round 6, plan 29-46
    // — IN-02). DERIVED: the line number interpolated into the expected message below is read out of
    // the planted bytes rather than typed in, so the message assertion follows the fixture instead of
    // pinning a position the fixture may not have — and it cannot quietly stop naming a position
    // either, because a generator that dropped the number would no longer match this message.
    // DELIBERATELY BRITTLE: the two PREMISE equalities — `closingAt` eight lines above and
    // `fenceLine` immediately below — pin the fixture's own shape BY VALUE, and either reds on any
    // edit to qe-e2e.md that shifts a line.
    //
    // THE BRITTLE HALF IS CORRECT AND IS NOT TO BE LOOSENED. A fixture whose premise has moved is not
    // the fixture this case was measured on: the refusal it reaches was MEASURED (see the paragraph
    // below — it is the fence-line refusal, not the unterminated-block one), and that measurement is a
    // statement about one document at one shape. An edit that shifts those lines is SUPPOSED to red
    // here and be RE-MEASURED, rather than absorbed by a range or a tolerance that would let the case
    // go on asserting a result nobody re-took. An earlier wording of this comment claimed that an
    // unrelated edit could not turn this pin into a nuisance red. That claim was false about the two
    // assertions it sat beside, and the SENTENCE is what was wrong — the assertions were right, and
    // loosening a correct assertion to make a wrong sentence true is the inverted fix this tree
    // refuses.
    //
    // WHICH REFUSAL THIS REACHES WAS MEASURED, NOT ASSUMED, and it is NOT the unterminated-block one.
    // The mirror copy carries the fenced block planted above (no live role does since PLAIN-01), so the
    // runaway region swallows that block's opening fence line and the authority refuses THAT first — a column-0
    // fence line is not a legal node in a top-level block mapping. The sibling's test had to be split
    // in two for exactly this reason (plan 27-45, D-53), and inheriting the trap silently would make
    // this case assert something other than what its name says.
    const fenceLine = planted.split("\n").findIndex((l) => l.startsWith("```")) + 1;
    expect(fenceLine, "the runaway region must really contain a fence delimiter line").toBe(11);
    const r = runMirror(m);
    expect(r.status).toBe(1);
    expect(r.text).toBe(
      `  ERROR    qe-e2e.md: frontmatter is unreadable — the frontmatter block opened at line 1 of ` +
        `the document carries the code-fence delimiter line \`\`\`\`\` at line ${fenceLine}, before ` +
        `any closing \`---\` delimiter — a line beginning with three backticks is not a legal node ` +
        `in a top-level block mapping, so the region carries content this module cannot account ` +
        `for; it is refused as unreadable rather than having those lines DELETED and the shorter ` +
        `remainder reported as a value — never read as "carries no grant"\n`,
    );
    // …and it is NOT the missing-tier sentence, stated as its own literal. This is the assertion that
    // makes the case about the CONFLATION rather than merely about exit 1: the pre-change generator
    // printed exactly this line on exactly these bytes.
    expect(r.text).not.toContain('role tier must be core|enterprise, found ""');
    expect(r.text).not.toContain("role tier must be core|enterprise");
  });

  it("a key declared twice is refused, never silently last-wins", () => {
    // PRE-CHANGE, MEASURED — AND THIS ONE WAS NOT A LATENT TYPE DIFFERENCE, IT PUBLISHED A WRONG ROW
    // AT EXIT 0. The deleted grammar assigned each key into a plain object, so the SECOND `tier:`
    // silently overwrote the first and nothing was said about it. Run on the plant below, the
    // pre-change committed .js exited 0 and wrote
    //   `| QE/E2E | enterprise | Break the feature with tests and report the gaps. | ... |`
    // — a CORE role published in the enterprise group, and then the freshness gate would demand those
    // bytes. The authority retains EVERY occurrence precisely because discarding one is the bypass
    // shape this project refuses, so a count other than exactly one is a refusal that names the count.
    //
    // THAT DIFFERENCE IS WHY THIS BULLET WAS THE NON-MECHANICAL STEP. It is a SEMANTIC change, not a
    // type change: `Map<string, string[]>` makes the duplication visible, and the generator then has
    // to decide what it means. It decides the same thing generate-role-adapters.ts decides for
    // `capabilities:`, because two generators over one kit must not disagree about that.
    const m = catalogMirror();
    expect(runMirror(m).status).toBe(0);
    // The control run publishes the REAL tier, so the wrong-row claim below has a baseline.
    expect(qeTierCell(m)).toBe("core");

    const rolePath = join(m, "agent-factory", "roles", "qe-e2e.md");
    const original = readFileSync(rolePath, "utf8");
    expect(original, "the plant must have a `tier:` line to duplicate").toContain("tier: core");
    const planted = original.replace(/^tier: .*$/m, "tier: core\ntier: enterprise");
    expect(planted, "the plant must really have been applied").not.toBe(original);
    writeFileSync(rolePath, planted);

    // THE DISCRIMINATION, BEFORE THE CLAIM: the deleted grammar answers with ONE value, and it is the
    // LAST one — a perfectly usable `enterprise` that passes the generator's own core|enterprise
    // vocabulary check, so exit 0 and a wrong published row were inevitable rather than unlucky.
    const control = HISTORICAL_FLAT_KV_GRAMMAR(planted);
    expect(
      control.tier,
      "the deleted grammar must answer DIFFERENTLY on this document, or the case cannot fail: last-wins kept the SECOND declaration and discarded the first without a word",
    ).toBe("enterprise");
    expect(
      ["core", "enterprise"].includes(control.tier),
      "…and the discarded-first value it kept is a VALID tier, which is why the pre-change generator exited 0 instead of failing closed",
    ).toBe(true);

    // THE SHIPPED PATH: equality on the whole message, and the count is IN it.
    const r = runMirror(m);
    expect(r.status).toBe(1);
    expect(r.text).toBe(
      "  ERROR    qe-e2e.md: 2 `tier:` keys in one role frontmatter, expected exactly 1 — every " +
        "occurrence is retained rather than last-wins, because silently discarding a declaration " +
        "publishes the wrong tier; delete the extra key\n",
    );
    // The refusal must NOT be the absent-or-invalid-tier finding: last-wins produced a perfectly
    // usable single value, so a message about an out-of-vocabulary tier would mean the duplicate went
    // unnoticed. Mirrors the sibling's `is absent or empty` guard at generate-role-adapters.test.ts.
    expect(r.text).not.toContain("role tier must be core|enterprise");
  });

  it("an empty-valued cadence still reaches UNKNOWN - verify", () => {
    // WHY THIS CASE EXISTS, AND WHY ITS DISCRIMINATION IS SHAPED DIFFERENTLY FROM ITS TWO SIBLINGS.
    //
    // `cadence:` is the ONE key in this generator for which ABSENCE IS LEGAL (D-09): workflows 12
    // (release) and 13 (incident) declare none, and their cell must read `UNKNOWN - verify` rather
    // than a fabricated `both`. So this is the only place the no-fabrication rule is load-bearing in
    // this file, and a conversion that quietly turned a legal absence — or a present-but-empty key —
    // into a refusal would have broken it while every other assertion stayed green.
    //
    // THE TWO GRAMMARS AGREE ON THE CELL HERE, AND THAT AGREEMENT IS THE ASSERTION. Measured against
    // the pre-change committed .js on this exact plant: cell `UNKNOWN - verify`, exit 0 — identical to
    // the shipped path. They reach it by different ROUTES: the deleted grammar produced the STRING
    // `""` and failed a truthiness test; the authority produces a ONE-ELEMENT ARRAY holding `""`,
    // which this generator's multiplicity arms read as "declared once, and empty".
    //
    // SO THIS CASE IS NOT PROVEN ABLE TO FAIL BY A DISAGREEMENT — asserting one would be fabricating
    // it. It is proven able to fail by an ADJACENT PLANT instead: a NON-empty cadence on the same
    // document publishes that value, so `UNKNOWN - verify` is demonstrably not what this generator
    // says for every input. That is the guard against the vacuous version of this case, which would
    // pass against a generator that had hard-coded the cell.
    const m = catalogMirror();
    expect(runMirror(m).status).toBe(0);
    // BASELINE: workflow 09 declares a real cadence, and the control run publishes it.
    expect(workflowCadenceCell(m, "09-daily-sweep.md")).toBe("both");
    // …and the two workflows that declare NO cadence at all already read UNKNOWN - verify, which is
    // the legal-absence half of D-09 surviving the conversion.
    expect(workflowCadenceCell(m, "12-release.md")).toBe("UNKNOWN - verify");
    expect(workflowCadenceCell(m, "13-incident.md")).toBe("UNKNOWN - verify");

    const wfPath = join(m, "agent-factory", "workflows", "09-daily-sweep.md");
    const original = readFileSync(wfPath, "utf8");
    // THE PLANT: the key is PRESENT and its value is EMPTY — not removed. The distinction is the
    // point: absence and emptiness are different documents that must reach the same legal cell.
    const planted = original.replace(/^cadence: .*$/m, "cadence:");
    expect(planted, "the plant must really have been applied").not.toBe(original);
    expect(planted).toContain("\ncadence:\n");
    writeFileSync(wfPath, planted);

    // THE PLANT'S OWN PREMISE, via the historical control: the deleted grammar saw the key as PRESENT
    // with an EMPTY string — `""`, not `undefined`. If this read `undefined` the plant would have
    // deleted the key and the case would be testing legal absence, which the baseline above already
    // covers on two other documents.
    const control = HISTORICAL_FLAT_KV_GRAMMAR(planted);
    expect(
      control.cadence,
      "the plant must be PRESENT-AND-EMPTY rather than absent, or this case duplicates the legal-absence baseline",
    ).toBe("");
    expect(Object.prototype.hasOwnProperty.call(control, "cadence")).toBe(true);

    // THE SHIPPED PATH: exit 0, and the cell by equality against the literal.
    expect(runMirror(m).status).toBe(0);
    expect(workflowCadenceCell(m, "09-daily-sweep.md")).toBe("UNKNOWN - verify");
    // NOT FABRICATED into something usable — stated as its own literals, because "UNKNOWN - verify"
    // being right is only half the contract.
    expect(workflowCadenceCell(m, "09-daily-sweep.md")).not.toBe("both");
    expect(workflowCadenceCell(m, "09-daily-sweep.md")).not.toBe("");

    // ── PROVEN ABLE TO FAIL, by an ADJACENT plant on the same key of the same document. ──────────
    const m2 = catalogMirror();
    expect(runMirror(m2).status).toBe(0);
    const wf2 = join(m2, "agent-factory", "workflows", "09-daily-sweep.md");
    writeFileSync(
      wf2,
      readFileSync(wf2, "utf8").replace(/^cadence: .*$/m, "cadence: scrum-only"),
    );
    expect(runMirror(m2).status).toBe(0);
    expect(
      workflowCadenceCell(m2, "09-daily-sweep.md"),
      "a NON-empty cadence must publish its own value — otherwise the UNKNOWN - verify assertion above would also pass against a generator that hard-coded the cell",
    ).toBe("scrum-only");
  });
});

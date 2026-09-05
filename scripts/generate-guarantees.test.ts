// generate-guarantees.test.ts — the harness for D-17's generated guarantees render (AUTO-05,
// AUTO-02). The byte-equality freshness gate's cases join this file when that gate lands.
//
// THE ONE PROPERTY THIS FILE EXISTS TO BUY. `docs/GUARANTEES.md` is a PUBLIC document whose entire
// job is to state which safety claims still hold. Its failure mode is silent and asymmetric: a
// render that is SHORT — three of six safety rows — publishes a shorter list of dependencies than
// the registry declares, and the rows most likely to go missing are the ones a lowered floor
// touches. A render that is too long only costs a reader some reading. So every case below is
// written against under-inclusion: the empty-join refusal, the SHORT-join refusal against an
// independently counted denominator, and the byte-equality check of the committed document against
// a fresh render.
//
// THE PROJECT LESSON THIS FILE APPLIES, verbatim from the recorded round: "a vacuity floor catches
// an EMPTY denominator but never a SILENTLY SHORT one — derive the ELEMENT count independently of
// the loop that consumes it." `generate-safety-surface.ts` refuses only an empty union. This render
// refuses both, and the denominator comes from a raw line pass over the registry BYTES that shares
// no loop, no parser and no intermediate with the join.
//
// Fixture cases drive `renderGuarantees(root)` against a hermetic mirror under the OS temp dir.
//
// NOT in the e2e lane. Run with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/generate-guarantees.test.ts
// Vitest globals:false -> import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { REGISTRY_PATH, SAFETY_FLOORS } from "./audit-model.js";
import { CHECKPOINT_DEFAULTS, floorEnvVarName } from "./checkpoints.js";
import {
  OUT,
  declaredSafetyRows,
  guaranteesJoin,
  renderGuarantees,
} from "./generate-guarantees.js";

const ROOT = join(import.meta.dirname, "..");
const GENERATOR_TS = join(ROOT, "scripts", "generate-guarantees.ts");
const COMMITTED = join(ROOT, OUT);

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// ── The registry fixture ────────────────────────────────────────────────────────────────────────
// Mirrors the shape scripts/generate-safety-surface.test.ts uses: the fields readRegistry() demands
// and nothing else, so a case can vary exactly one thing.

interface ClaimSpec {
  id: string;
  file: string;
  kind: string;
  dependsOn: string;
}

function renderRegistry(claims: readonly ClaimSpec[], trailer = ""): string {
  const blocks = claims.map((c) =>
    [
      `### ${c.id}`,
      "",
      `- file: ${c.file}`,
      "- line: 4",
      `- kind: ${c.kind}`,
      `- depends_on: ${c.dependsOn}`,
      "- status: true",
      "- mechanism: measured against the live config value.",
      "",
      "```",
      "A sentence.",
      "```",
      "",
    ].join("\n"),
  );
  return ["# Registry", "", ...blocks, trailer].join("\n");
}

/** A mirror root carrying only the registry. No config file → the roster defaults (AUTO-07). */
function mirrorWith(registry: string, config?: string): string {
  const root = freshTmp("grugops-guarantees-");
  mkdirSync(join(root, "docs", "audit"), { recursive: true });
  writeFileSync(join(root, REGISTRY_PATH), registry, "utf8");
  if (config !== undefined) {
    mkdirSync(join(root, "agent-factory", "config"), { recursive: true });
    writeFileSync(
      join(root, "agent-factory", "config", "factory.config.json"),
      config,
      "utf8",
    );
  }
  return root;
}

const SIX_SAFETY: ClaimSpec[] = [
  { id: "C-28-001", file: "README.md", kind: "safety", dependsOn: "open_pr" },
  { id: "C-28-010", file: "AGENTS.md", kind: "safety", dependsOn: "open_pr" },
  {
    id: "C-28-018",
    file: "AGENTS.md",
    kind: "safety",
    dependsOn: "test_integrity",
  },
  {
    id: "C-28-023",
    file: "agent-factory/README.md",
    kind: "safety",
    dependsOn: "protected_branch_merge",
  },
  {
    id: "C-28-032",
    file: "agent-factory/README.md",
    kind: "safety",
    dependsOn: "open_pr, protected_branch_merge",
  },
  {
    id: "C-28-038",
    file: ".claude-plugin/plugin.json",
    kind: "safety",
    dependsOn: "production_requires_human_confirmation",
  },
  {
    id: "C-28-015",
    file: "AGENTS.md",
    kind: "architecture",
    dependsOn: "—",
  },
];

// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("generate-guarantees — the count-asserted join (D-17)", () => {
  it("the LIVE tree's join length equals the independently counted safety-kind registry rows", () => {
    const declared = declaredSafetyRows(ROOT);
    // FLOOR FIRST. A denominator of zero would make the equality below hold vacuously, which is the
    // exact shape the short-join refusal exists to notice one layer down.
    expect(declared).toBeGreaterThan(0);
    expect(guaranteesJoin(ROOT).length).toBe(declared);
  });

  it("REFUSES a registry whose bytes declare more safety rows than the join produced (SHORT)", () => {
    // The short-registry fixture. The document's BYTES declare a seventh safety row in a place the
    // claim parser does not reach, so the two views of one document disagree — and a render that
    // published six of seven would be exactly the silently-partial document Pitfall 6 names.
    const root = mirrorWith(
      renderRegistry(SIX_SAFETY, ["## Notes", "", "- kind: safety", ""].join("\n")),
    );
    expect(declaredSafetyRows(root)).toBe(7);
    expect(guaranteesJoin(root).length).toBe(6);
    expect(() => renderGuarantees(root)).toThrow(
      /produced 6 safety row\(s\).*declares 7 in its bytes/s,
    );
    expect(() => renderGuarantees(root)).toThrow(/generate-guarantees/);
  });

  it("REFUSES a registry with ZERO safety rows (EMPTY) with a DIFFERENT named error", () => {
    const root = mirrorWith(
      renderRegistry([{ id: "C-28-015", file: "AGENTS.md", kind: "architecture", dependsOn: "—" }]),
    );
    expect(declaredSafetyRows(root)).toBe(0);
    expect(() => renderGuarantees(root)).toThrow(/no `kind: safety` row/);
    // The two refusals are DISTINCT — an empty join and a short one are different facts and a
    // reader must not be sent to the same remedy for both.
    expect(() => renderGuarantees(root)).not.toThrow(/declares 7/);
  });

  it("two rows depending on the SAME checkpoint are BOTH emitted; neither suppresses the other", () => {
    const root = mirrorWith(renderRegistry(SIX_SAFETY));
    const join = guaranteesJoin(root);
    const onOpenPr = join.filter((r) => r.floors.some((f) => f.id === "open_pr"));
    expect(onOpenPr.map((r) => r.claimId)).toEqual(["C-28-001", "C-28-010", "C-28-032"]);
  });

  it("rows are emitted in ASCENDING claim-id order, and two runs are byte-identical", () => {
    const root = mirrorWith(renderRegistry([...SIX_SAFETY].reverse()));
    const ids = guaranteesJoin(root).map((r) => r.claimId);
    expect(ids).toEqual([...ids].sort());
    expect(renderGuarantees(root)).toBe(renderGuarantees(root));
  });

  it("an ALL-DEFAULT matrix renders the all-default statement and no lowering", () => {
    const root = mirrorWith(
      renderRegistry(SIX_SAFETY),
      JSON.stringify({ checkpoints: { ...CHECKPOINT_DEFAULTS } }),
    );
    const text = renderGuarantees(root);
    expect(text).toContain("all checkpoints at default");
    expect(text).not.toContain("LOWERED");
  });

  it("a LOWERED checkpoint renders its id, its value AND its authorizing name", () => {
    const root = mirrorWith(
      renderRegistry(SIX_SAFETY),
      JSON.stringify({
        checkpoints: { ...CHECKPOINT_DEFAULTS, open_pr: "off" },
      }),
    );
    const text = renderGuarantees(root);
    expect(text).toContain("open_pr");
    expect(text).toContain("`off`");
    // The AUTHORIZING NAME. Prohibition 2: a lowered floor must never be discoverable only by
    // reading configuration — the render names the grant, so a reader who opens neither the config
    // nor the code still learns which guarantee stopped holding and who was named for it.
    expect(text).toContain(floorEnvVarName("open_pr"));
    expect(text).toContain("LOWERED");
    expect(text).not.toContain("all checkpoints at default");
    // …and the claims that rest on it are marked, not merely listed.
    expect(text).toMatch(/C-28-001.*LOWERED/);
  });
});

describe("generate-guarantees — the module's own shape", () => {
  it("OUT is a STRING LITERAL and is assembled from no runtime input", () => {
    const src = readFileSync(GENERATOR_TS, "utf8");
    expect(src).toContain('export const OUT = "docs/GUARANTEES.md";');
    // The path-traversal mitigation carried from generate-safety-surface.ts: never argv, never env,
    // never file content.
    const outDecl = src.slice(src.indexOf("export const OUT"), src.indexOf("export const OUT") + 60);
    expect(outDecl).not.toMatch(/argv|process\.env|readFileSync|\$\{/);
  });

  it("the entry guard compares against pathToFileURL, never a hand-built file:// string", () => {
    const src = readFileSync(GENERATOR_TS, "utf8");
    expect(src).toContain("pathToFileURL(process.argv[1]).href");
    expect(src).not.toContain("`file://${");
  });

  it("the join length assertion does not share a loop with the join", () => {
    // The denominator is produced by a pass that reads the registry's BYTES and never calls the
    // registry parser. Asserted on the source, because the property is "these are two passes",
    // which no single run can report.
    const src = readFileSync(GENERATOR_TS, "utf8");
    const fn = src.slice(
      src.indexOf("export function declaredSafetyRows"),
      src.indexOf("export function guaranteesJoin"),
    );
    expect(fn.length).toBeGreaterThan(0);
    expect(fn).not.toContain("readRegistry");
    expect(fn).not.toContain("guaranteesJoin");
  });

  it("the RESIDUAL section names the vector, the narrowing measure and the session scope", () => {
    const text = renderGuarantees(ROOT);
    // Pitfall 1: the artifact whose job is to stop overstated claims must not open with one.
    expect(text).toContain(".claude/settings.json");
    expect(text).toContain("permissions.deny");
    expect(text).toContain("session");
    // The tier is stated, not an unqualified impossibility.
    expect(text).toContain("un-forgeable from inside a tool call");
    expect(text).not.toMatch(/an agent cannot set(?!.{0,400}settings)/s);
  });

  it("the committed render is byte-identical to a fresh render of the live tree", () => {
    expect(readFileSync(COMMITTED, "utf8")).toBe(renderGuarantees(ROOT));
  });

  it("every floor named by the join is a SAFETY_FLOORS member", () => {
    const ids = new Set(SAFETY_FLOORS.map((f) => f.id));
    for (const row of guaranteesJoin(ROOT)) {
      for (const f of row.floors) expect(ids.has(f.id)).toBe(true);
    }
  });
});
